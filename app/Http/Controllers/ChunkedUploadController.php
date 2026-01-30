<?php

namespace App\Http\Controllers;

use App\Http\Requests\InitiateUploadRequest;
use App\Http\Requests\UploadChunkRequest;
use App\Jobs\AssembleChunksJob;
use App\Models\UploadSession;
use App\Services\FileSecurityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChunkedUploadController extends Controller
{
    public function __construct(
        protected FileSecurityService $securityService
    ) {}

    /**
     * Initialize a new chunked upload session
     * POST /api/uploads/initiate
     */
    public function initiate(InitiateUploadRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Validate filename and size before creating session
        $errors = $this->securityService->validateFilenameForUpload(
            $validated['filename'],
            $validated['file_size']
        );

        if (!empty($errors)) {
            return response()->json([
                'message' => 'File validation failed',
                'errors' => $errors,
            ], 422);
        }

        // Check for existing active sessions for this user (limit to 5)
        $activeSessionCount = UploadSession::forUser($request->user()->id)
            ->active()
            ->count();

        if ($activeSessionCount >= 5) {
            return response()->json([
                'message' => 'Too many active upload sessions. Please complete or cancel existing uploads.',
            ], 429);
        }

        $chunkSize = config('upload.chunk_size', 5 * 1024 * 1024); // 5MB default
        $totalChunks = (int) ceil($validated['file_size'] / $chunkSize);

        $session = UploadSession::create([
            'user_id' => $request->user()->id,
            'folder_id' => $validated['folder_id'] ?? null,
            'original_filename' => $validated['filename'],
            'total_size' => $validated['file_size'],
            'total_chunks' => $totalChunks,
            'chunk_size' => $chunkSize,
            'uploaded_chunks' => [],
            'temp_path' => 'chunks/' . Str::uuid(),
            'status' => 'pending',
            'expires_at' => now()->addHours(config('upload.session_expiry_hours', 24)),
        ]);

        return response()->json([
            'session_id' => $session->id,
            'chunk_size' => $chunkSize,
            'total_chunks' => $totalChunks,
            'expires_at' => $session->expires_at->toIso8601String(),
        ]);
    }

    /**
     * Upload a single chunk
     * POST /api/uploads/{session}/chunk
     */
    public function uploadChunk(UploadChunkRequest $request, UploadSession $session): JsonResponse
    {
        // Verify ownership
        if ($session->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        // Check session status
        if (!in_array($session->status, ['pending', 'uploading'])) {
            return response()->json([
                'message' => 'Upload session is not accepting chunks',
                'status' => $session->status,
            ], 400);
        }

        // Check if session expired
        if ($session->expires_at->isPast()) {
            return response()->json([
                'message' => 'Upload session has expired',
            ], 410);
        }

        $chunkIndex = $request->input('chunk_index');
        $chunk = $request->file('chunk');

        // Validate chunk index
        if ($chunkIndex < 0 || $chunkIndex >= $session->total_chunks) {
            return response()->json([
                'message' => 'Invalid chunk index',
            ], 400);
        }

        // Validate chunk size (last chunk may be smaller)
        $expectedSize = $session->chunk_size;
        $isLastChunk = $chunkIndex === $session->total_chunks - 1;
        if ($isLastChunk) {
            $expectedSize = $session->total_size - ($session->chunk_size * $chunkIndex);
        }

        if ($chunk->getSize() > $expectedSize + 1024) { // Allow 1KB tolerance
            return response()->json([
                'message' => 'Chunk size exceeds expected size',
            ], 400);
        }

        // Store chunk
        $chunkPath = "{$session->temp_path}/chunk_{$chunkIndex}";
        Storage::disk('local')->put($chunkPath, $chunk->get());

        // Update session
        $uploadedChunks = $session->uploaded_chunks ?? [];
        if (!in_array($chunkIndex, $uploadedChunks)) {
            $uploadedChunks[] = $chunkIndex;
            sort($uploadedChunks);
        }

        $session->update([
            'uploaded_chunks' => $uploadedChunks,
            'status' => 'uploading',
        ]);

        $response = [
            'chunk_index' => $chunkIndex,
            'uploaded_chunks' => count($uploadedChunks),
            'total_chunks' => $session->total_chunks,
            'progress' => $session->getProgress(),
            'status' => $session->status,
        ];

        // Check if all chunks uploaded
        if ($session->isComplete()) {
            $session->update(['status' => 'assembling']);
            AssembleChunksJob::dispatch($session);
            $response['status'] = 'assembling';
            $response['message'] = 'All chunks uploaded, assembly started';
        }

        return response()->json($response);
    }

    /**
     * Get upload session status (for resumption)
     * GET /api/uploads/{session}/status
     */
    public function status(Request $request, UploadSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $response = [
            'session_id' => $session->id,
            'filename' => $session->original_filename,
            'status' => $session->status,
            'uploaded_chunks' => $session->uploaded_chunks,
            'total_chunks' => $session->total_chunks,
            'progress' => $session->getProgress(),
            'missing_chunks' => $session->getMissingChunks(),
            'expires_at' => $session->expires_at->toIso8601String(),
            'is_expired' => $session->expires_at->isPast(),
        ];

        if ($session->status === 'failed') {
            $response['error_message'] = $session->error_message;
        }

        return response()->json($response);
    }

    /**
     * Cancel an upload session
     * DELETE /api/uploads/{session}
     */
    public function cancel(Request $request, UploadSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        // Can only cancel pending/uploading sessions
        if (!in_array($session->status, ['pending', 'uploading'])) {
            return response()->json([
                'message' => 'Cannot cancel session in current status',
                'status' => $session->status,
            ], 400);
        }

        // Clean up chunks
        Storage::disk('local')->deleteDirectory($session->temp_path);

        $session->markAsCancelled();

        return response()->json([
            'message' => 'Upload cancelled',
            'session_id' => $session->id,
        ]);
    }

    /**
     * List active upload sessions for current user
     * GET /api/uploads
     */
    public function index(Request $request): JsonResponse
    {
        $sessions = UploadSession::forUser($request->user()->id)
            ->active()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($session) {
                return [
                    'session_id' => $session->id,
                    'filename' => $session->original_filename,
                    'status' => $session->status,
                    'progress' => $session->getProgress(),
                    'total_size' => $session->total_size,
                    'uploaded_chunks' => $session->getUploadedChunksCount(),
                    'total_chunks' => $session->total_chunks,
                    'expires_at' => $session->expires_at->toIso8601String(),
                    'created_at' => $session->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'sessions' => $sessions,
        ]);
    }
}

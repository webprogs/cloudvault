<?php

namespace App\Http\Controllers;

use App\Http\Requests\FileUploadRequest;
use App\Models\File;
use App\Models\Folder;
use App\Services\FileSecurityService;
use App\Services\ThumbnailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileController extends Controller
{
    public function __construct(
        protected FileSecurityService $securityService,
        protected ThumbnailService $thumbnailService
    ) {}

    public function index(Request $request): Response
    {
        $folderId = $request->get('folder_id');
        $search = $request->get('search');
        $type = $request->get('type');
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $user = $request->user();

        // Get current folder if specified
        $currentFolder = null;
        $breadcrumbs = [];

        if ($folderId) {
            $currentFolder = Folder::where('user_id', $user->id)->findOrFail($folderId);
            $breadcrumbs = $currentFolder->path;
        }

        // Get folders in current directory
        $folders = Folder::where('user_id', $user->id)
            ->where('parent_id', $folderId)
            ->orderBy('name')
            ->get();

        // Get files with search and filters
        $filesQuery = File::where('user_id', $user->id)
            ->where('folder_id', $folderId)
            ->search($search)
            ->filterByType($type);

        // Apply sorting
        $validSortColumns = ['name', 'size', 'created_at', 'extension'];
        if (in_array($sortBy, $validSortColumns)) {
            $filesQuery->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        $files = $filesQuery->paginate(50)->withQueryString();

        // Get storage stats
        $totalSize = File::where('user_id', $user->id)->sum('size');
        $fileCount = File::where('user_id', $user->id)->count();

        return Inertia::render('Files/Index', [
            'files' => $files,
            'folders' => $folders,
            'currentFolder' => $currentFolder,
            'breadcrumbs' => $breadcrumbs,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
            'stats' => [
                'total_size' => $this->formatBytes($totalSize),
                'file_count' => $fileCount,
            ],
        ]);
    }

    public function upload(FileUploadRequest $request)
    {
        $user = $request->user();
        $folderId = $request->input('folder_id');
        $uploadedFiles = [];
        $errors = [];
        $useGcp = config('upload.use_gcp', false);

        foreach ($request->file('files') as $file) {
            // Security validation
            $securityErrors = $this->securityService->validateFile($file);
            if (!empty($securityErrors)) {
                $errors[$file->getClientOriginalName()] = $securityErrors;
                continue;
            }

            try {
                if ($useGcp) {
                    $fileRecord = $this->uploadToGcp($file, $user, $folderId);
                } else {
                    $fileRecord = $this->uploadToLocal($file, $user, $folderId);
                }
                $uploadedFiles[] = $fileRecord;
            } catch (\Throwable $e) {
                report($e);
                $errors[$file->getClientOriginalName()] = ['Upload failed: ' . $e->getMessage()];
            }
        }

        if (!empty($errors)) {
            return back()->with('error', 'Some files could not be uploaded.')
                ->with('upload_errors', $errors);
        }

        $count = count($uploadedFiles);
        return back()->with('success', "{$count} file(s) uploaded successfully.");
    }

    protected function uploadToGcp($file, $user, $folderId): File
    {
        $date = now();
        $extension = strtolower($file->getClientOriginalExtension());
        $gcpPath = sprintf(
            'files/%s/%s/%s.%s',
            $date->format('Y'),
            $date->format('m'),
            Str::random(40),
            $extension
        );

        // Stream upload directly to GCP
        $stream = fopen($file->getRealPath(), 'r');
        Storage::disk('gcs')->writeStream($gcpPath, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        // Create database record
        $fileRecord = File::create([
            'user_id' => $user->id,
            'folder_id' => $folderId,
            'name' => $this->securityService->sanitizeFilename($file->getClientOriginalName()),
            'storage_path' => null,
            'gcp_path' => $gcpPath,
            'storage_disk' => File::DISK_GCS,
            'processing_status' => File::PROCESSING_COMPLETED,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'extension' => $extension,
        ]);

        // Generate and upload thumbnail for images
        if ($this->thumbnailService->isImageFile($file->getMimeType())) {
            $thumbnailGcpPath = $this->uploadThumbnailToGcp($file, $gcpPath);
            if ($thumbnailGcpPath) {
                $fileRecord->update(['thumbnail_path' => $thumbnailGcpPath]);
            }
        }

        return $fileRecord;
    }

    protected function uploadThumbnailToGcp($file, string $originalGcpPath): ?string
    {
        try {
            $thumbnailGcpPath = str_replace('files/', 'thumbnails/', $originalGcpPath);
            $thumbnailGcpPath = preg_replace('/\.[^.]+$/', '.jpg', $thumbnailGcpPath);

            $thumbnailData = $this->thumbnailService->generateThumbnailFromPath($file->getRealPath());
            if ($thumbnailData) {
                Storage::disk('gcs')->put($thumbnailGcpPath, $thumbnailData);
                return $thumbnailGcpPath;
            }
        } catch (\Throwable $e) {
            report($e);
        }
        return null;
    }

    protected function uploadToLocal($file, $user, $folderId): File
    {
        $storagePath = $this->securityService->generateStoragePath($file);

        $file->storeAs(
            dirname($storagePath),
            basename($storagePath)
        );

        $fileRecord = File::create([
            'user_id' => $user->id,
            'folder_id' => $folderId,
            'name' => $this->securityService->sanitizeFilename($file->getClientOriginalName()),
            'storage_path' => $storagePath,
            'storage_disk' => File::DISK_LOCAL,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'extension' => strtolower($file->getClientOriginalExtension()),
        ]);

        // Generate thumbnail for images
        if ($this->thumbnailService->isImageFile($file->getMimeType())) {
            $thumbnailPath = $this->thumbnailService->getThumbnailPath($storagePath);
            $thumbnailPath = preg_replace('/\.[^.]+$/', '.jpg', $thumbnailPath);
            $this->thumbnailService->generateThumbnail($storagePath, $thumbnailPath);
            $fileRecord->update(['thumbnail_path' => $thumbnailPath]);
        }

        return $fileRecord;
    }

    public function download(File $file): StreamedResponse|RedirectResponse
    {
        // Check ownership
        if ($file->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // If file is on GCP, stream from GCP with download headers
        if ($file->isOnGcp()) {
            return response()->streamDownload(function () use ($file) {
                $stream = Storage::disk('gcs')->readStream($file->gcp_path);
                fpassthru($stream);
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }, $file->name, [
                'Content-Type' => $file->mime_type,
                'Content-Length' => $file->size,
            ]);
        }

        // Local file download
        if (!$file->storage_path || !Storage::disk('local')->exists($file->storage_path)) {
            abort(404, 'File not found');
        }

        return Storage::disk('local')->download($file->storage_path, $file->name);
    }

    public function processingStatus(File $file): JsonResponse
    {
        // Check ownership
        if ($file->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        return response()->json([
            'id' => $file->id,
            'name' => $file->name,
            'processing_status' => $file->processing_status,
            'storage_disk' => $file->storage_disk,
            'is_on_gcp' => $file->isOnGcp(),
            'logs' => $file->processingLogs()
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($log) => [
                    'step' => $log->step,
                    'status' => $log->status,
                    'message' => $log->message,
                    'started_at' => $log->started_at?->toIso8601String(),
                    'completed_at' => $log->completed_at?->toIso8601String(),
                ]),
        ]);
    }

    public function thumbnail(File $file)
    {
        // Check ownership
        if ($file->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $thumbnailPath = $file->thumbnail_path;

        // If file is on GCP
        if ($file->isOnGcp()) {
            if ($thumbnailPath) {
                try {
                    $url = Storage::disk('gcs')->temporaryUrl($thumbnailPath, now()->addHour());
                    return redirect($url);
                } catch (\Throwable $e) {
                    // Fall through to serve original
                }
            }
            // Redirect to original on GCP if no thumbnail
            try {
                $url = Storage::disk('gcs')->temporaryUrl($file->gcp_path, now()->addHour());
                return redirect($url);
            } catch (\Throwable $e) {
                abort(404, 'File not found');
            }
        }

        // Local file handling
        if (!$thumbnailPath) {
            $thumbnailPath = $this->thumbnailService->getExistingThumbnailPath($file->storage_path);
        }

        if ($thumbnailPath && Storage::disk('local')->exists($thumbnailPath)) {
            return response()->file(Storage::disk('local')->path($thumbnailPath), [
                'Content-Type' => 'image/jpeg',
                'Cache-Control' => 'public, max-age=31536000',
            ]);
        }

        // Generate thumbnail on-the-fly if it doesn't exist
        if ($this->thumbnailService->isImageFile($file->mime_type) && $file->storage_path) {
            $newThumbnailPath = $this->thumbnailService->getThumbnailPath($file->storage_path);
            $newThumbnailPath = preg_replace('/\.[^.]+$/', '.jpg', $newThumbnailPath);

            if ($this->thumbnailService->generateThumbnail($file->storage_path, $newThumbnailPath)) {
                $file->update(['thumbnail_path' => $newThumbnailPath]);

                return response()->file(Storage::disk('local')->path($newThumbnailPath), [
                    'Content-Type' => 'image/jpeg',
                    'Cache-Control' => 'public, max-age=31536000',
                ]);
            }
        }

        // Fallback: serve original file
        if ($file->storage_path && Storage::disk('local')->exists($file->storage_path)) {
            return response()->file(Storage::disk('local')->path($file->storage_path), [
                'Content-Type' => $file->mime_type,
            ]);
        }

        abort(404, 'File not found');
    }

    public function destroy(File $file)
    {
        // Check ownership
        if ($file->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Delete from GCP if stored there
        if ($file->isOnGcp()) {
            try {
                Storage::disk('gcs')->delete($file->gcp_path);
                // Delete GCP thumbnail if exists
                if ($file->thumbnail_path && str_starts_with($file->thumbnail_path, 'thumbnails/')) {
                    Storage::disk('gcs')->delete($file->thumbnail_path);
                }
            } catch (\Throwable $e) {
                // Log but continue - file may already be deleted
            }
        }

        // Delete from local storage
        if ($file->storage_path && Storage::disk('local')->exists($file->storage_path)) {
            Storage::disk('local')->delete($file->storage_path);
            $this->thumbnailService->deleteThumbnail($file->storage_path);
        }

        // Delete local thumbnail if exists
        if ($file->thumbnail_path && Storage::disk('local')->exists($file->thumbnail_path)) {
            Storage::disk('local')->delete($file->thumbnail_path);
        }

        // Delete database record
        $file->delete();

        return back()->with('success', 'File deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'file_ids' => ['required', 'array'],
            'file_ids.*' => ['exists:files,id'],
        ]);

        $files = File::whereIn('id', $validated['file_ids'])
            ->where('user_id', auth()->id())
            ->get();

        foreach ($files as $file) {
            // Delete from GCP if stored there
            if ($file->isOnGcp()) {
                try {
                    Storage::disk('gcs')->delete($file->gcp_path);
                    if ($file->thumbnail_path && str_starts_with($file->thumbnail_path, 'thumbnails/')) {
                        Storage::disk('gcs')->delete($file->thumbnail_path);
                    }
                } catch (\Throwable $e) {
                    // Log but continue - file may already be deleted
                }
            }

            // Delete from local storage
            if ($file->storage_path && Storage::disk('local')->exists($file->storage_path)) {
                Storage::disk('local')->delete($file->storage_path);
                $this->thumbnailService->deleteThumbnail($file->storage_path);
            }

            // Delete local thumbnail if exists
            if ($file->thumbnail_path && Storage::disk('local')->exists($file->thumbnail_path)) {
                Storage::disk('local')->delete($file->thumbnail_path);
            }

            $file->delete();
        }

        $count = count($files);
        return back()->with('success', "{$count} file(s) deleted successfully.");
    }

    public function rename(Request $request, File $file)
    {
        // Check ownership
        if ($file->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $file->update([
            'name' => $this->securityService->sanitizeFilename($validated['name']),
        ]);

        return back()->with('success', 'File renamed successfully.');
    }

    public function move(Request $request, File $file)
    {
        // Check ownership
        if ($file->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'folder_id' => ['nullable', 'exists:folders,id'],
        ]);

        // Verify folder ownership if specified
        if ($validated['folder_id']) {
            $folder = Folder::where('user_id', auth()->id())->findOrFail($validated['folder_id']);
        }

        $file->update([
            'folder_id' => $validated['folder_id'],
        ]);

        return back()->with('success', 'File moved successfully.');
    }

    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\FileShare;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class FileShareController extends Controller
{
    /**
     * List all shares for the authenticated user.
     */
    public function index(Request $request)
    {
        $shares = FileShare::with('file')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return Inertia::render('Shares/Index', [
            'shares' => $shares,
        ]);
    }

    /**
     * Create a new share link for a file.
     */
    public function store(Request $request, File $file)
    {
        if ($file->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'share_type' => 'required|in:public,password',
            'password' => 'required_if:share_type,password|nullable|string|min:4',
            'expires_at' => 'nullable|date|after:now',
            'max_downloads' => 'nullable|integer|min:1',
        ]);

        $share = FileShare::create([
            'file_id' => $file->id,
            'user_id' => $request->user()->id,
            'token' => FileShare::generateToken(),
            'share_type' => $validated['share_type'],
            'password' => $validated['password'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
            'max_downloads' => $validated['max_downloads'] ?? null,
        ]);

        return response()->json([
            'share' => $share->fresh(),
            'message' => 'Share link created successfully',
        ]);
    }

    /**
     * Get existing share info for a file.
     */
    public function show(Request $request, File $file)
    {
        if ($file->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $share = $file->activeShare();

        return response()->json([
            'share' => $share,
        ]);
    }

    /**
     * Update share settings.
     */
    public function update(Request $request, FileShare $share)
    {
        if ($share->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'share_type' => 'sometimes|in:public,password',
            'password' => 'required_if:share_type,password|nullable|string|min:4',
            'expires_at' => 'nullable|date|after:now',
            'max_downloads' => 'nullable|integer|min:1',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['share_type']) && $validated['share_type'] === 'public') {
            $validated['password'] = null;
        }

        $share->update($validated);

        return response()->json([
            'share' => $share->fresh(),
            'message' => 'Share updated successfully',
        ]);
    }

    /**
     * Revoke a share link.
     */
    public function destroy(Request $request, FileShare $share)
    {
        if ($share->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $share->delete();

        return response()->json([
            'message' => 'Share link revoked successfully',
        ]);
    }

    /**
     * Public: Show the download page or password form.
     */
    public function access(string $token)
    {
        $share = FileShare::with('file')->where('token', $token)->first();

        if (!$share) {
            return Inertia::render('Share/Expired', [
                'reason' => 'not_found',
                'message' => 'This share link does not exist.',
            ]);
        }

        if (!$share->isAccessible()) {
            $reason = 'expired';
            $message = 'This share link has expired.';

            if (!$share->is_active) {
                $reason = 'revoked';
                $message = 'This share link has been revoked.';
            } elseif ($share->is_download_limit_reached) {
                $reason = 'limit_reached';
                $message = 'This share link has reached its download limit.';
            }

            return Inertia::render('Share/Expired', [
                'reason' => $reason,
                'message' => $message,
            ]);
        }

        if ($share->share_type === 'password') {
            return Inertia::render('Share/PasswordPrompt', [
                'token' => $token,
                'fileName' => $share->file->name,
            ]);
        }

        return Inertia::render('Share/Download', [
            'token' => $token,
            'file' => [
                'name' => $share->file->name,
                'formatted_size' => $share->file->formatted_size,
                'icon_type' => $share->file->icon_type,
                'extension' => $share->file->extension,
            ],
        ]);
    }

    /**
     * Verify password for a password-protected share.
     */
    public function verifyPassword(Request $request, string $token)
    {
        $share = FileShare::with('file')->where('token', $token)->first();

        if (!$share || !$share->isAccessible()) {
            return response()->json(['message' => 'Invalid or expired share link'], 404);
        }

        $request->validate([
            'password' => 'required|string',
        ]);

        if (!$share->verifyPassword($request->password)) {
            return response()->json(['message' => 'Incorrect password'], 401);
        }

        return response()->json([
            'valid' => true,
            'file' => [
                'name' => $share->file->name,
                'formatted_size' => $share->file->formatted_size,
                'icon_type' => $share->file->icon_type,
                'extension' => $share->file->extension,
            ],
        ]);
    }

    /**
     * Stream file download for a share.
     */
    public function download(Request $request, string $token)
    {
        $share = FileShare::with('file')->where('token', $token)->first();

        if (!$share || !$share->isAccessible()) {
            abort(404, 'Share link not found or expired');
        }

        // For password-protected shares, verify password via header or session
        if ($share->share_type === 'password') {
            $password = $request->header('X-Share-Password') ?? $request->query('password');
            if (!$password || !$share->verifyPassword($password)) {
                abort(401, 'Password required');
            }
        }

        $share->incrementAccessCount();

        $file = $share->file;

        // If file is on GCP, stream from GCP
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
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\FileUploadRequest;
use App\Models\File;
use App\Models\Folder;
use App\Services\FileSecurityService;
use App\Services\ThumbnailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
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

        foreach ($request->file('files') as $file) {
            // Security validation
            $securityErrors = $this->securityService->validateFile($file);
            if (!empty($securityErrors)) {
                $errors[$file->getClientOriginalName()] = $securityErrors;
                continue;
            }

            // Generate storage path
            $storagePath = $this->securityService->generateStoragePath($file);

            // Store file
            $file->storeAs(
                dirname($storagePath),
                basename($storagePath)
            );

            // Create database record
            $fileRecord = File::create([
                'user_id' => $user->id,
                'folder_id' => $folderId,
                'name' => $this->securityService->sanitizeFilename($file->getClientOriginalName()),
                'storage_path' => $storagePath,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'extension' => strtolower($file->getClientOriginalExtension()),
            ]);

            // Generate thumbnail for images
            if ($this->thumbnailService->isImageFile($file->getMimeType())) {
                $thumbnailPath = $this->thumbnailService->getThumbnailPath($storagePath);
                // Use .jpg extension for thumbnails
                $thumbnailPath = preg_replace('/\.[^.]+$/', '.jpg', $thumbnailPath);
                $this->thumbnailService->generateThumbnail($storagePath, $thumbnailPath);

                // Store thumbnail path in the file record
                $fileRecord->update(['thumbnail_path' => $thumbnailPath]);
            }

            $uploadedFiles[] = $fileRecord;
        }

        if (!empty($errors)) {
            return back()->with('error', 'Some files could not be uploaded due to security restrictions.')
                ->with('upload_errors', $errors);
        }

        $count = count($uploadedFiles);
        return back()->with('success', "{$count} file(s) uploaded successfully.");
    }

    public function download(File $file): StreamedResponse
    {
        // Check ownership
        if ($file->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        if (!Storage::exists($file->storage_path)) {
            abort(404, 'File not found');
        }

        return Storage::download($file->storage_path, $file->name);
    }

    public function thumbnail(File $file)
    {
        // Check ownership
        if ($file->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Try to get thumbnail path
        $thumbnailPath = $file->thumbnail_path;

        // If no stored thumbnail path, try to compute it
        if (!$thumbnailPath) {
            $thumbnailPath = $this->thumbnailService->getExistingThumbnailPath($file->storage_path);
        }

        // If thumbnail exists, serve it
        if ($thumbnailPath && Storage::exists($thumbnailPath)) {
            return response()->file(Storage::path($thumbnailPath), [
                'Content-Type' => 'image/jpeg',
                'Cache-Control' => 'public, max-age=31536000',
            ]);
        }

        // Generate thumbnail on-the-fly if it doesn't exist
        if ($this->thumbnailService->isImageFile($file->mime_type)) {
            $newThumbnailPath = $this->thumbnailService->getThumbnailPath($file->storage_path);
            $newThumbnailPath = preg_replace('/\.[^.]+$/', '.jpg', $newThumbnailPath);

            if ($this->thumbnailService->generateThumbnail($file->storage_path, $newThumbnailPath)) {
                $file->update(['thumbnail_path' => $newThumbnailPath]);

                return response()->file(Storage::path($newThumbnailPath), [
                    'Content-Type' => 'image/jpeg',
                    'Cache-Control' => 'public, max-age=31536000',
                ]);
            }
        }

        // Fallback: serve original file
        if (Storage::exists($file->storage_path)) {
            return response()->file(Storage::path($file->storage_path), [
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

        // Delete original from storage
        Storage::delete($file->storage_path);

        // Delete thumbnail if exists
        $this->thumbnailService->deleteThumbnail($file->storage_path);
        if ($file->thumbnail_path) {
            Storage::delete($file->thumbnail_path);
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
            Storage::delete($file->storage_path);
            // Delete thumbnail if exists
            $this->thumbnailService->deleteThumbnail($file->storage_path);
            if ($file->thumbnail_path) {
                Storage::delete($file->thumbnail_path);
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

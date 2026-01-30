<?php

namespace App\Jobs;

use App\Models\File;
use App\Models\FileProcessingLog;
use App\Models\UploadSession;
use App\Services\FileSecurityService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ValidateUploadedFileJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120; // 2 minutes
    public int $backoff = 10;

    public function __construct(
        public UploadSession $session,
        public string $assembledFilePath
    ) {
        $this->onQueue('uploads');
    }

    public function handle(FileSecurityService $securityService): void
    {
        Log::info("Starting validation for session: {$this->session->id}");

        try {
            $this->session->markAsProcessing();

            $fullPath = storage_path("app/private/{$this->assembledFilePath}");

            // Validate file exists
            if (!file_exists($fullPath)) {
                throw new \RuntimeException("Assembled file not found: {$fullPath}");
            }

            // Get file info
            $fileSize = filesize($fullPath);
            $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';
            $extension = strtolower(pathinfo($this->session->original_filename, PATHINFO_EXTENSION));

            // Validate extension and MIME type
            $errors = $securityService->validateFileByPath(
                $fullPath,
                $this->session->original_filename,
                $fileSize
            );

            if (!empty($errors)) {
                throw new \RuntimeException("Security validation failed: " . implode(', ', $errors));
            }

            // Generate permanent storage path
            $permanentPath = $securityService->generateStoragePathFromExtension($extension);

            // Move file to permanent location
            $permanentFullPath = storage_path("app/private/{$permanentPath}");
            $permanentDir = dirname($permanentFullPath);

            if (!is_dir($permanentDir)) {
                mkdir($permanentDir, 0755, true);
            }

            if (!rename($fullPath, $permanentFullPath)) {
                throw new \RuntimeException("Failed to move file to permanent location");
            }

            // Clean up temp directory if empty
            $tempDir = dirname($fullPath);
            if (is_dir($tempDir) && count(scandir($tempDir)) <= 2) {
                rmdir($tempDir);
            }

            // Create database record
            $file = File::create([
                'user_id' => $this->session->user_id,
                'folder_id' => $this->session->folder_id,
                'name' => $securityService->sanitizeFilename($this->session->original_filename),
                'storage_path' => $permanentPath,
                'storage_disk' => File::DISK_LOCAL,
                'processing_status' => File::PROCESSING_PROCESSING,
                'upload_session_id' => $this->session->id,
                'mime_type' => $mimeType,
                'size' => $fileSize,
                'extension' => $extension,
            ]);

            // Log validation step
            FileProcessingLog::create([
                'file_id' => $file->id,
                'step' => FileProcessingLog::STEP_VALIDATION,
                'status' => FileProcessingLog::STATUS_COMPLETED,
                'message' => 'File validation passed',
                'started_at' => now(),
                'completed_at' => now(),
                'created_at' => now(),
            ]);

            Log::info("Validation completed for session: {$this->session->id}, file ID: {$file->id}");

            // Dispatch thumbnail job for images
            $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
            if (in_array($extension, $imageExtensions)) {
                GenerateThumbnailJob::dispatch($file);
            }

            // Dispatch GCP upload job if enabled
            if (config('upload.use_gcp', false)) {
                UploadToGcpJob::dispatch($file);
            } else {
                // Mark as completed if not uploading to GCP
                $file->update(['processing_status' => File::PROCESSING_COMPLETED]);
                $this->session->markAsCompleted();
            }

        } catch (\Throwable $e) {
            Log::error("Validation failed for session: {$this->session->id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->session->markAsFailed("Validation failed: {$e->getMessage()}");

            // Clean up assembled file
            $this->cleanup();

            throw $e;
        }
    }

    protected function cleanup(): void
    {
        try {
            $fullPath = storage_path("app/private/{$this->assembledFilePath}");
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            $tempDir = dirname($fullPath);
            if (is_dir($tempDir) && count(scandir($tempDir)) <= 2) {
                rmdir($tempDir);
            }
        } catch (\Throwable $e) {
            Log::warning("Failed to cleanup assembled file: {$e->getMessage()}");
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("ValidateUploadedFileJob permanently failed for session: {$this->session->id}", [
            'error' => $exception->getMessage(),
        ]);

        $this->session->markAsFailed("Validation permanently failed: {$exception->getMessage()}");
        $this->cleanup();
    }
}

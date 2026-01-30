<?php

namespace App\Jobs;

use App\Models\File;
use App\Models\FileProcessingLog;
use App\Models\UploadSession;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadToGcpJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
    public int $timeout = 600; // 10 minutes for large files
    public array $backoff = [10, 30, 60, 120, 300]; // Exponential backoff

    public function __construct(
        public File $file
    ) {
        $this->onQueue('gcp-uploads');
    }

    public function handle(): void
    {
        Log::info("Starting GCP upload for file: {$this->file->id}");

        $log = FileProcessingLog::logStart($this->file->id, FileProcessingLog::STEP_GCP_UPLOAD);

        try {
            // Generate GCP path
            $gcpPath = $this->generateGcpPath();

            // Get local file stream
            $localDisk = Storage::disk('local');
            $gcsDisk = Storage::disk('gcs');

            if (!$localDisk->exists($this->file->storage_path)) {
                throw new \RuntimeException("Local file not found: {$this->file->storage_path}");
            }

            // Stream upload to GCP
            $stream = $localDisk->readStream($this->file->storage_path);
            $gcsDisk->writeStream($gcpPath, $stream);

            if (is_resource($stream)) {
                fclose($stream);
            }

            // Verify upload
            if (!$gcsDisk->exists($gcpPath)) {
                throw new \RuntimeException('GCP upload verification failed');
            }

            // Update file record
            $this->file->update([
                'gcp_path' => $gcpPath,
                'storage_disk' => File::DISK_GCS,
                'processing_status' => File::PROCESSING_COMPLETED,
            ]);

            // Upload thumbnail to GCP if exists
            if ($this->file->thumbnail_path && $localDisk->exists($this->file->thumbnail_path)) {
                $this->uploadThumbnailToGcp($localDisk, $gcsDisk);
            }

            // Delete local file if configured
            if (config('upload.delete_local_after_gcp', true)) {
                $this->deleteLocalFiles($localDisk);
            }

            // Mark session as completed
            if ($this->file->upload_session_id) {
                $session = UploadSession::find($this->file->upload_session_id);
                $session?->markAsCompleted();
            }

            $log->markCompleted("Uploaded to GCP: {$gcpPath}");
            Log::info("GCP upload completed for file: {$this->file->id}");

        } catch (\Throwable $e) {
            Log::error("GCP upload failed for file: {$this->file->id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $log->markFailed($e->getMessage());

            throw $e;
        }
    }

    protected function generateGcpPath(): string
    {
        $prefix = config('filesystems.disks.gcs.path_prefix', 'cloudvault');
        $date = now();

        return sprintf(
            '%s/files/%s/%s/%s.%s',
            $prefix,
            $date->format('Y'),
            $date->format('m'),
            Str::random(40),
            $this->file->extension
        );
    }

    protected function uploadThumbnailToGcp($localDisk, $gcsDisk): void
    {
        try {
            $thumbnailGcpPath = str_replace(
                'files/',
                config('filesystems.disks.gcs.path_prefix', 'cloudvault') . '/thumbnails/',
                $this->file->thumbnail_path
            );

            $stream = $localDisk->readStream($this->file->thumbnail_path);
            $gcsDisk->writeStream($thumbnailGcpPath, $stream);

            if (is_resource($stream)) {
                fclose($stream);
            }

            Log::info("Thumbnail uploaded to GCP for file: {$this->file->id}");
        } catch (\Throwable $e) {
            Log::warning("Failed to upload thumbnail to GCP: {$e->getMessage()}");
            // Don't fail the job for thumbnail upload errors
        }
    }

    protected function deleteLocalFiles($localDisk): void
    {
        try {
            // Delete main file
            if ($localDisk->exists($this->file->storage_path)) {
                $localDisk->delete($this->file->storage_path);
            }

            // Delete thumbnail
            if ($this->file->thumbnail_path && $localDisk->exists($this->file->thumbnail_path)) {
                $localDisk->delete($this->file->thumbnail_path);
            }

            Log::info("Local files deleted after GCP upload for file: {$this->file->id}");
        } catch (\Throwable $e) {
            Log::warning("Failed to delete local files: {$e->getMessage()}");
            // Don't fail the job for cleanup errors
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("UploadToGcpJob permanently failed for file: {$this->file->id}", [
            'error' => $exception->getMessage(),
        ]);

        // Update file status
        $this->file->update([
            'processing_status' => File::PROCESSING_FAILED,
        ]);

        FileProcessingLog::create([
            'file_id' => $this->file->id,
            'step' => FileProcessingLog::STEP_GCP_UPLOAD,
            'status' => FileProcessingLog::STATUS_FAILED,
            'message' => "Permanently failed: {$exception->getMessage()}",
            'created_at' => now(),
        ]);

        // Mark session as failed
        if ($this->file->upload_session_id) {
            $session = UploadSession::find($this->file->upload_session_id);
            $session?->markAsFailed("GCP upload failed: {$exception->getMessage()}");
        }
    }
}

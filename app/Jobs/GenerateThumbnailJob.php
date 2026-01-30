<?php

namespace App\Jobs;

use App\Models\File;
use App\Models\FileProcessingLog;
use App\Services\ThumbnailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateThumbnailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60; // 1 minute
    public int $backoff = 5;

    public function __construct(
        public File $file
    ) {
        $this->onQueue('thumbnails');
    }

    public function handle(ThumbnailService $thumbnailService): void
    {
        Log::info("Starting thumbnail generation for file: {$this->file->id}");

        $log = FileProcessingLog::logStart($this->file->id, FileProcessingLog::STEP_THUMBNAIL);

        try {
            // Check if file is an image
            if (!$thumbnailService->isImageFile($this->file->mime_type)) {
                $log->markCompleted('File is not an image, skipping thumbnail');
                return;
            }

            // Generate thumbnail path
            $thumbnailPath = $thumbnailService->getThumbnailPath($this->file->storage_path);
            $thumbnailPath = preg_replace('/\.[^.]+$/', '.jpg', $thumbnailPath);

            // Generate thumbnail
            $success = $thumbnailService->generateThumbnail(
                $this->file->storage_path,
                $thumbnailPath
            );

            if (!$success) {
                throw new \RuntimeException('Failed to generate thumbnail');
            }

            // Update file record
            $this->file->update(['thumbnail_path' => $thumbnailPath]);

            $log->markCompleted('Thumbnail generated successfully');
            Log::info("Thumbnail generated for file: {$this->file->id}");

        } catch (\Throwable $e) {
            Log::error("Thumbnail generation failed for file: {$this->file->id}", [
                'error' => $e->getMessage(),
            ]);

            $log->markFailed($e->getMessage());

            // Don't fail the job for thumbnail errors - it's not critical
            // The file is still usable without a thumbnail
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("GenerateThumbnailJob permanently failed for file: {$this->file->id}", [
            'error' => $exception->getMessage(),
        ]);

        FileProcessingLog::create([
            'file_id' => $this->file->id,
            'step' => FileProcessingLog::STEP_THUMBNAIL,
            'status' => FileProcessingLog::STATUS_FAILED,
            'message' => "Permanently failed: {$exception->getMessage()}",
            'created_at' => now(),
        ]);
    }
}

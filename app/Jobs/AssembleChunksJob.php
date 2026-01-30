<?php

namespace App\Jobs;

use App\Models\UploadSession;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AssembleChunksJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 600; // 10 minutes for large files
    public int $backoff = 30;

    public function __construct(
        public UploadSession $session
    ) {
        $this->onQueue('uploads');
    }

    public function handle(): void
    {
        Log::info("Starting chunk assembly for session: {$this->session->id}");

        try {
            $this->session->markAsAssembling();

            // Get the assembled file path
            $assembledPath = $this->getAssembledFilePath();
            $tempDir = storage_path("app/private/{$this->session->temp_path}");

            // Open output file for writing
            $outputPath = storage_path("app/private/{$assembledPath}");
            $outputDir = dirname($outputPath);

            if (!is_dir($outputDir)) {
                mkdir($outputDir, 0755, true);
            }

            $outputHandle = fopen($outputPath, 'wb');
            if (!$outputHandle) {
                throw new \RuntimeException("Failed to create output file: {$outputPath}");
            }

            // Assemble chunks in order
            for ($i = 0; $i < $this->session->total_chunks; $i++) {
                $chunkPath = "{$tempDir}/chunk_{$i}";

                if (!file_exists($chunkPath)) {
                    throw new \RuntimeException("Missing chunk {$i} at: {$chunkPath}");
                }

                $chunkHandle = fopen($chunkPath, 'rb');
                if (!$chunkHandle) {
                    throw new \RuntimeException("Failed to open chunk {$i}");
                }

                // Stream chunk to output
                while (!feof($chunkHandle)) {
                    $buffer = fread($chunkHandle, 8192); // 8KB buffer
                    fwrite($outputHandle, $buffer);
                }

                fclose($chunkHandle);

                // Delete chunk after writing
                unlink($chunkPath);
            }

            fclose($outputHandle);

            // Clean up temp directory
            if (is_dir($tempDir)) {
                rmdir($tempDir);
            }

            Log::info("Chunk assembly completed for session: {$this->session->id}");

            // Dispatch validation job
            ValidateUploadedFileJob::dispatch($this->session, $assembledPath);

        } catch (\Throwable $e) {
            Log::error("Chunk assembly failed for session: {$this->session->id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->session->markAsFailed("Chunk assembly failed: {$e->getMessage()}");

            // Clean up on failure
            $this->cleanup();

            throw $e;
        }
    }

    protected function getAssembledFilePath(): string
    {
        $extension = pathinfo($this->session->original_filename, PATHINFO_EXTENSION);
        $date = now();

        return sprintf(
            'files/temp/%s/%s/%s.%s',
            $date->format('Y'),
            $date->format('m'),
            $this->session->id,
            strtolower($extension)
        );
    }

    protected function cleanup(): void
    {
        try {
            $tempDir = $this->session->temp_path;
            if (Storage::disk('local')->exists($tempDir)) {
                Storage::disk('local')->deleteDirectory($tempDir);
            }
        } catch (\Throwable $e) {
            Log::warning("Failed to cleanup temp directory: {$e->getMessage()}");
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("AssembleChunksJob permanently failed for session: {$this->session->id}", [
            'error' => $exception->getMessage(),
        ]);

        $this->session->markAsFailed("Chunk assembly permanently failed: {$exception->getMessage()}");
        $this->cleanup();
    }
}

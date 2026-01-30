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

class CleanupExpiredSessionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 300; // 5 minutes

    public function __construct()
    {
        $this->onQueue('maintenance');
    }

    public function handle(): void
    {
        Log::info('Starting cleanup of expired upload sessions');

        $cleanedCount = 0;
        $errorCount = 0;

        // Find expired sessions
        $expiredSessions = UploadSession::expired()->get();

        foreach ($expiredSessions as $session) {
            try {
                $this->cleanupSession($session);
                $cleanedCount++;
            } catch (\Throwable $e) {
                Log::warning("Failed to cleanup session {$session->id}: {$e->getMessage()}");
                $errorCount++;
            }
        }

        // Also cleanup old completed/failed sessions (older than 7 days)
        $oldSessions = UploadSession::whereIn('status', ['completed', 'failed', 'cancelled'])
            ->where('updated_at', '<', now()->subDays(7))
            ->get();

        foreach ($oldSessions as $session) {
            try {
                $session->delete();
                $cleanedCount++;
            } catch (\Throwable $e) {
                Log::warning("Failed to delete old session {$session->id}: {$e->getMessage()}");
                $errorCount++;
            }
        }

        Log::info("Cleanup completed: {$cleanedCount} sessions cleaned, {$errorCount} errors");
    }

    protected function cleanupSession(UploadSession $session): void
    {
        // Delete temp directory with chunks
        $tempPath = $session->temp_path;
        if ($tempPath && Storage::disk('local')->exists($tempPath)) {
            Storage::disk('local')->deleteDirectory($tempPath);
        }

        // Mark session as cancelled
        $session->markAsCancelled();

        Log::info("Cleaned up expired session: {$session->id}");
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("CleanupExpiredSessionsJob failed", [
            'error' => $exception->getMessage(),
        ]);
    }
}

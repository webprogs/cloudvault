<?php

namespace App\Console\Commands;

use App\Jobs\CleanupExpiredSessionsJob;
use Illuminate\Console\Command;

class CleanupExpiredUploads extends Command
{
    protected $signature = 'uploads:cleanup
                            {--sync : Run synchronously instead of dispatching a job}';

    protected $description = 'Clean up expired upload sessions and their temporary files';

    public function handle(): int
    {
        $this->info('Cleaning up expired upload sessions...');

        if ($this->option('sync')) {
            // Run synchronously
            $job = new CleanupExpiredSessionsJob();
            $job->handle();
            $this->info('Cleanup completed synchronously.');
        } else {
            // Dispatch to queue
            CleanupExpiredSessionsJob::dispatch();
            $this->info('Cleanup job dispatched to queue.');
        }

        return 0;
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class TestGcpConnection extends Command
{
    protected $signature = 'gcp:test';

    protected $description = 'Test the Google Cloud Storage connection';

    public function handle(): int
    {
        $this->info('Testing GCP connection...');
        $this->newLine();

        $projectId = config('filesystems.disks.gcs.project_id');
        $bucket = config('filesystems.disks.gcs.bucket');
        $keyFile = config('filesystems.disks.gcs.key_file');

        $this->table(['Setting', 'Value'], [
            ['Project ID', $projectId ?: '<not set>'],
            ['Bucket', $bucket ?: '<not set>'],
            ['Key File', $keyFile ?: '<not set>'],
            ['UPLOAD_USE_GCP', config('upload.use_gcp') ? 'true' : 'false'],
        ]);

        $this->newLine();

        try {
            $disk = Storage::disk('gcs');

            // Test listing files
            $this->info('1. Testing bucket access...');
            $files = $disk->files('/');
            $this->info("   ✓ Bucket accessible ({$bucket})");

            // Test write
            $testFile = '.gcp-test-' . time() . '.txt';
            $this->info('2. Testing write permission...');
            $disk->put($testFile, 'GCP connection test from Laravel');
            $this->info("   ✓ Write successful");

            // Test read
            $this->info('3. Testing read permission...');
            $content = $disk->get($testFile);
            $this->info("   ✓ Read successful");

            // Test delete
            $this->info('4. Testing delete permission...');
            $disk->delete($testFile);
            $this->info("   ✓ Delete successful");

            $this->newLine();
            $this->info('✓ All GCP tests passed!');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->newLine();
            $this->error('✗ GCP test failed: ' . $e->getMessage());

            return Command::FAILURE;
        }
    }
}

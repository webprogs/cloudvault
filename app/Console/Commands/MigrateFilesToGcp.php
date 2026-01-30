<?php

namespace App\Console\Commands;

use App\Models\File;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MigrateFilesToGcp extends Command
{
    protected $signature = 'files:migrate-to-gcp
                            {--batch=100 : Number of files to process per batch}
                            {--dry-run : Show what would be migrated without doing it}
                            {--user= : Only migrate files for a specific user ID}';

    protected $description = 'Migrate existing local files to Google Cloud Storage';

    protected int $migrated = 0;
    protected int $failed = 0;
    protected int $skipped = 0;

    public function handle(): int
    {
        $batchSize = (int) $this->option('batch');
        $dryRun = $this->option('dry-run');
        $userId = $this->option('user');

        if (!config('upload.use_gcp')) {
            $this->error('GCP storage is not enabled. Set UPLOAD_USE_GCP=true in .env');
            return 1;
        }

        // Check GCP connection
        if (!$dryRun) {
            try {
                Storage::disk('gcs')->exists('test');
            } catch (\Throwable $e) {
                $this->error('Failed to connect to GCP: ' . $e->getMessage());
                return 1;
            }
        }

        $query = File::where('storage_disk', 'local')
            ->whereNotNull('storage_path');

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $total = $query->count();

        if ($total === 0) {
            $this->info('No files to migrate.');
            return 0;
        }

        $this->info("Found {$total} files to migrate.");

        if ($dryRun) {
            $this->warn('Dry run mode - no files will be migrated.');
            $this->showSampleFiles($query->limit(10)->get());
            return 0;
        }

        if (!$this->confirm('Do you want to proceed with the migration?')) {
            return 0;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $query->chunk($batchSize, function ($files) use ($bar) {
            foreach ($files as $file) {
                try {
                    $this->migrateFile($file);
                    $this->migrated++;
                } catch (\Throwable $e) {
                    $this->failed++;
                    Log::error("Failed to migrate file {$file->id}: {$e->getMessage()}");
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->info("Migration complete!");
        $this->table(
            ['Status', 'Count'],
            [
                ['Migrated', $this->migrated],
                ['Failed', $this->failed],
                ['Skipped', $this->skipped],
            ]
        );

        if ($this->failed > 0) {
            $this->warn("Check the logs for details on failed migrations.");
        }

        return $this->failed > 0 ? 1 : 0;
    }

    protected function migrateFile(File $file): void
    {
        $localDisk = Storage::disk('local');
        $gcsDisk = Storage::disk('gcs');

        // Check if local file exists
        if (!$localDisk->exists($file->storage_path)) {
            $this->skipped++;
            Log::warning("File {$file->id} not found at {$file->storage_path}, skipping.");
            return;
        }

        // Generate GCP path
        $gcpPath = $this->generateGcpPath($file);

        // Stream upload to GCP
        $stream = $localDisk->readStream($file->storage_path);
        $gcsDisk->writeStream($gcpPath, $stream);

        if (is_resource($stream)) {
            fclose($stream);
        }

        // Verify upload
        if (!$gcsDisk->exists($gcpPath)) {
            throw new \RuntimeException('GCP upload verification failed');
        }

        // Upload thumbnail if exists
        if ($file->thumbnail_path && $localDisk->exists($file->thumbnail_path)) {
            $this->uploadThumbnail($file, $localDisk, $gcsDisk);
        }

        // Update database record
        $file->update([
            'gcp_path' => $gcpPath,
            'storage_disk' => File::DISK_GCS,
        ]);

        // Delete local file if configured
        if (config('upload.delete_local_after_gcp', true)) {
            $localDisk->delete($file->storage_path);
            if ($file->thumbnail_path) {
                $localDisk->delete($file->thumbnail_path);
            }
        }
    }

    protected function generateGcpPath(File $file): string
    {
        $prefix = config('filesystems.disks.gcs.path_prefix', 'cloudvault');

        return sprintf(
            '%s/files/%s/%s/%s.%s',
            $prefix,
            $file->created_at->format('Y'),
            $file->created_at->format('m'),
            Str::random(40),
            $file->extension
        );
    }

    protected function uploadThumbnail(File $file, $localDisk, $gcsDisk): void
    {
        try {
            $thumbnailGcpPath = str_replace(
                'files/',
                config('filesystems.disks.gcs.path_prefix', 'cloudvault') . '/thumbnails/',
                $file->thumbnail_path
            );

            $stream = $localDisk->readStream($file->thumbnail_path);
            $gcsDisk->writeStream($thumbnailGcpPath, $stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        } catch (\Throwable $e) {
            Log::warning("Failed to upload thumbnail for file {$file->id}: {$e->getMessage()}");
        }
    }

    protected function showSampleFiles($files): void
    {
        $this->info("\nSample files that would be migrated:");
        $this->table(
            ['ID', 'Name', 'Size', 'Path'],
            $files->map(fn ($f) => [
                $f->id,
                Str::limit($f->name, 30),
                $f->formatted_size,
                Str::limit($f->storage_path, 40),
            ])->toArray()
        );
    }
}

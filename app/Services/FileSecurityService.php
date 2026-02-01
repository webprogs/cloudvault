<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class FileSecurityService
{
    // No file type restrictions - this is a file storage system
    protected array $blockedExtensions = [];
    protected array $blockedMimeTypes = [];

    public function validateFile(UploadedFile $file): array
    {
        // No restrictions - allow all file types
        return [];
    }

    public function isAllowed(UploadedFile $file): bool
    {
        return empty($this->validateFile($file));
    }

    public function sanitizeFilename(string $filename): string
    {
        // Remove path components
        $filename = basename($filename);

        // Remove null bytes
        $filename = str_replace("\0", '', $filename);

        // Replace spaces and special characters
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);

        // Remove leading/trailing dots and spaces
        $filename = trim($filename, '. ');

        // Ensure filename is not empty
        if (empty($filename)) {
            $filename = 'unnamed_file';
        }

        return $filename;
    }

    public function generateStoragePath(UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        return $this->generateStoragePathFromExtension($extension);
    }

    public function generateStoragePathFromExtension(string $extension): string
    {
        $hash = Str::random(40);
        $extension = strtolower($extension);

        // Organize by year/month for better file management
        // Store originals in files/originals/ directory
        $datePath = date('Y/m');

        return "files/originals/{$datePath}/{$hash}.{$extension}";
    }

    /**
     * Validate a file by its path (for chunked uploads after assembly)
     */
    public function validateFileByPath(string $filePath, string $originalFilename, int $fileSize): array
    {
        // No restrictions - allow all file types
        return [];
    }

    /**
     * Validate filename and extension before upload session starts
     */
    public function validateFilenameForUpload(string $filename, int $fileSize): array
    {
        // No restrictions - allow all file types
        return [];
    }

    protected function hasDoubleExtension(string $filename): bool
    {
        // No restrictions
        return false;
    }

    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function getBlockedExtensions(): array
    {
        return $this->blockedExtensions;
    }

    public function getBlockedMimeTypes(): array
    {
        return $this->blockedMimeTypes;
    }
}

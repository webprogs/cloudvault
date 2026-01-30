<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class FileSecurityService
{
    protected array $blockedExtensions = [
        // Executables
        'exe', 'bat', 'cmd', 'msi', 'com', 'scr', 'pif', 'gadget',
        // Scripts
        'php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps',
        'sh', 'bash', 'zsh', 'csh', 'ksh',
        'ps1', 'psm1', 'psd1',
        'py', 'pyc', 'pyo', 'pyw',
        'rb', 'rbw',
        'pl', 'pm', 'cgi',
        'vbs', 'vbe', 'wsf', 'wsh',
        // Web
        'html', 'htm', 'xhtml',
        'js', 'mjs', 'jsx', 'ts', 'tsx',
        'jsp', 'jspx',
        'asp', 'aspx', 'ascx', 'ashx', 'asmx',
        'cfm', 'cfc',
        // Other dangerous
        'jar', 'war', 'ear',
        'dll', 'so', 'dylib',
        'sys', 'drv',
        'reg', 'inf',
        'hta', 'htaccess',
        'shtml', 'shtm',
    ];

    protected array $blockedMimeTypes = [
        'application/x-executable',
        'application/x-msdos-program',
        'application/x-msdownload',
        'application/x-sh',
        'application/x-shellscript',
        'application/x-php',
        'application/x-httpd-php',
        'application/x-perl',
        'application/x-python',
        'application/x-ruby',
        'text/x-php',
        'text/x-perl',
        'text/x-python',
        'text/x-shellscript',
        'text/html',
        'text/javascript',
        'application/javascript',
        'application/x-javascript',
    ];

    public function validateFile(UploadedFile $file): array
    {
        $errors = [];

        // Check extension
        $extension = strtolower($file->getClientOriginalExtension());
        if (in_array($extension, $this->blockedExtensions)) {
            $errors[] = "File type '.{$extension}' is not allowed for security reasons.";
        }

        // Check MIME type
        $mimeType = $file->getMimeType();
        if (in_array($mimeType, $this->blockedMimeTypes)) {
            $errors[] = "File type '{$mimeType}' is not allowed for security reasons.";
        }

        // Double extension check (e.g., file.php.jpg)
        $filename = $file->getClientOriginalName();
        if ($this->hasDoubleExtension($filename)) {
            $errors[] = "Files with double extensions are not allowed.";
        }

        // Check file size
        $maxSize = config('filesystems.max_upload_size', 104857600); // 100MB default
        if ($file->getSize() > $maxSize) {
            $errors[] = "File size exceeds the maximum allowed size of " . $this->formatBytes($maxSize) . ".";
        }

        return $errors;
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
        $errors = [];

        // Check extension
        $extension = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
        if (in_array($extension, $this->blockedExtensions)) {
            $errors[] = "File type '.{$extension}' is not allowed for security reasons.";
        }

        // Check MIME type
        $mimeType = mime_content_type($filePath);
        if ($mimeType && in_array($mimeType, $this->blockedMimeTypes)) {
            $errors[] = "File type '{$mimeType}' is not allowed for security reasons.";
        }

        // Double extension check
        if ($this->hasDoubleExtension($originalFilename)) {
            $errors[] = "Files with double extensions are not allowed.";
        }

        // Check file size
        $maxSize = config('upload.max_file_size', 10737418240); // 10GB default
        if ($fileSize > $maxSize) {
            $errors[] = "File size exceeds the maximum allowed size of " . $this->formatBytes($maxSize) . ".";
        }

        return $errors;
    }

    /**
     * Validate filename and extension before upload session starts
     */
    public function validateFilenameForUpload(string $filename, int $fileSize): array
    {
        $errors = [];

        // Check extension
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if (empty($extension)) {
            $errors[] = "File must have an extension.";
        } elseif (in_array($extension, $this->blockedExtensions)) {
            $errors[] = "File type '.{$extension}' is not allowed for security reasons.";
        }

        // Double extension check
        if ($this->hasDoubleExtension($filename)) {
            $errors[] = "Files with double extensions are not allowed.";
        }

        // Check file size
        $maxSize = config('upload.max_file_size', 10737418240); // 10GB default
        if ($fileSize > $maxSize) {
            $errors[] = "File size exceeds the maximum allowed size of " . $this->formatBytes($maxSize) . ".";
        }

        return $errors;
    }

    protected function hasDoubleExtension(string $filename): bool
    {
        $parts = explode('.', $filename);
        if (count($parts) < 3) {
            return false;
        }

        // Check if any intermediate part is a blocked extension
        array_pop($parts); // Remove the last extension
        array_shift($parts); // Remove the filename

        foreach ($parts as $part) {
            if (in_array(strtolower($part), $this->blockedExtensions)) {
                return true;
            }
        }

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

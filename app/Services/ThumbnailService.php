<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class ThumbnailService
{
    protected array $supportedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
    ];

    protected int $thumbnailWidth = 400;
    protected int $thumbnailHeight = 400;
    protected int $thumbnailQuality = 80;

    public function isImageFile(string $mimeType): bool
    {
        return in_array($mimeType, $this->supportedMimeTypes);
    }

    public function generateThumbnail(string $originalPath, string $thumbnailPath): bool
    {
        try {
            $fullOriginalPath = Storage::disk('local')->path($originalPath);

            if (!file_exists($fullOriginalPath)) {
                return false;
            }

            // Get image info
            $imageInfo = getimagesize($fullOriginalPath);
            if ($imageInfo === false) {
                return false;
            }

            [$originalWidth, $originalHeight, $imageType] = $imageInfo;

            // Create image resource based on type
            $sourceImage = match ($imageType) {
                IMAGETYPE_JPEG => imagecreatefromjpeg($fullOriginalPath),
                IMAGETYPE_PNG => imagecreatefrompng($fullOriginalPath),
                IMAGETYPE_GIF => imagecreatefromgif($fullOriginalPath),
                IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($fullOriginalPath) : false,
                IMAGETYPE_BMP => function_exists('imagecreatefrombmp') ? imagecreatefrombmp($fullOriginalPath) : false,
                default => false,
            };

            if ($sourceImage === false) {
                return false;
            }

            // Calculate new dimensions while maintaining aspect ratio
            $ratio = min($this->thumbnailWidth / $originalWidth, $this->thumbnailHeight / $originalHeight);

            // Only resize if the image is larger than thumbnail dimensions
            if ($ratio >= 1) {
                $newWidth = $originalWidth;
                $newHeight = $originalHeight;
            } else {
                $newWidth = (int) round($originalWidth * $ratio);
                $newHeight = (int) round($originalHeight * $ratio);
            }

            // Create new image
            $thumbnailImage = imagecreatetruecolor($newWidth, $newHeight);

            // Preserve transparency for PNG
            if ($imageType === IMAGETYPE_PNG) {
                imagealphablending($thumbnailImage, false);
                imagesavealpha($thumbnailImage, true);
                $transparent = imagecolorallocatealpha($thumbnailImage, 255, 255, 255, 127);
                imagefilledrectangle($thumbnailImage, 0, 0, $newWidth, $newHeight, $transparent);
            }

            // Resize image
            imagecopyresampled(
                $thumbnailImage,
                $sourceImage,
                0, 0, 0, 0,
                $newWidth, $newHeight,
                $originalWidth, $originalHeight
            );

            // Ensure the directory exists
            $thumbnailDir = dirname($thumbnailPath);
            if (!Storage::disk('local')->exists($thumbnailDir)) {
                Storage::disk('local')->makeDirectory($thumbnailDir);
            }

            $fullThumbnailPath = Storage::disk('local')->path($thumbnailPath);

            // Save as JPEG for consistent, smaller file size
            $result = imagejpeg($thumbnailImage, $fullThumbnailPath, $this->thumbnailQuality);

            // Clean up
            imagedestroy($sourceImage);
            imagedestroy($thumbnailImage);

            return $result;
        } catch (\Exception $e) {
            report($e);
            return false;
        }
    }

    public function getThumbnailPath(string $originalPath): string
    {
        // Convert: files/originals/2026/01/abc123.jpg -> files/thumbnails/2026/01/abc123.jpg
        return str_replace('files/originals/', 'files/thumbnails/', $originalPath);
    }

    public function deleteThumbnail(string $originalPath): void
    {
        $thumbnailPath = $this->getThumbnailPath($originalPath);

        // Also try with .jpg extension since thumbnails are always JPEG
        $jpgThumbnailPath = preg_replace('/\.[^.]+$/', '.jpg', $thumbnailPath);

        if (Storage::disk('local')->exists($thumbnailPath)) {
            Storage::disk('local')->delete($thumbnailPath);
        }

        if ($thumbnailPath !== $jpgThumbnailPath && Storage::disk('local')->exists($jpgThumbnailPath)) {
            Storage::disk('local')->delete($jpgThumbnailPath);
        }
    }

    public function hasThumbnail(string $originalPath): bool
    {
        $thumbnailPath = $this->getThumbnailPath($originalPath);
        $jpgThumbnailPath = preg_replace('/\.[^.]+$/', '.jpg', $thumbnailPath);

        return Storage::disk('local')->exists($thumbnailPath)
            || Storage::disk('local')->exists($jpgThumbnailPath);
    }

    public function getExistingThumbnailPath(string $originalPath): ?string
    {
        $thumbnailPath = $this->getThumbnailPath($originalPath);
        $jpgThumbnailPath = preg_replace('/\.[^.]+$/', '.jpg', $thumbnailPath);

        if (Storage::disk('local')->exists($thumbnailPath)) {
            return $thumbnailPath;
        }

        if (Storage::disk('local')->exists($jpgThumbnailPath)) {
            return $jpgThumbnailPath;
        }

        return null;
    }
}

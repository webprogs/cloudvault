<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class File extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'folder_id',
        'name',
        'storage_path',
        'gcp_path',
        'storage_disk',
        'processing_status',
        'upload_session_id',
        'thumbnail_path',
        'mime_type',
        'size',
        'extension',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    public const PROCESSING_PENDING = 'pending';
    public const PROCESSING_PROCESSING = 'processing';
    public const PROCESSING_COMPLETED = 'completed';
    public const PROCESSING_FAILED = 'failed';

    public const DISK_LOCAL = 'local';
    public const DISK_GCS = 'gcs';

    protected $appends = ['formatted_size', 'icon_type', 'is_shared', 'thumbnail_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    public function shares(): HasMany
    {
        return $this->hasMany(FileShare::class);
    }

    public function processingLogs(): HasMany
    {
        return $this->hasMany(FileProcessingLog::class);
    }

    public function uploadSession(): BelongsTo
    {
        return $this->belongsTo(UploadSession::class);
    }

    public function isOnGcp(): bool
    {
        return $this->storage_disk === self::DISK_GCS && !empty($this->gcp_path);
    }

    public function isProcessing(): bool
    {
        return $this->processing_status === self::PROCESSING_PROCESSING;
    }

    public function isProcessingComplete(): bool
    {
        return $this->processing_status === self::PROCESSING_COMPLETED;
    }

    public function getStoragePath(): string
    {
        return $this->isOnGcp() ? $this->gcp_path : $this->storage_path;
    }

    public function getStorageDiskName(): string
    {
        return $this->storage_disk ?? self::DISK_LOCAL;
    }

    public function activeShare()
    {
        return $this->shares()
            ->active()
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->where(function ($query) {
                $query->whereNull('max_downloads')
                    ->orWhereColumn('access_count', '<', 'max_downloads');
            })
            ->first();
    }

    public function getIsSharedAttribute(): bool
    {
        return $this->shares()->active()->exists();
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        // Only return thumbnail URL for images
        $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        if (!in_array(strtolower($this->extension), $imageExtensions)) {
            return null;
        }

        return "/files/{$this->id}/thumbnail";
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function getIconTypeAttribute(): string
    {
        $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
        $videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
        $audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
        $documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt'];
        $archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];

        $ext = strtolower($this->extension);

        return match (true) {
            in_array($ext, $imageExtensions) => 'image',
            in_array($ext, $videoExtensions) => 'video',
            in_array($ext, $audioExtensions) => 'audio',
            in_array($ext, $documentExtensions) => 'document',
            in_array($ext, $archiveExtensions) => 'archive',
            default => 'file',
        };
    }

    public function scopeSearch($query, ?string $search)
    {
        if ($search) {
            return $query->where('name', 'like', "%{$search}%");
        }
        return $query;
    }

    public function scopeFilterByType($query, ?string $type)
    {
        if (!$type || $type === 'all') {
            return $query;
        }

        $typeMap = [
            'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'],
            'video' => ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
            'audio' => ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
            'document' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt'],
            'archive' => ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
        ];

        if (isset($typeMap[$type])) {
            return $query->whereIn('extension', $typeMap[$type]);
        }

        return $query;
    }
}

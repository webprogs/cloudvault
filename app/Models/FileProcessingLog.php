<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FileProcessingLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'file_id',
        'step',
        'status',
        'message',
        'started_at',
        'completed_at',
        'created_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public const STEP_VALIDATION = 'validation';
    public const STEP_THUMBNAIL = 'thumbnail';
    public const STEP_GCP_UPLOAD = 'gcp_upload';
    public const STEP_CLEANUP = 'cleanup';

    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    public function file(): BelongsTo
    {
        return $this->belongsTo(File::class);
    }

    public static function logStart(int $fileId, string $step): self
    {
        return self::create([
            'file_id' => $fileId,
            'step' => $step,
            'status' => self::STATUS_PROCESSING,
            'started_at' => now(),
            'created_at' => now(),
        ]);
    }

    public function markCompleted(?string $message = null): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'message' => $message,
            'completed_at' => now(),
        ]);
    }

    public function markFailed(string $message): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'message' => $message,
            'completed_at' => now(),
        ]);
    }
}

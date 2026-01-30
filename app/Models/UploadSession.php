<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UploadSession extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'folder_id',
        'original_filename',
        'total_size',
        'total_chunks',
        'chunk_size',
        'uploaded_chunks',
        'temp_path',
        'status',
        'error_message',
        'expires_at',
    ];

    protected $casts = [
        'uploaded_chunks' => 'array',
        'expires_at' => 'datetime',
        'total_size' => 'integer',
        'total_chunks' => 'integer',
        'chunk_size' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    public function isComplete(): bool
    {
        return count($this->uploaded_chunks ?? []) === $this->total_chunks;
    }

    public function getUploadedChunksCount(): int
    {
        return count($this->uploaded_chunks ?? []);
    }

    public function getProgress(): float
    {
        if ($this->total_chunks === 0) {
            return 0;
        }
        return round(($this->getUploadedChunksCount() / $this->total_chunks) * 100, 2);
    }

    public function getMissingChunks(): array
    {
        $uploadedChunks = $this->uploaded_chunks ?? [];
        $missingChunks = [];

        for ($i = 0; $i < $this->total_chunks; $i++) {
            if (!in_array($i, $uploadedChunks)) {
                $missingChunks[] = $i;
            }
        }

        return $missingChunks;
    }

    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now())
            ->whereNotIn('status', ['completed', 'failed', 'cancelled']);
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now())
            ->whereNotIn('status', ['completed', 'failed', 'cancelled']);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function markAsUploading(): void
    {
        $this->update(['status' => 'uploading']);
    }

    public function markAsAssembling(): void
    {
        $this->update(['status' => 'assembling']);
    }

    public function markAsProcessing(): void
    {
        $this->update(['status' => 'processing']);
    }

    public function markAsCompleted(): void
    {
        $this->update(['status' => 'completed']);
    }

    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }

    public function markAsCancelled(): void
    {
        $this->update(['status' => 'cancelled']);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FileShare extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_id',
        'user_id',
        'token',
        'share_type',
        'password',
        'expires_at',
        'access_count',
        'max_downloads',
        'is_active',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'access_count' => 'integer',
        'max_downloads' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = ['share_url', 'is_expired', 'is_download_limit_reached'];

    protected $hidden = ['password'];

    public function file(): BelongsTo
    {
        return $this->belongsTo(File::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function generateToken(): string
    {
        do {
            $token = Str::random(64);
        } while (static::where('token', $token)->exists());

        return $token;
    }

    public function setPasswordAttribute($value): void
    {
        $this->attributes['password'] = $value ? Hash::make($value) : null;
    }

    public function verifyPassword(string $password): bool
    {
        if ($this->share_type !== 'password' || !$this->password) {
            return true;
        }

        return Hash::check($password, $this->password);
    }

    public function isAccessible(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->is_expired) {
            return false;
        }

        if ($this->is_download_limit_reached) {
            return false;
        }

        return true;
    }

    public function incrementAccessCount(): void
    {
        $this->increment('access_count');
    }

    public function getShareUrlAttribute(): string
    {
        return url("/share/{$this->token}");
    }

    public function getIsExpiredAttribute(): bool
    {
        if (!$this->expires_at) {
            return false;
        }

        return $this->expires_at->isPast();
    }

    public function getIsDownloadLimitReachedAttribute(): bool
    {
        if (!$this->max_downloads) {
            return false;
        }

        return $this->access_count >= $this->max_downloads;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}

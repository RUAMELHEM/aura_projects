<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Website extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department_id',
        'name',
        'title',
        'url',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function scans(): HasMany
    {
        return $this->hasMany(WebsiteScan::class)->orderBy('created_at', 'desc');
    }

    public function latestScan()
    {
        return $this->hasOne(WebsiteScan::class)->latestOfMany();
    }
}

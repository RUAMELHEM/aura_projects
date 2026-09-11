<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebsiteIssue extends Model
{
    use HasFactory;

    protected $fillable = [
        'website_scan_id',
        'category',
        'severity',
        'code',
        'message',
    ];

    public function scan(): BelongsTo
    {
        return $this->belongsTo(WebsiteScan::class, 'website_scan_id');
    }
}

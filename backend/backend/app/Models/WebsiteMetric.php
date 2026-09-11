<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebsiteMetric extends Model
{
    protected $fillable = ['website_scan_id', 'category', 'score', 'details'];

    protected $casts = ['details' => 'array'];

    public function scan(): BelongsTo
    {
        return $this->belongsTo(WebsiteScan::class, 'website_scan_id');
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditReport extends Model
{
    protected $fillable = [
        'website_scan_id', 'overall_score', 'total_issues',
        'issues_by_severity', 'summary', 'recommendations',
    ];

    protected $casts = [
        'issues_by_severity' => 'array',
        'recommendations' => 'array',
    ];

    public function scan(): BelongsTo
    {
        return $this->belongsTo(WebsiteScan::class, 'website_scan_id');
    }
}
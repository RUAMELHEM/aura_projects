<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WebsiteScan extends Model
{
    use HasFactory;

    protected $fillable = [
        'website_id',
        'status',
        'overall_score',
        'seo_score',
        'security_score',
        'performance_score',
        'accessibility_score',
        'pages_crawled',
        'crawl_result',
        'ai_summary',
        'ai_recommendations',
        'error',
        'completed_at',
    ];

    protected $casts = [
        'ai_recommendations' => 'array',
        'crawl_result' => 'array',
        'completed_at' => 'datetime',
    ];

    public function website(): BelongsTo
    {
        return $this->belongsTo(Website::class);
    }

    public function issues(): HasMany
    {
        return $this->hasMany(WebsiteIssue::class);
    }

    public function auditReport()
    {
        return $this->hasOne(AuditReport::class);
    }

    public function metrics(): HasMany
    {
        return $this->hasMany(WebsiteMetric::class);
    }
}

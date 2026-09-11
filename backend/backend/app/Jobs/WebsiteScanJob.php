<?php

namespace App\Jobs;

use App\Models\Website;
use App\Models\WebsiteScan;
use App\Models\WebsiteIssue;
use App\Models\AuditReport;
use App\Models\WebsiteMetric;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class WebsiteScanJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 180;

    public Website $website;
    public WebsiteScan $scan;

    public function __construct(Website|int $website, WebsiteScan|int $scan)
    {
        $this->website = $website instanceof Website ? $website : Website::findOrFail($website);
        $this->scan = $scan instanceof WebsiteScan ? $scan : WebsiteScan::findOrFail($scan);
    }

    public function handle(): void
    {
        $website = $this->website;
        $scan = $this->scan;

        $scan->update(['status' => 'running']);
        $website->update(['status' => 'scanning']);

        $pythonUrl = rtrim(config('services.python.url', env('PYTHON_SERVICE_URL', 'http://python:8000')), '/');
        $apiKey = config('services.python.internal_key', env('PYTHON_INTERNAL_API_KEY', 'gizli-anahtar-12345'));

        try {
            // 1. Python Crawl Uç Noktası
            $crawlResponse = Http::withHeaders([
                'X-Internal-API-Key' => $apiKey,
                'Accept' => 'application/json',
            ])->timeout(60)->post("{$pythonUrl}/internal/websites/crawl", [
                'website_id' => $website->id,
                'scan_id' => $scan->id,
                'url' => $website->url,
                'max_pages' => 10,
                'timeout' => 10,
            ]);

            if (!$crawlResponse->successful()) {
                $errorMsg = $crawlResponse->json('detail') ?? $crawlResponse->body() ?? 'Crawl işlemi başarısız oldu.';
                $scan->update(['status' => 'failed', 'error' => $errorMsg]);
                $website->update(['status' => 'active']);
                return;
            }

            $crawlData = $crawlResponse->json() ?? [];
            $pages = $crawlData['pages'] ?? [];

            // 2. Python Analyze Uç Noktası
            $analyzeResponse = Http::withHeaders([
                'X-Internal-API-Key' => $apiKey,
                'Accept' => 'application/json',
            ])->timeout(60)->post("{$pythonUrl}/internal/websites/analyze", [
                'website_id' => $website->id,
                'scan_id' => $scan->id,
                'url' => $website->url,
                'pages' => $pages,
            ]);

            if (!$analyzeResponse->successful()) {
                $errorMsg = $analyzeResponse->json('detail') ?? $analyzeResponse->body() ?? 'Analiz işlemi başarısız oldu.';
                $scan->update(['status' => 'failed', 'error' => $errorMsg]);
                $website->update(['status' => 'active']);
                return;
            }

            $analyzeData = $analyzeResponse->json() ?? [];
            $scores = $analyzeData['scores'] ?? [];

            // 3. Scan Sonuçlarını Kaydet
            $scan->update([
                'status' => 'completed',
                'overall_score' => $analyzeData['overall_score'] ?? 0,
                'seo_score' => $scores['seo'] ?? 0,
                'security_score' => $scores['security'] ?? 0,
                'performance_score' => $scores['performance'] ?? 0,
                'accessibility_score' => $scores['accessibility'] ?? 0,
                'pages_crawled' => count($pages) ?: ($crawlData['pages_crawled'] ?? 1),
                'crawl_result' => $crawlData,
                'ai_summary' => $analyzeData['ai_summary'] ?? '',
                'ai_recommendations' => $analyzeData['ai_recommendations'] ?? [],
                'completed_at' => now(),
            ]);

            // 4. Bulunan Sorunları Kaydet
            foreach ($analyzeData['issues'] ?? [] as $issue) {
                WebsiteIssue::create([
                    'website_scan_id' => $scan->id,
                    'category' => $issue['category'] ?? 'general',
                    'severity' => $issue['severity'] ?? 'low',
                    'code' => $issue['code'] ?? null,
                    'message' => $issue['message'] ?? '',
                ]);
            }

            AuditReport::updateOrCreate(
                ['website_scan_id' => $scan->id],
                [
                    'overall_score' => $analyzeData['overall_score'] ?? null,
                    'total_issues' => $analyzeData['total_issues'] ?? count($analyzeData['issues'] ?? []),
                    'issues_by_severity' => $analyzeData['issues_by_severity'] ?? null,
                    'summary' => $analyzeData['ai_summary'] ?? null,
                    'recommendations' => $analyzeData['ai_recommendations'] ?? null,
                ]
            );

            foreach ($scores as $category => $score) {
                WebsiteMetric::updateOrCreate(
                    ['website_scan_id' => $scan->id, 'category' => $category],
                    ['score' => $score]
                );
            }

            $website->update(['status' => 'active']);
            Log::info("WebsiteScanJob başarıyla tamamlandı | Site: {$website->url} | Skor: {$scan->overall_score}");

        } catch (Throwable $e) {
            Log::error("WebsiteScanJob Hata: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            $scan->update(['status' => 'failed', 'error' => $e->getMessage()]);
            $website->update(['status' => 'active']);
        }
    }
}

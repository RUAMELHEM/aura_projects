<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Document;
use App\Models\Message;
use App\Models\Website;
use App\Models\WebsiteScan;
use App\Models\WebsiteIssue;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    /**
     * Dashboard Özeti ve Grafik Verileri
     * Tek bir istekte tüm sayaçları, günlük AI kullanımını, kategori sorunlarını ve son taramaları döner.
     */
    public function summary()
    {
        $docCount = Document::count();
        $aiQuestions = Message::where('sender', 'user')->count();
        $websiteCount = Website::count();
        $auditsCount = WebsiteScan::where('status', 'completed')->count();

        $highIssuesCount = WebsiteIssue::where('severity', 'high')->count();
        $averageAuditScore = WebsiteScan::where('status', 'completed')->avg('overall_score');

        // 1. Günlük AI Kullanım Grafiği (Son 7 gün)
        $days = collect(range(6, 0))->map(function ($i) {
            $dt = Carbon::now()->subDays($i);
            $date = $dt->format('Y-m-d');
            $label = $dt->locale('tr')->isoFormat('DD MMM');
            return [
                'date' => $date,
                'label' => $label,
                'questions' => 0,
                'answers' => 0,
            ];
        })->keyBy('date');

        $messages = Message::where('created_at', '>=', Carbon::now()->subDays(7))
            ->selectRaw('DATE(created_at) as msg_date, sender, count(*) as count')
            ->groupBy('msg_date', 'sender')
            ->get();

        foreach ($messages as $m) {
            $d = (string) $m->msg_date;
            if ($days->has($d)) {
                $item = $days->get($d);
                if ($m->sender === 'user') {
                    $item['questions'] = (int) $m->count;
                } else {
                    $item['answers'] = (int) $m->count;
                }
                $days->put($d, $item);
            }
        }
        $dailyAiUsage = $days->values()->all();

        // 2. Kategori Bazlı Sorun Dağılımı
        $typeLabels = [
            'security' => 'Güvenlik',
            'seo' => 'SEO',
            'performance' => 'Performans',
            'accessibility' => 'Erişilebilirlik',
        ];

        $categoryRaw = WebsiteIssue::selectRaw('category, count(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category')
            ->all();

        $issuesByCategory = [];
        foreach ($typeLabels as $type => $name) {
            $issuesByCategory[] = [
                'type' => $type,
                'category' => $name,
                'count' => isset($categoryRaw[$type]) ? (int) $categoryRaw[$type] : 0,
            ];
        }

        // 3. En Çok Referans Alınan Dokümanlar
        $topDocuments = Document::withCount('sources')
            ->orderBy('sources_count', 'desc')
            ->take(5)
            ->get(['id', 'title', 'file_name', 'file_type', 'page_count', 'status']);

        // 4. Son Taramalar
        $recentScans = WebsiteScan::with('website:id,name,title,url')
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get([
                'id',
                'website_id',
                'overall_score',
                'seo_score',
                'security_score',
                'performance_score',
                'accessibility_score',
                'created_at'
            ]);

        return response()->json([
            'documents_count' => $docCount,
            'ai_questions' => $aiQuestions,
            'websites' => $websiteCount,
            'audits' => $auditsCount,
            'users_count' => User::count(),
            'average_audit_score' => $averageAuditScore !== null ? round($averageAuditScore, 1) : null,
            'critical_issues_count' => $highIssuesCount,
            'daily_ai_usage' => $dailyAiUsage,
            'issues_by_category' => $issuesByCategory,
            'top_documents' => $topDocuments,
            'recent_scans' => $recentScans,
        ]);
    }
}

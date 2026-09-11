<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Website;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CrossAnalysisController extends Controller
{
    /**
     * Çapraz Analiz (Cross Intelligence)
     * Seçilen doküman kuralları ile web sitesi audit sonuçlarını karşılaştırır.
     */
    public function analyze(Request $request)
    {
        $request->validate([
            'website_id' => 'required|integer|exists:websites,id',
            'document_id' => 'nullable|integer|exists:documents,id',
            'query' => 'nullable|string|max:500',
        ]);

        $website = Website::with(['latestScan.issues'])->findOrFail($request->input('website_id'));
        $documentId = $request->input('document_id');
        $document = $documentId ? Document::find($documentId) : null;

        $latestScan = $website->latestScan;
        if (!$latestScan || $latestScan->status !== 'completed') {
            return response()->json([
                'message' => 'Bu web sitesi için henüz tamamlanmış bir tarama bulunmamaktadır. Lütfen önce taramayı tamamlayın.'
            ], 422);
        }

        $pythonUrl = rtrim(config('services.python.url', env('PYTHON_SERVICE_URL', 'http://python:8000')), '/');
        $apiKey = config('services.python.internal_key', env('PYTHON_INTERNAL_API_KEY', 'gizli-anahtar-12345'));

        // Python servisine iletilecek audit verisi
        $auditData = [
            'url' => $website->url,
            'website_name' => $website->name ?? $website->title,
            'overall_score' => $latestScan->overall_score ?? 0,
            'scores' => [
                'security' => $latestScan->security_score ?? 0,
                'seo' => $latestScan->seo_score ?? 0,
                'performance' => $latestScan->performance_score ?? 0,
                'accessibility' => $latestScan->accessibility_score ?? 0,
            ],
            'issues' => $latestScan->issues->map(function ($issue) {
                return [
                    'message' => $issue->message,
                    'severity' => $issue->severity,
                    'category' => $issue->category ?? $issue->type,
                ];
            })->toArray(),
        ];

        try {
            $response = Http::withHeaders([
                'X-Internal-API-Key' => $apiKey,
                'Accept' => 'application/json',
            ])->timeout(45)->post("{$pythonUrl}/internal/cross-intelligence/analyze", [
                'audit_data' => $auditData,
                'document_id' => $documentId,
                'query' => $request->input('query', 'web yayın standartları, kurumsal iletişim, açık adres, https güvenlik ve erişilebilirlik gereksinimleri'),
            ]);

            if (!$response->successful()) {
                Log::error('Cross intelligence request failed: ' . $response->body());
                return response()->json([
                    'message' => 'Çapraz analiz servisi yanıt vermedi: ' . ($response->json('detail') ?? $response->body()),
                ], 500);
            }

            $result = $response->json();
            $result['website'] = [
                'id' => $website->id,
                'name' => $website->name ?? $website->title,
                'url' => $website->url,
            ];
            $result['document'] = $document ? [
                'id' => $document->id,
                'title' => $document->title,
                'file_name' => $document->file_name,
            ] : null;
            $result['scan_id'] = $latestScan->id;

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Cross analysis exception: ' . $e->getMessage());
            return response()->json([
                'message' => 'Çapraz analiz sırasında sunucu hatası oluştu: ' . $e->getMessage(),
            ], 500);
        }
    }
}

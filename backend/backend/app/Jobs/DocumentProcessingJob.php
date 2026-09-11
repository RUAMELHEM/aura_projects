<?php

namespace App\Jobs;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class DocumentProcessingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Document $document
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // 1. Doküman durumunu 'processing' olarak güncelle
        $this->document->update([
            'status' => 'processing',
            'processing_error' => null,
        ]);

        $pythonUrl = rtrim(config('services.python.url', 'http://python:8000'), '/');
        $internalKey = config('services.python.internal_key', 'gizli-anahtar-12345');

        try {
            $response = Http::withHeaders([
                'X-Internal-API-Key' => $internalKey,
                'Accept' => 'application/json',
            ])->timeout(30)->post("{$pythonUrl}/internal/documents/process", [
                'document_id' => $this->document->id,
                'file_path' => $this->document->file_path,
            ]);

            if ($response->successful()) {
                $this->document->update([
                    'status' => 'processed',
                    'processing_error' => null,
                ]);
            } else {
                $errorDetail = $response->json('detail') ?? $response->body() ?? ('Python servisi hata döndürdü: HTTP ' . $response->status());
                $this->document->update([
                    'status' => 'failed',
                    'processing_error' => is_string($errorDetail) ? $errorDetail : json_encode($errorDetail),
                ]);
            }
        } catch (Throwable $e) {
            Log::error("Document processing failed for ID {$this->document->id}: " . $e->getMessage());
            $this->document->update([
                'status' => 'failed',
                'processing_error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(?Throwable $exception): void
    {
        $this->document->update([
            'status' => 'failed',
            'processing_error' => $exception ? $exception->getMessage() : 'Bilinmeyen işleme hatası',
        ]);
    }
}

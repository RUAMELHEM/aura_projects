<?php

namespace Tests\Feature;

use App\Jobs\DocumentProcessingJob;
use App\Models\Department;
use App\Models\Document;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentProcessingTest extends TestCase
{
    protected Department $dept;
    protected Role $calisanRole;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->dept = Department::firstOrCreate(['name' => 'Test Dept'], ['description' => 'Test']);
        $this->calisanRole = Role::firstOrCreate(['name' => 'calisan'], ['display_name' => 'Çalışan']);
    }

    private function createCalisan(): User
    {
        $user = User::factory()->create(['department_id' => $this->dept->id]);
        $user->roles()->attach($this->calisanRole);
        return $user;
    }

    /**
     * Dosya yüklendiğinde kullanıcı beklemeden 201 cevabı almalı
     * ve DocumentProcessingJob kuyruğa eklenmiş olmalı.
     */
    public function test_upload_immediately_returns_201_and_dispatches_job(): void
    {
        Queue::fake();

        $user = $this->createCalisan();
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->create('rapor.pdf', 500, 'application/pdf');

        $response = $this->postJson('/api/documents', [
            'title' => 'Test Raporu',
            'file' => $file,
        ]);

        // Kullanıcı anında 201 almalı — Python servisini BEKLEMEDİ
        $response->assertStatus(201);
        $response->assertJson(['status' => 'uploaded']);

        // Job kuyruğa eklenmiş olmalı
        Queue::assertPushed(DocumentProcessingJob::class, function ($job) use ($response) {
            return $job->document->id === $response->json('id');
        });
    }

    /**
     * Python servisi başarılı 200 döndürdüğünde doküman 'processed' olmalı.
     */
    public function test_job_sets_status_processed_when_python_returns_success(): void
    {
        Http::fake([
            '*/internal/documents/process' => Http::response([
                'message' => 'Document received',
                'document_id' => 1,
                'status' => 'accepted',
            ], 200),
        ]);

        $user = $this->createCalisan();

        $document = Document::create([
            'user_id' => $user->id,
            'title' => 'İşlenecek Doküman',
            'file_name' => 'test.pdf',
            'file_path' => 'documents/test.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 1024,
            'status' => 'uploaded',
        ]);

        // Job'ı doğrudan çalıştır (sync)
        (new DocumentProcessingJob($document))->handle();

        $document->refresh();
        $this->assertEquals('processed', $document->status);
        $this->assertNull($document->processing_error);
    }

    /**
     * Python servisi kapalıyken (connection refused) job 'failed' durumuna düşmeli
     * ve hatayı processing_error alanına kaydetmeli.
     */
    public function test_job_sets_status_failed_when_python_service_is_down(): void
    {
        Http::fake([
            '*/internal/documents/process' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('Connection refused');
            },
        ]);

        $user = $this->createCalisan();

        $document = Document::create([
            'user_id' => $user->id,
            'title' => 'Hata Dokümanı',
            'file_name' => 'error.pdf',
            'file_path' => 'documents/error.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 1024,
            'status' => 'uploaded',
        ]);

        try {
            (new DocumentProcessingJob($document))->handle();
        } catch (\Throwable $e) {
            // Job exception fırlatır — queue worker bunu yakalar ve failed() çağırır
        }

        $document->refresh();
        $this->assertEquals('failed', $document->status);
        $this->assertNotNull($document->processing_error);
        $this->assertStringContainsString('Connection refused', $document->processing_error);
    }

    /**
     * Python servisi 401 döndürdüğünde (yanlış API anahtarı) job 'failed' olmalı.
     */
    public function test_job_sets_status_failed_when_python_returns_401(): void
    {
        Http::fake([
            '*/internal/documents/process' => Http::response(['detail' => 'Unauthorized'], 401),
        ]);

        $user = $this->createCalisan();

        $document = Document::create([
            'user_id' => $user->id,
            'title' => 'Yetkisiz Doküman',
            'file_name' => 'unauth.pdf',
            'file_path' => 'documents/unauth.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 1024,
            'status' => 'uploaded',
        ]);

        (new DocumentProcessingJob($document))->handle();

        $document->refresh();
        $this->assertEquals('failed', $document->status);
        $this->assertNotNull($document->processing_error);
    }

    /**
     * Ekstra: Job sınıfının doğru konfigürasyona (tries, timeout) sahip olduğunu doğrula.
     */
    public function test_job_has_correct_retry_and_timeout_config(): void
    {
        $user = $this->createCalisan();
        $document = Document::create([
            'user_id' => $user->id,
            'title' => 'Config Test',
            'file_name' => 'cfg.pdf',
            'file_path' => 'documents/cfg.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 512,
            'status' => 'uploaded',
        ]);

        $job = new DocumentProcessingJob($document);

        $this->assertEquals(3, $job->tries);
        $this->assertEquals(60, $job->timeout);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Document;
use App\Models\Role;
use App\Models\User;
use App\Jobs\DocumentProcessingJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentTest extends TestCase
{
    protected Department $deptA;
    protected Department $deptB;
    protected Role $adminRole;
    protected Role $yoneticiRole;
    protected Role $calisanRole;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->deptA = Department::firstOrCreate(['name' => 'Bilgi İşlem'], ['description' => 'IT Dept']);
        $this->deptB = Department::firstOrCreate(['name' => 'İnsan Kaynakları'], ['description' => 'HR Dept']);

        $this->adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Sistem Yöneticisi']);
        $this->yoneticiRole = Role::firstOrCreate(['name' => 'kurum_yoneticisi'], ['display_name' => 'Kurum Yöneticisi']);
        $this->calisanRole = Role::firstOrCreate(['name' => 'calisan'], ['display_name' => 'Çalışan']);
    }

    private function createUserWithRole(string $roleName, Department $dept): User
    {
        $user = User::factory()->create([
            'department_id' => $dept->id,
        ]);
        $role = Role::where('name', $roleName)->first();
        $user->roles()->attach($role);
        return $user;
    }

    public function test_authenticated_user_can_upload_valid_pdf(): void
    {
        Queue::fake(); // Job gerçekten çalışmasın, sadece kuyruğa eklensin

        $user = $this->createUserWithRole('calisan', $this->deptA);
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->create('ornek_rapor.pdf', 500, 'application/pdf');

        $response = $this->postJson('/api/documents', [
            'title' => 'Yıllık Denetim Raporu',
            'file' => $file,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'user_id',
                'title',
                'file_name',
                'file_path',
                'file_type',
                'file_size',
                'status',
            ])
            ->assertJson([
                'user_id' => $user->id,
                'title' => 'Yıllık Denetim Raporu',
                'file_name' => 'ornek_rapor.pdf',
                'status' => 'uploaded',
            ]);

        $this->assertDatabaseHas('documents', [
            'user_id' => $user->id,
            'title' => 'Yıllık Denetim Raporu',
            'file_name' => 'ornek_rapor.pdf',
            'status' => 'uploaded',
        ]);

        $doc = Document::find($response->json('id'));
        Storage::disk('local')->assertExists($doc->file_path);
    }

    public function test_upload_rejects_unallowed_file_type(): void
    {
        $user = $this->createUserWithRole('calisan', $this->deptA);
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->create('virus.exe', 100, 'application/x-msdownload');

        $response = $this->postJson('/api/documents', [
            'title' => 'Tehlikeli Dosya',
            'file' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_upload_rejects_file_larger_than_10mb(): void
    {
        $user = $this->createUserWithRole('calisan', $this->deptA);
        Sanctum::actingAs($user);

        // 11 MB (11264 KB) > 10 MB limit
        $file = UploadedFile::fake()->create('huge_file.pdf', 11264, 'application/pdf');

        $response = $this->postJson('/api/documents', [
            'title' => 'Çok Büyük Dosya',
            'file' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_document_listing_respects_roles_and_departments(): void
    {
        $userA1 = $this->createUserWithRole('calisan', $this->deptA);
        $userA2 = $this->createUserWithRole('calisan', $this->deptA);
        $yoneticiA = $this->createUserWithRole('kurum_yoneticisi', $this->deptA);
        $userB = $this->createUserWithRole('calisan', $this->deptB);
        $admin = $this->createUserWithRole('admin', $this->deptA);

        $docA1 = Document::create([
            'user_id' => $userA1->id,
            'title' => 'Doc A1',
            'file_name' => 'a1.pdf',
            'file_path' => 'documents/a1.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 100,
            'status' => 'uploaded',
        ]);

        $docA2 = Document::create([
            'user_id' => $userA2->id,
            'title' => 'Doc A2',
            'file_name' => 'a2.pdf',
            'file_path' => 'documents/a2.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 100,
            'status' => 'uploaded',
        ]);

        $docB = Document::create([
            'user_id' => $userB->id,
            'title' => 'Doc B',
            'file_name' => 'b.pdf',
            'file_path' => 'documents/b.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 100,
            'status' => 'uploaded',
        ]);

        // 1. Normal Çalışan sadece kendi dokümanını görür
        Sanctum::actingAs($userA1);
        $res = $this->getJson('/api/documents');
        $res->assertStatus(200);
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($docA1->id, $ids);
        $this->assertNotContains($docA2->id, $ids);
        $this->assertNotContains($docB->id, $ids);

        // 2. Kurum Yöneticisi kendi departmanındaki dokümanları görür
        Sanctum::actingAs($yoneticiA);
        $res = $this->getJson('/api/documents');
        $res->assertStatus(200);
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($docA1->id, $ids);
        $this->assertContains($docA2->id, $ids);
        $this->assertNotContains($docB->id, $ids);

        // 3. Admin tüm dokümanları görür
        Sanctum::actingAs($admin);
        $res = $this->getJson('/api/documents');
        $res->assertStatus(200);
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($docA1->id, $ids);
        $this->assertContains($docA2->id, $ids);
        $this->assertContains($docB->id, $ids);
    }

    public function test_user_cannot_view_download_or_delete_unauthorized_document(): void
    {
        $userA = $this->createUserWithRole('calisan', $this->deptA);
        $userB = $this->createUserWithRole('calisan', $this->deptB);

        $fakePath = 'documents/sample.pdf';
        Storage::disk('local')->put($fakePath, 'sample content');

        $docA = Document::create([
            'user_id' => $userA->id,
            'title' => 'Gizli Belge A',
            'file_name' => 'gizli.pdf',
            'file_path' => $fakePath,
            'file_type' => 'application/pdf',
            'file_size' => 100,
            'status' => 'uploaded',
        ]);

        // User B, User A'nın dokümanını görüntüleyemez, indiremez, silemez (403 Forbidden)
        Sanctum::actingAs($userB);
        $this->getJson("/api/documents/{$docA->id}")->assertStatus(403);
        $this->getJson("/api/documents/{$docA->id}/download")->assertStatus(403);
        $this->deleteJson("/api/documents/{$docA->id}")->assertStatus(403);

        // User A kendi dokümanını görüntüleyebilir, indirebilir ve silebilir
        Sanctum::actingAs($userA);
        $this->getJson("/api/documents/{$docA->id}")->assertStatus(200);
        $this->getJson("/api/documents/{$docA->id}/download")->assertStatus(200);
        $this->deleteJson("/api/documents/{$docA->id}")->assertStatus(200);

        $this->assertDatabaseMissing('documents', ['id' => $docA->id]);
    }
}

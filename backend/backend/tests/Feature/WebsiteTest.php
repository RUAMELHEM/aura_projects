<?php

namespace Tests\Feature;

use App\Jobs\WebsiteScanJob;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use App\Models\Website;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WebsiteTest extends TestCase
{
    protected Department $deptA;
    protected Department $deptB;
    protected Role $adminRole;
    protected Role $yoneticiRole;
    protected Role $calisanRole;

    protected function setUp(): void
    {
        parent::setUp();

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

    public function test_rejects_localhost_and_private_ip_urls(): void
    {
        $user = $this->createUserWithRole('calisan', $this->deptA);
        Sanctum::actingAs($user);

        $this->postJson('/api/websites', ['url' => 'http://localhost/admin'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['url']);

        $this->postJson('/api/websites', ['url' => 'http://127.0.0.1/'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['url']);

        $this->postJson('/api/websites', ['url' => 'http://192.168.1.1/router'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['url']);

        $this->postJson('/api/websites', ['url' => 'http://10.0.0.5/secret'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['url']);

        $this->postJson('/api/websites', ['url' => 'http://169.254.169.254/latest/meta-data/'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    public function test_authenticated_user_can_add_public_website(): void
    {
        $user = $this->createUserWithRole('calisan', $this->deptA);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/websites', [
            'url' => 'https://example.com',
            'name' => 'Example',
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'url' => 'https://example.com',
                'name' => 'Example',
                'user_id' => $user->id,
                'department_id' => $this->deptA->id,
            ]);
    }

    public function test_user_cannot_view_other_department_website(): void
    {
        $userA = $this->createUserWithRole('calisan', $this->deptA);
        $userB = $this->createUserWithRole('calisan', $this->deptB);

        $siteA = Website::create([
            'user_id' => $userA->id,
            'department_id' => $this->deptA->id,
            'url' => 'https://site-a.example.com',
            'name' => 'Site A',
        ]);

        Sanctum::actingAs($userB);
        $this->getJson("/api/websites/{$siteA->id}")->assertStatus(403);
        $this->postJson("/api/websites/{$siteA->id}/scan")->assertStatus(403);
        $this->getJson("/api/websites/{$siteA->id}/scans")->assertStatus(403);

        Sanctum::actingAs($userA);
        $this->getJson("/api/websites/{$siteA->id}")->assertStatus(200);
    }

    public function test_user_can_view_authorized_scan_details_but_not_other_department_scan(): void
    {
        $userA = $this->createUserWithRole('calisan', $this->deptA);
        $userB = $this->createUserWithRole('calisan', $this->deptB);
        $siteA = Website::create([
            'user_id' => $userA->id,
            'department_id' => $this->deptA->id,
            'url' => 'https://site-a.example.com',
            'name' => 'Site A',
        ]);
        $scan = $siteA->scans()->create([
            'status' => 'completed',
            'overall_score' => 82,
            'seo_score' => 80,
            'security_score' => 90,
            'performance_score' => 75,
            'accessibility_score' => 83,
        ]);

        Sanctum::actingAs($userA);
        $this->getJson("/api/scans/{$scan->id}")
            ->assertOk()
            ->assertJsonPath('id', $scan->id)
            ->assertJsonPath('overall_score', 82)
            ->assertJsonPath('website.id', $siteA->id)
            ->assertJsonStructure(['issues']);

        Sanctum::actingAs($userB);
        $this->getJson("/api/scans/{$scan->id}")->assertForbidden();
    }

    public function test_scan_transitions_pending_running_completed(): void
    {
        config(['queue.default' => 'sync']);

        Http::fake([
            '*/internal/websites/crawl' => Http::response([
                'base_url' => 'https://example.com',
                'pages_crawled' => 1,
                'total_pages_found' => 1,
                'crawl_time_seconds' => 0.1,
                'error' => null,
                'pages' => [
                    [
                        'url' => 'https://example.com',
                        'status_code' => 200,
                        'response_time_ms' => 12.5,
                        'content_type' => 'text/html',
                        'title' => 'Example',
                        'error' => null,
                    ],
                ],
            ], 200),
            '*/internal/websites/analyze' => Http::response([
                'status' => 'accepted',
                'pages_analyzed' => 1,
                'overall_score' => 82,
                'scores' => ['seo' => 80, 'security' => 90, 'performance' => 75, 'accessibility' => 83],
                'total_issues' => 1,
                'issues_by_severity' => ['high' => 1, 'medium' => 0, 'low' => 0],
                'issues' => [[
                    'category' => 'security', 'severity' => 'high',
                    'code' => 'missing_csp', 'message' => 'CSP header eksik.',
                ]],
                'ai_summary' => 'Test özeti',
                'ai_recommendations' => ['CSP eklenmeli.'],
            ], 200),
        ]);

        $user = $this->createUserWithRole('calisan', $this->deptA);
        Sanctum::actingAs($user);

        $website = Website::create([
            'user_id' => $user->id,
            'department_id' => $this->deptA->id,
            'url' => 'https://example.com',
            'name' => 'Example',
        ]);

        $response = $this->postJson("/api/websites/{$website->id}/scan");
        $response->assertStatus(202);

        $scanId = $response->json('id');
        $this->assertNotNull($scanId);

        $scan = $website->scans()->find($scanId);
        $this->assertContains($scan->status, ['pending', 'running', 'completed']);

        // phpunit.xml QUEUE_CONNECTION=sync → job hemen çalışır
        $scan->refresh();
        $this->assertSame('completed', $scan->status);
        $this->assertSame(1, $scan->pages_crawled);
        $this->assertNotNull($scan->crawl_result);
        $this->assertNotNull($scan->completed_at);
        $this->assertDatabaseHas('audit_reports', [
            'website_scan_id' => $scan->id,
            'overall_score' => 82,
            'total_issues' => 1,
        ]);
        $this->assertDatabaseHas('website_metrics', [
            'website_scan_id' => $scan->id,
            'category' => 'security',
            'score' => 90,
        ]);

        $this->getJson("/api/websites/{$website->id}/scans")
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $scanId, 'status' => 'completed']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/internal/websites/crawl');
        });
        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/internal/websites/analyze');
        });
    }

    public function test_scan_is_queued_when_queue_is_async(): void
    {
        Queue::fake();

        $user = $this->createUserWithRole('calisan', $this->deptA);
        Sanctum::actingAs($user);

        $website = Website::create([
            'user_id' => $user->id,
            'department_id' => $this->deptA->id,
            'url' => 'https://example.org',
            'name' => 'Example Org',
        ]);

        $this->postJson("/api/websites/{$website->id}/scan")
            ->assertStatus(202)
            ->assertJsonFragment(['status' => 'pending']);

        Queue::assertPushed(WebsiteScanJob::class);
    }
}

<?php

namespace Tests\Unit;

use App\Services\UrlSafetyService;
use Tests\TestCase;

class UrlSafetyServiceTest extends TestCase
{
    private UrlSafetyService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new UrlSafetyService();
    }

    public function test_blocks_private_and_loopback_targets(): void
    {
        $blocked = [
            'http://localhost',
            'http://127.0.0.1/',
            'http://10.1.2.3/x',
            'http://172.16.0.9/',
            'http://192.168.0.1/',
            'http://169.254.169.254/latest/meta-data/',
        ];

        foreach ($blocked as $url) {
            [$allowed, $reason] = $this->service->inspect($url);
            $this->assertFalse($allowed, $url);
            $this->assertNotSame('', $reason);
        }
    }

    public function test_allows_public_https_url_without_private_dns(): void
    {
        [$allowed, $reason] = $this->service->inspect('https://example.com/about');
        $this->assertTrue($allowed, $reason);
        $this->assertSame('', $reason);
    }
}

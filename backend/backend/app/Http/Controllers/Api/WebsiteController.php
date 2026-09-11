<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Website;
use App\Models\WebsiteScan;
use App\Jobs\WebsiteScanJob;
use App\Services\UrlSafetyService;
use Illuminate\Http\Request;

class WebsiteController extends Controller
{
    protected UrlSafetyService $urlSafety;

    public function __construct(UrlSafetyService $urlSafety)
    {
        $this->urlSafety = $urlSafety;
    }

    private function resolveWebsite($website): Website
    {
        if ($website instanceof Website) {
            return $website;
        }
        return Website::findOrFail($website);
    }

    private function authorizeWebsiteAccess($user, Website $website): bool
    {
        if (!$user) {
            return true;
        }

        if ($user->roles && $user->roles->contains('name', 'admin')) {
            return true;
        }

        if ($website->department_id && $user->department_id) {
            return $website->department_id === $user->department_id;
        }

        return $website->user_id === $user->id;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Website::query()->with(['latestScan']);

        if ($user) {
            if (!$user->roles || !$user->roles->contains('name', 'admin')) {
                if ($user->department_id) {
                    $query->where('department_id', $user->department_id);
                } else {
                    $query->where('user_id', $user->id);
                }
            }
        }

        $websites = $query->orderBy('created_at', 'desc')->get();
        return response()->json($websites);
    }

    public function store(Request $request)
    {
        $request->validate([
            'url' => ['required', 'url', $this->urlSafety->validationRule('url')],
            'name' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $userId = $user ? $user->id : 1;
        $deptId = $user ? $user->department_id : null;

        $url = rtrim($request->input('url'), '/');
        $host = parse_url($url, PHP_URL_HOST);
        $name = $request->input('name') ?: ($request->input('title') ?: $host);

        $website = Website::create([
            'user_id' => $userId,
            'department_id' => $deptId,
            'name' => $name,
            'title' => $request->input('title', $name),
            'url' => $url,
            'status' => 'active',
        ]);

        return response()->json($website->load('latestScan'), 201);
    }

    public function show(Request $request, $website)
    {
        $site = $this->resolveWebsite($website);

        if (!$this->authorizeWebsiteAccess($request->user(), $site)) {
            return response()->json(['message' => 'Bu web sitesini görüntüleme yetkiniz yok.'], 403);
        }

        return response()->json($site->load(['scans.issues', 'scans.auditReport', 'scans.metrics']));
    }

    public function startScan(Request $request, $website)
    {
        $site = $this->resolveWebsite($website);

        if (!$this->authorizeWebsiteAccess($request->user(), $site)) {
            return response()->json(['message' => 'Bu web sitesini tarama yetkiniz yok.'], 403);
        }

        $this->urlSafety->assertSafe($site->url);

        $scan = WebsiteScan::create([
            'website_id' => $site->id,
            'status' => 'pending',
        ]);

        WebsiteScanJob::dispatch($site, $scan);

        return response()->json([
            'id' => $scan->id,
            'status' => 'pending',
            'message' => 'Tarama başlatıldı.',
        ], 202);
    }

    public function scans(Request $request, $website)
    {
        $site = $this->resolveWebsite($website);

        if (!$this->authorizeWebsiteAccess($request->user(), $site)) {
            return response()->json(['message' => 'Bu web sitesinin taramalarını görüntüleme yetkiniz yok.'], 403);
        }

        return response()->json($site->scans()->get());
    }

    public function getScanDetails(Request $request, $scanId)
    {
        $scan = WebsiteScan::with(['website', 'issues', 'auditReport', 'metrics'])->findOrFail($scanId);

        if (!$this->authorizeWebsiteAccess($request->user(), $scan->website)) {
            return response()->json(['message' => 'Bu tarama sonucunu görüntüleme yetkiniz yok.'], 403);
        }

        return response()->json($scan);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Document;
use App\Models\Website;
use App\Models\WebsiteScan;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ManagerController extends Controller
{
    /**
     * Get all users in the manager's department
     */
    public function getUsers(Request $request)
    {
        $user = $request->user();
        
        $users = User::with(['roles', 'department'])
            ->where('department_id', $user->department_id)
            ->get();
            
        return response()->json($users);
    }

    /**
     * Get department statistics for the manager dashboard charts
     */
    public function getStats(Request $request)
    {
        $user = $request->user();
        $departmentId = $user->department_id;

        // Total users in department
        $totalUsers = User::where('department_id', $departmentId)->count();

        // Total documents in department
        $totalDocuments = Document::whereHas('user', function($q) use ($departmentId) {
            $q->where('department_id', $departmentId);
        })->count();

        // Total websites in department
        $totalWebsites = Website::where('department_id', $departmentId)->count();
        
        // Total scans in department
        $totalScans = WebsiteScan::whereHas('website', function($q) use ($departmentId) {
            $q->where('department_id', $departmentId);
        })->count();

        // Weekly activity (scans per day for the last 7 days)
        $last7Days = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            
            $scanCount = WebsiteScan::whereHas('website', function($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            })
            ->whereDate('created_at', $date)
            ->count();
            
            $docCount = Document::whereHas('user', function($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            })
            ->whereDate('created_at', $date)
            ->count();
            
            $last7Days->push([
                'date' => Carbon::now()->subDays($i)->format('d M'),
                'scans' => $scanCount,
                'documents' => $docCount
            ]);
        }

        return response()->json([
            'summary' => [
                'users' => $totalUsers,
                'documents' => $totalDocuments,
                'websites' => $totalWebsites,
                'scans' => $totalScans,
            ],
            'chart_data' => $last7Days
        ]);
    }
}

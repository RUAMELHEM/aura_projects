<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class SetupController extends Controller
{
    /**
     * Sistemde hiç admin olup olmadığını kontrol eder.
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function status()
    {
        $hasAdmin = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->exists();

        return response()->json([
            'needsSetup' => !$hasAdmin,
        ]);
    }

    /**
     * Eğer sistemde admin yoksa, isteği yapan kullanıcıya admin (ve manager) rollerini atar.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function claim(Request $request)
    {
        $hasAdmin = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->exists();

        if ($hasAdmin) {
            return response()->json([
                'error' => 'Sistemde halihazırda bir yönetici bulunuyor. Setup işlemi yapılamaz.'
            ], 403);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json([
                'error' => 'Kimlik doğrulama başarısız.'
            ], 401);
        }

        try {
            // Spatie laravel-permission kullanıldığı varsayılmıştır
            $user->assignRole('admin');
            $user->assignRole('manager');

            Log::info("Kullanıcı {$user->email} sistemi kurdu ve ilk yönetici oldu.");

            return response()->json([
                'message' => 'Tebrikler! Sistem yöneticisi oldunuz.',
                'user' => $user->load('roles', 'department')
            ]);
        } catch (\Exception $e) {
            Log::error("Setup işlemi sırasında hata: " . $e->getMessage());
            return response()->json([
                'error' => 'Yönetici rolü atanırken bir sorun oluştu.'
            ], 500);
        }
    }
}

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\WebsiteController;
use App\Http\Controllers\Api\ManagerController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CrossAnalysisController;
use App\Http\Controllers\Api\SetupController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [RegisterController::class, 'store']);
Route::post('/login', [LoginController::class, 'store']);
Route::get('/departments', [DepartmentController::class, 'index']);
Route::get('/system/setup-status', [SetupController::class, 'status']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [LogoutController::class, 'destroy']);
    
    Route::get('/user', function (Request $request) {
        return $request->user()->load('roles', 'department');
    });

    // Kullanıcı & Yönetim Rotaları
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::get('/roles', [RoleController::class, 'index']);
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::post('/system/setup', [SetupController::class, 'claim']);

    // Doküman Rotaları
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents/{document}', [DocumentController::class, 'show']);
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);

    // Sohbet (Chat & RAG) Rotaları
    Route::get('/conversations', [ChatController::class, 'index']);
    Route::post('/conversations', [ChatController::class, 'store']);
    Route::get('/conversations/{id}', [ChatController::class, 'show']);
    Route::post('/conversations/{id}/messages', [ChatController::class, 'sendMessage']);

    // Website & Denetim Rotaları
    Route::get('/websites', [WebsiteController::class, 'index']);
    Route::post('/websites', [WebsiteController::class, 'store']);
    Route::get('/websites/{website}', [WebsiteController::class, 'show']);
    Route::post('/websites/{website}/scan', [WebsiteController::class, 'startScan']);
    Route::get('/websites/{website}/scans', [WebsiteController::class, 'scans']);
    Route::get('/scans/{scanId}', [WebsiteController::class, 'getScanDetails']);

    // Çapraz Analiz (Cross Intelligence)
    Route::post('/cross-analysis', [CrossAnalysisController::class, 'analyze']);

    // Kurum Yöneticisi Rotaları
    Route::middleware('role:kurum_yoneticisi')->group(function () {
        Route::get('/manager/users', [ManagerController::class, 'getUsers']);
        Route::get('/manager/stats', [ManagerController::class, 'getStats']);
    });

    // Admin Rotaları — Sadece 'admin' rolüne sahip kullanıcılar erişebilir
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users', [AdminController::class, 'listUsers']);       // Tüm kullanıcıları listele
        Route::get('/admin/roles', [AdminController::class, 'listRoles']);       // Tüm rolleri listele
        Route::post('/admin/users/{user}/roles', [AdminController::class, 'assignRole']);   // Rol ata
        Route::delete('/admin/users/{user}/roles', [AdminController::class, 'removeRole']); // Rol kaldır
    });
});

// Test / Webhook / Dev amaçlı açık sohbet ve website rotaları
Route::get('/open/conversations', [ChatController::class, 'index']);
Route::post('/open/conversations', [ChatController::class, 'store']);
Route::get('/open/conversations/{id}', [ChatController::class, 'show']);
Route::post('/open/conversations/{id}/messages', [ChatController::class, 'sendMessage']);

Route::get('/open/websites', [WebsiteController::class, 'index']);
Route::post('/open/websites', [WebsiteController::class, 'store']);
Route::get('/open/websites/{id}', [WebsiteController::class, 'show']);
Route::post('/open/websites/{id}/scan', [WebsiteController::class, 'startScan']);
Route::get('/open/scans/{scanId}', [WebsiteController::class, 'getScanDetails']);



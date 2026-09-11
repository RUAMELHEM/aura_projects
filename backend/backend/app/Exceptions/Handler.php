<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        // Global Exception Handler — Tutarlı JSON Hata Formatı
        $this->renderable(function (Throwable $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                // 1. Dosya Boyut Aşımı (422)
                if ($e instanceof PostTooLargeException) {
                    return response()->json([
                        'code' => 422,
                        'message' => 'Dosya boyutu en fazla 10 MB olabilir.',
                        'errors' => [
                            'file' => ['Dosya boyutu en fazla 10 MB olabilir.']
                        ]
                    ], 422);
                }

                // 2. Doğrulama Hataları (422)
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'code' => 422,
                        'message' => 'Gönderilen veriler doğrulanamadı.',
                        'errors' => $e->errors(),
                    ], 422);
                }

                // 3. Kimlik Doğrulama / Giriş Hatası (401)
                if ($e instanceof AuthenticationException) {
                    return response()->json([
                        'code' => 401,
                        'message' => 'Oturum açmanız gerekiyor. Lütfen giriş yapın.',
                    ], 401);
                }

                // 4. Yetkisiz Erişim / İzin Hatası (403)
                if ($e instanceof AuthorizationException || $e instanceof AccessDeniedHttpException) {
                    Log::warning('Yetkisiz erişim denemesi tespit edildi', [
                        'user_id' => $request->user()?->id,
                        'ip' => $request->ip(),
                        'url' => $request->fullUrl(),
                        'method' => $request->method(),
                        'error' => $e->getMessage(),
                    ]);

                    return response()->json([
                        'code' => 403,
                        'message' => $e->getMessage() ?: 'Bu işlem için yetkiniz bulunmamaktadır.',
                    ], 403);
                }

                // 5. Kaynak Bulunamadı (404)
                if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                    return response()->json([
                        'code' => 404,
                        'message' => 'İstenen kaynak veya kayıt bulunamadı.',
                    ], 404);
                }

                // 6. İstek Sınırı / Throttle (429)
                if ($e instanceof ThrottleRequestsException) {
                    return response()->json([
                        'code' => 429,
                        'message' => 'Çok fazla istek gönderildi. Lütfen bir süre bekleyin.',
                    ], 429);
                }

                // 7. Diğer HTTP Hataları
                if ($e instanceof HttpExceptionInterface) {
                    return response()->json([
                        'code' => $e->getStatusCode(),
                        'message' => $e->getMessage() ?: 'Bir HTTP hatası oluştu.',
                    ], $e->getStatusCode());
                }

                // 8. Beklenmeyen Sunucu Hataları (500)
                Log::error('API Sunucu Hatası: ' . $e->getMessage(), [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);

                return response()->json([
                    'code' => 500,
                    'message' => config('app.debug') ? $e->getMessage() : 'Sunucu kaynaklı bir hata oluştu.',
                ], 500);
            }
        });
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\AiSource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * Kullanıcının tüm konuşmalarını listeler.
     */
    public function index(Request $request)
    {
        $userId = $request->user() ? $request->user()->id : 1; // Fallback for tests/local

        $conversations = Conversation::where('user_id', $userId)
            ->withCount('messages')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($conversations);
    }

    /**
     * Yeni bir konuşma oluşturur.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
        ]);

        $userId = $request->user() ? $request->user()->id : 1;

        $conversation = Conversation::create([
            'user_id' => $userId,
            'title' => $request->input('title', 'Yeni Sohbet'),
        ]);

        return response()->json($conversation, 201);
    }

    /**
     * Belirli bir konuşmanın detayını ve mesaj geçmişini getirir.
     */
    public function show(Request $request, $id)
    {
        $userId = $request->user() ? $request->user()->id : 1;

        $conversation = Conversation::where('user_id', $userId)
            ->where('id', $id)
            ->with(['messages.sources.document'])
            ->firstOrFail();

        return response()->json($conversation);
    }

    /**
     * Konuşmaya mesaj gönderir ve Python RAG servisinden yanıt alıp kaydeder.
     */
    public function sendMessage(Request $request, $id)
    {
        $request->validate([
            'content' => 'required|string',
            'document_id' => 'nullable|integer',
        ]);

        $userId = $request->user() ? $request->user()->id : 1;

        $conversation = Conversation::where('user_id', $userId)
            ->where('id', $id)
            ->firstOrFail();

        $userContent = $request->input('content');
        $documentId = $request->input('document_id');

        // 1. Kullanıcı mesajını kaydet
        $userMessage = Message::create([
            'conversation_id' => $conversation->id,
            'sender' => 'user',
            'content' => $userContent,
        ]);

        // İlk mesaj ise konuşma başlığını güncelle
        if ($conversation->messages()->count() <= 1 && $conversation->title === 'Yeni Sohbet') {
            $conversation->update([
                'title' => mb_substr($userContent, 0, 40) . (mb_strlen($userContent) > 40 ? '...' : '')
            ]);
        }

        // 2. Python RAG servisine istek at
        $pythonUrl = env('PYTHON_SERVICE_URL', 'http://python:8000');
        $apiKey = env('PYTHON_INTERNAL_API_KEY', 'gizli-anahtar-12345');

        try {
            $response = Http::withHeaders([
                'X-Internal-API-Key' => $apiKey,
            ])->timeout(30)->post("{$pythonUrl}/internal/rag/answer", [
                'query' => $userContent,
                'document_id' => $documentId,
                'top_k' => 4,
                'similarity_threshold' => 0.35,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $aiAnswer = $data['answer'] ?? 'Cevap üretilemedi.';
                $sources = $data['sources'] ?? [];

                // 3. AI mesajını kaydet
                $aiMessage = Message::create([
                    'conversation_id' => $conversation->id,
                    'sender' => 'ai',
                    'content' => $aiAnswer,
                ]);

                // 4. Kaynakları kaydet
                foreach ($sources as $src) {
                    AiSource::create([
                        'message_id' => $aiMessage->id,
                        'document_id' => $src['document_id'] ?? null,
                        'chunk_index' => $src['chunk_index'] ?? 0,
                        'similarity_score' => $src['similarity_score'] ?? 0.0,
                        'snippet' => $src['text'] ?? '',
                    ]);
                }

                $conversation->touch(); // Updated at güncelle

                return response()->json([
                    'user_message' => $userMessage,
                    'ai_message' => $aiMessage->load('sources.document'),
                ], 201);
            } else {
                Log::error("Python RAG servisi hata döndü: " . $response->body());
                $aiMessage = Message::create([
                    'conversation_id' => $conversation->id,
                    'sender' => 'ai',
                    'content' => 'Üzgünüm, AI servisine bağlanırken bir hata oluştu.',
                ]);

                return response()->json([
                    'user_message' => $userMessage,
                    'ai_message' => $aiMessage,
                ], 201);
            }
        } catch (\Exception $e) {
            Log::error("Python RAG servisi çağrı hatası: " . $e->getMessage());
            $aiMessage = Message::create([
                'conversation_id' => $conversation->id,
                'sender' => 'ai',
                'content' => 'AI servisine ulaşılamıyor: ' . $e->getMessage(),
            ]);

            return response()->json([
                'user_message' => $userMessage,
                'ai_message' => $aiMessage,
            ], 201);
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Jobs\DocumentProcessingJob;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    /**
     * Dokümanları listele (Rol ve yetkiye göre filtrelenmiş).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasRole('admin')) {
            $documents = Document::with('user:id,name,email,department_id')->latest()->get();
        } elseif ($user->hasRole('kurum_yoneticisi')) {
            $documents = Document::whereHas('user', function ($query) use ($user) {
                $query->where('department_id', $user->department_id);
            })->with('user:id,name,email,department_id')->latest()->get();
        } else {
            $documents = Document::where('user_id', $user->id)->latest()->get();
        }

        return response()->json($documents, 200);
    }

    /**
     * Yeni doküman yükle.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,docx,xlsx|max:10240', // 10240 KB = 10 MB
        ], [
            'file.mimes' => 'Yalnızca PDF, DOCX ve XLSX formatındaki dosyalar yüklenebilir.',
            'file.max' => 'Dosya boyutu en fazla 10 MB olabilir.',
            'title.required' => 'Doküman başlığı zorunludur.',
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension() ?: $file->extension();
        $randomFileName = Str::uuid()->toString() . '.' . $extension;

        // Dosyayı storage/app/documents klasörüne rastgele UUID ismiyle kaydet
        $path = $file->storeAs('documents', $randomFileName, 'local');

        $document = Document::create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $file->getClientMimeType() ?: $file->getMimeType(),
            'file_size' => $file->getSize(),
            'status' => 'uploaded',
        ]);

        // Doküman işleme sürecini asenkron olarak kuyruğa (Queue) ekle
        DocumentProcessingJob::dispatch($document);

        return response()->json($document, 201);
    }

    /**
     * Tekil doküman detayını görüntüle.
     */
    public function show(Request $request, Document $document): JsonResponse
    {
        $this->authorize('view', $document);

        return response()->json($document->load('user:id,name,email,department_id'), 200);
    }

    /**
     * Doküman dosyasını indir.
     */
    public function download(Request $request, Document $document): StreamedResponse|JsonResponse
    {
        $this->authorize('view', $document);

        if (!Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['message' => 'Dosya fiziksel depolamada bulunamadı.'], 404);
        }

        return Storage::disk('local')->download($document->file_path, $document->file_name);
    }

    /**
     * Dokümanı ve fiziksel dosyasını sil.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $document = Document::find($id);
        if (!$document) {
            return response()->json(['message' => 'Doküman zaten silinmiş veya bulunamadı.'], 200);
        }

        $this->authorize('delete', $document);

        if (Storage::disk('local')->exists($document->file_path)) {
            Storage::disk('local')->delete($document->file_path);
        }

        $document->delete();

        return response()->json(['message' => 'Doküman başarıyla silindi.'], 200);
    }
}

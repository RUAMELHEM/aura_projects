"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getDocuments, uploadDocument, deleteDocument, Document as ApiDocument } from "@/lib/api";
import { FileText, Plus, X, UploadCloud, Trash2, Clock, CheckCircle, AlertCircle, FileOutput, Loader2 } from "lucide-react";

const statusMap: Record<string, { label: string; icon: any; cls: string; spin: boolean }> = {
  uploaded:   { label: "Yüklendi",   icon: Clock,         cls: "text-blue-400 bg-blue-500/10 border-blue-500/20",   spin: false },
  processing: { label: "İşleniyor",  icon: Loader2,       cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", spin: true },
  processed:  { label: "Hazır",      icon: CheckCircle,   cls: "text-green-400 bg-green-500/10 border-green-500/20",  spin: false },
  completed:  { label: "Hazır",      icon: CheckCircle,   cls: "text-green-400 bg-green-500/10 border-green-500/20",  spin: false },
  failed:     { label: "Hata",       icon: AlertCircle,   cls: "text-red-400 bg-red-500/10 border-red-500/20",       spin: false },
};

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Belgeleri API'den çek ve state'e kaydet
  const load = useCallback(() => {
    setLoading(true);
    getDocuments()
      .then(setDocuments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // İlk yüklemede çalışır
  useEffect(load, [load]);

  // ─── POLLING ────────────────────────────────────────────────────────
  // Eğer listede "processing" veya "uploaded" belge varsa,
  // her 5 saniyede bir sessizce API'yi çek ve değişen belgeleri güncelle.
  // Tüm belgeler tamamlandığında interval otomatik durur.
  useEffect(() => {
    const POLL_INTERVAL = 5000; // 5 saniye

    const poll = async () => {
      const fresh = await getDocuments().catch(() => null);
      if (!fresh) return;

      // Sadece değişen belgeler varsa state'i güncelle (gereksiz render önlenir)
      setDocuments(prev => {
        const changed = fresh.some(f => {
          const old = prev.find(p => p.id === f.id);
          return old && old.status !== f.status;
        });
        return changed ? fresh : prev;
      });
    };

    // "processing" veya "uploaded" belge var mı kontrol et
    const hasActive = documents.some(d => d.status === 'processing' || d.status === 'uploaded');
    if (!hasActive) return; // Yoksa interval kurma

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval); // Unmount olunca veya durum değişince temizle
  }, [documents]);
  // ────────────────────────────────────────────────────────────────────

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadDocument(title || file.name, file);
      setShowModal(false);
      setTitle("");
      setFile(null);
      load();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Dosya yüklenemedi.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingId) return;
    if (!confirm("Bu dokümanı silmek istediğinize emin misiniz?")) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      // Eğer doküman zaten silinmişse (404), yine de listeden kaldır
      if (err?.response?.status === 404) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      } else {
        console.error("Doküman silinirken hata:", err);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dokümanlarım</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Yapay zeka ile sohbet etmek için dokümanlarınızı yükleyin</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-lg shadow-violet-500/25"
        >
          <Plus className="w-4 h-4" />
          Dosya Yükle
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-2/3 mb-3" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
          <FileOutput className="w-14 h-14 text-zinc-700 mb-4" />
          <p className="text-white font-semibold text-lg">Henüz doküman yüklemedin</p>
          <p className="text-zinc-500 text-sm mt-1 mb-6">PDF, Word veya Excel dosyalarını yükleyerek onlara soru sormaya başla</p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            İlk Dosyanı Yükle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => {
            const status = statusMap[doc.status] || statusMap.uploaded;
            const Icon = status.icon;
            return (
              <div key={doc.id} className="glass-card p-5 group flex flex-col">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-center flex-shrink-0 text-zinc-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate" title={doc.title}>{doc.title}</h3>
                    <p className="text-zinc-500 text-xs truncate mt-0.5">{doc.file_name}</p>
                    
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${status.cls}`}>
                        <Icon className={`w-3 h-3 ${status.spin ? 'animate-spin' : ''}`} /> {status.label}
                      </span>
                      <span className="text-zinc-600 text-xs">{formatBytes(doc.file_size)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-zinc-600 text-xs">{new Date(doc.created_at).toLocaleDateString('tr-TR')}</span>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title="Dokümanı Sil"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !uploading && setShowModal(false)} />
          <div className="glass-card w-full max-w-md p-6 relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Doküman Yükle</h2>
              <button onClick={() => !uploading && setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors" disabled={uploading}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Başlık (İsteğe bağlı)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="2023 Finansal Raporu"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/70 border border-zinc-700/50 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Dosya (PDF, DOCX, XLSX)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${file ? "border-violet-500 bg-violet-500/5" : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/30"}`}
                >
                  <UploadCloud className={`w-8 h-8 mb-2 ${file ? "text-violet-400" : "text-zinc-500"}`} />
                  {file ? (
                    <div className="text-center">
                      <p className="text-violet-300 font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                      <p className="text-zinc-500 text-xs mt-1">{formatBytes(file.size)}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-zinc-300 text-sm font-medium">Tıklayın veya sürükleyin</p>
                      <p className="text-zinc-500 text-xs mt-1">Maks. boyut: 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.xlsx"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Yükleniyor...
                    </>
                  ) : (
                    "Yükle"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

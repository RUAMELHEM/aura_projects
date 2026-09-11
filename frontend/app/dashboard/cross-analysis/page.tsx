"use client";

import { useEffect, useState } from "react";
import {
  getWebsites,
  getDocuments,
  runCrossAnalysis,
  Website,
  Document as ApiDocument,
  CrossAnalysisResult,
  CrossAnalysisRule
} from "@/lib/api";
import {
  GitCompare,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Globe,
  ArrowRight,
  Loader2,
  Info,
  BookOpen,
  HelpCircle
} from "lucide-react";

export default function CrossAnalysisPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<CrossAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "violations" | "compliant">("all");

  useEffect(() => {
    Promise.all([getWebsites(), getDocuments()])
      .then(([webs, docs]) => {
        setWebsites(webs);
        setDocuments(docs);
        // Otomatik ilk tamamlanmış siteyi seç
        const firstScanned = webs.find(w => w.latest_scan?.status === "completed");
        if (firstScanned) setSelectedWebsiteId(firstScanned.id.toString());
        // İlk işlenmiş dokümanı seç
        const firstDoc = docs.find(d => d.status === "processed");
        if (firstDoc) setSelectedDocumentId(firstDoc.id.toString());
      })
      .catch(err => {
        console.error("Veriler alınamadı:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStartAnalysis = async () => {
    if (!selectedWebsiteId) {
      setError("Lütfen taranmış bir web sitesi seçin.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await runCrossAnalysis({
        website_id: Number(selectedWebsiteId),
        document_id: selectedDocumentId ? Number(selectedDocumentId) : null,
      });
      setResult(res);
    } catch (err: unknown) {
      const respData = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(respData?.message || "Çapraz analiz sırasında bir hata oluştu. Lütfen sitenin taranmış olduğundan emin olun.");
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredRules = result
    ? activeTab === "violations"
      ? result.violations
      : activeTab === "compliant"
      ? result.compliant_rules
      : [...result.violations, ...result.compliant_rules]
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* ── Üst Başlık ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/20">
              <GitCompare className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Çapraz Analiz (Cross Intelligence)</h1>
          </div>
          <p className="text-sm text-zinc-400">
            Yüklediğiniz kurumsal yönergeler ve mevzuat dokümanları ile web sitesi teknik audit bulgularını yapay zeka ile denetleyin.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium self-start md:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          <span>Senaryo 3: Doküman & Website Karşılaştırma</span>
        </div>
      </div>

      {/* ── Seçim & Parametre Kartı ── */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-violet-400" />
          Denetim Yapılandırması
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-zinc-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            <span>Kayıtlı web siteleri ve dokümanlar yükleniyor...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* 1. Web Sitesi Seçimi */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-violet-400" />
                Hedef Web Sitesi *
              </label>
              <select
                value={selectedWebsiteId}
                onChange={e => setSelectedWebsiteId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-700/60 text-white text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="">-- Web Sitesi Seçin --</option>
                {websites.map(site => {
                  const hasScan = site.latest_scan?.status === "completed";
                  return (
                    <option key={site.id} value={site.id} disabled={!hasScan}>
                      {site.name || site.url} {hasScan ? `(Skor: ${site.latest_scan?.overall_score ?? "—"}/100)` : "— Tarama Yok"}
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-zinc-500">Yalnızca taraması tamamlanmış web siteleri analiz edilebilir.</p>
            </div>

            {/* 2. Doküman Seçimi */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Referans Alınacak Yönerge / Standart Dokümanı
              </label>
              <select
                value={selectedDocumentId}
                onChange={e => setSelectedDocumentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-700/60 text-white text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="">Tüm Kurumsal Dokümanlar (Genel Standartlar)</option>
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id} disabled={doc.status !== "processed"}>
                    {doc.title || doc.file_name} {doc.status !== "processed" ? "(İşleniyor...)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-500">RAG motoru kuralları bu dokümanın içeriğinden ayıklar.</p>
            </div>

            {/* 3. Çalıştır Butonu */}
            <div className="lg:col-span-1">
              <button
                onClick={handleStartAnalysis}
                disabled={analyzing || !selectedWebsiteId}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-medium text-sm shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analiz Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Karşılaştır</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ── Analiz Devam Ediyor Durumu ── */}
      {analyzing && (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 animate-ping" />
            <div className="w-16 h-16 rounded-full border-4 border-violet-500 border-t-transparent animate-spin flex items-center justify-center">
              <GitCompare className="w-6 h-6 text-violet-400" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-bold text-lg">Yapay Zeka Çapraz Analizi Yürütülüyor</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Doküman içeriğindeki kurallar vektörel RAG aramasıyla çıkarılıyor ve taranan web sitesinin güvenlik, SEO ve erişilebilirlik bulgularıyla eşleştiriliyor...
            </p>
          </div>
        </div>
      )}

      {/* ── Analiz Sonuçları ── */}
      {result && !analyzing && (
        <div className="space-y-6">
          {/* Hero Skor ve Özet Kartı */}
          <div className="glass-card p-6 md:p-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
              <div className="flex items-center gap-5">
                {/* Dairesel Skor Göstergesi */}
                <div className="relative w-20 h-20 shrink-0">
                  <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-bold shadow-xl border ${
                    result.compliance_rate >= 80
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : result.compliance_rate >= 60
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}>
                    <span className="text-2xl font-black tracking-tight">%{result.compliance_rate}</span>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400">Uyum</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {result.website.name} — Mevzuat Uyum Raporu
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-400 flex items-center gap-2">
                    <span>Hedef: <strong className="text-zinc-300">{result.website.url}</strong></span>
                    <span>•</span>
                    <span>Doküman: <strong className="text-zinc-300">{result.document?.title || "Genel Kurumsal Standartlar"}</strong></span>
                  </p>
                </div>
              </div>

              {/* İstatistik Rozetleri */}
              <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
                <div className="text-center px-4 py-2 rounded-xl bg-zinc-900/60 border border-white/5">
                  <span className="text-xs text-zinc-500 block">Değerlendirilen</span>
                  <span className="text-base font-bold text-white">{result.total_rules_evaluated} Kural</span>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-green-950/20 border border-green-500/20">
                  <span className="text-xs text-green-400/80 block">Karşılanan</span>
                  <span className="text-base font-bold text-green-400">{result.passed_rules_count}</span>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-red-950/20 border border-red-500/20">
                  <span className="text-xs text-red-400/80 block">Uyumsuzluk</span>
                  <span className="text-base font-bold text-red-400">{result.violation_count}</span>
                </div>
              </div>
            </div>

            {/* AI Yönetici Özeti */}
            <div className="mt-6 p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 relative">
              <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                Yapay Zeka Uyum Değerlendirmesi
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed">{result.summary}</p>
            </div>
          </div>

          {/* ── Kural Listesi ve Filtreleme ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                Standart ve Kural Bazlı Denetim Detayları
              </h3>

              {/* Sekmeler */}
              <div className="flex items-center gap-1 p-1 bg-zinc-900/80 rounded-xl border border-white/5 text-xs">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === "all" ? "bg-violet-600 text-white font-medium shadow" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Tümü ({result.total_rules_evaluated})
                </button>
                <button
                  onClick={() => setActiveTab("violations")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === "violations" ? "bg-red-500/20 text-red-300 font-medium border border-red-500/30" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Uyumsuzluklar ({result.violation_count})
                </button>
                <button
                  onClick={() => setActiveTab("compliant")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === "compliant" ? "bg-green-500/20 text-green-300 font-medium border border-green-500/30" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Karşılanan ({result.passed_rules_count})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {filteredRules.map(r => {
                const isViolation = r.status === "Uyumsuz";
                return (
                  <div
                    key={r.id}
                    className={`glass-card p-5 border transition-all ${
                      isViolation
                        ? "border-red-500/20 bg-red-950/5 hover:border-red-500/40"
                        : "border-green-500/20 bg-green-950/5 hover:border-green-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {r.id}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-900/80 text-zinc-300">
                            {r.category}
                          </span>
                          {isViolation ? (
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              r.severity === "high" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}>
                              {r.severity === "high" ? "Kritik İhlal" : "Orta İhlal"}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                              Uyumlu
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-semibold text-white leading-snug pt-1">
                          {r.rule}
                        </h4>

                        {isViolation ? (
                          <div className="space-y-2 pt-2">
                            <div className="p-3 rounded-lg bg-black/40 border border-red-500/20 text-xs text-zinc-300 space-y-1">
                              <span className="text-red-400 font-semibold block">Tespit Edilen Teknik Eksik:</span>
                              <p>{r.finding}</p>
                            </div>
                            {r.recommendation && (
                              <div className="p-3 rounded-lg bg-violet-950/20 border border-violet-500/20 text-xs text-zinc-300 space-y-1">
                                <span className="text-violet-400 font-semibold block">Çözüm Önerisi & Aksiyon:</span>
                                <p>{r.recommendation}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400 pt-1 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                            {r.evidence}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RAG Doküman Bağlamları ── */}
          {result.document_context_used && result.document_context_used.length > 0 && (
            <div className="glass-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" />
                Referans Alınan Doküman Parçaları (RAG Bağlamı)
              </h3>
              <p className="text-xs text-zinc-400">
                Yapay zeka analiz motoru, kuralları tespit etmek ve eşleştirmek için aşağıdaki doküman bölümlerini incelemiştir:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {result.document_context_used.map((ctx, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="font-semibold text-violet-300">
                        {ctx.page_number ? `Sayfa ${ctx.page_number}` : `Doküman ID: ${ctx.document_id}`}
                      </span>
                      <span className="text-zinc-500">Benzerlik Skoru: %{Math.round(ctx.similarity * 100)}</span>
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-4 leading-relaxed font-mono bg-zinc-950/60 p-2 rounded-lg">
                      &quot;{ctx.text}&quot;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * 🌐 Web Siteleri Sayfası (/dashboard/websites)
 *
 * Bu sayfada:
 * - Kullanıcının eklediği tüm siteler listelenir
 * - "Site Ekle" modal açılır → URL girilir → API'ye gönderilir
 * - Her sitenin üzerine tıklanınca detay sayfasına gider
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getWebsites, createWebsite, startScan, Website } from "@/lib/api";
import { Globe, Plus, X, ExternalLink, Zap, Clock, CheckCircle, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

function ScoreRing({ score }: { score: number | null | undefined }) {
  if (!score) return (
    <div className="w-14 h-14 rounded-full border-2 border-zinc-700 flex items-center justify-center">
      <span className="text-zinc-600 text-xs">—</span>
    </div>
  );
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  const r = 20, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative w-14 h-14">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} strokeWidth="4" stroke="#27272a" fill="none" />
        <circle cx="24" cy="24" r={r} strokeWidth="4" stroke={color} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
        {score}
      </span>
    </div>
  );
}

function ScanProgress({ status }: { status: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => {
      setStep(prev => (prev < 3 ? prev + 1 : 3));
    }, 3500);
    return () => clearInterval(interval);
  }, [status]);

  if (status !== "running" && status !== "pending") return null;

  const steps = [
    { label: "Sıraya alındı" },
    { label: "Web sitesine erişiliyor" },
    { label: "Alt sayfalar keşfediliyor" },
    { label: "Yapay zeka ile analiz ediliyor" }
  ];

  return (
    <div className="mt-4 p-4 bg-zinc-900/50 rounded-xl border border-white/5 space-y-3">
      <div className="text-xs font-medium text-violet-400 flex items-center gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Tarama devam ediyor...
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => {
          let state = "waiting";
          if (status === "pending") {
            if (i === 0) state = "active";
          } else if (status === "running") {
            if (i === 0) state = "done";
            else if (i === step + 1) state = "active";
            else if (i < step + 1) state = "done";
          }

          return (
            <div key={i} className={`flex items-center gap-2.5 text-[11px] transition-colors duration-500 ${state === 'done' ? 'text-green-400' : state === 'active' ? 'text-white font-medium' : 'text-zinc-600'}`}>
              {state === 'done' ? <CheckCircle className="w-3.5 h-3.5" /> : state === 'active' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />}
              {s.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const statusMap = {
  completed: { label: "Tamamlandı", icon: CheckCircle, cls: "text-green-400" },
  running: { label: "Çalışıyor", icon: Loader2, cls: "text-blue-400" },
  pending: { label: "Bekliyor", icon: Clock, cls: "text-yellow-400" },
  failed: { label: "Başarısız", icon: AlertCircle, cls: "text-red-400" },
};

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getWebsites()
      .then(setWebsites)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // ─── POLLING ────────────────────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      const fresh = await getWebsites().catch(() => null);
      if (!fresh) return;
      
      setWebsites(prev => {
        const changed = fresh.some(f => {
          const old = prev.find(p => p.id === f.id);
          // Durum veya skor değiştiyse güncelliyoruz
          return old?.latest_scan?.status !== f.latest_scan?.status || 
                 old?.latest_scan?.overall_score !== f.latest_scan?.overall_score;
        });
        return changed ? fresh : prev;
      });
    };

    const hasActive = websites.some(w => w.latest_scan?.status === 'pending' || w.latest_scan?.status === 'running');
    if (!hasActive) return;

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [websites]);
  // ────────────────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createWebsite(url, name || url);
      setShowModal(false);
      setUrl("");
      setName("");
      load();
    } catch (err: unknown) {
      const respData = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data;
      const errors = respData?.errors;
      const message = errors
        ? Object.values(errors).flat().join(" ")
        : (respData?.message || "Site eklenemedi. Lütfen URL adresini kontrol edin.");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleScan = async (websiteId: number) => {
    setScanning(websiteId);
    try {
      await startScan(websiteId);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Web Sitelerim</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Eklediğin siteleri yönet ve analiz et</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-lg shadow-violet-500/25"
        >
          <Plus className="w-4 h-4" />
          Site Ekle
        </button>
      </div>

      {/* Site Kartları */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-2/3 mb-3" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : websites.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
          <Globe className="w-14 h-14 text-zinc-700 mb-4" />
          <p className="text-white font-semibold text-lg">Henüz site eklemedin</p>
          <p className="text-zinc-500 text-sm mt-1 mb-6">İlk web siteni ekleyerek analiz etmeye başla</p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            İlk Sitemizi Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {websites.map((site) => {
            const scan = site.latest_scan;
            const status = statusMap[scan?.status as keyof typeof statusMap];
            return (
              <div key={site.id} className="glass-card p-5 group hover:border-violet-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <ScoreRing score={scan?.overall_score} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{site.name}</h3>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 text-xs hover:text-violet-400 transition-colors truncate flex items-center gap-1 mt-0.5"
                    >
                      {site.url} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                    {status ? (
                      <div className={`flex items-center gap-1.5 mt-2.5 px-2 py-0.5 rounded-md text-[11px] font-medium border inline-flex ${status.cls}`}>
                        <status.icon className={`w-3 h-3 ${status.icon === Loader2 ? 'animate-spin' : ''}`} />
                        {status.label}
                      </div>
                    ) : (
                      <div className="text-zinc-600 text-xs mt-2">Henüz taranmadı</div>
                    )}
                  </div>
                </div>

                {/* Yürüyen Tarama Göstergesi */}
                {(scan?.status === "pending" || scan?.status === "running") && (
                  <ScanProgress status={scan.status} />
                )}

                {/* Skor barları */}
                {scan?.status === "completed" && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      { label: "SEO", score: scan.seo_score },
                      { label: "Güvenlik", score: scan.security_score },
                      { label: "Performans", score: scan.performance_score },
                      { label: "Erişilebilirlik", score: scan.accessibility_score },
                    ].map(({ label, score }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-500">{label}</span>
                          <span className={score && score >= 80 ? "text-green-400" : score && score >= 60 ? "text-yellow-400" : "text-red-400"}>
                            {score ?? "—"}
                          </span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${score && score >= 80 ? "bg-green-500" : score && score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${score ?? 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Aksiyonlar */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleScan(site.id)}
                    disabled={scanning === site.id || scan?.status === "running" || scan?.status === "pending"}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {scanning === site.id ? "Başlatılıyor..." : "Tara"}
                  </button>
                  {scan && (
                    <Link
                      href={`/dashboard/scans/${scan.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 text-xs font-medium transition-colors"
                    >
                      Raporu Gör
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/websites/${site.id}`}
                    className="ml-auto text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Site Ekle Modalı */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="glass-card w-full max-w-md p-6 relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Yeni Web Sitesi Ekle</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
            )}
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Site Adı (İsteğe bağlı)</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Şirket Ana Sayfası"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/70 border border-zinc-700/50 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">URL *</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/70 border border-zinc-700/50 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>
              <div className="p-3 bg-violet-950/20 border border-violet-800/30 rounded-xl text-xs text-zinc-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-300">SSRF Güvenlik Koruması:</strong> Sistem güvenliği için <code className="text-violet-300 bg-violet-950/50 px-1 py-0.5 rounded">localhost</code>, <code className="text-violet-300 bg-violet-950/50 px-1 py-0.5 rounded">127.0.0.1</code> ve yerel ağ (RFC1918) IP adresleri kabul edilmez.
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {submitting ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * 📈 Tarama Detay Sayfası (/dashboard/scans/[id])
 *
 * Burada tek bir taramanın detaylarını (puanlar, AI özeti, hatalar) gösteriyoruz.
 * `useParams` ile URL'den scan ID'sini alıyoruz.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getScan, WebsiteScan } from "@/lib/api";
import { 
  ArrowLeft, Globe, Clock, CheckCircle, AlertTriangle, XCircle, 
  Bot, AlertCircle, ExternalLink, Activity
} from "lucide-react";

function ScoreRing({ score, label, colorClass }: { score: number | null | undefined, label: string, colorClass: string }) {
  if (score === null || score === undefined) return (
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 rounded-full border-4 border-zinc-800 flex items-center justify-center mb-2">
        <span className="text-zinc-600">—</span>
      </div>
      <span className="text-sm font-medium text-zinc-400">{label}</span>
    </div>
  );
  
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  const r = 32, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  
  return (
    <div className="flex flex-col items-center group">
      <div className="relative w-24 h-24 mb-3 transition-transform group-hover:scale-105">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} strokeWidth="6" stroke="#27272a" fill="none" />
          <circle cx="40" cy="40" r={r} strokeWidth="6" stroke={color} fill="none"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" 
            className="transition-all duration-1000 ease-out" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl">
          {score}
        </span>
      </div>
      <span className="text-sm font-medium text-zinc-300">{label}</span>
    </div>
  );
}

const severityMap = {
  high: { label: "Kritik", icon: XCircle, cls: "text-red-400 bg-red-500/10 border-red-500/20" },
  medium: { label: "Uyarı", icon: AlertTriangle, cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  low: { label: "Bilgi", icon: AlertCircle, cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
};

export default function ScanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [scan, setScan] = useState<WebsiteScan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    getScan(Number(id))
      .then(setScan)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
        <Activity className="w-8 h-8 animate-spin mb-4 text-violet-500" />
        <p>Analiz raporu yükleniyor...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Rapor Bulunamadı</h2>
        <p className="text-zinc-400 mb-6">Bu tarama raporuna erişiminiz olmayabilir veya silinmiş olabilir.</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-colors">
          Geri Dön
        </button>
      </div>
    );
  }

  const { report, website } = scan;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Üst Bar: Geri Dön + Başlık */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="mt-1 p-2 rounded-xl glass hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">{website?.name || website?.url}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
              ${scan.status === "completed" ? "bg-green-500/15 text-green-400 border-green-500/30" : 
                scan.status === "failed" ? "bg-red-500/15 text-red-400 border-red-500/30" : 
                "bg-blue-500/15 text-blue-400 border-blue-500/30"}`}
            >
              {scan.status.toUpperCase()}
            </span>
          </div>
          <a href={website?.url} target="_blank" rel="noopener noreferrer" className="text-violet-400 text-sm hover:text-violet-300 flex items-center gap-1.5 w-fit">
            <Globe className="w-4 h-4" /> {website?.url} <ExternalLink className="w-3 h-3" />
          </a>
          
          <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(scan.created_at).toLocaleString('tr-TR')}</span>
            {scan.pages_crawled && <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> {scan.pages_crawled} sayfa tarandı</span>}
          </div>
        </div>
      </div>

      {scan.status === 'completed' && report ? (
        <>
          {/* Skorlar (Gauge Chart) */}
          <div className="glass-card p-8">
            <h2 className="text-lg font-semibold text-white mb-6">Performans Skorları</h2>
            <div className="flex flex-wrap justify-around gap-6">
              <ScoreRing score={scan.overall_score} label="Genel Skor" colorClass="violet" />
              <div className="w-px bg-white/10 hidden md:block" />
              <ScoreRing score={scan.seo_score} label="SEO" colorClass="blue" />
              <ScoreRing score={scan.security_score} label="Güvenlik" colorClass="yellow" />
              <ScoreRing score={scan.performance_score} label="Hız" colorClass="green" />
              <ScoreRing score={scan.accessibility_score} label="Erişilebilirlik" colorClass="purple" />
            </div>
          </div>

          {/* AI Özeti */}
          {report.ai_summary && (
            <div className="glass-card overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600/20 to-blue-600/20 px-6 py-4 flex items-center gap-3 border-b border-violet-500/20">
                <div className="p-2 rounded-lg bg-violet-500/20 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <Bot className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-violet-100">Yapay Zeka Analizi</h2>
              </div>
              <div className="p-6">
                <p className="text-zinc-300 leading-relaxed">{report.ai_summary}</p>
                
                {report.ai_recommendations && report.ai_recommendations.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Öncelikli Aksiyonlar</h3>
                    <ul className="space-y-3">
                      {report.ai_recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-zinc-300 bg-white/5 rounded-xl p-3 border border-white/5">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hata ve Uyarılar Listesi */}
          {report.issues && report.issues.length > 0 && (
            <div className="glass-card">
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Tespit Edilen Sorunlar</h2>
                <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-bold border border-red-500/20">
                  {report.total_issues} Sorun
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {report.issues.map((issue, idx) => {
                  const sev = severityMap[issue.severity] || severityMap.low;
                  const Icon = sev.icon;
                  return (
                    <div key={idx} className="p-6 hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg border ${sev.cls} flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{issue.code}</span>
                            <span className="text-zinc-500 text-xs px-2 py-0.5 bg-zinc-800 rounded-full">{issue.category.toUpperCase()}</span>
                          </div>
                          <p className="text-zinc-400 text-sm mt-1">{issue.message}</p>
                          {issue.url && (
                            <a href={issue.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs text-blue-400 hover:text-blue-300">
                              <ExternalLink className="w-3 h-3" /> {issue.url}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card p-12 text-center">
          <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-medium text-white mb-2">Tarama Devam Ediyor</h2>
          <p className="text-zinc-400">Yapay zeka analiz motorumuz siteyi tarıyor. Lütfen daha sonra tekrar kontrol edin.</p>
        </div>
      )}
    </div>
  );
}

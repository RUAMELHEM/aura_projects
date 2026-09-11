"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDashboardSummary,
  getWebsites,
  DashboardSummaryData,
  Website
} from "@/lib/api";
import {
  Globe,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ExternalLink,
  ArrowRight,
  MessageSquare,
  FileText,
  Sparkles,
  Shield,
  Activity,
  Layers
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) return <span className="text-zinc-500 text-sm">—</span>;
  const color = score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  return <span className={`text-sm font-bold ${color}`}>{score}/100</span>;
}

function StatusBadge({ status }: { status: string | undefined }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "Tamamlandı", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
    running: { label: "Çalışıyor", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    pending: { label: "Bekliyor", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    failed: { label: "Başarısız", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  };
  const { label, cls } = map[status ?? ""] ?? { label: "Taranmadı", cls: "bg-zinc-700/50 text-zinc-400 border-zinc-600/30" };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

// Kategori Renkleri
const categoryColors: Record<string, string> = {
  security: "#ef4444", // Kırmızı
  seo: "#8b5cf6",     // Mor
  performance: "#3b82f6", // Mavi
  accessibility: "#10b981", // Yeşil
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardSummary().catch(() => null),
      getWebsites().catch(() => [])
    ])
      .then(([summaryData, webs]) => {
        setSummary(summaryData);
        setWebsites(webs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Toplam Web Sitesi",
      value: summary?.websites ?? websites.length,
      sub: `${websites.filter(w => w.latest_scan?.status === "completed").length} taranmış site`,
      icon: Globe,
      color: "violet"
    },
    {
      label: "Ortalama Denetim Skoru",
      value: summary?.average_audit_score ? `${summary.average_audit_score}/100` : "—",
      sub: summary?.critical_issues_count ? `${summary.critical_issues_count} kritik sorun` : "Aktif taramalar",
      icon: TrendingUp,
      color: "blue"
    },
    {
      label: "İşlenmiş Dokümanlar",
      value: summary?.documents_count ?? 0,
      sub: "RAG vektör veritabanı",
      icon: FileText,
      color: "emerald"
    },
    {
      label: "Yapay Zeka Soruları",
      value: summary?.ai_questions ?? 0,
      sub: "Kaynak referanslı cevaplar",
      icon: MessageSquare,
      color: "amber"
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* ── Üst Başlık ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Genel Bakış</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Kurumsal web denetimleri, yapay zeka kullanımı ve mevzuat uyum özeti
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/documents"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors border border-white/5"
          >
            <FileText className="w-4 h-4 text-zinc-400" />
            Doküman Yükle
          </Link>
          <Link
            href="/dashboard/websites"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-lg shadow-violet-500/25"
          >
            <Plus className="w-4 h-4" />
            Site Ekle
          </Link>
        </div>
      </div>

      {/* ── 4 Metrik Kartı ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5 relative overflow-hidden group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${
              color === "violet" ? "bg-violet-500/15 text-violet-400" :
              color === "blue" ? "bg-blue-500/15 text-blue-400" :
              color === "emerald" ? "bg-emerald-500/15 text-emerald-400" :
              "bg-amber-500/15 text-amber-400"
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{loading ? "—" : value}</p>
            <p className="text-zinc-400 text-xs mt-0.5 font-medium">{label}</p>
            <p className="text-zinc-500 text-[11px] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── ETKİLEŞİM & GRAFİKLER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik 1: Günlük AI Kullanımı */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Haftalık Yapay Zeka Etkileşimi
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Son 7 günde sorulan kullanıcı soruları</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
              Canlı API
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500 gap-2">
                <Activity className="w-4 h-4 animate-spin text-violet-500" />
                Grafik verisi yükleniyor...
              </div>
            ) : summary?.daily_ai_usage && summary.daily_ai_usage.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.daily_ai_usage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "0.75rem", fontSize: "12px", color: "#fff" }}
                    labelStyle={{ color: "#a1a1aa", fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="questions"
                    name="Kullanıcı Sorusu"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#aiGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                Henüz yapay zeka etkileşim verisi bulunmuyor
              </div>
            )}
          </div>
        </div>

        {/* Grafik 2: Kategori Bazlı Sorun Dağılımı */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Kategori Bazlı Denetim Sorunları
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Taranan sitelerde tespit edilen geliştirme alanları</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              Audit Verisi
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500 gap-2">
                <Activity className="w-4 h-4 animate-spin text-amber-500" />
                Sorun dağılımı yükleniyor...
              </div>
            ) : summary?.issues_by_category && summary.issues_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.issues_by_category} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "0.75rem", fontSize: "12px", color: "#fff" }}
                    labelStyle={{ color: "#a1a1aa", fontWeight: "bold" }}
                  />
                  <Bar dataKey="count" name="Tespit Edilen Sorun" radius={[6, 6, 0, 0]}>
                    {summary.issues_by_category.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[entry.type] || "#8b5cf6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                Henüz tespit edilen sorun bulunmuyor
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Alt Grid: En Çok Kullanılan Dokümanlar & Web Siteleri ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* En Çok Referans Alınan Dokümanlar (1 Kolon) */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              RAG En Çok Kullanılan Dokümanlar
            </h3>
            <Link href="/dashboard/documents" className="text-xs text-violet-400 hover:text-violet-300">
              Tümü
            </Link>
          </div>

          {summary?.top_documents && summary.top_documents.length > 0 ? (
            <div className="space-y-3">
              {summary.top_documents.map(doc => (
                <div key={doc.id} className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{doc.title || doc.file_name}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {doc.page_count ? `${doc.page_count} sayfa` : "Doküman"}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 shrink-0">
                    {doc.sources_count} atıf
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              Henüz soru-cevapta atıfta bulunulan doküman yok.
            </div>
          )}
        </div>

        {/* Web Sitelerim Tablosu (2 Kolon) */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-400" />
              Kayıtlı Web Siteleri & Son Skorlar
            </h2>
            <Link href="/dashboard/websites" className="text-violet-400 hover:text-violet-300 text-xs flex items-center gap-1 transition-colors">
              Tümünü gör <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-500 text-xs gap-2">
              <Activity className="w-4 h-4 animate-spin text-violet-500" />
              Yükleniyor...
            </div>
          ) : websites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Globe className="w-10 h-10 text-zinc-700 mb-2" />
              <p className="text-zinc-400 text-sm font-medium">Henüz web sitesi eklenmemiş</p>
              <p className="text-zinc-600 text-xs mt-0.5">İlk web sitenizi ekleyerek denetim başlatın</p>
              <Link
                href="/dashboard/websites"
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
              >
                Site Ekle
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {websites.slice(0, 5).map((website) => (
                <div key={website.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/3 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{website.name || website.url}</p>
                    <p className="text-zinc-500 text-[11px] truncate">{website.url}</p>
                  </div>
                  <StatusBadge status={website.latest_scan?.status} />
                  <ScoreBadge score={website.latest_scan?.overall_score} />
                  <Link
                    href={`/dashboard/websites/${website.id}`}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-all p-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getWebsite, getWebsiteScans, Website, WebsiteScan } from "@/lib/api";
import { 
  ArrowLeft, Globe, Clock, Zap, CheckCircle, AlertCircle, ExternalLink, Loader2, Activity 
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function WebsiteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [website, setWebsite] = useState<Website | null>(null);
  const [scans, setScans] = useState<WebsiteScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getWebsite(Number(id)),
      getWebsiteScans(Number(id))
    ])
      .then(([web, history]) => {
        setWebsite(web);
        // Sadece tamamlanmış (completed) taramaları grafiğe çizmek mantıklı
        setScans(history.filter(s => s.status === 'completed').reverse()); 
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
        <Activity className="w-8 h-8 animate-spin mb-4 text-violet-500" />
        <p>Site detayları yükleniyor...</p>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Web Sitesi Bulunamadı</h2>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700">
          Geri Dön
        </button>
      </div>
    );
  }

  // Grafik verisi hazırlama
  const chartData = scans.map(s => ({
    date: new Date(s.created_at).toLocaleDateString("tr-TR", { month: "short", day: "numeric" }),
    time: new Date(s.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    Genel: s.overall_score || 0,
    SEO: s.seo_score || 0,
    Güvenlik: s.security_score || 0,
    Hız: s.performance_score || 0,
    Erişilebilirlik: s.accessibility_score || 0,
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Üst Bar: Geri Dön + Başlık */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="mt-1 p-2 rounded-xl glass hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white mb-1">{website.name || website.url}</h1>
          <a href={website.url} target="_blank" rel="noopener noreferrer" className="text-violet-400 text-sm hover:text-violet-300 flex items-center gap-1.5 w-fit">
            <Globe className="w-4 h-4" /> {website.url} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Audit History Grafiği */}
      <div className="glass-card p-6 md:p-8">
        <h2 className="text-lg font-semibold text-white mb-6">Skor Geçmişi (Audit History)</h2>
        
        {scans.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#52525b" 
                  tick={{ fill: '#71717a', fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="#52525b" 
                  tick={{ fill: '#71717a', fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ fontSize: '13px' }}
                  labelStyle={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                
                <Line type="monotone" dataKey="Genel" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="SEO" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Güvenlik" stroke="#eab308" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Hız" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            <Activity className="w-8 h-8 mb-3 opacity-50" />
            <p>Geçmiş tarama verisi bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Taramalar Listesi */}
      <div className="glass-card">
        <div className="px-6 py-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Tarama Raporları</h2>
        </div>
        
        {scans.length > 0 ? (
          <div className="divide-y divide-white/5">
            {scans.map((scan) => (
              <div key={scan.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-medium">Genel Skor: {scan.overall_score}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                      TAMAMLANDI
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(scan.created_at).toLocaleString("tr-TR")}</span>
                    {scan.pages_crawled && <span>{scan.pages_crawled} sayfa</span>}
                  </div>
                </div>
                
                <Link
                  href={`/dashboard/scans/${scan.id}`}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap text-center"
                >
                  Detaylı Rapor
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-zinc-500">
            <p>Henüz tamamlanmış bir tarama raporu yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}

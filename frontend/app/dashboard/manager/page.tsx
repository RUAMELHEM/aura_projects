"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getManagerUsers, getManagerStats } from "@/lib/api";
import { 
  Users, Globe, FileText, Activity, Mail, Calendar, TrendingUp 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load if authorized
    if (!user?.roles?.some((r: any) => r.name === 'kurum_yoneticisi' || r.name === 'admin')) {
      setLoading(false);
      return;
    }

    Promise.all([
      getManagerUsers().catch(() => []),
      getManagerStats().catch(() => null)
    ]).then(([usersData, statsData]) => {
      setUsers(usersData);
      setStats(statsData);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Activity className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <p className="text-zinc-400">Veriler yükleniyor...</p>
      </div>
    );
  }

  if (!user?.roles?.some((r: any) => r.name === 'kurum_yoneticisi' || r.name === 'admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold text-red-500 mb-2">Yetkisiz Erişim</h2>
        <p className="text-zinc-400">Bu sayfayı görüntüleme yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Kurum Yönetimi</h1>
          <p className="text-zinc-400 text-sm">
            {user.department?.name || 'Departman'} çalışanlarının aktivitelerini ve raporlarını inceleyin.
          </p>
        </div>
        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <TrendingUp className="w-6 h-6 text-blue-400" />
        </div>
      </div>

      {stats && (
        <>
          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Kayıtlı Çalışan" value={stats.summary.users} color="from-blue-500 to-cyan-500" />
            <StatCard icon={Globe} label="Kayıtlı Websitesi" value={stats.summary.websites} color="from-violet-500 to-purple-500" />
            <StatCard icon={Activity} label="Toplam Tarama" value={stats.summary.scans} color="from-green-500 to-emerald-500" />
            <StatCard icon={FileText} label="Toplam Doküman" value={stats.summary.documents} color="from-orange-500 to-amber-500" />
          </div>

          {/* Haftalık Aktivite Grafiği */}
          <div className="glass-card p-6 mt-8">
            <h2 className="text-lg font-semibold text-white mb-6">Son 7 Günlük Aktivite</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                  />
                  <Area type="monotone" dataKey="scans" name="Taramalar" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" />
                  <Area type="monotone" dataKey="documents" name="Dokümanlar" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDocs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Çalışanlar Tablosu */}
      <div className="glass-card overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white">Çalışan Listesi</h2>
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-zinc-300 font-medium">
            {users.length} Personel
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-zinc-400 text-xs font-medium uppercase tracking-wider">
                <th className="px-6 py-4">Kullanıcı</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4 hidden sm:table-cell">Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center flex-shrink-0 border border-white/10">
                        <span className="text-sm font-bold text-zinc-300">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                          <Mail className="w-3 h-3" /> {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {u.roles?.map((r: any) => (
                        <span key={r.id} className={`px-2.5 py-1 rounded-full text-xs font-medium border
                          ${r.name === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                            r.name === 'kurum_yoneticisi' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                            'bg-zinc-500/10 text-zinc-300 border-zinc-500/20'}`}>
                          {r.name.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(u.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                    Departmanda kayıtlı personel bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${color} rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity`} />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-zinc-400 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-zinc-300" />
        </div>
      </div>
    </div>
  );
}

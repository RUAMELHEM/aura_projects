"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { adminGetUsers, adminGetRoles, adminAssignRole, adminRemoveRole } from "@/lib/api";
import { Shield, Users, ChevronDown, Check, X, Loader2, Crown } from "lucide-react";

export default function AdminPanelPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [working, setWorking] = useState<number | null>(null); // hangi kullanıcı üzerinde işlem yapılıyor

  // Sayfayı yükle
  useEffect(() => {
    if (!user?.roles?.some((r: any) => r.name === "admin")) {
      setLoading(false);
      return;
    }
    Promise.all([adminGetUsers(), adminGetRoles()])
      .then(([u, r]) => { setUsers(u); setRoles(r); })
      .catch(() => setActionMsg({ type: "err", text: "Veriler yüklenemedi." }))
      .finally(() => setLoading(false));
  }, [user]);

  // Rol Ata
  const handleAssign = async (userId: number, roleName: string) => {
    setWorking(userId);
    setActionMsg(null);
    try {
      const updated = await adminAssignRole(userId, roleName);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: updated.roles } : u));
      setActionMsg({ type: "ok", text: `'${roleName}' rolü atandı.` });
    } catch {
      setActionMsg({ type: "err", text: "Rol atanamadı." });
    } finally {
      setWorking(null);
    }
  };

  // Rol Kaldır
  const handleRemove = async (userId: number, roleName: string) => {
    setWorking(userId);
    setActionMsg(null);
    try {
      const updated = await adminRemoveRole(userId, roleName);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: updated.roles } : u));
      setActionMsg({ type: "ok", text: `'${roleName}' rolü kaldırıldı.` });
    } catch {
      setActionMsg({ type: "err", text: "Rol kaldırılamadı." });
    } finally {
      setWorking(null);
    }
  };

  // Yetki Kontrolü
  if (!loading && !user?.roles?.some((r: any) => r.name === "admin")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Shield className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-400 mb-2">Yetkisiz Erişim</h2>
        <p className="text-zinc-400">Bu sayfayı sadece Admin rolüne sahip kullanıcılar görebilir.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Başlık */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
          <Crown className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Paneli</h1>
          <p className="text-zinc-400 text-sm">Kullanıcılara rol atayın veya rollerini kaldırın.</p>
        </div>
      </div>

      {/* Bildirim */}
      {actionMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium
          ${actionMsg.type === "ok"
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {actionMsg.type === "ok" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {actionMsg.text}
        </div>
      )}

      {/* Kullanıcı Listesi */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-400" /> Tüm Kullanıcılar
          </h2>
          <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-zinc-400 border border-white/10">
            {users.length} kullanıcı
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {users.map((u) => (
            <div key={u.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/[0.02] transition-colors">
              {/* Kullanıcı Bilgisi */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-zinc-300">{u.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                </div>
              </div>

              {/* Mevcut Roller */}
              <div className="flex flex-wrap gap-2 flex-1">
                {u.roles?.length > 0 ? u.roles.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-1 group">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                      ${r.name === "admin" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        r.name === "kurum_yoneticisi" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        "bg-zinc-500/10 text-zinc-300 border-zinc-500/20"}`}>
                      {r.name.replace("_", " ")}
                    </span>
                    {/* Sadece admin rolünü kendi kendine kaldırmasını engelle */}
                    {!(r.name === "admin" && u.id === user?.id) && (
                      <button
                        onClick={() => handleRemove(u.id, r.name)}
                        disabled={working === u.id}
                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                        title={`'${r.name}' rolünü kaldır`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )) : (
                  <span className="text-xs text-zinc-600 italic">Rol yok</span>
                )}
              </div>

              {/* Rol Ata Dropdown */}
              <div className="relative group flex-shrink-0">
                <button
                  disabled={working === u.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {working === u.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Shield className="w-3 h-3" />}
                  Rol Ata <ChevronDown className="w-3 h-3" />
                </button>
                {/* Dropdown menü — hover ile açılır */}
                <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-10 min-w-[180px] overflow-hidden
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 translate-y-1 group-hover:translate-y-0">
                  {roles.map((role) => {
                    const hasRole = u.roles?.some((r: any) => r.name === role.name);
                    return (
                      <button
                        key={role.id}
                        onClick={() => !hasRole && handleAssign(u.id, role.name)}
                        disabled={hasRole || working === u.id}
                        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-xs text-left transition-colors
                          ${hasRole
                            ? "text-zinc-600 cursor-not-allowed"
                            : "text-zinc-300 hover:bg-white/5 hover:text-white"}`}
                      >
                        <span>{role.name.replace("_", " ")}</span>
                        {hasRole && <Check className="w-3 h-3 text-green-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

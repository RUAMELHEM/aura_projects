"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getDepartments, Department } from "@/lib/api";
import AuraLogo from "@/components/AuraLogo";
import ThemeAndLangSwitch from "@/components/ThemeAndLangSwitch";

export default function RegisterPage() {
  const { register, loading, error } = useAuth({ redirectIfAuthenticated: "/dashboard" });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId) return;
    await register(name, email, password, Number(departmentId));
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute top-5 right-5 z-20">
        <ThemeAndLangSwitch />
      </div>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[100px]" />
      </div>

      <div className="glass-card w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <AuraLogo size={54} showText={false} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            AURA
          </h1>
          <p className="text-zinc-400 text-sm mt-1">AURA'ya katıl, siteni analiz et</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300">Ad Soyad</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ahmet Yılmaz"
              required
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/70 border border-zinc-700/50 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">E-posta Adresi</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="isim@kurum.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/70 border border-zinc-700/50 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="department" className="block text-sm font-medium text-zinc-300">Departman</label>
            <select
              id="department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/70 border border-zinc-700/50 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all appearance-none"
            >
              <option value="" disabled>Departman Seçin</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">Şifre</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 8 karakter"
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/70 border border-zinc-700/50 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !departmentId}
            className="w-full py-3 mt-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 shadow-lg shadow-violet-500/25"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Kayıt oluşturuluyor...
              </span>
            ) : (
              "Kayıt Ol"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Hesabın var mı?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}

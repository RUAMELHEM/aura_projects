"use client";

/**
 * 🔐 Login Sayfası
 *
 * 'use client' → Bu component sunucuda değil tarayıcıda çalışır.
 * Next.js App Router'da default olarak Server Component gelir,
 * useState/useEffect/event handler kullanmak için 'use client' şart.
 *
 * useState → form alanlarının değerini (email, password) tutar.
 * useAuth  → login fonksiyonunu ve hata mesajını verir.
 */

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import AuraLogo from "@/components/AuraLogo";
import ThemeAndLangSwitch from "@/components/ThemeAndLangSwitch";

export default function LoginPage() {
  // Zaten giriş yapmışsa dashboard'a git
  const { login, loading, error } = useAuth({ redirectIfAuthenticated: "/dashboard" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Sayfanın yenilenmesini engelle (default form davranışı)
    await login(email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute top-5 right-5 z-20">
        <ThemeAndLangSwitch />
      </div>

      {/* Arka plan ambient ışık efekti */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[100px]" />
      </div>

      <div className="glass-card w-full max-w-md p-8 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <AuraLogo size={54} showText={false} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            AURA
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Hesabına giriş yap</p>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              E-posta Adresi
            </label>
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
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/70 border border-zinc-700/50 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 shadow-lg shadow-violet-500/25"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Giriş yapılıyor...
              </span>
            ) : (
              "Giriş Yap"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Hesabın yok mu?{" "}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}

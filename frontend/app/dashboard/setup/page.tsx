"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { claimAdminRole, checkSetupStatus } from "@/lib/api";
import { ShieldAlert, Crown, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function SetupWizard() {
  const router = useRouter();
  const { user, fetchUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { needsSetup } = await checkSetupStatus();
        if (!needsSetup) {
          setNeedsSetup(false);
          setTimeout(() => router.push("/dashboard"), 1000);
        }
      } catch (err) {
        console.error("Setup status check failed", err);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [router]);

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    try {
      await claimAdminRole();
      setSuccess(true);
      await fetchUser(); // Kullanıcı bilgilerini ve rollerini güncelle
      
      // 2 saniye sonra admin paneline yönlendir
      setTimeout(() => {
        router.push("/dashboard/admin");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!needsSetup) {
    return null; // Yönlendirme useEffect'te hallediliyor
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh]">
      <div className="max-w-md w-full relative">
        {/* Arka plan parlama efektleri */}
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl blur opacity-30 animate-pulse"></div>
        
        <div className="relative glass border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
          
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            {success ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            ) : (
              <Crown className="w-10 h-10 text-violet-400" />
            )}
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-3">
            AURA'ya Hoş Geldiniz
          </h1>
          
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Sistemde henüz bir süper yönetici (admin) bulunmuyor. İlk hesabı kurarak tüm sistem yapılandırmalarının ve kurum denetimlerinin kontrolünü elinize alın.
          </p>

          {!success ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-xl shadow-violet-500/20"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sistem Kuruluyor...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5" />
                  Sistem Yöneticisi Ol
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          ) : (
            <div className="w-full p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-emerald-400 font-medium flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Yönetici paneline aktarılıyorsunuz...
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 w-full flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-ping"></div>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Kurulum Aşaması 1/1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

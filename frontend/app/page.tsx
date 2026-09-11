import Link from "next/link";
import AuraLogo from "@/components/AuraLogo";
import ThemeAndLangSwitch from "@/components/ThemeAndLangSwitch";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      <div className="absolute top-5 right-5 z-20">
        <ThemeAndLangSwitch />
      </div>

      {/* Background ambient light effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-brand-primary blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="glass-card w-full max-w-md p-8 relative z-10 flex flex-col items-center">
        {/* Aura Logo Emblem */}
        <div className="mb-6 flex flex-col items-center">
          <AuraLogo size={64} showText={false} />
        </div>
        
        <h1 className="text-3xl font-black mb-2 tracking-widest bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          AURA
        </h1>
        <p className="text-violet-400 text-xs font-semibold tracking-wider uppercase mb-2">
          AI Unified Research & Audit
        </p>
        <p className="text-zinc-400 text-sm mb-8 text-center">
          Web sitenizin görünmeyen yüzünü ve dokümanlarınızı yapay zeka ile analiz edin.
        </p>

        <div className="w-full flex flex-col gap-4 mt-4">
          <Link 
            href="/login"
            className="w-full py-3 rounded-lg bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10 text-center"
          >
            Giriş Yap
          </Link>
          <Link 
            href="/register"
            className="w-full py-3 rounded-lg bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition-colors shadow-lg shadow-black/10 text-center"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </div>
  );
}

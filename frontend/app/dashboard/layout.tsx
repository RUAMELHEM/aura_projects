"use client";

/**
 * 🧭 Dashboard Layout
 *
 * Next.js'de layout.tsx, o dizindeki tüm page.tsx'lere ortak çerçeve sağlar.
 * /dashboard → bu layout
 * /dashboard/websites/[id] → yine bu layout (sidebar vs. değişmez)
 *
 * {children} → aktif sayfanın içeriği buraya eklenir
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuraLogo from "@/components/AuraLogo";
import ThemeAndLangSwitch from "@/components/ThemeAndLangSwitch";
import NotificationCenter from "@/components/NotificationCenter";
import { usePreferences, useInitPreferences } from "@/lib/themeStore";
import { TranslationKey } from "@/lib/i18n";
import {
  LayoutDashboard,
  Globe,
  MessageSquare,
  FileText,
  LogOut,
  Menu,
  Users,
  Crown,
  GitCompare
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: any;
}

const navItems: NavItem[] = [
  { href: "/dashboard", labelKey: "navDashboard", icon: LayoutDashboard },
  { href: "/dashboard/websites", labelKey: "navWebsites", icon: Globe },
  { href: "/dashboard/chat", labelKey: "navChat", icon: MessageSquare },
  { href: "/dashboard/documents", labelKey: "navDocuments", icon: FileText },
  { href: "/dashboard/cross-analysis", labelKey: "navCrossAnalysis", icon: GitCompare },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  useInitPreferences();
  const { user, logout } = useAuth();
  const { t } = usePreferences();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 glass border-r border-white/10 flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:inset-auto`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <AuraLogo size={36} textClassName="text-xl font-black tracking-widest text-white" />
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, labelKey, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span suppressHydrationWarning>{t(labelKey)}</span>
              </Link>
            );
          })}

          {/* Kurum Yöneticisi Menüsü */}
          {user?.roles?.some((r: any) => r.name === 'kurum_yoneticisi' || r.name === 'admin') && (
            <Link
              href="/dashboard/manager"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-4
                ${pathname.startsWith("/dashboard/manager")
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              Kurum Yönetimi
            </Link>
          )}

          {/* Admin Menüsü */}
          {user?.roles?.some((r: any) => r.name === 'admin') && (
            <Link
              href="/dashboard/admin"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-1
                ${pathname.startsWith("/dashboard/admin")
                  ? "bg-red-600/20 text-red-300 border border-red-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <Crown className="w-4 h-4 flex-shrink-0" />
              Admin Paneli
            </Link>
          )}
        </nav>

        {/* Kullanıcı Bilgisi + Çıkış */}
        <div className="px-3 py-4 border-t border-white/10 space-y-3">
          <div className="px-3 py-1">
            <p className="text-white text-sm font-medium truncate">{user?.name ?? "..."}</p>
            <p className="text-zinc-500 text-xs truncate">{user?.email ?? ""}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            {t("navLogout")}
          </button>
        </div>
      </aside>

      {/* Mobil overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Ana İçerik ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky SaaS Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 glass backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
              <AuraLogo size={28} textClassName="text-base font-black tracking-wider text-white" />
            </div>
          </div>

          {/* Sağ Aksiyonlar: Bildirim Merkezi + Tema & Dil */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationCenter />
            <ThemeAndLangSwitch compact />
          </div>
        </header>

        {/* Sayfa İçeriği */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

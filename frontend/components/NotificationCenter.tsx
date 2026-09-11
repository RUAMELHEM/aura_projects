"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePreferences } from "@/lib/themeStore";
import {
  Bell,
  Check,
  CheckCheck,
  Globe,
  FileText,
  ShieldAlert,
  Sparkles,
  X,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export interface NotificationItem {
  id: string;
  type: "scan" | "document" | "security" | "cross";
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  timeTr: string;
  timeEn: string;
  badgeTr: string;
  badgeEn: string;
  link?: string;
  isUnread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "scan",
    titleTr: "Tarama Tamamlandı",
    titleEn: "Scan Completed",
    descTr: "https://example.gov.tr taraması tamamlandı (%84 Sağlık Skoru).",
    descEn: "https://example.gov.tr audit completed (84% Health Score).",
    timeTr: "10 dk önce",
    timeEn: "10m ago",
    badgeTr: "%84 Skor",
    badgeEn: "84% Score",
    link: "/dashboard/websites",
    isUnread: true,
  },
  {
    id: "notif-2",
    type: "document",
    titleTr: "Yeni Doküman Hazır",
    titleEn: "Document Ready",
    descTr: "Web_Standartlari.pdf başarıyla ayrıştırıldı ve RAG için indekslendi.",
    descEn: "Web_Standartlari.pdf successfully parsed & indexed for RAG.",
    timeTr: "45 dk önce",
    timeEn: "45m ago",
    badgeTr: "İndekslendi",
    badgeEn: "Indexed",
    link: "/dashboard/documents",
    isUnread: true,
  },
  {
    id: "notif-3",
    type: "security",
    titleTr: "Kritik Güvenlik Uyarısı",
    titleEn: "Critical Security Alert",
    descTr: "Sitenizde CSP (Content Security Policy) ve X-Frame koruması eksik.",
    descEn: "CSP (Content Security Policy) and X-Frame headers are missing.",
    timeTr: "2 saat önce",
    timeEn: "2h ago",
    badgeTr: "Kritik",
    badgeEn: "Critical",
    link: "/dashboard/websites",
    isUnread: true,
  },
  {
    id: "notif-4",
    type: "cross",
    titleTr: "Çapraz Uyum Raporu",
    titleEn: "Cross-Compliance Report",
    descTr: "Web sitesi teknik bulguları kurumsal yönerge ile eşleştirildi.",
    descEn: "Website findings matched against institutional guidelines.",
    timeTr: "1 gün önce",
    timeEn: "1d ago",
    badgeTr: "%80 Uyum",
    badgeEn: "80% Match",
    link: "/dashboard/cross-analysis",
    isUnread: false,
  },
];

export default function NotificationCenter() {
  const { lang, t } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const popoverRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  // Dışarı tıklandığında popover'ı kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Tekil okundu işaretle
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );
  };

  // Tümünü okundu işaretle
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  // İkon seçici
  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "scan":
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case "document":
        return <FileText className="w-4 h-4 text-sky-400" />;
      case "security":
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case "cross":
        return <Sparkles className="w-4 h-4 text-violet-400" />;
    }
  };

  const getBadgeClass = (type: NotificationItem["type"]) => {
    switch (type) {
      case "scan":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "document":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "security":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse";
      case "cross":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Çan Butonu */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Bildirimler"
        title={t("notificationsTitle")}
        className={`relative flex items-center justify-center p-2 rounded-xl glass border border-white/10 transition-all duration-200 ${
          isOpen
            ? "bg-violet-600/20 border-violet-500/40 text-violet-300 shadow-lg shadow-violet-500/20"
            : "text-zinc-400 hover:text-white hover:bg-white/10"
        }`}
      >
        <Bell className={`w-5 h-5 transition-transform ${isOpen ? "rotate-12" : ""}`} />

        {/* Canlı Kırmızı / Parlayan Unread Rozeti */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md shadow-rose-500/50 ring-2 ring-zinc-950">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Açılır Popover Menü */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl glass border border-white/15 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Başlık Çubuğu */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-violet-400" />
                {t("notificationsTitle")}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-full">
                  {unreadCount} {lang === "tr" ? "Yeni" : "New"}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-zinc-400 hover:text-violet-300 flex items-center gap-1 transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t("markAllAsRead")}
              </button>
            )}
          </div>

          {/* Bildirim Listesi */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                {t("noNotifications")}
              </div>
            ) : (
              notifications.map((notif) => {
                const title = lang === "tr" ? notif.titleTr : notif.titleEn;
                const desc = lang === "tr" ? notif.descTr : notif.descEn;
                const time = lang === "tr" ? notif.timeTr : notif.timeEn;
                const badge = lang === "tr" ? notif.badgeTr : notif.badgeEn;

                return (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-3.5 transition-colors cursor-pointer flex gap-3 items-start group ${
                      notif.isUnread
                        ? "bg-violet-500/[0.06] hover:bg-violet-500/[0.12]"
                        : "hover:bg-white/[0.04] opacity-75 hover:opacity-100"
                    }`}
                  >
                    {/* İkon Çerçevesi */}
                    <div className="mt-0.5 p-2 rounded-xl glass border border-white/10 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>

                    {/* İçerik */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                          {title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex-shrink-0 ${getBadgeClass(
                            notif.type
                          )}`}
                        >
                          {badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-1.5">
                        {desc}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>{time}</span>
                        {notif.link && (
                          <Link
                            href={notif.link}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-violet-400 hover:underline"
                          >
                            <span>{lang === "tr" ? "İncele" : "View"}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Okunmadı Noktası */}
                    {notif.isUnread && (
                      <span className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0 animate-pulse" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Alt Footer */}
          <div className="px-4 py-2 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="text-zinc-400">AURA</span>
            <span className="text-[10px] text-zinc-500 font-mono">v1.0</span>
          </div>
        </div>
      )}
    </div>
  );
}

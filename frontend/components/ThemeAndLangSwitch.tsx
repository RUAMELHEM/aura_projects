"use client";

import React from "react";
import { usePreferences } from "@/lib/themeStore";
import { Sun, Moon, Languages } from "lucide-react";

interface Props {
  compact?: boolean;
  className?: string;
}

export default function ThemeAndLangSwitch({ compact = false, className = "" }: Props) {
  const { theme, lang, toggleTheme, setLang } = usePreferences();

  return (
    <div className={`flex items-center gap-1.5 p-1 rounded-xl glass border border-white/10 ${className}`}>
      {/* Theme Toggle (Dark / Light) */}
      <button
        type="button"
        onClick={toggleTheme}
        title={theme === "dark" ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
        className="flex items-center justify-center p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
        )}
        {!compact && (
          <span className="text-xs font-medium ml-1.5 hidden sm:inline">
            {theme === "dark" ? "Light" : "Dark"}
          </span>
        )}
      </button>

      <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

      {/* Language Switcher (TR / EN) */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => setLang("tr")}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
            lang === "tr"
              ? "bg-violet-600 text-white shadow-sm shadow-violet-500/50"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
          title="Türkçe"
        >
          TR
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
            lang === "en"
              ? "bg-violet-600 text-white shadow-sm shadow-violet-500/50"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
          title="English"
        >
          EN
        </button>
      </div>
    </div>
  );
}

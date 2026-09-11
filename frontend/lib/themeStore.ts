"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { Language, translations, TranslationKey } from "./i18n";

export type Theme = "dark" | "light";

interface PreferencesState {
  theme: Theme;
  lang: Language;
  mounted: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  init: () => void;
}

export const usePreferences = create<PreferencesState>((set, get) => ({
  theme: "dark",
  lang: "tr",
  mounted: false,

  init: () => {
    if (typeof window === "undefined") return;
    const savedTheme = (localStorage.getItem("aura_theme") as Theme) || "dark";
    const savedLang = (localStorage.getItem("aura_lang") as Language) || "tr";

    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }

    set({ theme: savedTheme, lang: savedLang, mounted: true });
  },

  toggleTheme: () => {
    const nextTheme: Theme = get().theme === "dark" ? "light" : "dark";
    if (typeof window !== "undefined") {
      localStorage.setItem("aura_theme", nextTheme);
      if (nextTheme === "light") {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    }
    set({ theme: nextTheme });
  },

  setTheme: (theme: Theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("aura_theme", theme);
      if (theme === "light") {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    }
    set({ theme });
  },

  setLang: (lang: Language) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("aura_lang", lang);
    }
    set({ lang });
  },

  t: (key: TranslationKey) => {
    const currentLang = get().lang;
    return translations[currentLang]?.[key] || key;
  },
}));

/** Bileşen açıldığında localStorage tercihlerini yükleyen yardımcı hook */
export function useInitPreferences() {
  const init = usePreferences((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
}

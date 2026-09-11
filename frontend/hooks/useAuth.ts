"use client";

/**
 * 🪝 useAuth Hook
 *
 * React Hook nedir?
 * - "use" ile başlayan özel fonksiyonlar. Component'ler arası ortak mantığı paylaşmak için kullanılır.
 * - useState → değişken sakla (re-render tetikler)
 * - useEffect → component yüklenince / değişince bir şey yap
 * - useCallback → fonksiyonu gereksiz yeniden oluşturma
 *
 * Bu hook ne yapıyor?
 * - Sayfa açılınca "oturumum var mı?" diye Laravel'e sorar (getUser)
 * - login/logout fonksiyonlarını sarmalar
 * - Tüm sayfalar bu hook'u import edip kullanabilir
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser, login as apiLogin, logout as apiLogout, register as apiRegister, User } from "@/lib/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth({ redirectIfAuthenticated }: { redirectIfAuthenticated?: string } = {}) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Sayfa yüklenince oturumu kontrol et
  useEffect(() => {
    getUser()
      .then((user) => {
        setState({ user, loading: false, error: null });
        // Zaten giriş yapmışsa, belirtilen sayfaya yönlendir
        if (redirectIfAuthenticated) {
          router.push(redirectIfAuthenticated);
        }
      })
      .catch(() => {
        // 401 geldi = oturum yok, normal durum
        setState({ user: null, loading: false, error: null });
      });
  }, [redirectIfAuthenticated, router]);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const user = await apiLogin(email, password);
      setState({ user, loading: false, error: null });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Giriş yapılamadı. E-posta veya şifre hatalı.";
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, [router]);

  const register = useCallback(async (name: string, email: string, password: string, department_id: number) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const user = await apiRegister({ name, email, password, password_confirmation: password, department_id });
      setState({ user, loading: false, error: null });
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("🔴 Register hatası tam detay:", err);
      console.error("🔴 Response data:", (err as any)?.response?.data);
      console.error("🔴 Response status:", (err as any)?.response?.status);
      const resData = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data;
      const errors = resData?.errors;
      const message = errors ? Object.values(errors).flat().join(" ") : (resData?.message || "Kayıt olunamadı.");
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, [router]);

  const fetchUser = useCallback(async () => {
    try {
      const user = await getUser();
      setState((s) => ({ ...s, user }));
      return user;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setState({ user: null, loading: false, error: null });
      router.push("/login");
    }
  }, [router]);

  return {
    ...state,
    login,
    register,
    logout,
    fetchUser,
  };
}

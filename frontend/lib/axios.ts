/**
 * 📡 API İletişim Katmanı
 *
 * Bu dosya tüm projede tek bir axios örneği oluşturur.
 * Neden önemli?
 * - baseURL'i bir kere yazıyoruz, her yerde `/api/user` demek yeterli
 * - withCredentials: true → cookie (session) tabanlı Laravel Sanctum auth için şart
 * - Her istekten önce CSRF token alıyoruz (Laravel bunu zorunlu tutar)
 */

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true, // Cookie gönder/al (Sanctum session auth)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest", // Laravel'e "bu AJAX isteği" bilgisi
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});


/**
 * İstek göndermeden önce Laravel'den CSRF cookie'sini al.
 * Laravel Sanctum, form gönderimlerini CSRF saldırısına karşı korur.
 * /sanctum/csrf-cookie endpoint'i çerezleri ayarlar,
 * sonraki isteklerde bu token header'a otomatik eklenir.
 */
export async function initCsrf() {
  await api.get("/sanctum/csrf-cookie");
}

export default api;

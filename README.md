# 🌌 AURA — AI Unified Research & Audit

> **Kurumsal Doküman Analizi, Güvenli Web Sitesi Denetimi ve Yapay Zekâ Destekli Mevzuat Uyumluluk Platformu**

AURA, kurumların sahip olduğu teknik standartlar ve yönergeler ile gerçek web sitelerini yapay zekâ destekli analizlerle denetleyen, RAG (Retrieval-Augmented Generation) tabanlı doküman soru-cevap ve otomatik website audit platformudur.

---

## 🏗️ Sistem Mimarisi

```mermaid
graph TD
    Client[Kullanıcı Tarayıcısı] -->|Next.js Arayüzü / Port 3000| Frontend[Aura Frontend]
    Frontend -->|REST API / Sanctum Token| Backend[Aura Backend - Laravel 10]
    
    Backend -->|PostgreSQL 15 + pgvector| DB[(Veritabanı)]
    Backend -->|Kuyruk / Asenkron İşler| Redis[(Redis Kuyruğu)]
    Backend -->|X-Internal-API-Key| PythonService[Aura AI Service - FastAPI / Port 8001]
    
    PythonService -->|Vektör Benzerlik Araması <=>| DB
    PythonService -->|Güvenli Tarama + SSRF Filtresi| TargetWebsites[Hedef Web Siteleri]
```

### Katmanlar ve Teknolojiler:
* **Frontend:** Next.js (App Router, Turbopack), TypeScript, Tailwind CSS, Recharts, Lucide Icons.
* **Backend API:** PHP 8.2, Laravel 10, Laravel Sanctum, Redis Queues & Workers.
* **AI & Denetim Servisi:** Python 3.11, FastAPI, PyMuPDF, EasyOCR, Sentence Transformers, HTTPX, BeautifulSoup4, RAG Engine.
* **Veritabanı & Altyapı:** PostgreSQL 15 (`pgvector` vektör arama eklentisi ile), Redis 7, Docker Compose.

---


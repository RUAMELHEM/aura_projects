/**
 * 🔌 API Fonksiyonları
 *
 * Tüm backend (Laravel) endpoint'lerini buraya topluyoruz.
 * Sayfalar doğrudan axios kullanmak yerine bu fonksiyonları çağırır.
 * Bu sayede endpoint URL'i değişirse sadece burayı güncelliyoruz.
 */

import api, { initCsrf } from "./axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const getLocalToken = () => (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);

// ─── SYSTEM SETUP ─────────────────────────────────────────────────────────────
export const checkSetupStatus = async (): Promise<{ needsSetup: boolean }> => {
  const { data } = await api.get("/api/system/setup-status");
  return data;
};

export const claimAdminRole = async (): Promise<any> => {
  const { data } = await api.post("/api/system/setup");
  return data;
};

// ─── Tip Tanımlamaları ────────────────────────────────────────────────────────

export interface Department {
  id: number;
  name: string;
  description: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  department_id: number;
  department?: Department;
  roles?: { id: number; name: string; label?: string }[];
}

export interface Website {
  id: number;
  url: string;
  name: string;
  user_id: number;
  department_id: number;
  created_at: string;
  latest_scan?: WebsiteScan;
}

export interface WebsiteScan {
  id: number;
  website_id: number;
  status: "pending" | "running" | "completed" | "failed";
  overall_score: number | null;
  seo_score: number | null;
  security_score: number | null;
  performance_score: number | null;
  accessibility_score: number | null;
  pages_crawled: number | null;
  completed_at: string | null;
  created_at: string;
  website?: Website;
  report?: AuditReport;
}

export interface AuditReport {
  id: number;
  overall_score: number;
  total_issues: number;
  ai_summary: string | null;
  ai_recommendations: string[] | null;
  issues: Issue[];
}

export interface Issue {
  category: string;
  severity: "high" | "medium" | "low";
  code: string;
  message: string;
  url?: string;
}

// ─── Documents & Chat ─────────────────────────────────────────────────────────

export interface Document {
  id: number;
  user_id: number;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: "uploaded" | "processing" | "processed" | "completed" | "failed";
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages_count?: number;
  messages?: Message[];
}

export interface Message {
  id: number;
  conversation_id: number;
  sender: "user" | "ai";
  content: string;
  created_at: string;
  sources?: AiSource[];
}

export interface AiSource {
  id: number;
  message_id: number;
  document_id: number;
  chunk_index: number;
  similarity_score: number;
  snippet: string;
  document?: Document;
}

// ─── Auth & Departments ───────────────────────────────────────────────────────

/** Giriş yap */
export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post("/api/login", { email, password });
  if (data?.token && typeof window !== "undefined") {
    localStorage.setItem("auth_token", data.token);
  }
  return data.user || getUser();
}

/** Kayıt ol */
export async function register(data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  department_id: number;
}): Promise<User> {
  const { data: resData } = await api.post("/api/register", data);
  if (resData?.token && typeof window !== "undefined") {
    localStorage.setItem("auth_token", resData.token);
  }
  return resData.user || getUser();
}

/** Çıkış yap */
export async function logout(): Promise<void> {
  try {
    await api.post("/api/logout");
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }
}

/** Oturum açık kullanıcıyı getir */
export async function getUser(): Promise<User> {
  const { data } = await api.get("/api/user");
  return data;
}

/** Departmanları getir */
export async function getDepartments(): Promise<Department[]> {
  const { data } = await api.get("/api/departments");
  return data.data ?? data;
}

// ─── Websites ─────────────────────────────────────────────────────────────────

/** Kullanıcının tüm web sitelerini getir */
export async function getWebsites(): Promise<Website[]> {
  const { data } = await api.get("/api/websites");
  return data.data ?? data;
}

/** Yeni web sitesi ekle */
export async function createWebsite(url: string, name: string): Promise<Website> {
  const { data } = await api.post("/api/websites", { url, name });
  return data.data ?? data;
}

/** Tek bir web sitesini getir */
export async function getWebsite(id: number): Promise<Website> {
  const { data } = await api.get(`/api/websites/${id}`);
  return data.data ?? data;
}

/** Web sitesi için tarama başlat */
export async function startScan(websiteId: number): Promise<WebsiteScan> {
  const { data } = await api.post(`/api/websites/${websiteId}/scan`);
  return data.data ?? data;
}

/** Web sitesinin tarama geçmişini getir */
export async function getWebsiteScans(websiteId: number): Promise<WebsiteScan[]> {
  const { data } = await api.get(`/api/websites/${websiteId}/scans`);
  return data.data ?? data;
}

// ─── Scans ────────────────────────────────────────────────────────────────────

/** Tek bir tarama raporunu getir */
export async function getScan(scanId: number): Promise<WebsiteScan> {
  const { data } = await api.get(`/api/scans/${scanId}`);
  return data.data ?? data;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getDocuments(): Promise<Document[]> {
  const { data } = await api.get("/api/documents");
  return data.data ?? data;
}

export async function uploadDocument(title: string, file: File): Promise<Document> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  
  const { data } = await api.post("/api/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data ?? data;
}

export async function deleteDocument(id: number): Promise<void> {
  await api.delete(`/api/documents/${id}`);
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get("/api/conversations");
  return data.data ?? data;
}

export async function createConversation(title?: string): Promise<Conversation> {
  const { data } = await api.post("/api/conversations", { title });
  return data.data ?? data;
}

export async function getConversation(id: number): Promise<Conversation> {
  const { data } = await api.get(`/api/conversations/${id}`);
  return data.data ?? data;
}

export async function sendMessage(conversationId: number, content: string, documentId?: number): Promise<{ user_message: Message, ai_message: Message }> {
  const payload: any = { content };
  if (documentId) payload.document_id = documentId;
  
  const { data } = await api.post(`/api/conversations/${conversationId}/messages`, payload);
  return data;
}

// ─── Manager ──────────────────────────────────────────────────────────────────

export async function getManagerUsers(): Promise<User[]> {
  const { data } = await api.get("/api/manager/users");
  return data.data ?? data;
}

export async function getManagerStats(): Promise<any> {
  const { data } = await api.get("/api/manager/stats");
  return data.data ?? data;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

/** Sistemdeki tüm kullanıcıları listele (sadece admin) */
export async function adminGetUsers(): Promise<User[]> {
  const { data } = await api.get("/api/admin/users");
  return data.data ?? data;
}

/** Sistemdeki tüm rolleri listele */
export async function adminGetRoles(): Promise<{ id: number; name: string }[]> {
  const { data } = await api.get("/api/admin/roles");
  return data.data ?? data;
}

/** Bir kullanıcıya rol ata */
export async function adminAssignRole(userId: number, role: string): Promise<User> {
  const { data } = await api.post(`/api/admin/users/${userId}/roles`, { role });
  return data.user;
}

/** Bir kullanıcıdan rol kaldır */
export async function adminRemoveRole(userId: number, role: string): Promise<User> {
  const { data } = await api.delete(`/api/admin/users/${userId}/roles`, { data: { role } });
  return data.user;
}

// ─── Cross Analysis (Cross Intelligence) ──────────────────────────────────────

export interface CrossAnalysisRule {
  id: string;
  category: string;
  rule: string;
  status: string;
  evidence?: string;
  severity?: "high" | "medium" | "low";
  finding?: string;
  recommendation?: string;
}

export interface CrossAnalysisResult {
  compliance_rate: number;
  overall_audit_score: number;
  total_rules_evaluated: number;
  passed_rules_count: number;
  violation_count: number;
  verdict: string;
  summary: string;
  compliant_rules: CrossAnalysisRule[];
  violations: CrossAnalysisRule[];
  document_rules_retrieved: number;
  document_context_used: Array<{
    document_id: number;
    page_number?: number;
    text: string;
    similarity: number;
  }>;
  website: {
    id: number;
    name: string;
    url: string;
  };
  document?: {
    id: number;
    title: string;
    file_name: string;
  } | null;
  scan_id: number;
}

export async function runCrossAnalysis(payload: {
  website_id: number;
  document_id?: number | null;
  query?: string;
}): Promise<CrossAnalysisResult> {
  const { data } = await api.post("/api/cross-analysis", payload);
  return data;
}

// ─── Dashboard Summary & Analytics ──────────────────────────────────────────

export interface DashboardSummaryData {
  documents_count: number;
  ai_questions: number;
  websites: number;
  audits: number;
  users_count: number;
  average_audit_score: number | null;
  critical_issues_count: number;
  daily_ai_usage: Array<{
    date: string;
    label: string;
    questions: number;
    answers: number;
  }>;
  issues_by_category: Array<{
    type: string;
    category: string;
    count: number;
  }>;
  top_documents: Array<{
    id: number;
    title: string;
    file_name: string;
    file_type: string;
    page_count: number;
    status: string;
    sources_count: number;
  }>;
  recent_scans: Array<{
    id: number;
    website_id: number;
    overall_score: number | null;
    seo_score: number | null;
    security_score: number | null;
    performance_score: number | null;
    accessibility_score: number | null;
    created_at: string;
    website?: {
      id: number;
      name?: string;
      title?: string;
      url: string;
    };
  }>;
}

export async function getDashboardSummary(): Promise<DashboardSummaryData> {
  const { data } = await api.get("/api/dashboard/summary");
  return data;
}


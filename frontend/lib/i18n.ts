export type Language = "tr" | "en";

export const translations = {
  tr: {
    // Navigation
    navDashboard: "Genel Bakış",
    navWebsites: "Web Siteleri",
    navChat: "Doküman Asistanı",
    navDocuments: "Dokümanlarım",
    navCrossAnalysis: "Çapraz Analiz",
    navManager: "Kurum Yönetimi",
    navAdmin: "Admin Paneli",
    navLogout: "Çıkış Yap",
    
    // Branding & Header
    appTitle: "AURA",
    appSubtitle: "AI Destekli Araştırma & Denetim",
    
    // Theme & Language
    themeDark: "Karanlık Mod",
    themeLight: "Aydınlık Mod",
    langTr: "Türkçe",
    langEn: "English",

    // Common Actions
    addWebsite: "Site Ekle",
    uploadDoc: "Dosya Yükle",
    delete: "Sil",
    cancel: "İptal",
    save: "Kaydet",
    scan: "Tara",
    refresh: "Yenile",
    confirmDelete: "Bu öğeyi silmek istediğinize emin misiniz?",
    loading: "Yükleniyor...",
    searchPlaceholder: "Ara...",

    // Dashboard Cards
    totalWebsites: "Taranan Siteler",
    totalDocuments: "Yüklenen Belgeler",
    activeChats: "AI Sorguları",
    averageScore: "Ortalama Güvenlik & SEO Skoru",
    recentScans: "Son Taramalar",
    // Notifications
    notificationsTitle: "Bildirimler",
    markAllAsRead: "Tümünü Okundu Say",
    noNotifications: "Henüz yeni bir bildiriminiz yok",
    notificationCenter: "Bildirim Merkezi",
  },
  en: {
    // Navigation
    navDashboard: "Dashboard",
    navWebsites: "Websites",
    navChat: "Document Assistant",
    navDocuments: "Documents",
    navCrossAnalysis: "Cross Intelligence",
    navManager: "Department Manager",
    navAdmin: "Admin Console",
    navLogout: "Sign Out",
    
    // Branding & Header
    appTitle: "AURA",
    appSubtitle: "AI Unified Research & Audit",
    
    // Theme & Language
    themeDark: "Dark Mode",
    themeLight: "Light Mode",
    langTr: "Turkish",
    langEn: "English",

    // Common Actions
    addWebsite: "Add Website",
    uploadDoc: "Upload File",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save",
    scan: "Scan",
    refresh: "Refresh",
    confirmDelete: "Are you sure you want to delete this item?",
    loading: "Loading...",
    searchPlaceholder: "Search...",

    // Dashboard Cards
    totalWebsites: "Audited Websites",
    totalDocuments: "Indexed Documents",
    activeChats: "AI Inquiries",
    averageScore: "Average Health Score",
    recentScans: "Recent Scans",
    // Notifications
    notificationsTitle: "Notifications",
    markAllAsRead: "Mark All Read",
    noNotifications: "No new notifications yet",
    notificationCenter: "Notification Center",
  },
} as const;

export type TranslationKey = keyof typeof translations["tr"];

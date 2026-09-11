<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AURA — Yönetim Paneli</title>
    <meta name="description" content="AURA yapay zeka destekli kamu web yönetim paneli">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --bg: #0a0f1e; --surface: #111827; --surface2: #1a2235;
            --border: #1e2d45; --accent: #3b82f6; --accent2: #8b5cf6;
            --green: #10b981; --yellow: #f59e0b; --red: #ef4444;
            --text: #e2e8f0; --muted: #64748b;
        }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
        nav {
            background: rgba(17,24,39,0.95); backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border); padding: 0 2rem;
            height: 60px; display: flex; align-items: center; justify-content: space-between;
            position: sticky; top: 0; z-index: 100;
        }
        .nav-logo { font-size: 1.3rem; font-weight: 800; background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav-links a { color: var(--muted); text-decoration: none; margin-left: 1.5rem; font-size: 0.9rem; transition: color 0.2s; }
        .nav-links a:hover, .nav-links a.active { color: var(--text); }
        .container { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }
        h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; }
        h1 span { background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .subtitle { color: var(--muted); font-size: 0.95rem; margin-bottom: 2.5rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem; }
        .stat-card {
            background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
            padding: 1.5rem; transition: border-color 0.2s, transform 0.2s;
        }
        .stat-card:hover { border-color: var(--accent); transform: translateY(-2px); }
        .stat-icon { font-size: 2rem; margin-bottom: 0.75rem; }
        .stat-value { font-size: 2.5rem; font-weight: 800; line-height: 1; }
        .stat-label { color: var(--muted); font-size: 0.85rem; margin-top: 0.4rem; }
        .quick-links { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
        .quick-card {
            background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
            padding: 1.5rem; text-decoration: none; color: var(--text);
            transition: border-color 0.2s, transform 0.2s; display: block;
        }
        .quick-card:hover { border-color: var(--accent); transform: translateY(-2px); }
        .quick-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; }
        .quick-card p { color: var(--muted); font-size: 0.85rem; line-height: 1.5; }
        .quick-card .qicon { font-size: 2rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <nav>
        <div class="nav-logo">AURA</div>
        <div class="nav-links">
            <a href="/dashboard" class="active">Panel</a>
            <a href="/documents">Dokümanlar</a>
            <a href="/chat">Sohbet</a>
            <a href="/websites">Web Denetimi</a>
        </div>
    </nav>
    <div class="container">
        <h1>Hoş Geldiniz, <span>AURA</span></h1>
        <p class="subtitle">Yapay zeka destekli kamu web denetim ve araştırma platformu</p>

        <div class="stats-grid" id="stats-grid">
            <div class="stat-card"><div class="stat-icon">📄</div><div class="stat-value" id="s-docs">—</div><div class="stat-label">Yüklü Doküman</div></div>
            <div class="stat-card"><div class="stat-icon">💬</div><div class="stat-value" id="s-ai">—</div><div class="stat-label">AI Sorgusu</div></div>
            <div class="stat-card"><div class="stat-icon">🌐</div><div class="stat-value" id="s-web">—</div><div class="stat-label">Denetlenen Site</div></div>
            <div class="stat-card"><div class="stat-icon">🔍</div><div class="stat-value" id="s-audit">—</div><div class="stat-label">Tamamlanan Denetim</div></div>
            <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value" id="s-users">—</div><div class="stat-label">Kullanıcı</div></div>
        </div>

        <div class="quick-links">
            <a href="/documents" class="quick-card">
                <div class="qicon">📚</div>
                <h3>Doküman Yönetimi</h3>
                <p>PDF, DOCX ve XLSX dosyalarını yükleyin. AI motoru otomatik olarak indeksleyip soru-cevap için hazırlar.</p>
            </a>
            <a href="/chat" class="quick-card">
                <div class="qicon">🤖</div>
                <h3>AI Sohbet Asistanı</h3>
                <p>Yüklenen dokümanlar üzerinde doğal dilde soru sorun. RAG motoru belgelerde kaynak göstererek cevap üretir.</p>
            </a>
            <a href="/websites" class="quick-card">
                <div class="qicon">🔎</div>
                <h3>Web Sitesi Denetimi</h3>
                <p>Herhangi bir web sitesini URL ile ekleyin; SEO, güvenlik, performans ve erişilebilirlik otomatik analiz edilir.</p>
            </a>
        </div>
    </div>
    <script>
        fetch('/api/dashboard/summary', { headers: { Accept: 'application/json' } })
            .then(r => r.json())
            .then(d => {
                document.getElementById('s-docs').textContent = d.documents_count ?? '—';
                document.getElementById('s-ai').textContent = d.ai_questions ?? '—';
                document.getElementById('s-web').textContent = d.websites ?? '—';
                document.getElementById('s-audit').textContent = d.audits ?? '—';
                document.getElementById('s-users').textContent = d.users_count ?? '—';
            }).catch(() => {});
    </script>
</body>
</html>

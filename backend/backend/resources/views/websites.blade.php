<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AURA — Web Sitesi Denetimi</title>
    <meta name="description" content="AURA yapay zeka destekli web sitesi SEO, güvenlik, performans ve erişilebilirlik denetim sistemi">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg: #0a0f1e;
            --surface: #111827;
            --surface2: #1a2235;
            --border: #1e2d45;
            --accent: #3b82f6;
            --accent2: #8b5cf6;
            --green: #10b981;
            --yellow: #f59e0b;
            --red: #ef4444;
            --text: #e2e8f0;
            --muted: #64748b;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
        }

        /* NAV */
        nav {
            background: rgba(17,24,39,0.95);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border);
            padding: 0 2rem;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .nav-logo { font-size: 1.3rem; font-weight: 800; background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav-links a { color: var(--muted); text-decoration: none; margin-left: 1.5rem; font-size: 0.9rem; transition: color 0.2s; }
        .nav-links a:hover, .nav-links a.active { color: var(--text); }

        /* MAIN LAYOUT */
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }

        /* PAGE HEADER */
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
        .page-title { font-size: 1.8rem; font-weight: 700; }
        .page-title span { background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        /* ADD FORM CARD */
        .add-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        .add-card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .add-form { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
        .form-group { flex: 1; min-width: 200px; }
        .form-group label { display: block; font-size: 0.8rem; color: var(--muted); margin-bottom: 0.4rem; }
        .form-group input {
            width: 100%;
            background: var(--surface2);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 0.75rem 1rem;
            color: var(--text);
            font-size: 0.9rem;
            font-family: inherit;
            transition: border-color 0.2s;
            outline: none;
        }
        .form-group input:focus { border-color: var(--accent); }
        .btn-primary {
            background: linear-gradient(135deg, var(--accent), var(--accent2));
            border: none;
            border-radius: 10px;
            padding: 0.75rem 1.5rem;
            color: #fff;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
            transition: opacity 0.2s, transform 0.1s;
            white-space: nowrap;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* WEBSITES GRID */
        .websites-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; }

        /* WEBSITE CARD */
        .website-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            transition: border-color 0.2s, transform 0.2s;
            cursor: pointer;
        }
        .website-card:hover { border-color: var(--accent); transform: translateY(-2px); }
        .card-header { padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; }
        .card-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem; }
        .card-url { font-size: 0.8rem; color: var(--muted); word-break: break-all; }
        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
            flex-shrink: 0;
        }
        .status-pending, .status-running { background: rgba(245,158,11,0.15); color: var(--yellow); }
        .status-completed { background: rgba(16,185,129,0.15); color: var(--green); }
        .status-failed { background: rgba(239,68,68,0.15); color: var(--red); }
        .status-active { background: rgba(59,130,246,0.15); color: var(--accent); }
        .status-scanning { background: rgba(245,158,11,0.15); color: var(--yellow); }

        /* SCORE BAR AREA */
        .score-area { padding: 0 1.5rem 1.5rem; }
        .score-main { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1rem; }
        .score-circle {
            width: 64px; height: 64px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem; font-weight: 800;
            flex-shrink: 0;
        }
        .score-high { background: rgba(16,185,129,0.15); color: var(--green); border: 2px solid rgba(16,185,129,0.3); }
        .score-mid  { background: rgba(245,158,11,0.15); color: var(--yellow); border: 2px solid rgba(245,158,11,0.3); }
        .score-low  { background: rgba(239,68,68,0.15);  color: var(--red);    border: 2px solid rgba(239,68,68,0.3); }

        .score-cats { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
        .score-cat { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--muted); }
        .score-cat span:last-child { font-weight: 600; color: var(--text); }

        .issues-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .issue-badge { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
        .ib-high { background: rgba(239,68,68,0.15); color: var(--red); }
        .ib-medium { background: rgba(245,158,11,0.15); color: var(--yellow); }
        .ib-low { background: rgba(100,116,139,0.2); color: var(--muted); }

        .scan-btn {
            margin: 0 1.5rem 1.2rem;
            width: calc(100% - 3rem);
            background: var(--surface2);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 0.5rem;
            color: var(--muted);
            font-size: 0.8rem;
            cursor: pointer;
            font-family: inherit;
            transition: background 0.2s, color 0.2s;
        }
        .scan-btn:hover { background: var(--border); color: var(--text); }

        /* SCANNING ANIMATION */
        .scanning-pulse {
            padding: 1.5rem;
            text-align: center;
            color: var(--yellow);
            font-size: 0.9rem;
        }
        .pulse-dot {
            display: inline-block;
            width: 8px; height: 8px;
            background: var(--yellow);
            border-radius: 50%;
            animation: pulse 1.2s infinite;
            margin: 0 2px;
        }
        .pulse-dot:nth-child(2) { animation-delay: 0.2s; }
        .pulse-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }

        /* DETAIL MODAL */
        .modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
            z-index: 1000;
            display: flex; align-items: center; justify-content: center;
            padding: 1rem;
            opacity: 0; pointer-events: none;
            transition: opacity 0.2s;
        }
        .modal-overlay.open { opacity: 1; pointer-events: all; }
        .modal {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 20px;
            max-width: 720px;
            width: 100%;
            max-height: 85vh;
            overflow-y: auto;
            padding: 2rem;
            transform: translateY(20px);
            transition: transform 0.2s;
        }
        .modal-overlay.open .modal { transform: translateY(0); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-title { font-size: 1.3rem; font-weight: 700; }
        .modal-close { background: none; border: none; color: var(--muted); font-size: 1.5rem; cursor: pointer; line-height: 1; }
        .modal-close:hover { color: var(--text); }

        .scores-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .score-card {
            background: var(--surface2);
            border-radius: 12px;
            padding: 1rem;
            text-align: center;
        }
        .score-card .label { font-size: 0.75rem; color: var(--muted); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .score-card .value { font-size: 2rem; font-weight: 800; }
        .score-card .value.high { color: var(--green); }
        .score-card .value.mid  { color: var(--yellow); }
        .score-card .value.low  { color: var(--red); }

        .ai-box { background: var(--surface2); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
        .ai-box h4 { font-size: 0.85rem; color: var(--accent); font-weight: 600; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .ai-summary { font-size: 0.9rem; color: var(--text); line-height: 1.6; }
        .recommendations { margin-top: 1rem; list-style: none; }
        .recommendations li { font-size: 0.85rem; color: var(--muted); padding: 0.4rem 0; padding-left: 1.25rem; position: relative; }
        .recommendations li::before { content: '→'; position: absolute; left: 0; color: var(--accent); }

        .issues-list h4 { font-size: 0.85rem; color: var(--muted); font-weight: 600; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .issue-item {
            display: flex; gap: 0.75rem; align-items: flex-start;
            padding: 0.75rem 1rem;
            background: var(--surface2);
            border-radius: 10px;
            margin-bottom: 0.5rem;
        }
        .issue-sev { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px; flex-shrink: 0; text-transform: uppercase; margin-top: 2px; }
        .sev-high { background: rgba(239,68,68,0.2); color: var(--red); }
        .sev-medium { background: rgba(245,158,11,0.2); color: var(--yellow); }
        .sev-low { background: rgba(100,116,139,0.2); color: var(--muted); }
        .issue-text { font-size: 0.85rem; color: var(--text); line-height: 1.4; }
        .chart-box { background: var(--surface2); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; }
        .chart-box h4 { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem; text-transform: uppercase; }
        .chart-box canvas { width: 100% !important; max-height: 220px; }
        .filter-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .filter-btn { background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; color: var(--muted); cursor: pointer; font-size: 0.75rem; padding: 0.35rem 0.6rem; }
        .filter-btn.active, .filter-btn:hover { border-color: var(--accent); color: var(--text); }

        /* EMPTY STATE */
        .empty-state { text-align: center; padding: 4rem 2rem; color: var(--muted); }
        .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
        .empty-state h3 { font-size: 1.2rem; color: var(--text); margin-bottom: 0.5rem; }

        /* TOAST */
        .toast { position: fixed; bottom: 2rem; right: 2rem; z-index: 2000; }
        .toast-msg {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1rem 1.5rem;
            font-size: 0.9rem;
            margin-top: 0.5rem;
            animation: slideIn 0.3s ease;
        }
        .toast-msg.success { border-color: var(--green); color: var(--green); }
        .toast-msg.error { border-color: var(--red); color: var(--red); }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    </style>
</head>
<body>
    <nav>
        <div class="nav-logo">AURA</div>
        <div class="nav-links">
            <a href="/dashboard">Panel</a>
            <a href="/documents">Dokümanlar</a>
            <a href="/chat">Sohbet</a>
            <a href="/websites" class="active">Web Denetimi</a>
        </div>
    </nav>

    <div class="container">
        <div class="page-header">
            <div>
                <div class="page-title">Web <span>Denetim</span> Sistemi</div>
                <p style="color: var(--muted); font-size:0.9rem; margin-top:0.25rem;">
                    SEO, Güvenlik, Performans ve Erişilebilirlik otomatik analizi
                </p>
            </div>
        </div>

        <!-- URL EKleme FORMU -->
        <div class="add-card">
            <h3>🔍 Yeni Web Sitesi Ekle</h3>
            <div class="add-form">
                <div class="form-group">
                    <label>Site Adı (Opsiyonel)</label>
                    <input id="site-title" type="text" placeholder="Örn: Belediye Ana Sayfası">
                </div>
                <div class="form-group" style="flex:2">
                    <label>URL</label>
                    <input id="site-url" type="url" placeholder="https://ornek.com">
                </div>
                <button class="btn-primary" id="add-btn" onclick="addWebsite()">
                    Taramayı Başlat
                </button>
            </div>
        </div>

        <!-- WEB SİTELERİ GRİD -->
        <div id="websites-grid" class="websites-grid">
            <div class="empty-state" style="grid-column:1/-1">
                <div class="empty-icon">🌐</div>
                <h3>Henüz web sitesi eklenmedi</h3>
                <p>Denetlemek istediğiniz web sitesinin URL'sini girin ve taramayı başlatın.</p>
            </div>
        </div>
    </div>

    <!-- DETAY MODali -->
    <div class="modal-overlay" id="detail-modal" onclick="closeModalOutside(event)">
        <div class="modal" id="modal-content">
            <div class="modal-header">
                <div class="modal-title" id="modal-title">—</div>
                <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <div id="modal-body"></div>
        </div>
    </div>

    <!-- TOAST -->
    <div class="toast" id="toast"></div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
    <script>
        const API = '/api';
        let pollTimers = {};
        let detailIssues = [];

        // --- API Helpers ---
        async function apiFetch(path, opts = {}) {
            const r = await fetch(API + path, {
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(opts.headers || {}) },
                ...opts,
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.message || data.detail || 'İstek başarısız');
            return data;
        }

        // --- TOAST ---
        function toast(msg, type = 'success') {
            const t = document.getElementById('toast');
            const el = document.createElement('div');
            el.className = `toast-msg ${type}`;
            el.textContent = msg;
            t.appendChild(el);
            setTimeout(() => el.remove(), 4000);
        }

        // --- SCORE HELPERS ---
        function scoreClass(s) { return s >= 70 ? 'high' : s >= 45 ? 'mid' : 'low'; }
        function scoreCircleClass(s) { return s >= 70 ? 'score-high' : s >= 45 ? 'score-mid' : 'score-low'; }

        // --- RENDER ---
        function renderWebsites(list) {
            const grid = document.getElementById('websites-grid');
            if (!list.length) {
                grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
                    <div class="empty-icon">🌐</div>
                    <h3>Henüz web sitesi eklenmedi</h3>
                    <p>Denetlemek istediğiniz web sitesinin URL'sini girin ve taramayı başlatın.</p>
                </div>`;
                return;
            }

            grid.innerHTML = list.map(w => {
                const scan = w.latest_scan;
                const status = w.status;

                let bodyHtml = '';
                if (status === 'scanning' || (scan && scan.status === 'running')) {
                    bodyHtml = `<div class="scanning-pulse">
                        <div class="pulse-dot"></div>
                        <div class="pulse-dot"></div>
                        <div class="pulse-dot"></div>
                        <br>Taranıyor...
                    </div>`;
                } else if (scan && scan.status === 'completed') {
                    const sc = scan.overall_score;
                    const cats = [
                        ['SEO', scan.seo_score], ['Güvenlik', scan.security_score],
                        ['Performans', scan.performance_score], ['Erişilebilirlik', scan.accessibility_score]
                    ];
                    bodyHtml = `<div class="score-area">
                        <div class="score-main">
                            <div class="score-circle ${scoreCircleClass(sc)}">${sc}</div>
                            <div class="score-cats">
                                ${cats.map(([l, v]) => `<div class="score-cat"><span>${l}</span><span class="${scoreClass(v)}">${v}</span></div>`).join('')}
                            </div>
                        </div>
                        <div class="issues-row">
                            <span class="issue-badge ib-high">🔴 ${scan.issues_high || 0} Kritik</span>
                            <span class="issue-badge ib-medium">🟡 ${scan.issues_medium || 0} Orta</span>
                            <span class="issue-badge ib-low">⚪ ${scan.issues_low || 0} Düşük</span>
                        </div>
                    </div>`;
                } else if (scan && scan.status === 'failed') {
                    bodyHtml = `<div style="padding:1rem 1.5rem;color:var(--red);font-size:0.85rem">❌ Tarama başarısız: ${scan.error || 'Bilinmeyen hata'}</div>`;
                }

                return `<div class="website-card" onclick="openDetail(${w.id})">
                    <div class="card-header">
                        <div>
                            <div class="card-title">${w.title || w.url}</div>
                            <div class="card-url">${w.url}</div>
                        </div>
                        <span class="status-badge status-${status}">${statusLabel(status, scan)}</span>
                    </div>
                    ${bodyHtml}
                    <button class="scan-btn" onclick="event.stopPropagation(); startScan(${w.id}, this)">🔄 Yeniden Tara</button>
                </div>`;
            }).join('');

            // Poll scanning sites
            list.forEach(w => {
                if (w.status === 'scanning' && !pollTimers[w.id]) {
                    pollTimers[w.id] = setInterval(() => loadWebsites(), 4000);
                } else if (w.status !== 'scanning' && pollTimers[w.id]) {
                    clearInterval(pollTimers[w.id]);
                    delete pollTimers[w.id];
                }
            });
        }

        function statusLabel(status, scan) {
            if (status === 'scanning') return '⏳ Taranıyor';
            if (scan && scan.status === 'completed') return '✅ Tamamlandı';
            if (scan && scan.status === 'failed') return '❌ Hata';
            return '🟢 Aktif';
        }

        // --- LOAD ---
        async function loadWebsites() {
            try {
                const data = await apiFetch('/open/websites');
                renderWebsites(data);
            } catch (e) {
                console.error(e);
            }
        }

        // --- ADD ---
        async function addWebsite() {
            const url = document.getElementById('site-url').value.trim();
            const title = document.getElementById('site-title').value.trim();
            if (!url) { toast('Lütfen bir URL girin.', 'error'); return; }

            const btn = document.getElementById('add-btn');
            btn.disabled = true; btn.textContent = 'Ekleniyor...';
            try {
                await apiFetch('/open/websites', { method: 'POST', body: JSON.stringify({ url, title: title || null }) });
                document.getElementById('site-url').value = '';
                document.getElementById('site-title').value = '';
                toast('✅ Web sitesi eklendi, tarama başlatıldı!');
                loadWebsites();
            } catch (e) {
                toast(e.message, 'error');
            } finally {
                btn.disabled = false; btn.textContent = 'Taramayı Başlat';
            }
        }

        // --- START SCAN ---
        async function startScan(id, btn) {
            btn.textContent = '⏳ Başlatıldı...';
            btn.disabled = true;
            try {
                await apiFetch(`/open/websites/${id}/scan`, { method: 'POST' });
                toast('✅ Yeniden tarama başlatıldı!');
                loadWebsites();
            } catch (e) {
                toast(e.message, 'error');
            } finally {
                btn.disabled = false; btn.textContent = '🔄 Yeniden Tara';
            }
        }

        // --- DETAIL MODAL ---
        async function openDetail(id) {
            const modal = document.getElementById('detail-modal');
            const body = document.getElementById('modal-body');
            document.getElementById('modal-title').textContent = 'Yükleniyor...';
            body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--muted)">⏳ Yükleniyor...</div>';
            modal.classList.add('open');

            try {
                const w = await apiFetch(`/open/websites/${id}`);
                document.getElementById('modal-title').textContent = w.title || w.url;
                const scans = w.scans || [];
                if (!scans.length) { body.innerHTML = '<p style="color:var(--muted)">Henüz tamamlanmış tarama yok.</p>'; return; }
                const s = scans[0];
                const issues = s.issues || [];
                detailIssues = issues;
                const report = s.audit_report || {};
                const metrics = s.metrics || [];
                const cats = [
                    { label: 'SEO', val: s.seo_score }, { label: 'Güvenlik', val: s.security_score },
                    { label: 'Performans', val: s.performance_score }, { label: 'Erişilebilirlik', val: s.accessibility_score }
                ];
                body.innerHTML = `
                    <div style="margin-bottom:1rem">
                        <span class="status-badge status-${s.status}">${s.status === 'completed' ? '✅ Tamamlandı' : s.status}</span>
                        <span style="color:var(--muted);font-size:0.8rem;margin-left:0.75rem">${w.url}</span>
                    </div>
                    <div class="scores-grid">
                        ${cats.map(c => `<div class="score-card"><div class="label">${c.label}</div><div class="value ${scoreClass(c.val)}">${c.val ?? '—'}</div></div>`).join('')}
                    </div>
                    ${s.ai_summary ? `<div class="ai-box">
                        <h4>🤖 AI Değerlendirmesi</h4>
                        <div class="ai-summary">${s.ai_summary}</div>
                        ${s.ai_recommendations && s.ai_recommendations.length ? `<ul class="recommendations">${s.ai_recommendations.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
                    </div>` : ''}
                    ${report.summary && report.summary !== s.ai_summary ? `<div class="ai-box">
                        <h4>📋 Kayıtlı Audit Raporu</h4>
                        <div class="ai-summary">${report.summary}</div>
                        ${report.recommendations && report.recommendations.length ? `<ul class="recommendations">${report.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
                    </div>` : ''}
                    ${metrics.length ? `<div class="issues-list">
                        <h4>Kategori Metrikleri</h4>
                        ${metrics.map(m => `<div class="issue-item"><span class="issue-sev sev-${scoreClass(m.score)}">${m.score ?? '—'}</span><div class="issue-text">${m.category}</div></div>`).join('')}
                    </div>` : ''}
                    <div class="issues-list">
                        <h4>Tespit Edilen Sorunlar (${issues.length})</h4>
                        <div class="filter-row">
                            <button class="filter-btn active" onclick="filterIssues('all', this)">Tümü</button>
                            <button class="filter-btn" onclick="filterIssues('high', this)">High</button>
                            <button class="filter-btn" onclick="filterIssues('medium', this)">Medium</button>
                            <button class="filter-btn" onclick="filterIssues('low', this)">Low</button>
                        </div>
                        <div id="detail-issues"></div>
                    </div>
                    ${scans.length > 1 ? `<div class="issues-list">
                        <h4>Audit Geçmişi</h4>
                        <div class="chart-box"><canvas id="audit-history-chart"></canvas></div>
                        ${scans.map(history => `<div class="issue-item">
                            <span class="issue-sev sev-${history.status === 'completed' ? 'low' : 'medium'}">${history.overall_score ?? '—'}</span>
                            <div class="issue-text">${history.status} · ${history.created_at ? new Date(history.created_at).toLocaleString('tr-TR') : 'Tarih yok'}</div>
                        </div>`).join('')}
                    </div>` : ''}
                `;
                renderIssueList('all');
                if (scans.length > 1 && window.Chart) {
                    new Chart(document.getElementById('audit-history-chart'), {
                        type: 'line',
                        data: {
                            labels: [...scans].reverse().map(scan => new Date(scan.created_at).toLocaleDateString('tr-TR')),
                            datasets: [{ label: 'Genel Skor', data: [...scans].reverse().map(scan => scan.overall_score), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.18)', tension: 0.25, fill: true }]
                        },
                        options: { responsive: true, scales: { y: { min: 0, max: 100 } }, plugins: { legend: { display: false } } }
                    });
                }
            } catch (e) {
                body.innerHTML = `<p style="color:var(--red)">${e.message}</p>`;
            }
        }

        function renderIssueList(filter) {
            const target = document.getElementById('detail-issues');
            if (!target) return;
            const filtered = filter === 'all' ? detailIssues : detailIssues.filter(issue => issue.severity === filter);
            target.innerHTML = filtered.length ? filtered.map(issue => `<div class="issue-item">
                <span class="issue-sev sev-${issue.severity}">${issue.severity}</span>
                <div class="issue-text">${issue.message}</div>
            </div>`).join('') : '<p style="color:var(--muted);font-size:0.9rem">Bu seviyede sorun bulunamadı.</p>';
        }

        function filterIssues(filter, button) {
            document.querySelectorAll('.filter-btn').forEach(item => item.classList.remove('active'));
            button.classList.add('active');
            renderIssueList(filter);
        }

        function closeModal() { document.getElementById('detail-modal').classList.remove('open'); }
        function closeModalOutside(e) { if (e.target.id === 'detail-modal') closeModal(); }

        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

        document.getElementById('site-url').addEventListener('keydown', e => { if (e.key === 'Enter') addWebsite(); });

        // --- INIT ---
        loadWebsites();
    </script>
</body>
</html>

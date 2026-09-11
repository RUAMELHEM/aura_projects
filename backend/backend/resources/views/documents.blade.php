<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AURA - Dokumanlar</title>
    <style>
        * { box-sizing: border-box; }
        :root { --bg:#0a0f1e; --surface:#111827; --surface2:#1a2235; --border:#1e2d45; --accent:#3b82f6; --green:#10b981; --yellow:#f59e0b; --red:#ef4444; --text:#e2e8f0; --muted:#94a3b8; }
        body { margin:0; min-height:100vh; background:var(--bg); color:var(--text); font:15px system-ui,sans-serif; }
        nav { height:60px; padding:0 2rem; display:flex; align-items:center; justify-content:space-between; background:var(--surface); border-bottom:1px solid var(--border); }
        .logo { color:var(--accent); font-size:1.3rem; font-weight:800; } nav a { color:var(--muted); text-decoration:none; margin-left:1.5rem; } nav a.active { color:var(--text); }
        main { max-width:1100px; margin:auto; padding:2rem; } h1 { margin:0 0 .4rem; } .sub { color:var(--muted); margin:0 0 2rem; }
        .panel { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem; }
        form { display:flex; gap:1rem; align-items:end; flex-wrap:wrap; } label { display:block; color:var(--muted); font-size:.8rem; margin-bottom:.4rem; } .field { flex:1; min-width:220px; }
        input { width:100%; padding:.75rem; color:var(--text); background:var(--surface2); border:1px solid var(--border); border-radius:8px; } button { border:0; border-radius:8px; padding:.75rem 1rem; background:var(--accent); color:white; cursor:pointer; font-weight:600; } button:disabled { opacity:.55; cursor:wait; }
        .drop { border:1px dashed var(--accent); padding:1.2rem; text-align:center; border-radius:8px; color:var(--muted); cursor:pointer; } .drop input { display:none; }
        .doc { display:grid; grid-template-columns:1fr auto auto; gap:1rem; align-items:center; padding:1rem 0; border-bottom:1px solid var(--border); } .doc:last-child { border-bottom:0; } .name { font-weight:650; } .meta { color:var(--muted); font-size:.8rem; margin-top:.3rem; } .status { padding:.3rem .6rem; border-radius:5px; font-size:.75rem; background:var(--surface2); } .status-processed { color:var(--green); } .status-failed { color:var(--red); } .status-processing { color:var(--yellow); } .status-uploaded { color:var(--muted); } .action { background:transparent; border:1px solid var(--border); padding:.45rem .65rem; font-size:.8rem; }
        .empty { color:var(--muted); text-align:center; padding:2rem; } #notice { min-height:1.2rem; color:var(--muted); margin-top:.75rem; } @media(max-width:650px){ main{padding:1rem}.doc{grid-template-columns:1fr auto}.doc .action{grid-column:2}.status{grid-row:1;grid-column:2}nav{padding:0 1rem}nav a{margin-left:.6rem;font-size:.8rem} }
    </style>
</head>
<body>
    <nav><div class="logo">AURA</div><div><a href="/dashboard">Panel</a><a href="/documents" class="active">Dokumanlar</a><a href="/chat">Sohbet</a><a href="/websites">Web Denetimi</a></div></nav>
    <main>
        <h1>Dokuman Yonetimi</h1><p class="sub">PDF, DOCX ve XLSX dosyalarinizi yukleyin ve isleme durumunu takip edin.</p>
        <section class="panel">
            <form id="upload-form">
                <div class="field"><label for="title">Dokuman basligi</label><input id="title" required maxlength="255" placeholder="Orn: Kurum web standartlari"></div>
                <label class="drop" for="file"><span id="file-label">Dosya secin (PDF, DOCX, XLSX - en fazla 10 MB)</span><input id="file" type="file" accept=".pdf,.docx,.xlsx" required></label>
                <button id="upload-btn" type="submit">Yukle</button>
            </form><div id="notice" role="status"></div>
        </section>
        <section class="panel"><h2>Dokumanlar</h2><div id="documents" class="empty">Yukleniyor...</div></section>
    </main>
    <script>
        const api = '/api'; let timer;
        async function request(path, options = {}) { const response = await fetch(api + path, { headers: { Accept:'application/json', ...(options.headers || {}) }, ...options }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || 'Islem basarisiz.'); return data; }
        function statusText(status) { return { uploaded:'Yuklendi', processing:'Isleniyor', processed:'Hazir', failed:'Basarisiz' }[status] || status; }
        function render(list) { const root = document.getElementById('documents'); if (!list.length) { root.className='empty'; root.textContent='Henuz dokuman yuklenmedi.'; return; } root.className=''; root.innerHTML = list.map(doc => `<article class="doc"><div><div class="name">${doc.title || doc.file_name}</div><div class="meta">${doc.file_name} · ${doc.file_size ? Math.round(doc.file_size / 1024) + ' KB' : 'Boyut bilinmiyor'}</div></div><span class="status status-${doc.status}">${statusText(doc.status)}</span><div><a class="action" href="${api}/documents/${doc.id}/download">Indir</a> <button class="action" onclick="removeDocument(${doc.id})">Sil</button></div></article>`).join(''); }
        async function load() { try { const data = await request('/documents'); render(data); if (data.some(doc => ['uploaded','processing'].includes(doc.status))) { if (!timer) timer=setInterval(load, 4000); } else if (timer) { clearInterval(timer); timer=null; } } catch (error) { document.getElementById('documents').textContent=error.message; } }
        document.getElementById('file').addEventListener('change', event => { document.getElementById('file-label').textContent = event.target.files[0]?.name || 'Dosya secin'; });
        document.getElementById('upload-form').addEventListener('submit', async event => { event.preventDefault(); const button=document.getElementById('upload-btn'); const file=document.getElementById('file').files[0]; const body=new FormData(); body.append('title', document.getElementById('title').value); body.append('file', file); button.disabled=true; document.getElementById('notice').textContent='Yukleniyor...'; try { await request('/documents', { method:'POST', body, headers:{} }); event.target.reset(); document.getElementById('file-label').textContent='Dosya secin (PDF, DOCX, XLSX - en fazla 10 MB)'; document.getElementById('notice').textContent='Dokuman yuklendi, isleme alindi.'; load(); } catch(error) { document.getElementById('notice').textContent=error.message; } finally { button.disabled=false; } });
        async function removeDocument(id) { if (!confirm('Bu dokuman silinsin mi?')) return; try { await request('/documents/' + id, { method:'DELETE' }); load(); } catch(error) { document.getElementById('notice').textContent=error.message; } }
        load();
    </script>
</body>
</html>

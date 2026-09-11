<!DOCTYPE html>
<html lang="tr" class="h-full bg-slate-950 text-slate-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AURA — AI Araştırma ve Denetim Asistanı</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .glass-panel {
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 9999px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
    </style>
</head>
<body class="h-full flex flex-col antialiased">
    <!-- Header -->
    <header class="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-bold text-white tracking-wider text-sm">
                A
            </div>
            <div>
                <h1 class="font-bold text-base tracking-tight text-white flex items-center gap-2">
                    AURA AI <span class="px-2 py-0.5 text-[10px] uppercase font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">RAG v1.0</span>
                </h1>
                <p class="text-xs text-slate-400">Kamu Doküman & Web Denetim Asistanı</p>
            </div>
        </div>
        <div class="flex items-center gap-4 text-xs text-slate-400">
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                pgvector Aktif
            </div>
        </div>
    </header>

    <!-- Main Workspace -->
    <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar: Conversations -->
        <aside class="w-72 border-r border-slate-800/80 bg-slate-900/30 flex flex-col shrink-0">
            <div class="p-4 border-b border-slate-800/50">
                <button onclick="createNewConversation()" class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/20">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Yeni Sohbet Başlat
                </button>
            </div>

            <div class="flex-1 overflow-y-auto chat-scroll p-3 space-y-1" id="conversationsList">
                <div class="text-center py-8 text-xs text-slate-500">Sohbetler yükleniyor...</div>
            </div>
        </aside>

        <!-- Middle: Chat Area -->
        <main class="flex-1 flex flex-col bg-slate-950/40 relative">
            <!-- Messages Stream -->
            <div class="flex-1 overflow-y-auto chat-scroll p-6 space-y-6" id="messagesContainer">
                <div class="max-w-2xl mx-auto text-center py-16 space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    </div>
                    <h2 class="text-lg font-semibold text-white">Dokümanlarınıza Dair Her Şeyi Sorun</h2>
                    <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        AURA, yüklenen dokümanları pgvector ile tarar ve yalnızca doğrulanmış kaynaklara dayanarak halüsinasyonsuz yanıtlar üretir.
                    </p>
                </div>
            </div>

            <!-- Input Bar -->
            <div class="p-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
                <form id="chatForm" onsubmit="handleSendMessage(event)" class="max-w-4xl mx-auto flex items-center gap-3">
                    <input type="text" id="userInput" placeholder="Bir soru sorun... (Örn: AURA projesi ne amaçla geliştirildi?)" autocomplete="off" required
                        class="flex-1 bg-slate-900/90 border border-slate-700/60 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition">
                    <button type="submit" id="sendBtn" class="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition shrink-0 shadow-lg shadow-indigo-600/20">
                        <span>Gönder</span>
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </button>
                </form>
            </div>
        </main>
    </div>

    <script>
        let currentConversationId = null;

        async function fetchConversations() {
            try {
                const res = await fetch('/api/open/conversations');
                const convs = await res.json();
                const list = document.getElementById('conversationsList');
                list.innerHTML = '';

                if (convs.length === 0) {
                    list.innerHTML = '<div class="text-center py-6 text-xs text-slate-500">Henüz sohbet yok.</div>';
                    return;
                }

                convs.forEach(c => {
                    const btn = document.createElement('button');
                    btn.className = `w-full text-left p-3 rounded-xl text-xs transition flex flex-col gap-1 ${c.id === currentConversationId ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'hover:bg-slate-800/60 text-slate-300'}`;
                    btn.onclick = () => loadConversation(c.id);
                    btn.innerHTML = `
                        <div class="font-medium truncate">${c.title || 'Yeni Sohbet'}</div>
                        <div class="text-[10px] text-slate-500">${new Date(c.updated_at).toLocaleDateString('tr-TR')}</div>
                    `;
                    list.appendChild(btn);
                });

                if (!currentConversationId && convs.length > 0) {
                    loadConversation(convs[0].id);
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function createNewConversation() {
            try {
                const res = await fetch('/api/open/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: 'Yeni Sohbet' })
                });
                const newConv = await res.json();
                currentConversationId = newConv.id;
                await fetchConversations();
                loadConversation(newConv.id);
            } catch (err) {
                console.error(err);
            }
        }

        async function loadConversation(id) {
            currentConversationId = id;
            const container = document.getElementById('messagesContainer');
            container.innerHTML = '<div class="text-center py-10 text-xs text-slate-500">Mesajlar yükleniyor...</div>';

            try {
                const res = await fetch(`/api/open/conversations/${id}`);
                const conv = await res.json();
                container.innerHTML = '';

                if (conv.messages.length === 0) {
                    container.innerHTML = `
                        <div class="text-center py-16 text-xs text-slate-500">Bu sohbette henüz mesaj yok. Bir soru sorarak başlayın!</div>
                    `;
                    return;
                }

                conv.messages.forEach(msg => appendMessage(msg.sender, msg.content, msg.sources));
                container.scrollTop = container.scrollHeight;
                fetchConversations();
            } catch (err) {
                console.error(err);
            }
        }

        function appendMessage(sender, content, sources = []) {
            const container = document.getElementById('messagesContainer');
            const isUser = sender === 'user';

            const div = document.createElement('div');
            div.className = `flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`;

            let sourcesHtml = '';
            if (sources && sources.length > 0) {
                sourcesHtml = `
                    <div class="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                        <div class="text-[10px] font-semibold tracking-wider uppercase text-indigo-400 flex items-center gap-1.5">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            Kullanılan Kaynaklar (${sources.length})
                        </div>
                        <div class="grid grid-cols-1 gap-1.5">
                            ${sources.map(s => `
                                <div class="bg-slate-900/80 border border-slate-700/60 rounded-lg p-2 text-[11px] text-slate-300">
                                    <div class="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                                        <span>Doküman ID: ${s.document_id || 'Genel'} • Parça #${s.chunk_index}</span>
                                        <span class="text-emerald-400 font-mono font-medium">%${Math.round(s.similarity_score * 100)} Uyum</span>
                                    </div>
                                    <p class="italic text-slate-300 line-clamp-2">"${s.snippet}"</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            div.innerHTML = `
                ${!isUser ? '<div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0">AI</div>' : ''}
                <div class="rounded-2xl px-4 py-3 text-xs leading-relaxed max-w-xl ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'}">
                    <p class="whitespace-pre-wrap">${content}</p>
                    ${sourcesHtml}
                </div>
                ${isUser ? '<div class="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-slate-300 text-xs shrink-0">Sen</div>' : ''}
            `;

            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }

        async function handleSendMessage(e) {
            e.preventDefault();
            const input = document.getElementById('userInput');
            const btn = document.getElementById('sendBtn');
            const text = input.value.trim();
            if (!text) return;

            if (!currentConversationId) {
                await createNewConversation();
            }

            appendMessage('user', text);
            input.value = '';
            btn.disabled = true;

            // Loading indicator
            const container = document.getElementById('messagesContainer');
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'typingIndicator';
            loadingDiv.className = 'flex gap-3 max-w-3xl mr-auto justify-start';
            loadingDiv.innerHTML = `
                <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0">AI</div>
                <div class="rounded-2xl px-4 py-3 text-xs bg-slate-900 border border-slate-800 text-slate-400 rounded-tl-none flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 0.15s"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 0.3s"></span>
                </div>
            `;
            container.appendChild(loadingDiv);
            container.scrollTop = container.scrollHeight;

            try {
                const res = await fetch(`/api/open/conversations/${currentConversationId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: text })
                });

                const data = await res.json();
                document.getElementById('typingIndicator')?.remove();

                if (data.ai_message) {
                    appendMessage('ai', data.ai_message.content, data.ai_message.sources);
                }
                fetchConversations();
            } catch (err) {
                document.getElementById('typingIndicator')?.remove();
                appendMessage('ai', 'Bir hata oluştu: ' + err.message);
            } finally {
                btn.disabled = false;
                input.focus();
            }
        }

        // Initialize on page load
        fetchConversations();
    </script>
</body>
</html>

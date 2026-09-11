"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getConversation, sendMessage, getDocuments, Conversation, Document, Message } from "@/lib/api";
import { Send, Bot, User, Paperclip, Loader2, FileText, ChevronDown, Check } from "lucide-react";

export default function ChatSessionPage() {
  const { id } = useParams();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | "">("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getConversation(Number(id)),
      getDocuments()
    ])
      .then(([conv, docs]) => {
        setConversation(conv);
        setDocuments(docs.filter(d => d.status === "completed")); // Sadece hazır dokümanlar
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    // Mesaj geldiğinde en alta kaydır
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, sending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const currentInput = input;
    setInput("");
    setSending(true);

    // İyimser UI güncellemesi
    const tempUserMsg: Message = {
      id: Date.now(),
      conversation_id: Number(id),
      sender: "user",
      content: currentInput,
      created_at: new Date().toISOString()
    };
    
    setConversation(prev => prev ? {
      ...prev,
      messages: [...(prev.messages || []), tempUserMsg]
    } : null);

    try {
      const docId = selectedDocId !== "" ? Number(selectedDocId) : undefined;
      const result = await sendMessage(Number(id), currentInput, docId);
      
      // Gerçek mesajlarla güncelle
      setConversation(prev => {
        if (!prev) return prev;
        const filtered = (prev.messages || []).filter(m => m.id !== tempUserMsg.id);
        return {
          ...prev,
          messages: [...filtered, result.user_message, result.ai_message]
        };
      });
    } catch (err) {
      console.error(err);
      // Hata durumunda temp mesajı silebilir veya hata gösterebiliriz
      alert("Mesaj gönderilirken bir hata oluştu.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Üst Bar: Doküman Seçici */}
      <div className="px-6 py-3 border-b border-white/5 bg-zinc-950/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-violet-400" />
          <h2 className="text-white font-medium text-sm">{conversation?.title || "Sohbet"}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-xs">Bağlam (Opsiyonel):</span>
          <div className="relative">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value as any)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
            >
              <option value="">Tüm Bilgi Bankası</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.title}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Mesaj Alanı */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {(!conversation?.messages || conversation.messages.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <Bot className="w-12 h-12 text-zinc-500 mb-3" />
            <p className="text-zinc-300">Nasıl yardımcı olabilirim?</p>
            <p className="text-zinc-500 text-sm mt-1">Aşağıdaki kutuya sorunuzu yazın.</p>
          </div>
        ) : (
          conversation.messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-3xl ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1
                ${msg.sender === "user" ? "bg-zinc-800 text-zinc-400" : "bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-lg shadow-violet-500/20"}`}>
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              {/* Balon */}
              <div className="flex flex-col gap-2 min-w-0">
                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed
                  ${msg.sender === "user" ? "bg-zinc-800 text-white rounded-tr-sm" : "glass border border-white/5 text-zinc-300 rounded-tl-sm prose prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-white/10 max-w-none"}`}>
                  
                  {msg.sender === "user" ? (
                    msg.content
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
                
                {/* Kaynaklar (AiSources) */}
                {msg.sender === "ai" && msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {msg.sources.map((src, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 border border-white/5 text-[10px] text-zinc-400 group cursor-default relative">
                        <FileText className="w-3 h-3 text-violet-400" />
                        <span className="truncate max-w-[120px]">{src.document?.title || "Bilinmeyen Doküman"}</span>
                        <span className="text-green-500 ml-1">{(src.similarity_score * 100).toFixed(0)}% uyum</span>
                        
                        {/* Hover Tooltip - Snippet */}
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-zinc-800 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <p className="text-xs text-zinc-300 line-clamp-4">{src.snippet}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ))
        )}
        
        {sending && (
          <div className="flex gap-4 max-w-3xl mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-5 py-4 rounded-2xl glass border border-white/5 rounded-tl-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Mesaj Gönderme Alanı */}
      <div className="p-4 bg-zinc-950/80 border-t border-white/5 backdrop-blur-md">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-end gap-2">
          <div className="flex-1 relative bg-zinc-900 border border-white/10 rounded-2xl focus-within:border-violet-500/50 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Yapay zekaya soru sorun..."
              className="w-full max-h-32 min-h-[56px] py-4 pl-4 pr-12 bg-transparent text-white placeholder:text-zinc-600 focus:outline-none resize-none text-sm"
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-14 h-14 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-[10px] text-zinc-600 mt-3">
          AURA yapay zekası hatalı bilgiler üretebilir. Önemli kararlar almadan önce raporları kontrol edin.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getConversations, createConversation, Conversation } from "@/lib/api";
import { MessageSquarePlus, MessageCircle, Loader2 } from "lucide-react";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pathname]); // pathname değiştiğinde (yeni sohbet vs) listeyi güncelle

  const handleNewChat = async () => {
    setCreating(true);
    try {
      const conv = await createConversation();
      setConversations([conv, ...conversations]);
      router.push(`/dashboard/chat/${conv.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.12))] -m-6 relative overflow-hidden bg-black/20">
      {/* İkincil Sidebar (Sohbet Geçmişi) */}
      <div className="w-72 border-r border-white/5 flex flex-col glass-card rounded-none h-full">
        <div className="p-4 border-b border-white/5">
          <button
            onClick={handleNewChat}
            disabled={creating}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
            Yeni Sohbet
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-4 text-sm text-zinc-500">
              Henüz sohbet yok.
            </div>
          ) : (
            conversations.map((conv) => {
              const active = pathname === `/dashboard/chat/${conv.id}`;
              return (
                <Link
                  key={conv.id}
                  href={`/dashboard/chat/${conv.id}`}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 group
                    ${active ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"}`}
                >
                  <MessageCircle className={`w-4 h-4 flex-shrink-0 ${active ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{conv.title}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{new Date(conv.updated_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Sağ Taraf: Ana Sohbet Alanı (Children) */}
      <div className="flex-1 flex flex-col h-full bg-zinc-950/30">
        {children}
      </div>
    </div>
  );
}

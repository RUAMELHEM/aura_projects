import { MessageSquarePlus } from "lucide-react";

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 h-full p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900/50 flex items-center justify-center mb-4">
        <MessageSquarePlus className="w-8 h-8 text-zinc-600" />
      </div>
      <h2 className="text-xl font-medium text-white mb-2">Yapay Zeka ile Sohbet Edin</h2>
      <p className="max-w-md text-sm">
        Soldaki menüden yeni bir sohbet başlatın. Dokümanlarınızı yükleyip, yapay zekaya sorular sorarak raporlarınızdan hızlıca içgörüler elde edebilirsiniz.
      </p>
    </div>
  );
}

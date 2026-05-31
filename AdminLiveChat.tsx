import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Search, X } from 'lucide-react';
import { chatService } from '@/services/api';
import { useAuth } from '@/lib/AuthContext';

const CHAT_ROOMS = ['global', 'movies', 'series', 'anime', 'support'];

export function AdminLiveChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [roomId, setRoomId] = useState('global');
  const [chatSearch, setChatSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (!user || !open) return;
    chatService.getAdminHistory(roomId).then(setMessages).catch(() => setMessages([]));
  }, [user, open, roomId]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const onResize = () => {
      const diff = window.innerHeight - viewport.height - viewport.offsetTop;
      setKeyboardOffset(Math.max(0, diff));
    };
    viewport.addEventListener('resize', onResize);
    viewport.addEventListener('scroll', onResize);
    onResize();
    return () => {
      viewport.removeEventListener('resize', onResize);
      viewport.removeEventListener('scroll', onResize);
    };
  }, []);

  const filteredMessages = useMemo(() => {
    const chatTerm = chatSearch.trim().toLowerCase();
    const userTerm = userSearch.trim().toLowerCase();
    return messages.filter((m) => {
      const matchesChat = !chatTerm || String(m.message || '').toLowerCase().includes(chatTerm);
      const matchesUser = !userTerm || String(m.name || '').toLowerCase().includes(userTerm);
      return matchesChat && matchesUser;
    });
  }, [messages, chatSearch, userSearch]);

  if (!user) return null;

  const send = async () => {
    if (!input.trim()) return;
    await chatService.sendAdminMessage(roomId, input.trim());
    const latest = await chatService.getAdminHistory(roomId);
    setMessages(latest);
    setInput('');
  };

  return (
    <div className="fixed left-3 sm:left-6 z-[60]" style={{ bottom: `${Math.max(12, keyboardOffset + 12)}px` }}>
      {open && (
        <div className="w-[calc(100vw-1.5rem)] sm:w-96 h-[70dvh] sm:h-[32rem] bg-[#fff6fb] text-[#3f2740] border border-[#f0d8e9] rounded-2xl mb-3 flex flex-col overflow-hidden shadow-2xl">
          <div className="p-3 bg-[#c50768] text-white flex items-center justify-between">
            <p className="font-bold text-sm">flixvzn.movie chat</p>
            <button onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
          </div>

          <div className="p-3 border-b border-[#f0d8e9] space-y-2 bg-[#fff9fc]">
            <div className="flex gap-2">
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="flex-1 rounded-md border border-[#e8cadf] bg-white px-2 py-1 text-xs"
              >
                {CHAT_ROOMS.map((room) => (
                  <option value={room} key={room}>{room}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[#ab6f93]" />
                <input value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} className="w-full rounded-md border border-[#e8cadf] pl-7 pr-2 py-1 text-xs" placeholder="Search chat..." />
              </div>
              <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-32 rounded-md border border-[#e8cadf] px-2 py-1 text-xs" placeholder="Search user..." />
            </div>
          </div>

          <div className="flex-1 p-3 space-y-2 overflow-auto">
            {filteredMessages.map((m) => <div key={m.id} className="text-xs"><b className="text-[#c50768]">{m.name}:</b> {m.message}</div>)}
            {filteredMessages.length === 0 && <p className="text-xs text-[#9b7f99]">No messages found for this room/filter.</p>}
          </div>
          <div className="p-2 border-t border-[#f0d8e9] flex gap-2 bg-[#fff9fc]">
            <input className="flex-1 bg-white rounded px-2 py-1 text-xs border border-[#e8cadf]" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message #${roomId}...`} />
            <button onClick={send} className="bg-[#c50768] text-white text-xs px-3 rounded">Send</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen((v) => !v)} className="w-12 h-12 bg-[#c50768] rounded-full flex items-center justify-center shadow-lg text-white">
        <MessageCircle className="w-5 h-5" />
      </button>
    </div>
  );
}

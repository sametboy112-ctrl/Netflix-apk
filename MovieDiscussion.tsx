import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { ImagePlus, Lock, Menu, Mic, Plus, Search, Send, Settings, StopCircle, Sun, User, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatService } from '@/services/api';

interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  mediaType?: 'image' | 'audio' | null;
  mediaUrl?: string | null;
}

interface MovieDiscussionProps {
  movieId: string;
  movieTitle: string;
}

export function MovieDiscussion({ movieId, movieTitle }: MovieDiscussionProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [chatTheme, setChatTheme] = useState<'pink' | 'dark'>(() => (localStorage.getItem('flixvzn_chat_theme') as any) || 'pink');
  const [showSettings, setShowSettings] = useState(false);
  const [compactMode, setCompactMode] = useState(localStorage.getItem('flixvzn_chat_compact') === '1');
  const [messageSearch, setMessageSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let poller: any = null;

    const boot = async () => {
      const history = await chatService.getHistory(movieId);
      setMessages(history);

      poller = setInterval(async () => {
        const latest = await chatService.getHistory(movieId);
        setMessages(latest);
      }, 2500);
    };

    boot().catch(console.error);
    return () => {
      if (poller) clearInterval(poller);
    };
  }, [movieId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredMessages = useMemo(() => {
    const msgTerm = messageSearch.trim().toLowerCase();
    const userTerm = userSearch.trim().toLowerCase();

    return messages.filter((msg) => {
      const matchesMessage = !msgTerm || msg.message?.toLowerCase().includes(msgTerm);
      const matchesUser = !userTerm || msg.name?.toLowerCase().includes(userTerm);
      return matchesMessage && matchesUser;
    });
  }, [messages, messageSearch, userSearch]);

  const clearComposerMedia = () => {
    setImagePreview(null);
    setAudioPreview(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imagePreview && !audioPreview) || !user || sending) return;

    setSending(true);
    try {
      const sent = await chatService.sendMovieMessage({
        movieId,
        message: newMessage,
        name: user.name || user.email.split('@')[0],
        mediaType: imagePreview ? 'image' : audioPreview ? 'audio' : null,
        mediaUrl: imagePreview || audioPreview || null,
      });
      if (sent?.message) setMessages((prev) => [...prev, sent.message]);
      setNewMessage('');
      clearComposerMedia();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(String(reader.result || ''));
      setAudioPreview(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioPreview(String(reader.result || ''));
          setImagePreview(null);
          stream.getTracks().forEach(track => track.stop());
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Audio recording unavailable:', error);
    }
  };

  return (
    <div className={cn('rounded-3xl overflow-hidden flex flex-col h-[680px] shadow-xl', chatTheme === 'pink' ? 'bg-[#f9f2f6] text-[#3f2740] border border-[#f0d8e9]' : 'bg-[#13131a] text-gray-100 border border-white/10')}>
      <div className="px-5 py-4 border-b border-[#f0d8e9] flex items-center justify-between bg-[#fff6fb]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-[#c50768] hover:text-[#a00556] text-xl" aria-label="Back">
            ←
          </button>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f650a0] to-[#d01873] flex items-center justify-center text-white shadow">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-2xl text-[#4b2140] leading-none">{movieTitle} Lounge</h3>
            <p className="text-sm text-[#7a4d7e]">● {filteredMessages.length} active ghosts</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[#c50768]">
          <button onClick={() => setShowSearch((v) => !v)} aria-label="Search chat" className="hover:text-[#990451]"><Search className="w-5 h-5" /></button>
          <button onClick={() => { const next = chatTheme === 'pink' ? 'dark' : 'pink'; setChatTheme(next); localStorage.setItem('flixvzn_chat_theme', next); }} aria-label="Theme"><Sun className="w-5 h-5" /></button>
          <button onClick={() => setShowSettings((v) => !v)} aria-label="Menu"><Menu className="w-5 h-5" /></button>
        </div>
      </div>

      {showSearch && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 py-3 bg-[#fff6fb] border-b border-[#f0d8e9]">
          <input
            type="text"
            value={messageSearch}
            onChange={(e) => setMessageSearch(e.target.value)}
            placeholder="Search messages in this room"
            className="bg-white/80 border border-[#e9c5dc] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d01873]/30"
          />
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search users in this room"
            className="bg-white/80 border border-[#e9c5dc] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d01873]/30"
          />
        </div>
      )}



      {showSettings && (
        <div className="px-4 py-3 bg-[#fff6fb] border-b border-[#f0d8e9] text-sm space-y-2">
          <p className="font-semibold flex items-center gap-2"><Settings className="w-4 h-4" /> Chat settings</p>
          <label className="flex items-center justify-between">
            <span>Compact mode</span>
            <input type="checkbox" checked={compactMode} onChange={(e) => { setCompactMode(e.target.checked); localStorage.setItem('flixvzn_chat_compact', e.target.checked ? '1' : '0'); }} />
          </label>
          <label className="flex items-center justify-between">
            <span>Show search panel</span>
            <input type="checkbox" checked={showSearch} onChange={(e) => setShowSearch(e.target.checked)} />
          </label>
        </div>
      )}
      <div
        ref={scrollRef}
        className={cn('flex-1 overflow-y-auto px-4 md:px-6 py-6 scrollbar-hide', compactMode ? 'space-y-2 text-xs' : 'space-y-4')}
      >
        <div className="w-fit mx-auto px-4 py-1 rounded-full bg-[#f5d8ea] text-xs text-[#8b607d] uppercase tracking-widest">Today</div>

        {filteredMessages.length === 0 && (
          <div className="text-center py-10 text-[#9f809b]">
            <p>No messages matched your search in this room.</p>
          </div>
        )}

        {filteredMessages.map((msg) => {
          const isMe = user && (msg.name === (user.name || user.email.split('@')[0]));
          return (
            <div
              key={msg.id}
              className={cn('flex gap-3 max-w-[92%]', isMe ? 'ml-auto flex-row-reverse' : 'mr-auto')}
            >
              {!isMe && (
                <div className="w-9 h-9 rounded-full bg-[#f04b99] flex items-center justify-center shrink-0 text-white">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className={cn('space-y-1', isMe ? 'items-end text-right' : 'text-left')}>
                <span className={cn('text-xs font-semibold px-1 uppercase', isMe ? 'text-[#c50768]' : 'text-[#7b4f92]')}>{msg.name}</span>
                <div className={cn(
                  'px-4 py-3 rounded-3xl text-sm shadow-sm',
                  isMe ? 'bg-gradient-to-r from-[#c50768] to-[#f14695] text-white rounded-br-md' : 'bg-[#f3cfe2] text-[#4d2f48] rounded-bl-md'
                )}>
                  {msg.message && <p className="leading-relaxed">{msg.message}</p>}
                  {msg.mediaType === 'image' && msg.mediaUrl && (
                    <img src={msg.mediaUrl} alt="shared" className="mt-2 rounded-2xl max-h-72 w-full object-cover" />
                  )}
                  {msg.mediaType === 'audio' && msg.mediaUrl && (
                    <audio controls src={msg.mediaUrl} className="mt-2 w-full" />
                  )}
                </div>
                <span className="text-[10px] text-[#aa8ba8] px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-2">
        <div className="w-fit mx-auto rounded-full border border-[#edd7e5] px-5 py-2 text-sm text-[#8a6882] flex items-center gap-2 bg-[#fff6fb]">
          <Lock className="w-4 h-4 text-[#6a55ba]" />
          End-to-end encrypted session
        </div>
      </div>

      <form onSubmit={handleSend} className="p-4 bg-[#fff6fb] border-t border-[#f0d8e9] space-y-3">
        {(imagePreview || audioPreview) && (
          <div className="rounded-xl border border-[#e9c5dc] p-3 bg-[#fefafe]">
            {imagePreview && <img src={imagePreview} alt="preview" className="max-h-40 rounded-lg object-cover" />}
            {audioPreview && <audio controls src={audioPreview} className="w-full" />}
            <button type="button" onClick={clearComposerMedia} className="text-xs text-[#c50768] mt-2 inline-flex items-center gap-1"><X className="w-3 h-3" />Remove attachment</button>
          </div>
        )}

        <div className="flex items-center gap-2 bg-[#fdf2f8] rounded-full border border-[#efd8e8] p-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-10 h-10 rounded-full bg-[#c50768] flex items-center justify-center hover:bg-[#a30554]"
            title="Add image"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImagePick(e.target.files?.[0])}
          />

          <input
            type="text"
            className="flex-1 bg-transparent border-none rounded-full py-3 px-2 text-sm focus:outline-none placeholder:text-[#b495ad]"
            placeholder="Type a secure message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />

          <button
            type="button"
            onClick={handleRecordToggle}
            className={cn('w-10 h-10 rounded-full flex items-center justify-center', isRecording ? 'bg-[#c50768]' : 'bg-white border border-[#e7c8dc] hover:bg-[#fbe9f4]')}
            title={isRecording ? 'Stop recording' : 'Record voice note'}
          >
            {isRecording ? <StopCircle className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-[#6a55ba]" />}
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-10 h-10 rounded-full bg-white border border-[#e7c8dc] flex items-center justify-center hover:bg-[#fbe9f4]"
            title="Attach image"
          >
            <ImagePlus className="w-5 h-5 text-[#a74588]" />
          </button>

          <button
            type="submit"
            disabled={sending}
            className="w-11 h-11 bg-gradient-to-b from-[#c50768] to-[#f14695] rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-60"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}

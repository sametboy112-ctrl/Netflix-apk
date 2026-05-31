import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiService } from '@/services/api';

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: "Hello! I'm your flixvzn.movie assistant. I can tell you about the app or creator. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    setTimeout(async () => {
      const reply = await aiService.ask(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className="fixed top-20 left-4 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, x: -10, y: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, x: -10, y: -10 }}
              className="fixed top-20 left-4 right-4 sm:right-auto z-[60] w-auto sm:w-[420px] max-h-[calc(100dvh-6rem)] bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="bg-red-600 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="font-bold text-white text-sm">flixvzn.movie Assistant</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-[10px] text-white/80">Online</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white hover:bg-black/20 p-1 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide min-h-0" ref={scrollRef}>
                {messages.map((m, i) => (
                  <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[85%] px-4 py-2 rounded-2xl text-[13px] leading-relaxed', m.role === 'user' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-[#2f2f2f] text-gray-200 rounded-tl-none')}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#2f2f2f] px-4 py-2 rounded-2xl rounded-tl-none">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="p-4 bg-black/20 border-t border-white/10">
                <div className="relative flex items-center gap-2">
                  <input
                    className="flex-1 bg-[#2f2f2f] border-none rounded-full py-2 px-4 text-xs focus:ring-1 focus:ring-red-600 text-white placeholder:text-gray-500"
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <button type="submit" disabled={isTyping} className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn('w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300', isOpen ? 'bg-white text-black' : 'bg-red-600 text-white')}
      >
        {isOpen ? <X className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
      </motion.button>
    </div>
  );
}

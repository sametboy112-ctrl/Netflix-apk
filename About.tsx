import React from 'react';
import { Facebook, Github, Mail, MessageCircle, Music2, Send, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const SOCIAL_LINKS = [
  { name: 'Facebook Share 1', icon: Facebook, url: 'https://www.facebook.com/share/1FnuTqpBoB/', color: 'text-blue-400' },
  { name: 'Facebook Profile', icon: Facebook, url: 'https://www.facebook.com/profile.php?id=61552276520043&mibextid=ZbWKwL', color: 'text-blue-500' },
  { name: 'Messenger Share', icon: MessageCircle, url: 'https://www.facebook.com/share/18gJJ7XRwV/', color: 'text-sky-400' },
  { name: 'GitHub', icon: Github, url: 'https://github.com/Neaterry6', color: 'text-white' },
  { name: 'Telegram', icon: Send, url: 'https://t.me/Broken_vzn11', color: 'text-cyan-400' },
  { name: 'TikTok', icon: Music2, url: 'https://www.tiktok.com/@bnlsquad_boybroken?lang=en', color: 'text-pink-400' },
  { name: 'Email', icon: Mail, url: 'mailto:akewusholaabdulbakri101@gmail.com', color: 'text-red-500' },
];

const STACK = ['React/TypeScript', 'Node.js', 'Rust/Go', 'Docker', 'AI Integrations', 'CBT Architecture'];

export function About() {
  return (
    <div className="pt-32 pb-20 px-4 md:px-12 max-w-5xl mx-auto space-y-10">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-black tracking-tighter uppercase italic">About flixvzn.movie</h1>
        <p className="text-xl text-gray-400 leading-relaxed">
          flixvzn.movie is a next-generation streaming experience built for streaming, downloads, and community reviews.
          Our mission is to bring high-quality entertainment to everyone, everywhere, with a seamless and interactive interface.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/5 space-y-5">
          <h2 className="text-2xl font-bold">The Creator</h2>
          <h3 className="text-xl font-bold">Akewushola Abdulbakri Temitope (Broken Vzn)</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Full Stack Engineer based in Ibadan, Nigeria, specialized in CBT architecture and AI implementations.
            3+ years of experience shipping real-world apps and scaling backend performance.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
            <span>📍 Ibadan, NG</span>
            <span>💼 Lead Freelancer</span>
            <span>🚀 20+ apps shipped</span>
            <span>⚡ Latency optimized by 60%</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {STACK.map((item) => (
              <span key={item} className="px-3 py-1.5 bg-zinc-900 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-300">
                {item}
              </span>
            ))}
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('w-11 h-11 rounded-full border border-white/10 bg-black/20 hover:bg-black/50 transition-all flex items-center justify-center', link.color)}
                title={link.name}
              >
                <link.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/5 space-y-5">
          <h2 className="text-2xl font-bold">Signature</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Logic is the Engine. Creative is the Soul. In a world of glitching suns and binary hearts,
            I build for human connection.
          </p>
          <div className="text-xs uppercase italic text-gray-500 space-y-2">
            <p>AKEWUSHOLA ABDULBAKRI TEMITOPE | IBADAN, NG</p>
            <p>akewusholaabdulbakri101@gmail.com | github.com/Neaterry6</p>
            <p>[SUMMARY] Full Stack Engineer specialized in CBT Architecture and AI implementations.</p>
            <p>[EXP] Lead Freelancer: Shipped 20+ apps, optimized backend latency by 60%.</p>
          </div>
          <div className="flex items-center gap-2 text-red-500 font-bold uppercase text-[10px] tracking-widest pt-2">
            Made with <Heart className="w-3 h-3 fill-current" /> in Nigeria
          </div>
        </div>
      </div>
    </div>
  );
}

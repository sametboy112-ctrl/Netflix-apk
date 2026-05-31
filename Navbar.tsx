import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, User as UserIcon, Home, Film, Tv, Sparkles, TrendingUp, Radio, BookOpen, Menu, CircleUserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useNotifications } from '@/lib/NotificationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Logo } from './Logo';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/movies', label: 'Movies', icon: Film },
    { to: '/series', label: 'Series', icon: Tv },
    { to: '/anime', label: 'Anime', icon: Tv },
    { to: '/manga', label: 'Manga', icon: BookOpen },
    { to: '/trending', label: 'Trending', icon: TrendingUp },
    { to: '/live', label: 'Live', icon: Radio },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav
      className={cn(
        'fixed top-0 z-50 w-full transition-colors duration-300 px-4 md:px-12 py-4 flex items-center justify-between',
        isScrolled ? 'bg-[#141414]' : 'bg-gradient-to-b from-black/80 to-transparent'
      )}
    >
      <div className="flex items-center gap-3 md:gap-8">
        <button className="md:hidden" onClick={() => setMobileMenuOpen((v) => !v)}><Menu className="w-5 h-5" /></button> -->
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm font-medium">
          <Link to="/" className="hover:text-gray-300 transition-colors flex items-center gap-2 group">
            <Home className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
            Home
          </Link>
          <Link to="/movies" className="hover:text-gray-300 transition-colors flex items-center gap-2 group">
            <Film className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
            Movies
          </Link>
          <Link to="/series" className="hover:text-gray-300 transition-colors flex items-center gap-2 group">
            <Tv className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
            Series
          </Link>
          <Link to="/anime" className="hover:text-gray-300 transition-colors flex items-center gap-2 group">
            <span className="w-4 h-4 text-red-600 font-bold text-sm leading-none">ア</span>
            Anime
          </Link>
          <Link to="/manga" className="hover:text-gray-300 transition-colors flex items-center gap-2 group">
            <BookOpen className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
            Manga
          </Link>
          <Link to="/trending" className="hover:text-gray-300 transition-colors flex items-center gap-2 group">
            <TrendingUp className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
            New & Popular
          </Link>
          <Link to="/live" className="hover:text-gray-300 transition-colors flex items-center gap-2 group">
            <Radio className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
            Live
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <form onSubmit={handleSearch} className="relative hidden lg:block">
          <input
            type="text"
            placeholder="Titles, people, genres"
            className="bg-black/20 border border-white/20 px-3 py-1 pl-10 text-sm focus:outline-none focus:border-white/40 transition-all w-40 md:w-60"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </form>

        <Link to="/search" className="lg:hidden">
          <Search className="w-5 h-5 cursor-pointer hover:text-gray-300" />
        </Link>

        <Link to="/profile" className="lg:hidden">
          <CircleUserRound className="w-5 h-5 cursor-pointer hover:text-gray-300" />
        </Link>

        {/* Notifications */}
        <DropdownMenu>
           <DropdownMenuTrigger className="relative p-0 hover:bg-transparent inline-flex items-center justify-center outline-none">
              <Bell className="w-5 h-5 cursor-pointer hover:text-gray-300" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-black">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end" className="w-80 bg-black/95 text-white border-white/10 mt-2 p-0 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-bold text-sm">Notifications</h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm italic">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-xs text-red-500 group-hover:text-red-400">{n.title}</h4>
                        <span className="text-[8px] text-gray-600">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
           </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
           
          <DropdownMenuTrigger className={cn(
            "p-0 hover:bg-transparent inline-flex items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 size-8"
          )}>
            {user ? (
              <div 
                onClick={() => navigate('/profile')}
                className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs uppercase cursor-pointer"
              >
                {user.name?.[0] || user.email[0]}
              </div>
            ) : (
              <UserIcon className="w-6 h-6" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-black/90 text-white border-white/10 mt-2">
            {user ? (
              <>
                <DropdownMenuItem onClick={() => navigate('/profile')} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer px-3 py-2 flex flex-col items-start gap-0.5">
                  <span className="font-bold text-sm">{user.name || 'User'}</span>
                  <span className="text-[10px] text-gray-400">{user.email}</span>
                </DropdownMenuItem>
                <div className="h-px bg-white/10 my-1" />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                  Manage Profile
                </DropdownMenuItem>
                <div className="h-px bg-white/10 my-1" />
                <DropdownMenuItem 
                  onClick={logout}
                  className="hover:bg-white/10 focus:bg-white/10 cursor-pointer text-red-500"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign out of flixvzn.movie
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer p-0">
                  <Link to="/login" className="w-full h-full block px-3 py-2">
                    Sign In
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    {mobileMenuOpen && (
      <div className="md:hidden fixed top-16 left-3 right-3 z-50 bg-[#121212] border border-white/10 rounded-xl p-3 grid grid-cols-2 gap-2">
        {navLinks.map((item) => { const Icon = item.icon; return <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2 rounded-lg bg-white/5"><Icon className="w-4 h-4 text-red-500" />{item.label}</Link>; })}
      </div>
    )}
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-white/10 grid grid-cols-6 p-2 z-50">
      {navLinks.slice(0,5).map((item)=>{const Icon=item.icon; return <Link key={item.to} to={item.to} className="flex flex-col items-center text-[10px]"><Icon className="w-4 h-4 text-red-500" />{item.label}</Link>;})}
      <Link to="/profile" className="flex flex-col items-center text-[10px]"><CircleUserRound className="w-4 h-4 text-red-500" />Profile</Link>
    </div>
    </nav>
  );
}

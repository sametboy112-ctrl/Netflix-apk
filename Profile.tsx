import React, { useState, useEffect } from 'react';
import { profileService } from '../services/api';
import { User } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, History, LogOut, Globe, Github, Twitter, Linkedin, UserCircle2, Plus, X, Save } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');
  
  // Edit states
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [socialLinks, setSocialLinks] = useState<{ platform: string, url: string }[]>([]);
  const [autoplay, setAutoplay] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [newPlatform, setNewPlatform] = useState('Website');
  const [newUrl, setNewUrl] = useState('');
  const [watchStatus, setWatchStatus] = useState<'Not Started' | 'Watching' | 'Completed' | 'Dropped' | 'Plan to Watch'>('Not Started');
  const [personalRating, setPersonalRating] = useState(0);
  const [rewatchCounter, setRewatchCounter] = useState(0);
  const [privateNotes, setPrivateNotes] = useState('');
  const [spoilerToggle, setSpoilerToggle] = useState(true);
  const [customLists, setCustomLists] = useState('Date Night Movies, Cozy Rainy Day');
  const [moodTags, setMoodTags] = useState('Feel-good');
  const [runtimeLeft, setRuntimeLeft] = useState('2h 15m');
  const [relatedJournal, setRelatedJournal] = useState('');
  const [publicProfile, setPublicProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme === 'light' ? 'light' : 'dark');
  }, [theme]);

  const fetchProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setUser(data);
      setEditName(data.name || '');
      setEditBio(data.bio || '');
      setEditAvatar(data.avatarUrl || '');
      setUsername(data.username || data.name || '');
      setSocialLinks(data.socialLinks || []);
      if (data.preferences) {
        setAutoplay(data.preferences.autoplay);
        setTheme(data.preferences.theme);
        setWatchStatus(data.preferences.watchStatus || 'Not Started');
        setPersonalRating(Number(data.preferences.personalRating || 0));
        setRewatchCounter(Number(data.preferences.rewatchCounter || 0));
        setPrivateNotes(data.preferences.privateNotes || '');
        setSpoilerToggle(Boolean(data.preferences.spoilerToggle));
        setCustomLists((data.preferences.customLists || []).join(', '));
        setMoodTags((data.preferences.moodTags || []).join(', '));
        setRuntimeLeft(data.preferences.runtimeLeft || '2h 15m');
        setRelatedJournal(data.preferences.relatedJournal || '');
        setPublicProfile(Boolean(data.preferences.publicProfile));
      }
    } catch (err) {
      console.error(err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await profileService.updateProfile({
        name: editName,
        bio: editBio,
        avatarUrl: editAvatar,
        username,
        setupComplete: true,
        socialLinks,
        preferences: {
          autoplay,
          theme,
          watchStatus,
          personalRating,
          rewatchCounter,
          privateNotes,
          spoilerToggle,
          customLists: customLists.split(',').map((x) => x.trim()).filter(Boolean),
          reminderNigeria: true,
          moodTags: moodTags.split(',').map((x) => x.trim()).filter(Boolean),
          runtimeLeft,
          relatedJournal,
          watchPartyEnabled: true,
          parentalWarnings: true,
          offlineMode: true,
          spoilerFreeMode: spoilerToggle,
          publicProfile,
          castFollow: ['Zendaya'],
        }
      });
      setUser(updated);
      alert('Profile updated successfully!');
      if (searchParams.get('setup') === '1') {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addSocialLink = () => {
    if (newUrl.trim()) {
      setSocialLinks([...socialLinks, { platform: newPlatform, url: newUrl }]);
      setNewUrl('');
    }
  };

  const removeSocialLink = (idx: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== idx));
  };

  if (loading) return <div className="h-screen bg-[#141414] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;
  if (!user) return null;

  return (
    <div className="pt-24 px-4 md:px-12 max-w-6xl mx-auto min-h-screen pb-20">
      <div className="flex flex-col md:flex-row gap-10">
        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-8">
           <div className="bg-[#1a1a1a] rounded-3xl p-8 border border-white/5 text-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-900 rounded-full mx-auto flex items-center justify-center text-3xl font-black shadow-xl shadow-black">
                {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" /> : user.name?.[0] || user.email[0].toUpperCase()}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold">{user.name || 'User'}</h2>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <p className="text-sm text-gray-400 italic">"{user.bio || 'Streamer extraordinaire'}"</p>
              
              <div className="flex justify-center gap-3 pt-2">
                {socialLinks?.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-red-600 transition-colors">
                    {l.platform === 'Twitter' && <Twitter className="w-4 h-4" />}
                    {l.platform === 'GitHub' && <Github className="w-4 h-4" />}
                    {l.platform === 'LinkedIn' && <Linkedin className="w-4 h-4" />}
                    {(l.platform === 'Website' || !['Twitter', 'GitHub', 'LinkedIn'].includes(l.platform)) && <Globe className="w-4 h-4" />}
                  </a>
                ))}
              </div>
           </div>

           <div className="bg-[#1a1a1a] rounded-3xl p-4 border border-white/5 overflow-hidden">
              <button 
                onClick={() => setActiveTab('history')}
                className={cn("w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all", activeTab === 'history' ? "bg-red-600 text-white shadow-lg" : "hover:bg-white/5 text-gray-400")}
              >
                <History className="w-5 h-5" />
                <span className="font-bold">Watch History</span>
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={cn("w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all", activeTab === 'settings' ? "bg-red-600 text-white shadow-lg" : "hover:bg-white/5 text-gray-400")}
              >
                <Settings className="w-5 h-5" />
                <span className="font-bold">Settings</span>
              </button>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-bold">Logout</span>
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1">
           {activeTab === 'history' ? (
             <div className="space-y-6">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">Recent Activity</h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                   {user.watchHistory?.length > 0 ? (
                     user.watchHistory.map((h, idx) => (
                       <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: idx * 0.05 }}
                         key={idx} 
                         className="group relative aspect-[16/9] bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5 cursor-pointer"
                         onClick={() => navigate(`/movie/${h.subjectId}`)}
                       >
                         <img src={h.coverUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                         <div className="absolute bottom-4 left-4 right-4">
                            <p className="font-bold text-sm truncate">{h.title}</p>
                            <p className="text-[10px] text-gray-500">{new Date(h.timestamp).toLocaleDateString()}</p>
                         </div>
                       </motion.div>
                     ))
                   ) : (
                     <div className="col-span-full py-20 text-center text-gray-500 italic">No watch history yet. Start watching!</div>
                   )}
                </div>
             </div>
           ) : (
             <form onSubmit={handleUpdateProfile} className="space-y-8">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">Account Settings</h2>
                {searchParams.get('setup') === '1' && <p className="text-green-400 text-sm">Welcome! Complete your profile setup and save your preferences.</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Username</label>
                      <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-[#1a1a1a] border-white/10 rounded-xl" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-[#1a1a1a] border-white/10 rounded-xl" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profile Picture</label>
                      <input type="file" accept="image/*" className="text-xs" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAvatarUploading(true);
                        try {
                          const updated = await profileService.uploadAvatar(file);
                          setEditAvatar(updated?.avatarUrl || '');
                          setUser(updated);
                        } finally { setAvatarUploading(false); }
                      }} />
                      {avatarUploading && <p className="text-xs text-gray-400">Uploading image...</p>}
                   </div>
                   <div className="col-span-full space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Short Bio</label>
                      <textarea 
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-red-600 min-h-[100px]"
                        value={editBio} 
                        onChange={(e) => setEditBio(e.target.value)}
                      />
                   </div>

                   <div className="col-span-full pt-4 border-t border-white/5 space-y-6">
                      <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest px-1">Application Preferences</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm">Autoplay Videos</p>
                            <p className="text-[10px] text-gray-500">Automatically play the next episode or trailer</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAutoplay(!autoplay)}
                            className={cn(
                              "w-12 h-6 rounded-full transition-colors relative",
                              autoplay ? "bg-red-600" : "bg-gray-700"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                              autoplay ? "left-7" : "left-1"
                            )} />
                          </button>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm">Appearance</p>
                            <p className="text-[10px] text-gray-500">Switch between light and dark themes</p>
                          </div>
                          <div className="flex bg-[#2a2a2a] p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => setTheme('dark')}
                              className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                                theme === 'dark' ? "bg-red-600 text-white" : "text-gray-500 hover:text-white"
                              )}
                            >
                              DARK
                            </button>
                            <button
                              type="button"
                              onClick={() => setTheme('light')}
                              className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                                theme === 'light' ? "bg-red-600 text-white" : "text-gray-500 hover:text-white"
                              )}
                            >
                              LIGHT
                            </button>
                          </div>
                        </div>
                      </div>
                   </div>

                   <div className="col-span-full pt-4 border-t border-white/5 space-y-4">
                      <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest px-1">Core User Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs">Watch Status</label>
                          <select value={watchStatus} onChange={(e) => setWatchStatus(e.target.value as any)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2">
                            {['Not Started','Watching','Completed','Dropped','Plan to Watch'].map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs">Personal Rating (1-10)</label>
                          <Input type="number" min={1} max={10} value={personalRating} onChange={(e) => setPersonalRating(Number(e.target.value))} className="bg-[#1a1a1a] border-white/10 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs">Rewatch Counter</label>
                          <Input type="number" min={0} value={rewatchCounter} onChange={(e) => setRewatchCounter(Number(e.target.value))} className="bg-[#1a1a1a] border-white/10 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs">Runtime Tracker</label>
                          <Input value={runtimeLeft} onChange={(e) => setRuntimeLeft(e.target.value)} className="bg-[#1a1a1a] border-white/10 rounded-xl" />
                        </div>
                        <div className="col-span-full space-y-2">
                          <label className="text-xs">Private Notes</label>
                          <textarea className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-sm" value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} />
                        </div>
                        <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input value={customLists} onChange={(e) => setCustomLists(e.target.value)} className="bg-[#1a1a1a] border-white/10 rounded-xl" placeholder="Custom Lists e.g. Cry List" />
                          <Input value={moodTags} onChange={(e) => setMoodTags(e.target.value)} className="bg-[#1a1a1a] border-white/10 rounded-xl" placeholder="Mood tags e.g. Mind-bendy" />
                        </div>
                        <div className="col-span-full">
                          <Input value={relatedJournal} onChange={(e) => setRelatedJournal(e.target.value)} className="bg-[#1a1a1a] border-white/10 rounded-xl" placeholder="Related Journal URL" />
                        </div>
                        <label className="flex items-center justify-between bg-white/5 rounded-xl p-3">Spoiler toggle<input type="checkbox" checked={spoilerToggle} onChange={(e) => setSpoilerToggle(e.target.checked)} /></label>
                        <label className="flex items-center justify-between bg-white/5 rounded-xl p-3">Public profile<input type="checkbox" checked={publicProfile} onChange={(e) => setPublicProfile(e.target.checked)} /></label>
                      </div>
                   </div>

                   <div className="col-span-full space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Social Links</label>
                      <div className="flex flex-wrap gap-2">
                         {socialLinks.map((l, i) => (
                           <div key={i} className="flex items-center gap-2 bg-[#2a2a2a] pl-3 pr-1 py-1 rounded-full text-xs border border-white/10">
                              <span>{l.platform}: {(() => { try { return new URL(l.url).hostname; } catch { return l.url; } })()}</span>
                              <button type="button" onClick={() => removeSocialLink(i)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-3 h-3" /></button>
                           </div>
                         ))}
                      </div>
                      <div className="flex gap-2">
                         <select 
                           className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 text-xs"
                           value={newPlatform}
                           onChange={(e) => setNewPlatform(e.target.value)}
                         >
                            <option>Website</option>
                            <option>GitHub</option>
                            <option>Twitter</option>
                            <option>LinkedIn</option>
                         </select>
                         <Input 
                           placeholder="https://..." 
                           value={newUrl} 
                           onChange={(e) => setNewUrl(e.target.value)} 
                           className="flex-1 bg-[#1a1a1a] border-white/10 rounded-xl" 
                         />
                         <Button type="button" onClick={addSocialLink} variant="outline" className="rounded-xl border-white/20"><Plus className="w-4 h-4" /></Button>
                      </div>
                   </div>
                </div>

                <Button className="bg-red-600 hover:bg-red-700 font-bold px-10 py-6 rounded-2xl shadow-xl shadow-red-900/20">
                   <Save className="w-5 h-5 mr-2" />
                   Save All Changes
                </Button>
             </form>
           )}
        </div>
      </div>
    </div>
  );
}

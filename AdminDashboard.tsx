import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  PlayCircle,
  TrendingUp,
  Eye,
  Settings,
  LogOut,
  MoreVertical,
  Search,
  FileText
} from 'lucide-react';
import { chatService } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CHAT_ROOMS = ['global', 'movies', 'series', 'anime', 'support'];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats] = useState([
    { label: 'Total Users', value: '12,482', icon: Users, color: 'text-blue-500' },
    { label: 'Active Streams', value: '1,240', icon: PlayCircle, color: 'text-green-500' },
    { label: 'Monthly Growth', value: '+14.5%', icon: TrendingUp, color: 'text-red-500' },
    { label: 'Page Views', value: '452K', icon: Eye, color: 'text-purple-500' },
  ]);

  const [users, setUsers] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [adminInput, setAdminInput] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('global');
  const [chatSearch, setChatSearch] = useState('');
  const [chatUserSearch, setChatUserSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    chatService.getAdminHistory(selectedRoom).then(setAdminMessages).catch(() => setAdminMessages([]));
  }, [selectedRoom]);

  useEffect(() => {
    const rawUsers = JSON.parse(localStorage.getItem('flixvzn_users') || '[]');
    const mapped = rawUsers.map((u: any, idx: number) => ({ id: u.id || idx + 1, name: u.name || 'User', email: u.email || 'unknown', plan: u?.plan || 'Basic', status: 'Active', joined: (u.createdAt || new Date().toISOString()).slice(0,10) }));
    setUsers(mapped);
    setDownloads(JSON.parse(localStorage.getItem('flixvzn_downloads') || '[]'));
  }, []);

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      u.name.toLowerCase().includes(term)
      || u.email.toLowerCase().includes(term)
      || u.plan.toLowerCase().includes(term)
      || u.status.toLowerCase().includes(term)
    );
  }, [users, userSearch]);

  const filteredAdminMessages = useMemo(() => {
    const messageTerm = chatSearch.trim().toLowerCase();
    const userTerm = chatUserSearch.trim().toLowerCase();
    return adminMessages.filter((m) => {
      const matchesMessage = !messageTerm || String(m.message || '').toLowerCase().includes(messageTerm);
      const matchesUser = !userTerm || String(m.name || '').toLowerCase().includes(userTerm);
      return matchesMessage && matchesUser;
    });
  }, [adminMessages, chatSearch, chatUserSearch]);

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/login');
  };

  const sendAdminReply = async () => {
    if (!adminInput.trim()) return;
    await chatService.sendAdminMessage(selectedRoom, adminInput.trim());
    const latest = await chatService.getAdminHistory(selectedRoom);
    setAdminMessages(latest);
    setAdminInput('');
  };

  return (
    <div className="pt-24 min-h-screen bg-[#141414] px-4 md:px-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-400">Welcome back, Administrator</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={handleLogout}>
             <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 font-bold flex items-center gap-2">
            <FileText className="w-4 h-4" /> Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Users', value: String(users.length), icon: Users, color: 'text-blue-500' },
          { label: 'Total Downloads', value: String(downloads.length), icon: PlayCircle, color: 'text-green-500' },
          ...stats.slice(2),
        ].map((stat, i) => (
          <Card key={i} className="bg-black/40 border-white/10 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <span className="text-xs font-bold text-gray-500 uppercase">Live</span>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <Card className="bg-black/40 border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Users</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                   placeholder="Search users..."
                   className="pl-10 bg-white/5 border-white/10 w-64"
                   value={userSearch}
                   onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 border-b border-white/10 text-sm uppercase">
                      <th className="pb-4 font-bold">User</th>
                      <th className="pb-4 font-bold">Plan</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 font-bold">Joined</th>
                      <th className="pb-4 font-bold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-purple-600 rounded-full" />
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm">{user.plan}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            user.status === 'Active' ? 'bg-green-500/20 text-green-500' :
                            user.status === 'Suspended' ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-gray-400">{user.joined}</td>
                        <td className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-black/90 text-white border-white/10">
                              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">Edit</DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">Suspend</DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer text-red-500">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-black/40 border-white/10 text-white">
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Server CPU</span>
                  <span className="text-green-500">32%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[32%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Memory Usage</span>
                  <span className="text-yellow-500">68%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 w-[68%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage</span>
                  <span className="text-red-500">89%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-[89%]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/10 text-white border-l-4 border-l-red-600">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Settings className="w-6 h-6 text-red-600 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">System Update</h3>
                  <p className="text-xs text-gray-400">Version 2.4.0 is ready for deployment. Schedule maintenance now.</p>
                  <Button variant="link" className="text-red-600 p-0 h-auto mt-2 text-xs">Review Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Live Chat Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs"
                >
                  {CHAT_ROOMS.map((room) => <option key={room} value={room}>{room}</option>)}
                </select>
                <div className="flex gap-2">
                  <Input value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} placeholder="Search chat in room..." className="bg-white/5 border-white/10" />
                  <Input value={chatUserSearch} onChange={(e) => setChatUserSearch(e.target.value)} placeholder="Search user..." className="bg-white/5 border-white/10" />
                </div>
              </div>
              <div className="h-52 overflow-auto space-y-2 bg-black/30 rounded-lg p-3 border border-white/10">
                {filteredAdminMessages.map((m) => (
                  <div key={m.id} className="text-xs">
                    <span className="text-red-400 font-bold">{m.name}: </span>
                    <span className="text-gray-200">{m.message}</span>
                  </div>
                ))}
                {filteredAdminMessages.length === 0 && <p className="text-xs text-gray-500">No room messages match current filters.</p>}
              </div>
              <div className="flex gap-2">
                <Input value={adminInput} onChange={(e) => setAdminInput(e.target.value)} placeholder={`Reply to #${selectedRoom} users...`} className="bg-white/5 border-white/10" />
                <Button onClick={sendAdminReply} className="bg-red-600 hover:bg-red-700">Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

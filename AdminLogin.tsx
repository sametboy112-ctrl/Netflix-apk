import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/admin/login', { email, password });
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid admin login details.');
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">Admin Login</h1>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" />
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Sign in as Admin</Button>
      </form>
    </div>
  );
}

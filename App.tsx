import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { MovieDetail } from './pages/MovieDetail';
import { Search } from './pages/Search';
import { Watch } from './pages/Watch';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserLogin } from './pages/UserLogin';
import { BrowsePage } from './pages/BrowsePage';
import { About } from './pages/About';
import { AnimePage } from './pages/AnimePage';
import { AnimeDetail } from './pages/AnimeDetail';
import { LivePage } from './pages/LivePage';
import { MangaPage } from './pages/MangaPage';
import { Profile } from './pages/Profile';
import { Footer } from './components/Footer';
import { AIChatbot } from './components/AIChatbot';
import { AdminLiveChat } from './components/AdminLiveChat';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('flixvzn-theme') || 'dark');
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('flixvzn-theme', theme);
  }, [theme]);
  return React.createElement(React.Fragment, null, children);
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#141414] text-white font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">
        <Navbar />
        <main className="pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/about" element={<About />} />
            <Route path="/movies" element={<BrowsePage title="Movies" subjectType={1} />} />
            <Route path="/series" element={<BrowsePage title="Series" subjectType={2} />} />
            <Route path="/trending" element={<BrowsePage title="New & Popular" isRanking={true} />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/anime" element={<AnimePage />} />
            <Route path="/manga" element={<MangaPage />} />
            <Route path="/anime/:url" element={<AnimeDetail />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            <Route path="/watch/:id" element={
              <ProtectedRoute>
                <Watch />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
        <AIChatbot />
        <AdminLiveChat />
        <ScrollToTop />
      </div>
    </Router>
  );
}

import { useState, useEffect } from 'react';
import { movieService } from '../services/api';
import { Subject } from '../types';
import { Hero } from '../components/Hero';
import { MovieRow } from '../components/MovieRow';
import { cn } from '../lib/utils';

export function Home() {
  const [trending, setTrending] = useState<Subject[]>([]);
  const [hot, setHot] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendingData, hotData] = await Promise.all([
          movieService.getTrending(0, 20),
          movieService.getHot()
        ]);
        setTrending(Array.isArray(trendingData) ? trendingData : []);
        setHot(Array.isArray(hotData) ? hotData : []);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#141414]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const heroMovie = hot.length > 0 ? hot[0] : (trending.length > 0 ? trending[0] : null);

  return (
    <div className="relative">
      {heroMovie && <Hero movie={heroMovie} />}
      <div className={cn(
        "px-4 md:px-12 relative z-10 space-y-12 pb-20",
        heroMovie ? "-mt-20 md:-mt-40" : "pt-24"
      )}>
        {trending.length > 0 || hot.length > 0 ? (
          <>
            {trending.length > 0 && <MovieRow title="Trending Now" movies={trending} />}
            {hot.length > 0 && <MovieRow title="Hot & New" movies={hot} />}
            {trending.length > 5 && <MovieRow title="Top Picks For You" movies={trending.slice(5, 15)} />}
          </>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-400">Unable to load movies right now.</h2>
            <p className="text-gray-500 mt-2">Please try refreshing the page later.</p>
          </div>
        )}
      </div>
    </div>
  );
}

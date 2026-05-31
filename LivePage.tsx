import { useEffect, useState } from 'react';
import { movieService } from '../services/api';
import { Subject } from '../types';
import { MovieCard } from '../components/MovieCard';

interface LiveMatch {
  id?: string;
  league?: string;
  playPath?: string;
  team1?: { name?: string } | string;
  team2?: { name?: string } | string;
}

const teamName = (team: LiveMatch['team1']) => {
  if (!team) return 'TBD';
  if (typeof team === 'string') return team;
  return team.name || 'TBD';
};

export function LivePage() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [highlights, setHighlights] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [liveData, hotData] = await Promise.all([
          movieService.getLive(),
          movieService.getHot(),
        ]);
        setMatches(Array.isArray(liveData) ? liveData : []);
        setHighlights(Array.isArray(hotData) ? hotData : []);
      } catch (error) {
        console.error('Failed to load live data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="pt-24 px-4 md:px-12 min-h-screen space-y-12">
      <section>
        <h1 className="text-3xl font-black mb-2">Live Football</h1>
        <p className="text-gray-400 mb-8">Watch live matches and open streams instantly.</p>

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match, index) => (
              <a
                key={match.id || index}
                href={match.playPath || '#'}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4 hover:border-red-600/60 transition-colors"
              >
                <p className="text-xs uppercase tracking-widest text-red-500 mb-2">{match.league || 'Live Match'}</p>
                <h3 className="font-bold text-lg leading-snug">{teamName(match.team1)} vs {teamName(match.team2)}</h3>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No live matches available right now.</div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-2">Highlights</h2>
        <p className="text-gray-400 mb-8">Catch up with hot and trending highlight content.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {highlights.slice(0, 12).map((movie) => (
            <MovieCard key={movie.subjectId} movie={movie} />
          ))}
        </div>
      </section>
    </div>
  );
}

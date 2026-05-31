import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { movieService } from '../services/api';
import { Subject } from '../types';
import { MovieCard } from '../components/MovieCard';
import { Search as SearchIcon } from 'lucide-react';

export function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [localQuery, setLocalQuery] = useState(query);
  
  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  useEffect(() => {
    setLocalQuery(query);
    const performSearch = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const [page1, page2] = await Promise.all([
          movieService.search(query, 1, 36),
          movieService.search(query, 2, 36),
        ]);

        const merged = [...page1, ...page2].filter(Boolean);
        const deduped = Array.from(
          new Map(merged.map((item) => [item.subjectId, item])).values()
        );
        setResults(deduped);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [query]);

  const filteredResults = results.filter(item => {
    const typeMatch = filterType === 'all' || 
                      (filterType === 'movie' && item.subjectType === 1) ||
                      (filterType === 'series' && item.subjectType === 2);
    
    const genreMatch = filterGenre === 'all' || 
                       (item.genre || '').toLowerCase().includes(filterGenre.toLowerCase());
    
    const yearMatch = filterYear === 'all' || 
                      (item.releaseDate || '').startsWith(filterYear);
    
    return typeMatch && genreMatch && yearMatch;
  });

  const genres = Array.from(new Set(results.flatMap(r => (r.genre || '').split(',').map(g => g.trim()).filter(Boolean))));
  const years = Array.from(new Set(results.map(r => (r.releaseDate || '').split('-')[0]).filter(Boolean))).sort().reverse();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(localQuery.trim())}`);
    }
  };

  return (
    <div className="pt-24 px-4 md:px-12 min-h-screen">
      <div className="max-w-4xl mx-auto mb-12">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search for movies, series, or people..."
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl py-4 px-14 text-lg focus:ring-2 focus:ring-red-600 focus:outline-none transition-all"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <SearchIcon className="w-4 h-4" /> Search
          </button>
        </form>
      </div>

      {!loading && results.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-10 bg-[#1a1a1a] p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Type</span>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#2a2a2a] border-none text-xs rounded-lg px-3 py-1 focus:ring-1 focus:ring-red-600 outline-none"
            >
              <option value="all">All Types</option>
              <option value="movie">Movies</option>
              <option value="series">Series</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Genre</span>
            <select 
              value={filterGenre} 
              onChange={(e) => setFilterGenre(e.target.value)}
              className="bg-[#2a2a2a] border-none text-xs rounded-lg px-3 py-1 focus:ring-1 focus:ring-red-600 outline-none"
            >
              <option value="all">All Genres</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Year</span>
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-[#2a2a2a] border-none text-xs rounded-lg px-3 py-1 focus:ring-1 focus:ring-red-600 outline-none"
            >
              <option value="all">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="ml-auto text-xs text-gray-500 font-medium mr-2">
            Showing {filteredResults.length} of {results.length} results
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl text-gray-400">
          {query ? (
            <>Search results for: <span className="text-white font-bold">"{query}"</span></>
          ) : (
            <>Explore our library</>
          )}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-600"></div>
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-2 gap-y-12">
          {filteredResults.map((movie) => (
            <div key={movie.subjectId} className="flex flex-col gap-2">
              <MovieCard movie={movie} />
              <div className="px-1">
                 <p className="text-sm font-semibold truncate">{movie.title}</p>
                 <p className="text-xs text-gray-500">{(movie.releaseDate || 'N/A').split('-')[0]}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-lg text-gray-500">No results found for your search.</p>
        </div>
      )}
    </div>
  );
}

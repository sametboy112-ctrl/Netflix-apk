import React, { useEffect, useState } from 'react';
import { Subject } from '../types';
import { movieService } from '../services/api';
import { MovieCard } from '../components/MovieCard';

interface BrowsePageProps {
  title: string;
  subjectType?: number; // 1: Movie, 2: Series
  isRanking?: boolean;
}

export function BrowsePage({ title, subjectType, isRanking }: BrowsePageProps) {
  const [movies, setMovies] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let data: Subject[] = [];
        if (isRanking) {
          data = await movieService.getRanking();
        } else if (subjectType !== undefined) {
          data = await movieService.getBrowse(subjectType);
        } else {
          data = await movieService.getTrending();
        }
        setMovies(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subjectType, isRanking]);

  return (
    <div className="pt-24 px-4 md:px-12 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">{title}</h1>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <MovieCard key={movie.subjectId} movie={movie} />
          ))}
        </div>
      )}

      {!loading && movies.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          No items found in this category.
        </div>
      )}
    </div>
  );
}

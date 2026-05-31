import { Subject } from '../types';
import { Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface HeroProps {
  movie: Subject;
}

export function Hero({ movie }: HeroProps) {
  const navigate = useNavigate();

  if (!movie) return null;

  return (
    <div className="relative h-[75vh] md:h-[90vh] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={movie.cover.url}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end px-4 md:px-12 pb-14 md:pb-44 max-w-4xl gap-4 md:gap-6 z-10 overflow-hidden">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-red-500 font-bold">Featured · Flixvzn Original</p>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold drop-shadow-xl leading-tight uppercase tracking-tighter max-w-[90%]">
          {movie.title}
        </h1>
        <p className="text-xs sm:text-sm md:text-lg text-gray-200 line-clamp-2 md:line-clamp-3 drop-shadow-md max-w-xl">
          {movie.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
          <Button
            size="lg"
            className="bg-red-600 text-white hover:bg-red-700 font-bold px-4 sm:px-8 text-sm sm:text-lg rounded-full flex-1 sm:flex-none py-6 sm:py-7"
            onClick={() => navigate(`/watch/${movie.subjectId}`)}
          >
            <Play className="fill-current w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2" /> Watch Now
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="bg-black/40 border border-white/30 text-white hover:bg-black/60 font-bold px-4 sm:px-8 text-sm sm:text-lg rounded-full flex-1 sm:flex-none py-6 sm:py-7"
            onClick={() => navigate(`/movie/${movie.subjectId}`)}
          >
            <Info className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2" /> More Info
          </Button>
        </div>
      </div>
    </div>
  );
}

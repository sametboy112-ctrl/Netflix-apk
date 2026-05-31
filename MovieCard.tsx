import { Subject } from '../types';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

interface MovieCardProps {
  movie: Subject;
  key?: string | number;
}

export function MovieCard({ movie }: MovieCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 50 }}
      className="relative min-w-[160px] md:min-w-[240px] h-28 md:h-36 cursor-pointer rounded-sm overflow-hidden snap-start"
      onClick={() => navigate(`/movie/${movie.subjectId}`)}
    >
      <img
        src={movie.cover.url}
        alt={movie.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-colors" />
      
      {/* Title overlay for small cards */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-xs md:text-sm font-semibold truncate">{movie.title}</p>
      </div>
    </motion.div>
  );
}

import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AnimeSubject } from '../types';

interface AnimeCardProps {
  anime: AnimeSubject;
  key?: string | number;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/anime/${encodeURIComponent(anime.url)}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 10 }}
      className="relative aspect-[2/3] cursor-pointer rounded-lg overflow-hidden snap-start shadow-lg"
      onClick={handleNavigate}
    >
      <img
        src={anime.image}
        alt={anime.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opactiy-60" />
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-sm font-bold truncate text-white">{anime.title}</p>
        {anime.year && <p className="text-[10px] text-gray-400">{anime.year} • {anime.type}</p>}
      </div>
    </motion.div>
  );
}

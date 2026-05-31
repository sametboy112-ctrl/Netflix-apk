import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieService, profileService } from '../services/api';
import { Subject } from '../types';
import { Play, Plus, ThumbsUp, Share2, Star, Download, ShieldCheck, Copy, Twitter, Mail, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MovieRow } from '../components/MovieRow';
import { MovieDiscussion } from '../components/MovieDiscussion';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Subject | null>(null);
  const [recommendations, setRecommendations] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [selectedSubtitle, setSelectedSubtitle] = useState('English');
  const [engagement, setEngagement] = useState<{ likes: number; comments: any[] }>({ likes: 0, comments: [] });
  const [commentText, setCommentText] = useState('');
  const navigate = useNavigate();

  const subtitles = movie?.subtitles?.split(',').map(s => s.trim()) || ['English', 'Spanish', 'French', 'Arabic'];

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const movieData = await movieService.getDetail(id);
        setMovie(movieData);
        const recs = await movieService.getRecommendations(movieData.subjectId);
        setRecommendations(recs);
        const metrics = await movieService.getEngagement(movieData.subjectId);
        setEngagement({ likes: metrics?.likes || 0, comments: metrics?.comments || [] });

        // Record History
        await profileService.addToHistory({
          subjectId: movieData.subjectId,
          title: movieData.title,
          coverUrl: movieData.cover.url,
          subjectType: movieData.subjectType
        });
      } catch (error) {
        console.error('Error fetching movie detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${movie?.title} on flixvzn.movie!`;
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } else if (platform === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
    }
  };

  const makeCollectionItem = () => ({
    subjectId: movie!.subjectId,
    title: movie!.title,
    coverUrl: movie!.cover?.url || '',
    subjectType: movie!.subjectType,
    timestamp: new Date().toISOString(),
  });

  const handleAddFavorite = async () => {
    await profileService.addToFavorites(makeCollectionItem());
    alert('Added to favorites');
  };

  const handleAddWatchlist = async () => {
    await profileService.addToWatchlist(makeCollectionItem());
    alert('Added to watchlist');
  };

  const handleLike = async () => {
    const res = await movieService.like(movie!.subjectId);
    setEngagement((prev) => ({ ...prev, likes: res.likes || prev.likes }));
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    const res = await movieService.comment(movie!.subjectId, commentText.trim());
    setEngagement((prev) => ({ ...prev, comments: [...prev.comments, res.comment] }));
    setCommentText('');
  };

  const handleDownload = async (quality: string) => {
    try {
      const playData = await movieService.getPlayOptions(movie!.subjectId);
      const res = quality.replace('p', '');
      const stream = Array.isArray(playData?.streams) ? playData.streams.find((s: any) => String(s?.resolutions) === res) : null;
      const downloadUrl = stream?.downloadUrl || stream?.proxyUrl || stream?.url;
      if (downloadUrl) {
         window.open(downloadUrl, '_blank');
      } else {
         alert(`Preparing ${quality} download... Your download will start shortly.`);
      }
    } catch (err) {
      alert('Failed to fetch download link. Please try again later.');
    }
  };

  if (loading) return <div className="h-screen bg-[#141414]" />;
  if (!movie) return <div className="p-20 text-center text-2xl">Movie not found</div>;

  return (
    <div className="pt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Poster & Action */}
        <div className="lg:col-span-1 space-y-6">
          <img
            src={movie.cover.url}
            alt={movie.title}
            className="w-full rounded-lg shadow-2xl shadow-black relative"
          />
          
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 space-y-6">
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Quality</h4>
              <div className="flex gap-2">
                {['1080p', '480p', '360p'].map(q => (
                  <button 
                    key={q}
                    onClick={() => setSelectedQuality(q)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
                      selectedQuality === q ? "bg-red-600 border-red-600 text-white" : "bg-[#2f2f2f] border-transparent text-gray-400 hover:border-gray-600"
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Download</h4>
              <div className="grid grid-cols-1 gap-2">
                 {['1080p', '480p', '360p'].map(q => (
                   <Button 
                    key={q} 
                    variant="outline" 
                    className="w-full bg-[#2f2f2f] border-transparent hover:bg-[#3f3f3f] justify-start text-xs h-10"
                    onClick={() => handleDownload(q)}
                   >
                     <Download className="w-4 h-4 mr-3 text-red-500" />
                     {q} Download
                   </Button>
                 ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info & Discussion */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
               <h1 className="text-4xl md:text-5xl font-bold">{movie.title}</h1>
               <div className="bg-red-600/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/20 flex items-center gap-1">
                 <ShieldCheck className="w-3 h-3" />
                 VERIFIED
               </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-400 font-medium">
              <span className="text-green-500 font-bold">{Math.floor(Math.random() * 20) + 80}% Match</span>
              <span>{movie.releaseDate.split('-')[0]}</span>
              <span className="bg-[#2f2f2f] px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-widest">{movie.subjectType === 1 ? 'MOVIE' : 'SERIES'}</span>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span>{movie.imdbRatingValue}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 h-12"
                onClick={async () => {
                  const playData = await movieService.getPlayOptions(movie.subjectId);
                  const chosen = Array.isArray(playData?.streams)
                    ? playData.streams.find((s: any) => String(s?.resolutions) === selectedQuality.replace('p', ''))
                    : null;
                  const playUrl = encodeURIComponent(
                    chosen?.proxyUrl || playData?.playPath || playData?.data?.playPath || playData?.matchList?.[0]?.playPath || '',
                  );
                  navigate(`/watch/${movie.subjectId}?sub=${encodeURIComponent(selectedSubtitle)}&playUrl=${playUrl}`);
                }}
              >
                <Play className="fill-current w-5 h-5 mr-2" /> Play Now
              </Button>
              <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-white/20 text-white hover:bg-white/10" onClick={handleAddWatchlist}>
                <Plus className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-white/20 text-white hover:bg-white/10" onClick={handleLike}>
                <ThumbsUp className="w-5 h-5" />
              </Button>
              <Button variant="outline" className="h-12 border-white/20 text-white hover:bg-white/10" onClick={handleAddFavorite}>
                Favorite
              </Button>
              <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/profile')}>
                <UserCircle2 className="w-5 h-5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-white/20 text-white hover:bg-white/10 lg:ml-auto">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <DropdownMenuItem onClick={() => handleShare('twitter')} className="gap-2 cursor-pointer focus:bg-white/5">
                    <Twitter className="w-4 h-4 text-blue-400" /> Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('email')} className="gap-2 cursor-pointer focus:bg-white/5">
                    <Mail className="w-4 h-4 text-red-400" /> Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('copy')} className="gap-2 cursor-pointer focus:bg-white/5">
                    <Copy className="w-4 h-4 text-gray-400" /> Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-lg md:text-xl leading-relaxed text-gray-300">
              {movie.description || 'No description available for this title.'}
            </p>

            {Array.isArray(movie.cast) && movie.cast.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Cast</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {movie.cast.slice(0, 8).map((actor) => (
                    <div key={actor.staffId || actor.name} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 flex items-center gap-3">
                      {actor.avatar ? (
                        <img src={actor.avatar} alt={actor.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{actor.name}</p>
                        <p className="text-xs text-gray-400 truncate">{actor.role || 'Cast'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-white/5 text-sm">
              <div className="space-y-1">
                <span className="text-gray-500 block uppercase text-[10px] font-bold tracking-widest">Genres</span> 
                <span className="text-gray-200">{movie.genre}</span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 block uppercase text-[10px] font-bold tracking-widest">Country</span> 
                <span className="text-gray-200">{movie.countryName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 block uppercase text-[10px] font-bold tracking-widest">Subtitles</span>
                <select
                  value={selectedSubtitle}
                  onChange={(e) => setSelectedSubtitle(e.target.value)}
                  className="bg-[#2f2f2f] border border-white/10 text-gray-200 text-xs rounded-md px-3 py-1.5 min-w-[140px] focus:outline-none focus:ring-1 focus:ring-red-600"
                >
                  {subtitles.map((subtitle) => (
                    <option key={subtitle} value={subtitle}>
                      {subtitle}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-3">
              <div className="text-sm text-gray-300">Likes: <span className="font-bold text-white">{engagement.likes}</span></div>
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Comment on ${movie.title}...`}
                  className="flex-1 bg-[#2b2b2b] rounded-lg px-3 py-2 text-sm border border-white/10"
                />
                <Button onClick={handleComment} className="bg-red-600 hover:bg-red-700">Send</Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-auto">
                {engagement.comments.slice(-8).map((c: any) => (
                  <div key={c.id} className="text-xs text-gray-300 bg-white/5 rounded p-2">
                    <span className="font-bold text-white">{c.name}: </span>{c.text}
                  </div>
                ))}
              </div>
            </div>
            {(movie.cast || []).length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-3">Actors & Staff</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {movie.cast!.slice(0, 9).map((p) => (
                    <div key={p.staffId || p.name} className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 flex gap-3 items-center">
                      {p.avatar ? <img src={p.avatar} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-white/10" />}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{p.name}</div>
                        <div className="text-xs text-gray-400 truncate">{p.role || 'Cast'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {movie.subjectType === 2 && (
              <div className="pt-4">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  Episodes <span className="text-sm font-normal text-gray-500 font-mono italic">Season 1</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((ep) => (
                    <div 
                      key={ep}
                      className="bg-[#1a1a1a] hover:bg-[#252525] p-5 rounded-xl cursor-pointer flex items-center gap-5 group transition-all border border-white/5"
                      onClick={async () => {
                        const playData = await movieService.getPlayData(movie.subjectId);
                        const epPath = playData?.matchList?.[ep - 1]?.playPath;
                        const playUrl = encodeURIComponent(
                          epPath || playData?.playPath || playData?.data?.playPath || playData?.matchList?.[0]?.playPath || '',
                        );
                        navigate(`/watch/${movie.subjectId}?ep=${ep}&sub=${encodeURIComponent(selectedSubtitle)}&playUrl=${playUrl}`);
                      }}
                    >
                      <div className="text-2xl font-black text-white/20 group-hover:text-red-600 transition-colors">{ep.toString().padStart(2, '0')}</div>
                      <div className="flex-1">
                        <div className="font-bold text-sm tracking-wide">Episode {ep}</div>
                        <div className="text-[10px] text-gray-500 font-mono">AVAILABLE IN {selectedQuality}</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                        <Play className="w-4 h-4 fill-current text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <div className="space-y-8">
                <div className="pt-10 border-t border-white/5">
                  <MovieRow title="More Like This" movies={recommendations} />
                </div>
                <div>
                  <MovieRow title="Recommended For You" movies={recommendations.slice(0, 12)} />
                </div>
              </div>
            )}
          </div>

          {/* Discussion Section */}
          <div className="pt-10">
             <MovieDiscussion movieId={movie.subjectId} movieTitle={movie.title} />
          </div>
        </div>
      </div>

    </div>
  );
}

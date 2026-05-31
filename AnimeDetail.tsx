import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { animeService } from '../services/api';
import { AnimeDetail as IAnimeDetail, AnimeDownload } from '../types';
import { Play, Download, ChevronRight, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AnimeDetail() {
  const { url } = useParams<{ url: string }>();
  const [detail, setDetail] = useState<IAnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState<AnimeDownload[]>([]);
  const [selectedEp, setSelectedEp] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetail = async () => {
      if (!url) return;
      setLoading(true);
      try {
        const data = await animeService.getDetail(decodeURIComponent(url));
        setDetail(data);
      } catch (err) {
        console.error('Anime detail error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo(0, 0);
  }, [url]);

  const handleFetchDownloads = async (episodeKey: string) => {
    setSelectedEp(episodeKey);
    try {
      const links = await animeService.getDownload(url || '', episodeKey);
      setDownloads(links || []);
    } catch (err) {
      console.error('Download fetch error:', err);
    }
  };

  if (loading) return <div className="h-screen bg-[#141414] animate-pulse" />;
  if (!detail) return <div className="p-20 text-center">Anime not found</div>;

  return (
    <div className="pt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Col */}
        <div className="lg:col-span-1 space-y-6">
          <img
            src={detail.image}
            alt={detail.title}
            className="w-full rounded-2xl shadow-2xl border border-white/5"
          />
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 space-y-4">
             <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Status</span>
                <span className="text-red-500 font-bold">{detail.status}</span>
             </div>
             <div className="flex flex-wrap gap-2">
                {detail.genres?.map(g => (
                  <span key={g} className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300 border border-white/5">{g}</span>
                ))}
             </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="lg:col-span-2 space-y-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">{detail.title}</h1>
                <ShieldCheck className="text-blue-500 w-6 h-6" />
              </div>
              <p className="text-lg text-gray-300 leading-relaxed italic">
                 {detail.synopsis}
              </p>
           </div>

           <div className="space-y-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <Play className="text-red-600 fill-current" />
                Episodes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                 {detail.episodes?.map((ep, i) => (
                   <button
                     key={i}
                     onClick={() => handleFetchDownloads(ep.url || ep.number)}
                     className={`p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-between group ${selectedEp === ep.number ? 'bg-red-600 border-red-600 text-white' : 'bg-[#1a1a1a] border-white/5 text-gray-400 hover:border-white/20'}`}
                   >
                     <span>EP {ep.number}</span>
                     <Download className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
                 ))}
              </div>
           </div>

           {downloads.length > 0 && (
             <div className="bg-red-600/5 border border-red-600/20 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                   <Download className="w-5 h-5" />
                   <h4 className="font-bold uppercase tracking-widest text-xs">Streaming & Download Links</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {downloads.map((d, idx) => (
                     <a 
                       key={idx}
                       href={d.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="p-4 bg-[#1a1a1a] rounded-xl border border-white/5 hover:bg-[#222] transition-colors flex items-center justify-between"
                     >
                       <span className="text-sm font-medium">{d.server}</span>
                       <ChevronRight className="w-4 h-4 text-gray-500" />
                     </a>
                   ))}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { searchAnime, getAnimeDetail, getAnimeStreams } from '../services/api';

export function AnimePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [streamUrl, setStreamUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q); setLoading(true); setError(''); setDetail(null); setEpisodes([]);
    try {
      const data = await searchAnime(q);
      const list = data?.data || data?.results || data?.Page?.media || [];
      setResults(Array.isArray(list) ? list : []);
      if (!list.length) setError('No results found.');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const openDetail = async (anime: any) => {
    setLoading(true); setError('');
    const url = anime.id || anime.url || anime._id;
    try {
      const d = await getAnimeDetail(url);
      setDetail(d?.data || d);
      setEpisodes(d?.data?.episodes || d?.episodes || []);
      setResults([]);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const watchEpisode = async (ep: any) => {
    setLoading(true); setError('');
    const epUrl = ep.id || ep.url || ep._id || ep?.episodeId;
    try {
      const s = await getAnimeStreams(epUrl);
      const sources = s?.data?.sources || s?.sources || [];
      const url = sources[0]?.url || '';
      setStreamUrl(url);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const back = () => {
    if (streamUrl) { setStreamUrl(''); return; }
    if (detail) { setDetail(null); setEpisodes([]); return; }
    setResults([]);
  };

  // Player view
  if (streamUrl) {
    return (
      <div className="min-h-screen bg-black">
        <div className="p-3 bg-gray-900 flex items-center gap-3">
          <button onClick={back} className="text-white">← Back</button>
          <span className="text-white text-sm truncate">{detail?.title || ''}</span>
        </div>
        <video controls className="w-full aspect-video" key={streamUrl}>
          <source src={streamUrl} type="video/mp4" />
        </video>
      </div>
    );
  }

  // Detail view
  if (detail) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] dark:bg-[#0f0f0f] light:bg-white p-4">
        <button onClick={back} className="text-red-500 mb-4 block">← Back to results</button>
        <div className="flex gap-4 mb-6">
          <img src={detail?.cover || detail?.image || '/placeholder.jpg'} className="w-32 rounded-lg" />
          <div>
            <h1 className="text-xl font-bold text-white dark:text-white light:text-gray-900">{detail?.title || detail?.name}</h1>
            <p className="text-sm text-gray-400 mt-1">{detail?.status || ''} • {detail?.genres?.join?.(', ') || ''}</p>
            <p className="text-sm text-gray-300 mt-2 line-clamp-3">{detail?.description || detail?.synopsis || ''}</p>
          </div>
        </div>
        <h2 className="text-lg font-bold mb-3 text-white">Episodes ({episodes.length})</h2>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-gray-800 h-12 rounded animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {episodes.map((ep, i) => (
              <button key={ep.id || i} onClick={() => watchEpisode(ep)}
                className="p-3 bg-[#1a1a2e] dark:bg-[#1a1a2e] light:bg-gray-100 rounded text-left hover:bg-[#2a2a4a] transition text-white dark:text-white light:text-gray-900">
                <span className="text-sm font-medium">Ep {ep.number || ep.episode || i + 1}</span>
                {ep.title && <p className="text-xs text-gray-400 truncate mt-1">{ep.title}</p>}
              </button>
            ))}
            {!episodes.length && <p className="col-span-full text-center text-gray-500 py-10">No episodes</p>}
          </div>
        )}
      </div>
    );
  }

  // Search view
  return (
    <div className="min-h-screen bg-[#0f0f0f] dark:bg-[#0f0f0f] light:bg-white p-4">
      <h1 className="text-2xl font-bold mb-4 text-white dark:text-white light:text-gray-900">🎬 Anime</h1>
      <div className="mb-6">
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
          placeholder="🔍 Search anime..."
          className="w-full p-3 bg-[#1a1a2e] dark:bg-[#1a1a2e] light:bg-gray-100 border border-[#2a2a4a] rounded-lg text-white dark:text-white light:text-gray-900 focus:outline-none focus:border-red-500" />
      </div>
      {loading && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="animate-pulse"><div className="bg-gray-800 h-48 rounded-lg mb-2" /><div className="bg-gray-800 h-4 rounded w-3/4 mb-1" /></div>)}
        </div>
      )}
      {error && <p className="text-red-500 text-center py-10">{error}</p>}
      {results.length > 0 && !loading && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {results.map((a, i) => (
            <div key={a.id || a._id || i} onClick={() => openDetail(a)} className="cursor-pointer group">
              <div className="relative overflow-hidden rounded-lg">
                <img src={a.coverImage?.large || a.image || a.cover || '/placeholder.jpg'}
                  alt={a.title?.english || a.title?.romaji || a.title || a.name}
                  className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                <span className="absolute top-2 right-2 bg-red-600 text-xs px-2 py-0.5 rounded text-white">{a.averageScore || a.score || '?'}</span>
              </div>
              <h3 className="text-sm font-medium mt-1 truncate text-white dark:text-white light:text-gray-900">{a.title?.english || a.title?.romaji || a.title || a.name}</h3>
              <p className="text-xs text-gray-400">{a.episodes || a.totalEpisodes || '?'} eps</p>
            </div>
          ))}
        </div>
      )}
      {!results.length && !loading && !error && (
        <div className="text-center text-gray-500 py-20">
          <p className="text-lg mb-2">🔍 Search for any anime</p>
          <p className="text-sm">Try "Attack on Titan", "One Piece"...</p>
        </div>
      )}
    </div>
  );
}

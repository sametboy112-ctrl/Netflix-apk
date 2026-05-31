import { useState, useEffect } from 'react';
import { getMangaHome, getMangaDetail, getMangaChapters, getMangaChapter } from '../services/api';

export function MangaPage() {
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getMangaHome(1).then(d => {
      const list = d?.data || d?.list || d?.results || [];
      setMangaList(Array.isArray(list) ? list : []);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const openDetail = async (manga: any) => {
    setSelected(manga); setLoading(true); setError('');
    const id = manga.id || manga._id || manga.session;
    try {
      const d = await getMangaDetail(id);
      setDetail(d?.data || d);
      const ch = await getMangaChapters(id);
      setChapters(ch?.data || ch?.chapters || []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const openChapter = async (ch: any) => {
    setLoading(true); setError('');
    try {
      const id = ch.id || ch._id || ch.chapter_id;
      const p = await getMangaChapter(id);
      const arr = p?.data || p?.images || p?.chapter?.data || p || [];
      setPages(Array.isArray(arr) ? arr : []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  if (pages.length > 0) {
    return (
      <div className="min-h-screen bg-black">
        <div className="sticky top-0 z-10 bg-gray-900 p-3 flex items-center gap-3">
          <button onClick={() => { setPages([]); setSelected(null); }} className="text-white text-lg">← Back</button>
          <span className="text-white text-sm truncate">{detail?.title || selected?.title}</span>
        </div>
        <div className="max-w-2xl mx-auto">
          {pages.map((p, i) => (
            <img key={i} src={p} alt={`Page ${i+1}`} className="w-full" loading="lazy"
              onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
          ))}
          {pages.length === 0 && <p className="text-center text-gray-500 py-10">No pages</p>}
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] dark:bg-[#0f0f0f] light:bg-white p-4">
        <button onClick={() => { setSelected(null); setDetail(null); }} className="text-red-500 mb-4 block">← Back</button>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-gray-800 h-12 rounded animate-pulse" />)}</div>
        ) : (
          <>
            <div className="flex gap-4 mb-6">
              <img src={detail?.cover || detail?.poster || selected.cover || '/placeholder.jpg'} className="w-32 rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-white dark:text-white light:text-gray-900">{detail?.title || selected.title}</h1>
                <p className="text-sm text-gray-400 mt-1">{detail?.status || ''} • {detail?.genres?.join?.(', ') || detail?.genre || ''}</p>
                <p className="text-sm text-gray-300 mt-2 line-clamp-4">{detail?.description || detail?.synopsis || ''}</p>
              </div>
            </div>
            <h2 className="text-lg font-bold mb-3 text-white">Chapters ({chapters.length})</h2>
            <div className="space-y-1">
              {chapters.map((ch, i) => (
                <button key={i} onClick={() => openChapter(ch)}
                  className="w-full text-left p-3 bg-[#1a1a2e] dark:bg-[#1a1a2e] light:bg-gray-100 rounded hover:bg-[#2a2a4a] transition text-white dark:text-white light:text-gray-900">
                  Ch.{ch.number || ch.chapter || i + 1}{ch.title ? ` — ${ch.title}` : ''}
                </button>
              ))}
              {!chapters.length && <p className="text-gray-500 text-center py-4">No chapters</p>}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] dark:bg-[#0f0f0f] light:bg-white p-4">
      <h1 className="text-2xl font-bold mb-6 text-white dark:text-white light:text-gray-900">📚 Manga</h1>
      {loading ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="animate-pulse"><div className="bg-gray-800 h-48 rounded-lg mb-2" /><div className="bg-gray-800 h-4 rounded w-3/4 mb-1" /></div>)}
        </div>
      ) : error ? (
        <div className="text-center py-10"><p className="text-red-500">{error}</p></div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {mangaList.map((m, i) => (
            <div key={m.id || i} onClick={() => openDetail(m)} className="cursor-pointer group">
              <div className="relative overflow-hidden rounded-lg">
                <img src={m.cover || m.poster || m.image || '/placeholder.jpg'} alt={m.title || m.name}
                  className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform" loading="lazy" />
              </div>
              <h3 className="text-sm font-medium mt-1 truncate text-white dark:text-white light:text-gray-900">{m.title || m.name}</h3>
              <p className="text-xs text-gray-400">{m.chapters || m.episodes || 0} ch</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

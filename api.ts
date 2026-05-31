const API_BASE = '/api/proxy';

async function fetchProxy(endpoint: string) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
  return res.json();
}

// ─── MANGA ───
export async function getMangaHome(page = 1) {
  try { return await fetchProxy(`/anime/home?page=${page}`); }
  catch { return { data: [] }; }
}

export async function getMangaDetail(id: string) {
  try { return await fetchProxy(`/anime/detail?id=${id}`); }
  catch { return {}; }
}

export async function getMangaChapters(id: string) {
  try { 
    const res = await fetch(`/api/proxy/anime/episodes?slug=${id}`);
    return await res.json();
  } catch { return { chapters: [] }; }
}

export async function getMangaChapter(chapterId: string) {
  return { data: [] };
}

// ─── ANIME ───
export async function searchAnime(query: string) {
  try { return await fetchProxy(`/anime/search?q=${encodeURIComponent(query)}`); }
  catch { return { data: [] }; }
}

export async function getAnimeDetail(url: string) {
  try { return await fetchProxy(`/anime/detail?slug=${url}`); }
  catch { return {}; }
}

export async function getAnimeStreams(url: string) {
  try { return await fetch(`/api/proxy/anime/watch?episode=${url}`).then(r => r.json()); }
  catch { return { sources: [] }; }
}

// ─── MOVIES ───
export async function searchMovies(query: string) {
  try { return await fetch(`/api/search?q=${encodeURIComponent(query)}`).then(r => r.json()); }
  catch { return { data: [] }; }
}

export async function getMoviePlay(subjectId: string) {
  try { return await fetch(`/api/play?subjectId=${subjectId}`).then(r => r.json()); }
  catch { return { streams: [] }; }
}

export async function getTrending() {
  try { return await fetchProxy(`/anime/home?page=1`); }
  catch { return { data: [] }; }
}

// ─── AI Chat ───
export const movieService = {
  async getDetail(id: string) {
    try {
      const [detail, play] = await Promise.all([
        fetch(`/api/detail?id=${id}`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/play?subjectId=${id}`).then(r => r.json()).catch(() => ({}))
      ]);
      const streams = play?.data?.streams || play?.streams || [];
      return { ...detail, streams, subjectId: id };
    } catch { return { subjectId: id, streams: [] }; }
  },

  async getPlayData(url: string) {
    try {
      const res = await fetch(`/api/play?subjectId=${url}`);
      return await res.json();
    } catch { return { streams: [] }; }
  },

  async getPlayOptions(id: string, se: number, ep: number) {
    try {
      const res = await fetch(`/api/play?subjectId=${id}`);
      const data = await res.json();
      return data?.data || data;
    } catch { return { streams: [] }; }
  },

  async stream(opts: { subjectId: string; se?: number; ep?: number; resolution?: string; lang?: string }) {
    const streams = await this.getPlayOptions(opts.subjectId, opts.se || 0, opts.ep || 1);
    const s = streams?.streams || [];
    const match = s.find((st: any) => String(st.resolutions) === (opts.resolution || '720'));
    return { proxyUrl: match?.proxyUrl || match?.url || s[0]?.proxyUrl || s[0]?.url || '', downloadUrl: match?.downloadUrl || '' };
  },

  async getRecommendations(id: string) {
    try {
      const res = await fetch(`/api/recommendations?id=${id}`);
      return await res.json();
    } catch { return { data: [] }; }
  },

  async getTrending() {
    try {
      const res = await fetch(`/api/proxy/anime/home`);
      return await res.json();
    } catch { return { data: [] }; }
  },

  async like(subjectId: string) {
    try {
      const res = await fetch(`/api/media/${subjectId}/like`, { method: 'POST' });
      return await res.json();
    } catch { return { success: false }; }
  },

  async comment(subjectId: string, text: string) {
    try {
      const res = await fetch(`/api/media/${subjectId}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      return await res.json();
    } catch { return { success: false }; }
  },

  async getEngagement(subjectId: string) {
    try {
      const res = await fetch(`/api/media/${subjectId}/engagement`);
      return await res.json();
    } catch { return { likes: 0, comments: [] }; }
  },
  
  async getLive() { return []; },
  async getHot() { return []; },
};

export const profileService = {
  async getProfile() {
    try { const res = await fetch('/api/user/me'); return await res.json(); } catch { return null; }
  },
  async updateProfile(data: any) {
    try { const res = await fetch('/api/user/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); return await res.json(); } catch { return null; }
  }
};

export const aiService = {
  async chat(message: string) {
    try {
      const res = await fetch('/api/chat/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      return data.reply || 'No response';
    } catch {
      return 'AI service unavailable.';
    }
  }
};

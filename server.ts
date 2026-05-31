import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import Pusher from "pusher";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Optional Pusher setup (falls back to in-memory chat when env vars are absent)
const canUsePusher = Boolean(
  process.env.PUSHER_APP_ID &&
  process.env.NEXT_PUBLIC_PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_CLUSTER
);

const pusher = canUsePusher
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

// MongoDB Setup
const MONGODB_URL = process.env.MONGODB_URL;
if (MONGODB_URL) {
  mongoose.connect(MONGODB_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
}

// User Model
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  githubId: { type: String },
  watchHistory: [{
    subjectId: String,
    title: String,
    coverUrl: String,
    subjectType: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  preferences: {
    theme: { type: String, default: 'dark' },
    autoplay: { type: Boolean, default: true }
  },
  socialLinks: [{
    platform: String,
    url: String
  }],
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' }
  ,
  favorites: [{
    subjectId: String,
    title: String,
    coverUrl: String,
    subjectType: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  watchlist: [{
    subjectId: String,
    title: String,
    coverUrl: String,
    subjectType: Number,
    timestamp: { type: Date, default: Date.now }
  }]
});
const User = mongoose.model("User", UserSchema);
const memoryUsers = new Map<string, any>();
const movieChats = new Map<string, any[]>();
const adminChats = new Map<string, any[]>();
const mediaInteractions = new Map<
  string,
  {
    likes: Set<string>;
    comments: { id: string; userId: string; name: string; text: string; createdAt: string }[];
  }
>();
const useMongo = Boolean(MONGODB_URL);

const findUserByEmail = async (email: string) => {
  if (useMongo) return User.findOne({ email });
  return memoryUsers.get(email.toLowerCase()) || null;
};

const createUser = async (payload: { email: string; password: string; name?: string }) => {
  if (useMongo) {
    const user = new User(payload);
    await user.save();
    return user;
  }

  const existing = memoryUsers.get(payload.email.toLowerCase());
  if (existing) throw new Error("User already exists");

  const user = {
    _id: `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    email: payload.email.toLowerCase(),
    password: payload.password,
    name: payload.name,
    watchHistory: [],
    preferences: { theme: "dark", autoplay: true },
    socialLinks: [],
    bio: "",
    avatarUrl: "",
  };

  memoryUsers.set(user.email, user);
  return user;
};

const findUserById = async (id: string) => {
  if (useMongo) return User.findById(id).select("-password");
  return Array.from(memoryUsers.values()).find((u) => u._id === id) || null;
};

const updateUserById = async (id: string, update: any) => {
  if (useMongo) {
    return User.findByIdAndUpdate(id, update, { new: true }).select("-password");
  }

  const user = Array.from(memoryUsers.values()).find((u) => u._id === id);
  if (!user) return null;
  Object.assign(user, update.$set || {});
  memoryUsers.set(user.email, user);
  const { password, ...safeUser } = user;
  return safeUser;
};

const ensureLocalUserCollections = (user: any) => {
  if (!Array.isArray(user.favorites)) user.favorites = [];
  if (!Array.isArray(user.watchlist)) user.watchlist = [];
  if (!Array.isArray(user.likes)) user.likes = [];
};

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret");

// Auth Middleware
const authMiddleware = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// --- API ROUTES ---

app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser({ email: normalizedEmail, password: hashedPassword, name });
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = await new SignJWT({ userId: user._id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);
    res.json({ token, user: { email: user.email, name: user.name, id: user._id } });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/user/me", authMiddleware, async (req: any, res) => {
  try {
    const user = await findUserById(req.user.userId);
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.patch("/api/user/profile", authMiddleware, async (req: any, res) => {
  try {
    const { name, bio, avatarUrl, socialLinks, preferences } = req.body;
    const user = await updateUserById(req.user.userId, {
      $set: { name, bio, avatarUrl, socialLinks, preferences }
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.post("/api/user/history", authMiddleware, async (req: any, res) => {
  try {
    const { subjectId, title, coverUrl, subjectType } = req.body;
    const user = useMongo
      ? await User.findById(req.user.userId)
      : Array.from(memoryUsers.values()).find((u) => u._id === req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Remove if already exists to move to front
    const filteredHistory = user.watchHistory.filter(h => h.subjectId !== subjectId);
    const newEntry = { subjectId, title, coverUrl, subjectType, timestamp: new Date() };
    
    // Using any to bypass mongoose/ts strict array type mismatch during transition
    user.watchHistory = [newEntry, ...filteredHistory].slice(0, 50) as any;
    
    if (useMongo) {
      await user.save();
    } else {
      memoryUsers.set(user.email, user);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to update history" });
  }
});

// Real-time Chat/Discussion
app.post("/api/chat/send", authMiddleware, async (req: any, res) => {
  const { movieId, message, name, mediaType, mediaUrl } = req.body;
  try {
    const chatMsg = {
      id: Date.now().toString(),
      movieId,
      message,
      name: name || req.user.email,
      mediaType: mediaType || null,
      mediaUrl: mediaUrl || null,
      timestamp: new Date().toISOString(),
    };
    const existing = movieChats.get(movieId) || [];
    movieChats.set(movieId, [...existing, chatMsg].slice(-200));

    if (pusher) {
      await pusher.trigger(`movie-${movieId}`, "message", chatMsg);
    }
    res.json({ success: true, message: chatMsg });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/chat/history", async (req, res) => {
  const movieId = String(req.query.movieId || "");
  if (!movieId) return res.status(400).json({ error: "movieId is required" });
  res.json({ data: movieChats.get(movieId) || [] });
});

app.get("/api/chat/pusher-config", (req, res) => {
  res.json({
    enabled: Boolean(pusher),
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
    cluster: process.env.PUSHER_CLUSTER || "",
  });
});

app.post("/api/chat/admin/send", authMiddleware, async (req: any, res) => {
  const { roomId = "global", message } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });
  const chatMsg = {
    id: `admin_${Date.now()}`,
    roomId,
    message,
    name: req.user.email,
    role: localStorageAdminEmail(req.user.email) ? "admin" : "user",
    timestamp: new Date().toISOString(),
  };
  const existing = adminChats.get(roomId) || [];
  adminChats.set(roomId, [...existing, chatMsg].slice(-300));
  if (pusher) {
    await pusher.trigger(`admin-room-${roomId}`, "message", chatMsg);
  }
  res.json({ success: true, message: chatMsg });
});

app.get("/api/chat/admin/history", authMiddleware, async (req, res) => {
  const roomId = String(req.query.roomId || "global");
  res.json({ data: adminChats.get(roomId) || [] });
});

const localStorageAdminEmail = (email: string) => {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@flixvzn.movie").toLowerCase();
  return email?.toLowerCase() === adminEmail;
};

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@flixvzn.movie").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "flixvznadmin";

  if (String(email || "").toLowerCase() !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }

  const token = await new SignJWT({ admin: true, email: adminEmail })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);

  res.json({ token, admin: { email: adminEmail } });
});

app.post("/api/user/favorites", authMiddleware, async (req: any, res) => {
  const { item } = req.body;
  if (!item?.subjectId) return res.status(400).json({ error: "item.subjectId is required" });

  if (useMongo) {
    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { favorites: item },
    });
    return res.json({ success: true });
  }

  const user = Array.from(memoryUsers.values()).find((u) => u._id === req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  ensureLocalUserCollections(user);
  if (!user.favorites.find((x: any) => x.subjectId === item.subjectId)) {
    user.favorites.unshift(item);
  }
  memoryUsers.set(user.email, user);
  res.json({ success: true, data: user.favorites });
});

app.post("/api/user/watchlist", authMiddleware, async (req: any, res) => {
  const { item } = req.body;
  if (!item?.subjectId) return res.status(400).json({ error: "item.subjectId is required" });

  if (useMongo) {
    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { watchlist: item },
    });
    return res.json({ success: true });
  }

  const user = Array.from(memoryUsers.values()).find((u) => u._id === req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  ensureLocalUserCollections(user);
  if (!user.watchlist.find((x: any) => x.subjectId === item.subjectId)) {
    user.watchlist.unshift(item);
  }
  memoryUsers.set(user.email, user);
  res.json({ success: true, data: user.watchlist });
});

app.post("/api/media/:subjectId/like", authMiddleware, async (req: any, res) => {
  const { subjectId } = req.params;
  const bucket = mediaInteractions.get(subjectId) || { likes: new Set<string>(), comments: [] };
  if (bucket.likes.has(req.user.userId)) {
    bucket.likes.delete(req.user.userId);
  } else {
    bucket.likes.add(req.user.userId);
  }
  mediaInteractions.set(subjectId, bucket);
  res.json({ success: true, likes: bucket.likes.size, liked: bucket.likes.has(req.user.userId) });
});

app.post("/api/media/:subjectId/comment", authMiddleware, async (req: any, res) => {
  const { subjectId } = req.params;
  const text = String(req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "Comment text is required" });
  const bucket = mediaInteractions.get(subjectId) || { likes: new Set<string>(), comments: [] };
  const comment = {
    id: `c_${Date.now()}`,
    userId: req.user.userId,
    name: req.user.email,
    text,
    createdAt: new Date().toISOString(),
  };
  bucket.comments.push(comment);
  mediaInteractions.set(subjectId, bucket);
  res.json({ success: true, comment });
});

app.get("/api/media/:subjectId/engagement", async (req, res) => {
  const { subjectId } = req.params;
  const bucket = mediaInteractions.get(subjectId) || { likes: new Set<string>(), comments: [] };
  res.json({ likes: bucket.likes.size, comments: bucket.comments });
});

// Notifications
app.post("/api/notifications/send", async (req, res) => {
  const { title, message } = req.body;
  try {
    if (pusher) {
      await pusher.trigger("global-notifications", "notify", {
        title,
        message,
        timestamp: new Date().toISOString(),
      });
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Anime & Manga Proxy
const CONSUMET_ANIME_BASE = 'https://api.consumet.org/anime/gogoanime';

app.get("/api/proxy/anime/home", async (_req, res) => {
  try {
    const trendingRes = await fetch("https://api.jikan.moe/v4/top/anime?filter=airing&limit=8");
    const trendingJson: any = await trendingRes.json();
    const trending = Array.isArray(trendingJson?.data) ? trendingJson.data : [];

    const rows = await Promise.all(trending.map(async (anime: any) => {
      try {
        const searchRes = await fetch(`${CONSUMET_ANIME_BASE}/${encodeURIComponent(anime.title)}`);
        const searchJson: any = await searchRes.json();
        const match = searchJson?.results?.[0];
        return {
          title: anime.title,
          image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "",
          id: match?.id || anime.mal_id,
          malId: anime.mal_id,
          releaseDate: anime.year || "",
          type: anime.type || "TV",
          subOrDub: "SUB",
        };
      } catch { return null; }
    }));

    const clean = rows.filter(Boolean);
    res.json({ recent: clean, topAiring: clean, popular: clean });
  } catch {
    res.status(500).json({ error: "Failed to fetch anime homepage" });
  }
});

app.get("/api/proxy/anime/search", async (req, res) => {
  const { query, dub } = req.query;
  try {
    const type = String(dub) === 'true' ? 1 : 0;
    const response = await fetch(`${CONSUMET_ANIME_BASE}/${encodeURIComponent(String(query || 'naruto'))}?type=${type}`);
    const data = await response.json();
    res.json({ data: data?.results || data || [] });
  } catch {
    res.status(500).json({ error: "Failed to fetch anime data" });
  }
});

app.get("/api/proxy/anime/detail", async (req, res) => {
  const { url } = req.query;
  try {
    const response = await fetch(`${CONSUMET_ANIME_BASE}/info/${encodeURIComponent(String(url || 'naruto'))}`);
    const data = await response.json();
    res.json({ data });
  } catch {
    res.status(500).json({ error: "Failed to fetch anime detail" });
  }
});

app.get("/api/proxy/anime/download", async (req, res) => {
  const { url, episode } = req.query;
  try {
    const episodeId = String(episode || '').includes('episode-')
      ? String(episode)
      : `${String(url || '').trim()}-episode-${Number(episode || 1)}`;
    const response = await fetch(`${CONSUMET_ANIME_BASE}/watch/${encodeURIComponent(episodeId)}?server=gogocdn`);
    const data = await response.json();
    const sources = (data?.sources || []).map((s: any) => ({ quality: s.quality || 'auto', url: s.url, server: 'gogocdn' }));
    if (data?.download) sources.push({ quality: 'download', url: data.download, server: 'download' });
    res.json({ data: sources });
  } catch {
    res.status(500).json({ error: "Failed to fetch anime downloads" });
  }
});

app.get("/api/proxy/anime/top", async (_req, res) => {
  try {
    const response = await fetch(`${CONSUMET_ANIME_BASE}/top-airing`);
    const data = await response.json();
    res.json({ data: data?.results || data || [] });
  } catch {
    res.status(500).json({ error: "Failed to fetch top anime" });
  }
});

app.get('/api/proxy/manga/search', async (req, res) => {
  const title = String(req.query.title || 'One Piece');
  try {
    const response = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=25&includes[]=cover_art`);
    const data = await response.json();
    const rows = (data?.data || []).map((m: any) => ({
      id: m.id,
      title: m.attributes?.title?.en || Object.values(m.attributes?.title || {})[0] || 'Untitled',
      year: m.attributes?.year || '',
    }));
    res.json({ data: rows });
  } catch {
    res.status(500).json({ error: 'Failed to fetch manga data' });
  }
});

app.get("/api/proxy/ai/chat", async (req, res) => {
  const { prompt } = req.query;
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${process.env.GEMINI_MODEL || "models/gemini-2.5-flash"}:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: process.env.GEMINI_SYSTEM_PROMPT || "You are flixvzn.movie assistant. Be concise, helpful, and streaming-focused." }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: String(prompt || '') }],
            },
          ],
          generationConfig: { temperature: 0.45 },
        }),
      });
      const geminiData: any = await geminiRes.json();
      return res.json({ response: geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response available.' });
    }

    const response = await fetch(`https://apis.prexzyvilla.site/ai/aichat?prompt=${encodeURIComponent(String(prompt || ""))}`);
    const data: any = await response.json();
    res.json({ response: data?.response || data?.data?.reply || 'No response available.' });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch AI response" });
  }
});

const MOVIE_API_BASE = "https://movieapi.xcasper.space/api";
const MOVIE_BFF_BASE = "https://movieapi.xcasper.space/api/bff";
const streamQuery = (query: any) =>
  Object.entries(query || {})
    .filter(([, v]) => v !== undefined && v !== null && String(v).length > 0)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

const proxyMovieApi = async (res: any, base: string, endpoint: string, query: any) => {
  try {
    const qs = streamQuery(query);
    const response = await fetch(`${base}/${endpoint}${qs ? `?${qs}` : ""}`);
    const data = await response.json();
    return res.json(data);
  } catch {
    return res.status(500).json({ error: `Failed to fetch ${endpoint}` });
  }
};

// Stream info proxy or direct
app.get("/api/proxy/movie/detail", async (req, res) => {
  const { subjectId } = req.query;
  try {
    const response = await fetch(`https://movieapi.xcasper.space/api/detail?subjectId=${subjectId}`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch movie detail" });
  }
});

app.get("/api/proxy/popular-search", async (req, res) => proxyMovieApi(res, MOVIE_API_BASE, "popular-search", req.query));
app.get("/api/proxy/captions", async (req, res) => proxyMovieApi(res, MOVIE_API_BASE, "captions", req.query));
app.get("/api/proxy/staff/detail", async (req, res) => proxyMovieApi(res, MOVIE_API_BASE, "staff/detail", req.query));
app.get("/api/proxy/staff/works", async (req, res) => proxyMovieApi(res, MOVIE_API_BASE, "staff/works", req.query));
app.get("/api/proxy/staff/related", async (req, res) => proxyMovieApi(res, MOVIE_API_BASE, "staff/related", req.query));
app.get("/api/proxy/stream", async (req, res) => proxyMovieApi(res, MOVIE_BFF_BASE, "stream", req.query));

app.get("/api/proxy/movie/recommend", async (req, res) => {
  const { subjectId, page, perPage } = req.query;
  try {
    const response = await fetch(`https://movieapi.xcasper.space/api/recommend?subjectId=${subjectId}&page=${page || 1}&perPage=${perPage || 10}`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

app.get("/api/proxy/movie/trending", async (req, res) => {
  const { page, perPage } = req.query;
  try {
    const response = await fetch(`https://movieapi.xcasper.space/api/trending?page=${page}&perPage=${perPage}`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch trending movies" });
  }
});

app.get("/api/proxy/movie/search", async (req, res) => {
  const { keyword, page, perPage, subjectType } = req.query;
  try {
    let url = `https://movieapi.xcasper.space/api/search?keyword=${encodeURIComponent(keyword as string)}&page=${page || 1}&perPage=${perPage || 20}`;
    if (subjectType) url += `&subjectType=${subjectType}`;
    
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to search movies" });
  }
});

app.get("/api/proxy/movie/homepage", async (req, res) => {
  try {
    const response = await fetch(`https://movieapi.xcasper.space/api/homepage`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch homepage data" });
  }
});

app.get("/api/proxy/movie/hot", async (req, res) => {
  try {
    const response = await fetch(`https://movieapi.xcasper.space/api/hot`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch hot movies" });
  }
});

app.get("/api/proxy/movie/browse", async (req, res) => {
  const { subjectType, page, perPage } = req.query;
  try {
    let url = `https://movieapi.xcasper.space/api/browse?page=${page || 1}&perPage=${perPage || 18}`;
    if (subjectType) url += `&subjectType=${subjectType}`;
    
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to browse movies" });
  }
});

app.get("/api/proxy/movie/ranking", async (req, res) => {
  const { page, perPage } = req.query;
  try {
    const response = await fetch(`https://movieapi.xcasper.space/api/ranking?page=${page}&perPage=${perPage}`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch ranking" });
  }
});

app.get("/api/proxy/movie/live", async (req, res) => {
  try {
    const response = await fetch(`https://movieapi.xcasper.space/api/live`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch live matches" });
  }
});

app.get("/api/proxy/user/vip", async (req, res) => {
  const { domain } = req.query;
  try {
    const params = new URLSearchParams();
    if (domain) params.set('domain', String(domain));
    const response = await fetch(`https://api.onspace.ai/api/user/getvipbydomain${params.toString() ? `?${params.toString()}` : ''}`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch VIP status" });
  }
});

// Stream info proxy or direct
app.get("/api/proxy/play", async (req, res) => {
  const { subjectId, se, ep } = req.query;
  try {
    const query = streamQuery({ subjectId, se, ep });
    const response = await fetch(`https://movieapi.xcasper.space/api/play?${query}`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch stream data" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

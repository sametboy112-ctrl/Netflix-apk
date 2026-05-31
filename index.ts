export interface MovieCover {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  blurHash: string;
}

export interface Subject {
  subjectId: string;
  subjectType: number;
  title: string;
  description: string;
  releaseDate: string;
  duration: number;
  genre: string;
  cover: MovieCover;
  countryName: string;
  imdbRatingValue: string;
  subtitles?: string;
  cast?: { staffId: string; name: string; role?: string; avatar?: string }[];
}

export interface PaginationData<T> { subjectList: T[]; }
export interface ApiResponse<T> { code: number; success: boolean; data: T; }
export interface HomeData { platformList: { name: string; uploadBy: string }[]; }

export interface StreamData {
  matchList?: { id: string; playPath: string; team1: any; team2: any; league: string }[];
}

export interface AnimeSubject { title: string; image: string; url: string; type?: string; year?: string; }

export interface AnimeDetail {
  title: string;
  image: string;
  synopsis: string;
  genres: string[];
  status: string;
  episodes: AnimeEpisode[];
}

export interface AnimeEpisode { number: string; url: string; }
export interface AnimeDownload { server: string; url: string; }

export interface UserPreferences {
  theme: string;
  autoplay: boolean;
  watchStatus?: 'Not Started' | 'Watching' | 'Completed' | 'Dropped' | 'Plan to Watch';
  personalRating?: number;
  rewatchCounter?: number;
  privateNotes?: string;
  spoilerToggle?: boolean;
  customLists?: string[];
  reminderNigeria?: boolean;
  moodTags?: string[];
  runtimeLeft?: string;
  relatedJournal?: string;
  watchPartyEnabled?: boolean;
  parentalWarnings?: boolean;
  castFollow?: string[];
  offlineMode?: boolean;
  spoilerFreeMode?: boolean;
  publicProfile?: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  setupComplete?: boolean;
  watchHistory: { subjectId: string; title: string; coverUrl: string; subjectType: number; timestamp: string }[];
  socialLinks: { platform: string; url: string }[];
  preferences: UserPreferences;
}

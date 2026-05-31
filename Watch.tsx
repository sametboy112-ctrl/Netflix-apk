import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Hls from 'hls.js';
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, Maximize, Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { movieService } from '@/services/api';
import { cn } from '@/lib/utils';
import { Subject } from '@/types';

export function Watch() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const episode = searchParams.get('ep');
  const subtitle = searchParams.get('sub') || 'English';
  const playUrlFromQuery = searchParams.get('playUrl') ? decodeURIComponent(searchParams.get('playUrl') as string) : '';
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [movie, setMovie] = useState<Subject | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [seekNotice, setSeekNotice] = useState<{ type: 'forward' | 'backward', show: boolean }>({ type: 'forward', show: false });
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [streamUrl, setStreamUrl] = useState('');
  const [streamMeta, setStreamMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const qualityOptions = (Array.isArray(streamMeta?.streams)
    ? streamMeta.streams.map((s: any) => `${s?.resolutions}p`)
    : ['1080p', '720p', '480p', '360p']).filter(Boolean);

  useEffect(() => {
    const getStreamAndMetadata = async () => {
      try {
        const meta = await movieService.getDetail(id!);
        const playData = await movieService.getPlayOptions(
          id!,
          meta?.subjectType === 2 ? 1 : 0,
          Number(episode || '1')
        );
        setMovie(meta);
        setStreamMeta(playData);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    getStreamAndMetadata();
  }, [id, episode, playUrlFromQuery]);

  useEffect(() => {
    const loadStream = async () => {
      if (!id) return;
      try {
        const res = await movieService.stream({
          subjectId: id,
          se: movie?.subjectType === 2 ? 1 : 0,
          ep: movie?.subjectType === 2 ? Number(episode || '1') : 0,
          resolution: selectedQuality.replace('p', ''),
          lang: subtitle,
        });
        const url = res?.proxyUrl || res?.downloadUrl;
        if (url) {
          setStreamUrl(url);
          return;
        }
      } catch (e) {
        console.warn('stream endpoint fallback', e);
      }
      const epIndex = Math.max(0, Number(episode || '1') - 1);
      const streamByQuality = Array.isArray(streamMeta?.streams)
        ? streamMeta.streams.find((s: any) => String(s?.resolutions) === selectedQuality.replace('p', ''))
        : null;
      const candidates = [
        streamByQuality?.proxyUrl,
        streamByQuality?.downloadUrl,
        playUrlFromQuery,
        streamMeta?.matchList?.[epIndex]?.proxyUrl,
        streamMeta?.matchList?.[epIndex]?.playPath,
        streamMeta?.proxyUrl,
        streamMeta?.playPath,
        streamMeta?.data?.playPath,
        streamMeta?.matchList?.[0]?.playPath,
      ].filter(Boolean);
      setStreamUrl(candidates[0] || '');
    };
    loadStream();
  }, [id, movie?.subjectType, episode, selectedQuality, subtitle, streamMeta, playUrlFromQuery]);

  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;

    const video = videoRef.current;
    video.autoplay = true;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(console.error);
        setIsPlaying(true);
      });
      return () => hls.destroy();
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      const handleLoadedMetadata = () => {
        video.play().catch(console.error);
        setIsPlaying(true);
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [streamUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      setProgress((video.currentTime / video.duration) * 100);
      setShowSkipIntro(video.currentTime >= 5 && video.currentTime <= 90);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const performSeek = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !videoRef.current) return false;

    const x = clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      showSeekNotice('backward');
      return true;
    }

    if (x > (width * 2) / 3) {
      videoRef.current.currentTime = Math.min((videoRef.current.duration || Infinity), videoRef.current.currentTime + 10);
      showSeekNotice('forward');
      return true;
    }

    return false;
  };

  const handleTap = (clientX: number) => {
    const now = Date.now();
    const gap = now - lastTapTime;

    if (gap < 300) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      performSeek(clientX);
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        togglePlay();
        tapTimeoutRef.current = null;
      }, 280);
    }

    setLastTapTime(now);
  };

  const showSeekNotice = (type: 'forward' | 'backward') => {
    setSeekNotice({ type, show: true });
    setTimeout(() => setSeekNotice({ type, show: false }), 500);
  };

  const skipIntro = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min((videoRef.current.duration || Infinity), videoRef.current.currentTime + 85);
      setShowSkipIntro(false);
    }
  };


  const handleDownload = () => {
    const url = streamMeta?.streams?.find((s: any) => `${s?.resolutions}p` === selectedQuality)?.downloadUrl || streamMeta?.downloadUrl || '';
    if (!url) return;
    const payload = JSON.parse(localStorage.getItem('flixvzn_downloads') || '[]');
    payload.unshift({ id: id, title: movie?.title || 'Unknown', quality: selectedQuality, timestamp: new Date().toISOString(), user: localStorage.getItem('flixvzn_session') || '' });
    localStorage.setItem('flixvzn_downloads', JSON.stringify(payload.slice(0, 200)));
    window.open(url, '_blank');
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[100] group overflow-hidden"
      onMouseMove={handleMouseMove}
      onClick={(e) => handleTap(e.clientX)}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (touch) handleTap(touch.clientX);
      }}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <video ref={videoRef} className="w-full h-full" />

      <div className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-500 bg-gradient-to-t from-black/80 via-transparent to-black/40 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20 rounded-full w-12 h-12"
            >
              <ArrowLeft className="w-8 h-8" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{movie?.title || 'Loading content...'}</h1>
              <p className="text-sm text-gray-400 font-medium">
                {movie?.subjectType === 2 ? `Season 1 • Episode ${episode || '1'}` : 'Movie'} • {selectedQuality} • {subtitle} subtitles
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Button variant="ghost" size="icon" onClick={handleDownload} className="text-white hover:bg-white/20 rounded-full">
              <Download className="w-5 h-5" />
            </Button>
            {qualityOptions.map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuality(q)}
                className={cn(
                  "px-3 py-1 rounded text-[10px] font-bold border transition-all",
                  selectedQuality === q ? "bg-red-600 border-red-600 text-white" : "bg-black/40 border-white/20 text-gray-400 hover:border-white/40"
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center">
          {seekNotice.show && (
            <div className={cn(
              "flex flex-col items-center justify-center bg-black/40 w-32 h-32 rounded-full backdrop-blur-md animate-in fade-in zoom-in duration-300",
              seekNotice.type === 'forward' ? "mr-[-50%]" : "ml-[-50%]"
            )}>
              <RotateCcw className={cn("w-10 h-10", seekNotice.type === 'forward' && "scale-x-[-1]")} />
              <span className="text-xl font-black mt-2">10s</span>
            </div>
          )}

          {showSkipIntro && (
            <button
              onClick={(e) => { e.stopPropagation(); skipIntro(); }}
              className="absolute bottom-10 right-10 flex items-center gap-3 bg-black/60 hover:bg-black/80 border border-white/20 px-8 py-3 rounded-xl backdrop-blur-md transition-all"
            >
              <span className="text-lg font-bold tracking-tight">SKIP INTRO</span>
            </button>
          )}
        </div>

        <div className="p-8 space-y-6">
          <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 bg-red-600" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button onClick={togglePlay} className="hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
              </button>
              <button onClick={() => videoRef.current && (videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10))}>
                <RotateCcw className="w-7 h-7" />
              </button>
              <div className="flex items-center gap-3">
                <Volume2 className="w-7 h-7" />
                <div className="w-24 overflow-hidden">
                  <Slider
                    value={[volume * 100]}
                    onValueChange={(vals) => {
                      const v = vals[0];
                      setVolume(v / 100);
                      if (videoRef.current) videoRef.current.volume = v / 100;
                    }}
                    max={100}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <button><Settings className="w-7 h-7" /></button>
              <button onClick={toggleFullscreen}><Maximize className="w-7 h-7" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  Presentation,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RefreshCw,
  Folder,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  FastForward,
  Rewind,
  SlidersHorizontal,
} from "lucide-react";
import type { DriveMediaItem } from "@/types/screensaver";
import {
  DEFAULT_DRIVE_FOLDER_ID,
  fetchGoogleDriveFolderMedia,
} from "@/services/googleDriveMediaService";
import { initAuth, googleSignIn, logout, getAccessToken } from "@/services/googleAuthService";
import type { User } from "firebase/auth";
import { cn } from "@/lib/utils";

interface DriveMediaPlayerProps {
  onActivity?: () => void;
  isScreensaverActive?: boolean;
}

export function DriveMediaPlayer({ onActivity }: DriveMediaPlayerProps) {
  const [items, setItems] = useState<DriveMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<"all" | "video" | "presentation">("all");
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Google Auth state
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Video player controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loopVideo, setLoopVideo] = useState(true);

  // Presentation player controls
  const [slideAutoAdvanceSeconds, setSlideAutoAdvanceSeconds] = useState(8);
  const [isSlideAutoPlaying, setIsSlideAutoPlaying] = useState(true);
  const [slideProgress, setSlideProgress] = useState(0);
  const [slideRefreshKey, setSlideRefreshKey] = useState(0);

  // Fullscreen state
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setHasToken(!!token);
        loadFolderFiles();
      },
      () => {
        setUser(null);
        setHasToken(false);
        loadFolderFiles();
      },
    );
    return () => unsubscribe();
  }, []);

  const loadFolderFiles = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await fetchGoogleDriveFolderMedia(DEFAULT_DRIVE_FOLDER_ID);
      setItems(res.items);
      if (res.error && !res.fromGoogleDrive) {
        setAuthError(res.error);
      }
    } catch (err) {
      console.error("Error fetching media:", err);
      setAuthError("שגיאה בטעינת מדיה מ-Google Drive");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    onActivity?.();
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setHasToken(true);
        await loadFolderFiles();
      }
    } catch (err: unknown) {
      console.error("Sign in failed:", err);
      setAuthError(err instanceof Error ? err.message : "ההתחברות ל-Google נכשלה");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    onActivity?.();
    await logout();
    setUser(null);
    setHasToken(false);
    await loadFolderFiles();
  };

  // Filtered media items based on tab
  const filteredItems = useMemo(() => {
    if (selectedType === "all") return items;
    return items.filter((i) => i.type === selectedType);
  }, [items, selectedType]);

  const currentItem: DriveMediaItem | undefined =
    filteredItems[activeItemIndex] || filteredItems[0] || items[0];

  // Video progress event handling
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onTimeUpdate = () => {
      setVideoProgress(vid.currentTime);
      setVideoDuration(vid.duration || 0);
    };

    const onEnded = () => {
      if (!loopVideo && filteredItems.length > 1) {
        // Advance to next video
        setActiveItemIndex((prev) => (prev + 1) % filteredItems.length);
      }
    };

    vid.addEventListener("timeupdate", onTimeUpdate);
    vid.addEventListener("ended", onEnded);

    return () => {
      vid.removeEventListener("timeupdate", onTimeUpdate);
      vid.removeEventListener("ended", onEnded);
    };
  }, [loopVideo, filteredItems.length]);

  // Handle Play/Pause
  const togglePlayPause = () => {
    onActivity?.();
    if (currentItem?.type === "video") {
      const vid = videoRef.current;
      if (vid) {
        if (vid.paused) {
          vid.play().catch(console.warn);
          setIsVideoPlaying(true);
        } else {
          vid.pause();
          setIsVideoPlaying(false);
        }
      }
    } else {
      setIsSlideAutoPlaying((p) => !p);
    }
  };

  // Video seek
  const handleSeek = (seconds: number) => {
    onActivity?.();
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = Math.max(0, Math.min(vid.duration, vid.currentTime + seconds));
    }
  };

  // Video scrub bar change
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    onActivity?.();
    const val = parseFloat(e.target.value);
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = val;
      setVideoProgress(val);
    }
  };

  // Video playback speed
  const changeSpeed = (speed: number) => {
    onActivity?.();
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Slide auto-advance countdown
  useEffect(() => {
    if (currentItem?.type !== "presentation" || !isSlideAutoPlaying) {
      setSlideProgress(0);
      return;
    }

    const intervalMs = 100;
    const step = (intervalMs / (slideAutoAdvanceSeconds * 1000)) * 100;

    const timer = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) {
          setSlideRefreshKey((k) => k + 1);
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [currentItem?.type, isSlideAutoPlaying, slideAutoAdvanceSeconds]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    onActivity?.();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.warn);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.warn);
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full gap-4 max-w-7xl mx-auto select-none"
    >
      {/* TOP CONTROLS & DRIVE FOLDER TELEMETRY BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
            <Folder className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">תיקיית מדיה ומצגות מ-Google Drive</h3>
              <span className="rounded-md bg-blue-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-300 ring-1 ring-blue-500/30">
                {DEFAULT_DRIVE_FOLDER_ID}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              נגן סרטוני בטיחות והדרכה, מצגות תפעול ושקפים לוגיסטיים למסכי המוקד
            </p>
          </div>
        </div>

        {/* Right side: Auth state & filter selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-950/80 p-1 border border-slate-800">
            <button
              onClick={() => {
                onActivity?.();
                setSelectedType("all");
                setActiveItemIndex(0);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                selectedType === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white",
              )}
            >
              הכל ({items.length})
            </button>
            <button
              onClick={() => {
                onActivity?.();
                setSelectedType("video");
                setActiveItemIndex(0);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                selectedType === "video"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <Film className="size-3.5" />
              <span>סרטונים ({items.filter((i) => i.type === "video").length})</span>
            </button>
            <button
              onClick={() => {
                onActivity?.();
                setSelectedType("presentation");
                setActiveItemIndex(0);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                selectedType === "presentation"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <Presentation className="size-3.5" />
              <span>מצגות ({items.filter((i) => i.type === "presentation").length})</span>
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => {
              onActivity?.();
              loadFolderFiles();
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition disabled:opacity-50"
            title="רענן קבצים מתיקיית הדרייב"
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin text-blue-400")} />
            <span>רענן</span>
          </button>

          {/* Google Auth Status / Login Button */}
          {user ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-xs text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold max-w-[120px] truncate">
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleGoogleSignOut}
                className="text-slate-400 hover:text-rose-400 transition"
                title="התנתק מחשבון Google"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="flex items-center gap-2 rounded-xl bg-white text-slate-900 px-3.5 py-1.5 text-xs font-bold shadow hover:bg-slate-100 transition disabled:opacity-60"
            >
              <svg className="size-3.5" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isLoggingIn ? "מתחבר..." : "התחבר עם Google"}</span>
            </button>
          )}

          {/* Open folder in Google Drive */}
          <a
            href={`https://drive.google.com/drive/folders/${DEFAULT_DRIVE_FOLDER_ID}`}
            target="_blank"
            rel="noreferrer"
            className="grid size-9 place-items-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="פתח תיקייה ב-Google Drive בלשונית נפרדת"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>

      {/* Auth / Status Notice if using demo files */}
      {authError && !user && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-400 shrink-0" />
            <span>
              מוצגים סרטוני ומצגות הדרכה לוגיסטיים של ח. סבן. לחץ "התחבר עם Google" כדי לקרוא ישירות
              מתיקיית הדרייב.
            </span>
          </div>
          <button
            onClick={handleGoogleSignIn}
            className="text-amber-400 underline font-bold hover:text-amber-300"
          >
            התחבר כעת
          </button>
        </div>
      )}

      {/* MAIN MEDIA STAGE & INTERACTIVE PLAYER TOOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[480px]">
        {/* Main Stage (col-span-9) */}
        <div className="lg:col-span-9 flex flex-col rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative">
          {/* Active Item Title Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-5 py-3 z-10">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black",
                  currentItem?.type === "video"
                    ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30"
                    : "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30",
                )}
              >
                {currentItem?.type === "video" ? (
                  <>
                    <Film className="size-3.5" />
                    <span>נגן וידאו</span>
                  </>
                ) : (
                  <>
                    <Presentation className="size-3.5" />
                    <span>מצגת שקפים</span>
                  </>
                )}
              </span>
              <h2 className="text-base font-black text-white truncate max-w-lg">
                {currentItem?.name || "בחר פריט לצפייה"}
              </h2>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              {currentItem?.webViewLink && (
                <a
                  href={currentItem.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1.5"
                >
                  <ExternalLink className="size-3" />
                  <span>פתח מקור</span>
                </a>
              )}
              <button
                onClick={toggleFullscreen}
                className="grid size-8 place-items-center rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                title={isFullscreen ? "צא ממסך מלא" : "מסך מלא"}
              >
                {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
            </div>
          </div>

          {/* PLAYER DISPLAY CONTAINER */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[360px]">
            <AnimatePresence mode="wait">
              {currentItem?.type === "video" ? (
                // VIDEO PLAYER
                <motion.div
                  key={`video-${currentItem.id}`}
                  initial={{ opacity: 0, scale: 0.995 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.005 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-full w-full flex items-center justify-center"
                >
                  {currentItem.downloadUrl ? (
                    <video
                      ref={videoRef}
                      key={currentItem.id}
                      src={currentItem.downloadUrl}
                      autoPlay
                      loop={loopVideo}
                      muted={isMuted}
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    // Google Drive Preview Iframe
                    <iframe
                      src={currentItem.embedUrl}
                      title={currentItem.name}
                      className="h-full w-full border-0"
                      allow="autoplay; encrypted-media; fullscreen"
                    />
                  )}
                </motion.div>
              ) : currentItem?.type === "presentation" ? (
                // PRESENTATION PLAYER
                <motion.div
                  key={`pres-${currentItem.id}-${slideRefreshKey}`}
                  initial={{ opacity: 0, scale: 0.995 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.005 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-full w-full flex flex-col bg-slate-950"
                >
                  <iframe
                    key={`${currentItem.id}-${slideRefreshKey}`}
                    src={currentItem.embedUrl}
                    title={currentItem.name}
                    className="h-full w-full border-0 flex-1"
                    allow="fullscreen"
                  />

                  {/* Visual Auto-Advance Progress Bar for Presentation */}
                  {isSlideAutoPlaying && (
                    <div className="h-1.5 w-full bg-slate-800 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                        style={{ width: `${slideProgress}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center p-8 text-slate-400"
                >
                  <Folder className="size-12 mx-auto mb-3 text-slate-600" />
                  <p>אנא בחר קובץ להצגה</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* DEDICATED PLAYER TOOLS TOOLBAR */}
          <div className="border-t border-slate-800 bg-slate-900/95 p-4 z-10">
            {currentItem?.type === "video" ? (
              // Video Controls Toolbar
              <div className="space-y-3">
                {/* Scrub Progress Bar */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-400 w-12 text-left tabular-nums">
                    {formatTime(videoProgress)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 100}
                    value={videoProgress}
                    onChange={handleScrub}
                    className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="font-mono text-xs text-slate-400 w-12 text-right tabular-nums">
                    {formatTime(videoDuration)}
                  </span>
                </div>

                {/* Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSeek(-10)}
                      className="grid size-9 place-items-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                      title="10 שניות אחורה"
                    >
                      <Rewind className="size-4" />
                    </button>

                    <button
                      onClick={togglePlayPause}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-500 transition shadow-md shadow-blue-600/30"
                    >
                      {isVideoPlaying ? (
                        <>
                          <Pause className="size-4 fill-white" />
                          <span>השהה</span>
                        </>
                      ) : (
                        <>
                          <Play className="size-4 fill-white" />
                          <span>הפעל</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSeek(10)}
                      className="grid size-9 place-items-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                      title="10 שניות קדימה"
                    >
                      <FastForward className="size-4" />
                    </button>

                    <button
                      onClick={() => {
                        onActivity?.();
                        const vid = videoRef.current;
                        if (vid) {
                          vid.currentTime = 0;
                          setVideoProgress(0);
                        }
                      }}
                      className="grid size-9 place-items-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                      title="התחל מחדש"
                    >
                      <RotateCcw className="size-4" />
                    </button>
                  </div>

                  {/* Right side: Volume, Speed, Loop */}
                  <div className="flex items-center gap-3">
                    {/* Speed Selector */}
                    <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-1">
                      {[0.75, 1, 1.25, 1.5].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => changeSpeed(speed)}
                          className={cn(
                            "rounded px-2 py-0.5 text-[11px] font-bold transition",
                            playbackSpeed === speed
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:text-white",
                          )}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>

                    {/* Loop Toggle */}
                    <button
                      onClick={() => {
                        onActivity?.();
                        setLoopVideo((l) => !l);
                      }}
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ring-1",
                        loopVideo
                          ? "bg-blue-600/20 text-blue-300 ring-blue-500/40"
                          : "bg-slate-800 text-slate-400 ring-slate-700 hover:text-white",
                      )}
                      title="נגן בלופ חוזר"
                    >
                      <span>לופ</span>
                    </button>

                    {/* Mute Toggle */}
                    <button
                      onClick={() => {
                        onActivity?.();
                        setIsMuted((m) => !m);
                      }}
                      className="grid size-9 place-items-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                      title={isMuted ? "בטל השתקה" : "השתק"}
                    >
                      {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Presentation Controls Toolbar
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-500 transition shadow-md shadow-amber-600/30"
                  >
                    {isSlideAutoPlaying ? (
                      <>
                        <Pause className="size-4 fill-white" />
                        <span>השהה מעבר אוטומטי</span>
                      </>
                    ) : (
                      <>
                        <Play className="size-4 fill-white" />
                        <span>הפעל מעבר שקפים</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onActivity?.();
                      setSlideRefreshKey((k) => k + 1);
                      setSlideProgress(0);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
                    title="טען מחדש את השקופיות"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>רענן שקופית</span>
                  </button>
                </div>

                {/* Slides Auto-advance speed buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Clock className="size-3.5 text-amber-400" />
                    <span>מהירות מעבר:</span>
                  </span>
                  <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-1">
                    {[5, 8, 15, 30].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => {
                          onActivity?.();
                          setSlideAutoAdvanceSeconds(sec);
                          setSlideProgress(0);
                        }}
                        className={cn(
                          "rounded px-2.5 py-1 text-xs font-bold transition",
                          slideAutoAdvanceSeconds === sec
                            ? "bg-amber-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white",
                        )}
                      >
                        {sec} שניות
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Playlists & Media Items Selector Column (col-span-3) */}
        <div className="lg:col-span-3 flex flex-col rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2 text-white font-black text-sm">
              <Layers className="size-4 text-blue-400" />
              <span>רשימת מדיה בתיקייה</span>
            </div>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300 font-mono">
              {filteredItems.length}
            </span>
          </div>

          {/* Items list */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[520px] pr-1">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                לא נמצאו קבצים מסוג זה בתיקייה
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isActive = item.id === currentItem?.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onActivity?.();
                      setActiveItemIndex(idx);
                      setIsVideoPlaying(true);
                      setVideoProgress(0);
                      setSlideProgress(0);
                    }}
                    className={cn(
                      "w-full text-right p-3 rounded-2xl border transition flex items-start gap-3 group relative",
                      isActive
                        ? "bg-blue-600/20 border-blue-500/50 shadow-md ring-1 ring-blue-500/30"
                        : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700",
                    )}
                  >
                    {/* Thumbnail / Icon preview */}
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                      {item.thumbnailLink ? (
                        <img
                          src={item.thumbnailLink}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : item.type === "video" ? (
                        <Film className="size-6 text-purple-400" />
                      ) : (
                        <Presentation className="size-6 text-amber-400" />
                      )}

                      {/* Mini type indicator pill */}
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[9px] font-mono font-bold text-white">
                        {item.type === "video" ? "וידאו" : "שקפים"}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isActive && <CheckCircle2 className="size-3.5 text-blue-400 shrink-0" />}
                        <h4
                          className={cn(
                            "text-xs font-bold truncate",
                            isActive ? "text-white" : "text-slate-300 group-hover:text-white",
                          )}
                        >
                          {item.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        {item.durationSeconds && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="size-3" />
                            <span>{formatTime(item.durationSeconds)}</span>
                          </span>
                        )}
                        <span>•</span>
                        <span>{item.type === "video" ? "סרטון HD" : "מצגת Google"}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick instructions footer */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Sparkles className="size-3.5 text-blue-400" />
              <span>שומר מסך אינטראקטיבי</span>
            </div>
            <p className="leading-relaxed">
              הנגן פועל אוטומטית בעת מעבר למצב מדיה. ניתן להוסיף סרטונים ומצגות ישירות לתיקייה
              בדרייב והם יופיעו כאן.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ExternalLink,
  Disc3,
  Check,
  Radio,
  Volume2,
  Volume1,
  VolumeX,
} from 'lucide-react';
import { MUSIC_PROVIDERS } from '../services/configDefaults';

export default function MusicView({
  musicState,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onLaunchMinimized,
  onLockLaunch,
  masterVolume = 50,
  onVolumeChange,
}) {
  const [isLaunching, setIsLaunching] = useState(false);
  const [trackTransition, setTrackTransition] = useState(null); // 'next' | 'prev' | null
  const [rippleKey, setRippleKey] = useState(0);
  const [prevVolBeforeMute, setPrevVolBeforeMute] = useState(50);
  const sliderRef = useRef(null);

  const handleNext = (e) => {
    e?.stopPropagation();
    setTrackTransition('next');
    setRippleKey((k) => k + 1);
    onNextTrack?.();
    setTimeout(() => setTrackTransition(null), 250);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setTrackTransition('prev');
    setRippleKey((k) => k + 1);
    onPrevTrack?.();
    setTimeout(() => setTrackTransition(null), 250);
  };

  const activeProvider =
    MUSIC_PROVIDERS.find((p) => p.id === musicState.provider) || MUSIC_PROVIDERS[0];
  const isPlaying = musicState.isPlaying;

  const handleLaunchClick = async (e) => {
    e?.stopPropagation();
    onLockLaunch?.();
    setIsLaunching(true);
    await onLaunchMinimized(activeProvider.id);
    setTimeout(() => setIsLaunching(false), 2000);
  };

  const handlePlayPauseClick = async (e) => {
    e?.stopPropagation();
    if (isPlaying) {
      await onTogglePlay();
      return;
    }

    let isRunning = false;
    if (window.electronAPI && window.electronAPI.isMusicRunning) {
      isRunning = await window.electronAPI.isMusicRunning(activeProvider.id);
    }

    if (isRunning) {
      await onTogglePlay();
    } else {
      onLockLaunch?.();
      await onLaunchMinimized(activeProvider.id);
    }
  };

  const updateVolumeFromEvent = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const newVol = Math.round((x / rect.width) * 100);
    onVolumeChange?.(newVol);
  };

  const handleSliderMouseDown = (e) => {
    e.preventDefault();
    updateVolumeFromEvent(e);

    const onMouseMove = (moveEvent) => {
      updateVolumeFromEvent(moveEvent);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleMuteToggle = (e) => {
    e.stopPropagation();
    if (masterVolume > 0) {
      setPrevVolBeforeMute(masterVolume);
      onVolumeChange?.(0);
    } else {
      onVolumeChange?.(prevVolBeforeMute || 50);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between py-1 text-white select-none">
      {/* Active Service Badge */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: activeProvider.color,
              boxShadow: `0 0 10px ${activeProvider.color}`,
            }}
          />
          <span className="text-xs font-semibold tracking-tight text-white/90">
            {activeProvider.name}
          </span>
        </div>

        <button
          onClick={handleLaunchClick}
          className="text-[11px] text-white/40 hover:text-white transition-colors flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-white/5"
          title={`Démarrer ${activeProvider.name} minimisé en barre des tâches`}
        >
          {isLaunching ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300">Lancé en tâche de fond</span>
            </>
          ) : (
            <>
              <Radio className="w-3 h-3" />
              <span>Démarrer l'app</span>
            </>
          )}
        </button>
      </div>

      {/* Track Visual Card */}
      <div className="relative flex-1 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] my-0.5 overflow-hidden">
        {/* Directional Color Ripple Effect */}
        {trackTransition && (
          <div
            key={`ripple-${rippleKey}`}
            className={`absolute inset-0 pointer-events-none ${
              trackTransition === 'next' ? 'animate-ripple-next' : 'animate-ripple-prev'
            }`}
            style={{
              background: `linear-gradient(${
                trackTransition === 'next' ? '90deg' : '270deg'
              }, transparent, ${activeProvider.color}45, transparent)`,
            }}
          />
        )}

        {/* Content container with track slide */}
        <div
          key={`content-${rippleKey}`}
          className={`flex items-center justify-between w-full ${
            trackTransition === 'next'
              ? 'animate-track-next'
              : trackTransition === 'prev'
              ? 'animate-track-prev'
              : ''
          }`}
        >
          {/* Vinyl disc */}
          <div className="relative flex items-center justify-center">
            <div
              className={`w-13 h-13 rounded-2xl flex items-center justify-center border border-white/10 transition-all ${
                isPlaying ? 'animate-pulse' : ''
              }`}
              style={{
                backgroundColor: `${activeProvider.color}18`,
                boxShadow: isPlaying ? `0 0 24px ${activeProvider.glow}` : 'none',
              }}
            >
              <Disc3
                className={`w-7 h-7 transition-all ${
                  isPlaying ? 'animate-spin' : 'text-white/40'
                }`}
                style={{
                  color: isPlaying ? activeProvider.color : undefined,
                  animationDuration: '5s',
                }}
              />
            </div>

            {isPlaying && (
              <div className="absolute -bottom-1 -right-1 flex items-end gap-0.5 px-1.5 py-0.5 rounded-md bg-black/80 border border-white/10">
                <span className="w-0.5 bg-emerald-400 rounded-full animate-wave-1" />
                <span className="w-0.5 bg-emerald-400 rounded-full animate-wave-2" />
                <span className="w-0.5 bg-emerald-400 rounded-full animate-wave-3" />
              </div>
            )}
          </div>

          {/* Real Track Title and Artist */}
          <div className="flex-1 px-4 min-w-0">
            <div
              className="text-xs font-semibold text-white truncate"
              title={musicState.trackTitle || activeProvider.name}
            >
              {musicState.trackTitle || activeProvider.name}
            </div>
            <div
              className="text-[11px] text-white/60 truncate mt-0.5"
              title={musicState.artist || (isPlaying ? 'Lecture audio active' : 'En pause / Prêt')}
            >
              {musicState.artist ? musicState.artist : (isPlaying ? 'Lecture audio active' : 'En pause / Prêt')}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/60 font-mono"
                style={{ borderLeft: `2px solid ${activeProvider.color}` }}
              >
                {activeProvider.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphic Master Volume Slider */}
      <div className="flex items-center gap-2.5 px-3 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06] my-1">
        <button
          onClick={handleMuteToggle}
          className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          title={masterVolume === 0 ? "Activer le son" : "Couper le son"}
        >
          {masterVolume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-red-400" />
          ) : masterVolume < 40 ? (
            <Volume1 className="w-3.5 h-3.5 text-white/70" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-white/70" />
          )}
        </button>

        {/* Volume Track Bar with Mouse Dragging */}
        <div
          ref={sliderRef}
          onMouseDown={handleSliderMouseDown}
          className="relative flex-1 h-2 rounded-full bg-white/10 hover:bg-white/15 cursor-pointer overflow-hidden group transition-all"
        >
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-75"
            style={{
              width: `${masterVolume}%`,
              backgroundColor: activeProvider.color || '#0078d4',
              boxShadow: `0 0 10px ${activeProvider.color || '#0078d4'}80`,
            }}
          />
        </div>

        <span className="text-[10px] font-mono text-white/50 w-7 text-right tabular-nums">
          {masterVolume}%
        </span>
      </div>

      {/* Playback Controls (Prev, Play/Pause, Next) */}
      <div className="flex items-center justify-center gap-6 mt-1">
        <button
          onClick={handlePrev}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all active:scale-85 active:bg-white/20"
          title="Titre précédent (Skip back)"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={handlePlayPauseClick}
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg"
          style={{
            backgroundColor: activeProvider.color,
            boxShadow: `0 4px 20px ${activeProvider.glow}`,
          }}
          title={isPlaying ? 'Mettre en pause' : `Lancer la musique (${activeProvider.name})`}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-black fill-black" />
          ) : (
            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
          )}
        </button>

        <button
          onClick={handleNext}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all active:scale-85 active:bg-white/20"
          title="Titre suivant (Skip next)"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Volume2, Volume1, VolumeX, Timer } from 'lucide-react';

function getNowTime() {
  const now = new Date();
  return {
    hours: String(now.getHours()).padStart(2, '0'),
    minutes: String(now.getMinutes()).padStart(2, '0'),
    seconds: String(now.getSeconds()).padStart(2, '0'),
    date: now.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
    }),
  };
}

function getVolumeIndicatorStyle(volume) {
  const vol = Math.max(0, Math.min(100, typeof volume === 'number' ? volume : 50));
  const channel = Math.round(60 + (255 - 60) * (vol / 100));
  const glow = vol > 30 ? (0.6 * ((vol - 30) / 70)).toFixed(2) : 0;
  const blur = vol > 30 ? Math.round(5 * ((vol - 30) / 70)) : 0;

  return {
    backgroundColor: `rgb(${channel}, ${channel}, ${channel})`,
    boxShadow: blur > 0 ? `0 0 ${blur}px rgba(255, 255, 255, ${glow})` : 'none',
  };
}

function formatMinSec(ms = 0) {
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Unified Pill Component
 * Features:
 * - Dynamic Title & Artist on hover when music is active
 * - Smooth Volume Scroll HUD with moving wave animation if sound is playing
 * - Mini Chrono badge on the right when stopwatch is active
 * - Clock and visualizer status
 */
export default function UnifiedPill({
  isHovered,
  accentColor,
  isAttached,
  musicState,
  isRecording,
  masterVolume = 50,
  isVolumeHudActive = false,
  stopwatchState,
  onClick,
}) {
  const [time, setTime] = useState(getNowTime);

  useEffect(() => {
    const updateTime = () => {
      setTime(getNowTime());
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isPlaying = musicState?.isPlaying;
  const hasTrackInfo = musicState?.trackTitle && musicState.trackTitle !== 'Amazon Music' && musicState.trackTitle !== 'Musique en cours';
  const trackLabel = musicState?.artist
    ? `${musicState.artist} - ${musicState.trackTitle}`
    : (musicState?.trackTitle || time.date);

  // Dedicated Full-width Volume HUD Mode (Apple Dynamic Island style, accentColor themed)
  if (isVolumeHudActive) {
    return (
      <div
        onClick={onClick}
        className={`relative w-full h-full flex items-center justify-between select-none cursor-pointer overflow-hidden active:scale-[0.98] transition-transform duration-100 ${
          isAttached ? 'px-3 pt-0.5 pb-1' : 'px-3 py-1'
        }`}
      >
        <div className="w-full h-full flex items-center justify-between gap-2.5 z-20 animate-in fade-in duration-150">
          {/* Speaker Icon with accent tint and subtle glow */}
          <div
            className="shrink-0 flex items-center justify-center transition-colors duration-150"
            style={{ color: masterVolume === 0 ? '#f87171' : accentColor || '#0078d4' }}
          >
            {masterVolume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.5)]" />
            ) : masterVolume < 45 ? (
              <Volume1
                className="w-3.5 h-3.5"
                style={{ filter: `drop-shadow(0 0 4px ${(accentColor || '#0078d4')}80)` }}
              />
            ) : (
              <Volume2
                className="w-3.5 h-3.5"
                style={{ filter: `drop-shadow(0 0 4px ${(accentColor || '#0078d4')}80)` }}
              />
            )}
          </div>

          {/* Volume Slider Capsule Track (Apple Dynamic Island style) */}
          <div className="flex-1 h-2 rounded-full bg-white/10 border border-white/10 overflow-hidden relative shadow-inner flex items-center">
            {/* Active Volume Fill Bar */}
            <div
              className={`h-full rounded-full transition-all duration-75 relative overflow-hidden ${
                isPlaying ? 'animate-wave-bar-active' : ''
              }`}
              style={{
                width: `${masterVolume}%`,
                backgroundColor: accentColor || '#0078d4',
                boxShadow: `0 0 10px ${(accentColor || '#0078d4')}80`,
              }}
            />
          </div>

          {/* Right side: Live Equalizer (if music is playing) + Volume Percentage Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isPlaying && (
              <div
                className="flex items-end gap-[1.5px] h-3 px-1 py-0.5 rounded-md bg-white/[0.06] border border-white/10"
                title="Son actif"
              >
                <span
                  className="w-[2px] rounded-full animate-wave-1"
                  style={{ backgroundColor: accentColor || '#0078d4' }}
                />
                <span
                  className="w-[2px] rounded-full animate-wave-2"
                  style={{ backgroundColor: accentColor || '#0078d4' }}
                />
                <span
                  className="w-[2px] rounded-full animate-wave-3"
                  style={{ backgroundColor: accentColor || '#0078d4' }}
                />
              </div>
            )}

            {/* Percentage Pill Badge */}
            <div
              className="px-1.5 py-0.5 rounded-full bg-white/[0.08] border border-white/15 shadow-sm min-w-[34px] flex items-center justify-center"
              style={{
                borderColor: masterVolume > 80 ? `${(accentColor || '#0078d4')}50` : 'rgba(255,255,255,0.15)',
              }}
            >
              <span className="text-[10.5px] font-mono font-semibold tabular-nums text-white/95 leading-none">
                {masterVolume}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full flex items-center justify-between select-none cursor-pointer overflow-hidden active:scale-[0.98] transition-transform duration-100 ${
        isAttached ? 'px-3 pt-0.5 pb-1' : 'px-3 py-1'
      }`}
    >
      {/* Left: Recording indicator OR Active Sound / Volume indicator OR Date / Track Info */}
      <div className="flex items-center gap-1.5 z-10 min-w-0 max-w-[130px]">
        {isRecording ? (
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0">
              <span
                className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-75"
                style={{ animationDuration: '2s' }}
              />
              <span className="absolute inset-0 rounded-full border border-red-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
            </div>

            <span
              className={`text-[10px] font-semibold text-red-400 overflow-hidden whitespace-nowrap transition-all duration-240 ease-out ${
                isHovered ? 'max-w-[40px] opacity-100' : 'max-w-0 opacity-0'
              }`}
            >
              REC
            </span>
          </div>
        ) : isPlaying ? (
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="w-2 h-2 rounded-full shrink-0 bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)] animate-pulse transition-all duration-300" />
            <span
              className={`text-[11px] font-medium text-white/80 whitespace-nowrap overflow-hidden text-ellipsis transition-all ease-out ${
                isHovered
                  ? 'max-w-[110px] opacity-100 translate-x-0 duration-200 delay-75'
                  : 'max-w-0 opacity-0 -translate-x-2 duration-140 delay-0'
              }`}
              title={trackLabel}
            >
              {hasTrackInfo ? trackLabel : time.date}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span
              className="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
              style={getVolumeIndicatorStyle(masterVolume)}
              title={`Volume système : ${masterVolume}%`}
            />
            <span
              className={`text-[11px] font-medium text-white/50 capitalize whitespace-nowrap overflow-hidden transition-all ease-out ${
                isHovered
                  ? 'max-w-[65px] opacity-100 translate-x-0 duration-200 delay-75'
                  : 'max-w-0 opacity-0 -translate-x-2 duration-140 delay-0'
              }`}
            >
              {time.date}
            </span>
          </div>
        )}
      </div>

      {/* Center: Rock-solid Centered Clock (shifted left smoothly if stopwatch active) */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 flex items-baseline gap-0.5 tracking-tight font-medium text-white/95 pointer-events-none z-10 transition-all duration-300 ease-out ${
          stopwatchState?.isActive && !isHovered
            ? 'left-[36%] -translate-x-1/2'
            : 'left-1/2 -translate-x-1/2'
        }`}
      >
        <span className="text-xs font-semibold tabular-nums">{time.hours}</span>
        <span className="text-xs font-light text-white/40">:</span>
        <span className="text-xs font-semibold tabular-nums">{time.minutes}</span>
      </div>

      {/* Right: Stopwatch Mini Chrono OR Music Visualizer Waveform OR Standby spacer circle */}
      <div className="flex items-center justify-end z-10 min-w-[14px]">
        {stopwatchState?.isActive ? (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/[0.08] border border-white/15 shadow-sm shrink-0"
            title={`Chronomètre en cours : ${formatMinSec(stopwatchState.elapsedTime)}`}
          >
            <Timer
              className={`w-3 h-3 ${!stopwatchState.isPaused ? 'animate-spin-slow' : 'opacity-50'}`}
              style={{
                color: accentColor || '#0078d4',
              }}
            />
            <span className="text-[10px] font-mono font-semibold tabular-nums text-white/95 leading-none">
              {formatMinSec(stopwatchState.elapsedTime)}
            </span>
          </div>
        ) : isPlaying ? (
          <div
            className="flex items-end gap-[2px] h-3.5 px-0.5"
            title="Lecture en cours"
          >
            <span
              className="w-[2.5px] rounded-full animate-wave-1"
              style={{ backgroundColor: accentColor || '#0078d4' }}
            />
            <span
              className="w-[2.5px] rounded-full animate-wave-2"
              style={{ backgroundColor: accentColor || '#0078d4' }}
            />
            <span
              className="w-[2.5px] rounded-full animate-wave-3"
              style={{ backgroundColor: accentColor || '#0078d4' }}
            />
            <span
              className="w-[2.5px] rounded-full animate-wave-4"
              style={{ backgroundColor: accentColor || '#0078d4' }}
            />
          </div>
        ) : (
          <div
            className="w-2 h-2 rounded-full shrink-0 transition-colors duration-300"
            style={{ backgroundColor: 'rgb(60, 60, 60)' }}
            title="En attente de lecture"
          />
        )}
      </div>
    </div>
  );
}

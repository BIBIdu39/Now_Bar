import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

function getNowHoverTime() {
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

/**
 * Vue au survol de la souris
 * Entièrement épurée sans bouton chevron de développement
 */
export default function HoverPill({
  accentColor,
  onClick,
  isAttached,
  musicState,
  isRecording,
}) {
  const [time, setTime] = useState(getNowHoverTime);

  useEffect(() => {
    const updateTime = () => {
      setTime(getNowHoverTime());
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isPlaying = musicState?.isPlaying;
  const providerColor = musicState?.providerColor || '#00a8e1';

  return (
    <div
      onClick={onClick}
      className={`w-full max-w-[235px] mx-auto h-full flex items-center justify-between px-3.5 select-none cursor-pointer group ${
        isAttached ? 'pt-0.5 pb-1' : 'py-1'
      }`}
    >
      {/* Left: Recording mic OR Accent dot + Date */}
      <div className="flex items-center gap-1.5 min-w-[70px]">
        {isRecording ? (
          <div className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-mic-glow" />
            <span className="text-[10px] font-semibold text-rose-400">REC</span>
          </div>
        ) : (
          <>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: accentColor || '#0078d4',
                boxShadow: `0 0 10px ${accentColor || '#0078d4'}`,
              }}
            />
            <span className="text-[11px] font-medium text-white/50 capitalize truncate max-w-[65px]">
              {time.date}
            </span>
          </>
        )}
      </div>

      {/* Center: Full Clock HH:mm:ss */}
      <div className="flex items-baseline gap-0.5 tracking-tight font-medium text-white">
        <span className="text-xs font-semibold tabular-nums">{time.hours}</span>
        <span className="text-xs font-light text-white/40 animate-pulse">:</span>
        <span className="text-xs font-semibold tabular-nums">{time.minutes}</span>
        <span className="text-[10px] font-mono text-white/50 tabular-nums ml-1">
          {time.seconds}
        </span>
      </div>

      {/* Right: Music equalizer waveform OR status dot (no expand chevron) */}
      <div className="flex items-center justify-end min-w-[32px]">
        {isPlaying ? (
          <div className="flex items-end gap-[2px] h-3.5 px-0.5" title="Lecture en cours">
            <span
              className="w-[2.5px] rounded-full animate-wave-1"
              style={{ backgroundColor: providerColor }}
            />
            <span
              className="w-[2.5px] rounded-full animate-wave-2"
              style={{ backgroundColor: providerColor }}
            />
            <span
              className="w-[2.5px] rounded-full animate-wave-3"
              style={{ backgroundColor: providerColor }}
            />
            <span
              className="w-[2.5px] rounded-full animate-wave-4"
              style={{ backgroundColor: providerColor }}
            />
          </div>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        )}
      </div>
    </div>
  );
}

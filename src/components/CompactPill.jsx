import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

function getNowTime() {
  const now = new Date();
  return {
    hours: String(now.getHours()).padStart(2, '0'),
    minutes: String(now.getMinutes()).padStart(2, '0'),
  };
}

/**
 * Vue compacte au repos (affiche l'heure en permanence même sans survol,
 * avec indicateurs animés pour la musique et l'enregistrement vocal)
 */
export default function CompactPill({
  accentColor,
  isAttached,
  musicState,
  isRecording,
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
  const providerColor = musicState?.providerColor || '#1ed760';

  return (
    <div
      className={`w-full max-w-[150px] mx-auto h-full flex items-center justify-between gap-2 select-none cursor-pointer ${
        isAttached ? 'px-3 pt-0.5 pb-1' : 'px-3.5 py-1'
      }`}
    >
      {/* Left: Recording mic OR Accent dot */}
      <div className="flex items-center gap-1.5">
        {isRecording ? (
          <div className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-mic-glow" />
            <Mic className="w-3 h-3 text-rose-400 animate-pulse" />
          </div>
        ) : (
          <span
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: accentColor || '#0078d4',
              boxShadow: `0 0 8px ${accentColor || '#0078d4'}80`,
            }}
          />
        )}
      </div>

      {/* Center: Clock HH:mm */}
      <div className="flex items-baseline gap-0.5 tracking-tight font-medium text-white/95">
        <span className="text-xs font-semibold tabular-nums">{time.hours}</span>
        <span className="text-xs font-light text-white/40 animate-pulse">:</span>
        <span className="text-xs font-semibold tabular-nums">{time.minutes}</span>
      </div>

      {/* Right: Music Visualizer Waveform OR subtle spacer */}
      <div className="flex items-center justify-end min-w-[14px]">
        {isPlaying ? (
          <div
            className="flex items-end gap-[2px] h-3.5 px-0.5"
            title="Lecture audio en cours"
          >
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
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
        )}
      </div>
    </div>
  );
}

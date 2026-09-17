import React from 'react';
import { Timer, Check, Play, Pause } from 'lucide-react';

/**
 * Vue compacte de la Dynamic Island lorsqu'un minuteur est en cours ou terminé
 */
export default function TimerPill({
  remainingSeconds,
  totalSeconds,
  isPaused,
  isFinished,
  accentColor,
  onClick
}) {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const h = Math.floor(m / 60);
    const remM = m % 60;

    if (h > 0) {
      return `${h}:${String(remM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(remM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 
    ? Math.max(0, Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100))
    : 0;

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full flex items-center justify-between px-3 py-1 cursor-pointer select-none active:scale-[0.98] transition-all duration-200 ${
        isFinished ? 'animate-chime-celebration' : ''
      }`}
      title={isFinished ? 'Minuteur terminé ! Cliquer pour arrêter' : 'Cliquer pour ouvrir le minuteur'}
    >
      {/* Icon */}
      <div className="flex items-center gap-1.5">
        {isFinished ? (
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
        ) : isPaused ? (
          <Pause className="w-3 h-3 text-amber-400 fill-amber-400/30" />
        ) : (
          <Timer
            className="w-3.5 h-3.5 transition-transform duration-500"
            style={{ color: accentColor || '#0078d4' }}
          />
        )}
      </div>

      {/* Countdown text */}
      <div className="flex items-center">
        {isFinished ? (
          <span className="text-xs font-semibold text-emerald-300 tracking-wide">
            Terminé !
          </span>
        ) : (
          <span className="text-xs font-mono font-medium tracking-tight text-white tabular-nums">
            {formatTime(remainingSeconds)}
          </span>
        )}
      </div>

      {/* Mini status indicator */}
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          isFinished 
            ? 'bg-emerald-400 animate-ping' 
            : isPaused 
            ? 'bg-amber-400' 
            : 'animate-pulse'
        }`}
        style={{
          backgroundColor: isFinished ? '#34d399' : isPaused ? '#fbbf24' : accentColor || '#0078d4',
          boxShadow: `0 0 8px ${accentColor || '#0078d4'}`
        }}
      />

      {/* Integrated sub-pixel bottom progress bar */}
      {!isFinished && totalSeconds > 0 && (
        <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-linear rounded-full"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: isPaused ? '#fbbf24' : accentColor || '#0078d4',
              boxShadow: `0 0 6px ${accentColor || '#0078d4'}`
            }}
          />
          {/* Laser sweep on start */}
          {progressPercent < 3 && !isPaused && (
            <div
              className="absolute inset-0 w-1/3 bg-white/90 rounded-full animate-laser-sweep pointer-events-none"
              style={{ boxShadow: '0 0 6px #fff' }}
            />
          )}
        </div>
      )}
    </div>
  );
}

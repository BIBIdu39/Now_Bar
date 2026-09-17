import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Plus, Check, Volume2, Bell } from 'lucide-react';

export default function TimerView({
  timerState,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onStopTimer,
  accentColor,
}) {
  const {
    isActive,
    isPaused,
    isFinished,
    remainingSeconds,
    totalSeconds,
  } = timerState;

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [justStarted, setJustStarted] = useState(false);

  const presets = [1, 5, 15, 25, 45];

  const triggerStartAnimation = () => {
    setJustStarted(true);
    setTimeout(() => setJustStarted(false), 750);
  };

  const handleStart = () => {
    const total = (hours * 3600) + (minutes * 60) + seconds;
    if (total > 0) {
      triggerStartAnimation();
      onStartTimer(total);
    }
  };

  const handleSelectPreset = (mins) => {
    setHours(0);
    setMinutes(mins);
    setSeconds(0);
    triggerStartAnimation();
    onStartTimer(mins * 60);
  };

  const addTime = (additionalSecs) => {
    if (isActive) {
      onStartTimer(remainingSeconds + additionalSecs);
    }
  };

  const formatDisplay = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 
    ? Math.max(0, Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100))
    : 0;

  return (
    <div className="flex flex-col items-center justify-between h-full w-full py-1 text-white">
      {/* Active or Finished State */}
      {isActive || isFinished ? (
        <div className="w-full flex flex-col items-center justify-center flex-1">
          {isFinished ? (
            <div className="flex flex-col items-center gap-2 py-2 animate-chime-celebration">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/20 border border-emerald-500/40"
                style={{ boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)' }}
              >
                <Check className="w-7 h-7 text-emerald-400 stroke-[2.5]" />
              </div>
              <span className="text-sm font-semibold tracking-wide text-emerald-300">
                Minuteur terminé !
              </span>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={onResetTimer}
                  className="px-4 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => onStartTimer(totalSeconds)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium transition-all shadow-md active:scale-95"
                  style={{
                    backgroundColor: accentColor || '#0078d4',
                    color: getContrastTextColor(accentColor),
                  }}
                >
                  Relancer
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Big remaining time with energy pulse */}
              <div className="relative py-2 flex flex-col items-center">
                {justStarted && (
                  <span
                    className="absolute inset-0 -m-2 rounded-full border-2 animate-ping pointer-events-none"
                    style={{
                      borderColor: accentColor || '#0078d4',
                      animationDuration: '0.65s',
                      animationIterationCount: 1,
                    }}
                  />
                )}
                <span
                  className={`text-3xl font-mono font-bold tracking-tight text-white/95 tabular-nums transition-transform duration-300 ${
                    justStarted ? 'scale-110' : 'scale-100'
                  }`}
                >
                  {formatDisplay(remainingSeconds)}
                </span>
                <span className="text-[11px] text-white/40 tracking-wider uppercase font-medium mt-0.5">
                  {isPaused ? 'En pause' : 'En cours'}
                </span>
              </div>

              {/* Progress bar with laser sweep on start */}
              <div className="relative w-48 h-1.5 bg-white/10 rounded-full overflow-hidden my-2">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-linear"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: isPaused ? '#fbbf24' : accentColor || '#0078d4',
                    boxShadow: `0 0 10px ${accentColor || '#0078d4'}`
                  }}
                />
                {justStarted && (
                  <div
                    className="absolute inset-0 w-1/3 bg-white/90 rounded-full animate-laser-sweep pointer-events-none"
                    style={{ boxShadow: '0 0 10px #fff' }}
                  />
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={onResetTimer}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  title="Réinitialiser"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {isPaused ? (
                  <button
                    onClick={onResumeTimer}
                    className="px-5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-white shadow-lg transition-transform active:scale-95"
                    style={{ backgroundColor: accentColor || '#0078d4' }}
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Reprendre</span>
                  </button>
                ) : (
                  <button
                    onClick={onPauseTimer}
                    className="px-5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/15 hover:bg-white/20 transition-transform active:scale-95"
                  >
                    <Pause className="w-3.5 h-3.5 fill-white/80" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={() => addTime(60)}
                  className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium flex items-center gap-0.5 transition-colors"
                  title="Ajouter 1 minute"
                >
                  <Plus className="w-3 h-3" />
                  <span>1m</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Configuration State (choose hours/minutes/seconds) */
        <div className="w-full flex flex-col items-center">
          {/* Quick presets pills */}
          <div className="flex items-center gap-1 mb-1.5">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => handleSelectPreset(p)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all border border-white/5"
              >
                {p}m
              </button>
            ))}
          </div>

          {/* Time Dial Inputs */}
          <div className="flex items-center justify-center gap-1.5 py-0.5">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                className="w-10 h-8 text-center text-base font-mono font-semibold bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-white/30"
              />
              <span className="text-[9px] text-white/40 mt-0.5 uppercase tracking-wider">h</span>
            </div>

            <span className="text-base font-mono text-white/30 -mt-2.5">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-10 h-8 text-center text-base font-mono font-semibold bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-white/30"
              />
              <span className="text-[9px] text-white/40 mt-0.5 uppercase tracking-wider">min</span>
            </div>

            <span className="text-base font-mono text-white/30 -mt-2.5">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-10 h-8 text-center text-base font-mono font-semibold bg-white/5 rounded-xl border border-white/10 text-white focus:outline-none focus:border-white/30"
              />
              <span className="text-[9px] text-white/40 mt-0.5 uppercase tracking-wider">s</span>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={hours === 0 && minutes === 0 && seconds === 0}
            className="w-full max-w-[180px] mt-2 py-1.5 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: accentColor || '#0078d4',
              color: getContrastTextColor(accentColor),
              boxShadow: `0 4px 16px ${accentColor || '#0078d4'}40`
            }}
          >
            <Play className="w-3.5 h-3.5" style={{ fill: getContrastTextColor(accentColor), color: getContrastTextColor(accentColor) }} />
            <span>Démarrer</span>
          </button>
        </div>
      )}
    </div>
  );
}

function getContrastTextColor(hexColor) {
  if (!hexColor) return '#ffffff';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#09090b' : '#ffffff';
}

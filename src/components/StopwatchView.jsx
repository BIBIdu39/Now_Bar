import React from 'react';
import { Play, Pause, RotateCcw, Flag, ChevronLeft } from 'lucide-react';

function formatStopwatchTime(ms = 0) {
  const totalSeconds = Math.floor(ms / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const csStr = String(centiseconds).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');

  if (hours > 0) {
    const hStr = String(hours);
    return {
      main: `${hStr}:${mStr}:${sStr}`,
      fraction: `.${csStr}`,
    };
  }

  return {
    main: `${mStr}:${sStr}`,
    fraction: `.${csStr}`,
  };
}

export default function StopwatchView({
  stopwatchState = {},
  onStartStopwatch,
  onPauseStopwatch,
  onResumeStopwatch,
  onResetStopwatch,
  onLapStopwatch,
  accentColor = '#0078d4',
  onBack,
}) {
  const {
    isActive = false,
    isPaused = false,
    elapsedTime = 0,
    laps = [],
  } = stopwatchState;

  const formatted = formatStopwatchTime(elapsedTime);

  const handlePrimaryClick = () => {
    if (!isActive) {
      onStartStopwatch?.();
    } else if (isPaused) {
      onResumeStopwatch?.();
    } else {
      onPauseStopwatch?.();
    }
  };

  const handleSecondaryClick = () => {
    if (isActive && !isPaused) {
      onLapStopwatch?.();
    } else {
      onResetStopwatch?.();
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between py-1 text-white select-none">
      {/* Header bar with Back button */}
      <div className="flex items-center justify-between pb-1 border-b border-white/[0.06] mb-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Retour aux applications</span>
        </button>
        <span className="text-[11px] font-semibold text-white/80">Chronomètre</span>
      </div>

      {/* Main Display */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[90px] py-1">
        {/* Digital display */}
        <div className="flex items-baseline justify-center tracking-tight tabular-nums font-mono">
          <span className="text-3xl font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            {formatted.main}
          </span>
          <span
            className="text-lg font-semibold ml-0.5"
            style={{ color: accentColor || '#0078d4' }}
          >
            {formatted.fraction}
          </span>
        </div>

        {/* Laps List (if any) */}
        {laps.length > 0 && (
          <div className="w-full max-h-[50px] overflow-y-auto no-scrollbar mt-1.5 px-3 py-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="flex flex-col gap-1 text-[10px] font-mono">
              {[...laps].reverse().map((lap, idx) => {
                const lapNum = laps.length - idx;
                const lapTimeFormatted = formatStopwatchTime(lap.lapTime);
                const totalFormatted = formatStopwatchTime(lap.totalTime);
                return (
                  <div
                    key={lapNum}
                    className="flex items-center justify-between py-0.5 border-b border-white/[0.04] last:border-b-0 text-white/70"
                  >
                    <span className="font-sans font-medium text-white/40">
                      Tour {lapNum}
                    </span>
                    <span className="text-white/60">
                      +{lapTimeFormatted.main}{lapTimeFormatted.fraction}
                    </span>
                    <span className="text-white font-medium">
                      {totalFormatted.main}{totalFormatted.fraction}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 pt-1.5 border-t border-white/[0.06]">
        {/* Reset or Lap button */}
        <button
          onClick={handleSecondaryClick}
          disabled={!isActive && elapsedTime === 0}
          className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
            !isActive && elapsedTime === 0
              ? 'opacity-30 border-white/10 text-white/30 cursor-not-allowed'
              : 'bg-white/10 hover:bg-white/20 border-white/15 text-white shadow-sm'
          }`}
          title={isActive && !isPaused ? 'Marquer un tour (Lap)' : 'Réinitialiser le chronomètre'}
        >
          {isActive && !isPaused ? (
            <>
              <Flag className="w-3.5 h-3.5 text-sky-400" />
              <span>Tour</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-white/60" />
              <span>Réinitialiser</span>
            </>
          )}
        </button>

        {/* Start / Pause / Resume button */}
        <button
          onClick={handlePrimaryClick}
          className="flex items-center justify-center gap-1.5 px-6 py-1.5 rounded-full text-xs font-semibold shadow-lg transition-all active:scale-95"
          style={{
            backgroundColor: isActive && !isPaused ? '#eab308' : (accentColor || '#0078d4'),
            color: '#09090b',
            boxShadow: `0 2px 14px ${isActive && !isPaused ? 'rgba(234, 179, 8, 0.4)' : `${accentColor || '#0078d4'}60`}`,
          }}
          title={
            !isActive
              ? 'Démarrer le chronomètre'
              : isPaused
              ? 'Reprendre'
              : 'Mettre en pause'
          }
        >
          {isActive && !isPaused ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-black text-black" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />
              <span>{isPaused ? 'Reprendre' : 'Démarrer'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

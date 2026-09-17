import React, { useState, useEffect, useRef } from 'react';
import UnifiedPill from './UnifiedPill';
import TimerPill from './TimerPill';
import ExpandedCard from './ExpandedCard';
import { audioService } from '../services/audioService';
import { voiceRecorderService } from '../services/voiceRecorderService';

const PROVIDER_COLORS = {
  amazon: '#00a8e1',
  spotify: '#1ed760',
  deezer: '#a238ff',
  apple: '#fa243c',
};

export default function DynamicIsland({ config, onOpenSettings }) {
  // State machine: 'COMPACT' | 'HOVER' | 'EXPANDED'
  const [islandState, setIslandState] = useState('COMPACT');
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [collapsingTarget, setCollapsingTarget] = useState(null);
  const [isSquishing, setIsSquishing] = useState(false);
  const [activeTab, setActiveTab] = useState('music'); // Musique par défaut
  const [recordingPrompt, setRecordingPrompt] = useState(null);

  // Display mode detection (internal laptop screen vs external monitor)
  const [displayInfo, setDisplayInfo] = useState({
    isInternal: false,
    isAttached: false,
    topOffset: 8,
  });

  const activeProviderId = config?.music?.defaultProvider || 'amazon';

  // Music state with real-time track and artist
  const [musicState, setMusicState] = useState({
    provider: activeProviderId,
    isPlaying: false,
    trackTitle: activeProviderId === 'amazon' ? 'Amazon Music' : 'Musique en cours',
    artist: '',
    providerColor: PROVIDER_COLORS[activeProviderId] || '#00a8e1',
  });

  // Keep music provider in sync when updated from Settings
  useEffect(() => {
    const prov = config?.music?.defaultProvider || 'amazon';
    setMusicState((prev) => ({
      ...prev,
      provider: prov,
      providerColor: PROVIDER_COLORS[prov] || '#00a8e1',
      trackTitle: prov === 'amazon' && !prev.artist ? 'Amazon Music' : prev.trackTitle,
    }));
  }, [config?.music?.defaultProvider]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);

  // Master system audio volume (0 - 100) & Volume Scroll HUD state
  const [masterVolume, setMasterVolume] = useState(50);
  const [isVolumeHudActive, setIsVolumeHudActive] = useState(false);
  const volumeHudTimeoutRef = useRef(null);

  // Timer engine state with absolute timestamps (resilient to sleep/lock)
  const [timerState, setTimerState] = useState({
    isActive: false,
    isPaused: false,
    isFinished: false,
    totalSeconds: 0,
    remainingSeconds: 0,
  });
  const targetEndTimeRef = useRef(null);

  // Stopwatch engine state with absolute timestamps (resilient to sleep/lock)
  const [stopwatchState, setStopwatchState] = useState({
    isActive: false,
    isPaused: false,
    elapsedTime: 0,
    laps: [],
  });
  const stopwatchStartTimeRef = useRef(null);
  const stopwatchAccumulatedRef = useRef(0);
  const stopwatchLastLapRef = useRef(0);
  const stopwatchIntervalRef = useRef(null);

  const mouseLeaveTimeoutRef = useRef(null);
  const collapseTimeoutRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const isLaunchLockedRef = useRef(false);
  const isMouseOverRef = useRef(false);

  // Fetch initial display info & subscribe to monitor changes
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.getDisplayInfo) {
      window.electronAPI.getDisplayInfo().then((info) => {
        if (info) setDisplayInfo(info);
      });
    }

    if (window.electronAPI && window.electronAPI.onDisplayInfoChanged) {
      const unsubscribe = window.electronAPI.onDisplayInfoChanged((info) => {
        if (info) setDisplayInfo(info);
      });
      return () => unsubscribe();
    }
  }, []);

  // Listen to auto-collapse on window blur (click outside anywhere on the PC)
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onAutoCollapse) {
      const unsubscribe = window.electronAPI.onAutoCollapse(() => {
        if (recordingPrompt) {
          return; // Ignore blur while save prompt is waiting for user choice
        }
        if (islandState === 'EXPANDED' || islandState === 'HOVER') {
          handleSmoothCollapse();
        }
      });
      return () => unsubscribe();
    }
  }, [islandState, timerState, recordingPrompt]);

  // Listen to music app exit
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onMusicAppClosed) {
      const unsubscribe = window.electronAPI.onMusicAppClosed((closedProvider) => {
        setMusicState((prev) => {
          const currentProv = prev.provider || activeProviderId;
          if (!closedProvider || closedProvider.toLowerCase() === currentProv.toLowerCase()) {
            return {
              ...prev,
              isPlaying: false,
            };
          }
          return prev;
        });
      });
      return () => unsubscribe();
    }
  }, [activeProviderId]);

  // Real-time dynamic track title & artist subscription
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onTrackInfoChanged) {
      const unsubscribe = window.electronAPI.onTrackInfoChanged((info) => {
        if (info && info.provider && info.provider !== 'none') {
          setMusicState((prev) => ({
            ...prev,
            trackTitle: info.title || prev.trackTitle,
            artist: info.artist || prev.artist,
          }));
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Query initial Windows audio playback status & subscribe to real-time audio state
  useEffect(() => {
    if (window.electronAPI?.isAudioPlaying) {
      window.electronAPI.isAudioPlaying().then((isPlaying) => {
        if (typeof isPlaying === 'boolean') {
          setMusicState((prev) => ({ ...prev, isPlaying }));
        }
      });
    }

    if (window.electronAPI?.onMusicPlaybackChanged) {
      const unsubscribe = window.electronAPI.onMusicPlaybackChanged((isPlaying) => {
        setMusicState((prev) => {
          if (prev.isPlaying !== isPlaying) {
            return {
              ...prev,
              isPlaying,
            };
          }
          return prev;
        });
      });
      return () => unsubscribe();
    }
  }, []);

  // Query initial Windows master audio volume & subscribe to real-time volume changes
  useEffect(() => {
    if (window.electronAPI?.getMasterVolume) {
      window.electronAPI.getMasterVolume().then((vol) => {
        if (typeof vol === 'number') {
          setMasterVolume(vol);
        }
      });
    }

    if (window.electronAPI?.onMasterVolumeChanged) {
      const unsubscribe = window.electronAPI.onMasterVolumeChanged((vol) => {
        if (typeof vol === 'number') {
          setMasterVolume(vol);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const isAttached = displayInfo.isAttached;

  // Adaptive dimensions based on attached vs floating bubble format
  const getDimensionsForState = (state) => {
    if (isAttached) {
      switch (state) {
        case 'HOVER':
          return { width: 235, height: 40 };
        case 'EXPANDED':
          return { width: 420, height: 260 };
        case 'TIMER_COMPACT':
          return { width: 165, height: 32 };
        case 'STOPWATCH_COMPACT':
          return { width: 172, height: 32 };
        case 'TIMER_FINISHED':
          return { width: 195, height: 40 };
        case 'COMPACT':
        default:
          return { width: 150, height: 32 };
      }
    } else {
      switch (state) {
        case 'HOVER':
          return { width: 235, height: 44 };
        case 'EXPANDED':
          return { width: 420, height: 260 };
        case 'TIMER_COMPACT':
          return { width: 165, height: 36 };
        case 'STOPWATCH_COMPACT':
          return { width: 172, height: 36 };
        case 'TIMER_FINISHED':
          return { width: 195, height: 44 };
        case 'COMPACT':
        default:
          return { width: 150, height: 36 };
      }
    }
  };

  const applyDimensions = (target) => {
    if (window.electronAPI && window.electronAPI.resizeIsland) {
      window.electronAPI.resizeIsland(target);
    }
  };

  const getCurrentState = () => {
    if (islandState === 'EXPANDED') return 'EXPANDED';
    if (isVolumeHudActive) return 'HOVER';
    if (timerState.isFinished) return 'TIMER_FINISHED';
    if (timerState.isActive) {
      return islandState === 'HOVER' ? 'HOVER' : 'TIMER_COMPACT';
    }
    if (stopwatchState.isActive) {
      return islandState === 'HOVER' ? 'HOVER' : 'STOPWATCH_COMPACT';
    }
    return islandState;
  };

  const currentState = getCurrentState();
  const activeDimState = isCollapsing && collapsingTarget ? collapsingTarget : currentState;
  const currentDim = getDimensionsForState(activeDimState);

  // Smooth collapse animation: shrinks DOM first, resizes window after animation finishes!
  const handleSmoothCollapse = (overrideTarget = null) => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }

    const nextVisual = overrideTarget || (
      timerState.isFinished
        ? 'TIMER_FINISHED'
        : timerState.isActive
        ? 'TIMER_COMPACT'
        : stopwatchState.isActive
        ? 'STOPWATCH_COMPACT'
        : 'COMPACT'
    );

    if (islandState === 'EXPANDED') {
      setIsCollapsing(true);
      setCollapsingTarget(nextVisual);
      setIslandState(nextVisual);

      collapseTimeoutRef.current = setTimeout(() => {
        applyDimensions(getDimensionsForState('HOVER'));
        setIsCollapsing(false);
        setCollapsingTarget(null);
        collapseTimeoutRef.current = null;
      }, 320);
    } else {
      setIslandState(nextVisual);
    }
  };

  // Timestamp-based Timer Engine: totally immune to sleep / lock / throttles!
  useEffect(() => {
    if (timerState.isActive && !timerState.isPaused && !timerState.isFinished) {
      const checkCountdown = () => {
        if (!targetEndTimeRef.current) return;
        const now = Date.now();
        const diff = Math.max(0, Math.round((targetEndTimeRef.current - now) / 1000));

        if (diff <= 0) {
          targetEndTimeRef.current = null;
          clearInterval(timerIntervalRef.current);

          if (config?.timer?.enableSound !== false) {
            audioService.playChime(config?.timer?.soundVolume ?? 0.8);
          }

          if (config?.timer?.enableNotification !== false && window.electronAPI) {
            window.electronAPI.sendNotification({
              title: 'Now Bar — Minuteur',
              body: 'Votre minuteur est arrivé à terme !',
            });
          }

          setTimerState((prev) => ({
            ...prev,
            isActive: false,
            isFinished: true,
            remainingSeconds: 0,
          }));
        } else {
          setTimerState((prev) => (prev.remainingSeconds === diff ? prev : { ...prev, remainingSeconds: diff }));
        }
      };

      checkCountdown();
      timerIntervalRef.current = setInterval(checkCountdown, 500);
      return () => clearInterval(timerIntervalRef.current);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  }, [timerState.isActive, timerState.isPaused, timerState.isFinished, config]);

  // Timestamp-based Stopwatch Engine: immune to sleep / lock / throttles!
  useEffect(() => {
    if (stopwatchState.isActive && !stopwatchState.isPaused) {
      const updateStopwatch = () => {
        const now = Date.now();
        const currentElapsed =
          stopwatchAccumulatedRef.current +
          (stopwatchStartTimeRef.current ? now - stopwatchStartTimeRef.current : 0);
        setStopwatchState((prev) => ({
          ...prev,
          elapsedTime: currentElapsed,
        }));
      };

      updateStopwatch();
      stopwatchIntervalRef.current = setInterval(updateStopwatch, 33);
      return () => clearInterval(stopwatchIntervalRef.current);
    } else {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    }
  }, [stopwatchState.isActive, stopwatchState.isPaused]);

  // Mouse wheel volume adjustment
  const handleWheel = (e) => {
    // If expanded, let the view scroll naturally
    if (islandState === 'EXPANDED') return;

    e.preventDefault();
    e.stopPropagation();

    isMouseOverRef.current = true;

    // Instantly abort any pending leave or collapse so the bar doesn't stutter or fight
    if (mouseLeaveTimeoutRef.current) {
      clearTimeout(mouseLeaveTimeoutRef.current);
      mouseLeaveTimeoutRef.current = null;
    }
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsCollapsing(false);
    setCollapsingTarget(null);

    const delta = e.deltaY < 0 ? 2 : -2;
    setMasterVolume((prev) => {
      let newVol;
      // When sound is disabled / muted at 0, scrolling up revives and un-mutes sound starting at a clear level
      if (prev === 0 && delta > 0) {
        newVol = 4;
      } else {
        newVol = Math.max(0, Math.min(100, prev + delta));
      }

      if (window.electronAPI && window.electronAPI.setMasterVolume) {
        window.electronAPI.setMasterVolume(newVol);
      }
      return newVol;
    });

    setIsVolumeHudActive(true);
    if (volumeHudTimeoutRef.current) {
      clearTimeout(volumeHudTimeoutRef.current);
    }
    volumeHudTimeoutRef.current = setTimeout(() => {
      setIsVolumeHudActive(false);
      // When volume HUD finishes, if cursor is no longer on the bar, collapse smoothly
      if (!isMouseOverRef.current && islandState !== 'EXPANDED') {
        handleSmoothCollapse('COMPACT');
      }
    }, 1300);
  };

  const handleVolumeChange = (newVol) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newVol)));
    setMasterVolume(clamped);
    if (window.electronAPI && window.electronAPI.setMasterVolume) {
      window.electronAPI.setMasterVolume(clamped);
    }
  };

  // Mouse event handlers
  const handleMouseEnter = () => {
    isMouseOverRef.current = true;
    if (mouseLeaveTimeoutRef.current) {
      clearTimeout(mouseLeaveTimeoutRef.current);
      mouseLeaveTimeoutRef.current = null;
    }
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }

    if (islandState === 'EXPANDED') return;

    setIslandState('HOVER');
    setIsCollapsing(false);
    setCollapsingTarget(null);
  };

  const handleMouseLeave = () => {
    isMouseOverRef.current = false;
    if (isLaunchLockedRef.current) return;
    if (mouseLeaveTimeoutRef.current) {
      clearTimeout(mouseLeaveTimeoutRef.current);
      mouseLeaveTimeoutRef.current = null;
    }

    // Do NOT abruptly collapse while the volume HUD is active;
    // volumeHudTimeout will smoothly collapse it once the user finished observing it!
    if (isVolumeHudActive) return;

    if (islandState === 'HOVER') {
      mouseLeaveTimeoutRef.current = setTimeout(() => {
        if (!isLaunchLockedRef.current && !isMouseOverRef.current && islandState === 'HOVER') {
          handleSmoothCollapse('COMPACT');
        }
      }, 80);
    }
  };

  const handlePillClick = () => {
    audioService.playTap();
    if (islandState === 'EXPANDED') {
      handleSmoothCollapse();
    } else {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
        collapseTimeoutRef.current = null;
      }
      setIsSquishing(true);
      applyDimensions(getDimensionsForState('EXPANDED'));
      setTimeout(() => {
        setIsSquishing(false);
        setIslandState('EXPANDED');
      }, 70);
    }
  };

  // Music controls
  const handleTogglePlay = async () => {
    audioService.playTap();
    setMusicState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));

    if (window.electronAPI && window.electronAPI.sendMediaCommand) {
      await window.electronAPI.sendMediaCommand('playpause');
    }
  };

  const handleNextTrack = async () => {
    audioService.playTap();
    setMusicState((prev) => ({ ...prev, isPlaying: true }));
    if (window.electronAPI && window.electronAPI.sendMediaCommand) {
      await window.electronAPI.sendMediaCommand('next');
    }
  };

  const handlePrevTrack = async () => {
    audioService.playTap();
    setMusicState((prev) => ({ ...prev, isPlaying: true }));
    if (window.electronAPI && window.electronAPI.sendMediaCommand) {
      await window.electronAPI.sendMediaCommand('prev');
    }
  };

  const handleLaunchMinimized = async (providerId) => {
    audioService.playTap();
    isLaunchLockedRef.current = true;
    if (mouseLeaveTimeoutRef.current) {
      clearTimeout(mouseLeaveTimeoutRef.current);
      mouseLeaveTimeoutRef.current = null;
    }
    setTimeout(() => {
      isLaunchLockedRef.current = false;
    }, 7000);

    const prov = providerId || activeProviderId;
    if (window.electronAPI && window.electronAPI.launchMusicMinimized) {
      await window.electronAPI.launchMusicMinimized(prov);
    }
    setMusicState((prev) => ({
      ...prev,
      provider: prov,
      isPlaying: true,
      providerColor: PROVIDER_COLORS[prov] || '#00a8e1',
    }));
  };

  const handleLockLaunch = () => {
    isLaunchLockedRef.current = true;
    if (mouseLeaveTimeoutRef.current) {
      clearTimeout(mouseLeaveTimeoutRef.current);
      mouseLeaveTimeoutRef.current = null;
    }
    setTimeout(() => {
      isLaunchLockedRef.current = false;
    }, 7500);
  };

  // Voice recording toggle with native background MediaRecorder
  const handleToggleRecording = async () => {
    audioService.playTap();
    if (!isRecording) {
      setRecordingPrompt(null);
      const res = await voiceRecorderService.startRecording();
      if (res && res.success) {
        setIsRecording(true);
      }
    } else {
      setIsRecording(false);
      const result = await voiceRecorderService.stopRecording();
      if (result && result.arrayBuffer) {
        setRecordingPrompt({
          arrayBuffer: result.arrayBuffer,
          durationSecs: result.durationSecs,
          status: 'prompt',
        });
        if (islandState !== 'EXPANDED') {
          applyDimensions(getDimensionsForState('EXPANDED'));
          setIslandState('EXPANDED');
        }
      }
    }
  };

  const handleSaveRecording = async () => {
    if (!recordingPrompt || !recordingPrompt.arrayBuffer) return;
    audioService.playTap();
    if (window.electronAPI && window.electronAPI.saveAudioRecording) {
      const res = await window.electronAPI.saveAudioRecording(recordingPrompt.arrayBuffer);
      if (res && res.success) {
        setRecordingPrompt((prev) => ({ ...prev, status: 'saved' }));
        setTimeout(() => {
          setRecordingPrompt(null);
        }, 1800);
      }
    }
  };

  const handleDiscardRecording = () => {
    audioService.playTap();
    voiceRecorderService.cancelRecording();
    setRecordingPrompt((prev) => ({ ...prev, status: 'discarded' }));
    setTimeout(() => {
      setRecordingPrompt(null);
    }, 600);
  };

  // Timer controls
  const handleStartTimer = (seconds) => {
    audioService.playTap();
    targetEndTimeRef.current = Date.now() + seconds * 1000;
    setTimerState({
      isActive: true,
      isPaused: false,
      isFinished: false,
      totalSeconds: seconds,
      remainingSeconds: seconds,
    });
  };

  const handlePauseTimer = () => {
    audioService.playTap();
    targetEndTimeRef.current = null;
    setTimerState((prev) => ({ ...prev, isPaused: true }));
  };

  const handleResumeTimer = () => {
    audioService.playTap();
    targetEndTimeRef.current = Date.now() + timerState.remainingSeconds * 1000;
    setTimerState((prev) => ({ ...prev, isPaused: false }));
  };

  const handleResetTimer = () => {
    audioService.playTap();
    targetEndTimeRef.current = null;
    setTimerState({
      isActive: false,
      isPaused: false,
      isFinished: false,
      totalSeconds: 0,
      remainingSeconds: 0,
    });
  };

  // Stopwatch controls
  const handleStartStopwatch = () => {
    audioService.playTap();
    stopwatchStartTimeRef.current = Date.now();
    stopwatchAccumulatedRef.current = 0;
    stopwatchLastLapRef.current = 0;
    setStopwatchState({
      isActive: true,
      isPaused: false,
      elapsedTime: 0,
      laps: [],
    });
  };

  const handlePauseStopwatch = () => {
    audioService.playTap();
    if (stopwatchStartTimeRef.current) {
      stopwatchAccumulatedRef.current += Date.now() - stopwatchStartTimeRef.current;
      stopwatchStartTimeRef.current = null;
    }
    setStopwatchState((prev) => ({
      ...prev,
      isPaused: true,
      elapsedTime: stopwatchAccumulatedRef.current,
    }));
  };

  const handleResumeStopwatch = () => {
    audioService.playTap();
    stopwatchStartTimeRef.current = Date.now();
    setStopwatchState((prev) => ({ ...prev, isPaused: false }));
  };

  const handleResetStopwatch = () => {
    audioService.playTap();
    stopwatchStartTimeRef.current = null;
    stopwatchAccumulatedRef.current = 0;
    stopwatchLastLapRef.current = 0;
    setStopwatchState({
      isActive: false,
      isPaused: false,
      elapsedTime: 0,
      laps: [],
    });
  };

  const handleLapStopwatch = () => {
    audioService.playTap();
    const now = Date.now();
    const currentTotal =
      stopwatchAccumulatedRef.current +
      (stopwatchStartTimeRef.current ? now - stopwatchStartTimeRef.current : 0);
    const lapDuration = currentTotal - stopwatchLastLapRef.current;
    stopwatchLastLapRef.current = currentTotal;

    setStopwatchState((prev) => ({
      ...prev,
      laps: [...prev.laps, { lapTime: lapDuration, totalTime: currentTotal }],
    }));
  };

  const accentColor = config?.appearance?.accentColor || '#0078d4';
  const isExpandedMode = currentState === 'EXPANDED' && !isCollapsing;

  return (
    <div
      className="w-screen h-screen flex items-start justify-center overflow-visible bg-transparent pointer-events-none"
      style={{ paddingTop: `${displayInfo.topOffset || 0}px` }}
    >
      {/* Morphing Island Container */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        className={`relative overflow-hidden transform-gpu pointer-events-auto ${
          isSquishing ? 'animate-squish' : ''
        } ${
          isAttached
            ? isExpandedMode
              ? 'glass-island rounded-t-none rounded-b-[28px] border-t-0 border-x border-b border-white/15 shadow-2xl'
              : currentState === 'HOVER'
              ? 'glass-island-hover rounded-t-none rounded-b-[20px] border-t-0 border-x border-b border-white/20'
              : 'glass-island rounded-t-none rounded-b-[20px] border-t-0 border-x border-b border-white/10'
            : isExpandedMode
            ? 'glass-island rounded-[28px] border border-white/15 shadow-2xl'
            : currentState === 'HOVER'
            ? 'glass-island-hover rounded-[20px] border border-white/20'
            : 'glass-island rounded-[20px] border border-white/10'
        }`}
        style={{
          width: `${currentDim.width}px`,
          height: `${currentDim.height}px`,
          transitionProperty: 'width, height, background-color, border-color, box-shadow',
          transitionDuration: isExpandedMode
            ? '340ms'
            : isCollapsing
            ? '300ms'
            : currentState === 'HOVER'
            ? '260ms'
            : '240ms',
          transitionTimingFunction: isExpandedMode || currentState === 'HOVER'
            ? 'cubic-bezier(0.16, 1, 0.3, 1)'
            : 'cubic-bezier(0.25, 1, 0.35, 1)',
          willChange: 'width, height, transform',
        }}
      >
        {/* Layer 1: Pill Content (Unified / Timer) */}
        <div
          className={`absolute inset-0 w-full h-full flex items-center justify-center transform-gpu ${
            isExpandedMode
              ? 'opacity-0 scale-90 pointer-events-none transition-all duration-120 ease-in'
              : 'opacity-100 scale-100 pointer-events-auto transition-all duration-200 delay-100 ease-out'
          }`}
        >
          {currentState === 'TIMER_COMPACT' || currentState === 'TIMER_FINISHED' ? (
            <TimerPill
              remainingSeconds={timerState.remainingSeconds}
              totalSeconds={timerState.totalSeconds}
              isPaused={timerState.isPaused}
              isFinished={timerState.isFinished}
              accentColor={accentColor}
              onClick={handlePillClick}
            />
          ) : (
            <UnifiedPill
              isHovered={currentState === 'HOVER'}
              accentColor={accentColor}
              isAttached={isAttached}
              musicState={musicState}
              isRecording={isRecording}
              masterVolume={masterVolume}
              isVolumeHudActive={isVolumeHudActive}
              stopwatchState={stopwatchState}
              onClick={handlePillClick}
            />
          )}
        </div>

        {/* Layer 2: Expanded Card (Centered anchor - zero horizontal drift on expand/collapse) */}
        <div
          className={`absolute left-1/2 top-0 -translate-x-1/2 w-[420px] h-[260px] transform-gpu ${
            isExpandedMode
              ? 'opacity-100 scale-100 pointer-events-auto transition-all duration-340 ease-out'
              : 'opacity-0 scale-95 pointer-events-none transition-all duration-100 ease-in'
          }`}
        >
          <ExpandedCard
            activeTab={activeTab}
            onTabChange={setActiveTab}
            musicState={musicState}
            onTogglePlay={handleTogglePlay}
            onNextTrack={handleNextTrack}
            onPrevTrack={handlePrevTrack}
            onLaunchMinimized={handleLaunchMinimized}
            onLockLaunch={handleLockLaunch}
            timerState={timerState}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResumeTimer={handleResumeTimer}
            onResetTimer={handleResetTimer}
            onStopTimer={handleResetTimer}
            stopwatchState={stopwatchState}
            onStartStopwatch={handleStartStopwatch}
            onPauseStopwatch={handlePauseStopwatch}
            onResumeStopwatch={handleResumeStopwatch}
            onResetStopwatch={handleResetStopwatch}
            onLapStopwatch={handleLapStopwatch}
            masterVolume={masterVolume}
            onVolumeChange={handleVolumeChange}
            apps={config?.apps || []}
            onOpenSettings={onOpenSettings}
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            recordingPrompt={recordingPrompt}
            onSaveRecording={handleSaveRecording}
            onDiscardRecording={handleDiscardRecording}
            accentColor={accentColor}
          />
        </div>
      </div>
    </div>
  );
}

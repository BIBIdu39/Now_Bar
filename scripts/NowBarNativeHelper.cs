using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Automation;
using System.Windows.Forms;
using Microsoft.Win32;

namespace NowBar {
    class Program {
        [StructLayout(LayoutKind.Sequential)]
        public struct RECT {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
        public struct MONITORINFO {
            public int cbSize;
            public RECT rcMonitor;
            public RECT rcWork;
            public uint dwFlags;
        }

        public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll")]
        static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("user32.dll")]
        static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint dwFlags);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO lpmi);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

        [DllImport("user32.dll")]
        static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll")]
        static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool IsWindowVisible(IntPtr hWnd);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool IsIconic(IntPtr hWnd);

        [DllImport("user32.dll")]
        static extern IntPtr OpenInputDesktop(uint dwFlags, bool fInherit, uint dwDesiredAccess);

        [DllImport("user32.dll")]
        static extern bool SetThreadDesktop(IntPtr hDesktop);

        [DllImport("user32.dll")]
        static extern bool CloseDesktop(IntPtr hDesktop);

        [DllImport("user32.dll")]
        static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);

        [DllImport("user32.dll")]
        static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll", SetLastError = true)]
        static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

        const uint SWP_NOSIZE = 0x0001;
        const uint SWP_NOMOVE = 0x0002;
        const uint SWP_NOZORDER = 0x0004;
        const uint SWP_NOACTIVATE = 0x0010;
        const uint SWP_SHOWWINDOW = 0x0040;

        [DllImport("user32.dll", SetLastError = true)]
        static extern bool SetProcessDpiAwarenessContext(IntPtr dpiFlag);

        [DllImport("user32.dll", SetLastError = true)]
        static extern IntPtr SetThreadDpiAwarenessContext(IntPtr dpiContext);

        [DllImport("shcore.dll")]
        static extern int SetProcessDpiAwareness(int awareness);

        [DllImport("user32.dll")]
        static extern bool SetProcessDPIAware();

        [DllImport("user32.dll")]
        static extern IntPtr WindowFromPoint(POINT Point);

        [DllImport("user32.dll", ExactSpelling = true)]
        static extern IntPtr GetAncestor(IntPtr hwnd, uint gaFlags);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool IsWindow(IntPtr hWnd);

        const uint GA_PARENT = 1;
        const uint GA_ROOT = 2;
        const uint GA_ROOTOWNER = 3;

        static void EnableDpiAwareness() {
            try {
                // DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = -4
                SetProcessDpiAwarenessContext(new IntPtr(-4));
            } catch {
                try {
                    // PROCESS_PER_MONITOR_DPI_AWARE = 2
                    SetProcessDpiAwareness(2);
                } catch {
                    try {
                        SetProcessDPIAware();
                    } catch {}
                }
            }
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct POINT {
            public int x;
            public int y;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct MSLLHOOKSTRUCT {
            public POINT pt;
            public uint mouseData;
            public uint flags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        public delegate IntPtr LowLevelMouseProc(int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true)]
        static extern IntPtr SetWindowsHookEx(int idHook, LowLevelMouseProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll")]
        static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        static extern IntPtr GetModuleHandle(string lpModuleName);

        const int WH_MOUSE_LL = 14;
        const int WM_LBUTTONDOWN = 0x0201;
        const int WM_RBUTTONDOWN = 0x0204;
        const int WM_MBUTTONDOWN = 0x0207;
        const int WM_NCLBUTTONDOWN = 0x00A1;
        const int WM_NCRBUTTONDOWN = 0x00A4;
        const int WM_NCMBUTTONDOWN = 0x00A7;

        static LowLevelMouseProc _mouseProc;
        static IntPtr _mouseHook = IntPtr.Zero;

        static IntPtr MouseHookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
            if (nCode >= 0) {
                int msg = wParam.ToInt32();
                if (msg == WM_LBUTTONDOWN || msg == WM_RBUTTONDOWN || msg == WM_MBUTTONDOWN ||
                    msg == WM_NCLBUTTONDOWN || msg == WM_NCRBUTTONDOWN || msg == WM_NCMBUTTONDOWN) {
                    try {
                        MSLLHOOKSTRUCT hookStruct = (MSLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(MSLLHOOKSTRUCT));
                        CheckClickOutside(hookStruct.pt.x, hookStruct.pt.y);
                    } catch {}
                }
            }
            return CallNextHookEx(_mouseHook, nCode, wParam, lParam);
        }

        static IntPtr _islandHwnd = IntPtr.Zero;

        static IntPtr GetIslandWindow() {
            if (_islandHwnd != IntPtr.Zero && IsWindow(_islandHwnd)) {
                return _islandHwnd;
            }

            IntPtr hWnd = FindWindow(null, "Now Bar — Dynamic Island");
            if (hWnd == IntPtr.Zero) hWnd = FindWindow(null, "Now Bar - Dynamic Island");
            if (hWnd == IntPtr.Zero) hWnd = FindWindow(null, "Now Bar Island");
            if (hWnd != IntPtr.Zero) {
                _islandHwnd = hWnd;
                return hWnd;
            }

            try {
                EnumDesktopWindows(IntPtr.Zero, (h, l) => {
                    if (!IsWindowVisible(h)) return true;
                    StringBuilder sb = new StringBuilder(256);
                    GetWindowText(h, sb, 256);
                    string t = sb.ToString();
                    if (t.Contains("Now Bar") && !t.Contains("Settings")) {
                        _islandHwnd = h;
                        return false;
                    }
                    return true;
                }, IntPtr.Zero);
            } catch {}

            return _islandHwnd;
        }

        static void CheckClickOutside(int x, int y) {
            try {
                IntPtr hWnd = GetIslandWindow();
                if (hWnd == IntPtr.Zero || !IsWindowVisible(hWnd)) return;

                RECT rect;
                if (!GetWindowRect(hWnd, out rect)) return;

                int height = rect.Bottom - rect.Top;
                // Only trigger auto-collapse if the island is currently expanded (height >= 140)
                if (height < 140) return;

                // 1. Direct hit-test: Is the cursor directly over the island window or any child window?
                POINT pt = new POINT { x = x, y = y };
                IntPtr clickedWnd = WindowFromPoint(pt);
                if (clickedWnd != IntPtr.Zero) {
                    if (clickedWnd == hWnd || GetAncestor(clickedWnd, GA_ROOT) == hWnd) {
                        return; // Directly inside Now Bar Island!
                    }

                    // Also check if clicked inside Settings window
                    StringBuilder titleSb = new StringBuilder(256);
                    GetWindowText(GetAncestor(clickedWnd, GA_ROOT), titleSb, 256);
                    string title = titleSb.ToString();
                    if (title.Contains("Now Bar")) {
                        return;
                    }
                }

                // 2. Geometric bounds check with tolerance (in monitor physical coordinates)
                if (x >= (rect.Left - 6) && x <= (rect.Right + 6) &&
                    y >= (rect.Top - 6) && y <= (rect.Bottom + 6)) {
                    return; // Inside island bounds!
                }

                // Definitively clicked outside the expanded island
                Console.WriteLine("CLICK_OUTSIDE");
                Console.Out.Flush();
            } catch {}
        }

        static void StartMouseHook() {
            try {
                Thread t = new Thread(() => {
                    try {
                        try {
                            SetThreadDpiAwarenessContext(new IntPtr(-4));
                        } catch {}

                        _mouseProc = MouseHookCallback;
                        using (Process curProcess = Process.GetCurrentProcess())
                        using (ProcessModule curModule = curProcess.MainModule) {
                            _mouseHook = SetWindowsHookEx(WH_MOUSE_LL, _mouseProc, GetModuleHandle(curModule.ModuleName), 0);
                        }
                        if (_mouseHook != IntPtr.Zero) {
                            Application.Run();
                        }
                    } catch {}
                });
                t.IsBackground = true;
                t.SetApartmentState(ApartmentState.STA);
                t.Start();
            } catch {}
        }


        // CoreAudio for detecting if sound is already playing
        [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        public interface IMMDeviceEnumerator {
            int NotImpl1();
            [PreserveSig] int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
        }

        [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        public interface IMMDevice {
            [PreserveSig] int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
        }

        [Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        public interface IAudioMeterInformation {
            [PreserveSig] int GetPeakValue(out float pfPeak);
        }

        [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        public interface IAudioEndpointVolume {
            [PreserveSig] int RegisterControlChangeNotify(IntPtr pNotify);
            [PreserveSig] int UnregisterControlChangeNotify(IntPtr pNotify);
            [PreserveSig] int GetChannelCount(out uint pnChannelCount);
            [PreserveSig] int SetMasterVolumeLevel(float fLevelDB, ref Guid pguidEventContext);
            [PreserveSig] int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
            [PreserveSig] int GetMasterVolumeLevel(out float pfLevelDB);
            [PreserveSig] int GetMasterVolumeLevelScalar(out float pfLevel);
            [PreserveSig] int SetChannelVolumeLevel(uint nChannel, float fLevelDB, ref Guid pguidEventContext);
            [PreserveSig] int SetChannelVolumeLevelScalar(uint nChannel, float fLevel, ref Guid pguidEventContext);
            [PreserveSig] int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
            [PreserveSig] int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevel);
            [PreserveSig] int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid pguidEventContext);
            [PreserveSig] int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
        }

        [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
        public class MMDeviceEnumeratorComObject { }

        const uint MONITOR_DEFAULTTOPRIMARY = 1;
        const byte VK_SPACE = 0x20;
        const byte VK_MEDIA_NEXT_TRACK = 0xB0;
        const byte VK_MEDIA_PREV_TRACK = 0xB1;
        const byte VK_MEDIA_PLAY_PAUSE = 0xB3;
        const uint KEYEVENTF_KEYUP = 0x0002;
        const int SW_MINIMIZE = 6;
        const int SW_SHOWMINNOACTIVE = 7;
        const uint WM_SYSCOMMAND = 0x0112;
        const int SC_MINIMIZE = 0xF020;

        static readonly Dictionary<string, string[]> ProviderProcs = new Dictionary<string, string[]> {
            { "amazon", new string[] { "Amazon Music", "AmazonMusic" } },
            { "spotify", new string[] { "Spotify" } },
            { "deezer", new string[] { "Deezer" } },
            { "apple", new string[] { "AppleMusic" } }
        };

        public static void SendMediaKey(byte vk) {
            keybd_event(vk, 0, 0, UIntPtr.Zero);
            keybd_event(vk, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        }

        public static void SendKey(byte vk) {
            keybd_event(vk, 0, 0, UIntPtr.Zero);
            keybd_event(vk, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        }

        static IAudioMeterInformation _cachedMeter = null;
        static IAudioEndpointVolume _cachedEndpointVolume = null;
        static readonly object _audioLock = new object();

        static void InvalidateAudioCache() {
            lock (_audioLock) {
                _cachedMeter = null;
                _cachedEndpointVolume = null;
            }
        }

        static bool EnsureAudioInterfaces() {
            lock (_audioLock) {
                if (_cachedMeter != null && _cachedEndpointVolume != null) return true;
                try {
                    var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
                    IMMDevice speakers;
                    int hr = enumerator.GetDefaultAudioEndpoint(0, 1, out speakers);
                    if (hr != 0 || speakers == null) return false;

                    if (_cachedMeter == null) {
                        Guid meterGuid = typeof(IAudioMeterInformation).GUID;
                        object oMeter;
                        speakers.Activate(ref meterGuid, 23, IntPtr.Zero, out oMeter);
                        _cachedMeter = oMeter as IAudioMeterInformation;
                    }

                    if (_cachedEndpointVolume == null) {
                        Guid volGuid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
                        object oVol;
                        speakers.Activate(ref volGuid, 23, IntPtr.Zero, out oVol);
                        _cachedEndpointVolume = oVol as IAudioEndpointVolume;
                    }

                    return (_cachedMeter != null && _cachedEndpointVolume != null);
                } catch {
                    return false;
                }
            }
        }

        static float GetAudioPeak() {
            try {
                if (!EnsureAudioInterfaces()) return 0f;
                float peak = 0f;
                int hr = _cachedMeter.GetPeakValue(out peak);
                if (hr != 0) {
                    InvalidateAudioCache();
                    return 0f;
                }
                return peak;
            } catch {
                InvalidateAudioCache();
                return 0f;
            }
        }

        static float GetMasterVolume() {
            try {
                if (!EnsureAudioInterfaces()) return 0.5f;
                bool isMuted = false;
                int hrMute = _cachedEndpointVolume.GetMute(out isMuted);
                if (hrMute != 0) {
                    InvalidateAudioCache();
                    return 0.5f;
                }
                if (isMuted) return 0f;

                float level = 0f;
                int hrVol = _cachedEndpointVolume.GetMasterVolumeLevelScalar(out level);
                if (hrVol != 0) {
                    InvalidateAudioCache();
                    return 0.5f;
                }
                return level;
            } catch {
                InvalidateAudioCache();
                return 0.5f;
            }
        }

        static void SetMasterVolume(float level) {
            try {
                if (!EnsureAudioInterfaces()) return;
                level = Math.Max(0f, Math.Min(1f, level));
                Guid empty = Guid.Empty;
                if (level > 0f) {
                    try {
                        _cachedEndpointVolume.SetMute(false, ref empty);
                    } catch {}
                }
                int hr = _cachedEndpointVolume.SetMasterVolumeLevelScalar(level, ref empty);
                if (hr != 0) {
                    InvalidateAudioCache();
                }
            } catch {
                InvalidateAudioCache();
            }
        }

        static string _lastTrackInfo = "";

        static void CheckTrackInfo() {
            try {
                IntPtr hDesk = OpenInputDesktop(0, false, 0x01FF);
                if (hDesk != IntPtr.Zero) SetThreadDesktop(hDesk);

                string foundTrack = "";
                EnumDesktopWindows(hDesk, (hWnd, lParam) => {
                    if (!IsWindowVisible(hWnd)) return true;

                    StringBuilder clsSb = new StringBuilder(256);
                    GetClassName(hWnd, clsSb, 256);
                    string cls = clsSb.ToString();

                    StringBuilder titleSb = new StringBuilder(256);
                    GetWindowText(hWnd, titleSb, 256);
                    string title = titleSb.ToString().Trim();

                    // 1. Spotify
                    if (cls.Contains("Chrome_WidgetWin") && title.Length > 0) {
                        uint pid;
                        GetWindowThreadProcessId(hWnd, out pid);
                        if (pid > 0) {
                            string pName = "";
                            try { pName = Process.GetProcessById((int)pid).ProcessName.ToLower(); } catch {}
                            if (pName.Contains("spotify")) {
                                if (title != "Spotify" && title != "Spotify Free" && title != "Spotify Premium") {
                                    string artist = "";
                                    string song = title;
                                    int dashIdx = title.IndexOf(" - ");
                                    if (dashIdx > 0) {
                                        artist = title.Substring(0, dashIdx).Trim();
                                        song = title.Substring(dashIdx + 3).Trim();
                                    }
                                    foundTrack = "TRACK_INFO:spotify:" + artist + ":" + song;
                                    return false;
                                }
                            }
                        }
                    }

                    // 2. Amazon Music
                    if ((cls == "Amazon Music" || cls.ToLower() == "amazon music") && title.Length > 0) {
                        if (!title.ToLower().Contains("amazon music") || title.Contains(" - ")) {
                            string artist = "";
                            string song = title;
                            int dashIdx = title.IndexOf(" - ");
                            if (dashIdx > 0) {
                                artist = title.Substring(dashIdx + 3).Trim();
                                song = title.Substring(0, dashIdx).Trim();
                            }
                            foundTrack = "TRACK_INFO:amazon:" + artist + ":" + song;
                            return false;
                        }
                    }

                    // 3. Deezer
                    if (cls.IndexOf("Deezer", StringComparison.OrdinalIgnoreCase) >= 0 || title.IndexOf("Deezer", StringComparison.OrdinalIgnoreCase) >= 0) {
                        if (!title.Equals("Deezer", StringComparison.OrdinalIgnoreCase)) {
                            string artist = "";
                            string song = title;
                            int dashIdx = title.IndexOf(" - ");
                            if (dashIdx > 0) {
                                song = title.Substring(0, dashIdx).Trim();
                                artist = title.Substring(dashIdx + 3).Trim();
                            }
                            foundTrack = "TRACK_INFO:deezer:" + artist + ":" + song;
                            return false;
                        }
                    }

                    return true;
                }, IntPtr.Zero);

                if (hDesk != IntPtr.Zero) CloseDesktop(hDesk);

                if (foundTrack != _lastTrackInfo) {
                    _lastTrackInfo = foundTrack;
                    if (!string.IsNullOrEmpty(foundTrack)) {
                        Console.WriteLine(foundTrack);
                    } else {
                        Console.WriteLine("TRACK_INFO:none::");
                    }
                    Console.Out.Flush();
                }
            } catch {}
        }

        [DllImport("user32.dll", EntryPoint = "GetWindowLong", SetLastError = true)]
        static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll", EntryPoint = "GetWindowLongPtr", SetLastError = true)]
        static extern IntPtr GetWindowLongPtr(IntPtr hWnd, int nIndex);

        static int GetWindowStyle(IntPtr hWnd) {
            try {
                if (IntPtr.Size == 8)
                    return (int)GetWindowLongPtr(hWnd, -16).ToInt64();
                else
                    return GetWindowLong(hWnd, -16);
            } catch {
                return 0;
            }
        }

        const int WS_CAPTION = 0x00C00000;
        const int WS_MAXIMIZE = 0x01000000;

        static bool IsFullscreen() {
            IntPtr hWnd = GetForegroundWindow();
            if (hWnd == IntPtr.Zero) return false;

            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            string pName = "";
            try {
                if (pid > 0) pName = Process.GetProcessById((int)pid).ProcessName.ToLower();
            } catch {}

            // Ignore our app, electron, desktop, shell
            if (pName.Contains("electron") || pName.Contains("nowbar") || pName.Contains("now_bar")) {
                return false;
            }

            StringBuilder className = new StringBuilder(256);
            GetClassName(hWnd, className, className.Capacity);
            string cls = className.ToString().ToLower();

            // Ignore Windows desktop, shell, taskbar, start menu
            if (cls == "progman" || cls == "workerw" || cls == "shell_traywnd" || cls == "shell_secondarytraywnd" ||
                cls == "windows.ui.core.corewindow" || cls == "cortanawindow" || cls == "applicationframewindow") {
                return false;
            }

            // Ignore music players (Amazon Music, Spotify, Deezer, Apple Music) - Now Bar must ALWAYS stay visible with music!
            if (pName.Contains("amazon") || pName.Contains("spotify") || pName.Contains("deezer") || pName.Contains("apple")) {
                return false;
            }
            if (cls.Contains("amazon") || cls.Contains("spotify") || cls.Contains("deezer") || cls.Contains("apple")) {
                return false;
            }

            StringBuilder titleSb = new StringBuilder(256);
            GetWindowText(hWnd, titleSb, 256);
            string title = titleSb.ToString().ToLower();
            if (title.Contains("amazon music") || title.Contains("spotify") || title.Contains("now bar")) {
                return false;
            }

            RECT winRect;
            if (!GetWindowRect(hWnd, out winRect)) return false;

            IntPtr hMon = MonitorFromWindow(hWnd, MONITOR_DEFAULTTOPRIMARY);
            MONITORINFO mi = new MONITORINFO();
            mi.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
            if (!GetMonitorInfo(hMon, ref mi)) return false;

            // Only consider if on or covering the PRIMARY monitor where Now Bar is displayed
            bool isPrimaryMonitor = (mi.dwFlags & 1) != 0;
            if (!isPrimaryMonitor) return false;

            // 1. Must cover the monitor completely (from (0,0) to screen width/height, covering the taskbar)
            bool coversMonitor = (winRect.Left <= mi.rcMonitor.Left &&
                                 winRect.Top <= mi.rcMonitor.Top &&
                                 winRect.Right >= mi.rcMonitor.Right &&
                                 winRect.Bottom >= mi.rcMonitor.Bottom);

            if (!coversMonitor) return false;

            // 2. Check window style: regular windows (even maximized!) have WS_CAPTION (titlebar, tabs, address bar).
            // A regular maximized window is NOT a video/film and must NEVER hide Now Bar!
            int style = GetWindowStyle(hWnd);
            bool hasCaption = (style & WS_CAPTION) == WS_CAPTION;
            if (hasCaption) {
                return false;
            }

            // 3. If taskbar exists at bottom of screen, ensure window actually extends over taskbar
            if (mi.rcWork.Bottom < mi.rcMonitor.Bottom) {
                if (winRect.Bottom < mi.rcMonitor.Bottom) {
                    return false; // Stays within work area -> not fullscreen video
                }
            }

            // Matches true borderless fullscreen (YouTube/Netflix video fullscreen, VLC fullscreen, full screen movie)
            return true;
        }

        static bool IsProviderRunning(string provider) {
            if (!ProviderProcs.ContainsKey(provider)) return false;
            foreach (var procName in ProviderProcs[provider]) {
                try {
                    Process[] procs = Process.GetProcessesByName(procName);
                    if (procs != null && procs.Length > 0) return true;
                } catch {}
            }
            return false;
        }

        static bool HasVisibleWindow(string provider) {
            IntPtr hDesk = OpenInputDesktop(0, false, 0x01FF);
            if (hDesk != IntPtr.Zero) SetThreadDesktop(hDesk);

            bool hasWin = false;
            EnumDesktopWindows(hDesk, (hWnd, lParam) => {
                if (!IsWindowVisible(hWnd)) return true;

                StringBuilder clsSb = new StringBuilder(256);
                GetClassName(hWnd, clsSb, 256);
                string cls = clsSb.ToString().ToLower();

                StringBuilder titleSb = new StringBuilder(256);
                GetWindowText(hWnd, titleSb, 256);
                string title = titleSb.ToString().ToLower();

                if (provider == "amazon") {
                    if ((cls == "amazon music" || title.Contains("amazon music")) && !title.Contains("gdi+")) {
                        hasWin = true;
                        return false;
                    }
                } else if (provider == "spotify") {
                    if (cls.Contains("spotify") || title.Contains("spotify")) {
                        hasWin = true;
                        return false;
                    }
                } else {
                    if (cls.Contains(provider) || title.Contains(provider)) {
                        hasWin = true;
                        return false;
                    }
                }

                // Fallback: only query process name if window has a meaningful title (avoids querying OS process table for 200+ hidden/helper windows)
                if (title.Length > 0 && !title.Contains("default ime") && !title.Contains("msctfime ui")) {
                    uint pid;
                    GetWindowThreadProcessId(hWnd, out pid);
                    if (pid > 0) {
                        try {
                            string pName = Process.GetProcessById((int)pid).ProcessName.ToLower();
                            if (pName.Contains(provider)) {
                                hasWin = true;
                                return false;
                            }
                        } catch {}
                    }
                }

                return true;
            }, IntPtr.Zero);

            if (hDesk != IntPtr.Zero) CloseDesktop(hDesk);
            return hasWin;
        }

        static bool TryInvokeAmazonPlayButton() {
            try {
                IntPtr hDesk = OpenInputDesktop(0, false, 0x01FF);
                if (hDesk != IntPtr.Zero) SetThreadDesktop(hDesk);

                AutomationElement win = null;
                AutomationElement root = AutomationElement.RootElement;
                Condition winCond = new OrCondition(
                    new PropertyCondition(AutomationElement.NameProperty, "Amazon Music"),
                    new PropertyCondition(AutomationElement.ClassNameProperty, "Amazon Music")
                );
                try {
                    win = root.FindFirst(TreeScope.Children, winCond);
                } catch {}

                if (win == null) {
                    EnumDesktopWindows(hDesk, (hWnd, lParam) => {
                        if (!IsWindowVisible(hWnd)) return true;
                        StringBuilder clsSb = new StringBuilder(256);
                        GetClassName(hWnd, clsSb, 256);
                        string cls = clsSb.ToString();
                        StringBuilder titleSb = new StringBuilder(256);
                        GetWindowText(hWnd, titleSb, 256);
                        string title = titleSb.ToString();

                        if (cls.IndexOf("Amazon Music", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            title.IndexOf("Amazon Music", StringComparison.OrdinalIgnoreCase) >= 0) {
                            try {
                                win = AutomationElement.FromHandle(hWnd);
                                return false;
                            } catch {}
                        }
                        return true;
                    }, IntPtr.Zero);
                }

                if (win != null) {
                    Condition playCond = new OrCondition(
                        new PropertyCondition(AutomationElement.NameProperty, "Lire"),
                        new PropertyCondition(AutomationElement.NameProperty, "Lecture"),
                        new PropertyCondition(AutomationElement.NameProperty, "Play"),
                        new PropertyCondition(AutomationElement.NameProperty, "play"),
                        new PropertyCondition(AutomationElement.NameProperty, "lecture"),
                        new PropertyCondition(AutomationElement.NameProperty, "Écouter")
                    );
                    var btn = win.FindFirst(TreeScope.Descendants, playCond);
                    if (btn != null) {
                        var pattern = btn.GetCurrentPattern(InvokePattern.Pattern) as InvokePattern;
                        if (pattern != null) {
                            pattern.Invoke();
                            if (hDesk != IntPtr.Zero) CloseDesktop(hDesk);
                            return true;
                        }
                    }
                }
                if (hDesk != IntPtr.Zero) CloseDesktop(hDesk);
            } catch {}
            return false;
        }

        static void RunWatcher() {
            StartMouseHook();

            // Background stdin listener for real-time instant volume adjustments (0ms latency)
            Thread stdinThread = new Thread(() => {
                try {
                    string line;
                    while ((line = Console.ReadLine()) != null) {
                        line = line.Trim();
                        if (line.StartsWith("SET_VOLUME:", StringComparison.OrdinalIgnoreCase)) {
                            string volStr = line.Substring("SET_VOLUME:".Length);
                            float v;
                            if (float.TryParse(volStr, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out v)) {
                                SetMasterVolume(v / 100f);
                                Console.WriteLine("AUDIO_VOLUME:" + (int)Math.Round(v));
                                Console.Out.Flush();
                            }
                        } else if (line.Equals("UNMUTE", StringComparison.OrdinalIgnoreCase)) {
                            if (EnsureAudioInterfaces()) {
                                Guid empty = Guid.Empty;
                                _cachedEndpointVolume.SetMute(false, ref empty);
                            }
                        }
                    }
                } catch {}
            });
            stdinThread.IsBackground = true;
            stdinThread.Start();

            bool lastFullscreen = false;
            bool initialFs = IsFullscreen();
            Console.WriteLine(initialFs ? "FULLSCREEN:TRUE" : "FULLSCREEN:FALSE");
            lastFullscreen = initialFs;

            Dictionary<string, bool> lastState = new Dictionary<string, bool>();
            Dictionary<string, bool> lastWindowState = new Dictionary<string, bool>();

            foreach (var kvp in ProviderProcs) {
                bool running = IsProviderRunning(kvp.Key);
                bool winVis = HasVisibleWindow(kvp.Key);
                lastState[kvp.Key] = running;
                lastWindowState[kvp.Key] = winVis;
                Console.WriteLine("MUSIC_STATE:" + kvp.Key + ":" + (running ? "RUNNING" : "STOPPED"));
            }

            float initialPeak = GetAudioPeak();
            bool lastAudioPlaying = initialPeak > 0.0003f;
            Console.WriteLine(lastAudioPlaying ? "AUDIO_PLAYBACK:PLAYING" : "AUDIO_PLAYBACK:PAUSED");

            float initialVol = GetMasterVolume();
            int lastVolInt = (int)Math.Round(initialVol * 100);
            Console.WriteLine("AUDIO_VOLUME:" + lastVolInt);
            Console.Out.Flush();

            int silentTicks = 0;
            int soundTicks = 0;
            IntPtr lastFg = IntPtr.Zero;
            int tickCounter = 0;

            while (true) {
                Thread.Sleep(300);

                // Master audio volume monitoring
                float currentVol = GetMasterVolume();
                int currentVolInt = (int)Math.Round(currentVol * 100);
                if (currentVolInt != lastVolInt) {
                    lastVolInt = currentVolInt;
                    Console.WriteLine("AUDIO_VOLUME:" + currentVolInt);
                    Console.Out.Flush();
                }

                // Foreground window monitoring to detect outside clicks
                IntPtr currentFg = GetForegroundWindow();
                if (currentFg != lastFg) {
                    lastFg = currentFg;
                    if (currentFg != IntPtr.Zero) {
                        uint fgPid;
                        GetWindowThreadProcessId(currentFg, out fgPid);
                        bool isElectron = false;
                        try {
                            if (fgPid > 0) {
                                string pName = Process.GetProcessById((int)fgPid).ProcessName.ToLower();
                                if (pName.Contains("electron") || pName.Contains("nowbar") || pName.Contains("now_bar")) {
                                    isElectron = true;
                                }
                            }
                        } catch {}
                        if (!isElectron) {
                            Console.WriteLine("FOREGROUND:EXTERNAL");
                            Console.Out.Flush();
                        }
                    }
                }

                // Audio playback activity detection via CoreAudio master peak meter
                float peak = GetAudioPeak();
                if (peak > 0.0003f) {
                    silentTicks = 0;
                    soundTicks++;
                    if (!lastAudioPlaying && soundTicks >= 1) {
                        lastAudioPlaying = true;
                        Console.WriteLine("AUDIO_PLAYBACK:PLAYING");
                        Console.Out.Flush();
                    }
                } else {
                    soundTicks = 0;
                    silentTicks++;
                    if (silentTicks >= 3 && lastAudioPlaying) {
                        lastAudioPlaying = false;
                        Console.WriteLine("AUDIO_PLAYBACK:PAUSED");
                        Console.Out.Flush();
                    }
                }

                // Dynamic track & artist info detection
                tickCounter++;
                if (soundTicks >= 1 || (tickCounter % 4 == 0)) {
                    CheckTrackInfo();
                }

                // Fullscreen detection
                bool currentFs = IsFullscreen();
                if (currentFs != lastFullscreen) {
                    lastFullscreen = currentFs;
                    Console.WriteLine(currentFs ? "FULLSCREEN:TRUE" : "FULLSCREEN:FALSE");
                    Console.Out.Flush();
                }

                // Music providers process and window state detection (throttled to every ~1.8s to avoid continuous process table scans)
                if (tickCounter % 6 == 0) {
                    foreach (var kvp in ProviderProcs) {
                        bool currentRunning = IsProviderRunning(kvp.Key);
                        bool currentWin = currentRunning && HasVisibleWindow(kvp.Key);

                        // 1. Process termination
                        if (currentRunning != lastState[kvp.Key]) {
                            lastState[kvp.Key] = currentRunning;
                            Console.WriteLine("MUSIC_STATE:" + kvp.Key + ":" + (currentRunning ? "RUNNING" : "STOPPED"));
                            Console.Out.Flush();
                        }

                        // 2. Window close detection (user clicked X on the window)
                        if (lastWindowState[kvp.Key] && !currentWin) {
                            lastWindowState[kvp.Key] = false;
                            Console.WriteLine("MUSIC_WINDOW:" + kvp.Key + ":CLOSED");
                            Console.Out.Flush();
                        } else if (!lastWindowState[kvp.Key] && currentWin) {
                            lastWindowState[kvp.Key] = true;
                        }
                    }
                }
            }
        }

        static void LaunchMusic(string provider) {
            provider = provider.ToLower().Trim();
            string target = "";
            string[] matchNames;

            if (provider == "amazon" || provider.Contains("amazon") || provider.Contains("amzn")) {
                provider = "amazon";
                matchNames = new string[] { "amazon music", "amazonmusic" };
                string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string desk = Path.Combine(local, @"Amazon Music\Amazon Music.exe");
                if (File.Exists(desk)) {
                    target = desk;
                } else {
                    target = @"shell:AppsFolder\AmazonMobileLLC.AmazonMusic_kc6t79cpj4tp0!AmazonMobileLLC.AmazonMusic";
                }
            } else if (provider == "spotify") {
                provider = "spotify";
                matchNames = new string[] { "spotify" };
                string appdata = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                string desk = Path.Combine(appdata, @"Spotify\Spotify.exe");
                if (File.Exists(desk)) {
                    target = desk;
                } else {
                    target = @"shell:AppsFolder\SpotifyAB.SpotifyMusic_zpdnekdrzrea0!Spotify";
                }
            } else if (provider == "deezer") {
                provider = "deezer";
                matchNames = new string[] { "deezer" };
                string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string desk = Path.Combine(local, @"Programs\deezer-desktop\Deezer.exe");
                if (File.Exists(desk)) {
                    target = desk;
                } else {
                    target = "deezer:";
                }
            } else if (provider == "apple") {
                provider = "apple";
                matchNames = new string[] { "applemusic" };
                string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string desk = Path.Combine(local, @"Microsoft\WindowsApps\AppleMusic.exe");
                if (File.Exists(desk)) {
                    target = desk;
                } else {
                    target = "apple-music:";
                }
            } else {
                matchNames = new string[] { provider };
            }

            try {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = target;
                psi.UseShellExecute = true;
                Process.Start(psi);
                Console.WriteLine("LAUNCHED");
                Console.Out.Flush();

                IntPtr hDesk = OpenInputDesktop(0, false, 0x01FF);
                if (hDesk != IntPtr.Zero) SetThreadDesktop(hDesk);

                bool hasStartedPlayback = false;
                IntPtr targetHwnd = IntPtr.Zero;
                RECT originalRect = new RECT();
                bool hasSavedRect = false;

                // Watch for up to 9 seconds (45 ticks of 200ms)
                for (int tick = 0; tick < 45; tick++) {
                    Thread.Sleep(200);

                    // Find window handle if not yet located
                    if (targetHwnd == IntPtr.Zero) {
                        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
                            if (!IsWindowVisible(hWnd)) return true;
                            uint pid;
                            GetWindowThreadProcessId(hWnd, out pid);
                            string pName = "";
                            try { if (pid > 0) pName = Process.GetProcessById((int)pid).ProcessName.ToLower(); } catch {}

                            StringBuilder titleSb = new StringBuilder(256);
                            GetWindowText(hWnd, titleSb, 256);
                            string title = titleSb.ToString().ToLower();

                            StringBuilder clsSb = new StringBuilder(256);
                            GetClassName(hWnd, clsSb, 256);
                            string cls = clsSb.ToString().ToLower();

                            bool matches = false;
                            foreach (var m in matchNames) {
                                if (pName.Contains(m) || title.Contains(m) || cls.Contains(m)) {
                                    matches = true;
                                    break;
                                }
                            }

                            if (matches && !title.Contains("gdi+")) {
                                targetHwnd = hWnd;
                                if (!hasSavedRect) {
                                    GetWindowRect(hWnd, out originalRect);
                                    hasSavedRect = true;
                                }
                                // Move off-screen immediately so user never sees it pop up!
                                SetWindowPos(hWnd, IntPtr.Zero, -20000, -20000, 1024, 768, SWP_NOACTIVATE | SWP_NOZORDER);
                                return false; // stop enum
                            }
                            return true;
                        }, IntPtr.Zero);
                    } else {
                        // Ensure it stays off-screen while loading
                        if (!IsIconic(targetHwnd)) {
                            SetWindowPos(targetHwnd, IntPtr.Zero, -20000, -20000, 1024, 768, SWP_NOACTIVATE | SWP_NOZORDER);
                        }
                    }

                    // Check for audio peak
                    float peak = GetAudioPeak();
                    if (peak > 0.0005f) {
                        hasStartedPlayback = true;
                    }

                    // Attempt UIAutomation button click starting at tick 5 (1.0 second)
                    if (tick >= 5 && !hasStartedPlayback) {
                        if (provider == "amazon") {
                            bool invoked = TryInvokeAmazonPlayButton();
                            if (invoked) {
                                hasStartedPlayback = true;
                            }
                        } else {
                            SendMediaKey(VK_MEDIA_PLAY_PAUSE);
                            if (GetAudioPeak() > 0.0005f) hasStartedPlayback = true;
                        }
                    }

                    // Once playback started or at timeout: restore coordinates and minimize neatly to taskbar!
                    if (hasStartedPlayback || tick >= 32) {
                        if (targetHwnd != IntPtr.Zero) {
                            if (hasSavedRect && originalRect.Right > originalRect.Left && originalRect.Bottom > originalRect.Top) {
                                SetWindowPos(targetHwnd, IntPtr.Zero, originalRect.Left, originalRect.Top, 
                                    originalRect.Right - originalRect.Left, originalRect.Bottom - originalRect.Top, 
                                    SWP_NOACTIVATE | SWP_NOZORDER);
                            } else {
                                SetWindowPos(targetHwnd, IntPtr.Zero, 100, 100, 1024, 768, SWP_NOACTIVATE | SWP_NOZORDER);
                            }
                            ShowWindow(targetHwnd, SW_MINIMIZE);
                            ShowWindowAsync(targetHwnd, SW_SHOWMINNOACTIVE);
                        }
                        break;
                    }
                }

                if (hDesk != IntPtr.Zero) CloseDesktop(hDesk);
                Console.WriteLine("MONITOR_FINISHED");
                Console.Out.Flush();
            } catch (Exception ex) {
                Console.WriteLine("ERROR:" + ex.Message);
            }
        }

        static string GetProjectDirectory() {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            if (baseDir.EndsWith("scripts", StringComparison.OrdinalIgnoreCase)) {
                DirectoryInfo parent = Directory.GetParent(baseDir);
                if (parent != null) return parent.FullName;
            }
            return baseDir;
        }

        static string GetUserDataDirectory() {
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string dir = Path.Combine(appData, "now-bar");
            if (!Directory.Exists(dir)) {
                try { Directory.CreateDirectory(dir); } catch {}
            }
            return dir;
        }

        static string PidFilePath {
            get { return Path.Combine(GetUserDataDirectory(), "nowbar.pid"); }
        }

        static string StopFlagPath {
            get { return Path.Combine(GetUserDataDirectory(), "nowbar_stopped.flag"); }
        }

        static bool IsWorkstationLocked() {
            IntPtr hDesk = OpenInputDesktop(0, false, 0x01FF);
            if (hDesk == IntPtr.Zero) return true;
            CloseDesktop(hDesk);
            return false;
        }

        static bool IsNowBarRunning() {
            // 1. Check PID file and ensure process is alive and is electron
            try {
                if (File.Exists(PidFilePath)) {
                    string txt = File.ReadAllText(PidFilePath).Trim();
                    int pid;
                    if (int.TryParse(txt, out pid)) {
                        Process p = Process.GetProcessById(pid);
                        if (p != null && !p.HasExited && p.ProcessName.IndexOf("electron", StringComparison.OrdinalIgnoreCase) >= 0) {
                            return true;
                        }
                    }
                }
            } catch {}

            // 2. Fast Win32 Atom/Title search
            try {
                IntPtr hWnd = FindWindow(null, "Now Bar Island");
                if (hWnd == IntPtr.Zero) hWnd = FindWindow(null, "Now Bar — Dynamic Island");
                if (hWnd != IntPtr.Zero) return true;
            } catch {}

            return false;
        }

        static Mutex _watchdogMutex = null;
        static readonly object _logLock = new object();

        static void LogWatchdog(string msg) {
            lock (_logLock) {
                for (int i = 0; i < 5; i++) {
                    try {
                        string logFile = Path.Combine(GetUserDataDirectory(), "watchdog.log");
                        using (FileStream fs = new FileStream(logFile, FileMode.Append, FileAccess.Write, FileShare.ReadWrite))
                        using (StreamWriter sw = new StreamWriter(fs, Encoding.UTF8)) {
                            sw.WriteLine(string.Format("[{0:yyyy-MM-dd HH:mm:ss}] {1}", DateTime.Now, msg));
                            sw.Flush();
                        }
                        break;
                    } catch {
                        Thread.Sleep(25);
                    }
                }
            }
        }

        static void EnsureNowBarRunning() {
            try {
                if (File.Exists(StopFlagPath)) {
                    LogWatchdog("EnsureNowBarRunning: Stop flag active, skipping launch.");
                    return;
                }

                if (IsNowBarRunning()) {
                    LogWatchdog("EnsureNowBarRunning: Now Bar is already running.");
                    IntPtr hWnd = FindWindow(null, "Now Bar Island");
                    if (hWnd == IntPtr.Zero) hWnd = FindWindow(null, "Now Bar — Dynamic Island");
                    if (hWnd != IntPtr.Zero && !IsFullscreen()) {
                        if (!IsWindowVisible(hWnd)) {
                            ShowWindow(hWnd, 5); // SW_SHOW
                        }
                        SetWindowPos(hWnd, new IntPtr(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040); // TOPMOST | SHOW
                    }
                    return;
                }

                string projectDir = GetProjectDirectory();
                string electronExe = Path.Combine(projectDir, @"node_modules\electron\dist\electron.exe");

                LogWatchdog("EnsureNowBarRunning: Launching Electron via cmd start");
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                if (File.Exists(electronExe)) {
                    psi.Arguments = string.Format("/c start \"\" \"{0}\" \"{1}\"", electronExe, projectDir);
                } else {
                    psi.Arguments = "/c start \"\" npm start";
                }
                psi.WorkingDirectory = projectDir;
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                Process.Start(psi);
                LogWatchdog("EnsureNowBarRunning: Process launch requested.");
            } catch (Exception ex) {
                LogWatchdog("EnsureNowBarRunning ERROR: " + ex.Message);
            }
        }

        static void RegisterAutostart(bool enable) {
            try {
                string helperExe = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "nowbar_helper.exe");
                string runKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Run";
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(runKeyPath, true)) {
                    if (key != null) {
                        if (enable) {
                            key.SetValue("NowBar", string.Format("\"{0}\" watchdog", helperExe));
                        } else {
                            key.DeleteValue("NowBar", false);
                        }
                    }
                }

                string startupDir = Environment.GetFolderPath(Environment.SpecialFolder.Startup);
                string vbsPath = Path.Combine(startupDir, "NowBar_Autostart.vbs");
                if (enable) {
                    string vbsContent = string.Format("Set WshShell = CreateObject(\"WScript.Shell\")\r\nWshShell.Run \"\"\"{0}\"\" watchdog\", 0, False\r\n", helperExe);
                    File.WriteAllText(vbsPath, vbsContent);
                } else {
                    if (File.Exists(vbsPath)) File.Delete(vbsPath);
                }
            } catch (Exception ex) {
                LogWatchdog("RegisterAutostart ERROR: " + ex.Message);
            }
        }

        static void RunWatchdog() {
            try {
                LogWatchdog("RunWatchdog started (PID " + Process.GetCurrentProcess().Id + ")");
                bool isNew;
                _watchdogMutex = new Mutex(true, @"Local\NowBar_Watchdog_Mutex", out isNew);
                if (!isNew) {
                    LogWatchdog("Another watchdog instance is already active. Ensuring Now Bar and exiting.");
                    EnsureNowBarRunning();
                    return;
                }

                // Ensure autostart is registered in Run key & Startup folder
                RegisterAutostart(true);
                LogWatchdog("Autostart verified.");

                // Initial launch on startup
                EnsureNowBarRunning();

                // Hook Windows session unlock & logon events for instantaneous launch
                SystemEvents.SessionSwitch += (s, e) => {
                    try {
                        LogWatchdog("SessionSwitch event: " + e.Reason);
                        if (e.Reason == SessionSwitchReason.SessionUnlock || e.Reason == SessionSwitchReason.SessionLogon) {
                            if (File.Exists(StopFlagPath)) File.Delete(StopFlagPath);
                            EnsureNowBarRunning();
                        } else if (e.Reason == SessionSwitchReason.SessionLock) {
                            if (File.Exists(StopFlagPath)) File.Delete(StopFlagPath);
                        }
                    } catch (Exception ex) {
                        LogWatchdog("SessionSwitch callback ERROR: " + ex.Message);
                    }
                };

                // Watchdog heartbeat timer using Windows Forms Timer (fires inside message loop)
                System.Windows.Forms.Timer timer = new System.Windows.Forms.Timer();
                timer.Interval = 3000;
                timer.Tick += (s, e) => {
                    try {
                        if (!IsWorkstationLocked()) {
                            if (!File.Exists(StopFlagPath)) {
                                if (!IsNowBarRunning()) {
                                    LogWatchdog("Heartbeat: Now Bar is not running -> relaunching");
                                    EnsureNowBarRunning();
                                } else {
                                    IntPtr hWnd = FindWindow(null, "Now Bar Island");
                                    if (hWnd == IntPtr.Zero) hWnd = FindWindow(null, "Now Bar — Dynamic Island");
                                    if (hWnd != IntPtr.Zero && !IsFullscreen() && !IsWindowVisible(hWnd)) {
                                        ShowWindow(hWnd, 5); // SW_SHOW
                                    }
                                }
                            }
                        }
                    } catch (Exception ex) {
                        LogWatchdog("Heartbeat timer tick ERROR: " + ex.Message);
                    }
                };
                timer.Start();

                LogWatchdog("Watchdog message pump active and listening.");
                System.Windows.Forms.Application.Run();
            } catch (Exception ex) {
                LogWatchdog("FATAL in RunWatchdog: " + ex.ToString());
            }
        }

        [STAThread]
        static void Main(string[] args) {
            EnableDpiAwareness();

            AppDomain.CurrentDomain.UnhandledException += (s, e) => {
                LogWatchdog("CRASH: AppDomain UnhandledException: " + e.ExceptionObject);
            };

            if (args.Length > 1) {
                ulong parsedHwnd;
                if (ulong.TryParse(args[1], out parsedHwnd) && parsedHwnd != 0) {
                    _islandHwnd = new IntPtr(unchecked((long)parsedHwnd));
                }
            }

            if (args.Length == 0 || args[0].ToLower() == "watcher") {
                RunWatcher();
                return;
            }

            string cmd = args[0].ToLower();
            if (cmd == "watchdog") {
                RunWatchdog();
            } else if (cmd == "ensure") {
                EnsureNowBarRunning();
            } else if (cmd == "status") {
                Console.WriteLine("PROJECT_DIR=" + GetProjectDirectory());
                Console.WriteLine("IS_LOCKED=" + IsWorkstationLocked());
                Console.WriteLine("IS_NOWBAR_RUNNING=" + IsNowBarRunning());
                Console.WriteLine("STOP_FLAG=" + File.Exists(StopFlagPath));
                Console.WriteLine("PID_FILE=" + (File.Exists(PidFilePath) ? File.ReadAllText(PidFilePath).Trim() : "NONE"));
            } else if (cmd == "autostart") {
                bool enable = !(args.Length > 1 && args[1].ToLower() == "remove");
                RegisterAutostart(enable);
                Console.WriteLine(enable ? "AUTOSTART_ENABLED" : "AUTOSTART_DISABLED");
            } else if (cmd == "stop") {
                try { File.WriteAllText(StopFlagPath, "stopped"); } catch {}
                Console.WriteLine("STOP_FLAG_SET");
            } else if (cmd == "media") {
                if (args.Length > 1) {
                    string action = args[1].ToLower();
                    if (action == "playpause" || action == "play" || action == "pause") {
                        SendMediaKey(VK_MEDIA_PLAY_PAUSE);
                        Console.WriteLine("OK");
                    } else if (action == "next" || action == "skip") {
                        SendMediaKey(VK_MEDIA_NEXT_TRACK);
                        Console.WriteLine("OK");
                    } else if (action == "prev" || action == "previous") {
                        SendMediaKey(VK_MEDIA_PREV_TRACK);
                        Console.WriteLine("OK");
                    }
                }
            } else if (cmd == "isplaying") {
                float peak = GetAudioPeak();
                Console.WriteLine(peak > 0.0003f ? "PLAYING" : "PAUSED");
            } else if (cmd == "launchmin") {
                string provider = args.Length > 1 ? args[1] : "amazon";
                LaunchMusic(provider);
            } else if (cmd == "checkproc") {
                string provider = args.Length > 1 ? args[1].ToLower() : "amazon";
                bool running = IsProviderRunning(provider);
                Console.WriteLine(running ? "RUNNING" : "STOPPED");
            } else if (cmd == "invokebtn") {
                bool res = TryInvokeAmazonPlayButton();
                Console.WriteLine(res ? "INVOKED" : "FAILED");
            } else if (cmd == "volume") {
                float vol = GetMasterVolume();
                Console.WriteLine("VOLUME:" + (int)Math.Round(vol * 100));
            } else if (cmd == "setvolume") {
                if (args.Length > 1) {
                    float v;
                    if (float.TryParse(args[1], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out v)) {
                        SetMasterVolume(v / 100f);
                        Console.WriteLine("OK");
                    }
                }
            }
        }
    }
}

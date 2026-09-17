using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

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

        const uint MONITOR_DEFAULTTOPRIMARY = 1;

        static bool IsFullscreen() {
            IntPtr hWnd = GetForegroundWindow();
            if (hWnd == IntPtr.Zero) return false;

            StringBuilder className = new StringBuilder(256);
            GetClassName(hWnd, className, className.Capacity);
            string cls = className.ToString();

            // Ignore desktop and taskbar
            if (cls == "Progman" || cls == "WorkerW" || cls == "Shell_TrayWnd" || cls == "Shell_SecondaryTrayWnd") {
                return false;
            }

            RECT winRect;
            if (!GetWindowRect(hWnd, out winRect)) return false;

            IntPtr hMon = MonitorFromWindow(hWnd, MONITOR_DEFAULTTOPRIMARY);
            MONITORINFO mi = new MONITORINFO();
            mi.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
            if (!GetMonitorInfo(hMon, ref mi)) return false;

            // Check if foreground window covers or exceeds the entire monitor
            bool coversMonitor = (winRect.Left <= mi.rcMonitor.Left &&
                                 winRect.Top <= mi.rcMonitor.Top &&
                                 winRect.Right >= mi.rcMonitor.Right &&
                                 winRect.Bottom >= mi.rcMonitor.Bottom);

            return coversMonitor;
        }

        static void Main(string[] args) {
            bool lastState = false;
            // Print initial state
            bool initial = IsFullscreen();
            Console.WriteLine(initial ? "FULLSCREEN:TRUE" : "FULLSCREEN:FALSE");
            Console.Out.Flush();
            lastState = initial;

            while (true) {
                Thread.Sleep(400);
                bool current = IsFullscreen();
                if (current != lastState) {
                    lastState = current;
                    Console.WriteLine(current ? "FULLSCREEN:TRUE" : "FULLSCREEN:FALSE");
                    Console.Out.Flush();
                }
            }
        }
    }
}

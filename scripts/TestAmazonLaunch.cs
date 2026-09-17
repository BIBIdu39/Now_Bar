using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;

namespace NowBar {
    class AmazonTest {
        [DllImport("user32.dll")]
        static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

        const int SW_MINIMIZE = 6;
        const int SW_SHOWMINNOACTIVE = 7;
        const byte VK_MEDIA_PLAY_PAUSE = 0xB3;
        const uint KEYEVENTF_KEYUP = 0x0002;

        static void Main(string[] args) {
            Console.WriteLine("STARTING_AMAZON_MUSIC");
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = "explorer.exe";
            psi.Arguments = @"shell:AppsFolder\AmazonMobileLLC.AmazonMusic_kc6t79cpj4tp0!AmazonMobileLLC.AmazonMusic";
            psi.UseShellExecute = true;
            Process.Start(psi);

            // Wait a moment for window to appear and minimize it
            for (int i = 0; i < 20; i++) {
                Thread.Sleep(200);
                Process[] procs = Process.GetProcessesByName("Amazon Music");
                if (procs.Length == 0) {
                    procs = Process.GetProcessesByName("AmazonMusic");
                }
                foreach (var p in procs) {
                    if (p.MainWindowHandle != IntPtr.Zero) {
                        ShowWindowAsync(p.MainWindowHandle, SW_MINIMIZE);
                        Console.WriteLine("MINIMIZED_SUCCESS");
                        i = 20; // break loop
                        break;
                    }
                }
            }

            // Wait for audio engine to initialize and trigger play
            Thread.Sleep(1000);
            keybd_event(VK_MEDIA_PLAY_PAUSE, 0, 0, UIntPtr.Zero);
            keybd_event(VK_MEDIA_PLAY_PAUSE, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
            Console.WriteLine("PLAY_TRIGGERED");
        }
    }
}

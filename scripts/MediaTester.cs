using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace NowBar {
    class MediaTester {
        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

        const byte VK_MEDIA_NEXT_TRACK = 0xB0;
        const byte VK_MEDIA_PREV_TRACK = 0xB1;
        const byte VK_MEDIA_PLAY_PAUSE = 0xB3;
        const uint KEYEVENTF_KEYUP = 0x0002;

        public static void SendKey(byte vk) {
            keybd_event(vk, 0, 0, UIntPtr.Zero);
            keybd_event(vk, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        }

        static void Main(string[] args) {
            if (args.Length > 0) {
                switch (args[0].ToLower()) {
                    case "playpause":
                        SendKey(VK_MEDIA_PLAY_PAUSE);
                        Console.WriteLine("PLAY_PAUSE_SENT");
                        break;
                    case "next":
                        SendKey(VK_MEDIA_NEXT_TRACK);
                        Console.WriteLine("NEXT_SENT");
                        break;
                    case "prev":
                        SendKey(VK_MEDIA_PREV_TRACK);
                        Console.WriteLine("PREV_SENT");
                        break;
                }
            } else {
                Console.WriteLine("READY");
            }
        }
    }
}

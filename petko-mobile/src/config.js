// ============================================================
// ⚠️  IMPORTANT — READ BEFORE RUNNING THE APP
// ============================================================
// This file controls which server the mobile app connects to.
//
// You MUST update API_BASE to your own machine's local IP
// before running the app on your device or emulator.
//
// HOW TO FIND YOUR IP:
//   Windows → open Command Prompt → type: ipconfig
//             look for "IPv4 Address" under your Wi-Fi adapter
//   Mac/Linux → open Terminal → type: ifconfig or ip addr
//
// REQUIREMENTS:
//   • Your phone and PC must be on the SAME Wi-Fi network
//   • Laravel must be running with: php artisan serve --host=0.0.0.0 --port=8000
//   • Replace the IP below with YOUR machine's IPv4 address
//
// EXAMPLE:
//   export const API_BASE = 'http://192.168.1.25:8000';
//
// DO NOT use 'localhost' or '127.0.0.1' — it will not work on a physical device.
// ============================================================

export const API_BASE = 'http://192.168.5.172:8000';

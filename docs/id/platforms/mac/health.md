---
read_when:
    - Melakukan debug pada indikator kesehatan aplikasi Mac
summary: Cara aplikasi macOS melaporkan status kesehatan gateway/Baileys
title: Pemeriksaan Kesehatan (macOS)
x-i18n:
    generated_at: "2026-04-05T14:00:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9223b2bbe272b32526f79cf878510ac5104e788402d94a1b1627e72c5fbebf5
    source_path: platforms/mac/health.md
    workflow: 15
---

# Pemeriksaan Kesehatan di macOS

Cara melihat apakah channel yang terhubung dalam kondisi sehat dari aplikasi menu bar.

## Menu bar

- Titik status kini mencerminkan kesehatan Baileys:
  - Hijau: tertaut + socket baru saja dibuka.
  - Oranye: sedang menghubungkan/mencoba lagi.
  - Merah: logout atau probe gagal.
- Baris sekunder menampilkan "linked · auth 12m" atau menunjukkan alasan kegagalan.
- Item menu "Run Health Check" memicu probe sesuai permintaan.

## Settings

- Tab General mendapatkan kartu Health yang menampilkan: usia autentikasi yang tertaut, path/jumlah session-store, waktu pemeriksaan terakhir, error/kode status terakhir, serta tombol Run Health Check / Reveal Logs.
- Menggunakan snapshot yang di-cache agar UI langsung dimuat dan melakukan fallback dengan baik saat offline.
- **Tab Channels** menampilkan status channel + kontrol untuk WhatsApp/Telegram (login QR, logout, probe, disconnect/error terakhir).

## Cara kerja probe

- Aplikasi menjalankan `openclaw health --json` melalui `ShellExecutor` setiap ~60 detik dan sesuai permintaan. Probe memuat kredensial dan melaporkan status tanpa mengirim pesan.
- Cache snapshot baik terakhir dan error terakhir secara terpisah untuk menghindari flicker; tampilkan timestamp masing-masing.

## Jika ragu

- Anda tetap dapat menggunakan alur CLI di [Kesehatan gateway](/id/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) dan melakukan tail pada `/tmp/openclaw/openclaw-*.log` untuk `web-heartbeat` / `web-reconnect`.

---
read_when:
    - Men-debug indikator kesehatan aplikasi macોકે
summary: Bagaimana aplikasi macOS melaporkan status kesehatan gateway/Baileys
title: Pemeriksaan kesehatan (macOS)
x-i18n:
    generated_at: "2026-04-24T09:17:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 15
---

# Pemeriksaan Kesehatan di macOS

Cara melihat apakah saluran yang terhubung dalam keadaan sehat dari aplikasi menu bar.

## Menu bar

- Titik status sekarang mencerminkan kesehatan Baileys:
  - Hijau: tertaut + socket baru saja dibuka.
  - Oranye: sedang menghubungkan/mencoba ulang.
  - Merah: logout atau probe gagal.
- Baris sekunder berbunyi "linked · auth 12m" atau menampilkan alasan kegagalan.
- Item menu "Run Health Check" memicu probe sesuai permintaan.

## Pengaturan

- Tab General mendapatkan kartu Health yang menampilkan: usia auth tertaut, path/jumlah session-store, waktu pemeriksaan terakhir, error/status code terakhir, serta tombol Run Health Check / Reveal Logs.
- Menggunakan snapshot cache sehingga UI dimuat seketika dan fallback dengan baik saat offline.
- **Tab Channels** menampilkan status saluran + kontrol untuk WhatsApp/Telegram (QR login, logout, probe, disconnect/error terakhir).

## Cara kerja probe

- Aplikasi menjalankan `openclaw health --json` melalui `ShellExecutor` setiap ~60 detik dan sesuai permintaan. Probe memuat kredensial dan melaporkan status tanpa mengirim pesan.
- Cache snapshot baik terakhir dan error terakhir secara terpisah untuk menghindari flicker; tampilkan stempel waktu masing-masing.

## Saat ragu

- Anda tetap dapat menggunakan alur CLI di [Kesehatan Gateway](/id/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) dan melakukan tail pada `/tmp/openclaw/openclaw-*.log` untuk `web-heartbeat` / `web-reconnect`.

## Terkait

- [Kesehatan Gateway](/id/gateway/health)
- [Aplikasi macOS](/id/platforms/macos)

---
read_when:
    - Men-debug indikator kesehatan aplikasi Mac
summary: Cara aplikasi macOS melaporkan status kesehatan Gateway/saluran
title: Pemeriksaan kesehatan (macOS)
x-i18n:
    generated_at: "2026-07-12T14:23:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# Pemeriksaan kesehatan di macOS

Cara membaca status kesehatan kanal tertaut dari aplikasi bilah menu.

## Bilah menu

Titik status:

- Hijau: tertaut + pemeriksaan sehat.
- Oranye: tertaut, tetapi pemeriksaan kanal melaporkan kondisi menurun/tidak terhubung.
- Merah: belum tertaut.

Baris sekunder menampilkan "tertaut · autentikasi 12m" atau menunjukkan alasan kegagalan.
"Jalankan Pemeriksaan Kesehatan Sekarang" dalam menu memicu pemeriksaan sesuai permintaan.

## Pengaturan

- Tab Umum menampilkan kartu Kesehatan: titik status, baris ringkasan (status tautan +
  usia autentikasi), serta baris detail kegagalan opsional, dengan tombol **Coba lagi sekarang** dan
  **Buka log**.
- **Tab Kanal** menampilkan status dan kontrol per kanal (QR masuk,
  keluar, pemeriksaan, pemutusan/kesalahan terakhir) untuk WhatsApp dan Telegram.

## Cara kerja pemeriksaan

Aplikasi memanggil RPC `health` milik Gateway melalui koneksi WebSocket
yang sudah ada (bukan menjalankan shell CLI) setiap ~60 detik dan sesuai permintaan. RPC memuat
kredensial dan melaporkan status tanpa mengirim pesan. Aplikasi menyimpan cache snapshot baik terakhir
dan kesalahan terakhir secara terpisah agar UI dimuat seketika dan
tidak berkedip saat luring.

## Jika ragu

Gunakan alur CLI di [Kesehatan Gateway](/id/gateway/health) (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) dan pantau
`/tmp/openclaw/openclaw-*.log`, dengan memfilter `web-heartbeat` / `web-reconnect`.

## Terkait

- [Kesehatan Gateway](/id/gateway/health)
- [Aplikasi macOS](/id/platforms/macos)

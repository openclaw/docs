---
read_when:
    - Memodifikasi pipeline media atau lampiran
summary: Aturan penanganan gambar dan media untuk send, gateway, dan balasan agen
title: Dukungan Gambar dan Media
x-i18n:
    generated_at: "2026-04-05T13:59:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3bb372b45a3bae51eae03b41cb22c4cde144675a54ddfd12e01a96132e48a8a
    source_path: nodes/images.md
    workflow: 15
---

# Dukungan Gambar & Media (2025-12-05)

Channel WhatsApp berjalan melalui **Baileys Web**. Dokumen ini menjelaskan aturan penanganan media saat ini untuk send, gateway, dan balasan agen.

## Tujuan

- Mengirim media dengan caption opsional melalui `openclaw message send --media`.
- Memungkinkan balasan otomatis dari inbox web menyertakan media bersama teks.
- Menjaga batas per jenis tetap masuk akal dan dapat diprediksi.

## Surface CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` opsional; caption boleh kosong untuk pengiriman hanya media.
  - `--dry-run` mencetak payload yang telah di-resolve; `--json` mengeluarkan `{ channel, to, messageId, mediaUrl, caption }`.

## Perilaku channel WhatsApp Web

- Input: jalur file lokal **atau** URL HTTP(S).
- Alur: muat ke Buffer, deteksi jenis media, dan bangun payload yang benar:
  - **Gambar:** ubah ukuran & kompres ulang ke JPEG (sisi maksimum 2048px) dengan target `channels.whatsapp.mediaMaxMb` (default: 50 MB).
  - **Audio/Voice/Video:** pass-through hingga 16 MB; audio dikirim sebagai voice note (`ptt: true`).
  - **Dokumen:** apa pun selain itu, hingga 100 MB, dengan nama file dipertahankan jika tersedia.
- Pemutaran gaya GIF WhatsApp: kirim MP4 dengan `gifPlayback: true` (CLI: `--gif-playback`) agar klien seluler memutar berulang secara inline.
- Deteksi MIME memprioritaskan magic bytes, lalu header, lalu ekstensi file.
- Caption berasal dari `--message` atau `reply.text`; caption kosong diperbolehkan.
- Logging: mode non-verbose menampilkan `↩️`/`✅`; mode verbose menyertakan ukuran dan jalur/URL sumber.

## Pipeline Balasan Otomatis

- `getReplyFromConfig` mengembalikan `{ text?, mediaUrl?, mediaUrls? }`.
- Saat media ada, pengirim web me-resolve jalur lokal atau URL menggunakan pipeline yang sama seperti `openclaw message send`.
- Jika beberapa entri media disediakan, semuanya dikirim secara berurutan.

## Media Masuk ke Perintah (Pi)

- Saat pesan web masuk menyertakan media, OpenClaw mengunduh ke file sementara dan mengekspos variabel templating:
  - `{{MediaUrl}}` pseudo-URL untuk media masuk.
  - `{{MediaPath}}` jalur lokal sementara yang ditulis sebelum menjalankan perintah.
- Saat sandbox Docker per sesi diaktifkan, media masuk disalin ke workspace sandbox dan `MediaPath`/`MediaUrl` ditulis ulang menjadi jalur relatif seperti `media/inbound/<filename>`.
- Media understanding (jika dikonfigurasi melalui `tools.media.*` atau `tools.media.models` bersama) berjalan sebelum templating dan dapat menyisipkan blok `[Image]`, `[Audio]`, dan `[Video]` ke dalam `Body`.
  - Audio menetapkan `{{Transcript}}` dan menggunakan transkrip untuk parsing perintah agar slash command tetap berfungsi.
  - Deskripsi video dan gambar mempertahankan teks caption apa pun untuk parsing perintah.
  - Jika model gambar utama aktif sudah mendukung vision secara native, OpenClaw melewati blok ringkasan `[Image]` dan sebagai gantinya meneruskan gambar asli ke model.
- Secara default hanya lampiran gambar/audio/video pertama yang cocok yang diproses; setel `tools.media.<cap>.attachments` untuk memproses beberapa lampiran.

## Batas & Error

**Batas pengiriman keluar (pengiriman web WhatsApp)**

- Gambar: hingga `channels.whatsapp.mediaMaxMb` (default: 50 MB) setelah kompres ulang.
- Audio/voice/video: batas 16 MB; dokumen: 100 MB.
- Media terlalu besar atau tidak dapat dibaca → error yang jelas di log dan balasan dilewati.

**Batas media understanding (transkripsi/deskripsi)**

- Default gambar: 10 MB (`tools.media.image.maxBytes`).
- Default audio: 20 MB (`tools.media.audio.maxBytes`).
- Default video: 50 MB (`tools.media.video.maxBytes`).
- Media yang terlalu besar melewati understanding, tetapi balasan tetap berjalan dengan body asli.

## Catatan untuk Pengujian

- Cakup alur send + reply untuk kasus gambar/audio/dokumen.
- Validasi kompres ulang untuk gambar (batas ukuran) dan flag voice-note untuk audio.
- Pastikan balasan multi-media menyebar sebagai pengiriman berurutan.

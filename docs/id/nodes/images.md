---
read_when:
    - Memodifikasi pipeline media atau lampiran
summary: Aturan penanganan gambar dan media untuk kirim, Gateway, dan balasan agen
title: Dukungan gambar dan media
x-i18n:
    generated_at: "2026-04-24T09:15:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26fa460f7dcdac9f15c9d79c3c3370adbce526da5cfa9a6825a8ed20b41e0a29
    source_path: nodes/images.md
    workflow: 15
---

# Dukungan Gambar & Media (2025-12-05)

Channel WhatsApp berjalan melalui **Baileys Web**. Dokumen ini menangkap aturan penanganan media saat ini untuk pengiriman, Gateway, dan balasan agen.

## Tujuan

- Kirim media dengan caption opsional melalui `openclaw message send --media`.
- Izinkan balasan otomatis dari inbox web untuk menyertakan media bersama teks.
- Jaga batas per jenis tetap masuk akal dan dapat diprediksi.

## Permukaan CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` opsional; caption dapat kosong untuk pengiriman media-saja.
  - `--dry-run` mencetak payload hasil resolve; `--json` mengeluarkan `{ channel, to, messageId, mediaUrl, caption }`.

## Perilaku channel WhatsApp Web

- Input: path file lokal **atau** URL HTTP(S).
- Alur: muat ke Buffer, deteksi jenis media, dan bangun payload yang benar:
  - **Gambar:** ubah ukuran & kompres ulang ke JPEG (sisi maksimum 2048px) dengan target `channels.whatsapp.mediaMaxMb` (default: 50 MB).
  - **Audio/Voice/Video:** pass-through hingga 16 MB; audio dikirim sebagai voice note (`ptt: true`).
  - **Dokumen:** apa pun selain itu, hingga 100 MB, dengan nama file dipertahankan jika tersedia.
- Pemutaran gaya GIF WhatsApp: kirim MP4 dengan `gifPlayback: true` (CLI: `--gif-playback`) agar klien seluler memutar ulang secara inline.
- Deteksi MIME mengutamakan magic bytes, lalu header, lalu ekstensi file.
- Caption berasal dari `--message` atau `reply.text`; caption kosong diperbolehkan.
- Logging: non-verbose menampilkan `↩️`/`✅`; verbose mencakup ukuran dan path/URL sumber.

## Pipeline Balasan Otomatis

- `getReplyFromConfig` mengembalikan `{ text?, mediaUrl?, mediaUrls? }`.
- Saat media ada, pengirim web me-resolve path lokal atau URL menggunakan pipeline yang sama seperti `openclaw message send`.
- Beberapa entri media dikirim secara berurutan jika disediakan.

## Media Masuk ke Perintah (Pi)

- Saat pesan web masuk menyertakan media, OpenClaw mengunduhnya ke file sementara dan mengekspos variabel template:
  - `{{MediaUrl}}` pseudo-URL untuk media masuk.
  - `{{MediaPath}}` path lokal sementara yang ditulis sebelum menjalankan perintah.
- Saat sandbox Docker per sesi diaktifkan, media masuk disalin ke workspace sandbox dan `MediaPath`/`MediaUrl` ditulis ulang ke path relatif seperti `media/inbound/<filename>`.
- Pemahaman media (jika dikonfigurasi melalui `tools.media.*` atau `tools.media.models` bersama) berjalan sebelum templating dan dapat menyisipkan blok `[Image]`, `[Audio]`, dan `[Video]` ke dalam `Body`.
  - Audio menyetel `{{Transcript}}` dan menggunakan transkrip untuk parsing perintah agar slash command tetap berfungsi.
  - Deskripsi video dan gambar mempertahankan teks caption apa pun untuk parsing perintah.
  - Jika model gambar utama aktif sudah mendukung vision secara native, OpenClaw melewati blok ringkasan `[Image]` dan meneruskan gambar asli ke model sebagai gantinya.
- Secara default hanya lampiran gambar/audio/video pertama yang cocok yang diproses; setel `tools.media.<cap>.attachments` untuk memproses beberapa lampiran.

## Batasan & Error

**Batas pengiriman keluar (pengiriman web WhatsApp)**

- Gambar: hingga `channels.whatsapp.mediaMaxMb` (default: 50 MB) setelah kompres ulang.
- Audio/voice/video: batas 16 MB; dokumen: batas 100 MB.
- Media terlalu besar atau tidak dapat dibaca → error yang jelas di log dan balasan dilewati.

**Batas pemahaman media (transkripsi/deskripsi)**

- Default gambar: 10 MB (`tools.media.image.maxBytes`).
- Default audio: 20 MB (`tools.media.audio.maxBytes`).
- Default video: 50 MB (`tools.media.video.maxBytes`).
- Media terlalu besar melewati pemahaman, tetapi balasan tetap berjalan dengan body asli.

## Catatan untuk pengujian

- Cakup alur pengiriman + balasan untuk kasus gambar/audio/dokumen.
- Validasi kompres ulang untuk gambar (terikat ukuran) dan flag voice-note untuk audio.
- Pastikan balasan multi-media menyebar sebagai pengiriman berurutan.

## Terkait

- [Pengambilan kamera](/id/nodes/camera)
- [Pemahaman media](/id/nodes/media-understanding)
- [Audio dan voice note](/id/nodes/audio)

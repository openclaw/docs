---
read_when:
    - Memodifikasi pipeline media atau lampiran
summary: Aturan penanganan gambar dan media untuk pengiriman, gateway, dan balasan agen
title: Dukungan gambar dan media
x-i18n:
    generated_at: "2026-06-27T17:40:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeee181cae2798b7d0f5dbe0331c6b09612755b4d796d98baaeaf6989955def5
    source_path: nodes/images.md
    workflow: 16
---

Saluran WhatsApp berjalan melalui **Baileys Web**. Dokumen ini mencatat aturan penanganan media saat ini untuk pengiriman, Gateway, dan balasan agen.

## Tujuan

- Mengirim media dengan takarir opsional melalui `openclaw message send --media`.
- Mengizinkan balasan otomatis dari kotak masuk web untuk menyertakan media bersama teks.
- Menjaga batas per jenis tetap wajar dan mudah diprediksi.

## Permukaan CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` opsional; takarir dapat kosong untuk pengiriman media saja.
  - `--dry-run` mencetak payload yang di-resolve; `--json` menghasilkan `{ channel, to, messageId, mediaUrl, caption }`.

## Perilaku saluran WhatsApp Web

- Input: jalur file lokal **atau** URL HTTP(S).
- Alur: muat ke Buffer, deteksi jenis media, dan buat payload yang benar:
  - **Gambar:** ubah ukuran & kompres ulang ke JPEG (sisi maksimum 2048px) dengan target `channels.whatsapp.mediaMaxMb` (default: 50 MB).
  - **Audio/Suara/Video:** diteruskan apa adanya hingga 16 MB; audio dikirim sebagai catatan suara (`ptt: true`).
  - **Dokumen:** selain itu, hingga 100 MB, dengan nama file dipertahankan jika tersedia.
- Pemutaran bergaya GIF WhatsApp: kirim MP4 dengan `gifPlayback: true` (CLI: `--gif-playback`) agar klien seluler memutar berulang secara inline.
- Deteksi MIME memprioritaskan byte tanda tangan, lalu header, lalu ekstensi file.
- Takarir berasal dari `--message` atau `reply.text`; takarir kosong diperbolehkan.
- Logging: non-verbose menampilkan `↩️`/`✅`; verbose menyertakan ukuran dan jalur/URL sumber.

## Pipeline Balasan Otomatis

- `getReplyFromConfig` mengembalikan `{ text?, mediaUrl?, mediaUrls? }`.
- Saat media ada, pengirim web me-resolve jalur lokal atau URL menggunakan pipeline yang sama seperti `openclaw message send`.
- Beberapa entri media dikirim secara berurutan jika disediakan.

## Media Masuk Ke Perintah

- Saat pesan web masuk menyertakan media, OpenClaw mengunduhnya ke file sementara dan mengekspos variabel templating:
  - Pseudo-URL `{{MediaUrl}}` untuk media masuk.
  - Jalur sementara lokal `{{MediaPath}}` yang ditulis sebelum menjalankan perintah.
- Saat sandbox Docker per sesi diaktifkan, media masuk disalin ke ruang kerja sandbox dan `MediaPath`/`MediaUrl` ditulis ulang menjadi jalur relatif seperti `media/inbound/<filename>`.
- Pemahaman media (jika dikonfigurasi melalui `tools.media.*` atau `tools.media.models` bersama) berjalan sebelum templating dan dapat menyisipkan blok `[Image]`, `[Audio]`, dan `[Video]` ke dalam `Body`.
  - Audio menetapkan `{{Transcript}}` dan menggunakan transkrip untuk parsing perintah agar perintah slash tetap berfungsi.
  - Deskripsi video dan gambar mempertahankan teks takarir apa pun untuk parsing perintah.
  - Jika model gambar utama aktif sudah mendukung visi secara native, OpenClaw melewati blok ringkasan `[Image]` dan sebagai gantinya meneruskan gambar asli ke model.
- Secara default hanya lampiran gambar/audio/video pertama yang cocok yang diproses; atur `tools.media.<cap>.attachments` untuk memproses beberapa lampiran.

## Batas dan kesalahan

**Batas pengiriman keluar (pengiriman web WhatsApp)**

- Gambar: hingga `channels.whatsapp.mediaMaxMb` (default: 50 MB) setelah kompresi ulang.
- Audio/suara/video: batas 16 MB; dokumen: batas 100 MB.
- Media terlalu besar atau tidak dapat dibaca → kesalahan jelas di log dan balasan dilewati.

**Batas pemahaman media (transkripsi/deskripsi)**

- Default gambar: 10 MB (`tools.media.image.maxBytes`).
- Default audio: 20 MB (`tools.media.audio.maxBytes`).
- Default video: 50 MB (`tools.media.video.maxBytes`).
- Media terlalu besar melewati pemahaman, tetapi balasan tetap berjalan dengan isi asli.

## Catatan untuk Pengujian

- Cakup alur pengiriman + balasan untuk kasus gambar/audio/dokumen.
- Validasi kompresi ulang untuk gambar (batas ukuran) dan flag catatan suara untuk audio.
- Pastikan balasan multi-media menyebar sebagai pengiriman berurutan.

## Terkait

- [Pengambilan kamera](/id/nodes/camera)
- [Pemahaman media](/id/nodes/media-understanding)
- [Audio dan catatan suara](/id/nodes/audio)

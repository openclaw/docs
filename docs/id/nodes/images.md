---
read_when:
    - Memodifikasi alur pemrosesan media atau lampiran
summary: Aturan penanganan gambar dan media untuk send, Gateway, dan balasan agen
title: Dukungan gambar dan media
x-i18n:
    generated_at: "2026-05-06T17:57:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 069140a3ad3bade166d4576ead604b4675006a01e546672872379ce83291471c
    source_path: nodes/images.md
    workflow: 16
---

Kanal WhatsApp berjalan melalui **Baileys Web**. Dokumen ini mencatat aturan penanganan media saat ini untuk pengiriman, Gateway, dan balasan agen.

## Tujuan

- Mengirim media dengan keterangan opsional melalui `openclaw message send --media`.
- Memungkinkan balasan otomatis dari kotak masuk web menyertakan media bersama teks.
- Menjaga batas per jenis tetap wajar dan dapat diprediksi.

## Permukaan CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` opsional; keterangan dapat kosong untuk pengiriman media saja.
  - `--dry-run` mencetak payload yang sudah diselesaikan; `--json` menghasilkan `{ channel, to, messageId, mediaUrl, caption }`.

## Perilaku kanal WhatsApp Web

- Masukan: jalur file lokal **atau** URL HTTP(S).
- Alur: muat ke dalam Buffer, deteksi jenis media, dan bangun payload yang benar:
  - **Gambar:** ubah ukuran & kompres ulang ke JPEG (sisi maksimum 2048px) dengan target `channels.whatsapp.mediaMaxMb` (default: 50 MB).
  - **Audio/Suara/Video:** diteruskan apa adanya hingga 16 MB; audio dikirim sebagai catatan suara (`ptt: true`).
  - **Dokumen:** apa pun lainnya, hingga 100 MB, dengan nama file dipertahankan jika tersedia.
- Pemutaran bergaya GIF WhatsApp: kirim MP4 dengan `gifPlayback: true` (CLI: `--gif-playback`) agar klien seluler memutar berulang langsung dalam percakapan.
- Deteksi MIME memprioritaskan magic bytes, lalu header, lalu ekstensi file.
- Keterangan berasal dari `--message` atau `reply.text`; keterangan kosong diperbolehkan.
- Pencatatan log: mode non-verbose menampilkan `↩️`/`✅`; mode verbose menyertakan ukuran dan jalur/URL sumber.

## Pipeline Balasan Otomatis

- `getReplyFromConfig` mengembalikan `{ text?, mediaUrl?, mediaUrls? }`.
- Saat media ada, pengirim web menyelesaikan jalur lokal atau URL menggunakan pipeline yang sama seperti `openclaw message send`.
- Beberapa entri media dikirim secara berurutan jika disediakan.

## Media masuk ke perintah (Pi)

- Saat pesan web masuk menyertakan media, OpenClaw mengunduhnya ke file sementara dan mengekspos variabel templat:
  - `{{MediaUrl}}` pseudo-URL untuk media masuk.
  - `{{MediaPath}}` jalur sementara lokal yang ditulis sebelum menjalankan perintah.
- Saat sandbox Docker per sesi diaktifkan, media masuk disalin ke workspace sandbox dan `MediaPath`/`MediaUrl` ditulis ulang menjadi jalur relatif seperti `media/inbound/<filename>`.
- Pemahaman media (jika dikonfigurasi melalui `tools.media.*` atau `tools.media.models` bersama) berjalan sebelum pemrosesan templat dan dapat menyisipkan blok `[Image]`, `[Audio]`, dan `[Video]` ke dalam `Body`.
  - Audio menetapkan `{{Transcript}}` dan menggunakan transkrip untuk penguraian perintah sehingga perintah slash tetap berfungsi.
  - Deskripsi video dan gambar mempertahankan teks keterangan apa pun untuk penguraian perintah.
  - Jika model gambar utama yang aktif sudah mendukung vision secara native, OpenClaw melewati blok ringkasan `[Image]` dan meneruskan gambar asli ke model sebagai gantinya.
- Secara default hanya lampiran gambar/audio/video pertama yang cocok yang diproses; tetapkan `tools.media.<cap>.attachments` untuk memproses beberapa lampiran.

## Batas dan kesalahan

**Batas pengiriman keluar (pengiriman web WhatsApp)**

- Gambar: hingga `channels.whatsapp.mediaMaxMb` (default: 50 MB) setelah kompresi ulang.
- Audio/suara/video: batas 16 MB; dokumen: batas 100 MB.
- Media yang terlalu besar atau tidak dapat dibaca → kesalahan yang jelas dalam log dan balasan dilewati.

**Batas pemahaman media (transkripsi/deskripsi)**

- Default gambar: 10 MB (`tools.media.image.maxBytes`).
- Default audio: 20 MB (`tools.media.audio.maxBytes`).
- Default video: 50 MB (`tools.media.video.maxBytes`).
- Media yang terlalu besar melewati pemahaman, tetapi balasan tetap berjalan dengan isi asli.

## Catatan untuk Pengujian

- Cakup alur pengiriman + balasan untuk kasus gambar/audio/dokumen.
- Validasi kompresi ulang untuk gambar (batas ukuran) dan flag catatan suara untuk audio.
- Pastikan balasan multi-media dikirim sebagai pengiriman berurutan.

## Terkait

- [Pengambilan kamera](/id/nodes/camera)
- [Pemahaman media](/id/nodes/media-understanding)
- [Audio dan catatan suara](/id/nodes/audio)

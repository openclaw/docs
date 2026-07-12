---
read_when:
    - Memodifikasi alur media atau lampiran
summary: Aturan penanganan gambar dan media untuk pengiriman, Gateway, dan balasan agen
title: Dukungan gambar dan media
x-i18n:
    generated_at: "2026-07-12T14:20:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

Kanal WhatsApp berjalan di Baileys Web. Halaman ini membahas aturan penanganan media untuk pengiriman, Gateway, dan balasan agen.

## Tujuan

- Mengirim media dengan keterangan opsional melalui `openclaw message send --media`.
- Memungkinkan balasan otomatis dari kotak masuk web menyertakan media bersama teks.
- Menjaga batas per jenis tetap wajar dan dapat diprediksi.

## Antarmuka CLI

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — melampirkan media (gambar/audio/video/dokumen); menerima jalur lokal atau URL. Opsional; keterangan dapat kosong untuk pengiriman media saja.
- `--gif-playback` — memperlakukan media video sebagai pemutaran GIF (khusus WhatsApp).
- `--force-document` — mengirim media sebagai dokumen untuk menghindari kompresi kanal (Telegram, WhatsApp); berlaku untuk gambar, GIF, dan video.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — opsi pengiriman/utas yang juga digunakan untuk pengiriman teks saja.
- `--dry-run` — mencetak muatan yang telah diuraikan dan melewati pengiriman.
- `--json` — mencetak hasil sebagai JSON: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` memuat hasil pengiriman khusus kanal, termasuk referensi media jika ada).

## Perilaku kanal WhatsApp Web

- Masukan: jalur berkas lokal **atau** URL HTTP(S).
- Alur: memuat ke dalam buffer, mendeteksi jenis media, lalu membuat muatan keluar berdasarkan jenis:
  - **Gambar:** dioptimalkan agar berada di bawah `channels.whatsapp.mediaMaxMb` (bawaan 50MB). Gambar tanpa transparansi dikompresi ulang menjadi JPEG (urutan ukuran sisi bawaan dimulai dari 2048px, lalu menurun setiap kali ukuran masih melampaui batas); gambar dengan transparansi dipertahankan sebagai PNG. Jika sumber sudah berupa JPEG/PNG/WebP yang dapat diterima dan berada dalam batas ukuran serta panjang sisi, byte asli dipertahankan tanpa perubahan alih-alih dikompresi ulang. GIF animasi tidak pernah dienkode ulang, hanya diperiksa ukurannya.
  - **Audio/suara:** kecuali sudah berupa audio suara asli (`.ogg`/`.opus`, atau `audio/ogg`/`audio/opus`), audio keluar ditranskode melalui `ffmpeg` menjadi Opus/OGG (mono 48kHz, 64kbps, dibatasi hingga 20 menit) sebelum dikirim sebagai pesan suara (`ptt: true`).
  - **Video:** diteruskan tanpa perubahan hingga 16MB.
  - **Dokumen:** semua jenis lainnya, hingga 100MB, dengan nama berkas dipertahankan jika tersedia.
- Pemutaran bergaya GIF di WhatsApp: kirim MP4 dengan `gifPlayback: true` (CLI: `--gif-playback`) agar klien seluler memutarnya berulang secara langsung.
- Deteksi MIME mengutamakan byte ajaib yang terdeteksi, lalu ekstensi berkas, kemudian header respons; kontainer generik yang terdeteksi (`application/octet-stream`, `zip`) tidak pernah menggantikan pemetaan ekstensi yang lebih spesifik (misalnya XLSX dibandingkan ZIP).
- Keterangan berasal dari `--message` atau `reply.text`; keterangan kosong diperbolehkan.
- Pencatatan log: mode nonverbal menampilkan `↩️`/`✅`; mode verbal menyertakan ukuran dan jalur sumber/URL.

<Note>
Angka 16MB untuk audio/video dan 100MB untuk dokumen di atas adalah nilai bawaan media per jenis yang digunakan bersama ketika batas byte eksplisit tidak diberikan. Pengiriman WhatsApp menetapkan batas eksplisit dari `channels.whatsapp.mediaMaxMb` (bawaan 50MB), yang berlaku secara seragam untuk semua jenis pada akun tersebut.
</Note>

## Alur Balasan Otomatis

- `getReplyFromConfig` mengembalikan muatan balasan (atau larik muatan) dengan `text?`, `mediaUrl?`, dan `mediaUrls?`, beserta bidang lainnya.
- Saat media tersedia, pengirim web menguraikan jalur lokal atau URL menggunakan alur yang sama seperti `openclaw message send`.
- Beberapa entri media dikirim secara berurutan jika disediakan.

## Media Masuk ke Perintah

- Saat pesan web masuk menyertakan media, OpenClaw mengunduhnya ke berkas sementara dan menyediakan variabel templat:
  - `{{MediaUrl}}` — URL semu untuk media masuk.
  - `{{MediaPath}}` — jalur lokal sementara yang ditulis sebelum menjalankan perintah.
- Saat sandbox Docker per sesi diaktifkan, media masuk disalin ke ruang kerja sandbox dan `MediaPath`/`MediaUrl` ditulis ulang menjadi jalur relatif sandbox seperti `media/inbound/<filename>`.
- Pemahaman media (dikonfigurasi melalui `tools.media.*` atau `tools.media.models` bersama) berjalan sebelum penerapan templat dan dapat menyisipkan blok `[Image]`, `[Audio]`, dan `[Video]` ke dalam `Body`.
  - Audio menetapkan `{{Transcript}}` dan menggunakan transkrip untuk penguraian perintah agar perintah garis miring tetap berfungsi.
  - Deskripsi video dan gambar mempertahankan teks keterangan untuk penguraian perintah.
  - Jika model utama aktif sudah mendukung penglihatan secara bawaan, OpenClaw melewati blok ringkasan `[Image]` dan sebagai gantinya meneruskan gambar asli ke model.
- Secara bawaan, hanya lampiran gambar/audio/video pertama yang cocok yang diproses; tetapkan `tools.media.<capability>.attachments` untuk memproses beberapa lampiran.

## Batas dan kesalahan

**Batas pengiriman keluar (pengiriman web WhatsApp)**

- Gambar: hingga `channels.whatsapp.mediaMaxMb` (bawaan 50MB) setelah pengoptimalan.
- Audio/video: batas 16MB (nilai bawaan bersama; digantikan oleh `mediaMaxMb` saat dikirim melalui WhatsApp).
- Dokumen: batas 100MB (nilai bawaan bersama; digantikan oleh `mediaMaxMb` saat dikirim melalui WhatsApp).
- Media yang terlalu besar atau tidak dapat dibaca menghasilkan kesalahan yang jelas dalam log, dan balasan dilewati.

**Batas pemahaman media (transkripsi/deskripsi)**

- Bawaan gambar: 10MB (`tools.media.image.maxBytes`).
- Bawaan audio: 20MB (`tools.media.audio.maxBytes`).
- Bawaan video: 50MB (`tools.media.video.maxBytes`).
- Media yang terlalu besar melewati proses pemahaman, tetapi balasan tetap diteruskan dengan isi asli.

## Catatan untuk Pengujian

- Cakup alur pengiriman dan balasan untuk kasus gambar/audio/dokumen.
- Validasi batas ukuran setelah pengoptimalan gambar dan tanda pesan suara untuk audio.
- Pastikan balasan dengan beberapa media dikembangkan menjadi pengiriman berurutan.

## Terkait

- [Pengambilan gambar kamera](/id/nodes/camera)
- [Pemahaman media](/id/nodes/media-understanding)
- [Audio dan pesan suara](/id/nodes/audio)

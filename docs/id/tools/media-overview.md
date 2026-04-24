---
read_when:
    - Mencari gambaran umum kemampuan media
    - Menentukan provider media mana yang akan dikonfigurasi
    - Memahami cara kerja generasi media async
summary: Halaman arahan terpadu untuk kemampuan generasi media, pemahaman, dan speech
title: Gambaran umum media
x-i18n:
    generated_at: "2026-04-24T09:31:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469fb173ac3853011b8cd4f89f3ab97dd7d14e12e4e1d7d87e84de05d025a593
    source_path: tools/media-overview.md
    workflow: 15
---

# Generasi dan Pemahaman Media

OpenClaw menghasilkan gambar, video, dan musik, memahami media masuk (gambar, audio, video), serta menyuarakan balasan dengan text-to-speech. Semua kemampuan media berbasis alat: agen memutuskan kapan menggunakannya berdasarkan percakapan, dan setiap alat hanya muncul saat setidaknya satu provider pendukung telah dikonfigurasi.

## Gambaran singkat kapabilitas

| Kapabilitas         | Alat             | Provider                                                                                     | Fungsinya                                               |
| ------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Generasi gambar     | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Membuat atau mengedit gambar dari prompt teks atau referensi |
| Generasi video      | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Membuat video dari teks, gambar, atau video yang sudah ada |
| Generasi musik      | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Membuat musik atau trek audio dari prompt teks          |
| Text-to-speech (TTS) | `tts`           | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                  | Mengubah balasan keluar menjadi audio lisan             |
| Pemahaman media     | (otomatis)       | Provider model apa pun yang mendukung vision/audio, ditambah fallback CLI                    | Merangkum gambar, audio, dan video masuk                |

## Matriks kapabilitas provider

Tabel ini menunjukkan provider mana yang mendukung kapabilitas media tertentu di seluruh platform.

| Provider   | Gambar | Video | Musik | TTS | STT / Transkripsi | Pemahaman Media |
| ---------- | ------ | ----- | ----- | --- | ----------------- | --------------- |
| Alibaba    |        | Ya    |       |     |                   |                 |
| BytePlus   |        | Ya    |       |     |                   |                 |
| ComfyUI    | Ya     | Ya    | Ya    |     |                   |                 |
| Deepgram   |        |       |       |     | Ya                |                 |
| ElevenLabs |        |       |       | Ya  | Ya                |                 |
| fal        | Ya     | Ya    |       |     |                   |                 |
| Google     | Ya     | Ya    | Ya    |     |                   | Ya              |
| Microsoft  |        |       |       | Ya  |                   |                 |
| MiniMax    | Ya     | Ya    | Ya    | Ya  |                   |                 |
| Mistral    |        |       |       |     | Ya                |                 |
| OpenAI     | Ya     | Ya    |       | Ya  | Ya                | Ya              |
| Qwen       |        | Ya    |       |     |                   |                 |
| Runway     |        | Ya    |       |     |                   |                 |
| Together   |        | Ya    |       |     |                   |                 |
| Vydra      | Ya     | Ya    |       |     |                   |                 |
| xAI        | Ya     | Ya    |       | Ya  | Ya                | Ya              |

<Note>
Pemahaman media menggunakan provider model apa pun yang mendukung vision atau audio yang terdaftar di konfigurasi provider Anda. Tabel di atas menyoroti provider dengan dukungan pemahaman media khusus; sebagian besar provider LLM dengan model multimodal (Anthropic, Google, OpenAI, dll.) juga dapat memahami media masuk saat dikonfigurasi sebagai model balasan aktif.
</Note>

## Cara kerja generasi async

Generasi video dan musik berjalan sebagai tugas latar belakang karena pemrosesan provider biasanya memerlukan 30 detik hingga beberapa menit. Saat agen memanggil `video_generate` atau `music_generate`, OpenClaw mengirim permintaan ke provider, segera mengembalikan ID tugas, dan melacak job di task ledger. Agen tetap dapat merespons pesan lain saat job berjalan. Saat provider selesai, OpenClaw membangunkan agen agar dapat memposting media yang telah selesai kembali ke channel asal. Generasi gambar dan TTS bersifat sinkron dan selesai inline bersama balasan.

Deepgram, ElevenLabs, Mistral, OpenAI, dan xAI semuanya dapat mentranskripsikan
audio masuk melalui jalur batch `tools.media.audio` saat dikonfigurasi. Deepgram,
ElevenLabs, Mistral, OpenAI, dan xAI juga mendaftarkan provider STT streaming Voice Call, sehingga audio telepon langsung dapat diteruskan ke vendor yang dipilih
tanpa menunggu rekaman selesai.

OpenAI dipetakan ke surface gambar, video, batch TTS, batch STT, Voice Call
streaming STT, voice realtime, dan embedding memori milik OpenClaw. xAI saat ini
dipetakan ke surface gambar, video, pencarian, code-execution, batch TTS, batch STT,
dan Voice Call streaming STT milik OpenClaw. Voice realtime xAI adalah kapabilitas
upstream, tetapi belum didaftarkan di OpenClaw sampai kontrak voice realtime bersama
dapat merepresentasikannya.

## Tautan cepat

- [Generasi Gambar](/id/tools/image-generation) -- menghasilkan dan mengedit gambar
- [Generasi Video](/id/tools/video-generation) -- text-to-video, image-to-video, dan video-to-video
- [Generasi Musik](/id/tools/music-generation) -- membuat musik dan trek audio
- [Text-to-Speech](/id/tools/tts) -- mengubah balasan menjadi audio lisan
- [Pemahaman Media](/id/nodes/media-understanding) -- memahami gambar, audio, dan video masuk

## Terkait

- [Generasi gambar](/id/tools/image-generation)
- [Generasi video](/id/tools/video-generation)
- [Generasi musik](/id/tools/music-generation)
- [Text-to-speech](/id/tools/tts)

---
read_when:
    - Menambahkan atau memodifikasi perintah `openclaw infer`
    - Merancang automasi capability headless yang stabil
summary: CLI infer-first untuk alur kerja model, gambar, audio, TTS, video, web, dan embedding yang didukung provider
title: CLI Inferensi
x-i18n:
    generated_at: "2026-04-26T11:26:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf07b306d80535b58d811aa33c0bbe2ecac57b22c3ab27f6f2ae6518ceb21e49
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` adalah surface headless kanonis untuk alur kerja inferensi yang didukung provider.

Surface ini sengaja mengekspos keluarga capability, bukan nama RPC gateway mentah dan bukan id tool agen mentah.

## Ubah infer menjadi skill

Salin dan tempel ini ke agen:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Skill berbasis infer yang baik seharusnya:

- memetakan intent pengguna umum ke subperintah infer yang benar
- menyertakan beberapa contoh infer kanonis untuk alur kerja yang dicakup
- memilih `openclaw infer ...` dalam contoh dan saran
- menghindari mendokumentasikan ulang seluruh surface infer di dalam isi skill

Cakupan skill yang biasanya berfokus pada infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Mengapa menggunakan infer

`openclaw infer` menyediakan satu CLI yang konsisten untuk tugas inferensi yang didukung provider di dalam OpenClaw.

Manfaat:

- Gunakan provider dan model yang sudah dikonfigurasi di OpenClaw alih-alih menyusun wrapper satu kali untuk setiap backend.
- Pertahankan alur kerja model, gambar, transkripsi audio, TTS, video, web, dan embedding di bawah satu pohon perintah.
- Gunakan bentuk output `--json` yang stabil untuk skrip, automasi, dan alur kerja berbasis agen.
- Pilih surface OpenClaw pihak pertama saat tugas pada dasarnya adalah "menjalankan inferensi."
- Gunakan path lokal normal tanpa memerlukan gateway untuk sebagian besar perintah infer.

Untuk pemeriksaan provider end-to-end, pilih `openclaw infer ...` setelah tes
provider tingkat lebih rendah hijau. Ini menjalankan CLI yang dirilis, pemuatan
config, resolusi agen default, aktivasi Plugin bawaan, perbaikan dependensi runtime,
dan runtime capability bersama sebelum permintaan provider dibuat.

## Pohon perintah

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Tugas umum

Tabel ini memetakan tugas inferensi umum ke perintah infer yang sesuai.

| Tugas                   | Perintah                                                              | Catatan                                               |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Jalankan prompt teks/model | `openclaw infer model run --prompt "..." --json`                    | Menggunakan path lokal normal secara default          |
| Hasilkan gambar         | `openclaw infer image generate --prompt "..." --json`                 | Gunakan `image edit` saat memulai dari file yang ada  |
| Deskripsikan file gambar | `openclaw infer image describe --file ./image.png --json`            | `--model` harus berupa `<provider/model>` yang mendukung gambar |
| Transkripsikan audio    | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` harus berupa `<provider/model>`             |
| Sintesis ucapan         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` berorientasi gateway                   |
| Hasilkan video          | `openclaw infer video generate --prompt "..." --json`                 | Mendukung petunjuk provider seperti `--resolution`    |
| Deskripsikan file video | `openclaw infer video describe --file ./clip.mp4 --json`              | `--model` harus berupa `<provider/model>`             |
| Cari di web             | `openclaw infer web search --query "..." --json`                      |                                                       |
| Ambil halaman web       | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Buat embedding          | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Perilaku

- `openclaw infer ...` adalah surface CLI utama untuk alur kerja ini.
- Gunakan `--json` saat output akan dikonsumsi oleh perintah atau skrip lain.
- Gunakan `--provider` atau `--model provider/model` saat backend tertentu diperlukan.
- Untuk `image describe`, `audio transcribe`, dan `video describe`, `--model` harus menggunakan bentuk `<provider/model>`.
- Untuk `image describe`, `--model` yang eksplisit menjalankan provider/model itu secara langsung. Model harus mendukung gambar di katalog model atau config provider. `codex/<model>` menjalankan giliran pemahaman gambar app-server Codex yang dibatasi; `openai-codex/<model>` menggunakan path provider OAuth OpenAI Codex.
- Perintah eksekusi stateless default ke local.
- Perintah state terkelola gateway default ke gateway.
- Path lokal normal tidak mengharuskan gateway berjalan.
- `model run` adalah one-shot. Server MCP yang dibuka melalui runtime agen untuk perintah tersebut akan dihentikan setelah balasan baik untuk eksekusi local maupun `--gateway`, sehingga pemanggilan skrip berulang tidak membuat proses anak stdio MCP tetap hidup.

## Model

Gunakan `model` untuk inferensi teks yang didukung provider serta inspeksi model/provider.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Catatan:

- `model run` menggunakan kembali runtime agen sehingga override provider/model berperilaku seperti eksekusi agen normal.
- Karena `model run` ditujukan untuk automasi headless, perintah ini tidak mempertahankan runtime MCP bawaan per sesi setelah perintah selesai.
- `model auth login`, `model auth logout`, dan `model auth status` mengelola state auth provider yang disimpan.

## Gambar

Gunakan `image` untuk pembuatan, edit, dan deskripsi.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Catatan:

- Gunakan `image edit` saat memulai dari file input yang sudah ada.
- Gunakan `--size`, `--aspect-ratio`, atau `--resolution` dengan `image edit` untuk
  provider/model yang mendukung petunjuk geometri pada edit gambar referensi.
- Gunakan `--output-format png --background transparent` dengan
  `--model openai/gpt-image-1.5` untuk output PNG OpenAI dengan latar belakang
  transparan; `--openai-background` tetap tersedia sebagai alias khusus OpenAI. Provider
  yang tidak mendeklarasikan dukungan latar belakang akan melaporkan petunjuk itu sebagai override yang diabaikan.
- Gunakan `image providers --json` untuk memverifikasi provider gambar bawaan mana yang
  dapat ditemukan, dikonfigurasi, dipilih, dan capability pembuatan/edit mana
  yang diekspos setiap provider.
- Gunakan `image generate --model <provider/model> --json` sebagai smoke CLI live
  paling sempit untuk perubahan pembuatan gambar. Contoh:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Respons JSON melaporkan `ok`, `provider`, `model`, `attempts`, dan path output
  yang ditulis. Saat `--output` disetel, ekstensi akhir dapat mengikuti tipe MIME
  yang dikembalikan provider.

- Untuk `image describe`, `--model` harus berupa `<provider/model>` yang mendukung gambar.
- Untuk model vision Ollama lokal, pull model terlebih dahulu dan setel `OLLAMA_API_KEY` ke nilai placeholder apa pun, misalnya `ollama-local`. Lihat [Ollama](/id/providers/ollama#vision-and-image-description).

## Audio

Gunakan `audio` untuk transkripsi file.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Catatan:

- `audio transcribe` adalah untuk transkripsi file, bukan manajemen sesi realtime.
- `--model` harus berupa `<provider/model>`.

## TTS

Gunakan `tts` untuk sintesis ucapan dan state provider TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Catatan:

- `tts status` default ke gateway karena mencerminkan state TTS yang dikelola gateway.
- Gunakan `tts providers`, `tts voices`, dan `tts set-provider` untuk memeriksa dan mengonfigurasi perilaku TTS.

## Video

Gunakan `video` untuk pembuatan dan deskripsi.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Catatan:

- `video generate` menerima `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, dan `--timeout-ms` lalu meneruskannya ke runtime pembuatan video.
- `--model` harus berupa `<provider/model>` untuk `video describe`.

## Web

Gunakan `web` untuk alur kerja pencarian dan fetch.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Catatan:

- Gunakan `web providers` untuk memeriksa provider yang tersedia, dikonfigurasi, dan dipilih.

## Embedding

Gunakan `embedding` untuk pembuatan vektor dan inspeksi provider embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Output JSON

Perintah infer menormalkan output JSON di bawah envelope bersama:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Kolom tingkat atas bersifat stabil:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Untuk perintah media yang dihasilkan, `outputs` berisi file yang ditulis oleh OpenClaw. Gunakan
`path`, `mimeType`, `size`, dan dimensi spesifik media apa pun di array tersebut
untuk automasi alih-alih mengurai stdout yang dapat dibaca manusia.

## Jebakan umum

```bash
# Buruk
openclaw infer media image generate --prompt "friendly lobster"

# Baik
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Buruk
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Baik
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Catatan

- `openclaw capability ...` adalah alias untuk `openclaw infer ...`.

## Terkait

- [CLI reference](/id/cli)
- [Models](/id/concepts/models)

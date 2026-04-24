---
read_when:
    - Menambahkan atau memodifikasi perintah `openclaw infer`
    - Merancang otomasi kapabilitas headless yang stabil
summary: CLI infer-first untuk alur kerja model, gambar, audio, TTS, video, web, dan embedding yang didukung provider
title: CLI inferensi
x-i18n:
    generated_at: "2026-04-24T09:01:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a5a2ca9da4b5c26fbd61c271801d50a3d533bd4cc8430aa71f65e2cdc4fdee6
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` adalah surface headless kanonis untuk alur kerja inferensi yang didukung provider.

Perintah ini dengan sengaja mengekspos keluarga kapabilitas, bukan nama RPC Gateway mentah dan bukan id tool agen mentah.

## Ubah infer menjadi skill

Salin dan tempel ini ke agen:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Skill berbasis infer yang baik seharusnya:

- memetakan intent pengguna umum ke subperintah infer yang benar
- menyertakan beberapa contoh infer kanonis untuk alur kerja yang dicakup
- lebih mengutamakan `openclaw infer ...` dalam contoh dan saran
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

- Gunakan provider dan model yang sudah dikonfigurasi di OpenClaw alih-alih memasang wrapper ad hoc untuk setiap backend.
- Pertahankan alur kerja model, gambar, transkripsi audio, TTS, video, web, dan embedding di bawah satu pohon perintah.
- Gunakan bentuk output `--json` yang stabil untuk skrip, otomasi, dan alur kerja yang digerakkan agen.
- Utamakan surface OpenClaw pihak pertama ketika tugasnya pada dasarnya adalah "menjalankan inferensi."
- Gunakan jalur lokal normal tanpa memerlukan Gateway untuk sebagian besar perintah infer.

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

| Tugas                    | Perintah                                                              | Catatan                                               |
| ------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Jalankan prompt teks/model | `openclaw infer model run --prompt "..." --json`                    | Menggunakan jalur lokal normal secara default         |
| Buat gambar              | `openclaw infer image generate --prompt "..." --json`                | Gunakan `image edit` saat memulai dari file yang sudah ada |
| Jelaskan file gambar     | `openclaw infer image describe --file ./image.png --json`            | `--model` harus berupa `<provider/model>` yang mendukung gambar |
| Transkripsikan audio     | `openclaw infer audio transcribe --file ./memo.m4a --json`           | `--model` harus berupa `<provider/model>`             |
| Sintesis ucapan          | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` berorientasi Gateway                  |
| Buat video               | `openclaw infer video generate --prompt "..." --json`                |                                                       |
| Jelaskan file video      | `openclaw infer video describe --file ./clip.mp4 --json`             | `--model` harus berupa `<provider/model>`             |
| Cari di web              | `openclaw infer web search --query "..." --json`                     |                                                       |
| Ambil halaman web        | `openclaw infer web fetch --url https://example.com --json`          |                                                       |
| Buat embedding           | `openclaw infer embedding create --text "..." --json`                |                                                       |

## Perilaku

- `openclaw infer ...` adalah surface CLI utama untuk alur kerja ini.
- Gunakan `--json` saat output akan dikonsumsi oleh perintah atau skrip lain.
- Gunakan `--provider` atau `--model provider/model` saat backend tertentu diperlukan.
- Untuk `image describe`, `audio transcribe`, dan `video describe`, `--model` harus menggunakan bentuk `<provider/model>`.
- Untuk `image describe`, `--model` eksplisit menjalankan provider/model tersebut secara langsung. Model harus mendukung gambar dalam katalog model atau konfigurasi provider. `codex/<model>` menjalankan giliran pemahaman gambar app-server Codex yang dibatasi; `openai-codex/<model>` menggunakan jalur provider OAuth OpenAI Codex.
- Perintah eksekusi stateless default ke lokal.
- Perintah status yang dikelola Gateway default ke Gateway.
- Jalur lokal normal tidak mengharuskan Gateway berjalan.

## Model

Gunakan `model` untuk inferensi teks yang didukung provider serta inspeksi model/provider.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Catatan:

- `model run` menggunakan ulang runtime agen sehingga override provider/model berperilaku seperti eksekusi agen normal.
- `model auth login`, `model auth logout`, dan `model auth status` mengelola status auth provider yang tersimpan.

## Gambar

Gunakan `image` untuk pembuatan, pengeditan, dan deskripsi.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Catatan:

- Gunakan `image edit` saat memulai dari file input yang sudah ada.
- Untuk `image describe`, `--model` harus berupa `<provider/model>` yang mendukung gambar.
- Untuk model vision Ollama lokal, tarik model terlebih dahulu lalu setel `OLLAMA_API_KEY` ke nilai placeholder apa pun, misalnya `ollama-local`. Lihat [Ollama](/id/providers/ollama#vision-and-image-description).

## Audio

Gunakan `audio` untuk transkripsi file.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Catatan:

- `audio transcribe` digunakan untuk transkripsi file, bukan pengelolaan sesi real-time.
- `--model` harus berupa `<provider/model>`.

## TTS

Gunakan `tts` untuk sintesis ucapan dan status provider TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Catatan:

- `tts status` default ke Gateway karena mencerminkan status TTS yang dikelola Gateway.
- Gunakan `tts providers`, `tts voices`, dan `tts set-provider` untuk memeriksa dan mengonfigurasi perilaku TTS.

## Video

Gunakan `video` untuk pembuatan dan deskripsi.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Catatan:

- `--model` harus berupa `<provider/model>` untuk `video describe`.

## Web

Gunakan `web` untuk alur kerja pencarian dan pengambilan.

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

Field tingkat atas bersifat stabil:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

## Kesalahan umum

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

- [Referensi CLI](/id/cli)
- [Models](/id/concepts/models)

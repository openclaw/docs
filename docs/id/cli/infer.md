---
read_when:
    - Menambahkan atau memodifikasi perintah `openclaw infer`
    - Merancang otomatisasi kapabilitas tanpa antarmuka yang stabil
summary: CLI yang mengutamakan inferensi untuk alur kerja model, gambar, audio, TTS, video, web, dan embedding yang didukung penyedia
title: CLI Inferensi
x-i18n:
    generated_at: "2026-05-10T19:28:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05496c5278650c30e5a52dceba105b703258040765f0a3f75268bb514270f15d
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` adalah permukaan headless kanonis untuk alur kerja inferensi yang didukung provider.

Ini sengaja mengekspos keluarga kapabilitas, bukan nama RPC gateway mentah dan bukan id alat agent mentah.

## Ubah infer menjadi kemampuan

Salin dan tempel ini ke agent:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Kemampuan berbasis infer yang baik harus:

- memetakan niat pengguna umum ke subperintah infer yang benar
- menyertakan beberapa contoh infer kanonis untuk alur kerja yang dicakupnya
- mengutamakan `openclaw infer ...` dalam contoh dan saran
- menghindari pendokumentasian ulang seluruh permukaan infer di dalam isi kemampuan

Cakupan kemampuan yang biasanya berfokus pada infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Mengapa menggunakan infer

`openclaw infer` menyediakan satu CLI yang konsisten untuk tugas inferensi yang didukung provider di dalam OpenClaw.

Manfaat:

- Gunakan provider dan model yang sudah dikonfigurasi di OpenClaw alih-alih merangkai wrapper sekali pakai untuk setiap backend.
- Pertahankan alur kerja model, gambar, transkripsi audio, TTS, video, web, dan embedding di bawah satu pohon perintah.
- Gunakan bentuk output `--json` yang stabil untuk skrip, otomatisasi, dan alur kerja yang digerakkan agent.
- Utamakan permukaan OpenClaw pihak pertama saat tugasnya pada dasarnya adalah "menjalankan inferensi."
- Gunakan jalur lokal normal tanpa memerlukan Gateway untuk sebagian besar perintah infer.

Untuk pemeriksaan provider end-to-end, utamakan `openclaw infer ...` setelah pengujian
provider tingkat rendah sudah hijau. Ini menjalankan CLI yang dikirimkan, pemuatan config,
resolusi agent default, aktivasi Plugin bawaan, dan runtime kapabilitas bersama
sebelum permintaan provider dibuat.

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

| Tugas                        | Perintah                                                                                      | Catatan                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Jalankan prompt teks/model    | `openclaw infer model run --prompt "..." --json`                                              | Menggunakan jalur lokal normal secara default         |
| Jalankan prompt model pada gambar | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Ulangi `--file` untuk beberapa input gambar           |
| Buat gambar                  | `openclaw infer image generate --prompt "..." --json`                                         | Gunakan `image edit` saat memulai dari file yang ada  |
| Deskripsikan file gambar     | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` harus berupa `<provider/model>` yang mendukung gambar |
| Transkripsikan audio         | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` harus berupa `<provider/model>`             |
| Sintesis ucapan              | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` berorientasi Gateway                     |
| Buat video                   | `openclaw infer video generate --prompt "..." --json`                                         | Mendukung petunjuk provider seperti `--resolution`    |
| Deskripsikan file video      | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` harus berupa `<provider/model>`             |
| Cari di web                  | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Ambil halaman web            | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Buat embedding               | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Perilaku

- `openclaw infer ...` adalah permukaan CLI utama untuk alur kerja ini.
- Gunakan `--json` saat output akan dikonsumsi oleh perintah atau skrip lain.
- Gunakan `--provider` atau `--model provider/model` saat backend tertentu diperlukan.
- Gunakan `model run --thinking <level>` untuk meneruskan tingkat berpikir/penalaran satu kali (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh`, atau `max`) sambil menjaga run tetap mentah.
- Untuk `image describe`, `audio transcribe`, dan `video describe`, `--model` harus menggunakan bentuk `<provider/model>`.
- Untuk `image describe`, `--model` eksplisit menjalankan provider/model tersebut secara langsung. Model harus mendukung gambar di katalog model atau config provider. `codex/<model>` menjalankan giliran pemahaman gambar app-server Codex yang terbatas; `openai-codex/<model>` menggunakan jalur provider OAuth OpenAI Codex.
- Perintah eksekusi stateless default ke lokal.
- Perintah status yang dikelola Gateway default ke Gateway.
- Jalur lokal normal tidak memerlukan Gateway berjalan.
- `model run` lokal adalah completion provider satu kali yang ringan. Ini me-resolve model agent dan auth yang dikonfigurasi, tetapi tidak memulai giliran chat-agent, memuat alat, atau membuka server MCP bawaan.
- `model run --file` menerima file gambar, mendeteksi tipe MIME-nya, dan mengirimkannya bersama prompt yang diberikan ke model yang dipilih. Ulangi `--file` untuk beberapa gambar.
- `model run --file` menolak input non-gambar. Gunakan `infer audio transcribe` untuk file audio dan `infer video describe` untuk file video.
- `model run --gateway` menjalankan routing Gateway, auth tersimpan, pemilihan provider, dan runtime tertanam, tetapi tetap berjalan sebagai probe model mentah: ini mengirim prompt yang diberikan dan lampiran gambar apa pun tanpa transkrip sesi sebelumnya, konteks bootstrap/AGENTS, perakitan context-engine, alat, atau server MCP bawaan.
- `model run --gateway --model <provider/model>` memerlukan kredensial Gateway operator tepercaya karena permintaan meminta Gateway menjalankan override provider/model satu kali.
- `model run --thinking` lokal menggunakan jalur provider-completion yang ringan; tingkat khusus provider seperti `adaptive` dan `max` dipetakan ke tingkat simple-completion portabel terdekat.

## Model

Gunakan `model` untuk inferensi teks yang didukung provider dan inspeksi model/provider.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Gunakan ref lengkap `<provider/model>` untuk smoke-test provider tertentu tanpa
memulai Gateway atau memuat seluruh permukaan alat agent:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Catatan:

- `model run` lokal adalah smoke CLI paling sempit untuk kesehatan provider/model/auth karena, untuk provider non-Codex, ini hanya mengirim prompt yang diberikan ke model yang dipilih.
- `model run --model <provider/model>` lokal dapat menggunakan baris katalog statis bawaan yang persis dari `models list --all` sebelum provider tersebut ditulis ke config. Auth provider tetap diperlukan; kredensial yang hilang gagal sebagai error auth, bukan `Unknown model`.
- Untuk probe penalaran Mistral Medium 3.5, biarkan temperature tidak disetel/default. Mistral menolak `reasoning_effort="high"` plus `temperature: 0`; gunakan `mistral/mistral-medium-3-5` dengan temperature default atau nilai mode penalaran non-nol seperti `0.7`.
- Probe lokal `openai-codex/*` adalah pengecualian sempit: OpenClaw menambahkan instruksi sistem minimal agar transport Codex Responses dapat mengisi field `instructions` yang diwajibkan, tanpa menambahkan konteks agent penuh, alat, memori, atau transkrip sesi.
- `model run --file` lokal mempertahankan jalur ringan tersebut dan melampirkan konten gambar langsung ke satu pesan pengguna. File gambar umum seperti PNG, JPEG, dan WebP berfungsi saat tipe MIME-nya terdeteksi sebagai `image/*`; file yang tidak didukung atau tidak dikenali gagal sebelum provider dipanggil.
- `model run --file` paling cocok saat Anda ingin menguji model teks multimodal yang dipilih secara langsung. Gunakan `infer image describe` saat Anda menginginkan pemilihan provider pemahaman gambar OpenClaw dan routing model gambar default.
- Model yang dipilih harus mendukung input gambar; model khusus teks dapat menolak permintaan di lapisan provider.
- `model run --prompt` harus berisi teks non-whitespace; prompt kosong ditolak sebelum provider lokal atau Gateway dipanggil.
- `model run` lokal keluar non-nol saat provider tidak mengembalikan output teks, sehingga provider lokal yang tidak dapat dijangkau dan completion kosong tidak tampak seperti probe yang berhasil.
- Gunakan `model run --gateway` saat Anda perlu menguji routing Gateway, penyiapan agent-runtime, atau status provider yang dikelola Gateway sambil menjaga input model tetap mentah. Gunakan `openclaw agent` atau permukaan chat saat Anda menginginkan konteks agent penuh, alat, memori, dan transkrip sesi.
- `model auth login`, `model auth logout`, dan `model auth status` mengelola status auth provider yang disimpan.

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
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Catatan:

- Gunakan `image edit` saat memulai dari file input yang sudah ada.
- Gunakan `--size`, `--aspect-ratio`, atau `--resolution` dengan `image edit` untuk
  penyedia/model yang mendukung petunjuk geometri pada pengeditan gambar referensi.
- Gunakan `--output-format png --background transparent` dengan
  `--model openai/gpt-image-1.5` untuk output PNG OpenAI berlatar belakang transparan;
  `--openai-background` tetap tersedia sebagai alias khusus OpenAI. Penyedia
  yang tidak mendeklarasikan dukungan latar belakang melaporkan petunjuk tersebut sebagai override yang diabaikan.
- Gunakan `image providers --json` untuk memverifikasi penyedia gambar bawaan mana yang
  dapat ditemukan, dikonfigurasi, dipilih, dan kapabilitas pembuatan/pengeditan mana
  yang diekspos oleh tiap penyedia.
- Gunakan `image generate --model <provider/model> --json` sebagai smoke CLI live paling sempit
  untuk perubahan pembuatan gambar. Contoh:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Respons JSON melaporkan `ok`, `provider`, `model`, `attempts`, dan jalur output
  yang ditulis. Saat `--output` ditetapkan, ekstensi akhir dapat mengikuti
  jenis MIME yang dikembalikan penyedia.

- Untuk `image describe` dan `image describe-many`, gunakan `--prompt` untuk memberi model visi instruksi khusus tugas seperti OCR, perbandingan, inspeksi UI, atau pembuatan keterangan ringkas.
- Gunakan `--timeout-ms` dengan model visi lokal yang lambat atau start Ollama yang dingin.
- Untuk `image describe`, `--model` harus berupa `<provider/model>` yang mendukung gambar.
- Untuk model visi Ollama lokal, tarik model terlebih dahulu dan tetapkan `OLLAMA_API_KEY` ke nilai placeholder apa pun, misalnya `ollama-local`. Lihat [Ollama](/id/providers/ollama#vision-and-image-description).

## Audio

Gunakan `audio` untuk transkripsi file.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Catatan:

- `audio transcribe` digunakan untuk transkripsi file, bukan manajemen sesi realtime.
- `--model` harus berupa `<provider/model>`.

## TTS

Gunakan `tts` untuk sintesis ucapan dan status penyedia TTS.

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
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Catatan:

- `video generate` menerima `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, dan `--timeout-ms` serta meneruskannya ke runtime pembuatan video.
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

- Gunakan `web providers` untuk memeriksa penyedia yang tersedia, dikonfigurasi, dan dipilih.

## Embedding

Gunakan `embedding` untuk pembuatan vektor dan pemeriksaan penyedia embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Output JSON

Perintah infer menormalkan output JSON di bawah amplop bersama:

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

Kolom tingkat atas stabil:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Untuk perintah media yang dihasilkan, `outputs` berisi file yang ditulis oleh OpenClaw. Gunakan
`path`, `mimeType`, `size`, dan dimensi khusus media apa pun dalam array tersebut
untuk otomasi alih-alih mengurai stdout yang dapat dibaca manusia.

## Kesalahan umum

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Catatan

- `openclaw capability ...` adalah alias untuk `openclaw infer ...`.

## Terkait

- [Referensi CLI](/id/cli)
- [Model](/id/concepts/models)

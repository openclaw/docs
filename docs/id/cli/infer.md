---
read_when:
    - Menambahkan atau memodifikasi perintah `openclaw infer`
    - Merancang otomatisasi kapabilitas headless yang stabil
summary: CLI berbasis inferensi untuk alur kerja model, gambar, audio, TTS, video, web, dan embedding yang didukung penyedia
title: CLI Inferensi
x-i18n:
    generated_at: "2026-07-12T14:04:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` adalah antarmuka headless kanonis untuk inferensi yang didukung penyedia. Antarmuka ini mengekspos kelompok kemampuan (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), bukan nama RPC Gateway mentah atau id alat agen. `openclaw capability ...` adalah alias untuk pohon perintah yang sama.

Alasan untuk memilihnya daripada pembungkus penyedia sekali pakai:

- Menggunakan kembali penyedia dan model yang sudah dikonfigurasi di OpenClaw.
- Selubung `--json` yang stabil untuk skrip dan otomatisasi berbasis agen (lihat [keluaran JSON](#json-output)).
- Menjalankan jalur lokal normal tanpa Gateway untuk sebagian besar subperintah.
- Untuk pemeriksaan penyedia menyeluruh, perintah ini menguji CLI yang didistribusikan, pemuatan konfigurasi, resolusi agen bawaan, aktivasi plugin bawaan, dan runtime kemampuan bersama sebelum permintaan penyedia dikirim.

## Ubah infer menjadi sebuah skill

Salin dan tempelkan ini ke agen:

```text
Baca https://docs.openclaw.ai/cli/infer, lalu buat skill yang mengarahkan alur kerja umum saya ke `openclaw infer`.
Fokus pada eksekusi model, pembuatan gambar, pembuatan video, transkripsi audio, TTS, pencarian web, dan embedding.
```

Skill berbasis infer yang baik memetakan maksud umum pengguna ke subperintah yang tepat, menyertakan beberapa contoh kanonis per alur kerja, mengutamakan `openclaw infer ...` daripada alternatif tingkat rendah, dan tidak mendokumentasikan ulang seluruh antarmuka infer dalam isi skill.

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
    personas
    status
    enable
    disable
    set-provider
    set-persona

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

`infer list` / `infer inspect --name <capability>` menampilkan pohon ini sebagai data (id kemampuan, transportasi, deskripsi).

## Tugas umum

| Tugas                              | Perintah                                                                                      | Catatan                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Jalankan prompt teks/model         | `openclaw infer model run --prompt "..." --json`                                              | Lokal secara bawaan                                           |
| Jalankan prompt model pada gambar  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Ulangi `--file` untuk beberapa gambar                          |
| Buat gambar                        | `openclaw infer image generate --prompt "..." --json`                                         | Gunakan `image edit` saat memulai dari berkas yang sudah ada   |
| Deskripsikan berkas atau URL gambar | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` harus berupa `<provider/model>` berkemampuan gambar  |
| Transkripsikan audio               | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` harus berupa `<provider/model>`                      |
| Sintesis ucapan                    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` hanya berjalan melalui Gateway                   |
| Buat video                         | `openclaw infer video generate --prompt "..." --json`                                         | Mendukung petunjuk penyedia seperti `--resolution`             |
| Deskripsikan berkas video          | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` harus berupa `<provider/model>`                      |
| Cari di web                        | `openclaw infer web search --query "..." --json`                                              |                                                               |
| Ambil halaman web                  | `openclaw infer web fetch --url https://example.com --json`                                   |                                                               |
| Buat embedding                     | `openclaw infer embedding create --text "..." --json`                                         |                                                               |

## Perilaku

- Gunakan `--json` saat keluaran diteruskan ke perintah atau skrip lain; gunakan keluaran teks jika tidak.
- Gunakan `--provider` atau `--model provider/model` untuk menetapkan backend tertentu.
- Gunakan `model run --thinking <level>` untuk penggantian pengaturan berpikir/penalaran sekali jalan: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh`, atau `max`.
- Untuk `image describe`, `audio transcribe`, dan `video describe`, `--model` harus menggunakan bentuk `<provider/model>`.
- Untuk `image describe`, `--file` menerima jalur lokal dan URL HTTP(S); URL jarak jauh melewati kebijakan SSRF pengambilan media yang normal.
- Perintah eksekusi tanpa status (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) secara bawaan berjalan secara lokal. Perintah status yang dikelola Gateway (`tts status`) secara bawaan berjalan melalui Gateway.
- Jalur lokal tidak pernah mengharuskan Gateway berjalan.
- `model run` lokal adalah penyelesaian penyedia sekali jalan yang ringkas: perintah ini menyelesaikan model agen dan autentikasi yang dikonfigurasi, tetapi tidak memulai giliran agen obrolan, memuat alat, atau membuka server MCP bawaan.
- `model run --file` melampirkan berkas gambar (jenis MIME terdeteksi otomatis) ke prompt; ulangi `--file` untuk beberapa gambar. Berkas non-gambar ditolak — gunakan `infer audio transcribe` atau `infer video describe` sebagai gantinya.
- `model run --gateway` menguji perutean Gateway, autentikasi tersimpan, pemilihan penyedia, dan runtime tertanam, tetapi tetap menjadi pemeriksaan model mentah: tanpa transkrip sesi sebelumnya, konteks bootstrap/AGENTS, alat, atau server MCP bawaan.
- `model run --gateway --model <provider/model>` memerlukan kredensial Gateway operator tepercaya karena perintah ini meminta Gateway menjalankan penggantian penyedia/model sekali pakai.

## Model

Inferensi teks dan pemeriksaan model/penyedia.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Gunakan referensi `<provider/model>` lengkap dengan `--local` untuk menguji cepat satu penyedia tanpa memulai Gateway atau memuat antarmuka alat agen:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Catatan:

- `model run` lokal adalah pemeriksaan CLI paling sempit untuk kesehatan penyedia/model/autentikasi: untuk penyedia selain ChatGPT-Codex, perintah ini hanya mengirim prompt yang diberikan.
- `model run --model <provider/model>` lokal dapat menyelesaikan baris katalog statis bawaan yang tepat (baris yang sama dengan yang ditampilkan `openclaw models list --all`) sebelum penyedia tersebut ditulis ke konfigurasi. Autentikasi penyedia tetap diperlukan; kredensial yang tidak ada gagal sebagai galat autentikasi, bukan `Unknown model`.
- Untuk pemeriksaan penalaran Mistral Medium 3.5, biarkan suhu tidak disetel/menggunakan nilai bawaan. Mistral menolak `reasoning_effort="high"` dengan `temperature: 0`; gunakan suhu bawaan atau nilai bukan nol seperti `0.7`.
- Pemeriksaan lokal OAuth OpenAI ChatGPT/Codex (API `openai-chatgpt-responses`) menambahkan instruksi sistem minimal agar transportasi dapat mengisi bidang `instructions` yang diwajibkan — tanpa konteks agen lengkap, alat, memori, atau transkrip sesi.
- `model run --file` melampirkan konten gambar langsung ke satu pesan pengguna. Format umum (PNG, JPEG, WebP) berfungsi saat jenis MIME terdeteksi sebagai `image/*`; berkas yang tidak didukung atau tidak dikenali gagal sebelum penyedia dipanggil. Gunakan `infer image describe` sebagai gantinya jika Anda menginginkan perutean model gambar dan fallback OpenClaw, bukan pemeriksaan model multimodal langsung.
- Model yang dipilih harus mendukung masukan gambar; model khusus teks dapat menolak permintaan pada lapisan penyedia.
- `model run --prompt` harus berisi teks selain spasi kosong; prompt kosong ditolak sebelum panggilan penyedia atau Gateway apa pun.
- `model run` lokal keluar dengan kode bukan nol saat penyedia tidak mengembalikan keluaran teks, sehingga penyedia yang tidak dapat dijangkau dan penyelesaian kosong tidak tampak sebagai pemeriksaan yang berhasil.
- Gunakan `model run --gateway` untuk menguji perutean Gateway atau penyiapan runtime agen sambil mempertahankan masukan model mentah. Gunakan `openclaw agent` atau antarmuka obrolan untuk konteks agen lengkap, alat, memori, dan transkrip sesi.
- `--thinking adaptive` dipetakan ke tingkat runtime penyelesaian `medium`; `--thinking max` dipetakan ke `max` untuk model OpenAI yang mendukung upaya maksimum native, atau `xhigh` jika tidak.
- `model auth login`, `model auth logout`, dan `model auth status` mengelola status autentikasi penyedia yang tersimpan.

## Gambar

Pembuatan, pengeditan, dan deskripsi.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Catatan:

- Gunakan `image edit` saat memulai dari berkas masukan yang sudah ada; `--size`, `--aspect-ratio`, atau `--resolution` menambahkan petunjuk geometri pada penyedia/model yang mendukungnya.
- `--output-format png --background transparent` dengan `--model openai/gpt-image-1.5` menghasilkan keluaran PNG OpenAI dengan latar belakang transparan; `--openai-background` adalah alias khusus OpenAI untuk petunjuk yang sama. Penyedia yang tidak menyatakan dukungan latar belakang akan melaporkannya sebagai penggantian yang diabaikan (lihat `ignoredOverrides` dalam [amplop JSON](#json-output)).
- `--quality low|medium|high|auto` berfungsi untuk penyedia yang mendukung petunjuk kualitas gambar, termasuk OpenAI. OpenAI juga menerima `--openai-moderation low|auto`.
- `image providers --json` mencantumkan penyedia gambar bawaan yang dapat ditemukan, dikonfigurasi, dipilih, serta kemampuan pembuatan/penyuntingan yang disediakan masing-masing.
- `image generate --model <provider/model> --json` adalah pengujian langsung paling terfokus untuk perubahan pembuatan gambar:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Respons melaporkan `ok`, `provider`, `model`, `attempts`, dan jalur keluaran yang ditulis. Saat `--output` ditetapkan, ekstensi akhir dapat mengikuti jenis MIME yang dikembalikan penyedia.

- Untuk `image describe` dan `image describe-many`, gunakan `--prompt` untuk instruksi khusus tugas (OCR, perbandingan, pemeriksaan UI, pemberian keterangan singkat).
- Gunakan `--timeout-ms` untuk model penglihatan lokal yang lambat atau proses awal Ollama yang dingin.
- Untuk `image describe`, `--model` eksplisit (harus berupa `<provider/model>` yang mendukung gambar) dijalankan terlebih dahulu, lalu mencoba `agents.defaults.imageModel.fallbacks` yang dikonfigurasi jika pemanggilan tersebut gagal. Kesalahan penyiapan masukan (berkas tidak ditemukan, URL tidak didukung) akan gagal sebelum upaya fallback apa pun, dan model harus mendukung gambar dalam katalog model atau konfigurasi penyedia.
- Untuk model penglihatan Ollama lokal, tarik model terlebih dahulu dan tetapkan `OLLAMA_API_KEY` ke nilai placeholder apa pun, misalnya `ollama-local`. Lihat [Ollama](/id/providers/ollama#vision-and-image-description).

## Audio

Transkripsi berkas (bukan pengelolaan sesi waktu nyata).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` harus berupa `<provider/model>`.

## TTS

Sintesis ucapan serta status penyedia/persona TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Catatan:

- `tts status` hanya mendukung `--gateway` (perintah ini mencerminkan status TTS yang dikelola Gateway).
- Gunakan `tts providers`, `tts voices`, `tts personas`, `tts set-provider`, dan `tts set-persona` untuk memeriksa serta mengonfigurasi perilaku TTS.

## Video

Pembuatan dan deskripsi.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Catatan:

- `video generate` menerima `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, dan `--timeout-ms`, yang diteruskan ke runtime pembuatan video.
- `--model` harus berupa `<provider/model>` untuk `video describe`.

## Web

Pencarian dan pengambilan.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` mencantumkan penyedia yang tersedia, dikonfigurasi, dan dipilih untuk pencarian serta pengambilan.

## Embedding

Pembuatan vektor dan pemeriksaan penyedia embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Keluaran JSON

Perintah Infer menormalkan keluaran JSON dalam amplop bersama:

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

Kolom tingkat teratas yang stabil:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (lampiran gambar yang dikirim bersama permintaan, jika berlaku)
- `outputs`
- `ignoredOverrides` (kunci petunjuk yang tidak didukung penyedia, jika berlaku)
- `error`

Untuk perintah media yang dihasilkan, `outputs` berisi berkas yang ditulis oleh OpenClaw. Gunakan `path`, `mimeType`, `size`, dan dimensi khusus media apa pun dalam larik tersebut untuk otomatisasi, alih-alih mengurai stdout yang dapat dibaca manusia.

## Kendala umum

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

## Terkait

- [Referensi CLI](/id/cli)
- [Model](/id/concepts/models)

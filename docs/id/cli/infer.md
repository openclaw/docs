---
read_when:
    - Menambahkan atau memodifikasi perintah `openclaw infer`
    - Merancang otomatisasi kapabilitas headless yang stabil
summary: CLI yang mengutamakan inferensi untuk alur kerja model, gambar, audio, TTS, video, web, dan embedding yang didukung penyedia
title: CLI Inferensi
x-i18n:
    generated_at: "2026-07-19T04:52:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3147bb516a08e12c4eacd6bd527af62049ecae25b5fde9439da6a4431c147b07
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` adalah antarmuka headless kanonis untuk inferensi yang didukung penyedia. Antarmuka ini mengekspos kelompok kapabilitas (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), bukan nama RPC Gateway mentah atau id alat agen. `openclaw capability ...` adalah alias untuk pohon perintah yang sama.

Alasan untuk memilihnya daripada pembungkus penyedia sekali pakai:

- Menggunakan kembali penyedia dan model yang sudah dikonfigurasi di OpenClaw.
- Amplop `--json` yang stabil untuk skrip dan otomatisasi berbasis agen (lihat [keluaran JSON](#json-output)).
- Menjalankan jalur lokal normal tanpa Gateway untuk sebagian besar subperintah.
- Untuk pemeriksaan penyedia menyeluruh, perintah ini menguji CLI yang didistribusikan, pemuatan konfigurasi, resolusi agen default, aktivasi Plugin bawaan, dan runtime kapabilitas bersama sebelum permintaan dikirim ke penyedia.

## Ubah infer menjadi skill

Salin dan tempelkan ini ke agen:

```text
Baca https://docs.openclaw.ai/cli/infer, lalu buat skill yang mengarahkan alur kerja umum saya ke `openclaw infer`.
Fokus pada eksekusi model, pembuatan gambar, pembuatan video, transkripsi audio, TTS, pencarian web, dan embedding.
```

Skill berbasis infer yang baik memetakan maksud umum pengguna ke subperintah yang tepat, menyertakan beberapa contoh kanonis untuk setiap alur kerja, memilih `openclaw infer ...` daripada alternatif tingkat rendah, dan tidak mendokumentasikan ulang seluruh antarmuka infer di isi skill.

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

`infer list` / `infer inspect --name <capability>` menampilkan pohon ini sebagai data (id kapabilitas, transportasi, deskripsi).

## Tugas umum

| Tugas                          | Perintah                                                                                       | Catatan                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Jalankan perintah teks/model       | `openclaw infer model run --prompt "..." --json`                                              | Lokal secara default                                      |
| Jalankan perintah model pada gambar  | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Ulangi `--file` untuk beberapa gambar                   |
| Buat gambar             | `openclaw infer image generate --prompt "..." --json`                                         | Gunakan `image edit` saat memulai dari berkas yang sudah ada  |
| Deskripsikan berkas gambar atau URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` harus merupakan `<provider/model>` yang mendukung gambar |
| Transkripsikan audio              | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` harus berupa `<provider/model>`                  |
| Sintesis ucapan             | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` hanya berjalan melalui Gateway            |
| Buat video              | `openclaw infer video generate --prompt "..." --json`                                         | Mendukung petunjuk penyedia seperti `--resolution`        |
| Deskripsikan berkas video         | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` harus berupa `<provider/model>`                  |
| Cari di web                | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Ambil halaman web              | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Buat embedding             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Perilaku

- Gunakan `--json` ketika keluaran diteruskan ke perintah atau skrip lain; gunakan keluaran teks untuk kasus lainnya.
- Gunakan `--provider` atau `--model provider/model` untuk menetapkan backend tertentu.
- Gunakan `model run --thinking <level>` untuk menimpa pemikiran/penalaran satu kali: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh`, atau `max`.
- Untuk `image describe`, `audio transcribe`, dan `video describe`, `--model` harus menggunakan format `<provider/model>`.
- Untuk `image describe`, `--file` menerima jalur lokal dan URL HTTP(S); URL jarak jauh diproses melalui kebijakan SSRF pengambilan media normal.
- Perintah eksekusi tanpa status (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) menggunakan lokal secara default. Perintah status yang dikelola Gateway (`tts status`) menggunakan Gateway secara default.
- Jalur lokal tidak pernah mengharuskan Gateway berjalan.
- `model run` lokal adalah penyelesaian penyedia sekali jalan yang ramping: perintah ini menyelesaikan model dan autentikasi agen yang dikonfigurasi, tetapi tidak memulai giliran agen percakapan, memuat alat, atau membuka server MCP bawaan.
- `model run --file` melampirkan berkas gambar (jenis MIME dideteksi otomatis) ke perintah; ulangi `--file` untuk beberapa gambar. Berkas bukan gambar ditolak — gunakan `infer audio transcribe` atau `infer video describe` sebagai gantinya.
- `model run --gateway` menguji perutean Gateway, autentikasi tersimpan, pemilihan penyedia, dan runtime tertanam, tetapi tetap menjadi pemeriksaan model mentah: tanpa transkrip sesi sebelumnya, konteks bootstrap/AGENTS, alat, atau server MCP bawaan.
- `model run --gateway --model <provider/model>` memerlukan kredensial Gateway operator tepercaya karena perintah ini meminta Gateway menjalankan penggantian penyedia/model sekali pakai.

## Model

Inferensi teks serta pemeriksaan model/penyedia.

```bash
openclaw infer model run --prompt "Balas dengan tepat: smoke-ok" --json
openclaw infer model run --prompt "Ringkas entri changelog ini" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Deskripsikan gambar ini dalam satu kalimat" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Gunakan lebih banyak penalaran di sini" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Gunakan referensi `<provider/model>` lengkap dengan `--local` untuk menguji cepat satu penyedia tanpa memulai Gateway atau memuat antarmuka alat agen:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Balas dengan tepat: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Balas dengan tepat: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Balas dengan tepat: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Balas dengan tepat: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Balas dengan tepat: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Balas dengan tepat: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Balas dengan tepat: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Deskripsikan gambar ini." --file ./photo.jpg --json
```

Catatan:

- `model run` lokal adalah pengujian cepat CLI tersempit untuk kesehatan penyedia/model/autentikasi: untuk penyedia selain ChatGPT-Codex, perintah ini hanya mengirim perintah yang diberikan.
- `model run --model <provider/model>` lokal dapat menyelesaikan baris katalog statis bawaan yang tepat (baris yang sama dengan yang ditampilkan `openclaw models list --all`) sebelum penyedia tersebut ditulis ke konfigurasi. Autentikasi penyedia tetap diperlukan; kredensial yang tidak tersedia menghasilkan galat autentikasi, bukan `Unknown model`.
- Untuk pemeriksaan penalaran Mistral Medium 3.5, biarkan suhu tidak ditetapkan/default. Mistral menolak `reasoning_effort="high"` dengan `temperature: 0`; gunakan suhu default atau nilai bukan nol seperti `0.7`.
- Pemeriksaan lokal OAuth OpenAI ChatGPT/Codex (API `openai-chatgpt-responses`) menambahkan instruksi sistem minimal agar transportasi dapat mengisi bidang `instructions` yang diwajibkan — tanpa konteks agen lengkap, alat, memori, atau transkrip sesi.
- `model run --file` melampirkan konten gambar langsung ke satu pesan pengguna. Format umum (PNG, JPEG, WebP) berfungsi ketika jenis MIME terdeteksi sebagai `image/*`; berkas yang tidak didukung atau tidak dikenali gagal sebelum penyedia dipanggil. Gunakan `infer image describe` sebagai gantinya ketika Anda menginginkan perutean dan mekanisme cadangan model gambar OpenClaw, bukan pemeriksaan model multimodal langsung.
- Model yang dipilih harus mendukung masukan gambar; model khusus teks dapat menolak permintaan pada lapisan penyedia.
- `model run --prompt` harus berisi teks selain spasi kosong; perintah kosong ditolak sebelum panggilan penyedia atau Gateway.
- `model run` lokal keluar dengan kode bukan nol ketika penyedia tidak mengembalikan keluaran teks, sehingga penyedia yang tidak dapat dijangkau dan penyelesaian kosong tidak tampak sebagai pemeriksaan yang berhasil.
- Gunakan `model run --gateway` untuk menguji perutean Gateway atau penyiapan runtime agen sambil mempertahankan masukan model dalam bentuk mentah. Gunakan `openclaw agent` atau antarmuka percakapan untuk konteks agen lengkap, alat, memori, dan transkrip sesi.
- `--thinking adaptive` dipetakan ke `medium` tingkat runtime penyelesaian; `--thinking max` dipetakan ke `max` untuk model OpenAI yang mendukung upaya maksimum bawaan, atau `xhigh` jika tidak.
- `model auth login`, `model auth logout`, dan `model auth status` mengelola status autentikasi penyedia yang tersimpan.

## Gambar

Pembuatan, pengeditan, dan deskripsi.

```bash
openclaw infer image generate --prompt "ilustrasi lobster yang ramah" --json
openclaw infer image generate --prompt "foto produk headphone bergaya sinematik" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "stiker lingkaran merah sederhana dengan latar belakang transparan" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "draf poster berbiaya rendah" --json
openclaw infer image generate --prompt "backend gambar yang lambat" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "pertahankan logo, hapus latar belakang" --json
openclaw infer image edit --file ./poster.png --prompt "jadikan ini iklan cerita vertikal" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Ekstrak nama penjual, tanggal, dan total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Bandingkan tangkapan layar dan cantumkan perubahan UI yang terlihat" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Deskripsikan gambar dalam satu kalimat" --timeout-ms 300000 --json
```

Catatan:

- Gunakan `image edit` saat memulai dari berkas masukan yang sudah ada; `--size`, `--aspect-ratio`, atau `--resolution` menambahkan petunjuk geometri pada penyedia/model yang mendukungnya.
- `--output-format png --background transparent` dengan `--model openai/gpt-image-1.5` menghasilkan keluaran PNG OpenAI dengan latar belakang transparan; `--openai-background` adalah alias khusus OpenAI untuk petunjuk yang sama. Penyedia yang tidak menyatakan dukungan latar belakang melaporkannya sebagai penggantian yang diabaikan (lihat `ignoredOverrides` dalam [amplop JSON](#json-output)).
- `--quality low|medium|high|auto` berfungsi untuk penyedia yang mendukung petunjuk kualitas gambar, termasuk OpenAI. OpenAI juga menerima `--openai-moderation low|auto`.
- `image providers --json` mencantumkan penyedia gambar bawaan yang dapat ditemukan, dikonfigurasi, dan dipilih, serta kemampuan pembuatan/penyuntingan yang disediakan oleh masing-masing penyedia.
- `image generate --model <provider/model> --json` adalah pengujian langsung paling terbatas untuk perubahan pembuatan gambar:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image \
    --prompt "Gambar pengujian datar minimalis: satu persegi biru pada latar belakang putih, tanpa teks." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Respons melaporkan `ok`, `provider`, `model`, `attempts`, dan jalur keluaran yang ditulis. Saat `--output` ditetapkan, ekstensi akhir dapat mengikuti jenis MIME yang dikembalikan penyedia.

- Untuk `image describe` dan `image describe-many`, gunakan `--prompt` untuk instruksi khusus tugas (OCR, perbandingan, pemeriksaan UI, pemberian keterangan singkat).
- Gunakan `--timeout-ms` untuk model visi lokal yang lambat atau proses awal Ollama dari kondisi dingin.
- Untuk `image describe`, `--model` eksplisit (harus berupa `<provider/model>` yang mendukung gambar) dijalankan terlebih dahulu, lalu mencoba `agents.defaults.imageModel.fallbacks` yang dikonfigurasi jika panggilan tersebut gagal. Kesalahan penyiapan masukan (berkas tidak ada, URL tidak didukung) menyebabkan kegagalan sebelum upaya pengalihan apa pun, dan model harus mendukung gambar dalam katalog model atau konfigurasi penyedia.
- Untuk model visi Ollama lokal, tarik model terlebih dahulu dan tetapkan `OLLAMA_API_KEY` ke nilai tempat penampung apa pun, misalnya `ollama-local`. Lihat [Ollama](/id/providers/ollama#vision-and-image-description).

## Audio

Transkripsi berkas (bukan pengelolaan sesi waktu nyata).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Fokus pada nama dan butir tindakan" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` harus berupa `<provider/model>`.

## TTS

Sintesis ucapan serta status penyedia/persona TTS.

```bash
openclaw infer tts convert --text "halo dari openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Build Anda telah selesai" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Catatan:

- `tts status` hanya mendukung `--gateway` (ini mencerminkan status TTS yang dikelola Gateway).
- Gunakan `tts providers`, `tts voices`, `tts personas`, `tts set-provider`, dan `tts set-persona` untuk memeriksa dan mengonfigurasi perilaku TTS.

## Video

Pembuatan dan deskripsi.

```bash
openclaw infer video generate --prompt "matahari terbenam sinematik di atas lautan" --json
openclaw infer video generate --prompt "pengambilan gambar drone yang bergerak perlahan di atas danau hutan" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Catatan:

- `video generate` menerima `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark`, dan `--timeout-ms`, yang diteruskan ke runtime pembuatan video.
- `--model` harus berupa `<provider/model>` untuk `video describe`.

## Web

Pencarian dan pengambilan.

```bash
openclaw infer web search --query "Dokumentasi OpenClaw" --json
openclaw infer web search --query "Penyedia web infer OpenClaw" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` mencantumkan penyedia yang tersedia, dikonfigurasi, dan dipilih untuk pencarian dan pengambilan.

## Penyematan

Pembuatan vektor dan pemeriksaan penyedia penyematan.

```bash
openclaw infer embedding create --text "lobster yang ramah" --json
openclaw infer embedding create --text "tiket dukungan pelanggan: pengiriman tertunda" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Keluaran JSON

Perintah infer menormalkan keluaran JSON di bawah amplop bersama:

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

## Kesalahan umum

```bash
# Salah
openclaw infer media image generate --prompt "lobster yang ramah"

# Benar
openclaw infer image generate --prompt "lobster yang ramah"
```

```bash
# Salah
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Benar
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Terkait

- [Referensi CLI](/id/cli)
- [Model](/id/concepts/models)

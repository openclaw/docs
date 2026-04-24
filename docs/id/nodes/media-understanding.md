---
read_when:
    - Merancang atau merefaktor pemahaman media
    - Menyesuaikan prapemrosesan audio/video/gambar masuk
summary: Pemahaman gambar/audio/video masuk (opsional) dengan fallback provider + CLI
title: Pemahaman media
x-i18n:
    generated_at: "2026-04-24T09:15:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9eb9449fbc1bed170bbef213aa43d71d4146edbc0dd626ef50af9e044a8e299
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Pemahaman Media - Masuk (2026-01-17)

OpenClaw dapat **merangkum media masuk** (gambar/audio/video) sebelum pipeline balasan berjalan. OpenClaw mendeteksi otomatis ketika alat lokal atau kunci provider tersedia, dan dapat dinonaktifkan atau disesuaikan. Jika pemahaman dimatikan, model tetap menerima file/URL asli seperti biasa.

Perilaku media khusus vendor didaftarkan oleh plugin vendor, sedangkan inti
OpenClaw memiliki config `tools.media` bersama, urutan fallback, dan integrasi
reply-pipeline.

## Tujuan

- Opsional: mencerna lebih dulu media masuk menjadi teks singkat untuk perutean yang lebih cepat + parsing perintah yang lebih baik.
- Mempertahankan pengiriman media asli ke model (selalu).
- Mendukung **API provider** dan **fallback CLI**.
- Mengizinkan beberapa model dengan fallback berurutan (error/ukuran/timeout).

## Perilaku tingkat tinggi

1. Kumpulkan lampiran masuk (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Untuk setiap kapabilitas yang diaktifkan (gambar/audio/video), pilih lampiran sesuai kebijakan (default: **pertama**).
3. Pilih entri model layak pertama (ukuran + kapabilitas + auth).
4. Jika model gagal atau media terlalu besar, gunakan **fallback ke entri berikutnya**.
5. Jika berhasil:
   - `Body` menjadi blok `[Image]`, `[Audio]`, atau `[Video]`.
   - Audio menetapkan `{{Transcript}}`; parsing perintah menggunakan teks caption saat ada,
     jika tidak maka menggunakan transkrip.
   - Caption dipertahankan sebagai `User text:` di dalam blok.

Jika pemahaman gagal atau dinonaktifkan, **alur balasan tetap berlanjut** dengan body + lampiran asli.

## Ikhtisar config

`tools.media` mendukung **model bersama** plus override per kapabilitas:

- `tools.media.models`: daftar model bersama (gunakan `capabilities` untuk gating).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - default (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - override provider (`baseUrl`, `headers`, `providerOptions`)
  - opsi audio Deepgram melalui `tools.media.audio.providerOptions.deepgram`
  - kontrol echo transkrip audio (`echoTranscript`, default `false`; `echoFormat`)
  - daftar `models` **per kapabilitas opsional** (diprioritaskan sebelum model bersama)
  - kebijakan `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (gating opsional berdasarkan channel/chatType/kunci sesi)
- `tools.media.concurrency`: jumlah maksimum run kapabilitas serentak (default **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* daftar bersama */
      ],
      image: {
        /* override opsional */
      },
      audio: {
        /* override opsional */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* override opsional */
      },
    },
  },
}
```

### Entri model

Setiap entri `models[]` dapat berupa **provider** atau **CLI**:

```json5
{
  type: "provider", // default jika dihilangkan
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // opsional, digunakan untuk entri multi‑modal
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

Template CLI juga dapat menggunakan:

- `{{MediaDir}}` (direktori yang berisi file media)
- `{{OutputDir}}` (direktori scratch yang dibuat untuk run ini)
- `{{OutputBase}}` (path dasar file scratch, tanpa ekstensi)

## Default dan batas

Default yang direkomendasikan:

- `maxChars`: **500** untuk gambar/video (singkat, ramah perintah)
- `maxChars`: **tidak diatur** untuk audio (transkrip penuh kecuali Anda menetapkan batas)
- `maxBytes`:
  - gambar: **10MB**
  - audio: **20MB**
  - video: **50MB**

Aturan:

- Jika media melebihi `maxBytes`, model tersebut dilewati dan **model berikutnya dicoba**.
- File audio yang lebih kecil dari **1024 byte** diperlakukan sebagai kosong/rusak dan dilewati sebelum transkripsi provider/CLI.
- Jika model mengembalikan lebih dari `maxChars`, output dipangkas.
- `prompt` secara default menggunakan bentuk sederhana “Describe the {media}.” plus panduan `maxChars` (hanya gambar/video).
- Jika model gambar utama aktif sudah mendukung vision secara native, OpenClaw
  melewati blok ringkasan `[Image]` dan meneruskan gambar asli ke
  model.
- Jika model utama Gateway/WebChat hanya teks, lampiran gambar
  dipertahankan sebagai ref offloaded `media://inbound/*` sehingga alat gambar atau model
  gambar terkonfigurasi tetap dapat memeriksanya alih-alih kehilangan lampiran.
- Permintaan eksplisit `openclaw infer image describe --model <provider/model>`
  berbeda: permintaan ini menjalankan provider/model yang mampu gambar itu secara langsung, termasuk
  ref Ollama seperti `ollama/qwen2.5vl:7b`.
- Jika `<capability>.enabled: true` tetapi tidak ada model yang dikonfigurasi, OpenClaw mencoba
  **model balasan aktif** ketika providernya mendukung kapabilitas tersebut.

### Auto-detect pemahaman media (default)

Jika `tools.media.<capability>.enabled` **tidak** disetel ke `false` dan Anda belum
mengonfigurasi model, OpenClaw mendeteksi otomatis dalam urutan ini dan **berhenti pada opsi pertama
yang berfungsi**:

1. **Model balasan aktif** ketika providernya mendukung kapabilitas tersebut.
2. Ref primary/fallback **`agents.defaults.imageModel`** (hanya gambar).
3. **CLI lokal** (hanya audio; jika terpasang)
   - `sherpa-onnx-offline` (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; menggunakan `WHISPER_CPP_MODEL` atau model tiny bawaan)
   - `whisper` (CLI Python; mengunduh model secara otomatis)
4. **Gemini CLI** (`gemini`) menggunakan `read_many_files`
5. **Auth provider**
   - Entri `models.providers.*` yang dikonfigurasi dan mendukung kapabilitas tersebut
     dicoba sebelum urutan fallback bawaan.
   - Provider config hanya-gambar dengan model yang mampu gambar akan auto-register untuk
     pemahaman media bahkan ketika mereka bukan plugin vendor bawaan.
   - Pemahaman gambar Ollama tersedia saat dipilih secara eksplisit, misalnya melalui `agents.defaults.imageModel` atau
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Urutan fallback bawaan:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Gambar: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Untuk menonaktifkan auto-detection, atur:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Catatan: deteksi biner bersifat best-effort di macOS/Linux/Windows; pastikan CLI ada di `PATH` (kami memperluas `~`), atau tetapkan model CLI eksplisit dengan path perintah lengkap.

### Dukungan env proxy (model provider)

Saat pemahaman media **audio** dan **video** berbasis provider diaktifkan, OpenClaw
menghormati variabel lingkungan proxy keluar standar untuk pemanggilan HTTP provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jika tidak ada env var proxy yang diatur, pemahaman media menggunakan egress langsung.
Jika nilai proxy tidak valid formatnya, OpenClaw mencatat peringatan dan menggunakan fallback ke fetch
langsung.

## Kapabilitas (opsional)

Jika Anda menetapkan `capabilities`, entri hanya berjalan untuk jenis media tersebut. Untuk daftar bersama, OpenClaw dapat menyimpulkan default:

- `openai`, `anthropic`, `minimax`: **gambar**
- `minimax-portal`: **gambar**
- `moonshot`: **gambar + video**
- `openrouter`: **gambar**
- `google` (API Gemini): **gambar + audio + video**
- `qwen`: **gambar + video**
- `mistral`: **audio**
- `zai`: **gambar**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Katalog `models.providers.<id>.models[]` apa pun dengan model yang mampu gambar:
  **gambar**

Untuk entri CLI, **tetapkan `capabilities` secara eksplisit** untuk menghindari kecocokan yang mengejutkan.
Jika Anda menghilangkan `capabilities`, entri tersebut layak untuk daftar tempat ia muncul.

## Matriks dukungan provider (integrasi OpenClaw)

| Kapabilitas | Integrasi provider                                                                                                           | Catatan                                                                                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gambar      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Plugin vendor mendaftarkan dukungan gambar; `openai-codex/*` menggunakan plumbing provider OAuth; `codex/*` menggunakan giliran bounded Codex app-server; MiniMax dan MiniMax OAuth sama-sama menggunakan `MiniMax-VL-01`; config provider yang mampu gambar akan auto-register. |
| Audio       | OpenAI, Groq, Deepgram, Google, Mistral                                                                                      | Transkripsi provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                                                                                                                  |
| Video       | Google, Qwen, Moonshot                                                                                                       | Pemahaman video provider melalui plugin vendor; pemahaman video Qwen menggunakan endpoint DashScope Standard.                                                                                                                            |

Catatan MiniMax:

- Pemahaman gambar `minimax` dan `minimax-portal` berasal dari provider media `MiniMax-VL-01`
  milik plugin.
- Katalog teks MiniMax bawaan tetap dimulai sebagai hanya-teks; entri
  `models.providers.minimax` yang eksplisit mematerialisasi ref chat M2.7 yang mampu gambar.

## Panduan pemilihan model

- Utamakan model generasi terbaru terkuat yang tersedia untuk setiap kapabilitas media saat kualitas dan keamanan penting.
- Untuk agen dengan alat aktif yang menangani input tak tepercaya, hindari model media yang lebih lama/lebih lemah.
- Simpan setidaknya satu fallback per kapabilitas untuk ketersediaan (model berkualitas + model yang lebih cepat/murah).
- Fallback CLI (`whisper-cli`, `whisper`, `gemini`) berguna saat API provider tidak tersedia.
- Catatan `parakeet-mlx`: dengan `--output-dir`, OpenClaw membaca `<output-dir>/<media-basename>.txt` saat format output adalah `txt` (atau tidak ditentukan); format non-`txt` menggunakan fallback ke stdout.

## Kebijakan lampiran

`attachments` per kapabilitas mengontrol lampiran mana yang diproses:

- `mode`: `first` (default) atau `all`
- `maxAttachments`: membatasi jumlah yang diproses (default **1**)
- `prefer`: `first`, `last`, `path`, `url`

Saat `mode: "all"`, output diberi label `[Image 1/2]`, `[Audio 2/2]`, dan seterusnya.

Perilaku ekstraksi lampiran file:

- Teks file yang diekstrak dibungkus sebagai **konten eksternal tak tepercaya** sebelum
  ditambahkan ke prompt media.
- Blok yang diinjeksi menggunakan penanda batas eksplisit seperti
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` dan menyertakan baris metadata
  `Source: External`.
- Jalur ekstraksi lampiran ini sengaja menghilangkan banner panjang
  `SECURITY NOTICE:` agar prompt media tidak membengkak; penanda batas
  dan metadata tetap dipertahankan.
- Jika sebuah file tidak memiliki teks yang dapat diekstrak, OpenClaw menyuntikkan `[No extractable text]`.
- Jika PDF menggunakan fallback ke gambar halaman yang dirender pada jalur ini, prompt media mempertahankan
  placeholder `[PDF content rendered to images; images not forwarded to model]`
  karena langkah ekstraksi lampiran ini meneruskan blok teks, bukan gambar PDF hasil render.

## Contoh config

### 1) Daftar model bersama + override

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Hanya Audio + Video (gambar mati)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Pemahaman gambar opsional

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.5" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Entri tunggal multi-modal (kapabilitas eksplisit)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Output status

Saat pemahaman media berjalan, `/status` menyertakan baris ringkasan singkat:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Ini menampilkan hasil per kapabilitas dan provider/model yang dipilih jika berlaku.

## Catatan

- Pemahaman bersifat **best‑effort**. Error tidak memblokir balasan.
- Lampiran tetap diteruskan ke model bahkan saat pemahaman dinonaktifkan.
- Gunakan `scope` untuk membatasi tempat pemahaman dijalankan (misalnya hanya DM).

## Dokumen terkait

- [Konfigurasi](/id/gateway/configuration)
- [Dukungan Gambar & Media](/id/nodes/images)

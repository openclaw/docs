---
read_when:
    - Merancang atau memfaktorkan ulang media understanding
    - Menyetel preprocessing audio/video/gambar masuk
summary: Media understanding gambar/audio/video masuk (opsional) dengan fallback provider + CLI
title: Media Understanding
x-i18n:
    generated_at: "2026-04-05T14:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe36bd42250d48d12f4ff549e8644afa7be8e42ee51f8aff4f21f81b7ff060f4
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Media Understanding - Masuk (2026-01-17)

OpenClaw dapat **meringkas media masuk** (gambar/audio/video) sebelum pipeline balasan berjalan. OpenClaw mendeteksi secara otomatis saat alat lokal atau kunci provider tersedia, dan dapat dinonaktifkan atau dikustomisasi. Jika understanding dimatikan, model tetap menerima file/URL asli seperti biasa.

Perilaku media khusus vendor didaftarkan oleh plugin vendor, sementara core OpenClaw
memiliki konfigurasi bersama `tools.media`, urutan fallback, dan integrasi
pipeline balasan.

## Tujuan

- Opsional: mencerna media masuk menjadi teks singkat sebelumnya untuk routing yang lebih cepat + parsing perintah yang lebih baik.
- Mempertahankan pengiriman media asli ke model (selalu).
- Mendukung **API provider** dan **fallback CLI**.
- Memungkinkan beberapa model dengan fallback berurutan (error/ukuran/timeout).

## Perilaku tingkat tinggi

1. Kumpulkan lampiran masuk (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Untuk setiap capability yang diaktifkan (gambar/audio/video), pilih lampiran sesuai kebijakan (default: **pertama**).
3. Pilih entri model pertama yang memenuhi syarat (ukuran + capability + auth).
4. Jika model gagal atau media terlalu besar, **fallback ke entri berikutnya**.
5. Jika berhasil:
   - `Body` menjadi blok `[Image]`, `[Audio]`, atau `[Video]`.
   - Audio menetapkan `{{Transcript}}`; parsing perintah menggunakan teks caption jika ada,
     jika tidak, menggunakan transkrip.
   - Caption dipertahankan sebagai `User text:` di dalam blok.

Jika understanding gagal atau dinonaktifkan, **alur balasan tetap berlanjut** dengan body + lampiran asli.

## Ringkasan konfigurasi

`tools.media` mendukung **model bersama** plus override per capability:

- `tools.media.models`: daftar model bersama (gunakan `capabilities` untuk gating).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - default (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - override provider (`baseUrl`, `headers`, `providerOptions`)
  - opsi audio Deepgram melalui `tools.media.audio.providerOptions.deepgram`
  - kontrol echo transkrip audio (`echoTranscript`, default `false`; `echoFormat`)
  - **daftar `models` per capability** opsional (diprioritaskan sebelum model bersama)
  - kebijakan `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (gating opsional berdasarkan channel/chatType/kunci sesi)
- `tools.media.concurrency`: jumlah maksimum eksekusi capability bersamaan (default **2**).

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
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // opsional, digunakan untuk entri multi-modal
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
- `{{OutputDir}}` (direktori scratch yang dibuat untuk eksekusi ini)
- `{{OutputBase}}` (jalur dasar file scratch, tanpa ekstensi)

## Default dan batas

Default yang direkomendasikan:

- `maxChars`: **500** untuk gambar/video (singkat, ramah perintah)
- `maxChars`: **tidak disetel** untuk audio (transkrip penuh kecuali Anda menetapkan batas)
- `maxBytes`:
  - gambar: **10MB**
  - audio: **20MB**
  - video: **50MB**

Aturan:

- Jika media melebihi `maxBytes`, model tersebut dilewati dan **model berikutnya dicoba**.
- File audio yang lebih kecil dari **1024 byte** diperlakukan sebagai kosong/rusak dan dilewati sebelum transkripsi provider/CLI.
- Jika model mengembalikan lebih dari `maxChars`, output dipangkas.
- `prompt` secara default berupa “Describe the {media}.” sederhana plus panduan `maxChars` (hanya gambar/video).
- Jika model gambar utama aktif sudah mendukung vision secara native, OpenClaw
  melewati blok ringkasan `[Image]` dan sebagai gantinya meneruskan gambar asli ke dalam
  model.
- Jika `<capability>.enabled: true` tetapi tidak ada model yang dikonfigurasi, OpenClaw mencoba
  **model balasan aktif** saat provider-nya mendukung capability tersebut.

### Deteksi otomatis media understanding (default)

Jika `tools.media.<capability>.enabled` **tidak** disetel ke `false` dan Anda belum
mengonfigurasi model, OpenClaw mendeteksi otomatis dalam urutan ini dan **berhenti pada opsi pertama
yang berfungsi**:

1. **Model balasan aktif** saat provider-nya mendukung capability tersebut.
2. Ref primary/fallback **`agents.defaults.imageModel`** (hanya gambar).
3. **CLI lokal** (hanya audio; jika terpasang)
   - `sherpa-onnx-offline` (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; menggunakan `WHISPER_CPP_MODEL` atau model tiny bawaan)
   - `whisper` (CLI Python; mengunduh model secara otomatis)
4. **Gemini CLI** (`gemini`) menggunakan `read_many_files`
5. **Auth provider**
   - Entri `models.providers.*` yang dikonfigurasi dan mendukung capability tersebut
     dicoba sebelum urutan fallback bawaan.
   - Provider konfigurasi khusus gambar dengan model yang mendukung gambar akan terdaftar otomatis untuk
     media understanding bahkan saat mereka bukan plugin vendor bawaan.
   - Urutan fallback bawaan:
     - Audio: OpenAI → Groq → Deepgram → Google → Mistral
     - Gambar: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Untuk menonaktifkan deteksi otomatis, setel:

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

Catatan: Deteksi biner bersifat best-effort di macOS/Linux/Windows; pastikan CLI ada di `PATH` (kami mengekspansi `~`), atau setel model CLI eksplisit dengan jalur perintah lengkap.

### Dukungan environment proxy (model provider)

Saat media understanding **audio** dan **video** berbasis provider diaktifkan, OpenClaw
menghormati variabel lingkungan proxy keluar standar untuk panggilan HTTP provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jika tidak ada env proxy yang disetel, media understanding menggunakan egress langsung.
Jika nilai proxy salah format, OpenClaw mencatat peringatan dan fallback ke fetch
langsung.

## Capabilities (opsional)

Jika Anda menetapkan `capabilities`, entri hanya berjalan untuk jenis media tersebut. Untuk daftar
bersama, OpenClaw dapat menyimpulkan default:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `deepgram`: **audio**
- Katalog `models.providers.<id>.models[]` apa pun dengan model yang mendukung gambar:
  **image**

Untuk entri CLI, **setel `capabilities` secara eksplisit** untuk menghindari kecocokan yang mengejutkan.
Jika Anda menghilangkan `capabilities`, entri memenuhi syarat untuk daftar tempat entri itu muncul.

## Matriks dukungan provider (integrasi OpenClaw)

| Capability | Integrasi provider                                                                    | Catatan                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Image      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Plugin vendor mendaftarkan dukungan gambar; MiniMax dan MiniMax OAuth sama-sama menggunakan `MiniMax-VL-01`; provider konfigurasi yang mendukung gambar terdaftar otomatis. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                               | Transkripsi provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                    |
| Video      | Google, Qwen, Moonshot                                                                | Video understanding provider melalui plugin vendor; video understanding Qwen menggunakan endpoint Standard DashScope.                     |

Catatan MiniMax:

- Media understanding gambar `minimax` dan `minimax-portal` berasal dari
  provider media `MiniMax-VL-01` milik plugin.
- Katalog teks MiniMax bawaan tetap dimulai sebagai teks saja; entri
  `models.providers.minimax` eksplisit mematerialkan ref chat M2.7 yang mendukung gambar.

## Panduan pemilihan model

- Pilih model generasi terbaru terkuat yang tersedia untuk setiap capability media saat kualitas dan keamanan penting.
- Untuk agen dengan alat yang menangani input tidak tepercaya, hindari model media yang lebih lama/lemah.
- Simpan setidaknya satu fallback per capability untuk ketersediaan (model berkualitas + model lebih cepat/lebih murah).
- Fallback CLI (`whisper-cli`, `whisper`, `gemini`) berguna saat API provider tidak tersedia.
- Catatan `parakeet-mlx`: dengan `--output-dir`, OpenClaw membaca `<output-dir>/<media-basename>.txt` saat format output adalah `txt` (atau tidak ditentukan); format selain `txt` akan fallback ke stdout.

## Kebijakan lampiran

`attachments` per capability mengontrol lampiran mana yang diproses:

- `mode`: `first` (default) atau `all`
- `maxAttachments`: membatasi jumlah yang diproses (default **1**)
- `prefer`: `first`, `last`, `path`, `url`

Saat `mode: "all"`, output diberi label `[Image 1/2]`, `[Audio 2/2]`, dst.

Perilaku ekstraksi lampiran file:

- Teks file yang diekstrak dibungkus sebagai **konten eksternal tidak tepercaya** sebelum
  ditambahkan ke prompt media.
- Blok yang disuntikkan menggunakan penanda batas eksplisit seperti
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` dan menyertakan baris metadata
  `Source: External`.
- Jalur ekstraksi lampiran ini sengaja menghilangkan banner panjang
  `SECURITY NOTICE:` agar prompt media tidak membengkak; penanda batas
  dan metadata tetap dipertahankan.
- Jika file tidak memiliki teks yang dapat diekstrak, OpenClaw menyuntikkan `[No extractable text]`.
- Jika PDF fallback ke gambar halaman hasil render di jalur ini, prompt media tetap menyimpan
  placeholder `[PDF content rendered to images; images not forwarded to model]`
  karena langkah ekstraksi lampiran ini meneruskan blok teks, bukan gambar PDF hasil render.

## Contoh konfigurasi

### 1) Daftar model bersama + override

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
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

### 2) Hanya audio + video (gambar nonaktif)

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

### 3) Image understanding opsional

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
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

### 4) Entri tunggal multi-modal (capabilities eksplisit)

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

Saat media understanding berjalan, `/status` menyertakan baris ringkasan singkat:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Ini menampilkan hasil per capability dan provider/model yang dipilih jika berlaku.

## Catatan

- Understanding bersifat **best-effort**. Error tidak memblokir balasan.
- Lampiran tetap diteruskan ke model bahkan saat understanding dinonaktifkan.
- Gunakan `scope` untuk membatasi tempat understanding berjalan (misalnya hanya DM).

## Dokumentasi terkait

- [Configuration](/id/gateway/configuration)
- [Image & Media Support](/nodes/images)

---
read_when:
    - Merancang atau memfaktorkan ulang pemahaman media
    - Menyetel prapemrosesan audio/video/gambar masuk
sidebarTitle: Media understanding
summary: Pemahaman gambar/audio/video masuk (opsional) dengan fallback provider + CLI
title: Pemahaman media
x-i18n:
    generated_at: "2026-04-26T11:33:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
    source_path: nodes/media-understanding.md
    workflow: 15
---

OpenClaw dapat **meringkas media masuk** (gambar/audio/video) sebelum pipeline balasan berjalan. OpenClaw mendeteksi secara otomatis ketika tool lokal atau key provider tersedia, dan dapat dinonaktifkan atau dikustomisasi. Jika pemahaman dinonaktifkan, model tetap menerima file/URL asli seperti biasa.

Perilaku media yang spesifik vendor didaftarkan oleh Plugin vendor, sementara OpenClaw core memiliki konfigurasi bersama `tools.media`, urutan fallback, dan integrasi pipeline balasan.

## Tujuan

- Opsional: mencerna media masuk terlebih dahulu menjadi teks singkat untuk perutean yang lebih cepat + parsing perintah yang lebih baik.
- Mempertahankan pengiriman media asli ke model (selalu).
- Mendukung **API provider** dan **fallback CLI**.
- Mengizinkan beberapa model dengan fallback berurutan (error/ukuran/timeout).

## Perilaku tingkat tinggi

<Steps>
  <Step title="Kumpulkan lampiran">
    Kumpulkan lampiran masuk (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Pilih per-kapabilitas">
    Untuk setiap kapabilitas yang diaktifkan (gambar/audio/video), pilih lampiran sesuai kebijakan (default: **pertama**).
  </Step>
  <Step title="Pilih model">
    Pilih entri model pertama yang memenuhi syarat (ukuran + kapabilitas + auth).
  </Step>
  <Step title="Fallback saat gagal">
    Jika sebuah model gagal atau media terlalu besar, **fallback ke entri berikutnya**.
  </Step>
  <Step title="Terapkan blok sukses">
    Saat berhasil:

    - `Body` menjadi blok `[Image]`, `[Audio]`, atau `[Video]`.
    - Audio menetapkan `{{Transcript}}`; parsing perintah menggunakan teks caption jika ada, jika tidak menggunakan transkrip.
    - Caption dipertahankan sebagai `User text:` di dalam blok.

  </Step>
</Steps>

Jika pemahaman gagal atau dinonaktifkan, **alur balasan tetap berlanjut** dengan body + lampiran asli.

## Ringkasan konfigurasi

`tools.media` mendukung **model bersama** plus override per-kapabilitas:

<AccordionGroup>
  <Accordion title="Key tingkat atas">
    - `tools.media.models`: daftar model bersama (gunakan `capabilities` untuk gating).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - default (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - override provider (`baseUrl`, `headers`, `providerOptions`)
      - opsi audio Deepgram melalui `tools.media.audio.providerOptions.deepgram`
      - kontrol echo transkrip audio (`echoTranscript`, default `false`; `echoFormat`)
      - **daftar `models` per-kapabilitas** opsional (diprioritaskan sebelum model bersama)
      - kebijakan `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (gating opsional berdasarkan channel/chatType/session key)
    - `tools.media.concurrency`: jumlah maksimum eksekusi kapabilitas bersamaan (default **2**).
  </Accordion>
</AccordionGroup>

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

<Tabs>
  <Tab title="Entri provider">
    ```json5
    {
      type: "provider", // default jika dihilangkan
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // opsional, digunakan untuk entri multimodal
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Entri CLI">
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

    Templat CLI juga dapat menggunakan:

    - `{{MediaDir}}` (direktori yang berisi file media)
    - `{{OutputDir}}` (direktori scratch yang dibuat untuk eksekusi ini)
    - `{{OutputBase}}` (path dasar file scratch, tanpa ekstensi)

  </Tab>
</Tabs>

## Default dan batas

Default yang direkomendasikan:

- `maxChars`: **500** untuk gambar/video (pendek, ramah perintah)
- `maxChars`: **tidak diset** untuk audio (transkrip penuh kecuali Anda menetapkan batas)
- `maxBytes`:
  - gambar: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Aturan">
    - Jika media melebihi `maxBytes`, model tersebut dilewati dan **model berikutnya dicoba**.
    - File audio yang lebih kecil dari **1024 byte** diperlakukan sebagai kosong/rusak dan dilewati sebelum transkripsi provider/CLI; konteks balasan masuk menerima placeholder transkrip deterministik agar agen tahu bahwa catatan tersebut terlalu kecil.
    - Jika model mengembalikan lebih dari `maxChars`, output dipangkas.
    - `prompt` default ke "Describe the {media}." sederhana plus panduan `maxChars` (khusus gambar/video).
    - Jika model gambar utama aktif sudah mendukung vision secara native, OpenClaw melewati blok ringkasan `[Image]` dan langsung meneruskan gambar asli ke model.
    - Jika model utama Gateway/WebChat hanya mendukung teks, lampiran gambar dipertahankan sebagai ref `media://inbound/*` yang di-offload sehingga tool gambar/PDF atau model gambar yang dikonfigurasi tetap dapat memeriksanya alih-alih kehilangan lampiran.
    - Permintaan eksplisit `openclaw infer image describe --model <provider/model>` berbeda: perintah ini menjalankan provider/model yang mendukung gambar tersebut secara langsung, termasuk ref Ollama seperti `ollama/qwen2.5vl:7b`.
    - Jika `<capability>.enabled: true` tetapi tidak ada model yang dikonfigurasi, OpenClaw mencoba **model balasan aktif** ketika provider-nya mendukung kapabilitas tersebut.
  </Accordion>
</AccordionGroup>

### Deteksi otomatis pemahaman media (default)

Jika `tools.media.<capability>.enabled` **tidak** diset ke `false` dan Anda belum mengonfigurasi model, OpenClaw mendeteksi otomatis dalam urutan ini dan **berhenti pada opsi pertama yang berfungsi**:

<Steps>
  <Step title="Model balasan aktif">
    Model balasan aktif ketika provider-nya mendukung kapabilitas tersebut.
  </Step>
  <Step title="agents.defaults.imageModel">
    Ref primary/fallback `agents.defaults.imageModel` (khusus gambar).
  </Step>
  <Step title="CLI lokal (khusus audio)">
    CLI lokal (jika terpasang):

    - `sherpa-onnx-offline` (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; menggunakan `WHISPER_CPP_MODEL` atau model tiny bawaan)
    - `whisper` (CLI Python; mengunduh model secara otomatis)

  </Step>
  <Step title="Gemini CLI">
    `gemini` menggunakan `read_many_files`.
  </Step>
  <Step title="Auth provider">
    - Entri `models.providers.*` yang dikonfigurasi dan mendukung kapabilitas tersebut dicoba sebelum urutan fallback bawaan.
    - Provider konfigurasi khusus gambar dengan model yang mendukung gambar akan terdaftar otomatis untuk pemahaman media bahkan ketika bukan Plugin vendor bawaan.
    - Pemahaman gambar Ollama tersedia ketika dipilih secara eksplisit, misalnya melalui `agents.defaults.imageModel` atau `openclaw infer image describe --model ollama/<vision-model>`.

    Urutan fallback bawaan:

    - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Gambar: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

Untuk menonaktifkan deteksi otomatis, set:

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

<Note>
Deteksi biner bersifat best-effort di macOS/Linux/Windows; pastikan CLI ada di `PATH` (kami memperluas `~`), atau set model CLI eksplisit dengan path perintah lengkap.
</Note>

### Dukungan environment proxy (model provider)

Saat pemahaman media **audio** dan **video** berbasis provider diaktifkan, OpenClaw menghormati variabel environment proxy keluar standar untuk panggilan HTTP provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jika tidak ada variabel env proxy yang diset, pemahaman media menggunakan egress langsung. Jika nilai proxy salah format, OpenClaw mencatat peringatan dan fallback ke pengambilan langsung.

## Kapabilitas (opsional)

Jika Anda menetapkan `capabilities`, entri tersebut hanya berjalan untuk tipe media tersebut. Untuk daftar bersama, OpenClaw dapat menyimpulkan default:

- `openai`, `anthropic`, `minimax`: **gambar**
- `minimax-portal`: **gambar**
- `moonshot`: **gambar + video**
- `openrouter`: **gambar**
- `google` (Gemini API): **gambar + audio + video**
- `qwen`: **gambar + video**
- `mistral`: **audio**
- `zai`: **gambar**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Katalog `models.providers.<id>.models[]` apa pun dengan model yang mendukung gambar: **gambar**

Untuk entri CLI, **set `capabilities` secara eksplisit** agar tidak terjadi kecocokan yang mengejutkan. Jika Anda menghilangkan `capabilities`, entri tersebut memenuhi syarat untuk daftar tempat entri itu muncul.

## Matriks dukungan provider (integrasi OpenClaw)

| Kapabilitas | Integrasi provider                                                                                                         | Catatan                                                                                                                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gambar      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, provider konfigurasi | Plugin vendor mendaftarkan dukungan gambar; `openai-codex/*` menggunakan plumbing provider OAuth; `codex/*` menggunakan giliran app-server Codex berbatas; MiniMax dan MiniMax OAuth sama-sama menggunakan `MiniMax-VL-01`; provider konfigurasi yang mendukung gambar terdaftar otomatis. |
| Audio       | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                       | Transkripsi provider (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                      |
| Video       | Google, Qwen, Moonshot                                                                                                     | Pemahaman video provider melalui Plugin vendor; pemahaman video Qwen menggunakan endpoint Standard DashScope.                                                                                                                           |

<Note>
**Catatan MiniMax**

- Pemahaman gambar `minimax` dan `minimax-portal` berasal dari provider media `MiniMax-VL-01` milik Plugin.
- Katalog teks MiniMax bawaan tetap dimulai sebagai text-only; entri `models.providers.minimax` eksplisit mematerialkan ref chat M2.7 yang mendukung gambar.
</Note>

## Panduan pemilihan model

- Pilih model generasi terbaru terkuat yang tersedia untuk setiap kapabilitas media ketika kualitas dan keamanan penting.
- Untuk agen yang mendukung tool dan menangani input yang tidak tepercaya, hindari model media yang lebih lama/lemah.
- Simpan setidaknya satu fallback per kapabilitas untuk ketersediaan (model berkualitas + model yang lebih cepat/murah).
- Fallback CLI (`whisper-cli`, `whisper`, `gemini`) berguna ketika API provider tidak tersedia.
- Catatan `parakeet-mlx`: dengan `--output-dir`, OpenClaw membaca `<output-dir>/<media-basename>.txt` ketika format output adalah `txt` (atau tidak ditentukan); format non-`txt` fallback ke stdout.

## Kebijakan lampiran

`attachments` per-kapabilitas mengontrol lampiran mana yang diproses:

<ParamField path="mode" type='"first" | "all"' default="first">
  Apakah memproses lampiran terpilih pertama atau semuanya.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Membatasi jumlah yang diproses.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferensi pemilihan di antara lampiran kandidat.
</ParamField>

Saat `mode: "all"`, output diberi label `[Image 1/2]`, `[Audio 2/2]`, dll.

<AccordionGroup>
  <Accordion title="Perilaku ekstraksi lampiran file">
    - Teks file yang diekstrak dibungkus sebagai **konten eksternal tidak tepercaya** sebelum ditambahkan ke prompt media.
    - Blok yang disuntikkan menggunakan penanda batas eksplisit seperti `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` dan menyertakan baris metadata `Source: External`.
    - Jalur ekstraksi lampiran ini sengaja menghilangkan banner panjang `SECURITY NOTICE:` agar prompt media tidak membengkak; penanda batas dan metadata tetap ada.
    - Jika sebuah file tidak memiliki teks yang dapat diekstrak, OpenClaw menyuntikkan `[No extractable text]`.
    - Jika sebuah PDF fallback ke gambar halaman yang dirender pada jalur ini, prompt media mempertahankan placeholder `[PDF content rendered to images; images not forwarded to model]` karena langkah ekstraksi lampiran ini meneruskan blok teks, bukan gambar PDF yang dirender.
  </Accordion>
</AccordionGroup>

## Contoh konfigurasi

<Tabs>
  <Tab title="Model bersama + override">
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
  </Tab>
  <Tab title="Hanya audio + video">
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
  </Tab>
  <Tab title="Hanya gambar">
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
  </Tab>
  <Tab title="Satu entri multimodal">
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
  </Tab>
</Tabs>

## Output status

Saat pemahaman media berjalan, `/status` menyertakan baris ringkasan singkat:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Ini menampilkan hasil per-kapabilitas dan provider/model yang dipilih jika berlaku.

## Catatan

- Pemahaman bersifat **best-effort**. Error tidak memblokir balasan.
- Lampiran tetap diteruskan ke model bahkan saat pemahaman dinonaktifkan.
- Gunakan `scope` untuk membatasi tempat pemahaman berjalan (mis. hanya DM).

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Dukungan gambar & media](/id/nodes/images)

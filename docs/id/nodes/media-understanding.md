---
read_when:
    - Merancang atau memfaktorkan ulang pemahaman media
    - Menyesuaikan prapemrosesan audio/video/gambar masuk
sidebarTitle: Media understanding
summary: Pemahaman gambar/audio/video masuk (opsional) dengan mekanisme cadangan penyedia + CLI
title: Pemahaman media
x-i18n:
    generated_at: "2026-04-30T09:58:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw dapat **meringkas media masuk** (gambar/audio/video) sebelum pipeline balasan berjalan. OpenClaw otomatis mendeteksi ketika alat lokal atau kunci penyedia tersedia, dan dapat dinonaktifkan atau disesuaikan. Jika pemahaman dimatikan, model tetap menerima file/URL asli seperti biasa.

Perilaku media khusus vendor didaftarkan oleh Plugin vendor, sementara inti OpenClaw memiliki konfigurasi bersama `tools.media`, urutan fallback, dan integrasi pipeline balasan.

## Tujuan

- Opsional: pra-cerna media masuk menjadi teks singkat untuk routing yang lebih cepat + parsing perintah yang lebih baik.
- Pertahankan pengiriman media asli ke model (selalu).
- Mendukung **API penyedia** dan **fallback CLI**.
- Memungkinkan beberapa model dengan fallback berurutan (galat/ukuran/timeout).

## Perilaku tingkat tinggi

<Steps>
  <Step title="Collect attachments">
    Kumpulkan lampiran masuk (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Select per-capability">
    Untuk setiap kapabilitas yang diaktifkan (gambar/audio/video), pilih lampiran sesuai kebijakan (default: **pertama**).
  </Step>
  <Step title="Choose model">
    Pilih entri model pertama yang memenuhi syarat (ukuran + kapabilitas + auth).
  </Step>
  <Step title="Fallback on failure">
    Jika model gagal atau media terlalu besar, **fallback ke entri berikutnya**.
  </Step>
  <Step title="Apply success block">
    Saat berhasil:

    - `Body` menjadi blok `[Image]`, `[Audio]`, atau `[Video]`.
    - Audio menetapkan `{{Transcript}}`; parsing perintah menggunakan teks caption jika ada, jika tidak menggunakan transkrip.
    - Caption dipertahankan sebagai `User text:` di dalam blok.

  </Step>
</Steps>

Jika pemahaman gagal atau dinonaktifkan, **alur balasan berlanjut** dengan body + lampiran asli.

## Ikhtisar konfigurasi

`tools.media` mendukung **model bersama** plus override per kapabilitas:

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models`: daftar model bersama (gunakan `capabilities` untuk gating).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - default (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - override penyedia (`baseUrl`, `headers`, `providerOptions`)
      - opsi audio Deepgram melalui `tools.media.audio.providerOptions.deepgram`
      - kontrol echo transkrip audio (`echoTranscript`, default `false`; `echoFormat`)
      - **daftar `models` per kapabilitas** opsional (diprioritaskan sebelum model bersama)
      - kebijakan `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (gating opsional berdasarkan channel/chatType/kunci sesi)
    - `tools.media.concurrency`: jumlah maksimum proses kapabilitas bersamaan (default **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Entri model

Setiap entri `models[]` dapat berupa **penyedia** atau **CLI**:

<Tabs>
  <Tab title="Provider entry">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI entry">
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
    - `{{OutputDir}}` (direktori scratch yang dibuat untuk proses ini)
    - `{{OutputBase}}` (path dasar file scratch, tanpa ekstensi)

  </Tab>
</Tabs>

## Default dan batas

Default yang direkomendasikan:

- `maxChars`: **500** untuk gambar/video (singkat, ramah perintah)
- `maxChars`: **tidak diatur** untuk audio (transkrip penuh kecuali Anda menetapkan batas)
- `maxBytes`:
  - gambar: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Rules">
    - Jika media melebihi `maxBytes`, model itu dilewati dan **model berikutnya dicoba**.
    - File audio yang lebih kecil dari **1024 byte** diperlakukan sebagai kosong/rusak dan dilewati sebelum transkripsi penyedia/CLI; konteks balasan masuk menerima placeholder transkrip deterministik agar agen tahu catatan tersebut terlalu kecil.
    - Jika model mengembalikan lebih dari `maxChars`, output dipangkas.
    - `prompt` default ke "Describe the {media}." sederhana plus panduan `maxChars` (hanya gambar/video).
    - Jika model gambar utama aktif sudah mendukung vision secara native, OpenClaw melewati blok ringkasan `[Image]` dan meneruskan gambar asli ke model.
    - Jika model utama Gateway/WebChat hanya teks, lampiran gambar dipertahankan sebagai ref `media://inbound/*` yang dioffload sehingga alat gambar/PDF atau model gambar yang dikonfigurasi tetap dapat memeriksanya alih-alih kehilangan lampiran.
    - Permintaan eksplisit `openclaw infer image describe --model <provider/model>` berbeda: permintaan tersebut menjalankan penyedia/model berkemampuan gambar itu secara langsung, termasuk ref Ollama seperti `ollama/qwen2.5vl:7b`.
    - Jika `<capability>.enabled: true` tetapi tidak ada model yang dikonfigurasi, OpenClaw mencoba **model balasan aktif** ketika penyedianya mendukung kapabilitas tersebut.

  </Accordion>
</AccordionGroup>

### Deteksi otomatis pemahaman media (default)

Jika `tools.media.<capability>.enabled` **tidak** disetel ke `false` dan Anda belum mengonfigurasi model, OpenClaw mendeteksi otomatis dalam urutan ini dan **berhenti pada opsi pertama yang berfungsi**:

<Steps>
  <Step title="Active reply model">
    Model balasan aktif ketika penyedianya mendukung kapabilitas tersebut.
  </Step>
  <Step title="agents.defaults.imageModel">
    Ref utama/fallback `agents.defaults.imageModel` (hanya gambar).
    Lebih pilih ref `provider/model`. Ref polos dikualifikasi dari entri model penyedia berkemampuan gambar yang dikonfigurasi hanya ketika kecocokannya unik.
  </Step>
  <Step title="Local CLIs (audio only)">
    CLI lokal (jika terpasang):

    - `sherpa-onnx-offline` (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; menggunakan `WHISPER_CPP_MODEL` atau model tiny bawaan)
    - `whisper` (CLI Python; mengunduh model secara otomatis)

  </Step>
  <Step title="Gemini CLI">
    `gemini` menggunakan `read_many_files`.
  </Step>
  <Step title="Provider auth">
    - Entri `models.providers.*` yang dikonfigurasi dan mendukung kapabilitas dicoba sebelum urutan fallback bawaan.
    - Penyedia konfigurasi khusus gambar dengan model berkemampuan gambar otomatis terdaftar untuk pemahaman media meskipun bukan Plugin vendor bawaan.
    - Pemahaman gambar Ollama tersedia ketika dipilih secara eksplisit, misalnya melalui `agents.defaults.imageModel` atau `openclaw infer image describe --model ollama/<vision-model>`.

    Urutan fallback bawaan:

    - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Gambar: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

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

<Note>
Deteksi biner bersifat upaya terbaik di macOS/Linux/Windows; pastikan CLI ada di `PATH` (kami memperluas `~`), atau tetapkan model CLI eksplisit dengan path perintah penuh.
</Note>

### Dukungan lingkungan proxy (model penyedia)

Ketika pemahaman media **audio** dan **video** berbasis penyedia diaktifkan, OpenClaw menghormati variabel lingkungan proxy keluar standar untuk panggilan HTTP penyedia:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Jika tidak ada variabel env proxy yang disetel, pemahaman media menggunakan egress langsung. Jika nilai proxy salah bentuk, OpenClaw mencatat peringatan dan fallback ke pengambilan langsung.

## Kapabilitas (opsional)

Jika Anda menyetel `capabilities`, entri hanya berjalan untuk jenis media tersebut. Untuk daftar bersama, OpenClaw dapat menyimpulkan default:

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
- Katalog `models.providers.<id>.models[]` apa pun dengan model berkemampuan gambar: **gambar**

Untuk entri CLI, **setel `capabilities` secara eksplisit** untuk menghindari kecocokan yang mengejutkan. Jika Anda menghilangkan `capabilities`, entri tersebut memenuhi syarat untuk daftar tempatnya muncul.

## Matriks dukungan penyedia (integrasi OpenClaw)

| Kapabilitas | Integrasi penyedia                                                                                                          | Catatan                                                                                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gambar     | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, penyedia konfigurasi | Plugin vendor mendaftarkan dukungan gambar; `openai-codex/*` menggunakan plumbing penyedia OAuth; `codex/*` menggunakan giliran Codex app-server terbatas; MiniMax dan MiniMax OAuth sama-sama menggunakan `MiniMax-VL-01`; penyedia konfigurasi berkemampuan gambar otomatis terdaftar. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Transkripsi penyedia (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                     |
| Video      | Google, Qwen, Moonshot                                                                                                       | Pemahaman video penyedia melalui Plugin vendor; pemahaman video Qwen menggunakan endpoint Standard DashScope.                                                                                                                           |

<Note>
**Catatan MiniMax**

- Pemahaman gambar `minimax` dan `minimax-portal` berasal dari penyedia media `MiniMax-VL-01` milik Plugin.
- Katalog teks MiniMax bawaan tetap dimulai sebagai hanya teks; entri eksplisit `models.providers.minimax` mewujudkan ref chat M2.7 berkemampuan gambar.

</Note>

## Panduan pemilihan model

- Pilih model generasi terbaru terkuat yang tersedia untuk setiap kapabilitas media ketika kualitas dan keamanan penting.
- Untuk agen beralat yang menangani input tidak tepercaya, hindari model media lama/lebih lemah.
- Pertahankan setidaknya satu fallback per kapabilitas untuk ketersediaan (model berkualitas + model lebih cepat/lebih murah).
- Fallback CLI (`whisper-cli`, `whisper`, `gemini`) berguna ketika API penyedia tidak tersedia.
- Catatan `parakeet-mlx`: dengan `--output-dir`, OpenClaw membaca `<output-dir>/<media-basename>.txt` ketika format output adalah `txt` (atau tidak ditentukan); format non-`txt` fallback ke stdout.

## Kebijakan lampiran

`attachments` per kapabilitas mengontrol lampiran mana yang diproses:

<ParamField path="mode" type='"first" | "all"' default="first">
  Apakah akan memproses lampiran terpilih pertama atau semuanya.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Batasi jumlah yang diproses.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferensi pemilihan di antara lampiran kandidat.
</ParamField>

Saat `mode: "all"`, keluaran diberi label `[Image 1/2]`, `[Audio 2/2]`, dan seterusnya.

<AccordionGroup>
  <Accordion title="Perilaku ekstraksi lampiran file">
    - Teks file yang diekstrak dibungkus sebagai **konten eksternal tidak tepercaya** sebelum ditambahkan ke prompt media.
    - Blok yang disisipkan menggunakan penanda batas eksplisit seperti `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` dan menyertakan baris metadata `Source: External`.
    - Jalur ekstraksi lampiran ini sengaja menghilangkan banner panjang `SECURITY NOTICE:` agar prompt media tidak membengkak; penanda batas dan metadata tetap ada.
    - Jika file tidak memiliki teks yang dapat diekstrak, OpenClaw menyisipkan `[No extractable text]`.
    - Jika PDF beralih ke gambar halaman yang dirender di jalur ini, prompt media mempertahankan placeholder `[PDF content rendered to images; images not forwarded to model]` karena langkah ekstraksi lampiran ini meneruskan blok teks, bukan gambar PDF yang dirender.

  </Accordion>
</AccordionGroup>

## Contoh konfigurasi

<Tabs>
  <Tab title="Model bersama + penggantian">
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

## Keluaran status

Saat pemahaman media berjalan, `/status` menyertakan baris ringkasan singkat:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Ini menampilkan hasil per kapabilitas dan penyedia/model yang dipilih jika berlaku.

## Catatan

- Pemahaman bersifat **upaya terbaik**. Kesalahan tidak memblokir balasan.
- Lampiran tetap diteruskan ke model meskipun pemahaman dinonaktifkan.
- Gunakan `scope` untuk membatasi tempat pemahaman berjalan (misalnya hanya DM).

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Dukungan gambar & media](/id/nodes/images)

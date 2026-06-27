---
read_when:
    - Merancang atau merefaktor pemahaman media
    - Menyesuaikan prapemrosesan audio/video/gambar masuk
sidebarTitle: Media understanding
summary: Pemahaman gambar/audio/video masuk (opsional) dengan mekanisme cadangan penyedia + CLI
title: Pemahaman media
x-i18n:
    generated_at: "2026-06-27T17:40:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4724578632b0210290d1b32077d2c0ccf7fdfa6b96160f76bf3eff591df7b92e
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw dapat **merangkum media masuk** (gambar/audio/video) sebelum pipeline balasan berjalan. Ini mendeteksi otomatis saat alat lokal atau kunci penyedia tersedia, dan dapat dinonaktifkan atau disesuaikan. Jika pemahaman dinonaktifkan, model tetap menerima file/URL asli seperti biasa.

Perilaku media khusus vendor didaftarkan oleh Plugin vendor, sementara inti OpenClaw memiliki konfigurasi bersama `tools.media`, urutan fallback, dan integrasi pipeline balasan.

## Tujuan

- Opsional: mencerna terlebih dahulu media masuk menjadi teks singkat untuk routing yang lebih cepat + parsing perintah yang lebih baik.
- Pertahankan pengiriman media asli ke model (selalu).
- Dukung **API penyedia** dan **fallback CLI**.
- Izinkan beberapa model dengan fallback berurutan (kesalahan/ukuran/timeout).

## Perilaku tingkat tinggi

<Steps>
  <Step title="Kumpulkan lampiran">
    Kumpulkan lampiran masuk (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Pilih per kapabilitas">
    Untuk setiap kapabilitas yang diaktifkan (gambar/audio/video), pilih lampiran per kebijakan (default: **pertama**).
  </Step>
  <Step title="Pilih model">
    Pilih entri model pertama yang memenuhi syarat (ukuran + kapabilitas + auth).
  </Step>
  <Step title="Fallback saat gagal">
    Jika model gagal atau medianya terlalu besar, **fallback ke entri berikutnya**.
  </Step>
  <Step title="Terapkan blok sukses">
    Saat sukses:

    - `Body` menjadi blok `[Image]`, `[Audio]`, atau `[Video]`.
    - Audio menetapkan `{{Transcript}}`; parsing perintah menggunakan teks caption bila ada, jika tidak menggunakan transkrip.
    - Caption dipertahankan sebagai `User text:` di dalam blok.

  </Step>
</Steps>

Jika pemahaman gagal atau dinonaktifkan, **alur balasan berlanjut** dengan body + lampiran asli.

## Gambaran umum konfigurasi

`tools.media` mendukung **model bersama** plus override per kapabilitas:

<AccordionGroup>
  <Accordion title="Kunci tingkat atas">
    - `tools.media.models`: daftar model bersama (gunakan `capabilities` untuk pembatasan).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - default (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - override penyedia (`baseUrl`, `headers`, `providerOptions`)
      - opsi audio Deepgram melalui `tools.media.audio.providerOptions.deepgram`
      - kontrol echo transkrip audio (`echoTranscript`, default `false`; `echoFormat`)
      - **daftar `models` per kapabilitas** opsional (diprioritaskan sebelum model bersama)
      - kebijakan `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (gating opsional berdasarkan channel/chatType/kunci sesi)
    - `tools.media.concurrency`: maksimum proses kapabilitas serentak (default **2**).

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
  <Tab title="Entri penyedia">
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

    Template CLI juga dapat menggunakan:

    - `{{MediaDir}}` (direktori yang berisi file media)
    - `{{OutputDir}}` (direktori scratch yang dibuat untuk proses ini)
    - `{{OutputBase}}` (path dasar file scratch, tanpa ekstensi)

  </Tab>
</Tabs>

### Kredensial penyedia (`apiKey`)

Pemahaman media penyedia menggunakan resolusi auth penyedia yang sama seperti pemanggilan model normal: profil auth, variabel lingkungan, lalu `models.providers.<providerId>.apiKey`.

Entri `tools.media.*.models[]` tidak menerima bidang `apiKey` inline. Nilai `provider` dalam entri model media, seperti `openai` atau `moonshot`, harus memiliki kredensial yang tersedia melalui salah satu sumber auth penyedia standar.

Contoh minimal:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Untuk referensi auth penyedia lengkap, termasuk profil, variabel lingkungan, dan URL basis kustom, lihat [Alat dan penyedia kustom](/id/gateway/config-tools).

## Default dan batas

Default yang direkomendasikan:

- `maxChars`: **500** untuk gambar/video (singkat, ramah perintah)
- `maxChars`: **tidak disetel** untuk audio (transkrip penuh kecuali Anda menetapkan batas)
- `maxBytes`:
  - gambar: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Aturan">
    - Jika media melebihi `maxBytes`, model tersebut dilewati dan **model berikutnya dicoba**.
    - File audio yang lebih kecil dari **1024 byte** diperlakukan sebagai kosong/rusak dan dilewati sebelum transkripsi penyedia/CLI; konteks balasan masuk menerima transkrip placeholder deterministik sehingga agen mengetahui catatan itu terlalu kecil.
    - Jika model mengembalikan lebih dari `maxChars`, output dipangkas.
    - `prompt` secara default adalah "Describe the {media}." sederhana plus panduan `maxChars` (hanya gambar/video).
    - Jika model gambar primer aktif sudah mendukung vision secara native, OpenClaw melewati blok ringkasan `[Image]` dan meneruskan gambar asli ke model sebagai gantinya.
    - Jika model primer Gateway/WebChat hanya teks, lampiran gambar dipertahankan sebagai ref `media://inbound/*` yang di-offload sehingga alat gambar/PDF atau model gambar yang dikonfigurasi tetap dapat memeriksanya alih-alih kehilangan lampiran.
    - Permintaan eksplisit `openclaw infer image describe --model <provider/model>` berbeda: permintaan tersebut menjalankan penyedia/model berkapabilitas gambar itu secara langsung, termasuk ref Ollama seperti `ollama/qwen2.5vl:7b`.
    - Jika `<capability>.enabled: true` tetapi tidak ada model yang dikonfigurasi, OpenClaw mencoba **model balasan aktif** saat penyedianya mendukung kapabilitas tersebut.

  </Accordion>
</AccordionGroup>

### Deteksi otomatis pemahaman media (default)

Jika `tools.media.<capability>.enabled` **tidak** disetel ke `false` dan Anda belum mengonfigurasi model, OpenClaw mendeteksi otomatis dalam urutan ini dan **berhenti pada opsi pertama yang berfungsi**:

<Steps>
  <Step title="Model balasan aktif">
    Model balasan aktif saat penyedianya mendukung kapabilitas tersebut.
  </Step>
  <Step title="agents.defaults.imageModel">
    Ref primer/fallback `agents.defaults.imageModel` (hanya gambar).
    Prioritaskan ref `provider/model`. Ref bare dikualifikasi dari entri model penyedia berkapabilitas gambar yang dikonfigurasi hanya saat kecocokannya unik.
  </Step>
  <Step title="CLI lokal (hanya audio)">
    CLI lokal (jika terinstal):

    - `sherpa-onnx-offline` (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; menggunakan `WHISPER_CPP_MODEL` atau model tiny bawaan)
    - `whisper` (CLI Python; mengunduh model secara otomatis)

  </Step>
  <Step title="Gemini CLI">
    `gemini` menggunakan `read_many_files`.
  </Step>
  <Step title="Auth penyedia">
    - Entri `models.providers.*` yang dikonfigurasi dan mendukung kapabilitas dicoba sebelum urutan fallback bawaan.
    - Penyedia konfigurasi khusus gambar dengan model berkapabilitas gambar didaftarkan otomatis untuk pemahaman media meskipun bukan Plugin vendor bawaan.
    - Pemahaman gambar Ollama tersedia saat dipilih secara eksplisit, misalnya melalui `agents.defaults.imageModel` atau `openclaw infer image describe --model ollama/<vision-model>`.

    Urutan fallback bawaan:

    - Audio: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
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
Deteksi biner bersifat best-effort di macOS/Linux/Windows; pastikan CLI berada di `PATH` (kami memperluas `~`), atau setel model CLI eksplisit dengan path perintah lengkap.
</Note>

### Dukungan lingkungan proxy (model penyedia)

Saat pemahaman media **audio** dan **video** berbasis penyedia diaktifkan, OpenClaw menghormati variabel lingkungan proxy outbound standar untuk panggilan HTTP penyedia:

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
- `openrouter`: **gambar + audio**
- `google` (Gemini API): **gambar + audio + video**
- `qwen`: **gambar + video**
- `mistral`: **audio**
- `zai`: **gambar**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Any `models.providers.<id>.models[]` catalog with an image-capable model: **image**

Untuk entri CLI, **setel `capabilities` secara eksplisit** untuk menghindari kecocokan yang mengejutkan. Jika Anda menghilangkan `capabilities`, entri tersebut memenuhi syarat untuk daftar tempatnya muncul.

## Matriks dukungan penyedia (integrasi OpenClaw)

| Kapabilitas | Integrasi penyedia                                                                                                           | Catatan                                                                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gambar      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, penyedia konfigurasi | Plugin vendor mendaftarkan dukungan gambar; `openai/*` dapat menggunakan routing kunci API atau Codex OAuth; `codex/*` menggunakan giliran Codex app-server terbatas; MiniMax dan MiniMax OAuth sama-sama menggunakan `MiniMax-VL-01`; penyedia konfigurasi berkapabilitas gambar didaftarkan otomatis. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Transkripsi penyedia (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| Video      | Google, Qwen, Moonshot                                                                                                       | Pemahaman video penyedia melalui Plugin vendor; pemahaman video Qwen menggunakan endpoint Standard DashScope.                                                                                                                              |

<Note>
**Catatan MiniMax**

- Pemahaman gambar `minimax`, `minimax-cn`, `minimax-portal`, dan `minimax-portal-cn` berasal dari penyedia media `MiniMax-VL-01` milik Plugin.
- Perutean gambar otomatis tetap menggunakan `MiniMax-VL-01` meskipun metadata chat MiniMax M2.x lama mengklaim input gambar.

</Note>

## Panduan pemilihan model

- Utamakan model generasi terbaru terkuat yang tersedia untuk setiap kapabilitas media saat kualitas dan keamanan penting.
- Untuk agen berkemampuan alat yang menangani input tidak tepercaya, hindari model media yang lebih lama/lebih lemah.
- Pertahankan setidaknya satu cadangan per kapabilitas untuk ketersediaan (model berkualitas + model lebih cepat/lebih murah).
- Cadangan CLI (`whisper-cli`, `whisper`, `gemini`) berguna saat API penyedia tidak tersedia.
- Catatan `parakeet-mlx`: dengan `--output-dir`, OpenClaw membaca `<output-dir>/<media-basename>.txt` ketika format output adalah `txt` (atau tidak ditentukan); format non-`txt` kembali menggunakan stdout.

## Kebijakan lampiran

`attachments` per kapabilitas mengontrol lampiran mana yang diproses:

<ParamField path="mode" type='"first" | "all"' default="first">
  Apakah memproses lampiran terpilih pertama atau semuanya.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Batasi jumlah yang diproses.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferensi pemilihan di antara lampiran kandidat.
</ParamField>

Saat `mode: "all"`, output diberi label `[Image 1/2]`, `[Audio 2/2]`, dan seterusnya.

<AccordionGroup>
  <Accordion title="Perilaku ekstraksi lampiran file">
    - Teks file yang diekstrak dibungkus sebagai **konten eksternal tidak tepercaya** sebelum ditambahkan ke prompt media.
    - Blok yang disuntikkan menggunakan penanda batas eksplisit seperti `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` dan menyertakan baris metadata `Source: External`.
    - Jalur ekstraksi lampiran ini sengaja menghilangkan banner panjang `SECURITY NOTICE:` untuk menghindari pembengkakan prompt media; penanda batas dan metadata tetap ada.
    - Jika file tidak memiliki teks yang dapat diekstrak, OpenClaw menyuntikkan `[No extractable text]`.
    - Jika PDF kembali ke gambar halaman yang dirender di jalur ini, prompt media mempertahankan placeholder `[PDF content rendered to images; images not forwarded to model]` karena langkah ekstraksi lampiran ini meneruskan blok teks, bukan gambar PDF yang dirender.

  </Accordion>
</AccordionGroup>

## Contoh konfigurasi

<Tabs>
  <Tab title="Model bersama + penimpaan">
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
  <Tab title="Entri tunggal multimodal">
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

Ini menampilkan hasil per kapabilitas dan penyedia/model yang dipilih jika berlaku.

## Catatan

- Pemahaman bersifat **upaya terbaik**. Kesalahan tidak memblokir balasan.
- Lampiran tetap diteruskan ke model meskipun pemahaman dinonaktifkan.
- Gunakan `scope` untuk membatasi tempat pemahaman berjalan (misalnya hanya DM).

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Dukungan gambar & media](/id/nodes/images)

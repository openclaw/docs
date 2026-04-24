---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda ingin auth langganan Codex alih-alih kunci API
    - Anda memerlukan perilaku eksekusi agen GPT-5 yang lebih ketat
summary: Gunakan OpenAI melalui kunci API atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T09:24:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

OpenAI menyediakan API developer untuk model GPT. OpenClaw mendukung tiga rute keluarga OpenAI. Prefix model memilih rutenya:

- **Kunci API** — akses langsung OpenAI Platform dengan penagihan berbasis penggunaan (model `openai/*`)
- **Langganan Codex melalui PI** — masuk ChatGPT/Codex dengan akses langganan (model `openai-codex/*`)
- **Harness app-server Codex** — eksekusi app-server Codex native (model `openai/*` plus `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI secara eksplisit mendukung penggunaan OAuth berbasis langganan di alat eksternal dan alur kerja seperti OpenClaw.

<Note>
GPT-5.5 saat ini tersedia di OpenClaw melalui rute langganan/OAuth:
`openai-codex/gpt-5.5` dengan runner PI, atau `openai/gpt-5.5` dengan
harness app-server Codex. Akses langsung berbasis kunci API untuk `openai/gpt-5.5`
didukung setelah OpenAI mengaktifkan GPT-5.5 pada API publik; sampai saat itu gunakan
model yang diaktifkan API seperti `openai/gpt-5.4` untuk penyiapan `OPENAI_API_KEY`.
</Note>

<Note>
Mengaktifkan Plugin OpenAI, atau memilih model `openai-codex/*`, tidak
mengaktifkan Plugin app-server Codex bawaan. OpenClaw mengaktifkan Plugin itu hanya
saat Anda secara eksplisit memilih harness Codex native dengan
`embeddedHarness.runtime: "codex"` atau menggunakan ref model `codex/*` legacy.
</Note>

## Cakupan fitur OpenClaw

| OpenAI capability         | OpenClaw surface                                           | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | provider model `openai/<model>`                            | Ya                                                     |
| Model langganan Codex     | `openai-codex/<model>` dengan OAuth `openai-codex`         | Ya                                                     |
| Harness app-server Codex  | `openai/<model>` dengan `embeddedHarness.runtime: codex`   | Ya                                                     |
| Web search sisi server    | alat Responses OpenAI native                               | Ya, saat web search diaktifkan dan tidak ada provider yang dipin |
| Gambar                    | `image_generate`                                           | Ya                                                     |
| Video                     | `video_generate`                                           | Ya                                                     |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                  | Ya                                                     |
| Batch speech-to-text      | `tools.media.audio` / media understanding                  | Ya                                                     |
| Streaming speech-to-text  | Voice Call `streaming.provider: "openai"`                  | Ya                                                     |
| Realtime voice            | Voice Call `realtime.provider: "openai"` / Control UI Talk | Ya                                                     |
| Embeddings                | provider embedding memori                                  | Ya                                                     |

## Memulai

Pilih metode auth yang Anda inginkan dan ikuti langkah penyiapannya.

<Tabs>
  <Tab title="Kunci API (OpenAI Platform)">
    **Terbaik untuk:** akses API langsung dan penagihan berbasis penggunaan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat atau salin kunci API dari [dasbor OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Atau berikan kunci secara langsung:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Ringkasan rute

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API OpenAI Platform langsung | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API OpenAI Platform langsung | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Rute API langsung masa depan setelah OpenAI mengaktifkan GPT-5.5 di API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` adalah rute langsung OpenAI berbasis kunci API kecuali Anda secara eksplisit memaksa
    harness app-server Codex. GPT-5.5 sendiri saat ini hanya tersedia melalui langganan/OAuth;
    gunakan `openai-codex/*` untuk OAuth Codex melalui runner PI default.
    </Note>

    ### Contoh config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **tidak** mengekspos `openai/gpt-5.3-codex-spark`. Permintaan API OpenAI live menolak model tersebut, dan katalog Codex saat ini juga tidak mengeksposnya.
    </Warning>

  </Tab>

  <Tab title="Langganan Codex">
    **Terbaik untuk:** menggunakan langganan ChatGPT/Codex Anda alih-alih kunci API terpisah. Codex cloud memerlukan sign-in ChatGPT.

    <Steps>
      <Step title="Jalankan OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Atau jalankan OAuth secara langsung:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Untuk penyiapan headless atau yang tidak ramah callback, tambahkan `--device-code` untuk masuk dengan alur device-code ChatGPT alih-alih callback browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Setel model default">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Ringkasan rute

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | OAuth ChatGPT/Codex melalui PI | Sign-in Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex | Auth app-server Codex |

    <Note>
    Tetap gunakan id provider `openai-codex` untuk perintah auth/profile. Prefix model `openai-codex/*`
    juga merupakan rute PI eksplisit untuk OAuth Codex.
    Ini tidak memilih atau mengaktifkan otomatis harness app-server Codex bawaan.
    </Note>

    ### Contoh config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding tidak lagi mengimpor materi OAuth dari `~/.codex`. Masuklah dengan OAuth browser (default) atau alur device-code di atas — OpenClaw mengelola kredensial hasilnya di store auth agennya sendiri.
    </Note>

    ### Indikator status

    Chat `/status` menampilkan harness embedded mana yang aktif untuk sesi
    saat ini. Harness PI default tampil sebagai `Runner: pi (embedded)` dan
    tidak menambahkan badge terpisah. Saat harness app-server Codex bawaan
    dipilih, `/status` menambahkan id harness non-PI di samping `Fast`, misalnya
    `Fast · codex`. Sesi yang ada mempertahankan id harness yang tercatat, jadi gunakan
    `/new` atau `/reset` setelah mengubah `embeddedHarness` jika Anda ingin `/status`
    mencerminkan pilihan PI/Codex yang baru.

    ### Batas jendela konteks

    OpenClaw memperlakukan metadata model dan batas konteks runtime sebagai nilai yang terpisah.

    Untuk `openai-codex/gpt-5.5` melalui OAuth Codex:

    - `contextWindow` native: `1000000`
    - Batas `contextTokens` runtime default: `272000`

    Batas default yang lebih kecil memiliki karakteristik latensi dan kualitas yang lebih baik dalam praktik. Override dengan `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Gunakan `contextWindow` untuk mendeklarasikan metadata model native. Gunakan `contextTokens` untuk membatasi anggaran konteks runtime.
    </Note>

  </Tab>
</Tabs>

## Generasi gambar

Plugin `openai` bawaan mendaftarkan generasi gambar melalui alat `image_generate`.
Plugin ini mendukung generasi gambar berbasis kunci API OpenAI maupun
generasi gambar OAuth Codex melalui ref model `openai/gpt-image-2` yang sama.

| Capability                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | Sign-in OAuth OpenAI Codex           |
| Transport                 | API Images OpenAI                  | Backend Codex Responses              |
| Maks gambar per permintaan| 4                                  | 4                                    |
| Mode edit                 | Diaktifkan (hingga 5 gambar referensi) | Diaktifkan (hingga 5 gambar referensi) |
| Override ukuran           | Didukung, termasuk ukuran 2K/4K    | Didukung, termasuk ukuran 2K/4K      |
| Rasio aspek / resolusi    | Tidak diteruskan ke API Images OpenAI | Dipetakan ke ukuran yang didukung bila aman |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Lihat [Image Generation](/id/tools/image-generation) untuk parameter alat bersama, pemilihan provider, dan perilaku failover.
</Note>

`gpt-image-2` adalah default untuk generasi text-to-image OpenAI maupun
penyuntingan gambar. `gpt-image-1` tetap dapat digunakan sebagai override model eksplisit, tetapi alur kerja gambar OpenAI baru
seharusnya menggunakan `openai/gpt-image-2`.

Untuk instalasi OAuth Codex, pertahankan ref `openai/gpt-image-2` yang sama. Saat
profil OAuth `openai-codex` dikonfigurasi, OpenClaw meresolusikan token akses OAuth
yang tersimpan itu dan mengirim permintaan gambar melalui backend Codex Responses. OpenClaw
tidak terlebih dahulu mencoba `OPENAI_API_KEY` atau diam-diam fallback ke kunci API untuk
permintaan tersebut. Konfigurasikan `models.providers.openai` secara eksplisit dengan kunci API,
`baseUrl` kustom, atau endpoint Azure saat Anda menginginkan rute API Images OpenAI langsung.
Jika endpoint gambar kustom tersebut berada pada alamat LAN/pribadi yang tepercaya, setel juga
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw tetap
memblokir endpoint gambar kompatibel OpenAI privat/internal kecuali opt-in ini
ada.

Hasilkan:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Edit:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generasi video

Plugin `openai` bawaan mendaftarkan generasi video melalui alat `video_generate`.

| Capability       | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Model default    | `openai/sora-2`                                                                   |
| Mode             | Text-to-video, image-to-video, edit video tunggal                                 |
| Input referensi  | 1 gambar atau 1 video                                                             |
| Override ukuran  | Didukung                                                                          |
| Override lain    | `aspectRatio`, `resolution`, `audio`, `watermark` diabaikan dengan peringatan alat |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Lihat [Video Generation](/id/tools/video-generation) untuk parameter alat bersama, pemilihan provider, dan perilaku failover.
</Note>

## Kontribusi prompt GPT-5

OpenClaw menambahkan kontribusi prompt GPT-5 bersama untuk run keluarga GPT-5 di seluruh provider. Ini berlaku berdasarkan id model, sehingga `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, dan ref GPT-5 kompatibel lainnya menerima overlay yang sama. Model GPT-4.x yang lebih lama tidak menerimanya.

Harness Codex native bawaan menggunakan perilaku GPT-5 dan overlay Heartbeat yang sama melalui instruksi developer app-server Codex, sehingga sesi `openai/gpt-5.x` yang dipaksa melalui `embeddedHarness.runtime: "codex"` mempertahankan panduan follow-through dan Heartbeat proaktif yang sama meskipun Codex memiliki sisa prompt harness.

Kontribusi GPT-5 menambahkan kontrak perilaku bertag untuk persistensi persona, keamanan eksekusi, disiplin alat, bentuk output, pemeriksaan penyelesaian, dan verifikasi. Perilaku balasan khusus channel dan pesan senyap tetap berada di prompt sistem OpenClaw bersama dan kebijakan pengiriman keluar. Panduan GPT-5 selalu diaktifkan untuk model yang cocok. Lapisan gaya interaksi yang ramah bersifat terpisah dan dapat dikonfigurasi.

| Value                  | Effect                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (default) | Aktifkan lapisan gaya interaksi yang ramah  |
| `"on"`                 | Alias untuk `"friendly"`                    |
| `"off"`                | Nonaktifkan hanya lapisan gaya ramah        |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Nilai tidak peka huruf besar/kecil saat runtime, sehingga `"Off"` dan `"off"` sama-sama menonaktifkan lapisan gaya ramah.
</Tip>

<Note>
`plugins.entries.openai.config.personality` legacy masih dibaca sebagai fallback kompatibilitas saat pengaturan bersama `agents.defaults.promptOverlays.gpt5.personality` tidak disetel.
</Note>

## Voice dan speech

<AccordionGroup>
  <Accordion title="Sintesis ucapan (TTS)">
    Plugin `openai` bawaan mendaftarkan sintesis ucapan untuk permukaan `messages.tts`.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Speed | `messages.tts.providers.openai.speed` | (tidak disetel) |
    | Instructions | `messages.tts.providers.openai.instructions` | (tidak disetel, hanya `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` untuk voice note, `mp3` untuk file |
    | API key | `messages.tts.providers.openai.apiKey` | Fallback ke `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Model yang tersedia: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voice yang tersedia: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Setel `OPENAI_TTS_BASE_URL` untuk mengoverride base URL TTS tanpa memengaruhi endpoint API chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `openai` bawaan mendaftarkan batch speech-to-text melalui
    permukaan transkripsi media-understanding OpenClaw.

    - Model default: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Jalur input: unggah file audio multipart
    - Didukung oleh OpenClaw di mana pun transkripsi audio masuk menggunakan
      `tools.media.audio`, termasuk segmen voice-channel Discord dan lampiran
      audio channel

    Untuk memaksa OpenAI bagi transkripsi audio masuk:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Petunjuk bahasa dan prompt diteruskan ke OpenAI saat disediakan oleh
    config media audio bersama atau permintaan transkripsi per-panggilan.

  </Accordion>

  <Accordion title="Transkripsi realtime">
    Plugin `openai` bawaan mendaftarkan transkripsi realtime untuk Plugin Voice Call.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Language | `...openai.language` | (tidak disetel) |
    | Prompt | `...openai.prompt` | (tidak disetel) |
    | Silence duration | `...openai.silenceDurationMs` | `800` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Fallback ke `OPENAI_API_KEY` |

    <Note>
    Menggunakan koneksi WebSocket ke `wss://api.openai.com/v1/realtime` dengan audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Provider streaming ini ditujukan untuk jalur transkripsi realtime Voice Call; voice Discord saat ini merekam segmen pendek dan menggunakan jalur transkripsi batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voice realtime">
    Plugin `openai` bawaan mendaftarkan voice realtime untuk Plugin Voice Call.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | Silence duration | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Fallback ke `OPENAI_API_KEY` |

    <Note>
    Mendukung Azure OpenAI melalui kunci config `azureEndpoint` dan `azureDeployment`. Mendukung tool calling dua arah. Menggunakan format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Provider `openai` bawaan dapat menargetkan resource Azure OpenAI untuk generasi gambar
dengan mengoverride base URL. Pada jalur image-generation, OpenClaw
mendeteksi hostname Azure pada `models.providers.openai.baseUrl` dan beralih ke
bentuk permintaan Azure secara otomatis.

<Note>
Voice realtime menggunakan jalur konfigurasi terpisah
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
dan tidak dipengaruhi oleh `models.providers.openai.baseUrl`. Lihat accordion **Voice
realtime** di bawah [Voice dan speech](#voice-dan-speech) untuk pengaturan
Azure-nya.
</Note>

Gunakan Azure OpenAI ketika:

- Anda sudah memiliki langganan, kuota, atau perjanjian enterprise Azure OpenAI
- Anda membutuhkan residensi data regional atau kontrol kepatuhan yang disediakan Azure
- Anda ingin menjaga lalu lintas tetap berada di dalam tenancy Azure yang ada

### Konfigurasi

Untuk generasi gambar Azure melalui provider `openai` bawaan, arahkan
`models.providers.openai.baseUrl` ke resource Azure Anda dan setel `apiKey` ke
kunci Azure OpenAI (bukan kunci OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw mengenali sufiks host Azure ini untuk rute generasi gambar Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Untuk permintaan image-generation pada host Azure yang dikenali, OpenClaw:

- Mengirim header `api-key` alih-alih `Authorization: Bearer`
- Menggunakan jalur berbatas deployment (`/openai/deployments/{deployment}/...`)
- Menambahkan `?api-version=...` ke setiap permintaan

Base URL lain (OpenAI publik, proxy kompatibel OpenAI) tetap menggunakan
bentuk permintaan gambar OpenAI standar.

<Note>
Perutean Azure untuk jalur image-generation provider `openai` memerlukan
OpenClaw 2026.4.22 atau yang lebih baru. Versi sebelumnya memperlakukan
`openai.baseUrl` kustom seperti endpoint OpenAI publik dan akan gagal terhadap deployment
gambar Azure.
</Note>

### Versi API

Setel `AZURE_OPENAI_API_VERSION` untuk mem-pin versi preview atau GA Azure tertentu
untuk jalur generasi gambar Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Defaultnya adalah `2024-12-01-preview` saat variabel tidak disetel.

### Nama model adalah nama deployment

Azure OpenAI mengikat model ke deployment. Untuk permintaan generasi gambar Azure
yang dirutekan melalui provider `openai` bawaan, field `model` di OpenClaw
harus berupa **nama deployment Azure** yang Anda konfigurasi di portal Azure, bukan
id model OpenAI publik.

Jika Anda membuat deployment bernama `gpt-image-2-prod` yang melayani `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Aturan nama deployment yang sama berlaku pada panggilan generasi gambar yang dirutekan melalui
provider `openai` bawaan.

### Ketersediaan regional

Generasi gambar Azure saat ini hanya tersedia di subset region
(misalnya `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Periksa daftar region Microsoft saat ini sebelum membuat
deployment, dan pastikan model spesifik tersebut ditawarkan di region Anda.

### Perbedaan parameter

Azure OpenAI dan OpenAI publik tidak selalu menerima parameter gambar yang sama.
Azure dapat menolak opsi yang diizinkan oleh OpenAI publik (misalnya nilai
`background` tertentu pada `gpt-image-2`) atau mengeksposnya hanya pada versi model
tertentu. Perbedaan ini berasal dari Azure dan model yang mendasarinya, bukan
OpenClaw. Jika permintaan Azure gagal dengan galat validasi, periksa
set parameter yang didukung oleh deployment dan versi API spesifik Anda di
portal Azure.

<Note>
Azure OpenAI menggunakan perilaku transport dan compat native tetapi tidak menerima
header atribusi tersembunyi OpenClaw — lihat accordion **Rute native vs kompatibel OpenAI**
di bawah [Konfigurasi lanjutan](#konfigurasi-lanjutan).

Untuk lalu lintas chat atau Responses di Azure (di luar generasi gambar), gunakan
alur onboarding atau config provider Azure khusus — `openai.baseUrl` saja
tidak akan mengambil bentuk API/auth Azure. Terdapat provider
`azure-openai-responses/*` terpisah; lihat
accordion Server-side compaction di bawah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw menggunakan WebSocket-first dengan fallback SSE (`"auto"`) untuk `openai/*` dan `openai-codex/*`.

    Dalam mode `"auto"`, OpenClaw:
    - Mencoba ulang satu kegagalan WebSocket awal sebelum fallback ke SSE
    - Setelah kegagalan, menandai WebSocket sebagai degraded selama ~60 detik dan menggunakan SSE selama cool-down
    - Melampirkan header identitas sesi dan giliran yang stabil untuk retry dan reconnect
    - Menormalkan penghitung penggunaan (`input_tokens` / `prompt_tokens`) di seluruh varian transport

    | Value | Behavior |
    |-------|----------|
    | `"auto"` (default) | WebSocket terlebih dahulu, fallback SSE |
    | `"sse"` | Paksa hanya SSE |
    | `"websocket"` | Paksa hanya WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Dokumen OpenAI terkait:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Warm-up WebSocket">
    OpenClaw mengaktifkan warm-up WebSocket secara default untuk `openai/*` dan `openai-codex/*` untuk mengurangi latensi giliran pertama.

    ```json5
    // Nonaktifkan warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Mode cepat">
    OpenClaw mengekspos toggle mode cepat bersama untuk `openai/*` dan `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Saat diaktifkan, OpenClaw memetakan mode cepat ke pemrosesan prioritas OpenAI (`service_tier = "priority"`). Nilai `service_tier` yang ada dipertahankan, dan mode cepat tidak menulis ulang `reasoning` atau `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Override sesi menang atas config. Menghapus override sesi di UI Sessions mengembalikan sesi ke default yang dikonfigurasi.
    </Note>

  </Accordion>

  <Accordion title="Pemrosesan prioritas (service_tier)">
    API OpenAI mengekspos pemrosesan prioritas melalui `service_tier`. Setel per model di OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Nilai yang didukung: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` hanya diteruskan ke endpoint OpenAI native (`api.openai.com`) dan endpoint Codex native (`chatgpt.com/backend-api`). Jika Anda merutekan salah satu provider melalui proxy, OpenClaw membiarkan `service_tier` tetap apa adanya.
    </Warning>

  </Accordion>

  <Accordion title="Compaction sisi server (Responses API)">
    Untuk model Responses OpenAI langsung (`openai/*` di `api.openai.com`), wrapper stream Pi-harness Plugin OpenAI mengaktifkan compaction sisi server secara otomatis:

    - Memaksa `store: true` (kecuali compat model menetapkan `supportsStore: false`)
    - Menyuntikkan `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` default: 70% dari `contextWindow` (atau `80000` jika tidak tersedia)

    Ini berlaku pada jalur Pi harness bawaan dan pada hook provider OpenAI yang digunakan oleh run tersemat. Harness app-server Codex native mengelola konteksnya sendiri melalui Codex dan dikonfigurasi secara terpisah dengan `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Aktifkan secara eksplisit">
        Berguna untuk endpoint kompatibel seperti Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Ambang kustom">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Nonaktifkan">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` hanya mengontrol injeksi `context_management`. Model Responses OpenAI langsung tetap memaksa `store: true` kecuali compat menetapkan `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT strict-agentic">
    Untuk run keluarga GPT-5 pada `openai/*`, OpenClaw dapat menggunakan kontrak eksekusi tersemat yang lebih ketat:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Dengan `strict-agentic`, OpenClaw:
    - Tidak lagi memperlakukan giliran yang hanya berisi rencana sebagai progres yang berhasil ketika tindakan alat tersedia
    - Mencoba ulang giliran dengan steer act-now
    - Mengaktifkan `update_plan` secara otomatis untuk pekerjaan yang substansial
    - Menampilkan status terblokir yang eksplisit jika model terus merencanakan tanpa bertindak

    <Note>
    Dibatasi hanya untuk run keluarga GPT-5 OpenAI dan Codex. Provider lain dan keluarga model yang lebih lama tetap menggunakan perilaku default.
    </Note>

  </Accordion>

  <Accordion title="Rute native vs kompatibel OpenAI">
    OpenClaw memperlakukan endpoint OpenAI langsung, Codex, dan Azure OpenAI secara berbeda dari proxy `/v1` generik yang kompatibel dengan OpenAI:

    **Rute native** (`openai/*`, Azure OpenAI):
    - Mempertahankan `reasoning: { effort: "none" }` hanya untuk model yang mendukung effort `none` OpenAI
    - Menghilangkan reasoning yang dinonaktifkan untuk model atau proxy yang menolak `reasoning.effort: "none"`
    - Menetapkan skema alat ke mode strict secara default
    - Melampirkan header atribusi tersembunyi hanya pada host native yang terverifikasi
    - Mempertahankan pembentukan permintaan khusus OpenAI (`service_tier`, `store`, reasoning-compat, prompt-cache hints)

    **Rute proxy/kompatibel:**
    - Menggunakan perilaku compat yang lebih longgar
    - Tidak memaksa skema alat strict atau header khusus-native

    Azure OpenAI menggunakan perilaku transport dan compat native tetapi tidak menerima header atribusi tersembunyi.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Image generation" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan provider.
  </Card>
  <Card title="Video generation" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan provider.
  </Card>
  <Card title="OAuth and auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>

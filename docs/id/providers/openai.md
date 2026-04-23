---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda ingin autentikasi langganan Codex alih-alih kunci API
    - Anda memerlukan perilaku eksekusi agen GPT-5 yang lebih ketat
summary: Gunakan OpenAI melalui kunci API atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T13:58:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac42660234e1971440f6de3b04adb1d3a1fddca20219fb68936c36e4c2f95265
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI menyediakan API developer untuk model GPT. OpenClaw mendukung dua jalur autentikasi:

  - **Kunci API** — akses langsung ke OpenAI Platform dengan penagihan berbasis penggunaan (model `openai/*`)
  - **Langganan Codex** — masuk ChatGPT/Codex dengan akses langganan (model `openai-codex/*`)

  OpenAI secara eksplisit mendukung penggunaan OAuth langganan di alat dan alur kerja eksternal seperti OpenClaw.

  ## Cakupan fitur OpenClaw

  | Kemampuan OpenAI          | Permukaan OpenClaw                        | Status                                                  |
  | ------------------------- | ----------------------------------------- | ------------------------------------------------------- |
  | Chat / Responses          | penyedia model `openai/<model>`           | Ya                                                      |
  | Model langganan Codex     | penyedia model `openai-codex/<model>`     | Ya                                                      |
  | Pencarian web sisi server | alat Native OpenAI Responses              | Ya, saat pencarian web diaktifkan dan tidak ada penyedia yang dipatok |
  | Gambar                    | `image_generate`                          | Ya                                                      |
  | Video                     | `video_generate`                          | Ya                                                      |
  | Text-to-speech            | `messages.tts.provider: "openai"` / `tts` | Ya                                                      |
  | Speech-to-text batch      | `tools.media.audio` / pemahaman media     | Ya                                                      |
  | Streaming speech-to-text  | Voice Call `streaming.provider: "openai"` | Ya                                                      |
  | Suara realtime            | Voice Call `realtime.provider: "openai"`  | Ya                                                      |
  | Embeddings                | penyedia embedding memori                 | Ya                                                      |

  ## Memulai

  Pilih metode autentikasi yang Anda inginkan dan ikuti langkah-langkah penyiapannya.

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
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Ringkasan jalur

    | Ref model | Jalur | Autentikasi |
    |-----------|-------|-------------|
    | `openai/gpt-5.4` | API OpenAI Platform langsung | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API OpenAI Platform langsung | `OPENAI_API_KEY` |

    <Note>
    Masuk ChatGPT/Codex diarahkan melalui `openai-codex/*`, bukan `openai/*`.
    </Note>

    ### Contoh config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **tidak** mengekspos `openai/gpt-5.3-codex-spark` pada jalur API langsung. Permintaan API OpenAI langsung menolak model tersebut. Spark hanya untuk Codex.
    </Warning>

  </Tab>

  <Tab title="Langganan Codex">
    **Terbaik untuk:** menggunakan langganan ChatGPT/Codex Anda alih-alih kunci API terpisah. Codex cloud memerlukan masuk ChatGPT.

    <Steps>
      <Step title="Jalankan OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Atau jalankan OAuth secara langsung:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Untuk penyiapan headless atau yang tidak bersahabat dengan callback, tambahkan `--device-code` untuk masuk dengan alur kode perangkat ChatGPT alih-alih callback browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Tetapkan model default">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Ringkasan jalur

    | Ref model | Jalur | Autentikasi |
    |-----------|-------|-------------|
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | masuk Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | masuk Codex (bergantung pada entitlement) |

    <Note>
    Jalur ini sengaja dipisahkan dari `openai/gpt-5.4`. Gunakan `openai/*` dengan kunci API untuk akses Platform langsung, dan `openai-codex/*` untuk akses langganan Codex.
    </Note>

    ### Contoh config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    Onboarding tidak lagi mengimpor materi OAuth dari `~/.codex`. Masuklah dengan OAuth browser (default) atau alur kode perangkat di atas — OpenClaw mengelola kredensial yang dihasilkan di penyimpanan autentikasi agennya sendiri.
    </Note>

    ### Batas context window

    OpenClaw memperlakukan metadata model dan batas konteks runtime sebagai nilai yang terpisah.

    Untuk `openai-codex/gpt-5.4`:

    - `contextWindow` native: `1050000`
    - Batas `contextTokens` runtime default: `272000`

    Batas default yang lebih kecil memiliki karakteristik latensi dan kualitas yang lebih baik dalam praktik. Ganti nilainya dengan `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
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

## Pembuatan gambar

Plugin `openai` bawaan mendaftarkan pembuatan gambar melalui alat `image_generate`.

| Kemampuan                | Nilai                              |
| ------------------------ | ---------------------------------- |
| Model default            | `openai/gpt-image-2`               |
| Gambar maksimum per permintaan | 4                            |
| Mode edit                | Diaktifkan (hingga 5 gambar referensi) |
| Override ukuran          | Didukung, termasuk ukuran 2K/4K    |
| Rasio aspek / resolusi   | Tidak diteruskan ke OpenAI Images API |

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
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

`gpt-image-2` adalah default untuk pembuatan teks-ke-gambar OpenAI dan pengeditan gambar. `gpt-image-1` tetap dapat digunakan sebagai override model eksplisit, tetapi alur kerja gambar OpenAI yang baru sebaiknya menggunakan `openai/gpt-image-2`.

Hasilkan:

```
/tool image_generate model=openai/gpt-image-2 prompt="Poster peluncuran yang rapi untuk OpenClaw di macOS" size=3840x2160 count=1
```

Edit:

```
/tool image_generate model=openai/gpt-image-2 prompt="Pertahankan bentuk objek, ubah materialnya menjadi kaca transparan" image=/path/to/reference.png size=1024x1536
```

## Pembuatan video

Plugin `openai` bawaan mendaftarkan pembuatan video melalui alat `video_generate`.

| Kemampuan       | Nilai                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Model default    | `openai/sora-2`                                                                   |
| Mode            | Teks-ke-video, gambar-ke-video, edit video tunggal                                 |
| Input referensi | 1 gambar atau 1 video                                                              |
| Override ukuran | Didukung                                                                          |
| Override lain   | `aspectRatio`, `resolution`, `audio`, `watermark` diabaikan dengan peringatan alat |

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
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

## Kontribusi prompt GPT-5

OpenClaw menambahkan kontribusi prompt GPT-5 bersama untuk eksekusi keluarga GPT-5 di seluruh penyedia. Ini diterapkan berdasarkan id model, sehingga `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4`, dan ref GPT-5 kompatibel lainnya menerima overlay yang sama. Model GPT-4.x yang lebih lama tidak menerimanya.

Penyedia harness Codex native bawaan (`codex/*`) menggunakan perilaku GPT-5 dan overlay Heartbeat yang sama melalui instruksi developer server-aplikasi Codex, sehingga sesi `codex/gpt-5.x` mempertahankan panduan tindak lanjut dan Heartbeat proaktif yang sama meskipun Codex menangani sisa prompt harness.

Kontribusi GPT-5 menambahkan kontrak perilaku bertag untuk persistensi persona, keamanan eksekusi, disiplin alat, bentuk output, pemeriksaan penyelesaian, dan verifikasi. Perilaku balasan khusus channel dan pesan senyap tetap berada di prompt sistem OpenClaw bersama dan kebijakan pengiriman keluar. Panduan GPT-5 selalu diaktifkan untuk model yang cocok. Lapisan gaya interaksi ramah terpisah dan dapat dikonfigurasi.

| Nilai                  | Efek                                       |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (default) | Aktifkan lapisan gaya interaksi ramah      |
| `"on"`                 | Alias untuk `"friendly"`                   |
| `"off"`                | Nonaktifkan hanya lapisan gaya ramah       |

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
Nilai tidak peka huruf besar/kecil saat runtime, jadi `"Off"` dan `"off"` keduanya menonaktifkan lapisan gaya ramah.
</Tip>

<Note>
`plugins.entries.openai.config.personality` lama masih dibaca sebagai fallback kompatibilitas saat pengaturan bersama `agents.defaults.promptOverlays.gpt5.personality` tidak disetel.
</Note>

## Suara dan speech

<AccordionGroup>
  <Accordion title="Sintesis ucapan (TTS)">
    Plugin `openai` bawaan mendaftarkan sintesis ucapan untuk permukaan `messages.tts`.

    | Pengaturan | Jalur config | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Suara | `messages.tts.providers.openai.voice` | `coral` |
    | Kecepatan | `messages.tts.providers.openai.speed` | (tidak disetel) |
    | Instruksi | `messages.tts.providers.openai.instructions` | (tidak disetel, hanya `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` untuk catatan suara, `mp3` untuk file |
    | Kunci API | `messages.tts.providers.openai.apiKey` | Fallback ke `OPENAI_API_KEY` |
    | URL dasar | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Model yang tersedia: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Suara yang tersedia: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

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
    Setel `OPENAI_TTS_BASE_URL` untuk mengganti URL dasar TTS tanpa memengaruhi endpoint API chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `openai` bawaan mendaftarkan speech-to-text batch melalui
    permukaan transkripsi media-understanding OpenClaw.

    - Model default: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Jalur input: unggah file audio multipart
    - Didukung oleh OpenClaw di mana pun transkripsi audio masuk menggunakan
      `tools.media.audio`, termasuk segmen voice-channel Discord dan lampiran
      audio channel

    Untuk memaksa OpenAI untuk transkripsi audio masuk:

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
    config media audio bersama atau permintaan transkripsi per panggilan.

  </Accordion>

  <Accordion title="Transkripsi realtime">
    Plugin `openai` bawaan mendaftarkan transkripsi realtime untuk plugin Voice Call.

    | Pengaturan | Jalur config | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Bahasa | `...openai.language` | (tidak disetel) |
    | Prompt | `...openai.prompt` | (tidak disetel) |
    | Durasi senyap | `...openai.silenceDurationMs` | `800` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Kunci API | `...openai.apiKey` | Fallback ke `OPENAI_API_KEY` |

    <Note>
    Menggunakan koneksi WebSocket ke `wss://api.openai.com/v1/realtime` dengan audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Penyedia streaming ini untuk jalur transkripsi realtime Voice Call; voice Discord saat ini merekam segmen pendek dan menggunakan jalur transkripsi batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Suara realtime">
    Plugin `openai` bawaan mendaftarkan suara realtime untuk plugin Voice Call.

    | Pengaturan | Jalur config | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Suara | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Durasi senyap | `...openai.silenceDurationMs` | `500` |
    | Kunci API | `...openai.apiKey` | Fallback ke `OPENAI_API_KEY` |

    <Note>
    Mendukung Azure OpenAI melalui kunci config `azureEndpoint` dan `azureDeployment`. Mendukung pemanggilan alat dua arah. Menggunakan format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Penyedia `openai` bawaan dapat menargetkan resource Azure OpenAI untuk pembuatan
gambar dengan mengganti URL dasar. Pada jalur pembuatan gambar, OpenClaw
mendeteksi hostname Azure pada `models.providers.openai.baseUrl` dan beralih ke
bentuk permintaan Azure secara otomatis.

<Note>
Suara realtime menggunakan jalur konfigurasi terpisah
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
dan tidak dipengaruhi oleh `models.providers.openai.baseUrl`. Lihat accordion **Suara
realtime** di bawah [Suara dan speech](#voice-and-speech) untuk pengaturan
Azure-nya.
</Note>

Gunakan Azure OpenAI ketika:

- Anda sudah memiliki langganan, kuota, atau perjanjian enterprise Azure OpenAI
- Anda memerlukan residensi data regional atau kontrol kepatuhan yang disediakan Azure
- Anda ingin mempertahankan lalu lintas di dalam tenancy Azure yang sudah ada

### Konfigurasi

Untuk pembuatan gambar Azure melalui penyedia `openai` bawaan, arahkan
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

OpenClaw mengenali sufiks host Azure berikut untuk jalur pembuatan gambar Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Untuk permintaan pembuatan gambar pada host Azure yang dikenali, OpenClaw:

- Mengirim header `api-key` alih-alih `Authorization: Bearer`
- Menggunakan jalur yang dicakup deployment (`/openai/deployments/{deployment}/...`)
- Menambahkan `?api-version=...` ke setiap permintaan

URL dasar lain (OpenAI publik, proxy yang kompatibel dengan OpenAI) tetap menggunakan
bentuk permintaan gambar OpenAI standar.

<Note>
Perutean Azure untuk jalur pembuatan gambar penyedia `openai` memerlukan
OpenClaw 2026.4.22 atau yang lebih baru. Versi sebelumnya memperlakukan
`openai.baseUrl` kustom apa pun seperti endpoint OpenAI publik dan akan gagal terhadap
deployment gambar Azure.
</Note>

### Versi API

Setel `AZURE_OPENAI_API_VERSION` untuk mematok versi pratinjau atau GA Azure tertentu
untuk jalur pembuatan gambar Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Default-nya adalah `2024-12-01-preview` saat variabel tidak disetel.

### Nama model adalah nama deployment

Azure OpenAI mengikat model ke deployment. Untuk permintaan pembuatan gambar Azure
yang dirutekan melalui penyedia `openai` bawaan, field `model` di OpenClaw
harus berupa **nama deployment Azure** yang Anda konfigurasi di portal Azure, bukan
id model OpenAI publik.

Jika Anda membuat deployment bernama `gpt-image-2-prod` yang menyajikan `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Poster yang bersih" size=1024x1024 count=1
```

Aturan nama deployment yang sama berlaku untuk panggilan pembuatan gambar yang dirutekan melalui
penyedia `openai` bawaan.

### Ketersediaan regional

Pembuatan gambar Azure saat ini hanya tersedia di sebagian wilayah
(misalnya `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Periksa daftar wilayah Microsoft saat ini sebelum membuat
deployment, dan konfirmasikan bahwa model spesifik tersebut ditawarkan di wilayah Anda.

### Perbedaan parameter

Azure OpenAI dan OpenAI publik tidak selalu menerima parameter gambar yang sama.
Azure dapat menolak opsi yang diizinkan oleh OpenAI publik (misalnya nilai
`background` tertentu pada `gpt-image-2`) atau hanya mengeksposnya pada versi
model tertentu. Perbedaan ini berasal dari Azure dan model yang mendasarinya, bukan
OpenClaw. Jika permintaan Azure gagal dengan kesalahan validasi, periksa
kumpulan parameter yang didukung oleh deployment dan versi API spesifik Anda di
portal Azure.

<Note>
Azure OpenAI menggunakan transport native dan perilaku compat tetapi tidak menerima
header atribusi tersembunyi OpenClaw. Lihat accordion **Native vs rute yang kompatibel dengan OpenAI**
di bawah [Konfigurasi lanjutan](#advanced-configuration)
untuk detailnya.
</Note>

<Tip>
Untuk penyedia Azure OpenAI Responses terpisah (berbeda dari penyedia `openai`),
lihat ref model `azure-openai-responses/*` di
accordion [Compaction sisi server](#server-side-compaction-responses-api).
</Tip>

<Note>
Lalu lintas chat dan Responses Azure memerlukan config penyedia/API khusus Azure selain
override URL dasar. Jika Anda ingin panggilan model Azure di luar pembuatan
gambar, gunakan alur onboarding atau config penyedia yang menetapkan
bentuk API/autentikasi Azure yang sesuai daripada mengasumsikan `openai.baseUrl` saja sudah cukup.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw menggunakan WebSocket terlebih dahulu dengan fallback SSE (`"auto"`) untuk `openai/*` dan `openai-codex/*`.

    Dalam mode `"auto"`, OpenClaw:
    - Mencoba ulang satu kegagalan WebSocket awal sebelum fallback ke SSE
    - Setelah kegagalan, menandai WebSocket sebagai menurun selama ~60 detik dan menggunakan SSE selama masa pendinginan
    - Melampirkan header identitas sesi dan giliran yang stabil untuk percobaan ulang dan penyambungan kembali
    - Menormalkan penghitung penggunaan (`input_tokens` / `prompt_tokens`) di seluruh varian transport

    | Nilai | Perilaku |
    |-------|----------|
    | `"auto"` (default) | WebSocket terlebih dahulu, fallback SSE |
    | `"sse"` | Paksa SSE saja |
    | `"websocket"` | Paksa WebSocket saja |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
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
    OpenClaw mengaktifkan warm-up WebSocket secara default untuk `openai/*` guna mengurangi latensi giliran pertama.

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

<a id="openai-fast-mode"></a>

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
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Override sesi mengalahkan config. Menghapus override sesi di UI Sessions mengembalikan sesi ke default yang dikonfigurasi.
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
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Nilai yang didukung: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` hanya diteruskan ke endpoint OpenAI native (`api.openai.com`) dan endpoint Codex native (`chatgpt.com/backend-api`). Jika Anda merutekan salah satu penyedia melalui proxy, OpenClaw membiarkan `service_tier` tidak tersentuh.
    </Warning>

  </Accordion>

  <Accordion title="Compaction sisi server (Responses API)">
    Untuk model OpenAI Responses langsung (`openai/*` pada `api.openai.com`), OpenClaw mengaktifkan otomatis Compaction sisi server:

    - Memaksa `store: true` (kecuali compat model menetapkan `supportsStore: false`)
    - Menyisipkan `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` default: 70% dari `contextWindow` (atau `80000` saat tidak tersedia)

    <Tabs>
      <Tab title="Aktifkan secara eksplisit">
        Berguna untuk endpoint yang kompatibel seperti Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
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
    `responsesServerCompaction` hanya mengontrol penyisipan `context_management`. Model OpenAI Responses langsung tetap memaksa `store: true` kecuali compat menetapkan `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentik ketat">
    Untuk eksekusi keluarga GPT-5 pada `openai/*` dan `openai-codex/*`, OpenClaw dapat menggunakan kontrak eksekusi embedded yang lebih ketat:

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
    - Tidak lagi memperlakukan giliran yang hanya berisi rencana sebagai progres yang berhasil saat tindakan alat tersedia
    - Mencoba ulang giliran dengan arahan bertindak sekarang
    - Mengaktifkan otomatis `update_plan` untuk pekerjaan yang substansial
    - Menampilkan status terblokir yang eksplisit jika model terus merencanakan tanpa bertindak

    <Note>
    Dicakup hanya untuk eksekusi keluarga GPT-5 OpenAI dan Codex. Penyedia lain dan keluarga model yang lebih lama tetap menggunakan perilaku default.
    </Note>

  </Accordion>

  <Accordion title="Rute native vs yang kompatibel dengan OpenAI">
    OpenClaw memperlakukan endpoint OpenAI langsung, Codex, dan Azure OpenAI secara berbeda dari proxy `/v1` generik yang kompatibel dengan OpenAI:

    **Rute native** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Mempertahankan `reasoning: { effort: "none" }` hanya untuk model yang mendukung effort OpenAI `none`
    - Menghilangkan reasoning yang dinonaktifkan untuk model atau proxy yang menolak `reasoning.effort: "none"`
    - Menjadikan schema alat mode ketat secara default
    - Melampirkan header atribusi tersembunyi hanya pada host native yang terverifikasi
    - Mempertahankan pembentukan permintaan khusus OpenAI (`service_tier`, `store`, reasoning-compat, petunjuk prompt-cache)

    **Rute proxy/kompatibel:**
    - Menggunakan perilaku compat yang lebih longgar
    - Tidak memaksa schema alat ketat atau header khusus native

    Azure OpenAI menggunakan transport native dan perilaku compat tetapi tidak menerima header atribusi tersembunyi.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="OAuth dan autentikasi" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>

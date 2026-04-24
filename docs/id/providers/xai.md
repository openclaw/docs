---
read_when:
    - Anda ingin menggunakan model Grok di OpenClaw
    - Anda sedang mengonfigurasi autentikasi xAI atau id model
summary: Gunakan model xAI Grok di OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-24T09:25:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw menyediakan Plugin provider `xai` bawaan untuk model Grok.

## Mulai menggunakan

<Steps>
  <Step title="Buat API key">
    Buat API key di [xAI console](https://console.x.ai/).
  </Step>
  <Step title="Setel API key Anda">
    Setel `XAI_API_KEY`, atau jalankan:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Pilih model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw menggunakan xAI Responses API sebagai transport xAI bawaan. `XAI_API_KEY`
yang sama juga dapat mendukung `web_search` berbasis Grok, `x_search` kelas satu,
dan `code_execution` remote.
Jika Anda menyimpan key xAI di bawah `plugins.entries.xai.config.webSearch.apiKey`,
provider model xAI bawaan juga menggunakan ulang key tersebut sebagai fallback.
Penyesuaian `code_execution` berada di bawah `plugins.entries.xai.config.codeExecution`.
</Note>

## Katalog bawaan

OpenClaw menyertakan keluarga model xAI berikut secara bawaan:

| Keluarga       | ID model                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`              |
| Grok 4         | `grok-4`, `grok-4-0709`                                                 |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                              |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                          |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                      |

Plugin juga meneruskan resolusi id `grok-4*` dan `grok-code-fast*` yang lebih baru ketika
mengikuti bentuk API yang sama.

<Tip>
`grok-4-fast`, `grok-4-1-fast`, dan varian `grok-4.20-beta-*` adalah
ref Grok yang saat ini mendukung gambar dalam katalog bawaan.
</Tip>

## Cakupan fitur OpenClaw

Plugin bawaan memetakan permukaan API publik xAI saat ini ke kontrak provider
dan tool bersama milik OpenClaw. Kapabilitas yang tidak cocok dengan kontrak bersama
(misalnya streaming TTS dan realtime voice) tidak ditampilkan — lihat tabel
di bawah.

| Kapabilitas xAI            | Permukaan OpenClaw                        | Status                                                             |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Chat / Responses           | provider model `xai/<model>`              | Ya                                                                 |
| Web search sisi server     | provider `web_search` `grok`              | Ya                                                                 |
| X search sisi server       | tool `x_search`                           | Ya                                                                 |
| Code execution sisi server | tool `code_execution`                     | Ya                                                                 |
| Gambar                     | `image_generate`                          | Ya                                                                 |
| Video                      | `video_generate`                          | Ya                                                                 |
| Batch text-to-speech       | `messages.tts.provider: "xai"` / `tts`    | Ya                                                                 |
| Streaming TTS              | —                                         | Tidak ditampilkan; kontrak TTS OpenClaw mengembalikan buffer audio lengkap |
| Batch speech-to-text       | `tools.media.audio` / media understanding | Ya                                                                 |
| Streaming speech-to-text   | Voice Call `streaming.provider: "xai"`    | Ya                                                                 |
| Realtime voice             | —                                         | Belum ditampilkan; kontrak sesi/WebSocket berbeda                  |
| File / batch               | Hanya kompatibilitas API model generik    | Bukan tool OpenClaw kelas satu                                     |

<Note>
OpenClaw menggunakan API REST xAI untuk image/video/TTS/STT untuk generasi media,
speech, dan transkripsi batch, WebSocket STT streaming xAI untuk transkripsi
voice-call live, dan Responses API untuk tool model, search, dan
code-execution. Fitur yang memerlukan kontrak OpenClaw yang berbeda, seperti
sesi Realtime voice, didokumentasikan di sini sebagai kapabilitas upstream, bukan
perilaku Plugin tersembunyi.
</Note>

### Pemetaan fast-mode

`/fast on` atau `agents.defaults.models["xai/<model>"].params.fastMode: true`
menulis ulang permintaan xAI native sebagai berikut:

| Model sumber   | Target fast-mode   |
| -------------- | ------------------ |
| `grok-3`       | `grok-3-fast`      |
| `grok-3-mini`  | `grok-3-mini-fast` |
| `grok-4`       | `grok-4-fast`      |
| `grok-4-0709`  | `grok-4-fast`      |

### Alias kompatibilitas legacy

Alias legacy tetap dinormalisasi ke id bawaan kanonis:

| Alias legacy              | ID kanonis                            |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Fitur

<AccordionGroup>
  <Accordion title="Web search">
    Provider `grok` web-search bawaan juga menggunakan `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generasi video">
    Plugin `xai` bawaan mendaftarkan generasi video melalui tool bersama
    `video_generate`.

    - Model video default: `xai/grok-imagine-video`
    - Mode: text-to-video, image-to-video, edit video remote, dan ekstensi video
      remote
    - Aspect ratio: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resolusi: `480P`, `720P`
    - Durasi: 1-15 detik untuk generasi/image-to-video, 2-10 detik untuk
      ekstensi

    <Warning>
    Buffer video lokal tidak diterima. Gunakan URL `http(s)` remote untuk
    input edit/perpanjang video. Image-to-video menerima buffer gambar lokal karena
    OpenClaw dapat mengodekannya sebagai data URL untuk xAI.
    </Warning>

    Untuk menggunakan xAI sebagai provider video default:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Lihat [Video Generation](/id/tools/video-generation) untuk parameter tool bersama,
    pemilihan provider, dan perilaku failover.
    </Note>

  </Accordion>

  <Accordion title="Generasi gambar">
    Plugin `xai` bawaan mendaftarkan generasi gambar melalui tool bersama
    `image_generate`.

    - Model gambar default: `xai/grok-imagine-image`
    - Model tambahan: `xai/grok-imagine-image-pro`
    - Mode: text-to-image dan edit gambar referensi
    - Input referensi: satu `image` atau hingga lima `images`
    - Aspect ratio: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resolusi: `1K`, `2K`
    - Jumlah: hingga 4 gambar

    OpenClaw meminta respons gambar `b64_json` dari xAI agar media yang dihasilkan dapat
    disimpan dan dikirim melalui jalur lampiran kanal normal. Gambar referensi
    lokal dikonversi menjadi data URL; referensi remote `http(s)` diteruskan
    apa adanya.

    Untuk menggunakan xAI sebagai provider gambar default:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI juga mendokumentasikan `quality`, `mask`, `user`, dan rasio native tambahan
    seperti `1:2`, `2:1`, `9:20`, dan `20:9`. Saat ini OpenClaw hanya meneruskan
    kontrol gambar bersama lintas-provider; knob native-only yang tidak didukung
    sengaja tidak ditampilkan melalui `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Plugin `xai` bawaan mendaftarkan text-to-speech melalui permukaan provider `tts`
    bersama.

    - Voice: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voice default: `eve`
    - Format: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Bahasa: kode BCP-47 atau `auto`
    - Kecepatan: override kecepatan native provider
    - Format voice-note Opus native tidak didukung

    Untuk menggunakan xAI sebagai provider TTS default:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw menggunakan endpoint batch `/v1/tts` milik xAI. xAI juga menawarkan streaming TTS
    melalui WebSocket, tetapi kontrak provider speech OpenClaw saat ini mengharapkan
    buffer audio lengkap sebelum pengiriman balasan.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `xai` bawaan mendaftarkan batch speech-to-text melalui permukaan
    transkripsi media-understanding OpenClaw.

    - Model default: `grok-stt`
    - Endpoint: REST xAI `/v1/stt`
    - Jalur input: upload file audio multipart
    - Didukung oleh OpenClaw di mana pun transkripsi audio masuk menggunakan
      `tools.media.audio`, termasuk segmen voice-channel Discord dan
      lampiran audio kanal

    Untuk memaksa xAI untuk transkripsi audio masuk:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    Bahasa dapat diberikan melalui konfigurasi media audio bersama atau per permintaan
    transkripsi. Petunjuk prompt diterima oleh permukaan OpenClaw bersama,
    tetapi integrasi xAI REST STT hanya meneruskan file, model, dan
    language karena hanya itu yang memetakan dengan bersih ke endpoint xAI publik saat ini.

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    Plugin `xai` bawaan juga mendaftarkan provider realtime transcription
    untuk audio voice-call live.

    - Endpoint: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Encoding default: `mulaw`
    - Sample rate default: `8000`
    - Endpointing default: `800ms`
    - Transkrip interim: aktif secara default

    Media stream Twilio dari Voice Call mengirim frame audio G.711 µ-law, jadi
    provider xAI dapat meneruskan frame tersebut secara langsung tanpa transkoding:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Konfigurasi milik provider berada di bawah
    `plugins.entries.voice-call.config.streaming.providers.xai`. Key yang didukung
    adalah `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`, atau
    `alaw`), `interimResults`, `endpointingMs`, dan `language`.

    <Note>
    Provider streaming ini ditujukan untuk jalur realtime transcription Voice Call.
    Voice Discord saat ini merekam segmen pendek dan menggunakan jalur transkripsi batch
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Konfigurasi x_search">
    Plugin xAI bawaan menampilkan `x_search` sebagai tool OpenClaw untuk menelusuri
    konten X (sebelumnya Twitter) melalui Grok.

    Path konfigurasi: `plugins.entries.xai.config.xSearch`

    | Key                | Tipe    | Default            | Deskripsi                            |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Aktifkan atau nonaktifkan x_search   |
    | `model`            | string  | `grok-4-1-fast`    | Model yang digunakan untuk permintaan x_search |
    | `inlineCitations`  | boolean | —                  | Sertakan sitasi inline dalam hasil   |
    | `maxTurns`         | number  | —                  | Jumlah giliran percakapan maksimum   |
    | `timeoutSeconds`   | number  | —                  | Timeout permintaan dalam detik       |
    | `cacheTtlMinutes`  | number  | —                  | Time-to-live cache dalam menit       |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Konfigurasi code execution">
    Plugin xAI bawaan menampilkan `code_execution` sebagai tool OpenClaw untuk
    eksekusi kode remote di lingkungan sandbox xAI.

    Path konfigurasi: `plugins.entries.xai.config.codeExecution`

    | Key               | Tipe    | Default            | Deskripsi                                |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (jika key tersedia) | Aktifkan atau nonaktifkan code execution |
    | `model`           | string  | `grok-4-1-fast`    | Model yang digunakan untuk permintaan code execution |
    | `maxTurns`        | number  | —                  | Jumlah giliran percakapan maksimum       |
    | `timeoutSeconds`  | number  | —                  | Timeout permintaan dalam detik           |

    <Note>
    Ini adalah eksekusi sandbox xAI remote, bukan [`exec`](/id/tools/exec) lokal.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Batasan yang diketahui">
    - Autentikasi saat ini hanya API-key. Belum ada alur xAI OAuth atau device-code di
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` tidak didukung pada
      jalur provider xAI normal karena memerlukan permukaan API upstream yang
      berbeda dari transport xAI standar milik OpenClaw.
    - xAI Realtime voice belum didaftarkan sebagai provider OpenClaw. Fitur ini
      memerlukan kontrak sesi suara dua arah yang berbeda dari STT batch atau
      transkripsi streaming.
    - `quality` gambar xAI, `mask` gambar, dan aspect ratio tambahan yang native-only
      belum ditampilkan sampai tool `image_generate` bersama memiliki
      kontrol lintas-provider yang sesuai.
  </Accordion>

  <Accordion title="Catatan lanjutan">
    - OpenClaw menerapkan perbaikan kompatibilitas skema tool dan tool-call khusus xAI
      secara otomatis pada jalur runner bersama.
    - Permintaan xAI native secara default menggunakan `tool_stream: true`. Setel
      `agents.defaults.models["xai/<model>"].params.tool_stream` ke `false` untuk
      menonaktifkannya.
    - Wrapper xAI bawaan menghapus flag strict tool-schema yang tidak didukung dan
      key payload reasoning sebelum mengirim permintaan xAI native.
    - `web_search`, `x_search`, dan `code_execution` ditampilkan sebagai tool OpenClaw.
      OpenClaw mengaktifkan built-in xAI spesifik yang dibutuhkan di dalam setiap permintaan tool
      alih-alih melampirkan semua tool native ke setiap giliran obrolan.
    - `x_search` dan `code_execution` dimiliki oleh Plugin xAI bawaan, bukan
      di-hardcode ke runtime model inti.
    - `code_execution` adalah eksekusi sandbox xAI remote, bukan
      [`exec`](/id/tools/exec) lokal.
  </Accordion>
</AccordionGroup>

## Pengujian live

Jalur media xAI dicakup oleh unit test dan suite live opt-in. Perintah live
memuat secret dari shell login Anda, termasuk `~/.profile`, sebelum
mem-probe `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

File live khusus provider mensintesis TTS normal, PCM
TTS yang ramah telefoni, mentranskripsikan audio melalui batch STT xAI, men-stream PCM yang sama melalui xAI
realtime STT, menghasilkan output text-to-image, dan mengedit gambar referensi. File live gambar
bersama memverifikasi provider xAI yang sama melalui
pemilihan runtime, fallback, normalisasi, dan jalur lampiran media milik OpenClaw.

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, model ref, dan perilaku failover.
  </Card>
  <Card title="Generasi video" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan provider.
  </Card>
  <Card title="Semua provider" href="/id/providers/index" icon="grid-2">
    Ikhtisar provider yang lebih luas.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan perbaikannya.
  </Card>
</CardGroup>

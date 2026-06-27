---
read_when:
    - Anda ingin menggunakan model Grok di OpenClaw
    - Anda sedang mengonfigurasi autentikasi xAI atau ID model
summary: Gunakan model xAI Grok di OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:08:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw menyertakan Plugin penyedia `xai` bawaan untuk model Grok. Untuk sebagian besar
pengguna, jalur yang direkomendasikan adalah OAuth Grok dengan langganan SuperGrok atau X Premium
yang memenuhi syarat. OpenClaw tetap mengutamakan lokal: Gateway, config, routing, dan
alat berjalan di mesin Anda, sementara permintaan model Grok diautentikasi melalui xAI
dan dikirim ke API xAI.

OAuth tidak memerlukan kunci API xAI, dan tidak memerlukan aplikasi Grok Build.
xAI mungkin tetap menampilkan Grok Build di layar persetujuan karena OpenClaw menggunakan
klien OAuth bersama milik xAI.

## Pilih jalur penyiapan Anda

Gunakan jalur yang sesuai dengan status instalasi OpenClaw Anda:

<Steps>
  <Step title="Instalasi OpenClaw baru">
    Jalankan onboarding dengan instalasi daemon saat Anda menyiapkan Gateway lokal
    baru, lalu pilih opsi OAuth xAI/Grok pada langkah model/auth:

    ```bash
    openclaw onboard --install-daemon
    ```

    Di VPS atau melalui SSH, pilih OAuth xAI secara langsung; OpenClaw menggunakan verifikasi
    kode perangkat dan tidak memerlukan callback localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth tidak memerlukan kunci API xAI. OpenClaw tidak memerlukan aplikasi Grok
    Build. xAI mungkin tetap memberi label aplikasi persetujuan sebagai Grok Build karena
    OpenClaw menggunakan klien OAuth bersama milik xAI.

  </Step>
  <Step title="Instalasi OpenClaw yang sudah ada">
    Jika OpenClaw sudah dikonfigurasi, masuk hanya ke xAI. Jangan menjalankan ulang
    onboarding penuh atau menginstal ulang daemon hanya untuk menghubungkan Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Untuk menjadikan Grok model default setelah masuk, terapkan secara terpisah:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Jalankan ulang onboarding penuh hanya jika Anda memang ingin mengubah Gateway,
    daemon, saluran, workspace, atau pilihan penyiapan lainnya.

  </Step>
  <Step title="Jalur kunci API">
    Penyiapan kunci API tetap berfungsi untuk kunci xAI Console dan untuk permukaan media yang
    memerlukan config penyedia berbasis kunci:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Pilih model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw menggunakan API Responses xAI sebagai transport xAI bawaan. Kredensial yang sama
dari `openclaw models auth login --provider xai --method oauth` atau
`openclaw models auth login --provider xai --method api-key` juga dapat mendukung
`web_search`, `x_search`, `code_execution` jarak jauh, dan generasi gambar/video xAI kelas satu.
Ucapan dan transkripsi saat ini memerlukan `XAI_API_KEY` atau config penyedia.
`web_search` berbasis Grok lebih memilih OAuth xAI dan beralih ke `XAI_API_KEY` atau
config web-search Plugin jika diperlukan.
Jika Anda menyimpan kunci xAI di bawah `plugins.entries.xai.config.webSearch.apiKey`,
penyedia model xAI bawaan juga menggunakan ulang kunci tersebut sebagai fallback.
Atur `plugins.entries.xai.config.webSearch.baseUrl` untuk merutekan `web_search` Grok
dan, secara default, `x_search` melalui proxy xAI Responses operator.
Penyetelan `code_execution` berada di bawah `plugins.entries.xai.config.codeExecution`.
</Note>

## Pemecahan masalah OAuth

- Untuk SSH, Docker, VPS, atau penyiapan jarak jauh lainnya, gunakan
  `openclaw models auth login --provider xai --method oauth`; OAuth xAI menggunakan
  verifikasi kode perangkat, bukan callback localhost.
- Jika proses masuk berhasil tetapi Grok bukan model default, jalankan
  `openclaw models set xai/grok-4.3`.
- Untuk memeriksa profil auth xAI yang tersimpan, jalankan:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI menentukan akun mana yang dapat menerima token API OAuth. Jika sebuah akun tidak
  memenuhi syarat, coba jalur kunci API atau periksa langganan di sisi xAI.

<Tip>
Gunakan `xai-oauth` saat masuk dari SSH, Docker, atau VPS. OpenClaw mencetak
URL xAI dan kode singkat; selesaikan proses masuk di browser lokal mana pun sementara proses
jarak jauh melakukan polling ke xAI untuk pertukaran token yang sudah selesai.
</Tip>

## Katalog bawaan

OpenClaw menyertakan model chat xAI terbaru secara bawaan, diurutkan dari yang terbaru
terlebih dahulu di pemilih model:

| Keluarga       | ID model                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Plugin tetap meneruskan resolusi slug Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast, dan Grok Code lama untuk config yang sudah ada. Alias resmi Grok Code Fast
dinormalisasi menjadi `grok-build-0.1`; OpenClaw tidak lagi menampilkan slug upstream
pensiun lainnya di katalog yang dapat dipilih.

<Tip>
Gunakan `grok-4.3` untuk chat umum dan `grok-build-0.1` untuk beban kerja
yang berfokus pada build/coding kecuali Anda secara eksplisit memerlukan alias beta Grok 4.20.
</Tip>

## Cakupan fitur OpenClaw

Plugin bawaan memetakan permukaan API publik xAI saat ini ke kontrak penyedia dan alat
bersama OpenClaw. Kapabilitas yang tidak cocok dengan kontrak bersama
(misalnya TTS streaming dan suara realtime) tidak diekspos - lihat tabel
di bawah.

| Kapabilitas xAI           | Permukaan OpenClaw                         | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | penyedia model `xai/<model>`              | Ya                                                                  |
| Pencarian web sisi server  | penyedia `web_search` `grok`              | Ya                                                                  |
| Pencarian X sisi server    | alat `x_search`                           | Ya                                                                  |
| Eksekusi kode sisi server  | alat `code_execution`                     | Ya                                                                  |
| Gambar                     | `image_generate`                          | Ya                                                                  |
| Video                      | `video_generate`                          | Ya                                                                  |
| Text-to-speech batch       | `messages.tts.provider: "xai"` / `tts`    | Ya                                                                  |
| TTS streaming              | -                                         | Tidak diekspos; kontrak TTS OpenClaw mengembalikan buffer audio lengkap |
| Speech-to-text batch       | `tools.media.audio` / pemahaman media     | Ya                                                                  |
| Speech-to-text streaming   | Voice Call `streaming.provider: "xai"`    | Ya                                                                  |
| Suara realtime             | -                                         | Belum diekspos; kontrak sesi/WebSocket berbeda                      |
| File / batch               | Hanya kompatibilitas API model generik     | Bukan alat OpenClaw kelas satu                                      |

<Note>
OpenClaw menggunakan API REST gambar/video/TTS/STT xAI untuk generasi media,
ucapan, dan transkripsi batch, WebSocket STT streaming xAI untuk transkripsi
voice-call langsung, dan API Responses untuk alat model, pencarian, dan
eksekusi kode. Fitur yang memerlukan kontrak OpenClaw berbeda, seperti
sesi suara Realtime, didokumentasikan di sini sebagai kapabilitas upstream, bukan
perilaku Plugin tersembunyi.
</Note>

### Pemetaan mode cepat

`/fast on` atau `agents.defaults.models["xai/<model>"].params.fastMode: true`
menulis ulang permintaan xAI native sebagai berikut:

| Model sumber  | Target mode cepat |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Alias kompatibilitas lama

Alias lama tetap dinormalisasi ke ID bawaan kanonis:

| Alias lama                | ID kanonis                            |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Fitur

<AccordionGroup>
  <Accordion title="Pencarian web">
    Penyedia web-search `grok` bawaan lebih memilih OAuth xAI, lalu beralih
    ke `XAI_API_KEY` atau kunci web-search Plugin jika diperlukan:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generasi video">
    Plugin `xai` bawaan mendaftarkan generasi video melalui alat bersama
    `video_generate`.

    - Model video default: `xai/grok-imagine-video`
    - Mode: text-to-video, image-to-video, generasi reference-image, edit video
      jarak jauh, dan ekstensi video jarak jauh
    - Rasio aspek: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resolusi: `480P`, `720P`
    - Durasi: 1-15 detik untuk generasi/image-to-video, 1-10 detik saat
      menggunakan peran `reference_image`, 2-10 detik untuk ekstensi
    - Generasi reference-image: atur `imageRoles` ke `reference_image` untuk
      setiap gambar yang disediakan; xAI menerima hingga 7 gambar seperti itu
    - Timeout operasi default: 600 detik kecuali `video_generate.timeoutMs`
      atau `agents.defaults.videoGenerationModel.timeoutMs` diatur

    <Warning>
    Buffer video lokal tidak diterima. Gunakan URL `http(s)` jarak jauh untuk
    input edit/perpanjang video. Image-to-video menerima buffer gambar lokal karena
    OpenClaw dapat mengodekannya sebagai URL data untuk xAI.
    </Warning>

    Untuk menggunakan xAI sebagai penyedia video default:

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
    Lihat [Generasi Video](/id/tools/video-generation) untuk parameter alat bersama,
    pemilihan penyedia, dan perilaku failover.
    </Note>

  </Accordion>

  <Accordion title="Generasi gambar">
    Plugin `xai` bawaan mendaftarkan generasi gambar melalui alat bersama
    `image_generate`.

    - Model gambar default: `xai/grok-imagine-image`
    - Model tambahan: `xai/grok-imagine-image-quality`
    - Mode: text-to-image dan edit reference-image
    - Input referensi: satu `image` atau hingga lima `images`
    - Rasio aspek: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resolusi: `1K`, `2K`
    - Jumlah: hingga 4 gambar
    - Timeout operasi default: 600 detik kecuali `image_generate.timeoutMs`
      atau `agents.defaults.imageGenerationModel.timeoutMs` diatur

    OpenClaw meminta respons gambar `b64_json` dari xAI agar media yang dihasilkan dapat
    disimpan dan dikirim melalui jalur lampiran saluran normal. Gambar referensi
    lokal dikonversi menjadi URL data; referensi `http(s)` jarak jauh diteruskan
    apa adanya.

    Untuk menggunakan xAI sebagai penyedia gambar default:

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
    kontrol gambar lintas penyedia yang digunakan bersama; knob khusus native yang
    tidak didukung sengaja tidak diekspos melalui `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Plugin `xai` bawaan mendaftarkan text-to-speech melalui permukaan penyedia
    `tts` bersama.

    - Suara: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Suara default: `eve`
    - Format: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Bahasa: kode BCP-47 atau `auto`
    - Kecepatan: override kecepatan native penyedia
    - Format catatan suara Opus native tidak didukung

    Untuk menggunakan xAI sebagai penyedia TTS default:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw menggunakan endpoint batch `/v1/tts` milik xAI. xAI juga menawarkan
    TTS streaming melalui WebSocket, tetapi kontrak penyedia ucapan OpenClaw saat
    ini mengharapkan buffer audio lengkap sebelum pengiriman balasan.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `xai` bawaan mendaftarkan speech-to-text batch melalui permukaan
    transkripsi pemahaman media OpenClaw.

    - Model default: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Jalur input: unggahan file audio multipart
    - Didukung oleh OpenClaw di mana pun transkripsi audio masuk menggunakan
      `tools.media.audio`, termasuk segmen kanal suara Discord dan lampiran
      audio kanal

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

    Bahasa dapat disediakan melalui konfigurasi media audio bersama atau permintaan
    transkripsi per panggilan. Petunjuk prompt diterima oleh permukaan OpenClaw
    bersama, tetapi integrasi xAI REST STT hanya meneruskan file, model, dan
    bahasa karena semuanya dipetakan dengan jelas ke endpoint publik xAI saat ini.

  </Accordion>

  <Accordion title="Speech-to-text streaming">
    Plugin `xai` bawaan juga mendaftarkan penyedia transkripsi realtime untuk
    audio panggilan suara live.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Encoding default: `mulaw`
    - Sample rate default: `8000`
    - Endpointing default: `800ms`
    - Transkrip sementara: diaktifkan secara default

    Stream media Twilio milik Voice Call mengirim frame audio G.711 µ-law, sehingga
    penyedia xAI dapat meneruskan frame tersebut secara langsung tanpa transcoding:

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

    Konfigurasi milik penyedia berada di bawah
    `plugins.entries.voice-call.config.streaming.providers.xai`. Kunci yang
    didukung adalah `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`,
    atau `alaw`), `interimResults`, `endpointingMs`, dan `language`.

    <Note>
    Penyedia streaming ini ditujukan untuk jalur transkripsi realtime Voice Call.
    Suara Discord saat ini merekam segmen pendek dan menggunakan jalur transkripsi
    batch `tools.media.audio` sebagai gantinya.
    </Note>

  </Accordion>

  <Accordion title="Konfigurasi x_search">
    Plugin xAI bawaan mengekspos `x_search` sebagai alat OpenClaw untuk mencari
    konten X (sebelumnya Twitter) melalui Grok.

    Jalur konfigurasi: `plugins.entries.xai.config.xSearch`

    | Kunci              | Tipe    | Default            | Deskripsi                            |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Aktifkan atau nonaktifkan x_search   |
    | `model`            | string  | `grok-4-1-fast`    | Model yang digunakan untuk permintaan x_search |
    | `baseUrl`          | string  | -                  | Override URL dasar xAI Responses     |
    | `inlineCitations`  | boolean | -                  | Sertakan sitasi inline dalam hasil   |
    | `maxTurns`         | number  | -                  | Jumlah giliran percakapan maksimum   |
    | `timeoutSeconds`   | number  | -                  | Timeout permintaan dalam detik       |
    | `cacheTtlMinutes`  | number  | -                  | Time-to-live cache dalam menit       |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Konfigurasi eksekusi kode">
    Plugin xAI bawaan mengekspos `code_execution` sebagai alat OpenClaw untuk
    eksekusi kode jarak jauh di lingkungan sandbox xAI.

    Jalur konfigurasi: `plugins.entries.xai.config.codeExecution`

    | Kunci             | Tipe    | Default            | Deskripsi                              |
    | ----------------- | ------- | ------------------ | -------------------------------------- |
    | `enabled`         | boolean | `true` (jika kunci tersedia) | Aktifkan atau nonaktifkan eksekusi kode |
    | `model`           | string  | `grok-4-1-fast`    | Model yang digunakan untuk permintaan eksekusi kode |
    | `maxTurns`        | number  | -                  | Jumlah giliran percakapan maksimum     |
    | `timeoutSeconds`  | number  | -                  | Timeout permintaan dalam detik         |

    <Note>
    Ini adalah eksekusi sandbox xAI jarak jauh, bukan [`exec`](/id/tools/exec) lokal.
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
    - Autentikasi xAI dapat menggunakan kunci API, variabel lingkungan, fallback
      konfigurasi plugin, atau OAuth dengan akun xAI yang memenuhi syarat. OAuth
      menggunakan verifikasi device-code tanpa callback localhost. xAI menentukan
      akun mana yang dapat menerima token API OAuth, dan halaman persetujuan dapat
      menampilkan Grok Build meskipun OpenClaw tidak memerlukan aplikasi Grok Build.
    - OpenClaw saat ini tidak mengekspos keluarga model multi-agent xAI. xAI
      menyajikan model ini melalui Responses API, tetapi model tersebut tidak
      menerima alat sisi klien atau alat kustom yang digunakan oleh loop agen
      bersama OpenClaw. Lihat
      [batasan multi-agent xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Suara xAI Realtime belum terdaftar sebagai penyedia OpenClaw. Fitur ini
      memerlukan kontrak sesi suara dua arah yang berbeda dari STT batch atau
      transkripsi streaming.
    - `quality` gambar xAI, `mask` gambar, dan rasio aspek tambahan khusus native
      tidak diekspos hingga alat `image_generate` bersama memiliki kontrol lintas
      penyedia yang sesuai.
  </Accordion>

  <Accordion title="Catatan lanjutan">
    - OpenClaw menerapkan perbaikan kompatibilitas skema alat dan panggilan alat
      khusus xAI secara otomatis pada jalur runner bersama.
    - Permintaan xAI native menggunakan default `tool_stream: true`. Atur
      `agents.defaults.models["xai/<model>"].params.tool_stream` ke `false` untuk
      menonaktifkannya.
    - Wrapper xAI bawaan menghapus flag skema alat strict yang tidak didukung dan
      kunci payload reasoning *effort* sebelum mengirim permintaan xAI native. Hanya
      `grok-4.3` / `grok-4.3-*` yang mengiklankan effort reasoning yang dapat
      dikonfigurasi; semua model xAI lain yang mampu reasoning tetap meminta
      `include: ["reasoning.encrypted_content"]` agar reasoning terenkripsi
      sebelumnya dapat diputar ulang pada giliran lanjutan.
    - `web_search`, `x_search`, dan `code_execution` diekspos sebagai alat OpenClaw.
      OpenClaw mengaktifkan xAI built-in spesifik yang dibutuhkan di dalam setiap
      permintaan alat, bukan melampirkan semua alat native ke setiap giliran chat.
    - Grok `web_search` membaca `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` membaca `plugins.entries.xai.config.xSearch.baseUrl`, lalu
      fallback ke URL dasar web-search Grok.
    - `x_search` dan `code_execution` dimiliki oleh plugin xAI bawaan, bukan
      di-hardcode ke runtime model inti.
    - `code_execution` adalah eksekusi sandbox xAI jarak jauh, bukan
      [`exec`](/id/tools/exec) lokal.
  </Accordion>
</AccordionGroup>

## Pengujian live

Jalur media xAI dicakup oleh pengujian unit dan suite live opt-in. Ekspor
`XAI_API_KEY` di lingkungan proses sebelum menjalankan probe live.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

File live khusus penyedia menyintesis TTS normal, TTS PCM yang ramah telepon,
mentranskripsi audio melalui xAI batch STT, melakukan streaming PCM yang sama
melalui xAI realtime STT, menghasilkan output text-to-image, dan mengedit gambar
referensi. File live gambar bersama memverifikasi penyedia xAI yang sama melalui
jalur pemilihan runtime, fallback, normalisasi, dan lampiran media OpenClaw.

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="Semua penyedia" href="/id/providers/index" icon="grid-2">
    Ikhtisar penyedia yang lebih luas.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan perbaikannya.
  </Card>
</CardGroup>

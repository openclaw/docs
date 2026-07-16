---
read_when:
    - Anda ingin menggunakan model Grok di OpenClaw
    - Anda sedang mengonfigurasi autentikasi atau ID model xAI
summary: Gunakan model xAI Grok di OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-16T18:32:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw menyertakan Plugin penyedia `xai` bawaan untuk model Grok. Jalur yang
direkomendasikan adalah OAuth Grok dengan langganan SuperGrok atau X Premium
yang memenuhi syarat. Gateway, konfigurasi, perutean, dan alat tetap lokal; hanya permintaan
Grok yang dikirim ke API xAI.

OAuth tidak memerlukan kunci API xAI atau aplikasi Grok Build. xAI mungkin masih
menampilkan Grok Build pada layar persetujuan karena OpenClaw menggunakan klien
OAuth bersama milik xAI.

## Penyiapan

<Steps>
  <Step title="Instalasi baru">
    Jalankan orientasi awal dengan instalasi daemon, lalu pilih OAuth xAI/Grok pada
    langkah model/autentikasi:

    ```bash
    openclaw onboard --install-daemon
    ```

    Pada VPS atau melalui SSH, pilih OAuth xAI secara langsung; metode ini menggunakan verifikasi
    kode perangkat dan tidak memerlukan callback localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Instalasi yang sudah ada">
    Masuk hanya ke xAI; jangan jalankan ulang seluruh orientasi awal hanya untuk menghubungkan Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Terapkan Grok sebagai model default secara terpisah:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Jalankan ulang seluruh orientasi awal hanya jika Anda memang ingin mengubah Gateway,
    daemon, kanal, ruang kerja, atau pilihan penyiapan lainnya.

  </Step>
  <Step title="Jalur kunci API">
    Penyiapan kunci API tetap berfungsi untuk kunci xAI Console dan permukaan media
    yang memerlukan konfigurasi penyedia berbasis kunci:

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
OpenClaw menggunakan API Responses xAI sebagai transportasi xAI bawaan. Kredensial yang sama
dari `openclaw models auth login --provider xai --method oauth` atau
`--method api-key` juga mendukung `web_search` (id penyedia `grok`), `x_search`,
`code_execution`, ucapan/transkripsi, serta pembuatan gambar/video xAI. Jika Anda
menyimpan kunci xAI di bawah `plugins.entries.xai.config.webSearch.apiKey`,
penyedia model xAI bawaan juga menggunakannya kembali sebagai fallback.
</Note>

## Pemecahan masalah OAuth

- Untuk SSH, Docker, VPS, atau penyiapan jarak jauh lainnya, gunakan
  `openclaw models auth login --provider xai --method oauth`; metode ini menggunakan
  verifikasi kode perangkat, bukan callback localhost.
- Jika proses masuk berhasil tetapi Grok bukan model default, jalankan
  `openclaw models set xai/grok-4.3`.
- Periksa profil autentikasi xAI yang tersimpan:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI menentukan akun mana yang dapat menerima token API OAuth. Jika suatu akun
  tidak memenuhi syarat, gunakan jalur kunci API atau periksa langganan di sisi xAI.

<Tip>
Gunakan `xai-oauth` saat masuk dari SSH, Docker, atau VPS. OpenClaw mencetak
URL dan kode pendek; selesaikan proses masuk di peramban lokal mana pun sementara proses
jarak jauh melakukan polling ke xAI untuk pertukaran token yang telah selesai.
</Tip>

## Katalog bawaan

ID yang dapat dipilih dalam pemilih model. Plugin tetap menyelesaikan ID Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast, dan Grok Code lama untuk konfigurasi yang sudah ada;
lihat [kompatibilitas lama dan alias bergerak](#legacy-compatibility-and-moving-aliases).

| Keluarga       | ID model                                                     |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (alias: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (alias: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Gunakan `grok-4.5` untuk percakapan umum, pemrograman, dan pekerjaan agentik jika tersedia.
Grok 4.3 tetap menjadi default penyiapan yang aman secara regional; `grok-build-0.1` dan kedua
varian Grok 4.20 bertanggal tetap dapat dipilih.
</Tip>

## Cakupan fitur

Plugin bawaan memetakan API xAI yang didukung ke kontrak penyedia dan
alat bersama OpenClaw. Kemampuan yang tidak sesuai dengan kontrak bersama dicantumkan
di bawah ini atau pada batasan yang diketahui.

| Kemampuan xAI              | Permukaan OpenClaw                      | Status                                               |
| -------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Percakapan / Responses     | Penyedia model `xai/<model>`            | Ya                                                   |
| Pencarian web sisi server  | Penyedia `web_search` `grok`            | Ya                                                   |
| Pencarian X sisi server    | Alat `x_search`                         | Ya                                                   |
| Eksekusi kode sisi server  | Alat `code_execution`                   | Ya                                                   |
| Gambar                     | `image_generate`                        | Ya                                                   |
| Video                      | `video_generate`                        | Ya                                                   |
| Teks-ke-ucapan batch       | `messages.tts.provider: "xai"` / `tts`  | Ya                                                   |
| TTS streaming              | `textToSpeechStream`                    | Ya melalui `wss://api.x.ai/v1/tts` (bukan suara waktu nyata) |
| Ucapan-ke-teks batch       | Pemahaman media `tools.media.audio` | Ya                                                   |
| Ucapan-ke-teks streaming   | Voice Call `streaming.provider: "xai"`  | Ya                                                   |
| Suara waktu nyata          | Talk `talk.realtime.provider: "xai"`    | Ya; relai Gateway untuk Node Talk native             |
| File / batch               | Hanya kompatibilitas API model generik  | Bukan alat OpenClaw kelas utama                      |

<Note>
OpenClaw menggunakan API REST gambar/video/TTS/STT xAI untuk pembuatan media dan
transkripsi batch, WebSocket STT streaming xAI untuk transkripsi panggilan suara
langsung, WebSocket Grok Voice Agent xAI untuk sesi Talk waktu nyata,
serta API Responses untuk percakapan, pencarian, dan alat eksekusi kode.
</Note>

### Kompatibilitas mode cepat lama

`/fast on` atau `agents.defaults.models["xai/<model>"].params.fastMode: true`
tetap menulis ulang konfigurasi xAI lama sebagai berikut. ID target ini
dipertahankan hanya untuk kompatibilitas; gunakan model yang saat ini dapat dipilih untuk
konfigurasi baru.

| Model sumber  | Target mode cepat  |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Kompatibilitas lama dan alias bergerak

Alias lama dinormalisasi sebagai berikut:

| Alias lama                                                    | ID ternormalisasi |
| ------------------------------------------------------------- | ----------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

ID 0309 bertanggal adalah entri katalog yang dapat dipilih. OpenClaw mengirim semua
alias Grok 4.20 lainnya saat ini tanpa perubahan agar xAI tetap mengendalikan semantik alias
stabil, terbaru, beta, eksperimental, dan bertanggal. Alias global `grok-latest`
juga dipertahankan tanpa perubahan.

xAI menghentikan ID persis berikut. OpenClaw mempertahankannya sebagai baris kompatibilitas
tersembunyi untuk konfigurasi yang telah dirilis, dengan batasan dan harga dari target
pengalihan saat ini:

| ID yang dihentikan                                                   | Perilaku saat ini                |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 dengan penalaran `low`    |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 dengan penalaran dinonaktifkan |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Kualitas Gambar Grok Imagine     |

`openclaw doctor --fix` memperbarui default alat server xAI yang tersimpan dan
slug gambar kualitas yang dihentikan, menghapus baris katalog hasil pembuatan yang usang, serta memperbaiki
metadata konteks usang pada baris 4.20 aktif. Perintah ini tidak menyematkan alias
`beta-latest` 4.20 aktif ke snapshot bertanggal.

## Fitur

<Warning>
  `x_search` dan `code_execution` berjalan di server xAI. xAI mengenakan biaya $5 per 1,000
  panggilan alat, ditambah token masukan dan keluaran model. Jika pengaturan
  `enabled` setiap alat dihilangkan, OpenClaw mengeksposnya hanya untuk model xAI aktif.
  Penyedia model non-xAI yang diketahui memerlukan `enabled: true` eksplisit per alat;
  penyedia yang tidak ada atau tidak dapat diselesaikan akan gagal secara tertutup. Autentikasi xAI selalu diperlukan,
  dan `enabled: false` menonaktifkan alat untuk setiap penyedia.
</Warning>

<AccordionGroup>
  <Accordion title="Pencarian web">
    Penyedia pencarian web `grok` bawaan mengutamakan OAuth xAI, lalu menggunakan fallback
    ke `XAI_API_KEY` atau kunci pencarian web Plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Pembuatan video">
    Plugin `xai` bawaan mendaftarkan pembuatan video melalui
    alat `video_generate` bersama.

    - Model default: `xai/grok-imagine-video`
    - Model tambahan: `xai/grok-imagine-video-1.5`
    - Mode klasik: teks-ke-video, gambar-ke-video, pembuatan gambar referensi,
      pengeditan video jarak jauh, dan perpanjangan video jarak jauh
    - Mode Video 1.5: hanya gambar-ke-video, dengan tepat satu gambar bingkai pertama
    - Rasio aspek: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      gambar-ke-video klasik dan Video 1.5 mewarisi rasio gambar sumber jika
      dihilangkan
    - Resolusi: klasik `480P`/`720P`; Video 1.5 juga mendukung `1080P`; semua
      mode pembuatan menggunakan default `480P`
    - Durasi: 1-15 detik untuk pembuatan/gambar-ke-video, 1-10 detik saat
      menggunakan peran klasik `reference_image`, 2-10 detik untuk perpanjangan klasik
    - Pembuatan gambar referensi: tetapkan `imageRoles` ke `reference_image` untuk
      setiap gambar yang diberikan; xAI menerima hingga 7 gambar tersebut
    - Pengeditan/perpanjangan video mewarisi rasio aspek dan resolusi video masukan;
      operasi tersebut tidak menerima penggantian geometri
    - Batas waktu operasi default: 600 detik kecuali `video_generate.timeoutMs`
      atau `agents.defaults.videoGenerationModel.timeoutMs` ditetapkan

    <Warning>
    Buffer video lokal tidak diterima. Gunakan URL `http(s)` jarak jauh untuk masukan
    pengeditan/perpanjangan video. Gambar-ke-video menerima buffer gambar lokal karena
    OpenClaw mengodekannya sebagai URL data untuk xAI.
    </Warning>

    Video 1.5 juga mengenali pengidentifikasi `grok-imagine-video-1.5-preview` dan
    `grok-imagine-video-1.5-2026-05-30` milik xAI. OpenClaw meneruskan
    pengidentifikasi yang dipilih tanpa perubahan, tetapi menerapkan validasi khusus gambar yang sama.

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
    Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama,
    pemilihan penyedia, dan perilaku failover.
    </Note>

  </Accordion>

  <Accordion title="Pembuatan gambar">
    Plugin `xai` bawaan mendaftarkan pembuatan gambar melalui
    alat `image_generate` bersama.

    - Model gambar default: `xai/grok-imagine-image`
    - Model tambahan: `xai/grok-imagine-image-quality`
    - Mode: teks-ke-gambar dan pengeditan gambar referensi
    - Input referensi: satu `image` atau hingga tiga `images`
    - Rasio aspek: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Resolusi: `1K`, `2K`
    - Jumlah: hingga 4 gambar
    - Batas waktu operasi default: 600 detik, kecuali `image_generate.timeoutMs`
      atau `agents.defaults.imageGenerationModel.timeoutMs` ditetapkan

    OpenClaw meminta respons gambar `b64_json` dari xAI agar media yang dihasilkan dapat
    disimpan dan dikirim melalui jalur lampiran saluran biasa. Gambar referensi
    lokal dikonversi menjadi URL data; referensi `http(s)` jarak jauh
    diteruskan tanpa perubahan.

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
    xAI juga mendokumentasikan `quality`, `mask`, `user`, dan rasio aspek `auto`.
    Saat ini OpenClaw hanya meneruskan kontrol gambar lintas penyedia yang digunakan bersama;
    opsi khusus native ini tidak diekspos melalui `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Teks-ke-ucapan">
    Plugin `xai` bawaan mendaftarkan teks-ke-ucapan melalui antarmuka penyedia
    `tts` bersama.

    - Suara: katalog langsung terautentikasi dari xAI; tampilkan daftarnya dengan
      `openclaw infer tts voices --provider xai`
    - Suara fallback luring: `ara`, `eve`, `leo`, `rex`, `sal`
    - Suara default: `eve`
    - ID suara khusus akun diteruskan meskipun tidak terdapat dalam
      respons katalog bawaan
    - Format: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Bahasa: kode BCP-47 atau `auto`
    - Kecepatan: penggantian kecepatan native penyedia
    - Format pesan suara Opus native tidak didukung

    Untuk menggunakan xAI sebagai penyedia TTS default:

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
    OpenClaw menggunakan endpoint batch `/v1/tts` xAI untuk sintesis dengan buffer,
    penemuan katalog `/v1/tts/voices` terautentikasi, dan `wss://api.x.ai/v1/tts`
    native untuk sintesis streaming. Streaming dibatasi pada host
    `api.x.ai` native, sehingga nilai `baseUrl` khusus ditolak pada jalur ini.
    Jalur ini menggunakan kontrol bahasa, suara, codec, dan kecepatan yang sudah ada; nilai default xAI
    berlaku untuk laju sampel dan laju bit. Sintesis berkas audio mematuhi semua
    codec yang dikonfigurasi. Target pesan suara menggunakan MP3 untuk streaming dan fallback
    dengan buffer karena codec mentah xAI tidak membawa metadata codec/laju. Stream
    mengirim `text.delta` lalu
    `text.done`, menerima `audio.delta`, `audio.done`, atau `error`, dan menerapkan
    `timeoutMs` saat menganggur yang diperbarui untuk setiap potongan audio. Jalur ini terpisah dari
    sesi suara waktu nyata. Lihat kontrak [API TTS Streaming](https://docs.x.ai/developers/rest-api-reference/inference/voice) xAI.
    </Note>

  </Accordion>

  <Accordion title="Ucapan-ke-teks">
    Plugin `xai` bawaan mendaftarkan ucapan-ke-teks batch melalui antarmuka
    transkripsi pemahaman media OpenClaw.

    - Endpoint: REST xAI `/v1/stt`
    - Jalur input: pengunggahan berkas audio multipart
    - Pemilihan model: xAI memilih model transkripsi secara internal;
      endpoint tersebut tidak memiliki pemilih model
    - Digunakan di mana pun transkripsi audio masuk membaca `tools.media.audio`,
      termasuk segmen saluran suara Discord dan lampiran audio saluran

    Untuk memaksa penggunaan xAI bagi transkripsi audio masuk:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    Bahasa dapat diberikan melalui konfigurasi media audio bersama atau permintaan
    transkripsi per panggilan. Petunjuk prompt diterima oleh antarmuka bersama OpenClaw,
    tetapi integrasi STT REST xAI hanya meneruskan berkas dan bahasa
    karena keduanya dipetakan ke endpoint publik xAI saat ini.

  </Accordion>

  <Accordion title="Ucapan-ke-teks streaming">
    Plugin `xai` bawaan juga mendaftarkan penyedia transkripsi waktu nyata
    untuk audio panggilan suara langsung.

    - Endpoint: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Pengodean default: `mulaw`
    - Laju sampel default: `8000`
    - Penentuan endpoint default: `800ms`
    - Transkrip sementara: diaktifkan secara default

    Stream media Twilio milik Voice Call mengirim bingkai audio G.711 mu-law, sehingga
    penyedia xAI meneruskan bingkai tersebut secara langsung tanpa transkode:

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
    `plugins.entries.voice-call.config.streaming.providers.xai`. Kunci yang didukung
    adalah `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`, atau
    `alaw`), `interimResults`, `endpointingMs`, dan `language`.

    <Note>
    Penyedia streaming ini ditujukan untuk jalur transkripsi waktu nyata Voice Call.
    Discord merekam segmen pendek dan menggunakan jalur transkripsi batch
    `tools.media.audio` sebagai gantinya.
    </Note>

  </Accordion>

  <Accordion title="Suara waktu nyata (Talk)">
    Plugin `xai` bawaan mendaftarkan sesi waktu nyata Grok Voice Agent untuk
    mode Talk melalui kontrak `registerRealtimeVoiceProvider` bersama.

    - Endpoint: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - Model default: `grok-voice-latest`
    - Suara default: `eve`
    - Transport: `gateway-relay` (jalur relai iOS, Android, dan Control UI)
    - Audio: PCM16 24 kHz atau G.711 µ-law 8 kHz
    - Interupsi: VAD server xAI menginterupsi respons; OpenClaw menghapus antrean pemutaran
      dan memangkas riwayat penyedia yang belum diputar

    Konfigurasikan Talk pada Gateway:

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // Aktifkan hanya jika pemutaran ulang sesi di sisi penyedia dapat diterima.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    Konfigurasi milik penyedia juga diambil dari
    `plugins.entries.voice-call.config.realtime.providers.xai` ketika Voice Call
    atau pemilih waktu nyata bersama menggunakan kembali peta penyedia yang sama. Kunci yang didukung adalah
    `apiKey`, `baseUrl`, `model`, `voice`, `vadThreshold`, `silenceDurationMs`,
    `prefixPaddingMs`, `reasoningEffort`, dan `sessionResumption`.
    `reasoningEffort` hanya menerima `high` atau `none`, sesuai dengan API xAI Voice Agent.

    VAD server xAI selalu membuat respons dan menangani interupsi audio.
    Gunakan `consultRouting: "provider-direct"`; perutean transkrip paksa dan penonaktifan
    interupsi audio input tidak didukung oleh protokol xAI Voice Agent.

    <Note>
    OAuth xAI atau `XAI_API_KEY` dapat mengautentikasi suara waktu nyata. WebRTC yang dikelola
    peramban belum menjadi bagian dari antarmuka penyedia ini; gunakan Talk gateway-relay pada
    Node native atau jalur relai Control UI.
    </Note>

    <Note>
    `sessionResumption` secara default bernilai `false`. Saat ditetapkan ke `true`, OpenClaw meminta
    xAI mempertahankan status sesi yang cukup untuk melanjutkan percakapan yang sama setelah
    koneksi ulang, lalu menyambung kembali dengan ID percakapan yang dikembalikan. Biarkan
    dinonaktifkan jika pemutaran ulang/retensi di sisi penyedia tidak dapat diterima; soket yang
    terinterupsi kemudian gagal secara tertutup, bukan diam-diam memulai percakapan baru.
    </Note>

  </Accordion>

  <Accordion title="Konfigurasi x_search">
    Plugin xAI bawaan mengekspos `x_search` sebagai alat OpenClaw untuk
    mencari konten X (sebelumnya Twitter) melalui Grok.

    Jalur konfigurasi: `plugins.entries.xai.config.xSearch`

    | Kunci             | Tipe    | Default                   | Deskripsi                                        |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | boolean | Otomatis untuk model xAI | Nonaktifkan, atau aktifkan untuk penyedia non-xAI yang diketahui |
    | `model`           | string  | `grok-4.3`                | Model yang digunakan untuk permintaan x_search   |
    | `baseUrl`         | string  | -                         | Penggantian URL dasar Responses xAI              |
    | `inlineCitations` | boolean | -                         | Sertakan sitasi sebaris dalam hasil              |
    | `maxTurns`        | number  | -                         | Jumlah maksimum giliran percakapan               |
    | `timeoutSeconds`  | number  | `30`                      | Batas waktu permintaan dalam detik               |
    | `cacheTtlMinutes` | number  | `15`                      | Waktu hidup cache dalam menit                    |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
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
    eksekusi kode jarak jauh dalam lingkungan sandbox xAI.

    Jalur konfigurasi: `plugins.entries.xai.config.codeExecution`

    | Kunci            | Tipe    | Default                  | Deskripsi                                        |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | boolean | Otomatis untuk model xAI | Nonaktifkan, atau aktifkan untuk penyedia non-xAI yang diketahui |
    | `model`          | string  | `grok-4.3`               | Model yang digunakan untuk permintaan eksekusi kode |
    | `maxTurns`       | number  | -                        | Jumlah maksimum giliran percakapan               |
    | `timeoutSeconds` | number  | `30`                     | Batas waktu permintaan dalam detik               |

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
                model: "grok-4.3",
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
      konfigurasi plugin, atau OAuth dengan akun xAI yang memenuhi syarat. OAuth menggunakan
      verifikasi kode perangkat tanpa callback localhost. xAI menentukan akun mana
      yang dapat menerima token API OAuth, dan halaman persetujuan mungkin menampilkan Grok Build
      meskipun OpenClaw tidak memerlukan aplikasi Grok Build.
    - OpenClaw saat ini tidak mengekspos keluarga model multiagen xAI. xAI
      menyediakan model ini melalui Responses API, tetapi model tersebut tidak menerima
      alat sisi klien atau alat khusus yang digunakan oleh loop agen bersama OpenClaw.
      Lihat
      [batasan multiagen xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Suara Realtime xAI saat ini hanya mengekspos transport Talk melalui relai Gateway.
      Sesi WebSocket penyedia yang dimiliki peramban belum dihubungkan di Control UI.
    - Gambar xAI `quality`, gambar `mask`, dan rasio aspek tambahan yang hanya didukung secara native
      belum diekspos hingga alat bersama `image_generate` memiliki kontrol
      lintas penyedia yang sesuai.
  </Accordion>

  <Accordion title="Catatan lanjutan">
    - OpenClaw menerapkan perbaikan kompatibilitas skema alat dan pemanggilan alat
      khusus xAI secara otomatis pada jalur runner bersama.
    - Permintaan native xAI secara default `tool_stream: true`. Atur
      `agents.defaults.models["xai/<model>"].params.tool_stream` menjadi `false`
      untuk menonaktifkannya.
    - Wrapper xAI bawaan menghapus batas jumlah contains yang tidak didukung
      dan kunci payload *effort* penalaran yang tidak didukung sebelum mengirim permintaan native
      xAI. Grok 4.5 mendukung upaya rendah, sedang, dan
      tinggi (default tinggi). Grok 4.3 mendukung tanpa upaya, rendah, sedang, dan tinggi
      (default rendah). Model xAI lain yang mampu melakukan penalaran tidak mengekspos
      kontrol upaya yang dapat dikonfigurasi, tetapi tetap meminta
      `include: ["reasoning.encrypted_content"]` agar penalaran terenkripsi sebelumnya
      dapat diputar ulang pada giliran lanjutan.
    - `web_search`, `x_search`, dan `code_execution` diekspos sebagai alat OpenClaw.
      OpenClaw hanya melampirkan fitur bawaan xAI tertentu yang diperlukan setiap alat
      ke permintaan alat tersebut, alih-alih melampirkan semua alat native ke setiap
      giliran percakapan.
    - Grok `web_search` membaca `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` membaca `plugins.entries.xai.config.xSearch.baseUrl`, lalu
      menggunakan URL dasar pencarian web Grok sebagai fallback.
    - `x_search` dan `code_execution` dimiliki oleh plugin xAI bawaan,
      bukan di-hardcode ke dalam runtime model inti.
    - `code_execution` merupakan eksekusi sandbox xAI jarak jauh, bukan
      [`exec`](/id/tools/exec) lokal.
  </Accordion>
</AccordionGroup>

## Pengujian langsung

Jalur media xAI dicakup oleh pengujian unit dan rangkaian pengujian langsung yang harus diaktifkan secara eksplisit. Ekspor
`XAI_API_KEY` di lingkungan proses sebelum menjalankan probe langsung.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

File pengujian langsung khusus penyedia menyintesis TTS normal, TTS PCM
yang sesuai untuk telefoni, mentranskripsikan audio melalui STT batch xAI, mengalirkan PCM yang sama melalui
STT realtime xAI, menghasilkan keluaran teks-ke-gambar, dan mengedit gambar referensi.
File pengujian langsung gambar bersama memverifikasi penyedia xAI yang sama melalui
jalur pemilihan runtime, fallback, normalisasi, dan lampiran media OpenClaw. Kasus
Video 1.5 yang harus diaktifkan secara eksplisit mengirimkan satu gambar bingkai pertama yang dihasilkan pada 1080P dan
memverifikasi pengunduhan video yang telah selesai.

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="Semua penyedia" href="/id/providers/index" icon="grid-2">
    Ringkasan penyedia yang lebih luas.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan perbaikannya.
  </Card>
</CardGroup>

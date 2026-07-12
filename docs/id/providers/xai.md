---
read_when:
    - Anda ingin menggunakan model Grok di OpenClaw
    - Anda sedang mengonfigurasi autentikasi xAI atau ID model
summary: Gunakan model xAI Grok di OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-12T14:35:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw menyertakan Plugin penyedia `xai` bawaan untuk model Grok. Jalur yang
direkomendasikan adalah OAuth Grok dengan langganan SuperGrok atau X Premium
yang memenuhi syarat. Gateway, konfigurasi, perutean, dan alat tetap berjalan
secara lokal; hanya permintaan Grok yang dikirim ke API xAI.

OAuth tidak memerlukan kunci API xAI atau aplikasi Grok Build. xAI mungkin tetap
menampilkan Grok Build pada layar persetujuan karena OpenClaw menggunakan klien
OAuth bersama milik xAI.

## Penyiapan

<Steps>
  <Step title="Instalasi baru">
    Jalankan orientasi awal dengan instalasi daemon, lalu pilih OAuth xAI/Grok
    pada langkah model/autentikasi:

    ```bash
    openclaw onboard --install-daemon
    ```

    Pada VPS atau melalui SSH, pilih OAuth xAI secara langsung; metode ini
    menggunakan verifikasi kode perangkat dan tidak memerlukan callback
    localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Instalasi yang sudah ada">
    Masuk hanya ke xAI; jangan jalankan ulang seluruh orientasi awal hanya untuk
    menghubungkan Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Terapkan Grok sebagai model bawaan secara terpisah:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Jalankan ulang seluruh orientasi awal hanya jika Anda memang ingin mengubah
    Gateway, daemon, saluran, ruang kerja, atau pilihan penyiapan lainnya.

  </Step>
  <Step title="Jalur kunci API">
    Penyiapan dengan kunci API tetap berfungsi untuk kunci xAI Console dan untuk
    permukaan media yang memerlukan konfigurasi penyedia berbasis kunci:

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
OpenClaw menggunakan Responses API xAI sebagai transportasi xAI bawaan. Kredensial
yang sama dari `openclaw models auth login --provider xai --method oauth` atau
`--method api-key` juga mendukung `web_search` (id penyedia `grok`), `x_search`,
`code_execution`, ucapan/transkripsi, serta pembuatan gambar/video xAI. Jika Anda
menyimpan kunci xAI di `plugins.entries.xai.config.webSearch.apiKey`, penyedia
model xAI bawaan juga menggunakannya kembali sebagai cadangan.
</Note>

## Pemecahan masalah OAuth

- Untuk SSH, Docker, VPS, atau penyiapan jarak jauh lainnya, gunakan
  `openclaw models auth login --provider xai --method oauth`; metode ini
  menggunakan verifikasi kode perangkat, bukan callback localhost.
- Jika proses masuk berhasil tetapi Grok bukan model bawaan, jalankan
  `openclaw models set xai/grok-4.3`.
- Periksa profil autentikasi xAI yang tersimpan:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI menentukan akun mana yang dapat menerima token API OAuth. Jika suatu akun
  tidak memenuhi syarat, gunakan jalur kunci API atau periksa langganan di sisi
  xAI.

<Tip>
Gunakan `xai-oauth` saat masuk dari SSH, Docker, atau VPS. OpenClaw mencetak URL
dan kode singkat; selesaikan proses masuk di peramban lokal mana pun sementara
proses jarak jauh melakukan polling ke xAI untuk pertukaran token yang telah
selesai.
</Tip>

## Katalog bawaan

Id yang dapat dipilih dalam pemilih model. Plugin tetap mengenali id Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast, dan Grok Code yang lebih lama untuk
konfigurasi yang sudah ada; lihat [kompatibilitas lama dan alias yang berubah](#legacy-compatibility-and-moving-aliases).

| Keluarga       | Id model                                                     |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (alias: `grok-4.5-latest`, `grok-build-latest`)   |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (alias: `grok-4.3-latest`, `grok-latest`)         |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Gunakan `grok-4.5` untuk percakapan umum, pemrograman, dan pekerjaan agentik jika
tersedia. Grok 4.3 tetap menjadi model bawaan penyiapan yang aman lintas wilayah;
`grok-build-0.1` dan kedua varian Grok 4.20 bertanggal tetap dapat dipilih.
</Tip>

## Cakupan fitur

Plugin bawaan memetakan API xAI yang didukung ke kontrak penyedia dan alat
bersama milik OpenClaw. Kemampuan yang tidak sesuai dengan kontrak bersama
dicantumkan di bawah ini atau pada bagian batasan yang diketahui.

| Kemampuan xAI                 | Permukaan OpenClaw                      | Status                                                              |
| ----------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Percakapan / Responses        | Penyedia model `xai/<model>`            | Ya                                                                  |
| Pencarian web sisi server     | Penyedia `web_search` `grok`            | Ya                                                                  |
| Pencarian X sisi server       | Alat `x_search`                         | Ya                                                                  |
| Eksekusi kode sisi server     | Alat `code_execution`                   | Ya                                                                  |
| Gambar                        | `image_generate`                        | Ya                                                                  |
| Video                         | `video_generate`                        | Alur kerja klasik lengkap; gambar-ke-video Video 1.5                |
| Teks-ke-ucapan batch          | `messages.tts.provider: "xai"` / `tts`  | Ya                                                                  |
| TTS streaming                 | -                                       | Belum diterapkan oleh penyedia xAI                                  |
| Ucapan-ke-teks batch          | Pemahaman media `tools.media.audio`     | Ya                                                                  |
| Ucapan-ke-teks streaming      | Panggilan Suara `streaming.provider: "xai"` | Ya                                                              |
| Suara waktu nyata             | -                                       | Belum diekspos; memerlukan kontrak sesi/WebSocket yang berbeda      |
| Berkas / batch                | Hanya kompatibilitas API model generik  | Bukan alat OpenClaw kelas utama                                     |

<Note>
OpenClaw menggunakan API REST gambar/video/TTS/STT xAI untuk pembuatan media dan
transkripsi batch, WebSocket STT streaming xAI untuk transkripsi panggilan suara
langsung, serta Responses API untuk percakapan, pencarian, dan alat eksekusi
kode.
</Note>

### Kompatibilitas mode cepat lama

`/fast on` atau `agents.defaults.models["xai/<model>"].params.fastMode: true`
tetap menulis ulang konfigurasi xAI lama sebagai berikut. Id target ini
dipertahankan hanya untuk kompatibilitas; gunakan model yang saat ini dapat
dipilih untuk konfigurasi baru.

| Model sumber  | Target mode cepat  |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Kompatibilitas lama dan alias yang berubah

Alias lama dinormalisasi sebagai berikut:

| Alias lama                                                    | Id ternormalisasi |
| ------------------------------------------------------------- | ----------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1`  |

Id 0309 bertanggal adalah entri katalog yang dapat dipilih. OpenClaw mengirim
semua alias Grok 4.20 terkini lainnya tanpa perubahan agar xAI tetap mengendalikan
semantik alias stabil, terbaru, beta, eksperimental, dan bertanggal. Alias global
`grok-latest` juga dipertahankan tanpa perubahan.

xAI telah menghentikan id persis berikut. OpenClaw mempertahankannya sebagai
baris kompatibilitas tersembunyi untuk konfigurasi yang telah dirilis, dengan
batasan dan harga dari target pengalihannya saat ini:

| Id yang dihentikan                                                   | Perilaku saat ini                          |
| -------------------------------------------------------------------- | ------------------------------------------ |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 dengan penalaran `low`            |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 dengan penalaran dinonaktifkan    |
| `grok-code-fast-1`                                                   | Grok Build 0.1                             |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality                 |

`openclaw doctor --fix` memperbarui nilai bawaan alat server xAI yang tersimpan
dan slug gambar kualitas yang telah dihentikan, menghapus baris katalog hasil
pembuatan yang sudah usang, serta memperbaiki metadata konteks yang usang pada
baris 4.20 aktif. Perintah ini tidak menyematkan alias `beta-latest` 4.20 aktif
ke snapshot bertanggal.

## Fitur

<Warning>
  `x_search` dan `code_execution` berjalan di server xAI. xAI mengenakan biaya
  $5 per 1.000 panggilan alat, ditambah token masukan dan keluaran model. Jika
  pengaturan `enabled` setiap alat tidak dicantumkan, OpenClaw hanya
  mengeksposnya untuk model xAI yang aktif. Penyedia model non-xAI yang diketahui
  memerlukan `enabled: true` secara eksplisit untuk setiap alat; penyedia yang
  tidak ada atau tidak dapat dikenali akan ditutup secara aman. Autentikasi xAI
  selalu diperlukan, dan `enabled: false` menonaktifkan alat untuk setiap
  penyedia.
</Warning>

<AccordionGroup>
  <Accordion title="Pencarian web">
    Penyedia pencarian web `grok` bawaan mengutamakan OAuth xAI, lalu beralih
    ke `XAI_API_KEY` atau kunci pencarian web Plugin sebagai cadangan:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Pembuatan video">
    Plugin `xai` bawaan mendaftarkan pembuatan video melalui alat bersama
    `video_generate`.

    - Model bawaan: `xai/grok-imagine-video`
    - Model tambahan: `xai/grok-imagine-video-1.5`
    - Mode klasik: teks-ke-video, gambar-ke-video, pembuatan dengan gambar
      referensi, pengeditan video jarak jauh, dan perpanjangan video jarak jauh
    - Mode Video 1.5: hanya gambar-ke-video, dengan tepat satu gambar bingkai
      pertama
    - Rasio aspek: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      gambar-ke-video klasik dan Video 1.5 mewarisi rasio gambar sumber jika
      tidak dicantumkan
    - Resolusi: klasik `480P`/`720P`; Video 1.5 juga mendukung `1080P`; semua
      mode pembuatan menggunakan `480P` secara bawaan
    - Durasi: 1–15 detik untuk pembuatan/gambar-ke-video, 1–10 detik saat
      menggunakan peran klasik `reference_image`, 2–10 detik untuk perpanjangan
      klasik
    - Pembuatan dengan gambar referensi: tetapkan `imageRoles` ke
      `reference_image` untuk setiap gambar yang diberikan; xAI menerima hingga
      7 gambar tersebut
    - Pengeditan/perpanjangan video mewarisi rasio aspek dan resolusi video
      masukan; operasi tersebut tidak menerima penggantian geometri
    - Batas waktu operasi bawaan: 600 detik kecuali
      `video_generate.timeoutMs` atau
      `agents.defaults.videoGenerationModel.timeoutMs` ditetapkan

    <Warning>
    Buffer video lokal tidak diterima. Gunakan URL `http(s)` jarak jauh untuk
    masukan pengeditan/perpanjangan video. Gambar-ke-video menerima buffer
    gambar lokal karena OpenClaw mengodekannya sebagai URL data untuk xAI.
    </Warning>

    Video 1.5 juga mengenali pengenal `grok-imagine-video-1.5-preview` dan
    `grok-imagine-video-1.5-2026-05-30` milik xAI. OpenClaw meneruskan pengenal
    yang dipilih tanpa perubahan, tetapi menerapkan validasi khusus gambar yang
    sama.

    Untuk menggunakan xAI sebagai penyedia video bawaan:

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
    Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat
    bersama, pemilihan penyedia, dan perilaku failover.
    </Note>

  </Accordion>

  <Accordion title="Pembuatan gambar">
    Plugin `xai` bawaan mendaftarkan pembuatan gambar melalui alat bersama
    `image_generate`.

    - Model gambar bawaan: `xai/grok-imagine-image`
    - Model tambahan: `xai/grok-imagine-image-quality`
    - Mode: teks-ke-gambar dan penyuntingan gambar referensi
    - Masukan referensi: satu `image` atau hingga tiga `images`
    - Rasio aspek: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Resolusi: `1K`, `2K`
    - Jumlah: hingga 4 gambar
    - Batas waktu operasi bawaan: 600 detik kecuali `image_generate.timeoutMs`
      atau `agents.defaults.imageGenerationModel.timeoutMs` ditetapkan

    OpenClaw meminta respons gambar `b64_json` dari xAI agar media yang
    dihasilkan dapat disimpan dan dikirim melalui jalur lampiran saluran
    normal. Gambar referensi lokal dikonversi menjadi URL data; referensi
    `http(s)` jarak jauh diteruskan tanpa perubahan.

    Untuk menggunakan xAI sebagai penyedia gambar bawaan:

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
    xAI juga mendokumentasikan `quality`, `mask`, `user`, dan rasio aspek
    `auto`. Saat ini OpenClaw hanya meneruskan kontrol gambar lintas penyedia
    bersama; pengaturan khusus bawaan ini tidak diekspos melalui
    `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Plugin `xai` bawaan mendaftarkan teks-ke-ucapan melalui permukaan penyedia
    `tts` bersama.

    - Suara: katalog langsung terautentikasi dari xAI; tampilkan dengan
      `openclaw infer tts voices --provider xai`
    - Suara cadangan luring: `ara`, `eve`, `leo`, `rex`, `sal`
    - Suara bawaan: `eve`
    - ID suara kustom akun diteruskan meskipun tidak terdapat dalam respons
      katalog bawaan
    - Format: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Bahasa: kode BCP-47 atau `auto`
    - Kecepatan: penggantian kecepatan bawaan penyedia
    - Format catatan suara Opus bawaan tidak didukung

    Untuk menggunakan xAI sebagai penyedia TTS bawaan:

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
    OpenClaw menggunakan endpoint batch `/v1/tts` dan katalog terautentikasi
    `/v1/tts/voices` milik xAI. xAI juga menawarkan TTS streaming melalui
    WebSocket, tetapi penyedia xAI bawaan belum mengimplementasikan kait
    streaming tersebut.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `xai` bawaan mendaftarkan ucapan-ke-teks batch melalui permukaan
    transkripsi pemahaman media OpenClaw.

    - Endpoint: REST xAI `/v1/stt`
    - Jalur masukan: unggahan berkas audio multipart
    - Pemilihan model: xAI memilih model transkripsi secara internal; endpoint
      tidak memiliki pemilih model
    - Digunakan di setiap tempat transkripsi audio masuk membaca
      `tools.media.audio`, termasuk segmen saluran suara Discord dan lampiran
      audio saluran

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

    Bahasa dapat diberikan melalui konfigurasi media audio bersama atau
    permintaan transkripsi per panggilan. Petunjuk prompt diterima oleh
    permukaan bersama OpenClaw, tetapi integrasi STT REST xAI hanya meneruskan
    berkas dan bahasa karena keduanya dipetakan ke endpoint publik xAI saat
    ini.

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    Plugin `xai` bawaan juga mendaftarkan penyedia transkripsi waktu nyata
    untuk audio panggilan suara langsung.

    - Endpoint: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Pengodean bawaan: `mulaw`
    - Laju sampel bawaan: `8000`
    - Penentuan akhir ucapan bawaan: `800ms`
    - Transkrip sementara: diaktifkan secara bawaan

    Aliran media Twilio milik Voice Call mengirim bingkai audio G.711 mu-law,
    sehingga penyedia xAI meneruskan bingkai tersebut secara langsung tanpa
    transkode:

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
    didukung adalah `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`,
    `mulaw`, atau `alaw`), `interimResults`, `endpointingMs`, dan `language`.

    <Note>
    Penyedia streaming ini ditujukan untuk jalur transkripsi waktu nyata milik
    Voice Call. Suara Discord merekam segmen pendek dan sebagai gantinya
    menggunakan jalur transkripsi batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    Plugin xAI bawaan mengekspos `x_search` sebagai alat OpenClaw untuk mencari
    konten X (sebelumnya Twitter) melalui Grok.

    Jalur konfigurasi: `plugins.entries.xai.config.xSearch`

    | Kunci             | Jenis   | Bawaan                    | Deskripsi                                               |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------------- |
    | `enabled`         | boolean | Otomatis untuk model xAI  | Nonaktifkan, atau aktifkan untuk penyedia non-xAI yang diketahui |
    | `model`           | string  | `grok-4.3`                | Model yang digunakan untuk permintaan x_search          |
    | `baseUrl`         | string  | -                         | Penggantian URL dasar Responses xAI                     |
    | `inlineCitations` | boolean | -                         | Sertakan kutipan sebaris dalam hasil                    |
    | `maxTurns`        | number  | -                         | Jumlah maksimum giliran percakapan                      |
    | `timeoutSeconds`  | number  | `30`                      | Batas waktu permintaan dalam detik                      |
    | `cacheTtlMinutes` | number  | `15`                      | Masa berlaku cache dalam menit                          |

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

  <Accordion title="Code execution configuration">
    Plugin xAI bawaan mengekspos `code_execution` sebagai alat OpenClaw untuk
    eksekusi kode jarak jauh dalam lingkungan sandbox xAI.

    Jalur konfigurasi: `plugins.entries.xai.config.codeExecution`

    | Kunci            | Jenis   | Bawaan                   | Deskripsi                                               |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------------- |
    | `enabled`        | boolean | Otomatis untuk model xAI | Nonaktifkan, atau aktifkan untuk penyedia non-xAI yang diketahui |
    | `model`          | string  | `grok-4.3`               | Model yang digunakan untuk permintaan eksekusi kode     |
    | `maxTurns`       | number  | -                        | Jumlah maksimum giliran percakapan                      |
    | `timeoutSeconds` | number  | `30`                     | Batas waktu permintaan dalam detik                      |

    <Note>
    Ini adalah eksekusi sandbox xAI jarak jauh, bukan [`exec`](/id/tools/exec)
    lokal.
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

  <Accordion title="Known limits">
    - Autentikasi xAI dapat menggunakan kunci API, variabel lingkungan,
      konfigurasi Plugin sebagai cadangan, atau OAuth dengan akun xAI yang
      memenuhi syarat. OAuth menggunakan verifikasi kode perangkat tanpa
      panggilan balik localhost. xAI menentukan akun mana yang dapat menerima
      token API OAuth, dan halaman persetujuan mungkin menampilkan Grok Build
      meskipun OpenClaw tidak memerlukan aplikasi Grok Build.
    - Saat ini OpenClaw tidak mengekspos keluarga model multiagen xAI. xAI
      menyediakan model-model ini melalui Responses API, tetapi model tersebut
      tidak menerima alat sisi klien atau alat kustom yang digunakan oleh loop
      agen bersama OpenClaw. Lihat
      [batasan multiagen xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Suara xAI Realtime belum didaftarkan sebagai penyedia OpenClaw. Fitur ini
      memerlukan kontrak sesi suara dua arah yang berbeda dari STT batch atau
      transkripsi streaming.
    - `quality` gambar xAI, `mask` gambar, dan rasio aspek `auto` bawaan tidak
      diekspos hingga alat bersama `image_generate` memiliki kontrol lintas
      penyedia yang sesuai.
  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw secara otomatis menerapkan perbaikan kompatibilitas skema alat
      dan panggilan alat khusus xAI pada jalur penjalan bersama.
    - Permintaan xAI bawaan menggunakan `tool_stream: true` secara bawaan.
      Tetapkan `agents.defaults.models["xai/<model>"].params.tool_stream`
      menjadi `false` untuk menonaktifkannya.
    - Pembungkus xAI bawaan menghapus batas jumlah kandungan yang tidak
      didukung dan kunci muatan *upaya* penalaran yang tidak didukung sebelum
      mengirim permintaan xAI bawaan. Grok 4.5 mendukung upaya rendah, sedang,
      dan tinggi (bawaan tinggi). Grok 4.3 mendukung tanpa upaya, rendah,
      sedang, dan tinggi (bawaan rendah). Model xAI lain yang mendukung
      penalaran tidak mengekspos kontrol upaya yang dapat dikonfigurasi, tetapi
      tetap meminta `include: ["reasoning.encrypted_content"]` agar penalaran
      terenkripsi sebelumnya dapat diputar ulang pada giliran lanjutan.
    - `web_search`, `x_search`, dan `code_execution` diekspos sebagai alat
      OpenClaw. OpenClaw hanya melampirkan alat bawaan xAI tertentu yang
      diperlukan oleh setiap alat ke permintaannya, alih-alih melampirkan
      semua alat bawaan ke setiap giliran obrolan.
    - `web_search` Grok membaca
      `plugins.entries.xai.config.webSearch.baseUrl`. `x_search` membaca
      `plugins.entries.xai.config.xSearch.baseUrl`, lalu menggunakan URL dasar
      pencarian web Grok sebagai cadangan.
    - `x_search` dan `code_execution` dimiliki oleh Plugin xAI bawaan, bukan
      dikodekan langsung ke dalam runtime model inti.
    - `code_execution` adalah eksekusi sandbox xAI jarak jauh, bukan
      [`exec`](/id/tools/exec) lokal.
  </Accordion>
</AccordionGroup>

## Pengujian langsung

Jalur media xAI dicakup oleh pengujian unit dan rangkaian pengujian langsung
yang harus diaktifkan secara eksplisit. Ekspor `XAI_API_KEY` dalam lingkungan
proses sebelum menjalankan pemeriksaan langsung.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Berkas live khusus penyedia menyintesis TTS normal, TTS PCM yang sesuai untuk
telefoni, mentranskripsikan audio melalui STT batch xAI, mengalirkan PCM yang sama melalui
STT waktu nyata xAI, menghasilkan keluaran teks-ke-gambar, dan mengedit gambar referensi.
Berkas live gambar bersama memverifikasi penyedia xAI yang sama melalui jalur
pemilihan runtime, fallback, normalisasi, dan lampiran media OpenClaw. Kasus
Video 1.5 yang harus diaktifkan secara khusus mengirimkan satu gambar bingkai pertama yang dihasilkan pada 1080P dan
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
    Ikhtisar penyedia yang lebih luas.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan perbaikannya.
  </Card>
</CardGroup>

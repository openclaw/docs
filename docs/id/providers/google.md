---
read_when:
    - Anda ingin menggunakan model Google Gemini dengan OpenClaw
    - Anda memerlukan kunci API atau alur autentikasi OAuth
summary: Penyiapan Google Gemini (kunci API + OAuth, pembuatan gambar, pemahaman media, TTS, pencarian web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-16T18:39:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe8a58044bea7ce2598da94787334af2bb4a2ff58872c62115697fa0079daf0a
    source_path: providers/google.md
    workflow: 16
---

Plugin Google menyediakan akses ke model Gemini melalui Google AI Studio, serta pembuatan gambar, pemahaman media (gambar/audio/video), text-to-speech, dan pencarian web melalui Gemini Grounding.

- Penyedia: `google`
- Autentikasi: `GEMINI_API_KEY` atau `GOOGLE_API_KEY`
- API: Google Gemini API
- Opsi runtime: `agentRuntime.id: "google-gemini-cli"` menggunakan kembali OAuth Gemini CLI sekaligus mempertahankan referensi model kanonis sebagai `google/*`.

## Memulai

Pilih metode autentikasi yang diinginkan dan ikuti langkah-langkah penyiapannya.

<Tabs>
  <Tab title="Kunci API">
    **Paling cocok untuk:** akses Gemini API standar melalui Google AI Studio.

    <Steps>
      <Step title="Dapatkan kunci API">
        Buat kunci gratis di [Google AI Studio](https://aistudio.google.com/apikey).
      </Step>
      <Step title="Jalankan orientasi awal">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Atau berikan kunci secara langsung:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Tetapkan model default">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` dan `GOOGLE_API_KEY` keduanya diterima. Gunakan mana pun yang sudah dikonfigurasi.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Paling cocok untuk:** masuk dengan akun Google melalui OAuth Gemini CLI alih-alih menggunakan kunci API terpisah.

    <Warning>
    Penyedia `google-gemini-cli` merupakan integrasi tidak resmi. Beberapa pengguna
    melaporkan pembatasan akun saat menggunakan OAuth dengan cara ini. Gunakan dengan risiko ditanggung sendiri.
    </Warning>

    <Steps>
      <Step title="Instal Gemini CLI">
        Perintah lokal `gemini` harus tersedia di `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # atau npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw mendukung instalasi Homebrew dan instalasi npm global, termasuk
        tata letak Windows/npm yang umum.
      </Step>
      <Step title="Masuk melalui OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Model default: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    ID model Gemini API untuk Gemini 3.1 Pro adalah `gemini-3.1-pro-preview`. OpenClaw menerima bentuk yang lebih pendek, `google/gemini-3.1-pro`, sebagai alias praktis dan menormalisasinya sebelum panggilan penyedia.

    **Variabel lingkungan:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Jika permintaan OAuth Gemini CLI gagal setelah masuk, tetapkan `GOOGLE_CLOUD_PROJECT` atau
    `GOOGLE_CLOUD_PROJECT_ID` pada host Gateway dan coba lagi.
    </Note>

    <Note>
    Jika proses masuk gagal sebelum alur peramban dimulai, pastikan perintah lokal `gemini`
    telah diinstal dan tersedia di `PATH`.
    </Note>

    Deteksi otomatis orientasi awal mencantumkan sesi masuk Gemini CLI yang sudah ada, tetapi tidak pernah
    mengujinya secara otomatis karena Gemini CLI tidak memiliki pemeriksaan tanpa alat. Pilih OAuth Gemini CLI
    atau kunci Gemini API untuk melanjutkan.

    Referensi model `google-gemini-cli/*` adalah alias kompatibilitas lama. Konfigurasi
    baru harus menggunakan referensi model `google/*` serta runtime `google-gemini-cli`
    jika menginginkan eksekusi Gemini CLI lokal.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` dihentikan pada 2026-03-09; gunakan `google/gemini-3.1-pro-preview` sebagai gantinya. Menjalankan kembali penyiapan kunci Gemini API (`openclaw onboard --auth-choice gemini-api-key` atau `openclaw models auth login --provider google`) menulis ulang default terkonfigurasi yang kedaluwarsa ke model saat ini.
</Note>

## Kemampuan

| Kemampuan              | Didukung                      |
| ---------------------- | ----------------------------- |
| Penyelesaian chat      | Ya                            |
| Pembuatan gambar       | Ya                            |
| Pembuatan musik        | Ya                            |
| Text-to-speech         | Ya                            |
| Suara waktu nyata      | Ya (Google Live API)          |
| Pemahaman gambar       | Ya                            |
| Transkripsi audio      | Ya                            |
| Pemahaman video        | Ya                            |
| Pencarian web (Grounding) | Ya                         |
| Pemikiran/penalaran    | Ya (Gemini 2.5+ / Gemini 3+)  |
| Model Gemma 4          | Ya                            |

## Pencarian web

Penyedia pencarian web `gemini` yang dibundel menggunakan grounding Google Search dari Gemini.
Konfigurasikan kunci pencarian khusus di bawah `plugins.entries.google.config.webSearch`,
atau biarkan menggunakan kembali `models.providers.google.apiKey` setelah `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // opsional jika GEMINI_API_KEY atau models.providers.google.apiKey ditetapkan
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // kembali ke models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Urutan prioritas kredensial adalah `webSearch.apiKey` khusus, kemudian `GEMINI_API_KEY`,
lalu `models.providers.google.apiKey`. `webSearch.baseUrl` bersifat opsional dan
tersedia untuk proksi operator atau endpoint Gemini API yang kompatibel; jika dihilangkan,
pencarian web Gemini menggunakan kembali `models.providers.google.baseUrl`. Lihat
[Pencarian Gemini](/id/tools/gemini-search) untuk perilaku alat khusus penyedia.

<Tip>
Model Gemini 3 menggunakan `thinkingLevel`, bukan `thinkingBudget`. OpenClaw memetakan
kontrol penalaran alias Gemini 3, Gemini 3.1, dan `gemini-*-latest` ke
`thinkingLevel` agar proses default/latensi rendah tidak mengirim nilai
`thinkingBudget` yang dinonaktifkan.

`/think adaptive` mempertahankan semantik pemikiran dinamis Google alih-alih memilih
tingkat OpenClaw tetap. Gemini 3 dan Gemini 3.1 tidak menyertakan `thinkingLevel` tetap agar
Google dapat memilih tingkatnya; Gemini 2.5 mengirim sentinel dinamis Google
`thinkingBudget: -1`.

Model Gemma 4 (misalnya `gemma-4-26b-a4b-it`) mendukung mode pemikiran. OpenClaw
menulis ulang `thinkingBudget` menjadi `thinkingLevel` Google yang didukung untuk Gemma 4.
Menetapkan pemikiran ke `off` mempertahankan pemikiran dalam keadaan dinonaktifkan alih-alih memetakannya ke
`MINIMAL`.

Gemini 2.5 Pro hanya berfungsi dalam mode pemikiran dan menolak
`thinkingBudget: 0` eksplisit; OpenClaw menghapus nilai tersebut dari permintaan Gemini 2.5 Pro
alih-alih mengirimkannya.
</Tip>

## Pembuatan gambar

Penyedia pembuatan gambar `google` yang dibundel menggunakan
`google/gemini-3.1-flash-image-preview` secara default.

- Juga mendukung `google/gemini-3-pro-image-preview`
- Pembuatan: hingga 4 gambar per permintaan
- Mode penyuntingan: diaktifkan, hingga 5 gambar masukan
- Kontrol geometri: `size`, `aspectRatio`, dan `resolution`

Untuk menggunakan Google sebagai penyedia gambar default:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

## Pembuatan video

Plugin `google` yang dibundel juga mendaftarkan pembuatan video melalui alat bersama
`video_generate`.

- Model video default: `google/veo-3.1-fast-generate-preview`
- Mode: teks-ke-video, gambar-ke-video, dan alur referensi video tunggal
- Mendukung `aspectRatio` (`16:9`, `9:16`) dan `resolution` (`720P`, `1080P`); keluaran audio saat ini tidak didukung oleh Veo
- Durasi yang didukung: **4, 6, atau 8 detik** (nilai lain disesuaikan ke nilai terdekat yang diizinkan)

Untuk menggunakan Google sebagai penyedia video default:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

## Pembuatan musik

Plugin `google` yang dibundel juga mendaftarkan pembuatan musik melalui alat bersama
`music_generate`.

- Model musik default: `google/lyria-3-clip-preview`
- Juga mendukung `google/lyria-3-pro-preview`
- Kontrol prompt: `lyrics` dan `instrumental`
- Format keluaran: `mp3` secara default, ditambah `wav` pada `google/lyria-3-pro-preview`
- Masukan referensi: hingga 10 gambar
- Proses berbasis sesi dilepas melalui alur tugas/status bersama, termasuk `action: "status"`

Untuk menggunakan Google sebagai penyedia musik default:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Lihat [Pembuatan Musik](/id/tools/music-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

## Text-to-speech

Penyedia ucapan `google` yang dibundel menggunakan jalur TTS Gemini API dengan
`gemini-3.1-flash-tts-preview`.

- Suara default: `Kore`
- Autentikasi: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY`
- Keluaran: WAV untuk lampiran TTS biasa, Opus untuk target catatan suara, PCM untuk Talk/telefoni
- Keluaran catatan suara: PCM Google dibungkus sebagai WAV dan ditranskode menjadi Opus 48 kHz dengan `ffmpeg`

Jalur TTS Gemini batch dari Google mengembalikan audio yang dihasilkan dalam respons
`generateContent` yang telah selesai. Untuk percakapan lisan dengan latensi terendah, gunakan
penyedia suara waktu nyata Google yang didukung Gemini Live API, bukan TTS
batch.

Untuk menggunakan Google sebagai penyedia TTS default:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

TTS Gemini API menggunakan prompt bahasa alami untuk mengontrol gaya. Tetapkan
`audioProfile` untuk menambahkan prompt gaya yang dapat digunakan kembali sebelum teks yang diucapkan. Tetapkan
`speakerName` saat teks prompt merujuk pada pembicara bernama.

TTS Gemini API juga menerima tag audio ekspresif dalam tanda kurung siku di dalam teks,
seperti `[whispers]` atau `[laughs]`. Agar tag tidak muncul dalam balasan chat yang terlihat
tetapi tetap dikirim ke TTS, letakkan tag di dalam blok `[[tts:text]]...[[/tts:text]]`:

```text
Berikut adalah teks balasan yang bersih.

[[tts:text]][whispers] Berikut adalah versi yang diucapkan.[[/tts:text]]
```

<Note>
Kunci API Google Cloud Console yang dibatasi untuk Gemini API berlaku bagi
penyedia ini. Ini bukan jalur Cloud Text-to-Speech API yang terpisah.
</Note>

## Suara waktu nyata

Plugin `google` yang dibundel mendaftarkan penyedia suara waktu nyata yang didukung
Gemini Live API untuk jembatan audio backend seperti Voice Call dan Google Meet.

| Pengaturan               | Jalur konfigurasi                                                         | Default                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| Suara                 | `...google.voice`                                                   | `Kore`                                                                                |
| Suhu           | `...google.temperature`                                             | (tidak disetel)                                                                               |
| Sensitivitas awal VAD | `...google.startSensitivity`                                        | (tidak disetel)                                                                               |
| Sensitivitas akhir VAD   | `...google.endSensitivity`                                          | (tidak disetel)                                                                               |
| Durasi keheningan      | `...google.silenceDurationMs`                                       | (tidak disetel)                                                                               |
| Penanganan aktivitas     | `...google.activityHandling`                                        | Default Google, `start-of-activity-interrupts`                                        |
| Cakupan giliran         | `...google.turnCoverage`                                            | Default Google, `audio-activity-and-all-video`                                        |
| Nonaktifkan VAD otomatis      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Pelanjutan sesi    | `...google.sessionResumption`                                       | `true`                                                                                |
| Kompresi konteks   | `...google.contextWindowCompression`                                | `true`                                                                                |
| Kunci API               | `...google.apiKey`                                                  | Menggunakan `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY` sebagai cadangan |

Contoh konfigurasi waktu nyata Panggilan Suara:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API menggunakan audio dua arah dan pemanggilan fungsi melalui WebSocket.
OpenClaw menyesuaikan audio jembatan telepon/Meet dengan aliran PCM Live API Gemini dan
mempertahankan pemanggilan alat pada kontrak suara waktu nyata bersama. Biarkan `temperature`
tidak disetel kecuali Anda perlu mengubah pengambilan sampel; OpenClaw menghilangkan nilai
nonpositif karena Google Live dapat mengembalikan transkrip tanpa audio untuk `temperature: 0`.
Transkripsi Gemini API diaktifkan tanpa `languageCodes`; SDK Google saat ini
menolak petunjuk kode bahasa pada jalur API ini.
</Note>

<Note>
Gemini 3.1 Live menerima teks percakapan melalui input waktu nyata dan menggunakan
pemanggilan fungsi berurutan. OpenClaw menghilangkan `NON_BLOCKING`, penjadwalan
respons fungsi, dan bidang dialog afektif lama untuk model ini. Utamakan
`thinkingLevel`; nilai positif `thinkingBudget` yang dikonfigurasi dipetakan ke
tingkat terdekat yang didukung, sedangkan `-1` mempertahankan default Google. Lihat
[perbandingan kemampuan Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Talk di Control UI mendukung sesi browser Google Live dengan token sekali pakai
yang dibatasi. Penyedia suara waktu nyata khusus backend juga dapat berjalan melalui
transport relai Gateway generik, yang menyimpan kredensial penyedia di Gateway.
</Note>

Untuk verifikasi langsung oleh pengelola, jalankan
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Uji asap ini juga mencakup jalur backend/WebRTC OpenAI; bagian Google membuat token
Live API terbatas dengan bentuk yang sama seperti yang digunakan oleh Talk di Control UI, membuka
endpoint WebSocket browser, mengirim payload penyiapan awal, dan menunggu
`setupComplete`.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penggunaan kembali cache Gemini langsung">
    Untuk eksekusi Gemini API langsung (`api: "google-generative-ai"`), OpenClaw
    meneruskan handle `cachedContent` yang dikonfigurasi ke permintaan Gemini.

    - Konfigurasikan parameter per model atau global dengan
      `cachedContent` atau `cached_content` lama
    - Parameter dari cakupan yang lebih spesifik (tingkat model daripada global) selalu diutamakan.
      Dalam cakupan yang sama, jika kedua kunci disetel, `cached_content` diutamakan.
      Gunakan hanya satu kunci per cakupan untuk menghindari hasil yang tidak terduga.
    - Contoh nilai: `cachedContents/prebuilt-context`
    - Penggunaan cache hit Gemini dinormalisasi menjadi `cacheRead` OpenClaw dari
      `cachedContentTokenCount` upstream

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Catatan penggunaan Gemini CLI">
    Saat menggunakan penyedia OAuth `google-gemini-cli`, OpenClaw secara default menggunakan
    output `stream-json` Gemini CLI dan menormalisasi penggunaan dari payload
    `stats` terakhir. Penimpaan `--output-format json` lama tetap menggunakan
    pengurai JSON.

    - Teks balasan yang dialirkan berasal dari peristiwa `message` asisten.
    - Untuk output JSON lama, teks balasan berasal dari bidang `response` JSON CLI.
    - Penggunaan beralih ke `stats` sebagai cadangan saat CLI membiarkan `usage` kosong.
    - `stats.cached` dinormalisasi menjadi `cacheRead` OpenClaw.
    - Jika `stats.input` tidak ada, OpenClaw memperoleh token input dari
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Penyiapan lingkungan dan daemon">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `GEMINI_API_KEY`
    tersedia untuk proses tersebut (misalnya, dalam `~/.openclaw/.env` atau melalui
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pembuatan musik" href="/id/tools/music-generation" icon="music">
    Parameter alat musik bersama dan pemilihan penyedia.
  </Card>
</CardGroup>

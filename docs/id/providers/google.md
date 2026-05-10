---
read_when:
    - Anda ingin menggunakan model Google Gemini dengan OpenClaw
    - Anda memerlukan kunci API atau alur autentikasi OAuth
summary: Penyiapan Google Gemini (kunci API + OAuth, pembuatan gambar, pemahaman media, TTS, pencarian web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-10T19:49:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd61383edad3192577d37c9a706470828d59edd5a187ef4f3c30985afaf46167
    source_path: providers/google.md
    workflow: 16
---

Plugin Google menyediakan akses ke model Gemini melalui Google AI Studio, ditambah
pembuatan gambar, pemahaman media (gambar/audio/video), text-to-speech, dan pencarian web melalui
Gemini Grounding.

- Penyedia: `google`
- Autentikasi: `GEMINI_API_KEY` atau `GOOGLE_API_KEY`
- API: Google Gemini API
- Opsi runtime: penyedia/model `agentRuntime.id: "google-gemini-cli"`
  menggunakan kembali OAuth Gemini CLI sambil mempertahankan referensi model kanonis sebagai `google/*`.

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah-langkah penyiapannya.

<Tabs>
  <Tab title="API key">
    **Paling sesuai untuk:** akses Gemini API standar melalui Google AI Studio.

    <Steps>
      <Step title="Run onboarding">
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
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Variabel lingkungan `GEMINI_API_KEY` dan `GOOGLE_API_KEY` sama-sama diterima. Gunakan mana pun yang sudah Anda konfigurasikan.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Paling sesuai untuk:** menggunakan kembali login Gemini CLI yang sudah ada melalui PKCE OAuth, bukan kunci API terpisah.

    <Warning>
    Penyedia `google-gemini-cli` adalah integrasi tidak resmi. Sebagian pengguna
    melaporkan pembatasan akun saat menggunakan OAuth dengan cara ini. Gunakan dengan risiko Anda sendiri.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        Perintah lokal `gemini` harus tersedia di `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw mendukung instalasi Homebrew dan instalasi npm global, termasuk
        tata letak umum Windows/npm.
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Model default: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    ID model Gemini API untuk Gemini 3.1 Pro adalah `gemini-3.1-pro-preview`. OpenClaw menerima `google/gemini-3.1-pro` yang lebih pendek sebagai alias kemudahan dan menormalkannya sebelum panggilan penyedia.

    **Variabel lingkungan:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Atau varian `GEMINI_CLI_*`.)

    <Note>
    Jika permintaan Gemini CLI OAuth gagal setelah login, atur `GOOGLE_CLOUD_PROJECT` atau
    `GOOGLE_CLOUD_PROJECT_ID` pada host gateway dan coba lagi.
    </Note>

    <Note>
    Jika login gagal sebelum alur browser dimulai, pastikan perintah lokal `gemini`
    sudah terinstal dan ada di `PATH`.
    </Note>

    Referensi model `google-gemini-cli/*` adalah alias kompatibilitas legacy. Konfigurasi
    baru sebaiknya menggunakan referensi model `google/*` ditambah runtime `google-gemini-cli`
    saat menginginkan eksekusi Gemini CLI lokal.

  </Tab>
</Tabs>

## Kemampuan

| Kemampuan              | Didukung                      |
| ---------------------- | ----------------------------- |
| Penyelesaian chat      | Ya                            |
| Pembuatan gambar       | Ya                            |
| Pembuatan musik        | Ya                            |
| Text-to-speech         | Ya                            |
| Suara realtime         | Ya (Google Live API)          |
| Pemahaman gambar       | Ya                            |
| Transkripsi audio      | Ya                            |
| Pemahaman video        | Ya                            |
| Pencarian web (Grounding) | Ya                         |
| Berpikir/penalaran     | Ya (Gemini 2.5+ / Gemini 3+)  |
| Model Gemma 4          | Ya                            |

## Pencarian web

Penyedia pencarian web `gemini` bawaan menggunakan grounding Gemini Google Search.
Konfigurasikan kunci pencarian khusus di bawah `plugins.entries.google.config.webSearch`,
atau biarkan menggunakan kembali `models.providers.google.apiKey` setelah `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Prioritas kredensial adalah `webSearch.apiKey` khusus, lalu `GEMINI_API_KEY`,
lalu `models.providers.google.apiKey`. `webSearch.baseUrl` bersifat opsional dan
ada untuk proksi operator atau endpoint Gemini API yang kompatibel; bila dihilangkan,
pencarian web Gemini menggunakan kembali `models.providers.google.baseUrl`. Lihat
[Pencarian Gemini](/id/tools/gemini-search) untuk perilaku alat khusus penyedia.

<Tip>
Model Gemini 3 menggunakan `thinkingLevel`, bukan `thinkingBudget`. OpenClaw memetakan
kontrol penalaran alias Gemini 3, Gemini 3.1, dan `gemini-*-latest` ke
`thinkingLevel` sehingga proses default/latensi rendah tidak mengirim nilai
`thinkingBudget` yang dinonaktifkan.

`/think adaptive` mempertahankan semantik berpikir dinamis Google, bukan memilih
level OpenClaw tetap. Gemini 3 dan Gemini 3.1 menghilangkan `thinkingLevel` tetap agar
Google dapat memilih levelnya; Gemini 2.5 mengirim sentinel dinamis Google
`thinkingBudget: -1`.

Model Gemma 4 (misalnya `gemma-4-26b-a4b-it`) mendukung mode berpikir. OpenClaw
menulis ulang `thinkingBudget` menjadi `thinkingLevel` Google yang didukung untuk Gemma 4.
Mengatur berpikir ke `off` mempertahankan berpikir dinonaktifkan, bukan memetakannya ke
`MINIMAL`.
</Tip>

## Pembuatan gambar

Penyedia pembuatan gambar `google` bawaan menggunakan default
`google/gemini-3.1-flash-image-preview`.

- Juga mendukung `google/gemini-3-pro-image-preview`
- Buat: hingga 4 gambar per permintaan
- Mode edit: diaktifkan, hingga 5 gambar input
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

Plugin `google` bawaan juga mendaftarkan pembuatan video melalui alat bersama
`video_generate`.

- Model video default: `google/veo-3.1-fast-generate-preview`
- Mode: alur teks-ke-video, gambar-ke-video, dan referensi satu video
- Mendukung `aspectRatio`, `resolution`, dan `audio`
- Batas durasi saat ini: **4 hingga 8 detik**

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

Plugin `google` bawaan juga mendaftarkan pembuatan musik melalui alat bersama
`music_generate`.

- Model musik default: `google/lyria-3-clip-preview`
- Juga mendukung `google/lyria-3-pro-preview`
- Kontrol prompt: `lyrics` dan `instrumental`
- Format output: `mp3` secara default, ditambah `wav` pada `google/lyria-3-pro-preview`
- Input referensi: hingga 10 gambar
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

Penyedia suara `google` bawaan menggunakan jalur TTS Gemini API dengan
`gemini-3.1-flash-tts-preview`.

- Suara default: `Kore`
- Autentikasi: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY`
- Output: WAV untuk lampiran TTS biasa, Opus untuk target catatan suara, PCM untuk Talk/telephony
- Output catatan suara: PCM Google dibungkus sebagai WAV dan ditranskode ke Opus 48 kHz dengan `ffmpeg`

Jalur batch Gemini TTS Google mengembalikan audio yang dihasilkan dalam respons
`generateContent` yang selesai. Untuk percakapan lisan dengan latensi terendah, gunakan
penyedia suara realtime Google yang didukung Gemini Live API, bukan TTS batch.

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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS menggunakan prompting bahasa alami untuk kontrol gaya. Atur
`audioProfile` untuk menambahkan prompt gaya yang dapat digunakan kembali sebelum teks lisan. Atur
`speakerName` saat teks prompt Anda merujuk ke pembicara bernama.

Gemini API TTS juga menerima tag audio ekspresif dalam tanda kurung siku di teks,
seperti `[whispers]` atau `[laughs]`. Agar tag tidak muncul di balasan chat yang terlihat
sambil tetap mengirimkannya ke TTS, letakkan di dalam blok `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Kunci API Google Cloud Console yang dibatasi untuk Gemini API valid untuk penyedia ini.
Ini bukan jalur Cloud Text-to-Speech API yang terpisah.
</Note>

## Suara realtime

Plugin `google` bawaan mendaftarkan penyedia suara realtime yang didukung oleh
Gemini Live API untuk bridge audio backend seperti Voice Call dan Google Meet.

| Pengaturan              | Jalur konfigurasi                                                   | Bawaan                                                                               |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Model                   | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                      |
| Suara                   | `...google.voice`                                                   | `Kore`                                                                               |
| Suhu                    | `...google.temperature`                                             | (tidak diatur)                                                                       |
| Sensitivitas mulai VAD  | `...google.startSensitivity`                                        | (tidak diatur)                                                                       |
| Sensitivitas akhir VAD  | `...google.endSensitivity`                                          | (tidak diatur)                                                                       |
| Durasi senyap           | `...google.silenceDurationMs`                                       | (tidak diatur)                                                                       |
| Penanganan aktivitas    | `...google.activityHandling`                                        | Bawaan Google, `start-of-activity-interrupts`                                        |
| Cakupan giliran         | `...google.turnCoverage`                                            | Bawaan Google, `only-activity`                                                       |
| Nonaktifkan VAD otomatis | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                              |
| Pelanjutan sesi         | `...google.sessionResumption`                                       | `true`                                                                               |
| Kompresi konteks        | `...google.contextWindowCompression`                                | `true`                                                                               |
| Kunci API               | `...google.apiKey`                                                  | Mundur ke `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY` |

Contoh konfigurasi waktu nyata Voice Call:

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
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
OpenClaw menyesuaikan audio jembatan telepon/Meet ke stream Gemini PCM Live API dan
mempertahankan panggilan alat pada kontrak suara waktu nyata bersama. Biarkan `temperature`
tidak diatur kecuali Anda memerlukan perubahan sampling; OpenClaw menghilangkan nilai non-positif
karena Google Live dapat mengembalikan transkrip tanpa audio untuk `temperature: 0`.
Transkripsi Gemini API diaktifkan tanpa `languageCodes`; Google
SDK saat ini menolak petunjuk kode bahasa pada jalur API ini.
</Note>

<Note>
Control UI Talk mendukung sesi browser Google Live dengan token sekali pakai yang dibatasi.
Penyedia suara waktu nyata khusus backend juga dapat berjalan melalui transport relay
Gateway generik, yang menyimpan kredensial penyedia di Gateway.
</Note>

Untuk verifikasi langsung oleh maintainer, jalankan
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Smoke juga mencakup jalur backend/WebRTC OpenAI; bagian Google membuat bentuk token
Live API terbatas yang sama seperti yang digunakan oleh Control UI Talk, membuka endpoint
WebSocket browser, mengirim payload penyiapan awal, dan menunggu
`setupComplete`.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    Untuk eksekusi langsung Gemini API (`api: "google-generative-ai"`), OpenClaw
    meneruskan handle `cachedContent` yang dikonfigurasi ke permintaan Gemini.

    - Konfigurasikan parameter per model atau global dengan
      `cachedContent` atau `cached_content` lama
    - Jika keduanya ada, `cachedContent` yang berlaku
    - Contoh nilai: `cachedContents/prebuilt-context`
    - Penggunaan cache-hit Gemini dinormalisasi ke OpenClaw `cacheRead` dari
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

  <Accordion title="Gemini CLI JSON usage notes">
    Saat menggunakan penyedia OAuth `google-gemini-cli`, OpenClaw menormalisasi
    output JSON CLI sebagai berikut:

    - Teks balasan berasal dari kolom JSON CLI `response`.
    - Penggunaan mundur ke `stats` saat CLI membiarkan `usage` kosong.
    - `stats.cached` dinormalisasi ke OpenClaw `cacheRead`.
    - Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `GEMINI_API_KEY`
    tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Image generation" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan penyedia.
  </Card>
  <Card title="Video generation" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="Music generation" href="/id/tools/music-generation" icon="music">
    Parameter alat musik bersama dan pemilihan penyedia.
  </Card>
</CardGroup>

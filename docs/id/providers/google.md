---
read_when:
    - Anda ingin menggunakan model Google Gemini dengan OpenClaw
    - Anda memerlukan kunci API atau alur autentikasi OAuth
summary: Penyiapan Google Gemini (kunci API + OAuth, pembuatan gambar, pemahaman media, TTS, pencarian web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-06-27T18:04:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eced20b11cc702d803992d96dcc5edb8f06640f6baffbc65dab504a6c91776bc
    source_path: providers/google.md
    workflow: 16
---

Plugin Google menyediakan akses ke model Gemini melalui Google AI Studio, serta
pembuatan gambar, pemahaman media (gambar/audio/video), text-to-speech, dan pencarian web melalui
Gemini Grounding.

- Penyedia: `google`
- Auth: `GEMINI_API_KEY` atau `GOOGLE_API_KEY`
- API: Google Gemini API
- Opsi runtime: provider/model `agentRuntime.id: "google-gemini-cli"`
  menggunakan ulang OAuth Gemini CLI sambil mempertahankan referensi model kanonis sebagai `google/*`.

## Memulai

Pilih metode auth yang Anda inginkan dan ikuti langkah penyiapannya.

<Tabs>
  <Tab title="Kunci API">
    **Paling cocok untuk:** akses Gemini API standar melalui Google AI Studio.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Atau berikan kuncinya secara langsung:

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
    Variabel lingkungan `GEMINI_API_KEY` dan `GOOGLE_API_KEY` sama-sama diterima. Gunakan mana pun yang sudah Anda konfigurasi.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Paling cocok untuk:** menggunakan ulang login Gemini CLI yang sudah ada melalui PKCE OAuth, alih-alih kunci API terpisah.

    <Warning>
    Penyedia `google-gemini-cli` adalah integrasi tidak resmi. Sebagian pengguna
    melaporkan pembatasan akun saat menggunakan OAuth dengan cara ini. Gunakan dengan risiko Anda sendiri.
    </Warning>

    <Steps>
      <Step title="Instal Gemini CLI">
        Perintah lokal `gemini` harus tersedia di `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
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

    ID model Gemini API untuk Gemini 3.1 Pro adalah `gemini-3.1-pro-preview`. OpenClaw menerima bentuk yang lebih pendek `google/gemini-3.1-pro` sebagai alias praktis dan menormalkannya sebelum panggilan penyedia.

    **Variabel lingkungan:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Atau varian `GEMINI_CLI_*`.)

    <Note>
    Jika permintaan OAuth Gemini CLI gagal setelah login, tetapkan `GOOGLE_CLOUD_PROJECT` atau
    `GOOGLE_CLOUD_PROJECT_ID` pada host gateway lalu coba lagi.
    </Note>

    <Note>
    Jika login gagal sebelum alur browser dimulai, pastikan perintah lokal `gemini`
    sudah terinstal dan ada di `PATH`.
    </Note>

    Referensi model `google-gemini-cli/*` adalah alias kompatibilitas lama. Konfigurasi
    baru sebaiknya menggunakan referensi model `google/*` plus runtime `google-gemini-cli`
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

Penyedia pencarian web `gemini` bawaan menggunakan grounding Google Search Gemini.
Konfigurasikan kunci pencarian khusus di bawah `plugins.entries.google.config.webSearch`,
atau biarkan menggunakan ulang `models.providers.google.apiKey` setelah `GEMINI_API_KEY`:

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
ada untuk proxy operator atau endpoint Gemini API yang kompatibel; jika dihilangkan,
pencarian web Gemini menggunakan ulang `models.providers.google.baseUrl`. Lihat
[Pencarian Gemini](/id/tools/gemini-search) untuk perilaku alat khusus penyedia.

<Tip>
Model Gemini 3 menggunakan `thinkingLevel`, bukan `thinkingBudget`. OpenClaw memetakan
kontrol penalaran alias Gemini 3, Gemini 3.1, dan `gemini-*-latest` ke
`thinkingLevel` agar eksekusi default/latensi rendah tidak mengirim nilai
`thinkingBudget` yang dinonaktifkan.

`/think adaptive` mempertahankan semantik berpikir dinamis Google alih-alih memilih
level OpenClaw tetap. Gemini 3 dan Gemini 3.1 menghilangkan `thinkingLevel` tetap agar
Google dapat memilih levelnya; Gemini 2.5 mengirim sentinel dinamis Google
`thinkingBudget: -1`.

Model Gemma 4 (misalnya `gemma-4-26b-a4b-it`) mendukung mode berpikir. OpenClaw
menulis ulang `thinkingBudget` menjadi `thinkingLevel` Google yang didukung untuk Gemma 4.
Mengatur berpikir ke `off` mempertahankan berpikir dalam keadaan nonaktif alih-alih memetakannya ke
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
- Mode: alur teks-ke-video, gambar-ke-video, dan referensi video tunggal
- Mendukung `aspectRatio` (`16:9`, `9:16`) dan `resolution` (`720P`, `1080P`); output audio tidak didukung oleh Veo saat ini
- Durasi yang didukung: **4, 6, atau 8 detik** (nilai lain dibulatkan ke nilai terdekat yang diizinkan)

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
- Format output: `mp3` secara default, plus `wav` pada `google/lyria-3-pro-preview`
- Input referensi: hingga 10 gambar
- Eksekusi berbasis sesi dilepaskan melalui alur tugas/status bersama, termasuk `action: "status"`

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

Penyedia ucapan `google` bawaan menggunakan jalur TTS Gemini API dengan
`gemini-3.1-flash-tts-preview`.

- Suara default: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY`
- Output: WAV untuk lampiran TTS reguler, Opus untuk target catatan suara, PCM untuk Talk/telephony
- Output catatan suara: PCM Google dibungkus sebagai WAV dan ditranskode menjadi Opus 48 kHz dengan `ffmpeg`

Jalur batch Gemini TTS Google mengembalikan audio yang dibuat dalam respons
`generateContent` yang selesai. Untuk percakapan lisan dengan latensi terendah, gunakan
penyedia suara realtime Google yang didukung oleh Gemini Live API, bukan TTS
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

Gemini API TTS menggunakan prompting bahasa alami untuk kontrol gaya. Atur
`audioProfile` untuk menambahkan prompt gaya yang dapat digunakan ulang sebelum teks lisan. Atur
`speakerName` saat teks prompt Anda merujuk ke pembicara bernama.

Gemini API TTS juga menerima tag audio kurung siku yang ekspresif di dalam teks,
seperti `[whispers]` atau `[laughs]`. Agar tag tidak muncul di balasan chat yang terlihat
sambil tetap mengirimkannya ke TTS, letakkan tag di dalam blok `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Kunci API Google Cloud Console yang dibatasi untuk Gemini API valid untuk
penyedia ini. Ini bukan jalur Cloud Text-to-Speech API yang terpisah.
</Note>

## Suara realtime

Plugin `google` bawaan mendaftarkan penyedia suara realtime yang didukung oleh
Gemini Live API untuk bridge audio backend seperti Voice Call dan Google Meet.

| Pengaturan                 | Jalur konfigurasi                                                   | Default                                                                               |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                      | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Suara                      | `...google.voice`                                                   | `Kore`                                                                                |
| Temperature                | `...google.temperature`                                             | (belum diatur)                                                                        |
| Sensitivitas awal VAD      | `...google.startSensitivity`                                        | (belum diatur)                                                                        |
| Sensitivitas akhir VAD     | `...google.endSensitivity`                                          | (belum diatur)                                                                        |
| Durasi hening              | `...google.silenceDurationMs`                                       | (belum diatur)                                                                        |
| Penanganan aktivitas       | `...google.activityHandling`                                        | Default Google, `start-of-activity-interrupts`                                        |
| Cakupan giliran            | `...google.turnCoverage`                                            | Default Google, `only-activity`                                                       |
| Nonaktifkan VAD otomatis   | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Pelanjutan sesi            | `...google.sessionResumption`                                       | `true`                                                                                |
| Kompresi konteks           | `...google.contextWindowCompression`                                | `true`                                                                                |
| Kunci API                  | `...google.apiKey`                                                  | Beralih ke `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY`  |

Contoh konfigurasi realtime Voice Call:

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
                speakerVoice: "Kore",
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
OpenClaw menyesuaikan audio bridge telephony/Meet ke stream PCM Live API Gemini dan
menjaga panggilan tool pada kontrak suara realtime bersama. Biarkan `temperature`
tidak diatur kecuali Anda memerlukan perubahan sampling; OpenClaw menghilangkan nilai
non-positif karena Google Live dapat mengembalikan transkrip tanpa audio untuk `temperature: 0`.
Transkripsi Gemini API diaktifkan tanpa `languageCodes`; SDK Google saat ini
menolak petunjuk kode bahasa pada jalur API ini.
</Note>

<Note>
Control UI Talk mendukung sesi browser Google Live dengan token sekali pakai yang dibatasi.
Penyedia suara realtime khusus backend juga dapat berjalan melalui transport relay
Gateway generik, yang menjaga kredensial penyedia tetap berada di Gateway.
</Note>

Untuk verifikasi live oleh maintainer, jalankan
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Smoke test ini juga mencakup jalur backend/WebRTC OpenAI; bagian Google membuat bentuk
token Live API terbatas yang sama dengan yang digunakan oleh Control UI Talk, membuka endpoint
WebSocket browser, mengirim payload penyiapan awal, dan menunggu
`setupComplete`.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    Untuk eksekusi Gemini API langsung (`api: "google-generative-ai"`), OpenClaw
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

  <Accordion title="Gemini CLI usage notes">
    Saat menggunakan penyedia OAuth `google-gemini-cli`, OpenClaw menggunakan output
    `stream-json` Gemini CLI secara default dan menormalisasi penggunaan dari payload
    `stats` akhir. Override `--output-format json` lama tetap menggunakan
    parser JSON.

    - Teks balasan streaming berasal dari event `message` asisten.
    - Untuk output JSON lama, teks balasan berasal dari field `response` JSON CLI.
    - Penggunaan beralih ke `stats` saat CLI membiarkan `usage` kosong.
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
    Parameter tool gambar bersama dan pemilihan penyedia.
  </Card>
  <Card title="Video generation" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan penyedia.
  </Card>
  <Card title="Music generation" href="/id/tools/music-generation" icon="music">
    Parameter tool musik bersama dan pemilihan penyedia.
  </Card>
</CardGroup>

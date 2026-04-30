---
read_when:
    - Anda ingin menggunakan model Google Gemini dengan OpenClaw
    - Anda memerlukan kunci API atau alur autentikasi OAuth
summary: Penyiapan Google Gemini (kunci API + OAuth, pembuatan gambar, pemahaman media, TTS, pencarian web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-30T10:06:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

Plugin Google menyediakan akses ke model Gemini melalui Google AI Studio, serta
pembuatan gambar, pemahaman media (gambar/audio/video), text-to-speech, dan pencarian web melalui
Gemini Grounding.

- Penyedia: `google`
- Autentikasi: `GEMINI_API_KEY` atau `GOOGLE_API_KEY`
- API: Google Gemini API
- Opsi runtime: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  menggunakan kembali OAuth Gemini CLI sambil mempertahankan referensi model kanonis sebagai `google/*`.

## Memulai

Pilih metode autentikasi pilihan Anda dan ikuti langkah-langkah penyiapannya.

<Tabs>
  <Tab title="API key">
    **Paling cocok untuk:** akses Gemini API standar melalui Google AI Studio.

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
    Variabel lingkungan `GEMINI_API_KEY` dan `GOOGLE_API_KEY` keduanya diterima. Gunakan yang sudah Anda konfigurasi.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Paling cocok untuk:** menggunakan kembali login Gemini CLI yang sudah ada melalui OAuth PKCE, bukan kunci API terpisah.

    <Warning>
    Penyedia `google-gemini-cli` adalah integrasi tidak resmi. Beberapa pengguna
    melaporkan pembatasan akun saat menggunakan OAuth dengan cara ini. Gunakan dengan risiko Anda sendiri.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        Perintah `gemini` lokal harus tersedia di `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw mendukung instalasi Homebrew dan instalasi npm global, termasuk
        tata letak Windows/npm yang umum.
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

    ID model Gemini API untuk Gemini 3.1 Pro adalah `gemini-3.1-pro-preview`. OpenClaw menerima `google/gemini-3.1-pro` yang lebih pendek sebagai alias praktis dan menormalkannya sebelum pemanggilan penyedia.

    **Variabel lingkungan:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Atau varian `GEMINI_CLI_*`.)

    <Note>
    Jika permintaan OAuth Gemini CLI gagal setelah login, tetapkan `GOOGLE_CLOUD_PROJECT` atau
    `GOOGLE_CLOUD_PROJECT_ID` pada host Gateway dan coba lagi.
    </Note>

    <Note>
    Jika login gagal sebelum alur browser dimulai, pastikan perintah `gemini`
    lokal terinstal dan berada di `PATH`.
    </Note>

    Referensi model `google-gemini-cli/*` adalah alias kompatibilitas lama. Konfigurasi
    baru sebaiknya menggunakan referensi model `google/*` ditambah runtime `google-gemini-cli`
    ketika menginginkan eksekusi Gemini CLI lokal.

  </Tab>
</Tabs>

## Kemampuan

| Kemampuan             | Didukung                      |
| ---------------------- | ----------------------------- |
| Penyelesaian chat     | Ya                            |
| Pembuatan gambar      | Ya                            |
| Pembuatan musik       | Ya                            |
| Text-to-speech        | Ya                            |
| Suara realtime        | Ya (Google Live API)          |
| Pemahaman gambar      | Ya                            |
| Transkripsi audio     | Ya                            |
| Pemahaman video       | Ya                            |
| Pencarian web (Grounding) | Ya                         |
| Berpikir/penalaran    | Ya (Gemini 2.5+ / Gemini 3+) |
| Model Gemma 4         | Ya                            |

<Tip>
Model Gemini 3 menggunakan `thinkingLevel`, bukan `thinkingBudget`. OpenClaw memetakan
kontrol penalaran alias Gemini 3, Gemini 3.1, dan `gemini-*-latest` ke
`thinkingLevel` sehingga proses default/latensi rendah tidak mengirim nilai
`thinkingBudget` yang dinonaktifkan.

`/think adaptive` mempertahankan semantik berpikir dinamis Google alih-alih memilih
level OpenClaw tetap. Gemini 3 dan Gemini 3.1 menghilangkan `thinkingLevel` tetap agar
Google dapat memilih levelnya; Gemini 2.5 mengirim sentinel dinamis Google
`thinkingBudget: -1`.

Model Gemma 4 (misalnya `gemma-4-26b-a4b-it`) mendukung mode berpikir. OpenClaw
menulis ulang `thinkingBudget` ke `thinkingLevel` Google yang didukung untuk Gemma 4.
Mengatur berpikir ke `off` mempertahankan berpikir dalam keadaan nonaktif alih-alih memetakannya ke
`MINIMAL`.
</Tip>

## Pembuatan gambar

Penyedia pembuatan gambar `google` bawaan menggunakan default
`google/gemini-3.1-flash-image-preview`.

- Juga mendukung `google/gemini-3-pro-image-preview`
- Hasilkan: hingga 4 gambar per permintaan
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
- Mode: alur text-to-video, image-to-video, dan referensi video tunggal
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
- Proses yang didukung sesi dilepas melalui alur tugas/status bersama, termasuk `action: "status"`

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
- Autentikasi: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY`
- Output: WAV untuk lampiran TTS reguler, Opus untuk target catatan suara, PCM untuk Talk/telefoni
- Output catatan suara: PCM Google dibungkus sebagai WAV dan ditranskode ke Opus 48 kHz dengan `ffmpeg`

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

TTS Gemini API menggunakan prompt bahasa alami untuk kontrol gaya. Tetapkan
`audioProfile` untuk menambahkan prompt gaya yang dapat digunakan kembali sebelum teks yang diucapkan. Tetapkan
`speakerName` ketika teks prompt Anda merujuk ke pembicara bernama.

TTS Gemini API juga menerima tag audio ekspresif dalam tanda kurung siku di teks,
seperti `[whispers]` atau `[laughs]`. Agar tag tidak muncul di balasan chat yang terlihat
sambil tetap mengirimnya ke TTS, letakkan tag di dalam blok `[[tts:text]]...[[/tts:text]]`
:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Kunci API Google Cloud Console yang dibatasi untuk Gemini API valid untuk
penyedia ini. Ini bukan jalur Cloud Text-to-Speech API terpisah.
</Note>

## Suara realtime

Plugin `google` bawaan mendaftarkan penyedia suara realtime yang didukung oleh
Gemini Live API untuk jembatan audio backend seperti Voice Call dan Google Meet.

| Pengaturan            | Jalur konfigurasi                                                  | Default                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Suara                 | `...google.voice`                                                   | `Kore`                                                                                |
| Suhu                  | `...google.temperature`                                             | (tidak ditetapkan)                                                                    |
| Sensitivitas mulai VAD | `...google.startSensitivity`                                       | (tidak ditetapkan)                                                                    |
| Sensitivitas akhir VAD | `...google.endSensitivity`                                         | (tidak ditetapkan)                                                                    |
| Durasi senyap         | `...google.silenceDurationMs`                                       | (tidak ditetapkan)                                                                    |
| Penanganan aktivitas  | `...google.activityHandling`                                        | Default Google, `start-of-activity-interrupts`                                        |
| Cakupan giliran       | `...google.turnCoverage`                                            | Default Google, `only-activity`                                                       |
| Nonaktifkan VAD otomatis | `...google.automaticActivityDetectionDisabled`                   | `false`                                                                               |
| Kunci API             | `...google.apiKey`                                                  | Beralih ke `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY` |

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
OpenClaw menyesuaikan audio bridge telepon/Meet ke stream PCM Live API Gemini dan
mempertahankan panggilan alat pada kontrak suara real-time bersama. Biarkan `temperature`
tidak disetel kecuali Anda memerlukan perubahan sampling; OpenClaw menghilangkan nilai non-positif
karena Google Live dapat mengembalikan transkrip tanpa audio untuk `temperature: 0`.
Transkripsi Gemini API diaktifkan tanpa `languageCodes`; Google
SDK saat ini menolak petunjuk kode bahasa pada jalur API ini.
</Note>

<Note>
Control UI Talk mendukung sesi browser Google Live dengan token sekali pakai
yang dibatasi. Penyedia suara real-time khusus backend juga dapat berjalan melalui transport relay
Gateway generik, yang menjaga kredensial penyedia tetap berada di Gateway.
</Note>

Untuk verifikasi live oleh maintainer, jalankan
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Bagian Google mencetak bentuk token Live API terbatas yang sama dengan yang digunakan oleh Control
UI Talk, membuka endpoint WebSocket browser, mengirim payload penyiapan awal,
dan menunggu `setupComplete`.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penggunaan ulang cache Gemini langsung">
    Untuk eksekusi Gemini API langsung (`api: "google-generative-ai"`), OpenClaw
    meneruskan handle `cachedContent` yang dikonfigurasi ke permintaan Gemini.

    - Konfigurasikan parameter per model atau global dengan
      `cachedContent` atau `cached_content` lama
    - Jika keduanya ada, `cachedContent` menang
    - Contoh nilai: `cachedContents/prebuilt-context`
    - Penggunaan cache-hit Gemini dinormalisasi ke dalam `cacheRead` OpenClaw dari
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

  <Accordion title="Catatan penggunaan JSON Gemini CLI">
    Saat menggunakan penyedia OAuth `google-gemini-cli`, OpenClaw menormalisasi
    keluaran JSON CLI sebagai berikut:

    - Teks balasan berasal dari kolom `response` JSON CLI.
    - Penggunaan fallback ke `stats` ketika CLI membiarkan `usage` kosong.
    - `stats.cached` dinormalisasi ke dalam `cacheRead` OpenClaw.
    - Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Lingkungan dan penyiapan daemon">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `GEMINI_API_KEY`
    tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
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

---
read_when:
    - Anda ingin menggunakan model Google Gemini dengan OpenClaw
    - Anda memerlukan alur autentikasi API key atau OAuth
summary: Penyiapan Google Gemini (API key + OAuth, pembuatan gambar, pemahaman media, TTS, web search)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-26T11:37:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 312c7a5bc433831d98d1d47c42c5cac6a4cd8d4948ddbf16f1ae11aaec7a0339
    source_path: providers/google.md
    workflow: 15
---

Plugin Google menyediakan akses ke model Gemini melalui Google AI Studio, plus
pembuatan gambar, pemahaman media (gambar/audio/video), text-to-speech, dan web search melalui
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` atau `GOOGLE_API_KEY`
- API: Google Gemini API
- Opsi runtime: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  menggunakan ulang OAuth Gemini CLI sambil menjaga ref model tetap kanonis sebagai `google/*`.

## Memulai

Pilih metode auth yang Anda sukai dan ikuti langkah penyiapannya.

<Tabs>
  <Tab title="API key">
    **Terbaik untuk:** akses Gemini API standar melalui Google AI Studio.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Atau berikan key secara langsung:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Setel model default">
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
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Variabel lingkungan `GEMINI_API_KEY` dan `GOOGLE_API_KEY` keduanya diterima. Gunakan mana pun yang sudah Anda konfigurasikan.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Terbaik untuk:** menggunakan ulang login Gemini CLI yang sudah ada melalui PKCE OAuth alih-alih API key terpisah.

    <Warning>
    Provider `google-gemini-cli` adalah integrasi tidak resmi. Beberapa pengguna
    melaporkan pembatasan akun saat menggunakan OAuth dengan cara ini. Gunakan atas risiko Anda sendiri.
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
        layout Windows/npm yang umum.
      </Step>
      <Step title="Login melalui OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Model default: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    **Variabel lingkungan:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Atau varian `GEMINI_CLI_*`.)

    <Note>
    Jika permintaan OAuth Gemini CLI gagal setelah login, setel `GOOGLE_CLOUD_PROJECT` atau
    `GOOGLE_CLOUD_PROJECT_ID` pada host gateway lalu coba lagi.
    </Note>

    <Note>
    Jika login gagal sebelum alur browser dimulai, pastikan perintah lokal `gemini`
    sudah terinstal dan ada di `PATH`.
    </Note>

    Ref model `google-gemini-cli/*` adalah alias kompatibilitas lama. Config
    baru sebaiknya menggunakan ref model `google/*` plus runtime `google-gemini-cli`
    saat menginginkan eksekusi Gemini CLI lokal.

  </Tab>
</Tabs>

## Kapabilitas

| Capability             | Didukung                      |
| ---------------------- | ----------------------------- |
| Penyelesaian chat      | Ya                            |
| Pembuatan gambar       | Ya                            |
| Pembuatan musik        | Ya                            |
| Text-to-speech         | Ya                            |
| Voice realtime         | Ya (Google Live API)          |
| Pemahaman gambar       | Ya                            |
| Transkripsi audio      | Ya                            |
| Pemahaman video        | Ya                            |
| Web search (Grounding) | Ya                            |
| Thinking/reasoning     | Ya (Gemini 2.5+ / Gemini 3+)  |
| Model Gemma 4          | Ya                            |

<Tip>
Model Gemini 3 menggunakan `thinkingLevel` alih-alih `thinkingBudget`. OpenClaw memetakan
kontrol reasoning Gemini 3, Gemini 3.1, dan alias `gemini-*-latest` ke
`thinkingLevel` agar run default/latensi-rendah tidak mengirim nilai
`thinkingBudget` nonaktif.

`/think adaptive` mempertahankan semantik thinking dinamis milik Google alih-alih memilih
level OpenClaw tetap. Gemini 3 dan Gemini 3.1 menghilangkan `thinkingLevel` tetap agar
Google dapat memilih levelnya; Gemini 2.5 mengirim sentinel dinamis Google
`thinkingBudget: -1`.

Model Gemma 4 (misalnya `gemma-4-26b-a4b-it`) mendukung mode thinking. OpenClaw
menulis ulang `thinkingBudget` menjadi `thinkingLevel` Google yang didukung untuk Gemma 4.
Menyetel thinking ke `off` mempertahankan thinking tetap nonaktif alih-alih memetakannya ke
`MINIMAL`.
</Tip>

## Pembuatan gambar

Provider pembuatan gambar `google` bawaan default ke
`google/gemini-3.1-flash-image-preview`.

- Juga mendukung `google/gemini-3-pro-image-preview`
- Generate: hingga 4 gambar per permintaan
- Mode edit: aktif, hingga 5 gambar input
- Kontrol geometri: `size`, `aspectRatio`, dan `resolution`

Untuk menggunakan Google sebagai provider gambar default:

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
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

## Pembuatan video

Plugin `google` bawaan juga mendaftarkan pembuatan video melalui
tool bersama `video_generate`.

- Model video default: `google/veo-3.1-fast-generate-preview`
- Mode: text-to-video, image-to-video, dan alur referensi satu video
- Mendukung `aspectRatio`, `resolution`, dan `audio`
- Clamp durasi saat ini: **4 hingga 8 detik**

Untuk menggunakan Google sebagai provider video default:

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
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

## Pembuatan musik

Plugin `google` bawaan juga mendaftarkan pembuatan musik melalui
tool bersama `music_generate`.

- Model musik default: `google/lyria-3-clip-preview`
- Juga mendukung `google/lyria-3-pro-preview`
- Kontrol prompt: `lyrics` dan `instrumental`
- Format output: `mp3` secara default, plus `wav` pada `google/lyria-3-pro-preview`
- Input referensi: hingga 10 gambar
- Run berbasis sesi dilepas melalui alur task/status bersama, termasuk `action: "status"`

Untuk menggunakan Google sebagai provider musik default:

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
Lihat [Pembuatan Musik](/id/tools/music-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

## Text-to-speech

Provider speech `google` bawaan menggunakan jalur TTS Gemini API dengan
`gemini-3.1-flash-tts-preview`.

- Voice default: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY`
- Output: WAV untuk lampiran TTS biasa, Opus untuk target voice note, PCM untuk Talk/telephony
- Output voice note: PCM Google dibungkus sebagai WAV dan ditranskode ke Opus 48 kHz dengan `ffmpeg`

Untuk menggunakan Google sebagai provider TTS default:

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

TTS Gemini API menggunakan prompting bahasa alami untuk kontrol style. Setel
`audioProfile` untuk menambahkan prompt style yang dapat digunakan ulang sebelum teks
yang diucapkan. Setel `speakerName` saat teks prompt Anda merujuk pada speaker bernama.

TTS Gemini API juga menerima audio tag ekspresif dengan tanda kurung siku dalam teks,
seperti `[whispers]` atau `[laughs]`. Untuk menjaga tag tetap keluar dari balasan chat yang terlihat
sambil mengirimnya ke TTS, taruh di dalam blok `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
API key Google Cloud Console yang dibatasi untuk Gemini API valid untuk
provider ini. Ini bukan jalur Cloud Text-to-Speech API yang terpisah.
</Note>

## Voice realtime

Plugin `google` bawaan mendaftarkan provider voice realtime yang didukung oleh
Gemini Live API untuk bridge audio backend seperti Voice Call dan Google Meet.

| Setting               | Path config                                                          | Default                                                                               |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voice                 | `...google.voice`                                                    | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                              | (tidak disetel)                                                                       |
| Sensitivitas awal VAD | `...google.startSensitivity`                                         | (tidak disetel)                                                                       |
| Sensitivitas akhir VAD| `...google.endSensitivity`                                           | (tidak disetel)                                                                       |
| Durasi hening         | `...google.silenceDurationMs`                                        | (tidak disetel)                                                                       |
| API key               | `...google.apiKey`                                                   | Fallback ke `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY` |

Contoh config realtime Voice Call:

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
Google Live API menggunakan audio dua arah dan function calling melalui WebSocket.
OpenClaw menyesuaikan audio bridge telephony/Meet ke stream PCM Live API Gemini dan
menjaga pemanggilan tool pada kontrak voice realtime bersama. Biarkan `temperature`
tetap tidak disetel kecuali Anda memerlukan perubahan sampling; OpenClaw menghilangkan nilai non-positif
karena Google Live dapat mengembalikan transkrip tanpa audio untuk `temperature: 0`.
Transkripsi Gemini API diaktifkan tanpa `languageCodes`; SDK Google saat ini
menolak petunjuk language-code pada jalur API ini.
</Note>

<Note>
Sesi browser Talk Control UI masih memerlukan provider voice realtime dengan
implementasi sesi WebRTC browser. Saat ini jalur tersebut adalah OpenAI Realtime; provider
Google adalah untuk bridge realtime backend.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penggunaan ulang cache Gemini langsung">
    Untuk run Gemini API langsung (`api: "google-generative-ai"`), OpenClaw
    meneruskan handle `cachedContent` yang dikonfigurasi ke permintaan Gemini.

    - Konfigurasikan parameter per-model atau global dengan
      `cachedContent` atau `cached_content` lama
    - Jika keduanya ada, `cachedContent` yang menang
    - Contoh nilai: `cachedContents/prebuilt-context`
    - Penggunaan cache-hit Gemini dinormalisasi ke OpenClaw `cacheRead` dari
      upstream `cachedContentTokenCount`

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
    Saat menggunakan provider OAuth `google-gemini-cli`, OpenClaw menormalisasi
    output JSON CLI sebagai berikut:

    - Teks balasan berasal dari field `response` JSON CLI.
    - Penggunaan fallback ke `stats` saat CLI membiarkan `usage` kosong.
    - `stats.cached` dinormalisasi ke OpenClaw `cacheRead`.
    - Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Penyiapan lingkungan dan daemon">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `GEMINI_API_KEY`
    tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter tool gambar bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan musik" href="/id/tools/music-generation" icon="music">
    Parameter tool musik bersama dan pemilihan provider.
  </Card>
</CardGroup>

---
read_when:
    - Anda ingin menggunakan model Google Gemini dengan OpenClaw
    - Anda memerlukan kunci API atau alur autentikasi OAuth
summary: Penyiapan Google Gemini (kunci API + OAuth, pembuatan gambar, pemahaman media, TTS, pencarian web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T09:23:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e66c9dd637e26976659d04b9b7e2452e6881945dab6011970f9e1c5e4a9a685
    source_path: providers/google.md
    workflow: 15
---

Plugin Google menyediakan akses ke model Gemini melalui Google AI Studio, plus
pembuatan gambar, pemahaman media (gambar/audio/video), text-to-speech, dan pencarian web melalui
Gemini Grounding.

- Penyedia: `google`
- Autentikasi: `GEMINI_API_KEY` atau `GOOGLE_API_KEY`
- API: Google Gemini API
- Penyedia alternatif: `google-gemini-cli` (OAuth)

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah penyiapannya.

<Tabs>
  <Tab title="Kunci API">
    **Paling cocok untuk:** akses API Gemini standar melalui Google AI Studio.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Atau teruskan kuncinya secara langsung:

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
    Variabel environment `GEMINI_API_KEY` dan `GOOGLE_API_KEY` keduanya diterima. Gunakan mana pun yang sudah Anda konfigurasi.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Paling cocok untuk:** menggunakan kembali login Gemini CLI yang sudah ada melalui PKCE OAuth alih-alih kunci API terpisah.

    <Warning>
    Penyedia `google-gemini-cli` adalah integrasi tidak resmi. Sebagian pengguna
    melaporkan pembatasan akun saat menggunakan OAuth dengan cara ini. Gunakan dengan risiko Anda sendiri.
    </Warning>

    <Steps>
      <Step title="Instal Gemini CLI">
        Perintah `gemini` lokal harus tersedia di `PATH`.

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
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Model default: `google-gemini-cli/gemini-3-flash-preview`
    - Alias: `gemini-cli`

    **Variabel environment:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Atau varian `GEMINI_CLI_*`.)

    <Note>
    Jika permintaan OAuth Gemini CLI gagal setelah login, tetapkan `GOOGLE_CLOUD_PROJECT` atau
    `GOOGLE_CLOUD_PROJECT_ID` pada host gateway lalu coba lagi.
    </Note>

    <Note>
    Jika login gagal sebelum alur browser dimulai, pastikan perintah `gemini`
    lokal terinstal dan ada di `PATH`.
    </Note>

    Penyedia `google-gemini-cli` yang khusus OAuth adalah
    surface inferensi teks yang terpisah. Pembuatan gambar, pemahaman media, dan Gemini Grounding tetap berada pada
    id penyedia `google`.

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
| Thinking/penalaran     | Ya (Gemini 2.5+ / Gemini 3+)  |
| Model Gemma 4          | Ya                            |

<Tip>
Model Gemini 3 menggunakan `thinkingLevel`, bukan `thinkingBudget`. OpenClaw memetakan
kontrol penalaran untuk Gemini 3, Gemini 3.1, dan alias `gemini-*-latest` ke
`thinkingLevel` agar eksekusi default/latensi rendah tidak mengirim nilai
`thinkingBudget` yang dinonaktifkan.

Model Gemma 4 (misalnya `gemma-4-26b-a4b-it`) mendukung mode thinking. OpenClaw
menulis ulang `thinkingBudget` ke `thinkingLevel` Google yang didukung untuk Gemma 4.
Menetapkan thinking ke `off` akan mempertahankan thinking tetap nonaktif alih-alih memetakannya ke
`MINIMAL`.
</Tip>

## Pembuatan gambar

Penyedia pembuatan gambar `google` bawaan secara default menggunakan
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
- Mode: teks-ke-video, gambar-ke-video, dan alur referensi video tunggal
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
- Format output: `mp3` secara default, plus `wav` pada `google/lyria-3-pro-preview`
- Input referensi: hingga 10 gambar
- Eksekusi berbasis sesi dipisahkan melalui alur tugas/status bersama, termasuk `action: "status"`

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

Penyedia speech `google` bawaan menggunakan jalur TTS Gemini API dengan
`gemini-3.1-flash-tts-preview`.

- Suara default: `Kore`
- Autentikasi: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY`
- Output: WAV untuk lampiran TTS biasa, PCM untuk Talk/telefoni
- Output voice note native: tidak didukung pada jalur Gemini API ini karena API mengembalikan PCM, bukan Opus

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
        },
      },
    },
  },
}
```

TTS Gemini API menerima tag audio ekspresif dalam tanda kurung siku di dalam teks, seperti
`[whispers]` atau `[laughs]`. Agar tag tidak muncul dalam balasan chat yang terlihat sambil
tetap mengirimkannya ke TTS, letakkan tag tersebut di dalam blok `[[tts:text]]...[[/tts:text]]`:

```text
Berikut teks balasan yang bersih.

[[tts:text]][whispers] Berikut versi yang diucapkan.[[/tts:text]]
```

<Note>
Kunci API Google Cloud Console yang dibatasi untuk Gemini API valid untuk
penyedia ini. Ini bukan jalur Cloud Text-to-Speech API yang terpisah.
</Note>

## Suara realtime

Plugin `google` bawaan mendaftarkan penyedia suara realtime yang didukung oleh
Gemini Live API untuk bridge audio backend seperti Voice Call dan Google Meet.

| Pengaturan            | Jalur konfigurasi                                                    | Default                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Suara                 | `...google.voice`                                                   | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                             | (tidak diatur)                                                                        |
| Sensitivitas awal VAD | `...google.startSensitivity`                                        | (tidak diatur)                                                                        |
| Sensitivitas akhir VAD| `...google.endSensitivity`                                          | (tidak diatur)                                                                        |
| Durasi hening         | `...google.silenceDurationMs`                                       | (tidak diatur)                                                                        |
| Kunci API             | `...google.apiKey`                                                  | Kembali ke `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY` |

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
OpenClaw menyesuaikan audio bridge telefoni/Meet ke stream PCM Live API milik Gemini dan
mempertahankan pemanggilan alat pada kontrak suara realtime bersama. Biarkan `temperature`
tidak diatur kecuali Anda memerlukan perubahan sampling; OpenClaw menghilangkan nilai yang tidak positif
karena Google Live dapat mengembalikan transkrip tanpa audio untuk `temperature: 0`.
Transkripsi Gemini API diaktifkan tanpa `languageCodes`; SDK Google saat ini
menolak petunjuk kode bahasa pada jalur API ini.
</Note>

<Note>
Sesi browser Talk pada UI kontrol tetap memerlukan penyedia suara realtime dengan
implementasi sesi WebRTC browser. Saat ini jalur tersebut adalah OpenAI Realtime; penyedia
Google adalah untuk bridge realtime backend.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penggunaan ulang cache Gemini langsung">
    Untuk eksekusi Gemini API langsung (`api: "google-generative-ai"`), OpenClaw
    meneruskan handle `cachedContent` yang dikonfigurasi ke permintaan Gemini.

    - Konfigurasikan parameter per model atau global dengan
      `cachedContent` atau `cached_content` lama
    - Jika keduanya ada, `cachedContent` yang menang
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

  <Accordion title="Catatan penggunaan JSON Gemini CLI">
    Saat menggunakan penyedia OAuth `google-gemini-cli`, OpenClaw menormalkan
    output JSON CLI sebagai berikut:

    - Teks balasan berasal dari field JSON CLI `response`.
    - Penggunaan akan kembali ke `stats` saat CLI membiarkan `usage` kosong.
    - `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.
    - Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Penyiapan environment dan daemon">
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

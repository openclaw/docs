---
read_when:
    - Anda ingin menggunakan model Google Gemini dengan OpenClaw
    - Anda memerlukan alur auth API key atau OAuth
summary: Penyiapan Google Gemini (API key + OAuth, pembuatan gambar, pemahaman media, pencarian web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-08T02:16:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9e558f5ce35c853e0240350be9a1890460c5f7f7fd30b05813a656497dee516
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Plugin Google menyediakan akses ke model Gemini melalui Google AI Studio, serta
pembuatan gambar, pemahaman media (gambar/audio/video), dan pencarian web melalui
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` atau `GOOGLE_API_KEY`
- API: Google Gemini API
- Provider alternatif: `google-gemini-cli` (OAuth)

## Mulai cepat

1. Setel API key:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Setel model default:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Contoh non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth (Gemini CLI)

Provider alternatif `google-gemini-cli` menggunakan PKCE OAuth alih-alih API
key. Ini adalah integrasi tidak resmi; beberapa pengguna melaporkan adanya
pembatasan akun. Gunakan dengan risiko Anda sendiri.

- Model default: `google-gemini-cli/gemini-3-flash-preview`
- Alias: `gemini-cli`
- Prasyarat instalasi: Gemini CLI lokal tersedia sebagai `gemini`
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- Login:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

Environment variables:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Atau varian `GEMINI_CLI_*`.)

Jika permintaan OAuth Gemini CLI gagal setelah login, setel
`GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host gateway lalu
coba lagi.

Jika login gagal sebelum alur browser dimulai, pastikan perintah `gemini` lokal
sudah terinstal dan ada di `PATH`. OpenClaw mendukung instalasi Homebrew maupun
instalasi npm global, termasuk tata letak umum Windows/npm.

Catatan penggunaan JSON Gemini CLI:

- Teks balasan berasal dari field JSON CLI `response`.
- Penggunaan akan fallback ke `stats` saat CLI membiarkan `usage` kosong.
- `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

## Kapabilitas

| Kapabilitas           | Didukung          |
| --------------------- | ----------------- |
| Chat completions      | Ya                |
| Pembuatan gambar      | Ya                |
| Pembuatan musik       | Ya                |
| Pemahaman gambar      | Ya                |
| Transkripsi audio     | Ya                |
| Pemahaman video       | Ya                |
| Pencarian web (Grounding) | Ya           |
| Thinking/reasoning    | Ya (Gemini 3.1+)  |

## Penggunaan ulang cache Gemini langsung

Untuk eksekusi API Gemini langsung (`api: "google-generative-ai"`), OpenClaw kini
meneruskan handle `cachedContent` yang dikonfigurasi ke permintaan Gemini.

- Konfigurasikan params per-model atau global dengan salah satu
  `cachedContent` atau `cached_content` lama
- Jika keduanya ada, `cachedContent` yang dipakai
- Contoh nilai: `cachedContents/prebuilt-context`
- Penggunaan cache-hit Gemini dinormalisasi menjadi OpenClaw `cacheRead` dari
  upstream `cachedContentTokenCount`

Contoh:

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

## Pembuatan gambar

Provider pembuatan gambar `google` yang dibundel default-nya adalah
`google/gemini-3.1-flash-image-preview`.

- Juga mendukung `google/gemini-3-pro-image-preview`
- Generate: hingga 4 gambar per permintaan
- Mode edit: diaktifkan, hingga 5 gambar input
- Kontrol geometri: `size`, `aspectRatio`, dan `resolution`

Provider `google-gemini-cli` yang hanya OAuth adalah permukaan inferensi teks
yang terpisah. Pembuatan gambar, pemahaman media, dan Gemini Grounding tetap berada pada
ID provider `google`.

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

Lihat [Image Generation](/id/tools/image-generation) untuk parameter tool bersama,
pemilihan provider, dan perilaku failover.

## Pembuatan video

Plugin `google` yang dibundel juga mendaftarkan pembuatan video melalui tool bersama
`video_generate`.

- Model video default: `google/veo-3.1-fast-generate-preview`
- Mode: text-to-video, image-to-video, dan alur referensi video tunggal
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

Lihat [Video Generation](/id/tools/video-generation) untuk parameter tool bersama,
pemilihan provider, dan perilaku failover.

## Pembuatan musik

Plugin `google` yang dibundel juga mendaftarkan pembuatan musik melalui tool bersama
`music_generate`.

- Model musik default: `google/lyria-3-clip-preview`
- Juga mendukung `google/lyria-3-pro-preview`
- Kontrol prompt: `lyrics` dan `instrumental`
- Format output: `mp3` secara default, serta `wav` pada `google/lyria-3-pro-preview`
- Input referensi: hingga 10 gambar
- Eksekusi berbasis sesi dipisahkan melalui alur task/status bersama, termasuk `action: "status"`

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

Lihat [Music Generation](/id/tools/music-generation) untuk parameter tool bersama,
pemilihan provider, dan perilaku failover.

## Catatan environment

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `GEMINI_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).

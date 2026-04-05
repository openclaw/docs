---
read_when:
    - Anda ingin menggunakan model Google Gemini dengan OpenClaw
    - Anda memerlukan alur auth API key atau OAuth
summary: Penyiapan Google Gemini (API key + OAuth, pembuatan gambar, pemahaman media, pencarian web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-05T14:03:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa3c4326e83fad277ae4c2cb9501b6e89457afcfa7e3e1d57ae01c9c0c6846e2
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Plugin Google menyediakan akses ke model Gemini melalui Google AI Studio, plus
pembuatan gambar, pemahaman media (gambar/audio/video), dan pencarian web melalui
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` atau `GOOGLE_API_KEY`
- API: Google Gemini API
- Provider alternatif: `google-gemini-cli` (OAuth)

## Mulai cepat

1. Set API key:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Set model default:

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
key. Ini adalah integrasi tidak resmi; beberapa pengguna melaporkan pembatasan
akun. Gunakan dengan risiko Anda sendiri.

- Model default: `google-gemini-cli/gemini-3.1-pro-preview`
- Alias: `gemini-cli`
- Prasyarat instalasi: Gemini CLI lokal tersedia sebagai `gemini`
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- Login:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

Environment variable:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Atau varian `GEMINI_CLI_*`.)

Jika permintaan Gemini CLI OAuth gagal setelah login, set
`GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` di gateway host lalu
coba lagi.

Jika login gagal sebelum alur browser dimulai, pastikan perintah `gemini`
lokal terinstal dan ada di `PATH`. OpenClaw mendukung instalasi Homebrew
dan instalasi npm global, termasuk layout Windows/npm yang umum.

Catatan penggunaan JSON Gemini CLI:

- Teks balasan berasal dari field `response` JSON CLI.
- Usage menggunakan fallback ke `stats` saat CLI membiarkan `usage` kosong.
- `stats.cached` dinormalisasi ke `cacheRead` OpenClaw.
- Jika `stats.input` hilang, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

## Kapabilitas

| Kapabilitas            | Didukung           |
| ---------------------- | ------------------ |
| Chat completions       | Ya                 |
| Pembuatan gambar       | Ya                 |
| Pemahaman gambar       | Ya                 |
| Transkripsi audio      | Ya                 |
| Pemahaman video        | Ya                 |
| Pencarian web (Grounding) | Ya              |
| Thinking/reasoning     | Ya (Gemini 3.1+)   |

## Penggunaan ulang cache Gemini langsung

Untuk eksekusi Gemini API langsung (`api: "google-generative-ai"`), OpenClaw kini
meneruskan handle `cachedContent` yang dikonfigurasi ke permintaan Gemini.

- Konfigurasikan params per-model atau global dengan salah satu dari
  `cachedContent` atau `cached_content` legacy
- Jika keduanya ada, `cachedContent` yang menang
- Contoh nilai: `cachedContents/prebuilt-context`
- Penggunaan cache-hit Gemini dinormalisasi ke `cacheRead` OpenClaw dari
  `cachedContentTokenCount` upstream

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

Provider pembuatan gambar bundled `google` menggunakan default
`google/gemini-3.1-flash-image-preview`.

- Juga mendukung `google/gemini-3-pro-image-preview`
- Generate: hingga 4 gambar per permintaan
- Mode edit: diaktifkan, hingga 5 gambar input
- Kontrol geometri: `size`, `aspectRatio`, dan `resolution`

Provider `google-gemini-cli` yang hanya OAuth adalah permukaan
inferensi teks yang terpisah. Pembuatan gambar, pemahaman media, dan Gemini Grounding tetap berada di
id provider `google`.

## Catatan environment

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `GEMINI_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).

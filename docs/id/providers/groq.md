---
read_when:
    - Anda ingin menggunakan Groq dengan OpenClaw
    - Anda memerlukan variabel lingkungan API key atau pilihan auth CLI
summary: Penyiapan Groq (auth + pemilihan model)
title: Groq
x-i18n:
    generated_at: "2026-04-05T14:03:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e27532cafcdaf1ac336fa310e08e4e3245d2d0eb0e94e0bcf42c532c6a9a80b
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) menyediakan inferensi supercepat pada model open-source
(Llama, Gemma, Mistral, dan lainnya) menggunakan perangkat keras LPU kustom. OpenClaw terhubung
ke Groq melalui API yang kompatibel dengan OpenAI.

- Provider: `groq`
- Auth: `GROQ_API_KEY`
- API: kompatibel dengan OpenAI

## Mulai cepat

1. Dapatkan API key dari [console.groq.com/keys](https://console.groq.com/keys).

2. Setel API key:

```bash
export GROQ_API_KEY="gsk_..."
```

3. Setel model default:

```json5
{
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Contoh file config

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Transkripsi audio

Groq juga menyediakan transkripsi audio cepat berbasis Whisper. Saat dikonfigurasi sebagai
provider media-understanding, OpenClaw menggunakan model `whisper-large-v3-turbo`
milik Groq untuk mentranskripsikan pesan suara melalui permukaan bersama `tools.media.audio`.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

## Catatan lingkungan

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `GROQ_API_KEY` tersedia
untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).

## Catatan audio

- Jalur config bersama: `tools.media.audio`
- Base URL audio Groq default: `https://api.groq.com/openai/v1`
- Model audio Groq default: `whisper-large-v3-turbo`
- Transkripsi audio Groq menggunakan jalur `/audio/transcriptions` yang
  kompatibel dengan OpenAI

## Model yang tersedia

Katalog model Groq sering berubah. Jalankan `openclaw models list | grep groq`
untuk melihat model yang saat ini tersedia, atau periksa
[console.groq.com/docs/models](https://console.groq.com/docs/models).

Pilihan populer meliputi:

- **Llama 3.3 70B Versatile** - tujuan umum, konteks besar
- **Llama 3.1 8B Instant** - cepat, ringan
- **Gemma 2 9B** - ringkas, efisien
- **Mixtral 8x7B** - arsitektur MoE, reasoning kuat

## Tautan

- [Groq Console](https://console.groq.com)
- [Dokumentasi API](https://console.groq.com/docs)
- [Daftar Model](https://console.groq.com/docs/models)
- [Harga](https://groq.com/pricing)

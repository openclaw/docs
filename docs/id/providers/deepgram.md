---
read_when:
    - Anda ingin speech-to-text Deepgram untuk lampiran audio
    - Anda memerlukan contoh konfigurasi Deepgram yang cepat
summary: Transkripsi Deepgram untuk catatan suara masuk
title: Deepgram
x-i18n:
    generated_at: "2026-04-05T14:03:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: dabd1f6942c339fbd744fbf38040b6a663b06ddf4d9c9ee31e3ac034de9e79d9
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Transkripsi Audio)

Deepgram adalah API speech-to-text. Di OpenClaw, Deepgram digunakan untuk **transkripsi audio/catatan suara masuk**
melalui `tools.media.audio`.

Saat diaktifkan, OpenClaw mengunggah file audio ke Deepgram dan menyuntikkan transkrip
ke pipeline balasan (`{{Transcript}}` + blok `[Audio]`). Ini **bukan streaming**;
ini menggunakan endpoint transkripsi pra-rekam.

Situs web: [https://deepgram.com](https://deepgram.com)  
Dokumentasi: [https://developers.deepgram.com](https://developers.deepgram.com)

## Mulai cepat

1. Setel kunci API Anda:

```
DEEPGRAM_API_KEY=dg_...
```

2. Aktifkan provider:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Opsi

- `model`: ID model Deepgram (default: `nova-3`)
- `language`: petunjuk bahasa (opsional)
- `tools.media.audio.providerOptions.deepgram.detect_language`: aktifkan deteksi bahasa (opsional)
- `tools.media.audio.providerOptions.deepgram.punctuate`: aktifkan tanda baca (opsional)
- `tools.media.audio.providerOptions.deepgram.smart_format`: aktifkan pemformatan cerdas (opsional)

Contoh dengan bahasa:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
      },
    },
  },
}
```

Contoh dengan opsi Deepgram:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        providerOptions: {
          deepgram: {
            detect_language: true,
            punctuate: true,
            smart_format: true,
          },
        },
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Catatan

- Autentikasi mengikuti urutan auth provider standar; `DEEPGRAM_API_KEY` adalah jalur paling sederhana.
- Override endpoint atau header dengan `tools.media.audio.baseUrl` dan `tools.media.audio.headers` saat menggunakan proxy.
- Output mengikuti aturan audio yang sama seperti provider lain (batas ukuran, timeout, penyuntikan transkrip).

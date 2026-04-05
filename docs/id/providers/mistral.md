---
read_when:
    - Anda ingin menggunakan model Mistral di OpenClaw
    - Anda memerlukan onboarding API key Mistral dan ref model
summary: Gunakan model Mistral dan transkripsi Voxtral dengan OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-05T14:03:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f61b9e0656dd7e0243861ddf14b1b41a07c38bff27cef9ad0815d14c8e34408
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw mendukung Mistral untuk perutean model teks/gambar (`mistral/...`) dan
transkripsi audio melalui Voxtral dalam media understanding.
Mistral juga dapat digunakan untuk memory embeddings (`memorySearch.provider = "mistral"`).

## Setup CLI

```bash
openclaw onboard --auth-choice mistral-api-key
# atau non-interaktif
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Cuplikan konfigurasi (provider LLM)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Katalog LLM bawaan

OpenClaw saat ini menyertakan katalog Mistral bawaan berikut:

| Ref model                        | Input       | Konteks | Output maks | Catatan                  |
| -------------------------------- | ----------- | ------- | ----------- | ------------------------ |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384      | Model default            |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192       | Mistral Medium 3.1       |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384      | Model multimodal lebih kecil |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768      | Pixtral                  |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096       | Coding                   |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768      | Devstral 2               |
| `mistral/magistral-small`        | text        | 128,000 | 40,000      | Mendukung reasoning      |

## Cuplikan konfigurasi (transkripsi audio dengan Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## Catatan

- Auth Mistral menggunakan `MISTRAL_API_KEY`.
- URL dasar provider default ke `https://api.mistral.ai/v1`.
- Model default onboarding adalah `mistral/mistral-large-latest`.
- Model audio default media-understanding untuk Mistral adalah `voxtral-mini-latest`.
- Jalur transkripsi media menggunakan `/v1/audio/transcriptions`.
- Jalur memory embeddings menggunakan `/v1/embeddings` (model default: `mistral-embed`).

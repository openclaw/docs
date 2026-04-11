---
read_when:
    - Anda ingin menggunakan pembuatan gambar fal di OpenClaw
    - Anda memerlukan alur autentikasi `FAL_KEY`
    - Anda ingin default fal untuk `image_generate` atau `video_generate`
summary: setup pembuatan gambar dan video fal di OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-11T02:47:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9bfe4f69124e922a79a516a1bd78f0c00f7a45f3c6f68b6d39e0d196fa01beb3
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw menyertakan provider `fal` bawaan untuk pembuatan gambar dan video terhosting.

- Provider: `fal`
- Auth: `FAL_KEY` (kanonis; `FAL_API_KEY` juga berfungsi sebagai fallback)
- API: endpoint model fal

## Mulai cepat

1. Setel API key:

```bash
openclaw onboard --auth-choice fal-api-key
```

2. Setel model gambar default:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Pembuatan gambar

Provider pembuatan gambar `fal` bawaan menggunakan default
`fal/fal-ai/flux/dev`.

- Hasilkan: hingga 4 gambar per permintaan
- Mode edit: diaktifkan, 1 gambar referensi
- Mendukung `size`, `aspectRatio`, dan `resolution`
- Keterbatasan edit saat ini: endpoint edit gambar fal **tidak** mendukung
  override `aspectRatio`

Untuk menggunakan fal sebagai provider gambar default:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Pembuatan video

Provider pembuatan video `fal` bawaan menggunakan default
`fal/fal-ai/minimax/video-01-live`.

- Mode: text-to-video dan alur satu gambar referensi
- Runtime: alur submit/status/result berbasis antrean untuk job yang berjalan lama
- Referensi model agen video HeyGen:
  - `fal/fal-ai/heygen/v2/video-agent`
- Referensi model Seedance 2.0:
  - `fal/bytedance/seedance-2.0/fast/text-to-video`
  - `fal/bytedance/seedance-2.0/fast/image-to-video`
  - `fal/bytedance/seedance-2.0/text-to-video`
  - `fal/bytedance/seedance-2.0/image-to-video`

Untuk menggunakan Seedance 2.0 sebagai model video default:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
      },
    },
  },
}
```

Untuk menggunakan agen video HeyGen sebagai model video default:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/heygen/v2/video-agent",
      },
    },
  },
}
```

## Terkait

- [Image Generation](/id/tools/image-generation)
- [Video Generation](/id/tools/video-generation)
- [Configuration Reference](/id/gateway/configuration-reference#agent-defaults)

---
read_when:
    - OpenClaw'da fal image generation kullanmak istiyorsunuz
    - '`FAL_KEY` kimlik doğrulama akışına ihtiyacınız var'
    - '`image_generate` veya `video_generate` için fal varsayılanlarını istiyorsunuz'
summary: OpenClaw'da fal image ve video generation kurulumu
title: fal
x-i18n:
    generated_at: "2026-04-11T02:47:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9bfe4f69124e922a79a516a1bd78f0c00f7a45f3c6f68b6d39e0d196fa01beb3
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw, barındırılan image ve video generation için bundled bir `fal` sağlayıcısıyla gelir.

- Sağlayıcı: `fal`
- Kimlik doğrulama: `FAL_KEY` (kanonik; `FAL_API_KEY` fallback olarak da çalışır)
- API: fal model endpoint'leri

## Hızlı başlangıç

1. API anahtarını ayarlayın:

```bash
openclaw onboard --auth-choice fal-api-key
```

2. Varsayılan bir image modeli ayarlayın:

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

## Image generation

Bundled `fal` image-generation sağlayıcısının varsayılanı
`fal/fal-ai/flux/dev` değeridir.

- Oluşturma: istek başına en fazla 4 görsel
- Düzenleme modu: etkin, 1 referans görsel
- `size`, `aspectRatio` ve `resolution` desteklenir
- Güncel düzenleme kısıtı: fal image edit endpoint'i `aspectRatio` geçersiz kılmalarını desteklemez

fal'ı varsayılan image sağlayıcısı olarak kullanmak için:

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

## Video generation

Bundled `fal` video-generation sağlayıcısının varsayılanı
`fal/fal-ai/minimax/video-01-live` değeridir.

- Modlar: text-to-video ve tek görsel referans akışları
- Çalışma zamanı: uzun süren işler için kuyruk destekli submit/status/result akışı
- HeyGen video-agent model başvurusu:
  - `fal/fal-ai/heygen/v2/video-agent`
- Seedance 2.0 model başvuruları:
  - `fal/bytedance/seedance-2.0/fast/text-to-video`
  - `fal/bytedance/seedance-2.0/fast/image-to-video`
  - `fal/bytedance/seedance-2.0/text-to-video`
  - `fal/bytedance/seedance-2.0/image-to-video`

Seedance 2.0'ı varsayılan video modeli olarak kullanmak için:

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

HeyGen video-agent'ı varsayılan video modeli olarak kullanmak için:

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

## İlgili

- [Image Generation](/tr/tools/image-generation)
- [Video Generation](/tr/tools/video-generation)
- [Configuration Reference](/tr/gateway/configuration-reference#agent-defaults)

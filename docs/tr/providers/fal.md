---
read_when:
    - OpenClaw'da fal görüntü üretimini kullanmak istiyorsunuz
    - '`FAL_KEY` kimlik doğrulama akışına ihtiyacınız var'
    - '`image_generate` veya `video_generate` için fal varsayılanlarını istiyorsunuz'
summary: OpenClaw'da fal görüntü ve video üretimi kurulumu
title: fal
x-i18n:
    generated_at: "2026-04-12T23:30:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff275233179b4808d625383efe04189ad9e92af09944ba39f1e953e77378e347
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw, barındırılan görüntü ve video üretimi için paketlenmiş bir `fal` sağlayıcısıyla gelir.

| Özellik | Değer                                                        |
| ------- | ------------------------------------------------------------ |
| Sağlayıcı | `fal`                                                      |
| Kimlik doğrulama | `FAL_KEY` (kanonik; `FAL_API_KEY` de yedek olarak çalışır) |
| API     | fal model uç noktaları                                       |

## Başlangıç

<Steps>
  <Step title="API anahtarını ayarlayın">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Varsayılan bir görüntü modeli ayarlayın">
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
  </Step>
</Steps>

## Görüntü üretimi

Paketlenmiş `fal` görüntü üretimi sağlayıcısı varsayılan olarak
`fal/fal-ai/flux/dev` kullanır.

| Yetenek        | Değer                     |
| -------------- | ------------------------- |
| Azami görüntü sayısı | İstek başına 4            |
| Düzenleme modu | Etkin, 1 referans görüntü |
| Boyut geçersiz kılmaları | Desteklenir               |
| En-boy oranı   | Desteklenir               |
| Çözünürlük     | Desteklenir               |

<Warning>
fal görüntü düzenleme uç noktası `aspectRatio` geçersiz kılmalarını **desteklemez**.
</Warning>

fal'ı varsayılan görüntü sağlayıcısı olarak kullanmak için:

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

## Video üretimi

Paketlenmiş `fal` video üretimi sağlayıcısı varsayılan olarak
`fal/fal-ai/minimax/video-01-live` kullanır.

| Yetenek | Değer                                                        |
| ------- | ------------------------------------------------------------ |
| Modlar  | Metinden videoya, tek görüntü referansı                      |
| Çalışma zamanı | Uzun süren işler için kuyruk destekli gönderim/durum/sonuç akışı |

<AccordionGroup>
  <Accordion title="Kullanılabilir video modelleri">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 yapılandırma örneği">
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
  </Accordion>

  <Accordion title="HeyGen video-agent yapılandırma örneği">
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
  </Accordion>
</AccordionGroup>

<Tip>
Yakın zamanda eklenen girdiler dahil, kullanılabilir fal modellerinin tam listesini görmek için `openclaw models list --provider fal` kullanın.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Görüntü üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference#agent-defaults" icon="gear">
    Görüntü ve video model seçimi dahil ajan varsayılanları.
  </Card>
</CardGroup>

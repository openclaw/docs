---
read_when:
    - OpenClaw'ta fal görsel üretimini kullanmak istiyorsunuz
    - '`FAL_KEY` kimlik doğrulama akışına ihtiyacınız var'
    - '`image_generate` veya `video_generate` için fal varsayılanlarını istiyorsunuz'
summary: OpenClaw'ta fal görsel ve video üretimi kurulumu
title: Fal
x-i18n:
    generated_at: "2026-04-24T09:25:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw, barındırılan görsel ve video üretimi için paketlenmiş bir `fal` sağlayıcısıyla gelir.

| Özellik | Değer                                                         |
| -------- | ------------------------------------------------------------- |
| Sağlayıcı | `fal`                                                        |
| Kimlik doğrulama | `FAL_KEY` (kanonik; `FAL_API_KEY` de geri dönüş olarak çalışır) |
| API      | fal model uç noktaları                                        |

## Başlangıç

<Steps>
  <Step title="API anahtarını ayarlayın">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Varsayılan bir görsel modeli ayarlayın">
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

## Görsel üretimi

Paketlenmiş `fal` görsel üretimi sağlayıcısının varsayılanı
`fal/fal-ai/flux/dev` modelidir.

| Yetenek        | Değer                      |
| -------------- | -------------------------- |
| En fazla görsel | İstek başına 4            |
| Düzenleme modu | Etkin, 1 referans görsel   |
| Boyut geçersiz kılmaları | Desteklenir       |
| En-boy oranı   | Desteklenir                |
| Çözünürlük     | Desteklenir                |

<Warning>
fal görsel düzenleme uç noktası `aspectRatio` geçersiz kılmalarını **desteklemez**.
</Warning>

fal'ı varsayılan görsel sağlayıcısı olarak kullanmak için:

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

Paketlenmiş `fal` video üretimi sağlayıcısının varsayılanı
`fal/fal-ai/minimax/video-01-live` modelidir.

| Yetenek | Değer                                                        |
| ------- | ------------------------------------------------------------ |
| Modlar  | Metinden videoya, tek görsel referansı                       |
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
Yakın zamanda eklenen girdiler de dâhil olmak üzere kullanılabilir fal
modellerinin tam listesini görmek için `openclaw models list --provider fal` kullanın.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Görsel ve video model seçimi dâhil agent varsayılanları.
  </Card>
</CardGroup>

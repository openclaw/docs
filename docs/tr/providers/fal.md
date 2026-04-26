---
read_when:
    - OpenClaw'da fal görsel üretimini kullanmak istiyorsunuz.
    - '`FAL_KEY` auth akışına ihtiyacınız var.'
    - '`image_generate` veya `video_generate` için fal varsayılanlarını istiyorsunuz.'
summary: OpenClaw'da fal görsel ve video üretimi kurulumu
title: Fal
x-i18n:
    generated_at: "2026-04-26T11:38:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw, barındırılan görsel ve video üretimi için paketlenmiş bir `fal` sağlayıcısıyla gelir.

| Özellik   | Değer                                                         |
| --------- | ------------------------------------------------------------- |
| Sağlayıcı | `fal`                                                         |
| Auth      | `FAL_KEY` (kanonik; `FAL_API_KEY` de geri dönüş olarak çalışır) |
| API       | fal model uç noktaları                                        |

## Başlarken

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

Paketlenmiş `fal` görsel üretimi sağlayıcısı varsayılan olarak
`fal/fal-ai/flux/dev` kullanır.

| Yetenek          | Değer                     |
| ---------------- | ------------------------- |
| En fazla görsel  | İstek başına 4            |
| Düzenleme modu   | Etkin, 1 referans görsel  |
| Boyut geçersiz kılmaları | Desteklenir         |
| En-boy oranı     | Desteklenir               |
| Çözünürlük       | Desteklenir               |
| Çıktı biçimi     | `png` veya `jpeg`         |

<Warning>
fal görsel düzenleme uç noktası `aspectRatio` geçersiz kılmalarını desteklemez.
</Warning>

PNG çıktısı istediğinizde `outputFormat: "png"` kullanın. fal, OpenClaw içinde açık bir
şeffaf arka plan denetimi bildirmez; bu nedenle `background:
"transparent"` fal modelleri için yok sayılan bir geçersiz kılma olarak bildirilir.

fal'ı varsayılan görsel sağlayıcı olarak kullanmak için:

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

| Yetenek | Değer                                                                |
| ------- | -------------------------------------------------------------------- |
| Modlar  | Metinden videoya, tek görsel referansı, Seedance referansla videoya  |
| Çalışma zamanı | Uzun süren işler için kuyruk destekli gönderim/durum/sonuç akışı |

<AccordionGroup>
  <Accordion title="Kullanılabilir video modelleri">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

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

  <Accordion title="Seedance 2.0 referansla videoya yapılandırma örneği">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    Referansla videoya, paylaşılan `video_generate` `images`, `videos` ve `audioRefs`
    parametreleri üzerinden en fazla 9 görsel, 3 video ve 3 ses referansı kabul eder; toplam referans dosyası sayısı en fazla 12 olabilir.

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
Sonradan eklenen girdiler dahil mevcut tüm fal
modellerinin tam listesini görmek için `openclaw models list --provider fal` kullanın.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Görsel ve video model seçimi dahil ajan varsayılanları.
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw'da fal görüntü oluşturmayı kullanmak istiyorsunuz
    - FAL_KEY kimlik doğrulama akışına ihtiyacınız var
    - image_generate veya video_generate için fal varsayılanlarını istiyorsunuz
summary: OpenClaw'da fal görüntü ve video oluşturma kurulumu
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:35:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw, barındırılan görüntü ve video üretimi için yerleşik bir `fal` sağlayıcısıyla gelir.

| Özellik | Değer                                                         |
| -------- | ------------------------------------------------------------- |
| Sağlayıcı | `fal`                                                         |
| Kimlik doğrulama     | `FAL_KEY` (kanonik; `FAL_API_KEY` yedek olarak da çalışır) |
| API      | fal model uç noktaları                                           |

## Başlarken

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

Yerleşik `fal` görüntü üretimi sağlayıcısının varsayılanı
`fal/fal-ai/flux/dev` olur.

| Yetenek     | Değer                                                       |
| -------------- | ----------------------------------------------------------- |
| Maksimum görüntü     | İstek başına 4                                               |
| Düzenleme modu      | Flux: 1 referans görüntü; GPT Image 2: 10; Nano Banana 2: 14 |
| Boyut geçersiz kılmaları | Desteklenir                                                   |
| En boy oranı   | Üretme ve GPT Image 2/Nano Banana 2 düzenleme için desteklenir   |
| Çözünürlük     | Desteklenir                                                   |
| Çıktı biçimi  | `png` veya `jpeg`                                             |

<Warning>
Flux görüntüden görüntüye istekleri `aspectRatio` geçersiz kılmalarını **desteklemez**. GPT
Image 2 ve Nano Banana 2 düzenleme istekleri fal'in `/edit` uç noktasını kullanır ve
en boy oranı ipuçlarını kabul eder.
</Warning>

PNG çıktısı istediğinizde `outputFormat: "png"` kullanın. fal, OpenClaw içinde
açık bir saydam arka plan denetimi bildirmez; bu nedenle `background:
"transparent"` fal modelleri için yok sayılan bir geçersiz kılma olarak raporlanır.

fal'i varsayılan görüntü sağlayıcısı olarak kullanmak için:

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

Yerleşik `fal` video üretimi sağlayıcısının varsayılanı
`fal/fal-ai/minimax/video-01-live` olur.

| Yetenek | Değer                                                              |
| ---------- | ------------------------------------------------------------------ |
| Modlar      | Metinden videoya, tek görüntü referansı, Seedance referanstan videoya |
| Çalışma zamanı    | Uzun süren işler için kuyruk destekli gönderme/durum/sonuç akışı       |

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

  <Accordion title="Seedance 2.0 referanstan videoya yapılandırma örneği">
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

    Referanstan videoya, paylaşılan `video_generate` `images`, `videos` ve `audioRefs`
    parametreleri aracılığıyla en fazla 9 görüntü, 3 video ve 3 ses referansı kabul eder;
    toplamda en fazla 12 referans dosyası olabilir.

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
Son eklenen girişler dahil kullanılabilir fal modellerinin tam listesini görmek için
`openclaw models list --provider fal` kullanın.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Görüntü üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Görüntü ve video modeli seçimi dahil aracı varsayılanları.
  </Card>
</CardGroup>

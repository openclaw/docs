---
read_when:
    - OpenClaw'da fal görüntü üretimini kullanmak istiyorsunuz
    - FAL_KEY kimlik doğrulama akışına ihtiyacınız var
    - image_generate, video_generate veya music_generate için fal varsayılanlarını istiyorsunuz
summary: OpenClaw’da fal görsel, video ve müzik oluşturma kurulumu
title: Fal
x-i18n:
    generated_at: "2026-06-28T01:10:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw, barındırılan görsel, video ve müzik oluşturma için birlikte gelen bir `fal`
sağlayıcısıyla gelir.

| Özellik | Değer                                                               |
| ------- | ------------------------------------------------------------------- |
| Sağlayıcı | `fal`                                                             |
| Kimlik doğrulama | `FAL_KEY` (kanonik; `FAL_API_KEY` geri dönüş olarak da çalışır) |
| API     | fal model uç noktaları                                              |

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

## Görsel oluşturma

Birlikte gelen `fal` görsel oluşturma sağlayıcısının varsayılanı
`fal/fal-ai/flux/dev` değeridir.

| Yetkinlik | Değer                                                              |
| --------- | ------------------------------------------------------------------ |
| Maksimum görsel sayısı | İstek başına 4; Krea 2: istek başına 1             |
| Düzenleme modu | Flux: 1 referans görsel; GPT Image 2: 10; Nano Banana 2: 14 |
| Stil referansları | Krea 2: `image` / `images` ile en fazla 10 stil referansı |
| Boyut geçersiz kılmaları | Desteklenir                                      |
| En boy oranı | Oluşturma, Krea 2 ve GPT Image 2/Nano Banana 2 düzenleme için desteklenir |
| Çözünürlük | Desteklenir                                                       |
| Çıktı biçimi | `png` veya `jpeg`                                                |

<Warning>
Flux görselden görsele istekleri `aspectRatio` geçersiz kılmalarını **desteklemez**. GPT
Image 2 ve Nano Banana 2 düzenleme istekleri fal'ın `/edit` uç noktasını kullanır ve
en boy oranı ipuçlarını kabul eder. Nano Banana 2 ayrıca `4:1`, `1:4`, `8:1` ve
`1:8` gibi ekstra yerel geniş/uzun oranları kabul eder; Krea 2 kendi daha küçük
en boy oranı alt kümesini doğrular.
</Warning>

Krea 2 modelleri fal'ın yerel Krea yük şemasını kullanır. OpenClaw, Flux tarafından kullanılan
genel `image_size` / düzenleme uç noktası yükü yerine `aspect_ratio`, `creativity` ve
`image_style_references` gönderir. Model başvuruları şunlardır:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Daha hızlı, ifade gücü yüksek illüstrasyon, anime, resim ve sanatsal stiller için Medium kullanın.
Daha yavaş fotogerçekçi, ham doku, film grenli ve ayrıntılı görünümler için Large kullanın.
Krea'nın varsayılanı `fal.creativity: "medium"` değeridir; desteklenen değerler
`raw`, `low`, `medium` ve `high` şeklindedir.

Krea 2, fal'ın istek şemasında `image_size` değil, en boy oranı sunar. `aspectRatio` tercih edin;
OpenClaw, `size` değerini desteklenen en yakın Krea en boy oranına eşler ve Krea için
`resolution` değerini sessizce yok saymak yerine reddeder.

`output_format` sunan fal modellerinden PNG çıktısı istediğinizde `outputFormat: "png"` kullanın.
fal, OpenClaw içinde açık bir şeffaf arka plan denetimi bildirmez; bu nedenle
`background: "transparent"` fal modelleri için yok sayılan bir geçersiz kılma olarak raporlanır.
Krea 2 uç noktaları fal üzerinden bir `output_format` istek alanı sunmaz; bu nedenle
OpenClaw, Krea istekleri için `outputFormat` geçersiz kılmalarını reddeder.

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

Krea 2 Medium kullanmak için:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## Video oluşturma

Birlikte gelen `fal` video oluşturma sağlayıcısının varsayılanı
`fal/fal-ai/minimax/video-01-live` değeridir.

| Yetkinlik | Değer                                                              |
| --------- | ------------------------------------------------------------------ |
| Modlar    | Metinden videoya, tek görsel referansı, Seedance referanstan videoya |
| Çalışma zamanı | Uzun süre çalışan işler için kuyruk destekli gönderme/durum/sonuç akışı |

<AccordionGroup>
  <Accordion title="Mevcut video modelleri">
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
    parametreleri üzerinden en fazla 9 görsel, 3 video ve 3 ses referansı kabul eder;
    toplam referans dosyası sayısı en fazla 12 olabilir.

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

## Müzik oluşturma

Birlikte gelen `fal` Plugin'i, paylaşılan `music_generate` aracı için bir
müzik oluşturma sağlayıcısı da kaydeder.

| Yetkinlik | Değer                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Varsayılan model | `fal/fal-ai/minimax-music/v2.6`                                                               |
| Modeller  | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| Çalışma zamanı | Eşzamanlı istek ve oluşturulan ses indirme                                                     |

fal'ı varsayılan müzik sağlayıcısı olarak kullanın:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` açık sözleri ve enstrümantal modu destekler.
ACE-Step ve Stable Audio, istemden sese uç noktalarıdır; bu model ailelerini istediğinizde
`model` geçersiz kılmasıyla bunları seçin.

<Tip>
Yakın zamanda eklenen girdiler dahil olmak üzere mevcut fal modellerinin tam listesini görmek için
`openclaw models list --provider fal` kullanın.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Görsel oluşturma" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Müzik oluşturma" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Görsel, video ve müzik modeli seçimi dahil ajan varsayılanları.
  </Card>
</CardGroup>

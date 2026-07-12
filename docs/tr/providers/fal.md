---
read_when:
    - OpenClaw'da fal ile görsel oluşturmayı kullanmak istiyorsunuz
    - FAL_KEY kimlik doğrulama akışına ihtiyacınız var
    - image_generate, video_generate veya music_generate için fal varsayılanlarını istiyorsunuz
summary: OpenClaw'da fal görüntü, video ve müzik oluşturma kurulumu
title: Fal
x-i18n:
    generated_at: "2026-07-12T12:39:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw, barındırılan görüntü, video ve müzik üretimi için paketle birlikte gelen bir `fal` sağlayıcısı sunar.

| Özellik          | Değer                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Sağlayıcı        | `fal`                                                                                      |
| Kimlik doğrulama | `FAL_KEY` (kanonik; `FAL_API_KEY` de geri dönüş seçeneği olarak çalışır)                    |
| API              | fal model uç noktaları (`https://fal.run`; video işleri `https://queue.fal.run` kullanır)   |
| Temel URL        | `models.providers.fal.baseUrl` ile geçersiz kılın                                           |

## Başlarken

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    Etkileşimsiz kurulumlarda `--fal-api-key <key>` geçirilebilir veya `FAL_KEY` dışa aktarılabilir.
    İlk katılım işlemi, herhangi bir model yapılandırılmamışsa varsayılan görüntü modeli olarak
    `fal/fal-ai/flux/dev` değerini de ayarlar.

  </Step>
  <Step title="Set a default image model">
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

Paketle birlikte gelen `fal` görüntü üretimi sağlayıcısının varsayılanı
`fal/fal-ai/flux/dev` modelidir.

| Yetenek               | Değer                                                                    |
| --------------------- | ------------------------------------------------------------------------ |
| En fazla görüntü      | İstek başına 4; Krea 2: istek başına 1                                   |
| Boyut geçersiz kılma  | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`          |
| En-boy oranı          | Flux görüntüden görüntüye dışında her yerde desteklenir                   |
| Çözünürlük            | `1K`, `2K`, `4K` (model başına sınırlar aşağıdadır)                       |
| Çıktı biçimi          | `png` (varsayılan) veya `jpeg`; Krea 2, `outputFormat` geçersiz kılmalarını reddeder |

Düzenleme istekleri (paylaşılan `image` / `images` parametreleri aracılığıyla referans görüntüler),
model başına referans sınırlarıyla model başına ayrı bir düzenleme uç noktasına yönlendirilir:

| Model ailesi                  | `fal/` sonrasındaki model başvurusu     | Düzenleme uç noktası | En fazla referans görüntü |
| ----------------------------- | -------------------------------------- | -------------------- | ------------------------- |
| Flux ve diğer fal modelleri   | `fal-ai/flux/dev` (varsayılan)          | `/image-to-image`    | 1                         |
| GPT Image                     | `openai/gpt-image-*`                    | `/edit`              | 10                        |
| Grok Imagine                  | `xai/grok-imagine-image`                | `/edit`              | 3                         |
| Nano Banana (eski)            | `fal-ai/nano-banana`                    | `/edit`              | 3                         |
| Nano Banana 2                 | `fal-ai/nano-banana-*`                  | `/edit`              | 14                        |
| Nano Banana 2 Lite            | `google/nano-banana-2-lite`             | `/edit`              | 14                        |
| Krea 2                        | `krea/v2/{medium,large}/text-to-image`  | yok (stil referansları) | 10 stil referansı       |

<Warning>
Flux görüntüden görüntüye istekleri `aspectRatio` geçersiz kılmalarını **desteklemez**. GPT
Image ve Nano Banana 2 düzenleme istekleri fal'ın `/edit` uç noktasını kullanır ve
en-boy oranı ipuçlarını kabul eder. Nano Banana 2 ayrıca `4:1`, `1:4`, `8:1` ve
`1:8` gibi ek yerel geniş/yüksek oranlarını kabul eder; Krea 2 kendi daha dar
en-boy oranı alt kümesini doğrular. Grok Imagine kendi oran listesine sahiptir
(`2:1`, `20:9`, `19.5:9` ve bunların tersleri dâhil) ve yalnızca `1K`/`2K`
çözünürlüklerini kabul eder; eski Nano Banana ve Nano Banana 2 Lite,
`resolution` geçersiz kılmalarını reddeder.
</Warning>

Krea 2 modelleri fal'ın yerel Krea yük şemasını kullanır. OpenClaw, Flux tarafından
kullanılan genel `image_size` / düzenleme uç noktası yükü yerine `aspect_ratio`,
`creativity` ve `image_style_references` gönderir. Model başvuruları şunlardır:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Daha hızlı ve etkileyici illüstrasyon, anime, resim ve sanatsal stiller için Medium
kullanın. Daha yavaş fotogerçekçi görünümler, ham dokular, film greni ve ayrıntılı
görünümler için Large kullanın. Krea'nın varsayılanı `fal.creativity: "medium"` değeridir;
desteklenen değerler `raw`, `low`, `medium` ve `high` değerleridir.

Krea 2, fal'ın istek şemasında `image_size` yerine en-boy oranını sunar. `aspectRatio`
kullanmayı tercih edin; OpenClaw, `size` değerini desteklenen en yakın Krea en-boy oranına
eşler ve Krea için `resolution` değerini yok saymak yerine reddeder.

`output_format` sunan fal modellerinden PNG çıktısı almak istediğinizde
`outputFormat: "png"` kullanın. fal, OpenClaw içinde açık bir şeffaf arka plan
denetimi bildirmediğinden `background: "transparent"`, fal modelleri için yok sayılan
bir geçersiz kılma olarak bildirilir.
Krea 2 uç noktaları fal aracılığıyla bir `output_format` istek alanı sunmadığından
OpenClaw, Krea istekleri için `outputFormat` geçersiz kılmalarını reddeder.

Krea 2 Medium'u kullanmak için:

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

## Video üretimi

Paketle birlikte gelen `fal` video üretimi sağlayıcısının varsayılanı
`fal/fal-ai/minimax/video-01-live` modelidir.

| Yetenek       | Değer                                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| Modlar        | Metinden videoya, tek görüntü referansı, Seedance referanstan videoya           |
| Çalışma şekli | Uzun süren işler için kuyruk destekli gönderme/durum/sonuç akışı                |
| Zaman aşımı   | Varsayılan olarak iş başına 20 dakika; durum her 5 saniyede bir sorgulanır      |

<AccordionGroup>
  <Accordion title="Available video models">
    **MiniMax (varsayılan):**

    - `fal/fal-ai/minimax/video-01-live`

    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling ve Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    MiniMax Live ve HeyGen istekleri yalnızca istemi ve isteğe bağlı tek bir
    referans görüntüyü gönderir; diğer geçersiz kılmalar iletilmez. Seedance modelleri
    `aspectRatio`, `size`, `resolution`, 4-15 saniyelik süreler ve ses açma/kapatma
    seçeneğini kabul eder.

  </Accordion>

  <Accordion title="Seedance 2.0 config example">
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

  <Accordion title="Seedance 2.0 reference-to-video config example">
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

    Referanstan videoya modu, paylaşılan `video_generate` aracının `images`, `videos`
    ve `audioRefs` parametreleri üzerinden en fazla 9 görüntü, 3 video ve 3 ses
    referansını kabul eder; toplam referans dosyası sayısı en fazla 12 olabilir.
    Ses referansları, aynı istekte en az bir görüntü veya video referansı gerektirir.

  </Accordion>

  <Accordion title="HeyGen video-agent config example">
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

## Müzik üretimi

Paketle birlikte gelen `fal` Plugin'i, paylaşılan `music_generate` aracı için
bir müzik üretimi sağlayıcısını da kaydeder.

| Yetenek          | Değer                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Varsayılan model | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| Modeller         | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| En fazla süre    | 240 saniye                                                                                                               |
| Çalışma şekli    | Eşzamanlı istek ve ardından oluşturulan sesin indirilmesi                                                                 |

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

`fal-ai/minimax-music/v2.6`, açıkça belirtilen şarkı sözlerini ve enstrümantal modu
destekler ancak ikisini aynı istekte desteklemez. ACE-Step ve Stable Audio,
istemden sese uç noktalarıdır; bu model ailelerini istediğinizde `model` geçersiz
kılmasıyla bunları seçin. ACE-Step açıkça belirtilen şarkı sözlerini reddeder;
Stable Audio ise hem şarkı sözlerini hem de enstrümantal modu reddeder.

<Tip>
Yukarıdaki tablolar ve açılır bölümler, paketle birlikte gelen fal sağlayıcısının
özel olarak işlediği model ailelerini kapsar. Diğer fal görüntü uç noktası kimlikleri
de görüntü modeli olarak seçilebilir; bunlar Flux gibi işlenir (genel `image_size`
yükü, `/image-to-image` aracılığıyla bir referans görüntü).
</Tip>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Image generation" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Music generation" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Görüntü, video ve müzik modeli seçimi dâhil agent varsayılanları.
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw'da PixVerse video oluşturmayı kullanmak istiyorsunuz
    - PixVerse API anahtarı/env kurulumu gerekir
    - PixVerse'ü varsayılan video sağlayıcısı yapmak istiyorsunuz
summary: OpenClaw'da PixVerse video oluşturma kurulumu
title: PixVerse
x-i18n:
    generated_at: "2026-06-28T01:12:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw, barındırılan PixVerse video üretimi için resmi harici Plugin olarak `pixverse` sağlar. Plugin, `pixverse` sağlayıcısını `videoGenerationProviders` sözleşmesine göre kaydeder.

| Özellik                    | Değer                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| Sağlayıcı kimliği          | `pixverse`                                                           |
| Plugin paketi              | `@openclaw/pixverse-provider`                                        |
| Kimlik doğrulama ortam değişkeni | `PIXVERSE_API_KEY`                                             |
| İlk kurulum bayrağı        | `--auth-choice pixverse-api-key`                                     |
| Doğrudan CLI bayrağı       | `--pixverse-api-key <key>`                                           |
| API                        | PixVerse Platform API v2 (`video_id` gönderimi ve sonuç yoklaması)   |
| Varsayılan model           | `pixverse/v6`                                                        |
| Varsayılan API bölgesi     | Uluslararası                                                         |

## Başlarken

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Sihirbaz, sağlayıcı yapılandırmasına `region` ve `baseUrl` yazmadan önce
    Uluslararası uç noktanın (`https://app-api.pixverse.ai/openapi/v2`) mı yoksa
    CN uç noktasının (`https://app-api.pixverseai.cn/openapi/v2`) mı kullanılacağını sorar.

  </Step>
  <Step title="Set PixVerse as the default video provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Generate a video">
    Ajanın bir video üretmesini isteyin. PixVerse otomatik olarak kullanılır.
  </Step>
</Steps>

## Desteklenen modlar ve modeller

Sağlayıcı, PixVerse üretim modellerini OpenClaw'ın paylaşılan video aracı üzerinden sunar.

| Mod             | Modeller              | Referans girdisi              |
| --------------- | --------------------- | ----------------------------- |
| Metinden videoya | `v6` (varsayılan), `c1` | Yok                         |
| Görselden videoya | `v6` (varsayılan), `c1` | 1 yerel veya uzak görsel   |

Yerel görsel referansları, görselden videoya isteğinden önce PixVerse'e yüklenir. Uzak görsel URL'leri, PixVerse görsel yükleme uç noktasından `image_url` olarak geçirilir.

| Seçenek          | Desteklenen değerler                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| Süre             | 1-15 saniye                                                                  |
| Çözünürlük       | `360P`, `540P`, `720P`, `1080P`                                              |
| En-boy oranı     | metinden videoya için `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` |
| Üretilen ses     | `audio: true`                                                                |

<Note>
PixVerse görsel şablonu üretimi henüz `image_generate` üzerinden sunulmaz. Bu API şablon kimliği odaklıdır, OpenClaw'ın paylaşılan görsel üretimi sözleşmesinde ise şu anda PixVerse'e özel tipli bir seçenek çantası yoktur.
</Note>

## Sağlayıcı seçenekleri

Video sağlayıcısı, sağlayıcıya özel şu isteğe bağlı anahtarları kabul eder:

| Seçenek                              | Tür    | Etki                              |
| ------------------------------------ | ------ | --------------------------------- |
| `seed`                               | number | Desteklendiğinde belirlenimci seed |
| `negativePrompt` / `negative_prompt` | string | Negatif istem                    |
| `quality`                            | string | `720p` gibi PixVerse kalitesi     |
| `motionMode` / `motion_mode`         | string | Görselden videoya hareket modu    |
| `cameraMovement` / `camera_movement` | string | PixVerse kamera hareketi ön ayarı |
| `templateId` / `template_id`         | number | Etkinleştirilmiş PixVerse şablon kimliği |

## Yapılandırma

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="API region">
    OpenClaw varsayılan olarak uluslararası PixVerse API'sini kullanır. Anahtarınız belirli bir PixVerse platform bölgesine ait olduğunda `models.providers.pixverse.region`
    değerini elle ayarlayın veya kurulum sihirbazında birini seçmek için
    `openclaw onboard --auth-choice pixverse-api-key` kullanın:

    | Bölge değeri    | PixVerse API temel URL'si                   |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Custom base URL">
    `models.providers.pixverse.baseUrl` değerini yalnızca güvenilir ve uyumlu bir proxy üzerinden yönlendirme yaparken ayarlayın.
    `baseUrl`, `region` değerine göre önceliklidir.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Task polling">
    PixVerse, üretim isteğinden bir `video_id` döndürür. OpenClaw, görev başarılı olana,
    başarısız olana veya zaman aşımına uğrayana kadar
    `/openapi/v2/video/result/{video_id}` adresini yoklar.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve eşzamansız davranış.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Video üretimi modeli dahil ajan varsayılan ayarları.
  </Card>
</CardGroup>

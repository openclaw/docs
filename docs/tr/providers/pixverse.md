---
read_when:
    - OpenClaw'da PixVerse video oluşturmayı kullanmak istiyorsunuz
    - PixVerse API anahtarı/ortam değişkeni yapılandırmasına ihtiyacınız var
    - PixVerse'ü varsayılan video sağlayıcısı yapmak istiyorsunuz
summary: OpenClaw'da PixVerse video oluşturma kurulumu
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T12:41:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw, barındırılan PixVerse video üretimi için resmi bir harici Plugin olarak `pixverse` sağlar. Plugin, `pixverse` sağlayıcısını `videoGenerationProviders` sözleşmesine kaydeder.

| Özellik                  | Değer                                                                      |
| ------------------------ | -------------------------------------------------------------------------- |
| Sağlayıcı kimliği        | `pixverse`                                                                 |
| Plugin paketi            | `@openclaw/pixverse-provider`                                              |
| Kimlik doğrulama ortam değişkeni | `PIXVERSE_API_KEY`                                                |
| İlk kurulum bayrağı      | `--auth-choice pixverse-api-key`                                           |
| Doğrudan CLI bayrağı     | `--pixverse-api-key <key>`                                                 |
| API                      | PixVerse Platform API v2 (`video_id` gönderimi ve sonuç yoklaması)         |
| Varsayılan model         | `pixverse/v6`                                                              |
| Varsayılan API bölgesi   | Uluslararası                                                              |

## Başlarken

<Steps>
  <Step title="Plugin'i yükleyin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="API anahtarını ayarlayın">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Sihirbaz, sağlayıcı yapılandırmasına `region` ve `baseUrl` değerlerini
    yazmadan önce Uluslararası veya CN uç noktasını seçmenizi ister (aşağıdaki
    API bölümü bölümüne bakın). Etkileşimsiz çalıştırmalar (anahtar
    `--pixverse-api-key` veya `PIXVERSE_API_KEY` üzerinden sağlandığında)
    varsayılan olarak Uluslararası bölgeyi kullanır.

    İlk kurulum ayrıca henüz varsayılan bir video modeli yapılandırılmamışsa
    `agents.defaults.videoGenerationModel.primary` değerini `pixverse/v6`
    olarak ayarlar.

  </Step>
  <Step title="Mevcut varsayılan video sağlayıcısını değiştirin (isteğe bağlı)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Video oluşturun">
    Agent'tan bir video oluşturmasını isteyin. PixVerse otomatik olarak kullanılır.
  </Step>
</Steps>

## Desteklenen modlar ve modeller

Sağlayıcı, PixVerse üretim modellerini OpenClaw'ın paylaşılan video aracı üzerinden sunar.

| Mod                 | Modeller              | Referans girdisi               |
| ------------------- | --------------------- | ------------------------------ |
| Metinden videoya    | `v6` (varsayılan), `c1` | Yok                          |
| Görüntüden videoya  | `v6` (varsayılan), `c1` | 1 yerel veya uzak görüntü    |

Yerel görüntü referansları, görüntüden videoya isteğinden önce PixVerse'e yüklenir. Uzak görüntü URL'leri, PixVerse görüntü yükleme uç noktasına `image_url` olarak iletilir.

| Seçenek          | Desteklenen değerler                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Süre             | 1-15 saniye (varsayılan 5)                                                                                                                     |
| Çözünürlük       | `360P`, `540P`, `720P`, `1080P` (varsayılan `540P`; `480P` istekleri `540P` olarak eşlenir)                                                    |
| En-boy oranı     | `16:9` (varsayılan), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; yalnızca metinden videoya, görüntüden videoya modu kaynak görüntüyü izler |
| Oluşturulan ses  | `audio: true`                                                                                                                                  |

<Note>
PixVerse görüntü şablonu üretimi henüz `image_generate` üzerinden sunulmamaktadır. Bu API şablon kimliğiyle çalışırken OpenClaw'ın paylaşılan görüntü üretimi sözleşmesinde şu anda PixVerse'e özgü türü belirlenmiş bir seçenek grubu bulunmamaktadır.
</Note>

## Sağlayıcı seçenekleri

Video sağlayıcısı, sağlayıcıya özgü şu isteğe bağlı anahtarları kabul eder:

| Seçenek                              | Tür    | Etki                                             |
| ------------------------------------ | ------ | ------------------------------------------------ |
| `seed`                               | sayı   | 0 ile 2147483647 arasında deterministik çekirdek |
| `negativePrompt` / `negative_prompt` | dize   | Negatif istem                                    |
| `quality`                            | dize   | `720p` gibi PixVerse kalitesi                    |
| `motionMode` / `motion_mode`         | dize   | Görüntüden videoya hareket modu (varsayılan `normal`) |
| `cameraMovement` / `camera_movement` | dize   | PixVerse kamera hareketi ön ayarı                |
| `templateId` / `template_id`         | sayı   | Etkinleştirilmiş PixVerse şablon kimliği         |

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
  <Accordion title="API bölgesi">
    | Bölge değeri     | PixVerse API temel URL'si                    |
    | ---------------- | -------------------------------------------- |
    | `international`  | `https://app-api.pixverse.ai/openapi/v2`     |
    | `cn`             | `https://app-api.pixverseai.cn/openapi/v2`   |

    Anahtarınız belirli bir PixVerse platform bölgesine aitse
    `models.providers.pixverse.region` değerini elle ayarlayın veya kurulum
    sihirbazında bir bölge seçmek için
    `openclaw onboard --auth-choice pixverse-api-key` komutunu çalıştırın:

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

  <Accordion title="Özel temel URL">
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

  <Accordion title="Görev yoklaması">
    PixVerse, üretim isteğinden bir `video_id` döndürür. OpenClaw, görev
    başarılı olana, başarısız olana veya zaman aşımına ulaşana kadar
    `/openapi/v2/video/result/{video_id}` uç noktasını her 5 saniyede bir
    yoklar (varsayılan 5 dakika; `agents.defaults.videoGenerationModel.timeoutMs`
    ile geçersiz kılınabilir).
  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve eşzamansız davranış.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Video üretim modeli dahil olmak üzere Agent varsayılan ayarları.
  </Card>
</CardGroup>

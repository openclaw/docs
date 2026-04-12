---
read_when:
    - OpenClaw’da Grok modellerini kullanmak istiyorsunuz
    - xAI kimlik doğrulamasını veya model kimliklerini yapılandırıyorsunuz
summary: OpenClaw’da xAI Grok modellerini kullanın
title: xAI
x-i18n:
    generated_at: "2026-04-12T23:33:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 820fef290c67d9815e41a96909d567216f67ca0f01df1d325008fd04666ad255
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw, Grok modelleri için paketli bir `xai` provider Plugin’i sunar.

## Başlarken

<Steps>
  <Step title="Bir API anahtarı oluşturun">
    [xAI console](https://console.x.ai/) içinde bir API anahtarı oluşturun.
  </Step>
  <Step title="API anahtarınızı ayarlayın">
    `XAI_API_KEY` ayarlayın veya şunu çalıştırın:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Bir model seçin">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw, paketli xAI taşıma katmanı olarak xAI Responses API’sini kullanır. Aynı
`XAI_API_KEY`, Grok destekli `web_search`, birinci sınıf `x_search`
ve uzak `code_execution` için de kullanılabilir.
Bir xAI anahtarını `plugins.entries.xai.config.webSearch.apiKey` altında saklarsanız,
paketli xAI model provider’ı da bu anahtarı yedek olarak yeniden kullanır.
`code_execution` ayarlamaları `plugins.entries.xai.config.codeExecution` altında bulunur.
</Note>

## Paketli model kataloğu

OpenClaw, kutudan çıktığı hâliyle şu xAI model ailelerini içerir:

| Aile            | Model kimlikleri                                                         |
| --------------- | ------------------------------------------------------------------------ |
| Grok 3          | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4          | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast     | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast   | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta  | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code       | `grok-code-fast-1`                                                       |

Plugin ayrıca, aynı API biçimini izlediklerinde daha yeni `grok-4*` ve `grok-code-fast*` kimliklerini de ileri çözümleme ile destekler.

<Tip>
`grok-4-fast`, `grok-4-1-fast` ve `grok-4.20-beta-*` varyantları,
paketli katalogdaki güncel görsel destekli Grok başvurularıdır.
</Tip>

### Hızlı mod eşlemeleri

`/fast on` veya `agents.defaults.models["xai/<model>"].params.fastMode: true`
yerel xAI isteklerini şu şekilde yeniden yazar:

| Kaynak model  | Hızlı mod hedefi   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Eski uyumluluk takma adları

Eski takma adlar hâlâ kanonik paketli kimliklere normalize edilir:

| Eski takma ad             | Kanonik kimlik                        |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Özellikler

<AccordionGroup>
  <Accordion title="Web araması">
    Paketli `grok` web-search provider’ı da `XAI_API_KEY` kullanır:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video üretimi">
    Paketli `xai` Plugin’i, paylaşılan
    `video_generate` aracı üzerinden video üretimini kaydeder.

    - Varsayılan video modeli: `xai/grok-imagine-video`
    - Modlar: text-to-video, image-to-video ve uzak video düzenleme/uzatma akışları
    - `aspectRatio` ve `resolution` destekler

    <Warning>
    Yerel video arabellekleri kabul edilmez. Video referansı ve düzenleme girdileri için
    uzak `http(s)` URL’leri kullanın.
    </Warning>

    xAI’yi varsayılan video provider’ı olarak kullanmak için:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Paylaşılan araç parametreleri,
    provider seçimi ve failover davranışı için bkz. [Video Üretimi](/tr/tools/video-generation).
    </Note>

  </Accordion>

  <Accordion title="x_search yapılandırması">
    Paketli xAI Plugin’i, Grok üzerinden
    X (eski adıyla Twitter) içeriğinde arama yapmak için `x_search` aracını bir OpenClaw aracı olarak sunar.

    Yapılandırma yolu: `plugins.entries.xai.config.xSearch`

    | Anahtar             | Tür     | Varsayılan         | Açıklama                            |
    | ------------------- | ------- | ------------------ | ----------------------------------- |
    | `enabled`           | boolean | —                  | x_search’ü etkinleştirir veya devre dışı bırakır |
    | `model`             | string  | `grok-4-1-fast`    | x_search istekleri için kullanılan model |
    | `inlineCitations`   | boolean | —                  | Sonuçlara satır içi alıntılar ekler |
    | `maxTurns`          | number  | —                  | Azami konuşma dönüşü                |
    | `timeoutSeconds`    | number  | —                  | Saniye cinsinden istek zaman aşımı  |
    | `cacheTtlMinutes`   | number  | —                  | Dakika cinsinden cache yaşam süresi |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Code execution yapılandırması">
    Paketli xAI Plugin’i,
    xAI’nin sandbox ortamında uzak kod yürütme için `code_execution` aracını bir OpenClaw aracı olarak sunar.

    Yapılandırma yolu: `plugins.entries.xai.config.codeExecution`

    | Anahtar            | Tür     | Varsayılan                 | Açıklama                               |
    | ------------------ | ------- | -------------------------- | -------------------------------------- |
    | `enabled`          | boolean | `true` (anahtar varsa)     | code execution’ı etkinleştirir veya devre dışı bırakır |
    | `model`            | string  | `grok-4-1-fast`            | code execution istekleri için kullanılan model |
    | `maxTurns`         | number  | —                          | Azami konuşma dönüşü                   |
    | `timeoutSeconds`   | number  | —                          | Saniye cinsinden istek zaman aşımı     |

    <Note>
    Bu, yerel [`exec`](/tr/tools/exec) değil, uzak xAI sandbox yürütmesidir.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bilinen sınırlamalar">
    - Kimlik doğrulama şu anda yalnızca API anahtarıyladır. OpenClaw’da henüz xAI OAuth veya cihaz kodu akışı yoktur.
    - `grok-4.20-multi-agent-experimental-beta-0304`, standart OpenClaw xAI taşımasından farklı bir yukarı akış API
      yüzeyi gerektirdiği için normal xAI provider yolunda desteklenmez.
  </Accordion>

  <Accordion title="Gelişmiş notlar">
    - OpenClaw, paylaşılan çalıştırıcı yolunda xAI’ye özgü araç şeması ve araç çağrısı uyumluluk düzeltmelerini
      otomatik olarak uygular.
    - Yerel xAI isteklerinde varsayılan olarak `tool_stream: true` kullanılır. Bunu
      devre dışı bırakmak için `agents.defaults.models["xai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
    - Paketli xAI sarmalayıcısı, yerel xAI isteklerini göndermeden önce desteklenmeyen katı araç şeması flag’lerini ve
      akıl yürütme payload anahtarlarını kaldırır.
    - `web_search`, `x_search` ve `code_execution`, OpenClaw
      araçları olarak sunulur. OpenClaw, her sohbet dönüşüne tüm yerel araçları eklemek yerine her araç
      isteği içinde ihtiyaç duyduğu belirli xAI yerleşik aracını etkinleştirir.
    - `x_search` ve `code_execution`, core model çalışma zamanına
      sabit kodlanmak yerine paketli xAI Plugin’ine aittir.
    - `code_execution`, yerel
      [`exec`](/tr/tools/exec) değil, uzak xAI sandbox yürütmesidir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Provider’ları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve provider seçimi.
  </Card>
  <Card title="Tüm provider'lar" href="/tr/providers/index" icon="grid-2">
    Daha geniş provider genel bakışı.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve düzeltmeler.
  </Card>
</CardGroup>

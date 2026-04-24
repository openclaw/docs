---
read_when:
    - OpenClaw ile yerel ComfyUI iş akışlarını kullanmak istiyorsunuz
    - Görsel, video veya müzik iş akışlarıyla Comfy Cloud kullanmak istiyorsunuz
    - Paketlenmiş comfy Plugin'i yapılandırma anahtarlarına ihtiyacınız var
summary: OpenClaw'da ComfyUI iş akışı görsel, video ve müzik üretimi kurulumu
title: ComfyUI
x-i18n:
    generated_at: "2026-04-24T09:25:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8b39c49df3ad23018372b481681ce89deac3271da5dbdf94580712ace7fef7f
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw, iş akışı odaklı ComfyUI çalıştırmaları için paketlenmiş bir `comfy` Plugin'iyle gelir. Plugin tamamen iş akışı odaklıdır, bu yüzden OpenClaw genel `size`, `aspectRatio`, `resolution`, `durationSeconds` veya TTS tarzı denetimleri grafiğinize eşlemeye çalışmaz.

| Özellik        | Ayrıntı                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| Sağlayıcı        | `comfy`                                                                          |
| Modeller          | `comfy/workflow`                                                                 |
| Paylaşılan yüzeyler | `image_generate`, `video_generate`, `music_generate`                             |
| Kimlik doğrulama            | Yerel ComfyUI için yok; Comfy Cloud için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| API             | ComfyUI `/prompt` / `/history` / `/view` ve Comfy Cloud `/api/*`                |

## Destekledikleri

- Bir iş akışı JSON'undan görsel üretimi
- 1 yüklenmiş referans görselle görsel düzenleme
- Bir iş akışı JSON'undan video üretimi
- 1 yüklenmiş referans görselle video üretimi
- Paylaşılan `music_generate` aracı üzerinden müzik veya ses üretimi
- Yapılandırılmış bir Node'dan veya eşleşen tüm çıktı Node'larından çıktı indirme

## Başlarken

Kendi makinenizde ComfyUI çalıştırma ile Comfy Cloud kullanma arasında seçim yapın.

<Tabs>
  <Tab title="Yerel">
    **Şunlar için en uygunu:** kendi ComfyUI örneğinizi makinenizde veya LAN üzerinde çalıştırmak.

    <Steps>
      <Step title="ComfyUI'yi yerelde başlatın">
        Yerel ComfyUI örneğinizin çalıştığından emin olun (varsayılan `http://127.0.0.1:8188`).
      </Step>
      <Step title="İş akışı JSON'unuzu hazırlayın">
        Bir ComfyUI iş akışı JSON dosyası dışa aktarın veya oluşturun. İstem girdi Node'u ile OpenClaw'ın okuyacağı çıktı Node'u için Node kimliklerini not edin.
      </Step>
      <Step title="Sağlayıcıyı yapılandırın">
        `mode: "local"` ayarlayın ve iş akışı dosyanızı gösterin. İşte en küçük bir görsel örneği:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "local",
                baseUrl: "http://127.0.0.1:8188",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Varsayılan modeli ayarlayın">
        OpenClaw'ı, yapılandırdığınız yetenek için `comfy/workflow` modeline yönlendirin:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Doğrulayın">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Şunlar için en uygunu:** yerel GPU kaynaklarını yönetmeden Comfy Cloud üzerinde iş akışları çalıştırmak.

    <Steps>
      <Step title="Bir API key alın">
        [comfy.org](https://comfy.org) üzerinden kaydolun ve hesap panonuzdan bir API key oluşturun.
      </Step>
      <Step title="API key'i ayarlayın">
        Anahtarınızı şu yöntemlerden biriyle sağlayın:

        ```bash
        # Ortam değişkeni (tercih edilir)
        export COMFY_API_KEY="your-key"

        # Alternatif ortam değişkeni
        export COMFY_CLOUD_API_KEY="your-key"

        # Veya doğrudan yapılandırma içinde
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="İş akışı JSON'unuzu hazırlayın">
        Bir ComfyUI iş akışı JSON dosyası dışa aktarın veya oluşturun. İstem girdi Node'u ve çıktı Node'u için Node kimliklerini not edin.
      </Step>
      <Step title="Sağlayıcıyı yapılandırın">
        `mode: "cloud"` ayarlayın ve iş akışı dosyanızı gösterin:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        Cloud modu varsayılan olarak `baseUrl` değerini `https://cloud.comfy.org` yapar. Yalnızca özel bir Cloud uç noktası kullanıyorsanız `baseUrl` ayarlamanız gerekir.
        </Tip>
      </Step>
      <Step title="Varsayılan modeli ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Doğrulayın">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Yapılandırma

Comfy, paylaşılan üst düzey bağlantı ayarlarını ve yetenek başına iş akışı bölümlerini (`image`, `video`, `music`) destekler:

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

### Paylaşılan anahtarlar

| Anahtar                   | Tür                   | Açıklama                                                                           |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` veya `"cloud"` | Bağlantı modu.                                                                      |
| `baseUrl`             | string                 | Yerel için varsayılan `http://127.0.0.1:8188`, Cloud için `https://cloud.comfy.org` değeridir. |
| `apiKey`              | string                 | İsteğe bağlı satır içi anahtar; `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` ortam değişkenlerine alternatiftir. |
| `allowPrivateNetwork` | boolean                | Cloud modunda özel/LAN `baseUrl` kullanımına izin verir.                                          |

### Yetenek başına anahtarlar

Bu anahtarlar `image`, `video` veya `music` bölümleri içinde geçerlidir:

| Anahtar                          | Zorunlu | Varsayılan  | Açıklama                                                                  |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` veya `workflowPath` | Evet      | --       | ComfyUI iş akışı JSON dosyasının yolu.                                      |
| `promptNodeId`               | Evet      | --       | Metin istemini alan Node kimliği.                                       |
| `promptInputName`            | Hayır       | `"text"` | İstem Node'undaki girdi adı.                                               |
| `outputNodeId`               | Hayır       | --       | Çıktının okunacağı Node kimliği. Atlanırsa eşleşen tüm çıktı Node'ları kullanılır. |
| `pollIntervalMs`             | Hayır       | --       | İşin tamamlanması için milisaniye cinsinden yoklama aralığı.                         |
| `timeoutMs`                  | Hayır       | --       | İş akışı çalıştırması için milisaniye cinsinden zaman aşımı.                                |

`image` ve `video` bölümleri ayrıca şunları destekler:

| Anahtar                   | Zorunlu                             | Varsayılan   | Açıklama                                         |
| --------------------- | ------------------------------------ | --------- | --------------------------------------------------- |
| `inputImageNodeId`    | Evet (bir referans görsel geçirilirken) | --        | Yüklenen referans görseli alan Node kimliği. |
| `inputImageInputName` | Hayır                                   | `"image"` | Görsel Node'undaki girdi adı.                       |

## İş akışı ayrıntıları

<AccordionGroup>
  <Accordion title="Görsel iş akışları">
    Varsayılan görsel modelini `comfy/workflow` olarak ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **Referans görselli düzenleme örneği:**

    Yüklenmiş bir referans görselle görsel düzenlemeyi etkinleştirmek için görsel yapılandırmanıza `inputImageNodeId` ekleyin:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            image: {
              workflowPath: "./workflows/edit-api.json",
              promptNodeId: "6",
              inputImageNodeId: "7",
              inputImageInputName: "image",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Video iş akışları">
    Varsayılan video modelini `comfy/workflow` olarak ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Comfy video iş akışları, yapılandırılmış grafik üzerinden metinden videoya ve görselden videoya desteği sunar.

    <Note>
    OpenClaw, Comfy iş akışlarına girdi videoları geçirmez. Girdi olarak yalnızca metin istemleri ve tek referans görseller desteklenir.
    </Note>

  </Accordion>

  <Accordion title="Müzik iş akışları">
    Paketlenmiş Plugin, iş akışıyla tanımlanan ses veya müzik çıktıları için bir müzik üretim sağlayıcısı kaydeder ve bu, paylaşılan `music_generate` aracı üzerinden sunulur:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Ses iş akışı JSON'unuzu ve çıktı Node'unuzu göstermek için `music` yapılandırma bölümünü kullanın.

  </Accordion>

  <Accordion title="Geriye dönük uyumluluk">
    İç içe `image` bölümü olmadan mevcut üst düzey görsel yapılandırması hâlâ çalışır:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    OpenClaw bu eski şekli görsel iş akışı yapılandırması olarak değerlendirir. Hemen geçiş yapmanız gerekmez, ancak yeni kurulumlar için iç içe `image` / `video` / `music` bölümleri önerilir.

    <Tip>
    Yalnızca görsel üretimi kullanıyorsanız, eski düz yapılandırma ile yeni iç içe `image` bölümü işlevsel olarak eşdeğerdir.
    </Tip>

  </Accordion>

  <Accordion title="Canlı testler">
    Paketlenmiş Plugin için isteğe bağlı canlı kapsam mevcuttur:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Canlı test, eşleşen Comfy iş akışı bölümü yapılandırılmadıkça tek tek görsel, video veya müzik durumlarını atlar.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Görsel Üretimi" href="/tr/tools/image-generation" icon="image">
    Görsel üretim aracı yapılandırması ve kullanımı.
  </Card>
  <Card title="Video Üretimi" href="/tr/tools/video-generation" icon="video">
    Video üretim aracı yapılandırması ve kullanımı.
  </Card>
  <Card title="Müzik Üretimi" href="/tr/tools/music-generation" icon="music">
    Müzik ve ses üretim aracı kurulumu.
  </Card>
  <Card title="Sağlayıcı Dizini" href="/tr/providers/index" icon="layers">
    Tüm sağlayıcılara ve model başvurularına genel bakış.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Ajan varsayılanları dahil tam yapılandırma başvurusu.
  </Card>
</CardGroup>

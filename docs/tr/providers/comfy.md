---
read_when:
    - OpenClaw ile yerel ComfyUI iş akışlarını kullanmak istiyorsunuz
    - Görsel, video veya müzik iş akışlarıyla Comfy Cloud kullanmak istiyorsunuz
    - Paketli comfy Plugin yapılandırma anahtarlarına ihtiyacınız var
summary: OpenClaw’da ComfyUI iş akışı görsel, video ve müzik üretimi kurulumu
title: ComfyUI
x-i18n:
    generated_at: "2026-04-12T23:30:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85db395b171f37f80b34b22f3e7707bffc1fd9138e7d10687eef13eaaa55cf24
    source_path: providers/comfy.md
    workflow: 15
---

# ComfyUI

OpenClaw, iş akışı güdümlü ComfyUI çalıştırmaları için paketli bir `comfy` Plugin’i sunar. Plugin tamamen iş akışı güdümlüdür; bu nedenle OpenClaw genel `size`, `aspectRatio`, `resolution`, `durationSeconds` veya TTS tarzı kontrolleri grafiğinize eşlemeye çalışmaz.

| Özellik         | Ayrıntı                                                                          |
| --------------- | -------------------------------------------------------------------------------- |
| Provider        | `comfy`                                                                          |
| Modeller        | `comfy/workflow`                                                                 |
| Paylaşılan yüzeyler | `image_generate`, `video_generate`, `music_generate`                         |
| Kimlik doğrulama | Yerel ComfyUI için yok; Comfy Cloud için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| API             | ComfyUI `/prompt` / `/history` / `/view` ve Comfy Cloud `/api/*`                |

## Neleri destekler

- İş akışı JSON’undan görsel üretimi
- 1 yüklenmiş referans görselle görsel düzenleme
- İş akışı JSON’undan video üretimi
- 1 yüklenmiş referans görselle video üretimi
- Paylaşılan `music_generate` aracı üzerinden müzik veya ses üretimi
- Yapılandırılmış bir Node’dan veya eşleşen tüm çıktı Node’larından çıktı indirme

## Başlarken

ComfyUI’yi kendi makinenizde çalıştırmak veya Comfy Cloud kullanmak arasında seçim yapın.

<Tabs>
  <Tab title="Local">
    **En uygunu:** kendi ComfyUI örneğinizi makinenizde veya LAN üzerinde çalıştırmak.

    <Steps>
      <Step title="ComfyUI'yi yerel olarak başlatın">
        Yerel ComfyUI örneğinizin çalıştığından emin olun (varsayılan: `http://127.0.0.1:8188`).
      </Step>
      <Step title="İş akışı JSON'unuzu hazırlayın">
        Bir ComfyUI iş akışı JSON dosyası dışa aktarın veya oluşturun. Prompt giriş Node’u ile OpenClaw’ın okuyacağı çıktı Node’unun Node kimliklerini not edin.
      </Step>
      <Step title="Provider'ı yapılandırın">
        `mode: "local"` ayarlayın ve iş akışı dosyanızı işaret edin. Aşağıda minimal bir görsel örneği verilmiştir:

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
        OpenClaw’ı, yapılandırdığınız yetenek için `comfy/workflow` modeline yönlendirin:

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
    **En uygunu:** yerel GPU kaynaklarını yönetmeden iş akışlarını Comfy Cloud üzerinde çalıştırmak.

    <Steps>
      <Step title="Bir API anahtarı alın">
        [comfy.org](https://comfy.org) adresinde kaydolun ve hesap panonuzdan bir API anahtarı oluşturun.
      </Step>
      <Step title="API anahtarını ayarlayın">
        Anahtarınızı şu yöntemlerden biriyle sağlayın:

        ```bash
        # Ortam değişkeni (tercih edilir)
        export COMFY_API_KEY="your-key"

        # Alternatif ortam değişkeni
        export COMFY_CLOUD_API_KEY="your-key"

        # Veya doğrudan yapılandırmaya ekleyin
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="İş akışı JSON'unuzu hazırlayın">
        Bir ComfyUI iş akışı JSON dosyası dışa aktarın veya oluşturun. Prompt giriş Node’u ile çıktı Node’unun Node kimliklerini not edin.
      </Step>
      <Step title="Provider'ı yapılandırın">
        `mode: "cloud"` ayarlayın ve iş akışı dosyanızı işaret edin:

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
        Cloud modu `baseUrl` için varsayılan olarak `https://cloud.comfy.org` kullanır. `baseUrl` değerini yalnızca özel bir bulut uç noktası kullanıyorsanız ayarlamanız gerekir.
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

| Anahtar               | Tür                    | Açıklama                                                                              |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` veya `"cloud"` | Bağlantı modu.                                                                      |
| `baseUrl`             | string                 | Yerel için varsayılan `http://127.0.0.1:8188`, cloud için `https://cloud.comfy.org`. |
| `apiKey`              | string                 | İsteğe bağlı satır içi anahtar; `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` env değişkenlerine alternatiftir. |
| `allowPrivateNetwork` | boolean                | Cloud modunda özel/LAN `baseUrl` kullanımına izin verir.                              |

### Yetenek başına anahtarlar

Bu anahtarlar `image`, `video` veya `music` bölümleri içinde geçerlidir:

| Anahtar                      | Gerekli | Varsayılan | Açıklama                                                                  |
| ---------------------------- | ------- | ---------- | ------------------------------------------------------------------------- |
| `workflow` veya `workflowPath` | Evet  | --         | ComfyUI iş akışı JSON dosyasının yolu.                                    |
| `promptNodeId`               | Evet    | --         | Metin prompt’unu alan Node kimliği.                                       |
| `promptInputName`            | Hayır   | `"text"`   | Prompt Node’undaki girdi adı.                                             |
| `outputNodeId`               | Hayır   | --         | Çıktının okunacağı Node kimliği. Atlanırsa eşleşen tüm çıktı Node’ları kullanılır. |
| `pollIntervalMs`             | Hayır   | --         | İş tamamlanması için milisaniye cinsinden yoklama aralığı.                |
| `timeoutMs`                  | Hayır   | --         | İş akışı çalıştırması için milisaniye cinsinden zaman aşımı.              |

`image` ve `video` bölümleri ayrıca şunları destekler:

| Anahtar               | Gerekli                               | Varsayılan | Açıklama                                              |
| --------------------- | ------------------------------------- | ---------- | ----------------------------------------------------- |
| `inputImageNodeId`    | Evet (referans görsel geçirildiğinde) | --         | Yüklenen referans görseli alan Node kimliği.          |
| `inputImageInputName` | Hayır                                 | `"image"`  | Görsel Node’undaki girdi adı.                         |

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

    **Referans görselle düzenleme örneği:**

    Yüklenmiş referans görselle görsel düzenlemeyi etkinleştirmek için görsel yapılandırmanıza `inputImageNodeId` ekleyin:

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

    Comfy video iş akışları, yapılandırılmış grafik üzerinden text-to-video ve image-to-video destekler.

    <Note>
    OpenClaw, Comfy iş akışlarına girdi videosu geçirmez. Girdi olarak yalnızca metin prompt’ları ve tekil referans görseller desteklenir.
    </Note>

  </Accordion>

  <Accordion title="Müzik iş akışları">
    Paketli Plugin, paylaşılan `music_generate` aracı üzerinden sunulan, iş akışında tanımlanmış ses veya müzik çıktıları için bir müzik üretimi provider’ı kaydeder:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Ses iş akışı JSON’unuzu ve çıktı Node’unuzu işaret etmek için `music` yapılandırma bölümünü kullanın.

  </Accordion>

  <Accordion title="Geriye dönük uyumluluk">
    Mevcut üst düzey görsel yapılandırması (`image` iç içe bölümü olmadan) hâlâ çalışır:

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

    OpenClaw bu eski biçimi görsel iş akışı yapılandırması olarak değerlendirir. Hemen geçiş yapmanız gerekmez, ancak yeni kurulumlar için iç içe `image` / `video` / `music` bölümleri önerilir.

    <Tip>
    Yalnızca görsel üretimi kullanıyorsanız, eski düz yapılandırma ile yeni iç içe `image` bölümü işlevsel olarak eşdeğerdir.
    </Tip>

  </Accordion>

  <Accordion title="Canlı testler">
    Paketli Plugin için isteğe bağlı canlı kapsam mevcuttur:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Canlı test, yalnızca eşleşen Comfy iş akışı bölümü yapılandırılmışsa tek tek görsel, video veya müzik durumlarını atlar.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Görsel Üretimi" href="/tr/tools/image-generation" icon="image">
    Görsel üretimi aracı yapılandırması ve kullanımı.
  </Card>
  <Card title="Video Üretimi" href="/tr/tools/video-generation" icon="video">
    Video üretimi aracı yapılandırması ve kullanımı.
  </Card>
  <Card title="Müzik Üretimi" href="/tr/tools/music-generation" icon="music">
    Müzik ve ses üretimi aracı kurulumu.
  </Card>
  <Card title="Provider Dizinı" href="/tr/providers/index" icon="layers">
    Tüm provider’lara ve model başvurularına genel bakış.
  </Card>
  <Card title="Yapılandırma Başvurusu" href="/tr/gateway/configuration-reference#agent-defaults" icon="gear">
    Ajan varsayılanları dahil tam yapılandırma başvurusu.
  </Card>
</CardGroup>

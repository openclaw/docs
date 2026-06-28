---
read_when:
    - OpenClaw ile yerel ComfyUI iş akışlarını kullanmak istiyorsunuz
    - Comfy Cloud'u görsel, video veya müzik iş akışlarıyla kullanmak istiyorsunuz
    - Paketlenmiş comfy Plugin config anahtarlarına ihtiyacınız var
summary: OpenClaw içinde ComfyUI iş akışı görseli, video ve müzik üretimi kurulumu
title: ComfyUI
x-i18n:
    generated_at: "2026-04-25T13:55:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenClaw, iş akışı tabanlı ComfyUI çalıştırmaları için paketlenmiş bir `comfy` Plugin'i ile gelir. Plugin tamamen iş akışı odaklıdır; bu nedenle OpenClaw genel `size`, `aspectRatio`, `resolution`, `durationSeconds` veya TTS tarzı denetimleri grafiğinize eşlemeye çalışmaz.

| Özellik        | Ayrıntı                                                                          |
| -------------- | -------------------------------------------------------------------------------- |
| Sağlayıcı      | `comfy`                                                                          |
| Modeller       | `comfy/workflow`                                                                 |
| Paylaşılan yüzeyler | `image_generate`, `video_generate`, `music_generate`                        |
| Kimlik doğrulama | Yerel ComfyUI için yok; Comfy Cloud için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| API            | ComfyUI `/prompt` / `/history` / `/view` ve Comfy Cloud `/api/*`                 |

## Destekledikleri

- Bir iş akışı JSON'undan görsel üretimi
- 1 yüklenmiş referans görselle görsel düzenleme
- Bir iş akışı JSON'undan video üretimi
- 1 yüklenmiş referans görselle video üretimi
- Paylaşılan `music_generate` aracı üzerinden müzik veya ses üretimi
- Yapılandırılmış bir node'dan veya eşleşen tüm çıktı node'larından çıktı indirme

## Başlarken

ComfyUI'ı kendi makinenizde çalıştırma veya Comfy Cloud kullanma arasında seçim yapın.

<Tabs>
  <Tab title="Yerel">
    **En iyisi:** Kendi ComfyUI örneğinizi makinenizde veya LAN üzerinde çalıştırmak.

    <Steps>
      <Step title="ComfyUI'ı yerelde başlatın">
        Yerel ComfyUI örneğinizin çalıştığından emin olun (varsayılan `http://127.0.0.1:8188`).
      </Step>
      <Step title="İş akışı JSON'unuzu hazırlayın">
        Bir ComfyUI iş akışı JSON dosyasını dışa aktarın veya oluşturun. Prompt girdi node'u ile OpenClaw'ın okuyacağı çıktı node'u için node kimliklerini not edin.
      </Step>
      <Step title="Sağlayıcıyı yapılandırın">
        `mode: "local"` ayarlayın ve iş akışı dosyanıza işaret edin. Burada en düşük bir görsel örneği bulunuyor:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
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
    **En iyisi:** Yerel GPU kaynaklarını yönetmeden iş akışlarını Comfy Cloud üzerinde çalıştırmak.

    <Steps>
      <Step title="Bir API anahtarı alın">
        [comfy.org](https://comfy.org) adresinden kaydolun ve hesap kontrol panelinizden bir API anahtarı oluşturun.
      </Step>
      <Step title="API anahtarını ayarlayın">
        Anahtarınızı şu yöntemlerden biriyle sağlayın:

        ```bash
        # Ortam değişkeni (tercih edilen)
        export COMFY_API_KEY="your-key"

        # Alternatif ortam değişkeni
        export COMFY_CLOUD_API_KEY="your-key"

        # Veya doğrudan config içinde
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="İş akışı JSON'unuzu hazırlayın">
        Bir ComfyUI iş akışı JSON dosyasını dışa aktarın veya oluşturun. Prompt girdi node'u ile çıktı node'u için node kimliklerini not edin.
      </Step>
      <Step title="Sağlayıcıyı yapılandırın">
        `mode: "cloud"` ayarlayın ve iş akışı dosyanıza işaret edin:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        Cloud modu `baseUrl` değerini varsayılan olarak `https://cloud.comfy.org` yapar. `baseUrl` değerini yalnızca özel bir bulut uç noktası kullanıyorsanız ayarlamanız gerekir.
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
  plugins: {
    entries: {
      comfy: {
        config: {
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
  },
}
```

### Paylaşılan anahtarlar

| Anahtar              | Tür                    | Açıklama                                                                              |
| -------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`               | `"local"` veya `"cloud"` | Bağlantı modu.                                                                      |
| `baseUrl`            | string                 | Yerel için varsayılan `http://127.0.0.1:8188`, bulut için `https://cloud.comfy.org`. |
| `apiKey`             | string                 | İsteğe bağlı doğrudan anahtar; `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` env değişkenlerine alternatiftir. |
| `allowPrivateNetwork`| boolean                | Cloud modunda özel/LAN `baseUrl` değerine izin verir.                                 |

### Yetenek başına anahtarlar

Bu anahtarlar `image`, `video` veya `music` bölümleri içinde geçerlidir:

| Anahtar                      | Gerekli | Varsayılan | Açıklama                                                                   |
| ---------------------------- | ------- | ---------- | -------------------------------------------------------------------------- |
| `workflow` veya `workflowPath` | Evet  | --         | ComfyUI iş akışı JSON dosyasının yolu.                                     |
| `promptNodeId`               | Evet    | --         | Metin prompt'unu alan node kimliği.                                        |
| `promptInputName`            | Hayır   | `"text"`   | Prompt node'u üzerindeki girdi adı.                                        |
| `outputNodeId`               | Hayır   | --         | Çıktının okunacağı node kimliği. Atlanırsa, eşleşen tüm çıktı node'ları kullanılır. |
| `pollIntervalMs`             | Hayır   | --         | İş tamamlanması için milisaniye cinsinden yoklama aralığı.                 |
| `timeoutMs`                  | Hayır   | --         | İş akışı çalıştırması için milisaniye cinsinden zaman aşımı.               |

`image` ve `video` bölümleri ayrıca şunları da destekler:

| Anahtar               | Gerekli                             | Varsayılan | Açıklama                                            |
| --------------------- | ----------------------------------- | ---------- | --------------------------------------------------- |
| `inputImageNodeId`    | Evet (referans görsel geçirilirken) | --         | Yüklenmiş referans görseli alan node kimliği.       |
| `inputImageInputName` | Hayır                               | `"image"`  | Görsel node'u üzerindeki girdi adı.                 |

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

    **Referans görsel düzenleme örneği:**

    Yüklenmiş bir referans görselle görsel düzenlemeyi etkinleştirmek için görsel config'inize `inputImageNodeId` ekleyin:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
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
    OpenClaw, giriş videolarını Comfy iş akışlarına geçirmez. Girdi olarak yalnızca metin prompt'ları ve tekil referans görseller desteklenir.
    </Note>

  </Accordion>

  <Accordion title="Müzik iş akışları">
    Paketlenmiş Plugin, iş akışıyla tanımlanan ses veya müzik çıktıları için shared `music_generate` aracı üzerinden sunulan bir müzik üretim sağlayıcısı kaydeder:

    ```text
    /tool music_generate prompt="Sıcak ambient synth loop, yumuşak tape dokulu"
    ```

    Ses iş akışı JSON'unuza ve çıktı node'unuza işaret etmek için `music` config bölümünü kullanın.

  </Accordion>

  <Accordion title="Geriye dönük uyumluluk">
    Mevcut üst düzey görsel config'i (`image` iç içe bölümü olmadan) hâlâ çalışır:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw, bu eski biçimi görsel iş akışı config'i olarak ele alır. Hemen taşımanız gerekmez, ancak yeni kurulumlar için iç içe `image` / `video` / `music` bölümleri önerilir.

    <Tip>
    Yalnızca görsel üretimi kullanıyorsanız, eski düz config ile yeni iç içe `image` bölümü işlevsel olarak eşdeğerdir.
    </Tip>

  </Accordion>

  <Accordion title="Canlı testler">
    Paketlenmiş Plugin için isteğe bağlı canlı kapsama mevcuttur:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Eşleşen Comfy iş akışı bölümü yapılandırılmamışsa canlı test, tek tek görsel, video veya müzik vakalarını atlar.

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
    Tüm sağlayıcılara ve model referanslarına genel bakış.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Aracı varsayılanları dâhil tam yapılandırma başvurusu.
  </Card>
</CardGroup>

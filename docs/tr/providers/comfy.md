---
read_when:
    - OpenClaw ile yerel ComfyUI iş akışlarını kullanmak istiyorsunuz
    - Comfy Cloud'u görüntü, video veya müzik iş akışlarıyla kullanmak istiyorsunuz
    - Paketle birlikte gelen comfy Plugin yapılandırma anahtarlarına ihtiyacınız var
summary: OpenClaw'da ComfyUI iş akışıyla görsel, video ve müzik üretimi kurulumu
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T12:39:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw, iş akışı odaklı ComfyUI çalıştırmaları için paketle birlikte gelen bir `comfy` Plugin'i sunar. Plugin tamamen iş akışı odaklıdır: OpenClaw genel `size`, `aspectRatio`, `resolution`, `durationSeconds` veya TTS tarzı denetimleri grafiğinizle eşleştirmez.

| Özellik          | Ayrıntı                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| Sağlayıcı        | `comfy`                                                                                 |
| Model            | `comfy/workflow`                                                                        |
| Paylaşılan araçlar | `image_generate`, `video_generate`, `music_generate`                                  |
| Kimlik doğrulama | Yerel ComfyUI için yoktur; Comfy Cloud için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| API              | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                          |

## Desteklenenler

- Bir iş akışı JSON'undan görüntü oluşturma ve düzenleme (düzenleme için yüklenmiş 1 referans görüntü gerekir)
- Bir iş akışı JSON'undan metinden videoya veya görüntüden videoya video oluşturma (1 referans görüntü)
- İsteğe bağlı 1 referans görüntüyle, paylaşılan `music_generate` aracı üzerinden müzik/ses oluşturma
- Yapılandırılmış bir Node'dan veya herhangi bir Node yapılandırılmamışsa eşleşen tüm çıktı Node'larından çıktıyı indirme

## Başlarken

ComfyUI'yi kendi makinenizde çalıştırmak ile Comfy Cloud'u kullanmak arasında seçim yapın.

<Tabs>
  <Tab title="Yerel">
    **Şunlar için idealdir:** kendi ComfyUI örneğinizi makinenizde veya LAN'ınızda çalıştırmak.

    <Steps>
      <Step title="ComfyUI'yi yerel olarak başlatın">
        Yerel ComfyUI örneğinizin çalıştığından emin olun (varsayılan adres `http://127.0.0.1:8188`).
      </Step>
      <Step title="İş akışı JSON'unuzu hazırlayın">
        Bir ComfyUI iş akışı JSON dosyasını dışa aktarın veya oluşturun. İstem girişi Node'u ile OpenClaw'un okuyacağı çıktı Node'unun kimliklerini not edin.
      </Step>
      <Step title="Sağlayıcıyı yapılandırın">
        `mode: "local"` değerini ayarlayın ve iş akışı dosyanızı belirtin. Asgari görüntü örneği:

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
        OpenClaw'u yapılandırdığınız yetenek için `comfy/workflow` modeline yönlendirin:

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
    **Şunlar için idealdir:** yerel GPU kaynaklarını yönetmeden Comfy Cloud üzerinde iş akışları çalıştırmak.

    <Steps>
      <Step title="Bir API anahtarı alın">
        [comfy.org](https://comfy.org) üzerinden kaydolun ve hesap panonuzdan bir API anahtarı oluşturun.
      </Step>
      <Step title="API anahtarını ayarlayın">
        Anahtarınızı şu yöntemlerden biriyle sağlayın:

        ```bash
        # Onboarding flag
        openclaw onboard --comfy-api-key "your-key"

        # Environment variable (preferred for daemons)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="İş akışı JSON'unuzu hazırlayın">
        Bir ComfyUI iş akışı JSON dosyasını dışa aktarın veya oluşturun. İstem girişi Node'u ile çıktı Node'unun kimliklerini not edin.
      </Step>
      <Step title="Sağlayıcıyı yapılandırın">
        `mode: "cloud"` değerini ayarlayın ve iş akışı dosyanızı belirtin:

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
        Bulut modunda `baseUrl` varsayılan olarak `https://cloud.comfy.org` değerini kullanır. `baseUrl` değerini yalnızca özel bir bulut uç noktası için ayarlayın.
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

Comfy, paylaşılan üst düzey bağlantı ayarlarının yanı sıra yetenek başına iş akışı bölümlerini (`image`, `video`, `music`) destekler:

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

| Anahtar               | Tür                         | Açıklama                                                                                 |
| --------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| `mode`                | `"local"` veya `"cloud"`    | Bağlantı modu. Varsayılan değer `"local"`dır.                                            |
| `baseUrl`             | dize                        | Yerel mod için varsayılan değer `http://127.0.0.1:8188`, bulut modu için `https://cloud.comfy.org` değeridir. |
| `apiKey`              | dize                        | İsteğe bağlı satır içi anahtar; `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` ortam değişkenlerine alternatiftir. |
| `allowPrivateNetwork` | boole                       | Bulut modunda özel/LAN `baseUrl` adresine veya yerel bir özel DNS FQDN'sine izin verir.  |

<Note>
`local` modunda, geri döngü/özel IP değişmezleri ve `http://comfyui:8188` gibi tek etiketli hizmet adları `allowPrivateNetwork` olmadan çalışır. `https://comfy.local.example.com` gibi herkese açık görünen özel DNS FQDN'leri `allowPrivateNetwork: true` gerektirir. Özel kaynak güveni, yapılandırılmış şema, ana makine adı ve bağlantı noktasıyla sınırlı kalır; yerel yönlendirmeler yapılandırılmış ana makine adının dışına çıkamazken herkese açık CDN'lere yapılan bulut yönlendirmeleri varsayılan SSRF ilkesiyle denetlenir.
</Note>

### Yetenek başına anahtarlar

Bu anahtarlar `image`, `video` veya `music` bölümlerinde geçerlidir:

| Anahtar                      | Gerekli | Varsayılan | Açıklama                                                                    |
| ---------------------------- | ------- | ---------- | --------------------------------------------------------------------------- |
| `workflow` veya `workflowPath` | Evet  | --         | Satır içi iş akışı JSON'u veya ComfyUI iş akışı JSON dosyasının yolu.       |
| `promptNodeId`               | Evet    | --         | Metin istemini alan Node kimliği.                                           |
| `promptInputName`            | Hayır   | `"text"`   | İstem Node'undaki giriş adı.                                                 |
| `outputNodeId`               | Hayır   | --         | Çıktının okunacağı Node kimliği. Belirtilmezse eşleşen tüm çıktı Node'ları kullanılır. |
| `pollIntervalMs`             | Hayır   | `1500`     | İşin tamamlanması için milisaniye cinsinden yoklama aralığı.                 |
| `timeoutMs`                  | Hayır   | `300000`   | İş akışı çalıştırması için milisaniye cinsinden zaman aşımı.                 |

`image` ve `video` bölümleri ayrıca bir referans görüntü girişi Node'unu destekler:

| Anahtar               | Gerekli                                      | Varsayılan | Açıklama                                    |
| --------------------- | -------------------------------------------- | ---------- | ------------------------------------------- |
| `inputImageNodeId`    | Evet (referans görüntü aktarılırken)         | --         | Yüklenen referans görüntüyü alan Node kimliği. |
| `inputImageInputName` | Hayır                                        | `"image"`  | Görüntü Node'undaki giriş adı.              |

`apiKey`, değişmez bir dizeyi veya bir [gizli bilgi referansı](/tr/gateway/configuration-reference#secrets) nesnesini kabul eder.

## İş akışı ayrıntıları

<AccordionGroup>
  <Accordion title="Görüntü iş akışları">
    Varsayılan görüntü modelini `comfy/workflow` olarak ayarlayın:

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

    **Referans görüntüyle düzenleme örneği:**

    Yüklenmiş bir referans görüntüyle görüntü düzenlemeyi etkinleştirmek için görüntü yapılandırmanıza `inputImageNodeId` ekleyin:

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

    Comfy video iş akışları, yapılandırılmış grafik üzerinden metinden videoya ve görüntüden videoya oluşturmayı destekler.

    <Note>
    OpenClaw, giriş videolarını Comfy iş akışlarına aktarmaz. Giriş olarak yalnızca metin istemleri ve tek bir referans görüntü desteklenir.
    </Note>

  </Accordion>

  <Accordion title="Müzik iş akışları">
    Paketle birlikte gelen Plugin, iş akışıyla tanımlanan ses veya müzik çıktıları için bir müzik oluşturma sağlayıcısı kaydeder ve bunu paylaşılan `music_generate` aracı üzerinden sunar. İsteğe bağlı bir referans görüntüyü kabul eder (en fazla 1):

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Ses iş akışı JSON'unuzu ve çıktı Node'unuzu belirtmek için `music` yapılandırma bölümünü kullanın.

  </Accordion>

  <Accordion title="Geriye dönük uyumluluk">
    Mevcut üst düzey görüntü yapılandırması (iç içe `image` bölümü olmadan) çalışmaya devam eder:

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

    OpenClaw bu eski biçimi görüntü iş akışı yapılandırması olarak değerlendirir. Hemen geçiş yapmanız gerekmez, ancak yeni kurulumlar için iç içe `image` / `video` / `music` bölümleri önerilir. Yalnızca görüntü oluşturmayı kullanıyorsanız eski düz yapılandırma ile yeni iç içe `image` bölümü işlevsel olarak eşdeğerdir.

  </Accordion>

  <Accordion title="Canlı testler">
    Paketle birlikte gelen Plugin için isteğe bağlı canlı test kapsamı mevcuttur:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Canlı test, eşleşen Comfy iş akışı bölümü yapılandırılmadığı sürece ayrı ayrı görüntü, video veya müzik durumlarını atlar.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Görüntü Oluşturma" href="/tr/tools/image-generation" icon="image">
    Görüntü oluşturma aracı yapılandırması ve kullanımı.
  </Card>
  <Card title="Video Oluşturma" href="/tr/tools/video-generation" icon="video">
    Video oluşturma aracı yapılandırması ve kullanımı.
  </Card>
  <Card title="Müzik Oluşturma" href="/tr/tools/music-generation" icon="music">
    Müzik ve ses oluşturma aracı kurulumu.
  </Card>
  <Card title="Sağlayıcı Dizini" href="/tr/providers/index" icon="layers">
    Tüm sağlayıcılara ve model referanslarına genel bakış.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Ajan varsayılanları dâhil eksiksiz yapılandırma referansı.
  </Card>
</CardGroup>

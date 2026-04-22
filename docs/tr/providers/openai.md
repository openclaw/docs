---
read_when:
    - OpenClaw'da OpenAI modellerini kullanmak istiyorsunuz
    - API anahtarları yerine Codex abonelik kimlik doğrulaması istiyorsunuz
    - Daha katı GPT-5 ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw'da OpenAI'ı API anahtarları veya Codex aboneliği ile kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-04-22T04:27:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692615b77885c0387d339d47c02ff056ba95d3608aa681882893a46d2a0f723f
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI, GPT modelleri için geliştirici API'leri sağlar. OpenClaw iki kimlik doğrulama yolunu destekler:

- **API anahtarı** — kullanım bazlı faturalandırma ile doğrudan OpenAI Platform erişimi (`openai/*` modelleri)
- **Codex aboneliği** — abonelik erişimi ile ChatGPT/Codex oturumu (`openai-codex/*` modelleri)

OpenAI, OpenClaw gibi harici araçlar ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **En iyisi:** doğrudan API erişimi ve kullanım bazlı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) üzerinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Veya anahtarı doğrudan iletin:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Rota özeti

    | Model ref | Rota | Kimlik doğrulama |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codex oturumu `openai/*` değil, `openai-codex/*` üzerinden yönlendirilir.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw, doğrudan API yolunda `openai/gpt-5.3-codex-spark` sunmaz. Canlı OpenAI API istekleri bu modeli reddeder. Spark yalnızca Codex içindir.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **En iyisi:** ayrı bir API anahtarı yerine ChatGPT/Codex aboneliğinizi kullanmak. Codex cloud, ChatGPT oturumu gerektirir.

    <Steps>
      <Step title="Codex OAuth'u çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Veya OAuth'u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Varsayılan modeli ayarlayın">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Rota özeti

    | Model ref | Rota | Kimlik doğrulama |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codex oturumu |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codex oturumu (hak sahipliğine bağlı) |

    <Note>
    Bu yol bilerek `openai/gpt-5.4` yolundan ayrıdır. Doğrudan Platform erişimi için API anahtarıyla `openai/*`, Codex abonelik erişimi için `openai-codex/*` kullanın.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Onboarding mevcut bir Codex CLI girişini yeniden kullanırsa, bu kimlik bilgileri Codex CLI tarafından yönetilmeye devam eder. Süresi dolduğunda OpenClaw önce harici Codex kaynağını yeniden okur ve yenilenen kimlik bilgisini tekrar Codex deposuna yazar.
    </Tip>

    ### Bağlam penceresi sınırı

    OpenClaw, model meta verilerini ve çalışma zamanı bağlam sınırını ayrı değerler olarak ele alır.

    `openai-codex/gpt-5.4` için:

    - Yerel `contextWindow`: `1050000`
    - Varsayılan çalışma zamanı `contextTokens` sınırı: `272000`

    Daha küçük varsayılan sınır uygulamada daha iyi gecikme ve kalite özelliklerine sahiptir. Bunu `contextTokens` ile geçersiz kılın:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Yerel model meta verisini bildirmek için `contextWindow` kullanın. Çalışma zamanı bağlam bütçesini sınırlamak için `contextTokens` kullanın.
    </Note>

  </Tab>
</Tabs>

## Görsel oluşturma

Paketle gelen `openai` plugin'i, `image_generate` aracı üzerinden görsel oluşturmayı kaydeder.

| Yetenek                  | Değer                              |
| ------------------------ | ---------------------------------- |
| Varsayılan model         | `openai/gpt-image-2`               |
| İstek başına en fazla görsel | 4                              |
| Düzenleme modu           | Etkin (en fazla 5 referans görsel) |
| Boyut geçersiz kılmaları | Desteklenir, 2K/4K boyutlar dahil  |
| En-boy oranı / çözünürlük | OpenAI Images API'ye iletilmez |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Image Generation](/tr/tools/image-generation) bölümüne bakın.
</Note>

`gpt-image-2`, hem OpenAI metinden görsele oluşturma hem de görsel
düzenleme için varsayılandır. `gpt-image-1` açık model geçersiz kılması olarak
kullanılabilir olmaya devam eder, ancak yeni OpenAI görsel iş akışları
`openai/gpt-image-2` kullanmalıdır.

Oluştur:

```
/tool image_generate model=openai/gpt-image-2 prompt="macOS üzerinde OpenClaw için cilalı bir lansman posteri" size=3840x2160 count=1
```

Düzenle:

```
/tool image_generate model=openai/gpt-image-2 prompt="Nesne şeklini koru, malzemeyi yarı saydam cama dönüştür" image=/path/to/reference.png size=1024x1536
```

## Video oluşturma

Paketle gelen `openai` plugin'i, `video_generate` aracı üzerinden video oluşturmayı kaydeder.

| Yetenek         | Değer                                                                             |
| --------------- | --------------------------------------------------------------------------------- |
| Varsayılan model | `openai/sora-2`                                                                  |
| Modlar          | Metinden videoya, görselden videoya, tek videolu düzenleme                       |
| Referans girdileri | 1 görsel veya 1 video                                                          |
| Boyut geçersiz kılmaları | Desteklenir                                                              |
| Diğer geçersiz kılmalar | `aspectRatio`, `resolution`, `audio`, `watermark` bir araç uyarısıyla yok sayılır |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Video Generation](/tr/tools/video-generation) bölümüne bakın.
</Note>

## GPT-5 prompt katkısı

OpenClaw, `openai/*` ve `openai-codex/*` GPT-5 ailesi çalıştırmaları için OpenAI'ya özgü bir GPT-5 prompt katkısı ekler. Bu katkı paketle gelen OpenAI plugin'inde bulunur, `gpt-5`, `gpt-5.2`, `gpt-5.4` ve `gpt-5.4-mini` gibi model kimliklerine uygulanır ve eski GPT-4.x modellerine uygulanmaz.

GPT-5 katkısı; persona kalıcılığı, yürütme güvenliği, araç disiplini, çıktı şekli, tamamlama kontrolleri ve doğrulama için etiketlenmiş bir davranış sözleşmesi ekler. Kanala özgü yanıt ve sessiz mesaj davranışı, paylaşılan OpenClaw sistem prompt'unda ve giden teslimat ilkesinde kalır. GPT-5 yönlendirmesi eşleşen modeller için her zaman etkindir. Dostça etkileşim stili katmanı ayrıdır ve yapılandırılabilir.

| Değer                  | Etki                                        |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (varsayılan) | dostça etkileşim stili katmanını etkinleştirir |
| `"on"`                 | `"friendly"` için takma ad                  |
| `"off"`                | yalnızca dostça stil katmanını devre dışı bırakır |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Değerler çalışma anında büyük/küçük harfe duyarlı değildir; bu nedenle `"Off"` ve `"off"` ikisi de dostça stil katmanını devre dışı bırakır.
</Tip>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketle gelen `openai` plugin'i, `messages.tts` yüzeyi için konuşma sentezini kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Ses | `messages.tts.providers.openai.voice` | `coral` |
    | Hız | `messages.tts.providers.openai.speed` | (ayarsız) |
    | Yönergeler | `messages.tts.providers.openai.instructions` | (ayarsız, yalnızca `gpt-4o-mini-tts`) |
    | Biçim | `messages.tts.providers.openai.responseFormat` | sesli notlar için `opus`, dosyalar için `mp3` |
    | API anahtarı | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Kullanılabilir modeller: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Kullanılabilir sesler: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Sohbet API uç noktasını etkilemeden TTS base URL'sini geçersiz kılmak için `OPENAI_TTS_BASE_URL` ayarlayın.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı transkripsiyon">
    Paketle gelen `openai` plugin'i, Voice Call plugin'i için gerçek zamanlı transkripsiyonu kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    `wss://api.openai.com/v1/realtime` adresine G.711 u-law ses ile bir WebSocket bağlantısı kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Paketle gelen `openai` plugin'i, Voice Call plugin'i için gerçek zamanlı sesi kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Ses | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    `azureEndpoint` ve `azureDeployment` yapılandırma anahtarları üzerinden Azure OpenAI'ı destekler. Çift yönlü araç çağırmayı destekler. G.711 u-law ses biçimini kullanır.
    </Note>

  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Taşıma (WebSocket ve SSE)">
    OpenClaw, hem `openai/*` hem `openai-codex/*` için SSE geri dönüşlü WebSocket öncelikli (`"auto"`) kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye geri düşmeden önce erken bir WebSocket hatasını bir kez yeniden dener
    - Bir hatadan sonra WebSocket'i yaklaşık 60 saniye boyunca bozulmuş olarak işaretler ve soğuma sırasında SSE kullanır
    - Yeniden denemeler ve yeniden bağlantılar için kararlı oturum ve dönüş kimliği başlıkları ekler
    - Taşıma varyantları arasında kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) normalize eder

    | Değer | Davranış |
    |-------|----------|
    | `"auto"` (varsayılan) | Önce WebSocket, SSE geri dönüşü |
    | `"sse"` | Yalnızca SSE'yi zorla |
    | `"websocket"` | Yalnızca WebSocket'i zorla |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    İlgili OpenAI belgeleri:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket ısınması">
    OpenClaw, ilk dönüş gecikmesini azaltmak için `openai/*` için varsayılan olarak WebSocket ısınmasını etkinleştirir.

    ```json5
    // Isınmayı devre dışı bırak
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Hızlı mod">
    OpenClaw, hem `openai/*` hem `openai-codex/*` için paylaşılan bir hızlı mod anahtarı sunar:

    - **Sohbet/UI:** `/fast status|on|off`
    - **Yapılandırma:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Etkinleştirildiğinde OpenClaw, hızlı modu OpenAI öncelikli işleme ile eşler (`service_tier = "priority"`). Mevcut `service_tier` değerleri korunur ve hızlı mod `reasoning` veya `text.verbosity` alanlarını yeniden yazmaz.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Oturum geçersiz kılmaları yapılandırmaya üstün gelir. Sessions UI'da oturum geçersiz kılmasını temizlemek, oturumu yeniden yapılandırılmış varsayılana döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (service_tier)">
    OpenAI API'si, `service_tier` aracılığıyla öncelikli işlemeyi sunar. OpenClaw'da bunu model başına ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Desteklenen değerler: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. Her iki sağlayıcıyı da bir proxy üzerinden yönlendirirseniz, OpenClaw `service_tier` alanına dokunmadan bırakır.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu tarafı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri için (`api.openai.com` üzerindeki `openai/*`), OpenClaw sunucu tarafı Compaction'ı otomatik etkinleştirir:

    - `store: true` değerini zorlar (`supportsStore: false` ayarlayan model uyumluluğu yoksa)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` enjekte eder
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya yoksa `80000`)

    <Tabs>
      <Tab title="Açıkça etkinleştir">
        Azure OpenAI Responses gibi uyumlu uç noktalar için kullanışlıdır:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Özel eşik">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Devre dışı bırak">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` yalnızca `context_management` enjeksiyonunu kontrol eder. Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadığı sürece yine `store: true` değerini zorlar.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT modu">
    `openai/*` ve `openai-codex/*` üzerindeki GPT-5 ailesi çalıştırmaları için OpenClaw daha katı bir gömülü yürütme sözleşmesi kullanabilir:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` ile OpenClaw:
    - Bir araç eylemi mevcut olduğunda yalnızca plan içeren dönüşü artık başarılı ilerleme olarak görmez
    - Dönüşü şimdi-eyleme-geç yönlendirmesi ile yeniden dener
    - Önemli işler için `update_plan` seçeneğini otomatik etkinleştirir
    - Model eyleme geçmeden planlamayı sürdürürse açık bir engellenmiş durum gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmalarına kapsamlanır. Diğer sağlayıcılar ve daha eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu rotalar">
    OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy'lerinden farklı ele alır:

    **Yerel rotalar** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - `reasoning: { effort: "none" }` değerini yalnızca OpenAI `none` effort değerini destekleyen modeller için korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için devre dışı reasoning'i atlar
    - Araç şemalarını varsayılan olarak strict moda getirir
    - Gizli ilişkilendirme başlıklarını yalnızca doğrulanmış yerel ana makinelerde ekler
    - Yalnızca OpenAI'a özgü istek şekillendirmeyi korur (`service_tier`, `store`, reasoning uyumluluğu, prompt-cache ipuçları)

    **Proxy/uyumlu rotalar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Strict araç şemalarını veya yalnızca yerel başlıkları zorlamaz

    Azure OpenAI, yerel taşıma ve uyumluluk davranışını kullanır ancak gizli ilişkilendirme başlıklarını almaz.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Görsel oluşturma" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="OAuth ve auth" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>

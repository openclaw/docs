---
read_when:
    - OpenClaw içinde OpenAI modellerini kullanmak istiyorsunuz
    - API key’ler yerine Codex abonelik kimlik doğrulamasını istiyorsunuz
    - GPT-5 için daha sıkı ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw içinde OpenAI’ı API key’leri veya Codex aboneliği ile kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-04-12T23:32:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aeb756618c5611fed56e4bf89015a2304ff2e21596104b470ec6e7cb459d1c9
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI, GPT modelleri için geliştirici API’leri sunar. OpenClaw iki kimlik doğrulama yolunu destekler:

- **API key** — kullanım bazlı faturalandırma ile doğrudan OpenAI Platform erişimi (`openai/*` modelleri)
- **Codex aboneliği** — abonelik erişimiyle ChatGPT/Codex oturum açma (`openai-codex/*` modelleri)

OpenAI, OpenClaw gibi harici araçlar ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

## Başlangıç

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **En iyisi:** doğrudan API erişimi ve kullanım bazlı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) üzerinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Başlangıç kurulumunu çalıştırın">
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

    ### Yol özeti

    | Model ref | Yol | Kimlik doğrulama |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codex oturum açma, `openai/*` yerine `openai-codex/*` üzerinden yönlendirilir.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw, `openai/gpt-5.3-codex-spark` modelini doğrudan API yolunda **sunmaz**. Canlı OpenAI API istekleri bu modeli reddeder. Spark yalnızca Codex içindir.
    </Warning>

  </Tab>

  <Tab title="Codex aboneliği">
    **En iyisi:** ayrı bir API anahtarı yerine ChatGPT/Codex aboneliğinizi kullanmak. Codex cloud, ChatGPT oturum açmayı gerektirir.

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

    ### Yol özeti

    | Model ref | Yol | Kimlik doğrulama |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codex oturum açma |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codex oturum açma (hak sahipliğine bağlı) |

    <Note>
    Bu yol, `openai/gpt-5.4` yolundan kasıtlı olarak ayrıdır. Doğrudan Platform erişimi için API key ile `openai/*`, Codex abonelik erişimi için ise `openai-codex/*` kullanın.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Başlangıç kurulumu mevcut bir Codex CLI oturumunu yeniden kullanırsa bu kimlik bilgileri Codex CLI tarafından yönetilmeye devam eder. Süresi dolduğunda OpenClaw önce harici Codex kaynağını yeniden okur ve yenilenmiş kimlik bilgisini tekrar Codex depolamasına yazar.
    </Tip>

    ### Bağlam penceresi sınırı

    OpenClaw, model meta verilerini ve çalışma zamanı bağlam sınırını ayrı değerler olarak ele alır.

    `openai-codex/gpt-5.4` için:

    - Yerel `contextWindow`: `1050000`
    - Varsayılan çalışma zamanı `contextTokens` sınırı: `272000`

    Daha küçük varsayılan sınır, pratikte daha iyi gecikme ve kalite özellikleri sunar. Bunu `contextTokens` ile geçersiz kılın:

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
    Yerel model meta verilerini belirtmek için `contextWindow` kullanın. Çalışma zamanı bağlam bütçesini sınırlamak için `contextTokens` kullanın.
    </Note>

  </Tab>
</Tabs>

## Görüntü oluşturma

Paketlenmiş `openai` Plugin'i, `image_generate` aracı üzerinden görüntü oluşturmayı kaydeder.

| Yetenek                  | Değer                              |
| ------------------------- | ---------------------------------- |
| Varsayılan model          | `openai/gpt-image-1`               |
| İstek başına en fazla görüntü | 4                              |
| Düzenleme modu            | Etkin (en fazla 5 referans görüntü) |
| Boyut geçersiz kılmaları  | Desteklenir                        |
| En boy oranı / çözünürlük | OpenAI Images API’ye iletilmez     |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-1" },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Image Generation](/tr/tools/image-generation) bölümüne bakın.
</Note>

## Video oluşturma

Paketlenmiş `openai` Plugin'i, `video_generate` aracı üzerinden video oluşturmayı kaydeder.

| Yetenek          | Değer                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| Varsayılan model | `openai/sora-2`                                                                  |
| Modlar           | Metinden videoya, görüntüden videoya, tek video düzenleme                        |
| Referans girdileri | 1 görüntü veya 1 video                                                         |
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Generation](/tr/tools/video-generation) bölümüne bakın.
</Note>

## Kişilik katmanı

OpenClaw, `openai/*` ve `openai-codex/*` çalıştırmaları için OpenAI’ya özgü küçük bir istem katmanı ekler. Bu katman, temel sistem isteminin yerini almadan asistanı sıcak, işbirlikçi, özlü ve duygusal olarak biraz daha dışavurumlu tutar.

| Değer                 | Etki                               |
| --------------------- | ---------------------------------- |
| `"friendly"` (varsayılan) | OpenAI’ya özgü katmanı etkinleştir |
| `"on"`                | `"friendly"` için takma ad         |
| `"off"`               | Yalnızca temel OpenClaw istemini kullan |

<Tabs>
  <Tab title="Yapılandırma">
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
Değerler çalışma zamanında büyük/küçük harfe duyarsızdır; bu nedenle `"Off"` ve `"off"` ikisi de katmanı devre dışı bırakır.
</Tip>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketlenmiş `openai` Plugin'i, `messages.tts` yüzeyi için konuşma sentezini kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Ses | `messages.tts.providers.openai.voice` | `coral` |
    | Hız | `messages.tts.providers.openai.speed` | (ayarlanmamış) |
    | Yönergeler | `messages.tts.providers.openai.instructions` | (ayarlanmamış, yalnızca `gpt-4o-mini-tts`) |
    | Biçim | `messages.tts.providers.openai.responseFormat` | sesli notlar için `opus`, dosyalar için `mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |
    | Temel URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Sohbet API uç noktasını etkilemeden TTS temel URL’sini geçersiz kılmak için `OPENAI_TTS_BASE_URL` ayarlayın.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı transkripsiyon">
    Paketlenmiş `openai` Plugin'i, Voice Call Plugin'i için gerçek zamanlı transkripsiyonu kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    G.711 u-law ses ile `wss://api.openai.com/v1/realtime` adresine bir WebSocket bağlantısı kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Paketlenmiş `openai` Plugin'i, Voice Call Plugin'i için gerçek zamanlı sesi kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Ses | `...openai.voice` | `alloy` |
    | Sıcaklık | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    `azureEndpoint` ve `azureDeployment` yapılandırma anahtarları aracılığıyla Azure OpenAI’ı destekler. Çift yönlü araç çağırmayı destekler. G.711 u-law ses biçimini kullanır.
    </Note>

  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Aktarım (WebSocket ve SSE)">
    OpenClaw, hem `openai/*` hem de `openai-codex/*` için önce WebSocket ve ardından SSE geri dönüşü (`"auto"`) kullanır.

    `"auto"` modunda OpenClaw:
    - SSE’ye geri dönmeden önce bir erken WebSocket hatasını yeniden dener
    - Bir hatadan sonra WebSocket’i yaklaşık 60 saniye boyunca bozulmuş olarak işaretler ve soğuma süresince SSE kullanır
    - Yeniden denemeler ve yeniden bağlantılar için kararlı oturum ve tur kimliği üst bilgileri ekler
    - Aktarım varyantları arasında kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) normalize eder

    | Değer | Davranış |
    |-------|----------|
    | `"auto"` (varsayılan) | Önce WebSocket, SSE geri dönüşü |
    | `"sse"` | Yalnızca SSE’yi zorla |
    | `"websocket"` | Yalnızca WebSocket’i zorla |

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
    OpenClaw, ilk tur gecikmesini azaltmak için `openai/*` için varsayılan olarak WebSocket ısınmasını etkinleştirir.

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
    OpenClaw, hem `openai/*` hem de `openai-codex/*` için paylaşılan bir hızlı mod anahtarı sunar:

    - **Sohbet/UI:** `/fast status|on|off`
    - **Yapılandırma:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Etkinleştirildiğinde OpenClaw, hızlı modu OpenAI öncelikli işlemeye eşler (`service_tier = "priority"`). Mevcut `service_tier` değerleri korunur ve hızlı mod `reasoning` veya `text.verbosity` değerlerini yeniden yazmaz.

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
    Oturum geçersiz kılmaları yapılandırmaya üstün gelir. Sessions UI içinde oturum geçersiz kılmasını temizlemek, oturumu yapılandırılmış varsayılana geri döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (service_tier)">
    OpenAI API’si, `service_tier` aracılığıyla öncelikli işleme sunar. Bunu OpenClaw içinde model başına ayarlayın:

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
    `serviceTier` yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. Her iki sağlayıcıyı da bir proxy üzerinden yönlendirirseniz OpenClaw `service_tier` değerine dokunmaz.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu tarafı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri için (`api.openai.com` üzerindeki `openai/*`) OpenClaw, sunucu tarafı Compaction özelliğini otomatik olarak etkinleştirir:

    - `store: true` değerini zorlar (`supportsStore: false` ayarlayan model uyumluluğu yoksa)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` ekler
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70’i (veya mevcut değilse `80000`)

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
    `responsesServerCompaction` yalnızca `context_management` eklemeyi kontrol eder. Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadığı sürece yine de `store: true` değerini zorlar.
    </Note>

  </Accordion>

  <Accordion title="Sıkı ajan temelli GPT modu">
    `openai/*` ve `openai-codex/*` üzerindeki GPT-5 ailesi çalıştırmaları için OpenClaw, daha sıkı bir gömülü yürütme sözleşmesi kullanabilir:

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
    - Bir araç eylemi kullanılabiliyorken artık yalnızca plan içeren bir turu başarılı ilerleme olarak değerlendirmez
    - Turu şimdi harekete geç yönlendirmesiyle yeniden dener
    - Önemli işler için `update_plan` özelliğini otomatik etkinleştirir
    - Model eyleme geçmeden plan yapmaya devam ederse açık bir engellenmiş durum gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmalarıyla sınırlıdır. Diğer sağlayıcılar ve daha eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu yollar">
    OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy’lerinden farklı şekilde ele alır:

    **Yerel yollar** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Akıl yürütme açıkça devre dışı bırakıldığında `reasoning: { effort: "none" }` değerini korur
    - Araç şemalarını varsayılan olarak sıkı moda ayarlar
    - Gizli atıf üst bilgilerini yalnızca doğrulanmış yerel ana makinelere ekler
    - Yalnızca OpenAI’a özgü istek şekillendirmesini korur (`service_tier`, `store`, reasoning-compat, prompt-cache ipuçları)

    **Proxy/uyumlu yollar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Sıkı araç şemalarını veya yalnızca yerel üst bilgileri zorlamaz

    Azure OpenAI, yerel aktarım ve uyumluluk davranışını kullanır ancak gizli atıf üst bilgilerini almaz.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Image Generation" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video Generation" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>

---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw’da modelleri OpenRouter üzerinden çalıştırmak istiyorsunuz
    - Görsel oluşturma için OpenRouter kullanmak istiyorsunuz
    - Müzik üretimi için OpenRouter kullanmak istiyorsunuz
    - Video oluşturma için OpenRouter kullanmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için OpenRouter'ın birleşik API'sini kullanın
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:56:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter, istekleri tek bir uç nokta ve API anahtarının arkasındaki birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

## Başlarken

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth katılımını çalıştırın">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw, OpenRouter'ın tarayıcı oturum açma akışını açar, PKCE
        kodunu bir OpenRouter API anahtarıyla değiştirir ve bu anahtarı varsayılan
        OpenRouter kimlik doğrulama profilinde saklar. Uzak/başsız ana makinelerde OpenClaw,
        oturum açma URL'sini yazdırır ve oturum açtıktan sonra yönlendirme URL'sini yapıştırmanızı ister.
      </Step>
      <Step title="(İsteğe bağlı) Belirli bir modele geçin">
        Katılım varsayılan olarak `openrouter/auto` kullanır. Daha sonra somut bir model seçin:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API anahtarı">
    <Steps>
      <Step title="API anahtarınızı alın">
        [openrouter.ai/keys](https://openrouter.ai/keys) adresinde bir API anahtarı oluşturun.
      </Step>
      <Step title="API anahtarı katılımını çalıştırın">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(İsteğe bağlı) Belirli bir modele geçin">
        Katılım varsayılan olarak `openrouter/auto` kullanır. Daha sonra somut bir model seçin:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Yapılandırma örneği

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Model başvuruları

<Note>
Model başvuruları `openrouter/<provider>/<model>` desenini izler. Kullanılabilir sağlayıcıların ve modellerin tam listesi için bkz. [/concepts/model-providers](/tr/concepts/model-providers).
</Note>

Paketlenmiş yedek örnekler:

| Model başvurusu                  | Notlar                         |
| --------------------------------- | ------------------------------ |
| `openrouter/auto`                 | OpenRouter otomatik yönlendirme |
| `openrouter/openrouter/fusion`    | OpenRouter Fusion yönlendiricisi |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI üzerinden Kimi K2.6  |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI üzerinden Kimi K2.5  |

## Görüntü üretimi

OpenRouter, `image_generate` aracını da destekleyebilir. `agents.defaults.imageGenerationModel` altında bir OpenRouter görüntü modeli kullanın:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw, görüntü isteklerini OpenRouter'ın sohbet tamamlama görüntü API'sine `modalities: ["image", "text"]` ile gönderir. Gemini görüntü modelleri, desteklenen `aspectRatio` ve `resolution` ipuçlarını OpenRouter'ın `image_config` yapılandırması üzerinden alır. Daha yavaş OpenRouter görüntü modelleri için `agents.defaults.imageGenerationModel.timeoutMs` kullanın; `image_generate` aracının çağrı başına `timeoutMs` parametresi yine önceliklidir.

## Video üretimi

OpenRouter, zaman uyumsuz `/videos` API'si üzerinden `video_generate` aracını da destekleyebilir. `agents.defaults.videoGenerationModel` altında bir OpenRouter video modeli kullanın:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw, metinden videoya ve görüntüden videoya işleri OpenRouter'a gönderir, döndürülen `polling_url` adresini yoklar ve tamamlanan videoyu OpenRouter'ın `unsigned_urls` alanından veya belgelenmiş iş içeriği uç noktasından indirir. Referans görüntüler varsayılan olarak ilk/son kare görüntüleri olarak gönderilir; `reference_image` ile etiketlenen görüntüler OpenRouter giriş referansları olarak gönderilir. Paketlenmiş `google/veo-3.1-fast` varsayılanı, şu anda desteklenen 4/6/8 saniyelik süreleri, `720P`/`1080P` çözünürlükleri ve `16:9`/`9:16` en boy oranlarını bildirir. Video üretimi üst API'si şu anda metin ve görüntü referanslarını kabul ettiği için video-videoya OpenRouter için kayıtlı değildir.

## Müzik üretimi

OpenRouter, sohbet tamamlama ses çıktısı üzerinden `music_generate` aracını da destekleyebilir. `agents.defaults.musicGenerationModel` altında bir OpenRouter ses modeli kullanın:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Paketlenmiş OpenRouter müzik sağlayıcısı varsayılan olarak `google/lyria-3-pro-preview` kullanır ve ayrıca `google/lyria-3-clip-preview` sunar. OpenClaw `modalities: ["text", "audio"]` gönderir, akışı etkinleştirir, akan ses parçalarını toplar ve sonucu kanal teslimi için üretilmiş medya olarak kaydeder. Referans görüntüler, paylaşılan `music_generate image=...` parametresi üzerinden Lyria modelleri için kabul edilir.

## Metinden konuşmaya

OpenRouter, OpenAI uyumlu `/audio/speech` uç noktası üzerinden bir TTS sağlayıcısı olarak da kullanılabilir.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

`messages.tts.providers.openrouter.apiKey` atlanırsa TTS önce `models.providers.openrouter.apiKey`, ardından `OPENROUTER_API_KEY` değerini yeniden kullanır.

## Konuşmadan metne (gelen ses)

OpenRouter, STT uç noktasını (`/audio/transcriptions`) kullanarak paylaşılan `tools.media.audio` yolu üzerinden gelen ses/konuşma eklerini yazıya dökebilir. Bu, gelen ses/konuşmayı medya anlama ön kontrolüne ileten tüm kanal Plugin'leri için geçerlidir.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw, OpenRouter STT isteklerini multipart OpenAI form yüklemeleri olarak değil, `input_audio` altında base64 ses içeren JSON olarak gönderir (OpenRouter STT sözleşmesi).

## Fusion yönlendiricisi

Tek bir OpenClaw model başvurusunun birkaç OpenRouter modeline paralel olarak sormasını, OpenRouter'ın yanıtlarını değerlendirmesini ve normal OpenRouter sağlayıcı uç noktası üzerinden tek bir nihai yanıt döndürmesini istediğinizde OpenRouter Fusion kullanın. Üst model kısa adı `openrouter/fusion` olduğundan, OpenClaw model başvurusu hem OpenClaw sağlayıcı önekini hem de üst OpenRouter ad alanını içerir:

```bash
openclaw models set openrouter/openrouter/fusion
```

Fusion panelini ve değerlendiricisini modelin `params.extraBody` alanı üzerinden yapılandırın. Bu alanlar OpenRouter sohbet tamamlama istek gövdesine iletilir. Fusion, OpenRouter OAuth katılımı veya API anahtarı katılımıyla çalışır; OAuth kullanıyorsanız aşağıdaki örnekten `env.OPENROUTER_API_KEY` satırını çıkarın.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` listesi paralel paneldir ve Fusion Plugin yapılandırmasının içindeki `model` değerlendirici modelidir. Fusion'ı zorlamaya çalışmak için normal OpenClaw agent/sohbet turlarında üst düzey `tool_choice` değerini `"required"` olarak ayarlamayın; OpenClaw turları OpenClaw araç tanımlarını içerebilir ve üst düzey zorunlu araç seçimi, Fusion yönlendiricisi yerine bu araçlardan birini gerektirebilir. Bu Fusion Plugin yapılandırması mevcut olduğunda OpenClaw, agent'ın mevcut Fusion paneliyle ilgili soruları yanıtlayabilmesi için yapılandırılmış analiz modellerini ve değerlendirici modelini içeren temizlenmiş bir sistem istemi notu da ekler. Diğer `extraBody` alanları isteme kopyalanmaz.

Fusion tasarımı gereği daha yavaştır. OpenRouter aynı OpenClaw istemini birden çok analiz modeline gönderebilir ve ardından nihai bir değerlendirme/sentez adımı çalıştırabilir; bu nedenle gecikme genellikle doğrudan tek model isteğinden daha yüksektir. Fusion'ı gecikmeye duyarlı sohbet için varsayılan olarak değil, dikkatli, yüksek kaliteli yanıtlar veya yükseltme yolları için kullanın. Daha hızlı yanıtlar için paneli küçük tutun ve daha hızlı analiz ve değerlendirici modelleri seçin.

Yapılandırılmış başvuruyu tek seferlik yerel model çağrısıyla test edin:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Kimlik doğrulama ve üst bilgiler

OpenRouter perde arkasında API anahtarınızla Bearer token kullanır. OpenRouter OAuth, OpenRouter API anahtarı veren bir PKCE oturum açma akışıdır; bu nedenle OpenClaw sonucu manuel API anahtarı kurulum yolunda kullanılan aynı `openrouter:default` API anahtarı kimlik doğrulama profili olarak saklar.

Mevcut bir kurulumda, tam katılımı yeniden çalıştırmadan oturum açın veya saklanan OpenRouter anahtarını döndürün:

```bash
openclaw models auth login --provider openrouter --method oauth
```

OpenRouter'da elle oluşturduğunuz bir anahtarı yapıştırmak istediğinizde `openclaw models auth login --provider openrouter --method api-key` kullanın.

Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`) OpenClaw ayrıca OpenRouter'ın belgelenmiş uygulama ilişkilendirme üst bilgilerini ekler:

| Üst bilgi                 | Değer                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter sağlayıcısını başka bir proxy veya temel URL'ye yönlendirirseniz OpenClaw, OpenRouter'a özgü bu üst bilgileri veya Anthropic önbellek işaretleyicilerini eklemez.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yanıt önbelleğe alma">
    OpenRouter yanıt önbelleğe alma isteğe bağlıdır. Bunu her OpenRouter modeli için model parametreleriyle etkinleştirin:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw `X-OpenRouter-Cache: true` ve yapılandırıldığında `X-OpenRouter-Cache-TTL` gönderir. `responseCacheClear: true`, geçerli istek için yenilemeyi zorlar ve yerine geçen yanıtı saklar. Snake_case takma adları (`response_cache`, `response_cache_ttl_seconds` ve `response_cache_clear`) da kabul edilir.

    Bu, sağlayıcı istem önbelleğe alma işleminden ve OpenRouter'ın Anthropic `cache_control` işaretleyicilerinden ayrıdır. Özel proxy temel URL'lerinde değil, yalnızca doğrulanmış `openrouter.ai` rotalarında uygulanır.

  </Accordion>

  <Accordion title="Anthropic önbellek işaretleyicileri">
    Doğrulanmış OpenRouter rotalarında, Anthropic model başvuruları OpenClaw'ın sistem/geliştirici istem bloklarında daha iyi istem önbelleği yeniden kullanımı için kullandığı OpenRouter'a özgü Anthropic `cache_control` işaretleyicilerini korur.
  </Accordion>

  <Accordion title="Anthropic akıl yürütme ön doldurması">
    Doğrulanmış OpenRouter rotalarında, akıl yürütme etkinleştirilmiş Anthropic
    model referansları, istek OpenRouter'a ulaşmadan önce sondaki assistant ön
    doldurma dönüşlerini kaldırır; bu, Anthropic'in akıl yürütme konuşmalarının
    bir user dönüşüyle bitmesi gereksinimiyle eşleşir.
  </Accordion>

  <Accordion title="Thinking / akıl yürütme enjeksiyonu">
    Desteklenen `auto` olmayan rotalarda OpenClaw, seçilen thinking düzeyini
    OpenRouter proxy akıl yürütme yüklerine eşler. Desteklenmeyen model ipuçları
    ve `openrouter/auto` bu akıl yürütme enjeksiyonunu atlar. Hunter Alpha da,
    eskimiş yapılandırılmış model referansları için proxy akıl yürütmesini atlar;
    çünkü OpenRouter bu emekli rota için akıl yürütme alanlarında nihai yanıt
    metni döndürebilir.
  </Accordion>

  <Accordion title="DeepSeek V4 akıl yürütme yeniden oynatması">
    Doğrulanmış OpenRouter rotalarında, `openrouter/deepseek/deepseek-v4-flash` ve
    `openrouter/deepseek/deepseek-v4-pro`, yeniden oynatılan assistant dönüşlerinde
    eksik `reasoning_content` alanını doldurur; böylece thinking/araç konuşmaları
    DeepSeek V4'ün gerekli takip biçimini korur. OpenClaw bu rotalar için
    OpenRouter tarafından desteklenen `reasoning.effort` değerlerini gönderir; daha
    düşük, kapalı olmayan düzeyler `high` değerine eşlenir ve eskimiş `max`
    geçersiz kılmaları `xhigh` değerine eşlenir.
  </Accordion>

  <Accordion title="Yalnızca OpenAI istek biçimlendirmesi">
    OpenRouter hâlâ proxy tarzı OpenAI uyumlu yoldan çalışır; bu nedenle
    `serviceTier`, Responses `store`, OpenAI akıl yürütme uyumluluk yükleri ve
    istem önbelleği ipuçları gibi yerel, yalnızca OpenAI'ye özgü istek
    biçimlendirmeleri iletilmez.
  </Accordion>

  <Accordion title="Gemini destekli rotalar">
    Gemini destekli OpenRouter referansları proxy-Gemini yolunda kalır: OpenClaw
    burada Gemini düşünce imzası temizliğini korur, ancak yerel Gemini yeniden
    oynatma doğrulamasını veya önyükleme yeniden yazımlarını etkinleştirmez.
  </Accordion>

  <Accordion title="Sağlayıcı yönlendirme meta verileri">
    OpenRouter, alttaki sağlayıcı yönlendirmesi için bir `provider` istek nesnesini
    destekler. Tüm OpenRouter metin modeli istekleri için varsayılan bir ilkeyi
    `models.providers.openrouter.params.provider` ile yapılandırın:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw bu nesneyi OpenRouter'a istek `provider` yükü olarak iletir. `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` ve `enforce_distillable_text` dahil olmak
    üzere OpenRouter'ın belgelenmiş snake_case alanlarını kullanın.

    Model başına parametreler, sağlayıcı genelindeki yönlendirme nesnesini yine de
    geçersiz kılar:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Bu yalnızca OpenRouter chat-completions rotalarında geçerlidir. Doğrudan
    Anthropic, Google, OpenAI veya özel sağlayıcı rotaları OpenRouter yönlendirme
    parametrelerini yok sayar.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Ajanlar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>

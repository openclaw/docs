---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da modelleri OpenRouter üzerinden çalıştırmak istiyorsunuz
    - Görsel oluşturma için OpenRouter kullanmak istiyorsunuz
    - Müzik üretimi için OpenRouter kullanmak istiyorsunuz
    - Video üretimi için OpenRouter kullanmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için OpenRouter'ın birleşik API'sini kullanın
title: OpenRouter
x-i18n:
    generated_at: "2026-06-28T01:12:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter, istekleri tek bir uç nokta ve API anahtarı arkasındaki birçok modele yönlendiren **birleşik API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

## Başlarken

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth başlangıç kurulumunu çalıştırın">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw, OpenRouter'ın tarayıcıda oturum açma akışını açar, PKCE
        kodunu bir OpenRouter API anahtarıyla değiştirir ve bu anahtarı varsayılan
        OpenRouter kimlik doğrulama profiline kaydeder. Uzak/başsız ana makinelerde OpenClaw,
        oturum açma URL'sini yazdırır ve oturum açtıktan sonra yönlendirme URL'sini yapıştırmanızı ister.
      </Step>
      <Step title="(İsteğe bağlı) Belirli bir modele geçin">
        Başlangıç kurulumu varsayılan olarak `openrouter/auto` kullanır. Daha sonra somut bir model seçin:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API anahtarı">
    <Steps>
      <Step title="API anahtarınızı alın">
        [openrouter.ai/keys](https://openrouter.ai/keys) adresinden bir API anahtarı oluşturun.
      </Step>
      <Step title="API anahtarı başlangıç kurulumunu çalıştırın">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(İsteğe bağlı) Belirli bir modele geçin">
        Başlangıç kurulumu varsayılan olarak `openrouter/auto` kullanır. Daha sonra somut bir model seçin:

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

## Model referansları

<Note>
Model referansları `openrouter/<provider>/<model>` desenini izler. Kullanılabilir sağlayıcıların
ve modellerin tam listesi için bkz. [/concepts/model-providers](/tr/concepts/model-providers).
</Note>

Paketle gelen yedek örnekler:

| Model referansı                   | Notlar                         |
| --------------------------------- | ------------------------------ |
| `openrouter/auto`                 | OpenRouter otomatik yönlendirme |
| `openrouter/openrouter/fusion`    | OpenRouter Fusion yönlendiricisi |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI üzerinden Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI üzerinden Kimi K2.5 |

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

OpenClaw, görüntü isteklerini `modalities: ["image", "text"]` ile OpenRouter'ın sohbet tamamlama görüntü API'sine gönderir. Gemini görüntü modelleri, desteklenen `aspectRatio` ve `resolution` ipuçlarını OpenRouter'ın `image_config` değeri üzerinden alır. Daha yavaş OpenRouter görüntü modelleri için `agents.defaults.imageGenerationModel.timeoutMs` kullanın; `image_generate` aracının çağrı başına `timeoutMs` parametresi yine önceliklidir.

## Video üretimi

OpenRouter, asenkron `/videos` API'si üzerinden `video_generate` aracını da destekleyebilir. `agents.defaults.videoGenerationModel` altında bir OpenRouter video modeli kullanın:

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

OpenClaw, metinden videoya ve görüntüden videoya işlerini OpenRouter'a gönderir,
döndürülen `polling_url` değerini yoklar ve tamamlanan videoyu
OpenRouter'ın `unsigned_urls` değerlerinden veya belgelenmiş iş içeriği uç noktasından indirir.
Referans görüntüler varsayılan olarak ilk/son kare görüntüleri olarak gönderilir; `reference_image`
ile etiketlenen görüntüler OpenRouter giriş referansları olarak gönderilir. Paketle gelen
`google/veo-3.1-fast` varsayılanı, şu anda desteklenen 4/6/8 saniye süreleri,
`720P`/`1080P` çözünürlükleri ve `16:9`/`9:16` en-boy oranlarını duyurur.
Video üretimi API'si şu anda metin ve görüntü referanslarını kabul ettiği için
videodan videoya OpenRouter için kaydedilmez.

## Müzik üretimi

OpenRouter, sohbet tamamlama ses çıktısı üzerinden `music_generate` aracını da
destekleyebilir. `agents.defaults.musicGenerationModel` altında bir OpenRouter ses modeli kullanın:

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

Paketle gelen OpenRouter müzik sağlayıcısı varsayılan olarak
`google/lyria-3-pro-preview` kullanır ve ayrıca `google/lyria-3-clip-preview`
sunar. OpenClaw `modalities: ["text", "audio"]` gönderir, akışı etkinleştirir,
akışla gelen ses parçalarını toplar ve sonucu kanal teslimi için üretilmiş medya
olarak kaydeder. Referans görüntüler, Lyria modelleri için paylaşılan
`music_generate image=...` parametresi üzerinden kabul edilir.

## Metinden konuşmaya

OpenRouter, OpenAI uyumlu `/audio/speech` uç noktası üzerinden TTS sağlayıcısı
olarak da kullanılabilir.

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

`messages.tts.providers.openrouter.apiKey` atlanırsa, TTS önce
`models.providers.openrouter.apiKey`, ardından `OPENROUTER_API_KEY` değerini yeniden kullanır.

## Konuşmadan metne (gelen ses)

OpenRouter, gelen ses/ses dosyası eklerini paylaşılan `tools.media.audio` yolu üzerinden
STT uç noktasını (`/audio/transcriptions`) kullanarak yazıya dökebilir.
Bu, gelen ses/ses dosyasını medya anlama ön kontrolüne ileten tüm kanal Plugin'leri için geçerlidir.

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

OpenClaw, OpenRouter STT isteklerini çok parçalı OpenAI form yüklemeleri olarak değil,
`input_audio` altında base64 ses içeren JSON olarak gönderir (OpenRouter STT sözleşmesi).

## Fusion yönlendiricisi

Tek bir OpenClaw model referansının birkaç OpenRouter modeline paralel olarak sormasını,
OpenRouter'ın yanıtlarını değerlendirmesini ve normal OpenRouter sağlayıcı uç noktası
üzerinden tek bir nihai yanıt döndürmesini istediğinizde OpenRouter Fusion kullanın.
Yukarı akış model slug'ı `openrouter/fusion` olduğundan, OpenClaw model referansı hem
OpenClaw sağlayıcı önekini hem de yukarı akış OpenRouter ad alanını içerir:

```bash
openclaw models set openrouter/openrouter/fusion
```

Fusion'ın panelini ve değerlendiricisini modelin `params.extraBody` değeri üzerinden yapılandırın. Bu
alanlar OpenRouter sohbet tamamlama istek gövdesine iletilir. Fusion, OpenRouter OAuth başlangıç
kurulumu veya API anahtarı başlangıç kurulumuyla çalışır; OAuth kullanıyorsanız
aşağıdaki örnekten `env.OPENROUTER_API_KEY` satırını çıkarın.

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

`analysis_models` listesi paralel paneldir ve Fusion Plugin yapılandırması içindeki
`model` değerlendirici modeldir. Fusion'ı zorlamaya çalışmak için normal OpenClaw
aracı/sohbet dönüşlerinde üst düzey `tool_choice` değerini `"required"` olarak ayarlamayın;
OpenClaw dönüşleri OpenClaw araç tanımları içerebilir ve üst düzey zorunlu bir araç seçimi,
Fusion yönlendiricisi yerine bu araçlardan birini gerektirebilir. Bu Fusion Plugin
yapılandırması mevcut olduğunda OpenClaw, aracının geçerli Fusion paneli hakkındaki
soruları yanıtlayabilmesi için yapılandırılmış analiz modelleri ve değerlendirici modelle
temizlenmiş bir sistem istemi notu da ekler. Diğer `extraBody` alanları isteme kopyalanmaz.

Fusion tasarım gereği daha yavaştır. OpenRouter aynı OpenClaw istemini birden çok
analiz modeline gönderebilir ve ardından son bir değerlendirme/sentez adımı çalıştırabilir;
bu nedenle gecikme genellikle doğrudan tek model isteğinden daha yüksektir. Fusion'ı
gecikmeye duyarlı sohbet için varsayılan olarak değil, özenli, yüksek kaliteli yanıtlar
veya yükseltme yolları için kullanın. Daha hızlı yanıtlar için paneli küçük tutun ve
daha hızlı analiz ve değerlendirici modeller seçin.

Yapılandırılan referansı tek seferlik yerel model çağrısıyla test edin:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Kimlik doğrulama ve başlıklar

OpenRouter arka planda API anahtarınızla Bearer belirteci kullanır. OpenRouter
OAuth, bir OpenRouter API anahtarı veren PKCE oturum açma akışıdır; bu nedenle OpenClaw
sonucu, manuel API anahtarı kurulum yolunun kullandığı aynı `openrouter:default`
API anahtarı kimlik doğrulama profili olarak kaydeder.

Mevcut bir kurulumda, tam başlangıç kurulumunu yeniden çalıştırmadan oturum açın veya
saklanan OpenRouter anahtarını döndürün:

```bash
openclaw models auth login --provider openrouter --method oauth
```

OpenRouter'da manuel olarak oluşturduğunuz bir anahtarı yapıştırmak istediğinizde
`openclaw models auth login --provider openrouter --method api-key` kullanın.

Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`) OpenClaw ayrıca
OpenRouter'ın belgelenmiş uygulama atıf başlıklarını ekler:

| Başlık                    | Değer                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter sağlayıcısını başka bir proxy'ye veya temel URL'ye yönlendirirseniz OpenClaw,
bu OpenRouter'a özgü başlıkları veya Anthropic önbellek işaretçilerini **enjekte etmez**.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yanıt önbelleğe alma">
    OpenRouter yanıt önbelleğe alma isteğe bağlıdır. Model parametreleriyle OpenRouter modeli başına etkinleştirin:

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

    OpenClaw `X-OpenRouter-Cache: true` ve yapılandırıldığında
    `X-OpenRouter-Cache-TTL` gönderir. `responseCacheClear: true`, geçerli istek için
    yenilemeyi zorlar ve yerine geçen yanıtı kaydeder. Snake_case takma adları
    (`response_cache`, `response_cache_ttl_seconds` ve
    `response_cache_clear`) da kabul edilir.

    Bu, sağlayıcı istem önbelleğe almadan ve OpenRouter'ın Anthropic
    `cache_control` işaretçilerinden ayrıdır. Yalnızca doğrulanmış
    `openrouter.ai` rotalarında uygulanır, özel proxy temel URL'lerinde uygulanmaz.

  </Accordion>

  <Accordion title="Anthropic önbellek işaretçileri">
    Doğrulanmış OpenRouter rotalarında, Anthropic model referansları OpenClaw'un
    sistem/geliştirici istem bloklarında daha iyi istem önbelleği yeniden kullanımı için
    kullandığı OpenRouter'a özgü Anthropic `cache_control` işaretçilerini korur.
  </Accordion>

  <Accordion title="Anthropic akıl yürütme ön dolgusu">
    Doğrulanmış OpenRouter rotalarında, akıl yürütme etkinleştirilmiş Anthropic model referansları,
    istek OpenRouter'a ulaşmadan önce sondaki asistan ön dolgu dönüşlerini bırakır;
    bu, Anthropic'in akıl yürütme konuşmalarının bir kullanıcı
    dönüşüyle bitmesi gereksinimiyle eşleşir.
  </Accordion>

  <Accordion title="Düşünme / akıl yürütme enjeksiyonu">
    Desteklenen `auto` dışı rotalarda OpenClaw, seçilen düşünme düzeyini
    OpenRouter proxy akıl yürütme yüklerine eşler. Desteklenmeyen model ipuçları ve
    `openrouter/auto` bu akıl yürütme enjeksiyonunu atlar. Hunter Alpha ayrıca
    güncelliğini yitirmiş yapılandırılmış model referansları için proxy akıl yürütmesini atlar,
    çünkü OpenRouter bu emekliye ayrılmış rota için akıl yürütme alanlarında
    nihai yanıt metni döndürebilir.
  </Accordion>

  <Accordion title="DeepSeek V4 akıl yürütme yeniden oynatımı">
    Doğrulanmış OpenRouter rotalarında, `openrouter/deepseek/deepseek-v4-flash` ve
    `openrouter/deepseek/deepseek-v4-pro`, yeniden oynatılan asistan dönüşlerinde
    eksik `reasoning_content` değerini doldurur; böylece düşünme/araç konuşmaları
    DeepSeek V4'ün gerekli takip biçimini korur. OpenClaw bu rotalar için OpenRouter tarafından desteklenen
    `reasoning_effort` değerlerini gönderir; `xhigh` duyurulan en yüksek
    düzeydir ve güncelliğini yitirmiş `max` geçersiz kılmaları `xhigh` değerine eşlenir.
  </Accordion>

  <Accordion title="Yalnızca OpenAI istek şekillendirmesi">
    OpenRouter hâlâ proxy tarzı OpenAI uyumlu yoldan çalışır; bu nedenle
    `serviceTier`, Responses `store`, OpenAI akıl yürütme uyumluluğu yükleri
    ve istem önbelleği ipuçları gibi yerel yalnızca OpenAI istek şekillendirmesi iletilmez.
  </Accordion>

  <Accordion title="Gemini destekli rotalar">
    Gemini destekli OpenRouter referansları proxy-Gemini yolunda kalır: OpenClaw burada
    Gemini düşünce imzası temizliğini korur, ancak yerel Gemini
    yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez.
  </Accordion>

  <Accordion title="Sağlayıcı yönlendirme meta verileri">
    OpenRouter, alttaki sağlayıcı yönlendirmesi için bir `provider` istek nesnesini destekler.
    Tüm OpenRouter metin modeli istekleri için varsayılan bir politikayı
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

    OpenClaw bu nesneyi OpenRouter'a istek `provider`
    yükü olarak iletir. OpenRouter'ın belgelenmiş snake_case alanlarını kullanın; bunlara `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` ve `enforce_distillable_text` dahildir.

    Model başına parametreler, sağlayıcı genelindeki yönlendirme nesnesini yine de geçersiz kılar:

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

    Bu yalnızca OpenRouter chat-completions rotalarında geçerlidir. Doğrudan Anthropic,
    Google, OpenAI veya özel sağlayıcı rotaları OpenRouter yönlendirme parametrelerini yok sayar.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>

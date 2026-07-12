---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da modelleri OpenRouter üzerinden çalıştırmak istiyorsunuz
    - Görsel oluşturmak için OpenRouter kullanmak istiyorsunuz
    - Müzik oluşturmak için OpenRouter'ı kullanmak istiyorsunuz
    - Video oluşturmak için OpenRouter'ı kullanmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için OpenRouter'ın birleşik API'sini kullanın
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T12:09:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter, istekleri tek bir API ve tek bir anahtar üzerinden birçok modele yönlendirir.
OpenAI uyumlu olduğundan OpenClaw, diğer proxy sağlayıcılarında kullanılan
aynı `openai-completions` tarzı aktarım üzerinden onunla iletişim kurar.

## Başlarken

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth ilk kurulumunu çalıştırın">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw, OpenRouter'ın tarayıcıda oturum açma akışını (PKCE) açar, kodu
        bir OpenRouter API anahtarıyla değiştirir ve varsayılan OpenRouter
        kimlik doğrulama profiline kaydeder. Uzak/ekransız ana makinelerde
        OpenClaw, oturum açma URL'sini yazdırır ve oturum açtıktan sonra
        yönlendirme URL'sini yapıştırmanızı ister.
      </Step>
      <Step title="(İsteğe bağlı) Belirli bir modele geçin">
        İlk kurulum varsayılan olarak `openrouter/auto` kullanır. Daha sonra belirli bir model seçin:

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
      <Step title="API anahtarıyla ilk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(İsteğe bağlı) Belirli bir modele geçin">
        İlk kurulum varsayılan olarak `openrouter/auto` kullanır. Daha sonra belirli bir model seçin:

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
Model referansları `openrouter/<provider>/<model>` kalıbını izler. Kullanılabilir
sağlayıcıların ve modellerin tam listesi için [/concepts/model-providers](/tr/concepts/model-providers)
sayfasına bakın.
</Note>

Canlı katalog keşfi kullanılamadığında kullanılan paketlenmiş yedek modeller:

| Model referansı                    | Notlar                          |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter otomatik yönlendirmesi |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI üzerinden Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI üzerinden Kimi K2.5 |

`openrouter/openrouter/fusion` ([Fusion yönlendiricisi](#fusion-router) bölümüne
bakın) dahil olmak üzere diğer tüm `openrouter/<provider>/<model>` referansları,
OpenRouter'ın canlı model kataloğuna göre dinamik olarak çözümlenir.

## Görüntü oluşturma

OpenRouter, `image_generate` aracını destekleyebilir. `agents.defaults.imageGenerationModel`
altında bir OpenRouter görüntü modeli ayarlayın:

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

OpenClaw, görüntü isteklerini `modalities: ["image", "text"]` ile OpenRouter'ın
sohbet tamamlama görüntü API'sine gönderir. Gemini görüntü modelleri ayrıca
OpenRouter'ın `image_config` alanı üzerinden `aspectRatio` ve `resolution`
ipuçlarını alır; diğer görüntü modelleri almaz. Daha yavaş modeller için
`agents.defaults.imageGenerationModel.timeoutMs` kullanın; `image_generate`
aracının çağrı başına `timeoutMs` değeri yine önceliklidir.

## Video oluşturma

OpenRouter, eşzamansız `/videos` API'si üzerinden `video_generate` aracını
destekleyebilir. `agents.defaults.videoGenerationModel` altında bir OpenRouter
video modeli ayarlayın:

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

OpenClaw, metinden videoya ve görüntüden videoya işleri gönderir, döndürülen
`polling_url` adresini yoklar ve tamamlanan videoyu OpenRouter'ın
`unsigned_urls` alanından veya iş içeriği uç noktasından indirir. Referans
görüntüler varsayılan olarak ilk/son kare görüntüleri şeklinde kullanılır;
`reference_image` etiketi taşıyan görüntüler ise bunun yerine giriş
referansları olarak gönderilir. Paketlenmiş varsayılan `google/veo-3.1-fast`,
4/6/8 saniyelik süreleri, `720P`/`1080P` çözünürlükleri ve `16:9`/`9:16` en-boy
oranlarını destekler. Videodan videoya dönüştürme desteklenmez: üst API yalnızca
metin ve görüntü referanslarını kabul eder.

## Müzik oluşturma

OpenRouter, sohbet tamamlama ses çıktısı üzerinden `music_generate` aracını
destekleyebilir. `agents.defaults.musicGenerationModel` altında bir OpenRouter
ses modeli ayarlayın:

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

Paketlenmiş OpenRouter müzik sağlayıcısı varsayılan olarak
`google/lyria-3-pro-preview` kullanır ve ayrıca `google/lyria-3-clip-preview`
modelini sunar. OpenClaw, `modalities: ["text", "audio"]` gönderir, yanıtı akış
halinde alır, ses parçalarını toplar ve sonucu kanal üzerinden teslim edilmek
üzere oluşturulmuş medya olarak kaydeder. Lyria modelleri, ortak
`music_generate image=...` parametresi üzerinden bir referans görüntüyü kabul
eder. Akış halindeki ses, transkript saklama ve türetilmiş SSE olay zarfı
`agents.defaults.mediaMaxMb` ile sınırlandırılır (varsayılan ses sınırı 16 MB'dir).

## Metinden konuşmaya

OpenRouter, OpenAI uyumlu `/audio/speech` uç noktası üzerinden bir TTS
sağlayıcısı olarak çalışabilir.

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

`messages.tts.providers.openrouter.apiKey` belirtilmezse TTS, önce
`models.providers.openrouter.apiKey` değerine, ardından `OPENROUTER_API_KEY`
değerine geri döner.

## Konuşmadan metne (gelen ses)

OpenRouter, ortak `tools.media.audio` yolu üzerinden, STT uç noktasını
(`/audio/transcriptions`) kullanarak gelen sesli mesaj/ses eklerini yazıya
dökebilir. Bu, gelen sesli mesajları/sesleri medya anlama ön kontrolüne ileten
tüm kanal Plugin'leri için geçerlidir.

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

OpenClaw, OpenRouter STT isteklerini çok parçalı OpenAI form yüklemeleri olarak
değil, `input_audio` altında base64 ses içeren JSON biçiminde (OpenRouter'ın STT
sözleşmesi) gönderir.

## Fusion yönlendiricisi

OpenRouter Fusion, tek bir OpenClaw model referansını paralel olarak birden
fazla OpenRouter modeline gönderir, yanıtları OpenRouter'a değerlendirtir ve
normal OpenRouter uç noktası üzerinden tek bir nihai yanıt döndürür. Üst model
kısa adı `openrouter/fusion` olduğundan OpenClaw model referansı hem OpenClaw
sağlayıcı önekini hem de üst OpenRouter ad alanını içerir:

```bash
openclaw models set openrouter/openrouter/fusion
```

Fusion'ın panelini ve değerlendiricisini modelin `params.extraBody` alanı
üzerinden yapılandırın; bu alanlar doğrudan OpenRouter sohbet tamamlama isteği
gövdesine iletilir. Fusion, hem OAuth hem de API anahtarıyla ilk kurulumla
çalışır; OAuth kullanıyorsanız aşağıdaki `env.OPENROUTER_API_KEY` satırını
atlayın.

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

`analysis_models` paralel paneldir; Fusion Plugin yapılandırmasındaki `model`
ise değerlendirici modeldir. Normal ajan/sohbet işlemlerinde Fusion'ı zorlamak
amacıyla üst düzey `tool_choice` değerini `"required"` olarak ayarlamayın:
OpenClaw işlemleri kendi araç tanımlarını içerebilir ve üst düzey zorunlu araç
seçimi, Fusion yönlendiricisi yerine bunlardan birini seçebilir. Bu Fusion
Plugin yapılandırması mevcut olduğunda OpenClaw, yapılandırılmış analiz
modellerini ve değerlendirici modeli listeleyen arındırılmış bir sistem istemi
notu ekler; böylece ajan kendi Fusion paneli hakkındaki soruları yanıtlayabilir.
Diğer `extraBody` alanları isteme kopyalanmaz.

Fusion tasarım gereği daha yavaştır: OpenRouter, istemi birden fazla analiz
modeline dağıtır ve ardından bir değerlendirme/sentez adımı çalıştırır; bu
nedenle gecikme, doğrudan tek model isteğine göre daha yüksektir. Gecikmeye
duyarlı bir varsayılan olarak değil, bilinçli ve yüksek kaliteli yanıtlar veya
yükseltme yolları için kullanın. Paneli küçük tutun ve daha hızlı yanıtlar için
daha hızlı analiz/değerlendirici modelleri seçin.

Yapılandırılmış bir referansı tek seferlik yerel çağrıyla test edin:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Kimlik doğrulama ve üstbilgiler

OpenRouter, API anahtarınızdan alınan bir Bearer belirteci kullanır. OpenRouter
OAuth, bir OpenRouter API anahtarı veren PKCE oturum açma akışıdır; bu nedenle
OpenClaw sonucu, manuel API anahtarı kurulumunda kullanılan aynı
`openrouter:default` API anahtarı kimlik doğrulama profiline kaydeder.

Tam ilk kurulumu yeniden çalıştırmadan mevcut bir kurulumda oturum açmak veya
kayıtlı anahtarı yenilemek için:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

Doğrulanmış OpenRouter isteklerinde (`https://openrouter.ai/api/v1`) OpenClaw,
OpenRouter'ın belgelenmiş uygulama ilişkilendirme üstbilgilerini ekler:

| Üstbilgi                  | Değer                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter sağlayıcısını başka bir proxy'ye veya temel URL'ye yönlendirirseniz
OpenClaw, OpenRouter'a özgü bu üstbilgileri veya Anthropic önbellek işaretçilerini
**eklemez**.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yanıt önbelleğe alma">
    OpenRouter yanıt önbelleğe alma özelliği isteğe bağlıdır. Model başına etkinleştirin:

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

    OpenClaw, `X-OpenRouter-Cache: true` ve yapılandırılmışsa
    `X-OpenRouter-Cache-TTL` gönderir. `responseCacheClear: true`, geçerli istek
    için yenilemeyi zorlar ve yerine geçen yanıtı kaydeder. Snake_case
    diğer adları (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`) ve `Seconds` son eki olmadan `responseCacheTtl` /
    `response_cache_ttl` kabul edilir.

    Bu, sağlayıcı istem önbelleğe almasından ve OpenRouter'ın Anthropic
    `cache_control` işaretçilerinden ayrıdır. Özel proxy temel URL'lerinde değil,
    yalnızca doğrulanmış `openrouter.ai` rotalarında geçerlidir.

  </Accordion>

  <Accordion title="Anthropic önbellek işaretçileri">
    Doğrulanmış OpenRouter rotalarında Anthropic model referansları,
    sistem/geliştirici istem bloklarında istem önbelleğinin daha iyi yeniden
    kullanılması için OpenRouter'ın Anthropic `cache_control` işaretçilerini
    korur.
  </Accordion>

  <Accordion title="Anthropic akıl yürütme ön dolgusu">
    Doğrulanmış OpenRouter rotalarında, akıl yürütmenin etkin olduğu Anthropic model referanslarında,
    istek OpenRouter'a ulaşmadan önce sondaki asistan ön dolgu turları kaldırılır;
    böylece Anthropic'in akıl yürütme konuşmalarının bir kullanıcı turuyla
    sona ermesi gerekliliği karşılanır.
  </Accordion>

  <Accordion title="Düşünme / akıl yürütme ekleme">
    Desteklenen ve `auto` olmayan rotalarda OpenClaw, seçilen düşünme düzeyini
    OpenRouter proxy akıl yürütme yüklerine eşler. `openrouter/auto` ve desteklenmeyen
    model ipuçlarında bu ekleme atlanır. Eski `openrouter/hunter-alpha` referanslarında da
    bu işlem atlanır; çünkü OpenRouter, kullanımdan kaldırılan bu rotada akıl yürütme
    alanlarında nihai yanıt metni döndürebiliyordu.
  </Accordion>

  <Accordion title="DeepSeek V4 akıl yürütme yeniden oynatımı">
    Doğrulanmış OpenRouter rotalarında `openrouter/deepseek/deepseek-v4-flash` ve
    `openrouter/deepseek/deepseek-v4-pro`, yeniden oynatılan asistan turlarındaki eksik
    `reasoning_content` alanını doldurarak düşünme/araç konuşmalarını DeepSeek
    V4'ün gerektirdiği takip biçiminde tutar. OpenClaw, bu rotalar için OpenRouter'ın
    desteklediği `reasoning.effort` değerlerini gönderir: `xhigh`/`max`, `xhigh`
    değerine; kapalı dışındaki diğer tüm düzeyler ise `high` değerine eşlenir.
  </Accordion>

  <Accordion title="Yalnızca OpenAI'a özgü istek biçimlendirme">
    OpenRouter, proxy tarzı OpenAI uyumlu yol üzerinden çalıştığından `serviceTier`,
    Responses `store`, OpenAI akıl yürütme uyumluluğu yükleri ve istem önbelleği
    ipuçları gibi yalnızca yerel OpenAI'a özgü istek biçimlendirmeleri iletilmez.
  </Accordion>

  <Accordion title="Gemini destekli rotalar">
    Gemini destekli OpenRouter referansları proxy-Gemini yolunda kalır: OpenClaw,
    Gemini düşünce imzası temizliğini burada sürdürür ancak yerel Gemini yeniden
    oynatma doğrulamasını veya önyükleme yeniden yazımlarını etkinleştirmez.
  </Accordion>

  <Accordion title="Sağlayıcı yönlendirme meta verileri">
    OpenRouter, temel sağlayıcı yönlendirmesi için bir `provider` istek nesnesini
    destekler. Tüm OpenRouter metin modeli istekleri için varsayılan bir politikayı
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

    OpenClaw, bu nesneyi istek `provider` yükü olarak OpenRouter'a iletir.
    `sort`, `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` ve `enforce_distillable_text` dâhil olmak üzere
    OpenRouter tarafından belgelenen snake_case alanlarını kullanın.

    Model başına parametreler, sağlayıcı genelindeki yönlendirme nesnesini geçersiz kılar:

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

    Bu yalnızca OpenRouter sohbet tamamlama rotalarında geçerlidir. Doğrudan Anthropic,
    Google, OpenAI veya özel sağlayıcı rotaları, OpenRouter yönlendirme parametrelerini yok sayar.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için eksiksiz yapılandırma başvurusu.
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw'ı yerel bir vLLM sunucusuna karşı çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu /v1 uç noktaları istiyorsunuz
summary: OpenClaw'ı vLLM ile çalıştırın (OpenAI uyumlu yerel sunucu)
title: vLLM
x-i18n:
    generated_at: "2026-06-28T01:13:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM, açık kaynaklı (ve bazı özel) modelleri **OpenAI uyumlu** bir HTTP API üzerinden sunabilir. OpenClaw, `openai-completions` API'sini kullanarak vLLM'ye bağlanır.

OpenClaw ayrıca `VLLM_API_KEY` ile etkinleştirdiğinizde vLLM'deki kullanılabilir modelleri **otomatik keşfedebilir** (sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa herhangi bir değer çalışır). Özel bir vLLM temel URL'si de yapılandırdığınızda keşfi dinamik tutmak için `agents.defaults.models` içinde `vllm/*` kullanın.

OpenClaw, `vllm` sağlayıcısını akışlı kullanım muhasebesini destekleyen yerel bir OpenAI uyumlu sağlayıcı olarak ele alır; böylece durum/bağlam token sayıları `stream_options.include_usage` yanıtlarından güncellenebilir.

| Özellik              | Değer                                    |
| -------------------- | ---------------------------------------- |
| Sağlayıcı kimliği    | `vllm`                                   |
| API                  | `openai-completions` (OpenAI uyumlu)     |
| Kimlik doğrulama     | `VLLM_API_KEY` ortam değişkeni           |
| Varsayılan temel URL | `http://127.0.0.1:8000/v1`               |

## Başlarken

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    Temel URL'niz `/v1` uç noktalarını sunmalıdır (örn. `/v1/models`, `/v1/chat/completions`). vLLM genellikle şurada çalışır:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa herhangi bir değer çalışır:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    Bunu vLLM model kimliklerinizden biriyle değiştirin:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Model keşfi (örtük sağlayıcı)

`VLLM_API_KEY` ayarlandığında (veya bir kimlik doğrulama profili mevcut olduğunda) ve `models.providers.vllm` tanımlamadığınızda, OpenClaw şunu sorgular:

```
GET http://127.0.0.1:8000/v1/models
```

ve dönen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.vllm` değerini açıkça ayarlarsanız OpenClaw varsayılan olarak bildirdiğiniz modelleri kullanır. OpenClaw'un yapılandırılmış sağlayıcının `/models` uç noktasını sorgulamasını ve ilan edilen tüm vLLM modellerini dahil etmesini istediğinizde `agents.defaults.models` içine `"vllm/*": {}` ekleyin.
</Note>

## Açık yapılandırma (manuel modeller)

Şu durumlarda açık yapılandırma kullanın:

- vLLM farklı bir ana makine veya bağlantı noktasında çalışıyorsa
- `contextWindow` veya `maxTokens` değerlerini sabitlemek istiyorsanız
- Sunucunuz gerçek bir API anahtarı gerektiriyorsa (veya başlıkları kontrol etmek istiyorsanız)
- Güvenilir bir loopback, LAN veya Tailscale vLLM uç noktasına bağlanıyorsanız

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Her modeli manuel olarak listelemeden bu sağlayıcıyı dinamik tutmak için görünür model kataloğuna bir sağlayıcı jokeri ekleyin:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    vLLM, yerel bir OpenAI uç noktası değil, proxy tarzı OpenAI uyumlu bir `/v1` arka ucu olarak ele alınır. Bu şu anlama gelir:

    | Davranış | Uygulandı mı? |
    |----------|---------------|
    | Yerel OpenAI istek biçimlendirmesi | Hayır |
    | `service_tier` | Gönderilmez |
    | Responses `store` | Gönderilmez |
    | Prompt önbelleği ipuçları | Gönderilmez |
    | OpenAI akıl yürütme uyumluluk yükü biçimlendirmesi | Uygulanmaz |
    | Gizli OpenClaw atıf başlıkları | Özel temel URL'lere enjekte edilmez |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    vLLM üzerinden sunulan Qwen modelleri için, sunucu Qwen sohbet şablonu kwargs beklediğinde yapılandırılmış sağlayıcı model satırında `compat.thinkingFormat: "qwen-chat-template"` ayarlayın. Bu şekilde yapılandırılan modeller ikili bir `/think` profili (`off`, `on`) sunar; çünkü Qwen şablon düşünmesi, OpenAI tarzı bir çaba kademesi değil, açık/kapalı istek bayrağıdır.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw, `/think off` değerini şuna eşler:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    `off` dışındaki düşünme düzeyleri `enable_thinking: true` gönderir. Uç noktanız bunun yerine DashScope tarzı üst düzey bayraklar bekliyorsa, istek kökünde `enable_thinking` göndermek için `compat.thinkingFormat: "qwen"` kullanın.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    vLLM/Nemotron 3, akıl yürütmenin gizli akıl yürütme olarak mı yoksa görünür yanıt metni olarak mı döndürüleceğini kontrol etmek için sohbet şablonu kwargs kullanabilir. Bir OpenClaw oturumu düşünme kapalıyken `vllm/nemotron-3-*` kullandığında, paketli vLLM Plugin'i şunu gönderir:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Bu değerleri özelleştirmek için model parametreleri altında `chat_template_kwargs` ayarlayın.
    `params.extra_body.chat_template_kwargs` da ayarlarsanız, `extra_body` son
    istek gövdesi geçersiz kılması olduğu için bu değer nihai önceliğe sahip olur.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Qwen araç çağrıları metin olarak görünür">
    Önce vLLM'in model için doğru araç çağrısı ayrıştırıcısı ve sohbet
    şablonuyla başlatıldığından emin olun. Örneğin vLLM, Qwen2.5 modelleri için
    `hermes`, Qwen3-Coder modelleri için `qwen3_xml` belgeler.

    Belirtiler:

    - Skills veya araçlar hiç çalışmaz
    - asistan `{"name":"read","arguments":...}` gibi ham JSON/XML yazdırır
    - OpenClaw `tool_choice: "auto"` gönderdiğinde vLLM boş bir `tool_calls`
      dizisi döndürür

    Bazı Qwen/vLLM kombinasyonları yapılandırılmış araç çağrılarını yalnızca
    istek `tool_choice: "required"` kullandığında döndürür. Bu model girdileri
    için OpenAI uyumlu istek alanını `params.extra_body` ile zorunlu kılın:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    `Qwen-Qwen2.5-Coder-32B-Instruct` değerini şunun döndürdüğü tam kimlikle değiştirin:

    ```bash
    openclaw models list --provider vllm
    ```

    Aynı geçersiz kılmayı CLI üzerinden uygulayabilirsiniz:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Bu, isteğe bağlı bir uyumluluk geçici çözümüdür. Araçları olan her model
    turunun bir araç çağrısı gerektirmesini sağlar; bu yüzden yalnızca bu
    davranışın kabul edilebilir olduğu özel bir yerel model girdisi için
    kullanın. Bunu tüm vLLM modelleri için genel varsayılan olarak kullanmayın
    ve rastgele asistan metnini körlemesine yürütülebilir araç çağrılarına
    dönüştüren bir proxy kullanmayın.

  </Accordion>

  <Accordion title="Özel temel URL">
    vLLM sunucunuz varsayılan olmayan bir ana makinede veya bağlantı noktasında çalışıyorsa açık sağlayıcı yapılandırmasında `baseUrl` ayarlayın:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Sorun Giderme

<AccordionGroup>
  <Accordion title="Yavaş ilk yanıt veya uzak sunucu zaman aşımı">
    Büyük yerel modeller, uzak LAN ana makineleri veya tailnet bağlantıları için
    sağlayıcı kapsamlı bir istek zaman aşımı ayarlayın:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds`, bağlantı kurulumu, yanıt başlıkları, gövde akışı ve toplam
    korumalı fetch iptali dahil yalnızca vLLM modeli HTTP istekleri için
    geçerlidir. Tüm agent çalışmasını denetleyen `agents.defaults.timeoutSeconds`
    değerini artırmadan önce bunu tercih edin.

  </Accordion>

  <Accordion title="Sunucuya ulaşılamıyor">
    vLLM sunucusunun çalıştığını ve erişilebilir olduğunu kontrol edin:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Bir bağlantı hatası görürseniz ana makineyi, bağlantı noktasını ve vLLM'in OpenAI uyumlu sunucu moduyla başlatıldığını doğrulayın.
    Açık local loopback, LAN veya Tailscale uç noktaları için OpenClaw,
    korumalı model isteklerinde tam olarak yapılandırılmış
    `models.providers.vllm.baseUrl` kaynağına güvenir. Metadata/link-local
    kaynakları açık isteğe bağlı etkinleştirme olmadan engelli kalır.
    `models.providers.vllm.request.allowPrivateNetwork: true` ayarını yalnızca
    vLLM isteklerinin başka bir özel kaynağa ulaşması gerektiğinde belirleyin
    ve tam kaynak güveninden çıkmak için `false` olarak ayarlayın.

  </Accordion>

  <Accordion title="İsteklerde kimlik doğrulama hataları">
    İstekler kimlik doğrulama hatalarıyla başarısız olursa sunucu yapılandırmanızla eşleşen gerçek bir `VLLM_API_KEY` ayarlayın veya sağlayıcıyı `models.providers.vllm` altında açıkça yapılandırın.

    <Tip>
    vLLM sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa `VLLM_API_KEY` için boş olmayan herhangi bir değer OpenClaw için isteğe bağlı etkinleştirme sinyali olarak çalışır.
    </Tip>

  </Accordion>

  <Accordion title="Hiç model bulunamadı">
    Otomatik keşif için `VLLM_API_KEY` ayarlanmış olmalıdır. `models.providers.vllm` tanımladıysanız, `agents.defaults.models` `"vllm/*": {}` içermediği sürece OpenClaw yalnızca bildirdiğiniz modelleri kullanır.
  </Accordion>

  <Accordion title="Araçlar ham metin olarak işleniyor">
    Bir Qwen modeli bir skill yürütmek yerine JSON/XML araç söz dizimi yazdırıyorsa
    yukarıdaki Gelişmiş yapılandırma bölümündeki Qwen rehberliğini kontrol edin.
    Olağan düzeltme şudur:

    - vLLM'i ilgili model için doğru ayrıştırıcı/şablonla başlatın
    - tam model kimliğini `openclaw models list --provider vllm` ile doğrulayın
    - yalnızca `tool_choice: "auto"` hâlâ boş veya yalnızca metin içeren araç
      çağrıları döndürüyorsa özel bir model başına
      `params.extra_body.tool_choice: "required"` geçersiz kılması ekleyin

  </Accordion>
</AccordionGroup>

<Warning>
Daha fazla yardım: [Sorun Giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="OpenAI" href="/tr/providers/openai" icon="bolt">
    Yerel OpenAI sağlayıcısı ve OpenAI uyumlu yönlendirme davranışı.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve bunların nasıl çözüleceği.
  </Card>
</CardGroup>

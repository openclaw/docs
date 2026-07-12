---
read_when:
    - OpenClaw'u yerel bir vLLM sunucusuyla çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu /v1 uç noktaları istiyorsunuz
summary: OpenClaw'u vLLM ile çalıştırma (OpenAI uyumlu yerel sunucu)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T12:11:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM, açık kaynaklı (ve bazı özel) modelleri **OpenAI uyumlu** bir HTTP API üzerinden sunar. OpenClaw, `openai-completions` API'sini kullanarak bağlanır ve `VLLM_API_KEY` ile etkinleştirdiğinizde modelleri **otomatik olarak keşfedebilir**.

| Özellik             | Değer                                      |
| ------------------- | ------------------------------------------ |
| Sağlayıcı kimliği   | `vllm`                                     |
| API                 | `openai-completions` (OpenAI uyumlu)       |
| Kimlik doğrulama    | `VLLM_API_KEY` ortam değişkeni              |
| Varsayılan temel URL | `http://127.0.0.1:8000/v1`                |
| Akış kullanım bilgisi | Desteklenir (`stream_options.include_usage`) |

## Başlarken

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    Temel URL'niz `/v1` uç noktalarını (`/v1/models`, `/v1/chat/completions`) sunmalıdır. vLLM genellikle şu adreste çalışır:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa boş olmayan herhangi bir değer kullanılabilir:

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

<Tip>
Etkileşimsiz kurulum (CI, betik çalıştırma) için temel URL'yi, anahtarı ve modeli doğrudan iletin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## Model keşfi (örtük sağlayıcı)

`VLLM_API_KEY` ayarlandığında (veya bir kimlik doğrulama profili bulunduğunda) ve `models.providers.vllm` tanımlı **olmadığında**, OpenClaw `GET http://127.0.0.1:8000/v1/models` sorgusunu yapar ve döndürülen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.vllm` değerini açıkça ayarlarsanız OpenClaw yalnızca bildirdiğiniz modelleri kullanır. OpenClaw'ın ayrıca yapılandırılmış sağlayıcının `/models` uç noktasını sorgulaması ve duyurulan tüm vLLM modellerini dahil etmesi için `agents.defaults.models` bölümüne `"vllm/*": {}` ekleyin.
</Note>

## Açık yapılandırma

vLLM farklı bir ana makine veya bağlantı noktasında çalışıyorsa, `contextWindow`/`maxTokens` değerlerini sabitlemek istiyorsanız, sunucunuz gerçek bir API anahtarı gerektiriyorsa ya da güvenilir bir local loopback, LAN veya Tailscale uç noktasına bağlanıyorsanız açıkça yapılandırın:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
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

Her modeli listelemeden sağlayıcıyı dinamik tutmak için görünür model kataloğuna bir joker karakter ekleyin:

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
    vLLM, yerel bir OpenAI uç noktası olarak değil, proxy tarzı OpenAI uyumlu bir `/v1` arka ucu olarak değerlendirilir:

    | Davranış                                      | Uygulanıyor mu?                              |
    | --------------------------------------------- | -------------------------------------------- |
    | Yerel OpenAI istek biçimlendirmesi            | Hayır                                        |
    | `service_tier`                                | Gönderilmez                                  |
    | Responses `store`                             | Gönderilmez                                  |
    | İstem önbelleği ipuçları                      | Gönderilmez                                  |
    | OpenAI akıl yürütme uyumluluk yükü biçimlendirmesi | Uygulanmaz                              |
    | Gizli OpenClaw ilişkilendirme üstbilgileri    | Özel temel URL'lere eklenmez                 |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    Qwen modellerinde, sunucu Qwen sohbet şablonu anahtar sözcük argümanlarını bekliyorsa model satırında `compat.thinkingFormat: "qwen-chat-template"` ayarını yapın. Qwen sohbet şablonunda düşünme, OpenAI tarzı bir efor kademesi değil açma/kapama bayrağı olduğundan bu modeller ikili bir `/think` profili (`off`, `on`) sunar.

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

    OpenClaw, `/think off` komutunu şuna eşler:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    `off` dışındaki düşünme düzeyleri `enable_thinking: true` gönderir. Uç noktanız bunun yerine DashScope tarzı üst düzey bayraklar bekliyorsa `enable_thinking` değerini istek kökünde göndermek için `compat.thinkingFormat: "qwen"` kullanın.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    Düşünmenin kapalı olduğu `vllm/nemotron-3-*` modellerinde paketle gelen Plugin şunu gönderir:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Bu değerleri özelleştirmek için model parametreleri altında `chat_template_kwargs` ayarını yapın. Ayrıca `params.extra_body.chat_template_kwargs` ayarını da yaparsanız `extra_body`, istek gövdesine uygulanan son geçersiz kılma olduğundan bu değer öncelikli olur.

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

  <Accordion title="Qwen tool calls appear as text">
    Öncelikle vLLM'nin model için doğru araç çağrısı ayrıştırıcısı ve sohbet şablonuyla başlatıldığını doğrulayın. vLLM belgeleri, Qwen2.5 modelleri için `hermes`, Qwen3-Coder modelleri için `qwen3_xml` kullanımını belirtir.

    Belirtiler: Skills/araçlar hiçbir zaman çalışmaz, asistan `{"name":"read","arguments":...}` gibi ham JSON/XML yazdırır veya OpenClaw `tool_choice: "auto"` gönderdiğinde vLLM boş bir `tool_calls` dizisi döndürür.

    Bazı Qwen/vLLM birleşimleri yalnızca istekte `tool_choice: "required"` kullanıldığında yapılandırılmış araç çağrıları döndürür. Bunu `params.extra_body` ile model başına zorunlu kılın:

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

    Model kimliğini `openclaw models list --provider vllm` çıktısındaki tam kimlikle değiştirin veya aynı geçersiz kılmayı CLI üzerinden uygulayın:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Bu, isteğe bağlı bir geçici çözümdür: araçların bulunduğu her turda bir araç çağrısını zorunlu kılar; bu nedenle yalnızca bunun kabul edilebilir olduğu özel bir model girdisinde kullanın. Bunu tüm vLLM modelleri için genel varsayılan olarak ayarlamayın ve rastgele asistan metnini çalıştırılabilir araç çağrılarına dönüştüren bir proxy ile birlikte kullanmayın.

  </Accordion>

  <Accordion title="Custom base URL">
    vLLM sunucunuz varsayılan olmayan bir ana makine veya bağlantı noktasında çalışıyorsa açık sağlayıcı yapılandırmasında `baseUrl` değerini ayarlayın:

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

## Sorun giderme

<AccordionGroup>
  <Accordion title="Slow first response or remote server timeout">
    Büyük yerel modeller, uzak LAN ana makineleri veya tailnet bağlantıları için sağlayıcı kapsamlı bir istek zaman aşımı ayarlayın:

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

    `timeoutSeconds` yalnızca vLLM modeli HTTP isteklerine uygulanır: bağlantı kurulumu, yanıt üstbilgileri, gövde akışı ve korumalı getirmenin toplam iptali. Ayrıca bu sağlayıcı için LLM boşta kalma/akış gözetleyicisi üst sınırını örtük yaklaşık 120 saniyelik varsayılanın üzerine çıkarır. Tüm ajan çalışmasını denetleyen `agents.defaults.timeoutSeconds` değerini artırmak yerine bunu tercih edin.

  </Accordion>

  <Accordion title="Server not reachable">
    vLLM sunucusunun çalıştığını ve erişilebilir olduğunu kontrol edin:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Bağlantı hatası görürseniz ana makineyi, bağlantı noktasını ve vLLM'nin OpenAI uyumlu sunucu modunda başlatıldığını doğrulayın. OpenClaw; local loopback, LAN ve Tailscale uç noktalarındaki korumalı model istekleri için tam olarak yapılandırılmış `models.providers.vllm.baseUrl` kaynağına güvenir. Meta veri/bağlantı-yerel kaynakları, açıkça etkinleştirilmedikçe engellenmeye devam eder. Yalnızca vLLM isteklerinin başka bir özel kaynağa ulaşması gerektiğinde `models.providers.vllm.request.allowPrivateNetwork: true`, tam kaynak güvenini devre dışı bırakmak içinse `false` ayarını kullanın.

  </Accordion>

  <Accordion title="Auth errors on requests">
    İstekler kimlik doğrulama hatalarıyla başarısız olursa sunucu yapılandırmanızla eşleşen gerçek bir `VLLM_API_KEY` ayarlayın veya sağlayıcıyı `models.providers.vllm` altında açıkça yapılandırın.

    <Tip>
    vLLM sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa `VLLM_API_KEY` için boş olmayan herhangi bir değer, OpenClaw'a yönelik bir etkinleştirme sinyali olarak kullanılabilir.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    Otomatik keşif için `VLLM_API_KEY` ayarlanmalıdır. `models.providers.vllm` tanımladıysanız `agents.defaults.models`, `"vllm/*": {}` içermediği sürece OpenClaw yalnızca bildirdiğiniz modelleri kullanır.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Bir Qwen modeli bir Skills çalıştırmak yerine JSON/XML araç söz dizimini yazdırıyorsa:

    - vLLM'yi o model için doğru ayrıştırıcı/şablonla başlatın.
    - Tam model kimliğini `openclaw models list --provider vllm` ile doğrulayın.
    - Yalnızca `tool_choice: "auto"` hâlâ boş veya yalnızca metinden oluşan araç çağrıları döndürüyorsa modele özel bir `params.extra_body.tool_choice: "required"` geçersiz kılması ekleyin.

  </Accordion>
</AccordionGroup>

<Warning>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Warning>

## İlgili konular

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="OpenAI" href="/tr/providers/openai" icon="bolt">
    Yerel OpenAI sağlayıcısı ve OpenAI uyumlu rota davranışı.
  </Card>
  <Card title="OAuth and auth" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgilerini yeniden kullanma kuralları.
  </Card>
  <Card title="Troubleshooting" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve bunların nasıl çözüleceği.
  </Card>
</CardGroup>

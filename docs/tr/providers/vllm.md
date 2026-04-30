---
read_when:
    - OpenClaw’ı yerel bir vLLM sunucusuyla çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu /v1 uç noktaları istiyorsunuz
summary: OpenClaw’ı vLLM ile çalıştırın (OpenAI uyumlu yerel sunucu)
title: vLLM
x-i18n:
    generated_at: "2026-04-30T09:42:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM, açık kaynaklı (ve bazı özel) modelleri **OpenAI uyumlu** bir HTTP API üzerinden sunabilir. OpenClaw, `openai-completions` API'sini kullanarak vLLM'ye bağlanır.

OpenClaw, `VLLM_API_KEY` ile dahil olduğunuzda (sunucunuz kimlik doğrulamayı zorunlu tutmuyorsa herhangi bir değer çalışır) ve açık bir `models.providers.vllm` girdisi tanımlamadığınızda vLLM'deki kullanılabilir modelleri de **otomatik keşfedebilir**.

OpenClaw, `vllm` öğesini akışlı kullanım muhasebesini destekleyen yerel bir OpenAI uyumlu sağlayıcı olarak ele alır; böylece durum/bağlam token sayıları `stream_options.include_usage` yanıtlarından güncellenebilir.

| Özellik             | Değer                                    |
| ------------------- | ---------------------------------------- |
| Sağlayıcı kimliği   | `vllm`                                   |
| API                 | `openai-completions` (OpenAI uyumlu)     |
| Kimlik doğrulama    | `VLLM_API_KEY` ortam değişkeni           |
| Varsayılan temel URL | `http://127.0.0.1:8000/v1`              |

## Başlarken

<Steps>
  <Step title="OpenAI uyumlu bir sunucuyla vLLM'yi başlatın">
    Temel URL'niz `/v1` uç noktalarını sunmalıdır (ör. `/v1/models`, `/v1/chat/completions`). vLLM genellikle şurada çalışır:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API anahtarı ortam değişkenini ayarlayın">
    Sunucunuz kimlik doğrulamayı zorunlu tutmuyorsa herhangi bir değer çalışır:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Bir model seçin">
    Kendi vLLM model kimliklerinizden biriyle değiştirin:

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
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
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

ve döndürülen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.vllm` öğesini açıkça ayarlarsanız otomatik keşif atlanır ve modelleri elle tanımlamanız gerekir.
</Note>

## Açık yapılandırma (elle modeller)

Açık yapılandırmayı şu durumlarda kullanın:

- vLLM farklı bir ana makine veya bağlantı noktasında çalışıyorsa
- `contextWindow` veya `maxTokens` değerlerini sabitlemek istiyorsanız
- Sunucunuz gerçek bir API anahtarı gerektiriyorsa (veya üstbilgileri kontrol etmek istiyorsanız)
- Güvenilir bir loopback, LAN veya Tailscale vLLM uç noktasına bağlanıyorsanız

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
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

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Proxy tarzı davranış">
    vLLM, yerel bir OpenAI uç noktası değil, proxy tarzı OpenAI uyumlu bir `/v1` arka ucu olarak ele alınır. Bunun anlamı:

    | Davranış | Uygulandı mı? |
    |----------|---------------|
    | Yerel OpenAI istek şekillendirmesi | Hayır |
    | `service_tier` | Gönderilmez |
    | Responses `store` | Gönderilmez |
    | İstem önbelleği ipuçları | Gönderilmez |
    | OpenAI reasoning uyumluluğu yük şekillendirmesi | Uygulanmaz |
    | Gizli OpenClaw atıf üstbilgileri | Özel temel URL'lerde enjekte edilmez |

  </Accordion>

  <Accordion title="Qwen düşünme kontrolleri">
    vLLM üzerinden sunulan Qwen modelleri için, sunucu Qwen chat-template kwargs bekliyorsa model girdisinde `params.qwenThinkingFormat: "chat-template"` ayarlayın. OpenClaw, `/think off` öğesini şuna eşler:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    `off` olmayan düşünme seviyeleri `enable_thinking: true` gönderir. Uç noktanız bunun yerine DashScope tarzı üst düzey bayraklar bekliyorsa, istek kökünde `enable_thinking` göndermek için `params.qwenThinkingFormat: "top-level"` kullanın. Snake-case `params.qwen_thinking_format` da kabul edilir.

  </Accordion>

  <Accordion title="Nemotron 3 düşünme kontrolleri">
    vLLM/Nemotron 3, reasoning'in gizli reasoning olarak mı yoksa görünür yanıt metni olarak mı döndürüleceğini kontrol etmek için chat-template kwargs kullanabilir. Bir OpenClaw oturumu düşünme kapalıyken `vllm/nemotron-3-*` kullandığında, paketle gelen vLLM Plugin'i şunu gönderir:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Bu değerleri özelleştirmek için model params altında `chat_template_kwargs` ayarlayın. Ayrıca `params.extra_body.chat_template_kwargs` ayarlarsanız, `extra_body` son istek gövdesi geçersiz kılması olduğu için son öncelik o değerde olur.

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
    Önce vLLM'nin model için doğru araç çağrısı ayrıştırıcısı ve chat template ile başlatıldığından emin olun. Örneğin vLLM, Qwen2.5 modelleri için `hermes` ve Qwen3-Coder modelleri için `qwen3_xml` belgeler.

    Belirtiler:

    - Skills veya araçlar hiç çalışmaz
    - asistan `{"name":"read","arguments":...}` gibi ham JSON/XML yazdırır
    - OpenClaw `tool_choice: "auto"` gönderdiğinde vLLM boş bir `tool_calls` dizisi döndürür

    Bazı Qwen/vLLM kombinasyonları, yapılandırılmış araç çağrılarını yalnızca istek `tool_choice: "required"` kullandığında döndürür. Bu model girdileri için OpenAI uyumlu istek alanını `params.extra_body` ile zorlayın:

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

    Aynı geçersiz kılmayı CLI'dan uygulayabilirsiniz:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Bu, isteğe bağlı bir uyumluluk geçici çözümüdür. Araçlar içeren her model dönüşünün bir araç çağrısı gerektirmesine neden olur; bu yüzden yalnızca bu davranışın kabul edilebilir olduğu özel bir yerel model girdisi için kullanın. Tüm vLLM modelleri için genel varsayılan olarak kullanmayın ve rastgele asistan metnini körlemesine çalıştırılabilir araç çağrılarına dönüştüren bir proxy kullanmayın.

  </Accordion>

  <Accordion title="Özel temel URL">
    vLLM sunucunuz varsayılan olmayan bir ana makine veya bağlantı noktasında çalışıyorsa, açık sağlayıcı yapılandırmasında `baseUrl` ayarlayın:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
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
  <Accordion title="Yavaş ilk yanıt veya uzak sunucu zaman aşımı">
    Büyük yerel modeller, uzak LAN ana makineleri veya tailnet bağlantıları için sağlayıcı kapsamlı bir istek zaman aşımı ayarlayın:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds`, bağlantı kurulumu, yanıt üstbilgileri, gövde akışı ve toplam korumalı fetch iptali dahil olmak üzere yalnızca vLLM model HTTP isteklerine uygulanır. Tüm ajan çalışmasını kontrol eden `agents.defaults.timeoutSeconds` değerini artırmadan önce bunu tercih edin.

  </Accordion>

  <Accordion title="Sunucuya ulaşılamıyor">
    vLLM sunucusunun çalıştığını ve erişilebilir olduğunu kontrol edin:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Bir bağlantı hatası görürseniz ana makineyi, bağlantı noktasını ve vLLM'nin OpenAI uyumlu sunucu moduyla başlatıldığını doğrulayın.
    Açık loopback, LAN veya Tailscale uç noktaları için ayrıca `models.providers.vllm.request.allowPrivateNetwork: true` ayarlayın; sağlayıcı açıkça güvenilir olarak belirtilmedikçe sağlayıcı istekleri varsayılan olarak özel ağ URL'lerini engeller.

  </Accordion>

  <Accordion title="İsteklerde kimlik doğrulama hataları">
    İstekler kimlik doğrulama hatalarıyla başarısız olursa, sunucu yapılandırmanızla eşleşen gerçek bir `VLLM_API_KEY` ayarlayın veya sağlayıcıyı `models.providers.vllm` altında açıkça yapılandırın.

    <Tip>
    vLLM sunucunuz kimlik doğrulamayı zorunlu tutmuyorsa, `VLLM_API_KEY` için boş olmayan herhangi bir değer OpenClaw için isteğe bağlı katılım sinyali olarak çalışır.
    </Tip>

  </Accordion>

  <Accordion title="Hiçbir model keşfedilmedi">
    Otomatik keşif, `VLLM_API_KEY` değerinin ayarlanmış olmasını **ve** açık bir `models.providers.vllm` yapılandırma girdisi olmamasını gerektirir. Sağlayıcıyı elle tanımladıysanız OpenClaw keşfi atlar ve yalnızca bildirdiğiniz modelleri kullanır.
  </Accordion>

  <Accordion title="Araçlar ham metin olarak işleniyor">
    Bir Qwen modeli bir skill çalıştırmak yerine JSON/XML araç söz dizimini yazdırıyorsa, yukarıdaki Gelişmiş yapılandırma bölümündeki Qwen yönlendirmesini kontrol edin. Olağan çözüm şudur:

    - vLLM'yi o model için doğru ayrıştırıcı/şablonla başlatın
    - tam model kimliğini `openclaw models list --provider vllm` ile doğrulayın
    - yalnızca `tool_choice: "auto"` hâlâ boş veya yalnızca metin araç çağrıları döndürüyorsa özel bir model başına `params.extra_body.tool_choice: "required"` geçersiz kılması ekleyin

  </Accordion>
</AccordionGroup>

<Warning>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="OpenAI" href="/tr/providers/openai" icon="bolt">
    Yerel OpenAI sağlayıcısı ve OpenAI uyumlu rota davranışı.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve bunların nasıl çözüleceği.
  </Card>
</CardGroup>

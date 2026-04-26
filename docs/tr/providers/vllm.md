---
read_when:
    - OpenClaw'ı yerel bir vLLM sunucusuna karşı çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu `/v1` uç noktaları istiyorsunuz
summary: OpenClaw'ı vLLM ile çalıştırın (OpenAI uyumlu yerel sunucu)
title: vLLM
x-i18n:
    generated_at: "2026-04-26T11:39:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
    source_path: providers/vllm.md
    workflow: 15
---

vLLM, **OpenAI uyumlu** bir HTTP API üzerinden açık kaynaklı (ve bazı özel) modelleri sunabilir. OpenClaw, `openai-completions` API'sini kullanarak vLLM'e bağlanır.

Ayrıca OpenClaw, `VLLM_API_KEY` ile etkinleştirdiğinizde (sunucunuz auth zorlamıyorsa herhangi bir değer çalışır) ve açık bir `models.providers.vllm` girdisi tanımlamadığınızda vLLM'deki kullanılabilir modelleri **otomatik keşfedebilir**.

OpenClaw, `vllm` sağlayıcısını akışlı kullanım muhasebesini destekleyen yerel, OpenAI uyumlu bir sağlayıcı olarak ele alır; bu nedenle durum/bağlam token sayıları `stream_options.include_usage` yanıtlarından güncellenebilir.

| Özellik          | Değer                                    |
| ---------------- | ---------------------------------------- |
| Sağlayıcı Kimliği | `vllm`                                   |
| API              | `openai-completions` (OpenAI uyumlu)     |
| Kimlik doğrulama | `VLLM_API_KEY` ortam değişkeni           |
| Varsayılan temel URL | `http://127.0.0.1:8000/v1`           |

## Başlangıç

<Steps>
  <Step title="OpenAI uyumlu bir sunucuyla vLLM'i başlatın">
    Temel URL'niz `/v1` uç noktalarını açığa çıkarmalıdır (ör. `/v1/models`, `/v1/chat/completions`). vLLM yaygın olarak şu adreste çalışır:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API anahtarı ortam değişkenini ayarlayın">
    Sunucunuz auth zorlamıyorsa herhangi bir değer çalışır:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Bir model seçin">
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
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Model keşfi (örtük sağlayıcı)

`VLLM_API_KEY` ayarlandığında (veya bir auth profili mevcut olduğunda) ve `models.providers.vllm` tanımlamadığınızda, OpenClaw şu sorguyu yapar:

```
GET http://127.0.0.1:8000/v1/models
```

ve dönen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.vllm` değerini açıkça ayarlarsanız otomatik keşif atlanır ve modelleri elle tanımlamanız gerekir.
</Note>

## Açık yapılandırma (manuel modeller)

Şu durumlarda açık yapılandırma kullanın:

- vLLM farklı bir ana bilgisayar veya bağlantı noktasında çalışıyorsa
- `contextWindow` veya `maxTokens` değerlerini sabitlemek istiyorsanız
- Sunucunuz gerçek bir API anahtarı gerektiriyorsa (veya başlıkları denetlemek istiyorsanız)
- Güvenilir bir local loopback, LAN veya Tailscale vLLM uç noktasına bağlanıyorsanız

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        models: [
          {
            id: "your-model-id",
            name: "Yerel vLLM Modeli",
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
    vLLM, yerel bir OpenAI uç noktası olarak değil, proxy tarzı OpenAI uyumlu bir `/v1` backend'i olarak ele alınır. Bunun anlamı şudur:

    | Davranış | Uygulanır mı? |
    |----------|---------------|
    | Yerel OpenAI istek şekillendirmesi | Hayır |
    | `service_tier` | Gönderilmez |
    | Responses `store` | Gönderilmez |
    | Prompt önbellek ipuçları | Gönderilmez |
    | OpenAI reasoning uyumluluk yük şekillendirmesi | Uygulanmaz |
    | Gizli OpenClaw ilişkilendirme başlıkları | Özel temel URL'lerde eklenmez |

  </Accordion>

  <Accordion title="Nemotron 3 thinking denetimleri">
    vLLM/Nemotron 3, reasoning'in gizli reasoning olarak mı yoksa görünür yanıt metni olarak mı döndürüleceğini denetlemek için chat-template kwargs kullanabilir. Bir OpenClaw oturumu
    thinking kapalıyken `vllm/nemotron-3-*` kullandığında, OpenClaw şunu gönderir:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Bu değerleri özelleştirmek için `chat_template_kwargs` değerini model params altında ayarlayın.
    Eğer ayrıca `params.extra_body.chat_template_kwargs` ayarlarsanız, bu değer
    son önceliğe sahip olur çünkü `extra_body` istek gövdesi için son geçersiz kılmadır.

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

  <Accordion title="Özel temel URL">
    vLLM sunucunuz varsayılan olmayan bir ana bilgisayar veya bağlantı noktasında çalışıyorsa, açık sağlayıcı yapılandırmasında `baseUrl` ayarlayın:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            models: [
              {
                id: "my-custom-model",
                name: "Uzak vLLM Modeli",
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
  <Accordion title="Sunucuya ulaşılamıyor">
    vLLM sunucusunun çalıştığını ve erişilebilir olduğunu denetleyin:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Bir bağlantı hatası görüyorsanız ana bilgisayarı, bağlantı noktasını ve vLLM'in OpenAI uyumlu sunucu moduyla başlatıldığını doğrulayın.
    Açık local loopback, LAN veya Tailscale uç noktaları için ayrıca
    `models.providers.vllm.request.allowPrivateNetwork: true` ayarlayın; sağlayıcı
    istekleri, sağlayıcı açıkça güvenilir olarak işaretlenmedikçe varsayılan olarak özel ağ URL'lerini engeller.

  </Accordion>

  <Accordion title="İsteklerde auth hataları">
    İstekler auth hatalarıyla başarısız oluyorsa, sunucu yapılandırmanızla eşleşen gerçek bir `VLLM_API_KEY` ayarlayın veya sağlayıcıyı `models.providers.vllm` altında açıkça yapılandırın.

    <Tip>
    vLLM sunucunuz auth zorlamıyorsa, `VLLM_API_KEY` için boş olmayan herhangi bir değer OpenClaw için etkinleştirme sinyali olarak çalışır.
    </Tip>

  </Accordion>

  <Accordion title="Hiç model keşfedilmedi">
    Otomatik keşif için `VLLM_API_KEY` değerinin ayarlanmış olması **ve** açık bir `models.providers.vllm` yapılandırma girdisinin olmaması gerekir. Sağlayıcıyı elle tanımladıysanız, OpenClaw keşfi atlar ve yalnızca bildirdiğiniz modelleri kullanır.
  </Accordion>
</AccordionGroup>

<Warning>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="OpenAI" href="/tr/providers/openai" icon="bolt">
    Yerel OpenAI sağlayıcısı ve OpenAI uyumlu rota davranışı.
  </Card>
  <Card title="OAuth ve auth" href="/tr/gateway/authentication" icon="key">
    Auth ayrıntıları ve kimlik bilgisi yeniden kullanma kuralları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve bunların nasıl çözüleceği.
  </Card>
</CardGroup>

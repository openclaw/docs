---
read_when:
    - OpenClaw'ı yerel bir vLLM sunucusuna karşı çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu `/v1` uç noktalarını istiyorsunuz
summary: OpenClaw'ı vLLM ile çalıştırma (OpenAI uyumlu yerel sunucu)
title: vLLM
x-i18n:
    generated_at: "2026-04-12T23:33:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a43be9ae879158fcd69d50fb3a47616fd560e3c6fe4ecb3a109bdda6a63a6a80
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM, **OpenAI uyumlu** bir HTTP API üzerinden açık kaynaklı (ve bazı özel) modelleri sunabilir. OpenClaw, vLLM'e `openai-completions` API'sini kullanarak bağlanır.

OpenClaw ayrıca, `VLLM_API_KEY` ile açıkça etkinleştirdiğinizde (sunucunuz kimlik doğrulamayı zorlamıyorsa herhangi bir değer çalışır) ve açık bir `models.providers.vllm` girdisi tanımlamadığınızda, vLLM'den kullanılabilir modelleri **otomatik keşfedebilir**.

| Özellik         | Değer                                    |
| ---------------- | ---------------------------------------- |
| Sağlayıcı ID'si | `vllm`                                   |
| API              | `openai-completions` (OpenAI uyumlu)     |
| Kimlik doğrulama | `VLLM_API_KEY` ortam değişkeni           |
| Varsayılan taban URL | `http://127.0.0.1:8000/v1`           |

## Başlangıç

<Steps>
  <Step title="OpenAI uyumlu bir sunucuyla vLLM'i başlatın">
    Taban URL'niz `/v1` uç noktalarını sunmalıdır (ör. `/v1/models`, `/v1/chat/completions`). vLLM yaygın olarak şu adreste çalışır:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API anahtarı ortam değişkenini ayarlayın">
    Sunucunuz kimlik doğrulamayı zorlamıyorsa herhangi bir değer çalışır:

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

`VLLM_API_KEY` ayarlandığında (veya bir kimlik doğrulama profili mevcut olduğunda) ve `models.providers.vllm` tanımlamadığınızda, OpenClaw şu isteği sorgular:

```
GET http://127.0.0.1:8000/v1/models
```

ve dönen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.vllm` değerini açıkça ayarlarsanız otomatik keşif atlanır ve modelleri elle tanımlamanız gerekir.
</Note>

## Açık yapılandırma (manuel modeller)

Şu durumlarda açık yapılandırma kullanın:

- vLLM farklı bir ana makinede veya bağlantı noktasında çalışıyorsa
- `contextWindow` veya `maxTokens` değerlerini sabitlemek istiyorsanız
- Sunucunuz gerçek bir API anahtarı gerektiriyorsa (veya üst bilgileri kontrol etmek istiyorsanız)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
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

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Proxy tarzı davranış">
    vLLM, yerel bir
    OpenAI uç noktası olarak değil, proxy tarzı OpenAI uyumlu bir `/v1` backend'i olarak ele alınır. Bu şu anlama gelir:

    | Davranış | Uygulanır mı? |
    |----------|---------------|
    | Yerel OpenAI istek şekillendirmesi | Hayır |
    | `service_tier` | Gönderilmez |
    | Responses `store` | Gönderilmez |
    | İstem önbelleği ipuçları | Gönderilmez |
    | OpenAI reasoning-compat yük şekillendirmesi | Uygulanmaz |
    | Gizli OpenClaw ilişkilendirme üst bilgileri | Özel taban URL'lerde eklenmez |

  </Accordion>

  <Accordion title="Özel taban URL">
    vLLM sunucunuz varsayılan olmayan bir ana makinede veya bağlantı noktasında çalışıyorsa, açık sağlayıcı yapılandırmasında `baseUrl` ayarlayın:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
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

    Bağlantı hatası görürseniz ana makineyi, bağlantı noktasını ve vLLM'in OpenAI uyumlu sunucu kipinde başlatıldığını doğrulayın.

  </Accordion>

  <Accordion title="İsteklerde kimlik doğrulama hataları">
    İstekler kimlik doğrulama hatalarıyla başarısız oluyorsa, sunucu yapılandırmanızla eşleşen gerçek bir `VLLM_API_KEY` ayarlayın veya sağlayıcıyı `models.providers.vllm` altında açıkça yapılandırın.

    <Tip>
    vLLM sunucunuz kimlik doğrulamayı zorlamıyorsa, `VLLM_API_KEY` için boş olmayan herhangi bir değer OpenClaw için açık etkinleştirme sinyali olarak çalışır.
    </Tip>

  </Accordion>

  <Accordion title="Hiç model keşfedilmedi">
    Otomatik keşif için `VLLM_API_KEY` ayarlanmış **olmalı** ve açık bir `models.providers.vllm` yapılandırma girdisi bulunmamalıdır. Sağlayıcıyı elle tanımladıysanız OpenClaw keşfi atlar ve yalnızca bildirdiğiniz modelleri kullanır.
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
    Yerel OpenAI sağlayıcısı ve OpenAI uyumlu yol davranışı.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve bunların nasıl çözüleceği.
  </Card>
</CardGroup>

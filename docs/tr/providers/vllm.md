---
read_when:
    - OpenClaw’ı yerel bir vLLM sunucusuna karşı çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu `/v1` uç noktalarını istiyorsunuz
summary: OpenClaw’ı vLLM ile çalıştırın (OpenAI uyumlu yerel sunucu)
title: vLLM
x-i18n:
    generated_at: "2026-04-24T09:28:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0296422a926c83b1ab5ffdac7857e34253b624f0d8756c02d49f8805869a219
    source_path: providers/vllm.md
    workflow: 15
---

vLLM, **OpenAI uyumlu** bir HTTP API üzerinden açık kaynaklı (ve bazı özel) modelleri sunabilir. OpenClaw, vLLM’e `openai-completions` API’sini kullanarak bağlanır.

OpenClaw, `VLLM_API_KEY` ile katılım yaptığınızda (sunucunuz kimlik doğrulamayı zorlamıyorsa herhangi bir değer çalışır) ve açık bir `models.providers.vllm` girdisi tanımlamadığınızda, vLLM’de kullanılabilir modelleri **otomatik olarak keşfedebilir**.

OpenClaw, `stream_options.include_usage` yanıtlarından
durum/bağlam token sayıları güncellenebilsin diye `vllm` sağlayıcısını
akışlı kullanım muhasebesini destekleyen yerel bir OpenAI uyumlu sağlayıcı olarak ele alır.

| Özellik         | Değer                                    |
| ---------------- | ---------------------------------------- |
| Sağlayıcı kimliği | `vllm`                                   |
| API              | `openai-completions` (OpenAI uyumlu)     |
| Kimlik doğrulama | `VLLM_API_KEY` ortam değişkeni           |
| Varsayılan temel URL | `http://127.0.0.1:8000/v1`           |

## Başlarken

<Steps>
  <Step title="OpenAI uyumlu bir sunucuyla vLLM’i başlatın">
    Temel URL’niz `/v1` uç noktalarını açığa çıkarmalıdır (ör. `/v1/models`, `/v1/chat/completions`). vLLM yaygın olarak şu adreste çalışır:

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

`VLLM_API_KEY` ayarlandığında (veya bir kimlik doğrulama profili mevcut olduğunda) ve **`models.providers.vllm` tanımlamadığınızda**, OpenClaw şunu sorgular:

```
GET http://127.0.0.1:8000/v1/models
```

ve döndürülen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.vllm` değerini açıkça ayarlarsanız, otomatik keşif atlanır ve modelleri elle tanımlamanız gerekir.
</Note>

## Açık yapılandırma (elle modeller)

Açık yapılandırmayı şu durumlarda kullanın:

- vLLM farklı bir ana makinede veya bağlantı noktasında çalışıyorsa
- `contextWindow` veya `maxTokens` değerlerini sabitlemek istiyorsanız
- Sunucunuz gerçek bir API anahtarı gerektiriyorsa (veya üstbilgileri denetlemek istiyorsanız)

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
    vLLM, yerel bir OpenAI uç noktası olarak değil, proxy tarzı OpenAI uyumlu bir `/v1` arka ucu olarak ele alınır. Bu şu anlama gelir:

    | Davranış | Uygulanıyor mu? |
    |----------|----------|
    | Yerel OpenAI istek şekillendirmesi | Hayır |
    | `service_tier` | Gönderilmez |
    | Responses `store` | Gönderilmez |
    | İstem önbelleği ipuçları | Gönderilmez |
    | OpenAI akıl yürütme uyumluluk yükü şekillendirmesi | Uygulanmaz |
    | Gizli OpenClaw ilişkilendirme üstbilgileri | Özel temel URL’lerde eklenmez |

  </Accordion>

  <Accordion title="Özel temel URL">
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
  <Accordion title="Sunucuya ulaşılamıyor">
    vLLM sunucusunun çalıştığını ve erişilebilir olduğunu denetleyin:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Bir bağlantı hatası görürseniz, ana makineyi, bağlantı noktasını ve vLLM’in OpenAI uyumlu sunucu kipinde başlatıldığını doğrulayın.

  </Accordion>

  <Accordion title="İsteklerde kimlik doğrulama hataları">
    İstekler kimlik doğrulama hatalarıyla başarısız olursa, sunucu yapılandırmanızla eşleşen gerçek bir `VLLM_API_KEY` ayarlayın veya sağlayıcıyı `models.providers.vllm` altında açıkça yapılandırın.

    <Tip>
    vLLM sunucunuz kimlik doğrulamayı zorlamıyorsa, `VLLM_API_KEY` için boş olmayan herhangi bir değer OpenClaw için bir katılım sinyali olarak çalışır.
    </Tip>

  </Accordion>

  <Accordion title="Hiç model keşfedilmedi">
    Otomatik keşif, `VLLM_API_KEY`’in ayarlanmasını **ve** açık bir `models.providers.vllm` yapılandırma girdisinin olmamasını gerektirir. Sağlayıcıyı elle tanımladıysanız, OpenClaw keşfi atlar ve yalnızca bildirdiğiniz modelleri kullanır.
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

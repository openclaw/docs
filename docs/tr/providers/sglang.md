---
read_when:
    - OpenClaw'ı yerel bir SGLang sunucusuyla çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu /v1 uç noktaları istiyorsunuz
summary: OpenClaw'u SGLang ile çalıştırın (OpenAI uyumlu, kendi kendine barındırılan sunucu)
title: SGLang
x-i18n:
    generated_at: "2026-05-06T09:28:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e65e38868e061e03d15348725971880ca503dc61a7425c1fbdc718fd684728f
    source_path: providers/sglang.md
    workflow: 16
---

SGLang, açık ağırlıklı modelleri OpenAI uyumlu bir HTTP API üzerinden sunar. OpenClaw, kullanılabilir modellerin otomatik keşfiyle `openai-completions` sağlayıcı ailesini kullanarak SGLang’e bağlanır.

| Özellik                  | Değer                                                        |
| ------------------------- | ------------------------------------------------------------ |
| Sağlayıcı kimliği               | `sglang`                                                     |
| Plugin                    | paketle birlikte gelir, `enabledByDefault: true`                            |
| Kimlik doğrulama ortam değişkeni              | `SGLANG_API_KEY` (sunucuda kimlik doğrulama yoksa boş olmayan herhangi bir değer) |
| İlk kurulum bayrağı           | `--auth-choice sglang`                                       |
| API                       | OpenAI uyumlu (`openai-completions`)                     |
| Varsayılan temel URL          | `http://127.0.0.1:30000/v1`                                  |
| Varsayılan model yer tutucusu | `sglang/Qwen/Qwen3-8B`                                       |
| Akış kullanım bilgisi           | Evet (`supportsStreamingUsage: true`)                         |
| Fiyatlandırma                   | harici ücretsiz olarak işaretli (`modelPricing.external: false`)        |

OpenClaw ayrıca `SGLANG_API_KEY` ile dahil olduğunuzda ve açık bir `models.providers.sglang` girdisi tanımlamadığınızda SGLang’den kullanılabilir modelleri **otomatik olarak keşfeder** — aşağıdaki [Model keşfi (örtük sağlayıcı)](#model-discovery-implicit-provider) bölümüne bakın.

## Başlarken

<Steps>
  <Step title="SGLang’i başlat">
    SGLang’i OpenAI uyumlu bir sunucuyla başlatın. Temel URL’niz
    `/v1` uç noktalarını açığa çıkarmalıdır (örneğin `/v1/models`, `/v1/chat/completions`). SGLang
    genellikle şurada çalışır:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Bir API anahtarı ayarla">
    Sunucunuzda kimlik doğrulama yapılandırılmadıysa herhangi bir değer çalışır:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="İlk kurulumu çalıştır veya doğrudan bir model ayarla">
    ```bash
    openclaw onboard
    ```

    Veya modeli elle yapılandırın:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Model keşfi (örtük sağlayıcı)

`SGLANG_API_KEY` ayarlandığında (veya bir kimlik doğrulama profili mevcut olduğunda) ve `models.providers.sglang`
tanımlamadığınızda, OpenClaw şunu sorgular:

- `GET http://127.0.0.1:30000/v1/models`

ve döndürülen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.sglang` değerini açıkça ayarlarsanız otomatik keşif atlanır ve
modelleri elle tanımlamanız gerekir.
</Note>

## Açık yapılandırma (elle modeller)

Şu durumlarda açık yapılandırma kullanın:

- SGLang farklı bir ana makine/bağlantı noktasında çalışıyorsa.
- `contextWindow`/`maxTokens` değerlerini sabitlemek istiyorsanız.
- Sunucunuz gerçek bir API anahtarı gerektiriyorsa (veya üst bilgileri denetlemek istiyorsanız).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
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
    SGLang, yerel bir OpenAI uç noktası olarak değil, proxy tarzı OpenAI uyumlu bir `/v1` arka ucu olarak ele alınır.

    | Davranış | SGLang |
    |----------|--------|
    | Yalnızca OpenAI’ye özgü istek şekillendirme | Uygulanmaz |
    | `service_tier`, Responses `store`, prompt-cache ipuçları | Gönderilmez |
    | Akıl yürütme uyumlu yük şekillendirme | Uygulanmaz |
    | Gizli atıf üst bilgileri (`originator`, `version`, `User-Agent`) | Özel SGLang temel URL’lerinde eklenmez |

  </Accordion>

  <Accordion title="Sorun giderme">
    **Sunucuya ulaşılamıyor**

    Sunucunun çalıştığını ve yanıt verdiğini doğrulayın:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Kimlik doğrulama hataları**

    İstekler kimlik doğrulama hatalarıyla başarısız olursa sunucu yapılandırmanızla eşleşen gerçek bir `SGLANG_API_KEY` ayarlayın veya sağlayıcıyı `models.providers.sglang` altında açıkça yapılandırın.

    <Tip>
    SGLang’i kimlik doğrulama olmadan çalıştırıyorsanız, `SGLANG_API_KEY` için boş olmayan herhangi bir değer model keşfine dahil olmak için yeterlidir.
    </Tip>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı girdileri dahil tam yapılandırma şeması.
  </Card>
</CardGroup>

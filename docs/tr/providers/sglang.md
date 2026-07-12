---
read_when:
    - OpenClaw'u yerel bir SGLang sunucusuyla çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu /v1 uç noktaları istiyorsunuz
summary: OpenClaw'ı SGLang ile çalıştırma (OpenAI uyumlu, kendi barındırdığınız sunucu)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T12:41:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang, açık ağırlıklı modelleri OpenAI uyumlu bir HTTP API üzerinden sunar. OpenClaw, kullanılabilir modelleri otomatik olarak keşfederek `openai-completions` sağlayıcı ailesi üzerinden SGLang'a bağlanır.

| Özellik                    | Değer                                                               |
| -------------------------- | ------------------------------------------------------------------- |
| Sağlayıcı kimliği          | `sglang`                                                            |
| Plugin                     | paketle birlikte gelir, `enabledByDefault: true`                    |
| Kimlik doğrulama ortam değişkeni | `SGLANG_API_KEY` (sunucuda kimlik doğrulama yoksa boş olmayan herhangi bir değer) |
| İlk kurulum bayrağı        | `--auth-choice sglang`                                              |
| API                        | OpenAI uyumlu (`openai-completions`)                                |
| Varsayılan temel URL       | `http://127.0.0.1:30000/v1`                                        |
| Varsayılan model yer tutucusu | `sglang/Qwen/Qwen3-8B`                                           |
| Akış kullanım bilgisi      | Evet (`supportsStreamingUsage: true`)                               |
| Fiyatlandırma              | Harici ücretsiz olarak işaretlenir (`modelPricing.external: false`) |

OpenClaw ayrıca `SGLANG_API_KEY` ile etkinleştirdiğinizde SGLang'daki kullanılabilir modelleri **otomatik olarak keşfeder**. Özel bir SGLang temel URL'si de yapılandırıyorsanız keşfi dinamik tutmak için `agents.defaults.models` içinde `sglang/*` kullanın. Aşağıdaki [Model keşfi (örtük sağlayıcı)](#model-discovery-implicit-provider) bölümüne bakın.

## Başlarken

<Steps>
  <Step title="SGLang'ı başlatın">
    SGLang'ı OpenAI uyumlu bir sunucuyla başlatın. Temel URL'niz
    `/v1` uç noktalarını sunmalıdır (örneğin `/v1/models`, `/v1/chat/completions`). SGLang
    genellikle şu adreste çalışır:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Bir API anahtarı ayarlayın">
    Sunucunuzda kimlik doğrulama yapılandırılmamışsa herhangi bir değer kullanılabilir:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="İlk kurulumu çalıştırın veya doğrudan bir model ayarlayın">
    ```bash
    openclaw onboard
    ```

    Alternatif olarak modeli elle yapılandırın:

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

`SGLANG_API_KEY` ayarlandığında (veya bir kimlik doğrulama profili mevcut olduğunda) ve
`models.providers.sglang` tanımlamadığınızda OpenClaw şu adrese sorgu gönderir:

- `GET http://127.0.0.1:30000/v1/models`

ve döndürülen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.sglang` değerini açıkça ayarlarsanız OpenClaw varsayılan olarak
bildirdiğiniz modelleri kullanır. OpenClaw'ın yapılandırılmış sağlayıcının `/models`
uç noktasını sorgulamasını ve duyurulan tüm SGLang modellerini dahil etmesini
istediğinizde `agents.defaults.models` içine `"sglang/*": {}` ekleyin.
</Note>

## Açık yapılandırma (elle tanımlanan modeller)

Şu durumlarda açık yapılandırma kullanın:

- SGLang farklı bir ana makine veya bağlantı noktasında çalışıyorsa.
- `contextWindow`/`maxTokens` değerlerini sabitlemek istiyorsanız.
- Sunucunuz gerçek bir API anahtarı gerektiriyorsa (veya üstbilgileri denetlemek istiyorsanız).

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
    SGLang, yerel bir OpenAI uç noktası olarak değil, proxy tarzı OpenAI uyumlu
    bir `/v1` arka ucu olarak değerlendirilir.

    | Davranış | SGLang |
    |----------|--------|
    | Yalnızca OpenAI'ye özgü istek biçimlendirmesi | Uygulanmaz |
    | `service_tier`, Responses `store`, istem önbelleği ipuçları | Gönderilmez |
    | Akıl yürütme uyumluluğu için yük biçimlendirmesi | Uygulanmaz |
    | Gizli ilişkilendirme üstbilgileri (`originator`, `version`, `User-Agent`) | Özel SGLang temel URL'lerine eklenmez |

  </Accordion>

  <Accordion title="Sorun giderme">
    **Sunucuya ulaşılamıyor**

    Sunucunun çalıştığını ve yanıt verdiğini doğrulayın:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Kimlik doğrulama hataları**

    İstekler kimlik doğrulama hatalarıyla başarısız olursa sunucu
    yapılandırmanızla eşleşen gerçek bir `SGLANG_API_KEY` ayarlayın veya sağlayıcıyı
    `models.providers.sglang` altında açıkça yapılandırın.

    <Tip>
    SGLang'ı kimlik doğrulama olmadan çalıştırıyorsanız model keşfini etkinleştirmek
    için `SGLANG_API_KEY` değişkeninde boş olmayan herhangi bir değer yeterlidir.
    </Tip>

  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı girdilerini içeren eksiksiz yapılandırma şeması.
  </Card>
</CardGroup>

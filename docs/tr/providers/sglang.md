---
read_when:
    - OpenClaw'ı yerel bir SGLang sunucusuyla çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu /v1 uç noktaları kullanmak istiyorsunuz
summary: OpenClaw'ı SGLang ile çalıştırın (OpenAI uyumlu, kendi barındırdığınız sunucu)
title: SGLang
x-i18n:
    generated_at: "2026-05-13T05:33:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd1a5954e3994e3640ee17c62acedc314716c3ed5e52528da436c36c077ebead
    source_path: providers/sglang.md
    workflow: 16
    postprocess_version: locale-links-v1
---

SGLang, açık ağırlıklı modelleri OpenAI uyumlu bir HTTP API üzerinden sunar. OpenClaw, kullanılabilir modellerin otomatik keşfiyle `openai-completions` sağlayıcı ailesini kullanarak SGLang'e bağlanır.

| Özellik                         | Değer                                                        |
| ------------------------------- | ------------------------------------------------------------ |
| Sağlayıcı kimliği               | `sglang`                                                     |
| Plugin                          | pakete dahil, `enabledByDefault: true`                       |
| Kimlik doğrulama ortam değişkeni | `SGLANG_API_KEY` (sunucuda kimlik doğrulama yoksa boş olmayan herhangi bir değer) |
| Başlangıç kurulumu bayrağı      | `--auth-choice sglang`                                       |
| API                             | OpenAI uyumlu (`openai-completions`)                         |
| Varsayılan taban URL'si         | `http://127.0.0.1:30000/v1`                                  |
| Varsayılan model yer tutucusu   | `sglang/Qwen/Qwen3-8B`                                       |
| Akış kullanımı                  | Evet (`supportsStreamingUsage: true`)                        |
| Fiyatlandırma                   | Harici ücretsiz olarak işaretlendi (`modelPricing.external: false`) |

OpenClaw ayrıca `SGLANG_API_KEY` ile katılım sağladığınızda SGLang'den kullanılabilir modelleri **otomatik olarak keşfeder**. Özel bir SGLang taban URL'si de yapılandırdığınızda keşfi dinamik tutmak için `agents.defaults.models` içinde `sglang/*` kullanın. Aşağıdaki [Model keşfi (örtük sağlayıcı)](#model-discovery-implicit-provider) bölümüne bakın.

## Başlarken

<Steps>
  <Step title="SGLang'i başlat">
    SGLang'i OpenAI uyumlu bir sunucuyla başlatın. Taban URL'niz
    `/v1` uç noktalarını göstermelidir (örneğin `/v1/models`, `/v1/chat/completions`). SGLang
    genellikle şurada çalışır:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Bir API anahtarı ayarla">
    Sunucunuzda kimlik doğrulama yapılandırılmadıysa herhangi bir değer çalışır:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Başlangıç kurulumunu çalıştır veya doğrudan bir model ayarla">
    ```bash
    openclaw onboard
    ```

    Ya da modeli elle yapılandırın:

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
`models.providers.sglang` tanımlamadığınızda, OpenClaw şunu sorgular:

- `GET http://127.0.0.1:30000/v1/models`

ve döndürülen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.sglang` açıkça ayarlanırsa, OpenClaw varsayılan olarak beyan ettiğiniz
modelleri kullanır. OpenClaw'ın yapılandırılan sağlayıcının `/models` uç noktasını sorgulamasını ve
ilan edilen tüm SGLang modellerini dahil etmesini istediğinizde `agents.defaults.models` içine
`"sglang/*": {}` ekleyin.
</Note>

## Açık yapılandırma (elle modeller)

Şu durumlarda açık yapılandırma kullanın:

- SGLang farklı bir ana makinede/bağlantı noktasında çalışıyorsa.
- `contextWindow`/`maxTokens` değerlerini sabitlemek istiyorsanız.
- Sunucunuz gerçek bir API anahtarı gerektiriyorsa (veya başlıkları denetlemek istiyorsanız).

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
    SGLang, yerel bir OpenAI uç noktası değil, proxy tarzı OpenAI uyumlu bir
    `/v1` arka ucu olarak ele alınır.

    | Davranış | SGLang |
    |----------|--------|
    | Yalnızca OpenAI'ye özgü istek şekillendirme | Uygulanmaz |
    | `service_tier`, Responses `store`, istem önbelleği ipuçları | Gönderilmez |
    | Akıl yürütme uyumluluğu yük şekillendirmesi | Uygulanmaz |
    | Gizli ilişkilendirme başlıkları (`originator`, `version`, `User-Agent`) | Özel SGLang taban URL'lerine enjekte edilmez |

  </Accordion>

  <Accordion title="Sorun giderme">
    **Sunucuya ulaşılamıyor**

    Sunucunun çalıştığını ve yanıt verdiğini doğrulayın:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Kimlik doğrulama hataları**

    İstekler kimlik doğrulama hatalarıyla başarısız olursa, sunucu yapılandırmanızla eşleşen gerçek bir
    `SGLANG_API_KEY` ayarlayın veya sağlayıcıyı `models.providers.sglang` altında açıkça yapılandırın.

    <Tip>
    SGLang'i kimlik doğrulama olmadan çalıştırıyorsanız,
    `SGLANG_API_KEY` için boş olmayan herhangi bir değer model keşfine katılmak için yeterlidir.
    </Tip>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı girdilerini içeren tam yapılandırma şeması.
  </Card>
</CardGroup>

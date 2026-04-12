---
read_when:
    - OpenClaw'ı yerel bir SGLang sunucusuna karşı çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu `/v1` uç noktalarını istiyorsunuz
summary: OpenClaw'ı SGLang ile çalıştırın (OpenAI uyumlu, self-hosted sunucu)
title: SGLang
x-i18n:
    generated_at: "2026-04-12T23:32:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0a2e50a499c3d25dcdc3af425fb023c6e3f19ed88f533ecf0eb8a2cb7ec8b0d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang, **OpenAI uyumlu** bir HTTP API üzerinden açık kaynak modelleri sunabilir.
OpenClaw, `openai-completions` API'sini kullanarak SGLang'a bağlanabilir.

OpenClaw ayrıca, `SGLANG_API_KEY` ile açıkça etkinleştirdiğinizde (sunucunuz kimlik doğrulamayı zorlamıyorsa herhangi bir değer çalışır) ve açık bir `models.providers.sglang` girdisi tanımlamadığınızda SGLang'daki kullanılabilir modelleri **otomatik olarak bulabilir**.

## Başlangıç

<Steps>
  <Step title="SGLang'ı başlatın">
    SGLang'ı OpenAI uyumlu bir sunucuyla başlatın. Temel URL'niz
    `/v1` uç noktalarını göstermelidir (örneğin `/v1/models`, `/v1/chat/completions`). SGLang
    yaygın olarak şurada çalışır:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Bir API anahtarı ayarlayın">
    Sunucunuzda kimlik doğrulama yapılandırılmadıysa herhangi bir değer çalışır:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Onboarding çalıştırın veya doğrudan bir model ayarlayın">
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

## Model bulma (örtük sağlayıcı)

`SGLANG_API_KEY` ayarlıysa (veya bir kimlik doğrulama profili varsa) ve
`models.providers.sglang` tanımlı **değilse**, OpenClaw şunu sorgular:

- `GET http://127.0.0.1:30000/v1/models`

ve dönen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.sglang` değerini açıkça ayarlarsanız otomatik bulma atlanır ve
modelleri elle tanımlamanız gerekir.
</Note>

## Açık yapılandırma (manuel modeller)

Şu durumlarda açık yapılandırma kullanın:

- SGLang farklı bir ana makine/bağlantı noktasında çalışıyorsa.
- `contextWindow`/`maxTokens` değerlerini sabitlemek istiyorsanız.
- Sunucunuz gerçek bir API anahtarı gerektiriyorsa (veya başlıkları kontrol etmek istiyorsanız).

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
            name: "Yerel SGLang Modeli",
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
    | Yalnızca OpenAI istek şekillendirmesi | Uygulanmaz |
    | `service_tier`, Responses `store`, prompt-cache ipuçları | Gönderilmez |
    | Reasoning-compat yük şekillendirmesi | Uygulanmaz |
    | Gizli atıf başlıkları (`originator`, `version`, `User-Agent`) | Özel SGLang temel URL'lerine enjekte edilmez |

  </Accordion>

  <Accordion title="Sorun giderme">
    **Sunucuya erişilemiyor**

    Sunucunun çalıştığını ve yanıt verdiğini doğrulayın:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Kimlik doğrulama hataları**

    İstekler kimlik doğrulama hatalarıyla başarısız olursa, sunucu yapılandırmanızla eşleşen gerçek bir `SGLANG_API_KEY` ayarlayın veya sağlayıcıyı
    `models.providers.sglang` altında açıkça yapılandırın.

    <Tip>
    SGLang'ı kimlik doğrulama olmadan çalıştırıyorsanız model bulmaya dahil olmak için
    `SGLANG_API_KEY` için boş olmayan herhangi bir değer yeterlidir.
    </Tip>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve devralma davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı girdileri dahil tam yapılandırma şeması.
  </Card>
</CardGroup>

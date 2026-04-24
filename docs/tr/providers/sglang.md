---
read_when:
    - OpenClaw'ı yerel bir SGLang sunucusuna karşı çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu `/v1` uç noktalarını istiyorsunuz
summary: OpenClaw'ı SGLang ile çalıştırma (OpenAI uyumlu kendi kendine barındırılan sunucu)
title: SGLang
x-i18n:
    generated_at: "2026-04-24T09:27:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 15
---

SGLang, açık kaynak modelleri **OpenAI uyumlu** bir HTTP API üzerinden sunabilir.
OpenClaw, SGLang'a `openai-completions` API kullanarak bağlanabilir.

OpenClaw, `SGLANG_API_KEY` ile katılım sağladığınızda
(Sunucunuz kimlik doğrulamayı zorlamıyorsa herhangi bir değer çalışır)
ve açık bir `models.providers.sglang` girdisi tanımlamadığınızda
SGLang'dan kullanılabilir modelleri **otomatik keşfedebilir**.

OpenClaw, `sglang` değerini yerel, OpenAI uyumlu bir sağlayıcı olarak ele alır ve
akışlı kullanım muhasebesini destekler; böylece durum/bağlam token sayıları
`stream_options.include_usage` yanıtlarından güncellenebilir.

## Başlangıç

<Steps>
  <Step title="SGLang'ı başlatın">
    OpenAI uyumlu bir sunucuyla SGLang'ı başlatın. Base URL'niz
    `/v1` uç noktalarını açığa çıkarmalıdır (örneğin `/v1/models`, `/v1/chat/completions`). SGLang
    genellikle şu adreste çalışır:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Bir API anahtarı ayarlayın">
    Sunucunuzda kimlik doğrulama yapılandırılmamışsa herhangi bir değer çalışır:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="İlk kullanım akışını çalıştırın veya doğrudan bir model ayarlayın">
    ```bash
    openclaw onboard
    ```

    Veya modeli el ile yapılandırın:

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

`SGLANG_API_KEY` ayarlandığında (veya bir kimlik doğrulama profili mevcut olduğunda) ve siz
`models.providers.sglang` tanımlamadığınızda, OpenClaw şu sorguyu yapar:

- `GET http://127.0.0.1:30000/v1/models`

ve dönen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.sglang` değerini açıkça ayarlarsanız otomatik keşif atlanır ve
modelleri el ile tanımlamanız gerekir.
</Note>

## Açık yapılandırma (el ile modeller)

Açık yapılandırmayı şu durumlarda kullanın:

- SGLang farklı bir ana makine/port üzerinde çalışıyorsa.
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
    SGLang, yerel bir OpenAI uç noktası olarak değil,
    proxy tarzı OpenAI uyumlu bir `/v1` arka ucu olarak ele alınır.

    | Davranış | SGLang |
    |----------|--------|
    | Yalnızca OpenAI'ye özgü istek şekillendirme | Uygulanmaz |
    | `service_tier`, Responses `store`, prompt-cache ipuçları | Gönderilmez |
    | Reasoning uyumluluk payload şekillendirmesi | Uygulanmaz |
    | Gizli atıf başlıkları (`originator`, `version`, `User-Agent`) | Özel SGLang base URL'lerine enjekte edilmez |

  </Accordion>

  <Accordion title="Sorun giderme">
    **Sunucuya ulaşılamıyor**

    Sunucunun çalıştığını ve yanıt verdiğini doğrulayın:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Kimlik doğrulama hataları**

    İstekler kimlik doğrulama hatalarıyla başarısız oluyorsa sunucu yapılandırmanızla eşleşen gerçek bir `SGLANG_API_KEY` ayarlayın
    veya sağlayıcıyı
    `models.providers.sglang` altında açıkça yapılandırın.

    <Tip>
    SGLang'ı kimlik doğrulama olmadan çalıştırıyorsanız model keşfine katılmak için
    `SGLANG_API_KEY` için boş olmayan herhangi bir değer yeterlidir.
    </Tip>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı seçimi, model ref'leri ve failover davranışı.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı girdileri dâhil tam yapılandırma şeması.
  </Card>
</CardGroup>

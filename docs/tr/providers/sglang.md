---
read_when:
    - OpenClaw'ı yerel bir SGLang sunucusuna karşı çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu `/v1` endpoint'leri istiyorsunuz
summary: OpenClaw'ı SGLang ile çalıştırın (OpenAI uyumlu self-hosted sunucu)
title: SGLang
x-i18n:
    generated_at: "2026-04-05T14:04:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9850277c6c5e318e60237688b4d8a5b1387d4e9586534ae2eb6ad953abba8948
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang, açık kaynak modelleri **OpenAI uyumlu** bir HTTP API üzerinden sunabilir.
OpenClaw, `openai-completions` API'sini kullanarak SGLang'a bağlanabilir.

OpenClaw ayrıca, `SGLANG_API_KEY` ile açıkça etkinleştirdiğinizde
(kimlik doğrulamayı zorunlu kılmayan sunucularda herhangi bir değer çalışır)
ve açık bir `models.providers.sglang` girdisi tanımlamadığınızda, SGLang'daki mevcut modelleri **otomatik olarak keşfedebilir**.

## Hızlı başlangıç

1. SGLang'ı OpenAI uyumlu bir sunucuyla başlatın.

Base URL'niz `/v1` endpoint'lerini açığa çıkarmalıdır (örneğin `/v1/models`,
`/v1/chat/completions`). SGLang yaygın olarak şu adreste çalışır:

- `http://127.0.0.1:30000/v1`

2. Açıkça etkinleştirin (kimlik doğrulama yapılandırılmadıysa herhangi bir değer çalışır):

```bash
export SGLANG_API_KEY="sglang-local"
```

3. Onboarding'i çalıştırın ve `SGLang` seçin ya da doğrudan bir model ayarlayın:

```bash
openclaw onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "sglang/your-model-id" },
    },
  },
}
```

## Model keşfi (örtük sağlayıcı)

`SGLANG_API_KEY` ayarlandığında (veya bir kimlik doğrulama profili mevcut olduğunda) ve **`models.providers.sglang`**
tanımlamadığınızda, OpenClaw şu sorguyu çalıştırır:

- `GET http://127.0.0.1:30000/v1/models`

ve döndürülen kimlikleri model girdilerine dönüştürür.

`models.providers.sglang` değerini açıkça ayarlarsanız, otomatik keşif atlanır ve
modelleri el ile tanımlamanız gerekir.

## Açık yapılandırma (el ile modeller)

Açık config'i şu durumlarda kullanın:

- SGLang farklı bir host/port üzerinde çalışıyordur.
- `contextWindow`/`maxTokens` değerlerini sabitlemek istiyorsunuzdur.
- Sunucunuz gerçek bir API anahtarı gerektiriyordur (veya üstbilgileri denetlemek istiyorsunuzdur).

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

## Sorun giderme

- Sunucunun erişilebilir olduğunu kontrol edin:

```bash
curl http://127.0.0.1:30000/v1/models
```

- İstekler kimlik doğrulama hatalarıyla başarısız oluyorsa, sunucu yapılandırmanızla eşleşen gerçek bir `SGLANG_API_KEY` ayarlayın
  veya sağlayıcıyı `models.providers.sglang` altında açıkça
  yapılandırın.

## Proxy tarzı davranış

SGLang, yerel bir OpenAI endpoint'i olarak değil, proxy tarzı OpenAI uyumlu bir `/v1` arka ucu olarak ele alınır.

- yalnızca yerel OpenAI'a özgü istek şekillendirmesi burada uygulanmaz
- `service_tier`, Responses `store`, prompt-cache ipuçları ve
  OpenAI reasoning uyumluluk payload şekillendirmesi yoktur
- gizli OpenClaw ilişkilendirme üstbilgileri (`originator`, `version`, `User-Agent`)
  özel SGLang base URL'lerine eklenmez

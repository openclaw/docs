---
read_when:
    - OpenClaw'ı yerel bir vLLM sunucusuna karşı çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu /v1 uç noktaları istiyorsunuz
summary: OpenClaw'ı vLLM ile çalıştırın (OpenAI uyumlu yerel sunucu)
title: vLLM
x-i18n:
    generated_at: "2026-04-05T14:05:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebde34d0453586d10340680b8d51465fdc98bd28e8a96acfaeb24606886b50f4
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM, açık kaynaklı (ve bazı özel) modelleri **OpenAI uyumlu** bir HTTP API üzerinden sunabilir. OpenClaw, `openai-completions` API'sini kullanarak vLLM'ye bağlanabilir.

OpenClaw, `VLLM_API_KEY` ile etkinleştirdiğinizde (sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa herhangi bir değer çalışır) ve açık bir `models.providers.vllm` girdisi tanımlamadığınızda vLLM'den kullanılabilir modelleri **otomatik olarak keşfedebilir**.

## Hızlı başlangıç

1. vLLM'yi OpenAI uyumlu bir sunucuyla başlatın.

Temel URL'niz `/v1` uç noktalarını açığa çıkarmalıdır (ör. `/v1/models`, `/v1/chat/completions`). vLLM yaygın olarak şu adreste çalışır:

- `http://127.0.0.1:8000/v1`

2. Etkinleştirin (kimlik doğrulama yapılandırılmadıysa herhangi bir değer çalışır):

```bash
export VLLM_API_KEY="vllm-local"
```

3. Bir model seçin (vLLM model kimliklerinizden biriyle değiştirin):

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## Model keşfi (örtük sağlayıcı)

`VLLM_API_KEY` ayarlandığında (veya bir kimlik doğrulama profili mevcut olduğunda) ve `models.providers.vllm` tanımlamadığınızda, OpenClaw şunu sorgular:

- `GET http://127.0.0.1:8000/v1/models`

…ve döndürülen kimlikleri model girdilerine dönüştürür.

`models.providers.vllm` değerini açıkça ayarlarsanız, otomatik keşif atlanır ve modelleri manuel olarak tanımlamanız gerekir.

## Açık yapılandırma (manuel modeller)

Açık yapılandırmayı şu durumlarda kullanın:

- vLLM farklı bir ana makine/bağlantı noktasında çalışıyorsa.
- `contextWindow`/`maxTokens` değerlerini sabitlemek istiyorsanız.
- Sunucunuz gerçek bir API anahtarı gerektiriyorsa (veya üstbilgileri denetlemek istiyorsanız).

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

## Sorun giderme

- Sunucunun erişilebilir olduğunu kontrol edin:

```bash
curl http://127.0.0.1:8000/v1/models
```

- İstekler kimlik doğrulama hatalarıyla başarısız oluyorsa, sunucu yapılandırmanızla eşleşen gerçek bir `VLLM_API_KEY` ayarlayın veya sağlayıcıyı `models.providers.vllm` altında açıkça yapılandırın.

## Proxy tarzı davranış

vLLM, yerel bir OpenAI uç noktası olarak değil, proxy tarzı OpenAI uyumlu bir `/v1` arka ucu olarak ele alınır.

- yerel OpenAI'ya özgü istek şekillendirme burada uygulanmaz
- `service_tier` yok, Responses `store` yok, istem önbelleği ipuçları yok ve
  OpenAI reasoning uyumluluk yükü şekillendirmesi yok
- gizli OpenClaw atıf üstbilgileri (`originator`, `version`, `User-Agent`) özel vLLM temel URL'lerine eklenmez

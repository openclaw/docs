---
read_when:
    - Chutes'ı OpenClaw ile kullanmak istiyorsunuz
    - OAuth veya API anahtarı kurulum yoluna ihtiyacınız var
    - Varsayılan modeli, takma adları veya keşif davranışını öğrenmek istiyorsunuz
summary: Chutes kurulumu (OAuth veya API anahtarı, model keşfi, takma adlar)
title: Chutes
x-i18n:
    generated_at: "2026-04-05T14:03:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: e275f32e7a19fa5b4c64ffabfb4bf116dd5c9ab95bfa25bd3b1a15d15e237674
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai), açık kaynak model kataloglarını
OpenAI uyumlu bir API üzerinden sunar. OpenClaw, paketli `chutes` sağlayıcısı için hem tarayıcı OAuth hem de doğrudan API anahtarı
kimlik doğrulamasını destekler.

- Sağlayıcı: `chutes`
- API: OpenAI uyumlu
- Base URL: `https://llm.chutes.ai/v1`
- Kimlik doğrulama:
  - `openclaw onboard --auth-choice chutes` üzerinden OAuth
  - `openclaw onboard --auth-choice chutes-api-key` üzerinden API anahtarı
  - Çalışma zamanı ortam değişkenleri: `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`

## Hızlı başlangıç

### OAuth

```bash
openclaw onboard --auth-choice chutes
```

OpenClaw tarayıcı akışını yerel olarak başlatır veya uzak/başsız host'larda URL + yönlendirme yapıştırma
akışını gösterir. OAuth token'ları OpenClaw kimlik doğrulama
profilleri aracılığıyla otomatik yenilenir.

İsteğe bağlı OAuth geçersiz kılmaları:

- `CHUTES_CLIENT_ID`
- `CHUTES_CLIENT_SECRET`
- `CHUTES_OAUTH_REDIRECT_URI`
- `CHUTES_OAUTH_SCOPES`

### API anahtarı

```bash
openclaw onboard --auth-choice chutes-api-key
```

Anahtarınızı şu adresten alın:
[chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).

Her iki kimlik doğrulama yolu da paketli Chutes kataloğunu kaydeder ve varsayılan modeli
`chutes/zai-org/GLM-4.7-TEE` olarak ayarlar.

## Keşif davranışı

Chutes kimlik doğrulaması mevcut olduğunda, OpenClaw Chutes kataloğunu bu
kimlik bilgisiyle sorgular ve keşfedilen modelleri kullanır. Keşif başarısız olursa, OpenClaw
onboarding ve başlangıcın yine çalışması için paketli statik bir kataloğa geri döner.

## Varsayılan takma adlar

OpenClaw ayrıca paketli Chutes
kataloğu için üç kullanışlı takma adı da kaydeder:

- `chutes-fast` -> `chutes/zai-org/GLM-4.7-FP8`
- `chutes-pro` -> `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes-vision` -> `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`

## Yerleşik başlangıç kataloğu

Paketli geri dönüş kataloğu aşağıdakiler gibi güncel Chutes referanslarını içerir:

- `chutes/zai-org/GLM-4.7-TEE`
- `chutes/zai-org/GLM-5-TEE`
- `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`
- `chutes/moonshotai/Kimi-K2.5-TEE`
- `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`
- `chutes/Qwen/Qwen3-Coder-Next-TEE`
- `chutes/openai/gpt-oss-120b-TEE`

## Config örneği

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

## Notlar

- OAuth yardımı ve redirect-app gereksinimleri: [Chutes OAuth docs](https://chutes.ai/docs/sign-in-with-chutes/overview)
- API anahtarı ve OAuth keşfi aynı `chutes` sağlayıcı kimliğini kullanır.
- Chutes modelleri `chutes/<model-id>` olarak kaydedilir.

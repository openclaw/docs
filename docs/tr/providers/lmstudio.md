---
read_when:
    - OpenClaw'ı LM Studio üzerinden açık kaynak modellerle çalıştırmak istiyorsunuz
    - LM Studio'yu kurmak ve yapılandırmak istiyorsunuz
summary: OpenClaw'ı LM Studio ile çalıştırın
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T09:26:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio, açık ağırlıklı modelleri kendi donanımınızda çalıştırmak için kullanımı kolay ama güçlü bir uygulamadır. llama.cpp (GGUF) veya MLX modellerini (Apple Silicon) çalıştırmanıza olanak tanır. GUI paketi veya headless daemon (`llmster`) olarak gelir. Ürün ve kurulum belgeleri için [lmstudio.ai](https://lmstudio.ai/) sayfasına bakın.

## Hızlı başlangıç

1. LM Studio'yu (masaüstü) veya `llmster`'ı (headless) kurun, sonra yerel sunucuyu başlatın:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Sunucuyu başlatın

Masaüstü uygulamasını başlattığınızdan veya aşağıdaki komutu kullanarak daemon'ı çalıştırdığınızdan emin olun:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Uygulamayı kullanıyorsanız sorunsuz bir deneyim için JIT'in etkin olduğundan emin olun. Daha fazlası için [LM Studio JIT and TTL guide](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) sayfasına bakın.

3. OpenClaw bir LM Studio token değeri gerektirir. `LM_API_TOKEN` ayarlayın:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

LM Studio kimlik doğrulaması devre dışıysa boş olmayan herhangi bir token değeri kullanın:

```bash
export LM_API_TOKEN="placeholder-key"
```

LM Studio auth kurulum ayrıntıları için [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) sayfasına bakın.

4. Onboarding'i çalıştırın ve `LM Studio` seçin:

```bash
openclaw onboard
```

5. Onboarding içinde `Default model` isteminde LM Studio modelinizi seçin.

Bunu daha sonra da ayarlayabilir veya değiştirebilirsiniz:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio model anahtarları `author/model-name` biçimini izler (ör. `qwen/qwen3.5-9b`). OpenClaw
model ref'leri sağlayıcı adını öne ekler: `lmstudio/qwen/qwen3.5-9b`. Bir model için tam anahtarı
`curl http://localhost:1234/api/v1/models` çalıştırıp `key` alanına bakarak bulabilirsiniz.

## Etkileşimsiz onboarding

Kurulumu script ile yapmak istediğinizde (CI, sağlama, uzak önyükleme) etkileşimsiz onboarding kullanın:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Veya base URL ya da modeli API anahtarıyla belirtin:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id`, LM Studio'nun döndürdüğü model anahtarını alır (ör. `qwen/qwen3.5-9b`), `lmstudio/`
sağlayıcı öneki olmadan.

Etkileşimsiz onboarding, `--lmstudio-api-key` (veya env içinde `LM_API_TOKEN`) gerektirir.
Kimlik doğrulamasız LM Studio sunucuları için boş olmayan herhangi bir token değeri çalışır.

`--custom-api-key` uyumluluk için hâlâ desteklenir, ancak LM Studio için `--lmstudio-api-key` tercih edilir.

Bu işlem `models.providers.lmstudio` yazar, varsayılan modeli
`lmstudio/<custom-model-id>` olarak ayarlar ve `lmstudio:default` auth profile'ını yazar.

Etkileşimli kurulum isteğe bağlı bir tercih edilen yükleme bağlam uzunluğu sorabilir ve bunu yapılandırmaya kaydettiği keşfedilen LM Studio modellerine uygular.

## Yapılandırma

### Akış kullanım uyumluluğu

LM Studio akış kullanım uyumludur. OpenAI biçiminde bir
`usage` nesnesi yaymadığında OpenClaw token sayılarını llama.cpp tarzı
`timings.prompt_n` / `timings.predicted_n` meta verilerinden geri kazanır.

Aynı davranış şu OpenAI uyumlu yerel backend'lerde de geçerlidir:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Açık yapılandırma

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
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

### LM Studio algılanmıyor

LM Studio'nun çalıştığından ve `LM_API_TOKEN` ayarladığınızdan emin olun (kimlik doğrulamasız sunucular için boş olmayan herhangi bir token değeri çalışır):

```bash
# Masaüstü uygulamasıyla başlatın veya headless:
lms server start --port 1234
```

API'nin erişilebilir olduğunu doğrulayın:

```bash
curl http://localhost:1234/api/v1/models
```

### Kimlik doğrulama hataları (HTTP 401)

Kurulum HTTP 401 bildiriyorsa API anahtarınızı doğrulayın:

- `LM_API_TOKEN` değerinin LM Studio'da yapılandırılmış anahtarla eşleştiğini kontrol edin.
- LM Studio auth kurulum ayrıntıları için [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) sayfasına bakın.
- Sunucunuz kimlik doğrulama gerektirmiyorsa `LM_API_TOKEN` için boş olmayan herhangi bir token değeri kullanın.

### Just-in-time model yükleme

LM Studio, modellerin ilk istekte yüklendiği just-in-time (JIT) model yüklemeyi destekler. "Model not loaded" hatalarından kaçınmak için bunun etkin olduğundan emin olun.

## İlgili

- [Model seçimi](/tr/concepts/model-providers)
- [Ollama](/tr/providers/ollama)
- [Yerel modeller](/tr/gateway/local-models)

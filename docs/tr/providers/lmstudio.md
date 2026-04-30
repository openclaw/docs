---
read_when:
    - OpenClaw'ı LM Studio aracılığıyla açık kaynak modellerle çalıştırmak istiyorsunuz
    - LM Studio'yu kurmak ve yapılandırmak istiyorsunuz
summary: OpenClaw'u LM Studio ile çalıştırın
title: LM Studio
x-i18n:
    generated_at: "2026-04-30T09:40:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio, kendi donanımınızda açık ağırlıklı modeller çalıştırmak için kullanıcı dostu ancak güçlü bir uygulamadır. llama.cpp (GGUF) veya MLX modellerini (Apple Silicon) çalıştırmanızı sağlar. GUI paketi veya başsız daemon (`llmster`) olarak gelir. Ürün ve kurulum belgeleri için [lmstudio.ai](https://lmstudio.ai/) adresine bakın.

## Hızlı başlangıç

1. LM Studio’yu (masaüstü) veya `llmster`ı (başsız) yükleyin, ardından yerel sunucuyu başlatın:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Sunucuyu başlatın

Masaüstü uygulamayı başlattığınızdan veya daemon’ı aşağıdaki komutla çalıştırdığınızdan emin olun:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Uygulamayı kullanıyorsanız, sorunsuz bir deneyim için JIT’in etkin olduğundan emin olun. Daha fazla bilgi için [LM Studio JIT ve TTL kılavuzu](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) sayfasına bakın.

3. LM Studio kimlik doğrulaması etkinse `LM_API_TOKEN` ayarını yapın:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

LM Studio kimlik doğrulaması devre dışıysa, etkileşimli OpenClaw kurulumu sırasında API anahtarını boş bırakabilirsiniz.

LM Studio kimlik doğrulaması kurulum ayrıntıları için [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) sayfasına bakın.

4. İlk kurulumu çalıştırın ve `LM Studio` seçeneğini belirleyin:

```bash
openclaw onboard
```

5. İlk kurulumda, LM Studio modelinizi seçmek için `Default model` istemini kullanın.

Bunu daha sonra da ayarlayabilir veya değiştirebilirsiniz:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio model anahtarları `author/model-name` biçimini izler (örn. `qwen/qwen3.5-9b`). OpenClaw
model referansları sağlayıcı adını başa ekler: `lmstudio/qwen/qwen3.5-9b`. Bir modelin tam anahtarını
`curl http://localhost:1234/api/v1/models` komutunu çalıştırıp `key` alanına bakarak bulabilirsiniz.

## Etkileşimsiz ilk kurulum

Kurulumu betiklemek istediğinizde (CI, kaynak hazırlama, uzaktan önyükleme) etkileşimsiz ilk kurulumu kullanın:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Ya da temel URL’yi, modeli ve isteğe bağlı API anahtarını belirtin:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id`, `lmstudio/` sağlayıcı ön eki olmadan LM Studio tarafından döndürülen model anahtarını alır (örn. `qwen/qwen3.5-9b`).

Kimliği doğrulanmış LM Studio sunucuları için `--lmstudio-api-key` geçirin veya `LM_API_TOKEN` ayarını yapın.
Kimliği doğrulanmamış LM Studio sunucuları için anahtarı atlayın; OpenClaw yerel, gizli olmayan bir işaretleyici depolar.

`--custom-api-key` uyumluluk için desteklenmeye devam eder, ancak LM Studio için `--lmstudio-api-key` tercih edilir.

Bu, `models.providers.lmstudio` değerini yazar ve varsayılan modeli
`lmstudio/<custom-model-id>` olarak ayarlar. Bir API anahtarı sağladığınızda kurulum ayrıca
`lmstudio:default` kimlik doğrulama profilini de yazar.

Etkileşimli kurulum, isteğe bağlı tercih edilen yükleme bağlam uzunluğu için istem gösterebilir ve bunu yapılandırmaya kaydettiği keşfedilmiş LM Studio modellerinin tamamına uygular.
LM Studio Plugin yapılandırması, model istekleri için yapılandırılmış LM Studio uç noktasına güvenir; buna loopback, LAN ve tailnet ana makineleri dahildir. `models.providers.lmstudio.request.allowPrivateNetwork: false` ayarını yaparak bundan çıkabilirsiniz.

## Yapılandırma

### Akış kullanımı uyumluluğu

LM Studio akış kullanımıyla uyumludur. OpenAI biçimli bir
`usage` nesnesi yaymadığında, OpenClaw bunun yerine token sayılarını llama.cpp tarzı
`timings.prompt_n` / `timings.predicted_n` meta verilerinden kurtarır.

Aynı akış kullanımı davranışı şu OpenAI uyumlu yerel arka uçlar için de geçerlidir:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Düşünme uyumluluğu

LM Studio’nun `/api/v1/models` keşfi modele özgü akıl yürütme
seçenekleri bildirdiğinde, OpenClaw bu yerel değerleri model uyumluluk meta verilerinde korur. `allowed_options: ["off", "on"]` duyuran ikili düşünme modelleri için
OpenClaw, devre dışı düşünmeyi `off` değerine ve etkin `/think` seviyelerini `on` değerine eşler;
`low` veya `medium` gibi yalnızca OpenAI’ye özgü değerler göndermez.

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

### LM Studio algılanmadı

LM Studio’nun çalıştığından emin olun. Kimlik doğrulaması etkinse, `LM_API_TOKEN` ayarını da yapın:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

API’ye erişilebildiğini doğrulayın:

```bash
curl http://localhost:1234/api/v1/models
```

### Kimlik doğrulama hataları (HTTP 401)

Kurulum HTTP 401 bildirirse API anahtarınızı doğrulayın:

- `LM_API_TOKEN` değerinin LM Studio’da yapılandırılan anahtarla eşleştiğini kontrol edin.
- LM Studio kimlik doğrulaması kurulum ayrıntıları için [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) sayfasına bakın.
- Sunucunuz kimlik doğrulaması gerektirmiyorsa, kurulum sırasında anahtarı boş bırakın.

### Tam zamanında model yükleme

LM Studio, modellerin ilk istekte yüklendiği tam zamanında (JIT) model yüklemeyi destekler. 'Model not loaded' hatalarından kaçınmak için bunun etkin olduğundan emin olun.

### LAN veya tailnet LM Studio ana makinesi

LM Studio ana makinesinin erişilebilir adresini kullanın, `/v1` değerini koruyun ve LM Studio’nun o makinede loopback ötesine bağlandığından emin olun:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

Genel OpenAI uyumlu sağlayıcıların aksine, `lmstudio` korumalı model istekleri için yapılandırılmış yerel/özel uç noktasına otomatik olarak güvenir. `localhost` veya `127.0.0.1` gibi özel loopback sağlayıcı kimliklerine de otomatik olarak güvenilir; LAN, tailnet veya özel DNS özel sağlayıcı kimlikleri için `models.providers.<id>.request.allowPrivateNetwork: true` değerini açıkça ayarlayın.

## İlgili

- [Model seçimi](/tr/concepts/model-providers)
- [Ollama](/tr/providers/ollama)
- [Yerel modeller](/tr/gateway/local-models)

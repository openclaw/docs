---
read_when:
    - OpenClaw'ı LM Studio aracılığıyla açık kaynak modellerle çalıştırmak istiyorsunuz
    - LM Studio'yu kurmak ve yapılandırmak istiyorsunuz
summary: OpenClaw'u LM Studio ile çalıştırın
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T09:04:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3971bc471e5d8b0f142394b7b1897f8fdb2be283082245fbb2cf744d06143292
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio, kendi donanımınızda açık ağırlıklı modeller çalıştırmak için kullanıcı dostu ama güçlü bir uygulamadır. llama.cpp (GGUF) veya MLX modellerini (Apple Silicon) çalıştırmanıza olanak tanır. GUI paketi veya başsız daemon (`llmster`) olarak gelir. Ürün ve kurulum belgeleri için [lmstudio.ai](https://lmstudio.ai/) adresine bakın.

## Hızlı başlangıç

1. LM Studio'yu (masaüstü) veya `llmster`'ı (başsız) kurun, ardından yerel sunucuyu başlatın:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Sunucuyu başlatın

Masaüstü uygulamasını başlattığınızdan veya daemon'u aşağıdaki komutla çalıştırdığınızdan emin olun:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Uygulamayı kullanıyorsanız, sorunsuz bir deneyim için JIT'in etkin olduğundan emin olun. Daha fazla bilgi için [LM Studio JIT ve TTL kılavuzu](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) bölümüne bakın.

3. LM Studio kimlik doğrulaması etkinse, `LM_API_TOKEN` ayarını yapın:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

LM Studio kimlik doğrulaması devre dışıysa, etkileşimli OpenClaw kurulumu sırasında API anahtarını boş bırakabilirsiniz.

LM Studio kimlik doğrulama kurulumu ayrıntıları için [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) bölümüne bakın.

4. İlk katılımı çalıştırın ve `LM Studio` seçin:

```bash
openclaw onboard
```

5. İlk katılımda, LM Studio modelinizi seçmek için `Default model` istemini kullanın.

Bunu daha sonra da ayarlayabilir veya değiştirebilirsiniz:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio model anahtarları `author/model-name` biçimini izler (örn. `qwen/qwen3.5-9b`). OpenClaw
model başvuruları sağlayıcı adını başa ekler: `lmstudio/qwen/qwen3.5-9b`. Bir modelin tam anahtarını,
`curl http://localhost:1234/api/v1/models` komutunu çalıştırıp `key` alanına bakarak bulabilirsiniz.

## Etkileşimsiz ilk katılım

Kurulumu betik haline getirmek istediğinizde (CI, hazırlama, uzak önyükleme) etkileşimsiz ilk katılımı kullanın:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Ya da temel URL'yi, modeli ve isteğe bağlı API anahtarını belirtin:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id`, `lmstudio/` sağlayıcı öneki olmadan, LM Studio tarafından döndürülen model anahtarını alır
(örn. `qwen/qwen3.5-9b`).

Kimliği doğrulanmış LM Studio sunucuları için `--lmstudio-api-key` geçin veya `LM_API_TOKEN` ayarlayın.
Kimliği doğrulanmamış LM Studio sunucuları için anahtarı atlayın; OpenClaw yerel bir gizli olmayan işaretleyici saklar.

`--custom-api-key` uyumluluk için desteklenmeye devam eder, ancak LM Studio için `--lmstudio-api-key` tercih edilir.

Bu, `models.providers.lmstudio` yazar ve varsayılan modeli
`lmstudio/<custom-model-id>` olarak ayarlar. Bir API anahtarı sağladığınızda kurulum ayrıca
`lmstudio:default` kimlik doğrulama profilini de yazar.

Etkileşimli kurulum, isteğe bağlı tercih edilen yükleme bağlamı uzunluğu için istem gösterebilir ve bunu yapılandırmaya kaydettiği keşfedilmiş LM Studio modelleri genelinde uygular.
LM Studio Plugin yapılandırması, loopback, LAN ve tailnet ana makineleri dahil olmak üzere model istekleri için yapılandırılmış LM Studio uç noktasına güvenir. `models.providers.lmstudio.request.allowPrivateNetwork: false` ayarını yaparak bunu devre dışı bırakabilirsiniz.

## Yapılandırma

### Akış kullanım uyumluluğu

LM Studio akış kullanımıyla uyumludur. OpenAI biçimli bir
`usage` nesnesi yaymadığında, OpenClaw bunun yerine token sayılarını llama.cpp tarzı
`timings.prompt_n` / `timings.predicted_n` meta verilerinden kurtarır.

Aynı akış kullanım davranışı şu OpenAI uyumlu yerel arka uçlar için geçerlidir:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Düşünme uyumluluğu

LM Studio'nun `/api/v1/models` keşfi modele özgü akıl yürütme
seçenekleri bildirdiğinde, OpenClaw bu yerel değerleri model uyumluluk meta verilerinde korur. `allowed_options: ["off", "on"]`
ilan eden ikili düşünme modelleri için OpenClaw, devre dışı düşünmeyi `off` değerine ve etkin `/think` seviyelerini `on` değerine eşler;
`low` veya `medium` gibi yalnızca OpenAI'ye özgü değerler göndermez.

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

LM Studio'nun çalıştığından emin olun. Kimlik doğrulaması etkinse, `LM_API_TOKEN` ayarını da yapın:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

API'ye erişilebildiğini doğrulayın:

```bash
curl http://localhost:1234/api/v1/models
```

### Kimlik doğrulama hataları (HTTP 401)

Kurulum HTTP 401 bildirirse, API anahtarınızı doğrulayın:

- `LM_API_TOKEN` değerinin LM Studio'da yapılandırılan anahtarla eşleştiğini kontrol edin.
- LM Studio kimlik doğrulama kurulumu ayrıntıları için [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) bölümüne bakın.
- Sunucunuz kimlik doğrulama gerektirmiyorsa, kurulum sırasında anahtarı boş bırakın.

### Tam zamanında model yükleme

LM Studio, modellerin ilk istekte yüklendiği tam zamanında (JIT) model yüklemeyi destekler. OpenClaw varsayılan olarak modelleri LM Studio'nun yerel yükleme uç noktası üzerinden önceden yükler; bu, JIT devre dışı olduğunda yardımcı olur. LM Studio'nun JIT, boşta TTL ve otomatik çıkarma davranışının model yaşam döngüsünü yönetmesine izin vermek için OpenClaw'un ön yükleme adımını devre dışı bırakın:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### LAN veya tailnet LM Studio ana makinesi

LM Studio ana makinesinin erişilebilir adresini kullanın, `/v1` bölümünü koruyun ve LM Studio'nun o makinede loopback ötesine bağlandığından emin olun:

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

---
read_when:
    - OpenClaw'u LM Studio aracılığıyla açık kaynak modellerle çalıştırmak istiyorsunuz
    - LM Studio'yu kurmak ve yapılandırmak istiyorsunuz
summary: OpenClaw'ı LM Studio ile çalıştır
title: LM Studio
x-i18n:
    generated_at: "2026-06-28T01:10:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20dff6e3156edf0e840c5450999bc511ba168b23692494c9030bfb946936ae40
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio, kendi donanımınızda açık ağırlıklı modeller çalıştırmak için kullanıcı dostu ama güçlü bir uygulamadır. llama.cpp (GGUF) veya MLX modellerini (Apple Silicon) çalıştırmanızı sağlar. GUI paketi veya başsız daemon (`llmster`) olarak gelir. Ürün ve kurulum belgeleri için [lmstudio.ai](https://lmstudio.ai/) adresine bakın.

## Hızlı başlangıç

1. LM Studio'yu (masaüstü) veya `llmster`'ı (başsız) yükleyin, ardından yerel sunucuyu başlatın:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Sunucuyu başlatın

Masaüstü uygulamasını başlattığınızdan veya daemon'ı aşağıdaki komutla çalıştırdığınızdan emin olun:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Uygulamayı kullanıyorsanız, sorunsuz bir deneyim için JIT'in etkin olduğundan emin olun. Daha fazla bilgi için [LM Studio JIT ve TTL kılavuzuna](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) bakın.

3. LM Studio kimlik doğrulaması etkinse `LM_API_TOKEN` değerini ayarlayın:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

LM Studio kimlik doğrulaması devre dışıysa, etkileşimli OpenClaw kurulumu sırasında API anahtarını boş bırakabilirsiniz.

LM Studio kimlik doğrulama kurulumu ayrıntıları için [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) sayfasına bakın.

4. Başlangıç kurulumunu çalıştırın ve `LM Studio` seçin:

```bash
openclaw onboard
```

5. Başlangıç kurulumunda LM Studio modelinizi seçmek için `Default model` istemini kullanın.

Bunu daha sonra da ayarlayabilir veya değiştirebilirsiniz:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio model anahtarları `author/model-name` biçimini izler (ör. `qwen/qwen3.5-9b`). OpenClaw
model başvuruları sağlayıcı adını başa ekler: `lmstudio/qwen/qwen3.5-9b`. Bir modelin tam anahtarını
`curl http://localhost:1234/api/v1/models` çalıştırıp `key` alanına bakarak bulabilirsiniz.

## Etkileşimsiz başlangıç kurulumu

Kurulumu betiklemek istediğinizde etkileşimsiz başlangıç kurulumunu kullanın (CI, tedarik, uzak önyükleme):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Veya temel URL'yi, modeli ve isteğe bağlı API anahtarını belirtin:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id`, `lmstudio/` sağlayıcı öneki olmadan LM Studio tarafından döndürülen model anahtarını alır
(ör. `qwen/qwen3.5-9b`).

Kimliği doğrulanmış LM Studio sunucuları için `--lmstudio-api-key` geçirin veya `LM_API_TOKEN` ayarlayın.
Kimliği doğrulanmamış LM Studio sunucuları için anahtarı atlayın; OpenClaw yerel, gizli olmayan bir işaretçi saklar.

`--custom-api-key` uyumluluk için desteklenmeye devam eder, ancak LM Studio için `--lmstudio-api-key` tercih edilir.

Bu, `models.providers.lmstudio` değerini yazar ve varsayılan modeli
`lmstudio/<custom-model-id>` olarak ayarlar. Bir API anahtarı sağladığınızda kurulum ayrıca
`lmstudio:default` kimlik doğrulama profilini yazar.

Etkileşimli kurulum, isteğe bağlı tercih edilen yükleme bağlamı uzunluğunu sorabilir ve bunu yapılandırmaya kaydettiği keşfedilen LM Studio modelleri genelinde uygular.
LM Studio Plugin yapılandırması, local loopback, LAN ve tailnet ana makineleri dahil olmak üzere model istekleri için yapılandırılmış LM Studio uç noktasına güvenir. Metadata/link-local origin'ler yine de açık opt-in gerektirir. `models.providers.lmstudio.request.allowPrivateNetwork: false` ayarlayarak devre dışı bırakabilirsiniz.

## Yapılandırma

### Akış kullanım uyumluluğu

LM Studio, akış kullanımıyla uyumludur. OpenAI biçimli bir `usage` nesnesi
yaymadığında, OpenClaw token sayılarını bunun yerine llama.cpp tarzı
`timings.prompt_n` / `timings.predicted_n` metadata'sından kurtarır.

Aynı akış kullanımı davranışı şu OpenAI uyumlu yerel arka uçlar için geçerlidir:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Düşünme uyumluluğu

LM Studio'nun `/api/v1/models` keşfi modele özgü akıl yürütme
seçenekleri bildirdiğinde, OpenClaw model uyumluluk metadata'sında eşleşen OpenAI uyumlu `reasoning_effort`
değerlerini gösterir. Mevcut LM Studio derlemeleri, bu değerleri
`/v1/chat/completions` üzerinde reddederken `allowed_options: ["off", "on"]` gibi ikili
UI seçeneklerini ilan edebilir; OpenClaw bu ikili keşif biçimini istek göndermeden önce
`none`, `minimal`, `low`, `medium`, `high` ve `xhigh` olarak normalleştirir.
`off`/`on` akıl yürütme eşlemeleri içeren eski kaydedilmiş LM Studio yapılandırması,
katalog yüklendiğinde aynı şekilde normalleştirilir.

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

LM Studio'nun çalıştığından emin olun. Kimlik doğrulama etkinse `LM_API_TOKEN` değerini de ayarlayın:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

API'ye erişilebildiğini doğrulayın:

```bash
curl http://localhost:1234/api/v1/models
```

### Kimlik doğrulama hataları (HTTP 401)

Kurulum HTTP 401 bildirirse API anahtarınızı doğrulayın:

- `LM_API_TOKEN` değerinin LM Studio'da yapılandırılan anahtarla eşleştiğini kontrol edin.
- LM Studio kimlik doğrulama kurulumu ayrıntıları için [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) sayfasına bakın.
- Sunucunuz kimlik doğrulama gerektirmiyorsa kurulum sırasında anahtarı boş bırakın.

### Tam zamanında model yükleme

LM Studio, modellerin ilk istekte yüklendiği tam zamanında (JIT) model yüklemeyi destekler. OpenClaw varsayılan olarak modelleri LM Studio'nun yerel yükleme uç noktası üzerinden önceden yükler; bu, JIT devre dışı olduğunda yardımcı olur. LM Studio'nun JIT, boşta TTL ve otomatik çıkarma davranışının model yaşam döngüsünü yönetmesine izin vermek için OpenClaw'ın ön yükleme adımını devre dışı bırakın:

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

LM Studio ana makinesinin erişilebilir adresini kullanın, `/v1` değerini koruyun ve LM Studio'nun o makinede loopback ötesine bağlandığından emin olun:

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

`lmstudio`, korumalı model istekleri için yapılandırılmış yerel/özel uç noktasına otomatik olarak güvenir. Özel/yerel OpenAI uyumlu sağlayıcı girdileri de metadata/link-local origin'ler hariç tam olarak yapılandırılmış `baseUrl` origin'lerine güvenir; farklı özel portlara veya hedeflere yapılan istekler yine de `models.providers.<id>.request.allowPrivateNetwork: true` gerektirir. Tam origin güveninden çıkmak için `models.providers.<id>.request.allowPrivateNetwork: false` ayarlayın.

## İlgili

- [Model seçimi](/tr/concepts/model-providers)
- [Ollama](/tr/providers/ollama)
- [Yerel modeller](/tr/gateway/local-models)

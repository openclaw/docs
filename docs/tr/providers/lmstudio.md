---
read_when:
    - OpenClaw'u LM Studio aracılığıyla açık kaynaklı modellerle çalıştırmak istiyorsunuz
    - LM Studio'yu kurmak ve yapılandırmak istiyorsunuz
summary: OpenClaw'u LM Studio ile çalıştırın
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T12:43:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio, llama.cpp (GGUF) veya MLX modellerini bir GUI uygulaması ya da başsız `llmster`
daemon'ı olarak yerel ortamda çalıştırır. Kurulum ve ürün belgeleri için [lmstudio.ai](https://lmstudio.ai/) adresine bakın.

## Hızlı başlangıç

<Steps>
  <Step title="Sunucuyu kurun ve başlatın">
    LM Studio'yu (masaüstü) veya `llmster`'ı (başsız) kurun, ardından sunucuyu başlatın:

    ```bash
    lms server start --port 1234
    ```

    Alternatif olarak başsız daemon'ı çalıştırın:

    ```bash
    lms daemon up
    ```

    Masaüstü uygulamasını kullanıyorsanız sorunsuz model yükleme için JIT'yi etkinleştirin; bkz.
    [LM Studio JIT ve TTL kılavuzu](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Kimlik doğrulama etkinse bir API anahtarı ayarlayın">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    LM Studio kimlik doğrulaması devre dışıysa kurulum sırasında API anahtarını boş bırakın. Bkz.
    [LM Studio Kimlik Doğrulaması](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard
    ```

    `LM Studio` seçeneğini belirleyin, ardından `Default model` isteminde bir model seçin.

  </Step>
</Steps>

Varsayılan modeli daha sonra değiştirin:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio model anahtarları `author/model-name` biçimini kullanır (ör. `qwen/qwen3.5-9b`); OpenClaw model referansları
başına sağlayıcıyı ekler: `lmstudio/qwen/qwen3.5-9b`. Bir modelin tam anahtarını bulmak için aşağıdaki
komutu çalıştırın ve `key` alanına bakın:

```bash
curl http://localhost:1234/api/v1/models
```

## Etkileşimsiz ilk kurulum

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Alternatif olarak temel URL'yi, modeli ve API anahtarını açıkça belirtin:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id`, LM Studio tarafından döndürülen model anahtarını (ör. `qwen/qwen3.5-9b`),
`lmstudio/` sağlayıcı öneki olmadan alır. Kimliği doğrulanmış sunucular için `--lmstudio-api-key` seçeneğini iletin
(veya `LM_API_TOKEN` ayarlayın); kimliği doğrulanmamış sunucularda bu seçeneği atlayın; OpenClaw bunun yerine yerel, gizli olmayan bir işaretçi depolar.
`--custom-api-key` uyumluluk amacıyla hâlâ kabul edilir, ancak `--lmstudio-api-key` tercih edilir.

Bu işlem `models.providers.lmstudio` değerini yazar ve varsayılan modeli `lmstudio/<custom-model-id>` olarak ayarlar.
Bir API anahtarı sağlamak ayrıca `lmstudio:default` kimlik doğrulama profilini de yazar.

Etkileşimli kurulum ayrıca tercih edilen yükleme bağlamı uzunluğunu sorabilir ve bunu yapılandırmaya
kaydettiği keşfedilmiş modellerin tümüne uygular.

## Yapılandırma

### Akış kullanım bilgisi uyumluluğu

LM Studio, akış yanıtlarında her zaman OpenAI biçimli bir `usage` nesnesi yayınlamaz. OpenClaw
bunun yerine llama.cpp tarzı `timings.prompt_n` / `timings.predicted_n` meta verilerinden token sayılarını
kurtarır. Yerel uç nokta (local loopback ana makinesi) olarak çözümlenen tüm OpenAI uyumlu uç noktalar aynı
geri dönüş mekanizmasını kullanır; bu, vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
ve text-generation-webui gibi diğer yerel arka uçları da kapsar.

### Düşünme uyumluluğu

LM Studio'nun `/api/v1/models` keşfi modele özgü akıl yürütme seçenekleri bildirdiğinde OpenClaw,
model uyumluluk meta verilerinde eşleşen `reasoning_effort` değerlerini (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`)
sunar. Bazı LM Studio derlemeleri ikili bir kullanıcı arayüzü seçeneği (`allowed_options: ["off",
"on"]`) sunarken `/v1/chat/completions` üzerinde bu değişmez değerleri reddeder; OpenClaw,
istekleri göndermeden önce bu ikili biçimi altı seviyeli ölçeğe dönüştürür. Bu dönüştürme, hâlâ
`off`/`on` akıl yürütme eşlemelerine sahip eski kayıtlı yapılandırmalar için de uygulanır.

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

### Ön yüklemeyi devre dışı bırakma

LM Studio, modelleri ilk istekte yükleyen tam zamanında (JIT) model yüklemeyi destekler. OpenClaw,
varsayılan olarak LM Studio'nun yerel yükleme uç noktası üzerinden modelleri önceden yükler; bu, JIT
devre dışıyken yardımcı olur. Bunun yerine model yaşam döngüsünü LM Studio'nun JIT, boşta kalma TTL'si ve otomatik çıkarma davranışının
yönetmesine izin vermek için OpenClaw'ın ön yükleme adımını devre dışı bırakın:

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

### LAN veya tailnet ana makinesi

LM Studio ana makinesinin erişilebilir adresini kullanın, `/v1` bölümünü koruyun ve LM Studio'nun
o makinede local loopback dışındaki adreslere bağlandığından emin olun:

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

`lmstudio`, meta veri/bağlantı-yerel kaynaklar hariç olmak üzere local loopback, LAN ve tailnet ana makineleri
dâhil, model istekleri için yapılandırılmış uç noktasına otomatik olarak güvenir. Tüm özel/yerel OpenAI uyumlu
sağlayıcı girdileri aynı tam kaynak güvenini elde eder. Farklı bir özel ana makineye veya bağlantı noktasına yönelik istekler yine de
`models.providers.<id>.request.allowPrivateNetwork: true` gerektirir; varsayılan güvenden çıkmak için bunu `false` olarak ayarlayın.

## Sorun giderme

### LM Studio algılanmadı

LM Studio'nun çalıştığından emin olun:

```bash
lms server start --port 1234
```

Kimlik doğrulama etkinse `LM_API_TOKEN` değerini de ayarlayın. API'ye erişilebildiğini doğrulayın:

```bash
curl http://localhost:1234/api/v1/models
```

### Kimlik doğrulama hataları (HTTP 401)

- `LM_API_TOKEN` değerinin LM Studio'da yapılandırılmış anahtarla eşleştiğini kontrol edin.
- Bkz. [LM Studio Kimlik Doğrulaması](https://lmstudio.ai/docs/developer/core/authentication).
- Sunucu kimlik doğrulaması gerektirmiyorsa kurulum sırasında anahtarı boş bırakın.

## İlgili

- [Model seçimi](/tr/concepts/model-providers)
- [Ollama](/tr/providers/ollama)
- [Yerel modeller](/tr/gateway/local-models)

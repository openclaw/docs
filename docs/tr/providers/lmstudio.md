---
read_when:
    - OpenClaw'u LM Studio aracılığıyla açık kaynaklı modellerle çalıştırmak istiyorsunuz
    - LM Studio'yu kurmak ve yapılandırmak istiyorsunuz
summary: OpenClaw'ı LM Studio ile çalıştırın
title: LM Studio
x-i18n:
    generated_at: "2026-07-16T17:52:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21129dad2f1bf53fcf9474db2393fce7642b82f4f22e1770d9788547f08eca7f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio, llama.cpp (GGUF) veya MLX modellerini GUI uygulaması ya da başsız `llmster`
daemon olarak yerel ortamda çalıştırır. Kurulum ve ürün belgeleri için [lmstudio.ai](https://lmstudio.ai/) adresine bakın.

## Hızlı başlangıç

<Steps>
  <Step title="Sunucuyu kurun ve başlatın">
    LM Studio'yu (masaüstü) veya `llmster`'i (başsız) kurun, ardından sunucuyu başlatın:

    ```bash
    lms server start --port 1234
    ```

    Alternatif olarak başsız daemon'ı çalıştırın:

    ```bash
    lms daemon up
    ```

    Masaüstü uygulamasını kullanıyorsanız modellerin sorunsuz yüklenmesi için JIT'i etkinleştirin;
    [LM Studio JIT ve TTL kılavuzuna](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) bakın.

  </Step>
  <Step title="Kimlik doğrulama etkinse bir API anahtarı ayarlayın">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    LM Studio kimlik doğrulaması devre dışıysa kurulum sırasında API anahtarını boş bırakın.
    [LM Studio Kimlik Doğrulaması](https://lmstudio.ai/docs/developer/core/authentication) sayfasına bakın.

  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard
    ```

    `LM Studio` seçeneğini belirleyin, ardından `Default model` isteminde bir model seçin.

    Yeni bir rehberli kurulumda OpenClaw önce varsayılan veya yapılandırılmış LM Studio
    ana makinesinde `/api/v1/models` sorgusu yapar. Mevcut bir LLM, aynı CLI/macOS kurulum
    adımları üzerinden sunulur ve yapılandırması kaydedilmeden önce gerçek bir tamamlama
    ile doğrulanır. Otomatik denetim hiçbir zaman model indirmez ve yalnızca gömme amaçlı
    katalog girdilerini yok sayar.

  </Step>
</Steps>

Varsayılan modeli daha sonra değiştirin:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio model anahtarları `author/model-name` biçimini kullanır (ör. `qwen/qwen3.5-9b`); OpenClaw model referanslarının
başına sağlayıcı eklenir: `lmstudio/qwen/qwen3.5-9b`. Bir modelin tam anahtarını bulmak için aşağıdaki
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

`--custom-model-id`, model anahtarını LM Studio'nun döndürdüğü biçimde (ör. `qwen/qwen3.5-9b`),
`lmstudio/` sağlayıcı öneki olmadan alır. Kimliği doğrulanan sunucular için `--lmstudio-api-key` parametresini
geçirin (veya `LM_API_TOKEN` ayarlayın); kimlik doğrulaması olmayan sunucularda bunu atlayın; OpenClaw bunun
yerine gizli olmayan yerel bir işaretçi saklar. `--custom-api-key` uyumluluk için hâlâ kabul edilir,
ancak `--lmstudio-api-key` tercih edilir.

Bu işlem `models.providers.lmstudio` yazar ve varsayılan modeli `lmstudio/<custom-model-id>` olarak ayarlar.
Bir API anahtarı sağlamak ayrıca `lmstudio:default` kimlik doğrulama profilini yazar.

Etkileşimli kurulum ayrıca tercih edilen bir yükleme bağlamı uzunluğu sorabilir ve bunu yapılandırmaya
kaydettiği keşfedilmiş modellerin tamamına uygular.

## Yapılandırma

### Akış kullanım bilgisi uyumluluğu

LM Studio, akış yanıtlarında her zaman OpenAI biçiminde bir `usage` nesnesi yayınlamaz. OpenClaw
bunun yerine token sayılarını llama.cpp biçimindeki `timings.prompt_n` / `timings.predicted_n` meta verilerinden
kurtarır. Yerel uç nokta (geri döngü ana makinesi) olarak çözümlenen OpenAI uyumlu tüm uç noktalar aynı
geri dönüş mekanizmasını kullanır; bu mekanizma vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
ve text-generation-webui gibi diğer yerel arka uçları da kapsar.

### Düşünme uyumluluğu

LM Studio'nun `/api/v1/models` keşfi modele özgü akıl yürütme seçenekleri bildirdiğinde OpenClaw,
model uyumluluk meta verilerinde eşleşen `reasoning_effort` değerlerini (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`)
sunar. Bazı LM Studio derlemeleri ikili bir kullanıcı arayüzü seçeneği (`allowed_options: ["off",
"on"]`) sunarken
`/v1/chat/completions` üzerinde bu değişmez değerleri reddeder; OpenClaw, hâlâ `off`/`on`
akıl yürütme eşlemelerine sahip eski kayıtlı yapılandırmalar da dahil olmak üzere, istekleri göndermeden önce bu
ikili biçimi altı seviyeli ölçeğe normalleştirir.

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
varsayılan olarak modelleri LM Studio'nun yerel yükleme uç noktası üzerinden önceden yükler; bu, JIT
devre dışıyken yardımcı olur. Bunun yerine model yaşam döngüsünü LM Studio'nun JIT, boşta kalma TTL'si
ve otomatik çıkarma davranışının yönetmesine izin vermek için OpenClaw'ın ön yükleme adımını devre dışı bırakın:

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

LM Studio ana makinesinin erişilebilir adresini kullanın, `/v1` değerini koruyun ve LM Studio'nun
o makinede geri döngü dışındaki adreslere bağlandığından emin olun:

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

`lmstudio`, meta veri/bağlantı yerel kökenleri hariç olmak üzere geri döngü, LAN ve tailnet ana
makineleri dahil yapılandırılmış uç noktasına model istekleri için otomatik olarak güvenir. Özel/yerel
OpenAI uyumlu tüm sağlayıcı girdileri aynı tam köken güvenini alır. Farklı bir özel ana makineye veya
porta yapılan istekler yine de `models.providers.<id>.request.allowPrivateNetwork: true` gerektirir; varsayılan güvenden çıkmak için bunu
`false` olarak ayarlayın.

## Sorun giderme

### LM Studio algılanmıyor

LM Studio'nun çalıştığından emin olun:

```bash
lms server start --port 1234
```

Kimlik doğrulama etkinse `LM_API_TOKEN` değerini de ayarlayın. API'ye erişilebildiğini doğrulayın:

```bash
curl http://localhost:1234/api/v1/models
```

### Kimlik doğrulama hataları (HTTP 401)

- `LM_API_TOKEN` değerinin LM Studio'da yapılandırılan anahtarla eşleştiğini denetleyin.
- [LM Studio Kimlik Doğrulaması](https://lmstudio.ai/docs/developer/core/authentication) sayfasına bakın.
- Sunucu kimlik doğrulama gerektirmiyorsa kurulum sırasında anahtarı boş bırakın.

## İlgili

- [Model seçimi](/tr/concepts/model-providers)
- [Ollama](/tr/providers/ollama)
- [Yerel modeller](/tr/gateway/local-models)

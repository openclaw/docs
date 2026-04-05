---
read_when:
    - Gateway, çalışma alanı, kimlik doğrulama, kanallar ve Skills için yönlendirmeli kurulum istiyorsunuz
summary: '`openclaw onboard` için CLI başvurusu (etkileşimli ilk kurulum)'
title: onboard
x-i18n:
    generated_at: "2026-04-05T13:49:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6db61c8002c9e82e48ff44f72e176b58ad85fad5cb8434687455ed40add8cc2a
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Yerel veya uzak Gateway kurulumu için etkileşimli ilk kurulum.

## İlgili kılavuzlar

- CLI ilk kurulum merkezi: [İlk Kurulum (CLI)](/start/wizard)
- İlk kurulum genel bakışı: [İlk Kurulum Genel Bakışı](/start/onboarding-overview)
- CLI ilk kurulum başvurusu: [CLI Kurulum Başvurusu](/start/wizard-cli-reference)
- CLI otomasyonu: [CLI Otomasyonu](/start/wizard-cli-automation)
- macOS ilk kurulumu: [İlk Kurulum (macOS Uygulaması)](/start/onboarding)

## Örnekler

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Düz metin özel ağ `ws://` hedefleri için (yalnızca güvenilir ağlarda), ilk kurulum işlem ortamında
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın.

Etkileşimsiz özel sağlayıcı:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key`, etkileşimsiz modda isteğe bağlıdır. Belirtilmezse, ilk kurulum `CUSTOM_API_KEY` değerini denetler.

Etkileşimsiz Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` varsayılan olarak `http://127.0.0.1:11434` olur. `--custom-model-id` isteğe bağlıdır; belirtilmezse ilk kurulum Ollama'nın önerilen varsayılanlarını kullanır. `kimi-k2.5:cloud` gibi bulut model kimlikleri de burada çalışır.

Sağlayıcı anahtarlarını düz metin yerine referans olarak saklayın:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` ile ilk kurulum, düz metin anahtar değerleri yerine env destekli referanslar yazar.
Kimlik doğrulama profili destekli sağlayıcılar için bu, `keyRef` girdileri yazar; özel sağlayıcılar için ise `models.providers.<id>.apiKey` alanını env referansı olarak yazar (örneğin `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Etkileşimsiz `ref` modu sözleşmesi:

- Sağlayıcı env değişkenini ilk kurulum işlem ortamında ayarlayın (örneğin `OPENAI_API_KEY`).
- Bu env değişkeni de ayarlı değilse satır içi anahtar bayrakları geçmeyin (örneğin `--openai-api-key`).
- Gerekli env değişkeni olmadan satır içi anahtar bayrağı geçirilirse, ilk kurulum yönlendirme ile hızlıca başarısız olur.

Etkileşimsiz modda Gateway belirteci seçenekleri:

- `--gateway-auth token --gateway-token <token>` düz metin bir belirteç saklar.
- `--gateway-auth token --gateway-token-ref-env <name>` `gateway.auth.token` değerini env SecretRef olarak saklar.
- `--gateway-token` ve `--gateway-token-ref-env` birlikte kullanılamaz.
- `--gateway-token-ref-env`, ilk kurulum işlem ortamında boş olmayan bir env değişkeni gerektirir.
- `--install-daemon` ile, belirteç kimlik doğrulaması belirteç gerektirdiğinde, SecretRef ile yönetilen Gateway belirteçleri doğrulanır ancak supervisor hizmet ortamı meta verilerinde çözümlenmiş düz metin olarak kalıcı hale getirilmez.
- `--install-daemon` ile, belirteç modu bir belirteç gerektiriyor ve yapılandırılmış belirteç SecretRef'i çözümlenmemişse, ilk kurulum düzeltme yönlendirmesiyle kapalı şekilde başarısız olur.
- `--install-daemon` ile, hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmış ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar ilk kurulum kurulumu engeller.
- Yerel ilk kurulum config içine `gateway.mode="local"` yazar. Daha sonra bir config dosyasında `gateway.mode` yoksa, bunu geçerli bir yerel mod kısayolu olarak değil, config bozulması veya eksik bir manuel düzenleme olarak değerlendirin.
- `--allow-unconfigured`, ayrı bir Gateway çalışma zamanı kaçış kapağıdır. Bu, ilk kurulumun `gateway.mode` alanını atlayabileceği anlamına gelmez.

Örnek:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Etkileşimsiz yerel Gateway sağlık denetimi:

- `--skip-health` geçmediğiniz sürece, ilk kurulum başarıyla çıkmadan önce erişilebilir bir yerel Gateway bekler.
- `--install-daemon`, önce yönetilen Gateway kurulum yolunu başlatır. Bu olmadan, örneğin `openclaw gateway run` ile yerel bir Gateway'in zaten çalışıyor olması gerekir.
- Otomasyonda yalnızca config/çalışma alanı/bootstrap yazımları istiyorsanız, `--skip-health` kullanın.
- Yerel Windows'ta `--install-daemon`, önce Scheduled Tasks kullanmayı dener ve görev oluşturma reddedilirse kullanıcı başına Startup klasörü oturum açma öğesine geri döner.

Referans modu ile etkileşimli ilk kurulum davranışı:

- İstendiğinde **Gizli referans kullan** seçeneğini seçin.
- Ardından şunlardan birini seçin:
  - Ortam değişkeni
  - Yapılandırılmış gizli sağlayıcı (`file` veya `exec`)
- İlk kurulum, referansı kaydetmeden önce hızlı bir ön doğrulama gerçekleştirir.
  - Doğrulama başarısız olursa, ilk kurulum hatayı gösterir ve yeniden denemenize izin verir.

Etkileşimsiz Z.AI uç nokta seçenekleri:

Not: `--auth-choice zai-api-key` artık anahtarınız için en iyi Z.AI uç noktasını otomatik algılar (`zai/glm-5` ile genel API'yi tercih eder).
Özellikle GLM Coding Plan uç noktalarını istiyorsanız, `zai-coding-global` veya `zai-coding-cn` seçin.

```bash
# İstemsiz uç nokta seçimi
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Diğer Z.AI uç nokta seçenekleri:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Etkileşimsiz Mistral örneği:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Akış notları:

- `quickstart`: en az istem, otomatik olarak bir Gateway belirteci üretir.
- `manual`: port/bind/auth için tüm istemler (`advanced` takma adı).
- Bir auth seçimi tercih edilen bir sağlayıcıyı ima ediyorsa, ilk kurulum
  varsayılan model ve izin listesi seçicilerini o sağlayıcıya göre ön filtreler. Volcengine ve
  BytePlus için bu, coding-plan varyantlarıyla da eşleşir
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Tercih edilen sağlayıcı filtresi henüz yüklenmiş model döndürmezse, ilk kurulum
  seçiciyi boş bırakmak yerine filtresiz kataloğa geri döner.
- Web arama adımında, bazı sağlayıcılar sağlayıcıya özgü
  ek istemleri tetikleyebilir:
  - **Grok**, aynı `XAI_API_KEY` ile isteğe bağlı `x_search`
    kurulumu ve bir `x_search` model seçimi sunabilir.
  - **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` ile
    `api.moonshot.cn`) ve varsayılan Kimi web arama modelini sorabilir.
- Yerel ilk kurulum DM kapsamı davranışı: [CLI Kurulum Başvurusu](/start/wizard-cli-reference#outputs-and-internals).
- En hızlı ilk sohbet: `openclaw dashboard` (Kontrol UI, kanal kurulumu yok).
- Özel Sağlayıcı: listede olmayan barındırılan sağlayıcılar dahil olmak üzere,
  OpenAI veya Anthropic uyumlu herhangi bir uç noktaya bağlanın. Otomatik algılama için Unknown kullanın.

## Yaygın devam komutları

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`, etkileşimsiz modu ima etmez. Betikler için `--non-interactive` kullanın.
</Note>

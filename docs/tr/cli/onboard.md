---
read_when:
    - Gateway, çalışma alanı, kimlik doğrulama, kanallar ve Skills için rehberli kurulum istiyorsunuz
summary: '`openclaw onboard` için CLI referansı (etkileşimli ilk kurulum)'
title: Kullanıma Al
x-i18n:
    generated_at: "2026-04-30T09:14:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Yerel veya uzak Gateway kurulumu için etkileşimli ilk katılım.

## İlgili kılavuzlar

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/tr/start/wizard" icon="rocket">
    Etkileşimli CLI akışının adım adım açıklaması.
  </Card>
  <Card title="Onboarding overview" href="/tr/start/onboarding-overview" icon="map">
    OpenClaw ilk katılımının nasıl bir araya geldiği.
  </Card>
  <Card title="CLI setup reference" href="/tr/start/wizard-cli-reference" icon="book">
    Çıktılar, iç işleyiş ve adım bazında davranış.
  </Card>
  <Card title="CLI automation" href="/tr/start/wizard-cli-automation" icon="terminal">
    Etkileşimsiz bayraklar ve betikli kurulumlar.
  </Card>
  <Card title="macOS app onboarding" href="/tr/start/onboarding" icon="apple">
    macOS menü çubuğu uygulaması için ilk katılım akışı.
  </Card>
</CardGroup>

## Örnekler

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import`, Hermes gibi plugin tarafından sahiplenilen geçiş sağlayıcılarını kullanır. Yalnızca yeni bir OpenClaw kurulumunda çalışır; mevcut config, credentials, sessions veya çalışma alanı memory/identity dosyaları varsa içe aktarmadan önce sıfırlayın ya da yeni bir kurulum seçin.

`--modern`, Crestodian konuşmalı ilk katılım önizlemesini başlatır. `--modern` olmadan, `openclaw onboard` klasik ilk katılım akışını korur.

Düz metin özel ağ `ws://` hedefleri için (yalnızca güvenilir ağlar), ilk katılım süreci ortamında `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarını yapın. Bu istemci tarafı taşıma acil durum aşımı için `openclaw.json` eşdeğeri yoktur.

Etkileşimsiz özel sağlayıcı:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key`, etkileşimsiz modda isteğe bağlıdır. Atlanırsa ilk katılım `CUSTOM_API_KEY` değişkenini denetler.
OpenClaw, yaygın görme modeli kimliklerini otomatik olarak görüntü destekli şeklinde işaretler. Bilinmeyen özel görme kimlikleri için `--custom-image-input` geçirin veya yalnızca metin meta verilerini zorlamak için `--custom-text-input` kullanın.

LM Studio, etkileşimsiz modda sağlayıcıya özgü bir anahtar bayrağını da destekler:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Etkileşimsiz Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` varsayılan olarak `http://127.0.0.1:11434` değerini kullanır. `--custom-model-id` isteğe bağlıdır; atlanırsa ilk katılım Ollama'nın önerilen varsayılanlarını kullanır. `kimi-k2.5:cloud` gibi bulut modeli kimlikleri de burada çalışır.

Sağlayıcı anahtarlarını düz metin yerine ref olarak saklayın:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` ile ilk katılım, düz metin anahtar değerleri yerine env destekli ref'ler yazar.
Auth-profile destekli sağlayıcılar için bu, `keyRef` girdileri yazar; özel sağlayıcılar için `models.providers.<id>.apiKey` değerini env ref olarak yazar (örneğin `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Etkileşimsiz `ref` modu sözleşmesi:

- Sağlayıcı env var'ını ilk katılım süreci ortamında ayarlayın (örneğin `OPENAI_API_KEY`).
- Bu env var da ayarlanmadıkça satır içi anahtar bayrakları geçirmeyin (örneğin `--openai-api-key`).
- Gerekli env var olmadan satır içi anahtar bayrağı geçirilirse ilk katılım hızlıca başarısız olur ve yönlendirme gösterir.

Etkileşimsiz modda Gateway token seçenekleri:

- `--gateway-auth token --gateway-token <token>` düz metin token saklar.
- `--gateway-auth token --gateway-token-ref-env <name>` `gateway.auth.token` değerini env SecretRef olarak saklar.
- `--gateway-token` ve `--gateway-token-ref-env` birbirini dışlar.
- `--gateway-token-ref-env`, ilk katılım süreci ortamında boş olmayan bir env var gerektirir.
- `--install-daemon` ile token auth bir token gerektirdiğinde, SecretRef tarafından yönetilen gateway token'ları doğrulanır ancak supervisor hizmet ortamı meta verilerinde çözümlenmiş düz metin olarak kalıcılaştırılmaz.
- `--install-daemon` ile token modu bir token gerektiriyor ve yapılandırılan token SecretRef çözümlenemiyorsa ilk katılım güvenli şekilde başarısız olur ve düzeltme yönlendirmesi gösterir.
- `--install-daemon` ile hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa ilk katılım, mod açıkça ayarlanana kadar kurulumu engeller.
- Yerel ilk katılım, config içine `gateway.mode="local"` yazar. Daha sonraki bir config dosyasında `gateway.mode` eksikse bunu geçerli bir yerel mod kısayolu olarak değil, config hasarı veya eksik bir manuel düzenleme olarak ele alın.
- `--allow-unconfigured` ayrı bir gateway çalışma zamanı kaçış yoludur. Bu, ilk katılımın `gateway.mode` değerini atlayabileceği anlamına gelmez.

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

Etkileşimsiz yerel gateway sağlığı:

- `--skip-health` geçirmediğiniz sürece ilk katılım, başarıyla çıkmadan önce erişilebilir bir yerel gateway bekler.
- `--install-daemon` önce yönetilen gateway kurulum yolunu başlatır. Onsuz, örneğin `openclaw gateway run` ile zaten çalışan bir yerel gateway'iniz olmalıdır.
- Otomasyonda yalnızca config/çalışma alanı/bootstrap yazımları istiyorsanız `--skip-health` kullanın.
- Çalışma alanı dosyalarını kendiniz yönetiyorsanız `agents.defaults.skipBootstrap: true` ayarlamak ve `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ve `BOOTSTRAP.md` oluşturmayı atlamak için `--skip-bootstrap` geçirin.
- Yerel Windows'ta `--install-daemon` önce Zamanlanmış Görevleri dener ve görev oluşturma reddedilirse kullanıcı bazlı Startup klasörü oturum açma öğesine geri döner.

Reference modu ile etkileşimli ilk katılım davranışı:

- Sorulduğunda **Gizli referans kullan** seçeneğini belirleyin.
- Ardından şunlardan birini seçin:
  - Ortam değişkeni
  - Yapılandırılmış gizli sağlayıcı (`file` veya `exec`)
- İlk katılım, ref'i kaydetmeden önce hızlı bir ön doğrulama gerçekleştirir.
  - Doğrulama başarısız olursa ilk katılım hatayı gösterir ve yeniden denemenize izin verir.

### Etkileşimsiz Z.AI endpoint seçenekleri

<Note>
`--auth-choice zai-api-key`, anahtarınız için en iyi Z.AI endpoint'ini otomatik algılar (genel API'yi `zai/glm-5.1` ile tercih eder). Özellikle GLM Coding Plan endpoint'lerini istiyorsanız `zai-coding-global` veya `zai-coding-cn` seçin.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
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

## Akış notları

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: en az istem, otomatik olarak bir gateway token'ı oluşturur.
    - `manual`: port, bind ve auth için tam istemler (`advanced` takma adı).
    - `import`: algılanan bir geçiş sağlayıcısını çalıştırır, planı önizler, ardından onaydan sonra uygular.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Bir auth seçimi tercih edilen bir sağlayıcıyı ima ettiğinde ilk katılım, varsayılan model ve allowlist seçicilerini o sağlayıcıya göre önceden filtreler. Volcengine ve BytePlus için bu, coding-plan varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`).

    Tercih edilen sağlayıcı filtresi henüz yüklenmiş model üretmezse ilk katılım, seçiciyi boş bırakmak yerine filtresiz kataloğa geri döner.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Bazı web-search sağlayıcıları, sağlayıcıya özgü takip istemlerini tetikler:

    - **Grok**, aynı `XAI_API_KEY` ve bir `x_search` model seçimiyle isteğe bağlı `x_search` kurulumu sunabilir.
    - **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` ve `api.moonshot.cn`) ve varsayılan Kimi web-search modelini sorabilir.

  </Accordion>
  <Accordion title="Other behaviors">
    - Yerel ilk katılım DM kapsamı davranışı: [CLI kurulum başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals).
    - En hızlı ilk sohbet: `openclaw dashboard` (Control UI, kanal kurulumu yok).
    - Özel sağlayıcı: listelenmeyen barındırılan sağlayıcılar dahil, OpenAI veya Anthropic uyumlu herhangi bir endpoint'e bağlanın. Otomatik algılama için Unknown kullanın.
    - Hermes durumu algılanırsa ilk katılım bir geçiş akışı sunar. Deneme çalıştırması planları, üzerine yazma modu, raporlar ve kesin eşlemeler için [Geçir](/tr/cli/migrate) kullanın.

  </Accordion>
</AccordionGroup>

## Yaygın takip komutları

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` etkileşimsiz mod anlamına gelmez. Betikler için `--non-interactive` kullanın.
</Note>

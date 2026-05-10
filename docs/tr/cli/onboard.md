---
read_when:
    - Gateway, çalışma alanı, kimlik doğrulama, kanallar ve Skills için rehberli kurulum istiyorsunuz
summary: '`openclaw onboard` için CLI referansı (etkileşimli ilk kurulum)'
title: Kullanıma Hazırla
x-i18n:
    generated_at: "2026-05-10T19:29:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 510b2bbb688605ce1bf30918e4982e783963e7d43be65f9c23cffac11248ffd2
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Yerel veya uzak Gateway kurulumu için tam yönlendirmeli ilk kurulum. OpenClaw'ın model kimlik doğrulama, çalışma alanı, Gateway, kanallar, Skills ve sağlığı tek bir akışta adım adım yürütmesini istediğinizde bunu kullanın.

## İlgili kılavuzlar

<CardGroup cols={2}>
  <Card title="CLI ilk kurulum merkezi" href="/tr/start/wizard" icon="rocket">
    Etkileşimli CLI akışının adım adım anlatımı.
  </Card>
  <Card title="İlk kurulum genel bakışı" href="/tr/start/onboarding-overview" icon="map">
    OpenClaw ilk kurulumunun nasıl bir araya geldiği.
  </Card>
  <Card title="CLI kurulum başvurusu" href="/tr/start/wizard-cli-reference" icon="book">
    Çıktılar, iç işleyiş ve adım başına davranış.
  </Card>
  <Card title="CLI otomasyonu" href="/tr/start/wizard-cli-automation" icon="terminal">
    Etkileşimsiz bayraklar ve betikli kurulumlar.
  </Card>
  <Card title="macOS uygulaması ilk kurulumu" href="/tr/start/onboarding" icon="apple">
    macOS menü çubuğu uygulaması için ilk kurulum akışı.
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

`--flow import`, Hermes gibi Plugin sahipli geçiş sağlayıcılarını kullanır. Yalnızca yeni bir OpenClaw kurulumunda çalışır; mevcut yapılandırma, kimlik bilgileri, oturumlar veya çalışma alanı bellek/kimlik dosyaları varsa içe aktarmadan önce sıfırlayın ya da yeni bir kurulum seçin.

`--modern`, Crestodian konuşmaya dayalı ilk kurulum önizlemesini başlatır. `--modern` olmadan, `openclaw onboard` klasik ilk kurulum akışını korur.

Düz metin özel ağ `ws://` hedefleri için (yalnızca güvenilir ağlar), ilk kurulum süreci ortamında `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın. Bu istemci tarafı taşıma acil durum seçeneği için `openclaw.json` eşdeğeri yoktur.

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

`--custom-api-key`, etkileşimsiz modda isteğe bağlıdır. Atlanırsa ilk kurulum `CUSTOM_API_KEY` değerini denetler. OpenClaw, yaygın görme modeli kimliklerini otomatik olarak görüntü yetenekli olarak işaretler. Bilinmeyen özel görme kimlikleri için `--custom-image-input` iletin veya yalnızca metin meta verisini zorlamak için `--custom-text-input` kullanın.

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

`--custom-base-url` varsayılan olarak `http://127.0.0.1:11434` değerini kullanır. `--custom-model-id` isteğe bağlıdır; atlanırsa ilk kurulum Ollama'nın önerilen varsayılanlarını kullanır. `kimi-k2.5:cloud` gibi bulut modeli kimlikleri de burada çalışır.

Sağlayıcı anahtarlarını düz metin yerine başvuru olarak saklayın:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` ile ilk kurulum, düz metin anahtar değerleri yerine ortam destekli başvurular yazar. Auth-profile destekli sağlayıcılar için bu `keyRef` girdileri yazar; özel sağlayıcılar için `models.providers.<id>.apiKey` değerini bir ortam başvurusu olarak yazar (örneğin `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Etkileşimsiz `ref` modu sözleşmesi:

- Sağlayıcı ortam değişkenini ilk kurulum süreci ortamında ayarlayın (örneğin `OPENAI_API_KEY`).
- Bu ortam değişkeni de ayarlanmadıkça satır içi anahtar bayrakları iletmeyin (örneğin `--openai-api-key`).
- Gerekli ortam değişkeni olmadan satır içi anahtar bayrağı iletilirse ilk kurulum rehberlikle hızlıca başarısız olur.

Etkileşimsiz modda Gateway belirteci seçenekleri:

- `--gateway-auth token --gateway-token <token>` düz metin belirteci saklar.
- `--gateway-auth token --gateway-token-ref-env <name>` `gateway.auth.token` değerini bir ortam SecretRef olarak saklar.
- `--gateway-token` ve `--gateway-token-ref-env` birbirini dışlar.
- `--gateway-token-ref-env`, ilk kurulum süreci ortamında boş olmayan bir ortam değişkeni gerektirir.
- `--install-daemon` ile, belirteç kimlik doğrulaması belirteç gerektirdiğinde SecretRef tarafından yönetilen Gateway belirteçleri doğrulanır ancak gözetmen hizmeti ortam meta verilerinde çözümlenmiş düz metin olarak kalıcılaştırılmaz.
- `--install-daemon` ile, belirteç modu bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef çözümlenemiyorsa ilk kurulum düzeltme rehberliğiyle kapalı şekilde başarısız olur.
- `--install-daemon` ile, hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa ilk kurulum, mod açıkça ayarlanana kadar kurulumu engeller.
- Yerel ilk kurulum, yapılandırmaya `gateway.mode="local"` yazar. Daha sonraki bir yapılandırma dosyasında `gateway.mode` yoksa bunu geçerli bir yerel mod kısayolu olarak değil, yapılandırma hasarı veya eksik bir elle düzenleme olarak değerlendirin.
- Yerel ilk kurulum, seçilen kurulum yolu gerektirdiğinde seçili indirilebilir Pluginleri kurar.
- Uzak ilk kurulum yalnızca uzak Gateway için bağlantı bilgilerini yazar ve yerel Plugin paketlerini kurmaz.
- `--allow-unconfigured` ayrı bir Gateway çalışma zamanı kaçış seçeneğidir. Bu, ilk kurulumun `gateway.mode` değerini atlayabileceği anlamına gelmez.

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

Etkileşimsiz yerel Gateway sağlığı:

- `--skip-health` iletmediğiniz sürece ilk kurulum, başarıyla çıkmadan önce erişilebilir bir yerel Gateway bekler.
- `--install-daemon` önce yönetilen Gateway kurulum yolunu başlatır. Bu olmadan, örneğin `openclaw gateway run` ile çalışan bir yerel Gateway'inizin zaten olması gerekir.
- Otomasyonda yalnızca yapılandırma/çalışma alanı/bootstrap yazımları istiyorsanız `--skip-health` kullanın.
- Çalışma alanı dosyalarını kendiniz yönetiyorsanız `agents.defaults.skipBootstrap: true` ayarlamak ve `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ve `BOOTSTRAP.md` oluşturmayı atlamak için `--skip-bootstrap` iletin.
- Yerel Windows'ta `--install-daemon` önce Scheduled Tasks kullanmayı dener ve görev oluşturma reddedilirse kullanıcı başına Startup klasörü oturum açma öğesine geri döner.

Başvuru modu ile etkileşimli ilk kurulum davranışı:

- İstendiğinde **Gizli başvuruyu kullan** seçeneğini seçin.
- Ardından şunlardan birini seçin:
  - Ortam değişkeni
  - Yapılandırılmış gizli sağlayıcı (`file` veya `exec`)
- İlk kurulum, başvuruyu kaydetmeden önce hızlı bir ön kontrol doğrulaması yapar.
  - Doğrulama başarısız olursa ilk kurulum hatayı gösterir ve yeniden denemenize izin verir.

### Etkileşimsiz Z.AI uç nokta seçimleri

<Note>
`--auth-choice zai-api-key`, anahtarınız için en iyi Z.AI uç noktasını otomatik algılar (genel API'yi `zai/glm-5.1` ile tercih eder). Özellikle GLM Coding Plan uç noktalarını istiyorsanız `zai-coding-global` veya `zai-coding-cn` seçin.
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
  <Accordion title="Akış türleri">
    - `quickstart`: en az istem, Gateway belirtecini otomatik oluşturur.
    - `manual`: bağlantı noktası, bağlama ve kimlik doğrulama için tam istemler (`advanced` takma adı).
    - `import`: algılanan bir geçiş sağlayıcısını çalıştırır, planı önizler, ardından onaydan sonra uygular.

  </Accordion>
  <Accordion title="Sağlayıcı ön filtreleme">
    Bir kimlik doğrulama seçimi tercih edilen bir sağlayıcıyı ima ettiğinde ilk kurulum, varsayılan model ve izin listesi seçicilerini o sağlayıcıya göre önceden filtreler. Volcengine ve BytePlus için bu, coding-plan varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`).

    Tercih edilen sağlayıcı filtresi henüz yüklenmiş model döndürmezse ilk kurulum, seçiciyi boş bırakmak yerine filtrelenmemiş kataloğa geri döner.

  </Accordion>
  <Accordion title="Web araması takip istemleri">
    Bazı web araması sağlayıcıları, sağlayıcıya özgü takip istemlerini tetikler:

    - **Grok**, aynı `XAI_API_KEY` ve bir `x_search` model seçimiyle isteğe bağlı `x_search` kurulumu sunabilir.
    - **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` ve `api.moonshot.cn`) ve varsayılan Kimi web araması modelini sorabilir.

  </Accordion>
  <Accordion title="Diğer davranışlar">
    - Yerel ilk kurulum DM kapsamı davranışı: [CLI kurulum başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals).
    - En hızlı ilk sohbet: `openclaw dashboard` (Kontrol UI, kanal kurulumu yok).
    - Özel sağlayıcı: Listelenmeyen barındırılan sağlayıcılar dahil olmak üzere OpenAI veya Anthropic uyumlu herhangi bir uç noktaya bağlanın. Otomatik algılama için Unknown kullanın.
    - Hermes durumu algılanırsa ilk kurulum bir geçiş akışı sunar. Deneme planları, üzerine yazma modu, raporlar ve tam eşlemeler için [Geçiş yap](/tr/cli/migrate) kullanın.

  </Accordion>
</AccordionGroup>

## Yaygın takip komutları

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Yalnızca temel yapılandırma/çalışma alanına ihtiyacınız olduğunda bunun yerine `openclaw setup` kullanın. Hedefli değişiklikler için daha sonra `openclaw configure`, yalnızca kanal kurulumu için `openclaw channels add` kullanın.

<Note>
`--json` etkileşimsiz modu ima etmez. Betikler için `--non-interactive` kullanın.
</Note>

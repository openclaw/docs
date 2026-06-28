---
read_when:
    - Gateway, çalışma alanı, kimlik doğrulama, kanallar ve Skills için rehberli kurulum istiyorsunuz
summary: '`openclaw onboard` için CLI referansı (etkileşimli ilk katılım)'
title: Başlangıç kurulumu
x-i18n:
    generated_at: "2026-06-28T00:23:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ffee6b90e72f1859634fbd7ccac2f44e88bc37879b9e5b099c33b760cc0e9af
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Yerel veya uzak Gateway kurulumu için tam yönlendirmeli ilk kurulum. OpenClaw’ın model kimlik doğrulamasını, çalışma alanını, gateway’i, kanalları, Skills’i ve sağlık durumunu tek bir akışta adım adım işletmesini istediğinizde bunu kullanın.

## İlgili kılavuzlar

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/tr/start/wizard" icon="rocket">
    Etkileşimli CLI akışının adım adım anlatımı.
  </Card>
  <Card title="Onboarding overview" href="/tr/start/onboarding-overview" icon="map">
    OpenClaw ilk kurulumunun nasıl bir araya geldiği.
  </Card>
  <Card title="CLI setup reference" href="/tr/start/wizard-cli-reference" icon="book">
    Çıktılar, iç işleyiş ve adım başına davranış.
  </Card>
  <Card title="CLI automation" href="/tr/start/wizard-cli-automation" icon="terminal">
    Etkileşimsiz bayraklar ve betikli kurulumlar.
  </Card>
  <Card title="macOS app onboarding" href="/tr/start/onboarding" icon="apple">
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

`--flow import`, Hermes gibi Plugin’e ait geçiş sağlayıcılarını kullanır. Yalnızca yeni bir OpenClaw kurulumunda çalışır; mevcut config, kimlik bilgileri, oturumlar veya çalışma alanı bellek/kimlik dosyaları varsa içe aktarmadan önce sıfırlayın ya da yeni bir kurulum seçin.

`--modern`, Crestodian konuşmalı ilk kurulum önizlemesini başlatır. `--modern` olmadan, `openclaw onboard` klasik ilk kurulum akışını korur.

Etkin config dosyasının eksik olduğu veya yazılmış ayar içermediği (boş ya da yalnızca metadata içeren) yeni bir kurulumda, yalın `openclaw` da klasik ilk kurulum akışını başlatır. Bir config dosyasında yazılmış ayarlar bulunduğunda, yalın `openclaw` bunun yerine Crestodian’ı açar.

Düz metin `ws://`, local loopback, özel IP literalleri, `.local` ve Tailnet `*.ts.net` gateway URL’leri için kabul edilir. Diğer güvenilir özel-DNS adları için, ilk kurulum işlem ortamında `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın.

## Yerel Ayar

Etkileşimli ilk kurulum, sabit kurulum metni için CLI sihirbazı yerel ayarını kullanır. Çözümleme sırası şöyledir:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. İngilizce geri dönüşü

Desteklenen sihirbaz yerel ayarları `en`, `zh-CN` ve `zh-TW` değerleridir. Yerel ayar değerleri, `zh_CN.UTF-8` gibi alt çizgi veya POSIX son ek biçimlerini kullanabilir. Ürün adları, komut adları, config anahtarları, URL’ler, sağlayıcı kimlikleri, model kimlikleri ve Plugin/kanal etiketleri olduğu gibi kalır.

Örnek:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

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

`--custom-api-key`, etkileşimsiz modda isteğe bağlıdır. Atlanırsa ilk kurulum `CUSTOM_API_KEY` değerini denetler.
OpenClaw, yaygın görme modeli kimliklerini otomatik olarak görüntü destekli olarak işaretler. Bilinmeyen özel görme kimlikleri için `--custom-image-input` geçin veya yalnızca metin metadata’sını zorlamak için `--custom-text-input` kullanın.
`/v1/responses` destekleyen ancak `/v1/chat/completions` desteklemeyen OpenAI uyumlu endpoint’ler için `--custom-compatibility openai-responses` kullanın.

LM Studio, etkileşimsiz modda sağlayıcıya özel bir anahtar bayrağını da destekler:

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

`--custom-base-url` varsayılan olarak `http://127.0.0.1:11434` değerini kullanır. `--custom-model-id` isteğe bağlıdır; atlanırsa ilk kurulum Ollama’nın önerilen varsayılanlarını kullanır. `kimi-k2.5:cloud` gibi bulut model kimlikleri de burada çalışır.

Sağlayıcı anahtarlarını düz metin yerine ref olarak saklayın:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` ile ilk kurulum, düz metin anahtar değerleri yerine env destekli ref’ler yazar.
Auth-profile destekli sağlayıcılar için bu, `keyRef` girdileri yazar; özel sağlayıcılar için `models.providers.<id>.apiKey` değerini bir env ref olarak yazar (örneğin `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Etkileşimsiz `ref` modu sözleşmesi:

- Sağlayıcı env var değerini ilk kurulum işlem ortamında ayarlayın (örneğin `OPENAI_API_KEY`).
- Bu env var da ayarlı değilse satır içi anahtar bayrakları geçmeyin (örneğin `--openai-api-key`).
- Gerekli env var olmadan bir satır içi anahtar bayrağı geçirilirse ilk kurulum yönlendirmeyle hızlıca başarısız olur.

Etkileşimsiz modda Gateway token seçenekleri:

- `--gateway-auth token --gateway-token <token>` düz metin token saklar.
- `--gateway-auth token --gateway-token-ref-env <name>` `gateway.auth.token` değerini bir env SecretRef olarak saklar.
- `--gateway-token` ve `--gateway-token-ref-env` birbirini dışlar.
- `--gateway-token-ref-env`, ilk kurulum işlem ortamında boş olmayan bir env var gerektirir.
- `--install-daemon` ile, token kimlik doğrulaması bir token gerektirdiğinde, SecretRef yönetimli gateway token’ları doğrulanır ancak supervisor hizmet ortamı metadata’sında çözümlenmiş düz metin olarak kalıcı hale getirilmez.
- `--install-daemon` ile, token modu bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa ilk kurulum düzeltme yönlendirmesiyle kapalı şekilde başarısız olur.
- `--install-daemon` ile, hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar ilk kurulum kurulumu engeller.
- Yerel ilk kurulum config içine `gateway.mode="local"` yazar. Daha sonraki bir config dosyasında `gateway.mode` eksikse bunu geçerli bir yerel mod kısayolu olarak değil, config bozulması veya tamamlanmamış bir manuel düzenleme olarak değerlendirin.
- Yerel ilk kurulum, seçilen kurulum yolu bunları gerektirdiğinde seçili indirilebilir Plugin’leri kurar.
- Uzak ilk kurulum yalnızca uzak Gateway için bağlantı bilgilerini yazar ve yerel Plugin paketleri kurmaz.
- `--allow-unconfigured` ayrı bir gateway çalışma zamanı kaçış yoludur. İlk kurulumun `gateway.mode` değerini atlayabileceği anlamına gelmez.

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

- `--skip-health` geçmediğiniz sürece, ilk kurulum başarıyla çıkmadan önce erişilebilir bir yerel gateway bekler.
- `--install-daemon`, önce yönetilen gateway kurulum yolunu başlatır. O olmadan, örneğin `openclaw gateway run` ile zaten çalışan bir yerel gateway’iniz olmalıdır.
- Otomasyonda yalnızca config/çalışma alanı/bootstrap yazımlarını istiyorsanız `--skip-health` kullanın.
- Çalışma alanı dosyalarını kendiniz yönetiyorsanız, `agents.defaults.skipBootstrap: true` ayarlamak ve `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ve `BOOTSTRAP.md` oluşturmayı atlamak için `--skip-bootstrap` geçin.
- Yerel Windows’ta, `--install-daemon` önce Zamanlanmış Görevler’i dener ve görev oluşturma reddedilirse kullanıcı başına Startup klasörü oturum açma öğesine geri döner.

Referans modu ile etkileşimli ilk kurulum davranışı:

- İstendiğinde **Gizli referans kullan** seçeneğini seçin.
- Ardından şunlardan birini seçin:
  - Ortam değişkeni
  - Yapılandırılmış gizli sağlayıcı (`file` veya `exec`)
- İlk kurulum, ref’i kaydetmeden önce hızlı bir ön kontrol doğrulaması yapar.
  - Doğrulama başarısız olursa ilk kurulum hatayı gösterir ve yeniden denemenize izin verir.

### Etkileşimsiz Z.AI endpoint seçimleri

<Note>
`--auth-choice zai-api-key`, anahtarınız için en iyi Z.AI endpoint’ini ve modelini otomatik algılar. Coding Plan endpoint’leri `zai/glm-5.2` tercih eder; genel API endpoint’leri `zai/glm-5.1` kullanır. Bir Coding Plan endpoint’ini zorlamak için `zai-coding-global` veya `zai-coding-cn` seçin.
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
    - `quickstart`: en az istem, bir gateway token’ını otomatik oluşturur.
    - `manual`: port, bind ve auth için tam istemler (`advanced` takma adı).
    - `import`: algılanan bir geçiş sağlayıcısını çalıştırır, planı önizler, ardından onaydan sonra uygular.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Bir auth seçimi tercih edilen bir sağlayıcıyı ima ettiğinde, ilk kurulum default-model ve allowlist seçicilerini o sağlayıcıya önceden filtreler. Volcengine ve BytePlus için bu, coding-plan varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`).

    Tercih edilen sağlayıcı filtresi henüz yüklü model döndürmezse, ilk kurulum seçiciyi boş bırakmak yerine filtrelenmemiş kataloğa geri döner.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Bazı web araması sağlayıcıları, sağlayıcıya özel takip istemlerini tetikler:

    - **Grok**, aynı xAI OAuth profili veya API anahtarı ve bir `x_search` model seçimiyle isteğe bağlı `x_search` kurulumu sunabilir.
    - **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` ile `api.moonshot.cn` arasında) ve varsayılan Kimi web araması modelini sorabilir.

  </Accordion>
  <Accordion title="Other behaviors">
    - Yerel ilk kurulum DM kapsamı davranışı: [CLI kurulum referansı](/tr/start/wizard-cli-reference#outputs-and-internals).
    - En hızlı ilk sohbet: `openclaw dashboard` (Control UI, kanal kurulumu yok).
    - Özel sağlayıcı: listelenmeyen barındırılan sağlayıcılar dahil, herhangi bir OpenAI veya Anthropic uyumlu endpoint’e bağlanın. Otomatik algılamak için Unknown kullanın.
    - Hermes durumu algılanırsa ilk kurulum bir geçiş akışı sunar. Deneme çalıştırması planları, üzerine yazma modu, raporlar ve kesin eşlemeler için [Geçir](/tr/cli/migrate) kullanın.

  </Accordion>
</AccordionGroup>

## Yaygın takip komutları

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Yalnızca temel config/çalışma alanına ihtiyacınız olduğunda bunun yerine `openclaw setup` kullanın. Hedefli değişiklikler için daha sonra `openclaw configure`, yalnızca kanal kurulumu için `openclaw channels add` kullanın.

<Note>
`--json`, etkileşimsiz modu ima etmez. Betikler için `--non-interactive` kullanın.
</Note>

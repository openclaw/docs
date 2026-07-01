---
read_when:
    - Gateway, çalışma alanı, kimlik doğrulama, kanallar ve Skills için rehberli kurulum istiyorsunuz
summary: '`openclaw onboard` için CLI referansı (etkileşimli ilk kurulum)'
title: İlk Kurulum
x-i18n:
    generated_at: "2026-07-01T13:18:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Yerel veya uzak Gateway kurulumu için tam rehberli ilk kurulum. OpenClaw'ın model kimlik doğrulaması, çalışma alanı, Gateway, kanallar, Skills ve sağlık denetimini tek bir akışta adım adım yönlendirmesini istediğinizde bunu kullanın.

## İlgili kılavuzlar

<CardGroup cols={2}>
  <Card title="CLI ilk kurulum merkezi" href="/tr/start/wizard" icon="rocket">
    Etkileşimli CLI akışının adım adım anlatımı.
  </Card>
  <Card title="İlk kurulum genel bakışı" href="/tr/start/onboarding-overview" icon="map">
    OpenClaw ilk kurulumunun nasıl bir araya geldiği.
  </Card>
  <Card title="CLI kurulum başvurusu" href="/tr/start/wizard-cli-reference" icon="book">
    Çıktılar, iç işleyiş ve adım bazında davranış.
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

`--flow import`, Hermes gibi Plugin'e ait geçiş sağlayıcılarını kullanır. Yalnızca yeni bir OpenClaw kurulumu üzerinde çalışır; mevcut yapılandırma, kimlik bilgileri, oturumlar veya çalışma alanı bellek/kimlik dosyaları varsa içe aktarmadan önce sıfırlayın ya da yeni bir kurulum seçin.

`--modern`, Crestodian konuşmalı ilk kurulum önizlemesini başlatır. `--modern` olmadan `openclaw onboard`, klasik ilk kurulum akışını korur.

Etkin yapılandırma dosyasının eksik olduğu veya yazılmış ayar içermediği (boş ya da yalnızca meta veri) yeni bir kurulumda, yalın `openclaw` da klasik ilk kurulum akışını başlatır. Bir yapılandırma dosyası yazılmış ayarlara sahip olduğunda, yalın `openclaw` bunun yerine Crestodian'ı açar.

Düz metin `ws://`; loopback, özel IP değişmezleri, `.local` ve Tailnet `*.ts.net` Gateway URL'leri için kabul edilir. Diğer güvenilir özel DNS adları için ilk kurulum süreci ortamında `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın.

## Yerel ayar

Etkileşimli ilk kurulum, sabit kurulum metinleri için CLI sihirbazı yerel ayarını kullanır. Çözümleme sırası şöyledir:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. İngilizce yedek

Desteklenen sihirbaz yerel ayarları `en`, `zh-CN` ve `zh-TW` şeklindedir. Yerel ayar değerleri `zh_CN.UTF-8` gibi alt çizgi veya POSIX sonek biçimlerini kullanabilir. Ürün adları, komut adları, yapılandırma anahtarları, URL'ler, sağlayıcı kimlikleri, model kimlikleri ve Plugin/kanal etiketleri değişmez kalır.

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
OpenClaw, yaygın görsel model kimliklerini otomatik olarak görüntü yetenekli olarak işaretler. Bilinmeyen özel görsel kimlikleri için `--custom-image-input` geçirin veya yalnızca metin meta verisini zorlamak için `--custom-text-input` kullanın.
`/v1/responses` destekleyen ancak `/v1/chat/completions` desteklemeyen OpenAI uyumlu uç noktalar için `--custom-compatibility openai-responses` kullanın.

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

`--custom-base-url` varsayılan olarak `http://127.0.0.1:11434` değerini kullanır. `--custom-model-id` isteğe bağlıdır; atlanırsa ilk kurulum Ollama'nın önerilen varsayılanlarını kullanır. `kimi-k2.5:cloud` gibi bulut model kimlikleri de burada çalışır.

Sağlayıcı anahtarlarını düz metin yerine başvuru olarak saklayın:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` ile ilk kurulum, düz metin anahtar değerleri yerine ortam destekli başvurular yazar.
Kimlik doğrulama profili destekli sağlayıcılar için bu, `keyRef` girdileri yazar; özel sağlayıcılar için `models.providers.<id>.apiKey` değerini ortam başvurusu olarak yazar (örneğin `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Etkileşimsiz `ref` modu sözleşmesi:

- Sağlayıcı ortam değişkenini ilk kurulum süreci ortamında ayarlayın (örneğin `OPENAI_API_KEY`).
- Bu ortam değişkeni de ayarlanmadıkça satır içi anahtar bayrakları geçirmeyin (örneğin `--openai-api-key`).
- Gerekli ortam değişkeni olmadan satır içi anahtar bayrağı geçirilirse ilk kurulum rehberlikle birlikte hızlıca başarısız olur.

Etkileşimsiz modda Gateway belirteci seçenekleri:

- `--gateway-auth token --gateway-token <token>` düz metin belirteci saklar.
- `--gateway-auth token --gateway-token-ref-env <name>` `gateway.auth.token` değerini bir ortam SecretRef olarak saklar.
- `--gateway-token` ve `--gateway-token-ref-env` karşılıklı olarak dışlayıcıdır.
- `--gateway-token-ref-env`, ilk kurulum süreci ortamında boş olmayan bir ortam değişkeni gerektirir.
- `--install-daemon` ile, belirteç kimlik doğrulaması bir belirteç gerektirdiğinde, SecretRef tarafından yönetilen Gateway belirteçleri doğrulanır ancak supervisor hizmet ortamı meta verilerinde çözümlenmiş düz metin olarak kalıcılaştırılmaz.
- `--install-daemon` ile, belirteç modu bir belirteç gerektiriyorsa ve yapılandırılan belirteç SecretRef çözümlenemiyorsa ilk kurulum düzeltme rehberliğiyle kapalı şekilde başarısız olur.
- `--install-daemon` ile, hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa ilk kurulum, mod açıkça ayarlanana kadar kurulumu engeller.
- Yerel ilk kurulum, yapılandırmaya `gateway.mode="local"` yazar. Daha sonraki bir yapılandırma dosyasında `gateway.mode` eksikse bunu geçerli bir yerel mod kısayolu olarak değil, yapılandırma hasarı veya tamamlanmamış el ile düzenleme olarak değerlendirin.
- Yerel ilk kurulum, seçilen kurulum yolu gerektirdiğinde seçili indirilebilir Plugin'leri kurar.
- Uzak ilk kurulum yalnızca uzak Gateway için bağlantı bilgilerini yazar ve yerel Plugin paketlerini kurmaz.
- `--allow-unconfigured` ayrı bir Gateway çalışma zamanı kaçış yoludur. Bu, ilk kurulumun `gateway.mode` değerini atlayabileceği anlamına gelmez.

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

- `--skip-health` geçirmediğiniz sürece ilk kurulum, başarıyla çıkmadan önce erişilebilir bir yerel Gateway bekler.
- `--install-daemon`, önce yönetilen Gateway kurulum yolunu başlatır. Onsuz, örneğin `openclaw gateway run` ile zaten çalışan bir yerel Gateway'iniz olmalıdır.
- Otomasyonda yalnızca yapılandırma/çalışma alanı/bootstrap yazımları istiyorsanız `--skip-health` kullanın.
- Çalışma alanı dosyalarını kendiniz yönetiyorsanız `agents.defaults.skipBootstrap: true` ayarlamak ve `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ve `BOOTSTRAP.md` oluşturmayı atlamak için `--skip-bootstrap` geçirin.
- Yerel Windows'ta `--install-daemon` önce Zamanlanmış Görevleri dener ve görev oluşturma reddedilirse kullanıcı başına Startup klasörü oturum açma öğesine geri döner.

Başvuru modunda etkileşimli ilk kurulum davranışı:

- İstendiğinde **Gizli başvuru kullan** seçeneğini seçin.
- Ardından şunlardan birini seçin:
  - Ortam değişkeni
  - Yapılandırılmış gizli sağlayıcı (`file` veya `exec`)
- İlk kurulum, başvuruyu kaydetmeden önce hızlı bir ön denetim doğrulaması gerçekleştirir.
  - Doğrulama başarısız olursa ilk kurulum hatayı gösterir ve yeniden denemenize izin verir.

### Etkileşimsiz Z.AI uç nokta seçimleri

<Note>
`--auth-choice zai-api-key`, anahtarınız için en iyi Z.AI uç noktasını ve modelini otomatik olarak algılar. Kodlama Planı uç noktaları `zai/glm-5.2` tercih eder; genel API uç noktaları `zai/glm-5.1` kullanır. Bir Kodlama Planı uç noktasını zorlamak için `zai-coding-global` veya `zai-coding-cn` seçin.
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

## Ek etkileşimsiz bayraklar

Belirteç tabanlı model kimlik doğrulaması (etkileşimsiz; `--auth-choice token` ile kullanılır):

- `--token-provider <id>` — Belirteç sağlayıcı kimliği. Belirteci hangi sağlayıcının verdiğini tanımlar.
- `--token <token>` — Model kimlik doğrulaması için belirteç değeri.
- `--token-profile-id <id>` — Kimlik doğrulama profili kimliği. Genel belirteç depolama varsayılan olarak `<provider>:manual` kullanır; sağlayıcıya ait kurulum akışları `anthropic:default` gibi kendi varsayılanlarını kullanabilir.
- `--token-expires-in <duration>` — İsteğe bağlı belirteç sona erme süresi (ör. `365d`, `12h`).

Cloudflare AI Gateway (etkileşimsiz):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare AI Gateway üzerinden yönlendirme için Cloudflare Hesap Kimliği.
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway kimliği.

Daemon kurulum denetimi:

- `--no-install-daemon` — Gateway hizmeti kurulumunu açıkça atla.
- `--skip-daemon` — `--no-install-daemon` için diğer ad.

UI ve kanca kurulum denetimi:

- `--skip-ui` — İlk kurulum sırasında Control UI / TUI istemlerini atla.
- `--skip-hooks` — İlk kurulum sırasında Webhook / kanca kurulum istemlerini atla.

Çıktı bastırma:

- `--suppress-gateway-token-output` — Belirteç taşıyan Gateway/UI çıktısını bastırır (belirteç ipuçları, gömülü belirteç içeren otomatik oturum açma URL'si ve otomatik Control UI başlatma). Paylaşılan terminal ve CI ortamlarında kullanışlıdır.

## Akış notları

<AccordionGroup>
  <Accordion title="Akış türleri">
    - `quickstart`: en az istem, otomatik olarak bir Gateway belirteci oluşturur.
    - `manual`: bağlantı noktası, bağlama ve kimlik doğrulama için tam istemler (`advanced` diğer adı).
    - `import`: algılanan bir geçiş sağlayıcısını çalıştırır, planı önizler, ardından onaydan sonra uygular.

  </Accordion>
  <Accordion title="Sağlayıcı ön filtreleme">
    Bir kimlik doğrulama seçimi tercih edilen bir sağlayıcı ima ettiğinde, ilk kurulum varsayılan model ve izin listesi seçicilerini o sağlayıcıya önceden filtreler. Volcengine ve BytePlus için bu, kodlama planı varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`).

    Tercih edilen sağlayıcı filtresi henüz yüklenmiş model üretmezse ilk kurulum, seçiciyi boş bırakmak yerine filtrelenmemiş kataloğa geri döner.

  </Accordion>
  <Accordion title="Web araması takipleri">
    Bazı web araması sağlayıcıları, sağlayıcıya özel takip istemlerini tetikler:

    - **Grok**, aynı xAI OAuth profili veya API anahtarıyla isteğe bağlı `x_search` kurulumu ve bir `x_search` model seçimi sunabilir.
    - **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` ile `api.moonshot.cn`) ve varsayılan Kimi web araması modelini sorabilir.

  </Accordion>
  <Accordion title="Diğer davranışlar">
    - Yerel ilk kurulum DM kapsamı davranışı: [CLI kurulum başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals).
    - En hızlı ilk sohbet: `openclaw dashboard` (Control UI, kanal kurulumu yok).
    - Özel sağlayıcı: listelenmemiş barındırılan sağlayıcılar dahil, herhangi bir OpenAI veya Anthropic uyumlu uç noktaya bağlanın. Otomatik algılamak için Unknown kullanın.
    - Hermes durumu algılanırsa ilk kurulum bir geçiş akışı sunar. Dry-run planları, üzerine yazma modu, raporlar ve kesin eşlemeler için [Geçir](/tr/cli/migrate) kullanın.

  </Accordion>
</AccordionGroup>

## Yaygın takip komutları

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Aynı rehberli ilk kurulum giriş noktası olarak `openclaw setup` kullanın. Yalnızca temel yapılandırma/çalışma alanına ihtiyacınız olduğunda `openclaw setup --baseline`, hedefli değişiklikler için daha sonra `openclaw configure` ve yalnızca kanal kurulumu için `openclaw channels add` kullanın.

<Note>
`--json` etkileşimsiz mod anlamına gelmez. Betikler için `--non-interactive` kullanın.
</Note>

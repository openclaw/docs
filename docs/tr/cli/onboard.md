---
read_when:
    - Gateway, çalışma alanı, kimlik doğrulama, kanallar ve Skills için rehberli kurulum istiyorsunuz
summary: '`openclaw onboard` için CLI başvurusu (etkileşimli başlangıç yapılandırması)'
title: Başlat
x-i18n:
    generated_at: "2026-07-04T20:40:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Yerel veya uzak Gateway kurulumu için tam kılavuzlu başlangıç. OpenClaw'ın model kimlik doğrulaması, çalışma alanı, Gateway, kanallar, Skills ve sağlık durumunu tek bir akışta gezdirmesini istediğinizde bunu kullanın.

## İlgili kılavuzlar

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/tr/start/wizard" icon="rocket">
    Etkileşimli CLI akışının adım adım anlatımı.
  </Card>
  <Card title="Onboarding overview" href="/tr/start/onboarding-overview" icon="map">
    OpenClaw başlangıç sürecinin nasıl bir araya geldiği.
  </Card>
  <Card title="CLI setup reference" href="/tr/start/wizard-cli-reference" icon="book">
    Çıktılar, iç işleyiş ve adım başına davranış.
  </Card>
  <Card title="CLI automation" href="/tr/start/wizard-cli-automation" icon="terminal">
    Etkileşimsiz bayraklar ve betikli kurulumlar.
  </Card>
  <Card title="macOS app onboarding" href="/tr/start/onboarding" icon="apple">
    macOS menü çubuğu uygulaması için başlangıç akışı.
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

`--flow import`, Hermes gibi Plugin'a ait geçiş sağlayıcılarını kullanır. Yalnızca yeni bir OpenClaw kurulumu üzerinde çalışır; mevcut yapılandırma, kimlik bilgileri, oturumlar veya çalışma alanı bellek/kimlik dosyaları varsa içe aktarmadan önce sıfırlayın ya da yeni bir kurulum seçin.

`--modern`, Crestodian konuşmalı başlangıç önizlemesini başlatır. `--modern` olmadan `openclaw onboard` klasik başlangıç akışını korur.

Etkileşimli bir terminalde, çıplak `openclaw` (alt komut olmadan) yapılandırma durumuna göre yönlendirir:

- Etkin yapılandırma dosyası eksikse veya yazılmış ayar içermiyorsa (boş ya da
  yalnızca meta verili), bu klasik başlangıç akışını başlatır.
- Yapılandırma dosyası varsa ancak doğrulamadan geçemiyorsa onarım için
  [Crestodian](/tr/cli/crestodian) başlatır.
- Yapılandırma dosyası geçerliyse normal aracı TUI'yi yerel olarak veya
  erişilebilir yapılandırılmış bir Gateway'e bağlı şekilde açar. Yapılandırılmış bir kurulumda
  Crestodian'a TUI içinde `/crestodian` veya `openclaw crestodian` ile erişin.

Düz metin `ws://`, loopback, özel IP literalleri, `.local` ve Tailnet `*.ts.net` gateway URL'leri için kabul edilir. Diğer güvenilir özel DNS adları için başlangıç süreci ortamında `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın.

## Yerel ayar

Etkileşimli başlangıç, sabit kurulum metinleri için CLI sihirbazı yerel ayarını kullanır. Çözümleme sırası şöyledir:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. İngilizce yedek

Desteklenen sihirbaz yerel ayarları `en`, `zh-CN` ve `zh-TW` değerleridir. Yerel ayar değerleri `zh_CN.UTF-8` gibi alt çizgi veya POSIX son eki biçimleri kullanabilir. Ürün adları, komut adları, yapılandırma anahtarları, URL'ler, sağlayıcı kimlikleri, model kimlikleri ve Plugin/kanal etiketleri olduğu gibi kalır.

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

`--custom-api-key` etkileşimsiz modda isteğe bağlıdır. Atlanırsa başlangıç `CUSTOM_API_KEY` değerini denetler.
OpenClaw yaygın görüntü model kimliklerini otomatik olarak görüntü destekli olarak işaretler. Bilinmeyen özel görüntü kimlikleri için `--custom-image-input`, yalnızca metin meta verisini zorlamak için `--custom-text-input` geçirin.
`/v1/responses` destekleyip `/v1/chat/completions` desteklemeyen OpenAI uyumlu uç noktalar için `--custom-compatibility openai-responses` kullanın.

LM Studio ayrıca etkileşimsiz modda sağlayıcıya özgü bir anahtar bayrağını destekler:

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

`--custom-base-url` varsayılan olarak `http://127.0.0.1:11434` değerini kullanır. `--custom-model-id` isteğe bağlıdır; atlanırsa başlangıç Ollama'nın önerilen varsayılanlarını kullanır. `kimi-k2.5:cloud` gibi bulut model kimlikleri de burada çalışır.

Sağlayıcı anahtarlarını düz metin yerine başvuru olarak saklayın:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` ile başlangıç, düz metin anahtar değerleri yerine ortam destekli başvurular yazar.
Kimlik doğrulama profili destekli sağlayıcılar için bu, `keyRef` girdileri yazar; özel sağlayıcılar için `models.providers.<id>.apiKey` değerini bir ortam başvurusu olarak yazar (örneğin `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Etkileşimsiz `ref` modu sözleşmesi:

- Sağlayıcı ortam değişkenini başlangıç süreci ortamında ayarlayın (örneğin `OPENAI_API_KEY`).
- Bu ortam değişkeni de ayarlı değilse satır içi anahtar bayrakları (örneğin `--openai-api-key`) geçirmeyin.
- Gerekli ortam değişkeni olmadan satır içi anahtar bayrağı geçirilirse başlangıç, rehberlikle birlikte hızlıca başarısız olur.

Etkileşimsiz modda Gateway token seçenekleri:

- `--gateway-auth token --gateway-token <token>` düz metin token saklar.
- `--gateway-auth token --gateway-token-ref-env <name>` `gateway.auth.token` değerini bir ortam SecretRef olarak saklar.
- `--gateway-token` ve `--gateway-token-ref-env` karşılıklı olarak dışlayıcıdır.
- `--gateway-token-ref-env`, başlangıç süreci ortamında boş olmayan bir ortam değişkeni gerektirir.
- `--install-daemon` ile, token kimlik doğrulaması token gerektirdiğinde SecretRef yönetimli gateway token'ları doğrulanır ancak supervisor hizmet ortamı meta verilerinde çözümlenmiş düz metin olarak kalıcılaştırılmaz.
- `--install-daemon` ile, token modu token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa başlangıç, giderim rehberliğiyle kapalı şekilde başarısız olur.
- `--install-daemon` ile, hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa başlangıç, mod açıkça ayarlanana kadar kurulumu engeller.
- Yerel başlangıç, yapılandırmaya `gateway.mode="local"` yazar. Daha sonraki bir yapılandırma dosyasında `gateway.mode` eksikse bunu geçerli bir yerel mod kısayolu olarak değil, yapılandırma hasarı veya eksik bir manuel düzenleme olarak değerlendirin.
- Yerel başlangıç, seçilen kurulum yolu gerektirdiğinde seçili indirilebilir Plugin'leri kurar.
- Uzak başlangıç yalnızca uzak Gateway için bağlantı bilgilerini yazar ve yerel Plugin paketlerini kurmaz.
- `--allow-unconfigured` ayrı bir gateway çalışma zamanı kaçış yoludur. Bu, başlangıcın `gateway.mode` değerini atlayabileceği anlamına gelmez.

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

- `--skip-health` geçirmediğiniz sürece başlangıç, başarılı şekilde çıkmadan önce erişilebilir bir yerel gateway bekler.
- `--install-daemon` önce yönetilen gateway kurulum yolunu başlatır. Bu olmadan, örneğin `openclaw gateway run` ile halihazırda çalışan bir yerel gateway'iniz olmalıdır.
- Otomasyonda yalnızca yapılandırma/çalışma alanı/bootstrap yazımları istiyorsanız `--skip-health` kullanın.
- Çalışma alanı dosyalarını kendiniz yönetiyorsanız `agents.defaults.skipBootstrap: true` ayarlamak ve `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ve `BOOTSTRAP.md` oluşturmayı atlamak için `--skip-bootstrap` geçirin.
- Yerel Windows'ta `--install-daemon` önce Zamanlanmış Görevler'i dener ve görev oluşturma reddedilirse kullanıcı başına Başlangıç klasörü oturum açma öğesine geri döner.

Başvuru moduyla etkileşimli başlangıç davranışı:

- Sorulduğunda **Gizli başvuru kullan** seçeneğini seçin.
- Ardından şunlardan birini seçin:
  - Ortam değişkeni
  - Yapılandırılmış gizli sağlayıcı (`file` veya `exec`)
- Başlangıç, başvuruyu kaydetmeden önce hızlı bir ön doğrulama yapar.
  - Doğrulama başarısız olursa başlangıç hatayı gösterir ve yeniden denemenize izin verir.

### Etkileşimsiz Z.AI uç nokta seçimleri

<Note>
`--auth-choice zai-api-key`, anahtarınız için en iyi Z.AI uç noktasını ve modelini otomatik algılar. Coding Plan uç noktaları `zai/glm-5.2` tercih eder; genel API uç noktaları `zai/glm-5.1` kullanır. Bir Coding Plan uç noktasını zorlamak için `zai-coding-global` veya `zai-coding-cn` seçin.
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

Token tabanlı model kimlik doğrulaması (etkileşimsiz; `--auth-choice token` ile kullanılır):

- `--token-provider <id>` — Token sağlayıcı kimliği. Token'ı hangi sağlayıcının verdiğini tanımlar.
- `--token <token>` — Model kimlik doğrulaması için token değeri.
- `--token-profile-id <id>` — Kimlik doğrulama profili kimliği. Genel token depolama varsayılan olarak `<provider>:manual` kullanır; sağlayıcıya ait kurulum akışları `anthropic:default` gibi kendi varsayılanlarını kullanabilir.
- `--token-expires-in <duration>` — İsteğe bağlı token sona erme süresi (örn. `365d`, `12h`).

Cloudflare AI Gateway (etkileşimsiz):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare AI Gateway üzerinden yönlendirme için Cloudflare Hesap Kimliği.
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway Kimliği.

Daemon kurulum denetimi:

- `--no-install-daemon` — Gateway hizmeti kurulumunu açıkça atla.
- `--skip-daemon` — `--no-install-daemon` için takma ad.

UI ve hook kurulum denetimi:

- `--skip-ui` — Başlangıç sırasında Control UI / TUI istemlerini atla.
- `--skip-hooks` — Başlangıç sırasında webhook / hook kurulum istemlerini atla.

Çıktı bastırma:

- `--suppress-gateway-token-output` — Token içeren Gateway/UI çıktısını bastırır (token ipuçları, gömülü token içeren otomatik oturum açma URL'si ve otomatik Control UI başlatma). Paylaşılan terminal ve CI ortamlarında kullanışlıdır.

## Akış notları

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: en az istem, otomatik olarak bir gateway token'ı oluşturur.
    - `manual`: port, bağlama ve kimlik doğrulama için tam istemler (`advanced` takma adı).
    - `import`: algılanan bir geçiş sağlayıcısını çalıştırır, planı önizler, ardından onaydan sonra uygular.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Bir kimlik doğrulama seçimi tercih edilen bir sağlayıcı ima ettiğinde başlangıç, varsayılan model ve izin listesi seçicilerini bu sağlayıcıya göre önceden filtreler. Volcengine ve BytePlus için bu, coding-plan varyantlarıyla da eşleşir (`volcengine-plan/*`, `byteplus-plan/*`).

    Tercih edilen sağlayıcı filtresi henüz yüklü model döndürmezse başlangıç, seçiciyi boş bırakmak yerine filtresiz kataloğa geri döner.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Bazı web arama sağlayıcıları, sağlayıcıya özgü takip istemlerini tetikler:

    - **Grok**, aynı xAI OAuth profili veya API anahtarı ve bir `x_search` model seçimiyle isteğe bağlı `x_search` kurulumu sunabilir.
    - **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` veya `api.moonshot.cn`) ve varsayılan Kimi web arama modelini sorabilir.

  </Accordion>
  <Accordion title="Other behaviors">
    - Yerel başlangıç DM kapsamı davranışı: [CLI kurulum başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals).
    - En hızlı ilk sohbet: `openclaw dashboard` (Control UI, kanal kurulumu yok).
    - Özel sağlayıcı: listelenmeyen barındırılan sağlayıcılar dahil, herhangi bir OpenAI veya Anthropic uyumlu uç noktaya bağlanın. Otomatik algılama için Unknown kullanın.
    - Hermes durumu algılanırsa başlangıç bir geçiş akışı sunar. Deneme çalıştırması planları, üzerine yazma modu, raporlar ve kesin eşlemeler için [Migrate](/tr/cli/migrate) kullanın.

  </Accordion>
</AccordionGroup>

## Yaygın takip komutları

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Aynı yönlendirmeli ilk kurulum giriş noktası olarak `openclaw setup` kullanın. Yalnızca temel yapılandırma/çalışma alanına ihtiyacınız olduğunda `openclaw setup --baseline`, daha sonra hedefli değişiklikler için `openclaw configure` ve yalnızca kanal kurulumu için `openclaw channels add` kullanın.

<Note>
`--json` etkileşimsiz modu ifade etmez. Betikler için `--non-interactive` kullanın.
</Note>

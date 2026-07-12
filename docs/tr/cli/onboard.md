---
read_when:
    - Çıkarım altyapısını kurmak, ardından kurulumu Crestodian ile tamamlamak istiyorsunuz
summary: '`openclaw onboard` için CLI başvurusu (etkileşimli ilk kurulum)'
title: İlk Kurulum
x-i18n:
    generated_at: "2026-07-12T12:10:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Önce çıkarımı kuran yönlendirmeli yapılandırma: mevcut yapay zekâ erişimini algılar,
canlı bir tamamlama gerektirir, yalnızca çalışan rotayı kalıcı hâle getirir ve ardından
geri kalanını yapılandırmak için Crestodian'ı başlatır. `openclaw setup` aynı giriş
noktasıdır; `openclaw setup --baseline` yalnızca temel yapılandırmayı/çalışma alanını yazar.

<CardGroup cols={2}>
  <Card title="CLI ilk katılım merkezi" href="/tr/start/wizard" icon="rocket">
    Etkileşimli CLI akışının adım adım açıklaması.
  </Card>
  <Card title="İlk katılıma genel bakış" href="/tr/start/onboarding-overview" icon="map">
    OpenClaw ilk katılım bileşenlerinin birlikte nasıl çalıştığı.
  </Card>
  <Card title="CLI yapılandırma başvurusu" href="/tr/start/wizard-cli-reference" icon="book">
    Çıktılar, iç işleyiş ve her adımdaki davranış.
  </Card>
  <Card title="CLI otomasyonu" href="/tr/start/wizard-cli-automation" icon="terminal">
    Etkileşimsiz bayraklar ve betik tabanlı yapılandırmalar.
  </Card>
  <Card title="macOS uygulaması ilk katılımı" href="/tr/start/onboarding" icon="apple">
    macOS menü çubuğu uygulamasının ilk katılım akışı.
  </Card>
</CardGroup>

## Örnekler

```bash
openclaw onboard
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`: adım adım ilerleyen tam sihirbazı açar. `--non-interactive` ile
  birlikte kullanılamaz; otomatik yapılandırma için `--classic` seçeneğini kullanmayın.
- `--flow quickstart`: klasik sihirbazı en az sayıda istemle açar ve
  otomatik olarak bir gateway belirteci oluşturur.
- `--flow manual` (`advanced` diğer adıyla): klasik sihirbazı bağlantı noktası,
  bağlama ve kimlik doğrulama için tüm istemlerle açar.
- `--flow import`: algılanan bir geçiş sağlayıcısını çalıştırır (örneğin `--import-from hermes` aracılığıyla Hermes), planın önizlemesini gösterir ve onaydan sonra uygular. İçe aktarma yalnızca yeni bir OpenClaw yapılandırmasında çalışır; varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanı durumunu sıfırlayın. Deneme çalıştırması planları, üzerine yazma modu, raporlar ve tam eşlemeler için [`openclaw migrate`](/tr/cli/migrate) kullanın.
- `--modern`, Crestodian konuşma tabanlı yapılandırma yardımcısının uyumluluk
  diğer adıdır. `openclaw crestodian` ile aynı canlı çıkarım geçidini kullanır ve
  yalnızca `--workspace`, `--accept-risk`,
  `--non-interactive` ve `--json` seçeneklerini kabul eder. Diğer yapılandırma bayrakları
  sessizce yok sayılmak yerine reddedilir.

## Yönlendirmeli akış

Düz `openclaw onboard`, yönlendirmeli akışı başlatır. Güvenlik bildirimini gösterir;
yapılandırılmış modeller, API anahtarı ortam değişkenleri ve desteklenen yerel
CLI'lar üzerinden hâlihazırda kullanılabilen yapay zekâ erişimini algılar, ardından
önerilen adayı gerçek bir tamamlamayla test eder. Bu aday başarısız olursa ilk
katılım nedenini gösterir ve otomatik olarak sonraki kullanılabilir adayı dener.

Otomatik algılama seçenekleri tükendiğinde algılanan başka bir adayı seçin veya
maskeli bir istemde sağlayıcı API anahtarı girin. El ile girilen anahtar aynı
canlı tamamlama yolu üzerinden test edilir. Yönlendirmeli ilk katılım, bir aday
başarılı olana kadar Crestodian'ı veya yapay zekâyı atlayarak çıkma seçeneğini
sunmaz. OpenClaw yalnızca test başarılı olduktan sonra doğrulanmış model rotasını
ve kimlik bilgisini kalıcı hâle getirir; başarısız bir aday yapılandırılmış modelin
yerini almaz veya denenen kimlik bilgisini kaydetmez. Çalışma alanı ve Gateway
yapılandırması, Crestodian başlatılana kadar değişmeden kalır.

Yönlendirmeli modda `--workspace <dir>`, Crestodian'ın önerilen çalışma alanını
ve yalıtılmış çıkarım bağlamını sağlar. Crestodian yapılandırma önerisini
onaylayana kadar kalıcı hâle getirilmez. Klasik ve etkileşimsiz ilk katılım,
çalışma alanlarını normal yapılandırma akışları üzerinden kalıcı hâle getirir.

Çıkarım başarılı olduktan sonra yönlendirmeli ilk katılım, doğrulanmış modelle
Crestodian'ı hemen başlatır. Crestodian daha sonra çalışma alanını, Gateway'i,
kanalları, aracıları, pluginleri ve diğer isteğe bağlı özellikleri yapılandırabilir.
Crestodian içinde kanal kimlik bilgilerini maskeli bir terminal sihirbazına
devretmek için `open channel wizard for <channel>` kullanın. Model sağlayıcısını
veya kimlik doğrulamasını değiştirmek için Crestodian'dan çıkıp `openclaw onboard`
komutunu çalıştırın; Crestodian yönlendirmeli veya klasik sağlayıcı akışlarını açmaz.

Yapılandırılmış bir kurulumda `openclaw onboard` komutunu yeniden çalıştırmak önce
geçerli varsayılan modeli doğrular; böylece aynı akış bir doğrulama ve onarım
geçişi işlevi görür. Bu denetim başarısız olursa yapılandırılmış model hiçbir zaman
otomatik olarak değiştirilmez — ilk katılım durur ve nasıl devam edileceğini sorar.
Denetim çalışma alanınızın dışında çalıştığından, çalışma alanı plugini tarafından
sağlanan bir model burada başarısız olurken aracı içinde çalışmaya devam edebilir.
Sağlayıcıya özgü kimlik doğrulama, kanallar, Skills, uzak Gateway yapılandırması,
içe aktarmalar veya tüm Gateway denetimleri için `openclaw onboard --classic`
kullanın. Çıkarım dışındaki konuşma tabanlı yapılandırma ve onarım için
`openclaw crestodian` komutunu çalıştırın; `openclaw onboard --modern`, aynı
çıkarım geçidi üzerinden çalışan bir uyumluluk diğer adıdır. Klasik sihirbaz,
varsayılan modeli isteğe bağlı olarak canlı bir tamamlamayla doğrulayabilir; ancak
Crestodian kendi canlı çıkarım denetimi başarılı olana kadar başlatılmaz.

Etkileşimli bir terminalde alt komut olmadan kullanılan düz `openclaw`, yapılandırma
durumuna göre yönlendirilir:

- Etkin yapılandırma dosyası eksikse veya kullanıcı tarafından yazılmış ayar
  içermiyorsa (boşsa ya da yalnızca meta veri içeriyorsa), yönlendirmeli ilk
  katılımı başlatır.
- Yapılandırma dosyası mevcut ancak doğrulamadan geçemiyorsa `openclaw doctor`
  yönlendirmesiyle klasik ilk katılım yolunu başlatır. Crestodian çalışan bir
  çıkarım gerektirir ve çıkarım öncesindeki bu durumu onarmak için kullanılmaz.
- Yapılandırma dosyası geçerliyse normal aracı TUI'sini açar. Bir aracı ve modeli
  bulunan, erişilebilir ve yapılandırılmış bir Gateway; ilk katılım veya Crestodian
  olmadan doğrudan bu arayüze gider. Yapılandırılmış bir kurulumda Crestodian'a
  TUI içindeki `/crestodian` veya `openclaw crestodian` ile erişin.

Düz metin `ws://`; local loopback, özel IP değişmezleri, `.local` ve Tailnet `*.ts.net` gateway URL'leri için kabul edilir. Güvenilen diğer özel DNS adları için ilk katılım işleminin ortamında `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın.

## Sıfırlama

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset`, yapılandırmayı çalıştırmadan önce durumu siler. `--reset-scope` ne
kadarının silineceğini belirler: `config` (yalnızca yapılandırma),
`config+creds+sessions` (`--reset` kapsam belirtilmeden geçirildiğinde varsayılan)
veya `full` (çalışma alanını da sıfırlar). Çalışma alanı yalnızca
`--reset-scope full` ile sıfırlanır.

## Yerel ayar

Etkileşimli ilk katılım, sabit yapılandırma metinleri için CLI sihirbazının yerel
ayarını kullanır. Çözümleme sırası:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. İngilizceye geri dönüş

Desteklenen sihirbaz yerel ayarları `en`, `zh-CN` ve `zh-TW` değerleridir. Yerel
ayar değerleri, `zh_CN.UTF-8` gibi alt çizgi veya POSIX son eki biçimlerini
kullanabilir. Ürün adları, komut adları, yapılandırma anahtarları, URL'ler,
sağlayıcı kimlikleri, model kimlikleri ve plugin/kanal etiketleri değişmeden kalır.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## Etkileşimsiz yapılandırma

`--non-interactive`, `--accept-risk` seçeneğini gerektirir (aracıların güçlü
olduğunu ve tam sistem erişiminin riskli olduğunu kabul eder). `--mode`
varsayılan olarak `local` değerini kullanır.

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

`--custom-api-key` isteğe bağlıdır; belirtilmezse ilk katılım ortamdaki
`CUSTOM_API_KEY` değerini denetler. OpenClaw, yaygın görsel model kimliklerini
(GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral ve benzerleri)
otomatik olarak görüntü destekli şeklinde işaretler. Bilinmeyen özel görsel model
kimlikleri için `--custom-image-input`, meta verileri yalnızca metinle sınırlamak
içinse `--custom-text-input` geçirin. `/v1/responses` destekleyen ancak
`/v1/chat/completions` desteklemeyen OpenAI uyumlu uç noktalar için
`--custom-compatibility openai-responses` kullanın; geçerli değerler `openai`
(varsayılan), `openai-responses` ve `anthropic` değerleridir.

LM Studio ayrıca sağlayıcıya özgü bir anahtar bayrağına sahiptir:

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

`--custom-base-url` varsayılan olarak `http://127.0.0.1:11434` değerini kullanır.
`--custom-model-id` isteğe bağlıdır; belirtilmezse ilk katılım Ollama'nın önerilen
varsayılanlarını kullanır. `kimi-k2.5:cloud` gibi bulut model kimlikleri de burada çalışır.

Sağlayıcı anahtarlarını düz metin yerine başvuru olarak saklayın:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` kullanıldığında ilk katılım, düz metin anahtar değerleri
yerine ortam destekli başvurular yazar: kimlik doğrulama profili destekli sağlayıcılar
için `keyRef: { source: "env", provider: "default", id: <envVar> }` yazar; özel
sağlayıcılar için `models.providers.<id>.apiKey` değerini aynı şekilde yazar
(örneğin `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Sözleşme:
sağlayıcı ortam değişkenini ilk katılım işleminin ortamında ayarlayın (örneğin
`OPENAI_API_KEY`) ve bu ortam değişkeni ayarlı değilse satır içi anahtar bayrağını
ayrıca geçirmeyin; eşleşen ortam değişkeni olmadan verilen bir bayrak değeri,
yönlendirme göstererek hemen başarısız olur.

### Gateway kimlik doğrulaması (etkileşimsiz)

- `--gateway-auth token --gateway-token <token>` düz metin bir belirteç saklar. `token` varsayılan kimlik doğrulama modudur.
- `--gateway-auth token --gateway-token-ref-env <name>`, `gateway.auth.token` değerini bir ortam SecretRef'i olarak saklar. İlk katılım işleminin ortamında bu ada sahip, boş olmayan bir ortam değişkeni gerektirir.
- `--gateway-token` ile `--gateway-token-ref-env` birbirini dışlar.
- `--install-daemon` ile: SecretRef tarafından yönetilen bir `gateway.auth.token` doğrulanır ancak çözümlenmiş düz metin olarak gözetmen hizmeti ortamı meta verilerinde kalıcı hâle getirilmez; başvuru çözümlenemezse kurulum, düzeltme yönlendirmesiyle güvenli biçimde başarısız olur. Hem `gateway.auth.token` hem `gateway.auth.password` yapılandırılmış ve `gateway.auth.mode` ayarlanmamışsa mod açıkça ayarlanana kadar kurulum engellenir.
- Yerel ilk katılım, yapılandırmaya `gateway.mode="local"` yazar. Daha sonra `gateway.mode` içermeyen bir yapılandırma dosyası, geçerli bir yerel mod kısayolunu değil, yapılandırma hasarını veya tamamlanmamış bir el ile düzenlemeyi gösterir.
- Yerel ilk katılım, seçilen yapılandırma yolunun gerektirdiği indirilebilir pluginleri kurar (örneğin bu kimlik doğrulama seçenekleri için Codex veya Copilot çalışma zamanı plugini). Uzak ilk katılım yalnızca uzak Gateway'in bağlantı bilgilerini yazar; yerel plugin paketlerini hiçbir zaman kurmaz.
- `--allow-unconfigured`, ayrı bir `openclaw gateway run` kaçış seçeneğidir; ilk katılımın `gateway.mode` ayarını atlamasına izin vermez.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### Yerel gateway durumu

- `--skip-health` geçirmediğiniz sürece ilk katılım başarıyla çıkmadan önce erişilebilir bir yerel gateway bekler.
- `--install-daemon`, önce yönetilen gateway kurulum yolunu başlatır. Bu seçenek olmadan yerel bir gateway'in zaten çalışıyor olması gerekir (örneğin `openclaw gateway run`).
- Otomasyonda yalnızca yapılandırma/çalışma alanı/başlangıç hazırlığı yazımlarını istiyorsanız `--skip-health` beklemeyi atlar.
- `--skip-bootstrap`, `agents.defaults.skipBootstrap: true` ayarını yapar ve `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ve `BOOTSTRAP.md` dosyalarının oluşturulmasını atlar.
- Yerel Windows'ta `--install-daemon` önce Scheduled Tasks seçeneğini dener; görev oluşturma reddedilirse kullanıcı başına Startup-folder oturum açma öğesine geri döner.

### Etkileşimli başvuru modu

- İstendiğinde **Gizli bilgi başvurusu kullan** seçeneğini, ardından **Ortam değişkeni** veya yapılandırılmış bir gizli bilgi sağlayıcısını (`file` ya da `exec`) seçin.
- İlk katılım, başvuruyu kaydetmeden önce hızlı bir ön kontrol doğrulaması çalıştırır ve başarısızlık durumunda yeniden denemenize izin verir.

### Z.AI uç nokta seçenekleri

<Note>
`--auth-choice zai-api-key`, anahtarınız için en iyi Z.AI uç noktasını ve modelini otomatik olarak algılar: Coding Plan uç noktaları `zai/glm-5.2` modelini tercih eder (kullanılamıyorsa `glm-5.1` modeline geri döner); genel API uç noktaları varsayılan olarak `zai/glm-5.1` kullanır. Bir Coding Plan uç noktasını zorunlu kılmak için doğrudan `zai-coding-global` veya `zai-coding-cn` seçin.
</Note>

```bash
# İstemsiz uç nokta seçimi
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Diğer Z.AI uç noktası seçenekleri: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Etkileşimsiz kullanım için ek bayraklar

Token tabanlı model kimlik doğrulaması (`--auth-choice token` ile kullanılır):

| Bayrak                          | Açıklama                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | Tokenı veren token sağlayıcısının kimliği                                                                                             |
| `--token <token>`               | Model kimlik doğrulaması için token değeri                                                                                            |
| `--token-profile-id <id>`       | Kimlik doğrulama profili kimliği (varsayılan `<provider>:manual`; sağlayıcıya ait bazı akışlar `anthropic:default` gibi kendi varsayılanlarını kullanır) |
| `--token-expires-in <duration>` | İsteğe bağlı token geçerlilik süresi (ör. `365d`, `12h`)                                                                               |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Arka plan hizmeti kurulum denetimi: `--no-install-daemon` / `--skip-daemon` (takma adlar; Gateway hizmeti kurulumunu atlar), `--daemon-runtime <node|bun>`.

Skills: `--node-manager <npm|pnpm|bun>` (varsayılan `npm`), `--skip-skills`.

Kullanıcı arayüzü ve kanca kurulumu: `--skip-ui` (Control UI/TUI istemlerini atlar), `--skip-hooks` (Webhook/kanca kurulumunu atlar), `--skip-channels`, `--skip-search`.

Çıktı: `--suppress-gateway-token-output`, token içeren Gateway/kullanıcı arayüzü çıktısını (token ipuçları, gömülü token içeren otomatik oturum açma URL'si ve Control UI'ın otomatik başlatılması) gizler; paylaşılan terminallerde ve CI ortamlarında kullanışlıdır.

<Note>
`--json`, yönlendirmeli veya klasik ilk kurulumda etkileşimsiz modu etkinleştirmez.
`--modern` ile JSON, tek seferlik bir Crestodian genel görünümüdür ve bu tek
sonuçtan sonra çıkar. Diğer betikler için `--non-interactive` kullanın.
</Note>

## Sağlayıcı ön filtrelemesi

Bir kimlik doğrulama seçeneği tercih edilen bir sağlayıcıyı belirtiyorsa ilk kurulum, varsayılan model ve izin listesi seçicilerini bu sağlayıcının modellerine göre önceden filtreler. Filtre, aynı Plugin'e ait diğer sağlayıcılarla da eşleşir; bu, `volcengine`/`volcengine-plan` ve `byteplus`/`byteplus-plan` gibi kodlama planı çeşitlerini kapsar. Tercih edilen sağlayıcı filtresi yüklenmiş hiçbir model döndürmezse ilk kurulum, seçiciyi boş bırakmak yerine filtrelenmemiş kataloğa geri döner.

## Web araması takip adımları

Bazı web araması sağlayıcıları ilk kurulum sırasında sağlayıcıya özgü takip istemlerini tetikler:

- **Grok**, aynı xAI kimlik doğrulamasıyla isteğe bağlı `x_search` kurulumu ve bir `x_search` model seçeneği sunabilir.
- **Kimi**, Moonshot API bölgesini (`api.moonshot.ai` veya `api.moonshot.cn`) ve varsayılan Kimi web araması modelini sorabilir.

## Diğer davranışlar

- Yerel ilk kurulumun DM kapsamı davranışı: [CLI kurulum başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals).
- En hızlı ilk sohbet: `openclaw dashboard` (Control UI, kanal kurulumu yok).
- Özel sağlayıcı: Listelenmeyen barındırılan sağlayıcılar dâhil, OpenAI veya Anthropic uyumlu herhangi bir uç noktayı bağlayın. Canlı bir yoklamayla otomatik algılama için **Bilinmeyen** uyumluluğunu kullanın.
- Hermes durumu algılanırsa ilk kurulum bir taşıma akışı sunar (yukarıdaki `--flow import` seçeneğine bakın).

## Yaygın takip komutları

Daha sonra çıkarım dışı hedefli değişiklikler için `openclaw configure`, yalnızca
kanal kurulumu için `openclaw channels add` kullanın. Model sağlayıcısı veya kimlik
doğrulama yolu değişiklikleri için bunun yerine `openclaw onboard` komutunu çalıştırın.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

---
read_when:
    - QA yığınının nasıl bir araya geldiğini anlamak
    - qa-lab, qa-channel veya bir taşıma adaptörünü genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu için daha gerçekçi QA otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, depo destekli senaryolar, canlı taşıma hatları, taşıma bağdaştırıcıları ve raporlama.'
title: QA genel bakışı
x-i18n:
    generated_at: "2026-05-02T20:44:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw'ı tek bir birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak için tasarlanmıştır.

Geçerli parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veri yolu.
- `extensions/qa-matrix`, gelecekteki çalıştırıcı pluginleri: alt QA gateway içinde
  gerçek bir kanalı süren canlı taşıma adaptörleri.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için repo destekli seed varlıkları.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Birçoğunun `pnpm qa:*`
betik takma adları vardır; iki biçim de desteklenir.

| Komut                                               | Amaç                                                                                                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Paketlenmiş QA öz denetimi; Markdown raporu yazar.                                                                                                                    |
| `qa suite`                                          | Repo destekli senaryoları QA gateway kulvarına karşı çalıştırır. Takma adlar: tek kullanımlık Linux VM için `pnpm openclaw qa suite --runner multipass`.              |
| `qa coverage`                                       | Markdown senaryo kapsamı envanterini yazdırır (makine çıktısı için `--json`).                                                                                         |
| `qa parity-report`                                  | İki `qa-suite-summary.json` dosyasını karşılaştırır ve ajanik parite raporunu yazar.                                                                                  |
| `qa character-eval`                                 | Karakter QA senaryosunu, hakemli bir raporla birden çok canlı modelde çalıştırır. Bkz. [Raporlama](#reporting).                                                       |
| `qa manual`                                         | Seçilen sağlayıcı/model kulvarına karşı tek seferlik bir istem çalıştırır.                                                                                            |
| `qa ui`                                             | QA hata ayıklayıcı UI'sini ve yerel QA veri yolunu başlatır (takma ad: `pnpm qa:lab:ui`).                                                                             |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını derler.                                                                                                                         |
| `qa docker-scaffold`                                | QA panosu + gateway kulvarı için bir docker-compose iskeleti yazar.                                                                                                   |
| `qa up`                                             | QA sitesini derler, Docker destekli yığını başlatır, URL'yi yazdırır (takma ad: `pnpm qa:lab:up`; `:fast` varyantı `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler). |
| `qa aimock`                                         | Yalnızca AIMock sağlayıcı sunucusunu başlatır.                                                                                                                        |
| `qa mock-openai`                                    | Yalnızca senaryo farkındalıklı `mock-openai` sağlayıcı sunucusunu başlatır.                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetir.                                                                                                                    |
| `qa matrix`                                         | Tek kullanımlık bir Tuwunel ana sunucusuna karşı canlı taşıma kulvarı. Bkz. [Matrix QA](/tr/concepts/qa-matrix).                                                        |
| `qa telegram`                                       | Gerçek bir özel Telegram grubuna karşı canlı taşıma kulvarı.                                                                                                          |
| `qa discord`                                        | Gerçek bir özel Discord guild kanalına karşı canlı taşıma kulvarı.                                                                                                    |

## Operatör akışı

Geçerli QA operatör akışı iki bölmeli bir QA sitesidir:

- Sol: ajanla birlikte Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway kulvarını başlatır ve
bir operatörün veya otomasyon döngüsünün ajana bir QA görevi verebileceği,
gerçek kanal davranışını gözlemleyebileceği ve neyin çalıştığını, başarısız
olduğunu veya engelli kaldığını kaydedebileceği QA Lab sayfasını açığa çıkarır.

Her seferinde Docker imajını yeniden derlemeden daha hızlı QA Lab UI yinelemesi için,
bind mount edilmiş bir QA Lab paketiyle yığını başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden derlenmiş bir imajda tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` container'ına bind-mount eder. `qa:lab:watch`
bu paketi değişiklikte yeniden derler ve QA Lab varlık hash'i değiştiğinde tarayıcı otomatik yeniden yüklenir.

Yerel bir OpenTelemetry iz duman testi için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu betik yerel bir OTLP/HTTP iz alıcısı başlatır,
`diagnostics-otel` plugini etkin halde `otel-trace-smoke` QA senaryosunu çalıştırır, ardından
dışa aktarılan protobuf span'lerini çözer ve yayın açısından kritik şekli doğrular:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` ve `openclaw.message.delivery` mevcut olmalıdır;
model çağrıları başarılı turlarda `StreamAbandoned` dışa aktarmamalıdır; ham tanılama ID'leri ve
`openclaw.content.*` öznitelikleri izin dışında kalmalıdır. QA paket artefaktlarının yanına
`otel-smoke-summary.json` yazar.

Gözlemlenebilirlik QA'sı yalnızca kaynak checkout'unda kalır. npm tarball'ı bilinçli olarak
QA Lab'i dışarıda bırakır, bu yüzden paket Docker yayın kulvarları `qa` komutlarını çalıştırmaz.
Tanılama enstrümantasyonunu değiştirirken derlenmiş bir kaynak checkout'undan
`pnpm qa:otel:smoke` kullanın.

Taşıması gerçek Matrix duman testi kulvarı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Bu kulvar için tam CLI referansı, profil/senaryo kataloğu, env değişkenleri ve artefakt yerleşimi [Matrix QA](/tr/concepts/qa-matrix) içinde bulunur. Kısaca: Docker içinde tek kullanımlık bir Tuwunel ana sunucusu hazırlar, geçici sürücü/SUT/gözlemci kullanıcıları kaydeder, gerçek Matrix pluginini o taşımaya kapsamlanmış bir alt QA gateway içinde çalıştırır (`qa-channel` yok), ardından `.artifacts/qa-e2e/matrix-<timestamp>/` altında bir Markdown raporu, JSON özeti, gözlemlenen olaylar artefaktı ve birleştirilmiş çıktı günlüğü yazar.

Taşıması gerçek Telegram ve Discord duman testi kulvarları için:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

İkisi de iki botu (sürücü + SUT) olan önceden var olan gerçek bir kanalı hedefler. Gerekli env değişkenleri, senaryo listeleri, çıktı artefaktları ve Convex kimlik bilgisi havuzu aşağıdaki [Telegram ve Discord QA referansı](#telegram-and-discord-qa-reference) içinde belgelenmiştir.

Havuzlanmış canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex broker env'ini denetler, endpoint ayarlarını doğrular ve maintainer secret mevcut olduğunda admin/liste erişilebilirliğini doğrular. Secret'lar için yalnızca ayarlı/eksik durumunu raporlar.

## Canlı taşıma kapsamı

Canlı taşıma kulvarları, her birinin kendi senaryo listesi şeklini icat etmesi yerine tek bir sözleşme paylaşır. `qa-channel`, geniş sentetik ürün davranışı paketidir ve canlı taşıma kapsam matrisinin parçası değildir.

| Kulvar   | Canary | Bahsetme geçidi | Bot-bota | Allowlist engeli | Üst düzey yanıt | Yeniden başlatma sürdürme | İş parçacığı takibi | İş parçacığı izolasyonu | Tepki gözlemi | Yardım komutu | Yerel komut kaydı |
| -------- | ------ | --------------- | -------- | ---------------- | --------------- | ------------------------- | ------------------- | ----------------------- | ------------- | ------------- | ----------------- |
| Matrix   | x      | x               | x        | x                | x               | x                         | x                   | x                       | x             |               |                   |
| Telegram | x      | x               | x        |                  |                 |                           |                     |                         |               | x             |                   |
| Discord  | x      | x               | x        |                  |                 |                           |                     |                         |               |               | x                 |

Bu, `qa-channel`ı geniş ürün davranışı paketi olarak tutarken Matrix,
Telegram ve gelecekteki canlı taşımaların tek bir açık taşıma sözleşmesi
kontrol listesini paylaşmasını sağlar.

QA yoluna Docker eklemeden tek kullanımlık bir Linux VM kulvarı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass konuğunu başlatır, bağımlılıkları yükler, konuğun içinde OpenClaw'ı
derler, `qa suite` çalıştırır, ardından normal QA raporunu ve
özeti ana makinedeki `.artifacts/qa-e2e/...` içine geri kopyalar.
Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır.
Ana makine ve Multipass paket çalıştırmaları, seçilen birden çok senaryoyu varsayılan olarak
izole gateway çalışanlarıyla paralel yürütür. `qa-channel` varsayılan olarak eşzamanlılık
4 kullanır ve bu, seçilen senaryo sayısıyla sınırlandırılır. Çalışan sayısını ayarlamak için
`--concurrency <count>` kullanın veya seri yürütme için `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan
artefakt istiyorsanız `--allow-failures` kullanın.
Canlı çalıştırmalar, konuk için pratik olan desteklenen QA auth girdilerini iletir:
env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve
mevcut olduğunda `CODEX_HOME`. Konuğun mount edilmiş çalışma alanı üzerinden
geri yazabilmesi için `--output-dir` değerini repo kökünün altında tutun.

## Telegram ve Discord QA referansı

Matrix'in senaryo sayısı ve Docker destekli ana sunucu hazırlaması nedeniyle [özel bir sayfası](/tr/concepts/qa-matrix) vardır. Telegram ve Discord daha küçüktür: her birinde birkaç senaryo, profil sistemi yok, önceden var olan gerçek kanallara karşı çalışır; bu nedenle referansları burada bulunur.

### Paylaşılan CLI bayrakları

İki kulvar da `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` üzerinden kaydolur ve aynı bayrakları kabul eder:

| Bayrak                                | Varsayılan                                               | Açıklama                                                                                                                |
| ------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Yalnızca bu senaryoyu çalıştırır. Tekrarlanabilir.                                                                      |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Raporların/özetin/gözlemlenen iletilerin ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` üzerinden çözülür. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Nötr bir cwd üzerinden çağırırken depo kökü.                                                                             |
| `--sut-account <id>`                  | `sut`                                                     | QA gateway yapılandırması içindeki geçici hesap kimliği.                                                                 |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` veya `live-frontier` (eski `live-openai` hâlâ çalışır).                                                    |
| `--model <ref>` / `--alt-model <ref>` | sağlayıcı varsayılanı                                    | Birincil/alternatif model referansları.                                                                                  |
| `--fast`                              | kapalı                                                    | Desteklendiği yerlerde sağlayıcı hızlı modu.                                                                             |
| `--credential-source <env\|convex>`   | `env`                                                     | Bkz. [Convex kimlik bilgisi havuzu](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | CI'da `ci`, aksi halde `maintainer`                       | `--credential-source convex` kullanıldığında kullanılan rol.                                                             |

Herhangi bir senaryo başarısız olursa ikisi de sıfır olmayan çıkış koduyla çıkar. `--allow-failures`, başarısız çıkış kodu ayarlamadan yapıtları yazar.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

İki ayrı botun (sürücü + SUT) bulunduğu tek bir gerçek özel Telegram grubunu hedefler. SUT botunun bir Telegram kullanıcı adı olmalıdır; botlar arası gözlem, her iki botta da `@BotFather` içinde **Bot-to-Bot Communication Mode** etkinleştirildiğinde en iyi çalışır.

`--credential-source env` kullanıldığında gerekli env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — sayısal sohbet kimliği (dize).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`, gözlemlenen ileti yapıtlarında ileti gövdelerini tutar (varsayılan olarak gizlenir).

Senaryolar (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Çıktı yapıtları:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — canary ile başlayarak yanıt başına RTT'yi (sürücü gönderimi → gözlemlenen SUT yanıtı) içerir.
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` olmadığı sürece gövdeler gizlenir.

### Discord QA

```bash
pnpm openclaw qa discord
```

İki botun bulunduğu tek bir gerçek özel Discord sunucu kanalını hedefler: harness tarafından kontrol edilen bir sürücü botu ve paketle gelen Discord Plugin üzerinden alt OpenClaw gateway tarafından başlatılan bir SUT botu. Kanal bahsi işlemeyi ve SUT botunun Discord ile yerel `/help` komutunu kaydetmiş olduğunu doğrular.

`--credential-source env` kullanıldığında gerekli env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord tarafından döndürülen SUT bot kullanıcı kimliğiyle eşleşmelidir (aksi halde hat hızlıca başarısız olur).

İsteğe bağlı:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`, gözlemlenen ileti yapıtlarında ileti gövdelerini tutar.

Senaryolar (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Çıktı yapıtları:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` olmadığı sürece gövdeler gizlenir.

### Convex kimlik bilgisi havuzu

Hem Telegram hem de Discord hatları, yukarıdaki env değişkenlerini okumak yerine paylaşılan bir Convex havuzundan kimlik bilgisi kiralayabilir. `--credential-source convex` iletin (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın); QA Lab özel bir kiralama alır, çalışma süresi boyunca ona Heartbeat gönderir ve kapanışta serbest bırakır. Havuz türleri `"telegram"` ve `"discord"` değerleridir.

Aracının `admin/add` üzerinde doğruladığı yük biçimleri:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` sayısal bir sohbet kimliği dizesi olmalıdır.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operasyonel env değişkenleri ve Convex aracı uç noktası sözleşmesi [Testing → Convex üzerinden paylaşılan Telegram kimlik bilgileri](/tr/help/testing#shared-telegram-credentials-via-convex-v1) içinde bulunur (bölüm adı Discord desteğinden önce verilmiştir; aracı semantiği iki tür için de aynıdır).

## Depo destekli seed'ler

Seed varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar özellikle git içinde tutulur; böylece QA planı hem insanlar hem de
agent tarafından görülebilir.

`qa-lab` genel bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası
tek bir test çalıştırması için doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo meta verileri
- isteğe bağlı kategori, yetenek, hat ve risk meta verileri
- doküman ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı gateway yapılandırma yaması
- çalıştırılabilir `qa-flow`

`qa-flow` arkasındaki yeniden kullanılabilir çalışma zamanı yüzeyinin genel
ve kesişen kalmasına izin verilir. Örneğin markdown senaryoları, Gateway
`browser.request` geçidi üzerinden gömülü Control UI'ı süren tarayıcı tarafı
yardımcılarla taşıma tarafı yardımcıları birleştirebilir; bunun için özel durum çalıştırıcısı eklenmez.

Senaryo dosyaları kaynak ağacı klasörüne göre değil, ürün yeteneğine göre gruplanmalıdır.
Dosyalar taşındığında senaryo kimliklerini kararlı tutun; uygulama izlenebilirliği için `docsRefs` ve `codeRefs`
kullanın.

Temel liste şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- iş parçacığı davranışı
- ileti eylemi yaşam döngüsü
- Cron geri çağrıları
- bellek geri çağırma
- model değiştirme
- alt agent devri
- depo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı mock hatları

`qa suite` iki yerel sağlayıcı mock hattına sahiptir:

- `mock-openai`, senaryo farkındalığı olan OpenClaw mock'udur. Depo destekli QA ve parite kapıları için varsayılan
  deterministik mock hattı olmaya devam eder.
- `aimock`, deneysel protokol, fixture, kaydet/yeniden oynat ve kaos kapsaması için AIMock destekli bir sağlayıcı sunucusu başlatır.
  Bu eklidir ve `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında bulunur.
Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlatmasına, gateway model yapılandırmasına,
auth-profile hazırlama gereksinimlerine ve canlı/mock yetenek bayraklarına sahip olur. Paylaşılan suite ve
gateway kodu sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirme yapmalıdır.

## Taşıma adapter'ları

`qa-lab`, markdown QA senaryoları için genel bir taşıma geçidine sahiptir. `qa-channel` bu geçitteki ilk adapter'dır, ancak tasarım hedefi daha geniştir: gelecekteki gerçek veya sentetik kanallar, taşıma özelinde bir QA çalıştırıcısı eklemek yerine aynı suite çalıştırıcısına takılmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütmeyi, worker eşzamanlılığını, yapıt yazmayı ve raporlamayı sahiplenir.
- Taşıma adapter'ı gateway yapılandırmasını, hazır olma durumunu, gelen ve giden gözlemi, taşıma eylemlerini ve normalleştirilmiş taşıma durumunu sahiplenir.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

### Kanal ekleme

Markdown QA sistemine kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma adapter'ı.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` ana makinesi akışı sahiplenebildiğinde yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab` paylaşılan ana makine mekaniklerini sahiplenir:

- `openclaw qa` komut kökü
- suite başlatma ve kapatma
- worker eşzamanlılığı
- yapıt yazma
- rapor üretimi
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk alias'ları

Runner Plugin'leri taşıma sözleşmesini sahiplenir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökü altına nasıl bağlanacağı
- gateway'in bu taşıma için nasıl yapılandırılacağı
- hazır olma durumunun nasıl denetleneceği
- gelen olayların nasıl enjekte edileceği
- giden iletilerin nasıl gözlemleneceği
- transcript'lerin ve normalleştirilmiş taşıma durumunun nasıl sunulacağı
- taşıma destekli eylemlerin nasıl yürütüleceği
- taşıma özelinde sıfırlama veya temizliğin nasıl ele alınacağı

Yeni bir kanal için minimum benimseme eşiği:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab` öğesini tutun.
2. Taşıma runner'ını paylaşılan `qa-lab` ana makine geçidinde uygulayın.
3. Taşıma özelindeki mekanikleri runner Plugin veya kanal harness içinde tutun.
4. Runner'ı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın. Runner Plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır. `runtime-api.ts` hafif kalmalıdır; tembel CLI ve runner yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo kasıtlı bir geçiş yapmıyorsa mevcut uyumluluk alias'larını çalışır tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu o runner Plugin içinde veya Plugin harness içinde tutun.
- Bir senaryo, birden fazla kanalın kullanabileceği yeni bir yeteneğe ihtiyaç duyuyorsa, `suite.ts` içinde kanala özel dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşıma özelinde tutun ve bunu senaryo sözleşmesinde açıkça belirtin.

### Senaryo yardımcısı adları

Yeni senaryolar için tercih edilen genel yardımcılar:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Mevcut senaryolar için uyumluluk alias'ları kullanılabilir kalır — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ancak yeni senaryo yazımı genel adları kullanmalıdır. Alias'lar tek seferlik büyük bir geçişten kaçınmak için vardır; ileriye dönük model olarak değil.

## Raporlama

`qa-lab`, gözlemlenen bus zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şunları yanıtlamalıdır:

- Ne çalıştı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryolarını eklemeye değer

Kullanılabilir senaryoların envanteri için — takip çalışmasını boyutlandırırken veya yeni bir taşıma katmanı bağlarken yararlıdır — `pnpm openclaw qa coverage` komutunu çalıştırın (makine tarafından okunabilir çıktı için `--json` ekleyin).

Karakter ve stil kontrolleri için aynı senaryoyu birden çok canlı model
ref üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazdırın:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Komut, Docker değil yerel QA Gateway alt süreçlerini çalıştırır. Karakter değerlendirme
senaryoları persona ayarını `SOUL.md` üzerinden yapmalı, ardından sohbet,
çalışma alanı yardımı ve küçük dosya görevleri gibi sıradan kullanıcı turlarını
çalıştırmalıdır. Aday modele değerlendirildiği söylenmemelidir. Komut her tam
transkripti korur, temel çalıştırma istatistiklerini kaydeder, ardından desteklenen
yerlerde `xhigh` akıl yürütmeyle hızlı moddaki değerlendirici modellerden çalıştırmaları
doğallık, atmosfer ve mizah açısından sıralamalarını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: değerlendirici istemi yine
her transkripti ve çalıştırma durumunu alır, ancak aday ref değerleri `candidate-01`
gibi nötr etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek
ref değerleriyle eşleştirir.
Aday çalıştırmalar varsayılan olarak `high` düşünme kullanır; GPT-5.5 için `medium`,
bunu destekleyen eski OpenAI eval ref değerleri için `xhigh` kullanılır. Belirli bir adayı
satır içinde `--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>`
yine genel bir yedek değer ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday ref değerleri varsayılan olarak hızlı modu kullanır; böylece sağlayıcının
desteklediği yerlerde öncelikli işleme kullanılır. Tek bir aday veya değerlendirici için
geçersiz kılma gerektiğinde satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin.
`--fast` seçeneğini yalnızca hızlı modu her aday model için zorlamak istediğinizde geçirin.
Aday ve değerlendirici süreleri kıyaslama analizi için rapora kaydedilir, ancak değerlendirici
istemleri açıkça hıza göre sıralama yapmamalarını söyler.
Aday ve değerlendirici model çalıştırmaları varsayılan olarak 16 eşzamanlılık kullanır. Sağlayıcı
sınırları veya yerel Gateway baskısı bir çalıştırmayı fazla gürültülü hale getirdiğinde
`--concurrency` veya `--judge-concurrency` değerini düşürün.
Hiçbir aday `--model` geçirilmediğinde, karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
Hiçbir `--judge-model` geçirilmediğinde, değerlendiriciler varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` kullanır.

## İlgili belgeler

- [Matris QA](/tr/concepts/qa-matrix)
- [QA Kanalı](/tr/channels/qa-channel)
- [Test Etme](/tr/help/testing)
- [Pano](/tr/web/dashboard)

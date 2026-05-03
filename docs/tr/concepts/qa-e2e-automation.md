---
read_when:
    - QA yığınının nasıl birlikte çalıştığını anlamak
    - qa-lab, qa-channel veya bir taşıma bağdaştırıcısını genişletme
    - Repo destekli QA senaryoları ekleme
    - Gateway panosu için daha gerçekçi kalite güvencesi otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, depo destekli senaryolar, canlı aktarım hatları, aktarım bağdaştırıcıları ve raporlama.'
title: Kalite güvencesine genel bakış
x-i18n:
    generated_at: "2026-05-03T21:31:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw'ı tek bir birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak içindir.

Geçerli parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: dökümü gözlemlemek,
  gelen mesajları enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veriyolu.
- `extensions/qa-matrix`, gelecekteki çalıştırıcı Plugin'ler: alt QA Gateway içinde
  gerçek bir kanalı süren canlı taşıma bağdaştırıcıları.
- `qa/`: başlatma görevi ve temel QA
  senaryoları için repo destekli tohum varlıklar.
- [Mantis](/tr/concepts/mantis): gerçek taşımalar, tarayıcı ekran görüntüleri, VM durumu ve PR kanıtı
  gerektiren hatalar için canlı doğrulamadan önce ve sonra.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Birçoğunun `pnpm qa:*`
betik takma adları vardır; iki form da desteklenir.

| Komut                                               | Amaç                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | Paketli QA öz denetimi; bir Markdown raporu yazar.                                                                                                                       |
| `qa suite`                                          | Repo destekli senaryoları QA Gateway hattına karşı çalıştırır. Takma adlar: tek kullanımlık bir Linux VM için `pnpm openclaw qa suite --runner multipass`.               |
| `qa coverage`                                       | Markdown senaryo kapsama envanterini yazdırır (makine çıktısı için `--json`).                                                                                            |
| `qa parity-report`                                  | İki `qa-suite-summary.json` dosyasını karşılaştırır ve ajanik eşlik raporunu yazar.                                                                                      |
| `qa character-eval`                                 | Karakter QA senaryosunu, puanlanmış bir raporla birden fazla canlı model üzerinde çalıştırır. Bkz. [Raporlama](#reporting).                                             |
| `qa manual`                                         | Seçili sağlayıcı/model hattına karşı tek seferlik bir istem çalıştırır.                                                                                                  |
| `qa ui`                                             | QA hata ayıklayıcı UI'ını ve yerel QA veriyolunu başlatır (takma ad: `pnpm qa:lab:ui`).                                                                                  |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını oluşturur.                                                                                                                         |
| `qa docker-scaffold`                                | QA panosu + Gateway hattı için bir docker-compose iskeleti yazar.                                                                                                        |
| `qa up`                                             | QA sitesini oluşturur, Docker destekli yığını başlatır, URL'yi yazdırır (takma ad: `pnpm qa:lab:up`; `:fast` varyantı `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler). |
| `qa aimock`                                         | Yalnızca AIMock sağlayıcı sunucusunu başlatır.                                                                                                                           |
| `qa mock-openai`                                    | Yalnızca senaryo farkındalıklı `mock-openai` sağlayıcı sunucusunu başlatır.                                                                                              |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetir.                                                                                                                       |
| `qa matrix`                                         | Tek kullanımlık bir Tuwunel homeserver'a karşı canlı taşıma hattı. Bkz. [Matrix QA](/tr/concepts/qa-matrix).                                                               |
| `qa telegram`                                       | Gerçek bir özel Telegram grubuna karşı canlı taşıma hattı.                                                                                                               |
| `qa discord`                                        | Gerçek bir özel Discord guild kanalına karşı canlı taşıma hattı.                                                                                                         |
| `qa mantis`                                         | İlk Discord durum tepkileri senaryosuyla canlı taşıma hataları için önce ve sonra doğrulama çalıştırıcısı. Bkz. [Mantis](/tr/concepts/mantis).                             |

## Operatör akışı

Geçerli QA operatör akışı iki bölmeli bir QA sitesidir:

- Sol: ajanla birlikte Gateway panosu (Control UI).
- Sağ: Slack benzeri dökümü ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini oluşturur, Docker destekli Gateway hattını başlatır ve bir operatörün
veya otomasyon döngüsünün ajana bir QA görevi verebildiği, gerçek kanal davranışını
gözlemleyebildiği ve nelerin çalıştığını, başarısız olduğunu veya engelli kaldığını
kaydedebildiği QA Lab sayfasını sunar.

Docker imajını her seferinde yeniden oluşturmadan daha hızlı QA Lab UI yinelemesi için,
yığını bind mount edilmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker hizmetlerini önceden oluşturulmuş bir imajda tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` konteynerine bind mount eder. `qa:lab:watch`
bu paketi değişiklikte yeniden oluşturur ve QA Lab varlık karması değiştiğinde tarayıcı
otomatik olarak yeniden yüklenir.

Yerel bir OpenTelemetry izleme smoke testi için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu betik yerel bir OTLP/HTTP iz alıcısı başlatır, `diagnostics-otel` Plugin'i etkinleştirilmiş
olarak `otel-trace-smoke` QA senaryosunu çalıştırır, ardından dışa aktarılan protobuf span'lerini
çözer ve sürüm açısından kritik biçimi doğrular: `openclaw.run`, `openclaw.harness.run`,
`openclaw.model.call`, `openclaw.context.assembled` ve `openclaw.message.delivery` mevcut
olmalıdır; model çağrıları başarılı turlarda `StreamAbandoned` dışa aktarmamalıdır; ham tanılama
kimlikleri ve `openclaw.content.*` öznitelikleri iz dışında kalmalıdır. QA suite artifaktlarının
yanına `otel-smoke-summary.json` yazar.

Gözlemlenebilirlik QA'sı yalnızca kaynak checkout için kalır. npm tarball bilinçli olarak
QA Lab'i içermez, bu yüzden paket Docker sürüm hatları `qa` komutlarını çalıştırmaz. Tanılama
enstrümantasyonunu değiştirirken oluşturulmuş bir kaynak checkout'tan `pnpm qa:otel:smoke`
kullanın.

Taşıması gerçek bir Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Bu hat için tam CLI referansı, profil/senaryo kataloğu, ortam değişkenleri ve artifakt düzeni [Matrix QA](/tr/concepts/qa-matrix) içinde yer alır. Kısaca: Docker içinde tek kullanımlık bir Tuwunel homeserver sağlar, geçici driver/SUT/observer kullanıcıları kaydeder, gerçek Matrix Plugin'ini o taşımaya kapsamlanmış bir alt QA Gateway içinde çalıştırır (`qa-channel` yok), ardından `.artifacts/qa-e2e/matrix-<timestamp>/` altında bir Markdown raporu, JSON özeti, gözlemlenen olaylar artifaktı ve birleşik çıktı günlüğü yazar.

Taşıması gerçek Telegram ve Discord smoke hatları için:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

İkisi de iki botlu (driver + SUT) önceden var olan gerçek bir kanalı hedefler. Gerekli ortam değişkenleri, senaryo listeleri, çıktı artifaktları ve Convex kimlik bilgisi havuzu aşağıdaki [Telegram ve Discord QA referansı](#telegram-and-discord-qa-reference) içinde belgelenmiştir.

Havuzlanmış canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex broker ortamını denetler, endpoint ayarlarını doğrular ve bakımcı sırrı mevcut olduğunda admin/liste erişilebilirliğini doğrular. Sırlar için yalnızca ayarlanmış/eksik durumunu raporlar.

## Canlı taşıma kapsaması

Canlı taşıma hatları, her birinin kendi senaryo listesi biçimini icat etmesi yerine tek bir sözleşme paylaşır. `qa-channel`, geniş sentetik ürün davranışı suite'idir ve canlı taşıma kapsama matrisinin parçası değildir.

| Hat      | Canary | Bahis geçidi | Bot-bota | İzin listesi bloğu | Üst düzey yanıt | Yeniden başlatma sürdürme | İş parçacığı takibi | İş parçacığı yalıtımı | Tepki gözlemi | Yardım komutu | Yerel komut kaydı |
| -------- | ------ | ------------ | -------- | ------------------ | --------------- | ------------------------- | ------------------- | --------------------- | ------------- | ------------- | ----------------- |
| Matrix   | x      | x            | x        | x                  | x               | x                         | x                   | x                     | x             |               |                   |
| Telegram | x      | x            | x        |                    |                 |                           |                     |                       |               | x             |                   |
| Discord  | x      | x            | x        |                    |                 |                           |                     |                       |               |               | x                 |

Bu, `qa-channel`'ı geniş ürün davranışı suite'i olarak tutarken Matrix,
Telegram ve gelecekteki canlı taşımaların tek bir açık taşıma sözleşmesi
kontrol listesini paylaşmasını sağlar.

Docker'ı QA yoluna dahil etmeden tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass guest'i başlatır, bağımlılıkları kurar, OpenClaw'ı guest içinde
oluşturur, `qa suite` çalıştırır, ardından normal QA raporunu ve özetini ana makinede
`.artifacts/qa-e2e/...` içine geri kopyalar.
Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır.
Ana makine ve Multipass suite çalıştırmaları, birden fazla seçili senaryoyu varsayılan olarak
yalıtılmış Gateway worker'larıyla paralel yürütür. `qa-channel` varsayılan olarak 4 eşzamanlılığa
sahiptir ve seçilen senaryo sayısıyla sınırlanır. Worker sayısını ayarlamak için
`--concurrency <count>` veya seri yürütme için `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan çıkış koduyla çıkar. Başarısız
çıkış kodu olmadan artifaktlar istediğinizde `--allow-failures` kullanın.
Canlı çalıştırmalar, guest için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
ortam tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve mevcut olduğunda
`CODEX_HOME`. Guest'in mount edilmiş çalışma alanı üzerinden geri yazabilmesi için
`--output-dir` değerini repo kökü altında tutun.

## Telegram ve Discord QA referansı

Matrix'in senaryo sayısı ve Docker destekli homeserver sağlaması nedeniyle [ayrılmış bir sayfası](/tr/concepts/qa-matrix) vardır. Telegram ve Discord daha küçüktür — her biri birkaç senaryo, profil sistemi yok, önceden var olan gerçek kanallara karşı — bu yüzden referansları burada yer alır.

### Paylaşılan CLI bayrakları

İki hat da `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` üzerinden kaydolur ve aynı bayrakları kabul eder:

| Bayrak                                | Varsayılan                                               | Açıklama                                                                                                                 |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | —                                                         | Yalnızca bu senaryoyu çalıştır. Tekrarlanabilir.                                                                         |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Raporların/özetin/gözlenen mesajların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` üzerinden çözülür. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Nötr bir cwd'den çağırırken depo kökü.                                                                                   |
| `--sut-account <id>`                  | `sut`                                                     | QA gateway yapılandırması içindeki geçici hesap kimliği.                                                                 |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` veya `live-frontier` (eski `live-openai` hâlâ çalışır).                                                    |
| `--model <ref>` / `--alt-model <ref>` | provider varsayılanı                                      | Birincil/alternatif model referansları.                                                                                  |
| `--fast`                              | kapalı                                                    | Desteklendiği yerlerde sağlayıcı hızlı modu.                                                                             |
| `--credential-source <env\|convex>`   | `env`                                                     | Bkz. [Convex kimlik bilgisi havuzu](#convex-credential-pool).                                                            |
| `--credential-role <maintainer\|ci>`  | CI'de `ci`, aksi halde `maintainer`                       | `--credential-source convex` kullanıldığında kullanılan rol.                                                             |

Herhangi bir senaryo başarısız olduğunda ikisi de sıfır olmayan çıkış yapar. `--allow-failures`, başarısız çıkış kodu ayarlamadan yapıtları yazar.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

İki ayrı botun (sürücü + SUT) bulunduğu gerçek bir özel Telegram grubunu hedefler. SUT botunun bir Telegram kullanıcı adı olmalıdır; botlar arası gözlem, her iki botta da `@BotFather` içinde **Bot-to-Bot Communication Mode** etkin olduğunda en iyi çalışır.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — sayısal sohbet kimliği (dize).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`, gözlenen mesaj yapıtlarında mesaj gövdelerini tutar (varsayılan olarak redakte edilir).

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
- `telegram-qa-summary.json` — canary ile başlayarak yanıt başına RTT'yi (sürücü gönderimi → gözlenen SUT yanıtı) içerir.
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.

### Discord QA

```bash
pnpm openclaw qa discord
```

İki botun bulunduğu gerçek bir özel Discord sunucu kanalını hedefler: donanım tarafından kontrol edilen bir sürücü botu ve alt OpenClaw gateway tarafından paketlenmiş Discord plugin üzerinden başlatılan bir SUT botu. Kanal mention işleme davranışını, SUT botunun yerel `/help` komutunu Discord ile kaydettiğini ve isteğe bağlı Mantis kanıt senaryolarını doğrular.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord tarafından döndürülen SUT bot kullanıcı kimliğiyle eşleşmelidir (aksi halde lane hızlı başarısız olur).

İsteğe bağlı:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`, gözlenen mesaj yapıtlarında mesaj gövdelerini tutar.

Senaryolar (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — isteğe bağlı Mantis senaryosu. SUT'u `messages.statusReactions.enabled=true` ile her zaman açık, yalnızca araç kullanan sunucu yanıtlarına geçirdiği, ardından bir REST tepki zaman çizelgesi ile bir HTML/PNG görsel yapıtı yakaladığı için tek başına çalışır.

Mantis durum tepkisi senaryosunu açıkça çalıştırın:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Çıktı yapıtları:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.
- Durum tepkisi senaryosu çalıştığında `discord-qa-reaction-timelines.json` ve `discord-status-reactions-tool-only-timeline.png`.

### Convex kimlik bilgisi havuzu

Hem Telegram hem de Discord lane'leri, yukarıdaki env değişkenlerini okumak yerine paylaşılan bir Convex havuzundan kimlik bilgisi kiralayabilir. `--credential-source convex` geçirin (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın); QA Lab özel bir kiralama alır, çalışma süresi boyunca bunun Heartbeat'ini gönderir ve kapanışta serbest bırakır. Havuz türleri `"telegram"` ve `"discord"` şeklindedir.

Broker'ın `admin/add` üzerinde doğruladığı payload şekilleri:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` sayısal bir sohbet kimliği dizesi olmalıdır.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operasyonel env değişkenleri ve Convex broker endpoint sözleşmesi [Testing → Convex üzerinden paylaşılan Telegram kimlik bilgileri](/tr/help/testing#shared-telegram-credentials-via-convex-v1) bölümünde yer alır (bölüm adı Discord desteğinden öncedir; broker semantiği her iki tür için aynıdır).

## Depo destekli seed'ler

Seed varlıkları `qa/` içinde yer alır:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar, QA planının hem insanlar hem de agent tarafından görülebilmesi için bilerek git içinde tutulur.

`qa-lab` genel amaçlı bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası, tek bir test çalıştırması için doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo metadatası
- isteğe bağlı kategori, yetenek, lane ve risk metadatası
- doküman ve kod referansları
- isteğe bağlı plugin gereksinimleri
- isteğe bağlı gateway yapılandırma yaması
- çalıştırılabilir `qa-flow`

`qa-flow`'u destekleyen yeniden kullanılabilir çalışma zamanı yüzeyi genel ve kesişen nitelikte kalabilir. Örneğin, markdown senaryoları, Gateway `browser.request` bağlantısı üzerinden gömülü Control UI'ı süren tarayıcı tarafı yardımcılarla taşıma tarafı yardımcılarını birleştirebilir; bunun için özel durum çalıştırıcısı eklenmez.

Senaryo dosyaları, kaynak ağacı klasörü yerine ürün yeteneğine göre gruplanmalıdır. Dosyalar taşındığında senaryo kimliklerini kararlı tutun; uygulama izlenebilirliği için `docsRefs` ve `codeRefs` kullanın.

Temel liste şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- thread davranışı
- mesaj eylemi yaşam döngüsü
- cron geri çağrıları
- bellek hatırlama
- model değiştirme
- subagent devri
- depo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı mock lane'leri

`qa suite` iki yerel sağlayıcı mock lane'ine sahiptir:

- `mock-openai`, senaryo farkındalığı olan OpenClaw mock'udur. Depo destekli QA ve parity gate'leri için varsayılan belirleyici mock lane olarak kalır.
- `aimock`, deneysel protokol, fixture, kayıt/yeniden oynatma ve chaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Ekleyicidir ve `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı lane uygulaması `extensions/qa-lab/src/providers/` altında yer alır. Her sağlayıcı kendi varsayılanlarını, yerel sunucu başlatmasını, gateway model yapılandırmasını, auth-profile hazırlama ihtiyaçlarını ve canlı/mock yetenek bayraklarını sahiplenir. Paylaşılan suite ve gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı registry üzerinden yönlendirme yapmalıdır.

## Taşıma adaptörleri

`qa-lab`, markdown QA senaryoları için genel bir taşıma bağlantısına sahiptir. `qa-channel`, bu bağlantıdaki ilk adaptördür, ancak tasarım hedefi daha geniştir: gelecekteki gerçek veya sentetik kanallar, taşıma özelinde bir QA çalıştırıcısı eklemek yerine aynı suite çalıştırıcısına takılmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütmesini, worker eşzamanlılığını, yapıt yazımını ve raporlamayı sahiplenir.
- Taşıma adaptörü, gateway yapılandırmasını, hazır olma durumunu, gelen ve giden gözlemi, taşıma eylemlerini ve normalleştirilmiş taşıma durumunu sahiplenir.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

### Kanal ekleme

Markdown QA sistemine kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma adaptörü.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` barındırıcısı akışın sahibi olabiliyorsa yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab` paylaşılan barındırıcı mekaniklerini sahiplenir:

- `openclaw qa` komut kökü
- suite başlatma ve kapatma
- worker eşzamanlılığı
- yapıt yazımı
- rapor oluşturma
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk alias'ları

Çalıştırıcı plugin'leri taşıma sözleşmesini sahiplenir:

- `openclaw qa <runner>` komutunun paylaşılan `qa` kökü altına nasıl bağlandığı
- gateway'in bu taşıma için nasıl yapılandırıldığı
- hazır olma durumunun nasıl kontrol edildiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlendiği
- dökümlerin ve normalleştirilmiş taşıma durumunun nasıl sunulduğu
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşıma özelinde sıfırlama veya temizliğin nasıl işlendiği

Yeni bir kanal için minimum benimseme eşiği:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`'i tutun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` barındırıcı bağlantısında uygulayın.
3. Taşıma özelindeki mekanikleri çalıştırıcı plugin veya kanal donanımı içinde tutun.
4. Rakip bir kök komut kaydetmek yerine çalıştırıcıyı `openclaw qa <runner>` olarak bağlayın. Çalıştırıcı plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` dosyasından eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır. `runtime-api.ts` hafif kalmalıdır; lazy CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo kasıtlı bir migration yapmıyorsa mevcut uyumluluk alias'larının çalışmasını koruyun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu ilgili çalıştırıcı plugin veya plugin donanımı içinde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yeteneğe ihtiyaç duyuyorsa, `suite.ts` içinde kanala özel bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşıma özelinde tutun ve bunu senaryo sözleşmesinde açıkça belirtin.

### Senaryo yardımcı adları

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

Uyumluluk alias'ları mevcut senaryolar için kullanılabilir kalır: `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`; ancak yeni senaryo yazımında genel adlar kullanılmalıdır. Alias'lar, tek seferlik toplu bir geçişi önlemek için vardır; ileriye dönük model olarak değil.

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şunları yanıtlamalıdır:

- Neler çalıştı
- Neler başarısız oldu
- Neler engelli kaldı
- Hangi takip senaryolarını eklemeye değer

Kullanılabilir senaryoların envanteri için (takip çalışmasını boyutlandırırken veya yeni bir taşıma katmanı bağlarken yararlıdır) `pnpm openclaw qa coverage` komutunu çalıştırın (makine tarafından okunabilir çıktı için `--json` ekleyin).

Karakter ve stil kontrolleri için aynı senaryoyu birden çok canlı model
referansı üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

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

Komut, Docker değil, yerel QA Gateway alt süreçlerini çalıştırır. Karakter değerlendirme
senaryoları persona'yı `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam
transkripti korur, temel çalıştırma istatistiklerini kaydeder, ardından desteklendiği yerlerde `xhigh` akıl yürütmeyle hızlı modda yargıç modellerden çalıştırmaları doğallık, hava ve mizaha göre sıralamasını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: yargıç istemi yine de
her transkripti ve çalıştırma durumunu alır, ancak aday referansları `candidate-01` gibi tarafsız
etiketlerle değiştirilir; rapor ayrıştırmadan sonra sıralamaları gerçek referanslarla eşler.
Aday çalıştırmalar varsayılan olarak `high` düşünmeye ayarlanır; GPT-5.5 için `medium`, bunu destekleyen eski OpenAI değerlendirme referansları için `xhigh` kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` yine genel bir
yedek ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday referansları varsayılan olarak hızlı moda geçer, böylece sağlayıcının desteklediği yerlerde
öncelikli işleme kullanılır. Tek bir adayın veya yargıcın geçersiz kılmaya ihtiyacı olduğunda satır içinde
`,fast`, `,no-fast` veya `,fast=false` ekleyin. Hızlı modu tüm aday modeller için zorlamak istediğinizde yalnızca `--fast` iletin. Aday ve yargıç süreleri
kıyaslama analizi için rapora kaydedilir, ancak yargıç istemleri açıkça
hıza göre sıralama yapmamasını söyler.
Aday ve yargıç model çalıştırmalarının ikisi de varsayılan olarak 16 eşzamanlılık kullanır. Sağlayıcı sınırları veya yerel Gateway
baskısı bir çalıştırmayı fazla gürültülü hale getirdiğinde `--concurrency` veya `--judge-concurrency` değerini düşürün.
Aday `--model` geçirilmediğinde karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
`--judge-model` geçirilmediğinde yargıçlar varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` kullanır.

## İlgili belgeler

- [QA Matrisi](/tr/concepts/qa-matrix)
- [QA Kanalı](/tr/channels/qa-channel)
- [Test Etme](/tr/help/testing)
- [Pano](/tr/web/dashboard)

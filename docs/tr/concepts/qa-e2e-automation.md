---
read_when:
    - QA yığınının nasıl birlikte çalıştığını anlamak
    - qa-lab, qa-channel veya bir taşıma bağdaştırıcısını genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosuna yönelik daha gerçekçi kalite güvencesi otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, repo destekli senaryolar, canlı taşıma hatları, taşıma adaptörleri ve raporlama.'
title: Kalite güvencesine genel bakış
x-i18n:
    generated_at: "2026-04-30T09:17:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw’ı tek bir birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak içindir.

Güncel parçalar:

- `extensions/qa-channel`: DM, kanal, ileti dizisi,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: dökümü gözlemlemek,
  gelen mesajları enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veri yolu.
- `extensions/qa-matrix`, gelecekteki çalıştırıcı Plugin’leri: alt QA gateway içinde gerçek bir kanalı
  süren canlı taşıma adaptörleri.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için repo destekli başlangıç varlıkları.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Birçoğunun `pnpm qa:*`
betik takma adları vardır; iki biçim de desteklenir.

| Komut                                               | Amaç                                                                                                                                                                  |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Paketli QA öz denetimi; bir Markdown raporu yazar.                                                                                                                     |
| `qa suite`                                          | Repo destekli senaryoları QA Gateway hattına karşı çalıştırın. Takma adlar: tek kullanımlık bir Linux VM için `pnpm openclaw qa suite --runner multipass`.             |
| `qa coverage`                                       | Markdown senaryo kapsama envanterini yazdırır (makine çıktısı için `--json`).                                                                                          |
| `qa parity-report`                                  | İki `qa-suite-summary.json` dosyasını karşılaştırır ve aracı parity-gate raporunu yazar.                                                                               |
| `qa character-eval`                                 | Karakter QA senaryosunu, değerlendirilmiş bir raporla birden çok canlı modelde çalıştırır. Bkz. [Raporlama](#reporting).                                               |
| `qa manual`                                         | Seçili sağlayıcı/model hattına karşı tek seferlik bir istem çalıştırır.                                                                                                 |
| `qa ui`                                             | QA hata ayıklayıcı UI’ını ve yerel QA veri yolunu başlatır (takma ad: `pnpm qa:lab:ui`).                                                                               |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını oluşturur.                                                                                                                       |
| `qa docker-scaffold`                                | QA panosu + Gateway hattı için docker-compose iskeleti yazar.                                                                                                          |
| `qa up`                                             | QA sitesini oluşturur, Docker destekli yığını başlatır, URL’yi yazdırır (takma ad: `pnpm qa:lab:up`; `:fast` varyantı `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler). |
| `qa aimock`                                         | Yalnızca AIMock sağlayıcı sunucusunu başlatır.                                                                                                                         |
| `qa mock-openai`                                    | Yalnızca senaryo farkındalıklı `mock-openai` sağlayıcı sunucusunu başlatır.                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetir.                                                                                                                     |
| `qa matrix`                                         | Tek kullanımlık Tuwunel homeserver’a karşı canlı taşıma hattı. Bkz. [Matrix QA](/tr/concepts/qa-matrix).                                                                  |
| `qa telegram`                                       | Gerçek bir özel Telegram grubuna karşı canlı taşıma hattı.                                                                                                             |
| `qa discord`                                        | Gerçek bir özel Discord guild kanalına karşı canlı taşıma hattı.                                                                                                       |

## Operatör akışı

Güncel QA operatör akışı iki panelli bir QA sitesidir:

- Sol: Aracıyla birlikte Gateway panosu (Control UI).
- Sağ: Slack benzeri dökümü ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini oluşturur, Docker destekli Gateway hattını başlatır ve bir operatörün
veya otomasyon döngüsünün aracıya bir QA görevi verebileceği, gerçek kanal davranışını
gözlemleyebileceği ve neyin çalıştığını, başarısız olduğunu veya engelli kaldığını
kaydedebileceği QA Lab sayfasını sunar.

Docker imajını her seferinde yeniden oluşturmadan daha hızlı QA Lab UI yinelemesi için,
bind mount edilmiş QA Lab paketiyle yığını başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden oluşturulmuş bir imajda tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` container’ına bind-mount eder. `qa:lab:watch`
değişiklik olduğunda bu paketi yeniden oluşturur ve QA Lab varlık hash’i değiştiğinde
tarayıcı otomatik olarak yeniden yüklenir.

Yerel OpenTelemetry trace smoke için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu betik yerel bir OTLP/HTTP trace alıcısı başlatır,
`diagnostics-otel` Plugin’i etkin olacak şekilde `otel-trace-smoke` QA senaryosunu çalıştırır,
ardından dışa aktarılan protobuf span’lerini çözer ve sürüm açısından kritik şekli doğrular:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` ve `openclaw.message.delivery` mevcut olmalıdır;
model çağrıları başarılı turlarda `StreamAbandoned` dışa aktarmamalıdır; ham tanılama kimlikleri ve
`openclaw.content.*` öznitelikleri trace dışında kalmalıdır. QA suite yapıtlarının yanına
`otel-smoke-summary.json` yazar.

Gözlemlenebilirlik QA’sı yalnızca kaynak checkout’ında kalır. npm tarball’ı kasıtlı olarak
QA Lab’i içermez, bu yüzden paket Docker sürüm hatları `qa` komutlarını çalıştırmaz. Tanılama
enstrümantasyonunu değiştirirken oluşturulmuş bir kaynak checkout’ından
`pnpm qa:otel:smoke` kullanın.

Taşıma-gerçek Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Bu hat için tam CLI referansı, profil/senaryo kataloğu, env vars ve yapıt düzeni [Matrix QA](/tr/concepts/qa-matrix) içinde yer alır. Kısaca: Docker’da tek kullanımlık bir Tuwunel homeserver hazırlar, geçici driver/SUT/observer kullanıcıları kaydeder, gerçek Matrix Plugin’ini bu taşımaya kapsamlandırılmış bir alt QA Gateway içinde çalıştırır (`qa-channel` yok), ardından `.artifacts/qa-e2e/matrix-<timestamp>/` altında bir Markdown raporu, JSON özeti, gözlemlenen olaylar yapıtı ve birleştirilmiş çıktı günlüğü yazar.

Taşıma-gerçek Telegram ve Discord smoke hatları için:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

İkisi de iki botla (driver + SUT) önceden var olan gerçek bir kanalı hedefler. Gerekli env vars, senaryo listeleri, çıktı yapıtları ve Convex kimlik bilgisi havuzu aşağıdaki [Telegram ve Discord QA referansı](#telegram-and-discord-qa-reference) bölümünde belgelenmiştir.

Havuzdaki canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex aracı env’ini denetler, endpoint ayarlarını doğrular ve bakımcı sırrı mevcut olduğunda admin/liste erişilebilirliğini doğrular. Sırlar için yalnızca ayarlı/eksik durumunu bildirir.

## Canlı taşıma kapsaması

Canlı taşıma hatları, her birinin kendi senaryo listesi şeklini icat etmesi yerine tek bir sözleşme paylaşır. `qa-channel`, geniş sentetik ürün-davranışı suite’idir ve canlı taşıma kapsama matrisinin parçası değildir.

| Hat      | Canary | Bahsetme geçidi | Bot-to-bot | Allowlist engeli | Üst düzey yanıt | Yeniden başlatma sürdürme | İleti dizisi takibi | İleti dizisi izolasyonu | Tepki gözlemi | Yardım komutu | Yerel komut kaydı |
| -------- | ------ | --------------- | ---------- | ---------------- | --------------- | ------------------------- | ------------------- | ------------------------ | ------------- | ------------- | ----------------- |
| Matrix   | x      | x               | x          | x                | x               | x                         | x                   | x                        | x             |               |                   |
| Telegram | x      | x               | x          |                  |                 |                           |                     |                          |               | x             |                   |
| Discord  | x      | x               | x          |                  |                 |                           |                     |                          |               |               | x                 |

Bu, `qa-channel`’ı geniş ürün-davranışı suite’i olarak tutarken Matrix,
Telegram ve gelecekteki canlı taşımaların tek bir açık taşıma-sözleşmesi
kontrol listesi paylaşmasını sağlar.

QA yoluna Docker getirmeden tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass guest başlatır, bağımlılıkları kurar, OpenClaw’ı guest içinde
oluşturur, `qa suite` çalıştırır, ardından normal QA raporunu ve özetini host üzerinde
`.artifacts/qa-e2e/...` içine geri kopyalar.
Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır.
Host ve Multipass suite çalıştırmaları, seçilen birden çok senaryoyu varsayılan olarak
izole Gateway worker’larıyla paralel yürütür. `qa-channel` varsayılan olarak eşzamanlılığı
4 yapar ve seçili senaryo sayısıyla sınırlar. Worker sayısını ayarlamak için
`--concurrency <count>`, seri yürütme için `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olursa komut sıfır olmayan kodla çıkar. Başarısız çıkış kodu
olmadan yapıtlar istediğinizde `--allow-failures` kullanın.
Canlı çalıştırmalar, guest için pratik olan desteklenen QA auth girdilerini iletir:
env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı config yolu ve mevcut olduğunda
`CODEX_HOME`. Guest’in mount edilmiş çalışma alanı üzerinden geri yazabilmesi için
`--output-dir` değerini repo kökü altında tutun.

## Telegram ve Discord QA referansı

Matrix’in [özel bir sayfası](/tr/concepts/qa-matrix) vardır çünkü senaryo sayısı ve Docker destekli homeserver hazırlaması daha kapsamlıdır. Telegram ve Discord daha küçüktür — her biri birkaç senaryo, profil sistemi yok, önceden var olan gerçek kanallara karşı — bu yüzden referansları burada yer alır.

### Paylaşılan CLI bayrakları

Her iki hat da `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` üzerinden kaydolur ve aynı bayrakları kabul eder:

| Bayrak                                | Varsayılan                                                | Açıklama                                                                                                              |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Yalnızca bu senaryoyu çalıştır. Tekrarlanabilir.                                                                      |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Raporların/özetin/gözlemlenen iletilerin ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` temel alınarak çözümlenir. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Tarafsız bir cwd’den çağırırken depo kökü.                                                                            |
| `--sut-account <id>`                  | `sut`                                                     | QA Gateway yapılandırması içindeki geçici hesap kimliği.                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` veya `live-frontier` (eski `live-openai` hâlâ çalışır).                                                 |
| `--model <ref>` / `--alt-model <ref>` | sağlayıcı varsayılanı                                     | Birincil/alternatif model referansları.                                                                               |
| `--fast`                              | kapalı                                                    | Desteklendiği yerlerde sağlayıcı hızlı modu.                                                                          |
| `--credential-source <env\|convex>`   | `env`                                                     | Bkz. [Convex kimlik bilgisi havuzu](#convex-credential-pool).                                                        |
| `--credential-role <maintainer\|ci>`  | CI’da `ci`, aksi halde `maintainer`                       | `--credential-source convex` kullanıldığında kullanılan rol.                                                          |

Her ikisi de başarısız olan herhangi bir senaryoda sıfır olmayan çıkış yapar. `--allow-failures`, başarısız çıkış kodu ayarlamadan yapıtları yazar.

### Telegram Kalite Güvencesi

```bash
pnpm openclaw qa telegram
```

İki ayrı botu (sürücü + SUT) olan gerçek bir özel Telegram grubunu hedefler. SUT botunun bir Telegram kullanıcı adı olmalıdır; botlar arası gözlem, her iki botta da `@BotFather` içinde **Bot-to-Bot Communication Mode** etkinleştirildiğinde en iyi şekilde çalışır.

`--credential-source env` kullanıldığında gerekli env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — sayısal sohbet kimliği (dize).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`, gözlemlenen ileti yapıtlarında ileti gövdelerini tutar (varsayılan olarak redakte edilir).

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
- `telegram-qa-summary.json` — kanaryadan başlayarak yanıt başına RTT’yi (sürücü gönderimi → gözlemlenen SUT yanıtı) içerir.
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` olmadıkça gövdeler redakte edilir.

### Discord Kalite Güvencesi

```bash
pnpm openclaw qa discord
```

İki botu olan gerçek bir özel Discord sunucu kanalını hedefler: harness tarafından denetlenen bir sürücü botu ve paketlenmiş Discord Plugin aracılığıyla alt OpenClaw Gateway tarafından başlatılan bir SUT botu. Kanal bahsetme işlemesini ve SUT botunun yerel `/help` komutunu Discord’a kaydettiğini doğrular.

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
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` olmadıkça gövdeler redakte edilir.

### Convex kimlik bilgisi havuzu

Hem Telegram hem de Discord hatları, yukarıdaki env değişkenlerini okumak yerine paylaşılan bir Convex havuzundan kimlik bilgisi kiralayabilir. `--credential-source convex` iletin (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın); QA Laboratuvarı özel bir kiralama alır, çalışma süresince Heartbeat gönderir ve kapanışta serbest bırakır. Havuz türleri `"telegram"` ve `"discord"` şeklindedir.

Aracının `admin/add` üzerinde doğruladığı yük biçimleri:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` sayısal bir sohbet kimliği dizesi olmalıdır.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operasyonel env değişkenleri ve Convex aracı uç nokta sözleşmesi [Testing → Convex üzerinden paylaşılan Telegram kimlik bilgileri](/tr/help/testing#shared-telegram-credentials-via-convex-v1) içinde yer alır (bölüm adı Discord desteğinden önce gelir; aracı semantiği her iki tür için de aynıdır).

## Depo destekli seed’ler

Seed varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar kasıtlı olarak git içindedir; böylece QA planı hem insanlar hem de
agent tarafından görülebilir.

`qa-lab` genel bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası,
tek bir test çalıştırması için doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo metaverisi
- isteğe bağlı kategori, yetenek, hat ve risk metaverisi
- belge ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı Gateway yapılandırma yaması
- çalıştırılabilir `qa-flow`

`qa-flow`’u destekleyen yeniden kullanılabilir çalışma zamanı yüzeyinin genel
ve kesişen alanlara yayılmış kalmasına izin verilir. Örneğin, markdown senaryoları
özel durum çalıştırıcısı eklemeden, gömülü Denetim UI’ını Gateway `browser.request`
aralığı üzerinden süren tarayıcı tarafı yardımcılarıyla taşıma tarafı yardımcılarını birleştirebilir.

Senaryo dosyaları kaynak ağacı klasörü yerine ürün yeteneğine göre gruplanmalıdır.
Dosyalar taşındığında senaryo kimliklerini kararlı tutun; uygulama izlenebilirliği için `docsRefs` ve `codeRefs`
kullanın.

Temel liste şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- thread davranışı
- ileti eylemi yaşam döngüsü
- cron geri çağrıları
- bellek hatırlama
- model değiştirme
- alt agent devri
- depo okuma ve belge okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı mock hatları

`qa suite` iki yerel sağlayıcı mock hattına sahiptir:

- `mock-openai`, senaryo farkındalığı olan OpenClaw mock’udur. Depo destekli QA ve eşlik kapıları için varsayılan
  deterministik mock hattı olarak kalır.
- `aimock`, deneysel protokol, fixture, kayıt/yeniden oynatma ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Eklemelidir ve
  `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında bulunur.
Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlangıcına, Gateway model yapılandırmasına,
auth-profile hazırlama gereksinimlerine ve canlı/mock yetenek bayraklarına sahiptir. Paylaşılan suite ve
Gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirmelidir.

## Taşıma adaptörleri

`qa-lab`, markdown QA senaryoları için genel bir taşıma aralığına sahiptir. `qa-channel` bu aralıktaki ilk adaptördür, ancak tasarım hedefi daha geniştir: gelecekteki gerçek veya sentetik kanallar, taşıma özelinde bir QA çalıştırıcısı eklemek yerine aynı suite çalıştırıcısına takılmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütmeden, işçi eşzamanlılığından, yapıt yazımından ve raporlamadan sorumludur.
- Taşıma adaptörü, Gateway yapılandırmasından, hazır olma durumundan, gelen ve giden gözlemden, taşıma eylemlerinden ve normalize edilmiş taşıma durumundan sorumludur.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

### Kanal ekleme

Markdown QA sistemine kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma adaptörü.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` konağı akışa sahip olabiliyorsa yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan konak mekaniğine sahiptir:

- `openclaw qa` komut kökü
- suite başlatma ve kapatma
- işçi eşzamanlılığı
- yapıt yazımı
- rapor oluşturma
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı Plugin’leri taşıma sözleşmesine sahiptir:

- `openclaw qa <runner>` komutunun paylaşılan `qa` kökü altına nasıl bağlandığı
- Gateway’in bu taşıma için nasıl yapılandırıldığı
- hazır olma durumunun nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden iletilerin nasıl gözlemlendiği
- dökümlerin ve normalize edilmiş taşıma durumunun nasıl sunulduğu
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşıma özelinde sıfırlama veya temizliğin nasıl işlendiği

Yeni bir kanal için minimum benimseme çıtası:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`’i koruyun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` konak aralığında uygulayın.
3. Taşımaya özgü mekaniği çalıştırıcı Plugin veya kanal harness’i içinde tutun.
4. Çalıştırıcıyı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın. Çalıştırıcı Plugin’leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` üzerinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır. `runtime-api.ts` hafif kalmalıdır; tembel CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo kasıtlı bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, o çalıştırıcı Plugin veya Plugin harness’i içinde tutun.
- Bir senaryonun birden fazla kanalın kullanabileceği yeni bir yeteneğe ihtiyacı varsa, `suite.ts` içinde kanala özgü bir dal yerine genel bir yardımcı ekleyin.
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

Uyumluluk takma adları mevcut senaryolar için kullanılabilir kalır — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ancak yeni senaryo yazımı genel adları kullanmalıdır. Takma adlar toplu bir geçişi önlemek için vardır; ileriye dönük model olarak değil.

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şunları yanıtlamalıdır:

- Ne çalıştı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryolarının eklenmeye değer olduğu

Kullanılabilir senaryoların envanteri için — takip işlerini boyutlandırırken veya yeni bir aktarımı bağlarken yararlıdır — `pnpm openclaw qa coverage` komutunu çalıştırın (makine tarafından okunabilir çıktı için `--json` ekleyin).

Karakter ve stil kontrolleri için aynı senaryoyu birden fazla canlı model
ref'i üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

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

Komut Docker değil, yerel QA gateway alt süreçlerini çalıştırır. Karakter değerlendirme
senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı
yardımı ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır.
Aday modele değerlendirildiği söylenmemelidir. Komut her tam dökümü korur,
temel çalıştırma istatistiklerini kaydeder, ardından desteklenen yerlerde `xhigh`
akıl yürütmeyle hızlı modda jüri modellerinden çalıştırmaları doğallık, hava ve mizah açısından sıralamasını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: jüri istemi yine
her dökümü ve çalıştırma durumunu alır, ancak aday ref'leri `candidate-01` gibi
tarafsız etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek
ref'lerle eşler.
Aday çalıştırmalar varsayılan olarak `high` düşünme kullanır; GPT-5.5 için `medium`,
bunu destekleyen eski OpenAI değerlendirme ref'leri için `xhigh` kullanılır.
Belirli bir adayı satır içinde `--model provider/model,thinking=<level>` ile geçersiz kılın.
`--thinking <level>` hâlâ genel bir yedek değer belirler ve eski
`--model-thinking <provider/model=level>` biçimi uyumluluk için korunur.
OpenAI aday ref'leri varsayılan olarak hızlı modu kullanır; böylece sağlayıcının
desteklediği yerlerde öncelikli işleme kullanılır. Tek bir adayın veya jürinin
geçersiz kılmaya ihtiyacı olduğunda satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin.
Hızlı modu her aday model için zorunlu kılmak istediğinizde yalnızca `--fast` iletin.
Aday ve jüri süreleri karşılaştırma analizi için rapora kaydedilir, ancak jüri istemleri
hıza göre sıralama yapmamasını açıkça söyler.
Aday ve jüri model çalıştırmaları varsayılan olarak concurrency 16 kullanır. Sağlayıcı
sınırları veya yerel gateway baskısı bir çalıştırmayı fazla gürültülü yaptığında
`--concurrency` ya da `--judge-concurrency` değerini düşürün.
Hiçbir aday `--model` iletilmediğinde, karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
Hiçbir `--judge-model` iletilmediğinde, jüri modelleri varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili dokümanlar

- [Matris QA](/tr/concepts/qa-matrix)
- [QA Kanalı](/tr/channels/qa-channel)
- [Test Etme](/tr/help/testing)
- [Pano](/tr/web/dashboard)

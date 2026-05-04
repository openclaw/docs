---
read_when:
    - QA yığınının birlikte nasıl çalıştığını anlama
    - qa-lab, qa-channel veya bir taşıma bağdaştırıcısını genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu için daha gerçekçi kalite güvence otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, repo destekli senaryolar, canlı taşıma kulvarları, taşıma bağdaştırıcıları ve raporlama.'
title: QA genel bakışı
x-i18n:
    generated_at: "2026-05-04T07:04:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw'ı tek bir birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak içindir.

Geçerli parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve bir Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veri yolu.
- `extensions/qa-matrix`, gelecekteki çalıştırıcı plugins: bir alt QA gateway içinde gerçek bir kanalı
  süren canlı taşıma adaptörleri.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için repo destekli başlangıç varlıkları.
- [Mantis](/tr/concepts/mantis): gerçek taşımalar, tarayıcı ekran görüntüleri, VM durumu ve PR kanıtı
  gerektiren hatalar için canlı doğrulama öncesi ve sonrası.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Birçoğunun `pnpm qa:*`
script takma adları vardır; iki biçim de desteklenir.

| Komut                                               | Amaç                                                                                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Paketlenmiş QA öz denetimi; bir Markdown raporu yazar.                                                                                                                                      |
| `qa suite`                                          | Repo destekli senaryoları QA gateway hattına karşı çalıştırır. Takma adlar: tek kullanımlık bir Linux VM için `pnpm openclaw qa suite --runner multipass`.                                  |
| `qa coverage`                                       | Markdown senaryo kapsam envanterini yazdırır (makine çıktısı için `--json`).                                                                                                                |
| `qa parity-report`                                  | İki `qa-suite-summary.json` dosyasını karşılaştırır ve agentic eşlik raporunu yazar.                                                                                                        |
| `qa character-eval`                                 | Karakter QA senaryosunu birden çok canlı modelde, değerlendirilmiş bir raporla çalıştırır. Bkz. [Raporlama](#reporting).                                                                    |
| `qa manual`                                         | Seçilen provider/model hattına karşı tek seferlik bir prompt çalıştırır.                                                                                                                    |
| `qa ui`                                             | QA hata ayıklayıcı UI'ını ve yerel QA veri yolunu başlatır (takma ad: `pnpm qa:lab:ui`).                                                                                                    |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını derler.                                                                                                                                               |
| `qa docker-scaffold`                                | QA panosu + gateway hattı için bir docker-compose iskeleti yazar.                                                                                                                           |
| `qa up`                                             | QA sitesini derler, Docker destekli yığını başlatır, URL'yi yazdırır (takma ad: `pnpm qa:lab:up`; `:fast` varyantı `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler).            |
| `qa aimock`                                         | Yalnızca AIMock provider sunucusunu başlatır.                                                                                                                                               |
| `qa mock-openai`                                    | Yalnızca senaryo farkındalıklı `mock-openai` provider sunucusunu başlatır.                                                                                                                  |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetir.                                                                                                                                          |
| `qa matrix`                                         | Tek kullanımlık bir Tuwunel homeserver'a karşı canlı taşıma hattı. Bkz. [Matrix QA](/tr/concepts/qa-matrix).                                                                                   |
| `qa telegram`                                       | Gerçek bir özel Telegram grubuna karşı canlı taşıma hattı.                                                                                                                                  |
| `qa discord`                                        | Gerçek bir özel Discord guild kanalına karşı canlı taşıma hattı.                                                                                                                            |
| `qa slack`                                          | Gerçek bir özel Slack kanalına karşı canlı taşıma hattı.                                                                                                                                    |
| `qa mantis`                                         | Discord durum tepkileri kanıtı, Crabbox masaüstü/tarayıcı smoke ve Slack-in-VNC smoke ile canlı taşıma hataları için doğrulama öncesi ve sonrası çalıştırıcısı. Bkz. [Mantis](/tr/concepts/mantis). |

## Operatör akışı

Geçerli QA operatör akışı iki panelli bir QA sitesidir:

- Sol: Agent ile Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve bir operatörün veya otomasyon döngüsünün agent'a bir QA
görevi verebileceği, gerçek kanal davranışını gözlemleyebileceği ve neyin çalıştığını, başarısız olduğunu veya
engelli kaldığını kaydedebileceği QA Lab sayfasını açığa çıkarır.

Docker imajını her seferinde yeniden derlemeden daha hızlı QA Lab UI yinelemesi için,
yığını bağlama ile mount edilmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker hizmetlerini önceden derlenmiş bir imajda tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` kapsayıcısına bind-mount eder. `qa:lab:watch`
bu paketi değişiklikte yeniden derler ve QA Lab
varlık hash'i değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

Yerel bir OpenTelemetry trace smoke için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu script, yerel bir OTLP/HTTP trace alıcısı başlatır,
`diagnostics-otel` Plugin'i etkinleştirilmiş şekilde `otel-trace-smoke` QA senaryosunu çalıştırır, ardından
dışa aktarılan protobuf span'lerini çözer ve sürüm açısından kritik şekli doğrular:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` ve `openclaw.message.delivery` mevcut olmalıdır;
model çağrıları başarılı turn'lerde `StreamAbandoned` dışa aktarmamalıdır; ham tanılama ID'leri ve
`openclaw.content.*` öznitelikleri trace dışında kalmalıdır. QA suite artifact'lerinin yanına
`otel-smoke-summary.json` yazar.

Gözlemlenebilirlik QA'sı yalnızca kaynak checkout'unda kalır. npm tarball'ı bilerek
QA Lab'i içermez, bu nedenle paket Docker sürüm hatları `qa` komutlarını çalıştırmaz. Tanılama
instrumentation'ı değiştirirken derlenmiş bir kaynak checkout'undan
`pnpm qa:otel:smoke` kullanın.

Taşıması gerçek bir Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Bu hat için tam CLI referansı, profil/senaryo kataloğu, env vars ve artifact düzeni [Matrix QA](/tr/concepts/qa-matrix) içinde yer alır. Kısaca: Docker'da tek kullanımlık bir Tuwunel homeserver sağlar, geçici driver/SUT/observer kullanıcıları kaydeder, gerçek Matrix Plugin'ini bu taşımaya kapsamlanmış bir alt QA gateway içinde çalıştırır (`qa-channel` yoktur), ardından `.artifacts/qa-e2e/matrix-<timestamp>/` altında bir Markdown raporu, JSON özeti, gözlemlenen olaylar artifact'i ve birleştirilmiş çıktı günlüğü yazar.

Taşıması gerçek Telegram, Discord ve Slack smoke hatları için:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Bunlar iki botlu (driver + SUT) önceden var olan gerçek bir kanalı hedefler. Gerekli env vars, senaryo listeleri, çıktı artifact'leri ve Convex kimlik bilgisi havuzu aşağıdaki [Telegram, Discord ve Slack QA referansı](#telegram-discord-and-slack-qa-reference) bölümünde belgelenmiştir.

VNC kurtarma ile tam bir Slack masaüstü VM çalıştırması için şunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bu komut bir Crabbox masaüstü/tarayıcı makinesi kiralar, Slack canlı hattını
VM içinde çalıştırır, VNC tarayıcısında Slack Web'i açar, masaüstünü yakalar ve
`slack-qa/` ile `slack-desktop-smoke.png` dosyasını Mantis artifact
dizinine kopyalar. VNC üzerinden Slack Web'e manuel olarak giriş yaptıktan sonra
`--lease-id <cbx_...>` öğesini yeniden kullanın. `--gateway-setup` ile Mantis, VM içinde port `38973` üzerinde kalıcı bir OpenClaw Slack
gateway çalışır halde bırakır; onsuz komut normal bot-to-bot Slack QA hattını çalıştırır ve artifact yakalamadan sonra çıkar.

Havuzlanmış canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex broker env öğesini denetler, endpoint ayarlarını doğrular ve maintainer secret mevcut olduğunda admin/list erişilebilirliğini doğrular. Secret'lar için yalnızca ayarlı/eksik durumunu raporlar.

## Canlı taşıma kapsamı

Canlı taşıma hatları, her biri kendi senaryo listesi şeklini icat etmek yerine tek bir sözleşmeyi paylaşır. `qa-channel`, geniş sentetik ürün davranışı suite'idir ve canlı taşıma kapsam matrisinin parçası değildir.

| Hat      | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

Bu, `qa-channel`'ı geniş ürün davranışı suite'i olarak tutarken Matrix,
Telegram ve gelecekteki canlı taşımaların tek bir açık taşıma sözleşmesi
kontrol listesini paylaşmasını sağlar.

Docker'ı QA yoluna dahil etmeden tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass guest başlatır, bağımlılıkları kurar, guest içinde OpenClaw'ı derler, `qa suite` çalıştırır, ardından normal QA raporunu ve özetini host üzerinde `.artifacts/qa-e2e/...` konumuna geri kopyalar.
Host üzerinde `qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır.
Host ve Multipass paket çalıştırmaları, seçilen birden çok senaryoyu varsayılan olarak yalıtılmış gateway worker'larıyla paralel yürütür. `qa-channel` varsayılan olarak 4 eşzamanlılık kullanır ve bu, seçilen senaryo sayısıyla sınırlanır. Worker sayısını ayarlamak için `--concurrency <count>`, seri yürütme için `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact almak istediğinizde `--allow-failures` kullanın.
Canlı çalıştırmalar, guest için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir: env tabanlı provider anahtarları, QA canlı provider yapılandırma yolu ve mevcut olduğunda `CODEX_HOME`. Guest'in bağlanan workspace üzerinden geri yazabilmesi için `--output-dir` değerini repo kökü altında tutun.

## Telegram, Discord ve Slack QA başvurusu

Matrix'in senaryo sayısı ve Docker destekli homeserver sağlama süreci nedeniyle [ayrı bir sayfası](/tr/concepts/qa-matrix) vardır. Telegram, Discord ve Slack daha küçüktür; her biri birkaç senaryo içerir, profil sistemi yoktur ve önceden var olan gerçek kanallara karşı çalışır. Bu nedenle başvuruları burada yer alır.

### Paylaşılan CLI bayrakları

Bu hatlar `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` üzerinden kaydolur ve aynı bayrakları kabul eder:

| Bayrak                                | Varsayılan                                                     | Açıklama                                                                                                                |
| ------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                              | Yalnızca bu senaryoyu çalıştır. Tekrarlanabilir.                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Raporların/özetin/gözlemlenen mesajların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` değerine göre çözülür. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Nötr bir cwd'den çağırırken depo kökü.                                                                                  |
| `--sut-account <id>`                  | `sut`                                                          | QA Gateway yapılandırması içindeki geçici hesap kimliği.                                                                |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` veya `live-frontier` (eski `live-openai` hâlâ çalışır).                                                   |
| `--model <ref>` / `--alt-model <ref>` | provider varsayılanı                                          | Birincil/alternatif model referansları.                                                                                 |
| `--fast`                              | kapalı                                                         | Desteklendiği yerde provider hızlı modu.                                                                                |
| `--credential-source <env\|convex>`   | `env`                                                          | Bkz. [Convex kimlik bilgisi havuzu](#convex-kimlik-bilgisi-havuzu).                                                     |
| `--credential-role <maintainer\|ci>`  | CI içinde `ci`, aksi halde `maintainer`                        | `--credential-source convex` kullanıldığında kullanılan rol.                                                            |

Her hat, herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. `--allow-failures`, başarısız çıkış kodu ayarlamadan artifact yazar.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

İki farklı botla (driver + SUT) tek bir gerçek özel Telegram grubunu hedefler. SUT botunun bir Telegram kullanıcı adı olmalıdır; botlar arası gözlem, her iki botta da `@BotFather` içinde **Bot-to-Bot Communication Mode** etkin olduğunda en iyi şekilde çalışır.

`--credential-source env` kullanıldığında gerekli env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — sayısal sohbet kimliği (dize).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`, gözlemlenen mesaj artifact'lerinde mesaj gövdelerini tutar (varsayılan olarak redakte edilir).

Senaryolar (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Çıktı artifact'leri:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — canary ile başlayarak yanıt başına RTT (driver gönderimi → gözlemlenen SUT yanıtı) içerir.
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` değilse gövdeler redakte edilir.

### Discord QA

```bash
pnpm openclaw qa discord
```

İki botla tek bir gerçek özel Discord guild kanalını hedefler: harness tarafından denetlenen bir driver botu ve birlikte gelen Discord Plugin aracılığıyla alt OpenClaw Gateway tarafından başlatılan bir SUT botu. Kanal mention işleme davranışını, SUT botunun Discord ile yerel `/help` komutunu kaydettiğini ve isteğe bağlı Mantis kanıt senaryolarını doğrular.

`--credential-source env` kullanıldığında gerekli env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord tarafından döndürülen SUT bot kullanıcı kimliğiyle eşleşmelidir (aksi halde hat hızlı başarısız olur).

İsteğe bağlı:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`, gözlemlenen mesaj artifact'lerinde mesaj gövdelerini tutar.

Senaryolar (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — isteğe bağlı Mantis senaryosu. SUT'u `messages.statusReactions.enabled=true` ile her zaman açık, yalnızca araç kullanan guild yanıtlarına geçirdiği için tek başına çalışır; ardından bir REST tepki zaman çizelgesi ile HTML/PNG görsel artifact yakalar.

Mantis durum tepki senaryosunu açıkça çalıştırın:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Çıktı artifact'leri:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` değilse gövdeler redakte edilir.
- Durum tepki senaryosu çalıştığında `discord-qa-reaction-timelines.json` ve `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

İki farklı botla tek bir gerçek özel Slack kanalını hedefler: harness tarafından denetlenen bir driver botu ve birlikte gelen Slack Plugin aracılığıyla alt OpenClaw Gateway tarafından başlatılan bir SUT botu.

`--credential-source env` kullanıldığında gerekli env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`, gözlemlenen mesaj artifact'lerinde mesaj gövdelerini tutar.

Senaryolar (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Çıktı artifact'leri:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` değilse gövdeler redakte edilir.

### Convex kimlik bilgisi havuzu

Telegram, Discord ve Slack hatları, yukarıdaki env vars değerlerini okumak yerine paylaşılan bir Convex havuzundan kimlik bilgisi kiralayabilir. `--credential-source convex` geçirin (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın); QA Lab özel bir lease alır, çalıştırma süresince Heartbeat gönderir ve kapanışta serbest bırakır. Havuz türleri `"telegram"`, `"discord"` ve `"slack"` değerleridir.

Broker'ın `admin/add` üzerinde doğruladığı payload şekilleri:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` sayısal bir sohbet kimliği dizesi olmalıdır.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operasyonel env vars ve Convex broker endpoint sözleşmesi [Testing → Shared Telegram credentials via Convex](/tr/help/testing#shared-telegram-credentials-via-convex-v1) içinde yer alır (bölüm adı Discord desteğinden öncedir; broker semantiği iki tür için de aynıdır).

## Repo destekli seed'ler

Seed asset'leri `qa/` içinde bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar, QA planının hem insanlar hem de agent tarafından görülebilmesi için kasıtlı olarak git içinde tutulur.

`qa-lab` genel amaçlı bir markdown runner olarak kalmalıdır. Her senaryo markdown dosyası, bir test çalıştırması için doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo metaverisi
- isteğe bağlı kategori, yetenek, hat ve risk metaverisi
- doküman ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı Gateway yapılandırma yaması
- yürütülebilir `qa-flow`

`qa-flow` arkasındaki yeniden kullanılabilir runtime yüzeyinin genel ve kesişen kapsamda kalmasına izin verilir. Örneğin, markdown senaryoları, özel durum runner'ı eklemeden gömülü Control UI'ı Gateway `browser.request` seam'i üzerinden süren browser tarafı yardımcılarla transport tarafı yardımcıları birleştirebilir.

Senaryo dosyaları kaynak ağaç klasörüne göre değil, ürün yeteneğine göre gruplanmalıdır. Dosyalar taşındığında senaryo kimliklerini kararlı tutun; uygulama izlenebilirliği için `docsRefs` ve `codeRefs` kullanın.

Baseline listesi şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- thread davranışı
- mesaj eylemi yaşam döngüsü
- cron callback'leri
- bellek hatırlama
- model değiştirme
- subagent devri
- repo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Provider mock hatları

`qa suite` iki yerel provider mock hattına sahiptir:

- `mock-openai`, senaryo farkındalığı olan OpenClaw mock'udur. Repo destekli QA ve eşdeğerlik gate'leri için varsayılan deterministik mock hattı olarak kalır.
- `aimock`, deneysel protokol, fixture, kayıt/yeniden oynatma ve kaos kapsamı için AIMock destekli bir provider sunucusu başlatır. Bu eklemlidir ve `mock-openai` senaryo dispatcher'ının yerine geçmez.

Provider hattı uygulaması `extensions/qa-lab/src/providers/` altında yer alır. Her provider kendi varsayılanlarına, yerel sunucu başlatmasına, Gateway model yapılandırmasına, auth-profile staging gereksinimlerine ve canlı/mock yetenek bayraklarına sahiptir. Paylaşılan paket ve Gateway kodu, provider adlarına göre dallanmak yerine provider registry üzerinden yönlendirilmelidir.

## Transport adapter'ları

`qa-lab`, markdown QA senaryoları için genel bir transport seam'ine sahiptir. `qa-channel`, bu seam üzerindeki ilk adapter'dır; ancak tasarım hedefi daha geniştir: gelecekteki gerçek veya sentetik kanallar, transport'a özel bir QA runner eklemek yerine aynı paket runner'ına bağlanmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütmeyi, worker eşzamanlılığını, artifact yazmayı ve raporlamayı sahiplenir.
- Transport adapter'ı Gateway yapılandırmasını, hazır olma durumunu, gelen ve giden gözlemi, transport eylemlerini ve normalleştirilmiş transport durumunu sahiplenir.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir runtime yüzeyini sağlar.

### Kanal ekleme

Markdown QA sistemine bir kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir transport adapter'ı.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` host'u akışı sahiplenebildiğinde yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan ana makine mekaniklerinin sahibidir:

- `openclaw qa` komut kökü
- paket başlatma ve kapatma
- worker eşzamanlılığı
- artifact yazma
- rapor oluşturma
- senaryo yürütme
- daha eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı Plugin'leri taşıma sözleşmesinin sahibidir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökü altına nasıl bağlandığı
- Gateway'in bu taşıma için nasıl yapılandırıldığı
- hazır olma durumunun nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden iletilerin nasıl gözlemlendiği
- dökümlerin ve normalleştirilmiş taşıma durumunun nasıl sunulduğu
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşımaya özgü sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir kanal için minimum benimseme eşiği:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab` öğesini koruyun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` ana makine bağlantı noktasında uygulayın.
3. Taşımaya özgü mekanikleri çalıştırıcı Plugin'inde veya kanal harness'inde tutun.
4. Çalıştırıcıyı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın. Çalıştırıcı Plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır. `runtime-api.ts` hafif kalmalıdır; lazy CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo bilinçli bir geçiş yapmadığı sürece mevcut uyumluluk takma adlarının çalışmasını sürdürün.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu ilgili çalıştırıcı Plugin'inde veya Plugin harness'inde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir kabiliyet gerektiriyorsa, `suite.ts` içinde kanala özgü bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşımaya özgü tutun ve bunu senaryo sözleşmesinde açıkça belirtin.

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

Uyumluluk takma adları mevcut senaryolar için kullanılabilir durumda kalır — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ancak yeni senaryo yazımı genel adları kullanmalıdır. Takma adlar, bundan sonraki model olarak değil, tek seferde kapsamlı bir geçişten kaçınmak için vardır.

## Raporlama

`qa-lab`, gözlemlenen bus zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu soruları yanıtlamalıdır:

- Ne çalıştı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryoları eklemeye değer

Kullanılabilir senaryoların envanteri için — takip çalışmasını boyutlandırırken veya yeni bir taşıma bağlarken kullanışlıdır — `pnpm openclaw qa coverage` çalıştırın (makine tarafından okunabilir çıktı için `--json` ekleyin).

Karakter ve stil denetimleri için aynı senaryoyu birden fazla canlı model
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

Komut, Docker değil yerel QA gateway alt süreçlerini çalıştırır. Karakter değerlendirme
senaryoları persona'yı `SOUL.md` aracılığıyla ayarlamalı, ardından sohbet, çalışma alanı yardımı ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır. Aday modele değerlendirildiği
söylenmemelidir. Komut her tam
dökümü korur, temel çalıştırma istatistiklerini kaydeder, ardından desteklenen yerlerde `xhigh` reasoning ile hızlı modda judge modellerinden çalıştırmaları doğallık, vibe ve mizah açısından sıralamasını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: judge prompt'u yine
her dökümü ve çalıştırma durumunu alır, ancak aday ref'leri `candidate-01` gibi tarafsız
etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek ref'lerle
eşleştirir.
Aday çalıştırmaları varsayılan olarak `high` thinking kullanır; GPT-5.5 için `medium`, bunu destekleyen daha eski OpenAI değerlendirme ref'leri için `xhigh` kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` hâlâ
genel bir fallback ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday ref'leri varsayılan olarak hızlı moda geçer; böylece sağlayıcının desteklediği yerlerde
öncelikli işleme kullanılır. Tek bir adayın veya judge'ın geçersiz kılmaya ihtiyacı olduğunda satır içine `,fast`, `,no-fast` veya `,fast=false` ekleyin. Hızlı modu her aday model için zorlamak istediğinizde yalnızca `--fast` geçirin. Aday ve judge süreleri
benchmark analizi için rapora kaydedilir, ancak judge prompt'ları açıkça
hıza göre sıralama yapmamayı söyler.
Aday ve judge model çalıştırmaları ikisi de varsayılan olarak 16 eşzamanlılık kullanır. Sağlayıcı limitleri veya yerel gateway
baskısı bir çalıştırmayı fazla gürültülü hale getirdiğinde
`--concurrency` veya `--judge-concurrency` değerini düşürün.
Aday `--model` geçirilmediğinde karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
`--judge-model` geçirilmediğinde judge'lar varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili belgeler

- [Matrix QA](/tr/concepts/qa-matrix)
- [QA Kanalı](/tr/channels/qa-channel)
- [Test Etme](/tr/help/testing)
- [Dashboard](/tr/web/dashboard)

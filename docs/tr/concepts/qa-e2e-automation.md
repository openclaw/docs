---
read_when:
    - QA yığınının nasıl bir araya geldiğini anlama
    - qa-lab, qa-channel veya bir taşıma bağdaştırıcısını genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha gerçekçi QA otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, depo destekli senaryolar, canlı aktarım hatları, aktarım bağdaştırıcıları ve raporlama.'
title: Kalite güvencesine genel bakış
x-i18n:
    generated_at: "2026-05-05T06:17:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw'ı tek bir birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde sınamak içindir.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veri yolu.
- `extensions/qa-matrix`, gelecekteki çalıştırıcı Plugin'leri: alt QA gateway içinde
  gerçek bir kanalı süren canlı aktarım bağdaştırıcıları.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için repo destekli başlangıç varlıkları.
- [Mantis](/tr/concepts/mantis): gerçek aktarımlar, tarayıcı ekran görüntüleri, VM durumu ve PR kanıtı gerektiren hatalar için
  canlı doğrulamadan önce ve sonra.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Birçoğunun `pnpm qa:*`
betik takma adları vardır; her iki biçim de desteklenir.

| Komut                                               | Amaç                                                                                                                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Paketlenmiş QA öz denetimi; Markdown raporu yazar.                                                                                                                                          |
| `qa suite`                                          | QA gateway hattına karşı repo destekli senaryolar çalıştırır. Takma adlar: tek kullanımlık bir Linux VM için `pnpm openclaw qa suite --runner multipass`.                                  |
| `qa coverage`                                       | Markdown senaryo kapsam envanterini yazdırır (makine çıktısı için `--json`).                                                                                                                |
| `qa parity-report`                                  | İki `qa-suite-summary.json` dosyasını karşılaştırır ve agentic eşlik raporunu yazar.                                                                                                       |
| `qa character-eval`                                 | Karakter QA senaryosunu, değerlendirilmiş bir raporla birden fazla canlı modelde çalıştırır. Bkz. [Raporlama](#reporting).                                                                 |
| `qa manual`                                         | Seçilen sağlayıcı/model hattına karşı tek seferlik bir istem çalıştırır.                                                                                                                    |
| `qa ui`                                             | QA hata ayıklayıcı UI'ını ve yerel QA veri yolunu başlatır (takma ad: `pnpm qa:lab:ui`).                                                                                                    |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını derler.                                                                                                                                               |
| `qa docker-scaffold`                                | QA panosu + gateway hattı için docker-compose iskelesi yazar.                                                                                                                               |
| `qa up`                                             | QA sitesini derler, Docker destekli yığını başlatır, URL'yi yazdırır (takma ad: `pnpm qa:lab:up`; `:fast` varyantı `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler).            |
| `qa aimock`                                         | Yalnızca AIMock sağlayıcı sunucusunu başlatır.                                                                                                                                              |
| `qa mock-openai`                                    | Yalnızca senaryo farkındalığı olan `mock-openai` sağlayıcı sunucusunu başlatır.                                                                                                             |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetir.                                                                                                                                          |
| `qa matrix`                                         | Tek kullanımlık Tuwunel homeserver'a karşı canlı aktarım hattı. Bkz. [Matrix QA](/tr/concepts/qa-matrix).                                                                                      |
| `qa telegram`                                       | Gerçek bir özel Telegram grubuna karşı canlı aktarım hattı.                                                                                                                                 |
| `qa discord`                                        | Gerçek bir özel Discord guild kanalına karşı canlı aktarım hattı.                                                                                                                           |
| `qa slack`                                          | Gerçek bir özel Slack kanalına karşı canlı aktarım hattı.                                                                                                                                   |
| `qa mantis`                                         | Canlı aktarım hataları için, Discord durum tepkileri kanıtı, Crabbox masaüstü/tarayıcı smoke testi ve VNC içinde Slack smoke testiyle birlikte önce ve sonra doğrulama çalıştırıcısı. Bkz. [Mantis](/tr/concepts/mantis). |

## Operatör akışı

Geçerli QA operatör akışı iki panelli bir QA sitesidir:

- Sol: ajanla birlikte Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve bir operatörün ya da otomasyon döngüsünün ajana bir QA
görevi verebileceği, gerçek kanal davranışını gözlemleyebileceği ve neyin çalıştığını, başarısız olduğunu veya
engelli kaldığını kaydedebileceği QA Lab sayfasını sunar.

Docker imajını her seferinde yeniden derlemeden daha hızlı QA Lab UI yinelemesi için,
yığını bind mount edilmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker hizmetlerini önceden derlenmiş bir imajda tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` kapsayıcısına bind mount eder. `qa:lab:watch`
bu paketi değişiklikte yeniden derler ve QA Lab varlık karması değiştiğinde tarayıcı otomatik yeniden yüklenir.

Yerel bir OpenTelemetry izleme smoke testi için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu betik yerel bir OTLP/HTTP iz alıcısı başlatır,
`diagnostics-otel` Plugin'i etkin halde `otel-trace-smoke` QA senaryosunu çalıştırır, ardından
dışa aktarılan protobuf span'lerini çözer ve sürüm açısından kritik şekli doğrular:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` ve `openclaw.message.delivery` mevcut olmalıdır;
model çağrıları başarılı turn'lerde `StreamAbandoned` dışa aktarmamalıdır; ham tanılama ID'leri ve
`openclaw.content.*` öznitelikleri iz dışında kalmalıdır. QA suite yapıtlarının yanına
`otel-smoke-summary.json` yazar.

Gözlemlenebilirlik QA yalnızca kaynak checkout'ta kalır. npm tarball bilinçli olarak
QA Lab'i dışarıda bırakır, bu yüzden paket Docker sürüm hatları `qa` komutlarını çalıştırmaz. Tanılama
enstrümantasyonunu değiştirirken derlenmiş bir kaynak checkout'undan
`pnpm qa:otel:smoke` kullanın.

Aktarımı gerçek bir Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Bu hat için tam CLI başvurusu, profil/senaryo kataloğu, ortam değişkenleri ve yapıt düzeni [Matrix QA](/tr/concepts/qa-matrix) içinde yer alır. Kısaca: Docker içinde tek kullanımlık bir Tuwunel homeserver sağlar, geçici driver/SUT/observer kullanıcıları kaydeder, gerçek Matrix Plugin'ini bu aktarıma kapsamlanmış bir alt QA gateway içinde çalıştırır (`qa-channel` yok), ardından `.artifacts/qa-e2e/matrix-<timestamp>/` altında bir Markdown raporu, JSON özeti, gözlemlenen olaylar yapıtı ve birleşik çıktı günlüğü yazar.

Aktarımı gerçek Telegram, Discord ve Slack smoke hatları için:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Bunlar iki botla (driver + SUT) önceden mevcut gerçek bir kanalı hedefler. Gerekli ortam değişkenleri, senaryo listeleri, çıktı yapıtları ve Convex kimlik bilgisi havuzu aşağıdaki [Telegram, Discord ve Slack QA başvurusu](#telegram-discord-and-slack-qa-reference) bölümünde belgelenmiştir.

VNC kurtarmalı tam Slack masaüstü VM çalıştırması için şunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bu komut bir Crabbox masaüstü/tarayıcı makinesi kiralar, Slack canlı hattını
VM içinde çalıştırır, VNC tarayıcısında Slack Web'i açar, masaüstünü yakalar ve
video yakalama mevcut olduğunda `slack-qa/`, `slack-desktop-smoke.png` ve `slack-desktop-smoke.mp4`
dosyalarını Mantis yapıt dizinine geri kopyalar. Slack Web'e VNC üzerinden manuel giriş yaptıktan sonra `--lease-id <cbx_...>` kullanın.
`--gateway-setup` ile Mantis, VM içinde `38973` bağlantı noktasında kalıcı bir OpenClaw Slack
gateway'i çalışır durumda bırakır; onsuz komut normal bot'tan bot'a Slack QA hattını çalıştırır ve yapıt yakalamadan sonra çıkar.

Ajan/CV tarzı bir masaüstü görevi için şunu çalıştırın:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task`, bir Crabbox masaüstü/tarayıcı makinesi kiralar veya yeniden kullanır,
`crabbox record --while` başlatır, görünür tarayıcıyı iç içe bir
`visual-driver` üzerinden sürer, `visual-task.png` yakalar, `--vision-mode image-describe` seçildiğinde
ekran görüntüsüne karşı `openclaw infer image describe` çalıştırır ve
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` ve `mantis-visual-task-report.md` yazar.
`--expect-text` ayarlandığında vision istemi yapılandırılmış bir JSON
kararı ister ve yalnızca model pozitif görünür kanıt bildirdiğinde geçer;
yalnızca hedef metni alıntılayan negatif bir yanıt doğrulamayı başarısız kılar.
Görüntü anlama sağlayıcısı çağırmadan masaüstü, tarayıcı, ekran görüntüsü ve video tesisatını kanıtlayan modelsiz smoke testi için
`--vision-mode metadata` kullanın. Kayıt, `visual-task` için gerekli bir yapıttır; Crabbox boş olmayan bir
`visual-task.mp4` kaydetmezse, görsel driver geçmiş olsa bile görev başarısız olur. Başarısızlıkta Mantis, görev zaten geçmiş ve
`--keep-lease` ayarlanmamış olmadığı sürece kiralamayı VNC için tutar.

Havuzlanmış canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex broker ortamını denetler, uç nokta ayarlarını doğrular ve maintainer sırrı mevcut olduğunda admin/list erişilebilirliğini doğrular. Sırlar için yalnızca ayarlı/eksik durumunu raporlar.

## Canlı aktarım kapsamı

Canlı aktarım hatları, her birinin kendi senaryo listesi şeklini icat etmesi yerine tek bir sözleşme paylaşır. `qa-channel` geniş sentetik ürün davranışı suite'idir ve canlı aktarım kapsam matrisinin parçası değildir.

| Hat      | Kanarya | Bahsetme geçitlemesi | Botlar arası | İzin listesi engeli | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | Konu takibi | Konu izolasyonu | Tepki gözlemi | Yardım komutu | Yerel komut kaydı |
| -------- | ------- | -------------------- | ------------ | ------------------- | ---------------- | --------------------------------- | ----------- | --------------- | ------------- | ------------- | ------------------ |
| Matrix   | x       | x                    | x            | x                   | x                | x                                 | x           | x               | x             |               |                    |
| Telegram | x       | x                    | x            |                     |                  |                                   |             |                 |               | x             |                    |
| Discord  | x       | x                    | x            |                     |                  |                                   |             |                 |               |               | x                  |
| Slack    | x       | x                    | x            |                     |                  |                                   |             |                 |               |               |                    |

Bu, Matrix, Telegram ve gelecekteki canlı aktarımlar tek bir açık aktarım sözleşmesi kontrol listesini paylaşırken `qa-channel`ı geniş ürün davranışı paketi olarak tutar.

QA yoluna Docker dahil etmeden tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass konuğu başlatır, bağımlılıkları kurar, konuğun içinde OpenClaw'u derler, `qa suite` çalıştırır, ardından normal QA raporunu ve özetini ana makinedeki `.artifacts/qa-e2e/...` içine kopyalar.
Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır.
Ana makine ve Multipass paket çalıştırmaları, varsayılan olarak izole Gateway işçileriyle birden fazla seçili senaryoyu paralel yürütür. `qa-channel` varsayılan olarak eşzamanlılığı 4 yapar ve seçili senaryo sayısıyla sınırlar. İşçi sayısını ayarlamak için `--concurrency <count>` kullanın veya seri yürütme için `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan yapıtlar istediğinizde `--allow-failures` kullanın.
Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir: ortam tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve mevcut olduğunda `CODEX_HOME`. Konuğun bağlanmış çalışma alanı üzerinden geri yazabilmesi için `--output-dir` değerini depo kökü altında tutun.

## Telegram, Discord ve Slack QA başvurusu

Matrix'in senaryo sayısı ve Docker destekli homeserver hazırlaması nedeniyle [ayrılmış bir sayfası](/tr/concepts/qa-matrix) vardır. Telegram, Discord ve Slack daha küçüktür; her biri birkaç senaryodan oluşur, profil sistemi yoktur ve önceden var olan gerçek kanallara karşı çalışır; bu yüzden başvuruları burada yer alır.

### Paylaşılan CLI bayrakları

Bu hatlar `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` üzerinden kaydolur ve aynı bayrakları kabul eder:

| Bayrak                                | Varsayılan                                                     | Açıklama                                                                                                                        |
| ------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                              | Yalnızca bu senaryoyu çalıştırır. Tekrarlanabilir.                                                                              |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Raporların/özetin/gözlemlenen mesajların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` temel alınarak çözülür. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Tarafsız bir cwd'den çağırırken depo kökü.                                                                                      |
| `--sut-account <id>`                  | `sut`                                                          | QA Gateway yapılandırmasının içindeki geçici hesap kimliği.                                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` veya `live-frontier` (eski `live-openai` hala çalışır).                                                           |
| `--model <ref>` / `--alt-model <ref>` | sağlayıcı varsayılanı                                          | Birincil/alternatif model başvuruları.                                                                                          |
| `--fast`                              | kapalı                                                         | Desteklendiğinde sağlayıcı hızlı modu.                                                                                          |
| `--credential-source <env\|convex>`   | `env`                                                          | Bkz. [Convex kimlik bilgisi havuzu](#convex-credential-pool).                                                                   |
| `--credential-role <maintainer\|ci>`  | CI'da `ci`, aksi halde `maintainer`                            | `--credential-source convex` olduğunda kullanılan rol.                                                                          |

Her hat, herhangi bir başarısız senaryoda sıfır olmayan kodla çıkar. `--allow-failures`, başarısız çıkış kodu ayarlamadan yapıtları yazar.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

İki ayrı botu (sürücü + SUT) olan bir gerçek özel Telegram grubunu hedefler. SUT botunun bir Telegram kullanıcı adı olmalıdır; botlar arası gözlem, iki botta da `@BotFather` içinde **Bot-to-Bot Communication Mode** etkin olduğunda en iyi şekilde çalışır.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — sayısal sohbet kimliği (dize).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`, gözlemlenen mesaj yapıtlarında mesaj gövdelerini tutar (varsayılan olarak redakte edilir).

Senaryolar (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Çıktı yapıtları:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — kanarya ile başlayarak yanıt başına RTT'yi (sürücü gönderimi → gözlemlenen SUT yanıtı) içerir.
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.

### Discord QA

```bash
pnpm openclaw qa discord
```

İki botu olan bir gerçek özel Discord guild kanalını hedefler: donanım tarafından denetlenen bir sürücü botu ve çocuk OpenClaw Gateway tarafından paketlenmiş Discord Plugin üzerinden başlatılan bir SUT botu. Kanal bahsetme işlemesini, SUT botunun yerel `/help` komutunu Discord'a kaydetmiş olduğunu ve katılımlı Mantis kanıt senaryolarını doğrular.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord tarafından döndürülen SUT bot kullanıcı kimliğiyle eşleşmelidir (aksi halde hat hızlı başarısız olur).

İsteğe bağlı:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`, gözlemlenen mesaj yapıtlarında mesaj gövdelerini tutar.

Senaryolar (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — katılımlı Mantis senaryosu. SUT'yi `messages.statusReactions.enabled=true` ile her zaman açık, yalnızca araç kullanan guild yanıtlarına geçirdiği, ardından REST tepki zaman çizelgesini ve HTML/PNG görsel yapıtlarını yakaladığı için tek başına çalışır. Mantis önce/sonra raporları, senaryo tarafından sağlanan MP4 yapıtlarını da `baseline.mp4` ve `candidate.mp4` olarak korur.

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

### Slack QA

```bash
pnpm openclaw qa slack
```

İki ayrı botu olan bir gerçek özel Slack kanalını hedefler: donanım tarafından denetlenen bir sürücü botu ve çocuk OpenClaw Gateway tarafından paketlenmiş Slack Plugin üzerinden başlatılan bir SUT botu.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`, gözlemlenen mesaj yapıtlarında mesaj gövdelerini tutar.

Senaryolar (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Çıktı yapıtları:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.

#### Slack çalışma alanını ayarlama

Hat, tek bir çalışma alanında iki ayrı Slack uygulamasına ve iki botun da üye olduğu bir kanala ihtiyaç duyar:

- `channelId` — iki botun da davet edildiği kanalın `Cxxxxxxxxxx` kimliği. Ayrılmış bir kanal kullanın; hat her çalıştırmada gönderi paylaşır.
- `driverBotToken` — **Driver** uygulamasının bot belirteci (`xoxb-...`).
- `sutBotToken` — SUT bot kullanıcı kimliğinin farklı olması için sürücüden ayrı bir Slack uygulaması olması gereken **SUT** uygulamasının bot belirteci (`xoxb-...`).
- `sutAppToken` — Socket Mode tarafından kullanılan, SUT uygulamasının olayları alabilmesi için `connections:write` iznine sahip SUT uygulamasının uygulama düzeyi belirteci (`xapp-...`).

Bir üretim çalışma alanını yeniden kullanmak yerine QA'ya ayrılmış bir Slack çalışma alanını tercih edin.

Aşağıdaki SUT manifesti, paketlenmiş Slack Plugin üretim kurulumunu yansıtır (`extensions/slack/src/setup-shared.ts:10`). Üretim kanalı kurulumunun kullanıcılar tarafından görülen hali için bkz. [Slack kanalı hızlı kurulumu](/tr/channels/slack#quick-setup); QA Driver/SUT çifti kasıtlı olarak ayrıdır çünkü hattın tek çalışma alanında iki ayrı bot kullanıcı kimliğine ihtiyacı vardır.

**1. Driver uygulamasını oluşturun**

[api.slack.com/apps](https://api.slack.com/apps) adresine gidin → _Create New App_ → _From a manifest_ → QA çalışma alanını seçin, aşağıdaki manifesti yapıştırın, ardından _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

_Bot User OAuth Token_ (`xoxb-...`) değerini kopyalayın; bu `driverBotToken` olur. Sürücünün yalnızca mesaj göndermesi ve kendini tanımlaması gerekir; olay yok, Socket Mode yok.

**2. SUT uygulamasını oluşturun**

Aynı çalışma alanında _Create New App → From a manifest_ adımlarını tekrarlayın. Kapsam kümesi, paketlenmiş Slack Plugin üretim kurulumunu yansıtır (`extensions/slack/src/setup-shared.ts:10`):

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Slack uygulamayı oluşturduktan sonra ayarlar sayfasında iki şey yapın:

- _Install to Workspace_ → _Bot User OAuth Token_ değerini kopyalayın → bu `sutBotToken` olur.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → `connections:write` kapsamını ekleyin → kaydedin → `xapp-...` değerini kopyalayın → bu `sutAppToken` olur.

Her token üzerinde `auth.test` çağırarak iki botun farklı kullanıcı kimliklerine sahip olduğunu doğrulayın. Runtime, sürücüyü ve SUT'yi kullanıcı kimliğine göre ayırt eder; ikisi için tek bir uygulamayı yeniden kullanmak, bahsetme kapılamasında hemen başarısız olur.

**3. Kanalı oluşturun**

QA çalışma alanında bir kanal oluşturun (örn. `#openclaw-qa`) ve kanal içinden iki botu da davet edin:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_ içinden `Cxxxxxxxxxx` kimliğini kopyalayın; bu `channelId` olur. Herkese açık bir kanal çalışır; özel kanal kullanırsanız iki uygulamada zaten `groups:history` bulunduğundan harness'ın geçmiş okumaları yine başarılı olur.

**4. Kimlik bilgilerini kaydedin**

İki seçenek vardır. Tek makineli hata ayıklama için env var'ları kullanın (dört `OPENCLAW_QA_SLACK_*` değişkenini ayarlayın ve `--credential-source env` geçin) veya CI ve diğer bakımcıların kiralayabilmesi için paylaşılan Convex havuzunu tohumlayın.

Convex havuzu için dört alanı bir JSON dosyasına yazın:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Shell'inizde `OPENCLAW_QA_CONVEX_SITE_URL` ve `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dışa aktarılmışken kaydedin ve doğrulayın:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`, `status: "active"` ve `lease` alanının olmamasını bekleyin.

**5. Baştan sona doğrulayın**

İki botun broker üzerinden birbiriyle konuşabildiğini doğrulamak için hattı yerel olarak çalıştırın:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Yeşil bir çalışma 30 saniyenin çok altında tamamlanır ve `slack-qa-report.md`, hem `slack-canary` hem de `slack-mention-gating` için durumun `pass` olduğunu gösterir. Hat yaklaşık 90 saniye takılı kalır ve `Convex credential pool exhausted for kind "slack"` ile çıkarsa havuz ya boştur ya da her satır kiralanmıştır; `qa credentials list --kind slack --status all --json` hangisi olduğunu gösterir.

### Convex kimlik bilgisi havuzu

Telegram, Discord ve Slack hatları yukarıdaki env var'ları okumak yerine paylaşılan bir Convex havuzundan kimlik bilgisi kiralayabilir. `--credential-source convex` geçin (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın); QA Lab özel bir kiralama alır, çalışmanın süresi boyunca buna Heartbeat gönderir ve kapanışta serbest bırakır. Havuz türleri `"telegram"`, `"discord"` ve `"slack"` şeklindedir.

Broker'ın `admin/add` üzerinde doğruladığı payload şekilleri:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` sayısal bir sohbet kimliği dizgesi olmalıdır.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId`, `^[A-Z][A-Z0-9]+$` ile eşleşmelidir (`Cxxxxxxxxxx` gibi bir Slack kimliği). Uygulama ve kapsam sağlama için [Slack çalışma alanını ayarlama](#setting-up-the-slack-workspace) bölümüne bakın.

Operasyonel env var'lar ve Convex broker uç noktası sözleşmesi [Test Etme → Convex aracılığıyla paylaşılan Telegram kimlik bilgileri](/tr/help/testing#shared-telegram-credentials-via-convex-v1) içinde yer alır (bölüm adı Discord desteğinden öncedir; broker semantiği her iki tür için de aynıdır).

## Repo destekli tohumlar

Tohum varlıkları `qa/` içinde yer alır:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar bilerek git içinde tutulur; böylece QA planı hem insanlar hem de agent tarafından görülebilir.

`qa-lab` genel bir markdown runner olarak kalmalıdır. Her senaryo markdown dosyası, bir test çalışması için doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo metadata'sı
- isteğe bağlı kategori, capability, hat ve risk metadata'sı
- doküman ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı Gateway yapılandırma yamaları
- çalıştırılabilir `qa-flow`

`qa-flow`'u destekleyen yeniden kullanılabilir runtime yüzeyinin genel ve kesişen kapsamda kalmasına izin verilir. Örneğin markdown senaryoları, Gateway `browser.request` hattı üzerinden gömülü Control UI'ı süren tarayıcı tarafı yardımcılarla taşıma tarafı yardımcıları birleştirebilir; bunun için özel durum runner'ı eklenmez.

Senaryo dosyaları, kaynak ağacı klasörü yerine ürün capability'sine göre gruplanmalıdır. Dosyalar taşındığında senaryo kimliklerini sabit tutun; uygulama izlenebilirliği için `docsRefs` ve `codeRefs` kullanın.

Temel liste şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- thread davranışı
- mesaj eylemi yaşam döngüsü
- cron geri çağrıları
- bellek hatırlama
- model değiştirme
- subagent devri
- repo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı mock hatları

`qa suite` iki yerel sağlayıcı mock hattına sahiptir:

- `mock-openai`, senaryo farkındalığı olan OpenClaw mock'udur. Repo destekli QA ve parity kapıları için varsayılan deterministik mock hattı olarak kalır.
- `aimock`, deneysel protokol, fixture, kayıt/yeniden oynatma ve chaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Eklemelidir ve `mock-openai` senaryo dispatcher'ının yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında yer alır. Her sağlayıcı kendi varsayılanlarından, yerel sunucu başlatmadan, Gateway model yapılandırmasından, auth-profile hazırlama ihtiyaçlarından ve canlı/mock capability bayraklarından sorumludur. Paylaşılan suite ve Gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirmelidir.

## Taşıma adaptörleri

`qa-lab`, markdown QA senaryoları için genel bir taşıma hattına sahiptir. `qa-channel` bu hattaki ilk adaptördür, ancak tasarım hedefi daha geniştir: gelecekteki gerçek veya sentetik kanallar, taşıma özelinde bir QA runner eklemek yerine aynı suite runner'a bağlanmalıdır.

Mimari düzeyde ayrım şudur:

- `qa-lab`, genel senaryo yürütme, worker eşzamanlılığı, artifact yazma ve raporlamadan sorumludur.
- Taşıma adaptörü Gateway yapılandırması, hazır olma, gelen ve giden gözlem, taşıma eylemleri ve normalize edilmiş taşıma durumundan sorumludur.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalışmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir runtime yüzeyini sağlar.

### Kanal ekleme

Markdown QA sistemine kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma adaptörü.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` host'u akışı sahiplenebiliyorsa yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab` paylaşılan host mekaniklerinden sorumludur:

- `openclaw qa` komut kökü
- suite başlatma ve kapatma
- worker eşzamanlılığı
- artifact yazma
- rapor oluşturma
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Runner Plugin'leri taşıma sözleşmesinden sorumludur:

- `openclaw qa <runner>`'ın paylaşılan `qa` kökü altına nasıl bağlandığı
- Gateway'in bu taşıma için nasıl yapılandırıldığı
- hazır olmanın nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- transcript'lerin ve normalize edilmiş taşıma durumunun nasıl dışa açıldığı
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşımaya özel sıfırlama veya temizlemenin nasıl ele alındığı

Yeni bir kanal için minimum benimseme eşiği:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`'ı tutun.
2. Taşıma runner'ını paylaşılan `qa-lab` host hattında uygulayın.
3. Taşımaya özgü mekanikleri runner Plugin veya kanal harness içinde tutun.
4. Runner'ı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın. Runner Plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır. `runtime-api.ts` hafif kalmalıdır; lazy CLI ve runner yürütmesi ayrı entrypoint'lerin arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Repo bilinçli bir geçiş yapmadığı sürece mevcut uyumluluk takma adlarını çalışır tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu ilgili runner Plugin veya Plugin harness içinde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir capability gerektiriyorsa, `suite.ts` içinde kanala özel bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca bir taşıma için anlamlıysa, senaryoyu taşımaya özel tutun ve bunu senaryo sözleşmesinde açık hale getirin.

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

Mevcut senaryolar için uyumluluk takma adları kullanılabilir kalır: `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`; ancak yeni senaryo yazımı genel adları kullanmalıdır. Takma adlar, bir bayrak günü geçişinden kaçınmak için vardır; bundan sonraki model olarak değil.

## Raporlama

`qa-lab`, gözlemlenen bus zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şunları yanıtlamalıdır:

- Ne çalıştı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryoları eklemeye değer

Kullanılabilir senaryoların envanteri için, takip işini boyutlandırırken veya yeni bir taşıma bağlarken yararlı olacak şekilde, `pnpm openclaw qa coverage` çalıştırın (makine tarafından okunabilir çıktı için `--json` ekleyin).

Karakter ve stil denetimleri için aynı senaryoyu birden fazla canlı model ref'i üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

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
senaryoları kişiliği `SOUL.md` aracılığıyla ayarlamalı, ardından sohbet, çalışma alanı yardımı
ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam dökümü korur, temel çalıştırma istatistiklerini kaydeder, ardından desteklenen yerlerde `xhigh` akıl yürütmeyle hızlı modda jüri modellerinden çalıştırmaları doğallık, atmosfer ve mizaha göre sıralamasını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: jüri istemi yine de
her dökümü ve çalıştırma durumunu alır, ancak aday referansları `candidate-01` gibi
nötr etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek referanslarla eşler.
Aday çalıştırmaları varsayılan olarak `high` düşünme kullanır; GPT-5.5 için `medium`, bunu destekleyen eski OpenAI değerlendirme referansları için `xhigh` kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` yine
genel bir yedek değer ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday referansları varsayılan olarak hızlı moda ayarlanır; böylece sağlayıcının
desteklediği yerlerde öncelikli işleme kullanılır. Tek bir aday veya jüri için geçersiz kılma
gerektiğinde satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin. Yalnızca
her aday model için hızlı modu zorlamak istediğinizde `--fast` geçirin. Aday ve jüri süreleri
karşılaştırma analizi için rapora kaydedilir, ancak jüri istemleri açıkça
hıza göre sıralama yapılmamasını söyler.
Aday ve jüri modeli çalıştırmalarının her ikisi de varsayılan olarak 16 eşzamanlılık kullanır. Sağlayıcı sınırları veya yerel Gateway
baskısı bir çalıştırmayı fazla gürültülü hale getirdiğinde `--concurrency` veya `--judge-concurrency` değerini düşürün.
Aday `--model` geçirilmediğinde, karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
`--judge-model` geçirilmediğinde, jüriler varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` kullanır.

## İlgili dokümanlar

- [Matrix QA](/tr/concepts/qa-matrix)
- [QA Kanalı](/tr/channels/qa-channel)
- [Test Etme](/tr/help/testing)
- [Pano](/tr/web/dashboard)

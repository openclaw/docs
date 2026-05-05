---
read_when:
    - QA yığınının nasıl bir bütün oluşturduğunu anlamak
    - qa-lab, qa-channel veya bir taşıma adaptörünü genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu için daha gerçekçi kalite güvence otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, depo destekli senaryolar, canlı taşıma hatları, taşıma bağdaştırıcıları ve raporlama.'
title: QA genel bakışı
x-i18n:
    generated_at: "2026-05-05T01:45:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw'ı tek birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir yolla çalıştırmak için tasarlanmıştır.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeyleri olan sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajlar enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veri yolu.
- `extensions/qa-matrix`, gelecekteki çalıştırıcı Plugin'leri: alt QA gateway içinde gerçek bir kanalı
  süren canlı taşıma bağdaştırıcıları.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için repo destekli çekirdek varlıklar.
- [Mantis](/tr/concepts/mantis): gerçek taşımalar, tarayıcı ekran görüntüleri,
  VM durumu ve PR kanıtı gerektiren hatalar için canlı doğrulamadan önce ve sonra.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Birçoğunun `pnpm qa:*`
betik takma adları vardır; iki biçim de desteklenir.

| Komut                                               | Amaç                                                                                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Paketlenmiş QA öz denetimi; Markdown raporu yazar.                                                                                                                                          |
| `qa suite`                                          | Repo destekli senaryoları QA gateway hattına karşı çalıştırın. Takma adlar: tek kullanımlık Linux VM için `pnpm openclaw qa suite --runner multipass`.                                      |
| `qa coverage`                                       | Markdown senaryo kapsamı envanterini yazdırın (makine çıktısı için `--json`).                                                                                                               |
| `qa parity-report`                                  | İki `qa-suite-summary.json` dosyasını karşılaştırın ve ajan temelli parite raporunu yazın.                                                                                                  |
| `qa character-eval`                                 | Karakter QA senaryosunu, değerlendirilen bir raporla birden fazla canlı modelde çalıştırın. Bkz. [Raporlama](#reporting).                                                                   |
| `qa manual`                                         | Seçilen sağlayıcı/model hattına karşı tek seferlik bir istem çalıştırın.                                                                                                                    |
| `qa ui`                                             | QA hata ayıklayıcı UI'ını ve yerel QA veri yolunu başlatın (takma ad: `pnpm qa:lab:ui`).                                                                                                    |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını oluşturun.                                                                                                                                            |
| `qa docker-scaffold`                                | QA panosu + gateway hattı için bir docker-compose iskeleti yazın.                                                                                                                           |
| `qa up`                                             | QA sitesini oluşturun, Docker destekli yığını başlatın, URL'yi yazdırın (takma ad: `pnpm qa:lab:up`; `:fast` varyantı `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler).          |
| `qa aimock`                                         | Yalnızca AIMock sağlayıcı sunucusunu başlatın.                                                                                                                                              |
| `qa mock-openai`                                    | Yalnızca senaryo farkındalığı olan `mock-openai` sağlayıcı sunucusunu başlatın.                                                                                                             |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetin.                                                                                                                                          |
| `qa matrix`                                         | Tek kullanımlık Tuwunel homeserver'a karşı canlı taşıma hattı. Bkz. [Matrix QA](/tr/concepts/qa-matrix).                                                                                       |
| `qa telegram`                                       | Gerçek özel Telegram grubuna karşı canlı taşıma hattı.                                                                                                                                      |
| `qa discord`                                        | Gerçek özel Discord guild kanalına karşı canlı taşıma hattı.                                                                                                                                |
| `qa slack`                                          | Gerçek özel Slack kanalına karşı canlı taşıma hattı.                                                                                                                                        |
| `qa mantis`                                         | Discord durum tepkileri kanıtı, Crabbox masaüstü/tarayıcı smoke testi ve VNC içinde Slack smoke testi ile canlı taşıma hataları için önce ve sonra doğrulama çalıştırıcısı. Bkz. [Mantis](/tr/concepts/mantis). |

## Operatör akışı

Mevcut QA operatör akışı iki panelli bir QA sitesidir:

- Sol: Ajanla birlikte Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini oluşturur, Docker destekli gateway hattını başlatır ve bir
operatörün ya da otomasyon döngüsünün ajana QA görevi verebildiği, gerçek kanal
davranışını gözlemleyebildiği ve neyin çalıştığını, başarısız olduğunu veya
engellenmiş kaldığını kaydedebildiği QA Lab sayfasını sunar.

Her seferinde Docker imajını yeniden oluşturmadan daha hızlı QA Lab UI yinelemesi için,
yığını bind mount edilmiş QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden oluşturulmuş bir imajda tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` konteynerine bind mount eder.
`qa:lab:watch` bu paketi değişiklikte yeniden oluşturur ve QA Lab
varlık karması değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

Yerel OpenTelemetry iz smoke testi için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu betik yerel bir OTLP/HTTP iz alıcısı başlatır,
`diagnostics-otel` Plugin'i etkinleştirilmiş olarak `otel-trace-smoke` QA senaryosunu çalıştırır, ardından
dışa aktarılan protobuf span'lerini çözer ve sürüm açısından kritik şekli doğrular:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` ve `openclaw.message.delivery` mevcut olmalıdır;
model çağrıları başarılı dönüşlerde `StreamAbandoned` dışa aktarmamalıdır; ham tanılama ID'leri ve
`openclaw.content.*` öznitelikleri iz dışında kalmalıdır. QA suite artifact'lerinin yanına
`otel-smoke-summary.json` yazar.

Gözlemlenebilirlik QA'sı yalnızca kaynak checkout'ı olarak kalır. npm tarball'ı kasıtlı olarak
QA Lab'i içermez, bu nedenle paket Docker sürüm hatları `qa` komutlarını çalıştırmaz. Tanılama
enstrümantasyonunu değiştirirken oluşturulmuş bir kaynak checkout'ından
`pnpm qa:otel:smoke` kullanın.

Taşıma-gerçek Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Bu hat için tam CLI başvurusu, profil/senaryo kataloğu, env vars ve artifact düzeni [Matrix QA](/tr/concepts/qa-matrix) içinde yer alır. Kısaca: Docker içinde tek kullanımlık bir Tuwunel homeserver sağlar, geçici driver/SUT/observer kullanıcılarını kaydeder, gerçek Matrix Plugin'ini bu taşımaya kapsamlanmış bir alt QA gateway içinde çalıştırır (`qa-channel` yok), ardından `.artifacts/qa-e2e/matrix-<timestamp>/` altında Markdown raporu, JSON özeti, gözlemlenen olaylar artifact'i ve birleşik çıktı günlüğü yazar.

Taşıma-gerçek Telegram, Discord ve Slack smoke hatları için:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Bunlar iki botlu (driver + SUT) önceden mevcut gerçek bir kanalı hedefler. Gerekli env vars, senaryo listeleri, çıktı artifact'leri ve Convex kimlik bilgisi havuzu aşağıdaki [Telegram, Discord ve Slack QA başvurusu](#telegram-discord-and-slack-qa-reference) bölümünde belgelenmiştir.

VNC kurtarmalı tam Slack masaüstü VM çalıştırması için şunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bu komut bir Crabbox masaüstü/tarayıcı makinesi kiralar, Slack canlı hattını
VM içinde çalıştırır, Slack Web'i VNC tarayıcısında açar, masaüstünü yakalar ve
`slack-qa/` ile `slack-desktop-smoke.png` dosyasını Mantis artifact
dizinine kopyalar. VNC üzerinden Slack Web'e elle giriş yaptıktan sonra
`--lease-id <cbx_...>` değerini yeniden kullanın. `--gateway-setup` ile Mantis,
VM içinde `38973` portunda kalıcı bir OpenClaw Slack gateway çalışır durumda bırakır;
onsuz, komut normal botlar arası Slack QA hattını çalıştırır ve artifact yakalamadan sonra çıkar.

Havuzlanmış canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex aracı env değerlerini denetler, endpoint ayarlarını doğrular ve maintainer sırrı mevcut olduğunda admin/liste erişilebilirliğini doğrular. Sırlar için yalnızca ayarlı/eksik durumunu bildirir.

## Canlı taşıma kapsamı

Canlı taşıma hatları, her birinin kendi senaryo listesi şeklini icat etmesi yerine tek bir sözleşme paylaşır. `qa-channel`, geniş sentetik ürün davranışı suite'idir ve canlı taşıma kapsam matrisinin parçası değildir.

| Hat      | Canary | Mention gating | Botlar arası | Allowlist bloğu | Üst düzey yanıt | Yeniden başlatma sürdürme | İş parçacığı takibi | İş parçacığı yalıtımı | Tepki gözlemi | Yardım komutu | Yerel komut kaydı |
| -------- | ------ | -------------- | ------------ | --------------- | --------------- | ------------------------- | ------------------- | --------------------- | ------------- | ------------- | ----------------- |
| Matrix   | x      | x              | x            | x               | x               | x                         | x                   | x                     | x             |               |                   |
| Telegram | x      | x              | x            |                 |                 |                           |                     |                       |               | x             |                   |
| Discord  | x      | x              | x            |                 |                 |                           |                     |                       |               |               | x                 |
| Slack    | x      | x              | x            |                 |                 |                           |                     |                       |               |               |                   |

Bu, `qa-channel`'ı geniş ürün davranışı suite'i olarak tutarken Matrix,
Telegram ve gelecekteki canlı taşımaların tek bir açık taşıma sözleşmesi
kontrol listesini paylaşmasını sağlar.

QA yoluna Docker'ı dahil etmeden tek kullanımlık Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass konuğunu başlatır, bağımlılıkları kurar, konuğun içinde OpenClaw'ı derler, `qa suite` çalıştırır, ardından normal QA raporunu ve özetini konakta `.artifacts/qa-e2e/...` altına kopyalar.
Konakta `qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır.
Konak ve Multipass paket çalıştırmaları, seçilen birden fazla senaryoyu varsayılan olarak yalıtılmış gateway worker'larıyla paralel yürütür. `qa-channel` varsayılan olarak 4 eşzamanlılık kullanır ve seçilen senaryo sayısıyla sınırlandırılır. Worker sayısını ayarlamak için `--concurrency <count>`, seri yürütme için `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan yapıtlar istediğinizde `--allow-failures` kullanın.
Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve mevcutsa `CODEX_HOME`. Konuğun bağlanan çalışma alanı üzerinden geri yazabilmesi için `--output-dir` değerini depo kökü altında tutun.

## Telegram, Discord ve Slack QA başvurusu

Matrix, senaryo sayısı ve Docker destekli homeserver hazırlığı nedeniyle [ayrı bir sayfaya](/tr/concepts/qa-matrix) sahiptir. Telegram, Discord ve Slack daha küçüktür: her biri birkaç senaryo, profil sistemi yok, önceden var olan gerçek kanallara karşı çalışır; bu yüzden başvuruları burada bulunur.

### Paylaşılan CLI bayrakları

Bu hatlar `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` üzerinden kaydolur ve aynı bayrakları kabul eder:

| Bayrak                                | Varsayılan                                                     | Açıklama                                                                                                                        |
| ------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                              | Yalnızca bu senaryoyu çalıştır. Tekrarlanabilir.                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Raporların/özetin/gözlemlenen mesajların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` temel alınarak çözülür. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Nötr bir cwd'den çağırırken depo kökü.                                                                                          |
| `--sut-account <id>`                  | `sut`                                                          | QA Gateway yapılandırmasındaki geçici hesap kimliği.                                                                            |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` veya `live-frontier` (eski `live-openai` hâlâ çalışır).                                                           |
| `--model <ref>` / `--alt-model <ref>` | sağlayıcı varsayılanı                                          | Birincil/alternatif model referansları.                                                                                         |
| `--fast`                              | kapalı                                                         | Desteklendiği yerlerde sağlayıcı hızlı modu.                                                                                    |
| `--credential-source <env\|convex>`   | `env`                                                          | Bkz. [Convex kimlik bilgisi havuzu](#convex-credential-pool).                                                                   |
| `--credential-role <maintainer\|ci>`  | CI'da `ci`, aksi halde `maintainer`                            | `--credential-source convex` olduğunda kullanılan rol.                                                                          |

Her hat, başarısız olan herhangi bir senaryoda sıfır olmayan kodla çıkar. `--allow-failures`, başarısız çıkış kodu ayarlamadan yapıtları yazar.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

İki ayrı botu (sürücü + SUT) olan tek bir gerçek özel Telegram grubunu hedefler. SUT botunun bir Telegram kullanıcı adı olmalıdır; botlar arası gözlem en iyi, her iki botta da `@BotFather` içinde **Botlar Arası İletişim Modu** etkin olduğunda çalışır.

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

Çıktı yapıtları:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — canary ile başlayarak yanıt başına RTT'yi (sürücü gönderimi → gözlemlenen SUT yanıtı) içerir.
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.

### Discord QA

```bash
pnpm openclaw qa discord
```

İki botu olan tek bir gerçek özel Discord guild kanalını hedefler: harness tarafından kontrol edilen bir sürücü botu ve paketlenmiş Discord Plugin'i üzerinden alt OpenClaw Gateway tarafından başlatılan bir SUT botu. Kanal bahsi işlemeyi, SUT botunun yerel `/help` komutunu Discord'a kaydetmiş olduğunu ve isteğe bağlı Mantis kanıt senaryolarını doğrular.

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
- `discord-status-reactions-tool-only` — isteğe bağlı Mantis senaryosu. SUT'yi `messages.statusReactions.enabled=true` ile her zaman açık, yalnızca araç kullanan guild yanıtlarına geçirdiği, ardından bir REST tepki zaman çizelgesi ile HTML/PNG görsel yapıtı yakaladığı için tek başına çalışır.

Mantis durum-tepkisi senaryosunu açıkça çalıştırın:

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
- Durum-tepkisi senaryosu çalıştığında `discord-qa-reaction-timelines.json` ve `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

İki ayrı botu olan tek bir gerçek özel Slack kanalını hedefler: harness tarafından kontrol edilen bir sürücü botu ve paketlenmiş Slack Plugin'i üzerinden alt OpenClaw Gateway tarafından başlatılan bir SUT botu.

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

Hattın tek bir çalışma alanında iki ayrı Slack uygulamasına ve her iki botun da üye olduğu bir kanala ihtiyacı vardır:

- `channelId` — her iki botun da davet edildiği bir kanalın `Cxxxxxxxxxx` kimliği. Ayrılmış bir kanal kullanın; hat her çalıştırmada gönderi yapar.
- `driverBotToken` — **Driver** uygulamasının bot token'ı (`xoxb-...`).
- `sutBotToken` — **SUT** uygulamasının bot token'ı (`xoxb-...`); bot kullanıcı kimliğinin ayrı olması için sürücüden ayrı bir Slack uygulaması olmalıdır.
- `sutAppToken` — SUT uygulamasının, Socket Mode tarafından SUT uygulamasının olay alabilmesi için kullanılan `connections:write` kapsamına sahip uygulama düzeyi token'ı (`xapp-...`).

Üretim çalışma alanını yeniden kullanmak yerine QA'ya ayrılmış bir Slack çalışma alanını tercih edin.

Aşağıdaki SUT manifesti, paketlenmiş Slack Plugin'inin üretim kurulumunu yansıtır (`extensions/slack/src/setup-shared.ts:10`). Kullanıcıların gördüğü üretim kanalı kurulumu için [Slack kanal hızlı kurulumu](/tr/channels/slack#quick-setup) bölümüne bakın; QA Driver/SUT çifti, hattın tek çalışma alanında iki ayrı bot kullanıcı kimliğine ihtiyaç duyması nedeniyle kasıtlı olarak ayrıdır.

**1. Driver uygulamasını oluşturun**

[api.slack.com/apps](https://api.slack.com/apps) adresine gidin → _Create New App_ → _From a manifest_ → QA çalışma alanını seçin, aşağıdaki manifesti yapıştırın, ardından _Install to Workspace_ seçeneğini kullanın:

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

_Bot User OAuth Token_ değerini (`xoxb-...`) kopyalayın; bu `driverBotToken` olur. Sürücünün yalnızca mesaj göndermesi ve kendini tanımlaması gerekir; olay yok, Socket Mode yok.

**2. SUT uygulamasını oluşturun**

Aynı çalışma alanında _Create New App → From a manifest_ işlemini tekrarlayın. Kapsam kümesi, paketlenmiş Slack Plugin'inin üretim kurulumunu yansıtır (`extensions/slack/src/setup-shared.ts:10`):

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

İki botun farklı kullanıcı kimliklerine sahip olduğunu, her token üzerinde `auth.test` çağırarak doğrulayın. Runtime, sürücü ile SUT'u kullanıcı kimliğine göre ayırt eder; ikisi için de aynı uygulamayı yeniden kullanmak bahsetme kapılamasında hemen başarısız olur.

**3. Kanalı oluşturun**

QA çalışma alanında bir kanal oluşturun (ör. `#openclaw-qa`) ve kanalın içinden iki botu da davet edin:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_Channel info → About → Channel ID_ içinden `Cxxxxxxxxxx` kimliğini kopyalayın; bu, `channelId` olur. Herkese açık bir kanal çalışır; özel kanal kullanırsanız iki uygulamada da zaten `groups:history` bulunduğundan harness'ın geçmiş okumaları yine başarılı olur.

**4. Kimlik bilgilerini kaydedin**

İki seçenek vardır. Tek makineli hata ayıklama için env vars kullanın (dört `OPENCLAW_QA_SLACK_*` değişkenini ayarlayın ve `--credential-source env` iletin) veya CI ve diğer bakımcıların bunları kiralayabilmesi için paylaşılan Convex havuzunu besleyin.

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

`count: 1`, `status: "active"` bekleyin; `lease` alanı olmamalıdır.

**5. Uçtan uca doğrulayın**

İki botun broker üzerinden birbirleriyle konuşabildiğini doğrulamak için lane'i yerelde çalıştırın:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Yeşil bir çalışma 30 saniyenin oldukça altında tamamlanır ve `slack-qa-report.md`, hem `slack-canary` hem de `slack-mention-gating` için `pass` durumunu gösterir. Lane yaklaşık 90 saniye takılır ve `Convex credential pool exhausted for kind "slack"` ile çıkarsa havuz ya boştur ya da her satır kiralanmıştır; `qa credentials list --kind slack --status all --json` hangisi olduğunu gösterir.

### Convex kimlik bilgileri havuzu

Telegram, Discord ve Slack lane'leri yukarıdaki env vars değerlerini okumak yerine paylaşılan Convex havuzundan kimlik bilgisi kiralayabilir. `--credential-source convex` iletin (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın); QA Lab özel bir kira alır, çalışma süresince Heartbeat gönderir ve kapanışta serbest bırakır. Havuz türleri `"telegram"`, `"discord"` ve `"slack"` değerleridir.

Broker'ın `admin/add` üzerinde doğruladığı payload biçimleri:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` sayısal bir sohbet kimliği dizesi olmalıdır.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId`, `^[A-Z][A-Z0-9]+$` ile eşleşmelidir (`Cxxxxxxxxxx` gibi bir Slack kimliği). Uygulama ve kapsam sağlaması için [Slack çalışma alanını ayarlama](#setting-up-the-slack-workspace) bölümüne bakın.

Operasyonel env vars ve Convex broker uç noktası sözleşmesi [Test Etme → Convex üzerinden paylaşılan Telegram kimlik bilgileri](/tr/help/testing#shared-telegram-credentials-via-convex-v1) içinde bulunur (bölüm adı Discord desteğinden eskidir; broker semantiği iki tür için de aynıdır).

## Depo destekli başlangıç verileri

Başlangıç varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

QA planının hem insanlar hem de agent tarafından görülebilmesi için bunlar bilinçli olarak git içinde tutulur.

`qa-lab` genel bir Markdown çalıştırıcısı olarak kalmalıdır. Her senaryo Markdown dosyası, bir test çalışması için doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo metadata'sı
- isteğe bağlı kategori, yetenek, lane ve risk metadata'sı
- doküman ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı Gateway yapılandırma yamaları
- çalıştırılabilir `qa-flow`

`qa-flow`'u destekleyen yeniden kullanılabilir runtime yüzeyinin genel ve kesişen alanlara uygun kalmasına izin verilir. Örneğin, Markdown senaryoları, özel durum çalıştırıcısı eklemeden gömülü Control UI'ı Gateway `browser.request` dikişi üzerinden süren tarayıcı tarafı yardımcılarıyla transport tarafı yardımcılarını birleştirebilir.

Senaryo dosyaları kaynak ağacı klasörü yerine ürün yeteneğine göre gruplanmalıdır. Dosyalar taşındığında senaryo kimliklerini kararlı tutun; uygulama izlenebilirliği için `docsRefs` ve `codeRefs` kullanın.

Temel liste şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- thread davranışı
- mesaj eylemi yaşam döngüsü
- Cron callback'leri
- bellekten geri çağırma
- model değiştirme
- subagent devri
- depo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir build görevi

## Sağlayıcı mock lane'leri

`qa suite` iki yerel sağlayıcı mock lane'ine sahiptir:

- `mock-openai`, senaryo farkında OpenClaw mock'udur. Depo destekli QA ve parity gate'leri için varsayılan deterministik mock lane olarak kalır.
- `aimock`, deneysel protokol, fixture, kayıt/yeniden oynatma ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Ekleyicidir ve `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı lane uygulaması `extensions/qa-lab/src/providers/` altında bulunur. Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlatmasına, Gateway model yapılandırmasına, auth-profile hazırlama ihtiyaçlarına ve canlı/mock yetenek bayraklarına sahiptir. Paylaşılan suite ve gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı registry'si üzerinden yönlendirme yapmalıdır.

## Transport adapter'ları

`qa-lab`, Markdown QA senaryoları için genel bir transport dikişine sahiptir. `qa-channel`, bu dikişteki ilk adapter'dır, ancak tasarım hedefi daha geniştir: gelecekteki gerçek veya sentetik kanallar, transport'a özel bir QA çalıştırıcısı eklemek yerine aynı suite çalıştırıcısına takılmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütmeyi, worker eşzamanlılığını, artifact yazmayı ve raporlamayı sahiplenir.
- Transport adapter'ı Gateway yapılandırmasını, hazır olma durumunu, gelen ve giden gözlemi, transport eylemlerini ve normalize edilmiş transport durumunu sahiplenir.
- `qa/scenarios/` altındaki Markdown senaryo dosyaları test çalışmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir runtime yüzeyini sağlar.

### Kanal ekleme

Markdown QA sistemine kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir transport adapter'ı.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` host'u akışı sahiplenebiliyorsa yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan host mekaniklerini sahiplenir:

- `openclaw qa` komut kökü
- suite başlatma ve sonlandırma
- worker eşzamanlılığı
- artifact yazma
- rapor oluşturma
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk alias'ları

Runner Plugin'leri transport sözleşmesini sahiplenir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökü altına nasıl bağlandığı
- Gateway'in bu transport için nasıl yapılandırıldığı
- hazır olma durumunun nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- transcript'lerin ve normalize edilmiş transport durumunun nasıl sunulduğu
- transport destekli eylemlerin nasıl yürütüldüğü
- transport'a özel sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir kanal için minimum benimseme çıtası:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`'i tutun.
2. Transport runner'ını paylaşılan `qa-lab` host dikişinde uygulayın.
3. Transport'a özel mekanikleri runner Plugin'i veya kanal harness'ı içinde tutun.
4. Rakip bir kök komut kaydetmek yerine runner'ı `openclaw qa <runner>` olarak bağlayın. Runner Plugin'leri `openclaw.plugin.json` içinde `qaRunners` beyan etmeli ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır. `runtime-api.ts` hafif tutulmalıdır; tembel CLI ve runner yürütmesi ayrı entrypoint'lerin arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında Markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo bilinçli bir migration yapmadıkça mevcut uyumluluk alias'larını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa `qa-lab` içine koyun.
- Davranış tek bir kanal transport'una bağlıysa o runner Plugin'inde veya Plugin harness'ında tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yetenek gerektiriyorsa `suite.ts` içinde kanala özel bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir transport için anlamlıysa senaryoyu transport'a özel tutun ve bunu senaryo sözleşmesinde açık hale getirin.

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

Uyumluluk alias'ları mevcut senaryolar için kullanılabilir kalır: `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`; ancak yeni senaryo yazımı genel adları kullanmalıdır. Alias'lar modelin ileriye dönük biçimi olarak değil, büyük bir tek seferlik migration'dan kaçınmak için vardır.

## Raporlama

`qa-lab`, gözlemlenen bus zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şunları yanıtlamalıdır:

- Ne çalıştı
- Ne başarısız oldu
- Ne engellenmiş kaldı
- Hangi takip senaryolarını eklemek değerlidir

Kullanılabilir senaryoların envanteri için, takip çalışmasını boyutlandırırken veya yeni bir transport bağlarken yararlıdır, `pnpm openclaw qa coverage` çalıştırın (makine tarafından okunabilir çıktı için `--json` ekleyin).

Karakter ve stil denetimleri için aynı senaryoyu birden çok canlı model ref'i üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

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

Komut, Docker değil, yerel QA gateway alt süreçlerini çalıştırır. Karakter değerlendirme
senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı
yardımı ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır.
Aday modele değerlendirildiği söylenmemelidir. Komut her tam konuşma dökümünü
korur, temel çalıştırma istatistiklerini kaydeder, ardından desteklendiği yerlerde
`xhigh` akıl yürütme ile hızlı modda hakem modellerden çalıştırmaları doğallık,
genel his ve mizaha göre sıralamalarını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: hakem istemi yine de
her konuşma dökümünü ve çalıştırma durumunu alır, ancak aday referansları
`candidate-01` gibi nötr etiketlerle değiştirilir; rapor, ayrıştırmadan sonra
sıralamaları gerçek referanslara geri eşler.
Aday çalıştırmalar varsayılan olarak `high` düşünme kullanır; GPT-5.5 için `medium`,
bunu destekleyen eski OpenAI değerlendirme referansları için `xhigh` kullanılır.
Belirli bir adayı satır içinde `--model provider/model,thinking=<level>` ile geçersiz kılın.
`--thinking <level>` yine de genel bir yedek ayarlar ve eski
`--model-thinking <provider/model=level>` biçimi uyumluluk için korunur.
OpenAI aday referansları varsayılan olarak hızlı modu kullanır; böylece sağlayıcının
desteklediği yerlerde öncelikli işleme kullanılır. Tek bir aday veya hakem için
geçersiz kılma gerektiğinde satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin.
Yalnızca her aday model için hızlı modu zorlamak istediğinizde `--fast` geçirin.
Aday ve hakem süreleri karşılaştırmalı değerlendirme analizi için rapora kaydedilir,
ancak hakem istemleri açıkça hıza göre sıralama yapılmamasını söyler.
Aday ve hakem model çalıştırmaları varsayılan olarak 16 eşzamanlılık kullanır.
Sağlayıcı limitleri veya yerel gateway baskısı bir çalıştırmayı fazla gürültülü
hale getirdiğinde `--concurrency` veya `--judge-concurrency` değerini düşürün.
Aday `--model` geçirilmediğinde, karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
`--judge-model` geçirilmediğinde, hakemler varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` kullanır.

## İlgili belgeler

- [Matrix QA](/tr/concepts/qa-matrix)
- [QA Kanalı](/tr/channels/qa-channel)
- [Test Etme](/tr/help/testing)
- [Pano](/tr/web/dashboard)

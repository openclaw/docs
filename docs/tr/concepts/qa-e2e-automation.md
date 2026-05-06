---
read_when:
    - QA yığınının birlikte nasıl çalıştığını anlamak
    - qa-lab, qa-channel veya bir taşıma adaptörünü genişletme
    - Repo destekli QA senaryoları ekleme
    - Gateway panosu için daha gerçekçi kalite güvencesi otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, repo destekli senaryolar, canlı taşıma hatları, taşıma adaptörleri ve raporlama.'
title: QA genel bakışı
x-i18n:
    generated_at: "2026-05-06T09:10:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw'ı tek bir birim testin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak içindir.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veriyolu.
- `extensions/qa-matrix`, gelecekteki çalıştırıcı plugin'leri: alt QA gateway içinde gerçek bir kanalı
  süren canlı aktarım bağdaştırıcıları.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için repo destekli tohum varlıklar.
- [Mantis](/tr/concepts/mantis): gerçek aktarımlar, tarayıcı ekran görüntüleri, VM durumu ve PR kanıtı
  gerektiren hatalar için önce ve sonra canlı doğrulama.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Birçoğunun `pnpm qa:*`
betik takma adları vardır; iki biçim de desteklenir.

| Komut                                               | Amaç                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Paketlenmiş QA öz denetimi; Markdown raporu yazar.                                                                                                                                                                                                                        |
| `qa suite`                                          | Repo destekli senaryoları QA gateway hattına karşı çalıştırır. Takma adlar: tek kullanımlık bir Linux VM için `pnpm openclaw qa suite --runner multipass`.                                                                                                                                  |
| `qa coverage`                                       | Markdown senaryo kapsam envanterini yazdırır (makine çıktısı için `--json`).                                                                                                                                                                                           |
| `qa parity-report`                                  | İki `qa-suite-summary.json` dosyasını karşılaştırır ve agentic parite raporunu yazar.                                                                                                                                                                                          |
| `qa character-eval`                                 | Karakter QA senaryosunu, değerlendirilen bir raporla birden çok canlı modelde çalıştırır. Bkz. [Raporlama](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Seçilen sağlayıcı/model hattına karşı tek seferlik bir istem çalıştırır.                                                                                                                                                                                                          |
| `qa ui`                                             | QA hata ayıklayıcı UI ve yerel QA veriyolunu başlatır (takma ad: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını oluşturur.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | QA panosu + gateway hattı için bir docker-compose iskelesi yazar.                                                                                                                                                                                                    |
| `qa up`                                             | QA sitesini oluşturur, Docker destekli yığını başlatır, URL'yi yazdırır (takma ad: `pnpm qa:lab:up`; `:fast` varyantı `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler).                                                                                                  |
| `qa aimock`                                         | Yalnızca AIMock sağlayıcı sunucusunu başlatır.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Yalnızca senaryo farkındalığı olan `mock-openai` sağlayıcı sunucusunu başlatır.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetir.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Tek kullanımlık bir Tuwunel homeserver'a karşı canlı aktarım hattı. Bkz. [Matrix QA](/tr/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Gerçek bir özel Telegram grubuna karşı canlı aktarım hattı.                                                                                                                                                                                                              |
| `qa discord`                                        | Gerçek bir özel Discord guild kanalına karşı canlı aktarım hattı.                                                                                                                                                                                                       |
| `qa slack`                                          | Gerçek bir özel Slack kanalına karşı canlı aktarım hattı.                                                                                                                                                                                                               |
| `qa mantis`                                         | Discord durum-tepkileri kanıtı, Crabbox masaüstü/tarayıcı smoke ve Slack-in-VNC smoke ile canlı aktarım hataları için önce ve sonra doğrulama çalıştırıcısı. Bkz. [Mantis](/tr/concepts/mantis) ve [Mantis Slack Masaüstü Runbook'u](/tr/concepts/mantis-slack-desktop-runbook). |

## Operatör akışı

Geçerli QA operatör akışı iki panelli bir QA sitesidir:

- Sol: Agent ile Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini oluşturur, Docker destekli gateway hattını başlatır ve
bir operatörün ya da otomasyon döngüsünün agent'a bir QA
görevi verebileceği, gerçek kanal davranışını gözlemleyebileceği ve neyin çalıştığını, başarısız olduğunu veya
engelli kaldığını kaydedebileceği QA Lab sayfasını açığa çıkarır.

Docker imajını her seferinde yeniden oluşturmadan daha hızlı QA Lab UI yinelemesi için,
yığını bind-mounted QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker hizmetlerini önceden oluşturulmuş bir imajda tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` kapsayıcısına bind-mount eder. `qa:lab:watch`
değişiklikte bu paketi yeniden oluşturur ve QA Lab
varlık karması değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

Yerel bir OpenTelemetry iz smoke için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu betik yerel bir OTLP/HTTP iz alıcısı başlatır,
`diagnostics-otel` plugin'i etkinleştirilmiş şekilde `otel-trace-smoke` QA senaryosunu çalıştırır, ardından
dışa aktarılan protobuf span'lerini çözer ve sürüm açısından kritik şekli doğrular:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` ve `openclaw.message.delivery` mevcut olmalıdır;
model çağrıları başarılı dönüşlerde `StreamAbandoned` dışa aktarmamalıdır; ham tanılama ID'leri ve
`openclaw.content.*` öznitelikleri iz dışında kalmalıdır. QA suite artefaktlarının yanına
`otel-smoke-summary.json` yazar.

Gözlemlenebilirlik QA yalnızca kaynak checkout olarak kalır. npm tarball bilinçli olarak
QA Lab'i dışarıda bırakır, bu nedenle paket Docker sürüm hatları `qa` komutlarını çalıştırmaz.
Tanılama enstrümantasyonunu değiştirirken oluşturulmuş bir kaynak checkout'tan
`pnpm qa:otel:smoke` kullanın.

Aktarım-gerçek Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Bu hat için tam CLI referansı, profil/senaryo kataloğu, ortam değişkenleri ve artefakt düzeni [Matrix QA](/tr/concepts/qa-matrix) içinde yer alır. Özetle: Docker'da tek kullanımlık bir Tuwunel homeserver hazırlar, geçici sürücü/SUT/gözlemci kullanıcıları kaydeder, gerçek Matrix plugin'ini bu aktarıma kapsamlandırılmış alt QA gateway içinde çalıştırır (`qa-channel` yok), ardından `.artifacts/qa-e2e/matrix-<timestamp>/` altında bir Markdown raporu, JSON özeti, observed-events artefaktı ve birleşik çıktı günlüğü yazar.

Senaryolar, birim testlerin uçtan uca kanıtlayamayacağı aktarım davranışlarını kapsar: mention gating, allow-bot ilkeleri, allowlist'ler, üst düzey ve iş parçacıklı yanıtlar, DM yönlendirme, tepki işleme, gelen düzenleme bastırma, yeniden başlatma yeniden oynatma tekilleştirme, homeserver kesintisi kurtarma, onay metadata teslimi, medya işleme ve Matrix E2EE bootstrap/kurtarma/doğrulama akışları. E2EE CLI profili ayrıca gateway yanıtlarını denetlemeden önce aynı tek kullanımlık homeserver üzerinden `openclaw matrix encryption setup` ve doğrulama komutlarını da sürer.

Discord ayrıca hata yeniden üretimi için yalnızca Mantis'e özgü opt-in senaryolara sahiptir. Açık durum tepkisi
zaman çizelgesi için `--scenario discord-status-reactions-tool-only` kullanın veya gerçek bir
Discord iş parçacığı oluşturup `message.thread-reply` öğesinin bir
`filePath` ekini koruduğunu doğrulamak için `--scenario discord-thread-reply-filepath-attachment` kullanın. Bu senaryolar,
geniş smoke kapsamı yerine önce/sonra yeniden üretim probları oldukları için varsayılan canlı Discord hattının dışında kalır.
İş parçacığı-ek Mantis iş akışı, QA ortamında
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` veya
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` yapılandırıldığında oturum açılmış bir Discord Web
tanık videosu da ekleyebilir. Bu görüntüleyici profili yalnızca görsel yakalama içindir; başarılı/başarısız
kararı hâlâ Discord REST oracle'dan gelir.

CI, `.github/workflows/qa-live-transports-convex.yml` içinde aynı komut yüzeyini kullanır. Zamanlanmış ve varsayılan manuel çalıştırmalar, canlı frontier kimlik bilgileri, `--fast` ve `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` ile hızlı Matrix profilini yürütür. Manuel `matrix_profile=all`, kapsamlı kataloğun paralel çalışabilmesi ve shard başına bir artefakt dizini tutulması için beş profil shard'ına yayılır.

Aktarım-gerçek Telegram, Discord ve Slack smoke hatları için:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Bunlar iki botlu (sürücü + SUT) önceden var olan gerçek bir kanalı hedefler. Gerekli ortam değişkenleri, senaryo listeleri, çıktı artefaktları ve Convex kimlik bilgisi havuzu aşağıdaki [Telegram, Discord ve Slack QA referansı](#telegram-discord-and-slack-qa-reference) içinde belgelenmiştir.

Tam Slack masaüstü VM çalıştırmasını VNC kurtarmasıyla yapmak için şunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bu komut bir Crabbox masaüstü/tarayıcı makinesi kiralar, Slack canlı hattını VM
içinde çalıştırır, VNC tarayıcısında Slack Web'i açar, masaüstünü yakalar ve
video yakalama kullanılabildiğinde `slack-qa/`, `slack-desktop-smoke.png` ve
`slack-desktop-smoke.mp4` dosyalarını Mantis artifact dizinine geri kopyalar.
Crabbox masaüstü/tarayıcı kiralamaları yakalama araçlarını ve tarayıcı/native-build
yardımcı paketlerini baştan sağlar; bu nedenle senaryo yalnızca eski
kiralamalarda yedekleri kurmalıdır. Mantis toplam ve aşama başına süreleri
`mantis-slack-desktop-smoke-report.md` içinde raporlar; böylece yavaş
çalıştırmalarda sürenin kiralama ısıtmasına, kimlik bilgisi edinimine, uzak
kuruluma veya artifact kopyalamaya gidip gitmediği görünür. Slack Web'e VNC
üzerinden elle giriş yaptıktan sonra `--lease-id <cbx_...>` seçeneğini yeniden
kullanın; yeniden kullanılan kiralamalar Crabbox'ın pnpm store önbelleğini de
sıcak tutar. Varsayılan `--hydrate-mode source`, bir kaynak checkout'ından
doğrular ve VM içinde install/build çalıştırır. `--hydrate-mode prehydrated`
seçeneğini yalnızca yeniden kullanılan uzak çalışma alanında zaten
`node_modules` ve derlenmiş bir `dist/` bulunduğunda kullanın; bu mod pahalı
install/build adımını atlar ve çalışma alanı hazır değilse kapalı şekilde
başarısız olur. `--gateway-setup` ile Mantis, VM içinde `38973` portunda kalıcı
bir OpenClaw Slack gateway çalışır durumda bırakır; onsuz komut normal botlar
arası Slack QA hattını çalıştırır ve artifact yakalamadan sonra çıkar.

Operatör kontrol listesi, GitHub workflow dispatch komutu, kanıt yorumu
sözleşmesi, hydrate-mode karar tablosu, zamanlama yorumu ve hata işleme
adımları [Mantis Slack Masaüstü Çalıştırma Kitabı](/tr/concepts/mantis-slack-desktop-runbook)
içinde bulunur.

Agent/CV tarzı bir masaüstü görevi için şunu çalıştırın:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` bir Crabbox masaüstü/tarayıcı makinesi kiralar veya yeniden
kullanır, `crabbox record --while` başlatır, görünür tarayıcıyı iç içe bir
`visual-driver` üzerinden sürer, `visual-task.png` yakalar, `--vision-mode image-describe`
seçildiğinde ekran görüntüsüne karşı `openclaw infer image describe` çalıştırır
ve `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` ve `mantis-visual-task-report.md`
dosyalarını yazar. `--expect-text` ayarlandığında vision istemi yapılandırılmış
bir JSON kararı ister ve yalnızca model olumlu görünür kanıt bildirdiğinde
geçer; yalnızca hedef metni alıntılayan olumsuz yanıt doğrulamayı başarısız
kılar. Görüntü anlama sağlayıcısı çağırmadan masaüstünü, tarayıcıyı, ekran
görüntüsünü ve video tesisatını kanıtlayan modelsiz bir smoke için
`--vision-mode metadata` kullanın. Kayıt, `visual-task` için zorunlu bir
artifact'tir; Crabbox boş olmayan bir `visual-task.mp4` kaydetmezse görsel
sürücü geçmiş olsa bile görev başarısız olur. Hata durumunda, görev zaten
geçmemişse ve `--keep-lease` ayarlanmamışsa Mantis kiralamayı VNC için tutar.

Havuzlanmış canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex broker env'ini denetler, endpoint ayarlarını doğrular ve maintainer sırrı mevcut olduğunda admin/list erişilebilirliğini doğrular. Sırlar için yalnızca ayarlı/eksik durumunu raporlar.

## Canlı taşıma kapsamı

Canlı taşıma hatları, her birinin kendi senaryo listesi şeklini icat etmesi yerine tek bir sözleşme paylaşır. `qa-channel` geniş sentetik ürün davranışı paketidir ve canlı taşıma kapsamı matrisinin parçası değildir.

| Hat      | Canary | Bahsetme geçidi | Botlar arası | Allowlist engeli | Üst düzey yanıt | Yeniden başlatma sürdürme | Thread takibi | Thread izolasyonu | Reaction gözlemi | Help komutu | Native command kaydı |
| -------- | ------ | --------------- | ------------ | ---------------- | --------------- | ------------------------- | ------------- | ----------------- | ---------------- | ----------- | -------------------- |
| Matrix   | x      | x               | x            | x                | x               | x                         | x             | x                 | x                |             |                      |
| Telegram | x      | x               | x            |                  |                 |                           |               |                   |                  | x           |                      |
| Discord  | x      | x               | x            |                  |                 |                           |               |                   |                  |             | x                    |
| Slack    | x      | x               | x            | x                | x               | x                         | x             | x                 |                  |             |                      |

Bu, `qa-channel`'ı geniş ürün davranışı paketi olarak tutarken Matrix,
Telegram ve gelecekteki canlı taşımaların tek bir açık taşıma sözleşmesi
kontrol listesini paylaşmasını sağlar.

Docker'ı QA yoluna sokmadan tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass guest başlatır, bağımlılıkları kurar, OpenClaw'ı
guest içinde derler, `qa suite` çalıştırır, ardından normal QA raporunu ve
özetini host üzerindeki `.artifacts/qa-e2e/...` içine geri kopyalar.
Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır.
Host ve Multipass paket çalıştırmaları, seçilen birden fazla senaryoyu varsayılan
olarak izole gateway worker'larıyla paralel yürütür. `qa-channel` varsayılan
olarak concurrency 4 kullanır ve seçili senaryo sayısıyla sınırlanır. Worker
sayısını ayarlamak için `--concurrency <count>` veya seri yürütme için
`--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan çıkış koduyla çıkar.
Başarısız çıkış kodu olmadan artifact'ler istediğinizde `--allow-failures`
kullanın.
Canlı çalıştırmalar, guest için pratik olan desteklenen QA auth girdilerini iletir:
env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve mevcut
olduğunda `CODEX_HOME`. Guest'in bağlanan çalışma alanı üzerinden geri yazabilmesi
için `--output-dir` değerini repo kökü altında tutun.

## Telegram, Discord ve Slack QA başvurusu

Matrix, senaryo sayısı ve Docker destekli homeserver hazırlığı nedeniyle [özel bir sayfaya](/tr/concepts/qa-matrix) sahiptir. Telegram, Discord ve Slack daha küçüktür - her biri birkaç senaryo, profil sistemi yok, önceden var olan gerçek kanallara karşı - bu nedenle başvuruları burada bulunur.

### Paylaşılan CLI flag'leri

Bu hatlar `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` üzerinden kaydolur ve aynı flag'leri kabul eder:

| Flag                                  | Varsayılan                                                     | Açıklama                                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                              | Yalnızca bu senaryoyu çalıştır. Tekrarlanabilir.                                                                              |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Raporların/özetin/gözlemlenen mesajların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` üzerinden çözümlenir. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Nötr bir cwd'den çağırırken repository kökü.                                                                                  |
| `--sut-account <id>`                  | `sut`                                                          | QA gateway yapılandırması içindeki geçici hesap id'si.                                                                        |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` veya `live-frontier` (eski `live-openai` hâlâ çalışır).                                                         |
| `--model <ref>` / `--alt-model <ref>` | sağlayıcı varsayılanı                                         | Birincil/alternatif model ref'leri.                                                                                           |
| `--fast`                              | kapalı                                                         | Desteklendiği yerde sağlayıcı hızlı modu.                                                                                     |
| `--credential-source <env\|convex>`   | `env`                                                          | Bkz. [Convex kimlik bilgisi havuzu](#convex-credential-pool).                                                                 |
| `--credential-role <maintainer\|ci>`  | CI'da `ci`, aksi halde `maintainer`                            | `--credential-source convex` olduğunda kullanılan rol.                                                                        |

Her hat, herhangi bir başarısız senaryoda sıfır olmayan çıkış koduyla çıkar. `--allow-failures`, başarısız çıkış kodu ayarlamadan artifact'ler yazar.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

İki ayrı botu (driver + SUT) olan gerçek bir özel Telegram grubunu hedefler. SUT botunun bir Telegram kullanıcı adı olmalıdır; botlar arası gözlem, her iki botta da `@BotFather` içinde **Bot-to-Bot Communication Mode** etkin olduğunda en iyi çalışır.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - sayısal chat id'si (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` gözlemlenen mesaj artifact'lerinde mesaj gövdelerini tutar (varsayılan redakte eder).

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

Çıktı artifact'leri:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - canary ile başlayarak yanıt başına RTT (driver gönderimi → gözlemlenen SUT yanıtı) içerir.
- `telegram-qa-observed-messages.json` - `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` olmadıkça gövdeler redakte edilir.

### Discord QA

```bash
pnpm openclaw qa discord
```

İki botu olan gerçek bir özel Discord guild kanalını hedefler: harness tarafından kontrol edilen bir driver botu ve bundled Discord Plugin üzerinden child OpenClaw gateway tarafından başlatılan bir SUT botu. Kanal bahsetme işlemesini, SUT botunun Discord ile native `/help` komutunu kaydettiğini ve opt-in Mantis kanıt senaryolarını doğrular.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord tarafından döndürülen SUT bot kullanıcı id'siyle eşleşmelidir (aksi halde hat hızlı başarısız olur).

İsteğe bağlı:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` gözlemlenen mesaj artifact'lerinde mesaj gövdelerini tutar.

Senaryolar (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - opt-in Mantis senaryosu. SUT'yi `messages.statusReactions.enabled=true` ile her zaman açık, yalnızca araç kullanan guild yanıtlarına geçirdiği, ardından bir REST reaction zaman çizelgesi ve HTML/PNG görsel artifact'leri yakaladığı için tek başına çalışır. Mantis önce/sonra raporları ayrıca senaryo tarafından sağlanan MP4 artifact'lerini `baseline.mp4` ve `candidate.mp4` olarak korur.

Mantis status-reaction senaryosunu açıkça çalıştırın:

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
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.
- Durum-tepki senaryosu çalıştığında `discord-qa-reaction-timelines.json` ve `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

Tek bir gerçek özel Slack kanalını, iki ayrı botla hedefler: harness tarafından kontrol edilen bir sürücü botu ve alt OpenClaw Gateway tarafından paketle gelen Slack Plugin'i üzerinden başlatılan bir SUT botu.

`--credential-source env` kullanıldığında gerekli env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`, gözlemlenen-ileti yapıtlarında ileti gövdelerini tutar.

Senaryolar (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

Çıktı yapıtları:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.

#### Slack çalışma alanını ayarlama

Lane, tek bir çalışma alanında iki ayrı Slack uygulamasına ve her iki botun da üyesi olduğu bir kanala ihtiyaç duyar:

- `channelId` - her iki botun davet edildiği bir kanalın `Cxxxxxxxxxx` kimliği. Özel ayrılmış bir kanal kullanın; lane her çalıştırmada gönderi paylaşır.
- `driverBotToken` - **Driver** uygulamasının bot token'ı (`xoxb-...`).
- `sutBotToken` - **SUT** uygulamasının bot token'ı (`xoxb-...`); bot kullanıcı kimliği farklı olsun diye sürücüden ayrı bir Slack uygulaması olmalıdır.
- `sutAppToken` - SUT uygulamasının `connections:write` içeren uygulama düzeyi token'ı (`xapp-...`); Socket Mode tarafından SUT uygulamasının olay alabilmesi için kullanılır.

Üretim çalışma alanını yeniden kullanmak yerine QA için ayrılmış bir Slack çalışma alanını tercih edin.

Aşağıdaki SUT manifesti, paketle gelen Slack Plugin'inin üretim kurulumunu (`extensions/slack/src/setup-shared.ts:10`) kasıtlı olarak canlı Slack QA paketinin kapsadığı izinler ve olaylarla sınırlar. Kullanıcıların gördüğü üretim kanalı kurulumu için [Slack kanalı hızlı kurulumu](/tr/channels/slack#quick-setup) bölümüne bakın; QA Driver/SUT çifti kasıtlı olarak ayrıdır çünkü lane tek bir çalışma alanında iki farklı bot kullanıcı kimliğine ihtiyaç duyar.

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

_Bot User OAuth Token_ değerini (`xoxb-...`) kopyalayın - bu `driverBotToken` olur. Sürücünün yalnızca ileti göndermesi ve kendini tanımlaması gerekir; olay yok, Socket Mode yok.

**2. SUT uygulamasını oluşturun**

Aynı çalışma alanında _Create New App → From a manifest_ işlemini tekrarlayın. Bu QA uygulaması, paketle gelen Slack Plugin'inin üretim manifestinin (`extensions/slack/src/setup-shared.ts:10`) kasıtlı olarak daha dar bir sürümünü kullanır: canlı Slack QA paketi tepki işlemeyi henüz kapsamadığı için tepki kapsamları ve olayları atlanmıştır.

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
        "pin_removed"
      ]
    }
  }
}
```

Slack uygulamayı oluşturduktan sonra ayarlar sayfasında iki şey yapın:

- _Install to Workspace_ → _Bot User OAuth Token_ değerini kopyalayın → bu `sutBotToken` olur.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → `connections:write` kapsamını ekleyin → kaydedin → `xapp-...` değerini kopyalayın → bu `sutAppToken` olur.

Her token üzerinde `auth.test` çağırarak iki botun farklı kullanıcı kimliklerine sahip olduğunu doğrulayın. Runtime, sürücüyü ve SUT'yi kullanıcı kimliğine göre ayırt eder; aynı uygulamayı ikisi için yeniden kullanmak mention-gating'i hemen başarısız kılar.

**3. Kanalı oluşturun**

QA çalışma alanında bir kanal oluşturun (örn. `#openclaw-qa`) ve kanal içinden her iki botu davet edin:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_Kanal bilgisi → Hakkında → Kanal Kimliği_ içinden `Cxxxxxxxxxx` kimliğini kopyalayın - bu `channelId` olur. Herkese açık bir kanal çalışır; özel kanal kullanırsanız her iki uygulama zaten `groups:history` içerdiği için harness'in geçmiş okumaları yine başarılı olur.

**4. Kimlik bilgilerini kaydedin**

İki seçenek vardır. Tek makinede hata ayıklama için env vars kullanın (dört `OPENCLAW_QA_SLACK_*` değişkenini ayarlayın ve `--credential-source env` geçin) veya CI ve diğer bakımcıların kiralayabilmesi için paylaşılan Convex havuzunu tohumlayın.

Convex havuzu için dört alanı bir JSON dosyasına yazın:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Shell'inizde `OPENCLAW_QA_CONVEX_SITE_URL` ve `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dışa aktarılmış haldeyken kaydedin ve doğrulayın:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`, `status: "active"` bekleyin; `lease` alanı olmamalıdır.

**5. Uçtan uca doğrulayın**

Her iki botun broker üzerinden birbiriyle konuşabildiğini doğrulamak için lane'i yerelde çalıştırın:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Yeşil bir çalışma 30 saniyenin oldukça altında tamamlanır ve `slack-qa-report.md`, hem `slack-canary` hem de `slack-mention-gating` için `pass` durumunu gösterir. Lane ~90 saniye takılır ve `Convex credential pool exhausted for kind "slack"` ile çıkarsa havuz ya boştur ya da her satır kiralanmıştır - `qa credentials list --kind slack --status all --json` hangisi olduğunu söyler.

### Convex kimlik bilgisi havuzu

Telegram, Discord ve Slack lane'leri yukarıdaki env vars'ları okumak yerine paylaşılan Convex havuzundan kimlik bilgisi kiralayabilir. `--credential-source convex` geçin (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın); QA Lab özel bir kira alır, çalışma süresince Heartbeat gönderir ve kapanışta serbest bırakır. Havuz türleri `"telegram"`, `"discord"` ve `"slack"` şeklindedir.

Broker'ın `admin/add` üzerinde doğruladığı payload şekilleri:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` sayısal bir sohbet-kimliği dizesi olmalıdır.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId`, `^[A-Z][A-Z0-9]+$` ile eşleşmelidir (`Cxxxxxxxxxx` gibi bir Slack kimliği). Uygulama ve kapsam sağlama için [Slack çalışma alanını ayarlama](#setting-up-the-slack-workspace) bölümüne bakın.

Operasyonel env vars ve Convex broker uç nokta sözleşmesi [Test Etme → Convex aracılığıyla paylaşılan Telegram kimlik bilgileri](/tr/help/testing#shared-telegram-credentials-via-convex-v1) içinde yer alır (bölüm adı Discord desteğinden eskidir; broker semantiği her iki tür için aynıdır).

## Depo destekli tohumlar

Tohum varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar kasıtlı olarak git içindedir; böylece QA planı hem insanlar hem de agent tarafından görülebilir.

`qa-lab` genel amaçlı bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası tek bir test çalıştırması için doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo metadata'sı
- isteğe bağlı kategori, yetenek, lane ve risk metadata'sı
- doküman ve kod ref'leri
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı Gateway yapılandırma yaması
- çalıştırılabilir `qa-flow`

`qa-flow`u destekleyen yeniden kullanılabilir runtime yüzeyinin genel ve yatay kalmasına izin verilir. Örneğin markdown senaryoları, özel durumlu bir çalıştırıcı eklemeden Gateway `browser.request` seam'i üzerinden gömülü Control UI'ı süren tarayıcı tarafı yardımcılarla taşıma tarafı yardımcıları birleştirebilir.

Senaryo dosyaları kaynak ağacı klasörü yerine ürün yeteneğine göre gruplanmalıdır. Dosyalar taşındığında senaryo kimliklerini kararlı tutun; uygulama izlenebilirliği için `docsRefs` ve `codeRefs` kullanın.

Temel liste şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- thread davranışı
- ileti eylemi yaşam döngüsü
- Cron geri çağrıları
- bellek geri çağırma
- model değiştirme
- subagent devri
- depo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı mock lane'leri

`qa suite` iki yerel sağlayıcı mock lane'ine sahiptir:

- `mock-openai`, senaryo farkındalığı olan OpenClaw mock'udur. Depo destekli QA ve parity kapıları için varsayılan deterministik mock lane olarak kalır.
- `aimock`, deneysel protokol, fixture, kayıt/yeniden oynatma ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Eklemelidir ve `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı-lane uygulaması `extensions/qa-lab/src/providers/` altında bulunur. Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlatmaya, Gateway model yapılandırmasına, auth-profile hazırlama ihtiyaçlarına ve canlı/mock yetenek bayraklarına sahiptir. Paylaşılan paket ve Gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı registry'si üzerinden yönlendirilmelidir.

## Taşıma adapter'ları

`qa-lab`, markdown QA senaryoları için genel bir taşıma seam'ine sahiptir. `qa-channel` bu seam üzerindeki ilk adapter'dır, ancak tasarım hedefi daha geniştir: gelecekteki gerçek veya sentetik kanallar, taşıma-özel bir QA çalıştırıcısı eklemek yerine aynı paket çalıştırıcısına bağlanmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütmeyi, worker eşzamanlılığını, yapıt yazmayı ve raporlamayı sahiplenir.
- Taşıma adapter'ı Gateway yapılandırmasını, hazır olmayı, gelen ve giden gözlemi, taşıma eylemlerini ve normalize edilmiş taşıma durumunu sahiplenir.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir runtime yüzeyini sağlar.

### Kanal ekleme

Markdown QA sistemine kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma adapter'ı.
2. Kanal sözleşmesini alıştıran bir senaryo paketi.

Paylaşılan `qa-lab` host'u akışı sahiplenebiliyorken yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab` paylaşılan host mekaniklerini sahiplenir:

- `openclaw qa` komut kökü
- suite başlatma ve sonlandırma
- worker eşzamanlılığı
- artifact yazımı
- rapor oluşturma
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk diğer adları

Runner Plugin'leri transport sözleşmesine sahiptir:

- `openclaw qa <runner>` komutunun paylaşılan `qa` kökü altına nasıl monte edildiği
- Gateway'in bu transport için nasıl yapılandırıldığı
- hazır olma durumunun nasıl denetlendiği
- inbound olayların nasıl enjekte edildiği
- outbound iletilerin nasıl gözlemlendiği
- transcript'lerin ve normalleştirilmiş transport durumunun nasıl sunulduğu
- transport destekli eylemlerin nasıl yürütüldüğü
- transport'a özgü reset veya temizliğin nasıl ele alındığı

Yeni bir kanal için minimum benimseme eşiği:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab` kalsın.
2. Transport runner'ını paylaşılan `qa-lab` host seam'i üzerinde uygulayın.
3. Transport'a özgü mekanikleri runner Plugin'i veya kanal harness'i içinde tutun.
4. Runner'ı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak monte edin. Runner Plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` dosyasından eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır. `runtime-api.ts` hafif kalsın; lazy CLI ve runner yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo bilinçli bir migrasyon yapmıyorsa mevcut uyumluluk diğer adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal transport'una bağlıysa, onu ilgili runner Plugin'i veya Plugin harness'i içinde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir capability gerektiriyorsa, `suite.ts` içinde kanala özgü bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir transport için anlamlıysa, senaryoyu transport'a özgü tutun ve bunu senaryo sözleşmesinde açık hale getirin.

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

Uyumluluk diğer adları mevcut senaryolar için kullanılabilir durumda kalır - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ancak yeni senaryo yazımı genel adları kullanmalıdır. Diğer adlar, tek seferlik zorunlu migrasyonu önlemek için vardır; ileriye dönük model olarak değil.

## Raporlama

`qa-lab`, gözlemlenen bus zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şunları yanıtlamalıdır:

- Ne çalıştı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryolarını eklemek değerlidir

Kullanılabilir senaryoların envanteri için - takip işini boyutlandırırken veya yeni bir transport bağlarken kullanışlıdır - `pnpm openclaw qa coverage` komutunu çalıştırın (makine tarafından okunabilir çıktı için `--json` ekleyin).

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

Komut, Docker değil yerel QA Gateway child process'leri çalıştırır. Karakter eval
senaryoları persona'yı `SOUL.md` üzerinden ayarlamalı, ardından chat, workspace yardımı
ve küçük dosya görevleri gibi sıradan kullanıcı turn'lerini çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam transcript'i korur,
temel çalışma istatistiklerini kaydeder, ardından desteklendiği yerlerde judge modellerden fast mode'da
`xhigh` reasoning ile çalışmaları doğallık, vibe ve mizah açısından sıralamalarını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: judge prompt'u yine
her transcript'i ve çalışma durumunu alır, ancak aday ref'leri `candidate-01`
gibi nötr etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek ref'lerle eşleştirir.
Aday çalışmaları varsayılan olarak `high` thinking kullanır; GPT-5.5 için `medium`, bunu destekleyen
eski OpenAI eval ref'leri için `xhigh` kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile override edin. `--thinking <level>` hâlâ
global fallback ayarlar ve eski `--model-thinking <provider/model=level>` formu
uyumluluk için korunur.
OpenAI aday ref'leri varsayılan olarak fast mode kullanır; böylece sağlayıcının desteklediği yerlerde
priority processing kullanılır. Tek bir aday veya judge için override gerektiğinde satır içinde
`,fast`, `,no-fast` veya `,fast=false` ekleyin. Fast mode'u her aday model için
zorla açmak istediğinizde yalnızca `--fast` geçirin. Aday ve judge süreleri
benchmark analizi için rapora kaydedilir, ancak judge prompt'ları açıkça
hıza göre sıralama yapılmamasını söyler.
Aday ve judge model çalışmaları varsayılan olarak eşzamanlılığı 16 kullanır. Sağlayıcı limitleri veya yerel Gateway
baskısı bir çalışmayı çok gürültülü hale getirdiğinde `--concurrency` veya `--judge-concurrency` değerini düşürün.
Aday `--model` geçirilmediğinde, character eval varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
`--judge-model` geçirilmediğinde judge'lar varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili dokümanlar

- [Matrix QA](/tr/concepts/qa-matrix)
- [QA Channel](/tr/channels/qa-channel)
- [Test Etme](/tr/help/testing)
- [Dashboard](/tr/web/dashboard)

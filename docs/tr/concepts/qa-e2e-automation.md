---
read_when:
    - Kalite güvencesi yığınının nasıl birlikte çalıştığını anlamak
    - qa-lab, qa-channel veya bir taşıma adaptörünü genişletme
    - Depo tabanlı QA senaryoları ekleme
    - Gateway panosu için daha gerçekçi kalite güvencesi otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, depo destekli senaryolar, canlı aktarım hatları, aktarım adaptörleri ve raporlama.'
title: QA genel bakışı
x-i18n:
    generated_at: "2026-05-07T13:16:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw'ı tek birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak için tasarlanmıştır.

Geçerli parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajlar enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veri yolu.
- `extensions/qa-matrix`, gelecekteki çalıştırıcı Plugin'leri: alt QA gateway içinde gerçek bir kanalı
  süren canlı aktarım bağdaştırıcıları.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için repo destekli seed varlıkları.
- [Mantis](/tr/concepts/mantis): gerçek aktarımlar, tarayıcı ekran görüntüleri,
  VM durumu ve PR kanıtı gerektiren hatalar için önce ve sonra canlı doğrulama.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Çoğunun `pnpm qa:*`
betik takma adları vardır; her iki biçim de desteklenir.

| Komut                                               | Amaç                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Paketlenmiş QA kendi kendine denetimi; Markdown raporu yazar.                                                                                                                                                                                                          |
| `qa suite`                                          | Repo destekli senaryoları QA gateway hattına karşı çalıştırır. Takma adlar: tek kullanımlık Linux VM için `pnpm openclaw qa suite --runner multipass`.                                                                                                                 |
| `qa coverage`                                       | Markdown senaryo kapsam envanterini yazdırır (makine çıktısı için `--json`).                                                                                                                                                                                           |
| `qa parity-report`                                  | İki `qa-suite-summary.json` dosyasını karşılaştırır ve agentic parite raporunu yazar.                                                                                                                                                                                  |
| `qa character-eval`                                 | Karakter QA senaryosunu, değerlendirilen bir raporla birden çok canlı modelde çalıştırır. Bkz. [Raporlama](#reporting).                                                                                                                                               |
| `qa manual`                                         | Seçilen sağlayıcı/model hattına karşı tek seferlik bir prompt çalıştırır.                                                                                                                                                                                              |
| `qa ui`                                             | QA hata ayıklayıcı UI ve yerel QA veri yolunu başlatır (takma ad: `pnpm qa:lab:ui`).                                                                                                                                                                                   |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını oluşturur.                                                                                                                                                                                                                       |
| `qa docker-scaffold`                                | QA panosu + gateway hattı için docker-compose iskeleti yazar.                                                                                                                                                                                                          |
| `qa up`                                             | QA sitesini oluşturur, Docker destekli yığını başlatır, URL'yi yazdırır (takma ad: `pnpm qa:lab:up`; `:fast` varyantı `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler).                                                                                   |
| `qa aimock`                                         | Yalnızca AIMock sağlayıcı sunucusunu başlatır.                                                                                                                                                                                                                         |
| `qa mock-openai`                                    | Yalnızca senaryo farkındalıklı `mock-openai` sağlayıcı sunucusunu başlatır.                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetir.                                                                                                                                                                                                                     |
| `qa matrix`                                         | Tek kullanımlık Tuwunel homeserver'a karşı canlı aktarım hattı. Bkz. [Matrix QA](/tr/concepts/qa-matrix).                                                                                                                                                                |
| `qa telegram`                                       | Gerçek özel Telegram grubuna karşı canlı aktarım hattı.                                                                                                                                                                                                                |
| `qa discord`                                        | Gerçek özel Discord guild kanalına karşı canlı aktarım hattı.                                                                                                                                                                                                          |
| `qa slack`                                          | Gerçek özel Slack kanalına karşı canlı aktarım hattı.                                                                                                                                                                                                                  |
| `qa mantis`                                         | Canlı aktarım hataları için, Discord durum tepkileri kanıtı, Crabbox masaüstü/tarayıcı smoke testi ve Slack-in-VNC smoke testiyle önce ve sonra doğrulama çalıştırıcısı. Bkz. [Mantis](/tr/concepts/mantis) ve [Mantis Slack Masaüstü Çalıştırma Kılavuzu](/tr/concepts/mantis-slack-desktop-runbook). |

## Operatör akışı

Geçerli QA operatör akışı iki panelli bir QA sitesidir:

- Sol: agent ile Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini oluşturur, Docker destekli gateway hattını başlatır ve bir
operatörün ya da otomasyon döngüsünün agent'a bir QA görevi verebileceği,
gerçek kanal davranışını gözlemleyebileceği ve neyin çalıştığını, başarısız olduğunu veya
engelli kaldığını kaydedebileceği QA Lab sayfasını kullanıma açar.

Her seferinde Docker imajını yeniden oluşturmadan daha hızlı QA Lab UI yinelemesi için,
yığını bind-mounted QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden oluşturulmuş bir imajda tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` container'ına bind-mount eder. `qa:lab:watch`
değişiklik olduğunda bu paketi yeniden oluşturur ve QA Lab varlık hash'i
değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

Yerel OpenTelemetry izleme smoke testi için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu betik yerel bir OTLP/HTTP izleme alıcısı başlatır,
`diagnostics-otel` Plugin'i etkinleştirilmiş şekilde `otel-trace-smoke` QA senaryosunu çalıştırır, ardından
dışa aktarılan protobuf span'lerini çözer ve sürüm açısından kritik şekli doğrular:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` ve `openclaw.message.delivery` mevcut olmalıdır;
model çağrıları başarılı turlarda `StreamAbandoned` dışa aktarmamalıdır; ham tanılama ID'leri ve
`openclaw.content.*` öznitelikleri izlemenin dışında kalmalıdır. QA suite yapıtlarının yanına
`otel-smoke-summary.json` yazar.

Gözlemlenebilirlik QA yalnızca kaynak checkout'ında kalır. npm tarball, QA Lab'i bilinçli olarak
dışarıda bırakır; bu nedenle paket Docker sürüm hatları `qa` komutlarını çalıştırmaz. Tanılama
enstrümantasyonunu değiştirirken oluşturulmuş bir kaynak checkout'ından
`pnpm qa:otel:smoke` kullanın.

Aktarımı gerçek Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Bu hat için tam CLI referansı, profil/senaryo kataloğu, env vars ve yapıt düzeni [Matrix QA](/tr/concepts/qa-matrix) içinde bulunur. Kısaca: Docker'da tek kullanımlık bir Tuwunel homeserver sağlar, geçici sürücü/SUT/gözlemci kullanıcıları kaydeder, gerçek Matrix Plugin'ini bu aktarıma kapsamlanmış bir alt QA gateway içinde çalıştırır (`qa-channel` yok), ardından `.artifacts/qa-e2e/matrix-<timestamp>/` altında Markdown raporu, JSON özeti, gözlemlenen olaylar yapıtı ve birleşik çıktı günlüğü yazar.

Senaryolar, birim testlerinin uçtan uca kanıtlayamayacağı aktarım davranışını kapsar: mention gating, allow-bot ilkeleri, allowlist'ler, üst düzey ve iş parçacıklı yanıtlar, DM yönlendirme, tepki işleme, gelen düzenleme bastırma, yeniden başlatma replay tekilleştirme, homeserver kesintisi kurtarma, onay metadata teslimi, medya işleme ve Matrix E2EE bootstrap/kurtarma/doğrulama akışları. E2EE CLI profili ayrıca gateway yanıtlarını denetlemeden önce aynı tek kullanımlık homeserver üzerinden `openclaw matrix encryption setup` ve doğrulama komutlarını çalıştırır.

Discord'da hata yeniden üretimi için yalnızca Mantis'e özel isteğe bağlı senaryolar da vardır. Açık durum tepkisi
zaman çizelgesi için `--scenario discord-status-reactions-tool-only` kullanın veya gerçek bir
Discord iş parçacığı oluşturup `message.thread-reply` işleminin bir `filePath`
ekini koruduğunu doğrulamak için `--scenario discord-thread-reply-filepath-attachment` kullanın.
Bu senaryolar, geniş smoke kapsamı yerine önce/sonra yeniden üretim probları oldukları için
varsayılan canlı Discord hattının dışında kalır.
İş parçacığı eki Mantis iş akışı, QA ortamında
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` veya
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` yapılandırılmışsa oturum açılmış bir Discord Web
tanık videosu da ekleyebilir. Bu görüntüleyici profili yalnızca görsel yakalama içindir; geçme/kalma
kararı yine de Discord REST oracle'dan gelir.

CI, `.github/workflows/qa-live-transports-convex.yml` içinde aynı komut yüzeyini kullanır. Zamanlanmış ve varsayılan manuel çalıştırmalar canlı frontier kimlik bilgileri, `--fast` ve `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` ile hızlı Matrix profilini yürütür. Manuel `matrix_profile=all`, kapsamlı kataloğun paralel çalışabilmesi ve her shard için bir yapıt dizini tutulabilmesi için beş profil shard'ına yayılır.

Aktarımı gerçek Telegram, Discord ve Slack smoke hatları için:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Bunlar iki botlu (sürücü + SUT) önceden var olan gerçek bir kanalı hedefler. Gerekli env vars, senaryo listeleri, çıktı yapıtları ve Convex kimlik bilgisi havuzu aşağıdaki [Telegram, Discord ve Slack QA başvurusu](#telegram-discord-and-slack-qa-reference) bölümünde belgelenmiştir.

Tam Slack masaüstü VM çalıştırmasını VNC kurtarma ile yapmak için şunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bu komut bir Crabbox masaüstü/tarayıcı makinesi kiralar, Slack canlı hattını
VM içinde çalıştırır, VNC tarayıcısında Slack Web'i açar, masaüstünü yakalar ve
video yakalama kullanılabildiğinde `slack-qa/`, `slack-desktop-smoke.png` ve
`slack-desktop-smoke.mp4` dosyalarını Mantis yapı dizinine geri kopyalar.
Crabbox masaüstü/tarayıcı kiralamaları yakalama araçlarını ve tarayıcı/yerel
derleme yardımcı paketlerini baştan sağlar; bu yüzden senaryo yalnızca eski
kiralamalarda yedekleri kurmalıdır. Mantis toplam ve aşama başına süreleri
`mantis-slack-desktop-smoke-report.md` içinde raporlar; böylece yavaş
çalıştırmalarda sürenin kiralama ısınmasına, kimlik bilgisi edinimine, uzak
kuruluma ya da yapı kopyalamaya gidip gitmediği görülebilir. Slack Web'e VNC
üzerinden elle giriş yaptıktan sonra `--lease-id <cbx_...>` ile yeniden
kullanın; yeniden kullanılan kiralamalar Crabbox'ın pnpm depo önbelleğini de
sıcak tutar. Varsayılan `--hydrate-mode source`, bir kaynak checkout'undan
doğrular ve VM içinde install/build çalıştırır. `--hydrate-mode prehydrated`
modunu yalnızca yeniden kullanılan uzak çalışma alanında zaten `node_modules` ve
derlenmiş bir `dist/` varsa kullanın; bu mod pahalı install/build adımını atlar
ve çalışma alanı hazır olmadığında kapalı şekilde başarısız olur.
`--gateway-setup` ile Mantis, VM içinde `38973` portunda kalıcı bir OpenClaw
Slack gateway'i çalışır durumda bırakır; onsuz komut normal botlar arası Slack
QA hattını çalıştırır ve yapı yakalamadan sonra çıkar.

Operatör kontrol listesi, GitHub iş akışı dispatch komutu, kanıt yorum
sözleşmesi, hydrate-mode karar tablosu, zamanlama yorumu ve hata işleme
adımları [Mantis Slack Masaüstü Runbook](/tr/concepts/mantis-slack-desktop-runbook)
içinde yer alır.

Bir ajan/CV tarzı masaüstü görevi için şunu çalıştırın:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` bir Crabbox masaüstü/tarayıcı makinesi kiralar ya da yeniden
kullanır, `crabbox record --while` başlatır, görünür tarayıcıyı iç içe bir
`visual-driver` üzerinden sürer, `visual-task.png` yakalar, `--vision-mode
image-describe` seçildiğinde ekran görüntüsüne karşı `openclaw infer image
describe` çalıştırır ve `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` ve `mantis-visual-task-report.md`
yazar. `--expect-text` ayarlandığında, görsel prompt yapılandırılmış bir JSON
kararı ister ve yalnızca model pozitif görünür kanıt bildirdiğinde geçer; hedef
metni yalnızca alıntılayan negatif bir yanıt assertion'ı başarısız kılar.
Masaüstü, tarayıcı, ekran görüntüsü ve video tesisatını bir görüntü anlama
sağlayıcısını çağırmadan kanıtlayan modelsiz bir smoke için `--vision-mode
metadata` kullanın. Kayıt, `visual-task` için zorunlu bir yapıdır; Crabbox boş
olmayan bir `visual-task.mp4` kaydetmezse, görsel sürücü geçmiş olsa bile görev
başarısız olur. Hata durumunda, görev zaten geçmiş ve `--keep-lease`
ayarlanmamış değilse Mantis kiralamayı VNC için tutar.

Havuzdaki canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

doctor, Convex broker ortamını denetler, endpoint ayarlarını doğrular ve
maintainer gizlisi mevcut olduğunda admin/list erişilebilirliğini doğrular.
Gizliler için yalnızca ayarlı/eksik durumunu raporlar.

## Canlı taşıma kapsamı

Canlı taşıma hatları, her birinin kendi senaryo listesi şeklini icat etmesi
yerine tek bir sözleşme paylaşır. `qa-channel`, geniş sentetik ürün davranışı
paketidir ve canlı taşıma kapsamı matrisinin parçası değildir.

| Hat      | Kanarya | Bahsetme geçidi | Botlar arası | İzin listesi engeli | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | İleti dizisi takibi | İleti dizisi yalıtımı | Tepki gözlemi | Yardım komutu | Yerel komut kaydı |
| -------- | ------- | --------------- | ------------ | ------------------- | --------------- | --------------------------------- | ------------------- | --------------------- | -------------- | ------------- | ----------------- |
| Matrix   | x       | x               | x            | x                   | x               | x                                 | x                   | x                     | x              |               |                   |
| Telegram | x       | x               | x            |                     |                 |                                   |                     |                       |                | x             |                   |
| Discord  | x       | x               | x            |                     |                 |                                   |                     |                       |                |               | x                 |
| Slack    | x       | x               | x            | x                   | x               | x                                 | x                   | x                     |                |               |                   |

Bu, Matrix, Telegram ve gelecekteki canlı taşımalar tek bir açık taşıma
sözleşmesi kontrol listesini paylaşırken `qa-channel` öğesini geniş ürün
davranışı paketi olarak tutar.

Docker'ı QA yoluna dahil etmeden tek kullanımlık bir Linux VM hattı için şunu
çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass guest başlatır, bağımlılıkları kurar, OpenClaw'ı guest
içinde derler, `qa suite` çalıştırır, ardından normal QA raporunu ve özetini
host üzerindeki `.artifacts/qa-e2e/...` içine geri kopyalar.
Host üzerindeki `qa suite` ile aynı senaryo seçme davranışını yeniden kullanır.
Host ve Multipass paket çalıştırmaları, seçilen birden çok senaryoyu varsayılan
olarak yalıtılmış gateway worker'larıyla paralel yürütür. `qa-channel`
varsayılan olarak concurrency 4 kullanır ve seçilen senaryo sayısıyla
sınırlandırılır. Worker sayısını ayarlamak için `--concurrency <count>` ya da
seri yürütme için `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan değerle çıkar.
Başarısız çıkış kodu olmadan yapıları istediğinizde `--allow-failures` kullanın.
Canlı çalıştırmalar, guest için pratik olan desteklenen QA auth girdilerini
iletir: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı config yolu ve
mevcut olduğunda `CODEX_HOME`. Guest'in bağlı çalışma alanı üzerinden geri
yazabilmesi için `--output-dir` değerini repo kökü altında tutun.

## Telegram, Discord ve Slack QA başvurusu

Matrix, senaryo sayısı ve Docker destekli homeserver sağlama nedeniyle
[ayrı bir sayfaya](/tr/concepts/qa-matrix) sahiptir. Telegram, Discord ve Slack
daha küçüktür - her biri birkaç senaryo, profil sistemi yok, önceden mevcut
gerçek kanallara karşı - bu nedenle başvuruları burada yer alır.

### Paylaşılan CLI bayrakları

Bu hatlar `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts`
üzerinden kaydolur ve aynı bayrakları kabul eder:

| Bayrak                                | Varsayılan                                                     | Açıklama                                                                                                                |
| ------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                              | Yalnızca bu senaryoyu çalıştırır. Tekrarlanabilir.                                                                      |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Raporların/özetin/gözlenen mesajların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` temel alınarak çözülür. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Nötr bir cwd içinden çağırırken depo kökü.                                                                              |
| `--sut-account <id>`                  | `sut`                                                          | QA gateway config içindeki geçici hesap id'si.                                                                          |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` veya `live-frontier` (eski `live-openai` hâlâ çalışır).                                                   |
| `--model <ref>` / `--alt-model <ref>` | sağlayıcı varsayılanı                                          | Birincil/alternatif model ref'leri.                                                                                     |
| `--fast`                              | kapalı                                                         | Desteklendiğinde sağlayıcı hızlı modu.                                                                                  |
| `--credential-source <env\|convex>`   | `env`                                                          | Bkz. [Convex kimlik bilgisi havuzu](#convex-credential-pool).                                                          |
| `--credential-role <maintainer\|ci>`  | CI'da `ci`, aksi halde `maintainer`                            | `--credential-source convex` olduğunda kullanılan rol.                                                                  |

Her hat, başarısız olan herhangi bir senaryoda sıfır olmayan değerle çıkar.
`--allow-failures`, başarısız çıkış kodu ayarlamadan yapıları yazar.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

İki farklı botu (driver + SUT) olan tek bir gerçek özel Telegram grubunu hedefler.
SUT botunun bir Telegram kullanıcı adı olmalıdır; botlar arası gözlem en iyi,
iki botta da `@BotFather` içinde **Bot-to-Bot Communication Mode**
etkinleştirildiğinde çalışır.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - sayısal chat id (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`, mesaj gövdelerini gözlenen mesaj yapılarında tutar (varsayılan olarak redakte edilir).

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

Çıktı yapıları:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - kanaryadan başlayarak yanıt başına RTT içerir (driver gönderimi → gözlenen SUT yanıtı).
- `telegram-qa-observed-messages.json` - `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` olmadıkça gövdeler redakte edilir.

### Discord QA

```bash
pnpm openclaw qa discord
```

İki botlu tek bir gerçek özel Discord guild kanalını hedefler: harness
tarafından kontrol edilen bir driver botu ve child OpenClaw gateway tarafından
paketlenmiş Discord Plugin üzerinden başlatılan bir SUT botu. Kanal bahsetme
işlemesini, SUT botunun Discord ile yerel `/help` komutunu kaydettiğini ve
isteğe bağlı Mantis kanıt senaryolarını doğrular.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord tarafından döndürülen SUT bot kullanıcı id'siyle eşleşmelidir (aksi halde hat hızlı başarısız olur).

İsteğe bağlı:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`, mesaj gövdelerini gözlenen mesaj yapılarında tutar.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID`, `discord-voice-autojoin` için ses/sahne kanalını seçer; onsuz senaryo, SUT botu için görünen ilk ses/sahne kanalını seçer.

Senaryolar (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - isteğe bağlı ses senaryosu. Kendi başına çalışır, `channels.discord.voice.autoJoin` ayarını etkinleştirir ve SUT botunun mevcut Discord ses durumunun hedef ses/sahne kanalı olduğunu doğrular. Convex Discord kimlik bilgileri isteğe bağlı `voiceChannelId` içerebilir; aksi halde çalıştırıcı, sunucudaki ilk görünür ses/sahne kanalını keşfeder.
- `discord-status-reactions-tool-only` - isteğe bağlı Mantis senaryosu. SUT'yi `messages.statusReactions.enabled=true` ile her zaman açık, yalnızca araç kullanılan sunucu yanıtlarına geçirdiği için kendi başına çalışır; ardından bir REST tepki zaman çizelgesi ile HTML/PNG görsel yapıtlarını yakalar. Mantis öncesi/sonrası raporları, senaryonun sağladığı MP4 yapıtlarını `baseline.mp4` ve `candidate.mp4` olarak da korur.

Discord ses otomatik katılma senaryosunu açıkça çalıştırın:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

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
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` olmadıkça gövdeler sansürlenir.
- Durum tepkisi senaryosu çalıştığında `discord-qa-reaction-timelines.json` ve `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

İki farklı botu olan gerçek bir özel Slack kanalını hedefler: test donanımı tarafından denetlenen bir sürücü bot ve paketle gelen Slack Plugin'i üzerinden alt OpenClaw Gateway tarafından başlatılan bir SUT botu.

`--credential-source env` kullanıldığında gerekli ortam değişkenleri:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`, gözlenen ileti yapıtlarında ileti gövdelerini tutar.

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
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` olmadıkça gövdeler sansürlenir.

#### Slack çalışma alanını ayarlama

Kulvar, tek bir çalışma alanında iki ayrı Slack uygulamasına ve her iki botun da üyesi olduğu bir kanala ihtiyaç duyar:

- `channelId` - her iki botun davet edildiği bir kanalın `Cxxxxxxxxxx` kimliği. Özel ayrılmış bir kanal kullanın; kulvar her çalıştırmada gönderi yapar.
- `driverBotToken` - **Driver** uygulamasının bot belirteci (`xoxb-...`).
- `sutBotToken` - **SUT** uygulamasının bot belirteci (`xoxb-...`); bot kullanıcı kimliğinin farklı olması için sürücüden ayrı bir Slack uygulaması olmalıdır.
- `sutAppToken` - SUT uygulamasının `connections:write` kapsamına sahip uygulama düzeyi belirteci (`xapp-...`); Socket Mode tarafından, SUT uygulamasının olay alabilmesi için kullanılır.

Üretim çalışma alanını yeniden kullanmak yerine QA için ayrılmış bir Slack çalışma alanını tercih edin.

Aşağıdaki SUT manifestosu, paketle gelen Slack Plugin'inin üretim kurulumunu (`extensions/slack/src/setup-shared.ts:10`) canlı Slack QA paketinin kapsadığı izinler ve olaylarla bilinçli olarak sınırlar. Kullanıcıların gördüğü üretim kanalı kurulumu için bkz. [Slack kanalı hızlı kurulum](/tr/channels/slack#quick-setup); QA Driver/SUT çifti bilinçli olarak ayrıdır çünkü kulvarın tek bir çalışma alanında iki ayrı bot kullanıcı kimliğine ihtiyacı vardır.

**1. Driver uygulamasını oluşturun**

[api.slack.com/apps](https://api.slack.com/apps) adresine gidin → _Create New App_ → _From a manifest_ → QA çalışma alanını seçin, aşağıdaki manifestoyu yapıştırın, ardından _Install to Workspace_ seçeneğini kullanın:

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

_Bot User OAuth Token_ (`xoxb-...`) değerini kopyalayın; bu `driverBotToken` olur. Sürücünün yalnızca ileti göndermesi ve kendini tanımlaması gerekir; olay gerekmez, Socket Mode gerekmez.

**2. SUT uygulamasını oluşturun**

Aynı çalışma alanında _Create New App → From a manifest_ adımlarını tekrarlayın. Bu QA uygulaması, paketle gelen Slack Plugin'inin üretim manifestosunun (`extensions/slack/src/setup-shared.ts:10`) daha dar bir sürümünü bilinçli olarak kullanır: canlı Slack QA paketi henüz tepki işlemeyi kapsamadığı için tepki kapsamları ve olayları çıkarılmıştır.

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

Her belirteçte `auth.test` çağırarak iki botun farklı kullanıcı kimliklerine sahip olduğunu doğrulayın. Çalışma zamanı sürücü ile SUT'yi kullanıcı kimliğine göre ayırt eder; ikisi için tek bir uygulamayı yeniden kullanmak mention-gating'i hemen başarısız yapar.

**3. Kanalı oluşturun**

QA çalışma alanında bir kanal oluşturun (ör. `#openclaw-qa`) ve kanalın içinden her iki botu davet edin:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

`Cxxxxxxxxxx` kimliğini _channel info → About → Channel ID_ bölümünden kopyalayın; bu `channelId` olur. Herkese açık bir kanal çalışır; özel kanal kullanırsanız her iki uygulamada zaten `groups:history` bulunduğu için test donanımının geçmiş okumaları yine başarılı olur.

**4. Kimlik bilgilerini kaydedin**

İki seçenek vardır. Tek makineli hata ayıklama için ortam değişkenlerini kullanın (dört `OPENCLAW_QA_SLACK_*` değişkenini ayarlayın ve `--credential-source env` geçin) ya da CI ve diğer bakımcıların kiralayabilmesi için paylaşılan Convex havuzunu seed edin.

Convex havuzu için dört alanı bir JSON dosyasına yazın:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Kabuğunuzda `OPENCLAW_QA_CONVEX_SITE_URL` ve `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dışa aktarılmışken kaydedin ve doğrulayın:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`, `status: "active"` ve `lease` alanının olmamasını bekleyin.

**5. Uçtan uca doğrulayın**

Her iki botun aracı üzerinden birbiriyle konuşabildiğini doğrulamak için kulvarı yerel olarak çalıştırın:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Yeşil bir çalıştırma 30 saniyenin oldukça altında tamamlanır ve `slack-qa-report.md`, hem `slack-canary` hem de `slack-mention-gating` için `pass` durumunu gösterir. Kulvar yaklaşık 90 saniye takılı kalıp `Convex credential pool exhausted for kind "slack"` ile çıkarsa havuz ya boştur ya da her satır kiralanmıştır; `qa credentials list --kind slack --status all --json` hangisi olduğunu söyler.

### Convex kimlik bilgisi havuzu

Telegram, Discord ve Slack kulvarları, yukarıdaki ortam değişkenlerini okumak yerine paylaşılan bir Convex havuzundan kimlik bilgisi kiralayabilir. `--credential-source convex` geçin (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın); QA Lab özel bir lease alır, çalışma süresince Heartbeat gönderir ve kapanışta serbest bırakır. Havuz türleri `"telegram"`, `"discord"` ve `"slack"` değerleridir.

Aracının `admin/add` üzerinde doğruladığı payload şekilleri:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` sayısal bir sohbet kimliği dizesi olmalıdır.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId`, `^[A-Z][A-Z0-9]+$` ile eşleşmelidir (`Cxxxxxxxxxx` gibi bir Slack kimliği). Uygulama ve kapsam hazırlığı için bkz. [Slack çalışma alanını ayarlama](#setting-up-the-slack-workspace).

Operasyonel ortam değişkenleri ve Convex aracı uç noktası sözleşmesi [Testing → Convex üzerinden paylaşılan Telegram kimlik bilgileri](/tr/help/testing#shared-telegram-credentials-via-convex-v1) içinde yer alır (bölüm adı Discord desteğinden öncedir; aracı semantiği her iki tür için de aynıdır).

## Repo destekli seed'ler

Seed varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar bilinçli olarak git içindedir; böylece QA planı hem insanlar hem de ajan tarafından görülebilir.

`qa-lab` genel bir markdown çalıştırıcı olarak kalmalıdır. Her senaryo markdown dosyası, tek bir test çalıştırması için doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo meta verileri
- isteğe bağlı kategori, yetenek, kulvar ve risk meta verileri
- doküman ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı Gateway yapılandırma yaması
- çalıştırılabilir `qa-flow`

`qa-flow`'u destekleyen yeniden kullanılabilir çalışma zamanı yüzeyinin genel ve kesişen kalmasına izin verilir. Örneğin, markdown senaryoları, özel durum çalıştırıcısı eklemeden gömülü Control UI'ı Gateway `browser.request` birleşimi üzerinden süren tarayıcı tarafı yardımcılarla taşıma tarafı yardımcılarını birleştirebilir.

Senaryo dosyaları, kaynak ağacı klasörü yerine ürün yeteneğine göre gruplanmalıdır. Dosyalar taşındığında senaryo kimliklerini kararlı tutun; uygulama izlenebilirliği için `docsRefs` ve `codeRefs` kullanın.

Temel liste şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- thread davranışı
- ileti eylemi yaşam döngüsü
- cron geri çağrıları
- bellek hatırlama
- model değiştirme
- alt ajan devri
- repo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı mock kulvarları

`qa suite` iki yerel sağlayıcı mock kulvarına sahiptir:

- `mock-openai`, senaryo farkındalığı olan OpenClaw mock'udur. Repo destekli QA ve parite kapıları için varsayılan deterministik mock kulvarı olarak kalır.
- `aimock`, deneysel protokol, fixture, kayıt/yeniden oynatma ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Eklemelidir ve `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı kulvarı uygulaması `extensions/qa-lab/src/providers/` altında bulunur. Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlangıcına, Gateway model yapılandırmasına, auth-profile hazırlama ihtiyaçlarına ve canlı/mock yetenek bayraklarına sahiptir. Paylaşılan paket ve Gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirme yapmalıdır.

## Taşıma bağdaştırıcıları

`qa-lab`, Markdown QA senaryoları için genel bir taşıma katmanına sahiptir. `qa-channel`, bu katmandaki ilk adaptördür, ancak tasarım hedefi daha geniştir: gelecekteki gerçek veya sentetik kanallar, taşımaya özgü bir QA çalıştırıcısı eklemek yerine aynı paket çalıştırıcısına bağlanmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütmeyi, worker eşzamanlılığını, artefakt yazımını ve raporlamayı sahiplenir.
- Taşıma adaptörü Gateway yapılandırmasını, hazır olma durumunu, gelen ve giden gözlemi, taşıma eylemlerini ve normalleştirilmiş taşıma durumunu sahiplenir.
- `qa/scenarios/` altındaki Markdown senaryo dosyaları test çalışmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

### Kanal ekleme

Markdown QA sistemine kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma adaptörü.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` ana makinesi akışı sahiplenebiliyorken yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab` paylaşılan ana makine mekaniklerini sahiplenir:

- `openclaw qa` komut kökü
- paket başlatma ve kapatma
- worker eşzamanlılığı
- artefakt yazımı
- rapor oluşturma
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı Plugin’leri taşıma sözleşmesini sahiplenir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökü altına nasıl bağlandığı
- Gateway’in bu taşıma için nasıl yapılandırıldığı
- hazır olma durumunun nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden iletilerin nasıl gözlemlendiği
- transkriptlerin ve normalleştirilmiş taşıma durumunun nasıl sunulduğu
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşımaya özgü sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir kanal için asgari benimseme eşiği:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab` kalsın.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` ana makine katmanında uygulayın.
3. Taşımaya özgü mekanikleri çalıştırıcı Plugin’i veya kanal donanımı içinde tutun.
4. Çalıştırıcıyı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın. Çalıştırıcı Plugin’leri `openclaw.plugin.json` içinde `qaRunners` tanımlamalı ve `runtime-api.ts` dosyasından eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır. `runtime-api.ts` hafif kalmalıdır; lazy CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında Markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo bilinçli bir geçiş yapmadığı sürece mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış bir kez `qa-lab` içinde ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu ilgili çalıştırıcı Plugin’inde veya Plugin donanımında tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yetenek gerektiriyorsa, `suite.ts` içinde kanala özgü bir dal eklemek yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşımaya özgü tutun ve bunu senaryo sözleşmesinde açıkça belirtin.

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

Uyumluluk takma adları mevcut senaryolar için kullanılabilir kalır: `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`; ancak yeni senaryo yazımı genel adları kullanmalıdır. Takma adlar, tek seferlik büyük bir geçişi önlemek için vardır; ileriye dönük model olarak değildir.

## Raporlama

`qa-lab`, gözlemlenen bus zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şunları yanıtlamalıdır:

- Ne çalıştı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryoları eklemeye değer

Mevcut senaryoların envanteri için, takip işini boyutlandırırken veya yeni bir taşıma bağlarken faydalı olur, `pnpm openclaw qa coverage` komutunu çalıştırın (makine tarafından okunabilir çıktı için `--json` ekleyin).

Karakter ve stil denetimleri için aynı senaryoyu birden fazla canlı model
ref üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

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
senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam transkripti korur,
temel çalıştırma istatistiklerini kaydeder, ardından desteklendiği yerlerde `xhigh`
akıl yürütmeyle hızlı modda jüri modellerinden çalışmaları doğallık, his ve mizah açısından sıralamasını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: jüri istemi yine
her transkripti ve çalıştırma durumunu alır, ancak aday ref’leri `candidate-01` gibi
nötr etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek ref’lerle eşleştirir.
Aday çalıştırmaları varsayılan olarak `high` düşünme kullanır; GPT-5.5 için `medium`, bunu destekleyen eski OpenAI değerlendirme ref’leri için `xhigh`
kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` hâlâ
genel bir geri dönüş ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday ref’leri varsayılan olarak hızlı mod kullanır; böylece sağlayıcının desteklediği yerlerde
öncelikli işleme kullanılır. Tek bir aday veya jürinin geçersiz kılmaya ihtiyacı olduğunda satır içinde
`,fast`, `,no-fast` veya `,fast=false` ekleyin. Hızlı modu her aday model için
zorlamak istediğinizde yalnızca `--fast` geçirin. Aday ve jüri süreleri
karşılaştırma analizi için rapora kaydedilir, ancak jüri istemleri açıkça
hıza göre sıralama yapmamasını söyler.
Aday ve jüri model çalıştırmalarının ikisi de varsayılan olarak 16 eşzamanlılık kullanır. Sağlayıcı sınırları veya yerel Gateway
baskısı bir çalışmayı fazla gürültülü yaptığında
`--concurrency` veya `--judge-concurrency` değerini düşürün.
Aday `--model` geçirilmediğinde, karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
`--judge-model` geçirilmediğinde, jüriler varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili dokümanlar

- [Matris QA](/tr/concepts/qa-matrix)
- [QA Kanalı](/tr/channels/qa-channel)
- [Test Etme](/tr/help/testing)
- [Pano](/tr/web/dashboard)

---
read_when:
    - QA yığınının nasıl birlikte çalıştığını anlamak
    - qa-lab, qa-channel veya bir taşıma bağdaştırıcısını genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçiliğe sahip QA otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, depo destekli senaryolar, canlı taşıma hatları, taşıma bağdaştırıcıları ve raporlama.'
title: QA genel bakışı
x-i18n:
    generated_at: "2026-05-10T19:34:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw’ı tek bir birim testinin yapabileceğinden daha gerçekçi,
kanal yapısına daha benzer bir şekilde çalıştırmak içindir.

Geçerli parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: dökümü gözlemlemek,
  gelen mesajları enjekte etmek ve bir Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veri yolu.
- `extensions/qa-matrix`, gelecekteki çalıştırıcı plugin’leri: alt QA gateway içinde
  gerçek bir kanalı süren canlı taşıma bağdaştırıcıları.
- `qa/`: başlatma görevi ve temel QA
  senaryoları için repo destekli başlangıç varlıkları.
- [Mantis](/tr/concepts/mantis): gerçek taşımalar, tarayıcı ekran görüntüleri, VM durumu ve PR kanıtı gerektiren hatalar için
  canlı doğrulama öncesi ve sonrası.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Birçoğunun `pnpm qa:*`
betik takma adları vardır; iki biçim de desteklenir.

| Komut                                               | Amaç                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | Paketlenmiş QA öz denetimi; bir Markdown raporu yazar.                                                                                                                                                                                                                   |
| `qa suite`                                          | Repo destekli senaryoları QA gateway hattına karşı çalıştırır. Takma adlar: tek kullanımlık bir Linux VM için `pnpm openclaw qa suite --runner multipass`.                                                                                                                |
| `qa coverage`                                       | Markdown senaryo kapsam envanterini yazdırır (makine çıktısı için `--json`).                                                                                                                                                                                             |
| `qa parity-report`                                  | İki `qa-suite-summary.json` dosyasını karşılaştırır ve etmenli parite raporunu yazar.                                                                                                                                                                                    |
| `qa character-eval`                                 | Karakter QA senaryosunu, değerlendirilmiş bir raporla birden çok canlı model üzerinde çalıştırır. Bkz. [Raporlama](#reporting).                                                                                                                                          |
| `qa manual`                                         | Seçili sağlayıcı/model hattına karşı tek seferlik bir istem çalıştırır.                                                                                                                                                                                                   |
| `qa ui`                                             | QA hata ayıklayıcı UI’sini ve yerel QA veri yolunu başlatır (takma ad: `pnpm qa:lab:ui`).                                                                                                                                                                                 |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını derler.                                                                                                                                                                                                                            |
| `qa docker-scaffold`                                | QA panosu + gateway hattı için bir docker-compose iskelesi yazar.                                                                                                                                                                                                         |
| `qa up`                                             | QA sitesini derler, Docker destekli yığını başlatır, URL’yi yazdırır (takma ad: `pnpm qa:lab:up`; `:fast` varyantı `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler).                                                                                        |
| `qa aimock`                                         | Yalnızca AIMock sağlayıcı sunucusunu başlatır.                                                                                                                                                                                                                           |
| `qa mock-openai`                                    | Yalnızca senaryo farkındalığı olan `mock-openai` sağlayıcı sunucusunu başlatır.                                                                                                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetir.                                                                                                                                                                                                                       |
| `qa matrix`                                         | Tek kullanımlık bir Tuwunel homeserver’a karşı canlı taşıma hattı. Bkz. [Matrix QA](/tr/concepts/qa-matrix).                                                                                                                                                                |
| `qa telegram`                                       | Gerçek bir özel Telegram grubuna karşı canlı taşıma hattı.                                                                                                                                                                                                                |
| `qa discord`                                        | Gerçek bir özel Discord guild kanalına karşı canlı taşıma hattı.                                                                                                                                                                                                          |
| `qa slack`                                          | Gerçek bir özel Slack kanalına karşı canlı taşıma hattı.                                                                                                                                                                                                                  |
| `qa mantis`                                         | Canlı taşıma hataları için Discord durum tepkileri kanıtı, Crabbox masaüstü/tarayıcı smoke testi ve VNC içinde Slack smoke testiyle doğrulama öncesi ve sonrası çalıştırıcısı. Bkz. [Mantis](/tr/concepts/mantis) ve [Mantis Slack Masaüstü Runbook’u](/tr/concepts/mantis-slack-desktop-runbook). |

## Operatör akışı

Geçerli QA operatör akışı iki bölmeli bir QA sitesidir:

- Sol: Etmenle birlikte Gateway panosu (Kontrol UI’si).
- Sağ: Slack benzeri dökümü ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve
bir operatörün veya otomasyon döngüsünün etmene bir QA görevi verebileceği,
gerçek kanal davranışını gözlemleyebileceği ve neyin çalıştığını, başarısız olduğunu veya
engelli kaldığını kaydedebileceği QA Lab sayfasını açar.

Docker imajını her seferinde yeniden derlemeden daha hızlı QA Lab UI yinelemesi için,
yığını bind-mount edilmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden derlenmiş bir imajda tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` konteynerine bind-mount eder. `qa:lab:watch`
değişiklikte bu paketi yeniden derler ve QA Lab
varlık hash’i değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

Yerel OpenTelemetry iz smoke testi için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu betik yerel bir OTLP/HTTP iz alıcısı başlatır,
`diagnostics-otel` plugin’i etkinleştirilmiş olarak `otel-trace-smoke` QA senaryosunu çalıştırır, ardından
dışa aktarılan protobuf span’lerini çözer ve sürüm açısından kritik şekli doğrular:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` ve `openclaw.message.delivery` mevcut olmalıdır;
model çağrıları başarılı turlarda `StreamAbandoned` dışa aktarmamalıdır; ham tanılama kimlikleri ve
`openclaw.content.*` öznitelikleri iz dışında kalmalıdır. QA suite artefaktlarının yanına
`otel-smoke-summary.json` yazar.

Gözlemlenebilirlik QA’sı yalnızca kaynak checkout’unda kalır. npm tarball’ı bilinçli olarak
QA Lab’i içermez, bu yüzden paket Docker sürüm hatları `qa` komutlarını çalıştırmaz. Tanılama
enstrümantasyonunu değiştirirken derlenmiş bir kaynak checkout’undan
`pnpm qa:otel:smoke` kullanın.

Taşıması gerçek bir Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Bu hat için tam CLI referansı, profil/senaryo kataloğu, ortam değişkenleri ve artefakt yerleşimi [Matrix QA](/tr/concepts/qa-matrix) içinde bulunur. Kısaca: Docker’da tek kullanımlık bir Tuwunel homeserver sağlar, geçici sürücü/SUT/gözlemci kullanıcıları kaydeder, gerçek Matrix plugin’ini o taşımaya kapsamlanmış bir alt QA gateway içinde çalıştırır (`qa-channel` yok), ardından `.artifacts/qa-e2e/matrix-<timestamp>/` altında bir Markdown raporu, JSON özeti, gözlemlenen olaylar artefaktı ve birleşik çıktı günlüğü yazar.

Senaryolar, birim testlerin uçtan uca kanıtlayamayacağı taşıma davranışlarını kapsar: bahsetme geçitleri, bot izin politikaları, izin listeleri, üst düzey ve iş parçacıklı yanıtlar, DM yönlendirme, tepki işleme, gelen düzenleme bastırma, yeniden başlatma tekrar oynatma tekilleştirmesi, homeserver kesintisi kurtarma, onay metaverisi teslimi, medya işleme ve Matrix E2EE başlatma/kurtarma/doğrulama akışları. E2EE CLI profili ayrıca gateway yanıtlarını denetlemeden önce aynı tek kullanımlık homeserver üzerinden `openclaw matrix encryption setup` ve doğrulama komutlarını sürer.

Discord ayrıca hata yeniden üretimi için yalnızca Mantis’e özgü isteğe bağlı senaryolara sahiptir. Açık durum tepkisi zaman çizelgesi için
`--scenario discord-status-reactions-tool-only` kullanın ya da gerçek bir Discord iş parçacığı oluşturup `message.thread-reply` öğesinin bir
`filePath` ekini koruduğunu doğrulamak için `--scenario discord-thread-reply-filepath-attachment` kullanın. Bu senaryolar, geniş smoke kapsamı yerine öncesi/sonrası yeniden üretim probları oldukları için varsayılan canlı Discord hattının dışında kalır.
İş parçacığı eki Mantis iş akışı, QA
ortamında `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` veya
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` yapılandırıldığında oturum açmış bir Discord Web
tanık videosu da ekleyebilir. Bu görüntüleyici profili yalnızca görsel yakalama içindir; başarılı/başarısız
kararı yine Discord REST oracle’ından gelir.

CI, `.github/workflows/qa-live-transports-convex.yml` içinde aynı komut yüzeyini kullanır. Zamanlanmış ve varsayılan manuel çalıştırmalar, canlı frontier kimlik bilgileriyle hızlı Matrix profilini, `--fast` ve `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` ile yürütür. Manuel `matrix_profile=all`, kapsamlı kataloğun paralel çalışabilmesi ve shard başına bir artefakt dizini tutulabilmesi için beş profil shard’ına yayılır.

Taşıması gerçek Telegram, Discord ve Slack smoke hatları için:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Bunlar iki botlu (sürücü + SUT) önceden var olan gerçek bir kanalı hedefler. Gerekli ortam değişkenleri, senaryo listeleri, çıktı artefaktları ve Convex kimlik bilgisi havuzu aşağıdaki [Telegram, Discord ve Slack QA referansı](#telegram-discord-and-slack-qa-reference) bölümünde belgelenmiştir.

Tam bir Slack masaüstü VM çalıştırmasını VNC kurtarmasıyla yapmak için şunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bu komut bir Crabbox masaüstü/tarayıcı makinesi kiralar, Slack canlı hattını
VM içinde çalıştırır, VNC tarayıcısında Slack Web'i açar, masaüstünü yakalar ve
video yakalama kullanılabiliyorsa `slack-qa/`, `slack-desktop-smoke.png` ve
`slack-desktop-smoke.mp4` dosyalarını Mantis yapıt dizinine geri kopyalar.
Crabbox masaüstü/tarayıcı kiralamaları, yakalama araçlarını ve tarayıcı/yerel
derleme yardımcı paketlerini en baştan sağlar; bu yüzden senaryo yalnızca daha
eski kiralamalarda yedekleri kurmalıdır. Mantis, toplam ve aşama başına süreleri
`mantis-slack-desktop-smoke-report.md` içinde raporlar; böylece yavaş
çalıştırmalar sürenin kiralama ısınmasına, kimlik bilgisi edinimine, uzak
kuruluma veya yapıt kopyalamaya gidip gitmediğini gösterir. VNC üzerinden Slack
Web'de elle oturum açtıktan sonra `--lease-id <cbx_...>` ile yeniden kullanın;
yeniden kullanılan kiralamalar Crabbox'ın pnpm store önbelleğini de sıcak tutar.
Varsayılan `--hydrate-mode source`, bir kaynak checkout'undan doğrular ve
kurulum/derleme işlemini VM içinde çalıştırır. `--hydrate-mode prehydrated`
yalnızca yeniden kullanılan uzak çalışma alanında zaten `node_modules` ve
derlenmiş bir `dist/` olduğunda kullanın; bu mod pahalı kurulum/derleme adımını
atlar ve çalışma alanı hazır değilse kapalı şekilde başarısız olur.
`--gateway-setup` ile Mantis, VM içinde `38973` portunda çalışan kalıcı bir
OpenClaw Slack Gateway bırakır; onsuz komut normal bot'tan bot'a Slack QA
hattını çalıştırır ve yapıt yakalamadan sonra çıkar.

Operatör kontrol listesi, GitHub workflow dispatch komutu, kanıt yorumu
sözleşmesi, hydrate-mode karar tablosu, zamanlama yorumu ve hata işleme
adımları [Mantis Slack Masaüstü Runbook'u](/tr/concepts/mantis-slack-desktop-runbook) içinde yer alır.

Agent/CV tarzı bir masaüstü görevi için şunu çalıştırın:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task`, bir Crabbox masaüstü/tarayıcı makinesi kiralar veya yeniden
kullanır, `crabbox record --while` başlatır, görünür tarayıcıyı iç içe bir
`visual-driver` üzerinden sürer, `visual-task.png` yakalar, `--vision-mode image-describe`
seçildiğinde ekran görüntüsüne karşı `openclaw infer image describe`
çalıştırır ve `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` ve `mantis-visual-task-report.md`
yazar. `--expect-text` ayarlandığında, görme istemi yapılandırılmış bir JSON
kararı ister ve yalnızca model olumlu görünür kanıt bildirdiğinde geçer; hedef
metni yalnızca alıntılayan olumsuz bir yanıt doğrulamayı başarısız kılar.
Masaüstü, tarayıcı, ekran görüntüsü ve video tesisatını bir görsel anlama
sağlayıcısı çağırmadan kanıtlayan modelsiz smoke için `--vision-mode metadata`
kullanın. Kayıt, `visual-task` için gerekli bir yapıttır; Crabbox boş olmayan
bir `visual-task.mp4` kaydetmezse, görsel sürücü geçmiş olsa bile görev başarısız
olur. Hata durumunda Mantis, görev zaten geçmiş ve `--keep-lease` ayarlanmamış
olmadığı sürece kiralamayı VNC için tutar.

Havuza alınmış canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex aracı env'ini denetler, endpoint ayarlarını doğrular ve maintainer secret varsa admin/list erişilebilirliğini doğrular. Secret'lar için yalnızca ayarlı/eksik durumunu raporlar.

## Canlı transport kapsamı

Canlı transport hatları, her birinin kendi senaryo listesi şeklini icat etmesi yerine tek bir sözleşme paylaşır. `qa-channel`, geniş sentetik ürün davranışı paketidir ve canlı transport kapsam matrisinin parçası değildir.

| Hat      | Canary | Bahsetme geçidi | Bot'tan bot'a | Allowlist engeli | Üst düzey yanıt | Yeniden başlatma sürdürmesi | Thread takibi | Thread yalıtımı | Tepki gözlemi | Yardım komutu | Yerel komut kaydı |
| -------- | ------ | --------------- | ------------- | ---------------- | --------------- | --------------------------- | ------------- | ---------------- | ------------- | ------------- | ----------------- |
| Matrix   | x      | x               | x             | x                | x               | x                           | x             | x                | x             |               |                   |
| Telegram | x      | x               | x             |                  |                 |                             |               |                  |               | x             |                   |
| Discord  | x      | x               | x             |                  |                 |                             |               |                  |               |               | x                 |
| Slack    | x      | x               | x             | x                | x               | x                           | x             | x                |               |               |                   |

Bu, `qa-channel`'ı geniş ürün davranışı paketi olarak tutarken Matrix,
Telegram ve gelecekteki canlı transport'ların tek bir açık transport sözleşmesi
kontrol listesini paylaşmasını sağlar.

Docker'ı QA yoluna dahil etmeden tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass guest başlatır, bağımlılıkları kurar, OpenClaw'ı guest
içinde derler, `qa suite` çalıştırır, ardından normal QA raporunu ve özetini
host üzerindeki `.artifacts/qa-e2e/...` içine geri kopyalar.
Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır.
Host ve Multipass suite çalıştırmaları, varsayılan olarak yalıtılmış Gateway
worker'larıyla birden fazla seçili senaryoyu paralel yürütür. `qa-channel`,
seçilen senaryo sayısıyla sınırlı olmak üzere varsayılan olarak concurrency
4 kullanır. Worker sayısını ayarlamak için `--concurrency <count>`, seri yürütme
için `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan kodla çıkar. Hatalı
çıkış kodu olmadan yapıt istediğinizde `--allow-failures` kullanın.
Canlı çalıştırmalar, guest için pratik olan desteklenen QA auth girdilerini
iletir: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı config yolu ve
mevcut olduğunda `CODEX_HOME`. Guest'in bağlanan çalışma alanı üzerinden geri
yazabilmesi için `--output-dir` değerini repo kökü altında tutun.

## Telegram, Discord ve Slack QA referansı

Matrix'in senaryo sayısı ve Docker destekli homeserver hazırlığı nedeniyle [ayrı bir sayfası](/tr/concepts/qa-matrix) vardır. Telegram, Discord ve Slack daha küçüktür - her biri birkaç senaryo, profil sistemi yok, önceden var olan gerçek kanallara karşı - bu nedenle referansları burada yer alır.

### Paylaşılan CLI bayrakları

Bu hatlar `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` üzerinden kaydedilir ve aynı bayrakları kabul eder:

| Bayrak                                | Varsayılan                                                     | Açıklama                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                              | Yalnızca bu senaryoyu çalıştır. Tekrarlanabilir.                                                                     |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Raporların/özetin/gözlenen mesajların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` temel alınarak çözülür. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Nötr bir cwd'den çağırırken depo kökü.                                                                               |
| `--sut-account <id>`                  | `sut`                                                          | QA Gateway config'i içindeki geçici hesap kimliği.                                                                   |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` veya `live-frontier` (eski `live-openai` hala çalışır).                                                |
| `--model <ref>` / `--alt-model <ref>` | sağlayıcı varsayılanı                                          | Birincil/alternatif model ref'leri.                                                                                  |
| `--fast`                              | kapalı                                                         | Desteklendiği yerde sağlayıcı hızlı modu.                                                                            |
| `--credential-source <env\|convex>`   | `env`                                                          | Bkz. [Convex kimlik bilgisi havuzu](#convex-credential-pool).                                                       |
| `--credential-role <maintainer\|ci>`  | CI'da `ci`, aksi halde `maintainer`                            | `--credential-source convex` olduğunda kullanılan rol.                                                               |

Her hat, herhangi bir başarısız senaryoda sıfır olmayan kodla çıkar. `--allow-failures`, hatalı çıkış kodu ayarlamadan yapıtları yazar.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

İki ayrı bot (driver + SUT) ile tek bir gerçek özel Telegram grubunu hedefler. SUT bot'un bir Telegram kullanıcı adı olmalıdır; bot'tan bot'a gözlem, iki botta da `@BotFather` içinde **Bot-to-Bot Communication Mode** etkin olduğunda en iyi çalışır.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - sayısal chat id (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`, gözlenen mesaj yapıtlarında mesaj gövdelerini tutar (varsayılan redakte eder).

Senaryolar (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Örtük varsayılan küme her zaman canary, bahsetme geçidi, yerel komut yanıtları, komut adresleme ve bot'tan bot'a grup yanıtlarını kapsar. `mock-openai` varsayılanları ayrıca deterministik yanıt zinciri ve final mesajı akış denetimlerini içerir. `telegram-current-session-status-tool`, yalnızca canary'den sonra doğrudan thread'e alındığında kararlı olduğu, rastgele yerel komut yanıtlarından sonra kararlı olmadığı için opt-in kalır. Geçerli varsayılan/isteğe bağlı ayrımını regresyon ref'leriyle yazdırmak için `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` kullanın.

Çıktı yapıtları:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - canary ile başlayarak yanıt başına RTT (driver gönderimi → gözlenen SUT yanıtı) içerir.
- `telegram-qa-observed-messages.json` - `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` olmadıkça gövdeler redakte edilir.

### Discord QA

```bash
pnpm openclaw qa discord
```

İki bot ile tek bir gerçek özel Discord guild kanalını hedefler: harness tarafından kontrol edilen bir driver bot ve birlikte gelen Discord Plugin'i üzerinden child OpenClaw Gateway tarafından başlatılan bir SUT bot. Kanal bahsetme işlemesini, SUT bot'un yerel `/help` komutunu Discord'a kaydettiğini ve opt-in Mantis kanıt senaryolarını doğrular.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord tarafından döndürülen SUT bot kullanıcı kimliğiyle eşleşmelidir (aksi halde hat hızlıca başarısız olur).

İsteğe bağlı:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`, gözlemlenen ileti yapıtlarında ileti gövdelerini tutar.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID`, `discord-voice-autojoin` için ses/sahne kanalını seçer; bu olmadan senaryo, SUT bot için ilk görünür ses/sahne kanalını seçer.

Senaryolar (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - katılım gerektiren ses senaryosu. Kendi başına çalışır, `channels.discord.voice.autoJoin` etkinleştirir ve SUT botunun geçerli Discord ses durumunun hedef ses/sahne kanalı olduğunu doğrular. Convex Discord kimlik bilgileri isteğe bağlı `voiceChannelId` içerebilir; aksi halde çalıştırıcı, sunucudaki ilk görünür ses/sahne kanalını keşfeder.
- `discord-status-reactions-tool-only` - katılım gerektiren Mantis senaryosu. SUT’yi `messages.statusReactions.enabled=true` ile her zaman açık, yalnızca araç kullanan sunucu yanıtlarına geçirdiği için kendi başına çalışır, ardından bir REST tepki zaman çizelgesini ve HTML/PNG görsel yapıtlarını yakalar. Mantis öncesi/sonrası raporları, senaryo tarafından sağlanan MP4 yapıtlarını `baseline.mp4` ve `candidate.mp4` olarak da korur.

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
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.
- Durum tepkisi senaryosu çalıştığında `discord-qa-reaction-timelines.json` ve `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

Tek gerçek özel Slack kanalını iki ayrı botla hedefler: test koşumu tarafından kontrol edilen bir sürücü botu ve alt OpenClaw Gateway tarafından paketli Slack Plugin üzerinden başlatılan bir SUT botu.

`--credential-source env` kullanıldığında gerekli ortam değişkenleri:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`, gözlemlenen ileti yapıtlarında ileti gövdelerini tutar.

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

Hat, tek bir çalışma alanında iki ayrı Slack uygulamasına ve her iki botun da üyesi olduğu bir kanala ihtiyaç duyar:

- `channelId` - her iki botun da davet edildiği kanalın `Cxxxxxxxxxx` kimliği. Özel bir kanal kullanın; hat her çalıştırmada paylaşım yapar.
- `driverBotToken` - **Driver** uygulamasının bot belirteci (`xoxb-...`).
- `sutBotToken` - **SUT** uygulamasının bot belirteci (`xoxb-...`); bot kullanıcı kimliğinin ayrı olması için sürücüden ayrı bir Slack uygulaması olmalıdır.
- `sutAppToken` - Socket Mode tarafından kullanılan, SUT uygulamasının olayları alabilmesi için `connections:write` kapsamına sahip SUT uygulamasının uygulama düzeyi belirteci (`xapp-...`).

Üretim çalışma alanını yeniden kullanmak yerine QA için ayrılmış bir Slack çalışma alanını tercih edin.

Aşağıdaki SUT manifesti, paketli Slack Plugin’in üretim kurulumunu (`extensions/slack/src/setup-shared.ts:10`) canlı Slack QA paketi tarafından kapsanan izinler ve olaylarla kasıtlı olarak sınırlar. Kullanıcıların gördüğü üretim kanalı kurulumu için bkz. [Slack kanalı hızlı kurulumu](/tr/channels/slack#quick-setup); QA Driver/SUT çifti kasıtlı olarak ayrıdır çünkü hattın tek bir çalışma alanında iki ayrı bot kullanıcı kimliğine ihtiyacı vardır.

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

Aynı çalışma alanında _Create New App → From a manifest_ işlemini tekrarlayın. Bu QA uygulaması, paketli Slack Plugin’in üretim manifestinin (`extensions/slack/src/setup-shared.ts:10`) kasıtlı olarak daha dar bir sürümünü kullanır: canlı Slack QA paketi henüz tepki işlemeyi kapsamadığı için tepki kapsamları ve olayları atlanmıştır.

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

Her belirteçte `auth.test` çağırarak iki botun ayrı kullanıcı kimliklerine sahip olduğunu doğrulayın. Çalışma zamanı sürücüyü ve SUT’yi kullanıcı kimliğine göre ayırt eder; ikisi için aynı uygulamayı yeniden kullanmak mention-gating’i hemen başarısız kılar.

**3. Kanalı oluşturun**

QA çalışma alanında bir kanal oluşturun (ör. `#openclaw-qa`) ve kanalın içinden her iki botu da davet edin:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kanal kimliğini _channel info → About → Channel ID_ içinden `Cxxxxxxxxxx` olarak kopyalayın - bu `channelId` olur. Herkese açık bir kanal çalışır; özel kanal kullanırsanız her iki uygulamada da zaten `groups:history` olduğu için test koşumunun geçmiş okumaları yine başarılı olur.

**4. Kimlik bilgilerini kaydedin**

İki seçenek vardır. Tek makineli hata ayıklama için ortam değişkenlerini kullanın (dört `OPENCLAW_QA_SLACK_*` değişkenini ayarlayın ve `--credential-source env` geçin) veya CI ve diğer bakımcıların kiralayabilmesi için paylaşılan Convex havuzunu tohumlayın.

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

Her iki botun aracı üzerinden birbiriyle konuşabildiğini doğrulamak için hattı yerel olarak çalıştırın:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Yeşil bir çalıştırma 30 saniyenin oldukça altında tamamlanır ve `slack-qa-report.md`, hem `slack-canary` hem de `slack-mention-gating` için durumu `pass` olarak gösterir. Hat ~90 saniye takılı kalır ve `Convex credential pool exhausted for kind "slack"` ile çıkarsa havuz ya boştur ya da her satır kiralanmıştır - `qa credentials list --kind slack --status all --json` hangisi olduğunu söyler.

### Convex kimlik bilgisi havuzu

Telegram, Discord, Slack ve WhatsApp hatları, yukarıdaki ortam değişkenlerini okumak yerine paylaşılan bir Convex havuzundan kimlik bilgileri kiralayabilir. `--credential-source convex` geçin (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın); QA Lab özel bir kiralama alır, çalıştırma süresince Heartbeat gönderir ve kapanışta serbest bırakır. Havuz türleri `"telegram"`, `"discord"`, `"slack"` ve `"whatsapp"` şeklindedir.

Aracının `admin/add` üzerinde doğruladığı yük şekilleri:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` sayısal bir sohbet kimliği dizesi olmalıdır.
- Telegram gerçek kullanıcı (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - hem TDLib CLI sürücüsü hem de Telegram Desktop görsel tanığı tarafından kullanılan tek özel burner hesap kiralaması.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - telefon numaraları farklı E.164 dizeleri olmalıdır.

Görsel gerçek kullanıcı Telegram kanıtı için tutulan bir Crabbox oturumunu tercih edin:

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start`, hem TDLib CLI sürücüsü hem de Telegram Desktop tanığı için tek bir özel Convex `telegram-user` kiralamasını tutar, masaüstü kaydını başlatır ve Crabbox’ı aracılar tarafından yürütülen isteğe bağlı repro adımları için canlı bırakır. Aracılar memnun kalana kadar `send`, `run`, `screenshot` ve `status` kullanabilir; ardından `finish`, kimlik bilgisini serbest bırakmadan önce ekran görüntüsünü, videoyu, hareket kırpılmış video/GIF’i, TDLib yoklama çıktılarını ve günlükleri toplar. `publish --session <file> --pr <number>` varsayılan olarak yalnızca hareket GIF’iyle yorum yapar; `--full-artifacts`, günlükler ve JSON çıktısı için açık katılım seçeneğidir. Varsayılan `probe` komutu, hızlı `/status` duman kontrolleri için tek komutluk bir kısayol olarak kalır.

Bir PR deterministik bir görsel diff gerektirdiğinde `--mock-response-file <path>` kullanın:
Telegram biçimlendiricisi veya teslim katmanı değişirken aynı mock model yanıtı
`main` üzerinde ve PR head üzerinde çalıştırılabilir. Yakalama varsayılanları PR
yorumları için ayarlanmıştır: standart Crabbox sınıfı, 24fps masaüstü kaydı, 24fps hareket GIF'i ve
1920px önizleme genişliği. Öncesi/sonrası yorumları yalnızca hedeflenen GIF'leri
içeren temiz bir paket yayımlamalıdır.

Slack hatları da havuzu kullanabilir. Slack yük şekli kontrolleri şu anda aracıda değil Slack QA çalıştırıcısında bulunur; `Cxxxxxxxxxx` gibi bir Slack kanal kimliğiyle `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` kullanın. Uygulama ve kapsam sağlama için [Slack çalışma alanını ayarlama](#setting-up-the-slack-workspace) bölümüne bakın.

Operasyonel ortam değişkenleri ve Convex aracı uç noktası sözleşmesi [Test Etme → Convex üzerinden paylaşılan Telegram kimlik bilgileri](/tr/help/testing#shared-telegram-credentials-via-convex-v1) içinde bulunur (bölüm adı çok kanallı havuzdan öncedir; kiralama semantiği türler arasında paylaşılır).

## Repo destekli seed'ler

Seed varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar bilinçli olarak git içindedir, böylece QA planı hem insanlar hem de
agent tarafından görülebilir.

`qa-lab` genel bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası
tek bir test çalıştırması için doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo meta verileri
- isteğe bağlı kategori, capability, hat ve risk meta verileri
- docs ve kod başvuruları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı Gateway yapılandırma yaması
- çalıştırılabilir `qa-flow`

`qa-flow`'u destekleyen yeniden kullanılabilir çalışma zamanı yüzeyinin genel
ve kesişen alanlarda kalmasına izin verilir. Örneğin, markdown senaryoları,
özel durumlu bir çalıştırıcı eklemeden gömülü Control UI'ı Gateway
`browser.request` dikişi üzerinden süren tarayıcı tarafı yardımcılarıyla
taşıma tarafı yardımcılarını birleştirebilir.

Senaryo dosyaları kaynak ağacı klasörü yerine ürün capability'sine göre gruplanmalıdır.
Dosyalar taşındığında senaryo kimliklerini kararlı tutun; uygulama izlenebilirliği için
`docsRefs` ve `codeRefs` kullanın.

Temel liste şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- thread davranışı
- mesaj action yaşam döngüsü
- cron callbacks
- bellek hatırlama
- model değiştirme
- subagent handoff
- repo okuma ve dokümantasyon okuma
- Lobster Invaders gibi küçük bir build görevi

## Sağlayıcı mock hatları

`qa suite` iki yerel sağlayıcı mock hattına sahiptir:

- `mock-openai`, senaryo farkında OpenClaw mock'udur. Repo destekli QA ve parity geçitleri için varsayılan
  deterministik mock hattı olarak kalır.
- `aimock`, deneysel protocol, fixture, record/replay ve chaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Eklemelidir ve
  `mock-openai` senaryo dispatcher'ının yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında bulunur.
Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlatmasına, Gateway model yapılandırmasına,
auth-profile staging ihtiyaçlarına ve canlı/mock capability bayraklarına sahiptir. Paylaşılan suite ve
Gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı registry'si üzerinden yönlendirmelidir.

## Taşıma bağdaştırıcıları

`qa-lab`, markdown QA senaryoları için genel bir taşıma dikişine sahiptir. `qa-channel` bu dikişteki ilk bağdaştırıcıdır, ancak tasarım hedefi daha geniştir: gelecekteki gerçek veya sentetik kanallar, taşıma özelinde bir QA çalıştırıcısı eklemek yerine aynı suite çalıştırıcısına takılmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab` genel senaryo yürütmeyi, worker eşzamanlılığını, artifact yazımını ve raporlamayı sahiplenir.
- Taşıma bağdaştırıcısı Gateway yapılandırmasını, hazır olma durumunu, gelen ve giden gözlemi, taşıma action'larını ve normalleştirilmiş taşıma durumunu sahiplenir.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

### Kanal ekleme

Markdown QA sistemine kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma bağdaştırıcısı.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` host'u akışı sahiplenebiliyorsa yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab` paylaşılan host mekaniklerini sahiplenir:

- `openclaw qa` komut kökü
- suite başlatma ve sonlandırma
- worker eşzamanlılığı
- artifact yazımı
- rapor üretimi
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk alias'ları

Çalıştırıcı Plugin'leri taşıma sözleşmesini sahiplenir:

- `openclaw qa <runner>` komutunun paylaşılan `qa` kökü altına nasıl bağlandığı
- Gateway'in bu taşıma için nasıl yapılandırıldığı
- hazır olma durumunun nasıl kontrol edildiği
- gelen event'lerin nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- transcript'lerin ve normalleştirilmiş taşıma durumunun nasıl açığa çıkarıldığı
- taşıma destekli action'ların nasıl yürütüldüğü
- taşıma özelinde reset veya cleanup'ın nasıl işlendiği

Yeni bir kanal için minimum benimseme eşiği:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`'i tutun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` host dikişinde uygulayın.
3. Taşıma özelindeki mekanikleri çalıştırıcı Plugin'i veya kanal harness'ı içinde tutun.
4. Çalıştırıcıyı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın. Çalıştırıcı Plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır. `runtime-api.ts` hafif kalmalıdır; lazy CLI ve çalıştırıcı yürütmesi ayrı entrypoint'lerin arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Repo bilinçli bir migration yapmıyorsa mevcut uyumluluk alias'larını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu ilgili çalıştırıcı Plugin'inde veya Plugin harness'ında tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir capability gerektiriyorsa, `suite.ts` içinde kanala özel bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşıma özelinde tutun ve bunu senaryo sözleşmesinde açık hale getirin.

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

Mevcut senaryolar için uyumluluk alias'ları kullanılabilir olmaya devam eder - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ancak yeni senaryo yazımı genel adları kullanmalıdır. Alias'lar ileriye dönük model olarak değil, ani bir migration'ı önlemek için vardır.

## Raporlama

`qa-lab`, gözlemlenen bus timeline'ından bir Markdown protocol raporu dışa aktarır.
Rapor şunları yanıtlamalıdır:

- Ne çalıştı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryoları eklenmeye değer

Mevcut senaryoların envanteri için - takip çalışmasını boyutlandırırken veya yeni bir taşıma bağlarken kullanışlıdır - `pnpm openclaw qa coverage` çalıştırın (makine tarafından okunabilir çıktı için `--json` ekleyin).

Karakter ve stil kontrolleri için aynı senaryoyu birden fazla canlı model
ref'i üzerinde çalıştırın ve hakemli bir Markdown raporu yazın:

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

Komut Docker değil, yerel QA Gateway alt süreçleri çalıştırır. Character eval
senaryoları personayı `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı ve küçük dosya görevleri gibi sıradan kullanıcı turn'lerini çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam
transcript'i korur, temel çalıştırma istatistiklerini kaydeder, sonra desteklendiği yerlerde
`xhigh` reasoning ile hızlı modda judge modellerinden çalıştırmaları doğallık, vibe ve mizaha göre sıralamalarını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: judge prompt'u yine
her transcript'i ve çalıştırma durumunu alır, ancak aday ref'leri `candidate-01` gibi nötr
etiketlerle değiştirilir; rapor, parsing sonrasında sıralamaları gerçek ref'lerle eşler.
Aday çalıştırmaları varsayılan olarak `high` thinking kullanır; GPT-5.5 için `medium`, bunu destekleyen eski OpenAI eval ref'leri için `xhigh`
kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile override edin. `--thinking <level>` hâlâ
global bir fallback ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için tutulur.
OpenAI aday ref'leri varsayılan olarak hızlı moda geçer, böylece sağlayıcının desteklediği yerlerde
öncelikli işleme kullanılır. Tek bir aday veya judge için override gerektiğinde satır içinde
`,fast`, `,no-fast` veya `,fast=false` ekleyin. Hızlı modu her aday model için
zorlamak istediğinizde yalnızca `--fast` geçin. Aday ve judge süreleri
benchmark analizi için rapora kaydedilir, ancak judge prompt'ları açıkça
hıza göre sıralama yapmamalarını söyler.
Aday ve judge model çalıştırmalarının ikisi de varsayılan olarak eşzamanlılığı 16 kullanır. Sağlayıcı limitleri veya yerel Gateway
baskısı bir çalıştırmayı çok gürültülü hale getirdiğinde
`--concurrency` veya `--judge-concurrency` değerini düşürün.
Aday `--model` geçirilmediğinde, character eval varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
`--judge-model` geçirilmediğinde, judge'lar varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili dokümanlar

- [Matrix QA](/tr/concepts/qa-matrix)
- [QA Channel](/tr/channels/qa-channel)
- [Test Etme](/tr/help/testing)
- [Dashboard](/tr/web/dashboard)

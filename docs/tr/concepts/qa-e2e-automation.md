---
read_when:
    - QA yığınının nasıl bir araya geldiğini anlama
    - qa-lab, qa-channel veya bir aktarım adaptörünü genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçilikte QA otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, repo destekli senaryolar, canlı taşıma hatları, taşıma bağdaştırıcıları ve raporlama.'
title: QA genel bakışı
x-i18n:
    generated_at: "2026-07-01T08:27:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw'u tek bir birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak için tasarlanmıştır.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veriyolu.
- `extensions/qa-matrix`, gelecekteki runner Plugin'leri: alt QA gateway içinde gerçek bir kanalı
  süren canlı taşıma adaptörleri.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için repo destekli tohum varlıklar.
- [Mantis](/tr/concepts/mantis): gerçek taşımalara, tarayıcı ekran görüntülerine,
  VM durumuna ve PR kanıtına ihtiyaç duyan hatalar için canlı doğrulama öncesi ve sonrası.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Birçoğunun `pnpm qa:*`
betik takma adları vardır; iki biçim de desteklenir.

| Komut                                               | Amaç                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` olmadan paketli QA öz denetimi; `--qa-profile smoke-ci`, `--qa-profile release` veya `--qa-profile all` ile taksonomi destekli olgunluk profili runner'ı.                                                                                              |
| `qa suite`                                          | Repo destekli senaryoları QA gateway hattına karşı çalıştırır. Takma adlar: tek kullanımlık Linux VM için `pnpm openclaw qa suite --runner multipass`.                                                                                                                |
| `qa coverage`                                       | YAML senaryo kapsam envanterini yazdırır (makine çıktısı için `--json`).                                                                                                                                                                                               |
| `qa parity-report`                                  | İki `qa-suite-summary.json` dosyasını karşılaştırıp agentic parite raporunu yazar veya tek bir çalışma zamanı çifti özetinden Codex-vs-OpenClaw çalışma zamanı paritesi ve token verimliliği raporları yazmak için `--runtime-axis --token-efficiency` kullanır.      |
| `qa character-eval`                                 | Karakter QA senaryosunu birden fazla canlı modelde, yargılanmış raporla çalıştırır. Bkz. [Raporlama](#reporting).                                                                                                                                                     |
| `qa manual`                                         | Seçilen sağlayıcı/model hattına karşı tek seferlik bir prompt çalıştırır.                                                                                                                                                                                              |
| `qa ui`                                             | QA hata ayıklayıcı UI'sini ve yerel QA veriyolunu başlatır (takma ad: `pnpm qa:lab:ui`).                                                                                                                                                                               |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını oluşturur.                                                                                                                                                                                                                       |
| `qa docker-scaffold`                                | QA panosu + gateway hattı için docker-compose iskeleti yazar.                                                                                                                                                                                                          |
| `qa up`                                             | QA sitesini oluşturur, Docker destekli yığını başlatır, URL'yi yazdırır (takma ad: `pnpm qa:lab:up`; `:fast` varyantı `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler).                                                                                   |
| `qa aimock`                                         | Yalnızca AIMock sağlayıcı sunucusunu başlatır.                                                                                                                                                                                                                         |
| `qa mock-openai`                                    | Yalnızca senaryo farkındalıklı `mock-openai` sağlayıcı sunucusunu başlatır.                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetir.                                                                                                                                                                                                                     |
| `qa matrix`                                         | Tek kullanımlık bir Tuwunel homeserver'a karşı canlı taşıma hattı. Bkz. [Matrix QA](/tr/concepts/qa-matrix).                                                                                                                                                             |
| `qa telegram`                                       | Gerçek bir özel Telegram grubuna karşı canlı taşıma hattı.                                                                                                                                                                                                             |
| `qa discord`                                        | Gerçek bir özel Discord guild kanalına karşı canlı taşıma hattı.                                                                                                                                                                                                       |
| `qa slack`                                          | Gerçek bir özel Slack kanalına karşı canlı taşıma hattı.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Gerçek WhatsApp Web hesaplarına karşı canlı taşıma hattı.                                                                                                                                                                                                              |
| `qa mantis`                                         | Discord durum tepkisi kanıtı, Crabbox masaüstü/tarayıcı smoke'u ve VNC içinde Slack smoke'u ile canlı taşıma hataları için doğrulama öncesi ve sonrası runner'ı. Bkz. [Mantis](/tr/concepts/mantis) ve [Mantis Slack Masaüstü Runbook'u](/tr/concepts/mantis-slack-desktop-runbook). |

Profil destekli `qa run`, üyeliği `taxonomy.yaml` dosyasından okur, ardından
çözümlenen senaryoları `qa suite` üzerinden gönderir. `--surface` ve
`--category`, ayrı hatlar tanımlamak yerine seçilen profili filtreler.
Ortaya çıkan `qa-evidence.json`, seçilen kategori sayıları ve eksik kapsam ID'leriyle
bir profil scorecard özeti içerir; tekil kanıt girdileri testler, kapsam rolleri
ve sonuçlar için doğruluk kaynağı olmaya devam eder.
Taksonomi özellik kapsam ID'leri takma ad değil, kesin kanıt hedefleridir. Birincil
senaryo kapsamı eşleşen ID'leri karşılar; ikincil kapsam danışma amaçlı kalır.
Kapsam ID'leri küçük harfli alfanümerik/tire segmentleriyle noktalı
`namespace.behavior` biçimini kullanır; profil, yüzey ve kategori ID'leri mevcut
tireli veya noktalı taksonomi ID'lerini hâlâ kullanabilir.
İnce kanıt, girdi başına `execution` alanını atlar ve `evidenceMode: "slim"` ayarlar;
`smoke-ci` varsayılan olarak incedir ve `--evidence-mode full` tam girdileri geri yükler:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Mock model sağlayıcıları ve Crabline yerel sağlayıcı sunucularıyla deterministik
profil kanıtı için `smoke-ci` kullanın. Canlı kanallara karşı Stable/LTS kanıtı
için `release` kullanın. `all` yalnızca açık tam taksonomi kanıt çalıştırmaları
için kullanın; her etkin olgunluk kategorisini seçer ve `qa_profile=all` ile
`QA Profile Evidence` iş akışı üzerinden gönderilebilir. Bir komut ayrıca OpenClaw
kök profiline ihtiyaç duyduğunda, kök profili QA komutundan önce koyun:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operatör akışı

Mevcut QA operatör akışı iki bölmeli bir QA sitesidir:

- Sol: Agent ile Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini oluşturur, Docker destekli gateway hattını başlatır ve bir operatörün
veya otomasyon döngüsünün agent'a QA görevi verebildiği, gerçek kanal davranışını
gözlemleyebildiği ve nelerin çalıştığını, başarısız olduğunu veya engelli kaldığını
kaydedebildiği QA Lab sayfasını açar.

Docker imajını her seferinde yeniden oluşturmadan daha hızlı QA Lab UI yinelemesi için
yığını bind-mounted QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden oluşturulmuş bir imajda tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` container'ına bind-mount eder.
`qa:lab:watch` bu paketi değişiklikte yeniden oluşturur ve QA Lab varlık hash'i
değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

Yerel OpenTelemetry sinyal smoke'u için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu betik yerel bir OTLP/HTTP alıcısı başlatır, `diagnostics-otel` Plugin'i etkin
halde `otel-trace-smoke` QA senaryosunu çalıştırır, ardından trace'lerin,
metriklerin ve günlüklerin dışa aktarıldığını doğrular. Dışa aktarılan protobuf
trace span'lerini çözer ve release açısından kritik biçimi denetler:
`openclaw.run`, `openclaw.harness.run`, en son GenAI semantik kuralı
model çağrısı span'i, `openclaw.context.assembled` ve `openclaw.message.delivery`
bulunmalıdır. Smoke,
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` zorlar; bu nedenle
model çağrısı span'i `{gen_ai.operation.name} {gen_ai.request.model}` adını kullanmalıdır;
başarılı turn'lerde model çağrıları `StreamAbandoned` dışa aktarmamalıdır; ham tanılama ID'leri ve
`openclaw.content.*` öznitelikleri trace dışında kalmalıdır. Ham OTLP
payload'ları prompt sentinel'ini, yanıt sentinel'ini veya QA oturum
anahtarını içermemelidir. QA suite artifact'lerinin yanına `otel-smoke-summary.json` yazar.

Collector destekli OpenTelemetry smoke'u için şunu çalıştırın:

```bash
pnpm qa:otel:collector-smoke
```

Bu hat, aynı yerel alıcının önüne gerçek bir OpenTelemetry Collector Docker container'ı koyar.
Endpoint kablolamasını, collector uyumluluğunu veya süreç içi alıcının maskeleyebileceği
OTLP dışa aktarma davranışını değiştirirken bunu kullanın.

Korumalı Prometheus scrape smoke'u için şunu çalıştırın:

```bash
pnpm qa:prometheus:smoke
```

Bu diğer ad, `diagnostics-prometheus` etkin halde `docker-prometheus-smoke`
QA senaryosunu çalıştırır, kimliği doğrulanmamış scrape işlemlerinin reddedildiğini
doğrular, ardından kimliği doğrulanmış scrape işleminin prompt içeriği, yanıt
içeriği, ham tanılama tanımlayıcıları, kimlik doğrulama token’ları veya yerel
yollar olmadan sürüm açısından kritik metrik ailelerini içerdiğini denetler.

Her iki gözlemlenebilirlik smoke testini arka arkaya çalıştırmak için şunu kullanın:

```bash
pnpm qa:observability:smoke
```

Collector destekli OpenTelemetry hattı ve korumalı Prometheus scrape smoke testi
için şunu kullanın:

```bash
pnpm qa:observability:collector-smoke
```

Gözlemlenebilirlik QA yalnızca kaynak checkout’unda kalır. npm tarball kasıtlı
olarak QA Lab’i içermez; bu nedenle paket Docker sürüm hatları `qa` komutlarını
çalıştırmaz. Tanılama enstrümantasyonunu değiştirirken derlenmiş bir kaynak
checkout’undan `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` veya
`pnpm qa:observability:smoke` kullanın.

Model sağlayıcı kimlik bilgileri gerektirmeyen, gerçek aktarım kullanan bir
Matrix smoke hattı için deterministik sahte OpenAI sağlayıcısıyla hızlı profili
çalıştırın:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Canlı frontier sağlayıcı hattı için OpenAI uyumlu kimlik bilgilerini açıkça
sağlayın:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Bu hat için tam CLI başvurusu, profil/senaryo kataloğu, ortam değişkenleri ve artifact düzeni [Matrix QA](/tr/concepts/qa-matrix) içinde yer alır. Kısaca: Docker’da tek kullanımlık bir Tuwunel homeserver hazırlar, geçici sürücü/SUT/gözlemci kullanıcıları kaydeder, gerçek Matrix Plugin’ini bu aktarıma kapsamlanmış bir alt QA gateway içinde çalıştırır (`qa-channel` yok), ardından `.artifacts/qa-e2e/matrix-<timestamp>/` altında bir Markdown raporu, JSON özeti, observed-events artifact’i ve birleşik çıktı günlüğü yazar.

Senaryolar, birim testlerinin uçtan uca kanıtlayamayacağı aktarım davranışlarını kapsar: mention gating, allow-bot ilkeleri, allowlist’ler, üst düzey ve thread’li yanıtlar, DM yönlendirmesi, reaction işleme, gelen düzenlemeyi bastırma, yeniden başlatma replay dedupe, homeserver kesintisi kurtarma, onay metadata teslimi, medya işleme ve Matrix E2EE bootstrap/kurtarma/doğrulama akışları. E2EE CLI profili ayrıca gateway yanıtlarını denetlemeden önce aynı tek kullanımlık homeserver üzerinden `openclaw matrix encryption setup` ve doğrulama komutlarını çalıştırır.

Discord’da hata yeniden üretimi için yalnızca Mantis’e özgü isteğe bağlı senaryolar da vardır. Açık durum reaction zaman çizelgesi için
`--scenario discord-status-reactions-tool-only` kullanın veya gerçek bir
Discord thread’i oluşturup `message.thread-reply` öğesinin bir `filePath`
ekini koruduğunu doğrulamak için `--scenario discord-thread-reply-filepath-attachment`
kullanın. Bu senaryolar varsayılan canlı Discord hattının dışında tutulur,
çünkü geniş smoke kapsamı yerine önce/sonra yeniden üretim problarıdır.
Thread eki Mantis workflow’u, QA ortamında `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`
veya `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` yapılandırılmışsa oturum açmış
bir Discord Web tanık videosu da ekleyebilir. Bu görüntüleyici profili yalnızca
görsel yakalama içindir; başarılı/başarısız kararı yine Discord REST oracle’dan
gelir.

CI, `.github/workflows/qa-live-transports-convex.yml` içinde aynı komut yüzeyini kullanır.
Zamanlanmış ve varsayılan manuel çalıştırmalar, QA tarafından sağlanan
live-frontier kimlik bilgileri, `--fast` ve
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` ile hızlı Matrix profilini çalıştırır.
Manuel `matrix_profile=all`, beş profil shard’ına yayılır.

Gerçek aktarım kullanan Telegram, Discord, Slack ve WhatsApp smoke hatları için:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Bunlar iki bot veya hesap (sürücü + SUT) içeren önceden var olan gerçek bir kanalı hedefler. Gerekli ortam değişkenleri, senaryo listeleri, çıktı artifact’leri ve Convex kimlik bilgisi havuzu aşağıdaki [Telegram, Discord, Slack ve WhatsApp QA başvurusu](#telegram-discord-slack-and-whatsapp-qa-reference) içinde belgelenmiştir.

VNC kurtarmalı tam bir Slack masaüstü VM çalıştırması için şunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bu komut bir Crabbox masaüstü/tarayıcı makinesi kiralar, Slack canlı hattını
VM içinde çalıştırır, VNC tarayıcısında Slack Web’i açar, masaüstünü yakalar ve
video yakalama kullanılabiliyorsa `slack-qa/`, `slack-desktop-smoke.png` ve
`slack-desktop-smoke.mp4` dosyalarını Mantis artifact dizinine kopyalar. Crabbox
masaüstü/tarayıcı kiralamaları yakalama araçlarını ve tarayıcı/native-build yardımcı
paketlerini baştan sağlar; bu nedenle senaryo yalnızca eski kiralamalarda fallback
yüklemelidir. Mantis, yavaş çalıştırmalarda sürenin kiralama ısınmasına, kimlik
bilgisi edinimine, uzak kuruluma veya artifact kopyalamaya gidip gitmediğini
göstermek için toplam ve aşama bazlı süreleri `mantis-slack-desktop-smoke-report.md`
içinde raporlar. VNC üzerinden Slack Web’e manuel olarak giriş yaptıktan sonra
`--lease-id <cbx_...>` ile yeniden kullanın; yeniden kullanılan kiralamalar
Crabbox’ın pnpm store önbelleğini de sıcak tutar. Varsayılan
`--hydrate-mode source`, bir kaynak checkout’undan doğrular ve VM içinde
install/build çalıştırır. `--hydrate-mode prehydrated` seçeneğini yalnızca
yeniden kullanılan uzak workspace zaten `node_modules` ve derlenmiş `dist/`
içerdiğinde kullanın; bu mod pahalı install/build adımını atlar ve workspace
hazır değilse fail-closed davranır. `--gateway-setup` ile Mantis, VM içinde
`38973` portunda kalıcı bir OpenClaw Slack Gateway çalışır halde bırakır; onsuz,
komut normal bot-to-bot Slack QA hattını çalıştırır ve artifact yakalamadan sonra çıkar.

Yerel Slack onay kullanıcı arayüzünü masaüstü kanıtıyla doğrulamak için Mantis
onay checkpoint modunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Bu mod `--gateway-setup` ile karşılıklı olarak dışlayıcıdır. Slack onay
senaryolarını çalıştırır, onay dışı senaryo kimliklerini reddeder, her bekleyen
ve çözümlenmiş onay durumunda bekler, gözlemlenen Slack API mesajını
`approval-checkpoints/<scenario>-pending.png` ve
`approval-checkpoints/<scenario>-resolved.png` içine render eder, ardından herhangi
bir checkpoint, mesaj kanıtı, acknowledgement veya render edilmiş ekran görüntüsü
eksik ya da boşsa başarısız olur. Soğuk CI kiralamaları `slack-desktop-smoke.png`
içinde hâlâ Slack oturum açma ekranını gösterebilir; onay checkpoint görüntüleri
bu hat için görsel kanıttır.

Operatör kontrol listesi, GitHub workflow dispatch komutu, kanıt yorumu
sözleşmesi, hydrate-mode karar tablosu, süre yorumlama ve hata işleme adımları
[Mantis Slack Desktop Runbook](/tr/concepts/mantis-slack-desktop-runbook) içinde yer alır.

Agent/CV tarzı bir masaüstü görevi için şunu çalıştırın:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task`, bir Crabbox masaüstü/tarayıcı makinesi kiralar veya yeniden
kullanır, `crabbox record --while` başlatır, görünür tarayıcıyı iç içe bir
`visual-driver` üzerinden sürer, `visual-task.png` yakalar, `--vision-mode image-describe`
seçildiğinde ekran görüntüsüne karşı `openclaw infer image describe` çalıştırır
ve `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` ve `mantis-visual-task-report.md` yazar.
`--expect-text` ayarlandığında vision prompt’u yapılandırılmış bir JSON verdict
ister ve yalnızca model olumlu görünür kanıt bildirdiğinde başarılı olur; hedef
metni yalnızca alıntılayan olumsuz bir yanıt assertion’ı başarısız yapar.
Masaüstü, tarayıcı, ekran görüntüsü ve video tesisatını bir image-understanding
sağlayıcısını çağırmadan doğrulayan modelsiz bir smoke için `--vision-mode metadata`
kullanın. Kayıt, `visual-task` için gerekli bir artifact’tir; Crabbox boş olmayan
bir `visual-task.mp4` kaydetmezse görsel driver geçmiş olsa bile görev başarısız
olur. Hata durumunda, görev zaten başarılı olmuş ve `--keep-lease` ayarlanmamış
olmadıkça Mantis kiralamayı VNC için tutar.

Havuzlanmış canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex broker ortamını denetler, endpoint ayarlarını doğrular ve maintainer secret mevcut olduğunda admin/list erişilebilirliğini doğrular. Secret’lar için yalnızca ayarlı/eksik durumunu raporlar.

## Canlı aktarım kapsamı

Canlı aktarım hatları, her birinin kendi senaryo listesi şeklini icat etmesi yerine tek bir sözleşmeyi paylaşır. `qa-channel`, geniş sentetik ürün davranışı paketidir ve canlı aktarım kapsam matrisinin parçası değildir.

Canlı aktarım runner’ları paylaşılan senaryo kimliklerini, baseline kapsam
yardımcılarını ve senaryo seçimi yardımcısını
`openclaw/plugin-sdk/qa-live-transport-scenarios` içinden import etmelidir.

| Hat      | Canary | Mention gating | Bot-to-bot | Allowlist engeli | Üst düzey yanıt | Alıntı yanıt | Yeniden başlatma sürdürme | Thread takibi | Thread izolasyonu | Reaction gözlemi | Yardım komutu | Yerel komut kaydı |
| -------- | ------ | -------------- | ---------- | ---------------- | --------------- | ------------ | ------------------------- | ------------- | ----------------- | ---------------- | ------------- | ----------------- |
| Matrix   | x      | x              | x          | x                | x               |              | x                         | x             | x                 | x                |               |                   |
| Telegram | x      | x              | x          |                  |                 |              |                           |               |                   |                  | x             |                   |
| Discord  | x      | x              | x          |                  |                 |              |                           |               |                   |                  |               | x                 |
| Slack    | x      | x              | x          | x                | x               |              | x                         | x             | x                 |                  |               |                   |
| WhatsApp | x      | x              |            | x                | x               | x            | x                         |               |                   | x                | x             |                   |

Bu, `qa-channel` öğesini geniş ürün davranışı paketi olarak tutarken Matrix,
Telegram ve diğer canlı aktarımların tek bir açık aktarım sözleşmesi kontrol
listesini paylaşmasını sağlar.

QA yoluna Docker sokmadan tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass guest başlatır, bağımlılıkları yükler, OpenClaw’ı guest
içinde derler, `qa suite` çalıştırır, ardından normal QA raporunu ve özetini
host üzerinde `.artifacts/qa-e2e/...` içine geri kopyalar.
Host ve aynı senaryo seçimi davranışını host üzerindeki `qa suite` ile yeniden kullanır.
Host ve Multipass suite çalıştırmaları varsayılan olarak izole gateway worker’larıyla
birden fazla seçili senaryoyu paralel yürütür. `qa-channel` varsayılan olarak
4 concurrency kullanır ve seçili senaryo sayısıyla sınırlanır. Worker sayısını
ayarlamak için `--concurrency <count>` veya seri yürütme için `--concurrency 1`
kullanın.
Kişisel asistan benchmark paketini çalıştırmak için `--pack personal-agent`
kullanın. Paket seçici, tekrarlanan `--scenario` bayraklarıyla toplamsaldır:
açık senaryolar önce çalışır, ardından paket senaryoları yinelenenler kaldırılmış
şekilde paket sırasına göre çalışır.
Özel bir QA runner zaten OpenTelemetry collector kurulumunu sağlıyor ve
OpenTelemetry ile Prometheus tanılama smoke senaryolarını birlikte seçmek istiyorsa
`--pack observability` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan kodla çıkar. Hata
çıkış kodu olmadan artifact istiyorsanız `--allow-failures` kullanın.
Canlı çalıştırmalar, guest için pratik olan desteklenen QA kimlik doğrulama
girdilerini iletir: ortam tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı
yapılandırma yolu ve mevcut olduğunda `CODEX_HOME`. Guest’in bağlı workspace
üzerinden geri yazabilmesi için `--output-dir` değerini repo kökü altında tutun.

## Telegram, Discord, Slack ve WhatsApp QA başvurusu

Matrix, senaryo sayısı ve Docker destekli homeserver sağlama işlemi nedeniyle [ayrı bir sayfaya](/tr/concepts/qa-matrix) sahiptir. Telegram, Discord, Slack ve WhatsApp önceden var olan gerçek taşımalara karşı çalışır, bu nedenle başvuruları burada yer alır.

### Paylaşılan CLI bayrakları

Bu hatlar `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` üzerinden kaydolur ve aynı bayrakları kabul eder:

| Bayrak                                | Varsayılan                                        | Açıklama                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                 | Yalnızca bu senaryoyu çalıştırır. Tekrarlanabilir.                                                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Raporların, özetlerin, kanıtların, taşımaya özgü yapıtların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` temelinde çözümlenir.          |
| `--repo-root <path>`                  | `process.cwd()`                                   | Nötr bir cwd konumundan çağırırken depo kökü.                                                                                                            |
| `--sut-account <id>`                  | `sut`                                             | QA gateway yapılandırması içindeki geçici hesap kimliği.                                                                                                 |
| `--provider-mode <mode>`              | `live-frontier`                                   | `mock-openai` veya `live-frontier` (eski `live-openai` hâlâ çalışır).                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | sağlayıcı varsayılanı                             | Birincil/alternatif model başvuruları.                                                                                                                   |
| `--fast`                              | kapalı                                            | Desteklendiğinde sağlayıcı hızlı modu.                                                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                             | Bkz. [Convex kimlik bilgisi havuzu](#convex-credential-pool).                                                                                            |
| `--credential-role <maintainer\|ci>`  | CI içinde `ci`, aksi halde `maintainer`           | `--credential-source convex` kullanıldığında kullanılan rol.                                                                                             |

Her hat, başarısız olan herhangi bir senaryoda sıfır dışı kodla çıkar. `--allow-failures`, başarısız çıkış kodu ayarlamadan yapıtları yazar.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

İki ayrı botu (sürücü + SUT) olan bir gerçek özel Telegram grubunu hedefler. SUT botunun bir Telegram kullanıcı adı olmalıdır; botlar arası gözlem, her iki botta da `@BotFather` içinde **Bot-to-Bot Communication Mode** etkin olduğunda en iyi şekilde çalışır.

`--credential-source env` kullanıldığında gerekli env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - sayısal sohbet kimliği (dize).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

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

Örtük varsayılan küme her zaman canary, mention gating, yerel komut yanıtları, komut adresleme ve botlar arası grup yanıtlarını kapsar. `mock-openai` varsayılanları ayrıca deterministik yanıt zinciri ve son mesaj akışı denetimlerini içerir. `telegram-current-session-status-tool`, yalnızca canary’den doğrudan sonra iş parçacığına bağlandığında kararlı olduğu, rastgele yerel komut yanıtlarından sonra kararlı olmadığı için opt-in kalır. Regresyon başvurularıyla birlikte geçerli varsayılan/isteğe bağlı ayrımı yazdırmak için `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` kullanın.

Çıktı yapıtları:

- `telegram-qa-report.md`
- `qa-evidence.json` - profil, kapsam, sağlayıcı, kanal, yapıtlar, sonuç ve RTT alanları dahil canlı taşıma denetimleri için kanıt girdileri.

Paket Telegram çalıştırmaları aynı Telegram kimlik bilgisi sözleşmesini kullanır. Tekrarlanan RTT
ölçümü normal paket Telegram canlı hattının parçasıdır; RTT
dağılımı seçilen RTT denetimi için `result.timing` altında `qa-evidence.json`
içine katlanır.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlandığında, paket canlı sarmalayıcısı
bir `kind: "telegram"` kimlik bilgisi kiralar, kiralanan grup/sürücü/SUT bot
env değerlerini kurulu paket çalıştırmasına aktarır, kiralamanın Heartbeat işlemini yapar ve
kapanışta serbest bırakır. Paket sarmalayıcısı, varsayılan olarak
`telegram-mentioned-message-reply` için 20 RTT denetimi, 30 sn RTT zaman aşımı ve Convex seçildiğinde CI dışında Convex rolü
`maintainer` kullanır.
Ayrı bir RTT komutu veya Telegram’a özgü özet biçimi oluşturmadan RTT ölçümünü ayarlamak için
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
veya `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` değerlerini geçersiz kılın.

### Discord QA

```bash
pnpm openclaw qa discord
```

İki botlu bir gerçek özel Discord guild kanalını hedefler: harness tarafından kontrol edilen bir sürücü botu ve paketli Discord plugin aracılığıyla alt OpenClaw gateway tarafından başlatılan bir SUT botu. Kanal mention işlemeyi, SUT botunun Discord ile yerel `/help` komutunu kaydettiğini ve opt-in Mantis kanıt senaryolarını doğrular.

`--credential-source env` kullanıldığında gerekli env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord tarafından döndürülen SUT bot kullanıcı kimliğiyle eşleşmelidir (aksi halde hat hızlı şekilde başarısız olur).

İsteğe bağlı:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` gözlemlenen mesaj yapıtlarında ileti gövdelerini tutar.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID`, `discord-voice-autojoin` için ses/sahne kanalını seçer; bu olmadan senaryo, SUT botu için ilk görünür ses/sahne kanalını seçer.

Senaryolar (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in ses senaryosu. Tek başına çalışır, `channels.discord.voice.autoJoin` etkinleştirir ve SUT botunun geçerli Discord ses durumunun hedef ses/sahne kanalı olduğunu doğrular. Convex Discord kimlik bilgileri isteğe bağlı `voiceChannelId` içerebilir; aksi halde çalıştırıcı guild içindeki ilk görünür ses/sahne kanalını keşfeder.
- `discord-status-reactions-tool-only` - opt-in Mantis senaryosu. SUT’u `messages.statusReactions.enabled=true` ile her zaman açık, yalnızca araç kullanan guild yanıtlarına geçirdiği için tek başına çalışır, ardından REST tepki zaman çizelgesi ve HTML/PNG görsel yapıtları yakalar. Mantis önce/sonra raporları ayrıca senaryo tarafından sağlanan MP4 yapıtlarını `baseline.mp4` ve `candidate.mp4` olarak korur.

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
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Çıktı yapıtları:

- `discord-qa-report.md`
- `qa-evidence.json` - canlı taşıma denetimleri için kanıt girdileri.
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.
- Durum tepkisi senaryosu çalıştığında `discord-qa-reaction-timelines.json` ve `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

İki ayrı botlu bir gerçek özel Slack kanalını hedefler: harness tarafından kontrol edilen bir sürücü botu ve paketli Slack plugin aracılığıyla alt OpenClaw gateway tarafından başlatılan bir SUT botu.

`--credential-source env` kullanıldığında gerekli env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` gözlemlenen mesaj yapıtlarında ileti gövdelerini tutar.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`, Mantis için görsel onay
  denetim noktalarını etkinleştirir. Çalıştırıcı `<scenario>.pending.json` ve
  `<scenario>.resolved.json` yazar, ardından eşleşen `.ack.json` dosyalarını bekler.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS`, denetim noktası
  alındı zaman aşımını geçersiz kılar. Varsayılan `120000` değeridir.

Senaryolar (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - opt-in yerel Slack exec onay senaryosu.
  Gateway üzerinden bir exec onayı ister, Slack iletisinde
  yerel onay düğmeleri olduğunu doğrular, bunu çözer ve çözümlenmiş Slack güncellemesini doğrular.
- `slack-approval-plugin-native` - opt-in yerel Slack plugin onay senaryosu.
  Exec ve plugin onay iletmeyi birlikte etkinleştirir; böylece plugin olayları
  exec onay yönlendirmesi tarafından bastırılmaz, ardından aynı bekleyen/çözülmüş
  yerel Slack UI yolunu doğrular.

Çıktı yapıtları:

- `slack-qa-report.md`
- `qa-evidence.json` - canlı taşıma denetimleri için kanıt girdileri.
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.
- `approval-checkpoints/` - yalnızca Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` ayarladığında; denetim noktası JSON,
  alındı JSON ve bekleyen/çözülmüş ekran görüntülerini içerir.

#### Slack çalışma alanını ayarlama

Hat, tek bir çalışma alanında iki ayrı Slack uygulamasına ve her iki botun da üye olduğu bir kanala ihtiyaç duyar:

- `channelId` - her iki botun da davet edildiği bir kanalın `Cxxxxxxxxxx` kimliği. Özel bir kanal kullanın; hat her çalıştırmada gönderi yapar.
- `driverBotToken` - **Driver** uygulamasının bot token’ı (`xoxb-...`).
- `sutBotToken` - SUT’un bot kullanıcı kimliğinin ayrı olması için sürücüden ayrı bir Slack uygulaması olması gereken **SUT** uygulamasının bot token’ı (`xoxb-...`).
- `sutAppToken` - SUT uygulamasının `connections:write` yetkisine sahip uygulama düzeyi token’ı (`xapp-...`); SUT uygulamasının olayları alabilmesi için Socket Mode tarafından kullanılır.

Üretim çalışma alanını yeniden kullanmak yerine QA’ya ayrılmış bir Slack çalışma alanını tercih edin.

Aşağıdaki SUT manifesti, paketli Slack plugin’in üretim kurulumunu (`extensions/slack/src/setup-shared.ts:10`) kasıtlı olarak canlı Slack QA paketi tarafından kapsanan izinlere ve olaylara daraltır. Kullanıcıların gördüğü üretim kanalı kurulumu için bkz. [Slack kanalı hızlı kurulum](/tr/channels/slack#quick-setup); QA Driver/SUT çifti, hat tek bir çalışma alanında iki ayrı bot kullanıcı kimliğine ihtiyaç duyduğu için kasıtlı olarak ayrıdır.

**1. Driver uygulamasını oluşturun**

[api.slack.com/apps](https://api.slack.com/apps) adresine gidin → _Yeni Uygulama Oluştur_ → _Bir manifestten_ → QA çalışma alanını seçin, aşağıdaki manifesti yapıştırın, ardından _Çalışma Alanına Yükle_:

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

_Bot Kullanıcısı OAuth Tokenı_ değerini (`xoxb-...`) kopyalayın - bu `driverBotToken` olur. Sürücünün yalnızca ileti göndermesi ve kendini tanımlaması gerekir; olaylar veya Socket Mode gerekmez.

**2. SUT uygulamasını oluşturun**

Aynı çalışma alanında _Yeni Uygulama Oluştur → Bir manifestten_ işlemini tekrarlayın. Bu QA uygulaması, paketle gelen Slack Plugin'inin üretim manifestinin (`extensions/slack/src/setup-shared.ts:10`) özellikle daha dar bir sürümünü kullanır: canlı Slack QA paketi henüz tepki işlemeyi kapsamadığı için tepki kapsamları ve olayları atlanmıştır.

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

- _Çalışma Alanına Yükle_ → _Bot Kullanıcısı OAuth Tokenı_ değerini kopyalayın → bu `sutBotToken` olur.
- _Temel Bilgiler → Uygulama Düzeyi Tokenlar → Token ve Kapsamlar Oluştur_ → `connections:write` kapsamını ekleyin → kaydedin → `xapp-...` değerini kopyalayın → bu `sutAppToken` olur.

Her token üzerinde `auth.test` çağırarak iki botun farklı kullanıcı kimliklerine sahip olduğunu doğrulayın. Çalışma zamanı sürücü ve SUT'yi kullanıcı kimliğine göre ayırt eder; ikisi için aynı uygulamayı yeniden kullanmak, bahsetme geçidinde hemen başarısız olur.

**3. Kanalı oluşturun**

QA çalışma alanında bir kanal oluşturun (ör. `#openclaw-qa`) ve kanalın içinden her iki botu davet edin:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_Kanal bilgisi → Hakkında → Kanal Kimliği_ üzerinden `Cxxxxxxxxxx` kimliğini kopyalayın - bu `channelId` olur. Genel bir kanal çalışır; özel kanal kullanırsanız iki uygulamada da zaten `groups:history` bulunduğu için koşumun geçmiş okumaları yine başarılı olur.

**4. Kimlik bilgilerini kaydedin**

İki seçenek vardır. Tek makinede hata ayıklama için ortam değişkenlerini kullanın (dört `OPENCLAW_QA_SLACK_*` değişkenini ayarlayın ve `--credential-source env` iletin) veya CI ve diğer bakımcıların kiralayabilmesi için paylaşılan Convex havuzunu tohumlayın.

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

`count: 1`, `status: "active"` ve `lease` alanı olmamasını bekleyin.

**5. Uçtan uca doğrulayın**

Her iki botun aracı üzerinden birbirleriyle konuşabildiğini doğrulamak için hattı yerelde çalıştırın:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Başarılı bir çalışma 30 saniyeden çok daha kısa sürede tamamlanır ve `slack-qa-report.md`, hem `slack-canary` hem de `slack-mention-gating` durumunu `pass` olarak gösterir. Hat yaklaşık 90 saniye takılıp `Convex credential pool exhausted for kind "slack"` ile çıkarsa havuz ya boştur ya da her satır kiralanmıştır - `qa credentials list --kind slack --status all --json` hangisi olduğunu söyler.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

İki ayrılmış WhatsApp Web hesabını hedefler: koşum tarafından kontrol edilen
bir sürücü hesabı ve alt OpenClaw Gateway tarafından paketle gelen
WhatsApp Plugin'i üzerinden başlatılan bir SUT hesabı.

`--credential-source env` kullanıldığında gerekli ortam:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

İsteğe bağlı:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID`, `whatsapp-mention-gating`,
  `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, grup eylem/medya/anket senaryoları ve
  `whatsapp-group-allowlist-block` gibi grup senaryolarını etkinleştirir.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`, ileti gövdelerini
  gözlemlenen ileti yapıtlarında tutar.

Senaryo kataloğu (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Temel ve grup geçidi: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Yerel komutlar: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Yanıt ve son çıktı davranışı: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Kullanıcı yolu ileti eylemleri: `whatsapp-agent-message-action-react`,
  gerçek bir sürücü DM'sinden başlar, modelin `message` aracını çağırmasına
  izin verir ve yerel WhatsApp tepkisini gözlemler. `whatsapp-agent-message-action-upload-file`,
  `message(action=upload-file)` için aynı duruşu kullanır ve yerel
  WhatsApp medyasını gözlemler. `whatsapp-group-agent-message-action-react` ve
  `whatsapp-group-agent-message-action-upload-file`, aynı kullanıcı tarafından görülebilen
  eylemleri gerçek bir WhatsApp grubunda kanıtlar.
- Grup yayılımı: `whatsapp-broadcast-group-fanout`, bahsetme içeren tek bir
  WhatsApp grup iletisinden başlar ve `main` ile `qa-second` tarafından verilen
  farklı görünür yanıtları doğrular.
- Grup etkinleştirme: `whatsapp-group-activation-always`, gerçek bir grup
  oturumunu `/activation always` olarak değiştirir, bahsetme içermeyen bir grup iletisinin
  ajanı uyandırdığını kanıtlar ve ardından `/activation mention` değerini geri yükler.
  `whatsapp-group-reply-to-bot-triggers`, bir bot yanıtı tohumlar, açık bir
  bahsetme olmadan ona yerel alıntılı yanıt gönderir ve ajanın bu yanıt bağlamından
  uyandığını doğrular.
- Gelen medya ve yapılandırılmış iletiler: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Bunlar sürücü üzerinden gerçek WhatsApp görsel, ses, belge, konum, kişi, çıkartma
  ve tepki olayları gönderir.
- Doğrudan Gateway sözleşme yoklamaları:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Bunlar model istemini bilerek atlar ve
  deterministik Gateway/kanal `send`, `poll` ve `message.action`
  sözleşmelerini kanıtlar.
- Erişim denetimi kapsamı: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Yerel onaylar: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Durum tepkileri: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Katalog şu anda 50 senaryo içerir. `live-frontier` varsayılan hattı,
hızlı duman kapsamı için 10 senaryoda küçük tutulur. `mock-openai` varsayılan
hattı, yalnızca model çıktısını taklit ederken gerçek WhatsApp taşıması üzerinden
44 deterministik senaryo çalıştırır. Onay senaryoları ve birkaç daha ağır/engelleyici
kontrol, senaryo kimliğine göre açık kalır.

WhatsApp QA sürücüsü yapılandırılmış canlı olayları (`text`, `media`,
`location`, `reaction` ve `poll`) gözlemler ve etkin olarak medya, anketler,
kişiler, konumlar ve çıkartmalar gönderebilir. QA Lab, bu sürücüyü özel
WhatsApp çalışma zamanı dosyalarına uzanmak yerine `@openclaw/whatsapp/api.js`
paket yüzeyi üzerinden içe aktarır. Grup gözlemleri için `fromJid` grup JID'sidir,
`participantJid` ve `fromPhoneE164` ise katılımcı göndereni tanımlar. İleti
içeriği varsayılan olarak redakte edilir. Doğrudan Gateway
anket, upload-file, medya, grup anketi, grup medyası ve yanıt şekli yoklamaları taşıma/API sözleşmesi
kontrolleridir; bunlar bir kullanıcı isteminin ajanın aynı eylemi seçmesini
sağladığının kanıtı olarak ele alınmaz. Kullanıcı yolu eylem kanıtı,
`whatsapp-agent-message-action-react` ve
`whatsapp-group-agent-message-action-react` gibi senaryolardan gelir; burada sürücü normal bir
WhatsApp iletisi gönderir ve QA Lab ortaya çıkan yerel WhatsApp yapıtını gözlemler.
WhatsApp raporları, kanıtın gerçekte kanıtladığından daha güçlü bir sözleşmeyle
karıştırılamaması için her senaryonun duruşunu (`user-path`, `direct-gateway`
veya `native-approval`) içerir.

Çıktı yapıtları:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - canlı taşıma kontrolleri için kanıt girdileri.
- `whatsapp-qa-observed-messages.json` - `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.

### Convex kimlik bilgisi havuzu

Telegram, Discord, Slack ve WhatsApp hatları, yukarıdaki ortam değişkenlerini okumak yerine paylaşılan bir Convex havuzundan kimlik bilgileri kiralayabilir. `--credential-source convex` iletin (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın); QA Lab özel bir kira alır, çalışma süresi boyunca Heartbeat gönderir ve kapanışta serbest bırakır. Havuz türleri `"telegram"`, `"discord"`, `"slack"` ve `"whatsapp"` değerleridir.

Aracının `admin/add` üzerinde doğruladığı yük şekilleri:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` sayısal bir sohbet kimliği dizesi olmalıdır.
- Gerçek Telegram kullanıcısı (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - Yalnızca Mantis Telegram Desktop kanıtı. Genel QA Lab hatları bu türü edinmemelidir.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - telefon numaraları birbirinden farklı E.164 dizeleri olmalıdır.

Mantis Telegram Desktop kanıt iş akışı, hem TDLib CLI sürücüsü hem de Telegram Desktop tanığı için tek bir özel Convex `telegram-user` kiralaması tutar, ardından kanıtı yayımladıktan sonra bunu serbest bırakır.

Bir PR deterministik görsel fark gerektirdiğinde Mantis, Telegram biçimlendiricisi veya teslim katmanı değişirken `main` üzerinde ve PR başlığında aynı sahte model yanıtını kullanabilir. Yakalama varsayılanları PR yorumları için ayarlanmıştır: standart Crabbox sınıfı, 24fps masaüstü kaydı, 24fps hareket GIF'i ve 1920px önizleme genişliği. Önce/sonra yorumları, yalnızca amaçlanan GIF'leri içeren temiz bir paket yayımlamalıdır.

Slack hatları da havuzu kullanabilir. Slack yük şekli denetimleri şu anda aracı yerine Slack QA çalıştırıcısında bulunur; Slack kanal kimliği `Cxxxxxxxxxx` gibi olacak şekilde `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` kullanın. Uygulama ve kapsam hazırlığı için [Slack çalışma alanını ayarlama](#setting-up-the-slack-workspace) bölümüne bakın.

Operasyonel ortam değişkenleri ve Convex aracı uç nokta sözleşmesi [Test Etme → Convex üzerinden paylaşılan Telegram kimlik bilgileri](/tr/help/testing#shared-telegram-credentials-via-convex-v1) içinde bulunur (bölüm adı çok kanallı havuzdan öncesine aittir; kiralama semantiği türler arasında ortaktır).

## Repo destekli tohumlar

Tohum varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Bunlar kasıtlı olarak git içindedir; böylece QA planı hem insanlar hem de agent tarafından görülebilir.

`qa-lab` genel bir YAML senaryo çalıştırıcısı olarak kalmalıdır. Her senaryo YAML dosyası, tek bir test çalışması için doğruluk kaynağıdır ve şunları tanımlamalıdır:

- üst düzey `title`
- `scenario` meta verileri
- `scenario` içinde isteğe bağlı kategori, yetenek, hat ve risk meta verileri
- `scenario` içinde doküman ve kod referansları
- `scenario` içinde isteğe bağlı Plugin gereksinimleri
- `scenario` içinde isteğe bağlı Gateway yapılandırma yaması
- akış senaryoları için çalıştırılabilir üst düzey `flow` veya Vitest ve Playwright senaryoları için `scenario.execution.kind` /
  `scenario.execution.path`

`flow` arkasındaki yeniden kullanılabilir çalışma zamanı yüzeyinin genel ve kesişen kapsamda kalmasına izin verilir. Örneğin YAML senaryoları, Gateway `browser.request` bağlantısı üzerinden gömülü Control UI'yi yöneten tarayıcı tarafı yardımcılarıyla taşıma tarafı yardımcılarını, özel durum çalıştırıcısı eklemeden birleştirebilir.

Senaryo dosyaları kaynak ağacı klasörü yerine ürün yeteneğine göre gruplanmalıdır. Dosyalar taşındığında senaryo kimliklerini kararlı tutun; uygulama izlenebilirliği için `docsRefs` ve `codeRefs` kullanın.

Temel liste aşağıdakileri kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- ileti dizisi davranışı
- ileti eylemi yaşam döngüsü
- Cron geri çağrıları
- bellek hatırlama
- model değiştirme
- alt agent devri
- repo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı sahte hatları

`qa suite` iki yerel sağlayıcı sahte hattına sahiptir:

- `mock-openai`, senaryo farkındalığına sahip OpenClaw sahtesidir. Repo destekli QA ve eşdeğerlik geçitleri için varsayılan deterministik sahte hat olarak kalır.
- `aimock`, deneysel protokol, fixture, kayıt/yeniden oynatma ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Eklemelidir ve `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında bulunur. Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlatmasına, Gateway model yapılandırmasına, kimlik doğrulama profili hazırlama ihtiyaçlarına ve canlı/sahte yetenek bayraklarına sahiptir. Paylaşılan suite ve Gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirilmelidir.

## Taşıma bağdaştırıcıları

`qa-lab`, YAML QA senaryoları için genel bir taşıma bağlantısına sahiptir. `qa-channel` sentetik varsayılandır. `crabline`, yerel sağlayıcı şeklindeki sunucuları başlatır ve OpenClaw'ın normal kanal Pluginlerini bunlara karşı çalıştırır. `live`, gerçek sağlayıcı kimlik bilgileri ve dış kanallar için ayrılmıştır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütmeyi, worker eşzamanlılığını, artifact yazımını ve raporlamayı sahiplenir.
- Taşıma bağdaştırıcısı Gateway yapılandırmasını, hazır olmayı, gelen ve giden gözlemi, taşıma eylemlerini ve normalleştirilmiş taşıma durumunu sahiplenir.
- `qa/scenarios/` altındaki YAML senaryo dosyaları test çalışmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

### Kanal ekleme

YAML QA sistemine kanal eklemek, kanal uygulamasını ve kanal sözleşmesini çalıştıran bir senaryo paketini gerektirir. Smoke CI kapsamı için eşleşen Crabline yerel sağlayıcı sunucusunu ekleyin ve `crabline` sürücüsü üzerinden sunun.

Paylaşılan `qa-lab` konağı akışı sahiplenebiliyorsa yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab` paylaşılan konak mekaniklerini sahiplenir:

- `openclaw qa` komut kökü
- suite başlatma ve kapatma
- worker eşzamanlılığı
- artifact yazımı
- rapor üretimi
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı Pluginleri taşıma sözleşmesini sahiplenir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökü altına nasıl bağlandığı
- Gateway'in bu taşıma için nasıl yapılandırıldığı
- hazır olmanın nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden iletilerin nasıl gözlendiği
- transkriptlerin ve normalleştirilmiş taşıma durumunun nasıl sunulduğu
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşımaya özgü sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir kanal için minimum benimseme çıtası:

1. `qa-lab` öğesini paylaşılan `qa` kökünün sahibi olarak tutun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` konak bağlantısında uygulayın.
3. Taşımaya özgü mekanikleri çalıştırıcı Plugini veya kanal harness'ı içinde tutun.
4. Rakip bir kök komut kaydetmek yerine çalıştırıcıyı `openclaw qa <runner>` olarak bağlayın. Çalıştırıcı Pluginleri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır. `runtime-api.ts` hafif kalmalıdır; tembel CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında YAML senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Repo kasıtlı bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu ilgili çalıştırıcı Plugininde veya Plugin harness'ında tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yetenek gerektiriyorsa, `suite.ts` içinde kanala özgü bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşımaya özgü tutun ve bunu senaryo sözleşmesinde açık hale getirin.

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

Uyumluluk takma adları mevcut senaryolar için kullanılabilir kalır - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ancak yeni senaryo yazımı genel adları kullanmalıdır. Takma adlar, ilerideki model olarak değil, bir bayrak günü geçişinden kaçınmak için vardır.

## Raporlama

`qa-lab`, gözlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır. Rapor şunları yanıtlamalıdır:

- Ne çalıştı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryolarını eklemeye değer

Mevcut senaryoların envanteri için - takip çalışmasını boyutlandırırken veya yeni bir taşıma bağlarken kullanışlıdır - `pnpm openclaw qa coverage` çalıştırın (makine tarafından okunabilir çıktı için `--json` ekleyin).
Dokunulan bir davranış veya dosya yolu için odaklı kanıt seçerken `pnpm openclaw qa coverage --match <query>` çalıştırın.
Eşleşme raporu senaryo meta verilerini, doküman referanslarını, kod referanslarını, kapsam kimliklerini, Pluginleri ve sağlayıcı gereksinimlerini arar, ardından eşleşen `qa suite --scenario ...` hedeflerini yazdırır.
Her `qa suite` çalışması, seçilen senaryo kümesi için üst düzey `qa-evidence.json`,
`qa-suite-summary.json` ve `qa-suite-report.md` artifact'lerini yazar. `execution.kind: vitest` veya
`execution.kind: playwright` bildiren senaryolar eşleşen test yolunu çalıştırır ve ayrıca senaryo başına günlükler yazar. `execution.kind: script` bildiren senaryolar,
kanıt üreticisini `execution.path` konumunda `node --import tsx` üzerinden çalıştırır (`execution.args` içinde
`${outputDir}` ve `${scenarioId}` genişletilmiş olarak); üretici kendi `qa-evidence.json` dosyasını yazar, buradaki girdiler suite çıktısına aktarılır ve artifact yolları ilgili üretici
`qa-evidence.json` dosyasına göre çözümlenir. `qa suite`,
`qa run --qa-profile` üzerinden ulaşıldığında aynı `qa-evidence.json`, seçilen taksonomi kategorileri için profil puan kartı özetini de içerir.
Bunu bir keşif yardımı olarak ele alın, geçit yerine geçen bir şey olarak değil; seçilen senaryo, test edilen davranış için hâlâ doğru sağlayıcı modu, canlı taşıma, Multipass, Testbox veya yayın hattını gerektirir.
Puan kartı bağlamı için [Olgunluk puan kartı](/tr/maturity/scorecard) bölümüne bakın.

Karakter ve stil denetimleri için aynı senaryoyu birden fazla canlı model referansı üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Komut, Docker değil yerel QA gateway alt süreçlerini çalıştırır. Karakter değerlendirme
senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı
yardımı ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır.
Aday modele değerlendirildiği söylenmemelidir. Komut her tam transkripti korur,
temel çalıştırma istatistiklerini kaydeder, ardından judge modellerinden desteklenen
yerlerde `xhigh` akıl yürütme ile hızlı modda çalıştırmaları doğallık, hava ve mizaha
göre sıralamalarını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: judge istemi yine
her transkripti ve çalıştırma durumunu alır, ancak aday referansları `candidate-01`
gibi nötr etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek
referanslara geri eşler.
Aday çalıştırmaları varsayılan olarak `high` düşünme kullanır; GPT-5.5 için
`medium`, bunu destekleyen eski OpenAI değerlendirme referansları için `xhigh`
kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>`
yine genel bir yedek ayarlar ve eski `--model-thinking <provider/model=level>`
biçimi uyumluluk için korunur.
OpenAI aday referansları varsayılan olarak hızlı moda geçer; böylece sağlayıcının
desteklediği yerlerde öncelikli işleme kullanılır. Tek bir adayın veya judge’ın
geçersiz kılmaya ihtiyacı olduğunda satır içinde `,fast`, `,no-fast` veya
`,fast=false` ekleyin. Hızlı modu her aday model için zorlamak istediğinizde yalnızca
`--fast` iletin. Aday ve judge süreleri karşılaştırma analizi için rapora kaydedilir,
ancak judge istemleri açıkça hıza göre sıralama yapmamalarını söyler.
Aday ve judge model çalıştırmalarının ikisi de varsayılan olarak 16 eşzamanlılık
kullanır. Sağlayıcı sınırları veya yerel gateway baskısı bir çalıştırmayı fazla
gürültülü hale getirdiğinde `--concurrency` veya `--judge-concurrency` değerini
düşürün.
Hiçbir aday `--model` iletilmediğinde, karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
Hiçbir `--judge-model` iletilmediğinde, judge’lar varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-8,thinking=high` olur.

## İlgili dokümanlar

- [Matrix QA](/tr/concepts/qa-matrix)
- [Olgunluk puan kartı](/tr/maturity/scorecard)
- [Kişisel ajan karşılaştırma paketi](/tr/concepts/personal-agent-benchmark-pack)
- [QA Channel](/tr/channels/qa-channel)
- [Test etme](/tr/help/testing)
- [Dashboard](/tr/web/dashboard)

---
read_when:
    - QA yığınının nasıl bir araya geldiğini anlamak
    - qa-lab, qa-channel veya bir aktarım bağdaştırıcısını genişletme
    - Repo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçiliğe sahip QA otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, depo destekli senaryolar, canlı taşıma hatları, taşıma bağdaştırıcıları ve raporlama.'
title: QA genel bakışı
x-i18n:
    generated_at: "2026-06-30T14:21:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw'ı tek bir birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde sınamak için tasarlanmıştır.

Geçerli parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veri yolu.
- `extensions/qa-matrix`, gelecekteki çalıştırıcı Plugin'leri: alt QA gateway içinde
  gerçek bir kanalı süren canlı taşıma bağdaştırıcıları.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için repo destekli başlangıç varlıkları.
- [Mantis](/tr/concepts/mantis): gerçek taşımalara, tarayıcı ekran görüntülerine,
  VM durumuna ve PR kanıtına ihtiyaç duyan hatalar için önce ve sonra canlı doğrulama.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Birçoğunun `pnpm qa:*`
betik takma adları vardır; iki biçim de desteklenir.

| Komut                                               | Amaç                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` olmadan paketli QA öz denetimi; `--qa-profile smoke-ci`, `--qa-profile release` veya `--qa-profile all` ile taksonomi destekli olgunluk profili çalıştırıcısı.                                                                                         |
| `qa suite`                                          | Repo destekli senaryoları QA gateway hattına karşı çalıştırır. Takma adlar: tek kullanımlık Linux VM için `pnpm openclaw qa suite --runner multipass`.                                                                                                                |
| `qa coverage`                                       | YAML senaryo kapsam envanterini yazdırır (makine çıktısı için `--json`).                                                                                                                                                                                               |
| `qa parity-report`                                  | İki `qa-suite-summary.json` dosyasını karşılaştırıp agentic eşlik raporunu yazar veya tek bir çalışma zamanı çifti özetinden Codex ve OpenClaw çalışma zamanı eşliği ile token verimliliği raporları yazmak için `--runtime-axis --token-efficiency` kullanır.       |
| `qa character-eval`                                 | Karakter QA senaryosunu birden fazla canlı modelde değerlendirilen bir raporla çalıştırır. Bkz. [Raporlama](#reporting).                                                                                                                                              |
| `qa manual`                                         | Seçili sağlayıcı/model hattına karşı tek seferlik bir istem çalıştırır.                                                                                                                                                                                                |
| `qa ui`                                             | QA hata ayıklayıcı UI'sini ve yerel QA veri yolunu başlatır (takma ad: `pnpm qa:lab:ui`).                                                                                                                                                                              |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını derler.                                                                                                                                                                                                                         |
| `qa docker-scaffold`                                | QA panosu + gateway hattı için docker-compose iskeleti yazar.                                                                                                                                                                                                          |
| `qa up`                                             | QA sitesini derler, Docker destekli yığını başlatır, URL'yi yazdırır (takma ad: `pnpm qa:lab:up`; `:fast` varyantı `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler).                                                                                    |
| `qa aimock`                                         | Yalnızca AIMock sağlayıcı sunucusunu başlatır.                                                                                                                                                                                                                        |
| `qa mock-openai`                                    | Yalnızca senaryo farkındalığına sahip `mock-openai` sağlayıcı sunucusunu başlatır.                                                                                                                                                                                     |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetir.                                                                                                                                                                                                                    |
| `qa matrix`                                         | Tek kullanımlık Tuwunel homeserver'a karşı canlı taşıma hattı. Bkz. [Matrix QA](/tr/concepts/qa-matrix).                                                                                                                                                                  |
| `qa telegram`                                       | Gerçek bir özel Telegram grubuna karşı canlı taşıma hattı.                                                                                                                                                                                                             |
| `qa discord`                                        | Gerçek bir özel Discord guild kanalına karşı canlı taşıma hattı.                                                                                                                                                                                                       |
| `qa slack`                                          | Gerçek bir özel Slack kanalına karşı canlı taşıma hattı.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Gerçek WhatsApp Web hesaplarına karşı canlı taşıma hattı.                                                                                                                                                                                                              |
| `qa mantis`                                         | Discord durum tepkileri kanıtı, Crabbox masaüstü/tarayıcı smoke ve VNC içinde Slack smoke ile canlı taşıma hataları için önce ve sonra doğrulama çalıştırıcısı. Bkz. [Mantis](/tr/concepts/mantis) ve [Mantis Slack Masaüstü Çalıştırma Kılavuzu](/tr/concepts/mantis-slack-desktop-runbook). |

Profil destekli `qa run`, üyeliği `taxonomy.yaml` dosyasından okur, ardından
çözümlenen senaryoları `qa suite` üzerinden gönderir. `--surface` ve
`--category`, ayrı hatlar tanımlamak yerine seçili profili filtreler.
Ortaya çıkan `qa-evidence.json`, seçili kategori sayıları ve eksik kapsam
kimlikleriyle bir profil puan kartı özeti içerir; tekil kanıt girdileri
testler, kapsam rolleri ve sonuçlar için doğruluk kaynağı olarak kalır.
Taksonomi özellik kapsam kimlikleri, takma adlar değil kesin kanıt hedefleridir. Birincil
senaryo kapsamı eşleşen kimlikleri karşılar; ikincil kapsam danışma niteliğinde kalır.
Kapsam kimlikleri, küçük harfli alfasayısal/tire segmentleriyle noktalı
`namespace.behavior` biçimini kullanır; profil, yüzey ve kategori kimlikleri
mevcut tireli veya noktalı taksonomi kimliklerini kullanmaya devam edebilir.
İnce kanıt, girdi başına `execution` alanını atlar ve `evidenceMode: "slim"` ayarlar;
`smoke-ci` varsayılan olarak incedir ve `--evidence-mode full` tam girdileri geri yükler:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Mock model sağlayıcıları ve Crabline yerel sağlayıcı sunucularıyla deterministik profil kanıtı için
`smoke-ci` kullanın. Canlı kanallara karşı Stable/LTS kanıtı için `release` kullanın.
`all` yalnızca açıkça istenen tam taksonomi kanıt çalıştırmaları için kullanın; her etkin
olgunluk kategorisini seçer ve `QA Profile Evidence` iş akışı üzerinden
`qa_profile=all` ile gönderilebilir. Bir komutun aynı zamanda OpenClaw
kök profiline ihtiyacı olduğunda, kök profili QA komutundan önce koyun:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operatör akışı

Geçerli QA operatör akışı iki bölmeli bir QA sitesidir:

- Sol: aracıyla birlikte Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve bir operatörün
veya otomasyon döngüsünün aracıya QA görevi verebildiği, gerçek kanal davranışını
gözlemleyebildiği ve neyin çalıştığını, başarısız olduğunu veya engelli kaldığını
kaydedebildiği QA Lab sayfasını kullanıma açar.

Her seferinde Docker imajını yeniden derlemeden daha hızlı QA Lab UI yinelemesi için
yığını bind-mount edilmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker hizmetlerini önceden derlenmiş bir imajda tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` konteynerine bind-mount eder.
`qa:lab:watch`, değişiklik olduğunda bu paketi yeniden derler ve QA Lab
varlık hash'i değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

Yerel OpenTelemetry sinyal smoke için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu betik yerel bir OTLP/HTTP alıcısı başlatır, `diagnostics-otel` Plugin'i etkin halde
`otel-trace-smoke` QA senaryosunu çalıştırır, ardından izlerin,
metriklerin ve günlüklerin dışa aktarıldığını doğrular. Dışa aktarılan protobuf iz span'larını
çözer ve sürüm açısından kritik biçimi denetler:
`openclaw.run`, `openclaw.harness.run`, en son GenAI anlamsal kuralına sahip
model çağrısı span'ı, `openclaw.context.assembled` ve `openclaw.message.delivery`
mevcut olmalıdır. Smoke,
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` değerini zorlar; bu nedenle model çağrısı
span'ı `{gen_ai.operation.name} {gen_ai.request.model}` adını kullanmalıdır;
model çağrıları başarılı turlarda `StreamAbandoned` dışa aktarmamalıdır; ham tanılama kimlikleri ve
`openclaw.content.*` öznitelikleri izin dışında kalmalıdır. Ham OTLP
yükleri istem sentinel'ini, yanıt sentinel'ini veya QA oturumu
anahtarını içermemelidir. QA suite yapıtlarının yanına `otel-smoke-summary.json` yazar.

Collector destekli OpenTelemetry smoke için şunu çalıştırın:

```bash
pnpm qa:otel:collector-smoke
```

Bu hat, aynı yerel alıcının önüne gerçek bir OpenTelemetry Collector Docker konteyneri koyar.
Uç nokta kablolamasını, collector uyumluluğunu veya süreç içi alıcının maskeleyebileceği
OTLP dışa aktarma davranışını değiştirirken bunu kullanın.

Korumalı Prometheus scrape smoke için şunu çalıştırın:

```bash
pnpm qa:prometheus:smoke
```

Bu takma ad, `diagnostics-prometheus` etkinleştirilmiş
`docker-prometheus-smoke` QA senaryosunu çalıştırır, kimliği doğrulanmamış scrape
isteklerinin reddedildiğini doğrular, ardından kimliği doğrulanmış scrape çıktısının
istem içeriği, yanıt içeriği, ham tanılama tanımlayıcıları, auth token'ları veya
yerel yollar olmadan sürüm açısından kritik metrik ailelerini içerdiğini denetler.

Her iki gözlemlenebilirlik smoke testini arka arkaya çalıştırmak için şunu kullanın:

```bash
pnpm qa:observability:smoke
```

Toplayıcı destekli OpenTelemetry hattı ve korumalı Prometheus scrape smoke testi için
şunu kullanın:

```bash
pnpm qa:observability:collector-smoke
```

Gözlemlenebilirlik QA yalnızca kaynak checkout'unda kalır. npm tarball'ı bilerek
QA Lab'i içermez, bu yüzden paket Docker sürüm hatları `qa` komutlarını çalıştırmaz.
Tanılama enstrümantasyonunu değiştirirken derlenmiş bir kaynak checkout'undan
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` veya
`pnpm qa:observability:smoke` kullanın.

Model sağlayıcı kimlik bilgileri gerektirmeyen, gerçek aktarımlı bir Matrix smoke
hattı için deterministik mock OpenAI sağlayıcısıyla hızlı profili çalıştırın:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Canlı frontier sağlayıcı hattı için OpenAI uyumlu kimlik bilgilerini açıkça sağlayın:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Bu hattın tam CLI başvurusu, profil/senaryo kataloğu, env vars ve artifact yerleşimi [Matrix QA](/tr/concepts/qa-matrix) içinde yer alır. Kısaca: Docker'da tek kullanımlık bir Tuwunel homeserver hazırlar, geçici sürücü/SUT/gözlemci kullanıcıları kaydeder, gerçek Matrix Plugin'ini bu aktarıma kapsamlanmış bir alt QA Gateway içinde çalıştırır (`qa-channel` yok), ardından `.artifacts/qa-e2e/matrix-<timestamp>/` altında bir Markdown raporu, JSON özeti, gözlemlenen olaylar artifact'i ve birleştirilmiş çıktı günlüğü yazar.

Senaryolar, birim testlerinin uçtan uca kanıtlayamayacağı aktarım davranışlarını kapsar: mention gating, allow-bot politikaları, allowlist'ler, üst düzey ve thread'li yanıtlar, DM yönlendirme, reaction işleme, gelen düzenlemelerin bastırılması, yeniden başlatma replay dedupe, homeserver kesintisi kurtarma, onay metadata teslimi, medya işleme ve Matrix E2EE bootstrap/recovery/verification akışları. E2EE CLI profili ayrıca Gateway yanıtlarını denetlemeden önce aynı tek kullanımlık homeserver üzerinden `openclaw matrix encryption setup` ve doğrulama komutlarını çalıştırır.

Discord'da ayrıca hata yeniden üretimi için yalnızca Mantis'e özgü isteğe bağlı senaryolar vardır. Açık status reaction
zaman çizelgesi için `--scenario discord-status-reactions-tool-only` kullanın veya gerçek bir Discord thread'i oluşturup `message.thread-reply` öğesinin bir
`filePath` ekini koruduğunu doğrulamak için `--scenario discord-thread-reply-filepath-attachment` kullanın. Bu senaryolar varsayılan canlı Discord hattının dışında kalır çünkü geniş smoke kapsamı yerine önce/sonra repro problarıdır.
Thread eki Mantis iş akışı, QA ortamında `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` veya
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` yapılandırıldığında oturum açmış bir Discord Web
tanık videosu da ekleyebilir. Bu görüntüleyici profili yalnızca görsel yakalama içindir; başarılı/başarısız kararı hâlâ Discord REST oracle'dan gelir.

CI, `.github/workflows/qa-live-transports-convex.yml` içinde aynı komut yüzeyini kullanır.
Zamanlanmış ve varsayılan manuel çalıştırmalar, QA tarafından sağlanan live-frontier kimlik bilgileri, `--fast` ve
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` ile hızlı Matrix profilini yürütür. Manuel `matrix_profile=all`, beş profil shard'ına fan out yapar.

Gerçek aktarımlı Telegram, Discord, Slack ve WhatsApp smoke hatları için:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Bunlar iki bot veya hesap (sürücü + SUT) içeren önceden var olan gerçek bir kanalı hedefler. Gerekli env vars, senaryo listeleri, çıktı artifact'leri ve Convex kimlik bilgisi havuzu aşağıdaki [Telegram, Discord, Slack ve WhatsApp QA başvurusu](#telegram-discord-slack-and-whatsapp-qa-reference) içinde belgelenmiştir.

VNC kurtarmalı tam bir Slack masaüstü VM çalıştırması için şunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bu komut bir Crabbox masaüstü/tarayıcı makinesi kiralar, Slack canlı hattını VM içinde çalıştırır, VNC tarayıcısında Slack Web'i açar, masaüstünü yakalar ve video yakalama kullanılabilir olduğunda `slack-qa/`, `slack-desktop-smoke.png` ve `slack-desktop-smoke.mp4` dosyalarını Mantis artifact dizinine geri kopyalar. Crabbox masaüstü/tarayıcı kiraları yakalama araçlarını ve tarayıcı/native-build yardımcı paketlerini en baştan sağlar, bu yüzden senaryo yalnızca eski kiralarda fallback'leri kurmalıdır. Mantis toplam ve faz başına süreleri
`mantis-slack-desktop-smoke-report.md` içinde raporlar; böylece yavaş çalıştırmalarda zamanın kiralama ısınmasına, kimlik bilgisi edinimine, uzak kurulumuna veya artifact kopyasına gidip gitmediği görülür. VNC üzerinden Slack Web'e manuel giriş yaptıktan sonra
`--lease-id <cbx_...>` ile yeniden kullanın; yeniden kullanılan kiralar Crabbox'ın pnpm store cache'ini de sıcak tutar. Varsayılan
`--hydrate-mode source`, bir kaynak checkout'undan doğrulama yapar ve install/build işlemlerini VM içinde çalıştırır. `--hydrate-mode prehydrated` yalnızca yeniden kullanılan uzak workspace zaten `node_modules` ve derlenmiş bir `dist/` içeriyorsa kullanın; bu mod pahalı install/build adımını atlar ve workspace hazır değilse fail closed olur.
`--gateway-setup` ile Mantis, VM içinde `38973` portunda kalıcı bir OpenClaw Slack Gateway çalışır halde bırakır; onsuz komut normal bot-to-bot Slack QA hattını çalıştırır ve artifact yakalamadan sonra çıkar.

Masaüstü kanıtıyla native Slack onay UI'ını kanıtlamak için Mantis onay checkpoint modunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Bu mod `--gateway-setup` ile karşılıklı olarak dışlayıcıdır. Slack onay senaryolarını çalıştırır, onay dışı senaryo id'lerini reddeder, her bekleyen ve çözümlenmiş onay durumunda bekler, gözlemlenen Slack API mesajını
`approval-checkpoints/<scenario>-pending.png` ve
`approval-checkpoints/<scenario>-resolved.png` olarak render eder, ardından herhangi bir checkpoint, mesaj kanıtı, acknowledgement veya render edilmiş ekran görüntüsü eksik ya da boşsa başarısız olur.
Soğuk CI kiraları `slack-desktop-smoke.png` içinde hâlâ Slack oturum açma ekranını gösterebilir; onay checkpoint görüntüleri bu hattın görsel kanıtıdır.

Operatör checklist'i, GitHub workflow dispatch komutu, evidence-comment sözleşmesi, hydrate-mode karar tablosu, zamanlama yorumu ve hata işleme adımları [Mantis Slack Desktop Runbook](/tr/concepts/mantis-slack-desktop-runbook) içinde yer alır.

Agent/CV tarzı bir masaüstü görevi için şunu çalıştırın:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task`, bir Crabbox masaüstü/tarayıcı makinesi kiralar veya yeniden kullanır, `crabbox record --while` başlatır, görünür tarayıcıyı iç içe bir
`visual-driver` üzerinden sürer, `visual-task.png` yakalar, `--vision-mode image-describe` seçildiğinde ekran görüntüsüne karşı `openclaw infer image describe` çalıştırır ve
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` ve `mantis-visual-task-report.md` yazar.
`--expect-text` ayarlandığında, vision prompt yapılandırılmış bir JSON hükmü ister ve yalnızca model olumlu görünür kanıt bildirdiğinde geçer; hedef metni yalnızca alıntılayan olumsuz bir yanıt assertion'ı başarısız kılar.
Görüntü anlama sağlayıcısı çağırmadan masaüstü, tarayıcı, ekran görüntüsü ve video tesisatını kanıtlayan modelsiz smoke testi için `--vision-mode metadata` kullanın. Kayıt, `visual-task` için zorunlu bir artifact'tir; Crabbox boş olmayan bir `visual-task.mp4` kaydetmezse, görsel sürücü geçmiş olsa bile görev başarısız olur. Hata durumunda Mantis, görev zaten başarılı olmadıysa ve `--keep-lease` ayarlanmadıysa VNC için kirayı korur.

Havuzlanmış canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex broker env'i denetler, endpoint ayarlarını doğrular ve maintainer secret mevcut olduğunda admin/list erişilebilirliğini doğrular. Secret'lar için yalnızca ayarlı/eksik durumunu raporlar.

## Canlı aktarım kapsamı

Canlı aktarım hatları, her birinin kendi senaryo listesi şeklini icat etmesi yerine tek bir sözleşme paylaşır. `qa-channel`, geniş sentetik ürün davranışı paketidir ve canlı aktarım kapsam matrisinin parçası değildir.

Canlı aktarım runner'ları paylaşılan senaryo id'lerini, temel kapsam yardımcılarını ve senaryo seçimi yardımcısını
`openclaw/plugin-sdk/qa-live-transport-scenarios` içinden import etmelidir.

| Hat      | Canary | Mention gating | Bot-to-bot | Allowlist engeli | Üst düzey yanıt | Alıntı yanıtı | Restart resume | Thread follow-up | Thread izolasyonu | Reaction observation | Help komutu | Native komut kaydı |
| -------- | ------ | -------------- | ---------- | ---------------- | --------------- | ------------- | -------------- | ---------------- | ----------------- | -------------------- | ----------- | ------------------ |
| Matrix   | x      | x              | x          | x                | x               |               | x              | x                | x                 | x                    |             |                    |
| Telegram | x      | x              | x          |                  |                 |               |                |                  |                   |                      | x           |                    |
| Discord  | x      | x              | x          |                  |                 |               |                |                  |                   |                      |             | x                  |
| Slack    | x      | x              | x          | x                | x               |               | x              | x                | x                 |                      |             |                    |
| WhatsApp | x      | x              |            | x                | x               | x             | x              |                  |                   | x                    | x           |                    |

Bu, `qa-channel` öğesini geniş ürün davranışı paketi olarak tutarken Matrix,
Telegram ve diğer canlı aktarımların tek bir açık aktarım sözleşmesi checklist'i paylaşmasını sağlar.

QA yoluna Docker getirmeden tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass guest başlatır, bağımlılıkları kurar, OpenClaw'ı guest içinde derler, `qa suite` çalıştırır, ardından normal QA raporunu ve özetini host üzerindeki `.artifacts/qa-e2e/...` içine geri kopyalar.
Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır.
Host ve Multipass suite çalıştırmaları, varsayılan olarak izole Gateway worker'larıyla birden çok seçili senaryoyu paralel yürütür. `qa-channel` varsayılan olarak concurrency 4 kullanır ve seçilen senaryo sayısıyla sınırlanır. Worker sayısını ayarlamak için `--concurrency <count>` veya seri yürütme için `--concurrency 1` kullanın.
Kişisel asistan benchmark pack'ini çalıştırmak için `--pack personal-agent` kullanın. Pack seçici, yinelenen `--scenario` bayraklarıyla toplamsaldır: açık senaryolar önce çalışır, ardından pack senaryoları yinelenenler kaldırılmış şekilde pack sırasına göre çalışır.
Özel bir QA runner zaten OpenTelemetry collector kurulumunu sağlıyorsa ve OpenTelemetry ile Prometheus tanılama smoke senaryolarını birlikte seçmek istiyorsa `--pack observability` kullanın.
Komut, herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact istiyorsanız `--allow-failures` kullanın.
Canlı çalıştırmalar guest için pratik olan desteklenen QA auth girdilerini iletir: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı config yolu ve mevcut olduğunda
`CODEX_HOME`. Guest'in bağlanmış workspace üzerinden geri yazabilmesi için `--output-dir` değerini repo kökü altında tutun.

## Telegram, Discord, Slack ve WhatsApp QA başvurusu

Matrix, senaryo sayısı ve Docker destekli homeserver sağlaması nedeniyle [ayrı bir sayfaya](/tr/concepts/qa-matrix) sahiptir. Telegram, Discord, Slack ve WhatsApp önceden var olan gerçek taşımalara karşı çalışır, bu yüzden başvuruları burada yer alır.

### Paylaşılan CLI bayrakları

Bu hatlar `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` üzerinden kaydolur ve aynı bayrakları kabul eder:

| Bayrak                                | Varsayılan                                        | Açıklama                                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | -                                                 | Yalnızca bu senaryoyu çalıştır. Tekrarlanabilir.                                                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Raporların, özetlerin, kanıtların, taşımaya özgü yapıtların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` temel alınarak çözümlenir.              |
| `--repo-root <path>`                  | `process.cwd()`                                   | Tarafsız bir cwd'den çağırırken depo kökü.                                                                                                                         |
| `--sut-account <id>`                  | `sut`                                             | QA gateway yapılandırması içindeki geçici hesap kimliği.                                                                                                           |
| `--provider-mode <mode>`              | `live-frontier`                                   | `mock-openai` veya `live-frontier` (eski `live-openai` hâlâ çalışır).                                                                                              |
| `--model <ref>` / `--alt-model <ref>` | sağlayıcı varsayılanı                             | Birincil/alternatif model ref'leri.                                                                                                                                |
| `--fast`                              | kapalı                                            | Desteklendiği yerlerde sağlayıcı hızlı modu.                                                                                                                       |
| `--credential-source <env\|convex>`   | `env`                                             | Bkz. [Convex kimlik bilgisi havuzu](#convex-credential-pool).                                                                                                      |
| `--credential-role <maintainer\|ci>`  | CI'da `ci`, aksi halde `maintainer`               | `--credential-source convex` olduğunda kullanılan rol.                                                                                                             |

Her hat, başarısız olan herhangi bir senaryoda sıfır olmayan kodla çıkar. `--allow-failures`, başarısız çıkış kodu ayarlamadan yapıtları yazar.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

İki farklı botu (sürücü + SUT) olan gerçek bir özel Telegram grubunu hedefler. SUT botunun bir Telegram kullanıcı adı olmalıdır; botlar arası gözlem, her iki botta da `@BotFather` içinde **Bot-to-Bot Communication Mode** etkin olduğunda en iyi çalışır.

`--credential-source env` olduğunda gerekli env:

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

Örtük varsayılan küme her zaman canary, bahsetme kapısı, yerel komut yanıtları, komut adresleme ve botlar arası grup yanıtlarını kapsar. `mock-openai` varsayılanları ayrıca deterministik yanıt zinciri ve son mesaj akış kontrollerini içerir. `telegram-current-session-status-tool`, rastgele yerel komut yanıtlarından sonra değil, yalnızca doğrudan canary sonrasında iş parçacığına bağlandığında kararlı olduğu için isteğe bağlı kalır. Gerileme ref'leriyle birlikte mevcut varsayılan/isteğe bağlı ayrımını yazdırmak için `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` kullanın.

Çıktı yapıtları:

- `telegram-qa-report.md`
- `qa-evidence.json` - canlı taşıma kontrolleri için profil, kapsama, sağlayıcı, kanal, yapıtlar, sonuç ve RTT alanlarını içeren kanıt girdileri.

Paket Telegram çalıştırmaları aynı Telegram kimlik bilgisi sözleşmesini kullanır. Tekrarlanan RTT
ölçümü normal paket Telegram canlı hattının bir parçasıdır; RTT
dağılımı, seçili RTT kontrolü için `result.timing` altında `qa-evidence.json` içine katlanır.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlandığında, paket canlı sarmalayıcısı
bir `kind: "telegram"` kimlik bilgisini kiralar, kiralanan grup/sürücü/SUT bot
env değerlerini kurulu paket çalıştırmasına dışa aktarır, kiralamaya heartbeat gönderir ve
kapanışta serbest bırakır. Paket sarmalayıcısı varsayılan olarak
`telegram-mentioned-message-reply` için 20 RTT kontrolü, 30 sn RTT zaman aşımı ve Convex seçildiğinde CI dışında
Convex rolü `maintainer` kullanır. Ayrı bir RTT komutu veya Telegram'a özgü özet biçimi
oluşturmadan RTT ölçümünü ayarlamak için
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
veya `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` değerlerini geçersiz kılın.

### Discord QA

```bash
pnpm openclaw qa discord
```

İki botu olan gerçek bir özel Discord sunucu kanalını hedefler: harness tarafından kontrol edilen bir sürücü botu ve alt OpenClaw gateway tarafından paketlenmiş Discord plugin'i aracılığıyla başlatılan bir SUT botu. Kanal bahsetme işlemesini, SUT botunun yerel `/help` komutunu Discord'a kaydettiğini ve isteğe bağlı Mantis kanıt senaryolarını doğrular.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord tarafından döndürülen SUT bot kullanıcı kimliğiyle eşleşmelidir (aksi halde hat hızlı başarısız olur).

İsteğe bağlı:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`, gözlemlenen mesaj yapıtlarında mesaj gövdelerini tutar.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID`, `discord-voice-autojoin` için ses/sahne kanalını seçer; onsuz, senaryo SUT botu için ilk görünür ses/sahne kanalını seçer.

Senaryolar (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - isteğe bağlı ses senaryosu. Tek başına çalışır, `channels.discord.voice.autoJoin` değerini etkinleştirir ve SUT botunun mevcut Discord ses durumunun hedef ses/sahne kanalı olduğunu doğrular. Convex Discord kimlik bilgileri isteğe bağlı `voiceChannelId` içerebilir; aksi halde çalıştırıcı sunucudaki ilk görünür ses/sahne kanalını keşfeder.
- `discord-status-reactions-tool-only` - isteğe bağlı Mantis senaryosu. SUT'yi `messages.statusReactions.enabled=true` ile her zaman açık, yalnızca araçlı sunucu yanıtlarına geçirdiği için tek başına çalışır, ardından REST tepki zaman çizelgesi ile HTML/PNG görsel yapıtlarını yakalar. Mantis öncesi/sonrası raporları ayrıca senaryo tarafından sağlanan MP4 yapıtlarını `baseline.mp4` ve `candidate.mp4` olarak korur.

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
- `qa-evidence.json` - canlı taşıma kontrolleri için kanıt girdileri.
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.
- Durum tepkisi senaryosu çalıştığında `discord-qa-reaction-timelines.json` ve `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

İki farklı botu olan gerçek bir özel Slack kanalını hedefler: harness tarafından kontrol edilen bir sürücü botu ve alt OpenClaw gateway tarafından paketlenmiş Slack plugin'i aracılığıyla başlatılan bir SUT botu.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`, gözlemlenen mesaj yapıtlarında mesaj gövdelerini tutar.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`, Mantis için görsel onay
  denetim noktalarını etkinleştirir. Çalıştırıcı `<scenario>.pending.json` ve
  `<scenario>.resolved.json` yazar, ardından eşleşen `.ack.json` dosyalarını bekler.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS`, denetim noktası
  onay zaman aşımını geçersiz kılar. Varsayılan `120000` değeridir.

Senaryolar (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - isteğe bağlı yerel Slack exec onay senaryosu.
  Gateway üzerinden bir exec onayı ister, Slack mesajında yerel onay düğmeleri olduğunu
  doğrular, bunu çözer ve çözülmüş Slack güncellemesini doğrular.
- `slack-approval-plugin-native` - isteğe bağlı yerel Slack plugin onay senaryosu.
  Plugin olaylarının exec onay yönlendirmesi tarafından bastırılmaması için exec ve
  plugin onay iletmeyi birlikte etkinleştirir, ardından aynı bekleyen/çözülmüş
  yerel Slack UI yolunu doğrular.

Çıktı yapıtları:

- `slack-qa-report.md`
- `qa-evidence.json` - canlı taşıma kontrolleri için kanıt girdileri.
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.
- `approval-checkpoints/` - yalnızca Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` ayarladığında; denetim noktası JSON'u,
  onay JSON'u ve bekleyen/çözülmüş ekran görüntülerini içerir.

#### Slack çalışma alanını ayarlama

Hat, tek bir çalışma alanında iki farklı Slack uygulamasına ve iki botun da üye olduğu bir kanala ihtiyaç duyar:

- `channelId` - iki botun da davet edildiği bir kanalın `Cxxxxxxxxxx` kimliği. Ayrılmış bir kanal kullanın; hat her çalıştırmada gönderi yapar.
- `driverBotToken` - **Driver** uygulamasının bot token'ı (`xoxb-...`).
- `sutBotToken` - sürücüden ayrı bir Slack uygulaması olması gereken **SUT** uygulamasının bot token'ı (`xoxb-...`), böylece bot kullanıcı kimliği farklı olur.
- `sutAppToken` - Socket Mode tarafından SUT uygulamasının olayları alabilmesi için kullanılan, `connections:write` içeren SUT uygulamasının uygulama düzeyi token'ı (`xapp-...`).

Bir üretim çalışma alanını yeniden kullanmak yerine QA'ya ayrılmış bir Slack çalışma alanını tercih edin.

Aşağıdaki SUT manifest'i, paketlenmiş Slack plugin'inin üretim kurulumunu (`extensions/slack/src/setup-shared.ts:10`) canlı Slack QA paketi tarafından kapsanan izinler ve olaylarla bilerek daraltır. Kullanıcıların gördüğü üretim kanalı kurulumu için bkz. [Slack kanalı hızlı kurulumu](/tr/channels/slack#quick-setup); QA Driver/SUT çifti bilerek ayrıdır çünkü hattın tek bir çalışma alanında iki farklı bot kullanıcı kimliğine ihtiyacı vardır.

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

_Bot User OAuth Token_ değerini (`xoxb-...`) kopyalayın; bu `driverBotToken` olur. Sürücünün yalnızca ileti göndermesi ve kendini tanıtması gerekir; olay gerekmez, Socket Mode gerekmez.

**2. SUT uygulamasını oluşturun**

Aynı çalışma alanında _Create New App → From a manifest_ işlemini tekrarlayın. Bu QA uygulaması, paketli Slack Plugin'inin üretim manifestinin (`extensions/slack/src/setup-shared.ts:10`) bilerek daha dar bir sürümünü kullanır: canlı Slack QA paketi henüz tepki işlemeyi kapsamadığı için tepki kapsamları ve olayları çıkarılmıştır.

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

Her belirteçte `auth.test` çağırarak iki botun farklı kullanıcı kimliklerine sahip olduğunu doğrulayın. Çalışma zamanı sürücüyü ve SUT'yi kullanıcı kimliğine göre ayırır; ikisi için aynı uygulamayı yeniden kullanmak, bahsetme kapısını hemen başarısız kılar.

**3. Kanalı oluşturun**

QA çalışma alanında bir kanal oluşturun (ör. `#openclaw-qa`) ve kanalın içinden iki botu da davet edin:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_Channel info → About → Channel ID_ bölümünden `Cxxxxxxxxxx` kimliğini kopyalayın; bu `channelId` olur. Herkese açık bir kanal kullanılabilir; özel kanal kullanırsanız iki uygulamada da zaten `groups:history` bulunduğundan harness'ın geçmiş okumaları yine başarılı olur.

**4. Kimlik bilgilerini kaydedin**

İki seçenek vardır. Tek makineli hata ayıklama için env değişkenlerini kullanın (dört `OPENCLAW_QA_SLACK_*` değişkenini ayarlayın ve `--credential-source env` geçin) veya CI ve diğer bakımcıların kiralayabilmesi için paylaşılan Convex havuzunu tohumlayın.

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

İki botun broker üzerinden birbiriyle konuşabildiğini doğrulamak için lane'i yerelde çalıştırın:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Yeşil bir çalışma 30 saniyenin oldukça altında tamamlanır ve `slack-qa-report.md`, hem `slack-canary` hem de `slack-mention-gating` için durumu `pass` olarak gösterir. Lane yaklaşık 90 saniye takılır ve `Convex credential pool exhausted for kind "slack"` ile çıkarsa havuz ya boştur ya da her satır kiralanmıştır; `qa credentials list --kind slack --status all --json` hangisi olduğunu söyler.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

İki ayrılmış WhatsApp Web hesabını hedefler: harness tarafından kontrol edilen
bir sürücü hesabı ve alt OpenClaw gateway tarafından paketli WhatsApp Plugin'i
üzerinden başlatılan bir SUT hesabı.

`--credential-source env` kullanıldığında gerekli env:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

İsteğe bağlı:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID`, `whatsapp-mention-gating` ve
  `whatsapp-group-allowlist-block` gibi grup senaryolarını etkinleştirir.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`, ileti gövdelerini
  observed-message artefaktlarında tutar.

Senaryo kataloğu (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Temel ve grup kapısı: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Yerel komutlar: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Yanıt ve son çıktı davranışı: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Gelen medya ve yapılandırılmış iletiler: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Bunlar, sürücü üzerinden gerçek WhatsApp
  görüntü, ses, belge, konum, kişi ve çıkartma olayları gönderir.
- Giden Gateway ve ileti eylemi kapsamı:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Erişim denetimi kapsamı: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Yerel onaylar: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Durum tepkileri: `whatsapp-status-reactions`.

Katalog şu anda 36 senaryo içerir. `live-frontier` varsayılan lane'i, hızlı smoke
kapsamı için 10 senaryoda küçük tutulur. `mock-openai` varsayılan lane'i,
yalnızca model çıktısını taklit ederken gerçek WhatsApp taşıması üzerinden
31 belirlenimci senaryo çalıştırır. Onay senaryoları ve birkaç daha ağır/engelleyici
kontrol, senaryo kimliğiyle açık kalır.

WhatsApp QA sürücüsü yapılandırılmış canlı olayları (`text`, `media`,
`location`, `reaction` ve `poll`) gözlemler ve medya, anket,
kişiler, konumlar ve çıkartmaları aktif olarak gönderebilir. QA Lab bu sürücüyü
özel WhatsApp çalışma zamanı dosyalarına erişmek yerine
`@openclaw/whatsapp/api.js` paket yüzeyi üzerinden içe aktarır. İleti içeriği
varsayılan olarak redakte edilir. Giden anket ve upload-file kapsamı,
yalnızca model istemli araç çağırma yerine belirlenimci gateway `poll` ve
`message.action` çağrıları üzerinden çalışır.

Çıktı artefaktları:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - canlı taşıma kontrolleri için kanıt girdileri.
- `whatsapp-qa-observed-messages.json` - `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.

### Convex kimlik bilgisi havuzu

Telegram, Discord, Slack ve WhatsApp lane'leri, yukarıdaki env değişkenlerini okumak yerine paylaşılan bir Convex havuzundan kimlik bilgileri kiralayabilir. `--credential-source convex` geçin (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın); QA Lab özel bir kiralama alır, çalışma süresi boyunca Heartbeat gönderir ve kapanışta serbest bırakır. Havuz türleri `"telegram"`, `"discord"`, `"slack"` ve `"whatsapp"` değerleridir.

Broker'ın `admin/add` üzerinde doğruladığı payload şekilleri:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` sayısal bir sohbet kimliği dizesi olmalıdır.
- Telegram gerçek kullanıcı (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - yalnızca Mantis Telegram Desktop kanıtı. Genel QA Lab lane'leri bu türü almamalıdır.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - telefon numaraları farklı E.164 dizeleri olmalıdır.

Mantis Telegram Desktop kanıt iş akışı, hem TDLib CLI sürücüsü hem de Telegram Desktop
tanığı için tek bir özel Convex `telegram-user` kiralaması tutar, ardından kanıtı
yayımladıktan sonra serbest bırakır.

Bir PR belirlenimci bir görsel fark gerektirdiğinde Mantis, Telegram biçimlendiricisi
veya teslim katmanı değişirken `main` üzerinde ve PR başında aynı taklit model
yanıtını kullanabilir. Yakalama varsayılanları PR yorumları için ayarlanmıştır:
standart Crabbox sınıfı, 24fps masaüstü kaydı, 24fps hareketli GIF ve 1920px
önizleme genişliği. Önce/sonra yorumları yalnızca amaçlanan GIF'leri içeren
temiz bir paket yayımlamalıdır.

Slack lane'leri de havuzu kullanabilir. Slack payload şekli kontrolleri şu anda broker yerine Slack QA çalıştırıcısında bulunur; Slack kanal kimliği `Cxxxxxxxxxx` gibi olacak şekilde `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` kullanın. Uygulama ve kapsam sağlama için [Slack çalışma alanını ayarlama](#setting-up-the-slack-workspace) bölümüne bakın.

Operasyonel env değişkenleri ve Convex broker uç noktası sözleşmesi [Testing → Shared Telegram credentials via Convex](/tr/help/testing#shared-telegram-credentials-via-convex-v1) bölümünde bulunur (bölüm adı çok kanallı havuzdan öncedir; kiralama semantiği türler arasında ortaktır).

## Depo destekli tohumlar

Tohum varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Bunlar, QA planının hem insanlar hem de agent tarafından görülebilmesi için
bilerek git içindedir.

`qa-lab` genel bir YAML senaryo çalıştırıcısı olarak kalmalıdır. Her senaryo YAML dosyası
tek bir test çalışması için doğruluk kaynağıdır ve şunları tanımlamalıdır:

- üst düzey `title`
- `scenario` meta verileri
- `scenario` içinde isteğe bağlı kategori, yetenek, lane ve risk meta verileri
- `scenario` içinde docs ve kod referansları
- `scenario` içinde isteğe bağlı Plugin gereksinimleri
- `scenario` içinde isteğe bağlı gateway yapılandırma yaması
- akış senaryoları için çalıştırılabilir üst düzey `flow` veya Vitest ve Playwright senaryoları için `scenario.execution.kind` /
  `scenario.execution.path`

Yeniden kullanılabilir çalışma zamanı yüzeyi, `flow` arkasında genel
ve kesişen kapsamda kalabilir. Örneğin YAML senaryoları, özel durum koşucusu
eklemeden gömülü Control UI'ı Gateway `browser.request` dikişi üzerinden süren
tarayıcı tarafı yardımcılarla taşıma tarafı yardımcıları birleştirebilir.

Senaryo dosyaları kaynak ağacı klasörü yerine ürün yeteneğine göre gruplanmalıdır.
Dosyalar taşındığında senaryo kimliklerini kararlı tutun; uygulama izlenebilirliği
için `docsRefs` ve `codeRefs` kullanın.

Temel liste şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- iş parçacığı davranışı
- mesaj eylemi yaşam döngüsü
- cron geri çağrıları
- bellek hatırlama
- model değiştirme
- alt aracı devri
- repo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı mock hatları

`qa suite` iki yerel sağlayıcı mock hattına sahiptir:

- `mock-openai`, senaryo farkındalıklı OpenClaw mock'udur. Repo destekli QA ve eşlik kapıları için varsayılan deterministik mock hattı olarak kalır.
- `aimock`, deneysel protokol, fixture, kayıt/yeniden oynatma ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Eklemelidir ve `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında yer alır.
Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlatmasına, Gateway model yapılandırmasına,
kimlik doğrulama profili hazırlama gereksinimlerine ve canlı/mock yetenek bayraklarına sahiptir. Paylaşılan suite ve
gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirmelidir.

## Taşıma adaptörleri

`qa-lab`, YAML QA senaryoları için genel bir taşıma dikişine sahiptir. `qa-channel`
sentetik varsayılandır. `crabline`, yerel sağlayıcı biçimli sunucular başlatır ve
OpenClaw'ın normal kanal plugin'lerini bunlara karşı çalıştırır. `live`, gerçek
sağlayıcı kimlik bilgileri ve harici kanallar için ayrılmıştır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab` genel senaryo yürütme, çalışan eşzamanlılığı, artifact yazma ve raporlamaya sahiptir.
- Taşıma adaptörü gateway yapılandırmasına, hazır olma durumuna, gelen ve giden gözleme, taşıma eylemlerine ve normalize edilmiş taşıma durumuna sahiptir.
- `qa/scenarios/` altındaki YAML senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

### Kanal ekleme

YAML QA sistemine kanal eklemek, kanal uygulamasını ve kanal sözleşmesini
çalıştıran bir senaryo paketini gerektirir. Smoke CI kapsamı için eşleşen Crabline
yerel sağlayıcı sunucusunu ekleyin ve bunu `crabline` sürücüsü üzerinden sunun.

Paylaşılan `qa-lab` ana makinesi akışa sahip olabiliyorsa yeni üst düzey QA komut kökü eklemeyin.

`qa-lab` paylaşılan ana makine mekaniklerine sahiptir:

- `openclaw qa` komut kökü
- suite başlatma ve kapatma
- çalışan eşzamanlılığı
- artifact yazma
- rapor üretimi
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Koşucu plugin'leri taşıma sözleşmesine sahiptir:

- `openclaw qa <runner>` paylaşılan `qa` kökü altına nasıl bağlanır
- gateway bu taşıma için nasıl yapılandırılır
- hazır olma durumu nasıl denetlenir
- gelen olaylar nasıl enjekte edilir
- giden mesajlar nasıl gözlemlenir
- transcript'ler ve normalize edilmiş taşıma durumu nasıl sunulur
- taşıma destekli eylemler nasıl yürütülür
- taşımaya özgü sıfırlama veya temizlik nasıl ele alınır

Yeni bir kanal için asgari benimseme çıtası:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`ı tutun.
2. Taşıma koşucusunu paylaşılan `qa-lab` ana makine dikişinde uygulayın.
3. Taşımaya özgü mekanikleri koşucu plugin'i veya kanal harness'i içinde tutun.
4. Koşucuyu rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın. Koşucu plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır. `runtime-api.ts` hafif kalmalı; tembel CLI ve koşucu yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında YAML senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Repo bilinçli bir migration yapmıyorsa mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış bir kez `qa-lab` içinde ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu o koşucu plugin'inde veya plugin harness'inde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yetenek gerektiriyorsa, `suite.ts` içinde kanala özgü dal yerine genel bir yardımcı ekleyin.
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

Uyumluluk takma adları mevcut senaryolar için kullanılabilir kalır - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ancak yeni senaryo yazımı genel adları kullanmalıdır. Takma adlar bir bayrak günü migration'ından kaçınmak için vardır; ileriye dönük model olarak değil.

## Raporlama

`qa-lab`, gözlemlenen bus zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şunları yanıtlamalıdır:

- Ne çalıştı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryoları eklemeye değer

Kullanılabilir senaryoların envanteri için - takip işini boyutlandırırken veya yeni bir taşıma bağlarken kullanışlıdır - `pnpm openclaw qa coverage` çalıştırın (makine tarafından okunabilir çıktı için `--json` ekleyin).
Dokunulan bir davranış veya dosya yolu için odaklı kanıt seçerken `pnpm openclaw qa coverage --match <query>` çalıştırın.
Eşleşme raporu senaryo metadata'sını, doküman referanslarını, kod referanslarını, kapsam kimliklerini, plugin'leri ve sağlayıcı gereksinimlerini arar, ardından eşleşen `qa suite --scenario ...` hedeflerini yazdırır.
Her `qa suite` çalıştırması, seçilen
senaryo kümesi için üst düzey `qa-evidence.json`,
`qa-suite-summary.json` ve `qa-suite-report.md` artifact'leri yazar. `execution.kind: vitest` veya
`execution.kind: playwright` bildiren senaryolar eşleşen test yolunu çalıştırır ve ayrıca
senaryo başına günlükler yazar. `execution.kind: script` bildiren senaryolar,
`execution.path` içindeki kanıt üreticisini `node --import tsx` üzerinden çalıştırır (`execution.args` içinde
`${outputDir}` ve `${scenarioId}` genişletilmiş olarak); üretici kendi `qa-evidence.json` dosyasını
yazar, girdileri suite çıktısına içe aktarılır ve artifact yolları o üretici
`qa-evidence.json` dosyasına göre çözümlenir. `qa suite`,
`qa run --qa-profile` üzerinden ulaşıldığında aynı `qa-evidence.json`, seçilen taksonomi kategorileri için profil
scorecard özetini de içerir.
Bunu kapı değişimi değil, keşif yardımı olarak ele alın; seçilen senaryo, test edilen davranış için yine doğru sağlayıcı moduna, canlı taşımaya, Multipass, Testbox veya release hattına ihtiyaç duyar.
Scorecard bağlamı için bkz. [Maturity scorecard](/tr/maturity/scorecard).

Karakter ve stil kontrolleri için aynı senaryoyu birden çok canlı model
ref'i üzerinde çalıştırın ve yargılanmış bir Markdown raporu yazın:

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

Komut Docker değil, yerel QA gateway alt süreçlerini çalıştırır. Karakter eval
senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı
ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam
transcript'i korur, temel çalışma istatistiklerini kaydeder, ardından desteklendiği yerlerde
`xhigh` reasoning ile hızlı modda yargıç modellere doğallık, vibe ve mizaha göre çalıştırmaları sıralamalarını sorar.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: yargıç prompt'u yine
her transcript'i ve çalışma durumunu alır, ancak aday ref'leri
`candidate-01` gibi nötr etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek ref'lerle eşler.
Aday çalıştırmalar varsayılan olarak `high` thinking kullanır; GPT-5.5 için `medium`, destekleyen eski OpenAI eval ref'leri için `xhigh`
kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` hâlâ
genel bir yedek ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için tutulur.
OpenAI aday ref'leri, sağlayıcı desteklediğinde öncelikli işlemenin kullanılması için varsayılan olarak hızlı moda geçer.
Tek bir aday veya yargıç için geçersiz kılma gerekiyorsa satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin. Yalnızca
her aday model için hızlı modu zorlamak istediğinizde `--fast` geçin. Aday ve yargıç süreleri
benchmark analizi için rapora kaydedilir, ancak yargıç prompt'ları açıkça
hıza göre sıralama yapmamayı söyler.
Aday ve yargıç model çalıştırmalarının ikisi de varsayılan olarak eşzamanlılık 16 kullanır. Sağlayıcı sınırları veya yerel gateway
baskısı bir çalıştırmayı fazla gürültülü yaptığında
`--concurrency` veya `--judge-concurrency` değerini düşürün.
Hiçbir aday `--model` geçirilmediğinde, karakter eval varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
Hiçbir `--judge-model` geçirilmediğinde, yargıçlar varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-8,thinking=high` olur.

## İlgili dokümanlar

- [Matrix QA](/tr/concepts/qa-matrix)
- [Maturity scorecard](/tr/maturity/scorecard)
- [Personal agent benchmark pack](/tr/concepts/personal-agent-benchmark-pack)
- [QA Channel](/tr/channels/qa-channel)
- [Testing](/tr/help/testing)
- [Dashboard](/tr/web/dashboard)

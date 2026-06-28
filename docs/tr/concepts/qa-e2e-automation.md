---
read_when:
    - QA yığınının nasıl bir araya geldiğini anlama
    - qa-lab, qa-channel veya bir taşıma bağdaştırıcısını genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçiliğe sahip QA otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, repo destekli senaryolar, canlı taşıma hatları, taşıma adaptörleri ve raporlama.'
title: QA genel bakışı
x-i18n:
    generated_at: "2026-06-28T00:30:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw’ı tek bir birim testin yapabileceğinden daha gerçekçi,
kanal biçimli bir yolla çalıştırmak için tasarlanmıştır.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veri yolu.
- `extensions/qa-matrix`, gelecekteki çalıştırıcı Plugin’leri: alt QA gateway içinde
  gerçek bir kanalı süren canlı aktarım bağdaştırıcıları.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için depo destekli başlangıç varlıkları.
- [Mantis](/tr/concepts/mantis): gerçek aktarımlar, tarayıcı ekran görüntüleri, VM durumu ve PR kanıtı gerektiren
  hatalar için canlı doğrulama öncesi ve sonrası.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Birçoğunun `pnpm qa:*`
betik takma adları vardır; her iki biçim de desteklenir.

| Komut                                               | Amaç                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` olmadan paketlenmiş QA öz denetimi; `--qa-profile smoke-ci`, `--qa-profile release` veya `--qa-profile all` ile taksonomi destekli olgunluk profili çalıştırıcısı.                                                                                      |
| `qa suite`                                          | Depo destekli senaryoları QA gateway hattına karşı çalıştırır. Takma adlar: tek kullanımlık bir Linux VM için `pnpm openclaw qa suite --runner multipass`.                                                                                                             |
| `qa coverage`                                       | YAML senaryo kapsamı envanterini yazdırır (makine çıktısı için `--json`).                                                                                                                                                                                              |
| `qa parity-report`                                  | İki `qa-suite-summary.json` dosyasını karşılaştırır ve aracı eşdeğerlik raporunu yazar ya da tek bir çalışma zamanı çifti özetinden Codex ile OpenClaw çalışma zamanı eşdeğerliği ve token verimliliği raporları yazmak için `--runtime-axis --token-efficiency` kullanır. |
| `qa character-eval`                                 | Karakter QA senaryosunu birden fazla canlı modelde, değerlendirilmiş bir raporla çalıştırır. Bkz. [Raporlama](#reporting).                                                                                                                                            |
| `qa manual`                                         | Seçilen sağlayıcı/model hattına karşı tek seferlik bir istem çalıştırır.                                                                                                                                                                                               |
| `qa ui`                                             | QA hata ayıklayıcı UI ve yerel QA veri yolunu başlatır (takma ad: `pnpm qa:lab:ui`).                                                                                                                                                                                   |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını oluşturur.                                                                                                                                                                                                                       |
| `qa docker-scaffold`                                | QA panosu + gateway hattı için bir docker-compose iskeleti yazar.                                                                                                                                                                                                      |
| `qa up`                                             | QA sitesini oluşturur, Docker destekli yığını başlatır, URL’yi yazdırır (takma ad: `pnpm qa:lab:up`; `:fast` varyantı `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler).                                                                                   |
| `qa aimock`                                         | Yalnızca AIMock sağlayıcı sunucusunu başlatır.                                                                                                                                                                                                                        |
| `qa mock-openai`                                    | Yalnızca senaryo farkındalığı olan `mock-openai` sağlayıcı sunucusunu başlatır.                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetir.                                                                                                                                                                                                                    |
| `qa matrix`                                         | Tek kullanımlık bir Tuwunel homeserver’a karşı canlı aktarım hattı. Bkz. [Matrix QA](/tr/concepts/qa-matrix).                                                                                                                                                            |
| `qa telegram`                                       | Gerçek bir özel Telegram grubuna karşı canlı aktarım hattı.                                                                                                                                                                                                            |
| `qa discord`                                        | Gerçek bir özel Discord sunucu kanalına karşı canlı aktarım hattı.                                                                                                                                                                                                     |
| `qa slack`                                          | Gerçek bir özel Slack kanalına karşı canlı aktarım hattı.                                                                                                                                                                                                              |
| `qa whatsapp`                                       | Gerçek WhatsApp Web hesaplarına karşı canlı aktarım hattı.                                                                                                                                                                                                             |
| `qa mantis`                                         | Discord durum tepkileri kanıtı, Crabbox masaüstü/tarayıcı duman testi ve VNC içi Slack duman testiyle canlı aktarım hataları için öncesi ve sonrası doğrulama çalıştırıcısı. Bkz. [Mantis](/tr/concepts/mantis) ve [Mantis Slack Masaüstü Runbook’u](/tr/concepts/mantis-slack-desktop-runbook). |

Profil destekli `qa run`, üyeliği `taxonomy.yaml` dosyasından okur, ardından
çözümlenen senaryoları `qa suite` üzerinden dağıtır. `--surface` ve
`--category`, ayrı hatlar tanımlamak yerine seçilen profili filtreler.
Ortaya çıkan `qa-evidence.json`, seçilen kategori sayıları ve eksik kapsam ID’leriyle
bir profil puan kartı özeti içerir; tekil kanıt
girdileri testler, kapsam rolleri ve sonuçlar için doğruluk kaynağı olarak kalır.
Taksonomi özellik kapsamı ID’leri takma ad değil, kesin kanıt hedefleridir. Birincil
senaryo kapsamı eşleşen ID’leri karşılar; ikincil kapsam bilgilendirici kalır.
Kapsam ID’leri, küçük harfli alfasayısal/tire segmentleriyle noktalı
`namespace.behavior` biçimini kullanır; profil, yüzey ve kategori ID’leri mevcut
tireli veya noktalı taksonomi ID’lerini kullanmaya devam edebilir.
İnce kanıt, girdi başına `execution` alanını atlar ve `evidenceMode: "slim"` ayarlar;
`smoke-ci` varsayılan olarak ince biçimi kullanır ve `--evidence-mode full` tam girdileri geri yükler:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Sahte model sağlayıcıları ve Crabline sahte sağlayıcı sunucularıyla deterministik profil kanıtı için
`smoke-ci` kullanın. Canlı kanallara karşı Kararlı/LTS kanıtı için `release` kullanın.
`all` değerini yalnızca açık tam taksonomi kanıt çalıştırmaları için kullanın; bu, her
etkin olgunluk kategorisini seçer ve `qa_profile=all` ile `QA Profile
Evidence` iş akışı üzerinden dağıtılabilir. Bir komutun ayrıca OpenClaw
kök profiline ihtiyacı olduğunda, kök profili QA komutundan önce koyun:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operatör akışı

Mevcut QA operatör akışı iki panelli bir QA sitesidir:

- Sol: aracıyla birlikte Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini oluşturur, Docker destekli gateway hattını başlatır ve bir operatörün ya da otomasyon döngüsünün aracıya bir QA
görevi verebileceği, gerçek kanal davranışını gözlemleyebileceği ve neyin çalıştığını, başarısız olduğunu veya
engelli kaldığını kaydedebileceği QA Lab sayfasını sunar.

Her seferinde Docker imajını yeniden oluşturmadan daha hızlı QA Lab UI yinelemesi için,
yığını bağlama ile monte edilmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker hizmetlerini önceden oluşturulmuş bir imajda tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` konteynerine bağlama ile monte eder. `qa:lab:watch`
değişiklikte bu paketi yeniden oluşturur ve QA Lab
varlık karması değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

Yerel OpenTelemetry sinyali duman testi için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu betik yerel bir OTLP/HTTP alıcısı başlatır, `diagnostics-otel` Plugin’i etkinleştirilmiş olarak
`otel-trace-smoke` QA senaryosunu çalıştırır, ardından izlerin,
metriklerin ve günlüklerin dışa aktarıldığını doğrular. Dışa aktarılan protobuf iz aralıklarını çözer
ve sürüm açısından kritik biçimi denetler:
`openclaw.run`, `openclaw.harness.run`, en yeni GenAI anlamsal kural
model çağrısı aralığı, `openclaw.context.assembled` ve `openclaw.message.delivery`
mevcut olmalıdır. Duman testi
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` değerini zorlar, bu nedenle model çağrısı
aralığı `{gen_ai.operation.name} {gen_ai.request.model}` adını kullanmalıdır;
model çağrıları başarılı turlarda `StreamAbandoned` dışa aktarmamalıdır; ham tanılama ID’leri ve
`openclaw.content.*` öznitelikleri iz dışında kalmalıdır. Ham OTLP
yükleri istem ayıracını, yanıt ayıracını veya QA oturum anahtarını içermemelidir.
QA paketi yapıtlarının yanına `otel-smoke-summary.json` yazar.

Toplayıcı destekli OpenTelemetry duman testi için şunu çalıştırın:

```bash
pnpm qa:otel:collector-smoke
```

Bu hat, aynı yerel alıcının önüne gerçek bir OpenTelemetry Collector Docker konteyneri koyar.
Uç nokta kablolamasını, toplayıcı uyumluluğunu veya işlem içi alıcının maskeleyebileceği
OTLP dışa aktarma davranışını değiştirirken bunu kullanın.

Korumalı Prometheus kazıma duman testi için şunu çalıştırın:

```bash
pnpm qa:prometheus:smoke
```

Bu takma ad, `diagnostics-prometheus` etkin olarak `docker-prometheus-smoke` QA senaryosunu çalıştırır, kimliği doğrulanmamış scrape işlemlerinin reddedildiğini doğrular, ardından kimliği doğrulanmış scrape çıktısının istem içeriği, yanıt içeriği, ham tanılama tanımlayıcıları, kimlik doğrulama tokenları veya yerel yollar olmadan sürüm açısından kritik metrik ailelerini içerdiğini denetler.

İki gözlemlenebilirlik smoke testini arka arkaya çalıştırmak için şunu kullanın:

```bash
pnpm qa:observability:smoke
```

Toplayıcı destekli OpenTelemetry hattı ve korumalı Prometheus scrape smoke testi için şunu kullanın:

```bash
pnpm qa:observability:collector-smoke
```

Gözlemlenebilirlik QA yalnızca kaynak checkout üzerinde kalır. npm tarball paketi QA Lab’i bilinçli olarak içermez, bu nedenle paket Docker sürüm hatları `qa` komutlarını çalıştırmaz. Tanılama enstrümantasyonunu değiştirirken oluşturulmuş bir kaynak checkout içinden `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` veya `pnpm qa:observability:smoke` kullanın.

Model sağlayıcı kimlik bilgileri gerektirmeyen, gerçek taşıma kullanan bir Matrix smoke hattı için belirleyici sahte OpenAI sağlayıcısıyla hızlı profili çalıştırın:

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

Bu hatta ait tam CLI referansı, profil/senaryo kataloğu, env vars ve artifact düzeni [Matrix QA](/tr/concepts/qa-matrix) içinde bulunur. Kısaca: Docker içinde tek kullanımlık bir Tuwunel homeserver hazırlar, geçici sürücü/SUT/gözlemci kullanıcıları kaydeder, gerçek Matrix Plugin’ini bu taşıma için kapsamlandırılmış bir alt QA gateway içinde çalıştırır (`qa-channel` yok), ardından `.artifacts/qa-e2e/matrix-<timestamp>/` altında bir Markdown raporu, JSON özeti, gözlemlenen olaylar artifact’i ve birleşik çıktı günlüğü yazar.

Senaryolar, birim testlerinin uçtan uca kanıtlayamayacağı taşıma davranışını kapsar: mention gating, botlara izin verme politikaları, allowlist’ler, üst düzey ve thread’li yanıtlar, DM yönlendirme, reaction işleme, gelen düzenleme bastırma, yeniden başlatma sonrası replay tekilleştirme, homeserver kesintisi kurtarma, onay metadata teslimi, medya işleme ve Matrix E2EE bootstrap/kurtarma/doğrulama akışları. E2EE CLI profili ayrıca gateway yanıtlarını denetlemeden önce aynı tek kullanımlık homeserver üzerinden `openclaw matrix encryption setup` ve doğrulama komutlarını çalıştırır.

Discord’da ayrıca hata yeniden üretimi için yalnızca Mantis’e özgü isteğe bağlı senaryolar vardır. Açık durum reaction zaman çizelgesi için `--scenario discord-status-reactions-tool-only` kullanın veya gerçek bir Discord thread’i oluşturup `message.thread-reply` öğesinin bir `filePath` ekini koruduğunu doğrulamak için `--scenario discord-thread-reply-filepath-attachment` kullanın. Bu senaryolar, geniş smoke kapsamı yerine öncesi/sonrası yeniden üretim probları oldukları için varsayılan canlı Discord hattının dışında kalır. Thread eki Mantis iş akışı, QA ortamında `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` veya `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` yapılandırılmışsa oturum açmış bir Discord Web tanık videosu da ekleyebilir. Bu görüntüleyici profili yalnızca görsel yakalama içindir; geçti/kaldı kararı yine Discord REST oracle’dan gelir.

CI, `.github/workflows/qa-live-transports-convex.yml` içinde aynı komut yüzeyini kullanır. Zamanlanmış ve varsayılan manuel çalıştırmalar, QA tarafından sağlanan live-frontier kimlik bilgileri, `--fast` ve `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` ile hızlı Matrix profilini yürütür. Manuel `matrix_profile=all`, beş profil shard’ına yayılır.

Gerçek taşıma kullanan Telegram, Discord, Slack ve WhatsApp smoke hatları için:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Bunlar, iki bot veya hesaba (sürücü + SUT) sahip önceden var olan gerçek bir kanalı hedefler. Gerekli env vars, senaryo listeleri, çıktı artifact’leri ve Convex kimlik bilgisi havuzu aşağıdaki [Telegram, Discord, Slack ve WhatsApp QA referansı](#telegram-discord-slack-and-whatsapp-qa-reference) bölümünde belgelenmiştir.

VNC kurtarma ile tam bir Slack masaüstü VM çalıştırması için şunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bu komut bir Crabbox masaüstü/tarayıcı makinesi kiralar, Slack canlı hattını VM içinde çalıştırır, VNC tarayıcısında Slack Web’i açar, masaüstünü yakalar ve video yakalama kullanılabiliyorsa `slack-qa/`, `slack-desktop-smoke.png` ve `slack-desktop-smoke.mp4` dosyalarını Mantis artifact dizinine geri kopyalar. Crabbox masaüstü/tarayıcı kiralamaları yakalama araçlarını ve tarayıcı/native-build yardımcı paketlerini baştan sağlar; bu nedenle senaryo yalnızca eski kiralamalarda fallback kurmalıdır. Mantis toplam ve faz başına süreleri `mantis-slack-desktop-smoke-report.md` içinde raporlar; böylece yavaş çalıştırmalarda sürenin kiralama ısınmasına, kimlik bilgisi edinimine, uzak kuruluma veya artifact kopyalamaya gidip gitmediği görülebilir. VNC üzerinden Slack Web’e manuel giriş yaptıktan sonra `--lease-id <cbx_...>` ile yeniden kullanın; yeniden kullanılan kiralamalar Crabbox’ın pnpm store cache’ini de sıcak tutar. Varsayılan `--hydrate-mode source`, bir kaynak checkout içinden doğrulama yapar ve install/build işlemlerini VM içinde çalıştırır. `--hydrate-mode prehydrated` yalnızca yeniden kullanılan uzak workspace’te zaten `node_modules` ve oluşturulmuş bir `dist/` varsa kullanın; bu mod pahalı install/build adımını atlar ve workspace hazır değilse güvenli şekilde başarısız olur. `--gateway-setup` ile Mantis, VM içinde `38973` portunda kalıcı bir OpenClaw Slack gateway çalışır durumda bırakır; onsuz komut normal botlar arası Slack QA hattını çalıştırır ve artifact yakalamadan sonra çıkar.

Masaüstü kanıtıyla yerel Slack onay UI’sini kanıtlamak için Mantis onay checkpoint modunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Bu mod `--gateway-setup` ile karşılıklı olarak dışlayıcıdır. Slack onay senaryolarını çalıştırır, onay dışı senaryo id’lerini reddeder, her bekleyen ve çözümlenmiş onay durumunda bekler, gözlemlenen Slack API mesajını `approval-checkpoints/<scenario>-pending.png` ve `approval-checkpoints/<scenario>-resolved.png` olarak render eder, ardından herhangi bir checkpoint, mesaj kanıtı, acknowledgement veya render edilmiş ekran görüntüsü eksik ya da boşsa başarısız olur. Soğuk CI kiralamaları `slack-desktop-smoke.png` içinde hâlâ Slack oturum açma ekranını gösterebilir; onay checkpoint görüntüleri bu hattın görsel kanıtıdır.

Operatör checklist’i, GitHub workflow dispatch komutu, kanıt yorumu sözleşmesi, hydrate-mode karar tablosu, süre yorumlama ve hata işleme adımları [Mantis Slack Masaüstü Runbook](/tr/concepts/mantis-slack-desktop-runbook) içinde bulunur.

Agent/CV tarzı bir masaüstü görevi için şunu çalıştırın:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` bir Crabbox masaüstü/tarayıcı makinesi kiralar veya yeniden kullanır, `crabbox record --while` başlatır, görünen tarayıcıyı iç içe bir `visual-driver` üzerinden sürer, `visual-task.png` yakalar, `--vision-mode image-describe` seçildiğinde ekran görüntüsüne karşı `openclaw infer image describe` çalıştırır ve `visual-task.mp4`, `mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` ve `mantis-visual-task-report.md` yazar. `--expect-text` ayarlandığında vision istemi yapılandırılmış bir JSON kararı ister ve yalnızca model pozitif görünür kanıt bildirdiğinde geçer; yalnızca hedef metni alıntılayan negatif bir yanıt assertion’ı başarısız kılar. Bir görüntü anlama sağlayıcısını çağırmadan masaüstü, tarayıcı, ekran görüntüsü ve video tesisatını kanıtlayan modelsiz smoke için `--vision-mode metadata` kullanın. Kayıt, `visual-task` için zorunlu bir artifact’tir; Crabbox boş olmayan bir `visual-task.mp4` kaydetmezse görsel sürücü geçmiş olsa bile görev başarısız olur. Hata durumunda Mantis, görev zaten geçmemişse ve `--keep-lease` ayarlanmamışsa VNC için kiralamayı korur.

Havuzdaki canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex broker env’ini denetler, endpoint ayarlarını doğrular ve maintainer secret mevcut olduğunda admin/list erişilebilirliğini doğrular. Secret’lar için yalnızca ayarlı/eksik durumunu raporlar.

## Canlı taşıma kapsamı

Canlı taşıma hatları, her birinin kendi senaryo listesi şeklini icat etmesi yerine tek bir sözleşme paylaşır. `qa-channel`, geniş sentetik ürün davranışı paketidir ve canlı taşıma kapsam matrisinin parçası değildir.

Canlı taşıma runner’ları paylaşılan senaryo id’lerini, baseline kapsam yardımcılarını ve senaryo seçimi yardımcısını `openclaw/plugin-sdk/qa-live-transport-scenarios` içinden import etmelidir.

| Hat      | Canary | Mention gating | Bottan bota | Allowlist engeli | Üst düzey yanıt | Quote yanıt | Yeniden başlatma sürdürme | Thread takibi | Thread izolasyonu | Reaction gözlemi | Yardım komutu | Yerel komut kaydı |
| -------- | ------ | -------------- | ----------- | ---------------- | --------------- | ----------- | ------------------------- | ------------- | ----------------- | ---------------- | ------------ | ----------------- |
| Matrix   | x      | x              | x           | x                | x               |             | x                         | x             | x                 | x                |              |                   |
| Telegram | x      | x              | x           |                  |                 |             |                           |               |                   |                  | x            |                   |
| Discord  | x      | x              | x           |                  |                 |             |                           |               |                   |                  |              | x                 |
| Slack    | x      | x              | x           | x                | x               |             | x                         | x             | x                 |                  |              |                   |
| WhatsApp | x      | x              |             | x                | x               | x           | x                         |               |                   | x                | x            |                   |

Bu, Matrix, Telegram ve diğer canlı taşımalar tek bir açık taşıma sözleşmesi checklist’i paylaşırken `qa-channel` öğesini geniş ürün davranışı paketi olarak korur.

QA yoluna Docker sokmadan tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass guest başlatır, bağımlılıkları kurar, OpenClaw’ı guest içinde oluşturur, `qa suite` çalıştırır, ardından normal QA raporunu ve özetini host üzerindeki `.artifacts/qa-e2e/...` içine geri kopyalar. Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır. Host ve Multipass suite çalıştırmaları varsayılan olarak izole gateway worker’larıyla birden çok seçili senaryoyu paralel yürütür. `qa-channel` varsayılan olarak concurrency 4 kullanır ve seçili senaryo sayısıyla sınırlanır. Worker sayısını ayarlamak için `--concurrency <count>` veya seri yürütme için `--concurrency 1` kullanın. Kişisel asistan benchmark paketini çalıştırmak için `--pack personal-agent` kullanın. Paket seçici, tekrarlanan `--scenario` flag’leriyle toplamsaldır: açık senaryolar önce çalışır, ardından paket senaryoları yinelemeler kaldırılmış olarak paket sırasıyla çalışır. Özel bir QA runner zaten OpenTelemetry collector kurulumunu sağlıyorsa ve OpenTelemetry ile Prometheus tanılama smoke senaryolarının birlikte seçilmesini istiyorsa `--pack observability` kullanın. Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact istiyorsanız `--allow-failures` kullanın. Canlı çalıştırmalar guest için pratik olan desteklenen QA auth girdilerini iletir: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı config yolu ve mevcut olduğunda `CODEX_HOME`. Guest’in bağlı workspace üzerinden geri yazabilmesi için `--output-dir` öğesini repo kökü altında tutun.

## Telegram, Discord, Slack ve WhatsApp QA başvurusu

Matrix, senaryo sayısı ve Docker destekli homeserver sağlama süreci nedeniyle [ayrı bir sayfaya](/tr/concepts/qa-matrix) sahiptir. Telegram, Discord, Slack ve WhatsApp önceden var olan gerçek taşımalara karşı çalışır, bu yüzden başvuruları burada yer alır.

### Paylaşılan CLI bayrakları

Bu hatlar `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` üzerinden kaydolur ve aynı bayrakları kabul eder:

| Bayrak                                | Varsayılan                                        | Açıklama                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                 | Yalnızca bu senaryoyu çalıştır. Tekrarlanabilir.                                                                                                          |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Raporların, özetlerin, kanıtların, taşıma özelindeki yapıtların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` temel alınarak çözümlenir. |
| `--repo-root <path>`                  | `process.cwd()`                                   | Nötr bir cwd’den çağırırken depo kökü.                                                                                                                    |
| `--sut-account <id>`                  | `sut`                                             | QA gateway yapılandırması içindeki geçici hesap kimliği.                                                                                                  |
| `--provider-mode <mode>`              | `live-frontier`                                   | `mock-openai` veya `live-frontier` (eski `live-openai` hâlâ çalışır).                                                                                     |
| `--model <ref>` / `--alt-model <ref>` | sağlayıcı varsayılanı                             | Birincil/alternatif model başvuruları.                                                                                                                    |
| `--fast`                              | kapalı                                            | Desteklendiği yerlerde sağlayıcı hızlı modu.                                                                                                              |
| `--credential-source <env\|convex>`   | `env`                                             | Bkz. [Convex kimlik bilgisi havuzu](#convex-credential-pool).                                                                                             |
| `--credential-role <maintainer\|ci>`  | CI içinde `ci`, aksi halde `maintainer`           | `--credential-source convex` kullanıldığında kullanılan rol.                                                                                              |

Her hat, başarısız olan herhangi bir senaryoda sıfır dışı kodla çıkar. `--allow-failures`, başarısız çıkış kodu ayarlamadan yapıtları yazar.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

İki ayrı botun (sürücü + SUT) bulunduğu bir gerçek özel Telegram grubunu hedefler. SUT botunun bir Telegram kullanıcı adı olmalıdır; bottan bota gözlem, her iki botta da `@BotFather` içinde **Bot-to-Bot Communication Mode** etkinleştirildiğinde en iyi çalışır.

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

Örtük varsayılan küme her zaman canary, mention gating, yerel komut yanıtları, komut adresleme ve bottan bota grup yanıtlarını kapsar. `mock-openai` varsayılanları ayrıca belirleyici yanıt zinciri ve final ileti akışı denetimlerini içerir. `telegram-current-session-status-tool`, yalnızca canary’den hemen sonra iş parçacığına bağlandığında kararlı olduğu, rastgele yerel komut yanıtlarından sonra kararlı olmadığı için opt-in kalır. Geçerli varsayılan/isteğe bağlı ayrımını regresyon başvurularıyla yazdırmak için `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` kullanın.

Çıktı yapıtları:

- `telegram-qa-report.md`
- `qa-evidence.json` - profil, kapsama, sağlayıcı, kanal, yapıtlar, sonuç ve RTT alanları dahil olmak üzere canlı taşıma denetimleri için kanıt girdileri.

Paket Telegram çalıştırmaları aynı Telegram kimlik bilgisi sözleşmesini kullanır. Tekrarlanan RTT ölçümü normal paket Telegram canlı hattının parçasıdır; RTT dağılımı, seçili RTT denetimi için `qa-evidence.json` içinde `result.timing` altına katılır.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlandığında, paket canlı sarmalayıcısı bir `kind: "telegram"` kimlik bilgisi kiralar, kiralanan grup/sürücü/SUT bot env değerlerini kurulu paket çalıştırmasına dışa aktarır, kiralamaya heartbeat gönderir ve kapanışta serbest bırakır. Paket sarmalayıcısı, Convex seçildiğinde CI dışında `telegram-mentioned-message-reply` için varsayılan olarak 20 RTT denetimi, 30 sn RTT zaman aşımı ve Convex rolü `maintainer` kullanır. Ayrı bir RTT komutu veya Telegram’a özel özet biçimi oluşturmadan RTT ölçümünü ayarlamak için `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` veya `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` değerlerini geçersiz kılın.

### Discord QA

```bash
pnpm openclaw qa discord
```

İki bot bulunan bir gerçek özel Discord guild kanalını hedefler: harness tarafından kontrol edilen bir sürücü botu ve paketlenmiş Discord Plugin üzerinden alt OpenClaw gateway tarafından başlatılan bir SUT botu. Kanal mention işlemeyi, SUT botunun Discord ile yerel `/help` komutunu kaydettiğini ve opt-in Mantis kanıt senaryolarını doğrular.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord tarafından döndürülen SUT bot kullanıcı kimliğiyle eşleşmelidir (aksi halde hat hızlı başarısız olur).

İsteğe bağlı:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` gözlenen ileti yapıtlarında ileti gövdelerini tutar.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID`, `discord-voice-autojoin` için ses/sahne kanalını seçer; bu olmadan senaryo SUT botu için ilk görünür ses/sahne kanalını seçer.

Senaryolar (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in ses senaryosu. Tek başına çalışır, `channels.discord.voice.autoJoin` etkinleştirir ve SUT botunun geçerli Discord ses durumunun hedef ses/sahne kanalı olduğunu doğrular. Convex Discord kimlik bilgileri isteğe bağlı `voiceChannelId` içerebilir; aksi halde çalıştırıcı guild içindeki ilk görünür ses/sahne kanalını keşfeder.
- `discord-status-reactions-tool-only` - opt-in Mantis senaryosu. SUT’u `messages.statusReactions.enabled=true` ile her zaman açık, yalnızca araçlı guild yanıtlarına geçirdiği için tek başına çalışır, ardından REST tepki zaman çizelgesini ve HTML/PNG görsel yapıtlarını yakalar. Mantis önce/sonra raporları ayrıca senaryonun sağladığı MP4 yapıtlarını `baseline.mp4` ve `candidate.mp4` olarak korur.

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

İki ayrı botun bulunduğu bir gerçek özel Slack kanalını hedefler: harness tarafından kontrol edilen bir sürücü botu ve paketlenmiş Slack Plugin üzerinden alt OpenClaw gateway tarafından başlatılan bir SUT botu.

`--credential-source env` olduğunda gerekli env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` gözlenen ileti yapıtlarında ileti gövdelerini tutar.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`, Mantis için görsel onay denetim noktalarını etkinleştirir. Çalıştırıcı `<scenario>.pending.json` ve `<scenario>.resolved.json` yazar, ardından eşleşen `.ack.json` dosyalarını bekler.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` denetim noktası onay zaman aşımını geçersiz kılar. Varsayılan `120000` değeridir.

Senaryolar (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - opt-in yerel Slack exec onay senaryosu. Gateway üzerinden bir exec onayı ister, Slack iletisinde yerel onay düğmeleri olduğunu doğrular, bunu çözer ve çözümlenmiş Slack güncellemesini doğrular.
- `slack-approval-plugin-native` - opt-in yerel Slack Plugin onay senaryosu. Plugin olaylarının exec onay yönlendirmesi tarafından bastırılmaması için exec ve Plugin onay iletmeyi birlikte etkinleştirir, ardından aynı bekleyen/çözümlenen yerel Slack UI yolunu doğrular.

Çıktı yapıtları:

- `slack-qa-report.md`
- `qa-evidence.json` - canlı taşıma denetimleri için kanıt girdileri.
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.
- `approval-checkpoints/` - yalnızca Mantis `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` ayarladığında; denetim noktası JSON’u, onay JSON’u ve bekleyen/çözümlenen ekran görüntülerini içerir.

#### Slack çalışma alanını ayarlama

Hat, tek bir çalışma alanında iki ayrı Slack uygulamasına ve her iki botun da üye olduğu bir kanala ihtiyaç duyar:

- `channelId` - her iki botun da davet edildiği bir kanalın `Cxxxxxxxxxx` kimliği. Özel bir kanal kullanın; hat her çalıştırmada gönderi yapar.
- `driverBotToken` - **Driver** uygulamasının bot token’ı (`xoxb-...`).
- `sutBotToken` - SUT uygulamasının bot token’ı (`xoxb-...`); bot kullanıcı kimliğinin ayrı olması için sürücüden ayrı bir Slack uygulaması olmalıdır.
- `sutAppToken` - Socket Mode tarafından kullanılan, SUT uygulamasının olayları alabilmesi için `connections:write` içeren SUT uygulamasının uygulama düzeyi token’ı (`xapp-...`).

Üretim çalışma alanını yeniden kullanmak yerine QA’ya ayrılmış bir Slack çalışma alanını tercih edin.

Aşağıdaki SUT bildirimi, paketlenmiş Slack Plugin’in üretim kurulumunu (`extensions/slack/src/setup-shared.ts:10`) bilinçli olarak canlı Slack QA paketinin kapsadığı izinlere ve olaylara daraltır. Kullanıcıların gördüğü üretim kanalı kurulumu için bkz. [Slack kanalı hızlı kurulumu](/tr/channels/slack#quick-setup); QA Driver/SUT çifti bilinçli olarak ayrıdır çünkü hattın tek bir çalışma alanında iki ayrı bot kullanıcı kimliğine ihtiyacı vardır.

**1. Driver uygulamasını oluşturun**

[api.slack.com/apps](https://api.slack.com/apps) adresine gidin → _Create New App_ → _From a manifest_ → QA çalışma alanını seçin, aşağıdaki bildirimi yapıştırın, ardından _Install to Workspace_:

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

_Bot User OAuth Token_ değerini (`xoxb-...`) kopyalayın - bu `driverBotToken` olur. Sürücünün yalnızca ileti göndermesi ve kendini tanımlaması gerekir; olaylara veya Socket Mode'a gerek yoktur.

**2. SUT uygulamasını oluşturun**

Aynı çalışma alanında _Create New App → From a manifest_ işlemini tekrarlayın. Bu QA uygulaması, paketle gelen Slack Plugin'inin üretim bildiriminin (`extensions/slack/src/setup-shared.ts:10`) özellikle daha dar bir sürümünü kullanır: canlı Slack QA paketi henüz tepki işleme kapsamını içermediği için tepki kapsamları ve olayları atlanmıştır.

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

Slack uygulamayı oluşturduktan sonra ayarlar sayfasında iki işlem yapın:

- _Install to Workspace_ → _Bot User OAuth Token_ değerini kopyalayın → bu `sutBotToken` olur.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → `connections:write` kapsamını ekleyin → kaydedin → `xapp-...` değerini kopyalayın → bu `sutAppToken` olur.

Her belirteçte `auth.test` çağırarak iki botun farklı kullanıcı kimliklerine sahip olduğunu doğrulayın. Çalışma zamanı, sürücüyü ve SUT'yi kullanıcı kimliğine göre ayırt eder; ikisi için aynı uygulamayı yeniden kullanmak, bahsetme geçidinde hemen başarısız olur.

**3. Kanalı oluşturun**

QA çalışma alanında bir kanal oluşturun (ör. `#openclaw-qa`) ve kanalın içinden iki botu da davet edin:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_Kanal bilgisi → Hakkında → Kanal Kimliği_ bölümünden `Cxxxxxxxxxx` kimliğini kopyalayın - bu `channelId` olur. Herkese açık bir kanal çalışır; özel kanal kullanırsanız her iki uygulamada da zaten `groups:history` bulunduğundan harness'ın geçmiş okumaları yine başarılı olur.

**4. Kimlik bilgilerini kaydedin**

İki seçenek vardır. Tek makinede hata ayıklama için env vars kullanın (dört `OPENCLAW_QA_SLACK_*` değişkenini ayarlayın ve `--credential-source env` geçin) veya CI ile diğer bakımcıların kiralayabilmesi için paylaşılan Convex havuzunu tohumlayın.

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

**5. Baştan sona doğrulayın**

İki botun broker üzerinden birbirleriyle konuşabildiğini doğrulamak için şeridi yerelde çalıştırın:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Yeşil bir çalışma 30 saniyenin çok altında tamamlanır ve `slack-qa-report.md`, hem `slack-canary` hem de `slack-mention-gating` için `pass` durumunu gösterir. Şerit yaklaşık 90 saniye takılı kalır ve `Convex credential pool exhausted for kind "slack"` ile çıkarsa havuz ya boştur ya da her satır kiralanmıştır - `qa credentials list --kind slack --status all --json` hangisi olduğunu söyler.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

İki ayrılmış WhatsApp Web hesabını hedefler: harness tarafından denetlenen bir sürücü hesabı ve alt OpenClaw Gateway tarafından paketle gelen WhatsApp Plugin'i üzerinden başlatılan bir SUT hesabı.

`--credential-source env` kullanıldığında gerekli env:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

İsteğe bağlı:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID`, `whatsapp-mention-gating` ve `whatsapp-group-allowlist-block` gibi grup senaryolarını etkinleştirir.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`, gözlemlenen ileti yapıtlarında ileti gövdelerini tutar.

Senaryo kataloğu (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Temel hat ve grup geçidi: `whatsapp-canary`, `whatsapp-pairing-block`,
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
  `whatsapp-group-audio-gating`. Bunlar sürücü üzerinden gerçek WhatsApp görsel, ses,
  belge, konum, kişi ve çıkartma olayları gönderir.
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

Katalog şu anda 36 senaryo içerir. `live-frontier` varsayılan şeridi, hızlı smoke kapsamı için 10 senaryoda küçük tutulur. `mock-openai` varsayılan şeridi, yalnızca model çıktısını taklit ederken gerçek WhatsApp taşıması üzerinden 31 deterministik senaryo çalıştırır. Onay senaryoları ve birkaç daha ağır/engelleyici kontrol, senaryo kimliğiyle açık tutulur.

WhatsApp QA sürücüsü yapılandırılmış canlı olayları (`text`, `media`, `location`, `reaction` ve `poll`) gözlemler ve etkin olarak medya, anket, kişi, konum ve çıkartma gönderebilir. QA Lab bu sürücüyü özel WhatsApp çalışma zamanı dosyalarına erişmek yerine `@openclaw/whatsapp/api.js` paket yüzeyi üzerinden içe aktarır. İleti içeriği varsayılan olarak redakte edilir. Giden anket ve dosya yükleme kapsamı, yalnızca model istemiyle araç çağrısı yerine deterministik Gateway `poll` ve `message.action` çağrıları üzerinden çalışır.

Çıktı yapıtları:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - canlı taşıma kontrolleri için kanıt girdileri.
- `whatsapp-qa-observed-messages.json` - `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir.

### Convex kimlik bilgisi havuzu

Telegram, Discord, Slack ve WhatsApp şeritleri, yukarıdaki env vars değerlerini okumak yerine paylaşılan bir Convex havuzundan kimlik bilgisi kiralayabilir. `--credential-source convex` geçin (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın); QA Lab özel bir kira alır, çalışma süresi boyunca Heartbeat gönderir ve kapanışta serbest bırakır. Havuz türleri `"telegram"`, `"discord"`, `"slack"` ve `"whatsapp"` şeklindedir.

Broker'ın `admin/add` üzerinde doğruladığı yük şekilleri:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` sayısal bir sohbet kimliği dizesi olmalıdır.
- Telegram gerçek kullanıcı (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - yalnızca Mantis Telegram Desktop kanıtı. Genel QA Lab şeritleri bu türü almamalıdır.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - telefon numaraları farklı E.164 dizeleri olmalıdır.

Mantis Telegram Desktop kanıt iş akışı, hem TDLib CLI sürücüsü hem de Telegram Desktop tanığı için bir özel Convex `telegram-user` kirası tutar, ardından kanıtı yayımladıktan sonra serbest bırakır.

Bir PR deterministik görsel fark gerektirdiğinde Mantis, Telegram biçimlendiricisi veya teslim katmanı değişirken `main` üzerinde ve PR başında aynı taklit model yanıtını kullanabilir. Yakalama varsayılanları PR yorumları için ayarlanmıştır: standart Crabbox sınıfı, 24fps masaüstü kaydı, 24fps hareket GIF'i ve 1920px önizleme genişliği. Önce/sonra yorumları, yalnızca amaçlanan GIF'leri içeren temiz bir paket yayımlamalıdır.

Slack şeritleri de havuzu kullanabilir. Slack yük şekli kontrolleri şu anda broker yerine Slack QA çalıştırıcısında bulunur; Slack kanal kimliği olarak `Cxxxxxxxxxx` gibi bir değerle `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` kullanın. Uygulama ve kapsam sağlama için [Slack çalışma alanını ayarlama](#setting-up-the-slack-workspace) bölümüne bakın.

Operasyonel env vars ve Convex broker uç noktası sözleşmesi [Test Etme → Convex üzerinden paylaşılan Telegram kimlik bilgileri](/tr/help/testing#shared-telegram-credentials-via-convex-v1) bölümünde yer alır (bölüm adı çok kanallı havuzdan öncedir; kira semantiği türler arasında paylaşılır).

## Repo destekli tohumlar

Tohum varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Bunlar, QA planının hem insanlar hem de agent tarafından görülebilmesi için bilerek git'te tutulur.

`qa-lab` genel bir YAML senaryo çalıştırıcısı olarak kalmalıdır. Her senaryo YAML dosyası bir test çalışmasının doğruluk kaynağıdır ve şunları tanımlamalıdır:

- üst düzey `title`
- `scenario` meta verileri
- `scenario` içinde isteğe bağlı kategori, yetenek, şerit ve risk meta verileri
- `scenario` içinde doküman ve kod başvuruları
- `scenario` içinde isteğe bağlı Plugin gereksinimleri
- `scenario` içinde isteğe bağlı Gateway yapılandırma yaması
- akış senaryoları için çalıştırılabilir üst düzey `flow` veya Vitest ve Playwright senaryoları için `scenario.execution.kind` /
  `scenario.execution.path`

`flow` öğesini destekleyen yeniden kullanılabilir çalışma zamanı yüzeyinin genel
ve kesişen kapsamlı kalmasına izin verilir. Örneğin YAML senaryoları,
taşıma tarafı yardımcılarını, özel durum çalıştırıcısı eklemeden gömülü Control UI'ı
Gateway `browser.request` birleşim noktası üzerinden süren tarayıcı tarafı
yardımcılarla birleştirebilir.

Senaryo dosyaları, kaynak ağacı klasörüne göre değil ürün yeteneğine göre
gruplanmalıdır. Dosyalar taşındığında senaryo kimliklerini kararlı tutun;
uygulama izlenebilirliği için `docsRefs` ve `codeRefs` kullanın.

Temel liste şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- iş parçacığı davranışı
- mesaj eylemi yaşam döngüsü
- cron geri çağrıları
- bellek hatırlama
- model değiştirme
- alt ajana devir
- repo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı mock hatları

`qa suite` iki yerel sağlayıcı mock hattına sahiptir:

- `mock-openai`, senaryo farkındalığı olan OpenClaw mock sağlayıcısıdır. Repo destekli QA ve eşdeğerlik kapıları için varsayılan
  deterministik mock hattı olarak kalır.
- `aimock`, deneysel protokol, fixture, kayıt/yeniden oynatma ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Ek niteliğindedir ve
  `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında bulunur.
Her sağlayıcı kendi varsayılanlarını, yerel sunucu başlatmasını, Gateway model yapılandırmasını,
kimlik doğrulama profili hazırlama gereksinimlerini ve canlı/mock yetenek bayraklarını sahiplenir. Paylaşılan suite ve
Gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirme yapmalıdır.

## Taşıma adaptörleri

`qa-lab`, YAML QA senaryoları için genel bir taşıma birleşim noktasını sahiplenir. `qa-channel`
sentetik varsayılandır. `crabline`, yerel sağlayıcı biçimli sunucular başlatır ve
OpenClaw'un normal kanal Plugin'lerini bunlara karşı çalıştırır. `live`, gerçek
sağlayıcı kimlik bilgileri ve harici kanallar için ayrılmıştır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab` genel senaryo yürütmeyi, çalışan eşzamanlılığını, artifakt yazımını ve raporlamayı sahiplenir.
- Taşıma adaptörü Gateway yapılandırmasını, hazır olma durumunu, gelen ve giden gözlemi, taşıma eylemlerini ve normalleştirilmiş taşıma durumunu sahiplenir.
- `qa/scenarios/` altındaki YAML senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

### Kanal ekleme

YAML QA sistemine kanal eklemek, kanal uygulamasını ve
kanal sözleşmesini çalıştıran bir senaryo paketini gerektirir. Smoke CI kapsamı için
eşleşen Crabline sahte sağlayıcı sunucusunu ekleyin ve `crabline`
sürücüsü üzerinden kullanıma açın.

Paylaşılan `qa-lab` ana makinesi akışı sahiplenebiliyorsa yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab` paylaşılan ana makine mekaniklerini sahiplenir:

- `openclaw qa` komut kökü
- suite başlatma ve kapatma
- çalışan eşzamanlılığı
- artifakt yazımı
- rapor oluşturma
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk alias'ları

Çalıştırıcı Plugin'leri taşıma sözleşmesini sahiplenir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökü altına nasıl bağlandığı
- Gateway'in bu taşıma için nasıl yapılandırıldığı
- hazır olma durumunun nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- dökümlerin ve normalleştirilmiş taşıma durumunun nasıl sunulduğu
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşımaya özgü sıfırlama veya temizlemenin nasıl ele alındığı

Yeni bir kanal için minimum benimseme eşiği:

1. `qa-lab` öğesini paylaşılan `qa` kökünün sahibi olarak tutun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` ana makine birleşim noktasında uygulayın.
3. Taşımaya özgü mekanikleri çalıştırıcı Plugin'i veya kanal test düzeni içinde tutun.
4. Çalıştırıcıyı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın. Çalıştırıcı Plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` dosyasından eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır. `runtime-api.ts` hafif kalmalıdır; tembel CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında YAML senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Repo kasıtlı bir geçiş yapmadıkça mevcut uyumluluk alias'larını çalışır tutun.

Karar kuralı katıdır:

- Davranış bir kez `qa-lab` içinde ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu ilgili çalıştırıcı Plugin'inde veya Plugin test düzeninde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yeteneğe ihtiyaç duyuyorsa, `suite.ts` içinde kanala özgü bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşımaya özgü tutun ve bunu senaryo sözleşmesinde açık hale getirin.

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

Uyumluluk alias'ları mevcut senaryolar için kullanılabilir kalır - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ancak yeni senaryo yazımı genel adları kullanmalıdır. Alias'lar ileriye dönük model olarak değil, tek seferlik zorunlu bir geçişi önlemek için vardır.

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şunları yanıtlamalıdır:

- Ne çalıştı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryolarını eklemeye değer

Kullanılabilir senaryoların envanteri için - takip çalışmasını boyutlandırırken veya yeni bir taşımayı bağlarken yararlıdır - `pnpm openclaw qa coverage` çalıştırın (makine tarafından okunabilir çıktı için `--json` ekleyin).
Dokunulan bir davranış veya dosya yolu için odaklı kanıt seçerken `pnpm openclaw qa coverage --match <query>` çalıştırın.
Eşleşme raporu senaryo meta verilerini, doküman ref'lerini, kod ref'lerini, kapsam kimliklerini, Plugin'leri ve sağlayıcı gereksinimlerini arar, ardından eşleşen `qa suite --scenario ...` hedeflerini yazdırır.
Her `qa suite` çalıştırması seçilen senaryo kümesi için üst düzey `qa-evidence.json`,
`qa-suite-summary.json` ve `qa-suite-report.md` artifaktları yazar. `execution.kind: vitest` veya
`execution.kind: playwright` bildiren senaryolar eşleşen test yolunu çalıştırır ve ayrıca
senaryo başına loglar yazar. `execution.kind: script` bildiren senaryolar
`execution.path` konumundaki kanıt üreticisini `node --import tsx` üzerinden çalıştırır
(`execution.args` içinde `${outputDir}` ve `${scenarioId}` genişletilerek); üretici
kendi `qa-evidence.json` dosyasını yazar, bunun girdileri suite çıktısına içe aktarılır
ve artifakt yolları ilgili üretici `qa-evidence.json` dosyasına göre çözümlenir. `qa suite`,
`qa run --qa-profile` üzerinden ulaşıldığında aynı `qa-evidence.json`, seçilen taksonomi
kategorileri için profil scorecard özetini de içerir.
Bunu kapı yerine geçen bir şey olarak değil, keşif yardımcısı olarak değerlendirin; seçilen senaryo, test edilen davranış için yine de doğru sağlayıcı moduna, canlı taşımaya, Multipass'e, Testbox'a veya yayın hattına ihtiyaç duyar.
Scorecard bağlamı için bkz. [Maturity scorecard](/tr/maturity/scorecard).

Karakter ve stil denetimleri için aynı senaryoyu birden fazla canlı model
ref'i genelinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

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

Komut Docker değil, yerel QA Gateway alt süreçlerini çalıştırır. Karakter değerlendirme
senaryoları personayı `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı
ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam dökümü korur, temel çalıştırma istatistiklerini kaydeder,
ardından desteklendiği yerlerde `xhigh` akıl yürütmeyle hızlı moddaki değerlendirme modellerinden
çalıştırmaları doğallık, üslup ve mizaha göre sıralamasını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: değerlendirme istemi yine de
her dökümü ve çalıştırma durumunu alır, ancak aday ref'leri `candidate-01` gibi tarafsız
etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek ref'lere geri eşler.
Aday çalıştırmalar varsayılan olarak `high` düşünme kullanır; GPT-5.5 için `medium`, bunu destekleyen eski OpenAI değerlendirme ref'leri için `xhigh` kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` hâlâ
genel bir fallback ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday ref'leri varsayılan olarak hızlı moda geçer; böylece sağlayıcının desteklediği yerlerde
öncelikli işleme kullanılır. Tek bir aday veya değerlendirici için geçersiz kılma gerektiğinde satır içine
`,fast`, `,no-fast` veya `,fast=false` ekleyin. `--fast` öğesini yalnızca
her aday model için hızlı modu zorlamak istediğinizde iletin. Aday ve değerlendirici süreleri
benchmark analizi için rapora kaydedilir, ancak değerlendirme istemleri açıkça
hıza göre sıralama yapmamayı söyler.
Aday ve değerlendirici model çalıştırmaları varsayılan olarak 16 eşzamanlılık kullanır. Sağlayıcı limitleri veya yerel Gateway
baskısı bir çalıştırmayı fazla gürültülü hale getirdiğinde `--concurrency` veya `--judge-concurrency` değerini düşürün.
Hiçbir aday `--model` geçirilmediğinde, karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
Hiçbir `--judge-model` geçirilmediğinde, değerlendiriciler varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-8,thinking=high` olur.

## İlgili dokümanlar

- [Matrix QA](/tr/concepts/qa-matrix)
- [Maturity scorecard](/tr/maturity/scorecard)
- [Kişisel ajan benchmark paketi](/tr/concepts/personal-agent-benchmark-pack)
- [QA Kanalı](/tr/channels/qa-channel)
- [Test Etme](/tr/help/testing)
- [Dashboard](/tr/web/dashboard)

---
doc-schema-version: 1
read_when:
    - QA yığınının nasıl bir araya geldiğini anlama
    - qa-lab, qa-channel veya bir aktarım bağdaştırıcısını genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu için daha gerçekçi QA otomasyonu oluşturma
summary: 'QA yığınına genel bakış: qa-lab, qa-channel, depo destekli senaryolar, canlı taşıma hatları, taşıma bağdaştırıcıları ve raporlama.'
title: QA genel bakışı
x-i18n:
    generated_at: "2026-07-16T17:21:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Özel QA yığını, OpenClaw'ı birim testinin yapamayacağı gerçekçi ve kanal
yapısına uygun bir biçimde sınar.

Parçalar:

- `extensions/qa-channel`: DM, kanal, ileti dizisi,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek, gelen mesajları
  enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı kullanıcı arayüzü,
  QA veri yolu, senaryo profilleri ve canlı aktarım bağdaştırıcıları.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için depo destekli başlangıç varlıkları.
- [Mantis](/tr/concepts/mantis): gerçek aktarımlar, tarayıcı ekran görüntüleri,
  VM durumu ve PR kanıtı gerektiren hatalar için öncesi/sonrası canlı doğrulama.

## Komut yüzeyi

Her QA akışı `pnpm openclaw qa <subcommand>` altında çalışır. Birçoğunun `pnpm qa:*`
betik diğer adları vardır; her iki biçim de çalışır.

| Komut                                               | Amaç                                                                                                                                                                                                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` olmadan paketlenmiş QA öz denetimi; `--qa-profile smoke-ci`, `--qa-profile release` veya `--qa-profile all` içeren taksonomi destekli olgunluk profili çalıştırıcısı.                                                                                 |
| `qa suite`                                          | Depo destekli senaryoları QA gateway hattında çalıştırır. `--runner multipass`, ana makine yerine tek kullanımlık bir Linux VM kullanır.                                                                                                                            |
| `qa coverage`                                       | YAML senaryo kapsamı envanterini yazdırır (makine çıktısı için `--json`; dokunulan bir davranışın senaryolarını bulmak için `--match <query>`; çalışma zamanı aracı fikstürü kapsamı için `--tools`).                                                        |
| `qa parity-report`                                  | Model ekseni eşlik geçidi için iki `qa-suite-summary.json` dosyasını karşılaştırır veya Codex ile OpenClaw çalışma zamanı eşliği ve token verimliliği raporlarını yazmak için `--runtime-axis --token-efficiency` kullanır.                                             |
| `qa confidence-report`                              | QA kanıt yapıtlarını bir manifeste göre sınıflandırarak sıfır bilinmeyenli bir güven raporu oluşturur.                                                                                                                                                              |
| `qa confidence-self-test`                           | Güven geçidinin sapmayı algıladığını kanıtlayan başlangıç verileriyle hazırlanmış negatif kontrol kanaryaları yazar.                                                                                                                                                 |
| `qa jsonl-replay`                                   | Seçilmiş JSONL transkriptlerini çalışma zamanı eşliği yeniden oynatma düzeneği üzerinden yeniden oynatır.                                                                                                                                                            |
| `qa character-eval`                                 | Karakter QA senaryosunu birden fazla canlı modelde değerlendirilen bir raporla çalıştırır. Bkz. [Raporlama](#reporting).                                                                                                                                             |
| `qa manual`                                         | Seçilen sağlayıcı/model hattında tek seferlik bir istem çalıştırır.                                                                                                                                                                                                 |
| `qa ui`                                             | QA hata ayıklayıcı kullanıcı arayüzünü ve yerel QA veri yolunu başlatır (diğer ad: `pnpm qa:lab:ui`).                                                                                                                                                              |
| `qa docker-build-image`                             | Önceden hazırlanmış QA Docker imajını oluşturur.                                                                                                                                                                                                                    |
| `qa docker-scaffold`                                | QA panosu + gateway hattı için bir docker-compose iskeleti yazar.                                                                                                                                                                                                   |
| `qa up`                                             | QA sitesini oluşturur, Docker destekli yığını başlatır ve URL'yi yazdırır (diğer ad: `pnpm qa:lab:up`; `:fast` çeşidi `--use-prebuilt-image --bind-ui-dist --skip-ui-build` ekler).                                                                                 |
| `qa aimock`                                         | Yalnızca AIMock sağlayıcı sunucusunu başlatır.                                                                                                                                                                                                                      |
| `qa mock-openai`                                    | Yalnızca senaryoya duyarlı `mock-openai` sağlayıcı sunucusunu başlatır.                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Paylaşılan Convex kimlik bilgisi havuzunu yönetir.                                                                                                                                                                                                                  |
| `qa discord`                                        | Gerçek bir özel Discord lonca kanalına karşı canlı aktarım hattı.                                                                                                                                                                                                   |
| `qa matrix`                                         | Tek kullanımlık bir Tuwunel ana sunucusuna karşı QA Lab Matrix profilleri. Bkz. [Matrix duman testi hatları](#matrix-smoke-lanes).                                                                                                                                   |
| `qa slack`                                          | Gerçek bir özel Slack kanalına karşı canlı aktarım hattı.                                                                                                                                                                                                           |
| `qa telegram`                                       | Gerçek bir özel Telegram grubuna karşı canlı aktarım hattı.                                                                                                                                                                                                         |
| `qa whatsapp`                                       | Gerçek WhatsApp Web hesaplarına karşı canlı aktarım hattı.                                                                                                                                                                                                          |
| `qa mantis`                                         | Discord durum tepkileri kanıtı, Crabbox masaüstü/tarayıcı duman testi ve VNC'de Slack duman testi içeren, canlı aktarım hataları için öncesi/sonrası doğrulama çalıştırıcısı. Bkz. [Mantis](/tr/concepts/mantis) ve [Mantis Slack Masaüstü Çalıştırma Kılavuzu](/tr/concepts/mantis-slack-desktop-runbook). |

### Profil destekli `qa run`

Profil destekli `qa run`, üyeliği `taxonomy.yaml` üzerinden okur ve ardından
çözümlenen senaryoları `qa suite` üzerinden gönderir. `--surface` ve `--category`,
ayrı hatlar tanımlamak yerine seçilen profili filtreler. Ortaya çıkan
`qa-evidence.json`, seçilen kategori sayılarını ve eksik kapsam kimliklerini
içeren bir profil puan kartı özeti barındırır; ayrı ayrı kanıt girdileri testler,
kapsam rolleri ve sonuçlar için doğruluk kaynağı olmaya devam eder. Taksonomi özellik
kapsamı kimlikleri diğer ad değil, kesin kanıt hedefleridir: birincil senaryo kapsamı
eşleşen kimlikleri karşılar, ikincil kapsam ise yalnızca tavsiye niteliğinde kalır. Kapsam kimlikleri,
küçük harfli alfasayısal/tireli segmentlerle noktalı `namespace.behavior` biçimini kullanır;
profil, yüzey ve kategori kimlikleri mevcut tireli veya noktalı taksonomi
kimliklerini kullanmaya devam edebilir.

İnce kanıt, girdi başına `execution` öğesini atlar ve `evidenceMode: "slim"` değerini ayarlar;
`smoke-ci` varsayılan olarak ince biçimi kullanır ve `--evidence-mode full` tam girdileri geri yükler:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Sahte model sağlayıcıları ve Crabline yerel sağlayıcı sunucularıyla belirlenimci profil kanıtı
için `smoke-ci` kullanın. Canlı kanallara karşı Stable/LTS kanıtı için
`release` kullanın. `all` öğesini yalnızca açıkça tam taksonomi kanıtı çalıştırmaları
için kullanın; bu, her etkin olgunluk kategorisini seçer ve `qa_profile=all` ile
`QA
Profile Evidence` GitHub Actions iş akışı üzerinden gönderilebilir. Bir komut
aynı zamanda bir OpenClaw kök profiline ihtiyaç duyduğunda, kök profili QA
komutundan önce yerleştirin:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operatör akışı

Mevcut QA operatör akışı, iki bölmeli bir QA sitesidir:

- Sol: Agent ile Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu işlem QA sitesini oluşturur, Docker destekli gateway hattını başlatır ve
bir operatörün veya otomasyon döngüsünün agente bir QA görevi verebildiği,
gerçek kanal davranışını gözlemleyebildiği ve nelerin çalıştığını, başarısız olduğunu
veya engellenmiş kaldığını kaydedebildiği QA Lab sayfasını kullanıma sunar.

Docker imajını her seferinde yeniden oluşturmadan daha hızlı QA Lab kullanıcı
arayüzü yinelemesi yapmak için yığını, bağlama yoluyla eklenmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker hizmetlerini önceden oluşturulmuş bir imajda tutar ve
`extensions/qa-lab/web/dist` öğesini `qa-lab` konteynerine bağlama yoluyla ekler.
`qa:lab:watch`, değişiklik olduğunda bu paketi yeniden oluşturur ve QA Lab
varlık karması değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

### Gözlemlenebilirlik duman testleri

<Note>
Gözlemlenebilirlik QA'sı yalnızca kaynak kodu çalışma kopyasında kalır. npm tarball'ı
QA Lab'i (ve `qa-channel`) kasıtlı olarak dışarıda bırakır; bu nedenle paket
Docker sürüm hatları `qa` komutlarını çalıştırmaz. Tanılama enstrümantasyonunu
değiştirirken bunları oluşturulmuş bir kaynak kodu çalışma kopyasından çalıştırın.
</Note>

| Takma ad                                 | Çalıştırdığı işlem                                                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Yerel OpenTelemetry alıcısı ve `diagnostics-otel` etkinleştirilmiş `otel-trace-smoke` senaryosu.                                      |
| `pnpm qa:otel:collector-smoke`          | Gerçek bir OpenTelemetry Collector Docker konteynerinin arkasındaki aynı hat. Uç nokta bağlantılarını veya collector/OTLP uyumluluğunu değiştirirken kullanın. |
| `pnpm qa:prometheus:smoke`              | `diagnostics-prometheus` etkinleştirilmiş `docker-prometheus-smoke` senaryosu.                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` ve ardından `qa:prometheus:smoke`.                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` ve ardından `qa:prometheus:smoke`.                                                                            |

`qa:otel:smoke` yerel bir OTLP/HTTP alıcısı başlatır, asgari bir QA kanalı
aracı turu çalıştırır, ardından izlerin, metriklerin ve günlüklerin dışa
aktarıldığını doğrular. Dışa aktarılan protobuf iz kapsamlarını çözümler ve
sürüm açısından kritik yapıyı denetler:
`openclaw.run`, `openclaw.harness.run`, en güncel GenAI anlamsal kuralına
uygun bir model çağrısı kapsamı, `openclaw.context.assembled` ve `openclaw.message.delivery`
öğelerinin tümü mevcut olmalıdır. Smoke,
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` değerini zorunlu kıldığından model çağrısı
kapsamı `{gen_ai.operation.name} {gen_ai.request.model}` adını kullanmalıdır; başarılı turlarda model
çağrıları `StreamAbandoned` değerini dışa aktarmamalıdır; ham tanılama
kimlikleri ve `openclaw.content.*` öznitelikleri izin dışında kalmalıdır. Senaryo
istemi, modelden sabit bir işaretleyiciyle yanıt vermesini ve sabit bir gizli
dizeyi açıklamamasını ister; ham OTLP yükleri bunlardan hiçbirini veya senaryo
kimliğinden türetilen QA oturum anahtarını içermemelidir. QA paketi yapıtlarının
yanına `otel-smoke-summary.json` yazar.

`qa:prometheus:smoke` kimliği doğrulanmamış kazımaların reddedildiğini doğrular,
ardından kimliği doğrulanmış kazımanın istem içeriği, yanıt içeriği, ham
tanılama tanımlayıcıları, kimlik doğrulama token'ları veya yerel yollar olmadan
sürüm açısından kritik metrik ailelerini içerdiğini denetler.

### Matrix smoke hatları

Model sağlayıcı kimlik bilgileri gerektirmeyen, gerçek taşıma kullanan bir
Matrix smoke hattı için deterministik sahte OpenAI sağlayıcısıyla sürüm
profilini çalıştırın:

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

Canlı frontier sağlayıcı hattı için OpenAI uyumlu kimlik bilgilerini açıkça
sağlayın:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

Düz `pnpm openclaw qa matrix`, tam `all` profilini çalıştırır ve senaryo
hatalarından sonra devam eder. Daha kısa bir geri bildirim döngüsü için
`--fail-fast` kullanın veya ayrı senaryoları seçmek üzere
`--scenario <id>` seçeneğini tekrarlayın; açık senaryo kimlikleri
`--profile` değerine göre önceliklidir.

| Profil       | Senaryolar | Amaç                                                                                                                                     |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | Eksiksiz katalog (varsayılan).                                                                                                           |
| `release`    | 2         | Sürüm açısından kritik kanal temeli ve canlı izin listesi yeniden yüklemesi.                                                             |
| `fast`       | 12        | Odaklanmış ileti dizisi, tepki, onay, politika, bot geçidi ve şifreli yanıt kapsamı.                                                     |
| `transport`  | 50        | İleti dizileri, DM/oda yönlendirme, otomatik katılım, onaylar, tepkiler, yeniden başlatmalar, bahsetme/izin listesi politikası, düzenlemeler ve çok aktörlü sıralama. |
| `media`      | 7         | Görsel, oluşturulan görsel, ses, ek, desteklenmeyen medya ve şifreli medya kapsamı.                                                       |
| `e2ee-smoke` | 8         | Asgari şifreli yanıt, ileti dizisi, önyükleme, kurtarma, yeniden başlatma, karartma ve hata kapsamı.                                     |
| `e2ee-deep`  | 18        | Durum kaybı, yedekleme, anahtar kurtarma, cihaz hijyeni ve SAS/QR/DM doğrulaması.                                                        |
| `e2ee-cli`   | 9         | Donanım üzerinden `openclaw matrix encryption setup`, kurtarma anahtarı, çoklu hesap, gateway gidiş dönüşü ve öz doğrulama komutları. |

Profil üyeliği ve kanal gereksinimleri, `qa/scenarios/channels/` altındaki bildirimsel
Matrix senaryolarıyla birlikte bulunur. Çalıştırma, kanal sürücüsünü seçer.
Bunların canlı uygulamaları
`extensions/qa-lab/src/live-transports/matrix/scenarios/` altında bulunur.

Bağdaştırıcı, Docker'da tek kullanımlık bir Tuwunel ana sunucusu (varsayılan
görüntü `ghcr.io/matrix-construct/tuwunel:v1.5.1`, sunucu adı `matrix-qa.test`,
bağlantı noktası `28008`) hazırlar; geçici sürücü, SUT ve gözlemci
kullanıcıları kaydeder; gerekli odaları oluşturur ve karartılmış istek/yanıt
sınırını kaydeder. Ardından gerçek Matrix plugin'ini bu taşımayla sınırlı bir
alt QA gateway'inde çalıştırır (`qa-channel` yoktur) ve ortamı kapatır.

Yaygın seçenekler:

| Bayrak                   | Varsayılan        | Amaç                                                                                 |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `--profile <profile>`    | `all`             | Yukarıdaki profillerden birini seçer.                                                |
| `--scenario <id>`        | -                 | Bir senaryo seçer; tekrarlanabilir.                                                  |
| `--fail-fast`            | kapalı            | İlk başarısız denetimden veya senaryodan sonra durur.                                |
| `--allow-failures`       | kapalı            | Senaryo hatalarında başarısızlık çıkış kodu döndürmeden yapıtları yazar.             |
| `--provider-mode <mode>` | `live-frontier`   | Deterministik gönderim için `mock-openai`, canlı sağlayıcı için `live-frontier` kullanır. |
| `--model <ref>`          | sağlayıcı varsayılanı | Birincil `provider/model` referansını ayarlar.                                      |
| `--alt-model <ref>`      | sağlayıcı varsayılanı | Model değiştiren senaryoların kullandığı alternatif modeli ayarlar.                  |
| `--fast`                 | kapalı            | Desteklendiğinde sağlayıcı hızlı modunu etkinleştirir.                               |
| `--output-dir <path>`    | oluşturulan       | Rapor dizinini seçer; göreli yollar `--repo-root` konumuna göre çözümlenir.     |
| `--repo-root <path>`     | geçerli dizin     | Tarafsız bir çalışma dizininden çalıştırır.                                           |
| `--sut-account <id>`     | `sut`             | Alt gateway yapılandırmasındaki Matrix hesap kimliğini seçer.                        |

Matrix QA, paylaşılan Matrix kimlik bilgilerini kiralamaz: bağdaştırıcı tek
kullanımlık kullanıcıları yerel olarak oluşturur; bu nedenle
`--credential-source` veya `--credential-role` kabul etmez. Ana sunucu görüntüsünü
`OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın; olumsuz yanıtsızlık doğrulamalarını
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` ile ayarlayın (varsayılan `8000`, etkin senaryo
zaman aşımıyla sınırlandırılır). Matrix şifreleme yerel tanıtıcıları temizlikten
daha uzun yaşayabildiğinden tek seferlik komut, yapıtlar tamamen yazıldıktan
sonra normalde temiz bir çıkışı zorunlu kılar; yalnızca komutun geri dönmesi
gereken doğrudan bir test donanımı için `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` ayarlayın.

Her çalıştırma, seçilen çıktı dizini altında normal QA Lab yapıtlarını yazar:
`qa-suite-report.md`, `qa-suite-summary.json`, `qa-evidence.json` ve karartılmış bir
`matrix-harness-*/matrix-qa-harness.json` manifesti. Temizleme başarısız olursa yazdırılan
`docker compose ... down --remove-orphans` kurtarma komutunu çalıştırın. Yavaş çalıştırıcılarda
yanıtsızlık penceresini artırın; hızlı CI ortamlarında daha küçük bir pencere,
olumsuz doğrulamaları kısaltabilir.

Senaryolar, birim testlerinin uçtan uca kanıtlayamadığı taşıma davranışlarını
kapsar: bahsetme geçidi, botlara izin verme politikaları, izin listeleri, üst
düzey ve ileti dizili yanıtlar, DM yönlendirme, tepki işleme, gelen düzenleme
bastırma, yeniden başlatma sonrası tekrar oynatma tekilleştirmesi, ana sunucu
kesintisi kurtarması, onay meta verisi teslimi, medya işleme ve Matrix E2EE
önyükleme/kurtarma/doğrulama akışları. E2EE CLI profili ayrıca gateway
yanıtlarını denetlemeden önce aynı tek kullanımlık ana sunucu üzerinden
`openclaw matrix encryption setup` ve doğrulama komutlarını çalıştırır.

`matrix-room-block-streaming` ve `subagent-thread-spawn`, açık `--scenario` seçimiyle
kullanılabilir olmaya devam eder ancak varsayılan `all` profilinin
dışında kalır.

CI, `.github/workflows/qa-live-transports-convex.yml` içinde aynı komut yüzeyini kullanır. Zamanlanmış ve sürüm
çalıştırmaları sürüm senaryolarını yürütür. Manuel `matrix_profile=all`
gönderimleri `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` ve `e2ee-cli` profillerine dağıtılır; odaklanmış
gönderimler tek bir işte `fast`, `release` veya
`transport` seçer.

### Discord Mantis senaryoları

Discord ayrıca hata yeniden üretimi için yalnızca Mantis'e özel, isteğe bağlı
senaryolara sahiptir. Açık durum tepki zaman çizelgesi için
`--scenario discord-status-reactions-tool-only` kullanın veya gerçek bir Discord ileti dizisi oluşturmak ve
`message.thread-reply` öğesinin bir `filePath` ekini koruduğunu doğrulamak
için `--scenario discord-thread-reply-filepath-attachment` kullanın. Bu senaryolar, geniş smoke kapsamı yerine
önce/sonra yeniden üretim sondaları olduklarından varsayılan canlı Discord
hattının dışında kalır. İleti dizisi eki Mantis iş akışı, QA ortamında
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` veya `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` yapılandırıldığında oturum açmış bir
Discord Web tanık videosu da ekleyebilir. Bu görüntüleyici profili yalnızca
görsel yakalama içindir; başarılı/başarısız kararı yine Discord REST
oracle'ından gelir.

Gerçek taşıma kullanan diğer smoke hatları için:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Bunlar iki bot veya hesaba (sürücü + SUT) sahip, önceden mevcut gerçek bir
kanalı hedefler. Bu dört taşıma için gerekli ortam değişkenleri, senaryo
listeleri, çıktı yapıtları ve Convex kimlik bilgisi havuzu aşağıdaki
[Discord, Slack, Telegram ve WhatsApp QA referansında](#discord-slack-telegram-and-whatsapp-qa-reference)
belgelenmiştir.

### Mantis Slack masaüstü ve görsel görev çalıştırıcıları

VNC kurtarmalı tam bir Slack masaüstü VM çalıştırması için şunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bu komut bir Crabbox masaüstü/tarayıcı makinesi kiralar, Slack canlı
hattını VM içinde çalıştırır, VNC tarayıcısında Slack Web'i açar, masaüstünü
kaydeder ve `slack-qa/`, `slack-desktop-smoke.png` ile
`slack-desktop-smoke.mp4` (video kaydı kullanılabildiğinde) dosyalarını
Mantis yapıt dizinine geri kopyalar. Crabbox masaüstü/tarayıcı kiralamaları, kayıt
araçlarını ve tarayıcı/yerel derleme yardımcı paketlerini baştan sağladığından senaryo
yalnızca eski kiralamalarda yedek seçenekleri kurmalıdır. Mantis, toplam ve
aşama başına süreleri `mantis-slack-desktop-smoke-report.md` içinde bildirir; böylece yavaş çalıştırmalarda
sürenin kiralama hazırlığına, kimlik bilgisi edinmeye, uzak kuruluma veya
yapıt kopyalamaya mı harcandığı görülür. VNC üzerinden Slack Web'de
elle oturum açtıktan sonra `--lease-id <cbx_...>` kiralamasını yeniden kullanın;
yeniden kullanılan kiralamalar Crabbox'ın pnpm depo önbelleğini de
hazır tutar. Varsayılan `--hydrate-mode source`, bir kaynak çalışma kopyasından doğrulama yapar ve
kurulum/derlemeyi VM içinde çalıştırır. `--hydrate-mode prehydrated` seçeneğini yalnızca
yeniden kullanılan uzak çalışma alanında zaten `node_modules` ve derlenmiş bir `dist/`
bulunduğunda kullanın; bu mod maliyetli kurulum/derleme adımını atlar ve
çalışma alanı hazır değilse güvenli biçimde başarısız olur. `--gateway-setup` ile Mantis,
`38973` bağlantı noktasında VM içinde kalıcı bir
OpenClaw Slack gateway'i çalışır durumda bırakır; bu seçenek olmadan
komut, normal bottan bota Slack QA hattını çalıştırır ve yapıt
kaydı tamamlandıktan sonra çıkar.

Masaüstü kanıtıyla yerel Slack onay kullanıcı arayüzünü doğrulamak için Mantis
onay denetim noktası modunu çalıştırın:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Bu mod `--gateway-setup` ile birlikte kullanılamaz. Slack
onay senaryolarını çalıştırır, onay dışı senaryo kimliklerini reddeder, bekleyen
ve çözümlenmiş her onay durumunda bekler, gözlemlenen Slack API iletisini
`approval-checkpoints/<scenario>-pending.png` ve
`approval-checkpoints/<scenario>-resolved.png` içine işler; ardından herhangi bir denetim noktası,
ileti kanıtı, alındı bildirimi veya işlenmiş ekran görüntüsü eksik ya da
boşsa başarısız olur. Soğuk CI kiralamaları
`slack-desktop-smoke.png` içinde hâlâ Slack oturum açma ekranını gösterebilir;
onay denetim noktası görüntüleri bu hattın görsel
kanıtıdır.

Varsayılan denetim noktası çalıştırması iki standart Slack onay senaryosunu korur.
İsteğe bağlı Codex onay yollarından birini kaydetmek için
`--scenario slack-codex-approval-exec-native` veya
`--scenario slack-codex-approval-plugin-native` ile açıkça seçin; Mantis her ikisini de kabul eder ve
aynı bekleyen/çözümlenmiş ekran görüntüsü çiftini üretir. Çalıştırıcı, seçilen her Codex yolu için
denetim noktası ve uzak komut zaman aşımı sürelerini uzatır; böylece tüm
onay, ajan tamamlama ve çözümlenmiş güncelleme dizisi tamamlanabilir.

Operatör denetim listesi, GitHub iş akışı gönderim komutu, kanıt yorumu
sözleşmesi, hydrate modu karar tablosu, süre yorumlama ve hata
işleme adımları
[Mantis Slack Masaüstü Çalıştırma Kılavuzu](/tr/concepts/mantis-slack-desktop-runbook) içinde bulunur.

Ajan/CV tarzı bir masaüstü görevi için şunu çalıştırın:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` bir Crabbox masaüstü/tarayıcı makinesi kiralar veya yeniden kullanır,
`crabbox record --while` başlatır, görünür tarayıcıyı iç içe bir
`visual-driver` aracılığıyla yönetir, `visual-task.png` kaydeder,
`--vision-mode image-describe` seçildiğinde ekran görüntüsüne karşı `openclaw infer image
describe` çalıştırır
ve `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` ile
`mantis-visual-task-report.md` dosyalarını yazar. `--expect-text` ayarlandığında görsel
istemi, yapılandırılmış bir JSON kararı (`visible`, `evidence`, `reason`)
ister ve yalnızca model, beklenen metne atıfta bulunan kanıtla birlikte
`visible: true` bildirdiğinde başarılı olur; hedef metni yalnızca alıntılayan bir
`visible: false` yanıtı yine de doğrulamada başarısız olur.
Bir görüntü anlama sağlayıcısını çağırmadan masaüstü, tarayıcı, ekran görüntüsü ve video
altyapısını doğrulayan modelsiz bir smoke testi için `--vision-mode metadata` kullanın. Kayıt,
`visual-task` için zorunlu bir yapıttır; Crabbox boş olmayan bir
`visual-task.mp4` kaydetmezse görsel sürücü başarılı olsa bile görev başarısız olur. Mantis,
görev zaten başarılı olmadıkça ve `--keep-lease` ayarlanmamışsa,
hata durumunda kiralamayı VNC için korur.

### Kimlik bilgisi havuzu sağlık denetimi

Havuzdaki canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex aracı ortam değişkenlerini (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`) denetler, uç nokta ayarlarını doğrular,
`OPENCLAW_QA_CONVEX_SECRET_CI` ve
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` için yalnızca ayarlı/eksik durumunu bildirir ve
bakımcı gizli anahtarı mevcut olduğunda yönetici/liste erişilebilirliğini
doğrular.

## Kanonik senaryo kapsamı

Kök `taxonomy.yaml`, anlamsal kapsam kimliklerini tanımlar.
`qa/scenarios/` altındaki senaryo YAML dosyaları her senaryoyu bu kimliklerle eşler ve yürütme
meta verilerini yönetir: `channel` tek kanal gereksinimidir ve `profiles`
adlandırılmış çalıştırma üyeliğini bildirir. Kanal sürücüsü, çalıştırma düzeyinde
birbiriyle değiştirilebilir bir uygulama tercihidir. TypeScript
çalıştırıcıları bu kataloğu sorgular; paralel senaryo veya kapsam
envanterleri tutmazlar.

Statik `qa coverage` çıktısı, taksonomiden senaryoya eşlemeyi bildirir. Gerçek
kanıt, yürütülen senaryoyu, kapsam kimliklerini, kanalı, gerçekten kullanılan sürücüyü
ve sonucu kaydeden `qa-evidence.json` üzerinden gelir. Kanal ve sürücü,
ek kapsam kimliği sözlükleri veya senaryo
uygunluk eksenleri değil, rapor boyutlarıdır.

Docker'ı QA yoluna dahil etmeden tek kullanımlık bir Linux VM hattı çalıştırmak için:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu komut yeni bir Multipass konuğu başlatır, bağımlılıkları kurar, OpenClaw'ı
konuk içinde derler, `qa suite` çalıştırır, ardından normal QA raporunu ve
özetini ana makinedeki `.artifacts/qa-e2e/...` içine geri kopyalar. Ana makinedeki
`qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır.

Ana makine ve Multipass paket çalıştırmaları, seçilen birden fazla senaryoyu
varsayılan olarak yalıtılmış gateway çalışanlarıyla paralel yürütür. `qa-channel`,
seçilen senaryo sayısıyla sınırlı olmak üzere varsayılan olarak 4 eşzamanlılık kullanır.
Çalışan sayısını ayarlamak için `--concurrency
<count>`, seri yürütme için ise `--concurrency 1` kullanın.
Kişisel asistan kıyaslama paketini (10 senaryo) çalıştırmak için `--pack personal-agent` kullanın.
Paket seçici, yinelenen `--scenario` bayraklarıyla eklemeli çalışır:
önce açıkça belirtilen senaryolar, ardından yinelenenler kaldırılarak paket senaryoları
paket sırasıyla çalıştırılır. Özel bir QA çalıştırıcısı OpenTelemetry toplayıcı
kurulumunu zaten sağlıyorsa `otel-trace-smoke` ve `docker-prometheus-smoke` senaryolarını
birlikte seçmek için `--pack observability` kullanın.

Herhangi bir senaryo başarısız olduğunda komut sıfırdan farklı bir kodla çıkar.
Başarısız bir çıkış kodu olmadan yapıtları almak istediğinizde `--allow-failures`
kullanın.

Canlı çalıştırmalar, konuk için uygulanabilir olan desteklenen QA kimlik doğrulama
girdilerini iletir: ortam değişkeni tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı
yapılandırma yolu ve mevcutsa `CODEX_HOME`. Konuğun bağlı çalışma alanı üzerinden
geri yazabilmesi için `--output-dir` dosyasını depo kökü altında tutun.

## Discord, Slack, Telegram ve WhatsApp QA başvurusu

Matrix bağdaştırıcısı, yukarıda belgelenen tek kullanımlık Docker destekli hattı kullanır.
Discord, Slack, Telegram ve WhatsApp önceden mevcut gerçek
aktarımlarla çalıştığından bunların başvurusu burada yer alır.

### Paylaşılan CLI bayrakları

Bu hatlar
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` üzerinden kaydolur ve
aynı bayrakları kabul eder:

| Bayrak                                  | Varsayılan                                            | Açıklama                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Yalnızca bu senaryoyu çalıştırır. Yinelenebilir.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Raporların, özetlerin, kanıtların, aktarıma özgü yapıtların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` temel alınarak çözümlenir. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Tarafsız bir çalışma dizininden çağırırken depo kökü.                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA gateway yapılandırmasındaki geçici hesap kimliği.                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`, `aimock` veya `live-frontier`.                                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | sağlayıcı varsayılanı                                   | Birincil/alternatif model başvuruları.                                                                                                                   |
| `--fast`                              | kapalı                                                | Desteklendiği yerlerde sağlayıcı hızlı modu.                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | Bkz. [Convex kimlik bilgisi havuzu](#convex-credential-pool).                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI'da `ci`, aksi durumda `maintainer`                 | `--credential-source convex` olduğunda kullanılan rol.                                                                                                    |
| `--allow-failures`                    | kapalı                                                | Senaryolar başarısız olduğunda başarısız bir çıkış kodu döndürmeden yapıtları yazar.                                                                      |

Her hat, herhangi bir senaryo başarısız olduğunda sıfırdan farklı bir kodla çıkar.
`--allow-failures`, başarısız bir çıkış kodu ayarlamadan yapıtları yazar.
Telegram ayrıca kullanılabilir senaryo kimliklerini yazdırıp çıkmak için
`--list-scenarios` seçeneğini kabul eder; diğer hatlar bu bayrağı sunmaz.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

İki farklı botun (sürücü + SUT) bulunduğu gerçek bir özel Telegram grubunu hedefler.
SUT botunun bir Telegram kullanıcı adı olmalıdır; botlar arası gözlem,
her iki botta da `@BotFather` içinde **Bot-to-Bot Communication Mode**
etkinleştirildiğinde en iyi şekilde çalışır.

`--credential-source env` olduğunda gerekli ortam değişkenleri:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - sayısal sohbet kimliği (dize).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

`release` profili, bakımı yapılan Telegram YAML senaryolarını seçer;
`all` isteğe bağlı oturum, kullanım, yanıt zinciri ve akış stres
denetimlerini ekler. Açıkça belirtilen `--scenario` değerleri profilin
yerine geçer.

- `channel-canary`
- `channel-mention-gating`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

`release` profili her zaman canary, bahsetme geçitleme, yerel komut
yanıtları, komut adresleme ve botlar arası grup yanıtlarını kapsar. `mock-openai`
ayrıca deterministik uzun nihai önizleme denetimini içerir.
`telegram-current-session-status-tool` ve
`telegram-tool-only-usage-footer` isteğe bağlı kalır: ilki yalnızca
canary'den hemen sonra zincirlendiğinde kararlıdır; ikincisi ise yalnızca araç yanıtlarındaki
`/usage` alt bilgisinin gerçek Telegram kanıtıdır. Geçerli
varsayılan/isteğe bağlı ayrımını regresyon referanslarıyla yazdırmak için `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` kullanın. Her
Telegram canlı bağdaştırıcı senaryosu için `--profile all` kullanın.

Çıktı yapıtları:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - profil, kapsam, sağlayıcı, kanal, yapıtlar, sonuç ve RTT
  alanları dahil olmak üzere canlı aktarım denetimlerine ait kanıt girdileri.

Paket Telegram çalıştırmaları aynı Telegram kimlik bilgisi sözleşmesini kullanır. Tekrarlanan RTT
ölçümü, normal paket Telegram canlı hattının bir parçasıdır; RTT
dağılımı, seçilen RTT denetimi için `result.timing` altında `qa-evidence.json` içine
katlanır.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlandığında paket canlı sarmalayıcısı
bir `kind: "telegram"` kimlik bilgisini kiralar, kiralanan grup/sürücü/SUT
bot ortamını yüklü paket çalıştırmasına aktarır, kiralamaya Heartbeat gönderir ve kapanışta
serbest bırakır. Paket sarmalayıcısı varsayılan olarak
`channel-canary` için 20 RTT denetimi, 30s RTT zaman aşımı ve Convex seçildiğinde
CI dışında Convex rolü `maintainer` kullanır. Ayrı bir RTT komutu
veya Telegram'a özgü özet biçimi oluşturmadan RTT ölçümünü ayarlamak için
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
ya da `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` değerini geçersiz kılın.

### Discord QA

```bash
pnpm openclaw qa discord
```

İki bot içeren gerçek bir özel Discord lonca kanalını hedefler: test düzeneği
tarafından denetlenen bir sürücü botu ve paketlenmiş Discord Plugin'i üzerinden
alt OpenClaw gateway'i tarafından başlatılan bir SUT botu. Kanal bahsetme işlemesini,
SUT botunun yerel `/help` komutunu Discord'a kaydettiğini ve
isteğe bağlı Mantis kanıt senaryolarını doğrular.

`--credential-source env` olduğunda gerekli ortam:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord tarafından döndürülen SUT bot kullanıcı kimliğiyle eşleşmelidir
  (aksi takdirde hat hızla başarısız olur).

İsteğe bağlı:

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID`, `discord-voice-autojoin` için ses/sahne kanalını seçer;
  bu olmadan senaryo, SUT botunun görebildiği ilk
  ses/sahne kanalını seçer.

Discord YAML modülü senaryoları (`qa/scenarios/channels/discord-*.yaml`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - isteğe bağlı ses senaryosu. Tek başına çalışır,
  `channels.discord.voice.autoJoin` özelliğini etkinleştirir ve SUT botunun geçerli
  Discord ses durumunun hedef ses/sahne kanalı olduğunu doğrular. Convex Discord
  kimlik bilgileri isteğe bağlı `voiceChannelId` içerebilir; aksi takdirde çalıştırıcı
  bağdaştırıcısı loncadaki ilk görünür ses/sahne kanalını keşfeder.
- `discord-status-reactions-tool-only` - isteğe bağlı Mantis senaryosu. SUT'yi
  `messages.statusReactions.enabled=true` ile her zaman açık, yalnızca araç içeren lonca yanıtlarına
  geçirdiğinden tek başına çalışır; ardından bir REST
  tepki zaman çizelgesinin yanı sıra HTML/PNG görsel yapıtlarını yakalar. Mantis öncesi/sonrası
  raporları ayrıca senaryo tarafından sağlanan MP4 yapıtlarını `baseline.mp4`
  ve `candidate.mp4` olarak korur.
- `discord-thread-reply-filepath-attachment` - isteğe bağlı Mantis senaryosu; bkz.
  [Discord Mantis senaryoları](#discord-mantis-scenarios).

Discord ses kanalına otomatik katılım senaryosunu açıkça çalıştırın:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Mantis durum-tepki senaryosunu açıkça çalıştırın:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

Çıktı yapıtları:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - canlı aktarım denetimlerine ait kanıt girdileri.
- `discord-qa-reaction-timelines.json` ve durum-tepki
  senaryosu çalıştığında `discord-status-reactions-tool-only-timeline.png`.

### Slack QA

```bash
pnpm openclaw qa slack
```

İki ayrı bot içeren gerçek bir özel Slack kanalını hedefler: test düzeneği
tarafından denetlenen bir sürücü botu ve paketlenmiş Slack Plugin'i üzerinden
alt OpenClaw gateway'i tarafından başlatılan bir SUT botu.

`--credential-source env` olduğunda gerekli ortam:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

İsteğe bağlı:

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`, Mantis için görsel onay
  denetim noktalarını etkinleştirir. Bağdaştırıcı `<scenario>.pending.json` ve
  `<scenario>.resolved.json` dosyalarını yazar, ardından eşleşen `.ack.json` dosyalarını bekler.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS`, denetim noktası
  onay zaman aşımını geçersiz kılar. Varsayılan değer `120000` şeklindedir.

Slack canlı bağdaştırıcısı aracılığıyla sunulan kurallı YAML senaryoları:

- `thread-follow-up`
- `thread-isolation`

Slack YAML modülü senaryoları (`qa/scenarios/channels/slack-*.yaml`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - yapılandırılmış devre dışı bir kanalın yanıt vermeden
  yapılandırılmış bir uyarı yayımladığını doğrulayan isteğe bağlı gerçek Slack araştırması.
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted` ve
  `slack-progress-commentary-verbose-dedupe` - bağımsız yorum/araç ilerleme denetimleri,
  atlanan anahtarın eski varsayılanı ve kalıcı ayrıntılı ilerleme açıkken tek teslim davranışı için
  isteğe bağlı gerçek Slack araştırmaları.
- `slack-reaction-glyph-native` - isteğe bağlı canlı mesaj aracı tepki senaryosu.
  Ajana tam `✅` glifini iletmesini bildirir ve Slack'in hedef mesajda
  SUT botu için `white_check_mark` değerini sakladığını doğrular.
- `slack-chart-presentation-native` - yerel `data_visualization` bloğunu ve tam erişilebilir metni
  doğrulayan isteğe bağlı taşınabilir grafik senaryosu.
- `slack-table-presentation-native` - yerel `data_table` bloğunu, tam satırları ve erişilebilir metni
  doğrulayan isteğe bağlı taşınabilir tablo senaryosu.
- `slack-table-invalid-blocks-fallback` - üretim Slack gönderim yolu üzerinden
  yapısal olarak okunabilir, sınırı aşan, 101 veri satırı
  ve başlığını içeren ham bir tablo gönderen; Slack'in bizzat `invalid_blocks`
  döndürdüğünü kanıtlayan ve saklanan biçimlendirme devre dışı geri dönüşünün eksiksiz olduğunu ve
  yerel veri bloğu içermediğini doğrulayan isteğe bağlı doğrudan aktarım senaryosu.
  Senaryo ayrıntıları yalnızca güvenli hata kodu, sayı ve
  Boole kanıtlarını tutar.
- `slack-approval-exec-native` - isteğe bağlı yerel Slack exec onay senaryosu.
  Gateway üzerinden exec onayı ister, Slack mesajında
  yerel onay düğmeleri bulunduğunu doğrular, onayı çözümler ve çözümlenmiş Slack
  güncellemesini doğrular.
- `slack-approval-plugin-native` - isteğe bağlı yerel Slack Plugin onay
  senaryosu. Plugin olaylarının exec onay yönlendirmesi tarafından engellenmemesi için exec
  ve Plugin onayı iletmeyi birlikte etkinleştirir, ardından aynı
  bekleyen/çözümlenmiş yerel Slack kullanıcı arayüzü yolunu doğrular.
- `slack-codex-approval-exec-native` - isteğe bağlı Codex Guardian komut onayı
  senaryosu. Codex Plugin'ini Guardian modunda etkinleştirir, Slack kaynaklı bir
  Gateway ajan turunu Codex uygulama sunucusu test düzeneği üzerinden yönlendirir,
  `openclaw-codex-app-server` için yerel Slack Plugin onay istemini bekler,
  onayı çözümler ve Codex turunun beklenen komut çıktısı ve asistan işaretçileriyle
  tamamlandığını doğrular.
- `slack-codex-approval-plugin-native` - isteğe bağlı Codex Guardian dosya onayı
  senaryosu. Codex'in uygulama sunucusu dosya değişikliği onay yolunu yayması için
  çalışma alanı dışındaki bir `apply_patch` talimatını kullanır, ardından aynı yerel
  Slack bekleyen/çözümlenmiş onay yolunu, nihai asistan işaretçisini ve temizleme öncesindeki
  tam dosya içeriğini doğrular.

Codex onay senaryoları bir `openai/*` veya `codex/*` `--model`,
normal canlı model kimlik bilgileri ve Codex Plugin'i tarafından kabul edilen Codex kimlik doğrulaması ya da API anahtarı kimlik doğrulaması gerektirir.
Senaryo ayrıntıları, gizlenmiş Slack onay meta verilerinin yanı sıra Codex uygulama sunucusu yöntemini,
seçilen Codex model anahtarını, nihai Codex tur durumunu ve işlem işaretçisi doğrulamasını içerir.

Çıktı yapıtları:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - canlı aktarım denetimlerine ait kanıt girdileri.
- `approval-checkpoints/` - yalnızca Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` ayarını yaptığında; denetim noktası JSON'unu,
  onay JSON'unu ve bekleyen/çözümlenmiş ekran görüntülerini içerir.

#### Slack çalışma alanını ayarlama

Hat, tek bir çalışma alanında iki ayrı Slack uygulamasına ve her iki
botun da üye olduğu bir kanala ihtiyaç duyar:

- `channelId` - her iki botun da davet edildiği bir kanalın `Cxxxxxxxxxx` kimliği.
  Özel bir kanal kullanın; hat her çalıştırmada gönderi yapar.
- `driverBotToken` - **Sürücü** uygulamasının bot belirteci (`xoxb-...`).
- `sutBotToken` - **SUT** uygulamasının bot belirteci (`xoxb-...`); bot kullanıcı kimliğinin
  farklı olması için sürücüden ayrı bir Slack uygulaması olmalıdır.
- `sutAppToken` - SUT uygulamasının `connections:write` içeren
  uygulama düzeyi belirteci (`xapp-...`); SUT uygulamasının olayları alabilmesi için Socket Mode tarafından kullanılır.

Üretim çalışma alanını yeniden kullanmak yerine QA'ya ayrılmış bir Slack
çalışma alanını tercih edin.

Aşağıdaki SUT manifesti, paketlenmiş Slack Plugin'inin
üretim kurulumunu (`extensions/slack/src/setup-shared.ts:12`) kasıtlı olarak canlı Slack QA paketi tarafından kapsanan
izin ve olaylarla sınırlar. Kullanıcıların gördüğü üretim kanalı kurulumu için
[Slack kanalı hızlı kurulumu](/tr/channels/slack#quick-setup) bölümüne bakın; hat aynı çalışma alanında
iki ayrı bot kullanıcı kimliğine ihtiyaç duyduğundan QA Sürücü/SUT çifti
kasıtlı olarak ayrıdır.

**1. Sürücü uygulamasını oluşturun**

[api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ yoluna gidin → QA çalışma alanını seçin, aşağıdaki manifesti yapıştırın,
ardından _Install to Workspace_ öğesini seçin:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "OpenClaw QA Slack canlı hattı için test sürücüsü botu"
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

_Bot User OAuth Token_ değerini (`xoxb-...`) kopyalayın; bu,
`driverBotToken` olur. Sürücünün yalnızca mesaj göndermesi ve kendisini
tanımlaması gerekir; olaylar ve Socket Mode gerekmez.

**2. SUT uygulamasını oluşturun**

Aynı çalışma alanında _Create New App → From a manifest_ adımlarını tekrarlayın. Bu QA uygulaması,
paketlenmiş Slack Plugin'inin üretim manifestinin (`extensions/slack/src/setup-shared.ts:12`) kasıtlı olarak daha dar bir
sürümünü kullanır: canlı Slack QA paketi tepki işlemeyi henüz kapsamadığından
tepki kapsamları ve olayları dahil edilmez.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw için OpenClaw QA SUT bağlayıcısı"
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

- _Install to Workspace_ → _Bot User OAuth Token_ değerini kopyalayın → bu,
  `sutBotToken` olur.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 
  `connections:write` kapsamını ekleyin → kaydedin → `xapp-...` değerini kopyalayın → bu,
  `sutAppToken` olur.

Her bir token üzerinde `auth.test` çağrısı yaparak iki botun farklı kullanıcı kimliklerine sahip olduğunu doğrulayın. Çalışma zamanı, sürücü ile SUT'yi kullanıcı kimliğine göre ayırt eder; aynı uygulamanın
ikisi için de yeniden kullanılması, bahsetme geçidinin hemen başarısız olmasına neden olur.

**3. Kanalı oluşturun**

QA çalışma alanında bir kanal (ör. `#openclaw-qa`) oluşturun ve kanalın içinden her iki
botu da davet edin:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

`Cxxxxxxxxxx` kimliğini _channel info → About → Channel ID_ bölümünden kopyalayın; bu,
`channelId` olur. Herkese açık bir kanal kullanılabilir; özel bir kanal kullanırsanız
her iki uygulama da zaten `groups:history` kapsamına sahip olduğundan düzeneğin geçmiş okumaları
yine başarılı olur.

**4. Kimlik bilgilerini kaydedin**

İki seçenek vardır. Tek makineli hata ayıklama için ortam değişkenlerini kullanın (dört
`OPENCLAW_QA_SLACK_*` değişkenini ayarlayıp `--credential-source env` iletin) veya
CI'ın ve diğer bakımcıların kiralayabilmesi için paylaşılan Convex havuzunu başlangıç verileriyle doldurun.

Convex havuzu için dört alanı bir JSON dosyasına yazın:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Kabuğunuzda `OPENCLAW_QA_CONVEX_SITE_URL` ve `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
dışa aktarılmış durumdayken kaydedip doğrulayın:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack havuzu başlangıç verisi"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`, `status: "active"` bekleyin; `lease` alanı bulunmamalıdır.

**5. Uçtan uca doğrulayın**

Her iki botun aracı üzerinden birbirleriyle iletişim kurabildiğini doğrulamak için hattı yerel olarak
çalıştırın:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Başarılı bir çalıştırma 30 saniyeden çok daha kısa sürede tamamlanır ve `qa-suite-report.md`,
hem `slack-canary` hem de `slack-mention-gating` için `pass` durumunu gösterir. Hat
~90 saniye boyunca takılı kalıp `Convex credential pool exhausted
for kind "slack"` ile çıkarsa havuz ya boştur ya da tüm satırlar kiralanmıştır; hangisi olduğunu `qa
credentials list --kind slack --status all --json` bildirir.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

İki özel WhatsApp Web hesabını hedefler: düzenek tarafından denetlenen bir sürücü hesabı
ve paketle gelen WhatsApp plugin'i üzerinden alt OpenClaw gateway'i tarafından başlatılan
bir SUT hesabı.

`--credential-source env` durumunda gerekli ortam değişkenleri:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

İsteğe bağlı:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID`; `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, grup eylemi/medya/anket senaryoları
  ve `whatsapp-group-allowlist-block` gibi grup senaryolarını etkinleştirir.

WhatsApp YAML senaryoları (`qa/scenarios/channels/whatsapp-*.yaml`):

- Temel davranış ve grup geçidi: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Yerel komutlar: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Yanıt ve nihai çıktı davranışı: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Kullanıcı yolu mesaj eylemleri: `whatsapp-agent-message-action-react`, gerçek bir sürücü DM'sinden
  başlar, modelin `message` aracını çağırmasına izin verir ve
  yerel WhatsApp tepkisini gözlemler. `whatsapp-agent-message-action-upload-file`,
  `message(action=upload-file)` için aynı yaklaşımı kullanır ve yerel
  WhatsApp medyasını gözlemler. `whatsapp-group-agent-message-action-react` ve
  `whatsapp-group-agent-message-action-upload-file`, gerçek bir WhatsApp grubunda aynı
  kullanıcıya görünür eylemleri kanıtlar.
- Grup yayılımı: `whatsapp-broadcast-group-fanout`, bahsetme içeren tek bir
  WhatsApp grup mesajından başlar ve `main`
  ile `qa-second` tarafından verilen birbirinden farklı görünür yanıtları doğrular.
- Grup etkinleştirme: `whatsapp-group-activation-always`, gerçek bir grup
  oturumunu `/activation always` olarak değiştirir, bahsetme içermeyen bir grup mesajının
  agent'ı uyandırdığını kanıtlar ve ardından `/activation mention` değerini geri yükler.
  `whatsapp-group-reply-to-bot-triggers`, başlangıç verisi olarak bir bot yanıtı ekler, açık bir bahsetme olmadan
  bu yanıta yerel bir alıntılı yanıt gönderir ve agent'ın
  bu yanıt bağlamıyla uyandığını doğrular.
- Gelen medya ve yapılandırılmış mesajlar: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Bunlar sürücü üzerinden gerçek WhatsApp görsel, ses, belge, konum, kişi,
  çıkartma ve tepki olayları gönderir.
- Doğrudan Gateway sözleşmesi yoklamaları: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Bunlar model istemini bilinçli olarak atlar
  ve belirlenimci Gateway/kanal `send`, `poll` ve
  `message.action` sözleşmelerini kanıtlar.
- Erişim denetimi kapsamı: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Yerel onaylar: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Durum tepkileri: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Katalog şu anda 52 senaryo içerir. Hızlı duman kapsamı için `live-frontier` varsayılan hattı
8 senaryoyla küçük tutulur. `mock-openai`
varsayılan hattı, yalnızca model çıktısını taklit ederek gerçek WhatsApp
taşıması üzerinden 39 senaryoyu belirlenimci biçimde çalıştırır; onay senaryoları ve birkaç
daha ağır/engelleyici kontrol, senaryo kimliğiyle açıkça belirtilmeye devam eder.

WhatsApp QA sürücüsü yapılandırılmış canlı olayları (`text`, `media`,
`location`, `reaction` ve `poll`) gözlemler ve etkin biçimde medya, anket,
kişi, konum ve çıkartma gönderebilir. QA Lab, özel
WhatsApp çalışma zamanı dosyalarına erişmek yerine bu sürücüyü
`@openclaw/whatsapp/api.js` paket yüzeyi üzerinden içe aktarır. Grup gözlemlerinde `fromJid` grup JID'sidir;
`participantJid` ve `fromPhoneE164` ise katılımcı göndericiyi tanımlar.
Mesaj içeriği varsayılan olarak sansürlenir. Doğrudan Gateway anketi, dosya yükleme,
medya, grup anketi, grup medyası ve yanıt biçimi yoklamaları taşıma/API
sözleşmesi kontrolleridir; bir kullanıcı isteminin agent'ın aynı eylemi
seçmesini sağladığının kanıtı sayılmazlar. Kullanıcı yolu eylem kanıtı,
`whatsapp-agent-message-action-react` ve
`whatsapp-group-agent-message-action-react` gibi senaryolardan gelir; bu senaryolarda sürücü normal bir
WhatsApp mesajı gönderir ve QA Lab, bunun sonucunda oluşan yerel WhatsApp eserini gözlemler.
WhatsApp senaryo ayrıntıları, her senaryonun yaklaşımını (`user-path`,
`direct-gateway` veya `native-approval`) içerir; böylece kanıtın gerçekte kanıtladığından
daha güçlü bir sözleşme olduğu sanılamaz.

Çıktı eserleri:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - canlı taşıma kontrollerinin kanıt girdileri.

### Convex kimlik bilgisi havuzu

Discord, Slack, Telegram ve WhatsApp hatları, yukarıdaki ortam değişkenlerini okumak yerine
paylaşılan bir Convex havuzundan kimlik bilgileri kiralayabilir. `--credential-source convex` iletin
(veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın);
QA Lab özel bir kiralama alır, çalıştırma süresince bunun Heartbeat'ini gönderir
ve kapanırken serbest bırakır. Havuz türleri `"discord"`, `"slack"`,
`"telegram"` ve `"whatsapp"` şeklindedir.

Aracının `admin/add` üzerinde doğruladığı yük biçimleri:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` sayısal bir sohbet kimliği dizesi olmalıdır.
- Gerçek Telegram kullanıcısı (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  yalnızca Mantis Telegram Desktop kanıtı içindir. Genel QA Lab hatları bu
  türü almamalıdır.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - telefon numaraları birbirinden farklı E.164 dizeleri olmalıdır.

Mantis Telegram Desktop kanıt iş akışı, hem TDLib CLI sürücüsü hem de Telegram Desktop
tanığı için tek bir özel Convex `telegram-user` kiralamasını tutar ve kanıtı
yayımladıktan sonra serbest bırakır.

Bir PR'ın belirlenimci bir görsel farka ihtiyacı olduğunda Mantis, Telegram biçimlendiricisi veya
teslim katmanı değişirken `main` üzerinde ve PR başında aynı taklit
model yanıtını kullanabilir. Yakalama varsayılanları PR yorumları için ayarlanmıştır: standart
Crabbox sınıfı, 24fps masaüstü kaydı, 24fps hareketli GIF ve 1920px önizleme
genişliği. Önce/sonra yorumları, yalnızca amaçlanan GIF'leri içeren
temiz bir paket yayımlamalıdır.

Slack hatları da havuzu kullanabilir. Slack yük biçimi kontrolleri şu anda
aracı yerine Slack QA çalıştırıcısında bulunur; `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }` değerini,
`Cxxxxxxxxxx` gibi bir Slack kanal kimliğiyle kullanın. Uygulama
ve kapsam hazırlığı için [Slack çalışma alanını ayarlama](#setting-up-the-slack-workspace) bölümüne bakın.

Operasyonel ortam değişkenleri ve Convex aracı uç noktası sözleşmesi
[Test → Convex üzerinden paylaşılan Telegram kimlik bilgileri](/tr/help/testing#shared-telegram-credentials-via-convex-v1)
bölümünde bulunur (bölümün adı çok kanallı havuzdan öncesine aittir; kiralama anlamları
türler arasında ortaktır).

## Depo destekli başlangıç verileri

Başlangıç varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

QA planının hem insanlar hem de agent tarafından görülebilmesi için bunlar kasıtlı olarak git'te tutulur.

`qa-lab` genel amaçlı bir YAML senaryo çalıştırıcısı olarak kalır. Her senaryo YAML dosyası,
tek bir test çalıştırmasının doğruluk kaynağıdır ve şunları tanımlamalıdır:

- üst düzey `title`
- `scenario` meta verileri
- `scenario` içinde isteğe bağlı kategori, yetenek, hat ve risk meta verileri
- `scenario` içinde belge ve kod referansları
- `scenario` içinde isteğe bağlı plugin gereksinimleri
- `scenario` içinde isteğe bağlı gateway yapılandırma yaması
- akış senaryoları için çalıştırılabilir üst düzey `flow` veya
  Vitest ve Playwright senaryoları için `scenario.execution.kind` / `scenario.execution.path`

`flow` altyapısını oluşturan yeniden kullanılabilir çalışma zamanı yüzeyi genel ve
birden fazla alanı kapsayan yapısını korur. Örneğin YAML senaryoları, özel durum
çalıştırıcısı eklemeden gömülü Denetim Arayüzünü Gateway `browser.request` bağlantı
noktası üzerinden yöneten tarayıcı tarafı yardımcılarını aktarım tarafı
yardımcılarıyla birleştirebilir.

Senaryo dosyaları, kaynak ağacı klasörü yerine ürün yeteneğine göre
gruplandırılmalıdır. Dosyalar taşındığında senaryo kimliklerini sabit tutun;
uygulama izlenebilirliği için `docsRefs` ve `codeRefs` kullanın.

Temel liste aşağıdakileri kapsayacak kadar geniş tutulmalıdır:

- DM ve kanal sohbeti
- ileti dizisi davranışı
- mesaj eylemi yaşam döngüsü
- Cron geri çağrıları
- bellekten geri çağırma
- model değiştirme
- alt ajan devri
- depo ve dokümantasyon okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı taklit hatları

`qa suite` iki yerel sağlayıcı taklit hattına sahiptir:

- `mock-openai`, senaryoya duyarlı OpenClaw taklididir. Depo destekli kalite güvencesi ve eşlik denetimleri için varsayılan
  belirlenimci taklit hattı olmayı sürdürür.
- `aimock`; deneysel protokol, fikstür, kaydetme/yeniden oynatma
  ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Ek niteliktedir ve
  `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında bulunur.
Her sağlayıcı kendi varsayılanlarının, yerel sunucu başlatmasının, Gateway model yapılandırmasının,
kimlik doğrulama profili hazırlama gereksinimlerinin ve canlı/taklit yetenek bayraklarının sahibidir. Paylaşılan paket ve
Gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirme yapar.

## Aktarım bağdaştırıcıları

`qa-lab`, YAML kalite güvencesi senaryoları için genel bir aktarım bağlantı noktasının sahibidir. `qa-channel`
yapay varsayılandır. `crabline`, yerel sağlayıcı biçimli sunucuları başlatır ve
OpenClaw'ın normal kanal pluginlerini bunlara karşı çalıştırır. `live`, gerçek
sağlayıcı kimlik bilgileri ve harici kanallar için ayrılmıştır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`; genel senaryo yürütmenin, çalışan eşzamanlılığının, yapıt
  yazımının ve raporlamanın sahibidir.
- Aktarım bağdaştırıcısı; Gateway yapılandırmasının, hazır olma durumunun, gelen ve giden
  gözlemin, aktarım eylemlerinin ve normalleştirilmiş aktarım durumunun sahibidir.
- `qa/scenarios/` altındaki YAML senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab`
  bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

### Kanal ekleme

YAML kalite güvencesi sistemine kanal eklemek için kanal uygulamasının yanı sıra
kanal sözleşmesini kullanan bir senaryo paketi gerekir. Duman testi CI
kapsamı için eşleşen Crabline yerel sağlayıcı sunucusunu ekleyin ve bunu
`crabline` sürücüsü üzerinden kullanıma sunun.

Paylaşılan `qa-lab` ana bilgisayarı akışın sahibi olabiliyorsa yeni bir üst düzey kalite güvencesi komut
kökü eklemeyin.

`qa-lab`, paylaşılan ana bilgisayar mekaniklerinin sahibidir:

- `openclaw qa` komut kökü
- paket başlatma ve kapatma
- çalışan eşzamanlılığı
- yapıt yazımı
- rapor oluşturma
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı pluginleri aktarım sözleşmesinin sahibidir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökünün altına nasıl bağlandığı
- Gateway'in bu aktarım için nasıl yapılandırıldığı
- hazır olma durumunun nasıl denetlendiği
- gelen olayların nasıl eklendiği
- giden mesajların nasıl gözlemlendiği
- dökümlerin ve normalleştirilmiş aktarım durumunun nasıl kullanıma sunulduğu
- aktarım destekli eylemlerin nasıl yürütüldüğü
- aktarıma özgü sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir kanal için asgari benimseme eşiği:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab` öğesini koruyun.
2. Aktarım çalıştırıcısını paylaşılan `qa-lab` ana bilgisayar bağlantı noktasında uygulayın.
3. Aktarıma özgü mekanikleri çalıştırıcı plugini veya kanal
   test düzeneği içinde tutun.
4. Çalıştırıcıyı rakip bir kök komut kaydetmek yerine
   `openclaw qa <runner>` olarak bağlayın. Çalıştırıcı pluginleri
   `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve
   `runtime-api.ts` üzerinden eşleşen bir `qaRunnerCliRegistrations`
   dizisi dışa aktarmalıdır. `runtime-api.ts` öğesini hafif tutun; gecikmeli CLI ve
   çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır. İsteğe bağlı
   `adapterFactory`, komutun mevcut senaryo kataloğunu değiştirmeden
   aktarımı paylaşılan senaryolara açar.
5. Temalı `qa/scenarios/` dizinleri altında YAML senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo kasıtlı bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı kesindir:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa bunu `qa-lab` içine koyun.
- Davranış tek bir kanal aktarımına bağlıysa bunu ilgili çalıştırıcı
  plugini veya plugin test düzeneği içinde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yetenek gerektiriyorsa
  `suite.ts` içinde kanala özgü bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir aktarım için anlamlıysa senaryoyu
  aktarıma özgü tutun ve bunu senaryo sözleşmesinde açıkça belirtin.

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

Uyumluluk takma adları mevcut senaryolar için kullanılabilir olmaya devam eder:
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus`; ancak yeni senaryo yazımında
genel adlar kullanılmalıdır. Takma adlar gelecekteki model olarak değil,
tek seferde toplu geçişi önlemek için vardır.

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu soruları yanıtlamalıdır:

- Neler çalıştı
- Neler başarısız oldu
- Neler engellenmiş durumda kaldı
- Hangi takip senaryoları eklenmeye değer

Takip çalışmasının boyutunu belirlerken veya yeni bir aktarım bağlarken yararlı olan
mevcut senaryoların envanteri için `pnpm openclaw qa coverage` komutunu çalıştırın (makine tarafından
okunabilir çıktı için `--json` ekleyin). Değiştirilen bir davranış veya
dosya yolu için odaklı kanıt seçerken `pnpm openclaw qa coverage --match <query>` komutunu çalıştırın.
Eşleştirme raporu; senaryo meta verilerinde, dokümantasyon başvurularında, kod başvurularında, kapsam kimliklerinde,
pluginlerde ve sağlayıcı gereksinimlerinde arama yapar, ardından eşleşen `qa suite
--scenario ...` hedeflerini yazdırır.

Her `qa suite` çalıştırması, seçilen senaryo kümesi için üst düzey
`qa-evidence.json`, `qa-suite-summary.json` ve `qa-suite-report.md`
yapıtlarını yazar. `execution.kind: vitest` veya
`execution.kind: playwright` bildiren senaryolar eşleşen test yolunu çalıştırır ve ayrıca
senaryo başına günlükler yazar. `execution.kind: script` bildiren senaryolar,
`node --import tsx` aracılığıyla `execution.path` konumundaki kanıt üreticisini çalıştırır
(`${outputDir}` ve `${scenarioId}`, `execution.args` içinde genişletilir);
üretici kendi `qa-evidence.json` öğesini yazar, bunun girdileri paket çıktısına
içe aktarılır ve yapıt yolları ilgili üreticinin `qa-evidence.json` öğesine göre
çözümlenir. `qa suite` öğesine `qa run
--qa-profile` üzerinden ulaşıldığında aynı
`qa-evidence.json`, seçilen sınıflandırma kategorilerinin profil
puan kartı özetini de içerir.

Kapsam çıktısını bir denetim kapısının yerine değil, keşif yardımcısı olarak değerlendirin;
seçilen senaryonun test edilen davranış için yine de doğru sağlayıcı moduna, canlı aktarıma,
Multipass, Testbox veya sürüm hattına ihtiyacı vardır. Puan kartı bağlamı için
[Olgunluk puan kartı](/tr/maturity/scorecard) sayfasına bakın.

Karakter ve üslup denetimleri için aynı senaryoyu birden fazla canlı
model başvurusunda çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Komut Docker'ı değil, yerel kalite güvencesi Gateway alt süreçlerini çalıştırır. Karakter
değerlendirme senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet,
çalışma alanı yardımı ve küçük dosya görevleri gibi sıradan kullanıcı etkileşimlerini çalıştırmalıdır. Aday
modele değerlendirildiği söylenmemelidir. Komut her tam dökümü korur,
temel çalıştırma istatistiklerini kaydeder, ardından değerlendirme modellerinden, desteklendiği yerlerde
`xhigh` akıl yürütmesiyle hızlı modda çalıştırmaları doğallık,
hava ve mizaha göre sıralamalarını ister. Sağlayıcıları karşılaştırırken `--blind-judge-models`
kullanın: değerlendirme istemi yine her dökümü ve çalıştırma durumunu alır, ancak
aday başvuruları `candidate-01` gibi tarafsız etiketlerle değiştirilir; rapor,
ayrıştırmadan sonra sıralamaları gerçek başvurularla yeniden eşler.

Aday çalıştırmalarının varsayılan düşünme düzeyi `high`; GPT-5.6 Luna için `medium`,
bunu destekleyen eski OpenAI değerlendirme başvuruları içinse `xhigh` olur. Belirli bir
adayı satır içinde `--model provider/model,thinking=<level>` ile geçersiz kılın; satır içi
seçenekler ayrıca `fast`, `no-fast` ve `fast=<bool>` öğelerini destekler.
`--thinking
<level>` yine genel bir geri dönüş değeri belirler ve eski
`--model-thinking
<provider/model=level>` biçimi uyumluluk amacıyla korunur. OpenAI aday
başvuruları varsayılan olarak hızlı modu kullanır; böylece sağlayıcının desteklediği yerlerde
öncelikli işleme kullanılır. Yalnızca her aday modelde hızlı modu zorunlu kılmak
istediğinizde `--fast` iletin. Aday ve değerlendirici süreleri kıyaslama analizi için
rapora kaydedilir, ancak değerlendirme istemleri açıkça hıza göre sıralama yapılmamasını söyler.
Hem aday hem de değerlendirme modeli çalıştırmalarında varsayılan eşzamanlılık 16'dır.
Sağlayıcı sınırları veya yerel Gateway baskısı çalıştırmayı fazla gürültülü hâle getirdiğinde
`--concurrency` ya da `--judge-concurrency` değerini düşürün.

Hiçbir aday `--model` iletilmediğinde karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve `google/gemini-3.1-pro-preview` öğelerini kullanır. Hiçbir
`--judge-model` iletilmediğinde değerlendiriciler varsayılan olarak
`openai/gpt-5.6-sol,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-8,thinking=high` olur.

## İlgili dokümantasyon

- [Olgunluk puan kartı](/tr/maturity/scorecard)
- [Kişisel ajan kıyaslama paketi](/tr/concepts/personal-agent-benchmark-pack)
- [Kalite Güvencesi Kanalı](/tr/channels/qa-channel)
- [Test](/tr/help/testing)
- [Gösterge Paneli](/tr/web/dashboard)

---
read_when:
    - qa-lab veya qa-channel'ı genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçiliğe sahip QA otomasyonu oluşturma
summary: qa-lab, qa-channel, tohumlanmış senaryolar ve protokol raporları için özel QA otomasyon yapısı
title: QA E2E otomasyonu
x-i18n:
    generated_at: "2026-04-26T11:27:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3803f2bc5cdf2368c3af59b412de8ef732708995a54f7771d3f6f16e8be0592b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Özel QA yığını, OpenClaw'ı tek birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde test etmek için tasarlanmıştır.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve bir Markdown raporu dışa aktarmak için hata ayıklayıcı kullanıcı arayüzü ve QA veri yolu.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için depo destekli seed varlıkları.

Mevcut QA operatör akışı iki panelli bir QA sitesidir:

- Sol: aracıyla birlikte Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Bunu şu komutla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve
QA Lab sayfasını erişilebilir hale getirir; burada bir operatör veya otomasyon döngüsü aracıya bir QA
görevi verebilir, gerçek kanal davranışını gözlemleyebilir ve neyin işe yaradığını,
neyin başarısız olduğunu veya neyin engellenmiş kaldığını kaydedebilir.

Docker imajını her seferinde yeniden oluşturmadan daha hızlı QA Lab kullanıcı arayüzü iterasyonu için,
yığını bind-mount edilmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker hizmetlerini önceden derlenmiş bir imaj üzerinde tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` container'ına bind-mount eder. `qa:lab:watch`
değişiklik olduğunda bu paketi yeniden derler ve QA Lab
varlık hash'i değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

Yerel bir OpenTelemetry iz smoke testi için şunu çalıştırın:

```bash
pnpm qa:otel:smoke
```

Bu betik yerel bir OTLP/HTTP iz alıcısı başlatır, etkinleştirilmiş `diagnostics-otel` Plugin'i ile
`otel-trace-smoke` QA senaryosunu çalıştırır, ardından dışa aktarılan protobuf span'larını
çözümler ve sürüm açısından kritik biçimi doğrular:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` ve `openclaw.message.delivery` mevcut olmalıdır;
başarılı dönüşlerde model çağrıları `StreamAbandoned` dışa aktarmamalıdır; ham tanılama kimlikleri ve
`openclaw.content.*` öznitelikleri iz dışında kalmalıdır. Bu işlem,
QA paket varlıklarının yanına `otel-smoke-summary.json` yazar.

Taşıma açısından gerçek bir Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix
```

Bu hat Docker içinde geçici bir Tuwunel homeserver sağlar, geçici
sürücü, SUT ve gözlemci kullanıcıları kaydeder, bir özel oda oluşturur, ardından
gerçek Matrix Plugin'ini bir QA gateway alt süreci içinde çalıştırır. Canlı taşıma hattı,
alt süreç yapılandırmasını test edilen taşımayla sınırlı tutar; böylece Matrix,
alt süreç yapılandırmasında `qa-channel` olmadan çalışır. Yapılandırılmış rapor varlıklarını ve
birleştirilmiş stdout/stderr günlüğünü seçilen Matrix QA çıktı dizinine yazar. Dış
`scripts/run-node.mjs` derleme/başlatıcı çıktısını da yakalamak için
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` değerini depo içi bir günlük dosyasına ayarlayın.
Matrix ilerlemesi varsayılan olarak yazdırılır. `OPENCLAW_QA_MATRIX_TIMEOUT_MS`
tam çalışmayı sınırlar ve `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` temizliği sınırlar; böylece takılmış bir
Docker kapatma işlemi askıda kalmak yerine tam kurtarma komutunu bildirir.

Taşıma açısından gerçek bir Telegram smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa telegram
```

Bu hat geçici bir sunucu sağlamaktan ziyade tek bir gerçek özel Telegram grubunu hedefler.
`OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir; ayrıca aynı
özel grupta iki farklı bot gerekir. SUT botunun bir Telegram kullanıcı adı olmalıdır ve
botlar arası gözlem, her iki botta da
`@BotFather` içinde Bot-to-Bot Communication Mode etkin olduğunda en iyi şekilde çalışır.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan bir kodla çıkar. Başarısız bir çıkış kodu olmadan
varlıkları istiyorsanız `--allow-failures` kullanın.
Telegram raporu ve özeti, kanaryadan başlayarak sürücü mesajı
gönderim isteğinden gözlemlenen SUT yanıtına kadar yanıt başına RTT'yi içerir.

Havuzlanmış canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex broker env değerlerini kontrol eder, uç nokta ayarlarını doğrular ve
bakımcı sırrı mevcut olduğunda admin/list erişilebilirliğini denetler. Sırlar için yalnızca
ayarlı/eksik durumunu bildirir.

Taşıma açısından gerçek bir Discord smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa discord
```

Bu hat iki botlu tek bir gerçek özel Discord sunucu kanalını hedefler: harness tarafından
kontrol edilen bir sürücü botu ve paketlenmiş Discord Plugin'i aracılığıyla alt OpenClaw gateway tarafından
başlatılan bir SUT botu. Env kimlik bilgileri kullanılırken
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
ve `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` gerektirir.
Hat, kanal mention işleme davranışını doğrular ve SUT botunun
yerel `/help` komutunu Discord'a kaydettiğini kontrol eder.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan bir kodla çıkar. Başarısız bir çıkış kodu olmadan
varlıkları istiyorsanız `--allow-failures` kullanın.

Canlı taşıma hatları artık her birinin kendi senaryo listesi biçimini icat etmesi yerine
tek ve daha küçük bir sözleşmeyi paylaşır:

`qa-channel`, geniş sentetik ürün davranışı paketi olarak kalır ve
canlı taşıma kapsama matrisinin parçası değildir.

| Hat      | Canary | Mention geçitleme | Allowlist engeli | Üst düzey yanıt | Yeniden başlatma sürdürme | İş parçacığı takibi | İş parçacığı yalıtımı | Tepki gözlemi | Help komutu | Yerel komut kaydı |
| -------- | ------ | ----------------- | ---------------- | --------------- | ------------------------- | ------------------- | --------------------- | ------------- | ----------- | ----------------- |
| Matrix   | x      | x                 | x                | x               | x                         | x                   | x                     | x             |             |                   |
| Telegram | x      | x                 |                  |                 |                           |                     |                       |               | x           |                   |
| Discord  | x      | x                 |                  |                 |                           |                     |                       |               |             | x                 |

Bu, `qa-channel`'ı geniş ürün davranışı paketi olarak tutarken Matrix,
Telegram ve gelecekteki canlı taşımaların tek bir açık taşıma sözleşmesi kontrol
listesini paylaşmasını sağlar.

QA yoluna Docker'ı dahil etmeden geçici bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass konuğu başlatır, bağımlılıkları kurar, konuğun içinde
OpenClaw'ı derler, `qa suite` çalıştırır, ardından normal QA raporu ve
özetini konak üzerinde `.artifacts/qa-e2e/...` içine geri kopyalar.
Konak üzerindeki `qa suite` ile aynı senaryo seçim davranışını yeniden kullanır.
Konak ve Multipass suite çalıştırmaları, varsayılan olarak yalıtılmış gateway çalışanları ile
birden çok seçili senaryoyu paralel olarak yürütür. `qa-channel` varsayılan olarak
seçilen senaryo sayısıyla sınırlandırılmış 4 eşzamanlılık kullanır. Çalışan sayısını ayarlamak için
`--concurrency <count>` veya seri yürütme için `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan bir kodla çıkar. Başarısız bir çıkış kodu olmadan
varlıkları istiyorsanız `--allow-failures` kullanın.
Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve
mevcutsa `CODEX_HOME`. Konuk, bağlanmış çalışma alanı üzerinden geri yazabilsin diye
`--output-dir` değerini depo kökü altında tutun.

## Depo destekli seed'ler

Seed varlıkları `qa/` altında bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar kasıtlı olarak git içinde tutulur; böylece QA planı hem insanlar hem de
aracı tarafından görülebilir olur.

`qa-lab`, genel bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası
tek bir test çalıştırmasının doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo meta verileri
- isteğe bağlı kategori, yetenek, hat ve risk meta verileri
- belge ve kod başvuruları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı Gateway yapılandırma yaması
- yürütülebilir `qa-flow`

`qa-flow`'u destekleyen yeniden kullanılabilir çalışma zamanı yüzeyinin genel
ve katmanlar arası kalmasına izin verilir. Örneğin markdown senaryoları,
özel durumlu bir çalıştırıcı eklemeden, gömülü Control UI'yi
Gateway `browser.request` seam'i üzerinden süren tarayıcı tarafı yardımcıları ile
taşıma tarafı yardımcılarını birleştirebilir.

Senaryo dosyaları kaynak ağacı klasörüne göre değil ürün yeteneğine göre gruplanmalıdır.
Dosyalar taşındığında senaryo kimliklerini sabit tutun; uygulama izlenebilirliği için
`docsRefs` ve `codeRefs` kullanın.

Temel liste, aşağıdakileri kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- iş parçacığı davranışı
- mesaj eylemi yaşam döngüsü
- Cron geri çağrıları
- bellek geri çağırma
- model değiştirme
- alt aracı devretme
- depo okuma ve belge okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı sahte hatları

`qa suite` iki yerel sağlayıcı sahte hattına sahiptir:

- `mock-openai`, senaryo farkında OpenClaw sahtesidir. Depo destekli QA ve eşitlik kapıları için
  varsayılan deterministik sahte hat olmaya devam eder.
- `aimock`, deneysel protokol,
  fixture, kayıt/yeniden oynatma ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Ekleyicidir ve
  `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında bulunur.
Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlatmasına, gateway model yapılandırmasına,
auth profili hazırlama gereksinimlerine ve canlı/sahte yetenek bayraklarına sahiptir. Paylaşılan suite ve
gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirme yapmalıdır.

## Taşıma adaptörleri

`qa-lab`, markdown QA senaryoları için genel bir taşıma seam'ine sahiptir.
`qa-channel`, bu seam üzerindeki ilk adaptördür ancak tasarım hedefi daha geniştir:
gelecekteki gerçek veya sentetik kanallar, taşıma özelinde bir QA çalıştırıcısı
eklemek yerine aynı suite çalıştırıcısına takılmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütme, çalışan eşzamanlılığı, varlık yazımı ve raporlamaya sahiptir.
- taşıma adaptörü, gateway yapılandırmasına, hazır oluşa, gelen ve giden gözleme, taşıma eylemlerine ve normalleştirilmiş taşıma durumuna sahiptir.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab` bunları çalıştıran yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

Yeni kanal adaptörleri için bakımcı odaklı benimseme rehberliği
[Testing](/tr/help/testing#adding-a-channel-to-qa) içinde yer alır.

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu sorulara yanıt vermelidir:

- Ne işe yaradı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryolarını eklemeye değer

Karakter ve stil kontrolleri için aynı senaryoyu birden çok canlı model
başvurusu üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

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

Komut Docker değil, yerel QA gateway alt süreçlerini çalıştırır. Karakter değerlendirme
senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı ve küçük dosya görevleri gibi
normal kullanıcı dönüşlerini çalıştırmalıdır. Aday modele değerlendirilmekte olduğu
söylenmemelidir. Komut her tam transkripti korur, temel çalışma istatistiklerini
kaydeder, ardından desteklendiği yerde hızlı mod ve `xhigh` akıl yürütme ile değerlendirme modeli olarak kullanılan modellere
doğallık, hava ve mizaha göre çalıştırmaları sıralatır.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: değerlendirme istemi yine de
her transkripti ve çalışma durumunu alır, ancak aday başvuruları `candidate-01` gibi tarafsız
etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek başvurulara geri eşler.
Aday çalıştırmaları varsayılan olarak `high` düşünme düzeyi kullanır; GPT-5.5 için `medium`,
bunu destekleyen eski OpenAI değerlendirme başvuruları için ise `xhigh` kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` yine de
genel bir geri dönüş ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday başvuruları varsayılan olarak hızlı modu kullanır; böylece sağlayıcı desteklediğinde
öncelikli işleme kullanılır. Tek bir aday veya değerlendirme modelinin geçersiz kılmaya ihtiyacı olduğunda satır içinde
`,fast`, `,no-fast` veya `,fast=false` ekleyin. Yalnızca her aday modelde
hızlı modu zorla etkinleştirmek istediğinizde `--fast` geçin. Aday ve değerlendirme modeli süreleri
karşılaştırma analizi için rapora kaydedilir, ancak değerlendirme istemleri açıkça
hıza göre sıralama yapılmamasını söyler.
Aday ve değerlendirme modeli çalıştırmaları varsayılan olarak 16 eşzamanlılık kullanır. Sağlayıcı sınırları veya yerel gateway
yükü çalıştırmayı çok gürültülü hale getiriyorsa `--concurrency` veya `--judge-concurrency`
değerlerini düşürün.
Aday `--model` geçirilmediğinde karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` modellerini kullanır.
`--judge-model` geçirilmediğinde değerlendirme modelleri varsayılan olarak
`openai/gpt-5.5,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili belgeler

- [Testing](/tr/help/testing)
- [QA Channel](/tr/channels/qa-channel)
- [Pano](/tr/web/dashboard)

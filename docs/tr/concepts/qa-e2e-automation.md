---
read_when:
    - qa-lab veya qa-channel genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçilikte QA otomasyonu oluşturma
summary: qa-lab, qa-channel, seedlenmiş senaryolar ve protokol raporları için özel QA otomasyon yapısı
title: QA Uçtan Uca Otomasyonu
x-i18n:
    generated_at: "2026-04-18T08:32:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: adf8c5f74e8fabdc8e9fd7ecd41afce8b60354c7dd24d92ac926d3c527927cd4
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA Uçtan Uca Otomasyonu

Özel QA yığını, OpenClaw'ı tek bir birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmayı amaçlar.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: dökümü gözlemlemek,
  gelen mesajları enjekte etmek ve bir Markdown raporu dışa aktarmak için hata ayıklayıcı arayüzü ve QA veri yolu.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için depo destekli tohum varlıklar.

Mevcut QA operatörü akışı iki panelli bir QA sitesidir:

- Sol: Ajan ile birlikte Gateway panosu (Control UI).
- Sağ: Slack benzeri dökümü ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini oluşturur, Docker destekli gateway hattını başlatır ve
bir operatörün veya otomasyon döngüsünün ajana bir QA
görevi verebildiği, gerçek kanal davranışını gözlemleyebildiği ve nelerin çalıştığını, başarısız olduğunu veya
engelli kaldığını kaydedebildiği QA Lab sayfasını açığa çıkarır.

Docker imajını her seferinde yeniden oluşturmadan daha hızlı QA Lab arayüzü yinelemesi için,
yığını bind-mount edilmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden oluşturulmuş bir imaj üzerinde tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` container'ına bind-mount eder. `qa:lab:watch`
bu paketi değişiklik oldukça yeniden oluşturur ve QA Lab
varlık hash'i değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

Taşıma açısından gerçek bir Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix
```

Bu hat, Docker içinde geçici bir Tuwunel homeserver sağlar, geçici
driver, SUT ve gözlemci kullanıcılarını kaydeder, bir özel oda oluşturur, ardından
gerçek Matrix plugin'ini bir QA gateway alt süreci içinde çalıştırır. Canlı taşıma hattı,
alt süreç yapılandırmasını test edilen taşımaya göre kapsamlandırır; böylece Matrix,
alt süreç yapılandırmasında `qa-channel` olmadan çalışır. Yapılandırılmış rapor çıktıları ile
birleştirilmiş stdout/stderr günlüğünü seçilen Matrix QA çıktı dizinine yazar.
Dıştaki `scripts/run-node.mjs` derleme/başlatıcı çıktısını da yakalamak için,
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` değişkenini depo içi bir günlük dosyasına ayarlayın.

Taşıma açısından gerçek bir Telegram smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa telegram
```

Bu hat, geçici bir sunucu sağlamaktansa tek bir gerçek özel Telegram grubunu hedefler. Şunları gerektirir:
`OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`; ayrıca aynı
özel grupta iki farklı bot gerekir. SUT botunun bir Telegram kullanıcı adına sahip olması gerekir ve
botlar arası gözlem, her iki botta da
`@BotFather` içinde Bot-to-Bot Communication Mode etkin olduğunda en iyi şekilde çalışır.

Canlı taşıma hatları artık her birinin kendi senaryo listesi biçimini icat etmesi yerine
ortak, daha küçük bir sözleşmeyi paylaşır:

`qa-channel`, geniş sentetik ürün davranışı paketi olarak kalır ve
canlı taşıma kapsam matriksinin bir parçası değildir.

| Hat      | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

Bu, `qa-channel`'ı geniş ürün davranışı paketi olarak korurken; Matrix,
Telegram ve gelecekteki canlı taşımaların tek bir açık taşıma-sözleşmesi
kontrol listesini paylaşmasını sağlar.

QA yoluna Docker dahil etmeden geçici bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass misafirini başlatır, bağımlılıkları kurar, misafir içinde
OpenClaw'ı derler, `qa suite` çalıştırır, ardından normal QA raporunu ve
özeti tekrar ana makinedeki `.artifacts/qa-e2e/...` konumuna kopyalar.
Ana makinedeki `qa suite` ile aynı senaryo seçme davranışını yeniden kullanır.
Ana makine ve Multipass paket çalıştırmaları, varsayılan olarak yalıtılmış gateway worker'ları ile
birden fazla seçili senaryoyu paralel çalıştırır; en fazla 64 worker veya seçili
senaryo sayısı kadar. Worker sayısını ayarlamak için `--concurrency <count>`,
seri çalıştırma için `--concurrency 1` kullanın.
Canlı çalıştırmalar, misafir için pratik olan desteklenen QA kimlik doğrulama girdilerini
aktarır: env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve
varsa `CODEX_HOME`. Misafirin
mount edilmiş çalışma alanı üzerinden geri yazabilmesi için `--output-dir` değerini depo kökü altında tutun.

## Depo destekli tohumlar

Tohum varlıklar `qa/` içinde bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar kasıtlı olarak git içindedir; böylece QA planı hem insanlar hem de
ajan tarafından görünür olur.

`qa-lab` genel amaçlı bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası,
tek bir test çalıştırmasının doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo meta verileri
- isteğe bağlı kategori, yetenek, hat ve risk meta verileri
- doküman ve kod referansları
- isteğe bağlı plugin gereksinimleri
- isteğe bağlı gateway yapılandırma yaması
- çalıştırılabilir `qa-flow`

`qa-flow`'u destekleyen yeniden kullanılabilir çalışma zamanı yüzeyinin
genel ve kesişen nitelikte kalmasına izin verilir. Örneğin, markdown senaryoları
özel durum çalıştırıcısı eklemeden, gömülü Control UI'yı
Gateway `browser.request` seam üzerinden süren tarayıcı tarafı yardımcılarla taşıma tarafı yardımcılarını birleştirebilir.

Senaryo dosyaları kaynak ağacı klasörüne göre değil, ürün yeteneğine göre gruplandırılmalıdır.
Dosyalar taşındığında senaryo kimliklerini sabit tutun; uygulama izlenebilirliği için
`docsRefs` ve `codeRefs` kullanın.

Temel liste, aşağıdakileri kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- iş parçacığı davranışı
- mesaj eylemi yaşam döngüsü
- Cron geri çağrıları
- bellek geri çağırma
- model değiştirme
- alt ajan devri
- depo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı sahte hatları

`qa suite` iki yerel sağlayıcı sahte hattına sahiptir:

- `mock-openai`, senaryo farkındalığına sahip OpenClaw sahte sağlayıcısıdır. Depo destekli QA ve eşdeğerlik kapıları için
  varsayılan deterministik sahte hat olmaya devam eder.
- `aimock`, deneysel protokol,
  fixture, kayıt/yeniden oynatma ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Bu ek niteliğindedir ve
  `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında bulunur.
Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlatmasına, gateway model yapılandırmasına,
auth-profile hazırlık ihtiyaçlarına ve canlı/sahte yetenek bayraklarına sahiptir. Ortak paket ve
gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kaydı üzerinden yönlendirilmelidir.

## Taşıma bağdaştırıcıları

`qa-lab`, markdown QA senaryoları için genel bir taşıma seam'ine sahiptir.
`qa-channel`, bu seam üzerindeki ilk bağdaştırıcıdır ancak tasarım hedefi daha geniştir:
gelecekteki gerçek veya sentetik kanallar, taşıma özelinde bir QA çalıştırıcısı eklemek yerine
aynı paket çalıştırıcısına takılabilmelidir.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütmeyi, worker eşzamanlılığını, çıktı yazımını ve raporlamayı yönetir.
- taşıma bağdaştırıcısı, gateway yapılandırmasını, hazır olma durumunu, gelen ve giden gözlemi, taşıma eylemlerini ve normalize edilmiş taşıma durumunu yönetir.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini `qa-lab` sağlar.

Yeni kanal bağdaştırıcıları için bakımcıya yönelik benimseme rehberi
[Testing](/tr/help/testing#adding-a-channel-to-qa) içinde bulunur.

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu sorulara yanıt vermelidir:

- Neler çalıştı
- Neler başarısız oldu
- Neler engelli kaldı
- Hangi takip senaryolarını eklemek faydalı olur

Karakter ve stil kontrolleri için, aynı senaryoyu birden fazla canlı model
referansı üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Komut Docker değil, yerel QA gateway alt süreçlerini çalıştırır. Character eval
senaryoları persona'yı `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı
ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam dökümü korur,
temel çalışma istatistiklerini kaydeder, ardından değerlendirme modeli olarak kullanılan modellerden hızlı kipte
`xhigh` akıl yürütme ile çalıştırmaları doğallık, hava ve mizaha göre sıralamalarını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın:
değerlendirme istemi yine her dökümü ve çalışma durumunu alır, ancak aday referansları
`candidate-01` gibi nötr etiketlerle değiştirilir; rapor, ayrıştırmadan sonra
sıralamaları gerçek referanslarla yeniden eşler.
Aday çalıştırmaları varsayılan olarak `high` thinking kullanır; bunu destekleyen OpenAI modelleri için `xhigh` kullanılır.
Belirli bir adayı satır içi olarak
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` hâlâ
genel bir geri dönüş varsayılanı ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday referansları varsayılan olarak hızlı kip kullanır; böylece sağlayıcının
desteklediği yerlerde öncelikli işleme kullanılır. Tek bir adayın veya değerlendiricinin
geçersiz kılmaya ihtiyacı varsa satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin.
Hızlı kipi her aday model için zorla etkinleştirmek istediğinizde yalnızca `--fast` geçin.
Aday ve değerlendirici süreleri kıyaslama analizi için rapora kaydedilir, ancak
değerlendirici istemleri açıkça hıza göre sıralama yapılmamasını söyler.
Aday ve değerlendirici model çalıştırmaları varsayılan olarak 16 eşzamanlılık kullanır.
Sağlayıcı sınırları veya yerel gateway baskısı çalıştırmayı fazla gürültülü hâle getirirse
`--concurrency` veya `--judge-concurrency` değerini düşürün.
Hiç aday `--model` geçirilmezse, character eval varsayılan olarak
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
Hiç `--judge-model` geçirilmezse, değerlendiriciler varsayılan olarak
`openai/gpt-5.4,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili dokümanlar

- [Testing](/tr/help/testing)
- [QA Channel](/tr/channels/qa-channel)
- [Dashboard](/web/dashboard)

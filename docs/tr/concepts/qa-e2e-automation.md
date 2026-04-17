---
read_when:
    - qa-lab veya qa-channel genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçiliğe sahip QA otomasyonu oluşturma
summary: qa-lab, qa-channel, seed'lenmiş senaryolar ve protokol raporları için özel QA otomasyon yapısı
title: QA Uçtan Uca Otomasyonu
x-i18n:
    generated_at: "2026-04-17T08:52:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f97293c184d7c04c95d9858305668fbc0f93273f587ec7e54896ad5d603ab0
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA Uçtan Uca Otomasyonu

Özel QA yığını, OpenClaw'ı tek birim testin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmayı amaçlar.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, ileti dizisi,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve bir Markdown raporu dışa aktarmak için hata ayıklayıcı arayüzü ve QA veri yolu.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için depo destekli seed varlıkları.

Mevcut QA operatörü akışı iki panelli bir QA sitesidir:

- Sol: ajanla birlikte Gateway panosu (Kontrol Arayüzü).
- Sağ: Slack benzeri transkript ve senaryo planını gösteren QA Lab.

Bunu şu komutla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve bir
operatörün veya otomasyon döngüsünün ajana bir QA görevi verebildiği,
gerçek kanal davranışını gözlemleyebildiği ve neyin çalıştığını, neyin başarısız olduğunu veya
neyin engelli kaldığını kaydedebildiği QA Lab sayfasını açar.

Docker imajını her seferinde yeniden derlemeden daha hızlı QA Lab arayüzü yinelemesi için,
yığını bind-mount edilmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden derlenmiş bir imaj üzerinde tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` kapsayıcısına bind-mount eder. `qa:lab:watch`
değişiklik olduğunda bu paketi yeniden derler ve QA Lab varlık özeti değiştiğinde
tarayıcı otomatik olarak yeniden yüklenir.

Taşıma katmanında gerçek bir Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix
```

Bu hat, Docker içinde tek kullanımlık bir Tuwunel homeserver sağlar, geçici
sürücü, SUT ve gözlemci kullanıcılarını kaydeder, bir özel oda oluşturur, ardından
gerçek Matrix Plugin'ini bir QA gateway alt süreci içinde çalıştırır. Canlı taşıma hattı,
alt süreç yapılandırmasını test edilen taşıma katmanıyla sınırlı tutar; böylece Matrix
alt süreç yapılandırmasında `qa-channel` olmadan çalışır. Yapılandırılmış rapor
çıktılarını ve birleştirilmiş stdout/stderr günlüğünü seçilen Matrix QA çıktı dizinine
yazar. Dıştaki `scripts/run-node.mjs` derleme/başlatıcı çıktısını da yakalamak için,
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` değerini depo içi bir günlük dosyasına ayarlayın.

Taşıma katmanında gerçek bir Telegram smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa telegram
```

Bu hat, tek kullanımlık bir sunucu sağlamak yerine bir gerçek özel Telegram grubunu hedefler.
`OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir; ayrıca aynı
özel grupta iki farklı bot olmalıdır. SUT botunun bir Telegram kullanıcı adı olmalıdır ve
botlar arası gözlem, her iki botta da `@BotFather` içinde
Bot-to-Bot Communication Mode etkin olduğunda en iyi şekilde çalışır.

Canlı taşıma hatları artık her birinin kendi senaryo listesi biçimini icat etmesi yerine
tek ve daha küçük bir sözleşmeyi paylaşır:

`qa-channel`, geniş sentetik ürün davranışı paketidir ve
canlı taşıma kapsam matriksinin parçası değildir.

| Hat      | Canary | Mention gating | Allowlist block | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | İleti dizisi takibi | İleti dizisi izolasyonu | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------- | --------------- | --------------- | --------------------------------- | ------------------- | ----------------------- | ------------- | ------------- |
| Matrix   | x      | x              | x               | x               | x                                 | x                   | x                       | x             |               |
| Telegram | x      |                |                 |                 |                                   |                     |                         |               | x             |

Bu, `qa-channel`'ı geniş ürün davranışı paketi olarak korurken Matrix,
Telegram ve gelecekteki canlı taşıma katmanlarının tek bir açık
taşıma sözleşmesi kontrol listesini paylaşmasını sağlar.

Docker'ı QA yoluna dahil etmeden tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass misafiri önyükler, bağımlılıkları kurar, OpenClaw'ı
misafir içinde derler, `qa suite` komutunu çalıştırır, ardından normal QA raporunu ve
özeti tekrar ana makinedeki `.artifacts/qa-e2e/...` içine kopyalar.
Ana makinedeki `qa suite` ile aynı senaryo seçme davranışını yeniden kullanır.
Ana makine ve Multipass suite çalıştırmaları, seçilmiş birden fazla senaryoyu varsayılan olarak
yalıtılmış gateway worker'larıyla paralel yürütür; en fazla 64 worker veya
seçilmiş senaryo sayısı kadar. Worker sayısını ayarlamak için `--concurrency <count>` kullanın,
veya seri yürütme için `--concurrency 1` kullanın.
Canlı çalıştırmalar, misafir için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve
varsa `CODEX_HOME`. Misafirin bağlanmış çalışma alanı üzerinden geri yazabilmesi için
`--output-dir` değerini depo kökünün altında tutun.

## Depo destekli seed'ler

Seed varlıkları `qa/` altında bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Bunlar, QA planının hem insanlar hem de
ajan tarafından görülebilmesi için bilinçli olarak git içinde tutulur.

`qa-lab` genel amaçlı bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası,
tek bir test çalıştırmasının doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo meta verileri
- dokümantasyon ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı gateway yapılandırma yaması
- yürütülebilir `qa-flow`

`qa-flow`'u destekleyen yeniden kullanılabilir çalışma zamanı yüzeyinin genel amaçlı
ve kesitler arası kalmasına izin verilir. Örneğin, markdown senaryoları,
özel durumlu bir çalıştırıcı eklemeden gömülü Kontrol Arayüzünü Gateway `browser.request`
bağlantı noktası üzerinden süren tarayıcı tarafı yardımcılarıyla taşıma tarafı yardımcılarını birleştirebilir.

Temel liste, aşağıdakileri kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- ileti dizisi davranışı
- mesaj eylemi yaşam döngüsü
- Cron geri çağrıları
- bellek geri çağırma
- model değiştirme
- alt ajan devri
- depo okuma ve dokümantasyon okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı sahte hatları

`qa suite` iki yerel sağlayıcı sahte hattına sahiptir:

- `mock-openai`, senaryo farkında OpenClaw sahte sağlayıcısıdır. Depo destekli QA ve
  eşitlik kapıları için varsayılan deterministik sahte hat olmaya devam eder.
- `aimock`, deneysel protokol,
  fixture, kayıt/yeniden oynatma ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Ekleyicidir ve
  `mock-openai` senaryo yönlendiricisinin yerine geçmez.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında bulunur.
Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlatmasına, gateway model yapılandırmasına,
kimlik profili hazırlama gereksinimlerine ve canlı/sahte yetenek bayraklarına sahiptir. Paylaşılan suite ve
gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kaydı üzerinden yönlendirme yapmalıdır.

## Taşıma bağdaştırıcıları

`qa-lab`, markdown QA senaryoları için genel amaçlı bir taşıma bağlantı noktası sahibidir.
`qa-channel`, bu bağlantı noktasındaki ilk bağdaştırıcıdır, ancak tasarım hedefi daha geniştir:
gelecekteki gerçek veya sentetik kanallar, taşıma katmanına özel bir QA çalıştırıcısı eklemek yerine
aynı suite çalıştırıcısına takılabilmelidir.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütme, worker eşzamanlılığı, çıktı yazımı ve raporlamadan sorumludur.
- taşıma bağdaştırıcısı gateway yapılandırması, hazır olma durumu, gelen ve giden gözlem, taşıma eylemleri ve normalize edilmiş taşıma durumundan sorumludur.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini `qa-lab` sağlar.

Yeni kanal bağdaştırıcıları için bakımcıya yönelik benimseme rehberi
[Testing](/tr/help/testing#adding-a-channel-to-qa) içinde bulunur.

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu sorulara yanıt vermelidir:

- Neler çalıştı
- Neler başarısız oldu
- Neler engelli kaldı
- Hangi takip senaryolarını eklemeye değer

Karakter ve stil kontrolleri için aynı senaryoyu birden fazla canlı model
ref'i üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

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

Bu komut Docker değil, yerel QA gateway alt süreçlerini çalıştırır. Character eval
senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı
ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam transkripti korur, temel çalışma
istatistiklerini kaydeder, ardından değerlendirme modellerinden hızlı modda
`xhigh` akıl yürütmeyle çalıştırmaları doğallık, hava ve mizaha göre sıralamasını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: değerlendirme istemi yine de
her transkripti ve çalışma durumunu alır, ancak aday ref'leri
`candidate-01` gibi nötr etiketlerle değiştirilir; rapor sıralamaları ayrıştırmadan sonra
gerçek ref'lere geri eşler.
Aday çalıştırmalar varsayılan olarak `high` düşünme düzeyini kullanır; bunu destekleyen OpenAI modellerinde
`xhigh` kullanılır. Belirli bir adayı satır içinde geçersiz kılmak için
`--model provider/model,thinking=<level>` kullanın. `--thinking <level>` yine de genel bir
yedek değer ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday ref'leri varsayılan olarak hızlı mod kullanır; böylece sağlayıcının desteklediği yerde
öncelikli işleme kullanılır. Tek bir adayın veya değerlendiricinin geçersiz kılmaya ihtiyacı varsa
satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin. Her aday model için
hızlı modu zorla açmak istediğinizde yalnızca `--fast` geçin. Aday ve değerlendirici süreleri
kıyaslama analizi için rapora kaydedilir, ancak değerlendirici istemleri açıkça
hıza göre sıralama yapılmamasını söyler.
Hem aday hem de değerlendirici model çalıştırmaları varsayılan olarak 16 eşzamanlılıkla çalışır.
Sağlayıcı sınırları veya yerel gateway baskısı bir çalıştırmayı çok gürültülü hale getiriyorsa
`--concurrency` veya `--judge-concurrency` değerlerini düşürün.
Aday `--model` geçirilmediğinde character eval varsayılan olarak
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
`--judge-model` geçirilmediğinde değerlendiriciler varsayılan olarak
`openai/gpt-5.4,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili dokümanlar

- [Testing](/tr/help/testing)
- [QA Channel](/tr/channels/qa-channel)
- [Pano](/web/dashboard)

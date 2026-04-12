---
read_when:
    - qa-lab veya qa-channel'ı genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçilikli QA otomasyonu oluşturma
summary: qa-lab, qa-channel, seedlenmiş senaryolar ve protokol raporları için özel QA otomasyon yapısı
title: QA Uçtan Uca Otomasyon
x-i18n:
    generated_at: "2026-04-12T23:28:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9fe27dc049823d5e3eb7ae1eac6aad21ed9e917425611fb1dbcb28ab9210d5e
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA Uçtan Uca Otomasyon

Özel QA yığını, OpenClaw'ı tek birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak için tasarlanmıştır.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, ileti dizisi,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve bir Markdown raporu dışa aktarmak için hata ayıklayıcı arayüzü ve QA veri yolu.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için depo destekli tohum varlıkları.

Mevcut QA operatörü akışı iki panelli bir QA sitesidir:

- Sol: ajan ile Gateway panosu (Control UI).
- Sağ: Slack benzeri transkript ve senaryo planını gösteren QA Lab.

Bunu şu komutla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve
bir operatörün veya otomasyon döngüsünün ajana bir QA görevi verebildiği,
gerçek kanal davranışını gözlemleyebildiği ve neyin çalıştığını, neyin başarısız olduğunu
veya neyin engelli kaldığını kaydedebildiği QA Lab sayfasını kullanıma açar.

Docker imajını her seferinde yeniden derlemeden daha hızlı QA Lab UI yinelemesi
için, yığını bind-mounted bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden derlenmiş bir imaj üzerinde tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` kapsayıcısına bind mount eder. `qa:lab:watch`
bu paketi değişiklik olduğunda yeniden derler ve QA Lab varlık karması değiştiğinde
tarayıcı otomatik olarak yeniden yüklenir.

Taşıma açısından gerçek bir Matrix duman testi hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix
```

Bu hat, Docker içinde tek kullanımlık bir Tuwunel homeserver sağlar,
geçici sürücü, SUT ve gözlemci kullanıcılarını kaydeder, bir özel oda oluşturur,
ardından gerçek Matrix Plugin'ini bir QA gateway alt süreci içinde çalıştırır. Canlı taşıma hattı,
alt süreç yapılandırmasını test edilen taşımayla sınırlı tutar; böylece Matrix,
alt süreç yapılandırmasında `qa-channel` olmadan çalışır.

Taşıma açısından gerçek bir Telegram duman testi hattı için şunu çalıştırın:

```bash
pnpm openclaw qa telegram
```

Bu hat, tek kullanımlık bir sunucu sağlamak yerine bir gerçek özel Telegram grubunu hedefler.
`OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir; ayrıca aynı
özel grupta iki farklı bot gerekir. SUT botunun bir Telegram kullanıcı adına sahip olması gerekir ve
bottan bota gözlem, her iki botta da `@BotFather` içinde
Bot-to-Bot Communication Mode etkin olduğunda en iyi şekilde çalışır.

Canlı taşıma hatları artık her birinin kendi senaryo listesi şeklini icat etmesi yerine
ortak, daha küçük bir sözleşmeyi paylaşır:

`qa-channel`, geniş sentetik ürün davranışı paketi olarak kalır ve
canlı taşıma kapsam matriksinin bir parçası değildir.

| Hat      | Canary | Mention gating | Allowlist block | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | İleti dizisi takibi | İleti dizisi izolasyonu | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------- | --------------- | --------------- | --------------------------------- | ------------------- | ----------------------- | ------------- | ------------- |
| Matrix   | x      | x              | x               | x               | x                                 | x                   | x                       | x             |               |
| Telegram | x      |                |                 |                 |                                   |                     |                         |               | x            |

Bu, `qa-channel`'ı geniş ürün davranışı paketi olarak korurken Matrix,
Telegram ve gelecekteki canlı taşıma sistemlerinin açık bir taşıma sözleşmesi
kontrol listesini paylaşmasını sağlar.

Docker'ı QA yoluna dahil etmeden tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass misafirini başlatır, bağımlılıkları kurar, OpenClaw'ı
misafir içinde derler, `qa suite` çalıştırır, ardından normal QA raporunu ve
özeti tekrar ana makinede `.artifacts/qa-e2e/...` içine kopyalar.
Ana makinedeki `qa suite` ile aynı senaryo seçim davranışını yeniden kullanır.
Ana makine ve Multipass paket çalıştırmaları, varsayılan olarak izole gateway çalışanlarıyla
birden çok seçilmiş senaryoyu paralel çalıştırır; en fazla 64 çalışan veya seçilen
senaryo sayısı kadar. Çalışan sayısını ayarlamak için `--concurrency <count>`,
seri yürütme için ise `--concurrency 1` kullanın.
Canlı çalıştırmalar, misafir için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
ortam değişkeni tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve
varsa `CODEX_HOME`. Misafirin bağlanmış çalışma alanı üzerinden geri yazabilmesi için
`--output-dir` değerini depo kökü altında tutun.

## Depo destekli tohumlar

Tohum varlıkları `qa/` altında bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Bunlar kasıtlı olarak git içinde tutulur; böylece QA planı hem insanlar hem de
ajan tarafından görülebilir.

`qa-lab` genel bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası
tek bir test çalıştırmasının doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo meta verileri
- doküman ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı gateway yapılandırma yaması
- yürütülebilir `qa-flow`

Temel liste, şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- ileti dizisi davranışı
- mesaj eylemi yaşam döngüsü
- Cron geri çağrıları
- bellekten geri çağırma
- model değiştirme
- alt ajan devretme
- depo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Taşıma bağdaştırıcıları

`qa-lab`, markdown QA senaryoları için genel bir taşıma katmanına sahiptir.
`qa-channel`, bu katmandaki ilk bağdaştırıcıdır, ancak tasarım hedefi daha geniştir:
gelecekteki gerçek veya sentetik kanallar, taşımaya özel bir QA çalıştırıcısı eklemek yerine
aynı paket çalıştırıcısına bağlanmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütmeyi, çalışan eşzamanlılığını, yapıt yazmayı ve raporlamayı yönetir.
- taşıma bağdaştırıcısı, gateway yapılandırmasını, hazır olma durumunu, gelen ve giden gözlemi, taşıma eylemlerini ve normalize edilmiş taşıma durumunu yönetir.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab` bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

Yeni kanal bağdaştırıcıları için bakımcıya yönelik uyarlama rehberi
[Testing](/tr/help/testing#adding-a-channel-to-qa) içinde yer alır.

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu sorulara yanıt vermelidir:

- Ne işe yaradı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryolarını eklemeye değer

Karakter ve stil kontrolleri için, aynı senaryoyu birden çok canlı model referansı üzerinde
çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

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

Komut Docker değil, yerel QA gateway alt süreçleri çalıştırır. Karakter değerlendirme
senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı
ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam transkripti korur, temel çalıştırma
istatistiklerini kaydeder, ardından değerlendirme modellerinden hızlı modda ve
`xhigh` akıl yürütme ile çalıştırmaları doğallık, hava ve mizah açısından sıralamalarını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: değerlendirme istemi yine de
her transkripti ve çalıştırma durumunu alır, ancak aday referansları `candidate-01` gibi nötr
etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek referanslara geri eşler.
Aday çalıştırmalar varsayılan olarak `high` düşünme düzeyini, bunu destekleyen OpenAI modelleri içinse
`xhigh` düzeyini kullanır. Belirli bir adayı satır içinde geçersiz kılmak için
`--model provider/model,thinking=<level>` kullanın. `--thinking <level>` hâlâ genel bir
yedek ayar belirler ve eski `--model-thinking <provider/model=level>` biçimi uyumluluk için
korunur.
OpenAI aday referansları varsayılan olarak hızlı modu kullanır; böylece sağlayıcının desteklediği
yerlerde öncelikli işleme kullanılır. Tek bir aday veya değerlendirme modeli için geçersiz kılma
gerekiyorsa satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin. Hızlı modu her aday model için
zorla etkinleştirmek istediğinizde yalnızca `--fast` geçin. Aday ve değerlendirme süreleri,
karşılaştırmalı analiz için rapora kaydedilir; ancak değerlendirme istemleri açıkça
hıza göre sıralama yapılmamasını söyler.
Aday ve değerlendirme modeli çalıştırmalarının her ikisi de varsayılan olarak eşzamanlılık 16 ile gelir.
Sağlayıcı sınırları veya yerel gateway yükü çalıştırmayı fazla gürültülü hâle getiriyorsa
`--concurrency` veya `--judge-concurrency` değerini düşürün.
Hiç aday `--model` geçirilmediğinde, karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
Hiç `--judge-model` geçirilmediğinde, değerlendirme modelleri varsayılan olarak
`openai/gpt-5.4,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili dokümanlar

- [Testing](/tr/help/testing)
- [QA Channel](/tr/channels/qa-channel)
- [Dashboard](/web/dashboard)

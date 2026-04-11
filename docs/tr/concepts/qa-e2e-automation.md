---
read_when:
    - qa-lab veya qa-channel genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçiliğe sahip QA otomasyonu oluşturma
summary: qa-lab, qa-channel, seed edilmiş senaryolar ve protokol raporları için özel QA otomasyonu yapısı
title: QA E2E Otomasyonu
x-i18n:
    generated_at: "2026-04-11T02:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5427b505e26bfd542e984e3920c3f7cb825473959195ba9737eff5da944c60d0
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E Otomasyonu

Özel QA yığını, OpenClaw'ı tek birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde test etmeyi amaçlar.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, ileti dizisi,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve bir Markdown raporu dışa aktarmak için hata ayıklayıcı arayüzü ve QA veri yolu.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için depo destekli seed varlıkları.

Mevcut QA operatörü akışı, iki bölmeli bir QA sitesidir:

- Sol: ajan ile Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Bunu şu komutla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve
bir operatörün veya otomasyon döngüsünün ajana bir QA
görevi verebileceği, gerçek kanal davranışını gözlemleyebileceği ve neyin işe yaradığını, neyin başarısız olduğunu veya
neyin engelli kaldığını kaydedebileceği QA Lab sayfasını açar.

Docker imajını her seferinde yeniden derlemeden daha hızlı QA Lab arayüzü yinelemesi için,
yığını bind-mounted bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden derlenmiş bir imaj üzerinde tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` container'ına bind-mount eder. `qa:lab:watch`
bu paketi değişiklikte yeniden derler ve QA Lab varlık hash'i değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

Taşıma katmanında gerçek bir Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix
```

Bu hat, Docker içinde tek kullanımlık bir Tuwunel homeserver sağlar, geçici
sürücü, SUT ve gözlemci kullanıcılarını kaydeder, bir özel oda oluşturur, ardından
gerçek Matrix plugin'ini bir QA gateway alt süreci içinde çalıştırır. Canlı taşıma hattı, alt süreç yapılandırmasını test edilen taşıma katmanıyla sınırlı tutar; bu nedenle Matrix, alt süreç yapılandırmasında
`qa-channel` olmadan çalışır.

Taşıma katmanında gerçek bir Telegram smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa telegram
```

Bu hat, tek kullanımlık bir sunucu sağlamak yerine bir gerçek özel Telegram grubunu hedefler. Bunun için `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerekir; ayrıca aynı
özel grupta iki farklı bot bulunmalıdır. SUT botunun bir Telegram kullanıcı adı olmalıdır ve bottan bota
gözlem, her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode
etkinleştirildiğinde en iyi şekilde çalışır.

Canlı taşıma hatları artık her birinin kendi senaryo listesi biçimini icat etmesi yerine
tek ve daha küçük bir sözleşmeyi paylaşır:

`qa-channel`, geniş sentetik ürün davranışı paketini korur ve
canlı taşıma kapsam matriksinin parçası değildir.

| Hat      | Canary | Mention gating | Allowlist block | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | İleti dizisi takibi | İleti dizisi yalıtımı | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------- | --------------- | --------------- | --------------------------------- | ------------------- | --------------------- | ------------- | ------------- |
| Matrix   | x      | x              | x               | x               | x                                 | x                   | x                     | x             |               |
| Telegram | x      |                |                 |                 |                                   |                     |                       |               | x            |

Bu, `qa-channel`'ı geniş ürün davranışı paketi olarak korurken Matrix,
Telegram ve gelecekteki canlı taşıma katmanlarının tek bir açık taşıma sözleşmesi kontrol listesi paylaşmasını sağlar.

QA yoluna Docker'ı dahil etmeden tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass konuğunu başlatır, bağımlılıkları kurar, konuğun içinde OpenClaw'ı derler,
`qa suite` çalıştırır, ardından normal QA raporunu ve
özeti konağa `.artifacts/qa-e2e/...` altına geri kopyalar.
Ana makinedeki `qa suite` ile aynı senaryo seçme davranışını yeniden kullanır.
Ana makine ve Multipass suite çalıştırmaları, seçili birden çok senaryoyu varsayılan olarak yalıtılmış gateway işçileri ile paralel yürütür; en fazla 64 işçi veya seçilen senaryo sayısı kadar.
İşçi sayısını ayarlamak için `--concurrency <count>`, seri yürütme için ise `--concurrency 1` kullanın.
Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
ortam değişkeni tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve
varsa `CODEX_HOME`. Konuğun bağlanmış çalışma alanı üzerinden geri yazabilmesi için
`--output-dir` değerini depo kökü altında tutun.

## Depo destekli seed'ler

Seed varlıkları `qa/` altında bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Bunlar kasıtlı olarak git içinde tutulur; böylece QA planı hem insanlar hem de
ajan tarafından görülebilir. Temel liste, şu alanları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- ileti dizisi davranışı
- mesaj eylemi yaşam döngüsü
- cron geri çağrıları
- bellekten geri çağırma
- model değiştirme
- alt ajan devri
- depo okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu soruları yanıtlamalıdır:

- Ne işe yaradı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryolarını eklemeye değer

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

Komut, Docker değil, yerel QA gateway alt süreçleri çalıştırır. Karakter değerlendirme
senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı ve küçük dosya görevleri gibi
normal kullanıcı dönüşlerini çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam
transkripti korur, temel çalışma istatistiklerini kaydeder, ardından yargıç modellerden hızlı modda
`xhigh` akıl yürütmeyle çalışmaları doğallık, hava ve mizah açısından sıralamalarını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın:
yargıç istemi yine her transkripti ve çalışma durumunu alır, ancak aday referansları
`candidate-01` gibi nötr etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek referanslara eşler.
Aday çalıştırmalar varsayılan olarak `high` düşünme düzeyini kullanır; bunu destekleyen OpenAI modellerinde `xhigh` kullanılır.
Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` hâlâ küresel bir geri dönüş değeri ayarlar ve eski `--model-thinking <provider/model=level>` biçimi uyumluluk için korunur.
OpenAI aday referansları varsayılan olarak hızlı modu kullanır; böylece sağlayıcının desteklediği yerlerde öncelikli işleme kullanılır. Tek bir
aday veya yargıç için geçersiz kılma gerektiğinde satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin. Hızlı modu
her aday model için zorla açmak istediğinizde yalnızca `--fast` geçin. Aday ve yargıç süreleri
karşılaştırmalı analiz için rapora kaydedilir, ancak yargıç istemleri açıkça
hıza göre sıralama yapmamalarını söyler.
Hem aday hem de yargıç model çalıştırmaları varsayılan olarak 16 eşzamanlılık kullanır.
Sağlayıcı sınırları veya yerel gateway yükü bir çalıştırmayı çok gürültülü hâle getiriyorsa
`--concurrency` veya `--judge-concurrency` değerini düşürün.
Hiç aday `--model` geçirilmezse karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` modellerini kullanır.
Hiç `--judge-model` geçirilmezse yargıçlar varsayılan olarak
`openai/gpt-5.4,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili dokümanlar

- [Testing](/tr/help/testing)
- [QA Channel](/tr/channels/qa-channel)
- [Dashboard](/web/dashboard)

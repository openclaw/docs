---
read_when:
    - qa-lab veya qa-channel'ı genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçilikli QA otomasyonu oluşturma
summary: qa-lab, qa-channel, tohumlanmış senaryolar ve protokol raporları için özel QA otomasyon yapısı
title: QA E2E otomasyonu
x-i18n:
    generated_at: "2026-04-24T09:06:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbde51169a1572dc6753ab550ca29ca98abb2394e8991a8482bd7b66ea80ce76
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Özel QA yığını, OpenClaw'ı tek birim testin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde sınamak içindir.

Geçerli parçalar:

- `extensions/qa-channel`: DM, kanal, konu,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesaj enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veri yolu.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için depo destekli seed varlıkları.

Geçerli QA operatör akışı iki panelli bir QA sitesidir:

- Sol: ajan ile Gateway panosu (Control UI).
- Sağ: Slack benzeri transkript ve senaryo planını gösteren QA Lab.

Bunu şu komutla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve
bir operatörün veya otomasyon döngüsünün ajana bir QA görevi verebildiği,
gerçek kanal davranışını gözlemleyebildiği ve neyin çalıştığını, neyin başarısız olduğunu veya
neyin engelli kaldığını kaydedebildiği QA Lab sayfasını açar.

Her seferinde Docker image'ını yeniden derlemeden daha hızlı QA Lab UI yinelemesi için,
yığını bind-mount edilmiş QA Lab paketi ile başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden derlenmiş bir image üzerinde tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` container'ı içine bind-mount eder. `qa:lab:watch`
değişiklikte bu paketi yeniden derler ve QA Lab varlık hash'i değiştiğinde
tarayıcı otomatik yeniden yüklenir.

Taşıma katmanı gerçek bir Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix
```

Bu hat, Docker içinde geçici bir Tuwunel homeserver sağlar, geçici
sürücü, SUT ve gözlemci kullanıcılarını kaydeder, bir özel oda oluşturur, ardından
gerçek Matrix Plugin'ini bir QA gateway child içinde çalıştırır. Canlı taşıma hattı, child yapılandırmasını test edilen taşıma katmanına kapsamlar; böylece Matrix, child yapılandırmasında `qa-channel` olmadan çalışır. Yapılandırılmış rapor varlıklarını ve birleştirilmiş stdout/stderr günlüğünü seçilen Matrix QA çıktı dizinine yazar. Dıştaki `scripts/run-node.mjs` derleme/başlatıcı çıktısını da yakalamak için
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` değerini depo yereline ait bir günlük dosyasına ayarlayın.

Taşıma katmanı gerçek bir Telegram smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa telegram
```

Bu hat, geçici sunucu sağlamak yerine tek bir gerçek özel Telegram grubunu hedefler.
`OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir; ayrıca aynı
özel grupta iki farklı bot gerekir. SUT botunun bir Telegram kullanıcı adı olmalıdır ve bottan bota
gözlem, her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode
etkin olduğunda en iyi çalışır.
Herhangi bir senaryo başarısız olduğunda komut sıfır dışı ile çıkar. Başarısız çıkış kodu olmadan varlıkları almak istediğinizde
`--allow-failures` kullanın.
Telegram raporu ve özeti, kanaryadan başlayarak sürücü mesajı
gönderme isteğinden gözlenen SUT yanıtına kadar yanıt başına RTT içerir.

Taşıma katmanı gerçek bir Discord smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa discord
```

Bu hat, iki botlu tek bir gerçek özel Discord sunucu kanalını hedefler: harness tarafından kontrol edilen bir
sürücü botu ve paketlenmiş Discord Plugin'i aracılığıyla child
OpenClaw gateway tarafından başlatılan bir SUT botu. Bunun için
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
ve env kimlik bilgileri kullanıldığında `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` gerekir.
Bu hat, kanal mention işleme davranışını doğrular ve SUT botunun
yerel `/help` komutunu Discord'a kaydettiğini kontrol eder.
Herhangi bir senaryo başarısız olduğunda komut sıfır dışı ile çıkar. Başarısız çıkış kodu olmadan varlıkları almak istediğinizde
`--allow-failures` kullanın.

Canlı taşıma hatları artık her birinin
kendi senaryo liste şeklini icat etmesi yerine daha küçük ortak bir sözleşmeyi paylaşıyor:

`qa-channel`, geniş sentetik ürün davranışı paketi olarak kalır ve
canlı taşıma kapsamı matrisinin parçası değildir.

| Hat      | Canary | Mention geçitlemesi | Allowlist engeli | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | Konu devam mesajı | Konu yalıtımı | Tepki gözlemi | Yardım komutu | Yerel komut kaydı |
| -------- | ------ | ------------------- | ---------------- | --------------- | --------------------------------- | ----------------- | ------------- | ------------- | ------------- | ----------------- |
| Matrix   | x      | x                   | x                | x               | x                                 | x                 | x             | x             |               |                   |
| Telegram | x      | x                   |                  |                 |                                   |                   |               |               | x             |                   |
| Discord  | x      | x                   |                  |                 |                                   |                   |               |               |               | x                 |

Bu, `qa-channel`'ı geniş ürün davranışı paketi olarak korurken Matrix,
Telegram ve gelecekteki canlı taşıma katmanlarının tek bir açık taşıma sözleşmesi kontrol listesini paylaşmasını sağlar.

QA yoluna Docker getirmeden geçici bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass guest başlatır, bağımlılıkları kurar, OpenClaw'ı
guest içinde derler, `qa suite` çalıştırır, ardından normal QA raporunu ve
özetini host üzerindeki `.artifacts/qa-e2e/...` içine geri kopyalar.
Host üzerindeki `qa suite` ile aynı senaryo seçme davranışını yeniden kullanır.
Host ve Multipass paket çalıştırmaları varsayılan olarak yalıtılmış gateway worker'ları ile seçilen birden çok senaryoyu paralel yürütür. `qa-channel` varsayılan olarak eşzamanlılık 4 kullanır; bu değer seçilen senaryo sayısıyla sınırlıdır. Worker sayısını ayarlamak için `--concurrency <count>`, seri yürütme için `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır dışı ile çıkar. Başarısız çıkış kodu olmadan varlıkları almak istediğinizde
`--allow-failures` kullanın.
Canlı çalıştırmalar, guest için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve
varsa `CODEX_HOME`. Guest'in bağlanmış çalışma alanı üzerinden geri yazabilmesi için `--output-dir` değerini depo kökü altında tutun.

## Depo destekli seed'ler

Seed varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar kasıtlı olarak git içinde tutulur; böylece QA planı hem insanlar hem de
ajan tarafından görünür olur.

`qa-lab` genel amaçlı bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası
tek bir test çalıştırması için doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo meta verileri
- isteğe bağlı kategori, yetenek, hat ve risk meta verileri
- belge ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı gateway yapılandırma yaması
- yürütülebilir `qa-flow`

`qa-flow`'u destekleyen yeniden kullanılabilir çalışma zamanı yüzeyinin genel
ve çapraz kesen kalmasına izin verilir. Örneğin markdown senaryoları, taşıma tarafı
yardımcılarını, Gateway `browser.request` seam'i üzerinden gömülü Control UI'yi süren tarayıcı tarafı yardımcılarla birleştirebilir; bunun için özel durumlu bir çalıştırıcı eklemek gerekmez.

Senaryo dosyaları kaynak ağaç klasörüne göre değil ürün yeteneğine göre gruplanmalıdır.
Dosyalar taşındığında senaryo kimliklerini kararlı tutun; uygulama izlenebilirliği için `docsRefs` ve `codeRefs` kullanın.

Temel liste şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- konu davranışı
- mesaj eylemi yaşam döngüsü
- Cron geri çağrıları
- bellek geri çağırma
- model değiştirme
- alt ajan devri
- depo okuma ve belge okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı sahte hatları

`qa suite` iki yerel sağlayıcı sahte hattına sahiptir:

- `mock-openai`, senaryo farkında OpenClaw sahte sağlayıcısıdır. Depo destekli QA ve eşitlik geçitleri için varsayılan
  deterministik sahte hat olmaya devam eder.
- `aimock`, deneysel protokol,
  fixture, record/replay ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Ek niteliğindedir ve `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında yaşar.
Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlatmasına, gateway model yapılandırmasına,
auth-profile hazırlama ihtiyaçlarına ve canlı/sahte yetenek bayraklarına sahiptir. Paylaşılan paket ve
gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirmelidir.

## Taşıma bağdaştırıcıları

`qa-lab`, markdown QA senaryoları için genel bir taşıma seam'ine sahiptir.
`qa-channel`, bu seam üzerindeki ilk bağdaştırıcıdır; ancak tasarım hedefi daha geniştir:
gelecekteki gerçek veya sentetik kanallar, taşımaya özgü bir QA çalıştırıcısı eklemek yerine aynı paket çalıştırıcısına bağlanmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütmeyi, worker eşzamanlılığını, varlık yazımını ve raporlamayı sahiplenir.
- taşıma bağdaştırıcısı, gateway yapılandırmasını, hazır oluşu, gelen ve giden gözlemi, taşıma eylemlerini ve normalize edilmiş taşıma durumunu sahiplenir.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini `qa-lab` sağlar.

Yeni kanal bağdaştırıcıları için bakımcı odaklı benimseme kılavuzu
[Testing](/tr/help/testing#adding-a-channel-to-qa) bölümünde yer alır.

## Raporlama

`qa-lab`, gözlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu soruları yanıtlamalıdır:

- Ne çalıştı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryolarını eklemeye değer

Karakter ve üslup kontrolleri için aynı senaryoyu birden çok canlı model
referansı üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
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

Komut, Docker değil, yerel QA gateway child süreçlerini çalıştırır. Karakter değerlendirme
senaryoları persona'yı `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı
ve küçük dosya görevleri gibi normal kullanıcı turlarını çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam transkripti korur,
temel çalıştırma istatistiklerini kaydeder, ardından desteklenen yerlerde `xhigh` akıl yürütme ile
hızlı modda yargıç modellerden çalıştırmaları doğallık, hava ve mizaha göre sıralamalarını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: yargıç istemi yine her transkripti ve
çalıştırma durumunu alır, ancak aday ref'leri `candidate-01` gibi nötr etiketlerle değiştirilir; rapor çözümlemeden sonra sıralamaları gerçek ref'lere geri eşler.

Aday çalıştırmalar varsayılan olarak `high` thinking kullanır; GPT-5.4 için `medium`,
bunu destekleyen eski OpenAI değerlendirme ref'leri için `xhigh` kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` hâlâ
genel bir fallback ayarlar ve eski `--model-thinking <provider/model=level>` biçimi uyumluluk için korunur.
OpenAI aday ref'leri varsayılan olarak hızlı mod kullanır; böylece sağlayıcının desteklediği yerlerde
öncelikli işleme kullanılır. Tek bir aday veya yargıç için geçersiz kılma gerektiğinde satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin. Yalnızca her aday model için hızlı modu zorla açmak istediğinizde `--fast` geçin. Aday ve yargıç süreleri kıyaslama analizi için rapora kaydedilir, ancak yargıç istemleri açıkça hıza göre sıralama yapmamalarını söyler.

Hem aday hem de yargıç model çalıştırmaları varsayılan olarak 16 eşzamanlılık kullanır. Sağlayıcı sınırları veya yerel gateway baskısı bir çalıştırmayı çok gürültülü hâle getiriyorsa `--concurrency` veya `--judge-concurrency` değerlerini düşürün.
Hiç aday `--model` geçilmezse karakter değerlendirme varsayılan olarak
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
Hiç `--judge-model` geçilmezse yargıçlar varsayılan olarak
`openai/gpt-5.4,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili belgeler

- [Testing](/tr/help/testing)
- [QA Channel](/tr/channels/qa-channel)
- [Dashboard](/tr/web/dashboard)

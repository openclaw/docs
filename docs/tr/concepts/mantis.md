---
read_when:
    - OpenClaw hataları için canlı görsel QA oluşturma veya çalıştırma
    - Bir çekme isteği için önce ve sonra doğrulama ekleme
    - Discord, Slack, WhatsApp veya diğer canlı taşıma senaryoları ekleme
    - Ekran görüntüleri, tarayıcı otomasyonu veya VNC erişimi gerektiren QA çalıştırmalarında hata ayıklama
summary: Mantis, OpenClaw hatalarını canlı iletim kanallarında yeniden üretmek, öncesi ve sonrası kanıtları yakalamak ve artefaktları PR'lere eklemek için kullanılan görsel uçtan uca doğrulama sistemidir.
title: Peygamberdevesi
x-i18n:
    generated_at: "2026-05-05T06:16:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis, gerçek bir çalışma zamanı, gerçek bir taşıma ve görünür kanıt gerektiren hatalar için OpenClaw uçtan uca doğrulama sistemidir. Kötü olduğu bilinen bir referansa karşı bir senaryo çalıştırır, kanıtları yakalar, aynı senaryoyu bir aday referansa karşı çalıştırır ve karşılaştırmayı, bir bakımcının bir PR'dan veya yerel bir komuttan inceleyebileceği yapıtlar olarak yayımlar.

Mantis, Discord ile başlar çünkü Discord bize yüksek değerli bir ilk hat sağlar: gerçek bot kimlik doğrulaması, gerçek sunucu kanalları, tepkiler, ileti dizileri, yerel komutlar ve insanların taşımanın ne gösterdiğini görsel olarak doğrulayabileceği bir tarayıcı arayüzü.

## Hedefler

- Bir GitHub sorunu veya PR'daki bir hatayı, kullanıcıların gördüğü aynı taşıma biçimiyle yeniden üretmek.
- Düzeltmeyi uygulamadan önce temel referansta bir **önce** yapıtı yakalamak.
- Düzeltmeyi uyguladıktan sonra aday referansta bir **sonra** yapıtı yakalamak.
- Mümkün olduğunda Discord REST tepkisi okuması veya kanal dökümü denetimi gibi deterministik bir doğrulama ölçütü kullanmak.
- Hatanın görünür bir UI yüzeyi olduğunda ekran görüntüleri yakalamak.
- Bir aracı kontrollü CLI'dan yerel olarak ve GitHub'dan uzaktan çalıştırmak.
- Oturum açma, tarayıcı otomasyonu veya sağlayıcı kimlik doğrulaması takıldığında VNC kurtarması için yeterli makine durumunu korumak.
- Çalıştırma engellendiğinde, manuel VNC yardımı gerektiğinde veya bittiğinde bir operatör Discord kanalına kısa durum göndermek.

## Hedef Dışı

- Mantis, birim testlerinin yerine geçmez. Bir Mantis çalıştırması, düzeltme anlaşıldıktan sonra genellikle daha küçük bir regresyon testi haline gelmelidir.
- Mantis, normal hızlı CI kapısı değildir. Daha yavaştır, canlı kimlik bilgileri kullanır ve canlı ortamın önemli olduğu hatalar için ayrılmıştır.
- Mantis normal çalışmada insan gerektirmemelidir. Manuel VNC, mutlu yol değil bir kurtarma yoludur.
- Mantis, ham gizli bilgileri yapıtlarda, günlüklerde, ekran görüntülerinde, Markdown raporlarında veya PR yorumlarında saklamaz.

## Sahiplik

Mantis, OpenClaw QA yığınında bulunur.

- OpenClaw, `pnpm openclaw qa mantis` altındaki senaryo çalışma zamanına, taşıma bağdaştırıcılarına, kanıt şemasına ve yerel CLI'a sahiptir.
- QA Lab, canlı taşıma koşum parçalarına, tarayıcı yakalama yardımcılarına ve yapıt yazıcılarına sahiptir.
- Crabbox, uzak bir VM gerektiğinde ısıtılmış Linux makinelerine sahiptir.
- GitHub Actions, uzak iş akışı giriş noktasına ve yapıt saklamaya sahiptir.
- ClawSweeper, GitHub yorum yönlendirmesine sahiptir: bakımcı komutlarını ayrıştırma, iş akışını gönderme ve son PR yorumunu gönderme.
- OpenClaw aracıları, bir senaryo aracılı kurulum, hata ayıklama veya takılı durum raporlaması gerektirdiğinde Codex üzerinden Mantis'i yürütür.

Bu sınır, taşıma bilgisini OpenClaw'da, makine zamanlamasını Crabbox'ta ve bakımcı iş akışı bağlayıcısını ClawSweeper'da tutar.

## Komut Biçimi

İlk yerel komut Discord botunu, sunucuyu, kanalı, mesaj göndermeyi, tepki göndermeyi ve yapıt yolunu doğrular:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Yerel önce ve sonra çalıştırıcısı şu biçimi kabul eder:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Çalıştırıcı, çıktı dizini altında ayrılmış temel referans ve aday çalışma ağaçları oluşturur, bağımlılıkları kurar, her referansı derler, senaryoyu `--allow-failures` ile çalıştırır, ardından `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` yazar. İlk Discord senaryosu için başarılı bir doğrulama, temel referans durumunun `fail` ve aday durumunun `pass` olduğu anlamına gelir.

İlk VM/tarayıcı ilkeli masaüstü duman testidir:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Bir Crabbox masaüstü makinesini kiralar veya yeniden kullanır, VNC oturumu içinde görünür bir tarayıcı başlatır, masaüstünü yakalar, yapıtları yerel çıktı dizinine geri çeker ve yeniden bağlanma komutunu rapora yazar. Komut varsayılan olarak Hetzner sağlayıcısını kullanır çünkü Mantis hattında çalışan masaüstü/VNC kapsamına sahip ilk sağlayıcı odur. Başka bir Crabbox filosuna karşı çalıştırırken bunu `--provider`, `--crabbox-bin` veya `OPENCLAW_MANTIS_CRABBOX_PROVIDER` ile geçersiz kılın.

Yararlı masaüstü duman testi bayrakları:

- `--lease-id <cbx_...>` veya `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ısıtılmış bir masaüstünü yeniden kullanır.
- `--browser-url <url>` görünür tarayıcıda açılan sayfayı değiştirir.
- `--html-file <path>` repo yerelindeki bir HTML yapıtını görünür tarayıcıda işler. Mantis bunu, oluşturulan Discord durum-tepki zaman çizelgesini gerçek bir Crabbox masaüstü üzerinden yakalamak için kullanır.
- `--keep-lease` veya `OPENCLAW_MANTIS_KEEP_VM=1`, yeni oluşturulan başarılı bir kiralamayı VNC incelemesi için açık tutar. Başarısız çalıştırmalar, bir operatörün yeniden bağlanabilmesi için oluşturulmuşsa kiralamayı varsayılan olarak tutar.
- `--class`, `--idle-timeout` ve `--ttl` makine boyutunu ve kiralama ömrünü ayarlar.

İlk tam masaüstü taşıma ilkeli Slack masaüstü duman testidir:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bir Crabbox masaüstü makinesini kiralar veya yeniden kullanır, mevcut checkout'u VM içine senkronize eder, VM içinde `pnpm openclaw qa slack` çalıştırır, VNC tarayıcısında Slack Web'i açar, görünür masaüstünü yakalar ve hem Slack QA yapıtlarını hem de VNC ekran görüntüsünü yerel çıktı dizinine kopyalar. Bu, SUT OpenClaw Gateway'in ve tarayıcının aynı Linux masaüstü VM içinde yaşadığı ilk Mantis biçimidir.

`--gateway-setup` ile komut `$HOME/.openclaw-mantis/slack-openclaw` konumunda kalıcı ve atılabilir bir OpenClaw ana dizini hazırlar, seçilen kanal için Slack Socket Mode yapılandırmasını yamalar, `38973` portunda `openclaw gateway run` başlatır ve Chrome'u VNC oturumunda çalışır halde tutar. Bu, "bana Slack ve çalışan bir claw olan bir Linux masaüstü bırak" modudur; `--gateway-setup` atlandığında bot-bota Slack QA hattı varsayılan olarak kalır.

`--credential-source env` için gerekli girdiler:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- Uzak model hattı için `OPENCLAW_LIVE_OPENAI_KEY`. Yerel olarak yalnızca `OPENAI_API_KEY` ayarlanmışsa, Mantis Crabbox'ı çağırmadan önce bunu `OPENCLAW_LIVE_OPENAI_KEY` olarak eşler; böylece Crabbox'ın `OPENCLAW_*` env iletimi bunu VM içine taşıyabilir.

Yararlı Slack masaüstü bayrakları:

- `--lease-id <cbx_...>` bir operatörün VNC üzerinden Slack Web'e zaten giriş yaptığı bir makineye karşı yeniden çalıştırır.
- `--gateway-setup`, yalnızca bot-bota QA hattını çalıştırmak yerine VM içinde kalıcı bir OpenClaw Slack Gateway başlatır.
- `--slack-url <url>` belirli bir Slack Web URL'si açar. Bu olmadan Mantis, SUT bot tokenı kullanılabilir olduğunda Slack `auth.test` üzerinden `https://app.slack.com/client/<team>/<channel>` türetir.
- `--slack-channel-id <id>` Gateway kurulumu tarafından kullanılan Slack kanal izin listesini denetler.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` VM içindeki kalıcı Chrome profilini denetler. Varsayılan `$HOME/.config/openclaw-mantis/slack-chrome-profile` olduğundan, manuel Slack Web oturumu aynı kiralamadaki yeniden çalıştırmalarda korunur.
- `--credential-source convex --credential-role ci` doğrudan Slack env tokenları yerine paylaşılan kimlik bilgisi havuzunu kullanır.
- `--provider-mode`, `--model`, `--alt-model` ve `--fast` Slack canlı hattına aktarılır.

GitHub duman testi iş akışı `Mantis Discord Smoke` adındadır. İlk gerçek senaryo için önce ve sonra GitHub iş akışı `Mantis Discord Status Reactions` adındadır. Şunları kabul eder:

- `baseline_ref`: yalnızca kuyruğa alınmış davranışı yeniden üretmesi beklenen referans.
- `candidate_ref`: `queued -> thinking -> done` göstermesi beklenen referans.

İş akışı koşum referansını checkout eder, ayrı temel referans ve aday çalışma ağaçları derler, her çalışma ağacına karşı `discord-status-reactions-tool-only` çalıştırır ve `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` dosyalarını Actions yapıtları olarak yükler. Ayrıca her hattın zaman çizelgesi HTML'ini bir Crabbox masaüstü tarayıcısında işler ve bu VNC ekran görüntülerini deterministik zaman çizelgesi PNG'lerinin yanında PR yorumunda yayımlar. Aynı PR yorumu, VNC tarayıcı işlemesi sırasında yakalanan masaüstü MP4 kayıtlarına bağlantı verir; ekran görüntüleri ise hızlı inceleme için satır içinde kalır. İş akışı, bir sonraki Crabbox ikili sürümü çıkarılmadan önce mevcut masaüstü/tarayıcı kiralama bayraklarını kullanabilmek için Crabbox CLI'ını `openclaw/crabbox` main dalından derler.

Durum-tepkileri çalıştırmasını doğrudan bir PR yorumundan da tetikleyebilirsiniz:

```text
@Mantis discord status reactions
```

Yorum tetikleyicisi kasıtlı olarak dardır. Yalnızca yazma, bakım veya yönetici erişimi olan kullanıcıların pull request yorumlarında çalışır ve yalnızca Discord durum-tepki isteklerini tanır. Varsayılan olarak bilinen kötü temel referansı ve mevcut PR head SHA'sını aday olarak kullanır. Bakımcılar iki referanstan birini geçersiz kılabilir:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper komut örnekleri:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

İlk komut açıktır ve senaryo odaklıdır. İkincisi daha sonra bir PR'ı veya sorunu etiketlerden, değişen dosyalardan ve ClawSweeper inceleme bulgularından önerilen Mantis senaryolarına eşleyebilir.

## Çalıştırma Yaşam Döngüsü

1. Kimlik bilgilerini edin.
2. Bir VM ayır veya yeniden kullan.
3. Senaryo UI kanıtı gerektirdiğinde masaüstü/tarayıcı profilini hazırla.
4. Temel referans için temiz bir checkout hazırla.
5. Bağımlılıkları kur ve yalnızca senaryonun ihtiyaç duyduklarını derle.
6. Yalıtılmış durum diziniyle bir alt OpenClaw Gateway başlat.
7. Canlı taşımayı, sağlayıcıyı, modeli ve tarayıcı profilini yapılandır.
8. Senaryoyu çalıştır ve temel referans kanıtını yakala.
9. Gateway'i durdur ve günlükleri koru.
10. Aday referansı aynı VM içinde hazırla.
11. Aynı senaryoyu çalıştır ve aday kanıtını yakala.
12. Doğrulama ölçütü sonuçlarını ve görsel kanıtları karşılaştır.
13. Markdown, JSON, günlükler, ekran görüntüleri ve isteğe bağlı iz yapıtları yaz.
14. GitHub Actions yapıtlarını yükle.
15. Kısa bir PR veya Discord durum mesajı gönder.

Senaryo iki farklı şekilde başarısız olabilmelidir:

- **Hata yeniden üretildi**: temel referans beklenen şekilde başarısız oldu.
- **Koşum hatası**: ortam kurulumu, kimlik bilgileri, Discord API, tarayıcı veya sağlayıcı, hata doğrulama ölçütü anlamlı hale gelmeden önce başarısız oldu.

Son rapor bu durumları ayırmalıdır; böylece bakımcılar kesintili bir ortamı ürün davranışıyla karıştırmaz.

## Discord MVP

İlk senaryo, kaynak yanıt teslim modu `message_tool_only` olan sunucu kanallarındaki Discord durum tepkilerini hedeflemelidir.

İyi bir Mantis tohumu olmasının nedenleri:

- Discord'da tetikleyen mesaj üzerindeki tepkiler olarak görünür.
- Discord mesaj tepki durumu üzerinden güçlü bir REST doğrulama ölçütüne sahiptir.
- Gerçek bir OpenClaw Gateway'i, Discord bot kimlik doğrulamasını, mesaj dağıtımını, kaynak yanıt teslim modunu, durum tepki durumunu ve model turu yaşam döngüsünü çalıştırır.
- İlk uygulamayı dürüst tutacak kadar dardır.

Beklenen senaryo biçimi:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Temel referans kanıtı, sıraya alınmış onay tepkisini göstermeli ancak yalnızca araç modunda yaşam döngüsü geçişi göstermemelidir. Aday kanıtı, `messages.statusReactions.enabled` açıkça `true` olduğunda yaşam döngüsü durum tepkilerinin çalıştığını göstermelidir.

Yürütülebilir ilk dilim, isteğe bağlı Discord canlı QA senaryosudur:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Bu, SUT'yi her zaman açık guild işleme, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` ve açık durum tepkileriyle yapılandırır. Doğrulayıcı,
gerçek Discord tetikleyici mesajını yoklar ve gözlemlenen sıranın
`👀 -> 🤔 -> 👍` olmasını bekler. Artifacts arasında `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` ve
`discord-status-reactions-tool-only-timeline.png` bulunur.

## Mevcut QA Parçaları

Mantis, sıfırdan başlamak yerine mevcut özel QA yığınının üzerine kurulmalıdır:

- `pnpm openclaw qa discord` zaten sürücü ve SUT botlarıyla canlı bir Discord hattı çalıştırır.
- Canlı taşıma çalıştırıcısı zaten raporları ve gözlemlenen mesaj
  artifacts'larını `.artifacts/qa-e2e/` altında yazar.
- Convex kimlik bilgisi kiraları, paylaşılan canlı taşıma kimlik bilgilerine zaten özel erişim sağlar.
- Tarayıcı denetim servisi zaten ekran görüntülerini, anlık görüntüleri,
  başsız yönetilen profilleri ve uzak CDP profillerini destekler.
- QA Lab'de taşıma biçimli testler için zaten bir hata ayıklayıcı UI'ı ve veri yolu vardır.

İlk Mantis uygulaması, bu parçaların üzerinde ince bir önce/sonra çalıştırıcısı
ve ek bir görsel kanıt katmanı olabilir.

## Kanıt Modeli

Her çalıştırma kararlı bir artifact dizini yazar:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json`, makine tarafından okunabilir doğruluk kaynağı olmalıdır.
Markdown raporu PR yorumları ve insan incelemesi içindir.

Özet şunları içermelidir:

- test edilen ref'ler ve SHA'lar
- taşıma ve senaryo kimliği
- makine sağlayıcısı ve makine kimliği ya da kira kimliği
- gizli değerler olmadan kimlik bilgisi kaynağı
- baseline sonucu
- candidate sonucu
- hatanın baseline üzerinde yeniden üretilip üretilmediği
- candidate'ın bunu düzeltip düzeltmediği
- artifact yolları
- temizlenmiş kurulum veya temizlik sorunları

Ekran görüntüleri kanıttır, sır değildir. Yine de redaksiyon disiplini gerekir:
özel kanal adları, kullanıcı adları veya mesaj içeriği görünebilir. Genel PR'lar için,
redaksiyon yaklaşımı güçlenene kadar satır içi görseller yerine GitHub Actions artifact bağlantılarını tercih edin.

## Tarayıcı ve VNC

Tarayıcı hattının iki modu vardır:

- **Başsız otomasyon**: CI için varsayılan. Chrome, CDP etkin şekilde çalışır ve
  Playwright ya da OpenClaw tarayıcı denetimi ekran görüntüleri yakalar.
- **VNC kurtarma**: oturum açma, MFA, Discord otomasyon karşıtı önlemler
  veya görsel hata ayıklama bir insan gerektirdiğinde aynı VM üzerinde etkinleştirilir.

Discord gözlemci tarayıcı profili, her çalıştırmada oturum açmayı önleyecek kadar
kalıcı olmalı, ancak kişisel tarayıcı durumundan izole edilmelidir. Bir profil
geliştirici dizüstü bilgisayarına değil, Mantis makine havuzuna aittir.

Mantis takıldığında şu bilgilerle bir Discord durum mesajı gönderir:

- çalıştırma kimliği
- senaryo kimliği
- makine sağlayıcısı
- artifact dizini
- varsa VNC veya noVNC bağlantı talimatları
- kısa engelleyici metni

İlk özel dağıtım bu mesajları mevcut operatör kanalına gönderebilir ve daha sonra
ayrı bir Mantis kanalına geçebilir.

## Makineler

Mantis, ilk uzak uygulama için Crabbox üzerinden AWS'yi tercih etmelidir.
Crabbox bize ısıtılmış makineler, kira takibi, hidrasyon, günlükler, sonuçlar ve
temizlik sağlar. AWS kapasitesi çok yavaşsa veya kullanılamıyorsa, aynı makine
arayüzünün arkasına bir Hetzner sağlayıcısı ekleyin.

Asgari VM gereksinimleri:

- masaüstü destekli Chrome veya Chromium kurulumu olan Linux
- tarayıcı otomasyonu için CDP erişimi
- kurtarma için VNC veya noVNC
- Node 22 ve pnpm
- OpenClaw checkout'u ve bağımlılık önbelleği
- Playwright kullanıldığında Playwright Chromium tarayıcı önbelleği
- bir OpenClaw Gateway, bir tarayıcı ve bir model çalıştırması için yeterli CPU ve bellek
- Discord, GitHub, model sağlayıcıları ve kimlik bilgisi aracısına dışa giden erişim

VM, beklenen kimlik bilgisi veya tarayıcı profili depoları dışında uzun ömürlü ham sırlar tutmamalıdır.

## Sırlar

Sırlar, uzak çalıştırmalar için GitHub kuruluş veya depo sırlarında, yerel çalıştırmalar için
yerel operatör denetimli sır dosyasında bulunur.

Önerilen sır adları:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- genel GitHub artifact yüklemeleri için `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Uzun vadede, Convex kimlik bilgisi havuzu canlı taşıma kimlik bilgileri için
normal kaynak olarak kalmalıdır. GitHub sırları, aracı ve yedek hatları başlatır.
Discord durum tepkileri workflow'u, Mantis Crabbox sırlarını Crabbox CLI'ın
beklediği `CRABBOX_COORDINATOR` ve `CRABBOX_COORDINATOR_TOKEN` ortam değişkenlerine
geri eşler. Düz `CRABBOX_*` GitHub sır adları uyumluluk yedeği olarak kabul edilmeye devam eder.

Mantis çalıştırıcısı asla şunları yazdırmamalıdır:

- Discord bot token'ları
- sağlayıcı API anahtarları
- tarayıcı çerezleri
- kimlik doğrulama profili içerikleri
- VNC parolaları
- ham kimlik bilgisi yükleri

Genel artifact yüklemeleri ayrıca bot, guild, kanal ve mesaj kimlikleri gibi Discord hedef meta verilerini de redakte etmelidir. GitHub smoke workflow'u bu nedenle
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` değerini etkinleştirir.

Bir token yanlışlıkla bir issue'ya, PR'a, sohbete veya günlüğe yapıştırılırsa,
yeni sır saklandıktan sonra onu döndürün.

## GitHub Artifacts ve PR Yorumları

Mantis workflow'ları tam kanıt paketini kısa ömürlü bir Actions artifact'ı olarak yüklemelidir.
Workflow bir hata raporu veya düzeltme PR'ı için çalıştırıldığında, redakte edilmiş PNG ekran görüntülerini
`qa-artifacts` dalına yayımlamalı ve ilgili hata ya da düzeltme PR'ında satır içi önce/sonra ekran görüntüleriyle bir yorum eklemeli ya da güncellemelidir. Birincil kanıtı yalnızca genel bir QA otomasyonu PR'ında paylaşmayın. Ham günlükler, gözlemlenen
mesajlar ve diğer hacimli kanıtlar Actions artifact'ında kalır.

Üretim workflow'ları bu yorumları `github-actions[bot]` ile değil, Mantis GitHub App ile göndermelidir.
Uygulama kimliğini ve özel anahtarı `MANTIS_GITHUB_APP_ID` ve `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions
sırları olarak saklayın. Workflow, güncelleme anahtarı olarak gizli bir işaret kullanır, token düzenleyebildiğinde
bu yorumu günceller ve eski bot sahipli bir işaret düzenlenemediğinde Mantis sahipli yeni bir yorum oluşturur.

PR yorumu kısa ve görsel olmalıdır:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Çalıştırma, harness başarısız olduğu için başarısız olursa yorum, candidate'ın başarısız olduğunu ima etmek
yerine bunu söylemelidir.

## Özel Dağıtım Notları

Özel bir dağıtımda zaten bir Mantis Discord uygulaması olabilir. Doğru bot
izinlerine sahipse ve güvenli şekilde döndürülebiliyorsa, başka bir uygulama oluşturmak yerine onu yeniden kullanın.

İlk operatör bildirim kanalını sırlar veya dağıtım yapılandırması üzerinden ayarlayın.
Önce mevcut bir maintainer veya operasyon kanalını gösterebilir, sonra bir tane oluşturulduğunda
ayrı bir Mantis kanalına taşınabilir.

Bu belgeye guild kimlikleri, kanal kimlikleri, bot token'ları, tarayıcı çerezleri veya VNC parolaları koymayın.
Bunları GitHub sırlarında, kimlik bilgisi aracısında veya operatörün yerel sır deposunda saklayın.

## Senaryo Ekleme

Bir Mantis senaryosu şunları bildirmelidir:

- kimlik ve başlık
- taşıma
- gerekli kimlik bilgileri
- baseline ref ilkesi
- candidate ref ilkesi
- OpenClaw yapılandırma patch'i
- kurulum adımları
- uyarıcı
- beklenen baseline doğrulayıcısı
- beklenen candidate doğrulayıcısı
- görsel yakalama hedefleri
- zaman aşımı bütçesi
- temizlik adımları

Senaryolar küçük, türlendirilmiş doğrulayıcıları tercih etmelidir:

- tepki hataları için Discord tepki durumu
- iş parçacığı hataları için Discord mesaj referansları
- Slack hataları için Slack thread ts ve reaction API durumu
- e-posta hataları için e-posta mesaj kimlikleri ve başlıkları
- UI tek güvenilir gözlemlenebilir olduğunda tarayıcı ekran görüntüleri

Görsel kontroller eklemeli olmalıdır. Bir platform API'si hatayı kanıtlayabiliyorsa,
geçti/kaldı doğrulayıcısı olarak API'yi kullanın ve ekran görüntülerini insan güveni için saklayın.

## Sağlayıcı Genişletme

Discord'dan sonra aynı çalıştırıcı şunları ekleyebilir:

- Slack: tepkiler, iş parçacıkları, uygulama bahsetmeleri, modallar, dosya yüklemeleri.
- E-posta: bağlayıcıların yeterli olmadığı yerlerde `gog` kullanarak Gmail kimlik doğrulaması ve mesaj iş parçacığı.
- WhatsApp: QR ile oturum açma, yeniden tanımlama, mesaj teslimi, medya, tepkiler.
- Telegram: grup bahsetme denetimi, komutlar, mevcut olduğunda tepkiler.
- Matrix: şifreli odalar, iş parçacığı veya yanıt ilişkileri, yeniden başlatma sonrası sürdürme.

Her taşımanın bir ucuz smoke senaryosu ve bir ya da daha fazla hata sınıfı senaryosu olmalıdır.
Pahalı görsel senaryolar isteğe bağlı kalmalıdır.

## Açık Sorular

- Mevcut Mantis botu yeniden kullanıldığında, hangi Discord botu sürücü, hangisi SUT olmalıdır?
- Gözlemci tarayıcı oturumu ilk aşamada bir insan Discord hesabı mı, bir test hesabı mı,
  yoksa yalnızca bot tarafından okunabilir REST kanıtı mı kullanmalıdır?
- GitHub, PR'lar için Mantis artifacts'larını ne kadar süre saklamalıdır?
- ClawSweeper, bir maintainer komutunu beklemek yerine ne zaman otomatik olarak Mantis önermelidir?
- Genel PR'lar için ekran görüntüleri yüklemeden önce redakte edilmeli mi yoksa kırpılmalı mı?

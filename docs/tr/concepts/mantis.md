---
read_when:
    - OpenClaw hataları için canlı görsel QA oluşturma veya çalıştırma
    - Bir çekme isteği için öncesi ve sonrası doğrulama ekleme
    - Discord, Slack, WhatsApp veya diğer canlı aktarım senaryoları ekleme
    - Ekran görüntüleri, tarayıcı otomasyonu veya VNC erişimi gerektiren QA çalıştırmalarında hata ayıklama
summary: Mantis, canlı taşımalarda OpenClaw hatalarını yeniden üretmek, önce ve sonra kanıtlarını yakalamak ve artefaktları PR’lere eklemek için kullanılan görsel uçtan uca doğrulama sistemidir.
title: Peygamberdevesi
x-i18n:
    generated_at: "2026-05-04T07:03:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis, gerçek bir runtime, gerçek bir aktarım ve görünür kanıt gerektiren hatalar için OpenClaw uçtan uca doğrulama sistemidir. Bilinen kötü bir ref üzerinde bir senaryo çalıştırır, kanıtları yakalar, aynı senaryoyu aday ref üzerinde çalıştırır ve karşılaştırmayı bir bakımcının PR üzerinden veya yerel bir komuttan inceleyebileceği artifact'ler olarak yayımlar.

Mantis, Discord ile başlar çünkü Discord bize yüksek değerli bir ilk kulvar sağlar: gerçek bot kimlik doğrulaması, gerçek guild kanalları, reaksiyonlar, thread'ler, yerel komutlar ve insanların aktarımın ne gösterdiğini görsel olarak doğrulayabileceği bir tarayıcı UI'ı.

## Hedefler

- Bir GitHub issue'su veya PR'ındaki hatayı kullanıcıların gördüğü aynı aktarım şekliyle yeniden üretmek.
- Düzeltmeyi uygulamadan önce baseline ref üzerinde bir **önce** artifact'i yakalamak.
- Düzeltmeyi uyguladıktan sonra aday ref üzerinde bir **sonra** artifact'i yakalamak.
- Mümkün olduğunda Discord REST reaksiyon okuması veya kanal transcript kontrolü gibi deterministik bir oracle kullanmak.
- Hatanın görünür bir UI yüzeyi olduğunda ekran görüntüleri yakalamak.
- Agent kontrollü bir CLI'dan yerel olarak ve GitHub'dan uzaktan çalışmak.
- Giriş, tarayıcı otomasyonu veya sağlayıcı kimlik doğrulaması takıldığında VNC kurtarması için yeterli makine durumunu korumak.
- Çalıştırma engellendiğinde, manuel VNC yardımı gerektiğinde veya tamamlandığında operatör Discord kanalına kısa durum göndermek.

## Hedef Olmayanlar

- Mantis birim testlerinin yerine geçmez. Bir Mantis çalıştırması genellikle düzeltme anlaşıldıktan sonra daha küçük bir regresyon testine dönüşmelidir.
- Mantis normal hızlı CI kapısı değildir. Daha yavaştır, canlı kimlik bilgileri kullanır ve canlı ortamın önemli olduğu hatalar için ayrılmıştır.
- Mantis normal çalışmada insan gerektirmemelidir. Manuel VNC mutlu yol değil, bir kurtarma yoludur.
- Mantis artifact'lerde, log'larda, ekran görüntülerinde, Markdown raporlarında veya PR yorumlarında ham sırları saklamaz.

## Sahiplik

Mantis, OpenClaw QA yığınında yaşar.

- OpenClaw, senaryo runtime'ına, aktarım adapter'larına, kanıt şemasına ve `pnpm openclaw qa mantis` altındaki yerel CLI'a sahiptir.
- QA Lab, canlı aktarım harness parçalarına, tarayıcı yakalama yardımcılarına ve artifact yazıcılarına sahiptir.
- Crabbox, uzak VM gerektiğinde ısıtılmış Linux makinelerine sahiptir.
- GitHub Actions, uzak workflow giriş noktasına ve artifact saklamaya sahiptir.
- ClawSweeper, GitHub yorum yönlendirmesine sahiptir: bakımcı komutlarını ayrıştırma, workflow'u dispatch etme ve son PR yorumunu gönderme.
- OpenClaw agent'ları, bir senaryo agentic kurulum, hata ayıklama veya takılı durum raporlaması gerektirdiğinde Mantis'i Codex üzerinden yürütür.

Bu sınır aktarım bilgisini OpenClaw'da, makine zamanlamasını Crabbox'ta ve bakımcı workflow yapıştırıcısını ClawSweeper'da tutar.

## Komut Yapısı

İlk yerel komut Discord botunu, guild'i, kanalı, mesaj gönderimini, reaksiyon gönderimini ve artifact yolunu doğrular:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Yerel önce ve sonra çalıştırıcısı bu şekli kabul eder:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Çalıştırıcı çıktı dizini altında ayrık baseline ve candidate worktree'leri oluşturur, bağımlılıkları kurar, her ref'i build eder, senaryoyu `--allow-failures` ile çalıştırır, ardından `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` yazar. İlk Discord senaryosu için başarılı bir doğrulama, baseline durumunun `fail` ve candidate durumunun `pass` olması demektir.

İlk VM/tarayıcı primitive'i masaüstü smoke'tur:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Bir Crabbox masaüstü makinesini kiralar veya yeniden kullanır, VNC oturumunda görünür bir tarayıcı başlatır, masaüstünü yakalar, artifact'leri yerel çıktı dizinine geri çeker ve yeniden bağlanma komutunu rapora yazar. Komut varsayılan olarak Hetzner sağlayıcısını kullanır çünkü Mantis kulvarında çalışan masaüstü/VNC kapsamına sahip ilk sağlayıcı odur. Başka bir Crabbox filosuna karşı çalıştırırken bunu `--provider`, `--crabbox-bin` veya `OPENCLAW_MANTIS_CRABBOX_PROVIDER` ile geçersiz kılın.

Yararlı masaüstü smoke bayrakları:

- `--lease-id <cbx_...>` veya `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ısıtılmış bir masaüstünü yeniden kullanır.
- `--browser-url <url>` görünür tarayıcıda açılan sayfayı değiştirir.
- `--html-file <path>` repo-yerel bir HTML artifact'ini görünür tarayıcıda render eder. Mantis bunu, oluşturulan Discord durum reaksiyonu zaman çizelgesini gerçek bir Crabbox masaüstü üzerinden yakalamak için kullanır.
- `--keep-lease` veya `OPENCLAW_MANTIS_KEEP_VM=1` yeni oluşturulan başarılı bir lease'i VNC incelemesi için açık tutar. Başarısız çalıştırmalar, bir operatörün yeniden bağlanabilmesi için bir lease oluşturulduysa varsayılan olarak lease'i tutar.
- `--class`, `--idle-timeout` ve `--ttl` makine boyutunu ve lease ömrünü ayarlar.

İlk tam masaüstü aktarım primitive'i Slack masaüstü smoke'tur:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bir Crabbox masaüstü makinesini kiralar veya yeniden kullanır, mevcut checkout'u VM içine sync eder, o VM içinde `pnpm openclaw qa slack` çalıştırır, VNC tarayıcısında Slack Web'i açar, görünür masaüstünü yakalar ve hem Slack QA artifact'lerini hem de VNC ekran görüntüsünü yerel çıktı dizinine kopyalar. Bu, SUT OpenClaw gateway'in ve tarayıcının aynı Linux masaüstü VM içinde yaşadığı ilk Mantis şeklidir.

`--gateway-setup` ile komut `$HOME/.openclaw-mantis/slack-openclaw` konumunda kalıcı ve tek kullanımlık bir OpenClaw home hazırlar, seçilen kanal için Slack Socket Mode yapılandırmasını yamalar, `38973` portunda `openclaw gateway run` başlatır ve Chrome'u VNC oturumunda çalışır durumda tutar. Bu, "bana Slack ve çalışan bir claw içeren bir Linux masaüstü bırak" modudur; `--gateway-setup` atlandığında bot-to-bot Slack QA kulvarı varsayılan kalır.

`--credential-source env` için gerekli girdiler:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- Uzak model kulvarı için `OPENCLAW_LIVE_OPENAI_KEY`. Yerelde yalnızca `OPENAI_API_KEY` ayarlıysa Mantis, Crabbox'ı çağırmadan önce bunu `OPENCLAW_LIVE_OPENAI_KEY` olarak eşler; böylece Crabbox'ın `OPENCLAW_*` env iletimi bunu VM içine taşıyabilir.

Yararlı Slack masaüstü bayrakları:

- `--lease-id <cbx_...>` bir operatörün VNC üzerinden Slack Web'e zaten giriş yaptığı makineye karşı yeniden çalıştırır.
- `--gateway-setup` yalnızca bot-to-bot QA kulvarını çalıştırmak yerine VM içinde kalıcı bir OpenClaw Slack gateway başlatır.
- `--slack-url <url>` belirli bir Slack Web URL'si açar. Bu olmadan Mantis, SUT bot token'ı mevcut olduğunda Slack `auth.test` üzerinden `https://app.slack.com/client/<team>/<channel>` türetir.
- `--slack-channel-id <id>` gateway kurulumu tarafından kullanılan Slack kanal allowlist'ini kontrol eder.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` VM içindeki kalıcı Chrome profilini kontrol eder. Varsayılan `$HOME/.config/openclaw-mantis/slack-chrome-profile` olduğundan manuel Slack Web girişi aynı lease üzerinde yeniden çalıştırmalarda korunur.
- `--credential-source convex --credential-role ci` doğrudan Slack env token'ları yerine paylaşılan kimlik bilgisi havuzunu kullanır.
- `--provider-mode`, `--model`, `--alt-model` ve `--fast` Slack canlı kulvarına iletilir.

GitHub smoke workflow'u `Mantis Discord Smoke`'tur. İlk gerçek senaryo için önce ve sonra GitHub workflow'u `Mantis Discord Status Reactions`'tır. Şunları kabul eder:

- `baseline_ref`: queued-only davranışını yeniden üretmesi beklenen ref.
- `candidate_ref`: `queued -> thinking -> done` göstermesi beklenen ref.

Workflow harness ref'ini checkout eder, ayrı baseline ve candidate worktree'leri build eder, her worktree'ye karşı `discord-status-reactions-tool-only` çalıştırır ve `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` dosyalarını Actions artifact'leri olarak yükler. Ayrıca her kulvarın zaman çizelgesi HTML'ini bir Crabbox masaüstü tarayıcısında render eder ve bu VNC ekran görüntülerini deterministik zaman çizelgesi PNG'lerinin yanında PR yorumunda yayımlar. Workflow, bir sonraki Crabbox binary sürümü kesilmeden önce güncel masaüstü/tarayıcı lease bayraklarını kullanabilmek için Crabbox CLI'ı `openclaw/crabbox` main'den build eder.

Durum reaksiyonları çalıştırmasını doğrudan bir PR yorumundan da tetikleyebilirsiniz:

```text
@Mantis discord status reactions
```

Yorum tetikleyicisi kasıtlı olarak dardır. Yalnızca write, maintain veya admin erişimi olan kullanıcıların pull request yorumlarında çalışır ve yalnızca Discord durum reaksiyonu isteklerini tanır. Varsayılan olarak bilinen kötü baseline ref'i ve candidate olarak mevcut PR head SHA'sını kullanır. Bakımcılar her iki ref'i de geçersiz kılabilir:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper komut örnekleri:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

İlk komut açık ve senaryo odaklıdır. İkincisi daha sonra bir PR veya issue'yu etiketlerden, değişen dosyalardan ve ClawSweeper inceleme bulgularından önerilen Mantis senaryolarına eşleyebilir.

## Çalıştırma Yaşam Döngüsü

1. Kimlik bilgilerini al.
2. Bir VM ayır veya yeniden kullan.
3. Senaryo UI kanıtı gerektirdiğinde masaüstü/tarayıcı profilini hazırla.
4. Baseline ref için temiz bir checkout hazırla.
5. Bağımlılıkları kur ve yalnızca senaryonun ihtiyaç duyduklarını build et.
6. İzole bir durum diziniyle bir child OpenClaw Gateway başlat.
7. Canlı aktarımı, sağlayıcıyı, modeli ve tarayıcı profilini yapılandır.
8. Senaryoyu çalıştır ve baseline kanıtını yakala.
9. Gateway'i durdur ve log'ları koru.
10. Aynı VM içinde candidate ref'i hazırla.
11. Aynı senaryoyu çalıştır ve candidate kanıtını yakala.
12. Oracle sonuçlarını ve görsel kanıtı karşılaştır.
13. Markdown, JSON, log'lar, ekran görüntüleri ve isteğe bağlı trace artifact'leri yaz.
14. GitHub Actions artifact'lerini yükle.
15. Kısa bir PR veya Discord durum mesajı gönder.

Senaryo iki farklı şekilde başarısız olabilmelidir:

- **Hata yeniden üretildi**: baseline beklenen şekilde başarısız oldu.
- **Harness hatası**: ortam kurulumu, kimlik bilgileri, Discord API, tarayıcı veya sağlayıcı, hata oracle'ı anlamlı olmadan önce başarısız oldu.

Son rapor bu durumları ayırmalıdır; böylece bakımcılar dengesiz bir ortamı ürün davranışıyla karıştırmaz.

## Discord MVP

İlk senaryo, kaynak yanıt teslim modunun `message_tool_only` olduğu guild kanallarındaki Discord durum reaksiyonlarını hedeflemelidir.

Bunun iyi bir Mantis tohumu olmasının nedenleri:

- Discord'da tetikleyen mesaj üzerindeki reaksiyonlar olarak görünür.
- Discord mesaj reaksiyon durumu üzerinden güçlü bir REST oracle'a sahiptir.
- Gerçek bir OpenClaw Gateway, Discord bot kimlik doğrulaması, mesaj dispatch'i, kaynak yanıt teslim modu, durum reaksiyonu durumu ve model turn yaşam döngüsünü çalıştırır.
- İlk uygulamayı dürüst tutacak kadar dardır.

Beklenen senaryo şekli:

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

Baseline kanıtı queued onay reaksiyonunu göstermeli, ancak tool-only modunda yaşam döngüsü geçişi göstermemelidir. Candidate kanıtı, `messages.statusReactions.enabled` açıkça true olduğunda yaşam döngüsü durum reaksiyonlarının çalıştığını göstermelidir.

Çalıştırılabilir ilk dilim, opt-in Discord canlı QA senaryosudur:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

SUT'yi her zaman açık guild işleme, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` ve açık durum tepkileriyle yapılandırır. Oracle
gerçek Discord tetikleyici mesajını yoklar ve gözlemlenen sıranın
`👀 -> 🤔 -> 👍` olmasını bekler. Artefaktlar `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` ve
`discord-status-reactions-tool-only-timeline.png` içerir.

## Mevcut QA Parçaları

Mantis, sıfırdan başlamak yerine mevcut özel QA yığını üzerine inşa edilmelidir:

- `pnpm openclaw qa discord` zaten sürücü ve SUT botlarıyla canlı bir Discord hattı çalıştırır.
- Canlı taşıma çalıştırıcısı zaten raporları ve gözlemlenen mesaj artefaktlarını `.artifacts/qa-e2e/` altında yazar.
- Convex kimlik bilgisi lease'leri zaten paylaşılan canlı taşıma kimlik bilgilerine özel erişim sağlar.
- Tarayıcı kontrol hizmeti zaten ekran görüntülerini, snapshot'ları, headless yönetilen profilleri ve uzak CDP profillerini destekler.
- QA Lab zaten taşıma biçimli testler için bir hata ayıklayıcı UI ve bus içerir.

İlk Mantis uygulaması, bu parçaların üzerinde ince bir önce/sonra çalıştırıcısı ve bir görsel kanıt katmanı olabilir.

## Kanıt Modeli

Her çalıştırma kararlı bir artefakt dizini yazar:

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

`mantis-summary.json` makine tarafından okunabilir doğruluk kaynağı olmalıdır.
Markdown raporu PR yorumları ve insan incelemesi içindir.

Özet şunları içermelidir:

- test edilen ref'ler ve SHA'lar
- taşıma ve senaryo kimliği
- makine sağlayıcısı ve makine kimliği veya lease kimliği
- gizli değerler olmadan kimlik bilgisi kaynağı
- baseline sonucu
- candidate sonucu
- hatanın baseline'da yeniden üretilip üretilmediği
- candidate'ın bunu düzeltip düzeltmediği
- artefakt yolları
- sterilize edilmiş kurulum veya temizleme sorunları

Ekran görüntüleri kanıttır, sır değildir. Yine de redaksiyon disiplini gerekir:
özel kanal adları, kullanıcı adları veya mesaj içeriği görünebilir. Genel PR'lar için,
redaksiyon hikayesi güçlenene kadar satır içi görseller yerine GitHub Actions artefakt bağlantılarını tercih edin.

## Tarayıcı ve VNC

Tarayıcı hattının iki modu vardır:

- **Headless otomasyon**: CI için varsayılan. Chrome, CDP etkin şekilde çalışır ve Playwright veya OpenClaw tarayıcı kontrolü ekran görüntülerini yakalar.
- **VNC kurtarma**: oturum açma, MFA, Discord anti-otomasyon veya görsel hata ayıklama bir insan gerektirdiğinde aynı VM üzerinde etkinleştirilir.

Discord gözlemci tarayıcı profili, her çalıştırmada oturum açmayı önleyecek kadar kalıcı olmalı, ancak kişisel tarayıcı durumundan izole edilmelidir. Profil bir geliştirici dizüstü bilgisayarına değil, Mantis makine havuzuna aittir.

Mantis takıldığında, şu bilgilerle bir Discord durum mesajı gönderir:

- çalışma kimliği
- senaryo kimliği
- makine sağlayıcısı
- artefakt dizini
- varsa VNC veya noVNC bağlantı talimatları
- kısa engelleyici metni

İlk özel dağıtım bu mesajları mevcut operatör kanalına gönderebilir ve daha sonra özel bir Mantis kanalına geçebilir.

## Makineler

Mantis, ilk uzak uygulama için Crabbox üzerinden AWS'yi tercih etmelidir.
Crabbox bize ısıtılmış makineler, lease takibi, hydration, günlükler, sonuçlar ve
temizleme sağlar. AWS kapasitesi çok yavaşsa veya kullanılamıyorsa, aynı makine arayüzünün arkasına bir Hetzner sağlayıcısı ekleyin.

Minimum VM gereksinimleri:

- masaüstü çalıştırabilen Chrome veya Chromium kurulumuna sahip Linux
- tarayıcı otomasyonu için CDP erişimi
- kurtarma için VNC veya noVNC
- Node 22 ve pnpm
- OpenClaw checkout'u ve bağımlılık önbelleği
- Playwright kullanıldığında Playwright Chromium tarayıcı önbelleği
- bir OpenClaw Gateway, bir tarayıcı ve bir model çalıştırması için yeterli CPU ve bellek
- Discord, GitHub, model sağlayıcıları ve kimlik bilgisi aracısına giden erişim

VM, beklenen kimlik bilgisi veya tarayıcı profili depoları dışında uzun ömürlü ham sırlar tutmamalıdır.

## Sırlar

Sırlar, uzak çalıştırmalar için GitHub kuruluş veya depo sırlarında, yerel çalıştırmalar için ise yerel operatör kontrollü gizli dosyada yaşar.

Önerilen sır adları:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- genel GitHub artefakt yüklemeleri için `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Uzun vadede, Convex kimlik bilgisi havuzu canlı taşıma kimlik bilgileri için normal kaynak olarak kalmalıdır. GitHub sırları aracıyı ve fallback hatlarını bootstrap eder.
Discord durum-tepkileri workflow'u Mantis Crabbox sırlarını Crabbox CLI'nin beklediği `CRABBOX_COORDINATOR` ve `CRABBOX_COORDINATOR_TOKEN` ortam değişkenlerine geri eşler. Düz `CRABBOX_*` GitHub sır adları uyumluluk fallback'i olarak kabul edilmeye devam eder.

Mantis çalıştırıcısı asla şunları yazdırmamalıdır:

- Discord bot token'ları
- sağlayıcı API anahtarları
- tarayıcı çerezleri
- auth profil içerikleri
- VNC parolaları
- ham kimlik bilgisi payload'ları

Genel artefakt yüklemeleri ayrıca bot, guild, kanal ve mesaj kimlikleri gibi Discord hedef metadata'sını redakte etmelidir. GitHub smoke workflow'u bu nedenle `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` etkinleştirir.

Bir token yanlışlıkla bir issue'ya, PR'a, sohbete veya günlüğe yapıştırılırsa, yeni sır depolandıktan sonra onu döndürün.

## GitHub Artefaktları ve PR Yorumları

Mantis workflow'ları tam kanıt paketini kısa ömürlü bir Actions artefaktı olarak yüklemelidir. Workflow bir hata raporu veya düzeltme PR'ı için çalıştırıldığında, redakte edilmiş PNG ekran görüntülerini `qa-artifacts` dalına da yayımlamalı ve ilgili hata veya düzeltme PR'ında satır içi önce/sonra ekran görüntüleri içeren bir yorumu upsert etmelidir. Birincil kanıtı yalnızca genel bir QA otomasyonu PR'ına göndermeyin. Ham günlükler, gözlemlenen mesajlar ve diğer hacimli kanıtlar Actions artefaktında kalır.

Üretim workflow'ları bu yorumları `github-actions[bot]` ile değil, Mantis GitHub App ile göndermelidir. App kimliğini ve özel anahtarı `MANTIS_GITHUB_APP_ID` ve `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions sırları olarak depolayın. Workflow upsert anahtarı olarak gizli bir marker kullanır, token düzenleyebildiğinde bu yorumu günceller ve daha eski bot sahipli marker düzenlenemediğinde yeni bir Mantis sahipli yorum oluşturur.

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

Çalıştırma, harness başarısız olduğu için başarısız olursa, yorum candidate'ın başarısız olduğunu ima etmek yerine bunu söylemelidir.

## Özel Dağıtım Notları

Özel bir dağıtımda zaten bir Mantis Discord uygulaması olabilir. Doğru bot izinlerine sahipse ve güvenli şekilde döndürülebiliyorsa, başka bir app oluşturmak yerine bu uygulamayı yeniden kullanın.

İlk operatör bildirim kanalını sırlar veya dağıtım yapılandırması üzerinden ayarlayın. Önce mevcut bir maintainer veya operasyon kanalını gösterebilir, sonra bir tane var olduğunda özel bir Mantis kanalına taşınabilir.

Guild kimliklerini, kanal kimliklerini, bot token'larını, tarayıcı çerezlerini veya VNC parolalarını bu belgeye koymayın. Bunları GitHub sırlarında, kimlik bilgisi aracısında veya operatörün yerel gizli deposunda saklayın.

## Senaryo Ekleme

Bir Mantis senaryosu şunları beyan etmelidir:

- kimlik ve başlık
- taşıma
- gerekli kimlik bilgileri
- baseline ref politikası
- candidate ref politikası
- OpenClaw yapılandırma patch'i
- kurulum adımları
- stimulus
- beklenen baseline oracle'ı
- beklenen candidate oracle'ı
- görsel yakalama hedefleri
- zaman aşımı bütçesi
- temizleme adımları

Senaryolar küçük, tipli oracle'ları tercih etmelidir:

- tepki hataları için Discord tepki durumu
- threading hataları için Discord mesaj referansları
- Slack hataları için Slack thread ts ve tepki API durumu
- e-posta hataları için e-posta mesaj kimlikleri ve başlıkları
- UI tek güvenilir gözlemlenebilir olduğunda tarayıcı ekran görüntüleri

Vision kontrolleri eklemeli olmalıdır. Bir platform API'si hatayı kanıtlayabiliyorsa, pass/fail oracle'ı olarak API'yi kullanın ve ekran görüntülerini insan güveni için saklayın.

## Sağlayıcı Genişletmesi

Discord'dan sonra aynı çalıştırıcı şunları ekleyebilir:

- Slack: tepkiler, thread'ler, app mention'ları, modal'lar, dosya yüklemeleri.
- E-posta: connector'ların yeterli olmadığı yerlerde `gog` kullanarak Gmail auth ve mesaj threading.
- WhatsApp: QR oturum açma, yeniden kimliklendirme, mesaj teslimi, medya, tepkiler.
- Telegram: grup mention kapısı, komutlar, kullanılabildiği yerlerde tepkiler.
- Matrix: şifreli odalar, thread veya yanıt ilişkileri, yeniden başlatma resume'u.

Her taşımanın bir ucuz smoke senaryosu ve bir veya daha fazla hata sınıfı senaryosu olmalıdır. Pahalı görsel senaryolar opt-in kalmalıdır.

## Açık Sorular

- Mevcut Mantis botu yeniden kullanıldığında hangi Discord botu sürücü, hangisi SUT olmalıdır?
- Gözlemci tarayıcı oturumu ilk aşamada bir insan Discord hesabı mı, bir test hesabı mı, yoksa yalnızca bot tarafından okunabilir REST kanıtı mı kullanmalıdır?
- GitHub, PR'lar için Mantis artefaktlarını ne kadar süre saklamalıdır?
- ClawSweeper ne zaman bir maintainer komutunu beklemek yerine Mantis'i otomatik olarak önermelidir?
- Genel PR'lar için ekran görüntüleri yüklemeden önce redakte edilmeli veya kırpılmalı mı?

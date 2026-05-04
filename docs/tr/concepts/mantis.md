---
read_when:
    - OpenClaw hataları için canlı görsel QA oluşturma veya çalıştırma
    - Bir çekme isteği için önce ve sonra doğrulaması ekleme
    - Discord, Slack, WhatsApp veya diğer canlı aktarım senaryolarını ekleme
    - Ekran görüntüleri, tarayıcı otomasyonu veya VNC erişimi gerektiren QA çalıştırmalarında hata ayıklama
summary: Mantis, OpenClaw hatalarını canlı aktarım katmanlarında yeniden üretmek, öncesi ve sonrası kanıtları yakalamak ve artefaktları PR'lere eklemek için kullanılan görsel uçtan uca doğrulama sistemidir.
title: Peygamberdevesi
x-i18n:
    generated_at: "2026-05-04T02:22:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis, gerçek bir çalışma zamanı, gerçek bir taşıma katmanı ve görünür kanıt gerektiren hatalar için OpenClaw uçtan uca doğrulama sistemidir. Bilinen kötü bir ref üzerinde bir senaryo çalıştırır, kanıt toplar, aynı senaryoyu aday ref üzerinde çalıştırır ve karşılaştırmayı bir bakımcının PR'dan veya yerel bir komuttan inceleyebileceği artefaktlar olarak yayımlar.

Mantis, Discord ile başlar çünkü Discord bize yüksek değerli bir ilk hat verir: gerçek bot kimlik doğrulaması, gerçek sunucu kanalları, tepkiler, iş parçacıkları, yerel komutlar ve insanların taşıma katmanının ne gösterdiğini görsel olarak doğrulayabileceği bir tarayıcı arayüzü.

## Hedefler

- Bir GitHub issue veya PR'daki hatayı, kullanıcıların gördüğü aynı taşıma biçimiyle yeniden üretmek.
- Düzeltmeyi uygulamadan önce temel ref üzerinde bir **önce** artefaktı yakalamak.
- Düzeltmeyi uyguladıktan sonra aday ref üzerinde bir **sonra** artefaktı yakalamak.
- Mümkün olduğunda, Discord REST tepki okuması veya kanal dökümü kontrolü gibi deterministik bir doğrulayıcı kullanmak.
- Hatanın görünür bir UI yüzeyi olduğunda ekran görüntüleri yakalamak.
- Aracı denetimli bir CLI'dan yerel olarak ve GitHub'dan uzaktan çalıştırmak.
- Oturum açma, tarayıcı otomasyonu veya sağlayıcı kimlik doğrulaması takıldığında VNC kurtarma için yeterli makine durumunu korumak.
- Çalışma engellendiğinde, manuel VNC yardımı gerektiğinde veya tamamlandığında operatör Discord kanalına kısa durum göndermek.

## Hedef Dışı Konular

- Mantis, birim testlerin yerine geçmez. Bir Mantis çalışması, düzeltme anlaşıldıktan sonra genellikle daha küçük bir regresyon testine dönüşmelidir.
- Mantis, normal hızlı CI kapısı değildir. Daha yavaştır, canlı kimlik bilgileri kullanır ve canlı ortamın önemli olduğu hatalar için ayrılmıştır.
- Mantis, normal çalışma için insan gerektirmemelidir. Manuel VNC, mutlu yol değil bir kurtarma yoludur.
- Mantis ham gizli bilgileri artefaktlarda, günlüklerde, ekran görüntülerinde, Markdown raporlarında veya PR yorumlarında saklamaz.

## Sahiplik

Mantis, OpenClaw QA yığınında yaşar.

- OpenClaw, `pnpm openclaw qa mantis` altındaki senaryo çalışma zamanına, taşıma bağdaştırıcılarına, kanıt şemasına ve yerel CLI'a sahiptir.
- QA Lab, canlı taşıma donanımı parçalarına, tarayıcı yakalama yardımcılarına ve artefakt yazıcılarına sahiptir.
- Crabbox, uzak VM gerektiğinde ısıtılmış Linux makinelerine sahiptir.
- GitHub Actions, uzak iş akışı giriş noktasına ve artefakt saklamaya sahiptir.
- ClawSweeper, GitHub yorum yönlendirmesine sahiptir: bakımcı komutlarını ayrıştırma, iş akışını tetikleme ve son PR yorumunu gönderme.
- OpenClaw aracıları, bir senaryonun agentic kurulum, hata ayıklama veya takılı durum raporlaması gerektiğinde Codex üzerinden Mantis'i yürütür.

Bu sınır, taşıma bilgisini OpenClaw'da, makine zamanlamasını Crabbox'ta ve bakımcı iş akışı bağlayıcısını ClawSweeper'da tutar.

## Komut Biçimi

İlk yerel komut Discord botunu, sunucuyu, kanalı, ileti göndermeyi, tepki göndermeyi ve artefakt yolunu doğrular:

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

Çalıştırıcı, çıktı dizini altında ayrılmış temel ve aday worktree'ler oluşturur, bağımlılıkları yükler, her ref'i derler, senaryoyu `--allow-failures` ile çalıştırır, ardından `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` yazar. İlk Discord senaryosu için başarılı doğrulama, temel durumun `fail` ve aday durumun `pass` olması anlamına gelir.

İlk VM/tarayıcı ilkeli masaüstü smoke çalışmasıdır:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Bir Crabbox masaüstü makinesi kiralar veya yeniden kullanır, VNC oturumu içinde görünür bir tarayıcı başlatır, masaüstünü yakalar, artefaktları yerel çıktı dizinine geri çeker ve yeniden bağlanma komutunu rapora yazar. Komut varsayılan olarak Hetzner sağlayıcısını kullanır çünkü Mantis hattında çalışan masaüstü/VNC kapsamına sahip ilk sağlayıcı odur. Başka bir Crabbox filosuna karşı çalıştırırken `--provider`, `--crabbox-bin` veya `OPENCLAW_MANTIS_CRABBOX_PROVIDER` ile geçersiz kılın.

Kullanışlı masaüstü smoke bayrakları:

- `--lease-id <cbx_...>` veya `OPENCLAW_MANTIS_CRABBOX_LEASE_ID`, ısıtılmış bir masaüstünü yeniden kullanır.
- `--browser-url <url>`, görünür tarayıcıda açılan sayfayı değiştirir.
- `--html-file <path>`, repo yerelindeki bir HTML artefaktını görünür tarayıcıda render eder. Mantis bunu, oluşturulan Discord durum tepkisi zaman çizelgesini gerçek bir Crabbox masaüstü üzerinden yakalamak için kullanır.
- `--keep-lease` veya `OPENCLAW_MANTIS_KEEP_VM=1`, yeni oluşturulmuş başarılı bir kiralamayı VNC incelemesi için açık tutar. Başarısız çalışmalar, bir operatörün yeniden bağlanabilmesi için bir kiralama oluşturulduğunda varsayılan olarak kiralamayı korur.
- `--class`, `--idle-timeout` ve `--ttl`, makine boyutunu ve kiralama ömrünü ayarlar.

GitHub smoke iş akışı `Mantis Discord Smoke`'tur. İlk gerçek senaryo için önce ve sonra GitHub iş akışı `Mantis Discord Status Reactions`'tır. Şunları kabul eder:

- `baseline_ref`: yalnızca kuyruğa alınmış davranışı yeniden üretmesi beklenen ref.
- `candidate_ref`: `queued -> thinking -> done` göstermesi beklenen ref.

İş akışı donanım ref'ini checkout eder, ayrı temel ve aday worktree'ler derler, her worktree'ye karşı `discord-status-reactions-tool-only` çalıştırır ve `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` dosyalarını Actions artefaktları olarak yükler. Ayrıca her hattın zaman çizelgesi HTML'ini bir Crabbox masaüstü tarayıcısında render eder ve bu VNC ekran görüntülerini deterministik zaman çizelgesi PNG'lerinin yanında PR yorumunda yayımlar. İş akışı, mevcut masaüstü/tarayıcı kiralama bayraklarını bir sonraki Crabbox ikili sürümü kesilmeden önce kullanabilmek için Crabbox CLI'ı `openclaw/crabbox` main'den derler.

Durum tepkileri çalışmasını doğrudan bir PR yorumundan da tetikleyebilirsiniz:

```text
@Mantis discord status reactions
```

Yorum tetikleyicisi kasıtlı olarak dardır. Yalnızca yazma, bakım veya yönetici erişimine sahip kullanıcıların pull request yorumlarında çalışır ve yalnızca Discord durum tepkisi isteklerini tanır. Varsayılan olarak bilinen kötü temel ref'i ve aday olarak mevcut PR baş SHA'sını kullanır. Bakımcılar iki ref'i de geçersiz kılabilir:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper komut örnekleri:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

İlk komut açık ve senaryo odaklıdır. İkincisi daha sonra bir PR'ı veya issue'yu etiketlerden, değişen dosyalardan ve ClawSweeper inceleme bulgularından önerilen Mantis senaryolarına eşleyebilir.

## Çalışma Yaşam Döngüsü

1. Kimlik bilgilerini edin.
2. Bir VM ayır veya yeniden kullan.
3. Senaryo UI kanıtı gerektirdiğinde masaüstü/tarayıcı profilini hazırla.
4. Temel ref için temiz bir checkout hazırla.
5. Bağımlılıkları yükle ve yalnızca senaryonun ihtiyaç duyduklarını derle.
6. Yalıtılmış durum diziniyle bir alt OpenClaw Gateway başlat.
7. Canlı taşıma katmanını, sağlayıcıyı, modeli ve tarayıcı profilini yapılandır.
8. Senaryoyu çalıştır ve temel kanıtı yakala.
9. Gateway'i durdur ve günlükleri koru.
10. Aynı VM'de aday ref'i hazırla.
11. Aynı senaryoyu çalıştır ve aday kanıtı yakala.
12. Doğrulayıcı sonuçlarını ve görsel kanıtı karşılaştır.
13. Markdown, JSON, günlükler, ekran görüntüleri ve isteğe bağlı iz artefaktları yaz.
14. GitHub Actions artefaktlarını yükle.
15. Kısa bir PR veya Discord durum iletisi gönder.

Senaryo iki farklı şekilde başarısız olabilmelidir:

- **Hata yeniden üretildi**: temel, beklenen şekilde başarısız oldu.
- **Donanım hatası**: ortam kurulumu, kimlik bilgileri, Discord API, tarayıcı veya sağlayıcı, hata doğrulayıcısı anlamlı olmadan önce başarısız oldu.

Son rapor, bakımcıların kararsız bir ortamı ürün davranışıyla karıştırmaması için bu durumları ayırmalıdır.

## Discord MVP

İlk senaryo, kaynak yanıt teslim modunun `message_tool_only` olduğu sunucu kanallarında Discord durum tepkilerini hedeflemelidir.

Neden iyi bir Mantis tohumu olduğu:

- Tetikleyici ileti üzerindeki tepkiler olarak Discord'da görünür.
- Discord ileti tepki durumu üzerinden güçlü bir REST doğrulayıcısı vardır.
- Gerçek bir OpenClaw Gateway, Discord bot kimlik doğrulaması, ileti dağıtımı, kaynak yanıt teslim modu, durum tepki durumu ve model turu yaşam döngüsünü çalıştırır.
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

Temel kanıt, kuyruğa alındı onay tepkisini göstermeli ancak yalnızca araç modunda yaşam döngüsü geçişi göstermemelidir. Aday kanıt, `messages.statusReactions.enabled` açıkça true olduğunda yaşam döngüsü durum tepkilerinin çalıştığını göstermelidir.

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

SUT'yi her zaman açık sunucu işleme, `visibleReplies: "message_tool"`, `ackReaction: "👀"` ve açık durum tepkileriyle yapılandırır. Doğrulayıcı gerçek Discord tetikleyici iletisini yoklar ve gözlenen `👀 -> 🤔 -> 👍` dizisini bekler. Artefaktlar `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` ve `discord-status-reactions-tool-only-timeline.png` içerir.

## Mevcut QA Parçaları

Mantis, sıfırdan başlamak yerine mevcut özel QA yığını üzerine kurulmalıdır:

- `pnpm openclaw qa discord`, sürücü ve SUT botlarıyla zaten canlı bir Discord hattı çalıştırır.
- Canlı taşıma çalıştırıcısı, raporları ve gözlenen ileti artefaktlarını zaten `.artifacts/qa-e2e/` altına yazar.
- Convex kimlik bilgisi kiralamaları, paylaşılan canlı taşıma kimlik bilgilerine zaten özel erişim sağlar.
- Tarayıcı denetim servisi ekran görüntülerini, anlık görüntüleri, başsız yönetilen profilleri ve uzak CDP profillerini zaten destekler.
- QA Lab'de taşıma biçimli testler için zaten bir hata ayıklayıcı UI ve veri yolu vardır.

İlk Mantis uygulaması, bu parçaların üzerinde ince bir önce/sonra çalıştırıcısı ve ek olarak bir görsel kanıt katmanı olabilir.

## Kanıt Modeli

Her çalışma kararlı bir artefakt dizini yazar:

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

`mantis-summary.json`, makine tarafından okunabilir doğruluk kaynağı olmalıdır. Markdown raporu PR yorumları ve insan incelemesi içindir.

Özet şunları içermelidir:

- test edilen ref'ler ve SHA'lar
- taşıma ve senaryo kimliği
- makine sağlayıcısı ve makine kimliği veya kiralama kimliği
- gizli değerler olmadan kimlik bilgisi kaynağı
- temel sonuç
- aday sonuç
- hatanın temelde yeniden üretilip üretilmediği
- adayın bunu düzeltip düzeltmediği
- artefakt yolları
- temizlenmiş kurulum veya temizlik sorunları

Ekran görüntüleri kanıttır, gizli bilgi değildir. Yine de redaksiyon disiplini gerekir: özel kanal adları, kullanıcı adları veya ileti içeriği görünebilir. Herkese açık PR'lar için redaksiyon hikayesi daha güçlü olana kadar satır içi görseller yerine GitHub Actions artefakt bağlantılarını tercih edin.

## Tarayıcı ve VNC

Tarayıcı hattının iki modu vardır:

- **Başsız otomasyon**: CI için varsayılandır. Chrome, CDP etkin şekilde çalışır ve Playwright veya OpenClaw tarayıcı denetimi ekran görüntüleri yakalar.
- **VNC kurtarma**: oturum açma, MFA, Discord otomasyon karşıtı önlemleri veya görsel hata ayıklama bir insan gerektirdiğinde aynı VM üzerinde etkinleştirilir.

Discord gözlemci tarayıcı profili, her çalıştırmada oturum açmayı önleyecek kadar kalıcı olmalı, ancak kişisel tarayıcı durumundan yalıtılmış olmalıdır. Bir profil, bir geliştirici dizüstü bilgisayarına değil, Mantis makine havuzuna aittir.

Mantis takıldığında, şu bilgileri içeren bir Discord durum mesajı gönderir:

- çalıştırma kimliği
- senaryo kimliği
- makine sağlayıcısı
- yapıt dizini
- varsa VNC veya noVNC bağlantı talimatları
- kısa engelleyici metni

İlk özel dağıtım bu mesajları mevcut operatör kanalına gönderebilir ve daha sonra özel bir Mantis kanalına geçebilir.

## Makineler

Mantis, ilk uzak uygulama için Crabbox üzerinden AWS'yi tercih etmelidir. Crabbox bize önceden hazırlanmış makineler, kira takibi, hazırlama, günlükler, sonuçlar ve temizlik sağlar. AWS kapasitesi çok yavaşsa veya kullanılamıyorsa, aynı makine arayüzünün arkasına bir Hetzner sağlayıcısı ekleyin.

Minimum VM gereksinimleri:

- masaüstü özellikli Chrome veya Chromium kurulumuna sahip Linux
- tarayıcı otomasyonu için CDP erişimi
- kurtarma için VNC veya noVNC
- Node 22 ve pnpm
- OpenClaw checkout'u ve bağımlılık önbelleği
- Playwright kullanıldığında Playwright Chromium tarayıcı önbelleği
- bir OpenClaw Gateway, bir tarayıcı ve bir model çalıştırması için yeterli CPU ve bellek
- Discord, GitHub, model sağlayıcıları ve kimlik bilgisi aracısına giden erişim

VM, beklenen kimlik bilgisi veya tarayıcı profili depoları dışında uzun ömürlü ham gizli bilgiler tutmamalıdır.

## Gizli Bilgiler

Uzak çalıştırmalar için gizli bilgiler GitHub kuruluş veya depo gizli bilgilerinde, yerel çalıştırmalar içinse yerel operatör kontrollü bir gizli bilgi dosyasında bulunur.

Önerilen gizli bilgi adları:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- herkese açık GitHub yapıt yüklemeleri için `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Uzun vadede Convex kimlik bilgisi havuzu, canlı taşıma kimlik bilgilerinin normal kaynağı olarak kalmalıdır. GitHub gizli bilgileri aracıyı ve yedek şeritleri başlatır. Discord durum tepkileri iş akışı, Mantis Crabbox gizli bilgilerini Crabbox CLI'nin beklediği `CRABBOX_COORDINATOR` ve `CRABBOX_COORDINATOR_TOKEN` ortam değişkenlerine geri eşler. Düz `CRABBOX_*` GitHub gizli bilgi adları uyumluluk yedeği olarak kabul edilmeye devam eder.

Mantis çalıştırıcısı şunları asla yazdırmamalıdır:

- Discord bot token'ları
- sağlayıcı API anahtarları
- tarayıcı çerezleri
- kimlik doğrulama profili içerikleri
- VNC parolaları
- ham kimlik bilgisi yükleri

Herkese açık yapıt yüklemeleri ayrıca bot, sunucu, kanal ve mesaj kimlikleri gibi Discord hedef meta verilerini de redakte etmelidir. GitHub smoke iş akışı bu nedenle `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` değerini etkinleştirir.

Bir token yanlışlıkla bir issue'ya, PR'ye, sohbete veya günlüğe yapıştırılırsa, yeni gizli bilgi depolandıktan sonra onu döndürün.

## GitHub Yapıtları ve PR Yorumları

Mantis iş akışları tam kanıt paketini kısa ömürlü bir Actions yapıtı olarak yüklemelidir. İş akışı bir hata raporu veya düzeltme PR'si için çalıştırıldığında, redakte edilmiş PNG ekran görüntülerini `qa-artifacts` dalına da yayımlamalı ve ilgili hata veya düzeltme PR'sine satır içi önce/sonra ekran görüntüleriyle bir yorum eklemeli veya mevcut yorumu güncellemelidir. Birincil kanıtı yalnızca genel bir QA otomasyonu PR'sine göndermeyin. Ham günlükler, gözlemlenen mesajlar ve diğer hacimli kanıtlar Actions yapıtında kalır.

Üretim iş akışları bu yorumları `github-actions[bot]` ile değil, Mantis GitHub App ile göndermelidir. Uygulama kimliğini ve özel anahtarı `MANTIS_GITHUB_APP_ID` ve `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions gizli bilgileri olarak saklayın. İş akışı gizli bir işaretçiyi ekleme/güncelleme anahtarı olarak kullanır, token düzenleyebildiğinde o yorumu günceller ve eski bot sahipli bir işaretçi düzenlenemediğinde Mantis sahipli yeni bir yorum oluşturur.

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

Çalıştırma, test düzeneği başarısız olduğu için başarısız olursa, yorum adayın başarısız olduğunu ima etmek yerine bunu söylemelidir.

## Özel Dağıtım Notları

Özel bir dağıtımda zaten bir Mantis Discord uygulaması olabilir. Doğru bot izinlerine sahipse ve güvenle döndürülebiliyorsa başka bir uygulama oluşturmak yerine o uygulamayı yeniden kullanın.

İlk operatör bildirim kanalını gizli bilgiler veya dağıtım yapılandırması üzerinden ayarlayın. Önce mevcut bir bakımcı veya operasyon kanalını işaret edebilir, bir kanal oluşturulduktan sonra özel bir Mantis kanalına taşınabilir.

Bu belgeye sunucu kimlikleri, kanal kimlikleri, bot token'ları, tarayıcı çerezleri veya VNC parolaları koymayın. Bunları GitHub gizli bilgilerinde, kimlik bilgisi aracısında veya operatörün yerel gizli bilgi deposunda saklayın.

## Senaryo Ekleme

Bir Mantis senaryosu şunları bildirmelidir:

- kimlik ve başlık
- taşıma
- gerekli kimlik bilgileri
- temel referans ilkesi
- aday referans ilkesi
- OpenClaw yapılandırma yaması
- kurulum adımları
- uyaran
- beklenen temel oracle
- beklenen aday oracle
- görsel yakalama hedefleri
- zaman aşımı bütçesi
- temizlik adımları

Senaryolar küçük, tiplendirilmiş oracle'ları tercih etmelidir:

- tepki hataları için Discord tepki durumu
- iş parçacığı hataları için Discord mesaj referansları
- Slack hataları için Slack iş parçacığı zaman damgası ve tepki API durumu
- e-posta hataları için e-posta mesaj kimlikleri ve başlıkları
- UI tek güvenilir gözlemlenebilir olduğunda tarayıcı ekran görüntüleri

Görüntü kontrolleri eklemeli olmalıdır. Bir platform API'si hatayı kanıtlayabiliyorsa, API'yi başarılı/başarısız oracle'ı olarak kullanın ve ekran görüntülerini insan güveni için tutun.

## Sağlayıcı Genişletme

Discord'dan sonra aynı çalıştırıcı şunları ekleyebilir:

- Slack: tepkiler, iş parçacıkları, uygulama bahsetmeleri, modallar, dosya yüklemeleri.
- E-posta: bağlayıcıların yeterli olmadığı yerlerde `gog` kullanarak Gmail kimlik doğrulaması ve mesaj iş parçacığı.
- WhatsApp: QR ile oturum açma, yeniden tanımlama, mesaj teslimi, medya, tepkiler.
- Telegram: grup bahsetme kapısı, komutlar, varsa tepkiler.
- Matrix: şifrelenmiş odalar, iş parçacığı veya yanıt ilişkileri, yeniden başlatma sonrası sürdürme.

Her taşımanın bir ucuz smoke senaryosu ve bir veya daha fazla hata sınıfı senaryosu olmalıdır. Pahalı görsel senaryolar isteğe bağlı kalmalıdır.

## Açık Sorular

- Mevcut Mantis botu yeniden kullanıldığında hangi Discord botu sürücü, hangisi SUT olmalıdır?
- Gözlemci tarayıcı oturumu açma ilk aşamada bir insan Discord hesabı mı, bir test hesabı mı, yoksa yalnızca bot tarafından okunabilir REST kanıtı mı kullanmalıdır?
- GitHub, PR'ler için Mantis yapıtlarını ne kadar süre saklamalıdır?
- ClawSweeper ne zaman bir bakımcı komutu beklemek yerine otomatik olarak Mantis önermelidir?
- Herkese açık PR'ler için ekran görüntüleri yüklemeden önce redakte edilmeli veya kırpılmalı mı?

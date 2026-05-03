---
read_when:
    - OpenClaw hataları için canlı görsel kalite güvencesi oluşturma veya çalıştırma
    - Bir çekme isteği için öncesi ve sonrası doğrulama ekleme
    - Discord, Slack, WhatsApp veya diğer canlı aktarım senaryoları ekleme
    - Ekran görüntüleri, tarayıcı otomasyonu veya VNC erişimi gerektiren QA çalıştırmalarında hata ayıklama
summary: Mantis, OpenClaw hatalarını canlı aktarımlarda yeniden üretmek, öncesi ve sonrası kanıtları yakalamak ve artefaktları çekme isteklerine eklemek için kullanılan görsel uçtan uca doğrulama sistemidir.
title: Peygamberdevesi
x-i18n:
    generated_at: "2026-05-03T21:30:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis, gerçek bir runtime, gerçek bir aktarım ve görünür kanıt gerektiren hatalar için OpenClaw uçtan uca doğrulama sistemidir. Bilinen kötü bir ref üzerinde bir senaryo çalıştırır, kanıt toplar, aynı senaryoyu aday ref üzerinde çalıştırır ve karşılaştırmayı bir bakımcının PR'dan veya yerel bir komuttan inceleyebileceği artifact'ler olarak yayımlar.

Mantis, Discord ile başlar çünkü Discord bize yüksek değerli bir ilk kulvar sağlar: gerçek bot kimlik doğrulaması, gerçek guild kanalları, tepkiler, iş parçacıkları, yerel komutlar ve insanların aktarımın gösterdiğini görsel olarak doğrulayabileceği bir tarayıcı UI'ı.

## Hedefler

- Bir GitHub issue'sundan veya PR'dan gelen hatayı, kullanıcıların gördüğü aynı aktarım yapısıyla yeniden üretmek.
- Düzeltmeyi uygulamadan önce baseline ref üzerinde bir **önce** artifact'i yakalamak.
- Düzeltmeyi uyguladıktan sonra aday ref üzerinde bir **sonra** artifact'i yakalamak.
- Mümkün olduğunda, Discord REST tepki okuması veya kanal transcript denetimi gibi deterministik bir oracle kullanmak.
- Hatanın görünür bir UI yüzeyi olduğunda ekran görüntüleri yakalamak.
- Agent denetimli bir CLI'dan yerel olarak ve GitHub'dan uzaktan çalışmak.
- Oturum açma, tarayıcı otomasyonu veya sağlayıcı kimlik doğrulaması takıldığında VNC kurtarması için yeterli makine durumunu korumak.
- Çalıştırma engellendiğinde, manuel VNC yardımı gerektiğinde veya tamamlandığında bir operatör Discord kanalına kısa durum göndermek.

## Hedef Dışılar

- Mantis, birim testlerinin yerine geçmez. Bir Mantis çalıştırması, düzeltme anlaşıldıktan sonra genellikle daha küçük bir regresyon testine dönüşmelidir.
- Mantis normal hızlı CI kapısı değildir. Daha yavaştır, canlı kimlik bilgileri kullanır ve canlı ortamın önemli olduğu hatalar için ayrılmıştır.
- Mantis normal çalışma için insan gerektirmemelidir. Manuel VNC, mutlu yol değil, bir kurtarma yoludur.
- Mantis artifact'lerde, günlüklerde, ekran görüntülerinde, Markdown raporlarında veya PR yorumlarında ham secret saklamaz.

## Sahiplik

Mantis, OpenClaw QA yığınında yer alır.

- OpenClaw, senaryo runtime'ının, aktarım adaptörlerinin, kanıt şemasının ve `pnpm openclaw qa mantis` altındaki yerel CLI'ın sahibidir.
- QA Lab, canlı aktarım harness parçalarının, tarayıcı yakalama yardımcılarının ve artifact yazıcılarının sahibidir.
- Crabbox, uzak VM gerektiğinde ısıtılmış Linux makinelerinin sahibidir.
- GitHub Actions, uzak workflow giriş noktasının ve artifact saklamanın sahibidir.
- ClawSweeper, GitHub yorum yönlendirmesinin sahibidir: bakımcı komutlarını ayrıştırma, workflow'u dispatch etme ve son PR yorumunu gönderme.
- OpenClaw agent'ları, bir senaryo agentik kurulum, hata ayıklama veya takılı durum raporlaması gerektirdiğinde Mantis'i Codex üzerinden yürütür.

Bu sınır, aktarım bilgisini OpenClaw'da, makine zamanlamasını Crabbox'ta ve bakımcı workflow bağlantı mantığını ClawSweeper'da tutar.

## Komut Yapısı

İlk yerel komut Discord botunu, guild'i, kanalı, mesaj gönderimini, tepki gönderimini ve artifact yolunu doğrular:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Yerel önce ve sonra çalıştırıcısı şu yapıyı kabul eder:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Çalıştırıcı, çıktı dizini altında ayrılmış baseline ve aday worktree'leri oluşturur, bağımlılıkları yükler, her ref'i build eder, senaryoyu `--allow-failures` ile çalıştırır, ardından `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` yazar. İlk Discord senaryosu için başarılı bir doğrulama, baseline durumunun `fail` ve aday durumunun `pass` olduğu anlamına gelir.

GitHub smoke workflow'u `Mantis Discord Smoke` adındadır. İlk gerçek senaryo için önce ve sonra GitHub workflow'u `Mantis Discord Status Reactions` adındadır. Şunları kabul eder:

- `baseline_ref`: yalnızca queued davranışını yeniden üretmesi beklenen ref.
- `candidate_ref`: `queued -> thinking -> done` göstermesi beklenen ref.

Workflow harness ref'ini checkout eder, ayrı baseline ve aday worktree'leri build eder, her worktree üzerinde `discord-status-reactions-tool-only` çalıştırır ve `baseline/`, `candidate/`, `comparison.json` ile `mantis-report.md` dosyalarını Actions artifact'leri olarak yükler.

Status-reactions çalıştırmasını doğrudan bir PR yorumundan da tetikleyebilirsiniz:

```text
@Mantis discord status reactions
```

Yorum tetikleyicisi özellikle dardır. Yalnızca write, maintain veya admin erişimi olan kullanıcıların pull request yorumlarında çalışır ve yalnızca Discord status-reaction isteklerini tanır. Varsayılan olarak bilinen kötü baseline ref'ini ve aday olarak mevcut PR head SHA'sını kullanır. Bakımcılar iki ref'i de geçersiz kılabilir:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper komut örnekleri:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

İlk komut açık ve senaryo odaklıdır. İkincisi daha sonra bir PR'ı veya issue'yu etiketlerden, değişen dosyalardan ve ClawSweeper inceleme bulgularından önerilen Mantis senaryolarına eşleyebilir.

## Çalıştırma Yaşam Döngüsü

1. Kimlik bilgilerini edin.
2. Bir VM ayır veya yeniden kullan.
3. Baseline ref için temiz bir checkout hazırla.
4. Bağımlılıkları yükle ve yalnızca senaryonun ihtiyaç duyduklarını build et.
5. Yalıtılmış durum diziniyle bir alt OpenClaw Gateway başlat.
6. Canlı aktarımı, sağlayıcıyı, modeli ve tarayıcı profilini yapılandır.
7. Senaryoyu çalıştır ve baseline kanıtını yakala.
8. Gateway'i durdur ve günlükleri koru.
9. Aday ref'i aynı VM'de hazırla.
10. Aynı senaryoyu çalıştır ve aday kanıtını yakala.
11. Oracle sonuçlarını ve görsel kanıtı karşılaştır.
12. Markdown, JSON, günlükler, ekran görüntüleri ve isteğe bağlı trace artifact'leri yaz.
13. GitHub Actions artifact'lerini yükle.
14. Kısa bir PR veya Discord durum mesajı gönder.

Senaryo iki farklı şekilde başarısız olabilmelidir:

- **Hata yeniden üretildi**: baseline beklenen şekilde başarısız oldu.
- **Harness hatası**: ortam kurulumu, kimlik bilgileri, Discord API, tarayıcı veya sağlayıcı, hata oracle'ı anlamlı olmadan önce başarısız oldu.

Son rapor bu durumları ayırmalıdır; böylece bakımcılar oynak bir ortamı ürün davranışıyla karıştırmaz.

## Discord MVP

İlk senaryo, kaynak yanıt teslim modunun `message_tool_only` olduğu guild kanallarındaki Discord durum tepkilerini hedeflemelidir.

Neden iyi bir Mantis tohumu olduğu:

- Tetikleyen mesajdaki tepkiler olarak Discord'da görünür.
- Discord mesaj tepki durumu üzerinden güçlü bir REST oracle'ı vardır.
- Gerçek bir OpenClaw Gateway'i, Discord bot kimlik doğrulamasını, mesaj dispatch'ini, kaynak yanıt teslim modunu, durum tepki durumunu ve model turn yaşam döngüsünü çalıştırır.
- İlk uygulamayı dürüst tutacak kadar dardır.

Beklenen senaryo yapısı:

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

Baseline kanıtı, queued onay tepkisini göstermeli ancak tool-only modda yaşam döngüsü geçişi göstermemelidir. Aday kanıtı, `messages.statusReactions.enabled` açıkça true olduğunda yaşam döngüsü durum tepkilerinin çalıştığını göstermelidir.

Çalıştırılabilir ilk parça, opt-in Discord canlı QA senaryosudur:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

SUT'yi her zaman açık guild işleme, `visibleReplies: "message_tool"`, `ackReaction: "👀"` ve açık durum tepkileriyle yapılandırır. Oracle gerçek Discord tetikleme mesajını yoklar ve gözlemlenen `👀 -> 🤔 -> 👍` dizisini bekler. Artifact'ler `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` ve `discord-status-reactions-tool-only-timeline.png` içerir.

## Mevcut QA Parçaları

Mantis sıfırdan başlamak yerine mevcut özel QA yığınının üzerine inşa edilmelidir:

- `pnpm openclaw qa discord` zaten driver ve SUT botlarıyla canlı bir Discord kulvarı çalıştırır.
- Canlı aktarım çalıştırıcısı zaten `.artifacts/qa-e2e/` altında raporlar ve gözlemlenen mesaj artifact'leri yazar.
- Convex kimlik bilgisi lease'leri, paylaşılan canlı aktarım kimlik bilgilerine zaten özel erişim sağlar.
- Tarayıcı denetim servisi zaten ekran görüntülerini, snapshot'ları, headless yönetilen profilleri ve uzak CDP profillerini destekler.
- QA Lab'in aktarım yapılı testler için zaten bir debugger UI'ı ve bus'ı vardır.

İlk Mantis uygulaması, bu parçalar üzerinde ince bir önce/sonra çalıştırıcısı ve bir görsel kanıt katmanı olabilir.

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

`mantis-summary.json`, makine tarafından okunabilir doğruluk kaynağı olmalıdır. Markdown raporu PR yorumları ve insan incelemesi içindir.

Özet şunları içermelidir:

- test edilen ref'ler ve SHA'lar
- aktarım ve senaryo kimliği
- makine sağlayıcısı ve makine kimliği veya lease kimliği
- secret değerleri olmadan kimlik bilgisi kaynağı
- baseline sonucu
- aday sonucu
- hatanın baseline üzerinde yeniden üretilip üretilmediği
- adayın hatayı düzeltip düzeltmediği
- artifact yolları
- temizlenmiş kurulum veya temizlik sorunları

Ekran görüntüleri kanıttır, secret değildir. Yine de redaksiyon disiplini gerektirirler: özel kanal adları, kullanıcı adları veya mesaj içeriği görünebilir. Herkese açık PR'lar için, redaksiyon hikayesi güçlenene kadar satır içi görseller yerine GitHub Actions artifact bağlantılarını tercih edin.

## Tarayıcı ve VNC

Tarayıcı kulvarının iki modu vardır:

- **Headless otomasyon**: CI için varsayılandır. Chrome, CDP etkin şekilde çalışır ve Playwright veya OpenClaw tarayıcı denetimi ekran görüntüleri yakalar.
- **VNC kurtarma**: oturum açma, MFA, Discord anti-otomasyon veya görsel hata ayıklama bir insan gerektirdiğinde aynı VM üzerinde etkinleştirilir.

Discord gözlemci tarayıcı profili, her çalıştırma için oturum açmayı önleyecek kadar kalıcı olmalı, ancak kişisel tarayıcı durumundan yalıtılmış olmalıdır. Bir profil, geliştirici dizüstü bilgisayarına değil, Mantis makine havuzuna aittir.

Mantis takıldığında şunları içeren bir Discord durum mesajı gönderir:

- çalıştırma kimliği
- senaryo kimliği
- makine sağlayıcısı
- artifact dizini
- varsa VNC veya noVNC bağlantı talimatları
- kısa engelleyici metni

İlk özel dağıtım bu mesajları mevcut operatör kanalına gönderebilir ve daha sonra özel bir Mantis kanalına taşınabilir.

## Makineler

Mantis, ilk uzak uygulama için Crabbox üzerinden AWS'yi tercih etmelidir. Crabbox bize ısıtılmış makineler, lease takibi, hydration, günlükler, sonuçlar ve temizlik sağlar. AWS kapasitesi çok yavaş veya kullanılamaz durumdaysa aynı makine arayüzünün arkasına bir Hetzner sağlayıcısı ekleyin.

Minimum VM gereksinimleri:

- Masaüstü çalıştırabilir Chrome veya Chromium kurulumu olan Linux
- Tarayıcı otomasyonu için CDP erişimi
- Kurtarma için VNC veya noVNC
- Node 22 ve pnpm
- OpenClaw checkout'u ve bağımlılık önbelleği
- Playwright kullanıldığında Playwright Chromium tarayıcı önbelleği
- bir OpenClaw Gateway, bir tarayıcı ve bir model çalıştırması için yeterli CPU ve bellek
- Discord, GitHub, model sağlayıcıları ve kimlik bilgisi broker'ına outbound erişim

VM, beklenen kimlik bilgisi veya tarayıcı profil depoları dışında uzun ömürlü ham secret'ları tutmamalıdır.

## Secret'lar

Secret'lar uzak çalıştırmalar için GitHub organizasyon veya repository secret'larında, yerel çalıştırmalar içinse yerel operatör denetimli bir secret dosyasında yaşar.

Önerilen secret adları:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- genel GitHub yapıtı yüklemeleri için `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

Uzun vadede, Convex kimlik bilgisi havuzu canlı taşıma kimlik bilgileri için normal kaynak olarak kalmalıdır. GitHub gizli değerleri aracıyı ve geri dönüş hatlarını önyükler.

Mantis çalıştırıcısı şunları asla yazdırmamalıdır:

- Discord bot belirteçleri
- sağlayıcı API anahtarları
- tarayıcı çerezleri
- kimlik doğrulama profili içerikleri
- VNC parolaları
- ham kimlik bilgisi yükleri

Genel yapıt yüklemeleri ayrıca bot, sunucu, kanal ve mesaj kimlikleri gibi Discord hedef meta verilerini de sansürlemelidir. GitHub smoke iş akışı bu nedenle `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ayarını etkinleştirir.

Bir belirteç yanlışlıkla bir issue'ya, PR'a, sohbete veya günlüğe yapıştırılırsa, yeni gizli değer saklandıktan sonra onu döndürün.

## GitHub Yapıtları Ve PR Yorumları

Mantis iş akışları tam kanıt paketini kısa ömürlü bir Actions yapıtı olarak yüklemelidir. İş akışı bir hata raporu veya düzeltme PR'ı için çalıştırıldığında, sansürlenmiş PNG ekran görüntülerini `qa-artifacts` dalına da yayımlamalı ve o hata ya da düzeltme PR'ında satır içi önce/sonra ekran görüntüleriyle bir yorumu eklemeli ya da güncellemelidir. Birincil kanıtı yalnızca genel bir QA otomasyonu PR'ında paylaşmayın. Ham günlükler, gözlemlenen mesajlar ve diğer hacimli kanıtlar Actions yapıtında kalır.

Production iş akışları bu yorumları `github-actions[bot]` ile değil, Mantis GitHub App ile paylaşmalıdır. Uygulama kimliğini ve özel anahtarı `MANTIS_GITHUB_APP_ID` ve `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions gizli değerleri olarak saklayın. İş akışı, ekleme/güncelleme anahtarı olarak gizli bir işaret kullanır, belirteç düzenleyebildiğinde o yorumu günceller ve eski bir bot sahibi işaret düzenlenemediğinde Mantis sahipliğinde yeni bir yorum oluşturur.

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

Çalıştırma, test düzeneği başarısız olduğu için başarısız olduğunda, yorum adayın başarısız olduğunu ima etmek yerine bunu söylemelidir.

## Özel Dağıtım Notları

Özel bir dağıtımda zaten bir Mantis Discord uygulaması olabilir. Doğru bot izinlerine sahipse ve güvenli şekilde döndürülebiliyorsa başka bir uygulama oluşturmak yerine o uygulamayı yeniden kullanın.

İlk operatör bildirim kanalını gizli değerler veya dağıtım yapılandırması üzerinden ayarlayın. Önce mevcut bir maintainer veya operasyon kanalını işaret edebilir, ardından böyle bir kanal oluştuğunda özel bir Mantis kanalına taşınabilir.

Sunucu kimliklerini, kanal kimliklerini, bot belirteçlerini, tarayıcı çerezlerini veya VNC parolalarını bu belgeye koymayın. Bunları GitHub gizli değerlerinde, kimlik bilgisi aracısında veya operatörün yerel gizli değer deposunda saklayın.

## Senaryo Ekleme

Bir Mantis senaryosu şunları bildirmelidir:

- kimlik ve başlık
- taşıma
- gerekli kimlik bilgileri
- temel ref ilkesi
- aday ref ilkesi
- OpenClaw yapılandırma yaması
- kurulum adımları
- uyaran
- beklenen temel oracle
- beklenen aday oracle
- görsel yakalama hedefleri
- zaman aşımı bütçesi
- temizlik adımları

Senaryolar küçük, tipli oracle'ları tercih etmelidir:

- tepki hataları için Discord tepki durumu
- iş parçacığı hataları için Discord mesaj referansları
- Slack hataları için Slack iş parçacığı ts'si ve tepki API durumu
- e-posta hataları için e-posta mesaj kimlikleri ve başlıkları
- UI tek güvenilir gözlemlenebilir olduğunda tarayıcı ekran görüntüleri

Görsel kontroller eklemeli olmalıdır. Bir platform API'si hatayı kanıtlayabiliyorsa, geçme/kalma oracle'ı olarak API'yi kullanın ve ekran görüntülerini insan güveni için saklayın.

## Sağlayıcı Genişletme

Discord'dan sonra aynı çalıştırıcı şunları ekleyebilir:

- Slack: tepkiler, iş parçacıkları, uygulama mention'ları, modallar, dosya yüklemeleri.
- E-posta: bağlayıcıların yeterli olmadığı yerlerde `gog` kullanarak Gmail kimlik doğrulaması ve mesaj iş parçacıkları.
- WhatsApp: QR oturumu açma, yeniden tanımlama, mesaj teslimi, medya, tepkiler.
- Telegram: grup mention kapısı, komutlar, mevcut olduğu yerlerde tepkiler.
- Matrix: şifreli odalar, iş parçacığı veya yanıt ilişkileri, yeniden başlatma sonrası devam.

Her taşımanın bir ucuz smoke senaryosu ve bir ya da daha fazla hata sınıfı senaryosu olmalıdır. Pahalı görsel senaryolar isteğe bağlı kalmalıdır.

## Açık Sorular

- Mevcut Mantis botu yeniden kullanıldığında hangi Discord botu sürücü, hangisi SUT olmalıdır?
- Gözlemci tarayıcı oturumu ilk aşamada bir insan Discord hesabı, bir test hesabı veya yalnızca bot tarafından okunabilir REST kanıtı mı kullanmalıdır?
- GitHub, PR'lar için Mantis yapıtlarını ne kadar süre saklamalıdır?
- ClawSweeper, bir maintainer komutunu beklemek yerine ne zaman otomatik olarak Mantis önermelidir?
- Genel PR'lar için ekran görüntüleri yüklemeden önce sansürlenmeli veya kırpılmalı mıdır?

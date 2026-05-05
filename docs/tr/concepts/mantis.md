---
read_when:
    - OpenClaw hataları için canlı görsel QA oluşturma veya çalıştırma
    - Bir çekme isteği için önce ve sonra doğrulaması ekleme
    - Discord, Slack, WhatsApp veya diğer canlı aktarım senaryolarını ekleme
    - Ekran görüntüleri, tarayıcı otomasyonu veya VNC erişimi gerektiren QA çalıştırmalarında hata ayıklama
summary: Mantis, canlı taşıma katmanlarında OpenClaw hatalarını yeniden üretmek, öncesi ve sonrası kanıtları yakalamak ve artefaktları PR'lara eklemek için kullanılan görsel uçtan uca doğrulama sistemidir.
title: Peygamberdevesi
x-i18n:
    generated_at: "2026-05-05T08:25:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis, gerçek bir çalışma zamanı, gerçek bir taşıma ve görünür kanıt gerektiren hatalar için OpenClaw uçtan uca doğrulama sistemidir. Bilinen kötü bir ref üzerinde bir senaryo çalıştırır, kanıt yakalar, aynı senaryoyu aday ref üzerinde çalıştırır ve karşılaştırmayı bir bakımcının bir PR'den veya yerel bir komuttan inceleyebileceği artefaktlar olarak yayımlar.

Mantis Discord ile başlar çünkü Discord bize yüksek değerli bir ilk hat sağlar: gerçek bot kimlik doğrulaması, gerçek guild kanalları, tepkiler, iş parçacıkları, yerel komutlar ve insanların taşımanın ne gösterdiğini görsel olarak doğrulayabileceği bir tarayıcı UI'si.

## Hedefler

- Bir GitHub issue'sundan veya PR'den gelen bir hatayı, kullanıcıların gördüğü aynı taşıma şekliyle yeniden üretmek.
- Düzeltmeyi uygulamadan önce temel ref üzerinde bir **önce** artefaktı yakalamak.
- Düzeltmeyi uyguladıktan sonra aday ref üzerinde bir **sonra** artefaktı yakalamak.
- Mümkün olduğunda Discord REST tepki okuması veya kanal transkripti kontrolü gibi deterministik bir doğrulama ölçütü kullanmak.
- Hatanın görünür bir UI yüzeyi olduğunda ekran görüntüleri yakalamak.
- Ajan denetimli CLI'dan yerel olarak ve GitHub'dan uzaktan çalıştırmak.
- Oturum açma, tarayıcı otomasyonu veya sağlayıcı kimlik doğrulaması takıldığında VNC kurtarma için yeterli makine durumunu korumak.
- Çalıştırma engellendiğinde, manuel VNC yardımı gerektiğinde veya bittiğinde bir operatör Discord kanalına kısa durum göndermek.

## Hedef Dışı Olanlar

- Mantis birim testlerinin yerine geçmez. Bir Mantis çalıştırması, düzeltme anlaşıldıktan sonra genellikle daha küçük bir regresyon testine dönüşmelidir.
- Mantis normal hızlı CI kapısı değildir. Daha yavaştır, canlı kimlik bilgileri kullanır ve canlı ortamın önemli olduğu hatalar için ayrılmıştır.
- Mantis normal çalışma için bir insan gerektirmemelidir. Manuel VNC, mutlu yol değil bir kurtarma yoludur.
- Mantis artefaktlarda, günlüklerde, ekran görüntülerinde, Markdown raporlarında veya PR yorumlarında ham sır saklamaz.

## Sahiplik

Mantis, OpenClaw QA yığınında yaşar.

- OpenClaw, `pnpm openclaw qa mantis` altındaki senaryo çalışma zamanının, taşıma adaptörlerinin, kanıt şemasının ve yerel CLI'ın sahibidir.
- QA Lab, canlı taşıma harness parçalarının, tarayıcı yakalama yardımcılarının ve artefakt yazıcılarının sahibidir.
- Crabbox, uzak bir VM gerektiğinde ısıtılmış Linux makinelerinin sahibidir.
- GitHub Actions, uzak workflow giriş noktasının ve artefakt saklamanın sahibidir.
- ClawSweeper, GitHub yorum yönlendirmesinin sahibidir: bakımcı komutlarını ayrıştırma, workflow'u dispatch etme ve son PR yorumunu gönderme.
- OpenClaw ajanları, bir senaryo ajanik kurulum, hata ayıklama veya takılı durum raporlaması gerektirdiğinde Mantis'i Codex üzerinden yürütür.

Bu sınır, taşıma bilgisini OpenClaw'da, makine zamanlamasını Crabbox'ta ve bakımcı workflow bağlayıcısını ClawSweeper'da tutar.

## Komut Şekli

İlk yerel komut Discord botunu, guild'i, kanalı, mesaj göndermeyi, tepki göndermeyi ve artefakt yolunu doğrular:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Yerel önce ve sonra çalıştırıcısı şu şekli kabul eder:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Çalıştırıcı, çıktı dizini altında ayrılmış temel ve aday çalışma ağaçları oluşturur, bağımlılıkları kurar, her ref'i derler, senaryoyu `--allow-failures` ile çalıştırır, ardından `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` yazar. İlk Discord senaryosu için başarılı bir doğrulama, temel durumunun `fail` ve aday durumunun `pass` olması demektir.

İlk VM/tarayıcı ilkel öğesi masaüstü smoke testidir:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Bir Crabbox masaüstü makinesi kiralar veya yeniden kullanır, VNC oturumu içinde görünür bir tarayıcı başlatır, masaüstünü yakalar, artefaktları yerel çıktı dizinine geri çeker ve yeniden bağlanma komutunu rapora yazar. Komut varsayılan olarak Hetzner sağlayıcısını kullanır çünkü Mantis hattında çalışan masaüstü/VNC kapsamına sahip ilk sağlayıcı odur. Başka bir Crabbox filosuna karşı çalıştırırken bunu `--provider`, `--crabbox-bin` veya `OPENCLAW_MANTIS_CRABBOX_PROVIDER` ile geçersiz kılın.

Yararlı masaüstü smoke bayrakları:

- `--lease-id <cbx_...>` veya `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ısıtılmış bir masaüstünü yeniden kullanır.
- `--browser-url <url>` görünür tarayıcıda açılan sayfayı değiştirir.
- `--html-file <path>` repo-yerel bir HTML artefaktını görünür tarayıcıda işler. Mantis bunu, oluşturulan Discord durum-tepki zaman çizelgesini gerçek bir Crabbox masaüstü üzerinden yakalamak için kullanır.
- `--keep-lease` veya `OPENCLAW_MANTIS_KEEP_VM=1` yeni oluşturulan başarılı bir kiralamayı VNC incelemesi için açık tutar. Başarısız çalıştırmalar, bir operatörün yeniden bağlanabilmesi için oluşturulmuşsa kiralamayı varsayılan olarak tutar.
- `--class`, `--idle-timeout` ve `--ttl` makine boyutunu ve kiralama ömrünü ayarlar.

İlk tam masaüstü taşıma ilkel öğesi Slack masaüstü smoke testidir:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bir Crabbox masaüstü makinesi kiralar veya yeniden kullanır, mevcut checkout'u VM içine eşitler, o VM içinde `pnpm openclaw qa slack` çalıştırır, VNC tarayıcısında Slack Web'i açar, görünür masaüstünü yakalar ve hem Slack QA artefaktlarını hem de VNC ekran görüntüsünü yerel çıktı dizinine geri kopyalar. Bu, SUT OpenClaw gateway'in ve tarayıcının aynı Linux masaüstü VM içinde yaşadığı ilk Mantis şeklidir.

`--gateway-setup` ile komut, `$HOME/.openclaw-mantis/slack-openclaw` konumunda kalıcı ve atılabilir bir OpenClaw home hazırlar, seçilen kanal için Slack Socket Mode yapılandırmasını yamalar, `38973` portunda `openclaw gateway run` başlatır ve Chrome'u VNC oturumunda çalışır durumda tutar. Bu, "bana Slack ve çalışan bir claw bulunan bir Linux masaüstü bırak" modudur; `--gateway-setup` atlandığında bot'tan bot'a Slack QA hattı varsayılan olarak kalır.

`--credential-source env` için gerekli girdiler:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- Uzak model hattı için `OPENCLAW_LIVE_OPENAI_KEY`. Yerel olarak yalnızca `OPENAI_API_KEY` ayarlıysa Mantis, Crabbox'ı çağırmadan önce bunu `OPENCLAW_LIVE_OPENAI_KEY` olarak eşler; böylece Crabbox'ın `OPENCLAW_*` env iletimi bunu VM'e taşıyabilir.

Yararlı Slack masaüstü bayrakları:

- `--lease-id <cbx_...>` bir operatörün VNC üzerinden Slack Web'e zaten giriş yaptığı bir makineye karşı yeniden çalıştırır.
- `--gateway-setup` yalnızca bot'tan bot'a QA hattını çalıştırmak yerine VM içinde kalıcı bir OpenClaw Slack gateway başlatır.
- `--slack-url <url>` belirli bir Slack Web URL'si açar. Bu olmadan Mantis, SUT bot token'ı kullanılabiliyorsa Slack `auth.test` içinden `https://app.slack.com/client/<team>/<channel>` türetir.
- `--slack-channel-id <id>` gateway kurulumu tarafından kullanılan Slack kanal allowlist'ini denetler.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` VM içindeki kalıcı Chrome profilini denetler. Varsayılan değer `$HOME/.config/openclaw-mantis/slack-chrome-profile` olduğundan manuel Slack Web oturumu aynı kiralamadaki yeniden çalıştırmalarda korunur.
- `--credential-source convex --credential-role ci` doğrudan Slack env token'ları yerine paylaşılan kimlik bilgisi havuzunu kullanır.
- `--provider-mode`, `--model`, `--alt-model` ve `--fast` Slack canlı hattına geçirilir.

GitHub smoke workflow'u `Mantis Discord Smoke`'tur. İlk gerçek senaryo için önce ve sonra GitHub workflow'u `Mantis Discord Status Reactions`'tır. Şunları kabul eder:

- `baseline_ref`: yalnızca kuyruğa alınmış davranışı yeniden üretmesi beklenen ref.
- `candidate_ref`: `queued -> thinking -> done` göstermesi beklenen ref.

Workflow harness ref'ini checkout eder, ayrı temel ve aday çalışma ağaçları derler, her çalışma ağacına karşı `discord-status-reactions-tool-only` çalıştırır ve `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` dosyalarını Actions artefaktları olarak yükler. Ayrıca her hattın zaman çizelgesi HTML'ini bir Crabbox masaüstü tarayıcısında işler ve bu VNC ekran görüntülerini deterministik zaman çizelgesi PNG'lerinin yanında PR yorumunda yayımlar. Aynı PR yorumu, `crabbox media preview` tarafından oluşturulan hafif, hareketi kırpılmış GIF önizlemelerini gömer, eşleşen hareketi kırpılmış MP4 kliplerine bağlantı verir ve derin inceleme için tam masaüstü MP4 dosyalarını tutar. Ekran görüntüleri hızlı inceleme için satır içinde kalır. Workflow, bir sonraki Crabbox ikili sürümü kesilmeden önce mevcut masaüstü/tarayıcı kiralama bayraklarını kullanabilmek için Crabbox CLI'ı `openclaw/crabbox` main'den derler.

`Mantis Scenario` genel manuel giriş noktasıdır. Bir `scenario_id`, `candidate_ref`, isteğe bağlı `baseline_ref` ve isteğe bağlı `pr_number` alır, ardından senaryonun sahibi olduğu workflow'u dispatch eder. Wrapper kasıtlı olarak incedir: senaryo workflow'ları hâlâ kendi taşıma kurulumlarının, kimlik bilgilerinin, VM sınıfının, beklenen doğrulama ölçütünün ve artefakt manifestinin sahibidir.

`Mantis Slack Desktop Smoke` ilk Slack VM workflow'udur. Güvenilir aday ref'i ayrı bir çalışma ağacında checkout eder, bir Crabbox Linux masaüstü kiralar, o adaya karşı `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` çalıştırır, VNC tarayıcısında Slack Web'i açar, masaüstünü kaydeder, `crabbox media preview` ile hareketi kırpılmış bir önizleme üretir, tam artefakt dizinini yükler ve isteğe bağlı olarak hedef PR'ye satır içi kanıt yorumunu gönderir. Bu hattı, yalnızca bot'tan bot'a Slack transkripti yerine "Slack ve çalışan bir claw bulunan bir Linux masaüstü" istediğinizde kullanın.

PR yayımlayan her senaryo, raporunun yanına `mantis-evidence.json` yazar. Bu şema, senaryo kodu ile GitHub yorumları arasındaki elden teslimdir:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Artefakt `path` değerleri manifest dizinine görelidir. `targetPath` değerleri, `qa-artifacts` dalı yayımlama dizini altındaki göreli yollardır. Yayımcı, yol geçişini reddeder ve isteğe bağlı önizlemeler veya videolar kullanılamadığında `"required": false` olarak işaretlenmiş girdileri atlar.

Desteklenen artefakt türleri:

- `timeline`: genellikle önce/sonra olmak üzere deterministik senaryo ekran görüntüsü.
- `desktopScreenshot`: VNC/tarayıcı masaüstü ekran görüntüsü.
- `motionPreview`: masaüstü kaydından oluşturulan satır içi animasyonlu GIF.
- `motionClip`: statik başlangıcı ve sonu kaldıran, hareketi kırpılmış MP4.
- `fullVideo`: derin inceleme için tam MP4 kaydı.
- `metadata`: JSON/günlük yan dosyası.
- `report`: Markdown raporu.

Yeniden kullanılabilir yayımcı `scripts/mantis/publish-pr-evidence.mjs`'dir. Workflow'lar onu manifest, hedef PR, `qa-artifacts` hedef kökü, yorum işaretçisi, Actions artefakt URL'si, çalıştırma URL'si ve istek kaynağı ile çağırır. Bildirilen artefaktları `qa-artifacts` dalına kopyalar, satır içi görseller/önizlemeler ve bağlantılı videolar içeren özet öncelikli bir PR yorumu oluşturur, ardından mevcut işaretçi yorumunu günceller veya yeni bir yorum oluşturur.

Durum-tepkileri çalıştırmasını doğrudan bir PR yorumundan da tetikleyebilirsiniz:

```text
@Mantis discord status reactions
```

Yorum tetikleyicisi kasıtlı olarak dardır. Yalnızca yazma, bakım veya yönetici erişimi olan kullanıcıların pull request yorumlarında çalışır ve yalnızca Discord durum-tepki isteklerini tanır. Varsayılan olarak bilinen kötü temel ref'i ve aday olarak mevcut PR head SHA'sını kullanır. Bakımcılar iki ref'i de geçersiz kılabilir:

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

1. Kimlik bilgilerini al.
2. Bir VM ayır veya yeniden kullan.
3. Senaryo UI kanıtı gerektirdiğinde masaüstü/tarayıcı profilini hazırla.
4. Temel referans için temiz bir checkout hazırla.
5. Bağımlılıkları kur ve yalnızca senaryonun ihtiyaç duyduklarını derle.
6. Yalıtılmış durum diziniyle bir alt OpenClaw Gateway başlat.
7. Canlı aktarımı, sağlayıcıyı, modeli ve tarayıcı profilini yapılandır.
8. Senaryoyu çalıştır ve temel kanıtı yakala.
9. Gateway'i durdur ve günlükleri koru.
10. Aday referansı aynı VM içinde hazırla.
11. Aynı senaryoyu çalıştır ve aday kanıtını yakala.
12. Oracle sonuçlarını ve görsel kanıtı karşılaştır.
13. Markdown, JSON, günlükler, ekran görüntüleri ve isteğe bağlı trace yapıtları yaz.
14. GitHub Actions yapıtlarını yükle.
15. Kısa bir PR veya Discord durum mesajı gönder.

Senaryo iki farklı şekilde başarısız olabilmelidir:

- **Hata yeniden üretildi**: temel sürüm beklenen şekilde başarısız oldu.
- **Harness hatası**: ortam kurulumu, kimlik bilgileri, Discord API, tarayıcı veya sağlayıcı, hata oracle'ı anlamlı hale gelmeden önce başarısız oldu.

Son rapor bu durumları ayırmalıdır; böylece maintainers kararsız bir ortamı ürün davranışıyla karıştırmaz.

## Discord MVP

İlk senaryo, kaynak yanıt teslim modunun `message_tool_only` olduğu guild kanallarındaki Discord durum tepkilerini hedeflemelidir.

İyi bir Mantis başlangıcı olmasının nedenleri:

- Discord'da tetikleyici mesaj üzerindeki tepkiler olarak görünür.
- Discord mesaj tepki durumu üzerinden güçlü bir REST oracle'ına sahiptir.
- Gerçek bir OpenClaw Gateway, Discord bot kimlik doğrulaması, mesaj gönderimi, kaynak yanıt teslim modu, durum tepki durumu ve model tur yaşam döngüsünü çalıştırır.
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

Temel kanıt, kuyruğa alınmış onay tepkisini göstermeli ancak yalnızca araç modunda yaşam döngüsü geçişi göstermemelidir. Aday kanıt, `messages.statusReactions.enabled` açıkça true olduğunda yaşam döngüsü durum tepkilerinin çalıştığını göstermelidir.

Çalıştırılabilir ilk parça, isteğe bağlı Discord canlı QA senaryosudur:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

SUT'yi her zaman açık guild işleme, `visibleReplies: "message_tool"`, `ackReaction: "👀"` ve açık durum tepkileriyle yapılandırır. Oracle, gerçek Discord tetikleyici mesajını yoklar ve gözlemlenen `👀 -> 🤔 -> 👍` sırasını bekler. Yapıtlar `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` ve `discord-status-reactions-tool-only-timeline.png` içerir.

## Mevcut QA Parçaları

Mantis, sıfırdan başlamak yerine mevcut özel QA yığını üzerine kurulmalıdır:

- `pnpm openclaw qa discord` zaten sürücü ve SUT botlarıyla canlı bir Discord şeridi çalıştırır.
- Canlı aktarım çalıştırıcısı zaten `.artifacts/qa-e2e/` altında raporlar ve gözlemlenen mesaj yapıtları yazar.
- Convex kimlik bilgisi kiralamaları, paylaşılan canlı aktarım kimlik bilgilerine zaten özel erişim sağlar.
- Tarayıcı kontrol hizmeti ekran görüntülerini, snapshot'ları, headless yönetilen profilleri ve uzak CDP profillerini zaten destekler.
- QA Lab zaten aktarım biçimli testler için bir hata ayıklayıcı UI'sine ve bus'a sahiptir.

İlk Mantis uygulaması, bu parçaların üzerinde ince bir önce/sonra çalıştırıcısı ve ek bir görsel kanıt katmanı olabilir.

## Kanıt Modeli

Her çalıştırma kararlı bir yapıt dizini yazar:

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

`mantis-summary.json` makine tarafından okunabilir doğruluk kaynağı olmalıdır. Markdown raporu PR yorumları ve insan incelemesi içindir.

Özet şunları içermelidir:

- test edilen referanslar ve SHA'lar
- aktarım ve senaryo kimliği
- makine sağlayıcısı ve makine kimliği veya kiralama kimliği
- gizli değerler olmadan kimlik bilgisi kaynağı
- temel sonuç
- aday sonuç
- hatanın temelde yeniden üretilip üretilmediği
- adayın bunu düzeltip düzeltmediği
- yapıt yolları
- temizlenmiş kurulum veya temizleme sorunları

Ekran görüntüleri kanıttır, secret değildir. Yine de redaksiyon disiplini gerekir: özel kanal adları, kullanıcı adları veya mesaj içeriği görünebilir. Genel PR'lar için redaksiyon hikayesi daha güçlü olana kadar satır içi görseller yerine GitHub Actions yapıt bağlantılarını tercih edin.

## Tarayıcı Ve VNC

Tarayıcı şeridinin iki modu vardır:

- **Headless otomasyon**: CI için varsayılan. Chrome, CDP etkin olarak çalışır ve Playwright veya OpenClaw tarayıcı kontrolü ekran görüntülerini yakalar.
- **VNC kurtarma**: oturum açma, MFA, Discord anti-otomasyon veya görsel hata ayıklama insan gerektirdiğinde aynı VM üzerinde etkinleştirilir.

Discord gözlemci tarayıcı profili, her çalıştırmada oturum açmayı önleyecek kadar kalıcı olmalı, ancak kişisel tarayıcı durumundan yalıtılmalıdır. Bir profil geliştirici dizüstü bilgisayarına değil, Mantis makine havuzuna aittir.

Mantis takıldığında şu bilgileri içeren bir Discord durum mesajı gönderir:

- çalıştırma kimliği
- senaryo kimliği
- makine sağlayıcısı
- yapıt dizini
- varsa VNC veya noVNC bağlantı talimatları
- kısa engelleyici metni

İlk özel dağıtım bu mesajları mevcut operatör kanalına gönderebilir ve daha sonra özel bir Mantis kanalına geçebilir.

## Makineler

Mantis, ilk uzak uygulama için Crabbox üzerinden AWS'yi tercih etmelidir. Crabbox bize ısıtılmış makineler, kiralama takibi, hydration, günlükler, sonuçlar ve temizleme sağlar. AWS kapasitesi çok yavaşsa veya kullanılamıyorsa, aynı makine arayüzünün arkasına bir Hetzner sağlayıcısı ekleyin.

Minimum VM gereksinimleri:

- masaüstü özellikli Chrome veya Chromium kurulumu olan Linux
- tarayıcı otomasyonu için CDP erişimi
- kurtarma için VNC veya noVNC
- Node 22 ve pnpm
- OpenClaw checkout'u ve bağımlılık önbelleği
- Playwright kullanıldığında Playwright Chromium tarayıcı önbelleği
- bir OpenClaw Gateway, bir tarayıcı ve bir model çalıştırması için yeterli CPU ve bellek
- Discord, GitHub, model sağlayıcıları ve kimlik bilgisi aracısına giden erişim

VM, beklenen kimlik bilgisi veya tarayıcı profil depoları dışında uzun ömürlü ham secret tutmamalıdır.

## Secrets

Secret'lar uzak çalıştırmalar için GitHub kuruluş veya depo secret'larında, yerel çalıştırmalar içinse yerel operatör denetimli secret dosyasında bulunur.

Önerilen secret adları:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- genel GitHub yapıt yüklemeleri için `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Uzun vadede Convex kimlik bilgisi havuzu, canlı aktarım kimlik bilgileri için normal kaynak olarak kalmalıdır. GitHub secret'ları aracıyı ve yedek şeritleri başlatır. Discord durum tepkileri workflow'u, Mantis Crabbox secret'larını Crabbox CLI'ın beklediği `CRABBOX_COORDINATOR` ve `CRABBOX_COORDINATOR_TOKEN` ortam değişkenlerine geri eşler. Düz `CRABBOX_*` GitHub secret adları, uyumluluk yedeği olarak kabul edilmeye devam eder.

Mantis çalıştırıcısı asla şunları yazdırmamalıdır:

- Discord bot token'ları
- sağlayıcı API anahtarları
- tarayıcı çerezleri
- auth profil içerikleri
- VNC parolaları
- ham kimlik bilgisi payload'ları

Genel yapıt yüklemeleri bot, guild, kanal ve mesaj kimlikleri gibi Discord hedef meta verilerini de redakte etmelidir. GitHub smoke workflow'u bu nedenle `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` etkinleştirir.

Bir token yanlışlıkla bir issue'ya, PR'a, sohbete veya günlüğe yapıştırılırsa, yeni secret saklandıktan sonra onu döndürün.

## GitHub Yapıtları Ve PR Yorumları

Mantis workflow'ları, tam kanıt paketini kısa ömürlü bir Actions yapıtı olarak yüklemelidir. Workflow bir hata raporu veya düzeltme PR'ı için çalıştırıldığında, redakte edilmiş PNG ekran görüntülerini `qa-artifacts` branch'ine yayımlamalı ve ilgili hata veya düzeltme PR'ında satır içi önce/sonra ekran görüntüleriyle bir yorumu upsert etmelidir. Birincil kanıtı yalnızca genel bir QA otomasyon PR'ına göndermeyin. Ham günlükler, gözlemlenen mesajlar ve diğer hacimli kanıtlar Actions yapıtında kalır.

Üretim workflow'ları bu yorumları `github-actions[bot]` ile değil, Mantis GitHub App ile göndermelidir. App id'sini ve özel anahtarı `MANTIS_GITHUB_APP_ID` ve `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secret'ları olarak saklayın. Workflow gizli bir marker'ı upsert anahtarı olarak kullanır, token onu düzenleyebildiğinde o yorumu günceller ve daha eski bot sahipli marker düzenlenemediğinde yeni bir Mantis sahipli yorum oluşturur.

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

Çalıştırma harness başarısız olduğu için başarısız olursa, yorum adayın başarısız olduğunu ima etmek yerine bunu söylemelidir.

## Özel Dağıtım Notları

Özel bir dağıtımda zaten bir Mantis Discord uygulaması olabilir. Doğru bot izinlerine sahipse ve güvenli şekilde döndürülebiliyorsa başka bir app oluşturmak yerine bu uygulamayı yeniden kullanın.

İlk operatör bildirim kanalını secret'lar veya dağıtım yapılandırması üzerinden ayarlayın. Önce mevcut bir maintainer veya operasyon kanalını gösterebilir, ardından bir tane oluşturulduğunda özel bir Mantis kanalına taşınabilir.

Guild kimliklerini, kanal kimliklerini, bot token'larını, tarayıcı çerezlerini veya VNC parolalarını bu belgeye koymayın. Bunları GitHub secret'larında, kimlik bilgisi aracısında veya operatörün yerel secret deposunda saklayın.

## Senaryo Ekleme

Bir Mantis senaryosu şunları bildirmelidir:

- kimlik ve başlık
- aktarım
- gerekli kimlik bilgileri
- temel referans politikası
- aday referans politikası
- OpenClaw yapılandırma patch'i
- kurulum adımları
- stimulus
- beklenen temel oracle
- beklenen aday oracle
- görsel yakalama hedefleri
- zaman aşımı bütçesi
- temizleme adımları

Senaryolar küçük, tipli oracle'ları tercih etmelidir:

- tepki hataları için Discord tepki durumu
- threading hataları için Discord mesaj referansları
- Slack hataları için Slack thread ts ve reaction API durumu
- e-posta hataları için e-posta mesaj kimlikleri ve header'ları
- UI tek güvenilir gözlemlenebilir olduğunda tarayıcı ekran görüntüleri

Vision kontrolleri eklemeli olmalıdır. Bir platform API'si hatayı kanıtlayabiliyorsa, API'yi geçme/kalma oracle'ı olarak kullanın ve ekran görüntülerini insan güveni için tutun.

## Sağlayıcı Genişletme

Discord'dan sonra aynı çalıştırıcı şunları ekleyebilir:

- Slack: reaksiyonlar, iş parçacıkları, uygulama mention'ları, modaller, dosya yüklemeleri.
- E-posta: bağlayıcıların yeterli olmadığı yerlerde `gog` kullanarak Gmail kimlik doğrulaması ve ileti dizileme.
- WhatsApp: QR ile oturum açma, yeniden kimliklendirme, ileti teslimi, medya, reaksiyonlar.
- Telegram: grup mention kapılaması, komutlar, kullanılabildiği yerlerde reaksiyonlar.
- Matrix: şifreli odalar, iş parçacığı veya yanıt ilişkileri, yeniden başlatma sonrası sürdürme.

Her taşımanın bir düşük maliyetli smoke senaryosu ve bir veya daha fazla hata sınıfı
senaryosu olmalıdır. Pahalı görsel senaryolar isteğe bağlı kalmalıdır.

## Açık Sorular

- Mevcut Mantis botu yeniden kullanıldığında hangi Discord botu sürücü, hangisi SUT olmalıdır?
- Gözlemci tarayıcı oturumu ilk aşama için bir insan Discord hesabı mı, bir test hesabı mı,
  yoksa yalnızca botun okuyabildiği REST kanıtını mı kullanmalıdır?
- GitHub, PR'ler için Mantis yapıtlarını ne kadar süre saklamalıdır?
- ClawSweeper ne zaman bir maintainer komutu beklemek yerine Mantis'i otomatik olarak önermelidir?
- Herkese açık PR'ler için ekran görüntüleri yüklemeden önce redakte edilmeli veya kırpılmalı mıdır?

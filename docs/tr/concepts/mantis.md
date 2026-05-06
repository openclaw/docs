---
read_when:
    - OpenClaw hataları için canlı görsel kalite güvencesi oluşturma veya çalıştırma
    - Bir çekme isteği için öncesi ve sonrası doğrulama ekleme
    - Discord, Slack, WhatsApp veya diğer canlı aktarım senaryolarını ekleme
    - Ekran görüntüleri, tarayıcı otomasyonu veya VNC erişimi gerektiren QA çalıştırmalarında hata ayıklama
summary: Mantis, OpenClaw hatalarını canlı taşıma katmanlarında yeniden üretmek, öncesi ve sonrası kanıtlarını yakalamak ve artifaktları PR'lara eklemek için kullanılan görsel uçtan uca doğrulama sistemidir.
title: Peygamberdevesi
x-i18n:
    generated_at: "2026-05-06T09:08:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis, gerçek bir çalışma zamanı, gerçek bir taşıma katmanı ve görünür kanıt
gerektiren hatalar için OpenClaw uçtan uca doğrulama sistemidir. Bilinen kötü
bir ref üzerinde bir senaryo çalıştırır, kanıt toplar, aynı senaryoyu aday ref
üzerinde çalıştırır ve karşılaştırmayı bir bakımcının PR'dan veya yerel bir
komuttan inceleyebileceği yapıtlar olarak yayımlar.

Mantis Discord ile başlar çünkü Discord bize yüksek değerli bir ilk hat sağlar:
gerçek bot kimlik doğrulaması, gerçek sunucu kanalları, tepkiler, konu başlıkları,
yerel komutlar ve insanların taşıma katmanının ne gösterdiğini görsel olarak
doğrulayabileceği bir tarayıcı kullanıcı arayüzü.

## Hedefler

- Bir GitHub issue veya PR'daki hatayı, kullanıcıların gördüğü aynı taşıma biçimiyle
  yeniden üretmek.
- Düzeltmeyi uygulamadan önce temel ref üzerinde bir **önce** yapıtı yakalamak.
- Düzeltmeyi uyguladıktan sonra aday ref üzerinde bir **sonra** yapıtı yakalamak.
- Mümkün olduğunda, Discord REST tepki okuması veya kanal dökümü denetimi gibi
  deterministik bir oracle kullanmak.
- Hatanın görünür bir kullanıcı arayüzü yüzeyi olduğunda ekran görüntüleri yakalamak.
- Yerel olarak ajan denetimli bir CLI'dan ve uzaktan GitHub'dan çalıştırmak.
- Oturum açma, tarayıcı otomasyonu veya sağlayıcı kimlik doğrulaması takıldığında
  VNC kurtarması için yeterli makine durumunu korumak.
- Çalıştırma engellendiğinde, manuel VNC yardımı gerektiğinde veya bittiğinde
  bir operatör Discord kanalına kısa durum göndermek.

## Hedef olmayanlar

- Mantis birim testlerinin yerine geçmez. Bir Mantis çalıştırması, düzeltme
  anlaşıldıktan sonra genellikle daha küçük bir regresyon testine dönüşmelidir.
- Mantis normal hızlı CI kapısı değildir. Daha yavaştır, canlı kimlik bilgileri
  kullanır ve canlı ortamın önemli olduğu hatalar için ayrılmıştır.
- Mantis normal çalışmada insan gerektirmemelidir. Manuel VNC mutlu yol değil,
  bir kurtarma yoludur.
- Mantis ham gizli bilgileri yapıtlarda, günlüklerde, ekran görüntülerinde, Markdown
  raporlarında veya PR yorumlarında saklamaz.

## Sahiplik

Mantis, OpenClaw QA yığınında yer alır.

- OpenClaw, `pnpm openclaw qa mantis` altındaki senaryo çalışma zamanının, taşıma
  bağdaştırıcılarının, kanıt şemasının ve yerel CLI'ın sahibidir.
- QA Lab canlı taşıma harness parçalarının, tarayıcı yakalama yardımcılarının ve
  yapıt yazıcılarının sahibidir.
- Uzaktan VM gerektiğinde ısıtılmış Linux makinelerinin sahibi Crabbox'tır.
- GitHub Actions uzaktan iş akışı giriş noktasının ve yapıt saklama süresinin sahibidir.
- ClawSweeper GitHub yorum yönlendirmesinin sahibidir: bakımcı komutlarını ayrıştırır,
  iş akışını gönderir ve son PR yorumunu yayınlar.
- OpenClaw ajanları, bir senaryonun ajansal kurulum, hata ayıklama veya takılmış
  durum raporlaması gerektirdiği durumlarda Mantis'i Codex üzerinden yürütür.

Bu sınır, taşıma bilgisini OpenClaw'da, makine zamanlamasını Crabbox'ta ve bakımcı
iş akışı bağlayıcılarını ClawSweeper'da tutar.

## Komut biçimi

İlk yerel komut Discord botunu, sunucuyu, kanalı, mesaj göndermeyi, tepki göndermeyi
ve yapıt yolunu doğrular:

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

Çalıştırıcı, çıktı dizini altında ayrık temel ve aday worktree'ler oluşturur,
bağımlılıkları kurar, her ref'i derler, senaryoyu `--allow-failures` ile çalıştırır,
ardından `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` yazar.
İlk Discord senaryosu için başarılı bir doğrulama, temel durumun `fail` ve aday
durumun `pass` olması anlamına gelir.

İkinci Discord önce/sonra yoklaması konu başlığı eklerini hedefler:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Bu senaryo sürücü botla bir üst mesaj gönderir, gerçek bir Discord konu başlığı
oluşturur, repo-yerel `filePath` ile OpenClaw'ın `message.thread-reply` eylemini
çağırır, ardından SUT yanıtı ve ek dosya adı için konu başlığını yoklar. Temel
ekran görüntüsü eki olmayan yanıtı gösterir; aday ekran görüntüsü beklenen
`mantis-thread-report.md` ekini gösterir.

İlk VM/tarayıcı primi masaüstü smoke'tur:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Bir Crabbox masaüstü makinesini kiralar veya yeniden kullanır, VNC oturumu içinde
görünür bir tarayıcı başlatır, masaüstünü yakalar, yapıtları yerel çıktı dizinine
geri çeker ve yeniden bağlanma komutunu rapora yazar. Komut varsayılan olarak
Hetzner sağlayıcısını kullanır çünkü Mantis hattında çalışan masaüstü/VNC kapsamına
sahip ilk sağlayıcı odur. Başka bir Crabbox filosuna karşı çalıştırırken bunu
`--provider`, `--crabbox-bin` veya `OPENCLAW_MANTIS_CRABBOX_PROVIDER` ile geçersiz
kılın.

Kullanışlı masaüstü smoke bayrakları:

- `--lease-id <cbx_...>` veya `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ısıtılmış bir masaüstünü yeniden kullanır.
- `--browser-url <url>` görünür tarayıcıda açılan sayfayı değiştirir.
- `--html-file <path>` görünür tarayıcıda repo-yerel bir HTML yapıtı işler. Mantis bunu, oluşturulan Discord durum-tepki zaman çizelgesini gerçek bir Crabbox masaüstü üzerinden yakalamak için kullanır.
- `--browser-profile-dir <remote-path>` uzak bir Chrome user-data-dir'ı yeniden kullanır, böylece kalıcı bir Mantis masaüstü çalıştırmalar arasında oturum açık kalabilir. Bunu uzun ömürlü Discord Web görüntüleyici profili için kullanın.
- `--browser-profile-archive-env <name>` tarayıcıyı başlatmadan önce adlandırılmış ortam değişkeninden base64 `.tgz` Chrome user-data-dir arşivini geri yükler. Bunu Discord Web gibi oturum açmış tanıklar için kullanın. Varsayılan env var `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64` olur.
- `--video-duration <seconds>` MP4 yakalama uzunluğunu denetler. Yerleşmesi için zamana ihtiyaç duyan yavaş, oturum açılmış web uygulamaları için daha uzun süre kullanın.
- `--keep-lease` veya `OPENCLAW_MANTIS_KEEP_VM=1` yeni oluşturulan ve geçen bir kiralamayı VNC incelemesi için açık tutar. Başarısız çalıştırmalar, bir operatör yeniden bağlanabilsin diye, oluşturulan kiralamayı varsayılan olarak tutar.
- `--class`, `--idle-timeout` ve `--ttl` makine boyutunu ve kiralama ömrünü ayarlar.

Discord Web kanıtı için Mantis, bot token yerine ayrılmış bir görüntüleyici hesabı
kullanır. Canlı Discord API senaryosu oracle olarak kalır: gerçek konu başlığını
oluşturur, SUT `thread-reply` gönderir ve eki Discord REST üzerinden denetler.
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` ayarlandığında senaryo ayrıca bir
Discord Web URL yapıtı yazar. `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` ayarlandığında,
oturum açmış bir tarayıcının açıp kaydedebilmesi için o konu başlığını yeterince
uzun süre kullanılabilir bırakır.

GitHub iş akışı aday konu başlığı URL'sini Discord Web'de açar, bir ekran görüntüsü
yakalar, bir MP4 kaydeder ve Crabbox medya araçları kullanılabilir olduğunda kırpılmış
bir GIF önizlemesi oluşturur. `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` üzerinden
yapılandırılmış kalıcı bir görüntüleyici profil yolunu tercih edin, çünkü tam
Chrome profil arşivleri GitHub'ın gizli boyutu sınırını aşabilir. Küçük/bootstrap
profiller için iş akışı ayrıca `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`
üzerinden base64 `.tgz` arşivini geri yükleyebilir. Hiçbir profil kaynağı
yapılandırılmamışsa iş akışı yine de deterministik temel/aday ek ekran görüntülerini
yayımlar ve oturum açılmış Discord Web tanığının atlandığına dair bir bildirim
günlüğe yazar.

İlk tam masaüstü taşıma primi Slack masaüstü smoke'tur:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bir Crabbox masaüstü makinesini kiralar veya yeniden kullanır, mevcut checkout'ı
VM içine eşitler, o VM içinde `pnpm openclaw qa slack` çalıştırır, VNC tarayıcısında
Slack Web'i açar, görünür masaüstünü yakalar ve hem Slack QA yapıtlarını hem de
VNC ekran görüntüsünü yerel çıktı dizinine kopyalar. Bu, SUT OpenClaw gateway ve
tarayıcının aynı Linux masaüstü VM içinde yaşadığı ilk Mantis biçimidir.

`--gateway-setup` ile komut `$HOME/.openclaw-mantis/slack-openclaw` konumunda kalıcı
tek kullanımlık bir OpenClaw home hazırlar, seçilen kanal için Slack Socket Mode
yapılandırmasını yamalar, `38973` portunda `openclaw gateway run` başlatır ve
Chrome'u VNC oturumunda çalışır durumda tutar. Bu, "bana Slack ve çalışan bir claw
olan Linux masaüstü bırak" modudur; `--gateway-setup` atlandığında bot-bota Slack
QA hattı varsayılan olarak kalır.

`--credential-source env` için gerekli girdiler:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- Uzak model hattı için `OPENCLAW_LIVE_OPENAI_KEY`. Yerelde yalnızca
  `OPENAI_API_KEY` ayarlıysa Mantis, Crabbox'ı çağırmadan önce bunu `OPENCLAW_LIVE_OPENAI_KEY`
  olarak eşler, böylece Crabbox'ın `OPENCLAW_*` env iletimi onu VM içine taşıyabilir.

`--gateway-setup --credential-source convex` ile Mantis, VM oluşturmadan önce
paylaşılan havuzdan Slack SUT kimlik bilgisini kiralar ve kiralanan kanal id'sini,
Socket Mode app token'ını ve bot token'ını masaüstü içindeki `OPENCLAW_MANTIS_SLACK_*`
çalışma zamanı env olarak iletir. Bu, GitHub iş akışlarını ince tutar: ham Slack
bot veya app token'ları değil, yalnızca Convex broker gizli bilgisi gerekir.

Kullanışlı Slack masaüstü bayrakları:

- `--lease-id <cbx_...>` bir operatörün VNC üzerinden Slack Web'e zaten oturum açtığı bir makineye karşı yeniden çalıştırır.
- `--gateway-setup` yalnızca bot-bota QA hattını çalıştırmak yerine VM'de kalıcı bir OpenClaw Slack gateway başlatır.
- `--keep-lease` başarıdan sonra gateway VM'ini VNC incelemesi için açık tutar; `--no-keep-lease` yapıtları topladıktan sonra durdurur.
- `--slack-url <url>` belirli bir Slack Web URL'si açar. Bu yoksa, SUT bot token kullanılabilir olduğunda Mantis Slack `auth.test` üzerinden `https://app.slack.com/client/<team>/<channel>` türetir.
- `--slack-channel-id <id>` gateway kurulumu tarafından kullanılan Slack kanal izin listesini denetler.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` VM içindeki kalıcı Chrome profilini denetler. Varsayılan `$HOME/.config/openclaw-mantis/slack-chrome-profile` olur, böylece manuel Slack Web oturumu aynı kiralamadaki yeniden çalıştırmalarda korunur.
- `--credential-source convex --credential-role ci` doğrudan Slack env token'ları yerine paylaşılan kimlik bilgisi havuzunu kullanır.
- `--provider-mode`, `--model`, `--alt-model` ve `--fast` Slack canlı hattına geçirilir.

GitHub smoke iş akışı `Mantis Discord Smoke`'tur. İlk gerçek senaryo için önce
ve sonra GitHub iş akışı `Mantis Discord Status Reactions`'tır. Şunları kabul eder:

- `baseline_ref`: yalnızca queued davranışını yeniden üretmesi beklenen ref.
- `candidate_ref`: `queued -> thinking -> done` göstermesi beklenen ref.

İş akışı harness ref'ini checkout eder, ayrı temel ve aday worktree'ler derler,
her worktree'ye karşı `discord-status-reactions-tool-only` çalıştırır ve `baseline/`,
`candidate/`, `comparison.json` ve `mantis-report.md` dosyalarını Actions yapıtları
olarak yükler. Ayrıca her hattın zaman çizelgesi HTML'ini bir Crabbox masaüstü
tarayıcısında işler ve bu VNC ekran görüntülerini, PR yorumunda deterministik
zaman çizelgesi PNG'lerinin yanında yayımlar. Aynı PR yorumu, `crabbox media preview`
tarafından oluşturulan hafif hareket-kırpılmış GIF önizlemelerini gömer, eşleşen
hareket-kırpılmış MP4 kliplerine bağlantı verir ve derin inceleme için tam masaüstü
MP4 dosyalarını saklar. Ekran görüntüleri hızlı inceleme için satır içinde kalır.
İş akışı Crabbox CLI'ı `openclaw/crabbox` main üzerinden derler, böylece bir sonraki
Crabbox ikili sürümü kesilmeden önce mevcut masaüstü/tarayıcı kiralama bayraklarını
kullanabilir.

`Mantis Scenario` genel manuel giriş noktasıdır. Bir `scenario_id`, `candidate_ref`,
isteğe bağlı `baseline_ref` ve isteğe bağlı `pr_number` alır, ardından senaryo
sahipli iş akışını gönderir. Sarmalayıcı bilinçli olarak incedir: senaryo iş
akışları yine kendi taşıma kurulumlarının, kimlik bilgilerinin, VM sınıfının,
beklenen oracle'ın ve yapıt manifest'inin sahibidir.

`Mantis Slack Desktop Smoke`, ilk Slack VM iş akışıdır. Ayrı bir worktree içinde
güvenilir aday ref’i checkout eder, bir Crabbox Linux masaüstü kiralar,
bu aday üzerinde `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`
çalıştırır, VNC tarayıcısında Slack Web’i açar, masaüstünü kaydeder,
`crabbox media preview` ile hareket kırpılmış bir önizleme oluşturur, tam artifact
dizinini yükler ve isteğe bağlı olarak hedef PR’a satır içi kanıt yorumunu gönderir.
Masaüstü kirası için varsayılan olarak AWS kullanır ve operatörlerin AWS kapasitesi
yavaş veya kullanılamaz olduğunda Hetzner’e geçebilmesi için manuel bir sağlayıcı
girdisi sunar. Yalnızca botlar arası bir Slack dökümü yerine "Slack ve çalışan bir
claw bulunan bir Linux masaüstü" istediğinizde bu lane’i kullanın.

Her PR yayımlama senaryosu, raporunun yanına `mantis-evidence.json` yazar.
Bu şema, senaryo kodu ile GitHub yorumları arasındaki handoff’tur:

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

Artifact `path` değerleri manifest dizinine görelidir. `targetPath` değerleri,
`qa-artifacts` dalı yayımlama dizini altındaki göreli yollardır. Yayımlayıcı path
traversal’ı reddeder ve isteğe bağlı önizlemeler veya videolar kullanılamadığında
`"required": false` olarak işaretlenmiş girdileri atlar.

Desteklenen artifact türleri:

- `timeline`: genellikle önce/sonra biçiminde deterministik senaryo ekran görüntüsü.
- `desktopScreenshot`: VNC/tarayıcı masaüstü ekran görüntüsü.
- `motionPreview`: masaüstü kaydından oluşturulan satır içi animasyonlu GIF.
- `motionClip`: statik başlangıcı ve sonu kaldıran hareket kırpılmış MP4.
- `fullVideo`: derin inceleme için tam MP4 kaydı.
- `metadata`: JSON/günlük sidecar’ı.
- `report`: Markdown raporu.

Yeniden kullanılabilir yayımlayıcı `scripts/mantis/publish-pr-evidence.mjs`’dir.
İş akışları onu manifest, hedef PR, `qa-artifacts` hedef kökü, yorum işaretleyicisi,
Actions artifact URL’si, çalıştırma URL’si ve istek kaynağı ile çağırır. Bildirilen
artifact’leri `qa-artifacts` dalına kopyalar, satır içi görseller/önizlemeler ve
bağlantılı videolarla özet öncelikli bir PR yorumu oluşturur, ardından mevcut
işaretleyici yorumunu günceller veya yeni bir yorum oluşturur.

Durum tepkileri çalıştırmasını doğrudan bir PR yorumundan da tetikleyebilirsiniz:

```text
@Mantis discord status reactions
```

Yorum tetikleyicisi bilinçli olarak dardır. Yalnızca yazma, bakım veya yönetici
erişimi olan kullanıcıların pull request yorumlarında çalışır ve yalnızca Discord
durum tepkisi isteklerini tanır. Varsayılan olarak bilinen hatalı baseline ref’ini
ve aday olarak geçerli PR head SHA’sını kullanır. Bakımcılar her iki ref’i de
geçersiz kılabilir:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper komut örnekleri:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

İlk komut açık ve senaryo odaklıdır. İkincisi daha sonra bir PR’ı veya issue’yu
etiketlerden, değişen dosyalardan ve ClawSweeper inceleme bulgularından önerilen
Mantis senaryolarına eşleyebilir.

## Çalıştırma yaşam döngüsü

1. Kimlik bilgilerini edin.
2. Bir VM ayır veya yeniden kullan.
3. Senaryo UI kanıtına ihtiyaç duyduğunda masaüstü/tarayıcı profilini hazırla.
4. Baseline ref’i için temiz bir checkout hazırla.
5. Bağımlılıkları kur ve yalnızca senaryonun ihtiyaç duyduklarını derle.
6. Yalıtılmış durum diziniyle bir alt OpenClaw Gateway başlat.
7. Canlı transport’u, sağlayıcıyı, modeli ve tarayıcı profilini yapılandır.
8. Senaryoyu çalıştır ve baseline kanıtını yakala.
9. Gateway’i durdur ve günlükleri koru.
10. Aynı VM’de aday ref’i hazırla.
11. Aynı senaryoyu çalıştır ve aday kanıtını yakala.
12. Oracle sonuçlarını ve görsel kanıtı karşılaştır.
13. Markdown, JSON, günlükler, ekran görüntüleri ve isteğe bağlı trace artifact’leri yaz.
14. GitHub Actions artifact’lerini yükle.
15. Kısa bir PR veya Discord durum mesajı gönder.

Senaryo iki farklı şekilde başarısız olabilmelidir:

- **Hata yeniden üretildi**: baseline beklenen şekilde başarısız oldu.
- **Harness hatası**: ortam kurulumu, kimlik bilgileri, Discord API, tarayıcı veya
  sağlayıcı, hata oracle’ı anlamlı olmadan önce başarısız oldu.

Son rapor bu durumları ayırmalıdır; böylece bakımcılar dalgalı bir ortamı ürün
davranışıyla karıştırmaz.

## Discord MVP

İlk senaryo, kaynak yanıt teslim modunun `message_tool_only` olduğu guild
kanallarındaki Discord durum tepkilerini hedeflemelidir.

İyi bir Mantis başlangıcı olmasının nedenleri:

- Discord’da tetikleyici mesaj üzerindeki tepkiler olarak görünür.
- Discord mesaj tepki durumu üzerinden güçlü bir REST oracle’ı vardır.
- Gerçek bir OpenClaw Gateway’i, Discord bot kimlik doğrulamasını, mesaj
  dağıtımını, kaynak yanıt teslim modunu, durum tepki durumunu ve model turu
  yaşam döngüsünü çalıştırır.
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

Baseline kanıtı, queued onay tepkisini göstermeli ancak tool-only modunda yaşam
döngüsü geçişi göstermemelidir. Aday kanıtı, `messages.statusReactions.enabled`
açıkça true olduğunda yaşam döngüsü durum tepkilerinin çalıştığını göstermelidir.

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

SUT’u her zaman açık guild işleme, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` ve açık durum tepkileriyle yapılandırır. Oracle
gerçek Discord tetikleyici mesajını yoklar ve gözlemlenen `👀 -> 🤔 -> 👍` dizisini
bekler. Artifact’ler `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` ve
`discord-status-reactions-tool-only-timeline.png` içerir.

## Mevcut QA parçaları

Mantis, sıfırdan başlamak yerine mevcut özel QA yığını üzerine inşa edilmelidir:

- `pnpm openclaw qa discord` zaten sürücü ve SUT botlarıyla canlı bir Discord lane’i çalıştırır.
- Canlı transport runner zaten `.artifacts/qa-e2e/` altında raporlar ve
  gözlemlenen mesaj artifact’leri yazar.
- Convex kimlik bilgisi kiraları, paylaşılan canlı transport kimlik bilgilerine
  zaten özel erişim sağlar.
- Tarayıcı kontrol servisi ekran görüntülerini, snapshot’ları, headless yönetilen
  profilleri ve uzak CDP profillerini zaten destekler.
- QA Lab’de transport biçimli testler için zaten bir hata ayıklayıcı UI’ı ve bus vardır.

İlk Mantis uygulaması, bu parçalar üzerinde ince bir önce/sonra runner’ı ve ek
bir görsel kanıt katmanı olabilir.

## Kanıt modeli

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

- test edilen ref’ler ve SHA’lar
- transport ve senaryo id’si
- makine sağlayıcısı ve makine id’si veya kira id’si
- gizli değerler olmadan kimlik bilgisi kaynağı
- baseline sonucu
- aday sonucu
- hatanın baseline üzerinde yeniden üretilip üretilmediği
- adayın bunu düzeltip düzeltmediği
- artifact yolları
- sanitize edilmiş kurulum veya temizlik sorunları

Ekran görüntüleri kanıttır, secret değildir. Yine de redaksiyon disiplini
gerektirir: özel kanal adları, kullanıcı adları veya mesaj içeriği görünebilir.
Herkese açık PR’lar için redaksiyon hikayesi güçlenene kadar satır içi görseller
yerine GitHub Actions artifact bağlantılarını tercih edin.

## Tarayıcı ve VNC

Tarayıcı lane’inin iki modu vardır:

- **Headless otomasyon**: CI için varsayılan. Chrome, CDP etkinleştirilmiş şekilde
  çalışır ve Playwright veya OpenClaw tarayıcı kontrolü ekran görüntülerini yakalar.
- **VNC kurtarma**: oturum açma, MFA, Discord anti-otomasyon veya görsel hata
  ayıklama bir insana ihtiyaç duyduğunda aynı VM üzerinde etkinleştirilir.

Discord gözlemci tarayıcı profili, her çalıştırmada oturum açmayı önleyecek kadar
kalıcı olmalı, ancak kişisel tarayıcı durumundan yalıtılmış olmalıdır. Bir profil,
geliştirici dizüstü bilgisayarına değil Mantis makine havuzuna aittir.

Mantis takıldığında şu bilgileri içeren bir Discord durum mesajı gönderir:

- çalıştırma id’si
- senaryo id’si
- makine sağlayıcısı
- artifact dizini
- varsa VNC veya noVNC bağlantı talimatları
- kısa engelleyici metni

İlk özel dağıtım bu mesajları mevcut operatör kanalına gönderebilir ve daha sonra
özel bir Mantis kanalına geçebilir.

## Makineler

Mantis ilk uzak uygulama için Crabbox üzerinden AWS’yi tercih etmelidir.
Crabbox bize ısıtılmış makineler, kira takibi, hydration, günlükler, sonuçlar ve
temizlik sağlar. AWS kapasitesi çok yavaşsa veya kullanılamıyorsa, aynı makine
arayüzünün arkasına bir Hetzner sağlayıcısı ekleyin.

Minimum VM gereksinimleri:

- masaüstü destekli Chrome veya Chromium kurulumu olan Linux
- tarayıcı otomasyonu için CDP erişimi
- kurtarma için VNC veya noVNC
- Node 22 ve pnpm
- OpenClaw checkout’u ve bağımlılık önbelleği
- Playwright kullanıldığında Playwright Chromium tarayıcı önbelleği
- bir OpenClaw Gateway, bir tarayıcı ve bir model çalıştırması için yeterli CPU ve bellek
- Discord, GitHub, model sağlayıcıları ve kimlik bilgisi broker’ına outbound erişim

VM, beklenen kimlik bilgisi veya tarayıcı profili depoları dışında uzun ömürlü
ham secret’ları tutmamalıdır.

## Secret’lar

Secret’lar uzak çalıştırmalar için GitHub organizasyon veya depo secret’larında,
yerel çalıştırmalar içinse yerel operatör kontrollü secret dosyasında bulunur.

Önerilen secret adları:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- herkese açık GitHub artifact yüklemeleri için `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Uzun vadede Convex kimlik bilgisi havuzu, canlı transport kimlik bilgileri için
normal kaynak olarak kalmalıdır. GitHub secret’ları broker’ı ve fallback lane’leri
bootstrap eder. Discord durum tepkileri iş akışı, Mantis Crabbox secret’larını
Crabbox CLI’ın beklediği `CRABBOX_COORDINATOR` ve `CRABBOX_COORDINATOR_TOKEN`
ortam değişkenlerine geri eşler. Düz `CRABBOX_*` GitHub secret adları uyumluluk
fallback’i olarak kabul edilmeye devam eder.

Mantis runner asla şunları yazdırmamalıdır:

- Discord bot token’ları
- sağlayıcı API anahtarları
- tarayıcı cookie’leri
- auth profili içerikleri
- VNC parolaları
- ham kimlik bilgisi payload’ları

Herkese açık artifact yüklemeleri bot, guild, kanal ve mesaj id’leri gibi Discord
hedef metadata’sını da redakte etmelidir. GitHub smoke iş akışı bu nedenle
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` etkinleştirir.

Bir token yanlışlıkla bir issue’ya, PR’a, sohbete veya günlüğe yapıştırılırsa,
yeni secret saklandıktan sonra onu rotate edin.

## GitHub artifact’leri ve PR yorumları

Mantis iş akışları, eksiksiz kanıt paketini kısa ömürlü bir Actions artifact'ı olarak yüklemelidir. İş akışı bir hata raporu veya düzeltme PR'ı için çalıştırıldığında, redakte edilmiş PNG ekran görüntülerini `qa-artifacts` dalında da yayımlamalı ve bu hata veya düzeltme PR'ında satır içi önce/sonra ekran görüntüleri içeren bir yorumu ekleyip güncellemelidir. Birincil kanıtı yalnızca genel bir QA otomasyonu PR'ında yayımlamayın. Ham günlükler, gözlemlenen iletiler ve diğer hacimli kanıtlar Actions artifact'ında kalır.

Üretim iş akışları bu yorumları `github-actions[bot]` ile değil, Mantis GitHub App ile göndermelidir. Uygulama kimliğini ve özel anahtarı `MANTIS_GITHUB_APP_ID` ve `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions gizli dizileri olarak saklayın. İş akışı gizli bir işaretçiyi upsert anahtarı olarak kullanır, token düzenleyebildiğinde bu yorumu günceller ve bot'a ait daha eski bir işaretçi düzenlenemediğinde Mantis'e ait yeni bir yorum oluşturur.

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

Çalıştırma, test koşumu başarısız olduğu için başarısız olduğunda, yorum adayın başarısız olduğunu ima etmek yerine bunu söylemelidir.

## Özel dağıtım notları

Özel bir dağıtımda zaten bir Mantis Discord uygulaması olabilir. Doğru bot izinlerine sahipse ve güvenli şekilde rotasyona sokulabiliyorsa başka bir uygulama oluşturmak yerine bu uygulamayı yeniden kullanın.

İlk operatör bildirim kanalını gizli diziler veya dağıtım yapılandırması üzerinden ayarlayın. Önce mevcut bir bakımcı veya operasyon kanalını gösterebilir, ardından bir tane oluşturulduğunda özel bir Mantis kanalına taşınabilir.

Guild kimliklerini, kanal kimliklerini, bot token'larını, tarayıcı çerezlerini veya VNC parolalarını bu belgeye koymayın. Bunları GitHub gizli dizilerinde, kimlik bilgisi aracısında veya operatörün yerel gizli veri deposunda saklayın.

## Senaryo ekleme

Bir Mantis senaryosu şunları tanımlamalıdır:

- kimlik ve başlık
- taşıma
- gerekli kimlik bilgileri
- temel referans politikası
- aday referans politikası
- OpenClaw yapılandırma yaması
- kurulum adımları
- tetikleyici
- beklenen temel doğrulayıcı
- beklenen aday doğrulayıcı
- görsel yakalama hedefleri
- zaman aşımı bütçesi
- temizleme adımları

Senaryolar küçük, türlendirilmiş doğrulayıcıları tercih etmelidir:

- tepki hataları için Discord tepki durumu
- iş parçacığı hataları için Discord ileti referansları
- Slack hataları için Slack iş parçacığı ts'si ve tepki API durumu
- e-posta hataları için e-posta ileti kimlikleri ve üstbilgileri
- arayüz tek güvenilir gözlemlenebilir çıktı olduğunda tarayıcı ekran görüntüleri

Görsel kontroller ek nitelikte olmalıdır. Bir platform API'si hatayı kanıtlayabiliyorsa, API'yi geçti/kaldı doğrulayıcısı olarak kullanın ve ekran görüntülerini insanların emin olması için tutun.

## Sağlayıcı genişletmesi

Discord'dan sonra aynı çalıştırıcı şunları ekleyebilir:

- Slack: tepkiler, iş parçacıkları, uygulama bahsetmeleri, modal pencereler, dosya yüklemeleri.
- E-posta: bağlayıcıların yeterli olmadığı yerlerde `gog` kullanarak Gmail kimlik doğrulaması ve ileti iş parçacıkları.
- WhatsApp: QR ile oturum açma, yeniden kimliklendirme, ileti teslimi, medya, tepkiler.
- Telegram: grup bahsetme denetimi, komutlar, mevcut olduğunda tepkiler.
- Matrix: şifreli odalar, iş parçacığı veya yanıt ilişkileri, yeniden başlatmadan sonra sürdürme.

Her taşımanın bir hafif duman testi senaryosu ve bir veya daha fazla hata sınıfı senaryosu olmalıdır. Maliyetli görsel senaryolar isteğe bağlı kalmalıdır.

## Açık sorular

- Mevcut Mantis botu yeniden kullanıldığında hangi Discord botu sürücü, hangisi SUT olmalıdır?
- Gözlemci tarayıcı oturumu ilk aşamada bir kişiye ait Discord hesabını mı, bir test hesabını mı, yoksa yalnızca bot tarafından okunabilir REST kanıtını mı kullanmalıdır?
- GitHub, PR'lar için Mantis artifact'larını ne kadar süre saklamalıdır?
- ClawSweeper ne zaman bir bakımcı komutunu beklemek yerine Mantis'i otomatik olarak önermelidir?
- Herkese açık PR'lar için ekran görüntüleri yüklemeden önce redakte edilmeli veya kırpılmalı mıdır?

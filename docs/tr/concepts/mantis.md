---
read_when:
    - OpenClaw hataları için canlı görsel kalite güvencesi oluşturma veya çalıştırma
    - Bir çekme isteği için öncesi ve sonrası doğrulama ekleme
    - Discord, Slack, WhatsApp veya diğer canlı aktarım senaryolarını ekleme
    - Ekran görüntüleri, tarayıcı otomasyonu veya VNC erişimi gerektiren QA çalıştırmalarında hata ayıklama
summary: Mantis, canlı taşımalarda OpenClaw hatalarını yeniden üretmek, öncesi ve sonrası kanıtları yakalamak ve artifaktları PR'lere eklemek için kullanılan görsel uçtan uca doğrulama sistemidir.
title: Peygamberdevesi
x-i18n:
    generated_at: "2026-05-10T19:32:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis, gerçek bir çalışma zamanı, gerçek bir taşıma ve görünür kanıt gerektiren
hatalar için OpenClaw uçtan uca doğrulama sistemidir. Bilinen hatalı bir ref'e
karşı bir senaryo çalıştırır, kanıt toplar, aynı senaryoyu aday bir ref'e karşı
çalıştırır ve karşılaştırmayı, bir bakımcının bir PR'dan veya yerel bir komuttan
inceleyebileceği artifact'ler olarak yayımlar.

Mantis, Discord ile başlar çünkü Discord bize yüksek değerli bir ilk hat sağlar:
gerçek bot kimlik doğrulaması, gerçek guild kanalları, reaksiyonlar, thread'ler,
yerel komutlar ve insanların taşımanın gösterdiğini görsel olarak doğrulayabildiği
bir tarayıcı kullanıcı arayüzü.

## Hedefler

- Bir GitHub issue'sundan veya PR'ından bir hatayı, kullanıcıların gördüğü aynı
  taşıma biçimiyle yeniden üretmek.
- Düzeltmeyi uygulamadan önce baseline ref üzerinde bir **önce** artifact'i
  yakalamak.
- Düzeltmeyi uyguladıktan sonra aday ref üzerinde bir **sonra** artifact'i
  yakalamak.
- Mümkün olduğunda Discord REST reaksiyon okuması veya kanal transcript kontrolü
  gibi deterministik bir oracle kullanmak.
- Hatanın görünür bir kullanıcı arayüzü yüzeyi olduğunda ekran görüntüleri
  yakalamak.
- Ajan kontrollü bir CLI'dan yerel olarak ve GitHub'dan uzaktan çalışmak.
- Oturum açma, tarayıcı otomasyonu veya sağlayıcı kimlik doğrulaması takıldığında
  VNC kurtarma için yeterli makine durumunu korumak.
- Çalıştırma engellendiğinde, manuel VNC yardımı gerektiğinde veya tamamlandığında
  bir operatör Discord kanalına kısa durum göndermek.

## Hedef Dışı

- Mantis, birim testlerin yerine geçmez. Bir Mantis çalıştırması, düzeltme
  anlaşıldıktan sonra genellikle daha küçük bir regresyon testine dönüşmelidir.
- Mantis normal hızlı CI kapısı değildir. Daha yavaştır, canlı kimlik bilgileri
  kullanır ve canlı ortamın önemli olduğu hatalar için ayrılmıştır.
- Mantis normal çalışmada bir insan gerektirmemelidir. Manuel VNC mutlu yol
  değil, bir kurtarma yoludur.
- Mantis ham sırları artifact'lerde, loglarda, ekran görüntülerinde, Markdown
  raporlarında veya PR yorumlarında saklamaz.

## Sahiplik

Mantis, OpenClaw QA yığınının içinde yer alır.

- OpenClaw, senaryo çalışma zamanının, taşıma bağdaştırıcılarının, kanıt şemasının
  ve `pnpm openclaw qa mantis` altındaki yerel CLI'ın sahibidir.
- QA Lab, canlı taşıma harness parçalarının, tarayıcı yakalama yardımcılarının ve
  artifact yazıcılarının sahibidir.
- Uzak VM gerektiğinde ısıtılmış Linux makinelerinin sahibi Crabbox'tır.
- GitHub Actions, uzak workflow giriş noktasının ve artifact saklamanın sahibidir.
- ClawSweeper, GitHub yorum yönlendirmesinin sahibidir: bakımcı komutlarını
  ayrıştırma, workflow'u dispatch etme ve son PR yorumunu gönderme.
- Bir senaryo agentic kurulum, hata ayıklama veya takılı durum raporlaması
  gerektirdiğinde OpenClaw ajanları Mantis'i Codex üzerinden yürütür.

Bu sınır, taşıma bilgisini OpenClaw'da, makine zamanlamasını Crabbox'ta ve
bakımcı workflow bağlayıcı mantığını ClawSweeper'da tutar.

## Komut biçimi

İlk yerel komut Discord botunu, guild'i, kanalı, mesaj göndermeyi, reaksiyon
göndermeyi ve artifact yolunu doğrular:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Yerel önce ve sonra runner'ı şu biçimi kabul eder:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner, output dizini altında ayrılmış baseline ve candidate worktree'leri
oluşturur, bağımlılıkları kurar, her ref'i build eder, senaryoyu
`--allow-failures` ile çalıştırır, ardından `baseline/`, `candidate/`,
`comparison.json` ve `mantis-report.md` yazar. İlk Discord senaryosu için
başarılı bir doğrulama, baseline durumunun `fail` ve candidate durumunun `pass`
olduğu anlamına gelir.

İkinci Discord önce/sonra probe'u thread attachment'larını hedefler:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Bu senaryo driver bot ile bir parent mesaj gönderir, gerçek bir Discord thread'i
oluşturur, repo yerelinde bir `filePath` ile OpenClaw'ın `message.thread-reply`
action'ını çağırır, ardından SUT yanıtı ve attachment dosya adı için thread'i
poll eder. Baseline ekran görüntüsü yanıtı attachment olmadan gösterir; candidate
ekran görüntüsü beklenen `mantis-thread-report.md` attachment'ını gösterir.

İlk VM/tarayıcı primitive'i masaüstü smoke testidir:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Bir Crabbox masaüstü makinesini kiralar veya yeniden kullanır, VNC oturumu içinde
görünür bir tarayıcı başlatır, masaüstünü yakalar, artifact'leri yerel output
dizinine geri çeker ve yeniden bağlanma komutunu rapora yazar. Komut varsayılan
olarak Hetzner sağlayıcısını kullanır çünkü Mantis hattında çalışan masaüstü/VNC
kapsamına sahip ilk sağlayıcı odur. Başka bir Crabbox filosuna karşı çalışırken
bunu `--provider`, `--crabbox-bin` veya
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` ile override edin.

Kullanışlı masaüstü smoke flag'leri:

- `--lease-id <cbx_...>` veya `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ısıtılmış bir masaüstünü yeniden kullanır.
- `--browser-url <url>` görünür tarayıcıda açılan sayfayı değiştirir.
- `--html-file <path>` repo yerelindeki bir HTML artifact'ini görünür tarayıcıda render eder. Mantis bunu, oluşturulan Discord durum-reaksiyon zaman çizelgesini gerçek bir Crabbox masaüstü üzerinden yakalamak için kullanır.
- `--browser-profile-dir <remote-path>` uzak bir Chrome user-data-dir'ini yeniden kullanır, böylece kalıcı bir Mantis masaüstü çalıştırmalar arasında oturum açık kalabilir. Bunu uzun ömürlü Discord Web görüntüleyici profili için kullanın.
- `--browser-profile-archive-env <name>` tarayıcıyı başlatmadan önce adlandırılmış ortam değişkeninden base64 `.tgz` Chrome user-data-dir arşivini geri yükler. Bunu Discord Web gibi oturum açmış tanıklar için kullanın. Varsayılan env var `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64` değeridir.
- `--video-duration <seconds>` MP4 yakalama uzunluğunu kontrol eder. Oturmuş hale gelmesi zaman alan yavaş, oturum açılmış web uygulamaları için daha uzun bir süre kullanın.
- `--keep-lease` veya `OPENCLAW_MANTIS_KEEP_VM=1` yeni oluşturulmuş başarılı bir lease'i VNC incelemesi için açık tutar. Başarısız çalıştırmalar, bir operatör yeniden bağlanabilsin diye lease oluşturulduysa varsayılan olarak lease'i açık tutar.
- `--class`, `--idle-timeout` ve `--ttl` makine boyutunu ve lease ömrünü ayarlar.

Discord Web kanıtı için Mantis bot token yerine ayrılmış bir görüntüleyici hesabı
kullanır. Canlı Discord API senaryosu oracle olarak kalır: gerçek thread'i
oluşturur, SUT `thread-reply` gönderir ve attachment'ı Discord REST üzerinden
kontrol eder. `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` ayarlandığında senaryo
ayrıca bir Discord Web URL artifact'i yazar. `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`
ayarlandığında, oturum açmış bir tarayıcının açıp kaydedebilmesi için o thread'i
yeterince uzun süre kullanılabilir bırakır.

GitHub workflow'u candidate thread URL'sini Discord Web'de açar, ekran görüntüsü
yakalar, bir MP4 kaydeder ve Crabbox medya tooling'i kullanılabilir olduğunda
kırpılmış hareketli bir GIF önizlemesi oluşturur. `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`
üzerinden yapılandırılmış kalıcı bir görüntüleyici profil yolunu tercih edin,
çünkü tam Chrome profil arşivleri GitHub'ın secret boyutu sınırını aşabilir.
Küçük/bootstrap profilleri için workflow ayrıca
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` içinden base64 `.tgz` arşivini
geri yükleyebilir. Hiçbir profil kaynağı yapılandırılmamışsa workflow yine de
deterministik baseline/candidate attachment ekran görüntülerini yayımlar ve
oturum açılmış Discord Web tanığının atlandığına dair bir notice loglar.

İlk tam masaüstü taşıma primitive'i Slack masaüstü smoke testidir:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bir Crabbox masaüstü makinesini kiralar veya yeniden kullanır, mevcut checkout'u
VM içine sync eder, o VM içinde `pnpm openclaw qa slack` çalıştırır, VNC
tarayıcısında Slack Web'i açar, görünür masaüstünü yakalar ve hem Slack QA
artifact'lerini hem de VNC ekran görüntüsünü yerel output dizinine kopyalar. Bu,
SUT OpenClaw Gateway'inin ve tarayıcının aynı Linux masaüstü VM'i içinde yaşadığı
ilk Mantis biçimidir.

`--gateway-setup` ile komut, `$HOME/.openclaw-mantis/slack-openclaw` konumunda
kalıcı, disposable bir OpenClaw home hazırlar, seçilen kanal için Slack Socket
Mode yapılandırmasını patch eder, `38973` portunda `openclaw gateway run`
başlatır ve Chrome'u VNC oturumunda çalışır halde tutar. Bu, "bana Slack ve
çalışan bir claw olan bir Linux masaüstü bırak" modudur; `--gateway-setup`
atlanınca bot-to-bot Slack QA hattı varsayılan olarak kalır.

`--credential-source env` için gerekli girdiler:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- Uzak model hattı için `OPENCLAW_LIVE_OPENAI_KEY`. Yerelde yalnızca
  `OPENAI_API_KEY` ayarlıysa Mantis, Crabbox'ı çağırmadan önce bunu
  `OPENCLAW_LIVE_OPENAI_KEY` değerine map eder, böylece Crabbox'ın `OPENCLAW_*`
  env forwarding'i bunu VM içine taşıyabilir.

`--gateway-setup --credential-source convex` ile Mantis, VM oluşturmadan önce
Slack SUT credential'ını paylaşılan pool'dan kiralar ve kiralanan kanal id'sini,
Socket Mode app token'ını ve bot token'ını masaüstü içinde
`OPENCLAW_MANTIS_SLACK_*` runtime env olarak forward eder. Bu, GitHub
workflow'larını ince tutar: ham Slack bot veya app token'ları değil, yalnızca
Convex broker secret'ı gerekir.

Kullanışlı Slack masaüstü flag'leri:

- `--lease-id <cbx_...>` bir operatörün VNC üzerinden Slack Web'de zaten oturum açtığı bir makineye karşı yeniden çalıştırır.
- `--gateway-setup` yalnızca bot-to-bot QA hattını çalıştırmak yerine VM'de kalıcı bir OpenClaw Slack Gateway'i başlatır.
- `--keep-lease` başarılı olduktan sonra Gateway VM'ini VNC incelemesi için açık tutar; `--no-keep-lease` artifact'leri topladıktan sonra durdurur.
- `--slack-url <url>` belirli bir Slack Web URL'si açar. Bu olmadan Mantis, SUT bot token kullanılabilir olduğunda Slack `auth.test` üzerinden `https://app.slack.com/client/<team>/<channel>` türetir.
- `--slack-channel-id <id>` Gateway kurulumu tarafından kullanılan Slack kanal allowlist'ini kontrol eder.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` VM içindeki kalıcı Chrome profilini kontrol eder. Varsayılan `$HOME/.config/openclaw-mantis/slack-chrome-profile` değeridir, böylece manuel Slack Web oturumu aynı lease üzerindeki yeniden çalıştırmalarda korunur.
- `--credential-source convex --credential-role ci` doğrudan Slack env token'ları yerine paylaşılan credential pool'unu kullanır.
- `--provider-mode`, `--model`, `--alt-model` ve `--fast` Slack canlı hattına aktarılır.

GitHub smoke workflow'u `Mantis Discord Smoke` adını taşır. İlk gerçek senaryo
için önce ve sonra GitHub workflow'u `Mantis Discord Status Reactions` adını
taşır. Şunları kabul eder:

- `baseline_ref`: queued-only davranışını yeniden üretmesi beklenen ref.
- `candidate_ref`: `queued -> thinking -> done` göstermesi beklenen ref.

Workflow harness ref'ini checkout eder, ayrı baseline ve candidate worktree'leri
build eder, her worktree'ye karşı `discord-status-reactions-tool-only`
çalıştırır ve `baseline/`, `candidate/`, `comparison.json` ve
`mantis-report.md` dosyalarını Actions artifact'leri olarak yükler. Ayrıca her
hattın zaman çizelgesi HTML'ini bir Crabbox masaüstü tarayıcısında render eder ve
bu VNC ekran görüntülerini PR yorumunda deterministik zaman çizelgesi PNG'lerinin
yanında yayımlar. Aynı PR yorumu, `crabbox media preview` tarafından oluşturulan
hafif, hareket kırpılmış GIF önizlemelerini gömer, eşleşen hareket kırpılmış MP4
kliplerine bağlantı verir ve derin inceleme için tam masaüstü MP4 dosyalarını
tutar. Ekran görüntüleri hızlı inceleme için inline kalır. Workflow, bir sonraki
Crabbox binary release'i çıkmadan önce güncel masaüstü/tarayıcı lease flag'lerini
kullanabilmek için Crabbox CLI'ını `openclaw/crabbox` main üzerinden build eder.

`Mantis Scenario` genel manuel giriş noktasıdır. Bir `scenario_id`,
`candidate_ref`, isteğe bağlı `baseline_ref` ve isteğe bağlı `pr_number` alır,
ardından senaryonun sahibi olduğu workflow'u dispatch eder. Wrapper bilinçli
olarak incedir: senaryo workflow'ları hâlâ kendi taşıma kurulumlarının,
credential'larının, VM class'ının, beklenen oracle'ının ve artifact manifest'inin
sahibidir.

`Mantis Slack Desktop Smoke`, ilk Slack VM iş akışıdır. Güvenilen aday ref değerini ayrı bir worktree içinde checkout eder, bir Crabbox Linux masaüstü kiralar, bu aday üzerinde `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` çalıştırır, VNC tarayıcısında Slack Web'i açar, masaüstünü kaydeder, `crabbox media preview` ile hareket kırpılmış bir önizleme oluşturur, tüm artifact dizinini yükler ve isteğe bağlı olarak hedef PR üzerinde satır içi kanıt yorumunu gönderir. Masaüstü kirası için varsayılan olarak AWS kullanır ve operatörlerin AWS kapasitesi yavaş ya da kullanılamaz olduğunda Hetzner'e geçebilmesi için manuel provider girdisi sunar. Yalnızca bottan bota Slack transkripti yerine "Slack ve çalışan bir claw içeren bir Linux masaüstü" istediğinizde bu lane'i kullanın.

`Mantis Telegram Live`, mevcut Telegram canlı QA lane'ini aynı PR kanıt pipeline'ı içinde sarmalar. Güvenilen aday ref değerini ayrı bir worktree içinde checkout eder, `pnpm openclaw qa telegram --credential-source convex
--credential-role ci` çalıştırır, Telegram QA özetinden ve gözlemlenen ileti artifact'inden bir `mantis-evidence.json` manifesti yazar, redakte edilmiş transkript HTML'sini bir Crabbox masaüstü tarayıcısı üzerinden render eder, `crabbox media preview` ile hareket kırpılmış bir GIF oluşturur ve bir PR numarası mevcut olduğunda satır içi PR kanıt yorumunu gönderir. Bu lane, oturum açılmış Telegram Web kanıtı yerine transkript görselidir: Telegram Bot API kararlı canlı ileti kanıtı sağlar, ancak normal Mantis otomasyonu için Telegram Web oturum durumu gerekmez.

İnsan döngülü Telegram masaüstü kurulumu için scenario builder kullanın:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Builder bir Crabbox masaüstü kiralar veya yeniden kullanır, yerel Linux Telegram Desktop binary'sini kurar, isteğe bağlı olarak bir kullanıcı oturumu arşivini geri yükler, OpenClaw'u kiralanan Telegram SUT bot token'ı ile yapılandırır, `38974` portunda `openclaw gateway run` başlatır, kiralanan özel gruba driver bot hazır olma iletisi gönderir, ardından görünür VNC masaüstünden bir ekran görüntüsü ve MP4 yakalar. Bir bot token'ı Telegram Desktop'a asla giriş yapmaz; yalnızca OpenClaw'u yapılandırır. Masaüstü görüntüleyicisi, `--telegram-profile-archive-env <name>` üzerinden geri yüklenen veya VNC üzerinden manuel olarak oluşturulan ve `--keep-lease` ile canlı tutulan ayrı bir Telegram kullanıcı oturumudur.

Yararlı Telegram masaüstü builder bayrakları:

- `--lease-id <cbx_...>` bir operatörün Telegram Desktop'a zaten giriş yaptığı bir VM üzerinde yeniden çalıştırır.
- `--telegram-profile-archive-env <name>` bu env var içinden base64 `.tgz` Telegram Desktop profil arşivini okur ve başlatmadan önce geri yükler.
- `--telegram-profile-dir <remote-path>` uzak Telegram Desktop profil dizinini denetler. Varsayılan `$HOME/.local/share/TelegramDesktop` değeridir.
- `--no-gateway-setup` OpenClaw'u yapılandırmadan Telegram Desktop'ı kurar ve açar.
- `--credential-source convex --credential-role ci` doğrudan Telegram env token'ları yerine paylaşılan credential broker kullanır.

PR yayımlayan her senaryo, raporunun yanına `mantis-evidence.json` yazar. Bu şema, senaryo kodu ile GitHub yorumları arasındaki devir teslimdir:

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

Artifact `path` değerleri manifest dizinine göre göreli olur. `targetPath` değerleri, `qa-artifacts` branch yayımlama dizini altındaki göreli yollardır. Publisher path traversal girişimlerini reddeder ve isteğe bağlı önizlemeler veya videolar kullanılamadığında `"required": false` olarak işaretlenmiş girdileri atlar.

Desteklenen artifact türleri:

- `timeline`: genellikle önce/sonra için deterministik senaryo ekran görüntüsü.
- `desktopScreenshot`: VNC/tarayıcı masaüstü ekran görüntüsü.
- `motionPreview`: masaüstü kaydından oluşturulan satır içi animasyonlu GIF.
- `motionClip`: statik başlangıcı ve sonu kaldıran hareket kırpılmış MP4.
- `fullVideo`: ayrıntılı inceleme için tam MP4 kaydı.
- `metadata`: JSON/günlük yardımcı dosyası.
- `report`: Markdown raporu.

Yeniden kullanılabilir publisher `scripts/mantis/publish-pr-evidence.mjs` dosyasıdır. Workflows bunu manifest, hedef PR, `qa-artifacts` hedef kökü, yorum işaretçisi, Actions artifact URL'si, run URL'si ve istek kaynağı ile çağırır. Bildirilen artifact'leri `qa-artifacts` branch'ine kopyalar, satır içi görseller/önizlemeler ve bağlantılı videolar içeren özet öncelikli bir PR yorumu oluşturur, ardından mevcut işaretçi yorumunu günceller veya yeni bir tane oluşturur.

Status-reactions çalıştırmasını doğrudan bir PR yorumundan da tetikleyebilirsiniz:

```text
@Mantis discord status reactions
```

Yorum tetikleyicisi özellikle dardır. Yalnızca yazma, bakım veya admin erişimi olan kullanıcılardan gelen pull request yorumlarında çalışır ve yalnızca Discord durum tepkisi isteklerini tanır. Varsayılan olarak bilinen hatalı baseline ref değerini ve aday olarak mevcut PR head SHA'sını kullanır. Maintainer'lar iki ref değerinden herhangi birini geçersiz kılabilir:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram canlı QA da bir PR yorumundan tetiklenebilir:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Varsayılan olarak aday olarak mevcut PR head SHA'sını kullanır ve `telegram-status-command` çalıştırır. Maintainer'lar belirli bir ref veya önceden ısıtılmış bir Crabbox masaüstüne ihtiyaç duyduklarında `candidate=...`, `provider=aws|hetzner` ve `lease=<cbx_...>` değerlerini geçersiz kılabilir.

ClawSweeper komut örnekleri:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

İlk komut açık ve senaryo odaklıdır. İkincisi daha sonra bir PR veya issue'yu etiketlerden, değişen dosyalardan ve ClawSweeper inceleme bulgularından önerilen Mantis senaryolarına eşleyebilir.

## Çalıştırma yaşam döngüsü

1. Kimlik bilgilerini al.
2. Bir VM ayır veya yeniden kullan.
3. Senaryo UI kanıtı gerektirdiğinde masaüstü/tarayıcı profilini hazırla.
4. Baseline ref için temiz bir checkout hazırla.
5. Bağımlılıkları kur ve yalnızca senaryonun ihtiyaç duyduğu kısmı derle.
6. Yalıtılmış state diziniyle bir alt OpenClaw Gateway başlat.
7. Canlı transport'u, provider'ı, modeli ve tarayıcı profilini yapılandır.
8. Senaryoyu çalıştır ve baseline kanıtını yakala.
9. Gateway'i durdur ve günlükleri koru.
10. Aynı VM içinde aday ref değerini hazırla.
11. Aynı senaryoyu çalıştır ve aday kanıtını yakala.
12. Oracle sonuçlarını ve görsel kanıtı karşılaştır.
13. Markdown, JSON, günlükler, ekran görüntüleri ve isteğe bağlı trace artifact'leri yaz.
14. GitHub Actions artifact'lerini yükle.
15. Kısa bir PR veya Discord durum iletisi gönder.

Senaryo iki farklı şekilde başarısız olabilmelidir:

- **Hata yeniden üretildi**: baseline beklenen şekilde başarısız oldu.
- **Harness hatası**: ortam kurulumu, kimlik bilgileri, Discord API, tarayıcı veya provider, hata oracle anlamlı olmadan önce başarısız oldu.

Son rapor bu durumları ayırmalıdır; böylece maintainer'lar kararsız bir ortamı ürün davranışıyla karıştırmaz.

## Discord MVP

İlk senaryo, kaynak yanıt teslim modunun `message_tool_only` olduğu guild kanallarındaki Discord durum tepkilerini hedeflemelidir.

İyi bir Mantis başlangıcı olmasının nedenleri:

- Discord içinde tetikleyici iletide tepkiler olarak görünür.
- Discord ileti tepki durumu üzerinden güçlü bir REST oracle sunar.
- Gerçek bir OpenClaw Gateway, Discord bot auth, ileti dispatch'i, kaynak yanıt teslim modu, durum tepki durumu ve model turn yaşam döngüsünü çalıştırır.
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

Baseline kanıtı, kuyruğa alındı onay tepkisini göstermeli ancak yalnızca araç modunda yaşam döngüsü geçişi göstermemelidir. Aday kanıtı, `messages.statusReactions.enabled` açıkça `true` olduğunda yaşam döngüsü durum tepkilerinin çalıştığını göstermelidir.

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

SUT'yi her zaman açık guild işleme, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` ve açık durum tepkileri ile yapılandırır. Oracle, gerçek Discord tetikleyici iletisini yoklar ve gözlemlenen `👀 -> 🤔 -> 👍` dizisini bekler. Artifact'ler `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` ve `discord-status-reactions-tool-only-timeline.png` içerir.

## Mevcut QA parçaları

Mantis, sıfırdan başlamak yerine mevcut özel QA yığını üzerine inşa edilmelidir:

- `pnpm openclaw qa discord` zaten driver ve SUT botlarıyla canlı bir Discord lane'i çalıştırır.
- Canlı transport runner zaten `.artifacts/qa-e2e/` altında raporlar ve gözlemlenen ileti artifact'leri yazar.
- Convex credential lease'leri zaten paylaşılan canlı transport kimlik bilgilerine özel erişim sağlar.
- Tarayıcı denetim servisi zaten ekran görüntülerini, snapshot'ları, headless yönetilen profilleri ve uzak CDP profillerini destekler.
- QA Lab zaten transport biçimli testler için bir debugger UI ve bus içerir.

İlk Mantis uygulaması, bu parçalar üzerinde ince bir önce/sonra runner ve bir görsel kanıt katmanı olabilir.

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

`mantis-summary.json`, makine tarafından okunabilir doğruluk kaynağı olmalıdır. Markdown raporu PR yorumları ve insan incelemesi içindir.

Özet şunları içermelidir:

- test edilen ref değerleri ve SHA'lar
- transport ve senaryo id'si
- makine provider'ı ve makine id'si veya lease id'si
- gizli değerler olmadan kimlik bilgisi kaynağı
- baseline sonucu
- aday sonucu
- hatanın baseline üzerinde yeniden üretilip üretilmediği
- adayın bunu düzeltip düzeltmediği
- artifact yolları
- sanitize edilmiş kurulum veya temizleme sorunları

Ekran görüntüleri kanıttır, gizli değildir. Yine de redaksiyon disiplini gerektirirler: özel kanal adları, kullanıcı adları veya ileti içeriği görünebilir. Herkese açık PR'lar için redaksiyon hikayesi güçlenene kadar satır içi görseller yerine GitHub Actions artifact bağlantılarını tercih edin.

## Tarayıcı ve VNC

Tarayıcı lane'inin iki modu vardır:

- **Headless otomasyon**: CI için varsayılandır. Chrome, CDP etkin şekilde çalışır ve Playwright veya OpenClaw tarayıcı denetimi ekran görüntülerini yakalar.
- **VNC kurtarma**: giriş, MFA, Discord anti-automation veya görsel hata ayıklama bir insan gerektirdiğinde aynı VM üzerinde etkinleştirilir.

Discord gözlemci tarayıcı profili, her çalıştırmada giriş yapmayı önleyecek kadar kalıcı olmalı, ancak kişisel tarayıcı durumundan yalıtılmalıdır. Profil, bir geliştirici dizüstü bilgisayarına değil, Mantis makine havuzuna aittir.

Mantis takıldığında, şu bilgileri içeren bir Discord durum iletisi gönderir:

- çalıştırma kimliği
- senaryo kimliği
- makine sağlayıcısı
- artefakt dizini
- varsa VNC veya noVNC bağlantı talimatları
- kısa engelleyici metni

İlk özel dağıtım bu mesajları mevcut operatör kanalına gönderebilir ve daha sonra özel bir Mantis kanalına geçebilir.

## Makineler

Mantis, ilk uzak uygulama için Crabbox üzerinden AWS’yi tercih etmelidir. Crabbox bize ısıtılmış makineler, kiralama takibi, hidrasyon, günlükler, sonuçlar ve temizlik sağlar. AWS kapasitesi çok yavaşsa veya kullanılamıyorsa, aynı makine arayüzünün arkasına bir Hetzner sağlayıcısı ekleyin.

Minimum VM gereksinimleri:

- Masaüstü çalıştırabilen Chrome veya Chromium kurulumuna sahip Linux
- Tarayıcı otomasyonu için CDP erişimi
- Kurtarma için VNC veya noVNC
- Node 22 ve pnpm
- OpenClaw checkout’u ve bağımlılık önbelleği
- Playwright kullanıldığında Playwright Chromium tarayıcı önbelleği
- bir OpenClaw Gateway, bir tarayıcı ve bir model çalıştırması için yeterli CPU ve bellek
- Discord, GitHub, model sağlayıcıları ve kimlik bilgisi aracısına giden erişim

VM, beklenen kimlik bilgisi veya tarayıcı profili depolarının dışında uzun ömürlü ham sırlar tutmamalıdır.

## Sırlar

Sırlar uzak çalıştırmalar için GitHub kuruluş veya depo sırlarında, yerel çalıştırmalar için yerel, operatör denetimli bir sır dosyasında tutulur.

Önerilen sır adları:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- herkese açık GitHub artefakt yüklemeleri için `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Uzun vadede, Convex kimlik bilgisi havuzu canlı aktarım kimlik bilgileri için normal kaynak olarak kalmalıdır. GitHub sırları, aracıyı ve yedek hatları başlatır. Discord durum tepkileri iş akışı, Mantis Crabbox sırlarını Crabbox CLI’nin beklediği `CRABBOX_COORDINATOR` ve `CRABBOX_COORDINATOR_TOKEN` ortam değişkenlerine geri eşler. Düz `CRABBOX_*` GitHub sır adları uyumluluk yedeği olarak kabul edilmeye devam eder.

Mantis çalıştırıcısı asla şunları yazdırmamalıdır:

- Discord bot token’ları
- sağlayıcı API anahtarları
- tarayıcı çerezleri
- auth profili içerikleri
- VNC parolaları
- ham kimlik bilgisi yükleri

Herkese açık artefakt yüklemeleri ayrıca bot, guild, kanal ve mesaj kimlikleri gibi Discord hedef meta verilerini de redakte etmelidir. GitHub smoke iş akışı bu nedenle `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` etkinleştirir.

Bir token yanlışlıkla bir issue, PR, sohbet veya günlüğe yapıştırılırsa, yeni sır depolandıktan sonra onu döndürün.

## GitHub artefaktları ve PR yorumları

Mantis iş akışları tam kanıt paketini kısa ömürlü bir Actions artefaktı olarak yüklemelidir. İş akışı bir hata raporu veya düzeltme PR’ı için çalıştırıldığında, redakte edilmiş PNG ekran görüntülerini `qa-artifacts` dalına da yayımlamalı ve ilgili hata veya düzeltme PR’ında satır içi önce/sonra ekran görüntüleriyle bir yorumu upsert etmelidir. Birincil kanıtı yalnızca genel bir QA otomasyon PR’ına göndermeyin. Ham günlükler, gözlemlenen mesajlar ve diğer hacimli kanıtlar Actions artefaktında kalır.

Üretim iş akışları bu yorumları `github-actions[bot]` ile değil, Mantis GitHub App ile göndermelidir. Uygulama kimliğini ve özel anahtarı `MANTIS_GITHUB_APP_ID` ve `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions sırları olarak saklayın. İş akışı, upsert anahtarı olarak gizli bir işaretçi kullanır, token düzenleyebildiğinde bu yorumu günceller ve eski, bot sahipli bir işaretçi düzenlenemediğinde Mantis sahipli yeni bir yorum oluşturur.

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

## Özel dağıtım notları

Özel bir dağıtımda zaten bir Mantis Discord uygulaması olabilir. Doğru bot izinlerine sahipse ve güvenli şekilde döndürülebiliyorsa, başka bir app oluşturmak yerine bu uygulamayı yeniden kullanın.

İlk operatör bildirim kanalını sırlar veya dağıtım yapılandırması üzerinden ayarlayın. Önce mevcut bir maintainer veya operasyon kanalını işaret edebilir, ardından oluşturulduğunda özel bir Mantis kanalına taşınabilir.

Guild kimliklerini, kanal kimliklerini, bot token’larını, tarayıcı çerezlerini veya VNC parolalarını bu belgeye koymayın. Bunları GitHub sırlarında, kimlik bilgisi aracısında veya operatörün yerel sır deposunda saklayın.

## Senaryo ekleme

Bir Mantis senaryosu şunları bildirmelidir:

- kimlik ve başlık
- aktarım
- gerekli kimlik bilgileri
- baseline ref politikası
- candidate ref politikası
- OpenClaw yapılandırma yaması
- kurulum adımları
- uyarım
- beklenen baseline oracle’ı
- beklenen candidate oracle’ı
- görsel yakalama hedefleri
- zaman aşımı bütçesi
- temizlik adımları

Senaryolar küçük, türlendirilmiş oracle’ları tercih etmelidir:

- tepki hataları için Discord tepki durumu
- iş parçacığı hataları için Discord mesaj referansları
- Slack hataları için Slack thread ts ve tepki API durumu
- e-posta hataları için e-posta mesaj kimlikleri ve başlıkları
- UI tek güvenilir gözlemlenebilir olduğunda tarayıcı ekran görüntüleri

Görüntü kontrolleri eklemeli olmalıdır. Bir platform API’si hatayı kanıtlayabiliyorsa, API’yi geçer/kalır oracle’ı olarak kullanın ve ekran görüntülerini insan güveni için tutun.

## Sağlayıcı genişletme

Discord’dan sonra aynı çalıştırıcı şunları ekleyebilir:

- Slack: tepkiler, thread’ler, app bahsetmeleri, modallar, dosya yüklemeleri.
- E-posta: bağlayıcıların yeterli olmadığı yerlerde `gog` kullanarak Gmail auth ve mesaj iş parçacığı.
- WhatsApp: QR girişi, yeniden tanımlama, mesaj teslimi, medya, tepkiler.
- Telegram: grup bahsetme kapısı, komutlar, mevcut olduğunda tepkiler.
- Matrix: şifreli odalar, thread veya yanıt ilişkileri, yeniden başlatma sonrası sürdürme.

Her aktarımda bir ucuz smoke senaryosu ve bir veya daha fazla hata sınıfı senaryosu olmalıdır. Pahalı görsel senaryolar isteğe bağlı kalmalıdır.

## Açık sorular

- Mevcut Mantis botu yeniden kullanıldığında hangi Discord botu sürücü, hangisi SUT olmalıdır?
- Gözlemci tarayıcı girişi ilk aşamada bir insan Discord hesabı mı, bir test hesabı mı, yoksa yalnızca bot tarafından okunabilir REST kanıtı mı kullanmalıdır?
- GitHub, PR’lar için Mantis artefaktlarını ne kadar süre saklamalıdır?
- ClawSweeper, bir maintainer komutunu beklemek yerine Mantis’i ne zaman otomatik olarak önermelidir?
- Herkese açık PR’lar için ekran görüntüleri yüklemeden önce redakte edilmeli veya kırpılmalı mıdır?

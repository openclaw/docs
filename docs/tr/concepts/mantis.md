---
read_when:
    - OpenClaw hataları için canlı görsel QA oluşturma veya çalıştırma
    - Bir pull request için öncesi ve sonrası doğrulama ekleme
    - Discord, Slack, WhatsApp veya diğer canlı taşıma senaryolarını ekleme
    - Ekran görüntüleri, tarayıcı otomasyonu veya VNC erişimi gerektiren QA çalıştırmalarında hata ayıklama
summary: Mantis, OpenClaw hatalarını canlı taşımalarda yeniden üretmek, önce ve sonra kanıtlarını yakalamak ve yapıtları PR'lara eklemek için kullanılan görsel uçtan uca doğrulama sistemidir.
title: Peygamberdevesi
x-i18n:
    generated_at: "2026-06-28T00:28:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis, gerçek bir runtime, gerçek bir taşıma katmanı ve görünür kanıt gerektiren hatalar için OpenClaw uçtan uca doğrulama sistemidir. Bilinen bozuk bir ref üzerinde bir senaryo çalıştırır, kanıt yakalar, aynı senaryoyu aday ref üzerinde çalıştırır ve karşılaştırmayı bir bakımcının PR'dan veya yerel bir komuttan inceleyebileceği yapıtlar olarak yayımlar.

Mantis, Discord ile başlar çünkü Discord bize yüksek değerli ilk hattı sağlar: gerçek bot kimlik doğrulaması, gerçek guild kanalları, tepkiler, thread'ler, yerel komutlar ve insanların taşıma katmanının ne gösterdiğini görsel olarak doğrulayabileceği bir tarayıcı kullanıcı arayüzü.

## Hedefler

- Bir GitHub issue'sundan veya PR'ından bir hatayı, kullanıcıların gördüğü aynı taşıma katmanı şekliyle yeniden üretmek.
- Düzeltmeyi uygulamadan önce temel ref üzerinde bir **önce** yapıtı yakalamak.
- Düzeltmeyi uyguladıktan sonra aday ref üzerinde bir **sonra** yapıtı yakalamak.
- Mümkün olduğunda Discord REST tepki okuması veya kanal dökümü denetimi gibi deterministik bir oracle kullanmak.
- Hatanın görünür bir kullanıcı arayüzü yüzeyi olduğunda ekran görüntüleri yakalamak.
- Bir agent kontrollü CLI'dan yerel olarak ve GitHub'dan uzaktan çalışmak.
- Oturum açma, tarayıcı otomasyonu veya sağlayıcı kimlik doğrulaması takıldığında VNC kurtarması için yeterli makine durumunu korumak.
- Çalıştırma engellendiğinde, manuel VNC yardımı gerektiğinde veya bittiğinde bir operatör Discord kanalına kısa durum göndermek.

## Hedef olmayanlar

- Mantis, birim testlerin yerine geçmez. Bir Mantis çalıştırması, düzeltme anlaşıldıktan sonra genellikle daha küçük bir regresyon testine dönüşmelidir.
- Mantis, normal hızlı CI kapısı değildir. Daha yavaştır, canlı kimlik bilgileri kullanır ve canlı ortamın önemli olduğu hatalar için ayrılmıştır.
- Mantis, normal çalışma için bir insan gerektirmemelidir. Manuel VNC bir kurtarma yoludur, mutlu yol değildir.
- Mantis, ham sırları yapıtlarda, günlüklerde, ekran görüntülerinde, Markdown raporlarında veya PR yorumlarında saklamaz.

## Sahiplik

Mantis, OpenClaw QA yığınında yaşar.

- OpenClaw, senaryo runtime'ının, taşıma katmanı adaptörlerinin, kanıt şemasının ve `pnpm openclaw qa mantis` altındaki yerel CLI'ın sahibidir.
- QA Lab, canlı taşıma katmanı harness parçalarının, tarayıcı yakalama yardımcılarının ve yapıt yazıcılarının sahibidir.
- Crabbox, uzak VM gerektiğinde ısıtılmış Linux makinelerinin sahibidir.
- GitHub Actions, uzak workflow giriş noktasının ve yapıt saklamanın sahibidir.
- ClawSweeper, GitHub yorum yönlendirmenin sahibidir: bakımcı komutlarını ayrıştırma, workflow'u dispatch etme ve son PR yorumunu gönderme.
- OpenClaw agent'ları, bir senaryonun agentic kurulum, hata ayıklama veya takılı durum raporlaması gerektirdiği durumlarda Mantis'i Codex üzerinden sürer.

Bu sınır, taşıma katmanı bilgisini OpenClaw'da, makine zamanlamasını Crabbox'ta ve bakımcı workflow bağlantı kodunu ClawSweeper'da tutar.

## Komut şekli

İlk yerel komut Discord botunu, guild'i, kanalı, mesaj göndermeyi, tepki göndermeyi ve yapıt yolunu doğrular:

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

Çalıştırıcı, çıktı dizini altında ayrık temel ve aday worktree'ler oluşturur, bağımlılıkları kurar, her ref'i derler, senaryoyu `--allow-failures` ile çalıştırır, ardından `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` yazar. İlk Discord senaryosu için başarılı bir doğrulama, temel durumun `fail` ve aday durumun `pass` olması demektir.

İkinci Discord önce/sonra probu thread eklerini hedefler:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Bu senaryo sürücü botla bir üst mesaj gönderir, gerçek bir Discord thread'i oluşturur, repo yerel bir `filePath` ile OpenClaw'ın `message.thread-reply` eylemini çağırır, ardından SUT yanıtı ve ek dosya adı için thread'i yoklar. Temel ekran görüntüsü, yanıtı ek olmadan gösterir; aday ekran görüntüsü beklenen `mantis-thread-report.md` ekini gösterir.

İlk VM/tarayıcı ilkeli masaüstü smoke testidir:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Bir Crabbox masaüstü makinesi kiralar veya yeniden kullanır, VNC oturumu içinde görünür bir tarayıcı başlatır, masaüstünü yakalar, yapıtları yerel çıktı dizinine geri çeker ve yeniden bağlanma komutunu rapora yazar. Komut varsayılan olarak Hetzner sağlayıcısını kullanır çünkü Mantis hattında çalışan masaüstü/VNC kapsamına sahip ilk sağlayıcı odur. Başka bir Crabbox filosuna karşı çalıştırırken bunu `--provider`, `--crabbox-bin` veya `OPENCLAW_MANTIS_CRABBOX_PROVIDER` ile geçersiz kılın.

Kullanışlı masaüstü smoke bayrakları:

- `--lease-id <cbx_...>` veya `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ısıtılmış bir masaüstünü yeniden kullanır.
- `--browser-url <url>` görünür tarayıcıda açılan sayfayı değiştirir.
- `--html-file <path>` repo yerel bir HTML yapıtını görünür tarayıcıda işler. Mantis bunu, oluşturulan Discord durum-tepki zaman çizelgesini gerçek bir Crabbox masaüstü üzerinden yakalamak için kullanır.
- `--browser-profile-dir <remote-path>` uzak bir Chrome user-data-dir'i yeniden kullanır, böylece kalıcı bir Mantis masaüstü çalıştırmalar arasında oturumunu açık tutabilir. Bunu uzun ömürlü Discord Web görüntüleyici profili için kullanın.
- `--browser-profile-archive-env <name>` tarayıcıyı başlatmadan önce adlandırılmış ortam değişkeninden base64 `.tgz` Chrome user-data-dir arşivini geri yükler. Bunu Discord Web gibi oturum açmış tanıklar için kullanın. Varsayılan env var `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`'dir.
- `--video-duration <seconds>` MP4 yakalama uzunluğunu denetler. Yerleşmek için zamana ihtiyaç duyan yavaş, oturum açılmış web uygulamaları için daha uzun süre kullanın.
- `--keep-lease` veya `OPENCLAW_MANTIS_KEEP_VM=1`, yeni oluşturulmuş başarılı bir kiralamayı VNC incelemesi için açık tutar. Başarısız çalıştırmalar, bir operatörün yeniden bağlanabilmesi için bir kiralama oluşturulduysa varsayılan olarak kiralamayı tutar.
- `--class`, `--idle-timeout` ve `--ttl` makine boyutunu ve kiralama ömrünü ayarlar.

Discord Web kanıtı için Mantis, bot token'ı yerine ayrılmış bir görüntüleyici hesabı kullanır. Canlı Discord API senaryosu oracle olarak kalır: gerçek thread'i oluşturur, SUT `thread-reply`'ı gönderir ve eki Discord REST üzerinden denetler. `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` ayarlandığında senaryo ayrıca bir Discord Web URL yapıtı yazar. `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` ayarlandığında, oturum açmış bir tarayıcının açıp kaydedebilmesi için o thread'i yeterince uzun süre kullanılabilir bırakır.

GitHub workflow'u aday thread URL'sini Discord Web'de açar, ekran görüntüsü yakalar, MP4 kaydeder ve Crabbox medya araçları kullanılabildiğinde kırpılmış bir GIF önizlemesi oluşturur. `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` üzerinden yapılandırılmış kalıcı bir görüntüleyici profil yolunu tercih edin, çünkü tam Chrome profil arşivleri GitHub'ın sır boyutu sınırını aşabilir. Küçük/bootstrap profiller için workflow ayrıca `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` üzerinden base64 `.tgz` arşivini geri yükleyebilir. Hiçbir profil kaynağı yapılandırılmamışsa workflow yine de deterministik temel/aday ek ekran görüntülerini yayımlar ve oturum açmış Discord Web tanığının atlandığını belirten bir bildirim günlüğe kaydeder.

İlk tam masaüstü taşıma katmanı ilkeli Slack masaüstü smoke testidir:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bir Crabbox masaüstü makinesi kiralar veya yeniden kullanır, mevcut checkout'u VM içine senkronize eder, o VM içinde `pnpm openclaw qa slack` çalıştırır, VNC tarayıcısında Slack Web'i açar, görünür masaüstünü yakalar ve hem Slack QA yapıtlarını hem de VNC ekran görüntüsünü yerel çıktı dizinine geri kopyalar. Bu, SUT OpenClaw gateway'in ve tarayıcının aynı Linux masaüstü VM içinde yaşadığı ilk Mantis şeklidir.

`--gateway-setup` ile komut, `$HOME/.openclaw-mantis/slack-openclaw` konumunda kalıcı, atılabilir bir OpenClaw home hazırlar, seçili kanal için Slack Socket Mode yapılandırmasını yamalar, `38973` portunda `openclaw gateway run` başlatır ve Chrome'u VNC oturumunda çalışır durumda tutar. Bu, "bana Slack ve çalışan bir claw içeren bir Linux masaüstü bırak" modudur; `--gateway-setup` atlandığında bot-to-bot Slack QA hattı varsayılan olarak kalır.

`--credential-source env` için gerekli girdiler:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- Uzak model hattı için `OPENCLAW_LIVE_OPENAI_KEY`. Yerel olarak yalnızca `OPENAI_API_KEY` ayarlıysa Mantis, Crabbox'ı çağırmadan önce bunu `OPENCLAW_LIVE_OPENAI_KEY` ile eşler, böylece Crabbox'ın `OPENCLAW_*` env iletimi bunu VM içine taşıyabilir.

`--gateway-setup --credential-source convex` ile Mantis, VM'i oluşturmadan önce Slack SUT kimlik bilgisini paylaşılan havuzdan kiralar ve kiralanmış kanal id'sini, Socket Mode app token'ını ve bot token'ını masaüstü içindeki `OPENCLAW_MANTIS_SLACK_*` runtime env olarak iletir. Bu, GitHub workflow'larını ince tutar: ham Slack bot veya app token'ları değil, yalnızca Convex broker sırrı gerekir.

Kullanışlı Slack masaüstü bayrakları:

- `--lease-id <cbx_...>` bir operatörün VNC üzerinden Slack Web'e zaten giriş yaptığı bir makineye karşı yeniden çalıştırır.
- `--gateway-setup` yalnızca bot-to-bot QA hattını çalıştırmak yerine VM içinde kalıcı bir OpenClaw Slack gateway başlatır.
- `--keep-lease` başarıdan sonra gateway VM'ini VNC incelemesi için açık tutar; `--no-keep-lease` yapıtları topladıktan sonra durdurur.
- `--slack-url <url>` belirli bir Slack Web URL'si açar. Bu olmadan Mantis, SUT bot token'ı kullanılabilir olduğunda Slack `auth.test` üzerinden `https://app.slack.com/client/<team>/<channel>` türetir.
- `--slack-channel-id <id>` gateway kurulumu tarafından kullanılan Slack kanal allowlist'ini denetler.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` VM içindeki kalıcı Chrome profilini denetler. Varsayılan `$HOME/.config/openclaw-mantis/slack-chrome-profile`'dır, böylece manuel Slack Web oturumu aynı kiralamadaki yeniden çalıştırmalarda korunur.
- `--credential-source convex --credential-role ci` doğrudan Slack env token'ları yerine paylaşılan kimlik bilgisi havuzunu kullanır.
- `--provider-mode`, `--model`, `--alt-model` ve `--fast` Slack canlı hattına iletilir.

Onay checkpoint çalıştırmaları, CI için güvenli görsel kanıt amacıyla Slack API mesaj anlık görüntülerini checkpoint PNG'lerine işler. `slack-desktop-smoke.png`, yalnızca kiralama zaten oturum açmış sıcak bir tarayıcı profili kullandığında Slack Web kanıtıdır.

GitHub smoke workflow'u `Mantis Discord Smoke`'tur. İlk gerçek senaryo için önce ve sonra GitHub workflow'u `Mantis Discord Status Reactions`'tır. Şunları kabul eder:

- `baseline_ref`: queued-only davranışını yeniden üretmesi beklenen ref.
- `candidate_ref`: `queued -> thinking -> done` göstermesi beklenen ref.

Workflow harness ref'ini checkout eder, ayrı temel ve aday worktree'ler derler, her worktree'ye karşı `discord-status-reactions-tool-only` çalıştırır ve `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` dosyalarını Actions yapıtları olarak yükler. Ayrıca her hattın zaman çizelgesi HTML'ini bir Crabbox masaüstü tarayıcısında işler ve bu VNC ekran görüntülerini PR yorumunda deterministik zaman çizelgesi PNG'lerinin yanında yayımlar. Aynı PR yorumu, `crabbox media preview` tarafından oluşturulan hafif, hareketi kırpılmış GIF önizlemelerini gömer, eşleşen hareketi kırpılmış MP4 kliplerine bağlantı verir ve derin inceleme için tam masaüstü MP4 dosyalarını tutar. Ekran görüntüleri hızlı inceleme için satır içi kalır. Workflow, sonraki Crabbox binary sürümü çıkmadan önce güncel masaüstü/tarayıcı kiralama bayraklarını kullanabilmek için Crabbox CLI'ını `openclaw/crabbox` main'den derler.

`Mantis Scenario`, genel manuel giriş noktasıdır. Bir `scenario_id`,
`candidate_ref`, isteğe bağlı `baseline_ref` ve isteğe bağlı `pr_number` alır, ardından
senaryonun sahip olduğu workflow'u dispatch eder. Wrapper bilinçli olarak incedir:
senaryo workflow'ları transport kurulumlarının, kimlik bilgilerinin, VM sınıfının,
beklenen oracle'ın ve artifact manifest'inin sahibi olmaya devam eder.

`Mantis Slack Desktop Smoke`, ilk Slack VM workflow'udur. Güvenilen candidate ref'i
ayrı bir worktree içinde checkout eder, bir Crabbox Linux masaüstü lease eder,
bu candidate'a karşı `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`
çalıştırır, VNC tarayıcısında Slack Web'i açar, masaüstünü kaydeder,
`crabbox media preview` ile hareket kırpılmış bir önizleme oluşturur, tam artifact
dizinini upload eder ve isteğe bağlı olarak hedef PR'a inline kanıt yorumunu gönderir.
Masaüstü lease'i için varsayılan olarak AWS kullanır ve operatörlerin AWS kapasitesi
yavaş ya da kullanılamaz olduğunda Hetzner'e geçebilmesi için manuel provider girdisi
sunar. Yalnızca bot'tan bot'a Slack transcript'i yerine "Slack ve çalışan bir claw
içeren Linux masaüstü" istediğinizde bu lane'i kullanın.

`Mantis Telegram Live`, mevcut Telegram canlı QA lane'ini aynı PR kanıt pipeline'ında
sarmalar. Güvenilen candidate ref'i ayrı bir worktree içinde checkout eder,
`pnpm openclaw qa telegram --credential-source convex --credential-role ci`
çalıştırır, Telegram QA özetinden, `qa-evidence.json` dosyasından ve rapor
artifact'lerinden bir `mantis-evidence.json` manifest'i yazar, redakte edilmiş kanıt
HTML'ini bir Crabbox masaüstü tarayıcısı üzerinden render eder, `crabbox media preview`
ile hareket kırpılmış bir GIF oluşturur ve PR numarası varsa inline PR kanıt yorumunu
gönderir. Bu lane, oturum açılmış Telegram Web kanıtından ziyade QA kanıtı görselidir:
Telegram Bot API kararlı canlı mesaj kanıtı sağlar, ancak normal Mantis otomasyonu
için Telegram Web oturum durumu gerekmez.

`Mantis Telegram Desktop Proof`, agentic yerel Telegram Desktop önce/sonra wrapper'ıdır.
Bir maintainer bunu PR yorumundan `@openclaw-mantis telegram desktop proof` ile,
Actions UI'dan serbest biçimli talimatlarla veya genel `Mantis Scenario` dispatcher'ı
üzerinden tetikleyebilir. Workflow, PR'ı, baseline ref'i, candidate ref'i ve maintainer
talimatlarını Codex'e verir. Agent PR'ı okur, değişikliği hangi Telegram'da görünür
davranışın kanıtlayacağına karar verir, baseline ve candidate için gerçek kullanıcı
Crabbox Telegram Desktop kanıt lane'ini çalıştırır, yerel GIF'ler yararlı olana kadar
iterasyon yapar, eşleştirilmiş `motionPreview` artifact'lerini `mantis-evidence.json`
içine yazar, bundle'ı upload eder ve PR numarası varsa 2 sütunlu bir PR kanıt tablosu
gönderir.

İnsan döngülü Telegram masaüstü kurulumu için senaryo builder'ını kullanın:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Builder bir Crabbox masaüstü lease eder veya yeniden kullanır, yerel Linux
Telegram Desktop binary'sini kurar, isteğe bağlı olarak bir kullanıcı oturumu
arşivini geri yükler, OpenClaw'ı lease edilmiş Telegram SUT bot token'ı ile
yapılandırır, `38974` portunda `openclaw gateway run` başlatır, lease edilmiş özel
gruba driver bot hazır mesajı gönderir, ardından görünen VNC masaüstünden bir ekran
görüntüsü ve MP4 yakalar. Bir bot token'ı Telegram Desktop'ta asla oturum açmaz;
yalnızca OpenClaw'ı yapılandırır. Masaüstü görüntüleyici, `--telegram-profile-archive-env <name>`
üzerinden geri yüklenen veya VNC aracılığıyla manuel oluşturulan ve `--keep-lease`
ile canlı tutulan ayrı bir Telegram kullanıcı oturumudur.

Yararlı Telegram masaüstü builder flag'leri:

- `--lease-id <cbx_...>`, bir operatörün Telegram Desktop'ta zaten oturum açtığı VM'e karşı yeniden çalıştırır.
- `--telegram-profile-archive-env <name>`, bu env var'dan base64 `.tgz` Telegram Desktop profil arşivini okur ve başlatmadan önce geri yükler.
- `--telegram-profile-dir <remote-path>`, uzak Telegram Desktop profil dizinini kontrol eder. Varsayılan `$HOME/.local/share/TelegramDesktop` değeridir.
- `--no-gateway-setup`, OpenClaw'ı yapılandırmadan Telegram Desktop'ı kurar ve açar.
- `--credential-source convex --credential-role ci`, doğrudan Telegram env token'ları yerine paylaşılan kimlik bilgisi broker'ını kullanır.

PR yayımlayan her senaryo, raporunun yanına `mantis-evidence.json` yazar.
Bu schema, senaryo kodu ile GitHub yorumları arasındaki handoff'tur:

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
yapılandırılmış Mantis R2/S3 artifact prefix'i altındaki göreli yollardır. Publisher,
path traversal'ı reddeder ve isteğe bağlı önizlemeler veya videolar kullanılamadığında
`"required": false` olarak işaretlenmiş girdileri atlar.

Desteklenen artifact türleri:

- `timeline`: deterministik senaryo ekran görüntüsü, genellikle önce/sonra.
- `desktopScreenshot`: VNC/tarayıcı masaüstü ekran görüntüsü.
- `motionPreview`: masaüstü kaydından oluşturulan inline animasyonlu GIF.
- `motionClip`: statik giriş ve çıkışı kaldıran hareket kırpılmış MP4.
- `fullVideo`: derin inceleme için tam MP4 kaydı.
- `metadata`: JSON/log sidecar.
- `report`: Markdown raporu.

Yeniden kullanılabilir publisher `scripts/mantis/publish-pr-evidence.mjs` dosyasıdır.
Workflow'lar onu manifest, hedef PR, artifact hedef kökü, yorum marker'ı, Actions
artifact URL'si, run URL'si ve istek kaynağı ile çağırır. Tanımlanmış artifact'leri
yapılandırılmış Mantis R2/S3 bucket'ına upload eder, inline görseller/önizlemeler ve
bağlantılı videolar içeren özet odaklı bir PR yorumu oluşturur, ardından mevcut marker
yorumunu günceller veya yeni bir tane oluşturur. Workflow'lar `https://artifacts.openclaw.ai`
altındaki herkese açık URL'lerle `openclaw-crabbox-artifacts` konumuna yayın yapar.
Bucket, bölge ve herkese açık URL değerlerini doğrudan sağlarlar. Yeniden kullanılabilir
publisher şunları gerektirir:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

Status-reactions run'ını doğrudan PR yorumundan da tetikleyebilirsiniz:

```text
@openclaw-mantis discord status reactions
```

Yorum tetikleyicisi bilinçli olarak dardır. Yalnızca write, maintain veya admin
erişimi olan kullanıcıların pull request yorumlarında çalışır ve yalnızca Discord
status-reaction isteklerini tanır. Varsayılan olarak bilinen kötü baseline ref'i ve
candidate olarak mevcut PR head SHA'sını kullanır. Maintainer'lar her iki ref'i de
override edebilir:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram canlı QA da PR yorumundan tetiklenebilir:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Varsayılan olarak candidate olarak mevcut PR head SHA'sını kullanır ve
`telegram-status-command` çalıştırır. Maintainer'lar belirli bir ref veya önceden
hazırlanmış bir Crabbox masaüstüne ihtiyaç duyduklarında `candidate=...`,
`provider=aws|hetzner` ve `lease=<cbx_...>` değerlerini override edebilir.

ClawSweeper komut örnekleri:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

İlk komut açık ve senaryo odaklıdır. İkincisi daha sonra bir PR'ı veya issue'yu
label'lardan, değişen dosyalardan ve ClawSweeper inceleme bulgularından önerilen
Mantis senaryolarına eşleyebilir.

## Run yaşam döngüsü

1. Kimlik bilgilerini edin.
2. Bir VM ayır veya yeniden kullan.
3. Senaryo UI kanıtı gerektiriyorsa masaüstü/tarayıcı profilini hazırla.
4. Baseline ref için temiz bir checkout hazırla.
5. Bağımlılıkları kur ve yalnızca senaryonun ihtiyaç duyduklarını build et.
6. İzole bir state diziniyle child OpenClaw Gateway başlat.
7. Canlı transport'u, provider'ı, modeli ve tarayıcı profilini yapılandır.
8. Senaryoyu çalıştır ve baseline kanıtını yakala.
9. Gateway'i durdur ve log'ları koru.
10. Aynı VM'de candidate ref'i hazırla.
11. Aynı senaryoyu çalıştır ve candidate kanıtını yakala.
12. Oracle sonuçlarını ve görsel kanıtları karşılaştır.
13. Markdown, JSON, log'lar, ekran görüntüleri ve isteğe bağlı trace artifact'leri yaz.
14. GitHub Actions artifact'lerini upload et.
15. Kısa bir PR veya Discord status mesajı gönder.

Senaryo iki farklı şekilde başarısız olabilmelidir:

- **Bug yeniden üretildi**: baseline beklenen şekilde başarısız oldu.
- **Harness hatası**: ortam kurulumu, kimlik bilgileri, Discord API, tarayıcı veya
  provider, bug oracle'ı anlamlı olmadan önce başarısız oldu.

Son rapor bu durumları ayırmalıdır; böylece maintainer'lar kararsız bir ortamı
ürün davranışıyla karıştırmaz.

## Discord MVP

İlk senaryo, source reply delivery mode değerinin `message_tool_only` olduğu guild
kanallarındaki Discord status reactions'ı hedeflemelidir.

İyi bir Mantis seed'i olmasının nedenleri:

- Discord'da tetikleyici mesaj üzerindeki reactions olarak görünür.
- Discord mesaj reaction state'i üzerinden güçlü bir REST oracle'a sahiptir.
- Gerçek bir OpenClaw Gateway'i, Discord bot auth'u, message dispatch'i,
  source reply delivery mode'u, status reaction state'ini ve model turn lifecycle'ını çalıştırır.
- İlk implementasyonu dürüst tutacak kadar dardır.

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

Baseline kanıtı, sıraya alındı acknowledgement reaction'ını göstermeli ancak
tool-only modunda lifecycle transition göstermemelidir. Candidate kanıtı,
`messages.statusReactions.enabled` açıkça `true` olduğunda lifecycle status
reactions'ın çalıştığını göstermelidir.

Çalıştırılabilir ilk slice, opt-in Discord canlı QA senaryosudur:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

SUT'u always-on guild handling, `visibleReplies: "message_tool"`, `ackReaction: "👀"`
ve açık status reactions ile yapılandırır. Oracle gerçek Discord tetikleyici mesajını
poll eder ve gözlemlenen `👀 -> 🤔 -> 👍` sequence'ını bekler. Artifact'ler
`discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html`
ve `discord-status-reactions-tool-only-timeline.png` içerir.

## Mevcut QA parçaları

Mantis sıfırdan başlamak yerine mevcut özel QA stack'i üzerine inşa edilmelidir:

- `pnpm openclaw qa discord` zaten driver ve SUT bot'larıyla canlı bir Discord lane'i çalıştırır.
- Canlı transport runner zaten `.artifacts/qa-e2e/` altında raporlar, QA kanıtı ve
  transport'a özgü artifact'ler yazar.
- Convex kimlik bilgisi lease'leri zaten paylaşılan canlı transport kimlik bilgilerine
  özel erişim sağlar.
- Tarayıcı kontrol servisi zaten ekran görüntülerini, snapshot'ları, headless managed
  profilleri ve uzak CDP profillerini destekler.
- QA Lab'in transport şeklinde test için zaten bir debugger UI'ı ve bus'ı vardır.

İlk Mantis implementasyonu, bu parçaların üzerinde ince bir önce/sonra runner'ı
ve bir görsel kanıt katmanı olabilir.

## Kanıt modeli

Her run kararlı bir artifact dizini yazar:

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

- test edilen refs ve SHA'lar
- taşıma ve senaryo kimliği
- makine sağlayıcısı ve makine kimliği ya da lease kimliği
- gizli değerler olmadan kimlik bilgisi kaynağı
- temel sürüm sonucu
- aday sonucu
- hatanın temel sürümde yeniden üretilip üretilmediği
- adayın bunu düzeltip düzeltmediği
- artifact yolları
- temizlenmiş kurulum veya temizlik sorunları

Ekran görüntüleri kanıttır, gizli bilgi değildir. Yine de redaksiyon disiplini gerektirirler: özel kanal adları, kullanıcı adları veya ileti içeriği görünebilir. Herkese açık PR'lar için, redaksiyon hikayesi güçlenene kadar satır içi görseller yerine GitHub Actions artifact bağlantılarını tercih edin.

## Tarayıcı ve VNC

Tarayıcı hattının iki modu vardır:

- **Başsız otomasyon**: CI için varsayılandır. Chrome, CDP etkin olarak çalışır ve Playwright ya da OpenClaw tarayıcı denetimi ekran görüntülerini yakalar.
- **VNC kurtarma**: oturum açma, MFA, Discord otomasyon karşıtı önlemleri veya görsel hata ayıklama insan gerektirdiğinde aynı VM üzerinde etkinleştirilir.

Discord gözlemci tarayıcı profili, her çalıştırmada oturum açmayı önleyecek kadar kalıcı olmalı, ancak kişisel tarayıcı durumundan yalıtılmalıdır. Profil, geliştirici dizüstü bilgisayarına değil Mantis makine havuzuna aittir.

Mantis takıldığında, şu bilgilerle bir Discord durum iletisi gönderir:

- çalışma kimliği
- senaryo kimliği
- makine sağlayıcısı
- artifact dizini
- varsa VNC veya noVNC bağlantı talimatları
- kısa engelleyici metni

İlk özel dağıtım bu iletileri mevcut operatör kanalına gönderebilir ve daha sonra ayrılmış bir Mantis kanalına geçebilir.

## Makineler

Mantis, ilk uzak uygulama için Crabbox üzerinden AWS'yi tercih etmelidir. Crabbox bize ısıtılmış makineler, lease takibi, hydration, günlükler, sonuçlar ve temizlik sağlar. AWS kapasitesi çok yavaşsa veya kullanılamıyorsa, aynı makine arayüzünün arkasına bir Hetzner sağlayıcısı ekleyin.

Minimum VM gereksinimleri:

- masaüstü yetenekli Chrome veya Chromium kurulumu olan Linux
- tarayıcı otomasyonu için CDP erişimi
- kurtarma için VNC veya noVNC
- Node 22 ve pnpm
- OpenClaw checkout'u ve bağımlılık önbelleği
- Playwright kullanıldığında Playwright Chromium tarayıcı önbelleği
- bir OpenClaw Gateway, bir tarayıcı ve bir model çalıştırması için yeterli CPU ve bellek
- Discord, GitHub, model sağlayıcıları ve kimlik bilgisi broker'ına giden erişim

VM, beklenen kimlik bilgisi veya tarayıcı profili depoları dışında uzun ömürlü ham gizli bilgileri tutmamalıdır.

## Gizli bilgiler

Gizli bilgiler uzak çalıştırmalar için GitHub kuruluş veya depo gizli bilgilerinde, yerel çalıştırmalar içinse yerel operatör denetimli bir gizli bilgi dosyasında yaşar.

Önerilen gizli bilgi adları:

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

Uzun vadede, Convex kimlik bilgisi havuzu canlı taşıma kimlik bilgileri için normal kaynak olarak kalmalıdır. GitHub gizli bilgileri broker'ı ve fallback hatlarını başlatır. Discord durum tepkileri iş akışı, Mantis Crabbox gizli bilgilerini Crabbox CLI'ın beklediği `CRABBOX_COORDINATOR` ve `CRABBOX_COORDINATOR_TOKEN` ortam değişkenlerine geri eşler. Düz `CRABBOX_*` GitHub gizli bilgi adları, uyumluluk fallback'i olarak kabul edilmeye devam eder.

Mantis çalıştırıcısı şunları asla yazdırmamalıdır:

- Discord bot token'ları
- sağlayıcı API anahtarları
- tarayıcı çerezleri
- auth profili içerikleri
- VNC parolaları
- ham kimlik bilgisi yükleri

Herkese açık artifact yüklemeleri bot, guild, kanal ve ileti kimlikleri gibi Discord hedef metadata'sını da redakte etmelidir. GitHub smoke iş akışı bu nedenle `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` değerini etkinleştirir.

Bir token yanlışlıkla bir issue, PR, sohbet veya günlüğe yapıştırılırsa, yeni gizli bilgi saklandıktan sonra onu döndürün.

## GitHub artifact'leri ve PR yorumları

Mantis iş akışları, tam kanıt paketini kısa ömürlü bir Actions artifact'i olarak yüklemelidir. İş akışı bir hata raporu veya düzeltme PR'ı için çalıştırıldığında, redakte edilmiş satır içi medyayı yapılandırılmış Mantis R2/S3 bucket'ına da yayımlamalı ve söz konusu hata veya düzeltme PR'ında satır içi önce/sonra ekran görüntüleriyle bir yorum upsert etmelidir. Birincil kanıtı yalnızca genel bir QA otomasyon PR'ında yayınlamayın. Ham günlükler, gözlemlenen iletiler ve diğer hacimli kanıtlar Actions artifact'inde kalır.

Üretim iş akışları bu yorumları `github-actions[bot]` ile değil, Mantis GitHub App ile göndermelidir. Uygulama kimliğini ve özel anahtarı GitHub Actions gizli bilgileri olarak `MANTIS_GITHUB_APP_ID` ve `MANTIS_GITHUB_APP_PRIVATE_KEY` içinde saklayın. İş akışı upsert anahtarı olarak gizli bir işaretleyici kullanır, token düzenleyebildiğinde o yorumu günceller ve eski bot sahipli bir işaretleyici düzenlenemediğinde Mantis sahipli yeni bir yorum oluşturur.

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

Özel bir dağıtımda zaten bir Mantis Discord uygulaması olabilir. Doğru bot izinlerine sahipse ve güvenle döndürülebiliyorsa başka bir uygulama oluşturmak yerine bu uygulamayı yeniden kullanın.

İlk operatör bildirim kanalını gizli bilgiler veya dağıtım yapılandırması üzerinden ayarlayın. Önce mevcut bir maintainer veya operasyon kanalını gösterebilir, ardından bir kanal oluştuğunda ayrılmış bir Mantis kanalına taşınabilir.

Bu belgeye guild kimlikleri, kanal kimlikleri, bot token'ları, tarayıcı çerezleri veya VNC parolaları koymayın. Bunları GitHub gizli bilgilerinde, kimlik bilgisi broker'ında veya operatörün yerel gizli bilgi deposunda saklayın.

## Senaryo ekleme

Bir Mantis senaryosu şunları bildirmelidir:

- kimlik ve başlık
- taşıma
- gerekli kimlik bilgileri
- temel sürüm ref ilkesi
- aday ref ilkesi
- OpenClaw yapılandırma yaması
- kurulum adımları
- uyarıcı
- beklenen temel sürüm oracle'ı
- beklenen aday oracle'ı
- görsel yakalama hedefleri
- zaman aşımı bütçesi
- temizlik adımları

Senaryolar küçük, türlenmiş oracle'ları tercih etmelidir:

- tepki hataları için Discord tepki durumu
- threading hataları için Discord ileti referansları
- Slack hataları için Slack thread ts ve tepki API durumu
- e-posta hataları için e-posta ileti kimlikleri ve başlıkları
- UI tek güvenilir gözlemlenebilir olduğunda tarayıcı ekran görüntüleri

Görüntü denetimleri eklemeli olmalıdır. Bir platform API'si hatayı kanıtlayabiliyorsa, geçme/kalma oracle'ı olarak API'yi kullanın ve ekran görüntülerini insan güveni için tutun.

## Sağlayıcı genişletmesi

Discord'dan sonra aynı çalıştırıcı şunları ekleyebilir:

- Slack: tepkiler, thread'ler, uygulama mention'ları, modallar, dosya yüklemeleri.
- E-posta: bağlayıcıların yeterli olmadığı yerlerde `gog` kullanarak Gmail auth ve ileti threading'i.
- WhatsApp: QR oturum açma, yeniden tanımlama, ileti teslimi, medya, tepkiler.
- Telegram: grup mention gating'i, komutlar, varsa tepkiler.
- Matrix: şifreli odalar, thread veya yanıt ilişkileri, yeniden başlatma sürdürmesi.

Her taşımanın bir ucuz smoke senaryosu ve bir veya daha fazla hata sınıfı senaryosu olmalıdır. Pahalı görsel senaryolar opt-in kalmalıdır.

## Açık sorular

- Mevcut Mantis botu yeniden kullanıldığında hangi Discord botu driver, hangisi SUT olmalıdır?
- Gözlemci tarayıcı oturumu ilk aşama için bir insan Discord hesabı, bir test hesabı veya yalnızca bot tarafından okunabilir REST kanıtı mı kullanmalıdır?
- GitHub, PR'lar için Mantis artifact'lerini ne kadar süre tutmalıdır?
- ClawSweeper ne zaman bir maintainer komutu beklemek yerine otomatik olarak Mantis önermelidir?
- Herkese açık PR'lar için yüklemeden önce ekran görüntüleri redakte edilmeli veya kırpılmalı mı?

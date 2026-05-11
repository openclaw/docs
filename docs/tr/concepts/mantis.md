---
read_when:
    - OpenClaw hataları için canlı görsel QA oluşturma veya çalıştırma
    - Bir çekme isteği için öncesi ve sonrası doğrulama ekleme
    - Discord, Slack, WhatsApp veya diğer canlı taşıma senaryolarını ekleme
    - Ekran görüntüleri, tarayıcı otomasyonu veya VNC erişimi gerektiren kalite güvencesi çalıştırmalarında hata ayıklama
summary: Mantis, OpenClaw hatalarını canlı aktarım kanallarında yeniden üretmek, öncesi ve sonrası kanıtları yakalamak ve artifaktları PR'lere eklemek için kullanılan görsel uçtan uca doğrulama sistemidir.
title: Peygamberdevesi
x-i18n:
    generated_at: "2026-05-11T20:27:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis, gerçek bir çalışma zamanı, gerçek bir taşıma ve görünür kanıt gerektiren hatalar için OpenClaw uçtan uca doğrulama sistemidir. Bilinen hatalı bir ref üzerinde bir senaryo çalıştırır, kanıt toplar, aynı senaryoyu aday ref üzerinde çalıştırır ve karşılaştırmayı bir bakımcının bir PR'dan veya yerel bir komuttan inceleyebileceği artifact'lar olarak yayımlar.

Mantis, Discord ile başlar çünkü Discord bize yüksek değerli ilk kulvarı sağlar: gerçek bot kimlik doğrulaması, gerçek guild kanalları, reactions, threads, yerel komutlar ve insanların taşımanın ne gösterdiğini görsel olarak doğrulayabileceği bir tarayıcı UI'sı.

## Hedefler

- Bir GitHub issue'sundan veya PR'dan gelen hatayı, kullanıcıların gördüğü aynı taşıma biçimiyle yeniden üretmek.
- Düzeltmeyi uygulamadan önce baseline ref üzerinde bir **öncesi** artifact'ı yakalamak.
- Düzeltmeyi uyguladıktan sonra aday ref üzerinde bir **sonrası** artifact'ı yakalamak.
- Mümkün olduğunda Discord REST reaction okuması veya kanal transcript kontrolü gibi deterministik bir doğrulama ölçütü kullanmak.
- Hatanın görünür bir UI yüzeyi olduğunda ekran görüntüleri yakalamak.
- Yerel olarak agent kontrollü bir CLI'dan ve uzaktan GitHub'dan çalıştırmak.
- Oturum açma, tarayıcı otomasyonu veya provider kimlik doğrulaması takıldığında VNC kurtarması için yeterli makine durumunu korumak.
- Çalıştırma engellendiğinde, manuel VNC yardımı gerektiğinde veya tamamlandığında bir operatör Discord kanalına kısa durum göndermek.

## Hedef olmayanlar

- Mantis, birim testlerinin yerine geçmez. Bir Mantis çalıştırması, düzeltme anlaşıldıktan sonra genellikle daha küçük bir regresyon testine dönüştürülmelidir.
- Mantis normal hızlı CI geçidi değildir. Daha yavaştır, canlı kimlik bilgileri kullanır ve canlı ortamın önemli olduğu hatalar için ayrılır.
- Mantis normal çalışmada bir insana ihtiyaç duymamalıdır. Manuel VNC, mutlu yol değil, bir kurtarma yoludur.
- Mantis artifact'larda, günlüklerde, ekran görüntülerinde, Markdown raporlarında veya PR yorumlarında ham secrets saklamaz.

## Sahiplik

Mantis, OpenClaw QA yığınında yaşar.

- OpenClaw, `pnpm openclaw qa mantis` altındaki senaryo çalışma zamanının, taşıma adaptörlerinin, kanıt şemasının ve yerel CLI'ın sahibidir.
- QA Lab, canlı taşıma harness parçalarının, tarayıcı yakalama yardımcılarının ve artifact yazıcılarının sahibidir.
- Crabbox, uzak bir VM gerektiğinde ısındırılmış Linux makinelerinin sahibidir.
- GitHub Actions, uzak workflow giriş noktasının ve artifact saklama politikasının sahibidir.
- ClawSweeper, GitHub yorum yönlendirmesinin sahibidir: bakımcı komutlarını ayrıştırma, workflow'u dispatch etme ve son PR yorumunu gönderme.
- Bir senaryo agentic kurulum, hata ayıklama veya takılı durum raporlaması gerektirdiğinde OpenClaw agents, Mantis'i Codex üzerinden yönlendirir.

Bu sınır, taşıma bilgisini OpenClaw'da, makine zamanlamasını Crabbox'ta ve bakımcı workflow bağlantısını ClawSweeper'da tutar.

## Komut şekli

İlk yerel komut Discord botunu, guild'i, kanalı, mesaj göndermeyi, reaction göndermeyi ve artifact yolunu doğrular:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Yerel öncesi ve sonrası runner şu şekli kabul eder:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner, output dizini altında ayrık baseline ve candidate worktree'leri oluşturur, bağımlılıkları kurar, her ref'i build eder, senaryoyu `--allow-failures` ile çalıştırır, ardından `baseline/`, `candidate/`, `comparison.json` ve `mantis-report.md` yazar. İlk Discord senaryosu için başarılı bir doğrulama, baseline durumunun `fail` ve candidate durumunun `pass` olması anlamına gelir.

İkinci Discord öncesi/sonrası probu thread attachment'larını hedefler:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Bu senaryo, driver bot ile bir üst mesaj gönderir, gerçek bir Discord thread'i oluşturur, repo-yerel bir `filePath` ile OpenClaw'ın `message.thread-reply` action'ını çağırır, ardından SUT yanıtı ve attachment dosya adı için thread'i yoklar. Baseline ekran görüntüsü, attachment olmayan yanıtı gösterir; candidate ekran görüntüsü beklenen `mantis-thread-report.md` attachment'ını gösterir.

İlk VM/tarayıcı primitive'i desktop smoke'tur:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Bir Crabbox desktop makinesini lease eder veya yeniden kullanır, VNC oturumu içinde görünür bir tarayıcı başlatır, desktop'ı yakalar, artifact'ları yerel output dizinine geri çeker ve yeniden bağlanma komutunu rapora yazar. Komut varsayılan olarak Hetzner provider'ını kullanır çünkü Mantis kulvarında çalışan desktop/VNC kapsamına sahip ilk provider odur. Başka bir Crabbox fleet'e karşı çalıştırırken bunu `--provider`, `--crabbox-bin` veya `OPENCLAW_MANTIS_CRABBOX_PROVIDER` ile override edin.

Yararlı desktop smoke flag'leri:

- `--lease-id <cbx_...>` veya `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ısındırılmış bir desktop'ı yeniden kullanır.
- `--browser-url <url>` görünür tarayıcıda açılan sayfayı değiştirir.
- `--html-file <path>` repo-yerel bir HTML artifact'ını görünür tarayıcıda render eder. Mantis bunu, oluşturulan Discord status-reaction timeline'ını gerçek bir Crabbox desktop üzerinden yakalamak için kullanır.
- `--browser-profile-dir <remote-path>` uzak bir Chrome user-data-dir'ini yeniden kullanır, böylece kalıcı bir Mantis desktop çalıştırmalar arasında oturum açık kalabilir. Bunu uzun ömürlü Discord Web viewer profili için kullanın.
- `--browser-profile-archive-env <name>` tarayıcıyı başlatmadan önce adlandırılmış environment variable'dan base64 `.tgz` Chrome user-data-dir arşivini geri yükler. Bunu Discord Web gibi oturum açmış tanıklar için kullanın. Varsayılan env var `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`'dir.
- `--video-duration <seconds>` MP4 yakalama uzunluğunu kontrol eder. Yerleşmesi için zamana ihtiyaç duyan yavaş oturum açılmış web app'ler için daha uzun bir süre kullanın.
- `--keep-lease` veya `OPENCLAW_MANTIS_KEEP_VM=1`, yeni oluşturulmuş başarılı bir lease'i VNC incelemesi için açık tutar. Başarısız çalıştırmalar, bir lease oluşturulduysa operatör yeniden bağlanabilsin diye varsayılan olarak lease'i tutar.
- `--class`, `--idle-timeout` ve `--ttl` makine boyutunu ve lease ömrünü ayarlar.

Discord Web kanıtı için Mantis, bot token yerine ayrılmış bir viewer hesabı kullanır. Canlı Discord API senaryosu doğrulama ölçütü olarak kalır: gerçek thread'i oluşturur, SUT `thread-reply` gönderir ve attachment'ı Discord REST üzerinden kontrol eder. `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` ayarlandığında, senaryo ayrıca bir Discord Web URL artifact'ı yazar. `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` ayarlandığında, oturum açmış bir tarayıcının açıp kaydedebilmesi için o thread'i yeterince uzun süre erişilebilir bırakır.

GitHub workflow, candidate thread URL'sini Discord Web'de açar, ekran görüntüsü yakalar, MP4 kaydeder ve Crabbox medya tooling'i mevcut olduğunda kırpılmış bir GIF önizlemesi üretir. `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` üzerinden yapılandırılmış kalıcı bir viewer profil yolunu tercih edin çünkü tam Chrome profil arşivleri GitHub'ın secret boyutu sınırını aşabilir. Küçük/bootstrap profiller için workflow ayrıca `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` üzerinden base64 `.tgz` arşivini geri yükleyebilir. Hiçbir profil kaynağı yapılandırılmamışsa workflow yine deterministik baseline/candidate attachment ekran görüntülerini yayımlar ve oturum açmış Discord Web tanığının atlandığına dair bir notice günlüğe yazar.

İlk tam desktop taşıma primitive'i Slack desktop smoke'tur:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bir Crabbox desktop makinesini lease eder veya yeniden kullanır, mevcut checkout'ı VM içine senkronize eder, o VM içinde `pnpm openclaw qa slack` çalıştırır, VNC tarayıcısında Slack Web'i açar, görünür desktop'ı yakalar ve hem Slack QA artifact'larını hem de VNC ekran görüntüsünü yerel output dizinine kopyalar. Bu, SUT OpenClaw gateway'in ve tarayıcının aynı Linux desktop VM içinde yaşadığı ilk Mantis şeklidir.

`--gateway-setup` ile komut, `$HOME/.openclaw-mantis/slack-openclaw` konumunda kalıcı ve atılabilir bir OpenClaw home hazırlar, seçilen kanal için Slack Socket Mode yapılandırmasını patch'ler, `38973` portunda `openclaw gateway run` başlatır ve Chrome'u VNC oturumunda çalışır durumda tutar. Bu, "bana Slack ve çalışan bir claw ile bir Linux desktop bırak" modudur; `--gateway-setup` atlandığında bot-to-bot Slack QA kulvarı varsayılan olarak kalır.

`--credential-source env` için gerekli girdiler:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- Uzak model kulvarı için `OPENCLAW_LIVE_OPENAI_KEY`. Yerelde yalnızca `OPENAI_API_KEY` ayarlıysa Mantis, Crabbox'ı çağırmadan önce bunu `OPENCLAW_LIVE_OPENAI_KEY` olarak eşler; böylece Crabbox'ın `OPENCLAW_*` env forwarding'i onu VM içine taşıyabilir.

`--gateway-setup --credential-source convex` ile Mantis, VM'i oluşturmadan önce paylaşılan havuzdan Slack SUT credential'ını lease eder ve lease edilen kanal id'sini, Socket Mode app token'ını ve bot token'ı desktop içinde `OPENCLAW_MANTIS_SLACK_*` runtime env olarak forward eder. Bu, GitHub workflow'larını ince tutar: ham Slack bot veya app token'larına değil, yalnızca Convex broker secret'ına ihtiyaç duyarlar.

Yararlı Slack desktop flag'leri:

- `--lease-id <cbx_...>` bir operatörün VNC üzerinden Slack Web'e zaten oturum açtığı bir makineye karşı yeniden çalıştırır.
- `--gateway-setup` yalnızca bot-to-bot QA kulvarını çalıştırmak yerine VM'de kalıcı bir OpenClaw Slack gateway başlatır.
- `--keep-lease` başarıdan sonra gateway VM'ini VNC incelemesi için açık tutar; `--no-keep-lease` artifact'ları topladıktan sonra durdurur.
- `--slack-url <url>` belirli bir Slack Web URL'si açar. Bu olmadan Mantis, SUT bot token mevcut olduğunda Slack `auth.test` üzerinden `https://app.slack.com/client/<team>/<channel>` türetir.
- `--slack-channel-id <id>` gateway kurulumu tarafından kullanılan Slack kanal allowlist'ini kontrol eder.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` VM içindeki kalıcı Chrome profilini kontrol eder. Varsayılan `$HOME/.config/openclaw-mantis/slack-chrome-profile`'dır, böylece manuel Slack Web oturumu aynı lease üzerindeki yeniden çalıştırmalarda korunur.
- `--credential-source convex --credential-role ci` doğrudan Slack env token'ları yerine paylaşılan credential havuzunu kullanır.
- `--provider-mode`, `--model`, `--alt-model` ve `--fast` Slack canlı kulvarına aktarılır.

GitHub smoke workflow'u `Mantis Discord Smoke`'tur. İlk gerçek senaryo için öncesi ve sonrası GitHub workflow'u `Mantis Discord Status Reactions`'tır. Şunları kabul eder:

- `baseline_ref`: queued-only davranışını yeniden üretmesi beklenen ref.
- `candidate_ref`: `queued -> thinking -> done` göstermesi beklenen ref.

Workflow harness ref'ini checkout eder, ayrı baseline ve candidate worktree'leri build eder, her worktree'ye karşı `discord-status-reactions-tool-only` çalıştırır ve `baseline/`, `candidate/`, `comparison.json` ile `mantis-report.md` dosyalarını Actions artifact'ları olarak upload eder. Ayrıca her kulvarın timeline HTML'ini bir Crabbox desktop tarayıcısında render eder ve bu VNC ekran görüntülerini PR yorumunda deterministik timeline PNG'lerinin yanında yayımlar. Aynı PR yorumu, `crabbox media preview` tarafından üretilen hafif hareket kırpılmış GIF önizlemelerini embed eder, eşleşen hareket kırpılmış MP4 kliplerine link verir ve derin inceleme için tam desktop MP4 dosyalarını saklar. Ekran görüntüleri hızlı inceleme için inline kalır. Workflow, bir sonraki Crabbox binary release'i kesilmeden önce güncel desktop/browser lease flag'lerini kullanabilsin diye Crabbox CLI'ı `openclaw/crabbox` main'den build eder.

`Mantis Scenario` genel manuel giriş noktasıdır. Bir `scenario_id`, `candidate_ref`, isteğe bağlı `baseline_ref` ve isteğe bağlı `pr_number` alır, ardından senaryo sahibi workflow'u dispatch eder. Wrapper kasıtlı olarak incedir: senaryo workflow'ları hâlâ kendi taşıma kurulumlarının, credentials'ın, VM class'ının, beklenen doğrulama ölçütünün ve artifact manifest'inin sahibidir.

`Mantis Slack Desktop Smoke` ilk Slack VM iş akışıdır. Güvenilen aday ref'ini
ayrı bir worktree içinde checkout eder, bir Crabbox Linux masaüstü lease eder,
bu aday üzerinde `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`
çalıştırır, VNC tarayıcısında Slack Web'i açar, masaüstünü kaydeder,
`crabbox media preview` ile hareket kırpılmış bir önizleme oluşturur, tam
artifact dizinini yükler ve isteğe bağlı olarak hedef PR'a satır içi kanıt
yorumunu gönderir. Masaüstü lease'i için varsayılan olarak AWS kullanır ve
operatörlerin AWS kapasitesi yavaş ya da kullanılamaz olduğunda Hetzner'e
geçebilmesi için manuel bir sağlayıcı girdisi sunar. Yalnızca bot-bota Slack
dökümü yerine "Slack ve çalışan bir claw içeren bir Linux masaüstü" istediğinizde
bu hattı kullanın.

`Mantis Telegram Live` mevcut Telegram canlı QA hattını aynı PR kanıt
pipeline'ı içinde sarmalar. Güvenilen aday ref'ini ayrı bir worktree içinde
checkout eder, `pnpm openclaw qa telegram --credential-source convex
--credential-role ci` çalıştırır, Telegram QA özetinden ve gözlenen ileti
artifact'inden bir `mantis-evidence.json` manifesti yazar, redakte edilmiş döküm
HTML'sini bir Crabbox masaüstü tarayıcısı üzerinden işler, `crabbox media
preview` ile hareket kırpılmış bir GIF oluşturur ve PR numarası mevcut olduğunda
satır içi PR kanıt yorumunu gönderir. Bu hat, oturum açılmış Telegram Web kanıtı
değil, döküm görselidir: Telegram Bot API kararlı canlı ileti kanıtı sağlar,
ancak normal Mantis otomasyonu için Telegram Web oturum durumu gerekli değildir.

`Mantis Telegram Desktop Proof` aracı tabanlı yerel Telegram Desktop
önce/sonra sarmalayıcısıdır. Bir maintainer bunu bir PR yorumundan
`@Mantis telegram desktop proof` ile, Actions UI üzerinden serbest biçimli
talimatlarla veya genel `Mantis Scenario` dağıtıcısı aracılığıyla tetikleyebilir.
İş akışı PR'ı, baseline ref'ini, aday ref'ini ve maintainer talimatlarını
Codex'e verir. Aracı PR'ı okur, değişikliği kanıtlayan Telegram'da görünür
davranışın ne olduğuna karar verir, baseline ve aday için gerçek kullanıcı
Crabbox Telegram Desktop kanıt hattını çalıştırır, yerel GIF'ler kullanışlı
olana kadar yineler, eşleştirilmiş `motionPreview` artifact'lerini
`mantis-evidence.json` içine yazar, paketi yükler ve PR numarası mevcut olduğunda
2 sütunlu bir PR kanıt tablosu gönderir.

İnsanın döngüde olduğu Telegram masaüstü kurulumu için scenario builder'ı
kullanın:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Builder bir Crabbox masaüstü lease eder veya yeniden kullanır, yerel Linux
Telegram Desktop ikilisini yükler, isteğe bağlı olarak bir kullanıcı oturumu
arşivini geri yükler, OpenClaw'ı lease edilen Telegram SUT bot token'ıyla
yapılandırır, `38974` portunda `openclaw gateway run` başlatır, lease edilen özel
gruba bir driver-bot hazırlık iletisi gönderir, ardından görünür VNC
masaüstünden bir ekran görüntüsü ve MP4 yakalar. Bir bot token'ı Telegram
Desktop'ta asla oturum açmaz; yalnızca OpenClaw'ı yapılandırır. Masaüstü
görüntüleyicisi, `--telegram-profile-archive-env <name>` üzerinden geri
yüklenen veya VNC üzerinden manuel oluşturulup `--keep-lease` ile canlı tutulan
ayrı bir Telegram kullanıcı oturumudur.

Kullanışlı Telegram desktop builder bayrakları:

- `--lease-id <cbx_...>` bir operatörün Telegram Desktop'ta zaten oturum açtığı VM üzerinde yeniden çalıştırır.
- `--telegram-profile-archive-env <name>` bu env var'dan base64 `.tgz` Telegram Desktop profil arşivini okur ve başlatmadan önce geri yükler.
- `--telegram-profile-dir <remote-path>` uzak Telegram Desktop profil dizinini kontrol eder. Varsayılan `$HOME/.local/share/TelegramDesktop` değeridir.
- `--no-gateway-setup` OpenClaw'ı yapılandırmadan Telegram Desktop'ı yükler ve açar.
- `--credential-source convex --credential-role ci` doğrudan Telegram env token'ları yerine paylaşılan kimlik bilgisi aracısını kullanır.

PR yayımlayan her senaryo raporunun yanına `mantis-evidence.json` yazar.
Bu şema, senaryo kodu ile GitHub yorumları arasındaki handoff'tur:

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

Artifact `path` değerleri manifest dizinine görelidir. `targetPath` değerleri
`qa-artifacts` branch yayımlama dizini altındaki göreli yollardır. Yayımcı path
traversal'ı reddeder ve isteğe bağlı önizlemeler veya videolar kullanılamadığında
`"required": false` olarak işaretlenmiş girdileri atlar.

Desteklenen artifact türleri:

- `timeline`: genellikle önce/sonra olan deterministik senaryo ekran görüntüsü.
- `desktopScreenshot`: VNC/tarayıcı masaüstü ekran görüntüsü.
- `motionPreview`: masaüstü kaydından oluşturulan satır içi animasyonlu GIF.
- `motionClip`: statik başlangıç ve bitişi kaldıran hareket kırpılmış MP4.
- `fullVideo`: derin inceleme için tam MP4 kaydı.
- `metadata`: JSON/log sidecar.
- `report`: Markdown raporu.

Yeniden kullanılabilir yayımcı `scripts/mantis/publish-pr-evidence.mjs`'dir. İş
akışları bunu manifest, hedef PR, `qa-artifacts` hedef kökü, yorum işaretleyicisi,
Actions artifact URL'si, run URL'si ve istek kaynağıyla çağırır. Bildirilen
artifact'leri `qa-artifacts` branch'ine kopyalar, satır içi görseller/önizlemeler
ve bağlantılı videolarla özet odaklı bir PR yorumu oluşturur, ardından mevcut
işaretleyici yorumunu günceller veya yenisini oluşturur.

Status-reactions çalıştırmasını doğrudan bir PR yorumundan da tetikleyebilirsiniz:

```text
@Mantis discord status reactions
```

Yorum tetikleyicisi bilinçli olarak dardır. Yalnızca write, maintain veya admin
erişimi olan kullanıcıların pull request yorumlarında çalışır ve yalnızca
Discord status-reaction isteklerini tanır. Varsayılan olarak bilinen kötü
baseline ref'ini ve aday olarak mevcut PR head SHA'sını kullanır. Maintainer'lar
her iki ref'i de geçersiz kılabilir:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram canlı QA da bir PR yorumundan tetiklenebilir:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Varsayılan olarak aday olarak mevcut PR head SHA'sını kullanır ve
`telegram-status-command` çalıştırır. Maintainer'lar belirli bir ref'e veya
önceden ısıtılmış bir Crabbox masaüstüne ihtiyaç duyduklarında `candidate=...`,
`provider=aws|hetzner` ve `lease=<cbx_...>` değerlerini geçersiz kılabilir.

ClawSweeper komut örnekleri:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

İlk komut açık ve senaryo odaklıdır. İkincisi daha sonra bir PR'ı veya issue'yu
etiketlerden, değişen dosyalardan ve ClawSweeper inceleme bulgularından önerilen
Mantis senaryolarına eşleyebilir.

## Çalıştırma yaşam döngüsü

1. Kimlik bilgilerini al.
2. Bir VM ayır veya yeniden kullan.
3. Senaryonun UI kanıtına ihtiyaç duyduğu durumlarda masaüstü/tarayıcı profilini hazırla.
4. Baseline ref'i için temiz bir checkout hazırla.
5. Bağımlılıkları yükle ve yalnızca senaryonun ihtiyaç duyduğu şeyleri build et.
6. İzole bir durum diziniyle bir alt OpenClaw Gateway başlat.
7. Canlı transport'u, sağlayıcıyı, modeli ve tarayıcı profilini yapılandır.
8. Senaryoyu çalıştır ve baseline kanıtını yakala.
9. Gateway'i durdur ve log'ları koru.
10. Aynı VM içinde aday ref'ini hazırla.
11. Aynı senaryoyu çalıştır ve aday kanıtını yakala.
12. Oracle sonuçlarını ve görsel kanıtı karşılaştır.
13. Markdown, JSON, log'lar, ekran görüntüleri ve isteğe bağlı trace artifact'leri yaz.
14. GitHub Actions artifact'lerini yükle.
15. Kısa bir PR veya Discord durum iletisi gönder.

Senaryo iki farklı şekilde başarısız olabilmelidir:

- **Hata yeniden üretildi**: baseline beklenen şekilde başarısız oldu.
- **Harness hatası**: ortam kurulumu, kimlik bilgileri, Discord API, tarayıcı veya
  sağlayıcı, hata oracle'ı anlamlı hale gelmeden önce başarısız oldu.

Son rapor bu durumları ayırmalıdır ki maintainer'lar kararsız bir ortamı ürün
davranışıyla karıştırmasın.

## Discord MVP

İlk senaryo, kaynak yanıt teslim modunun `message_tool_only` olduğu guild
kanallarındaki Discord durum tepkilerini hedeflemelidir.

Neden iyi bir Mantis tohumu olduğu:

- Tetikleyen ileti üzerindeki tepkiler olarak Discord'da görünür.
- Discord ileti tepki durumu üzerinden güçlü bir REST oracle'ına sahiptir.
- Gerçek bir OpenClaw Gateway'i, Discord bot auth'u, ileti dispatch'ini,
  kaynak yanıt teslim modunu, durum tepki durumunu ve model turn yaşam döngüsünü
  çalıştırır.
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

Baseline kanıtı queued acknowledgement tepkisini göstermeli, ancak tool-only
modunda lifecycle geçişi göstermemelidir. Aday kanıtı
`messages.statusReactions.enabled` açıkça true olduğunda lifecycle durum
tepkilerinin çalıştığını göstermelidir.

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

SUT'u her zaman açık guild işleme, `visibleReplies: "message_tool"`,
`ackReaction: "👀"` ve açık durum tepkileriyle yapılandırır. Oracle gerçek
Discord tetikleyici iletisini yoklar ve gözlenen `👀 -> 🤔 -> 👍` dizisini bekler.
Artifact'ler `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` ve
`discord-status-reactions-tool-only-timeline.png` içerir.

## Mevcut QA parçaları

Mantis, sıfırdan başlamak yerine mevcut özel QA stack'i üzerine kurulmalıdır:

- `pnpm openclaw qa discord` zaten driver ve SUT botlarıyla canlı bir Discord hattı çalıştırır.
- Canlı transport runner zaten `.artifacts/qa-e2e/` altında raporlar ve gözlenen ileti artifact'leri yazar.
- Convex kimlik bilgisi lease'leri zaten paylaşılan canlı transport kimlik bilgilerine özel erişim sağlar.
- Tarayıcı kontrol servisi zaten ekran görüntülerini, snapshot'ları, headless yönetilen profilleri ve uzak CDP profillerini destekler.
- QA Lab zaten transport biçimli testler için bir debugger UI'sine ve bus'a sahiptir.

İlk Mantis uygulaması, bu parçalar üzerinde ince bir önce/sonra runner'ı ve buna
eklenen bir görsel kanıt katmanı olabilir.

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

`mantis-summary.json` makine tarafından okunabilir doğruluk kaynağı olmalıdır.
Markdown raporu PR yorumları ve insan incelemesi içindir.

Özet şunları içermelidir:

- test edilen ref'ler ve SHA'lar
- transport ve senaryo id'si
- makine sağlayıcısı ve makine id'si veya lease id'si
- secret değerler olmadan kimlik bilgisi kaynağı
- baseline sonucu
- aday sonucu
- hatanın baseline üzerinde yeniden üretilip üretilmediği
- adayın bunu düzeltip düzeltmediği
- artifact yolları
- sanitize edilmiş kurulum veya temizleme sorunları

Ekran görüntüleri kanıttır, sır değildir. Yine de redaksiyon disiplini gerekir:
özel kanal adları, kullanıcı adları veya mesaj içerikleri görünebilir. Herkese açık PR'lar için,
redaksiyon hikayesi güçlenene kadar satır içi görseller yerine GitHub Actions yapıt bağlantılarını
tercih edin.

## Tarayıcı ve VNC

Tarayıcı hattının iki modu vardır:

- **Headless otomasyon**: CI için varsayılan. Chrome, CDP etkin olarak çalışır ve
  Playwright veya OpenClaw tarayıcı denetimi ekran görüntülerini yakalar.
- **VNC kurtarma**: oturum açma, MFA, Discord otomasyon karşıtı önlemleri
  veya görsel hata ayıklama bir insan gerektirdiğinde aynı VM üzerinde etkinleştirilir.

Discord gözlemci tarayıcı profili, her çalıştırmada
oturum açmayı önleyecek kadar kalıcı olmalı, ancak kişisel tarayıcı durumundan yalıtılmalıdır. Bir profil,
geliştirici dizüstü bilgisayarına değil Mantis makine havuzuna aittir.

Mantis takıldığında, şu bilgileri içeren bir Discord durum mesajı gönderir:

- çalıştırma kimliği
- senaryo kimliği
- makine sağlayıcısı
- yapıt dizini
- varsa VNC veya noVNC bağlantı yönergeleri
- kısa engelleyici metni

İlk özel dağıtım bu mesajları mevcut operatör kanalına gönderebilir ve daha sonra
özel bir Mantis kanalına geçebilir.

## Makineler

Mantis, ilk uzak uygulama için Crabbox üzerinden AWS'yi tercih etmelidir.
Crabbox bize ısıtılmış makineler, kiralama takibi, hazırlama, günlükler, sonuçlar ve
temizlik sağlar. AWS kapasitesi çok yavaşsa veya kullanılamıyorsa, aynı makine arayüzünün
arkasına bir Hetzner sağlayıcısı ekleyin.

Minimum VM gereksinimleri:

- Masaüstü destekli Chrome veya Chromium kurulumu olan Linux
- Tarayıcı otomasyonu için CDP erişimi
- Kurtarma için VNC veya noVNC
- Node 22 ve pnpm
- OpenClaw checkout'u ve bağımlılık önbelleği
- Playwright kullanıldığında Playwright Chromium tarayıcı önbelleği
- bir OpenClaw Gateway, bir tarayıcı ve bir model çalıştırması için yeterli CPU ve bellek
- Discord, GitHub, model sağlayıcıları ve kimlik bilgisi aracısına giden erişim

VM, beklenen kimlik bilgisi veya tarayıcı profili depoları dışında uzun ömürlü ham sırlar
tutmamalıdır.

## Sırlar

Sırlar, uzak çalıştırmalar için GitHub kuruluş veya depo sırlarında, yerel çalıştırmalar içinse
yerel, operatör denetimli bir sır dosyasında bulunur.

Önerilen sır adları:

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

Uzun vadede Convex kimlik bilgisi havuzu, canlı aktarım kimlik bilgileri için normal kaynak
olarak kalmalıdır. GitHub sırları aracı ve yedek hatları bootstrap eder.
Discord durum tepkileri iş akışı, Mantis Crabbox sırlarını Crabbox CLI'ın beklediği
`CRABBOX_COORDINATOR` ve `CRABBOX_COORDINATOR_TOKEN` ortam değişkenlerine geri eşler.
Düz `CRABBOX_*` GitHub sır adları uyumluluk yedeği olarak kabul edilmeye devam eder.

Mantis çalıştırıcısı asla şunları yazdırmamalıdır:

- Discord bot token'ları
- sağlayıcı API anahtarları
- tarayıcı çerezleri
- kimlik doğrulama profili içerikleri
- VNC parolaları
- ham kimlik bilgisi yükleri

Herkese açık yapıt yüklemeleri ayrıca bot, guild, kanal ve mesaj kimlikleri gibi Discord hedef
meta verilerini de redakte etmelidir. GitHub smoke iş akışı bu nedenle
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` değerini etkinleştirir.

Bir token yanlışlıkla bir issue'ya, PR'a, sohbete veya günlüğe yapıştırılırsa,
yeni sır saklandıktan sonra onu döndürün.

## GitHub yapıtları ve PR yorumları

Mantis iş akışları, tam kanıt paketini kısa ömürlü bir Actions yapıtı olarak yüklemelidir.
İş akışı bir hata raporu veya düzeltme PR'ı için çalıştırıldığında, redakte edilmiş PNG ekran görüntülerini
`qa-artifacts` dalına da yayımlamalı ve ilgili hata veya düzeltme PR'ında satır içi önce/sonra ekran görüntüleriyle
bir yorumu upsert etmelidir. Birincil kanıtı yalnızca genel bir QA otomasyonu PR'ında paylaşmayın.
Ham günlükler, gözlemlenen mesajlar ve diğer hacimli kanıtlar Actions yapıtında kalır.

Üretim iş akışları bu yorumları `github-actions[bot]` ile değil, Mantis GitHub App ile göndermelidir.
Uygulama kimliğini ve özel anahtarı `MANTIS_GITHUB_APP_ID` ve `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions
sırları olarak saklayın. İş akışı upsert anahtarı olarak gizli bir işaret kullanır, token düzenleyebildiğinde
o yorumu günceller ve daha eski, bot'a ait bir işaret düzenlenemediğinde Mantis'e ait yeni bir yorum oluşturur.

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

Çalıştırma harness başarısız olduğu için başarısız olursa, yorum adayın başarısız olduğunu ima etmek yerine
bunu söylemelidir.

## Özel dağıtım notları

Özel bir dağıtımda zaten bir Mantis Discord uygulaması olabilir. Doğru bot
izinlerine sahipse ve güvenli şekilde döndürülebiliyorsa başka bir uygulama oluşturmak yerine
bu uygulamayı yeniden kullanın.

İlk operatör bildirim kanalını sırlar veya dağıtım yapılandırması üzerinden ayarlayın.
Önce mevcut bir maintainer veya operasyon kanalını gösterebilir, ardından bir tane oluşturulduğunda
özel bir Mantis kanalına taşınabilir.

Guild kimliklerini, kanal kimliklerini, bot token'larını, tarayıcı çerezlerini veya VNC parolalarını
bu belgeye koymayın. Bunları GitHub sırlarında, kimlik bilgisi aracısında veya operatörün yerel sır deposunda saklayın.

## Senaryo ekleme

Bir Mantis senaryosu şunları bildirmelidir:

- kimlik ve başlık
- aktarım
- gerekli kimlik bilgileri
- baseline ref ilkesi
- candidate ref ilkesi
- OpenClaw yapılandırma yaması
- kurulum adımları
- uyarıcı
- beklenen baseline oracle
- beklenen candidate oracle
- görsel yakalama hedefleri
- zaman aşımı bütçesi
- temizlik adımları

Senaryolar küçük, tiplendirilmiş oracle'ları tercih etmelidir:

- tepki hataları için Discord tepki durumu
- iş parçacığı hataları için Discord mesaj başvuruları
- Slack hataları için Slack thread ts ve tepki API durumu
- e-posta hataları için e-posta mesaj kimlikleri ve başlıkları
- UI tek güvenilir gözlemlenebilir olduğunda tarayıcı ekran görüntüleri

Görsel kontroller eklemeli olmalıdır. Bir platform API'si hatayı kanıtlayabiliyorsa,
geçti/kaldı oracle'ı olarak API'yi kullanın ve ekran görüntülerini insan güveni için saklayın.

## Sağlayıcı genişletme

Discord'dan sonra aynı çalıştırıcı şunları ekleyebilir:

- Slack: tepkiler, iş parçacıkları, uygulama bahsetmeleri, modallar, dosya yüklemeleri.
- E-posta: bağlayıcıların yeterli olmadığı yerlerde `gog` kullanarak Gmail kimlik doğrulaması ve mesaj iş parçacığı.
- WhatsApp: QR oturumu açma, yeniden tanımlama, mesaj teslimi, medya, tepkiler.
- Telegram: grup bahsetme kapısı, komutlar, varsa tepkiler.
- Matrix: şifreli odalar, iş parçacığı veya yanıt ilişkileri, yeniden başlatmada devam etme.

Her aktarımda bir ucuz smoke senaryosu ve bir veya daha fazla hata sınıfı
senaryosu olmalıdır. Pahalı görsel senaryolar opt-in kalmalıdır.

## Açık sorular

- Mevcut Mantis bot yeniden kullanıldığında hangi Discord bot driver, hangisi SUT olmalıdır?
- Gözlemci tarayıcı oturumu ilk aşama için bir insan Discord hesabı mı, bir test hesabı mı
  yoksa yalnızca bot tarafından okunabilir REST kanıtı mı kullanmalıdır?
- GitHub, PR'lar için Mantis yapıtlarını ne kadar süre saklamalıdır?
- ClawSweeper, bir maintainer komutunu beklemek yerine Mantis'i ne zaman otomatik olarak önermelidir?
- Herkese açık PR'lar için ekran görüntüleri yüklemeden önce redakte edilmeli veya kırpılmalı mıdır?

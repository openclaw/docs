---
read_when:
    - OpenClaw hataları için canlı görsel kalite güvencesi oluşturma veya çalıştırma
    - Bir pull request için öncesi ve sonrası doğrulaması ekleme
    - Discord, Slack, WhatsApp veya diğer canlı aktarım senaryolarını ekleme
    - Aday bir ref için odaklı Control UI tarayıcı doğrulaması çalıştırma
    - Ekran görüntüleri, tarayıcı otomasyonu veya VNC erişimi gerektiren QA çalıştırmalarında hata ayıklama
summary: Mantis, canlı aktarım karşılaştırmaları ve yalnızca adaylara odaklanan tarayıcı kanıtları için görsel uçtan uca kanıtlar yakalar, ardından yapıtları PR'lara ekler.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T16:54:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis, OpenClaw davranışı için görsel CI kanıtı ve bir PR yorumu yayımlar.
Canlı aktarım senaryoları, hatalı olduğu bilinen bir temel çizgiyi aday bir ref ile
karşılaştırır; odaklanmış tarayıcı hatları ise bunun yerine deterministik olarak
taklit edilen bir aktarıma karşı tek bir adayı kanıtlayabilir. Discord; gerçek bot kimlik doğrulaması, sunucu kanalları,
tepkiler, ileti dizileri ve bir tarayıcı tanığıyla ilk kullanıma sunulan oldu. Slack, Telegram ve odaklanmış Control
UI sohbet hatları da mevcuttur; WhatsApp ve Matrix uygulanmamıştır.

## Sahiplik

- OpenClaw (`extensions/qa-lab/src/mantis/*`): senaryo çalışma zamanı, `pnpm openclaw qa mantis <command>` CLI, kanıt şeması.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): canlı aktarım test düzeneği, sürücü/SUT botları, rapor/kanıt yazıcıları.
- Crabbox (`openclaw/crabbox`): hazırlanmış Linux makineleri, kiralamalar, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): uzak giriş noktaları, yapıt saklama.
- ClawSweeper: bakımcı PR komutlarını ayrıştırır, iş akışlarını tetikler, son PR yorumunu gönderir.

## CLI komutları

Tüm komutlar `pnpm openclaw qa mantis <command>` olup
`extensions/qa-lab/src/mantis/cli.ts` içinde tanımlanır. Derleme/çalıştırma sırasında `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
gerektirir (paketli iş akışları derlemeden önce `OPENCLAW_BUILD_PRIVATE_QA=1` ve
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` ayarlar).

| Komut                           | Amaç                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Mantis Discord botunun sunucuyu/kanalı görebildiğini, gönderi paylaşabildiğini ve tepki verebildiğini doğrular.                                            |
| `run`                           | Temel çizgi ve aday ref'lerine karşı bir öncesi/sonrası senaryosu çalıştırır (yalnızca Discord).                                                           |
| `desktop-browser-smoke`         | Bir Crabbox masaüstü kiralar/yeniden kullanır, görünür bir tarayıcı açar, ekran görüntüsü + video yakalar.                                                 |
| `slack-desktop-smoke`           | Bir Crabbox masaüstü kiralar/yeniden kullanır, içinde Slack QA çalıştırır, Slack Web'i açar, kanıt yakalar.                                                |
| `telegram-desktop-builder`      | Bir Crabbox masaüstü kiralar/yeniden kullanır, Telegram Desktop'ı yükler, isteğe bağlı olarak bir OpenClaw gateway'i yapılandırır.                         |
| `visual-task` / `visual-driver` | İsteğe bağlı görüntü anlama doğrulamalarıyla genel Crabbox masaüstü yakalama; `visual-driver`, `crabbox record --while` altında başlatılan sürücü yarısıdır. |

Her komut `--repo-root <path>` ve `--output-dir <path>` kabul eder; Crabbox
komutları ayrıca `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` ve `--keep-lease` kabul eder. Sağlayıcı/sınıf için yerel CLI varsayılanları,
aksi belirtilmedikçe `hetzner`/`beast` değerleridir; CI iş akışları
genellikle ikisini de geçersiz kılar.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Bot kullanıcısını, sunucuyu, sunucunun kanallarını ve hedef kanalı almak için
Discord REST API'sini (`https://discord.com/api/v10`) çağırır, kanalın sunucuya ait olduğunu doğrular,
ardından (`--skip-post` olmadığı sürece) bir mesaj gönderir ve
`👀` tepkisi ekler. `mantis-discord-smoke-summary.json` ve
`mantis-discord-smoke-report.md` yazar.

Token çözümleme sırası: `--token-file` değeri, ardından `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(`--token-env` ile geçersiz kılın), ardından `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE` tarafından adlandırılan bir dosya
(`--token-file-env` ile geçersiz kılın). Sunucu/kanal kimlikleri
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` kaynağından gelir
(`--guild-id` / `--channel-id` ile geçersiz kılın) ve 17-20 basamaklı Discord snowflake'leri olmalıdır. Yayımlanan özet ve rapordaki
bot/sunucu/kanal/mesaj kimliklerini ve adlarını `<redacted>` ile değiştirmek için
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ayarlayın.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` şu anda yalnızca `discord` kabul eder. `--scenario`, her biri
kendi varsayılan temel çizgi ref'ine ve beklenen öncesi/sonrası
etiketlerine (`extensions/qa-lab/src/mantis/run.runtime.ts`) sahip iki yerleşik kimlikten biridir:

| Senaryo                                    | Varsayılan temel çizgi                      | Temel çizginin beklentisi                  | Adayın beklentisi              |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | ileti dizisi yanıtı `filePath` ekini içermez | ileti dizisi yanıtı bunu içerir |

`--candidate` varsayılan olarak `HEAD` değerini alır. Diğer bayraklar: `--credential-source`
(varsayılan `convex`), `--credential-role` (varsayılan `ci`), `--provider-mode`
(varsayılan `live-frontier`), `--fast` (varsayılan olarak açık), `--skip-install`, `--skip-build`.

Çalıştırıcı, temel çizgi ve aday için `<output-dir>/worktrees/` altında ayrık
`git worktree` çalışma kopyaları oluşturur, her birinde
(atlanmadığı sürece) `pnpm install`/`pnpm build` çalıştırır, ardından her çalışma ağacına karşı
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
çalıştırır. Her hat, `discord-qa-reaction-timelines.json` ile birlikte bir
`<scenario-id>-timeline.html`/`.png` çifti yazar; çalıştırıcı bu kanıtı
`baseline/`/`candidate/` altına geri kopyalar, çıktı dizinine `comparison.json`,
`mantis-report.md` ve `mantis-evidence.json` yazar ve
karşılaştırma başarılı olmadıysa (temel çizgi `fail` ve aday
`pass`) sıfırdan farklı bir kodla çıkar.

İkinci Discord senaryosu (`discord-thread-reply-filepath-attachment`), sürücü botuyla
bir üst mesaj gönderir, gerçek bir ileti dizisi oluşturur, depo içindeki bir `filePath` ile SUT'nin
`message.thread-reply` eylemini çağırır, ardından yanıt ve ek dosya adı için
ileti dizisini yoklar. `mantis-thread-report.md` adlı bir ek bekler.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Bir Crabbox masaüstü kiralar veya yeniden kullanır, VNC oturumu içinde
`--browser-url` (varsayılan `https://openclaw.ai`) ya da işlenmiş bir
`--html-file` adresine yönlendirilmiş bir tarayıcı başlatır, bekler, `scrot` ile ekran görüntüsü alır, isteğe bağlı olarak
`ffmpeg` ile bir MP4 kaydeder ve `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
öğelerini `--output-dir` konumuna rsync ile geri eşitler.

Bayraklar:

- `--lease-id <cbx_...>` yeni bir masaüstü oluşturmak yerine hazırlanmış bir masaüstünü yeniden kullanır.
- `--browser-profile-dir <remote-path>` uzak bir Chrome kullanıcı verileri dizinini yeniden kullanır; böylece kalıcı bir masaüstü çalıştırmalar arasında oturumu açık tutar (uzun ömürlü bir Discord Web görüntüleyici profili için kullanılır).
- `--browser-profile-archive-env <name>` başlatmadan önce bu ortam değişkenindeki base64 `.tgz` Chrome profil arşivini geri yükler (varsayılan `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); Discord Web gibi oturum açmış tanıklar için kullanılır.
- `--video-duration <seconds>` MP4 yakalama süresini denetler (varsayılan 10s).
- `--keep-lease` (veya `OPENCLAW_MANTIS_KEEP_VM=1`) bu çalıştırmanın oluşturduğu kiralamayı VNC incelemesi için açık tutar; kiralama oluşturan başarısız çalıştırmalar da varsayılan olarak kiralamayı açık tutar.

Discord Web kanıtı için Mantis, bot token'ı değil, özel bir görüntüleyici
hesabı kullanır. Discord REST doğrulama kaynağı (`qa discord` aracılığıyla) yetkili kaynak olmaya devam eder; `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`
ayarlandığında senaryo ayrıca bir Discord Web URL yapıtı yazar ve
`OPENCLAW_QA_DISCORD_KEEP_THREADS=1`, ileti dizisini tarayıcının açmasına yetecek kadar uzun süre
açık tutar.

GitHub iş akışı, `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` aracılığıyla kalıcı bir görüntüleyici profilini
tercih eder (tam profil arşivleri GitHub'ın gizli dizi boyutu sınırını aşabilir);
küçük/önyükleme profilleri için bunun yerine `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` içindeki
base64 `.tgz` arşivini geri yükleyebilir. Hiçbir kaynak
yapılandırılmadığında iş akışı yine deterministik temel çizgi/adayı ekran
görüntülerini yayımlar ve oturum açmış tanığın atlandığını günlüğe kaydeder.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bir Crabbox masaüstü kiralar veya yeniden kullanır, çalışma kopyasını VM içine eşitler,
içinde `pnpm openclaw qa slack` çalıştırır, VNC tarayıcısında Slack Web'i açar,
masaüstünü yakalar ve hem Slack QA yapıtlarını (`slack-qa/`) hem de
VNC ekran görüntüsünü/videosunu yerel ortama kopyalar. Bu, SUT gateway'i ile
tarayıcının aynı VM içinde çalıştığı tek Mantis biçimidir.

`--gateway-setup` ile komut, VM içinde `$HOME/.openclaw-mantis/slack-openclaw` konumunda
kalıcı ve tek kullanımlık bir OpenClaw ana dizini oluşturur, hedef kanal için Slack
Socket Mode yapılandırmasına yama uygular,
`openclaw gateway run --dev --allow-unconfigured --port 38973` başlatır ve
Chrome'u VNC oturumunda çalışır durumda bırakır; `--gateway-setup` belirtilmezse bunun yerine normal
bottan bota Slack QA hattı çalıştırılır.

`--credential-source env` için gerekli ortam değişkenleri (yerel varsayılan `env`; rol
varsayılanı `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- uzak model hattı için `OPENCLAW_LIVE_OPENAI_KEY` (yerel olarak yalnızca `OPENAI_API_KEY`
  ayarlanmışsa Mantis, Crabbox'ı çağırmadan önce bunu `OPENCLAW_LIVE_OPENAI_KEY` konumuna
  kopyalar)

`--credential-source convex` ile Mantis, VM'yi oluşturmadan önce
paylaşılan havuzdan Slack SUT kimlik bilgisini kiralar ve kanal kimliğini, uygulama token'ını ve
bot token'ını `OPENCLAW_MANTIS_SLACK_*` ortam değişkenleri olarak VM'ye iletir; böylece GitHub
iş akışları ham Slack token'larına değil, yalnızca Convex aracı gizli dizisine ihtiyaç duyar.

Diğer bayraklar: `--slack-url <url>` belirli bir URL'yi açar (aksi takdirde Mantis
`auth.test` üzerinden `https://app.slack.com/client/<team>/<channel>` türetir);
`--slack-channel-id <id>` gateway izin listesindeki kanalı ayarlar;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` VM içindeki kalıcı Chrome
profilini denetler (varsayılan `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` yerel Slack onay senaryolarını
(`slack-approval-exec-native`, `slack-approval-plugin-native`) çalıştırır ve
gateway kurulumu yerine bekleyen/çözümlenmiş denetim noktası ekran görüntülerini işler
(`--gateway-setup` ile birlikte kullanılamaz); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` ve `--fast`, Slack canlı hattına
aktarılır.

Onay denetim noktası ekran görüntüleri, canlı Slack kullanıcı arayüzünden değil,
senaryonun gözlemlediği Slack API mesajından işlenir; `slack-desktop-smoke.png`, yalnızca
kiralamanın tarayıcı profilinde önceden oturum açılmışsa Slack Web'in kendisinin
kanıtıdır.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Bir Crabbox masaüstü kiralar veya yeniden kullanır, yerel Linux Telegram Desktop'ı
yükler, isteğe bağlı olarak bir kullanıcı oturumu arşivini geri yükler, OpenClaw'ı
kiralanan Telegram SUT bot token'ıyla yapılandırır,
`openclaw gateway run --dev --allow-unconfigured --port 38974` başlatır,
kiralanan özel gruba bir sürücü botu hazır olma mesajı gönderir, ardından bir
ekran görüntüsü ve MP4 yakalar. Bot token'ı yalnızca OpenClaw'ı yapılandırır; Telegram Desktop'ta
asla oturum açmaz. Masaüstü görüntüleyicisi, `--telegram-profile-archive-env <name>` kaynağından geri yüklenen veya
VNC üzerinden elle oturum açılan ve `--keep-lease` ile çalışır durumda tutulan
ayrı bir Telegram kullanıcı oturumudur.

Bayraklar: `--lease-id <cbx_...>`, Telegram Desktop'ta zaten oturum açılmış bir VM'ye karşı yeniden çalıştırır;
`--telegram-profile-archive-env <name>`, başlatmadan önce base64
`.tgz` profil arşivini geri yükler; `--telegram-profile-dir <remote-path>`
uzak profil dizinini ayarlar (varsayılan `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` yalnızca Telegram Desktop'ı yükler ve açar;
`--credential-source`/`--credential-role` varsayılan olarak `convex`/`maintainer` değerlerini alır.

## Kanıt manifestosu

PR'ye yayın yapan her senaryo, raporunun yanına `mantis-evidence.json` yazar:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Durum Tepkileri Kalite Güvencesi",
  "summary": "PR yorumu için insanlar tarafından okunabilir üst düzey özet.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "yalnızca sıraya alındı" },
    "candidate": { "sha": "...", "status": "pass", "expected": "sıraya alındı -> düşünüyor -> tamamlandı" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Temel çizgi yalnızca sıraya alındı",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Temel çizgi Discord zaman çizelgesi",
      "width": 420
    }
  ]
}
```

Yapıt `path`, bildirimin dizinine göredir; `targetPath` ise
yapılandırılan R2/S3 yapıt ön ekine göredir. `scripts/mantis/publish-pr-evidence.mjs`,
dizin geçişini reddeder ve dosya eksik olduğunda `"required": false` içeren
girdileri atlar.

Yapıt türleri: `timeline` (belirlenimsel öncesi/sonrası ekran görüntüsü),
`desktopScreenshot` (VNC/tarayıcı ekran görüntüsü), `motionPreview` (kayıttan satır içi
animasyonlu GIF), `motionClip` (harekete göre kırpılmış MP4), `fullVideo` (tam
kayıt), `metadata` (JSON/günlük yardımcı dosyası), `report` (Markdown raporu).

Bir çalıştırmanın disk üzerindeki yapıt düzeni:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Ekran görüntüleri gizli bilgi değil, kanıttır; ancak yine de redaksiyon disiplini
gerektirir: özel kanal adları, kullanıcı adları veya mesaj içeriği görünebilir.
Herkese açık yapıt yüklemeleri için `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ayarlayın; bu,
Discord/Slack/Telegram GitHub iş akışlarında varsayılan olarak etkindir.

## GitHub otomasyonu

`scripts/mantis/publish-pr-evidence.mjs` yeniden kullanılabilir yayıncıdır. İş akışları
onu bildirim, hedef PR, yapıt hedef kökü, yorum işaretçisi,
yapıt URL'si, çalıştırma URL'si ve istek kaynağıyla çağırır. Bildirilen yapıtları
Mantis R2 kovasına yükler, satır içi görseller/önizlemeler ve bağlantılı videolarla
önce özet sunan bir PR yorumu oluşturur, ardından mevcut işaretçi yorumunu günceller
veya yeni bir yorum oluşturur. Gerekli ortam değişkenleri:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (iş akışları `openclaw-crabbox-artifacts` ayarlar)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (iş akışları `auto` ayarlar)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (iş akışları `https://artifacts.openclaw.ai` ayarlar)

Yorumlar, `github-actions[bot]` yerine Mantis GitHub App (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`) üzerinden, ekleme veya güncelleme anahtarı olarak gizli
bir işaretçi yorumu kullanılarak gönderilir.

| İş akışı                          | Tetikleyici                                                                                    | Yaptığı işlem                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | elle çalıştırma                                                                            | Seçilen bir ref üzerinde `discord-smoke` çalıştırır.                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | PR yorumu veya elle çalıştırma                                                              | Ayrı temel çizgi/aday çalışma ağaçları oluşturur, her birinde `discord-status-reactions-tool-only` çalıştırır, her şeridin zaman çizelgesini bir Crabbox masaüstü tarayıcısında işler, `crabbox media preview` ile harekete göre kırpılmış GIF/MP4 önizlemeleri oluşturur, yapıtları yükler ve satır içi PR kanıtı gönderir.                                 |
| `Mantis Scenario`                 | elle çalıştırma                                                                            | Genel dağıtıcı: `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` alır ve eşleşen senaryo iş akışına iletir. |
| `Mantis Slack Desktop Smoke`      | elle çalıştırma                                                                            | Bir Crabbox Linux masaüstü kiralar (varsayılan `aws`, `hetzner` seçenekleri), aday üzerinde `slack-desktop-smoke --gateway-setup` çalıştırır, masaüstünü kaydeder, bir hareket önizlemesi oluşturur, yapıtları yükler ve bir PR numarası verildiğinde PR kanıtı gönderir.                                                      |
| `Mantis Telegram Live`            | PR yorumu veya elle çalıştırma                                                              | Bot API'si Telegram canlı kalite güvence şeridini (`openclaw qa telegram`) çalıştırır, kalite güvence özetinden `mantis-evidence.json` yazar, redakte edilmiş kanıt HTML'sini bir Crabbox masaüstü tarayıcısı üzerinden işler, bir hareket GIF'i oluşturur ve PR kanıtı gönderir. Bu şerit için Telegram Web oturumu açmak gerekmez.                               |
| `Mantis Telegram Desktop Proof`   | bakımcı PR etiketi (`mantis: telegram-visible-proof`) ile PR yorumu veya elle çalıştırma | Aracılı yerel Telegram Desktop öncesi/sonrası kanıtı. PR'yi, temel çizgi/aday ref'lerini ve bakımcı talimatlarını Codex'e aktarır; Codex her iki ref için gerçek kullanıcı Crabbox Telegram Desktop kanıt şeridini çalıştırır ve 2 sütunlu bir PR kanıt tablosu gönderir.                                                              |
| `Mantis Web UI Chat Proof`        | PR yorumu veya elle çalıştırma                                                              | Aday üzerinde odaklanmış OpenClaw Control UI sohbet Playwright kanıtını çalıştırır, tarayıcının taklit Gateway üzerinden gönderim yaptığını doğrular, ekran görüntüsü/video yapıtlarını yakalar ve PR kanıtı gönderir. Bu şerit yalnızca web sohbeti kanıtıdır; WinUI/yerel uygulama veya rastgele görsel kanıt değildir.                           |

`Mantis Discord Status Reactions` ve `Mantis Telegram Live` her ikisi de
`baseline_ref`/`candidate_ref` (veya bir PR yorumunda `baseline=`/`candidate=`) kabul eder
ve gizli bilgi taşıyan kimlik bilgileriyle çalıştırmadan önce çözümlenen SHA'nın
`origin/main` öğesinin bir atası, bir sürüm etiketi (`v*`) veya
açık bir PR'nin başı olduğunu doğrular.

Yazma/bakım/yönetici erişimine sahip bir PR'den yorum tetikleyicileri:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram yorum tetikleyicileri varsayılan olarak PR baş SHA'sını aday,
`telegram-status-command` değerini ise senaryo olarak kullanır; belirli bir Crabbox sağlayıcısını
veya önceden ısıtılmış bir masaüstünü hedeflemek için `provider=aws|hetzner` ve
`lease=<cbx_...>` kabul eder. `Mantis Telegram Desktop Proof`, yalnızca PR zaten
`mantis: telegram-visible-proof` etiketini taşıyorsa PR yorumuna yanıt verir.

Web UI sohbet yorum tetikleyicileri varsayılan olarak PR baş SHA'sını aday olarak kullanır.
Control UI taklit Gateway sohbet kanıtını çalıştırır ve tarayıcı yapıtlarını yayınlarlar;
diğer web sayfaları ve yerel uygulama yüzeyleri için normal Playwright/tarayıcı kanıtı,
bakımcı ekran görüntüleri, Crabbox veya yerel yapıtlar kullanın.

ClawSweeper bir senaryoyu doğrudan da çalıştırabilir:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Makineler ve gizli bilgiler

Yerel CLI Crabbox varsayılanları `--provider hetzner --class beast` şeklindedir; bunları
`--provider`, `--class`/`--machine-class` veya
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` ile geçersiz kılın. GitHub
iş akışları genellikle her ikisini de geçersiz kılar (örneğin `--class standard` ve
Slack iş akışının `aws`/`hetzner` sağlayıcı seçimi girdisi). Bir sağlayıcı çok
yavaşsa veya kullanılamıyorsa sabit kodlanmış bir geri dönüş eklemek yerine onu
aynı Crabbox arayüzünün arkasına ekleyin.

VM temel çizgisi: masaüstü özellikli Chrome/Chromium, CDP erişimi, VNC/
noVNC, Node 22.22.3+, 24.15+ veya 25.9+ ve pnpm, bir OpenClaw çalışma kopyası
ile hedef aktarıma, GitHub'a, model sağlayıcılarına ve kimlik bilgisi aracısına
giden erişime sahip Linux.

Mantis komutları ve iş akışları genelinde kullanılan kimlik bilgisi ve ortam adları:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- Yerel `qa mantis run --credential-source env` ayrıca
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  ve `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` gerektirir. GitHub iş akışları normalde ham
  Discord bot belirteçleri yerine `--credential-source convex` ve aşağıdaki aracı
  kimlik bilgilerini kullanır.
- Herkese açık yapıt yüklemeleri için `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (veya Telegram Desktop kanıtına özel
  `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (iş akışları ayrıca
  geri dönüş olarak `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` kabul eder
  ve Crabbox'ı çağırmadan önce bunları yalın adlarla eşler)
- `CRABBOX_ACCESS_CLIENT_ID`, `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis çalıştırıcısı Discord/Slack/Telegram bot belirteçlerini,
sağlayıcı API anahtarlarını, tarayıcı çerezlerini, kimlik doğrulama profili içeriklerini,
VNC parolalarını veya ham kimlik bilgisi yüklerini asla yazdırmamalıdır. Bir belirteç
bir sorun kaydına, PR'ye, sohbete veya günlüğe sızarsa yeni gizli bilgi saklandıktan
sonra belirteci döndürün.

## Çalıştırma sonuçları

Öncesi/sonrası aktarım senaryoları, kararsız bir ortamın ürün gerilemesi olarak
algılanmaması için şu sonuçları birbirinden ayırır:

- **Hata yeniden üretildi**: temel çizgi, senaryonun beklediği şekilde başarısız oldu.
- **Test düzeneği hatası**: ortam kurulumu, kimlik bilgileri, aktarım API'si, tarayıcı
  veya sağlayıcı, doğrulama ölçütü anlamlı hâle gelmeden önce başarısız oldu.

Yalnızca adaya yönelik tarayıcı kanıtı, adayın taklit Gateway ve görünür UI
doğrulamalarını geçip geçmediğini bildirir; temel çizginin yeniden üretildiğini
iddia etmez.

## Senaryo ekleme

Canlı aktarım senaryoları, bağımsız bir bildirimsel dosya biçimi olarak değil,
aktarım başına TypeScript ile tanımlanır (Discord öncesi/sonrası biçimi için
`extensions/qa-lab/src/mantis/run.runtime.ts` içindeki `MANTIS_SCENARIO_CONFIGS` öğesine bakın).
Her senaryo şunları gerektirir: kimlik ve başlık, aktarım, gerekli kimlik bilgileri,
temel çizgi ref ilkesi, aday ref ilkesi, OpenClaw yapılandırma yaması, kurulum/uyarıcı
adımları, beklenen temel çizgi ve aday doğrulama ölçütü, görsel yakalama hedefleri,
zaman aşımı bütçesi ve temizleme adımları.

Odaklanmış, yalnızca adaya yönelik tarayıcı kanıtı özel bir belirlenimsel E2E testi
ve iş akışı kullanabilir. Kapsamını açık tutun, yürütmeden önce aday ref'ini doğrulayın,
gizli bilgi destekli yayınlamayı yalıtın ve aynı kanıt bildirimi sözleşmesini yayınlayın.

Görüntü kontrolleri yerine küçük, türü belirlenmiş doğrulama ölçütlerini tercih edin:
Discord tepki durumu veya mesaj referansları, Slack ileti dizisi `ts`/tepki API'si
durumu, e-posta mesaj kimlikleri ve üstbilgileri. UI tek güvenilir gözlemlenebilir
unsur olduğunda tarayıcı ekran görüntülerini kullanın ve mevcut olduğu durumlarda
görüntü kontrollerini platform API'si doğrulama ölçütüne ek olarak tutun.

Discord, Slack ve Telegram'ın ardından aynı çalıştırıcı biçimi WhatsApp
(QR ile oturum açma, yeniden tanımlama, teslimat, medya, tepkiler) ve Matrix'e
(şifrelenmiş odalar, ileti dizisi/yanıt ilişkileri, yeniden başlatma sonrası sürdürme)
genişletilebilir; ikisi de henüz uygulanmamıştır.

## Açık sorular

- Mevcut Mantis botu yeniden kullanıldığında hangi Discord botu sürücü, hangisi SUT olmalıdır?
- GitHub, PR'lere ait Mantis yapıtlarını ne kadar süreyle saklamalıdır?
- ClawSweeper, bakım sorumlusunun komutunu beklemek yerine ne zaman otomatik olarak bir Mantis senaryosu önermelidir?
- Herkese açık PR'lere yüklenmeden önce ekran görüntülerindeki hassas bilgiler gizlenmeli veya görüntüler kırpılmalı mıdır?

---
read_when:
    - OpenClaw hataları için canlı görsel kalite güvencesi oluşturma veya çalıştırma
    - Bir pull request için önce ve sonra doğrulaması ekleme
    - Discord, Slack, WhatsApp veya diğer canlı aktarım senaryolarını ekleme
    - Bir aday referans için odaklı Control UI tarayıcı kanıtı çalıştırılıyor
    - Ekran görüntüleri, tarayıcı otomasyonu veya VNC erişimi gerektiren QA çalıştırmalarında hata ayıklama
summary: Mantis, canlı aktarım karşılaştırmaları ve yalnızca aday sürüme odaklanan tarayıcı kanıtları için görsel uçtan uca kanıt toplar, ardından yapıtları PR'lara ekler.
title: Mantis
x-i18n:
    generated_at: "2026-07-12T11:38:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis, OpenClaw davranışı için görsel CI kanıtı ve bir PR yorumu yayımlar.
Canlı aktarım senaryoları, hatalı olduğu bilinen bir temel sürümü aday bir ref ile karşılaştırır;
odaklı tarayıcı hatları ise bunun yerine tek bir adayın deterministik,
taklit edilmiş bir aktarım karşısında doğruluğunu kanıtlayabilir. Discord; gerçek bot kimlik doğrulaması, sunucu kanalları,
tepkiler, ileti dizileri ve bir tarayıcı tanığıyla ilk kullanıma sunulan aktarım oldu. Slack, Telegram ve odaklı Control
UI sohbet hatları da mevcuttur; WhatsApp ve Matrix henüz uygulanmamıştır.

## Sahiplik

- OpenClaw (`extensions/qa-lab/src/mantis/*`): senaryo çalışma zamanı, `pnpm openclaw qa mantis <command>` CLI'si, kanıt şeması.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): canlı aktarım test düzeneği, sürücü/SUT botları, rapor/kanıt yazıcıları.
- Crabbox (`openclaw/crabbox`): hazırlanmış Linux makineleri, kiralamalar, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): uzak giriş noktaları, yapıt saklama.
- ClawSweeper: bakımcı PR komutlarını ayrıştırır, iş akışlarını yönlendirir ve son PR yorumunu gönderir.

## CLI komutları

Tüm komutlar `extensions/qa-lab/src/mantis/cli.ts` içinde tanımlanan
`pnpm openclaw qa mantis <command>` biçimindedir. Derleme/çalıştırma sırasında `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
gerektirir (paketlenmiş iş akışları derlemeden önce `OPENCLAW_BUILD_PRIVATE_QA=1` ve
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` ayarlar).

| Komut                           | Amaç                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Mantis Discord botunun sunucuyu/kanalı görebildiğini, gönderi yayımlayabildiğini ve tepki verebildiğini doğrular.                                         |
| `run`                           | Temel ve aday ref'lere karşı bir öncesi/sonrası senaryosu çalıştırır (yalnızca Discord).                                                                   |
| `desktop-browser-smoke`         | Bir Crabbox masaüstü kiralar/yeniden kullanır, görünür bir tarayıcı açar, ekran görüntüsü ve video yakalar.                                                |
| `slack-desktop-smoke`           | Bir Crabbox masaüstü kiralar/yeniden kullanır, içinde Slack QA'yı çalıştırır, Slack Web'i açar ve kanıt yakalar.                                           |
| `telegram-desktop-builder`      | Bir Crabbox masaüstü kiralar/yeniden kullanır, Telegram Desktop'ı kurar ve isteğe bağlı olarak bir OpenClaw gateway'i yapılandırır.                        |
| `visual-task` / `visual-driver` | İsteğe bağlı görüntü anlama doğrulamalarıyla genel Crabbox masaüstü yakalama işlemi; `visual-driver`, `crabbox record --while` altında başlatılan sürücü yarısıdır. |

Her komut `--repo-root <path>` ve `--output-dir <path>` seçeneklerini kabul eder; Crabbox
komutları ayrıca `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` ve `--keep-lease` seçeneklerini kabul eder. Sağlayıcı/sınıf için yerel CLI varsayılanları,
aksi belirtilmedikçe `hetzner`/`beast` değerleridir; CI iş akışları
genellikle her ikisini de geçersiz kılar.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Bot kullanıcısını, sunucuyu, sunucunun kanallarını ve hedef kanalı almak için Discord REST API'sini
(`https://discord.com/api/v10`) çağırır; kanalın sunucuya ait olduğunu doğrular ve ardından
(`--skip-post` kullanılmadığı sürece) bir mesaj gönderip `👀` tepkisi ekler.
`mantis-discord-smoke-summary.json` ve `mantis-discord-smoke-report.md` dosyalarını yazar.

Token çözümleme sırası: `--token-file` değeri, ardından `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(`--token-env` ile geçersiz kılınabilir), ardından `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
tarafından adlandırılan dosya (`--token-file-env` ile geçersiz kılınabilir). Sunucu/kanal kimlikleri
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` değişkenlerinden gelir
(`--guild-id` / `--channel-id` ile geçersiz kılınabilir) ve 17-20 basamaklı Discord snowflake değerleri olmalıdır.
Yayımlanan özet ve raporda bot/sunucu/kanal/mesaj kimliklerini
ve adlarını `<redacted>` ile değiştirmek için `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ayarlayın.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` şu anda yalnızca `discord` kabul eder. `--scenario`, her biri kendi
varsayılan temel ref'ine ve beklenen öncesi/sonrası etiketlerine sahip iki yerleşik kimlikten biridir
(`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Senaryo                                    | Varsayılan temel                           | Temelden beklenen                         | Adaydan beklenen             |
| ------------------------------------------ | ------------------------------------------ | ----------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                             | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | ileti dizisi yanıtı `filePath` ekini içermez | ileti dizisi yanıtı eki içerir |

`--candidate` varsayılan olarak `HEAD` kullanır. Diğer seçenekler: `--credential-source`
(varsayılan `convex`), `--credential-role` (varsayılan `ci`), `--provider-mode`
(varsayılan `live-frontier`), `--fast` (varsayılan olarak açık), `--skip-install`, `--skip-build`.

Çalıştırıcı, temel ve aday için `<output-dir>/worktrees/` altında ayrık `git worktree`
çalışma kopyaları oluşturur, her birinde `pnpm install`/`pnpm build` çalıştırır
(atlanmadığı sürece) ve ardından her çalışma ağacında
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
çalıştırır. Her hat, `discord-qa-reaction-timelines.json` ile birlikte bir
`<scenario-id>-timeline.html`/`.png` çifti yazar; çalıştırıcı bu kanıtı
`baseline/`/`candidate/` altına geri kopyalar, çıktı dizinine `comparison.json`,
`mantis-report.md` ve `mantis-evidence.json` yazar ve karşılaştırma başarılı olmadıysa
(temel `fail`, aday `pass`) sıfırdan farklı bir kodla çıkar.

İkinci Discord senaryosu (`discord-thread-reply-filepath-attachment`), sürücü botuyla
bir üst mesaj gönderir, gerçek bir ileti dizisi oluşturur, depo içindeki bir `filePath` ile SUT'nin
`message.thread-reply` eylemini çağırır ve ardından yanıt ile ek dosya adı için
ileti dizisini yoklar. `mantis-thread-report.md` adlı bir ek bekler.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Bir Crabbox masaüstü kiralar veya yeniden kullanır, VNC oturumu içinde `--browser-url`
(varsayılan `https://openclaw.ai`) adresine ya da işlenmiş bir `--html-file` dosyasına yönlendirilmiş
bir tarayıcı başlatır, bekler, `scrot` ile ekran görüntüsü alır, isteğe bağlı olarak
`ffmpeg` ile bir MP4 kaydeder ve `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
dosyalarını `--output-dir` konumuna rsync ile geri aktarır.

Seçenekler:

- `--lease-id <cbx_...>`, yeni bir masaüstü oluşturmak yerine hazırlanmış bir masaüstünü yeniden kullanır.
- `--browser-profile-dir <remote-path>`, kalıcı masaüstünün çalıştırmalar arasında oturumunu açık tutması için uzak bir Chrome kullanıcı verisi dizinini yeniden kullanır (uzun ömürlü bir Discord Web görüntüleyici profili için kullanılır).
- `--browser-profile-archive-env <name>`, başlatmadan önce bu ortam değişkeninden base64 kodlu bir `.tgz` Chrome profil arşivini geri yükler (varsayılan `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); Discord Web gibi oturum açılmış tanıklar için kullanılır.
- `--video-duration <seconds>`, MP4 yakalama süresini denetler (varsayılan 10 sn).
- `--keep-lease` (veya `OPENCLAW_MANTIS_KEEP_VM=1`), bu çalıştırmanın oluşturduğu kiralamayı VNC incelemesi için açık tutar; kiralama oluşturan başarısız çalıştırmalar da varsayılan olarak kiralamayı açık tutar.

Discord Web kanıtı için Mantis, bot tokenı değil, özel bir görüntüleyici hesabı kullanır.
Discord REST doğrulama kaynağı (`qa discord` üzerinden) yetkili kaynak olmaya devam eder;
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` ayarlandığında senaryo ayrıca bir
Discord Web URL yapıtı yazar ve `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`, tarayıcının
ileti dizisini açabilmesine yetecek kadar uzun süre açık bırakır.

GitHub iş akışı, `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` aracılığıyla
kalıcı bir görüntüleyici profilini tercih eder (tam profil arşivleri GitHub'ın gizli değer boyutu sınırını aşabilir);
küçük/önyükleme profilleri için bunun yerine `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`
değişkeninden base64 kodlu bir `.tgz` geri yükleyebilir. İki kaynak da yapılandırılmamışsa
iş akışı yine de deterministik temel/aday ekran görüntülerini yayımlar ve oturum açılmış
tanığın atlandığını günlüğe kaydeder.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Bir Crabbox masaüstü kiralar veya yeniden kullanır, çalışma kopyasını sanal makineye eşitler,
içinde `pnpm openclaw qa slack` çalıştırır, VNC tarayıcısında Slack Web'i açar,
masaüstünü yakalar ve hem Slack QA yapıtlarını (`slack-qa/`) hem de
VNC ekran görüntüsünü/videosunu yerel ortama geri kopyalar. Bu, SUT gateway'i ile
tarayıcının aynı sanal makine içinde çalıştığı tek Mantis biçimidir.

`--gateway-setup` ile komut, sanal makinede `$HOME/.openclaw-mantis/slack-openclaw`
konumunda kalıcı ve atılabilir bir OpenClaw ana dizini oluşturur, hedef kanal için Slack
Socket Mode yapılandırmasını yamalar,
`openclaw gateway run --dev --allow-unconfigured --port 38973` başlatır ve
Chrome'u VNC oturumunda çalışır durumda bırakır; `--gateway-setup` seçeneğinin kullanılmaması
bunun yerine normal bottan bota Slack QA hattını çalıştırır.

`--credential-source env` için gerekli ortam değişkenleri (yerel varsayılan `env`;
rol varsayılanı `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- Uzak model hattı için `OPENCLAW_LIVE_OPENAI_KEY` (yerel olarak yalnızca `OPENAI_API_KEY`
  ayarlıysa Mantis, Crabbox'ı çağırmadan önce bunu `OPENCLAW_LIVE_OPENAI_KEY` değişkenine
  kopyalar)

`--credential-source convex` ile Mantis, sanal makineyi oluşturmadan önce paylaşılan
havuzdan Slack SUT kimlik bilgisini kiralar ve kanal kimliğini, uygulama tokenını ve
bot tokenını `OPENCLAW_MANTIS_SLACK_*` ortam değişkenleri olarak sanal makineye aktarır;
böylece GitHub iş akışları ham Slack tokenları yerine yalnızca Convex aracı gizli değerine ihtiyaç duyar.

Diğer seçenekler: `--slack-url <url>` belirli bir URL'yi açar (aksi takdirde Mantis,
`auth.test` sonucundan `https://app.slack.com/client/<team>/<channel>` türetir);
`--slack-channel-id <id>` gateway izin listesindeki kanalı ayarlar;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR`, sanal makine içindeki kalıcı Chrome
profilini denetler (varsayılan `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints`, yerel Slack onay senaryolarını
(`slack-approval-exec-native`, `slack-approval-plugin-native`) çalıştırır ve
gateway kurulumu yerine bekleyen/çözümlenmiş kontrol noktası ekran görüntülerini işler
(`--gateway-setup` ile birlikte kullanılamaz); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` ve `--fast` seçenekleri Slack canlı hattına aktarılır.

Onay kontrol noktası ekran görüntüleri, canlı Slack UI'dan değil, senaryonun gözlemlediği
Slack API mesajından işlenir; `slack-desktop-smoke.png`, yalnızca kiralamanın tarayıcı
profilinde önceden oturum açılmışsa Slack Web'in kendisine ilişkin kanıttır.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Bir Crabbox masaüstü kiralar veya mevcut kiralamayı yeniden kullanır, yerel Linux Telegram Desktop'ı kurar,
isteğe bağlı olarak bir kullanıcı oturumu arşivini geri yükler, OpenClaw'ı
kiralanan Telegram SUT bot belirteciyle yapılandırır,
`openclaw gateway run --dev --allow-unconfigured --port 38974` komutunu başlatır, kiralanan özel gruba
sürücü botunun hazır olduğunu bildiren bir mesaj gönderir, ardından ekran görüntüsü ve MP4 kaydeder. Bot belirteci yalnızca OpenClaw'ı yapılandırır; Telegram Desktop'ta
asla oturum açmaz. Masaüstü görüntüleyicisi, `--telegram-profile-archive-env <name>` ile
geri yüklenen veya VNC üzerinden elle oturum açılıp `--keep-lease` ile etkin tutulan
ayrı bir Telegram kullanıcı oturumudur.

Bayraklar: `--lease-id <cbx_...>`, Telegram Desktop'ta zaten oturum açılmış
bir VM üzerinde yeniden çalıştırır; `--telegram-profile-archive-env <name>`, başlatmadan önce base64 kodlu
bir `.tgz` profil arşivini geri yükler; `--telegram-profile-dir <remote-path>`,
uzak profil dizinini ayarlar (varsayılan `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup`, yalnızca Telegram Desktop'ı kurup açar;
`--credential-source`/`--credential-role` varsayılan olarak `convex`/`maintainer` değerlerini kullanır.

## Kanıt manifestosu

Bir PR'de yayımlanan her senaryo, raporunun yanına `mantis-evidence.json`
yazar:

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

Yapıt `path` değeri manifestonun dizinine göre; `targetPath` ise
yapılandırılmış R2/S3 yapıt önekine göre belirlenir. `scripts/mantis/publish-pr-evidence.mjs`,
dizin geçişini reddeder ve dosya eksik olduğunda `"required": false` içeren
girdileri atlar.

Yapıt türleri: `timeline` (belirlenimci önce/sonra ekran görüntüsü),
`desktopScreenshot` (VNC/tarayıcı ekran görüntüsü), `motionPreview` (kayıttan
satır içinde gösterilen hareketli GIF), `motionClip` (hareket bölümleri ayıklanmış MP4), `fullVideo` (tam
kayıt), `metadata` (JSON/günlük yardımcı dosyası), `report` (Markdown raporu).

Bir çalıştırmanın diskteki yapıt düzeni:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Ekran görüntüleri kanıttır, gizli bilgi değildir; ancak yine de karartma disiplini
gerektirir: özel kanal adları, kullanıcı adları veya mesaj içeriği görünebilir. Herkese açık
yapıt yüklemeleri için `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ayarlayın; bu,
Discord/Slack/Telegram GitHub iş akışlarında varsayılan olarak etkindir.

## GitHub otomasyonu

`scripts/mantis/publish-pr-evidence.mjs`, yeniden kullanılabilir yayımlayıcıdır. İş akışları
onu manifest, hedef PR, yapıt hedef kökü, yorum işaretçisi,
yapıt URL'si, çalıştırma URL'si ve istek kaynağıyla çağırır. Bildirilen yapıtları
Mantis R2 kovasına yükler, satır içi görseller/önizlemeler ve bağlantılı videolar içeren,
özeti önce sunan bir PR yorumu oluşturur ve ardından mevcut işaretçi yorumunu
günceller veya yeni bir yorum oluşturur. Gerekli ortam değişkenleri:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (iş akışları `openclaw-crabbox-artifacts` olarak ayarlar)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (iş akışları `auto` olarak ayarlar)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (iş akışları `https://artifacts.openclaw.ai` olarak ayarlar)

Yorumlar, `github-actions[bot]` yerine Mantis GitHub App (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`) üzerinden, güncelleme veya ekleme anahtarı olarak gizli
bir işaretçi yorumu kullanılarak gönderilir.

| İş akışı                         | Tetikleyici                                                                                 | Yaptığı işlem                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | elle çalıştırma                                                                             | Seçilen bir ref üzerinde `discord-smoke` çalıştırır.                                                                                                                                                                                                                                                                     |
| `Mantis Discord Status Reactions` | PR yorumu veya elle çalıştırma                                                              | Ayrı temel sürüm/adayı çalışma ağaçları oluşturur, her birinde `discord-status-reactions-tool-only` çalıştırır, her kulvarın zaman çizelgesini Crabbox masaüstü tarayıcısında işler, `crabbox media preview` ile hareket bölümleri ayıklanmış GIF/MP4 önizlemeleri oluşturur, yapıtları yükler ve satır içi PR kanıtı gönderir. |
| `Mantis Scenario`                 | elle çalıştırma                                                                             | Genel dağıtıcı: `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` değerlerini alır ve eşleşen senaryo iş akışına iletir.              |
| `Mantis Slack Desktop Smoke`      | elle çalıştırma                                                                             | Bir Crabbox Linux masaüstü kiralar (varsayılan `aws`, `hetzner` seçeneğiyle), aday üzerinde `slack-desktop-smoke --gateway-setup` çalıştırır, masaüstünü kaydeder, hareketli bir önizleme oluşturur, yapıtları yükler ve PR numarası verilmişse PR kanıtı gönderir.                                                           |
| `Mantis Telegram Live`            | PR yorumu veya elle çalıştırma                                                              | Bot API'si Telegram canlı QA kulvarını (`openclaw qa telegram`) çalıştırır, QA özetinden `mantis-evidence.json` yazar, karartılmış kanıt HTML'sini Crabbox masaüstü tarayıcısı üzerinden işler, hareketli GIF oluşturur ve PR kanıtı gönderir. Bu kulvar için Telegram Web oturumu açılması gerekmez.                       |
| `Mantis Telegram Desktop Proof`   | bakımcı PR etiketi (`mantis: telegram-visible-proof`) ve PR yorumu veya elle çalıştırma      | Aracı tabanlı yerel Telegram Desktop önce/sonra kanıtı. PR'yi, temel sürüm/adayı ref'lerini ve bakımcı talimatlarını Codex'e aktarır; Codex her iki ref için gerçek kullanıcı Crabbox Telegram Desktop kanıt kulvarını çalıştırır ve 2 sütunlu bir PR kanıt tablosu gönderir.                                                   |
| `Mantis Web UI Chat Proof`        | PR yorumu veya elle çalıştırma                                                              | Odaklanmış OpenClaw Control UI sohbet Playwright kanıtını aday üzerinde çalıştırır, tarayıcının taklit Gateway üzerinden gönderim yaptığını doğrular, ekran görüntüsü/video yapıtlarını kaydeder ve PR kanıtı gönderir. Bu kulvar yalnızca web sohbeti kanıtıdır; WinUI/yerel uygulama veya rastgele görsel kanıt değildir. |

`Mantis Discord Status Reactions` ve `Mantis Telegram Live`, hem
`baseline_ref`/`candidate_ref` değerlerini (veya PR yorumunda `baseline=`/`candidate=` değerlerini)
kabul eder hem de gizli bilgi içeren kimlik bilgileriyle çalıştırmadan önce çözümlenen SHA'nın
`origin/main` dalının bir atası, bir sürüm etiketi (`v*`) veya açık bir PR'nin başı
olduğunu doğrular.

Yazma/bakım/yönetici erişimi olan bir PR'den yorum tetikleyicileri:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram yorum tetikleyicileri varsayılan olarak aday için PR baş SHA'sını,
senaryo için `telegram-status-command` değerini kullanır; belirli bir Crabbox sağlayıcısını veya önceden
hazırlanmış bir masaüstünü hedeflemek için `provider=aws|hetzner` ve
`lease=<cbx_...>` değerlerini kabul eder. `Mantis Telegram Desktop Proof`, yalnızca
PR zaten `mantis: telegram-visible-proof` etiketini taşıyorsa PR yorumuna yanıt verir.

Web UI sohbet yorum tetikleyicileri varsayılan olarak aday için PR baş SHA'sını kullanır. Control UI
taklit Gateway sohbet kanıtını çalıştırıp tarayıcı yapıtlarını yayımlarlar; diğer web sayfaları ve
yerel uygulama yüzeyleri için normal Playwright/tarayıcı kanıtı, bakımcı ekran görüntüleri,
Crabbox veya yerel yapıtları kullanın.

ClawSweeper ayrıca bir senaryoyu doğrudan çalıştırabilir:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Makineler ve gizli bilgiler

Yerel CLI Crabbox varsayılanları `--provider hetzner --class beast` şeklindedir;
`--provider`, `--class`/`--machine-class` veya
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` ile geçersiz kılın.
GitHub iş akışları genellikle ikisini de geçersiz kılar (örneğin `--class standard` ve
Slack iş akışının `aws`/`hetzner` sağlayıcı seçim girdisi). Bir sağlayıcı çok
yavaşsa veya kullanılamıyorsa sabit kodlanmış bir geri dönüş eklemek yerine
aynı Crabbox arayüzünün arkasına ekleyin.

VM temel gereksinimleri: masaüstü destekli Chrome/Chromium, CDP erişimi, VNC/
noVNC, Node 22+ ve pnpm, bir OpenClaw çalışma kopyası ve hedef
taşıma sistemi, GitHub, model sağlayıcıları ve kimlik bilgisi aracısına giden erişime sahip Linux.

Mantis iş akışlarında kullanılan gizli bilgi adları:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- Herkese açık yapıt yüklemeleri için `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (iş akışları ayrıca
  geri dönüş olarak `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` değerlerini kabul eder ve
  Crabbox'ı çağırmadan önce bunları sade adlarla eşler)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis çalıştırıcısı Discord/Slack/Telegram bot belirteçlerini,
sağlayıcı API anahtarlarını, tarayıcı çerezlerini, kimlik doğrulama profili içeriklerini, VNC parolalarını veya
ham kimlik bilgisi yüklerini asla yazdırmamalıdır. Bir belirteç bir soruna, PR'ye, sohbete veya günlüğe
sızarsa yeni gizli bilgi kaydedildikten sonra belirteci yenileyin.

## Çalıştırma sonuçları

Önce/sonra taşıma senaryoları, kararsız bir ortamın ürün gerilemesi olarak
algılanmaması için şu sonuçları ayırt eder:

- **Hata yeniden üretildi**: temel sürüm, senaryonun beklediği biçimde başarısız oldu.
- **Test düzeneği hatası**: ortam kurulumu, kimlik bilgileri, taşıma API'si, tarayıcı
  veya sağlayıcı, ölçüt anlamlı hâle gelmeden önce başarısız oldu.

Yalnızca adaya yönelik tarayıcı kanıtı, adayın taklit Gateway ve görünür UI
doğrulamalarını geçip geçmediğini bildirir; temel sürümde yeniden üretim yapıldığını iddia etmez.

## Senaryo ekleme

Canlı taşıma senaryoları, bağımsız bir bildirimsel dosya biçiminde değil, taşıma sistemi başına
TypeScript ile tanımlanır (Discord önce/sonra biçimi için
`extensions/qa-lab/src/mantis/run.runtime.ts` içindeki `MANTIS_SCENARIO_CONFIGS` bölümüne bakın).
Her senaryo şunları gerektirir: kimlik ve başlık, taşıma sistemi, gerekli kimlik bilgileri, temel sürüm
ref politikası, aday ref politikası, OpenClaw yapılandırma yaması, kurulum/uyaran adımları,
beklenen temel sürüm ve aday ölçütü, görsel yakalama hedefleri, zaman aşımı
bütçesi ve temizleme adımları.

Adaya odaklı tarayıcı kanıtı, özel ve deterministik bir E2E testi ile iş akışı kullanabilir. Kapsamını açıkça belirtin, yürütmeden önce aday referansını doğrulayın, gizli bilgilerle desteklenen yayımlama sürecini yalıtın ve aynı kanıt manifestosu sözleşmesini oluşturun.

Görsel denetimler yerine küçük, tür belirtilmiş doğrulama ölçütlerini tercih edin: Discord tepki durumu veya mesaj referansları, Slack ileti dizisi `ts`/tepki API'si durumu, e-posta ileti kimlikleri ve üstbilgileri. Kullanıcı arayüzü güvenilir şekilde gözlemlenebilen tek unsur olduğunda tarayıcı ekran görüntülerini kullanın ve mevcut olduğu durumlarda görsel denetimleri platform API'si doğrulama ölçütüne ek olarak uygulayın.

Discord, Slack ve Telegram'dan sonra aynı çalıştırıcı yapısı WhatsApp'a (QR ile oturum açma, yeniden tanımlama, teslimat, medya, tepkiler) ve Matrix'e (şifreli odalar, ileti dizisi/yanıt ilişkileri, yeniden başlatmanın ardından sürdürme) genişletilebilir; henüz ikisi de uygulanmamıştır.

## Açık sorular

- Mevcut Mantis botu yeniden kullanıldığında hangi Discord botu sürücü, hangisi test edilen sistem (SUT) olmalıdır?
- GitHub, PR'lere ait Mantis yapılarını ne kadar süre saklamalıdır?
- ClawSweeper, bakım sorumlusu komutunu beklemek yerine ne zaman otomatik olarak bir Mantis senaryosu önermelidir?
- Herkese açık PR'ler için ekran görüntüleri yüklenmeden önce sansürlenmeli veya kırpılmalı mıdır?

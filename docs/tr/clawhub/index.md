---
read_when:
    - ClawHub'ın ne olduğunu açıklama
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin'leri kayıt defterine yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Keşif, kurulum, yayımlama, güvenlik ve clawhub CLI için herkese açık ClawHub genel bakışı.
title: ClawHub
x-i18n:
    generated_at: "2026-07-02T17:44:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills ve Plugin’leri için herkese açık kayıt deposudur.

- Skills aramak, yüklemek ve güncellemek ve ClawHub’dan Plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt deposu kimlik doğrulaması, yayınlama ve silme/silmeyi geri alma iş akışları için ayrı `clawhub` CLI’ını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile Skills arayın ve yükleyin:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw ile Plugin’leri arayın ve yükleyin:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayınlama veya silme/silmeyi geri alma gibi kayıt deposu kimliği doğrulanmış iş akışları istediğinizde ClawHub CLI’ını yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub ne barındırır

| Yüzey          | Ne depolar                                                        | Tipik komut                                  |
| -------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| Skills         | `SKILL.md` ve destekleyici dosyalar içeren sürümlü metin paketleri | `openclaw skills install @openclaw/demo`     |
| Kod Plugin’leri | Uyumluluk meta verileri içeren OpenClaw Plugin paketleri          | `openclaw plugins install clawhub:<package>` |
| Paket Plugin’leri | OpenClaw dağıtımı için paketlenmiş Plugin paketleri            | `clawhub package publish <source>`           |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini, dosyaları,
indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Herkese açık sayfalar mevcut kayıt deposu
durumunu gösterir; böylece kullanıcılar bir Skills veya Plugin’i yüklemeden önce inceleyebilir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükleme yapar ve kaynak
meta verilerini kalıcı olarak saklar; böylece sonraki güncelleme komutları ClawHub üzerinde kalabilir.

Bir Plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde `clawhub:<package>` kullanın.
Yalın npm güvenli Plugin belirtimleri lansman geçişleri sırasında npm üzerinden çözümlenebilir ve
bir kaynağın açık olması gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce duyurulan `pluginApi` ve `minGatewayVersion`
uyumluluğunu doğrular. Bir paket sürümü ClawPack yapıtı yayınladığında, OpenClaw tam olarak yüklenen npm-pack `.tgz` dosyasını tercih eder, ClawHub özet üst bilgisini ve indirilen baytları doğrular ve sonraki güncellemeler için yapıt meta verilerini kaydeder.

## ClawHub CLI

ClawHub CLI, kayıt deposu kimliği doğrulanmış işler içindir:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

CLI ayrıca doğrudan kayıt deposu iş akışları için Skills yükleme/güncelleme komutlarına sahiptir:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Bu komutlar Skills’i geçerli çalışma dizininin altındaki `./skills` içine yükler
ve yüklü sürümleri `.clawhub/lock.json` içinde kaydeder.

## Yayınlama

Skills’i `SKILL.md` içeren yerel bir klasörden yayınlayın:

```bash
clawhub skill publish <path>
```

Yaygın yayınlama seçenekleri:

- `--slug <slug>`: yayınlanan Skills URL adı.
- `--name <name>`: görünen ad.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: değişiklik günlüğü metni.
- `--tags <tags>`: virgülle ayrılmış etiketler; varsayılan olarak `latest`.

Plugin’leri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub
URL’sinden yayınlayın:

```bash
clawhub package publish <source>
```

Tam yayınlama planını yükleme yapmadan oluşturmak için `--dry-run` ve CI dostu çıktı
için `--json` kullanın.

Kod Plugin’leri, `package.json` içinde gerekli OpenClaw uyumluluk meta verilerini içermelidir;
bunlara `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahildir.
Tam komut başvurusu için [CLI](/tr/clawhub/cli) ve Skills meta verileri için [Skills formatı](/clawhub/skill-format) bölümüne bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayınlama için yükleme kapısını geçecek kadar eski bir GitHub hesabı gerekir. Herkese açık ayrıntı sayfaları, yükleme veya indirme öncesinde en son tarama durumunu özetler.

ClawHub, yayınlanan Skills ve Plugin sürümlerinde otomatik kontroller çalıştırır. Tarama nedeniyle bekletilen
veya engellenen sürümler, sahibi için `/dashboard` içinde görünür kalırken herkese açık katalog ve yükleme yüzeylerinden kaybolabilir.

Oturum açmış kullanıcılar Skills ve paketleri bildirebilir. Moderatörler bildirimleri inceleyebilir,
içeriği gizleyebilir veya geri yükleyebilir ve kötüye kullanım yapan hesapları yasaklayabilir. Politika ve yaptırım ayrıntıları için
[Güvenlik](/tr/clawhub/security),
[Güvenlik denetimleri](/clawhub/security-audits),
[Moderasyon ve hesap güvenliği](/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage) bölümlerine bakın.

## Telemetri ve ortam

Oturum açmışken `clawhub install` çalıştırdığınızda CLI, ClawHub’ın toplam yükleme sayılarını hesaplayabilmesi için en iyi çaba esaslı bir yükleme olayı gönderebilir. Bunu şu şekilde devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Kullanışlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                                 |
| ----------------------------- | ---------------------------------------------------- |
| `CLAWHUB_SITE`                | Tarayıcı oturum açma için kullanılan site URL’sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`            | Kayıt deposu API URL’sini geçersiz kılar.            |
| `CLAWHUB_CONFIG_PATH`         | CLI’ın belirteç/yapılandırma durumunu depoladığı yeri geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılar.          |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Yükleme telemetrisini devre dışı bırakır.            |

Daha ayrıntılı başvuru materyali için [Telemetri](/clawhub/telemetry), [HTTP API](/clawhub/http-api) ve
[Sorun giderme](/tr/clawhub/troubleshooting) bölümlerine bakın.

---
read_when:
    - ClawHub'ın ne olduğunu açıklama
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Pluginleri kayıt defterine yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Herkese açık ClawHub keşif, kurulum, yayımlama, güvenlik ve clawhub CLI için genel bakış.
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T15:29:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills ve Plugin'leri için herkese açık kayıt deposudur.

- Skills aramak, yüklemek ve güncellemek, ayrıca ClawHub'dan Plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt deposu kimlik doğrulaması, yayımlama ve silme/silmeyi geri alma iş akışları için ayrı `clawhub` CLI'sini kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile Skills arayın ve yükleyin:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw ile Plugin'leri arayın ve yükleyin:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayımlama veya silme/silmeyi geri alma gibi kayıt deposu kimliği doğrulanmış iş akışları istediğinizde ClawHub CLI'sini yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey          | Sakladıkları                                                | Tipik komut                                  |
| -------------- | ----------------------------------------------------------- | -------------------------------------------- |
| Skills         | `SKILL.md` ve destek dosyalarıyla sürümlenmiş metin paketleri | `openclaw skills install @openclaw/demo`     |
| Kod Plugin'leri | Uyumluluk meta verileriyle OpenClaw Plugin paketleri        | `openclaw plugins install clawhub:<package>` |
| Paket Plugin'leri | OpenClaw dağıtımı için paketlenmiş Plugin paketleri       | `clawhub package publish <source>`           |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini, dosyaları,
indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Herkese açık sayfalar, kullanıcıların
bir Skill'i veya Plugin'i yüklemeden önce inceleyebilmesi için mevcut kayıt deposu
durumunu gösterir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükler ve daha sonraki güncelleme
komutlarının ClawHub üzerinde kalabilmesi için kaynak meta verilerini kalıcı hale getirir.

Bir Plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde `clawhub:<package>` kullanın.
Çıplak npm uyumlu Plugin belirtimleri, başlatma geçişleri sırasında npm üzerinden çözümlenebilir ve
bir kaynağın açıkça belirtilmesi gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce bildirilen `pluginApi` ve `minGatewayVersion`
uyumluluğunu doğrular. Bir paket sürümü ClawPack yapıtı yayımladığında, OpenClaw tam olarak yüklenen
npm-pack `.tgz` dosyasını tercih eder, ClawHub özet başlığını ve indirilen baytları doğrular ve
daha sonraki güncellemeler için yapıt meta verilerini kaydeder.

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

CLI ayrıca doğrudan kayıt deposu iş akışları için Skill yükleme/güncelleme komutlarına sahiptir:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Bu komutlar Skills'i geçerli çalışma dizininin altındaki `./skills` içine yükler
ve yüklü sürümleri `.clawhub/lock.json` dosyasına kaydeder.

## Yayımlama

Skills'i `SKILL.md` içeren yerel bir klasörden yayımlayın:

```bash
clawhub skill publish <path>
```

Yaygın yayımlama seçenekleri:

- `--slug <slug>`: yayımlanan Skill URL adı.
- `--name <name>`: görüntüleme adı.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: değişiklik günlüğü metni.
- `--tags <tags>`: virgülle ayrılmış etiketler; varsayılan olarak `latest`.

Plugin'leri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub
URL'sinden yayımlayın:

```bash
clawhub package publish <source>
```

Yükleme yapmadan tam yayımlama planını oluşturmak için `--dry-run`, CI dostu çıktı
için `--json` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk meta verilerini
içermelidir. Tam komut referansı için [CLI](/tr/clawhub/cli), Skill meta verileri için
[Skill formatı](/clawhub/skill-format) sayfasına bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama, yükleme geçidini
geçecek kadar eski bir GitHub hesabı gerektirir. Herkese açık ayrıntı sayfaları, yükleme veya indirme
öncesinde en son tarama durumunu özetler.

ClawHub yayımlanan Skills ve Plugin sürümlerinde otomatik kontroller çalıştırır. Tarama tarafından
bekletilen veya engellenen sürümler, sahibine `/dashboard` içinde görünür kalırken herkese açık
katalogdan ve yükleme yüzeylerinden kaybolabilir.

Oturum açmış kullanıcılar Skills ve paketleri bildirebilir. Moderatörler bildirimleri inceleyebilir,
içeriği gizleyebilir veya geri yükleyebilir ve kötüye kullanım yapan hesapları yasaklayabilir. İlke
ve yaptırım ayrıntıları için [Güvenlik](/tr/clawhub/security),
[Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) sayfalarına bakın.

## Telemetri ve ortam

Oturum açmışken `clawhub install` çalıştırdığınızda CLI, ClawHub'ın toplu yükleme sayılarını
hesaplayabilmesi için en iyi çabayla bir yükleme olayı gönderebilir. Bunu şununla devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Kullanışlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                               |
| ----------------------------- | -------------------------------------------------- |
| `CLAWHUB_SITE`                | Tarayıcı girişinde kullanılan site URL'sini geçersiz kılın. |
| `CLAWHUB_REGISTRY`            | Kayıt deposu API URL'sini geçersiz kılın.          |
| `CLAWHUB_CONFIG_PATH`         | CLI'nin belirteç/yapılandırma durumunu sakladığı yeri geçersiz kılın. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılın.        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Yükleme telemetrisini devre dışı bırakın.          |

Daha derin başvuru materyali için [Telemetri](/clawhub/telemetry), [HTTP API](/clawhub/http-api) ve
[Sorun giderme](/tr/clawhub/troubleshooting) sayfalarına bakın.

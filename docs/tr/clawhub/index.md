---
read_when:
    - ClawHub'ın ne olduğunu açıklama
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin'leri kayıt defterine yayımlama
    - openclaw ve ClawHub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Keşif, kurulum, yayımlama, güvenlik ve clawhub CLI için herkese açık ClawHub genel bakışı.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T10:57:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills ve Plugin'leri için herkese açık kayıt defteridir.

- Skills aramak, yüklemek ve güncellemek ve ClawHub'dan Plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt defteri kimlik doğrulaması, yayımlama ve silme/silmeyi geri alma iş akışları için ayrı `clawhub` CLI'ını kullanın.

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

Yayımlama veya silme/silmeyi geri alma gibi kayıt defteri kimlik doğrulamalı
iş akışları istediğinizde ClawHub CLI'ını yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey         | Ne saklar                                                    | Tipik komut                                  |
| ------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills        | `SKILL.md` ve destekleyici dosyalar içeren sürümlü metin paketleri | `openclaw skills install @openclaw/demo`     |
| Kod Plugin'leri | Uyumluluk meta verileri içeren OpenClaw Plugin paketleri     | `openclaw plugins install clawhub:<package>` |
| Paket Plugin'leri | OpenClaw dağıtımı için paketlenmiş Plugin paketleri          | `clawhub package publish <source>`           |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini,
dosyaları, indirmeleri, yıldızları ve güvenlik taraması özetlerini izler.
Herkese açık sayfalar mevcut kayıt defteri durumunu gösterir; böylece kullanıcılar
yüklemeden önce bir Skill veya Plugin'i inceleyebilir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükleme yapar ve kaynak
meta verilerini kalıcı hale getirir; böylece sonraki güncelleme komutları
ClawHub üzerinde kalabilir.

Bir Plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde
`clawhub:<package>` kullanın. Düz npm uyumlu Plugin belirtimleri, başlatma geçişleri
sırasında npm üzerinden çözümlenebilir ve bir kaynağın açıkça belirtilmesi
gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce ilan edilen `pluginApi` ve
`minGatewayVersion` uyumluluğunu doğrular. Bir paket sürümü ClawPack yapıtı
yayımladığında OpenClaw tam olarak yüklenen npm-pack `.tgz` dosyasını tercih eder,
ClawHub özet üst bilgisini ve indirilen baytları doğrular ve sonraki güncellemeler
için yapıt meta verilerini kaydeder.

## ClawHub CLI

ClawHub CLI, kayıt defteri kimlik doğrulamalı işler içindir:

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

CLI ayrıca doğrudan kayıt defteri iş akışları için Skill yükleme/güncelleme
komutlarına sahiptir:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Bu komutlar Skills'i geçerli çalışma dizini altında `./skills` içine yükler ve
yüklü sürümleri `.clawhub/lock.json` içinde kaydeder.

## Yayımlama

Skills'i `SKILL.md` içeren yerel bir klasörden yayımlayın:

```bash
clawhub skill publish <path>
```

Yaygın yayımlama seçenekleri:

- `--slug <slug>`: yayımlanan Skill URL adı.
- `--name <name>`: görünen ad.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: değişiklik günlüğü metni.
- `--tags <tags>`: virgülle ayrılmış etiketler; varsayılanı `latest`.

Plugin'leri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub
URL'sinden yayımlayın:

```bash
clawhub package publish <source>
```

Tam yayımlama planını yükleme yapmadan oluşturmak için `--dry-run`, CI dostu çıktı
için `--json` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk
meta verilerini içermelidir. Tam komut başvurusu için [CLI](/tr/clawhub/cli), Skill
meta verileri için [Skill biçimi](/clawhub/skill-format) sayfasına bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama için
yükleme kapısından geçecek kadar eski bir GitHub hesabı gerekir. Herkese açık
ayrıntı sayfaları, yükleme veya indirme öncesinde en son tarama durumunu özetler.

ClawHub, yayımlanan Skills ve Plugin sürümleri üzerinde otomatik kontroller çalıştırır.
Taramada tutulan veya engellenen sürümler, sahiplerine `/dashboard` içinde görünür
kalmaya devam ederken herkese açık katalogdan ve yükleme yüzeylerinden kaybolabilir.

Oturum açmış kullanıcılar Skills ve paketleri bildirebilir. Moderatörler bildirimleri
inceleyebilir, içeriği gizleyebilir veya geri yükleyebilir ve kötüye kullanan
hesapları yasaklayabilir. Politika ve yaptırım ayrıntıları için
[Güvenlik](/tr/clawhub/security),
[Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) sayfalarına bakın.

## Telemetri ve ortam

Oturum açmışken `clawhub install` çalıştırdığınızda CLI, ClawHub'ın toplu yükleme
sayılarını hesaplayabilmesi için en iyi çabayla bir yükleme olayı gönderebilir.
Bunu şu şekilde devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Yararlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Tarayıcı oturum açması için kullanılan site URL'sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`            | Kayıt defteri API URL'sini geçersiz kılar.        |
| `CLAWHUB_CONFIG_PATH`         | CLI'ın token/yapılandırma durumunu sakladığı yeri geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılar.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Yükleme telemetrisini devre dışı bırakır.         |

Daha ayrıntılı başvuru materyali için [Telemetri](/clawhub/telemetry),
[HTTP API](/clawhub/http-api) ve
[Sorun giderme](/tr/clawhub/troubleshooting) sayfalarına bakın.

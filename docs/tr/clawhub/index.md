---
read_when:
    - ClawHub'ın ne olduğunu açıklama
    - Skills veya plugin arama, yükleme ya da güncelleme
    - Kayıt defterine Skills veya plugin yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Herkese açık ClawHub keşif, kurulum, yayımlama, güvenlik ve clawhub CLI için genel bakışı.
title: ClawHub
x-i18n:
    generated_at: "2026-07-05T08:00:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills ve Plugin'leri için genel kayıt sistemidir.

- ClawHub'da Skills aramak, yüklemek ve güncellemek, ayrıca Plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt kimlik doğrulaması, yayımlama ve silme/silmeyi geri alma iş akışları için ayrı `clawhub` CLI'ını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile Skills arayın ve yükleyin:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw ile Plugin arayın ve yükleyin:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayımlama veya silme/silmeyi geri alma gibi kayıt kimliği doğrulanmış iş akışları
istediğinizde ClawHub CLI'ını yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey          | Ne depolar                                                   | Tipik komut                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` ve destekleyici dosyalar içeren sürümlü metin paketleri | `openclaw skills install @openclaw/demo`     |
| Kod Plugin'leri | Uyumluluk meta verileri içeren OpenClaw Plugin paketleri     | `openclaw plugins install clawhub:<package>` |
| Paket Plugin'leri | OpenClaw dağıtımı için paketlenmiş Plugin paketleri       | `clawhub package publish <source>`           |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini,
dosyaları, indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Genel
sayfalar mevcut kayıt durumunu gösterir; böylece kullanıcılar bir Skill veya
Plugin'i yüklemeden önce inceleyebilir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükleme yapar ve kaynak
meta verilerini kalıcı hale getirir; böylece sonraki güncelleme komutları
ClawHub'da kalabilir.

Bir Plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde
`clawhub:<package>` kullanın. Çıkarma geçişleri sırasında çıplak npm uyumlu
Plugin belirtimleri npm üzerinden çözümlenebilir ve kaynak açık olmak zorundaysa
`npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce ilan edilen `pluginApi` ve
`minGatewayVersion` uyumluluğunu doğrular. Bir paket sürümü ClawPack yapıtı
yayımladığında OpenClaw tam olarak yüklenen npm-pack `.tgz` dosyasını tercih eder,
ClawHub digest başlığını ve indirilen baytları doğrular ve sonraki güncellemeler
için yapıt meta verilerini kaydeder.

## ClawHub CLI

ClawHub CLI, kayıt kimliği doğrulanmış işler içindir:

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

CLI ayrıca doğrudan kayıt iş akışları için Skill yükleme/güncelleme komutlarına
sahiptir:

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

- `--slug <slug>`: yayımlanmış Skill URL adı.
- `--name <name>`: görünen ad.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: değişiklik günlüğü metni.
- `--tags <tags>`: varsayılanı `latest` olan, virgülle ayrılmış etiketler.

Plugin'leri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub
URL'sinden yayımlayın:

```bash
clawhub package publish <source>
```

Yükleme yapmadan tam yayımlama planını oluşturmak için `--dry-run`, CI dostu çıktı
için `--json` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk meta
verilerini içermelidir. Tam komut başvurusu için [CLI](/tr/clawhub/cli), Skill meta
verileri için [Skill biçimi](/clawhub/skill-format) sayfasına bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama için
yükleme eşiğini geçecek kadar eski bir GitHub hesabı gerekir. Genel ayrıntı
sayfaları, yükleme veya indirme öncesinde en son tarama durumunu özetler.

ClawHub yayımlanan Skills ve Plugin sürümlerinde otomatik kontroller çalıştırır.
Tarama nedeniyle tutulan veya engellenen sürümler, sahiplerine `/dashboard`
içinde görünür kalırken genel katalogdan ve yükleme yüzeylerinden kaybolabilir.

Oturum açmış kullanıcılar Skills ve paketleri bildirebilir. Moderatörler
bildirimleri inceleyebilir, içeriği gizleyebilir veya geri yükleyebilir ve kötüye
kullanım yapan hesapları yasaklayabilir. İlke ve yaptırım ayrıntıları için
[Güvenlik](/clawhub/security),
[Güvenlik Denetimleri](/tr/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage) sayfalarına bakın.

## Telemetri ve ortam

Oturum açmışken `clawhub install` çalıştırdığınızda CLI, ClawHub'ın toplam yükleme
sayılarını hesaplayabilmesi için en iyi çabayla bir yükleme olayı gönderebilir.
Bunu şununla devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Yararlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Tarayıcı girişi için kullanılan site URL'sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`            | Kayıt API URL'sini geçersiz kılar.                |
| `CLAWHUB_CONFIG_PATH`         | CLI'ın token/yapılandırma durumunu depoladığı yeri geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılar.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Yükleme telemetrisini devre dışı bırakır.         |

Daha derin başvuru materyali için [Telemetri](/tr/clawhub/telemetry), [HTTP API](/clawhub/http-api) ve
[Sorun giderme](/clawhub/troubleshooting) sayfalarına bakın.

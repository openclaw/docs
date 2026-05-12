---
read_when:
    - ClawHub'ın ne olduğunu açıklama
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin'leri kayıt deposunda yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Keşif, kurulum, yayımlama, güvenlik ve clawhub CLI için herkese açık ClawHub genel bakışı.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T04:09:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills ve Plugin'leri için genel kayıt deposudur.

- Skills aramak, yüklemek ve güncellemek ve ClawHub'dan Plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt deposu kimlik doğrulaması, yayınlama, silme/geri alma ve eşitleme iş akışları için ayrı `clawhub` CLI'sini kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

Skills öğelerini OpenClaw ile arayın ve yükleyin:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugin'leri OpenClaw ile arayın ve yükleyin:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayınlama, eşitleme veya silme/geri alma gibi kayıt deposu kimlik doğrulamalı
iş akışları istediğinizde ClawHub CLI'sini yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey          | Ne saklar                                                    | Tipik komut                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` ve destekleyici dosyalar içeren sürümlü metin paketleri | `openclaw skills install <slug>`             |
| Kod Plugin'leri | Uyumluluk meta verileri olan OpenClaw Plugin paketleri       | `openclaw plugins install clawhub:<package>` |
| Paket Plugin'leri | OpenClaw dağıtımı için paketlenmiş Plugin paketleri       | `clawhub package publish <source>`           |
| Souls          | Yalnızca onlycrabs.ai üzerinde gösterilen `SOUL.md` paketleri | Web ve API yayınlama akışları                |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini,
dosyaları, indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Genel
sayfalar güncel kayıt deposu durumunu gösterir, böylece kullanıcılar yüklemeden
önce bir skill veya Plugin'i inceleyebilir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükleme yapar ve kaynak
meta verilerini kalıcı hale getirir, böylece sonraki güncelleme komutları
ClawHub üzerinde kalabilir.

Bir Plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde
`clawhub:<package>` kullanın. Çıplak npm açısından güvenli Plugin belirtimleri,
başlatma geçişleri sırasında npm üzerinden çözümlenebilir ve kaynağın açık olması
gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce duyurulan `pluginApi` ve
`minGatewayVersion` uyumluluğunu doğrular. Bir paket sürümü ClawPack yapıtı
yayınladığında OpenClaw tam olarak yüklenen npm-pack `.tgz` dosyasını tercih eder,
ClawHub özet başlığını ve indirilen baytları doğrular ve sonraki güncellemeler
için yapıt meta verilerini kaydeder.

## ClawHub CLI

ClawHub CLI, kayıt deposu kimlik doğrulamalı işler içindir:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

CLI'de doğrudan kayıt deposu iş akışları için skill yükleme/güncelleme komutları
da vardır:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Bu komutlar Skills öğelerini geçerli çalışma dizininin altındaki `./skills`
konumuna yükler ve yüklü sürümleri `.clawhub/lock.json` içinde kaydeder.

## Yayınlama

Skills öğelerini `SKILL.md` içeren yerel bir klasörden yayınlayın:

```bash
clawhub skill publish <path>
```

Yaygın yayınlama seçenekleri:

- `--slug <slug>`: skill slug'ı.
- `--name <name>`: görünen ad.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: değişiklik günlüğü metni.
- `--tags <tags>`: virgülle ayrılmış etiketler; varsayılan olarak `latest`.

Plugin'leri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya GitHub
URL'sinden yayınlayın:

```bash
clawhub package publish <source>
```

Yüklemeden tam yayınlama planını oluşturmak için `--dry-run`, CI dostu çıktı için
`--json` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk
meta verilerini içermelidir. Tam komut başvurusu için [CLI](/tr/clawhub/cli), skill
meta verileri için [Skill biçimi](/tr/clawhub/skill-format) bölümüne bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayınlama için
yükleme eşiğini geçecek kadar eski bir GitHub hesabı gerekir. Genel ayrıntı
sayfaları, yükleme veya indirme öncesinde en son tarama durumunu özetler.

ClawHub, yayınlanan Skills ve Plugin sürümleri üzerinde otomatik kontroller
çalıştırır. Tarama nedeniyle bekletilen veya engellenen sürümler, sahiplerine
`/dashboard` içinde görünür kalırken genel katalog ve yükleme yüzeylerinden
kaybolabilir.

Oturum açmış kullanıcılar Skills ve paketleri bildirebilir. Moderatörler
bildirimleri inceleyebilir, içeriği gizleyebilir veya geri yükleyebilir ve kötüye
kullanım yapan hesapları yasaklayabilir. Politika ve yaptırım ayrıntıları için
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) ve
[Güvenlik + moderasyon](/tr/clawhub/security) bölümlerine bakın.

## Telemetri ve ortam

Oturum açmışken `clawhub sync` çalıştırdığınızda CLI, ClawHub'ın yükleme
sayılarını hesaplayabilmesi için en küçük düzeyde bir anlık görüntü gönderir.
Bunu şu şekilde devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Yararlı ortam geçersiz kılmaları:

| Değişken                     | Etki                                             |
| ---------------------------- | ------------------------------------------------ |
| `CLAWHUB_SITE`               | Tarayıcı oturum açması için kullanılan site URL'sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`           | Kayıt deposu API URL'sini geçersiz kılar.        |
| `CLAWHUB_CONFIG_PATH`        | CLI'nin token/yapılandırma durumunu sakladığı yeri geçersiz kılar. |
| `CLAWHUB_WORKDIR`            | Varsayılan çalışma dizinini geçersiz kılar.      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` üzerinde telemetriyi devre dışı bırakır.  |

Daha derin başvuru materyali için [Telemetri](/tr/clawhub/telemetry),
[HTTP API](/tr/clawhub/http-api) ve [Sorun giderme](/tr/clawhub/troubleshooting)
bölümlerine bakın.

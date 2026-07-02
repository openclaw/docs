---
read_when:
    - ClawHub'ın ne olduğunu açıklama
    - Skills veya plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin'leri kayıt defterinde yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Keşif, kurulum, yayımlama, güvenlik ve clawhub CLI için genel ClawHub özeti.
title: ClawHub
x-i18n:
    generated_at: "2026-07-02T08:42:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw becerileri ve pluginleri için herkese açık kayıt defteridir.

- ClawHub'dan beceri aramak, yüklemek ve güncellemek ve plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt defteri kimlik doğrulaması, yayımlama ve silme/silmeyi geri alma iş akışları için ayrı `clawhub` CLI'ını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile becerileri arayın ve yükleyin:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw ile pluginleri arayın ve yükleyin:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayımlama veya silme/silmeyi geri alma gibi kayıt defteri kimliği doğrulanmış iş akışları istediğinizde ClawHub CLI'ını yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey          | Sakladığı şey                                                    | Tipik komut                                  |
| -------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Skills         | `SKILL.md` ve destekleyici dosyalarla sürümlü metin paketleri    | `openclaw skills install @openclaw/demo`     |
| Kod pluginleri | Uyumluluk meta verilerine sahip OpenClaw plugin paketleri        | `openclaw plugins install clawhub:<package>` |
| Paket pluginleri | OpenClaw dağıtımı için paketlenmiş plugin paketleri            | `clawhub package publish <source>`           |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini, dosyaları,
indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Herkese açık sayfalar güncel kayıt defteri
durumunu gösterir; böylece kullanıcılar bir beceriyi veya plugini yüklemeden önce inceleyebilir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükleme yapar ve kaynak
meta verilerini kalıcı hale getirir; böylece sonraki güncelleme komutları ClawHub'da kalabilir.

Bir plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde `clawhub:<package>` kullanın.
Düz npm-güvenli plugin belirtimleri, lansman geçişleri sırasında npm üzerinden çözümlenebilir ve
bir kaynağın açık olması gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce duyurulan `pluginApi` ve `minGatewayVersion`
uyumluluğunu doğrular. Bir paket sürümü bir ClawPack yapıtı yayımladığında, OpenClaw yüklenen tam npm-pack `.tgz` dosyasını tercih eder,
ClawHub özet üst bilgisini ve indirilen baytları doğrular ve sonraki güncellemeler için yapıt meta verilerini kaydeder.

## ClawHub CLI

ClawHub CLI, kayıt defteri kimliği doğrulanmış işler içindir:

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

CLI ayrıca doğrudan kayıt defteri iş akışları için beceri yükleme/güncelleme komutlarına da sahiptir:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Bu komutlar becerileri geçerli çalışma dizininin altındaki `./skills` içine yükler
ve yüklü sürümleri `.clawhub/lock.json` içinde kaydeder.

## Yayımlama

Becerileri `SKILL.md` içeren yerel bir klasörden yayımlayın:

```bash
clawhub skill publish <path>
```

Yaygın yayımlama seçenekleri:

- `--slug <slug>`: yayımlanan beceri URL adı.
- `--name <name>`: görüntü adı.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: değişiklik günlüğü metni.
- `--tags <tags>`: virgülle ayrılmış etiketler; varsayılan olarak `latest`.

Pluginleri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub
URL'sinden yayımlayın:

```bash
clawhub package publish <source>
```

Yükleme yapmadan tam yayımlama planını oluşturmak için `--dry-run`, CI dostu çıktı için `--json`
kullanın.

Kod pluginleri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk meta verilerini içermelidir.
Tam komut referansı için [CLI](/tr/clawhub/cli) sayfasına ve beceri meta verileri için
[Beceri biçimi](/clawhub/skill-format) sayfasına bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama için yükleme geçidinden
geçecek kadar eski bir GitHub hesabı gerekir. Herkese açık ayrıntı sayfaları, yükleme veya indirme öncesinde
en son tarama durumunu özetler.

ClawHub, yayımlanan beceriler ve plugin sürümleri üzerinde otomatik kontroller çalıştırır. Taramada bekletilen
veya engellenen sürümler, `/dashboard` içinde sahiplerine görünür kalırken herkese açık katalogdan ve yükleme yüzeylerinden
kaybolabilir.

Oturum açmış kullanıcılar becerileri ve paketleri bildirebilir. Moderatörler bildirimleri inceleyebilir,
içeriği gizleyebilir veya geri yükleyebilir ve kötüye kullanım yapan hesapları yasaklayabilir. Politika ve yaptırım ayrıntıları için
[Güvenlik](/tr/clawhub/security),
[Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) sayfalarına bakın.

## Telemetri ve ortam

Oturum açmışken `clawhub install` çalıştırdığınızda CLI, ClawHub'ın toplu yükleme sayılarını hesaplayabilmesi için
en iyi çaba esaslı bir yükleme olayı gönderebilir. Bunu şu şekilde devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Kullanışlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                                   |
| ----------------------------- | ------------------------------------------------------ |
| `CLAWHUB_SITE`                | Tarayıcı oturum açması için kullanılan site URL'sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`            | Kayıt defteri API URL'sini geçersiz kılar.             |
| `CLAWHUB_CONFIG_PATH`         | CLI'ın belirteç/yapılandırma durumunu sakladığı yeri geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılar.            |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Yükleme telemetrisini devre dışı bırakır.              |

Daha derin başvuru materyali için [Telemetri](/clawhub/telemetry), [HTTP API](/clawhub/http-api) ve
[Sorun giderme](/tr/clawhub/troubleshooting) sayfalarına bakın.

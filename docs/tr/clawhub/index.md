---
read_when:
    - ClawHub'ın ne olduğunu açıklama
    - Skills veya Plugin'leri arama, yükleme ya da güncelleme
    - Skills veya Plugin'leri kayıt defterinde yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapmak
sidebarTitle: ClawHub
summary: Keşif, yükleme, yayımlama, güvenlik ve clawhub CLI için herkese açık ClawHub genel bakışı.
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T20:32:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw becerileri ve plugin'leri için genel kayıttır.

- Becerileri aramak, yüklemek ve güncellemek, ayrıca ClawHub'dan plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt kimlik doğrulaması, yayımlama ve silme/silmeyi geri alma iş akışları için ayrı `clawhub` CLI'ını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile becerileri arayın ve yükleyin:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw ile plugin'leri arayın ve yükleyin:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayımlama veya silme/silmeyi geri alma gibi kayıt kimliği doğrulanmış iş akışları istediğinizde ClawHub CLI'ını yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey          | Ne depolar                                                    | Tipik komut                                  |
| -------------- | ------------------------------------------------------------- | -------------------------------------------- |
| Skills         | `SKILL.md` ve destekleyici dosyalar içeren sürümlü metin paketleri | `openclaw skills install @openclaw/demo`     |
| Kod plugin'leri | Uyumluluk meta verileri içeren OpenClaw plugin paketleri      | `openclaw plugins install clawhub:<package>` |
| Paket plugin'leri | OpenClaw dağıtımı için paketlenmiş plugin paketleri         | `clawhub package publish <source>`           |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini, dosyaları,
indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Genel sayfalar, kullanıcıların
bir beceriyi veya plugin'i yüklemeden önce inceleyebilmesi için mevcut kayıt durumunu gösterir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükleme yapar ve sonraki güncelleme
komutlarının ClawHub'da kalabilmesi için kaynak meta verilerini kalıcı hale getirir.

Bir plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde `clawhub:<package>` kullanın.
Düz npm uyumlu plugin belirtimleri, lansman geçişleri sırasında npm üzerinden çözümlenebilir ve
bir kaynağın açıkça belirtilmesi gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv kurulumu çalışmadan önce duyurulan `pluginApi` ve `minGatewayVersion`
uyumluluğunu doğrular. Bir paket sürümü bir ClawPack yapıtı yayımladığında OpenClaw tam olarak
yüklenen npm-pack `.tgz` dosyasını tercih eder, ClawHub özet başlığını ve indirilen baytları
doğrular ve sonraki güncellemeler için yapıt meta verilerini kaydeder.

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

CLI ayrıca doğrudan kayıt iş akışları için beceri yükleme/güncelleme komutlarına da sahiptir:

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
- `--name <name>`: görünen ad.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: değişiklik günlüğü metni.
- `--tags <tags>`: varsayılanı `latest` olan, virgülle ayrılmış etiketler.

Plugin'leri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub
URL'sinden yayımlayın:

```bash
clawhub package publish <source>
```

Yüklemeden tam yayımlama planını oluşturmak için `--dry-run`, CI dostu çıktı için `--json`
kullanın.

Kod plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil gerekli OpenClaw uyumluluk meta verilerini içermelidir.
Tam komut referansı için [CLI](/tr/clawhub/cli), beceri meta verileri için
[Beceri biçimi](/clawhub/skill-format) bölümüne bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama için yükleme kapısından
geçebilecek kadar eski bir GitHub hesabı gerekir. Genel ayrıntı sayfaları, yükleme veya indirme
öncesinde en son tarama durumunu özetler.

ClawHub yayımlanan beceriler ve plugin sürümleri üzerinde otomatik kontroller çalıştırır.
Tarama nedeniyle bekletilen veya engellenen sürümler, sahibine `/dashboard` içinde görünür
kalmaya devam ederken genel katalog ve yükleme yüzeylerinden kaybolabilir.

Oturum açmış kullanıcılar becerileri ve paketleri bildirebilir. Moderatörler bildirimleri
inceleyebilir, içeriği gizleyebilir veya geri yükleyebilir ve kötüye kullanan hesapları yasaklayabilir.
Politika ve yaptırım ayrıntıları için [Güvenlik](/tr/clawhub/security),
[Güvenlik denetimleri](/clawhub/security-audits),
[Moderasyon ve hesap güvenliği](/clawhub/moderation) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) bölümlerine bakın.

## Telemetri ve ortam

Oturum açıkken `clawhub install` çalıştırdığınızda CLI, ClawHub'ın toplam yükleme sayılarını
hesaplayabilmesi için elinden gelen en iyi çabayla bir yükleme olayı gönderebilir. Bunu şu şekilde devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Kullanışlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Tarayıcı girişi için kullanılan site URL'sini geçersiz kıl. |
| `CLAWHUB_REGISTRY`            | Kayıt API URL'sini geçersiz kıl.                  |
| `CLAWHUB_CONFIG_PATH`         | CLI'ın token/yapılandırma durumunu depoladığı yeri geçersiz kıl. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kıl.         |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Yükleme telemetrisini devre dışı bırak.           |

Daha derin başvuru materyali için [Telemetri](/clawhub/telemetry), [HTTP API](/clawhub/http-api) ve
[Sorun giderme](/tr/clawhub/troubleshooting) bölümlerine bakın.

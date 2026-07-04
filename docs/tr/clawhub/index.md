---
read_when:
    - ClawHub'ın ne olduğunu açıklama
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin'leri kayıt defterinde yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Keşif, kurulum, yayımlama, güvenlik ve clawhub CLI için herkese açık ClawHub genel bakışı.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T06:47:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw becerileri ve pluginleri için herkese açık kayıt defteridir.

- Becerileri aramak, yüklemek ve güncellemek, ayrıca ClawHub'dan plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt defteri kimlik doğrulaması, yayımlama ve silme/silmeyi geri alma iş akışları için ayrı `clawhub` CLI'sini kullanın.

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

Yayımlama veya silme/silmeyi geri alma gibi kayıt defteri kimliği doğrulanmış iş akışları istediğinizde ClawHub CLI'yi yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey          | Ne saklar                                                    | Tipik komut                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` ve destek dosyalarıyla sürümlenmiş metin paketleri | `openclaw skills install @openclaw/demo`     |
| Kod pluginleri | Uyumluluk meta verileri içeren OpenClaw plugin paketleri     | `openclaw plugins install clawhub:<package>` |
| Paket pluginleri | OpenClaw dağıtımı için paketlenmiş plugin paketleri        | `clawhub package publish <source>`           |

ClawHub, semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini, dosyaları,
indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Herkese açık sayfalar, kullanıcıların
yüklemeden önce bir beceriyi veya plugini inceleyebilmesi için güncel kayıt defteri
durumunu gösterir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları, etkin OpenClaw çalışma alanına yükler ve daha sonraki
güncelleme komutlarının ClawHub üzerinde kalabilmesi için kaynak meta verilerini kalıcı hale getirir.

Bir plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde `clawhub:<package>` kullanın.
Düz npm açısından güvenli plugin belirtimleri, başlatma geçişleri sırasında npm üzerinden çözümlenebilir ve
bir kaynağın açık olması gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce duyurulan `pluginApi` ve `minGatewayVersion`
uyumluluğunu doğrular. Bir paket sürümü bir ClawPack artefaktı yayımladığında OpenClaw, tam olarak
yüklenen npm-pack `.tgz` dosyasını tercih eder, ClawHub özet başlığını ve indirilen baytları doğrular
ve daha sonraki güncellemeler için artefakt meta verilerini kaydeder.

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

CLI'de doğrudan kayıt defteri iş akışları için beceri yükleme/güncelleme komutları da vardır:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Bu komutlar, becerileri geçerli çalışma dizini altında `./skills` içine yükler
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
- `--tags <tags>`: varsayılanı `latest` olan virgülle ayrılmış etiketler.

Pluginleri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya GitHub
URL'sinden yayımlayın:

```bash
clawhub package publish <source>
```

Yüklemeden tam yayımlama planını oluşturmak için `--dry-run`, CI dostu çıktı
için `--json` kullanın.

Kod pluginleri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk meta verilerini
içermelidir. Tam komut başvurusu için [CLI](/tr/clawhub/cli) ve beceri meta verileri için
[Beceri biçimi](/clawhub/skill-format) sayfalarına bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleyebilir, ancak yayımlama için yükleme kapısını
geçecek kadar eski bir GitHub hesabı gerekir. Herkese açık ayrıntı sayfaları, yükleme veya indirme
öncesinde en son tarama durumunu özetler.

ClawHub, yayımlanan beceriler ve plugin sürümleri üzerinde otomatik denetimler çalıştırır. Tarama nedeniyle bekletilen
veya engellenen sürümler, `/dashboard` içinde sahipleri tarafından görünür kalırken herkese açık katalog ve yükleme
yüzeylerinden kaybolabilir.

Oturum açmış kullanıcılar becerileri ve paketleri bildirebilir. Moderatörler bildirimleri inceleyebilir,
içeriği gizleyebilir veya geri yükleyebilir ve kötüye kullanan hesapları yasaklayabilir. İlke ve yaptırım ayrıntıları için
[Güvenlik](/tr/clawhub/security),
[Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) sayfalarına bakın.

## Telemetri ve ortam

Oturum açıkken `clawhub install` çalıştırdığınızda CLI, ClawHub'ın toplu yükleme sayılarını
hesaplayabilmesi için en iyi çabayla bir yükleme olayı gönderebilir. Bunu şu şekilde devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Yararlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Tarayıcı oturum açma için kullanılan site URL'sini geçersiz kılın. |
| `CLAWHUB_REGISTRY`            | Kayıt defteri API URL'sini geçersiz kılın.        |
| `CLAWHUB_CONFIG_PATH`         | CLI'nin belirteç/yapılandırma durumunu depoladığı yeri geçersiz kılın. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılın.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Yükleme telemetrisini devre dışı bırakın.         |

Daha ayrıntılı başvuru materyali için [Telemetri](/clawhub/telemetry), [HTTP API](/clawhub/http-api) ve
[Sorun giderme](/tr/clawhub/troubleshooting) sayfalarına bakın.

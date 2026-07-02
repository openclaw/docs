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
    generated_at: "2026-07-02T01:10:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw skills ve plugin'leri için herkese açık kayıt deposudur.

- Skills aramak, yüklemek ve güncellemek; ClawHub'dan plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt deposu kimlik doğrulaması, yayımlama ve silme/silmeyi geri alma iş akışları için ayrı `clawhub` CLI'ını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile skills arayın ve yükleyin:

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

Yayımlama veya silme/silmeyi geri alma gibi kayıt deposu kimlik doğrulamalı iş
akışları istediğinizde ClawHub CLI'ını yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey          | Sakladıkları                                                 | Tipik komut                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` ve destek dosyaları içeren sürümlenmiş metin paketleri | `openclaw skills install @openclaw/demo`     |
| Kod plugin'leri | Uyumluluk meta verileri içeren OpenClaw plugin paketleri     | `openclaw plugins install clawhub:<package>` |
| Paket plugin'leri | OpenClaw dağıtımı için paketlenmiş plugin paketleri       | `clawhub package publish <source>`           |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini,
dosyaları, indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Herkese
açık sayfalar geçerli kayıt deposu durumunu gösterir; böylece kullanıcılar bir
skill veya plugin'i yüklemeden önce inceleyebilir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükler ve kaynak meta
verilerini kalıcı hale getirir; böylece sonraki güncelleme komutları ClawHub'da
kalabilir.

Bir plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerekiyorsa
`clawhub:<package>` kullanın. Düz npm-güvenli plugin belirtimleri, lansman
geçişlerinde npm üzerinden çözümlenebilir; kaynak açıkça belirtilmesi
gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce ilan edilen `pluginApi` ve
`minGatewayVersion` uyumluluğunu doğrular. Bir paket sürümü ClawPack artefaktı
yayımladığında OpenClaw tam yüklenen npm-pack `.tgz` dosyasını tercih eder,
ClawHub özet üst bilgisini ve indirilen baytları doğrular ve sonraki güncellemeler
için artefakt meta verilerini kaydeder.

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
```

CLI ayrıca doğrudan kayıt deposu iş akışları için skill yükleme/güncelleme
komutlarına sahiptir:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Bu komutlar skills'i geçerli çalışma dizininin altında `./skills` içine yükler ve
yüklü sürümleri `.clawhub/lock.json` içinde kaydeder.

## Yayımlama

Skills'i `SKILL.md` içeren yerel bir klasörden yayımlayın:

```bash
clawhub skill publish <path>
```

Yaygın yayımlama seçenekleri:

- `--slug <slug>`: yayımlanan skill URL adı.
- `--name <name>`: görünen ad.
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

Kod plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk meta
verilerini içermelidir. Tam komut başvurusu için [CLI](/tr/clawhub/cli), skill meta
verileri için [Skill formatı](/clawhub/skill-format) bölümüne bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama için
yükleme kapısından geçebilecek kadar eski bir GitHub hesabı gerekir. Herkese açık
ayrıntı sayfaları, yükleme veya indirme öncesinde en son tarama durumunu özetler.

ClawHub, yayımlanan skills ve plugin sürümleri üzerinde otomatik denetimler
çalıştırır. Taramada tutulan veya engellenen sürümler, sahibine `/dashboard`
içinde görünür kalırken herkese açık katalogdan ve yükleme yüzeylerinden
kaybolabilir.

Oturum açmış kullanıcılar skills ve paketleri bildirebilir. Moderatörler
bildirimleri inceleyebilir, içeriği gizleyebilir veya geri yükleyebilir ve kötüye
kullanım yapan hesapları yasaklayabilir. İlke ve yaptırım ayrıntıları için
[Güvenlik](/tr/clawhub/security),
[Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage) bölümlerine bakın.

## Telemetri ve ortam

Oturum açmışken `clawhub install` çalıştırdığınızda CLI, ClawHub'ın toplam yükleme
sayılarını hesaplayabilmesi için en iyi çabayla bir yükleme olayı gönderebilir.
Bunu şu şekilde devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Yararlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Tarayıcı girişi için kullanılan site URL'sini geçersiz kıl. |
| `CLAWHUB_REGISTRY`            | Kayıt deposu API URL'sini geçersiz kıl.           |
| `CLAWHUB_CONFIG_PATH`         | CLI'ın token/config durumunu sakladığı yeri geçersiz kıl. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kıl.         |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Yükleme telemetrisini devre dışı bırak.           |

Daha derin başvuru materyali için [Telemetri](/clawhub/telemetry),
[HTTP API](/clawhub/http-api) ve [Sorun giderme](/tr/clawhub/troubleshooting)
bölümlerine bakın.

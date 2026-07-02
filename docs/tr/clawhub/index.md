---
read_when:
    - ClawHub’ın ne olduğunu açıklama
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin'leri kayıt deposunda yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Keşif, kurulum, yayımlama, güvenlik ve clawhub CLI için herkese açık ClawHub genel bakışı.
title: ClawHub
x-i18n:
    generated_at: "2026-07-02T14:09:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills ve Plugin'leri için herkese açık registry'dir.

- Skills aramak, kurmak ve güncellemek, ayrıca ClawHub'dan Plugin kurmak için yerel `openclaw` komutlarını kullanın.
- Registry kimlik doğrulaması, yayımlama ve silme/silmeyi geri alma iş akışları için ayrı `clawhub` CLI'sini kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile Skills arayın ve kurun:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw ile Plugin'leri arayın ve kurun:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayımlama veya silme/silmeyi geri alma gibi registry kimlik doğrulamalı iş akışları
istediğinizde ClawHub CLI'sini kurun:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey          | Ne depolar                                                   | Tipik komut                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` ve destekleyici dosyalar içeren sürümlü metin paketleri | `openclaw skills install @openclaw/demo`     |
| Kod Plugin'leri | Uyumluluk meta verileri olan OpenClaw Plugin paketleri       | `openclaw plugins install clawhub:<package>` |
| Paket Plugin'leri | OpenClaw dağıtımı için paketlenmiş Plugin paketleri       | `clawhub package publish <source>`           |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini,
dosyaları, indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Herkese
açık sayfalar mevcut registry durumunu gösterir, böylece kullanıcılar kurmadan önce
bir Skill'i veya Plugin'i inceleyebilir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına kurulum yapar ve kaynak
meta verilerini kalıcı hale getirir; böylece daha sonraki güncelleme komutları
ClawHub üzerinde kalabilir.

Bir Plugin kurulumu ClawHub üzerinden çözümlenmeliyse `clawhub:<package>` kullanın.
Çıplak npm güvenli Plugin belirtimleri lansman geçişleri sırasında npm üzerinden
çözümlenebilir ve bir kaynağın açıkça belirtilmesi gerektiğinde `npm:<package>`
yalnızca npm olarak kalır.

Plugin kurulumları, arşiv kurulumu çalışmadan önce ilan edilen `pluginApi` ve
`minGatewayVersion` uyumluluğunu doğrular. Bir paket sürümü ClawPack yapıtı
yayımladığında OpenClaw tam olarak yüklenen npm-pack `.tgz` dosyasını tercih eder,
ClawHub özet üst bilgisini ve indirilen baytları doğrular ve sonraki güncellemeler
için yapıt meta verilerini kaydeder.

## ClawHub CLI

ClawHub CLI, registry kimlik doğrulamalı işler içindir:

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

CLI ayrıca doğrudan registry iş akışları için Skill kurulum/güncelleme komutlarına sahiptir:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Bu komutlar Skills'i geçerli çalışma dizininin altındaki `./skills` içine kurar
ve kurulu sürümleri `.clawhub/lock.json` içinde kaydeder.

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
- `--tags <tags>`: varsayılanı `latest` olan virgülle ayrılmış etiketler.

Plugin'leri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub
URL'sinden yayımlayın:

```bash
clawhub package publish <source>
```

Yükleme yapmadan tam yayımlama planını oluşturmak için `--dry-run`, CI dostu çıktı
için `--json` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk meta
verilerini içermelidir. Tam komut referansı için [CLI](/tr/clawhub/cli), Skill meta
verileri için [Skill biçimi](/clawhub/skill-format) bölümüne bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama için
yükleme geçidini geçecek kadar eski bir GitHub hesabı gerekir. Herkese açık ayrıntı
sayfaları, kurulum veya indirme öncesinde en son tarama durumunu özetler.

ClawHub yayımlanan Skills ve Plugin sürümleri üzerinde otomatik denetimler çalıştırır.
Tarama nedeniyle bekletilen veya engellenen sürümler, sahibine `/dashboard` içinde
görünür kalırken herkese açık katalog ve kurulum yüzeylerinden kaybolabilir.

Oturum açmış kullanıcılar Skills ve paketleri bildirebilir. Moderatörler bildirimleri
inceleyebilir, içeriği gizleyebilir veya geri yükleyebilir ve kötüye kullanım yapan
hesapları yasaklayabilir. Politika ve yaptırım ayrıntıları için
[Güvenlik](/tr/clawhub/security),
[Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) bölümlerine bakın.

## Telemetri ve ortam

Oturum açmışken `clawhub install` çalıştırdığınızda CLI, ClawHub'ın toplam kurulum
sayılarını hesaplayabilmesi için en iyi çaba düzeyinde bir kurulum olayı gönderebilir.
Bunu şu şekilde devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Yararlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Tarayıcı oturumu için kullanılan site URL'sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`            | Registry API URL'sini geçersiz kılar.             |
| `CLAWHUB_CONFIG_PATH`         | CLI'nin token/config durumunu depoladığı yeri geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılar.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Kurulum telemetrisini devre dışı bırakır.         |

Daha ayrıntılı başvuru materyali için [Telemetri](/clawhub/telemetry), [HTTP API](/clawhub/http-api) ve
[Sorun giderme](/tr/clawhub/troubleshooting) bölümlerine bakın.

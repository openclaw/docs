---
read_when:
    - ClawHub'ın ne olduğunu açıklama
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin'leri kayıt deposunda yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Keşif, kurulum, yayınlama, güvenlik ve clawhub CLI için herkese açık ClawHub genel bakışı.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T22:19:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills ve Plugin'leri için herkese açık kayıt deposudur.

- Skills aramak, yüklemek ve güncellemek ve ClawHub'dan Plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt deposu kimlik doğrulaması, yayımlama, silme/silmeyi geri alma ve eşitleme iş akışları için ayrı `clawhub` CLI'sini kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile Skills arayın ve yükleyin:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

OpenClaw ile Plugin'leri arayın ve yükleyin:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayımlama, eşitleme veya silme/silmeyi geri alma gibi kayıt deposu kimlik doğrulamalı iş akışları istediğinizde ClawHub CLI'yi yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey          | Ne saklar                                                    | Tipik komut                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` ve destekleyici dosyalarla sürümlenmiş metin paketleri | `openclaw skills install <slug>`             |
| Kod Plugin'leri | Uyumluluk metadatasına sahip OpenClaw Plugin paketleri       | `openclaw plugins install clawhub:<package>` |
| Paket Plugin'leri | OpenClaw dağıtımı için paketlenmiş Plugin paketleri       | `clawhub package publish <source>`           |
| Ruhlar         | yalnızca onlycrabs.ai üzerinde gösterilen `SOUL.md` paketleri | Web ve API yayımlama akışları                |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini, dosyaları, indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Herkese açık sayfalar, kullanıcıların bir Skill veya Plugin'i yüklemeden önce inceleyebilmesi için güncel kayıt deposu durumunu gösterir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükleme yapar ve kaynak metadatasını kalıcılaştırır; böylece sonraki güncelleme komutları ClawHub'da kalabilir.

Bir Plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde `clawhub:<package>` kullanın. Çıkarma geçişleri sırasında çıplak npm güvenli Plugin tanımları npm üzerinden çözümlenebilir ve bir kaynağın açık olması gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce ilan edilen `pluginApi` ve `minGatewayVersion` uyumluluğunu doğrular. Bir paket sürümü ClawPack yapıtı yayımladığında OpenClaw, tam olarak yüklenen npm-pack `.tgz` dosyasını tercih eder, ClawHub özet başlığını ve indirilen baytları doğrular ve sonraki güncellemeler için yapıt metadatasını kaydeder.

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

CLI ayrıca doğrudan kayıt deposu iş akışları için Skill yükleme/güncelleme komutlarına sahiptir:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Bu komutlar Skills'i geçerli çalışma dizininin altındaki `./skills` içine yükler ve yüklü sürümleri `.clawhub/lock.json` içinde kaydeder.

## Yayımlama

Skills'i `SKILL.md` içeren yerel bir klasörden yayımlayın:

```bash
clawhub skill publish <path>
```

Yaygın yayımlama seçenekleri:

- `--slug <slug>`: Skill slug'ı.
- `--name <name>`: görünen ad.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: değişiklik günlüğü metni.
- `--tags <tags>`: varsayılanı `latest` olan, virgülle ayrılmış etiketler.

Plugin'leri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub URL'sinden yayımlayın:

```bash
clawhub package publish <source>
```

Yükleme yapmadan tam yayımlama planını oluşturmak için `--dry-run`, CI dostu çıktı için `--json` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk metadatasını içermelidir. Tam komut başvurusu için [CLI](/tr/clawhub/cli), Skill metadatası için [Skill biçimi](/tr/clawhub/skill-format) sayfasına bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama için yükleme geçidini geçecek kadar eski bir GitHub hesabı gerekir. Herkese açık ayrıntı sayfaları, yükleme veya indirme öncesinde en son tarama durumunu özetler.

ClawHub, yayımlanmış Skills ve Plugin sürümleri üzerinde otomatik kontroller çalıştırır. Taramada tutulan veya engellenen sürümler, sahiplerine `/dashboard` içinde görünür kalırken herkese açık katalog ve yükleme yüzeylerinden kaybolabilir.

Oturum açmış kullanıcılar Skills ve paketleri bildirebilir. Moderatörler bildirimleri inceleyebilir, içeriği gizleyebilir veya geri yükleyebilir ve kötüye kullanım yapan hesapları yasaklayabilir. İlke ve yaptırım ayrıntıları için [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) ve [Güvenlik + moderasyon](/tr/clawhub/security) sayfalarına bakın.

## Telemetri ve ortam

Oturum açıkken `clawhub sync` çalıştırdığınızda CLI, ClawHub'un yükleme sayılarını hesaplayabilmesi için en küçük kapsamlı bir anlık görüntü gönderir. Bunu şu şekilde devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Yararlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Tarayıcı oturum açması için kullanılan site URL'sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`            | Kayıt deposu API URL'sini geçersiz kılar.         |
| `CLAWHUB_CONFIG_PATH`         | CLI'nin belirteç/yapılandırma durumunu sakladığı yeri geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılar.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` üzerinde telemetriyi devre dışı bırakır.   |

Daha derin başvuru materyali için [Telemetri](/tr/clawhub/telemetry), [HTTP API](/tr/clawhub/http-api) ve [Sorun giderme](/tr/clawhub/troubleshooting) sayfalarına bakın.

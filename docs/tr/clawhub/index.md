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
    generated_at: "2026-05-13T05:33:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills ve plugin'leri için herkese açık registry'dir.

- Skills aramak, yüklemek ve güncellemek ve ClawHub'dan plugin'ler yüklemek için yerel `openclaw` komutlarını kullanın.
- Registry kimlik doğrulaması, yayımlama, silme/silmeyi geri alma ve eşitleme iş akışları için ayrı `clawhub` CLI aracını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile Skills arayın ve yükleyin:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

OpenClaw ile plugin'leri arayın ve yükleyin:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayımlama, eşitleme veya silme/silmeyi geri alma gibi registry kimliği doğrulanmış iş akışları istediğinizde ClawHub CLI aracını yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey          | Ne saklar                                                    | Tipik komut                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` ve destekleyici dosyalar içeren sürümlenmiş metin paketleri | `openclaw skills install <slug>`             |
| Kod plugin'leri | Uyumluluk meta verileri içeren OpenClaw plugin paketleri     | `openclaw plugins install clawhub:<package>` |
| Paket plugin'leri | OpenClaw dağıtımı için paketlenmiş plugin paketleri       | `clawhub package publish <source>`           |
| Souls          | Yalnızca onlycrabs.ai üzerinde gösterilen `SOUL.md` paketleri | Web ve API yayımlama akışları                |

ClawHub semver sürümlerini, `latest` gibi etiketleri, changelog'ları, dosyaları,
indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Herkese açık sayfalar, kullanıcıların bir Skill veya plugin'i yüklemeden önce inceleyebilmesi için geçerli registry durumunu gösterir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükleme yapar ve kaynak meta verilerini kalıcı hale getirir; böylece sonraki güncelleme komutları ClawHub üzerinde kalabilir.

Bir plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerekiyorsa `clawhub:<package>` kullanın.
Çıplak npm uyumlu plugin belirtimleri, lansman geçişleri sırasında npm üzerinden çözümlenebilir ve bir kaynağın açık olması gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce duyurulan `pluginApi` ve `minGatewayVersion` uyumluluğunu doğrular. Bir paket sürümü bir ClawPack artifact yayımladığında, OpenClaw tam olarak yüklenen npm-pack `.tgz` dosyasını tercih eder, ClawHub digest header'ını ve indirilen baytları doğrular ve sonraki güncellemeler için artifact meta verilerini kaydeder.

## ClawHub CLI

ClawHub CLI, registry kimliği doğrulanmış işler içindir:

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

CLI, doğrudan registry iş akışları için Skill yükleme/güncelleme komutlarına da sahiptir:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Bu komutlar Skills'i geçerli çalışma dizini altındaki `./skills` dizinine yükler
ve yüklü sürümleri `.clawhub/lock.json` içinde kaydeder.

## Yayımlama

Skills'i `SKILL.md` içeren yerel bir klasörden yayımlayın:

```bash
clawhub skill publish <path>
```

Yaygın yayımlama seçenekleri:

- `--slug <slug>`: Skill slug'ı.
- `--name <name>`: görünen ad.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: changelog metni.
- `--tags <tags>`: virgülle ayrılmış etiketler; varsayılan olarak `latest`.

Plugin'leri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub URL'sinden yayımlayın:

```bash
clawhub package publish <source>
```

Yükleme yapmadan tam yayımlama planını oluşturmak için `--dry-run`, CI dostu çıktı için `--json` kullanın.

Kod plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk meta verilerini içermelidir. Tam komut referansı için [CLI](/tr/clawhub/cli), Skill meta verileri için [Skill biçimi](/tr/clawhub/skill-format) sayfalarına bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama için yükleme kapısını geçecek kadar eski bir GitHub hesabı gerekir. Herkese açık ayrıntı sayfaları, yükleme veya indirme öncesinde en son tarama durumunu özetler.

ClawHub, yayımlanan Skills ve plugin sürümleri üzerinde otomatik denetimler çalıştırır. Taramada tutulan veya engellenen sürümler, sahipleri tarafından `/dashboard` içinde görülebilir kalırken herkese açık katalog ve yükleme yüzeylerinden kaybolabilir.

Oturum açmış kullanıcılar Skills ve paketleri bildirebilir. Moderatörler bildirimleri inceleyebilir, içeriği gizleyebilir veya geri yükleyebilir ve kötüye kullanan hesapları yasaklayabilir. Politika ve yaptırım ayrıntıları için [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) ve
[Güvenlik + moderasyon](/tr/clawhub/security) sayfalarına bakın.

## Telemetri ve ortam

Oturum açmışken `clawhub sync` çalıştırdığınızda CLI, ClawHub'ın yükleme sayılarını hesaplayabilmesi için asgari bir anlık görüntü gönderir. Bunu şu şekilde devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Yararlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                             |
| ----------------------------- | ------------------------------------------------ |
| `CLAWHUB_SITE`                | Tarayıcı oturum açması için kullanılan site URL'sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`            | Registry API URL'sini geçersiz kılar.            |
| `CLAWHUB_CONFIG_PATH`         | CLI aracının token/config durumunu nerede saklayacağını geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılar.      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` üzerinde telemetriyi devre dışı bırakır.  |

Daha derin başvuru materyali için [Telemetri](/tr/clawhub/telemetry), [HTTP API](/tr/clawhub/http-api) ve
[Sorun giderme](/tr/clawhub/troubleshooting) sayfalarına bakın.

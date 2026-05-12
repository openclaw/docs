---
read_when:
    - ClawHub'ın ne olduğunu açıklama
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin'leri kayıt defterinde yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Keşif, kurulum, yayınlama, güvenlik ve clawhub CLI için herkese açık ClawHub genel bakışı.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T15:42:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills ve Plugin'leri için herkese açık kayıttır.

- ClawHub'dan Skills aramak, kurmak ve güncellemek, ayrıca Plugin kurmak için yerel `openclaw` komutlarını kullanın.
- Kayıt kimlik doğrulaması, yayımlama, silme/silmeyi geri alma ve eşitleme iş akışları için ayrı `clawhub` CLI'sini kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile Skills arayın ve kurun:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

OpenClaw ile Plugin'leri arayın ve kurun:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayımlama, eşitleme veya silme/silmeyi geri alma gibi kayıt kimlik doğrulaması
gerektiren iş akışları istediğinizde ClawHub CLI'sini kurun:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey          | Ne depolar                                                    | Tipik komut                                 |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` ve destekleyici dosyalar içeren sürümlü metin paketleri | `openclaw skills install <slug>`             |
| Kod Plugin'leri | Uyumluluk meta verileri içeren OpenClaw Plugin paketleri     | `openclaw plugins install clawhub:<package>` |
| Paket Plugin'leri | OpenClaw dağıtımı için paketlenmiş Plugin paketleri       | `clawhub package publish <source>`           |
| Souls          | Yalnızca onlycrabs.ai üzerinde gösterilen `SOUL.md` paketleri | Web ve API yayımlama akışları                |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini,
dosyaları, indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Herkese
açık sayfalar mevcut kayıt durumunu gösterir; böylece kullanıcılar bir Skill'i
veya Plugin'i kurmadan önce inceleyebilir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına kurulum yapar ve kaynak
meta verilerini kalıcı hale getirir; böylece sonraki güncelleme komutları ClawHub
üzerinde kalabilir.

Bir Plugin kurulumunun ClawHub üzerinden çözümlenmesi gerektiğinde
`clawhub:<package>` kullanın. Çıkarma geçişleri sırasında yalın npm uyumlu Plugin
belirtimleri npm üzerinden çözümlenebilir ve kaynak açıkça belirtilmek zorunda
olduğunda `npm:<package>` yalnızca npm olarak kalır.

Plugin kurulumları, arşiv kurulumu çalışmadan önce duyurulan `pluginApi` ve
`minGatewayVersion` uyumluluğunu doğrular. Bir paket sürümü ClawPack artefaktı
yayımladığında OpenClaw tam olarak yüklenen npm-pack `.tgz` dosyasını tercih eder,
ClawHub özet başlığını ve indirilen baytları doğrular, ayrıca sonraki güncellemeler
için artefakt meta verilerini kaydeder.

## ClawHub CLI

ClawHub CLI, kayıt kimlik doğrulaması gerektiren işler içindir:

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

CLI'de doğrudan kayıt iş akışları için Skill kurma/güncelleme komutları da vardır:

```bash
clawhub install <slug>
clawhub update <slug>
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

- `--slug <slug>`: Skill slug'ı.
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

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil gerekli OpenClaw uyumluluk meta verilerini
içermelidir. Tam komut başvurusu için [CLI](/tr/clawhub/cli), Skill meta verileri için
[Skill biçimi](/tr/clawhub/skill-format) bölümüne bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama için
yükleme geçidinden geçecek kadar eski bir GitHub hesabı gerekir. Herkese açık
ayrıntı sayfaları, kurulum veya indirme öncesinde en son tarama durumunu özetler.

ClawHub yayımlanan Skills ve Plugin sürümlerinde otomatik kontroller çalıştırır.
Tarama nedeniyle bekletilen veya engellenen sürümler, sahibine `/dashboard` içinde
görünür kalırken herkese açık katalogdan ve kurulum yüzeylerinden kaybolabilir.

Oturum açmış kullanıcılar Skills ve paketleri bildirebilir. Moderatörler raporları
inceleyebilir, içeriği gizleyebilir veya geri yükleyebilir ve kötüye kullanan
hesapları yasaklayabilir. İlke ve yaptırım ayrıntıları için
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) ve
[Güvenlik + moderasyon](/tr/clawhub/security) bölümlerine bakın.

## Telemetri ve ortam

Oturum açıkken `clawhub sync` çalıştırdığınızda CLI, ClawHub'ın kurulum sayılarını
hesaplayabilmesi için en küçük kapsamlı bir anlık görüntü gönderir. Bunu şu
komutla devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Yararlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Tarayıcı oturum açma için kullanılan site URL'sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`            | Kayıt API URL'sini geçersiz kılar.                |
| `CLAWHUB_CONFIG_PATH`         | CLI'nin token/yapılandırma durumunu sakladığı yeri geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılar.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` üzerinde telemetriyi devre dışı bırakır.   |

Daha ayrıntılı başvuru materyalleri için [Telemetri](/tr/clawhub/telemetry),
[HTTP API](/tr/clawhub/http-api) ve [Sorun giderme](/tr/clawhub/troubleshooting)
bölümlerine bakın.

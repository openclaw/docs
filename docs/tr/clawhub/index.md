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
    generated_at: "2026-05-11T20:24:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills ve Plugin'leri için herkese açık kayıt dizinidir.

- Skills aramak, yüklemek ve güncellemek ve ClawHub'dan Plugin'ler yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt dizini kimlik doğrulaması, yayınlama, silme/geri alma, yeniden taramalar ve eşitleme iş akışları için ayrı `clawhub` CLI'ını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile Skills arayın ve yükleyin:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

OpenClaw ile Plugin'ler arayın ve yükleyin:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayınlama, eşitleme, silme/geri alma veya sahip tarafından istenen yeniden
taramalar gibi kayıt dizini kimliği doğrulanmış iş akışları istediğinizde
ClawHub CLI'ını yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub'ın barındırdıkları

| Yüzey          | Sakladığı şey                                                | Tipik komut                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` ve destek dosyaları içeren sürümlü metin paketleri | `openclaw skills install <slug>`             |
| Kod Plugin'leri | Uyumluluk meta verileri içeren OpenClaw Plugin paketleri     | `openclaw plugins install clawhub:<package>` |
| Paket Plugin'leri | OpenClaw dağıtımı için paketlenmiş Plugin paketleri       | `clawhub package publish <source>`           |
| Souls          | Yalnızca onlycrabs.ai üzerinde gösterilen `SOUL.md` paketleri | Web ve API yayınlama akışları                |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini,
dosyaları, indirmeleri, yıldızları ve güvenlik taraması özetlerini izler.
Herkese açık sayfalar mevcut kayıt dizini durumunu gösterir; böylece kullanıcılar
bir Skill'i veya Plugin'i yüklemeden önce inceleyebilir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükleme yapar ve kaynak
meta verilerini kalıcı hale getirir; böylece sonraki güncelleme komutları
ClawHub üzerinde kalabilir.

Bir Plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde
`clawhub:<package>` kullanın. Yalın npm için güvenli Plugin belirtimleri,
yayına geçiş dönemlerinde npm üzerinden çözümlenebilir ve bir kaynağın açıkça
belirtilmesi gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce duyurulan `pluginApi` ve
`minGatewayVersion` uyumluluğunu doğrular. Bir paket sürümü bir ClawPack yapıtı
yayınladığında, OpenClaw tam olarak yüklenen npm-pack `.tgz` dosyasını tercih
eder, ClawHub özet üst bilgisini ve indirilen baytları doğrular ve sonraki
güncellemeler için yapıt meta verilerini kaydeder.

## ClawHub CLI

ClawHub CLI, kayıt dizini kimliği doğrulanmış işler içindir:

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

CLI ayrıca doğrudan kayıt dizini iş akışları için Skill yükleme/güncelleme
komutlarına sahiptir:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Bu komutlar Skills'i geçerli çalışma dizininin altındaki `./skills` içine yükler
ve yüklü sürümleri `.clawhub/lock.json` içinde kaydeder.

## Yayınlama

Skills'i `SKILL.md` içeren yerel bir klasörden yayınlayın:

```bash
clawhub skill publish <path>
```

Yaygın yayınlama seçenekleri:

- `--slug <slug>`: Skill slug'ı.
- `--name <name>`: görünen ad.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: değişiklik günlüğü metni.
- `--tags <tags>`: virgülle ayrılmış etiketler; varsayılan olarak `latest`.

Plugin'leri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub
URL'sinden yayınlayın:

```bash
clawhub package publish <source>
```

Yükleme yapmadan tam yayınlama planını oluşturmak için `--dry-run`, CI dostu çıktı
için `--json` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk
meta verilerini içermelidir. Tam komut başvurusu için [CLI](/tr/clawhub/cli) ve
Skill meta verileri için [Skill biçimi](/tr/clawhub/skill-format) sayfalarına bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayınlama,
yükleme kapısından geçecek kadar eski bir GitHub hesabı gerektirir. Herkese açık
ayrıntı sayfaları, yükleme veya indirme öncesinde en son tarama durumunu özetler.

ClawHub, yayınlanan Skills ve Plugin sürümleri üzerinde otomatik kontroller
çalıştırır. Tarama nedeniyle bekletilen veya engellenen sürümler, sahipleri için
`/dashboard` içinde görünür kalırken herkese açık katalogdan ve yükleme
yüzeylerinden kaybolabilir.

Sahipler, yanlış pozitiflerden kurtarma için sınırlı yeniden taramalar isteyebilir.
Platform moderatörleri ve yöneticileri, destek raporlarını ele alırken herhangi
bir Skill veya paket için yeniden tarama isteyebilir:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Oturum açmış kullanıcılar Skills ve paketleri bildirebilir. Moderatörler
raporları inceleyebilir, içeriği gizleyebilir veya geri yükleyebilir, itirazları
çözebilir ve kötüye kullanan hesapları yasaklayabilir. Politika ve uygulama
ayrıntıları için [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) ve
[Güvenlik + moderasyon](/tr/clawhub/security) sayfalarına bakın.

## Telemetri ve ortam

Oturum açmışken `clawhub sync` çalıştırdığınızda CLI, ClawHub'ın yükleme sayılarını
hesaplayabilmesi için en küçük kapsamlı bir anlık görüntü gönderir. Bunu şu şekilde
devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Yararlı ortam geçersiz kılmaları:

| Değişken                     | Etki                                              |
| ---------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`               | Tarayıcı oturumu açma için kullanılan site URL'sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`           | Kayıt dizini API URL'sini geçersiz kılar.         |
| `CLAWHUB_CONFIG_PATH`        | CLI'ın belirteç/yapılandırma durumunu nerede sakladığını geçersiz kılar. |
| `CLAWHUB_WORKDIR`            | Varsayılan çalışma dizinini geçersiz kılar.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` sırasında telemetriyi devre dışı bırakır. |

Daha ayrıntılı başvuru materyali için [Telemetri](/tr/clawhub/telemetry),
[HTTP API](/tr/clawhub/http-api) ve [Sorun giderme](/tr/clawhub/troubleshooting)
sayfalarına bakın.

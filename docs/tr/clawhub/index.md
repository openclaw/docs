---
read_when:
    - ClawHub'ın ne olduğunu açıklama
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin’leri kayıt defterinde yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Keşif, yükleme, yayımlama, güvenlik ve clawhub CLI için herkese açık ClawHub genel bakışı.
title: ClawHub
x-i18n:
    generated_at: "2026-05-10T19:26:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills ve Plugin'ları için genel kayıt deposudur.

- ClawHub’dan Skills aramak, yüklemek ve güncellemek ve Plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt deposu kimlik doğrulaması, yayımlama, silme/geri alma, yeniden taramalar ve eşitleme iş akışları için ayrı `clawhub` CLI’ını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile Skills arayın ve yükleyin:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

OpenClaw ile Plugin'ları arayın ve yükleyin:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayımlama, eşitleme, silme/geri alma veya sahip tarafından istenen yeniden taramalar gibi
kayıt deposu kimliği doğrulanmış iş akışları istediğinizde ClawHub CLI’ını yükleyin:

```bash
npm i -g clawhub
# veya
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey          | Ne depolar                                                    | Tipik komut                                  |
| -------------- | ------------------------------------------------------------- | -------------------------------------------- |
| Skills         | `SKILL.md` ve destek dosyaları içeren sürümlenmiş metin paketleri | `openclaw skills install <slug>`             |
| Kod Plugin'ları | Uyumluluk meta verileri içeren OpenClaw Plugin paketleri       | `openclaw plugins install clawhub:<package>` |
| Paket Plugin'ları | OpenClaw dağıtımı için paketlenmiş Plugin paketleri          | `clawhub package publish <source>`           |
| Souls          | yalnızca onlycrabs.ai üzerinde gösterilen `SOUL.md` paketleri | Web ve API yayımlama akışları                |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini, dosyaları,
indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Genel sayfalar mevcut kayıt deposu
durumunu gösterir; böylece kullanıcılar yüklemeden önce bir Skill veya Plugin'i inceleyebilir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükler ve sonraki güncelleme
komutlarının ClawHub üzerinde kalabilmesi için kaynak meta verilerini kalıcı hale getirir.

Bir Plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde `clawhub:<package>` kullanın.
Çıplak npm açısından güvenli Plugin belirtimleri, başlatma geçişleri sırasında npm üzerinden çözümlenebilir ve
bir kaynağın açık olması gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce duyurulan `pluginApi` ve `minGatewayVersion`
uyumluluğunu doğrular. Bir paket sürümü bir ClawPack artefaktı yayımladığında, OpenClaw tam olarak
yüklenen npm-pack `.tgz` dosyasını tercih eder, ClawHub özet üstbilgisini ve indirilen baytları doğrular ve
sonraki güncellemeler için artefakt meta verilerini kaydeder.

## ClawHub CLI

ClawHub CLI, kayıt deposu kimliği doğrulanmış işler içindir:

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

Bu komutlar, Skills’i geçerli çalışma dizini altındaki `./skills` içine yükler
ve yüklü sürümleri `.clawhub/lock.json` içinde kaydeder.

## Yayımlama

Skills’i `SKILL.md` içeren yerel bir klasörden yayımlayın:

```bash
clawhub skill publish <path>
```

Yaygın yayımlama seçenekleri:

- `--slug <slug>`: Skill slug’ı.
- `--name <name>`: görünen ad.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: değişiklik günlüğü metni.
- `--tags <tags>`: virgülle ayrılmış etiketler, varsayılan olarak `latest`.

Plugin'ları yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub
URL’sinden yayımlayın:

```bash
clawhub package publish <source>
```

Yükleme yapmadan tam yayımlama planını oluşturmak için `--dry-run` ve CI dostu çıktı için `--json`
kullanın.

Kod Plugin'ları, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk meta verilerini
içermelidir. Tam komut başvurusu için [CLI](/tr/clawhub/cli) ve Skill meta verileri için
[Skill biçimi](/tr/clawhub/skill-format) sayfasına bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama için yükleme kapısından
geçecek kadar eski bir GitHub hesabı gerekir. Genel ayrıntı sayfaları, yükleme veya indirmeden önce
en son tarama durumunu özetler.

ClawHub, yayımlanan Skills ve Plugin sürümleri üzerinde otomatik denetimler çalıştırır. Tarama nedeniyle bekletilen
veya engellenen sürümler, sahiplerine `/dashboard` içinde görünür kalırken genel katalog ve yükleme yüzeylerinden
kaybolabilir.

Sahipler, yanlış pozitifleri gidermek için sınırlı yeniden taramalar isteyebilir. Platform
moderatörleri ve yöneticileri, destek raporlarını ele alırken herhangi bir Skill veya paket için
yeniden tarama isteyebilir:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Oturum açmış kullanıcılar Skills ve paketleri bildirebilir. Moderatörler raporları inceleyebilir,
içeriği gizleyebilir veya geri yükleyebilir, itirazları çözebilir ve kötüye kullanan hesapları yasaklayabilir. İlke ve uygulama ayrıntıları için
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) ve
[Güvenlik + moderasyon](/tr/clawhub/security) sayfalarına bakın.

## Telemetri ve ortam

Oturum açıkken `clawhub sync` çalıştırdığınızda, CLI ClawHub’ın yükleme sayılarını hesaplayabilmesi için
asgari bir anlık görüntü gönderir. Bunu şununla devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Kullanışlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Tarayıcı oturum açması için kullanılan site URL’sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`            | Kayıt deposu API URL’sini geçersiz kılar.         |
| `CLAWHUB_CONFIG_PATH`         | CLI’ın token/yapılandırma durumunu sakladığı konumu geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılar.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` üzerinde telemetriyi devre dışı bırakır.   |

Daha ayrıntılı başvuru materyali için [Telemetri](/tr/clawhub/telemetry), [HTTP API](/tr/clawhub/http-api) ve
[Sorun giderme](/tr/clawhub/troubleshooting) sayfalarına bakın.

---
read_when:
    - ClawHub'ın ne olduğunu açıklama
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin'leri kayıt defterinde yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Keşif, kurulum, yayımlama, güvenlik ve clawhub CLI için genel ClawHub tanıtımı.
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T12:08:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw Skills ve Plugin'leri için herkese açık kayıt merkezidir.

- Skills aramak, yüklemek ve güncellemek; ayrıca ClawHub'dan Plugin yüklemek için yerleşik `openclaw` komutlarını kullanın.
- Kayıt merkezi kimlik doğrulaması, yayımlama ve silme/silmeyi geri alma iş akışları için ayrı `clawhub` CLI'ını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile Skills arayın ve yükleyin:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw ile Plugin'leri arayın ve yükleyin:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Yayımlama veya silme/silmeyi geri alma gibi kayıt merkezi kimlik doğrulaması gerektiren iş akışlarını kullanmak istediğinizde ClawHub CLI'ını yükleyin:

```bash
npm i -g clawhub
# veya
pnpm add -g clawhub
```

## ClawHub'ın barındırdığı içerikler

| Yüzey             | Sakladığı içerik                                               | Tipik komut                                  |
| ----------------- | -------------------------------------------------------------- | -------------------------------------------- |
| Skills            | `SKILL.md` ve destekleyici dosyalardan oluşan sürümlü metin paketleri | `openclaw skills install @openclaw/demo`     |
| Kod Plugin'leri   | Uyumluluk meta verileri içeren OpenClaw Plugin paketleri       | `openclaw plugins install clawhub:<package>` |
| Paket Plugin'leri | OpenClaw dağıtımı için paketlenmiş Plugin paketleri            | `clawhub package publish <source>`           |

ClawHub; semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini, dosyaları, indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Herkese açık sayfalar, kullanıcıların bir Skill veya Plugin'i yüklemeden önce inceleyebilmesi için kayıt merkezinin güncel durumunu gösterir.

## Yerleşik OpenClaw akışları

Yerleşik OpenClaw komutları, etkin OpenClaw çalışma alanına yükleme yapar ve sonraki güncelleme komutlarının ClawHub'ı kullanmaya devam edebilmesi için kaynak meta verilerini kalıcı olarak kaydeder.

Bir Plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde `clawhub:<package>` kullanın. Yalın, npm açısından güvenli Plugin belirtimleri, kullanıma geçiş dönemlerinde npm üzerinden çözümlenebilir; kaynağın açıkça belirtilmesi gerektiğinde ise `npm:<package>` yalnızca npm'i kullanır.

Plugin yüklemeleri, arşiv yüklemesi çalıştırılmadan önce bildirilen `pluginApi` ve `minGatewayVersion` uyumluluğunu doğrular. Bir paket sürümü ClawPack yapıtı yayımladığında OpenClaw, yüklenen tam npm-pack `.tgz` dosyasını tercih eder, ClawHub özet üstbilgisini ve indirilen baytları doğrular ve sonraki güncellemeler için yapıt meta verilerini kaydeder.

## ClawHub CLI

ClawHub CLI, kayıt merkezi kimlik doğrulaması gerektiren işlemler içindir:

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

CLI ayrıca doğrudan kayıt merkezi iş akışları için Skill yükleme/güncelleme komutlarına sahiptir:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Bu komutlar Skills'i geçerli çalışma dizini altındaki `./skills` dizinine yükler ve yüklü sürümleri `.clawhub/lock.json` dosyasına kaydeder.

## Yayımlama

Skills'i `SKILL.md` içeren yerel bir klasörden yayımlayın:

```bash
clawhub skill publish <path>
```

Yaygın yayımlama seçenekleri:

- `--slug <slug>`: yayımlanan Skill'in URL adı.
- `--name <name>`: görünen ad.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: değişiklik günlüğü metni.
- `--tags <tags>`: virgülle ayrılmış etiketler; varsayılan değer `latest` olur.

Plugin'leri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub URL'sinden yayımlayın:

```bash
clawhub package publish <source>
```

Yükleme yapmadan tam yayımlama planını oluşturmak için `--dry-run`, CI uyumlu çıktı için `--json` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dâhil olmak üzere gerekli OpenClaw uyumluluk meta verilerini içermelidir. Tüm komut başvurusu için [CLI](/tr/clawhub/cli), Skill meta verileri için [Skill biçimi](/clawhub/skill-format) bölümüne bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama işlemi yükleme denetimini geçecek kadar eski bir GitHub hesabı gerektirir. Herkese açık ayrıntı sayfaları, yükleme veya indirme öncesinde en son tarama durumunu özetler.

ClawHub, yayımlanan Skills ve Plugin sürümleri üzerinde otomatik denetimler çalıştırır. Tarama nedeniyle bekletilen veya engellenen sürümler, sahipleri tarafından `/dashboard` içinde görünmeye devam ederken herkese açık katalogdan ve yükleme yüzeylerinden kaldırılabilir.

Oturum açmış kullanıcılar Skills ve paketleri bildirebilir. Moderatörler bildirimleri inceleyebilir, içerikleri gizleyebilir veya geri yükleyebilir ve kötüye kullanımda bulunan hesapları yasaklayabilir. İlke ve yaptırım ayrıntıları için [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/tr/clawhub/security-audits), [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) ve [Kabul Edilebilir Kullanım](/clawhub/acceptable-usage) bölümlerine bakın.

## Telemetri ve ortam

Oturum açmış durumdayken `clawhub install` komutunu çalıştırdığınızda CLI, ClawHub'ın toplam yükleme sayılarını hesaplayabilmesi için en iyi çaba esasına göre bir yükleme olayı gönderebilir. Bunu şu şekilde devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Yararlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                                      |
| ----------------------------- | --------------------------------------------------------- |
| `CLAWHUB_SITE`                | Tarayıcıyla oturum açmak için kullanılan site URL'sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`            | Kayıt merkezi API URL'sini geçersiz kılar.                |
| `CLAWHUB_CONFIG_PATH`         | CLI'ın belirteç/yapılandırma durumunu sakladığı konumu geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılar.               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Yükleme telemetrisini devre dışı bırakır.                 |

Daha ayrıntılı başvuru materyalleri için [Telemetri](/tr/clawhub/telemetry), [HTTP API](/clawhub/http-api) ve [Sorun Giderme](/clawhub/troubleshooting) bölümlerine bakın.

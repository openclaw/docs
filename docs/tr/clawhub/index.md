---
read_when:
    - ClawHub’ın ne olduğunu açıklama
    - Skills veya Plugin'leri arama, yükleme ya da güncelleme
    - Kayıt defterine Skills veya Plugin yayımlama
    - openclaw ve clawhub CLI akışları arasında seçim yapma
sidebarTitle: ClawHub
summary: Keşif, kurulum, yayımlama, güvenlik ve clawhub CLI için herkese açık ClawHub genel bakışı.
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T00:18:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub, OpenClaw becerileri ve Plugin'leri için genel kayıt deposudur.

- ClawHub'da becerileri aramak, yüklemek ve güncellemek ve Plugin'leri yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt kimlik doğrulaması, yayımlama ve silme/silmeyi geri alma iş akışları için ayrı `clawhub` CLI'sını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

OpenClaw ile becerileri arayın ve yükleyin:

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

Yayımlama veya silme/silmeyi geri alma gibi kayıt kimlik doğrulamalı iş akışları istediğinizde ClawHub CLI'sını yükleyin:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub neleri barındırır

| Yüzey           | Sakladığı içerik                                                      | Tipik komut                                  |
| --------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| Skills          | `SKILL.md` ve destekleyici dosyalar içeren sürümlenmiş metin paketleri | `openclaw skills install @openclaw/demo`     |
| Kod Plugin'leri | Uyumluluk meta verileri olan OpenClaw Plugin paketleri                | `openclaw plugins install clawhub:<package>` |
| Paket Plugin'leri | OpenClaw dağıtımı için paketlenmiş Plugin paketleri                 | `clawhub package publish <source>`           |

ClawHub semver sürümlerini, `latest` gibi etiketleri, değişiklik günlüklerini, dosyaları, indirmeleri, yıldızları ve güvenlik taraması özetlerini izler. Genel sayfalar mevcut kayıt deposu durumunu gösterir; böylece kullanıcılar bir beceriyi veya Plugin'i yüklemeden önce inceleyebilir.

## Yerel OpenClaw akışları

Yerel OpenClaw komutları etkin OpenClaw çalışma alanına yükleme yapar ve kaynak meta verilerini kalıcı olarak kaydeder; böylece sonraki güncelleme komutları ClawHub üzerinde kalabilir.

Bir Plugin yüklemesinin ClawHub üzerinden çözümlenmesi gerektiğinde `clawhub:<package>` kullanın. Çıplak npm uyumlu Plugin belirtimleri, lansman geçişleri sırasında npm üzerinden çözümlenebilir ve bir kaynağın açıkça belirtilmesi gerektiğinde `npm:<package>` yalnızca npm olarak kalır.

Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce bildirilen `pluginApi` ve `minGatewayVersion` uyumluluğunu doğrular. Bir paket sürümü bir ClawPack yapıtı yayımladığında OpenClaw, tam olarak yüklenen npm-pack `.tgz` dosyasını tercih eder, ClawHub özet başlığını ve indirilen baytları doğrular ve sonraki güncellemeler için yapıt meta verilerini kaydeder.

## ClawHub CLI

ClawHub CLI, kayıt kimlik doğrulamalı işler içindir:

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

CLI'da doğrudan kayıt deposu iş akışları için beceri yükleme/güncelleme komutları da bulunur:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Bu komutlar becerileri geçerli çalışma dizini altındaki `./skills` içine yükler ve yüklü sürümleri `.clawhub/lock.json` içinde kaydeder.

## Yayımlama

Becerileri `SKILL.md` içeren yerel bir klasörden yayımlayın:

```bash
clawhub skill publish <path>
```

Yaygın yayımlama seçenekleri:

- `--slug <slug>`: yayımlanan becerinin URL adı.
- `--name <name>`: görüntü adı.
- `--version <version>`: semver sürümü.
- `--changelog <text>`: değişiklik günlüğü metni.
- `--tags <tags>`: virgülle ayrılmış etiketler; varsayılan olarak `latest`.

Plugin'leri yerel bir klasörden, `owner/repo`, `owner/repo@ref` veya bir GitHub URL'sinden yayımlayın:

```bash
clawhub package publish <source>
```

Yükleme yapmadan tam yayımlama planını oluşturmak için `--dry-run`, CI dostu çıktı için `--json` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere gerekli OpenClaw uyumluluk meta verilerini içermelidir. Tam komut başvurusu için [CLI](/tr/clawhub/cli), beceri meta verileri için [Beceri biçimi](/tr/clawhub/skill-format) bölümüne bakın.

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır: herkes yükleme yapabilir, ancak yayımlama için yükleme geçidini geçecek kadar eski bir GitHub hesabı gerekir. Genel ayrıntı sayfaları, yükleme veya indirme öncesinde en son tarama durumunu özetler.

ClawHub, yayımlanan beceriler ve Plugin sürümleri üzerinde otomatik denetimler çalıştırır. Taramada tutulan veya engellenen sürümler, sahiplerine `/dashboard` içinde görünür kalırken genel katalogdan ve yükleme yüzeylerinden kaybolabilir.

Oturum açmış kullanıcılar becerileri ve paketleri bildirebilir. Moderatörler bildirimleri inceleyebilir, içeriği gizleyebilir veya geri yükleyebilir ve kötüye kullanım yapan hesapları yasaklayabilir. Politika ve yaptırım ayrıntıları için [Güvenlik](/tr/clawhub/security), [Güvenlik denetimleri](/tr/clawhub/security-audits), [Moderasyon ve hesap güvenliği](/tr/clawhub/moderation) ve [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) bölümlerine bakın.

## Telemetri ve ortam

Oturum açmışken `clawhub install` çalıştırdığınızda CLI, ClawHub'ın toplam yükleme sayılarını hesaplayabilmesi için en iyi çabayla bir yükleme olayı gönderebilir. Bunu şu şekilde devre dışı bırakın:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Yararlı ortam geçersiz kılmaları:

| Değişken                      | Etki                                             |
| ----------------------------- | ------------------------------------------------ |
| `CLAWHUB_SITE`                | Tarayıcı oturum açması için kullanılan site URL'sini geçersiz kılar. |
| `CLAWHUB_REGISTRY`            | Kayıt deposu API URL'sini geçersiz kılar.        |
| `CLAWHUB_CONFIG_PATH`         | CLI'nın token/yapılandırma durumunu depoladığı yeri geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılar.      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Yükleme telemetrisini devre dışı bırakır.        |

Daha derin başvuru materyali için [Telemetri](/tr/clawhub/telemetry), [HTTP API](/tr/clawhub/http-api) ve [Sorun giderme](/tr/clawhub/troubleshooting) bölümlerine bakın.

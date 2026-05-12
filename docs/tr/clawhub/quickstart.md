---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden bir beceri veya Plugin yükleme
    - ClawHub'a Yayımlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-05-12T04:09:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw becerileri ve plugin'leri için bir kayıt deposudur.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken, yayınlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş akışlarını kullanırken `clawhub` CLI'ını kullanın.

## Bir beceri bulma ve kurma

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir beceri kurun:

```bash
openclaw skills install <skill-slug>
```

Kurulu becerileri güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, becerinin nereden geldiğini kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlemeye devam edebilir.

## Bir plugin bulma ve kurma

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

ClawHub'da barındırılan bir plugin'i açık bir ClawHub kaynağıyla kurun:

```bash
openclaw plugins install clawhub:<package>
```

Kurulu plugin'leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açma

ClawHub CLI'ını kurun:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

GitHub ile oturum açın:

```bash
clawhub login
clawhub whoami
```

Başsız ortamlar, ClawHub web kullanıcı arayüzünden bir API belirteci kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir beceri yayınlama

Beceri, zorunlu bir `SKILL.md` dosyası ve isteğe bağlı destek dosyaları içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların beceriyi kurmadan önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam değişkenlerini, araçları ve izinleri bildirin. Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

## Bir plugin yayınlama

Yerel bir klasörden, bir GitHub reposundan, bir GitHub ref'inden veya mevcut bir arşivden plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod plugin'leri, `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere `package.json` içinde OpenClaw uyumluluk meta verileri içermelidir.

## Bakımını yaptığınız becerileri eşitleme

`sync`, beceri klasörlerini tarar ve henüz eşitlenmemiş yeni veya değişmiş becerileri yayınlar.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Oturum açtığınızda `sync`, toplu kurulum sayıları için asgari bir kurulum anlık görüntüsü de gönderebilir. Neyin raporlandığı ve nasıl devre dışı bırakılacağı için bkz. [Telemetri](/tr/clawhub/telemetry).

## Kurmadan önce inceleme

Kurulumdan önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından bekletilen veya engellenen sürümler, çözülene kadar arama ve kurulum yüzeylerinden gizlenebilir.

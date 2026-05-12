---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt deposundan bir beceri veya Plugin yükleme
    - ClawHub üzerinde yayımlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin’leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-05-12T00:57:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw Skills ve Plugin'leri için bir kayıt defteridir.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken, yayınlarken, kendi listelemelerinizi yönetirken veya kayıt defterine özgü iş akışlarını kullanırken `clawhub` CLI'ını kullanın.

## Bir skill bulun ve kurun

OpenClaw'dan arama yapın:

```bash
openclaw skills search "calendar"
```

Bir skill kurun:

```bash
openclaw skills install <skill-slug>
```

Kurulu skills'i güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, skill'in nereden geldiğini kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlemeye devam edebilir.

## Bir Plugin bulun ve kurun

OpenClaw'dan arama yapın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub'da barındırılan bir Plugin kurun:

```bash
openclaw plugins install clawhub:<package>
```

Kurulu Plugin'leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açın

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

Başsız ortamlar, ClawHub web kullanıcı arayüzünden alınan bir API belirtecini kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir skill yayınlayın

Bir skill, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destekleyici dosyalar içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların skill'i kurmadan önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam değişkenlerini, araçları ve izinleri bildirin. Bkz. [Skill formatı](/tr/clawhub/skill-format).

## Bir Plugin yayınlayın

Yerel bir klasörden, bir GitHub deposundan, bir GitHub ref'inden veya mevcut bir arşivden bir Plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk meta verilerini içermelidir.

## Bakımını yaptığınız skills'i eşitleyin

`sync`, skill klasörlerini tarar ve zaten eşitlenmemiş yeni veya değiştirilmiş skills'i yayınlar.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Oturum açtığınızda, `sync` toplu kurulum sayıları için en küçük kapsamlı bir kurulum anlık görüntüsü de gönderebilir. Nelerin bildirildiği ve nasıl devre dışı bırakılacağı için bkz. [Telemetri](/tr/clawhub/telemetry).

## Kurmadan önce inceleyin

Kurulumdan önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından bekletilen veya engellenen sürümler, çözümlenene kadar arama ve kurulum yüzeylerinden gizlenebilir.

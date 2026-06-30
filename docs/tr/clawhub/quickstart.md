---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt deposundan bir beceri veya Plugin yükleme
    - ClawHub'da Yayınlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, kurun, güncelleyin ve yayınlayın.'
x-i18n:
    generated_at: "2026-06-30T22:29:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı başlangıç

ClawHub, OpenClaw Skills ve Plugin kayıt yeridir.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken, yayınlarken, kendi listelemelerinizi yönetirken veya kayıt yerine özgü iş akışlarını kullanırken `clawhub` CLI kullanın.

## Bir skill bulma ve kurma

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir skill kurun:

```bash
openclaw skills install @openclaw/demo
```

Kurulu skills öğelerini güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, skill kaynağını kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlenmeye devam edebilir.

## Bir plugin bulma ve kurma

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub üzerinde barındırılan bir plugin kurun:

```bash
openclaw plugins install clawhub:<package>
```

Kurulu plugin öğelerini güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açma

ClawHub CLI kurun:

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

## Bir skill yayınlama

Skill, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destekleyici dosyalar içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni skills öğeleri `1.0.0` sürümünden başlar; sonraki değişiklikler otomatik olarak bir sonraki yama sürümünü yayınlar. Önizleme yapmak için `--dry-run`, açık bir sürüm seçmek için `--version` kullanın.

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların skill kurmadan önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam değişkenlerini, araçları ve izinleri bildirin. Bkz. [Skill biçimi](/tr/clawhub/skill-format).

Birden çok skill içeren depolarda, yeniden kullanılabilir GitHub iş akışı `skills/` altındaki her doğrudan skill klasörü için `skill publish` çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir plugin yayınlama

Yerel bir klasörden, GitHub deposundan, GitHub ref değerinden veya mevcut bir arşivden plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod plugin öğeleri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk meta verilerini içermelidir.

## Kurmadan önce inceleme

Kurulumdan önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Denetim tarafından bekletilen veya engellenen sürümler, çözümlenene kadar arama ve kurulum yüzeylerinden gizlenebilir.

---
read_when:
    - ClawHub’ı ilk kez kullanma
    - Kayıt deposundan bir Skill veya Plugin yükleme
    - ClawHub'a Yayınlama
summary: 'ClawHub’ı kullanmaya başlayın: skills veya plugins bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-03T02:54:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw Skills ve Plugin'leri için bir kayıt defteridir.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken, yayımlarken, kendi listelemelerinizi yönetirken veya kayıt defterine özgü iş akışlarını kullanırken `clawhub` CLI kullanın.

## Bir Skill bulma ve kurma

OpenClaw içinden arayın:

```bash
openclaw skills search "calendar"
```

Bir Skill kurun:

```bash
openclaw skills install @openclaw/demo
```

Kurulu Skills'i güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, Skill'in nereden geldiğini kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlenmeye devam edebilir.

## Bir Plugin bulma ve kurma

OpenClaw içinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub üzerinde barındırılan bir Plugin kurun:

```bash
openclaw plugins install clawhub:<package>
```

Kurulu Plugin'leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözümlemesini istediğinizde `clawhub:` ön ekini kullanın.

## Yayımlama için oturum açma

ClawHub CLI'ı kurun:

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

## Bir Skill yayımlama

Skill, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destek dosyaları içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni Skills `1.0.0` sürümünden başlar; sonraki değişiklikler otomatik olarak bir sonraki yama sürümünü yayımlar. Önizleme yapmak için `--dry-run`, açık bir sürüm seçmek için `--version` kullanın.

Yayımlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Gerekli ortam değişkenlerini, araçları ve izinleri bildirin; böylece kullanıcılar Skill'i kurmadan önce neye ihtiyaç duyduğunu anlayabilir. Bkz. [Skill biçimi](/tr/clawhub/skill-format).

Birden çok Skill içeren depolar için yeniden kullanılabilir GitHub iş akışı, `skills/` altındaki her bir doğrudan Skill klasörü için `skill publish` çağrısı yapar:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir Plugin yayımlama

Yerel bir klasörden, GitHub deposundan, GitHub ref'inden veya mevcut bir arşivden Plugin yayımlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yayımlamadan önce çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak ilişkilendirmesini ve yükleme planını önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk meta verilerini içermelidir.

## Kurmadan önce inceleme

Kurulumdan önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon nedeniyle bekletilen veya engellenen sürümler, çözülene kadar arama ve kurulum yüzeylerinden gizlenebilir.

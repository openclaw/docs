---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden bir skill veya plugin yükleme
    - ClawHub'da Yayımlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-12T11:32:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı başlangıç

ClawHub, OpenClaw Skills ve Plugin'leri için bir kayıt deposudur.

OpenClaw'a bir şeyler yüklerken OpenClaw'ı kullanın. Oturum açarken, yayınlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş akışlarını kullanırken `clawhub` CLI'ını kullanın.

## Bir Skill bulma ve yükleme

OpenClaw'dan arayın:

```bash
openclaw skills search "calendar"
```

Bir Skill yükleyin:

```bash
openclaw skills install @openclaw/demo
```

Yüklü Skills öğelerini güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, sonraki güncellemelerin ClawHub üzerinden çözülmeye devam edebilmesi için Skill'in nereden geldiğini kaydeder.

## Bir Plugin bulma ve yükleme

OpenClaw'dan arayın:

```bash
openclaw plugins search "calendar"
```

ClawHub'da barındırılan bir Plugin'i açık bir ClawHub kaynağıyla yükleyin:

```bash
openclaw plugins install clawhub:<package>
```

Yüklü Plugin'leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözmesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açma

ClawHub CLI'ını yükleyin:

```bash
npm i -g clawhub
# veya
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

## Bir Skill yayınlama

Bir Skill, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destekleyici dosyalar içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni Skills öğeleri `1.0.0` sürümünden başlar; sonraki değişiklikler bir sonraki yama sürümünü otomatik olarak yayınlar. Önizleme için `--dry-run`, belirli bir sürüm seçmek için `--version` kullanın.

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların Skill'i yüklemeden önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam değişkenlerini, araçları ve izinleri belirtin. Bkz. [Skill biçimi](/tr/clawhub/skill-format).

Birden fazla Skill içeren depolarda yeniden kullanılabilir GitHub iş akışı, `skills/` altındaki her bir doğrudan Skill klasörü için `skill publish` komutunu çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir Plugin yayınlama

Yerel bir klasörden, GitHub deposundan, GitHub referansından veya mevcut bir arşivden Plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dâhil olmak üzere `package.json` içinde OpenClaw uyumluluk meta verilerini içermelidir.

## Yüklemeden önce inceleme

Yüklemeden önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından bekletilen veya engellenen sürümler, sorun çözülene kadar arama ve yükleme yüzeylerinden gizlenebilir.

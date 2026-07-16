---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden bir Skills veya Plugin yükleme
    - ClawHub'da Yayımlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-16T16:54:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı başlangıç

ClawHub, OpenClaw Skills ve Plugin'leri için bir kayıt deposudur.

OpenClaw'a bir şeyler yüklerken OpenClaw'ı kullanın. Oturum açarken, yayımlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş akışlarını kullanırken `clawhub` CLI'ı kullanın.

## Bir skill bulma ve yükleme

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir skill yükleyin:

```bash
openclaw skills install @openclaw/demo
```

Yüklü skill'leri güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, sonraki güncellemelerin ClawHub üzerinden çözümlenmeye devam edebilmesi için skill'in nereden geldiğini kaydeder.

## Bir plugin bulma ve yükleme

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

ClawHub'da barındırılan bir plugin'i açıkça belirtilmiş bir ClawHub kaynağıyla yükleyin:

```bash
openclaw plugins install clawhub:<package>
```

Yüklü plugin'leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözümlemesini istediğinizde `clawhub:` ön ekini kullanın.

## Yayımlamak için oturum açma

ClawHub CLI'ı yükleyin:

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

## Bir skill yayımlama

Skill, zorunlu bir `SKILL.md` dosyası ile isteğe bağlı destekleyici dosyalar içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni skill'ler `1.0.0` sürümünden başlar; sonraki değişikliklerde bir sonraki yama sürümü otomatik olarak yayımlanır. Önizleme için `--dry-run`, açıkça bir sürüm seçmek için ise `--version` kullanın.

Yayımlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların skill'i yüklemeden önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam değişkenlerini, araçları ve izinleri bildirin. Bkz. [Skill biçimi](/tr/clawhub/skill-format).

Birden fazla skill içeren depolarda, yeniden kullanılabilir GitHub iş akışı `skills/` altındaki her doğrudan skill klasörü için `skill publish` çağrısını yapar:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir plugin yayımlama

Yerel bir klasörden, GitHub deposundan, GitHub referansından veya mevcut bir arşivden plugin yayımlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yayımlama yapmadan çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme planını önizlemek için önce `--dry-run` kullanın.

Kod plugin'leri, `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere `package.json` içinde OpenClaw uyumluluk meta verilerini içermelidir.

## Yüklemeden önce inceleme

Yüklemeden önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından bekletilen veya engellenen sürümler, sorun çözülene kadar arama ve yükleme yüzeylerinde gizlenebilir.

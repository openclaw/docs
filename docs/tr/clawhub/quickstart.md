---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden bir beceri veya Plugin yükleme
    - ClawHub'a Yayımlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-01T13:16:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı başlangıç

ClawHub, OpenClaw Skills ve Plugin'leri için bir kayıt deposudur.

OpenClaw içine bir şeyler yüklerken OpenClaw kullanın. Oturum açarken, yayımlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş akışlarını kullanırken `clawhub` CLI kullanın.

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

OpenClaw, skill'in nereden geldiğini kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlemeye devam edebilir.

## Bir plugin bulma ve yükleme

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub üzerinde barındırılan bir plugin yükleyin:

```bash
openclaw plugins install clawhub:<package>
```

Yüklü plugin'leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayımlamak için oturum açma

ClawHub CLI yükleyin:

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

Headless ortamlar, ClawHub web kullanıcı arayüzünden bir API token kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir skill yayımlama

Skill, gerekli bir `SKILL.md` dosyasına ve isteğe bağlı destek dosyalarına sahip bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni skill'ler `1.0.0` ile başlar; sonraki değişiklikler otomatik olarak bir sonraki yama sürümünü yayımlar. Önizlemek için `--dry-run` kullanın veya açık bir sürüm seçmek için `--version` kullanın.

Yayımlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların yüklemeden önce skill'in neye ihtiyaç duyduğunu anlayabilmeleri için gerekli ortam değişkenlerini, araçları ve izinleri bildirin. Bkz. [Skill biçimi](/tr/clawhub/skill-format).

Birden fazla skill içeren depolar için yeniden kullanılabilir GitHub iş akışı, `skills/` altındaki her doğrudan skill klasörü için `skill publish` çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir plugin yayımlama

Yerel bir klasörden, GitHub deposundan, GitHub ref'inden veya mevcut bir arşivden bir plugin yayımlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yayımlamadan, çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme planını önizlemek için önce `--dry-run` kullanın.

Kod plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk meta verilerini içermelidir.

## Yüklemeden önce inceleme

Yüklemeden önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından tutulan veya engellenen sürümler, çözülene kadar arama ve yükleme yüzeylerinden gizlenebilir.

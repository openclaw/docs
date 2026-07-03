---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden bir skill veya plugin yükleme
    - ClawHub'da Yayınlama
summary: 'ClawHub’ı kullanmaya başlayın: Skills veya Pluginleri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-03T09:52:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw Skills ve pluginleri için bir kayıt defteridir.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken, yayımlarken, kendi listelemelerinizi yönetirken veya kayıt defterine özgü iş akışlarını kullanırken `clawhub` CLI kullanın.

## Bir skill bulma ve kurma

OpenClaw üzerinden arama yapın:

```bash
openclaw skills search "calendar"
```

Bir skill kurun:

```bash
openclaw skills install @openclaw/demo
```

Kurulu skillleri güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, skillin nereden geldiğini kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlemeye devam edebilir.

## Bir plugin bulma ve kurma

OpenClaw üzerinden arama yapın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla, ClawHub üzerinde barındırılan bir plugin kurun:

```bash
openclaw plugins install clawhub:<package>
```

Kurulu pluginleri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw’ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayımlama için oturum açma

ClawHub CLI’yi kurun:

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

Başsız ortamlar, ClawHub web kullanıcı arayüzünden alınan bir API tokeni kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir skill yayımlama

Skill, zorunlu bir `SKILL.md` dosyası ve isteğe bağlı destek dosyaları içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni skilller `1.0.0` sürümünden başlar; sonraki değişiklikler otomatik olarak bir sonraki yama sürümünü yayımlar. Önizleme yapmak için `--dry-run`, açık bir sürüm seçmek için `--version` kullanın.

Yayımlamadan önce `SKILL.md` içindeki metadata’yı kontrol edin. Kullanıcıların skill’i kurmadan önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam değişkenlerini, araçları ve izinleri belirtin. Bkz. [Skill formatı](/tr/clawhub/skill-format).

Birden fazla skill içeren depolarda, yeniden kullanılabilir GitHub iş akışı `skills/` altındaki her doğrudan skill klasörü için `skill publish` çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir plugin yayımlama

Yerel bir klasörden, GitHub deposundan, GitHub ref’inden veya mevcut bir arşivden plugin yayımlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket metadata’sını, uyumluluk alanlarını, kaynak atfını ve yükleme planını yayımlamadan önizlemek için önce `--dry-run` kullanın.

Kod pluginleri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk metadata’sı içermelidir.

## Kurmadan önce inceleme

Kurulumdan önce metadata’yı, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından bekletilen veya engellenen sürümler, çözülene kadar arama ve kurulum yüzeylerinden gizlenebilir.

---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt deposundan Skills veya Plugin yükleme
    - ClawHub’a Yayınlama
summary: 'ClawHub''ı kullanmaya başlayın: becerileri veya Plugin''leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-02T01:10:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw Skills ve Plugin kayıt defteridir.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken, yayınlarken, kendi listelemelerinizi yönetirken veya kayıt defterine özgü iş akışlarını kullanırken `clawhub` CLI kullanın.

## Bir skill bulun ve kurun

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir skill kurun:

```bash
openclaw skills install @openclaw/demo
```

Kurulu Skills öğelerini güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, skill’in nereden geldiğini kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlemeye devam edebilir.

## Bir plugin bulun ve kurun

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub’da barındırılan bir plugin kurun:

```bash
openclaw plugins install clawhub:<package>
```

Kurulu plugin’leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw’ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözmesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açın

ClawHub CLI’yı kurun:

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

Başsız ortamlar, ClawHub web kullanıcı arayüzünden bir API token kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir skill yayınlayın

Bir skill, zorunlu bir `SKILL.md` dosyası ve isteğe bağlı destekleyici dosyalar içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni Skills `1.0.0` ile başlar; sonraki değişiklikler bir sonraki yama sürümünü otomatik olarak yayınlar. Önizleme için `--dry-run` veya açık bir sürüm seçmek için `--version` kullanın.

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların skill’i kurmadan önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam değişkenlerini, araçları ve izinleri bildirin. Bkz. [Skill biçimi](/tr/clawhub/skill-format).

Birden fazla skill içeren depolar için yeniden kullanılabilir GitHub iş akışı, `skills/` altındaki her bir doğrudan skill klasörü için `skill publish` çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir plugin yayınlayın

Yerel bir klasörden, GitHub deposundan, GitHub ref’inden veya mevcut bir arşivden bir plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak ilişkilendirmesini ve yükleme planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod plugin’leri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil OpenClaw uyumluluk meta verilerini içermelidir.

## Kurmadan önce inceleyin

Kurulumdan önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından bekletilen veya engellenen sürümler, çözülene kadar arama ve kurulum yüzeylerinden gizlenebilir.

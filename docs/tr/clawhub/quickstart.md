---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden Skills veya Plugin yükleme
    - ClawHub'a Yayınlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-01T15:30:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw Skills ve Plugin'leri için bir kayıt defteridir.

OpenClaw içine bir şeyler yüklerken OpenClaw kullanın. Oturum açarken,
yayımlarken, kendi listelemelerinizi yönetirken veya kayıt defterine özgü iş
akışlarını kullanırken `clawhub` CLI'yi kullanın.

## Bir Skill bulun ve yükleyin

OpenClaw'dan arayın:

```bash
openclaw skills search "calendar"
```

Bir Skill yükleyin:

```bash
openclaw skills install @openclaw/demo
```

Yüklü Skills'i güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, Skill'in nereden geldiğini kaydeder; böylece sonraki güncellemeler
ClawHub üzerinden çözümlemeye devam edebilir.

## Bir Plugin bulun ve yükleyin

OpenClaw'dan arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub'da barındırılan bir Plugin yükleyin:

```bash
openclaw plugins install clawhub:<package>
```

Yüklü Plugin'leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözmesini
istediğinizde `clawhub:` önekini kullanın.

## Yayımlamak için oturum açın

ClawHub CLI'yi yükleyin:

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

Başsız ortamlar, ClawHub web kullanıcı arayüzünden alınan bir API belirteci
kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir Skill yayımlayın

Skill, zorunlu bir `SKILL.md` dosyası ve isteğe bağlı destekleyici dosyalar
içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni Skills `1.0.0` ile başlar; sonraki
değişiklikler bir sonraki yama sürümünü otomatik olarak yayımlar. Önizleme için
`--dry-run` veya açık bir sürüm seçmek için `--version` kullanın.

Yayımlamadan önce `SKILL.md` içindeki meta verileri denetleyin. Kullanıcıların
Skill'i yüklemeden önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam
değişkenlerini, araçları ve izinleri belirtin. Bkz. [Skill biçimi](/tr/clawhub/skill-format).

Birden fazla Skill içeren depolar için yeniden kullanılabilir GitHub iş akışı,
`skills/` altındaki her doğrudan Skill klasörü için `skill publish` çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir Plugin yayımlayın

Yerel bir klasörden, GitHub deposundan, GitHub ref'inden veya mevcut bir arşivden
Plugin yayımlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme
planını yayımlamadan önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil OpenClaw uyumluluk meta verilerini
içermelidir.

## Yüklemeden önce inceleyin

Yüklemeden önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik
günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI
ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon nedeniyle
bekletilen veya engellenen sürümler, çözülene kadar arama ve yükleme yüzeylerinden
gizlenebilir.

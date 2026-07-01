---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden Skills veya Plugin yükleme
    - ClawHub'a yayımlama
summary: 'ClawHub kullanmaya başlayın: skills veya plugins bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-01T08:26:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı başlangıç

ClawHub, OpenClaw Skills ve Plugin'leri için bir kayıt deposudur.

OpenClaw içine bir şeyler yüklerken OpenClaw kullanın. Oturum açarken,
yayınlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş
akışlarını kullanırken `clawhub` CLI aracını kullanın.

## Bir skill bulun ve yükleyin

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

OpenClaw, skill'in nereden geldiğini kaydeder; böylece sonraki güncellemeler
ClawHub üzerinden çözümlenmeye devam edebilir.

## Bir Plugin bulun ve yükleyin

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub üzerinde barındırılan bir Plugin yükleyin:

```bash
openclaw plugins install clawhub:<package>
```

Yüklü Plugin'leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden
çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlamak için oturum açın

ClawHub CLI aracını yükleyin:

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

Başsız ortamlar, ClawHub web kullanıcı arayüzünden alınan bir API token'ı
kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir skill yayınlayın

Bir skill, zorunlu bir `SKILL.md` dosyası ve isteğe bağlı destekleyici
dosyalar içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni skill'ler `1.0.0` ile başlar; sonraki
değişiklikler otomatik olarak bir sonraki yama sürümünü yayınlar. Önizleme için
`--dry-run` kullanın veya açık bir sürüm seçmek için `--version` kullanın.

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların
skill'i yüklemeden önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam
değişkenlerini, araçları ve izinleri beyan edin. Bkz. [Skill biçimi](/tr/clawhub/skill-format).

Birden fazla skill içeren depolar için yeniden kullanılabilir GitHub iş akışı,
`skills/` altındaki her doğrudan skill klasörü için `skill publish` çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir Plugin yayınlayın

Yerel bir klasörden, GitHub deposundan, GitHub ref'inden veya mevcut bir arşivden
Plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme
planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk meta
verilerini içermelidir.

## Yüklemeden önce inceleyin

Yüklemeden önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik
günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI
ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından
bekletilen veya engellenen yayınlar, çözülene kadar arama ve yükleme
yüzeylerinden gizlenebilir.

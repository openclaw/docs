---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden bir skill veya plugin yükleme
    - ClawHub'a Yayınlama
summary: 'ClawHub kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-05T07:57:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı başlangıç

ClawHub, OpenClaw becerileri ve Plugin'leri için bir kayıt deposudur.

OpenClaw içine bir şeyler yüklerken OpenClaw kullanın. Oturum açarken,
yayınlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş
akışlarını kullanırken `clawhub` CLI'yi kullanın.

## Bir beceri bulun ve yükleyin

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir beceri yükleyin:

```bash
openclaw skills install @openclaw/demo
```

Yüklü becerileri güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, becerinin nereden geldiğini kaydeder; böylece sonraki güncellemeler
ClawHub üzerinden çözümlemeye devam edebilir.

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

## Yayınlama için oturum açın

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

Başsız ortamlar, ClawHub web arayüzünden alınan bir API belirteci kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir beceri yayınlayın

Beceri, zorunlu bir `SKILL.md` dosyası ve isteğe bağlı destekleyici dosyalar
içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni beceriler `1.0.0` ile başlar; sonraki
değişiklikler otomatik olarak bir sonraki yama sürümünü yayınlar. Önizleme için
`--dry-run` veya açık bir sürüm seçmek için `--version` kullanın.

Yayınlamadan önce `SKILL.md` içindeki meta verileri denetleyin. Kullanıcıların
beceriyi yüklemeden önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam
değişkenlerini, araçları ve izinleri bildirin. Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

Birden fazla beceri içeren depolarda, yeniden kullanılabilir GitHub iş akışı
`skills/` altındaki her doğrudan beceri klasörü için `skill publish` çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir Plugin yayınlayın

Yerel bir klasörden, GitHub deposundan, GitHub ref'inden veya mevcut bir arşivden
bir Plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yayınlamadan önce çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak
atıflarını ve yükleme planını önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere `package.json` içinde
OpenClaw uyumluluk meta verilerini içermelidir.

## Yüklemeden önce inceleyin

Yüklemeden önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik
günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI
ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon nedeniyle
bekletilen veya engellenen sürümler, çözülene kadar arama ve yükleme
yüzeylerinden gizlenebilir.

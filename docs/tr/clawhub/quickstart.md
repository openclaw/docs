---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden Skills veya Plugin yükleme
    - ClawHub'a yayımlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-06-28T05:07:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı başlangıç

ClawHub, OpenClaw Skill ve Plugin öğeleri için bir kayıt deposudur.

OpenClaw içine bir şeyler yüklerken OpenClaw kullanın. Oturum açarken,
yayınlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş
akışlarını kullanırken `clawhub` CLI aracını kullanın.

## Bir Skill bulma ve yükleme

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir Skill yükleyin:

```bash
openclaw skills install @openclaw/demo
```

Yüklü Skill öğelerini güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, Skill öğesinin nereden geldiğini kaydeder; böylece sonraki
güncellemeler ClawHub üzerinden çözümlemeye devam edebilir.

## Bir Plugin bulma ve yükleme

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub üzerinde barındırılan bir Plugin yükleyin:

```bash
openclaw plugins install clawhub:<package>
```

Yüklü Plugin öğelerini güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden
çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açma

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

Başsız ortamlar, ClawHub web kullanıcı arayüzünden bir API belirteci kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir Skill yayınlama

Skill, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destek dosyaları içeren
bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni Skill öğeleri `1.0.0` sürümünden başlar;
sonraki değişiklikler otomatik olarak bir sonraki yama sürümünü yayınlar.
Önizleme yapmak için `--dry-run`, açık bir sürüm seçmek için `--version`
kullanın.

Yayınlamadan önce `SKILL.md` içindeki üst verileri kontrol edin. Kullanıcıların
Skill öğesini yüklemeden önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli
ortam değişkenlerini, araçları ve izinleri bildirin. Bkz.
[Skill biçimi](/tr/clawhub/skill-format).

Birden çok Skill içeren depolarda, yeniden kullanılabilir GitHub iş akışı
`skills/` altındaki her doğrudan Skill klasörü için `skill publish` çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir Plugin yayınlama

Yerel bir klasörden, GitHub deposundan, GitHub ref değerinden veya mevcut bir
arşivden Plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket üst verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme
planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod Plugin öğeleri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk üst
verilerini içermelidir.

## Yüklemeden önce inceleme

Yüklemeden önce üst verileri, kaynak bağlantılarını, sürümleri, değişiklik
günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI
ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon nedeniyle
bekletilen veya engellenen sürümler, sorun çözülene kadar arama ve yükleme
yüzeylerinden gizlenebilir.

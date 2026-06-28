---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden bir skill veya plugin yükleme
    - ClawHub’da Yayınlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-06-28T08:17:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw becerileri ve Plugin'leri için bir kayıt deposudur.

OpenClaw içine bir şeyler yüklerken OpenClaw kullanın. Oturum açarken,
yayımlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş
akışlarını kullanırken `clawhub` CLI'yi kullanın.

## Bir beceri bulma ve yükleme

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

## Bir Plugin bulma ve yükleme

OpenClaw üzerinden arayın:

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

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden
çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayımlama için oturum açma

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

## Bir beceri yayımlama

Beceri, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destek dosyaları içeren
bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni beceriler `1.0.0` ile başlar; sonraki
değişiklikler otomatik olarak bir sonraki yama sürümünü yayımlar. Önizleme için
`--dry-run`, açık bir sürüm seçmek için `--version` kullanın.

Yayımlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Gerekli ortam
değişkenlerini, araçları ve izinleri bildirin; böylece kullanıcılar beceriyi
yüklemeden önce neye ihtiyaç duyduğunu anlayabilir. Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

Birden fazla beceri içeren depolarda, yeniden kullanılabilir GitHub iş akışı
`skills/` altındaki her doğrudan beceri klasörü için `skill publish` çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir Plugin yayımlama

Yerel bir klasörden, GitHub deposundan, GitHub ref'inden veya mevcut bir
arşivden Plugin yayımlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme
planını yayımlamadan önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk meta
verilerini içermelidir.

## Yüklemeden önce inceleme

Yüklemeden önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik
günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI
ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon
tarafından bekletilen veya engellenen sürümler, çözülene kadar arama ve yükleme
yüzeylerinden gizlenebilir.

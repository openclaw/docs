---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden bir beceri veya Plugin yükleme
    - ClawHub'a Yayınlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-01T20:32:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw Skills ve Plugin'leri için bir kayıt defteridir.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken,
yayınlarken, kendi listelemelerinizi yönetirken veya kayıt defterine özgü iş
akışlarını kullanırken `clawhub` CLI'yi kullanın.

## Bir Skills öğesi bulma ve kurma

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir Skills öğesi kurun:

```bash
openclaw skills install @openclaw/demo
```

Kurulu Skills öğelerini güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, Skills öğesinin nereden geldiğini kaydeder; böylece sonraki
güncellemeler ClawHub üzerinden çözümlemeye devam edebilir.

## Bir Plugin bulma ve kurma

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub üzerinde barındırılan bir Plugin kurun:

```bash
openclaw plugins install clawhub:<package>
```

Kurulu Plugin'leri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw'ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden
çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açma

ClawHub CLI'yi kurun:

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

## Bir Skills öğesi yayınlama

Bir Skills öğesi, zorunlu bir `SKILL.md` dosyası ve isteğe bağlı destekleyici
dosyalar içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni Skills öğeleri `1.0.0` sürümünden başlar;
sonraki değişiklikler bir sonraki yama sürümünü otomatik olarak yayınlar.
Önizleme için `--dry-run` kullanın veya açık bir sürüm seçmek için `--version`
kullanın.

Yayınlamadan önce `SKILL.md` içindeki meta verileri denetleyin. Gerekli ortam
değişkenlerini, araçları ve izinleri bildirin; böylece kullanıcılar Skills
öğesini kurmadan önce neye ihtiyaç duyduğunu anlayabilir. Bkz.
[Skills biçimi](/tr/clawhub/skill-format).

Birden fazla Skills öğesi içeren depolarda, yeniden kullanılabilir GitHub iş
akışı `skills/` altındaki her bir doğrudan Skills klasörü için `skill publish`
çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir Plugin yayınlama

Yerel bir klasörden, GitHub deposundan, GitHub ref'inden veya mevcut bir arşivden
Plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme
planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere `package.json` içinde
OpenClaw uyumluluk meta verileri içermelidir.

## Kurmadan önce inceleme

Kurulumdan önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik
günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI
ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından
bekletilen veya engellenen sürümler, çözülene kadar arama ve kurulum
yüzeylerinden gizlenebilir.

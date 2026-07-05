---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt deposundan bir beceri veya Plugin yükleme
    - ClawHub'a Yayınlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-05T05:30:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw Skills ve Plugin'leri için bir kayıt deposudur.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken,
yayınlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş
akışlarını kullanırken `clawhub` CLI'ını kullanın.

## Bir Skills bulun ve kurun

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir Skills kurun:

```bash
openclaw skills install @openclaw/demo
```

Kurulu Skills'leri güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, Skills'in nereden geldiğini kaydeder; böylece sonraki güncellemeler
ClawHub üzerinden çözümlemeye devam edebilir.

## Bir Plugin bulun ve kurun

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

## Yayınlama için oturum açın

ClawHub CLI'ını kurun:

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

Başsız ortamlar, ClawHub web UI'ından alınan bir API belirteci kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir Skills yayınlayın

Bir Skills, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destekleyici
dosyalar içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni Skills'ler `1.0.0` sürümünden başlar;
sonraki değişiklikler bir sonraki yama sürümünü otomatik olarak yayınlar.
Önizleme yapmak için `--dry-run`, açık bir sürüm seçmek için `--version`
kullanın.

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların
kurulumdan önce Skills'in neye ihtiyaç duyduğunu anlayabilmesi için gerekli
ortam değişkenlerini, araçları ve izinleri bildirin. Bkz.
[Skills biçimi](/tr/clawhub/skill-format).

Birden fazla Skills içeren depolarda, yeniden kullanılabilir GitHub iş akışı
`skills/` altındaki her doğrudan Skills klasörü için `skill publish` çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir Plugin yayınlayın

Yerel bir klasörden, bir GitHub deposundan, bir GitHub ref'inden veya mevcut
bir arşivden Plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlediğiniz paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve
yükleme planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk meta
verilerini içermelidir.

## Kurmadan önce inceleyin

Kurulumdan önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik
günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI
ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon nedeniyle
bekletilen veya engellenen yayınlar, çözülene kadar arama ve kurulum
yüzeylerinden gizlenebilir.

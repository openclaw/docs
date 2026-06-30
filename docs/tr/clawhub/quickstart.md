---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden bir beceri veya Plugin yükleme
    - ClawHub'a yayımlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayınlayın.'
x-i18n:
    generated_at: "2026-06-30T14:21:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw Skills ve Plugin'leri için bir kayıt deposudur.

OpenClaw içine bir şeyler yüklerken OpenClaw kullanın. Oturum açarken, yayımlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş akışlarını kullanırken `clawhub` CLI kullanın.

## Bir yetenek bulun ve yükleyin

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir yetenek yükleyin:

```bash
openclaw skills install @openclaw/demo
```

Yüklü yetenekleri güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, yeteneğin nereden geldiğini kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlemeye devam edebilir.

## Bir Plugin bulun ve yükleyin

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

OpenClaw'un paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözümlemesini istediğinizde `clawhub:` ön ekini kullanın.

## Yayımlamak için oturum açın

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

Başsız ortamlar, ClawHub web UI'sinden alınan bir API belirtecini kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir yetenek yayımlayın

Bir yetenek, zorunlu bir `SKILL.md` dosyası ve isteğe bağlı destek dosyaları içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni yetenekler `1.0.0` sürümünden başlar; sonraki değişiklikler otomatik olarak bir sonraki yama sürümünü yayımlar. Önizleme yapmak için `--dry-run`, açık bir sürüm seçmek için `--version` kullanın.

Yayımlamadan önce `SKILL.md` içindeki üst verileri kontrol edin. Gerekli ortam değişkenlerini, araçları ve izinleri belirtin; böylece kullanıcılar yeteneği yüklemeden önce neye ihtiyaç duyduğunu anlayabilir. Bkz. [Yetenek biçimi](/tr/clawhub/skill-format).

Birden fazla yetenek içeren depolarda, yeniden kullanılabilir GitHub iş akışı `skills/` altındaki her doğrudan yetenek klasörü için `skill publish` çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir Plugin yayımlayın

Yerel bir klasörden, GitHub deposundan, GitHub ref'inden veya mevcut bir arşivden bir Plugin yayımlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözülmüş paket üst verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme planını yayımlamadan önce önizlemek için önce `--dry-run` kullanın.

Kod Plugin'leri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk üst verilerini içermelidir.

## Yüklemeden önce inceleyin

Yüklemeden önce üst verileri, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Denetim nedeniyle bekletilen veya engellenen sürümler, çözülene kadar arama ve yükleme yüzeylerinden gizlenebilir.

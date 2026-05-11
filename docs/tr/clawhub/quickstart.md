---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt deposundan bir beceri veya Plugin yükleme
    - ClawHub'a Yayınlama
summary: 'ClawHub’ı kullanmaya başlayın: Skills veya Plugin’leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-05-11T22:19:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw skills ve plugins için bir kayıt deposudur.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken, yayınlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş akışlarını kullanırken `clawhub` CLI kullanın.

## Bir skill bulma ve kurma

OpenClaw üzerinden arayın:

```bash
openclaw skills search "calendar"
```

Bir skill kurun:

```bash
openclaw skills install <skill-slug>
```

Kurulu skills öğelerini güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, skill öğesinin nereden geldiğini kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlemeye devam edebilir.

## Bir plugin bulma ve kurma

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub üzerinde barındırılan bir plugin kurun:

```bash
openclaw plugins install clawhub:<package>
```

Kurulu plugins öğelerini güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw paketini npm veya başka bir kaynak yerine ClawHub üzerinden çözümlesin istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açma

ClawHub CLI aracını kurun:

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

Headless ortamlar, ClawHub web kullanıcı arayüzünden bir API token kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir skill yayınlama

Skill, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destekleyici dosyalar içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Yayınlamadan önce `SKILL.md` içindeki metadata bilgilerini kontrol edin. Kullanıcıların skill öğesini kurmadan önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli environment variables, tools ve permissions öğelerini bildirin. Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Bir plugin yayınlama

Yerel bir klasörden, GitHub repo öğesinden, GitHub ref öğesinden veya mevcut bir arşivden plugin yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlenen package metadata, compatibility fields, source attribution ve upload plan bilgilerini yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod plugins öğeleri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil olmak üzere OpenClaw compatibility metadata içermelidir.

## Bakımını yaptığınız skills öğelerini senkronize etme

`sync`, skill klasörlerini tarar ve halihazırda senkronize edilmemiş yeni veya değişmiş skills öğelerini yayınlar.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Oturum açtığınızda `sync`, toplu kurulum sayıları için minimal bir install snapshot da gönderebilir. Nelerin raporlandığı ve nasıl devre dışı bırakılacağı için [Telemetri](/tr/clawhub/telemetry) bölümüne bakın.

## Kurmadan önce inceleme

Kurmadan önce metadata, source links, versions, changelogs ve scan status bilgilerini incelemek için ClawHub web sayfasını veya CLI detail commands öğelerini kullanın:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Herkese açık listelemeler en son scan state durumunu gösterir. Moderation tarafından bekletilen veya engellenen releases, çözülene kadar arama ve kurulum yüzeylerinden gizlenebilir.

---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt deposundan beceri veya Plugin yükleme
    - ClawHub'a yayımlama
summary: 'ClawHub''ı kullanmaya başlayın: Skills veya Plugin''leri bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-04T20:40:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw becerileri ve eklentileri için bir kayıt deposudur.

OpenClaw içine bir şeyler yüklerken OpenClaw kullanın. Oturum açarken, yayınlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş akışlarını kullanırken `clawhub` CLI kullanın.

## Bir beceri bulma ve yükleme

OpenClaw üzerinden arama yapın:

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

OpenClaw, becerinin nereden geldiğini kaydeder; böylece sonraki güncellemeler ClawHub üzerinden çözümlemeye devam edebilir.

## Bir eklenti bulma ve yükleme

OpenClaw üzerinden arama yapın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub üzerinde barındırılan bir eklenti yükleyin:

```bash
openclaw plugins install clawhub:<package>
```

Yüklü eklentileri güncelleyin:

```bash
openclaw plugins update --all
```

OpenClaw’ın paketi npm veya başka bir kaynak yerine ClawHub üzerinden çözümlemesini istediğinizde `clawhub:` önekini kullanın.

## Yayınlama için oturum açma

ClawHub CLI’yi yükleyin:

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

Başsız ortamlar, ClawHub web kullanıcı arayüzünden alınan bir API belirteci kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir beceri yayınlama

Beceri, zorunlu bir `SKILL.md` dosyası ve isteğe bağlı destek dosyaları içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni beceriler `1.0.0` sürümüyle başlar; sonraki değişiklikler bir sonraki yama sürümünü otomatik olarak yayınlar. Önizleme yapmak için `--dry-run`, açık bir sürüm seçmek için `--version` kullanın.

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Gerekli ortam değişkenlerini, araçları ve izinleri bildirin; böylece kullanıcılar beceriyi yüklemeden önce neye ihtiyaç duyduğunu anlayabilir. Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

Birden çok beceri içeren depolar için yeniden kullanılabilir GitHub iş akışı, `skills/` altındaki her doğrudan beceri klasörü için `skill publish` çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir eklenti yayınlama

Yerel bir klasörden, GitHub deposundan, GitHub ref’inden veya mevcut bir arşivden bir eklenti yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlemiş paket meta verilerini, uyumluluk alanlarını, kaynak atfını ve yükleme planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod eklentileri, `package.json` içinde `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` dahil OpenClaw uyumluluk meta verileri içermelidir.

## Yüklemeden önce inceleme

Yüklemeden önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından bekletilen veya engellenen sürümler, çözülene kadar arama ve yükleme yüzeylerinden gizlenebilir.

---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt deposundan bir beceri veya Plugin yükleme
    - ClawHub'a Yayınlama
summary: 'ClawHub’ı kullanmaya başlayın: Skills veya Plugin bulun, kurun, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-02T08:43:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı Başlangıç

ClawHub, OpenClaw becerileri ve eklentileri için bir kayıt deposudur.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken,
yayınlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş
akışlarını kullanırken `clawhub` CLI'sini kullanın.

## Bir beceri bulma ve kurma

OpenClaw üzerinden arama yapın:

```bash
openclaw skills search "calendar"
```

Bir beceri kurun:

```bash
openclaw skills install @openclaw/demo
```

Kurulu becerileri güncelleyin:

```bash
openclaw skills update --all
```

OpenClaw, becerinin nereden geldiğini kaydeder; böylece daha sonraki
güncellemeler ClawHub üzerinden çözümlemeye devam edebilir.

## Bir eklenti bulma ve kurma

OpenClaw üzerinden arama yapın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub üzerinde barındırılan bir eklenti kurun:

```bash
openclaw plugins install clawhub:<package>
```

Kurulu eklentileri güncelleyin:

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

Başsız ortamlar, ClawHub web kullanıcı arayüzünden bir API belirteci
kullanabilir:

```bash
clawhub login --token clh_...
```

## Bir beceri yayınlama

Beceri, gerekli bir `SKILL.md` dosyası ve isteğe bağlı destek dosyaları içeren
bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmemiş içeriği atlar. Yeni beceriler `1.0.0` sürümüyle başlar;
sonraki değişiklikler bir sonraki yama sürümünü otomatik olarak yayınlar.
Önizlemek için `--dry-run`, açık bir sürüm seçmek için `--version` kullanın.

Yayınlamadan önce `SKILL.md` içindeki meta verileri denetleyin. Kullanıcıların
beceriyi kurmadan önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam
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

## Bir eklenti yayınlama

Yerel bir klasörden, GitHub deposundan, GitHub ref'inden veya mevcut bir arşivden
eklenti yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yayınlamadan önce çözümlenen paket meta verilerini, uyumluluk alanlarını, kaynak
atıfını ve yükleme planını önizlemek için önce `--dry-run` kullanın.

Kod eklentileri, `openclaw.compat.pluginApi` ve
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

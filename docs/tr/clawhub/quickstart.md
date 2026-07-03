---
read_when:
    - ClawHub'ı ilk kez kullanma
    - Kayıt defterinden bir skill veya plugin yükleme
    - ClawHub'a Yayımlama
summary: 'ClawHub''u kullanmaya başlayın: Skills veya Plugin bulun, yükleyin, güncelleyin ve yayımlayın.'
x-i18n:
    generated_at: "2026-07-03T01:02:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Hızlı başlangıç

ClawHub, OpenClaw becerileri ve eklentileri için bir kayıt deposudur.

OpenClaw içine bir şeyler kurarken OpenClaw kullanın. Oturum açarken,
yayınlarken, kendi listelemelerinizi yönetirken veya kayıt deposuna özgü iş
akışlarını kullanırken `clawhub` CLI'yi kullanın.

## Bir beceri bulma ve kurma

OpenClaw üzerinden arayın:

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

OpenClaw, becerinin nereden geldiğini kaydeder; böylece sonraki güncellemeler
ClawHub üzerinden çözümlemeye devam edebilir.

## Bir eklenti bulma ve kurma

OpenClaw üzerinden arayın:

```bash
openclaw plugins search "calendar"
```

Açık bir ClawHub kaynağıyla ClawHub'da barındırılan bir eklenti kurun:

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

Beceri, zorunlu bir `SKILL.md` dosyası ve isteğe bağlı destekleyici dosyalar
içeren bir klasördür.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Komut, değişmeyen içeriği atlar. Yeni beceriler `1.0.0` ile başlar; sonraki
değişiklikler bir sonraki yama sürümünü otomatik olarak yayınlar. Önizleme için
`--dry-run`, açık bir sürüm seçmek için `--version` kullanın.

Yayınlamadan önce `SKILL.md` içindeki meta verileri kontrol edin. Kullanıcıların
beceriyi kurmadan önce neye ihtiyaç duyduğunu anlayabilmesi için gerekli ortam
değişkenlerini, araçları ve izinleri bildirin. Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

Birden fazla beceri içeren depolarda, yeniden kullanılabilir GitHub iş akışı
`skills/` altındaki her bir doğrudan beceri klasörü için `skill publish`
çağırır:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Bir eklenti yayınlama

Yerel bir klasörden, bir GitHub deposundan, bir GitHub ref'inden veya mevcut bir
arşivden eklenti yayınlayın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Çözümlemiş paket meta verilerini, uyumluluk alanlarını, kaynak ilişkilendirmesini
ve yükleme planını yayınlamadan önizlemek için önce `--dry-run` kullanın.

Kod eklentileri, `package.json` içinde `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` dahil olmak üzere OpenClaw uyumluluk meta
verilerini içermelidir.

## Kurmadan önce inceleme

Kurulumdan önce meta verileri, kaynak bağlantılarını, sürümleri, değişiklik
günlüklerini ve tarama durumunu incelemek için ClawHub web sayfasını veya CLI
ayrıntı komutlarını kullanın:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Herkese açık listelemeler en son tarama durumunu gösterir. Moderasyon tarafından
bekletilen veya engellenen yayınlar, çözülene kadar arama ve kurulum
yüzeylerinden gizlenebilir.

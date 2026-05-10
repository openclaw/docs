---
read_when:
    - Skills yayımlama
    - Yayınlama/eşitleme hatalarında hata ayıklama
summary: Skill klasörü biçimi, gerekli dosyalar, izin verilen dosya türleri, sınırlar.
x-i18n:
    generated_at: "2026-05-10T19:27:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Beceri biçimi

## Disk üzerinde

Bir beceri bir klasördür.

Gerekli:

- `SKILL.md` (veya `skill.md`)

İsteğe bağlı:

- destekleyici herhangi bir _metin tabanlı_ dosya (bkz. “İzin verilen dosyalar”)
- `.clawhubignore` (yayınlama/eşitleme için yok sayma desenleri, eski `.clawdhubignore`)
- `.gitignore` (o da dikkate alınır)

Yerel kurulum metadatası (CLI tarafından yazılır):

- `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

Çalışma dizini kurulum durumu (CLI tarafından yazılır):

- `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)

## `SKILL.md`

- İsteğe bağlı YAML frontmatter içeren Markdown.
- Sunucu, yayınlama sırasında metadatayı frontmatter’dan çıkarır.
- `description`, kullanıcı arayüzünde/aramada beceri özeti olarak kullanılır.

## Frontmatter metadatası

Beceri metadatası, `SKILL.md` dosyanızın en üstündeki YAML frontmatter içinde bildirilir. Bu, kayıt defterine (ve güvenlik analizine) becerinizin çalışmak için neye ihtiyaç duyduğunu söyler.

### Temel frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Çalışma zamanı metadatası (`metadata.openclaw`)

Becerinizin çalışma zamanı gereksinimlerini `metadata.openclaw` altında bildirin (takma adlar: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

Beceri çalışmadan önce mevcut olması gereken ortam değişkenleri için `requires.env` kullanın. İsteğe bağlı değişkenler de dahil olmak üzere değişken başına metadata gerektiğinde `envVars` kullanın ve `required: false` ayarlayın.

### Tam alan başvurusu

| Alan               | Tür        | Açıklama                                                                                                                                  |
| ------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Becerinizin beklediği gerekli ortam değişkenleri.                                                                                         |
| `requires.bins`    | `string[]` | Tümünün yüklü olması gereken CLI ikili dosyaları.                                                                                         |
| `requires.anyBins` | `string[]` | En az birinin mevcut olması gereken CLI ikili dosyaları.                                                                                  |
| `requires.config`  | `string[]` | Becerinizin okuduğu yapılandırma dosyası yolları.                                                                                         |
| `primaryEnv`       | `string`   | Beceriniz için ana kimlik bilgisi ortam değişkeni.                                                                                        |
| `envVars`          | `array`    | `name`, isteğe bağlı `required` ve isteğe bağlı `description` içeren ortam değişkeni bildirimleri. İsteğe bağlı ortam değişkenleri için `required: false` ayarlayın. |
| `always`           | `boolean`  | `true` ise beceri her zaman aktiftir (açık kurulum gerekmez).                                                                             |
| `skillKey`         | `string`   | Becerinin çağırma anahtarını geçersiz kılar.                                                                                              |
| `emoji`            | `string`   | Beceri için görüntülenecek emoji.                                                                                                         |
| `homepage`         | `string`   | Becerinin ana sayfasına veya dokümantasyonuna giden URL.                                                                                  |
| `os`               | `string[]` | İşletim sistemi kısıtlamaları (örn. `["macos"]`, `["linux"]`).                                                                            |
| `install`          | `array`    | Bağımlılıklar için kurulum özellikleri (aşağıya bakın).                                                                                   |
| `nix`              | `object`   | Nix Plugin özelliği (README’ye bakın).                                                                                                    |
| `config`           | `object`   | Clawdbot yapılandırma özelliği (README’ye bakın).                                                                                         |

### Kurulum özellikleri

Becerinizin bağımlılıklarının kurulması gerekiyorsa bunları `install` dizisinde bildirin:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

Desteklenen kurulum türleri: `brew`, `node`, `go`, `uv`.

### İsteğe bağlı ortam değişkenleri

İsteğe bağlı ortam değişkenlerini `metadata.openclaw.envVars` altında bildirin ve `required: false` ayarlayın. İsteğe bağlı girdileri `requires.env` içine eklemeyin, çünkü `requires.env` becerinin onlar olmadan çalışamayacağı anlamına gelir.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Bu neden önemlidir

ClawHub’ın güvenlik analizi, becerinizin bildirdiği şeylerin gerçekte yaptıklarıyla eşleşip eşleşmediğini denetler. Kodunuz `TODOIST_API_KEY` değerine başvuruyor ancak frontmatter bunu `requires.env`, `primaryEnv` veya `envVars` altında bildirmiyorsa analiz bir metadata uyumsuzluğu işaretler. Bildirimleri doğru tutmak, becerinizin incelemeden geçmesine yardımcı olur ve kullanıcıların ne kurduklarını anlamasını sağlar.

### Örnek: eksiksiz frontmatter

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## İzin verilen dosyalar

Yayınlama tarafından yalnızca “metin tabanlı” dosyalar kabul edilir.

- Uzantı izin listesi `packages/schema/src/textFiles.ts` içindedir (`TEXT_FILE_EXTENSIONS`).
- Betik dosyaları yüklemeden sonra yine taranır; PowerShell `.ps1`, `.psm1` ve `.psd1` dosyaları metin olarak kabul edilir.
- `text/` ile başlayan içerik türleri metin olarak değerlendirilir; ayrıca küçük bir izin listesi vardır (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Sınırlar (sunucu tarafı):

- Toplam paket boyutu: 50 MB.
- Gömme metni `SKILL.md` + yaklaşık 40 adede kadar `.md` olmayan dosya içerir (en iyi çaba sınırı).

## Slug’lar

- Varsayılan olarak klasör adından türetilir.
- Küçük harfli ve URL için güvenli olmalıdır: `^[a-z0-9][a-z0-9-]*$`.

## Sürümleme + etiketler

- Her yayınlama yeni bir sürüm oluşturur (semver).
- Etiketler bir sürüme işaret eden string işaretçilerdir; `latest` yaygın olarak kullanılır.

## Lisans

- ClawHub’da yayınlanan tüm beceriler `MIT-0` kapsamında lisanslanır.
- Herkes yayınlanan becerileri ticari amaçlar dahil kullanabilir, değiştirebilir ve yeniden dağıtabilir.
- Atıf gerekli değildir.
- `SKILL.md` içine çelişen lisans koşulları eklemeyin; ClawHub beceri başına lisans geçersiz kılmalarını desteklemez.

## Ücretli beceriler

- ClawHub ücretli becerileri, beceri başına fiyatlandırmayı, ödeme duvarlarını veya gelir paylaşımını desteklemez.
- `SKILL.md` içine fiyatlandırma metadatası eklemeyin; bu beceri biçiminin parçası değildir ve yayınlanan bir beceriyi ücretli yapmaz.
- Beceriniz ücretli bir üçüncü taraf hizmetle entegre oluyorsa, harici maliyeti ve gerekli hesabı beceri talimatlarında ve ortam bildirimlerinde açıkça belgeleyin (gerekli değişkenler için `requires.env` veya isteğe bağlı değişkenler için `required: false` içeren `envVars`).

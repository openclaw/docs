---
read_when:
    - Skills yayımlama
    - Yayınlama/senkronizasyon başarısızlıklarında hata ayıklama
summary: Beceri klasörü biçimi, gerekli dosyalar, izin verilen dosya türleri, sınırlar.
x-i18n:
    generated_at: "2026-05-13T05:33:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skills formatı

## Disk üzerinde

Bir Skills öğesi bir klasördür.

Gerekli:

- `SKILL.md` (veya `skill.md`)

İsteğe bağlı:

- destekleyici herhangi bir _metin tabanlı_ dosya (bkz. “İzin verilen dosyalar”)
- `.clawhubignore` (yayımlama/eşitleme için yoksayma desenleri, eski `.clawdhubignore`)
- `.gitignore` (ayrıca dikkate alınır)

Yerel kurulum meta verileri (CLI tarafından yazılır):

- `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

Çalışma dizini kurulum durumu (CLI tarafından yazılır):

- `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)

## `SKILL.md`

- İsteğe bağlı YAML frontmatter içeren Markdown.
- Sunucu, yayımlama sırasında meta verileri frontmatter'dan çıkarır.
- `description`, UI/aramada Skills özeti olarak kullanılır.

## Frontmatter meta verileri

Skills meta verileri, `SKILL.md` dosyanızın en üstündeki YAML frontmatter içinde bildirilir. Bu, kayıt defterine (ve güvenlik analizine) Skills'inizin çalışması için neye ihtiyaç duyduğunu söyler.

### Temel frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Çalışma zamanı meta verileri (`metadata.openclaw`)

Skills'inizin çalışma zamanı gereksinimlerini `metadata.openclaw` altında bildirin (takma adlar: `metadata.clawdbot`, `metadata.clawdis`).

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

Skills çalışmadan önce mevcut olması gereken ortam değişkenleri için `requires.env` kullanın. İsteğe bağlı değişkenler de dahil olmak üzere değişken başına meta verilere ihtiyaç duyduğunuzda `envVars` kullanın; buna `required: false` dahildir.

### Tam alan başvurusu

| Alan               | Tür        | Açıklama                                                                                                                                          |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skills'inizin beklediği gerekli ortam değişkenleri.                                                                                               |
| `requires.bins`    | `string[]` | Tümünün kurulu olması gereken CLI ikilileri.                                                                                                      |
| `requires.anyBins` | `string[]` | En az birinin mevcut olması gereken CLI ikilileri.                                                                                                |
| `requires.config`  | `string[]` | Skills'inizin okuduğu yapılandırma dosyası yolları.                                                                                              |
| `primaryEnv`       | `string`   | Skills'iniz için ana kimlik bilgisi ortam değişkeni.                                                                                              |
| `envVars`          | `array`    | `name`, isteğe bağlı `required` ve isteğe bağlı `description` içeren ortam değişkeni bildirimleri. İsteğe bağlı ortam değişkenleri için `required: false` ayarlayın. |
| `always`           | `boolean`  | `true` ise Skills her zaman etkindir (açık kurulum gerekmez).                                                                                    |
| `skillKey`         | `string`   | Skills'in çağırma anahtarını geçersiz kılar.                                                                                                      |
| `emoji`            | `string`   | Skills için görüntüleme emojisi.                                                                                                                  |
| `homepage`         | `string`   | Skills'in ana sayfasına veya dokümanlarına giden URL.                                                                                            |
| `os`               | `string[]` | OS kısıtlamaları (örn. `["macos"]`, `["linux"]`).                                                                                                 |
| `install`          | `array`    | Bağımlılıklar için kurulum özellikleri (aşağıya bakın).                                                                                           |
| `nix`              | `object`   | Nix plugin özelliği (README'ye bakın).                                                                                                            |
| `config`           | `object`   | Clawdbot yapılandırma özelliği (README'ye bakın).                                                                                                 |

### Kurulum özellikleri

Skills'inizin bağımlılıkların kurulu olmasına ihtiyacı varsa, bunları `install` dizisinde bildirin:

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

İsteğe bağlı ortam değişkenlerini `metadata.openclaw.envVars` altında bildirin ve `required: false` ayarlayın. İsteğe bağlı girdileri `requires.env` alanına eklemeyin, çünkü `requires.env` Skills'in onlar olmadan çalışamayacağı anlamına gelir.

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

ClawHub'ın güvenlik analizi, Skills'inizin bildirdiği şeyin gerçekte yaptığı şeyle eşleşip eşleşmediğini kontrol eder. Kodunuz `TODOIST_API_KEY` öğesine başvuruyor ancak frontmatter bunu `requires.env`, `primaryEnv` veya `envVars` altında bildirmiyorsa, analiz bir meta veri uyuşmazlığı işaretler. Bildirimleri doğru tutmak, Skills'inizin incelemeden geçmesine yardımcı olur ve kullanıcıların ne kurduklarını anlamasını sağlar.

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

Yayımlama tarafından yalnızca “metin tabanlı” dosyalar kabul edilir.

- Uzantı izin listesi `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) içindedir.
- Betik dosyaları yüklemeden sonra yine de taranır; PowerShell `.ps1`, `.psm1` ve `.psd1` dosyaları metin olarak kabul edilir.
- `text/` ile başlayan içerik türleri metin olarak değerlendirilir; ayrıca küçük bir izin listesi vardır (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Sınırlar (sunucu tarafı):

- Toplam paket boyutu: 50MB.
- Gömme metni `SKILL.md` + en fazla yaklaşık 40 adet `.md` olmayan dosya içerir (en iyi çaba sınırı).

## Slug'lar

- Varsayılan olarak klasör adından türetilir.
- Küçük harfli ve URL güvenli olmalıdır: `^[a-z0-9][a-z0-9-]*$`.

## Sürümleme + etiketler

- Her yayımlama yeni bir sürüm oluşturur (semver).
- Etiketler, bir sürüme yönelik string işaretçilerdir; `latest` yaygın olarak kullanılır.

## Lisans

- ClawHub'da yayımlanan tüm Skills'ler `MIT-0` kapsamında lisanslanır.
- Herkes yayımlanan Skills'leri ticari kullanım dahil olmak üzere kullanabilir, değiştirebilir ve yeniden dağıtabilir.
- Atıf gerekli değildir.
- `SKILL.md` içinde çakışan lisans koşulları eklemeyin; ClawHub, Skills başına lisans geçersiz kılmalarını desteklemez.

## Ücretli Skills'ler

- ClawHub ücretli Skills'leri, Skills başına fiyatlandırmayı, ödeme duvarlarını veya gelir paylaşımını desteklemez.
- `SKILL.md` dosyasına fiyatlandırma meta verileri eklemeyin; bu, Skills formatının parçası değildir ve yayımlanmış bir Skills'i ücretli yapmaz.
- Skills'iniz ücretli bir üçüncü taraf hizmetiyle entegre oluyorsa, harici maliyeti ve gerekli hesabı Skills talimatlarında ve ortam bildirimlerinde açıkça belgeleyin (gerekli değişkenler için `requires.env` veya isteğe bağlı değişkenler için `required: false` içeren `envVars`).

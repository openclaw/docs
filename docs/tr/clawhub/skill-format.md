---
read_when:
    - Skills yayımlama
    - Yayınlama/senkronizasyon hatalarında hata ayıklama
summary: Skill klasörü biçimi, gerekli dosyalar, izin verilen dosya türleri, sınırlar.
x-i18n:
    generated_at: "2026-05-11T20:24:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Beceri formatı

## Diskte

Bir beceri bir klasördür.

Gerekli:

- `SKILL.md` (veya `skill.md`)

İsteğe bağlı:

- destekleyici herhangi bir _metin tabanlı_ dosya (bkz. “İzin verilen dosyalar”)
- `.clawhubignore` (yayınlama/eşitleme için yok sayma desenleri, eski `.clawdhubignore`)
- `.gitignore` (o da dikkate alınır)

Yerel kurulum meta verileri (CLI tarafından yazılır):

- `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

Çalışma dizini kurulum durumu (CLI tarafından yazılır):

- `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)

## `SKILL.md`

- İsteğe bağlı YAML frontmatter içeren Markdown.
- Sunucu, yayınlama sırasında meta verileri frontmatter'dan çıkarır.
- `description`, UI/aramada beceri özeti olarak kullanılır.

## Frontmatter meta verileri

Beceri meta verileri, `SKILL.md` dosyanızın en üstündeki YAML frontmatter içinde bildirilir. Bu, kayıt defterine (ve güvenlik analizine) becerinizin çalışmak için neye ihtiyaç duyduğunu söyler.

### Temel frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Çalışma zamanı meta verileri (`metadata.openclaw`)

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

Beceri çalışmadan önce mevcut olması gereken ortam değişkenleri için `requires.env` kullanın. İsteğe bağlı değişkenleri `required: false` ile dahil olmak üzere değişken başına meta veriye ihtiyaç duyduğunuzda `envVars` kullanın.

### Tam alan referansı

| Alan               | Tür        | Açıklama                                                                                                                                              |
| ------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Becerinizin beklediği gerekli ortam değişkenleri.                                                                                                     |
| `requires.bins`    | `string[]` | Tümünün kurulu olması gereken CLI ikilileri.                                                                                                          |
| `requires.anyBins` | `string[]` | En az birinin mevcut olması gereken CLI ikilileri.                                                                                                    |
| `requires.config`  | `string[]` | Becerinizin okuduğu yapılandırma dosyası yolları.                                                                                                     |
| `primaryEnv`       | `string`   | Beceriniz için ana kimlik bilgisi ortam değişkeni.                                                                                                    |
| `envVars`          | `array`    | `name`, isteğe bağlı `required` ve isteğe bağlı `description` içeren ortam değişkeni bildirimleri. İsteğe bağlı env var'lar için `required: false` ayarlayın. |
| `always`           | `boolean`  | `true` ise beceri her zaman etkindir (açık kurulum gerekmez).                                                                                         |
| `skillKey`         | `string`   | Becerinin çağırma anahtarını geçersiz kılar.                                                                                                          |
| `emoji`            | `string`   | Beceri için gösterim emojisi.                                                                                                                         |
| `homepage`         | `string`   | Becerinin ana sayfasına veya belgelerine giden URL.                                                                                                   |
| `os`               | `string[]` | İşletim sistemi kısıtlamaları (örn. `["macos"]`, `["linux"]`).                                                                                        |
| `install`          | `array`    | Bağımlılıklar için kurulum belirtimleri (aşağıya bakın).                                                                                              |
| `nix`              | `object`   | Nix Plugin belirtimi (README'ye bakın).                                                                                                               |
| `config`           | `object`   | Clawdbot yapılandırma belirtimi (README'ye bakın).                                                                                                    |

### Kurulum belirtimleri

Becerinizin bağımlılıkların kurulmasına ihtiyacı varsa bunları `install` dizisinde bildirin:

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

İsteğe bağlı ortam değişkenlerini `metadata.openclaw.envVars` altında bildirin ve `required: false` ayarlayın. İsteğe bağlı girdileri `requires.env` öğesine eklemeyin, çünkü `requires.env` becerinin onlar olmadan çalışamayacağı anlamına gelir.

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

### Bu neden önemli

ClawHub'ın güvenlik analizi, becerinizin bildirdikleriyle gerçekte yaptıklarının eşleştiğini kontrol eder. Kodunuz `TODOIST_API_KEY` öğesine başvuruyor ancak frontmatter bunu `requires.env`, `primaryEnv` veya `envVars` altında bildirmiyorsa analiz bir meta veri uyuşmazlığı işaretler. Bildirimleri doğru tutmak, becerinizin incelemeden geçmesine yardımcı olur ve kullanıcıların ne kurduklarını anlamasını sağlar.

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

- Uzantı izin listesi `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) içindedir.
- Betik dosyaları yüklemeden sonra yine de taranır; PowerShell `.ps1`, `.psm1` ve `.psd1` dosyaları metin olarak kabul edilir.
- `text/` ile başlayan içerik türleri metin olarak değerlendirilir; buna ek olarak küçük bir izin listesi (JSON/YAML/TOML/JS/TS/Markdown/SVG) vardır.

Sınırlar (sunucu tarafı):

- Toplam paket boyutu: 50 MB.
- Gömme metni `SKILL.md` + yaklaşık 40'a kadar `.md` olmayan dosyayı içerir (en iyi çaba sınırı).

## Kısa adlar

- Varsayılan olarak klasör adından türetilir.
- Küçük harfli ve URL güvenli olmalıdır: `^[a-z0-9][a-z0-9-]*$`.

## Sürümleme + etiketler

- Her yayınlama yeni bir sürüm oluşturur (semver).
- Etiketler, bir sürüme yönelik dize işaretçileridir; `latest` yaygın olarak kullanılır.

## Lisans

- ClawHub'da yayınlanan tüm beceriler `MIT-0` altında lisanslanır.
- Herkes yayınlanan becerileri ticari amaçlar dahil olmak üzere kullanabilir, değiştirebilir ve yeniden dağıtabilir.
- Atıf gerekli değildir.
- `SKILL.md` içinde çelişen lisans koşulları eklemeyin; ClawHub beceri başına lisans geçersiz kılmalarını desteklemez.

## Ücretli beceriler

- ClawHub ücretli becerileri, beceri başına fiyatlandırmayı, ödeme duvarlarını veya gelir paylaşımını desteklemez.
- `SKILL.md` dosyasına fiyatlandırma meta verisi eklemeyin; bu beceri formatının parçası değildir ve yayınlanan bir beceriyi ücretli yapmaz.
- Beceriniz ücretli bir üçüncü taraf hizmetle entegre oluyorsa dış maliyeti ve gerekli hesabı beceri yönergelerinde ve env bildirimlerinde (`requires.env` gerekli değişkenler için veya isteğe bağlı değişkenler için `required: false` ile `envVars`) açıkça belgeleyin.

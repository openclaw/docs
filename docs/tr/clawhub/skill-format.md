---
read_when:
    - Skills yayımlama
    - Yayınlama/eşitleme hatalarında hata ayıklama
summary: Skill klasörü biçimi, gerekli dosyalar, izin verilen dosya türleri, sınırlar.
x-i18n:
    generated_at: "2026-05-11T22:19:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Beceri biçimi

## Disk üzerinde

Bir beceri bir klasördür.

Zorunlu:

- `SKILL.md` (veya `skill.md`)

İsteğe bağlı:

- destekleyici herhangi bir _metin tabanlı_ dosya (“İzin verilen dosyalar” bölümüne bakın)
- `.clawhubignore` (yayınlama/eşitleme için yok sayma desenleri, eski `.clawdhubignore`)
- `.gitignore` (o da dikkate alınır)

Yerel kurulum meta verileri (CLI tarafından yazılır):

- `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

Çalışma dizini kurulum durumu (CLI tarafından yazılır):

- `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)

## `SKILL.md`

- İsteğe bağlı YAML ön maddesi içeren Markdown.
- Sunucu, yayınlama sırasında meta verileri ön maddeden çıkarır.
- `description`, UI/aramada beceri özeti olarak kullanılır.

## Ön madde meta verileri

Beceri meta verileri, `SKILL.md` dosyanızın üst kısmındaki YAML ön maddesinde bildirilir. Bu, kayıt sistemine (ve güvenlik analizine) becerinizin çalışmak için nelere ihtiyaç duyduğunu söyler.

### Temel ön madde

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Çalışma zamanı meta verileri (`metadata.openclaw`)

Becerinizin çalışma zamanı gereksinimlerini `metadata.openclaw` altında bildirin (diğer adlar: `metadata.clawdbot`, `metadata.clawdis`).

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

Beceri çalışmadan önce mevcut olması gereken ortam değişkenleri için `requires.env` kullanın. İsteğe bağlı değişkenler dahil, değişken başına meta veriye ihtiyaç duyduğunuzda `envVars` kullanın ve `required: false` ayarlayın.

### Tam alan başvurusu

| Alan               | Tür        | Açıklama                                                                                                                                                  |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Becerinizin beklediği zorunlu ortam değişkenleri.                                                                                                         |
| `requires.bins`    | `string[]` | Tamamının kurulu olması gereken CLI ikilileri.                                                                                                            |
| `requires.anyBins` | `string[]` | En az birinin mevcut olması gereken CLI ikilileri.                                                                                                        |
| `requires.config`  | `string[]` | Becerinizin okuduğu yapılandırma dosyası yolları.                                                                                                         |
| `primaryEnv`       | `string`   | Beceriniz için ana kimlik bilgisi ortam değişkeni.                                                                                                        |
| `envVars`          | `array`    | `name`, isteğe bağlı `required` ve isteğe bağlı `description` içeren ortam değişkeni bildirimleri. İsteğe bağlı ortam değişkenleri için `required: false` ayarlayın. |
| `always`           | `boolean`  | `true` ise beceri her zaman etkindir (açık kurulum gerekmez).                                                                                             |
| `skillKey`         | `string`   | Becerinin çağırma anahtarını geçersiz kılar.                                                                                                              |
| `emoji`            | `string`   | Beceri için görüntüleme emojisi.                                                                                                                          |
| `homepage`         | `string`   | Becerinin ana sayfasına veya belgelerine giden URL.                                                                                                       |
| `os`               | `string[]` | İşletim sistemi kısıtlamaları (örn. `["macos"]`, `["linux"]`).                                                                                            |
| `install`          | `array`    | Bağımlılıklar için kurulum özellikleri (aşağıya bakın).                                                                                                   |
| `nix`              | `object`   | Nix Plugin özelliği (README'ye bakın).                                                                                                                    |
| `config`           | `object`   | Clawdbot yapılandırma özelliği (README'ye bakın).                                                                                                         |

### Kurulum özellikleri

Becerinizin kurulması gereken bağımlılıkları varsa bunları `install` dizisinde bildirin:

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

İsteğe bağlı ortam değişkenlerini `metadata.openclaw.envVars` altında bildirin ve `required: false` ayarlayın. İsteğe bağlı girdileri `requires.env` alanına eklemeyin, çünkü `requires.env` becerinin onlar olmadan çalışamayacağı anlamına gelir.

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

ClawHub'ın güvenlik analizi, becerinizin bildirdiği şeylerin gerçekte yaptığı şeylerle eşleştiğini denetler. Kodunuz `TODOIST_API_KEY` öğesine başvuruyorsa ancak ön maddeniz bunu `requires.env`, `primaryEnv` veya `envVars` altında bildirmiyorsa analiz bir meta veri uyuşmazlığını işaretler. Bildirimleri doğru tutmak, becerinizin incelemeden geçmesine yardımcı olur ve kullanıcıların ne kurduklarını anlamasını sağlar.

### Örnek: eksiksiz ön madde

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
- `text/` ile başlayan içerik türleri metin olarak değerlendirilir; buna ek olarak küçük bir izin listesi vardır (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Sınırlar (sunucu tarafı):

- Toplam paket boyutu: 50MB.
- Gömme metni, `SKILL.md` + yaklaşık 40 adede kadar `.md` olmayan dosyayı içerir (en iyi çaba üst sınırı).

## Kısa adlar

- Varsayılan olarak klasör adından türetilir.
- Küçük harfli ve URL güvenli olmalıdır: `^[a-z0-9][a-z0-9-]*$`.

## Sürümleme + etiketler

- Her yayınlama yeni bir sürüm (semver) oluşturur.
- Etiketler, bir sürüme işaret eden dize göstericileridir; `latest` yaygın olarak kullanılır.

## Lisans

- ClawHub'da yayınlanan tüm beceriler `MIT-0` kapsamında lisanslanır.
- Herkes yayınlanan becerileri ticari amaçlar dahil kullanabilir, değiştirebilir ve yeniden dağıtabilir.
- Atıf gerekli değildir.
- `SKILL.md` içinde çakışan lisans koşulları eklemeyin; ClawHub beceri başına lisans geçersiz kılmalarını desteklemez.

## Ücretli beceriler

- ClawHub ücretli becerileri, beceri başına fiyatlandırmayı, ödeme duvarlarını veya gelir paylaşımını desteklemez.
- `SKILL.md` içine fiyatlandırma meta verisi eklemeyin; bu, beceri biçiminin parçası değildir ve yayınlanan bir beceriyi ücretli yapmaz.
- Beceriniz ücretli bir üçüncü taraf hizmetle entegre oluyorsa harici maliyeti ve gerekli hesabı beceri talimatlarında ve ortam bildirimlerinde açıkça belgeleyin (zorunlu değişkenler için `requires.env` veya isteğe bağlı değişkenler için `required: false` ile `envVars`).

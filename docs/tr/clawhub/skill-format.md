---
read_when:
    - Skills yayımlama
    - Yayınlama/eşitleme hatalarını ayıklama
summary: Skill klasörü biçimi, gerekli dosyalar, izin verilen dosya türleri, sınırlar.
x-i18n:
    generated_at: "2026-05-12T23:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill biçimi

## Diskte

Bir skill bir klasördür.

Zorunlu:

- `SKILL.md` (veya `skill.md`)

İsteğe bağlı:

- destekleyici herhangi bir _metin tabanlı_ dosya (“İzin verilen dosyalar” bölümüne bakın)
- `.clawhubignore` (yayınlama/senkronizasyon için yoksayma desenleri, eski `.clawdhubignore`)
- `.gitignore` (bu da dikkate alınır)

Yerel kurulum meta verileri (CLI tarafından yazılır):

- `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

Çalışma dizini kurulum durumu (CLI tarafından yazılır):

- `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)

## `SKILL.md`

- İsteğe bağlı YAML frontmatter içeren Markdown.
- Sunucu, yayınlama sırasında meta verileri frontmatter’dan çıkarır.
- `description`, UI/arama içinde skill özeti olarak kullanılır.

## Frontmatter meta verileri

Skill meta verileri, `SKILL.md` dosyanızın üst kısmındaki YAML frontmatter içinde bildirilir. Bu, kayıt sistemine (ve güvenlik analizine) skill’inizin çalışmak için neye ihtiyaç duyduğunu söyler.

### Temel frontmatter

```yaml
---
name: my-skill
description: Bu skill’in ne yaptığının kısa özeti.
version: 1.0.0
---
```

### Çalışma zamanı meta verileri (`metadata.openclaw`)

Skill’inizin çalışma zamanı gereksinimlerini `metadata.openclaw` altında bildirin (takma adlar: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Todoist API aracılığıyla görevleri yönetin.
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

Skill çalışmadan önce mevcut olması gereken ortam değişkenleri için `requires.env` kullanın. İsteğe bağlı değişkenleri `required: false` ile belirtmek dahil, değişken başına meta veriye ihtiyaç duyduğunuzda `envVars` kullanın.

### Tam alan başvurusu

| Alan               | Tür        | Açıklama                                                                                                                                                    |
| ------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill’inizin beklediği zorunlu ortam değişkenleri.                                                                                                          |
| `requires.bins`    | `string[]` | Tamamı kurulu olması gereken CLI ikilileri.                                                                                                                  |
| `requires.anyBins` | `string[]` | En az birinin mevcut olması gereken CLI ikilileri.                                                                                                           |
| `requires.config`  | `string[]` | Skill’inizin okuduğu yapılandırma dosyası yolları.                                                                                                          |
| `primaryEnv`       | `string`   | Skill’iniz için ana kimlik bilgisi ortam değişkeni.                                                                                                         |
| `envVars`          | `array`    | `name`, isteğe bağlı `required` ve isteğe bağlı `description` içeren ortam değişkeni bildirimleri. İsteğe bağlı ortam değişkenleri için `required: false` ayarlayın. |
| `always`           | `boolean`  | `true` ise skill her zaman etkindir (açık kurulum gerekmez).                                                                                                |
| `skillKey`         | `string`   | Skill’in çağırma anahtarını geçersiz kılar.                                                                                                                 |
| `emoji`            | `string`   | Skill için görüntülenen emoji.                                                                                                                              |
| `homepage`         | `string`   | Skill’in ana sayfasına veya belgelerine giden URL.                                                                                                          |
| `os`               | `string[]` | İşletim sistemi kısıtlamaları (örn. `["macos"]`, `["linux"]`).                                                                                              |
| `install`          | `array`    | Bağımlılıklar için kurulum belirtimleri (aşağıya bakın).                                                                                                    |
| `nix`              | `object`   | Nix plugin belirtimi (README’ye bakın).                                                                                                                     |
| `config`           | `object`   | Clawdbot yapılandırma belirtimi (README’ye bakın).                                                                                                          |

### Kurulum belirtimleri

Skill’inizin bağımlılıklarının kurulması gerekiyorsa bunları `install` dizisinde bildirin:

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

İsteğe bağlı ortam değişkenlerini `metadata.openclaw.envVars` altında bildirin ve `required: false` ayarlayın. İsteğe bağlı girdileri `requires.env` içine eklemeyin, çünkü `requires.env` skill’in onlar olmadan çalışamayacağı anlamına gelir.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Kimliği doğrulanmış istekler için kullanılan Todoist API belirteci.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Kullanıcı bir tane belirtmediğinde isteğe bağlı varsayılan proje kimliği.
```

### Bu neden önemli

ClawHub’ın güvenlik analizi, skill’inizin bildirdiği şeylerin gerçekte yaptığı şeylerle eşleştiğini denetler. Kodunuz `TODOIST_API_KEY` öğesine başvuruyorsa ancak frontmatter bunu `requires.env`, `primaryEnv` veya `envVars` altında bildirmiyorsa analiz bir meta veri uyuşmazlığını işaretler. Bildirimleri doğru tutmak, skill’inizin incelemeden geçmesine yardımcı olur ve kullanıcıların ne kurduklarını anlamasını sağlar.

### Örnek: eksiksiz frontmatter

```yaml
---
name: todoist-cli
description: Todoist görevlerini, projelerini ve etiketlerini komut satırından yönetin.
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
        description: Todoist API belirteci.
      - name: TODOIST_PROJECT_ID
        required: false
        description: İsteğe bağlı varsayılan proje kimliği.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## İzin verilen dosyalar

Yayınlama tarafından yalnızca “metin tabanlı” dosyalar kabul edilir.

- Uzantı izin listesi `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) içindedir.
- Betik dosyaları yükleme sonrasında yine taranır; PowerShell `.ps1`, `.psm1` ve `.psd1` dosyaları metin olarak kabul edilir.
- `text/` ile başlayan içerik türleri metin olarak ele alınır; ayrıca küçük bir izin listesi vardır (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Sınırlar (sunucu tarafı):

- Toplam paket boyutu: 50MB.
- Gömme metni `SKILL.md` + yaklaşık 40 adede kadar `.md` olmayan dosya içerir (en iyi çaba üst sınırı).

## Slug’lar

- Varsayılan olarak klasör adından türetilir.
- Küçük harfli ve URL güvenli olmalıdır: `^[a-z0-9][a-z0-9-]*$`.

## Sürümleme + etiketler

- Her yayınlama yeni bir sürüm oluşturur (semver).
- Etiketler bir sürüme işaret eden string işaretçilerdir; `latest` yaygın olarak kullanılır.

## Lisans

- ClawHub’da yayınlanan tüm skills `MIT-0` kapsamında lisanslanır.
- Herkes yayınlanmış skills’i ticari amaçlar dahil kullanabilir, değiştirebilir ve yeniden dağıtabilir.
- Atıf gerekli değildir.
- `SKILL.md` içinde çakışan lisans koşulları eklemeyin; ClawHub skill başına lisans geçersiz kılmalarını desteklemez.

## Ücretli skills

- ClawHub ücretli skills’i, skill başına fiyatlandırmayı, ödeme duvarlarını veya gelir paylaşımını desteklemez.
- `SKILL.md` içine fiyatlandırma meta verisi eklemeyin; bu skill biçiminin bir parçası değildir ve yayınlanan bir skill’i ücretli yapmaz.
- Skill’iniz ücretli bir üçüncü taraf hizmetiyle entegre oluyorsa harici maliyeti ve gerekli hesabı skill yönergelerinde ve ortam bildirimlerinde açıkça belgeleyin (zorunlu değişkenler için `requires.env` veya isteğe bağlı değişkenler için `required: false` ile `envVars`).

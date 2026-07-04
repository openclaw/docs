---
read_when:
    - Skills yayımlama
    - Yayınlama hatalarında hata ayıklama
summary: Skill klasör biçimi, gerekli dosyalar, izin verilen dosya türleri, sınırlar.
x-i18n:
    generated_at: "2026-07-04T20:40:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill biçimi

## Disk üzerinde

Bir skill, bir klasördür.

Gerekli:

- `SKILL.md` (veya `skill.md`; eski `skills.md` de kabul edilir)

İsteğe bağlı:

- destekleyici herhangi bir _metin tabanlı_ dosya (“İzin verilen dosyalar” bölümüne bakın)
- `.clawhubignore` (yayınlama için yok sayma desenleri, eski `.clawdhubignore`)
- `.gitignore` (o da dikkate alınır)

## GitHub içe aktarma

Web GitHub içe aktarıcısı, yerel publish/sync işleminden daha katıdır. Yalnızca
oturum açmış GitHub hesabının sahibi olduğu herkese açık, fork olmayan depolardaki
`SKILL.md` veya eski `skills.md` dosyalarını keşfeder. Özel depoları, fork’ları,
arşivlenmiş/devre dışı bırakılmış depoları veya üçüncü taraf herkese açık depoları içe aktarmaz.

Yerel kurulum meta verileri (CLI tarafından yazılır):

- `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

Workdir kurulum durumu (CLI tarafından yazılır):

- `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)

## `SKILL.md`

- İsteğe bağlı YAML frontmatter içeren Markdown.
- Sunucu, publish sırasında meta verileri frontmatter’dan çıkarır.
- `description`, kullanıcı arayüzünde/aramada skill özeti olarak kullanılır.

## Frontmatter meta verileri

Skill meta verileri, `SKILL.md` dosyanızın üst kısmındaki YAML frontmatter’da bildirilir. Bu, kayıt defterine (ve güvenlik analizine) skill’inizin çalışmak için nelere ihtiyaç duyduğunu söyler.

### Temel frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Çalışma zamanı meta verileri (`metadata.openclaw`)

Skill’inizin çalışma zamanı gereksinimlerini `metadata.openclaw` altında bildirin (takma adlar: `metadata.clawdbot`, `metadata.clawdis`).

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

Skill’in çalışabilmesi için önceden mevcut olması gereken ortam değişkenleri için `requires.env` kullanın. İsteğe bağlı değişkenleri `required: false` ile belirtmek dahil, değişken başına meta veriye ihtiyaç duyduğunuzda `envVars` kullanın.

### Tam alan başvurusu

| Alan               | Tür        | Açıklama                                                                                                                                          |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill’inizin beklediği zorunlu ortam değişkenleri.                                                                                                |
| `requires.bins`    | `string[]` | Hepsinin kurulu olması gereken CLI ikili dosyaları.                                                                                                |
| `requires.anyBins` | `string[]` | En az birinin mevcut olması gereken CLI ikili dosyaları.                                                                                           |
| `requires.config`  | `string[]` | Skill’inizin okuduğu yapılandırma dosyası yolları.                                                                                                 |
| `primaryEnv`       | `string`   | Skill’inizin ana kimlik bilgisi ortam değişkeni.                                                                                                   |
| `envVars`          | `array`    | `name`, isteğe bağlı `required` ve isteğe bağlı `description` içeren ortam değişkeni bildirimleri. İsteğe bağlı ortam değişkenleri için `required: false` ayarlayın. |
| `always`           | `boolean`  | `true` ise skill her zaman etkindir (açık kurulum gerekmez).                                                                                       |
| `skillKey`         | `string`   | Skill’in çağırma anahtarını geçersiz kılar.                                                                                                        |
| `emoji`            | `string`   | Skill için görüntülenecek emoji.                                                                                                                   |
| `homepage`         | `string`   | Skill’in ana sayfasına veya belgelerine giden URL.                                                                                                 |
| `os`               | `string[]` | İşletim sistemi kısıtlamaları (örn. `["macos"]`, `["linux"]`).                                                                                    |
| `install`          | `array`    | Bağımlılıklar için kurulum belirtimleri (aşağıya bakın).                                                                                           |
| `nix`              | `object`   | Nix Plugin belirtimi (README’ye bakın).                                                                                                            |
| `config`           | `object`   | Clawdbot yapılandırma belirtimi (README’ye bakın).                                                                                                 |

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

İsteğe bağlı ortam değişkenlerini `metadata.openclaw.envVars` altında bildirin ve `required: false` ayarlayın. `requires.env` içine isteğe bağlı girdiler eklemeyin, çünkü `requires.env` skill’in onlar olmadan çalışamayacağı anlamına gelir.

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

ClawHub’ın güvenlik analizi, skill’inizin bildirdiği şeylerin gerçekten yaptığı şeylerle eşleştiğini kontrol eder. Kodunuz `TODOIST_API_KEY` başvurusu yapıyor ancak frontmatter bunu `requires.env`, `primaryEnv` veya `envVars` altında bildirmiyorsa analiz bir meta veri uyumsuzluğu işaretler. Bildirimleri doğru tutmak, skill’inizin incelemeden geçmesine yardımcı olur ve kullanıcıların ne kurduklarını anlamasını sağlar.

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

Publish tarafından yalnızca “metin tabanlı” dosyalar kabul edilir.

- Uzantı izin listesi `packages/schema/src/textFiles.ts` içindedir (`TEXT_FILE_EXTENSIONS`).
- Script dosyaları yüklemeden sonra hâlâ taranır; PowerShell `.ps1`, `.psm1` ve `.psd1` dosyaları metin olarak kabul edilir.
- `text/` ile başlayan içerik türleri metin olarak değerlendirilir; buna ek olarak küçük bir izin listesi vardır (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Sınırlar (sunucu tarafında):

- Toplam paket boyutu: 50MB.
- Gömme metni `SKILL.md` + yaklaşık 40 adede kadar `.md` olmayan dosya içerir (en iyi çaba üst sınırı).

## Slug’lar

- Varsayılan olarak klasör adından türetilir.
- Paket kapsamları, ClawHub yayıncı tanıtıcısıyla tam olarak eşleşmelidir. Yayıncı tanıtıcıları küçük harfler, sayılar, kısa çizgiler, noktalar ve alt çizgiler kullanabilir; küçük harf veya sayıyla başlamalı ve bitmelidir.
- Paket slug’ları küçük harfli ve npm güvenli olmalıdır; örneğin `@example.tools/demo-plugin` veya `demo-plugin`.

## Sürümleme + etiketler

- Her publish yeni bir sürüm oluşturur (semver).
- Etiketler bir sürüme yönelik string işaretçilerdir; `latest` yaygın olarak kullanılır.

## Lisans

- ClawHub’da yayınlanan tüm skills `MIT-0` kapsamında lisanslanır.
- Herkes yayınlanan skills’i ticari kullanım dahil kullanabilir, değiştirebilir ve yeniden dağıtabilir.
- Atıf gerekli değildir.
- `SKILL.md` içine çakışan lisans koşulları eklemeyin; ClawHub skill başına lisans geçersiz kılmalarını desteklemez.

## Ücretli skills

- ClawHub ücretli skills’i, skill başına fiyatlandırmayı, ödeme duvarlarını veya gelir paylaşımını desteklemez.
- `SKILL.md` içine fiyatlandırma meta verisi eklemeyin; bu, skill biçiminin parçası değildir ve yayınlanan bir skill’i ücretli yapmaz.
- Skill’iniz ücretli bir üçüncü taraf hizmetiyle entegre oluyorsa harici maliyeti ve gerekli hesabı skill talimatlarında ve ortam bildirimlerinde açıkça belgeleyin (zorunlu değişkenler için `requires.env` veya isteğe bağlı değişkenler için `required: false` içeren `envVars`).

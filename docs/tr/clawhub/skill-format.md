---
read_when:
    - Skills yayımlama
    - Yayımlama hatalarını ayıklama
summary: Skill klasörü biçimi, gerekli dosyalar, izin verilen dosya türleri, sınırlar.
x-i18n:
    generated_at: "2026-07-01T08:27:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Beceri formatı

## Disk üzerinde

Bir beceri bir klasördür.

Zorunlu:

- `SKILL.md` (veya `skill.md`; eski `skills.md` de kabul edilir)

İsteğe bağlı:

- destekleyici herhangi bir _metin tabanlı_ dosya (“İzin verilen dosyalar” bölümüne bakın)
- `.clawhubignore` (yayınlama için yoksayma kalıpları, eski `.clawdhubignore`)
- `.gitignore` (ayrıca dikkate alınır)

## GitHub içe aktarma

Web GitHub içe aktarıcısı, yerel publish/sync işleminden daha katıdır. Yalnızca oturum açmış GitHub hesabının sahibi olduğu herkese açık, fork olmayan depolarda `SKILL.md` veya eski `skills.md` dosyalarını keşfeder. Özel depoları, forkları, arşivlenmiş/devre dışı bırakılmış depoları veya üçüncü taraf herkese açık depoları içe aktarmaz.

Yerel kurulum meta verileri (CLI tarafından yazılır):

- `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

Workdir kurulum durumu (CLI tarafından yazılır):

- `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)

## `SKILL.md`

- İsteğe bağlı YAML frontmatter içeren Markdown.
- Sunucu, yayınlama sırasında frontmatter'dan meta verileri çıkarır.
- `description`, UI/arama içinde beceri özeti olarak kullanılır.

## Frontmatter meta verileri

Beceri meta verileri, `SKILL.md` dosyanızın en üstündeki YAML frontmatter içinde bildirilir. Bu, registry'ye (ve güvenlik analizine) becerinizin çalışmak için neye ihtiyaç duyduğunu söyler.

### Temel frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Runtime meta verileri (`metadata.openclaw`)

Becerinizin runtime gereksinimlerini `metadata.openclaw` altında bildirin (takma adlar: `metadata.clawdbot`, `metadata.clawdis`).

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

Beceri çalışmadan önce mevcut olması gereken ortam değişkenleri için `requires.env` kullanın. İsteğe bağlı değişkenler dahil olmak üzere değişken başına meta veri gerektiğinde `envVars` kullanın ve isteğe bağlı değişkenler için `required: false` belirtin.

### Tam alan referansı

| Alan               | Tür        | Açıklama                                                                                                                                           |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Becerinizin beklediği zorunlu ortam değişkenleri.                                                                                                  |
| `requires.bins`    | `string[]` | Tümünün kurulu olması gereken CLI ikilileri.                                                                                                       |
| `requires.anyBins` | `string[]` | En az birinin mevcut olması gereken CLI ikilileri.                                                                                                 |
| `requires.config`  | `string[]` | Becerinizin okuduğu config dosyası yolları.                                                                                                        |
| `primaryEnv`       | `string`   | Beceriniz için ana kimlik bilgisi ortam değişkeni.                                                                                                 |
| `envVars`          | `array`    | `name`, isteğe bağlı `required` ve isteğe bağlı `description` içeren ortam değişkeni bildirimleri. İsteğe bağlı env var'lar için `required: false` ayarlayın. |
| `always`           | `boolean`  | `true` ise beceri her zaman etkindir (açık kurulum gerekmez).                                                                                      |
| `skillKey`         | `string`   | Becerinin çağırma anahtarını geçersiz kılar.                                                                                                       |
| `emoji`            | `string`   | Beceri için görüntülenecek emoji.                                                                                                                  |
| `homepage`         | `string`   | Becerinin ana sayfasına veya dokümantasyonuna URL.                                                                                                 |
| `os`               | `string[]` | OS kısıtlamaları (örn. `["macos"]`, `["linux"]`).                                                                                                  |
| `install`          | `array`    | Bağımlılıklar için kurulum özellikleri (aşağıya bakın).                                                                                            |
| `nix`              | `object`   | Nix Plugin özelliği (README'ye bakın).                                                                                                            |
| `config`           | `object`   | Clawdbot config özelliği (README'ye bakın).                                                                                                       |

### Kurulum özellikleri

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

### Bu neden önemli

ClawHub'ın güvenlik analizi, becerinizin bildirdiği şeylerle gerçekte yaptığı şeylerin eşleştiğini kontrol eder. Kodunuz `TODOIST_API_KEY` başvurusu yapıyor ancak frontmatter bunu `requires.env`, `primaryEnv` veya `envVars` altında bildirmiyorsa analiz bir meta veri uyuşmazlığı işaretler. Bildirimleri doğru tutmak, becerinizin incelemeden geçmesine yardımcı olur ve kullanıcıların ne kurduklarını anlamasını sağlar.

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

- Uzantı allowlist'i `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) içindedir.
- Script dosyaları yüklemeden sonra yine taranır; PowerShell `.ps1`, `.psm1` ve `.psd1` dosyaları metin olarak kabul edilir.
- `text/` ile başlayan içerik türleri metin olarak değerlendirilir; ayrıca küçük bir allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG) vardır.

Sınırlar (sunucu tarafı):

- Toplam bundle boyutu: 50MB.
- Embedding metni `SKILL.md` + yaklaşık 40 adede kadar `.md` olmayan dosya içerir (en iyi çaba sınırı).

## Slug'lar

- Varsayılan olarak klasör adından türetilir.
- Paket scope'ları ClawHub yayıncı tanıtıcısıyla tam olarak eşleşmelidir. Yayıncı tanıtıcıları küçük harfler, sayılar, kısa çizgiler, noktalar ve alt çizgiler kullanabilir; küçük harf veya sayı ile başlayıp bitmelidir.
- Paket slug'ları küçük harfli ve npm-safe olmalıdır, örneğin `@example.tools/demo-plugin` veya `demo-plugin`.

## Sürümleme + etiketler

- Her publish yeni bir sürüm (semver) oluşturur.
- Etiketler bir sürüme işaret eden string pointer'lardır; `latest` yaygın olarak kullanılır.

## Lisans

- ClawHub'da yayınlanan tüm beceriler `MIT-0` altında lisanslanır.
- Herkes yayınlanan becerileri ticari kullanım dahil kullanabilir, değiştirebilir ve yeniden dağıtabilir.
- Atıf gerekli değildir.
- `SKILL.md` içine çakışan lisans şartları eklemeyin; ClawHub beceri başına lisans geçersiz kılmalarını desteklemez.

## Ücretli beceriler

- ClawHub ücretli becerileri, beceri başına fiyatlandırmayı, paywall'ları veya gelir paylaşımını desteklemez.
- `SKILL.md` içine fiyatlandırma meta verisi eklemeyin; bu beceri formatının parçası değildir ve yayınlanmış bir beceriyi ücretli yapmaz.
- Beceriniz ücretli bir üçüncü taraf hizmetle entegre oluyorsa dış maliyeti ve gerekli hesabı beceri talimatlarında ve env bildirimlerinde açıkça belgeleyin (zorunlu değişkenler için `requires.env` veya isteğe bağlı değişkenler için `required: false` içeren `envVars`).

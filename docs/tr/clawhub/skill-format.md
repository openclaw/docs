---
read_when:
    - Skills yayımlama
    - Yayınlama hatalarını ayıklama
summary: Skill klasörü biçimi, gerekli dosyalar, izin verilen dosya türleri, sınırlar.
x-i18n:
    generated_at: "2026-07-01T15:30:06Z"
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

- destekleyici herhangi bir _metin tabanlı_ dosya (bkz. “İzin verilen dosyalar”)
- `.clawhubignore` (yayımlama için yok sayma desenleri, eski `.clawdhubignore`)
- `.gitignore` (o da dikkate alınır)

## GitHub içe aktarma

Web GitHub içe aktarıcısı, yerel yayımlama/eşitlemeye göre daha katıdır. Yalnızca
oturum açmış GitHub hesabının sahip olduğu herkese açık, fork olmayan depolardaki
`SKILL.md` veya eski `skills.md` dosyalarını keşfeder. Özel depoları, forkları,
arşivlenmiş/devre dışı bırakılmış depoları veya üçüncü taraf herkese açık depoları içe aktarmaz.

Yerel kurulum meta verileri (CLI tarafından yazılır):

- `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

Çalışma dizini kurulum durumu (CLI tarafından yazılır):

- `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)

## `SKILL.md`

- İsteğe bağlı YAML frontmatter içeren Markdown.
- Sunucu, yayımlama sırasında meta verileri frontmatter’dan çıkarır.
- `description`, UI/aramada skill özeti olarak kullanılır.

## Frontmatter meta verileri

Skill meta verileri, `SKILL.md` dosyanızın en üstündeki YAML frontmatter içinde bildirilir. Bu, kayıt defterine (ve güvenlik analizine) skill’inizin çalışmak için neye ihtiyaç duyduğunu söyler.

### Temel frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Runtime meta verileri (`metadata.openclaw`)

Skill’inizin runtime gereksinimlerini `metadata.openclaw` altında bildirin (alias’lar: `metadata.clawdbot`, `metadata.clawdis`).

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

Skill çalışmadan önce mevcut olması gereken ortam değişkenleri için `requires.env` kullanın. İsteğe bağlı değişkenleri `required: false` ile birlikte içeren, değişken başına meta veriye ihtiyacınız olduğunda `envVars` kullanın.

### Tam alan başvurusu

| Alan               | Tür        | Açıklama                                                                                                                                     |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill’inizin beklediği gerekli ortam değişkenleri.                                                                                           |
| `requires.bins`    | `string[]` | Tümünün kurulu olması gereken CLI ikilileri.                                                                                                  |
| `requires.anyBins` | `string[]` | En az birinin mevcut olması gereken CLI ikilileri.                                                                                            |
| `requires.config`  | `string[]` | Skill’inizin okuduğu config dosyası yolları.                                                                                                  |
| `primaryEnv`       | `string`   | Skill’iniz için ana kimlik bilgisi ortam değişkeni.                                                                                           |
| `envVars`          | `array`    | `name`, isteğe bağlı `required` ve isteğe bağlı `description` içeren ortam değişkeni bildirimleri. İsteğe bağlı ortam değişkenleri için `required: false` ayarlayın. |
| `always`           | `boolean`  | `true` ise skill her zaman etkindir (açık kurulum gerekmez).                                                                                  |
| `skillKey`         | `string`   | Skill’in çağırma anahtarını geçersiz kılar.                                                                                                   |
| `emoji`            | `string`   | Skill için görüntülenecek emoji.                                                                                                              |
| `homepage`         | `string`   | Skill’in ana sayfasına veya dokümanlarına URL.                                                                                                |
| `os`               | `string[]` | OS kısıtlamaları (örn. `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | Bağımlılıklar için kurulum tanımları (aşağıya bakın).                                                                                         |
| `nix`              | `object`   | Nix Plugin tanımı (README’ye bakın).                                                                                                          |
| `config`           | `object`   | Clawdbot config tanımı (README’ye bakın).                                                                                                     |

### Kurulum tanımları

Skill’inizin bağımlılıkların kurulmasına ihtiyacı varsa bunları `install` dizisinde bildirin:

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
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Bu neden önemli

ClawHub’ın güvenlik analizi, skill’inizin bildirdiği şeylerin gerçekten yaptığı şeylerle eşleştiğini denetler. Kodunuz `TODOIST_API_KEY` öğesine başvuruyor ancak frontmatter’ınız bunu `requires.env`, `primaryEnv` veya `envVars` altında bildirmiyorsa analiz bir meta veri uyumsuzluğunu işaretler. Bildirimleri doğru tutmak, skill’inizin incelemeden geçmesine ve kullanıcıların ne kurduklarını anlamasına yardımcı olur.

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

- Uzantı izin listesi `packages/schema/src/textFiles.ts` içinde bulunur (`TEXT_FILE_EXTENSIONS`).
- Betik dosyaları yüklemeden sonra yine de taranır; PowerShell `.ps1`, `.psm1` ve `.psd1` dosyaları metin olarak kabul edilir.
- `text/` ile başlayan içerik türleri metin olarak değerlendirilir; buna ek olarak küçük bir izin listesi vardır (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Sınırlar (sunucu tarafı):

- Toplam paket boyutu: 50 MB.
- Gömme metni, `SKILL.md` + yaklaşık 40 adede kadar `.md` olmayan dosya içerir (en iyi çaba sınırı).

## Slug’lar

- Varsayılan olarak klasör adından türetilir.
- Paket kapsamları, ClawHub yayıncı tanıtıcısıyla tam olarak eşleşmelidir. Yayıncı tanıtıcıları küçük harfler, sayılar, tireler, noktalar ve alt çizgiler kullanabilir; küçük harf veya sayıyla başlayıp bitmelidir.
- Paket slug’ları küçük harfli ve npm açısından güvenli olmalıdır; örneğin `@example.tools/demo-plugin` veya `demo-plugin`.

## Sürümleme + etiketler

- Her yayımlama yeni bir sürüm oluşturur (semver).
- Etiketler, bir sürüme işaret eden dize işaretçileridir; `latest` yaygın olarak kullanılır.

## Lisans

- ClawHub’da yayımlanan tüm skill’ler `MIT-0` altında lisanslanır.
- Herkes yayımlanmış skill’leri ticari kullanım dahil olmak üzere kullanabilir, değiştirebilir ve yeniden dağıtabilir.
- Atıf gerekli değildir.
- `SKILL.md` içine çelişen lisans koşulları eklemeyin; ClawHub, skill başına lisans geçersiz kılmalarını desteklemez.

## Ücretli skill’ler

- ClawHub ücretli skill’leri, skill başına fiyatlandırmayı, ödeme duvarlarını veya gelir paylaşımını desteklemez.
- `SKILL.md` içine fiyatlandırma meta verileri eklemeyin; bu, skill biçiminin parçası değildir ve yayımlanmış bir skill’i ücretli yapmaz.
- Skill’iniz ücretli bir üçüncü taraf hizmetle entegre oluyorsa harici maliyeti ve gerekli hesabı skill talimatlarında ve env bildirimlerinde açıkça belgeleyin (gerekli değişkenler için `requires.env` veya isteğe bağlı değişkenler için `required: false` ile `envVars`).

---
read_when:
    - Skills yayımlama
    - Yayınlama hatalarını ayıklama
summary: Skill klasörü biçimi, gerekli dosyalar, izin verilen dosya türleri, sınırlar.
x-i18n:
    generated_at: "2026-07-05T05:30:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Yetenek biçimi

## Diskte

Bir yetenek, bir klasördür.

Gerekli:

- `SKILL.md` (veya `skill.md`; eski `skills.md` de kabul edilir)

İsteğe bağlı:

- destekleyici herhangi bir _metin tabanlı_ dosya (bkz. “İzin verilen dosyalar”)
- `.clawhubignore` (yayınlama için yok sayma desenleri, eski `.clawdhubignore`)
- `.gitignore` (buna da uyulur)

## GitHub içe aktarma

Web GitHub içe aktarıcısı, yerel yayınlama/eşitlemeden daha katıdır. Yalnızca oturum açmış GitHub hesabına ait herkese açık, fork olmayan depolardaki `SKILL.md` veya eski `skills.md` dosyalarını keşfeder. Özel depoları, forkları, arşivlenmiş/devre dışı bırakılmış depoları veya üçüncü taraf herkese açık depoları içe aktarmaz.

Yerel kurulum meta verileri (CLI tarafından yazılır):

- `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

Çalışma dizini kurulum durumu (CLI tarafından yazılır):

- `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)

## `SKILL.md`

- İsteğe bağlı YAML frontmatter içeren Markdown.
- Sunucu, yayınlama sırasında meta verileri frontmatter’dan çıkarır.
- `description`, kullanıcı arayüzünde/aramada yetenek özeti olarak kullanılır.

## Frontmatter meta verileri

Yetenek meta verileri, `SKILL.md` dosyanızın üst kısmındaki YAML frontmatter içinde bildirilir. Bu, kayıt defterine (ve güvenlik analizine) yeteneğinizin çalışmak için neye ihtiyaç duyduğunu söyler.

### Temel frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Çalışma zamanı meta verileri (`metadata.openclaw`)

Yeteneğinizin çalışma zamanı gereksinimlerini `metadata.openclaw` altında bildirin (takma adlar: `metadata.clawdbot`, `metadata.clawdis`).

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

Yetenek çalışmadan önce mevcut olması gereken ortam değişkenleri için `requires.env` kullanın. İsteğe bağlı değişkenler dahil olmak üzere değişken başına meta veriye ihtiyacınız olduğunda `envVars` kullanın ve `required: false` ayarlayın.

### Tam alan başvurusu

| Alan               | Tür        | Açıklama                                                                                                                                 |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Yeteneğinizin beklediği gerekli ortam değişkenleri.                                                                                      |
| `requires.bins`    | `string[]` | Tümünün kurulu olması gereken CLI ikilileri.                                                                                              |
| `requires.anyBins` | `string[]` | En az birinin mevcut olması gereken CLI ikilileri.                                                                                        |
| `requires.config`  | `string[]` | Yeteneğinizin okuduğu yapılandırma dosyası yolları.                                                                                       |
| `primaryEnv`       | `string`   | Yeteneğiniz için ana kimlik bilgisi ortam değişkeni.                                                                                      |
| `envVars`          | `array`    | `name`, isteğe bağlı `required` ve isteğe bağlı `description` içeren ortam değişkeni bildirimleri. İsteğe bağlı ortam değişkenleri için `required: false` ayarlayın. |
| `always`           | `boolean`  | `true` ise yetenek her zaman etkindir (açık kurulum gerekmez).                                                                            |
| `skillKey`         | `string`   | Yeteneğin çağırma anahtarını geçersiz kılar.                                                                                              |
| `emoji`            | `string`   | Yetenek için görüntü emojisi.                                                                                                             |
| `homepage`         | `string`   | Yeteneğin ana sayfasına veya belgelerine URL.                                                                                             |
| `os`               | `string[]` | İşletim sistemi kısıtlamaları (örn. `["macos"]`, `["linux"]`).                                                                            |
| `install`          | `array`    | Bağımlılıklar için kurulum belirtimleri (aşağıya bakın).                                                                                  |
| `nix`              | `object`   | Nix Plugin belirtimi (README’ye bakın).                                                                                                   |
| `config`           | `object`   | Clawdbot yapılandırma belirtimi (README’ye bakın).                                                                                        |

### Kurulum belirtimleri

Yeteneğinizin bağımlılıkların kurulmasına ihtiyacı varsa, bunları `install` dizisinde bildirin:

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

İsteğe bağlı ortam değişkenlerini `metadata.openclaw.envVars` altında bildirin ve `required: false` ayarlayın. İsteğe bağlı girdileri `requires.env` içine eklemeyin; çünkü `requires.env`, yeteneğin bunlar olmadan çalışamayacağı anlamına gelir.

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

ClawHub’ın güvenlik analizi, yeteneğinizin bildirdikleriyle gerçekte yaptıklarının eşleşip eşleşmediğini kontrol eder. Kodunuz `TODOIST_API_KEY` öğesine başvuruyorsa ancak frontmatter bunu `requires.env`, `primaryEnv` veya `envVars` altında bildirmiyorsa analiz bir meta veri uyumsuzluğu işaretler. Bildirimleri doğru tutmak, yeteneğinizin incelemeden geçmesine ve kullanıcıların ne kurduklarını anlamasına yardımcı olur.

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
- `text/` ile başlayan içerik türleri metin olarak değerlendirilir; buna ek olarak küçük bir izin listesi vardır (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Sınırlar (sunucu tarafı):

- Toplam paket boyutu: 50MB.
- Gömme metni `SKILL.md` + yaklaşık 40’a kadar `.md` olmayan dosya içerir (en iyi çaba sınırı).

## Slug’lar

- Varsayılan olarak klasör adından türetilir.
- Paket kapsamları ClawHub yayıncı tanıtıcısıyla tam olarak eşleşmelidir. Yayıncı tanıtıcıları küçük harfler, sayılar, tireler, noktalar ve alt çizgiler kullanabilir; küçük harf veya sayı ile başlamalı ve bitmelidir.
- Paket slug’ları küçük harfli ve npm açısından güvenli olmalıdır; örneğin `@example.tools/demo-plugin` veya `demo-plugin`.

## Sürümleme + etiketler

- Her yayınlama yeni bir sürüm oluşturur (semver).
- Etiketler bir sürüme yönelik dize işaretçileridir; `latest` yaygın olarak kullanılır.

## Lisans

- ClawHub’da yayınlanan tüm yetenekler `MIT-0` kapsamında lisanslanır.
- Herkes yayınlanan yetenekleri ticari kullanım dahil kullanabilir, değiştirebilir ve yeniden dağıtabilir.
- Atıf gerekli değildir.
- `SKILL.md` içine çelişen lisans koşulları eklemeyin; ClawHub yetenek başına lisans geçersiz kılmalarını desteklemez.

## Ücretli yetenekler

- ClawHub ücretli yetenekleri, yetenek başına fiyatlandırmayı, ödeme duvarlarını veya gelir paylaşımını desteklemez.
- `SKILL.md` içine fiyatlandırma meta verisi eklemeyin; bu, yetenek biçiminin parçası değildir ve yayınlanan bir yeteneği ücretli yapmaz.
- Yeteneğiniz ücretli bir üçüncü taraf hizmetle entegre oluyorsa, dış maliyeti ve gerekli hesabı yetenek yönergelerinde ve ortam bildirimlerinde açıkça belgeleyin (gerekli değişkenler için `requires.env` veya isteğe bağlı değişkenler için `required: false` ile `envVars`).

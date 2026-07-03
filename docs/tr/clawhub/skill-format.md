---
read_when:
    - Skills yayımlama
    - Yayınlama hatalarında hata ayıklama
summary: Skill klasörü biçimi, gerekli dosyalar, izin verilen dosya türleri, sınırlar.
x-i18n:
    generated_at: "2026-07-03T01:02:42Z"
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

Web GitHub içe aktarıcısı, yerel publish/sync işleminden daha katıdır. Yalnızca oturum açmış GitHub hesabının sahibi olduğu herkese açık, fork olmayan depolardaki
`SKILL.md` veya eski `skills.md` dosyalarını keşfeder. Özel depoları, forkları,
arşivlenmiş/devre dışı bırakılmış depoları veya üçüncü taraf herkese açık depoları içe aktarmaz.

Yerel kurulum meta verileri (CLI tarafından yazılır):

- `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

Çalışma dizini kurulum durumu (CLI tarafından yazılır):

- `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)

## `SKILL.md`

- İsteğe bağlı YAML frontmatter içeren Markdown.
- Sunucu, yayınlama sırasında meta verileri frontmatter’dan çıkarır.
- `description`, UI/aramada skill özeti olarak kullanılır.

## Frontmatter meta verileri

Skill meta verileri, `SKILL.md` dosyanızın üst kısmındaki YAML frontmatter içinde bildirilir. Bu, kayıt sistemine (ve güvenlik analizine) skill’inizin çalışmak için neye ihtiyaç duyduğunu söyler.

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

Skill çalışmadan önce mevcut olması gereken ortam değişkenleri için `requires.env` kullanın. İsteğe bağlı değişkenleri `required: false` ile birlikte içeren değişken başına meta verilere ihtiyaç duyduğunuzda `envVars` kullanın.

### Tam alan referansı

| Alan               | Tür        | Açıklama                                                                                                                                          |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill’inizin beklediği gerekli ortam değişkenleri.                                                                                                |
| `requires.bins`    | `string[]` | Tümünün kurulu olması gereken CLI ikili dosyaları.                                                                                                |
| `requires.anyBins` | `string[]` | En az birinin mevcut olması gereken CLI ikili dosyaları.                                                                                          |
| `requires.config`  | `string[]` | Skill’inizin okuduğu yapılandırma dosyası yolları.                                                                                                |
| `primaryEnv`       | `string`   | Skill’iniz için ana kimlik bilgisi ortam değişkeni.                                                                                               |
| `envVars`          | `array`    | `name`, isteğe bağlı `required` ve isteğe bağlı `description` içeren ortam değişkeni bildirimleri. İsteğe bağlı ortam değişkenleri için `required: false` ayarlayın. |
| `always`           | `boolean`  | `true` ise skill her zaman etkindir (açık kurulum gerekmez).                                                                                      |
| `skillKey`         | `string`   | Skill’in çağırma anahtarını geçersiz kılar.                                                                                                       |
| `emoji`            | `string`   | Skill için gösterim emojisi.                                                                                                                      |
| `homepage`         | `string`   | Skill’in ana sayfasına veya belgelerine giden URL.                                                                                                |
| `os`               | `string[]` | İşletim sistemi kısıtlamaları (örn. `["macos"]`, `["linux"]`).                                                                                    |
| `install`          | `array`    | Bağımlılıklar için kurulum belirtimleri (aşağıya bakın).                                                                                         |
| `nix`              | `object`   | Nix Plugin belirtimi (README’ye bakın).                                                                                                           |
| `config`           | `object`   | Clawdbot yapılandırma belirtimi (README’ye bakın).                                                                                                |

### Kurulum belirtimleri

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

ClawHub’ın güvenlik analizi, skill’inizin bildirdikleriyle gerçekte yaptıklarının eşleşip eşleşmediğini denetler. Kodunuz `TODOIST_API_KEY` başvurusunda bulunuyor ancak frontmatter bunu `requires.env`, `primaryEnv` veya `envVars` altında bildirmiyorsa analiz bir meta veri uyuşmazlığı işaretler. Bildirimleri doğru tutmak, skill’inizin incelemeden geçmesine yardımcı olur ve kullanıcıların ne kurduklarını anlamasını sağlar.

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
- Betik dosyaları yüklemeden sonra yine de taranır; PowerShell `.ps1`, `.psm1` ve `.psd1` dosyaları metin olarak kabul edilir.
- `text/` ile başlayan içerik türleri metin olarak değerlendirilir; buna küçük bir izin listesi de eklenir (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Sınırlar (sunucu tarafı):

- Toplam paket boyutu: 50 MB.
- Gömme metni `SKILL.md` + yaklaşık 40 adede kadar `.md` olmayan dosya içerir (en iyi çaba sınırı).

## Slug’lar

- Varsayılan olarak klasör adından türetilir.
- Paket kapsamları ClawHub yayıncı tanıtıcısıyla tam olarak eşleşmelidir. Yayıncı tanıtıcıları küçük harfler, rakamlar, kısa çizgiler, noktalar ve alt çizgiler kullanabilir; küçük harf veya rakamla başlamalı ve bitmelidir.
- Paket slug’ları küçük harfli ve npm açısından güvenli olmalıdır; örneğin `@example.tools/demo-plugin` veya `demo-plugin`.

## Sürümleme + etiketler

- Her yayınlama yeni bir sürüm oluşturur (semver).
- Etiketler bir sürüme yönelik string işaretçilerdir; `latest` yaygın olarak kullanılır.

## Lisans

- ClawHub’da yayınlanan tüm skill’ler `MIT-0` kapsamında lisanslanır.
- Herkes yayınlanan skill’leri ticari kullanım dahil olmak üzere kullanabilir, değiştirebilir ve yeniden dağıtabilir.
- Atıf gerekli değildir.
- `SKILL.md` içinde çakışan lisans koşulları eklemeyin; ClawHub skill başına lisans geçersiz kılmalarını desteklemez.

## Ücretli skill’ler

- ClawHub ücretli skill’leri, skill başına fiyatlandırmayı, ödeme duvarlarını veya gelir paylaşımını desteklemez.
- `SKILL.md` içine fiyatlandırma meta verileri eklemeyin; bu skill biçiminin bir parçası değildir ve yayınlanan bir skill’i ücretli yapmaz.
- Skill’iniz ücretli bir üçüncü taraf hizmetle entegre oluyorsa dış maliyeti ve gereken hesabı skill yönergelerinde ve ortam bildirimlerinde açıkça belgeleyin (gerekli değişkenler için `requires.env` veya isteğe bağlı değişkenler için `required: false` içeren `envVars`).

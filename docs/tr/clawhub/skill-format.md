---
read_when:
    - Skills yayımlama
    - Yayınlama hatalarında hata ayıklama
summary: Skill klasörü biçimi, gerekli dosyalar, izin verilen dosya türleri, sınırlar.
x-i18n:
    generated_at: "2026-07-03T09:53:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Beceri biçimi

## Diskte

Bir beceri bir klasördür.

Gerekli:

- `SKILL.md` (veya `skill.md`; eski `skills.md` de kabul edilir)

İsteğe bağlı:

- destekleyici herhangi bir _metin tabanlı_ dosya (bkz. “İzin verilen dosyalar”)
- `.clawhubignore` (yayınlama için yok sayma kalıpları, eski `.clawdhubignore`)
- `.gitignore` (ayrıca dikkate alınır)

## GitHub içe aktarma

Web GitHub içe aktarıcısı, yerel publish/sync işleminden daha katıdır. Yalnızca oturum açmış GitHub hesabının sahip olduğu herkese açık, fork olmayan depolardaki
`SKILL.md` veya eski `skills.md` dosyalarını keşfeder. Özel depoları, fork'ları,
arşivlenmiş/devre dışı bırakılmış depoları veya üçüncü taraf herkese açık depoları içe aktarmaz.

Yerel kurulum meta verileri (CLI tarafından yazılır):

- `<skill>/.clawhub/origin.json` (eski `.clawdhub`)

Çalışma dizini kurulum durumu (CLI tarafından yazılır):

- `<workdir>/.clawhub/lock.json` (eski `.clawdhub`)

## `SKILL.md`

- İsteğe bağlı YAML frontmatter içeren Markdown.
- Sunucu, yayınlama sırasında meta verileri frontmatter'dan çıkarır.
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

Beceri çalışmadan önce mevcut olması gereken ortam değişkenleri için `requires.env` kullanın. İsteğe bağlı değişkenler de dahil olmak üzere değişken başına meta verilere ihtiyacınız olduğunda `envVars` kullanın ve isteğe bağlı değişkenler için `required: false` ayarlayın.

### Tam alan başvurusu

| Alan               | Tür        | Açıklama                                                                                                                                 |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Becerinizin beklediği gerekli ortam değişkenleri.                                                                                        |
| `requires.bins`    | `string[]` | Tamamının kurulu olması gereken CLI ikili dosyaları.                                                                                     |
| `requires.anyBins` | `string[]` | En az birinin mevcut olması gereken CLI ikili dosyaları.                                                                                 |
| `requires.config`  | `string[]` | Becerinizin okuduğu yapılandırma dosyası yolları.                                                                                        |
| `primaryEnv`       | `string`   | Beceriniz için ana kimlik bilgisi ortam değişkeni.                                                                                       |
| `envVars`          | `array`    | `name`, isteğe bağlı `required` ve isteğe bağlı `description` içeren ortam değişkeni bildirimleri. İsteğe bağlı ortam değişkenleri için `required: false` ayarlayın. |
| `always`           | `boolean`  | `true` ise beceri her zaman etkindir (açık kurulum gerekmez).                                                                            |
| `skillKey`         | `string`   | Becerinin çağırma anahtarını geçersiz kılın.                                                                                             |
| `emoji`            | `string`   | Beceri için görüntülenecek emoji.                                                                                                        |
| `homepage`         | `string`   | Becerinin ana sayfası veya dokümantasyonu için URL.                                                                                      |
| `os`               | `string[]` | İşletim sistemi kısıtlamaları (örn. `["macos"]`, `["linux"]`).                                                                           |
| `install`          | `array`    | Bağımlılıklar için kurulum belirtimleri (aşağıya bakın).                                                                                 |
| `nix`              | `object`   | Nix Plugin belirtimi (README'ye bakın).                                                                                                  |
| `config`           | `object`   | Clawdbot yapılandırma belirtimi (README'ye bakın).                                                                                       |

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

İsteğe bağlı ortam değişkenlerini `metadata.openclaw.envVars` altında bildirin ve `required: false` ayarlayın. İsteğe bağlı girdileri `requires.env` içine eklemeyin; çünkü `requires.env`, becerinin onlar olmadan çalışamayacağı anlamına gelir.

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

ClawHub'ın güvenlik analizi, becerinizin bildirdiği şeylerin gerçekten yaptığı şeylerle eşleştiğini kontrol eder. Kodunuz `TODOIST_API_KEY` öğesine başvuruyorsa ancak frontmatter bunu `requires.env`, `primaryEnv` veya `envVars` altında bildirmiyorsa analiz bir meta veri uyumsuzluğunu işaretler. Bildirimleri doğru tutmak, becerinizin incelemeden geçmesine yardımcı olur ve kullanıcıların ne kurduklarını anlamalarını sağlar.

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

- Uzantı izin listesi `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) içindedir.
- Betik dosyaları yüklemeden sonra yine de taranır; PowerShell `.ps1`, `.psm1` ve `.psd1` dosyaları metin olarak kabul edilir.
- `text/` ile başlayan içerik türleri metin olarak değerlendirilir; ayrıca küçük bir izin listesi vardır (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Sınırlar (sunucu tarafı):

- Toplam paket boyutu: 50MB.
- Gömme metni `SKILL.md` + en fazla yaklaşık 40 adet `.md` olmayan dosyayı içerir (en iyi çaba sınırı).

## Slug'lar

- Varsayılan olarak klasör adından türetilir.
- Paket kapsamları, ClawHub yayıncı tanıtıcısıyla tam olarak eşleşmelidir. Yayıncı tanıtıcıları küçük harfler, rakamlar, kısa çizgiler, noktalar ve alt çizgiler kullanabilir; küçük harf veya rakamla başlamalı ve bitmelidir.
- Paket slug'ları küçük harfli ve npm açısından güvenli olmalıdır; örneğin `@example.tools/demo-plugin` veya `demo-plugin`.

## Sürümleme + etiketler

- Her publish yeni bir sürüm (semver) oluşturur.
- Etiketler bir sürüme işaret eden string göstericilerdir; `latest` yaygın olarak kullanılır.

## Lisans

- ClawHub'da yayınlanan tüm beceriler `MIT-0` altında lisanslanır.
- Herkes yayınlanan becerileri ticari kullanım dahil olmak üzere kullanabilir, değiştirebilir ve yeniden dağıtabilir.
- Atıf gerekli değildir.
- `SKILL.md` içine çakışan lisans koşulları eklemeyin; ClawHub beceri başına lisans geçersiz kılmalarını desteklemez.

## Ücretli beceriler

- ClawHub ücretli becerileri, beceri başına fiyatlandırmayı, ödeme duvarlarını veya gelir paylaşımını desteklemez.
- `SKILL.md` içine fiyatlandırma meta verisi eklemeyin; bu, beceri biçiminin parçası değildir ve yayınlanan bir beceriyi ücretli yapmaz.
- Beceriniz ücretli bir üçüncü taraf hizmetle entegre oluyorsa harici maliyeti ve gerekli hesabı beceri talimatlarında ve ortam bildirimlerinde açıkça belgeleyin (gerekli değişkenler için `requires.env` veya isteğe bağlı değişkenler için `required: false` ile `envVars`).

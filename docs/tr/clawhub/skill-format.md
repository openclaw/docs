---
read_when:
    - Skills yayımlama
    - Yayımlama hatalarında hata ayıklama
summary: Skill klasörü biçimi, gerekli dosyalar, izin verilen dosya türleri ve sınırlar.
x-i18n:
    generated_at: "2026-07-12T11:32:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill biçimi

## Disk üzerinde

Bir skill, bir klasördür.

Zorunlu:

- `SKILL.md` (veya `skill.md`; eski `skills.md` de kabul edilir)

İsteğe bağlı:

- destekleyici herhangi bir _metin tabanlı_ dosya (bkz. “İzin verilen dosyalar”)
- `.clawhubignore` (yayımlama için yok sayma kalıpları, eski adı `.clawdhubignore`)
- `.gitignore` (bu da dikkate alınır)

## GitHub içe aktarma

Web tabanlı GitHub içe aktarıcısı, yerel yayımlama/eşitleme işleminden daha katıdır. Yalnızca oturum açmış GitHub hesabının sahibi olduğu, herkese açık ve çatallanmış olmayan depolardaki `SKILL.md` veya eski `skills.md` dosyalarını keşfeder. Özel depoları, çatalları, arşivlenmiş/devre dışı bırakılmış depoları veya üçüncü taraflara ait herkese açık depoları içe aktarmaz.

Yerel kurulum meta verileri (CLI tarafından yazılır):

- `<skill>/.clawhub/origin.json` (eski adı `.clawdhub`)

Çalışma dizini kurulum durumu (CLI tarafından yazılır):

- `<workdir>/.clawhub/lock.json` (eski adı `.clawdhub`)

## `SKILL.md`

- İsteğe bağlı YAML ön bilgisi içeren Markdown.
- Sunucu, yayımlama sırasında meta verileri ön bilgiden çıkarır.
- `description`, kullanıcı arayüzünde/aramada skill özeti olarak kullanılır.

Taşınabilir Agent Skills için `name`, üst dizinle eşleşmeli ve 1–64 küçük harf, rakam veya kısa çizgiden oluşmalıdır. ClawHub, yönlendirilebilir kısa adı ve katalog görünen adını ayrı tutar; böylece diğer istemcilerdeki mevcut adlar yayımlanabilir kalır ve sessizce yeniden yazılmaz. Katalog listeleri, depolanan adı değiştirmeden uzun adları görsel olarak kısaltabilir.

## Ön bilgi meta verileri

Skill meta verileri, `SKILL.md` dosyanızın en üstündeki YAML ön bilgisinde bildirilir. Bu, kayıt sistemine (ve güvenlik analizine) skill'inizin çalışmak için neye ihtiyaç duyduğunu belirtir.

### Temel ön bilgi

```yaml
---
name: my-skill
description: Bu skill'in ne yaptığının kısa özeti.
version: 1.0.0
---
```

### Çalışma zamanı meta verileri (`metadata.openclaw`)

Skill'inizin çalışma zamanı gereksinimlerini `metadata.openclaw` altında bildirin (diğer adlar: `metadata.clawdbot`, `metadata.clawdis`).

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

Skill çalışmadan önce mevcut olması gereken ortam değişkenleri için `requires.env` kullanın. `required: false` değerine sahip isteğe bağlı değişkenler dâhil olmak üzere değişken başına meta verilere ihtiyaç duyduğunuzda `envVars` kullanın.

### Tam alan başvurusu

| Alan               | Tür        | Açıklama                                                                                                                                                         |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill'inizin beklediği zorunlu ortam değişkenleri.                                                                                                                |
| `requires.bins`    | `string[]` | Tümünün kurulu olması gereken CLI ikili dosyaları.                                                                                                                |
| `requires.anyBins` | `string[]` | En az birinin mevcut olması gereken CLI ikili dosyaları.                                                                                                         |
| `requires.config`  | `string[]` | Skill'inizin okuduğu yapılandırma dosyası yolları.                                                                                                               |
| `primaryEnv`       | `string`   | Skill'inizin ana kimlik bilgisi ortam değişkeni.                                                                                                                  |
| `envVars`          | `array`    | `name`, isteğe bağlı `required` ve isteğe bağlı `description` içeren ortam değişkeni bildirimleri. İsteğe bağlı ortam değişkenleri için `required: false` ayarlayın. |
| `always`           | `boolean`  | `true` ise skill her zaman etkindir (açık bir kurulum gerekmez).                                                                                                  |
| `skillKey`         | `string`   | Skill'in çağırma anahtarını geçersiz kılar.                                                                                                                       |
| `emoji`            | `string`   | Skill için görüntülenecek emoji.                                                                                                                                 |
| `homepage`         | `string`   | Skill'in ana sayfasının veya belgelerinin URL'si.                                                                                                                |
| `os`               | `string[]` | İşletim sistemi kısıtlamaları (ör. `["macos"]`, `["linux"]`).                                                                                                    |
| `install`          | `array`    | Bağımlılıklar için kurulum belirtimleri (aşağıya bakın).                                                                                                         |
| `nix`              | `object`   | Nix plugin belirtimi (README'ye bakın).                                                                                                                          |
| `config`           | `object`   | Clawdbot yapılandırma belirtimi (README'ye bakın).                                                                                                               |

### Kurulum belirtimleri

Skill'inizin bağımlılıkların kurulmasına ihtiyacı varsa bunları `install` dizisinde bildirin:

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

İsteğe bağlı ortam değişkenlerini `metadata.openclaw.envVars` altında bildirin ve `required: false` olarak ayarlayın. İsteğe bağlı girdileri `requires.env` alanına eklemeyin; çünkü `requires.env`, skill'in bunlar olmadan çalışamayacağı anlamına gelir.

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
        description: Kullanıcı belirtmediğinde kullanılacak isteğe bağlı varsayılan proje kimliği.
```

### Bunun önemi

ClawHub'ın güvenlik analizi, skill'inizin bildirdikleriyle gerçekte yaptıklarının eşleşip eşleşmediğini denetler. Kodunuz `TODOIST_API_KEY` öğesine başvuruyor ancak ön bilginiz bunu `requires.env`, `primaryEnv` veya `envVars` altında bildirmiyorsa analiz bir meta veri uyumsuzluğunu işaretler. Bildirimleri doğru tutmak, skill'inizin incelemeden geçmesine yardımcı olur ve kullanıcıların ne kurduklarını anlamalarını sağlar.

### Örnek: eksiksiz ön bilgi

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

Yayımlama işlemi yalnızca “metin tabanlı” dosyaları kabul eder.

- Uzantı izin listesi `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) içindedir.
- Betik dosyaları yüklemeden sonra yine taranır; PowerShell `.ps1`, `.psm1` ve `.psd1` dosyaları metin olarak kabul edilir.
- `text/` ile başlayan içerik türleri ve küçük bir izin listesi (JSON/YAML/TOML/JS/TS/Markdown/SVG) metin olarak değerlendirilir.

Sınırlar (sunucu tarafında):

- Toplam paket boyutu: 50 MB.
- Gömme metni, `SKILL.md` ile yaklaşık 40 adede kadar `.md` olmayan dosyayı içerir (mümkün olduğunca uygulanan sınır).

## Kısa adlar

- Varsayılan olarak klasör adından türetilir.
- Paket kapsamları ClawHub yayımcı kullanıcı adıyla tam olarak eşleşmelidir. Yayımcı kullanıcı adları küçük harf, rakam, kısa çizgi, nokta ve alt çizgi kullanabilir; küçük harf veya rakamla başlayıp bitmelidir.
- Paket kısa adları küçük harfli ve npm uyumlu olmalıdır; örneğin `@example.tools/demo-plugin` veya `demo-plugin`.

## Sürümleme + etiketler

- Her yayımlama yeni bir sürüm (semver) oluşturur.
- Etiketler bir sürüme işaret eden dizelerdir; yaygın olarak `latest` kullanılır.

## Lisans

- ClawHub'da yayımlanan tüm skill'ler `MIT-0` kapsamında lisanslanır.
- Herkes yayımlanan skill'leri ticari kullanım dâhil olmak üzere kullanabilir, değiştirebilir ve yeniden dağıtabilir.
- Atıf gerekli değildir.
- `SKILL.md` dosyasına çelişkili lisans koşulları eklemeyin; ClawHub, skill başına lisans geçersiz kılmalarını desteklemez.

## Ücretli skill'ler

- ClawHub ücretli skill'leri, skill başına fiyatlandırmayı, ödeme duvarlarını veya gelir paylaşımını desteklemez.
- `SKILL.md` dosyasına fiyatlandırma meta verileri eklemeyin; bunlar skill biçiminin parçası değildir ve yayımlanmış bir skill'i ücretli hâle getirmez.
- Skill'iniz ücretli bir üçüncü taraf hizmetiyle bütünleşiyorsa haricî maliyeti ve gerekli hesabı skill talimatlarında ve ortam bildirimlerinde açıkça belgeleyin (zorunlu değişkenler için `requires.env` veya isteğe bağlı değişkenler için `required: false` değerine sahip `envVars`).

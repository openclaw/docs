---
read_when:
    - Çalışma alanı dosyasındaki bir uç değeri terminalden okumak veya yazmak istiyorsunuz
    - Çalışma alanı durumuna karşı betik yazıyor ve türden bağımsız, kararlı bir adresleme düzeni istiyorsunuz
    - Bir `oc://` yolunda hata ayıklıyorsunuz (sözdizimini doğrulayın, neye çözümlendiğini görün)
summary: 'CLI başvurusu: `openclaw path` (`oc://` adresleme şeması aracılığıyla çalışma alanı dosyalarını inceleyin ve düzenleyin)'
title: Yol
x-i18n:
    generated_at: "2026-06-28T00:23:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Plugin tarafından sağlanan, `oc://` adresleme altyapısına yönelik kabuk erişimi: adreslenebilir çalışma alanı dosyalarını (markdown, jsonc, jsonl, yaml/yml/lobster) incelemek ve düzenlemek için türe göre yönlendirilen tek bir yol şeması. Kendi barındıranlar, Plugin yazarları ve düzenleyici uzantıları, dosya türüne özel ayrıştırıcıları elle yazmadan dar bir konumu okumak, bulmak veya güncellemek için bunu kullanır.

CLI, altyapının herkese açık fiillerini yansıtır:

- `resolve` somuttur ve tek eşleşmelidir.
- `find`, joker karakterler, birleşimler, öngörüler ve konumsal genişletme için çoklu eşleşme fiilidir.
- `set` yalnızca somut yolları veya ekleme işaretleyicilerini kabul eder; joker desenler yazmadan önce reddedilir.

`path`, paketle birlikte gelen isteğe bağlı `oc-path` Plugin tarafından sağlanır. İlk kullanımdan önce etkinleştirin:

```bash
openclaw plugins enable oc-path
```

## Neden kullanılır

OpenClaw durumu, insanlar tarafından düzenlenen markdown, yorumlu JSONC yapılandırması, yalnızca eklemeli JSONL günlükleri ve YAML iş akışı/spesifikasyon dosyalarına yayılmıştır. Kabuk betikleri, kancalar ve ajanlar çoğu zaman bu dosyalardan tek bir küçük değere ihtiyaç duyar: bir frontmatter anahtarı, bir Plugin ayarı, bir günlük kaydı alanı, bir YAML adımı veya adlandırılmış bir bölüm altındaki madde imi.

`openclaw path`, bu çağıranlara her dosya türü için tek seferlik grep, regex veya ayrıştırıcı yerine kararlı bir adres verir. Aynı `oc://` yolu terminalden doğrulanabilir, çözümlenebilir, aranabilir, deneme çalıştırması yapılabilir ve yazılabilir; bu da dar otomasyonu incelemeyi kolaylaştırır ve yeniden yürütmeyi daha güvenli hale getirir. Dosyanın geri kalan yorumlarını, satır sonlarını ve çevreleyen biçimlendirmesini korurken tek bir yaprağı güncellemek istediğinizde özellikle kullanışlıdır.

İstediğiniz şeyin mantıksal bir adresi varsa, ancak fiziksel dosya şekli değişiyorsa bunu kullanın:

- Bir kanca, değeri geri yazarken yorumları kaybetmeden yorumlu JSONC içinden tek bir ayarı okumak ister.
- Bir bakım betiği, tüm günlüğü özel bir ayrıştırıcıya yüklemeden JSONL günlüğündeki eşleşen her olay alanını bulmak ister.
- Bir düzenleyici uzantısı, slug ile bir markdown bölümüne veya madde imine atlamak, ardından çözümlendiği tam satırı işlemek ister.
- Bir ajan, incelemede değişen baytlar görünür olacak şekilde küçük bir çalışma alanı düzenlemesini uygulamadan önce deneme çalıştırması yapmak ister.

Sıradan tüm dosya düzenlemeleri, zengin yapılandırma geçişleri veya belleğe özgü yazmalar için muhtemelen `openclaw path` gerekli değildir. Bunlar sahip komutunu veya Plugin'i kullanmalıdır. `path`, yinelenebilir bir terminal komutunun başka bir özel ayrıştırıcıdan daha açık olduğu küçük, adreslenebilir dosya işlemleri içindir.

## Nasıl kullanılır

İnsan tarafından düzenlenen bir yapılandırma dosyasından tek bir değer okuyun:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Diske dokunmadan bir yazmayı önizleyin:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Yalnızca eklemeli bir JSONL günlüğünde eşleşen kayıtları bulun:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Markdown içindeki bir talimatı satır numarası yerine bölüm ve öğeye göre adresleyin:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Betik okumadan veya yazmadan önce CI'da ya da bir ön kontrol betiğinde bir yolu doğrulayın:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Bu komutlar kabuk betiklerine kopyalanabilir olacak şekilde tasarlanmıştır. Çağıranın yapılandırılmış çıktıya ihtiyacı olduğunda `--json`, bir kişi sonucu incelerken `--human` kullanın.

## Nasıl çalışır

`openclaw path` dört şey yapar:

1. `oc://` adresini yuvalara ayrıştırır: dosya, bölüm, öğe, alan ve isteğe bağlı oturum.
2. Hedef uzantıdan dosya türü bağdaştırıcısını seçer (`.md`, `.jsonc`, `.jsonl`, `.yaml`, `.yml`, `.lobster` ve ilişkili takma adlar).
3. Yuvaları o dosya türünün AST'sine göre çözümler: markdown başlıkları/öğeleri, JSONC nesne anahtarları/dizi indeksleri, JSONL satır kayıtları veya YAML eşleme/dizi düğümleri.
4. `set` için, aynı bağdaştırıcı üzerinden düzenlenmiş baytları üretir; böylece dosyanın dokunulmayan bölümleri, türün desteklediği yerlerde yorumlarını, satır sonlarını ve yakındaki biçimlendirmeyi korur.

`resolve` ve `set` tek bir somut hedef gerektirir. `find` keşif fiilidir: joker karakterleri, birleşimleri, öngörüleri ve sıra belirteçlerini, yazmak için birini seçmeden önce inceleyebileceğiniz somut eşleşmelere genişletir.

## Alt komutlar

| Alt komut              | Amaç                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Yoldaki somut eşleşmeyi yazdırır (veya "bulunamadı").                       |
| `find <pattern>`        | Joker / birleşim / öngörü yoluna ait eşleşmeleri listeler.                   |
| `set <oc-path> <value>` | Somut bir yolda bir yaprak veya ekleme hedefi yazar. `--dry-run` destekler.   |
| `validate <oc-path>`    | Yalnızca ayrıştırır; yapısal dökümü yazdırır (dosya / bölüm / öğe / alan).      |
| `emit <file>`           | Bir dosyayı `parseXxx` + `emitXxx` üzerinden tur attırır (bayt sadakati tanılaması). |

## Genel bayraklar

| Bayrak            | Amaç                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Dosya yuvasını bu dizine göre çözümler (varsayılan: `process.cwd()`). |
| `--file <path>` | Dosya yuvasının çözümlenmiş yolunu geçersiz kılar (mutlak erişim).                |
| `--json`        | JSON çıktısını zorlar (stdout bir TTY olmadığında varsayılan).                    |
| `--human`       | İnsan çıktısını zorlar (stdout bir TTY olduğunda varsayılan).                       |
| `--dry-run`     | (yalnızca `set` üzerinde) yazmadan yazılacak baytları yazdırır.   |
| `--diff`        | (`set --dry-run` ile) tam baytlar yerine birleştirilmiş diff yazdırır.   |

## `oc://` sözdizimi

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Yuva kuralları: `field`, `item` gerektirir; `item` ise `section` gerektirir. Dört yuvanın tamamında:

- **Tırnaklı segmentler** — `"a/b.c"`, `/` ve `.` ayırıcılarından etkilenmez.
  İçerik bayt-literalidir; `"` ve `\` tırnakların içinde kullanılamaz.
  Dosya yuvası da tırnak farkındadır: `oc://"skills/email-drafter"/Tools/$last`
  `skills/email-drafter` değerini tek bir dosya yolu olarak ele alır.
- **Öngörüler** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Sayısal işlemler, iki tarafın da sonlu sayılara dönüştürülebilmesini gerektirir.
- **Birleşimler** — `{a,b,c}` alternatiflerden herhangi biriyle eşleşir.
- **Joker karakterler** — `*` (tek alt segment) ve `**` (sıfır veya daha fazla,
  özyinelemeli). `find` bunları kabul eder; `resolve` ve `set` belirsiz oldukları için reddeder.
- **Konumsal** — `$first` / `$last`, ilk / son indekse veya
  bildirilmiş anahtara çözümlenir.
- **Sıra belirteci** — Belge sırasına göre N'inci eşleşme için `#N`.
- **Ekleme işaretleyicileri** — Anahtarlı / indeksli ekleme için `+`, `+key`, `+nnn`
  (`set` ile kullanın).
- **Oturum kapsamı** — `?session=cron-daily` vb. Yuva iç içeliğinden bağımsızdır. Oturum değerleri hamdır, yüzde çözümlemesi yapılmaz; denetim karakterleri veya ayrılmış sorgu ayırıcıları (`?`, `&`, `%`) içeremez.

Tırnaklı, öngörü veya birleşim segmentleri dışındaki ayrılmış karakterler (`?`, `&`, `%`) reddedilir. Denetim karakterleri (U+0000-U+001F, U+007F), `session` sorgu değeri dahil her yerde reddedilir.

Kanonik yollar için `formatOcPath(parseOcPath(path)) === path` garanti edilir. Kanonik olmayan sorgu parametreleri, ilk boş olmayan `session=` değeri dışında yok sayılır.

## Dosya türüne göre adresleme

| Tür              | Adresleme modeli                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | Slug'a göre H2 bölümleri, slug veya `#N` ile madde imleri, `[frontmatter]` üzerinden frontmatter.                 |
| JSONC/JSON        | Nesne anahtarları ve dizi indeksleri; noktalar, tırnaklı olmadıkça iç içe alt segmentleri böler.                        |
| JSONL             | Üst düzey satır adresleri (`L1`, `L2`, `$first`, `$last`), ardından satır içinde JSONC tarzı iniş. |
| YAML/YML/.lobster | Eşleme anahtarları ve dizi indeksleri; yorumlar ve akış stili YAML belge API'si tarafından işlenir.        |

`resolve`, 1 tabanlı satır numarasıyla yapılandırılmış bir eşleşme döndürür: `root`, `node`, `leaf` veya `insertion-point`. Yaprak değerler metin ve bir `leafType` olarak sunulur; böylece Plugin yazarları, dosya türüne özel AST şekline bağlı kalmadan önizlemeler işleyebilir.

## Mutasyon sözleşmesi

`set` tek bir somut hedef yazar:

- Markdown frontmatter değerleri ve `- key: value` öğe alanları dize yapraklarıdır.
  Markdown eklemeleri bölümler, frontmatter anahtarları veya bölüm öğeleri ekler ve değişen dosya için kanonik bir markdown şekli üretir.
- JSONC yaprak yazmaları dize değerini mevcut yaprak türüne dönüştürür
  (`string`, sonlu `number`, `true`/`false` veya `null`). JSONC/JSON/JSONL yaprak değişimi `<value>` değerini JSON olarak ayrıştırmalı ve bir dize SecretRef kısayolunu nesneyle değiştirmek gibi şekil değiştirebilmeliyse `--value-json` kullanın. JSONC nesne ve dizi eklemeleri `<value>` değerini JSON olarak ayrıştırır ve sıradan yaprak yazmaları için `jsonc-parser` düzenleme yolunu kullanarak yorumları ve yakındaki biçimlendirmeyi korur.
- JSONL yaprak yazmaları satır içinde JSONC gibi dönüştürür. Tam satır değişimi ve ekleme, `<value>` değerini JSON olarak ayrıştırır. Üretilen JSONL, dosyanın baskın LF/CRLF satır sonu kuralını korur.
- YAML yaprak yazmaları mevcut skaler türe dönüştürür (`string`, sonlu
  `number`, `true`/`false` veya `null`). YAML eklemeleri, eşleme/dizi güncellemeleri için paketle birlikte gelen `yaml` paketinin belge API'sini kullanır. Ayrıştırıcı hataları olan bozuk YAML belgeleri, mutasyondan önce `parse-error` ile reddedilir.

Tam baytlar önemli olduğunda kullanıcıya görünür yazmalardan önce `--dry-run` kullanın. Altyapı, ayrıştırma/üretme tur atmalarında bayt olarak özdeş çıktıyı korur; ancak bir mutasyon, türe bağlı olarak düzenlenen bölgeyi veya dosyayı kanonik hale getirebilir.
Önizlemeyi tam işlenmiş dosya yerine odaklı bir önce/sonra yaması olarak istediğinizde `--diff` ekleyin.

## Örnekler

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Daha fazla dilbilgisi örneği:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Dosya türüne göre tarifler

Aynı beş fiil tüm türlerde çalışır; adresleme şeması dosya uzantısına göre yönlendirme yapar. Aşağıdaki örnekler PR açıklamasındaki fixture'ları kullanır.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

`[frontmatter]` koşulu YAML frontmatter bloğunu adresler; `tools`, `## Tools` başlığıyla slug üzerinden eşleşir ve öğe yaprakları, kaynak alt çizgi kullansa bile (`send_email` → `send-email`) slug biçimini korur.

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC düzenlemeleri `jsonc-parser` üzerinden geçer; bu yüzden yorumlar ve boşluklar bir `set` sonrasında korunur. Kaydetmeden önce baytları incelemek için önce `--dry-run` ile çalıştırın.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

Her satır bir kayıttır. Satır numarasını bilmiyorsanız koşulla (`[event=action]`), biliyorsanız kurallı `LN` segmentiyle adresleyin.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML, elle yazılmış bir ayrıştırıcı yerine `yaml` paketinin `Document` API'sini kullanır; bu nedenle sıradan ayrıştırma/yayımlama gidiş dönüşleri yorumları ve yazım şeklini korurken çözümlenen yollar JSONC ile aynı harita anahtarı / dizi indeksi modelini kullanır. Aynı adaptör `.yaml`, `.yml` ve `.lobster` dosyalarını işler.

## Alt komut başvurusu

### `resolve <oc-path>`

Tek bir yaprak veya düğüm okur. Joker karakterler reddedilir; bunlar için `find` kullanın. Eşleşmede `0`, temiz bir kaçırmada `1`, ayrıştırma hatasında veya reddedilen desende `2` ile çıkar.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Bir joker karakter / koşul / birleşim deseni için her eşleşmeyi listeler. En az bir eşleşmede `0`, sıfır eşleşmede `1` ile çıkar. Dosya yuvası joker karakterleri `OC_PATH_FILE_WILDCARD_UNSUPPORTED` ile reddedilir; somut bir dosya iletin (çok dosyalı glob desteği sonraki bir özelliktir).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Bir yaprak yazar. Dosyaya dokunmadan yazılacak baytları önizlemek için `--dry-run` ile birlikte kullanın. Birleştirilmiş diff önizlemesi için `--diff` ekleyin. Başarılı yazmada `0`, alt katman reddederse (örneğin bir sentinel korumasına takılırsa) `1`, ayrıştırma hatalarında `2` ile çıkar.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key` ekleme işaretçisi, adlandırılmış alt öğe zaten yoksa onu oluşturur; `+nnn` ve yalın `+` sırasıyla indeksli ekleme ve sona ekleme için çalışır.

### `validate <oc-path>`

Yalnızca ayrıştırma denetimi. Dosya sistemi erişimi yoktur. Değişkenleri yerleştirmeden önce bir şablon yolunun iyi biçimlendirilmiş olduğunu doğrulamak istediğinizde veya hata ayıklama için yapısal dökümü istediğinizde kullanışlıdır:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Geçerliyse `0`, geçersizse (yapılandırılmış bir `code` ve `message` ile) `1`, argüman hatalarında `2` ile çıkar.

### `emit <file>`

Bir dosyayı türe özel ayrıştırıcı ve yayımlayıcıdan geçirerek gidiş dönüş yaptırır. Sağlam bir dosyada çıktı, girdiye bayt düzeyinde özdeş olmalıdır; farklılık bir ayrıştırıcı hatasına veya sentinel tetiklenmesine işaret eder. Gerçek dünya girdilerinde alt katman davranışını hata ayıklamak için kullanışlıdır.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Çıkış kodları

| Kod | Anlam                                                                                  |
| --- | -------------------------------------------------------------------------------------- |
| `0` | Başarı. (`resolve` / `find`: en az bir eşleşme. `set`: yazma başarılı.)                |
| `1` | Eşleşme yok veya `set` alt katman tarafından reddedildi (sistem düzeyi hata yok).      |
| `2` | Argüman veya ayrıştırma hatası.                                                        |

## Çıktı modu

`openclaw path` TTY farkındadır: terminalde insan tarafından okunabilir çıktı, stdout pipe edilir veya yönlendirilirse JSON üretir. `--json` ve `--human` otomatik algılamayı geçersiz kılar.

## Notlar

- `set`, baytları alt katmanın yayım yolu üzerinden yazar; bu yol redaction-sentinel korumasını otomatik olarak uygular. `__OPENCLAW_REDACTED__` taşıyan bir yaprak (birebir veya alt dize olarak) yazma sırasında reddedilir.
- JSONC ayrıştırma ve yaprak düzenlemeleri, Plugin'e yerel `jsonc-parser` bağımlılığını kullanır; bu yüzden sıradan yaprak yazmaları, elle yazılmış bir ayrıştırıcı/yeniden işleme yolundan geçmek yerine yorumları ve biçimlendirmeyi korur.
- `path`, LKG hakkında bilgi sahibi değildir. Dosya LKG ile izleniyorsa, sonraki observe çağrısı promote / recover yapılıp yapılmayacağına karar verir. LKG promote/recover yaşam döngüsü üzerinden atomik çoklu set için `set --batch`, LKG-recovery alt katmanıyla birlikte planlanmaktadır.

## İlgili

- [CLI başvurusu](/tr/cli)

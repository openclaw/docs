---
read_when:
    - Terminalden bir çalışma alanı dosyası içindeki bir uç öğeyi okumak veya yazmak istiyorsunuz
    - Çalışma alanı durumuna karşı betik yazıyorsunuz ve kararlı, türden bağımsız bir adresleme şeması istiyorsunuz
    - Bir `oc://` yolunda hata ayıklıyorsunuz (sözdizimini doğrulayın, neye çözümlendiğine bakın)
summary: '`openclaw path` için CLI referansı (çalışma alanı dosyalarını `oc://` adresleme şeması aracılığıyla inceleyin ve düzenleyin)'
title: Yol
x-i18n:
    generated_at: "2026-05-10T19:30:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Plugin tarafından sağlanan, `oc://` adresleme alt katmanına shell erişimi: adreslenebilir çalışma alanı dosyalarını (markdown, jsonc, jsonl) incelemek ve düzenlemek için türe göre yönlendirilen tek bir yol şeması. Kendi barındırmasını yapanlar, Plugin yazarları ve düzenleyici uzantıları, dosya başına ayrıştırıcıları elle yazmadan dar bir konumu okumak, bulmak veya güncellemek için bunu kullanır.

CLI, alt katmanın herkese açık fiillerini yansıtır:

- `resolve` somuttur ve tek eşleşmelidir.
- `find`, joker karakterler, birleşimler, yüklemler ve konumsal genişletme için çok eşleşmeli fiildir.
- `set` yalnızca somut yolları veya ekleme işaretlerini kabul eder; joker karakter kalıpları yazmadan önce reddedilir.

`path`, birlikte gelen isteğe bağlı `oc-path` Plugin'i tarafından sağlanır. İlk kullanımdan önce etkinleştirin:

```bash
openclaw plugins enable oc-path
```

## Neden kullanılır?

OpenClaw durumu, insanlar tarafından düzenlenen markdown, yorumlu JSONC yapılandırması ve yalnızca sona eklenen JSONL günlüklerine yayılmıştır. Shell betikleri, kancalar ve agent'lar bu dosyalardan çoğu zaman tek bir küçük değere ihtiyaç duyar: bir frontmatter anahtarı, bir Plugin ayarı, bir günlük kaydı alanı veya adlandırılmış bir bölüm altındaki madde imi.

`openclaw path`, bu çağıranlara her dosya türü için tek seferlik grep, regex veya ayrıştırıcı yerine kararlı bir adres verir. Aynı `oc://` yolu terminalden doğrulanabilir, çözümlenebilir, aranabilir, kuru çalıştırılabilir ve yazılabilir; bu da dar otomasyonun incelenmesini kolaylaştırır ve yeniden oynatılmasını daha güvenli hale getirir. Dosyanın geri kalan yorumlarını, satır sonlarını ve çevresindeki biçimlendirmeyi koruyarak tek bir yaprağı güncellemek istediğinizde özellikle kullanışlıdır.

İstediğiniz şeyin mantıksal bir adresi varsa, ancak fiziksel dosya biçimi değişiyorsa bunu kullanın:

- Bir kanca, değeri geri yazarken yorumları kaybetmeden yorumlu JSONC'den tek bir ayarı okumak ister.
- Bir bakım betiği, tüm günlüğü özel bir ayrıştırıcıya yüklemeden JSONL günlüğündeki eşleşen her olay alanını bulmak ister.
- Bir düzenleyici uzantısı, slug ile bir markdown bölümüne veya madde imine atlamak ve ardından çözümlendiği tam satırı işlemek ister.
- Bir agent, uygulamadan önce küçük bir çalışma alanı düzenlemesini kuru çalıştırmak ve değişen baytları incelemede görünür kılmak ister.

Sıradan tüm dosya düzenlemeleri, zengin yapılandırma geçişleri veya belleğe özel yazmalar için büyük olasılıkla `openclaw path` gerekmez. Bunlar owner komutunu veya Plugin'i kullanmalıdır. `path`, tekrar edilebilir bir terminal komutunun başka bir özel ayrıştırıcıdan daha anlaşılır olduğu küçük, adreslenebilir dosya işlemleri içindir.

## Nasıl kullanılır?

İnsan tarafından düzenlenen bir yapılandırma dosyasından tek bir değer okuyun:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Diske dokunmadan bir yazmayı önizleyin:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Yalnızca sona eklenen bir JSONL günlüğünde eşleşen kayıtları bulun:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Markdown'daki bir talimatı satır numarası yerine bölüm ve öğe ile adresleyin:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Betik okumadan veya yazmadan önce CI'da ya da bir ön kontrol betiğinde bir yolu doğrulayın:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Bu komutlar shell betiklerine kopyalanabilir olacak şekilde tasarlanmıştır. Bir çağıranın yapılandırılmış çıktıya ihtiyacı olduğunda `--json`, bir kişi sonucu incelerken `--human` kullanın.

## Nasıl çalışır?

`openclaw path` dört şey yapar:

1. `oc://` adresini yuvalara ayrıştırır: dosya, bölüm, öğe, alan ve isteğe bağlı oturum.
2. Hedef uzantıdan (`.md`, `.jsonc`, `.jsonl` ve ilgili takma adlar) dosya türü adaptörünü seçer.
3. Yuvaları o dosya türünün AST'sine göre çözümler: markdown başlıkları/öğeleri, JSONC nesne anahtarları/dizi indeksleri veya JSONL satır kayıtları.
4. `set` için, dokunulmayan dosya parçalarının yorumlarını, satır sonlarını ve yakın biçimlendirmesini türün desteklediği yerlerde koruması için aynı adaptör üzerinden düzenlenmiş baytları üretir.

`resolve` ve `set` tek bir somut hedef gerektirir. `find` keşif fiilidir: joker karakterleri, birleşimleri, yüklemleri ve sıraları, yazmak üzere birini seçmeden önce inceleyebileceğiniz somut eşleşmelere genişletir.

## Alt komutlar

| Alt komut              | Amaç                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Yoldaki somut eşleşmeyi yazdırır (veya "bulunamadı").                       |
| `find <pattern>`        | Joker karakter / birleşim / yüklem yolunun eşleşmelerini numaralandırır.                   |
| `set <oc-path> <value>` | Somut bir yolda bir yaprak veya ekleme hedefi yazar. `--dry-run` destekler.   |
| `validate <oc-path>`    | Yalnızca ayrıştırma; yapısal dökümü yazdırır (dosya / bölüm / öğe / alan).      |
| `emit <file>`           | Bir dosyayı `parseXxx` + `emitXxx` üzerinden gidiş dönüşe sokar (bayt sadakati tanılaması). |

## Genel bayraklar

| Bayrak            | Amaç                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Dosya yuvasını bu dizine göre çözümler (varsayılan: `process.cwd()`). |
| `--file <path>` | Dosya yuvasının çözümlenmiş yolunu geçersiz kılar (mutlak erişim).                |
| `--json`        | JSON çıktısını zorlar (stdout bir TTY olmadığında varsayılan).                    |
| `--human`       | İnsan çıktısını zorlar (stdout bir TTY olduğunda varsayılan).                       |
| `--dry-run`     | (yalnızca `set` üzerinde) yazmadan, yazılacak baytları yazdırır.   |

## `oc://` sözdizimi

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Yuva kuralları: `field`, `item` gerektirir ve `item`, `section` gerektirir. Dört yuvanın tamamında:

- **Tırnaklı segmentler** — `"a/b.c"`, `/` ve `.` ayırıcılarından etkilenmez.
  İçerik bayt düzeyinde sabittir; `"` ve `\` tırnakların içinde izinli değildir.
  Dosya yuvası da tırnağa duyarlıdır: `oc://"skills/email-drafter"/Tools/$last`
  `skills/email-drafter` değerini tek bir dosya yolu olarak ele alır.
- **Yüklemler** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Sayısal işlemler, iki tarafın da sonlu sayılara dönüştürülebilmesini gerektirir.
- **Birleşimler** — `{a,b,c}` alternatiflerden herhangi biriyle eşleşir.
- **Joker karakterler** — `*` (tek alt segment) ve `**` (sıfır veya daha fazla,
  özyinelemeli). `find` bunları kabul eder; `resolve` ve `set` belirsiz oldukları için reddeder.
- **Konumsal** — `$last`, son indeks / son bildirilen anahtar olarak çözümlenir.
- **Sıra** — belge sırasına göre N'inci eşleşme için `#N`.
- **Ekleme işaretleri** — anahtarlı / indeksli ekleme için `+`, `+key`, `+nnn`
  (`set` ile kullanın).
- **Oturum kapsamı** — `?session=cron-daily` vb. Yuva iç içeliğinden bağımsızdır.
  Oturum değerleri hamdır, yüzdeyle çözülmez; denetim karakterleri veya ayrılmış sorgu ayırıcıları (`?`, `&`, `%`) içeremez.

Tırnaklı, yüklem veya birleşim segmentlerinin dışındaki ayrılmış karakterler (`?`, `&`, `%`) reddedilir. Denetim karakterleri (U+0000-U+001F, U+007F), `session` sorgu değeri dahil her yerde reddedilir.

`formatOcPath(parseOcPath(path)) === path`, kanonik yollar için garantilidir. Kanonik olmayan sorgu parametreleri, ilk boş olmayan `session=` değeri dışında yok sayılır.

## Dosya türüne göre adresleme

| Tür       | Adresleme modeli                                                                          |
| ---------- | ----------------------------------------------------------------------------------------- |
| Markdown   | Slug ile H2 bölümleri, slug veya `#N` ile madde imleri, `[frontmatter]` üzerinden frontmatter.       |
| JSONC/JSON | Nesne anahtarları ve dizi indeksleri; noktalar, tırnaklı olmadıkça iç içe alt segmentleri böler.              |
| JSONL      | Üst düzey satır adresleri (`L1`, `L2`, `$last`), ardından satır içinde JSONC tarzı iniş. |

`resolve`, 1 tabanlı satır numarasıyla birlikte yapılandırılmış bir eşleşme döndürür: `root`, `node`, `leaf` veya
`insertion-point`. Yaprak değerleri metin ve bir `leafType` olarak sunulur; böylece Plugin yazarları tür başına AST biçimine bağlı kalmadan önizlemeler işleyebilir.

## Mutasyon sözleşmesi

`set` tek bir somut hedef yazar:

- Markdown frontmatter değerleri ve `- key: value` öğe alanları string yapraklardır.
  Markdown eklemeleri bölümler, frontmatter anahtarları veya bölüm öğeleri ekler ve değişen dosya için kanonik bir markdown biçimi işler.
- JSONC yaprak yazmaları string değeri mevcut yaprak türüne zorlar
  (`string`, sonlu `number`, `true`/`false` veya `null`). JSONC nesne ve dizi eklemeleri `<value>` değerini JSON olarak ayrıştırır ve sıradan yaprak yazmaları için `jsonc-parser` düzenleme yolunu kullanarak yorumları ve yakın biçimlendirmeyi korur.
- JSONL yaprak yazmaları satır içinde JSONC gibi zorlar. Tüm satır değiştirme ve sona ekleme, `<value>` değerini JSON olarak ayrıştırır. İşlenen JSONL, dosyanın baskın LF/CRLF satır sonu kuralını korur.

Tam baytlar önemli olduğunda kullanıcıya görünür yazmalardan önce `--dry-run` kullanın. Alt katman, ayrıştırma/üretme gidiş dönüşleri için bayt düzeyinde özdeş çıktıyı korur, ancak bir mutasyon, türe bağlı olarak düzenlenen bölgeyi veya dosyayı kanonikleştirebilir.

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

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Daha fazla gramer örneği:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

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

Aynı beş fiil türler genelinde çalışır; adresleme şeması dosya uzantısına göre yönlendirir. Aşağıdaki örnekler PR açıklamasındaki fixture'ları kullanır.

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

`[frontmatter]` yüklemi YAML frontmatter bloğunu adresler; `tools`, slug üzerinden `## Tools` başlığıyla eşleşir ve öğe yaprakları, kaynak alt çizgi kullansa bile slug biçimlerini korur (`send_email` → `send-email`).

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

JSONC düzenlemeleri `jsonc-parser` üzerinden geçer, bu nedenle yorumlar ve boşluklar bir
`set` sonrasında korunur. İşlemeden önce baytları incelemek için önce `--dry-run` ile çalıştırın.

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

Her satır bir kayıttır. Satır numarasını bilmediğinizde koşulla (`[event=action]`),
bildiğinizde ise kurallı `LN` segmentiyle adresleyin.

## Alt komut referansı

### `resolve <oc-path>`

Tek bir yaprak veya düğüm okur. Joker karakterler reddedilir; bunlar için `find`
kullanın. Eşleşmede `0`, temiz bir kaçırmada `1`, ayrıştırma hatasında veya
reddedilen desende `2` çıkış koduyla çıkar.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Bir joker karakter / koşul / birleşim deseninin her eşleşmesini listeler. En az
bir eşleşmede `0`, sıfır eşleşmede `1` çıkış koduyla çıkar. Dosya yuvası jokerleri
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` ile reddedilir; somut bir dosya geçirin
(çok dosyalı globlama sonraki bir özelliktir).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Bir yaprak yazar. Dosyaya dokunmadan yazılacak baytları önizlemek için
`--dry-run` ile birlikte kullanın. Başarılı yazmada `0`, substrat reddederse
(örneğin bir sentinel koruması tetiklenirse) `1`, ayrıştırma hatalarında `2`
çıkış koduyla çıkar.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key` ekleme işaretçisi, henüz yoksa adlandırılmış alt öğeyi oluşturur;
`+nnn` ve yalın `+` sırasıyla dizinli ekleme ve sona ekleme için çalışır.

### `validate <oc-path>`

Yalnızca ayrıştırma denetimi. Dosya sistemi erişimi yoktur. Değişkenleri yerine
koymadan önce bir şablon yolunun iyi biçimlendirilmiş olduğunu doğrulamak
istediğinizde veya hata ayıklama için yapısal ayrımı görmek istediğinizde
kullanışlıdır:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Geçerliyse `0`, geçersizse (yapılandırılmış bir `code` ve `message` ile) `1`,
argüman hatalarında `2` çıkış koduyla çıkar.

### `emit <file>`

Bir dosyayı türüne özgü ayrıştırıcı ve yayıcıdan geçirerek gidiş-dönüş yapar.
Sağlam bir dosyada çıktı girdiye bayt düzeyinde özdeş olmalıdır; farklılık bir
ayrıştırıcı hatasına veya sentinel tetiklenmesine işaret eder. Gerçek dünya
girdilerinde substrat davranışını hata ayıklamak için kullanışlıdır.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Çıkış kodları

| Kod | Anlam                                                                      |
| --- | -------------------------------------------------------------------------- |
| `0` | Başarı. (`resolve` / `find`: en az bir eşleşme. `set`: yazma başarılı.)    |
| `1` | Eşleşme yok veya `set` substrat tarafından reddedildi (sistem düzeyi hata yok). |
| `2` | Argüman veya ayrıştırma hatası.                                            |

## Çıktı modu

`openclaw path` TTY farkındadır: terminalde insan tarafından okunabilir çıktı,
stdout borulandığında veya yönlendirildiğinde JSON üretir. `--json` ve `--human`
otomatik algılamayı geçersiz kılar.

## Notlar

- `set`, baytları substratın yayma yolu üzerinden yazar; bu yol
  redaksiyon sentinel korumasını otomatik olarak uygular. `__OPENCLAW_REDACTED__`
  içeren bir yaprak (birebir veya alt dize olarak) yazma sırasında reddedilir.
- JSONC ayrıştırma ve yaprak düzenlemeleri Plugin yerel `jsonc-parser`
  bağımlılığını kullanır; bu nedenle sıradan yaprak yazmaları, elde yazılmış
  bir ayrıştırıcı/yeniden oluşturma yolundan geçmek yerine yorumları ve
  biçimlendirmeyi korur.
- `path`, LKG hakkında bilgi sahibi değildir. Dosya LKG tarafından izleniyorsa
  bir sonraki gözlem çağrısı yükseltme / kurtarma yapılıp yapılmayacağına karar
  verir. LKG yükseltme/kurtarma yaşam döngüsü üzerinden atomik çoklu `set` için
  `set --batch`, LKG kurtarma substratıyla birlikte planlanmaktadır.

## İlgili

- [CLI referansı](/tr/cli)

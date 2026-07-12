---
read_when:
    - Terminalden bir çalışma alanı dosyasındaki bir uç değeri okumak veya yazmak istiyorsunuz
    - Çalışma alanı durumuna yönelik betikler yazıyorsunuz ve türden bağımsız, kararlı bir adresleme şeması istiyorsunuz.
    - Bir `oc://` yolunda hata ayıklıyorsunuz (sözdizimini doğrulayın, hangi yola çözümlendiğine bakın)
summary: '`openclaw path` için CLI başvurusu (`oc://` adresleme şeması aracılığıyla çalışma alanı dosyalarını inceleyin ve düzenleyin)'
title: Yol
x-i18n:
    generated_at: "2026-07-12T12:11:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

`oc://` adresleme şemasına kabuk erişimi: adreslenebilir çalışma alanı dosyalarını (markdown, jsonc, jsonl, yaml/yml/lobster) incelemek ve düzenlemek için dosya türüne göre yönlendirilen tek bir yol söz dizimi. Kendi barındırmasını yapanlar, plugin yazarları ve düzenleyici uzantıları; her dosya için ayrı bir ayrıştırıcıyı elle yazmadan belirli bir konumu okumak, bulmak veya güncellemek için bunu kullanır.

`path`, paketle birlikte gelen isteğe bağlı `oc-path` plugin'i tarafından sağlanır. İlk kullanımdan önce etkinleştirin:

```bash
openclaw plugins enable oc-path
```

CLI fiilleri adresleme modelini yansıtır:

- `resolve` somuttur ve tek bir eşleşme döndürür.
- `find`, joker karakterler, birleşimler, koşullar ve konumsal genişletme için çoklu eşleşme fiilidir.
- `set` yalnızca somut yolları veya ekleme işaretlerini kabul eder; joker karakter kalıpları yazmadan önce reddedilir.
- `validate`, dosya sistemine erişmeden bir yolu ayrıştırır.
- `emit`, bir dosyayı ayrıştırma + üretme işleminden geçirerek gidiş-dönüş yapar (bayt doğruluğu tanılaması).

## Neden kullanılmalı?

OpenClaw durumu; insanlar tarafından düzenlenen markdown dosyalarına, açıklama satırları içeren JSONC yapılandırmasına, yalnızca sonuna ekleme yapılan JSONL günlüklerine ve YAML iş akışı/belirtim dosyalarına dağılmıştır. Betikler, kancalar ve ajanlar genellikle bu dosyalardan tek bir küçük değere ihtiyaç duyar: bir frontmatter anahtarı, plugin ayarı, günlük kaydı alanı, YAML adımı veya adlandırılmış bir bölümün altındaki madde işaretli bir öğe.

`openclaw path`, bu çağıranlara her dosya türü için tek kullanımlık bir grep, düzenli ifade veya ayrıştırıcı yerine kararlı bir adres sağlar. Aynı `oc://` yolu terminalden doğrulanabilir, çözümlenebilir, aranabilir, deneme amaçlı çalıştırılabilir ve yazılabilir; böylece dar kapsamlı otomasyon incelenebilir ve yeniden yürütülebilir kalır. Dosyanın geri kalanını korur; bu nedenle tek bir yaprak değeri yazmak açıklamaları, satır sonlarını veya yakındaki biçimlendirmeyi bozmaz.

İstediğiniz şeyin mantıksal bir adresi olduğu ancak dosya biçiminin değiştiği durumlarda kullanın:

- Bir kanca, açıklamalı JSONC dosyasından tek bir ayarı okur ve değeri geri yazarken açıklamaları kaybetmez.
- Bir bakım betiği, JSONL günlüğündeki eşleşen tüm olay alanlarını günlüğün tamamını özel bir ayrıştırıcıya yüklemeden bulur.
- Bir düzenleyici, markdown içindeki bir bölüme veya madde işaretli öğeye satır numarası yerine kısa adla atlar ve ardından çözümlenen tam satırı işler.
- Bir ajan, küçük bir çalışma alanı düzenlemesini uygulamadan önce deneme amaçlı çalıştırır ve değişen baytlar incelemede görünür olur.

Sıradan tam dosya düzenlemeleri, kapsamlı yapılandırma geçişleri veya belleğe özgü yazma işlemleri için `openclaw path` kullanmayın; bunlar sahip komutu veya plugin'i kullanmalıdır. `path`, başka bir özel ayrıştırıcı yazmak yerine tekrarlanabilir bir terminal komutunun daha uygun olduğu küçük ve adreslenebilir dosya işlemleri içindir.

## Nasıl kullanılır?

İnsanlar tarafından düzenlenen bir yapılandırma dosyasından tek bir değer okuyun:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Diske dokunmadan bir yazma işlemini önizleyin:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Yalnızca sonuna ekleme yapılan bir JSONL günlüğündeki eşleşen kayıtları bulun:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Markdown içindeki bir talimatı satır numarası yerine bölüm ve öğeyle adresleyin:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Bir betik okuma veya yazma işlemi yapmadan önce CI'da ya da bir ön kontrol betiğinde yolu doğrulayın:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Bu komutlar kabuk betiklerine kopyalanabilecek şekilde tasarlanmıştır. Çağıran yapılandırılmış çıktıya ihtiyaç duyduğunda `--json`, sonucu bir kişi incelerken `--human` kullanın.

## Nasıl çalışır?

1. `oc://` adresini şu yuvalara ayrıştırır: dosya, bölüm, öğe, alan ve isteğe bağlı oturum sorgusu.
2. Hedef uzantıya göre dosya türü uyarlayıcısını seçer (`.md`, `.jsonc`, `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Yuvaları ilgili dosya türünün yapısına göre çözümler: markdown başlıkları/öğeleri, JSONC nesne anahtarları/dizi indisleri, JSONL satır kayıtları veya YAML eşleme/dizi düğümleri.
4. `set` için, aynı uyarlayıcı üzerinden düzenlenmiş baytları üretir; böylece tür desteklediği ölçüde dosyanın dokunulmayan bölümleri açıklamalarını, satır sonlarını ve yakındaki biçimlendirmeyi korur.

`resolve` ve `set` tek bir somut hedef gerektirir. `find` keşif fiilidir: joker karakterleri, birleşimleri, koşulları ve sıra belirteçlerini, yazmak üzere birini seçmeden önce inceleyebileceğiniz somut eşleşmelere genişletir.

## Alt komutlar

| Alt komut               | Amaç                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Yoldaki somut eşleşmeyi (veya "bulunamadı" ifadesini) yazdırır.                                |
| `find <pattern>`        | Joker karakterli / birleşimli / koşullu bir yolun eşleşmelerini listeler.                     |
| `set <oc-path> <value>` | Somut bir yoldaki yaprağı veya ekleme hedefini yazar. `--dry-run` seçeneğini destekler.         |
| `validate <oc-path>`    | Yalnızca ayrıştırır; yapısal dökümü (dosya / bölüm / öğe / alan) yazdırır.                     |
| `emit <file>`           | Bir dosyayı ayrıştırma + üretme işleminden geçirerek gidiş-dönüş yapar (bayt doğruluğu tanısı). |

## Genel bayraklar

| Bayrak          | Uygulandığı komutlar             | Amaç                                                                                       |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | Dosya yuvasını bu dizine göre çözümler (varsayılan: `process.cwd()`).                       |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | Dosya yuvasının çözümlenen yolunu geçersiz kılar (mutlak erişim).                          |
| `--json`        | tümü                             | JSON çıktısını zorunlu kılar (stdout bir TTY olmadığında varsayılandır).                   |
| `--human`       | tümü                             | İnsan tarafından okunabilir çıktıyı zorunlu kılar (stdout bir TTY olduğunda varsayılandır). |
| `--value-json`  | `set`                            | JSON/JSONC/JSONL yaprak değişimi için `<value>` değerini JSON olarak ayrıştırır.            |
| `--dry-run`     | `set`                            | Yazma işlemini gerçekleştirmeden yazılacak baytları yazdırır.                              |
| `--diff`        | `set` (`--dry-run` gerektirir)   | Tam baytlar yerine birleşik bir fark çıktısı yazdırır.                                     |

`validate` yalnızca `--json` / `--human` seçeneklerini alır; dosya sistemine erişmediği için `--cwd` ve `--file` uygulanmaz.

## `oc://` söz dizimi

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Yuva kuralları: `field`, `item` gerektirir; `item` ise `section` gerektirir. Dört yuvanın tümünde:

- **Tırnaklı parçalar** — `"a/b.c"`, `/` ve `.` ayırıcılarından etkilenmez. İçerik bayt düzeyinde değişmezdir; tırnakların içinde `"` ve `\` kullanılamaz. Dosya yuvası da tırnaklara duyarlıdır: `oc://"skills/email-drafter"/Tools/$last`, `skills/email-drafter` ifadesini tek bir dosya yolu olarak ele alır.
- **Koşullar** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`. Sayısal işleçler, her iki tarafın da sonlu sayılara dönüştürülebilmesini gerektirir.
- **Birleşimler** — `{a,b,c}`, alternatiflerden herhangi biriyle eşleşir.
- **Joker karakterler** — `*` (tek alt parça) ve `**` (sıfır veya daha fazla, özyinelemeli). `find` bunları kabul eder; `resolve` ve `set` belirsiz oldukları için reddeder.
- **Konumsal** — `$first` / `$last`, ilk / son indise veya tanımlı anahtara çözümlenir.
- **Sıra belirteci** — Belge sırasına göre N'inci eşleşme için `#N`.
- **Ekleme işaretleri** — Anahtarlı / indisli ekleme için `+`, `+key`, `+nnn` (`set` ile kullanın).
- **Oturum kapsamı** — `?session=cron-daily` vb. Yuva iç içeliğinden bağımsızdır. Oturum değerleri hamdır, yüzde kodlaması çözülmez; denetim karakterleri veya ayrılmış sorgu ayırıcıları (`?`, `&`, `%`) içeremez.

Tırnaklı, koşullu veya birleşim parçalarının dışındaki ayrılmış karakterler (`?`, `&`, `%`) reddedilir. Denetim karakterleri (U+0000-U+001F, U+007F), `session` sorgu değeri dahil olmak üzere hiçbir yerde kabul edilmez.

Standart yollar için `formatOcPath(parseOcPath(path)) === path` garantilidir. Standart olmayan sorgu parametreleri, boş olmayan ilk `session=` değeri dışında yok sayılır.

Kesin sınırlar: Bir yol en fazla 4096 bayt, en fazla 4 yuva (dosya/bölüm/öğe/alan), yuva başına en fazla 64 noktayla ayrılmış alt parça ve derin JSON yolları için en fazla 256 iç içe gezinme düzeyi içerebilir. Ayrıca, 16 MiB üzerindeki JSONC/JSON dosya girdileri, dosyayı yükleyen herhangi bir fiilde ayrıştırılmak yerine ayrıştırma tanısıyla reddedilir.

## Dosya türüne göre adresleme

| Tür           | Dosya uzantıları             | Adresleme modeli                                                                                                      |
| ------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                        | Kısa ada göre H2 bölümleri, kısa ada veya `#N` değerine göre madde işaretli öğeler, `[frontmatter]` üzerinden frontmatter. |
| JSONC/JSON    | `.jsonc`, `.json`            | Nesne anahtarları ve dizi indisleri; tırnak içine alınmadıkça noktalar iç içe alt parçaları ayırır.                   |
| JSONL         | `.jsonl`, `.ndjson`          | Üst düzey satır adresleri (`L1`, `L2`, `$first`, `$last`), ardından satır içinde JSONC tarzı aşağı doğru gezinme.     |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`  | Eşleme anahtarları ve dizi indisleri; açıklamalar ve akış stili YAML belge API'si tarafından işlenir.                 |

`resolve`, 1 tabanlı satır numarasıyla birlikte yapılandırılmış bir eşleşme döndürür: `root`, `node`, `leaf` veya `insertion-point`. Yaprak değerleri metin ve bir `leafType` olarak sunulur; böylece plugin yazarları dosya türüne özgü AST biçimine bağımlı olmadan önizlemeler oluşturabilir.

## Değişiklik sözleşmesi

`set`, tek bir somut hedef yazar:

- Markdown frontmatter değerleri ve `- key: value` öğe alanları dize yapraklarıdır. Markdown eklemeleri bölümleri, frontmatter anahtarlarını veya bölüm öğelerini sona ekler ve değiştirilen dosya için standart bir markdown biçimi üretir. Bölüm gövdeleri `set` aracılığıyla bir bütün olarak yazılamaz.
- JSONC yaprak yazmaları, dize değerini mevcut yaprak türüne dönüştürür (`string`, sonlu `number`, `true`/`false` veya `null`). JSONC/JSON/JSONL yaprak değişiminin `<value>` değerini JSON olarak ayrıştırması ve örneğin bir dize secret-ref kısaltmasını nesneyle değiştirmek gibi biçim değiştirebilmesi gerektiğinde `--value-json` kullanın. JSONC nesne ve dizi eklemeleri `<value>` değerini JSON olarak ayrıştırır ve sıradan yaprak yazmaları için `jsonc-parser` düzenleme yolunu kullanarak açıklamaları ve yakındaki biçimlendirmeyi korur.
- JSONL yaprak yazmaları, satır içinde JSONC gibi dönüştürme yapar. Tüm satırı değiştirme ve sona ekleme işlemleri `<value>` değerini JSON olarak ayrıştırır. Üretilen JSONL, dosyanın baskın LF/CRLF satır sonu düzenini korur (dosyanın satır sonları genelinde çoğunluk kararı; böylece çoğunlukla CRLF kullanan bir dosya, arada birkaç LF bulunsa bile CRLF olarak kalır).
- YAML yaprak yazmaları mevcut skaler türe dönüştürülür (`string`, sonlu `number`, `true`/`false` veya `null`). YAML eklemeleri, eşleme/dizi güncellemeleri için paketle birlikte gelen `yaml` paketinin belge API'sini kullanır. Ayrıştırıcı hataları içeren bozuk YAML belgeleri, değişiklikten önce `parse-error` ile reddedilir.

Tam baytların önemli olduğu kullanıcıya görünür yazma işlemlerinden önce `--dry-run` kullanın. JSONC ve YAML düzenlemeleri mevcut belgeye yama uygular (`jsonc-parser` veya `yaml` belge API'si aracılığıyla), bu nedenle dokunulmayan baytlar genellikle korunur; markdown ise herhangi bir düzenlemede dosyayı ayrıştırılmış yapısından yeniden oluşturur ve bu durum değiştirilen yaprağın dışındaki önemsiz biçimlendirmeyi standartlaştırabilir. Önizlemeyi tam işlenmiş dosya yerine odaklanmış bir öncesi/sonrası yaması olarak görmek istediğinizde `--diff` ekleyin.

## Örnekler

```bash
# Bir yolu doğrulayın (dosya sistemine erişim yok)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Bir yaprağı okuyun
openclaw path resolve 'oc://gateway.jsonc/version'

# Joker karakterli arama
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Bir yazma işlemini deneme amaçlı çalıştırın
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Bir yazma işlemini birleşik fark olarak deneme amaçlı çalıştırın
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Yazma işlemini uygulayın
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Bayt doğruluğunda gidiş-dönüş (tanılama)
openclaw path emit ./AGENTS.md
```

Daha fazla dil bilgisi örneği:

```bash
# / veya . içeren anahtarları tırnak içine alın
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Derin JSON/JSONC yollarında eğik çizgi segmentleri kullanılabilir; bunlar noktalı alt segmentlere normalleştirilir
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Bir JSONC yaprak değerini ayrıştırılmış bir nesneyle değiştirin
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# JSONC alt öğeleri üzerinde koşul araması
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Bir JSONC dizisine ekleyin
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Bir JSONC nesne anahtarı ekleyin
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Bir JSONL olayı sona ekleyin
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Son JSONL değer satırını çözümleyin
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Bir YAML iş akışı adımını çözümleyin
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Bir YAML skalerini güncelleyin
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Markdown ön bilgisini adresleyin
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Markdown ön bilgisine ekleyin
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Markdown öğesi alanlarını bulun
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Oturum kapsamlı bir yolu doğrulayın
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Dosya türüne göre tarifler

Aynı beş fiil tüm türlerde çalışır; adresleme şeması dosya uzantısına göre
uygun işleyiciye yönlendirir.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: e-posta taslağı hazırlayan agent
tier: core
---
## Araçlar
- gh: GitHub CLI
- curl: HTTP istemcisi
- send_email: etkin
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
yaprak @ L4: "core" (dize)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
yaprak @ L9: "GitHub CLI" (dize)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
oc://x.md/tools/* için 3 eşleşme:
  oc://x.md/tools/gh           →  düğüm @ L9 [md-item]
  oc://x.md/tools/curl         →  düğüm @ L10 [md-item]
  oc://x.md/tools/send-email   →  düğüm @ L11 [md-item]
```

`[frontmatter]` koşulu YAML ön bilgi bloğunu adresler; `tools`, `## Tools`
başlığıyla kısa ad üzerinden eşleşir ve kaynakta alt çizgi kullanılsa bile öğe
yaprakları kısa ad biçimini korur (`send_email`, `send-email` olur).

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
yaprak @ L4: "true" (mantıksal değer)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: /…/config.jsonc dosyasına 142 bayt yazılacaktı
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC düzenlemeleri `jsonc-parser` üzerinden geçtiği için açıklamalar ve boşluklar
bir `set` işleminden sonra korunur. Değişiklikleri uygulamadan önce baytları
incelemek için ilk olarak `--dry-run` ile çalıştırın. `.json` dosyaları,
`.jsonc` ile aynı işleyiciyi ve düzenleme yolunu kullanır.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
oc://session.jsonl/[event=action]/userId için 1 eşleşme:
  oc://session.jsonl/L2/userId  →  yaprak @ L2: "u1" (dize)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
yaprak @ L2: "2" (sayı)
```

Her satır bir kayıttır. Satır numarasını bilmiyorsanız koşulla
(`[event=action]`), biliyorsanız standart `LN` segmentiyle adresleyin.
`.ndjson` dosyaları, `.jsonl` ile aynı işleyiciyi kullanır.

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
yaprak @ L3: "fetch" (dize)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: /…/workflow.yaml dosyasına 99 bayt yazılacaktı
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML, elle yazılmış bir ayrıştırıcı yerine `yaml` paketinin `Document` API'sini
kullanır; böylece olağan ayrıştırma/yayımlama gidiş dönüşlerinde açıklamalar ve
yazım biçimi korunurken çözümlenen yollar JSONC ile aynı eşleme anahtarı / dizi
indeksi modelini kullanır. Aynı işleyici `.yaml`, `.yml` ve `.lobster`
dosyalarını işler.

## Alt komut başvurusu

### `resolve <oc-path>`

Tek bir yaprağı veya düğümü okuyun. Joker karakterler reddedilir; bunlar için
`find` kullanın. Eşleşmede `0`, temiz bir eşleşmeme durumunda `1`, ayrıştırma
hatasında veya reddedilen desende `2` koduyla çıkar.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Bir joker karakter / koşul / birleşim deseni için tüm eşleşmeleri listeleyin.
En az bir eşleşmede `0`, sıfır eşleşmede `1` koduyla çıkar. Dosya yuvası joker
karakterleri `OC_PATH_FILE_WILDCARD_UNSUPPORTED` ile reddedilir; somut bir dosya
belirtin (çoklu dosya glob eşleştirmesi sonraki bir özelliktir).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Bir yaprak yazın. Dosyaya dokunmadan yazılacak baytların önizlemesini görmek
için `--dry-run` ile birlikte kullanın. Birleşik fark önizlemesi için `--diff`
ekleyin. Başarılı yazmada `0`, altyapı reddederse (örneğin bir koruyucu değer
denetimi tetiklenirse) `1`, ayrıştırma hatalarında `2` koduyla çıkar.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key` ekleme işareti, belirtilen alt öğe henüz mevcut değilse onu oluşturur;
`+nnn` ve yalın `+` sırasıyla indeksli ekleme ve sona ekleme için kullanılır.

### `validate <oc-path>`

Yalnızca ayrıştırma denetimi. Dosya sistemi erişimi yoktur. Değişkenleri
yerleştirmeden önce bir şablon yolunun düzgün biçimlendirildiğini doğrulamak
veya hata ayıklamak için yapısal dökümü görmek istediğinizde kullanışlıdır:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
geçerli: oc://AGENTS.md/tools/gh
  dosya:   AGENTS.md
  bölüm:   tools
  öğe:     gh
```

Geçerliyse `0`, geçersizse (yapılandırılmış bir `code` ve `message` ile) `1`,
bağımsız değişken hatalarında `2` koduyla çıkar.

### `emit <file>`

Bir dosyayı türüne özgü ayrıştırıcı ve yayımlayıcı üzerinden gidiş dönüşlü
işleyin. Geçerli bir dosyada çıktı, girdiyle bayt düzeyinde aynı olmalıdır;
farklılık bir ayrıştırıcı hatasına veya koruyucu değer denetiminin
tetiklendiğine işaret eder. Gerçek dünya girdilerinde altyapı davranışını
ayıklamak için kullanışlıdır.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Çıkış kodları

| Kod | Anlam                                                                                  |
| --- | -------------------------------------------------------------------------------------- |
| `0` | Başarılı. (`resolve` / `find`: en az bir eşleşme. `set`: yazma başarılı.)              |
| `1` | Eşleşme yok veya `set` altyapı tarafından reddedildi (sistem düzeyinde hata yok).      |
| `2` | Bağımsız değişken veya ayrıştırma hatası.                                               |

## Çıktı modu

`openclaw path` TTY'yi algılar: terminalde insan tarafından okunabilir çıktı,
standart çıktı bir kanala aktarılıyor veya yönlendiriliyorsa JSON üretir.
`--json` ve `--human`, otomatik algılamayı geçersiz kılar.

## Notlar

- `set`, baytları altyapının yayımlama yolu üzerinden yazar; bu yol gizleme
  koruyucu değer denetimini otomatik olarak uygular. `__OPENCLAW_REDACTED__`
  değerini taşıyan (birebir veya alt dize olarak) bir yaprağın yazılması
  reddedilir.
- JSONC ayrıştırması ve yaprak düzenlemeleri Plugin'e özgü `jsonc-parser`
  bağımlılığını kullanır; böylece olağan yaprak yazmalarında açıklamalar ve
  biçimlendirme, elle yazılmış bir ayrıştırma/yeniden oluşturma yolundan geçmek
  yerine korunur.
- `path`, bilinen son geçerli (LKG) yapılandırma takibinden veya kurtarmadan
  haberdar değildir; bu yaşam döngüsünün sahibi başka bir bileşendir. `path`
  üzerinden düzenlediğiniz bir dosya aynı zamanda LKG takibindeyse sonraki
  yapılandırma okuması dosyanın yükseltileceğine mi yoksa kurtarılacağına mı
  karar verir; bir `path` düzenlemesini o dosyaya yapılan diğer doğrudan
  yazmalarla aynı şekilde değerlendirin.

## İlgili

- [CLI başvurusu](/tr/cli)

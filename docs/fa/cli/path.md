---
read_when:
    - می‌خواهید از ترمینال یک برگ را داخل یک فایل فضای کاری بخوانید یا بنویسید
    - دارید بر اساس وضعیت فضای کاری اسکریپت می‌نویسید و به یک طرح آدرس‌دهی پایدار و مستقل از نوع نیاز دارید
    - در حال اشکال‌زدایی یک مسیر `oc://` هستید (نحو را اعتبارسنجی کنید و ببینید به چه چیزی resolve می‌شود)
summary: مرجع CLI برای `openclaw path` (بررسی و ویرایش فایل‌های فضای کاری از طریق طرح آدرس‌دهی `oc://`)
title: مسیر
x-i18n:
    generated_at: "2026-06-27T17:27:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

دسترسی پوستهٔ فراهم‌شده توسط Plugin به زیرلایهٔ آدرس‌دهی `oc://`: یک
طرح مسیر مبتنی بر dispatch نوع برای بازرسی و ویرایش فایل‌های قابل‌آدرس‌دهی
workspace (markdown، jsonc، jsonl، yaml/yml/lobster). میزبان‌های خودگردان، نویسندگان Plugin
و افزونه‌های ویرایشگر از آن برای خواندن، یافتن، یا به‌روزرسانی یک مکان محدود
بدون ساخت parser اختصاصی برای هر فایل استفاده می‌کنند.

CLI فعل‌های عمومی زیرلایه را بازتاب می‌دهد:

- `resolve` عینی و تک‌تطبیقی است.
- `find` فعل چندتطبیقی برای wildcardها، unionها، predicateها و
  گسترش موقعیتی است.
- `set` فقط مسیرهای عینی یا نشانگرهای درج را می‌پذیرد؛ الگوهای wildcard پیش از
  نوشتن رد می‌شوند.

`path` توسط Plugin اختیاری همراه `oc-path` فراهم می‌شود. پیش از
اولین استفاده آن را فعال کنید:

```bash
openclaw plugins enable oc-path
```

## چرا از آن استفاده کنیم

وضعیت OpenClaw در markdown ویرایش‌شده توسط انسان، پیکربندی JSONC دارای comment،
لاگ‌های JSONL فقط-افزودنی، و فایل‌های workflow/spec از نوع YAML پخش شده است. اسکریپت‌های پوسته، hookها،
و agentها اغلب به یک مقدار کوچک از آن فایل‌ها نیاز دارند: یک کلید frontmatter، یک
تنظیم Plugin، یک فیلد رکورد لاگ، یک گام YAML، یا یک bullet item زیر یک
بخش نام‌گذاری‌شده.

`openclaw path` به آن فراخوان‌ها یک آدرس پایدار می‌دهد به‌جای یک grep،
regex، یا parser یک‌باره برای هر نوع فایل. همان مسیر `oc://` می‌تواند از
ترمینال اعتبارسنجی، resolve، جست‌وجو، dry-run، و نوشته شود، که automation محدود
را برای بازبینی آسان‌تر و برای اجرای دوباره ایمن‌تر می‌کند. این به‌ویژه وقتی مفید است
که می‌خواهید یک leaf را به‌روزرسانی کنید و در عین حال بقیهٔ commentهای فایل،
line endingها، و قالب‌بندی پیرامونی را حفظ کنید.

وقتی چیزی که می‌خواهید یک آدرس منطقی دارد، اما شکل فیزیکی فایل
متفاوت است، از آن استفاده کنید:

- یک hook می‌خواهد یک تنظیم را از JSONC دارای comment بخواند بدون اینکه هنگام
  نوشتن مقدار به فایل، commentها از بین بروند.
- یک اسکریپت نگه‌داری می‌خواهد هر فیلد رویداد مطابق را در یک لاگ JSONL
  بدون بارگذاری کل لاگ در یک parser سفارشی پیدا کند.
- یک افزونهٔ ویرایشگر می‌خواهد با slug به یک بخش markdown یا bullet item بپرد،
  سپس همان خط دقیقی را که به آن resolve شده render کند.
- یک agent می‌خواهد پیش از اعمال، یک ویرایش بسیار کوچک workspace را dry-run کند، با
  byteهای تغییرکرده که در review قابل مشاهده‌اند.

احتمالاً برای ویرایش‌های معمول کل فایل، migrationهای غنی پیکربندی،
یا نوشتن‌های اختصاصی memory به `openclaw path` نیاز ندارید. آن‌ها باید از
فرمان یا Plugin مالک استفاده کنند. `path` برای عملیات کوچک و قابل‌آدرس‌دهی فایل است که در آن
یک فرمان ترمینال تکرارپذیر از یک parser اختصاصی دیگر روشن‌تر است.

## چگونه استفاده می‌شود

خواندن یک مقدار از یک فایل پیکربندی ویرایش‌شده توسط انسان:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

پیش‌نمایش یک نوشتن بدون دست‌زدن به disk:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

یافتن رکوردهای مطابق در یک لاگ JSONL فقط-افزودنی:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

آدرس‌دهی یک دستورالعمل در markdown بر اساس بخش و item به‌جای شمارهٔ خط:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

اعتبارسنجی یک مسیر در CI یا اسکریپت preflight پیش از اینکه اسکریپت بخواند یا بنویسد:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

این فرمان‌ها برای کپی شدن در اسکریپت‌های پوسته طراحی شده‌اند. وقتی یک
فراخوان به خروجی ساخت‌یافته نیاز دارد از `--json` استفاده کنید و وقتی یک شخص
نتیجه را بازرسی می‌کند از `--human`.

## چگونه کار می‌کند

`openclaw path` چهار کار انجام می‌دهد:

1. آدرس `oc://` را به slotها parse می‌کند: file، section، item، field، و
   session اختیاری.
2. adapter نوع فایل را از پسوند هدف انتخاب می‌کند (`.md`، `.jsonc`،
   `.jsonl`، `.yaml`، `.yml`، `.lobster`، و aliasهای مرتبط).
3. slotها را نسبت به AST همان نوع فایل resolve می‌کند: headingها/items در markdown،
   کلیدهای object/indexهای array در JSONC، رکوردهای خطی JSONL، یا nodeهای map/sequence
   در YAML.
4. برای `set`، byteهای ویرایش‌شده را از همان adapter منتشر می‌کند تا بخش‌های دست‌نخوردهٔ
   فایل commentها، line endingها، و قالب‌بندی نزدیک خود را در جایی که آن نوع
   پشتیبانی می‌کند حفظ کنند.

`resolve` و `set` به یک هدف عینی نیاز دارند. `find` فعل اکتشافی است:
wildcardها، unionها، predicateها و ordinalها را به تطبیق‌های عینی
گسترش می‌دهد که می‌توانید پیش از انتخاب یکی برای نوشتن، آن‌ها را بازرسی کنید.

## زیر‌فرمان‌ها

| زیر‌فرمان               | هدف                                                                          |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | تطبیق عینی در مسیر را چاپ می‌کند (یا «یافت نشد»).                            |
| `find <pattern>`        | تطبیق‌ها را برای مسیر wildcard / union / predicate فهرست می‌کند.              |
| `set <oc-path> <value>` | یک leaf یا هدف درج را در یک مسیر عینی می‌نویسد. از `--dry-run` پشتیبانی می‌کند. |
| `validate <oc-path>`    | فقط parse؛ breakdown ساختاری را چاپ می‌کند (file / section / item / field).  |
| `emit <file>`           | یک فایل را از مسیر `parseXxx` + `emitXxx` round-trip می‌کند (diagnostic وفاداری byte). |

## flagهای سراسری

| flag            | هدف                                                                     |
| --------------- | ----------------------------------------------------------------------- |
| `--cwd <dir>`   | slot فایل را نسبت به این directory resolve می‌کند (پیش‌فرض: `process.cwd()`). |
| `--file <path>` | مسیر resolve‌شدهٔ slot فایل را override می‌کند (دسترسی absolute).        |
| `--json`        | خروجی JSON را اجباری می‌کند (پیش‌فرض وقتی stdout یک TTY نیست).           |
| `--human`       | خروجی انسانی را اجباری می‌کند (پیش‌فرض وقتی stdout یک TTY است).          |
| `--dry-run`     | (فقط روی `set`) byteهایی را که نوشته می‌شدند بدون نوشتن چاپ می‌کند.       |
| `--diff`        | (با `set --dry-run`) به‌جای byteهای کامل، یک unified diff چاپ می‌کند.    |

## نحو `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

قوانین slot: `field` به `item` نیاز دارد، و `item` به `section` نیاز دارد. در همهٔ
چهار slot:

- **بخش‌های quoted** — `"a/b.c"` از جداکننده‌های `/` و `.` سالم می‌ماند.
  محتوا byte-literal است؛ `"` و `\` داخل quote مجاز نیستند.
  slot فایل نیز quote-aware است: `oc://"skills/email-drafter"/Tools/$last`
  با `skills/email-drafter` مثل یک مسیر فایل واحد رفتار می‌کند.
- **predicateها** — `[k=v]`، `[k!=v]`، `[k<v]`، `[k<=v]`، `[k>v]`،
  `[k>=v]`. عملگرهای عددی نیاز دارند هر دو طرف به عددهای finite coerce شوند.
- **unionها** — `{a,b,c}` با هرکدام از گزینه‌ها تطبیق می‌یابد.
- **wildcardها** — `*` (یک sub-segment واحد) و `**` (صفر-یا-بیشتر،
  بازگشتی). `find` این‌ها را می‌پذیرد؛ `resolve` و `set` آن‌ها را به‌دلیل
  ابهام رد می‌کنند.
- **موقعیتی** — `$first` / `$last` به اولین / آخرین index یا
  کلید declared resolve می‌شوند.
- **ordinal** — `#N` برای Nامین تطبیق بر اساس ترتیب document.
- **نشانگرهای درج** — `+`، `+key`، `+nnn` برای درج keyed / indexed
  (با `set` استفاده کنید).
- **دامنهٔ session** — `?session=cron-daily` و مانند آن. مستقل از تو‌در‌تویی slot
  است. مقادیر session خام هستند، percent-decoded نمی‌شوند؛ نباید شامل
  control characterها یا delimiterهای query رزروشده (`?`، `&`، `%`) باشند.

کاراکترهای رزروشده (`?`، `&`، `%`) خارج از بخش‌های quoted، predicate، یا union
رد می‌شوند. control characterها (U+0000-U+001F، U+007F) در هرجا، از جمله
مقدار query `session`، رد می‌شوند.

`formatOcPath(parseOcPath(path)) === path` برای مسیرهای canonical تضمین شده است.
پارامترهای query غیرcanonical به‌جز اولین مقدار غیرخالی
`session=` نادیده گرفته می‌شوند.

## آدرس‌دهی بر اساس نوع فایل

| نوع               | مدل آدرس‌دهی                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| Markdown          | بخش‌های H2 بر اساس slug، bullet itemها بر اساس slug یا `#N`، frontmatter از طریق `[frontmatter]`. |
| JSONC/JSON        | کلیدهای object و indexهای array؛ dotها sub-segmentهای تودرتو را جدا می‌کنند مگر اینکه quoted باشند. |
| JSONL             | آدرس‌های خطی top-level (`L1`، `L2`، `$first`، `$last`)، سپس descent به سبک JSONC داخل خط.          |
| YAML/YML/.lobster | کلیدهای map و indexهای sequence؛ commentها و flow style توسط API سند YAML مدیریت می‌شوند.        |

`resolve` یک تطبیق ساخت‌یافته برمی‌گرداند: `root`، `node`، `leaf`، یا
`insertion-point`، با شمارهٔ خط ۱-مبنایی. مقدارهای leaf به‌صورت متن
به‌همراه `leafType` نمایش داده می‌شوند تا نویسندگان Plugin بتوانند previewها را بدون وابستگی به
شکل AST هر نوع render کنند.

## قرارداد mutation

`set` یک هدف عینی را می‌نویسد:

- مقدارهای frontmatter در Markdown و فیلدهای item از نوع `- key: value` برگ‌های string هستند.
  درج‌های Markdown بخش‌ها، کلیدهای frontmatter، یا itemهای بخش را append می‌کنند و
  برای فایل تغییرکرده یک شکل canonical markdown render می‌کنند.
- نوشتن leaf در JSONC مقدار string را به نوع leaf موجود coerce می‌کند
  (`string`، `number` finite، `true`/`false`، یا `null`). وقتی جایگزینی leaf در JSONC/JSON/JSONL
  باید `<value>` را به‌عنوان JSON parse کند و ممکن است شکل را تغییر دهد، مانند جایگزینی یک shorthand
  string SecretRef با یک object، از `--value-json` استفاده کنید. درج‌های object و array در JSONC
  `<value>` را به‌عنوان JSON parse می‌کنند و برای نوشتن‌های معمول leaf از مسیر ویرایش
  `jsonc-parser` استفاده می‌کنند و commentها و قالب‌بندی نزدیک را حفظ می‌کنند.
- نوشتن leaf در JSONL داخل یک خط مانند JSONC coerce می‌شود. جایگزینی کل خط و
  append، `<value>` را به‌عنوان JSON parse می‌کنند. JSONL renderشده قرارداد غالب
  line-ending فایل، یعنی LF/CRLF، را حفظ می‌کند.
- نوشتن leaf در YAML به نوع scalar موجود coerce می‌شود (`string`، `number`
  finite، `true`/`false`، یا `null`). درج‌های YAML از API سند package همراه
  `yaml` برای به‌روزرسانی‌های map/sequence استفاده می‌کنند. سندهای YAML نامعتبر
  دارای خطاهای parser پیش از mutation با `parse-error` رد می‌شوند.

وقتی byteهای دقیق اهمیت دارند، پیش از نوشتن‌های قابل‌مشاهده برای کاربر از `--dry-run` استفاده کنید. این
زیرلایه خروجی byte-identical را برای round-tripهای parse/emit حفظ می‌کند، اما یک
mutation بسته به نوع می‌تواند ناحیهٔ ویرایش‌شده یا فایل را canonicalize کند.
وقتی می‌خواهید preview به‌جای کل فایل renderشده، یک patch متمرکز before/after باشد
`--diff` را اضافه کنید.

## نمونه‌ها

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

نمونه‌های بیشتر grammar:

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

## دستورالعمل‌ها بر اساس نوع فایل

همین پنج فعل در همه نوع‌ها کار می‌کنند؛ طرح آدرس‌دهی بر اساس پسوند فایل
مسیر را تعیین می‌کند. مثال‌های زیر از fixtureهای توضیح PR استفاده می‌کنند.

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

گزاره `[frontmatter]` بلوک frontmatter در YAML را آدرس‌دهی می‌کند؛ `tools`
با سرعنوان `## Tools` از طریق slug مطابقت دارد، و برگ‌های آیتم‌ها حتی وقتی
منبع از زیرخط استفاده می‌کند (`send_email` → `send-email`) شکل slug خود را
حفظ می‌کنند.

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

ویرایش‌های JSONC از مسیر `jsonc-parser` عبور می‌کنند، بنابراین کامنت‌ها و
فاصله‌گذاری‌ها پس از یک `set` حفظ می‌شوند. ابتدا با `--dry-run` اجرا کنید تا
پیش از ثبت تغییر، بایت‌ها را بررسی کنید.

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

هر خط یک رکورد است. وقتی شماره خط را نمی‌دانید با گزاره
(`[event=action]`) آدرس‌دهی کنید، یا وقتی آن را می‌دانید از قطعه متعارف
`LN` استفاده کنید.

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

YAML به جای یک parser دست‌ساز از API `Document` بسته `yaml` استفاده می‌کند،
بنابراین چرخه‌های معمول parse/emit کامنت‌ها و شکل نگارش را حفظ می‌کنند، در
حالی که مسیرهای resolveشده همان مدل کلید نقشه / اندیس دنباله را مانند JSONC
به کار می‌برند. همان adapter فایل‌های `.yaml`، `.yml` و `.lobster` را
مدیریت می‌کند.

## مرجع زیر‌فرمان‌ها

### `resolve <oc-path>`

یک برگ یا گره واحد را می‌خواند. Wildcardها رد می‌شوند؛ برای آن‌ها از `find`
استفاده کنید. هنگام یافتن match با `0`، هنگام نبود match تمیز با `1`، و
هنگام خطای parse یا الگوی ردشده با `2` خارج می‌شود.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

همه matchهای یک الگوی wildcard / predicate / union را فهرست می‌کند. اگر دست‌کم
یک match وجود داشته باشد با `0` و اگر هیچ matchی نباشد با `1` خارج می‌شود.
Wildcardهای جایگاه فایل با `OC_PATH_FILE_WILDCARD_UNSUPPORTED` رد می‌شوند؛ یک
فایل مشخص بدهید (globbing چندفایلی یک قابلیت بعدی است).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

یک برگ را می‌نویسد. برای پیش‌نمایش بایت‌هایی که بدون دست‌زدن به فایل نوشته
می‌شدند، آن را با `--dry-run` همراه کنید. برای پیش‌نمایش unified diff،
`--diff` را اضافه کنید. هنگام نوشتن موفق با `0`، اگر substrate رد کند (برای
مثال، برخورد با نگهبان sentinel) با `1`، و هنگام خطاهای parse با `2` خارج
می‌شود.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

نشانگر درج `+key` فرزند نام‌گذاری‌شده را در صورتی که از قبل وجود نداشته
باشد می‌سازد؛ `+nnn` و `+` خالی به‌ترتیب برای درج اندیس‌دار و افزودن به
انتها کار می‌کنند.

### `validate <oc-path>`

بررسی فقط-parse. دسترسی به فایل‌سیستم ندارد. وقتی می‌خواهید پیش از جایگزینی
متغیرها تأیید کنید که مسیر template خوش‌ساخت است، یا وقتی برای اشکال‌زدایی
شکست ساختاری را می‌خواهید، مفید است:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

وقتی معتبر باشد با `0`، وقتی نامعتبر باشد با `1` (همراه با `code` و
`message` ساختاریافته)، و هنگام خطاهای آرگومان با `2` خارج می‌شود.

### `emit <file>`

یک فایل را از parser و emitter مخصوص نوع خودش عبور می‌دهد. روی یک فایل سالم،
خروجی باید از نظر بایت با ورودی یکسان باشد؛ واگرایی نشان‌دهنده باگ parser یا
برخورد با sentinel است. برای اشکال‌زدایی رفتار substrate روی ورودی‌های دنیای
واقعی مفید است.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## کدهای خروج

| کد  | معنی                                                                       |
| --- | -------------------------------------------------------------------------- |
| `0` | موفقیت. (`resolve` / `find`: دست‌کم یک match. `set`: نوشتن موفق بود.)     |
| `1` | بدون match، یا `set` توسط substrate رد شد (بدون خطای سطح سیستم).          |
| `2` | خطای آرگومان یا parse.                                                     |

## حالت خروجی

`openclaw path` نسبت به TTY آگاه است: روی ترمینال خروجی خوانا برای انسان، و
وقتی stdout به pipe یا redirect وصل باشد JSON تولید می‌کند. `--json` و
`--human` تشخیص خودکار را override می‌کنند.

## نکته‌ها

- `set` بایت‌ها را از مسیر emit متعلق به substrate می‌نویسد، که نگهبان
  redaction-sentinel را به‌طور خودکار اعمال می‌کند. برگی که
  `__OPENCLAW_REDACTED__` را حمل کند (عیناً یا به‌صورت زیررشته) هنگام نوشتن
  رد می‌شود.
- parse کردن JSONC و ویرایش‌های برگ از وابستگی plugin-local به
  `jsonc-parser` استفاده می‌کنند، بنابراین کامنت‌ها و قالب‌بندی در نوشتن‌های
  معمول برگ حفظ می‌شوند و از مسیر parser/re-render دست‌ساز عبور نمی‌کنند.
- `path` چیزی درباره LKG نمی‌داند. اگر فایل تحت ردیابی LKG باشد، فراخوانی
  observe بعدی تصمیم می‌گیرد که promote / recover انجام شود یا نه.
  `set --batch` برای multi-set اتمیک از مسیر چرخه عمر promote/recover در LKG
  هم‌زمان با substrate بازیابی LKG برنامه‌ریزی شده است.

## مرتبط

- [مرجع CLI](/fa/cli)

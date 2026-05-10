---
read_when:
    - می‌خواهید از ترمینال یک برگ را درون یک فایل فضای کاری بخوانید یا بنویسید
    - برای کار با وضعیت فضای کاری اسکریپت می‌نویسید و یک طرح آدرس‌دهی پایدار و مستقل از نوع می‌خواهید
    - در حال اشکال‌زدایی مسیر `oc://` هستید (نحو را اعتبارسنجی کنید، ببینید به چه چیزی حل می‌شود)
summary: مرجع CLI برای `openclaw path` (بررسی و ویرایش فایل‌های فضای کاری از طریق طرح آدرس‌دهی `oc://`)
title: مسیر
x-i18n:
    generated_at: "2026-05-10T19:32:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

دسترسی شِل ارائه‌شده توسط Plugin به زیرلایهٔ آدرس‌دهی `oc://`: یک
طرح مسیر dispatch‌شونده بر اساس نوع برای بازرسی و ویرایش فایل‌های قابل‌آدرس‌دهی
workspace (markdown، jsonc، jsonl). خودمیزبان‌ها، نویسندگان Plugin، و افزونه‌های
ویرایشگر از آن برای خواندن، یافتن، یا به‌روزرسانی یک مکان محدود بدون
نوشتن parser اختصاصی برای هر فایل استفاده می‌کنند.

CLI فعل‌های عمومی زیرلایه را بازتاب می‌دهد:

- `resolve` مشخص و تک‌تطبیق است.
- `find` فعل چندتطبیقی برای wildcardها، unionها، predicateها، و
  گسترش‌های مکانی است.
- `set` فقط مسیرهای مشخص یا نشانگرهای درج را می‌پذیرد؛ الگوهای wildcard پیش از
  نوشتن رد می‌شوند.

`path` توسط Plugin اختیاری باندل‌شدهٔ `oc-path` ارائه می‌شود. پیش از
نخستین استفاده آن را فعال کنید:

```bash
openclaw plugins enable oc-path
```

## چرا از آن استفاده کنیم

وضعیت OpenClaw در markdown ویرایش‌شده توسط انسان، پیکربندی JSONC دارای comment،
و لاگ‌های JSONL فقط-افزودنی پراکنده است. اسکریپت‌های شِل، hookها، و agentها اغلب به
یک مقدار کوچک از آن فایل‌ها نیاز دارند: یک کلید frontmatter، یک تنظیم Plugin، یک
فیلد رکورد لاگ، یا یک آیتم bullet زیر یک بخش نام‌گذاری‌شده.

`openclaw path` به این فراخوان‌ها به‌جای یک grep، regex، یا parser تک‌موردی
برای هر نوع فایل، یک آدرس پایدار می‌دهد. همان مسیر `oc://` را می‌توان از
ترمینال اعتبارسنجی، resolve، جست‌وجو، dry-run، و نوشته کرد، که automation محدود را
آسان‌تر برای بازبینی و امن‌تر برای اجرای دوباره می‌کند. این ابزار به‌ویژه وقتی
مفید است که می‌خواهید یک leaf را به‌روزرسانی کنید و در عین حال بقیهٔ commentها،
پایان‌خط‌ها، و قالب‌بندی پیرامونی فایل را حفظ کنید.

وقتی چیزی که می‌خواهید یک آدرس منطقی دارد، اما شکل فیزیکی فایل متفاوت است، از آن
استفاده کنید:

- یک hook می‌خواهد یک تنظیم را از JSONC دارای comment بخواند، بدون اینکه هنگام
  نوشتن مقدار به فایل commentها از دست بروند.
- یک اسکریپت نگهداری می‌خواهد هر فیلد event منطبق را در یک لاگ JSONL بیابد
  بدون اینکه کل لاگ را در یک parser سفارشی بارگذاری کند.
- یک افزونهٔ ویرایشگر می‌خواهد با slug به یک بخش markdown یا آیتم bullet بپرد،
  سپس خط دقیقی را که resolve کرده render کند.
- یک agent می‌خواهد پیش از اعمال یک ویرایش کوچک workspace آن را dry-run کند، به‌طوری
  که byteهای تغییرکرده در review قابل مشاهده باشند.

احتمالاً برای ویرایش‌های معمول کل فایل، migrationهای غنی پیکربندی، یا writeهای
ویژهٔ memory به `openclaw path` نیاز ندارید. این موارد باید از فرمان یا Plugin
مالک استفاده کنند. `path` برای عملیات کوچک و قابل‌آدرس‌دهی فایل است، جایی که یک
فرمان تکرارپذیر ترمینال از یک parser اختصاصی دیگر شفاف‌تر است.

## شیوهٔ استفاده

خواندن یک مقدار از یک فایل پیکربندی ویرایش‌شده توسط انسان:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

پیش‌نمایش یک write بدون دست‌زدن به دیسک:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

یافتن رکوردهای منطبق در یک لاگ JSONL فقط-افزودنی:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

آدرس‌دهی یک دستور در markdown با بخش و آیتم به‌جای شمارهٔ خط:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

اعتبارسنجی یک مسیر در CI یا یک اسکریپت preflight پیش از اینکه اسکریپت بخواند یا بنویسد:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

این فرمان‌ها طوری طراحی شده‌اند که بتوان آن‌ها را در اسکریپت‌های شِل کپی کرد. وقتی
فراخوان به خروجی ساخت‌یافته نیاز دارد از `--json` استفاده کنید و وقتی یک شخص در حال
بررسی نتیجه است از `--human` استفاده کنید.

## شیوهٔ کار

`openclaw path` چهار کار انجام می‌دهد:

1. آدرس `oc://` را به slotها parse می‌کند: file، section، item، field، و
   session اختیاری.
2. adapter نوع فایل را از پسوند هدف انتخاب می‌کند (`.md`، `.jsonc`،
   `.jsonl`، و aliasهای مرتبط).
3. slotها را در برابر AST همان نوع فایل resolve می‌کند: headingها/items در markdown،
   کلیدهای object/indexهای array در JSONC، یا رکوردهای خطی JSONL.
4. برای `set`، byteهای ویرایش‌شده را از همان adapter منتشر می‌کند تا بخش‌های
   دست‌نخوردهٔ فایل commentها، پایان‌خط‌ها، و قالب‌بندی نزدیک خود را در جایی که
   آن نوع پشتیبانی می‌کند حفظ کنند.

`resolve` و `set` به یک هدف مشخص نیاز دارند. `find` فعل اکتشافی است: wildcardها،
unionها، predicateها، و ordinalها را به تطبیق‌های مشخصی گسترش می‌دهد که می‌توانید
پیش از انتخاب یکی برای نوشتن بررسی کنید.

## زیر‌فرمان‌ها

| زیر‌فرمان              | هدف                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | تطبیق مشخص در مسیر را چاپ می‌کند (یا «یافت نشد»).                       |
| `find <pattern>`        | تطبیق‌ها را برای یک مسیر wildcard / union / predicate فهرست می‌کند.                   |
| `set <oc-path> <value>` | یک leaf یا هدف درج را در یک مسیر مشخص می‌نویسد. از `--dry-run` پشتیبانی می‌کند.   |
| `validate <oc-path>`    | فقط parse؛ تجزیهٔ ساختاری را چاپ می‌کند (file / section / item / field).      |
| `emit <file>`           | یک فایل را از طریق `parseXxx` + `emitXxx` round-trip می‌کند (عیب‌یابی byte-fidelity). |

## flagهای سراسری

| flag            | هدف                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | slot فایل را نسبت به این دایرکتوری resolve می‌کند (پیش‌فرض: `process.cwd()`). |
| `--file <path>` | مسیر resolve‌شدهٔ slot فایل را override می‌کند (دسترسی absolute).                |
| `--json`        | خروجی JSON را اجباری می‌کند (پیش‌فرض وقتی stdout یک TTY نیست).                    |
| `--human`       | خروجی انسانی را اجباری می‌کند (پیش‌فرض وقتی stdout یک TTY است).                       |
| `--dry-run`     | (فقط روی `set`) byteهایی را که نوشته می‌شدند بدون نوشتن چاپ می‌کند.   |

## نحو `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

قواعد slot: `field` به `item` نیاز دارد، و `item` به `section` نیاز دارد. در هر
چهار slot:

- **بخش‌های quote‌شده** — `"a/b.c"` از جداکننده‌های `/` و `.` عبور می‌کند.
  محتوا byte-literal است؛ `"` و `\` داخل quote مجاز نیستند.
  slot فایل نیز quote-aware است: `oc://"skills/email-drafter"/Tools/$last`
  با `skills/email-drafter` مانند یک مسیر فایل واحد رفتار می‌کند.
- **predicateها** — `[k=v]`، `[k!=v]`، `[k<v]`، `[k<=v]`، `[k>v]`،
  `[k>=v]`. عملگرهای عددی نیاز دارند هر دو طرف به عددهای finite تبدیل شوند.
- **unionها** — `{a,b,c}` با هر یک از جایگزین‌ها تطبیق می‌کند.
- **wildcardها** — `*` (یک sub-segment واحد) و `**` (صفر یا بیشتر،
  recursive). `find` این‌ها را می‌پذیرد؛ `resolve` و `set` آن‌ها را به‌عنوان
  ambiguous رد می‌کنند.
- **مکانی** — `$last` به آخرین index / آخرین کلید declare‌شده resolve می‌شود.
- **ordinal** — `#N` برای Nامین تطبیق بر اساس ترتیب سند.
- **نشانگرهای درج** — `+`، `+key`، `+nnn` برای درج keyed / indexed
  (با `set` استفاده کنید).
- **دامنهٔ session** — `?session=cron-daily` و مانند آن. مستقل از nesting در slot
  است. مقدارهای session خام‌اند و percent-decoded نمی‌شوند؛ آن‌ها نباید شامل
  کاراکترهای کنترلی یا جداکننده‌های رزروشدهٔ query باشند (`?`، `&`، `%`).

کاراکترهای رزروشده (`?`، `&`، `%`) بیرون از segmentهای quote‌شده، predicate، یا union
رد می‌شوند. کاراکترهای کنترلی (U+0000-U+001F، U+007F) در همه‌جا، از جمله مقدار
query `session`، رد می‌شوند.

`formatOcPath(parseOcPath(path)) === path` برای مسیرهای canonical تضمین شده است.
پارامترهای query غیر canonical به‌جز نخستین مقدار غیرخالی `session=` نادیده گرفته
می‌شوند.

## آدرس‌دهی بر اساس نوع فایل

| نوع       | مدل آدرس‌دهی                                                                          |
| ---------- | ----------------------------------------------------------------------------------------- |
| Markdown   | بخش‌های H2 بر اساس slug، آیتم‌های bullet بر اساس slug یا `#N`، frontmatter از طریق `[frontmatter]`.       |
| JSONC/JSON | کلیدهای object و indexهای array؛ نقطه‌ها sub-segmentهای تو‌در‌تو را جدا می‌کنند مگر quote شده باشند.              |
| JSONL      | آدرس‌های خطی top-level (`L1`، `L2`، `$last`)، سپس فرود سبک JSONC در داخل خط. |

`resolve` یک تطبیق ساخت‌یافته برمی‌گرداند: `root`، `node`، `leaf`، یا
`insertion-point`، با شمارهٔ خط ۱-based. مقدارهای leaf به‌صورت متن به‌همراه
`leafType` ارائه می‌شوند تا نویسندگان Plugin بتوانند بدون وابستگی به شکل AST هر
نوع، پیش‌نمایش render کنند.

## قرارداد mutation

`set` یک هدف مشخص را می‌نویسد:

- مقدارهای frontmatter در Markdown و فیلدهای آیتم `- key: value`، leafهای string
  هستند. درج‌های Markdown بخش‌ها، کلیدهای frontmatter، یا آیتم‌های section را append
  می‌کنند و برای فایل تغییرکرده یک شکل canonical markdown render می‌کنند.
- writeهای leaf در JSONC مقدار string را به نوع leaf موجود coerce می‌کنند
  (`string`، `number` finite، `true`/`false`، یا `null`). درج‌های object و array در
  JSONC، `<value>` را به‌عنوان JSON parse می‌کنند و برای writeهای معمول leaf از مسیر
  edit در `jsonc-parser` استفاده می‌کنند و commentها و قالب‌بندی نزدیک را حفظ می‌کنند.
- writeهای leaf در JSONL مانند JSONC داخل یک خط coerce می‌شوند. جایگزینی کل خط و
  append، `<value>` را به‌عنوان JSON parse می‌کنند. JSONL render‌شده قرارداد غالب
  پایان‌خط LF/CRLF فایل را حفظ می‌کند.

وقتی byteهای دقیق اهمیت دارند، پیش از writeهای قابل‌مشاهده برای کاربر از `--dry-run`
استفاده کنید. زیرلایه خروجی byte-identical را برای round-tripهای parse/emit حفظ
می‌کند، اما یک mutation می‌تواند بسته به نوع، ناحیه یا فایل ویرایش‌شده را canonical
کند.

## مثال‌ها

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

مثال‌های بیشتر از grammar:

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

## دستورالعمل‌ها بر اساس نوع فایل

همان پنج فعل در همهٔ نوع‌ها کار می‌کنند؛ طرح آدرس‌دهی بر اساس پسوند فایل dispatch
می‌شود. مثال‌های زیر از fixtureهای توضیح PR استفاده می‌کنند.

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

predicate `[frontmatter]` به بلوک YAML frontmatter آدرس می‌دهد؛ `tools`
از طریق slug با heading `## Tools` تطبیق می‌کند، و leafهای آیتم شکل slug خود را
حتی وقتی source از underscore استفاده می‌کند حفظ می‌کنند (`send_email` → `send-email`).

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

ویرایش‌های JSONC از مسیر `jsonc-parser` انجام می‌شوند، بنابراین نظرها و فاصله‌گذاری پس از
`set` حفظ می‌شوند. ابتدا با `--dry-run` اجرا کنید تا پیش از ثبت تغییر، بایت‌ها را بررسی کنید.

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

هر خط یک رکورد است. وقتی شماره خط را نمی‌دانید، با گزاره (`[event=action]`) نشانی‌دهی کنید،
یا وقتی می‌دانید، از بخش متعارف `LN` استفاده کنید.

## مرجع زیر‌فرمان‌ها

### `resolve <oc-path>`

یک برگ یا گره را بخوانید. نویسه‌های عام رد می‌شوند؛ برای آن‌ها از `find` استفاده کنید.
در صورت تطابق با `0`، در صورت نبود تطابق سالم با `1`، و در صورت خطای تجزیه یا الگوی ردشده
با `2` خارج می‌شود.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

همه تطابق‌ها را برای یک الگوی نویسه عام / گزاره / اجتماع فهرست کنید. اگر دست‌کم یک تطابق
وجود داشته باشد با `0` خارج می‌شود، و اگر هیچ تطابقی نباشد با `1`. نویسه‌های عام در جایگاه
فایل با `OC_PATH_FILE_WILDCARD_UNSUPPORTED` رد می‌شوند؛ یک فایل مشخص بدهید (globbing
چندفایلی یک قابلیت بعدی است).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

یک برگ را بنویسید. آن را با `--dry-run` همراه کنید تا بایت‌هایی را که بدون لمس فایل نوشته
می‌شدند، پیش‌نمایش بگیرید. در صورت نوشتن موفق با `0` خارج می‌شود، اگر substrate رد کند
(برای مثال، برخورد با sentinel guard) با `1`، و در صورت خطاهای تجزیه با `2`.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

نشانگر درج `+key` اگر فرزند نام‌گذاری‌شده از قبل وجود نداشته باشد، آن را ایجاد می‌کند؛
`+nnn` و `+` تنها به‌ترتیب برای درج نمایه‌ای و درج الحاقی کار می‌کنند.

### `validate <oc-path>`

بررسی فقط-تجزیه. بدون دسترسی به فایل‌سیستم. وقتی می‌خواهید پیش از جایگزینی متغیرها تأیید
کنید که یک مسیر قالب خوش‌ساخت است، یا وقتی برای اشکال‌زدایی به شکست ساختاری نیاز دارید،
مفید است:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

وقتی معتبر باشد با `0` خارج می‌شود، وقتی نامعتبر باشد با `1` (همراه با `code` و
`message` ساخت‌یافته)، و در خطاهای آرگومان با `2`.

### `emit <file>`

یک فایل را از مسیر تجزیه‌گر و منتشرکننده مخصوص هر نوع رفت‌وبرگشت دهید. روی یک فایل سالم،
خروجی باید از نظر بایتی با ورودی یکسان باشد؛ واگرایی نشان‌دهنده اشکال در تجزیه‌گر یا برخورد
با sentinel است. برای اشکال‌زدایی رفتار substrate روی ورودی‌های واقعی مفید است.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## کدهای خروج

| کد | معنی                                                                        |
| ---- | -------------------------------------------------------------------------- |
| `0`  | موفقیت. (`resolve` / `find`: دست‌کم یک تطابق. `set`: نوشتن موفق بود.) |
| `1`  | نبود تطابق، یا رد شدن `set` توسط substrate (بدون خطای سطح سیستم).      |
| `2`  | خطای آرگومان یا تجزیه.                                                   |

## حالت خروجی

`openclaw path` نسبت به TTY آگاه است: خروجی خوانا برای انسان روی ترمینال، و JSON وقتی
stdout به pipe یا redirect وصل شده باشد. `--json` و `--human` تشخیص خودکار را لغو می‌کنند.

## نکات

- `set` بایت‌ها را از مسیر emit مربوط به substrate می‌نویسد، که به‌صورت خودکار
  redaction-sentinel guard را اعمال می‌کند. برگی که
  `__OPENCLAW_REDACTED__` را حمل کند (عیناً یا به‌عنوان زیررشته) هنگام نوشتن رد
  می‌شود.
- تجزیه JSONC و ویرایش‌های برگ از وابستگی Plugin-local به `jsonc-parser`
  استفاده می‌کنند، بنابراین نظرها و قالب‌بندی در نوشتن‌های معمولی برگ حفظ می‌شوند و به
  مسیر تجزیه‌گر/بازرندر دست‌ساز نمی‌روند.
- `path` درباره LKG چیزی نمی‌داند. اگر فایل تحت ردیابی LKG باشد، فراخوانی observe بعدی
  تصمیم می‌گیرد که promote / recover انجام شود یا نه. `set --batch` برای چند-`set`
  اتمیک از مسیر چرخه عمر promote/recover مربوط به LKG، در کنار substrate بازیابی LKG
  برنامه‌ریزی شده است.

## مرتبط

- [مرجع CLI](/fa/cli)

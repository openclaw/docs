---
read_when:
    - می‌خواهید از طریق ترمینال یک مقدار نهایی را درون فایلی در فضای کاری بخوانید یا بنویسید
    - در حال اسکریپت‌نویسی بر پایهٔ وضعیت فضای کاری هستید و به یک طرح آدرس‌دهی پایدار و مستقل از نوع نیاز دارید
    - در حال اشکال‌زدایی یک مسیر `oc://` هستید (درستی نحو را بررسی کنید و ببینید به چه چیزی resolve می‌شود)
summary: مرجع CLI برای `openclaw path` (بررسی و ویرایش فایل‌های فضای کاری از طریق طرح آدرس‌دهی `oc://`)
title: مسیر
x-i18n:
    generated_at: "2026-07-12T09:53:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

دسترسی پوسته به طرح آدرس‌دهی `oc://`: یک نحو مسیر با توزیع بر اساس نوع
برای بازرسی و ویرایش فایل‌های قابل‌آدرس‌دهی فضای کاری (markdown، jsonc،
jsonl، yaml/yml/lobster). میزبانان مستقل، نویسندگان Plugin و افزونه‌های ویرایشگر
از آن برای خواندن، یافتن یا به‌روزرسانی یک محل محدود استفاده می‌کنند، بدون اینکه
برای هر فایل تجزیه‌گر جداگانه‌ای را دستی پیاده‌سازی کنند.

`path` توسط Plugin اختیاری همراه `oc-path` ارائه می‌شود. پیش از نخستین
استفاده آن را فعال کنید:

```bash
openclaw plugins enable oc-path
```

فعل‌های CLI مدل آدرس‌دهی را بازتاب می‌دهند:

- `resolve` مشخص است و تنها یک تطابق دارد.
- `find` فعل چندتطابقی برای نویسه‌های عام، اجتماع‌ها، گزاره‌ها و
  بسط موقعیتی است.
- `set` فقط مسیرهای مشخص یا نشانگرهای درج را می‌پذیرد؛ الگوهای نویسه عام
  پیش از نوشتن رد می‌شوند.
- `validate` مسیر را بدون دسترسی به سامانه فایل تجزیه می‌کند.
- `emit` فایل را از چرخه تجزیه + خروجی‌سازی عبور می‌دهد (عیب‌یابی وفاداری بایتی).

## چرا از آن استفاده کنیم

وضعیت OpenClaw میان markdown ویرایش‌شده توسط انسان، پیکربندی JSONC
دارای توضیح، گزارش‌های JSONL فقط‌افزودنی و فایل‌های گردش‌کار/مشخصات YAML پراکنده است.
اسکریپت‌ها، هوک‌ها و عامل‌ها اغلب به یک مقدار کوچک از این فایل‌ها نیاز دارند:
یک کلید frontmatter، تنظیم Plugin، فیلد رکورد گزارش، گام YAML یا یک مورد فهرست
زیر بخشی نام‌گذاری‌شده.

`openclaw path` به‌جای یک grep، عبارت منظم یا تجزیه‌گر یک‌باره برای هر نوع فایل،
آدرسی پایدار در اختیار این فراخوانندگان می‌گذارد. همان مسیر `oc://` را می‌توان
از پایانه اعتبارسنجی، تفکیک، جست‌وجو، اجرای آزمایشی و نوشت، که خودکارسازی محدود را
قابل‌بازبینی و تکرارپذیر نگه می‌دارد. باقی فایل حفظ می‌شود؛ بنابراین نوشتن یک برگ
به توضیحات، پایان‌خط‌ها یا قالب‌بندی مجاور آن آسیبی نمی‌زند.

زمانی از آن استفاده کنید که مورد موردنظر آدرسی منطقی دارد، اما شکل فایل
متغیر است:

- یک هوک تنظیمی را از JSONC توضیح‌دار می‌خواند، بدون اینکه هنگام بازنویسی
  مقدار، توضیحات را از دست بدهد.
- یک اسکریپت نگه‌داری همه فیلدهای رویداد منطبق را در گزارش JSONL فقط‌افزودنی
  می‌یابد، بدون اینکه کل گزارش را در تجزیه‌گری سفارشی بارگذاری کند.
- یک ویرایشگر با استفاده از نامک به بخش یا مورد فهرست markdown می‌پرد و سپس
  دقیقاً همان خط تفکیک‌شده را نمایش می‌دهد.
- یک عامل پیش از اعمال ویرایش کوچک فضای کاری، آن را به‌صورت آزمایشی اجرا می‌کند
  و بایت‌های تغییرکرده برای بازبینی قابل‌مشاهده‌اند.

برای ویرایش‌های معمول کل فایل، مهاجرت‌های پیچیده پیکربندی یا نوشتن‌های ویژه حافظه
از `openclaw path` صرف‌نظر کنید؛ این موارد باید از فرمان یا Plugin مالک استفاده کنند.
`path` برای عملیات کوچک و قابل‌آدرس‌دهی روی فایل‌هاست؛ جایی که یک فرمان پایانه
تکرارپذیر از تجزیه‌گر سفارشی دیگری بهتر است.

## نحوه استفاده

خواندن یک مقدار از فایل پیکربندی ویرایش‌شده توسط انسان:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

پیش‌نمایش نوشتن بدون دست‌زدن به دیسک:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

یافتن رکوردهای منطبق در گزارش JSONL فقط‌افزودنی:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

آدرس‌دهی یک دستورالعمل در markdown بر اساس بخش و مورد، به‌جای شماره
خط:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

اعتبارسنجی مسیر در CI یا اسکریپت پیش‌بررسی، پیش از اینکه اسکریپت بخواند یا
بنویسد:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

این فرمان‌ها برای کپی‌شدن در اسکریپت‌های پوسته طراحی شده‌اند. وقتی فراخواننده
به خروجی ساخت‌یافته نیاز دارد از `--json` و وقتی شخصی نتیجه را بازرسی می‌کند
از `--human` استفاده کنید.

## نحوه کار

1. آدرس `oc://` را به جایگاه‌ها تجزیه می‌کند: فایل، بخش، مورد، فیلد و یک
   پرس‌وجوی اختیاری نشست.
2. سازگارگر نوع فایل را بر اساس پسوند هدف انتخاب می‌کند (`.md`، `.jsonc`،
   `.json`، `.jsonl`، `.ndjson`، `.yaml`، `.yml`، `.lobster`).
3. جایگاه‌ها را با ساختار آن نوع فایل تطبیق می‌دهد: عنوان‌ها/موارد
   markdown، کلیدهای شیء/نمایه‌های آرایه JSONC، رکوردهای خطی JSONL یا
   گره‌های نگاشت/دنباله YAML.
4. برای `set`، بایت‌های ویرایش‌شده را از طریق همان سازگارگر خروجی می‌دهد تا
   بخش‌های دست‌نخورده فایل، در صورت پشتیبانی نوع، توضیحات، پایان‌خط‌ها و
   قالب‌بندی مجاور خود را حفظ کنند.

`resolve` و `set` به یک هدف مشخص نیاز دارند. `find` فعل اکتشافی است:
نویسه‌های عام، اجتماع‌ها، گزاره‌ها و ترتیب‌ها را به تطابق‌های مشخصی بسط می‌دهد
که می‌توانید پیش از انتخاب یکی برای نوشتن، آن‌ها را بازرسی کنید.

## زیرفرمان‌ها

| زیرفرمان                | هدف                                                                         |
| ----------------------- | --------------------------------------------------------------------------- |
| `resolve <oc-path>`     | تطابق مشخص در مسیر را چاپ می‌کند (یا «یافت نشد»).                           |
| `find <pattern>`        | تطابق‌های مسیر دارای نویسه عام / اجتماع / گزاره را فهرست می‌کند.            |
| `set <oc-path> <value>` | یک برگ یا هدف درج را در مسیری مشخص می‌نویسد. از `--dry-run` پشتیبانی می‌کند. |
| `validate <oc-path>`    | فقط تجزیه؛ تفکیک ساختاری (فایل / بخش / مورد / فیلد) را چاپ می‌کند.           |
| `emit <file>`           | فایل را از چرخه تجزیه + خروجی‌سازی عبور می‌دهد (عیب‌یابی وفاداری بایتی).     |

## پرچم‌های سراسری

| پرچم           | قابل‌اعمال به                     | هدف                                                                        |
| -------------- | --------------------------------- | -------------------------------------------------------------------------- |
| `--cwd <dir>`  | `resolve`، `find`، `set`، `emit` | جایگاه فایل را نسبت به این شاخه تفکیک می‌کند (پیش‌فرض: `process.cwd()`).    |
| `--file <path>`| `resolve`، `find`، `set`، `emit` | مسیر تفکیک‌شده جایگاه فایل را بازنویسی می‌کند (دسترسی مطلق).                |
| `--json`       | همه                              | خروجی JSON را اجباری می‌کند (پیش‌فرض وقتی stdout یک TTY نیست).             |
| `--human`      | همه                              | خروجی انسانی را اجباری می‌کند (پیش‌فرض وقتی stdout یک TTY است).            |
| `--value-json` | `set`                             | برای جایگزینی برگ JSON/JSONC/JSONL، `<value>` را به‌صورت JSON تجزیه می‌کند. |
| `--dry-run`    | `set`                             | بایت‌هایی را که نوشته می‌شدند، بدون نوشتن چاپ می‌کند.                       |
| `--diff`       | `set` (نیازمند `--dry-run`)       | به‌جای همه بایت‌ها، یک تفاوت یکپارچه چاپ می‌کند.                            |

`validate` فقط `--json` / `--human` را می‌پذیرد؛ این فرمان به سامانه فایل
دسترسی ندارد، بنابراین `--cwd` و `--file` کاربردی ندارند.

## نحو `oc://`

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

قواعد جایگاه‌ها: `field` به `item` نیاز دارد و `item` به `section`. در هر
چهار جایگاه:

- **قطعه‌های نقل‌قول‌شده** — `"a/b.c"` جداکننده‌های `/` و `.` را حفظ می‌کند.
  محتوا بایت‌به‌بایت عینی است؛ `"` و `\` درون نقل‌قول مجاز نیستند. جایگاه فایل
  نیز نقل‌قول را تشخیص می‌دهد: `oc://"skills/email-drafter"/Tools/$last`
  عبارت `skills/email-drafter` را یک مسیر فایل واحد در نظر می‌گیرد.
- **گزاره‌ها** — `[k=v]`، `[k!=v]`، `[k<v]`، `[k<=v]`، `[k>v]`، `[k>=v]`.
  عملگرهای عددی نیاز دارند هر دو طرف به اعداد متناهی تبدیل‌پذیر باشند.
- **اجتماع‌ها** — `{a,b,c}` با هر یک از گزینه‌ها تطابق دارد.
- **نویسه‌های عام** — `*` (یک زیرقطعه) و `**` (صفر یا بیشتر، بازگشتی).
  `find` آن‌ها را می‌پذیرد؛ `resolve` و `set` به‌دلیل ابهام ردشان می‌کنند.
- **موقعیتی** — `$first` / `$last` به نخستین / آخرین نمایه یا کلید
  تعریف‌شده تفکیک می‌شوند.
- **ترتیبی** — `#N` برای Nاُمین تطابق بر اساس ترتیب سند.
- **نشانگرهای درج** — `+`، `+key`، `+nnn` برای درج کلیددار / نمایه‌دار
  (با `set` استفاده کنید).
- **دامنه نشست** — `?session=cron-daily` و مانند آن. مستقل از تودرتویی جایگاه‌هاست.
  مقادیر نشست خام‌اند و درصدگشایی نمی‌شوند؛ نمی‌توانند نویسه‌های کنترلی یا
  جداکننده‌های رزروشده پرس‌وجو (`?`، `&`، `%`) را داشته باشند.

نویسه‌های رزروشده (`?`، `&`، `%`) بیرون از قطعه‌های نقل‌قول‌شده، گزاره‌ای یا
اجتماع رد می‌شوند. نویسه‌های کنترلی (U+0000-U+001F، U+007F) در همه‌جا،
از جمله مقدار پرس‌وجوی `session`، رد می‌شوند.

`formatOcPath(parseOcPath(path)) === path` برای مسیرهای متعارف تضمین می‌شود.
پارامترهای پرس‌وجوی نامتعارف، به‌جز نخستین مقدار غیرخالی `session=`، نادیده
گرفته می‌شوند.

محدودیت‌های سخت: مسیر حداکثر 4096 بایت، حداکثر 4 جایگاه (فایل/بخش/مورد/
فیلد)، حداکثر 64 زیرقطعه نقطه‌ای در هر جایگاه و حداکثر 256 سطح پیمایش
تودرتو برای مسیرهای عمیق JSON دارد. جدا از این، هر ورودی فایل JSONC/JSON
بزرگ‌تر از 16 MiB، برای هر فعلی که آن فایل را بارگذاری کند، به‌جای تجزیه‌شدن
با یک پیام عیب‌یابی تجزیه رد می‌شود.

## آدرس‌دهی بر اساس نوع فایل

| نوع           | پسوندهای فایل                | مدل آدرس‌دهی                                                                                           |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Markdown      | `.md`                        | بخش‌های H2 بر اساس نامک، موارد فهرست بر اساس نامک یا `#N`، و frontmatter از طریق `[frontmatter]`.      |
| JSONC/JSON    | `.jsonc`، `.json`            | کلیدهای شیء و نمایه‌های آرایه؛ نقطه‌ها زیرقطعه‌های تودرتو را جدا می‌کنند، مگر اینکه نقل‌قول شوند.      |
| JSONL         | `.jsonl`، `.ndjson`          | آدرس‌های خط سطح‌بالا (`L1`، `L2`، `$first`، `$last`)، سپس پیمایش به سبک JSONC درون خط.                 |
| YAML/.lobster | `.yaml`، `.yml`، `.lobster` | کلیدهای نگاشت و نمایه‌های دنباله؛ توضیحات و سبک جریان توسط API سند YAML مدیریت می‌شوند.                |

`resolve` یک تطابق ساخت‌یافته بازمی‌گرداند: `root`، `node`، `leaf` یا
`insertion-point`، همراه با شماره خط مبتنی بر 1. مقادیر برگ به‌شکل متن همراه
با `leafType` ارائه می‌شوند تا نویسندگان Plugin بتوانند بدون وابستگی به شکل AST
هر نوع، پیش‌نمایش‌ها را نمایش دهند.

## قرارداد تغییر

`set` یک هدف مشخص را می‌نویسد:

- مقادیر frontmatter در Markdown و فیلدهای مورد `- key: value` برگ‌های رشته‌ای
  هستند. درج‌های Markdown بخش‌ها، کلیدهای frontmatter یا موارد بخش را اضافه
  می‌کنند و شکل متعارف markdown را برای فایل تغییرکرده تولید می‌کنند. بدنه بخش‌ها
  از طریق `set` به‌صورت یکجا قابل‌نوشتن نیست.
- نوشتن برگ JSONC مقدار رشته‌ای را به نوع برگ موجود تبدیل می‌کند
  (`string`، `number` متناهی، `true`/`false` یا `null`). زمانی از `--value-json`
  استفاده کنید که جایگزینی برگ JSONC/JSON/JSONL باید `<value>` را به‌صورت JSON
  تجزیه کند و ممکن است شکل را تغییر دهد؛ مانند جایگزینی یک میان‌بر رشته‌ای
  ارجاع راز با یک شیء. درج‌های شیء و آرایه JSONC، `<value>` را به‌صورت JSON
  تجزیه می‌کنند و برای نوشتن معمول برگ‌ها از مسیر ویرایش `jsonc-parser` استفاده
  می‌کنند تا توضیحات و قالب‌بندی مجاور حفظ شوند.
- نوشتن برگ JSONL درون یک خط مانند JSONC تبدیل نوع می‌شود. جایگزینی کل خط و
  افزودن، `<value>` را به‌صورت JSON تجزیه می‌کنند. JSONL تولیدشده قرارداد غالب
  پایان‌خط LF/CRLF فایل را حفظ می‌کند (رأی اکثریت میان پایان‌خط‌های فایل؛ بنابراین
  فایلی که عمدتاً CRLF است حتی با چند LF پراکنده، CRLF باقی می‌ماند).
- نوشتن برگ YAML به نوع اسکالر موجود تبدیل می‌شود (`string`، `number` متناهی،
  `true`/`false` یا `null`). درج‌های YAML برای به‌روزرسانی نگاشت/دنباله از API
  سند بسته همراه `yaml` استفاده می‌کنند. سندهای YAML بدشکل دارای خطای تجزیه،
  پیش از تغییر با `parse-error` رد می‌شوند.

وقتی بایت‌های دقیق اهمیت دارند، پیش از نوشتن‌های قابل‌مشاهده برای کاربر از
`--dry-run` استفاده کنید. ویرایش‌های JSONC و YAML سند موجود را وصله می‌کنند
(از طریق `jsonc-parser` یا API سند `yaml`)، بنابراین بایت‌های دست‌نخورده معمولاً
حفظ می‌شوند؛ markdown در هر ویرایش فایل را از ساختار تجزیه‌شده‌اش بازسازی می‌کند
که ممکن است قالب‌بندی فرعی بیرون از برگ تغییرکرده را متعارف‌سازی کند. زمانی
`--diff` را اضافه کنید که می‌خواهید پیش‌نمایش به‌جای کل فایل تولیدشده، به‌شکل
وصله متمرکز پیش/پس نمایش داده شود.

## مثال‌ها

```bash
# اعتبارسنجی یک مسیر (بدون دسترسی به سامانه فایل)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# خواندن یک برگ
openclaw path resolve 'oc://gateway.jsonc/version'

# جست‌وجو با نویسه عام
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# اجرای آزمایشی نوشتن
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# اجرای آزمایشی نوشتن به‌صورت تفاوت یکپارچه
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# اعمال نوشتن
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# چرخه رفت‌وبرگشت با وفاداری بایتی (عیب‌یابی)
openclaw path emit ./AGENTS.md
```

مثال‌های بیشتر از دستور زبان:

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

همان پنج فعل برای همهٔ انواع فایل کار می‌کنند؛ طرح آدرس‌دهی بر اساس
پسوند فایل مسیر مناسب را انتخاب می‌کند.

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

گزارهٔ `[frontmatter]` بلوک فرانت‌متر YAML را آدرس‌دهی می‌کند؛ `tools`
از طریق نامک با عنوان `## Tools` مطابقت می‌یابد و برگ‌های آیتم حتی وقتی
منبع از زیرخط استفاده می‌کند، شکل نامک خود را حفظ می‌کنند (`send_email` به
`send-email` تبدیل می‌شود).

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

ویرایش‌های JSONC از `jsonc-parser` عبور می‌کنند؛ بنابراین دیدگاه‌ها و
فاصله‌گذاری پس از اجرای `set` حفظ می‌شوند. ابتدا با `--dry-run` اجرا کنید
تا پیش از ثبت تغییر، بایت‌ها را بررسی کنید. فایل‌های `.json` از همان
سازگارکننده و مسیر ویرایش فایل‌های `.jsonc` استفاده می‌کنند.

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

هر خط یک رکورد است. وقتی شمارهٔ خط را نمی‌دانید، با گزاره
(`[event=action]`) آدرس‌دهی کنید؛ در غیر این صورت از قطعهٔ متعارف `LN`
استفاده کنید. فایل‌های `.ndjson` از همان سازگارکنندهٔ فایل‌های `.jsonl`
استفاده می‌کنند.

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

YAML به‌جای یک تجزیه‌گر دست‌ساز از API نوع `Document` بستهٔ `yaml`
استفاده می‌کند؛ بنابراین رفت‌وبرگشت‌های معمول تجزیه/تولید، دیدگاه‌ها و
ساختار نگارش را حفظ می‌کنند، در حالی که مسیرهای حل‌شده از همان مدل
کلید نگاشت / نمایهٔ دنبالهٔ JSONC استفاده می‌کنند. همین سازگارکننده
فایل‌های `.yaml`،‏ `.yml` و `.lobster` را مدیریت می‌کند.

## مرجع زیرفرمان‌ها

### `resolve <oc-path>`

یک برگ یا گره را می‌خواند. نویسه‌های عام پذیرفته نمی‌شوند—برای آن‌ها از
`find` استفاده کنید. در صورت تطابق با کد `0`، در صورت نبود تطابق عادی با
کد `1` و در صورت خطای تجزیه یا الگوی ردشده با کد `2` خارج می‌شود.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

همهٔ تطابق‌های یک الگوی نویسهٔ عام / گزاره / اجتماع را فهرست می‌کند. در
صورت وجود حداقل یک تطابق با کد `0` و در صورت نبود تطابق با کد `1` خارج
می‌شود. نویسه‌های عام در جایگاه فایل با
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` رد می‌شوند—یک فایل مشخص ارائه کنید
(پشتیبانی از الگوهای چندفایلی قابلیتی برای آینده است).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

یک برگ را می‌نویسد. برای پیش‌نمایش بایت‌هایی که بدون دست‌زدن به فایل
نوشته می‌شدند، آن را همراه `--dry-run` به‌کار ببرید. برای پیش‌نمایش
تفاوت یکپارچه، `--diff` را اضافه کنید. در صورت نوشتن موفق با کد `0`،
اگر بستر عملیات را نپذیرد (برای مثال، نگهبان نشانگر فعال شود) با کد `1`
و در صورت خطای تجزیه با کد `2` خارج می‌شود.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

نشانگر درج `+key` در صورت نبود فرزند نام‌گذاری‌شده، آن را ایجاد می‌کند؛
`+nnn` و `+` منفرد نیز به‌ترتیب برای درج نمایه‌ای و افزودن به انتها
کار می‌کنند.

### `validate <oc-path>`

بررسی صرفاً تجزیه‌ای، بدون دسترسی به سامانهٔ فایل. زمانی مفید است که
می‌خواهید پیش از جای‌گذاری متغیرها از خوش‌ساخت‌بودن مسیر یک الگو مطمئن
شوید یا برای اشکال‌زدایی، تفکیک ساختاری آن را مشاهده کنید:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

در صورت معتبر بودن با کد `0`، در صورت نامعتبر بودن با کد `1` (همراه یک
`code` و `message` ساختاریافته) و در صورت خطای آرگومان با کد `2` خارج
می‌شود.

### `emit <file>`

یک فایل را از تجزیه‌گر و تولیدکنندهٔ مختص نوع آن عبور می‌دهد. برای یک
فایل سالم، خروجی باید از نظر بایتی با ورودی یکسان باشد؛ تفاوت نشان‌دهندهٔ
اشکال تجزیه‌گر یا فعال‌شدن یک نشانگر است. برای اشکال‌زدایی رفتار بستر روی
ورودی‌های واقعی مفید است.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## کدهای خروج

| کد  | معنا                                                                            |
| --- | ------------------------------------------------------------------------------- |
| `0` | موفقیت. (`resolve` / `find`: حداقل یک تطابق. `set`: نوشتن موفق بود.)            |
| `1` | بدون تطابق، یا ردشدن `set` توسط بستر (بدون خطای سطح سامانه).                    |
| `2` | خطای آرگومان یا تجزیه.                                                           |

## حالت خروجی

`openclaw path` از TTY آگاه است: در پایانه خروجی خوانا برای انسان و هنگام
لوله‌گذاری یا تغییر مسیر خروجی استاندارد، JSON تولید می‌کند. `--json` و
`--human` تشخیص خودکار را بازنویسی می‌کنند.

## نکته‌ها

- `set` بایت‌ها را از مسیر تولید بستر می‌نویسد که نگهبان نشانگر
  پوشاندن اطلاعات را به‌طور خودکار اعمال می‌کند. نوشتن برگی که شامل
  `__OPENCLAW_REDACTED__` باشد (عیناً یا به‌صورت زیررشته) رد می‌شود.
- تجزیهٔ JSONC و ویرایش برگ‌ها از وابستگی محلی Plugin یعنی
  `jsonc-parser` استفاده می‌کنند؛ بنابراین در نوشتن‌های معمول برگ،
  دیدگاه‌ها و قالب‌بندی حفظ می‌شوند و از مسیر تجزیه‌گر/بازرندر دست‌ساز
  عبور نمی‌کنند.
- `path` از ردیابی یا بازیابی پیکربندی آخرین وضعیت سالم (LKG) آگاه نیست؛
  چرخهٔ عمر آن در جای دیگری مدیریت می‌شود. اگر فایلی که از طریق `path`
  ویرایش می‌کنید تحت ردیابی LKG نیز باشد، خواندن بعدی پیکربندی تصمیم
  می‌گیرد که آن را ارتقا دهد یا بازیابی کند؛ با ویرایش `path` مانند هر
  نوشتن مستقیم دیگری روی آن فایل رفتار کنید.

## مرتبط

- [مرجع CLI](/fa/cli)

---
read_when:
    - به گردش‌کارهای چندمرحله‌ای قطعی با تأییدهای صریح نیاز دارید
    - باید یک گردش کار را بدون اجرای دوباره مراحل قبلی از سر بگیرید
summary: زمان اجرای گردش‌کار تایپ‌شده برای OpenClaw با دروازه‌های تأیید قابل ازسرگیری.
title: خرچنگ دریایی
x-i18n:
    generated_at: "2026-05-12T01:01:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
---

Lobster یک پوستهٔ گردش‌کار است که به OpenClaw اجازه می‌دهد توالی‌های چندمرحله‌ای ابزار را به‌عنوان یک عملیات واحد و قطعی، با نقاط بازرسی تأیید صریح اجرا کند.

Lobster یک لایهٔ تألیف بالاتر از کار پس‌زمینهٔ جداشده است. برای ارکستراسیون جریان بالاتر از وظایف منفرد، [Task Flow](/fa/automation/taskflow) (`openclaw tasks flow`) را ببینید. برای دفتر فعالیت وظیفه، [`openclaw tasks`](/fa/automation/tasks) را ببینید.

## قلاب

دستیار شما می‌تواند ابزارهایی بسازد که خودش را مدیریت می‌کنند. یک گردش‌کار بخواهید، و ۳۰ دقیقه بعد یک CLI به‌همراه پایپ‌لاین‌هایی دارید که با یک فراخوانی اجرا می‌شوند. Lobster قطعهٔ گمشده است: پایپ‌لاین‌های قطعی، تأییدهای صریح، و وضعیت قابل ازسرگیری.

## چرا

امروز، گردش‌کارهای پیچیده به فراخوانی‌های رفت‌وبرگشتی زیادی برای ابزارها نیاز دارند. هر فراخوانی توکن مصرف می‌کند، و LLM باید هر مرحله را ارکستره کند. Lobster این ارکستراسیون را به یک زمان‌اجرای تایپ‌شده منتقل می‌کند:

- **یک فراخوانی به‌جای چندین فراخوانی**: OpenClaw یک فراخوانی ابزار Lobster را اجرا می‌کند و یک نتیجهٔ ساخت‌یافته می‌گیرد.
- **تأییدها به‌صورت داخلی**: اثرات جانبی (ارسال ایمیل، ثبت نظر) گردش‌کار را تا زمان تأیید صریح متوقف می‌کنند.
- **قابل ازسرگیری**: گردش‌کارهای متوقف‌شده یک توکن برمی‌گردانند؛ تأیید کنید و بدون اجرای دوبارهٔ همه‌چیز ادامه دهید.

## چرا یک DSL به‌جای برنامه‌های ساده؟

Lobster عمداً کوچک است. هدف «یک زبان جدید» نیست، بلکه یک مشخصات پایپ‌لاین قابل پیش‌بینی و سازگار با هوش مصنوعی است که تأییدها و توکن‌های ازسرگیری را به‌عنوان قابلیت‌های درجه‌یک دارد.

- **تأیید/ازسرگیری داخلی است**: یک برنامهٔ عادی می‌تواند از انسان درخواست کند، اما نمی‌تواند بدون اینکه خودتان آن زمان‌اجرا را بسازید، با یک توکن پایدار _متوقف شود و ادامه یابد_.
- **قطعیت + ممیزی‌پذیری**: پایپ‌لاین‌ها داده هستند، بنابراین ثبت، مقایسه، بازپخش، و بازبینی آن‌ها آسان است.
- **سطح محدود برای هوش مصنوعی**: یک دستورزبان کوچک + لوله‌کشی JSON مسیرهای کد «خلاقانه» را کاهش می‌دهد و اعتبارسنجی را واقع‌بینانه می‌کند.
- **سیاست ایمنی تعبیه‌شده**: زمان‌پایان‌ها، سقف‌های خروجی، بررسی‌های سندباکس، و فهرست‌های مجاز توسط زمان‌اجرا اعمال می‌شوند، نه هر اسکریپت.
- **همچنان قابل برنامه‌نویسی**: هر مرحله می‌تواند هر CLI یا اسکریپتی را فراخوانی کند. اگر JS/TS می‌خواهید، فایل‌های `.lobster` را از کد تولید کنید.

## نحوهٔ کار

OpenClaw گردش‌کارهای Lobster را با استفاده از یک اجراکنندهٔ توکار **درون‌فرایندی** اجرا می‌کند. هیچ زیرفرایند CLI خارجی ایجاد نمی‌شود؛ موتور گردش‌کار داخل فرایند Gateway اجرا می‌شود و یک پوشش JSON را مستقیماً برمی‌گرداند.
اگر پایپ‌لاین برای تأیید مکث کند، ابزار یک `resumeToken` برمی‌گرداند تا بتوانید بعداً ادامه دهید.

## الگو: CLI کوچک + لوله‌های JSON + تأییدها

فرمان‌های کوچکی بسازید که با JSON صحبت می‌کنند، سپس آن‌ها را در یک فراخوانی Lobster واحد زنجیره کنید. (نام فرمان‌های نمونه در پایین آمده‌اند - نمونه‌های خودتان را جایگزین کنید.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

اگر پایپ‌لاین درخواست تأیید کند، با توکن ادامه دهید:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

هوش مصنوعی گردش‌کار را راه‌اندازی می‌کند؛ Lobster مراحل را اجرا می‌کند. دروازه‌های تأیید اثرات جانبی را صریح و قابل ممیزی نگه می‌دارند.

نمونه: نگاشت ورودی‌ها به فراخوانی‌های ابزار:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## مراحل فقط-JSON برای LLM (`llm-task`)

برای گردش‌کارهایی که به یک **مرحلهٔ LLM ساخت‌یافته** نیاز دارند، ابزار Plugin اختیاری
`llm-task` را فعال کنید و آن را از Lobster فراخوانی کنید. این کار گردش‌کار را
قطعی نگه می‌دارد و همچنان اجازه می‌دهد با یک مدل طبقه‌بندی/خلاصه‌سازی/پیش‌نویس‌سازی کنید.

ابزار را فعال کنید:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### محدودیت مهم: Lobster توکار در برابر `openclaw.invoke`

Plugin همراه Lobster گردش‌کارها را **درون‌فرایندی** داخل Gateway اجرا می‌کند. در آن حالت توکار، `openclaw.invoke` به‌طور خودکار زمینهٔ URL/احراز هویت Gateway را برای فراخوانی‌های ابزار CLI تودرتوی OpenClaw به ارث نمی‌برد.

این یعنی این الگو **در حال حاضر در اجراکنندهٔ توکار قابل اتکا نیست**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

نمونهٔ زیر را فقط زمانی استفاده کنید که **CLI مستقل Lobster** را در محیطی اجرا می‌کنید که `openclaw.invoke` از قبل با زمینهٔ Gateway/احراز هویت درست پیکربندی شده است.

از آن در یک پایپ‌لاین CLI مستقل Lobster استفاده کنید:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

اگر امروز از Plugin توکار Lobster استفاده می‌کنید، ترجیح دهید یکی از این‌ها را به‌کار ببرید:

- یک فراخوانی مستقیم ابزار `llm-task` بیرون از Lobster، یا
- مراحل غیر `openclaw.invoke` داخل پایپ‌لاین Lobster تا زمانی که یک پل توکار پشتیبانی‌شده اضافه شود.

برای جزئیات و گزینه‌های پیکربندی، [LLM Task](/fa/tools/llm-task) را ببینید.

## فایل‌های گردش‌کار (`.lobster`)

Lobster می‌تواند فایل‌های گردش‌کار YAML/JSON را با فیلدهای `name`، `args`، `steps`، `env`، `condition`، و `approval` اجرا کند. در فراخوانی‌های ابزار OpenClaw، `pipeline` را روی مسیر فایل تنظیم کنید.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

یادداشت‌ها:

- `stdin: $step.stdout` و `stdin: $step.json` خروجی یک مرحلهٔ قبلی را پاس می‌دهند.
- `condition` (یا `when`) می‌تواند مراحل را بر اساس `$step.approved` مشروط کند.

## نصب Lobster

گردش‌کارهای همراه Lobster درون‌فرایندی اجرا می‌شوند؛ به باینری جداگانهٔ `lobster` نیازی نیست. اجراکنندهٔ توکار همراه با Plugin Lobster ارائه می‌شود.

اگر برای توسعه یا پایپ‌لاین‌های خارجی به CLI مستقل Lobster نیاز دارید، آن را از [مخزن Lobster](https://github.com/openclaw/lobster) نصب کنید و مطمئن شوید `lobster` در `PATH` قرار دارد.

## فعال‌سازی ابزار

Lobster یک ابزار Plugin **اختیاری** است (به‌صورت پیش‌فرض فعال نیست).

پیشنهادی (افزایشی، امن):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

یا برای هر عامل:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

از استفاده از `tools.allow: ["lobster"]` خودداری کنید مگر اینکه قصد داشته باشید در حالت محدودکنندهٔ فهرست مجاز اجرا کنید.

<Note>
فهرست‌های مجاز برای plugins اختیاری انتخابی هستند. `alsoAllow` فقط ابزارهای Plugin اختیاری نام‌برده‌شده را فعال می‌کند و در عین حال مجموعهٔ عادی ابزارهای هسته را حفظ می‌کند. برای محدود کردن ابزارهای هسته، از `tools.allow` با ابزارها یا گروه‌های هسته‌ای که می‌خواهید استفاده کنید.
</Note>

## نمونه: دسته‌بندی ایمیل

بدون Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

با Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

یک پوشش JSON برمی‌گرداند (کوتاه‌شده):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

کاربر تأیید می‌کند ← ادامه:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

یک گردش‌کار. قطعی. امن.

## پارامترهای ابزار

### `run`

اجرای یک پایپ‌لاین در حالت ابزار.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

اجرای یک فایل گردش‌کار با آرگومان‌ها:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

ادامه دادن یک گردش‌کار متوقف‌شده پس از تأیید.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### ورودی‌های اختیاری

- `cwd`: دایرکتوری کاری نسبی برای پایپ‌لاین (باید داخل دایرکتوری کاری Gateway باقی بماند).
- `timeoutMs`: اگر گردش‌کار از این مدت فراتر رفت، آن را متوقف کن (پیش‌فرض: 20000).
- `maxStdoutBytes`: اگر خروجی از این اندازه فراتر رفت، گردش‌کار را متوقف کن (پیش‌فرض: 512000).
- `argsJson`: رشتهٔ JSON پاس‌داده‌شده به `lobster run --args-json` (فقط فایل‌های گردش‌کار).

## پوشش خروجی

Lobster یک پوشش JSON با یکی از سه وضعیت برمی‌گرداند:

- `ok` → با موفقیت تمام شد
- `needs_approval` → مکث کرده است؛ برای ادامه، `requiresApproval.resumeToken` لازم است
- `cancelled` → صراحتاً رد یا لغو شده است

ابزار پوشش را هم در `content` (JSON خوانا) و هم در `details` (شیء خام) ارائه می‌کند.

## تأییدها

اگر `requiresApproval` وجود دارد، متن درخواست را بررسی کنید و تصمیم بگیرید:

- `approve: true` → ادامه دادن و پیش بردن اثرات جانبی
- `approve: false` → لغو و نهایی کردن گردش‌کار

از `approve --preview-from-stdin --limit N` استفاده کنید تا بدون چسب‌های سفارشی jq/heredoc، یک پیش‌نمایش JSON به درخواست‌های تأیید پیوست شود. توکن‌های ازسرگیری اکنون فشرده هستند: Lobster وضعیت ازسرگیری گردش‌کار را زیر دایرکتوری وضعیت خود ذخیره می‌کند و یک کلید توکن کوچک برمی‌گرداند.

## OpenProse

OpenProse با Lobster به‌خوبی جفت می‌شود: از `/prose` برای ارکستره کردن آماده‌سازی چندعاملی استفاده کنید، سپس یک پایپ‌لاین Lobster را برای تأییدهای قطعی اجرا کنید. اگر یک برنامهٔ Prose به Lobster نیاز دارد، ابزار `lobster` را برای زیرعامل‌ها از طریق `tools.subagents.tools` مجاز کنید. [OpenProse](/fa/prose) را ببینید.

## ایمنی

- **فقط درون‌فرایندی محلی** - گردش‌کارها داخل فرایند Gateway اجرا می‌شوند؛ خود Plugin هیچ فراخوانی شبکه‌ای انجام نمی‌دهد.
- **بدون اسرار** - Lobster مدیریت OAuth را انجام نمی‌دهد؛ ابزارهای OpenClaw را فراخوانی می‌کند که این کار را انجام می‌دهند.
- **آگاه از سندباکس** - وقتی زمینهٔ ابزار سندباکس شده باشد غیرفعال می‌شود.
- **سخت‌سازی‌شده** - زمان‌پایان‌ها و سقف‌های خروجی توسط اجراکنندهٔ توکار اعمال می‌شوند.

## عیب‌یابی

- **`lobster timed out`** → `timeoutMs` را افزایش دهید، یا یک پایپ‌لاین طولانی را تقسیم کنید.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` را افزایش دهید یا اندازهٔ خروجی را کاهش دهید.
- **`lobster returned invalid JSON`** → مطمئن شوید پایپ‌لاین در حالت ابزار اجرا می‌شود و فقط JSON چاپ می‌کند.
- **`lobster failed`** → برای جزئیات خطای اجراکنندهٔ توکار، گزارش‌های Gateway را بررسی کنید.

## بیشتر بدانید

- [Plugins](/fa/tools/plugin)
- [تألیف ابزار Plugin](/fa/plugins/building-plugins#registering-agent-tools)

## مطالعهٔ موردی: گردش‌کارهای جامعه

یک نمونهٔ عمومی: یک CLI «مغز دوم» + پایپ‌لاین‌های Lobster که سه خزانهٔ Markdown را مدیریت می‌کنند (شخصی، شریک، مشترک). CLI برای آمار، فهرست‌های صندوق ورودی، و اسکن‌های کهنه JSON تولید می‌کند؛ Lobster آن فرمان‌ها را در گردش‌کارهایی مانند `weekly-review`، `inbox-triage`، `memory-consolidation`، و `shared-task-sync` زنجیره می‌کند، هرکدام با دروازه‌های تأیید. هوش مصنوعی وقتی در دسترس باشد قضاوت (طبقه‌بندی) را انجام می‌دهد و وقتی نباشد به قواعد قطعی برمی‌گردد.

- رشته: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- مخزن: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## مرتبط

- [اتوماسیون](/fa/automation) - زمان‌بندی گردش‌کارهای Lobster
- [نمای کلی اتوماسیون](/fa/automation) - همهٔ سازوکارهای اتوماسیون
- [نمای کلی ابزارها](/fa/tools) - همهٔ ابزارهای عامل موجود

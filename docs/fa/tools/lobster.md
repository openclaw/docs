---
read_when:
    - شما گردش‌کارهای چندمرحله‌ای تعیین‌پذیر با تأییدهای صریح می‌خواهید
    - باید یک گردش‌کار را بدون اجرای مجدد مراحل قبلی از سر بگیرید
summary: محیط اجرای گردش‌کار نوع‌دار برای OpenClaw با دروازه‌های تأیید قابل ازسرگیری.
title: خرچنگ دریایی
x-i18n:
    generated_at: "2026-04-29T23:43:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1700bcfdbcf4558cb908935834e9059221d0d26ad78ed6f9e2158f7e0b83edbd
    source_path: tools/lobster.md
    workflow: 16
---

Lobster یک پوستهٔ گردش‌کار است که به OpenClaw امکان می‌دهد توالی‌های چندمرحله‌ای ابزار را به‌صورت یک عملیات واحد و قطعی، همراه با نقاط بازرسی تأیید صریح اجرا کند.

Lobster یک لایهٔ تألیف بالاتر از کار پس‌زمینهٔ جداشده است. برای هماهنگ‌سازی جریان بالاتر از وظایف منفرد، [جریان وظیفه](/fa/automation/taskflow) (`openclaw tasks flow`) را ببینید. برای دفترکل فعالیت وظیفه، [`openclaw tasks`](/fa/automation/tasks) را ببینید.

## قلاب

دستیار شما می‌تواند ابزارهایی را بسازد که خودش را مدیریت می‌کنند. یک گردش‌کار درخواست کنید، و ۳۰ دقیقه بعد یک CLI به‌همراه پایپ‌لاین‌هایی دارید که با یک فراخوانی اجرا می‌شوند. Lobster قطعهٔ گمشده است: پایپ‌لاین‌های قطعی، تأییدهای صریح، و وضعیت قابل‌ازسرگیری.

## چرا

امروز، گردش‌کارهای پیچیده به فراخوانی‌های ابزار رفت‌وبرگشتی زیادی نیاز دارند. هر فراخوانی توکن مصرف می‌کند، و LLM باید هر گام را هماهنگ کند. Lobster این هماهنگ‌سازی را به یک runtime تایپ‌شده منتقل می‌کند:

- **یک فراخوانی به‌جای چندتا**: OpenClaw یک فراخوانی ابزار Lobster را اجرا می‌کند و یک نتیجهٔ ساختاریافته می‌گیرد.
- **تأییدها به‌صورت داخلی**: اثرات جانبی (ارسال ایمیل، ارسال نظر) گردش‌کار را تا زمان تأیید صریح متوقف می‌کنند.
- **قابل‌ازسرگیری**: گردش‌کارهای متوقف‌شده یک توکن برمی‌گردانند؛ تأیید کنید و بدون اجرای دوبارهٔ همه‌چیز ادامه دهید.

## چرا DSL به‌جای برنامه‌های ساده؟

Lobster عمداً کوچک است. هدف «یک زبان جدید» نیست، بلکه یک مشخصات پایپ‌لاین قابل‌پیش‌بینی و مناسب هوش مصنوعی است، با تأییدهای درجه‌یک و توکن‌های ازسرگیری.

- **تأیید/ازسرگیری داخلی است**: یک برنامهٔ معمولی می‌تواند از انسان درخواست کند، اما بدون اینکه خودتان آن runtime را بسازید، نمی‌تواند با یک توکن پایدار _مکث و ازسرگیری_ کند.
- **قطعیت + حسابرسی‌پذیری**: پایپ‌لاین‌ها داده هستند، پس ثبت، مقایسه، بازپخش، و مرور آن‌ها آسان است.
- **سطح محدود برای هوش مصنوعی**: یک گرامر کوچک + لوله‌کشی JSON مسیرهای کد «خلاقانه» را کاهش می‌دهد و اعتبارسنجی را واقع‌گرایانه می‌کند.
- **سیاست ایمنی تعبیه‌شده**: timeoutها، سقف‌های خروجی، بررسی‌های sandbox، و فهرست‌های مجاز توسط runtime اعمال می‌شوند، نه توسط هر اسکریپت.
- **همچنان برنامه‌پذیر**: هر گام می‌تواند هر CLI یا اسکریپتی را فراخوانی کند. اگر JS/TS می‌خواهید، فایل‌های `.lobster` را از کد تولید کنید.

## چگونه کار می‌کند

OpenClaw گردش‌کارهای Lobster را با استفاده از یک runner تعبیه‌شده **درون‌فرایندی** اجرا می‌کند. هیچ subprocess مربوط به CLI خارجی ایجاد نمی‌شود؛ موتور گردش‌کار داخل فرایند Gateway اجرا می‌شود و یک envelope JSON را مستقیم برمی‌گرداند.
اگر پایپ‌لاین برای تأیید مکث کند، ابزار یک `resumeToken` برمی‌گرداند تا بتوانید بعداً ادامه دهید.

## الگو: CLI کوچک + لوله‌های JSON + تأییدها

دستورهای کوچکی بسازید که با JSON صحبت می‌کنند، سپس آن‌ها را در یک فراخوانی Lobster زنجیره کنید. (نام‌های دستور نمونه در پایین آمده‌اند — نام‌های خودتان را جایگزین کنید.)

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

هوش مصنوعی گردش‌کار را فعال می‌کند؛ Lobster گام‌ها را اجرا می‌کند. gateهای تأیید اثرات جانبی را صریح و قابل‌حسابرسی نگه می‌دارند.

نمونه: نگاشت آیتم‌های ورودی به فراخوانی‌های ابزار:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## گام‌های LLM فقط-JSON (llm-task)

برای گردش‌کارهایی که به یک **گام ساختاریافتهٔ LLM** نیاز دارند، ابزار Plugin اختیاری
`llm-task` را فعال کنید و آن را از Lobster فراخوانی کنید. این کار گردش‌کار را
قطعی نگه می‌دارد، درحالی‌که همچنان اجازه می‌دهد با یک مدل دسته‌بندی/خلاصه‌سازی/پیش‌نویس انجام دهید.

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
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

در یک پایپ‌لاین از آن استفاده کنید:

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

برای جزئیات و گزینه‌های پیکربندی، [وظیفهٔ LLM](/fa/tools/llm-task) را ببینید.

## فایل‌های گردش‌کار (.lobster)

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

نکته‌ها:

- `stdin: $step.stdout` و `stdin: $step.json` خروجی یک گام قبلی را عبور می‌دهند.
- `condition` (یا `when`) می‌تواند گام‌ها را بر اساس `$step.approved` gate کند.

## نصب Lobster

گردش‌کارهای Lobster همراه بسته به‌صورت درون‌فرایندی اجرا می‌شوند؛ هیچ باینری جداگانهٔ `lobster` لازم نیست. runner تعبیه‌شده همراه Plugin مربوط به Lobster عرضه می‌شود.

اگر برای توسعه یا پایپ‌لاین‌های خارجی به CLI مستقل Lobster نیاز دارید، آن را از [مخزن Lobster](https://github.com/openclaw/lobster) نصب کنید و مطمئن شوید `lobster` روی `PATH` قرار دارد.

## فعال‌کردن ابزار

Lobster یک ابزار Plugin **اختیاری** است (به‌صورت پیش‌فرض فعال نیست).

توصیه‌شده (افزایشی، امن):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

یا برای هر agent:

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

از `tools.allow: ["lobster"]` استفاده نکنید، مگر اینکه قصد داشته باشید در حالت فهرست مجاز محدود اجرا کنید.

<Note>
فهرست‌های مجاز برای plugins اختیاری انتخابی هستند. اگر فهرست مجاز شما فقط نام ابزارهای Plugin را داشته باشد (مثل `lobster`)، OpenClaw ابزارهای core را فعال نگه می‌دارد. برای محدودکردن ابزارهای core، ابزارها یا گروه‌های core موردنظرتان را هم در فهرست مجاز بگنجانید.
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

یک envelope JSON برمی‌گرداند (کوتاه‌شده):

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

کاربر تأیید می‌کند → ادامه:

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

یک پایپ‌لاین را در حالت ابزار اجرا کنید.

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

ادامه‌دادن یک گردش‌کار متوقف‌شده پس از تأیید.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### ورودی‌های اختیاری

- `cwd`: پوشهٔ کاری نسبی برای پایپ‌لاین (باید داخل پوشهٔ کاری Gateway بماند).
- `timeoutMs`: اگر گردش‌کار از این مدت فراتر رفت، آن را متوقف کن (پیش‌فرض: 20000).
- `maxStdoutBytes`: اگر خروجی از این اندازه فراتر رفت، گردش‌کار را متوقف کن (پیش‌فرض: 512000).
- `argsJson`: رشتهٔ JSON که به `lobster run --args-json` پاس داده می‌شود (فقط فایل‌های گردش‌کار).

## envelope خروجی

Lobster یک envelope JSON با یکی از سه وضعیت برمی‌گرداند:

- `ok` → با موفقیت تمام شد
- `needs_approval` → مکث‌شده؛ برای ادامه `requiresApproval.resumeToken` لازم است
- `cancelled` → صراحتاً رد یا لغو شد

ابزار envelope را هم در `content` (JSON زیبا) و هم در `details` (شیء خام) ارائه می‌کند.

## تأییدها

اگر `requiresApproval` وجود دارد، prompt را بررسی کنید و تصمیم بگیرید:

- `approve: true` → ادامه و اجرای اثرات جانبی
- `approve: false` → لغو و نهایی‌کردن گردش‌کار

برای پیوست‌کردن پیش‌نمایش JSON به درخواست‌های تأیید بدون چسب jq/heredoc سفارشی، از `approve --preview-from-stdin --limit N` استفاده کنید. توکن‌های ازسرگیری اکنون فشرده هستند: Lobster وضعیت ازسرگیری گردش‌کار را زیر state dir خودش ذخیره می‌کند و یک کلید توکن کوچک برمی‌گرداند.

## OpenProse

OpenProse با Lobster به‌خوبی جفت می‌شود: از `/prose` برای هماهنگ‌سازی آماده‌سازی چند-agent استفاده کنید، سپس یک پایپ‌لاین Lobster را برای تأییدهای قطعی اجرا کنید. اگر یک برنامهٔ Prose به Lobster نیاز دارد، ابزار `lobster` را برای sub-agents از طریق `tools.subagents.tools` مجاز کنید. [OpenProse](/fa/prose) را ببینید.

## ایمنی

- **فقط درون‌فرایندی محلی** — گردش‌کارها داخل فرایند Gateway اجرا می‌شوند؛ خود Plugin هیچ فراخوانی شبکه‌ای انجام نمی‌دهد.
- **بدون secret** — Lobster OAuth را مدیریت نمی‌کند؛ ابزارهای OpenClaw را فراخوانی می‌کند که این کار را انجام می‌دهند.
- **آگاه از sandbox** — وقتی زمینهٔ ابزار sandbox شده باشد، غیرفعال می‌شود.
- **سخت‌سازی‌شده** — timeoutها و سقف‌های خروجی توسط runner تعبیه‌شده اعمال می‌شوند.

## عیب‌یابی

- **`lobster timed out`** → `timeoutMs` را افزایش دهید، یا یک پایپ‌لاین طولانی را تقسیم کنید.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` را بالا ببرید یا اندازهٔ خروجی را کاهش دهید.
- **`lobster returned invalid JSON`** → مطمئن شوید پایپ‌لاین در حالت ابزار اجرا می‌شود و فقط JSON چاپ می‌کند.
- **`lobster failed`** → برای جزئیات خطای runner تعبیه‌شده، لاگ‌های Gateway را بررسی کنید.

## بیشتر بیاموزید

- [Plugins](/fa/tools/plugin)
- [تألیف ابزار Plugin](/fa/plugins/building-plugins#registering-agent-tools)

## مطالعهٔ موردی: گردش‌کارهای جامعه

یک نمونهٔ عمومی: یک CLI «مغز دوم» + پایپ‌لاین‌های Lobster که سه vault مارک‌داون را مدیریت می‌کنند (شخصی، شریک، مشترک). CLI برای آمار، فهرست‌های inbox، و اسکن‌های stale خروجی JSON تولید می‌کند؛ Lobster آن دستورها را به گردش‌کارهایی مثل `weekly-review`، `inbox-triage`، `memory-consolidation`، و `shared-task-sync` زنجیره می‌کند، هرکدام با gateهای تأیید. هوش مصنوعی در صورت دسترس‌بودن قضاوت را انجام می‌دهد (دسته‌بندی)، و در غیر این صورت به قواعد قطعی fallback می‌کند.

- رشته: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- مخزن: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## مرتبط

- [اتوماسیون و وظایف](/fa/automation) — زمان‌بندی گردش‌کارهای Lobster
- [نمای کلی اتوماسیون](/fa/automation) — همهٔ سازوکارهای اتوماسیون
- [نمای کلی ابزارها](/fa/tools) — همهٔ ابزارهای agent در دسترس

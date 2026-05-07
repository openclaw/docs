---
read_when:
    - گردش‌کارهای چندمرحله‌ای قطعی با تأییدهای صریح می‌خواهید
    - باید یک گردش کار را بدون اجرای دوبارهٔ مراحل قبلی از سر بگیرید
summary: زمان اجرای گردش‌کار نوع‌دار برای OpenClaw با دروازه‌های تأیید قابل ازسرگیری.
title: خرچنگ دریایی
x-i18n:
    generated_at: "2026-05-07T13:32:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster یک پوستهٔ گردش‌کار است که به OpenClaw امکان می‌دهد توالی‌های چندمرحله‌ای ابزارها را به‌صورت یک عملیات واحد، قطعی و با نقاط بازرسی تأیید صریح اجرا کند.

Lobster یک لایهٔ تألیف بالاتر از کار پس‌زمینهٔ جداشده است. برای هماهنگ‌سازی جریان بالاتر از وظایف منفرد، [TaskFlow](/fa/automation/taskflow) (`openclaw tasks flow`) را ببینید. برای دفترکل فعالیت وظایف، [`openclaw tasks`](/fa/automation/tasks) را ببینید.

## قلاب

دستیار شما می‌تواند ابزارهایی را بسازد که خودش را مدیریت می‌کنند. یک گردش‌کار بخواهید، و ۳۰ دقیقه بعد یک CLI به‌همراه pipelineهایی دارید که با یک فراخوانی اجرا می‌شوند. Lobster قطعهٔ گم‌شده است: pipelineهای قطعی، تأییدهای صریح، و وضعیت قابل ازسرگیری.

## چرا

امروز، گردش‌کارهای پیچیده به فراخوانی‌های رفت‌وبرگشتی متعدد ابزار نیاز دارند. هر فراخوانی توکن مصرف می‌کند، و LLM باید هر مرحله را هماهنگ کند. Lobster این هماهنگ‌سازی را به یک runtime نوع‌دار منتقل می‌کند:

- **یک فراخوانی به‌جای چندین فراخوانی**: OpenClaw یک فراخوانی ابزار Lobster اجرا می‌کند و یک نتیجهٔ ساخت‌یافته می‌گیرد.
- **تأییدهای داخلی**: عوارض جانبی (ارسال ایمیل، ارسال نظر) گردش‌کار را تا زمان تأیید صریح متوقف می‌کنند.
- **قابل ازسرگیری**: گردش‌کارهای متوقف‌شده یک توکن برمی‌گردانند؛ تأیید کنید و بدون اجرای دوبارهٔ همه‌چیز ادامه دهید.

## چرا DSL به‌جای برنامه‌های ساده؟

Lobster عمداً کوچک است. هدف «یک زبان جدید» نیست، بلکه یک مشخصات pipeline قابل پیش‌بینی و مناسب AI با تأییدهای درجه‌اول و توکن‌های ازسرگیری است.

- **تأیید/ازسرگیری داخلی است**: یک برنامهٔ عادی می‌تواند از انسان درخواست کند، اما بدون اینکه خودتان آن runtime را اختراع کنید، نمی‌تواند با یک توکن پایدار _مکث و ازسرگیری_ کند.
- **قطعیت + قابلیت حسابرسی**: pipelineها داده هستند، بنابراین ثبت، مقایسه، بازپخش و بازبینی آن‌ها آسان است.
- **سطح محدود برای AI**: یک دستور زبان کوچک + لوله‌کشی JSON مسیرهای کد «خلاقانه» را کاهش می‌دهد و اعتبارسنجی را واقع‌بینانه می‌کند.
- **سیاست ایمنی تعبیه‌شده**: timeoutها، سقف‌های خروجی، بررسی‌های sandbox و allowlistها توسط runtime اعمال می‌شوند، نه هر اسکریپت.
- **همچنان قابل برنامه‌نویسی**: هر مرحله می‌تواند هر CLI یا اسکریپتی را فراخوانی کند. اگر JS/TS می‌خواهید، فایل‌های `.lobster` را از کد تولید کنید.

## روش کار

OpenClaw گردش‌کارهای Lobster را با استفاده از یک runner تعبیه‌شده **درون‌فرایندی** اجرا می‌کند. هیچ زیرفرایند CLI خارجی اجرا نمی‌شود؛ موتور گردش‌کار داخل فرایند gateway اجرا می‌شود و مستقیماً یک پوشش JSON برمی‌گرداند.
اگر pipeline برای تأیید مکث کند، ابزار یک `resumeToken` برمی‌گرداند تا بعداً بتوانید ادامه دهید.

## الگو: CLI کوچک + لوله‌های JSON + تأییدها

فرمان‌های کوچکی بسازید که با JSON صحبت می‌کنند، سپس آن‌ها را در یک فراخوانی Lobster واحد زنجیره کنید. (نام فرمان‌های نمونه در پایین آمده‌اند - نام‌های خودتان را جایگزین کنید.)

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

اگر pipeline درخواست تأیید کند، با توکن ادامه دهید:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI گردش‌کار را فعال می‌کند؛ Lobster مراحل را اجرا می‌کند. دروازه‌های تأیید عوارض جانبی را صریح و قابل حسابرسی نگه می‌دارند.

مثال: نگاشت آیتم‌های ورودی به فراخوانی‌های ابزار:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## مراحل LLM فقط-JSON (llm-task)

برای گردش‌کارهایی که به یک **مرحلهٔ ساخت‌یافتهٔ LLM** نیاز دارند، ابزار Plugin اختیاری
`llm-task` را فعال کنید و آن را از Lobster فراخوانی کنید. این کار گردش‌کار را
قطعی نگه می‌دارد، در حالی که همچنان اجازه می‌دهد با مدل طبقه‌بندی/خلاصه‌سازی/پیش‌نویس انجام دهید.

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

### محدودیت مهم: Lobster تعبیه‌شده در برابر `openclaw.invoke`

Plugin بسته‌بندی‌شدهٔ Lobster گردش‌کارها را **درون‌فرایندی** داخل gateway اجرا می‌کند. در آن حالت تعبیه‌شده، `openclaw.invoke` برای فراخوانی‌های تو در توی ابزار CLI در OpenClaw به‌صورت خودکار URL/auth context مربوط به gateway را به ارث نمی‌برد.

این یعنی این الگو **در حال حاضر در runner تعبیه‌شده قابل اتکا نیست**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

نمونهٔ زیر را فقط زمانی استفاده کنید که **CLI مستقل Lobster** را در محیطی اجرا می‌کنید که `openclaw.invoke` از قبل با gateway/auth context درست پیکربندی شده است.

آن را در یک pipeline مستقل CLI مربوط به Lobster استفاده کنید:

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

اگر امروز از Plugin تعبیه‌شدهٔ Lobster استفاده می‌کنید، یکی از این‌ها را ترجیح دهید:

- یک فراخوانی مستقیم ابزار `llm-task` بیرون از Lobster، یا
- مراحل غیر `openclaw.invoke` داخل pipeline مربوط به Lobster تا زمانی که یک پل تعبیه‌شدهٔ پشتیبانی‌شده اضافه شود.

برای جزئیات و گزینه‌های پیکربندی، [وظیفهٔ LLM](/fa/tools/llm-task) را ببینید.

## فایل‌های گردش‌کار (.lobster)

Lobster می‌تواند فایل‌های گردش‌کار YAML/JSON را با فیلدهای `name`، `args`، `steps`، `env`، `condition` و `approval` اجرا کند. در فراخوانی‌های ابزار OpenClaw، `pipeline` را روی مسیر فایل تنظیم کنید.

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

- `stdin: $step.stdout` و `stdin: $step.json` خروجی یک مرحلهٔ قبلی را عبور می‌دهند.
- `condition` (یا `when`) می‌تواند مراحل را بر اساس `$step.approved` کنترل کند.

## نصب Lobster

گردش‌کارهای بسته‌بندی‌شدهٔ Lobster درون‌فرایندی اجرا می‌شوند؛ به باینری جداگانهٔ `lobster` نیاز نیست. runner تعبیه‌شده همراه با Plugin مربوط به Lobster عرضه می‌شود.

اگر برای توسعه یا pipelineهای خارجی به CLI مستقل Lobster نیاز دارید، آن را از [مخزن Lobster](https://github.com/openclaw/lobster) نصب کنید و مطمئن شوید `lobster` روی `PATH` قرار دارد.

## فعال‌سازی ابزار

Lobster یک ابزار Plugin **اختیاری** است (به‌صورت پیش‌فرض فعال نیست).

پیشنهادی (افزایشی، ایمن):

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

از `tools.allow: ["lobster"]` استفاده نکنید مگر اینکه قصد داشته باشید در حالت محدودکنندهٔ allowlist اجرا کنید.

<Note>
allowlistها برای Pluginهای اختیاری opt-in هستند. `alsoAllow` فقط ابزارهای Plugin اختیاری نام‌برده را فعال می‌کند و مجموعهٔ معمول ابزارهای core را حفظ می‌کند. برای محدود کردن ابزارهای core، از `tools.allow` با ابزارها یا گروه‌های core موردنظرتان استفاده کنید.
</Note>

## مثال: دسته‌بندی ایمیل

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

کاربر تأیید می‌کند → ازسرگیری:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

یک گردش‌کار. قطعی. ایمن.

## پارامترهای ابزار

### `run`

یک pipeline را در حالت ابزار اجرا کنید.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

یک فایل گردش‌کار را با args اجرا کنید:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

یک گردش‌کار متوقف‌شده را پس از تأیید ادامه دهید.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### ورودی‌های اختیاری

- `cwd`: دایرکتوری کاری نسبی برای pipeline (باید درون دایرکتوری کاری gateway باقی بماند).
- `timeoutMs`: اگر گردش‌کار از این مدت فراتر رفت، آن را متوقف کن (پیش‌فرض: 20000).
- `maxStdoutBytes`: اگر خروجی از این اندازه فراتر رفت، گردش‌کار را متوقف کن (پیش‌فرض: 512000).
- `argsJson`: رشتهٔ JSON که به `lobster run --args-json` پاس داده می‌شود (فقط فایل‌های گردش‌کار).

## پوشش خروجی

Lobster یک پوشش JSON با یکی از سه وضعیت برمی‌گرداند:

- `ok` → با موفقیت تمام شد
- `needs_approval` → مکث شد؛ برای ازسرگیری به `requiresApproval.resumeToken` نیاز است
- `cancelled` → صریحاً رد یا لغو شد

ابزار این پوشش را هم در `content` (JSON زیبا) و هم در `details` (شیء خام) ارائه می‌کند.

## تأییدها

اگر `requiresApproval` وجود دارد، prompt را بررسی کنید و تصمیم بگیرید:

- `approve: true` → ازسرگیری و ادامهٔ عوارض جانبی
- `approve: false` → لغو و نهایی‌سازی گردش‌کار

از `approve --preview-from-stdin --limit N` برای پیوست کردن یک پیش‌نمایش JSON به درخواست‌های تأیید، بدون چسب jq/heredoc سفارشی استفاده کنید. توکن‌های ازسرگیری اکنون فشرده هستند: Lobster وضعیت ازسرگیری گردش‌کار را زیر دایرکتوری وضعیت خودش ذخیره می‌کند و یک کلید توکن کوچک برمی‌گرداند.

## OpenProse

OpenProse با Lobster خوب جفت می‌شود: از `/prose` برای هماهنگ‌سازی آماده‌سازی چندعاملی استفاده کنید، سپس یک pipeline مربوط به Lobster را برای تأییدهای قطعی اجرا کنید. اگر یک برنامهٔ Prose به Lobster نیاز دارد، ابزار `lobster` را برای sub-agentها از طریق `tools.subagents.tools` مجاز کنید. [OpenProse](/fa/prose) را ببینید.

## ایمنی

- **فقط محلی و درون‌فرایندی** - گردش‌کارها داخل فرایند gateway اجرا می‌شوند؛ خود Plugin تماس شبکه‌ای برقرار نمی‌کند.
- **بدون secrets** - Lobster مدیریت OAuth انجام نمی‌دهد؛ ابزارهای OpenClaw را فراخوانی می‌کند که این کار را انجام می‌دهند.
- **آگاه از sandbox** - وقتی tool context در sandbox باشد غیرفعال می‌شود.
- **سخت‌سازی‌شده** - timeoutها و سقف‌های خروجی توسط runner تعبیه‌شده اعمال می‌شوند.

## عیب‌یابی

- **`lobster timed out`** → `timeoutMs` را افزایش دهید، یا یک pipeline طولانی را تقسیم کنید.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` را بالا ببرید یا اندازهٔ خروجی را کاهش دهید.
- **`lobster returned invalid JSON`** → مطمئن شوید pipeline در حالت ابزار اجرا می‌شود و فقط JSON چاپ می‌کند.
- **`lobster failed`** → logهای gateway را برای جزئیات خطای runner تعبیه‌شده بررسی کنید.

## بیشتر بدانید

- [Pluginها](/fa/tools/plugin)
- [تألیف ابزار Plugin](/fa/plugins/building-plugins#registering-agent-tools)

## مطالعهٔ موردی: گردش‌کارهای جامعه

یک نمونهٔ عمومی: یک CLI «مغز دوم» + pipelineهای Lobster که سه مخزن Markdown را مدیریت می‌کنند (شخصی، شریک، مشترک). CLI برای آمار، فهرست‌های inbox و اسکن‌های کهنه JSON منتشر می‌کند؛ Lobster آن فرمان‌ها را در گردش‌کارهایی مثل `weekly-review`، `inbox-triage`، `memory-consolidation` و `shared-task-sync` زنجیره می‌کند، هرکدام با دروازه‌های تأیید. AI وقتی در دسترس باشد قضاوت (دسته‌بندی) را انجام می‌دهد و وقتی نباشد به قواعد قطعی fallback می‌کند.

- رشته: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- مخزن: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## مرتبط

- [اتوماسیون و وظایف](/fa/automation) - زمان‌بندی گردش‌کارهای Lobster
- [نمای کلی اتوماسیون](/fa/automation) - همهٔ سازوکارهای اتوماسیون
- [نمای کلی ابزارها](/fa/tools) - همهٔ ابزارهای agent در دسترس

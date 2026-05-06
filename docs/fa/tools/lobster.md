---
read_when:
    - به گردش‌کارهای چندمرحله‌ای قطعی با تأییدهای صریح نیاز دارید
    - لازم است یک گردش‌کار را بدون اجرای دوباره مراحل قبلی از سر بگیرید
summary: محیط اجرای گردش‌کار نوع‌دار برای OpenClaw با دروازه‌های تأیید قابل ازسرگیری.
title: خرچنگ دریایی
x-i18n:
    generated_at: "2026-05-06T09:47:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da8c7ca213dd4e9f85bcedabdb74da172bd3d82eceaf2c001f1a2692b01ca8
    source_path: tools/lobster.md
    workflow: 16
---

Lobster یک پوستهٔ گردش‌کار است که به OpenClaw اجازه می‌دهد دنباله‌های چندمرحله‌ای ابزارها را به‌صورت یک عملیات واحد، قطعی و همراه با نقاط کنترل تأیید صریح اجرا کند.

Lobster یک لایهٔ نگارش بالاتر از کارهای پس‌زمینهٔ جداشده است. برای هماهنگ‌سازی جریان بالاتر از وظیفه‌های منفرد، [جریان وظیفه](/fa/automation/taskflow) (`openclaw tasks flow`) را ببینید. برای دفتر ثبت فعالیت وظیفه، [`openclaw tasks`](/fa/automation/tasks) را ببینید.

## قلاب

دستیار شما می‌تواند ابزارهایی را بسازد که خودش را مدیریت می‌کنند. یک گردش‌کار درخواست کنید، و ۳۰ دقیقه بعد یک CLI به‌همراه pipelineهایی دارید که با یک فراخوانی اجرا می‌شوند. Lobster قطعهٔ گم‌شده است: pipelineهای قطعی، تأییدهای صریح، و وضعیت قابل ازسرگیری.

## چرا

امروز، گردش‌کارهای پیچیده به فراخوانی‌های رفت‌وبرگشتی زیادی از ابزارها نیاز دارند. هر فراخوانی توکن مصرف می‌کند، و LLM باید هر مرحله را هماهنگ کند. Lobster این هماهنگ‌سازی را به یک runtime نوع‌دار منتقل می‌کند:

- **یک فراخوانی به‌جای چندین فراخوانی**: OpenClaw یک فراخوانی ابزار Lobster را اجرا می‌کند و یک نتیجهٔ ساختاریافته می‌گیرد.
- **تأییدهای داخلی**: اثرات جانبی (ارسال ایمیل، ثبت نظر) گردش‌کار را تا زمان تأیید صریح متوقف می‌کنند.
- **قابل ازسرگیری**: گردش‌کارهای متوقف‌شده یک توکن برمی‌گردانند؛ تأیید کنید و بدون اجرای دوبارهٔ همه‌چیز ادامه دهید.

## چرا یک DSL به‌جای برنامه‌های ساده؟

Lobster عمداً کوچک است. هدف «یک زبان جدید» نیست، بلکه یک مشخصات pipeline قابل پیش‌بینی و مناسب برای هوش مصنوعی است که تأییدها و توکن‌های ازسرگیری را در سطح اول پشتیبانی می‌کند.

- **تأیید/ازسرگیری داخلی است**: یک برنامهٔ معمولی می‌تواند از انسان درخواست ورودی کند، اما بدون اینکه خودتان آن runtime را بسازید، نمی‌تواند با یک توکن پایدار _مکث و ازسرگیری_ کند.
- **قطعیت + حسابرسی‌پذیری**: pipelineها داده هستند، بنابراین ثبت، مقایسه، بازپخش، و بازبینی آن‌ها آسان است.
- **سطح محدود برای هوش مصنوعی**: یک دستور زبان کوچک + انتقال JSON مسیرهای کد «خلاقانه» را کاهش می‌دهد و اعتبارسنجی را واقع‌بینانه می‌کند.
- **سیاست ایمنی درونی**: timeoutها، سقف‌های خروجی، بررسی‌های sandbox، و allowlistها توسط runtime اعمال می‌شوند، نه هر اسکریپت.
- **همچنان برنامه‌پذیر**: هر مرحله می‌تواند هر CLI یا اسکریپتی را فراخوانی کند. اگر JS/TS می‌خواهید، فایل‌های `.lobster` را از کد تولید کنید.

## چگونه کار می‌کند

OpenClaw گردش‌کارهای Lobster را با استفاده از یک runner تعبیه‌شده **درون‌پردازشی** اجرا می‌کند. هیچ subprocess خارجی CLI اجرا نمی‌شود؛ موتور گردش‌کار داخل فرایند Gateway اجرا می‌شود و مستقیماً یک پاکت JSON برمی‌گرداند.
اگر pipeline برای تأیید مکث کند، ابزار یک `resumeToken` برمی‌گرداند تا بتوانید بعداً ادامه دهید.

## الگو: CLI کوچک + pipeهای JSON + تأییدها

دستورهای کوچکی بسازید که با JSON صحبت می‌کنند، سپس آن‌ها را در یک فراخوانی واحد Lobster زنجیره کنید. (نام‌های دستورهای نمونه در زیر آمده‌اند - نام‌های خودتان را جایگزین کنید.)

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

هوش مصنوعی گردش‌کار را فعال می‌کند؛ Lobster مراحل را اجرا می‌کند. دروازه‌های تأیید، اثرات جانبی را صریح و قابل حسابرسی نگه می‌دارند.

نمونه: نگاشت آیتم‌های ورودی به فراخوانی‌های ابزار:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## مراحل LLM فقط JSON (`llm-task`)

برای گردش‌کارهایی که به یک **مرحلهٔ ساختاریافتهٔ LLM** نیاز دارند، ابزار اختیاری Plugin با نام
`llm-task` را فعال کنید و آن را از Lobster فراخوانی کنید. این کار گردش‌کار را
قطعی نگه می‌دارد و هم‌زمان اجازه می‌دهد با یک مدل طبقه‌بندی/خلاصه‌سازی/پیش‌نویس انجام دهید.

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

از آن در یک pipeline استفاده کنید:

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

نکته‌ها:

- `stdin: $step.stdout` و `stdin: $step.json` خروجی یک مرحلهٔ قبلی را ارسال می‌کنند.
- `condition` (یا `when`) می‌تواند مراحل را بر اساس `$step.approved` کنترل کند.

## نصب Lobster

گردش‌کارهای همراه Lobster به‌صورت درون‌پردازشی اجرا می‌شوند؛ هیچ باینری جداگانهٔ `lobster` لازم نیست. runner تعبیه‌شده همراه با Plugin مربوط به Lobster ارائه می‌شود.

اگر برای توسعه یا pipelineهای خارجی به CLI مستقل Lobster نیاز دارید، آن را از [مخزن Lobster](https://github.com/openclaw/lobster) نصب کنید و مطمئن شوید `lobster` در `PATH` قرار دارد.

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

از استفاده از `tools.allow: ["lobster"]` پرهیز کنید، مگر اینکه قصد داشته باشید در حالت allowlist محدود اجرا کنید.

<Note>
allowlistها برای Pluginهای اختیاری به‌صورت opt-in هستند. `alsoAllow` فقط ابزارهای Plugin اختیاری نام‌برده را فعال می‌کند و مجموعهٔ عادی ابزارهای هسته را حفظ می‌کند. برای محدود کردن ابزارهای هسته، از `tools.allow` همراه با ابزارها یا گروه‌های هسته‌ای که می‌خواهید استفاده کنید.
</Note>

## نمونه: تریاژ ایمیل

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

یک پاکت JSON برمی‌گرداند (کوتاه‌شده):

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

کاربر تأیید می‌کند ← ازسرگیری:

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

اجرای یک pipeline در حالت ابزار.

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

- `cwd`: مسیر کاری نسبی برای pipeline (باید داخل مسیر کاری Gateway باقی بماند).
- `timeoutMs`: اگر گردش‌کار از این مدت بیشتر شود، آن را متوقف کن (پیش‌فرض: 20000).
- `maxStdoutBytes`: اگر خروجی از این اندازه بیشتر شود، گردش‌کار را متوقف کن (پیش‌فرض: 512000).
- `argsJson`: رشتهٔ JSON ارسال‌شده به `lobster run --args-json` (فقط فایل‌های گردش‌کار).

## پاکت خروجی

Lobster یک پاکت JSON با یکی از سه وضعیت برمی‌گرداند:

- `ok` → با موفقیت تمام شد
- `needs_approval` → مکث کرده است؛ برای ازسرگیری به `requiresApproval.resumeToken` نیاز است
- `cancelled` → صراحتاً رد یا لغو شد

ابزار، پاکت را هم در `content` (JSON خوانا) و هم در `details` (شیء خام) نمایش می‌دهد.

## تأییدها

اگر `requiresApproval` وجود دارد، prompt را بررسی کنید و تصمیم بگیرید:

- `approve: true` → ازسرگیری و ادامهٔ اثرات جانبی
- `approve: false` → لغو و نهایی‌سازی گردش‌کار

از `approve --preview-from-stdin --limit N` استفاده کنید تا بدون چسب jq/heredoc سفارشی، یک پیش‌نمایش JSON به درخواست‌های تأیید پیوست شود. توکن‌های ازسرگیری اکنون فشرده هستند: Lobster وضعیت ازسرگیری گردش‌کار را زیر دایرکتوری وضعیت خودش ذخیره می‌کند و یک کلید توکن کوچک برمی‌گرداند.

## OpenProse

OpenProse با Lobster خوب جفت می‌شود: از `/prose` برای هماهنگ‌سازی آماده‌سازی چندعاملی استفاده کنید، سپس برای تأییدهای قطعی یک pipeline Lobster را اجرا کنید. اگر یک برنامهٔ Prose به Lobster نیاز دارد، ابزار `lobster` را برای sub-agentها از طریق `tools.subagents.tools` مجاز کنید. [OpenProse](/fa/prose) را ببینید.

## ایمنی

- **فقط درون‌پردازشی محلی** - گردش‌کارها داخل فرایند Gateway اجرا می‌شوند؛ هیچ فراخوانی شبکه‌ای از خود Plugin انجام نمی‌شود.
- **بدون secrets** - Lobster OAuth را مدیریت نمی‌کند؛ ابزارهای OpenClaw را فراخوانی می‌کند که این کار را انجام می‌دهند.
- **آگاه از sandbox** - وقتی زمینهٔ ابزار sandbox شده باشد، غیرفعال می‌شود.
- **مستحکم‌شده** - timeoutها و سقف‌های خروجی توسط runner تعبیه‌شده اعمال می‌شوند.

## عیب‌یابی

- **`lobster timed out`** → `timeoutMs` را افزایش دهید، یا یک pipeline طولانی را تقسیم کنید.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` را بالا ببرید یا اندازهٔ خروجی را کاهش دهید.
- **`lobster returned invalid JSON`** → مطمئن شوید pipeline در حالت ابزار اجرا می‌شود و فقط JSON چاپ می‌کند.
- **`lobster failed`** → برای جزئیات خطای runner تعبیه‌شده، logهای Gateway را بررسی کنید.

## بیشتر بدانید

- [Pluginها](/fa/tools/plugin)
- [نگارش ابزار Plugin](/fa/plugins/building-plugins#registering-agent-tools)

## مطالعهٔ موردی: گردش‌کارهای جامعه

یک نمونهٔ عمومی: یک CLI «مغز دوم» + pipelineهای Lobster که سه مخزن Markdown را مدیریت می‌کنند (شخصی، شریک، مشترک). CLI برای آمار، فهرست‌های inbox، و scanهای قدیمی JSON منتشر می‌کند؛ Lobster این دستورها را به گردش‌کارهایی مانند `weekly-review`، `inbox-triage`، `memory-consolidation`، و `shared-task-sync` زنجیره می‌کند، که هرکدام دروازه‌های تأیید دارند. هوش مصنوعی وقتی در دسترس باشد قضاوت (دسته‌بندی) را انجام می‌دهد و وقتی در دسترس نباشد به قواعد قطعی fallback می‌کند.

- رشته گفتگو: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- مخزن: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## مرتبط

- [اتوماسیون و وظیفه‌ها](/fa/automation) - زمان‌بندی گردش‌کارهای Lobster
- [نمای کلی اتوماسیون](/fa/automation) - همهٔ سازوکارهای اتوماسیون
- [نمای کلی ابزارها](/fa/tools) - همهٔ ابزارهای در دسترس agent

---
read_when:
    - به گردش‌کارهای چندمرحله‌ای قطعی با تأییدهای صریح نیاز دارید
    - باید یک گردش‌کار را بدون اجرای دوبارهٔ مراحل قبلی از سر بگیرید
summary: محیط اجرای گردش‌کار نوع‌دار برای OpenClaw با گیت‌های تأیید قابل ازسرگیری.
title: خرچنگ دریایی
x-i18n:
    generated_at: "2026-05-04T02:27:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67f5145b11f2d6e07e9d78a44a389ae5f236c85ec8c287ab0f217a18b622ece0
    source_path: tools/lobster.md
    workflow: 16
---

Lobster یک پوستهٔ گردش‌کار است که به OpenClaw امکان می‌دهد توالی‌های چندمرحله‌ای ابزار را به‌صورت یک عملیات واحد، قطعی و با نقاط بازرسی تأیید صریح اجرا کند.

Lobster یک لایهٔ نگارش بالاتر از کار پس‌زمینهٔ جداشده است. برای هماهنگ‌سازی جریان بالاتر از وظایف منفرد، [TaskFlow](/fa/automation/taskflow) (`openclaw tasks flow`) را ببینید. برای دفترکل فعالیت وظیفه، [`openclaw tasks`](/fa/automation/tasks) را ببینید.

## Hook

دستیار شما می‌تواند ابزارهایی بسازد که خودش را مدیریت می‌کنند. یک گردش‌کار درخواست کنید و ۳۰ دقیقه بعد یک CLI به‌همراه pipelineهایی دارید که با یک فراخوانی اجرا می‌شوند. Lobster همان قطعهٔ گمشده است: pipelineهای قطعی، تأییدهای صریح، و وضعیت قابل ازسرگیری.

## چرا

امروز، گردش‌کارهای پیچیده به فراخوانی‌های رفت‌وبرگشتی متعدد ابزار نیاز دارند. هر فراخوانی توکن مصرف می‌کند و LLM باید هر مرحله را هماهنگ کند. Lobster این هماهنگ‌سازی را به یک runtime نوع‌دار منتقل می‌کند:

- **یک فراخوانی به‌جای چندین فراخوانی**: OpenClaw یک فراخوانی ابزار Lobster را اجرا می‌کند و یک نتیجهٔ ساختاریافته می‌گیرد.
- **تأییدها درون‌ساخته‌اند**: اثرات جانبی (ارسال ایمیل، ثبت نظر) گردش‌کار را تا زمان تأیید صریح متوقف می‌کنند.
- **قابل ازسرگیری**: گردش‌کارهای متوقف‌شده یک token برمی‌گردانند؛ تأیید کنید و بدون اجرای دوبارهٔ همه‌چیز ادامه دهید.

## چرا به‌جای برنامه‌های ساده از DSL استفاده شود؟

Lobster عمداً کوچک است. هدف «یک زبان جدید» نیست، بلکه یک مشخصات pipeline قابل پیش‌بینی و مناسب AI با تأییدهای درجه‌یک و tokenهای ازسرگیری است.

- **تأیید/ازسرگیری درون‌ساخته است**: یک برنامهٔ عادی می‌تواند از انسان درخواست کند، اما نمی‌تواند بدون اینکه خودتان آن runtime را بسازید، با یک token پایدار _متوقف و ازسرگرفته_ شود.
- **قطعیت + قابلیت حسابرسی**: pipelineها داده هستند، پس ثبت، مقایسه، بازپخش و بازبینی آن‌ها آسان است.
- **سطح محدود برای AI**: یک دستور زبان کوچک + لوله‌کشی JSON مسیرهای کد «خلاقانه» را کاهش می‌دهد و اعتبارسنجی را واقع‌بینانه می‌کند.
- **سیاست ایمنی درونی**: timeoutها، سقف‌های خروجی، بررسی‌های sandbox، و allowlistها توسط runtime اعمال می‌شوند، نه هر script.
- **همچنان برنامه‌پذیر**: هر مرحله می‌تواند هر CLI یا script را فراخوانی کند. اگر JS/TS می‌خواهید، فایل‌های `.lobster` را از کد تولید کنید.

## نحوهٔ کار

OpenClaw گردش‌کارهای Lobster را با استفاده از یک runner جاسازی‌شده **درون‌فرایندی** اجرا می‌کند. هیچ subprocess خارجی CLI اجرا نمی‌شود؛ موتور گردش‌کار داخل فرایند gateway اجرا می‌شود و یک envelope JSON را مستقیم برمی‌گرداند.
اگر pipeline برای تأیید مکث کند، ابزار یک `resumeToken` برمی‌گرداند تا بتوانید بعداً ادامه دهید.

## الگو: CLI کوچک + لوله‌های JSON + تأییدها

دستورهای کوچکی بسازید که با JSON صحبت کنند، سپس آن‌ها را در یک فراخوانی Lobster زنجیره کنید. (نام‌های نمونهٔ دستور در زیر آمده‌اند — با نام‌های خودتان جایگزین کنید.)

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

اگر pipeline درخواست تأیید کرد، با token ادامه دهید:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI گردش‌کار را فعال می‌کند؛ Lobster مراحل را اجرا می‌کند. gateهای تأیید اثرات جانبی را صریح و قابل حسابرسی نگه می‌دارند.

نمونه: نگاشت آیتم‌های ورودی به فراخوانی‌های ابزار:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## مراحل فقط-JSON LLM (llm-task)

برای گردش‌کارهایی که به یک **مرحلهٔ ساختاریافتهٔ LLM** نیاز دارند، ابزار اختیاری Plugin
`llm-task` را فعال کنید و آن را از Lobster فراخوانی کنید. این کار گردش‌کار را
قطعی نگه می‌دارد و همچنان به شما اجازه می‌دهد با یک مدل طبقه‌بندی/خلاصه‌سازی/پیش‌نویس انجام دهید.

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

آن را در یک pipeline استفاده کنید:

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

برای جزئیات و گزینه‌های پیکربندی، [LLM Task](/fa/tools/llm-task) را ببینید.

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

نکات:

- `stdin: $step.stdout` و `stdin: $step.json` خروجی مرحلهٔ قبلی را عبور می‌دهند.
- `condition` (یا `when`) می‌تواند مراحل را بر اساس `$step.approved` gate کند.

## نصب Lobster

گردش‌کارهای Lobster بسته‌بندی‌شده درون‌فرایندی اجرا می‌شوند؛ به binary جداگانهٔ `lobster` نیاز نیست. runner جاسازی‌شده همراه Plugin Lobster ارائه می‌شود.

اگر برای توسعه یا pipelineهای خارجی به CLI مستقل Lobster نیاز دارید، آن را از [repo مربوط به Lobster](https://github.com/openclaw/lobster) نصب کنید و مطمئن شوید `lobster` در `PATH` قرار دارد.

## فعال‌سازی ابزار

Lobster یک ابزار Plugin **اختیاری** است (به‌صورت پیش‌فرض فعال نیست).

توصیه‌شده (افزایشی، ایمن):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

یا به‌ازای هر agent:

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

از `tools.allow: ["lobster"]` استفاده نکنید مگر اینکه قصد داشته باشید در حالت allowlist محدودکننده اجرا کنید.

<Note>
allowlistها برای Pluginهای اختیاری opt-in هستند. `alsoAllow` فقط ابزارهای Plugin اختیاری نام‌برده را فعال می‌کند و مجموعهٔ معمول ابزارهای core را حفظ می‌کند. برای محدود کردن ابزارهای core، از `tools.allow` همراه ابزارها یا گروه‌های core موردنظر خود استفاده کنید.
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

اجرای یک فایل گردش‌کار با args:

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

- `cwd`: دایرکتوری کاری نسبی برای pipeline (باید درون دایرکتوری کاری gateway باقی بماند).
- `timeoutMs`: اگر گردش‌کار از این مدت بیشتر شود، آن را abort می‌کند (پیش‌فرض: 20000).
- `maxStdoutBytes`: اگر خروجی از این اندازه بیشتر شود، گردش‌کار را abort می‌کند (پیش‌فرض: 512000).
- `argsJson`: رشتهٔ JSON که به `lobster run --args-json` پاس داده می‌شود (فقط فایل‌های گردش‌کار).

## envelope خروجی

Lobster یک envelope JSON با یکی از سه وضعیت برمی‌گرداند:

- `ok` → با موفقیت پایان یافت
- `needs_approval` → مکث‌شده؛ برای ازسرگیری به `requiresApproval.resumeToken` نیاز است
- `cancelled` → صریحاً رد یا لغو شد

ابزار envelope را هم در `content` (JSON زیبا) و هم در `details` (شیء خام) ارائه می‌کند.

## تأییدها

اگر `requiresApproval` وجود دارد، prompt را بررسی کنید و تصمیم بگیرید:

- `approve: true` → ازسرگیری و ادامهٔ اثرات جانبی
- `approve: false` → لغو و نهایی‌سازی گردش‌کار

برای پیوست کردن پیش‌نمایش JSON به درخواست‌های تأیید بدون glue سفارشی jq/heredoc، از `approve --preview-from-stdin --limit N` استفاده کنید. tokenهای ازسرگیری اکنون فشرده‌اند: Lobster وضعیت ازسرگیری گردش‌کار را زیر state dir خودش ذخیره می‌کند و یک کلید token کوچک برمی‌گرداند.

## OpenProse

OpenProse با Lobster خوب جفت می‌شود: از `/prose` برای هماهنگ‌سازی آماده‌سازی چند-agent استفاده کنید، سپس یک pipeline Lobster را برای تأییدهای قطعی اجرا کنید. اگر یک برنامهٔ Prose به Lobster نیاز دارد، ابزار `lobster` را برای sub-agentها از طریق `tools.subagents.tools` مجاز کنید. [OpenProse](/fa/prose) را ببینید.

## ایمنی

- **فقط محلی و درون‌فرایندی** — گردش‌کارها داخل فرایند gateway اجرا می‌شوند؛ خود Plugin هیچ فراخوانی شبکه‌ای انجام نمی‌دهد.
- **بدون رازها** — Lobster OAuth را مدیریت نمی‌کند؛ ابزارهای OpenClaw را فراخوانی می‌کند که این کار را انجام می‌دهند.
- **آگاه از sandbox** — وقتی context ابزار sandbox شده باشد غیرفعال است.
- **سخت‌سازی‌شده** — timeoutها و سقف‌های خروجی توسط runner جاسازی‌شده اعمال می‌شوند.

## عیب‌یابی

- **`lobster timed out`** → `timeoutMs` را افزایش دهید یا یک pipeline طولانی را تقسیم کنید.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` را افزایش دهید یا اندازهٔ خروجی را کاهش دهید.
- **`lobster returned invalid JSON`** → مطمئن شوید pipeline در حالت ابزار اجرا می‌شود و فقط JSON چاپ می‌کند.
- **`lobster failed`** → برای جزئیات خطای runner جاسازی‌شده، لاگ‌های gateway را بررسی کنید.

## بیشتر بیاموزید

- [Plugins](/fa/tools/plugin)
- [نگارش ابزار Plugin](/fa/plugins/building-plugins#registering-agent-tools)

## مطالعهٔ موردی: گردش‌کارهای جامعه

یک نمونهٔ عمومی: یک CLI «مغز دوم» + pipelineهای Lobster که سه خزانهٔ Markdown را مدیریت می‌کنند (شخصی، شریک، مشترک). CLI برای آمارها، فهرست‌های inbox و اسکن‌های stale خروجی JSON منتشر می‌کند؛ Lobster این دستورها را در گردش‌کارهایی مانند `weekly-review`، `inbox-triage`، `memory-consolidation` و `shared-task-sync` زنجیره می‌کند که هرکدام gateهای تأیید دارند. AI وقتی در دسترس باشد قضاوت (دسته‌بندی) را انجام می‌دهد و وقتی نباشد به قواعد قطعی fallback می‌کند.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## مرتبط

- [اتوماسیون و وظایف](/fa/automation) — زمان‌بندی گردش‌کارهای Lobster
- [نمای کلی اتوماسیون](/fa/automation) — همهٔ سازوکارهای اتوماسیون
- [نمای کلی ابزارها](/fa/tools) — همهٔ ابزارهای agent موجود

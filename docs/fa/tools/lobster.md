---
read_when:
    - شما گردش‌های کاری چندمرحله‌ایِ قطعی با تأییدهای صریح می‌خواهید
    - باید یک گردش‌کار را بدون اجرای دوبارهٔ مراحل قبلی از سر بگیرید
summary: زمان‌اجرای گردش‌کار نوع‌دار برای OpenClaw با دروازه‌های تأیید ازسرگرفتنی.
title: خرچنگ دریایی
x-i18n:
    generated_at: "2026-07-12T10:58:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster خط‌لوله‌های چندمرحله‌ای ابزار را به‌صورت یک فراخوانی قطعی ابزار، با
نقاط کنترل صریح تأیید و توکن‌های ازسرگیری اجرا می‌کند. این ابزار یک لایه بالاتر از
کارهای پس‌زمینه جداشده قرار دارد: برای هماهنگ‌سازی جریان‌ها میان تعداد زیادی وظیفه جداشده،
به [جریان وظیفه](/fa/automation/taskflow) (`openclaw tasks flow`) مراجعه کنید؛ برای دفتر ثبت
فعالیت وظایف، [وظایف پس‌زمینه](/fa/automation/tasks) را ببینید.

## چرا

بدون Lobster، یک کار چندمرحله‌ای مستلزم فراخوانی‌های رفت‌وبرگشتی متعدد ابزار است و
مدل باید هر مرحله را هماهنگ کند. Lobster این هماهنگ‌سازی را به یک محیط اجرای
نوع‌دار منتقل می‌کند:

- **یک فراخوانی به‌جای چند فراخوانی**: یک فراخوانی ابزار Lobster نتیجه‌ای ساخت‌یافته
  برای کل خط‌لوله برمی‌گرداند.
- **تأییدهای داخلی**: اثرات جانبی (ارسال، انتشار، حذف) گردش‌کار را تا زمان
  تأیید صریح متوقف می‌کنند.
- **قابل ازسرگیری**: گردش‌کار متوقف‌شده یک توکن برمی‌گرداند؛ آن را تأیید و ازسرگیری کنید، بدون
  اجرای دوباره مراحل قبلی.

Lobster به‌جای یک زبان اسکریپت‌نویسی عمومی، یک DSL کوچک و محدود است:
تأیید/ازسرگیری یک سازوکار اولیه داخلی و ماندگار است؛ خط‌لوله‌ها داده هستند (برای
ثبت، مقایسه تفاوت‌ها، بازپخش و بازبینی آسان‌اند)؛ دستور زبان کوچک، مسیرهای کد «خلاقانه» را محدود می‌کند تا
اعتبارسنجی واقع‌بینانه باقی بماند؛ مهلت‌های زمانی، سقف‌های خروجی، بررسی‌های محیط ایزوله و
فهرست‌های مجاز را محیط اجرا اعمال می‌کند، نه هر اسکریپت. هر مرحله همچنان می‌تواند
هر CLI یا اسکریپتی را فراخوانی کند — اگر زبان تألیف غنی‌تری می‌خواهید،
فایل‌های `.lobster` را با ابزارهای دیگر تولید کنید.

بدون Lobster، بررسی دوره‌ای ایمیل به این صورت است:

```text
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

با Lobster، همان کار یک فراخوانی است که برای تأیید متوقف و سپس ازسرگیری می‌شود:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

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

## نحوه کار

OpenClaw گردش‌کارهای Lobster را با استفاده از بسته همراه
`@clawdbot/lobster` به‌عنوان اجراکننده تعبیه‌شده، **درون‌فرایندی** اجرا می‌کند. هیچ زیرفرایند خارجی
`lobster` ایجاد نمی‌شود؛ فراخوانی ابزار مستقیماً یک پوشش JSON برمی‌گرداند. اگر
خط‌لوله برای تأیید متوقف شود، پوشش دارای یک توکن ازسرگیری (یا شناسه کوتاه
تأیید) خواهد بود تا بتوانید بعداً ادامه دهید.

## فعال‌سازی

Lobster یک ابزار Plugin **اختیاری** است و به‌طور پیش‌فرض فعال نیست. این ابزار
به‌صورت همراه ارائه می‌شود، بنابراین به مرحله نصب جداگانه نیاز نیست — فقط ابزار را مجاز کنید:

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

<Note>
`alsoAllow` ابزار `lobster` را بدون محدودکردن سایر ابزارهای اصلی، به نمایه فعال ابزار
اضافه می‌کند. فقط زمانی از `tools.allow` استفاده کنید که به‌جای آن حالت فهرست مجاز
محدودکننده می‌خواهید.
</Note>

این ابزار در زمینه‌های ابزارِ محیط ایزوله به‌طور کامل غیرفعال است.

اگر برای توسعه یا خط‌لوله‌های خارجی (خارج از اجراکننده تعبیه‌شده Gateway) به
CLI مستقل Lobster نیاز دارید، آن را از
[مخزن Lobster](https://github.com/openclaw/lobster) نصب کنید و `lobster` را در
`PATH` قرار دهید.

## الگو: CLI کوچک + لوله‌های JSON + تأییدها

فرمان‌های کوچکی بسازید که با JSON ارتباط برقرار کنند، سپس آن‌ها را در یک فراخوانی Lobster
زنجیره کنید. (نام فرمان‌های زیر نمونه هستند — آن‌ها را با فرمان‌های خودتان جایگزین کنید.)

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

اگر خط‌لوله درخواست تأیید کرد، با توکن آن را ازسرگیری کنید:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

نمونه: نگاشت اقلام ورودی به فراخوانی‌های ابزار:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## مراحل LLM فقط با JSON (llm-task)

برای یک **مرحله ساخت‌یافته LLM** درون گردش‌کار، ابزار Plugin اختیاری
`llm-task` را فعال و آن را از Lobster فراخوانی کنید:

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

Plugin همراه Lobster گردش‌کارها را به‌صورت **درون‌فرایندی** در Gateway اجرا می‌کند.
در این حالت تعبیه‌شده، `openclaw.invoke` زمینه نشانی اینترنتی/احراز هویت Gateway را برای
فراخوانی‌های تودرتوی ابزار CLI متعلق به OpenClaw به‌طور خودکار به ارث نمی‌برد.

این یعنی الگوی زیر **در حال حاضر در اجراکننده تعبیه‌شده قابل‌اعتماد نیست**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

فقط زمانی از نمونه زیر استفاده کنید که **CLI مستقل Lobster** را در محیطی
اجرا می‌کنید که `openclaw.invoke` از قبل با زمینه صحیح Gateway/احراز هویت
پیکربندی شده است.

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

اگر امروز از Plugin تعبیه‌شده Lobster استفاده می‌کنید، یکی از این موارد را ترجیح دهید:

- فراخوانی مستقیم ابزار `llm-task` خارج از Lobster، یا
- مراحل غیر `openclaw.invoke` درون خط‌لوله Lobster تا زمانی که یک پل تعبیه‌شده
  پشتیبانی‌شده اضافه شود.

برای جزئیات و گزینه‌های پیکربندی، [وظیفه LLM](/fa/tools/llm-task) را ببینید.

## فایل‌های گردش‌کار (.lobster)

Lobster می‌تواند فایل‌های گردش‌کار YAML/JSON دارای فیلدهای `name`، `args`، `steps`، `env`،
`condition` و `approval` را اجرا کند. در فراخوانی ابزار، `pipeline` را روی مسیر فایل
تنظیم کنید.

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

- `stdin: $step.stdout` و `stdin: $step.json` خروجی مرحله قبلی را عبور می‌دهند.
- `condition` (یا `when`) می‌تواند مراحل را بر اساس `$step.approved` مشروط کند.

## پارامترهای ابزار

### `run`

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

| فیلد             | پیش‌فرض     | نکته‌ها                                                                                                                |
| ---------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| `pipeline`       | الزامی      | رشته خط‌لوله درون‌خطی، یا مسیری با پسوند `.lobster`/`.yaml`/`.yml`/`.json` برای فایل گردش‌کار.                         |
| `cwd`            | cwd مربوط به Gateway | پوشه کاری نسبی؛ باید درون پوشه کاری Gateway حل شود (مسیرهای مطلق رد می‌شوند).                                 |
| `timeoutMs`      | `20000`     | در صورت عبور از این مقدار، اجرا را متوقف می‌کند.                                                                       |
| `maxStdoutBytes` | `512000`    | اگر stdout یا stderr ضبط‌شده از این اندازه فراتر رود، اجرا را متوقف می‌کند.                                            |
| `argsJson`       | -           | رشته JSON آرگومان‌ها برای فایل گردش‌کار (برای خط‌لوله‌های درون‌خطی نادیده گرفته می‌شود).                                |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` یا `token` (توکن کامل ازسرگیری از `requiresApproval`) یا
`approvalId` (شناسه کوتاه از همان شیء) را می‌پذیرد — از هرکدام که اجرای
متوقف‌شده برگردانده است استفاده کنید. `approve` الزامی است.

### حالت مدیریت‌شده جریان وظیفه

ارسال `flowControllerId` و `flowGoal` در `run` (یا `flowId` و
`flowExpectedRevision` در `resume`) فراخوانی را به‌جای بازگرداندن یک
پوشش ساده، از طریق API مدیریت‌شده [جریان وظیفه](/fa/automation/taskflow) در محیط اجرای Plugin
هدایت می‌کند: OpenClaw یک رکورد ماندگار جریان ایجاد یا ازسرگیری می‌کند، پوشش
Lobster را روی آن اعمال می‌کند (`waiting` هنگام تأیید، `succeeded`/`failed` هنگام
تکمیل) و `{ ok, envelope, flow, mutation }` را برمی‌گرداند. این حالت به یک
محیط اجرای مقیدشده جریان وظیفه نیاز دارد و برای کد Plugin/کنترل‌گری در نظر گرفته شده است که به
حالت ماندگار جریان در راه‌اندازی‌های مجدد Gateway نیاز دارد، نه استفاده موقتی معمول عامل.

## پوشش خروجی

Lobster یک پوشش JSON با یکی از سه وضعیت برمی‌گرداند:

- `ok` — با موفقیت پایان یافت
- `needs_approval` — متوقف شده است؛ `requiresApproval` دارای یک `resumeToken` و یک
  `approvalId` کوتاه است که هرکدام می‌توانند اجرا را ازسرگیری کنند
- `cancelled` — به‌طور صریح رد یا لغو شده است

ابزار، پوشش را هم در `content` (JSON آراسته) و هم در `details`
(شیء خام) ارائه می‌کند.

## تأییدها

اگر `requiresApproval` وجود دارد، درخواست را بررسی و تصمیم‌گیری کنید:

- `approve: true` — ازسرگیری و ادامه اثرات جانبی
- `approve: false` — لغو و نهایی‌سازی گردش‌کار

برای پیوست‌کردن پیش‌نمایش JSON به درخواست‌های تأیید بدون چسب سفارشی jq/heredoc،
از `approve --preview-from-stdin --limit N` استفاده کنید. حالت ازسرگیری به‌صورت
فایل‌های کوچک JSON در پوشه وضعیت Lobster ذخیره می‌شود (پیش‌فرض
`~/.lobster/state` است؛ با `LOBSTER_STATE_DIR` تغییر دهید)؛ خود توکن فقط یک
اشاره‌گر به آن وضعیت را رمزگذاری می‌کند، نه کل وضعیت خط‌لوله را.

## OpenProse

OpenProse با Lobster به‌خوبی کار می‌کند: از `/prose` برای هماهنگ‌سازی آماده‌سازی
چندعاملی استفاده کنید، سپس یک خط‌لوله Lobster را برای تأییدهای قطعی اجرا کنید. اگر یک
برنامه Prose به Lobster نیاز دارد، ابزار `lobster` را برای زیرعامل‌ها از طریق
`tools.subagents.tools` مجاز کنید. [OpenProse](/fa/prose) را ببینید.

## ایمنی

- **فقط درون‌فرایندی و محلی** — گردش‌کارها درون فرایند Gateway اجرا می‌شوند؛ خود
  Plugin هیچ فراخوانی شبکه‌ای انجام نمی‌دهد.
- **بدون اسرار** — Lobster، OAuth را مدیریت نمی‌کند؛ ابزارهای OpenClaw را فراخوانی می‌کند که
  این کار را انجام می‌دهند.
- **آگاه از محیط ایزوله** — وقتی زمینه ابزار در محیط ایزوله باشد، غیرفعال می‌شود.
- **سخت‌سازی‌شده** — مهلت‌های زمانی و سقف‌های خروجی را اجراکننده تعبیه‌شده اعمال می‌کند.

## عیب‌یابی

| خطا                                                          | علت / راه‌حل                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `lobster runtime timed out`                                  | خط‌لوله از `timeoutMs` فراتر رفت. آن را افزایش دهید یا خط‌لوله را تقسیم کنید.                    |
| `lobster stdout exceeded maxStdoutBytes` (یا `stderr`)       | خروجی ضبط‌شده از سقف فراتر رفت. `maxStdoutBytes` را افزایش یا خروجی را کاهش دهید.                |
| `run --args-json must be valid JSON`                         | تجزیه `argsJson` (در اجرای فایل گردش‌کار) ناموفق بود. رشته JSON را اصلاح کنید.                   |
| `lobster runtime failed` (یا پیام دیگری از `runtime_error`) | محیط اجرای تعبیه‌شده یک پوشش خطا برگرداند. برای جزئیات، گزارش‌های Gateway را بررسی کنید.         |

## اطلاعات بیشتر

- [Pluginها](/fa/tools/plugin)
- [تألیف ابزار Plugin](/fa/plugins/building-plugins#registering-agent-tools)

## مطالعه موردی: گردش‌کارهای جامعه کاربری

یک نمونهٔ عمومی: یک CLI «مغز دوم» به‌همراه پایپ‌لاین‌های Lobster که سه مخزن Markdown (شخصی، شریک و مشترک) را مدیریت می‌کنند. CLI برای آمار، فهرست‌های صندوق ورودی و اسکن موارد قدیمی، JSON تولید می‌کند؛ Lobster این فرمان‌ها را در گردش‌کارهایی مانند `weekly-review`، `inbox-triage`، `memory-consolidation` و `shared-task-sync` زنجیره می‌کند که هرکدام دارای دروازه‌های تأیید هستند. در صورت دسترس‌بودن هوش مصنوعی، قضاوت (دسته‌بندی) را انجام می‌دهد و در غیر این صورت به قواعد قطعی بازمی‌گردد.

- رشته‌پست: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- مخزن: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## مرتبط

- [خودکارسازی](/fa/automation) - همهٔ سازوکارهای خودکارسازی
- [نمای کلی ابزارها](/fa/tools) - همهٔ ابزارهای عامل موجود

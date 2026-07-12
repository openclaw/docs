---
read_when:
    - برای /new، /reset، /stop و رویدادهای چرخه عمر عامل، خودکارسازی رویدادمحور می‌خواهید
    - می‌خواهید هوک‌ها را بسازید، نصب کنید یا اشکال‌زدایی کنید
summary: 'هوک‌ها: خودکارسازی رویدادمحور برای فرمان‌ها و رویدادهای چرخهٔ حیات'
title: هوک‌ها
x-i18n:
    generated_at: "2026-07-12T09:34:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

هوک‌ها اسکریپت‌های کوچکی هستند که هنگام رخ دادن رویدادهای عامل درون Gateway اجرا می‌شوند: فرمان‌هایی مانند `/new`، `/reset`، `/stop`، Compaction نشست، چرخهٔ حیات Gateway و جریان پیام. آن‌ها از دایرکتوری‌ها کشف و با `openclaw hooks` مدیریت می‌شوند. Gateway هوک‌های داخلی را تنها پس از فعال‌سازی هوک‌ها یا پیکربندی دست‌کم یک ورودی هوک، بستهٔ هوک، کنترل‌گر قدیمی یا دایرکتوری اضافی هوک بارگذاری می‌کند.

در OpenClaw دو نوع هوک وجود دارد:

- **هوک‌های داخلی** (این صفحه): هنگام رخ دادن رویدادهای عامل درون Gateway اجرا می‌شوند.
- **Webhookها**: نقاط پایانی HTTP خارجی که به سامانه‌های دیگر امکان می‌دهند کارهایی را در OpenClaw راه‌اندازی کنند. [Webhookها](/fa/automation/cron-jobs#webhooks) را ببینید.

هوک‌ها همچنین می‌توانند درون Pluginها بسته‌بندی شوند. `openclaw hooks list` هم هوک‌های مستقل و هم هوک‌های مدیریت‌شده توسط Plugin را نشان می‌دهد (که به‌شکل `plugin:<id>` نمایش داده می‌شوند).

## سطح مناسب را انتخاب کنید

OpenClaw چندین سطح توسعه‌پذیری دارد که مشابه به نظر می‌رسند، اما مسائل متفاوتی را حل می‌کنند:

| اگر می‌خواهید...                                                                                                               | استفاده کنید از...                               | چرا                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| در `/new` یک عکس فوری ذخیره کنید، `/reset` را ثبت کنید، پس از `message:sent` یک API خارجی را فراخوانی کنید یا خودکارسازی کلی اپراتور را بیفزایید | هوک‌های داخلی (`HOOK.md`، این صفحه)              | هوک‌های مبتنی بر فایل برای عوارض جانبی مدیریت‌شده توسط اپراتور و خودکارسازی فرمان/چرخهٔ حیات طراحی شده‌اند |
| اعلان‌ها را بازنویسی کنید، ابزارها را مسدود کنید، پیام‌های خروجی را لغو کنید یا میان‌افزار/سیاست ترتیبی بیفزایید                    | هوک‌های نوع‌دار Plugin از طریق `api.on(...)`     | هوک‌های نوع‌دار قراردادهای صریح، اولویت‌ها، قواعد ادغام و معناشناسی مسدودسازی/لغو دارند                 |
| خروجی صرفاً تله‌متری یا مشاهده‌پذیری بیفزایید                                                                                   | رویدادهای تشخیصی                                 | مشاهده‌پذیری یک گذرگاه رویداد جداگانه است، نه یک سطح هوک سیاستی                                        |

هنگامی از هوک‌های داخلی استفاده کنید که خودکارسازی‌ای می‌خواهید که مانند یک یکپارچه‌سازی کوچک نصب‌شده رفتار کند. هنگامی از هوک‌های نوع‌دار Plugin استفاده کنید که به کنترل چرخهٔ حیات زمان اجرا نیاز دارید.

## شروع سریع

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## انواع رویداد

هوک‌ها در یک کلید مشخص از این جدول مشترک می‌شوند، یا برای دریافت همهٔ کنش‌های یک خانواده، در نام خام آن خانواده (`command`، `session`، `agent`، `gateway`، `message`) مشترک می‌شوند. هستهٔ OpenClaw هیچ چیز دیگری منتشر نمی‌کند؛ بنابراین هر نام دیگری تقریباً همیشه یک اشتباه تایپی است که هوک را بی‌سروصدا غیرفعال باقی می‌گذارد (فقط Pluginی که یک رویداد سفارشی منتشر کند می‌تواند آن را فعال کند). بارگذار هوک برای چنین نام‌هایی (برای مثال `command:nwe`) هشدار ثبت می‌کند و `openclaw hooks info <name>` آن‌ها را علامت‌گذاری می‌کند؛ بنابراین هوکی که هرگز اجرا نمی‌شود قابل عیب‌یابی است.

| رویداد                    | زمان اجرا                                                  |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | صدور فرمان `/new`                                          |
| `command:reset`          | صدور فرمان `/reset`                                        |
| `command:stop`           | صدور فرمان `/stop`                                         |
| `command`                | هر رویداد فرمانی (شنوندهٔ عمومی)                           |
| `session:compact:before` | پیش از آنکه Compaction تاریخچه را خلاصه کند                 |
| `session:compact:after`  | پس از تکمیل Compaction                                      |
| `session:patch`          | هنگام تغییر ویژگی‌های نشست                                  |
| `agent:bootstrap`        | پیش از تزریق فایل‌های راه‌اندازی اولیهٔ فضای کاری           |
| `gateway:startup`        | پس از آغاز کانال‌ها و بارگذاری هوک‌ها                       |
| `gateway:shutdown`       | هنگام آغاز خاموش‌شدن Gateway                                |
| `gateway:pre-restart`    | پیش از راه‌اندازی مجدد موردانتظار Gateway                   |
| `message:received`       | پیام ورودی از هر کانال                                      |
| `message:transcribed`    | پس از تکمیل رونویسی صوت                                     |
| `message:preprocessed`   | پس از تکمیل یا رد شدن پیش‌پردازش رسانه و پیوند               |
| `message:sent`           | تلاش برای ارسال خروجی (`context.success` نتیجه را دارد)     |

## نوشتن هوک‌ها

### ساختار هوک

هر هوک یک دایرکتوری شامل دو فایل است:

```text
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

فایل کنترل‌گر می‌تواند `handler.ts`، `handler.js`، `index.ts` یا `index.js` باشد.

### قالب HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**فیلدهای فراداده** (`metadata.openclaw`):

| فیلد       | توضیح                                                 |
| ---------- | ----------------------------------------------------- |
| `emoji`    | ایموجی نمایشی برای CLI                                |
| `events`   | آرایه‌ای از رویدادهایی که باید شنیده شوند             |
| `export`   | خروجی نام‌داری که استفاده می‌شود (پیش‌فرض `"default"`) |
| `os`       | سکوهای موردنیاز (برای مثال `["darwin", "linux"]`)     |
| `requires` | مسیرهای الزامی `bins`، `anyBins`، `env` یا `config`   |
| `always`   | نادیده گرفتن بررسی‌های واجدشرایط بودن (بولی)           |
| `hookKey`  | بازنویسی کلید پیکربندی (پیش‌فرض نام هوک)               |
| `homepage` | نشانی مستندات که `openclaw hooks info` نشان می‌دهد     |
| `install`  | روش‌های نصب                                            |

### پیاده‌سازی کنترل‌گر

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

هر رویداد شامل این موارد است: `type`، `action`، `sessionKey`، `timestamp`، `messages` و `context` (داده‌های مختص رویداد). زمینه‌های هوک نوع‌دار Plugin برای هوک‌های عامل و ابزار همچنین می‌توانند شامل `trace` باشند؛ یک زمینهٔ ردگیری تشخیصی فقط‌خواندنی و سازگار با W3C که Pluginها می‌توانند برای هم‌بستگی OTEL به گزارش‌های ساخت‌یافته منتقل کنند.

رشته‌هایی که به `event.messages` افزوده می‌شوند، تنها برای `command:new` و `command:reset` (به‌عنوان پاسخ به گفت‌وگوی مبدأ هدایت می‌شوند) و برای `session:compact:before` / `session:compact:after` (به‌عنوان اعلان‌های وضعیت Compaction ارسال می‌شوند) به چت بازگردانده می‌شوند. همهٔ رویدادهای دیگر، از جمله `command:stop`، `message:*`، `agent:bootstrap`، `session:patch` و `gateway:*`، پیام‌های افزوده‌شده را نادیده می‌گیرند.

### نکات برجستهٔ زمینهٔ رویداد

**رویدادهای فرمان** (`command:new`، `command:reset`): `context.sessionEntry`، `context.previousSessionEntry`، `context.commandSource`، `context.senderId`، `context.workspaceDir`، `context.cfg`.

**رویدادهای فرمان** (`command:stop`): `context.sessionEntry`، `context.sessionId`، `context.commandSource`، `context.senderId`.

**رویدادهای پیام** (`message:received`): `context.from`، `context.content`، `context.channelId`، `context.metadata` (داده‌های مختص ارائه‌دهنده شامل `senderId`، `senderName`، `guildId`). `context.content` برای پیام‌های فرمان‌مانند، ابتدا بدنهٔ غیرخالی فرمان را ترجیح می‌دهد، سپس به بدنهٔ خام ورودی و بدنهٔ عمومی بازمی‌گردد؛ این مقدار شامل غنی‌سازی‌های مختص عامل مانند تاریخچهٔ رشته یا خلاصه‌های پیوند نیست.

**رویدادهای پیام** (`message:sent`): `context.to`، `context.content`، `context.success`، `context.channelId` و در صورت ناموفق بودن ارسال، `context.error`.

**رویدادهای پیام** (`message:transcribed`): `context.transcript`، `context.from`، `context.channelId`، `context.mediaPath`.

**رویدادهای پیام** (`message:preprocessed`): `context.bodyForAgent` (بدنهٔ نهایی غنی‌شده)، `context.from`، `context.channelId`.

**رویدادهای راه‌اندازی اولیه** (`agent:bootstrap`): `context.bootstrapFiles` (آرایهٔ قابل‌تغییر)، `context.agentId`.

**رویدادهای وصلهٔ نشست** (`session:patch`): `context.sessionEntry`، `context.patch` (فقط فیلدهای تغییرکرده)، `context.cfg`. فقط کارخواه‌های دارای امتیاز می‌توانند رویدادهای وصله را فعال کنند؛ زمینه یک کپی است، بنابراین کنترل‌گرها نمی‌توانند ورودی زندهٔ نشست را تغییر دهند.

**رویدادهای Compaction**: `session:compact:before` شامل `messageCount` و `tokenCount` است. `session:compact:after` نیز `compactedCount`، `summaryLength`، `tokensBefore` و `tokensAfter` را اضافه می‌کند.

`command:stop` صدور `/stop` توسط کاربر را مشاهده می‌کند؛ این رویداد بخشی از چرخهٔ حیات لغو/فرمان است، نه دروازهٔ نهایی‌سازی عامل. Pluginهایی که باید یک پاسخ نهایی طبیعی را بررسی کنند و از عامل یک گذر دیگر بخواهند، باید به‌جای آن از هوک نوع‌دار Plugin با نام `before_agent_finalize` استفاده کنند. [هوک‌های Plugin](/fa/plugins/hooks) را ببینید.

**رویدادهای چرخهٔ حیات Gateway**: `gateway:shutdown` شامل `reason` و `restartExpectedMs` است و هنگام آغاز خاموش‌شدن Gateway اجرا می‌شود. `gateway:pre-restart` همان زمینه را شامل می‌شود، اما فقط زمانی اجرا می‌شود که خاموش‌شدن بخشی از یک راه‌اندازی مجدد موردانتظار باشد و مقدار متناهی `restartExpectedMs` ارائه شده باشد. هنگام خاموش‌شدن، انتظار برای هر هوک چرخهٔ حیات به‌صورت بهترین تلاش و محدود انجام می‌شود تا اگر کنترل‌گری متوقف ماند، خاموش‌شدن ادامه یابد. بودجهٔ انتظار پیش‌فرض برای `gateway:shutdown` برابر ۵ ثانیه و برای `gateway:pre-restart` برابر ۱۰ ثانیه است.

برای اعلان‌های کوتاه راه‌اندازی مجدد، تا زمانی که کانال‌ها هنوز در دسترس هستند، از `gateway:pre-restart` استفاده کنید:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

بین رویداد `gateway:shutdown` (یا `gateway:pre-restart`) و ادامهٔ توالی خاموش‌شدن، Gateway همچنین برای هر نشستی که هنگام توقف فرایند همچنان فعال بوده است، یک هوک نوع‌دار Plugin با نام `session_end` اجرا می‌کند. مقدار `reason` این رویداد برای توقف سادهٔ SIGTERM/SIGINT برابر `shutdown` و هنگامی که بسته‌شدن به‌عنوان بخشی از یک راه‌اندازی مجدد موردانتظار زمان‌بندی شده باشد برابر `restart` است. این تخلیه محدود است تا کنترل‌گر کند `session_end` نتواند خروج فرایند را مسدود کند؛ نشست‌هایی که قبلاً از طریق جایگزینی / بازنشانی / حذف / Compaction نهایی شده‌اند نیز برای جلوگیری از اجرای دوباره رد می‌شوند.

## کشف هوک

هوک‌ها از چهار منبع کشف می‌شوند:

1. **هوک‌های همراه**: همراه OpenClaw عرضه می‌شوند
2. **هوک‌های Plugin**: درون Pluginهای نصب‌شده بسته‌بندی شده‌اند؛ می‌توانند هوک‌های همراه هم‌نام را بازنویسی کنند
3. **هوک‌های مدیریت‌شده**: `~/.openclaw/hooks/` (نصب‌شده توسط کاربر و مشترک میان فضاهای کاری)؛ می‌توانند هوک‌های همراه و Plugin را بازنویسی کنند. دایرکتوری‌های اضافی از `hooks.internal.load.extraDirs` نیز همین تقدم را دارند.
4. **هوک‌های فضای کاری**: `<workspace>/hooks/` (مختص هر عامل و به‌طور پیش‌فرض تا زمان فعال‌سازی صریح غیرفعال)

هوک‌های فضای کاری می‌توانند نام‌های جدید هوک اضافه کنند، اما نمی‌توانند هوک‌های هم‌نامِ ارائه‌شده به‌صورت همراه، مدیریت‌شده یا توسط Plugin را بازنویسی کنند.

Gateway تا زمانی که هوک‌های داخلی پیکربندی نشده باشند، کشف هوک داخلی را هنگام راه‌اندازی رد می‌کند. برای اعلام استفاده، یک هوک همراه یا مدیریت‌شده را با `openclaw hooks enable <name>` فعال کنید، یک بستهٔ هوک نصب کنید یا `hooks.internal.enabled=true` را تنظیم کنید. هنگامی که یک هوک نام‌دار را فعال می‌کنید، Gateway فقط کنترل‌گر همان هوک را بارگذاری می‌کند؛ `hooks.internal.enabled=true`، دایرکتوری‌های اضافی هوک و کنترل‌گرهای قدیمی، کشف گسترده را فعال می‌کنند.

### بسته‌های هوک

بسته‌های هوک، بسته‌های npm هستند که هوک‌ها را از طریق `openclaw.hooks` در `package.json` صادر می‌کنند. نصب با:

```bash
openclaw plugins install <path-or-spec>
```

مشخصات Npm فقط می‌توانند از رجیستری باشند (نام بسته + نسخهٔ دقیق یا dist-tag اختیاری). مشخصات Git/URL/فایل و بازه‌های semver رد می‌شوند. فرمان‌های قدیمی‌تر `openclaw hooks install` و `openclaw hooks update` نام‌های مستعار منسوخ‌شده‌ای برای `openclaw plugins install` / `openclaw plugins update` هستند.

## هوک‌های همراه

| هوک                   | رویدادها                                          | کاری که انجام می‌دهد                                                     |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset`                    | زمینهٔ نشست را در `<workspace>/memory/` ذخیره می‌کند                      |
| bootstrap-extra-files | `agent:bootstrap`                                 | فایل‌های راه‌اندازی اضافی را از الگوهای glob تزریق می‌کند                 |
| command-logger        | `command`                                         | همهٔ فرمان‌ها را در `~/.openclaw/logs/commands.log` ثبت می‌کند            |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | هنگام شروع/پایان فشرده‌سازی نشست، اعلان‌های قابل‌مشاهدهٔ چت ارسال می‌کند |
| boot-md               | `gateway:startup`                                 | هنگام شروع Gateway، `BOOT.md` را اجرا می‌کند                             |

برای فعال‌کردن هر هوک همراه:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### جزئیات session-memory

آخرین پیام‌های کاربر/دستیار را استخراج می‌کند (پیش‌فرض ۱۵، قابل‌پیکربندی با `hooks.internal.entries.session-memory.messages`) و با استفاده از تاریخ محلی میزبان، آن‌ها را در `<workspace>/memory/YYYY-MM-DD-HHMM.md` ذخیره می‌کند. ثبت حافظه در پس‌زمینه اجرا می‌شود تا تأییدهای `/new` و `/reset` به‌دلیل خواندن رونوشت یا تولید اختیاری نامک به تأخیر نیفتند. برای تولید نامک‌های توصیفی نام فایل، `hooks.internal.entries.session-memory.llmSlug: true` را تنظیم کنید و در صورت تمایل، `hooks.internal.entries.session-memory.model` را روی یک نام مستعار پیکربندی‌شده مانند `sonnet`، یک شناسهٔ مدل ساده در ارائه‌دهندهٔ پیش‌فرض عامل، یا یک مرجع `provider/model` تنظیم کنید. وقتی `model` حذف شده باشد، تولید نامک از مدل پیش‌فرض عامل استفاده می‌کند و در صورت در دسترس نبودن، به نامک‌های مهر زمانی بازمی‌گردد. لازم است `workspace.dir` پیکربندی شده باشد.

<a id="bootstrap-extra-files"></a>

### پیکربندی bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

`patterns` و `files` به‌عنوان نام‌های مستعار `paths` پذیرفته می‌شوند. مسیرها نسبت به فضای کاری تفکیک می‌شوند و باید درون آن باقی بمانند. فقط نام‌های پایهٔ راه‌اندازی شناخته‌شده بارگذاری می‌شوند (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`، `MEMORY.md`).

<a id="command-logger"></a>

### جزئیات command-logger

هر فرمان اسلش را به‌صورت یک خط JSON (مهر زمانی، کنش، کلید نشست، شناسهٔ فرستنده، منبع) در `~/.openclaw/logs/commands.log` ثبت می‌کند.

<a id="compaction-notifier"></a>

### جزئیات compaction-notifier

هنگامی که OpenClaw فشرده‌سازی رونوشت نشست را آغاز و تمام می‌کند، پیام‌های کوتاه وضعیت را به گفت‌وگوی جاری می‌فرستد. این کار نوبت‌های طولانی را در محیط‌های چت کمتر گیج‌کننده می‌کند، زیرا کاربر می‌تواند ببیند که دستیار در حال خلاصه‌سازی زمینه است و پس از Compaction ادامه خواهد داد.

<a id="boot-md"></a>

### جزئیات boot-md

اگر فایل `BOOT.md` در فضای کاری تفکیک‌شدهٔ عامل وجود داشته باشد، آن را هنگام راه‌اندازی Gateway برای هر دامنهٔ عامل پیکربندی‌شده اجرا می‌کند.

## هوک‌های Plugin

Pluginها می‌توانند برای یکپارچه‌سازی عمیق‌تر، هوک‌های نوع‌دار را از طریق Plugin SDK ثبت کنند:
رهگیری فراخوانی ابزارها، تغییر اعلان‌ها، کنترل جریان پیام و موارد دیگر.
وقتی به `before_tool_call`، `before_agent_reply`،
`before_install` یا هوک‌های دیگر چرخهٔ حیات درون‌فرایندی نیاز دارید، از هوک‌های Plugin استفاده کنید.

هوک‌های داخلی مدیریت‌شده توسط Plugin متفاوت هستند: آن‌ها در سامانهٔ سطح‌بالای رویدادهای فرمان/چرخهٔ حیات این صفحه شرکت می‌کنند و در `openclaw hooks list` به‌شکل
`plugin:<id>` ظاهر می‌شوند. از آن‌ها برای اثرات جانبی و سازگاری با بسته‌های هوک استفاده کنید، نه
برای میان‌افزار مرتب‌شده یا دروازه‌های سیاست‌گذاری.

برای مرجع کامل هوک‌های Plugin، به [هوک‌های Plugin](/fa/plugins/hooks) مراجعه کنید.

## پیکربندی

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

مقادیر محیطی مختص هر هوک، بررسی‌های واجد شرایط بودن `requires.env` آن هوک را (در کنار محیط فرایند) برآورده می‌کنند و کنترل‌کننده‌ها می‌توانند آن‌ها را از ورودی پیکربندی هوک خود بخوانند:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

شاخه‌های اضافی هوک:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
قالب قدیمی پیکربندی آرایهٔ `hooks.internal.handlers` همچنان برای سازگاری با نسخه‌های پیشین پشتیبانی می‌شود، اما هوک‌های جدید باید از سامانهٔ مبتنی بر کشف استفاده کنند.
</Note>

## مرجع CLI

```bash
# فهرست همهٔ هوک‌ها (افزودن --eligible، --verbose یا --json)
openclaw hooks list

# نمایش اطلاعات تفصیلی دربارهٔ یک هوک
openclaw hooks info <hook-name>

# نمایش خلاصهٔ واجد شرایط بودن
openclaw hooks check

# فعال/غیرفعال‌کردن
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## روش‌های پیشنهادی

- **کنترل‌کننده‌ها را سریع نگه دارید.** هوک‌ها هنگام پردازش فرمان اجرا می‌شوند. کارهای سنگین را بدون انتظار برای نتیجه با `void processInBackground(event)` اجرا کنید.
- **خطاها را به‌خوبی مدیریت کنید.** عملیات پرخطر را در try/catch قرار دهید؛ خطا پرتاب نکنید تا سایر کنترل‌کننده‌ها بتوانند اجرا شوند.
- **رویدادها را زود فیلتر کنید.** اگر نوع/کنش رویداد مرتبط نیست، بی‌درنگ بازگردید.
- **از کلیدهای رویداد مشخص استفاده کنید.** برای کاهش سربار، `"events": ["command:new"]` را به `"events": ["command"]` ترجیح دهید.

## عیب‌یابی

### هوک کشف نمی‌شود

```bash
# تأیید ساختار شاخه
ls -la ~/.openclaw/hooks/my-hook/
# باید نمایش داده شود: HOOK.md، handler.ts

# فهرست همهٔ هوک‌های کشف‌شده
openclaw hooks list
```

### هوک واجد شرایط نیست

```bash
openclaw hooks info my-hook
```

نبود فایل‌های اجرایی (PATH)، متغیرهای محیطی، مقادیر پیکربندی یا سازگاری با سیستم‌عامل را بررسی کنید.

### هوک اجرا نمی‌شود

1. تأیید کنید هوک فعال است: `openclaw hooks list`
2. فرایند Gateway خود را مجدداً راه‌اندازی کنید تا هوک‌ها دوباره بارگذاری شوند.
3. گزارش‌های Gateway را بررسی کنید: `openclaw logs --follow | grep -i hook`

## مرتبط

- [مرجع CLI: هوک‌ها](/fa/cli/hooks)
- [وب‌هوک‌ها](/fa/automation/cron-jobs#webhooks)
- [هوک‌های Plugin](/fa/plugins/hooks) — هوک‌های چرخهٔ حیات درون‌فرایندی Plugin
- [پیکربندی](/fa/gateway/configuration-reference#hooks)

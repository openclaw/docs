---
read_when:
    - به خودکارسازی رویدادمحور برای /new، /reset، /stop و رویدادهای چرخهٔ عمر عامل نیاز دارید
    - می‌خواهید هوک‌ها را بسازید، نصب کنید یا اشکال‌زدایی کنید
summary: 'هوک‌ها: خودکارسازی رویدادمحور برای دستورها و رویدادهای چرخهٔ حیات'
title: هوک‌ها
x-i18n:
    generated_at: "2026-05-05T08:25:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Hookها اسکریپت‌های کوچکی هستند که وقتی چیزی داخل Gateway رخ می‌دهد اجرا می‌شوند. آن‌ها را می‌توان از دایرکتوری‌ها کشف کرد و با `openclaw hooks` بررسی کرد. Gateway فقط بعد از فعال‌کردن hookها یا پیکربندی حداقل یک ورودی hook، بسته hook، handler قدیمی، یا دایرکتوری hook اضافی، hookهای داخلی را بارگذاری می‌کند.

در OpenClaw دو نوع hook وجود دارد:

- **Hookهای داخلی** (این صفحه): وقتی رویدادهای عامل، مانند `/new`، `/reset`، `/stop`، یا رویدادهای چرخه حیات رخ می‌دهند، داخل Gateway اجرا می‌شوند.
- **Webhookها**: endpointهای HTTP خارجی که به سیستم‌های دیگر اجازه می‌دهند کاری را در OpenClaw آغاز کنند. [Webhookها](/fa/automation/cron-jobs#webhooks) را ببینید.

Hookها همچنین می‌توانند داخل Pluginها بسته‌بندی شوند. `openclaw hooks list` هم hookهای مستقل و هم hookهای مدیریت‌شده توسط Plugin را نشان می‌دهد.

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

## نوع‌های رویداد

| رویداد                   | زمان اجرا                                                  |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | دستور `/new` صادر شده است                                 |
| `command:reset`          | دستور `/reset` صادر شده است                               |
| `command:stop`           | دستور `/stop` صادر شده است                                |
| `command`                | هر رویداد دستور (شنونده عمومی)                            |
| `session:compact:before` | پیش از اینکه Compaction تاریخچه را خلاصه کند              |
| `session:compact:after`  | پس از تکمیل Compaction                                    |
| `session:patch`          | وقتی ویژگی‌های نشست تغییر می‌کنند                         |
| `agent:bootstrap`        | پیش از تزریق فایل‌های bootstrap فضای کاری                  |
| `gateway:startup`        | پس از شروع channelها و بارگذاری hookها                    |
| `gateway:shutdown`       | وقتی خاموش‌سازی Gateway آغاز می‌شود                        |
| `gateway:pre-restart`    | پیش از راه‌اندازی مجدد موردانتظار Gateway                  |
| `message:received`       | پیام ورودی از هر channel                                  |
| `message:transcribed`    | پس از تکمیل رونویسی صوت                                   |
| `message:preprocessed`   | پس از تکمیل یا ردشدن پیش‌پردازش رسانه و لینک              |
| `message:sent`           | پیام خروجی تحویل داده شد                                  |

## نوشتن hookها

### ساختار hook

هر hook یک دایرکتوری است که دو فایل دارد:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

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

**فیلدهای metadata** (`metadata.openclaw`):

| فیلد       | توضیح                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | ایموجی نمایش برای CLI                                |
| `events`   | آرایه‌ای از رویدادهایی که باید به آن‌ها گوش داد      |
| `export`   | export نام‌دار برای استفاده (پیش‌فرض `"default"`)    |
| `os`       | پلتفرم‌های لازم (مثلاً `["darwin", "linux"]`)        |
| `requires` | مسیرهای لازم `bins`، `anyBins`، `env`، یا `config`   |
| `always`   | دورزدن بررسی‌های صلاحیت (بولی)                       |
| `install`  | روش‌های نصب                                          |

### پیاده‌سازی handler

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

هر رویداد شامل این موارد است: `type`، `action`، `sessionKey`، `timestamp`، `messages` (برای ارسال به کاربر push کنید)، و `context` (داده‌های مختص رویداد). contextهای hook مربوط به Pluginهای عامل و ابزار همچنین می‌توانند شامل `trace` باشند؛ یک context ردیابی تشخیصی فقط‌خواندنی و سازگار با W3C که Pluginها می‌توانند برای هم‌بستگی OTEL به لاگ‌های ساختاریافته پاس بدهند.

### نکات مهم context رویداد

**رویدادهای دستور** (`command:new`، `command:reset`): `context.sessionEntry`، `context.previousSessionEntry`، `context.commandSource`، `context.workspaceDir`، `context.cfg`.

**رویدادهای پیام** (`message:received`): `context.from`، `context.content`، `context.channelId`، `context.metadata` (داده‌های مختص provider شامل `senderId`، `senderName`، `guildId`). `context.content` برای پیام‌های شبیه دستور، یک بدنه دستور غیرخالی را ترجیح می‌دهد، سپس به بدنه خام ورودی و بدنه عمومی fallback می‌کند؛ این شامل غنی‌سازی‌های فقط مخصوص عامل، مانند تاریخچه thread یا خلاصه‌های لینک نیست.

**رویدادهای پیام** (`message:sent`): `context.to`، `context.content`، `context.success`، `context.channelId`.

**رویدادهای پیام** (`message:transcribed`): `context.transcript`، `context.from`، `context.channelId`، `context.mediaPath`.

**رویدادهای پیام** (`message:preprocessed`): `context.bodyForAgent` (بدنه نهایی غنی‌شده)، `context.from`، `context.channelId`.

**رویدادهای bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (آرایه قابل تغییر)، `context.agentId`.

**رویدادهای patch نشست** (`session:patch`): `context.sessionEntry`، `context.patch` (فقط فیلدهای تغییرکرده)، `context.cfg`. فقط clientهای دارای امتیاز می‌توانند رویدادهای patch را فعال کنند.

**رویدادهای Compaction**: `session:compact:before` شامل `messageCount`، `tokenCount` است. `session:compact:after` موارد `compactedCount`، `summaryLength`، `tokensBefore`، `tokensAfter` را اضافه می‌کند.

`command:stop` صدور `/stop` توسط کاربر را مشاهده می‌کند؛ این چرخه حیات لغو/دستور
است، نه یک دروازه نهایی‌سازی عامل. Pluginهایی که باید یک پاسخ نهایی طبیعی را
بررسی کنند و از عامل یک گذر دیگر بخواهند، باید به‌جای آن از hook تایپ‌شده
Plugin یعنی `before_agent_finalize` استفاده کنند. [Hookهای Plugin](/fa/plugins/hooks) را ببینید.

**رویدادهای چرخه حیات Gateway**: `gateway:shutdown` شامل `reason` و `restartExpectedMs` است و وقتی خاموش‌سازی Gateway آغاز می‌شود اجرا می‌شود. `gateway:pre-restart` همان context را دارد اما فقط وقتی اجرا می‌شود که خاموش‌سازی بخشی از یک راه‌اندازی مجدد موردانتظار باشد و یک مقدار محدود `restartExpectedMs` ارائه شده باشد. هنگام خاموش‌سازی، انتظار برای هر hook چرخه حیات به‌صورت best-effort و محدود انجام می‌شود تا اگر یک handler متوقف شد، خاموش‌سازی ادامه پیدا کند.

## کشف hook

Hookها از این دایرکتوری‌ها، به‌ترتیب افزایش اولویت override، کشف می‌شوند:

1. **Hookهای همراه**: همراه OpenClaw ارسال می‌شوند
2. **Hookهای Plugin**: hookهایی که داخل Pluginهای نصب‌شده بسته‌بندی شده‌اند
3. **Hookهای مدیریت‌شده**: `~/.openclaw/hooks/` (نصب‌شده توسط کاربر، مشترک بین فضاهای کاری). دایرکتوری‌های اضافی از `hooks.internal.load.extraDirs` این اولویت را به اشتراک می‌گذارند.
4. **Hookهای فضای کاری**: `<workspace>/hooks/` (برای هر عامل، به‌صورت پیش‌فرض غیرفعال تا زمانی که صراحتاً فعال شوند)

Hookهای فضای کاری می‌توانند نام‌های hook جدید اضافه کنند، اما نمی‌توانند hookهای همراه، مدیریت‌شده، یا ارائه‌شده توسط Plugin با همان نام را override کنند.

Gateway هنگام startup تا وقتی hookهای داخلی پیکربندی نشده‌اند، کشف hook داخلی را رد می‌کند. با `openclaw hooks enable <name>` یک hook همراه یا مدیریت‌شده را فعال کنید، یک بسته hook نصب کنید، یا برای opt in مقدار `hooks.internal.enabled=true` را تنظیم کنید. وقتی یک hook نام‌دار را فعال می‌کنید، Gateway فقط handler همان hook را بارگذاری می‌کند؛ `hooks.internal.enabled=true`، دایرکتوری‌های hook اضافی، و handlerهای قدیمی برای کشف گسترده opt in می‌کنند.

### بسته‌های hook

بسته‌های hook بسته‌های npm هستند که hookها را از طریق `openclaw.hooks` در `package.json` صادر می‌کنند. با این دستور نصب کنید:

```bash
openclaw plugins install <path-or-spec>
```

مشخصات npm فقط از رجیستری پشتیبانی می‌شوند (نام بسته + نسخه دقیق اختیاری یا dist-tag). مشخصات Git/URL/file و بازه‌های semver رد می‌شوند.

## hookهای همراه

| Hook                  | رویدادها                                         | کاری که انجام می‌دهد                                             |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | زمینه نشست را در `<workspace>/memory/` ذخیره می‌کند              |
| bootstrap-extra-files | `agent:bootstrap`                                 | فایل‌های bootstrap اضافی را از الگوهای glob تزریق می‌کند         |
| command-logger        | `command`                                         | همه فرمان‌ها را در `~/.openclaw/logs/commands.log` ثبت می‌کند    |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | هنگام شروع/پایان Compaction نشست اعلان‌های قابل مشاهده در چت می‌فرستد |
| boot-md               | `gateway:startup`                                 | هنگام شروع Gateway، `BOOT.md` را اجرا می‌کند                     |

فعال‌سازی هر hook همراه:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### جزئیات session-memory

آخرین ۱۵ پیام کاربر/دستیار را استخراج می‌کند و با استفاده از تاریخ محلی میزبان در `<workspace>/memory/YYYY-MM-DD-HHMM.md` ذخیره می‌کند. ثبت حافظه در پس‌زمینه اجرا می‌شود تا تأییدهای `/new` و `/reset` به‌خاطر خواندن transcript یا تولید اختیاری slug به تأخیر نیفتند. برای تولید slugهای توصیفی نام فایل با مدل پیکربندی‌شده، `hooks.internal.entries.session-memory.llmSlug: true` را تنظیم کنید. نیازمند پیکربندی `workspace.dir` است.

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

مسیرها نسبت به workspace resolve می‌شوند. فقط نام‌های پایه bootstrap شناخته‌شده بارگذاری می‌شوند (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### جزئیات command-logger

هر فرمان slash را در `~/.openclaw/logs/commands.log` ثبت می‌کند.

<a id="compaction-notifier"></a>

### جزئیات compaction-notifier

وقتی OpenClaw شروع به فشرده‌سازی transcript نشست می‌کند و آن را به پایان می‌رساند، پیام‌های وضعیت کوتاه را به گفت‌وگوی فعلی می‌فرستد. این کار نوبت‌های طولانی را در سطوح چت کمتر گیج‌کننده می‌کند، چون کاربر می‌تواند ببیند که دستیار در حال خلاصه‌سازی زمینه است و پس از Compaction ادامه خواهد داد.

<a id="boot-md"></a>

### جزئیات boot-md

هنگام شروع Gateway، `BOOT.md` را از workspace فعال اجرا می‌کند.

## hookهای Plugin

Pluginها می‌توانند برای یکپارچگی عمیق‌تر، hookهای نوع‌دار را از طریق Plugin SDK ثبت کنند:
رهگیری فراخوانی‌های ابزار، تغییر promptها، کنترل جریان پیام و موارد بیشتر.
وقتی به `before_tool_call`، `before_agent_reply`،
`before_install` یا دیگر hookهای چرخه‌عمر درون‌فرایندی نیاز دارید، از hookهای Plugin استفاده کنید.

برای مرجع کامل hookهای Plugin، [hookهای Plugin](/fa/plugins/hooks) را ببینید.

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

متغیرهای محیطی برای هر hook:

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

دایرکتوری‌های hook اضافی:

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
قالب قدیمی پیکربندی آرایه `hooks.internal.handlers` همچنان برای سازگاری با نسخه‌های قبلی پشتیبانی می‌شود، اما hookهای جدید باید از سیستم مبتنی بر discovery استفاده کنند.
</Note>

## مرجع CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## بهترین روش‌ها

- **handlerها را سریع نگه دارید.** هوک‌ها هنگام پردازش فرمان اجرا می‌شوند. کارهای سنگین را به‌صورت fire-and-forget با `void processInBackground(event)` اجرا کنید.
- **خطاها را با ظرافت مدیریت کنید.** عملیات پرریسک را در try/catch بپیچید؛ throw نکنید تا handlerهای دیگر بتوانند اجرا شوند.
- **رویدادها را زود فیلتر کنید.** اگر نوع/کنش رویداد مرتبط نیست، بلافاصله return کنید.
- **از کلیدهای رویداد مشخص استفاده کنید.** برای کاهش سربار، `"events": ["command:new"]` را به `"events": ["command"]` ترجیح دهید.

## عیب‌یابی

### هوک کشف نمی‌شود

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### هوک واجد شرایط نیست

```bash
openclaw hooks info my-hook
```

نبودن باینری‌ها (PATH)، متغیرهای محیطی، مقادیر پیکربندی، یا سازگاری با سیستم‌عامل را بررسی کنید.

### هوک اجرا نمی‌شود

1. بررسی کنید هوک فعال باشد: `openclaw hooks list`
2. فرایند Gateway خود را بازراه‌اندازی کنید تا هوک‌ها دوباره بارگذاری شوند.
3. گزارش‌های Gateway را بررسی کنید: `./scripts/clawlog.sh | grep hook`

## مرتبط

- [مرجع CLI: هوک‌ها](/fa/cli/hooks)
- [Webhookها](/fa/automation/cron-jobs#webhooks)
- [هوک‌های Plugin](/fa/plugins/hooks) — هوک‌های چرخه عمر Plugin درون‌فرایندی
- [پیکربندی](/fa/gateway/configuration-reference#hooks)

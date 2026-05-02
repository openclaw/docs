---
read_when:
    - برای /new، /reset، /stop و رویدادهای چرخهٔ حیات عامل، خودکارسازی رویدادمحور می‌خواهید
    - می‌خواهید هوک‌ها را بسازید، نصب کنید یا اشکال‌زدایی کنید
summary: 'هوک‌ها: خودکارسازی رویدادمحور برای دستورها و رویدادهای چرخهٔ حیات'
title: هوک‌ها
x-i18n:
    generated_at: "2026-05-02T11:34:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

هوک‌ها اسکریپت‌های کوچکی هستند که هنگام رخ دادن چیزی درون Gateway اجرا می‌شوند. آن‌ها می‌توانند از دایرکتوری‌ها کشف شوند و با `openclaw hooks` بررسی شوند. Gateway هوک‌های داخلی را فقط پس از فعال کردن هوک‌ها یا پیکربندی حداقل یک ورودی هوک، بسته هوک، هندلر قدیمی، یا دایرکتوری هوک اضافی بارگذاری می‌کند.

در OpenClaw دو نوع هوک وجود دارد:

- **هوک‌های داخلی** (این صفحه): هنگام رخ دادن رویدادهای عامل، مانند `/new`، `/reset`، `/stop`، یا رویدادهای چرخه‌عمر، درون Gateway اجرا می‌شوند.
- **Webhookها**: نقطه‌های پایانی HTTP خارجی که به سیستم‌های دیگر اجازه می‌دهند کاری را در OpenClaw راه‌اندازی کنند. [Webhookها](/fa/automation/cron-jobs#webhooks) را ببینید.

هوک‌ها همچنین می‌توانند داخل Pluginها بسته‌بندی شوند. `openclaw hooks list` هم هوک‌های مستقل و هم هوک‌های مدیریت‌شده توسط Plugin را نشان می‌دهد.

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

| رویداد                    | زمان اجرا                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | فرمان `/new` صادر شده است                                      |
| `command:reset`          | فرمان `/reset` صادر شده است                                    |
| `command:stop`           | فرمان `/stop` صادر شده است                                     |
| `command`                | هر رویداد فرمان (شنونده عمومی)                       |
| `session:compact:before` | پیش از آنکه Compaction تاریخچه را خلاصه کند                       |
| `session:compact:after`  | پس از کامل شدن Compaction                                 |
| `session:patch`          | هنگام تغییر ویژگی‌های نشست                       |
| `agent:bootstrap`        | پیش از تزریق فایل‌های راه‌اندازی فضای کاری              |
| `gateway:startup`        | پس از شروع کانال‌ها و بارگذاری هوک‌ها                  |
| `gateway:shutdown`       | هنگامی که خاموش‌سازی Gateway آغاز می‌شود                               |
| `gateway:pre-restart`    | پیش از راه‌اندازی مجدد مورد انتظار Gateway                         |
| `message:received`       | پیام ورودی از هر کانال                           |
| `message:transcribed`    | پس از کامل شدن رونویسی صوت                        |
| `message:preprocessed`   | پس از کامل شدن یا رد شدن پیش‌پردازش رسانه و لینک |
| `message:sent`           | پیام خروجی تحویل داده شده است                                 |

## نوشتن هوک‌ها

### ساختار هوک

هر هوک یک دایرکتوری است که دو فایل دارد:

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

**فیلدهای فراداده** (`metadata.openclaw`):

| فیلد      | توضیح                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | ایموجی نمایشی برای CLI                                |
| `events`   | آرایه‌ای از رویدادها برای گوش دادن                        |
| `export`   | خروجی نام‌گذاری‌شده برای استفاده (پیش‌فرض `"default"` است)        |
| `os`       | پلتفرم‌های لازم (مثلاً `["darwin", "linux"]`)     |
| `requires` | مسیرهای لازم `bins`، `anyBins`، `env`، یا `config` |
| `always`   | دور زدن بررسی‌های واجد شرایط بودن (بولی)                  |
| `install`  | روش‌های نصب                                 |

### پیاده‌سازی هندلر

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

هر رویداد شامل این موارد است: `type`، `action`، `sessionKey`، `timestamp`، `messages` (برای ارسال به کاربر به آن اضافه کنید)، و `context` (داده‌های ویژه رویداد). زمینه‌های هوک عامل و ابزار Plugin همچنین می‌توانند شامل `trace` باشند؛ یک زمینه ردیابی تشخیصی فقط‌خواندنی سازگار با W3C که Pluginها می‌توانند برای هم‌بستگی OTEL به لاگ‌های ساختاریافته منتقل کنند.

### نکات برجسته زمینه رویداد

**رویدادهای فرمان** (`command:new`، `command:reset`): `context.sessionEntry`، `context.previousSessionEntry`، `context.commandSource`، `context.workspaceDir`، `context.cfg`.

**رویدادهای پیام** (`message:received`): `context.from`، `context.content`، `context.channelId`، `context.metadata` (داده‌های ویژه ارائه‌دهنده شامل `senderId`، `senderName`، `guildId`). `context.content` برای پیام‌های شبیه فرمان، بدنه فرمان غیرخالی را ترجیح می‌دهد، سپس به بدنه ورودی خام و بدنه عمومی بازمی‌گردد؛ غنی‌سازی‌های فقط مخصوص عامل مانند تاریخچه رشته گفتگو یا خلاصه لینک‌ها را شامل نمی‌شود.

**رویدادهای پیام** (`message:sent`): `context.to`، `context.content`، `context.success`، `context.channelId`.

**رویدادهای پیام** (`message:transcribed`): `context.transcript`، `context.from`، `context.channelId`، `context.mediaPath`.

**رویدادهای پیام** (`message:preprocessed`): `context.bodyForAgent` (بدنه غنی‌شده نهایی)، `context.from`، `context.channelId`.

**رویدادهای راه‌اندازی** (`agent:bootstrap`): `context.bootstrapFiles` (آرایه قابل تغییر)، `context.agentId`.

**رویدادهای وصله نشست** (`session:patch`): `context.sessionEntry`، `context.patch` (فقط فیلدهای تغییرکرده)، `context.cfg`. فقط کلاینت‌های دارای امتیاز می‌توانند رویدادهای وصله را راه‌اندازی کنند.

**رویدادهای Compaction**: `session:compact:before` شامل `messageCount`، `tokenCount` است. `session:compact:after` مقادیر `compactedCount`، `summaryLength`، `tokensBefore`، `tokensAfter` را اضافه می‌کند.

`command:stop` صدور `/stop` توسط کاربر را مشاهده می‌کند؛ این مربوط به چرخه‌عمر لغو/فرمان است، نه دروازه نهایی‌سازی عامل. Pluginهایی که باید پاسخ نهایی طبیعی را بررسی کنند و از عامل یک گذر دیگر بخواهند، باید به‌جای آن از هوک تایپ‌شده Plugin یعنی `before_agent_finalize` استفاده کنند. [هوک‌های Plugin](/fa/plugins/hooks) را ببینید.

**رویدادهای چرخه‌عمر Gateway**: `gateway:shutdown` شامل `reason` و `restartExpectedMs` است و هنگام آغاز خاموش‌سازی Gateway اجرا می‌شود. `gateway:pre-restart` همان زمینه را شامل می‌شود، اما فقط زمانی اجرا می‌شود که خاموش‌سازی بخشی از راه‌اندازی مجدد مورد انتظار باشد و یک مقدار محدود `restartExpectedMs` ارائه شده باشد. هنگام خاموش‌سازی، انتظار برای هر هوک چرخه‌عمر به‌صورت بهترین تلاش و محدود انجام می‌شود تا اگر هندلری متوقف شد، خاموش‌سازی ادامه پیدا کند.

## کشف هوک

هوک‌ها از این دایرکتوری‌ها، به ترتیب افزایش اولویت بازنویسی، کشف می‌شوند:

1. **هوک‌های همراه**: همراه OpenClaw ارائه می‌شوند
2. **هوک‌های Plugin**: هوک‌هایی که داخل Pluginهای نصب‌شده بسته‌بندی شده‌اند
3. **هوک‌های مدیریت‌شده**: `~/.openclaw/hooks/` (نصب‌شده توسط کاربر، مشترک بین فضاهای کاری). دایرکتوری‌های اضافی از `hooks.internal.load.extraDirs` این اولویت را به اشتراک می‌گذارند.
4. **هوک‌های فضای کاری**: `<workspace>/hooks/` (برای هر عامل، تا زمانی که صراحتاً فعال نشود به‌طور پیش‌فرض غیرفعال است)

هوک‌های فضای کاری می‌توانند نام‌های هوک جدید اضافه کنند، اما نمی‌توانند هوک‌های همراه، مدیریت‌شده، یا ارائه‌شده توسط Plugin را که همان نام را دارند بازنویسی کنند.

Gateway هنگام راه‌اندازی تا زمانی که هوک‌های داخلی پیکربندی نشده باشند، کشف هوک داخلی را رد می‌کند. یک هوک همراه یا مدیریت‌شده را با `openclaw hooks enable <name>` فعال کنید، یک بسته هوک نصب کنید، یا `hooks.internal.enabled=true` را تنظیم کنید تا فعال شود. وقتی یک هوک نام‌دار را فعال می‌کنید، Gateway فقط هندلر همان هوک را بارگذاری می‌کند؛ `hooks.internal.enabled=true`، دایرکتوری‌های هوک اضافی، و هندلرهای قدیمی کشف گسترده را فعال می‌کنند.

### بسته‌های هوک

بسته‌های هوک، پکیج‌های npm هستند که هوک‌ها را از طریق `openclaw.hooks` در `package.json` صادر می‌کنند. نصب با:

```bash
openclaw plugins install <path-or-spec>
```

مشخصه‌های Npm فقط مخصوص رجیستری هستند (نام بسته + نسخهٔ دقیق اختیاری یا dist-tag). مشخصه‌های Git/URL/file و محدوده‌های semver رد می‌شوند.

## هوک‌های همراه

| هوک                   | رویدادها                       | کاری که انجام می‌دهد                                  |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | زمینهٔ نشست را در `<workspace>/memory/` ذخیره می‌کند  |
| bootstrap-extra-files | `agent:bootstrap`              | فایل‌های بوت‌استرپ اضافی را از الگوهای glob تزریق می‌کند |
| command-logger        | `command`                      | همهٔ فرمان‌ها را در `~/.openclaw/logs/commands.log` ثبت می‌کند |
| boot-md               | `gateway:startup`              | هنگام شروع Gateway، `BOOT.md` را اجرا می‌کند          |

فعال‌سازی هر هوک همراه:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### جزئیات session-memory

۱۵ پیام آخر کاربر/دستیار را استخراج می‌کند، از طریق LLM یک نام فایل توصیفی به‌صورت slug تولید می‌کند، و با استفاده از تاریخ محلی میزبان در `<workspace>/memory/YYYY-MM-DD-slug.md` ذخیره می‌کند. نیاز دارد `workspace.dir` پیکربندی شده باشد.

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

مسیرها نسبت به workspace تفسیر می‌شوند. فقط نام‌های پایهٔ بوت‌استرپ شناخته‌شده بارگذاری می‌شوند (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### جزئیات command-logger

هر فرمان اسلش را در `~/.openclaw/logs/commands.log` ثبت می‌کند.

<a id="boot-md"></a>

### جزئیات boot-md

هنگام شروع Gateway، `BOOT.md` را از workspace فعال اجرا می‌کند.

## هوک‌های Plugin

Pluginها می‌توانند برای یکپارچه‌سازی عمیق‌تر، هوک‌های typed را از طریق Plugin SDK ثبت کنند:
رهگیری فراخوانی‌های ابزار، تغییر promptها، کنترل جریان پیام، و موارد بیشتر.
وقتی به `before_tool_call`، `before_agent_reply`،
`before_install`، یا دیگر هوک‌های چرخهٔ عمر درون‌فرایندی نیاز دارید، از هوک‌های Plugin استفاده کنید.

برای مرجع کامل هوک‌های Plugin، [هوک‌های Plugin](/fa/plugins/hooks) را ببینید.

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

متغیرهای محیطی برای هر هوک:

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

دایرکتوری‌های هوک اضافی:

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
قالب پیکربندی آرایهٔ قدیمی `hooks.internal.handlers` همچنان برای سازگاری رو به عقب پشتیبانی می‌شود، اما هوک‌های جدید باید از سیستم مبتنی بر کشف استفاده کنند.
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

## بهترین رویه‌ها

- **handlerها را سریع نگه دارید.** هوک‌ها هنگام پردازش فرمان اجرا می‌شوند. کارهای سنگین fire-and-forget را با `void processInBackground(event)` انجام دهید.
- **خطاها را با نرمی مدیریت کنید.** عملیات پرریسک را در try/catch بپیچید؛ throw نکنید تا handlerهای دیگر بتوانند اجرا شوند.
- **رویدادها را زود فیلتر کنید.** اگر نوع/کنش رویداد مرتبط نیست، بلافاصله return کنید.
- **از کلیدهای رویداد مشخص استفاده کنید.** برای کاهش سربار، `"events": ["command:new"]` را به `"events": ["command"]` ترجیح دهید.

## عیب‌یابی

### هوک کشف نشده است

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

نبودن binaryها (PATH)، متغیرهای محیطی، مقادیر پیکربندی، یا سازگاری سیستم‌عامل را بررسی کنید.

### هوک اجرا نمی‌شود

1. تأیید کنید که هوک فعال است: `openclaw hooks list`
2. فرایند Gateway خود را بازراه‌اندازی کنید تا هوک‌ها دوباره بارگذاری شوند.
3. لاگ‌های Gateway را بررسی کنید: `./scripts/clawlog.sh | grep hook`

## مرتبط

- [مرجع CLI: هوک‌ها](/fa/cli/hooks)
- [Webhookها](/fa/automation/cron-jobs#webhooks)
- [هوک‌های Plugin](/fa/plugins/hooks) — هوک‌های چرخهٔ عمر Plugin درون‌فرایندی
- [پیکربندی](/fa/gateway/configuration-reference#hooks)

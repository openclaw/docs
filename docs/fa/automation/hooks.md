---
read_when:
    - شما اتوماسیون رویدادمحور برای /new، /reset، /stop و رویدادهای چرخهٔ حیات عامل می‌خواهید
    - می‌خواهید هوک‌ها را بسازید، نصب کنید یا اشکال‌زدایی کنید
summary: 'هوک‌ها: خودکارسازی رویدادمحور برای فرمان‌ها و رویدادهای چرخهٔ عمر'
title: هوک‌ها
x-i18n:
    generated_at: "2026-04-29T22:23:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 16
---

قلاب‌ها اسکریپت‌های کوچکی هستند که هنگام رخ‌دادن چیزی داخل Gateway اجرا می‌شوند. می‌توان آن‌ها را از پوشه‌ها کشف کرد و با `openclaw hooks` بررسی کرد. Gateway قلاب‌های داخلی را فقط پس از فعال‌کردن قلاب‌ها یا پیکربندی حداقل یک ورودی قلاب، بسته قلاب، هندلر قدیمی، یا پوشه قلاب اضافی بارگذاری می‌کند.

در OpenClaw دو نوع قلاب وجود دارد:

- **قلاب‌های داخلی** (این صفحه): هنگام فعال‌شدن رویدادهای عامل، مانند `/new`، `/reset`، `/stop`، یا رویدادهای چرخه عمر، داخل Gateway اجرا می‌شوند.
- **Webhookها**: نقطه‌پایان‌های HTTP خارجی که به سیستم‌های دیگر اجازه می‌دهند کاری را در OpenClaw آغاز کنند. [Webhookها](/fa/automation/cron-jobs#webhooks) را ببینید.

قلاب‌ها همچنین می‌توانند داخل Pluginها بسته‌بندی شوند. `openclaw hooks list` هم قلاب‌های مستقل و هم قلاب‌های مدیریت‌شده توسط Plugin را نشان می‌دهد.

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

| رویداد                   | زمان اجرا                                                  |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | دستور `/new` صادر شد                                      |
| `command:reset`          | دستور `/reset` صادر شد                                    |
| `command:stop`           | دستور `/stop` صادر شد                                     |
| `command`                | هر رویداد دستور (شنونده عمومی)                            |
| `session:compact:before` | پیش از آن‌که Compaction تاریخچه را خلاصه کند              |
| `session:compact:after`  | پس از کامل‌شدن Compaction                                 |
| `session:patch`          | هنگامی که ویژگی‌های نشست تغییر می‌کنند                    |
| `agent:bootstrap`        | پیش از تزریق فایل‌های بوت‌استرپ فضای کاری                 |
| `gateway:startup`        | پس از شروع کانال‌ها و بارگذاری قلاب‌ها                    |
| `gateway:shutdown`       | هنگامی که خاموش‌سازی Gateway آغاز می‌شود                  |
| `gateway:pre-restart`    | پیش از یک راه‌اندازی دوباره موردانتظار Gateway            |
| `message:received`       | پیام ورودی از هر کانال                                    |
| `message:transcribed`    | پس از کامل‌شدن رونویسی صوت                                |
| `message:preprocessed`   | پس از کامل‌شدن یا ردشدن پیش‌پردازش رسانه و پیوند          |
| `message:sent`           | پیام خروجی تحویل داده شد                                  |

## نوشتن قلاب‌ها

### ساختار قلاب

هر قلاب یک پوشه است که دو فایل دارد:

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

| فیلد       | توضیح                                                |
| ---------- | ---------------------------------------------------- |
| `emoji`    | ایموجی نمایشی برای CLI                              |
| `events`   | آرایه‌ای از رویدادهایی که باید شنیده شوند           |
| `export`   | خروجی نام‌داری که باید استفاده شود (پیش‌فرض `"default"` است) |
| `os`       | پلتفرم‌های لازم (برای نمونه `["darwin", "linux"]`)  |
| `requires` | مسیرهای لازم `bins`، `anyBins`، `env`، یا `config`  |
| `always`   | دورزدن بررسی‌های واجدشرایط‌بودن (بولی)              |
| `install`  | روش‌های نصب                                         |

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

هر رویداد شامل این موارد است: `type`، `action`، `sessionKey`، `timestamp`، `messages` (برای ارسال به کاربر به آن اضافه کنید)، و `context` (داده‌های ویژه رویداد). زمینه‌های قلاب Pluginهای عامل و ابزار همچنین می‌توانند شامل `trace` باشند؛ یک زمینه ردیابی تشخیصی فقط‌خواندنی و سازگار با W3C که Pluginها می‌توانند برای هم‌بستگی OTEL به لاگ‌های ساخت‌یافته پاس دهند.

### نکات مهم زمینه رویداد

**رویدادهای دستور** (`command:new`، `command:reset`): `context.sessionEntry`، `context.previousSessionEntry`، `context.commandSource`، `context.workspaceDir`، `context.cfg`.

**رویدادهای پیام** (`message:received`): `context.from`، `context.content`، `context.channelId`، `context.metadata` (داده‌های ویژه ارائه‌دهنده شامل `senderId`، `senderName`، `guildId`).

**رویدادهای پیام** (`message:sent`): `context.to`، `context.content`، `context.success`، `context.channelId`.

**رویدادهای پیام** (`message:transcribed`): `context.transcript`، `context.from`، `context.channelId`، `context.mediaPath`.

**رویدادهای پیام** (`message:preprocessed`): `context.bodyForAgent` (بدنه نهایی غنی‌شده)، `context.from`، `context.channelId`.

**رویدادهای بوت‌استرپ** (`agent:bootstrap`): `context.bootstrapFiles` (آرایه قابل‌تغییر)، `context.agentId`.

**رویدادهای وصله نشست** (`session:patch`): `context.sessionEntry`، `context.patch` (فقط فیلدهای تغییرکرده)، `context.cfg`. فقط کلاینت‌های دارای امتیاز می‌توانند رویدادهای وصله را فعال کنند.

**رویدادهای Compaction**: `session:compact:before` شامل `messageCount` و `tokenCount` است. `session:compact:after` موارد `compactedCount`، `summaryLength`، `tokensBefore`، و `tokensAfter` را اضافه می‌کند.

`command:stop` صدور `/stop` توسط کاربر را مشاهده می‌کند؛ این چرخه عمر لغو/دستور است، نه دروازه نهایی‌سازی عامل. Pluginهایی که باید پاسخ نهایی طبیعی را بررسی کنند و از عامل یک گذر دیگر بخواهند، باید به‌جای آن از قلاب تایپ‌شده Plugin یعنی `before_agent_finalize` استفاده کنند. [قلاب‌های Plugin](/fa/plugins/hooks) را ببینید.

**رویدادهای چرخه عمر Gateway**: `gateway:shutdown` شامل `reason` و `restartExpectedMs` است و هنگامی اجرا می‌شود که خاموش‌سازی Gateway آغاز شود. `gateway:pre-restart` همان زمینه را شامل می‌شود، اما فقط هنگامی اجرا می‌شود که خاموش‌سازی بخشی از یک راه‌اندازی دوباره موردانتظار باشد و مقدار محدود `restartExpectedMs` ارائه شده باشد. در زمان خاموش‌سازی، انتظار برای هر قلاب چرخه عمر به‌شکل بهترین‌تلاش و محدود است تا اگر هندلری متوقف شد، خاموش‌سازی ادامه پیدا کند.

## کشف قلاب

قلاب‌ها از این پوشه‌ها، به‌ترتیب افزایش اولویت بازنویسی، کشف می‌شوند:

1. **قلاب‌های همراه**: همراه OpenClaw ارائه می‌شوند
2. **قلاب‌های Plugin**: قلاب‌های بسته‌بندی‌شده داخل Pluginهای نصب‌شده
3. **قلاب‌های مدیریت‌شده**: `~/.openclaw/hooks/` (نصب‌شده توسط کاربر، مشترک میان فضاهای کاری). پوشه‌های اضافی از `hooks.internal.load.extraDirs` همین اولویت را دارند.
4. **قلاب‌های فضای کاری**: `<workspace>/hooks/` (برای هر عامل، به‌صورت پیش‌فرض غیرفعال تا زمانی که صریحا فعال شوند)

قلاب‌های فضای کاری می‌توانند نام‌های قلاب جدید اضافه کنند، اما نمی‌توانند قلاب‌های همراه، مدیریت‌شده، یا ارائه‌شده توسط Plugin با همان نام را بازنویسی کنند.

Gateway هنگام شروع، تا زمانی که قلاب‌های داخلی پیکربندی نشده باشند، کشف قلاب داخلی را رد می‌کند. یک قلاب همراه یا مدیریت‌شده را با `openclaw hooks enable <name>` فعال کنید، یک بسته قلاب نصب کنید، یا `hooks.internal.enabled=true` را تنظیم کنید تا وارد شوید. وقتی یک قلاب نام‌دار را فعال می‌کنید، Gateway فقط هندلر همان قلاب را بارگذاری می‌کند؛ `hooks.internal.enabled=true`، پوشه‌های قلاب اضافی، و هندلرهای قدیمی وارد کشف گسترده می‌شوند.

### بسته‌های قلاب

بسته‌های قلاب، بسته‌های npm هستند که قلاب‌ها را از طریق `openclaw.hooks` در `package.json` صادر می‌کنند. با این دستور نصب کنید:

```bash
openclaw plugins install <path-or-spec>
```

مشخصات npm فقط مخصوص رجیستری هستند (نام بسته + نسخه دقیق اختیاری یا dist-tag). مشخصات Git/URL/file و بازه‌های semver رد می‌شوند.

## قلاب‌های همراه

| قلاب                  | رویدادها                       | کاری که انجام می‌دهد                                  |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | زمینه نشست را در `<workspace>/memory/` ذخیره می‌کند  |
| bootstrap-extra-files | `agent:bootstrap`              | فایل‌های بوت‌استرپ اضافی را از الگوهای glob تزریق می‌کند |
| command-logger        | `command`                      | همه دستورها را در `~/.openclaw/logs/commands.log` لاگ می‌کند |
| boot-md               | `gateway:startup`              | هنگام شروع Gateway، `BOOT.md` را اجرا می‌کند          |

فعال‌کردن هر قلاب همراه:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### جزئیات session-memory

آخرین ۱۵ پیام کاربر/دستیار را استخراج می‌کند، از طریق LLM یک slug توصیفی برای نام فایل تولید می‌کند، و با استفاده از تاریخ محلی میزبان در `<workspace>/memory/YYYY-MM-DD-slug.md` ذخیره می‌کند. نیاز دارد `workspace.dir` پیکربندی شده باشد.

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

مسیرها نسبت به فضای کاری حل می‌شوند. فقط نام‌های پایه بوت‌استرپ شناخته‌شده بارگذاری می‌شوند (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`، `MEMORY.md`).

<a id="command-logger"></a>

### جزئیات command-logger

هر دستور اسلش را در `~/.openclaw/logs/commands.log` لاگ می‌کند.

<a id="boot-md"></a>

### جزئیات boot-md

هنگام شروع Gateway، `BOOT.md` را از فضای کاری فعال اجرا می‌کند.

## قلاب‌های Plugin

Pluginها می‌توانند برای یکپارچه‌سازی عمیق‌تر، قلاب‌های تایپ‌شده را از طریق Plugin SDK ثبت کنند: رهگیری فراخوانی‌های ابزار، تغییر اعلان‌ها، کنترل جریان پیام، و موارد بیشتر. وقتی به `before_tool_call`، `before_agent_reply`، `before_install`، یا سایر قلاب‌های چرخه عمر درون‌فرایندی نیاز دارید، از قلاب‌های Plugin استفاده کنید.

برای مرجع کامل قلاب Plugin، [قلاب‌های Plugin](/fa/plugins/hooks) را ببینید.

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

متغیرهای محیطی برای هر قلاب:

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

پوشه‌های قلاب اضافی:

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
قالب پیکربندی قدیمی آرایه `hooks.internal.handlers` همچنان برای سازگاری با نسخه‌های پیشین پشتیبانی می‌شود، اما قلاب‌های جدید باید از سیستم مبتنی بر کشف استفاده کنند.
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

- **هندلرها را سریع نگه دارید.** قلاب‌ها هنگام پردازش دستور اجرا می‌شوند. کارهای سنگین را با `void processInBackground(event)` به‌صورت fire-and-forget اجرا کنید.
- **خطاها را با ملایمت مدیریت کنید.** عملیات پرریسک را در try/catch قرار دهید؛ throw نکنید تا هندلرهای دیگر بتوانند اجرا شوند.
- **رویدادها را زود فیلتر کنید.** اگر نوع/کنش رویداد مرتبط نیست، بلافاصله برگردید.
- **از کلیدهای رویداد مشخص استفاده کنید.** برای کاهش سربار، `"events": ["command:new"]` را به `"events": ["command"]` ترجیح دهید.

## عیب‌یابی

### قلاب کشف نشده است

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### قلاب واجد شرایط نیست

```bash
openclaw hooks info my-hook
```

نبود باینری‌ها (PATH)، متغیرهای محیطی، مقادیر پیکربندی، یا سازگاری سیستم‌عامل را بررسی کنید.

### قلاب اجرا نمی‌شود

1. بررسی کنید قلاب فعال است: `openclaw hooks list`
2. فرایند gateway خود را دوباره راه‌اندازی کنید تا قلاب‌ها دوباره بارگذاری شوند.
3. لاگ‌های gateway را بررسی کنید: `./scripts/clawlog.sh | grep hook`

## مرتبط

- [مرجع CLI: هوک‌ها](/fa/cli/hooks)
- [Webhookها](/fa/automation/cron-jobs#webhooks)
- [هوک‌های Plugin](/fa/plugins/hooks) — هوک‌های چرخهٔ عمر درون‌فرایندی Plugin
- [پیکربندی](/fa/gateway/configuration-reference#hooks)

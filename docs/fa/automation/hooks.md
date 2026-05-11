---
read_when:
    - برای /new، /reset، /stop و رویدادهای چرخهٔ حیات عامل، خودکارسازی رویدادمحور می‌خواهید
    - می‌خواهید هوک‌ها را بسازید، نصب کنید یا اشکال‌زدایی کنید
summary: 'هوک‌ها: خودکارسازی رویدادمحور برای فرمان‌ها و رویدادهای چرخهٔ حیات'
title: هوک‌ها
x-i18n:
    generated_at: "2026-05-11T20:20:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

Hooks اسکریپت‌های کوچکی هستند که وقتی چیزی داخل Gateway رخ می‌دهد اجرا می‌شوند. آن‌ها می‌توانند از دایرکتوری‌ها کشف شوند و با `openclaw hooks` بررسی شوند. Gateway فقط پس از آن‌که hooks را فعال کنید یا دست‌کم یک ورودی hook، بسته hook، handler قدیمی، یا دایرکتوری hook اضافی پیکربندی کنید، hooks داخلی را بارگذاری می‌کند.

در OpenClaw دو نوع hook وجود دارد:

- **hooks داخلی** (این صفحه): هنگام رخ دادن رویدادهای agent، مانند `/new`، `/reset`، `/stop`، یا رویدادهای چرخه عمر، داخل Gateway اجرا می‌شوند.
- **Webhookها**: نقاط پایانی HTTP خارجی که به سیستم‌های دیگر اجازه می‌دهند کاری را در OpenClaw آغاز کنند. [Webhookها](/fa/automation/cron-jobs#webhooks) را ببینید.

Hooks همچنین می‌توانند داخل Pluginها بسته‌بندی شوند. `openclaw hooks list` هم hooks مستقل و هم hooks مدیریت‌شده توسط Plugin را نشان می‌دهد.

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
| `session:compact:before` | پیش از آن‌که Compaction تاریخچه را خلاصه کند               |
| `session:compact:after`  | پس از کامل شدن Compaction                                  |
| `session:patch`          | وقتی ویژگی‌های session تغییر می‌کنند                      |
| `agent:bootstrap`        | پیش از تزریق فایل‌های bootstrap فضای کاری                  |
| `gateway:startup`        | پس از شروع channelها و بارگذاری hooks                      |
| `gateway:shutdown`       | وقتی خاموش شدن gateway آغاز می‌شود                         |
| `gateway:pre-restart`    | پیش از restart موردانتظار gateway                          |
| `message:received`       | پیام ورودی از هر channel                                   |
| `message:transcribed`    | پس از کامل شدن رونویسی صوت                                 |
| `message:preprocessed`   | پس از کامل شدن یا رد شدن پیش‌پردازش رسانه و پیوندها       |
| `message:sent`           | پیام خروجی تحویل داده شد                                  |

## نوشتن hooks

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

| فیلد       | توضیح                                                     |
| ---------- | --------------------------------------------------------- |
| `emoji`    | ایموجی نمایش برای CLI                                     |
| `events`   | آرایه‌ای از رویدادهایی که باید شنیده شوند                 |
| `export`   | export نام‌داری که باید استفاده شود (پیش‌فرض `"default"`) |
| `os`       | پلتفرم‌های لازم (مثلا `["darwin", "linux"]`)              |
| `requires` | مسیرهای لازم `bins`، `anyBins`، `env`، یا `config`         |
| `always`   | عبور از بررسی‌های واجد شرایط بودن (boolean)               |
| `install`  | روش‌های نصب                                               |

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

هر رویداد شامل این موارد است: `type`، `action`، `sessionKey`، `timestamp`، `messages` (برای ارسال به کاربر به آن push کنید)، و `context` (داده‌های مخصوص رویداد). contextهای hook مربوط به agent و tool plugin همچنین می‌توانند `trace` را شامل شوند؛ یک context رهگیری تشخیصی فقط‌خواندنی سازگار با W3C که Pluginها ممکن است برای هم‌بستگی OTEL آن را به لاگ‌های ساختاریافته بدهند.

### نکات برجسته context رویداد

**رویدادهای دستور** (`command:new`، `command:reset`): `context.sessionEntry`، `context.previousSessionEntry`، `context.commandSource`، `context.workspaceDir`، `context.cfg`.

**رویدادهای پیام** (`message:received`): `context.from`، `context.content`، `context.channelId`، `context.metadata` (داده‌های مخصوص provider شامل `senderId`، `senderName`، `guildId`). `context.content` برای پیام‌های شبیه دستور، بدنه دستور غیرخالی را ترجیح می‌دهد، سپس به بدنه خام ورودی و بدنه عمومی برمی‌گردد؛ شامل غنی‌سازی‌های فقط مخصوص agent مانند تاریخچه thread یا خلاصه‌های پیوند نیست.

**رویدادهای پیام** (`message:sent`): `context.to`، `context.content`، `context.success`، `context.channelId`.

**رویدادهای پیام** (`message:transcribed`): `context.transcript`، `context.from`، `context.channelId`، `context.mediaPath`.

**رویدادهای پیام** (`message:preprocessed`): `context.bodyForAgent` (بدنه نهایی غنی‌شده)، `context.from`، `context.channelId`.

**رویدادهای Bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (آرایه قابل‌تغییر)، `context.agentId`.

**رویدادهای patch کردن session** (`session:patch`): `context.sessionEntry`، `context.patch` (فقط فیلدهای تغییرکرده)، `context.cfg`. فقط clientهای دارای امتیاز می‌توانند رویدادهای patch را trigger کنند.

**رویدادهای Compaction**: `session:compact:before` شامل `messageCount`، `tokenCount` است. `session:compact:after` این موارد را اضافه می‌کند: `compactedCount`، `summaryLength`، `tokensBefore`، `tokensAfter`.

`command:stop` صدور `/stop` توسط کاربر را مشاهده می‌کند؛ این چرخه عمر لغو/دستور است، نه gate نهایی‌سازی agent. Pluginهایی که باید پاسخ نهایی طبیعی را بررسی کنند و از agent یک گذر دیگر بخواهند، باید به‌جای آن از hook نوع‌دار Plugin یعنی `before_agent_finalize` استفاده کنند. [hooks Plugin](/fa/plugins/hooks) را ببینید.

**رویدادهای چرخه عمر Gateway**: `gateway:shutdown` شامل `reason` و `restartExpectedMs` است و وقتی خاموش شدن gateway آغاز می‌شود اجرا می‌شود. `gateway:pre-restart` همان context را شامل می‌شود، اما فقط زمانی اجرا می‌شود که خاموشی بخشی از یک restart موردانتظار باشد و مقدار محدود `restartExpectedMs` ارائه شده باشد. هنگام خاموشی، انتظار برای هر hook چرخه عمر best-effort و محدود است تا اگر handler متوقف شد، خاموشی ادامه پیدا کند.

بین رویداد `gateway:shutdown` (یا `gateway:pre-restart`) و باقی دنباله خاموشی، gateway همچنین برای هر session که هنگام توقف فرایند هنوز فعال بوده، یک hook نوع‌دار Plugin به نام `session_end` اجرا می‌کند. مقدار `reason` رویداد برای توقف ساده SIGTERM/SIGINT برابر `shutdown` و وقتی بستن به‌عنوان بخشی از یک restart موردانتظار زمان‌بندی شده باشد برابر `restart` است. این drain محدود است تا یک handler کند `session_end` نتواند خروج فرایند را مسدود کند، و sessionهایی که قبلا از طریق replace / reset / delete / compaction نهایی شده‌اند برای جلوگیری از اجرای دوباره رد می‌شوند.

## کشف hook

Hooks از این دایرکتوری‌ها، به‌ترتیب اولویت override افزایشی، کشف می‌شوند:

1. **hooks بسته‌بندی‌شده**: همراه OpenClaw ارائه می‌شوند
2. **hooks Plugin**: hooks بسته‌بندی‌شده داخل Pluginهای نصب‌شده
3. **hooks مدیریت‌شده**: `~/.openclaw/hooks/` (نصب‌شده توسط کاربر، مشترک بین فضاهای کاری). دایرکتوری‌های اضافی از `hooks.internal.load.extraDirs` همین اولویت را دارند.
4. **hooks فضای کاری**: `<workspace>/hooks/` (برای هر agent، تا وقتی صریحا فعال نشود به‌صورت پیش‌فرض غیرفعال است)

Hooks فضای کاری می‌توانند نام‌های hook جدید اضافه کنند، اما نمی‌توانند hooks بسته‌بندی‌شده، مدیریت‌شده، یا ارائه‌شده توسط Plugin را که همان نام را دارند override کنند.

Gateway در زمان startup تا وقتی hooks داخلی پیکربندی نشده باشند، کشف hook داخلی را رد می‌کند. برای opt in، یک hook بسته‌بندی‌شده یا مدیریت‌شده را با `openclaw hooks enable <name>` فعال کنید، یک بسته hook نصب کنید، یا `hooks.internal.enabled=true` را تنظیم کنید. وقتی یک hook نام‌دار را فعال می‌کنید، Gateway فقط handler همان hook را بارگذاری می‌کند؛ `hooks.internal.enabled=true`، دایرکتوری‌های hook اضافی، و handlerهای قدیمی وارد کشف گسترده می‌شوند.

### بسته‌های hook

بسته‌های hook پکیج‌های npm هستند که hooks را از طریق `openclaw.hooks` در `package.json` export می‌کنند. با این دستور نصب کنید:

```bash
openclaw plugins install <path-or-spec>
```

مشخصه‌های Npm فقط registry هستند (نام پکیج + نسخه دقیق اختیاری یا dist-tag). مشخصه‌های Git/URL/file و بازه‌های semver رد می‌شوند.

## hooks بسته‌بندی‌شده

| Hook                  | رویدادها                                         | کاری که انجام می‌دهد                                             |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | context session را در `<workspace>/memory/` ذخیره می‌کند          |
| bootstrap-extra-files | `agent:bootstrap`                                 | فایل‌های bootstrap اضافی را از الگوهای glob تزریق می‌کند          |
| command-logger        | `command`                                         | همه دستورها را در `~/.openclaw/logs/commands.log` لاگ می‌کند      |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | هنگام شروع/پایان Compaction session اعلان‌های چت قابل‌مشاهده می‌فرستد |
| boot-md               | `gateway:startup`                                 | هنگام شروع gateway، `BOOT.md` را اجرا می‌کند                     |

فعال کردن هر hook بسته‌بندی‌شده:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### جزئیات session-memory

آخرین 15 پیام کاربر/assistant را استخراج می‌کند و با استفاده از تاریخ محلی host در `<workspace>/memory/YYYY-MM-DD-HHMM.md` ذخیره می‌کند. ثبت memory در پس‌زمینه اجرا می‌شود تا acknowledgementهای `/new` و `/reset` به‌خاطر خواندن transcript یا تولید اختیاری slug به تاخیر نیفتند. برای تولید slugهای توصیفی نام فایل با مدل پیکربندی‌شده، `hooks.internal.entries.session-memory.llmSlug: true` را تنظیم کنید. لازم است `workspace.dir` پیکربندی شده باشد.

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

مسیرها نسبت به workspace resolve می‌شوند. فقط basenameهای bootstrap شناخته‌شده بارگذاری می‌شوند (`AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`، `MEMORY.md`).

<a id="command-logger"></a>

### جزئیات command-logger

هر دستور slash را در `~/.openclaw/logs/commands.log` لاگ می‌کند.

<a id="compaction-notifier"></a>

### جزئیات compaction-notifier

وقتی OpenClaw فشرده‌سازی transcript session را شروع و تمام می‌کند، پیام‌های وضعیت کوتاه را به گفت‌وگوی فعلی می‌فرستد. این کار turnهای طولانی را روی سطح‌های چت کمتر گیج‌کننده می‌کند، چون کاربر می‌تواند ببیند assistant در حال خلاصه کردن context است و پس از Compaction ادامه می‌دهد.

<a id="boot-md"></a>

### جزئیات boot-md

هنگام شروع gateway، `BOOT.md` را از workspace فعال اجرا می‌کند.

## hooks Plugin

Pluginها می‌توانند برای یکپارچگی عمیق‌تر، hooks نوع‌دار را از طریق Plugin SDK ثبت کنند: رهگیری tool callها، تغییر promptها، کنترل جریان پیام، و موارد دیگر. وقتی به `before_tool_call`، `before_agent_reply`، `before_install`، یا hookهای دیگر چرخه عمر درون‌فرایندی نیاز دارید، از hooks Plugin استفاده کنید.

برای مرجع کامل hookهای Plugin، [hooks Plugin](/fa/plugins/hooks) را ببینید.

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
قالب پیکربندی قدیمی آرایهٔ `hooks.internal.handlers` همچنان برای سازگاری با نسخه‌های پیشین پشتیبانی می‌شود، اما هوک‌های جدید باید از سامانهٔ مبتنی بر کشف استفاده کنند.
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
- **خطاها را با وقار مدیریت کنید.** عملیات پرریسک را در try/catch بپیچید؛ خطا پرتاب نکنید تا handlerهای دیگر بتوانند اجرا شوند.
- **رویدادها را زود فیلتر کنید.** اگر نوع/کنش رویداد مرتبط نیست، فوراً برگردید.
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

نبودن binaryها (PATH)، متغیرهای محیطی، مقادیر پیکربندی، یا سازگاری با سیستم‌عامل را بررسی کنید.

### هوک اجرا نمی‌شود

1. بررسی کنید هوک فعال باشد: `openclaw hooks list`
2. فرایند Gateway خود را بازراه‌اندازی کنید تا هوک‌ها دوباره بارگذاری شوند.
3. لاگ‌های Gateway را بررسی کنید: `./scripts/clawlog.sh | grep hook`

## مرتبط

- [مرجع CLI: هوک‌ها](/fa/cli/hooks)
- [Webhookها](/fa/automation/cron-jobs#webhooks)
- [هوک‌های Plugin](/fa/plugins/hooks) — هوک‌های چرخهٔ عمر Plugin درون‌فرایندی
- [پیکربندی](/fa/gateway/configuration-reference#hooks)

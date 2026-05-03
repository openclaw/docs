---
read_when:
    - به خودکارسازی مبتنی بر رویداد برای /new، /reset، /stop و رویدادهای چرخهٔ حیات عامل نیاز دارید
    - می‌خواهید هوک‌ها را بسازید، نصب کنید یا اشکال‌زدایی کنید
summary: 'هوک‌ها: خودکارسازی رویدادمحور برای دستورها و رویدادهای چرخهٔ عمر'
title: هوک‌ها
x-i18n:
    generated_at: "2026-05-03T21:27:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Hooks اسکریپت‌های کوچکی هستند که وقتی چیزی داخل Gateway رخ می‌دهد اجرا می‌شوند. آن‌ها را می‌توان از دایرکتوری‌ها کشف کرد و با `openclaw hooks` بررسی کرد. Gateway هوک‌های داخلی را فقط پس از فعال‌کردن هوک‌ها یا پیکربندی حداقل یک ورودی هوک، بسته هوک، هندلر قدیمی، یا دایرکتوری هوک اضافی بارگذاری می‌کند.

در OpenClaw دو نوع هوک وجود دارد:

- **هوک‌های داخلی** (این صفحه): هنگام رخ‌دادن رویدادهای عامل، مانند `/new`، `/reset`، `/stop`، یا رویدادهای چرخه عمر، داخل Gateway اجرا می‌شوند.
- **Webhookها**: نقاط پایانی HTTP خارجی که به سیستم‌های دیگر اجازه می‌دهند کاری را در OpenClaw آغاز کنند. [Webhookها](/fa/automation/cron-jobs#webhooks) را ببینید.

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
| `command:new`            | فرمان `/new` صادر شود                                      |
| `command:reset`          | فرمان `/reset` صادر شود                                    |
| `command:stop`           | فرمان `/stop` صادر شود                                     |
| `command`                | هر رویداد فرمان (شنونده عمومی)                       |
| `session:compact:before` | قبل از اینکه Compaction تاریخچه را خلاصه کند                       |
| `session:compact:after`  | پس از تکمیل Compaction                                 |
| `session:patch`          | وقتی ویژگی‌های نشست تغییر می‌کنند                       |
| `agent:bootstrap`        | قبل از تزریق فایل‌های بوت‌استرپ فضای کاری              |
| `gateway:startup`        | پس از شروع کانال‌ها و بارگذاری هوک‌ها                  |
| `gateway:shutdown`       | وقتی خاموش‌سازی Gateway آغاز می‌شود                               |
| `gateway:pre-restart`    | قبل از راه‌اندازی مجدد مورد انتظار Gateway                         |
| `message:received`       | پیام ورودی از هر کانال                           |
| `message:transcribed`    | پس از تکمیل رونویسی صوت                        |
| `message:preprocessed`   | پس از تکمیل یا رد شدن پیش‌پردازش رسانه و پیوند |
| `message:sent`           | پیام خروجی تحویل داده شد                                 |

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
| `events`   | آرایه‌ای از رویدادهایی که باید به آن‌ها گوش داده شود                        |
| `export`   | خروجی نام‌داری که باید استفاده شود (پیش‌فرض `"default"`)        |
| `os`       | پلتفرم‌های مورد نیاز (مثلاً `["darwin", "linux"]`)     |
| `requires` | مسیرهای `bins`، `anyBins`، `env`، یا `config` مورد نیاز |
| `always`   | دورزدن بررسی‌های واجد شرایط بودن (بولی)                  |
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

هر رویداد شامل این موارد است: `type`، `action`، `sessionKey`، `timestamp`، `messages` (برای ارسال به کاربر push کنید)، و `context` (داده‌های مختص رویداد). زمینه‌های هوک عامل و Plugin ابزار همچنین می‌توانند شامل `trace` باشند؛ یک زمینه ردگیری تشخیصی فقط‌خواندنی و سازگار با W3C که Pluginها می‌توانند برای هم‌بستگی OTEL به لاگ‌های ساخت‌یافته منتقل کنند.

### نکات برجسته زمینه رویداد

**رویدادهای فرمان** (`command:new`، `command:reset`): `context.sessionEntry`، `context.previousSessionEntry`، `context.commandSource`، `context.workspaceDir`، `context.cfg`.

**رویدادهای پیام** (`message:received`): `context.from`، `context.content`، `context.channelId`، `context.metadata` (داده‌های مخصوص ارائه‌دهنده شامل `senderId`، `senderName`، `guildId`). `context.content` برای پیام‌های شبیه فرمان، ابتدا بدنه فرمان غیرخالی را ترجیح می‌دهد، سپس به بدنه ورودی خام و بدنه عمومی برمی‌گردد؛ غنی‌سازی‌های فقط مخصوص عامل مانند تاریخچه رشته یا خلاصه‌های پیوند را شامل نمی‌شود.

**رویدادهای پیام** (`message:sent`): `context.to`، `context.content`، `context.success`، `context.channelId`.

**رویدادهای پیام** (`message:transcribed`): `context.transcript`، `context.from`، `context.channelId`، `context.mediaPath`.

**رویدادهای پیام** (`message:preprocessed`): `context.bodyForAgent` (بدنه نهایی غنی‌شده)، `context.from`، `context.channelId`.

**رویدادهای بوت‌استرپ** (`agent:bootstrap`): `context.bootstrapFiles` (آرایه قابل تغییر)، `context.agentId`.

**رویدادهای وصله نشست** (`session:patch`): `context.sessionEntry`، `context.patch` (فقط فیلدهای تغییرکرده)، `context.cfg`. فقط کلاینت‌های دارای امتیاز می‌توانند رویدادهای وصله را فعال کنند.

**رویدادهای Compaction**: `session:compact:before` شامل `messageCount`، `tokenCount` است. `session:compact:after` مقادیر `compactedCount`، `summaryLength`، `tokensBefore`، `tokensAfter` را اضافه می‌کند.

`command:stop` صدور `/stop` توسط کاربر را مشاهده می‌کند؛ این مربوط به لغو/چرخه عمر فرمان است، نه یک دروازه نهایی‌سازی عامل. Pluginهایی که باید پاسخ نهایی طبیعی را بررسی کنند و از عامل یک گذر دیگر بخواهند، باید به‌جای آن از هوک تایپ‌شده Plugin با نام `before_agent_finalize` استفاده کنند. [هوک‌های Plugin](/fa/plugins/hooks) را ببینید.

**رویدادهای چرخه عمر Gateway**: `gateway:shutdown` شامل `reason` و `restartExpectedMs` است و وقتی خاموش‌سازی Gateway آغاز می‌شود اجرا می‌شود. `gateway:pre-restart` همان زمینه را شامل می‌شود اما فقط وقتی اجرا می‌شود که خاموش‌سازی بخشی از یک راه‌اندازی مجدد مورد انتظار باشد و مقدار محدود `restartExpectedMs` ارائه شده باشد. هنگام خاموش‌سازی، انتظار برای هر هوک چرخه عمر به‌صورت بهترین تلاش و محدود انجام می‌شود تا اگر هندلری متوقف شد، خاموش‌سازی ادامه یابد.

## کشف هوک

هوک‌ها از این دایرکتوری‌ها، به ترتیب افزایش اولویت بازنویسی، کشف می‌شوند:

1. **هوک‌های همراه**: همراه OpenClaw ارائه می‌شوند
2. **هوک‌های Plugin**: هوک‌هایی که داخل Pluginهای نصب‌شده بسته‌بندی شده‌اند
3. **هوک‌های مدیریت‌شده**: `~/.openclaw/hooks/` (نصب‌شده توسط کاربر، مشترک بین فضاهای کاری). دایرکتوری‌های اضافی از `hooks.internal.load.extraDirs` نیز همین اولویت را دارند.
4. **هوک‌های فضای کاری**: `<workspace>/hooks/` (برای هر عامل، به‌طور پیش‌فرض غیرفعال تا زمانی که صراحتاً فعال شود)

هوک‌های فضای کاری می‌توانند نام‌های هوک جدید اضافه کنند، اما نمی‌توانند هوک‌های همراه، مدیریت‌شده، یا ارائه‌شده توسط Plugin با همان نام را بازنویسی کنند.

Gateway هنگام شروع، کشف هوک داخلی را تا زمانی که هوک‌های داخلی پیکربندی نشده باشند رد می‌کند. یک هوک همراه یا مدیریت‌شده را با `openclaw hooks enable <name>` فعال کنید، یک بسته هوک نصب کنید، یا برای اعلام انتخاب آگاهانه `hooks.internal.enabled=true` را تنظیم کنید. وقتی یک هوک نام‌دار را فعال می‌کنید، Gateway فقط هندلر همان هوک را بارگذاری می‌کند؛ `hooks.internal.enabled=true`، دایرکتوری‌های هوک اضافی، و هندلرهای قدیمی، کشف گسترده را فعال می‌کنند.

### بسته‌های هوک

بسته‌های هوک، بسته‌های npm هستند که هوک‌ها را از طریق `openclaw.hooks` در `package.json` صادر می‌کنند. با این دستور نصب کنید:

```bash
openclaw plugins install <path-or-spec>
```

مشخصات Npm فقط از رجیستری هستند (نام بسته + نسخه دقیق اختیاری یا dist-tag). مشخصات Git/URL/file و بازه‌های semver رد می‌شوند.

## هوک‌های همراه

| هوک                  | رویدادها                                            | کاری که انجام می‌دهد                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | زمینه نشست را در `<workspace>/memory/` ذخیره می‌کند                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | فایل‌های بوت‌استرپ اضافی را از الگوهای glob تزریق می‌کند          |
| command-logger        | `command`                                         | همه فرمان‌ها را در `~/.openclaw/logs/commands.log` لاگ می‌کند           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | هنگام شروع/پایان Compaction نشست، اعلان‌های چت قابل مشاهده ارسال می‌کند |
| boot-md               | `gateway:startup`                                 | هنگام شروع Gateway، `BOOT.md` را اجرا می‌کند                         |

فعال‌کردن هر هوک همراه:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### جزئیات session-memory

آخرین ۱۵ پیام کاربر/دستیار را استخراج می‌کند، از طریق LLM یک نام فایل توصیفی به‌شکل slug تولید می‌کند، و با استفاده از تاریخ محلی میزبان در `<workspace>/memory/YYYY-MM-DD-slug.md` ذخیره می‌کند. نیازمند پیکربندی `workspace.dir` است.

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

هر فرمان اسلش را در `~/.openclaw/logs/commands.log` لاگ می‌کند.

<a id="compaction-notifier"></a>

### جزئیات compaction-notifier

وقتی OpenClaw شروع به Compaction رونوشت نشست می‌کند و آن را به پایان می‌رساند، پیام‌های وضعیت کوتاه را به گفت‌وگوی جاری ارسال می‌کند. این کار نوبت‌های طولانی را در سطوح چت کمتر گیج‌کننده می‌کند، چون کاربر می‌تواند ببیند دستیار در حال خلاصه‌سازی زمینه است و پس از Compaction ادامه خواهد داد.

<a id="boot-md"></a>

### جزئیات boot-md

هنگام شروع Gateway، `BOOT.md` را از فضای کاری فعال اجرا می‌کند.

## هوک‌های Plugin

Pluginها می‌توانند برای یکپارچه‌سازی عمیق‌تر از طریق Plugin SDK هوک‌های تایپ‌شده ثبت کنند: رهگیری فراخوانی‌های ابزار، تغییر promptها، کنترل جریان پیام، و موارد بیشتر. وقتی به `before_tool_call`، `before_agent_reply`، `before_install`، یا دیگر هوک‌های چرخه عمر درون‌فرآیندی نیاز دارید، از هوک‌های Plugin استفاده کنید.

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
قالب پیکربندی قدیمی آرایه `hooks.internal.handlers` همچنان برای سازگاری رو به عقب پشتیبانی می‌شود، اما هوک‌های جدید باید از سیستم مبتنی بر کشف استفاده کنند.
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

- **handlerها را سریع نگه دارید.** hookها هنگام پردازش دستور اجرا می‌شوند. کارهای سنگین را به‌صورت بدون انتظار برای نتیجه با `void processInBackground(event)` اجرا کنید.
- **خطاها را با ظرافت مدیریت کنید.** عملیات پرریسک را در try/catch بپیچید؛ throw نکنید تا handlerهای دیگر بتوانند اجرا شوند.
- **رویدادها را زود فیلتر کنید.** اگر نوع/action رویداد مرتبط نیست، بلافاصله return کنید.
- **از کلیدهای رویداد مشخص استفاده کنید.** برای کاهش سربار، `"events": ["command:new"]` را به `"events": ["command"]` ترجیح دهید.

## عیب‌یابی

### hook پیدا نمی‌شود

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### hook واجد شرایط نیست

```bash
openclaw hooks info my-hook
```

وجود binaryهای گم‌شده (PATH)، متغیرهای محیطی، مقادیر پیکربندی، یا سازگاری با سیستم‌عامل را بررسی کنید.

### hook اجرا نمی‌شود

1. بررسی کنید hook فعال باشد: `openclaw hooks list`
2. فرایند Gateway خود را restart کنید تا hookها دوباره بارگذاری شوند.
3. لاگ‌های Gateway را بررسی کنید: `./scripts/clawlog.sh | grep hook`

## مرتبط

- [مرجع CLI: hookها](/fa/cli/hooks)
- [Webhookها](/fa/automation/cron-jobs#webhooks)
- [hookهای Plugin](/fa/plugins/hooks) — hookهای چرخه عمر Plugin درون‌فرایندی
- [پیکربندی](/fa/gateway/configuration-reference#hooks)

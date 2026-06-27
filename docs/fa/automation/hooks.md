---
read_when:
    - خودکارسازی رویدادمحور برای /new، /reset، /stop و رویدادهای چرخهٔ حیات عامل می‌خواهید
    - می‌خواهید هوک‌ها را بسازید، نصب کنید یا اشکال‌زدایی کنید
summary: 'قلاب‌ها: خودکارسازی رویدادمحور برای فرمان‌ها و رویدادهای چرخه حیات'
title: هوک‌ها
x-i18n:
    generated_at: "2026-06-27T17:09:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

هوک‌ها اسکریپت‌های کوچکی هستند که وقتی چیزی داخل Gateway رخ می‌دهد اجرا می‌شوند. آن‌ها می‌توانند از دایرکتوری‌ها کشف شوند و با `openclaw hooks` بررسی شوند. Gateway فقط بعد از اینکه هوک‌ها را فعال کنید یا دست‌کم یک ورودی هوک، بسته هوک، handler قدیمی، یا دایرکتوری هوک اضافی پیکربندی کنید، هوک‌های داخلی را بارگذاری می‌کند.

در OpenClaw دو نوع هوک وجود دارد:

- **هوک‌های داخلی** (این صفحه): داخل Gateway هنگام رخ دادن رویدادهای عامل اجرا می‌شوند، مانند `/new`، `/reset`، `/stop`، یا رویدادهای چرخه حیات.
- **Webhookها**: endpointهای HTTP خارجی که به سیستم‌های دیگر اجازه می‌دهند کاری را در OpenClaw راه‌اندازی کنند. [Webhookها](/fa/automation/cron-jobs#webhooks) را ببینید.

هوک‌ها همچنین می‌توانند داخل pluginها بسته‌بندی شوند. `openclaw hooks list` هم هوک‌های مستقل و هم هوک‌های مدیریت‌شده توسط plugin را نشان می‌دهد.

## سطح مناسب را انتخاب کنید

OpenClaw چندین سطح افزونه دارد که مشابه به نظر می‌رسند اما مسائل متفاوتی را حل می‌کنند:

| اگر می‌خواهید...                                                                                                     | استفاده کنید از...                                | چرا                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| روی `/new` یک snapshot ذخیره کنید، `/reset` را log کنید، بعد از `message:sent` یک API خارجی را فراخوانی کنید، یا اتوماسیون کلی اپراتور اضافه کنید | هوک‌های داخلی (`HOOK.md`، این صفحه) | هوک‌های مبتنی بر فایل برای side effectهای مدیریت‌شده توسط اپراتور و اتوماسیون دستور/چرخه حیات در نظر گرفته شده‌اند |
| promptها را بازنویسی کنید، ابزارها را مسدود کنید، پیام‌های خروجی را لغو کنید، یا middleware/سیاست ترتیبی اضافه کنید                              | هوک‌های plugin تایپ‌شده از طریق `api.on(...)`  | هوک‌های تایپ‌شده قراردادهای صریح، اولویت‌ها، قواعد ادغام، و semantics مسدودسازی/لغو دارند      |
| خروجی telemetry-only یا observability اضافه کنید                                                                            | رویدادهای تشخیصی                     | observability یک event bus جداگانه است، نه یک سطح هوک سیاست                              |

وقتی اتوماسیونی می‌خواهید که مانند یک integration کوچک نصب‌شده رفتار کند، از هوک‌های داخلی استفاده کنید. وقتی به کنترل چرخه حیات runtime نیاز دارید، از هوک‌های plugin تایپ‌شده استفاده کنید.

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

| رویداد                    | چه زمانی رخ می‌دهد                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | دستور `/new` صادر شده است                                      |
| `command:reset`          | دستور `/reset` صادر شده است                                    |
| `command:stop`           | دستور `/stop` صادر شده است                                     |
| `command`                | هر رویداد دستور (شنونده عمومی)                       |
| `session:compact:before` | پیش از اینکه Compaction تاریخچه را خلاصه کند                       |
| `session:compact:after`  | پس از تکمیل Compaction                                 |
| `session:patch`          | وقتی ویژگی‌های session تغییر می‌کنند                       |
| `agent:bootstrap`        | پیش از تزریق فایل‌های bootstrap در workspace              |
| `gateway:startup`        | پس از شروع channelها و بارگذاری هوک‌ها                  |
| `gateway:shutdown`       | وقتی shutdown کردن gateway آغاز می‌شود                               |
| `gateway:pre-restart`    | پیش از restart مورد انتظار gateway                         |
| `message:received`       | پیام ورودی از هر channel                           |
| `message:transcribed`    | پس از تکمیل transcription صوت                        |
| `message:preprocessed`   | پس از تکمیل یا رد شدن preprocessing رسانه و لینک |
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

**فیلدهای metadata** (`metadata.openclaw`):

| فیلد      | توضیح                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | emoji نمایشی برای CLI                                |
| `events`   | آرایه‌ای از رویدادها برای گوش دادن                        |
| `export`   | export نام‌گذاری‌شده برای استفاده (پیش‌فرض `"default"`)        |
| `os`       | platformهای موردنیاز (مثلاً `["darwin", "linux"]`)     |
| `requires` | مسیرهای `bins`، `anyBins`، `env`، یا `config` موردنیاز |
| `always`   | دور زدن بررسی‌های eligibility (boolean)                  |
| `install`  | روش‌های نصب                                 |

### پیاده‌سازی handler

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

هر رویداد شامل این موارد است: `type`، `action`، `sessionKey`، `timestamp`، `messages` (پاسخ‌ها را فقط روی سطح‌های قابل پاسخ‌گویی اینجا push کنید)، و `context` (داده‌های مخصوص رویداد). contextهای هوک plugin عامل و ابزار همچنین می‌توانند `trace` را شامل شوند، یک context trace تشخیصی فقط‌خواندنی سازگار با W3C که pluginها ممکن است برای هم‌بستگی OTEL به structured logها پاس بدهند.

`event.messages` فقط روی سطح‌های قابل پاسخ‌گویی مانند
`command:*` و `message:received` به‌صورت خودکار تحویل داده می‌شود. رویدادهای صرفاً چرخه حیات مانند
`agent:bootstrap`، `session:*`، `gateway:*`، یا `message:sent` کانال
پاسخ ندارند و پیام‌های pushشده را نادیده می‌گیرند.

### نکات مهم context رویداد

**رویدادهای دستور** (`command:new`، `command:reset`): `context.sessionEntry`، `context.previousSessionEntry`، `context.commandSource`، `context.workspaceDir`، `context.cfg`.

**رویدادهای پیام** (`message:received`): `context.from`، `context.content`، `context.channelId`، `context.metadata` (داده‌های مخصوص provider شامل `senderId`، `senderName`، `guildId`). `context.content` برای پیام‌های شبیه دستور، بدنه دستور غیرخالی را ترجیح می‌دهد، سپس به بدنه ورودی خام و بدنه عمومی fallback می‌کند؛ شامل enrichmentهای فقط عامل مانند تاریخچه thread یا خلاصه‌های لینک نیست.

**رویدادهای پیام** (`message:sent`): `context.to`، `context.content`، `context.success`، `context.channelId`.

**رویدادهای پیام** (`message:transcribed`): `context.transcript`، `context.from`، `context.channelId`، `context.mediaPath`.

**رویدادهای پیام** (`message:preprocessed`): `context.bodyForAgent` (بدنه enriched نهایی)، `context.from`، `context.channelId`.

**رویدادهای Bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (آرایه قابل تغییر)، `context.agentId`.

**رویدادهای patch session** (`session:patch`): `context.sessionEntry`، `context.patch` (فقط فیلدهای تغییرکرده)، `context.cfg`. فقط clientهای privileged می‌توانند رویدادهای patch را راه‌اندازی کنند.

**رویدادهای Compaction**: `session:compact:before` شامل `messageCount`، `tokenCount` است. `session:compact:after` مقادیر `compactedCount`، `summaryLength`، `tokensBefore`، `tokensAfter` را اضافه می‌کند.

`command:stop` صدور `/stop` توسط کاربر را مشاهده می‌کند؛ این چرخه حیات لغو/دستور است،
نه یک gate نهایی‌سازی عامل. Pluginهایی که نیاز دارند یک پاسخ نهایی طبیعی را بررسی کنند
و از عامل یک گذر دیگر بخواهند باید به‌جای آن از هوک plugin تایپ‌شده
`before_agent_finalize` استفاده کنند. [هوک‌های Plugin](/fa/plugins/hooks) را ببینید.

**رویدادهای چرخه حیات Gateway**: `gateway:shutdown` شامل `reason` و `restartExpectedMs` است و وقتی shutdown کردن gateway آغاز می‌شود رخ می‌دهد. `gateway:pre-restart` همان context را شامل می‌شود اما فقط وقتی رخ می‌دهد که shutdown بخشی از یک restart مورد انتظار باشد و مقدار finite `restartExpectedMs` ارائه شود. در طول shutdown، انتظار برای هر هوک چرخه حیات best-effort و bounded است تا اگر handler متوقف شد، shutdown ادامه پیدا کند. بودجه انتظار پیش‌فرض برای `gateway:shutdown` برابر ۵ ثانیه و برای `gateway:pre-restart` برابر ۱۰ ثانیه است.

برای noticeهای کوتاه restart در حالی که channelها هنوز در دسترس هستند، از `gateway:pre-restart` استفاده کنید:

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

بین رویداد `gateway:shutdown` (یا `gateway:pre-restart`) و ادامه sequence shutdown، gateway همچنین برای هر session که هنگام توقف process هنوز active بوده است، یک هوک plugin تایپ‌شده `session_end` را fire می‌کند. `reason` رویداد برای توقف ساده SIGTERM/SIGINT برابر `shutdown` و وقتی close به‌عنوان بخشی از restart مورد انتظار schedule شده باشد برابر `restart` است. این drain محدود است تا handler کند `session_end` نتواند خروج process را مسدود کند، و sessionهایی که از قبل از طریق replace / reset / delete / compaction نهایی شده‌اند skip می‌شوند تا از double-firing جلوگیری شود.

## کشف هوک

هوک‌ها از این دایرکتوری‌ها کشف می‌شوند، به ترتیب افزایش اولویت override:

1. **هوک‌های bundled**: همراه OpenClaw ارائه می‌شوند
2. **هوک‌های Plugin**: هوک‌هایی که داخل pluginهای نصب‌شده بسته‌بندی شده‌اند
3. **هوک‌های managed**: `~/.openclaw/hooks/` (نصب‌شده توسط کاربر، مشترک میان workspaceها). دایرکتوری‌های اضافی از `hooks.internal.load.extraDirs` این اولویت را به اشتراک می‌گذارند.
4. **هوک‌های Workspace**: `<workspace>/hooks/` (برای هر عامل، به‌صورت پیش‌فرض غیرفعال تا وقتی صریحاً فعال شود)

هوک‌های Workspace می‌توانند نام‌های هوک جدید اضافه کنند اما نمی‌توانند هوک‌های bundled، managed، یا ارائه‌شده توسط plugin با همان نام را override کنند.

Gateway هنگام startup تا وقتی هوک‌های داخلی پیکربندی نشده باشند، کشف هوک داخلی را skip می‌کند. یک هوک bundled یا managed را با `openclaw hooks enable <name>` فعال کنید، یک بسته هوک نصب کنید، یا `hooks.internal.enabled=true` را تنظیم کنید تا opt in کنید. وقتی یک هوک نام‌دار را فعال می‌کنید، Gateway فقط handler همان هوک را بارگذاری می‌کند؛ `hooks.internal.enabled=true`، دایرکتوری‌های هوک اضافی، و handlerهای قدیمی به کشف گسترده opt in می‌کنند.

### بسته‌های هوک

بسته‌های هوک packageهای npm هستند که هوک‌ها را از طریق `openclaw.hooks` در `package.json` export می‌کنند. با این دستور نصب کنید:

```bash
openclaw plugins install <path-or-spec>
```

specهای npm فقط registry هستند (نام package + نسخه exact اختیاری یا dist-tag). specهای Git/URL/file و semver rangeها رد می‌شوند.

## هوک‌های bundled

| هوک                  | رویدادها                                            | کاری که انجام می‌دهد                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | زمینهٔ نشست را در `<workspace>/memory/` ذخیره می‌کند                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | فایل‌های راه‌اندازی اضافی را از الگوهای glob تزریق می‌کند          |
| command-logger        | `command`                                         | همهٔ فرمان‌ها را در `~/.openclaw/logs/commands.log` ثبت می‌کند           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | وقتی Compaction نشست شروع/تمام می‌شود اعلان‌های قابل مشاهده در چت می‌فرستد |
| boot-md               | `gateway:startup`                                 | هنگام شروع Gateway، `BOOT.md` را اجرا می‌کند                         |

هر هوک بسته‌بندی‌شده‌ای را فعال کنید:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### جزئیات session-memory

آخرین ۱۵ پیام کاربر/دستیار را استخراج می‌کند و با استفاده از تاریخ محلی میزبان در `<workspace>/memory/YYYY-MM-DD-HHMM.md` ذخیره می‌کند. ثبت حافظه در پس‌زمینه اجرا می‌شود تا تأییدهای `/new` و `/reset` به‌خاطر خواندن رونوشت یا تولید اختیاری slug به تأخیر نیفتند. برای تولید slugهای توصیفی نام فایل با مدل پیکربندی‌شده، `hooks.internal.entries.session-memory.llmSlug: true` را تنظیم کنید. لازم است `workspace.dir` پیکربندی شده باشد.

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

مسیرها نسبت به فضای کاری resolve می‌شوند. فقط basenameهای شناخته‌شدهٔ راه‌اندازی بارگذاری می‌شوند (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### جزئیات command-logger

هر فرمان اسلش را در `~/.openclaw/logs/commands.log` ثبت می‌کند.

<a id="compaction-notifier"></a>

### جزئیات compaction-notifier

وقتی OpenClaw فشرده‌سازی رونوشت نشست را شروع و تمام می‌کند، پیام‌های کوتاه وضعیت را به گفت‌وگوی فعلی می‌فرستد. این کار نوبت‌های طولانی را در سطح‌های چت کمتر گیج‌کننده می‌کند، چون کاربر می‌تواند ببیند که دستیار در حال خلاصه‌سازی زمینه است و پس از Compaction ادامه خواهد داد.

<a id="boot-md"></a>

### جزئیات boot-md

وقتی Gateway شروع می‌شود، `BOOT.md` را از فضای کاری فعال اجرا می‌کند.

## هوک‌های Plugin

Pluginها می‌توانند برای یکپارچه‌سازی عمیق‌تر، هوک‌های typed را از طریق Plugin SDK ثبت کنند:
رهگیری فراخوانی‌های ابزار، تغییر promptها، کنترل جریان پیام، و موارد دیگر.
وقتی به `before_tool_call`، `before_agent_reply`،
`before_install`، یا سایر هوک‌های چرخه‌حیات درون‌فرایندی نیاز دارید، از هوک‌های Plugin استفاده کنید.

هوک‌های داخلی مدیریت‌شده توسط Plugin متفاوت‌اند: آن‌ها در سامانهٔ رویداد command/lifecycle درشت‌دانهٔ این صفحه شرکت می‌کنند و در `openclaw hooks list` به‌صورت
`plugin:<id>` نمایش داده می‌شوند. از آن‌ها برای اثرات جانبی و سازگاری با بسته‌های هوک استفاده کنید، نه
برای middleware ترتیبی یا دروازه‌های policy.

برای مرجع کامل هوک Plugin، [هوک‌های Plugin](/fa/plugins/hooks) را ببینید.

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
قالب پیکربندی قدیمی آرایهٔ `hooks.internal.handlers` همچنان برای سازگاری پسرو پشتیبانی می‌شود، اما هوک‌های جدید باید از سامانهٔ مبتنی بر کشف استفاده کنند.
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

- **handlerها را سریع نگه دارید.** هوک‌ها هنگام پردازش فرمان اجرا می‌شوند. کارهای سنگین را با `void processInBackground(event)` به‌صورت fire-and-forget اجرا کنید.
- **خطاها را با ظرافت مدیریت کنید.** عملیات پرخطر را در try/catch بپیچید؛ throw نکنید تا handlerهای دیگر بتوانند اجرا شوند.
- **رویدادها را زود فیلتر کنید.** اگر نوع/کنش رویداد مرتبط نیست، بلافاصله برگردید.
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

نبود binaryها (PATH)، متغیرهای محیطی، مقدارهای پیکربندی، یا سازگاری سیستم‌عامل را بررسی کنید.

### هوک اجرا نمی‌شود

1. بررسی کنید هوک فعال است: `openclaw hooks list`
2. فرایند Gateway خود را بازراه‌اندازی کنید تا هوک‌ها دوباره بارگذاری شوند.
3. لاگ‌های Gateway را بررسی کنید: `./scripts/clawlog.sh | grep hook`

## مرتبط

- [مرجع CLI: هوک‌ها](/fa/cli/hooks)
- [Webhookها](/fa/automation/cron-jobs#webhooks)
- [هوک‌های Plugin](/fa/plugins/hooks) — هوک‌های چرخه‌حیات Plugin درون‌فرایندی
- [پیکربندی](/fa/gateway/configuration-reference#hooks)

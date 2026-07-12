---
read_when:
    - پیکربندی خط‌مشی `tools.*`، فهرست‌های مجاز یا قابلیت‌های آزمایشی
    - ثبت ارائه‌دهندگان سفارشی یا بازنویسی URLهای پایه
    - راه‌اندازی نقاط پایانی خودمیزبان سازگار با OpenAI
sidebarTitle: Tools and custom providers
summary: پیکربندی ابزارها (سیاست، گزینه‌های آزمایشی، ابزارهای مبتنی بر ارائه‌دهنده) و راه‌اندازی ارائه‌دهنده سفارشی/نشانی اینترنتی پایه
title: پیکربندی — ابزارها و ارائه‌دهندگان سفارشی
x-i18n:
    generated_at: "2026-07-12T09:59:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

کلیدهای پیکربندی `tools.*` و تنظیم ارائه‌دهنده سفارشی / URL پایه. برای عامل‌ها، کانال‌ها و دیگر کلیدهای پیکربندی سطح‌بالا، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## ابزارها

### نمایه‌های ابزار

`tools.profile` پیش از `tools.allow`/`tools.deny` یک فهرست مجاز پایه تعیین می‌کند:

<Note>
راه‌اندازی اولیه محلی، در صورت تنظیم‌نبودن، مقدار پیش‌فرض پیکربندی‌های محلی جدید را روی `tools.profile: "coding"` قرار می‌دهد (نمایه‌های صریح موجود حفظ می‌شوند).
</Note>

| نمایه       | شامل                                                                                                                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | فقط `session_status`                                                                                                                                                                                                         |
| `coding`    | `group:fs`، `group:runtime`، `group:web`، `group:sessions`، `group:memory`، `cron`، `get_goal`، `create_goal`، `update_goal`، `update_plan`، `skill_workshop`، `image`، `image_generate`، `music_generate`، `video_generate` |
| `messaging` | `group:messaging`، `sessions_list`، `sessions_history`، `sessions_send`، `session_status`                                                                                                                                    |
| `full`      | بدون محدودیت (همانند تنظیم‌نشده)                                                                                                                                                                                             |

`coding` و `messaging` به‌طور ضمنی `bundle-mcp` (سرورهای MCP پیکربندی‌شده) را نیز مجاز می‌کنند.

### گروه‌های ابزار

| گروه               | ابزارها                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`، `process`، `code_execution` (`bash` به‌عنوان نام مستعار `exec` پذیرفته می‌شود)                                                                        |
| `group:fs`         | `read`، `write`، `edit`، `apply_patch`                                                                                                                        |
| `group:sessions`   | `sessions_list`، `sessions_history`، `sessions_send`، `sessions_spawn`، `sessions_yield`، `subagents`، `session_status`، `spawn_task`، `dismiss_task` |
| `group:memory`     | `memory_search`، `memory_get`                                                                                                                                 |
| `group:web`        | `web_search`، `x_search`، `web_fetch`                                                                                                                         |
| `group:ui`         | `browser`، `canvas`                                                                                                                                           |
| `group:automation` | `heartbeat_respond`، `cron`، `gateway`                                                                                                                        |
| `group:messaging`  | `message`                                                                                                                                                     |
| `group:nodes`      | `nodes`، `computer`                                                                                                                                           |
| `group:agents`     | `agents_list`، `get_goal`، `create_goal`، `update_goal`، `update_plan`، `skill_workshop`                                                                      |
| `group:media`      | `image`، `image_generate`، `music_generate`، `video_generate`، `tts`                                                                                          |
| `group:openclaw`   | همه ابزارهای داخلی بالا به‌جز `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (ابزارهای Plugin را شامل نمی‌شود)                                 |
| `group:plugins`    | ابزارهای متعلق به Pluginهای بارگذاری‌شده، از جمله سرورهای MCP پیکربندی‌شده‌ای که از طریق `bundle-mcp` ارائه می‌شوند                                           |

`spawn_task` به یک عامل کدنویسی اجازه می‌دهد بدون آغاز کار، کار پیگیریِ تأییدشده‌ای را پیشنهاد کند. رابط کاربری کنترل، عنوان و خلاصه را به‌صورت یک تراشه قابل اقدام نمایش می‌دهد؛ یک TUI با پشتوانه Gateway نیز یک درخواست تعاملی معادل نشان می‌دهد. پذیرش هرکدام، یک نشست تازه با درخت‌کاری مدیریت‌شده ایجاد می‌کند و درحالی‌که نوبت جاری ادامه دارد، درخواست کامل را به آن می‌فرستد. `dismiss_task` پیشنهادی را که هنوز در انتظار است، با استفاده از `task_id` موقتی بازگردانده‌شده از `spawn_task` پس می‌گیرد.

این ابزارها فقط زمانی ارائه می‌شوند که سطح اپراتوری آغازکننده بتواند رویدادهای پیشنهاد وظیفه Gateway را دریافت و اجرا کند. نشست‌های کانال و نشست‌های TUI محلی/تعبیه‌شده آن‌ها را دریافت نمی‌کنند؛ انتقال‌های کانال پیش از آن‌که بتوانند این جریان را با ایمنی ارائه دهند، به یک کنش وظیفه نوع‌دار و قابل‌حمل نیاز دارند. پیشنهادها محلیِ فرایند هستند و با راه‌اندازی مجدد Gateway ناپدید می‌شوند. هر دو ابزار در نمایه `coding` و `group:sessions` باقی می‌مانند؛ بنابراین سیاست عادی `tools.allow` و `tools.deny`، وقتی سطح از آن‌ها پشتیبانی کند، آن‌ها را به‌طور خودکار پیکربندی می‌کند.

### ابزارهای MCP و Plugin در سیاست ابزار محیط ایزوله

سرورهای MCP پیکربندی‌شده، تحت شناسه Plugin یعنی `bundle-mcp` به‌صورت ابزارهای متعلق به Plugin ارائه می‌شوند. نمایه‌های عادی ابزار می‌توانند آن‌ها را مجاز کنند، اما `tools.sandbox.tools` دروازه‌ای افزوده برای نشست‌های محیط ایزوله است. اگر حالت محیط ایزوله `"all"` یا `"non-main"` باشد، هنگامی که ابزارهای MCP/Plugin باید قابل مشاهده باشند، یکی از ورودی‌های زیر را در فهرست مجاز ابزارهای محیط ایزوله قرار دهید:

- `bundle-mcp` برای سرورهای MCP مدیریت‌شده توسط OpenClaw از `mcp.servers`
- شناسه Plugin برای یک Plugin بومی مشخص
- `group:plugins` برای همه ابزارهای متعلق به Pluginهای بارگذاری‌شده
- نام دقیق ابزارهای سرور MCP یا الگوهای فراگیر سرور، مانند `outlook__send_mail` یا `outlook__*`، وقتی فقط یک سرور را می‌خواهید

الگوهای فراگیر سرور از پیشوند سرور MCP ایمن برای ارائه‌دهنده استفاده می‌کنند، نه لزوماً کلید خام `mcp.servers`. نویسه‌های غیر از `[A-Za-z0-9_-]` به `-` تبدیل می‌شوند، نام‌هایی که با حرف آغاز نمی‌شوند پیشوند `mcp-` می‌گیرند و پیشوندهای طولانی یا تکراری ممکن است کوتاه شوند یا پسوند بگیرند؛ برای نمونه، `mcp.servers["Outlook Graph"]` از الگویی مانند `outlook-graph__*` استفاده می‌کند.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

بدون آن ورودی در لایه محیط ایزوله، سرور MCP همچنان می‌تواند با موفقیت بارگذاری شود، درحالی‌که ابزارهایش پیش از درخواست ارائه‌دهنده پالایش می‌شوند. برای تشخیص این ساختار در سرورهای مدیریت‌شده توسط OpenClaw در `mcp.servers` از `openclaw doctor` استفاده کنید. سرورهای MCP بارگذاری‌شده از مانیفست‌های Plugin همراه یا فایل `.mcp.json` مربوط به Claude از همان دروازه محیط ایزوله استفاده می‌کنند، اما این عیب‌یابی هنوز آن منابع را فهرست نمی‌کند؛ اگر ابزارهایشان در نوبت‌های محیط ایزوله ناپدید شدند، از همان ورودی‌های فهرست مجاز استفاده کنید.

### `tools.codeMode`

`tools.codeMode` سطح عمومی حالت کد OpenClaw را فعال می‌کند. وقتی برای اجرایی دارای ابزار فعال باشد، ابزارهای عادی OpenClaw به پشت پل کاتالوگ `tools.*` درون محیط ایزوله منتقل می‌شوند و ابزارهای MCP از طریق فضای نام تولیدشده `MCP` در دسترس قرار می‌گیرند. مدل معمولاً `exec` و `wait` را می‌بیند؛ ابزارهایی مانند `computer` که نتایج ساخت‌یافته آن‌ها نمی‌تواند از پل صرفاً JSON عبور کند، مستقیم باقی می‌مانند.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

شکل کوتاه نیز پذیرفته می‌شود:

```json5
{
  tools: { codeMode: true },
}
```

اعلان‌های MCP در حالت کد از طریق سطح فایل API مجازی فقط‌خواندنی ارائه می‌شوند. کد مهمان می‌تواند پیش از فراخوانی `MCP.<server>.<tool>()`، با فراخوانی `API.list("mcp")` و `API.read("mcp/<server>.d.ts")` امضاهای به‌سبک TypeScript را بررسی کند. برای قرارداد زمان اجرا، محدودیت‌ها و مراحل اشکال‌زدایی، [حالت کد](/fa/reference/code-mode) را ببینید.

### `tools.allow` / `tools.deny`

سیاست سراسری مجاز/غیرمجاز بودن ابزارها (غیرمجاز اولویت دارد). به بزرگی و کوچکی حروف حساس نیست و از نویسه‌های عام `*` پشتیبانی می‌کند. حتی وقتی محیط ایزولهٔ Docker خاموش است نیز اعمال می‌شود.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` و `apply_patch` شناسه‌های ابزار جداگانه‌ای هستند. `allow: ["write"]` برای مدل‌های سازگار، `apply_patch` را نیز فعال می‌کند، اما `deny: ["write"]` دسترسی به `apply_patch` را منع نمی‌کند. برای مسدود کردن هرگونه تغییر فایل، `group:fs` را غیرمجاز کنید یا هر ابزار تغییردهنده را به‌صراحت فهرست کنید:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` و `alsoAllow` را نمی‌توان هم‌زمان در یک محدوده (`tools`، `tools.byProvider.<id>`، `agents.list[].tools`) تنظیم کرد؛ اعتبارسنجی پیکربندی آن را رد می‌کند. ورودی‌های `alsoAllow` را در `allow` ادغام کنید، یا `allow` را حذف کنید و به‌جای آن از `profile` همراه با `alsoAllow` استفاده کنید.
</Note>

### `tools.byProvider`

ابزارها را برای ارائه‌دهندگان یا مدل‌های خاص بیشتر محدود می‌کند. ترتیب: نمایهٔ پایه ← نمایهٔ ارائه‌دهنده ← مجاز/غیرمجاز.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

ابزارها را برای هویت درخواست‌کننده‌ای خاص محدود می‌کند. این سازوکاری برای دفاع چندلایه در کنار کنترل دسترسی کانال است؛ مقادیر فرستنده باید از مبدل کانال بیایند، نه از متن پیام.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

کلیدها از پیشوندهای صریح استفاده می‌کنند: `channel:<channelId>:<senderId>`، `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>` یا `"*"`. شناسه‌های کانال، شناسه‌های معیار OpenClaw هستند؛ نام‌های مستعاری مانند `teams` به `msteams` نرمال‌سازی می‌شوند. کلیدهای قدیمیِ بدون پیشوند فقط به‌عنوان `id:` پذیرفته می‌شوند. ترتیب تطبیق عبارت است از کانال+شناسه، شناسه، e164، نام کاربری، نام و سپس نویسهٔ عام.

تنظیمات هر عامل در `agents.list[].tools.toolsBySender`، در صورت تطبیق، سیاست سراسریِ منطبق با فرستنده را بازنویسی می‌کند؛ حتی اگر سیاست آن یک `{}` خالی باشد.

### `tools.elevated`

دسترسی اجرای ارتقایافته در خارج از محیط ایزوله را کنترل می‌کند:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- بازنویسی هر عامل (`agents.list[].tools.elevated`) فقط می‌تواند محدودیت بیشتری اعمال کند.
- `/elevated on|off|ask|full` وضعیت را برای هر نشست ذخیره می‌کند؛ دستورهای درون‌خطی فقط بر یک پیام اعمال می‌شوند.
- `exec` ارتقایافته، محیط ایزوله را دور می‌زند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (`gateway` به‌صورت پیش‌فرض، یا `node` هنگامی که مقصد اجرا `node` است).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

مقادیر نمایش‌داده‌شده، به‌جز `applyPatch.allowModels`، مقادیر پیش‌فرض هستند (`applyPatch.allowModels` به‌صورت پیش‌فرض خالی/تنظیم‌نشده است؛ یعنی هر مدل سازگاری می‌تواند از `apply_patch` استفاده کند). اگر اجرای نیازمند تأیید طولانی شود، `approvalRunningNoticeMs` اعلان در حال اجرا صادر می‌کند؛ مقدار `0` آن را غیرفعال می‌کند.

### `tools.loopDetection`

بررسی‌های ایمنی حلقهٔ ابزار **به‌صورت پیش‌فرض غیرفعال هستند**. برای فعال‌سازی تشخیص، `enabled: true` را تنظیم کنید. تنظیمات را می‌توان به‌صورت سراسری در `tools.loopDetection` تعریف کرد و برای هر عامل در `agents.list[].tools.loopDetection` بازنویسی کرد.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  حداکثر سابقهٔ فراخوانی ابزار که برای تحلیل حلقه نگه‌داری می‌شود.
</ParamField>
<ParamField path="warningThreshold" type="number">
  آستانهٔ الگوی تکراری بدون پیشرفت برای هشدارها.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  پس از این تعداد عدم موفقیت، فراخوانی‌های تکراری همان نام ابزار ناموجود یا ناشناخته را مسدود می‌کند.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  آستانهٔ تکرار بالاتر برای مسدودکردن حلقه‌های بحرانی.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  آستانهٔ توقف قطعی برای هر اجرای بدون پیشرفت.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  دربارهٔ فراخوانی‌های تکراری با ابزار و آرگومان‌های یکسان هشدار می‌دهد.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  دربارهٔ ابزارهای پیمایش وضعیت شناخته‌شده (`process.poll`، `command_status` و غیره) هشدار می‌دهد یا آن‌ها را مسدود می‌کند.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  دربارهٔ الگوهای جفتی متناوب و بدون پیشرفت هشدار می‌دهد یا آن‌ها را مسدود می‌کند.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  تعداد تلاش‌هایی که پس از Compaction خودکار، محافظ در آن‌ها فعال می‌ماند؛ اگر عامل در این بازه همان (ابزار، آرگومان‌ها، نتیجه) را تکرار کند، اجرا متوقف می‌شود.
</ParamField>

<Warning>
اگر `warningThreshold >= criticalThreshold` یا `criticalThreshold >= globalCircuitBreakerThreshold` باشد، اعتبارسنجی ناموفق خواهد بود.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

مقادیر نمایش‌داده‌شده به‌جز `provider` و `userAgent` مقادیر پیش‌فرض هستند. `maxResponseBytes` به بازهٔ ۳۲۰۰۰ تا ۱۰۰۰۰۰۰۰ محدود می‌شود؛ `maxChars` نیز به `maxCharsCap` محدود می‌شود (برای مجازکردن پاسخ‌های بزرگ‌تر، `maxCharsCap` را افزایش دهید).

### `tools.media`

درک رسانه‌های ورودی (تصویر/صدا/ویدئو) را پیکربندی می‌کند:

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

`concurrency` (پیش‌فرض `2`)، ‏`audio.maxBytes` (پیش‌فرض ۲۰ مگابایت) و `video.maxBytes` (پیش‌فرض ۵۰ مگابایت) با مقادیر پیش‌فرضشان نمایش داده شده‌اند؛ مقدار پیش‌فرض `image.maxBytes` برابر با ۱۰ مگابایت است. زمان‌انتظار پیش‌فرض درخواست برای هر قابلیت: تصویر/صدا `60` ثانیه و ویدئو `120` ثانیه.

<AccordionGroup>
  <Accordion title="فیلدهای ورودی مدل رسانه">
    **ورودی ارائه‌دهنده** (`type: "provider"` یا حذف‌شده):

    - `provider`: شناسهٔ ارائه‌دهندهٔ API‏ (`openai`، ‏`anthropic`، ‏`google`/`gemini`، ‏`groq` و غیره)
    - `model`: بازنویسی شناسهٔ مدل
    - `profile` / `preferredProfile`: انتخاب نمایه از `auth-profiles.json`

    **ورودی CLI** (`type: "cli"`):

    - `command`: فایل اجرایی برای اجرا
    - `args`: آرگومان‌های قالب‌دار (از `{{MediaPath}}`، ‏`{{Prompt}}`، ‏`{{MaxChars}}` و غیره پشتیبانی می‌کند؛ `openclaw doctor --fix` جای‌نگهدارهای منسوخ‌شدهٔ `{input}` را به `{{MediaPath}}` منتقل می‌کند)

    **فیلدهای مشترک:**

    - `capabilities`: فهرست اختیاری (`image`، ‏`audio`، ‏`video`). هر Plugin ارائه‌دهنده مجموعهٔ قابلیت‌های پیش‌فرض خود را اعلام می‌کند؛ برای نمونه، ارائه‌دهندهٔ همراه `openai` به‌طور پیش‌فرض تصویر+صدا، ‏`anthropic`/`minimax` تصویر، ‏`google` تصویر+صدا+ویدئو و `groq` صدا را ارائه می‌دهد.
    - `prompt`، ‏`maxChars`، ‏`maxBytes`، ‏`timeoutSeconds`، ‏`language`: بازنویسی‌های مخصوص هر ورودی.
    - ورودی‌های `tools.media.image.timeoutSeconds` و `timeoutSeconds` مدل تصویر متناظر، هنگامی که عامل ابزار صریح `image` را فراخوانی می‌کند نیز اعمال می‌شوند. برای درک تصویر، این زمان‌انتظار به خود درخواست مربوط است و به‌دلیل کارهای آماده‌سازی قبلی کاهش نمی‌یابد.
    - در صورت شکست، ورودی بعدی امتحان می‌شود.

    احراز هویت ارائه‌دهنده از ترتیب استاندارد پیروی می‌کند: `auth-profiles.json` ← متغیرهای محیطی ← `models.providers.*.apiKey`.

    **فیلدهای تکمیل ناهمگام:**

    - `asyncCompletion.directSend`: پرچم سازگاری منسوخ‌شده. وظایف رسانه‌ای ناهمگام تکمیل‌شده همچنان با واسطهٔ نشست درخواست‌کننده باقی می‌مانند تا عامل نتیجه را دریافت کند، تصمیم بگیرد چگونه آن را به کاربر اعلام کند و هنگامی که تحویل به مبدأ مستلزم آن است، از ابزار پیام استفاده کند.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

کنترل می‌کند ابزارهای نشست (`sessions_list`، ‏`sessions_history`، ‏`sessions_send`) کدام نشست‌ها را می‌توانند هدف قرار دهند.

پیش‌فرض: `tree` (نشست جاری + نشست‌هایی که توسط آن ایجاد شده‌اند، مانند زیرعامل‌ها).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="دامنه‌های مشاهده‌پذیری">
    - `self`: فقط کلید نشست جاری.
    - `tree`: نشست جاری + نشست‌هایی که نشست جاری ایجاد کرده است (زیرعامل‌ها).
    - `agent`: هر نشستی که متعلق به شناسهٔ عامل جاری باشد (اگر نشست‌های مخصوص هر فرستنده را زیر یک شناسهٔ عامل اجرا کنید، ممکن است کاربران دیگر را نیز شامل شود).
    - `all`: هر نشست. هدف‌گیری بین عامل‌ها همچنان به `tools.agentToAgent` نیاز دارد.
    - محدودیت سندباکس: وقتی نشست جاری در سندباکس است و `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (مقدار پیش‌فرض) تنظیم شده، حتی اگر `tools.sessions.visibility="all"` باشد، مشاهده‌پذیری به‌اجبار روی `tree` قرار می‌گیرد.
    - وقتی مقدار `all` نباشد، `sessions_list` یک فیلد فشردهٔ `visibility`
      را شامل می‌شود که حالت مؤثر را شرح می‌دهد و هشدار می‌دهد ممکن است برخی نشست‌های
      خارج از دامنهٔ جاری حذف شده باشند.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

پشتیبانی از پیوست درون‌خطی برای `sessions_spawn` را کنترل می‌کند.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="نکات پیوست">
    - پیوست‌ها به `enabled: true` نیاز دارند.
    - پیوست‌های زیرعامل در فضای کاری فرزند و در مسیر `.openclaw/attachments/<uuid>/` همراه با یک `.manifest.json` ایجاد می‌شوند.
    - پیوست‌های ACP فقط می‌توانند تصویر باشند و پس از عبور از همان محدودیت‌های تعداد فایل، بایت هر فایل و مجموع بایت‌ها، به‌صورت درون‌خطی به محیط اجرای ACP ارسال می‌شوند.
    - محتوای پیوست به‌طور خودکار از ذخیره‌سازی رونوشت حذف می‌شود.
    - ورودی‌های Base64 با بررسی سخت‌گیرانهٔ الفبا/فاصله‌گذاری و یک محافظ اندازه پیش از رمزگشایی اعتبارسنجی می‌شوند.
    - مجوزهای فایل پیوست زیرعامل برای دایرکتوری‌ها `0700` و برای فایل‌ها `0600` است.
    - پاک‌سازی زیرعامل از سیاست `cleanup` پیروی می‌کند: `delete` همیشه پیوست‌ها را حذف می‌کند؛ `keep` فقط هنگامی آن‌ها را نگه می‌دارد که `retainOnSessionKeep: true` باشد.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

پرچم‌های آزمایشی ابزارهای داخلی. به‌طور پیش‌فرض خاموش هستند، مگر اینکه قانون فعال‌سازی خودکار GPT-5 با عامل سخت‌گیرانه اعمال شود.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: ابزار ساختاریافتهٔ `update_plan` را برای پیگیری کارهای چندمرحله‌ای و غیرساده فعال می‌کند.
- پیش‌فرض: `false`، مگر اینکه `agents.defaults.embeddedAgent.executionContract` (یا بازنویسی مخصوص یک عامل) برای اجرای ارائه‌دهندهٔ `openai` با شناسهٔ مدلی از خانوادهٔ GPT-5 روی `"strict-agentic"` تنظیم شده باشد (این مورد اجراهای OpenAI Codex CLI را نیز پوشش می‌دهد، زیرا مسیریابی احراز هویت/مدل Codex زیر ارائه‌دهندهٔ `openai` قرار دارد). برای فعال‌کردن اجباری ابزار خارج از این دامنه، مقدار را روی `true` تنظیم کنید؛ یا برای خاموش نگه‌داشتن آن حتی در اجراهای GPT-5 با عامل سخت‌گیرانه، مقدار `false` را تنظیم کنید.
- هنگامی که فعال باشد، اعلان سیستمی نیز راهنمای استفاده را اضافه می‌کند تا مدل فقط برای کارهای اساسی از آن استفاده کند و حداکثر یک مرحله را در وضعیت `in_progress` نگه دارد.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: مدل پیش‌فرض برای زیرعامل‌های ایجادشده. اگر حذف شود، زیرعامل‌ها مدل فراخواننده را به ارث می‌برند.
- `allowAgents`: فهرست مجاز پیش‌فرض شناسه‌های عامل هدف پیکربندی‌شده برای `sessions_spawn`، هنگامی که عامل درخواست‌کننده `subagents.allowAgents` خود را تنظیم نکرده باشد (`["*"]` = هر هدف پیکربندی‌شده؛ پیش‌فرض: فقط همان عامل). ورودی‌های منسوخی که پیکربندی عامل آن‌ها حذف شده باشد توسط `sessions_spawn` رد و از `agents_list` حذف می‌شوند؛ برای پاک‌سازی آن‌ها `openclaw doctor --fix` را اجرا کنید.
- `maxConcurrent`: حداکثر تعداد اجرای هم‌زمان زیرعامل. پیش‌فرض: `8`.
- `runTimeoutSeconds`: زمان‌انتظار (برحسب ثانیه) برای `sessions_spawn`، هنگامی که فراخواننده بازنویسی خود را ارسال نکند. پیش‌فرض: `0` (بدون زمان‌انتظار)؛ مقدار `900` که در بالا نمایش داده شده، یک مقدار رایج انتخابی است و پیش‌فرض داخلی نیست.
- `announceTimeoutMs`: زمان‌انتظار هر فراخوانی (برحسب میلی‌ثانیه) برای تلاش‌های تحویل اعلان `agent` توسط Gateway. پیش‌فرض: `120000`. تلاش‌های مجدد موقت ممکن است مجموع زمان انتظار اعلان را از یک زمان‌انتظار پیکربندی‌شده بیشتر کنند.
- `archiveAfterMinutes`: تعداد دقیقه‌های پس از تکمیل نشست زیرعامل تا بایگانی خودکار آن. پیش‌فرض: `60`؛ مقدار `0` بایگانی خودکار را غیرفعال می‌کند.
- سیاست ابزار برای هر زیرعامل: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## ارائه‌دهندگان سفارشی و نشانی‌های پایه

Pluginهای ارائه‌دهنده، ردیف‌های فهرست مدل خود را منتشر می‌کنند. ارائه‌دهندگان سفارشی را از طریق `models.providers` در پیکربندی یا `~/.openclaw/agents/<agentId>/agent/models.json` اضافه کنید.

پیکربندی `baseUrl` برای یک ارائه‌دهندهٔ سفارشی/محلی، همان تصمیم محدود اعتماد شبکه برای درخواست‌های HTTP مدل نیز هست: OpenClaw دقیقاً همان مبدأ `scheme://host:port` را از مسیر واکشی محافظت‌شده مجاز می‌کند، بدون افزودن گزینهٔ پیکربندی جداگانه یا اعتماد به سایر مبدأهای خصوصی.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="احراز هویت و تقدم ادغام">
    - برای نیازهای سفارشی احراز هویت از `authHeader: true` به‌همراه `headers` استفاده کنید.
    - ریشهٔ پیکربندی عامل را با `OPENCLAW_AGENT_DIR` بازنویسی کنید.
    - تقدم ادغام برای شناسه‌های ارائه‌دهندهٔ منطبق:
      - مقادیر غیرخالی `baseUrl` در `models.json` عامل اولویت دارند.
      - مقادیر غیرخالی `apiKey` عامل فقط زمانی اولویت دارند که آن ارائه‌دهنده در زمینهٔ پیکربندی/نمایهٔ احراز هویت فعلی توسط SecretRef مدیریت نشود.
      - مقادیر `apiKey` ارائه‌دهندگان مدیریت‌شده با SecretRef، به‌جای ماندگار کردن اسرار حل‌شده، از نشانگرهای منبع (`ENV_VAR_NAME` برای ارجاع‌های محیطی و `secretref-managed` برای ارجاع‌های فایل/اجرا) تازه‌سازی می‌شوند.
      - مقادیر سربرگ ارائه‌دهندگان مدیریت‌شده با SecretRef از نشانگرهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های محیطی و `secretref-managed` برای ارجاع‌های فایل/اجرا) تازه‌سازی می‌شوند.
      - مقادیر خالی یا مفقود `apiKey`/`baseUrl` عامل به `models.providers` در پیکربندی بازمی‌گردند.
      - برای `contextWindow`/`maxTokens` مدل منطبق، مقدار صریح پیکربندی در صورت وجود و معتبر بودن (یک عدد مثبت و متناهی) اولویت دارد؛ در غیر این صورت، مقدار ضمنی/تولیدشدهٔ کاتالوگ استفاده می‌شود.
      - `contextTokens` مدل منطبق از همان قاعدهٔ «مقدار صریح در اولویت است، وگرنه مقدار ضمنی» پیروی می‌کند؛ از آن برای محدود کردن زمینهٔ مؤثر بدون تغییر فرادادهٔ بومی مدل استفاده کنید.
      - کاتالوگ‌های Plugin ارائه‌دهنده به‌شکل قطعه‌های کاتالوگ تولیدشده و متعلق به Plugin، در وضعیت Plugin عامل ذخیره می‌شوند.
      - وقتی می‌خواهید پیکربندی، `models.json` را کاملاً بازنویسی کند و ادغام قطعه‌های کاتالوگ متعلق به Plugin را نادیده بگیرد، از `models.mode: "replace"` استفاده کنید.
      - ماندگاری نشانگرها تابع منبع معتبر است: نشانگرها از تصویر لحظه‌ای پیکربندی منبع فعال (پیش از حل‌کردن) نوشته می‌شوند، نه از مقادیر اسرار حل‌شده در زمان اجرا.

  </Accordion>
</AccordionGroup>

### جزئیات فیلدهای ارائه‌دهنده

<AccordionGroup>
  <Accordion title="کاتالوگ سطح‌بالا">
    - `models.mode`: رفتار کاتالوگ ارائه‌دهنده (`merge` یا `replace`).
    - `models.providers`: نگاشت سفارشی ارائه‌دهندگان با کلید شناسهٔ ارائه‌دهنده.
      - ویرایش‌های ایمن: برای به‌روزرسانی‌های افزایشی از `openclaw config set models.providers.<id> '<json>' --strict-json --merge` یا `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌های مخرب را نمی‌پذیرد، مگر اینکه `--replace` را ارسال کنید.

  </Accordion>
  <Accordion title="اتصال و احراز هویت ارائه‌دهنده">
    - `models.providers.*.api`: سازگارکنندهٔ درخواست (`openai-completions`، `openai-responses`، `openai-chatgpt-responses`، `anthropic-messages`، `google-generative-ai`، `google-vertex`، `github-copilot`، `bedrock-converse-stream`، `ollama`، `azure-openai-responses`). برای بک‌اندهای خودمیزبان `/v1/chat/completions` مانند MLX، vLLM، SGLang و بیشتر سرورهای محلی سازگار با OpenAI، از `openai-completions` استفاده کنید. ارائه‌دهندهٔ سفارشی دارای `baseUrl` اما بدون `api`، به‌طور پیش‌فرض از `openai-completions` استفاده می‌کند؛ `openai-responses` را فقط زمانی تنظیم کنید که بک‌اند از `/v1/responses` پشتیبانی کند.
    - `models.providers.*.apiKey`: اعتبارنامهٔ ارائه‌دهنده (جایگزینی SecretRef/محیطی ترجیح داده می‌شود).
    - `models.providers.*.auth`: راهبرد احراز هویت (`api-key`، `token`، `oauth`، `aws-sdk`).
    - `models.providers.*.contextWindow`: پنجرهٔ زمینهٔ بومی پیش‌فرض برای مدل‌های این ارائه‌دهنده، هنگامی که ورودی مدل `contextWindow` را تنظیم نکرده باشد.
    - `models.providers.*.contextTokens`: سقف مؤثر پیش‌فرض زمینه در زمان اجرا برای مدل‌های این ارائه‌دهنده، هنگامی که ورودی مدل `contextTokens` را تنظیم نکرده باشد.
    - `models.providers.*.maxTokens`: سقف پیش‌فرض توکن‌های خروجی برای مدل‌های این ارائه‌دهنده، هنگامی که ورودی مدل `maxTokens` را تنظیم نکرده باشد.
    - `models.providers.*.timeoutSeconds`: مهلت زمانی اختیاری درخواست HTTP مدل به‌ازای هر ارائه‌دهنده، بر حسب ثانیه، شامل اتصال، سربرگ‌ها، بدنه و مدیریت لغو کلی درخواست.
    - `models.providers.*.injectNumCtxForOpenAICompat`: برای Ollama به‌همراه `openai-completions`، مقدار `options.num_ctx` را به درخواست‌ها تزریق می‌کند (پیش‌فرض: `true`).
    - `models.providers.*.authHeader`: در صورت نیاز، انتقال اعتبارنامه در سربرگ `Authorization` را اجباری می‌کند.
    - `models.providers.*.baseUrl`: نشانی پایهٔ API بالادستی.
    - `models.providers.*.headers`: سربرگ‌های ایستای اضافی برای مسیریابی پراکسی/مستأجر.

  </Accordion>
  <Accordion title="بازنویسی‌های انتقال درخواست">
    `models.providers.*.request`: بازنویسی‌های انتقال برای درخواست‌های HTTP ارائه‌دهندهٔ مدل.

    - `request.headers`: سربرگ‌های اضافی (ادغام‌شده با پیش‌فرض‌های ارائه‌دهنده). مقادیر SecretRef را می‌پذیرند.
    - `request.auth`: بازنویسی راهبرد احراز هویت. حالت‌ها: `"provider-default"` (استفاده از احراز هویت داخلی ارائه‌دهنده)، `"authorization-bearer"` (با `token`)، `"header"` (با `headerName`، `value` و `prefix` اختیاری).
    - `request.proxy`: بازنویسی پراکسی HTTP. حالت‌ها: `"env-proxy"` (استفاده از متغیرهای محیطی `HTTP_PROXY`/`HTTPS_PROXY`)، `"explicit-proxy"` (با `url`). هر دو حالت یک زیرشیء اختیاری `tls` می‌پذیرند.
    - `request.tls`: بازنویسی TLS برای اتصال‌های مستقیم. فیلدها: `ca`، `cert`، `key`، `passphrase` (همگی SecretRef را می‌پذیرند)، `serverName`، `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: وقتی `true` باشد، به درخواست‌های HTTP ارائه‌دهندهٔ مدل اجازه می‌دهد از محافظ واکشی HTTP ارائه‌دهنده به محدوده‌های خصوصی، CGNAT یا محدوده‌های مشابه دسترسی پیدا کنند. نشانی‌های پایهٔ ارائه‌دهندگان سفارشی/محلی از قبل دقیقاً به مبدأ پیکربندی‌شده اعتماد می‌کنند، به‌جز مبدأهای فراداده/پیوند-محلی که بدون پذیرش صریح همچنان مسدود می‌مانند. برای لغو اعتماد به مبدأ دقیق، این گزینه را روی `false` تنظیم کنید. WebSocket از همان `request` برای سربرگ‌ها/TLS استفاده می‌کند، اما مشمول آن دروازهٔ SSRF واکشی نیست. پیش‌فرض `false` است.

  </Accordion>
  <Accordion title="ورودی‌های کاتالوگ مدل">
    - `models.providers.*.models`: ورودی‌های صریح کاتالوگ مدل ارائه‌دهنده.
    - `models.providers.*.models.*.input`: شیوه‌های ورودی مدل. برای مدل‌های فقط متنی از `["text"]` و برای مدل‌های بومی تصویر/بینایی از `["text", "image"]` استفاده کنید. پیوست‌های تصویری فقط زمانی به نوبت‌های عامل تزریق می‌شوند که مدل انتخاب‌شده دارای قابلیت تصویر علامت‌گذاری شده باشد.
    - `models.providers.*.models.*.contextWindow`: فرادادهٔ پنجرهٔ زمینهٔ بومی مدل. این مقدار، `contextWindow` سطح ارائه‌دهنده را برای آن مدل بازنویسی می‌کند.
    - `models.providers.*.models.*.contextTokens`: سقف اختیاری زمینه در زمان اجرا. این مقدار، `contextTokens` سطح ارائه‌دهنده را بازنویسی می‌کند؛ زمانی از آن استفاده کنید که بودجهٔ مؤثر زمینه‌ای کوچک‌تر از `contextWindow` بومی مدل می‌خواهید؛ `openclaw models list` در صورت تفاوت، هر دو مقدار را نمایش می‌دهد.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: راهنمای اختیاری سازگاری. برای `api: "openai-completions"` با یک `baseUrl` غیرخالی و غیربومی (میزبان غیر از `api.openai.com`)، OpenClaw این مقدار را در زمان اجرا به `false` اجبار می‌کند. `baseUrl` خالی/حذف‌شده رفتار پیش‌فرض OpenAI را حفظ می‌کند.
    - `models.providers.*.models.*.compat.requiresStringContent`: راهنمای اختیاری سازگاری برای نقاط پایانی گفت‌وگوی سازگار با OpenAI که فقط رشته می‌پذیرند. وقتی `true` باشد، OpenClaw آرایه‌های صرفاً متنی `messages[].content` را پیش از ارسال درخواست به رشته‌های ساده تخت می‌کند.
    - `models.providers.*.models.*.compat.strictMessageKeys`: راهنمای اختیاری سازگاری برای نقاط پایانی سخت‌گیرانهٔ گفت‌وگوی سازگار با OpenAI. وقتی `true` باشد، OpenClaw اشیای پیام خروجی Chat Completions را پیش از ارسال درخواست به `role` و `content` محدود می‌کند.
    - `models.providers.*.models.*.compat.thinkingFormat`: راهنمای اختیاری محمولهٔ تفکر. برای `reasoning.enabled` به‌سبک Together از `"together"`، برای `enable_thinking` سطح‌بالا از `"qwen"`، یا برای `chat_template_kwargs.enable_thinking` در سرورهای سازگار با OpenAI خانوادهٔ Qwen که از آرگومان‌های کلیدی الگوی گفت‌وگو در سطح درخواست پشتیبانی می‌کنند، مانند vLLM، از `"qwen-chat-template"` استفاده کنید. مدل‌های Qwen پیکربندی‌شده در vLLM برای این قالب‌ها گزینه‌های دودویی `/think` (`off`، `on`) را ارائه می‌کنند.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: راهنمای اختیاری سازگاری برای بک‌اندهای Chat Completions به‌سبک DeepSeek که هنگام بازپخش، نیاز دارند پیام‌های پیشین دستیار `reasoning_content` را حفظ کنند. وقتی `true` باشد، OpenClaw آن فیلد را در پیام‌های خروجی دستیار حفظ می‌کند. هنگام اتصال یک پراکسی سفارشی سازگار با DeepSeek که درخواست‌ها را پس از حذف استدلال رد می‌کند، از این گزینه استفاده کنید. پیش‌فرض `false` است.

  </Accordion>
  <Accordion title="کشف Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: ریشهٔ تنظیمات کشف خودکار Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: کشف ضمنی را روشن/خاموش می‌کند.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقهٔ AWS برای کشف.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: پالایهٔ اختیاری شناسهٔ ارائه‌دهنده برای کشف هدفمند.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصلهٔ نظرسنجی برای تازه‌سازی کشف.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: پنجرهٔ زمینهٔ جایگزین برای مدل‌های کشف‌شده.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: حداکثر توکن‌های خروجی جایگزین برای مدل‌های کشف‌شده.

  </Accordion>
</AccordionGroup>

راه‌اندازی تعاملی ارائه‌دهندهٔ سفارشی، ورودی تصویر را برای الگوهای شناخته‌شدهٔ شناسهٔ مدل بینایی استنباط می‌کند؛ از جمله GPT-4o/GPT-4.1/GPT-5+، خانواده‌های استدلالی `o1`/`o3`/`o4`، Claude، Gemini، هر شناسه‌ای با پسوند `-vl` (Qwen-VL و موارد مشابه) و خانواده‌های نام‌گذاری‌شده‌ای مانند LLaVA، Pixtral، InternVL، Mllama، MiniCPM-V و GLM-4V. برای خانواده‌های شناخته‌شدهٔ فقط متنی (Llama، DeepSeek، Mistral/Mixtral، Kimi/Moonshot، Codestral، Devstral، Phi، QwQ، CodeLlama و شناسه‌های سادهٔ Qwen بدون پسوند vl/vision)، پرسش اضافی نادیده گرفته می‌شود. برای شناسه‌های مدل ناشناخته همچنان دربارهٔ پشتیبانی از تصویر پرسیده می‌شود. راه‌اندازی غیرتعاملی از همین استنباط استفاده می‌کند؛ برای اجبار فرادادهٔ دارای قابلیت تصویر، `--custom-image-input` و برای اجبار فرادادهٔ فقط متنی، `--custom-text-input` را ارسال کنید.

### نمونه‌های ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Cerebras ‏(GLM 4.7 / GPT OSS)">
    Plugin رسمی و خارجی ارائه‌دهندهٔ `cerebras` می‌تواند این مورد را از طریق `openclaw onboard --auth-choice cerebras-api-key` پیکربندی کند. فقط زمانی از پیکربندی صریح ارائه‌دهنده استفاده کنید که می‌خواهید پیش‌فرض‌ها را بازنویسی کنید.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    برای Cerebras از `cerebras/zai-glm-4.7` و برای اتصال مستقیم به Z.AI از `zai/glm-4.7` استفاده کنید.

  </Accordion>
  <Accordion title="کدنویسی Kimi">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    ارائه‌دهندهٔ داخلی و سازگار با Anthropic. میان‌بر: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="مدل‌های محلی (LM Studio)">
    به [مدل‌های محلی](/fa/gateway/local-models) مراجعه کنید. خلاصه: یک مدل محلی بزرگ را از طریق API پاسخ‌های LM Studio روی سخت‌افزاری قدرتمند اجرا کنید؛ مدل‌های میزبانی‌شده را برای استفاده به‌عنوان مسیر جایگزین در حالت ادغام‌شده نگه دارید.
  </Accordion>
  <Accordion title="MiniMax M3 (مستقیم)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    متغیر `MINIMAX_API_KEY` را تنظیم کنید. میان‌برها: `openclaw onboard --auth-choice minimax-global-api` یا `openclaw onboard --auth-choice minimax-cn-api`. کاتالوگ مدل به‌طور پیش‌فرض از M3 استفاده می‌کند و گونه‌های M2.7 را نیز شامل می‌شود. در مسیر جریانی سازگار با Anthropic، OpenClaw قابلیت تفکر MiniMax M2.x را به‌طور پیش‌فرض غیرفعال می‌کند، مگر آنکه خودتان `thinking` را صریحاً تنظیم کنید؛ MiniMax-M3 (و M3.x) به‌طور پیش‌فرض در مسیر تفکر حذف‌شده/تطبیقی ارائه‌دهنده باقی می‌ماند. `/fast on` یا `params.fastMode: true`، مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    برای نقطه پایانی چین: `baseUrl: "https://api.moonshot.cn/v1"` یا `openclaw onboard --auth-choice moonshot-api-key-cn`.

    نقاط پایانی بومی Moonshot، سازگاری مصرف در حالت جریانی را روی انتقال مشترک `openai-completions` اعلام می‌کنند و OpenClaw این قابلیت را بر اساس توانمندی‌های نقطه پایانی فعال می‌کند، نه صرفاً بر اساس شناسه داخلی ارائه‌دهنده.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    متغیر `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`) را تنظیم کنید. برای کاتالوگ Zen از ارجاع‌های `opencode/...` و برای کاتالوگ Go از ارجاع‌های `opencode-go/...` استفاده کنید. میان‌بر: `openclaw onboard --auth-choice opencode-zen` یا `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (سازگار با Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    نشانی پایه نباید شامل `/v1` باشد (کلاینت Anthropic آن را اضافه می‌کند). میان‌بر: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    متغیر `ZAI_API_KEY` را تنظیم کنید. ارجاع‌های مدل از شناسه متعارف ارائه‌دهنده `zai/*` استفاده می‌کنند. میان‌بر: `openclaw onboard --auth-choice zai-api-key`.

    - نقطه پایانی عمومی: `https://api.z.ai/api/paas/v4`
    - نقطه پایانی کدنویسی: `https://api.z.ai/api/coding/paas/v4`
    - گزینه احراز هویت پیش‌فرض `zai-api-key` کلید شما را بررسی می‌کند و به‌طور خودکار تشخیص می‌دهد که به کدام نقطه پایانی تعلق دارد (اگر تشخیص قطعی نباشد، یک پرسش نمایش می‌دهد که مقدار پیش‌فرض آن Global است). گزینه‌های احراز هویت اختصاصی CN و Coding-Plan نیز برای انتخاب صریح در دسترس هستند.
    - برای نقطه پایانی عمومی، یک ارائه‌دهنده سفارشی با بازنویسی نشانی پایه تعریف کنید.

  </Accordion>
</AccordionGroup>

---

## مرتبط

- [پیکربندی — عامل‌ها](/fa/gateway/config-agents)
- [پیکربندی — کانال‌ها](/fa/gateway/config-channels)
- [مرجع پیکربندی](/fa/gateway/configuration-reference) — سایر کلیدهای سطح بالا
- [ابزارها و Pluginها](/fa/tools)

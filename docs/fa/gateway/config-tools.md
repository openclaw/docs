---
read_when:
    - پیکربندی سیاست `tools.*`، فهرست‌های مجاز، یا ویژگی‌های آزمایشی
    - ثبت ارائه‌دهندگان سفارشی یا بازنویسی URLهای پایه
    - راه‌اندازی نقاط پایانی خودمیزبان سازگار با OpenAI
sidebarTitle: Tools and custom providers
summary: پیکربندی ابزارها (سیاست، کلیدهای آزمایشی، ابزارهای پشتیبانی‌شده توسط ارائه‌دهنده) و راه‌اندازی ارائه‌دهنده/URL پایهٔ سفارشی
title: پیکربندی — ابزارها و ارائه‌دهندگان سفارشی
x-i18n:
    generated_at: "2026-06-27T17:40:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` کلیدهای پیکربندی و راه‌اندازی ارائه‌دهنده سفارشی / نشانی پایه. برای عامل‌ها، کانال‌ها و دیگر کلیدهای پیکربندی سطح بالا، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## ابزارها

### پروفایل‌های ابزار

`tools.profile` پیش از `tools.allow`/`tools.deny` یک allowlist پایه تنظیم می‌کند:

<Note>
فرآیند راه‌اندازی محلی، پیکربندی‌های محلی جدید را وقتی تنظیم نشده باشند به‌صورت پیش‌فرض روی `tools.profile: "coding"` قرار می‌دهد (پروفایل‌های صریح موجود حفظ می‌شوند).
</Note>

| پروفایل     | شامل                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | فقط `session_status`                                                                                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | بدون محدودیت (همانند حالت تنظیم‌نشده)                                                                                                                    |

### گروه‌های ابزار

| گروه              | ابزارها                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` به‌عنوان نام مستعار برای `exec` پذیرفته می‌شود)                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | همه ابزارهای داخلی (Pluginهای ارائه‌دهنده را شامل نمی‌شود)                                                                          |
| `group:plugins`    | ابزارهای متعلق به Pluginهای بارگذاری‌شده، از جمله سرورهای MCP پیکربندی‌شده که از طریق `bundle-mcp` ارائه می‌شوند                            |

### ابزارهای MCP و Plugin در سیاست ابزار sandbox

سرورهای MCP پیکربندی‌شده به‌عنوان ابزارهای متعلق به Plugin زیر شناسه Plugin `bundle-mcp` ارائه می‌شوند. پروفایل‌های عادی ابزار می‌توانند آن‌ها را مجاز کنند، اما `tools.sandbox.tools` یک دروازه اضافی برای نشست‌های sandboxشده است. اگر حالت sandbox برابر `"all"` یا `"non-main"` باشد، وقتی ابزارهای MCP/Plugin باید قابل مشاهده باشند، یکی از این ورودی‌ها را در allowlist ابزار sandbox قرار دهید:

- `bundle-mcp` برای سرورهای MCP مدیریت‌شده توسط OpenClaw از `mcp.servers`
- شناسه Plugin برای یک Plugin بومی مشخص
- `group:plugins` برای همه ابزارهای متعلق به Pluginهای بارگذاری‌شده
- نام‌های دقیق ابزار سرور MCP یا globهای سرور مانند `outlook__send_mail` یا `outlook__*` وقتی فقط یک سرور را می‌خواهید

globهای سرور از پیشوند سرور MCP امن برای ارائه‌دهنده استفاده می‌کنند، نه لزوماً کلید خام `mcp.servers`. نویسه‌های غیر از `[A-Za-z0-9_-]` به `-` تبدیل می‌شوند، نام‌هایی که با حرف شروع نمی‌شوند پیشوند `mcp-` می‌گیرند، و پیشوندهای طولانی یا تکراری ممکن است کوتاه شوند یا پسوند بگیرند؛ برای مثال، `mcp.servers["Outlook Graph"]` از globی مانند `outlook-graph__*` استفاده می‌کند.

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

بدون آن ورودی لایه sandbox، سرور MCP همچنان می‌تواند با موفقیت بارگذاری شود، در حالی که ابزارهای آن پیش از درخواست ارائه‌دهنده فیلتر می‌شوند. برای تشخیص این شکل در سرورهای مدیریت‌شده توسط OpenClaw در `mcp.servers` از `openclaw doctor` استفاده کنید. سرورهای MCP بارگذاری‌شده از manifestهای Pluginهای همراه یا Claude `.mcp.json` از همان دروازه sandbox استفاده می‌کنند، اما این عیب‌یابی هنوز آن منابع را برنمی‌شمارد؛ اگر ابزارهای آن‌ها در نوبت‌های sandboxشده ناپدید شدند، از همان ورودی‌های allowlist استفاده کنید.

### `tools.codeMode`

`tools.codeMode` سطح عمومی حالت کد OpenClaw را فعال می‌کند. وقتی برای یک اجرا با ابزارها فعال باشد، مدل فقط `exec` و `wait` را می‌بیند؛ ابزارهای عادی OpenClaw پشت پل کاتالوگ درون-sandbox `tools.*` منتقل می‌شوند، و ابزارهای MCP از طریق فضای نام تولیدشده `MCP` در دسترس هستند.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

صورت کوتاه نیز پذیرفته می‌شود:

```json5
{
  tools: { codeMode: true },
}
```

اعلان‌های MCP در حالت کد از طریق سطح فایل API مجازی فقط‌خواندنی ارائه می‌شوند. کد مهمان می‌تواند پیش از فراخوانی `MCP.<server>.<tool>()`، با `API.list("mcp")` و `API.read("mcp/<server>.d.ts")` امضاهای سبک TypeScript را بررسی کند. برای قرارداد runtime، محدودیت‌ها، و مراحل اشکال‌زدایی، [حالت کد](/fa/reference/code-mode) را ببینید.

### `tools.allow` / `tools.deny`

سیاست سراسری مجاز/ممنوع ابزار (ممنوع برنده است). به بزرگی و کوچکی حروف حساس نیست، از wildcardهای `*` پشتیبانی می‌کند. حتی وقتی Docker sandbox خاموش است اعمال می‌شود.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` و `apply_patch` شناسه‌های ابزار جداگانه هستند. `allow: ["write"]` برای مدل‌های سازگار `apply_patch` را نیز فعال می‌کند، اما `deny: ["write"]`، `apply_patch` را ممنوع نمی‌کند. برای مسدود کردن همه تغییرات فایل، `group:fs` را ممنوع کنید یا هر ابزار تغییردهنده را صریح فهرست کنید:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

ابزارها را برای ارائه‌دهندگان یا مدل‌های مشخص بیشتر محدود می‌کند. ترتیب: پروفایل پایه ← پروفایل ارائه‌دهنده ← allow/deny.

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

ابزارها را برای هویت درخواست‌دهنده مشخص محدود می‌کند. این دفاع چندلایه روی کنترل دسترسی کانال است؛ مقادیر فرستنده باید از adapter کانال بیایند، نه از متن پیام.

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

کلیدها از پیشوندهای صریح استفاده می‌کنند: `channel:<channelId>:<senderId>`، `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>`، یا `"*"`. شناسه‌های کانال شناسه‌های متعارف OpenClaw هستند؛ نام‌های مستعاری مانند `teams` به `msteams` نرمال می‌شوند. کلیدهای legacy بدون پیشوند فقط به‌عنوان `id:` پذیرفته می‌شوند. ترتیب تطبیق چنین است: channel+id، id، e164، username، name، سپس wildcard.

وقتی `agents.list[].tools.toolsBySender` برای هر عامل تطبیق پیدا کند، حتی با سیاست خالی `{}`، تطبیق سراسری فرستنده را بازنویسی می‌کند.

### `tools.elevated`

دسترسی exec ارتقایافته خارج از sandbox را کنترل می‌کند:

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

- بازنویسی برای هر عامل (`agents.list[].tools.elevated`) فقط می‌تواند محدودتر کند.
- `/elevated on|off|ask|full` وضعیت را برای هر نشست ذخیره می‌کند؛ دستورالعمل‌های درون‌خطی فقط روی یک پیام اعمال می‌شوند.
- `exec` ارتقایافته از sandboxing عبور می‌کند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (`gateway` به‌صورت پیش‌فرض، یا `node` وقتی هدف exec برابر `node` است).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

بررسی‌های ایمنی چرخه ابزار به‌صورت پیش‌فرض **غیرفعال** هستند. برای فعال کردن تشخیص، `enabled: true` را تنظیم کنید. تنظیمات می‌توانند به‌صورت سراسری در `tools.loopDetection` تعریف شوند و برای هر عامل در `agents.list[].tools.loopDetection` بازنویسی شوند.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  بیشترین تاریخچه فراخوانی ابزار که برای تحلیل چرخه نگه داشته می‌شود.
</ParamField>
<ParamField path="warningThreshold" type="number">
  آستانه الگوی تکراری بدون پیشرفت برای هشدارها.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  آستانه تکرار بالاتر برای مسدود کردن چرخه‌های بحرانی.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  آستانه توقف قطعی برای هر اجرای بدون پیشرفت.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  هنگام فراخوانی‌های تکراری با همان ابزار/همان آرگومان‌ها هشدار می‌دهد.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  روی ابزارهای poll شناخته‌شده (`process.poll`، `command_status`، و غیره) هشدار می‌دهد/مسدود می‌کند.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  روی الگوهای زوجی متناوب بدون پیشرفت هشدار می‌دهد/مسدود می‌کند.
</ParamField>

<Warning>
اگر `warningThreshold >= criticalThreshold` یا `criticalThreshold >= globalCircuitBreakerThreshold` باشد، اعتبارسنجی شکست می‌خورد.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
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

### `tools.media`

درک رسانه ورودی (تصویر/صدا/ویدئو) را پیکربندی می‌کند:

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // منسوخ شده: تکمیل‌ها با میانجی‌گری عامل باقی می‌مانند
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

<AccordionGroup>
  <Accordion title="فیلدهای ورودی مدل رسانه">
    **ورودی ارائه‌دهنده** (`type: "provider"` یا حذف‌شده):

    - `provider`: شناسه ارائه‌دهنده API (`openai`، `anthropic`، `google`/`gemini`، `groq` و غیره)
    - `model`: بازنویسی شناسه مدل
    - `profile` / `preferredProfile`: انتخاب پروفایل `auth-profiles.json`

    **ورودی CLI** (`type: "cli"`):

    - `command`: فایل اجرایی برای اجرا
    - `args`: آرگومان‌های قالبی (از `{{MediaPath}}`، `{{Prompt}}`، `{{MaxChars}}` و غیره پشتیبانی می‌کند؛ `openclaw doctor --fix` جای‌نگهدارهای منسوخ‌شده `{input}` را به `{{MediaPath}}` مهاجرت می‌دهد)

    **فیلدهای مشترک:**

    - `capabilities`: فهرست اختیاری (`image`، `audio`، `video`). پیش‌فرض‌ها: `openai`/`anthropic`/`minimax` → تصویر، `google` → تصویر+صدا+ویدئو، `groq` → صدا.
    - `prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`: بازنویسی‌های مخصوص هر ورودی.
    - `tools.media.image.timeoutSeconds` و ورودی‌های متناظر `timeoutSeconds` برای مدل تصویر، وقتی عامل ابزار صریح `image` را فراخوانی می‌کند نیز اعمال می‌شوند. برای درک تصویر، این مهلت زمانی به خود درخواست اعمال می‌شود و با کار آماده‌سازی قبلی کاهش نمی‌یابد.
    - شکست‌ها به ورودی بعدی برمی‌گردند.

    احراز هویت ارائه‌دهنده از ترتیب استاندارد پیروی می‌کند: `auth-profiles.json` → متغیرهای محیطی → `models.providers.*.apiKey`.

    **فیلدهای تکمیل ناهمگام:**

    - `asyncCompletion.directSend`: پرچم سازگاری منسوخ‌شده. وظایف رسانه ناهمگام تکمیل‌شده با میانجی‌گری نشست درخواست‌کننده باقی می‌مانند تا عامل نتیجه را دریافت کند، تصمیم بگیرد چگونه به کاربر بگوید، و وقتی تحویل منبع به آن نیاز دارد از ابزار پیام استفاده کند.

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

کنترل می‌کند کدام نشست‌ها می‌توانند هدف ابزارهای نشست (`sessions_list`، `sessions_history`، `sessions_send`) قرار بگیرند.

پیش‌فرض: `tree` (نشست فعلی + نشست‌هایی که توسط آن ایجاد شده‌اند، مانند زیرعامل‌ها).

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
  <Accordion title="دامنه‌های دیدپذیری">
    - `self`: فقط کلید نشست فعلی.
    - `tree`: نشست فعلی + نشست‌هایی که توسط نشست فعلی ایجاد شده‌اند (زیرعامل‌ها).
    - `agent`: هر نشستی که به شناسه عامل فعلی تعلق دارد (اگر نشست‌های جداگانه بر اساس فرستنده را زیر همان شناسه عامل اجرا کنید، می‌تواند شامل کاربران دیگر هم باشد).
    - `all`: هر نشست. هدف‌گیری بین‌عاملی همچنان به `tools.agentToAgent` نیاز دارد.
    - محدودسازی سندباکس: وقتی نشست فعلی سندباکس شده باشد و `agents.defaults.sandbox.sessionToolsVisibility="spawned"` باشد، دیدپذیری حتی اگر `tools.sessions.visibility="all"` باشد به `tree` اجبار می‌شود.
    - وقتی `all` نباشد، `sessions_list` یک فیلد فشرده `visibility` شامل می‌شود
      که حالت مؤثر و هشداری را توصیف می‌کند مبنی بر اینکه برخی نشست‌ها ممکن است
      خارج از دامنه فعلی حذف شده باشند.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

پشتیبانی از پیوست درون‌خطی را برای `sessions_spawn` کنترل می‌کند.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // اختیاری: برای اجازه دادن به پیوست‌های فایل درون‌خطی روی true تنظیم کنید
        maxTotalBytes: 5242880, // مجموع ۵ مگابایت در همه فایل‌ها
        maxFiles: 50,
        maxFileBytes: 1048576, // ۱ مگابایت برای هر فایل
        retainOnSessionKeep: false, // نگه داشتن پیوست‌ها وقتی cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="نکات پیوست">
    - پیوست‌ها به `enabled: true` نیاز دارند.
    - پیوست‌های زیرعامل در فضای کاری فرزند در `.openclaw/attachments/<uuid>/` همراه با یک `.manifest.json` مادی‌سازی می‌شوند.
    - پیوست‌های ACP فقط تصویر هستند و پس از گذر از همان محدودیت‌های تعداد فایل، بایت برای هر فایل، و کل بایت‌ها، به‌صورت درون‌خطی به زمان‌اجرای ACP ارسال می‌شوند.
    - محتوای پیوست به‌طور خودکار از ماندگاری رونوشت حذف محرمانه می‌شود.
    - ورودی‌های Base64 با بررسی‌های سخت‌گیرانه الفبا/پدینگ و یک محافظ اندازه پیش از رمزگشایی اعتبارسنجی می‌شوند.
    - مجوزهای فایل پیوست زیرعامل برای پوشه‌ها `0700` و برای فایل‌ها `0600` هستند.
    - پاک‌سازی زیرعامل از سیاست `cleanup` پیروی می‌کند: `delete` همیشه پیوست‌ها را حذف می‌کند؛ `keep` فقط وقتی `retainOnSessionKeep: true` باشد آن‌ها را نگه می‌دارد.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

پرچم‌های آزمایشی ابزارهای داخلی. به‌طور پیش‌فرض خاموش است مگر اینکه یک قاعده فعال‌سازی خودکار سخت‌گیرانه عاملی GPT-5 اعمال شود.

```json5
{
  tools: {
    experimental: {
      planTool: true, // فعال کردن update_plan آزمایشی
    },
  },
}
```

- `planTool`: ابزار ساخت‌یافته `update_plan` را برای پیگیری کارهای چندمرحله‌ای غیرساده فعال می‌کند.
- پیش‌فرض: `false` مگر اینکه `agents.defaults.embeddedAgent.executionContract` (یا یک بازنویسی مخصوص عامل) برای یک اجرای خانواده GPT-5 مربوط به OpenAI یا OpenAI Codex روی `"strict-agentic"` تنظیم شده باشد. برای اجبار به روشن بودن ابزار خارج از آن دامنه، `true` تنظیم کنید، یا برای خاموش نگه داشتن آن حتی در اجراهای سخت‌گیرانه عاملی GPT-5، `false` تنظیم کنید.
- وقتی فعال باشد، پرامپت سیستم نیز راهنمای استفاده اضافه می‌کند تا مدل فقط برای کارهای قابل‌توجه از آن استفاده کند و حداکثر یک مرحله را در وضعیت `in_progress` نگه دارد.

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

- `model`: مدل پیش‌فرض برای زیرعامل‌های ایجادشده. اگر حذف شود، زیرعامل‌ها مدل فراخوان را به ارث می‌برند.
- `allowAgents`: فهرست مجاز پیش‌فرض شناسه‌های عامل هدف پیکربندی‌شده برای `sessions_spawn` وقتی عامل درخواست‌کننده `subagents.allowAgents` خودش را تنظیم نکرده باشد (`["*"]` = هر هدف پیکربندی‌شده؛ پیش‌فرض: فقط همان عامل). ورودی‌های کهنه‌ای که پیکربندی عاملشان حذف شده توسط `sessions_spawn` رد می‌شوند و از `agents_list` حذف می‌شوند؛ برای پاک‌سازی آن‌ها `openclaw doctor --fix` را اجرا کنید.
- `runTimeoutSeconds`: مهلت زمانی پیش‌فرض (ثانیه) برای `sessions_spawn`. `0` یعنی بدون مهلت زمانی.
- `announceTimeoutMs`: مهلت زمانی هر فراخوانی (میلی‌ثانیه) برای تلاش‌های تحویل اعلان `agent` در Gateway. پیش‌فرض: `120000`. تلاش‌های مجدد گذرا می‌توانند کل انتظار اعلان را از یک مهلت زمانی پیکربندی‌شده طولانی‌تر کنند.
- سیاست ابزار برای هر زیرعامل: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## ارائه‌دهندگان سفارشی و نشانی‌های پایه

Pluginهای ارائه‌دهنده، ردیف‌های کاتالوگ مدل خودشان را منتشر می‌کنند. ارائه‌دهندگان سفارشی را از طریق `models.providers` در پیکربندی یا `~/.openclaw/agents/<agentId>/agent/models.json` اضافه کنید.

پیکربندی `baseUrl` برای یک ارائه‌دهنده سفارشی/محلی همچنین تصمیم محدود اعتماد شبکه برای درخواست‌های HTTP مدل است: OpenClaw همان مبدأ دقیق `scheme://host:port` را از مسیر fetch محافظت‌شده عبور می‌دهد، بدون افزودن گزینه پیکربندی جداگانه یا اعتماد به مبدأهای خصوصی دیگر.

```json5
{
  models: {
    mode: "merge", // merge (پیش‌فرض) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
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
    - برای نیازهای احراز هویت سفارشی از `authHeader: true` + `headers` استفاده کنید.
    - ریشه پیکربندی عامل را با `OPENCLAW_AGENT_DIR` بازنویسی کنید.
    - تقدم ادغام برای شناسه‌های ارائه‌دهنده مطابق:
      - مقدارهای غیرخالی `baseUrl` در `models.json` عامل برنده می‌شوند.
      - مقدارهای غیرخالی `apiKey` در عامل فقط وقتی برنده می‌شوند که آن ارائه‌دهنده در زمینه پیکربندی/پروفایل احراز هویت فعلی با SecretRef مدیریت نشده باشد.
      - مقدارهای `apiKey` ارائه‌دهنده مدیریت‌شده با SecretRef به‌جای ماندگار کردن رازهای حل‌شده، از نشانگرهای منبع (`ENV_VAR_NAME` برای ارجاع‌های محیطی، `secretref-managed` برای ارجاع‌های فایل/exec) تازه‌سازی می‌شوند.
      - مقدارهای سرآیند ارائه‌دهنده مدیریت‌شده با SecretRef از نشانگرهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های محیطی، `secretref-managed` برای ارجاع‌های فایل/exec) تازه‌سازی می‌شوند.
      - `apiKey`/`baseUrl` خالی یا ناموجود در عامل به `models.providers` در پیکربندی برمی‌گردد.
      - `contextWindow`/`maxTokens` مدل مطابق، مقدار بالاتر بین پیکربندی صریح و مقدارهای ضمنی کاتالوگ را استفاده می‌کند.
      - `contextTokens` مدل مطابق، وقتی وجود داشته باشد، سقف صریح زمان‌اجرا را حفظ می‌کند؛ از آن برای محدود کردن زمینه مؤثر بدون تغییر فراداده بومی مدل استفاده کنید.
      - کاتالوگ‌های Plugin ارائه‌دهنده به‌عنوان قطعه‌های کاتالوگ تولیدشده متعلق به Plugin، زیر وضعیت Plugin عامل ذخیره می‌شوند.
      - وقتی می‌خواهید پیکربندی، `models.json` و قطعه‌های کاتالوگ فعال Plugin را کامل بازنویسی کند، از `models.mode: "replace"` استفاده کنید.
      - ماندگاری نشانگر از نظر منبع مقتدر است: نشانگرها از اسنپ‌شات پیکربندی منبع فعال (پیش از حل) نوشته می‌شوند، نه از مقدارهای راز حل‌شده زمان‌اجرا.

  </Accordion>
</AccordionGroup>

### جزئیات فیلد ارائه‌دهنده

<AccordionGroup>
  <Accordion title="کاتالوگ سطح بالا">
    - `models.mode`: رفتار کاتالوگ ارائه‌دهنده (`merge` یا `replace`).
    - `models.providers`: نگاشت ارائه‌دهنده سفارشی با کلید شناسه ارائه‌دهنده.
      - ویرایش‌های امن: برای به‌روزرسانی‌های افزایشی از `openclaw config set models.providers.<id> '<json>' --strict-json --merge` یا `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌های مخرب را رد می‌کند مگر اینکه `--replace` را پاس بدهید.

  </Accordion>
  <Accordion title="اتصال ارائه‌دهنده و احراز هویت">
    - `models.providers.*.api`: آداپتور درخواست (`openai-completions`، `openai-responses`، `anthropic-messages`، `google-generative-ai` و غیره). برای پشتانه‌های خودمیزبان `/v1/chat/completions` مانند MLX، vLLM، SGLang و بیشتر سرورهای محلی سازگار با OpenAI، از `openai-completions` استفاده کنید. یک ارائه‌دهنده سفارشی با `baseUrl` اما بدون `api` به‌طور پیش‌فرض از `openai-completions` استفاده می‌کند؛ فقط وقتی پشتانه از `/v1/responses` پشتیبانی می‌کند، `openai-responses` را تنظیم کنید.
    - `models.providers.*.apiKey`: اعتبارنامه ارائه‌دهنده (جایگزینی SecretRef/env ترجیح داده می‌شود).
    - `models.providers.*.auth`: راهبرد احراز هویت (`api-key`، `token`، `oauth`، `aws-sdk`).
    - `models.providers.*.contextWindow`: پنجره زمینه بومی پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده، وقتی ورودی مدل `contextWindow` را تنظیم نکرده باشد.
    - `models.providers.*.contextTokens`: سقف زمینه مؤثر زمان اجرا به‌صورت پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده، وقتی ورودی مدل `contextTokens` را تنظیم نکرده باشد.
    - `models.providers.*.maxTokens`: سقف توکن‌های خروجی پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده، وقتی ورودی مدل `maxTokens` را تنظیم نکرده باشد.
    - `models.providers.*.timeoutSeconds`: مهلت اختیاری درخواست HTTP مدل برای هر ارائه‌دهنده، بر حسب ثانیه، شامل اتصال، سرآیندها، بدنه و مدیریت لغو کل درخواست.
    - `models.providers.*.injectNumCtxForOpenAICompat`: برای Ollama + `openai-completions`، مقدار `options.num_ctx` را به درخواست‌ها تزریق می‌کند (پیش‌فرض: `true`).
    - `models.providers.*.authHeader`: در صورت نیاز، انتقال اعتبارنامه را در سرآیند `Authorization` اجباری می‌کند.
    - `models.providers.*.baseUrl`: URL پایه API بالادستی.
    - `models.providers.*.headers`: سرآیندهای ثابت اضافی برای مسیریابی پراکسی/مستأجر.

  </Accordion>
  <Accordion title="بازنویسی‌های انتقال درخواست">
    `models.providers.*.request`: بازنویسی‌های انتقال برای درخواست‌های HTTP ارائه‌دهنده مدل.

    - `request.headers`: سرآیندهای اضافی (با پیش‌فرض‌های ارائه‌دهنده ادغام می‌شوند). مقدارها SecretRef را می‌پذیرند.
    - `request.auth`: بازنویسی راهبرد احراز هویت. حالت‌ها: `"provider-default"` (استفاده از احراز هویت داخلی ارائه‌دهنده)، `"authorization-bearer"` (با `token`)، `"header"` (با `headerName`، `value`، و `prefix` اختیاری).
    - `request.proxy`: بازنویسی پراکسی HTTP. حالت‌ها: `"env-proxy"` (استفاده از متغیرهای محیطی `HTTP_PROXY`/`HTTPS_PROXY`)، `"explicit-proxy"` (با `url`). هر دو حالت یک زیرشیء اختیاری `tls` را می‌پذیرند.
    - `request.tls`: بازنویسی TLS برای اتصال‌های مستقیم. فیلدها: `ca`، `cert`، `key`، `passphrase` (همه SecretRef را می‌پذیرند)، `serverName`، `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: وقتی `true` باشد، به درخواست‌های HTTP ارائه‌دهنده مدل اجازه می‌دهد از نگهبان واکشی HTTP ارائه‌دهنده به محدوده‌های خصوصی، CGNAT یا مشابه عبور کنند. URLهای پایه ارائه‌دهنده سفارشی/محلی از قبل به مبدأ دقیق پیکربندی‌شده اعتماد می‌کنند، به‌جز مبدأهای metadata/link-local که بدون پذیرش صریح همچنان مسدود می‌مانند. برای انصراف از اعتماد به مبدأ دقیق، این را روی `false` تنظیم کنید. WebSocket از همان `request` برای سرآیندها/TLS استفاده می‌کند، اما نه از آن دروازه واکشی SSRF. پیش‌فرض `false`.

  </Accordion>
  <Accordion title="ورودی‌های کاتالوگ مدل">
    - `models.providers.*.models`: ورودی‌های صریح کاتالوگ مدل ارائه‌دهنده.
    - `models.providers.*.models.*.input`: حالت‌های ورودی مدل. برای مدل‌های فقط‌متنی از `["text"]` و برای مدل‌های بومی تصویر/بینایی از `["text", "image"]` استفاده کنید. پیوست‌های تصویری فقط زمانی به نوبت‌های عامل تزریق می‌شوند که مدل انتخاب‌شده با قابلیت تصویر علامت‌گذاری شده باشد.
    - `models.providers.*.models.*.contextWindow`: فراداده پنجره زمینه بومی مدل. این مقدار `contextWindow` سطح ارائه‌دهنده را برای آن مدل بازنویسی می‌کند.
    - `models.providers.*.models.*.contextTokens`: سقف اختیاری زمینه زمان اجرا. این مقدار `contextTokens` سطح ارائه‌دهنده را بازنویسی می‌کند؛ وقتی بودجه زمینه مؤثر کوچک‌تری نسبت به `contextWindow` بومی مدل می‌خواهید از آن استفاده کنید؛ `openclaw models list` هر دو مقدار را وقتی متفاوت باشند نشان می‌دهد.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: راهنمای اختیاری سازگاری. برای `api: "openai-completions"` با `baseUrl` غیرخالی و غیربومی (میزبان غیر از `api.openai.com`)، OpenClaw در زمان اجرا این مقدار را به `false` اجبار می‌کند. `baseUrl` خالی/حذف‌شده رفتار پیش‌فرض OpenAI را حفظ می‌کند.
    - `models.providers.*.models.*.compat.requiresStringContent`: راهنمای اختیاری سازگاری برای نقطه‌های پایانی چت فقط‌رشته‌ای سازگار با OpenAI. وقتی `true` باشد، OpenClaw آرایه‌های صرفاً متنی `messages[].content` را پیش از ارسال درخواست به رشته‌های ساده تخت می‌کند.
    - `models.providers.*.models.*.compat.strictMessageKeys`: راهنمای اختیاری سازگاری برای نقطه‌های پایانی چت سخت‌گیر سازگار با OpenAI. وقتی `true` باشد، OpenClaw پیش از ارسال درخواست، اشیای پیام Chat Completions خروجی را به `role` و `content` کاهش می‌دهد.
    - `models.providers.*.models.*.compat.thinkingFormat`: راهنمای اختیاری payload تفکر. برای `reasoning.enabled` به سبک Together از `"together"`، برای `enable_thinking` سطح بالا از `"qwen"`، یا برای `chat_template_kwargs.enable_thinking` روی سرورهای سازگار با OpenAI از خانواده Qwen که از kwargs الگوی چت در سطح درخواست پشتیبانی می‌کنند، مانند vLLM، از `"qwen-chat-template"` استفاده کنید. مدل‌های Qwen پیکربندی‌شده vLLM برای این قالب‌ها انتخاب‌های دودویی `/think` (`off`، `on`) را ارائه می‌کنند.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: راهنمای اختیاری سازگاری برای پشتانه‌های Chat Completions به سبک DeepSeek که نیاز دارند پیام‌های قبلی assistant هنگام بازپخش `reasoning_content` را نگه دارند. وقتی `true` باشد، OpenClaw آن فیلد را روی پیام‌های خروجی assistant حفظ می‌کند. هنگام اتصال یک پراکسی سفارشی سازگار با DeepSeek که درخواست‌ها را پس از حذف استدلال رد می‌کند، از این استفاده کنید. پیش‌فرض `false`.

  </Accordion>
  <Accordion title="کشف Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: ریشه تنظیمات کشف خودکار Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: روشن/خاموش کردن کشف ضمنی.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقه AWS برای کشف.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: فیلتر اختیاری شناسه ارائه‌دهنده برای کشف هدفمند.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصله نظرسنجی برای تازه‌سازی کشف.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: پنجره زمینه جایگزین برای مدل‌های کشف‌شده.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: حداکثر توکن‌های خروجی جایگزین برای مدل‌های کشف‌شده.

  </Accordion>
</AccordionGroup>

راه‌اندازی تعاملی ارائه‌دهنده سفارشی، ورودی تصویر را برای شناسه‌های رایج مدل‌های بینایی مانند GPT-4o، Claude، Gemini، Qwen-VL، LLaVA، Pixtral، InternVL، Mllama، MiniCPM-V و GLM-4V استنتاج می‌کند و برای خانواده‌های شناخته‌شده فقط‌متنی پرسش اضافی را رد می‌کند. شناسه‌های مدل ناشناخته همچنان درباره پشتیبانی تصویر پرسش می‌کنند. راه‌اندازی غیرتعاملی از همان استنتاج استفاده می‌کند؛ برای اجبار فراداده با قابلیت تصویر `--custom-image-input` یا برای اجبار فراداده فقط‌متنی `--custom-text-input` را پاس بدهید.

### نمونه‌های ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin رسمی ارائه‌دهنده خارجی `cerebras` می‌تواند این را از طریق `openclaw onboard --auth-choice cerebras-api-key` پیکربندی کند. فقط هنگام بازنویسی پیش‌فرض‌ها از پیکربندی صریح ارائه‌دهنده استفاده کنید.

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

    برای Cerebras از `cerebras/zai-glm-4.7` استفاده کنید؛ برای Z.AI مستقیم از `zai/glm-4.7`.

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

    سازگار با Anthropic، ارائه‌دهنده داخلی. میانبر: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="مدل‌های محلی (LM Studio)">
    [مدل‌های محلی](/fa/gateway/local-models) را ببینید. خلاصه: یک مدل محلی بزرگ را از طریق LM Studio Responses API روی سخت‌افزار جدی اجرا کنید؛ مدل‌های میزبانی‌شده را برای جایگزین ادغام‌شده نگه دارید.
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

    `MINIMAX_API_KEY` را تنظیم کنید. میانبرها: `openclaw onboard --auth-choice minimax-global-api` یا `openclaw onboard --auth-choice minimax-cn-api`. کاتالوگ مدل به‌طور پیش‌فرض M3 است و گونه‌های M2.7 را هم شامل می‌شود. در مسیر استریم سازگار با Anthropic، OpenClaw تفکر MiniMax M2.x را به‌طور پیش‌فرض غیرفعال می‌کند، مگر اینکه خودتان صریحاً `thinking` را تنظیم کنید؛ MiniMax-M3 (و M3.x) به‌طور پیش‌فرض روی مسیر تفکر حذف‌شده/تطبیقی ارائه‌دهنده می‌ماند. `/fast on` یا `params.fastMode: true` مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.

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

    نقطه‌های پایانی بومی Moonshot سازگاری استفاده از استریم را روی انتقال مشترک `openai-completions` اعلام می‌کنند، و OpenClaw این را بر اساس قابلیت‌های نقطه پایانی تعیین می‌کند، نه فقط شناسه ارائه‌دهنده داخلی.

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

    `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`) را تنظیم کنید. برای کاتالوگ Zen از ارجاع‌های `opencode/...` یا برای کاتالوگ Go از ارجاع‌های `opencode-go/...` استفاده کنید. میانبر: `openclaw onboard --auth-choice opencode-zen` یا `openclaw onboard --auth-choice opencode-go`.

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

    URL پایه باید `/v1` را حذف کند (کلاینت Anthropic آن را اضافه می‌کند). میان‌بر: `openclaw onboard --auth-choice synthetic-api-key`.

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

    `ZAI_API_KEY` را تنظیم کنید. ارجاع‌های مدل از شناسه ارائه‌دهنده استاندارد `zai/*` استفاده می‌کنند. میان‌بر: `openclaw onboard --auth-choice zai-api-key`.

    - نقطه پایانی عمومی: `https://api.z.ai/api/paas/v4`
    - نقطه پایانی کدنویسی (پیش‌فرض): `https://api.z.ai/api/coding/paas/v4`
    - برای نقطه پایانی عمومی، یک ارائه‌دهنده سفارشی با بازنویسی URL پایه تعریف کنید.

  </Accordion>
</AccordionGroup>

---

## مرتبط

- [پیکربندی — عامل‌ها](/fa/gateway/config-agents)
- [پیکربندی — کانال‌ها](/fa/gateway/config-channels)
- [مرجع پیکربندی](/fa/gateway/configuration-reference) — کلیدهای سطح بالای دیگر
- [ابزارها و Pluginها](/fa/tools)

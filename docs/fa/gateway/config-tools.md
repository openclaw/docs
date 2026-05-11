---
read_when:
    - پیکربندی خط‌مشی `tools.*`، فهرست‌های مجاز یا ویژگی‌های آزمایشی
    - ثبت ارائه‌دهندگان سفارشی یا بازنویسی URLهای پایه
    - راه‌اندازی نقاط پایانی خودمیزبان سازگار با OpenAI
sidebarTitle: Tools and custom providers
summary: پیکربندی ابزارها (سیاست، فعال‌سازهای آزمایشی، ابزارهای پشتیبانی‌شده توسط ارائه‌دهنده) و راه‌اندازی ارائه‌دهنده/base-URL سفارشی
title: پیکربندی — ابزارها و ارائه‌دهندگان سفارشی
x-i18n:
    generated_at: "2026-05-11T20:33:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9ab0ec823da1e2e8598d9efb998a207c4486ba82dcf4dd65422c6bf90581b46
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` کلیدهای پیکربندی و راه‌اندازی ارائه‌دهندهٔ سفارشی / base-URL. برای agentها، کانال‌ها و دیگر کلیدهای پیکربندی سطح بالا، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## ابزارها

### پروفایل‌های ابزار

`tools.profile` پیش از `tools.allow`/`tools.deny` یک allowlist پایه تنظیم می‌کند:

<Note>
onboarding محلی، پیکربندی‌های محلی جدید را وقتی تنظیم نشده باشند به `tools.profile: "coding"` پیش‌فرض می‌کند (پروفایل‌های صریح موجود حفظ می‌شوند).
</Note>

| پروفایل     | شامل                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | فقط `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | بدون محدودیت (همانند تنظیم‌نشده)                                                                                                  |

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
| `group:openclaw`   | همهٔ ابزارهای داخلی (Pluginهای ارائه‌دهنده را شامل نمی‌شود)                                                                          |

### `tools.allow` / `tools.deny`

سیاست سراسری اجازه/ممنوعیت ابزار (ممنوعیت اولویت دارد). به بزرگی/کوچکی حروف حساس نیست و از wildcardهای `*` پشتیبانی می‌کند. حتی وقتی سندباکس Docker خاموش است هم اعمال می‌شود.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` و `apply_patch` شناسه‌های ابزار جداگانه‌اند. `allow: ["write"]` همچنین `apply_patch` را برای مدل‌های سازگار فعال می‌کند، اما `deny: ["write"]`، `apply_patch` را ممنوع نمی‌کند. برای مسدود کردن همهٔ تغییرات فایل، `group:fs` را ممنوع کنید یا هر ابزار تغییردهنده را صریحاً فهرست کنید:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

ابزارها را برای ارائه‌دهنده‌ها یا مدل‌های مشخص بیشتر محدود می‌کند. ترتیب: پروفایل پایه ← پروفایل ارائه‌دهنده ← اجازه/ممنوعیت.

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

ابزارها را برای یک هویت درخواست‌کنندهٔ مشخص محدود می‌کند. این یک دفاع چندلایه روی کنترل دسترسی کانال است؛ مقادیر فرستنده باید از adapter کانال بیایند، نه از متن پیام.

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

کلیدها از پیشوندهای صریح استفاده می‌کنند: `channel:<channelId>:<senderId>`، `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>`، یا `"*"`. شناسه‌های کانال، شناسه‌های canonical OpenClaw هستند؛ نام‌های مستعاری مانند `teams` به `msteams` نرمال‌سازی می‌شوند. کلیدهای قدیمی بدون پیشوند فقط به‌عنوان `id:` پذیرفته می‌شوند. ترتیب تطبیق این است: channel+id، id، e164، username، name، سپس wildcard.

وقتی `agents.list[].tools.toolsBySender` در سطح هر agent تطبیق داشته باشد، تطبیق سراسری فرستنده را override می‌کند، حتی با یک سیاست خالی `{}`.

### `tools.elevated`

دسترسی exec ارتقایافته خارج از سندباکس را کنترل می‌کند:

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

- override در سطح هر agent (`agents.list[].tools.elevated`) فقط می‌تواند محدودتر کند.
- `/elevated on|off|ask|full` وضعیت را برای هر نشست ذخیره می‌کند؛ directiveهای inline فقط روی یک پیام اعمال می‌شوند.
- `exec` ارتقایافته سندباکس را دور می‌زند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (`gateway` به‌صورت پیش‌فرض، یا وقتی هدف exec برابر `node` باشد، `node`).

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

بررسی‌های ایمنی حلقه ابزار به‌صورت **پیش‌فرض غیرفعال** هستند. برای فعال‌سازی تشخیص، `enabled: true` را تنظیم کنید. تنظیمات می‌توانند به‌صورت سراسری در `tools.loopDetection` تعریف شوند و برای هر عامل در `agents.list[].tools.loopDetection` بازنویسی شوند.

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
  حداکثر تاریخچه فراخوانی ابزار که برای تحلیل حلقه نگه داشته می‌شود.
</ParamField>
<ParamField path="warningThreshold" type="number">
  آستانه الگوی تکراری بدون پیشرفت برای هشدارها.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  آستانه تکرار بالاتر برای مسدود کردن حلقه‌های بحرانی.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  آستانه توقف قطعی برای هر اجرای بدون پیشرفت.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  هنگام فراخوانی‌های تکراری با همان ابزار/همان آرگومان‌ها هشدار می‌دهد.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  برای ابزارهای پیمایش شناخته‌شده (`process.poll`، `command_status` و غیره) هشدار می‌دهد/مسدود می‌کند.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  برای الگوهای زوجی متناوب بدون پیشرفت هشدار می‌دهد/مسدود می‌کند.
</ParamField>

<Warning>
اگر `warningThreshold >= criticalThreshold` یا `criticalThreshold >= globalCircuitBreakerThreshold` باشد، اعتبارسنجی ناموفق می‌شود.
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

درک رسانه ورودی (تصویر/صدا/ویدیو) را پیکربندی می‌کند:

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

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **ورودی ارائه‌دهنده** (`type: "provider"` یا حذف‌شده):

    - `provider`: شناسه ارائه‌دهنده API (`openai`، `anthropic`، `google`/`gemini`، `groq` و غیره)
    - `model`: بازنویسی شناسه مدل
    - `profile` / `preferredProfile`: انتخاب پروفایل `auth-profiles.json`

    **ورودی CLI** (`type: "cli"`):

    - `command`: فایل اجرایی برای اجرا
    - `args`: آرگومان‌های قالب‌بندی‌شده (از `{{MediaPath}}`، `{{Prompt}}`، `{{MaxChars}}` و غیره پشتیبانی می‌کند؛ `openclaw doctor --fix` جای‌نگهدارنده‌های منسوخ `{input}` را به `{{MediaPath}}` مهاجرت می‌دهد)

    **فیلدهای مشترک:**

    - `capabilities`: فهرست اختیاری (`image`، `audio`، `video`). پیش‌فرض‌ها: `openai`/`anthropic`/`minimax` → تصویر، `google` → تصویر+صدا+ویدیو، `groq` → صدا.
    - `prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`: بازنویسی‌های مخصوص هر ورودی.
    - `tools.media.image.timeoutSeconds` و ورودی‌های متناظر `timeoutSeconds` در مدل تصویر، زمانی که عامل ابزار صریح `image` را فراخوانی می‌کند نیز اعمال می‌شوند.
    - شکست‌ها به ورودی بعدی بازمی‌گردند.

    احراز هویت ارائه‌دهنده از ترتیب استاندارد پیروی می‌کند: `auth-profiles.json` → متغیرهای محیطی → `models.providers.*.apiKey`.

    **فیلدهای تکمیل ناهمگام:**

    - `asyncCompletion.directSend`: پرچم سازگاری منسوخ. وظایف رسانه ناهمگام تکمیل‌شده همچنان با واسطه جلسه درخواست‌کننده باقی می‌مانند تا عامل نتیجه را دریافت کند، تصمیم بگیرد چگونه به کاربر اطلاع دهد، و زمانی که تحویل از مبدا به آن نیاز دارد از ابزار پیام استفاده کند.

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

کنترل می‌کند کدام جلسه‌ها می‌توانند توسط ابزارهای جلسه (`sessions_list`، `sessions_history`، `sessions_send`) هدف قرار گیرند.

پیش‌فرض: `tree` (جلسه فعلی + جلسه‌هایی که توسط آن ایجاد شده‌اند، مانند زیردستیارها).

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
  <Accordion title="Visibility scopes">
    - `self`: فقط کلید جلسه فعلی.
    - `tree`: جلسه فعلی + جلسه‌هایی که توسط جلسه فعلی ایجاد شده‌اند (زیردستیارها).
    - `agent`: هر جلسه‌ای که به شناسه عامل فعلی تعلق دارد (اگر جلسه‌های مخصوص هر فرستنده را زیر همان شناسه عامل اجرا کنید، می‌تواند شامل کاربران دیگر هم باشد).
    - `all`: هر جلسه‌ای. هدف‌گیری میان‌عامل همچنان به `tools.agentToAgent` نیاز دارد.
    - محدودیت سندباکس: وقتی جلسه فعلی سندباکس شده باشد و `agents.defaults.sandbox.sessionToolsVisibility="spawned"` باشد، حتی اگر `tools.sessions.visibility="all"` باشد، دیدپذیری به `tree` اجبار می‌شود.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

پشتیبانی از پیوست درون‌خطی را برای `sessions_spawn` کنترل می‌کند.

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
  <Accordion title="Attachment notes">
    - پیوست‌ها فقط برای `runtime: "subagent"` پشتیبانی می‌شوند. زمان‌اجرای ACP آن‌ها را رد می‌کند.
    - فایل‌ها در فضای کاری فرزند در `.openclaw/attachments/<uuid>/` همراه با یک `.manifest.json` ساخته می‌شوند.
    - محتوای پیوست به‌طور خودکار از پایداری رونوشت حذف می‌شود.
    - ورودی‌های Base64 با بررسی‌های سخت‌گیرانه الفبا/پدینگ و یک محافظ اندازه پیش از رمزگشایی اعتبارسنجی می‌شوند.
    - مجوزهای فایل برای دایرکتوری‌ها `0700` و برای فایل‌ها `0600` است.
    - پاک‌سازی از سیاست `cleanup` پیروی می‌کند: `delete` همیشه پیوست‌ها را حذف می‌کند؛ `keep` فقط وقتی `retainOnSessionKeep: true` باشد آن‌ها را نگه می‌دارد.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

پرچم‌های ابزار داخلی آزمایشی. به‌طور پیش‌فرض خاموش است، مگر این‌که یک قانون فعال‌سازی خودکار سخت‌گیرانه عامل‌محور GPT-5 اعمال شود.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: ابزار ساختاریافته `update_plan` را برای پیگیری کارهای چندمرحله‌ای غیرساده فعال می‌کند.
- پیش‌فرض: `false` مگر این‌که `agents.defaults.embeddedPi.executionContract` (یا بازنویسی ویژه هر عامل) برای یک اجرای خانواده OpenAI یا OpenAI Codex GPT-5 روی `"strict-agentic"` تنظیم شده باشد. برای اجبار به روشن بودن ابزار خارج از آن محدوده، `true` را تنظیم کنید، یا برای خاموش نگه داشتن آن حتی در اجراهای GPT-5 سخت‌گیرانه عامل‌محور، `false` را تنظیم کنید.
- وقتی فعال باشد، پرامپت سیستمی همچنین راهنمای استفاده را اضافه می‌کند تا مدل فقط برای کارهای قابل‌توجه از آن استفاده کند و حداکثر یک گام را در وضعیت `in_progress` نگه دارد.

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

- `model`: مدل پیش‌فرض برای عامل‌های فرعی ایجادشده. اگر حذف شود، عامل‌های فرعی مدل فراخواننده را به ارث می‌برند.
- `allowAgents`: فهرست مجاز پیش‌فرض شناسه‌های عامل مقصد برای `sessions_spawn` وقتی عامل درخواست‌کننده `subagents.allowAgents` خودش را تنظیم نکرده باشد (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان عامل).
- `runTimeoutSeconds`: مهلت زمانی پیش‌فرض (ثانیه) برای `sessions_spawn` وقتی فراخوانی ابزار `runTimeoutSeconds` را حذف کند. `0` یعنی بدون مهلت زمانی.
- `announceTimeoutMs`: مهلت زمانی هر فراخوانی (میلی‌ثانیه) برای تلاش‌های تحویل اعلان `agent` در Gateway. پیش‌فرض: `120000`. تلاش‌های دوباره گذرا می‌توانند کل انتظار اعلان را از یک مهلت زمانی پیکربندی‌شده طولانی‌تر کنند.
- سیاست ابزار برای هر عامل فرعی: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## ارائه‌دهندگان سفارشی و نشانی‌های پایه

OpenClaw از کاتالوگ مدل داخلی استفاده می‌کند. ارائه‌دهندگان سفارشی را از طریق `models.providers` در پیکربندی یا `~/.openclaw/agents/<agentId>/agent/models.json` اضافه کنید.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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
  <Accordion title="Auth and merge precedence">
    - برای نیازهای احراز هویت سفارشی از `authHeader: true` + `headers` استفاده کنید.
    - ریشه پیکربندی عامل را با `OPENCLAW_AGENT_DIR` (یا `PI_CODING_AGENT_DIR`، یک نام مستعار قدیمی متغیر محیطی) بازنویسی کنید.
    - تقدم ادغام برای شناسه‌های ارائه‌دهنده همسان:
      - مقادیر غیرخالی `baseUrl` در `models.json` عامل برنده می‌شوند.
      - مقادیر غیرخالی `apiKey` در عامل فقط وقتی برنده می‌شوند که آن ارائه‌دهنده در زمینه پیکربندی/نمایه احراز هویت فعلی توسط SecretRef مدیریت نشده باشد.
      - مقادیر `apiKey` ارائه‌دهنده مدیریت‌شده با SecretRef به‌جای پایدارسازی اسرار حل‌شده، از نشانگرهای منبع (`ENV_VAR_NAME` برای ارجاع‌های محیطی، `secretref-managed` برای ارجاع‌های فایل/اجرا) تازه‌سازی می‌شوند.
      - مقادیر سرآیند ارائه‌دهنده مدیریت‌شده با SecretRef از نشانگرهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های محیطی، `secretref-managed` برای ارجاع‌های فایل/اجرا) تازه‌سازی می‌شوند.
      - `apiKey`/`baseUrl` خالی یا غایب عامل به `models.providers` در پیکربندی عقب‌گرد می‌کند.
      - `contextWindow`/`maxTokens` مدل همسان از مقدار بالاتر بین پیکربندی صریح و مقادیر ضمنی کاتالوگ استفاده می‌کند.
      - `contextTokens` مدل همسان، در صورت وجود، سقف زمان‌اجرای صریح را حفظ می‌کند؛ از آن برای محدود کردن زمینه مؤثر بدون تغییر فراداده بومی مدل استفاده کنید.
      - وقتی می‌خواهید پیکربندی، `models.json` را به‌طور کامل بازنویسی کند، از `models.mode: "replace"` استفاده کنید.
      - پایداری نشانگرها مبتنی بر مرجعیت منبع است: نشانگرها از عکس فوری پیکربندی منبع فعال (پیش از حل‌شدن) نوشته می‌شوند، نه از مقادیر محرمانه حل‌شده زمان‌اجرا.

  </Accordion>
</AccordionGroup>

### جزئیات فیلدهای ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: رفتار کاتالوگ ارائه‌دهنده (`merge` یا `replace`).
    - `models.providers`: نگاشت ارائه‌دهنده سفارشی با کلید شناسه ارائه‌دهنده.
      - ویرایش‌های ایمن: برای به‌روزرسانی‌های افزایشی از `openclaw config set models.providers.<id> '<json>' --strict-json --merge` یا `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌های مخرب را رد می‌کند، مگر این‌که `--replace` را ارسال کنید.

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: آداپتور درخواست (`openai-completions`، `openai-responses`، `anthropic-messages`، `google-generative-ai` و غیره). برای بک‌اندهای خودمیزبان `/v1/chat/completions` مانند MLX، vLLM، SGLang و بیشتر سرورهای محلی سازگار با OpenAI، از `openai-completions` استفاده کنید. یک ارائه‌دهنده سفارشی با `baseUrl` ولی بدون `api` به‌طور پیش‌فرض `openai-completions` است؛ فقط وقتی بک‌اند از `/v1/responses` پشتیبانی می‌کند `openai-responses` را تنظیم کنید.
    - `models.providers.*.apiKey`: اعتبارنامه ارائه‌دهنده (ترجیحاً جای‌گذاری SecretRef/env).
    - `models.providers.*.auth`: راهبرد احراز هویت (`api-key`، `token`، `oauth`، `aws-sdk`).
    - `models.providers.*.contextWindow`: پنجره زمینه بومی پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `contextWindow` را تنظیم نکرده باشد.
    - `models.providers.*.contextTokens`: سقف زمینه زمان‌اجرای مؤثر پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `contextTokens` را تنظیم نکرده باشد.
    - `models.providers.*.maxTokens`: سقف توکن خروجی پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `maxTokens` را تنظیم نکرده باشد.
    - `models.providers.*.timeoutSeconds`: مهلت زمانی اختیاری درخواست HTTP مدل برای هر ارائه‌دهنده برحسب ثانیه، شامل اتصال، سرآیندها، بدنه، و مدیریت لغو کل درخواست.
    - `models.providers.*.injectNumCtxForOpenAICompat`: برای Ollama + `openai-completions`، `options.num_ctx` را به درخواست‌ها تزریق می‌کند (پیش‌فرض: `true`).
    - `models.providers.*.authHeader`: در صورت نیاز، انتقال اعتبارنامه را در سرآیند `Authorization` اجباری می‌کند.
    - `models.providers.*.baseUrl`: نشانی پایه API بالادست.
    - `models.providers.*.headers`: سرآیندهای ایستای اضافی برای مسیریابی پروکسی/مستأجر.

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: بازنویسی‌های انتقال برای درخواست‌های HTTP ارائه‌دهنده مدل.

    - `request.headers`: سرآیندهای اضافی (ادغام‌شده با پیش‌فرض‌های ارائه‌دهنده). مقادیر SecretRef را می‌پذیرند.
    - `request.auth`: بازنویسی راهبرد احراز هویت. حالت‌ها: `"provider-default"` (استفاده از احراز هویت داخلی ارائه‌دهنده)، `"authorization-bearer"` (با `token`)، `"header"` (با `headerName`، `value`، و `prefix` اختیاری).
    - `request.proxy`: بازنویسی پروکسی HTTP. حالت‌ها: `"env-proxy"` (استفاده از متغیرهای محیطی `HTTP_PROXY`/`HTTPS_PROXY`)، `"explicit-proxy"` (با `url`). هر دو حالت یک زیرشیء اختیاری `tls` را می‌پذیرند.
    - `request.tls`: بازنویسی TLS برای اتصال‌های مستقیم. فیلدها: `ca`، `cert`، `key`، `passphrase` (همگی SecretRef را می‌پذیرند)، `serverName`، `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: وقتی `true` باشد، اجازه HTTPS به `baseUrl` را زمانی که DNS به محدوده‌های خصوصی، CGNAT یا مشابه حل می‌شود، از طریق محافظ دریافت HTTP ارائه‌دهنده می‌دهد (فعال‌سازی اختیاری اپراتور برای نقاط پایانی خودمیزبان سازگار با OpenAI و مورد اعتماد). نشانی‌های جریان ارائه‌دهنده مدل local loopback مانند `localhost`، `127.0.0.1` و `[::1]` به‌طور خودکار مجاز هستند مگر این‌که این گزینه صراحتاً روی `false` تنظیم شود؛ میزبان‌های LAN، tailnet و DNS خصوصی همچنان به فعال‌سازی اختیاری نیاز دارند. WebSocket از همان `request` برای سرآیندها/TLS استفاده می‌کند، اما از آن دروازه SSRF دریافت استفاده نمی‌کند. پیش‌فرض `false`.

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: ورودی‌های صریح کاتالوگ مدل ارائه‌دهنده.
    - `models.providers.*.models.*.input`: حالت‌های ورودی مدل. برای مدل‌های فقط متنی از `["text"]` و برای مدل‌های بومی تصویر/بینایی از `["text", "image"]` استفاده کنید. پیوست‌های تصویری فقط وقتی به نوبت‌های عامل تزریق می‌شوند که مدل انتخاب‌شده به‌عنوان دارای قابلیت تصویر علامت‌گذاری شده باشد.
    - `models.providers.*.models.*.contextWindow`: فراداده پنجره زمینه بومی مدل. این مقدار `contextWindow` سطح ارائه‌دهنده را برای آن مدل بازنویسی می‌کند.
    - `models.providers.*.models.*.contextTokens`: سقف زمینه زمان‌اجرای اختیاری. این مقدار `contextTokens` سطح ارائه‌دهنده را بازنویسی می‌کند؛ وقتی بودجه زمینه مؤثر کوچک‌تری نسبت به `contextWindow` بومی مدل می‌خواهید از آن استفاده کنید؛ `openclaw models list` هر دو مقدار را وقتی متفاوت باشند نشان می‌دهد.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: راهنمای سازگاری اختیاری. برای `api: "openai-completions"` با یک `baseUrl` غیرخالی و غیربومی (میزبان نه `api.openai.com`)، OpenClaw این مقدار را در زمان‌اجرا به `false` اجبار می‌کند. `baseUrl` خالی/حذف‌شده رفتار پیش‌فرض OpenAI را نگه می‌دارد.
    - `models.providers.*.models.*.compat.requiresStringContent`: راهنمای سازگاری اختیاری برای نقاط پایانی گفت‌وگوی سازگار با OpenAI که فقط رشته می‌پذیرند. وقتی `true` باشد، OpenClaw آرایه‌های صرفاً متنی `messages[].content` را پیش از ارسال درخواست به رشته‌های ساده تخت می‌کند.
    - `models.providers.*.models.*.compat.strictMessageKeys`: راهنمای سازگاری اختیاری برای نقاط پایانی گفت‌وگوی سازگار با OpenAI که سخت‌گیر هستند. وقتی `true` باشد، OpenClaw پیش از ارسال درخواست، شیءهای پیام Chat Completions خروجی را به `role` و `content` کاهش می‌دهد.
    - `models.providers.*.models.*.compat.thinkingFormat`: راهنمای اختیاری بار مفید تفکر. از `"qwen"` برای `enable_thinking` سطح بالا، یا از `"qwen-chat-template"` برای `chat_template_kwargs.enable_thinking` روی سرورهای سازگار با OpenAI خانواده Qwen که از آرگومان‌های کلیدواژه الگوی گفت‌وگو در سطح درخواست پشتیبانی می‌کنند، مانند vLLM، استفاده کنید.

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: ریشه تنظیمات کشف خودکار Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: روشن/خاموش کردن کشف ضمنی.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقه AWS برای کشف.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: فیلتر اختیاری شناسه ارائه‌دهنده برای کشف هدفمند.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: بازه نظرسنجی برای تازه‌سازی کشف.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: پنجره زمینه عقب‌گرد برای مدل‌های کشف‌شده.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: حداکثر توکن‌های خروجی عقب‌گرد برای مدل‌های کشف‌شده.

  </Accordion>
</AccordionGroup>

استقرار تعاملی ارائه‌دهندهٔ سفارشی، ورودی تصویر را برای شناسه‌های رایج مدل‌های بینایی مانند GPT-4o، Claude، Gemini، Qwen-VL، LLaVA، Pixtral، InternVL، Mllama، MiniCPM-V و GLM-4V استنباط می‌کند و برای خانواده‌های شناخته‌شدهٔ صرفاً متنی، پرسش اضافی را رد می‌کند. شناسه‌های مدل ناشناخته همچنان برای پشتیبانی از تصویر پرس‌وجو می‌شوند. استقرار غیرتعاملی از همان استنباط استفاده می‌کند؛ برای اجبار فرادادهٔ دارای قابلیت تصویر، `--custom-image-input` را بدهید یا برای اجبار فرادادهٔ صرفاً متنی، `--custom-text-input` را بدهید.

### نمونه‌های ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ارائه‌دهندهٔ همراهِ `cerebras` می‌تواند این را از طریق `openclaw onboard --auth-choice cerebras-api-key` پیکربندی کند. فقط هنگام بازنویسی پیش‌فرض‌ها از پیکربندی صریح ارائه‌دهنده استفاده کنید.

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

    برای Cerebras از `cerebras/zai-glm-4.7` استفاده کنید؛ برای اتصال مستقیم Z.AI از `zai/glm-4.7` استفاده کنید.

  </Accordion>
  <Accordion title="Kimi Coding">
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

    سازگار با Anthropic، ارائه‌دهندهٔ داخلی. میان‌بر: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    [مدل‌های محلی](/fa/gateway/local-models) را ببینید. خلاصه: یک مدل محلی بزرگ را از طریق LM Studio Responses API روی سخت‌افزار جدی اجرا کنید؛ مدل‌های میزبانی‌شده را برای جایگزین اضطراری ادغام‌شده نگه دارید.
  </Accordion>
  <Accordion title="MiniMax M2.7 (direct)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
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
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    `MINIMAX_API_KEY` را تنظیم کنید. میان‌برها: `openclaw onboard --auth-choice minimax-global-api` یا `openclaw onboard --auth-choice minimax-cn-api`. کاتالوگ مدل به‌طور پیش‌فرض فقط M2.7 است. در مسیر استریم سازگار با Anthropic، OpenClaw به‌طور پیش‌فرض تفکر MiniMax را غیرفعال می‌کند، مگر اینکه خودتان `thinking` را صریحاً تنظیم کنید. `/fast on` یا `params.fastMode: true` مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.

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

    برای نقطهٔ پایانی چین: `baseUrl: "https://api.moonshot.cn/v1"` یا `openclaw onboard --auth-choice moonshot-api-key-cn`.

    نقاط پایانی بومی Moonshot سازگاری استفادهٔ استریم را روی ترابری مشترک `openai-completions` اعلام می‌کنند، و OpenClaw آن را بر اساس قابلیت‌های نقطهٔ پایانی فعال می‌کند، نه فقط بر اساس شناسهٔ ارائه‌دهندهٔ داخلی.

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

    `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`) را تنظیم کنید. برای کاتالوگ Zen از ارجاع‌های `opencode/...` یا برای کاتالوگ Go از ارجاع‌های `opencode-go/...` استفاده کنید. میان‌بر: `openclaw onboard --auth-choice opencode-zen` یا `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
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

    `ZAI_API_KEY` را تنظیم کنید. `z.ai/*` و `z-ai/*` به‌عنوان نام‌های مستعار پذیرفته می‌شوند. میان‌بر: `openclaw onboard --auth-choice zai-api-key`.

    - نقطهٔ پایانی عمومی: `https://api.z.ai/api/paas/v4`
    - نقطهٔ پایانی کدنویسی (پیش‌فرض): `https://api.z.ai/api/coding/paas/v4`
    - برای نقطهٔ پایانی عمومی، یک ارائه‌دهندهٔ سفارشی با بازنویسی URL پایه تعریف کنید.

  </Accordion>
</AccordionGroup>

---

## مرتبط

- [پیکربندی — عامل‌ها](/fa/gateway/config-agents)
- [پیکربندی — کانال‌ها](/fa/gateway/config-channels)
- [مرجع پیکربندی](/fa/gateway/configuration-reference) — کلیدهای سطح‌بالای دیگر
- [ابزارها و plugins](/fa/tools)

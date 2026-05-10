---
read_when:
    - پیکربندی سیاست `tools.*`، فهرست‌های مجاز، یا ویژگی‌های آزمایشی
    - ثبت ارائه‌دهندگان سفارشی یا بازنویسی URLهای پایه
    - راه‌اندازی نقاط پایانی خودمیزبان سازگار با OpenAI
sidebarTitle: Tools and custom providers
summary: پیکربندی ابزارها (سیاست، کلیدهای آزمایشی، ابزارهای پشتیبانی‌شده توسط ارائه‌دهنده) و تنظیم ارائه‌دهنده/نشانی پایه سفارشی
title: پیکربندی — ابزارها و ارائه‌دهندگان سفارشی
x-i18n:
    generated_at: "2026-05-10T19:40:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c02dad1d895afe90baf99487b37d29968ebd944890075511e1cb057776b29ec6
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` کلیدهای پیکربندی و راه‌اندازی ارائه‌دهنده سفارشی / نشانی پایه. برای عامل‌ها، کانال‌ها، و دیگر کلیدهای پیکربندی سطح بالا، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## ابزارها

### پروفایل‌های ابزار

`tools.profile` پیش از `tools.allow`/`tools.deny` یک فهرست مجاز پایه تنظیم می‌کند:

<Note>
راه‌اندازی محلی به‌طور پیش‌فرض، وقتی تنظیم نشده باشد، پیکربندی‌های محلی جدید را روی `tools.profile: "coding"` می‌گذارد (پروفایل‌های صریح موجود حفظ می‌شوند).
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
| `group:openclaw`   | همه ابزارهای توکار (Pluginهای ارائه‌دهنده را مستثنی می‌کند)                                                                          |

### `tools.allow` / `tools.deny`

سیاست سراسری مجاز/ممنوع برای ابزارها (ممنوع اولویت دارد). به بزرگی و کوچکی حروف حساس نیست، از نویسه‌های عام `*` پشتیبانی می‌کند. حتی وقتی سندباکس Docker خاموش باشد هم اعمال می‌شود.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` و `apply_patch` شناسه‌های ابزار جداگانه هستند. `allow: ["write"]` برای مدل‌های سازگار، `apply_patch` را هم فعال می‌کند، اما `deny: ["write"]`، `apply_patch` را ممنوع نمی‌کند. برای مسدود کردن همه تغییرات فایل، `group:fs` را ممنوع کنید یا هر ابزار تغییر‌دهنده را صریح فهرست کنید:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

ابزارها را برای ارائه‌دهنده‌ها یا مدل‌های خاص بیشتر محدود می‌کند. ترتیب: پروفایل پایه → پروفایل ارائه‌دهنده → مجاز/ممنوع.

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

### `tools.elevated`

دسترسی elevated exec بیرون از سندباکس را کنترل می‌کند:

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

- بازنویسی به‌ازای هر عامل (`agents.list[].tools.elevated`) فقط می‌تواند محدودیت را بیشتر کند.
- `/elevated on|off|ask|full` وضعیت را به‌ازای هر نشست ذخیره می‌کند؛ دستورهای درون‌خطی برای یک پیام اعمال می‌شوند.
- `exec` با سطح دسترسی بالا، سندباکس را دور می‌زند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (`gateway` به‌طور پیش‌فرض، یا وقتی هدف exec برابر `node` باشد، `node`).

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
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

بررسی‌های ایمنی چرخه ابزار به‌طور پیش‌فرض **غیرفعال** هستند. برای فعال‌سازی تشخیص، `enabled: true` را تنظیم کنید. تنظیمات می‌توانند به‌صورت سراسری در `tools.loopDetection` تعریف شوند و به‌ازای هر عامل در `agents.list[].tools.loopDetection` بازنویسی شوند.

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
  بیشینه تاریخچه فراخوانی ابزار که برای تحلیل چرخه نگه داشته می‌شود.
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
  هنگام تکرار فراخوانی‌های ابزار یکسان/آرگومان‌های یکسان هشدار بده.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  برای ابزارهای polling شناخته‌شده (`process.poll`, `command_status`, و غیره) هشدار بده/مسدود کن.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  برای الگوهای زوجی متناوب بدون پیشرفت هشدار بده/مسدود کن.
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

درک رسانهٔ ورودی (تصویر/صدا/ویدیو) را پیکربندی می‌کند:

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

    - `provider`: شناسهٔ ارائه‌دهندهٔ API (`openai`، `anthropic`، `google`/`gemini`، `groq` و غیره)
    - `model`: بازنویسی شناسهٔ مدل
    - `profile` / `preferredProfile`: انتخاب پروفایل `auth-profiles.json`

    **ورودی CLI** (`type: "cli"`):

    - `command`: فایل اجرایی برای اجرا
    - `args`: آرگومان‌های قالب‌بندی‌شده (از `{{MediaPath}}`، `{{Prompt}}`، `{{MaxChars}}` و غیره پشتیبانی می‌کند؛ `openclaw doctor --fix` جانگه‌دارهای منسوخ `{input}` را به `{{MediaPath}}` مهاجرت می‌دهد)

    **فیلدهای مشترک:**

    - `capabilities`: فهرست اختیاری (`image`، `audio`، `video`). پیش‌فرض‌ها: `openai`/`anthropic`/`minimax` → تصویر، `google` → تصویر+صدا+ویدیو، `groq` → صدا.
    - `prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`: بازنویسی‌های مخصوص هر ورودی.
    - `tools.media.image.timeoutSeconds` و ورودی‌های متناظر `timeoutSeconds` برای مدل تصویر، وقتی عامل ابزار صریح `image` را فراخوانی می‌کند نیز اعمال می‌شوند.
    - خرابی‌ها به ورودی بعدی بازمی‌گردند.

    احراز هویت ارائه‌دهنده از ترتیب استاندارد پیروی می‌کند: `auth-profiles.json` → متغیرهای محیطی → `models.providers.*.apiKey`.

    **فیلدهای تکمیل ناهمگام:**

    - `asyncCompletion.directSend`: پرچم سازگاری منسوخ. وظایف تکمیل‌شدهٔ رسانهٔ ناهمگام با میانجی‌گری نشست درخواست‌کننده باقی می‌مانند تا عامل نتیجه را دریافت کند، تصمیم بگیرد چگونه به کاربر اطلاع دهد، و وقتی تحویل از منبع به آن نیاز دارد از ابزار پیام استفاده کند.

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

پیش‌فرض: `tree` (نشست فعلی + نشست‌هایی که توسط آن ایجاد شده‌اند، مانند عامل‌های فرعی).

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
    - `self`: فقط کلید نشست فعلی.
    - `tree`: نشست فعلی + نشست‌هایی که توسط نشست فعلی ایجاد شده‌اند (عامل‌های فرعی).
    - `agent`: هر نشستی که متعلق به شناسهٔ عامل فعلی باشد (اگر نشست‌های جداگانه برای هر فرستنده را زیر همان شناسهٔ عامل اجرا کنید، می‌تواند شامل کاربران دیگر هم باشد).
    - `all`: هر نشست. هدف‌گیری بین عامل‌ها همچنان به `tools.agentToAgent` نیاز دارد.
    - محدودسازی Sandbox: وقتی نشست فعلی sandbox شده باشد و `agents.defaults.sandbox.sessionToolsVisibility="spawned"` باشد، حتی اگر `tools.sessions.visibility="all"` باشد، دامنهٔ دید به‌اجبار `tree` می‌شود.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

پشتیبانی از پیوست‌های درون‌خطی را برای `sessions_spawn` کنترل می‌کند.

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
    - پیوست‌ها فقط برای `runtime: "subagent"` پشتیبانی می‌شوند. اجرای ACP آن‌ها را رد می‌کند.
    - فایل‌ها در فضای کاری فرزند در `.openclaw/attachments/<uuid>/` همراه با یک `.manifest.json` ساخته می‌شوند.
    - محتوای پیوست به‌طور خودکار از ماندگاری رونوشت حذف‌سازی می‌شود.
    - ورودی‌های Base64 با بررسی‌های سخت‌گیرانهٔ الفبا/پدینگ و یک محافظ اندازه پیش از رمزگشایی اعتبارسنجی می‌شوند.
    - مجوزهای فایل برای دایرکتوری‌ها `0700` و برای فایل‌ها `0600` است.
    - پاک‌سازی از سیاست `cleanup` پیروی می‌کند: `delete` همیشه پیوست‌ها را حذف می‌کند؛ `keep` آن‌ها را فقط زمانی نگه می‌دارد که `retainOnSessionKeep: true` باشد.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

پرچم‌های آزمایشی ابزارهای داخلی. پیش‌فرض خاموش است مگر اینکه یک قاعدهٔ فعال‌سازی خودکار سخت‌گیرانهٔ عامل‌محور GPT-5 اعمال شود.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: ابزار ساخت‌یافتهٔ `update_plan` را برای ردیابی کارهای چندمرحله‌ای غیرساده فعال می‌کند.
- پیش‌فرض: `false` مگر اینکه `agents.defaults.embeddedPi.executionContract` (یا یک بازنویسی برای هر عامل) برای اجرای خانوادۀ GPT-5 در OpenAI یا OpenAI Codex روی `"strict-agentic"` تنظیم شده باشد. برای اجبار به روشن بودن ابزار خارج از آن محدوده، `true` را تنظیم کنید، یا برای خاموش نگه داشتن آن حتی در اجراهای سخت‌گیرانهٔ عامل‌محور GPT-5، `false` را تنظیم کنید.
- وقتی فعال باشد، اعلان سیستم همچنین راهنمای استفاده را اضافه می‌کند تا مدل فقط برای کارهای قابل‌توجه از آن استفاده کند و حداکثر یک گام را در وضعیت `in_progress` نگه دارد.

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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: مدل پیش‌فرض برای زیرعامل‌های ایجادشده. اگر حذف شود، زیرعامل‌ها مدل فراخواننده را به ارث می‌برند.
- `allowAgents`: فهرست مجاز پیش‌فرض از شناسه‌های عامل مقصد برای `sessions_spawn`، وقتی عامل درخواست‌دهنده `subagents.allowAgents` خودش را تنظیم نکرده باشد (`["*"]` = هر مورد؛ پیش‌فرض: فقط همان عامل).
- `runTimeoutSeconds`: مهلت زمانی پیش‌فرض (ثانیه) برای `sessions_spawn` وقتی فراخوانی ابزار `runTimeoutSeconds` را حذف کند. `0` یعنی بدون مهلت زمانی.
- سیاست ابزار برای هر زیرعامل: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## ارائه‌دهندگان سفارشی و URLهای پایه

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
    - ریشهٔ پیکربندی عامل را با `OPENCLAW_AGENT_DIR` (یا `PI_CODING_AGENT_DIR`، یک نام مستعار قدیمی متغیر محیطی) بازنویسی کنید.
    - تقدم ادغام برای شناسه‌های ارائه‌دهندهٔ منطبق:
      - مقادیر غیرخالی `baseUrl` در `models.json` عامل برنده می‌شوند.
      - مقادیر غیرخالی `apiKey` در عامل فقط وقتی برنده می‌شوند که آن ارائه‌دهنده در زمینهٔ پیکربندی/نمایهٔ احراز هویت فعلی با SecretRef مدیریت نشده باشد.
      - مقادیر `apiKey` ارائه‌دهندهٔ مدیریت‌شده با SecretRef به‌جای ماندگار کردن رازهای حل‌شده، از نشانگرهای منبع (`ENV_VAR_NAME` برای ارجاع‌های env، و `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
      - مقادیر هدر ارائه‌دهندهٔ مدیریت‌شده با SecretRef از نشانگرهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های env، و `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
      - `apiKey`/`baseUrl` خالی یا ناموجود عامل به `models.providers` در پیکربندی بازمی‌گردد.
      - `contextWindow`/`maxTokens` مدل منطبق، مقدار بالاتر میان پیکربندی صریح و مقادیر ضمنی کاتالوگ را استفاده می‌کند.
      - `contextTokens` مدل منطبق، وقتی موجود باشد، سقف صریح زمان اجرا را حفظ می‌کند؛ از آن برای محدود کردن زمینهٔ مؤثر بدون تغییر فرادادهٔ بومی مدل استفاده کنید.
      - وقتی می‌خواهید پیکربندی، `models.json` را کاملاً بازنویسی کند، از `models.mode: "replace"` استفاده کنید.
      - ماندگاری نشانگرها بر اساس منبع مرجع است: نشانگرها از نمای فوری پیکربندی منبع فعال (پیش از حل‌شدن) نوشته می‌شوند، نه از مقادیر راز زمان اجرای حل‌شده.

  </Accordion>
</AccordionGroup>

### جزئیات فیلدهای ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: رفتار کاتالوگ ارائه‌دهنده (`merge` یا `replace`).
    - `models.providers`: نگاشت ارائه‌دهندهٔ سفارشی با کلید شناسهٔ ارائه‌دهنده.
      - ویرایش‌های ایمن: برای به‌روزرسانی‌های افزایشی از `openclaw config set models.providers.<id> '<json>' --strict-json --merge` یا `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌های مخرب را رد می‌کند مگر اینکه `--replace` را پاس دهید.

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: آداپتر درخواست (`openai-completions`، `openai-responses`، `anthropic-messages`، `google-generative-ai` و غیره). برای بک‌اندهای خودمیزبان `/v1/chat/completions` مانند MLX، vLLM، SGLang و بیشتر سرورهای محلی سازگار با OpenAI، از `openai-completions` استفاده کنید. ارائه‌دهندهٔ سفارشی با `baseUrl` اما بدون `api` به‌طور پیش‌فرض `openai-completions` است؛ فقط وقتی بک‌اند از `/v1/responses` پشتیبانی می‌کند، `openai-responses` را تنظیم کنید.
    - `models.providers.*.apiKey`: اعتبارنامهٔ ارائه‌دهنده (جایگزینی SecretRef/env ترجیح داده می‌شود).
    - `models.providers.*.auth`: راهبرد احراز هویت (`api-key`، `token`، `oauth`، `aws-sdk`).
    - `models.providers.*.contextWindow`: پنجرهٔ زمینهٔ بومی پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `contextWindow` را تنظیم نمی‌کند.
    - `models.providers.*.contextTokens`: سقف زمینهٔ زمان اجرای مؤثر پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `contextTokens` را تنظیم نمی‌کند.
    - `models.providers.*.maxTokens`: سقف توکن خروجی پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `maxTokens` را تنظیم نمی‌کند.
    - `models.providers.*.timeoutSeconds`: مهلت زمانی اختیاری درخواست HTTP مدل برای هر ارائه‌دهنده به ثانیه، شامل اتصال، هدرها، بدنه و مدیریت لغو کل درخواست.
    - `models.providers.*.injectNumCtxForOpenAICompat`: برای Ollama + `openai-completions`، `options.num_ctx` را به درخواست‌ها تزریق می‌کند (پیش‌فرض: `true`).
    - `models.providers.*.authHeader`: در صورت نیاز، انتقال اعتبارنامه را در هدر `Authorization` اجباری می‌کند.
    - `models.providers.*.baseUrl`: URL پایهٔ API بالادستی.
    - `models.providers.*.headers`: هدرهای ایستای اضافی برای مسیریابی پروکسی/مستأجر.

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: بازنویسی‌های انتقال برای درخواست‌های HTTP ارائه‌دهندهٔ مدل.

    - `request.headers`: هدرهای اضافی (ادغام‌شده با پیش‌فرض‌های ارائه‌دهنده). مقادیر SecretRef را می‌پذیرند.
    - `request.auth`: بازنویسی راهبرد احراز هویت. حالت‌ها: `"provider-default"` (استفاده از احراز هویت داخلی ارائه‌دهنده)، `"authorization-bearer"` (با `token`)، `"header"` (با `headerName`، `value`، و `prefix` اختیاری).
    - `request.proxy`: بازنویسی پروکسی HTTP. حالت‌ها: `"env-proxy"` (استفاده از متغیرهای محیطی `HTTP_PROXY`/`HTTPS_PROXY`)، `"explicit-proxy"` (با `url`). هر دو حالت یک زیربخش اختیاری `tls` را می‌پذیرند.
    - `request.tls`: بازنویسی TLS برای اتصال‌های مستقیم. فیلدها: `ca`، `cert`، `key`، `passphrase` (همگی SecretRef را می‌پذیرند)، `serverName`، `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: وقتی `true` باشد، HTTPS به `baseUrl` را وقتی DNS به بازه‌های خصوصی، CGNAT یا مشابه حل می‌شود، از طریق محافظ fetch HTTP ارائه‌دهنده مجاز می‌کند (انتخاب آگاهانهٔ اپراتور برای نقاط پایانی خودمیزبان سازگار با OpenAI و مورد اعتماد). URLهای جریان ارائه‌دهندهٔ مدل روی local loopback مانند `localhost`، `127.0.0.1` و `[::1]` به‌طور خودکار مجازند مگر اینکه این مورد صراحتاً روی `false` تنظیم شود؛ میزبان‌های LAN، tailnet و DNS خصوصی همچنان به انتخاب آگاهانه نیاز دارند. WebSocket از همان `request` برای هدرها/TLS استفاده می‌کند، اما نه از آن دروازهٔ SSRF مربوط به fetch. پیش‌فرض `false` است.

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: ورودی‌های صریح کاتالوگ مدل ارائه‌دهنده.
    - `models.providers.*.models.*.input`: حالت‌های ورودی مدل. برای مدل‌های فقط متنی از `["text"]` و برای مدل‌های بومی تصویر/بینایی از `["text", "image"]` استفاده کنید. پیوست‌های تصویری فقط وقتی مدل انتخاب‌شده به‌عنوان دارای قابلیت تصویر علامت‌گذاری شده باشد، به نوبت‌های عامل تزریق می‌شوند.
    - `models.providers.*.models.*.contextWindow`: فرادادهٔ پنجرهٔ زمینهٔ بومی مدل. این مقدار `contextWindow` در سطح ارائه‌دهنده را برای آن مدل بازنویسی می‌کند.
    - `models.providers.*.models.*.contextTokens`: سقف زمینهٔ زمان اجرای اختیاری. این مقدار `contextTokens` در سطح ارائه‌دهنده را بازنویسی می‌کند؛ وقتی بودجهٔ زمینهٔ مؤثر کوچک‌تری نسبت به `contextWindow` بومی مدل می‌خواهید، از آن استفاده کنید؛ `openclaw models list` وقتی این دو مقدار متفاوت باشند، هر دو را نشان می‌دهد.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: راهنمای سازگاری اختیاری. برای `api: "openai-completions"` با `baseUrl` غیرخالی و غیربومی (میزبان نه `api.openai.com`)، OpenClaw در زمان اجرا این مقدار را به `false` اجباری می‌کند. `baseUrl` خالی/حذف‌شده رفتار پیش‌فرض OpenAI را نگه می‌دارد.
    - `models.providers.*.models.*.compat.requiresStringContent`: راهنمای سازگاری اختیاری برای نقاط پایانی گفت‌وگوی سازگار با OpenAI که فقط رشته می‌پذیرند. وقتی `true` باشد، OpenClaw آرایه‌های صرفاً متنی `messages[].content` را پیش از ارسال درخواست به رشته‌های ساده تخت می‌کند.
    - `models.providers.*.models.*.compat.strictMessageKeys`: راهنمای سازگاری اختیاری برای نقاط پایانی گفت‌وگوی سخت‌گیرانهٔ سازگار با OpenAI. وقتی `true` باشد، OpenClaw آبجکت‌های پیام خروجی Chat Completions را پیش از ارسال درخواست به `role` و `content` محدود می‌کند.
    - `models.providers.*.models.*.compat.thinkingFormat`: راهنمای اختیاری برای محمولهٔ تفکر. برای `enable_thinking` در سطح بالا از `"qwen"` استفاده کنید، یا برای `chat_template_kwargs.enable_thinking` روی سرورهای سازگار با OpenAI از خانوادهٔ Qwen که از kwargs الگوی گفت‌وگو در سطح درخواست پشتیبانی می‌کنند، مانند vLLM، از `"qwen-chat-template"` استفاده کنید.

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: ریشهٔ تنظیمات کشف خودکار Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: روشن/خاموش کردن کشف ضمنی.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقهٔ AWS برای کشف.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: فیلتر اختیاری شناسهٔ ارائه‌دهنده برای کشف هدفمند.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: بازهٔ نظرسنجی برای تازه‌سازی کشف.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: پنجرهٔ زمینهٔ جایگزین برای مدل‌های کشف‌شده.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: حداکثر توکن‌های خروجی جایگزین برای مدل‌های کشف‌شده.

  </Accordion>
</AccordionGroup>

آماده‌سازی تعاملی ارائه‌دهندهٔ سفارشی، ورودی تصویر را برای شناسه‌های رایج مدل‌های بینایی مانند GPT-4o، Claude، Gemini، Qwen-VL، LLaVA، Pixtral، InternVL، Mllama، MiniCPM-V و GLM-4V استنباط می‌کند و پرسش اضافی را برای خانواده‌های شناخته‌شدهٔ فقط متنی رد می‌کند. شناسه‌های مدل ناشناخته همچنان دربارهٔ پشتیبانی تصویر پرسش می‌کنند. آماده‌سازی غیرتعاملی از همان استنباط استفاده می‌کند؛ برای اجبار فرادادهٔ دارای قابلیت تصویر، `--custom-image-input` را پاس دهید یا برای اجبار فرادادهٔ فقط متنی، `--custom-text-input` را پاس دهید.

### نمونه‌های ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ارائه‌دهندهٔ همراه `cerebras` می‌تواند این مورد را از طریق `openclaw onboard --auth-choice cerebras-api-key` پیکربندی کند. فقط وقتی پیش‌فرض‌ها را بازنویسی می‌کنید، از پیکربندی صریح ارائه‌دهنده استفاده کنید.

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
    به [مدل‌های محلی](/fa/gateway/local-models) مراجعه کنید. خلاصه: یک مدل محلی بزرگ را از طریق LM Studio Responses API روی سخت‌افزار جدی اجرا کنید؛ مدل‌های میزبانی‌شده را برای بازگشت اضطراری ادغام‌شده نگه دارید.
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

    `MINIMAX_API_KEY` را تنظیم کنید. میان‌برها: `openclaw onboard --auth-choice minimax-global-api` یا `openclaw onboard --auth-choice minimax-cn-api`. کاتالوگ مدل به‌طور پیش‌فرض فقط روی M2.7 تنظیم است. در مسیر استریم سازگار با Anthropic، OpenClaw به‌طور پیش‌فرض فکر کردن MiniMax را غیرفعال می‌کند مگر اینکه خودتان صراحتاً `thinking` را تنظیم کنید. `/fast on` یا `params.fastMode: true` مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.

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

    نقاط پایانی بومی Moonshot سازگاری مصرف در حالت استریم را روی ترابری مشترک `openai-completions` اعلام می‌کنند، و OpenClaw آن را بر اساس قابلیت‌های نقطهٔ پایانی فعال می‌کند، نه صرفاً شناسهٔ ارائه‌دهندهٔ داخلی.

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

    URL پایه نباید شامل `/v1` باشد (کلاینت Anthropic آن را اضافه می‌کند). میان‌بر: `openclaw onboard --auth-choice synthetic-api-key`.

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
- [مرجع پیکربندی](/fa/gateway/configuration-reference) — سایر کلیدهای سطح بالا
- [ابزارها و Pluginها](/fa/tools)

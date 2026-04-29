---
read_when:
    - پیکربندی سیاست `tools.*`، فهرست‌های مجاز، یا ویژگی‌های آزمایشی
    - ثبت ارائه‌دهندگان سفارشی یا بازنویسی URLهای پایه
    - راه‌اندازی نقاط پایانی خودمیزبان سازگار با OpenAI
sidebarTitle: Tools and custom providers
summary: پیکربندی ابزارها (خط‌مشی، کلیدهای آزمایشی، ابزارهای متکی به ارائه‌دهنده) و راه‌اندازی ارائه‌دهنده سفارشی/base-URL
title: پیکربندی — ابزارها و ارائه‌دهندگان سفارشی
x-i18n:
    generated_at: "2026-04-29T22:49:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1790c92ecaf822c837326d8e22e9d72cc44e5d4cc0bcc00c154ba5160975002a
    source_path: gateway/config-tools.md
    workflow: 16
---

کلیدهای پیکربندی `tools.*` و تنظیم ارائه‌دهندهٔ سفارشی / base-URL. برای عامل‌ها، کانال‌ها و دیگر کلیدهای پیکربندی سطح بالا، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## ابزارها

### پروفایل‌های ابزار

`tools.profile` پیش از `tools.allow`/`tools.deny` یک فهرست مجاز پایه تنظیم می‌کند:

<Note>
فرآیند راه‌اندازی محلی، پیکربندی‌های محلی جدید را وقتی تنظیم نشده باشند به‌صورت پیش‌فرض روی `tools.profile: "coding"` می‌گذارد (پروفایل‌های صریح موجود حفظ می‌شوند).
</Note>

| پروفایل     | شامل                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | فقط `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | بدون محدودیت (همانند تنظیم‌نشدن)                                                                                                  |

### گروه‌های ابزار

| گروه              | ابزارها                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` به‌عنوان نام مستعار برای `exec` پذیرفته می‌شود)                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | همهٔ ابزارهای داخلی (Pluginهای ارائه‌دهنده را شامل نمی‌شود)                                                                          |

### `tools.allow` / `tools.deny`

سیاست سراسری مجاز/رد کردن ابزارها (رد کردن برنده است). به بزرگی/کوچکی حروف حساس نیست و از wildcardهای `*` پشتیبانی می‌کند. حتی وقتی sandbox داکر خاموش باشد نیز اعمال می‌شود.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

ابزارها را برای ارائه‌دهنده‌ها یا مدل‌های خاص بیشتر محدود می‌کند. ترتیب: پروفایل پایه → پروفایل ارائه‌دهنده → مجاز/رد.

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

دسترسی اجرای ارتقایافته بیرون از sandbox را کنترل می‌کند:

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
- `/elevated on|off|ask|full` وضعیت را برای هر نشست ذخیره می‌کند؛ دستورهای درون‌خطی روی یک پیام واحد اعمال می‌شوند.
- `exec` ارتقایافته sandboxing را دور می‌زند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (`gateway` به‌صورت پیش‌فرض، یا وقتی هدف اجرای `exec` برابر `node` باشد، `node`).

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

بررسی‌های ایمنی حلقهٔ ابزارها به‌صورت **پیش‌فرض غیرفعال** هستند. برای فعال‌کردن تشخیص، `enabled: true` را تنظیم کنید. تنظیمات می‌توانند به‌صورت سراسری در `tools.loopDetection` تعریف شوند و برای هر عامل در `agents.list[].tools.loopDetection` بازنویسی شوند.

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
  بیشینهٔ تاریخچهٔ فراخوانی ابزار که برای تحلیل حلقه نگه داشته می‌شود.
</ParamField>
<ParamField path="warningThreshold" type="number">
  آستانهٔ الگوی تکراری بدون پیشرفت برای هشدارها.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  آستانهٔ تکرار بالاتر برای مسدود کردن حلقه‌های بحرانی.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  آستانهٔ توقف قطعی برای هر اجرای بدون پیشرفت.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  هنگام فراخوانی‌های تکراری با همان ابزار/همان آرگومان‌ها هشدار می‌دهد.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  روی ابزارهای polling شناخته‌شده (`process.poll`, `command_status` و غیره) هشدار می‌دهد/مسدود می‌کند.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  روی الگوهای جفتی متناوب بدون پیشرفت هشدار می‌دهد/مسدود می‌کند.
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

درک رسانه‌های ورودی (تصویر/صدا/ویدئو) را پیکربندی می‌کند:

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
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
    - `args`: آرگومان‌های قالب‌دار (از `{{MediaPath}}`، `{{Prompt}}`، `{{MaxChars}}` و غیره پشتیبانی می‌کند؛ `openclaw doctor --fix` نگه‌دارنده‌های منسوخ‌شدهٔ `{input}` را به `{{MediaPath}}` مهاجرت می‌دهد)

    **فیلدهای مشترک:**

    - `capabilities`: فهرست اختیاری (`image`، `audio`، `video`). پیش‌فرض‌ها: `openai`/`anthropic`/`minimax` ← تصویر، `google` ← تصویر+صدا+ویدئو، `groq` ← صدا.
    - `prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`: بازنویسی‌های مخصوص هر ورودی.
    - `tools.media.image.timeoutSeconds` و ورودی‌های متناظر `timeoutSeconds` مدل تصویر، زمانی که عامل ابزار صریح `image` را فراخوانی می‌کند نیز اعمال می‌شوند.
    - خرابی‌ها به ورودی بعدی بازمی‌گردند.

    احراز هویت ارائه‌دهنده از ترتیب استاندارد پیروی می‌کند: `auth-profiles.json` ← متغیرهای محیطی ← `models.providers.*.apiKey`.

    **فیلدهای تکمیل ناهمگام:**

    - `asyncCompletion.directSend`: وقتی `true` باشد، وظایف ناهمگام تکمیل‌شدهٔ `music_generate` و `video_generate` ابتدا تحویل مستقیم به کانال را امتحان می‌کنند. پیش‌فرض: `false` (مسیر قدیمی بیدارسازی نشست درخواست‌کننده/تحویل مدل).

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

کنترل می‌کند کدام نشست‌ها می‌توانند توسط ابزارهای نشست (`sessions_list`، `sessions_history`، `sessions_send`) هدف قرار بگیرند.

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
  <Accordion title="Visibility scopes">
    - `self`: فقط کلید نشست فعلی.
    - `tree`: نشست فعلی + نشست‌هایی که توسط نشست فعلی ایجاد شده‌اند (زیرعامل‌ها).
    - `agent`: هر نشستی که به شناسهٔ عامل فعلی تعلق دارد (اگر نشست‌های جداگانه بر اساس فرستنده را زیر همان شناسهٔ عامل اجرا کنید، می‌تواند شامل کاربران دیگر هم باشد).
    - `all`: هر نشست. هدف‌گیری میان‌عامل همچنان به `tools.agentToAgent` نیاز دارد.
    - محدودسازی سندباکس: وقتی نشست فعلی سندباکس‌شده باشد و `agents.defaults.sandbox.sessionToolsVisibility="spawned"` باشد، حتی اگر `tools.sessions.visibility="all"` باشد، دامنهٔ دید به‌اجبار `tree` می‌شود.

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
  <Accordion title="Attachment notes">
    - پیوست‌ها فقط برای `runtime: "subagent"` پشتیبانی می‌شوند. زمان‌اجرای ACP آن‌ها را رد می‌کند.
    - فایل‌ها در فضای کاری فرزند در `.openclaw/attachments/<uuid>/` همراه با یک `.manifest.json` ایجاد می‌شوند.
    - محتوای پیوست به‌طور خودکار از ماندگارسازی رونوشت حذف‌سازی می‌شود.
    - ورودی‌های Base64 با بررسی‌های سخت‌گیرانهٔ الفبا/پدینگ و محافظ اندازهٔ پیش از رمزگشایی اعتبارسنجی می‌شوند.
    - مجوزهای فایل برای پوشه‌ها `0700` و برای فایل‌ها `0600` هستند.
    - پاک‌سازی از سیاست `cleanup` پیروی می‌کند: `delete` همیشه پیوست‌ها را حذف می‌کند؛ `keep` فقط وقتی `retainOnSessionKeep: true` باشد آن‌ها را نگه می‌دارد.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

پرچم‌های ابزار داخلی آزمایشی. پیش‌فرض خاموش است، مگر اینکه یک قاعدهٔ فعال‌سازی خودکار سخت‌گیرانهٔ عاملی GPT-5 اعمال شود.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: ابزار ساختاریافته‌ی `update_plan` را برای پیگیری کارهای چندمرحله‌ای غیرساده فعال می‌کند.
- پیش‌فرض: `false`، مگر اینکه `agents.defaults.embeddedPi.executionContract` (یا یک بازنویسی برای هر عامل) برای اجرای خانواده‌ی OpenAI یا OpenAI Codex GPT-5 روی `"strict-agentic"` تنظیم شده باشد. برای اجبار به فعال‌سازی ابزار خارج از این محدوده، `true` تنظیم کنید، یا برای خاموش نگه داشتن آن حتی در اجراهای strict-agentic GPT-5، `false` تنظیم کنید.
- وقتی فعال باشد، اعلان سیستم همچنین راهنمای استفاده را اضافه می‌کند تا مدل فقط برای کارهای قابل‌توجه از آن استفاده کند و حداکثر یک گام را در حالت `in_progress` نگه دارد.

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
- `allowAgents`: فهرست مجاز پیش‌فرض از شناسه‌های عامل مقصد برای `sessions_spawn` وقتی عامل درخواست‌دهنده `subagents.allowAgents` خودش را تنظیم نکرده باشد (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان عامل).
- `runTimeoutSeconds`: زمان‌پایان پیش‌فرض (ثانیه) برای `sessions_spawn` وقتی فراخوانی ابزار `runTimeoutSeconds` را حذف کند. `0` یعنی بدون زمان‌پایان.
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
  <Accordion title="احراز هویت و تقدم ادغام">
    - برای نیازهای احراز هویت سفارشی از `authHeader: true` + `headers` استفاده کنید.
    - ریشه‌ی پیکربندی عامل را با `OPENCLAW_AGENT_DIR` (یا `PI_CODING_AGENT_DIR`، یک نام مستعار قدیمی متغیر محیطی) بازنویسی کنید.
    - تقدم ادغام برای شناسه‌های ارائه‌دهنده‌ی مطابق:
      - مقادیر غیرخالی `baseUrl` در `models.json` عامل اولویت دارند.
      - مقادیر غیرخالی `apiKey` در عامل فقط وقتی اولویت دارند که آن ارائه‌دهنده در زمینه‌ی پیکربندی/پروفایل احراز هویت فعلی با SecretRef مدیریت نشده باشد.
      - مقادیر `apiKey` ارائه‌دهنده‌ی مدیریت‌شده با SecretRef، به‌جای ماندگار کردن رازهای حل‌شده، از نشانگرهای منبع (`ENV_VAR_NAME` برای ارجاع‌های محیطی، `secretref-managed` برای ارجاع‌های فایل/اجرا) تازه‌سازی می‌شوند.
      - مقادیر هدر ارائه‌دهنده‌ی مدیریت‌شده با SecretRef از نشانگرهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های محیطی، `secretref-managed` برای ارجاع‌های فایل/اجرا) تازه‌سازی می‌شوند.
      - `apiKey`/`baseUrl` خالی یا غایب عامل به `models.providers` در پیکربندی برمی‌گردد.
      - `contextWindow`/`maxTokens` مدل مطابق، مقدار بالاتر بین پیکربندی صریح و مقادیر ضمنی کاتالوگ را استفاده می‌کنند.
      - `contextTokens` مدل مطابق، وقتی موجود باشد، سقف صریح زمان اجرا را حفظ می‌کند؛ از آن برای محدود کردن زمینه‌ی مؤثر بدون تغییر فراداده‌ی بومی مدل استفاده کنید.
      - وقتی می‌خواهید پیکربندی `models.json` را کاملاً بازنویسی کند، از `models.mode: "replace"` استفاده کنید.
      - ماندگاری نشانگرها منبع‌مرجع است: نشانگرها از snapshot پیکربندی منبع فعال (پیش از حل)، نه از مقادیر راز حل‌شده‌ی زمان اجرا، نوشته می‌شوند.

  </Accordion>
</AccordionGroup>

### جزئیات فیلد ارائه‌دهنده

<AccordionGroup>
  <Accordion title="کاتالوگ سطح بالا">
    - `models.mode`: رفتار کاتالوگ ارائه‌دهنده (`merge` یا `replace`).
    - `models.providers`: نگاشت ارائه‌دهنده‌ی سفارشی که با شناسه‌ی ارائه‌دهنده کلیدگذاری شده است.
      - ویرایش‌های امن: برای به‌روزرسانی‌های افزایشی از `openclaw config set models.providers.<id> '<json>' --strict-json --merge` یا `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌های مخرب را رد می‌کند، مگر اینکه `--replace` را پاس بدهید.

  </Accordion>
  <Accordion title="اتصال ارائه‌دهنده و احراز هویت">
    - `models.providers.*.api`: آداپتور درخواست (`openai-completions`، `openai-responses`، `anthropic-messages`، `google-generative-ai` و غیره). برای backendهای خودمیزبان `/v1/chat/completions` مانند MLX، vLLM، SGLang و بیشتر سرورهای محلی سازگار با OpenAI، از `openai-completions` استفاده کنید. ارائه‌دهنده‌ی سفارشی با `baseUrl` اما بدون `api` به‌طور پیش‌فرض از `openai-completions` استفاده می‌کند؛ فقط وقتی backend از `/v1/responses` پشتیبانی می‌کند `openai-responses` را تنظیم کنید.
    - `models.providers.*.apiKey`: اعتبارنامه‌ی ارائه‌دهنده (جایگزینی SecretRef/env ترجیح دارد).
    - `models.providers.*.auth`: راهبرد احراز هویت (`api-key`، `token`، `oauth`، `aws-sdk`).
    - `models.providers.*.contextWindow`: پنجره‌ی زمینه‌ی بومی پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `contextWindow` را تنظیم نکرده باشد.
    - `models.providers.*.contextTokens`: سقف زمینه‌ی مؤثر زمان اجرا به‌صورت پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `contextTokens` را تنظیم نکرده باشد.
    - `models.providers.*.maxTokens`: سقف توکن خروجی پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `maxTokens` را تنظیم نکرده باشد.
    - `models.providers.*.timeoutSeconds`: زمان‌پایان اختیاری درخواست HTTP مدل برای هر ارائه‌دهنده بر حسب ثانیه، شامل اتصال، هدرها، بدنه و مدیریت لغو کل درخواست.
    - `models.providers.*.injectNumCtxForOpenAICompat`: برای Ollama + `openai-completions`، `options.num_ctx` را به درخواست‌ها تزریق کنید (پیش‌فرض: `true`).
    - `models.providers.*.authHeader`: انتقال اعتبارنامه را در هدر `Authorization` هنگام نیاز اجباری کنید.
    - `models.providers.*.baseUrl`: URL پایه‌ی API بالادستی.
    - `models.providers.*.headers`: هدرهای ایستای اضافی برای مسیریابی پروکسی/مستأجر.

  </Accordion>
  <Accordion title="بازنویسی‌های انتقال درخواست">
    `models.providers.*.request`: بازنویسی‌های انتقال برای درخواست‌های HTTP ارائه‌دهنده‌ی مدل.

    - `request.headers`: هدرهای اضافی (با پیش‌فرض‌های ارائه‌دهنده ادغام می‌شوند). مقادیر SecretRef را می‌پذیرند.
    - `request.auth`: بازنویسی راهبرد احراز هویت. حالت‌ها: `"provider-default"` (استفاده از احراز هویت داخلی ارائه‌دهنده)، `"authorization-bearer"` (با `token`)، `"header"` (با `headerName`، `value`، و `prefix` اختیاری).
    - `request.proxy`: بازنویسی پروکسی HTTP. حالت‌ها: `"env-proxy"` (استفاده از متغیرهای محیطی `HTTP_PROXY`/`HTTPS_PROXY`)، `"explicit-proxy"` (با `url`). هر دو حالت یک زیرشیء اختیاری `tls` را می‌پذیرند.
    - `request.tls`: بازنویسی TLS برای اتصال‌های مستقیم. فیلدها: `ca`، `cert`، `key`، `passphrase` (همگی SecretRef را می‌پذیرند)، `serverName`، `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: وقتی `true` باشد، از طریق محافظ fetch HTTP ارائه‌دهنده، اجازه‌ی HTTPS به `baseUrl` را وقتی DNS به بازه‌های خصوصی، CGNAT یا مشابه resolve می‌شود می‌دهد (opt-in اپراتور برای endpointهای خودمیزبان سازگار با OpenAI و مورد اعتماد). URLهای جریان ارائه‌دهنده‌ی مدل loopback مانند `localhost`، `127.0.0.1` و `[::1]` به‌طور خودکار مجازند، مگر اینکه این مورد صراحتاً روی `false` تنظیم شده باشد؛ میزبان‌های LAN، tailnet و DNS خصوصی همچنان به opt-in نیاز دارند. WebSocket از همان `request` برای هدرها/TLS استفاده می‌کند، اما از آن دروازه‌ی SSRF مربوط به fetch استفاده نمی‌کند. پیش‌فرض `false`.

  </Accordion>
  <Accordion title="ورودی‌های کاتالوگ مدل">
    - `models.providers.*.models`: ورودی‌های صریح کاتالوگ مدل ارائه‌دهنده.
    - `models.providers.*.models.*.input`: modalityهای ورودی مدل. برای مدل‌های فقط متن از `["text"]` و برای مدل‌های بومی تصویر/بینایی از `["text", "image"]` استفاده کنید. پیوست‌های تصویر فقط وقتی به نوبت‌های عامل تزریق می‌شوند که مدل انتخاب‌شده با قابلیت تصویر علامت‌گذاری شده باشد.
    - `models.providers.*.models.*.contextWindow`: فراداده‌ی پنجره‌ی زمینه‌ی بومی مدل. این مقدار `contextWindow` سطح ارائه‌دهنده را برای آن مدل بازنویسی می‌کند.
    - `models.providers.*.models.*.contextTokens`: سقف اختیاری زمینه‌ی زمان اجرا. این مقدار `contextTokens` سطح ارائه‌دهنده را بازنویسی می‌کند؛ وقتی بودجه‌ی زمینه‌ی مؤثر کوچک‌تری نسبت به `contextWindow` بومی مدل می‌خواهید از آن استفاده کنید؛ `openclaw models list` هر دو مقدار را وقتی متفاوت باشند نشان می‌دهد.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: راهنمای اختیاری سازگاری. برای `api: "openai-completions"` با `baseUrl` غیرخالی و غیربومی (میزبانی غیر از `api.openai.com`)، OpenClaw در زمان اجرا این مقدار را به `false` اجبار می‌کند. `baseUrl` خالی/حذف‌شده رفتار پیش‌فرض OpenAI را حفظ می‌کند.
    - `models.providers.*.models.*.compat.requiresStringContent`: راهنمای اختیاری سازگاری برای endpointهای گفت‌وگوی سازگار با OpenAI که فقط رشته می‌پذیرند. وقتی `true` باشد، OpenClaw آرایه‌های صرفاً متنی `messages[].content` را پیش از ارسال درخواست به رشته‌های ساده flatten می‌کند.

  </Accordion>
  <Accordion title="کشف Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: ریشه‌ی تنظیمات کشف خودکار Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: کشف ضمنی را روشن/خاموش کنید.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقه‌ی AWS برای کشف.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: فیلتر اختیاری شناسه‌ی ارائه‌دهنده برای کشف هدفمند.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصله‌ی polling برای تازه‌سازی کشف.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: پنجره‌ی زمینه‌ی fallback برای مدل‌های کشف‌شده.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: حداکثر توکن‌های خروجی fallback برای مدل‌های کشف‌شده.

  </Accordion>
</AccordionGroup>

onboarding تعاملی ارائه‌دهنده‌ی سفارشی، ورودی تصویر را برای شناسه‌های رایج مدل‌های بینایی مانند GPT-4o، Claude، Gemini، Qwen-VL، LLaVA، Pixtral، InternVL، Mllama، MiniCPM-V و GLM-4V استنباط می‌کند و پرسش اضافی را برای خانواده‌های شناخته‌شده‌ی فقط متن رد می‌کند. شناسه‌های مدل ناشناخته همچنان درباره‌ی پشتیبانی تصویر سؤال می‌کنند. onboarding غیرتعاملی از همان استنباط استفاده می‌کند؛ برای اجبار فراداده‌ی با قابلیت تصویر، `--custom-image-input` را پاس بدهید یا برای اجبار فراداده‌ی فقط متن، `--custom-text-input` را پاس بدهید.

### نمونه‌های ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ارائه‌دهنده‌ی همراه `cerebras` می‌تواند این را از طریق `openclaw onboard --auth-choice cerebras-api-key` پیکربندی کند. فقط وقتی پیش‌فرض‌ها را بازنویسی می‌کنید از پیکربندی صریح ارائه‌دهنده استفاده کنید.

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

    برای Cerebras از `cerebras/zai-glm-4.7` استفاده کنید؛ برای Z.AI مستقیم از `zai/glm-4.7` استفاده کنید.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    سازگار با Anthropic، ارائه‌دهنده‌ی داخلی. میان‌بر: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="مدل‌های محلی (LM Studio)">
    [مدل‌های محلی](/fa/gateway/local-models) را ببینید. خلاصه: یک مدل محلی بزرگ را از طریق LM Studio Responses API روی سخت‌افزار جدی اجرا کنید؛ مدل‌های میزبانی‌شده را برای fallback ادغام‌شده نگه دارید.
  </Accordion>
  <Accordion title="MiniMax M2.7 (مستقیم)">
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

    `MINIMAX_API_KEY` را تنظیم کنید. میان‌برها: `openclaw onboard --auth-choice minimax-global-api` یا `openclaw onboard --auth-choice minimax-cn-api`. کاتالوگ مدل به‌صورت پیش‌فرض فقط M2.7 است. در مسیر استریم سازگار با Anthropic، OpenClaw به‌صورت پیش‌فرض تفکر MiniMax را غیرفعال می‌کند، مگر اینکه خودتان صراحتا `thinking` را تنظیم کنید. `/fast on` یا `params.fastMode: true` مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.

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

    برای endpoint چین: `baseUrl: "https://api.moonshot.cn/v1"` یا `openclaw onboard --auth-choice moonshot-api-key-cn`.

    endpointهای بومی Moonshot سازگاری مصرف استریم را روی انتقال مشترک `openai-completions` اعلام می‌کنند، و OpenClaw این را براساس قابلیت‌های endpoint تعیین می‌کند، نه فقط براساس شناسه داخلی provider.

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

    `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`) را تنظیم کنید. برای کاتالوگ Zen از ارجاع‌های `opencode/...` و برای کاتالوگ Go از ارجاع‌های `opencode-go/...` استفاده کنید. میان‌بر: `openclaw onboard --auth-choice opencode-zen` یا `openclaw onboard --auth-choice opencode-go`.

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

    `ZAI_API_KEY` را تنظیم کنید. `z.ai/*` و `z-ai/*` به‌عنوان alias پذیرفته می‌شوند. میان‌بر: `openclaw onboard --auth-choice zai-api-key`.

    - endpoint عمومی: `https://api.z.ai/api/paas/v4`
    - endpoint کدنویسی (پیش‌فرض): `https://api.z.ai/api/coding/paas/v4`
    - برای endpoint عمومی، یک provider سفارشی با بازنویسی URL پایه تعریف کنید.

  </Accordion>
</AccordionGroup>

---

## مرتبط

- [پیکربندی — عامل‌ها](/fa/gateway/config-agents)
- [پیکربندی — کانال‌ها](/fa/gateway/config-channels)
- [مرجع پیکربندی](/fa/gateway/configuration-reference) — کلیدهای سطح بالای دیگر
- [ابزارها و plugins](/fa/tools)

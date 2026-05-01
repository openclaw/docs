---
read_when:
    - پیکربندی سیاست `tools.*`، فهرست‌های مجاز، یا ویژگی‌های آزمایشی
    - ثبت ارائه‌دهندگان سفارشی یا بازنویسی URLهای پایه
    - راه‌اندازی نقاط پایانی خودمیزبان سازگار با OpenAI
sidebarTitle: Tools and custom providers
summary: پیکربندی ابزارها (سیاست، گزینه‌های آزمایشی، ابزارهای پشتیبانی‌شده توسط ارائه‌دهنده) و راه‌اندازی ارائه‌دهنده/نشانی پایه سفارشی
title: پیکربندی — ابزارها و ارائه‌دهندگان سفارشی
x-i18n:
    generated_at: "2026-05-01T11:46:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 97e6bd8c762f6f7a9985b99ec016dde22c8ea8adc925778b11c2ae5103b887a8
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` کلیدهای پیکربندی و راه‌اندازی ارائه‌دهنده سفارشی / URL پایه. برای عامل‌ها، کانال‌ها، و دیگر کلیدهای پیکربندی سطح بالا، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## ابزارها

### پروفایل‌های ابزار

`tools.profile` پیش از `tools.allow`/`tools.deny` یک فهرست مجاز پایه تنظیم می‌کند:

<Note>
راه‌اندازی محلی، پیکربندی‌های محلی جدید را وقتی تنظیم نشده باشند به‌طور پیش‌فرض روی `tools.profile: "coding"` می‌گذارد (پروفایل‌های صریح موجود حفظ می‌شوند).
</Note>

| پروفایل    | شامل                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | فقط `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | بدون محدودیت (همانند تنظیم‌نشده)                                                                                                |

### گروه‌های ابزار

| گروه               | ابزارها                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` به‌عنوان نام مستعار برای `exec` پذیرفته می‌شود)                             |
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
| `group:openclaw`   | همه ابزارهای داخلی (Pluginهای ارائه‌دهنده را شامل نمی‌شود)                                                              |

### `tools.allow` / `tools.deny`

سیاست سراسری اجازه/منع ابزار (منع اولویت دارد). به بزرگی/کوچکی حروف حساس نیست، از wildcardهای `*` پشتیبانی می‌کند. حتی وقتی sandboxِ Docker خاموش باشد هم اعمال می‌شود.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

ابزارها را برای ارائه‌دهندگان یا مدل‌های مشخص بیشتر محدود می‌کند. ترتیب: پروفایل پایه ← پروفایل ارائه‌دهنده ← اجازه/منع.

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

دسترسی `exec` ارتقایافته خارج از sandbox را کنترل می‌کند:

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

- بازنویسی برای هر عامل (`agents.list[].tools.elevated`) فقط می‌تواند بیشتر محدود کند.
- `/elevated on|off|ask|full` وضعیت را برای هر نشست ذخیره می‌کند؛ دستورهای درون‌خطی روی یک پیام واحد اعمال می‌شوند.
- `exec` ارتقایافته sandboxing را دور می‌زند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (به‌طور پیش‌فرض `gateway`، یا وقتی هدف exec برابر `node` باشد `node`).

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

بررسی‌های ایمنی حلقه ابزار به‌طور پیش‌فرض **غیرفعال‌اند**. برای فعال‌سازی تشخیص، `enabled: true` را تنظیم کنید. تنظیمات می‌توانند به‌صورت سراسری در `tools.loopDetection` تعریف شوند و برای هر عامل در `agents.list[].tools.loopDetection` بازنویسی شوند.

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
  بیشینه تاریخچه فراخوانی ابزار که برای تحلیل حلقه نگه‌داری می‌شود.
</ParamField>
<ParamField path="warningThreshold" type="number">
  آستانه الگوی تکرارشونده بدون پیشرفت برای هشدارها.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  آستانه تکرار بالاتر برای مسدود کردن حلقه‌های بحرانی.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  آستانه توقف قطعی برای هر اجرای بدون پیشرفت.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  درباره فراخوانی‌های تکراری با همان ابزار/همان آرگومان‌ها هشدار می‌دهد.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  درباره ابزارهای poll شناخته‌شده (`process.poll`, `command_status`, و غیره) هشدار می‌دهد/مسدود می‌کند.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  درباره الگوهای جفتی متناوب بدون پیشرفت هشدار می‌دهد/مسدود می‌کند.
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

درک رسانهٔ ورودی (تصویر/صدا/ویدئو) را پیکربندی می‌کند:

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async video directly to the channel
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

    - `provider`: شناسهٔ ارائه‌دهندهٔ API (`openai`، `anthropic`، `google`/`gemini`، `groq`، و غیره)
    - `model`: بازنویسی شناسهٔ مدل
    - `profile` / `preferredProfile`: انتخاب نمایهٔ `auth-profiles.json`

    **ورودی CLI** (`type: "cli"`):

    - `command`: فایل اجرایی برای اجرا
    - `args`: آرگومان‌های قالب‌دار (از `{{MediaPath}}`، `{{Prompt}}`، `{{MaxChars}}`، و غیره پشتیبانی می‌کند؛ `openclaw doctor --fix` جای‌نگهدارنده‌های منسوخ `{input}` را به `{{MediaPath}}` مهاجرت می‌دهد)

    **فیلدهای مشترک:**

    - `capabilities`: فهرست اختیاری (`image`، `audio`، `video`). پیش‌فرض‌ها: `openai`/`anthropic`/`minimax` → تصویر، `google` → تصویر+صدا+ویدئو، `groq` → صدا.
    - `prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`: بازنویسی‌های هر ورودی.
    - ورودی‌های `tools.media.image.timeoutSeconds` و `timeoutSeconds` مدل تصویر متناظر نیز وقتی عامل ابزار صریح `image` را فراخوانی می‌کند اعمال می‌شوند.
    - شکست‌ها به ورودی بعدی بازمی‌گردند.

    احراز هویت ارائه‌دهنده از ترتیب استاندارد پیروی می‌کند: `auth-profiles.json` → متغیرهای محیطی → `models.providers.*.apiKey`.

    **فیلدهای تکمیل ناهمگام:**

    - `asyncCompletion.directSend`: وقتی `true` باشد، وظایف رسانهٔ ناهمگام تکمیل‌شده که از تحویل مستقیم تکمیل پشتیبانی می‌کنند، ابتدا تحویل مستقیم به کانال را امتحان می‌کنند. پیش‌فرض: `false` (مسیر بیدار کردن نشست درخواست‌دهنده/تحویل مدل). امروز این مورد برای `video_generate` ناهمگام اعمال می‌شود؛ تکمیل‌های `music_generate` ناهمگام حتی وقتی این گزینه فعال باشد همچنان با میانجی‌گری نشست درخواست‌دهنده انجام می‌شوند.

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

کنترل می‌کند کدام نشست‌ها می‌توانند هدف ابزارهای نشست (`sessions_list`، `sessions_history`، `sessions_send`) قرار گیرند.

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
  <Accordion title="دامنه‌های نمایانی">
    - `self`: فقط کلید نشست فعلی.
    - `tree`: نشست فعلی + نشست‌هایی که توسط نشست فعلی ایجاد شده‌اند (زیرعامل‌ها).
    - `agent`: هر نشستی که به شناسهٔ عامل فعلی تعلق دارد (اگر نشست‌های جداگانه برای هر فرستنده را زیر همان شناسهٔ عامل اجرا کنید، می‌تواند شامل کاربران دیگر هم باشد).
    - `all`: هر نشست. هدف‌گیری بین‌عاملی همچنان به `tools.agentToAgent` نیاز دارد.
    - محدودسازی سندباکس: وقتی نشست فعلی سندباکس‌شده باشد و `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، نمایانی حتی اگر `tools.sessions.visibility="all"` باشد به‌اجبار `tree` می‌شود.

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
    - پیوست‌ها فقط برای `runtime: "subagent"` پشتیبانی می‌شوند. زمان اجرای ACP آن‌ها را رد می‌کند.
    - فایل‌ها در فضای کاری فرزند در `.openclaw/attachments/<uuid>/` همراه با یک `.manifest.json` مادی‌سازی می‌شوند.
    - محتوای پیوست به‌طور خودکار از ماندگاری رونوشت حذف می‌شود.
    - ورودی‌های Base64 با بررسی‌های سخت‌گیرانهٔ الفبا/حاشیه‌گذاری و یک محافظ اندازه پیش از رمزگشایی اعتبارسنجی می‌شوند.
    - مجوزهای فایل برای پوشه‌ها `0700` و برای فایل‌ها `0600` هستند.
    - پاک‌سازی از سیاست `cleanup` پیروی می‌کند: `delete` همیشه پیوست‌ها را حذف می‌کند؛ `keep` فقط وقتی `retainOnSessionKeep: true` باشد آن‌ها را نگه می‌دارد.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

پرچم‌های آزمایشی ابزارهای داخلی. به‌طور پیش‌فرض خاموش است مگر اینکه یک قاعدهٔ فعال‌سازی خودکار سخت‌گیرانهٔ عاملی GPT-5 اعمال شود.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: ابزار ساختاریافته `update_plan` را برای ردیابی کارهای چندمرحله‌ای غیرساده فعال می‌کند.
- پیش‌فرض: `false` مگر اینکه `agents.defaults.embeddedPi.executionContract` (یا بازنویسی مخصوص هر agent) برای اجرای خانواده GPT-5 مربوط به OpenAI یا OpenAI Codex روی `"strict-agentic"` تنظیم شده باشد. برای فعال‌سازی اجباری ابزار خارج از آن دامنه، `true` را تنظیم کنید، یا برای خاموش نگه داشتن آن حتی در اجراهای strict-agentic GPT-5، `false` را تنظیم کنید.
- وقتی فعال باشد، prompt سیستمی همچنین راهنمای استفاده را اضافه می‌کند تا مدل فقط برای کارهای قابل‌توجه از آن استفاده کند و حداکثر یک مرحله را در وضعیت `in_progress` نگه دارد.

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

- `model`: مدل پیش‌فرض برای sub-agentهای ایجادشده. اگر حذف شود، sub-agentها مدل فراخواننده را به ارث می‌برند.
- `allowAgents`: فهرست مجاز پیش‌فرض از شناسه‌های agent مقصد برای `sessions_spawn` وقتی agent درخواست‌دهنده `subagents.allowAgents` خودش را تنظیم نکرده است (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان agent).
- `runTimeoutSeconds`: زمان پایان پیش‌فرض (برحسب ثانیه) برای `sessions_spawn` وقتی فراخوانی ابزار `runTimeoutSeconds` را حذف کند. `0` یعنی بدون زمان پایان.
- سیاست ابزار برای هر subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## ارائه‌دهنده‌های سفارشی و URLهای پایه

OpenClaw از کاتالوگ مدل داخلی استفاده می‌کند. ارائه‌دهنده‌های سفارشی را از طریق `models.providers` در پیکربندی یا `~/.openclaw/agents/<agentId>/agent/models.json` اضافه کنید.

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
    - برای نیازهای auth سفارشی از `authHeader: true` + `headers` استفاده کنید.
    - ریشه پیکربندی agent را با `OPENCLAW_AGENT_DIR` (یا `PI_CODING_AGENT_DIR`، نام مستعار متغیر محیطی قدیمی) بازنویسی کنید.
    - تقدم ادغام برای شناسه‌های ارائه‌دهنده مطابق:
      - مقدارهای غیرخالی `baseUrl` در `models.json` مربوط به agent برنده می‌شوند.
      - مقدارهای غیرخالی `apiKey` در agent فقط زمانی برنده می‌شوند که آن ارائه‌دهنده در زمینه پیکربندی/auth-profile فعلی توسط SecretRef مدیریت نشود.
      - مقدارهای `apiKey` ارائه‌دهنده مدیریت‌شده با SecretRef به‌جای پایدارسازی secretهای حل‌شده، از نشانگرهای منبع (`ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
      - مقدارهای header ارائه‌دهنده مدیریت‌شده با SecretRef از نشانگرهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
      - `apiKey`/`baseUrl` خالی یا غایب در agent به `models.providers` در پیکربندی fallback می‌کند.
      - `contextWindow`/`maxTokens` مدل مطابق، مقدار بالاتر بین پیکربندی صریح و مقدارهای ضمنی کاتالوگ را به کار می‌برند.
      - `contextTokens` مدل مطابق، وقتی موجود باشد، سقف runtime صریح را حفظ می‌کند؛ از آن برای محدود کردن context مؤثر بدون تغییر metadata بومی مدل استفاده کنید.
      - وقتی می‌خواهید پیکربندی، `models.json` را به‌طور کامل بازنویسی کند، از `models.mode: "replace"` استفاده کنید.
      - پایداری marker مبتنی بر مرجعیت منبع است: markerها از snapshot پیکربندی منبع فعال (پیش از resolution) نوشته می‌شوند، نه از مقدارهای secret حل‌شده runtime.

  </Accordion>
</AccordionGroup>

### جزئیات فیلدهای ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: رفتار کاتالوگ ارائه‌دهنده (`merge` یا `replace`).
    - `models.providers`: نگاشت ارائه‌دهنده سفارشی که با شناسه ارائه‌دهنده کلیدگذاری شده است.
      - ویرایش‌های ایمن: برای به‌روزرسانی‌های افزایشی از `openclaw config set models.providers.<id> '<json>' --strict-json --merge` یا `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌های مخرب را رد می‌کند مگر اینکه `--replace` را پاس دهید.

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: adapter درخواست (`openai-completions`، `openai-responses`، `anthropic-messages`، `google-generative-ai` و غیره). برای backendهای خودمیزبان `/v1/chat/completions` مانند MLX، vLLM، SGLang و بیشتر سرورهای local سازگار با OpenAI، از `openai-completions` استفاده کنید. یک ارائه‌دهنده سفارشی با `baseUrl` اما بدون `api` به‌طور پیش‌فرض `openai-completions` است؛ فقط وقتی backend از `/v1/responses` پشتیبانی می‌کند، `openai-responses` را تنظیم کنید.
    - `models.providers.*.apiKey`: اعتبارنامه ارائه‌دهنده (جایگزینی SecretRef/env ترجیح داده می‌شود).
    - `models.providers.*.auth`: راهبرد auth (`api-key`، `token`، `oauth`، `aws-sdk`).
    - `models.providers.*.contextWindow`: پنجره context بومی پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `contextWindow` را تنظیم نکرده باشد.
    - `models.providers.*.contextTokens`: سقف context runtime مؤثر پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `contextTokens` را تنظیم نکرده باشد.
    - `models.providers.*.maxTokens`: سقف token خروجی پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `maxTokens` را تنظیم نکرده باشد.
    - `models.providers.*.timeoutSeconds`: زمان پایان اختیاری درخواست HTTP مدل برای هر ارائه‌دهنده برحسب ثانیه، شامل مدیریت اتصال، headerها، body و لغو کل درخواست.
    - `models.providers.*.injectNumCtxForOpenAICompat`: برای Ollama + `openai-completions`، `options.num_ctx` را در درخواست‌ها inject کنید (پیش‌فرض: `true`).
    - `models.providers.*.authHeader`: وقتی لازم است، انتقال اعتبارنامه در header `Authorization` را اجباری کنید.
    - `models.providers.*.baseUrl`: URL پایه API بالادستی.
    - `models.providers.*.headers`: headerهای ثابت اضافی برای مسیریابی proxy/tenant.

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: بازنویسی‌های transport برای درخواست‌های HTTP ارائه‌دهنده مدل.

    - `request.headers`: headerهای اضافی (با پیش‌فرض‌های ارائه‌دهنده ادغام می‌شود). مقدارها SecretRef را می‌پذیرند.
    - `request.auth`: بازنویسی راهبرد auth. حالت‌ها: `"provider-default"` (استفاده از auth داخلی ارائه‌دهنده)، `"authorization-bearer"` (با `token`)، `"header"` (با `headerName`، `value`، و `prefix` اختیاری).
    - `request.proxy`: بازنویسی proxy HTTP. حالت‌ها: `"env-proxy"` (استفاده از متغیرهای env با نام‌های `HTTP_PROXY`/`HTTPS_PROXY`)، `"explicit-proxy"` (با `url`). هر دو حالت یک زیرشیء اختیاری `tls` را می‌پذیرند.
    - `request.tls`: بازنویسی TLS برای اتصال‌های مستقیم. فیلدها: `ca`، `cert`، `key`، `passphrase` (همه SecretRef را می‌پذیرند)، `serverName`، `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: وقتی `true` باشد، HTTPS به `baseUrl` را وقتی DNS به بازه‌های private، CGNAT یا مشابه حل می‌شود، از طریق guard واکشی HTTP ارائه‌دهنده مجاز می‌کند (opt-in اپراتور برای endpointهای خودمیزبان سازگار با OpenAI که مورد اعتماد هستند). URLهای جریان ارائه‌دهنده مدل روی loopback مانند `localhost`، `127.0.0.1` و `[::1]` به‌طور خودکار مجاز هستند مگر اینکه این گزینه صراحتا روی `false` تنظیم شود؛ میزبان‌های LAN، tailnet و DNS خصوصی همچنان به opt-in نیاز دارند. WebSocket از همان `request` برای headerها/TLS استفاده می‌کند، اما از آن gate مربوط به SSRF واکشی استفاده نمی‌کند. پیش‌فرض `false`.

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: ورودی‌های صریح کاتالوگ مدل ارائه‌دهنده.
    - `models.providers.*.models.*.input`: modalityهای ورودی مدل. برای مدل‌های فقط متن از `["text"]` و برای مدل‌های بومی image/vision از `["text", "image"]` استفاده کنید. پیوست‌های تصویر فقط وقتی مدل انتخاب‌شده به‌عنوان دارای قابلیت تصویر علامت‌گذاری شده باشد، در turnهای agent inject می‌شوند.
    - `models.providers.*.models.*.contextWindow`: metadata پنجره context بومی مدل. این گزینه `contextWindow` سطح ارائه‌دهنده را برای آن مدل بازنویسی می‌کند.
    - `models.providers.*.models.*.contextTokens`: سقف اختیاری context در runtime. این گزینه `contextTokens` سطح ارائه‌دهنده را بازنویسی می‌کند؛ وقتی بودجه context مؤثری کوچک‌تر از `contextWindow` بومی مدل می‌خواهید از آن استفاده کنید؛ `openclaw models list` هر دو مقدار را وقتی متفاوت باشند نشان می‌دهد.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: راهنمای سازگاری اختیاری. برای `api: "openai-completions"` با `baseUrl` غیرخالی و غیربومی (میزبانی غیر از `api.openai.com`)، OpenClaw در runtime این مقدار را به‌اجبار `false` می‌کند. `baseUrl` خالی/حذف‌شده رفتار پیش‌فرض OpenAI را نگه می‌دارد.
    - `models.providers.*.models.*.compat.requiresStringContent`: راهنمای سازگاری اختیاری برای endpointهای chat سازگار با OpenAI که فقط string می‌پذیرند. وقتی `true` باشد، OpenClaw پیش از ارسال درخواست، آرایه‌های متنی خالص `messages[].content` را به stringهای ساده flatten می‌کند.

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: ریشه تنظیمات کشف خودکار Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: کشف ضمنی را روشن/خاموش کنید.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: ناحیه AWS برای کشف.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: فیلتر اختیاری شناسه ارائه‌دهنده برای کشف هدفمند.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: بازه polling برای تازه‌سازی کشف.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: پنجره context fallback برای مدل‌های کشف‌شده.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: حداکثر tokenهای خروجی fallback برای مدل‌های کشف‌شده.

  </Accordion>
</AccordionGroup>

onboarding تعاملی ارائه‌دهنده سفارشی، ورودی تصویر را برای شناسه‌های رایج مدل vision مانند GPT-4o، Claude، Gemini، Qwen-VL، LLaVA، Pixtral، InternVL، Mllama، MiniCPM-V و GLM-4V استنباط می‌کند و پرسش اضافی را برای خانواده‌های شناخته‌شده فقط متن رد می‌کند. شناسه‌های مدل ناشناخته همچنان برای پشتیبانی تصویر prompt می‌دهند. onboarding غیرتعاملی از همان استنباط استفاده می‌کند؛ برای اجبار metadata دارای قابلیت تصویر، `--custom-image-input` را پاس دهید یا برای اجبار metadata فقط متن، `--custom-text-input` را پاس دهید.

### نمونه‌های ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ارائه‌دهنده همراه `cerebras` می‌تواند این را از طریق `openclaw onboard --auth-choice cerebras-api-key` پیکربندی کند. فقط وقتی پیش‌فرض‌ها را بازنویسی می‌کنید از پیکربندی صریح ارائه‌دهنده استفاده کنید.

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
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    سازگار با Anthropic، ارائه‌دهنده داخلی. میان‌بر: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    [مدل‌های محلی](/fa/gateway/local-models) را ببینید. خلاصه: یک مدل محلی بزرگ را از طریق LM Studio Responses API روی سخت‌افزار جدی اجرا کنید؛ مدل‌های میزبانی‌شده را برای پشتیبان با هم ادغام‌شده نگه دارید.
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

    `MINIMAX_API_KEY` را تنظیم کنید. میان‌برها: `openclaw onboard --auth-choice minimax-global-api` یا `openclaw onboard --auth-choice minimax-cn-api`. کاتالوگ مدل به‌صورت پیش‌فرض فقط M2.7 است. در مسیر استریم سازگار با Anthropic، OpenClaw به‌صورت پیش‌فرض تفکر MiniMax را غیرفعال می‌کند، مگر اینکه خودتان صراحتاً `thinking` را تنظیم کنید. `/fast on` یا `params.fastMode: true`، مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.

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

    برای اندپوینت چین: `baseUrl: "https://api.moonshot.cn/v1"` یا `openclaw onboard --auth-choice moonshot-api-key-cn`.

    اندپوینت‌های بومی Moonshot سازگاری مصرف استریم را روی ترابری مشترک `openai-completions` اعلام می‌کنند، و OpenClaw این را بر اساس قابلیت‌های اندپوینت فعال می‌کند، نه صرفاً شناسه ارائه‌دهنده داخلی.

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

    - اندپوینت عمومی: `https://api.z.ai/api/paas/v4`
    - اندپوینت کدنویسی (پیش‌فرض): `https://api.z.ai/api/coding/paas/v4`
    - برای اندپوینت عمومی، یک ارائه‌دهنده سفارشی با بازنویسی URL پایه تعریف کنید.

  </Accordion>
</AccordionGroup>

---

## مرتبط

- [پیکربندی — عامل‌ها](/fa/gateway/config-agents)
- [پیکربندی — کانال‌ها](/fa/gateway/config-channels)
- [مرجع پیکربندی](/fa/gateway/configuration-reference) — کلیدهای سطح بالای دیگر
- [ابزارها و plugins](/fa/tools)

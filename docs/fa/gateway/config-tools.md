---
read_when:
    - پیکربندی خط‌مشی `tools.*`، فهرست‌های مجاز، یا ویژگی‌های آزمایشی
    - ثبت ارائه‌دهندگان سفارشی یا بازنویسی نشانی‌های URL پایه
    - راه‌اندازی نقاط پایانی خودمیزبان سازگار با OpenAI
sidebarTitle: Tools and custom providers
summary: پیکربندی ابزارها (سیاست، کلیدهای آزمایشی، ابزارهای پشتیبانی‌شده توسط ارائه‌دهنده) و راه‌اندازی ارائه‌دهنده/نشانی پایه سفارشی
title: پیکربندی — ابزارها و ارائه‌دهندگان سفارشی
x-i18n:
    generated_at: "2026-05-05T01:46:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9196bff46d8b0f9447fb46b47fc764f5bbc4f0b19eb252d4db611e94e57b4883
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` کلیدهای پیکربندی و راه‌اندازی ارائه‌دهنده سفارشی / base-URL. برای عامل‌ها، کانال‌ها و دیگر کلیدهای پیکربندی سطح بالا، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## ابزارها

### پروفایل‌های ابزار

`tools.profile` یک فهرست مجاز پایه را پیش از `tools.allow`/`tools.deny` تنظیم می‌کند:

<Note>
راه‌اندازی محلی، پیکربندی‌های محلی جدید را وقتی تنظیم نشده باشند به‌صورت پیش‌فرض روی `tools.profile: "coding"` قرار می‌دهد (پروفایل‌های صریح موجود حفظ می‌شوند).
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
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | همه ابزارهای داخلی (Pluginهای ارائه‌دهنده را شامل نمی‌شود)                                                                          |

### `tools.allow` / `tools.deny`

سیاست سراسری مجاز/غیرمجاز برای ابزارها (`deny` اولویت دارد). به بزرگی و کوچکی حروف حساس نیست، از وایلدکارت‌های `*` پشتیبانی می‌کند. حتی وقتی سندباکس Docker خاموش است نیز اعمال می‌شود.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` و `apply_patch` شناسه‌های ابزار جداگانه هستند. `allow: ["write"]` همچنین `apply_patch` را برای مدل‌های سازگار فعال می‌کند، اما `deny: ["write"]` باعث منع `apply_patch` نمی‌شود. برای مسدود کردن همه تغییرات فایل، `group:fs` را منع کنید یا هر ابزار تغییردهنده را صراحتاً فهرست کنید:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

ابزارها را برای ارائه‌دهنده‌ها یا مدل‌های مشخص بیشتر محدود می‌کند. ترتیب: پروفایل پایه → پروفایل ارائه‌دهنده → allow/deny.

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

دسترسی اجرای ارتقایافته خارج از سندباکس را کنترل می‌کند:

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

- بازنویسی به‌ازای هر عامل (`agents.list[].tools.elevated`) فقط می‌تواند محدودتر کند.
- `/elevated on|off|ask|full` وضعیت را به‌ازای هر نشست ذخیره می‌کند؛ دستورهای درون‌خطی روی یک پیام واحد اعمال می‌شوند.
- `exec` ارتقایافته سندباکس را دور می‌زند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (`gateway` به‌صورت پیش‌فرض، یا `node` وقتی هدف exec برابر `node` باشد).

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

بررسی‌های ایمنی حلقه ابزار به‌صورت پیش‌فرض **غیرفعال هستند**. برای فعال کردن تشخیص، `enabled: true` را تنظیم کنید. تنظیمات می‌توانند به‌صورت سراسری در `tools.loopDetection` تعریف شوند و به‌ازای هر عامل در `agents.list[].tools.loopDetection` بازنویسی شوند.

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
  هنگام تکرار فراخوانی‌های ابزار یکسان/آرگومان‌های یکسان هشدار می‌دهد.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  در ابزارهای polling شناخته‌شده (`process.poll`, `command_status` و غیره) هشدار می‌دهد/مسدود می‌کند.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  در الگوهای جفتی متناوب بدون پیشرفت هشدار می‌دهد/مسدود می‌کند.
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

درک رسانهٔ ورودی را پیکربندی می‌کند (تصویر/صدا/ویدیو):

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
    - `args`: آرگومان‌های قالب‌بندی‌شده (از `{{MediaPath}}`، `{{Prompt}}`، `{{MaxChars}}` و غیره پشتیبانی می‌کند؛ `openclaw doctor --fix` جانگهدارهای منسوخ `{input}` را به `{{MediaPath}}` مهاجرت می‌دهد)

    **فیلدهای مشترک:**

    - `capabilities`: فهرست اختیاری (`image`، `audio`، `video`). پیش‌فرض‌ها: `openai`/`anthropic`/`minimax` → تصویر، `google` → تصویر+صدا+ویدیو، `groq` → صدا.
    - `prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`: بازنویسی‌های مختص هر ورودی.
    - `tools.media.image.timeoutSeconds` و ورودی‌های متناظر `timeoutSeconds` در مدل تصویر نیز وقتی عامل ابزار صریح `image` را فراخوانی می‌کند اعمال می‌شوند.
    - شکست‌ها به ورودی بعدی بازگشت می‌کنند.

    احراز هویت ارائه‌دهنده از ترتیب استاندارد پیروی می‌کند: `auth-profiles.json` → متغیرهای محیطی → `models.providers.*.apiKey`.

    **فیلدهای تکمیل ناهمگام:**

    - `asyncCompletion.directSend`: پرچم سازگاری منسوخ. وظایف رسانه‌ای ناهمگام تکمیل‌شده با واسطهٔ نشست درخواست‌کننده باقی می‌مانند تا عامل نتیجه را دریافت کند، تصمیم بگیرد چگونه به کاربر اطلاع دهد، و وقتی تحویل از مبدأ به آن نیاز دارد از ابزار پیام استفاده کند.

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
  <Accordion title="Visibility scopes">
    - `self`: فقط کلید نشست فعلی.
    - `tree`: نشست فعلی + نشست‌هایی که توسط نشست فعلی ایجاد شده‌اند (زیرعامل‌ها).
    - `agent`: هر نشستی که به شناسهٔ عامل فعلی تعلق دارد (اگر نشست‌های جداگانه برای هر فرستنده را زیر همان شناسهٔ عامل اجرا کنید، می‌تواند شامل کاربران دیگر هم بشود).
    - `all`: هر نشستی. هدف‌گیری میان‌عاملی همچنان به `tools.agentToAgent` نیاز دارد.
    - گیرهٔ سندباکس: وقتی نشست فعلی سندباکس‌شده است و `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، حتی اگر `tools.sessions.visibility="all"` باشد، دامنهٔ دید به‌اجبار `tree` می‌شود.

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
  <Accordion title="یادداشت‌های پیوست">
    - پیوست‌ها فقط برای `runtime: "subagent"` پشتیبانی می‌شوند. runtime مربوط به ACP آن‌ها را رد می‌کند.
    - فایل‌ها در workspace فرزند در مسیر `.openclaw/attachments/<uuid>/` همراه با یک `.manifest.json` materialize می‌شوند.
    - محتوای پیوست به‌طور خودکار از پایداری transcript حذف/پوشانده می‌شود.
    - ورودی‌های Base64 با بررسی‌های سخت‌گیرانه alphabet/padding و یک محافظ اندازه پیش از decode اعتبارسنجی می‌شوند.
    - مجوزهای فایل برای دایرکتوری‌ها `0700` و برای فایل‌ها `0600` است.
    - پاک‌سازی از سیاست `cleanup` پیروی می‌کند: `delete` همیشه پیوست‌ها را حذف می‌کند؛ `keep` فقط وقتی `retainOnSessionKeep: true` باشد آن‌ها را نگه می‌دارد.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

پرچم‌های ابزار داخلی آزمایشی. به‌صورت پیش‌فرض خاموش است، مگر اینکه یک قاعده فعال‌سازی خودکار سخت‌گیرانه agentic برای GPT-5 اعمال شود.

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
- پیش‌فرض: `false` مگر اینکه `agents.defaults.embeddedPi.executionContract` (یا override مخصوص هر agent) برای اجرای خانواده GPT-5 مربوط به OpenAI یا OpenAI Codex روی `"strict-agentic"` تنظیم شده باشد. برای اجبار به روشن بودن ابزار خارج از آن محدوده، `true` بگذارید، یا برای خاموش نگه داشتن آن حتی در اجراهای GPT-5 strict-agentic، `false` بگذارید.
- وقتی فعال باشد، system prompt همچنین راهنمای استفاده را اضافه می‌کند تا مدل فقط برای کارهای قابل‌توجه از آن استفاده کند و حداکثر یک گام را در وضعیت `in_progress` نگه دارد.

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

- `model`: مدل پیش‌فرض برای sub-agentهای spawn‌شده. اگر حذف شود، sub-agentها مدل فراخواننده را به ارث می‌برند.
- `allowAgents`: allowlist پیش‌فرض شناسه‌های agent هدف برای `sessions_spawn` وقتی agent درخواست‌کننده `subagents.allowAgents` خودش را تنظیم نکرده باشد (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان agent).
- `runTimeoutSeconds`: timeout پیش‌فرض (برحسب ثانیه) برای `sessions_spawn` وقتی فراخوانی ابزار `runTimeoutSeconds` را حذف کند. `0` یعنی بدون timeout.
- سیاست ابزار مخصوص هر subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## ارائه‌دهندگان سفارشی و URLهای پایه

OpenClaw از کاتالوگ مدل داخلی استفاده می‌کند. ارائه‌دهندگان سفارشی را از طریق `models.providers` در config یا `~/.openclaw/agents/<agentId>/agent/models.json` اضافه کنید.

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
  <Accordion title="اولویت احراز هویت و ادغام">
    - برای نیازهای احراز هویت سفارشی از `authHeader: true` + `headers` استفاده کنید.
    - ریشه config agent را با `OPENCLAW_AGENT_DIR` (یا `PI_CODING_AGENT_DIR`، یک alias قدیمی برای متغیر محیطی) override کنید.
    - اولویت ادغام برای شناسه‌های ارائه‌دهنده همسان:
      - مقدارهای غیرخالی `baseUrl` در `models.json` مربوط به agent برنده می‌شوند.
      - مقدارهای غیرخالی `apiKey` در agent فقط وقتی برنده می‌شوند که آن ارائه‌دهنده در زمینه config/auth-profile فعلی توسط SecretRef مدیریت نشود.
      - مقدارهای `apiKey` ارائه‌دهنده مدیریت‌شده با SecretRef از markerهای منبع (`ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند، نه اینکه secretهای resolve‌شده پایدار شوند.
      - مقدارهای header ارائه‌دهنده مدیریت‌شده با SecretRef از markerهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
      - `apiKey`/`baseUrl` خالی یا ناموجود در agent به `models.providers` در config fallback می‌کند.
      - `contextWindow`/`maxTokens` مدل همسان از مقدار بالاتر بین config صریح و مقدارهای ضمنی کاتالوگ استفاده می‌کند.
      - `contextTokens` مدل همسان وقتی یک سقف runtime صریح وجود داشته باشد آن را حفظ می‌کند؛ از آن برای محدود کردن context مؤثر بدون تغییر metadata بومی مدل استفاده کنید.
      - وقتی می‌خواهید config کاملاً `models.json` را بازنویسی کند، از `models.mode: "replace"` استفاده کنید.
      - پایداری marker وابسته به منبع و authoritative است: markerها از snapshot فعال config منبع (پیش از resolution) نوشته می‌شوند، نه از مقدارهای secret حل‌شده runtime.

  </Accordion>
</AccordionGroup>

### جزئیات فیلدهای ارائه‌دهنده

<AccordionGroup>
  <Accordion title="کاتالوگ سطح بالا">
    - `models.mode`: رفتار کاتالوگ ارائه‌دهنده (`merge` یا `replace`).
    - `models.providers`: map ارائه‌دهنده سفارشی با کلید شناسه ارائه‌دهنده.
      - ویرایش‌های امن: برای به‌روزرسانی‌های افزایشی از `openclaw config set models.providers.<id> '<json>' --strict-json --merge` یا `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌های مخرب را رد می‌کند مگر اینکه `--replace` را پاس بدهید.

  </Accordion>
  <Accordion title="اتصال و احراز هویت ارائه‌دهنده">
    - `models.providers.*.api`: adapter درخواست (`openai-completions`، `openai-responses`، `anthropic-messages`، `google-generative-ai`، و غیره). برای backendهای self-hosted در مسیر `/v1/chat/completions` مانند MLX، vLLM، SGLang، و بیشتر سرورهای محلی سازگار با OpenAI، از `openai-completions` استفاده کنید. یک ارائه‌دهنده سفارشی با `baseUrl` اما بدون `api` به‌صورت پیش‌فرض از `openai-completions` استفاده می‌کند؛ `openai-responses` را فقط وقتی تنظیم کنید که backend از `/v1/responses` پشتیبانی کند.
    - `models.providers.*.apiKey`: credential ارائه‌دهنده (جایگزینی SecretRef/env ترجیح دارد).
    - `models.providers.*.auth`: راهبرد احراز هویت (`api-key`، `token`، `oauth`، `aws-sdk`).
    - `models.providers.*.contextWindow`: پنجره context بومی پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `contextWindow` را تنظیم نکند.
    - `models.providers.*.contextTokens`: سقف context مؤثر runtime پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `contextTokens` را تنظیم نکند.
    - `models.providers.*.maxTokens`: سقف token خروجی پیش‌فرض برای مدل‌های زیر این ارائه‌دهنده وقتی ورودی مدل `maxTokens` را تنظیم نکند.
    - `models.providers.*.timeoutSeconds`: timeout اختیاری درخواست HTTP مدل برای هر ارائه‌دهنده برحسب ثانیه، شامل connect، headers، body، و مدیریت abort کل درخواست.
    - `models.providers.*.injectNumCtxForOpenAICompat`: برای Ollama + `openai-completions`، مقدار `options.num_ctx` را به درخواست‌ها inject می‌کند (پیش‌فرض: `true`).
    - `models.providers.*.authHeader`: وقتی لازم باشد، انتقال credential را در header با نام `Authorization` اجبار می‌کند.
    - `models.providers.*.baseUrl`: URL پایه API بالادستی.
    - `models.providers.*.headers`: headerهای ثابت اضافی برای مسیریابی proxy/tenant.

  </Accordion>
  <Accordion title="Overrideهای انتقال درخواست">
    `models.providers.*.request`: overrideهای انتقال برای درخواست‌های HTTP ارائه‌دهنده مدل.

    - `request.headers`: headerهای اضافی (با پیش‌فرض‌های ارائه‌دهنده ادغام می‌شوند). مقدارها SecretRef را می‌پذیرند.
    - `request.auth`: override راهبرد احراز هویت. حالت‌ها: `"provider-default"` (استفاده از احراز هویت داخلی ارائه‌دهنده)، `"authorization-bearer"` (با `token`)، `"header"` (با `headerName`، `value`، و `prefix` اختیاری).
    - `request.proxy`: override مربوط به HTTP proxy. حالت‌ها: `"env-proxy"` (استفاده از متغیرهای env مربوط به `HTTP_PROXY`/`HTTPS_PROXY`)، `"explicit-proxy"` (با `url`). هر دو حالت یک زیربخش اختیاری `tls` را می‌پذیرند.
    - `request.tls`: override مربوط به TLS برای اتصال‌های مستقیم. فیلدها: `ca`، `cert`، `key`، `passphrase` (همه SecretRef را می‌پذیرند)، `serverName`، `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: وقتی `true` باشد، در صورتی که DNS به محدوده‌های خصوصی، CGNAT، یا مشابه resolve شود، HTTPS به `baseUrl` را از طریق guard واکشی HTTP ارائه‌دهنده مجاز می‌کند (opt-in اپراتور برای endpointهای self-hosted سازگار با OpenAI و مورد اعتماد). URLهای stream ارائه‌دهنده مدل در loopback مانند `localhost`، `127.0.0.1`، و `[::1]` به‌صورت خودکار مجاز هستند مگر اینکه این مقدار صریحاً روی `false` تنظیم شود؛ میزبان‌های LAN، tailnet، و DNS خصوصی همچنان به opt-in نیاز دارند. WebSocket از همان `request` برای headers/TLS استفاده می‌کند اما از آن fetch SSRF gate استفاده نمی‌کند. پیش‌فرض `false`.

  </Accordion>
  <Accordion title="ورودی‌های کاتالوگ مدل">
    - `models.providers.*.models`: ورودی‌های صریح کاتالوگ مدل ارائه‌دهنده.
    - `models.providers.*.models.*.input`: modalityهای ورودی مدل. برای مدل‌های فقط متنی از `["text"]` و برای مدل‌های تصویر/vision بومی از `["text", "image"]` استفاده کنید. پیوست‌های تصویر فقط وقتی به turnهای agent تزریق می‌شوند که مدل انتخاب‌شده به‌عنوان image-capable علامت‌گذاری شده باشد.
    - `models.providers.*.models.*.contextWindow`: metadata پنجره context بومی مدل. این مقدار `contextWindow` سطح ارائه‌دهنده را برای آن مدل override می‌کند.
    - `models.providers.*.models.*.contextTokens`: سقف اختیاری context در runtime. این مقدار `contextTokens` سطح ارائه‌دهنده را override می‌کند؛ وقتی می‌خواهید بودجه context مؤثر کوچک‌تری نسبت به `contextWindow` بومی مدل داشته باشید از آن استفاده کنید؛ `openclaw models list` وقتی این دو مقدار متفاوت باشند هر دو را نشان می‌دهد.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: راهنمای سازگاری اختیاری. برای `api: "openai-completions"` با یک `baseUrl` غیرخالی و غیربومی (میزبانی که `api.openai.com` نیست)، OpenClaw در runtime این مقدار را به `false` اجبار می‌کند. `baseUrl` خالی/حذف‌شده رفتار پیش‌فرض OpenAI را نگه می‌دارد.
    - `models.providers.*.models.*.compat.requiresStringContent`: راهنمای سازگاری اختیاری برای endpointهای chat سازگار با OpenAI که فقط string می‌پذیرند. وقتی `true` باشد، OpenClaw آرایه‌های صرفاً متنی `messages[].content` را پیش از ارسال درخواست به stringهای ساده flatten می‌کند.

  </Accordion>
  <Accordion title="کشف Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: ریشه تنظیمات auto-discovery مربوط به Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: روشن/خاموش کردن discovery ضمنی.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقه AWS برای discovery.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: فیلتر اختیاری شناسه ارائه‌دهنده برای discovery هدفمند.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: بازه polling برای تازه‌سازی discovery.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: پنجره context fallback برای مدل‌های کشف‌شده.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: حداکثر tokenهای خروجی fallback برای مدل‌های کشف‌شده.

  </Accordion>
</AccordionGroup>

onboarding تعاملی ارائه‌دهنده سفارشی، ورودی تصویر را برای شناسه‌های رایج مدل vision مانند GPT-4o، Claude، Gemini، Qwen-VL، LLaVA، Pixtral، InternVL، Mllama، MiniCPM-V، و GLM-4V استنباط می‌کند و پرسش اضافی را برای خانواده‌های شناخته‌شده فقط متنی رد می‌کند. شناسه‌های مدل ناشناخته همچنان درباره پشتیبانی تصویر prompt می‌کنند. onboarding غیرتعاملی از همان استنباط استفاده می‌کند؛ برای اجبار metadata با قابلیت تصویر، `--custom-image-input` را پاس بدهید یا برای اجبار metadata فقط متنی، `--custom-text-input` را پاس بدهید.

### نمونه‌های ارائه‌دهنده

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ارائه‌دهنده bundled با نام `cerebras` می‌تواند این را از طریق `openclaw onboard --auth-choice cerebras-api-key` پیکربندی کند. فقط وقتی از config صریح ارائه‌دهنده استفاده کنید که defaultها را override می‌کنید.

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

    از `cerebras/zai-glm-4.7` برای Cerebras استفاده کنید؛ از `zai/glm-4.7` برای اتصال مستقیم Z.AI استفاده کنید.

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

    ارائه‌دهنده داخلی سازگار با Anthropic. میانبر: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    [مدل‌های محلی](/fa/gateway/local-models) را ببینید. خلاصه: یک مدل محلی بزرگ را از طریق LM Studio Responses API روی سخت‌افزار جدی اجرا کنید؛ مدل‌های میزبانی‌شده را برای fallback ادغام‌شده نگه دارید.
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

    `MINIMAX_API_KEY` را تنظیم کنید. میانبرها: `openclaw onboard --auth-choice minimax-global-api` یا `openclaw onboard --auth-choice minimax-cn-api`. کاتالوگ مدل به‌طور پیش‌فرض فقط M2.7 است. در مسیر streaming سازگار با Anthropic، OpenClaw به‌طور پیش‌فرض thinking در MiniMax را غیرفعال می‌کند مگر اینکه خودتان صراحتا `thinking` را تنظیم کنید. `/fast on` یا `params.fastMode: true` مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.

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

    endpointهای بومی Moonshot سازگاری استفاده از streaming را روی transport مشترک `openai-completions` اعلام می‌کنند، و OpenClaw این را بر اساس قابلیت‌های endpoint تعیین می‌کند، نه فقط بر اساس شناسه ارائه‌دهنده داخلی.

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

    `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`) را تنظیم کنید. برای کاتالوگ Zen از ارجاع‌های `opencode/...` و برای کاتالوگ Go از ارجاع‌های `opencode-go/...` استفاده کنید. میانبر: `openclaw onboard --auth-choice opencode-zen` یا `openclaw onboard --auth-choice opencode-go`.

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

    URL پایه باید `/v1` را حذف کند (کلاینت Anthropic آن را اضافه می‌کند). میانبر: `openclaw onboard --auth-choice synthetic-api-key`.

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

    `ZAI_API_KEY` را تنظیم کنید. `z.ai/*` و `z-ai/*` به‌عنوان نام‌های مستعار پذیرفته می‌شوند. میانبر: `openclaw onboard --auth-choice zai-api-key`.

    - endpoint عمومی: `https://api.z.ai/api/paas/v4`
    - endpoint کدنویسی (پیش‌فرض): `https://api.z.ai/api/coding/paas/v4`
    - برای endpoint عمومی، یک ارائه‌دهنده سفارشی با override کردن URL پایه تعریف کنید.

  </Accordion>
</AccordionGroup>

---

## مرتبط

- [پیکربندی — agentها](/fa/gateway/config-agents)
- [پیکربندی — channelها](/fa/gateway/config-channels)
- [مرجع پیکربندی](/fa/gateway/configuration-reference) — کلیدهای سطح بالای دیگر
- [ابزارها و pluginها](/fa/tools)

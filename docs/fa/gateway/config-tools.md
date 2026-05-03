---
read_when:
    - پیکربندی سیاست `tools.*`، فهرست‌های مجاز یا قابلیت‌های آزمایشی
    - ثبت ارائه‌دهندگان سفارشی یا بازنویسی نشانی‌های پایه
    - راه‌اندازی نقاط پایانی خودمیزبان سازگار با OpenAI
sidebarTitle: Tools and custom providers
summary: پیکربندی ابزارها (سیاست، تغییر وضعیت‌های آزمایشی، ابزارهای متکی به ارائه‌دهنده) و راه‌اندازی ارائه‌دهنده سفارشی/URL پایه
title: پیکربندی — ابزارها و ارائه‌دهندگان سفارشی
x-i18n:
    generated_at: "2026-05-03T21:33:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75a39342f40e9c329a7c61855e805ec43532cbdb89fbe801acc26830fd63b4da
    source_path: gateway/config-tools.md
    workflow: 16
---

کلیدهای پیکربندی `tools.*` و تنظیم ارائه‌دهندهٔ سفارشی / نشانی پایه. برای عامل‌ها، کانال‌ها، و دیگر کلیدهای پیکربندی سطح بالا، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## ابزارها

### پروفایل‌های ابزار

`tools.profile` پیش از `tools.allow`/`tools.deny` یک فهرست مجاز پایه تنظیم می‌کند:

<Note>
فرایند راه‌اندازی محلی، پیکربندی‌های محلی جدید را وقتی تنظیم نشده باشند به‌طور پیش‌فرض روی `tools.profile: "coding"` قرار می‌دهد (پروفایل‌های صریح موجود حفظ می‌شوند).
</Note>

| پروفایل     | شامل                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | فقط `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | بدون محدودیت (همانند حالت تنظیم‌نشده)                                                                                                  |

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

سیاست سراسری مجاز/ممنوع کردن ابزارها (ممنوع‌سازی اولویت دارد). به بزرگی و کوچکی حروف حساس نیست و از نویسه‌های عام `*` پشتیبانی می‌کند. حتی وقتی سندباکس Docker خاموش است نیز اعمال می‌شود.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` و `apply_patch` شناسه‌های ابزار جداگانه هستند. `allow: ["write"]` برای مدل‌های سازگار، `apply_patch` را نیز فعال می‌کند، اما `deny: ["write"]` باعث ممنوع شدن `apply_patch` نمی‌شود. برای مسدود کردن همهٔ تغییرات فایل، `group:fs` را ممنوع کنید یا هر ابزار تغییردهنده را صریحاً فهرست کنید:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

ابزارها را برای ارائه‌دهنده‌ها یا مدل‌های مشخص بیشتر محدود کنید. ترتیب: پروفایل پایه → پروفایل ارائه‌دهنده → مجاز/ممنوع.

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

- بازنویسی در سطح هر عامل (`agents.list[].tools.elevated`) فقط می‌تواند محدودیت بیشتری اعمال کند.
- `/elevated on|off|ask|full` وضعیت را برای هر نشست ذخیره می‌کند؛ دستورهای درون‌خطی روی یک پیام واحد اعمال می‌شوند.
- `exec` ارتقایافته از سندباکس عبور می‌کند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (به‌طور پیش‌فرض `gateway`، یا وقتی هدف اجرا `node` باشد، `node`).

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

بررسی‌های ایمنی حلقهٔ ابزار به‌طور پیش‌فرض **غیرفعال هستند**. برای فعال کردن تشخیص، `enabled: true` را تنظیم کنید. تنظیمات را می‌توان به‌صورت سراسری در `tools.loopDetection` تعریف کرد و در سطح هر عامل در `agents.list[].tools.loopDetection` بازنویسی کرد.

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
  هنگام فراخوانی‌های تکراری با همان ابزار/همان آرگومان‌ها هشدار بده.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  روی ابزارهای پیمایش شناخته‌شده (`process.poll`، `command_status`، و غیره) هشدار بده/مسدود کن.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  روی الگوهای جفتی متناوب بدون پیشرفت هشدار بده/مسدود کن.
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
  <Accordion title="Media model entry fields">
    **ورودی ارائه‌دهنده** (`type: "provider"` یا حذف‌شده):

    - `provider`: شناسه ارائه‌دهنده API (`openai`، `anthropic`، `google`/`gemini`، `groq` و غیره)
    - `model`: بازنویسی شناسه مدل
    - `profile` / `preferredProfile`: انتخاب نمایه `auth-profiles.json`

    **ورودی CLI** (`type: "cli"`):

    - `command`: فایل اجرایی برای اجرا
    - `args`: آرگومان‌های قالبی (از `{{MediaPath}}`، `{{Prompt}}`، `{{MaxChars}}` و غیره پشتیبانی می‌کند؛ `openclaw doctor --fix` نگهدارنده‌های منسوخ `{input}` را به `{{MediaPath}}` مهاجرت می‌دهد)

    **فیلدهای مشترک:**

    - `capabilities`: فهرست اختیاری (`image`، `audio`، `video`). پیش‌فرض‌ها: `openai`/`anthropic`/`minimax` → تصویر، `google` → تصویر+صدا+ویدیو، `groq` → صدا.
    - `prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`: بازنویسی‌های مخصوص هر ورودی.
    - ورودی‌های `tools.media.image.timeoutSeconds` و `timeoutSeconds` مدل تصویر متناظر، هنگام فراخوانی ابزار صریح `image` توسط عامل نیز اعمال می‌شوند.
    - شکست‌ها به ورودی بعدی بازمی‌گردند.

    احراز هویت ارائه‌دهنده از ترتیب استاندارد پیروی می‌کند: `auth-profiles.json` → متغیرهای محیطی → `models.providers.*.apiKey`.

    **فیلدهای تکمیل ناهمگام:**

    - `asyncCompletion.directSend`: وقتی `true` باشد، وظایف رسانه ناهمگام تکمیل‌شده که از تحویل مستقیم تکمیل پشتیبانی می‌کنند، ابتدا تحویل مستقیم به کانال را امتحان می‌کنند. پیش‌فرض: `false` (مسیر بیدارسازی نشست درخواست‌کننده/تحویل مدل). امروز این مورد برای `video_generate` ناهمگام اعمال می‌شود؛ تکمیل‌های `music_generate` ناهمگام حتی وقتی این گزینه فعال باشد، همچنان با میانجی‌گری نشست درخواست‌کننده انجام می‌شوند.

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

کنترل می‌کند کدام نشست‌ها می‌توانند توسط ابزارهای نشست (`sessions_list`، `sessions_history`، `sessions_send`) هدف قرار گیرند.

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
    - `agent`: هر نشستی که متعلق به شناسه عامل فعلی باشد (اگر نشست‌های مخصوص هر فرستنده را زیر همان شناسه عامل اجرا کنید، می‌تواند شامل کاربران دیگر هم باشد).
    - `all`: هر نشست. هدف‌گیری میان‌عاملی همچنان به `tools.agentToAgent` نیاز دارد.
    - محدودسازی sandbox: وقتی نشست فعلی sandbox شده باشد و `agents.defaults.sandbox.sessionToolsVisibility="spawned"` باشد، قابلیت مشاهده حتی اگر `tools.sessions.visibility="all"` باشد، به‌اجبار روی `tree` قرار می‌گیرد.

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
    - پیوست‌ها فقط برای `runtime: "subagent"` پشتیبانی می‌شوند. runtime مربوط به ACP آن‌ها را رد می‌کند.
    - فایل‌ها در workspace فرزند در مسیر `.openclaw/attachments/<uuid>/` همراه با یک `.manifest.json` ساخته می‌شوند.
    - محتوای پیوست به‌طور خودکار از پایداری transcript حذف محرمانه می‌شود.
    - ورودی‌های Base64 با بررسی‌های سخت‌گیرانه حروف مجاز/پدینگ و یک محافظ اندازه پیش از decode اعتبارسنجی می‌شوند.
    - مجوزهای فایل برای پوشه‌ها `0700` و برای فایل‌ها `0600` است.
    - پاک‌سازی از سیاست `cleanup` پیروی می‌کند: `delete` همیشه پیوست‌ها را حذف می‌کند؛ `keep` فقط وقتی `retainOnSessionKeep: true` باشد آن‌ها را نگه می‌دارد.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

پرچم‌های ابزار داخلی آزمایشی. پیش‌فرض خاموش است، مگر اینکه یک قاعده فعال‌سازی خودکار strict-agentic برای GPT-5 اعمال شود.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: ابزار ساختاریافته `update_plan` را برای رهگیری کارهای چندمرحله‌ای غیرساده فعال می‌کند.
- پیش‌فرض: `false` مگر اینکه `agents.defaults.embeddedPi.executionContract` (یا یک بازنویسی برای هر عامل) برای اجرای خانواده GPT-5 مربوط به OpenAI یا OpenAI Codex روی `"strict-agentic"` تنظیم شده باشد. برای اجبار به روشن بودن ابزار خارج از آن محدوده، `true` تنظیم کنید، یا برای خاموش نگه داشتن آن حتی در اجراهای strict-agentic GPT-5، `false` تنظیم کنید.
- وقتی فعال باشد، system prompt همچنین راهنمای استفاده اضافه می‌کند تا مدل فقط برای کارهای قابل‌توجه از آن استفاده کند و حداکثر یک گام را در وضعیت `in_progress` نگه دارد.

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
- `allowAgents`: allowlist پیش‌فرض شناسه‌های عامل مقصد برای `sessions_spawn` وقتی عامل درخواست‌دهنده مقدار `subagents.allowAgents` خودش را تنظیم نکرده باشد (`["*"]` = هرکدام؛ پیش‌فرض: فقط همان عامل).
- `runTimeoutSeconds`: timeout پیش‌فرض (ثانیه) برای `sessions_spawn` وقتی فراخوانی ابزار `runTimeoutSeconds` را حذف کند. `0` یعنی بدون timeout.
- سیاست ابزار برای هر زیرعامل: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

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
  <Accordion title="Auth and merge precedence">
    - برای نیازهای auth سفارشی از `authHeader: true` + `headers` استفاده کنید.
    - ریشه config عامل را با `OPENCLAW_AGENT_DIR` (یا `PI_CODING_AGENT_DIR`، یک alias قدیمی برای متغیر محیطی) بازنویسی کنید.
    - اولویت merge برای شناسه‌های provider منطبق:
      - مقدارهای غیرخالی `baseUrl` در `models.json` عامل برنده می‌شوند.
      - مقدارهای غیرخالی `apiKey` عامل فقط وقتی برنده می‌شوند که آن provider در زمینه config/auth-profile فعلی با SecretRef مدیریت نشده باشد.
      - مقدارهای `apiKey` برای provider مدیریت‌شده با SecretRef به‌جای پایدارسازی secretهای resolve‌شده، از markerهای منبع (`ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
      - مقدارهای header برای provider مدیریت‌شده با SecretRef از markerهای منبع (`secretref-env:ENV_VAR_NAME` برای ارجاع‌های env، `secretref-managed` برای ارجاع‌های file/exec) تازه‌سازی می‌شوند.
      - `apiKey`/`baseUrl` خالی یا غایب عامل به `models.providers` در config برمی‌گردد.
      - مدل منطبق `contextWindow`/`maxTokens` مقدار بالاتر بین config صریح و مقدارهای ضمنی کاتالوگ را به‌کار می‌گیرد.
      - مدل منطبق `contextTokens` وقتی وجود داشته باشد یک سقف runtime صریح را حفظ می‌کند؛ از آن برای محدود کردن context مؤثر بدون تغییر metadata بومی مدل استفاده کنید.
      - وقتی می‌خواهید config به‌طور کامل `models.json` را بازنویسی کند، از `models.mode: "replace"` استفاده کنید.
      - پایداری markerها منبع‌محور است: markerها از snapshot فعال config منبع (پیش از resolution) نوشته می‌شوند، نه از مقدارهای secret حل‌شده در runtime.

  </Accordion>
</AccordionGroup>

### جزئیات فیلدهای provider

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: رفتار کاتالوگ provider (`merge` یا `replace`).
    - `models.providers`: نگاشت provider سفارشی که با شناسه provider کلیدگذاری شده است.
      - ویرایش‌های ایمن: برای به‌روزرسانی‌های افزایشی از `openclaw config set models.providers.<id> '<json>' --strict-json --merge` یا `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` استفاده کنید. `config set` جایگزینی‌های مخرب را رد می‌کند، مگر اینکه `--replace` را ارسال کنید.

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: adapter درخواست (`openai-completions`، `openai-responses`، `anthropic-messages`، `google-generative-ai` و غیره). برای backendهای self-hosted در `/v1/chat/completions` مانند MLX، vLLM، SGLang و بیشتر سرورهای محلی سازگار با OpenAI، از `openai-completions` استفاده کنید. provider سفارشی با `baseUrl` اما بدون `api` به‌صورت پیش‌فرض `openai-completions` است؛ فقط وقتی backend از `/v1/responses` پشتیبانی می‌کند، `openai-responses` را تنظیم کنید.
    - `models.providers.*.apiKey`: credential مربوط به provider (جایگزینی SecretRef/env ترجیح داده می‌شود).
    - `models.providers.*.auth`: راهبرد auth (`api-key`، `token`، `oauth`، `aws-sdk`).
    - `models.providers.*.contextWindow`: پنجره context بومی پیش‌فرض برای مدل‌های زیر این provider وقتی entry مدل `contextWindow` را تنظیم نکرده باشد.
    - `models.providers.*.contextTokens`: سقف context مؤثر runtime پیش‌فرض برای مدل‌های زیر این provider وقتی entry مدل `contextTokens` را تنظیم نکرده باشد.
    - `models.providers.*.maxTokens`: سقف token خروجی پیش‌فرض برای مدل‌های زیر این provider وقتی entry مدل `maxTokens` را تنظیم نکرده باشد.
    - `models.providers.*.timeoutSeconds`: timeout اختیاری درخواست HTTP مدل برای هر provider بر حسب ثانیه، شامل مدیریت connect، headerها، body و abort کل درخواست.
    - `models.providers.*.injectNumCtxForOpenAICompat`: برای Ollama + `openai-completions`، مقدار `options.num_ctx` را به درخواست‌ها تزریق می‌کند (پیش‌فرض: `true`).
    - `models.providers.*.authHeader`: انتقال credential در header مربوط به `Authorization` را هنگام نیاز اجباری می‌کند.
    - `models.providers.*.baseUrl`: URL پایه API بالادستی.
    - `models.providers.*.headers`: headerهای static اضافی برای مسیریابی proxy/tenant.

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: بازنویسی‌های transport برای درخواست‌های HTTP ارائه‌دهنده مدل.

    - `request.headers`: headerهای اضافی (با پیش‌فرض‌های provider ادغام می‌شوند). مقدارها SecretRef را می‌پذیرند.
    - `request.auth`: بازنویسی راهبرد auth. حالت‌ها: `"provider-default"` (استفاده از auth داخلی provider)، `"authorization-bearer"` (با `token`)، `"header"` (با `headerName`، `value`، و `prefix` اختیاری).
    - `request.proxy`: بازنویسی HTTP proxy. حالت‌ها: `"env-proxy"` (استفاده از متغیرهای env مربوط به `HTTP_PROXY`/`HTTPS_PROXY`)، `"explicit-proxy"` (با `url`). هر دو حالت یک زیرشیء اختیاری `tls` را می‌پذیرند.
    - `request.tls`: بازنویسی TLS برای اتصال‌های مستقیم. فیلدها: `ca`، `cert`، `key`، `passphrase` (همه SecretRef را می‌پذیرند)، `serverName`، `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: وقتی `true` باشد، اگر DNS به محدوده‌های private، CGNAT یا مشابه resolve شود، HTTPS به `baseUrl` را از طریق محافظ fetch HTTP مربوط به provider مجاز می‌کند (opt-in اپراتور برای endpointهای self-hosted سازگار با OpenAI و مورداعتماد). URLهای stream ارائه‌دهنده مدل روی loopback مانند `localhost`، `127.0.0.1` و `[::1]` به‌طور خودکار مجازند مگر اینکه این مقدار صراحتاً روی `false` تنظیم شده باشد؛ میزبان‌های LAN، tailnet و DNS خصوصی همچنان به opt-in نیاز دارند. WebSocket از همان `request` برای headerها/TLS استفاده می‌کند اما از آن gate مربوط به SSRF در fetch استفاده نمی‌کند. پیش‌فرض `false`.

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: entryهای صریح کاتالوگ مدل provider.
    - `models.providers.*.models.*.input`: modalityهای ورودی مدل. برای مدل‌های فقط متن از `["text"]` و برای مدل‌های بومی image/vision از `["text", "image"]` استفاده کنید. پیوست‌های image فقط وقتی به turnهای عامل تزریق می‌شوند که مدل انتخاب‌شده image-capable علامت‌گذاری شده باشد.
    - `models.providers.*.models.*.contextWindow`: metadata پنجره context بومی مدل. این مقدار `contextWindow` سطح provider را برای آن مدل بازنویسی می‌کند.
    - `models.providers.*.models.*.contextTokens`: سقف اختیاری context در runtime. این مقدار `contextTokens` سطح provider را بازنویسی می‌کند؛ وقتی بودجه context مؤثر کوچک‌تری نسبت به `contextWindow` بومی مدل می‌خواهید، از آن استفاده کنید؛ `openclaw models list` وقتی این دو مقدار تفاوت داشته باشند، هر دو را نشان می‌دهد.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: راهنمای اختیاری سازگاری. برای `api: "openai-completions"` با `baseUrl` غیرخالی و غیربومی (میزبانی که `api.openai.com` نیست)، OpenClaw در runtime این مقدار را به `false` اجبار می‌کند. `baseUrl` خالی/حذف‌شده رفتار پیش‌فرض OpenAI را حفظ می‌کند.
    - `models.providers.*.models.*.compat.requiresStringContent`: راهنمای اختیاری سازگاری برای endpointهای chat سازگار با OpenAI که فقط string می‌پذیرند. وقتی `true` باشد، OpenClaw آرایه‌های pure text مربوط به `messages[].content` را پیش از ارسال درخواست به stringهای ساده flatten می‌کند.

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: ریشه تنظیمات auto-discovery مربوط به Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: روشن/خاموش کردن discovery ضمنی.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقه AWS برای discovery.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: فیلتر اختیاری شناسه provider برای discovery هدفمند.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصله polling برای تازه‌سازی discovery.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: پنجره context fallback برای مدل‌های کشف‌شده.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: حداکثر tokenهای خروجی fallback برای مدل‌های کشف‌شده.

  </Accordion>
</AccordionGroup>

onboarding تعاملی provider سفارشی، ورودی image را برای شناسه‌های رایج مدل‌های vision مانند GPT-4o، Claude، Gemini، Qwen-VL، LLaVA، Pixtral، InternVL، Mllama، MiniCPM-V و GLM-4V استنتاج می‌کند و برای خانواده‌های شناخته‌شده فقط متن، پرسش اضافی را رد می‌کند. شناسه‌های ناشناخته مدل همچنان درباره پشتیبانی image پرسش می‌کنند. onboarding غیرتعاملی از همان استنتاج استفاده می‌کند؛ برای اجبار metadata مربوط به image-capable، `--custom-image-input` را ارسال کنید یا برای اجبار metadata فقط متن، `--custom-text-input` را ارسال کنید.

### نمونه‌های provider

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ارائه‌دهنده همراه `cerebras` می‌تواند این را از طریق `openclaw onboard --auth-choice cerebras-api-key` پیکربندی کند. فقط هنگام بازنویسی پیش‌فرض‌ها از config صریح provider استفاده کنید.

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

    برای Cerebras از `cerebras/zai-glm-4.7` استفاده کنید؛ برای دسترسی مستقیم Z.AI از `zai/glm-4.7` استفاده کنید.

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
    [مدل‌های محلی](/fa/gateway/local-models) را ببینید. خلاصه: یک مدل محلی بزرگ را از طریق LM Studio Responses API روی سخت‌افزار جدی اجرا کنید؛ مدل‌های میزبانی‌شده را برای پشتیبان ادغام‌شده نگه دارید.
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

    `MINIMAX_API_KEY` را تنظیم کنید. میان‌برها: `openclaw onboard --auth-choice minimax-global-api` یا `openclaw onboard --auth-choice minimax-cn-api`. کاتالوگ مدل به‌صورت پیش‌فرض فقط روی M2.7 است. در مسیر استریم سازگار با Anthropic، OpenClaw به‌صورت پیش‌فرض تفکر MiniMax را غیرفعال می‌کند، مگر اینکه خودتان صراحتا `thinking` را تنظیم کنید. `/fast on` یا `params.fastMode: true` مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.

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

    نقاط پایانی بومی Moonshot سازگاری با مصرف استریم را روی انتقال مشترک `openai-completions` اعلام می‌کنند، و OpenClaw آن را بر اساس قابلیت‌های نقطه پایانی فعال می‌کند، نه فقط شناسه ارائه‌دهنده داخلی.

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

    `ZAI_API_KEY` را تنظیم کنید. `z.ai/*` و `z-ai/*` به‌عنوان نام‌های مستعار پذیرفته می‌شوند. میان‌بر: `openclaw onboard --auth-choice zai-api-key`.

    - نقطه پایانی عمومی: `https://api.z.ai/api/paas/v4`
    - نقطه پایانی کدنویسی (پیش‌فرض): `https://api.z.ai/api/coding/paas/v4`
    - برای نقطه پایانی عمومی، یک ارائه‌دهنده سفارشی با بازنویسی نشانی پایه تعریف کنید.

  </Accordion>
</AccordionGroup>

---

## مرتبط

- [پیکربندی — agents](/fa/gateway/config-agents)
- [پیکربندی — channels](/fa/gateway/config-channels)
- [مرجع پیکربندی](/fa/gateway/configuration-reference) — کلیدهای سطح بالای دیگر
- [ابزارها و plugins](/fa/tools)

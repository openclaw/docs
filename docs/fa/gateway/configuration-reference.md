---
read_when:
    - به معناشناسی دقیق پیکربندی در سطح فیلد یا پیش‌فرض‌ها نیاز دارید
    - در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای هسته OpenClaw، مقادیر پیش‌فرض، و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-05-10T19:40:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71a9b9ba64b334086a3e32fd9255eb45f9089818a1798a4d542d39d586d53fd9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی یک زیرسامانه مرجع عمیق‌تری برای خود دارد، به آن پیوند می‌دهد. کاتالوگ‌های فرمان متعلق به کانال و Plugin و تنظیمات عمیق حافظه/QMD به‌جای این صفحه در صفحات خودشان قرار دارند.

حقیقت کد:

- `openclaw config schema` طرحواره JSON زنده‌ای را چاپ می‌کند که برای اعتبارسنجی و Control UI استفاده می‌شود، همراه با فراداده‌های بسته‌بندی‌شده/Plugin/کانال که در صورت موجود بودن ادغام شده‌اند
- `config.schema.lookup` یک گره طرحواره محدود به مسیر را برای ابزارهای بررسی جزئی برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش خط مبنای مستندات پیکربندی را در برابر سطح طرحواره فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی عامل: پیش از ویرایش‌ها، برای مستندات و محدودیت‌های دقیق در سطح فیلد از کنش ابزار `gateway` با نام `config.schema.lookup` استفاده کنید. برای راهنمایی وظیفه‌محور از [پیکربندی](/fa/gateway/configuration) و برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها و پیوندها به مراجع زیرسامانه‌ها از این صفحه استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`،‏ `memory.qmd.*`،‏ `memory.citations`، و پیکربندی Dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [فرمان‌های اسلش](/fa/tools/slash-commands) برای کاتالوگ فعلی فرمان‌های داخلی + بسته‌بندی‌شده
- صفحات کانال/Plugin مالک برای سطوح فرمان اختصاصی کانال

قالب پیکربندی **JSON5** است (کامنت و ویرگول انتهایی مجاز است). همه فیلدها اختیاری‌اند - وقتی حذف شوند، OpenClaw از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند - برای `channels.*` به [پیکربندی - کانال‌ها](/fa/gateway/config-channels) مراجعه کنید، شامل Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و دیگر کانال‌های بسته‌بندی‌شده (احراز هویت، کنترل دسترسی، چندحسابی، و دروازه‌گذاری منشن).

## پیش‌فرض‌های عامل، چندعاملی، نشست‌ها و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است - برای موارد زیر به [پیکربندی - عامل‌ها](/fa/gateway/config-agents) مراجعه کنید:

- `agents.defaults.*` (فضای کاری، مدل، تفکر، Heartbeat، حافظه، رسانه، Skills، سندباکس)
- `multiAgent.*` (مسیریابی و اتصال‌های چندعاملی)
- `session.*` (چرخه عمر نشست، Compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر Markdown)
- `talk.*` (حالت Talk)
  - `talk.consultThinkingLevel`: بازنویسی سطح تفکر برای اجرای کامل عامل OpenClaw پشت مشاوره‌های بلادرنگ Talk در Control UI
  - `talk.consultFastMode`: بازنویسی یک‌باره حالت سریع برای مشاوره‌های بلادرنگ Talk در Control UI
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk در iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال رونوشت، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، سوییچ‌های آزمایشی، پیکربندی ابزار متکی به ارائه‌دهنده، و راه‌اندازی ارائه‌دهنده سفارشی / نشانی پایه به صفحه‌ای اختصاصی منتقل شده‌اند - [پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools) را ببینید.

## مدل‌ها

تعریف‌های ارائه‌دهنده، فهرست‌های مجاز مدل، و راه‌اندازی ارائه‌دهنده سفارشی در [پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند. ریشه `models` همچنین مالک رفتار سراسری کاتالوگ مدل است.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: رفتار کاتالوگ ارائه‌دهنده (`merge` یا `replace`).
- `models.providers`: نگاشت ارائه‌دهنده سفارشی با کلید شناسه ارائه‌دهنده.
- `models.providers.*.localService`: مدیر فرایند اختیاری و درخواستی برای سرورهای مدل محلی. OpenClaw نقطه سلامت پیکربندی‌شده را بررسی می‌کند، در صورت نیاز `command` مطلق را اجرا می‌کند، منتظر آمادگی می‌ماند، سپس درخواست مدل را می‌فرستد. [سرویس‌های مدل محلی](/fa/gateway/local-model-services) را ببینید.
- `models.pricing.enabled`: بوت‌استرپ قیمت‌گذاری پس‌زمینه را کنترل می‌کند که پس از رسیدن سایدکارها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد، Gateway دریافت کاتالوگ قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقادیر پیکربندی‌شده `models.providers.*.models[].cost` همچنان برای برآوردهای هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط Pi تعبیه‌شده و دیگر آداپتورهای زمان اجرا مصرف می‌شوند. فرمان‌های `openclaw mcp list`،‏ `show`،‏ `set` و `unset` این بلوک را بدون اتصال به سرور مقصد هنگام ویرایش پیکربندی مدیریت می‌کنند.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: تعریف‌های سرور MCP نام‌دار از نوع stdio یا راه‌دور برای زمان‌اجراهایی که ابزارهای MCP پیکربندی‌شده را ارائه می‌کنند. ورودی‌های راه‌دور از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛ `type: "http"` یک نام مستعار بومی CLI است که `openclaw mcp set` و `openclaw doctor --fix` آن را به فیلد استاندارد `transport` نرمال می‌کنند.
- `mcp.sessionIdleTtlMs`: TTL بیکار برای زمان‌اجراهای MCP بسته‌بندی‌شده و محدود به نشست. اجراهای تعبیه‌شده تک‌مرحله‌ای درخواست پاک‌سازی پایان اجرا می‌دهند؛ این TTL پشتوانه نشست‌های بلندمدت و فراخواننده‌های آینده است.
- تغییرات زیر `mcp.*` با کنار گذاشتن زمان‌اجراهای MCP نشستِ کش‌شده به‌صورت داغ اعمال می‌شوند. کشف/استفاده بعدی ابزار آن‌ها را از پیکربندی جدید بازمی‌سازد، بنابراین ورودی‌های حذف‌شده `mcp.servers` به‌جای انتظار برای TTL بیکار، بلافاصله جمع‌آوری می‌شوند.

برای رفتار زمان اجرا، [MCP](/fa/cli/mcp#openclaw-as-an-mcp-client-registry) و [بک‌اندهای CLI](/fa/gateway/cli-backends#bundle-mcp-overlays) را ببینید.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: فهرست مجاز اختیاری فقط برای Skills بسته‌بندی‌شده (Skills مدیریت‌شده/فضای کاری تحت تأثیر قرار نمی‌گیرند).
- `load.extraDirs`: ریشه‌های اشتراکی اضافه برای Skill (پایین‌ترین اولویت).
- `load.allowSymlinkTargets`: ریشه‌های مقصد واقعی و مورد اعتماد که symlinkهای Skill می‌توانند وقتی پیوند بیرون از ریشه منبع پیکربندی‌شده خود قرار دارد، به آن‌ها resolve شوند.
- `install.preferBrew`: وقتی true باشد، اگر `brew` در دسترس باشد، پیش از بازگشت به انواع دیگر نصب‌کننده، نصب‌کننده‌های Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح نصب‌کننده node برای مشخصات `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: به کلاینت‌های Gateway مورد اعتماد `operator.admin` اجازه می‌دهد آرشیوهای zip خصوصی را که از طریق `skills.upload.*` مرحله‌بندی شده‌اند نصب کنند (پیش‌فرض: false). این فقط مسیر آرشیو آپلودشده را فعال می‌کند؛ نصب‌های عادی ClawHub به آن نیاز ندارند.
- `entries.<skillKey>.enabled: false` یک Skill را حتی اگر بسته‌بندی/نصب شده باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بری برای Skills که یک متغیر env اصلی اعلام می‌کنند (رشته متن ساده یا شیء SecretRef).

---

## Pluginها

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- از `~/.openclaw/extensions`،‏ `<workspace>/.openclaw/extensions`، به‌همراه `plugins.load.paths` بارگذاری می‌شود.
- کشف، Pluginهای بومی OpenClaw به‌علاوه بسته‌های سازگار Codex و بسته‌های Claude را می‌پذیرد، شامل بسته‌های چیدمان پیش‌فرض Claude بدون manifest.
- **تغییرات پیکربندی به راه‌اندازی مجدد gateway نیاز دارند.**
- `allow`: فهرست مجاز اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` اولویت دارد.
- `bundledDiscovery`: برای پیکربندی‌های جدید به‌صورت پیش‌فرض `"allowlist"` است، بنابراین `plugins.allow` غیرخالی، Pluginهای ارائه‌دهنده بسته‌بندی‌شده از جمله ارائه‌دهندگان زمان اجرای جست‌وجوی وب را نیز محدود می‌کند. Doctor برای پیکربندی‌های فهرست مجاز قدیمی مهاجرت‌داده‌شده `"compat"` می‌نویسد تا رفتار ارائه‌دهنده بسته‌بندی‌شده موجود تا زمان انتخاب آگاهانه شما حفظ شود.
- `plugins.entries.<id>.apiKey`: فیلد میان‌بر کلید API در سطح Plugin (وقتی توسط Plugin پشتیبانی شود).
- `plugins.entries.<id>.env`: نگاشت متغیر env محدود به Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، هسته `before_prompt_build` را مسدود می‌کند و فیلدهای تغییر‌دهنده prompt از `before_agent_start` قدیمی را نادیده می‌گیرد، در حالی که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. روی hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط بسته‌های پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیر بسته‌بندی‌شده و مورد اعتماد می‌توانند محتوای خام مکالمه را از hookهای نوع‌دار مانند `llm_input`،‏ `llm_output`،‏ `before_model_resolve`،‏ `before_agent_reply`،‏ `before_agent_run`،‏ `before_agent_finalize`، و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌صراحت به این Plugin اعتماد می‌کند تا برای اجراهای عامل فرعی پس‌زمینه، بازنویسی‌های `provider` و `model` در سطح هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: فهرست مجاز اختیاری از اهداف استاندارد `provider/model` برای بازنویسی‌های عامل فرعی مورد اعتماد. فقط وقتی از روی عمد می‌خواهید هر مدلی را مجاز کنید از `"*"` استفاده کنید.
- `plugins.entries.<id>.llm.allowModelOverride`: به‌صراحت به این Plugin اعتماد می‌کند تا برای `api.runtime.llm.complete` بازنویسی مدل درخواست کند.
- `plugins.entries.<id>.llm.allowedModels`: فهرست مجاز اختیاری از اهداف استاندارد `provider/model` برای بازنویسی‌های تکمیل LLM توسط Plugin مورد اعتماد. فقط وقتی از روی عمد می‌خواهید هر مدلی را مجاز کنید از `"*"` استفاده کنید.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: به‌صراحت به این Plugin اعتماد می‌کند تا `api.runtime.llm.complete` را علیه یک شناسه عامل غیرپیش‌فرض اجرا کند.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (وقتی در دسترس باشد، با طرحواره Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/زمان اجرای Plugin کانال زیر `channels.<id>` قرار دارند و باید توسط فراداده `channelConfigs` در manifest متعلق به Plugin مالک توصیف شوند، نه توسط یک رجیستری مرکزی گزینه‌های OpenClaw.

### پیکربندی Plugin هارنس Codex

Plugin بسته‌بندی‌شده `codex` مالک تنظیمات هارنس بومی سرور برنامه Codex زیر `plugins.entries.codex.config` است. برای سطح کامل پیکربندی، [مرجع هارنس Codex](/fa/plugins/codex-harness-reference) و برای مدل زمان اجرا، [هارنس Codex](/fa/plugins/codex-harness) را ببینید.

`codexPlugins` فقط روی نشست‌هایی اعمال می‌شود که هارنس بومی Codex را انتخاب می‌کنند. این گزینه Pluginهای Codex را برای Pi، اجراهای عادی ارائه‌دهنده OpenAI، اتصال‌های مکالمه ACP یا هیچ هارنس غیر Codex فعال نمی‌کند.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: پشتیبانی بومی Plugin/برنامه Codex
  را برای هارنس Codex فعال می‌کند. پیش‌فرض: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سیاست پیش‌فرض اقدام‌های مخرب برای درخواست‌های برنامه Plugin مهاجرت‌یافته.
  پیش‌فرض: `false`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: یک ورودی
  Plugin مهاجرت‌یافته را وقتی `codexPlugins.enabled` سراسری نیز true باشد فعال می‌کند.
  پیش‌فرض: `true` برای ورودی‌های صریح.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هویت پایدار بازارچه. V1 فقط از `"openai-curated"` پشتیبانی می‌کند.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هویت پایدار
  Plugin Codex از مهاجرت، برای مثال `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  بازنویسی اقدام مخرب برای هر Plugin. وقتی حذف شود، مقدار سراسری
  `allow_destructive_actions` استفاده می‌شود.

`codexPlugins.enabled` دستور فعال‌سازی سراسری است. ورودی‌های صریح Plugin
که توسط مهاجرت نوشته می‌شوند، مجموعه پایدار نصب و واجد شرایط تعمیر هستند.
`plugins["*"]` پشتیبانی نمی‌شود، هیچ کلید `install` وجود ندارد، و مقادیر محلی
`marketplacePath` عمدا فیلدهای پیکربندی نیستند چون مختص میزبان هستند.

بررسی‌های آمادگی `app/list` برای یک ساعت کش می‌شوند و وقتی کهنه باشند
به‌صورت ناهمگام تازه‌سازی می‌شوند. پیکربندی برنامه نخ Codex هنگام برقراری
نشست هارنس Codex محاسبه می‌شود، نه در هر نوبت؛ پس از تغییر پیکربندی Plugin
بومی از `/new`، `/reset`، یا راه‌اندازی مجدد Gateway استفاده کنید.

- `plugins.entries.firecrawl.config.webFetch`: تنظیمات ارائه‌دهنده واکشی وب Firecrawl.
  - `apiKey`: کلید API Firecrawl (SecretRef را می‌پذیرد). در صورت نبود، به `plugins.entries.firecrawl.config.webSearch.apiKey`، `tools.web.fetch.firecrawl.apiKey` قدیمی، یا متغیر محیطی `FIRECRAWL_API_KEY` برمی‌گردد.
  - `baseUrl`: URL پایه API Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ بازنویسی‌های خودمیزبان باید نقاط پایانی خصوصی/داخلی را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی را از صفحه‌ها استخراج می‌کند (پیش‌فرض: `true`).
  - `maxAgeMs`: حداکثر عمر کش بر حسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: مهلت زمانی درخواست خزش بر حسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات جست‌وجوی X در xAI (جست‌وجوی وب Grok).
  - `enabled`: ارائه‌دهنده X Search را فعال می‌کند.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مثلا `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات Dreaming حافظه. برای فازها و آستانه‌ها [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: کلید اصلی Dreaming (پیش‌فرض `false`).
  - `frequency`: آهنگ cron برای هر جاروب کامل Dreaming (به‌طور پیش‌فرض `"0 3 * * *"`).
  - `model`: بازنویسی اختیاری مدل زیرعامل Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن هدف‌ها آن را با `allowedModels` همراه کنید. خطاهای در دسترس نبودن مدل یک بار با مدل پیش‌فرض نشست دوباره تلاش می‌شوند؛ شکست‌های اعتماد یا فهرست مجاز بی‌سروصدا به حالت جایگزین برنمی‌گردند.
  - سیاست فاز و آستانه‌ها جزئیات پیاده‌سازی هستند (کلیدهای پیکربندی روبه‌روی کاربر نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای فعال بسته Claude نیز می‌توانند پیش‌فرض‌های تعبیه‌شده Pi را از `settings.json` فراهم کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات پاک‌سازی‌شده عامل اعمال می‌کند، نه به‌عنوان وصله‌های خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه از `"none"` استفاده کنید.
- `plugins.slots.contextEngine`: شناسه Plugin موتور زمینه فعال را انتخاب کنید؛ مگر اینکه موتور دیگری نصب و انتخاب کنید، پیش‌فرض `"legacy"` است.

[Pluginها](/fa/tools/plugin) را ببینید.

---

## تعهدها

`commitments` حافظه پیگیری استنباط‌شده را کنترل می‌کند: OpenClaw می‌تواند اعلام حضورها را از نوبت‌های مکالمه تشخیص دهد و آن‌ها را از طریق اجرای Heartbeat تحویل دهد.

- `commitments.enabled`: استخراج پنهان LLM، ذخیره‌سازی، و تحویل Heartbeat را برای تعهدهای پیگیری استنباط‌شده فعال می‌کند. پیش‌فرض: `false`.
- `commitments.maxPerDay`: حداکثر تعهدهای پیگیری استنباط‌شده که در یک روز چرخان به ازای هر نشست عامل تحویل داده می‌شوند. پیش‌فرض: `3`.

[تعهدهای استنباط‌شده](/fa/concepts/commitments) را ببینید.

---

## مرورگر

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false`، `act:evaluate` و `wait --fn` را غیرفعال می‌کند.
- `tabCleanup` برگه‌های رهگیری‌شده عامل اصلی را پس از زمان بیکاری یا وقتی یک
  نشست از سقف خود فراتر برود بازپس می‌گیرد. برای غیرفعال کردن این حالت‌های
  پاک‌سازی جداگانه، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین پیمایش مرورگر به‌طور پیش‌فرض سخت‌گیرانه می‌ماند.
- فقط وقتی عمدا به پیمایش مرورگر در شبکه خصوصی اعتماد دارید، `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید.
- در حالت سخت‌گیرانه، نقاط پایانی پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی دسترسی‌پذیری/کشف، مشمول همان مسدودسازی شبکه خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- پروفایل‌های راه‌دور فقط پیوست‌شونده هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl` مقدارهای `http://`، `https://`، `ws://`، و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند از HTTP(S) استفاده کنید؛
  وقتی ارائه‌دهنده‌تان یک URL مستقیم WebSocket مربوط به DevTools می‌دهد از WS(S)
  استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترسی‌پذیری CDP راه‌دور و
  `attachOnly` به‌علاوه درخواست‌های باز کردن برگه اعمال می‌شوند. پروفایل‌های
  local loopback مدیریت‌شده پیش‌فرض‌های CDP محلی را حفظ می‌کنند.
- اگر یک سرویس CDP مدیریت‌شده بیرونی از طریق loopback قابل دسترسی است، مقدار
  `attachOnly: true` آن پروفایل را تنظیم کنید؛ وگرنه OpenClaw پورت loopback را
  به‌عنوان یک پروفایل مرورگر مدیریت‌شده محلی در نظر می‌گیرد و ممکن است خطاهای
  مالکیت پورت محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل پیوست شوند.
- پروفایل‌های `existing-session` می‌توانند برای هدف گرفتن یک پروفایل مرورگر خاص
  مبتنی بر Chromium مانند Brave یا Edge، `userDataDir` را تنظیم کنند.
- پروفایل‌های `existing-session` محدودیت‌های مسیر فعلی Chrome MCP را حفظ می‌کنند:
  اقدام‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری انتخابگر CSS، قلاب‌های بارگذاری
  یک‌فایلی، نبود بازنویسی مهلت گفت‌وگو، نبود `wait --load networkidle`، و نبود
  `responsebody`، خروجی PDF، رهگیری دانلود، یا اقدام‌های دسته‌ای.
- پروفایل‌های `openclaw` مدیریت‌شده محلی، `cdpPort` و `cdpUrl` را خودکار اختصاص می‌دهند؛
  `cdpUrl` را فقط برای CDP راه‌دور به‌صراحت تنظیم کنید.
- پروفایل‌های مدیریت‌شده محلی می‌توانند `executablePath` را برای بازنویسی
  `browser.executablePath` سراسری برای همان پروفایل تنظیم کنند. از این برای اجرای
  یک پروفایل در Chrome و پروفایل دیگر در Brave استفاده کنید.
- پروفایل‌های مدیریت‌شده محلی پس از شروع فرایند، از `browser.localLaunchTimeoutMs`
  برای کشف HTTP مربوط به CDP در Chrome و از `browser.localCdpReadyTimeoutMs` برای
  آمادگی websocket مربوط به CDP پس از راه‌اندازی استفاده می‌کنند. روی میزبان‌های
  کندتر که Chrome با موفقیت شروع می‌شود اما بررسی‌های آمادگی با راه‌اندازی رقابت
  می‌کنند، آن‌ها را افزایش دهید. هر دو مقدار باید عدد صحیح مثبت تا `120000` میلی‌ثانیه
  باشند؛ مقادیر پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد ← Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را برای مسیر خانه سیستم‌عامل شما پیش از راه‌اندازی Chromium
  می‌پذیرند. `userDataDir` اختصاصی هر پروفایل در پروفایل‌های `existing-session`
  نیز با tilde گسترش داده می‌شود.
- سرویس کنترل: فقط loopback (پورت مشتق‌شده از `gateway.port`، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های اضافی راه‌اندازی را به شروع محلی Chromium اضافه می‌کند (برای مثال
  `--disable-gpu`، اندازه پنجره، یا پرچم‌های اشکال‌زدایی).

---

## رابط کاربری

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: رنگ تأکیدی برای قاب رابط کاربری برنامه بومی (رنگ حباب حالت گفت‌وگو و غیره).
- `assistant`: بازنویسی هویت رابط کاربری کنترل. در صورت نبود به هویت عامل فعال برمی‌گردد.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="جزئیات فیلدهای Gateway">

- `mode`: `local` (اجرای Gateway) یا `remote` (اتصال به Gateway راه‌دور). Gateway شروع به کار را رد می‌کند مگر اینکه `local` باشد.
- `port`: یک درگاه چندمنظوره برای WS + HTTP. تقدم: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP مربوط به Tailscale)، یا `custom`.
- **نام‌های مستعار قدیمی bind**: در `gateway.bind` از مقدارهای حالت bind استفاده کنید (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، نه نام‌های مستعار میزبان (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **نکته Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکه‌سازی پل Docker (`-p 18789:18789`)، ترافیک از `eth0` وارد می‌شود، بنابراین Gateway در دسترس نیست. از `--network host` استفاده کنید، یا برای گوش‌دادن روی همه رابط‌ها `bind: "lan"` را تنظیم کنید (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`).
- **احراز هویت**: به‌صورت پیش‌فرض الزامی است. bindهای غیر-loopback به احراز هویت Gateway نیاز دارند. در عمل یعنی یک توکن/رمز عبور مشترک یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. راهنمای راه‌اندازی به‌صورت پیش‌فرض یک توکن تولید می‌کند.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefها)، `gateway.auth.mode` را صراحتا روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، شروع به کار و جریان‌های نصب/ترمیم سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای راه‌اندازی‌های قابل‌اعتماد local loopback استفاده کنید؛ این حالت عمدا در اعلان‌های راه‌اندازی ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک reverse proxy آگاه از هویت واگذار کنید و به هدرهای هویتی از `gateway.trustedProxies` اعتماد کنید (نگاه کنید به [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth)). این حالت به‌صورت پیش‌فرض انتظار یک منبع proxy **غیر-loopback** دارد؛ reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی روی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان fallback مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، هدرهای هویت Tailscale Serve می‌توانند احراز هویت Control UI/WebSocket را برآورده کنند (با `tailscale whois` راستی‌آزمایی می‌شود). endpointهای HTTP API از آن احراز هویت هدر Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت عادی احراز هویت HTTP مربوط به Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway قابل‌اعتماد است. وقتی `tailscale.mode = "serve"` باشد، پیش‌فرض آن `true` است.
- `gateway.auth.rateLimit`: محدودکننده اختیاری برای احراز هویت ناموفق. به‌ازای هر IP کلاینت و هر دامنه احراز هویت اعمال می‌شود (shared-secret و device-token جداگانه ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر async مربوط به Control UI در Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از ثبت شکست به‌صورت ترتیبی پردازش می‌شوند. بنابراین تلاش‌های بد هم‌زمان از یک کلاینت می‌توانند محدودکننده را در درخواست دوم فعال کنند، به‌جای اینکه هر دو صرفا به‌صورت mismatch ساده از رقابت عبور کنند.
  - `gateway.auth.rateLimit.exemptLoopback` به‌صورت پیش‌فرض `true` است؛ وقتی عمدا می‌خواهید ترافیک localhost نیز rate-limit شود (برای راه‌اندازی‌های آزمایشی یا استقرارهای proxy سخت‌گیرانه)، آن را روی `false` تنظیم کنید.
- تلاش‌های احراز هویت WS با مبدا مرورگر همیشه با غیرفعال‌بودن معافیت loopback محدود می‌شوند (دفاع چندلایه در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، این قفل‌شدن‌های با مبدا مرورگر به‌ازای هر مقدار نرمال‌شده `Origin`
  ایزوله هستند، بنابراین شکست‌های تکراری از یک مبدا localhost به‌صورت خودکار
  باعث قفل‌شدن مبدا دیگری نمی‌شوند.
- `tailscale.mode`: `serve` (فقط tailnet، bind به loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `tailscale.preserveFunnel`: وقتی `true` باشد و `tailscale.mode = "serve"`، OpenClaw
  پیش از اعمال دوباره Serve هنگام شروع به کار، `tailscale funnel status` را بررسی می‌کند و اگر یک مسیر Funnel پیکربندی‌شده خارجی از قبل درگاه Gateway را پوشش دهد،
  از آن صرف‌نظر می‌کند.
  پیش‌فرض `false`.
- `controlUi.allowedOrigins`: allowlist صریح مبداهای مرورگر برای اتصال‌های Gateway WebSocket. وقتی انتظار می‌رود کلاینت‌های مرورگر از مبداهای غیر-loopback بیایند، الزامی است.
- `controlUi.chatMessageMaxWidth`: حداکثر عرض اختیاری برای پیام‌های گروه‌بندی‌شده چت Control UI. مقدارهای عرض CSS محدودشده مانند `960px`، `82%`، `min(1280px, 82%)` و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناکی که fallback مبدا مبتنی بر هدر Host را برای استقرارهایی فعال می‌کند که عمدا به سیاست مبدا مبتنی بر هدر Host تکیه دارند.
- `remote.transport`: `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، `remote.url` باید `ws://` یا `wss://` باشد.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override اضطراری در محیط فرایند سمت کلاینت
  که به `ws://` متن ساده به IPهای شبکه خصوصی قابل‌اعتماد اجازه می‌دهد؛ پیش‌فرض برای متن ساده همچنان فقط loopback است. معادل
  `openclaw.json` وجود ندارد، و پیکربندی شبکه خصوصی مرورگر مانند
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` روی کلاینت‌های WebSocket مربوط به Gateway
  اثری ندارد.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامه کلاینت راه‌دور هستند. آن‌ها به‌تنهایی احراز هویت Gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: URL پایه HTTPS برای relay خارجی APNs که buildهای رسمی/TestFlight iOS پس از انتشار registrationهای مبتنی بر relay به Gateway از آن استفاده می‌کنند. این URL باید با URL relay کامپایل‌شده در build iOS مطابقت داشته باشد.
- `gateway.push.apns.relay.timeoutMs`: مهلت ارسال Gateway به relay بر حسب میلی‌ثانیه. پیش‌فرض `10000`.
- registrationهای مبتنی بر relay به یک هویت مشخص Gateway واگذار می‌شوند. برنامه iOS جفت‌شده `gateway.identity.get` را دریافت می‌کند، آن هویت را در registration مربوط به relay درج می‌کند، و یک مجوز ارسال محدود به registration را به Gateway ارسال می‌کند. Gateway دیگری نمی‌تواند از آن registration ذخیره‌شده دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه خروج فقط مخصوص توسعه برای URLهای relay مبتنی بر HTTP روی loopback. URLهای relay در production باید روی HTTPS باقی بمانند.
- `gateway.handshakeTimeoutMs`: مهلت handshake WebSocket پیش از احراز هویت Gateway بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد، تقدم دارد. این مقدار را روی میزبان‌های پربار یا کم‌توان که کلاینت‌های محلی می‌توانند هنگام تثبیت گرم‌سازی شروع به کار وصل شوند، افزایش دهید.
- `gateway.channelHealthCheckMinutes`: بازه health-monitor کانال بر حسب دقیقه. برای غیرفعال‌کردن restartهای health-monitor در سطح جهانی، `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانه stale-socket بر حسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: بیشینه restartهای health-monitor به‌ازای هر کانال/حساب در یک ساعت چرخشی. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: انصراف در سطح هر کانال از restartهای health-monitor، در حالی که مانیتور جهانی فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override در سطح هر حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر override سطح کانال تقدم دارد.
- مسیرهای فراخوانی Gateway محلی فقط وقتی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolution به‌صورت fail-closed شکست می‌خورد (بدون پنهان‌سازی با fallback راه‌دور).
- `trustedProxies`: IPهای reverse proxy که TLS را terminate می‌کنند یا هدرهای forwarded-client تزریق می‌کنند. فقط proxyهایی را فهرست کنید که کنترلشان می‌کنید. ورودی‌های loopback همچنان برای راه‌اندازی‌های proxy/local-detection روی همان میزبان معتبرند (برای مثال Tailscale Serve یا یک reverse proxy محلی)، اما باعث نمی‌شوند درخواست‌های loopback واجد شرایط `gateway.auth.mode: "trusted-proxy"` شوند.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` موجود نباشد، Gateway مقدار `X-Real-IP` را می‌پذیرد. پیش‌فرض `false` برای رفتار fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای تأیید خودکار pairing اولیه دستگاه node بدون scopeهای درخواست‌شده. وقتی تنظیم نشده باشد غیرفعال است. این گزینه pairing مربوط به operator/browser/Control UI/WebChat را خودکار تأیید نمی‌کند، و ارتقاهای role، scope، metadata یا public-key را نیز خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی سراسری allow/deny برای commandهای اعلام‌شده node پس از pairing و ارزیابی allowlist پلتفرم. برای opt in به commandهای خطرناک node مانند `camera.snap`، `camera.clip` و `screen.record` از `allowCommands` استفاده کنید؛ `denyCommands` یک command را حذف می‌کند، حتی اگر یک پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل می‌شد. پس از اینکه یک node فهرست commandهای اعلام‌شده خود را تغییر داد، pairing آن دستگاه را رد و دوباره تأیید کنید تا Gateway snapshot به‌روزشده command را ذخیره کند.
- `gateway.tools.deny`: نام‌های ابزار اضافی که برای HTTP `POST /tools/invoke` مسدود شده‌اند (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام‌های ابزار را از فهرست deny پیش‌فرض HTTP حذف می‌کند.

</Accordion>

### endpointهای سازگار با OpenAI

- Chat Completions: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL در Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی به‌عنوان تنظیم‌نشده در نظر گرفته می‌شوند؛ برای غیرفعال‌کردن دریافت URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- هدر اختیاری سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای originهای HTTPS تحت کنترل خودتان تنظیم کنید؛ نگاه کنید به [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### ایزوله‌سازی چندنمونه‌ای

چند Gateway را روی یک میزبان با درگاه‌ها و دایرکتوری‌های state یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

پرچم‌های میانبر: `--dev` (از `~/.openclaw-dev` + درگاه `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

نگاه کنید به [چند Gateway](/fa/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: TLS termination را در listener مربوط به Gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده‌اند، یک جفت cert/key خودامضای محلی را خودکار تولید می‌کند؛ فقط برای استفاده محلی/dev.
- `certPath`: مسیر filesystem به فایل گواهی TLS.
- `keyPath`: مسیر filesystem به فایل کلید خصوصی TLS؛ دسترسی آن را محدود نگه دارید.
- `caPath`: مسیر اختیاری CA bundle برای راستی‌آزمایی کلاینت یا زنجیره‌های اعتماد سفارشی.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: کنترل می‌کند ویرایش‌های پیکربندی چگونه در زمان اجرا اعمال شوند.
  - `"off"`: ویرایش‌های زنده را نادیده بگیر؛ تغییرات به restart صریح نیاز دارند.
  - `"restart"`: همیشه فرایند Gateway را هنگام تغییر پیکربندی restart کن.
  - `"hot"`: تغییرات را بدون restart درون فرایند اعمال کن.
  - `"hybrid"` (پیش‌فرض): ابتدا hot reload را امتحان کن؛ اگر لازم بود به restart fallback کن.
- `debounceMs`: پنجره debounce بر حسب میلی‌ثانیه پیش از اعمال تغییرات پیکربندی (عدد صحیح نامنفی).
- `deferralTimeoutMs`: بیشینه زمان اختیاری بر حسب میلی‌ثانیه برای انتظار جهت عملیات‌های در حال انجام، پیش از اجبار به restart یا hot reload کانال. برای استفاده از انتظار کران‌دار پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای همچنان در انتظار، `0` تنظیم کنید.

---

## Hookها

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

احراز هویت: `Authorization: Bearer <token>` یا `x-openclaw-token: <token>`.
توکن‌های Hook در رشتهٔ پرس‌وجو رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به یک `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید از `gateway.auth.token` **متمایز** باشد؛ استفادهٔ دوباره از توکن Gateway رد می‌شود.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیرمسیر اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا پیش‌تنظیم از `sessionKey` قالب‌دار استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این اعلام موافقت نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط زمانی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقادیر `sessionKey` نگاشت که با قالب رندر شده‌اند، به‌عنوان مقادیر ارائه‌شده از بیرون در نظر گرفته می‌شوند و همچنین به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="جزئیات نگاشت">

- `match.path` با زیرمسیر پس از `/hooks` مطابقت دارد (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` با یک فیلد payload برای مسیرهای عمومی مطابقت دارد.
- قالب‌هایی مانند `{{messages[0].subject}}` از payload خوانده می‌شوند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک اقدام Hook برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و داخل `hooks.transformsDir` باقی بماند (مسیرهای مطلق و پیمایش مسیر رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های Skills در workspace رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول تبدیل را به دایرکتوری تبدیل‌های Hook منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک عامل مشخص مسیریابی می‌کند؛ شناسه‌های ناشناخته به پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: مسیریابی صریح را محدود می‌کند (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید نشست ثابت اختیاری برای اجرای عامل Hook بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای نشست نگاشت مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: فهرست مجاز پیشوند اختیاری برای مقادیر صریح `sessionKey` (درخواست + نگاشت)، مانند `["hook:"]`. وقتی هر نگاشت یا پیش‌تنظیمی از `sessionKey` قالب‌دار استفاده کند، الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال ارسال می‌کند؛ `channel` به‌طور پیش‌فرض `last` است.
- `model`، LLM را برای این اجرای Hook بازنویسی می‌کند (اگر کاتالوگ مدل تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- پیش‌تنظیم داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر آن مسیریابی برای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را برای مطابقت با فضای نام Gmail محدود کنید، برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، پیش‌تنظیم را با یک `sessionKey` ایستا به‌جای پیش‌فرض قالب‌دار بازنویسی کنید.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway هنگام راه‌اندازی، در صورت پیکربندی، `gog gmail watch serve` را به‌طور خودکار شروع می‌کند. برای غیرفعال کردن، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
- یک `gog gmail watch serve` جداگانه را هم‌زمان با Gateway اجرا نکنید.

---

## میزبان Plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- HTML/CSS/JS قابل ویرایش توسط عامل و A2UI را از طریق HTTP زیر پورت Gateway ارائه می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- اتصال‌های غیر loopback: مسیرهای Canvas مانند سایر سطوح HTTP Gateway به احراز هویت Gateway نیاز دارند (توکن/گذرواژه/پراکسی معتمد).
- WebViewهای Node معمولاً سرآیندهای احراز هویت ارسال نمی‌کنند؛ پس از جفت و متصل شدن یک Node، Gateway برای دسترسی به Canvas/A2UI، URLهای قابلیت با دامنهٔ Node را اعلام می‌کند.
- URLهای قابلیت به نشست فعال WS متعلق به Node متصل هستند و سریع منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت بارگذاری مجدد زنده را به HTML ارائه‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را به‌طور خودکار ایجاد می‌کند.
- همچنین A2UI را در `/__openclaw__/a2ui/` ارائه می‌کند.
- تغییرات به راه‌اندازی مجدد Gateway نیاز دارند.
- برای دایرکتوری‌های بزرگ یا خطاهای `EMFILE`، بارگذاری مجدد زنده را غیرفعال کنید.

---

## کشف

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (پیش‌فرض وقتی Plugin بسته‌بندی‌شدهٔ `bonjour` فعال است): `cliPath` + `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: `cliPath` + `sshPort` را شامل می‌شود؛ تبلیغ چندپخشی LAN همچنان نیاز دارد Plugin بسته‌بندی‌شدهٔ `bonjour` فعال باشد.
- `off`: تبلیغ چندپخشی LAN را بدون تغییر فعال‌بودن Plugin سرکوب می‌کند.
- Plugin بسته‌بندی‌شدهٔ `bonjour` روی میزبان‌های macOS به‌طور خودکار شروع می‌شود و در Linux، Windows و استقرارهای Gateway کانتینری اختیاری است.
- نام میزبان وقتی یک برچسب DNS معتبر باشد، به‌طور پیش‌فرض برابر نام میزبان سیستم است و در غیر این صورت به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` بازنویسی کنید.

### گسترهٔ وسیع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک ناحیهٔ DNS-SD تک‌پخشی زیر `~/.openclaw/dns/` می‌نویسد. برای کشف میان‌شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + DNS تفکیکی Tailscale جفت کنید.

راه‌اندازی: `openclaw dns setup --apply`.

---

## محیط

### `env` (متغیرهای محیطی درون‌خطی)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- متغیرهای محیطی درون‌خطی فقط زمانی اعمال می‌شوند که محیط فرایند آن کلید را نداشته باشد.
- فایل‌های `.env`: فایل `.env` در CWD + `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
- `shellEnv`: کلیدهای مورد انتظارِ موجودنبودن را از پروفایل شل ورود شما وارد می‌کند.
- برای تقدم کامل، [محیط](/fa/help/environment) را ببینید.

### جایگزینی متغیر محیطی

در هر رشتهٔ پیکربندی با `${VAR_NAME}` به متغیرهای محیطی ارجاع دهید:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- فقط نام‌های با حروف بزرگ تطبیق داده می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای موجودنبودن/خالی هنگام بارگذاری پیکربندی خطا ایجاد می‌کنند.
- برای مقدار لفظی `${VAR}` با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## اسرار

ارجاع‌های secret افزایشی هستند: مقادیر متن ساده همچنان کار می‌کنند.

### `SecretRef`

از یک شکل شیء استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی id برای `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id برای `source: "file"`: اشاره‌گر JSON مطلق (برای مثال `"/providers/openai/apiKey"`)
- الگوی id برای `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- idهای `source: "exec"` نباید شامل قطعه‌های مسیر جداشده با اسلشِ `.` یا `..` باشند (برای مثال `a/../b` رد می‌شود)

### سطح اعتبارنامهٔ پشتیبانی‌شده

- ماتریس canonical: [سطح اعتبارنامهٔ SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای اعتبارنامهٔ پشتیبانی‌شدهٔ `openclaw.json` را هدف می‌گیرد.
- ارجاع‌های `auth-profiles.json` در حل‌وفصل زمان اجرا و پوشش audit گنجانده می‌شوند.

### پیکربندی ارائه‌دهندگان secret

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

نکته‌ها:

- ارائه‌دهندهٔ `file` از `mode: "json"` و `mode: "singleValue"` پشتیبانی می‌کند (`id` در حالت singleValue باید `"value"` باشد).
- مسیرهای ارائه‌دهندهٔ file و exec زمانی که تأیید ACL ویندوز در دسترس نباشد، بسته و ناموفق می‌شوند. `allowInsecurePath: true` را فقط برای مسیرهای معتمدی تنظیم کنید که قابل تأیید نیستند.
- ارائه‌دهندهٔ `exec` به مسیر مطلق `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌طور پیش‌فرض، مسیرهای فرمان symlink رد می‌شوند. برای مجاز کردن مسیرهای symlink در حالی که مسیر هدفِ حل‌شده اعتبارسنجی می‌شود، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی trusted-dir روی مسیر هدفِ حل‌شده اعمال می‌شود.
- محیط فرزند `exec` به‌طور پیش‌فرض حداقلی است؛ متغیرهای لازم را با `passEnv` صراحتاً پاس دهید.
- ارجاع‌های secret در زمان activation به یک snapshot در حافظه resolve می‌شوند، سپس مسیرهای request فقط snapshot را می‌خوانند.
- فیلتر کردن active-surface هنگام activation اعمال می‌شود: ارجاع‌های resolveنشده روی سطح‌های فعال باعث شکست startup/reload می‌شوند، در حالی که سطح‌های غیرفعال با diagnostics رد می‌شوند.

---

## ذخیره‌سازی احراز هویت

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- پروفایل‌های هر agent در `<agentDir>/auth-profiles.json` ذخیره می‌شوند.
- `auth-profiles.json` برای حالت‌های اعتبارنامهٔ static از ارجاع‌های سطح مقدار (`keyRef` برای `api_key`، `tokenRef` برای `token`) پشتیبانی می‌کند.
- نگاشت‌های flat قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را به پروفایل‌های API-key canonical با `provider:default` بازنویسی می‌کند و یک پشتیبان `.legacy-flat.*.bak` می‌سازد.
- پروفایل‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های auth-profile مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های static زمان اجرا از snapshotهای resolveشدهٔ در حافظه می‌آیند؛ ورودی‌های static قدیمی `auth.json` هنگام کشف پاک‌سازی می‌شوند.
- واردسازی OAuth قدیمی از `~/.openclaw/credentials/oauth.json`.
- [OAuth](/fa/concepts/oauth) را ببینید.
- رفتار زمان اجرای secretها و ابزارهای `audit/configure/apply`: [مدیریت اسرار](/fa/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: تأخیر پس‌روی پایه بر حسب ساعت زمانی که یک نمایه به دلیل خطاهای واقعی
  صورت‌حساب/اعتبار ناکافی ناموفق می‌شود (پیش‌فرض: `5`). متن صریح صورت‌حساب
  همچنان می‌تواند حتی در پاسخ‌های `401`/`403` به این مسیر برسد، اما تطبیق‌دهنده‌های متن
  ویژه ارائه‌دهنده در محدوده همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای مثال OpenRouter
  `Key limit exceeded`). پیام‌های HTTP `402` قابل تلاش دوباره برای پنجره مصرف یا
  محدودیت هزینه سازمان/فضای کاری، به جای آن در مسیر `rate_limit` می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری به‌ازای هر ارائه‌دهنده برای ساعت‌های تأخیر پس‌روی صورت‌حساب.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی تأخیر پس‌روی صورت‌حساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: تأخیر پس‌روی پایه بر حسب دقیقه برای شکست‌های `auth_permanent` با اطمینان بالا (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد تأخیر پس‌روی `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجره لغزان بر حسب ساعت که برای شمارنده‌های تأخیر پس‌روی استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: حداکثر چرخش‌های نمایه احراز هویت همان ارائه‌دهنده برای خطاهای اضافه‌بار پیش از رفتن به گزینه جایگزین مدل (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` به اینجا می‌رسند.
- `overloadedBackoffMs`: تأخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/نمایه دچار اضافه‌بار (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: حداکثر چرخش‌های نمایه احراز هویت همان ارائه‌دهنده برای خطاهای محدودیت نرخ پیش از رفتن به گزینه جایگزین مدل (پیش‌فرض: `1`). آن سطل محدودیت نرخ شامل متن‌هایی با شکل ارائه‌دهنده مانند `Too many concurrent requests`،‏ `ThrottlingException`،‏ `concurrency limit reached`،‏ `workers_ai ... quota limit exceeded`، و `resource exhausted` است.

---

## ثبت گزارش

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- فایل گزارش پیش‌فرض: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- برای یک مسیر پایدار، `logging.file` را تنظیم کنید.
- هنگام استفاده از `--verbose`، مقدار `consoleLevel` به `debug` افزایش می‌یابد.
- `maxFileBytes`: حداکثر اندازه فایل گزارش فعال بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 مگابایت). OpenClaw تا پنج بایگانی شماره‌گذاری‌شده را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن بهترین‌تلاشی برای خروجی کنسول، گزارش‌های فایل، رکوردهای گزارش OTLP، و متن رونوشت نشست ذخیره‌شده. `redactSensitive: "off"` فقط این سیاست عمومی گزارش/رونوشت را غیرفعال می‌کند؛ سطوح ایمنی رابط کاربری/ابزار/عیب‌یابی همچنان پیش از انتشار، اسرار را حذف می‌کنند.

---

## عیب‌یابی

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: کلید اصلی برای خروجی ابزارگذاری (پیش‌فرض: `true`).
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی گزارش هدفمند را فعال می‌کنند (از نویسه‌های عام مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه برای طبقه‌بندی نشست‌های پردازشی طولانی‌مدت به‌عنوان `session.long_running`،‏ `session.stalled`، یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک، و پیشرفت ACP زمان‌سنج را بازنشانی می‌کنند؛ عیب‌یابی‌های تکراری `session.stuck` تا زمانی که تغییری نکنند با فاصله بیشتر ارسال می‌شوند.
- `stuckSessionAbortMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه پیش از آنکه کار فعال متوقف‌شده واجد شرایط، برای بازیابی با تخلیه-لغو پایان یابد. وقتی تنظیم نشده باشد، OpenClaw از پنجره امن‌تر و گسترده‌تر اجرای جاسازی‌شده، دست‌کم ۱۰ دقیقه و ۵ برابر `stuckSessionWarnMs` استفاده می‌کند.
- `otel.enabled`: خط لوله صدور OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، فهرست سیگنال‌ها، و مدل حریم خصوصی، [صدور OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: نشانی جمع‌آورنده برای صدور OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP ویژه سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`:‏ `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فراداده اضافی HTTP/gRPC که همراه درخواست‌های صدور OTel فرستاده می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: صدور ردگیری، سنجه‌ها، یا گزارش را فعال می‌کند.
- `otel.sampleRate`: نرخ نمونه‌برداری ردگیری `0`-`1`.
- `otel.flushIntervalMs`: فاصله تخلیه دوره‌ای تله‌متری بر حسب میلی‌ثانیه.
- `otel.captureContent`: ضبط محتوای خام به‌صورت انتخابی برای ویژگی‌های بازه OTEL. به‌طور پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را ضبط می‌کند؛ شکل شیء به شما امکان می‌دهد `inputMessages`،‏ `outputMessages`،‏ `toolInputs`،‏ `toolOutputs`، و `systemPrompt` را صریح فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای ویژگی‌های ارائه‌دهنده بازه GenAI آزمایشی تازه‌ترین نسخه. به‌طور پیش‌فرض، بازه‌ها برای سازگاری ویژگی قدیمی `gen_ai.system` را نگه می‌دارند؛ سنجه‌های GenAI از ویژگی‌های معنایی کران‌دار استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از پیش یک SDK سراسری OpenTelemetry را ثبت کرده‌اند. سپس OpenClaw راه‌اندازی/خاموش‌کردن SDK متعلق به Plugin را رد می‌کند و شنونده‌های عیب‌یابی را فعال نگه می‌دارد.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`،‏ `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`، و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطه پایانی ویژه سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: عکس‌های ردگیری کش را برای اجراهای جاسازی‌شده ثبت می‌کند (پیش‌فرض: `false`).
- `cacheTrace.filePath`: مسیر خروجی برای JSONL ردگیری کش (پیش‌فرض: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: کنترل می‌کند چه چیزهایی در خروجی ردگیری کش گنجانده شود (همه به‌طور پیش‌فرض: `true`).

---

## به‌روزرسانی

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: کانال انتشار برای نصب‌های npm/git - ‏`"stable"`،‏ `"beta"`، یا `"dev"`.
- `checkOnStart`: هنگام شروع Gateway، به‌روزرسانی‌های npm را بررسی می‌کند (پیش‌فرض: `true`).
- `auto.enabled`: به‌روزرسانی خودکار پس‌زمینه را برای نصب‌های بسته فعال می‌کند (پیش‌فرض: `false`).
- `auto.stableDelayHours`: حداقل تأخیر بر حسب ساعت پیش از اعمال خودکار در کانال پایدار (پیش‌فرض: `6`؛ حداکثر: `168`).
- `auto.stableJitterHours`: پنجره پخش انتشار اضافی برای کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ حداکثر: `168`).
- `auto.betaCheckIntervalHours`: فاصله اجرای بررسی‌های کانال بتا بر حسب ساعت (پیش‌فرض: `1`؛ حداکثر: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: دروازه سراسری قابلیت ACP (پیش‌فرض: `true`؛ برای پنهان‌کردن امکانات اعزام و ایجاد ACP روی `false` بگذارید).
- `dispatch.enabled`: دروازه مستقل برای اعزام نوبت نشست ACP (پیش‌فرض: `true`). برای در دسترس نگه‌داشتن فرمان‌های ACP هم‌زمان با مسدودکردن اجرا، روی `false` بگذارید.
- `backend`: شناسه پیش‌فرض پشتیبان زمان اجرای ACP (باید با یک Plugin ثبت‌شده زمان اجرای ACP مطابق باشد).
  ابتدا Plugin پشتیبان را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسه Plugin پشتیبان (برای مثال `acpx`) را شامل کنید وگرنه پشتیبان ACP بارگیری نمی‌شود.
- `defaultAgent`: شناسه عامل هدف جایگزین ACP وقتی ایجادها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: فهرست مجاز شناسه‌های عامل که برای نشست‌های زمان اجرای ACP مجازند؛ خالی یعنی محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: حداکثر نشست‌های ACP هم‌زمان فعال.
- `stream.coalesceIdleMs`: پنجره تخلیه بیکار بر حسب میلی‌ثانیه برای متن جریان‌یافته.
- `stream.maxChunkChars`: حداکثر اندازه قطعه پیش از تقسیم تصویرسازی بلوک جریان‌یافته.
- `stream.repeatSuppression`: خط‌های وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`:‏ `"live"` به‌صورت افزایشی جریان می‌دهد؛ `"final_only"` تا رویدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: حداکثر نویسه‌های خروجی دستیار که در هر نوبت ACP تصویرسازی می‌شود.
- `stream.maxSessionUpdateChars`: حداکثر نویسه‌ها برای خط‌های وضعیت/به‌روزرسانی ACP تصویرسازی‌شده.
- `stream.tagVisibility`: رکوردی از نام برچسب‌ها به بازنویسی‌های بولیِ نمایانی برای رویدادهای جریان‌یافته.
- `runtime.ttlMinutes`: TTL بیکاری بر حسب دقیقه برای کارکنان نشست ACP پیش از پاک‌سازی واجد شرایط.
- `runtime.installCommand`: فرمان نصب اختیاری برای اجرا هنگام راه‌اندازی اولیه محیط زمان اجرای ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` سبک شعار بنر را کنترل می‌کند:
  - `"random"` (پیش‌فرض): شعارهای چرخشی طنز/فصلی.
  - `"default"`: شعار خنثای ثابت (`All your chats, one OpenClaw.`).
  - `"off"`: بدون متن شعار (عنوان/نسخه بنر همچنان نمایش داده می‌شود).
- برای پنهان‌کردن کل بنر (نه فقط شعارها)، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## ویزارد

فراداده‌ای که جریان‌های راه‌اندازی هدایت‌شده CLI (`onboard`،‏ `configure`،‏ `doctor`) می‌نویسند:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## هویت

فیلدهای هویت `agents.list` را زیر [پیش‌فرض‌های عامل](/fa/gateway/config-agents#agent-defaults) ببینید.

---

## پل (قدیمی، حذف‌شده)

ساخت‌های فعلی دیگر شامل پل TCP نیستند. Nodeها از طریق WebSocket مربوط به Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از طرح‌واره پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها ناموفق می‌شود؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

<Accordion title="پیکربندی پل قدیمی (مرجع تاریخی)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: مدت نگهداری نشست‌های اجرای cron ایزولهٔ تکمیل‌شده پیش از پاک‌سازی از `sessions.json`. همچنین پاک‌سازی رونوشت‌های cron حذف‌شدهٔ بایگانی‌شده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
- `runLog.maxBytes`: حداکثر اندازه برای هر فایل گزارش اجرا (`cron/runs/<jobId>.jsonl`) پیش از پاک‌سازی. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین خط‌هایی که هنگام فعال شدن پاک‌سازی گزارش اجرا نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن bearer که برای تحویل POST وب‌هوک cron (`delivery.mode = "webhook"`) استفاده می‌شود؛ اگر حذف شود هیچ سرآیند احرازهویتی ارسال نمی‌شود.
- `webhook`: نشانی URL وب‌هوک بازگشتی قدیمی منسوخ‌شده (http/https) که فقط برای کارهای ذخیره‌شده‌ای استفاده می‌شود که هنوز `notify: true` دارند.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: حداکثر تلاش‌های دوباره برای کارهای یک‌باره هنگام خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0`-`10`).
- `backoffMs`: آرایه‌ای از تأخیرهای backoff بر حسب میلی‌ثانیه برای هر تلاش دوباره (پیش‌فرض: `[30000, 60000, 300000]`؛ ۱ تا ۱۰ ورودی).
- `retryOn`: انواع خطاهایی که تلاش دوباره را فعال می‌کنند - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش دوباره روی همهٔ انواع گذرا، حذفش کنید.

فقط برای کارهای cron یک‌باره اعمال می‌شود. کارهای تکرارشونده از رسیدگی جداگانه به شکست استفاده می‌کنند.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: فعال‌سازی هشدارهای شکست برای کارهای cron (پیش‌فرض: `false`).
- `after`: تعداد شکست‌های پیاپی پیش از فعال شدن هشدار (عدد صحیح مثبت، حداقل: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: شمردن اجراهای ردشدهٔ پیاپی در آستانهٔ هشدار (پیش‌فرض: `false`). اجراهای ردشده جداگانه ردیابی می‌شوند و بر backoff خطای اجرا اثر نمی‌گذارند.
- `mode`: حالت تحویل - `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به وب‌هوک پیکربندی‌شده پست می‌کند.
- `accountId`: شناسهٔ اختیاری حساب یا کانال برای محدود کردن دامنهٔ تحویل هشدار.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- مقصد پیش‌فرض برای اعلان‌های شکست cron در همهٔ کارها.
- `mode`: `"announce"` یا `"webhook"`؛ وقتی دادهٔ هدف کافی وجود داشته باشد، پیش‌فرض `"announce"` است.
- `channel`: بازنویسی کانال برای تحویل announce. `"last"` آخرین کانال تحویل شناخته‌شده را دوباره استفاده می‌کند.
- `to`: هدف announce یا URL وب‌هوک صریح. برای حالت وب‌هوک الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- مقدار `delivery.failureDestination` در هر کار، این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست در سطح کار تنظیم شده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌شوند، هنگام شکست به همان هدف announce اصلی بازمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر آنکه `delivery.mode` اصلی کار `"webhook"` باشد.

[کارهای Cron](/fa/automation/cron-jobs) را ببینید. اجراهای cron ایزوله به‌عنوان [کارهای پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای الگوی مدل رسانه

جای‌نگهدارهای الگو که در `tools.media.models[].args` گسترش می‌یابند:

| متغیر              | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | بدنهٔ کامل پیام ورودی                            |
| `{{RawBody}}`      | بدنهٔ خام (بدون لفاف‌های تاریخچه/فرستنده)         |
| `{{BodyStripped}}` | بدنه با حذف اشاره‌های گروهی                      |
| `{{From}}`         | شناسهٔ فرستنده                                   |
| `{{To}}`           | شناسهٔ مقصد                                      |
| `{{MessageSid}}`   | شناسهٔ پیام کانال                                |
| `{{SessionId}}`    | UUID نشست فعلی                                   |
| `{{IsNewSession}}` | `"true"` وقتی نشست جدید ایجاد شده باشد           |
| `{{MediaUrl}}`     | شبه-URL رسانهٔ ورودی                             |
| `{{MediaPath}}`    | مسیر رسانهٔ محلی                                 |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)                      |
| `{{Transcript}}`   | رونوشت صوتی                                      |
| `{{Prompt}}`       | prompt رسانهٔ حل‌شده برای ورودی‌های CLI          |
| `{{MaxChars}}`     | حداکثر نویسه‌های خروجی حل‌شده برای ورودی‌های CLI |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (در حد بهترین تلاش)                   |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد بهترین تلاش)          |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد بهترین تلاش)           |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد بهترین تلاش)           |
| `{{Provider}}`     | راهنمایی ارائه‌دهنده (WhatsApp، Telegram، Discord، و غیره) |

---

## درج‌های پیکربندی (`$include`)

پیکربندی را به چند فایل تقسیم کنید:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**رفتار ادغام:**

- فایل تکی: شیء دربرگیرنده را جایگزین می‌کند.
- آرایهٔ فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شود (موارد بعدی، قبلی‌ها را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از includeها ادغام می‌شوند (مقادیر includeشده را بازنویسی می‌کنند).
- includeهای تودرتو: تا عمق ۱۰ سطح.
- مسیرها: نسبت به فایل includeکننده حل می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا (`dirname` مربوط به `openclaw.json`) باقی بمانند. شکل‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل آن مرز حل شوند.
- نوشتن‌های تحت مالکیت OpenClaw که فقط یک بخش سطح بالای پشتیبانی‌شده با یک include تک‌فایلی را تغییر می‌دهند، در همان فایل includeشده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- includeهای ریشه، آرایه‌های include، و includeهایی با بازنویسی‌های هم‌سطح برای نوشتن‌های تحت مالکیت OpenClaw فقط خواندنی هستند؛ این نوشتن‌ها به‌جای تخت‌کردن پیکربندی، با حالت بسته شکست می‌خورند.
- خطاها: پیام‌های روشن برای فایل‌های گم‌شده، خطاهای تجزیه، و includeهای چرخه‌ای.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

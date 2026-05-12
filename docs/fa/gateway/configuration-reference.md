---
read_when:
    - به معناشناسی دقیق پیکربندی در سطح فیلد یا مقادیر پیش‌فرض نیاز دارید
    - در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای اصلی OpenClaw، مقادیر پیش‌فرض، و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-05-12T00:59:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b8e31f7a6ed82faf3b5a50daa286bb6fce0c2e4452ae81a8e792a437004ad54
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای یک نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی یک زیرسامانه مرجع عمیق‌تری مخصوص خود دارد به آن پیوند می‌دهد. کاتالوگ‌های دستور متعلق به کانال‌ها و pluginها و تنظیمات عمیق حافظه/QMD در صفحه‌های خودشان قرار دارند، نه در این صفحه.

حقیقت کد:

- `openclaw config schema` شِمای JSON زنده‌ای را چاپ می‌کند که برای اعتبارسنجی و Control UI استفاده می‌شود، و در صورت موجود بودن، فراداده‌های bundled/plugin/channel را در آن ادغام می‌کند
- `config.schema.lookup` یک گره شِمای محدود به مسیر را برای ابزارهای واکاوی برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش مبنای مستندات پیکربندی را در برابر سطح فعلی شِما اعتبارسنجی می‌کنند

مسیر جست‌وجوی agent: پیش از ویرایش‌ها، برای مستندات دقیق در سطح فیلد و محدودیت‌ها از کنش ابزار `gateway` با نام `config.schema.lookup` استفاده کنید. برای راهنمایی وظیفه‌محور از
[پیکربندی](/fa/gateway/configuration) و برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها، و پیوندها به مراجع زیرسامانه‌ها از این صفحه استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations`، و پیکربندی dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [دستورهای slash](/fa/tools/slash-commands) برای کاتالوگ فعلی دستورهای داخلی + bundled
- صفحه‌های مالک کانال/plugin برای سطوح دستور ویژه کانال

قالب پیکربندی **JSON5** است (commentها + commaهای انتهایی مجازند). همه فیلدها اختیاری هستند - وقتی حذف شوند OpenClaw از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند - برای `channels.*`،
از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و دیگر
کانال‌های bundled (احراز هویت، کنترل دسترسی، چندحسابی، gating اشاره) به
[پیکربندی - کانال‌ها](/fa/gateway/config-channels) مراجعه کنید.

## پیش‌فرض‌های agent، چند-agent، sessionها، و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است - برای موارد زیر به
[پیکربندی - agentها](/fa/gateway/config-agents) مراجعه کنید:

- `agents.defaults.*` (workspace، model، thinking، heartbeat، memory، media، skills، sandbox)
- `multiAgent.*` (routing و bindingهای چند-agent)
- `session.*` (چرخه عمر session، Compaction، pruning)
- `messages.*` (تحویل پیام، TTS، رندر Markdown)
- `talk.*` (حالت Talk)
  - `talk.consultThinkingLevel`: override سطح thinking برای اجرای کامل agent در OpenClaw پشت مشاوره‌های بی‌درنگ Talk در Control UI
  - `talk.consultFastMode`: override یک‌باره حالت سریع برای مشاوره‌های بی‌درنگ Talk در Control UI
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk در iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پنجره مکث پیش‌فرض platform را پیش از ارسال transcript نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)

## ابزارها و providerهای سفارشی

سیاست ابزار، toggleهای آزمایشی، پیکربندی ابزار پشتیبانی‌شده توسط provider، و راه‌اندازی provider / base-URL سفارشی به صفحه‌ای اختصاصی منتقل شده‌اند - به
[پیکربندی - ابزارها و providerهای سفارشی](/fa/gateway/config-tools) مراجعه کنید.

## مدل‌ها

تعریف‌های provider، allowlistهای model، و راه‌اندازی provider سفارشی در
[پیکربندی - ابزارها و providerهای سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند.
ریشه `models` همچنین مالک رفتار global کاتالوگ model است.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: رفتار کاتالوگ provider (`merge` یا `replace`).
- `models.providers`: نقشه provider سفارشی با کلید provider id.
- `models.providers.*.localService`: مدیر فرایند اختیاری on-demand برای
  سرورهای model محلی. OpenClaw endpoint سلامت پیکربندی‌شده را probe می‌کند،
  در صورت نیاز `command` مطلق را اجرا می‌کند، تا آماده‌شدن صبر می‌کند، سپس
  درخواست model را می‌فرستد. [سرویس‌های model محلی](/fa/gateway/local-model-services) را ببینید.
- `models.pricing.enabled`: bootstrap پس‌زمینه pricing را کنترل می‌کند که
  پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد،
  Gateway واکشی‌های کاتالوگ pricing از OpenRouter و LiteLLM را رد می‌کند؛ مقدارهای پیکربندی‌شده
  `models.providers.*.models[].cost` همچنان برای برآورد هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط Pi embedded و adapterهای runtime دیگر مصرف می‌شوند. دستورهای `openclaw mcp list`،
`show`، `set`، و `unset` این بلوک را بدون اتصال به سرور هدف هنگام ویرایش‌های پیکربندی مدیریت می‌کنند.

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

- `mcp.servers`: تعریف‌های نام‌دار سرور MCP از نوع stdio یا remote برای runtimeهایی که
  ابزارهای MCP پیکربندی‌شده را expose می‌کنند.
  ورودی‌های remote از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛
  `type: "http"` یک alias بومی CLI است که `openclaw mcp set` و
  `openclaw doctor --fix` آن را به فیلد canonical `transport` normalize می‌کنند.
- `mcp.sessionIdleTtlMs`: TTL بی‌کاری برای runtimeهای MCP bundled و محدود به session.
  اجراهای embedded یک‌باره درخواست پاک‌سازی در پایان اجرا می‌کنند؛ این TTL پشتوانه‌ای برای
  sessionهای بلندمدت و callerهای آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP cache‌شده session به‌صورت hot-apply اعمال می‌شوند.
  کشف/استفاده بعدی ابزار آن‌ها را از پیکربندی جدید دوباره می‌سازد، بنابراین ورودی‌های حذف‌شده
  `mcp.servers` به‌جای انتظار برای TTL بی‌کاری، بلافاصله جمع‌آوری می‌شوند.

برای رفتار runtime، [MCP](/fa/cli/mcp#openclaw-as-an-mcp-client-registry) و
[backendهای CLI](/fa/gateway/cli-backends#bundle-mcp-overlays) را ببینید.

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

- `allowBundled`: allowlist اختیاری فقط برای skillهای bundled (skillهای managed/workspace تحت تأثیر نیستند).
- `load.extraDirs`: ریشه‌های skill اشتراکی اضافی (کمترین اولویت).
- `load.allowSymlinkTargets`: ریشه‌های هدف واقعیِ مورد اعتماد که symlinkهای skill می‌توانند
  وقتی link خارج از ریشه منبع پیکربندی‌شده خودش قرار دارد، به آن‌ها resolve شوند.
- `install.preferBrew`: وقتی true باشد، اگر `brew` در دسترس باشد، پیش از fallback به نوع‌های installer دیگر، installerهای Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح installer در Node برای specهای `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: به clientهای مورد اعتماد Gateway با `operator.admin` اجازه می‌دهد
  archiveهای zip خصوصی staging‌شده از طریق `skills.upload.*` را install کنند
  (پیش‌فرض: false). این فقط مسیر archive آپلودشده را فعال می‌کند؛ installهای عادی ClawHub
  به آن نیاز ندارند.
- `entries.<skillKey>.enabled: false` یک skill را حتی اگر bundled/install شده باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بری برای skillهایی که env var اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

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

- از `~/.openclaw/extensions`، `<workspace>/.openclaw/extensions`، به‌علاوه `plugins.load.paths` بارگذاری می‌شود.
- Discovery، pluginهای بومی OpenClaw به‌علاوه bundleهای سازگار Codex و bundleهای Claude را می‌پذیرد، از جمله bundleهای layout پیش‌فرض Claude بدون manifest.
- **تغییرات پیکربندی به restart کردن gateway نیاز دارند.**
- `allow`: allowlist اختیاری (فقط pluginهای فهرست‌شده load می‌شوند). `deny` اولویت دارد.
- `bundledDiscovery`: برای پیکربندی‌های جدید به‌طور پیش‌فرض `"allowlist"` است، بنابراین `plugins.allow` غیرخالی
  pluginهای provider bundled، از جمله providerهای runtime وب‌جست‌وجو، را نیز gate می‌کند. Doctor برای پیکربندی‌های allowlist قدیمی مهاجرت‌داده‌شده
  `"compat"` می‌نویسد تا رفتار فعلی provider bundled را تا وقتی خودتان opt in کنید حفظ کند.
- `plugins.entries.<id>.apiKey`: فیلد میان‌بر کلید API در سطح plugin (وقتی توسط plugin پشتیبانی شود).
- `plugins.entries.<id>.env`: نقشه env var محدود به plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، core، `before_prompt_build` را مسدود می‌کند و فیلدهای تغییر‌دهنده prompt از `before_agent_start` legacy را نادیده می‌گیرد، در حالی که `modelOverride` و `providerOverride` legacy را حفظ می‌کند. روی hookهای plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط bundle که پشتیبانی می‌شوند اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، pluginهای غیر-bundled مورد اعتماد می‌توانند محتوای خام conversation را از hookهای typed مانند `llm_input`، `llm_output`، `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `before_agent_finalize`، و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌صراحت به این plugin اعتماد کنید تا برای اجرای subagent پس‌زمینه، overrideهای `provider` و `model` در سطح هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist اختیاری از هدف‌های canonical `provider/model` برای overrideهای subagent مورد اعتماد. فقط وقتی از روی قصد می‌خواهید هر modelی را مجاز کنید از `"*"` استفاده کنید.
- `plugins.entries.<id>.llm.allowModelOverride`: به‌صراحت به این plugin اعتماد کنید تا برای `api.runtime.llm.complete` درخواست overrideهای model کند.
- `plugins.entries.<id>.llm.allowedModels`: allowlist اختیاری از هدف‌های canonical `provider/model` برای overrideهای completion مربوط به LLM در plugin مورد اعتماد. فقط وقتی از روی قصد می‌خواهید هر modelی را مجاز کنید از `"*"` استفاده کنید.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: به‌صراحت به این plugin اعتماد کنید تا `api.runtime.llm.complete` را علیه agent id غیرپیش‌فرض اجرا کند.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط plugin (در صورت موجود بودن، با شِمای plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات account/runtime مربوط به plugin کانال زیر `channels.<id>` قرار دارند و باید توسط فراداده `channelConfigs` در manifest متعلق به plugin مالک توصیف شوند، نه توسط registry مرکزی گزینه‌های OpenClaw.

### پیکربندی plugin مربوط به harness در Codex

Plugin bundled با نام `codex` مالک تنظیمات harness مربوط به app-server بومی Codex زیر
`plugins.entries.codex.config` است. برای سطح کامل پیکربندی،
[مرجع harness در Codex](/fa/plugins/codex-harness-reference) و برای مدل runtime،
[Codex harness](/fa/plugins/codex-harness) را ببینید.

`codexPlugins` فقط روی sessionهایی اعمال می‌شود که harness بومی Codex را انتخاب می‌کنند.
این گزینه pluginهای Codex را برای Pi، اجراهای عادی provider در OpenAI، bindingهای conversation در ACP،
یا هر harness غیر-Codex دیگری فعال نمی‌کند.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

- `plugins.entries.codex.config.codexPlugins.enabled`: پشتیبانی بومی Plugin/برنامه Codex را برای هارنس Codex فعال می‌کند. پیش‌فرض: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سیاست پیش‌فرض کنش مخرب برای درخواست‌های برنامه Plugin مهاجرت‌داده‌شده.
  پیش‌فرض: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: یک
  ورودی Plugin مهاجرت‌داده‌شده را هنگامی فعال می‌کند که `codexPlugins.enabled` سراسری نیز true باشد.
  پیش‌فرض: `true` برای ورودی‌های صریح.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هویت پایدار بازارچه. V1 فقط از `"openai-curated"` پشتیبانی می‌کند.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هویت پایدار
  Plugin در Codex از مهاجرت، برای مثال `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  بازنویسی سیاست کنش مخرب برای هر Plugin. وقتی حذف شود، مقدار سراسری
  `allow_destructive_actions` استفاده می‌شود.

`codexPlugins.enabled` دستور فعال‌سازی سراسری است. ورودی‌های صریح Plugin
که توسط مهاجرت نوشته می‌شوند، مجموعه پایدار نصب و واجد شرایط تعمیر هستند.
`plugins["*"]` پشتیبانی نمی‌شود، هیچ سوییچ `install` وجود ندارد، و مقادیر محلی
`marketplacePath` عمدا فیلدهای پیکربندی نیستند، چون ویژه میزبان هستند.

بررسی‌های آمادگی `app/list` به مدت یک ساعت کش می‌شوند و وقتی کهنه شوند
به‌صورت ناهمگام تازه‌سازی می‌شوند. پیکربندی برنامه رشته Codex هنگام برقراری
نشست هارنس Codex محاسبه می‌شود، نه در هر نوبت؛ پس از تغییر پیکربندی Plugin بومی، از `/new`، `/reset`، یا راه‌اندازی مجدد Gateway استفاده کنید.

- `plugins.entries.firecrawl.config.webFetch`: تنظیمات ارائه‌دهنده واکشی وب Firecrawl.
  - `apiKey`: کلید API Firecrawl (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، مقدار قدیمی `tools.web.fetch.firecrawl.apiKey`، یا متغیر محیطی `FIRECRAWL_API_KEY` برمی‌گردد.
  - `baseUrl`: نشانی پایه API Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ بازنویسی‌های خودمیزبان باید نقاط پایانی خصوصی/داخلی را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی را از صفحه‌ها استخراج کن (پیش‌فرض: `true`).
  - `maxAgeMs`: بیشینه عمر کش برحسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: مهلت درخواست scrape برحسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جست‌وجوی وب Grok).
  - `enabled`: ارائه‌دهنده X Search را فعال کن.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مانند `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات Dreaming حافظه. برای فازها و آستانه‌ها [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: سوییچ اصلی Dreaming (پیش‌فرض `false`).
  - `frequency`: ریتم cron برای هر پیمایش کامل Dreaming (به‌طور پیش‌فرض `"0 3 * * *"`).
  - `model`: بازنویسی اختیاری مدل زیرعامل Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ آن را با `allowedModels` همراه کنید تا هدف‌ها محدود شوند. خطاهای در دسترس نبودن مدل یک بار با مدل پیش‌فرض نشست دوباره تلاش می‌شوند؛ شکست‌های اعتماد یا فهرست مجاز بی‌صدا به مدل جایگزین برنمی‌گردند.
  - سیاست فاز و آستانه‌ها جزئیات پیاده‌سازی هستند (نه کلیدهای پیکربندی قابل مشاهده برای کاربر).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای فعال بسته Claude همچنین می‌توانند پیش‌فرض‌های Pi تعبیه‌شده را از `settings.json` ارائه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات پاک‌سازی‌شده عامل اعمال می‌کند، نه به‌عنوان وصله‌های خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه `"none"` را انتخاب کنید.
- `plugins.slots.contextEngine`: شناسه Plugin موتور زمینه فعال را انتخاب کنید؛ پیش‌فرض `"legacy"` است مگر اینکه موتور دیگری نصب و انتخاب کنید.

[Plugins](/fa/tools/plugin) را ببینید.

---

## تعهدها

`commitments` حافظه پیگیری استنباط‌شده را کنترل می‌کند: OpenClaw می‌تواند check-inها را از نوبت‌های گفت‌وگو تشخیص دهد و آن‌ها را از طریق اجرای heartbeat تحویل دهد.

- `commitments.enabled`: استخراج پنهان LLM، ذخیره‌سازی، و تحویل heartbeat برای تعهدهای پیگیری استنباط‌شده را فعال کن. پیش‌فرض: `false`.
- `commitments.maxPerDay`: بیشینه تعهدهای پیگیری استنباط‌شده که در یک روز غلتان به ازای هر نشست عامل تحویل داده می‌شوند. پیش‌فرض: `3`.

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
- `tabCleanup` زبانه‌های رهگیری‌شده عامل اصلی را پس از زمان بیکاری یا وقتی یک
  نشست از سقف خود فراتر می‌رود، بازپس می‌گیرد. برای غیرفعال کردن آن حالت‌های
  پاک‌سازی جداگانه، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین پیمایش مرورگر به‌طور پیش‌فرض سخت‌گیرانه می‌ماند.
- فقط وقتی عمدا به پیمایش مرورگر در شبکه خصوصی اعتماد دارید، `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید.
- در حالت سخت‌گیرانه، نقاط پایانی پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) در بررسی‌های دسترسی‌پذیری/کشف، مشمول همان مسدودسازی شبکه خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- پروفایل‌های راه‌دور فقط attach-only هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl`، `http://`، `https://`، `ws://`، و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw، `/json/version` را کشف کند از HTTP(S) استفاده کنید؛
  وقتی ارائه‌دهنده شما یک URL مستقیم WebSocket DevTools می‌دهد از WS(S) استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` روی دسترسی‌پذیری CDP راه‌دور و
  `attachOnly` به‌همراه درخواست‌های باز کردن زبانه اعمال می‌شوند. پروفایل‌های local loopback مدیریت‌شده
  پیش‌فرض‌های CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP مدیریت‌شده خارجی از طریق loopback دسترسی‌پذیر است، مقدار
  `attachOnly: true` را برای آن پروفایل تنظیم کنید؛ در غیر این صورت OpenClaw پورت loopback را به‌عنوان یک
  پروفایل مرورگر مدیریت‌شده محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت پورت محلی را گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل attach شوند.
- پروفایل‌های `existing-session` می‌توانند `userDataDir` را تنظیم کنند تا یک
  پروفایل مرورگر مبتنی بر Chromium مشخص، مانند Brave یا Edge، هدف گرفته شود.
- پروفایل‌های `existing-session` محدودیت‌های مسیر فعلی Chrome MCP را حفظ می‌کنند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری CSS-selector، قلاب‌های بارگذاری یک‌فایلی،
  بدون بازنویسی مهلت گفت‌وگو، بدون `wait --load networkidle`، و بدون
  `responsebody`، خروجی PDF، رهگیری دانلود، یا کنش‌های دسته‌ای.
- پروفایل‌های محلی مدیریت‌شده `openclaw`، `cdpPort` و `cdpUrl` را به‌صورت خودکار اختصاص می‌دهند؛ فقط
  برای CDP راه‌دور، `cdpUrl` را صریح تنظیم کنید.
- پروفایل‌های محلی مدیریت‌شده می‌توانند `executablePath` را تنظیم کنند تا مقدار سراسری
  `browser.executablePath` برای آن پروفایل بازنویسی شود. از این برای اجرای یک پروفایل در
  Chrome و پروفایل دیگر در Brave استفاده کنید.
- پروفایل‌های محلی مدیریت‌شده از `browser.localLaunchTimeoutMs` برای کشف HTTP مربوط به Chrome CDP
  پس از شروع فرایند و از `browser.localCdpReadyTimeoutMs` برای
  آمادگی websocket CDP پس از راه‌اندازی استفاده می‌کنند. روی میزبان‌های کندتر، جایی که Chrome
  با موفقیت شروع می‌شود اما بررسی‌های آمادگی با شروع رقابت می‌کنند، آن‌ها را افزایش دهید. هر دو مقدار باید
  عددهای صحیح مثبت تا `120000` ms باشند؛ مقادیر پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را برای پوشه خانه سیستم‌عامل شما پیش از راه‌اندازی Chromium می‌پذیرند.
  `userDataDir` هر پروفایل در پروفایل‌های `existing-session` نیز با tilde گسترش داده می‌شود.
- سرویس کنترل: فقط loopback (پورت مشتق‌شده از `gateway.port`، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های راه‌اندازی اضافی را به شروع محلی Chromium اضافه می‌کند (برای مثال
  `--disable-gpu`، اندازه پنجره، یا پرچم‌های اشکال‌زدایی).

---

## UI

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

- `seamColor`: رنگ تاکیدی برای chrome رابط کاربری برنامه بومی (رنگ حباب Talk Mode و غیره).
- `assistant`: بازنویسی هویت UI کنترل. به هویت عامل فعال برمی‌گردد.

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

<Accordion title="جزئیات فیلد Gateway">

- `mode`: مقدار `local` (اجرای Gateway) یا `remote` (اتصال به Gateway راه دور). Gateway فقط وقتی `local` باشد شروع به کار می‌کند.
- `port`: پورت تک‌گانهٔ چندمنظوره برای WS + HTTP. اولویت: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: مقدار `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP مربوط به Tailscale)، یا `custom`.
- **نام‌های مستعار قدیمی bind**: در `gateway.bind` از مقادیر حالت bind استفاده کنید (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، نه نام‌های مستعار میزبان (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **یادداشت Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکهٔ پل Docker (`-p 18789:18789`)، ترافیک روی `eth0` می‌رسد، بنابراین Gateway در دسترس نیست. از `--network host` استفاده کنید، یا `bind: "lan"` را تنظیم کنید (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) تا روی همهٔ رابط‌ها گوش دهد.
- **احراز هویت**: به‌صورت پیش‌فرض الزامی است. bindهای غیر loopback به احراز هویت Gateway نیاز دارند. در عمل یعنی یک توکن/گذرواژهٔ مشترک یا یک پراکسی معکوس آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. جادوگر راه‌اندازی به‌صورت پیش‌فرض یک توکن تولید می‌کند.
- اگر هر دو مقدار `gateway.auth.token` و `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefها)، `gateway.auth.mode` را صراحتا روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، جریان‌های شروع به کار و نصب/ترمیم سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای راه‌اندازی‌های قابل اعتماد local loopback استفاده کنید؛ این حالت عمدا در پرسش‌های راه‌اندازی ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک پراکسی معکوس آگاه از هویت واگذار می‌کند و به سرآیندهای هویت از `gateway.trustedProxies` اعتماد می‌کند (به [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth) مراجعه کنید). این حالت به‌صورت پیش‌فرض انتظار یک منبع پراکسی **غیر loopback** را دارد؛ پراکسی‌های معکوس loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخواننده‌های داخلی روی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان جایگزین مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، سرآیندهای هویت Tailscale Serve می‌توانند احراز هویت Control UI/WebSocket را برآورده کنند (با `tailscale whois` تأیید می‌شود). نقاط پایانی HTTP API از این احراز هویت سرآیند Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت عادی احراز هویت HTTP مربوط به Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway قابل اعتماد است. وقتی `tailscale.mode = "serve"` باشد، پیش‌فرض آن `true` است.
- `gateway.auth.rateLimit`: محدودکنندهٔ اختیاری برای احراز هویت ناموفق. به‌ازای هر IP کلاینت و هر محدودهٔ احراز هویت اعمال می‌شود (shared-secret و device-token مستقل ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر ناهمگام Control UI مربوط به Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست به‌ترتیب سریالی می‌شوند. بنابراین تلاش‌های بد هم‌زمان از همان کلاینت می‌توانند در درخواست دوم محدودکننده را فعال کنند، به‌جای اینکه هر دو صرفا به‌صورت عدم تطابق ساده عبور کنند.
  - مقدار پیش‌فرض `gateway.auth.rateLimit.exemptLoopback` برابر `true` است؛ وقتی عمدا می‌خواهید ترافیک localhost هم rate-limit شود (برای راه‌اندازی‌های آزمایشی یا استقرارهای سخت‌گیرانهٔ پراکسی)، آن را روی `false` تنظیم کنید.
- تلاش‌های احراز هویت WS با مبدأ مرورگر همیشه با معافیت loopback غیرفعال، محدود می‌شوند (دفاع عمیق در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، این قفل‌شدن‌های با مبدأ مرورگر به‌ازای مقدار نرمال‌شدهٔ `Origin`
  جدا می‌شوند، بنابراین شکست‌های تکراری از یک مبدأ localhost به‌طور خودکار
  مبدأ دیگری را قفل نمی‌کند.
- `tailscale.mode`: مقدار `serve` (فقط tailnet، bind از نوع loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `tailscale.preserveFunnel`: وقتی `true` باشد و `tailscale.mode = "serve"`، OpenClaw
  پیش از اعمال دوبارهٔ Serve هنگام شروع به کار، `tailscale funnel status` را بررسی می‌کند و اگر یک مسیر Funnel پیکربندی‌شدهٔ خارجی از قبل پورت Gateway را پوشش دهد، از آن صرف‌نظر می‌کند.
  پیش‌فرض `false` است.
- `controlUi.allowedOrigins`: allowlist صریح مبدأهای مرورگر برای اتصال‌های WebSocket مربوط به Gateway. وقتی انتظار می‌رود کلاینت‌های مرورگر از مبدأهای غیر loopback باشند، الزامی است.
- `controlUi.chatMessageMaxWidth`: حداکثر عرض اختیاری برای پیام‌های چت گروه‌بندی‌شدهٔ Control UI. مقادیر عرض محدود CSS مانند `960px`، `82%`، `min(1280px, 82%)`، و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناکی که fallback مبدأ مبتنی بر سرآیند Host را برای استقرارهایی فعال می‌کند که عمدا به سیاست مبدأ مبتنی بر سرآیند Host متکی هستند.
- `remote.transport`: مقدار `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، مقدار `remote.url` باید `ws://` یا `wss://` باشد.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override اضطراری در محیط فرایند سمت کلاینت
  که `ws://` متن ساده را برای IPهای قابل اعتماد شبکهٔ خصوصی مجاز می‌کند؛ پیش‌فرض برای متن ساده همچنان فقط loopback است. معادل `openclaw.json`
  وجود ندارد، و پیکربندی شبکهٔ خصوصی مرورگر مانند
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` بر کلاینت‌های WebSocket مربوط به Gateway
  اثری ندارد.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامهٔ کلاینت راه دور هستند. این‌ها به‌تنهایی احراز هویت Gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: نشانی پایهٔ HTTPS برای relay خارجی APNs که buildهای رسمی/TestFlight iOS پس از انتشار ثبت‌نام‌های مبتنی بر relay در Gateway از آن استفاده می‌کنند. این URL باید با URL relay کامپایل‌شده در build iOS منطبق باشد.
- `gateway.push.apns.relay.timeoutMs`: مهلت ارسال Gateway به relay بر حسب میلی‌ثانیه. پیش‌فرض `10000` است.
- ثبت‌نام‌های مبتنی بر relay به یک هویت مشخص Gateway واگذار می‌شوند. برنامهٔ iOS جفت‌شده `gateway.identity.get` را دریافت می‌کند، آن هویت را در ثبت‌نام relay قرار می‌دهد، و یک مجوز ارسال محدود به ثبت‌نام را به Gateway ارسال می‌کند. Gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه گریز فقط مخصوص توسعه برای URLهای relay از نوع HTTP روی loopback. URLهای relay در محیط تولید باید روی HTTPS باقی بمانند.
- `gateway.handshakeTimeoutMs`: مهلت handshake پیش از احراز هویت WebSocket مربوط به Gateway بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد، اولویت دارد. این مقدار را روی میزبان‌های پرترافیک یا کم‌قدرت که کلاینت‌های محلی می‌توانند هنگام تثبیت گرم‌شدن شروع به کار متصل شوند، افزایش دهید.
- `gateway.channelHealthCheckMinutes`: فاصلهٔ پایش سلامت کانال بر حسب دقیقه. برای غیرفعال‌کردن سراسری restartهای پایش سلامت، `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانهٔ stale-socket بر حسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: حداکثر restartهای پایش سلامت به‌ازای هر کانال/حساب در یک ساعت لغزان. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out به‌ازای هر کانال برای restartهای پایش سلامت، درحالی‌که پایشگر سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override به‌ازای هر حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر override سطح کانال اولویت دارد.
- مسیرهای فراخوانی Gateway محلی فقط وقتی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و unresolved باشد، resolve به‌صورت بسته شکست می‌خورد (بدون پنهان‌سازی با fallback راه دور).
- `trustedProxies`: IPهای پراکسی معکوس که TLS را پایان می‌دهند یا سرآیندهای کلاینتِ forward‌شده را تزریق می‌کنند. فقط پراکسی‌هایی را فهرست کنید که کنترلشان با شماست. ورودی‌های loopback همچنان برای راه‌اندازی‌های پراکسی/تشخیص محلی روی همان میزبان معتبرند (برای مثال Tailscale Serve یا یک پراکسی معکوس محلی)، اما آن‌ها درخواست‌های loopback را واجد شرایط `gateway.auth.mode: "trusted-proxy"` نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` موجود نباشد، Gateway مقدار `X-Real-IP` را می‌پذیرد. پیش‌فرض `false` برای رفتار fail-closed است.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای تأیید خودکار جفت‌سازی نخستین‌بار دستگاه node بدون scopeهای درخواستی. وقتی تنظیم نشده باشد غیرفعال است. این مورد جفت‌سازی operator/browser/Control UI/WebChat را به‌صورت خودکار تأیید نمی‌کند، و ارتقاهای role، scope، metadata، یا public-key را نیز خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی allow/deny سراسری برای فرمان‌های اعلام‌شدهٔ node پس از جفت‌سازی و ارزیابی allowlist پلتفرم. از `allowCommands` برای فعال‌کردن صریح فرمان‌های خطرناک node مانند `camera.snap`، `camera.clip`، و `screen.record` استفاده کنید؛ `denyCommands` یک فرمان را حذف می‌کند حتی اگر پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل می‌شد. پس از اینکه یک node فهرست فرمان‌های اعلام‌شدهٔ خود را تغییر داد، آن جفت‌سازی دستگاه را رد و دوباره تأیید کنید تا Gateway snapshot به‌روزشدهٔ فرمان‌ها را ذخیره کند.
- `gateway.tools.deny`: نام ابزارهای اضافی مسدودشده برای HTTP `POST /tools/invoke` (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام ابزارها را از فهرست deny پیش‌فرض HTTP حذف می‌کند.

</Accordion>

### نقاط پایانی سازگار با OpenAI

- Chat Completions: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL در Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی مثل مقدار تنظیم‌نشده در نظر گرفته می‌شوند؛ برای غیرفعال‌کردن دریافت URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- سرآیند اختیاری سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای مبدأهای HTTPS تحت کنترل خودتان تنظیم کنید؛ [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts) را ببینید)

### جداسازی چندنمونه‌ای

چند Gateway را روی یک میزبان با پورت‌ها و دایرکتوری‌های state یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

فلگ‌های便利: `--dev` (از `~/.openclaw-dev` + پورت `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

[چند Gateway](/fa/gateway/multiple-gateways) را ببینید.

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

- `enabled`: پایان‌دهی TLS را در listener مربوط به Gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده باشند، یک جفت cert/key خودامضاشدهٔ محلی را به‌صورت خودکار تولید می‌کند؛ فقط برای استفادهٔ محلی/توسعه.
- `certPath`: مسیر سیستم فایل به فایل گواهی TLS.
- `keyPath`: مسیر سیستم فایل به فایل کلید خصوصی TLS؛ دسترسی آن را محدود نگه دارید.
- `caPath`: مسیر اختیاری بستهٔ CA برای تأیید کلاینت یا زنجیره‌های اعتماد سفارشی.

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

- `mode`: کنترل می‌کند ویرایش‌های پیکربندی در زمان اجرا چگونه اعمال شوند.
  - `"off"`: ویرایش‌های زنده را نادیده می‌گیرد؛ تغییرات به restart صریح نیاز دارند.
  - `"restart"`: همیشه فرایند Gateway را هنگام تغییر پیکربندی restart می‌کند.
  - `"hot"`: تغییرات را بدون restart درون همان فرایند اعمال می‌کند.
  - `"hybrid"` (پیش‌فرض): ابتدا hot reload را امتحان می‌کند؛ اگر لازم باشد به restart fallback می‌کند.
- `debounceMs`: پنجرهٔ debounce بر حسب میلی‌ثانیه پیش از اعمال تغییرات پیکربندی (عدد صحیح نامنفی).
- `deferralTimeoutMs`: حداکثر زمان اختیاری بر حسب میلی‌ثانیه برای انتظار جهت عملیات‌های در جریان پیش از اجبار restart یا hot reload کانال. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای still-pending مقدار `0` تنظیم کنید.

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
توکن‌های hook در رشتهٔ پرس‌وجو رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به یک `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید از `gateway.auth.token` **متمایز** باشد؛ استفادهٔ دوباره از توکن Gateway رد می‌شود.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیرمسیر اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید، مثلاً `["hook:"]`.
- اگر یک نگاشت یا پیش‌تنظیم از `sessionKey` قالب‌دار استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این انتخاب فعال‌سازی نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط وقتی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد؛ پیش‌فرض: `false`.
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقدارهای `sessionKey` نگاشت که با قالب رندر شده‌اند، به‌عنوان مقدارهای تأمین‌شده از بیرون تلقی می‌شوند و آن‌ها نیز به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="Mapping details">

- `match.path` زیرمسیر بعد از `/hooks` را تطبیق می‌دهد، مثلاً `/hooks/gmail` → `gmail`.
- `match.source` یک فیلد payload را برای مسیرهای عمومی تطبیق می‌دهد.
- قالب‌هایی مانند `{{messages[0].subject}}` از payload می‌خوانند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش hook برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و درون `hooks.transformsDir` باقی بماند؛ مسیرهای مطلق و پیمایش مسیر رد می‌شوند.
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های Skills در workspace رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transforms مربوط به hooks منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک agent مشخص مسیریابی می‌کند؛ شناسه‌های ناشناخته به پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: مسیریابی صریح را محدود می‌کند (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید نشست ثابت اختیاری برای اجرای agent مربوط به hook بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای نشست نگاشت مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند؛ پیش‌فرض: `false`.
- `allowedSessionKeyPrefixes`: فهرست مجاز اختیاری برای پیشوندهای مقدارهای صریح `sessionKey`، شامل درخواست و نگاشت، مثلاً `["hook:"]`. وقتی هر نگاشت یا پیش‌تنظیمی از `sessionKey` قالب‌دار استفاده کند، این مورد الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ `channel` به‌طور پیش‌فرض `last` است.
- `model` برای این اجرای hook، LLM را بازنویسی می‌کند؛ اگر کاتالوگ مدل تنظیم شده باشد، باید مجاز باشد.

</Accordion>

### یکپارچه‌سازی Gmail

- پیش‌تنظیم داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر آن مسیریابی برای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را طوری محدود کنید که با namespace مربوط به Gmail تطبیق داشته باشد، برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، پیش‌تنظیم را به‌جای پیش‌فرض قالب‌دار، با یک `sessionKey` ایستا بازنویسی کنید.

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

- وقتی پیکربندی شده باشد، Gateway هنگام راه‌اندازی به‌طور خودکار `gog gmail watch serve` را شروع می‌کند. برای غیرفعال‌سازی، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
- یک `gog gmail watch serve` جداگانه را هم‌زمان با Gateway اجرا نکنید.

---

## میزبان Plugin بوم

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

- HTML/CSS/JS قابل‌ویرایش توسط agent و A2UI را از طریق HTTP زیر پورت Gateway ارائه می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید؛ پیش‌فرض.
- bindهای غیر loopback: مسیرهای بوم مانند دیگر سطح‌های HTTP مربوط به Gateway به احراز هویت Gateway نیاز دارند؛ توکن، گذرواژه، یا trusted-proxy.
- WebViewهای Node معمولاً headerهای احراز هویت نمی‌فرستند؛ پس از جفت‌شدن و اتصال یک node، Gateway برای دسترسی به بوم/A2UI، URLهای قابلیت با دامنهٔ همان node را اعلام می‌کند.
- URLهای قابلیت به نشست فعال WS مربوط به node متصل هستند و سریع منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- client مربوط به بارگذاری مجدد زنده را به HTML ارائه‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را به‌طور خودکار ایجاد می‌کند.
- همچنین A2UI را در `/__openclaw__/a2ui/` ارائه می‌کند.
- تغییرات به راه‌اندازی دوبارهٔ Gateway نیاز دارند.
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

- `minimal`؛ پیش‌فرض وقتی Plugin همراه `bonjour` فعال باشد: `cliPath` و `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: شامل `cliPath` و `sshPort` می‌شود؛ تبلیغ multicast در LAN همچنان نیاز دارد Plugin همراه `bonjour` فعال باشد.
- `off`: بدون تغییر فعال‌بودن Plugin، تبلیغ multicast در LAN را سرکوب می‌کند.
- Plugin همراه `bonjour` روی میزبان‌های macOS به‌طور خودکار شروع می‌شود و در Linux، Windows و استقرارهای Gateway کانتینری به‌صورت opt-in است.
- hostname وقتی یک برچسب DNS معتبر باشد به‌طور پیش‌فرض hostname سیستم است، و در غیر این صورت به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` بازنویسی کنید.

### گسترده‌ناحیه (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک zone تک‌پخشی DNS-SD زیر `~/.openclaw/dns/` می‌نویسد. برای کشف بین‌شبکه‌ای، با یک سرور DNS؛ CoreDNS توصیه می‌شود؛ به‌همراه split DNS در Tailscale جفت کنید.

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

- متغیرهای محیطی درون‌خطی فقط زمانی اعمال می‌شوند که env فرایند آن کلید را نداشته باشد.
- فایل‌های `.env`: فایل `.env` در CWD + `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
- `shellEnv`: کلیدهای موردانتظارِ موجودنبودن را از پروفایل پوسته ورود شما وارد می‌کند.
- برای تقدم کامل، [محیط](/fa/help/environment) را ببینید.

### جایگزینی متغیر محیطی

در هر رشته پیکربندی با `${VAR_NAME}` به متغیرهای محیطی ارجاع دهید:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- فقط نام‌های بزرگ منطبق می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای موجودنبودن/خالی هنگام بارگذاری پیکربندی خطا ایجاد می‌کنند.
- برای یک `${VAR}` لفظی، با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## رازها

ارجاع‌های راز افزایشی هستند: مقدارهای متن ساده همچنان کار می‌کنند.

### `SecretRef`

از یک شکل آبجکت استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`:‏ `^[a-z][a-z0-9_-]{0,63}$`
- الگوی id برای `source: "env"`:‏ `^[A-Z][A-Z0-9_]{0,127}$`
- id برای `source: "file"`: اشاره‌گر JSON مطلق (برای مثال `"/providers/openai/apiKey"`)
- الگوی id برای `source: "exec"`:‏ `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- idهای `source: "exec"` نباید شامل بخش‌های مسیر با جداکننده slash به‌شکل `.` یا `..` باشند (برای مثال `a/../b` رد می‌شود)

### سطح اعتبارنامه پشتیبانی‌شده

- ماتریس canonical: [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای اعتبارنامه پشتیبانی‌شده `openclaw.json` را هدف می‌گیرد.
- ارجاع‌های `auth-profiles.json` در حل‌وفصل زمان اجرا و پوشش audit گنجانده می‌شوند.

### پیکربندی ارائه‌دهندگان راز

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

- ارائه‌دهنده `file` از `mode: "json"` و `mode: "singleValue"` پشتیبانی می‌کند (`id` در حالت singleValue باید `"value"` باشد).
- وقتی اعتبارسنجی ACL ویندوز در دسترس نباشد، مسیرهای ارائه‌دهنده file و exec بسته‌خطا می‌شوند. `allowInsecurePath: true` را فقط برای مسیرهای مورداعتمادی تنظیم کنید که قابل اعتبارسنجی نیستند.
- ارائه‌دهنده `exec` به یک مسیر مطلق `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌صورت پیش‌فرض، مسیرهای فرمان symlink رد می‌شوند. برای اجازه‌دادن به مسیرهای symlink، همراه با اعتبارسنجی مسیر مقصد حل‌شده، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی پوشه مورداعتماد روی مسیر مقصد حل‌شده اعمال می‌شود.
- محیط فرزند `exec` به‌صورت پیش‌فرض حداقلی است؛ متغیرهای لازم را با `passEnv` صریحاً عبور دهید.
- ارجاع‌های راز هنگام فعال‌سازی در یک snapshot درون‌حافظه‌ای حل می‌شوند، سپس مسیرهای درخواست فقط snapshot را می‌خوانند.
- فیلتر سطح فعال هنگام فعال‌سازی اعمال می‌شود: ارجاع‌های حل‌نشده روی سطح‌های فعال باعث شکست راه‌اندازی/بارگذاری مجدد می‌شوند، درحالی‌که سطح‌های غیرفعال با diagnostics رد می‌شوند.

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

- پروفایل‌های هر عامل در `<agentDir>/auth-profiles.json` ذخیره می‌شوند.
- `auth-profiles.json` برای حالت‌های اعتبارنامه ایستا از ارجاع‌های سطح مقدار (`keyRef` برای `api_key`، `tokenRef` برای `token`) پشتیبانی می‌کند.
- نگاشت‌های flat قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را با یک پشتیبان `.legacy-flat.*.bak` به پروفایل‌های API-key canonical با قالب `provider:default` بازنویسی می‌کند.
- پروفایل‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های auth-profile مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های زمان اجرای ایستا از snapshotهای حل‌شده درون‌حافظه‌ای می‌آیند؛ ورودی‌های ایستای قدیمی `auth.json` هنگام کشف پاک‌سازی می‌شوند.
- واردسازی‌های OAuth قدیمی از `~/.openclaw/credentials/oauth.json`.
- [OAuth](/fa/concepts/oauth) را ببینید.
- رفتار زمان اجرای رازها و ابزارهای `audit/configure/apply`: [مدیریت رازها](/fa/gateway/secrets).

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

- `billingBackoffHours`: تأخیر بازگشتی پایه بر حسب ساعت وقتی یک پروفایل به‌دلیل خطاهای واقعی
  صورت‌حساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح صورت‌حساب
  همچنان می‌تواند حتی در پاسخ‌های `401`/`403` اینجا قرار بگیرد، اما تطبیق‌گرهای متن
  مختص ارائه‌دهنده در محدوده همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای نمونه OpenRouter
  `Key limit exceeded`). پیام‌های قابل‌تلاش‌مجدد HTTP `402` مربوط به پنجره مصرف یا
  سقف هزینه سازمان/فضای کاری به‌جای آن در مسیر `rate_limit` می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری به‌ازای هر ارائه‌دهنده برای ساعت‌های تأخیر بازگشتی صورت‌حساب.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی تأخیر بازگشتی صورت‌حساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: تأخیر بازگشتی پایه بر حسب دقیقه برای شکست‌های با اطمینان بالای `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد تأخیر بازگشتی `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجره غلتان بر حسب ساعت که برای شمارنده‌های تأخیر بازگشتی استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: بیشینه چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای بارگذاری‌زیاد، پیش از تغییر به جایگزین مدل (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` اینجا قرار می‌گیرند.
- `overloadedBackoffMs`: تأخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/پروفایلِ بارگذاری‌زیاد (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: بیشینه چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای محدودیت نرخ، پیش از تغییر به جایگزین مدل (پیش‌فرض: `1`). آن سطل محدودیت نرخ شامل متن‌های شکل‌داده‌شده توسط ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded` و `resource exhausted` است.

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
- وقتی `--verbose` باشد، `consoleLevel` به `debug` افزایش می‌یابد.
- `maxFileBytes`: بیشینه اندازه فایل گزارش فعال بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 MB). OpenClaw تا پنج آرشیو شماره‌گذاری‌شده را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن مبتنی بر بهترین تلاش برای خروجی کنسول، گزارش‌های فایل، رکوردهای گزارش OTLP، و متن رونوشت نشست ذخیره‌شده. `redactSensitive: "off"` فقط این سیاست عمومی گزارش/رونوشت را غیرفعال می‌کند؛ سطوح ایمنی UI/ابزار/عیب‌یابی همچنان پیش از انتشار، اسرار را حذف می‌کنند.

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
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی گزارش هدفمند را فعال می‌کند (از نویسه‌های عام مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه برای طبقه‌بندی نشست‌های پردازشی طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled` یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک، و پیشرفت ACP تایمر را بازنشانی می‌کنند؛ عیب‌یابی‌های تکراری `session.stuck` تا زمانی که تغییری نکرده باشند با تأخیر بازگشتی انجام می‌شوند.
- `stuckSessionAbortMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه پیش از آن‌که کار فعال متوقف‌شده واجد شرایط تخلیه-لغو برای بازیابی شود. وقتی تنظیم نشده باشد، OpenClaw از پنجره امن‌تر و گسترده‌تر اجرای جاسازی‌شده، دست‌کم ۱۰ دقیقه و ۵ برابر `stuckSessionWarnMs` استفاده می‌کند.
- `otel.enabled`: خط لوله صدور OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، کاتالوگ سیگنال، و مدل حریم خصوصی، [صدور OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: نشانی گردآورنده برای صدور OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP مختص سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فراداده HTTP/gRPC اضافی که همراه درخواست‌های صدور OTel فرستاده می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: صدور ردیابی، معیارها، یا گزارش را فعال می‌کند.
- `otel.sampleRate`: نرخ نمونه‌برداری ردیابی `0`-`1`.
- `otel.flushIntervalMs`: بازه تخلیه دوره‌ای تله‌متری بر حسب میلی‌ثانیه.
- `otel.captureContent`: ضبط محتوای خام به‌صورت انتخابی برای ویژگی‌های span در OTEL. پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را ضبط می‌کند؛ شکل شیء به شما امکان می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs` و `systemPrompt` را صریح فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای آخرین ویژگی‌های آزمایشی ارائه‌دهنده span در GenAI. به‌طور پیش‌فرض spanها برای سازگاری ویژگی قدیمی `gen_ai.system` را نگه می‌دارند؛ معیارهای GenAI از ویژگی‌های معنایی محدودشده استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از قبل یک SDK سراسری OpenTelemetry را ثبت کرده‌اند. سپس OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را رد می‌کند و شنونده‌های عیب‌یابی را فعال نگه می‌دارد.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطه پایانی مختص سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: ثبت نماگرفت‌های ردگیری کش برای اجراهای جاسازی‌شده (پیش‌فرض: `false`).
- `cacheTrace.filePath`: مسیر خروجی برای JSONL ردگیری کش (پیش‌فرض: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: کنترل می‌کند چه چیزی در خروجی ردگیری کش گنجانده شود (همگی پیش‌فرض: `true`).

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

- `channel`: کانال انتشار برای نصب‌های npm/git - `"stable"`، `"beta"` یا `"dev"`.
- `checkOnStart`: هنگام شروع Gateway، به‌روزرسانی‌های npm را بررسی می‌کند (پیش‌فرض: `true`).
- `auto.enabled`: به‌روزرسانی خودکار پس‌زمینه را برای نصب‌های بسته فعال می‌کند (پیش‌فرض: `false`).
- `auto.stableDelayHours`: کمینه تأخیر بر حسب ساعت پیش از اعمال خودکار کانال پایدار (پیش‌فرض: `6`؛ بیشینه: `168`).
- `auto.stableJitterHours`: پنجره گستردگی عرضه اضافی برای کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ بیشینه: `168`).
- `auto.betaCheckIntervalHours`: هر چند ساعت یک‌بار بررسی‌های کانال بتا اجرا شوند (پیش‌فرض: `1`؛ بیشینه: `24`).

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

- `enabled`: گیت سراسری قابلیت ACP (پیش‌فرض: `true`؛ برای پنهان کردن امکان‌های ارسال و ایجاد ACP روی `false` تنظیم کنید).
- `dispatch.enabled`: گیت مستقل برای ارسال نوبت نشست ACP (پیش‌فرض: `true`). برای در دسترس نگه‌داشتن فرمان‌های ACP درحالی‌که اجرا مسدود می‌شود، روی `false` تنظیم کنید.
- `backend`: شناسه پیش‌فرض بک‌اند زمان اجرای ACP (باید با یک Plugin زمان اجرای ACP ثبت‌شده مطابقت داشته باشد).
  ابتدا Plugin بک‌اند را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسه Plugin بک‌اند (برای نمونه `acpx`) را اضافه کنید، وگرنه بک‌اند ACP بارگذاری نخواهد شد.
- `defaultAgent`: شناسه عامل هدف جایگزین ACP وقتی ایجادها هدف صریحی مشخص نکنند.
- `allowedAgents`: فهرست مجاز شناسه‌های عامل که برای نشست‌های زمان اجرای ACP مجاز هستند؛ خالی یعنی بدون محدودیت اضافی.
- `maxConcurrentSessions`: بیشینه نشست‌های ACP فعال هم‌زمان.
- `stream.coalesceIdleMs`: پنجره تخلیه بیکار بر حسب میلی‌ثانیه برای متن جریانی.
- `stream.maxChunkChars`: بیشینه اندازه قطعه پیش از تقسیم تصویرسازی بلوک جریانی.
- `stream.repeatSuppression`: خط‌های وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی جریان می‌دهد؛ `"final_only"` تا رویدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل‌مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: بیشینه نویسه‌های خروجی دستیار که در هر نوبت ACP تصویرسازی می‌شود.
- `stream.maxSessionUpdateChars`: بیشینه نویسه‌ها برای خط‌های وضعیت/به‌روزرسانی ACP تصویرسازی‌شده.
- `stream.tagVisibility`: رکوردی از نام‌های برچسب به بازنویسی‌های بولی دیدپذیری برای رویدادهای جریانی.
- `runtime.ttlMinutes`: TTL بیکار بر حسب دقیقه برای کارکنان نشست ACP پیش از پاک‌سازی واجد شرایط.
- `runtime.installCommand`: فرمان نصب اختیاری برای اجرا هنگام بوت‌استرپ کردن محیط زمان اجرای ACP.

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
  - `"off"`: بدون متن شعار (عنوان/نسخه بنر همچنان نشان داده می‌شود).
- برای پنهان کردن کل بنر (نه فقط شعارها)، متغیر محیطی `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## راهنمای گام‌به‌گام

فراداده‌ای که توسط جریان‌های راه‌اندازی هدایت‌شده CLI نوشته می‌شود (`onboard`، `configure`، `doctor`):

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

ساخت‌های فعلی دیگر پل TCP را شامل نمی‌شوند. Nodeها از طریق WebSocket مربوط به Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از شمای پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت نگهداری نشست‌های تکمیل‌شده اجرای Cron ایزوله پیش از هرس کردن از `sessions.json`. همچنین پاک‌سازی رونوشت‌های Cron حذف‌شده بایگانی‌شده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
- `runLog.maxBytes`: حداکثر اندازه هر فایل گزارش اجرا (`cron/runs/<jobId>.jsonl`) پیش از هرس کردن. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین خط‌هایی که هنگام فعال شدن هرس گزارش اجرا نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن bearer که برای تحویل POST Webhook مربوط به Cron استفاده می‌شود (`delivery.mode = "webhook"`)، اگر حذف شود هیچ سرآیند احرازهویتی ارسال نمی‌شود.
- `webhook`: URL منسوخ Webhook جایگزین قدیمی (http/https) که فقط برای کارهای ذخیره‌شده‌ای استفاده می‌شود که هنوز `notify: true` دارند.

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

- `maxAttempts`: حداکثر تلاش‌های مجدد برای کارهای یک‌باره در خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0`-`10`).
- `backoffMs`: آرایه‌ای از تاخیرهای backoff بر حسب میلی‌ثانیه برای هر تلاش مجدد (پیش‌فرض: `[30000, 60000, 300000]`؛ ۱ تا ۱۰ ورودی).
- `retryOn`: نوع خطاهایی که تلاش مجدد را فعال می‌کنند - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش مجدد روی همه انواع گذرا، حذف کنید.

فقط برای کارهای Cron یک‌باره اعمال می‌شود. کارهای تکرارشونده از مدیریت شکست جداگانه استفاده می‌کنند.

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

- `enabled`: هشدارهای شکست را برای کارهای Cron فعال می‌کند (پیش‌فرض: `false`).
- `after`: تعداد شکست‌های پیاپی پیش از فعال شدن هشدار (عدد صحیح مثبت، حداقل: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: اجراهای ردشده پیاپی را در آستانه هشدار حساب می‌کند (پیش‌فرض: `false`). اجراهای ردشده جداگانه ردیابی می‌شوند و بر backoff خطای اجرا اثر نمی‌گذارند.
- `mode`: حالت تحویل - `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به Webhook پیکربندی‌شده ارسال می‌کند.
- `accountId`: حساب یا شناسه کانال اختیاری برای محدود کردن دامنه تحویل هشدار.

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

- مقصد پیش‌فرض برای اعلان‌های شکست Cron در همه کارها.
- `mode`: `"announce"` یا `"webhook"`؛ وقتی داده هدف کافی وجود داشته باشد، پیش‌فرض `"announce"` است.
- `channel`: بازنویسی کانال برای تحویل announce. `"last"` آخرین کانال تحویل شناخته‌شده را دوباره استفاده می‌کند.
- `to`: هدف announce صریح یا URL Webhook. برای حالت Webhook الزامی است.
- `accountId`: بازنویسی حساب اختیاری برای تحویل.
- `delivery.failureDestination` در هر کار، این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست مخصوص کار تنظیم شده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌دهند، هنگام شکست به همان هدف announce اصلی برمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

به [کارهای Cron](/fa/automation/cron-jobs) مراجعه کنید. اجراهای Cron ایزوله به‌عنوان [وظایف پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای الگوی مدل رسانه

جانگهدارهای الگو که در `tools.media.models[].args` گسترش می‌یابند:

| متغیر              | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | متن کامل پیام ورودی                              |
| `{{RawBody}}`      | متن خام (بدون پوشش‌های تاریخچه/فرستنده)          |
| `{{BodyStripped}}` | متن با حذف اشاره‌های گروهی                       |
| `{{From}}`         | شناسه فرستنده                                    |
| `{{To}}`           | شناسه مقصد                                       |
| `{{MessageSid}}`   | شناسه پیام کانال                                 |
| `{{SessionId}}`    | UUID نشست فعلی                                   |
| `{{IsNewSession}}` | `"true"` وقتی نشست جدید ایجاد شده باشد           |
| `{{MediaUrl}}`     | شبه-URL رسانه ورودی                              |
| `{{MediaPath}}`    | مسیر محلی رسانه                                  |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)                      |
| `{{Transcript}}`   | رونوشت صوتی                                      |
| `{{Prompt}}`       | اعلان رسانه حل‌شده برای ورودی‌های CLI            |
| `{{MaxChars}}`     | حداکثر نویسه‌های خروجی حل‌شده برای ورودی‌های CLI |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (در حد امکان)                         |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد امکان)               |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد امکان)                 |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد امکان)                 |
| `{{Provider}}`     | راهنمای ارائه‌دهنده (whatsapp، telegram، discord و غیره) |

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

- تک‌فایل: شیء دربرگیرنده را جایگزین می‌کند.
- آرایه‌ای از فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شوند (موارد بعدی موارد قبلی را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از درج‌ها ادغام می‌شوند (مقادیر درج‌شده را بازنویسی می‌کنند).
- درج‌های تو در تو: تا عمق ۱۰ سطح.
- مسیرها: نسبت به فایل درج‌کننده حل می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا (`dirname` از `openclaw.json`) باقی بمانند. شکل‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل همان مرز حل شوند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالا را تغییر می‌دهند که با درج تک‌فایلی پشتیبانی می‌شود، مستقیما در همان فایل درج‌شده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده باقی می‌گذارد.
- درج‌های ریشه، آرایه‌های درج، و درج‌هایی با بازنویسی‌های هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط خواندنی هستند؛ این نوشتن‌ها به‌جای تخت کردن پیکربندی، به‌صورت بسته شکست می‌خورند.
- خطاها: پیام‌های روشن برای فایل‌های مفقود، خطاهای تجزیه، و درج‌های چرخه‌ای.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

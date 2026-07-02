---
read_when:
    - به معناشناسی دقیق پیکربندی در سطح فیلد یا پیش‌فرض‌ها نیاز دارید
    - شما در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای اصلی OpenClaw، پیش‌فرض‌ها، و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-07-02T08:36:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و هرجا یک زیرسامانه مرجع عمیق‌تری برای خود داشته باشد، به آن پیوند می‌دهد. کاتالوگ‌های دستورِ متعلق به کانال و Plugin و تنظیمات عمیق حافظه/QMD به‌جای این صفحه، در صفحه‌های خودشان قرار دارند.

مرجع کد:

- `openclaw config schema`‏ JSON Schema زنده‌ای را چاپ می‌کند که برای اعتبارسنجی و Control UI استفاده می‌شود، همراه با فراداده‌های بسته‌شده/Plugin/کانال که در صورت وجود ادغام شده‌اند
- `config.schema.lookup` یک گره اسکیمای محدود به مسیر برای ابزارهای واکاوی برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش مبنای مستندات پیکربندی را در برابر سطح اسکیمای فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی عامل: پیش از ویرایش‌ها، از کنش ابزار `gateway` یعنی `config.schema.lookup` برای
مستندات و محدودیت‌های دقیق در سطح فیلد استفاده کنید. از
[پیکربندی](/fa/gateway/configuration) برای راهنمایی وظیفه‌محور و از این صفحه
برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها، و پیوندها به مراجع زیرسامانه‌ها استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`،‏ `memory.qmd.*`،‏ `memory.citations`، و پیکربندی Dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [دستورهای اسلش](/fa/tools/slash-commands) برای کاتالوگ فعلی دستورهای داخلی + بسته‌شده
- صفحه‌های مالک کانال/Plugin برای سطوح دستور ویژه کانال

قالب پیکربندی **JSON5** است (نظرها + ویرگول انتهایی مجاز است). همه فیلدها اختیاری‌اند - OpenClaw هنگام حذف آن‌ها از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی ویژه هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند - برای `channels.*`،
از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و سایر
کانال‌های بسته‌شده (احراز هویت، کنترل دسترسی، چندحسابی، دروازه‌گذاری منشن)،
[پیکربندی - کانال‌ها](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های عامل، چندعاملی، نشست‌ها، و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است - ببینید
[پیکربندی - عامل‌ها](/fa/gateway/config-agents) برای:

- `agents.defaults.*` (فضای کاری، مدل، تفکر، Heartbeat، حافظه، رسانه، Skills، sandbox)
- `multiAgent.*` (مسیریابی و اتصال‌های چندعاملی)
- `session.*` (چرخه عمر نشست، Compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر markdown)
- `talk.*` (حالت Talk)
  - `talk.consultThinkingLevel`: بازنویسی سطح تفکر برای اجرای کامل عامل OpenClaw پشت مشاوره‌های بلادرنگ Control UI Talk
  - `talk.consultFastMode`: بازنویسی یک‌باره حالت سریع برای مشاوره‌های بلادرنگ Control UI Talk
  - `talk.speechLocale`: شناسه محلی اختیاری BCP 47 برای تشخیص گفتار Talk روی iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال رونویسی، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback رله Gateway برای رونویسی‌های نهایی‌شده بلادرنگ Talk که `openclaw_agent_consult` را رد می‌کنند

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، سوییچ‌های آزمایشی، پیکربندی ابزار مبتنی بر ارائه‌دهنده، و راه‌اندازی
ارائه‌دهنده سفارشی / base-URL به صفحه‌ای اختصاصی منتقل شده‌اند - ببینید
[پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools).

## مدل‌ها

تعریف‌های ارائه‌دهنده، allowlistهای مدل، و راه‌اندازی ارائه‌دهنده سفارشی در
[پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند.
ریشه `models` همچنین مالک رفتار سراسری کاتالوگ مدل است.

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
- `models.providers.*.localService`: مدیر فرایند اختیاریِ هنگام نیاز برای
  سرورهای مدل محلی. OpenClaw نقطه پایانی سلامت پیکربندی‌شده را probe می‌کند،
  در صورت نیاز `command` مطلق را شروع می‌کند، منتظر آمادگی می‌ماند، سپس درخواست مدل
  را می‌فرستد. [سرویس‌های مدل محلی](/fa/gateway/local-model-services) را ببینید.
- `models.pricing.enabled`: bootstrap قیمت‌گذاری پس‌زمینه را کنترل می‌کند که
  پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد،
  Gateway واکشی‌های کاتالوگ قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقدارهای پیکربندی‌شده
  `models.providers.*.models[].cost` همچنان برای برآورد هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط
OpenClaw توکار و سایر آداپتورهای runtime مصرف می‌شوند. دستورهای `openclaw mcp list`،
`show`،‏ `set`، و `unset` این بلاک را بدون اتصال به سرور هدف هنگام ویرایش پیکربندی مدیریت می‌کنند.

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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: تعریف‌های نام‌گذاری‌شده سرور MCP از نوع stdio یا remote برای runtimeهایی که
  ابزارهای MCP پیکربندی‌شده را در معرض استفاده قرار می‌دهند.
  ورودی‌های remote از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛
  `type: "http"` یک alias بومی CLI است که `openclaw mcp set` و
  `openclaw doctor --fix` آن را به فیلد canonical `transport` نرمال می‌کنند.
- `mcp.servers.<name>.enabled`: برای نگه داشتن تعریف ذخیره‌شده یک سرور
  و در عین حال حذف آن از کشف MCP توکار OpenClaw و projection ابزار، روی `false` تنظیم کنید.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout درخواست MCP ویژه هر سرور
  بر حسب ثانیه یا میلی‌ثانیه.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout اتصال ویژه هر سرور
  بر حسب ثانیه یا میلی‌ثانیه.
- `mcp.servers.<name>.supportsParallelToolCalls`: راهنمای اختیاری همزمانی برای
  آداپتورهایی که می‌توانند انتخاب کنند آیا فراخوانی‌های موازی ابزار MCP صادر کنند یا نه.
- `mcp.servers.<name>.auth`: برای سرورهای HTTP MCP که به OAuth نیاز دارند،
  روی `"oauth"` تنظیم کنید. برای ذخیره tokenها زیر وضعیت OpenClaw، `openclaw mcp login <name>` را اجرا کنید.
- `mcp.servers.<name>.oauth`: بازنویسی‌های اختیاری scope، URL بازگشت، و URL فراداده مشتری OAuth.
- `mcp.servers.<name>.sslVerify`،‏ `clientCert`،‏ `clientKey`: کنترل‌های HTTP TLS
  برای endpointهای خصوصی و mutual TLS.
- `mcp.servers.<name>.toolFilter`: انتخاب ابزار اختیاری ویژه هر سرور. `include`
  ابزارهای MCP کشف‌شده را به نام‌های مطابق محدود می‌کند؛ `exclude` نام‌های مطابق را پنهان می‌کند.
  ورودی‌ها نام‌های دقیق ابزار MCP یا globهای ساده `*` هستند. سرورهایی که
  resource یا prompt دارند همچنین نام‌های ابزار کمکی (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`) تولید می‌کنند، و آن نام‌ها از همان
  filter استفاده می‌کنند.
- `mcp.servers.<name>.codex`: کنترل‌های اختیاری projection سرور app-server در Codex.
  این بلاک فقط برای threadهای app-server در Codex فراداده OpenClaw است؛ روی
  نشست‌های ACP، پیکربندی عمومی harness در Codex، یا سایر آداپتورهای runtime اثری ندارد.
  `codex.agents` غیرخالی، سرور را به شناسه‌های عامل OpenClaw فهرست‌شده محدود می‌کند.
  فهرست‌های عامل scoped خالی، blank، یا نامعتبر توسط اعتبارسنجی پیکربندی رد می‌شوند
  و به‌جای جهانی شدن، توسط مسیر projection runtime حذف می‌شوند.
  `codex.defaultToolsApprovalMode` مقدار بومی Codex یعنی
  `default_tools_approval_mode` را برای آن سرور منتشر می‌کند. OpenClaw پیش از پاس دادن
  پیکربندی بومی `mcp_servers` به Codex، بلاک `codex` را حذف می‌کند. برای
  projection شدن سرور برای هر عامل app-server در Codex با رفتار تأیید MCP پیش‌فرض Codex،
  این بلاک را حذف کنید.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای runtimeهای MCP بسته‌شده و محدود به نشست.
  اجراهای توکار یک‌باره پاک‌سازی پایان اجرا را درخواست می‌کنند؛ این TTL پشتوانه‌ای برای
  نشست‌های بلندمدت و فراخوان‌های آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP نشستِ cacheشده hot-apply می‌شوند.
  کشف/استفاده بعدی ابزار آن‌ها را از پیکربندی جدید دوباره می‌سازد، بنابراین ورودی‌های حذف‌شده
  `mcp.servers` به‌جای انتظار برای TTL بیکاری، فوراً پاک می‌شوند.
- کشف runtime همچنین با حذف کاتالوگ cacheشده آن نشست، اعلان‌های تغییر فهرست ابزار MCP را رعایت می‌کند.
  سرورهایی که resource یا prompt اعلام می‌کنند، ابزارهای کمکی برای فهرست/خواندن resourceها
  و فهرست/واکشی promptها می‌گیرند. شکست‌های تکراری فراخوانی ابزار، پیش از تلاش
  برای فراخوانی دیگر، سرور اثرگرفته را برای مدت کوتاهی pause می‌کنند.

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
    workshop: {
      allowSymlinkTargetWrites: false,
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

- `allowBundled`: allowlist اختیاری فقط برای skillهای بسته‌شده (skillهای مدیریت‌شده/فضای کاری بی‌اثرند).
- `load.extraDirs`: ریشه‌های مشترک اضافی skill (کمترین اولویت).
- `load.allowSymlinkTargets`: ریشه‌های هدف واقعی و مورد اعتماد که symlinkهای skill ممکن است
  وقتی link بیرون از ریشه منبع پیکربندی‌شده خودش قرار دارد، به آن‌ها resolve شوند.
- `workshop.allowSymlinkTargetWrites`: اجازه می‌دهد Skill Workshop apply از طریق
  هدف‌های symlink از پیش مورد اعتماد بنویسد (پیش‌فرض: false).
- `install.preferBrew`: وقتی true باشد، اگر `brew` در دسترس باشد، پیش از fallback به سایر انواع نصب‌کننده،
  نصب‌کننده‌های Homebrew را ترجیح می‌دهد.
- `install.nodeManager`: ترجیح نصب‌کننده node برای specهای `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: به مشتریان مورد اعتماد Gateway با `operator.admin` اجازه می‌دهد
  archiveهای zip خصوصی stageشده از طریق `skills.upload.*` را نصب کنند
  (پیش‌فرض: false). این فقط مسیر archive آپلودشده را فعال می‌کند؛ نصب‌های عادی ClawHub
  به آن نیاز ندارند.
- `entries.<skillKey>.enabled: false` یک skill را حتی اگر بسته‌شده/نصب‌شده باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بری برای skillهایی که یک env var اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

---

## Pluginها

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
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

- از دایرکتوری‌های بسته یا باندل زیر `~/.openclaw/extensions` و `<workspace>/.openclaw/extensions` بارگذاری می‌شود، به‌علاوه فایل‌ها یا دایرکتوری‌هایی که در `plugins.load.paths` فهرست شده‌اند.
- فایل‌های Plugin مستقل را در `plugins.load.paths` قرار دهید؛ ریشه‌های افزونه که به‌صورت خودکار کشف می‌شوند، فایل‌های سطح بالای `.js`، `.mjs` و `.ts` را نادیده می‌گیرند تا اسکریپت‌های کمکی در آن ریشه‌ها جلوی راه‌اندازی را نگیرند.
- کشف، Pluginهای بومی OpenClaw به‌علاوه باندل‌های سازگار Codex و باندل‌های Claude را می‌پذیرد، از جمله باندل‌های چیدمان پیش‌فرض Claude بدون مانیفست.
- **تغییرات پیکربندی نیازمند راه‌اندازی مجدد gateway هستند.**
- `allow`: فهرست مجاز اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` اولویت دارد.
- `plugins.entries.<id>.apiKey`: فیلد ساده‌ساز کلید API در سطح Plugin (وقتی Plugin پشتیبانی کند).
- `plugins.entries.<id>.env`: نگاشت متغیرهای محیطی محدود به Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، هسته `before_prompt_build` را مسدود می‌کند و فیلدهای تغییردهنده prompt از `before_agent_start` قدیمی را نادیده می‌گیرد، درحالی‌که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. روی hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط باندل که پشتیبانی می‌شوند اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیر باندل‌شده و مورد اعتماد می‌توانند محتوای خام مکالمه را از hookهای تایپ‌شده‌ای مانند `llm_input`، `llm_output`، `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `before_agent_finalize` و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌طور صریح به این Plugin اعتماد کنید تا برای اجراهای زیرعامل پس‌زمینه، overrideهای `provider` و `model` در سطح هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: فهرست مجاز اختیاری از هدف‌های canonical `provider/model` برای overrideهای مورد اعتماد زیرعامل. فقط وقتی از `"*"` استفاده کنید که عمدا می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.llm.allowModelOverride`: به‌طور صریح به این Plugin اعتماد کنید تا برای `api.runtime.llm.complete` درخواست override مدل بدهد.
- `plugins.entries.<id>.llm.allowedModels`: فهرست مجاز اختیاری از هدف‌های canonical `provider/model` برای overrideهای تکمیل LLM توسط Plugin مورد اعتماد. فقط وقتی از `"*"` استفاده کنید که عمدا می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: به‌طور صریح به این Plugin اعتماد کنید تا `api.runtime.llm.complete` را روی شناسه عاملی غیر از پیش‌فرض اجرا کند.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (در صورت وجود، با schema Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/زمان‌اجرای Plugin کانال زیر `channels.<id>` قرار می‌گیرند و باید با فراداده `channelConfigs` در مانیفست Plugin مالک توصیف شوند، نه با یک رجیستری گزینه مرکزی OpenClaw.

### پیکربندی Plugin هارنس Codex

Plugin باندل‌شده `codex` مالک تنظیمات هارنس app-server بومی Codex زیر
`plugins.entries.codex.config` است. برای سطح کامل پیکربندی به
[مرجع هارنس Codex](/fa/plugins/codex-harness-reference) و برای مدل زمان‌اجرا به [هارنس Codex](/fa/plugins/codex-harness) مراجعه کنید.

`codexPlugins` فقط روی نشست‌هایی اعمال می‌شود که هارنس بومی Codex را انتخاب می‌کنند.
این گزینه Pluginهای Codex را برای اجراهای provider OpenClaw، اتصال‌های مکالمه ACP
یا هیچ هارنس غیر Codexی فعال نمی‌کند.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: پشتیبانی بومی از
  Plugin/برنامه را برای هارنس Codex فعال می‌کند. پیش‌فرض: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سیاست پیش‌فرض اقدام مخرب برای elicitationهای برنامه Plugin مهاجرت‌داده‌شده.
  از `true` برای پذیرش schemaهای تأیید امن Codex بدون درخواست، از `false`
  برای رد آن‌ها، از `"auto"` برای مسیریابی تأییدهای موردنیاز Codex از طریق
  تأییدهای Plugin در OpenClaw، یا از `"ask"` برای درخواست تأیید برای هر اقدام
  نوشتنی/مخرب Plugin بدون تأیید ماندگار استفاده کنید. حالت `"ask"`، overrideهای
  تأیید ماندگار Codex در سطح هر ابزار را برای برنامه متأثر پاک می‌کند و پیش از شروع thread
  Codex، بازبین تأییدهای انسانی را برای آن برنامه انتخاب می‌کند.
  پیش‌فرض: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: یک
  ورودی Plugin مهاجرت‌داده‌شده را وقتی `codexPlugins.enabled` سراسری نیز true است فعال می‌کند.
  پیش‌فرض: `true` برای ورودی‌های صریح.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هویت پایدار marketplace. نسخه V1 فقط از `"openai-curated"` پشتیبانی می‌کند.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هویت پایدار
  Plugin Codex از مهاجرت، برای مثال `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override اقدام مخرب در سطح هر Plugin. وقتی حذف شود، مقدار سراسری
  `allow_destructive_actions` استفاده می‌شود. مقدار در سطح هر Plugin همان
  سیاست‌های `true`، `false`، `"auto"` یا `"ask"` را می‌پذیرد.

هر برنامه Plugin پذیرفته‌شده‌ای که از `"ask"` استفاده کند، درخواست‌های تأیید آن برنامه را
به بازبین انسانی هدایت می‌کند. برنامه‌های دیگر و تأییدهای thread غیر برنامه، بازبین
پیکربندی‌شده خود را حفظ می‌کنند؛ بنابراین سیاست‌های ترکیبی Plugin رفتار `"ask"` را به ارث نمی‌برند.

`codexPlugins.enabled` دستور فعال‌سازی سراسری است. ورودی‌های صریح Plugin
که توسط مهاجرت نوشته می‌شوند، مجموعه نصب ماندگار و واجد شرایط تعمیر هستند.
`plugins["*"]` پشتیبانی نمی‌شود، هیچ سوئیچ `install` وجود ندارد، و مقدارهای محلی
`marketplacePath` عمدا فیلد پیکربندی نیستند چون به میزبان وابسته‌اند.

بررسی‌های آمادگی `app/list` برای یک ساعت cache می‌شوند و وقتی stale شوند
به‌صورت ناهمگام تازه‌سازی می‌شوند. پیکربندی برنامه thread در Codex هنگام برقراری نشست هارنس
Codex محاسبه می‌شود، نه در هر نوبت؛ پس از تغییر پیکربندی Plugin بومی، از `/new`، `/reset` یا راه‌اندازی مجدد gateway استفاده کنید.

- `plugins.entries.firecrawl.config.webFetch`: تنظیمات provider واکشی وب Firecrawl.
  - `apiKey`: کلید API اختیاری Firecrawl برای محدودیت‌های بالاتر (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، `tools.web.fetch.firecrawl.apiKey` قدیمی، یا متغیر محیطی `FIRECRAWL_API_KEY` fallback می‌کند.
  - `baseUrl`: نشانی پایه API Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای self-hosted باید endpointهای خصوصی/داخلی را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی را از صفحه‌ها استخراج کند (پیش‌فرض: `true`).
  - `maxAgeMs`: حداکثر عمر cache بر حسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: مهلت درخواست scrape بر حسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جست‌وجوی وب Grok).
  - `enabled`: provider جست‌وجوی X را فعال کنید.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مثلا `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات Dreaming حافظه. برای فازها و آستانه‌ها به [Dreaming](/fa/concepts/dreaming) مراجعه کنید.
  - `enabled`: سوییچ اصلی Dreaming (پیش‌فرض `false`).
  - `frequency`: ریتم cron برای هر sweep کامل Dreaming (به‌صورت پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل زیرعامل Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن هدف‌ها با `allowedModels` همراه کنید. خطاهای unavailable بودن مدل یک بار با مدل پیش‌فرض نشست دوباره تلاش می‌شوند؛ شکست‌های اعتماد یا فهرست مجاز به‌صورت خاموش fallback نمی‌کنند.
  - سیاست فاز و آستانه‌ها جزئیات پیاده‌سازی هستند (کلیدهای پیکربندی قابل مشاهده برای کاربر نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای فعال‌شده باندل Claude همچنین می‌توانند پیش‌فرض‌های embedded OpenClaw را از `settings.json` ارائه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات agent پاک‌سازی‌شده اعمال می‌کند، نه به‌عنوان patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه از `"none"` استفاده کنید.
- `plugins.slots.contextEngine`: شناسه Plugin موتور context فعال را انتخاب کنید؛ مگر اینکه موتور دیگری را نصب و انتخاب کنید، مقدار پیش‌فرض `"legacy"` است.

به [Pluginها](/fa/tools/plugin) مراجعه کنید.

---

## تعهدات

`commitments` حافظه follow-up استنباط‌شده را کنترل می‌کند: OpenClaw می‌تواند check-inها را از نوبت‌های مکالمه تشخیص دهد و آن‌ها را از طریق اجراهای Heartbeat تحویل دهد.

- `commitments.enabled`: استخراج پنهان LLM، ذخیره‌سازی و تحویل Heartbeat را برای تعهدات follow-up استنباط‌شده فعال می‌کند. پیش‌فرض: `false`.
- `commitments.maxPerDay`: حداکثر تعهدات follow-up استنباط‌شده که در یک روز چرخان به ازای هر نشست agent تحویل داده می‌شوند. پیش‌فرض: `3`.

به [تعهدات استنباط‌شده](/fa/concepts/commitments) مراجعه کنید.

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
- `tabCleanup` تب‌های ردیابی‌شده‌ی عامل اصلی را پس از زمان بیکاری یا وقتی یک
  نشست از سقف خود فراتر می‌رود، بازپس‌گیری می‌کند. برای غیرفعال‌کردن آن حالت‌های
  پاک‌سازی جداگانه، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین ناوبری مرورگر به‌طور پیش‌فرض سخت‌گیرانه می‌ماند.
- فقط زمانی `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید که عمداً به ناوبری مرورگر در شبکه‌ی خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقطه‌پایان‌های نمایه‌ی CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترسی‌پذیری/کشف، مشمول همان مسدودسازی شبکه‌ی خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- نمایه‌های راه‌دور فقط قابل اتصال هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl` مقدارهای `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند از HTTP(S) استفاده کنید؛
  وقتی ارائه‌دهنده‌تان یک URL مستقیم WebSocket برای DevTools به شما می‌دهد از WS(S)
  استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترسی‌پذیری CDP راه‌دور و
  `attachOnly` به‌همراه درخواست‌های بازکردن تب اعمال می‌شوند. نمایه‌های loopback
  مدیریت‌شده، پیش‌فرض‌های CDP محلی را حفظ می‌کنند.
- اگر یک سرویس CDP با مدیریت خارجی از طریق loopback دسترسی‌پذیر است، برای آن
  نمایه `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw پورت loopback را
  به‌عنوان یک نمایه‌ی مرورگر مدیریت‌شده‌ی محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت پورت محلی گزارش کند.
- نمایه‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل، وصل شوند.
- نمایه‌های `existing-session` می‌توانند `userDataDir` را تنظیم کنند تا یک نمایه‌ی
  مرورگر مشخص مبتنی بر Chromium، مانند Brave یا Edge، هدف قرار گیرد.
- نمایه‌های `existing-session` وقتی Chrome از قبل پشت یک نقطه‌پایان کشف HTTP(S) برای DevTools یا نقطه‌پایان مستقیم WS(S) در حال اجراست، می‌توانند `cdpUrl` را تنظیم کنند. در آن
  حالت OpenClaw به‌جای استفاده از اتصال خودکار، نقطه‌پایان را به Chrome MCP می‌دهد؛
  `userDataDir` برای آرگومان‌های راه‌اندازی Chrome MCP نادیده گرفته می‌شود.
- نمایه‌های `existing-session` محدودیت‌های فعلی مسیر Chrome MCP را حفظ می‌کنند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری انتخاب‌گر CSS، hookهای بارگذاری یک فایل،
  بدون بازنویسی timeout گفت‌وگو، بدون `wait --load networkidle`، و بدون
  `responsebody`، خروجی PDF، رهگیری دانلود، یا کنش‌های دسته‌ای.
- نمایه‌های محلی مدیریت‌شده‌ی `openclaw` مقدارهای `cdpPort` و `cdpUrl` را خودکار اختصاص می‌دهند؛
  `cdpUrl` را فقط برای نمایه‌های CDP راه‌دور یا اتصال نقطه‌پایان existing-session به‌صورت صریح تنظیم کنید.
- نمایه‌های محلی مدیریت‌شده می‌توانند `executablePath` را تنظیم کنند تا
  `browser.executablePath` سراسری برای آن نمایه بازنویسی شود. از این برای اجرای یک نمایه در
  Chrome و نمایه‌ای دیگر در Brave استفاده کنید.
- نمایه‌های محلی مدیریت‌شده پس از شروع فرایند از `browser.localLaunchTimeoutMs` برای
  کشف HTTP در Chrome CDP و از `browser.localCdpReadyTimeoutMs` برای
  آمادگی websocket CDP پس از راه‌اندازی استفاده می‌کنند. روی میزبان‌های کندتری که Chrome
  با موفقیت شروع می‌شود اما بررسی‌های آمادگی با راه‌اندازی رقابت می‌کنند، آن‌ها را افزایش دهید. هر دو مقدار باید
  اعداد صحیح مثبت تا `120000` میلی‌ثانیه باشند؛ مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را پیش از راه‌اندازی Chromium برای دایرکتوری خانه‌ی سیستم‌عامل شما می‌پذیرند.
  `userDataDir` هر نمایه در نمایه‌های `existing-session` نیز با tilde گسترش داده می‌شود.
- سرویس کنترل: فقط loopback (پورت مشتق‌شده از `gateway.port`، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های راه‌اندازی اضافی را به شروع محلی Chromium اضافه می‌کند (برای مثال
  `--disable-gpu`، اندازه‌دهی پنجره، یا پرچم‌های اشکال‌زدایی).

---

## رابط کاربری

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // ایموجی، متن کوتاه، URL تصویر، یا URI داده
    },
  },
}
```

- `seamColor`: رنگ تأکیدی برای chrome رابط کاربری اپ بومی (رنگ حباب Talk Mode و غیره).
- `assistant`: بازنویسی هویت رابط کاربری کنترل. به هویت عامل فعال برمی‌گردد.

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
      // password: "your-password", // یا OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // برای mode=trusted-proxy؛ /gateway/trusted-proxy-auth را ببینید
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
      // allowExternalEmbedUrls: false, // خطرناک: اجازه دادن به URLهای embed خارجی مطلق http(s)
      // chatMessageMaxWidth: "min(1280px, 82%)", // حداکثر عرض اختیاری پیام چت گروه‌بندی‌شده
      // allowedOrigins: ["https://control.example.com"], // برای رابط کاربری کنترل غیر loopback لازم است
      // dangerouslyAllowHostHeaderOriginFallback: false, // حالت خطرناک fallback مبدأ Host-header
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // اختیاری. پیش‌فرض false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // اختیاری. پیش‌فرض تنظیم‌نشده/غیرفعال.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // ردهای HTTP اضافی /tools/invoke
      deny: ["browser"],
      // حذف ابزارها از فهرست رد HTTP پیش‌فرض برای فراخوان‌های مالک/مدیر
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

- `mode`: `local` (اجرای Gateway) یا `remote` (اتصال به Gateway راه‌دور). Gateway شروع به کار نمی‌کند مگر اینکه `local` باشد.
- `port`: پورت واحد چندگانه برای WS + HTTP. اولویت: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP مربوط به Tailscale)، یا `custom`.
- **نام‌های مستعار قدیمی bind**: از مقادیر حالت bind در `gateway.bind` استفاده کنید (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، نه نام‌های مستعار میزبان (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **یادداشت Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکه‌سازی bridge در Docker (`-p 18789:18789`)، ترافیک از `eth0` وارد می‌شود، بنابراین Gateway قابل دسترسی نیست. از `--network host` استفاده کنید، یا `bind: "lan"` (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) را تنظیم کنید تا روی همه رابط‌ها گوش بدهد.
- **احراز هویت**: به‌صورت پیش‌فرض الزامی است. bindهای غیر loopback به احراز هویت Gateway نیاز دارند. در عمل یعنی یک توکن/رمز عبور مشترک یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. جادوگر راه‌اندازی به‌صورت پیش‌فرض یک توکن تولید می‌کند.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند (از جمله SecretRefها)، `gateway.auth.mode` را صریحاً روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، راه‌اندازی و جریان‌های نصب/تعمیر سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای تنظیمات مطمئن local loopback استفاده کنید؛ این حالت عمداً در اعلان‌های راه‌اندازی ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک reverse proxy آگاه از هویت واگذار می‌کند و به هدرهای هویت از `gateway.trustedProxies` اعتماد می‌کند ( [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth) را ببینید). این حالت به‌صورت پیش‌فرض انتظار یک منبع proxy **غیر loopback** را دارد؛ reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی روی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان fallback مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار و انحصاری است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، هدرهای هویت Tailscale Serve می‌توانند احراز هویت Control UI/WebSocket را برآورده کنند (با `tailscale whois` تأیید می‌شود). endpointهای HTTP API از آن احراز هویت هدر Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت احراز هویت HTTP عادی Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway مورد اعتماد است. وقتی `tailscale.mode = "serve"` باشد، پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکننده اختیاری احراز هویت ناموفق. برای هر IP کلاینت و هر دامنه احراز هویت اعمال می‌شود (shared-secret و device-token مستقل ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر async مربوط به Tailscale Serve Control UI، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست به‌صورت سریالی انجام می‌شوند. بنابراین تلاش‌های بد هم‌زمان از همان کلاینت می‌توانند محدودکننده را در درخواست دوم فعال کنند، به‌جای اینکه هر دو به‌عنوان mismatch ساده هم‌زمان عبور کنند.
  - `gateway.auth.rateLimit.exemptLoopback` به‌صورت پیش‌فرض `true` است؛ وقتی عمداً می‌خواهید ترافیک localhost هم نرخ‌محدود شود (برای تنظیمات تست یا استقرارهای proxy سخت‌گیرانه)، آن را روی `false` بگذارید.
- تلاش‌های احراز هویت WS با منشأ مرورگر همیشه با معافیت loopback غیرفعال throttle می‌شوند (دفاع چندلایه در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، آن قفل‌شدگی‌های منشأ مرورگر برای هر مقدار نرمال‌شده `Origin`
  جدا هستند، بنابراین شکست‌های تکراری از یک منشأ localhost به‌صورت خودکار
  منشأ دیگری را قفل نمی‌کنند.
- `tailscale.mode`: `serve` (فقط tailnet، bind از نوع loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `tailscale.serviceName`: نام اختیاری Tailscale Service برای حالت Serve، مانند
  `svc:openclaw`. وقتی تنظیم شود، OpenClaw آن را به `tailscale serve
--service` می‌دهد تا Control UI به‌جای نام میزبان دستگاه از طریق یک Service نام‌دار در معرض دسترسی قرار گیرد. مقدار باید از قالب نام Service در Tailscale یعنی `svc:<dns-label>`
  استفاده کند؛ راه‌اندازی URL مشتق‌شده Service را گزارش می‌کند.
- `tailscale.preserveFunnel`: وقتی `true` باشد و `tailscale.mode = "serve"`، OpenClaw
  پیش از اعمال دوباره Serve هنگام راه‌اندازی، `tailscale funnel status` را بررسی می‌کند و اگر یک مسیر Funnel که بیروناً پیکربندی شده از قبل پورت Gateway را پوشش دهد،
  از آن صرف‌نظر می‌کند. پیش‌فرض `false` است.
- `controlUi.allowedOrigins`: allowlist صریح منشأهای مرورگر برای اتصال‌های WebSocket به Gateway. برای منشأهای عمومی غیر loopback مرورگر الزامی است. بارگذاری‌های UI خصوصی same-origin روی LAN/Tailnet از loopback، RFC1918/link-local، `.local`، `.ts.net`، یا میزبان‌های CGNAT مربوط به Tailscale بدون فعال‌سازی fallback هدر Host پذیرفته می‌شوند.
- `controlUi.chatMessageMaxWidth`: حداکثر عرض اختیاری برای پیام‌های چت گروه‌بندی‌شده در Control UI. مقادیر محدودشده عرض CSS مانند `960px`، `82%`، `min(1280px, 82%)`، و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناک که fallback منشأ مبتنی بر هدر Host را برای استقرارهایی فعال می‌کند که عمداً به سیاست منشأ هدر Host متکی‌اند.
- `remote.transport`: `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، `remote.url` برای میزبان‌های عمومی باید `wss://` باشد؛ `ws://` متن ساده فقط برای loopback، LAN، link-local، `.local`، `.ts.net`، و میزبان‌های CGNAT مربوط به Tailscale پذیرفته می‌شود.
- `remote.remotePort`: پورت Gateway روی میزبان SSH راه‌دور. پیش‌فرض `18789` است؛ وقتی پورت tunnel محلی با پورت Gateway راه‌دور فرق دارد، از این استفاده کنید.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامه کلاینت راه‌دور هستند. این‌ها به‌تنهایی احراز هویت Gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: URL پایه HTTPS برای relay خارجی APNs که پس از انتشار ثبت‌نام‌ها از buildهای iOS مبتنی بر relay به Gateway استفاده می‌شود. buildهای عمومی App Store از relay میزبانی‌شده OpenClaw استفاده می‌کنند. URLهای relay سفارشی باید با یک مسیر build/استقرار iOS عمداً جدا مطابقت داشته باشند که URL relay آن به همان relay اشاره کند.
- `gateway.push.apns.relay.timeoutMs`: زمان‌انتظار ارسال از Gateway به relay به میلی‌ثانیه. پیش‌فرض `10000` است.
- ثبت‌نام‌های مبتنی بر relay به یک هویت Gateway مشخص واگذار می‌شوند. برنامه iOS جفت‌شده `gateway.identity.get` را دریافت می‌کند، آن هویت را در ثبت‌نام relay وارد می‌کند، و یک مجوز ارسال scoped به ثبت‌نام را به Gateway فوروارد می‌کند. Gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه فرار فقط مخصوص توسعه برای URLهای relay HTTP روی loopback. URLهای relay تولید باید روی HTTPS بمانند.
- `gateway.handshakeTimeoutMs`: زمان‌انتظار handshake پیش از احراز هویت WebSocket در Gateway به میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد، اولویت دارد. روی میزبان‌های پرترافیک یا کم‌توان که کلاینت‌های محلی می‌توانند در حالی که warmup راه‌اندازی هنوز در حال تثبیت است متصل شوند، این مقدار را افزایش دهید.
- `gateway.channelHealthCheckMinutes`: بازه health-monitor کانال به دقیقه. برای غیرفعال‌کردن restartهای health-monitor به‌صورت سراسری، روی `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانه stale-socket به دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: بیشینه restartهای health-monitor برای هر کانال/حساب در یک ساعت غلتان. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: انصراف به‌ازای هر کانال از restartهای health-monitor در حالی که monitor سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override به‌ازای هر حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر override سطح کانال اولویت دارد.
- مسیرهای فراخوانی Gateway محلی فقط وقتی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صریحاً از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolution به‌صورت fail-closed شکست می‌خورد (بدون masking با fallback راه‌دور).
- `trustedProxies`: IPهای reverse proxy که TLS را terminate می‌کنند یا هدرهای forwarded-client را تزریق می‌کنند. فقط proxyهایی را فهرست کنید که کنترل می‌کنید. ورودی‌های loopback همچنان برای تنظیمات proxy/تشخیص محلی روی همان میزبان معتبرند (برای مثال Tailscale Serve یا یک reverse proxy محلی)، اما درخواست‌های loopback را واجد شرایط `gateway.auth.mode: "trusted-proxy"` نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` وجود نداشته باشد Gateway `X-Real-IP` را می‌پذیرد. پیش‌فرض `false` برای رفتار fail-closed است.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای تأیید خودکار جفت‌سازی اولیه دستگاه node بدون scopeهای درخواستی. وقتی تنظیم نشده باشد غیرفعال است. این مورد جفت‌سازی operator/browser/Control UI/WebChat را خودکار تأیید نمی‌کند، و upgradeهای role، scope، metadata، یا public-key را خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی سراسری allow/deny برای فرمان‌های node اعلام‌شده پس از جفت‌سازی و ارزیابی allowlist پلتفرم. از `allowCommands` برای انتخاب فرمان‌های خطرناک node مانند `camera.snap`، `camera.clip`، و `screen.record` استفاده کنید؛ `denyCommands` یک فرمان را حذف می‌کند حتی اگر پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل می‌شد. پس از اینکه یک node فهرست فرمان‌های اعلام‌شده خود را تغییر داد، جفت‌سازی آن دستگاه را رد و دوباره تأیید کنید تا Gateway snapshot فرمان به‌روزشده را ذخیره کند.
- `gateway.tools.deny`: نام ابزارهای اضافی که برای HTTP `POST /tools/invoke` مسدود شده‌اند (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام ابزارها را از فهرست deny پیش‌فرض HTTP برای
  فراخوان‌های owner/admin حذف می‌کند. این مورد فراخوان‌های دارای هویت `operator.write`
  را به دسترسی owner/admin ارتقا نمی‌دهد؛ `cron`، `gateway`، و `nodes` حتی وقتی allowlist شده باشند هم
  برای فراخوان‌های غیر owner در دسترس نمی‌شوند.

</Accordion>

### endpointهای سازگار با OpenAI

- HTTP RPC مدیر: به‌صورت پیش‌فرض به‌عنوان Plugin `admin-http-rpc` خاموش است. Plugin را فعال کنید تا `POST /api/v1/admin/rpc` ثبت شود. [HTTP RPC مدیر](/fa/plugins/admin-http-rpc) را ببینید.
- Chat Completions: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL در Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی به‌عنوان تنظیم‌نشده در نظر گرفته می‌شوند؛ برای غیرفعال‌کردن دریافت URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- هدر اختیاری سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای منشأهای HTTPS تحت کنترل خودتان تنظیم کنید؛ [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts) را ببینید)

### جداسازی چندنمونه‌ای

چند Gateway را روی یک میزبان با پورت‌ها و دایرکتوری‌های state یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

پرچم‌های راحتی: `--dev` (از `~/.openclaw-dev` + پورت `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

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
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده‌اند، یک جفت cert/key خودامضای محلی را خودکار تولید می‌کند؛ فقط برای استفاده local/dev.
- `certPath`: مسیر فایل‌سیستم به فایل گواهی TLS.
- `keyPath`: مسیر فایل‌سیستم به فایل کلید خصوصی TLS؛ دسترسی آن را محدود نگه دارید.
- `caPath`: مسیر اختیاری bundle مربوط به CA برای تأیید کلاینت یا زنجیره‌های اعتماد سفارشی.

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

- `mode`: کنترل می‌کند ویرایش‌های پیکربندی هنگام اجرا چگونه اعمال شوند.
  - `"off"`: ویرایش‌های زنده را نادیده می‌گیرد؛ تغییرات به راه‌اندازی مجدد صریح نیاز دارند.
  - `"restart"`: با تغییر پیکربندی، همیشه فرایند Gateway را دوباره راه‌اندازی می‌کند.
  - `"hot"`: تغییرات را بدون راه‌اندازی مجدد، درون همان فرایند اعمال می‌کند.
  - `"hybrid"` (پیش‌فرض): ابتدا بارگذاری مجدد گرم را امتحان می‌کند؛ در صورت نیاز به راه‌اندازی مجدد برمی‌گردد.
- `debounceMs`: پنجرهٔ debounce بر حسب میلی‌ثانیه پیش از اعمال تغییرات پیکربندی (عدد صحیح نامنفی).
- `deferralTimeoutMs`: حداکثر زمان اختیاری بر حسب میلی‌ثانیه برای انتظار تا پایان عملیات‌های در جریان، پیش از اجبار به راه‌اندازی مجدد یا بارگذاری مجدد گرم کانال. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ایِ همچنان در انتظار، آن را روی `0` بگذارید.

---

## قلاب‌ها

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
توکن‌های قلاب در رشتهٔ پرس‌وجو رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید با احراز هویت shared-secret فعال Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) متفاوت باشد؛ اگر راه‌اندازی استفادهٔ دوباره را تشخیص دهد، یک هشدار امنیتی غیرکشنده در لاگ ثبت می‌کند.
- `openclaw security audit` استفادهٔ دوباره از احراز هویت قلاب/Gateway را، از جمله احراز هویت گذرواژهٔ Gateway که فقط هنگام ممیزی ارائه شده است (`--auth password --password <password>`)، به‌عنوان یافته‌ای بحرانی علامت‌گذاری می‌کند. برای چرخاندن `hooks.token` ذخیره‌شده و استفاده‌شدهٔ دوباره، `openclaw doctor --fix` را اجرا کنید، سپس فرستنده‌های قلاب خارجی را به‌روزرسانی کنید تا از توکن قلاب جدید استفاده کنند.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیرمسیر اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا preset از `sessionKey` قالبی استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ثابت به این opt-in نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط وقتی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` resolve می‌شود
  - مقادیر `sessionKey` نگاشتِ render‌شده با قالب، به‌عنوان دادهٔ خارجی ارائه‌شده در نظر گرفته می‌شوند و آن‌ها نیز به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="جزئیات نگاشت">

- `match.path` با زیرمسیر پس از `/hooks` مطابقت می‌کند (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` برای مسیرهای عمومی با یک فیلد payload مطابقت می‌کند.
- قالب‌هایی مانند `{{messages[0].subject}}` از payload خوانده می‌شوند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش قلاب برمی‌گرداند.
  - `transform.module` باید مسیر نسبی باشد و درون `hooks.transformsDir` بماند (مسیرهای مطلق و traversal رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های skill فضای کاری رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transformهای قلاب منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک عامل مشخص route می‌شود؛ شناسه‌های ناشناخته به عامل پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: route مؤثر عامل را محدود می‌کند، از جمله مسیر عامل پیش‌فرض وقتی `agentId` حذف شده باشد (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید نشست ثابت اختیاری برای اجرای عامل قلاب بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای نشست نگاشت مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: allowlist اختیاری پیشوند برای مقادیر صریح `sessionKey` (درخواست + نگاشت)، مثلاً `["hook:"]`. وقتی هر نگاشت یا preset از `sessionKey` قالبی استفاده کند، الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ `channel` به‌طور پیش‌فرض `last` است.
- `model` برای این اجرای قلاب، LLM را override می‌کند (اگر catalog مدل تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- preset داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر آن route کردن به‌ازای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را به namespace مربوط به Gmail محدود کنید، برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، preset را با یک `sessionKey` ثابت به‌جای پیش‌فرض قالبی override کنید.

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

- Gateway هنگام boot، اگر پیکربندی شده باشد، `gog gmail watch serve` را خودکار شروع می‌کند. برای غیرفعال کردن، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
- `gog gmail watch serve` جداگانه‌ای را کنار Gateway اجرا نکنید.

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

- HTML/CSS/JS قابل ویرایش توسط عامل و A2UI را از طریق HTTP زیر پورت Gateway سرو می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- bindهای غیر-loopback: routeهای بوم به احراز هویت Gateway نیاز دارند (توکن/گذرواژه/trusted-proxy)، همانند سایر سطوح HTTP Gateway.
- WebViewهای Node معمولاً headerهای احراز هویت نمی‌فرستند؛ پس از pair و متصل شدن یک node، Gateway برای دسترسی به بوم/A2UI، URLهای قابلیتِ scoped به node را advertise می‌کند.
- URLهای قابلیت به نشست WS فعال node مقید هستند و به‌سرعت منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت live-reload را به HTML سرو‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را خودکار ایجاد می‌کند.
- همچنین A2UI را در `/__openclaw__/a2ui/` سرو می‌کند.
- تغییرات به راه‌اندازی مجدد gateway نیاز دارند.
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

- `minimal` (پیش‌فرض وقتی Plugin همراه `bonjour` فعال است): `cliPath` + `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: `cliPath` + `sshPort` را شامل می‌شود؛ تبلیغ multicast در LAN همچنان به فعال بودن Plugin همراه `bonjour` نیاز دارد.
- `off`: تبلیغ multicast در LAN را بدون تغییر فعال‌سازی Plugin سرکوب می‌کند.
- Plugin همراه `bonjour` روی میزبان‌های macOS خودکار شروع می‌شود و روی Linux، Windows و استقرارهای Gateway کانتینری opt-in است.
- نام میزبان وقتی یک برچسب DNS معتبر باشد، به‌طور پیش‌فرض نام میزبان سیستم است و در غیر این صورت به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` override کنید.

### گسترده‌ناحیه (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک ناحیه DNS-SD تک‌پخشی زیر `~/.openclaw/dns/` می‌نویسد. برای کشف بین‌شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + split DNS در Tailscale همراه کنید.

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

- متغیرهای محیطی درون‌خطی فقط وقتی اعمال می‌شوند که متغیر محیطی فرایند آن کلید را نداشته باشد.
- فایل‌های `.env`: فایل `.env` در CWD + `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
- `shellEnv`: کلیدهای مورد انتظارِ ناموجود را از پروفایل پوسته ورود شما وارد می‌کند.
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

- فقط نام‌های بزرگ مطابق این الگو پذیرفته می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای ناموجود/خالی هنگام بارگذاری پیکربندی خطا ایجاد می‌کنند.
- برای مقدار لفظی `${VAR}` با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## اسرار

ارجاع‌های secret افزایشی هستند: مقدارهای متن ساده همچنان کار می‌کنند.

### `SecretRef`

از یک شکل شیء استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی id برای `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id برای `source: "file"`: اشاره‌گر JSON مطلق (برای مثال `"/providers/openai/apiKey"`)
- الگوی id برای `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (انتخابگرهای سبک AWS مثل `secret#json_key` را پشتیبانی می‌کند)
- idهای `source: "exec"` نباید بخش‌های مسیر جداشده با slash شامل `.` یا `..` داشته باشند (برای مثال `a/../b` رد می‌شود)

### سطح اعتبارنامه پشتیبانی‌شده

- ماتریس canonical: [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای اعتبارنامه پشتیبانی‌شده در `openclaw.json` را هدف می‌گیرد.
- ارجاع‌های `auth-profiles.json` در پوشش تفکیک زمان اجرا و ممیزی گنجانده می‌شوند.

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

نکات:

- ارائه‌دهنده `file` از `mode: "json"` و `mode: "singleValue"` پشتیبانی می‌کند (`id` در حالت singleValue باید `"value"` باشد).
- مسیرهای ارائه‌دهنده file و exec وقتی تأیید Windows ACL در دسترس نباشد، بسته و ناموفق می‌شوند. `allowInsecurePath: true` را فقط برای مسیرهای مورد اعتمادی تنظیم کنید که قابل تأیید نیستند.
- ارائه‌دهنده `exec` به یک مسیر مطلق برای `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌طور پیش‌فرض، مسیرهای دستور symlink رد می‌شوند. `allowSymlinkCommand: true` را تنظیم کنید تا مسیرهای symlink مجاز شوند، در حالی که مسیر مقصد تفکیک‌شده اعتبارسنجی می‌شود.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی دایرکتوری مورد اعتماد روی مسیر مقصد تفکیک‌شده اعمال می‌شود.
- محیط فرزند `exec` به‌طور پیش‌فرض حداقلی است؛ متغیرهای لازم را صریحاً با `passEnv` پاس دهید.
- ارجاع‌های secret هنگام فعال‌سازی به یک snapshot درون‌حافظه‌ای تفکیک می‌شوند، سپس مسیرهای درخواست فقط snapshot را می‌خوانند.
- فیلتر سطح فعال هنگام فعال‌سازی اعمال می‌شود: ارجاع‌های تفکیک‌نشده روی سطوح فعال باعث شکست startup/reload می‌شوند، در حالی که سطوح غیرفعال با diagnostics رد می‌شوند.

---

## ذخیره‌سازی احراز هویت

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- پروفایل‌های هر عامل در `<agentDir>/auth-profiles.json` ذخیره می‌شوند.
- `auth-profiles.json` برای حالت‌های اعتبارنامه ایستا از ارجاع‌های سطح مقدار پشتیبانی می‌کند (`keyRef` برای `api_key`، و `tokenRef` برای `token`).
- نگاشت‌های تخت قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را به پروفایل‌های کلید API استاندارد `provider:default` با یک پشتیبان `.legacy-flat.*.bak` بازنویسی می‌کند.
- پروفایل‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های پروفایل احراز هویت مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های ایستای زمان اجرا از اسنپ‌شات‌های حل‌شده درون حافظه می‌آیند؛ ورودی‌های ایستای قدیمی `auth.json` هنگام کشف پاک‌سازی می‌شوند.
- واردسازی‌های قدیمی OAuth از `~/.openclaw/credentials/oauth.json` انجام می‌شود.
- [OAuth](/fa/concepts/oauth) را ببینید.
- رفتار زمان اجرای اسرار و ابزارهای `audit/configure/apply`: [مدیریت اسرار](/fa/gateway/secrets).

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

- `billingBackoffHours`: بازه انتظار پایه بر حسب ساعت وقتی یک پروفایل به‌دلیل خطاهای واقعی
  صورت‌حساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح مربوط به صورت‌حساب
  همچنان می‌تواند حتی در پاسخ‌های `401`/`403` اینجا قرار بگیرد، اما تطبیق‌دهنده‌های
  متن اختصاصی هر ارائه‌دهنده در محدوده همان ارائه‌دهنده مالک خود باقی می‌مانند
  (برای نمونه OpenRouter `Key limit exceeded`). پیام‌های HTTP `402` قابل تلاش دوباره
  مربوط به پنجره مصرف یا سقف هزینه سازمان/فضای کاری، به‌جای این مسیر، در مسیر
  `rate_limit` باقی می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری برای هر ارائه‌دهنده برای ساعت‌های بازه انتظار صورت‌حساب.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی بازه انتظار صورت‌حساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: بازه انتظار پایه بر حسب دقیقه برای شکست‌های با اطمینان بالا از نوع `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد بازه انتظار `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجره غلتان بر حسب ساعت که برای شمارنده‌های بازه انتظار استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: بیشینه چرخش پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای بار بیش از حد، پیش از جابه‌جایی به جایگزین مدل (پیش‌فرض: `1`). شکل‌های مشغول بودن ارائه‌دهنده مانند `ModelNotReadyException` اینجا قرار می‌گیرند.
- `overloadedBackoffMs`: تأخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/پروفایل دچار بار بیش از حد (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: بیشینه چرخش پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای محدودیت نرخ، پیش از جابه‌جایی به جایگزین مدل (پیش‌فرض: `1`). آن سطل محدودیت نرخ شامل متن‌های شکل‌گرفته توسط ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded` و `resource exhausted` است.

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
- `maxFileBytes`: بیشینه اندازه فایل گزارش فعال بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 مگابایت). OpenClaw تا پنج آرشیو شماره‌دار را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن با بهترین تلاش برای خروجی کنسول، گزارش‌های فایل، رکوردهای گزارش OTLP، و متن رونوشت نشست ذخیره‌شده. `redactSensitive: "off"` فقط این سیاست عمومی گزارش/رونوشت را غیرفعال می‌کند؛ سطوح ایمنی UI/ابزار/تشخیص همچنان پیش از انتشار، اسرار را ویرایش می‌کنند.

---

## تشخیص

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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

- `enabled`: کلید اصلی برای خروجی ابزاربندی (پیش‌فرض: `true`).
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی گزارش هدفمند را فعال می‌کند (از wildcardهایی مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه برای طبقه‌بندی نشست‌های پردازشی طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled` یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک و پیشرفت ACP تایمر را بازنشانی می‌کنند؛ تشخیص‌های تکراری `session.stuck` تا زمانی که تغییری رخ ندهد با بازه انتظار عقب‌نشینی می‌کنند.
- `stuckSessionAbortMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه پیش از آنکه کار فعال متوقف‌شده واجد شرایط، برای بازیابی با تخلیه-لغو متوقف شود. وقتی تنظیم نشده باشد، OpenClaw از پنجره ایمن‌تر اجرای توکار گسترش‌یافته، حداقل ۵ دقیقه و ۳ برابر `stuckSessionWarnMs`، استفاده می‌کند.
- `memoryPressureSnapshot`: وقتی فشار حافظه به `critical` می‌رسد، یک اسنپ‌شات پایداری ویرایش‌شده پیش از OOM ثبت می‌کند (پیش‌فرض: `false`). برای افزودن اسکن/نوشتن فایل بسته پایداری، در حالی که رویدادهای عادی فشار حافظه حفظ می‌شوند، آن را روی `true` تنظیم کنید.
- `otel.enabled`: خط لوله صدور OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، کاتالوگ سیگنال و مدل حریم خصوصی، [صدور OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: URL گردآورنده برای صدور OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP مخصوص سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فراداده HTTP/gRPC اضافی که همراه درخواست‌های صدور OTel ارسال می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: صدور ردگیری، سنجه‌ها یا گزارش را فعال می‌کند.
- `otel.logsExporter`: مقصد صدور گزارش: `"otlp"` (پیش‌فرض)، `"stdout"` برای یک شیء JSON در هر خط stdout، یا `"both"`.
- `otel.sampleRate`: نرخ نمونه‌برداری ردگیری `0` تا `1`.
- `otel.flushIntervalMs`: فاصله تخلیه دوره‌ای دورسنجی بر حسب میلی‌ثانیه.
- `otel.captureContent`: ثبت محتوای خام به‌صورت opt-in برای ویژگی‌های span در OTEL. پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را ثبت می‌کند؛ شکل شیء اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs`، `systemPrompt` و `toolDefinitions` را به‌صورت صریح فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای تازه‌ترین شکل آزمایشی span استنتاج GenAI، شامل نام‌های span به‌صورت `{gen_ai.operation.name} {gen_ai.request.model}`، نوع span برابر `CLIENT`، و `gen_ai.provider.name` به‌جای `gen_ai.system` قدیمی. به‌طور پیش‌فرض spanها برای سازگاری `openclaw.model.call` و `gen_ai.system` را نگه می‌دارند؛ سنجه‌های GenAI از ویژگی‌های معنایی محدود استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از قبل یک SDK سراسری OpenTelemetry ثبت کرده‌اند. سپس OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را رد می‌کند، در حالی که شنونده‌های تشخیصی فعال می‌مانند.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطه پایانی مخصوص سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: اسنپ‌شات‌های ردگیری کش را برای اجراهای توکار ثبت می‌کند (پیش‌فرض: `false`).
- `cacheTrace.filePath`: مسیر خروجی برای JSONL ردگیری کش (پیش‌فرض: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: کنترل می‌کند چه چیزی در خروجی ردگیری کش گنجانده شود (همه به‌طور پیش‌فرض: `true`).

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
- `auto.stableJitterHours`: پنجره پراکندگی اضافی برای انتشار تدریجی کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ بیشینه: `168`).
- `auto.betaCheckIntervalHours`: فاصله اجرای بررسی‌های کانال بتا بر حسب ساعت (پیش‌فرض: `1`؛ بیشینه: `24`).

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

- `enabled`: دروازه قابلیت سراسری ACP (پیش‌فرض: `true`؛ برای پنهان کردن امکانات dispatch و spawn در ACP، روی `false` تنظیم کنید).
- `dispatch.enabled`: دروازه مستقل برای dispatch نوبت نشست ACP (پیش‌فرض: `true`). برای در دسترس نگه داشتن فرمان‌های ACP در حالی که اجرا مسدود می‌شود، روی `false` تنظیم کنید.
- `backend`: شناسه پیش‌فرض backend زمان اجرای ACP (باید با یک Plugin زمان اجرای ACP ثبت‌شده مطابقت داشته باشد).
  ابتدا Plugin مربوط به backend را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسه Plugin مربوط به backend را (برای نمونه `acpx`) در آن بگنجانید، وگرنه backend مربوط به ACP بارگذاری نمی‌شود.
- `defaultAgent`: شناسه عامل هدف جایگزین ACP وقتی spawnها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: allowlist شناسه‌های عامل مجاز برای نشست‌های زمان اجرای ACP؛ خالی بودن یعنی محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: بیشینه نشست‌های ACP فعال همزمان.
- `stream.coalesceIdleMs`: پنجره تخلیه بیکار بر حسب میلی‌ثانیه برای متن streamشده.
- `stream.maxChunkChars`: بیشینه اندازه قطعه پیش از تقسیم projection بلوک streamشده.
- `stream.repeatSuppression`: خطوط وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی stream می‌کند؛ `"final_only"` تا رویدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: بیشینه نویسه‌های خروجی دستیار که در هر نوبت ACP projection می‌شود.
- `stream.maxSessionUpdateChars`: بیشینه نویسه‌ها برای خطوط وضعیت/به‌روزرسانی ACP که projection می‌شوند.
- `stream.tagVisibility`: رکورد نام‌های برچسب به بازنویسی‌های نمایانی بولی برای رویدادهای streamشده.
- `runtime.ttlMinutes`: TTL بیکاری بر حسب دقیقه برای workerهای نشست ACP پیش از واجد شرایط شدن برای پاک‌سازی.
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
  - `"random"` (پیش‌فرض): شعارهای چرخشی طنزآمیز/فصلی.
  - `"default"`: شعار ثابت و خنثی (`All your chats, one OpenClaw.`).
  - `"off"`: بدون متن شعار (عنوان/نسخه بنر همچنان نمایش داده می‌شود).
- برای پنهان‌کردن کل بنر (نه فقط شعارها)، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## راهنما

فراداده‌ای که توسط جریان‌های راه‌اندازی هدایت‌شده CLI (`onboard`، `configure`، `doctor`) نوشته می‌شود:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## هویت

فیلدهای هویت `agents.list` را در [پیش‌فرض‌های عامل](/fa/gateway/config-agents#agent-defaults) ببینید.

---

## پل (قدیمی، حذف‌شده)

بیلدهای فعلی دیگر پل TCP را شامل نمی‌شوند. Nodeها از طریق وب‌سوکت Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از شِمای پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: مدت زمانی که نشست‌های اجرای Cron ایزوله تکمیل‌شده پیش از حذف از `sessions.json` نگه داشته می‌شوند. همچنین پاک‌سازی رونوشت‌های بایگانی‌شده Cron حذف‌شده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال‌سازی، `false` تنظیم کنید.
- `runLog.maxBytes`: برای سازگاری با لاگ‌های اجرای Cron قدیمی‌تر که مبتنی بر فایل هستند پذیرفته می‌شود. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین ردیف‌های تاریخچه اجرای SQLite که برای هر کار نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن حامل استفاده‌شده برای تحویل POST مربوط به Cron Webhook (`delivery.mode = "webhook"`). اگر حذف شود، هیچ هدر احراز هویتی ارسال نمی‌شود.
- `webhook`: URL Webhook بازگشتی قدیمی و منسوخ (http/https) که توسط `openclaw doctor --fix` برای مهاجرت کارهای ذخیره‌شده‌ای استفاده می‌شود که هنوز `notify: true` دارند؛ تحویل در زمان اجرا از `delivery.mode="webhook"` مختص هر کار به‌همراه `delivery.to`، یا هنگام حفظ تحویل اعلان از `delivery.completionDestination` استفاده می‌کند.

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

- `maxAttempts`: بیشینه تلاش‌های مجدد برای کارهای Cron در خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0`-`10`).
- `backoffMs`: آرایه‌ای از تأخیرهای backoff بر حسب میلی‌ثانیه برای هر تلاش مجدد (پیش‌فرض: `[30000, 60000, 300000]`؛ ۱ تا ۱۰ ورودی).
- `retryOn`: نوع خطاهایی که تلاش مجدد را فعال می‌کنند - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش مجدد روی همه نوع‌های گذرا، آن را حذف کنید.

کارهای یک‌باره تا زمانی که تلاش‌های مجدد تمام شوند فعال می‌مانند، سپس با حفظ وضعیت خطای نهایی غیرفعال می‌شوند. کارهای تکرارشونده از همان سیاست تلاش مجدد گذرا استفاده می‌کنند تا پس از backoff و پیش از نوبت زمان‌بندی‌شده بعدی خود دوباره اجرا شوند؛ خطاهای دائمی یا تلاش‌های مجدد گذرای تمام‌شده با backoff خطا به زمان‌بندی تکرارشونده عادی برمی‌گردند.

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
- `after`: تعداد شکست‌های پیاپی پیش از ارسال هشدار (عدد صحیح مثبت، حداقل: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: اجراهای ردشده پیاپی را در آستانه هشدار حساب می‌کند (پیش‌فرض: `false`). اجراهای ردشده جداگانه پیگیری می‌شوند و بر backoff خطای اجرا اثر نمی‌گذارند.
- `mode`: حالت تحویل - `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به Webhook پیکربندی‌شده پست می‌کند.
- `accountId`: شناسه حساب یا کانال اختیاری برای محدودکردن دامنه تحویل هشدار.

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
- `mode`: `"announce"` یا `"webhook"`؛ وقتی داده هدف کافی وجود داشته باشد، به‌صورت پیش‌فرض `"announce"` است.
- `channel`: بازنویسی کانال برای تحویل اعلان. `"last"` از آخرین کانال تحویل شناخته‌شده دوباره استفاده می‌کند.
- `to`: هدف اعلان صریح یا URL Webhook. برای حالت Webhook الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- `delivery.failureDestination` مختص هر کار این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست مختص کار تنظیم نشده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌دهند، هنگام شکست به همان هدف اعلان اصلی برمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

[کارهای Cron](/fa/automation/cron-jobs) را ببینید. اجراهای Cron ایزوله به‌عنوان [کارهای پس‌زمینه](/fa/automation/tasks) پیگیری می‌شوند.

---

## متغیرهای قالب مدل رسانه

جای‌نگهدارهای قالب که در `tools.media.models[].args` گسترش می‌یابند:

| متغیر              | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | بدنه کامل پیام ورودی                             |
| `{{RawBody}}`      | بدنه خام (بدون پوشش‌های تاریخچه/فرستنده)         |
| `{{BodyStripped}}` | بدنه با حذف اشاره‌های گروه                       |
| `{{From}}`         | شناسه فرستنده                                    |
| `{{To}}`           | شناسه مقصد                                       |
| `{{MessageSid}}`   | شناسه پیام کانال                                 |
| `{{SessionId}}`    | UUID نشست فعلی                                   |
| `{{IsNewSession}}` | `"true"` هنگام ایجاد نشست جدید                   |
| `{{MediaUrl}}`     | شبه‌URL رسانه ورودی                              |
| `{{MediaPath}}`    | مسیر رسانه محلی                                  |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)                      |
| `{{Transcript}}`   | رونوشت صوتی                                      |
| `{{Prompt}}`       | اعلان رسانه حل‌شده برای ورودی‌های CLI            |
| `{{MaxChars}}`     | بیشینه نویسه‌های خروجی حل‌شده برای ورودی‌های CLI |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (در حد بهترین تلاش)                   |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد بهترین تلاش)         |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد بهترین تلاش)           |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد بهترین تلاش)           |
| `{{Provider}}`     | راهنمای ارائه‌دهنده (whatsapp، telegram، discord و غیره) |

---

## شامل‌های پیکربندی (`$include`)

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
- آرایه فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شود (موارد بعدی موارد قبلی را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از شامل‌ها ادغام می‌شوند (مقادیر شامل‌شده را بازنویسی می‌کنند).
- شامل‌های تودرتو: تا عمق ۱۰ سطح.
- مسیرها: نسبت به فایل شامل‌کننده حل می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا (`dirname` از `openclaw.json`) باقی بمانند. شکل‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل همان مرز حل شوند. مسیرها نباید شامل بایت null باشند و باید پیش و پس از حل‌شدن، اکیدا کوتاه‌تر از ۴۰۹۶ نویسه باشند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالای پشتیبانی‌شده توسط یک شامل تک‌فایلی را تغییر می‌دهند، مستقیما در همان فایل شامل‌شده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- شامل‌های ریشه، آرایه‌های شامل، و شامل‌هایی با بازنویسی‌های هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط خواندنی هستند؛ آن نوشتن‌ها به‌جای تخت‌کردن پیکربندی، به‌صورت بسته شکست می‌خورند.
- خطاها: پیام‌های روشن برای فایل‌های مفقود، خطاهای تجزیه، شامل‌های چرخه‌ای، قالب مسیر نامعتبر، و طول بیش از حد.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

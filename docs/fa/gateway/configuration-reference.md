---
read_when:
    - به معناشناسی دقیق پیکربندی در سطح فیلد یا پیش‌فرض‌ها نیاز دارید
    - در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای اصلی OpenClaw، مقادیر پیش‌فرض، و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-06-27T17:40:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb8ebf55fe7562f00dbd42eb5fd00a7bac95ac934bdb0b778d04bb6926f28102
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی زیرسامانه‌ای مرجع عمیق‌تری برای خودش دارد، به آن پیوند می‌دهد. کاتالوگ‌های فرمان متعلق به کانال و Plugin و تنظیمات عمیق حافظه/QMD به‌جای این صفحه، در صفحه‌های خودشان قرار دارند.

حقیقت کد:

- `openclaw config schema` طرح‌واره JSON زنده‌ای را که برای اعتبارسنجی و Control UI استفاده می‌شود چاپ می‌کند، و در صورت دسترس بودن، فراداده‌های همراه/Plugin/کانال را در آن ادغام می‌کند
- `config.schema.lookup` یک گره طرح‌واره محدود به مسیر را برای ابزارهای واکاوی برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش مبنای مستندات پیکربندی را در برابر سطح فعلی طرح‌واره اعتبارسنجی می‌کنند

مسیر جست‌وجوی عامل: پیش از ویرایش، از کنش ابزار `gateway` یعنی `config.schema.lookup` برای
مستندات و محدودیت‌های دقیق در سطح فیلد استفاده کنید. برای راهنمایی وظیفه‌محور از
[پیکربندی](/fa/gateway/configuration) و برای نقشه گسترده‌تر فیلدها، مقدارهای پیش‌فرض، و پیوندها به مراجع زیرسامانه‌ها از این صفحه
استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations`، و پیکربندی dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [فرمان‌های اسلش](/fa/tools/slash-commands) برای کاتالوگ فعلی فرمان‌های داخلی + همراه
- صفحه‌های کانال/Plugin مالک برای سطوح فرمان ویژه کانال

قالب پیکربندی **JSON5** است (کامنت و ویرگول پایانی مجاز است). همه فیلدها اختیاری هستند - وقتی حذف شوند، OpenClaw از مقدارهای پیش‌فرض ایمن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند - برای `channels.*`،
از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و کانال‌های همراه دیگر
(احراز هویت، کنترل دسترسی، چندحسابی، کنترل منشن)،
[پیکربندی - کانال‌ها](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های عامل، چندعاملی، نشست‌ها، و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است - ببینید
[پیکربندی - عامل‌ها](/fa/gateway/config-agents) برای:

- `agents.defaults.*` (فضای کاری، مدل، تفکر، heartbeat، حافظه، رسانه، skills، sandbox)
- `multiAgent.*` (مسیریابی و اتصال‌های چندعاملی)
- `session.*` (چرخه عمر نشست، Compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر Markdown)
- `talk.*` (حالت Talk)
  - `talk.consultThinkingLevel`: بازنویسی سطح تفکر برای اجرای کامل عامل OpenClaw پشت مشاوره‌های بلادرنگ Control UI Talk
  - `talk.consultFastMode`: بازنویسی یک‌باره حالت سریع برای مشاوره‌های بلادرنگ Control UI Talk
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk در iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال رونوشت، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback رله Gateway برای رونوشت‌های Talk بلادرنگ نهایی‌شده‌ای که `openclaw_agent_consult` را رد می‌کنند

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، سوییچ‌های آزمایشی، پیکربندی ابزار متکی به ارائه‌دهنده، و تنظیمات
ارائه‌دهنده سفارشی / base-URL به صفحه‌ای اختصاصی منتقل شده‌اند - ببینید
[پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools).

## مدل‌ها

تعریف‌های ارائه‌دهنده، allowlistهای مدل، و تنظیمات ارائه‌دهنده سفارشی در
[پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند.
ریشه `models` همچنین رفتار سراسری کاتالوگ مدل را مالک است.

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
- `models.providers.*.localService`: مدیر فرایند اختیاری بر اساس تقاضا برای
  سرورهای مدل محلی. OpenClaw نقطه پایانی سلامت پیکربندی‌شده را probe می‌کند، در صورت نیاز
  `command` مطلق را اجرا می‌کند، منتظر آمادگی می‌ماند، سپس درخواست مدل را
  ارسال می‌کند. [سرویس‌های مدل محلی](/fa/gateway/local-model-services) را ببینید.
- `models.pricing.enabled`: bootstrap قیمت‌گذاری پس‌زمینه را کنترل می‌کند که
  پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد،
  Gateway دریافت‌های کاتالوگ قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقدارهای پیکربندی‌شده
  `models.providers.*.models[].cost` همچنان برای برآوردهای هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط
OpenClaw توکار و آداپتورهای runtime دیگر مصرف می‌شوند. فرمان‌های `openclaw mcp list`،
`show`، `set`، و `unset` این بلوک را بدون اتصال به
سرور هدف هنگام ویرایش پیکربندی مدیریت می‌کنند.

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
  ابزارهای MCP پیکربندی‌شده را ارائه می‌کنند.
  ورودی‌های remote از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛
  `type: "http"` یک alias بومی CLI است که `openclaw mcp set` و
  `openclaw doctor --fix` آن را به فیلد canonical `transport` نرمال‌سازی می‌کنند.
- `mcp.servers.<name>.enabled`: روی `false` تنظیم کنید تا تعریف ذخیره‌شده سرور
  نگه داشته شود ولی از کشف MCP توکار OpenClaw و projection ابزار کنار گذاشته شود.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout درخواست MCP برای هر سرور
  بر حسب ثانیه یا میلی‌ثانیه.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout اتصال برای هر سرور
  بر حسب ثانیه یا میلی‌ثانیه.
- `mcp.servers.<name>.supportsParallelToolCalls`: راهنمای اختیاری هم‌زمانی برای
  آداپتورهایی که می‌توانند انتخاب کنند آیا فراخوانی‌های ابزار MCP موازی صادر شوند یا نه.
- `mcp.servers.<name>.auth`: برای سرورهای HTTP MCP که به
  OAuth نیاز دارند، روی `"oauth"` تنظیم کنید. برای ذخیره توکن‌ها زیر وضعیت OpenClaw، `openclaw mcp login <name>` را اجرا کنید.
- `mcp.servers.<name>.oauth`: بازنویسی‌های اختیاری scope، نشانی redirect، و نشانی فراداده client
  برای OAuth.
- `mcp.servers.<name>.sslVerify`، `clientCert`، `clientKey`: کنترل‌های HTTP TLS
  برای endpointهای خصوصی و TLS متقابل.
- `mcp.servers.<name>.toolFilter`: انتخاب اختیاری ابزار برای هر سرور. `include`
  ابزارهای MCP کشف‌شده را به نام‌های منطبق محدود می‌کند؛ `exclude` نام‌های منطبق را پنهان
  می‌کند. ورودی‌ها نام دقیق ابزار MCP یا globهای ساده `*` هستند. سرورهایی که
  resources یا prompts دارند، نام‌های ابزار کمکی نیز تولید می‌کنند (`resources_list`،
  `resources_read`، `prompts_list`، `prompts_get`)، و آن نام‌ها از همان
  فیلتر استفاده می‌کنند.
- `mcp.servers.<name>.codex`: کنترل‌های اختیاری projection سرور برنامه Codex.
  این بلوک فقط برای threadهای سرور برنامه Codex، فراداده OpenClaw است؛ روی
  نشست‌های ACP، پیکربندی عمومی harness Codex، یا آداپتورهای runtime دیگر اثر نمی‌گذارد.
  `codex.agents` غیرخالی سرور را به شناسه‌های عامل OpenClaw فهرست‌شده محدود می‌کند.
  فهرست‌های عامل scoped خالی، سفید، یا نامعتبر توسط اعتبارسنجی پیکربندی رد می‌شوند
  و مسیر projection runtime آن‌ها را حذف می‌کند، نه اینکه سراسری شوند.
  `codex.defaultToolsApprovalMode` مقدار بومی Codex یعنی
  `default_tools_approval_mode` را برای آن سرور منتشر می‌کند. OpenClaw بلوک `codex`
  را پیش از پاس دادن پیکربندی بومی `mcp_servers` به Codex حذف می‌کند. برای
  نگه داشتن projection سرور برای هر عامل سرور برنامه Codex با رفتار پیش‌فرض
  تأیید MCP در Codex، این بلوک را حذف کنید.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای runtimeهای MCP همراه محدود به نشست.
  اجراهای توکار یک‌باره پاک‌سازی پایان اجرا را درخواست می‌کنند؛ این TTL پشتوانه‌ای برای
  نشست‌های بلندمدت و callerهای آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP نشست cacheشده به‌صورت گرم اعمال می‌شوند.
  کشف/استفاده بعدی ابزار آن‌ها را از پیکربندی جدید بازمی‌سازد، پس ورودی‌های حذف‌شده
  `mcp.servers` بلافاصله به‌جای انتظار برای TTL بیکاری پاک می‌شوند.
- کشف runtime همچنین اعلان‌های تغییر فهرست ابزار MCP را با حذف
  کاتالوگ cacheشده برای آن نشست رعایت می‌کند. سرورهایی که resources یا
  prompts را advertise می‌کنند، ابزارهای کمکی برای فهرست/خواندن resources و فهرست/دریافت
  prompts می‌گیرند. شکست‌های تکراری فراخوانی ابزار، سرور متاثر را پیش از
  تلاش برای فراخوانی دیگر، برای مدت کوتاهی pause می‌کنند.

برای رفتار runtime، [MCP](/fa/cli/mcp#openclaw-as-an-mcp-client-registry) و
[بک‌اندهای CLI](/fa/gateway/cli-backends#bundle-mcp-overlays) را ببینید.

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

- `allowBundled`: allowlist اختیاری فقط برای skills همراه (skills مدیریت‌شده/فضای کاری بی‌اثر می‌مانند).
- `load.extraDirs`: ریشه‌های skill اشتراکی اضافی (پایین‌ترین اولویت).
- `load.allowSymlinkTargets`: ریشه‌های هدف واقعی مورد اعتماد که symlinkهای skill می‌توانند
  وقتی link بیرون از ریشه منبع پیکربندی‌شده خودش قرار دارد، به آن‌ها resolve شوند.
- `workshop.allowSymlinkTargetWrites`: به Skill Workshop apply اجازه می‌دهد
  از طریق هدف‌های symlink از پیش مورد اعتماد بنویسد (پیش‌فرض: false).
- `install.preferBrew`: وقتی true باشد، اگر `brew`
  در دسترس باشد، پیش از fallback به انواع installer دیگر، installerهای Homebrew را ترجیح می‌دهد.
- `install.nodeManager`: ترجیح installer node برای specهای `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: به clientهای Gateway مورد اعتماد `operator.admin`
  اجازه می‌دهد بایگانی‌های zip خصوصی را که از طریق `skills.upload.*` staged شده‌اند نصب کنند
  (پیش‌فرض: false). این فقط مسیر uploaded-archive را فعال می‌کند؛ نصب‌های عادی ClawHub
  به آن نیاز ندارند.
- `entries.<skillKey>.enabled: false` یک skill را حتی اگر همراه/نصب‌شده باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بر برای skills که یک env var اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

---

## Plugins

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

- از دایرکتوری‌های بسته یا bundle در زیر `~/.openclaw/extensions` و `<workspace>/.openclaw/extensions`، به‌علاوه فایل‌ها یا دایرکتوری‌های فهرست‌شده در `plugins.load.paths` بارگذاری می‌شود.
- فایل‌های Plugin مستقل را در `plugins.load.paths` قرار دهید؛ ریشه‌های افزونه‌ای که به‌صورت خودکار کشف می‌شوند، فایل‌های سطح بالای `.js`، `.mjs` و `.ts` را نادیده می‌گیرند تا اسکریپت‌های کمکی در آن ریشه‌ها مانع راه‌اندازی نشوند.
- کشف، Pluginهای بومی OpenClaw به‌همراه bundleهای سازگار Codex و bundleهای Claude، از جمله bundleهای چیدمان پیش‌فرض Claude بدون manifest را می‌پذیرد.
- **تغییرات پیکربندی به راه‌اندازی دوباره Gateway نیاز دارند.**
- `allow`: فهرست مجاز اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` اولویت دارد.
- `plugins.entries.<id>.apiKey`: فیلد ساده‌ساز کلید API در سطح Plugin (وقتی توسط Plugin پشتیبانی شود).
- `plugins.entries.<id>.env`: نگاشت متغیرهای محیطی محدود به Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، هسته `before_prompt_build` را مسدود می‌کند و فیلدهای تغییردهنده prompt از `before_agent_start` قدیمی را نادیده می‌گیرد، درحالی‌که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. برای hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط bundleهای پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیرباندل‌شده و مورد اعتماد می‌توانند محتوای خام مکالمه را از hookهای نوع‌دار مانند `llm_input`، `llm_output`، `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `before_agent_finalize` و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌صورت صریح به این Plugin اعتماد کنید تا برای اجرای subagent پس‌زمینه، overrideهای `provider` و `model` در هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: فهرست مجاز اختیاری از هدف‌های canonical `provider/model` برای overrideهای subagent مورد اعتماد. فقط زمانی از `"*"` استفاده کنید که عمداً می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.llm.allowModelOverride`: به‌صورت صریح به این Plugin اعتماد کنید تا برای `api.runtime.llm.complete`، override مدل درخواست کند.
- `plugins.entries.<id>.llm.allowedModels`: فهرست مجاز اختیاری از هدف‌های canonical `provider/model` برای overrideهای تکمیل LLM مربوط به Plugin مورد اعتماد. فقط زمانی از `"*"` استفاده کنید که عمداً می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: به‌صورت صریح به این Plugin اعتماد کنید تا `api.runtime.llm.complete` را در برابر شناسه agent غیرپیش‌فرض اجرا کند.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (در صورت وجود، با schema Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/زمان‌اجرای Plugin کانال زیر `channels.<id>` قرار می‌گیرند و باید با metadata مربوط به `channelConfigs` در manifest Plugin مالک توصیف شوند، نه با یک رجیستری مرکزی گزینه‌های OpenClaw.

### پیکربندی Plugin harness در Codex

Plugin باندل‌شده `codex` مالک تنظیمات harness بومی app-server در Codex زیر
`plugins.entries.codex.config` است. برای سطح کامل پیکربندی، [مرجع harness در Codex](/fa/plugins/codex-harness-reference) و برای مدل زمان‌اجرا، [harness در Codex](/fa/plugins/codex-harness) را ببینید.

`codexPlugins` فقط برای نشست‌هایی اعمال می‌شود که harness بومی Codex را انتخاب می‌کنند.
این گزینه Pluginهای Codex را برای اجراهای provider در OpenClaw، bindingهای مکالمه ACP یا هیچ harness غیر Codex فعال نمی‌کند.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: پشتیبانی بومی Plugin/برنامه را برای harness در Codex فعال می‌کند. پیش‌فرض: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سیاست پیش‌فرض اقدام‌های مخرب برای elicitationهای برنامه Plugin مهاجرت‌داده‌شده.
  از `true` برای پذیرش schemaهای تأیید ایمن Codex بدون prompt کردن، از `false`
  برای رد آن‌ها، از `"auto"` برای مسیریابی تأییدهای الزامی Codex از طریق
  تأییدهای Plugin در OpenClaw، یا از `"always"` برای پرسیدن درباره هر اقدام نوشتنی/مخرب
  Plugin بدون تأیید پایدار استفاده کنید. حالت `"always"` پیش از شروع thread،
  overrideهای تأیید پایدار Codex در سطح هر ابزار را برای برنامه متأثر پاک می‌کند.
  پیش‌فرض: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: وقتی `codexPlugins.enabled` سراسری نیز true باشد، یک ورودی Plugin مهاجرت‌داده‌شده را فعال می‌کند.
  پیش‌فرض: `true` برای ورودی‌های صریح.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هویت پایدار marketplace. V1 فقط `"openai-curated"` را پشتیبانی می‌کند.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هویت پایدار Plugin در Codex از مهاجرت، برای مثال `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override اقدام مخرب در سطح هر Plugin. وقتی حذف شود، مقدار سراسری
  `allow_destructive_actions` استفاده می‌شود. مقدار در سطح هر Plugin همان سیاست‌های
  `true`، `false`، `"auto"` یا `"always"` را می‌پذیرد.

`codexPlugins.enabled` دستور فعال‌سازی سراسری است. ورودی‌های صریح Plugin که توسط مهاجرت نوشته می‌شوند، مجموعه پایدار نصب و واجد شرایط تعمیر هستند.
`plugins["*"]` پشتیبانی نمی‌شود، سوئیچ `install` وجود ندارد، و مقادیر محلی
`marketplacePath` عمداً فیلد پیکربندی نیستند چون مختص host هستند.

بررسی‌های آمادگی `app/list` به‌مدت یک ساعت cache می‌شوند و وقتی کهنه باشند
به‌صورت ناهمگام refresh می‌شوند. پیکربندی برنامه thread در Codex هنگام برقرار شدن نشست harness در Codex محاسبه می‌شود، نه در هر نوبت؛ پس از تغییر پیکربندی Plugin بومی، از `/new`، `/reset` یا راه‌اندازی دوباره Gateway استفاده کنید.

- `plugins.entries.firecrawl.config.webFetch`: تنظیمات provider دریافت وب در Firecrawl.
  - `apiKey`: کلید API اختیاری Firecrawl برای محدودیت‌های بالاتر (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، `tools.web.fetch.firecrawl.apiKey` قدیمی، یا متغیر محیطی `FIRECRAWL_API_KEY` fallback می‌کند.
  - `baseUrl`: URL پایه API در Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای خودمیزبان باید endpointهای خصوصی/داخلی را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی صفحه‌ها را استخراج می‌کند (پیش‌فرض: `true`).
  - `maxAgeMs`: حداکثر عمر cache برحسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: مهلت زمانی درخواست scrape برحسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات X Search در xAI (جست‌وجوی وب Grok).
  - `enabled`: provider جست‌وجوی X را فعال می‌کند.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مثلاً `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات Dreaming حافظه. برای phaseها و آستانه‌ها، [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: سوئیچ اصلی Dreaming (پیش‌فرض `false`).
  - `frequency`: آهنگ cron برای هر sweep کامل Dreaming (به‌صورت پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent مربوط به Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن هدف‌ها، با `allowedModels` همراه کنید. خطاهای در دسترس نبودن مدل یک‌بار با مدل پیش‌فرض نشست retry می‌شوند؛ شکست‌های اعتماد یا فهرست مجاز به‌صورت خاموش fallback نمی‌کنند.
  - سیاست phase و آستانه‌ها جزئیات پیاده‌سازی هستند (کلیدهای پیکربندی قابل مشاهده برای کاربر نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای bundle فعال Claude همچنین می‌توانند پیش‌فرض‌های توکار OpenClaw را از `settings.json` ارائه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات agent پاک‌سازی‌شده اعمال می‌کند، نه به‌عنوان patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه از `"none"` استفاده کنید.
- `plugins.slots.contextEngine`: شناسه Plugin موتور context فعال را انتخاب کنید؛ مگر اینکه موتور دیگری نصب و انتخاب کنید، پیش‌فرض `"legacy"` است.

[Pluginها](/fa/tools/plugin) را ببینید.

---

## تعهدها

`commitments` حافظه پیگیری استنتاج‌شده را کنترل می‌کند: OpenClaw می‌تواند check-inها را از نوبت‌های مکالمه تشخیص دهد و آن‌ها را از طریق اجراهای Heartbeat تحویل دهد.

- `commitments.enabled`: استخراج پنهان LLM، ذخیره‌سازی و تحویل Heartbeat را برای تعهدهای پیگیری استنتاج‌شده فعال می‌کند. پیش‌فرض: `false`.
- `commitments.maxPerDay`: حداکثر تعداد تعهدهای پیگیری استنتاج‌شده که در یک روز rolling به ازای هر نشست agent تحویل داده می‌شوند. پیش‌فرض: `3`.

[تعهدهای استنتاج‌شده](/fa/concepts/commitments) را ببینید.

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
- `tabCleanup` تب‌های عامل اصلیِ ردیابی‌شده را پس از زمان بیکاری یا وقتی یک
  نشست از سقف خود فراتر می‌رود، بازپس می‌گیرد. برای غیرفعال کردن این حالت‌های
  پاک‌سازی جداگانه، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد، غیرفعال است؛ بنابراین پیمایش مرورگر به‌طور پیش‌فرض سخت‌گیرانه می‌ماند.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را فقط زمانی تنظیم کنید که عمداً به پیمایش مرورگر در شبکه خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقاط پایانی پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترس‌پذیری/کشف، مشمول همان مسدودسازی شبکه خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- پروفایل‌های راه‌دور فقط برای اتصال هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl` مقادیر `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند، از HTTP(S) استفاده کنید؛
  وقتی ارائه‌دهنده شما یک URL مستقیم DevTools WebSocket می‌دهد، از WS(S)
  استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترس‌پذیری CDP راه‌دور و
  `attachOnly` به‌علاوه درخواست‌های باز کردن تب اعمال می‌شوند. پروفایل‌های loopback
  مدیریت‌شده، پیش‌فرض‌های CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP مدیریت‌شده بیرونی از طریق loopback در دسترس است، برای آن
  پروفایل `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw پورت loopback را به‌عنوان یک
  پروفایل مرورگر مدیریت‌شده محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت پورت محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل، متصل شوند.
- پروفایل‌های `existing-session` می‌توانند برای هدف‌گیری یک پروفایل مرورگر خاص
  مبتنی بر Chromium مانند Brave یا Edge، `userDataDir` را تنظیم کنند.
- پروفایل‌های `existing-session` وقتی Chrome از قبل پشت یک نقطه پایانی کشف HTTP(S) مربوط به DevTools
  یا یک نقطه پایانی مستقیم WS(S) اجرا می‌شود، می‌توانند `cdpUrl` را تنظیم کنند. در آن
  حالت، OpenClaw به‌جای استفاده از اتصال خودکار، نقطه پایانی را به Chrome MCP می‌دهد؛
  `userDataDir` برای آرگومان‌های راه‌اندازی Chrome MCP نادیده گرفته می‌شود.
- پروفایل‌های `existing-session` محدودیت‌های مسیر فعلی Chrome MCP را نگه می‌دارند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری CSS-selector، قلاب‌های بارگذاری یک‌فایلی،
  بدون بازنویسی زمان‌پایان گفت‌وگو، بدون `wait --load networkidle`، و بدون
  `responsebody`، خروجی PDF، رهگیری دانلود یا کنش‌های دسته‌ای.
- پروفایل‌های محلی مدیریت‌شده `openclaw`، `cdpPort` و `cdpUrl` را خودکار اختصاص می‌دهند؛
  `cdpUrl` را فقط برای پروفایل‌های CDP راه‌دور یا اتصال نقطه پایانی existing-session
  به‌صورت صریح تنظیم کنید.
- پروفایل‌های محلی مدیریت‌شده می‌توانند برای بازنویسی `browser.executablePath` سراسری
  برای همان پروفایل، `executablePath` را تنظیم کنند. از این برای اجرای یک پروفایل در
  Chrome و پروفایلی دیگر در Brave استفاده کنید.
- پروفایل‌های محلی مدیریت‌شده پس از شروع فرایند، برای کشف HTTP مربوط به Chrome CDP از `browser.localLaunchTimeoutMs`
  و برای آماده بودن websocket CDP پس از راه‌اندازی از `browser.localCdpReadyTimeoutMs` استفاده می‌کنند.
  روی میزبان‌های کندتر که Chrome با موفقیت شروع می‌شود اما بررسی‌های آمادگی با شروع رقابت می‌کنند، آن‌ها را افزایش دهید.
  هر دو مقدار باید عدد صحیح مثبت تا `120000` میلی‌ثانیه باشند؛ مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را پیش از راه‌اندازی Chromium برای دایرکتوری خانگی سیستم‌عامل شما
  می‌پذیرند. `userDataDir` هر پروفایل روی پروفایل‌های `existing-session` نیز بسط tilde می‌شود.
- سرویس کنترل: فقط loopback (پورت مشتق‌شده از `gateway.port`، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های راه‌اندازی اضافی را به شروع محلی Chromium اضافه می‌کند (برای مثال
  `--disable-gpu`، اندازه‌دهی پنجره یا پرچم‌های اشکال‌زدایی).

---

## رابط کاربری

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // ایموجی، متن کوتاه، URL تصویر، یا data URI
    },
  },
}
```

- `seamColor`: رنگ تأکیدی برای chrome رابط کاربری برنامه بومی (رنگ حباب Talk Mode و غیره).
- `assistant`: بازنویسی هویت Control UI. در صورت نبود، به هویت عامل فعال برمی‌گردد.

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
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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

- `mode`: ‏`local` (اجرای Gateway) یا `remote` (اتصال به Gateway راه دور). Gateway شروع نمی‌شود مگر اینکه `local` باشد.
- `port`: پورت واحد چندمنظوره برای WS + HTTP. اولویت: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto`، ‏`loopback` (پیش‌فرض)، ‏`lan` (`0.0.0.0`)، ‏`tailnet` (فقط IP ‏Tailscale)، یا `custom`.
- **نام‌های مستعار bind قدیمی**: در `gateway.bind` از مقادیر حالت bind استفاده کنید (`auto`، ‏`loopback`، ‏`lan`، ‏`tailnet`، ‏`custom`)، نه نام‌های مستعار میزبان (`0.0.0.0`، ‏`127.0.0.1`، ‏`localhost`، ‏`::`، ‏`::1`).
- **نکته Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکه bridge در Docker (`-p 18789:18789`)، ترافیک روی `eth0` وارد می‌شود، بنابراین Gateway در دسترس نیست. از `--network host` استفاده کنید، یا `bind: "lan"` (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) را تنظیم کنید تا روی همه interfaceها گوش دهد.
- **احراز هویت**: به‌طور پیش‌فرض لازم است. bindهای غیر loopback به احراز هویت Gateway نیاز دارند. در عمل یعنی یک توکن/گذرواژه مشترک یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. جادوگر راه‌اندازی به‌طور پیش‌فرض یک توکن تولید می‌کند.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefها)، `gateway.auth.mode` را صراحتا روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، روندهای شروع و نصب/تعمیر سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای راه‌اندازی‌های مورد اعتماد local loopback استفاده کنید؛ این حالت عمدا در promptهای راه‌اندازی ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک reverse proxy آگاه از هویت واگذار می‌کند و به headerهای هویت از `gateway.trustedProxies` اعتماد می‌کند (ببینید [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth)). این حالت به‌طور پیش‌فرض انتظار یک منبع proxy **غیر loopback** دارد؛ reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی روی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان fallback مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، headerهای هویت Tailscale Serve می‌توانند احراز هویت رابط کاربری کنترل/WebSocket را برآورده کنند (از طریق `tailscale whois` راستی‌آزمایی می‌شود). نقاط پایانی HTTP API از آن احراز هویت header مربوط به Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت عادی احراز هویت HTTP Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway مورد اعتماد است. وقتی `tailscale.mode = "serve"` باشد، پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکننده اختیاری احراز هویت ناموفق. به ازای هر IP کلاینت و هر دامنه احراز هویت اعمال می‌شود (shared-secret و device-token مستقل ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر async رابط کاربری کنترل Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست، سریالی می‌شوند. بنابراین تلاش‌های بد همزمان از همان کلاینت می‌توانند در درخواست دوم محدودکننده را فعال کنند، به‌جای اینکه هر دو صرفا به‌صورت عدم تطابق ساده از رقابت عبور کنند.
  - `gateway.auth.rateLimit.exemptLoopback` به‌طور پیش‌فرض `true` است؛ وقتی عمدا می‌خواهید ترافیک localhost نیز rate-limit شود (برای راه‌اندازی‌های تست یا استقرارهای proxy سخت‌گیرانه)، آن را روی `false` تنظیم کنید.
- تلاش‌های احراز هویت WS با origin مرورگر همیشه با معافیت loopback غیرفعال throttle می‌شوند (دفاع چندلایه در برابر brute force مرورگرمحور روی localhost).
- روی loopback، آن lockoutهای با origin مرورگر به ازای مقدار نرمال‌شده `Origin`
  جدا هستند، بنابراین شکست‌های تکراری از یک origin روی localhost به‌طور خودکار
  origin متفاوتی را قفل نمی‌کند.
- `tailscale.mode`: ‏`serve` (فقط tailnet، bind روی loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `tailscale.serviceName`: نام اختیاری Tailscale Service برای حالت Serve، مانند
  `svc:openclaw`. وقتی تنظیم شود، OpenClaw آن را به `tailscale serve
--service` می‌دهد تا رابط کاربری کنترل به‌جای hostname دستگاه، از طریق یک Service نام‌گذاری‌شده در دسترس قرار گیرد. مقدار باید از قالب نام Service در Tailscale یعنی `svc:<dns-label>`
  استفاده کند؛ هنگام شروع، URL مشتق‌شده Service گزارش می‌شود.
- `tailscale.preserveFunnel`: وقتی `true` باشد و `tailscale.mode = "serve"`، OpenClaw
  پیش از اعمال دوباره Serve در زمان شروع، `tailscale funnel status` را بررسی می‌کند و اگر یک مسیر Funnel که بیرون از سیستم پیکربندی شده از قبل پورت Gateway را پوشش دهد،
  آن را رد می‌کند. پیش‌فرض `false`.
- `controlUi.allowedOrigins`: allowlist صریح origin مرورگر برای اتصال‌های WebSocket به Gateway. برای originهای مرورگر عمومی غیر loopback لازم است. بارگذاری‌های خصوصی same-origin رابط کاربری LAN/Tailnet از loopback، ‏RFC1918/link-local، ‏`.local`، ‏`.ts.net`، یا میزبان‌های Tailscale CGNAT بدون فعال‌کردن fallback مربوط به Host-header پذیرفته می‌شوند.
- `controlUi.chatMessageMaxWidth`: حداکثر عرض اختیاری برای پیام‌های گفت‌وگوی گروه‌بندی‌شده در رابط کاربری کنترل. مقادیر محدودشده عرض CSS مانند `960px`، ‏`82%`، ‏`min(1280px, 82%)`، و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناک که fallback origin مبتنی بر Host-header را برای استقرارهایی فعال می‌کند که عمدا به سیاست origin مبتنی بر Host-header تکیه دارند.
- `remote.transport`: ‏`ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، ‏`remote.url` برای میزبان‌های عمومی باید `wss://` باشد؛ متن ساده `ws://` فقط برای loopback، ‏LAN، ‏link-local، ‏`.local`، ‏`.ts.net`، و میزبان‌های Tailscale CGNAT پذیرفته می‌شود.
- `remote.remotePort`: پورت Gateway روی میزبان SSH راه دور. پیش‌فرض `18789` است؛ وقتی پورت tunnel محلی با پورت Gateway راه دور متفاوت است از این استفاده کنید.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامه کلاینت راه دور هستند. آن‌ها به‌تنهایی احراز هویت Gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: URL پایه HTTPS برای relay خارجی APNs که پس از انتشار registrationها توسط buildهای iOS مبتنی بر relay به Gateway استفاده می‌شود. buildهای عمومی App Store/TestFlight از relay میزبانی‌شده OpenClaw استفاده می‌کنند. URLهای relay سفارشی باید با یک مسیر build/deployment عمدا جداگانه iOS مطابقت داشته باشند که URL relay آن به همان relay اشاره می‌کند.
- `gateway.push.apns.relay.timeoutMs`: مهلت ارسال از Gateway به relay بر حسب میلی‌ثانیه. پیش‌فرض `10000`.
- registrationهای مبتنی بر relay به یک هویت Gateway مشخص واگذار می‌شوند. اپ iOS جفت‌شده `gateway.identity.get` را می‌گیرد، آن هویت را در registration relay وارد می‌کند، و یک مجوز ارسال محدود به registration را به Gateway ارسال می‌کند. Gateway دیگری نمی‌تواند آن registration ذخیره‌شده را دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: دریچه فرار فقط مخصوص توسعه برای URLهای HTTP relay روی loopback. URLهای relay production باید روی HTTPS باقی بمانند.
- `gateway.handshakeTimeoutMs`: مهلت handshake پیش از احراز هویت WebSocket Gateway بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد اولویت دارد. این مقدار را روی میزبان‌های پر بار یا کم‌قدرت افزایش دهید، جایی که کلاینت‌های محلی می‌توانند در حالی متصل شوند که warmup شروع هنوز در حال پایدار شدن است.
- `gateway.channelHealthCheckMinutes`: فاصله monitor سلامت channel بر حسب دقیقه. برای غیرفعال‌کردن restartهای health-monitor در سطح سراسری، `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانه stale-socket بر حسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: حداکثر restartهای health-monitor به ازای هر channel/account در یک ساعت rolling. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out به ازای هر channel برای restartهای health-monitor در حالی که monitor سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override به ازای هر account برای channelهای چند account. وقتی تنظیم شود، بر override سطح channel اولویت دارد.
- مسیرهای فراخوان Gateway محلی فقط وقتی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolution به‌صورت fail-closed شکست می‌خورد (بدون پوشاندن با fallback راه دور).
- `trustedProxies`: IPهای reverse proxy که TLS را terminate می‌کنند یا headerهای forwarded-client را تزریق می‌کنند. فقط proxyهایی را فهرست کنید که کنترل می‌کنید. entryهای loopback همچنان برای راه‌اندازی‌های proxy/local-detection روی همان میزبان معتبرند (برای مثال Tailscale Serve یا یک reverse proxy محلی)، اما درخواست‌های loopback را واجد شرایط `gateway.auth.mode: "trusted-proxy"` نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` وجود نداشته باشد، Gateway ‏`X-Real-IP` را می‌پذیرد. پیش‌فرض `false` برای رفتار fail-closed است.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای تایید خودکار pairing اولیه device node بدون scopeهای درخواستی. وقتی تنظیم نشده باشد غیرفعال است. این مورد pairing مربوط به operator/browser/رابط کاربری کنترل/WebChat را خودکار تایید نمی‌کند، و role، ‏scope، ‏metadata، یا ارتقاهای public-key را نیز خودکار تایید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی allow/deny سراسری برای commandهای node اعلام‌شده پس از pairing و ارزیابی allowlist پلتفرم. از `allowCommands` برای opt in به commandهای خطرناک node مانند `camera.snap`، ‏`camera.clip`، و `screen.record` استفاده کنید؛ `denyCommands` یک command را حذف می‌کند حتی اگر پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل می‌شد. پس از اینکه node فهرست commandهای اعلام‌شده خود را تغییر داد، pairing آن device را رد و دوباره تایید کنید تا Gateway snapshot به‌روزشده command را ذخیره کند.
- `gateway.tools.deny`: نام‌های tool اضافی که برای HTTP `POST /tools/invoke` مسدود می‌شوند (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام‌های tool را برای
  فراخوان‌های owner/admin از فهرست deny پیش‌فرض HTTP حذف می‌کند. این مورد فراخوان‌های دارای هویت `operator.write`
  را به دسترسی owner/admin ارتقا نمی‌دهد؛ `cron`، ‏`gateway`، و `nodes` حتی وقتی allowlist شده باشند،
  همچنان برای فراخوان‌های غیر owner در دسترس نیستند.

</Accordion>

### نقاط پایانی سازگار با OpenAI

- HTTP RPC ادمین: به‌طور پیش‌فرض به‌عنوان Plugin ‏`admin-http-rpc` خاموش است. Plugin را فعال کنید تا `POST /api/v1/admin/rpc` ثبت شود. ببینید [HTTP RPC ادمین](/fa/plugins/admin-http-rpc).
- Chat Completions: به‌طور پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL برای Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی به‌عنوان تنظیم‌نشده در نظر گرفته می‌شوند؛ برای غیرفعال‌کردن دریافت URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- header اختیاری سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای originهای HTTPS که کنترل می‌کنید تنظیم کنید؛ ببینید [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### جداسازی چند instance

چند Gateway را روی یک میزبان با پورت‌ها و state dirهای یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

flagهای راحتی: `--dev` (از `~/.openclaw-dev` + پورت `19001` استفاده می‌کند)، ‏`--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

ببینید [چند Gateway](/fa/gateway/multiple-gateways).

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

- `enabled`: termination مربوط به TLS را در listener مربوط به Gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده باشند، یک جفت cert/key خودامضاشده محلی به‌صورت خودکار تولید می‌کند؛ فقط برای استفاده محلی/dev.
- `certPath`: مسیر filesystem به فایل گواهی TLS.
- `keyPath`: مسیر filesystem به فایل کلید خصوصی TLS؛ دسترسی آن را محدود نگه دارید.
- `caPath`: مسیر اختیاری bundle مربوط به CA برای راستی‌آزمایی کلاینت یا زنجیره‌های اعتماد سفارشی.

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
  - `"off"`: ویرایش‌های زنده را نادیده بگیر؛ تغییرات به راه‌اندازی مجدد صریح نیاز دارند.
  - `"restart"`: هنگام تغییر پیکربندی، همیشه فرایند Gateway را دوباره راه‌اندازی کن.
  - `"hot"`: تغییرات را بدون راه‌اندازی مجدد، درون همان فرایند اعمال کن.
  - `"hybrid"` (پیش‌فرض): ابتدا بارگذاری مجدد داغ را امتحان کن؛ در صورت نیاز به راه‌اندازی مجدد برگرد.
- `debounceMs`: بازهٔ debounce بر حسب میلی‌ثانیه پیش از اعمال تغییرات پیکربندی (عدد صحیح نامنفی).
- `deferralTimeoutMs`: حداکثر زمان اختیاری بر حسب میلی‌ثانیه برای انتظار جهت عملیات‌های در حال انجام، پیش از اجبار به راه‌اندازی مجدد یا بارگذاری مجدد داغ کانال. آن را حذف کنید تا از انتظار محدود پیش‌فرض (`300000`) استفاده شود؛ آن را روی `0` بگذارید تا به‌صورت نامحدود منتظر بماند و هشدارهای دوره‌ایِ هنوز-درانتظار را ثبت کند.

---

## هوک‌ها

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
توکن‌های هوک در رشتهٔ پرس‌وجو رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به یک `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید با احراز هویت shared-secret فعال Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) متفاوت باشد؛ راه‌اندازی اولیه وقتی استفادهٔ مجدد را تشخیص دهد، یک هشدار امنیتی غیرکشنده ثبت می‌کند.
- `openclaw security audit` استفادهٔ مجدد از احراز هویت هوک/Gateway را به‌عنوان یافته‌ای بحرانی علامت‌گذاری می‌کند، از جمله احراز هویت رمز عبور Gateway که فقط در زمان ممیزی ارائه شده باشد (`--auth password --password <password>`). `openclaw doctor --fix` را اجرا کنید تا `hooks.token` استفاده‌شدهٔ مجدد و پایدارشده بچرخد، سپس ارسال‌کنندگان هوک خارجی را به‌روزرسانی کنید تا از توکن هوک جدید استفاده کنند.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیرمسیر اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا پیش‌تنظیم از `sessionKey` قالب‌دار استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این اعلام رضایت نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از محتوای درخواست فقط وقتی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقدارهای `sessionKey` نگاشت که با قالب رندر شده‌اند، به‌عنوان مقدارهای ارائه‌شده از بیرون تلقی می‌شوند و آن‌ها نیز به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="جزئیات نگاشت">

- `match.path` با زیرمسیر پس از `/hooks` مطابقت دارد (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` با یک فیلد payload برای مسیرهای عمومی مطابقت دارد.
- قالب‌هایی مانند `{{messages[0].subject}}` از payload خوانده می‌شوند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش هوک برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و داخل `hooks.transformsDir` بماند (مسیرهای مطلق و traversal رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های Skills فضای کاری رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transforms هوک‌ها منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک عامل مشخص مسیریابی می‌کند؛ شناسه‌های ناشناخته به عامل پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: مسیریابی عامل مؤثر را محدود می‌کند، از جمله مسیر عامل پیش‌فرض وقتی `agentId` حذف شده باشد (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید نشست ثابت اختیاری برای اجراهای عامل هوک بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای نشست نگاشتِ مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: فهرست مجاز پیشوند اختیاری برای مقدارهای `sessionKey` صریح (درخواست + نگاشت)، مثلاً `["hook:"]`. وقتی هر نگاشت یا پیش‌تنظیم از `sessionKey` قالب‌دار استفاده کند، الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ `channel` به‌طور پیش‌فرض `last` است.
- `model` مدل LLM را برای این اجرای هوک بازنویسی می‌کند (اگر کاتالوگ مدل تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- پیش‌تنظیم داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر آن مسیریابی برای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را محدود کنید تا با فضای نام Gmail مطابقت داشته باشد، برای مثال `["hook:", "hook:gmail:"]`.
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

- Gateway هنگام راه‌اندازی، وقتی پیکربندی شده باشد، `gog gmail watch serve` را به‌صورت خودکار شروع می‌کند. برای غیرفعال کردن، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
- یک `gog gmail watch serve` جداگانه را در کنار Gateway اجرا نکنید.

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

- HTML/CSS/JS قابل ویرایش توسط عامل و A2UI را از طریق HTTP زیر پورت Gateway ارائه می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` (پیش‌فرض) را نگه دارید.
- اتصال‌های غیر-loopback: مسیرهای بوم به احراز هویت Gateway نیاز دارند (توکن/رمز عبور/پراکسی معتمد)، مانند سایر سطوح HTTP Gateway.
- WebViewهای Node معمولاً سرآیندهای احراز هویت را نمی‌فرستند؛ پس از جفت و متصل شدن یک گره، Gateway برای دسترسی بوم/A2UI، URLهای قابلیتِ scoped به گره را تبلیغ می‌کند.
- URLهای قابلیت به نشست WS گره فعال متصل‌اند و سریع منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت live-reload را به HTML ارائه‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را به‌صورت خودکار ایجاد می‌کند.
- همچنین A2UI را در `/__openclaw__/a2ui/` ارائه می‌کند.
- تغییرات به راه‌اندازی مجدد Gateway نیاز دارند.
- live reload را برای دایرکتوری‌های بزرگ یا خطاهای `EMFILE` غیرفعال کنید.

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

- `minimal` (پیش‌فرض وقتی Plugin همراه `bonjour` فعال باشد): `cliPath` + `sshPort` را از رکوردهای TXT حذف کن.
- `full`: شامل `cliPath` + `sshPort`؛ تبلیغ چندپخشی LAN همچنان مستلزم فعال بودن Plugin همراه `bonjour` است.
- `off`: تبلیغ چندپخشی LAN را بدون تغییر فعال‌سازی Plugin سرکوب کن.
- Plugin همراه `bonjour` به‌صورت خودکار روی میزبان‌های macOS شروع می‌شود و در Linux، Windows و استقرارهای Gateway کانتینری opt-in است.
- نام میزبان وقتی یک برچسب DNS معتبر باشد، به‌طور پیش‌فرض نام میزبان سیستم است و در غیر این صورت به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` بازنویسی کنید.

### گسترهٔ وسیع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک ناحیه DNS-SD تک‌پخشی را زیر `~/.openclaw/dns/` می‌نویسد. برای کشف بین‌شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + Tailscale split DNS همراه کنید.

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
- `shellEnv`: کلیدهای مورد انتظارِ موجودنبودنی را از پروفایل shell ورود شما وارد می‌کند.
- برای ترتیب تقدم کامل، [محیط](/fa/help/environment) را ببینید.

### جایگزینی متغیر env

در هر رشته پیکربندی با `${VAR_NAME}` به متغیرهای env ارجاع دهید:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- فقط نام‌های با حروف بزرگ مطابق می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای موجودنبودنی/خالی هنگام بارگذاری پیکربندی خطا ایجاد می‌کنند.
- برای یک `${VAR}` لفظی، با `$${VAR}` escape کنید.
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
- الگوی id برای `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (گزینشگرهای سبک AWS مانند `secret#json_key` را پشتیبانی می‌کند)
- idهای `source: "exec"` نباید شامل بخش‌های مسیر جداشده با slash به شکل `.` یا `..` باشند (برای مثال `a/../b` رد می‌شود)

### سطح اعتبارنامه پشتیبانی‌شده

- ماتریس مرجع: [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای اعتبارنامه پشتیبانی‌شده `openclaw.json` را هدف می‌گیرد.
- ارجاع‌های `auth-profiles.json` در پوشش حل‌وفصل زمان اجرا و audit گنجانده شده‌اند.

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
- مسیرهای ارائه‌دهنده file و exec وقتی تأیید Windows ACL در دسترس نباشد fail closed می‌شوند. `allowInsecurePath: true` را فقط برای مسیرهای مورد اعتمادی تنظیم کنید که قابل تأیید نیستند.
- ارائه‌دهنده `exec` به مسیر مطلق `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌طور پیش‌فرض، مسیرهای فرمان symlink رد می‌شوند. برای اجازه‌دادن به مسیرهای symlink هم‌زمان با اعتبارسنجی مسیر هدف resolveشده، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی trusted-dir روی مسیر هدف resolveشده اعمال می‌شود.
- محیط فرزند `exec` به‌طور پیش‌فرض حداقلی است؛ متغیرهای لازم را با `passEnv` صریحاً عبور دهید.
- ارجاع‌های secret در زمان فعال‌سازی در یک snapshot درون‌حافظه‌ای resolve می‌شوند، سپس مسیرهای درخواست فقط همان snapshot را می‌خوانند.
- فیلترکردن سطح فعال هنگام فعال‌سازی اعمال می‌شود: ارجاع‌های resolveنشده روی سطح‌های فعال باعث شکست startup/reload می‌شوند، درحالی‌که سطح‌های غیرفعال با diagnostics نادیده گرفته می‌شوند.

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
- `auth-profiles.json` برای حالت‌های اعتبارنامهٔ ایستا از ارجاع‌های سطح مقدار پشتیبانی می‌کند (`keyRef` برای `api_key`، و `tokenRef` برای `token`).
- نگاشت‌های تخت قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را با پشتیبان `.legacy-flat.*.bak` به پروفایل‌های کلید API استاندارد `provider:default` بازنویسی می‌کند.
- پروفایل‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های پروفایل احراز هویت مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های ایستای زمان اجرا از اسنپ‌شات‌های حل‌شدهٔ درون‌حافظه‌ای می‌آیند؛ ورودی‌های قدیمی ایستای `auth.json` هنگام کشف پاک‌سازی می‌شوند.
- واردسازی‌های OAuth قدیمی از `~/.openclaw/credentials/oauth.json` انجام می‌شوند.
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

- `billingBackoffHours`: بازایست پایه بر حسب ساعت وقتی یک پروفایل به‌دلیل خطاهای واقعی
  صورتحساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح صورتحساب می‌تواند
  حتی در پاسخ‌های `401`/`403` هم همچنان اینجا قرار بگیرد، اما تطبیق‌دهنده‌های متن
  مختص ارائه‌دهنده فقط در محدودهٔ همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای نمونه
  `Key limit exceeded` در OpenRouter). پیام‌های قابل تلاش مجدد HTTP `402` مربوط به پنجرهٔ مصرف یا
  سقف هزینهٔ سازمان/فضای کاری، به‌جای آن در مسیر `rate_limit`
  می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری به‌ازای هر ارائه‌دهنده برای ساعت‌های بازایست صورتحساب.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی بازایست صورتحساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: بازایست پایه بر حسب دقیقه برای شکست‌های با اطمینان بالا از نوع `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد بازایست `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجرهٔ لغزان بر حسب ساعت که برای شمارنده‌های بازایست استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت برای همان ارائه‌دهنده در خطاهای بار بیش از حد، پیش از جابه‌جایی به fallback مدل (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` اینجا قرار می‌گیرند.
- `overloadedBackoffMs`: تأخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/پروفایلِ دچار بار بیش از حد (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت برای همان ارائه‌دهنده در خطاهای محدودیت نرخ، پیش از جابه‌جایی به fallback مدل (پیش‌فرض: `1`). آن سطل محدودیت نرخ شامل متن‌های شکل‌داده‌شده توسط ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، و `resource exhausted` است.

---

## ثبت وقایع

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

- فایل ثبت وقایع پیش‌فرض: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- برای یک مسیر پایدار، `logging.file` را تنظیم کنید.
- هنگام استفاده از `--verbose`، مقدار `consoleLevel` به `debug` افزایش می‌یابد.
- `maxFileBytes`: حداکثر اندازهٔ فایل ثبت وقایع فعال بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 مگابایت). OpenClaw تا پنج آرشیو شماره‌دار را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن به‌صورت بهترین تلاش برای خروجی کنسول، فایل‌های ثبت وقایع، رکوردهای ثبت وقایع OTLP، و متن رونوشت نشستِ پایدارشده. `redactSensitive: "off"` فقط این سیاست عمومی ثبت وقایع/رونوشت را غیرفعال می‌کند؛ سطح‌های ایمنی UI/ابزار/عیب‌یابی همچنان پیش از انتشار، اسرار را ویرایش می‌کنند.

---

## عیب‌یابی

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

- `enabled`: کلید اصلی برای خروجی ابزارگذاری (پیش‌فرض: `true`).
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی ثبت وقایع هدفمند را فعال می‌کنند (از wildcardهایی مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانهٔ سن بدون پیشرفت بر حسب میلی‌ثانیه برای دسته‌بندی نشست‌های پردازش طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled`، یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک، و پیشرفت ACP تایمر را بازنشانی می‌کنند؛ عیب‌یابی‌های تکراری `session.stuck` تا وقتی تغییری رخ نداده باشد بازایست می‌کنند.
- `stuckSessionAbortMs`: آستانهٔ سن بدون پیشرفت بر حسب میلی‌ثانیه پیش از آنکه کار فعال متوقف‌شدهٔ واجد شرایط بتواند برای بازیابی تخلیه و لغو شود. وقتی تنظیم نشده باشد، OpenClaw از پنجرهٔ ایمن‌تر اجرای تعبیه‌شدهٔ طولانی، حداقل ۵ دقیقه و ۳ برابر `stuckSessionWarnMs`، استفاده می‌کند.
- `memoryPressureSnapshot`: وقتی فشار حافظه به `critical` می‌رسد، یک اسنپ‌شات پایداری ویرایش‌شدهٔ پیش از OOM ثبت می‌کند (پیش‌فرض: `false`). آن را روی `true` تنظیم کنید تا اسکن/نوشتن فایل بستهٔ پایداری اضافه شود، در حالی که رویدادهای عادی فشار حافظه حفظ می‌شوند.
- `otel.enabled`: خط لولهٔ برون‌بری OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، فهرست سیگنال‌ها، و مدل حریم خصوصی، [برون‌بری OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: URL گردآورنده برای برون‌بری OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقطه‌های پایانی اختیاری OTLP مختص سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فرادادهٔ HTTP/gRPC اضافی که همراه درخواست‌های برون‌بری OTel فرستاده می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: برون‌بری ردگیری، سنجه‌ها، یا ثبت وقایع را فعال می‌کنند.
- `otel.logsExporter`: مقصد برون‌بری ثبت وقایع: `"otlp"` (پیش‌فرض)، `"stdout"` برای یک شیء JSON در هر خط stdout، یا `"both"`.
- `otel.sampleRate`: نرخ نمونه‌برداری ردگیری `0` تا `1`.
- `otel.flushIntervalMs`: بازهٔ تخلیهٔ دوره‌ای دورسنجی بر حسب میلی‌ثانیه.
- `otel.captureContent`: ثبت محتوای خام به‌صورت opt-in برای ویژگی‌های span در OTEL. به‌طور پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را ثبت می‌کند؛ شکل شیء به شما اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs`، `systemPrompt`، و `toolDefinitions` را صریحاً فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای تازه‌ترین شکل آزمایشی span استنتاج GenAI، شامل نام‌های span به‌شکل `{gen_ai.operation.name} {gen_ai.request.model}`، نوع span به‌شکل `CLIENT`، و `gen_ai.provider.name` به‌جای `gen_ai.system` قدیمی. به‌طور پیش‌فرض، spanها برای سازگاری `openclaw.model.call` و `gen_ai.system` را نگه می‌دارند؛ سنجه‌های GenAI از ویژگی‌های معنایی محدود استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از قبل یک SDK سراسری OpenTelemetry ثبت کرده‌اند. در این حالت OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را رد می‌کند، در حالی که شنونده‌های عیب‌یابی فعال می‌مانند.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`، و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطهٔ پایانی مختص سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: اسنپ‌شات‌های ردگیری کش را برای اجراهای تعبیه‌شده ثبت می‌کند (پیش‌فرض: `false`).
- `cacheTrace.filePath`: مسیر خروجی برای JSONL ردگیری کش (پیش‌فرض: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: کنترل می‌کنند چه چیزی در خروجی ردگیری کش گنجانده شود (همه به‌طور پیش‌فرض: `true`).

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

- `channel`: کانال انتشار برای نصب‌های npm/git - `"stable"`، `"beta"`، یا `"dev"`.
- `checkOnStart`: هنگام شروع Gateway، به‌روزرسانی‌های npm را بررسی می‌کند (پیش‌فرض: `true`).
- `auto.enabled`: به‌روزرسانی خودکار پس‌زمینه را برای نصب‌های بسته فعال می‌کند (پیش‌فرض: `false`).
- `auto.stableDelayHours`: حداقل تأخیر بر حسب ساعت پیش از اعمال خودکار کانال پایدار (پیش‌فرض: `6`؛ حداکثر: `168`).
- `auto.stableJitterHours`: پنجرهٔ پراکندگی اضافی rollout کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ حداکثر: `168`).
- `auto.betaCheckIntervalHours`: فاصلهٔ اجرای بررسی‌های کانال بتا بر حسب ساعت (پیش‌فرض: `1`؛ حداکثر: `24`).

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

- `enabled`: دروازهٔ سراسری ویژگی ACP (پیش‌فرض: `true`؛ برای پنهان‌کردن امکانات dispatch و spawn در ACP، آن را روی `false` بگذارید).
- `dispatch.enabled`: دروازهٔ مستقل برای dispatch نوبت نشست ACP (پیش‌فرض: `true`). آن را روی `false` بگذارید تا فرمان‌های ACP در دسترس بمانند، اما اجرا مسدود شود.
- `backend`: شناسهٔ پیش‌فرض backend زمان اجرای ACP (باید با یک Plugin ثبت‌شدهٔ زمان اجرای ACP مطابقت داشته باشد).
  ابتدا Plugin backend را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسهٔ Plugin backend را وارد کنید (برای نمونه `acpx`) وگرنه backend ACP بارگذاری نمی‌شود.
- `defaultAgent`: شناسهٔ عامل مقصد fallback در ACP وقتی spawnها مقصد صریحی تعیین نمی‌کنند.
- `allowedAgents`: فهرست مجاز شناسه‌های عامل که برای نشست‌های زمان اجرای ACP مجازند؛ خالی بودن یعنی هیچ محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: حداکثر نشست‌های ACP فعال هم‌زمان.
- `stream.coalesceIdleMs`: پنجرهٔ تخلیهٔ بیکار بر حسب میلی‌ثانیه برای متن stream‌شده.
- `stream.maxChunkChars`: حداکثر اندازهٔ قطعه پیش از تقسیم projection بلوک stream‌شده.
- `stream.repeatSuppression`: خط‌های وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی stream می‌کند؛ `"final_only"` تا رویدادهای پایانی نوبت buffer می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل مشاهده بعد از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: حداکثر نویسه‌های خروجی دستیار که در هر نوبت ACP projection می‌شوند.
- `stream.maxSessionUpdateChars`: حداکثر نویسه‌ها برای خط‌های وضعیت/به‌روزرسانی ACP که projection می‌شوند.
- `stream.tagVisibility`: رکورد نام‌های tag به بازنویسی‌های بولی visibility برای رویدادهای stream‌شده.
- `runtime.ttlMinutes`: TTL بیکار بر حسب دقیقه برای workerهای نشست ACP پیش از پاک‌سازی واجد شرایط.
- `runtime.installCommand`: فرمان نصب اختیاری که هنگام راه‌اندازی اولیهٔ محیط زمان اجرای ACP اجرا می‌شود.

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
  - `"off"`: بدون متن شعار (عنوان/نسخهٔ بنر همچنان نمایش داده می‌شود).
- برای پنهان کردن کل بنر (نه فقط شعارها)، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## ویزارد

فراداده‌ای که جریان‌های راه‌اندازی هدایت‌شدهٔ CLI (`onboard`، `configure`، `doctor`) می‌نویسند:

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

فیلدهای هویت `agents.list` را در [پیش‌فرض‌های عامل](/fa/gateway/config-agents#agent-defaults) ببینید.

---

## پل (قدیمی، حذف‌شده)

بیلدهای فعلی دیگر شامل پل TCP نیستند. Nodeها از طریق WebSocket مربوط به Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از شمای پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها ناموفق می‌شود؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

<Accordion title="Legacy bridge config (historical reference)">

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

- `sessionRetention`: مدت نگهداری جلسه‌های تکمیل‌شدهٔ اجرای Cron ایزوله پیش از حذف از `sessions.json`. همچنین پاک‌سازی رونوشت‌های Cron حذف‌شدهٔ آرشیوشده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال کردن، `false` را تنظیم کنید.
- `runLog.maxBytes`: برای سازگاری با گزارش‌های اجرای Cron قدیمی‌تر مبتنی بر فایل پذیرفته می‌شود. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین ردیف‌های تاریخچهٔ اجرای SQLite که برای هر کار نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن حامل که برای تحویل POST از طریق Cron Webhook استفاده می‌شود (`delivery.mode = "webhook"`). اگر حذف شود، هیچ سرآیند احراز هویتی ارسال نمی‌شود.
- `webhook`: URL قدیمی و منسوخ Webhook پشتیبان (http/https) که `openclaw doctor --fix` برای مهاجرت کارهای ذخیره‌شده‌ای استفاده می‌کند که هنوز `notify: true` دارند؛ تحویل در زمان اجرا از `delivery.mode="webhook"` برای هر کار به‌همراه `delivery.to` استفاده می‌کند، یا هنگام حفظ تحویل اعلان از `delivery.completionDestination`.

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

- `maxAttempts`: حداکثر تلاش‌های مجدد برای کارهای Cron در خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0`-`10`).
- `backoffMs`: آرایه‌ای از تأخیرهای backoff برحسب میلی‌ثانیه برای هر تلاش مجدد (پیش‌فرض: `[30000, 60000, 300000]`؛ ۱ تا ۱۰ ورودی).
- `retryOn`: انواع خطایی که تلاش مجدد را فعال می‌کنند - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش مجدد روی همهٔ انواع گذرا، حذفش کنید.

کارهای تک‌اجرا تا زمانی که تلاش‌های مجدد تمام شوند فعال می‌مانند، سپس درحالی‌که وضعیت خطای نهایی را حفظ می‌کنند غیرفعال می‌شوند. کارهای تکرارشونده از همان سیاست تلاش مجدد گذرا استفاده می‌کنند تا پس از backoff و پیش از نوبت زمان‌بندی‌شدهٔ بعدی دوباره اجرا شوند؛ خطاهای دائمی یا تمام شدن تلاش‌های مجدد گذرا با backoff خطا به زمان‌بندی تکرارشوندهٔ عادی برمی‌گردند.

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
- `includeSkipped`: اجراهای ردشدهٔ پیاپی را در آستانهٔ هشدار حساب می‌کند (پیش‌فرض: `false`). اجراهای ردشده جداگانه ردیابی می‌شوند و بر backoff خطای اجرا اثر نمی‌گذارند.
- `mode`: حالت تحویل - `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به Webhook پیکربندی‌شده پست می‌کند.
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

- مقصد پیش‌فرض برای اعلان‌های شکست Cron در همهٔ کارها.
- `mode`: `"announce"` یا `"webhook"`؛ وقتی دادهٔ مقصد کافی وجود داشته باشد، پیش‌فرض `"announce"` است.
- `channel`: جایگزینی کانال برای تحویل اعلان. `"last"` آخرین کانال تحویل شناخته‌شده را دوباره استفاده می‌کند.
- `to`: مقصد اعلان یا URL وبهوک صریح. برای حالت Webhook الزامی است.
- `accountId`: جایگزینی اختیاری حساب برای تحویل.
- `delivery.failureDestination` برای هر کار این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست مخصوص کار تنظیم شده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌دهند در صورت شکست به همان مقصد اعلان اصلی برمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر این‌که `delivery.mode` اصلی کار `"webhook"` باشد.

[کارهای Cron](/fa/automation/cron-jobs) را ببینید. اجراهای Cron ایزوله به‌عنوان [کارهای پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای قالب مدل رسانه

جای‌نگهدارهای قالب که در `tools.media.models[].args` گسترش می‌یابند:

| متغیر              | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | متن کامل پیام ورودی                              |
| `{{RawBody}}`      | متن خام (بدون پوشش‌های تاریخچه/فرستنده)          |
| `{{BodyStripped}}` | متن با حذف mentionهای گروه                       |
| `{{From}}`         | شناسهٔ فرستنده                                    |
| `{{To}}`           | شناسهٔ مقصد                                       |
| `{{MessageSid}}`   | شناسهٔ پیام کانال                                 |
| `{{SessionId}}`    | UUID جلسهٔ فعلی                                   |
| `{{IsNewSession}}` | وقتی جلسهٔ جدید ایجاد شود `"true"`                |
| `{{MediaUrl}}`     | شبه-URL رسانهٔ ورودی                              |
| `{{MediaPath}}`    | مسیر رسانهٔ محلی                                  |
| `{{MediaType}}`    | نوع رسانه (تصویر/صوت/سند/…)                      |
| `{{Transcript}}`   | رونوشت صوتی                                      |
| `{{Prompt}}`       | پرامپت رسانهٔ حل‌شده برای ورودی‌های CLI          |
| `{{MaxChars}}`     | حداکثر نویسه‌های خروجی حل‌شده برای ورودی‌های CLI |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (در حد امکان)                         |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد امکان)               |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد امکان)                 |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد امکان)                 |
| `{{Provider}}`     | راهنمای provider (whatsapp، telegram، discord و غیره) |

---

## includeهای پیکربندی (`$include`)

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
- آرایهٔ فایل‌ها: به‌ترتیب deep-merge می‌شوند (موارد بعدی، قبلی‌ها را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از includeها ادغام می‌شوند (مقادیر includeشده را بازنویسی می‌کنند).
- includeهای تودرتو: تا ۱۰ سطح عمق.
- مسیرها: نسبت به فایل includeکننده resolve می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح‌بالا (`dirname` مربوط به `openclaw.json`) بمانند. شکل‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل همان مرز resolve شوند. مسیرها نباید بایت null داشته باشند و باید پیش و پس از resolution اکیداً کوتاه‌تر از ۴۰۹۶ نویسه باشند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح‌بالا را تغییر می‌دهند و پشتوانهٔ آن یک include تک‌فایلی است، مستقیماً در همان فایل includeشده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- includeهای ریشه، آرایه‌های include، و includeهایی با بازنویسی هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط‌خواندنی هستند؛ این نوشتن‌ها به‌جای تخت‌کردن پیکربندی، fail closed می‌شوند.
- خطاها: پیام‌های روشن برای فایل‌های گم‌شده، خطاهای parse، includeهای حلقوی، قالب مسیر نامعتبر، و طول بیش‌ازحد.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

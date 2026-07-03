---
read_when:
    - به معناشناسی یا پیش‌فرض‌های دقیق پیکربندی در سطح فیلد نیاز دارید
    - شما در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای هسته‌ای OpenClaw، پیش‌فرض‌ها، و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-07-03T23:39:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1365e40b17122e9a029e294baf12db2dd974b3c2686ed1f2e9cf2a46757fa356
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی یک زیرسیستم مرجع عمیق‌تری برای خودش دارد، به آن پیوند می‌دهد. کاتالوگ‌های دستور متعلق به کانال و plugin و تنظیمات عمیق حافظه/QMD در صفحه‌های خودشان قرار دارند، نه در این صفحه.

حقیقت کد:

- `openclaw config schema` JSON Schema زنده‌ای را چاپ می‌کند که برای اعتبارسنجی و Control UI استفاده می‌شود، و در صورت موجود بودن، فراداده bundled/plugin/channel در آن ادغام می‌شود
- `config.schema.lookup` یک گره schema محدود به مسیر را برای ابزارهای بررسی عمیق برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش مبنای مستندات پیکربندی را در برابر سطح schema فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی agent: پیش از ویرایش، برای مستندات و محدودیت‌های دقیق در سطح فیلد از کنش ابزار `gateway` یعنی `config.schema.lookup` استفاده کنید. برای راهنمایی وظیفه‌محور از [پیکربندی](/fa/gateway/configuration) و برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها و پیوندها به مراجع زیرسیستم‌ها از این صفحه استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`،‏ `memory.qmd.*`،‏ `memory.citations`، و پیکربندی dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [دستورهای اسلش](/fa/tools/slash-commands) برای کاتالوگ دستور فعلیِ داخلی + bundled
- صفحه‌های کانال/plugin مالک برای سطوح دستور ویژه کانال

قالب پیکربندی **JSON5** است (کامنت‌ها + ویرگول‌های پایانی مجازند). همه فیلدها اختیاری‌اند - OpenClaw وقتی فیلدی حذف شود از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند - برای `channels.*`، از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و دیگر کانال‌های bundled (احراز هویت، کنترل دسترسی، چندحسابی، gating اشاره)، [پیکربندی - کانال‌ها](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های agent، چند-agent، نشست‌ها و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است - برای موارد زیر [پیکربندی - agentها](/fa/gateway/config-agents) را ببینید:

- `agents.defaults.*` (workspace، مدل، thinking، heartbeat، حافظه، رسانه، skills، sandbox)
- `multiAgent.*` (مسیریابی و bindingهای چند-agent)
- `session.*` (چرخه عمر نشست، compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر markdown)
- `talk.*` (حالت Talk)
  - `talk.consultThinkingLevel`: بازنویسی سطح thinking برای کل اجرای agent در OpenClaw پشت realtime consultهای Control UI Talk
  - `talk.consultFastMode`: بازنویسی یک‌باره حالت سریع برای realtime consultهای Control UI Talk
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk روی iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پنجره مکث پیش‌فرض پلتفرم را پیش از ارسال transcript نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback رله Gateway برای transcriptهای realtime نهایی‌شده Talk که `openclaw_agent_consult` را رد می‌کنند

## ابزارها و providerهای سفارشی

سیاست ابزار، toggleهای آزمایشی، پیکربندی ابزار پشتیبانی‌شده توسط provider، و راه‌اندازی provider / base-URL سفارشی به صفحه‌ای اختصاصی منتقل شده‌اند - [پیکربندی - ابزارها و providerهای سفارشی](/fa/gateway/config-tools) را ببینید.

## مدل‌ها

تعریف‌های provider، allowlistهای مدل، و راه‌اندازی provider سفارشی در [پیکربندی - ابزارها و providerهای سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند.
ریشه `models` همچنین مالک رفتار سراسری کاتالوگ مدل است.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: رفتار کاتالوگ provider (`merge` یا `replace`).
- `models.providers`: نگاشت provider سفارشی که با شناسه provider کلیدگذاری شده است.
- `models.providers.*.localService`: مدیر فرایند اختیاریِ هنگام نیاز برای سرورهای مدل محلی. OpenClaw endpoint سلامت پیکربندی‌شده را probe می‌کند، در صورت نیاز `command` مطلق را شروع می‌کند، منتظر آمادگی می‌ماند، سپس درخواست مدل را می‌فرستد. [سرویس‌های مدل محلی](/fa/gateway/local-model-services) را ببینید.
- `models.pricing.enabled`: bootstrap قیمت‌گذاری پس‌زمینه را کنترل می‌کند که پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد، Gateway دریافت کاتالوگ قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقادیر پیکربندی‌شده `models.providers.*.models[].cost` همچنان برای برآورد هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط OpenClaw جاسازی‌شده و adapterهای runtime دیگر مصرف می‌شوند. دستورهای `openclaw mcp list`،‏ `show`،‏ `set` و `unset` این بلوک را بدون اتصال به سرور هدف هنگام ویرایش پیکربندی مدیریت می‌کنند.

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

- `mcp.servers`: تعریف‌های نام‌دار سرور stdio یا remote MCP برای runtimeهایی که ابزارهای MCP پیکربندی‌شده را ارائه می‌کنند.
  ورودی‌های remote از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛ `type: "http"` یک alias بومی CLI است که `openclaw mcp set` و `openclaw doctor --fix` آن را به فیلد canonical `transport` نرمال‌سازی می‌کنند.
- `mcp.servers.<name>.enabled`: روی `false` تنظیم کنید تا یک تعریف سرور ذخیره‌شده را نگه دارید، در حالی که آن را از کشف MCP جاسازی‌شده OpenClaw و projection ابزار کنار می‌گذارید.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout درخواست MCP برای هر سرور، بر حسب ثانیه یا میلی‌ثانیه.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout اتصال برای هر سرور، بر حسب ثانیه یا میلی‌ثانیه.
- `mcp.servers.<name>.supportsParallelToolCalls`: راهنمای اختیاری هم‌زمانی برای adapterهایی که می‌توانند انتخاب کنند آیا فراخوانی‌های ابزار MCP موازی صادر کنند یا نه.
- `mcp.servers.<name>.auth`: برای سرورهای HTTP MCP که به OAuth نیاز دارند، روی `"oauth"` تنظیم کنید. برای ذخیره tokenها زیر state OpenClaw، `openclaw mcp login <name>` را اجرا کنید.
- `mcp.servers.<name>.oauth`: بازنویسی‌های اختیاری scope OAuth، URL redirect و URL فراداده client.
- `mcp.servers.<name>.sslVerify`،‏ `clientCert`،‏ `clientKey`: کنترل‌های HTTP TLS برای endpointهای خصوصی و mutual TLS.
- `mcp.servers.<name>.toolFilter`: انتخاب اختیاری ابزار برای هر سرور. `include` ابزارهای MCP کشف‌شده را به نام‌های مطابق محدود می‌کند؛ `exclude` نام‌های مطابق را پنهان می‌کند. ورودی‌ها نام دقیق ابزار MCP یا globهای ساده `*` هستند. سرورهایی که resource یا prompt دارند همچنین نام ابزارهای utility تولید می‌کنند (`resources_list`،‏ `resources_read`،‏ `prompts_list`،‏ `prompts_get`) و آن نام‌ها از همان فیلتر استفاده می‌کنند.
- `mcp.servers.<name>.codex`: کنترل‌های اختیاری projection برای app-server در Codex.
  این بلوک فقط برای threadهای app-server در Codex، فراداده OpenClaw است؛ روی نشست‌های ACP، پیکربندی عمومی harness در Codex، یا adapterهای runtime دیگر اثر نمی‌گذارد.
  `codex.agents` غیرخالی سرور را به شناسه‌های agent فهرست‌شده OpenClaw محدود می‌کند.
  فهرست‌های agent محدودشده که خالی، blank یا نامعتبر باشند توسط اعتبارسنجی پیکربندی رد می‌شوند و مسیر projection runtime آن‌ها را حذف می‌کند، نه اینکه جهانی شوند.
  `codex.defaultToolsApprovalMode` مقدار native Codex یعنی `default_tools_approval_mode` را برای آن سرور emit می‌کند. OpenClaw پیش از ارسال پیکربندی native `mcp_servers` به Codex، بلوک `codex` را حذف می‌کند. برای اینکه سرور برای هر agent app-server در Codex با رفتار پیش‌فرض تأیید MCP در Codex project شود، این بلوک را حذف کنید.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای runtimeهای MCP bundled محدود به نشست.
  اجراهای جاسازی‌شده یک‌باره پاک‌سازی پایان اجرا را درخواست می‌کنند؛ این TTL پشتیبان نشست‌های طولانی‌مدت و callerهای آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP نشست cacheشده به‌صورت hot-apply اعمال می‌شوند.
  کشف/استفاده بعدی از ابزار آن‌ها را از پیکربندی جدید دوباره می‌سازد، بنابراین ورودی‌های حذف‌شده `mcp.servers` به‌جای انتظار برای TTL بیکاری، فوراً جمع‌آوری می‌شوند.
- کشف runtime همچنین با حذف کاتالوگ cacheشده برای آن نشست، اعلان‌های تغییر فهرست ابزار MCP را رعایت می‌کند. سرورهایی که resource یا prompt اعلام می‌کنند ابزارهای utility برای فهرست‌کردن/خواندن resourceها و فهرست‌کردن/دریافت promptها می‌گیرند. شکست‌های تکراری فراخوانی ابزار، سرور متأثر را برای مدت کوتاهی مکث می‌دهند پیش از آنکه فراخوانی دیگری تلاش شود.

برای رفتار runtime، [MCP](/fa/cli/mcp#openclaw-as-an-mcp-client-registry) و [backendهای CLI](/fa/gateway/cli-backends#bundle-mcp-overlays) را ببینید.

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

- `allowBundled`: allowlist اختیاری فقط برای skills bundled (skills مدیریت‌شده/workspace بی‌تأثیرند).
- `load.extraDirs`: ریشه‌های skill مشترک اضافی (پایین‌ترین اولویت).
- `load.allowSymlinkTargets`: ریشه‌های target واقعی و مورد اعتماد که symlinkهای skill می‌توانند وقتی link بیرون از ریشه source پیکربندی‌شده‌اش قرار دارد به آن‌ها resolve شوند.
- `workshop.allowSymlinkTargetWrites`: به Skill Workshop apply اجازه می‌دهد از طریق targetهای symlink از پیش مورد اعتماد بنویسد (پیش‌فرض: false).
- `install.preferBrew`: وقتی true باشد، در صورت در دسترس بودن `brew`، پیش از fallback به انواع installer دیگر، installerهای Homebrew را ترجیح می‌دهد.
- `install.nodeManager`: ترجیح installer مربوط به node برای specهای `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: به clientهای Gateway مورد اعتماد `operator.admin` اجازه می‌دهد archiveهای zip خصوصیِ stageشده از طریق `skills.upload.*` را نصب کنند (پیش‌فرض: false). این فقط مسیر archive آپلودشده را فعال می‌کند؛ نصب‌های عادی ClawHub به آن نیاز ندارند.
- `entries.<skillKey>.enabled: false` یک skill را حتی اگر bundled/installed باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بری برای skills که یک env var اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

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

- از دایرکتوری‌های package یا bundle زیر `~/.openclaw/extensions` و `<workspace>/.openclaw/extensions`، به‌علاوه فایل‌ها یا دایرکتوری‌های فهرست‌شده در `plugins.load.paths` بارگذاری می‌شود.
- فایل‌های Plugin مستقل را در `plugins.load.paths` قرار دهید؛ ریشه‌های extension که به‌صورت خودکار کشف می‌شوند، فایل‌های سطح بالای `.js`، `.mjs` و `.ts` را نادیده می‌گیرند تا اسکریپت‌های کمکی در آن ریشه‌ها مانع راه‌اندازی نشوند.
- کشف، Pluginهای بومی OpenClaw به‌علاوه bundleهای سازگار Codex و bundleهای Claude را می‌پذیرد، از جمله bundleهای چیدمان پیش‌فرض Claude بدون manifest.
- **تغییرات پیکربندی به راه‌اندازی دوباره gateway نیاز دارند.**
- `allow`: allowlist اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` برنده است.
- `plugins.entries.<id>.apiKey`: فیلد راحتی کلید API در سطح Plugin (وقتی Plugin پشتیبانی کند).
- `plugins.entries.<id>.env`: نگاشت متغیر محیطی scoped به Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، هسته `before_prompt_build` را مسدود می‌کند و فیلدهای تغییردهنده prompt از `before_agent_start` قدیمی را نادیده می‌گیرد، در حالی که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. بر hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط bundle که پشتیبانی می‌شوند اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیر-bundled مورد اعتماد می‌توانند محتوای خام مکالمه را از hookهای typed مانند `llm_input`، `llm_output`، `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `before_agent_finalize` و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌صراحت به این Plugin اعتماد کنید تا برای اجرای subagent پس‌زمینه، overrideهای `provider` و `model` در سطح هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist اختیاری از هدف‌های canonical `provider/model` برای overrideهای مورد اعتماد subagent. فقط وقتی از `"*"` استفاده کنید که عمداً می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.llm.allowModelOverride`: به‌صراحت به این Plugin اعتماد کنید تا برای `api.runtime.llm.complete` درخواست override مدل کند.
- `plugins.entries.<id>.llm.allowedModels`: allowlist اختیاری از هدف‌های canonical `provider/model` برای overrideهای تکمیل LLM مورد اعتماد Plugin. فقط وقتی از `"*"` استفاده کنید که عمداً می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: به‌صراحت به این Plugin اعتماد کنید تا `api.runtime.llm.complete` را روی یک شناسه agent غیرپیش‌فرض اجرا کند.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (در صورت وجود، با schema Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/زمان‌اجرای Plugin کانال زیر `channels.<id>` قرار می‌گیرند و باید توسط metadata متعلق به manifest `channelConfigs` همان Plugin توصیف شوند، نه توسط یک registry مرکزی گزینه‌های OpenClaw.

### پیکربندی Plugin harness Codex

Plugin bundled به نام `codex` مالک تنظیمات بومی harness app-server Codex زیر
`plugins.entries.codex.config` است. برای سطح کامل پیکربندی، [مرجع harness Codex](/fa/plugins/codex-harness-reference) و برای مدل زمان‌اجرا [harness Codex](/fa/plugins/codex-harness) را ببینید.

`codexPlugins` فقط برای sessionهایی اعمال می‌شود که harness بومی Codex را انتخاب می‌کنند.
این گزینه Pluginهای Codex را برای اجراهای provider OpenClaw، bindingهای مکالمه ACP
یا هر harness غیر-Codex فعال نمی‌کند.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: پشتیبانی بومی Plugin/app
  را برای harness Codex فعال می‌کند. پیش‌فرض: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سیاست پیش‌فرض اقدام‌های destructive برای elicitations اپلیکیشن Plugin مهاجرت‌داده‌شده.
  از `true` برای پذیرش schemaهای امن تأیید Codex بدون prompt، از `false`
  برای رد آن‌ها، از `"auto"` برای مسیریابی تأییدهای موردنیاز Codex از طریق تأییدهای
  Plugin OpenClaw، یا از `"ask"` برای prompt گرفتن برای هر اقدام نوشتنی/destructive
  Plugin بدون تأیید پایدار استفاده کنید. حالت `"ask"`، overrideهای پایدار تأیید Codex
  در سطح هر ابزار را برای اپلیکیشن تحت‌تأثیر پاک می‌کند و پیش از شروع thread Codex،
  بازبین تأییدهای انسانی را برای آن اپلیکیشن انتخاب می‌کند.
  پیش‌فرض: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: وقتی
  `codexPlugins.enabled` سراسری نیز true باشد، یک entry مهاجرت‌داده‌شده Plugin را فعال می‌کند.
  پیش‌فرض: `true` برای entryهای صریح.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هویت پایدار marketplace. V1 فقط از `"openai-curated"` پشتیبانی می‌کند.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هویت پایدار
  Plugin Codex از مهاجرت، برای مثال `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override اقدام destructive در سطح هر Plugin. وقتی حذف شود، مقدار سراسری
  `allow_destructive_actions` استفاده می‌شود. مقدار در سطح هر Plugin همان سیاست‌های
  `true`، `false`، `"auto"` یا `"ask"` را می‌پذیرد.

هر اپلیکیشن Plugin پذیرفته‌شده که از `"ask"` استفاده می‌کند، درخواست‌های تأیید همان اپلیکیشن
را به بازبین انسانی مسیریابی می‌کند. اپلیکیشن‌های دیگر و تأییدهای thread غیر-app بازبین
پیکربندی‌شده خود را حفظ می‌کنند، بنابراین سیاست‌های ترکیبی Plugin رفتار `"ask"` را به ارث نمی‌برند.

`codexPlugins.enabled` دستور فعال‌سازی سراسری است. entryهای صریح Plugin که توسط مهاجرت
نوشته می‌شوند، مجموعه پایدار واجدشرایط نصب و تعمیر هستند. `plugins["*"]` پشتیبانی نمی‌شود،
switch با نام `install` وجود ندارد، و مقادیر محلی `marketplacePath` عمداً فیلدهای پیکربندی
نیستند چون به host وابسته‌اند.

بررسی‌های آمادگی `app/list` برای یک ساعت cache می‌شوند و وقتی stale باشند به‌صورت async
refresh می‌شوند. پیکربندی اپلیکیشن thread Codex هنگام برقراری session harness Codex محاسبه
می‌شود، نه در هر نوبت؛ پس از تغییر پیکربندی Plugin بومی از `/new`، `/reset` یا راه‌اندازی دوباره
gateway استفاده کنید.

- `plugins.entries.firecrawl.config.webFetch`: تنظیمات provider واکشی وب Firecrawl.
  - `apiKey`: کلید API اختیاری Firecrawl برای محدودیت‌های بالاتر (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، کلید قدیمی `tools.web.fetch.firecrawl.apiKey` یا متغیر محیطی `FIRECRAWL_API_KEY` برمی‌گردد.
  - `baseUrl`: URL پایه API Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای self-hosted باید endpointهای private/internal را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی را از صفحه‌ها استخراج می‌کند (پیش‌فرض: `true`).
  - `maxAgeMs`: بیشینه سن cache بر حسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: مهلت زمانی درخواست scrape بر حسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات جست‌وجوی X در xAI (جست‌وجوی وب Grok).
  - `enabled`: provider جست‌وجوی X را فعال می‌کند.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مثلاً `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات Dreaming حافظه. برای phaseها و آستانه‌ها [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: switch اصلی Dreaming (پیش‌فرض `false`).
  - `frequency`: cadence مربوط به cron برای هر sweep کامل Dreaming (به‌صورت پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent با نام Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن هدف‌ها با `allowedModels` جفت کنید. خطاهای unavailable بودن مدل یک بار با مدل پیش‌فرض session دوباره تلاش می‌شوند؛ خطاهای اعتماد یا allowlist به‌صورت silent fallback نمی‌کنند.
  - سیاست phase و آستانه‌ها جزئیات پیاده‌سازی هستند (کلیدهای پیکربندی user-facing نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای bundle فعال Claude نیز می‌توانند defaultهای embedded OpenClaw را از `settings.json` اضافه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات sanitized agent اعمال می‌کند، نه به‌عنوان patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه `"none"` را انتخاب کنید.
- `plugins.slots.contextEngine`: شناسه Plugin موتور context فعال را انتخاب کنید؛ پیش‌فرض `"legacy"` است مگر اینکه موتور دیگری را نصب و انتخاب کنید.

[Pluginها](/fa/tools/plugin) را ببینید.

---

## تعهدها

`commitments` حافظه follow-up استنتاج‌شده را کنترل می‌کند: OpenClaw می‌تواند check-inها را از نوبت‌های مکالمه تشخیص دهد و آن‌ها را از طریق اجراهای Heartbeat تحویل دهد.

- `commitments.enabled`: استخراج پنهان LLM، ذخیره‌سازی و تحویل Heartbeat را برای تعهدهای follow-up استنتاج‌شده فعال می‌کند. پیش‌فرض: `false`.
- `commitments.maxPerDay`: بیشینه تعهدهای follow-up استنتاج‌شده که در یک روز rolling برای هر session agent تحویل داده می‌شوند. پیش‌فرض: `3`.

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
- `tabCleanup` پس از زمان بیکاری یا وقتی یک نشست از سقف خود عبور کند، تب‌های
  ردیابی‌شده‌ی عامل اصلی را بازپس می‌گیرد. برای غیرفعال کردن این حالت‌های پاک‌سازی جداگانه،
  `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین ناوبری مرورگر به‌طور پیش‌فرض سخت‌گیرانه می‌ماند.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را فقط وقتی تنظیم کنید که عمداً به ناوبری مرورگر در شبکه‌ی خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقاط پایانی پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترسی‌پذیری/کشف، مشمول همان مسدودسازی شبکه‌ی خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` برای استثناهای صریح استفاده کنید.
- پروفایل‌های راه‌دور فقط قابل اتصال هستند؛ `start`/`stop`/`reset` غیرفعال است.
- `profiles.*.cdpUrl` مقدارهای `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند از HTTP(S) استفاده کنید؛ وقتی
  ارائه‌دهنده‌ی شما یک URL مستقیم DevTools WebSocket می‌دهد از WS(S) استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترسی‌پذیری CDP راه‌دور و
  `attachOnly`، به‌علاوه‌ی درخواست‌های باز کردن تب اعمال می‌شوند. پروفایل‌های loopback
  مدیریت‌شده مقدارهای پیش‌فرض CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP که بیرون از OpenClaw مدیریت می‌شود از طریق loopback در دسترس است،
  برای آن پروفایل `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw پورت loopback را
  به‌عنوان یک پروفایل مرورگر مدیریت‌شده‌ی محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت پورت محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره‌ی مرورگر متصل، متصل شوند.
- پروفایل‌های `existing-session` می‌توانند `userDataDir` را برای هدف‌گیری یک پروفایل مرورگر
  مبتنی بر Chromium مشخص، مانند Brave یا Edge، تنظیم کنند.
- پروفایل‌های `existing-session` وقتی Chrome از قبل پشت یک نقطه‌ی پایانی کشف HTTP(S) مربوط به DevTools
  یا یک نقطه‌ی پایانی مستقیم WS(S) در حال اجراست، می‌توانند `cdpUrl` را تنظیم کنند. در آن
  حالت، OpenClaw به‌جای استفاده از اتصال خودکار، نقطه‌ی پایانی را به Chrome MCP می‌دهد؛
  `userDataDir` برای آرگومان‌های راه‌اندازی Chrome MCP نادیده گرفته می‌شود.
- پروفایل‌های `existing-session` محدودیت‌های فعلی مسیر Chrome MCP را نگه می‌دارند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری انتخابگر CSS، hookهای بارگذاری یک‌فایلی،
  بدون بازنویسی مهلت زمانی دیالوگ، بدون `wait --load networkidle`، و بدون
  `responsebody`، خروجی PDF، رهگیری دانلود، یا کنش‌های دسته‌ای.
- پروفایل‌های مدیریت‌شده‌ی محلی `openclaw` مقدارهای `cdpPort` و `cdpUrl` را خودکار تخصیص می‌دهند؛
  `cdpUrl` را فقط برای پروفایل‌های CDP راه‌دور یا اتصال نقطه‌ی پایانی existing-session
  به‌صورت صریح تنظیم کنید.
- پروفایل‌های مدیریت‌شده‌ی محلی می‌توانند `executablePath` را برای بازنویسی
  `browser.executablePath` سراسری همان پروفایل تنظیم کنند. از این برای اجرای یک پروفایل در
  Chrome و پروفایل دیگر در Brave استفاده کنید.
- پروفایل‌های مدیریت‌شده‌ی محلی پس از شروع فرایند، برای کشف HTTP مربوط به Chrome CDP از
  `browser.localLaunchTimeoutMs` و برای آمادگی websocket مربوط به CDP پس از راه‌اندازی از
  `browser.localCdpReadyTimeoutMs` استفاده می‌کنند. روی میزبان‌های کندتر که Chrome
  با موفقیت شروع می‌شود اما بررسی‌های آمادگی با شروع راه‌اندازی هم‌زمان می‌شوند، این مقدارها را افزایش دهید.
  هر دو مقدار باید عدد صحیح مثبت تا `120000` میلی‌ثانیه باشند؛ مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را پیش از راه‌اندازی Chromium برای پوشه‌ی خانگی سیستم‌عامل شما
  می‌پذیرند. `userDataDir` مخصوص هر پروفایل در پروفایل‌های `existing-session` نیز با tilde گسترش داده می‌شود.
- سرویس کنترل: فقط loopback (پورت از `gateway.port` مشتق می‌شود، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های راه‌اندازی اضافه را به شروع محلی Chromium اضافه می‌کند (برای مثال
  `--disable-gpu`، اندازه‌گذاری پنجره، یا پرچم‌های اشکال‌زدایی).

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

- `seamColor`: رنگ تأکیدی برای chrome رابط کاربری برنامه‌ی بومی (رنگ حباب حالت Talk و غیره).
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

- `mode`: `local` (اجرای gateway) یا `remote` (اتصال به gateway راه‌دور). Gateway از شروع به کار خودداری می‌کند مگر اینکه `local` باشد.
- `port`: یک درگاه چندمنظوره برای WS + HTTP. ترتیب تقدم: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP مربوط به Tailscale)، یا `custom`.
- **نام‌های مستعار bind قدیمی**: از مقادیر حالت bind در `gateway.bind` استفاده کنید (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، نه نام‌های مستعار میزبان (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **یادداشت Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکه‌بندی bridge در Docker (`-p 18789:18789`)، ترافیک روی `eth0` وارد می‌شود، بنابراین gateway در دسترس نیست. از `--network host` استفاده کنید، یا `bind: "lan"` (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) را تنظیم کنید تا روی همه واسط‌ها گوش دهد.
- **Auth**: به‌صورت پیش‌فرض لازم است. bindهای غیر-loopback به احراز هویت gateway نیاز دارند. در عمل این یعنی یک توکن/رمز عبور مشترک یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. جادوگر راه‌اندازی به‌صورت پیش‌فرض یک توکن تولید می‌کند.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefs)، `gateway.auth.mode` را صراحتاً روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، روندهای راه‌اندازی و نصب/تعمیر سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای تنظیمات مورداعتماد local loopback استفاده کنید؛ این حالت عمداً در اعلان‌های راه‌اندازی ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک reverse proxy آگاه از هویت واگذار کنید و به سربرگ‌های هویت از `gateway.trustedProxies` اعتماد کنید (نگاه کنید به [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth)). این حالت به‌صورت پیش‌فرض یک منبع proxy **غیر-loopback** انتظار دارد؛ reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی روی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان fallback مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، سربرگ‌های هویت Tailscale Serve می‌توانند احراز هویت Control UI/WebSocket را برآورده کنند (با `tailscale whois` تأیید می‌شود). endpointهای HTTP API از آن احراز هویت سربرگ Tailscale استفاده **نمی‌کنند**؛ در عوض حالت عادی احراز هویت HTTP مربوط به gateway را دنبال می‌کنند. این جریان بدون توکن فرض می‌کند میزبان gateway مورداعتماد است. وقتی `tailscale.mode = "serve"` باشد، پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکننده اختیاری تلاش‌های ناموفق احراز هویت. به‌ازای هر IP کلاینت و هر دامنه احراز هویت اعمال می‌شود (shared-secret و device-token مستقل از هم ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر async مربوط به Tailscale Serve Control UI، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست، سریالی می‌شوند. بنابراین تلاش‌های بد هم‌زمان از همان کلاینت می‌توانند در درخواست دوم محدودکننده را فعال کنند، به‌جای اینکه هر دو مثل mismatch ساده هم‌زمان عبور کنند.
  - `gateway.auth.rateLimit.exemptLoopback` به‌صورت پیش‌فرض `true` است؛ وقتی عمداً می‌خواهید ترافیک localhost هم محدودیت نرخ داشته باشد (برای تنظیمات آزمایشی یا استقرارهای proxy سخت‌گیرانه)، آن را روی `false` تنظیم کنید.
- تلاش‌های احراز هویت WS با مبدأ مرورگر همیشه با معافیت loopback غیرفعال محدود می‌شوند (دفاع چندلایه در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، آن قفل‌شدن‌های با مبدأ مرورگر به‌ازای مقدار نرمال‌سازی‌شده `Origin`
  جدا هستند، بنابراین شکست‌های تکراری از یک مبدأ localhost به‌صورت خودکار
  مبدأ دیگری را قفل نمی‌کند.
- `tailscale.mode`: `serve` (فقط tailnet، bind از نوع loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `tailscale.serviceName`: نام اختیاری Tailscale Service برای حالت Serve، مانند
  `svc:openclaw`. وقتی تنظیم شود، OpenClaw آن را به `tailscale serve
--service` پاس می‌دهد تا Control UI بتواند از طریق یک Service نام‌گذاری‌شده، به‌جای
  hostname دستگاه، ارائه شود. مقدار باید از قالب نام Service در Tailscale یعنی `svc:<dns-label>`
  استفاده کند؛ راه‌اندازی URL مشتق‌شده Service را گزارش می‌کند.
- `tailscale.preserveFunnel`: وقتی `true` باشد و `tailscale.mode = "serve"`، OpenClaw
  پیش از اعمال دوباره Serve هنگام راه‌اندازی، `tailscale funnel status` را بررسی می‌کند و اگر
  یک مسیر Funnel پیکربندی‌شده بیرونی از قبل درگاه gateway را پوشش دهد، از آن صرف‌نظر می‌کند.
  پیش‌فرض `false`.
- `controlUi.allowedOrigins`: allowlist صریح مبدأهای مرورگر برای اتصال‌های Gateway WebSocket. برای مبدأهای مرورگر عمومی غیر-loopback لازم است. بارگذاری‌های UI خصوصی same-origin در LAN/Tailnet از loopback، RFC1918/link-local، `.local`، `.ts.net`، یا میزبان‌های CGNAT در Tailscale بدون فعال‌سازی fallback سربرگ Host پذیرفته می‌شوند.
- `controlUi.chatMessageMaxWidth`: حداکثر عرض اختیاری برای پیام‌های گفت‌وگوی گروه‌بندی‌شده Control UI. مقادیر محدودشده عرض CSS مانند `960px`، `82%`، `min(1280px, 82%)`، و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناکی که fallback مبدأ سربرگ Host را برای استقرارهایی فعال می‌کند که عمداً به سیاست مبدأ مبتنی بر سربرگ Host متکی هستند.
- `remote.transport`: `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، `remote.url` برای میزبان‌های عمومی باید `wss://` باشد؛ متن ساده `ws://` فقط برای loopback، LAN، link-local، `.local`، `.ts.net`، و میزبان‌های CGNAT در Tailscale پذیرفته می‌شود.
- `remote.remotePort`: درگاه gateway روی میزبان SSH راه‌دور. پیش‌فرض `18789` است؛ وقتی درگاه تونل محلی با درگاه gateway راه‌دور فرق دارد، از این استفاده کنید.
- `remote.sshHostKeyPolicy`: سیاست کلید میزبان تونل SSH در macOS. `strict` پیش‌فرض است و به کلیدی نیاز دارد که از قبل مورداعتماد باشد. `openssh` یک opt-in صریح به پیکربندی مؤثر OpenSSH برای نام‌های مستعار مدیریت‌شده است؛ پیش از استفاده، تنظیمات SSH کاربر و سیستم مطابق را بازبینی کنید. برنامه macOS و `configure-remote` هنگام تغییر هدف‌ها، این سیاست را به `strict` بازنشانی می‌کنند مگر اینکه دوباره صراحتاً opt in شده باشد.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامه کلاینت راه‌دور هستند. آن‌ها به‌تنهایی احراز هویت gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: URL پایه HTTPS برای relay بیرونی APNs که پس از انتشار ثبت‌نام‌ها از سوی buildهای iOS متکی بر relay به gateway استفاده می‌شود. buildهای عمومی App Store از relay میزبانی‌شده OpenClaw استفاده می‌کنند. URLهای relay سفارشی باید با یک مسیر build/استقرار iOS عمداً جداگانه مطابقت داشته باشند که URL relay آن به همان relay اشاره می‌کند.
- `gateway.push.apns.relay.timeoutMs`: timeout ارسال از gateway به relay برحسب میلی‌ثانیه. پیش‌فرض `10000`.
- ثبت‌نام‌های متکی بر relay به یک هویت gateway مشخص واگذار می‌شوند. برنامه iOS جفت‌شده `gateway.identity.get` را واکشی می‌کند، آن هویت را در ثبت‌نام relay قرار می‌دهد، و یک مجوز ارسال محدود به ثبت‌نام را به gateway ارسال می‌کند. gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه فرار فقط مخصوص توسعه برای URLهای relay HTTP روی loopback. URLهای relay تولید باید روی HTTPS بمانند.
- `gateway.handshakeTimeoutMs`: timeout دست‌دهی Gateway WebSocket پیش از احراز هویت برحسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد، تقدم دارد. روی میزبان‌های پر بار یا کم‌قدرت که کلاینت‌های محلی می‌توانند درحالی‌که گرم‌شدن راه‌اندازی هنوز در حال پایدار شدن است متصل شوند، این مقدار را افزایش دهید.
- `gateway.channelHealthCheckMinutes`: بازه health-monitor کانال برحسب دقیقه. برای غیرفعال کردن restartهای health-monitor به‌صورت سراسری، `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانه stale-socket برحسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: بیشینه restartهای health-monitor به‌ازای هر کانال/حساب در یک ساعت rolling. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: انصراف به‌ازای هر کانال از restartهای health-monitor در حالی که monitor سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override به‌ازای هر حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر override سطح کانال تقدم دارد.
- مسیرهای فراخوانی gateway محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتاً از طریق SecretRef پیکربندی شده و حل‌نشده باشد، resolution به‌صورت fail-closed شکست می‌خورد (بدون پوشاندن با fallback راه‌دور).
- `trustedProxies`: IPهای reverse proxy که TLS را terminate می‌کنند یا سربرگ‌های forwarded-client تزریق می‌کنند. فقط proxyهایی را فهرست کنید که کنترلشان می‌کنید. ورودی‌های loopback همچنان برای تنظیمات proxy/local-detection روی همان میزبان معتبرند (برای مثال Tailscale Serve یا یک reverse proxy محلی)، اما درخواست‌های loopback را واجد شرایط `gateway.auth.mode: "trusted-proxy"` نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، gateway در صورت نبود `X-Forwarded-For`، `X-Real-IP` را می‌پذیرد. پیش‌فرض `false` برای رفتار fail-closed است.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای تأیید خودکار جفت‌سازی نخستین‌بار دستگاه node بدون scopeهای درخواست‌شده. وقتی تنظیم نشده باشد غیرفعال است. این مورد جفت‌سازی operator/browser/Control UI/WebChat را خودکار تأیید نمی‌کند، و ارتقاهای role، scope، metadata، یا public-key را هم خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی allow/deny سراسری برای فرمان‌های node اعلام‌شده پس از جفت‌سازی و ارزیابی allowlist پلتفرم. از `allowCommands` برای opt in به فرمان‌های خطرناک node مانند `camera.snap`، `camera.clip`، و `screen.record` استفاده کنید؛ `denyCommands` یک فرمان را حذف می‌کند حتی اگر پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل می‌شد. پس از اینکه یک node فهرست فرمان اعلام‌شده خود را تغییر داد، جفت‌سازی آن دستگاه را رد و دوباره تأیید کنید تا gateway snapshot به‌روزشده فرمان را ذخیره کند.
- `gateway.tools.deny`: نام ابزارهای اضافی مسدودشده برای HTTP `POST /tools/invoke` (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام ابزارها را از فهرست deny پیش‌فرض HTTP برای
  فراخوان‌های owner/admin حذف کنید. این مورد فراخوان‌های دارای هویت `operator.write`
  را به دسترسی owner/admin ارتقا نمی‌دهد؛ `cron`، `gateway`، و `nodes` حتی
  وقتی در allowlist باشند برای فراخوان‌های غیر-owner در دسترس نمی‌مانند.

</Accordion>

### endpointهای سازگار با OpenAI

- HTTP RPC مدیر: به‌صورت پیش‌فرض به‌عنوان Plugin `admin-http-rpc` خاموش است. Plugin را فعال کنید تا `POST /api/v1/admin/rpc` ثبت شود. نگاه کنید به [HTTP RPC مدیر](/fa/plugins/admin-http-rpc).
- Chat Completions: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL برای Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی تنظیم‌نشده تلقی می‌شوند؛ برای غیرفعال کردن واکشی URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- سربرگ اختیاری سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای مبدأهای HTTPS که کنترل می‌کنید تنظیم کنید؛ نگاه کنید به [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### جداسازی چندنمونه‌ای

چند gateway را روی یک میزبان با درگاه‌ها و دایرکتوری‌های وضعیت یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

فلگ‌های راحتی: `--dev` (از `~/.openclaw-dev` + درگاه `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

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

- `enabled`: termination مربوط به TLS را در listener gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده‌اند، یک جفت cert/key خودامضای محلی را خودکار تولید می‌کند؛ فقط برای استفاده local/dev.
- `certPath`: مسیر filesystem به فایل گواهی TLS.
- `keyPath`: مسیر filesystem به فایل کلید خصوصی TLS؛ دسترسی‌ها را محدود نگه دارید.
- `caPath`: مسیر اختیاری CA bundle برای تأیید کلاینت یا زنجیره‌های اعتماد سفارشی.

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
  - `"off"`: ویرایش‌های زنده را نادیده بگیر؛ تغییرات به راه‌اندازی مجدد صریح نیاز دارند.
  - `"restart"`: همیشه هنگام تغییر پیکربندی، فرایند Gateway را دوباره راه‌اندازی کن.
  - `"hot"`: تغییرات را بدون راه‌اندازی مجدد، درون همان فرایند اعمال کن.
  - `"hybrid"` (پیش‌فرض): ابتدا بارگذاری مجدد داغ را امتحان کن؛ در صورت نیاز، به راه‌اندازی مجدد برگرد.
- `debounceMs`: پنجره debounce بر حسب ms پیش از اعمال تغییرات پیکربندی (عدد صحیح نامنفی).
- `deferralTimeoutMs`: حداکثر زمان اختیاری بر حسب ms برای انتظار عملیات در حال اجرا، پیش از اجبار به راه‌اندازی مجدد یا بارگذاری مجدد داغ کانال. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای هنوز-در-انتظار، مقدار `0` را تنظیم کنید.

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
توکن‌های قلاب در رشته پرس‌وجو رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید با احراز هویت shared-secret فعال Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) متفاوت باشد؛ هنگام شناسایی استفاده دوباره، راه‌اندازی یک هشدار امنیتی غیرکشنده ثبت می‌کند.
- `openclaw security audit` استفاده دوباره از احراز هویت قلاب/Gateway را، از جمله احراز هویت رمز عبور Gateway که فقط هنگام audit ارائه شده است (`--auth password --password <password>`)، به‌عنوان یافته‌ای بحرانی علامت‌گذاری می‌کند. `openclaw doctor --fix` را اجرا کنید تا یک `hooks.token` ذخیره‌شده و دوباره‌استفاده‌شده چرخانده شود، سپس فرستنده‌های قلاب خارجی را به‌روزرسانی کنید تا از توکن قلاب جدید استفاده کنند.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیرمسیر اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا preset از `sessionKey` قالب‌دار استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این opt-in نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط وقتی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقادیر `sessionKey` نگاشت که با template رندر شده‌اند، خارجی‌تأمین‌شده در نظر گرفته می‌شوند و آن‌ها نیز به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="Mapping details">

- `match.path` زیرمسیر پس از `/hooks` را تطبیق می‌دهد (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` یک فیلد payload را برای مسیرهای عمومی تطبیق می‌دهد.
- قالب‌هایی مانند `{{messages[0].subject}}` از payload خوانده می‌شوند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش قلاب برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و داخل `hooks.transformsDir` بماند (مسیرهای مطلق و پیمایش مسیر رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ پوشه‌های skill فضای کاری رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به پوشه transforms قلاب‌ها منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک agent مشخص مسیریابی می‌کند؛ شناسه‌های ناشناخته به agent پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: مسیریابی مؤثر agent را محدود می‌کند، از جمله مسیر agent پیش‌فرض وقتی `agentId` حذف شده باشد (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید نشست ثابت اختیاری برای اجراهای agent قلاب بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای نشست نگاشت مبتنی بر template اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: فهرست مجاز پیشوند اختیاری برای مقادیر `sessionKey` صریح (درخواست + نگاشت)، مانند `["hook:"]`. وقتی هر نگاشت یا preset از `sessionKey` قالب‌دار استفاده کند، الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ `channel` به‌طور پیش‌فرض `last` است.
- `model`، LLM را برای این اجرای قلاب بازنویسی می‌کند (اگر کاتالوگ مدل تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- preset داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر آن مسیریابی به‌ازای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را به فضای نام Gmail محدود کنید، برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، preset را با یک `sessionKey` ایستا به‌جای پیش‌فرض قالب‌دار بازنویسی کنید.

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

- وقتی پیکربندی شده باشد، Gateway هنگام راه‌اندازی `gog gmail watch serve` را خودکار شروع می‌کند. برای غیرفعال‌کردن، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
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

- HTML/CSS/JS قابل ویرایش توسط agent و A2UI را از طریق HTTP زیر پورت Gateway سرو می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- bindهای غیر-loopback: مسیرهای بوم، همانند دیگر سطوح HTTP Gateway، به احراز هویت Gateway نیاز دارند (token/password/trusted-proxy).
- WebViewهای Node معمولاً headerهای احراز هویت نمی‌فرستند؛ پس از جفت‌شدن و اتصال یک Node، Gateway نشانی‌های URL قابلیتِ محدوده‌بندی‌شده به Node را برای دسترسی به بوم/A2UI تبلیغ می‌کند.
- نشانی‌های URL قابلیت به نشست WS فعال Node بسته‌اند و سریع منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت live-reload را به HTML سرو‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را خودکار ایجاد می‌کند.
- A2UI را نیز در `/__openclaw__/a2ui/` سرو می‌کند.
- تغییرات به راه‌اندازی مجدد Gateway نیاز دارند.
- برای پوشه‌های بزرگ یا خطاهای `EMFILE`، بارگذاری مجدد زنده را غیرفعال کنید.

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

- `minimal` (پیش‌فرض وقتی Plugin همراه `bonjour` فعال باشد): `cliPath` + `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: `cliPath` + `sshPort` را شامل می‌شود؛ تبلیغ multicast در LAN همچنان نیاز دارد Plugin همراه `bonjour` فعال باشد.
- `off`: تبلیغ multicast در LAN را بدون تغییر فعال‌بودن Plugin سرکوب می‌کند.
- Plugin همراه `bonjour` روی میزبان‌های macOS خودکار شروع می‌شود و در استقرارهای Gateway روی Linux، Windows و container به‌صورت opt-in است.
- نام میزبان وقتی یک برچسب DNS معتبر باشد، به‌طور پیش‌فرض نام میزبان سیستم است و در غیر این صورت به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` بازنویسی کنید.

### گستره وسیع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک ناحیه DNS-SD unicast زیر `~/.openclaw/dns/` می‌نویسد. برای کشف میان‌شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + Tailscale split DNS جفت کنید.

راه‌اندازی: `openclaw dns setup --apply`.

---

## محیط

### `env` (متغیرهای env درون‌خطی)

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

- متغیرهای env درون‌خطی فقط اگر env فرایند آن کلید را نداشته باشد اعمال می‌شوند.
- فایل‌های `.env`: `.env` در CWD + `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
- `shellEnv`: کلیدهای مورد انتظارِ مفقود را از پروفایل پوسته ورود شما import می‌کند.
- برای تقدم کامل، [محیط](/fa/help/environment) را ببینید.

### جایگزینی متغیر env

در هر رشته پیکربندی با `${VAR_NAME}` به متغیرهای env ارجاع دهید:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- فقط نام‌های حروف بزرگ تطبیق داده می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای مفقود/خالی هنگام بارگذاری پیکربندی خطا ایجاد می‌کنند.
- برای یک `${VAR}` لفظی، با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## رازها

ارجاع‌های راز افزایشی هستند: مقادیر plaintext همچنان کار می‌کنند.

### `SecretRef`

از یک شکل object استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی id برای `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id برای `source: "file"`: اشاره‌گر JSON مطلق (برای مثال `"/providers/openai/apiKey"`)
- الگوی id برای `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (selectorهای سبک AWS مانند `secret#json_key` را پشتیبانی می‌کند)
- idهای `source: "exec"` نباید segmentهای مسیرِ جداشده با slash شامل `.` یا `..` داشته باشند (برای مثال `a/../b` رد می‌شود)

### سطح اعتبارنامه پشتیبانی‌شده

- ماتریس canonical: [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای اعتبارنامه پشتیبانی‌شده `openclaw.json` را هدف می‌گیرد.
- ارجاع‌های `auth-profiles.json` در حل‌کردن هنگام اجرا و پوشش audit گنجانده می‌شوند.

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

نکات:

- ارائه‌دهنده `file` از `mode: "json"` و `mode: "singleValue"` پشتیبانی می‌کند (`id` در حالت singleValue باید `"value"` باشد).
- وقتی اعتبارسنجی ACL در Windows در دسترس نباشد، مسیرهای ارائه‌دهنده file و exec fail closed می‌شوند. `allowInsecurePath: true` را فقط برای مسیرهای مورد اعتمادی تنظیم کنید که قابل اعتبارسنجی نیستند.
- ارائه‌دهنده `exec` به مسیر مطلق `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌طور پیش‌فرض، مسیرهای فرمان symlink رد می‌شوند. برای مجازکردن مسیرهای symlink در حالی که مسیر هدف حل‌شده اعتبارسنجی می‌شود، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی پوشه مورد اعتماد روی مسیر هدف حل‌شده اعمال می‌شود.
- محیط child برای `exec` به‌طور پیش‌فرض حداقلی است؛ متغیرهای لازم را صریحاً با `passEnv` عبور دهید.
- ارجاع‌های راز هنگام فعال‌سازی به یک snapshot درون‌حافظه‌ای حل می‌شوند، سپس مسیرهای درخواست فقط snapshot را می‌خوانند.
- فیلترکردن سطح فعال هنگام فعال‌سازی اعمال می‌شود: ارجاع‌های حل‌نشده روی سطوح فعال باعث شکست startup/reload می‌شوند، در حالی که سطوح غیرفعال با diagnostics نادیده گرفته می‌شوند.

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

- نمایه‌های هر عامل در `<agentDir>/auth-profiles.json` ذخیره می‌شوند.
- `auth-profiles.json` برای حالت‌های اعتبارنامه ایستا از ارجاع‌های سطح مقدار (`keyRef` برای `api_key`، `tokenRef` برای `token`) پشتیبانی می‌کند.
- نگاشت‌های تخت قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را با پشتیبان `.legacy-flat.*.bak` به نمایه‌های API-key استاندارد `provider:default` بازنویسی می‌کند.
- نمایه‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های نمایه احراز هویت مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های ایستای زمان اجرا از اسنپ‌شات‌های حل‌شده درون‌حافظه‌ای می‌آیند؛ ورودی‌های ایستای قدیمی `auth.json` هنگام کشف پاک‌سازی می‌شوند.
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

- `billingBackoffHours`: عقب‌نشینی پایه بر حسب ساعت وقتی یک نمایه به دلیل خطاهای واقعی
  صورتحساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح صورتحساب
  همچنان می‌تواند حتی در پاسخ‌های `401`/`403` به اینجا برسد، اما تطبیق‌دهنده‌های متن
  مختص ارائه‌دهنده در محدوده همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای نمونه
  `Key limit exceeded` در OpenRouter). پیام‌های قابل تلاش مجدد HTTP `402` مربوط به پنجره مصرف یا
  محدودیت هزینه سازمان/فضای کاری به‌جای آن در مسیر `rate_limit`
  می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری برای ساعت‌های عقب‌نشینی صورتحساب به تفکیک ارائه‌دهنده.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی عقب‌نشینی صورتحساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: عقب‌نشینی پایه بر حسب دقیقه برای شکست‌های با اطمینان بالا از نوع `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد عقب‌نشینی `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجره چرخان بر حسب ساعت که برای شمارنده‌های عقب‌نشینی استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: بیشینه چرخش‌های نمایه احراز هویت در همان ارائه‌دهنده برای خطاهای بارگذاری بیش از حد، پیش از رفتن به جایگزین مدل (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` به اینجا می‌رسند.
- `overloadedBackoffMs`: تاخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/نمایه‌ای که بیش از حد بارگذاری شده است (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: بیشینه چرخش‌های نمایه احراز هویت در همان ارائه‌دهنده برای خطاهای محدودیت نرخ، پیش از رفتن به جایگزین مدل (پیش‌فرض: `1`). آن سطل محدودیت نرخ شامل متن‌های شکل‌داده‌شده توسط ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded` و `resource exhausted` است.

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

- فایل پیش‌فرض ثبت وقایع: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- برای یک مسیر پایدار، `logging.file` را تنظیم کنید.
- وقتی `--verbose` استفاده شود، `consoleLevel` به `debug` افزایش می‌یابد.
- `maxFileBytes`: بیشینه اندازه فایل فعال ثبت وقایع بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 MB). OpenClaw تا پنج آرشیو شماره‌دار را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: ماسک‌کردن با بیشترین تلاش برای خروجی کنسول، فایل‌های ثبت وقایع، رکوردهای ثبت OTLP، و متن رونوشت نشست ذخیره‌شده. `redactSensitive: "off"` فقط این سیاست عمومی ثبت وقایع/رونوشت را غیرفعال می‌کند؛ سطح‌های ایمنی UI/ابزار/عیب‌یابی همچنان پیش از انتشار، اسرار را مخفی می‌کنند.

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
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی ثبت وقایع هدفمند را فعال می‌کنند (از وایلدکارت‌هایی مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه برای طبقه‌بندی نشست‌های پردازشی طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled` یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک، و پیشرفت ACP تایمر را بازنشانی می‌کنند؛ عیب‌یابی‌های تکراری `session.stuck` تا زمانی که تغییری رخ ندهد عقب‌نشینی می‌کنند.
- `stuckSessionAbortMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه پیش از آنکه کار فعال متوقف‌شده واجد شرایط، برای بازیابی با تخلیه-لغو پایان داده شود. وقتی تنظیم نشده باشد، OpenClaw از پنجره ایمن‌تر و طولانی‌تر اجرای تعبیه‌شده، حداقل ۵ دقیقه و ۳ برابر `stuckSessionWarnMs`، استفاده می‌کند.
- `memoryPressureSnapshot`: وقتی فشار حافظه به `critical` می‌رسد، یک اسنپ‌شات پایداری ویرایش‌شده پیش از OOM می‌گیرد (پیش‌فرض: `false`). برای افزودن اسکن/نوشتن فایل بسته پایداری، در حالی که رویدادهای عادی فشار حافظه حفظ می‌شوند، روی `true` تنظیم کنید.
- `otel.enabled`: خط لوله صدور OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، کاتالوگ سیگنال، و مدل حریم خصوصی، [صدور OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: URL گردآورنده برای صدور OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP مخصوص سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فراداده HTTP/gRPC اضافی که همراه درخواست‌های صدور OTel ارسال می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: صدور ردگیری، معیارها، یا ثبت وقایع را فعال می‌کند.
- `otel.logsExporter`: مقصد صدور ثبت وقایع: `"otlp"` (پیش‌فرض)، `"stdout"` برای یک شیء JSON در هر خط stdout، یا `"both"`.
- `otel.sampleRate`: نرخ نمونه‌برداری ردگیری `0` تا `1`.
- `otel.flushIntervalMs`: فاصله تخلیه دوره‌ای دورسنجی بر حسب میلی‌ثانیه.
- `otel.captureContent`: گرفتن محتوای خام به‌صورت انتخابی برای ویژگی‌های span در OTEL. پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را می‌گیرد؛ شکل شیء به شما اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs`، `systemPrompt` و `toolDefinitions` را صراحتا فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای تازه‌ترین شکل آزمایشی span استنتاج GenAI، شامل نام‌های span به‌شکل `{gen_ai.operation.name} {gen_ai.request.model}`، نوع span برابر `CLIENT`، و `gen_ai.provider.name` به‌جای `gen_ai.system` قدیمی. به‌طور پیش‌فرض spanها برای سازگاری `openclaw.model.call` و `gen_ai.system` را حفظ می‌کنند؛ معیارهای GenAI از ویژگی‌های معنایی محدودشده استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از قبل یک SDK سراسری OpenTelemetry را ثبت کرده‌اند. سپس OpenClaw راه‌اندازی/خاموش‌سازی SDK تحت مالکیت Plugin را رد می‌کند، در حالی که شنونده‌های عیب‌یابی فعال می‌مانند.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`، و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطه پایانی مخصوص سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: اسنپ‌شات‌های ردگیری کش را برای اجراهای تعبیه‌شده ثبت می‌کند (پیش‌فرض: `false`).
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
- `auto.stableDelayHours`: کمینه تاخیر بر حسب ساعت پیش از اعمال خودکار کانال پایدار (پیش‌فرض: `6`؛ بیشینه: `168`).
- `auto.stableJitterHours`: پنجره پخش rollout اضافی برای کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ بیشینه: `168`).
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

- `enabled`: دروازه قابلیت سراسری ACP (پیش‌فرض: `true`؛ برای پنهان‌کردن امکانات dispatch و spawn در ACP روی `false` تنظیم کنید).
- `dispatch.enabled`: دروازه مستقل برای dispatch نوبت نشست ACP (پیش‌فرض: `true`). برای در دسترس نگه‌داشتن فرمان‌های ACP و در عین حال مسدودکردن اجرا، روی `false` تنظیم کنید.
- `backend`: شناسه پیش‌فرض بک‌اند زمان اجرای ACP (باید با یک Plugin زمان اجرای ACP ثبت‌شده مطابقت داشته باشد).
  ابتدا Plugin بک‌اند را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسه Plugin بک‌اند را وارد کنید (برای نمونه `acpx`) وگرنه بک‌اند ACP بارگذاری نمی‌شود.
- `defaultAgent`: شناسه عامل هدف جایگزین ACP وقتی spawnها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: فهرست مجاز شناسه‌های عامل که برای نشست‌های زمان اجرای ACP مجاز هستند؛ خالی بودن یعنی محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: بیشینه نشست‌های ACP همزمان فعال.
- `stream.coalesceIdleMs`: پنجره تخلیه بیکار بر حسب میلی‌ثانیه برای متن جریانی.
- `stream.maxChunkChars`: بیشینه اندازه قطعه پیش از تقسیم نمایش بلوک جریانی.
- `stream.repeatSuppression`: خط‌های وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی جریان می‌دهد؛ `"final_only"` تا رویدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: بیشینه تعداد نویسه‌های خروجی دستیار که در هر نوبت ACP نمایش داده می‌شوند.
- `stream.maxSessionUpdateChars`: بیشینه نویسه‌ها برای خط‌های وضعیت/به‌روزرسانی ACP نمایش‌داده‌شده.
- `stream.tagVisibility`: رکورد نام‌های برچسب به بازنویسی‌های بولی قابلیت مشاهده برای رویدادهای جریانی.
- `runtime.ttlMinutes`: TTL بیکار بر حسب دقیقه برای کارکنان نشست ACP پیش از واجد شرایط شدن برای پاک‌سازی.
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
  - `"random"` (`default`): شعارهای بامزه/فصلی چرخشی.
  - `"default"`: شعار خنثای ثابت (`All your chats, one OpenClaw.`).
  - `"off"`: بدون متن شعار (عنوان/نسخه بنر همچنان نمایش داده می‌شود).
- برای پنهان کردن کل بنر (نه فقط شعارها)، env را روی `OPENCLAW_HIDE_BANNER=1` تنظیم کنید.

---

## جادوگر

فراداده‌ای که فرایندهای راه‌اندازی هدایت‌شده CLI (`onboard`، `configure`، `doctor`) می‌نویسند:

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

فیلدهای هویت `agents.list` را زیر [پیش‌فرض‌های عامل](/fa/gateway/config-agents#agent-defaults) ببینید.

---

## پل (قدیمی، حذف‌شده)

بیلدهای فعلی دیگر شامل پل TCP نیستند. Nodeها از طریق Gateway WebSocket متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از شمای پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها ناموفق می‌شود؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت نگهداری نشست‌های اجرای Cron ایزوله تکمیل‌شده پیش از هرس از `sessions.json`. همچنین پاک‌سازی رونوشت‌های بایگانی‌شده Cron حذف‌شده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال کردن، `false` را تنظیم کنید.
- `runLog.maxBytes`: برای سازگاری با گزارش‌های اجرای Cron قدیمی مبتنی بر فایل پذیرفته می‌شود. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین ردیف‌های تاریخچه اجرای SQLite که برای هر کار نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن bearer که برای تحویل POST وب‌هوک Cron (`delivery.mode = "webhook"`) استفاده می‌شود؛ اگر حذف شود، هیچ سربرگ احرازهویتی ارسال نمی‌شود.
- `webhook`: URL وب‌هوک قدیمی و منسوخ‌شده به‌عنوان fallback (http/https) که `openclaw doctor --fix` برای مهاجرت کارهای ذخیره‌شده‌ای استفاده می‌کند که هنوز `notify: true` دارند؛ تحویل در زمان اجرا از `delivery.mode="webhook"` به‌همراه `delivery.to` برای هر کار، یا هنگام حفظ تحویل اعلان از `delivery.completionDestination` استفاده می‌کند.

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
- `retryOn`: انواع خطاهایی که باعث تلاش مجدد می‌شوند - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش مجدد روی همه انواع گذرا، آن را حذف کنید.

کارهای یک‌باره تا زمانی که تلاش‌های مجدد تمام شوند فعال می‌مانند، سپس با حفظ وضعیت خطای نهایی غیرفعال می‌شوند. کارهای تکرارشونده از همان سیاست تلاش مجدد گذرا استفاده می‌کنند تا پیش از بازه زمان‌بندی‌شده بعدی، پس از backoff دوباره اجرا شوند؛ خطاهای دائمی یا تمام شدن تلاش‌های مجدد گذرا با backoff خطا به زمان‌بندی تکرارشونده عادی برمی‌گردند.

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
- `mode`: حالت تحویل - `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به وب‌هوک پیکربندی‌شده پست می‌کند.
- `accountId`: شناسه اختیاری حساب یا کانال برای محدود کردن دامنه تحویل هشدار.

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
- `channel`: بازنویسی کانال برای تحویل اعلان. `"last"` آخرین کانال تحویل شناخته‌شده را دوباره استفاده می‌کند.
- `to`: هدف اعلان صریح یا URL وب‌هوک. برای حالت وب‌هوک الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- `delivery.failureDestination` برای هر کار این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست برای هر کار تنظیم نشده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌دهند، هنگام شکست به همان هدف اعلان اصلی fallback می‌کنند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

[کارهای Cron](/fa/automation/cron-jobs) را ببینید. اجراهای Cron ایزوله به‌عنوان [کارهای پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای قالب مدل رسانه

جانگهدارهای قالب که در `tools.media.models[].args` گسترش می‌یابند:

| متغیر             | توضیح                                                |
| ------------------ | ---------------------------------------------------- |
| `{{Body}}`         | بدنه کامل پیام ورودی                                |
| `{{RawBody}}`      | بدنه خام (بدون پوشش‌های تاریخچه/فرستنده)            |
| `{{BodyStripped}}` | بدنه با حذف اشاره‌های گروهی                         |
| `{{From}}`         | شناسه فرستنده                                       |
| `{{To}}`           | شناسه مقصد                                          |
| `{{MessageSid}}`   | شناسه پیام کانال                                    |
| `{{SessionId}}`    | UUID نشست فعلی                                      |
| `{{IsNewSession}}` | `"true"` هنگام ایجاد نشست جدید                      |
| `{{MediaUrl}}`     | شبه-URL رسانه ورودی                                 |
| `{{MediaPath}}`    | مسیر محلی رسانه                                     |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)                         |
| `{{Transcript}}`   | رونوشت صوتی                                         |
| `{{Prompt}}`       | prompt رسانه resolve‌شده برای ورودی‌های CLI         |
| `{{MaxChars}}`     | بیشینه نویسه‌های خروجی resolve‌شده برای ورودی‌های CLI |
| `{{ChatType}}`     | `"direct"` یا `"group"`                              |
| `{{GroupSubject}}` | موضوع گروه (در حد بهترین تلاش)                      |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد بهترین تلاش)            |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد بهترین تلاش)              |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد بهترین تلاش)              |
| `{{Provider}}`     | راهنمای provider (whatsapp، telegram، discord، و غیره) |

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
- آرایه‌ای از فایل‌ها: به‌ترتیب deep-merge می‌شوند (موارد بعدی موارد قبلی را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از includeها ادغام می‌شوند (مقادیر include‌شده را بازنویسی می‌کنند).
- includeهای تودرتو: تا عمق ۱۰ سطح.
- مسیرها: نسبت به فایل شامل‌کننده resolve می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا (`dirname` از `openclaw.json`) بمانند. فرم‌های مطلق/`../` فقط وقتی مجاز هستند که همچنان داخل آن مرز resolve شوند. مسیرها نباید بایت null داشته باشند و باید پیش و پس از resolve شدن، دقیقاً کوتاه‌تر از ۴۰۹۶ نویسه باشند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالا با پشتیبانی include تک‌فایلی را تغییر می‌دهند، مستقیماً در همان فایل include‌شده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- includeهای ریشه، آرایه‌های include، و includeهایی با بازنویسی‌های هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط خواندنی هستند؛ این نوشتن‌ها به‌جای flatten کردن پیکربندی، fail closed می‌شوند.
- خطاها: پیام‌های روشن برای فایل‌های گم‌شده، خطاهای parse، includeهای چرخه‌ای، قالب مسیر نامعتبر، و طول بیش از حد.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

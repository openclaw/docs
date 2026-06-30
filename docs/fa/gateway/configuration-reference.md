---
read_when:
    - به معناشناسی یا پیش‌فرض‌های دقیق پیکربندی در سطح فیلد نیاز دارید
    - شما در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای اصلی OpenClaw، پیش‌فرض‌ها و پیوندها به مراجع اختصاصی زیرسیستم‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-06-30T22:24:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c95497f4f76fd124505ffb9d0173e7e2adeeed82ee12812b2eca9673d5520fc4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی یک زیرسامانه مرجع عمیق‌تر خودش را دارد به آن پیوند می‌دهد. کاتالوگ‌های فرمان متعلق به کانال و plugin و تنظیمات عمیق حافظه/QMD در صفحه‌های جداگانه خودشان هستند، نه در این صفحه.

حقیقت کد:

- `openclaw config schema` JSON Schema زنده‌ای را که برای اعتبارسنجی و Control UI استفاده می‌شود چاپ می‌کند، و در صورت موجود بودن، فراداده‌های بسته‌بندی‌شده/plugin/کانال را در آن ادغام می‌کند
- `config.schema.lookup` یک گره schema محدود به مسیر را برای ابزارهای واکاوی برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش مبنای مستندات پیکربندی را در برابر سطح فعلی schema اعتبارسنجی می‌کند

مسیر جست‌وجوی عامل: پیش از ویرایش‌ها، از کنش ابزار `gateway` یعنی `config.schema.lookup` برای
مستندات و محدودیت‌های دقیق در سطح فیلد استفاده کنید. برای راهنمایی وظیفه‌محور از
[پیکربندی](/fa/gateway/configuration) استفاده کنید و از این صفحه
برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها، و پیوندها به مراجع زیرسامانه‌ها بهره بگیرید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations`، و پیکربندی dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [فرمان‌های اسلش](/fa/tools/slash-commands) برای کاتالوگ فعلی فرمان‌های داخلی + بسته‌بندی‌شده
- صفحه‌های مالک کانال/plugin برای سطوح فرمان اختصاصی کانال

قالب پیکربندی **JSON5** است (دیدگاه‌ها + ویرگول انتهایی مجازند). همه فیلدها اختیاری هستند - OpenClaw در صورت حذف شدن از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به یک صفحه اختصاصی منتقل شده‌اند - برای `channels.*`،
از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و دیگر
کانال‌های بسته‌بندی‌شده (احراز هویت، کنترل دسترسی، چندحسابی، gating اشاره)،
[پیکربندی - کانال‌ها](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های عامل، چندعاملی، نشست‌ها، و پیام‌ها

به یک صفحه اختصاصی منتقل شده است - ببینید
[پیکربندی - عامل‌ها](/fa/gateway/config-agents) برای:

- `agents.defaults.*` (فضای کاری، مدل، تفکر، heartbeat، حافظه، رسانه، Skills، sandbox)
- `multiAgent.*` (مسیریابی و اتصال‌های چندعاملی)
- `session.*` (چرخه عمر نشست، Compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر markdown)
- `talk.*` (حالت Talk)
  - `talk.consultThinkingLevel`: بازنویسی سطح تفکر برای اجرای کامل عامل OpenClaw پشت مشاوره‌های realtime در Control UI Talk
  - `talk.consultFastMode`: بازنویسی یک‌باره fast-mode برای مشاوره‌های realtime در Control UI Talk
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk در iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال رونوشت، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback رله Gateway برای رونوشت‌های نهایی‌شده realtime Talk که `openclaw_agent_consult` را رد می‌کنند

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، سوییچ‌های آزمایشی، پیکربندی ابزارهای پشتیبانی‌شده با ارائه‌دهنده، و راه‌اندازی
ارائه‌دهنده سفارشی / base-URL به یک صفحه اختصاصی منتقل شده‌اند - ببینید
[پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools).

## مدل‌ها

تعریف‌های ارائه‌دهنده، allowlistهای مدل، و راه‌اندازی ارائه‌دهنده سفارشی در
[پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) هستند.
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
- `models.providers.*.localService`: مدیر فرایند اختیاری و درخواستی برای
  سرورهای مدل محلی. OpenClaw endpoint سلامت پیکربندی‌شده را probe می‌کند، در صورت نیاز
  `command` مطلق را شروع می‌کند، منتظر آمادگی می‌ماند، سپس درخواست مدل را
  ارسال می‌کند. [سرویس‌های مدل محلی](/fa/gateway/local-model-services) را ببینید.
- `models.pricing.enabled`: bootstrap پس‌زمینه قیمت‌گذاری را که
  پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود کنترل می‌کند. وقتی `false` باشد،
  Gateway واکشی‌های کاتالوگ قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقدارهای پیکربندی‌شده
  `models.providers.*.models[].cost` همچنان برای برآورد هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط
OpenClaw جاسازی‌شده و دیگر adapterهای runtime مصرف می‌شوند. فرمان‌های `openclaw mcp list`،
`show`، `set`، و `unset` این block را بدون اتصال به
سرور هدف در هنگام ویرایش پیکربندی مدیریت می‌کنند.

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

- `mcp.servers`: تعریف‌های نام‌دار سرور stdio یا MCP راه‌دور برای runtimeهایی که
  ابزارهای MCP پیکربندی‌شده را در معرض می‌گذارند.
  ورودی‌های راه‌دور از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛
  `type: "http"` یک alias بومی CLI است که `openclaw mcp set` و
  `openclaw doctor --fix` آن را به فیلد canonical `transport` normalize می‌کنند.
- `mcp.servers.<name>.enabled`: روی `false` تنظیم کنید تا تعریف ذخیره‌شده سرور
  نگه داشته شود، در حالی که از کشف MCP جاسازی‌شده OpenClaw و projection ابزار کنار گذاشته می‌شود.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout درخواست MCP برای هر سرور
  بر حسب ثانیه یا میلی‌ثانیه.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout اتصال برای هر سرور
  بر حسب ثانیه یا میلی‌ثانیه.
- `mcp.servers.<name>.supportsParallelToolCalls`: hint اختیاری هم‌زمانی برای
  adapterهایی که می‌توانند تصمیم بگیرند آیا فراخوانی‌های ابزار MCP موازی صادر کنند.
- `mcp.servers.<name>.auth`: برای سرورهای HTTP MCP که به
  OAuth نیاز دارند، روی `"oauth"` تنظیم کنید. برای ذخیره tokenها زیر state OpenClaw، `openclaw mcp login <name>` را اجرا کنید.
- `mcp.servers.<name>.oauth`: بازنویسی‌های اختیاری scope OAuth، URL بازگشت، و URL فراداده client.
- `mcp.servers.<name>.sslVerify`، `clientCert`، `clientKey`: کنترل‌های HTTP TLS
  برای endpointهای خصوصی و mutual TLS.
- `mcp.servers.<name>.toolFilter`: انتخاب ابزار اختیاری برای هر سرور. `include`
  ابزارهای MCP کشف‌شده را به نام‌های مطابق محدود می‌کند؛ `exclude` نام‌های مطابق را پنهان می‌کند.
  ورودی‌ها نام‌های دقیق ابزار MCP یا globهای ساده `*` هستند. سرورهایی که
  resource یا prompt هم دارند نام‌های ابزار utility تولید می‌کنند (`resources_list`،
  `resources_read`، `prompts_list`، `prompts_get`)، و آن نام‌ها از همان
  filter استفاده می‌کنند.
- `mcp.servers.<name>.codex`: کنترل‌های اختیاری projection سرور برنامه Codex.
  این block فقط برای threadهای سرور برنامه Codex فراداده OpenClaw است؛ بر نشست‌های ACP،
  پیکربندی عمومی harness Codex، یا دیگر adapterهای runtime اثر نمی‌گذارد.
  `codex.agents` غیرخالی، سرور را به شناسه‌های عامل OpenClaw فهرست‌شده محدود می‌کند.
  فهرست‌های عامل scoped خالی، blank، یا نامعتبر توسط اعتبارسنجی پیکربندی رد می‌شوند
  و به‌جای اینکه global شوند، توسط مسیر projection runtime حذف می‌شوند.
  `codex.defaultToolsApprovalMode` مقدار بومی Codex یعنی
  `default_tools_approval_mode` را برای آن سرور emit می‌کند. OpenClaw پیش از ارسال
  پیکربندی بومی `mcp_servers` به Codex، block `codex` را حذف می‌کند. برای
  نگه داشتن projection سرور برای هر عامل سرور برنامه Codex با رفتار پیش‌فرض
  تأیید MCP در Codex، block را حذف کنید.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای runtimeهای MCP بسته‌بندی‌شده و محدود به نشست.
  اجراهای جاسازی‌شده یک‌باره cleanup پایان اجرا را درخواست می‌کنند؛ این TTL پشتوانه
  نشست‌های بلندمدت و callerهای آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP نشست cache‌شده hot-apply می‌شوند.
  کشف/استفاده بعدی ابزار آن‌ها را از پیکربندی جدید دوباره می‌سازد، بنابراین ورودی‌های حذف‌شده
  `mcp.servers` به‌جای انتظار برای TTL بیکاری، فوراً جمع‌آوری می‌شوند.
- کشف runtime همچنین اعلان‌های تغییر فهرست ابزار MCP را با حذف
  کاتالوگ cache‌شده برای آن نشست رعایت می‌کند. سرورهایی که resource یا
  prompt تبلیغ می‌کنند، ابزارهای utility برای فهرست‌کردن/خواندن resourceها و فهرست‌کردن/گرفتن
  promptها دریافت می‌کنند. شکست‌های تکراری فراخوانی ابزار، سرور متأثر را برای مدتی کوتاه
  پیش از تلاش برای فراخوانی دیگر متوقف می‌کند.

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

- `allowBundled`: allowlist اختیاری فقط برای Skills بسته‌بندی‌شده (Skills مدیریت‌شده/فضای کاری بی‌اثر می‌مانند).
- `load.extraDirs`: ریشه‌های skill مشترک اضافی (کمترین تقدم).
- `load.allowSymlinkTargets`: ریشه‌های هدف واقعی و مورد اعتماد که symlinkهای skill می‌توانند
  وقتی link بیرون از ریشه منبع پیکربندی‌شده‌اش قرار دارد به آن‌ها resolve شوند.
- `workshop.allowSymlinkTargetWrites`: به apply در Skill Workshop اجازه می‌دهد از طریق
  هدف‌های symlink از پیش مورد اعتماد write کند (پیش‌فرض: false).
- `install.preferBrew`: وقتی true باشد، در صورت در دسترس بودن `brew`،
  پیش از fallback به گونه‌های دیگر installer، installerهای Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح installer node برای specهای `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: به clientهای Gateway مورد اعتماد `operator.admin`
  اجازه می‌دهد archiveهای zip خصوصی stageشده از طریق `skills.upload.*` را install کنند
  (پیش‌فرض: false). این فقط مسیر archive آپلودشده را فعال می‌کند؛ installهای عادی ClawHub
  به آن نیاز ندارند.
- `entries.<skillKey>.enabled: false` یک skill را حتی اگر بسته‌بندی‌شده/install‌شده باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بر برای Skillsهایی که یک env var اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

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

- از شاخه‌های بسته یا پکیج زیر `~/.openclaw/extensions` و `<workspace>/.openclaw/extensions`، به‌همراه فایل‌ها یا شاخه‌های فهرست‌شده در `plugins.load.paths` بارگذاری می‌شود.
- فایل‌های Plugin مستقل را در `plugins.load.paths` قرار دهید؛ ریشه‌های افزونه که خودکار کشف می‌شوند فایل‌های سطح بالای `.js`، `.mjs` و `.ts` را نادیده می‌گیرند تا اسکریپت‌های کمکی در آن ریشه‌ها مانع شروع نشوند.
- کشف، Pluginهای بومی OpenClaw به‌همراه بسته‌های سازگار Codex و بسته‌های Claude، از جمله بسته‌های طرح پیش‌فرض Claude بدون مانیفست را می‌پذیرد.
- **تغییرات پیکربندی به راه‌اندازی مجدد Gateway نیاز دارند.**
- `allow`: فهرست مجاز اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` اولویت دارد.
- `plugins.entries.<id>.apiKey`: فیلد کمکی کلید API در سطح Plugin (وقتی توسط Plugin پشتیبانی شود).
- `plugins.entries.<id>.env`: نگاشت متغیرهای محیطی محدود به Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، هسته `before_prompt_build` را مسدود می‌کند و فیلدهای تغییردهنده پرامپت از `before_agent_start` قدیمی را نادیده می‌گیرد، در حالی که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. برای hookهای Plugin بومی و شاخه‌های hook ارائه‌شده توسط بسته‌های پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیر‌همراه مورداعتماد می‌توانند محتوای خام مکالمه را از hookهای تایپ‌شده مانند `llm_input`، `llm_output`، `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `before_agent_finalize` و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌صورت صریح به این Plugin اعتماد کنید تا برای اجراهای subagent پس‌زمینه، بازنویسی‌های `provider` و `model` در سطح هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: فهرست مجاز اختیاری از مقصدهای متعارف `provider/model` برای بازنویسی‌های subagent مورداعتماد. فقط وقتی از `"*"` استفاده کنید که عمداً می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.llm.allowModelOverride`: به‌صورت صریح به این Plugin اعتماد کنید تا برای `api.runtime.llm.complete` بازنویسی مدل درخواست کند.
- `plugins.entries.<id>.llm.allowedModels`: فهرست مجاز اختیاری از مقصدهای متعارف `provider/model` برای بازنویسی‌های تکمیل LLM توسط Plugin مورداعتماد. فقط وقتی از `"*"` استفاده کنید که عمداً می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: به‌صورت صریح به این Plugin اعتماد کنید تا `api.runtime.llm.complete` را روی یک شناسه عامل غیرپیش‌فرض اجرا کند.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (در صورت وجود، با schema Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/زمان اجرای Plugin کانال زیر `channels.<id>` قرار می‌گیرند و باید با metadata مربوط به `channelConfigs` در manifest همان Plugin مالک توصیف شوند، نه با یک رجیستری گزینه مرکزی OpenClaw.

### پیکربندی Plugin مهار Codex

Plugin همراه `codex` مالک تنظیمات مهار app-server بومی Codex زیر
`plugins.entries.codex.config` است. برای سطح کامل پیکربندی، به
[مرجع مهار Codex](/fa/plugins/codex-harness-reference) و برای مدل زمان اجرا به
[مهار Codex](/fa/plugins/codex-harness) مراجعه کنید.

`codexPlugins` فقط برای sessionهایی اعمال می‌شود که مهار بومی Codex را انتخاب می‌کنند.
این گزینه Pluginهای Codex را برای اجراهای provider در OpenClaw، پیوندهای مکالمه
ACP، یا هر مهار غیر Codex فعال نمی‌کند.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: پشتیبانی بومی
  Plugin/app را برای مهار Codex فعال می‌کند. پیش‌فرض: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سیاست پیش‌فرض اقدام مخرب برای elicitations مربوط به appهای Plugin مهاجرت‌داده‌شده.
  از `true` برای پذیرش schemaهای امن تأیید Codex بدون پرسش، از `false`
  برای رد آن‌ها، از `"auto"` برای هدایت تأییدهای موردنیاز Codex از طریق
  تأییدهای Plugin در OpenClaw، یا از `"always"` برای پرسش درباره هر اقدام نوشتنی/مخرب
  Plugin بدون تأیید پایدار استفاده کنید. حالت `"always"` بازنویسی‌های تأیید
  پایدار Codex در سطح هر ابزار را برای app متأثر، پیش از شروع thread پاک می‌کند.
  پیش‌فرض: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: یک ورودی
  Plugin مهاجرت‌داده‌شده را زمانی فعال می‌کند که `codexPlugins.enabled` سراسری نیز true باشد.
  پیش‌فرض: `true` برای ورودی‌های صریح.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هویت پایدار marketplace. نسخه V1 فقط از `"openai-curated"` پشتیبانی می‌کند.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هویت پایدار
  Plugin در Codex از مهاجرت، برای مثال `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  بازنویسی اقدام مخرب در سطح هر Plugin. اگر حذف شود، مقدار سراسری
  `allow_destructive_actions` استفاده می‌شود. مقدار سطح هر Plugin همان سیاست‌های
  `true`، `false`، `"auto"` یا `"always"` را می‌پذیرد.

`codexPlugins.enabled` دستور فعال‌سازی سراسری است. ورودی‌های صریح Plugin
که توسط مهاجرت نوشته می‌شوند، مجموعه پایدار نصب و واجد شرایط برای تعمیر هستند.
`plugins["*"]` پشتیبانی نمی‌شود، هیچ سوییچ `install` وجود ندارد، و مقادیر محلی
`marketplacePath` عمداً فیلد پیکربندی نیستند چون وابسته به میزبان‌اند.

بررسی‌های آمادگی `app/list` به‌مدت یک ساعت cache می‌شوند و هنگام قدیمی‌شدن
به‌صورت ناهمگام تازه‌سازی می‌شوند. پیکربندی app مربوط به thread در Codex هنگام
برقراری session مهار Codex محاسبه می‌شود، نه در هر نوبت؛ پس از تغییر پیکربندی
Plugin بومی، از `/new`، `/reset` یا راه‌اندازی مجدد Gateway استفاده کنید.

- `plugins.entries.firecrawl.config.webFetch`: تنظیمات provider برای واکشی وب Firecrawl.
  - `apiKey`: کلید API اختیاری Firecrawl برای محدودیت‌های بالاتر (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، مقدار قدیمی `tools.web.fetch.firecrawl.apiKey`، یا متغیر محیطی `FIRECRAWL_API_KEY` fallback می‌کند.
  - `baseUrl`: URL پایه API Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ بازنویسی‌های خودمیزبان باید مقصدهای خصوصی/داخلی را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی را از صفحه‌ها استخراج کن (پیش‌فرض: `true`).
  - `maxAgeMs`: حداکثر عمر cache بر حسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: timeout درخواست scrape بر حسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جست‌وجوی وب Grok).
  - `enabled`: provider مربوط به X Search را فعال کن.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مثلاً `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات dreaming حافظه. برای فازها و آستانه‌ها به [Dreaming](/fa/concepts/dreaming) مراجعه کنید.
  - `enabled`: سوییچ اصلی dreaming (پیش‌فرض `false`).
  - `frequency`: cadence کرون برای هر sweep کامل dreaming (به‌صورت پیش‌فرض `"0 3 * * *"`).
  - `model`: بازنویسی اختیاری مدل subagent مربوط به Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدودکردن مقصدها با `allowedModels` همراه کنید. خطاهای در دسترس نبودن مدل یک بار با مدل پیش‌فرض session دوباره تلاش می‌شوند؛ خطاهای اعتماد یا فهرست مجاز بی‌صدا fallback نمی‌کنند.
  - سیاست فاز و آستانه‌ها جزئیات پیاده‌سازی‌اند (کلیدهای پیکربندی کاربرمحور نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای فعال‌شده در بسته‌های Claude نیز می‌توانند پیش‌فرض‌های جاسازی‌شده OpenClaw را از `settings.json` ارائه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات پاک‌سازی‌شده عامل اعمال می‌کند، نه به‌عنوان patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin فعال حافظه را انتخاب کنید، یا برای غیرفعال‌کردن Pluginهای حافظه از `"none"` استفاده کنید.
- `plugins.slots.contextEngine`: شناسه Plugin فعال موتور context را انتخاب کنید؛ پیش‌فرض `"legacy"` است مگر اینکه موتور دیگری را نصب و انتخاب کنید.

به [Plugins](/fa/tools/plugin) مراجعه کنید.

---

## تعهدات

`commitments` حافظه پیگیری استنتاج‌شده را کنترل می‌کند: OpenClaw می‌تواند check-inها را از نوبت‌های مکالمه تشخیص دهد و آن‌ها را از طریق اجراهای Heartbeat تحویل دهد.

- `commitments.enabled`: استخراج مخفی LLM، ذخیره‌سازی، و تحویل Heartbeat را برای تعهدات پیگیری استنتاج‌شده فعال می‌کند. پیش‌فرض: `false`.
- `commitments.maxPerDay`: حداکثر تعهدات پیگیری استنتاج‌شده که در یک روز غلتان برای هر session عامل تحویل داده می‌شود. پیش‌فرض: `3`.

به [تعهدات استنتاج‌شده](/fa/concepts/commitments) مراجعه کنید.

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
- `tabCleanup` زبانه‌های ردیابی‌شده‌ی عامل اصلی را پس از زمان بیکاری یا وقتی یک
  نشست از سقف خود فراتر می‌رود، بازپس می‌گیرد. برای غیرفعال کردن هرکدام از آن
  حالت‌های پاک‌سازی جداگانه، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین ناوبری مرورگر به‌طور پیش‌فرض سخت‌گیرانه می‌ماند.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را فقط وقتی تنظیم کنید که عمداً به ناوبری مرورگر در شبکه‌ی خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقطه‌پایان‌های پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترسی‌پذیری/کشف، مشمول همان مسدودسازی شبکه‌ی خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- پروفایل‌های راه‌دور فقط پیوست‌کردنی هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl`، `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند از HTTP(S) استفاده کنید؛
  وقتی ارائه‌دهنده‌ی شما یک URL مستقیم DevTools WebSocket می‌دهد، از WS(S) استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترسی‌پذیری CDP راه‌دور و
  `attachOnly` و همچنین درخواست‌های بازکردن زبانه اعمال می‌شوند. پروفایل‌های
  loopback مدیریت‌شده پیش‌فرض‌های CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP مدیریت‌شده‌ی بیرونی از طریق loopback در دسترس است، برای آن
  پروفایل `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw پورت loopback را
  به‌عنوان یک پروفایل مرورگر مدیریت‌شده‌ی محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت پورت محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل پیوست شوند.
- پروفایل‌های `existing-session` می‌توانند `userDataDir` را تنظیم کنند تا یک پروفایل
  مشخص مرورگر مبتنی بر Chromium، مانند Brave یا Edge، هدف قرار گیرد.
- پروفایل‌های `existing-session` می‌توانند وقتی Chrome از قبل پشت یک نقطه‌پایان کشف HTTP(S) مربوط به DevTools یا نقطه‌پایان مستقیم WS(S) در حال اجرا است، `cdpUrl` را تنظیم کنند. در آن
  حالت OpenClaw به‌جای استفاده از اتصال خودکار، نقطه‌پایان را به Chrome MCP می‌دهد؛
  `userDataDir` برای آرگومان‌های راه‌اندازی Chrome MCP نادیده گرفته می‌شود.
- پروفایل‌های `existing-session` محدودیت‌های فعلی مسیر Chrome MCP را حفظ می‌کنند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری انتخابگر CSS، قلاب‌های بارگذاری یک‌فایلی،
  بدون بازنویسی زمان‌پایان گفت‌وگو، بدون `wait --load networkidle`، و بدون
  `responsebody`، خروجی PDF، رهگیری دانلود، یا کنش‌های دسته‌ای.
- پروفایل‌های محلی مدیریت‌شده‌ی `openclaw`، `cdpPort` و `cdpUrl` را خودکار اختصاص می‌دهند؛
  `cdpUrl` را فقط برای پروفایل‌های CDP راه‌دور یا پیوست نقطه‌پایان existing-session
  به‌طور صریح تنظیم کنید.
- پروفایل‌های محلی مدیریت‌شده می‌توانند `executablePath` را تنظیم کنند تا مقدار سراسری
  `browser.executablePath` برای آن پروفایل بازنویسی شود. از این برای اجرای یک پروفایل در
  Chrome و پروفایلی دیگر در Brave استفاده کنید.
- پروفایل‌های محلی مدیریت‌شده پس از شروع فرایند، برای کشف HTTP مربوط به Chrome CDP از `browser.localLaunchTimeoutMs`
  و برای آماده‌بودن websocket مربوط به CDP پس از راه‌اندازی از `browser.localCdpReadyTimeoutMs` استفاده می‌کنند. آن‌ها را روی میزبان‌های کندتر که Chrome
  با موفقیت شروع می‌شود اما بررسی‌های آماده‌بودن با راه‌اندازی رقابت می‌کنند، افزایش دهید. هر دو مقدار باید
  عدد صحیح مثبت تا `120000` میلی‌ثانیه باشند؛ مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را پیش از راه‌اندازی Chromium برای پوشه‌ی خانگی سیستم‌عامل شما می‌پذیرند.
  `userDataDir` مخصوص هر پروفایل در پروفایل‌های `existing-session` نیز با tilde گسترش داده می‌شود.
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
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: رنگ تأکیدی برای قاب رابط کاربری برنامه‌ی بومی (ته‌رنگ حباب Talk Mode و مانند آن).
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

<Accordion title="Gateway field details">

- `mode`: `local` (اجرای gateway) یا `remote` (اتصال به gateway راه‌دور). Gateway شروع به کار را نمی‌پذیرد مگر اینکه `local` باشد.
- `port`: یک پورت مالتی‌پلکس‌شده واحد برای WS + HTTP. تقدم: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP متعلق به Tailscale)، یا `custom`.
- **نام‌های مستعار قدیمی bind**: در `gateway.bind` از مقادیر حالت bind (`auto`، `loopback`، `lan`، `tailnet`، `custom`) استفاده کنید، نه نام‌های مستعار میزبان (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **یادداشت Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکه‌بندی Docker bridge (`-p 18789:18789`)، ترافیک روی `eth0` می‌رسد، بنابراین gateway دسترس‌پذیر نیست. از `--network host` استفاده کنید، یا `bind: "lan"` را تنظیم کنید (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) تا روی همه رابط‌ها گوش بدهد.
- **احراز هویت**: به‌صورت پیش‌فرض لازم است. bindهای غیر-loopback به احراز هویت gateway نیاز دارند. در عمل یعنی یک توکن/گذرواژه مشترک یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. راه‌انداز onboarding به‌صورت پیش‌فرض یک توکن تولید می‌کند.
- اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند (از جمله SecretRefها)، `gateway.auth.mode` را صراحتا روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، جریان‌های startup و نصب/تعمیر سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای راه‌اندازی‌های مورد اعتماد local loopback استفاده کنید؛ این حالت عمدا در promptهای onboarding ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک reverse proxy آگاه از هویت واگذار کنید و به headerهای هویت از `gateway.trustedProxies` اعتماد کنید (ببینید [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth)). این حالت به‌صورت پیش‌فرض انتظار یک منبع proxy **غیر-loopback** دارد؛ reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی روی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان fallback مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار و انحصاری است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، headerهای هویت Tailscale Serve می‌توانند احراز هویت Control UI/WebSocket را تأمین کنند (با `tailscale whois` بررسی می‌شود). endpointهای HTTP API از آن احراز هویت header متعلق به Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت عادی احراز هویت HTTP gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان gateway مورد اعتماد است. وقتی `tailscale.mode = "serve"` باشد، پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکننده اختیاری برای احراز هویت ناموفق. به‌ازای هر IP کلاینت و هر scope احراز هویت اعمال می‌شود (shared-secret و device-token مستقل از هم ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر async مربوط به Tailscale Serve Control UI، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از ثبت failure به‌صورت ترتیبی پردازش می‌شوند. بنابراین تلاش‌های بد هم‌زمان از یک کلاینت می‌توانند در درخواست دوم محدودکننده را فعال کنند، به‌جای اینکه هر دو مثل عدم‌تطابق ساده هم‌زمان عبور کنند.
  - `gateway.auth.rateLimit.exemptLoopback` به‌صورت پیش‌فرض `true` است؛ وقتی عمدا می‌خواهید ترافیک localhost هم rate-limit شود، آن را روی `false` بگذارید (برای راه‌اندازی‌های تستی یا استقرارهای proxy سخت‌گیرانه).
- تلاش‌های احراز هویت WS با origin مرورگر همیشه با معافیت loopback غیرفعال throttle می‌شوند (دفاع چندلایه در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، آن lockoutهای با origin مرورگر به‌ازای هر مقدار `Origin`
  نرمال‌شده جدا می‌شوند، بنابراین failureهای تکراری از یک origin متعلق به localhost به‌صورت خودکار
  یک origin دیگر را قفل نمی‌کنند.
- `tailscale.mode`: `serve` (فقط tailnet، bind از نوع loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `tailscale.serviceName`: نام اختیاری Tailscale Service برای حالت Serve، مانند
  `svc:openclaw`. وقتی تنظیم شود، OpenClaw آن را به `tailscale serve
--service` پاس می‌دهد تا Control UI به‌جای hostname دستگاه از طریق یک Service نام‌دار در دسترس قرار گیرد. مقدار باید از قالب نام Service در Tailscale یعنی `svc:<dns-label>`
  استفاده کند؛ startup نشانی URL مشتق‌شده Service را گزارش می‌کند.
- `tailscale.preserveFunnel`: وقتی `true` باشد و `tailscale.mode = "serve"`، OpenClaw
  پیش از اعمال دوباره Serve در startup، `tailscale funnel status` را بررسی می‌کند و اگر یک مسیر Funnel پیکربندی‌شده بیرونی از قبل پورت gateway را پوشش دهد،
  از آن می‌گذرد. پیش‌فرض `false` است.
- `controlUi.allowedOrigins`: allowlist صریح origin مرورگر برای اتصال‌های Gateway WebSocket. برای originهای عمومی غیر-loopback مرورگر لازم است. بارگذاری‌های UI خصوصی same-origin روی LAN/Tailnet از loopback، RFC1918/link-local، `.local`، `.ts.net`، یا میزبان‌های CGNAT متعلق به Tailscale بدون فعال‌کردن fallback بر اساس Host-header پذیرفته می‌شوند.
- `controlUi.chatMessageMaxWidth`: max-width اختیاری برای پیام‌های چت گروه‌بندی‌شده Control UI. مقادیر محدودشده عرض CSS مانند `960px`، `82%`، `min(1280px, 82%)` و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناک که fallback مربوط به origin بر اساس Host-header را برای استقرارهایی فعال می‌کند که عمدا به سیاست origin بر پایه Host-header متکی‌اند.
- `remote.transport`: `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، `remote.url` برای میزبان‌های عمومی باید `wss://` باشد؛ متن ساده `ws://` فقط برای loopback، LAN، link-local، `.local`، `.ts.net` و میزبان‌های CGNAT متعلق به Tailscale پذیرفته می‌شود.
- `remote.remotePort`: پورت gateway روی میزبان SSH راه‌دور. پیش‌فرض `18789` است؛ وقتی پورت tunnel محلی با پورت gateway راه‌دور متفاوت است از این استفاده کنید.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامه کلاینت راه‌دور هستند. این‌ها به‌تنهایی احراز هویت gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: نشانی پایه HTTPS برای relay بیرونی APNs که پس از انتشار registrationها توسط buildهای iOS مبتنی بر relay به gateway استفاده می‌شود. buildهای عمومی App Store/TestFlight از relay میزبانی‌شده OpenClaw استفاده می‌کنند. URLهای relay سفارشی باید با مسیر build/استقرار iOS عامدانه جداگانه‌ای مطابقت داشته باشند که URL relay آن به همان relay اشاره می‌کند.
- `gateway.push.apns.relay.timeoutMs`: timeout ارسال gateway به relay برحسب میلی‌ثانیه. پیش‌فرض `10000` است.
- registrationهای مبتنی بر relay به یک هویت مشخص gateway واگذار می‌شوند. اپ iOS جفت‌شده `gateway.identity.get` را دریافت می‌کند، آن هویت را در registration relay قرار می‌دهد و یک مجوز ارسال scoped به registration را به gateway فوروارد می‌کند. یک gateway دیگر نمی‌تواند آن registration ذخیره‌شده را دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه خروج فقط توسعه برای URLهای relay HTTP روی loopback. URLهای relay production باید روی HTTPS بمانند.
- `gateway.handshakeTimeoutMs`: timeout handshake پیش از احراز هویت Gateway WebSocket برحسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد تقدم دارد. این مقدار را روی میزبان‌های پر بار یا کم‌قدرت که کلاینت‌های محلی می‌توانند هنگام هنوز پایدارشدن warmup startup وصل شوند، افزایش دهید.
- `gateway.channelHealthCheckMinutes`: فاصله monitor سلامت channel برحسب دقیقه. برای غیرفعال‌کردن restartهای health-monitor به‌صورت سراسری، `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانه stale-socket برحسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: حداکثر restartهای health-monitor برای هر channel/account در یک ساعت rolling. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: انصراف به‌ازای هر channel از restartهای health-monitor درحالی‌که monitor سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override به‌ازای هر account برای channelهای چند-account. وقتی تنظیم شود، بر override سطح channel تقدم دارد.
- مسیرهای فراخوانی gateway محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolution به‌صورت fail-closed شکست می‌خورد (بدون اینکه fallback راه‌دور آن را پنهان کند).
- `trustedProxies`: IPهای reverse proxy که TLS را terminate می‌کنند یا headerهای forwarded-client تزریق می‌کنند. فقط proxyهایی را فهرست کنید که کنترلشان را دارید. entryهای loopback همچنان برای راه‌اندازی‌های proxy/local-detection روی همان میزبان معتبرند (برای مثال Tailscale Serve یا یک reverse proxy محلی)، اما درخواست‌های loopback را واجد شرایط `gateway.auth.mode: "trusted-proxy"` نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` وجود نداشته باشد gateway مقدار `X-Real-IP` را می‌پذیرد. پیش‌فرض `false` است تا رفتار fail-closed باشد.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای تأیید خودکار جفت‌سازی نخستین‌بار node device بدون scopeهای درخواستی. وقتی تنظیم نشده باشد غیرفعال است. این مورد جفت‌سازی operator/browser/Control UI/WebChat را خودکار تأیید نمی‌کند، و upgradeهای role، scope، metadata یا public-key را نیز خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی allow/deny سراسری برای commandهای اعلام‌شده node پس از جفت‌سازی و ارزیابی allowlist پلتفرم. برای opt in به commandهای خطرناک node مانند `camera.snap`، `camera.clip` و `screen.record` از `allowCommands` استفاده کنید؛ `denyCommands` یک command را حذف می‌کند حتی اگر یک پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل می‌شد. پس از اینکه یک node فهرست command اعلام‌شده خود را تغییر داد، جفت‌سازی آن دستگاه را رد و دوباره تأیید کنید تا gateway snapshot به‌روزشده command را ذخیره کند.
- `gateway.tools.deny`: نام‌های tool اضافی که برای HTTP `POST /tools/invoke` مسدود شده‌اند (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام‌های tool را از فهرست deny پیش‌فرض HTTP برای
  فراخوان‌های owner/admin حذف می‌کند. این کار فراخوان‌های دارای هویت `operator.write`
  را به دسترسی owner/admin ارتقا نمی‌دهد؛ `cron`، `gateway` و `nodes` حتی وقتی allowlist شده باشند
  همچنان برای فراخوان‌های غیر-owner دردسترس نیستند.

</Accordion>

### endpointهای سازگار با OpenAI

- RPC مدیریتی HTTP: به‌صورت پیش‌فرض به‌عنوان Plugin `admin-http-rpc` خاموش است. Plugin را فعال کنید تا `POST /api/v1/admin/rpc` ثبت شود. ببینید [RPC مدیریتی HTTP](/fa/plugins/admin-http-rpc).
- Chat Completions: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL در Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی به‌عنوان تنظیم‌نشده در نظر گرفته می‌شوند؛ برای غیرفعال‌کردن دریافت URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- header اختیاری برای سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای originهای HTTPS که کنترلشان را دارید تنظیم کنید؛ ببینید [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### جداسازی چند instance

چند gateway را روی یک میزبان با پورت‌ها و دایرکتوری‌های state یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

flagهای میان‌بر: `--dev` (از `~/.openclaw-dev` + پورت `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

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

- `enabled`: termination مربوط به TLS را روی listener gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده باشند، یک جفت cert/key محلی خودامضا تولید می‌کند؛ فقط برای استفاده local/dev.
- `certPath`: مسیر filesystem به فایل گواهی TLS.
- `keyPath`: مسیر filesystem به فایل private key متعلق به TLS؛ دسترسی آن را محدود نگه دارید.
- `caPath`: مسیر اختیاری CA bundle برای بررسی کلاینت یا زنجیره‌های trust سفارشی.

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
  - `"restart"`: همیشه فرایند Gateway را هنگام تغییر پیکربندی راه‌اندازی مجدد کن.
  - `"hot"`: تغییرات را بدون راه‌اندازی مجدد، درون همان فرایند اعمال کن.
  - `"hybrid"` (پیش‌فرض): ابتدا بارگذاری مجدد داغ را امتحان کن؛ در صورت نیاز به راه‌اندازی مجدد برگرد.
- `debounceMs`: پنجره‌ی debounce بر حسب ms پیش از اعمال تغییرات پیکربندی (عدد صحیح نامنفی).
- `deferralTimeoutMs`: حداکثر زمان اختیاری بر حسب ms برای انتظار تا پایان عملیات در حال اجرا، پیش از اجبار به راه‌اندازی مجدد یا بارگذاری مجدد داغ کانال. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای درباره‌ی موارد همچنان در انتظار، آن را روی `0` بگذارید.

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
توکن‌های هوک در رشته‌ی پرس‌وجو رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به یک `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید از احراز هویت shared-secret فعال Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) متمایز باشد؛ هنگام شناسایی استفاده‌ی دوباره، راه‌اندازی یک هشدار امنیتی غیرکشنده ثبت می‌کند.
- `openclaw security audit` استفاده‌ی دوباره از احراز هویت هوک/Gateway را به‌عنوان یافته‌ای بحرانی علامت‌گذاری می‌کند، از جمله احراز هویت گذرواژه‌ی Gateway که فقط در زمان audit ارائه شده باشد (`--auth password --password <password>`). برای چرخاندن یک `hooks.token` پایدار که دوباره استفاده شده است، `openclaw doctor --fix` را اجرا کنید، سپس فرستنده‌های هوک خارجی را به‌روزرسانی کنید تا از توکن هوک جدید استفاده کنند.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیرمسیر اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا preset از `sessionKey` قالب‌دار استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این opt-in نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از بار درخواست فقط وقتی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقادیر `sessionKey` نگاشت که با قالب رندر شده‌اند، به‌عنوان مقدارهای ارائه‌شده از بیرون در نظر گرفته می‌شوند و همچنین به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="Mapping details">

- `match.path` زیرمسیر بعد از `/hooks` را تطبیق می‌دهد (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` یک فیلد بار را برای مسیرهای عمومی تطبیق می‌دهد.
- قالب‌هایی مانند `{{messages[0].subject}}` از بار می‌خوانند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش هوک برمی‌گرداند.
  - `transform.module` باید مسیر نسبی باشد و درون `hooks.transformsDir` بماند (مسیرهای مطلق و traversal رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های workspace skill رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transforms هوک‌ها منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک agent مشخص مسیریابی می‌کند؛ شناسه‌های ناشناخته به agent پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: مسیریابی مؤثر agent را محدود می‌کند، از جمله مسیر agent پیش‌فرض وقتی `agentId` حذف شده باشد (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید نشست ثابت اختیاری برای اجرای agent هوک بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای نشست نگاشت مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: allowlist اختیاری پیشوند برای مقادیر صریح `sessionKey` (درخواست + نگاشت)، مثلاً `["hook:"]`. وقتی هر نگاشت یا preset از `sessionKey` قالب‌دار استفاده کند، الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ `channel` به‌طور پیش‌فرض `last` است.
- `model`، LLM را برای این اجرای هوک بازنویسی می‌کند (اگر فهرست مدل تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- preset داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر این مسیریابی برای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را محدود کنید تا با namespace مربوط به Gmail هم‌خوان باشد، برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، preset را به‌جای پیش‌فرض قالب‌دار با یک `sessionKey` ایستا بازنویسی کنید.

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

- Gateway هنگام پیکربندی، `gog gmail watch serve` را در زمان بوت به‌صورت خودکار شروع می‌کند. برای غیرفعال‌سازی، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
- یک `gog gmail watch serve` جداگانه را در کنار Gateway اجرا نکنید.

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

- HTML/CSS/JS قابل ویرایش توسط agent و A2UI را از طریق HTTP زیر پورت Gateway ارائه می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- اتصال‌های غیر local loopback: مسیرهای canvas به احراز هویت Gateway نیاز دارند (token/password/trusted-proxy)، همانند سایر سطوح HTTP مربوط به Gateway.
- Node WebViews معمولاً سرآیندهای احراز هویت را ارسال نمی‌کنند؛ پس از جفت‌شدن و اتصال یک node، Gateway نشانی‌های قابلیت محدود به node را برای دسترسی به canvas/A2UI اعلام می‌کند.
- نشانی‌های قابلیت به نشست WS فعال node محدودند و به‌سرعت منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت live-reload را در HTML ارائه‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را به‌صورت خودکار می‌سازد.
- همچنین A2UI را در `/__openclaw__/a2ui/` ارائه می‌کند.
- تغییرات به راه‌اندازی مجدد gateway نیاز دارند.
- برای دایرکتوری‌های بزرگ یا خطاهای `EMFILE`، live reload را غیرفعال کنید.

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

- `minimal` (پیش‌فرض وقتی Plugin بسته‌بندی‌شده‌ی `bonjour` فعال باشد): `cliPath` + `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: شامل `cliPath` + `sshPort` می‌شود؛ تبلیغ multicast در LAN همچنان به فعال بودن Plugin بسته‌بندی‌شده‌ی `bonjour` نیاز دارد.
- `off`: تبلیغ multicast در LAN را بدون تغییر فعال‌سازی Plugin سرکوب می‌کند.
- Plugin بسته‌بندی‌شده‌ی `bonjour` روی میزبان‌های macOS به‌صورت خودکار شروع می‌شود و روی Linux، Windows، و استقرارهای کانتینری Gateway به‌صورت opt-in است.
- نام میزبان وقتی یک برچسب DNS معتبر باشد، به‌طور پیش‌فرض نام میزبان سیستم است و در غیر این صورت به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` بازنویسی کنید.

### گستره‌ی وسیع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک ناحیه DNS-SD یک‌پخشی را زیر `~/.openclaw/dns/` می‌نویسد. برای کشف میان‌شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + Tailscale split DNS همراه کنید.

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

- متغیرهای محیطی درون‌خطی فقط وقتی اعمال می‌شوند که محیط پردازه آن کلید را نداشته باشد.
- فایل‌های `.env`: فایل `.env` در CWD + `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
- `shellEnv`: کلیدهای مورد انتظارِ موجودنبودن را از پروفایل پوسته ورود شما وارد می‌کند.
- برای تقدم کامل، [محیط](/fa/help/environment) را ببینید.

### جایگزینی متغیر محیطی

در هر رشته پیکربندی، با `${VAR_NAME}` به متغیرهای محیطی ارجاع دهید:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- فقط نام‌های حروف بزرگ تطبیق داده می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای موجودنبودن/خالی هنگام بارگذاری پیکربندی خطا می‌دهند.
- برای مقدار لفظی `${VAR}` با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## Secrets

ارجاع‌های Secret افزایشی هستند: مقدارهای متن ساده همچنان کار می‌کنند.

### `SecretRef`

از یک شکل شیء استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی شناسه `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- شناسه `source: "file"`: اشاره‌گر JSON مطلق (برای مثال `"/providers/openai/apiKey"`)
- الگوی شناسه `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (گزینشگرهای سبک AWS مثل `secret#json_key` را پشتیبانی می‌کند)
- شناسه‌های `source: "exec"` نباید شامل بخش‌های مسیر جداشده با اسلشِ `.` یا `..` باشند (برای مثال `a/../b` رد می‌شود)

### سطح اعتبارنامه پشتیبانی‌شده

- ماتریس canonical: [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای اعتبارنامه پشتیبانی‌شده `openclaw.json` را هدف می‌گیرد.
- ارجاع‌های `auth-profiles.json` در حل‌وفصل زمان اجرا و پوشش ممیزی گنجانده می‌شوند.

### پیکربندی ارائه‌دهندگان Secret

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
- وقتی تأیید ACL ویندوز در دسترس نباشد، مسیرهای ارائه‌دهنده فایل و exec fail closed می‌شوند. `allowInsecurePath: true` را فقط برای مسیرهای مورد اعتمادی تنظیم کنید که نمی‌توان آن‌ها را تأیید کرد.
- ارائه‌دهنده `exec` به یک مسیر مطلق `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌صورت پیش‌فرض، مسیرهای فرمان symlink رد می‌شوند. برای مجاز کردن مسیرهای symlink هم‌زمان با اعتبارسنجی مسیر هدف حل‌شده، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی دایرکتوری مورد اعتماد روی مسیر هدف حل‌شده اعمال می‌شود.
- محیط فرزند `exec` به‌صورت پیش‌فرض حداقلی است؛ متغیرهای لازم را صریحاً با `passEnv` عبور دهید.
- ارجاع‌های Secret هنگام فعال‌سازی به یک snapshot درون‌حافظه‌ای حل می‌شوند، سپس مسیرهای درخواست فقط snapshot را می‌خوانند.
- فیلتر سطح فعال هنگام فعال‌سازی اعمال می‌شود: ارجاع‌های حل‌نشده روی سطح‌های فعال باعث شکست راه‌اندازی/بارگذاری مجدد می‌شوند، درحالی‌که سطح‌های غیرفعال با diagnostics رد می‌شوند.

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
- نگاشت‌های تخت قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را با یک پشتیبان `.legacy-flat.*.bak` به پروفایل‌های کلید API متعارف `provider:default` بازنویسی می‌کند.
- پروفایل‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های پروفایل احراز هویت مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های ایستای زمان اجرا از نماگرفت‌های حل‌شدهٔ درون حافظه می‌آیند؛ ورودی‌های ایستای قدیمی `auth.json` هنگام کشف پاک‌سازی می‌شوند.
- واردسازی‌های OAuth قدیمی از `~/.openclaw/credentials/oauth.json` انجام می‌شود.
- ببینید [OAuth](/fa/concepts/oauth).
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

- `billingBackoffHours`: عقب‌نشینی پایه بر حسب ساعت وقتی یک پروفایل به‌دلیل خطاهای واقعی
  صورتحساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح صورتحساب
  همچنان می‌تواند حتی در پاسخ‌های `401`/`403` به اینجا برسد، اما تطبیق‌دهنده‌های متن
  اختصاصی ارائه‌دهنده در محدودهٔ همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای نمونه OpenRouter
  `Key limit exceeded`). پیام‌های قابل‌تلاش‌مجدد HTTP `402` مربوط به پنجرهٔ مصرف یا
  سقف هزینهٔ سازمان/فضای کاری در عوض در مسیر `rate_limit`
  می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری برای هر ارائه‌دهنده برای ساعت‌های عقب‌نشینی صورتحساب.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی عقب‌نشینی صورتحساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: عقب‌نشینی پایه بر حسب دقیقه برای شکست‌های با اطمینان بالا از نوع `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد عقب‌نشینی `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجرهٔ غلتان بر حسب ساعت که برای شمارنده‌های عقب‌نشینی استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای بارگذاری بیش‌ازحد پیش از تغییر به جایگزین مدل (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` به اینجا می‌رسند.
- `overloadedBackoffMs`: تاخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/پروفایل بارگذاری‌شدهٔ بیش‌ازحد (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای محدودیت نرخ پیش از تغییر به جایگزین مدل (پیش‌فرض: `1`). آن سطل محدودیت نرخ شامل متن‌های شکل‌گرفته توسط ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، و `resource exhausted` است.

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
- `consoleLevel` هنگام استفاده از `--verbose` به `debug` افزایش می‌یابد.
- `maxFileBytes`: حداکثر اندازهٔ فایل گزارش فعال بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 MB). OpenClaw تا پنج بایگانی شماره‌گذاری‌شده را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن بر پایهٔ بهترین تلاش برای خروجی کنسول، گزارش‌های فایل، رکوردهای گزارش OTLP، و متن رونوشت نشست‌های ماندگار. `redactSensitive: "off"` فقط این خط‌مشی عمومی گزارش/رونوشت را غیرفعال می‌کند؛ سطوح ایمنی UI/ابزار/تشخیصی همچنان اسرار را پیش از انتشار حذف می‌کنند.

---

## تشخیص‌ها

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
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی گزارش هدفمند را فعال می‌کنند (از نویسه‌های عام مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانهٔ سن بدون پیشرفت بر حسب میلی‌ثانیه برای طبقه‌بندی نشست‌های پردازشی طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled`، یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک، و پیشرفت ACP تایمر را بازنشانی می‌کنند؛ تشخیص‌های تکراری `session.stuck` تا وقتی تغییری رخ ندهد عقب‌نشینی می‌کنند.
- `stuckSessionAbortMs`: آستانهٔ سن بدون پیشرفت بر حسب میلی‌ثانیه پیش از آنکه کار فعال متوقف‌شدهٔ واجد شرایط بتواند برای بازیابی لغو و تخلیه شود. وقتی تنظیم نشده باشد، OpenClaw از پنجرهٔ امن‌تر اجرای تعبیه‌شدهٔ گسترده، دست‌کم 5 دقیقه و 3 برابر `stuckSessionWarnMs`، استفاده می‌کند.
- `memoryPressureSnapshot`: وقتی فشار حافظه به `critical` می‌رسد، یک نماگرفت پایداری پاک‌سازی‌شدهٔ پیش از OOM ثبت می‌کند (پیش‌فرض: `false`). آن را روی `true` بگذارید تا اسکن/نوشتن فایل بستهٔ پایداری اضافه شود و رویدادهای عادی فشار حافظه حفظ شوند.
- `otel.enabled`: خط لولهٔ صادرات OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، کاتالوگ سیگنال، و مدل حریم خصوصی، [صادرات OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: URL گردآورنده برای صادرات OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP ویژهٔ سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فرادادهٔ اضافی HTTP/gRPC که همراه درخواست‌های صادرات OTel فرستاده می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: صادرات ردگیری، سنجه‌ها، یا گزارش را فعال می‌کند.
- `otel.logsExporter`: مقصد صادرات گزارش: `"otlp"` (پیش‌فرض)، `"stdout"` برای یک شیء JSON در هر خط stdout، یا `"both"`.
- `otel.sampleRate`: نرخ نمونه‌برداری ردگیری `0`-`1`.
- `otel.flushIntervalMs`: بازهٔ تخلیهٔ دوره‌ای تله‌متری بر حسب میلی‌ثانیه.
- `otel.captureContent`: ثبت محتوای خام برای ویژگی‌های بازهٔ OTEL، به‌صورت انتخابی. به‌طور پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را ثبت می‌کند؛ شکل شیء به شما اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs`، `systemPrompt`، و `toolDefinitions` را به‌صراحت فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای تازه‌ترین شکل آزمایشی بازهٔ استنتاج GenAI، شامل نام‌های بازهٔ `{gen_ai.operation.name} {gen_ai.request.model}`، نوع بازهٔ `CLIENT`، و `gen_ai.provider.name` به‌جای `gen_ai.system` قدیمی. به‌طور پیش‌فرض، بازه‌ها برای سازگاری `openclaw.model.call` و `gen_ai.system` را نگه می‌دارند؛ سنجه‌های GenAI از ویژگی‌های معنایی کران‌دار استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از قبل یک SDK سراسری OpenTelemetry ثبت کرده‌اند. سپس OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را رد می‌کند، در حالی که شنونده‌های تشخیصی فعال می‌مانند.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`، و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطهٔ پایانی ویژهٔ سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: نماگرفت‌های ردگیری کش را برای اجراهای تعبیه‌شده ثبت می‌کند (پیش‌فرض: `false`).
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

- `channel`: کانال انتشار برای نصب‌های npm/git - `"stable"`، `"beta"`، یا `"dev"`.
- `checkOnStart`: هنگام شروع Gateway، به‌روزرسانی‌های npm را بررسی می‌کند (پیش‌فرض: `true`).
- `auto.enabled`: به‌روزرسانی خودکار پس‌زمینه را برای نصب‌های بسته فعال می‌کند (پیش‌فرض: `false`).
- `auto.stableDelayHours`: حداقل تاخیر بر حسب ساعت پیش از اعمال خودکار کانال پایدار (پیش‌فرض: `6`؛ حداکثر: `168`).
- `auto.stableJitterHours`: پنجرهٔ انتشار تدریجی اضافی کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ حداکثر: `168`).
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

- `enabled`: دروازهٔ سراسری ویژگی ACP (پیش‌فرض: `true`؛ برای پنهان‌کردن امکانات ارسال و ایجاد ACP روی `false` بگذارید).
- `dispatch.enabled`: دروازهٔ مستقل برای ارسال نوبت نشست ACP (پیش‌فرض: `true`). برای در دسترس نگه‌داشتن فرمان‌های ACP هم‌زمان با مسدودکردن اجرا، روی `false` بگذارید.
- `backend`: شناسهٔ پیش‌فرض بک‌اند زمان اجرای ACP (باید با یک Plugin زمان اجرای ACP ثبت‌شده مطابقت داشته باشد).
  ابتدا Plugin بک‌اند را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسهٔ Plugin بک‌اند (برای نمونه `acpx`) را در آن بگنجانید وگرنه بک‌اند ACP بارگذاری نمی‌شود.
- `defaultAgent`: شناسهٔ عامل هدف جایگزین ACP وقتی ایجادها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: فهرست مجاز شناسه‌های عامل که برای نشست‌های زمان اجرای ACP اجازه دارند؛ خالی بودن یعنی محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: حداکثر نشست‌های ACP فعال هم‌زمان.
- `stream.coalesceIdleMs`: پنجرهٔ تخلیهٔ بیکار بر حسب میلی‌ثانیه برای متن جریانی.
- `stream.maxChunkChars`: حداکثر اندازهٔ قطعه پیش از تقسیم تصویرسازی بلوک جریانی.
- `stream.repeatSuppression`: خط‌های وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی جریان می‌دهد؛ `"final_only"` تا رویدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل‌مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: حداکثر نویسه‌های خروجی دستیار که در هر نوبت ACP تصویرسازی می‌شود.
- `stream.maxSessionUpdateChars`: حداکثر نویسه‌ها برای خط‌های وضعیت/به‌روزرسانی ACP تصویرسازی‌شده.
- `stream.tagVisibility`: رکوردی از نام‌های برچسب به بازنویسی‌های بولی مشاهده‌پذیری برای رویدادهای جریانی.
- `runtime.ttlMinutes`: TTL بیکار بر حسب دقیقه برای کارگرهای نشست ACP پیش از واجد شرایط شدن برای پاک‌سازی.
- `runtime.installCommand`: فرمان نصب اختیاری برای اجرا هنگام راه‌اندازی اولیهٔ محیط زمان اجرای ACP.

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

- `cli.banner.taglineMode` سبک شعار کوتاه بنر را کنترل می‌کند:
  - `"random"` (پیش‌فرض): شعارهای کوتاه خنده‌دار/فصلی چرخشی.
  - `"default"`: شعار کوتاه ثابت و خنثی (`All your chats, one OpenClaw.`).
  - `"off"`: بدون متن شعار کوتاه (عنوان/نسخه بنر همچنان نمایش داده می‌شود).
- برای پنهان کردن کل بنر (نه فقط شعارهای کوتاه)، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## جادوگر

فراداده‌ای که جریان‌های راه‌اندازی هدایت‌شده CLI (`onboard`، `configure`، `doctor`) می‌نویسند:

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

بیلدهای فعلی دیگر شامل پل TCP نیستند. Nodeها از طریق WebSocket مربوط به Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از شِمای پیکربندی نیستند (اعتبارسنجی تا زمان حذفشان شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت نگهداری نشست‌های اجرای cron ایزوله‌شده تکمیل‌شده پیش از پاک‌سازی از `sessions.json`. همچنین پاک‌سازی رونوشت‌های بایگانی‌شده cron حذف‌شده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
- `runLog.maxBytes`: برای سازگاری با لاگ‌های اجرای cron قدیمی‌تر مبتنی بر فایل پذیرفته می‌شود. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین ردیف‌های تاریخچه اجرای SQLite که به ازای هر کار نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن bearer که برای تحویل POST مربوط به Webhookهای cron استفاده می‌شود (`delivery.mode = "webhook"`)، اگر حذف شود هیچ سربرگ احرازهویتی ارسال نمی‌شود.
- `webhook`: URL Webhook قدیمی و منسوخ‌شده (http/https) که `openclaw doctor --fix` برای مهاجرت کارهای ذخیره‌شده‌ای استفاده می‌کند که هنوز `notify: true` دارند؛ تحویل در زمان اجرا از `delivery.mode="webhook"` به‌همراه `delivery.to` برای هر کار استفاده می‌کند، یا هنگام حفظ تحویل اعلان از `delivery.completionDestination` استفاده می‌کند.

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

- `maxAttempts`: بیشینه تلاش‌های مجدد برای کارهای cron در خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0`-`10`).
- `backoffMs`: آرایه‌ای از تأخیرهای backoff بر حسب میلی‌ثانیه برای هر تلاش مجدد (پیش‌فرض: `[30000, 60000, 300000]`؛ ۱ تا ۱۰ مدخل).
- `retryOn`: انواع خطاهایی که تلاش مجدد را فعال می‌کنند - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش مجدد روی همه انواع گذرا حذفش کنید.

کارهای یک‌باره تا زمان تمام شدن تلاش‌های مجدد فعال می‌مانند، سپس با حفظ وضعیت خطای نهایی غیرفعال می‌شوند. کارهای تکرارشونده از همان سیاست تلاش مجدد گذرا استفاده می‌کنند تا پس از backoff و پیش از نوبت زمان‌بندی‌شده بعدی دوباره اجرا شوند؛ خطاهای دائمی یا تمام شدن تلاش‌های مجدد گذرا به زمان‌بندی تکرارشونده عادی با backoff خطا برمی‌گردند.

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

- `enabled`: هشدارهای شکست را برای کارهای cron فعال می‌کند (پیش‌فرض: `false`).
- `after`: تعداد شکست‌های پیاپی پیش از ارسال هشدار (عدد صحیح مثبت، حداقل: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: اجراهای ردشده پیاپی را در آستانه هشدار حساب می‌کند (پیش‌فرض: `false`). اجراهای ردشده جداگانه ردیابی می‌شوند و روی backoff خطای اجرا تأثیری ندارند.
- `mode`: حالت تحویل - `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به Webhook پیکربندی‌شده POST می‌کند.
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

- مقصد پیش‌فرض برای اعلان‌های شکست cron در همه کارها.
- `mode`: `"announce"` یا `"webhook"`؛ وقتی داده هدف کافی وجود داشته باشد، پیش‌فرض `"announce"` است.
- `channel`: بازنویسی کانال برای تحویل اعلان. `"last"` از آخرین کانال تحویل شناخته‌شده دوباره استفاده می‌کند.
- `to`: هدف اعلان یا URL Webhook صریح. برای حالت Webhook الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- `delivery.failureDestination` در سطح هر کار این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست سطح کار تنظیم نشده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌دهند، هنگام شکست به همان هدف اعلان اصلی برمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

[کارهای Cron](/fa/automation/cron-jobs) را ببینید. اجراهای cron ایزوله‌شده به‌عنوان [کارهای پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای قالب مدل رسانه

جای‌نگهدارهای قالب که در `tools.media.models[].args` گسترش می‌یابند:

| متغیر              | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | بدنه کامل پیام ورودی                             |
| `{{RawBody}}`      | بدنه خام (بدون wrapperهای تاریخچه/فرستنده)        |
| `{{BodyStripped}}` | بدنه‌ای که اشاره‌های گروهی از آن حذف شده‌اند      |
| `{{From}}`         | شناسه فرستنده                                     |
| `{{To}}`           | شناسه مقصد                                        |
| `{{MessageSid}}`   | شناسه پیام کانال                                  |
| `{{SessionId}}`    | UUID نشست فعلی                                    |
| `{{IsNewSession}}` | زمانی که نشست جدید ساخته شده باشد `"true"`        |
| `{{MediaUrl}}`     | شبه-URL رسانه ورودی                               |
| `{{MediaPath}}`    | مسیر رسانه محلی                                   |
| `{{MediaType}}`    | نوع رسانه (image/audio/document/…)                |
| `{{Transcript}}`   | رونوشت صوتی                                       |
| `{{Prompt}}`       | prompt رسانه حل‌شده برای ورودی‌های CLI            |
| `{{MaxChars}}`     | بیشینه کاراکترهای خروجی حل‌شده برای ورودی‌های CLI |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (در حد امکان)                          |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد امکان)                |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد امکان)                  |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد امکان)                  |
| `{{Provider}}`     | راهنمای Provider (whatsapp، telegram، discord و غیره) |

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
- آرایه‌ای از فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شود (موارد بعدی موارد قبلی را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از includeها ادغام می‌شوند (مقادیر includeشده را بازنویسی می‌کنند).
- includeهای تو‌در‌تو: تا عمق ۱۰ سطح.
- مسیرها: نسبت به فایل includeکننده حل می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا (`dirname` مربوط به `openclaw.json`) بمانند. شکل‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل آن مرز حل شوند. مسیرها نباید شامل بایت null باشند و باید پیش و پس از حل شدن، حتماً کوتاه‌تر از ۴۰۹۶ کاراکتر باشند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالای پشتیبانی‌شده با include تک‌فایلی را تغییر می‌دهند، در همان فایل includeشده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- includeهای ریشه، آرایه‌های include، و includeهایی با بازنویسی‌های هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط‌خواندنی هستند؛ این نوشتن‌ها به‌جای تخت کردن پیکربندی، به‌صورت fail-closed شکست می‌خورند.
- خطاها: پیام‌های روشن برای فایل‌های گمشده، خطاهای parse، includeهای چرخه‌ای، قالب مسیر نامعتبر، و طول بیش از حد.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

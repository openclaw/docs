---
read_when:
    - به معناشناسی دقیق پیکربندی یا مقادیر پیش‌فرض در سطح فیلد نیاز دارید
    - شما در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای اصلی OpenClaw، پیش‌فرض‌ها و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-07-02T01:06:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d15cc968bc89a7a490a5eaf571d5f38d052ad8783fcc7de5ca17d08ac04bfcc7
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی یک زیرسیستم مرجع عمیق‌تر خودش را دارد به آن پیوند می‌دهد. کاتالوگ‌های فرمان متعلق به کانال و Plugin و تنظیمات عمیق حافظه/QMD به‌جای این صفحه، در صفحه‌های خودشان قرار دارند.

حقیقت کد:

- `openclaw config schema` طرحواره JSON زنده‌ای را چاپ می‌کند که برای اعتبارسنجی و Control UI استفاده می‌شود، همراه با فراداده bundled/Plugin/کانال که در صورت وجود ادغام شده است
- `config.schema.lookup` برای ابزارهای drill-down یک گره طرحواره با دامنه مسیر برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش مبنای مستندات پیکربندی را در برابر سطح طرحواره فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی Agent: پیش از ویرایش‌ها، از کنش ابزار `gateway` یعنی `config.schema.lookup` برای مستندات و محدودیت‌های دقیق در سطح فیلد استفاده کنید. از [پیکربندی](/fa/gateway/configuration) برای راهنمایی وظیفه‌محور و از این صفحه برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها، و پیوندها به مراجع زیرسیستم‌ها استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations`، و پیکربندی dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [فرمان‌های Slash](/fa/tools/slash-commands) برای کاتالوگ فرمان‌های داخلی + bundled فعلی
- صفحه‌های کانال/Plugin مالک برای سطوح فرمان ویژه کانال

قالب پیکربندی **JSON5** است (کامنت‌ها + ویرگول‌های انتهایی مجازند). همه فیلدها اختیاری‌اند - وقتی حذف شوند، OpenClaw از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند - برای `channels.*`، از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و دیگر کانال‌های bundled (احراز هویت، کنترل دسترسی، چندحسابی، دروازه‌گذاری mention)، [پیکربندی - کانال‌ها](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های Agent، چند-Agent، نشست‌ها، و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است - برای موارد زیر [پیکربندی - agentها](/fa/gateway/config-agents) را ببینید:

- `agents.defaults.*` (workspace، model، thinking، heartbeat، memory، media، skills، sandbox)
- `multiAgent.*` (مسیریابی و bindingهای چند-Agent)
- `session.*` (چرخه عمر نشست، Compaction، pruning)
- `messages.*` (تحویل پیام، TTS، رندر markdown)
- `talk.*` (حالت Talk)
  - `talk.consultThinkingLevel`: بازنویسی سطح thinking برای اجرای کامل Agent OpenClaw پشت consultهای realtime در Control UI Talk
  - `talk.consultFastMode`: بازنویسی یک‌باره حالت سریع برای consultهای realtime در Control UI Talk
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk روی iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال transcript پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback رله Gateway برای transcriptهای realtime نهایی‌شده Talk که `openclaw_agent_consult` را رد می‌کنند

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، toggleهای آزمایشی، پیکربندی ابزار پشتیبانی‌شده توسط ارائه‌دهنده، و راه‌اندازی ارائه‌دهنده سفارشی / base-URL به صفحه‌ای اختصاصی منتقل شده‌اند - [پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools) را ببینید.

## مدل‌ها

تعریف‌های ارائه‌دهنده، allowlistهای مدل، و راه‌اندازی ارائه‌دهنده سفارشی در [پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند.
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
- `models.providers.*.localService`: مدیر پردازه اختیاری on-demand برای سرورهای مدل محلی. OpenClaw endpoint سلامت پیکربندی‌شده را probe می‌کند، در صورت نیاز `command` مطلق را شروع می‌کند، منتظر readiness می‌ماند، سپس درخواست مدل را می‌فرستد. [سرویس‌های مدل محلی](/fa/gateway/local-model-services) را ببینید.
- `models.pricing.enabled`: bootstrap قیمت‌گذاری پس‌زمینه را کنترل می‌کند که پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد، Gateway دریافت کاتالوگ‌های قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقادیر پیکربندی‌شده `models.providers.*.models[].cost` همچنان برای برآورد هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط OpenClaw تعبیه‌شده و دیگر adapterهای runtime مصرف می‌شوند. فرمان‌های `openclaw mcp list`، `show`، `set`، و `unset` این بلوک را بدون اتصال به سرور مقصد هنگام ویرایش پیکربندی مدیریت می‌کنند.

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

- `mcp.servers`: تعریف‌های نام‌دار سرور stdio یا remote MCP برای runtimeهایی که ابزارهای MCP پیکربندی‌شده را expose می‌کنند.
  ورودی‌های remote از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛ `type: "http"` یک alias بومی CLI است که `openclaw mcp set` و `openclaw doctor --fix` آن را به فیلد canonical `transport` normalize می‌کنند.
- `mcp.servers.<name>.enabled`: روی `false` تنظیم کنید تا یک تعریف سرور ذخیره‌شده حفظ شود اما از کشف MCP تعبیه‌شده OpenClaw و projection ابزار حذف شود.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout درخواست MCP برای هر سرور به ثانیه یا میلی‌ثانیه.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout اتصال برای هر سرور به ثانیه یا میلی‌ثانیه.
- `mcp.servers.<name>.supportsParallelToolCalls`: hint اختیاری هم‌زمانی برای adapterهایی که می‌توانند انتخاب کنند آیا فراخوانی‌های ابزار MCP را موازی صادر کنند یا نه.
- `mcp.servers.<name>.auth`: برای سرورهای HTTP MCP که OAuth لازم دارند، `"oauth"` تنظیم کنید. برای ذخیره tokenها زیر state OpenClaw، `openclaw mcp login <name>` را اجرا کنید.
- `mcp.servers.<name>.oauth`: overrideهای اختیاری scope، redirect URL، و client metadata URL در OAuth.
- `mcp.servers.<name>.sslVerify`، `clientCert`، `clientKey`: کنترل‌های HTTP TLS برای endpointهای private و mutual TLS.
- `mcp.servers.<name>.toolFilter`: انتخاب ابزار اختیاری برای هر سرور. `include` ابزارهای MCP کشف‌شده را به نام‌های matching محدود می‌کند؛ `exclude` نام‌های matching را پنهان می‌کند. ورودی‌ها نام‌های دقیق ابزار MCP یا globهای ساده `*` هستند. سرورهایی که resource یا prompt دارند، نام‌های ابزار utility نیز تولید می‌کنند (`resources_list`، `resources_read`، `prompts_list`، `prompts_get`) و آن نام‌ها از همان filter استفاده می‌کنند.
- `mcp.servers.<name>.codex`: کنترل‌های projection اختیاری app-server Codex.
  این بلوک فقط برای threadهای app-server Codex فراداده OpenClaw است؛ روی نشست‌های ACP، پیکربندی عمومی harness Codex، یا دیگر adapterهای runtime اثر نمی‌گذارد.
  `codex.agents` غیرخالی سرور را به شناسه‌های Agent OpenClaw فهرست‌شده محدود می‌کند.
  فهرست‌های Agent scoped خالی، blank، یا نامعتبر توسط اعتبارسنجی پیکربندی رد می‌شوند و به‌جای global شدن، توسط مسیر projection runtime حذف می‌شوند.
  `codex.defaultToolsApprovalMode` برای آن سرور `default_tools_approval_mode` بومی Codex را emit می‌کند. OpenClaw پیش از پاس دادن پیکربندی بومی `mcp_servers` به Codex، بلوک `codex` را strip می‌کند. برای اینکه سرور برای هر Agent app-server Codex با رفتار پیش‌فرض تأیید MCP در Codex projected بماند، بلوک را حذف کنید.
- `mcp.sessionIdleTtlMs`: TTL idle برای runtimeهای MCP bundled با دامنه نشست.
  اجراهای تعبیه‌شده one-shot پاک‌سازی پایان اجرا را درخواست می‌کنند؛ این TTL backstop برای نشست‌های طولانی‌مدت و callerهای آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP نشست cacheشده hot-apply می‌شوند.
  کشف/استفاده بعدی ابزار، آن‌ها را از پیکربندی جدید دوباره می‌سازد، بنابراین ورودی‌های حذف‌شده `mcp.servers` به‌جای انتظار برای TTL idle، بلافاصله reaped می‌شوند.
- کشف runtime همچنین با drop کردن کاتالوگ cacheشده برای آن نشست، notificationهای تغییر فهرست ابزار MCP را رعایت می‌کند. سرورهایی که resources یا prompts را advertise می‌کنند، برای فهرست/خواندن resourceها و فهرست/دریافت promptها ابزارهای utility می‌گیرند. شکست‌های تکراری فراخوانی ابزار، سرور affected را پیش از تلاش برای فراخوانی دیگر، برای مدت کوتاهی pause می‌کنند.

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

- `allowBundled`: allowlist اختیاری فقط برای skills bundled (skills مدیریت‌شده/workspace unaffected).
- `load.extraDirs`: ریشه‌های skill مشترک اضافی (پایین‌ترین precedence).
- `load.allowSymlinkTargets`: ریشه‌های target واقعی و مورد اعتماد که symlinkهای skill می‌توانند وقتی link بیرون از ریشه source پیکربندی‌شده‌اش است به آن‌ها resolve شوند.
- `workshop.allowSymlinkTargetWrites`: به Skill Workshop apply اجازه می‌دهد از طریق targetهای symlink از قبل مورد اعتماد بنویسد (پیش‌فرض: false).
- `install.preferBrew`: وقتی true باشد، اگر `brew` در دسترس باشد پیش از fallback به انواع installer دیگر، installerهای Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح installer node برای specهای `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: به clientهای Gateway مورد اعتماد `operator.admin` اجازه می‌دهد archiveهای zip private را که از طریق `skills.upload.*` stage شده‌اند نصب کنند (پیش‌فرض: false). این فقط مسیر uploaded-archive را فعال می‌کند؛ نصب‌های معمول ClawHub به آن نیاز ندارند.
- `entries.<skillKey>.enabled: false` یک skill را حتی اگر bundled/installed باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میانبر برای skills که یک env var اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

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

- از دایرکتوری‌های package یا bundle زیر `~/.openclaw/extensions` و `<workspace>/.openclaw/extensions`، به‌علاوه فایل‌ها یا دایرکتوری‌های فهرست‌شده در `plugins.load.paths` بارگذاری می‌شود.
- فایل‌های مستقل پلاگین را در `plugins.load.paths` قرار دهید؛ ریشه‌های extension که به‌صورت خودکار کشف می‌شوند، فایل‌های سطح بالای `.js`، `.mjs` و `.ts` را نادیده می‌گیرند تا اسکریپت‌های کمکی در آن ریشه‌ها مانع راه‌اندازی نشوند.
- کشف، پلاگین‌های بومی OpenClaw و همچنین bundleهای سازگار Codex و bundleهای Claude را می‌پذیرد، از جمله bundleهای Claude با چیدمان پیش‌فرض و بدون manifest.
- **تغییرات پیکربندی به راه‌اندازی مجدد Gateway نیاز دارند.**
- `allow`: فهرست مجاز اختیاری (فقط پلاگین‌های فهرست‌شده بارگذاری می‌شوند). `deny` اولویت دارد.
- `plugins.entries.<id>.apiKey`: فیلد کمکی کلید API در سطح پلاگین (وقتی پلاگین پشتیبانی کند).
- `plugins.entries.<id>.env`: نگاشت متغیرهای محیطی محدود به پلاگین.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، هسته `before_prompt_build` را مسدود می‌کند و فیلدهای تغییردهنده prompt از `before_agent_start` قدیمی را نادیده می‌گیرد، در حالی که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. روی hookهای پلاگین بومی و دایرکتوری‌های hook ارائه‌شده توسط bundleهای پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، پلاگین‌های غیر-bundled مورد اعتماد می‌توانند محتوای خام مکالمه را از hookهای تایپ‌شده‌ای مانند `llm_input`، `llm_output`، `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `before_agent_finalize` و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: صراحتا به این پلاگین اعتماد می‌کند تا برای اجرای subagent در پس‌زمینه، overrideهای `provider` و `model` مخصوص هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: فهرست مجاز اختیاری از هدف‌های canonical `provider/model` برای overrideهای مورد اعتماد subagent. فقط وقتی از `"*"` استفاده کنید که عمدا می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.llm.allowModelOverride`: صراحتا به این پلاگین اعتماد می‌کند تا برای `api.runtime.llm.complete` override مدل درخواست کند.
- `plugins.entries.<id>.llm.allowedModels`: فهرست مجاز اختیاری از هدف‌های canonical `provider/model` برای overrideهای مورد اعتماد تکمیل LLM پلاگین. فقط وقتی از `"*"` استفاده کنید که عمدا می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: صراحتا به این پلاگین اعتماد می‌کند تا `api.runtime.llm.complete` را روی یک شناسه agent غیرپیش‌فرض اجرا کند.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط پلاگین (در صورت وجود، با schema پلاگین بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/runtime پلاگین channel زیر `channels.<id>` قرار می‌گیرند و باید با فراداده `channelConfigs` در manifest پلاگین مالک توصیف شوند، نه با یک رجیستری گزینه مرکزی OpenClaw.

### پیکربندی پلاگین هارنس Codex

پلاگین bundled با نام `codex` مالک تنظیمات هارنس app-server بومی Codex زیر
`plugins.entries.codex.config` است. برای سطح کامل پیکربندی، [مرجع هارنس Codex](/fa/plugins/codex-harness-reference) و برای مدل runtime، [هارنس Codex](/fa/plugins/codex-harness) را ببینید.

`codexPlugins` فقط روی sessionهایی اعمال می‌شود که هارنس بومی Codex را انتخاب می‌کنند.
این گزینه پلاگین‌های Codex را برای اجراهای provider در OpenClaw، اتصال‌های مکالمه ACP
یا هیچ هارنس غیر-Codex دیگری فعال نمی‌کند.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: پشتیبانی بومی پلاگین/app
  را برای هارنس Codex فعال می‌کند. پیش‌فرض: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سیاست پیش‌فرض اقدام‌های مخرب برای elicitations پلاگین app مهاجرت‌داده‌شده.
  از `true` برای پذیرش schemaهای تایید امن Codex بدون prompt، از `false`
  برای رد آن‌ها، از `"auto"` برای مسیر دادن تاییدهای موردنیاز Codex از طریق تاییدهای
  پلاگین OpenClaw، یا از `"ask"` برای prompt دادن برای هر اقدام نوشتنی/مخرب پلاگین
  بدون تایید پایدار استفاده کنید. حالت `"ask"`، overrideهای تایید پایدار Codex
  در سطح هر ابزار را برای app متاثر پاک می‌کند و پیش از شروع thread Codex،
  بازبین انسانی تاییدها را برای آن app انتخاب می‌کند.
  پیش‌فرض: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: وقتی
  `codexPlugins.enabled` سراسری نیز true باشد، یک entry پلاگین مهاجرت‌داده‌شده را فعال می‌کند.
  پیش‌فرض: `true` برای entryهای صریح.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هویت پایدار marketplace. V1 فقط از `"openai-curated"` پشتیبانی می‌کند.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هویت پایدار
  پلاگین Codex از migration، برای مثال `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override اقدام مخرب در سطح هر پلاگین. اگر حذف شود، مقدار سراسری
  `allow_destructive_actions` استفاده می‌شود. مقدار هر پلاگین همان سیاست‌های
  `true`، `false`، `"auto"` یا `"ask"` را می‌پذیرد.

هر پلاگین app پذیرفته‌شده که از `"ask"` استفاده کند، درخواست‌های تایید همان app را
به بازبین انسانی مسیر می‌دهد. appهای دیگر و تاییدهای thread غیر-app بازبین
پیکربندی‌شده خود را حفظ می‌کنند، بنابراین سیاست‌های ترکیبی پلاگین رفتار `"ask"` را به ارث نمی‌برند.

`codexPlugins.enabled` دستور فعال‌سازی سراسری است. entryهای صریح پلاگین که توسط migration
نوشته می‌شوند، مجموعه پایدار واجد شرایط نصب و repair هستند.
`plugins["*"]` پشتیبانی نمی‌شود، هیچ switch با نام `install` وجود ندارد، و مقادیر محلی
`marketplacePath` عمدا فیلد پیکربندی نیستند چون وابسته به host هستند.

بررسی‌های آمادگی `app/list` برای یک ساعت cache می‌شوند و وقتی stale شوند
به‌صورت ناهمگام refresh می‌شوند. پیکربندی app در threadهای Codex هنگام برقراری session
هارنس Codex محاسبه می‌شود، نه در هر turn؛ پس از تغییر پیکربندی پلاگین بومی، از `/new`،
`/reset` یا راه‌اندازی مجدد Gateway استفاده کنید.

- `plugins.entries.firecrawl.config.webFetch`: تنظیمات provider واکشی وب Firecrawl.
  - `apiKey`: کلید API اختیاری Firecrawl برای محدودیت‌های بالاتر (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، `tools.web.fetch.firecrawl.apiKey` قدیمی یا متغیر محیطی `FIRECRAWL_API_KEY` fallback می‌کند.
  - `baseUrl`: URL پایه API Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای self-hosted باید endpointهای خصوصی/داخلی را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی را از صفحه‌ها استخراج می‌کند (پیش‌فرض: `true`).
  - `maxAgeMs`: بیشینه عمر cache بر حسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: timeout درخواست scrape بر حسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جستجوی وب Grok).
  - `enabled`: provider X Search را فعال می‌کند.
  - `model`: مدل Grok که برای جستجو استفاده می‌شود (مثلا `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات dreaming حافظه. برای فازها و آستانه‌ها [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: switch اصلی dreaming (پیش‌فرض `false`).
  - `frequency`: cadence به‌صورت cron برای هر sweep کامل dreaming (به‌صورت پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent مربوط به Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن هدف‌ها، آن را با `allowedModels` جفت کنید. خطاهای در دسترس نبودن مدل یک بار با مدل پیش‌فرض session دوباره تلاش می‌شوند؛ شکست‌های اعتماد یا فهرست مجاز، بی‌صدا fallback نمی‌کنند.
  - سیاست فاز و آستانه‌ها جزئیات پیاده‌سازی هستند (کلیدهای پیکربندی کاربرمحور نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- پلاگین‌های فعال bundle مربوط به Claude نیز می‌توانند پیش‌فرض‌های embedded OpenClaw را از `settings.json` اضافه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات agent پاک‌سازی‌شده اعمال می‌کند، نه patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه پلاگین حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن پلاگین‌های حافظه `"none"` را انتخاب کنید.
- `plugins.slots.contextEngine`: شناسه پلاگین context engine فعال را انتخاب کنید؛ مگر اینکه engine دیگری را نصب و انتخاب کنید، پیش‌فرض `"legacy"` است.

[پلاگین‌ها](/fa/tools/plugin) را ببینید.

---

## تعهدات

`commitments` حافظه follow-up استنباط‌شده را کنترل می‌کند: OpenClaw می‌تواند check-inها را از turnهای مکالمه تشخیص دهد و آن‌ها را از طریق اجراهای Heartbeat تحویل دهد.

- `commitments.enabled`: استخراج پنهان LLM، ذخیره‌سازی و تحویل Heartbeat را برای تعهدات follow-up استنباط‌شده فعال می‌کند. پیش‌فرض: `false`.
- `commitments.maxPerDay`: بیشینه تعداد تعهدات follow-up استنباط‌شده که در یک روز rolling برای هر session agent تحویل داده می‌شود. پیش‌فرض: `3`.

[تعهدات استنباط‌شده](/fa/concepts/commitments) را ببینید.

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
  نشست از سقف خود فراتر می‌رود، بازپس می‌گیرد. برای غیرفعال‌کردن هرکدام از این
  حالت‌های پاک‌سازی جداگانه، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین پیمایش مرورگر به‌طور پیش‌فرض سخت‌گیرانه می‌ماند.
- فقط زمانی `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید که عمداً به پیمایش مرورگر در شبکه‌ی خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقاط پایانی پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترسی‌پذیری/کشف، مشمول همان مسدودسازی شبکه‌ی خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان یک نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` برای استثناهای صریح استفاده کنید.
- پروفایل‌های راه‌دور فقط قابل اتصال هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl` مقادیر `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند از HTTP(S) استفاده کنید؛ وقتی
  ارائه‌دهنده‌ی شما یک URL مستقیم DevTools WebSocket می‌دهد از WS(S) استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترسی‌پذیری CDP راه‌دور و
  `attachOnly` به‌همراه درخواست‌های بازکردن زبانه اعمال می‌شوند. پروفایل‌های local loopback
  مدیریت‌شده پیش‌فرض‌های CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP مدیریت‌شده‌ی خارجی از طریق loopback در دسترس است، برای آن
  پروفایل `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw پورت loopback را به‌عنوان یک
  پروفایل مرورگر مدیریت‌شده‌ی محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت پورت محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل، متصل شوند.
- پروفایل‌های `existing-session` می‌توانند `userDataDir` را تنظیم کنند تا یک پروفایل مشخص
  مرورگر مبتنی بر Chromium مانند Brave یا Edge را هدف بگیرند.
- پروفایل‌های `existing-session` می‌توانند وقتی Chrome از قبل پشت یک نقطه‌ی پایانی کشف HTTP(S) مربوط به DevTools
  یا نقطه‌ی پایانی مستقیم WS(S) در حال اجراست، `cdpUrl` را تنظیم کنند. در آن
  حالت OpenClaw به‌جای استفاده از اتصال خودکار، نقطه‌ی پایانی را به Chrome MCP می‌دهد؛
  `userDataDir` برای آرگومان‌های راه‌اندازی Chrome MCP نادیده گرفته می‌شود.
- پروفایل‌های `existing-session` محدودیت‌های مسیر فعلی Chrome MCP را نگه می‌دارند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری با انتخابگر CSS، قلاب‌های بارگذاری یک‌فایلی،
  بدون بازنویسی زمان‌پایان گفت‌وگو، بدون `wait --load networkidle`، و بدون
  `responsebody`، خروجی PDF، رهگیری دانلود، یا کنش‌های دسته‌ای.
- پروفایل‌های `openclaw` مدیریت‌شده‌ی محلی `cdpPort` و `cdpUrl` را به‌طور خودکار تخصیص می‌دهند؛
  `cdpUrl` را فقط برای پروفایل‌های CDP راه‌دور یا اتصال به نقطه‌ی پایانی existing-session
  به‌صراحت تنظیم کنید.
- پروفایل‌های مدیریت‌شده‌ی محلی می‌توانند `executablePath` را تنظیم کنند تا مقدار سراسری
  `browser.executablePath` را برای آن پروفایل بازنویسی کنند. از این برای اجرای یک پروفایل در
  Chrome و پروفایل دیگر در Brave استفاده کنید.
- پروفایل‌های مدیریت‌شده‌ی محلی از `browser.localLaunchTimeoutMs` برای کشف HTTP مربوط به Chrome CDP
  پس از شروع فرایند و از `browser.localCdpReadyTimeoutMs` برای
  آماده‌بودن websocket مربوط به CDP پس از راه‌اندازی استفاده می‌کنند. روی میزبان‌های کندتر که Chrome
  با موفقیت شروع می‌شود اما بررسی‌های آماده‌بودن با راه‌اندازی رقابت می‌کنند، آن‌ها را افزایش دهید. هر دو مقدار باید
  عدد صحیح مثبت تا `120000` میلی‌ثانیه باشند؛ مقادیر پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد ← Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را برای پوشه‌ی خانه‌ی سیستم‌عامل شما پیش از راه‌اندازی Chromium می‌پذیرند.
  `userDataDir` مخصوص هر پروفایل در پروفایل‌های `existing-session` نیز با tilde گسترش داده می‌شود.
- سرویس کنترل: فقط loopback (پورت مشتق‌شده از `gateway.port`، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های راه‌اندازی اضافی را به شروع محلی Chromium اضافه می‌کند (برای مثال
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

- `seamColor`: رنگ تأکیدی برای chrome رابط کاربری برنامه‌ی بومی (رنگ حباب Talk Mode و غیره).
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

- `mode`: `local` (اجرای Gateway) یا `remote` (اتصال به Gateway راه‌دور). Gateway شروع به کار نمی‌کند مگر اینکه `local` باشد.
- `port`: یک پورت چندگانهٔ واحد برای WS + HTTP. اولویت: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP مربوط به Tailscale)، یا `custom`.
- **نام‌های مستعار قدیمی bind**: در `gateway.bind` از مقادیر حالت bind استفاده کنید (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، نه نام‌های مستعار میزبان (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **یادداشت Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکهٔ پل Docker (`-p 18789:18789`)، ترافیک روی `eth0` وارد می‌شود، بنابراین Gateway در دسترس نیست. از `--network host` استفاده کنید، یا `bind: "lan"` را تنظیم کنید (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) تا روی همهٔ رابط‌ها گوش دهد.
- **احراز هویت**: به‌طور پیش‌فرض الزامی است. bindهای غیر loopback به احراز هویت Gateway نیاز دارند. در عمل یعنی یک توکن/رمز عبور مشترک یا یک پروکسی معکوس آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. جادوگر راه‌اندازی به‌طور پیش‌فرض یک توکن تولید می‌کند.
- اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefs)، `gateway.auth.mode` را صراحتاً روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، جریان‌های راه‌اندازی و نصب/تعمیر سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای تنظیمات local loopback مورد اعتماد استفاده کنید؛ این گزینه عمداً در اعلان‌های راه‌اندازی ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک پروکسی معکوس آگاه از هویت واگذار کنید و به هدرهای هویت از `gateway.trustedProxies` اعتماد کنید (ببینید [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)). این حالت به‌طور پیش‌فرض یک منبع پروکسی **غیر loopback** انتظار دارد؛ پروکسی‌های معکوس loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخواننده‌های داخلی روی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان fallback مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار و انحصاری است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، هدرهای هویت Tailscale Serve می‌توانند احراز هویت Control UI/WebSocket را تأمین کنند (با `tailscale whois` تأیید می‌شود). نقاط پایانی HTTP API از آن احراز هویت هدر Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت عادی احراز هویت HTTP مربوط به Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway مورد اعتماد است. وقتی `tailscale.mode = "serve"` باشد، پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکنندهٔ اختیاری برای احراز هویت ناموفق. به‌ازای هر IP کلاینت و هر دامنهٔ احراز هویت اعمال می‌شود (shared-secret و device-token مستقل ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر ناهمگام Control UI مربوط به Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست، به‌صورت ترتیبی پردازش می‌شوند. بنابراین تلاش‌های بد هم‌زمان از همان کلاینت می‌توانند در درخواست دوم محدودکننده را فعال کنند، نه اینکه هر دو به‌صورت رقابتی فقط به‌عنوان عدم تطابق ساده عبور کنند.
  - `gateway.auth.rateLimit.exemptLoopback` به‌طور پیش‌فرض `true` است؛ وقتی عمداً می‌خواهید ترافیک localhost هم rate-limit شود (برای تنظیمات آزمون یا استقرارهای پروکسی سخت‌گیرانه)، آن را روی `false` بگذارید.
- تلاش‌های احراز هویت WS با مبدأ مرورگر همیشه با معافیت loopback غیرفعال throttle می‌شوند (دفاع چندلایه در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، آن قفل‌شدن‌های با مبدأ مرورگر به‌ازای مقدار نرمال‌شدهٔ `Origin`
  جدا می‌شوند، بنابراین شکست‌های تکراری از یک مبدأ localhost به‌طور خودکار
  مبدأ متفاوتی را قفل نمی‌کند.
- `tailscale.mode`: `serve` (فقط tailnet، bind روی loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `tailscale.serviceName`: نام اختیاری سرویس Tailscale برای حالت Serve، مانند
  `svc:openclaw`. وقتی تنظیم شود، OpenClaw آن را به `tailscale serve
--service` می‌دهد تا Control UI به‌جای نام میزبان دستگاه، از طریق یک سرویس نام‌دار
  در معرض دسترسی قرار گیرد. مقدار باید از قالب نام سرویس `svc:<dns-label>`
  مربوط به Tailscale استفاده کند؛ هنگام راه‌اندازی، URL مشتق‌شدهٔ سرویس گزارش می‌شود.
- `tailscale.preserveFunnel`: وقتی `true` باشد و `tailscale.mode = "serve"`، OpenClaw
  پیش از اعمال دوبارهٔ Serve هنگام راه‌اندازی، `tailscale funnel status` را بررسی می‌کند و اگر
  یک مسیر Funnel پیکربندی‌شدهٔ خارجی از قبل پورت Gateway را پوشش دهد، از آن صرف‌نظر می‌کند.
  پیش‌فرض `false`.
- `controlUi.allowedOrigins`: فهرست مجاز صریح مبدأ مرورگر برای اتصال‌های WebSocket به Gateway. برای مبدأهای مرورگر عمومی غیر loopback الزامی است. بارگذاری‌های UI خصوصی same-origin از LAN/Tailnet از loopback، RFC1918/link-local، `.local`، `.ts.net`، یا میزبان‌های CGNAT مربوط به Tailscale بدون فعال‌کردن fallback هدر Host پذیرفته می‌شوند.
- `controlUi.chatMessageMaxWidth`: بیشینه‌عرض اختیاری برای پیام‌های چت گروه‌بندی‌شدهٔ Control UI. مقادیر عرض CSS محدودشده مانند `960px`، `82%`، `min(1280px, 82%)`، و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناک که fallback مبدأ بر اساس هدر Host را برای استقرارهایی فعال می‌کند که عمداً به سیاست مبدأ مبتنی بر هدر Host تکیه دارند.
- `remote.transport`: `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، مقدار `remote.url` برای میزبان‌های عمومی باید `wss://` باشد؛ متن سادهٔ `ws://` فقط برای loopback، LAN، link-local، `.local`، `.ts.net`، و میزبان‌های CGNAT مربوط به Tailscale پذیرفته می‌شود.
- `remote.remotePort`: پورت Gateway روی میزبان SSH راه‌دور. پیش‌فرض `18789` است؛ وقتی پورت تونل محلی با پورت Gateway راه‌دور فرق دارد از این استفاده کنید.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامهٔ کلاینت راه‌دور هستند. این‌ها به‌تنهایی احراز هویت Gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: URL پایهٔ HTTPS برای رلهٔ خارجی APNs که پس از انتشار ثبت‌نام‌ها توسط بیلدهای iOS متکی به رله در Gateway استفاده می‌شود. بیلدهای عمومی App Store/TestFlight از رلهٔ میزبانی‌شدهٔ OpenClaw استفاده می‌کنند. URLهای رلهٔ سفارشی باید با یک مسیر بیلد/استقرار iOS عمداً جداگانه مطابقت داشته باشند که URL رلهٔ آن به همان رله اشاره می‌کند.
- `gateway.push.apns.relay.timeoutMs`: مهلت ارسال Gateway به رله بر حسب میلی‌ثانیه. پیش‌فرض `10000`.
- ثبت‌نام‌های متکی به رله به یک هویت مشخص Gateway واگذار می‌شوند. اپلیکیشن iOS جفت‌شده `gateway.identity.get` را دریافت می‌کند، آن هویت را در ثبت‌نام رله وارد می‌کند، و یک مجوز ارسال محدود به ثبت‌نام را به Gateway منتقل می‌کند. Gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی رلهٔ بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه فرار فقط مخصوص توسعه برای URLهای رلهٔ HTTP روی loopback. URLهای رلهٔ تولید باید روی HTTPS بمانند.
- `gateway.handshakeTimeoutMs`: مهلت handshake مربوط به WebSocket در Gateway پیش از احراز هویت، بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد، اولویت دارد. روی میزبان‌های پربار یا کم‌توان که کلاینت‌های محلی می‌توانند در حالی وصل شوند که گرم‌شدن راه‌اندازی هنوز در حال تثبیت است، این مقدار را افزایش دهید.
- `gateway.channelHealthCheckMinutes`: بازهٔ پایش سلامت کانال بر حسب دقیقه. برای غیرفعال‌کردن سراسری راه‌اندازی مجدد توسط health-monitor، `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانهٔ سوکت stale بر حسب دقیقه. این مقدار را بزرگ‌تر یا برابر با `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: بیشینهٔ راه‌اندازی مجدد health-monitor به‌ازای هر کانال/حساب در یک ساعت rolling. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: انصراف به‌ازای هر کانال از راه‌اندازی‌های مجدد health-monitor در حالی که پایش‌گر سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override به‌ازای هر حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر override سطح کانال اولویت دارد.
- مسیرهای فراخوانی Gateway محلی فقط وقتی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتاً از طریق SecretRef پیکربندی شده و حل‌نشده باشد، resolution به‌صورت fail-closed شکست می‌خورد (بدون پنهان‌سازی با fallback راه‌دور).
- `trustedProxies`: IPهای پروکسی معکوس که TLS را خاتمه می‌دهند یا هدرهای forwarded-client تزریق می‌کنند. فقط پروکسی‌هایی را فهرست کنید که کنترل می‌کنید. ورودی‌های loopback همچنان برای تنظیمات پروکسی روی همان میزبان/تشخیص محلی معتبرند (برای مثال Tailscale Serve یا یک پروکسی معکوس محلی)، اما درخواست‌های loopback را واجد شرایط `gateway.auth.mode: "trusted-proxy"` نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` وجود نداشته باشد Gateway مقدار `X-Real-IP` را می‌پذیرد. پیش‌فرض برای رفتار fail-closed برابر `false` است.
- `gateway.nodes.pairing.autoApproveCidrs`: فهرست مجاز اختیاری CIDR/IP برای تأیید خودکار pairing اولیهٔ دستگاه node بدون scopeهای درخواستی. وقتی تنظیم نشده باشد غیرفعال است. این گزینه pairing مربوط به operator/browser/Control UI/WebChat را خودکار تأیید نمی‌کند، و ارتقاهای role، scope، metadata، یا public-key را هم خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی allow/deny سراسری برای فرمان‌های node اعلام‌شده پس از pairing و ارزیابی فهرست مجاز پلتفرم. از `allowCommands` برای opt in به فرمان‌های خطرناک node مانند `camera.snap`، `camera.clip`، و `screen.record` استفاده کنید؛ `denyCommands` یک فرمان را حذف می‌کند حتی اگر پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل می‌شد. پس از اینکه یک node فهرست فرمان‌های اعلام‌شدهٔ خود را تغییر داد، pairing آن دستگاه را رد و دوباره تأیید کنید تا Gateway snapshot به‌روز فرمان را ذخیره کند.
- `gateway.tools.deny`: نام‌های ابزار اضافی که برای HTTP `POST /tools/invoke` مسدود می‌شوند (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام‌های ابزار را برای
  فراخواننده‌های owner/admin از فهرست deny پیش‌فرض HTTP حذف می‌کند. این کار فراخواننده‌های `operator.write`
  دارای هویت را به دسترسی owner/admin ارتقا نمی‌دهد؛ `cron`، `gateway`، و `nodes` حتی وقتی allowlist شده باشند
  برای فراخواننده‌های غیر owner در دسترس نمی‌مانند.

</Accordion>

### نقاط پایانی سازگار با OpenAI

- HTTP RPC مدیریتی: به‌عنوان Plugin `admin-http-rpc` به‌طور پیش‌فرض خاموش است. Plugin را فعال کنید تا `POST /api/v1/admin/rpc` ثبت شود. ببینید [HTTP RPC مدیریتی](/fa/plugins/admin-http-rpc).
- Chat Completions: به‌طور پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- API پاسخ‌ها: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL برای پاسخ‌ها:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    فهرست‌های مجاز خالی به‌عنوان تنظیم‌نشده در نظر گرفته می‌شوند؛ برای غیرفعال‌کردن واکشی URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- هدر اختیاری سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای مبدأهای HTTPS که کنترل می‌کنید تنظیم شود؛ ببینید [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### جداسازی چندنمونه‌ای

چند Gateway را روی یک میزبان با پورت‌ها و دایرکتوری‌های state یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

فلگ‌های راحتی: `--dev` (از `~/.openclaw-dev` + پورت `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

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

- `enabled`: خاتمهٔ TLS را در listener مربوط به Gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده باشند، یک جفت گواهی/کلید local خودامضاشده را به‌صورت خودکار تولید می‌کند؛ فقط برای استفادهٔ local/dev.
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

- `mode`: کنترل می‌کند ویرایش‌های پیکربندی در زمان اجرا چگونه اعمال شوند.
  - `"off"`: ویرایش‌های زنده را نادیده بگیر؛ تغییرات به راه‌اندازی مجدد صریح نیاز دارند.
  - `"restart"`: همیشه با تغییر پیکربندی، فرایند Gateway را دوباره راه‌اندازی کن.
  - `"hot"`: تغییرات را بدون راه‌اندازی مجدد، درون همان فرایند اعمال کن.
  - `"hybrid"` (پیش‌فرض): ابتدا بارگذاری مجدد داغ را امتحان کن؛ اگر لازم بود به راه‌اندازی مجدد برگرد.
- `debounceMs`: بازه debounce بر حسب میلی‌ثانیه پیش از اعمال تغییرات پیکربندی (عدد صحیح نامنفی).
- `deferralTimeoutMs`: حداکثر زمان اختیاری بر حسب میلی‌ثانیه برای انتظار تا پایان عملیات در جریان، پیش از اجبار به راه‌اندازی مجدد یا بارگذاری مجدد داغ کانال. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای درباره موارد هنوز در انتظار، آن را روی `0` تنظیم کنید.

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
توکن‌های هوک در query string رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید با احراز هویت shared-secret فعال Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) متفاوت باشد؛ راه‌اندازی اولیه هنگام تشخیص استفاده مجدد، یک هشدار امنیتی غیرمرگبار ثبت می‌کند.
- `openclaw security audit` استفاده مجدد از احراز هویت هوک/Gateway را، از جمله احراز هویت گذرواژه Gateway که فقط در زمان ممیزی ارائه شده است (`--auth password --password <password>`)، به‌عنوان یافته‌ای بحرانی علامت‌گذاری می‌کند. برای چرخاندن یک `hooks.token` پایدارشده و استفاده‌شده‌مجدد، `openclaw doctor --fix` را اجرا کنید، سپس فرستنده‌های هوک خارجی را به‌روزرسانی کنید تا از توکن هوک جدید استفاده کنند.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیرمسیر اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا preset از `sessionKey` قالبی استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این opt-in نیاز ندارند.

**نقطه‌های پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط وقتی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقادیر `sessionKey` نگاشت که با قالب رندر شده‌اند، به‌عنوان مقادیر ارائه‌شده خارجی تلقی می‌شوند و آن‌ها هم به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="Mapping details">

- `match.path` با زیرمسیر پس از `/hooks` مطابقت می‌یابد (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` برای مسیرهای عمومی با یک فیلد payload مطابقت می‌یابد.
- قالب‌هایی مانند `{{messages[0].subject}}` از payload می‌خوانند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش هوک برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و درون `hooks.transformsDir` باقی بماند (مسیرهای مطلق و پیمایش مسیر رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های Skills فضای کاری رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transforms هوک‌ها منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک عامل مشخص مسیریابی می‌کند؛ شناسه‌های ناشناخته به عامل پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: مسیریابی مؤثر عامل را محدود می‌کند، از جمله مسیر عامل پیش‌فرض وقتی `agentId` حذف شده باشد (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید نشست ثابت اختیاری برای اجرای عامل هوک بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای نشست نگاشت مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: فهرست مجاز پیشوند اختیاری برای مقادیر `sessionKey` صریح (درخواست + نگاشت)، مثلاً `["hook:"]`. وقتی هر نگاشت یا preset از `sessionKey` قالبی استفاده کند، الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ `channel` به‌طور پیش‌فرض `last` است.
- `model` برای این اجرای هوک، LLM را override می‌کند (اگر کاتالوگ مدل تنظیم شده باشد باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- preset داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر آن مسیریابی برای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را به فضای نام Gmail محدود کنید، برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، preset را به‌جای پیش‌فرض قالبی با یک `sessionKey` ایستا override کنید.

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

- Gateway هنگام راه‌اندازی، اگر پیکربندی شده باشد، `gog gmail watch serve` را خودکار شروع می‌کند. برای غیرفعال کردن، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
- یک `gog gmail watch serve` جداگانه را در کنار Gateway اجرا نکنید.

---

## میزبان Plugin کانواس

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
- bindهای غیر loopback: مسیرهای کانواس به احراز هویت Gateway نیاز دارند (توکن/گذرواژه/trusted-proxy)، مانند دیگر سطوح HTTP Gateway.
- WebViewهای Node معمولاً هدرهای احراز هویت نمی‌فرستند؛ پس از pair و متصل شدن یک node، Gateway نشانی‌های URL قابلیتِ محدود به node را برای دسترسی کانواس/A2UI اعلام می‌کند.
- URLهای قابلیت به نشست WS فعال node محدودند و سریع منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت بارگذاری مجدد زنده را به HTML ارائه‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را خودکار ایجاد می‌کند.
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

- `minimal` (پیش‌فرض وقتی Plugin همراه `bonjour` فعال باشد): `cliPath` + `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: شامل `cliPath` + `sshPort` می‌شود؛ تبلیغ multicast در LAN همچنان نیاز دارد Plugin همراه `bonjour` فعال باشد.
- `off`: تبلیغ multicast در LAN را بدون تغییر فعال‌سازی Plugin سرکوب می‌کند.
- Plugin همراه `bonjour` روی میزبان‌های macOS خودکار شروع می‌شود و روی Linux، Windows، و استقرارهای کانتینری Gateway به opt-in نیاز دارد.
- نام میزبان وقتی یک برچسب DNS معتبر باشد به‌طور پیش‌فرض نام میزبان سیستم است، و در غیر این صورت به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` آن را override کنید.

### ناحیه گسترده (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک ناحیهٔ unicast DNS-SD را زیر `~/.openclaw/dns/` می‌نویسد. برای کشف بین شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + Tailscale split DNS همراه کنید.

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
- فایل‌های `.env`: `.env` در CWD + `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
- `shellEnv`: کلیدهای مورد انتظارِ موجود نیست را از پروفایل پوستهٔ ورود شما وارد می‌کند.
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

- فقط نام‌های حروف بزرگ منطبق می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای موجود نیست/خالی هنگام بارگذاری پیکربندی خطا ایجاد می‌کنند.
- برای مقدار لفظی `${VAR}` با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## اسرار

ارجاع‌های راز افزایشی هستند: مقدارهای متن ساده همچنان کار می‌کنند.

### `SecretRef`

از یک شکل شیء استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی شناسهٔ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- شناسهٔ `source: "file"`: نشانگر مطلق JSON (برای مثال `"/providers/openai/apiKey"`)
- الگوی شناسهٔ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (گزینشگرهای سبک AWS مانند `secret#json_key` را پشتیبانی می‌کند)
- شناسه‌های `source: "exec"` نباید شامل بخش‌های مسیرِ جداشده با اسلشِ `.` یا `..` باشند (برای مثال `a/../b` رد می‌شود)

### سطح اعتبارنامهٔ پشتیبانی‌شده

- ماتریس کانونی: [سطح اعتبارنامهٔ SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای اعتبارنامهٔ پشتیبانی‌شدهٔ `openclaw.json` را هدف می‌گیرد.
- ارجاع‌های `auth-profiles.json` در تحلیل زمان اجرا و پوشش حسابرسی گنجانده می‌شوند.

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

- ارائه‌دهندهٔ `file` از `mode: "json"` و `mode: "singleValue"` پشتیبانی می‌کند (`id` در حالت singleValue باید `"value"` باشد).
- مسیرهای ارائه‌دهندهٔ فایل و exec وقتی اعتبارسنجی ACL ویندوز در دسترس نباشد به‌صورت بسته شکست می‌خورند. `allowInsecurePath: true` را فقط برای مسیرهای مورد اعتمادی تنظیم کنید که قابل اعتبارسنجی نیستند.
- ارائه‌دهندهٔ `exec` به مسیر مطلق `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌صورت پیش‌فرض، مسیرهای فرمان symlink رد می‌شوند. برای مجاز کردن مسیرهای symlink در حالی که مسیر مقصدِ حل‌شده اعتبارسنجی می‌شود، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی دایرکتوری مورد اعتماد روی مسیر مقصدِ حل‌شده اعمال می‌شود.
- محیط فرزند `exec` به‌صورت پیش‌فرض حداقلی است؛ متغیرهای لازم را صریحاً با `passEnv` عبور دهید.
- ارجاع‌های راز در زمان فعال‌سازی به یک snapshot درون‌حافظه‌ای تحلیل می‌شوند، سپس مسیرهای درخواست فقط snapshot را می‌خوانند.
- پالایش سطح فعال هنگام فعال‌سازی اعمال می‌شود: ارجاع‌های تحلیل‌نشده روی سطح‌های فعال باعث شکست راه‌اندازی/بارگذاری دوباره می‌شوند، در حالی که سطح‌های غیرفعال با عیب‌یابی‌ها نادیده گرفته می‌شوند.

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
- نگاشت‌های مسطح قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را به پروفایل‌های کلید API کانونی `provider:default` با پشتیبان `.legacy-flat.*.bak` بازنویسی می‌کند.
- پروفایل‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های پروفایل احراز هویت مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های ایستای زمان اجرا از اسنپ‌شات‌های حل‌شده درون‌حافظه‌ای می‌آیند؛ ورودی‌های ایستای قدیمی `auth.json` هنگام کشف پاک‌سازی می‌شوند.
- واردسازی‌های OAuth قدیمی از `~/.openclaw/credentials/oauth.json` انجام می‌شود.
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

- `billingBackoffHours`: عقب‌نشینی پایه بر حسب ساعت وقتی یک پروفایل به‌دلیل خطاهای واقعی
  صورتحساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح صورتحساب
  همچنان می‌تواند حتی در پاسخ‌های `401`/`403` به اینجا برسد، اما تطبیق‌دهنده‌های
  متن ویژه هر ارائه‌دهنده در محدوده همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست
  (برای مثال OpenRouter `Key limit exceeded`). پیام‌های HTTP `402` قابل تلاش مجدد مربوط به پنجره مصرف یا
  محدودیت هزینه سازمان/فضای کاری در عوض در مسیر `rate_limit` می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری برای هر ارائه‌دهنده برای ساعت‌های عقب‌نشینی صورتحساب.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی عقب‌نشینی صورتحساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: عقب‌نشینی پایه بر حسب دقیقه برای شکست‌های با اطمینان بالا از نوع `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد عقب‌نشینی `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجره غلتان بر حسب ساعت که برای شمارنده‌های عقب‌نشینی استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت همان ارائه‌دهنده برای خطاهای بار بیش از حد، پیش از جابه‌جایی به جایگزین مدل (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` به اینجا می‌رسند.
- `overloadedBackoffMs`: تأخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/پروفایل دارای بار بیش از حد (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت همان ارائه‌دهنده برای خطاهای محدودیت نرخ، پیش از جابه‌جایی به جایگزین مدل (پیش‌فرض: `1`). آن سطل محدودیت نرخ شامل متن‌های شکل‌گرفته توسط ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، و `resource exhausted` است.

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
- `maxFileBytes`: حداکثر اندازه فایل گزارش فعال بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 MB). OpenClaw تا پنج آرشیو شماره‌گذاری‌شده را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن با بهترین تلاش برای خروجی کنسول، گزارش‌های فایل، رکوردهای گزارش OTLP، و متن ذخیره‌شده رونوشت نشست. `redactSensitive: "off"` فقط این سیاست عمومی گزارش/رونوشت را غیرفعال می‌کند؛ سطوح ایمنی UI/ابزار/تشخیص همچنان اسرار را پیش از انتشار ویرایش می‌کنند.

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

- `enabled`: کلید اصلی برای خروجی ابزارگذاری (پیش‌فرض: `true`).
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی گزارش هدفمند را فعال می‌کنند (از wildcardهایی مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه برای طبقه‌بندی نشست‌های پردازشی طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled`، یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک، و پیشرفت ACP زمان‌سنج را بازنشانی می‌کنند؛ تشخیص‌های تکراری `session.stuck` تا وقتی تغییری رخ نداده عقب‌نشینی می‌کنند.
- `stuckSessionAbortMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه پیش از آنکه کار فعال متوقف‌شده واجد شرایط بتواند برای بازیابی با تخلیه-لغو متوقف شود. وقتی تنظیم نشده باشد، OpenClaw از پنجره امن‌تر و گسترده‌تر اجرای تعبیه‌شده، دست‌کم 5 دقیقه و 3 برابر `stuckSessionWarnMs`، استفاده می‌کند.
- `memoryPressureSnapshot`: وقتی فشار حافظه به `critical` می‌رسد، یک اسنپ‌شات پایداری ویرایش‌شده پیش از OOM ثبت می‌کند (پیش‌فرض: `false`). برای افزودن پویش/نوشتن فایل بسته پایداری، در حالی که رویدادهای عادی فشار حافظه حفظ می‌شوند، آن را روی `true` بگذارید.
- `otel.enabled`: خط لوله صدور OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، کاتالوگ سیگنال، و مدل حریم خصوصی، [صدور OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: URL گردآورنده برای صدور OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP ویژه هر سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فراداده HTTP/gRPC اضافی که با درخواست‌های صدور OTel ارسال می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: صدور ردیابی، متریک‌ها، یا گزارش را فعال می‌کند.
- `otel.logsExporter`: مقصد صدور گزارش: `"otlp"` (پیش‌فرض)، `"stdout"` برای یک شیء JSON در هر خط stdout، یا `"both"`.
- `otel.sampleRate`: نرخ نمونه‌برداری ردیابی `0`-`1`.
- `otel.flushIntervalMs`: بازه تخلیه دوره‌ای تله‌متری بر حسب میلی‌ثانیه.
- `otel.captureContent`: ثبت محتوای خام به‌صورت opt-in برای ویژگی‌های span در OTEL. پیش‌فرض غیرفعال است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را ثبت می‌کند؛ شکل شیء به شما اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs`، `systemPrompt`، و `toolDefinitions` را صریحاً فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای جدیدترین شکل آزمایشی span استنتاج GenAI، شامل نام‌های span به‌شکل `{gen_ai.operation.name} {gen_ai.request.model}`، نوع span با مقدار `CLIENT`، و `gen_ai.provider.name` به‌جای `gen_ai.system` قدیمی. به‌طور پیش‌فرض، spanها برای سازگاری `openclaw.model.call` و `gen_ai.system` را نگه می‌دارند؛ متریک‌های GenAI از ویژگی‌های معنایی محدود استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از قبل یک SDK سراسری OpenTelemetry ثبت کرده‌اند. سپس OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را رد می‌کند و شنونده‌های تشخیصی را فعال نگه می‌دارد.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`، و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطه پایانی ویژه سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: اسنپ‌شات‌های ردیابی کش را برای اجراهای تعبیه‌شده ثبت می‌کند (پیش‌فرض: `false`).
- `cacheTrace.filePath`: مسیر خروجی برای JSONL ردیابی کش (پیش‌فرض: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: کنترل می‌کند چه چیزی در خروجی ردیابی کش گنجانده شود (همه به‌طور پیش‌فرض: `true`).

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
- `checkOnStart`: هنگام شروع gateway به‌روزرسانی‌های npm را بررسی می‌کند (پیش‌فرض: `true`).
- `auto.enabled`: به‌روزرسانی خودکار پس‌زمینه را برای نصب‌های بسته فعال می‌کند (پیش‌فرض: `false`).
- `auto.stableDelayHours`: حداقل تأخیر بر حسب ساعت پیش از اعمال خودکار کانال پایدار (پیش‌فرض: `6`؛ حداکثر: `168`).
- `auto.stableJitterHours`: پنجره پراکندگی اضافی عرضه کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ حداکثر: `168`).
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

- `enabled`: دروازه سراسری قابلیت ACP (پیش‌فرض: `true`؛ برای پنهان‌کردن dispatch و امکانات spawn مربوط به ACP آن را روی `false` بگذارید).
- `dispatch.enabled`: دروازه مستقل برای dispatch نوبت نشست ACP (پیش‌فرض: `true`). برای در دسترس نگه‌داشتن فرمان‌های ACP در حالی که اجرا مسدود می‌شود، آن را روی `false` بگذارید.
- `backend`: شناسه پیش‌فرض بک‌اند زمان اجرای ACP (باید با یک Plugin زمان اجرای ACP ثبت‌شده مطابقت داشته باشد).
  ابتدا Plugin بک‌اند را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسه Plugin بک‌اند (برای مثال `acpx`) را در آن بگنجانید، وگرنه بک‌اند ACP بارگذاری نمی‌شود.
- `defaultAgent`: شناسه عامل هدف جایگزین ACP وقتی spawnها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: allowlist شناسه‌های عامل مجاز برای نشست‌های زمان اجرای ACP؛ خالی بودن یعنی محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: حداکثر نشست‌های ACP فعال هم‌زمان.
- `stream.coalesceIdleMs`: پنجره تخلیه بیکار بر حسب میلی‌ثانیه برای متن stream‌شده.
- `stream.maxChunkChars`: حداکثر اندازه قطعه پیش از تقسیم projection بلوک stream‌شده.
- `stream.repeatSuppression`: خطوط وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی stream می‌کند؛ `"final_only"` تا رویدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل مشاهده بعد از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: حداکثر نویسه‌های خروجی دستیار که در هر نوبت ACP projection می‌شوند.
- `stream.maxSessionUpdateChars`: حداکثر نویسه‌ها برای خطوط وضعیت/به‌روزرسانی ACP که projection می‌شوند.
- `stream.tagVisibility`: رکوردی از نام‌های تگ به بازنویسی‌های بولی نمایش‌پذیری برای رویدادهای stream‌شده.
- `runtime.ttlMinutes`: TTL بیکار بر حسب دقیقه برای کارگرهای نشست ACP پیش از واجد شرایط شدن برای پاک‌سازی.
- `runtime.installCommand`: فرمان نصب اختیاری برای اجرا هنگام bootstrap کردن محیط زمان اجرای ACP.

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
  - `"off"`: بدون متن شعار (عنوان/نسخهٔ بنر همچنان نشان داده می‌شود).
- برای پنهان کردن کل بنر (نه فقط شعارها)، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## جادوگر

فراداده‌ای که توسط جریان‌های راه‌اندازی هدایت‌شدهٔ CLI (`onboard`، `configure`، `doctor`) نوشته می‌شود:

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

ساخت‌های فعلی دیگر شامل پل TCP نیستند. گره‌ها از طریق WebSocket مربوط به Gateway وصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از طرح‌وارهٔ پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها ناموفق می‌شود؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت نگهداری جلسه‌های اجرای Cron ایزولهٔ تکمیل‌شده پیش از هرس از `sessions.json`. پاک‌سازی رونوشت‌های بایگانی‌شدهٔ Cron حذف‌شده را نیز کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال کردن، `false` تنظیم کنید.
- `runLog.maxBytes`: برای سازگاری با لاگ‌های اجرای Cron قدیمی‌تر مبتنی بر فایل پذیرفته می‌شود. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین ردیف‌های تاریخچهٔ اجرا در SQLite که برای هر کار نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن bearer که برای تحویل POST مربوط به Webhook کرون (`delivery.mode = "webhook"`) استفاده می‌شود؛ اگر حذف شود، هیچ سرآیند احراز هویتی ارسال نمی‌شود.
- `webhook`: URL Webhook قدیمیِ منسوخ‌شده (http/https) که `openclaw doctor --fix` برای مهاجرت کارهای ذخیره‌شده‌ای استفاده می‌کند که هنوز `notify: true` دارند؛ تحویل زمان اجرا از `delivery.mode="webhook"` هر کار به‌همراه `delivery.to`، یا هنگام حفظ تحویل اعلان از `delivery.completionDestination` استفاده می‌کند.

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

- `maxAttempts`: بیشینهٔ تلاش‌های دوباره برای کارهای Cron در خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0`-`10`).
- `backoffMs`: آرایه‌ای از تأخیرهای backoff بر حسب ms برای هر تلاش دوباره (پیش‌فرض: `[30000, 60000, 300000]`؛ ۱ تا ۱۰ ورودی).
- `retryOn`: انواع خطاهایی که تلاش دوباره را فعال می‌کنند - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش دوباره روی همهٔ انواع گذرا، حذفش کنید.

کارهای تک‌اجرا تا زمانی که تلاش‌های دوباره تمام شوند فعال می‌مانند، سپس در حالی که وضعیت خطای نهایی را نگه می‌دارند غیرفعال می‌شوند. کارهای تکرارشونده از همان خط‌مشی تلاش دوبارهٔ گذرا استفاده می‌کنند تا پیش از نوبت زمان‌بندی‌شدهٔ بعدی، پس از backoff دوباره اجرا شوند؛ خطاهای دائمی یا پایان یافتن تلاش‌های دوبارهٔ گذرا با backoff خطا به زمان‌بندی تکرارشوندهٔ عادی برمی‌گردند.

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

- `enabled`: هشدارهای شکست برای کارهای Cron را فعال می‌کند (پیش‌فرض: `false`).
- `after`: تعداد شکست‌های پیاپی پیش از ارسال هشدار (عدد صحیح مثبت، کمینه: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: اجراهای ردشدهٔ پیاپی را در آستانهٔ هشدار حساب می‌کند (پیش‌فرض: `false`). اجراهای ردشده جداگانه پیگیری می‌شوند و روی backoff خطای اجرا اثری ندارند.
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
- `mode`: `"announce"` یا `"webhook"`؛ وقتی دادهٔ هدف کافی وجود داشته باشد، پیش‌فرض `"announce"` است.
- `channel`: بازنویسی کانال برای تحویل اعلان. `"last"` از آخرین کانال تحویل شناخته‌شده دوباره استفاده می‌کند.
- `to`: هدف اعلان یا URL Webhook صریح. برای حالت Webhook الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- `delivery.failureDestination` هر کار این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست هر کار تنظیم نشده باشد، کارهایی که از پیش از طریق `announce` تحویل می‌دهند، در صورت شکست به همان هدف اعلان اصلی برمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر آنکه `delivery.mode` اصلی کار `"webhook"` باشد.

[کارهای Cron](/fa/automation/cron-jobs) را ببینید. اجرای‌های Cron ایزوله به‌عنوان [کارهای پس‌زمینه](/fa/automation/tasks) پیگیری می‌شوند.

---

## متغیرهای قالب مدل رسانه

جانگهدارهای قالب که در `tools.media.models[].args` گسترش می‌یابند:

| متغیر              | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | متن کامل پیام ورودی                              |
| `{{RawBody}}`      | بدنهٔ خام (بدون پوشش‌های تاریخچه/فرستنده)        |
| `{{BodyStripped}}` | بدنه با حذف اشاره‌های گروهی                      |
| `{{From}}`         | شناسهٔ فرستنده                                   |
| `{{To}}`           | شناسهٔ مقصد                                      |
| `{{MessageSid}}`   | شناسهٔ پیام کانال                                |
| `{{SessionId}}`    | UUID جلسهٔ فعلی                                  |
| `{{IsNewSession}}` | `"true"` وقتی جلسهٔ جدید ساخته شده باشد          |
| `{{MediaUrl}}`     | شبه‌URL رسانهٔ ورودی                             |
| `{{MediaPath}}`    | مسیر محلی رسانه                                  |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)                      |
| `{{Transcript}}`   | رونوشت صوتی                                      |
| `{{Prompt}}`       | prompt رسانهٔ حل‌شده برای ورودی‌های CLI          |
| `{{MaxChars}}`     | بیشینهٔ نویسه‌های خروجی حل‌شده برای ورودی‌های CLI |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (تا حد امکان)                         |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (تا حد امکان)               |
| `{{SenderName}}`   | نام نمایشی فرستنده (تا حد امکان)                 |
| `{{SenderE164}}`   | شماره تلفن فرستنده (تا حد امکان)                 |
| `{{Provider}}`     | راهنمای ارائه‌دهنده (whatsapp، telegram، discord و غیره) |

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
- آرایه‌ای از فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شوند (موارد بعدی موارد قبلی را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از includeها ادغام می‌شوند (مقادیر includeشده را بازنویسی می‌کنند).
- includeهای تو در تو: تا ۱۰ سطح عمق.
- مسیرها: نسبت به فایل includeکننده حل می‌شوند، اما باید درون پوشهٔ پیکربندی سطح بالا (`dirname` مربوط به `openclaw.json`) بمانند. شکل‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل آن مرز حل شوند. مسیرها نباید بایت null داشته باشند و باید پیش و پس از حل شدن، به‌طور قطعی کوتاه‌تر از ۴۰۹۶ نویسه باشند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالای پشتیبانی‌شده با include تک‌فایلی را تغییر می‌دهند، مستقیماً در همان فایل includeشده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- includeهای ریشه، آرایه‌های include، و includeهایی با بازنویسی‌های هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط‌خواندنی هستند؛ این نوشتن‌ها به‌جای تخت کردن پیکربندی، fail closed می‌شوند.
- خطاها: پیام‌های روشن برای فایل‌های گم‌شده، خطاهای تجزیه، includeهای حلقوی، قالب مسیر نامعتبر، و طول بیش از حد.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

---
read_when:
    - به معناشناسی دقیق پیکربندی در سطح فیلد یا مقادیر پیش‌فرض نیاز دارید
    - شما در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای اصلی OpenClaw، پیش‌فرض‌ها، و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-05-05T01:46:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82164a3ea7592f667573b643ee9e0ec840b9b622c9d86c382a3feaf192e75684
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی یک زیرسیستم مرجع عمیق‌تری برای خودش داشته باشد، به آن لینک می‌دهد. کاتالوگ‌های فرمان متعلق به کانال و Plugin و تنظیمات عمیق حافظه/QMD در صفحه‌های خودشان قرار دارند، نه در این صفحه.

حقیقت کد:

- `openclaw config schema` JSON Schema زنده‌ای را چاپ می‌کند که برای اعتبارسنجی و Control UI استفاده می‌شود، همراه با فراداده‌های بسته‌بندی‌شده/Plugin/کانال که در صورت وجود ادغام شده‌اند
- `config.schema.lookup` یک گره اسکیما با محدوده مسیر را برای ابزارهای بررسی جزئی برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش مبنای مستندات پیکربندی را در برابر سطح اسکیمای فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی عامل: پیش از ویرایش‌ها، از کنش ابزار `gateway` یعنی `config.schema.lookup` برای
مستندات و محدودیت‌های دقیق در سطح فیلد استفاده کنید. از
[پیکربندی](/fa/gateway/configuration) برای راهنمایی وظیفه‌محور و از این صفحه
برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها، و لینک‌ها به مراجع زیرسیستم استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations`، و پیکربندی Dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [فرمان‌های اسلش](/fa/tools/slash-commands) برای کاتالوگ فرمان داخلی + بسته‌بندی‌شده فعلی
- صفحه‌های کانال/Plugin مالک برای سطوح فرمان مخصوص کانال

قالب پیکربندی **JSON5** است (کامنت‌ها + کاماهای انتهایی مجازند). همه فیلدها اختیاری هستند — OpenClaw هنگام حذف شدن آن‌ها از پیش‌فرض‌های ایمن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند — برای `channels.*`،
از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و سایر
کانال‌های بسته‌بندی‌شده (احراز هویت، کنترل دسترسی، چندحسابی، دروازه‌گذاری منشن)،
[پیکربندی — کانال‌ها](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های عامل، چندعاملی، نشست‌ها، و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است — ببینید
[پیکربندی — عامل‌ها](/fa/gateway/config-agents) برای:

- `agents.defaults.*` (فضای کاری، مدل، تفکر، Heartbeat، حافظه، رسانه، skills، sandbox)
- `multiAgent.*` (مسیریابی و اتصال‌های چندعاملی)
- `session.*` (چرخه عمر نشست، Compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر markdown)
- `talk.*` (حالت Talk)
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk در iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال رونوشت، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، سوییچ‌های آزمایشی، پیکربندی ابزارهای متکی بر ارائه‌دهنده، و تنظیم
ارائه‌دهنده سفارشی / URL پایه به صفحه‌ای اختصاصی منتقل شده است — ببینید
[پیکربندی — ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools).

## مدل‌ها

تعریف‌های ارائه‌دهنده، allowlistهای مدل، و تنظیم ارائه‌دهنده سفارشی در
[پیکربندی — ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند.
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
- `models.providers`: نقشه ارائه‌دهنده سفارشی که با شناسه ارائه‌دهنده کلیدگذاری شده است.
- `models.pricing.enabled`: bootstrap قیمت‌گذاری پس‌زمینه را کنترل می‌کند که
  پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد،
  Gateway دریافت‌های کاتالوگ قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقدارهای پیکربندی‌شده
  `models.providers.*.models[].cost` همچنان برای برآورد هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط
Pi جاسازی‌شده و سایر آداپترهای runtime مصرف می‌شوند. فرمان‌های `openclaw mcp list`،
`show`، `set`، و `unset` این بلوک را بدون اتصال به
سرور هدف هنگام ویرایش‌های پیکربندی مدیریت می‌کنند.

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

- `mcp.servers`: تعریف‌های نام‌گذاری‌شده سرور MCP از نوع stdio یا remote برای runtimeهایی که
  ابزارهای MCP پیکربندی‌شده را ارائه می‌کنند.
  ورودی‌های remote از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛
  `type: "http"` یک نام مستعار بومی CLI است که `openclaw mcp set` و
  `openclaw doctor --fix` آن را به فیلد canonical یعنی `transport` نرمال‌سازی می‌کنند.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای runtimeهای MCP بسته‌بندی‌شده با محدوده نشست.
  اجراهای جاسازی‌شده یک‌باره درخواست پاک‌سازی پایان اجرا می‌دهند؛ این TTL پشتوانه‌ای برای
  نشست‌های بلندمدت و فراخوان‌های آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP نشست cacheشده، به‌صورت hot-apply اعمال می‌شوند.
  کشف/استفاده بعدی از ابزار آن‌ها را از پیکربندی جدید دوباره ایجاد می‌کند، بنابراین ورودی‌های حذف‌شده
  `mcp.servers` به‌جای انتظار برای TTL بیکاری، بلافاصله جمع‌آوری می‌شوند.

برای رفتار runtime، [MCP](/fa/cli/mcp#openclaw-as-an-mcp-client-registry) و
[backendهای CLI](/fa/gateway/cli-backends#bundle-mcp-overlays) را ببینید.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
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

- `allowBundled`: allowlist اختیاری فقط برای Skills بسته‌بندی‌شده (Skills مدیریت‌شده/فضای کاری بی‌تأثیر می‌مانند).
- `load.extraDirs`: ریشه‌های Skill مشترک اضافی (پایین‌ترین اولویت).
- `install.preferBrew`: وقتی true باشد، اگر `brew` در دسترس باشد، پیش از fallback به گونه‌های دیگر installer،
  installerهای Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح installer node برای مشخصات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` یک Skill را حتی اگر بسته‌بندی‌شده/نصب‌شده باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بری برای Skillsای که یک env var اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

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
- کشف، Pluginهای بومی OpenClaw به‌علاوه bundleهای سازگار Codex و bundleهای Claude، از جمله bundleهای layout پیش‌فرض Claude بدون manifest را می‌پذیرد.
- **تغییرات پیکربندی نیازمند راه‌اندازی مجدد gateway هستند.**
- `allow`: allowlist اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` غالب است.
- `bundledDiscovery`: برای پیکربندی‌های جدید پیش‌فرضش `"allowlist"` است، بنابراین یک
  `plugins.allow` غیرخالی، Pluginهای ارائه‌دهنده بسته‌بندی‌شده، از جمله ارائه‌دهندگان runtime جست‌وجوی وب را هم
  gate می‌کند. Doctor برای پیکربندی‌های allowlist قدیمی مهاجرت‌داده‌شده `"compat"` می‌نویسد
  تا رفتار موجود ارائه‌دهنده بسته‌بندی‌شده تا زمان opt in حفظ شود.
- `plugins.entries.<id>.apiKey`: فیلد میان‌بر کلید API در سطح Plugin (وقتی توسط Plugin پشتیبانی شود).
- `plugins.entries.<id>.env`: نقشه env var با محدوده Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، هسته `before_prompt_build` را مسدود می‌کند و فیلدهای prompt-mutating را از `before_agent_start` قدیمی نادیده می‌گیرد، در حالی که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. برای hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط bundle پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیربسته‌بندی‌شده مورد اعتماد می‌توانند محتوای خام مکالمه را از hookهای typed مانند `llm_input`، `llm_output`، `before_agent_finalize`، و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به این Plugin صراحتا اعتماد می‌کند تا overrideهای `provider` و `model` هر اجرا را برای اجراهای subagent پس‌زمینه درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist اختیاری از targetهای canonical `provider/model` برای overrideهای subagent مورد اعتماد. فقط وقتی عمدا می‌خواهید هر مدلی را مجاز کنید از `"*"` استفاده کنید.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (در صورت وجود، با اسکیمای Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/runtime کانال Plugin زیر `channels.<id>` قرار دارند و باید با فراداده `channelConfigs` در manifest Plugin مالک توصیف شوند، نه با یک رجیستری مرکزی گزینه‌های OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: تنظیمات ارائه‌دهنده web-fetch مربوط به Firecrawl.
  - `apiKey`: کلید API Firecrawl (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، مقدار قدیمی `tools.web.fetch.firecrawl.apiKey`، یا env var یعنی `FIRECRAWL_API_KEY` fallback می‌کند.
  - `baseUrl`: URL پایه API Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای self-hosted باید endpointهای private/internal را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی را از صفحه‌ها استخراج می‌کند (پیش‌فرض: `true`).
  - `maxAgeMs`: بیشینه عمر cache بر حسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: timeout درخواست scrape بر حسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جست‌وجوی وب Grok).
  - `enabled`: ارائه‌دهنده X Search را فعال می‌کند.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مثلا `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات Dreaming حافظه. برای فازها و آستانه‌ها [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: کلید اصلی Dreaming (پیش‌فرض `false`).
  - `frequency`: cadence کرون برای هر sweep کامل Dreaming (به‌طور پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent مربوط به Dream Diary. نیازمند `plugins.entries.memory-core.subagent.allowModelOverride: true` است؛ همراه با `allowedModels` استفاده کنید تا targetها محدود شوند. خطاهای model-unavailable یک‌بار با مدل پیش‌فرض نشست retry می‌شوند؛ شکست‌های trust یا allowlist بی‌صدا fallback نمی‌کنند.
  - سیاست فاز و آستانه‌ها جزئیات پیاده‌سازی هستند (کلیدهای پیکربندی کاربرمحور نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای bundle فعال Claude همچنین می‌توانند پیش‌فرض‌های Pi جاسازی‌شده را از `settings.json` ارائه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات پاک‌سازی‌شده عامل اعمال می‌کند، نه patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin حافظه فعال را انتخاب می‌کند، یا برای غیرفعال کردن Pluginهای حافظه `"none"` را انتخاب کنید.
- `plugins.slots.contextEngine`: شناسه Plugin موتور context فعال را انتخاب می‌کند؛ مگر اینکه موتور دیگری را نصب و انتخاب کنید، پیش‌فرض `"legacy"` است.

[Pluginها](/fa/tools/plugin) را ببینید.

---

## تعهدها

`commitments` حافظه پیگیری استنباط‌شده را کنترل می‌کند: OpenClaw می‌تواند check-inها را از turnهای مکالمه تشخیص دهد و آن‌ها را از طریق اجراهای Heartbeat تحویل دهد.

- `commitments.enabled`: استخراج LLM پنهان، ذخیره‌سازی، و تحویل Heartbeat را برای تعهدهای پیگیری استنباط‌شده فعال می‌کند. پیش‌فرض: `false`.
- `commitments.maxPerDay`: بیشینه تعهدهای پیگیری استنباط‌شده که در یک روز rolling برای هر نشست عامل تحویل داده می‌شوند. پیش‌فرض: `3`.

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
- `tabCleanup` زبانه‌های ردیابی‌شده‌ی عامل اصلی را پس از زمان بیکاری یا وقتی یک
  نشست از سقف خود فراتر برود، بازپس می‌گیرد. برای غیرفعال کردن هرکدام از این
  حالت‌های پاک‌سازی، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین پیمایش مرورگر به‌صورت پیش‌فرض سخت‌گیرانه می‌ماند.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را فقط وقتی تنظیم کنید که عمداً به پیمایش مرورگر در شبکه‌ی خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقطه‌های پایانی پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترسی‌پذیری/کشف، مشمول همان مسدودسازی شبکه‌ی خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- پروفایل‌های راه‌دور فقط-اتصال هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl` مقدارهای `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند از HTTP(S) استفاده کنید؛
  وقتی ارائه‌دهنده‌ی شما یک URL مستقیم WebSocket برای DevTools می‌دهد، از WS(S)
  استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترسی‌پذیری CDP راه‌دور و
  `attachOnly` و همچنین درخواست‌های باز کردن زبانه اعمال می‌شوند. پروفایل‌های
  loopback مدیریت‌شده، پیش‌فرض‌های CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP مدیریت‌شده‌ی بیرونی از طریق loopback در دسترس است، برای آن
  پروفایل `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw پورت loopback را
  به‌عنوان یک پروفایل مرورگر محلی مدیریت‌شده در نظر می‌گیرد و ممکن است خطاهای
  مالکیت پورت محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل شوند.
- پروفایل‌های `existing-session` می‌توانند برای هدف گرفتن یک پروفایل مرورگر مشخص مبتنی بر
  Chromium مانند Brave یا Edge، مقدار `userDataDir` را تنظیم کنند.
- پروفایل‌های `existing-session` محدودیت‌های مسیر فعلی Chrome MCP را نگه می‌دارند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری با انتخابگر CSS، قلاب‌های بارگذاری
  یک‌فایلی، بدون بازنویسی مهلت گفت‌وگو، بدون `wait --load networkidle`، و بدون
  `responsebody`، خروجی PDF، رهگیری دانلود، یا کنش‌های دسته‌ای.
- پروفایل‌های محلی مدیریت‌شده‌ی `openclaw` مقدارهای `cdpPort` و `cdpUrl` را خودکار تخصیص می‌دهند؛
  `cdpUrl` را فقط برای CDP راه‌دور به‌صراحت تنظیم کنید.
- پروفایل‌های محلی مدیریت‌شده می‌توانند برای بازنویسی `browser.executablePath` سراسری
  برای همان پروفایل، `executablePath` را تنظیم کنند. از این برای اجرای یک پروفایل در
  Chrome و پروفایلی دیگر در Brave استفاده کنید.
- پروفایل‌های محلی مدیریت‌شده پس از شروع فرایند، برای کشف HTTP مربوط به Chrome CDP از
  `browser.localLaunchTimeoutMs` و برای آمادگی websocket مربوط به CDP پس از اجرا از
  `browser.localCdpReadyTimeoutMs` استفاده می‌کنند. روی میزبان‌های کندتر که Chrome با
  موفقیت شروع می‌شود اما بررسی‌های آمادگی با راه‌اندازی رقابت می‌کنند، این مقدارها را
  افزایش دهید. هر دو مقدار باید عدد صحیح مثبت تا `120000` میلی‌ثانیه باشند؛
  مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو پیش از اجرای
  Chromium، `~` و `~/...` را برای پوشه‌ی خانگی سیستم‌عامل شما می‌پذیرند.
  `userDataDir` در هر پروفایل برای پروفایل‌های `existing-session` نیز با tilde گسترش می‌یابد.
- سرویس کنترل: فقط loopback (پورت مشتق‌شده از `gateway.port`، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های اجرای اضافی را به راه‌اندازی محلی Chromium اضافه می‌کند (برای نمونه
  `--disable-gpu`، اندازه‌بندی پنجره، یا پرچم‌های اشکال‌زدایی).

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
- `assistant`: بازنویسی هویت Control UI. در صورت نبود، به هویت عامل فعال بازمی‌گردد.

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

- `mode`: `local` (اجرای gateway) یا `remote` (اتصال به gateway راه‌دور). Gateway شروع به کار را رد می‌کند مگر اینکه `local` باشد.
- `port`: پورت multiplexed تکی برای WS + HTTP. اولویت: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP مربوط به Tailscale)، یا `custom`.
- **نام‌های مستعار bind قدیمی**: در `gateway.bind` از مقادیر حالت bind استفاده کنید (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، نه نام‌های مستعار host (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **نکته Docker**: bind پیش‌فرض `loopback` داخل container روی `127.0.0.1` گوش می‌دهد. با شبکه‌سازی Docker bridge (`-p 18789:18789`)، ترافیک روی `eth0` وارد می‌شود، بنابراین gateway دسترس‌ناپذیر است. برای گوش دادن روی همه interfaceها از `--network host` استفاده کنید، یا `bind: "lan"` (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) را تنظیم کنید.
- **Auth**: به‌صورت پیش‌فرض لازم است. bindهای غیر-loopback به auth برای gateway نیاز دارند. در عمل یعنی یک token/password مشترک یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. جادوگر onboarding به‌صورت پیش‌فرض یک token ایجاد می‌کند.
- اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefها)، `gateway.auth.mode` را صراحتا روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، startup و جریان‌های نصب/repair سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون auth. فقط برای راه‌اندازی‌های مورداعتماد local loopback استفاده کنید؛ این حالت عمدا در promptهای onboarding ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: auth مرورگر/کاربر را به یک reverse proxy آگاه از هویت واگذار می‌کند و به headerهای هویت از `gateway.trustedProxies` اعتماد می‌کند (ببینید [Auth با Trusted Proxy](/fa/gateway/trusted-proxy-auth)). این حالت به‌صورت پیش‌فرض یک منبع proxy **غیر-loopback** انتظار دارد؛ reverse proxyهای loopback روی همان host به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی روی همان host می‌توانند از `gateway.auth.password` به‌عنوان fallback مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، headerهای هویت Tailscale Serve می‌توانند auth مربوط به Control UI/WebSocket را برآورده کنند (از طریق `tailscale whois` تأیید می‌شود). endpointهای HTTP API از آن auth مبتنی بر header مربوط به Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت auth معمول HTTP در gateway پیروی می‌کنند. این جریان بدون token فرض می‌کند host مربوط به gateway مورداعتماد است. وقتی `tailscale.mode = "serve"` باشد، پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکننده اختیاری auth ناموفق. برای هر IP کلاینت و هر محدوده auth اعمال می‌شود (shared-secret و device-token جداگانه ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر async مربوط به Tailscale Serve Control UI، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن failure به‌صورت سریالی اجرا می‌شوند. بنابراین تلاش‌های بد هم‌زمان از همان client می‌توانند در درخواست دوم limiter را فعال کنند، به‌جای اینکه هر دو صرفا به‌عنوان mismatch ساده عبور کنند.
  - مقدار پیش‌فرض `gateway.auth.rateLimit.exemptLoopback` برابر `true` است؛ وقتی عمدا می‌خواهید ترافیک localhost هم rate-limit شود (برای setupهای تست یا استقرارهای proxy سخت‌گیرانه)، آن را روی `false` تنظیم کنید.
- تلاش‌های auth مربوط به WS با origin مرورگر همیشه با غیرفعال بودن معافیت loopback محدودسازی می‌شوند (دفاع چندلایه در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، آن lockoutهای با origin مرورگر به ازای مقدار نرمال‌شده `Origin`
  جدا می‌شوند، بنابراین شکست‌های تکراری از یک origin مربوط به localhost به‌صورت خودکار
  origin متفاوتی را lock out نمی‌کنند.
- `tailscale.mode`: `serve` (فقط tailnet، bind روی loopback) یا `funnel` (عمومی، نیازمند auth).
- `controlUi.allowedOrigins`: allowlist صریح origin مرورگر برای اتصال‌های Gateway WebSocket. وقتی انتظار می‌رود clientهای مرورگر از originهای غیر-loopback باشند، لازم است.
- `controlUi.chatMessageMaxWidth`: max-width اختیاری برای پیام‌های chat گروه‌بندی‌شده در Control UI. مقادیر محدودشده width در CSS مانند `960px`، `82%`، `min(1280px, 82%)`، و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناکی که fallback origin مبتنی بر header مربوط به Host را برای استقرارهایی فعال می‌کند که عمدا به سیاست origin مبتنی بر Host-header متکی هستند.
- `remote.transport`: `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، مقدار `remote.url` باید `ws://` یا `wss://` باشد.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override اضطراری در environment process سمت client
  که اجازه می‌دهد `ws://` plaintext به IPهای private-network مورداعتماد استفاده شود؛
  پیش‌فرض برای plaintext همچنان فقط loopback است. معادل `openclaw.json`
  وجود ندارد، و config شبکه خصوصی مرورگر مانند
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` روی clientهای Gateway
  WebSocket اثری ندارد.
- `gateway.remote.token` / `.password` فیلدهای credential برای remote-client هستند. آن‌ها به‌تنهایی auth مربوط به gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: URL پایه HTTPS برای relay خارجی APNs که buildهای رسمی/TestFlight iOS پس از انتشار registrationهای متکی به relay در gateway از آن استفاده می‌کنند. این URL باید با relay URL کامپایل‌شده داخل build iOS مطابقت داشته باشد.
- `gateway.push.apns.relay.timeoutMs`: timeout ارسال gateway به relay بر حسب میلی‌ثانیه. مقدار پیش‌فرض `10000` است.
- registrationهای متکی به relay به یک هویت gateway مشخص واگذار می‌شوند. app جفت‌شده iOS مقدار `gateway.identity.get` را دریافت می‌کند، آن هویت را در registration مربوط به relay قرار می‌دهد، و یک grant ارسال scoped به همان registration را به gateway forward می‌کند. Gateway دیگری نمی‌تواند آن registration ذخیره‌شده را دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای config مربوط به relay در بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه گریز فقط مخصوص توسعه برای URLهای relay روی loopback HTTP. URLهای relay تولیدی باید روی HTTPS بمانند.
- `gateway.handshakeTimeoutMs`: timeout handshake مربوط به Gateway WebSocket پیش از auth بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد، اولویت دارد. روی hostهای پربار یا کم‌توان که clientهای محلی می‌توانند وصل شوند در حالی که warmup زمان startup هنوز در حال تثبیت است، این مقدار را افزایش دهید.
- `gateway.channelHealthCheckMinutes`: فاصله health-monitor مربوط به channel بر حسب دقیقه. برای غیرفعال کردن restartهای health-monitor به‌صورت سراسری، `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانه stale-socket بر حسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: بیشینه restartهای health-monitor برای هر channel/account در یک ساعت rolling. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out به ازای هر channel برای restartهای health-monitor در حالی که monitor سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override به ازای هر account برای channelهای چند-accountی. وقتی تنظیم شود، بر override سطح channel اولویت دارد.
- مسیرهای فراخوانی gateway محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
- اگر `gateway.auth.token` / `gateway.auth.password` به‌صورت صریح از طریق SecretRef پیکربندی شده و unresolved باشد، resolution به‌صورت بسته شکست می‌خورد (بدون masking توسط remote fallback).
- `trustedProxies`: IPهای reverse proxy که TLS را terminate می‌کنند یا headerهای forwarded-client را inject می‌کنند. فقط proxyهایی را فهرست کنید که کنترلشان می‌کنید. entryهای loopback همچنان برای setupهای proxy/local-detection روی همان host معتبرند (برای مثال Tailscale Serve یا یک reverse proxy محلی)، اما آن‌ها درخواست‌های loopback را برای `gateway.auth.mode: "trusted-proxy"` واجد شرایط نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` وجود نداشته باشد، gateway مقدار `X-Real-IP` را می‌پذیرد. پیش‌فرض `false` برای رفتار fail-closed است.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای auto-approve کردن pairing نخستین‌بار device مربوط به node بدون scopeهای درخواست‌شده. وقتی تنظیم نشده باشد غیرفعال است. این کار pairing مربوط به operator/browser/Control UI/WebChat را auto-approve نمی‌کند، و role، scope، metadata، یا upgradeهای public-key را هم auto-approve نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی allow/deny سراسری برای commandهای اعلام‌شده node پس از pairing و ارزیابی allowlist پلتفرم. از `allowCommands` برای opt in به commandهای خطرناک node مانند `camera.snap`، `camera.clip`، و `screen.record` استفاده کنید؛ `denyCommands` یک command را حتی اگر default پلتفرم یا allow صریح در غیر این صورت آن را شامل می‌شد، حذف می‌کند. پس از اینکه node فهرست commandهای اعلام‌شده خود را تغییر داد، pairing آن device را reject و دوباره approve کنید تا gateway snapshot به‌روزشده commandها را ذخیره کند.
- `gateway.tools.deny`: نام toolهای اضافی مسدودشده برای HTTP `POST /tools/invoke` (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام toolها را از فهرست deny پیش‌فرض HTTP حذف می‌کند.

</Accordion>

### endpointهای سازگار با OpenAI

- Chat Completions: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی URL-input در Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی unset در نظر گرفته می‌شوند؛ برای غیرفعال کردن دریافت URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- header اختیاری برای سخت‌سازی response:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای originهای HTTPS تحت کنترل خودتان تنظیم کنید؛ ببینید [Auth با Trusted Proxy](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### جداسازی چند-instance

چند gateway را روی یک host با پورت‌ها و state dirهای یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

flagهای راحتی: `--dev` (از `~/.openclaw-dev` + پورت `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

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

- `enabled`: termination مربوط به TLS را در listener مربوط به gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده‌اند، یک جفت cert/key خودامضاشده محلی را خودکار تولید می‌کند؛ فقط برای استفاده local/dev.
- `certPath`: مسیر filesystem به فایل گواهی TLS.
- `keyPath`: مسیر filesystem به فایل private key مربوط به TLS؛ با permission محدود نگه دارید.
- `caPath`: مسیر اختیاری bundle مربوط به CA برای verification کلاینت یا trust chainهای سفارشی.

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

- `mode`: کنترل می‌کند editهای config چگونه در runtime اعمال شوند.
  - `"off"`: editهای live را نادیده می‌گیرد؛ تغییرات به restart صریح نیاز دارند.
  - `"restart"`: همیشه process مربوط به gateway را هنگام تغییر config restart می‌کند.
  - `"hot"`: تغییرات را بدون restart در همان process اعمال می‌کند.
  - `"hybrid"` (پیش‌فرض): ابتدا hot reload را امتحان می‌کند؛ در صورت نیاز به restart fallback می‌کند.
- `debounceMs`: پنجره debounce بر حسب ms پیش از اعمال تغییرات config (عدد صحیح نامنفی).
- `deferralTimeoutMs`: بیشینه زمان اختیاری بر حسب ms برای انتظار جهت پایان عملیات‌های in-flight پیش از forcing یک restart. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای still-pending مقدار `0` تنظیم کنید.

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
توکن‌های hook در رشتهٔ پرس‌وجو رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به یک `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید از `gateway.auth.token` **متمایز** باشد؛ استفادهٔ دوباره از توکن Gateway رد می‌شود.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیرمسیر اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید، برای مثال `["hook:"]`.
- اگر یک نگاشت یا preset از `sessionKey` قالبی استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این opt-in نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط وقتی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقادیر `sessionKey` نگاشت که از قالب رندر شده‌اند به‌عنوان دادهٔ بیرونی تلقی می‌شوند و آن‌ها نیز به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="جزئیات نگاشت">

- `match.path` با زیرمسیر بعد از `/hooks` مطابقت می‌کند (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` با یک فیلد payload برای مسیرهای عمومی مطابقت می‌کند.
- قالب‌هایی مانند `{{messages[0].subject}}` از payload می‌خوانند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش hook برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و داخل `hooks.transformsDir` بماند (مسیرهای مطلق و پیمایش مسیر رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های skill فضای کاری رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transforms hooks منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک agent مشخص مسیریابی می‌کند؛ شناسه‌های ناشناخته به حالت پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: مسیریابی صریح را محدود می‌کند (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید نشست ثابت اختیاری برای اجرای agent مربوط به hook بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای نشست نگاشت مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: allowlist پیشوند اختیاری برای مقادیر `sessionKey` صریح (درخواست + نگاشت)، مثلاً `["hook:"]`. وقتی هر نگاشت یا preset از `sessionKey` قالبی استفاده کند، الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ مقدار پیش‌فرض `channel` برابر `last` است.
- `model` برای این اجرای hook، LLM را بازنویسی می‌کند (اگر کاتالوگ مدل تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- preset داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر آن مسیریابی به‌ازای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را طوری محدود کنید که با فضای نام Gmail مطابقت داشته باشد، برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، preset را به‌جای مقدار پیش‌فرض قالبی، با یک `sessionKey` ایستا بازنویسی کنید.

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

- Gateway هنگام راه‌اندازی، در صورت پیکربندی، `gog gmail watch serve` را به‌طور خودکار شروع می‌کند. برای غیرفعال‌سازی، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
- یک `gog gmail watch serve` جداگانه را هم‌زمان با Gateway اجرا نکنید.

---

## میزبان Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- HTML/CSS/JS قابل ویرایش توسط agent و A2UI را از طریق HTTP زیر پورت Gateway سرو می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- bindهای غیر loopback: مسیرهای canvas به احراز هویت Gateway نیاز دارند (توکن/رمز عبور/trusted-proxy)، همانند دیگر سطح‌های HTTP Gateway.
- WebViewهای Node معمولاً هدرهای احراز هویت نمی‌فرستند؛ پس از pair و وصل شدن یک node، Gateway برای دسترسی canvas/A2UI، URLهای قابلیت با دامنهٔ node را اعلام می‌کند.
- URLهای قابلیت به نشست WS فعال node متصل‌اند و سریع منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت live-reload را در HTML سرو شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را خودکار ایجاد می‌کند.
- همچنین A2UI را در `/__openclaw__/a2ui/` سرو می‌کند.
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

- `minimal` (پیش‌فرض وقتی Plugin بسته‌بندی‌شدهٔ `bonjour` فعال باشد): `cliPath` + `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: `cliPath` + `sshPort` را شامل می‌کند؛ تبلیغ multicast در LAN همچنان نیاز دارد Plugin بسته‌بندی‌شدهٔ `bonjour` فعال باشد.
- `off`: تبلیغ multicast در LAN را بدون تغییر فعال‌بودن Plugin سرکوب می‌کند.
- Plugin بسته‌بندی‌شدهٔ `bonjour` روی میزبان‌های macOS به‌طور خودکار شروع می‌شود و روی Linux، Windows، و استقرارهای Gateway کانتینری‌شده opt-in است.
- نام میزبان وقتی یک برچسب DNS معتبر باشد، به‌طور پیش‌فرض برابر نام میزبان سیستم است و در غیر این صورت به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` بازنویسی کنید.

### ناحیهٔ گسترده (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک zone تک‌پخشی DNS-SD زیر `~/.openclaw/dns/` می‌نویسد. برای کشف بین شبکه‌ها، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + split DNS در Tailscale همراه کنید.

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

- متغیرهای محیطی درون‌خطی فقط زمانی اعمال می‌شوند که کلید در محیط فرایند وجود نداشته باشد.
- فایل‌های `.env`: فایل `.env` در دایرکتوری کاری جاری + `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
- `shellEnv`: کلیدهای موردانتظارِ ناموجود را از پروفایل پوسته ورود شما وارد می‌کند.
- برای ترتیب تقدم کامل، [محیط](/fa/help/environment) را ببینید.

### جایگزینی متغیر محیطی

در هر رشته پیکربندی، با `${VAR_NAME}` به متغیرهای محیطی ارجاع دهید:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- فقط نام‌های حروف بزرگ مطابق می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای ناموجود/خالی هنگام بارگذاری پیکربندی خطا می‌دهند.
- برای مقدار لفظی `${VAR}` با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## رازها

ارجاع‌های راز افزایشی‌اند: مقادیر متن ساده همچنان کار می‌کنند.

### `SecretRef`

از یک شکل شیء استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی id برای `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id برای `source: "file"`: اشاره‌گر JSON مطلق (برای نمونه `"/providers/openai/apiKey"`)
- الگوی id برای `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- idهای `source: "exec"` نباید شامل بخش‌های مسیر جداشده با اسلشِ `.` یا `..` باشند (برای نمونه `a/../b` رد می‌شود)

### سطح اعتبارنامه پشتیبانی‌شده

- ماتریس مرجع: [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)
- هدف‌های `secrets apply` مسیرهای اعتبارنامه پشتیبانی‌شده `openclaw.json` هستند.
- ارجاع‌های `auth-profiles.json` در پوشش حل‌وفصل زمان اجرا و ممیزی گنجانده شده‌اند.

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
- وقتی اعتبارسنجی ACL ویندوز در دسترس نباشد، مسیرهای ارائه‌دهنده فایل و exec به‌صورت بسته شکست می‌خورند. `allowInsecurePath: true` را فقط برای مسیرهای قابل‌اعتمادی تنظیم کنید که قابل اعتبارسنجی نیستند.
- ارائه‌دهنده `exec` به مسیر مطلق `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌طور پیش‌فرض، مسیرهای فرمان symlink رد می‌شوند. برای مجاز کردن مسیرهای symlink همراه با اعتبارسنجی مسیر هدف حل‌شده، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی دایرکتوری مورداعتماد روی مسیر هدف حل‌شده اعمال می‌شود.
- محیط فرزند `exec` به‌طور پیش‌فرض حداقلی است؛ متغیرهای لازم را صراحتا با `passEnv` پاس بدهید.
- ارجاع‌های راز در زمان فعال‌سازی به یک snapshot درون‌حافظه‌ای حل می‌شوند، سپس مسیرهای درخواست فقط snapshot را می‌خوانند.
- فیلتر کردن سطح فعال هنگام فعال‌سازی اعمال می‌شود: ارجاع‌های حل‌نشده روی سطح‌های فعال باعث شکست راه‌اندازی/بارگذاری مجدد می‌شوند، درحالی‌که سطح‌های غیرفعال با diagnostics رد می‌شوند.

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
- `auth-profiles.json` برای حالت‌های اعتبارنامه ایستا از ارجاع‌های سطح مقدار (`keyRef` برای `api_key`، `tokenRef` برای `token`) پشتیبانی می‌کند.
- نگاشت‌های مسطح قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را با پشتیبان `.legacy-flat.*.bak` به پروفایل‌های API-key مرجع `provider:default` بازنویسی می‌کند.
- پروفایل‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های auth-profile مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های ایستای زمان اجرا از snapshotهای حل‌شده درون‌حافظه‌ای می‌آیند؛ ورودی‌های ایستای قدیمی `auth.json` هنگام کشف پاک‌سازی می‌شوند.
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

- `billingBackoffHours`: وقفهٔ پایه به ساعت وقتی یک پروفایل به‌دلیل خطاهای واقعی
  صورت‌حساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح مربوط به صورت‌حساب
  همچنان می‌تواند حتی در پاسخ‌های `401`/`403` به این مسیر برسد، اما
  تطبیق‌دهنده‌های متن ویژهٔ ارائه‌دهنده فقط در محدودهٔ همان ارائه‌دهنده‌ای می‌مانند
  که مالک آن‌هاست (برای نمونه OpenRouter
  `Key limit exceeded`). پیام‌های قابل‌تلاش‌مجدد HTTP `402` مربوط به پنجرهٔ مصرف یا
  سقف هزینهٔ سازمان/فضای کاری در عوض در مسیر `rate_limit`
  می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری به‌ازای هر ارائه‌دهنده برای ساعت‌های وقفهٔ صورت‌حساب.
- `billingMaxHours`: سقف ساعت‌ها برای رشد نمایی وقفهٔ صورت‌حساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: وقفهٔ پایه به دقیقه برای شکست‌های با اطمینان بالا از نوع `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف دقیقه‌ها برای رشد وقفهٔ `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجرهٔ چرخان به ساعت که برای شمارنده‌های وقفه استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: بیشینهٔ چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای بارگذاری بیش‌ازحد، پیش از تغییر به مدل جایگزین (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` به اینجا می‌رسند.
- `overloadedBackoffMs`: تأخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/پروفایل بارگذاری‌شدهٔ بیش‌ازحد (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: بیشینهٔ چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای محدودیت نرخ، پیش از تغییر به مدل جایگزین (پیش‌فرض: `1`). آن سبد محدودیت نرخ شامل متن‌های شکل‌داده‌شده توسط ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، و `resource exhausted` است.

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
- `maxFileBytes`: بیشینهٔ اندازهٔ فایل گزارش فعال به بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 مگابایت). OpenClaw تا پنج بایگانی شماره‌گذاری‌شده را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن با بهترین تلاش برای خروجی کنسول، گزارش‌های فایل، رکوردهای گزارش OTLP، و متن رونوشت نشست ذخیره‌شده. `redactSensitive: "off"` فقط این سیاست عمومی گزارش/رونوشت را غیرفعال می‌کند؛ سطح‌های ایمنی UI/ابزار/عیب‌یابی همچنان رازها را پیش از انتشار می‌پوشانند.

---

## عیب‌یابی

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

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

- `enabled`: کلید اصلی برای خروجی ابزاربندی (پیش‌فرض: `true`).
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی گزارش هدفمند را فعال می‌کنند (از wildcardهایی مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانهٔ سن بدون پیشرفت به میلی‌ثانیه برای طبقه‌بندی نشست‌های پردازشی طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled`، یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک، و پیشرفت ACP زمان‌سنج را بازنشانی می‌کنند؛ عیب‌یابی‌های تکراری `session.stuck` تا وقتی تغییری رخ نداده باشد با وقفهٔ افزایشی انجام می‌شوند.
- `otel.enabled`: خط لولهٔ صدور OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، فهرست سیگنال‌ها، و مدل حریم خصوصی، [صدور OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: URL گردآورنده برای صدور OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقطه‌های پایانی اختیاری OTLP ویژهٔ هر سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فرادادهٔ اضافی HTTP/gRPC که همراه درخواست‌های صدور OTel فرستاده می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: صدور ردگیری، سنجه‌ها، یا گزارش را فعال می‌کند.
- `otel.sampleRate`: نرخ نمونه‌برداری ردگیری `0`–`1`.
- `otel.flushIntervalMs`: بازهٔ تخلیهٔ دوره‌ای دورسنجی به میلی‌ثانیه.
- `otel.captureContent`: دریافت محتوای خام به‌صورت اختیاری برای ویژگی‌های span در OTEL. پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را دریافت می‌کند؛ شکل شیء به شما اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs`، و `systemPrompt` را صریحاً فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای تازه‌ترین ویژگی‌های آزمایشی ارائه‌دهندهٔ span مربوط به GenAI. به‌طور پیش‌فرض spanها برای سازگاری ویژگی قدیمی `gen_ai.system` را نگه می‌دارند؛ سنجه‌های GenAI از ویژگی‌های معنایی کران‌دار استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از پیش یک SDK سراسری OpenTelemetry را ثبت کرده‌اند. سپس OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را رد می‌کند و شنونده‌های عیب‌یابی را فعال نگه می‌دارد.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`، و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطهٔ پایانی ویژهٔ سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: ثبت عکس‌های لحظه‌ای ردگیری کش برای اجراهای جاسازی‌شده (پیش‌فرض: `false`).
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

- `channel`: کانال انتشار برای نصب‌های npm/git — `"stable"`، `"beta"`، یا `"dev"`.
- `checkOnStart`: هنگام شروع Gateway، به‌روزرسانی‌های npm را بررسی می‌کند (پیش‌فرض: `true`).
- `auto.enabled`: به‌روزرسانی خودکار پس‌زمینه را برای نصب‌های بسته فعال می‌کند (پیش‌فرض: `false`).
- `auto.stableDelayHours`: کمینهٔ تأخیر به ساعت پیش از اعمال خودکار در کانال پایدار (پیش‌فرض: `6`؛ بیشینه: `168`).
- `auto.stableJitterHours`: پنجرهٔ پخش انتشار اضافی کانال پایدار به ساعت (پیش‌فرض: `12`؛ بیشینه: `168`).
- `auto.betaCheckIntervalHours`: اینکه بررسی‌های کانال بتا هر چند ساعت اجرا شوند (پیش‌فرض: `1`؛ بیشینه: `24`).

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

- `enabled`: دروازهٔ قابلیت سراسری ACP (پیش‌فرض: `true`؛ برای پنهان‌کردن ارسال و امکانات ایجاد ACP، روی `false` تنظیم کنید).
- `dispatch.enabled`: دروازهٔ مستقل برای ارسال نوبت نشست ACP (پیش‌فرض: `true`). برای در دسترس نگه‌داشتن فرمان‌های ACP در حالی که اجرا مسدود می‌شود، روی `false` تنظیم کنید.
- `backend`: شناسهٔ پیش‌فرض backend زمان اجرای ACP (باید با یک Plugin زمان اجرای ACP ثبت‌شده مطابقت داشته باشد).
  ابتدا Plugin backend را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسهٔ Plugin backend را نیز اضافه کنید (برای نمونه `acpx`) وگرنه backend ACP بارگذاری نمی‌شود.
- `defaultAgent`: شناسهٔ عامل هدف جایگزین ACP وقتی ایجادها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: فهرست مجاز شناسه‌های عامل که برای نشست‌های زمان اجرای ACP مجازند؛ خالی یعنی محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: بیشینهٔ نشست‌های ACP فعال هم‌زمان.
- `stream.coalesceIdleMs`: پنجرهٔ تخلیهٔ بیکار به میلی‌ثانیه برای متن جریانی.
- `stream.maxChunkChars`: بیشینهٔ اندازهٔ قطعه پیش از تقسیم نمایش بلوک جریانی.
- `stream.repeatSuppression`: خط‌های وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی جریان می‌دهد؛ `"final_only"` تا رخدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل‌مشاهده پس از رخدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: بیشینهٔ نویسه‌های خروجی دستیار که در هر نوبت ACP نمایش داده می‌شود.
- `stream.maxSessionUpdateChars`: بیشینهٔ نویسه‌ها برای خط‌های وضعیت/به‌روزرسانی ACP نمایش‌داده‌شده.
- `stream.tagVisibility`: رکورد نام‌های برچسب به بازنویسی‌های نمایانی بولی برای رخدادهای جریانی.
- `runtime.ttlMinutes`: TTL بیکار به دقیقه برای workerهای نشست ACP پیش از واجدشرایط‌شدن برای پاک‌سازی.
- `runtime.installCommand`: فرمان نصب اختیاری برای اجرا هنگام بوت‌استرپ‌کردن محیط زمان اجرای ACP.

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
  - `"random"` (پیش‌فرض): شعارهای چرخشی بامزه/فصلی.
  - `"default"`: شعار ثابت و خنثی (`All your chats, one OpenClaw.`).
  - `"off"`: بدون متن شعار (عنوان/نسخهٔ بنر همچنان نشان داده می‌شود).
- برای پنهان‌کردن کل بنر (نه فقط شعارها)، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## راهنما

فراداده‌ای که توسط جریان‌های راه‌اندازی هدایت‌شدهٔ CLI (`onboard`، `configure`، `doctor`) نوشته می‌شود:

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

بیلدهای فعلی دیگر شامل پل TCP نیستند. Nodeها از طریق WebSocket در Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از طرح‌وارهٔ پیکربندی نیستند (اعتبارسنجی تا زمان حذفشان شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت نگهداری نشست‌های اجرای Cron ایزولهٔ تکمیل‌شده پیش از هرس از `sessions.json`. همچنین پاک‌سازی رونوشت‌های Cron حذف‌شدهٔ بایگانی‌شده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال‌کردن روی `false` تنظیم کنید.
- `runLog.maxBytes`: بیشینهٔ اندازه برای هر فایل گزارش اجرا (`cron/runs/<jobId>.jsonl`) پیش از هرس. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: تازه‌ترین خط‌هایی که هنگام فعال‌شدن هرس گزارش اجرا نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن حامل که برای تحویل POST Webhook مربوط به Cron استفاده می‌شود (`delivery.mode = "webhook"`)، اگر حذف شود هیچ سرآیند احرازی فرستاده نمی‌شود.
- `webhook`: URL Webhook جایگزین قدیمی منسوخ‌شده (http/https) که فقط برای کارهای ذخیره‌شده‌ای استفاده می‌شود که هنوز `notify: true` دارند.

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

- `maxAttempts`: حداکثر تلاش‌های مجدد برای کارهای یک‌باره در خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0` تا `10`).
- `backoffMs`: آرایه‌ای از تاخیرهای backoff بر حسب ms برای هر تلاش مجدد (پیش‌فرض: `[30000, 60000, 300000]`؛ ۱ تا ۱۰ ورودی).
- `retryOn`: انواع خطایی که تلاش مجدد را فعال می‌کنند — `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش مجدد روی همه انواع گذرا، آن را حذف کنید.

فقط برای کارهای Cron یک‌باره اعمال می‌شود. کارهای تکرارشونده از رسیدگی جداگانه به شکست استفاده می‌کنند.

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
- `after`: تعداد شکست‌های متوالی پیش از فعال‌شدن هشدار (عدد صحیح مثبت، حداقل: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: اجراهای ردشده متوالی را در آستانه هشدار حساب می‌کند (پیش‌فرض: `false`). اجراهای ردشده جداگانه ردیابی می‌شوند و بر backoff خطای اجرا اثری ندارند.
- `mode`: حالت تحویل — `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به Webhook پیکربندی‌شده ارسال می‌کند.
- `accountId`: شناسه اختیاری حساب یا کانال برای محدودکردن دامنه تحویل هشدار.

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
- `to`: هدف صریح announce یا URL Webhook. برای حالت Webhook الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- `delivery.failureDestination` در سطح هر کار، این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست در سطح کار تنظیم شده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌دهند، هنگام شکست به همان هدف announce اصلی برمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

به [کارهای Cron](/fa/automation/cron-jobs) مراجعه کنید. اجراهای Cron ایزوله به‌عنوان [کارهای پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای قالب مدل رسانه

جای‌نگهدارهای قالب در `tools.media.models[].args` گسترش داده می‌شوند:

| متغیر              | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | بدنه کامل پیام ورودی                             |
| `{{RawBody}}`      | بدنه خام (بدون پوشش‌های تاریخچه/فرستنده)          |
| `{{BodyStripped}}` | بدنه‌ای که اشاره‌های گروهی از آن حذف شده است       |
| `{{From}}`         | شناسه فرستنده                                     |
| `{{To}}`           | شناسه مقصد                                        |
| `{{MessageSid}}`   | شناسه پیام کانال                                  |
| `{{SessionId}}`    | UUID نشست فعلی                                    |
| `{{IsNewSession}}` | وقتی نشست جدید ساخته شده باشد `"true"`           |
| `{{MediaUrl}}`     | شبه‌URL رسانه ورودی                               |
| `{{MediaPath}}`    | مسیر رسانه محلی                                   |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)                       |
| `{{Transcript}}`   | رونوشت صوت                                        |
| `{{Prompt}}`       | پرامپت رسانه حل‌شده برای ورودی‌های CLI            |
| `{{MaxChars}}`     | حداکثر نویسه‌های خروجی حل‌شده برای ورودی‌های CLI  |
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

- فایل تکی: آبجکت دربرگیرنده را جایگزین می‌کند.
- آرایه فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شود (موارد بعدی موارد قبلی را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از includeها ادغام می‌شوند (مقادیر includeشده را بازنویسی می‌کنند).
- includeهای تودرتو: تا عمق ۱۰ سطح.
- مسیرها: نسبت به فایل includeکننده حل می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا باقی بمانند (`dirname` از `openclaw.json`). شکل‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل همان مرز حل شوند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالای پشتیبانی‌شده با include تک‌فایلی را تغییر می‌دهند، مستقیما در همان فایل includeشده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- includeهای ریشه، آرایه‌های include، و includeهایی با بازنویسی هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط‌خواندنی هستند؛ این نوشتن‌ها به‌جای تخت‌کردن پیکربندی، به‌صورت بسته شکست می‌خورند.
- خطاها: پیام‌های روشن برای فایل‌های گم‌شده، خطاهای تجزیه، و includeهای چرخشی.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

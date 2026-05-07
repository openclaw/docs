---
read_when:
    - به معناشناسی دقیق پیکربندی در سطح فیلد یا مقادیر پیش‌فرض نیاز دارید
    - شما در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای اصلی OpenClaw، پیش‌فرض‌ها، و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-05-07T13:18:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b279c3e74fd6f7de01d63b642ab17aaaac65c39b855efc745eadc121adbf1fb
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی اصلی برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و زمانی که یک زیرسامانه مرجع عمیق‌تر خودش را دارد، به آن پیوند می‌دهد. کاتالوگ‌های فرمانِ متعلق به کانال و Plugin و تنظیمات عمیق حافظه/QMD به‌جای این صفحه، در صفحات خودشان قرار دارند.

حقیقت کد:

- `openclaw config schema` طرحواره JSON زنده‌ای را چاپ می‌کند که برای اعتبارسنجی و Control UI استفاده می‌شود، و در صورت دسترس بودن، فراداده‌های بسته‌بندی‌شده/Plugin/کانال در آن ادغام می‌شود
- `config.schema.lookup` یک گره طرحواره با دامنه مسیر برای ابزارهای بررسی جزئی برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش خط مبنای مستندات پیکربندی را در برابر سطح طرحواره فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی عامل: پیش از ویرایش، از کنش ابزار `gateway` یعنی `config.schema.lookup` برای
مستندات و محدودیت‌های دقیق در سطح فیلد استفاده کنید. برای راهنمایی وظیفه‌محور از
[پیکربندی](/fa/gateway/configuration) استفاده کنید و این صفحه را برای
نقشه گسترده‌تر فیلدها، مقادیر پیش‌فرض، و پیوند به مراجع زیرسامانه‌ها ببینید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`،‏ `memory.qmd.*`،‏ `memory.citations`، و پیکربندی dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [فرمان‌های اسلش](/fa/tools/slash-commands) برای کاتالوگ فعلی فرمان‌های داخلی + بسته‌بندی‌شده
- صفحات کانال/Plugin مالک برای سطوح فرمان اختصاصی کانال

قالب پیکربندی **JSON5** است (کامنت + ویرگول پایانی مجاز است). همه فیلدها اختیاری هستند - OpenClaw هنگام حذف شدنشان از مقادیر پیش‌فرض امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند - برای `channels.*`
[پیکربندی - کانال‌ها](/fa/gateway/config-channels) را ببینید،
از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و کانال‌های
بسته‌بندی‌شده دیگر (احراز هویت، کنترل دسترسی، چندحسابی، دروازه‌گذاری منشن).

## مقادیر پیش‌فرض عامل، چندعاملی، نشست‌ها، و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است - ببینید
[پیکربندی - عامل‌ها](/fa/gateway/config-agents) برای:

- `agents.defaults.*` (فضای کاری، مدل، تفکر، Heartbeat، حافظه، رسانه، Skills، sandbox)
- `multiAgent.*` (مسیریابی و اتصال‌های چندعاملی)
- `session.*` (چرخه عمر نشست، Compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر کردن markdown)
- `talk.*` (حالت Talk)
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk در iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال transcript پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، کلیدهای آزمایشی، پیکربندی ابزارهای متکی به ارائه‌دهنده، و تنظیم
ارائه‌دهنده سفارشی / URL پایه به صفحه‌ای اختصاصی منتقل شده‌اند - ببینید
[پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools).

## مدل‌ها

تعریف‌های ارائه‌دهنده، allowlistهای مدل، و تنظیم ارائه‌دهنده سفارشی در
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
- `models.providers`: نگاشت ارائه‌دهندگان سفارشی با کلید شناسه ارائه‌دهنده.
- `models.pricing.enabled`: راه‌اندازی اولیه قیمت‌گذاری پس‌زمینه را کنترل می‌کند که
  پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway آغاز می‌شود. وقتی `false` باشد،
  Gateway دریافت کاتالوگ‌های قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقادیر
  پیکربندی‌شده `models.providers.*.models[].cost` همچنان برای برآورد هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط
Pi جاسازی‌شده و adapterهای runtime دیگر مصرف می‌شوند. فرمان‌های `openclaw mcp list`،
`show`،‏ `set`، و `unset` این بلاک را بدون اتصال به
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
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: تعریف‌های نام‌گذاری‌شده سرور MCP از نوع stdio یا remote برای runtimeهایی که
  ابزارهای MCP پیکربندی‌شده را در معرض استفاده قرار می‌دهند.
  ورودی‌های remote از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛
  `type: "http"` یک نام مستعار بومی CLI است که `openclaw mcp set` و
  `openclaw doctor --fix` آن را به فیلد canonical `transport` تبدیل می‌کنند.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای runtimeهای MCP بسته‌بندی‌شده با دامنه نشست.
  اجراهای جاسازی‌شده یک‌باره درخواست پاک‌سازی پایان اجرا می‌دهند؛ این TTL پشتوانه‌ای برای
  نشست‌های بلندمدت و فراخوان‌های آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP نشستِ کش‌شده به‌صورت داغ اعمال می‌شوند.
  کشف/استفاده بعدی ابزار آن‌ها را از پیکربندی جدید بازمی‌سازد، بنابراین ورودی‌های حذف‌شده
  `mcp.servers` بلافاصله جمع‌آوری می‌شوند و منتظر TTL بیکاری نمی‌مانند.

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
- `install.preferBrew`: وقتی true باشد، در صورت در دسترس بودن `brew`، پیش از بازگشت به انواع نصب‌کننده دیگر، نصب‌کننده‌های Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح نصب‌کننده node برای مشخصات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` یک Skill را حتی اگر بسته‌بندی/نصب شده باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بر برای Skillsای که یک متغیر env اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

---

## Plugins

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

- از `~/.openclaw/extensions`،‏ `<workspace>/.openclaw/extensions`، به‌علاوه `plugins.load.paths` بارگذاری می‌شود.
- Discovery، Pluginهای بومی OpenClaw به‌علاوه bundleهای سازگار Codex و Claude را می‌پذیرد، از جمله bundleهای Claude با چیدمان پیش‌فرض و بدون manifest.
- **تغییرات پیکربندی به راه‌اندازی مجدد Gateway نیاز دارند.**
- `allow`: allowlist اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` اولویت دارد.
- `bundledDiscovery`: برای پیکربندی‌های جدید به‌صورت پیش‌فرض `"allowlist"` است، بنابراین یک
  `plugins.allow` غیرخالی، Pluginهای ارائه‌دهنده بسته‌بندی‌شده، از جمله ارائه‌دهندگان runtime
  جست‌وجوی وب را نیز دروازه‌گذاری می‌کند. Doctor برای پیکربندی‌های allowlist
  legacy مهاجرت‌داده‌شده `"compat"` می‌نویسد تا رفتار موجود ارائه‌دهنده بسته‌بندی‌شده را تا زمان انتخاب شما حفظ کند.
- `plugins.entries.<id>.apiKey`: فیلد میان‌بر کلید API در سطح Plugin (وقتی توسط Plugin پشتیبانی شود).
- `plugins.entries.<id>.env`: نگاشت متغیر env با دامنه Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، core،‏ `before_prompt_build` را مسدود می‌کند و فیلدهای تغییردهنده prompt از `before_agent_start` legacy را نادیده می‌گیرد، در حالی که `modelOverride` و `providerOverride` legacy را حفظ می‌کند. روی hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط bundleهای پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیر بسته‌بندی‌شده مورد اعتماد می‌توانند محتوای خام مکالمه را از hookهای typed مانند `llm_input`،‏ `llm_output`،‏ `before_model_resolve`،‏ `before_agent_reply`،‏ `before_agent_run`،‏ `before_agent_finalize`، و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌صراحت به این Plugin اعتماد کنید تا برای اجراهای subagent پس‌زمینه، overrideهای `provider` و `model` در هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist اختیاری از هدف‌های canonical `provider/model` برای overrideهای subagent مورد اعتماد. فقط وقتی عمداً می‌خواهید هر مدلی مجاز باشد از `"*"` استفاده کنید.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (در صورت دسترس بودن، با طرحواره Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/runtime Plugin کانال زیر `channels.<id>` قرار دارند و باید توسط فراداده `channelConfigs` در manifest Plugin مالک توصیف شوند، نه توسط یک registry مرکزی گزینه‌های OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: تنظیمات ارائه‌دهنده web-fetch برای Firecrawl.
  - `apiKey`: کلید API Firecrawl (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`،‏ `tools.web.fetch.firecrawl.apiKey` legacy، یا متغیر env با نام `FIRECRAWL_API_KEY` بازمی‌گردد.
  - `baseUrl`: URL پایه API Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای self-hosted باید endpointهای private/internal را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی را از صفحه‌ها استخراج می‌کند (پیش‌فرض: `true`).
  - `maxAgeMs`: حداکثر سن cache به میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: مهلت زمانی درخواست scrape به ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جست‌وجوی وب Grok).
  - `enabled`: ارائه‌دهنده X Search را فعال می‌کند.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مثلاً `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات dreaming حافظه. برای مرحله‌ها و آستانه‌ها، [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: کلید اصلی dreaming (پیش‌فرض `false`).
  - `frequency`: cadence کرون برای هر sweep کامل dreaming (به‌صورت پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent برای Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن هدف‌ها، آن را با `allowedModels` همراه کنید. خطاهای در دسترس نبودن مدل یک بار با مدل پیش‌فرض نشست دوباره تلاش می‌شوند؛ خطاهای اعتماد یا allowlist بی‌صدا fallback نمی‌کنند.
  - سیاست مرحله و آستانه‌ها جزئیات پیاده‌سازی هستند (کلیدهای پیکربندی روبه‌کاربر نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای bundle شده Claude که فعال هستند نیز می‌توانند مقادیر پیش‌فرض Pi جاسازی‌شده را از `settings.json` اضافه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات عامل پاک‌سازی‌شده اعمال می‌کند، نه به‌عنوان patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin حافظه فعال را انتخاب می‌کند، یا برای غیرفعال کردن Pluginهای حافظه `"none"` را انتخاب کنید.
- `plugins.slots.contextEngine`: شناسه Plugin موتور زمینه فعال را انتخاب می‌کند؛ مگر اینکه موتور دیگری نصب و انتخاب کنید، پیش‌فرض `"legacy"` است.

[Plugins](/fa/tools/plugin) را ببینید.

---

## تعهدات

`commitments` حافظه پیگیری استنتاج‌شده را کنترل می‌کند: OpenClaw می‌تواند check-inها را از turnهای مکالمه تشخیص دهد و آن‌ها را از طریق اجراهای Heartbeat تحویل دهد.

- `commitments.enabled`: استخراج، ذخیره‌سازی، و تحویل Heartbeat توسط LLM پنهان را برای تعهدات پیگیری استنتاج‌شده فعال می‌کند. پیش‌فرض: `false`.
- `commitments.maxPerDay`: حداکثر تعهدات پیگیری استنتاج‌شده که در یک روز rolling برای هر نشست عامل تحویل داده می‌شوند. پیش‌فرض: `3`.

[تعهدات استنتاج‌شده](/fa/concepts/commitments) را ببینید.

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
- `tabCleanup` زبانه‌های ردیابی‌شدهٔ عامل اصلی را پس از زمان بیکاری یا وقتی یک
  نشست از سقف خود فراتر برود، بازپس می‌گیرد. برای غیرفعال کردن آن حالت‌های پاک‌سازی
  جداگانه، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین پیمایش مرورگر به‌طور پیش‌فرض سخت‌گیرانه می‌ماند.
- فقط زمانی `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید که عمداً به پیمایش مرورگر در شبکهٔ خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقطه‌های پایانی پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترسی‌پذیری/کشف، تابع همان مسدودسازی شبکهٔ خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- پروفایل‌های راه‌دور فقط پیوستنی هستند؛ شروع/توقف/بازنشانی غیرفعال است.
- `profiles.*.cdpUrl` مقدارهای `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند، از HTTP(S) استفاده کنید؛ وقتی
  ارائه‌دهندهٔ شما یک URL مستقیم DevTools WebSocket می‌دهد، از WS(S) استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` روی دسترسی‌پذیری CDP راه‌دور و
  `attachOnly` به‌همراه درخواست‌های باز کردن زبانه اعمال می‌شوند. پروفایل‌های local loopback
  مدیریت‌شده پیش‌فرض‌های CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP مدیریت‌شدهٔ خارجی از طریق local loopback در دسترس است، برای آن
  پروفایل `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw پورت local loopback را یک
  پروفایل مرورگر مدیریت‌شدهٔ محلی تلقی می‌کند و ممکن است خطاهای مالکیت پورت محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گرهٔ مرورگر متصل پیوست شوند.
- پروفایل‌های `existing-session` می‌توانند `userDataDir` را برای هدف‌گیری یک پروفایل مشخص
  مرورگر مبتنی بر Chromium مانند Brave یا Edge تنظیم کنند.
- پروفایل‌های `existing-session` محدودیت‌های مسیر فعلی Chrome MCP را حفظ می‌کنند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری selectorهای CSS، قلاب‌های بارگذاری یک فایل،
  بدون بازنویسی مهلت گفت‌وگو، بدون `wait --load networkidle`، و بدون
  `responsebody`، خروجی PDF، رهگیری دانلود، یا کنش‌های دسته‌ای.
- پروفایل‌های `openclaw` مدیریت‌شدهٔ محلی `cdpPort` و `cdpUrl` را به‌طور خودکار تخصیص می‌دهند؛
  `cdpUrl` را فقط برای CDP راه‌دور به‌صورت صریح تنظیم کنید.
- پروفایل‌های مدیریت‌شدهٔ محلی می‌توانند `executablePath` را تنظیم کنند تا
  `browser.executablePath` سراسری برای آن پروفایل بازنویسی شود. از این برای اجرای یک پروفایل در
  Chrome و پروفایل دیگر در Brave استفاده کنید.
- پروفایل‌های مدیریت‌شدهٔ محلی پس از شروع فرایند برای کشف HTTP مربوط به Chrome CDP از
  `browser.localLaunchTimeoutMs` و برای آمادگی websocket مربوط به CDP پس از راه‌اندازی از
  `browser.localCdpReadyTimeoutMs` استفاده می‌کنند. روی میزبان‌های کندتر که Chrome
  با موفقیت شروع می‌شود اما بررسی‌های آمادگی با راه‌اندازی رقابت می‌کنند، آن‌ها را افزایش دهید.
  هر دو مقدار باید عدد صحیح مثبت تا `120000` میلی‌ثانیه باشند؛ مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد ← Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را برای پوشهٔ خانهٔ سیستم‌عامل شما پیش از راه‌اندازی Chromium می‌پذیرند.
  `userDataDir` اختصاصی هر پروفایل در پروفایل‌های `existing-session` نیز با tilde گسترش داده می‌شود.
- سرویس کنترل: فقط local loopback (پورت مشتق‌شده از `gateway.port`، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های راه‌اندازی اضافی را به شروع محلی Chromium اضافه می‌کند (برای نمونه
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

- `seamColor`: رنگ تأکیدی برای chrome رابط کاربری برنامهٔ بومی (ته‌رنگ حباب Talk Mode و غیره).
- `assistant`: بازنویسی هویت رابط کاربری کنترل. در صورت نبود، به هویت عامل فعال برمی‌گردد.

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

- `mode`: `local` (اجرای Gateway) یا `remote` (اتصال به Gateway راه‌دور). Gateway شروع به کار را نمی‌پذیرد مگر اینکه `local` باشد.
- `port`: پورت چندگانهٔ واحد برای WS + HTTP. اولویت: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP مربوط به Tailscale)، یا `custom`.
- **نام‌های مستعار قدیمی bind**: در `gateway.bind` از مقدارهای حالت bind استفاده کنید (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، نه نام‌های مستعار میزبان (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **نکتهٔ Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکه‌بندی bridge در Docker (`-p 18789:18789`)، ترافیک روی `eth0` وارد می‌شود، بنابراین Gateway در دسترس نیست. از `--network host` استفاده کنید، یا برای گوش‌دادن روی همهٔ رابط‌ها `bind: "lan"` را تنظیم کنید (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`).
- **احراز هویت**: به‌صورت پیش‌فرض الزامی است. bindهای غیر از loopback به احراز هویت Gateway نیاز دارند. در عمل یعنی یک توکن/گذرواژهٔ مشترک یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. راه‌انداز onboarding به‌صورت پیش‌فرض یک توکن تولید می‌کند.
- اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند (از جمله SecretRefها)، `gateway.auth.mode` را صراحتاً روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، جریان‌های شروع به کار و نصب/تعمیر سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای راه‌اندازی‌های مورد اعتماد local loopback استفاده کنید؛ این گزینه عمداً در promptهای onboarding ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک reverse proxy آگاه از هویت واگذار کنید و به headerهای هویت از `gateway.trustedProxies` اعتماد کنید (ببینید [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)). این حالت به‌صورت پیش‌فرض انتظار یک منبع proxy **غیر از loopback** را دارد؛ reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان fallback مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، headerهای هویت Tailscale Serve می‌توانند احراز هویت رابط کاربری کنترل/WebSocket را برآورده کنند (از طریق `tailscale whois` راستی‌آزمایی می‌شود). endpointهای HTTP API از آن احراز هویت header مربوط به Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت عادی احراز هویت HTTP خود Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway مورد اعتماد است. وقتی `tailscale.mode = "serve"` باشد، مقدار پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکنندهٔ اختیاری برای احراز هویت ناموفق. برای هر IP کلاینت و هر دامنهٔ احراز هویت اعمال می‌شود (shared-secret و device-token جداگانه ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر async رابط کاربری کنترل Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست سریالی می‌شوند. بنابراین تلاش‌های بد هم‌زمان از همان کلاینت می‌توانند در درخواست دوم محدودکننده را فعال کنند، به‌جای اینکه هر دو صرفاً به‌صورت mismatch ساده از مسیر عبور کنند.
  - `gateway.auth.rateLimit.exemptLoopback` به‌صورت پیش‌فرض `true` است؛ وقتی عمداً می‌خواهید ترافیک localhost هم rate-limit شود (برای راه‌اندازی‌های تست یا استقرارهای proxy سخت‌گیرانه)، آن را روی `false` تنظیم کنید.
- تلاش‌های احراز هویت WS با origin مرورگر همیشه با معافیت loopback غیرفعال throttled می‌شوند (دفاع چندلایه در برابر brute force روی localhost مبتنی بر مرورگر).
- روی loopback، آن lockoutهای دارای origin مرورگر به‌ازای مقدار `Origin`
  نرمال‌سازی‌شده جدا می‌شوند، بنابراین شکست‌های تکراری از یک origin مربوط به localhost به‌طور خودکار
  origin دیگری را قفل نمی‌کند.
- `tailscale.mode`: `serve` (فقط tailnet، bind روی loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `controlUi.allowedOrigins`: allowlist صریح origin مرورگر برای اتصال‌های WebSocket به Gateway. وقتی انتظار می‌رود کلاینت‌های مرورگر از originهای غیر از loopback باشند، الزامی است.
- `controlUi.chatMessageMaxWidth`: بیشینهٔ عرض اختیاری برای پیام‌های چت گروه‌بندی‌شدهٔ رابط کاربری کنترل. مقدارهای عرض CSS محدودشده مانند `960px`، `82%`، `min(1280px, 82%)`، و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناکی که fallback مبتنی بر origin از header میزبان را برای استقرارهایی فعال می‌کند که عمداً به سیاست origin مبتنی بر header میزبان تکیه دارند.
- `remote.transport`: `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، مقدار `remote.url` باید `ws://` یا `wss://` باشد.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override اضطراری در محیط فرایند سمت کلاینت
  که `ws://` متن‌ساده را برای IPهای مورد اعتماد شبکهٔ خصوصی مجاز می‌کند؛ پیش‌فرض برای متن‌ساده همچنان فقط loopback است. معادل `openclaw.json`
  ندارد، و پیکربندی شبکهٔ خصوصی مرورگر مانند
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` روی کلاینت‌های WebSocket
  مربوط به Gateway اثر نمی‌گذارد.
- `gateway.remote.token` / `.password` فیلدهای credential کلاینت راه‌دور هستند. این‌ها به‌تنهایی احراز هویت Gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: URL پایهٔ HTTPS برای relay خارجی APNs که buildهای رسمی/TestFlight iOS پس از انتشار registrationهای پشتیبانی‌شده با relay به Gateway از آن استفاده می‌کنند. این URL باید با URL relay کامپایل‌شده داخل build iOS مطابق باشد.
- `gateway.push.apns.relay.timeoutMs`: timeout ارسال از Gateway به relay بر حسب میلی‌ثانیه. مقدار پیش‌فرض `10000` است.
- registrationهای پشتیبانی‌شده با relay به یک هویت مشخص Gateway واگذار می‌شوند. برنامهٔ iOS جفت‌شده `gateway.identity.get` را دریافت می‌کند، آن هویت را در registration مربوط به relay قرار می‌دهد، و یک مجوز ارسال با دامنهٔ registration را به Gateway forward می‌کند. Gateway دیگر نمی‌تواند از آن registration ذخیره‌شده دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch فقط مخصوص توسعه برای URLهای relay از نوع HTTP روی loopback. URLهای relay تولید باید روی HTTPS بمانند.
- `gateway.handshakeTimeoutMs`: timeout دست‌دهی WebSocket پیش از احراز هویت Gateway بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد، اولویت دارد. این مقدار را روی میزبان‌های پربار یا کم‌توانی افزایش دهید که کلاینت‌های محلی می‌توانند وصل شوند در حالی که warmup شروع به کار هنوز در حال پایدار شدن است.
- `gateway.channelHealthCheckMinutes`: فاصلهٔ health-monitor کانال بر حسب دقیقه. برای غیرفعال‌کردن restartهای health-monitor به‌صورت سراسری، `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانهٔ stale-socket بر حسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: بیشینهٔ restartهای health-monitor به‌ازای هر کانال/حساب در یک ساعت rolling. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out به‌ازای هر کانال برای restartهای health-monitor، در حالی که monitor سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override به‌ازای هر حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر override سطح کانال اولویت دارد.
- مسیرهای فراخوان Gateway محلی فقط وقتی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتاً از طریق SecretRef پیکربندی و resolve نشده باشد، resolve به‌شکل fail-closed شکست می‌خورد (بدون پوشاندن آن با fallback راه‌دور).
- `trustedProxies`: IPهای reverse proxy که TLS را terminate می‌کنند یا headerهای کلاینت forwardشده را inject می‌کنند. فقط proxyهایی را فهرست کنید که کنترل می‌کنید. ورودی‌های loopback همچنان برای راه‌اندازی‌های proxy/تشخیص محلی روی همان میزبان معتبرند (برای مثال Tailscale Serve یا یک reverse proxy محلی)، اما درخواست‌های loopback را واجد شرایط `gateway.auth.mode: "trusted-proxy"` نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` وجود نداشته باشد Gateway مقدار `X-Real-IP` را می‌پذیرد. مقدار پیش‌فرض `false` برای رفتار fail-closed است.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای تأیید خودکار جفت‌سازی دستگاه node در بار اول بدون scopeهای درخواست‌شده. وقتی تنظیم نشده باشد غیرفعال است. این مورد جفت‌سازی operator/browser/رابط کاربری کنترل/WebChat را خودکار تأیید نمی‌کند، و ارتقاهای role، scope، metadata، یا public-key را خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی allow/deny سراسری برای فرمان‌های node اعلام‌شده پس از جفت‌سازی و ارزیابی allowlist پلتفرم. از `allowCommands` برای opt-in به فرمان‌های خطرناک node مانند `camera.snap`، `camera.clip`، و `screen.record` استفاده کنید؛ `denyCommands` یک فرمان را حذف می‌کند حتی اگر پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل می‌شد. پس از اینکه یک node فهرست فرمان‌های اعلام‌شدهٔ خود را تغییر داد، جفت‌سازی آن دستگاه را رد و دوباره تأیید کنید تا Gateway snapshot فرمان به‌روزشده را ذخیره کند.
- `gateway.tools.deny`: نام ابزارهای اضافی که برای HTTP `POST /tools/invoke` مسدود می‌شوند (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام ابزارها را از فهرست deny پیش‌فرض HTTP حذف می‌کند.

</Accordion>

### endpointهای سازگار با OpenAI

- Chat Completions: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL برای Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی به‌عنوان تنظیم‌نشده تلقی می‌شوند؛ برای غیرفعال‌کردن دریافت URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- header اختیاری برای سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای originهای HTTPS که کنترل می‌کنید تنظیم کنید؛ ببینید [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### جداسازی چندنمونه‌ای

چند Gateway را روی یک میزبان با پورت‌ها و state dirهای منحصربه‌فرد اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

flagهای کمکی: `--dev` (از `~/.openclaw-dev` + پورت `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

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
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده باشند، یک جفت cert/key خودامضای محلی به‌صورت خودکار تولید می‌کند؛ فقط برای استفادهٔ محلی/dev.
- `certPath`: مسیر فایل‌سیستم به فایل گواهی TLS.
- `keyPath`: مسیر فایل‌سیستم به فایل کلید خصوصی TLS؛ دسترسی آن را محدود نگه دارید.
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

- `mode`: کنترل می‌کند ویرایش‌های config چگونه در زمان اجرا اعمال شوند.
  - `"off"`: ویرایش‌های زنده را نادیده بگیر؛ تغییرات به restart صریح نیاز دارند.
  - `"restart"`: همیشه هنگام تغییر config، فرایند Gateway را restart کن.
  - `"hot"`: تغییرات را بدون restart در همان فرایند اعمال کن.
  - `"hybrid"` (پیش‌فرض): ابتدا hot reload را امتحان کن؛ اگر لازم بود به restart fallback کن.
- `debounceMs`: بازهٔ debounce بر حسب ms پیش از اعمال تغییرات config (عدد صحیح نامنفی).
- `deferralTimeoutMs`: بیشینهٔ زمان اختیاری بر حسب ms برای انتظار جهت عملیات‌های درحال‌اجرا، پیش از اجبار به restart یا hot reload کانال. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای still-pending، `0` تنظیم کنید.

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
توکن‌های هوک در رشتهٔ کوئری رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به یک `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید از `gateway.auth.token` **متمایز** باشد؛ استفادهٔ دوباره از توکن Gateway رد می‌شود.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیرمسیر اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا پیش‌تنظیم از `sessionKey` قالب‌دار استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این opt-in نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از بار درخواست فقط وقتی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقادیر `sessionKey` نگاشت که با قالب رندر شده‌اند، به‌عنوان دادهٔ بیرونی در نظر گرفته می‌شوند و آن‌ها نیز به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="Mapping details">

- `match.path` با زیرمسیر بعد از `/hooks` مطابقت می‌کند (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` برای مسیرهای عمومی با یک فیلد بار داده مطابقت می‌کند.
- قالب‌هایی مانند `{{messages[0].subject}}` از بار داده خوانده می‌شوند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش هوک برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و داخل `hooks.transformsDir` باقی بماند (مسیرهای مطلق و پیمایش مسیر رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های skill فضای کاری رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transforms هوک‌ها منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک عامل مشخص مسیر‌دهی می‌کند؛ شناسه‌های ناشناخته به پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: مسیر‌دهی صریح را محدود می‌کند (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید نشست ثابت اختیاری برای اجرای عامل هوک بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای نشست نگاشت مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: فهرست مجاز پیشوند اختیاری برای مقادیر صریح `sessionKey` (درخواست + نگاشت)، مثل `["hook:"]`. وقتی هر نگاشت یا پیش‌تنظیم از `sessionKey` قالب‌دار استفاده کند، الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ `channel` به‌طور پیش‌فرض `last` است.
- `model` مدل LLM را برای این اجرای هوک بازنویسی می‌کند (اگر کاتالوگ مدل تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- پیش‌تنظیم داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر آن مسیر‌دهی به‌ازای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را محدود کنید تا با فضای نام Gmail مطابقت داشته باشد، برای مثال `["hook:", "hook:gmail:"]`.
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

- Gateway هنگام راه‌اندازی، وقتی پیکربندی شده باشد، `gog gmail watch serve` را به‌طور خودکار شروع می‌کند. برای غیرفعال کردن، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
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

- HTML/CSS/JS قابل ویرایش توسط عامل و A2UI را از طریق HTTP زیر پورت Gateway سرو می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- bindهای غیر loopback: مسیرهای بوم به احراز هویت Gateway نیاز دارند (توکن/گذرواژه/trusted-proxy)، همانند دیگر سطوح HTTP Gateway.
- WebViewهای Node معمولاً هدرهای احراز هویت را ارسال نمی‌کنند؛ پس از جفت‌سازی و اتصال یک Node، Gateway نشانی‌های URL قابلیت با دامنهٔ Node را برای دسترسی به بوم/A2UI اعلام می‌کند.
- URLهای قابلیت به نشست WS فعال Node متصل‌اند و خیلی زود منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت live-reload را به HTML سرو شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` شروع‌کننده را به‌طور خودکار می‌سازد.
- همچنین A2UI را در `/__openclaw__/a2ui/` سرو می‌کند.
- تغییرات به راه‌اندازی مجدد Gateway نیاز دارند.
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
- `full`: شامل `cliPath` + `sshPort` می‌شود؛ تبلیغ multicast در LAN همچنان نیاز دارد Plugin بسته‌بندی‌شدهٔ `bonjour` فعال باشد.
- `off`: تبلیغ multicast در LAN را بدون تغییر فعال‌سازی Plugin متوقف می‌کند.
- Plugin بسته‌بندی‌شدهٔ `bonjour` روی میزبان‌های macOS به‌طور خودکار شروع می‌شود و روی Linux، Windows و استقرارهای Gateway کانتینری opt-in است.
- نام میزبان وقتی یک برچسب DNS معتبر باشد، به‌طور پیش‌فرض نام میزبان سیستم است و در غیر این صورت به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` بازنویسی کنید.

### گسترده‌دامنه (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک zone یونیکست DNS-SD را زیر `~/.openclaw/dns/` می‌نویسد. برای کشف بین‌شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + split DNS در Tailscale جفت کنید.

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

- متغیرهای env درون‌خطی فقط وقتی اعمال می‌شوند که env فرایند کلید را نداشته باشد.
- فایل‌های `.env`: ‏`.env` در CWD + ‏`~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
- `shellEnv`: کلیدهای موردانتظارِ موجودنبودن را از پروفایل پوسته ورود شما وارد می‌کند.
- برای تقدم کامل، [محیط](/fa/help/environment) را ببینید.

### جایگزینی متغیر env

در هر رشته پیکربندی، با `${VAR_NAME}` به متغیرهای env ارجاع دهید:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- فقط نام‌های با حروف بزرگ تطبیق داده می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای موجودنبودن/خالی هنگام بارگذاری پیکربندی خطا می‌دهند.
- برای مقدار لفظی `${VAR}` با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## اسرار

ارجاع‌های Secret افزایشی هستند: مقدارهای plaintext همچنان کار می‌کنند.

### `SecretRef`

از یک شکل شیء استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- الگوی id برای `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- id برای `source: "file"`: اشاره‌گر JSON مطلق (برای مثال `"/providers/openai/apiKey"`)
- الگوی id برای `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- idهای `source: "exec"` نباید بخش‌های مسیرِ جداشده با اسلش شامل `.` یا `..` داشته باشند (برای مثال `a/../b` رد می‌شود)

### سطح اعتبارنامه پشتیبانی‌شده

- ماتریس canonical: [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)
- هدف‌های `secrets apply` از مسیرهای اعتبارنامه `openclaw.json` پشتیبانی می‌کنند.
- ارجاع‌های `auth-profiles.json` در حل‌وفصل زمان اجرا و پوشش ممیزی لحاظ می‌شوند.

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
- وقتی اعتبارسنجی ACL ویندوز در دسترس نباشد، مسیرهای ارائه‌دهنده file و exec به‌صورت بسته شکست می‌خورند. `allowInsecurePath: true` را فقط برای مسیرهای معتمدی تنظیم کنید که قابل اعتبارسنجی نیستند.
- ارائه‌دهنده `exec` به مسیر مطلق `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌طور پیش‌فرض، مسیرهای فرمان symlink رد می‌شوند. `allowSymlinkCommand: true` را تنظیم کنید تا ضمن اعتبارسنجی مسیر هدف حل‌شده، مسیرهای symlink مجاز شوند.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی trusted-dir روی مسیر هدف حل‌شده اعمال می‌شود.
- محیط child برای `exec` به‌طور پیش‌فرض حداقلی است؛ متغیرهای لازم را صریحا با `passEnv` ارسال کنید.
- ارجاع‌های Secret در زمان فعال‌سازی به یک snapshot درون‌حافظه‌ای حل می‌شوند، سپس مسیرهای درخواست فقط snapshot را می‌خوانند.
- فیلترکردن active-surface هنگام فعال‌سازی اعمال می‌شود: ارجاع‌های حل‌نشده روی سطح‌های فعال startup/reload را با شکست مواجه می‌کنند، در حالی که سطح‌های غیرفعال با diagnosticها رد می‌شوند.

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
- `auth-profiles.json` برای حالت‌های اعتبارنامه static از ارجاع‌های سطح مقدار (`keyRef` برای `api_key`، ‏`tokenRef` برای `token`) پشتیبانی می‌کند.
- mapهای flat قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را با یک نسخه پشتیبان `.legacy-flat.*.bak` به پروفایل‌های canonical کلید API به شکل `provider:default` بازنویسی می‌کند.
- پروفایل‌های حالت OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های auth-profile مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های static زمان اجرا از snapshotهای حل‌شده درون‌حافظه‌ای می‌آیند؛ ورودی‌های legacy static در `auth.json` هنگام کشف پاک‌سازی می‌شوند.
- واردکردن OAuth قدیمی از `~/.openclaw/credentials/oauth.json`.
- [OAuth](/fa/concepts/oauth) را ببینید.
- رفتار زمان اجرای Secrets و ابزارهای `audit/configure/apply`: [مدیریت Secrets](/fa/gateway/secrets).

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

- `billingBackoffHours`: وقفه پایه بر حسب ساعت، وقتی یک پروفایل به دلیل خطاهای واقعی
  صورت‌حساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح صورت‌حساب
  حتی در پاسخ‌های `401`/`403` هم همچنان می‌تواند به اینجا برسد، اما تطبیق‌دهنده‌های
  متن مخصوص ارائه‌دهنده، محدود به همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای نمونه
  `Key limit exceeded` در OpenRouter). پیام‌های HTTP قابل‌تلاش‌مجدد `402` مربوط به پنجره مصرف یا
  سقف هزینه سازمان/فضای کاری، در عوض در مسیر `rate_limit` می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری به‌ازای هر ارائه‌دهنده برای ساعت‌های وقفه صورت‌حساب.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی وقفه صورت‌حساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: وقفه پایه بر حسب دقیقه برای شکست‌های با اطمینان بالا از نوع `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد وقفه `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجره غلتان بر حسب ساعت که برای شمارنده‌های وقفه استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای اضافه‌بار، پیش از جابه‌جایی به مدل جایگزین (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` به اینجا می‌رسند.
- `overloadedBackoffMs`: تأخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/پروفایل دچار اضافه‌بار (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای محدودیت نرخ، پیش از جابه‌جایی به مدل جایگزین (پیش‌فرض: `1`). آن سطل محدودیت نرخ شامل متن‌های دارای شکل ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded` و `resource exhausted` است.

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
- هنگام استفاده از `--verbose`، مقدار `consoleLevel` به `debug` افزایش می‌یابد.
- `maxFileBytes`: حداکثر اندازه فایل ثبت وقایع فعال بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 MB). OpenClaw تا پنج بایگانی شماره‌گذاری‌شده را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن به‌صورت بهترین تلاش برای خروجی کنسول، فایل‌های ثبت وقایع، رکوردهای ثبت وقایع OTLP و متن رونوشت جلسه پایدارشده. `redactSensitive: "off"` فقط این سیاست عمومی ثبت وقایع/رونوشت را غیرفعال می‌کند؛ سطح‌های ایمنی UI/ابزار/عیب‌یابی همچنان رازها را پیش از انتشار می‌پوشانند.

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
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی ثبت وقایع هدفمند را فعال می‌کنند (از نویسه‌های عام مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانه سن بدون پیشرفت بر حسب ms برای دسته‌بندی جلسه‌های پردازشی طولانی به‌عنوان `session.long_running`، `session.stalled` یا `session.stuck`. پاسخ، ابزار، وضعیت، بلاک و پیشرفت ACP زمان‌سنج را بازنشانی می‌کنند؛ عیب‌یابی‌های تکراری `session.stuck` تا وقتی بدون تغییر باشند، با وقفه عقب‌نشینی می‌کنند.
- `stuckSessionAbortMs`: آستانه سن بدون پیشرفت بر حسب ms پیش از آن‌که کار فعال متوقف‌شده واجد شرایط بتواند برای بازیابی با تخلیه لغو شود. وقتی تنظیم نشده باشد، OpenClaw از پنجره ایمن‌تر و طولانی‌تر اجرای نهفته، حداقل 10 دقیقه و 5 برابر `stuckSessionWarnMs`، استفاده می‌کند.
- `otel.enabled`: خط لوله صدور OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، فهرست سیگنال‌ها و مدل حریم خصوصی، [صدور OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: URL گردآورنده برای صدور OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP مخصوص سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فراداده HTTP/gRPC اضافی که همراه درخواست‌های صدور OTel ارسال می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: صدور ردگیری، سنجه‌ها یا ثبت وقایع را فعال کنید.
- `otel.sampleRate`: نرخ نمونه‌برداری ردگیری `0`-`1`.
- `otel.flushIntervalMs`: بازه تخلیه دوره‌ای تله‌متری بر حسب ms.
- `otel.captureContent`: ثبت محتوای خام به‌صورت انتخابی برای ویژگی‌های span در OTEL. پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را ثبت می‌کند؛ شکل شیء اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs` و `systemPrompt` را به‌صراحت فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای تازه‌ترین ویژگی‌های آزمایشی ارائه‌دهنده span در GenAI. به‌طور پیش‌فرض، spanها برای سازگاری ویژگی قدیمی `gen_ai.system` را نگه می‌دارند؛ سنجه‌های GenAI از ویژگی‌های معنایی محدود استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از قبل یک SDK سراسری OpenTelemetry ثبت کرده‌اند. سپس OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را رد می‌کند، در حالی که شنونده‌های عیب‌یابی فعال می‌مانند.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطه پایانی مخصوص سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: ثبت نماگرفت‌های ردگیری کش برای اجراهای نهفته (پیش‌فرض: `false`).
- `cacheTrace.filePath`: مسیر خروجی برای JSONL ردگیری کش (پیش‌فرض: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: کنترل می‌کنند چه چیزی در خروجی ردگیری کش گنجانده شود (همه پیش‌فرض: `true`).

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
- `auto.stableDelayHours`: حداقل تأخیر بر حسب ساعت پیش از اعمال خودکار در کانال پایدار (پیش‌فرض: `6`؛ حداکثر: `168`).
- `auto.stableJitterHours`: پنجره پخش انتشار اضافی در کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ حداکثر: `168`).
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

- `enabled`: دروازه قابلیت سراسری ACP (پیش‌فرض: `true`؛ برای پنهان‌کردن امکانات dispatch و spawn در ACP آن را روی `false` بگذارید).
- `dispatch.enabled`: دروازه مستقل برای dispatch نوبت جلسه ACP (پیش‌فرض: `true`). برای در دسترس نگه‌داشتن فرمان‌های ACP همزمان با مسدودکردن اجرا، آن را روی `false` بگذارید.
- `backend`: شناسه پیش‌فرض backend زمان اجرای ACP (باید با یک Plugin زمان اجرای ACP ثبت‌شده مطابقت داشته باشد).
  ابتدا Plugin مربوط به backend را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسه Plugin مربوط به backend را هم وارد کنید (برای نمونه `acpx`) وگرنه backend ACP بارگذاری نخواهد شد.
- `defaultAgent`: شناسه عامل هدف جایگزین ACP وقتی spawnها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: فهرست مجاز شناسه‌های عامل که برای جلسه‌های زمان اجرای ACP مجاز هستند؛ خالی بودن یعنی محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: حداکثر جلسه‌های ACP همزمان فعال.
- `stream.coalesceIdleMs`: پنجره تخلیه بیکار بر حسب ms برای متن جریانی.
- `stream.maxChunkChars`: حداکثر اندازه قطعه پیش از تقسیم projection بلاک جریانی.
- `stream.repeatSuppression`: خط‌های وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی جریان می‌دهد؛ `"final_only"` تا رویدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل‌مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: حداکثر نویسه‌های خروجی دستیار که در هر نوبت ACP نمایش داده می‌شود.
- `stream.maxSessionUpdateChars`: حداکثر نویسه‌ها برای خط‌های وضعیت/به‌روزرسانی نمایش‌داده‌شده ACP.
- `stream.tagVisibility`: رکوردی از نام‌های برچسب به بازنویسی‌های بولی نمایانی برای رویدادهای جریانی.
- `runtime.ttlMinutes`: TTL بیکار بر حسب دقیقه برای کارگرهای جلسه ACP پیش از واجد شرایط شدن برای پاک‌سازی.
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
  - `"random"` (پیش‌فرض): شعارهای بامزه/فصلی چرخشی.
  - `"default"`: شعار خنثای ثابت (`All your chats, one OpenClaw.`).
  - `"off"`: بدون متن شعار (عنوان/نسخه بنر همچنان نشان داده می‌شود).
- برای پنهان‌کردن کل بنر (نه فقط شعارها)، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## ویزارد

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

فیلدهای هویت `agents.list` را در [پیش‌فرض‌های عامل](/fa/gateway/config-agents#agent-defaults) ببینید.

---

## پل (قدیمی، حذف‌شده)

ساخت‌های فعلی دیگر شامل پل TCP نیستند. Nodeها از طریق WebSocket Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از شِمای پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت زمانی که نشست‌های اجرای cron ایزوله‌شده و کامل‌شده پیش از حذف از `sessions.json` نگه داشته می‌شوند. همچنین پاک‌سازی رونوشت‌های cron حذف‌شده و بایگانی‌شده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
- `runLog.maxBytes`: حداکثر اندازه هر فایل گزارش اجرا (`cron/runs/<jobId>.jsonl`) پیش از هرس. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین خط‌هایی که هنگام فعال شدن هرس گزارش اجرا نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن bearer که برای تحویل POST وب‌هوک cron استفاده می‌شود (`delivery.mode = "webhook"`)، اگر حذف شود هیچ سرآیند احراز هویتی ارسال نمی‌شود.
- `webhook`: نشانی وب‌هوک جایگزین قدیمی و منسوخ‌شده (http/https) که فقط برای کارهای ذخیره‌شده‌ای استفاده می‌شود که هنوز `notify: true` دارند.

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

- `maxAttempts`: حداکثر تلاش‌های دوباره برای کارهای یک‌باره در خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0`-`10`).
- `backoffMs`: آرایه‌ای از تأخیرهای backoff بر حسب میلی‌ثانیه برای هر تلاش دوباره (پیش‌فرض: `[30000, 60000, 300000]`؛ ۱ تا ۱۰ ورودی).
- `retryOn`: نوع خطاهایی که تلاش دوباره را فعال می‌کنند - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش دوباره روی همه نوع‌های گذرا حذف کنید.

فقط برای کارهای cron یک‌باره اعمال می‌شود. کارهای تکرارشونده از مدیریت خرابی جداگانه استفاده می‌کنند.

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

- `enabled`: فعال‌سازی هشدارهای خرابی برای کارهای cron (پیش‌فرض: `false`).
- `after`: تعداد خرابی‌های پیاپی پیش از فعال شدن هشدار (عدد صحیح مثبت، حداقل: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: شمردن اجراهای ردشده پیاپی در آستانه هشدار (پیش‌فرض: `false`). اجراهای ردشده جداگانه ردیابی می‌شوند و بر backoff خطاهای اجرا اثری ندارند.
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

- مقصد پیش‌فرض برای اعلان‌های خرابی cron در همه کارها.
- `mode`: `"announce"` یا `"webhook"`؛ وقتی داده هدف کافی وجود داشته باشد، پیش‌فرض `"announce"` است.
- `channel`: بازنویسی کانال برای تحویل announce. `"last"` از آخرین کانال تحویل شناخته‌شده دوباره استفاده می‌کند.
- `to`: هدف صریح announce یا URL وب‌هوک. برای حالت وب‌هوک الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- `delivery.failureDestination` در سطح هر کار این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد خرابی سراسری و نه مقصد خرابی در سطح کار تنظیم نشده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌شوند، هنگام خرابی به همان هدف announce اصلی برمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

[کارهای Cron](/fa/automation/cron-jobs) را ببینید. اجراهای cron ایزوله‌شده به‌عنوان [وظایف پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای قالب مدل رسانه

جانگهدارهای قالب که در `tools.media.models[].args` گسترش می‌یابند:

| متغیر             | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | بدنه کامل پیام ورودی                             |
| `{{RawBody}}`      | بدنه خام (بدون پوشش‌های تاریخچه/فرستنده)         |
| `{{BodyStripped}}` | بدنه با حذف اشاره‌های گروهی                      |
| `{{From}}`         | شناسه فرستنده                                    |
| `{{To}}`           | شناسه مقصد                                       |
| `{{MessageSid}}`   | شناسه پیام کانال                                 |
| `{{SessionId}}`    | UUID نشست فعلی                                   |
| `{{IsNewSession}}` | وقتی نشست جدید ایجاد شود، `"true"`               |
| `{{MediaUrl}}`     | شبه‌URL رسانه ورودی                              |
| `{{MediaPath}}`    | مسیر رسانه محلی                                  |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)                      |
| `{{Transcript}}`   | رونوشت صوتی                                      |
| `{{Prompt}}`       | پرامپت رسانه حل‌شده برای ورودی‌های CLI           |
| `{{MaxChars}}`     | حداکثر نویسه‌های خروجی حل‌شده برای ورودی‌های CLI |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (در حد بهترین تلاش)                   |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد بهترین تلاش)         |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد بهترین تلاش)           |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد بهترین تلاش)           |
| `{{Provider}}`     | راهنمای provider (whatsapp، telegram، discord و غیره) |

---

## شامل‌سازی‌های پیکربندی (`$include`)

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
- کلیدهای هم‌سطح: پس از شامل‌سازی‌ها ادغام می‌شوند (مقادیر شامل‌شده را بازنویسی می‌کنند).
- شامل‌سازی‌های تو در تو: تا عمق ۱۰ سطح.
- مسیرها: نسبت به فایل شامل‌کننده حل می‌شوند، اما باید داخل پوشه پیکربندی سطح بالا (`dirname` از `openclaw.json`) بمانند. شکل‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل همان مرز حل شوند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالای پشتیبانی‌شده با یک شامل‌سازی تک‌فایلی را تغییر می‌دهند، در همان فایل شامل‌شده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- شامل‌سازی‌های ریشه، آرایه‌های شامل‌سازی، و شامل‌سازی‌هایی با بازنویسی‌های هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط خواندنی هستند؛ این نوشتن‌ها به‌جای تخت‌کردن پیکربندی، بسته و ناموفق می‌شوند.
- خطاها: پیام‌های روشن برای فایل‌های گم‌شده، خطاهای parse، و شامل‌سازی‌های چرخه‌ای.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

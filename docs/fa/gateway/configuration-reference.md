---
read_when:
    - به معناشناسی دقیق پیکربندی در سطح فیلد یا مقادیر پیش‌فرض نیاز دارید
    - در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای هسته OpenClaw، مقادیر پیش‌فرض و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-05-02T20:43:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559a52c9ea7428aa0a33b9699eaf144aa114638acf57f813217642319ce77987
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و هرجا یک زیرسامانه مرجع عمیق‌تری برای خودش داشته باشد، به آن پیوند می‌دهد. فهرست‌های فرمانِ متعلق به کانال و Plugin، و تنظیمات عمیق حافظه/QMD، به‌جای این صفحه در صفحه‌های خودشان قرار دارند.

حقیقت کد:

- `openclaw config schema` طرح‌واره JSON زنده‌ای را چاپ می‌کند که برای اعتبارسنجی و Control UI استفاده می‌شود، همراه با فراداده‌های bundle/Plugin/کانال که در صورت وجود ادغام شده‌اند
- `config.schema.lookup` یک گره طرح‌واره با دامنه مسیر را برای ابزارهای بررسی جزئیات برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش مبنای مستندات پیکربندی را در برابر سطح فعلی طرح‌واره اعتبارسنجی می‌کنند

مسیر یافتن عامل: پیش از ویرایش، از کنش ابزار `gateway` به نام `config.schema.lookup` برای
مستندات و محدودیت‌های دقیق در سطح فیلد استفاده کنید. برای راهنمایی وظیفه‌محور از
[پیکربندی](/fa/gateway/configuration) استفاده کنید و برای نقشه گسترده‌تر فیلدها،
پیش‌فرض‌ها، و پیوندها به مراجع زیرسامانه‌ها از این صفحه استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations`، و پیکربندی Dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [فرمان‌های اسلش](/fa/tools/slash-commands) برای فهرست فعلی فرمان‌های داخلی + bundle‌شده
- صفحه‌های کانال/Plugin مالک برای سطوح فرمان مختص کانال

قالب پیکربندی **JSON5** است (دیدگاه‌ها + کاماهای پایانی مجاز هستند). همه فیلدها اختیاری هستند — OpenClaw وقتی حذف شوند از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند — برای `channels.*`
[پیکربندی — کانال‌ها](/fa/gateway/config-channels) را ببینید،
شامل Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و دیگر
کانال‌های bundle‌شده (احراز هویت، کنترل دسترسی، چندحسابی، دروازه‌گذاری منشن).

## پیش‌فرض‌های عامل، چندعاملی، نشست‌ها، و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است — ببینید
[پیکربندی — عامل‌ها](/fa/gateway/config-agents) برای:

- `agents.defaults.*` (فضای کاری، مدل، تفکر، Heartbeat، حافظه، رسانه، Skills، sandbox)
- `multiAgent.*` (مسیردهی و اتصال‌های چندعاملی)
- `session.*` (چرخه عمر نشست، Compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر markdown)
- `talk.*` (حالت Talk)
  - `talk.speechLocale`: شناسه اختیاری locale از نوع BCP 47 برای تشخیص گفتار Talk در iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال متن پیاده‌شده، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، toggleهای آزمایشی، پیکربندی ابزارهای پشتیبانی‌شده توسط ارائه‌دهنده، و راه‌اندازی
ارائه‌دهنده سفارشی / base-URL به صفحه‌ای اختصاصی منتقل شده‌اند — ببینید
[پیکربندی — ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools).

## مدل‌ها

تعریف‌های ارائه‌دهنده، allowlistهای مدل، و راه‌اندازی ارائه‌دهنده سفارشی در
[پیکربندی — ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند.
ریشه `models` رفتار سراسری فهرست مدل را نیز مالکیت می‌کند.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: رفتار فهرست ارائه‌دهنده (`merge` یا `replace`).
- `models.providers`: نگاشت ارائه‌دهنده سفارشی با کلید شناسه ارائه‌دهنده.
- `models.pricing.enabled`: bootstrap قیمت‌گذاری پس‌زمینه را کنترل می‌کند که
  پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد،
  Gateway دریافت‌های فهرست قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقدارهای پیکربندی‌شده
  `models.providers.*.models[].cost` همچنان برای برآورد هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط
Pi جاسازی‌شده و دیگر adapterهای زمان اجرا مصرف می‌شوند. فرمان‌های `openclaw mcp list`،
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
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: تعریف‌های نام‌دار سرور MCP از نوع stdio یا remote برای زمان اجراهایی که
  ابزارهای MCP پیکربندی‌شده را در دسترس می‌گذارند.
  ورودی‌های remote از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛
  `type: "http"` یک alias بومی CLI است که `openclaw mcp set` و
  `openclaw doctor --fix` آن را به فیلد canonical `transport` عادی‌سازی می‌کنند.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای زمان اجراهای MCP bundle‌شده با دامنه نشست.
  اجرای یک‌باره جاسازی‌شده درخواست پاک‌سازی پایان اجرا می‌دهد؛ این TTL پشتوانه‌ای برای
  نشست‌های طولانی‌مدت و فراخوان‌های آینده است.
- تغییرهای زیر `mcp.*` با dispose کردن زمان اجراهای MCP نشست cache‌شده به‌صورت گرم اعمال می‌شوند.
  کشف/استفاده بعدی از ابزار آن‌ها را از پیکربندی جدید دوباره می‌سازد، بنابراین ورودی‌های حذف‌شده
  `mcp.servers` به‌جای انتظار برای TTL بیکاری، بلافاصله جمع‌آوری می‌شوند.

برای رفتار زمان اجرا، [MCP](/fa/cli/mcp#openclaw-as-an-mcp-client-registry) و
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

- `allowBundled`: allowlist اختیاری فقط برای Skills bundle‌شده (Skills مدیریت‌شده/فضای کاری بی‌تأثیر می‌مانند).
- `load.extraDirs`: ریشه‌های Skill مشترک اضافی (کمترین اولویت).
- `install.preferBrew`: وقتی true باشد، در صورت در دسترس بودن `brew`، پیش از fallback به گونه‌های دیگر نصب‌کننده، نصب‌کننده‌های Homebrew را ترجیح می‌دهد.
- `install.nodeManager`: ترجیح نصب‌کننده node برای مشخصه‌های `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` یک Skill را حتی اگر bundle/نصب شده باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بر برای Skills که یک متغیر محیطی اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

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

- از `~/.openclaw/extensions`، `<workspace>/.openclaw/extensions`، به‌علاوه `plugins.load.paths` بارگذاری می‌شود.
- کشف، Pluginهای بومی OpenClaw به‌علاوه bundleهای سازگار Codex و bundleهای Claude را می‌پذیرد، شامل bundleهای layout پیش‌فرض Claude بدون manifest.
- **تغییرهای پیکربندی نیازمند راه‌اندازی دوباره gateway هستند.**
- `allow`: allowlist اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` برنده می‌شود.
- `plugins.entries.<id>.apiKey`: فیلد میان‌بر کلید API در سطح Plugin (وقتی Plugin پشتیبانی کند).
- `plugins.entries.<id>.env`: نگاشت متغیر محیطی با دامنه Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، هسته `before_prompt_build` را مسدود می‌کند و فیلدهای تغییردهنده prompt از `before_agent_start` قدیمی را نادیده می‌گیرد، درحالی‌که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. برای hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط bundle که پشتیبانی می‌شوند اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیر bundle‌شده مورداعتماد می‌توانند محتوای خام گفتگو را از hookهای typed مانند `llm_input`، `llm_output`، `before_agent_finalize`، و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌طور صریح به این Plugin اعتماد می‌کند تا برای اجراهای subagent پس‌زمینه، overrideهای `provider` و `model` در هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist اختیاری از هدف‌های canonical `provider/model` برای overrideهای subagent مورداعتماد. فقط وقتی از `"*"` استفاده کنید که عمداً می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (در صورت وجود، توسط طرح‌واره Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/زمان اجرای Plugin کانال زیر `channels.<id>` قرار دارند و باید توسط فراداده `channelConfigs` در manifest متعلق به همان Plugin توصیف شوند، نه توسط یک registry مرکزی گزینه‌های OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: تنظیمات ارائه‌دهنده web-fetch مربوط به Firecrawl.
  - `apiKey`: کلید API مربوط به Firecrawl (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، `tools.web.fetch.firecrawl.apiKey` قدیمی، یا متغیر محیطی `FIRECRAWL_API_KEY` fallback می‌کند.
  - `baseUrl`: نشانی پایه API مربوط به Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای self-hosted باید endpointهای خصوصی/داخلی را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی صفحه‌ها را استخراج می‌کند (پیش‌فرض: `true`).
  - `maxAgeMs`: بیشینه سن cache برحسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: timeout درخواست scrape برحسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جستجوی وب Grok).
  - `enabled`: ارائه‌دهنده X Search را فعال می‌کند.
  - `model`: مدل Grok برای استفاده در جستجو (برای نمونه `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات Dreaming حافظه. برای phaseها و آستانه‌ها [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: کلید اصلی Dreaming (پیش‌فرض `false`).
  - `frequency`: آهنگ Cron برای هر sweep کامل Dreaming (به‌طور پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent مربوط به Dream Diary. نیازمند `plugins.entries.memory-core.subagent.allowModelOverride: true` است؛ با `allowedModels` همراه کنید تا هدف‌ها محدود شوند. خطاهای model-unavailable یک‌بار با مدل پیش‌فرض نشست دوباره تلاش می‌شوند؛ شکست‌های trust یا allowlist بی‌صدا fallback نمی‌کنند.
  - سیاست phase و آستانه‌ها جزئیات پیاده‌سازی هستند (کلیدهای پیکربندی کاربرمحور نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای bundle مربوط به Claude که فعال هستند، می‌توانند پیش‌فرض‌های Pi جاسازی‌شده را نیز از `settings.json` مشارکت دهند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات عامل sanitize‌شده اعمال می‌کند، نه به‌عنوان patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه `"none"` را انتخاب کنید.
- `plugins.slots.contextEngine`: شناسه Plugin موتور زمینه فعال را انتخاب کنید؛ پیش‌فرض `"legacy"` است مگر اینکه موتور دیگری نصب و انتخاب کنید.

[Pluginها](/fa/tools/plugin) را ببینید.

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
  نشست از سقف خود فراتر برود، آزاد می‌کند. برای غیرفعال کردن این حالت‌های
  پاک‌سازی جداگانه، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد، غیرفعال است؛ بنابراین ناوبری مرورگر به‌صورت پیش‌فرض سخت‌گیرانه می‌ماند.
- فقط زمانی `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید که عمداً به ناوبری مرورگر در شبکه‌ی خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقاط پایانی پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترس‌پذیری/کشف، مشمول همان مسدودسازی شبکه‌ی خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- پروفایل‌های راه‌دور فقط پیوستنی هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl` مقادیر `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند، از HTTP(S) استفاده کنید؛
  وقتی ارائه‌دهنده‌ی شما یک URL مستقیم DevTools WebSocket می‌دهد، از WS(S)
  استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترس‌پذیری CDP راه‌دور و
  `attachOnly` و همچنین درخواست‌های باز کردن زبانه اعمال می‌شوند. پروفایل‌های
  مدیریت‌شده‌ی loopback پیش‌فرض‌های CDP محلی را حفظ می‌کنند.
- اگر یک سرویس CDP با مدیریت خارجی از طریق loopback قابل دسترسی است، برای آن
  پروفایل `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw پورت loopback را
  به‌عنوان یک پروفایل مرورگر مدیریت‌شده‌ی محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت پورت محلی را گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل پیوست شوند.
- پروفایل‌های `existing-session` می‌توانند `userDataDir` را برای هدف گرفتن یک پروفایل
  مرورگر مبتنی بر Chromium مشخص، مانند Brave یا Edge، تنظیم کنند.
- پروفایل‌های `existing-session` محدودیت‌های فعلی مسیر Chrome MCP را حفظ می‌کنند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری CSS-selector، قلاب‌های بارگذاری
  یک‌فایلی، بدون بازنویسی مهلت گفت‌وگو، بدون `wait --load networkidle`، و بدون
  `responsebody`، خروجی PDF، رهگیری دانلود، یا کنش‌های دسته‌ای.
- پروفایل‌های محلی مدیریت‌شده‌ی `openclaw`، `cdpPort` و `cdpUrl` را به‌صورت خودکار اختصاص می‌دهند؛ فقط
  برای CDP راه‌دور، `cdpUrl` را صریح تنظیم کنید.
- پروفایل‌های محلی مدیریت‌شده می‌توانند `executablePath` را تنظیم کنند تا مقدار سراسری
  `browser.executablePath` را برای آن پروفایل بازنویسی کنند. از این گزینه برای اجرای یک پروفایل در
  Chrome و پروفایلی دیگر در Brave استفاده کنید.
- پروفایل‌های محلی مدیریت‌شده پس از شروع فرایند، برای کشف HTTP مربوط به Chrome CDP از `browser.localLaunchTimeoutMs`
  و برای آمادگی websocket مربوط به CDP پس از راه‌اندازی از `browser.localCdpReadyTimeoutMs` استفاده می‌کنند.
  در میزبان‌های کندتر که Chrome با موفقیت شروع می‌شود اما بررسی‌های آمادگی با راه‌اندازی رقابت می‌کنند،
  این مقادیر را افزایش دهید. هر دو مقدار باید عددهای صحیح مثبت تا `120000` میلی‌ثانیه باشند؛
  مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را برای پوشه‌ی خانه‌ی سیستم‌عامل شما پیش از راه‌اندازی Chromium می‌پذیرند.
  `userDataDir` در سطح هر پروفایل برای پروفایل‌های `existing-session` نیز با tilde گسترش می‌یابد.
- سرویس کنترل: فقط loopback (پورت برگرفته از `gateway.port`، پیش‌فرض `18791`).
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

- `seamColor`: رنگ تاکید برای پوسته‌ی رابط کاربری برنامه‌ی بومی (رنگ حباب Talk Mode و غیره).
- `assistant`: بازنویسی هویت رابط کاربری کنترل. در صورت نبود، از هویت عامل فعال استفاده می‌کند.

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

- `mode`: ‏`local` (اجرای Gateway) یا `remote` (اتصال به Gateway راه دور). Gateway از شروع به کار خودداری می‌کند مگر اینکه `local` باشد.
- `port`: پورت واحدِ چندبخشی برای WS + HTTP. تقدم: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto`، ‏`loopback` (پیش‌فرض)، ‏`lan` (`0.0.0.0`)، ‏`tailnet` (فقط IP متعلق به Tailscale)، یا `custom`.
- **نام‌های مستعار bind قدیمی**: از مقدارهای حالت bind در `gateway.bind` استفاده کنید (`auto`، ‏`loopback`، ‏`lan`، ‏`tailnet`، ‏`custom`)، نه نام‌های مستعار میزبان (`0.0.0.0`، ‏`127.0.0.1`، ‏`localhost`، ‏`::`، ‏`::1`).
- **نکته Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکه‌بندی bridge در Docker (`-p 18789:18789`)، ترافیک روی `eth0` می‌رسد، بنابراین Gateway در دسترس نیست. از `--network host` استفاده کنید، یا `bind: "lan"` (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) را تنظیم کنید تا روی همه رابط‌ها گوش دهد.
- **احراز هویت**: به‌طور پیش‌فرض الزامی است. bindهای غیر loopback به احراز هویت Gateway نیاز دارند. در عمل یعنی یک توکن/گذرواژه مشترک یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. راه‌انداز onboarding به‌طور پیش‌فرض یک توکن تولید می‌کند.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefها)، `gateway.auth.mode` را صراحتاً روی `token` یا `password` بگذارید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، جریان‌های راه‌اندازی و نصب/تعمیر سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریحِ بدون احراز هویت. فقط برای راه‌اندازی‌های قابل اعتماد local loopback استفاده کنید؛ این حالت عمداً در اعلان‌های onboarding ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک reverse proxy آگاه از هویت واگذار می‌کند و به سرآیندهای هویتی از `gateway.trustedProxies` اعتماد می‌کند (ببینید [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth)). این حالت به‌طور پیش‌فرض انتظار یک منبع proxy **غیر loopback** دارد؛ reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی روی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان fallback مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، سرآیندهای هویت Tailscale Serve می‌توانند احراز هویت رابط کاربری کنترل/WebSocket را برآورده کنند (از طریق `tailscale whois` تأیید می‌شود). نقاط پایانی HTTP API از آن احراز هویت سرآیند Tailscale استفاده **نمی‌کنند**؛ در عوض حالت عادی احراز هویت HTTP Gateway را دنبال می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway قابل اعتماد است. وقتی `tailscale.mode = "serve"` باشد، مقدار پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکننده اختیاری برای احراز هویت ناموفق. برای هر IP کلاینت و هر دامنه احراز هویت اعمال می‌شود (shared-secret و device-token جداگانه پیگیری می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر async رابط کاربری کنترل Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست، سریالی می‌شوند. بنابراین تلاش‌های بد هم‌زمان از همان کلاینت می‌توانند محدودکننده را در درخواست دوم فعال کنند، به‌جای اینکه هر دو به‌صورت ناسازگاری ساده هم‌زمان عبور کنند.
  - مقدار پیش‌فرض `gateway.auth.rateLimit.exemptLoopback` برابر `true` است؛ وقتی عمداً می‌خواهید ترافیک localhost هم rate-limit شود (برای راه‌اندازی‌های آزمون یا استقرارهای proxy سخت‌گیرانه)، آن را روی `false` بگذارید.
- تلاش‌های احراز هویت WS با origin مرورگر همیشه با غیرفعال بودن معافیت loopback محدودسازی می‌شوند (دفاع چندلایه در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، آن lockoutهای با origin مرورگر برای هر مقدار نرمال‌شده `Origin`
  جدا می‌شوند، بنابراین شکست‌های تکراری از یک origin متعلق به localhost به‌صورت خودکار
  یک origin متفاوت را قفل نمی‌کنند.
- `tailscale.mode`: ‏`serve` (فقط tailnet، bind روی loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `controlUi.allowedOrigins`: allowlist صریح origin مرورگر برای اتصال‌های WebSocket به Gateway. وقتی انتظار می‌رود کلاینت‌های مرورگر از originهای غیر loopback بیایند، الزامی است.
- `controlUi.chatMessageMaxWidth`: بیشینه عرض اختیاری برای پیام‌های گفت‌وگوی گروه‌بندی‌شده رابط کاربری کنترل. مقدارهای محدودشده عرض CSS مانند `960px`، ‏`82%`، ‏`min(1280px, 82%)`، و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناکی که fallback origin مبتنی بر سرآیند Host را برای استقرارهایی که عمداً به سیاست origin سرآیند Host تکیه دارند فعال می‌کند.
- `remote.transport`: ‏`ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، مقدار `remote.url` باید `ws://` یا `wss://` باشد.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override اضطراری در محیط فرایند سمت کلاینت
  که plaintext `ws://` را به IPهای مورد اعتماد شبکه خصوصی مجاز می‌کند؛ پیش‌فرض برای plaintext همچنان فقط loopback است. معادل `openclaw.json`
  وجود ندارد، و پیکربندی شبکه خصوصی مرورگر مانند
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` روی کلاینت‌های WebSocket
  مربوط به Gateway اثر نمی‌گذارد.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامه کلاینت راه دور هستند. آن‌ها به‌تنهایی احراز هویت Gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: نشانی HTTPS پایه برای relay خارجی APNs که buildهای رسمی/TestFlight iOS پس از انتشار ثبت‌نام‌های relay-backed به Gateway از آن استفاده می‌کنند. این URL باید با URL relay کامپایل‌شده در build iOS مطابقت داشته باشد.
- `gateway.push.apns.relay.timeoutMs`: مهلت ارسال از Gateway به relay بر حسب میلی‌ثانیه. مقدار پیش‌فرض `10000` است.
- ثبت‌نام‌های relay-backed به یک هویت Gateway مشخص واگذار می‌شوند. برنامه iOS جفت‌شده `gateway.identity.get` را دریافت می‌کند، آن هویت را در ثبت‌نام relay قرار می‌دهد، و یک مجوز ارسال با دامنه ثبت‌نام را به Gateway منتقل می‌کند. Gateway دیگر نمی‌تواند آن ثبت‌نام ذخیره‌شده را دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه گریز فقط برای توسعه برای URLهای relay HTTP روی loopback. URLهای relay تولید باید روی HTTPS باقی بمانند.
- `gateway.handshakeTimeoutMs`: مهلت handshake WebSocket پیش از احراز هویت Gateway بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد، تقدم دارد. روی میزبان‌های پر بار یا کم‌قدرت که کلاینت‌های محلی می‌توانند وصل شوند در حالی که گرم‌سازی startup هنوز در حال تثبیت است، این مقدار را افزایش دهید.
- `gateway.channelHealthCheckMinutes`: بازه health-monitor کانال بر حسب دقیقه. برای غیرفعال کردن restartهای health-monitor به‌صورت سراسری، `0` بگذارید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانه socket کهنه بر حسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: بیشینه restartهای health-monitor برای هر کانال/حساب در یک ساعت rolling. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out در سطح کانال برای restartهای health-monitor در حالی که monitor سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override در سطح حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر override سطح کانال تقدم دارد.
- مسیرهای فراخوانی Gateway محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتاً از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolution به‌صورت fail closed شکست می‌خورد (بدون اینکه fallback راه دور آن را پنهان کند).
- `trustedProxies`: IPهای reverse proxy که TLS را terminate می‌کنند یا سرآیندهای forwarded-client تزریق می‌کنند. فقط proxyهایی را فهرست کنید که کنترل می‌کنید. ورودی‌های loopback همچنان برای راه‌اندازی‌های proxy/تشخیص محلی روی همان میزبان معتبرند (برای مثال Tailscale Serve یا یک reverse proxy محلی)، اما درخواست‌های loopback را واجد شرایط `gateway.auth.mode: "trusted-proxy"` نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، Gateway در صورت نبود `X-Forwarded-For` مقدار `X-Real-IP` را می‌پذیرد. مقدار پیش‌فرض `false` برای رفتار fail-closed است.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای تأیید خودکار جفت‌سازی اولین‌باره دستگاه node بدون scopeهای درخواستی. وقتی تنظیم نشده باشد غیرفعال است. این مورد جفت‌سازی operator/مرورگر/رابط کاربری کنترل/WebChat را خودکار تأیید نمی‌کند، و ارتقاهای role، scope، metadata، یا public-key را هم خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی allow/deny سراسری برای فرمان‌های اعلام‌شده node پس از جفت‌سازی و ارزیابی allowlist پلتفرم. از `allowCommands` برای opt in به فرمان‌های خطرناک node مانند `camera.snap`، ‏`camera.clip`، و `screen.record` استفاده کنید؛ `denyCommands` یک فرمان را حذف می‌کند حتی اگر پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل شود. پس از اینکه یک node فهرست فرمان‌های اعلام‌شده خود را تغییر داد، آن جفت‌سازی دستگاه را رد و دوباره تأیید کنید تا Gateway snapshot فرمان به‌روزشده را ذخیره کند.
- `gateway.tools.deny`: نام ابزارهای اضافی که برای HTTP `POST /tools/invoke` مسدود می‌شوند (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام ابزارها را از فهرست deny پیش‌فرض HTTP حذف می‌کند.

</Accordion>

### نقاط پایانی سازگار با OpenAI

- Chat Completions: به‌طور پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL در Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی به‌عنوان تنظیم‌نشده در نظر گرفته می‌شوند؛ برای غیرفعال کردن واکشی URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- سرآیند اختیاری برای سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای originهای HTTPS که کنترل می‌کنید تنظیم کنید؛ ببینید [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### جداسازی چندنمونه‌ای

چند Gateway را روی یک میزبان با پورت‌ها و دایرکتوری‌های state یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

پرچم‌های کمکی: `--dev` (از `~/.openclaw-dev` + پورت `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

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

- `enabled`: termination TLS را در listener مربوط به Gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده باشند، یک جفت گواهی/کلید خودامضاشده محلی را خودکار تولید می‌کند؛ فقط برای استفاده محلی/توسعه.
- `certPath`: مسیر فایل‌سیستم به فایل گواهی TLS.
- `keyPath`: مسیر فایل‌سیستم به فایل کلید خصوصی TLS؛ دسترسی آن را محدود نگه دارید.
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

- `mode`: کنترل می‌کند ویرایش‌های config در زمان اجرا چگونه اعمال شوند.
  - `"off"`: ویرایش‌های زنده را نادیده می‌گیرد؛ تغییرات به restart صریح نیاز دارند.
  - `"restart"`: همیشه با تغییر config فرایند Gateway را restart می‌کند.
  - `"hot"`: تغییرات را بدون restart درون فرایند اعمال می‌کند.
  - `"hybrid"` (پیش‌فرض): ابتدا hot reload را امتحان می‌کند؛ اگر لازم باشد به restart fallback می‌کند.
- `debounceMs`: پنجره debounce بر حسب ms پیش از اعمال تغییرات config (عدد صحیح نامنفی).
- `deferralTimeoutMs`: بیشینه زمان اختیاری بر حسب ms برای انتظار عملیات‌های در حال انجام پیش از اجبار به restart. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای still-pending، `0` بگذارید.

---

## Hooks

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
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید؛ برای مثال `["hook:"]`.
- اگر یک mapping یا preset از `sessionKey` قالبی استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای mapping ایستا به این انتخاب صریح نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط وقتی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` resolve می‌شود
  - مقدارهای `sessionKey` در mapping که با template رندر شده‌اند، به‌عنوان مقدارهای بیرونی در نظر گرفته می‌شوند و آن‌ها نیز به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="Mapping details">

- `match.path` با زیرمسیر بعد از `/hooks` مطابقت می‌کند (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` برای مسیرهای عمومی با یک فیلد payload مطابقت می‌کند.
- templateهایی مانند `{{messages[0].subject}}` از payload خوانده می‌شوند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک اقدام hook برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و داخل `hooks.transformsDir` بماند (مسیرهای مطلق و پیمایش مسیر رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های Skills در workspace رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transforms مربوط به hooks منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک agent مشخص مسیریابی می‌کند؛ شناسه‌های ناشناخته به حالت پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: مسیریابی صریح را محدود می‌کند (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید session ثابت اختیاری برای اجرای agent مربوط به hook بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخواننده‌های `/hooks/agent` و کلیدهای session مربوط به mappingهای مبتنی بر template اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: allowlist اختیاری prefix برای مقدارهای صریح `sessionKey` (درخواست + mapping)، مثلاً `["hook:"]`. وقتی هر mapping یا preset از `sessionKey` قالبی استفاده کند، این مورد الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک channel می‌فرستد؛ `channel` به‌طور پیش‌فرض `last` است.
- `model` مدل LLM را برای این اجرای hook override می‌کند (اگر catalog مدل تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- preset داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر این مسیریابی برای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را محدود کنید تا با namespace مربوط به Gmail مطابقت داشته باشد؛ برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، preset را به‌جای پیش‌فرض قالبی، با یک `sessionKey` ایستا override کنید.

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

- وقتی پیکربندی شده باشد، Gateway هنگام boot به‌طور خودکار `gog gmail watch serve` را شروع می‌کند. برای غیرفعال‌سازی، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
- یک `gog gmail watch serve` جداگانه را در کنار Gateway اجرا نکنید.

---

## میزبان canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- HTML/CSS/JS قابل ویرایش توسط agent و A2UI را روی HTTP زیر پورت Gateway ارائه می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- bindهای غیر loopback: مسیرهای canvas به احراز هویت Gateway نیاز دارند (token/password/trusted-proxy)، مانند دیگر سطح‌های HTTP مربوط به Gateway.
- WebViewهای Node معمولاً headerهای احراز هویت ارسال نمی‌کنند؛ پس از paired و connected شدن یک node، Gateway برای دسترسی canvas/A2UI، URLهای capability با scope همان node را اعلام می‌کند.
- URLهای capability به session فعال WS مربوط به node بسته هستند و سریع منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت live-reload را به HTML ارائه‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را به‌طور خودکار ایجاد می‌کند.
- همچنین A2UI را در `/__openclaw__/a2ui/` ارائه می‌کند.
- تغییرات به راه‌اندازی مجدد gateway نیاز دارند.
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

- `minimal` (پیش‌فرض): `cliPath` + `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: شامل `cliPath` + `sshPort` می‌شود.
- اگر hostname سیستم یک برچسب DNS معتبر باشد، hostname به‌طور پیش‌فرض همان است؛ در غیر این صورت به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` override کنید.

### گسترده‌ناحیه (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک zone تک‌پخشی DNS-SD زیر `~/.openclaw/dns/` می‌نویسد. برای کشف بین شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + split DNS در Tailscale همراه کنید.

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

- متغیرهای env درون‌خطی فقط وقتی اعمال می‌شوند که env فرایند آن کلید را نداشته باشد.
- فایل‌های `.env`: فایل `.env` در CWD + `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را override نمی‌کنند).
- `shellEnv`: کلیدهای مورد انتظارِ موجود نیستند را از profile پوستهٔ login شما وارد می‌کند.
- برای ترتیب تقدم کامل، [محیط](/fa/help/environment) را ببینید.

### جایگزینی متغیر env

در هر رشتهٔ config با `${VAR_NAME}` به متغیرهای env ارجاع دهید:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- فقط نام‌های uppercase مطابقت داده می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای موجود نیستند یا خالی هنگام load کردن config خطا ایجاد می‌کنند.
- برای literal `${VAR}` با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## اسرار

ارجاع‌های secret افزایشی هستند: مقدارهای plaintext همچنان کار می‌کنند.

### `SecretRef`

از یک شکل object استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی id برای `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id برای `source: "file"`: اشاره‌گر مطلق JSON (برای مثال `"/providers/openai/apiKey"`)
- الگوی id برای `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- idهای `source: "exec"` نباید شامل segmentهای مسیر با `/` به‌عنوان جداکننده باشند که `.` یا `..` هستند (برای مثال `a/../b` رد می‌شود)

### سطح credential پشتیبانی‌شده

- ماتریس canonical: [سطح Credential مربوط به SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای credential پشتیبانی‌شده در `openclaw.json` را هدف می‌گیرد.
- ارجاع‌های `auth-profiles.json` در resolve زمان اجرا و پوشش audit گنجانده می‌شوند.

### پیکربندی providerهای secret

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

- provider نوع `file` از `mode: "json"` و `mode: "singleValue"` پشتیبانی می‌کند (`id` در حالت singleValue باید `"value"` باشد).
- وقتی اعتبارسنجی ACL در Windows در دسترس نباشد، مسیرهای provider نوع file و exec به‌صورت fail closed عمل می‌کنند. `allowInsecurePath: true` را فقط برای مسیرهای مورد اعتمادی تنظیم کنید که نمی‌توان آن‌ها را اعتبارسنجی کرد.
- provider نوع `exec` به یک مسیر `command` مطلق نیاز دارد و از payloadهای protocol روی stdin/stdout استفاده می‌کند.
- به‌طور پیش‌فرض، مسیرهای command که symlink هستند رد می‌شوند. `allowSymlinkCommand: true` را تنظیم کنید تا در حین اعتبارسنجی مسیر target resolve‌شده، مسیرهای symlink مجاز شوند.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی trusted-dir روی مسیر target resolve‌شده اعمال می‌شود.
- محیط child مربوط به `exec` به‌طور پیش‌فرض حداقلی است؛ متغیرهای مورد نیاز را با `passEnv` صریحاً pass کنید.
- ارجاع‌های secret هنگام activation به یک snapshot درون‌حافظه resolve می‌شوند، سپس مسیرهای request فقط snapshot را می‌خوانند.
- فیلتر کردن سطح فعال هنگام activation اعمال می‌شود: ارجاع‌های resolve‌نشده روی سطح‌های فعال startup/reload را ناموفق می‌کنند، در حالی که سطح‌های غیرفعال با diagnostics رد می‌شوند.

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

- profileهای هر agent در `<agentDir>/auth-profiles.json` ذخیره می‌شوند.
- `auth-profiles.json` برای حالت‌های credential ایستا از ارجاع‌های سطح مقدار (`keyRef` برای `api_key`، `tokenRef` برای `token`) پشتیبانی می‌کند.
- mapهای flat قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` یک قالب runtime نیستند؛ `openclaw doctor --fix` آن‌ها را با backup `.legacy-flat.*.bak` به profileهای API-key canonical با `provider:default` بازنویسی می‌کند.
- profileهای حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از credentialهای auth-profile مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- credentialهای runtime ایستا از snapshotهای resolve‌شدهٔ درون‌حافظه می‌آیند؛ ورودی‌های قدیمی و ایستای `auth.json` وقتی کشف شوند پاک‌سازی می‌شوند.
- importهای OAuth قدیمی از `~/.openclaw/credentials/oauth.json`.
- [OAuth](/fa/concepts/oauth) را ببینید.
- رفتار runtime اسرار و ابزارهای `audit/configure/apply`: [مدیریت اسرار](/fa/gateway/secrets).

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

- `billingBackoffHours`: تأخیر پایه بر حسب ساعت وقتی یک پروفایل به دلیل خطاهای واقعی
  صورت‌حساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح مربوط به صورت‌حساب
  همچنان می‌تواند حتی در پاسخ‌های `401`/`403` اینجا قرار بگیرد، اما تطبیق‌دهنده‌های متن
  ویژهٔ ارائه‌دهنده در محدودهٔ همان ارائه‌دهنده‌ای می‌مانند که مالکشان است (برای مثال OpenRouter
  `Key limit exceeded`). پیام‌های قابل تلاش دوبارهٔ HTTP `402` مربوط به بازهٔ مصرف یا
  سقف هزینهٔ سازمان/فضای کاری به‌جای آن در مسیر `rate_limit` می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری به‌ازای هر ارائه‌دهنده برای ساعت‌های تأخیر صورت‌حساب.
- `billingMaxHours`: سقف رشد نمایی تأخیر صورت‌حساب بر حسب ساعت (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: تأخیر پایه بر حسب دقیقه برای شکست‌های با اطمینان بالای `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف رشد تأخیر `auth_permanent` بر حسب دقیقه (پیش‌فرض: `60`).
- `failureWindowHours`: پنجرهٔ غلتان بر حسب ساعت که برای شمارنده‌های تأخیر استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای اضافه‌بار، پیش از تغییر به جایگزین مدل (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` اینجا قرار می‌گیرند.
- `overloadedBackoffMs`: تأخیر ثابت پیش از تلاش دوباره برای یک چرخش ارائه‌دهنده/پروفایل اضافه‌بارشده (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای محدودیت نرخ، پیش از تغییر به جایگزین مدل (پیش‌فرض: `1`). این سطل محدودیت نرخ شامل متن‌های شکل‌گرفته توسط ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded` و `resource exhausted` است.

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
- `maxFileBytes`: حداکثر اندازهٔ فایل گزارش فعال بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 MB). OpenClaw تا پنج آرشیو شماره‌گذاری‌شده را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن بهترین‌تلاش برای خروجی کنسول، گزارش‌های فایل، رکوردهای گزارش OTLP، و متن رونوشت نشست‌های پایدارشده. `redactSensitive: "off"` فقط این سیاست عمومی گزارش/رونوشت را غیرفعال می‌کند؛ سطح‌های ایمنی UI/ابزار/عیب‌یابی همچنان پیش از انتشار، رازها را ویرایش می‌کنند.

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

- `enabled`: کلید اصلی برای خروجی ابزارگذاری (پیش‌فرض: `true`).
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی گزارش هدفمند را فعال می‌کنند (از نویسه‌های عام مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانهٔ سن بدون پیشرفت بر حسب میلی‌ثانیه برای طبقه‌بندی نشست‌های پردازشی طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled` یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک و پیشرفت ACP زمان‌سنج را بازنشانی می‌کنند؛ عیب‌یابی‌های تکراری `session.stuck` تا وقتی بدون تغییر باشند با تأخیر افزایشی انجام می‌شوند.
- `otel.enabled`: خط لولهٔ خروجی OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، کاتالوگ سیگنال و مدل حریم خصوصی، [خروجی OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: نشانی گردآورنده برای خروجی OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP ویژهٔ هر سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فرادادهٔ اضافی HTTP/gRPC که همراه درخواست‌های خروجی OTel ارسال می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: خروجی ردگیری، معیارها یا گزارش را فعال می‌کند.
- `otel.sampleRate`: نرخ نمونه‌برداری ردگیری `0`–`1`.
- `otel.flushIntervalMs`: فاصلهٔ تخلیهٔ دوره‌ای تله‌متری بر حسب میلی‌ثانیه.
- `otel.captureContent`: ثبت محتوای خام با انتخاب صریح برای ویژگی‌های span در OTEL. به‌طور پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را ثبت می‌کند؛ شکل شیء به شما امکان می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs` و `systemPrompt` را صریحاً فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای تازه‌ترین ویژگی‌های آزمایشی ارائه‌دهندهٔ span در GenAI. به‌طور پیش‌فرض، spanها برای سازگاری ویژگی قدیمی `gen_ai.system` را نگه می‌دارند؛ معیارهای GenAI از ویژگی‌های معنایی محدود استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از قبل یک SDK سراسری OpenTelemetry ثبت کرده‌اند. در این حالت OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را رد می‌کند، در حالی که شنونده‌های عیب‌یابی فعال می‌مانند.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطهٔ پایانی ویژهٔ سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: ثبت عکس‌های فوری ردگیری کش برای اجراهای تعبیه‌شده (پیش‌فرض: `false`).
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

- `channel`: کانال انتشار برای نصب‌های npm/git — `"stable"`، `"beta"` یا `"dev"`.
- `checkOnStart`: هنگام شروع Gateway به‌روزرسانی‌های npm را بررسی می‌کند (پیش‌فرض: `true`).
- `auto.enabled`: به‌روزرسانی خودکار پس‌زمینه را برای نصب‌های بسته فعال می‌کند (پیش‌فرض: `false`).
- `auto.stableDelayHours`: حداقل تأخیر بر حسب ساعت پیش از اعمال خودکار کانال پایدار (پیش‌فرض: `6`؛ حداکثر: `168`).
- `auto.stableJitterHours`: پنجرهٔ اضافی پراکندگی عرضهٔ کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ حداکثر: `168`).
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

- `enabled`: دروازهٔ سراسری قابلیت ACP (پیش‌فرض: `true`؛ برای پنهان‌کردن dispatch و امکانات spawn در ACP مقدار `false` را تنظیم کنید).
- `dispatch.enabled`: دروازهٔ مستقل برای dispatch نوبت نشست ACP (پیش‌فرض: `true`). برای در دسترس نگه‌داشتن فرمان‌های ACP در حالی که اجرا مسدود می‌شود، مقدار `false` را تنظیم کنید.
- `backend`: شناسهٔ پیش‌فرض backend زمان اجرای ACP (باید با یک Plugin زمان اجرای ACP ثبت‌شده مطابقت داشته باشد).
  ابتدا Plugin مربوط به backend را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسهٔ Plugin مربوط به backend را هم اضافه کنید (برای مثال `acpx`) وگرنه backend مربوط به ACP بارگذاری نمی‌شود.
- `defaultAgent`: شناسهٔ عامل مقصد جایگزین ACP وقتی spawnها مقصد صریح مشخص نمی‌کنند.
- `allowedAgents`: فهرست مجاز شناسه‌های عامل که برای نشست‌های زمان اجرای ACP مجاز هستند؛ خالی بودن یعنی محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: حداکثر نشست‌های ACP فعال هم‌زمان.
- `stream.coalesceIdleMs`: پنجرهٔ تخلیهٔ بیکار بر حسب میلی‌ثانیه برای متن جریان‌یافته.
- `stream.maxChunkChars`: حداکثر اندازهٔ قطعه پیش از تقسیم projection بلوک جریان‌یافته.
- `stream.repeatSuppression`: خط‌های تکراری وضعیت/ابزار را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی جریان می‌دهد؛ `"final_only"` تا رویدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: حداکثر نویسه‌های خروجی دستیار که در هر نوبت ACP نمایش داده می‌شود.
- `stream.maxSessionUpdateChars`: حداکثر نویسه‌ها برای خط‌های وضعیت/به‌روزرسانی ACP که نمایش داده می‌شوند.
- `stream.tagVisibility`: رکوردی از نام‌های برچسب به بازنویسی‌های دیدپذیری بولی برای رویدادهای جریان‌یافته.
- `runtime.ttlMinutes`: TTL بیکار بر حسب دقیقه برای workerهای نشست ACP پیش از واجد شرایط شدن برای پاک‌سازی.
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

- `cli.banner.taglineMode` سبک tagline بنر را کنترل می‌کند:
  - `"random"` (پیش‌فرض): taglineهای چرخشی طنزآمیز/فصلی.
  - `"default"`: tagline ثابت و خنثی (`All your chats, one OpenClaw.`).
  - `"off"`: بدون متن tagline (عنوان/نسخهٔ بنر همچنان نمایش داده می‌شود).
- برای پنهان‌کردن کل بنر (نه فقط taglineها)، متغیر محیطی `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## راهنما

فراداده‌ای که توسط جریان‌های راه‌اندازی هدایت‌شدهٔ CLI نوشته می‌شود (`onboard`، `configure`، `doctor`):

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

## Bridge (قدیمی، حذف‌شده)

ساخت‌های فعلی دیگر شامل پل TCP نیستند. Nodeها از طریق WebSocket مربوط به Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از طرح‌وارهٔ پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت نگه‌داری نشست‌های اجرای Cron ایزولهٔ کامل‌شده پیش از حذف از `sessions.json`. همچنین پاک‌سازی رونوشت‌های آرشیوشدهٔ Cron حذف‌شده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال‌کردن، `false` را تنظیم کنید.
- `runLog.maxBytes`: حداکثر اندازه برای هر فایل گزارش اجرا (`cron/runs/<jobId>.jsonl`) پیش از هرس. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین خط‌هایی که هنگام فعال‌شدن هرس گزارش اجرا نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن bearer استفاده‌شده برای تحویل POST از طریق Webhook کران (`delivery.mode = "webhook"`)، اگر حذف شود هیچ سرآیند احراز هویتی ارسال نمی‌شود.
- `webhook`: نشانی Webhook جایگزین قدیمی و منسوخ‌شده (http/https) که فقط برای jobهای ذخیره‌شده‌ای استفاده می‌شود که همچنان `notify: true` دارند.

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

- `maxAttempts`: بیشینهٔ تلاش‌های مجدد برای کارهای یک‌باره در خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0` تا `10`).
- `backoffMs`: آرایه‌ای از تأخیرهای عقب‌نشینی بر حسب میلی‌ثانیه برای هر تلاش مجدد (پیش‌فرض: `[30000, 60000, 300000]`؛ ۱ تا ۱۰ ورودی).
- `retryOn`: انواع خطایی که تلاش مجدد را فعال می‌کنند — `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش مجدد روی همهٔ انواع گذرا، آن را حذف کنید.

فقط برای کارهای cron یک‌باره اعمال می‌شود. کارهای تکرارشونده از مدیریت شکست جداگانه استفاده می‌کنند.

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
- `includeSkipped`: اجراهای ردشدهٔ پیاپی را در آستانهٔ هشدار حساب می‌کند (پیش‌فرض: `false`). اجراهای ردشده جداگانه پیگیری می‌شوند و بر عقب‌نشینی خطای اجرا اثر نمی‌گذارند.
- `mode`: حالت تحویل — `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به Webhook پیکربندی‌شده ارسال می‌کند.
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
- `mode`: `"announce"` یا `"webhook"`؛ وقتی دادهٔ مقصد کافی وجود داشته باشد، پیش‌فرض `"announce"` است.
- `channel`: بازنویسی کانال برای تحویل announce. `"last"` از آخرین کانال تحویل شناخته‌شده دوباره استفاده می‌کند.
- `to`: مقصد صریح announce یا URL Webhook. برای حالت webhook الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- مقدار `delivery.failureDestination` در هر کار، این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست مخصوص کار تنظیم شده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌دهند، هنگام شکست به همان مقصد اصلی announce برمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

به [کارهای Cron](/fa/automation/cron-jobs) مراجعه کنید. اجراهای cron ایزوله به‌عنوان [کارهای پس‌زمینه](/fa/automation/tasks) پیگیری می‌شوند.

---

## متغیرهای قالب مدل رسانه

جای‌نگهدارهای قالب که در `tools.media.models[].args` گسترش می‌یابند:

| متغیر              | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | بدنهٔ کامل پیام ورودی                            |
| `{{RawBody}}`      | بدنهٔ خام (بدون پوشش‌های تاریخچه/فرستنده)        |
| `{{BodyStripped}}` | بدنه با اشاره‌های گروهی حذف‌شده                  |
| `{{From}}`         | شناسهٔ فرستنده                                   |
| `{{To}}`           | شناسهٔ مقصد                                      |
| `{{MessageSid}}`   | شناسهٔ پیام کانال                                |
| `{{SessionId}}`    | UUID نشست فعلی                                   |
| `{{IsNewSession}}` | وقتی نشست جدید ساخته شده باشد `"true"`           |
| `{{MediaUrl}}`     | شبه‌URL رسانهٔ ورودی                             |
| `{{MediaPath}}`    | مسیر محلی رسانه                                  |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)                      |
| `{{Transcript}}`   | رونوشت صوتی                                      |
| `{{Prompt}}`       | اعلان رسانهٔ حل‌شده برای ورودی‌های CLI           |
| `{{MaxChars}}`     | بیشینهٔ نویسه‌های خروجی حل‌شده برای ورودی‌های CLI |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (در حد امکان)                         |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد امکان)               |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد امکان)                 |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد امکان)                 |
| `{{Provider}}`     | راهنمای provider (whatsapp, telegram, discord, و غیره) |

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
- آرایه‌ای از فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شوند (موارد بعدی موارد قبلی را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از شامل‌سازی‌ها ادغام می‌شوند (مقادیر شامل‌شده را بازنویسی می‌کنند).
- شامل‌سازی‌های تو در تو: تا عمق ۱۰ سطح.
- مسیرها: نسبت به فایل شامل‌کننده حل می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا بمانند (`dirname` از `openclaw.json`). شکل‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل همان مرز حل شوند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالا را تغییر می‌دهند و پشتوانهٔ آن یک شامل‌سازی تک‌فایلی است، مستقیماً در همان فایل شامل‌شده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- شامل‌سازی‌های ریشه، آرایه‌های include، و includeهایی که بازنویسی هم‌سطح دارند، برای نوشتن‌های متعلق به OpenClaw فقط خواندنی هستند؛ این نوشتن‌ها به‌جای مسطح‌سازی پیکربندی، بسته شکست می‌خورند.
- خطاها: پیام‌های روشن برای فایل‌های گم‌شده، خطاهای تجزیه، و شامل‌سازی‌های چرخه‌ای.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

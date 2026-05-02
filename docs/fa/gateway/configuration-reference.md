---
read_when:
    - به معناشناسی یا پیش‌فرض‌های دقیق پیکربندی در سطح فیلد نیاز دارید
    - در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای هسته‌ای OpenClaw، پیش‌فرض‌ها، و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-05-02T22:20:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2963e01c73d1d3dbd218d76d0c0709f58f8b92e4b3d4606105cedd91571b5ed
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [Configuration](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی یک زیرسامانه مرجع عمیق‌تر خودش را دارد، به آن پیوند می‌دهد. کاتالوگ‌های دستور متعلق به کانال و Plugin و گزینه‌های عمیق memory/QMD در صفحه‌های خودشان قرار دارند، نه در این صفحه.

حقیقت کد:

- `openclaw config schema` JSON Schema زنده‌ای را چاپ می‌کند که برای اعتبارسنجی و Control UI استفاده می‌شود، همراه با فراداده‌های bundled/plugin/channel که وقتی در دسترس باشند ادغام شده‌اند
- `config.schema.lookup` یک گره schema با دامنه یک مسیر را برای ابزارهای drill-down برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش baseline مستندات پیکربندی را در برابر سطح schema فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی agent: پیش از ویرایش، برای مستندات و محدودیت‌های دقیق در سطح فیلد، از action ابزار `gateway` یعنی `config.schema.lookup` استفاده کنید. برای راهنمایی وظیفه‌محور از [Configuration](/fa/gateway/configuration) و برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها، و پیوندهای مراجع زیرسامانه‌ها از این صفحه استفاده کنید.

مراجع عمیق اختصاصی:

- [Memory configuration reference](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations`، و پیکربندی Dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/fa/tools/slash-commands) برای کاتالوگ دستور داخلی + bundled فعلی
- صفحه‌های کانال/Plugin مالک برای سطوح دستور ویژه کانال

فرمت پیکربندی **JSON5** است (کامنت + ویرگول انتهایی مجاز است). همه فیلدها اختیاری‌اند — OpenClaw وقتی فیلدی حذف شده باشد از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند — برای `channels.*`، شامل Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و سایر کانال‌های bundled (احراز هویت، کنترل دسترسی، چندحسابی، gating مبتنی بر mention)، [Configuration — channels](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های agent، چند-agent، نشست‌ها و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است — [Configuration — agents](/fa/gateway/config-agents) را برای موارد زیر ببینید:

- `agents.defaults.*` (workspace، مدل، thinking، Heartbeat، حافظه، رسانه، Skills، sandbox)
- `multiAgent.*` (مسیریابی و bindingهای چند-agent)
- `session.*` (چرخه عمر نشست، Compaction، هرس‌کردن)
- `messages.*` (تحویل پیام، TTS، رندر markdown)
- `talk.*` (حالت Talk)
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk در iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال transcript پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، toggleهای آزمایشی، پیکربندی ابزار مبتنی بر provider، و راه‌اندازی provider / base-URL سفارشی به صفحه‌ای اختصاصی منتقل شده‌اند — [Configuration — tools and custom providers](/fa/gateway/config-tools) را ببینید.

## مدل‌ها

تعریف‌های provider، allowlistهای مدل، و راه‌اندازی provider سفارشی در [Configuration — tools and custom providers](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند. ریشه `models` همچنین مالک رفتار سراسری کاتالوگ مدل است.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: رفتار کاتالوگ provider (`merge` یا `replace`).
- `models.providers`: نگاشت provider سفارشی با کلید id ارائه‌دهنده.
- `models.pricing.enabled`: bootstrap قیمت‌گذاری پس‌زمینه را کنترل می‌کند که پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد، Gateway دریافت کاتالوگ‌های قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقادیر پیکربندی‌شده `models.providers.*.models[].cost` همچنان برای برآورد هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و embedded Pi و سایر adapterهای runtime از آن‌ها استفاده می‌کنند. دستورهای `openclaw mcp list`، `show`، `set` و `unset` این بلوک را بدون اتصال به سرور هدف هنگام ویرایش پیکربندی مدیریت می‌کنند.

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

- `mcp.servers`: تعریف‌های نام‌دار سرور stdio یا MCP راه‌دور برای runtimeهایی که ابزارهای MCP پیکربندی‌شده را ارائه می‌کنند.
  ورودی‌های راه‌دور از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛
  `type: "http"` یک alias بومی CLI است که `openclaw mcp set` و
  `openclaw doctor --fix` آن را به فیلد canonical یعنی `transport` نرمال‌سازی می‌کنند.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای runtimeهای bundled MCP با دامنه نشست.
  اجراهای embedded تک‌مرحله‌ای درخواست پاک‌سازی پایان اجرا می‌کنند؛ این TTL پشتیبان نهایی برای نشست‌های طولانی‌عمر و فراخواننده‌های آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP نشست cacheشده به‌صورت hot-apply اعمال می‌شوند.
  کشف/استفاده بعدی از ابزار آن‌ها را از پیکربندی جدید دوباره ایجاد می‌کند، بنابراین ورودی‌های حذف‌شده `mcp.servers` به‌جای انتظار برای TTL بیکاری، بلافاصله جمع‌آوری می‌شوند.

برای رفتار runtime، [MCP](/fa/cli/mcp#openclaw-as-an-mcp-client-registry) و [CLI backends](/fa/gateway/cli-backends#bundle-mcp-overlays) را ببینید.

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

- `allowBundled`: allowlist اختیاری فقط برای Skills bundled (Skills مدیریت‌شده/workspace بدون اثر می‌مانند).
- `load.extraDirs`: ریشه‌های Skill مشترک اضافی (کمترین تقدم).
- `install.preferBrew`: وقتی true باشد، اگر `brew` در دسترس باشد، پیش از fallback به انواع installer دیگر، installerهای Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح installer مربوط به Node برای specهای `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` یک Skill را حتی اگر bundled/installed باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بر برای Skillsی که یک env var اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

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
- Discovery، Pluginهای بومی OpenClaw به‌علاوه bundleهای سازگار Codex و bundleهای Claude را می‌پذیرد، از جمله bundleهای Claude با layout پیش‌فرض بدون manifest.
- **تغییرات پیکربندی به restart کردن gateway نیاز دارند.**
- `allow`: allowlist اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` اولویت دارد.
- `plugins.entries.<id>.apiKey`: فیلد میان‌بر کلید API در سطح Plugin (وقتی Plugin پشتیبانی کند).
- `plugins.entries.<id>.env`: نگاشت env var با دامنه Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، هسته `before_prompt_build` را مسدود می‌کند و فیلدهای تغییردهنده prompt از `before_agent_start` قدیمی را نادیده می‌گیرد، در حالی که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. برای hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط bundleهای پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیر-bundled مورد اعتماد می‌توانند محتوای خام مکالمه را از hookهای typed مانند `llm_input`، `llm_output`، `before_agent_finalize` و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به این Plugin صراحتا اعتماد کنید تا برای اجراهای subagent پس‌زمینه، overrideهای `provider` و `model` در هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist اختیاری از targetهای canonical به شکل `provider/model` برای overrideهای subagent مورد اعتماد. فقط وقتی از `"*"` استفاده کنید که عمدا می‌خواهید هر مدلی مجاز باشد.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (وقتی در دسترس باشد، توسط schema Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/runtime مربوط به Plugin کانال زیر `channels.<id>` قرار دارند و باید توسط فراداده `channelConfigs` در manifest Plugin مالک توصیف شوند، نه توسط registry مرکزی گزینه‌های OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: تنظیمات provider واکشی وب Firecrawl.
  - `apiKey`: کلید API مربوط به Firecrawl (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، `tools.web.fetch.firecrawl.apiKey` قدیمی، یا env var یعنی `FIRECRAWL_API_KEY` fallback می‌کند.
  - `baseUrl`: URL پایه API مربوط به Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای self-hosted باید endpointهای private/internal را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی را از صفحه‌ها استخراج کن (پیش‌فرض: `true`).
  - `maxAgeMs`: حداکثر سن cache بر حسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: timeout درخواست scrape بر حسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جست‌وجوی وب Grok).
  - `enabled`: provider X Search را فعال کن.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مثلا `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات Dreaming حافظه. برای phaseها و thresholdها [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: سوییچ اصلی Dreaming (پیش‌فرض `false`).
  - `frequency`: cadence مبتنی بر Cron برای هر sweep کامل Dreaming (به‌صورت پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent مربوط به Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن targetها با `allowedModels` همراه کنید. خطاهای دردسترس‌نبودن مدل یک بار با مدل پیش‌فرض نشست retry می‌شوند؛ شکست‌های trust یا allowlist به‌صورت خاموش fallback نمی‌کنند.
  - سیاست phase و thresholdها جزئیات پیاده‌سازی هستند (کلیدهای پیکربندی کاربرمحور نیستند).
- پیکربندی کامل حافظه در [Memory configuration reference](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای bundle شده Claude که فعال باشند می‌توانند پیش‌فرض‌های embedded Pi را هم از `settings.json` اضافه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات agent پالایش‌شده اعمال می‌کند، نه patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: id مربوط به Plugin حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه `"none"` را انتخاب کنید.
- `plugins.slots.contextEngine`: id مربوط به Plugin موتور context فعال را انتخاب کنید؛ مگر اینکه موتور دیگری نصب و انتخاب کنید، پیش‌فرض `"legacy"` است.

[Plugins](/fa/tools/plugin) را ببینید.

---

## تعهدها

`commitments` حافظه follow-up استنباط‌شده را کنترل می‌کند: OpenClaw می‌تواند check-inها را از turnهای مکالمه تشخیص دهد و آن‌ها را از طریق اجراهای Heartbeat تحویل دهد.

- `commitments.enabled`: استخراج پنهان LLM، ذخیره‌سازی، و تحویل Heartbeat را برای commitmentهای follow-up استنباط‌شده فعال کن. پیش‌فرض: `false`.
- `commitments.maxPerDay`: حداکثر commitmentهای follow-up استنباط‌شده که در یک روز rolling برای هر نشست agent تحویل داده می‌شوند. پیش‌فرض: `3`.

[Inferred commitments](/fa/concepts/commitments) را ببینید.

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
  نشست از سقف خود عبور کند، آزاد می‌کند. برای غیرفعال کردن هرکدام از حالت‌های
  پاک‌سازی جداگانه، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین پیمایش مرورگر به‌صورت پیش‌فرض سخت‌گیرانه می‌ماند.
- فقط زمانی `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید که عمداً به پیمایش مرورگر در شبکه‌ی خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقاط پایانی نمایه‌های CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترسی‌پذیری/کشف مشمول همان مسدودسازی شبکه‌ی خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- نمایه‌های راه‌دور فقط پیوست‌شدنی هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl` مقدارهای `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند از HTTP(S) استفاده کنید؛
  وقتی ارائه‌دهنده‌ی شما یک نشانی WebSocket مستقیم DevTools می‌دهد از WS(S) استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترسی‌پذیری CDP راه‌دور و
  `attachOnly` به‌همراه درخواست‌های باز کردن تب اعمال می‌شوند. نمایه‌های loopback
  مدیریت‌شده مقدارهای پیش‌فرض CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP مدیریت‌شده‌ی خارجی از طریق loopback در دسترس است، برای آن
  نمایه `attachOnly: true` را تنظیم کنید؛ وگرنه OpenClaw پورت loopback را به‌عنوان
  یک نمایه‌ی مرورگر مدیریت‌شده‌ی محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت پورت محلی گزارش کند.
- نمایه‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل پیوست شوند.
- نمایه‌های `existing-session` می‌توانند برای هدف‌گیری یک نمایه‌ی مرورگر مشخص مبتنی بر
  Chromium مانند Brave یا Edge، مقدار `userDataDir` را تنظیم کنند.
- نمایه‌های `existing-session` محدودیت‌های مسیر فعلی Chrome MCP را حفظ می‌کنند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری CSS-selector، قلاب‌های بارگذاری
  یک‌فایلی، نبود بازنویسی زمان‌انتظار دیالوگ، نبود `wait --load networkidle`، و نبود
  `responsebody`، خروجی PDF، رهگیری دانلود یا کنش‌های دسته‌ای.
- نمایه‌های `openclaw` مدیریت‌شده‌ی محلی به‌صورت خودکار `cdpPort` و `cdpUrl` را تخصیص می‌دهند؛ فقط
  برای CDP راه‌دور، `cdpUrl` را صریح تنظیم کنید.
- نمایه‌های مدیریت‌شده‌ی محلی می‌توانند برای بازنویسی مقدار سراسری
  `browser.executablePath` در همان نمایه، `executablePath` را تنظیم کنند. از این برای اجرای یک نمایه در
  Chrome و نمایه‌ای دیگر در Brave استفاده کنید.
- نمایه‌های مدیریت‌شده‌ی محلی از `browser.localLaunchTimeoutMs` برای کشف HTTP مربوط به Chrome CDP
  پس از شروع فرایند و از `browser.localCdpReadyTimeoutMs` برای آماده‌بودن websocket مربوط به CDP
  پس از راه‌اندازی استفاده می‌کنند. روی میزبان‌های کندتر که Chrome با موفقیت شروع می‌شود
  اما بررسی‌های آمادگی با راه‌اندازی رقابت می‌کنند، آن‌ها را افزایش دهید. هر دو مقدار باید
  عددهای صحیح مثبت تا `120000` ms باشند؛ مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را برای دایرکتوری خانه‌ی سیستم‌عامل شما، پیش از راه‌اندازی Chromium، می‌پذیرند.
  `userDataDir` در سطح هر نمایه برای نمایه‌های `existing-session` نیز با tilde گسترش داده می‌شود.
- سرویس کنترل: فقط loopback (پورت از `gateway.port` مشتق می‌شود، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های راه‌اندازی اضافی را به شروع محلی Chromium اضافه می‌کند (برای نمونه
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

- `seamColor`: رنگ تأکیدی برای کروم رابط کاربری برنامه‌ی بومی (رنگ حباب Talk Mode و مانند آن).
- `assistant`: بازنویسی هویت Control UI. در نبود آن، به هویت عامل فعال برمی‌گردد.

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

- `mode`:‏ `local` (اجرای Gateway) یا `remote` (اتصال به Gateway راه‌دور). Gateway از شروع به کار خودداری می‌کند مگر اینکه `local` باشد.
- `port`: پورت چندگانهٔ واحد برای WS + HTTP. اولویت: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`:‏ `auto`،‏ `loopback` (پیش‌فرض)،‏ `lan` (`0.0.0.0`)،‏ `tailnet` (فقط IP مربوط به Tailscale)، یا `custom`.
- **نام‌های مستعار قدیمی bind**: در `gateway.bind` از مقادیر حالت bind (`auto`،‏ `loopback`،‏ `lan`،‏ `tailnet`،‏ `custom`) استفاده کنید، نه نام‌های مستعار میزبان (`0.0.0.0`،‏ `127.0.0.1`،‏ `localhost`،‏ `::`،‏ `::1`).
- **یادداشت Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکهٔ پل Docker (`-p 18789:18789`)، ترافیک از `eth0` وارد می‌شود، پس Gateway دسترس‌پذیر نیست. از `--network host` استفاده کنید، یا `bind: "lan"` (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) را تنظیم کنید تا روی همهٔ واسط‌ها گوش دهد.
- **احراز هویت**: به‌صورت پیش‌فرض الزامی است. bindهای غیر loopback به احراز هویت Gateway نیاز دارند. در عمل یعنی یک توکن/گذرواژهٔ مشترک یا یک پراکسی معکوس آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. جادوگر آغازبه‌کار به‌صورت پیش‌فرض یک توکن تولید می‌کند.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefها)، `gateway.auth.mode` را صراحتا روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، جریان‌های شروع به کار و نصب/تعمیر سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای راه‌اندازی‌های مورد اعتماد local loopback استفاده کنید؛ این گزینه عمدا در اعلان‌های آغازبه‌کار ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک پراکسی معکوس آگاه از هویت واگذار کنید و به سرآیندهای هویت از `gateway.trustedProxies` اعتماد کنید (نگاه کنید به [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)). این حالت به‌صورت پیش‌فرض یک منبع پراکسی **غیر loopback** انتظار دارد؛ پراکسی‌های معکوس loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان جایگزین مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار و انحصاری است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، سرآیندهای هویت Tailscale Serve می‌توانند احراز هویت رابط کاربری کنترل/WebSocket را برآورده کنند (از طریق `tailscale whois` تأیید می‌شود). نقاط پایانی API HTTP از آن احراز هویت سرآیند Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت عادی احراز هویت HTTP Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway مورد اعتماد است. وقتی `tailscale.mode = "serve"` باشد، پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکنندهٔ اختیاری احراز هویت ناموفق. به‌ازای هر IP کلاینت و به‌ازای هر دامنهٔ احراز هویت اعمال می‌شود (shared-secret و device-token جداگانه ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر ناهمگام رابط کاربری کنترل Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست به‌صورت سریالی انجام می‌شوند. بنابراین تلاش‌های بد هم‌زمان از همان کلاینت می‌توانند در درخواست دوم محدودکننده را فعال کنند، به‌جای اینکه هر دو به‌صورت رقابتی فقط به‌عنوان عدم‌تطابق ساده عبور کنند.
  - `gateway.auth.rateLimit.exemptLoopback` به‌صورت پیش‌فرض `true` است؛ وقتی عمدا می‌خواهید ترافیک localhost هم محدودسازی نرخ شود (برای راه‌اندازی‌های تست یا استقرارهای پراکسی سخت‌گیرانه)، آن را `false` تنظیم کنید.
- تلاش‌های احراز هویت WS با منشأ مرورگر همیشه با معافیت loopback غیرفعال محدودسازی می‌شوند (دفاع عمقی در برابر brute force روی localhost از طریق مرورگر).
- روی loopback، آن قفل‌شدن‌های منشأ مرورگر به‌ازای مقدار نرمال‌سازی‌شدهٔ `Origin`
  جدا می‌شوند، بنابراین شکست‌های تکراری از یک منشأ localhost به‌طور خودکار
  منشأ دیگری را قفل نمی‌کند.
- `tailscale.mode`:‏ `serve` (فقط tailnet، bind به loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `controlUi.allowedOrigins`: فهرست مجاز صریح منشأهای مرورگر برای اتصال‌های WebSocket به Gateway. وقتی انتظار می‌رود کلاینت‌های مرورگر از منشأهای غیر loopback باشند، الزامی است.
- `controlUi.chatMessageMaxWidth`: بیشینه‌عرض اختیاری برای پیام‌های چت گروه‌بندی‌شدهٔ رابط کاربری کنترل. مقادیر عرض CSS محدودشده مانند `960px`،‏ `82%`،‏ `min(1280px, 82%)` و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناک که fallback منشأ مبتنی بر سرآیند Host را برای استقرارهایی فعال می‌کند که عمدا به سیاست منشأ سرآیند Host متکی هستند.
- `remote.transport`:‏ `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، `remote.url` باید `ws://` یا `wss://` باشد.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: جایگزین اضطراری محیط فرایند در سمت کلاینت
  که اجازه می‌دهد `ws://` متن‌ساده به IPهای مورد اعتماد شبکهٔ خصوصی برقرار شود؛
  پیش‌فرض برای متن‌ساده همچنان فقط loopback است. معادل `openclaw.json`
  وجود ندارد، و پیکربندی شبکهٔ خصوصی مرورگر مانند
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` روی کلاینت‌های WebSocket
  Gateway اثر نمی‌گذارد.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامهٔ کلاینت راه‌دور هستند. آن‌ها به‌تنهایی احراز هویت Gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: نشانی پایهٔ HTTPS برای relay خارجی APNs که buildهای رسمی/TestFlight iOS پس از انتشار ثبت‌نام‌های پشتیبانی‌شده با relay در Gateway از آن استفاده می‌کنند. این URL باید با URL مربوط به relay که در build iOS کامپایل شده است مطابقت داشته باشد.
- `gateway.push.apns.relay.timeoutMs`: مهلت ارسال Gateway به relay بر حسب میلی‌ثانیه. پیش‌فرض `10000` است.
- ثبت‌نام‌های پشتیبانی‌شده با relay به یک هویت Gateway مشخص واگذار می‌شوند. برنامهٔ iOS جفت‌شده `gateway.identity.get` را دریافت می‌کند، آن هویت را در ثبت‌نام relay وارد می‌کند و یک مجوز ارسال با دامنهٔ همان ثبت‌نام را به Gateway فوروارد می‌کند. Gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: بازنویسی‌های موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه فرار فقط توسعه برای URLهای relay از نوع HTTP روی loopback. URLهای relay تولید باید روی HTTPS بمانند.
- `gateway.handshakeTimeoutMs`: مهلت handshake WebSocket پیش از احراز هویت Gateway بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد، اولویت دارد. روی میزبان‌های پربار یا کم‌توان که کلاینت‌های محلی می‌توانند در حالی وصل شوند که گرم‌شدن آغازین هنوز در حال پایدار شدن است، این مقدار را افزایش دهید.
- `gateway.channelHealthCheckMinutes`: بازهٔ پایش سلامت کانال بر حسب دقیقه. برای غیرفعال کردن سراسری راه‌اندازی‌های مجدد پایش سلامت، `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانهٔ سوکت کهنه بر حسب دقیقه. این مقدار را بزرگ‌تر یا برابر با `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: بیشینهٔ راه‌اندازی‌های مجدد پایش سلامت به‌ازای هر کانال/حساب در یک ساعت غلتان. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: انصراف در سطح کانال از راه‌اندازی‌های مجدد پایش سلامت، در حالی که پایشگر سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: بازنویسی در سطح حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر بازنویسی سطح کانال اولویت دارد.
- مسیرهای فراخوانی Gateway محلی فقط وقتی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و حل‌نشده باشد، حل‌کردن به‌صورت fail-closed شکست می‌خورد (بدون پوشاندن با fallback راه‌دور).
- `trustedProxies`: IPهای پراکسی معکوس که TLS را terminate می‌کنند یا سرآیندهای کلاینت فورواردشده را تزریق می‌کنند. فقط پراکسی‌هایی را فهرست کنید که کنترلشان می‌کنید. ورودی‌های loopback همچنان برای راه‌اندازی‌های پراکسی/تشخیص محلی روی همان میزبان معتبرند (برای مثال Tailscale Serve یا یک پراکسی معکوس محلی)، اما درخواست‌های loopback را واجد شرایط `gateway.auth.mode: "trusted-proxy"` نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، Gateway در صورت نبود `X-Forwarded-For`، `X-Real-IP` را می‌پذیرد. پیش‌فرض برای رفتار fail-closed، `false` است.
- `gateway.nodes.pairing.autoApproveCidrs`: فهرست مجاز اختیاری CIDR/IP برای تأیید خودکار جفت‌سازی نخستین‌بار دستگاه Node بدون scopeهای درخواستی. وقتی تنظیم نشده باشد غیرفعال است. این مورد جفت‌سازی اپراتور/مرورگر/رابط کاربری کنترل/WebChat را خودکار تأیید نمی‌کند، و ارتقاهای role، scope، metadata یا کلید عمومی را هم خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی سراسری allow/deny برای فرمان‌های اعلام‌شدهٔ Node پس از جفت‌سازی و ارزیابی فهرست مجاز پلتفرم. از `allowCommands` برای opt in به فرمان‌های خطرناک Node مانند `camera.snap`،‏ `camera.clip` و `screen.record` استفاده کنید؛ `denyCommands` فرمانی را حذف می‌کند حتی اگر پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل شود. پس از اینکه یک Node فهرست فرمان‌های اعلام‌شدهٔ خود را تغییر داد، جفت‌سازی آن دستگاه را رد و دوباره تأیید کنید تا Gateway snapshot فرمان به‌روزشده را ذخیره کند.
- `gateway.tools.deny`: نام ابزارهای اضافی که برای HTTP `POST /tools/invoke` مسدود می‌شوند (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام ابزارها را از فهرست deny پیش‌فرض HTTP حذف کنید.

</Accordion>

### نقاط پایانی سازگار با OpenAI

- تکمیل‌های چت: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- API پاسخ‌ها: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL در پاسخ‌ها:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    فهرست‌های مجاز خالی تنظیم‌نشده تلقی می‌شوند؛ برای غیرفعال کردن دریافت URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- سرآیند اختیاری سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای منشأهای HTTPS که کنترلشان می‌کنید تنظیم کنید؛ نگاه کنید به [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### جداسازی چندنمونه‌ای

چند Gateway را روی یک میزبان با پورت‌ها و دایرکتوری‌های وضعیت یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

پرچم‌های راحتی: `--dev` (از `~/.openclaw-dev` + پورت `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

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

- `enabled`: پایان‌دهی TLS را در listener مربوط به Gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده باشند، یک جفت cert/key خودامضاشدهٔ محلی را خودکار تولید می‌کند؛ فقط برای استفادهٔ محلی/توسعه.
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
  - `"off"`: ویرایش‌های زنده را نادیده بگیرید؛ تغییرات به راه‌اندازی مجدد صریح نیاز دارند.
  - `"restart"`: در هر تغییر پیکربندی همیشه فرایند Gateway را راه‌اندازی مجدد کنید.
  - `"hot"`: تغییرات را بدون راه‌اندازی مجدد، درون فرایند اعمال کنید.
  - `"hybrid"` (پیش‌فرض): ابتدا تلاش کنید hot reload انجام شود؛ در صورت نیاز به restart برگردید.
- `debounceMs`: پنجرهٔ debounce بر حسب میلی‌ثانیه پیش از اعمال تغییرات پیکربندی (عدد صحیح نامنفی).
- `deferralTimeoutMs`: بیشینهٔ زمان اختیاری بر حسب میلی‌ثانیه برای انتظار جهت عملیات‌های در حال انجام پیش از اجبار به راه‌اندازی مجدد. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای همچنان-درانتظار، `0` تنظیم کنید.

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

یادداشت‌های اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به یک `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید از `gateway.auth.token` **متفاوت** باشد؛ استفادهٔ دوباره از توکن Gateway رد می‌شود.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیرمسیر اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا preset از `sessionKey` قالبی استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این پذیرش صریح نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط وقتی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقادیر `sessionKey` نگاشت که با قالب render شده‌اند، به‌عنوان ورودی خارجی در نظر گرفته می‌شوند و آن‌ها هم به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="Mapping details">

- `match.path` با زیرمسیر بعد از `/hooks` مطابقت می‌دهد (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` با یک فیلد payload برای مسیرهای عمومی مطابقت می‌دهد.
- قالب‌هایی مانند `{{messages[0].subject}}` از payload خوانده می‌شوند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش hook برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و داخل `hooks.transformsDir` باقی بماند (مسیرهای مطلق و پیمایش مسیر رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های skill در workspace رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transforms مربوط به hooks منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک agent مشخص مسیریابی می‌کند؛ شناسه‌های ناشناخته به حالت پیش‌فرض fallback می‌کنند.
- `allowedAgentIds`: مسیریابی صریح را محدود می‌کند (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید session ثابت اختیاری برای اجرای hook agent بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای session نگاشت مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: allowlist اختیاری پیشوند برای مقادیر `sessionKey` صریح (درخواست + نگاشت)، مثلاً `["hook:"]`. وقتی هر نگاشت یا preset از `sessionKey` قالبی استفاده کند، این مورد الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ `channel` به‌صورت پیش‌فرض `last` است.
- `model` مدل LLM را برای این اجرای hook override می‌کند (اگر catalog مدل تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- preset داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر این مسیریابی به‌ازای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را محدود کنید تا با namespace مربوط به Gmail مطابقت داشته باشد، برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، preset را با یک `sessionKey` ایستا به‌جای پیش‌فرض قالبی override کنید.

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

- Gateway هنگام boot، در صورت پیکربندی، `gog gmail watch serve` را به‌طور خودکار شروع می‌کند. برای غیرفعال‌سازی، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
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

- HTML/CSS/JS قابل‌ویرایش توسط agent و A2UI را از طریق HTTP زیر پورت Gateway سرو می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- اتصال‌های غیر loopback: مسیرهای canvas به احراز هویت Gateway نیاز دارند (token/password/trusted-proxy)، همانند دیگر سطح‌های HTTP مربوط به Gateway.
- Node WebViews معمولاً headerهای احراز هویت را ارسال نمی‌کند؛ پس از paired و connected شدن یک Node، Gateway برای دسترسی به canvas/A2UI، URLهای قابلیت با scope همان Node را advertise می‌کند.
- URLهای قابلیت به session فعال WS همان Node بسته شده‌اند و خیلی زود منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت live-reload را در HTML سرو‌شده inject می‌کند.
- وقتی خالی باشد، `index.html` شروع‌کننده را خودکار ایجاد می‌کند.
- A2UI را نیز در `/__openclaw__/a2ui/` سرو می‌کند.
- تغییرات به restart کردن Gateway نیاز دارند.
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

- `minimal` (پیش‌فرض): `cliPath` + `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: شامل `cliPath` + `sshPort` می‌شود.
- hostname به‌صورت پیش‌فرض، اگر label معتبر DNS باشد، به hostname سیستم تنظیم می‌شود و در غیر این صورت به `openclaw` fallback می‌کند. با `OPENCLAW_MDNS_HOSTNAME` آن را override کنید.

### ناحیهٔ گسترده (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک zone تک‌پخشی DNS-SD را زیر `~/.openclaw/dns/` می‌نویسد. برای کشف بین شبکه‌ها، آن را با یک DNS server (CoreDNS توصیه می‌شود) + Tailscale split DNS همراه کنید.

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

- متغیرهای env درون‌خطی فقط وقتی اعمال می‌شوند که process env آن key را نداشته باشد.
- فایل‌های `.env`: فایل `.env` در CWD + `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را override نمی‌کنند).
- `shellEnv`: keyهای مورد انتظارِ missing را از profile پوستهٔ ورود شما import می‌کند.
- برای precedence کامل، [محیط](/fa/help/environment) را ببینید.

### جایگذاری متغیر env

در هر رشتهٔ config با `${VAR_NAME}` به متغیرهای env ارجاع دهید:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- فقط نام‌های uppercase مطابقت داده می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای missing/empty هنگام load شدن config خطا می‌دهند.
- برای یک `${VAR}` literal با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## اسرار

secret refها افزایشی هستند: مقادیر plaintext همچنان کار می‌کنند.

### `SecretRef`

از یک شکل object استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی id در `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id در `source: "file"`: اشاره‌گر JSON مطلق (برای مثال `"/providers/openai/apiKey"`)
- الگوی id در `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- idهای `source: "exec"` نباید segmentهای مسیر جداشده با slash شامل `.` یا `..` داشته باشند (برای مثال `a/../b` رد می‌شود)

### سطح credential پشتیبانی‌شده

- matrix canonical: [سطح Credential مربوط به SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای credential پشتیبانی‌شدهٔ `openclaw.json` را هدف می‌گیرد.
- refهای `auth-profiles.json` در resolution زمان اجرا و پوشش audit لحاظ می‌شوند.

### Config مربوط به providerهای secret

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

یادداشت‌ها:

- provider نوع `file` از `mode: "json"` و `mode: "singleValue"` پشتیبانی می‌کند (`id` در حالت singleValue باید `"value"` باشد).
- مسیرهای providerهای file و exec وقتی امکان verification مربوط به Windows ACL وجود ندارد، fail closed می‌شوند. `allowInsecurePath: true` را فقط برای مسیرهای trusted که قابل‌بررسی نیستند تنظیم کنید.
- provider نوع `exec` به یک مسیر مطلق برای `command` نیاز دارد و از payloadهای protocol روی stdin/stdout استفاده می‌کند.
- به‌صورت پیش‌فرض، مسیرهای command به‌شکل symlink رد می‌شوند. برای اجازه دادن به مسیرهای symlink در حالی که مسیر target حل‌شده اعتبارسنجی می‌شود، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی trusted-dir روی مسیر target حل‌شده اعمال می‌شود.
- محیط child مربوط به `exec` به‌صورت پیش‌فرض حداقلی است؛ متغیرهای موردنیاز را صریحاً با `passEnv` پاس بدهید.
- secret refها هنگام activation به یک snapshot درون‌حافظه‌ای resolve می‌شوند، سپس مسیرهای request فقط همان snapshot را می‌خوانند.
- فیلتر کردن active-surface هنگام activation اعمال می‌شود: refهای resolve‌نشده روی سطح‌های enabled باعث شکست startup/reload می‌شوند، در حالی که سطح‌های inactive با diagnostics رد می‌شوند.

---

## ذخیره‌سازی Auth

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

- profileهای به‌ازای هر agent در `<agentDir>/auth-profiles.json` ذخیره می‌شوند.
- `auth-profiles.json` از refهای سطح مقدار (`keyRef` برای `api_key`، `tokenRef` برای `token`) برای modeهای credential ایستا پشتیبانی می‌کند.
- mapهای flat قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` یک format زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را با یک backup با پسوند `.legacy-flat.*.bak` به profileهای canonical API-key با قالب `provider:default` بازنویسی می‌کند.
- profileهای حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از credentialهای auth-profile مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- credentialهای runtime ایستا از snapshotهای resolve‌شدهٔ درون‌حافظه‌ای می‌آیند؛ ورودی‌های قدیمی ایستای `auth.json` هنگام کشف scrub می‌شوند.
- importهای قدیمی OAuth از `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: تاخیر عقب‌نشینی پایه بر حسب ساعت، وقتی یک نمایه به‌دلیل خطاهای واقعی
  صورت‌حساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح صورت‌حساب
  همچنان می‌تواند حتی در پاسخ‌های `401`/`403` به اینجا برسد، اما تطبیق‌دهنده‌های متن
  مختص ارائه‌دهنده در محدوده همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای مثال OpenRouter
  `Key limit exceeded`). پیام‌های HTTP `402` قابل تلاش مجدد مربوط به پنجره مصرف یا
  سقف هزینه سازمان/فضای کاری، در عوض در مسیر `rate_limit`
  می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری به‌ازای هر ارائه‌دهنده برای ساعت‌های عقب‌نشینی صورت‌حساب.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی عقب‌نشینی صورت‌حساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: عقب‌نشینی پایه بر حسب دقیقه برای شکست‌های با اطمینان بالای `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد عقب‌نشینی `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجره غلطان بر حسب ساعت که برای شمارنده‌های عقب‌نشینی استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: بیشینه چرخش‌های نمایه احراز هویت در همان ارائه‌دهنده برای خطاهای overloaded پیش از جابه‌جایی به fallback مدل (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` به اینجا می‌رسند.
- `overloadedBackoffMs`: تاخیر ثابت پیش از تلاش مجدد برای چرخش ارائه‌دهنده/نمایه overloaded (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: بیشینه چرخش‌های نمایه احراز هویت در همان ارائه‌دهنده برای خطاهای سقف نرخ، پیش از جابه‌جایی به fallback مدل (پیش‌فرض: `1`). آن سبد سقف نرخ شامل متن‌های شکل‌داده‌شده توسط ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، و `resource exhausted` است.

---

## ثبت لاگ

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

- فایل لاگ پیش‌فرض: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- برای یک مسیر پایدار، `logging.file` را تنظیم کنید.
- هنگام استفاده از `--verbose`، مقدار `consoleLevel` به `debug` افزایش می‌یابد.
- `maxFileBytes`: بیشینه اندازه فایل لاگ فعال بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 MB). OpenClaw تا پنج آرشیو شماره‌گذاری‌شده را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن best-effort برای خروجی کنسول، لاگ‌های فایل، رکوردهای لاگ OTLP، و متن پایدارشده رونوشت نشست. `redactSensitive: "off"` فقط این سیاست عمومی لاگ/رونوشت را غیرفعال می‌کند؛ سطوح ایمنی UI/ابزار/عیب‌یابی همچنان پیش از انتشار، رازها را redact می‌کنند.

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

- `enabled`: کلید اصلی برای خروجی instrumentation (پیش‌فرض: `true`).
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی لاگ هدفمند را فعال می‌کند (از wildcardهایی مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه برای طبقه‌بندی نشست‌های پردازش طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled`، یا `session.stuck`. پاسخ، ابزار، وضعیت، بلاک، و پیشرفت ACP تایمر را بازنشانی می‌کنند؛ عیب‌یابی‌های تکراری `session.stuck` تا زمانی که تغییری رخ ندهد عقب‌نشینی می‌کنند.
- `otel.enabled`: خط لوله export مربوط به OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، فهرست سیگنال‌ها، و مدل حریم خصوصی، [export مربوط به OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: URL گردآورنده برای export مربوط به OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpointهای اختیاری OTLP مختص سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای اضافی فراداده HTTP/gRPC که همراه درخواست‌های export مربوط به OTel ارسال می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های resource.
- `otel.traces` / `otel.metrics` / `otel.logs`: export مربوط به trace، metric، یا log را فعال می‌کند.
- `otel.sampleRate`: نرخ نمونه‌برداری trace از `0` تا `1`.
- `otel.flushIntervalMs`: فاصله flush دوره‌ای telemetry بر حسب میلی‌ثانیه.
- `otel.captureContent`: گرفتن محتوای خام به‌صورت opt-in برای ویژگی‌های span در OTEL. به‌طور پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را می‌گیرد؛ شکل شیء به شما اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs`، و `systemPrompt` را صراحتا فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای تازه‌ترین ویژگی‌های آزمایشی ارائه‌دهنده span مربوط به GenAI. به‌طور پیش‌فرض spanها برای سازگاری، ویژگی قدیمی `gen_ai.system` را نگه می‌دارند؛ metricهای GenAI از ویژگی‌های معنایی محدودشده استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از قبل یک SDK سراسری OpenTelemetry ثبت کرده‌اند. در این حالت OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را رد می‌کند و listenerهای عیب‌یابی را فعال نگه می‌دارد.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`، و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی endpoint مختص سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: snapshotهای trace کش را برای اجراهای embedded لاگ می‌کند (پیش‌فرض: `false`).
- `cacheTrace.filePath`: مسیر خروجی برای JSONL مربوط به trace کش (پیش‌فرض: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: کنترل می‌کند چه چیزهایی در خروجی trace کش گنجانده شود (همه به‌طور پیش‌فرض: `true`).

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
- `checkOnStart`: هنگام شروع gateway، به‌روزرسانی‌های npm را بررسی می‌کند (پیش‌فرض: `true`).
- `auto.enabled`: به‌روزرسانی خودکار پس‌زمینه را برای نصب‌های package فعال می‌کند (پیش‌فرض: `false`).
- `auto.stableDelayHours`: کمینه تاخیر بر حسب ساعت پیش از اعمال خودکار کانال stable (پیش‌فرض: `6`؛ بیشینه: `168`).
- `auto.stableJitterHours`: پنجره گسترش rollout اضافی کانال stable بر حسب ساعت (پیش‌فرض: `12`؛ بیشینه: `168`).
- `auto.betaCheckIntervalHours`: بسامد اجرای بررسی‌های کانال beta بر حسب ساعت (پیش‌فرض: `1`؛ بیشینه: `24`).

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

- `enabled`: gate سراسری قابلیت ACP (پیش‌فرض: `true`؛ برای پنهان‌کردن affordanceهای dispatch و spawn مربوط به ACP، آن را روی `false` بگذارید).
- `dispatch.enabled`: gate مستقل برای dispatch نوبت نشست ACP (پیش‌فرض: `true`). برای در دسترس نگه‌داشتن فرمان‌های ACP همراه با مسدودکردن اجرا، آن را روی `false` بگذارید.
- `backend`: شناسه backend زمان‌اجرای پیش‌فرض ACP (باید با یک Plugin زمان‌اجرای ACP ثبت‌شده مطابقت داشته باشد).
  ابتدا Plugin مربوط به backend را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسه Plugin مربوط به backend را شامل کنید (برای مثال `acpx`) وگرنه backend مربوط به ACP بارگذاری نمی‌شود.
- `defaultAgent`: شناسه agent هدف fallback مربوط به ACP وقتی spawnها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: allowlist شناسه‌های agent مجاز برای نشست‌های زمان‌اجرای ACP؛ خالی بودن یعنی محدودیت اضافه‌ای وجود ندارد.
- `maxConcurrentSessions`: بیشینه نشست‌های ACP فعال هم‌زمان.
- `stream.coalesceIdleMs`: پنجره flush هنگام بیکاری بر حسب میلی‌ثانیه برای متن streamed.
- `stream.maxChunkChars`: بیشینه اندازه chunk پیش از split کردن projection بلاک streamed.
- `stream.repeatSuppression`: خط‌های تکراری وضعیت/ابزار را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی stream می‌کند؛ `"final_only"` تا رویدادهای پایانی نوبت buffer می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل‌مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: بیشینه کاراکترهای خروجی assistant که در هر نوبت ACP project می‌شوند.
- `stream.maxSessionUpdateChars`: بیشینه کاراکترها برای خط‌های وضعیت/به‌روزرسانی ACP که project می‌شوند.
- `stream.tagVisibility`: رکوردی از نام tagها به بازنویسی‌های بولی visibility برای رویدادهای streamed.
- `runtime.ttlMinutes`: TTL بیکاری بر حسب دقیقه برای workerهای نشست ACP پیش از واجد شرایط شدن برای پاک‌سازی.
- `runtime.installCommand`: فرمان نصب اختیاری برای اجرا هنگام bootstrap کردن محیط زمان‌اجرای ACP.

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
  - `"random"` (پیش‌فرض): taglineهای بامزه/فصلی چرخشی.
  - `"default"`: tagline خنثای ثابت (`All your chats, one OpenClaw.`).
  - `"off"`: بدون متن tagline (عنوان/نسخه بنر همچنان نمایش داده می‌شود).
- برای پنهان‌کردن کل بنر (نه فقط taglineها)، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## راهنمای مرحله‌ای

فراداده‌ای که توسط جریان‌های setup هدایت‌شده CLI نوشته می‌شود (`onboard`، `configure`، `doctor`):

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

فیلدهای هویت `agents.list` را زیر [پیش‌فرض‌های agent](/fa/gateway/config-agents#agent-defaults) ببینید.

---

## پل (قدیمی، حذف‌شده)

بیلدهای فعلی دیگر شامل پل TCP نیستند. Nodeها از طریق WebSocket مربوط به Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از schema پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت نگه‌داری نشست‌های اجرای Cron ایزوله تکمیل‌شده پیش از pruning از `sessions.json`. همچنین پاک‌سازی رونوشت‌های Cron حذف‌شده آرشیوشده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال‌کردن روی `false` تنظیم کنید.
- `runLog.maxBytes`: بیشینه اندازه برای هر فایل لاگ اجرا (`cron/runs/<jobId>.jsonl`) پیش از pruning. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: تازه‌ترین خط‌هایی که هنگام فعال‌شدن pruning لاگ اجرا نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: bearer token استفاده‌شده برای تحویل POST مربوط به Cron Webhook (`delivery.mode = "webhook"`)، اگر حذف شود هیچ سرآیند auth ارسال نمی‌شود.
- `webhook`: URL Webhook fallback قدیمی و deprecated (http/https) که فقط برای jobهای ذخیره‌شده‌ای استفاده می‌شود که هنوز `notify: true` دارند.

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
- `backoffMs`: آرایه‌ای از تأخیرهای عقب‌نشینی بر حسب میلی‌ثانیه برای هر تلاش مجدد (پیش‌فرض: `[30000, 60000, 300000]`؛ ۱ تا ۱۰ ورودی).
- `retryOn`: انواع خطاهایی که باعث تلاش مجدد می‌شوند — `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش مجدد روی همه انواع گذرا، آن را حذف کنید.

فقط برای کارهای Cron یک‌باره اعمال می‌شود. کارهای تکرارشونده از مدیریت خرابی جداگانه استفاده می‌کنند.

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

- `enabled`: هشدارهای خرابی را برای کارهای Cron فعال می‌کند (پیش‌فرض: `false`).
- `after`: تعداد خرابی‌های پیاپی پیش از فعال شدن هشدار (عدد صحیح مثبت، حداقل: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: اجراهای ردشده پیاپی را در آستانه هشدار حساب می‌کند (پیش‌فرض: `false`). اجراهای ردشده جداگانه ردیابی می‌شوند و بر عقب‌نشینی خطاهای اجرا اثر نمی‌گذارند.
- `mode`: حالت تحویل — `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به Webhook پیکربندی‌شده ارسال می‌کند.
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

- مقصد پیش‌فرض برای اعلان‌های خرابی Cron در همه کارها.
- `mode`: `"announce"` یا `"webhook"`؛ وقتی داده هدف کافی وجود داشته باشد، پیش‌فرض `"announce"` است.
- `channel`: بازنویسی کانال برای تحویل announce. مقدار `"last"` از آخرین کانال تحویل شناخته‌شده دوباره استفاده می‌کند.
- `to`: هدف صریح announce یا URL Webhook. برای حالت Webhook الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- مقدار `delivery.failureDestination` مخصوص هر کار، این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد خرابی سراسری و نه مقصد خرابی مخصوص کار تنظیم نشده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌دهند، هنگام خرابی به همان هدف announce اصلی بازمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

به [کارهای Cron](/fa/automation/cron-jobs) مراجعه کنید. اجراهای Cron ایزوله به‌عنوان [وظایف پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای قالب مدل رسانه

جانگهدارهای قالب در `tools.media.models[].args` گسترش داده می‌شوند:

| متغیر           | توضیح                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | متن کامل پیام ورودی                         |
| `{{RawBody}}`      | متن خام (بدون پوشش‌های تاریخچه/فرستنده)             |
| `{{BodyStripped}}` | متن با حذف منشن‌های گروه                 |
| `{{From}}`         | شناسه فرستنده                                 |
| `{{To}}`           | شناسه مقصد                            |
| `{{MessageSid}}`   | شناسه پیام کانال                                |
| `{{SessionId}}`    | UUID نشست فعلی                              |
| `{{IsNewSession}}` | وقتی نشست جدید ایجاد شده باشد `"true"`                 |
| `{{MediaUrl}}`     | شبه‌URL رسانه ورودی                          |
| `{{MediaPath}}`    | مسیر رسانه محلی                                  |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)               |
| `{{Transcript}}`   | رونوشت صوتی                                  |
| `{{Prompt}}`       | پرامپت رسانه حل‌شده برای ورودی‌های CLI             |
| `{{MaxChars}}`     | حداکثر نویسه خروجی حل‌شده برای ورودی‌های CLI         |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (تا حد امکان)                       |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (تا حد امکان)               |
| `{{SenderName}}`   | نام نمایشی فرستنده (تا حد امکان)                 |
| `{{SenderE164}}`   | شماره تلفن فرستنده (تا حد امکان)                 |
| `{{Provider}}`     | راهنمای ارائه‌دهنده (WhatsApp، Telegram، Discord و غیره) |

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
- آرایه‌ای از فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شود (موارد بعدی، موارد قبلی را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از شامل‌سازی‌ها ادغام می‌شوند (مقادیر شامل‌شده را بازنویسی می‌کنند).
- شامل‌سازی‌های تو در تو: تا عمق ۱۰ سطح.
- مسیرها: نسبت به فایل شامل‌کننده حل می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا بمانند (`dirname` مربوط به `openclaw.json`). شکل‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل آن مرز حل شوند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح‌بالا با پشتوانه یک شامل‌سازی تک‌فایلی را تغییر می‌دهند، در همان فایل شامل‌شده نوشته می‌شوند. برای نمونه، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- شامل‌سازی‌های ریشه، آرایه‌های شامل‌سازی، و شامل‌سازی‌هایی با بازنویسی‌های هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط خواندنی هستند؛ این نوشتن‌ها به‌جای تخت‌کردن پیکربندی، بسته و ناموفق می‌شوند.
- خطاها: پیام‌های روشن برای فایل‌های گم‌شده، خطاهای تجزیه، و شامل‌سازی‌های چرخه‌ای.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

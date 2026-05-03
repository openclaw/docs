---
read_when:
    - به معناشناسی دقیق پیکربندی در سطح فیلد یا مقادیر پیش‌فرض نیاز دارید
    - در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای اصلی OpenClaw، پیش‌فرض‌ها و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-05-03T21:33:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52fa15e85a41ed5ed39102fb641bd33f0aec2e8f244c9d7b3d12b3a1b6dc62a9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی مبتنی بر کار، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و هرجا یک زیرسامانه مرجع عمیق‌تری برای خود داشته باشد، به آن پیوند می‌دهد. کاتالوگ‌های دستور متعلق به کانال‌ها و Pluginها و تنظیمات عمیق حافظه/QMD در صفحه‌های خودشان قرار دارند، نه در این صفحه.

حقیقت کد:

- `openclaw config schema` شمای JSON زنده‌ای را که برای اعتبارسنجی و Control UI استفاده می‌شود چاپ می‌کند، همراه با فراداده‌های بسته‌شده/Plugin/کانال که در صورت وجود ادغام شده‌اند
- `config.schema.lookup` یک گره شمای محدود به مسیر را برای ابزارهای بررسی جزئی برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش مبنای مستندات پیکربندی را در برابر سطح شمای فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی Agent: پیش از ویرایش، از کنش ابزار `gateway` یعنی `config.schema.lookup` برای
مستندات و محدودیت‌های دقیق در سطح فیلد استفاده کنید. برای راهنمایی مبتنی بر کار از
[پیکربندی](/fa/gateway/configuration) استفاده کنید و از این صفحه
برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها، و پیوند به مراجع زیرسامانه‌ها استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations`، و پیکربندی Dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [دستورهای اسلش](/fa/tools/slash-commands) برای کاتالوگ فعلی دستورهای داخلی + بسته‌شده
- صفحه‌های کانال/Plugin مالک برای سطوح دستور ویژه کانال

قالب پیکربندی **JSON5** است (کامنت‌ها + ویرگول‌های انتهایی مجازند). همه فیلدها اختیاری‌اند — OpenClaw وقتی فیلدی حذف شود از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به یک صفحه اختصاصی منتقل شده‌اند — برای `channels.*`،
از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و دیگر
کانال‌های بسته‌شده (احراز هویت، کنترل دسترسی، چندحسابی، دروازه‌گذاری اشاره)،
[پیکربندی — کانال‌ها](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های Agent، چند-Agent، نشست‌ها، و پیام‌ها

به یک صفحه اختصاصی منتقل شده است — برای موارد زیر
[پیکربندی — Agentها](/fa/gateway/config-agents) را ببینید:

- `agents.defaults.*` (workspace، مدل، thinking، heartbeat، حافظه، رسانه، Skills، sandbox)
- `multiAgent.*` (مسیریابی و bindingهای چند-Agent)
- `session.*` (چرخه عمر نشست، Compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر markdown)
- `talk.*` (حالت Talk)
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk در iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال transcript پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، toggleهای آزمایشی، پیکربندی ابزارهای مبتنی بر ارائه‌دهنده، و راه‌اندازی
ارائه‌دهنده سفارشی / base-URL به یک صفحه اختصاصی منتقل شده‌اند — 
[پیکربندی — ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools) را ببینید.

## مدل‌ها

تعریف‌های ارائه‌دهنده، allowlistهای مدل، و راه‌اندازی ارائه‌دهنده سفارشی در
[پیکربندی — ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند.
ریشه `models` همچنین مالک رفتار جهانی کاتالوگ مدل است.

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
- `models.pricing.enabled`: بوت‌استرپ قیمت‌گذاری پس‌زمینه را کنترل می‌کند که
  پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد،
  Gateway واکشی‌های کاتالوگ قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقادیر
  پیکربندی‌شده `models.providers.*.models[].cost` همچنان برای برآوردهای هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط
Pi جاسازی‌شده و دیگر adapterهای زمان اجرا مصرف می‌شوند. دستورهای `openclaw mcp list`،
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

- `mcp.servers`: تعریف‌های نام‌دار سرور MCP از نوع stdio یا remote برای runtimeهایی که
  ابزارهای MCP پیکربندی‌شده را در معرض استفاده قرار می‌دهند.
  ورودی‌های remote از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛
  `type: "http"` یک alias بومی CLI است که `openclaw mcp set` و
  `openclaw doctor --fix` آن را به فیلد canonical `transport` نرمال‌سازی می‌کنند.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای runtimeهای MCP بسته‌شده و محدود به نشست.
  اجرای‌های جاسازی‌شده یک‌باره، پاک‌سازی پایان اجرا را درخواست می‌کنند؛ این TTL پشتیبان
  نشست‌های بلندمدت و فراخواننده‌های آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP نشستِ cache‌شده به‌صورت hot-apply اعمال می‌شوند.
  کشف/استفاده بعدی از ابزار آن‌ها را از پیکربندی جدید دوباره ایجاد می‌کند، بنابراین ورودی‌های
  حذف‌شده `mcp.servers` به‌جای انتظار برای TTL بیکاری، بلافاصله جمع‌آوری می‌شوند.

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

- `allowBundled`: allowlist اختیاری فقط برای skillهای بسته‌شده (Skills مدیریت‌شده/workspace بدون تاثیر).
- `load.extraDirs`: ریشه‌های skill اشتراکی اضافی (کمترین تقدم).
- `install.preferBrew`: وقتی true باشد، در صورت در دسترس بودن `brew`،
  پیش از fallback به گونه‌های دیگر نصب‌کننده، نصب‌کننده‌های Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح نصب‌کننده node برای مشخصات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` یک skill را حتی اگر بسته‌شده/نصب‌شده باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میانبر برای skillهایی که یک env var اصلی اعلام می‌کنند (رشته plaintext یا شی SecretRef).

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
- کشف، Pluginهای بومی OpenClaw به‌علاوه بسته‌های سازگار Codex و بسته‌های Claude را می‌پذیرد، از جمله بسته‌های چیدمان پیش‌فرض Claude بدون manifest.
- **تغییرات پیکربندی به راه‌اندازی دوباره gateway نیاز دارند.**
- `allow`: allowlist اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` اولویت دارد.
- `plugins.entries.<id>.apiKey`: فیلد میانبر کلید API در سطح Plugin (وقتی توسط Plugin پشتیبانی شود).
- `plugins.entries.<id>.env`: نگاشت env var محدود به Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، هسته `before_prompt_build` را مسدود می‌کند و فیلدهای تغییر‌دهنده prompt از `before_agent_start` قدیمی را نادیده می‌گیرد، در حالی که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. روی hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط bundleهای پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیر بسته‌شده مورد اعتماد می‌توانند محتوای خام گفتگو را از hookهای typed مانند `llm_input`، `llm_output`، `before_agent_finalize`، و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌صراحت به این Plugin اعتماد می‌کند تا overrideهای `provider` و `model` در هر اجرا را برای اجرای‌های subagent پس‌زمینه درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist اختیاری از هدف‌های canonical `provider/model` برای overrideهای subagent مورد اعتماد. فقط وقتی از `"*"` استفاده کنید که عمدا می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.config`: شی پیکربندی تعریف‌شده توسط Plugin (در صورت وجود، با شمای Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/runtime Plugin کانال زیر `channels.<id>` قرار دارند و باید توسط فراداده `channelConfigs` در manifest Plugin مالک توصیف شوند، نه توسط رجیستری مرکزی گزینه‌های OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: تنظیمات ارائه‌دهنده web-fetch Firecrawl.
  - `apiKey`: کلید API Firecrawl (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، مقدار قدیمی `tools.web.fetch.firecrawl.apiKey`، یا env var `FIRECRAWL_API_KEY` fallback می‌کند.
  - `baseUrl`: URL پایه API Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای self-hosted باید endpointهای private/internal را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی را از صفحه‌ها استخراج می‌کند (پیش‌فرض: `true`).
  - `maxAgeMs`: حداکثر سن cache بر حسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: timeout درخواست scrape بر حسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جست‌وجوی وب Grok).
  - `enabled`: ارائه‌دهنده X Search را فعال می‌کند.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مثلا `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات memory dreaming. برای فازها و thresholdها [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: سوییچ اصلی dreaming (پیش‌فرض `false`).
  - `frequency`: cadence کرون برای هر sweep کامل dreaming (به‌طور پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent با نام Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن هدف‌ها با `allowedModels` همراه کنید. خطاهای model-unavailable یک بار با مدل پیش‌فرض نشست دوباره تلاش می‌شوند؛ خطاهای trust یا allowlist بی‌صدا fallback نمی‌کنند.
  - سیاست فاز و thresholdها جزئیات پیاده‌سازی هستند (کلیدهای پیکربندی قابل مشاهده برای کاربر نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای فعال‌شده بسته Claude می‌توانند پیش‌فرض‌های Pi جاسازی‌شده را نیز از `settings.json` ارائه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات agent پاک‌سازی‌شده اعمال می‌کند، نه patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه `"none"` را برگزینید.
- `plugins.slots.contextEngine`: شناسه Plugin موتور context فعال را انتخاب کنید؛ پیش‌فرض `"legacy"` است مگر اینکه موتور دیگری را نصب و انتخاب کنید.

[Pluginها](/fa/tools/plugin) را ببینید.

---

## تعهدها

`commitments` حافظه پیگیری inferred را کنترل می‌کند: OpenClaw می‌تواند check-inها را از نوبت‌های گفتگو تشخیص دهد و آن‌ها را از طریق اجرای‌های heartbeat تحویل دهد.

- `commitments.enabled`: استخراج پنهان LLM، ذخیره‌سازی، و تحویل heartbeat را برای تعهدهای پیگیری inferred فعال می‌کند. پیش‌فرض: `false`.
- `commitments.maxPerDay`: حداکثر تعهدهای پیگیری inferred که در یک روز rolling برای هر نشست agent تحویل داده می‌شوند. پیش‌فرض: `3`.

[تعهدهای inferred](/fa/concepts/commitments) را ببینید.

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
  نشست از سقف خود فراتر می‌رود، آزاد می‌کند. برای غیرفعال کردن هرکدام از این
  حالت‌های پاک‌سازی، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین پیمایش مرورگر به‌صورت پیش‌فرض سخت‌گیرانه می‌ماند.
- فقط وقتی عمداً به پیمایش مرورگر در شبکه‌ی خصوصی اعتماد دارید، `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید.
- در حالت سخت‌گیرانه، نقاط پایانی پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترس‌پذیری/کشف، مشمول همان مسدودسازی شبکه‌ی خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- پروفایل‌های راه‌دور فقط برای اتصال هستند (start/stop/reset غیرفعال است).
- `profiles.*.cdpUrl` مقدارهای `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند از HTTP(S) استفاده کنید؛
  وقتی ارائه‌دهنده‌ی شما یک URL مستقیم DevTools WebSocket می‌دهد از WS(S) استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترس‌پذیری CDP راه‌دور و
  `attachOnly` به‌علاوه‌ی درخواست‌های باز کردن زبانه اعمال می‌شوند. پروفایل‌های
  loopback مدیریت‌شده، پیش‌فرض‌های CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP با مدیریت خارجی از طریق loopback در دسترس است، برای آن
  پروفایل `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw درگاه loopback را به‌عنوان یک
  پروفایل مرورگر محلی مدیریت‌شده در نظر می‌گیرد و ممکن است خطاهای مالکیت درگاه محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل، متصل شوند.
- پروفایل‌های `existing-session` می‌توانند `userDataDir` را برای هدف‌گیری یک
  پروفایل مرورگر مبتنی بر Chromium مشخص، مانند Brave یا Edge، تنظیم کنند.
- پروفایل‌های `existing-session` محدودیت‌های فعلی مسیر Chrome MCP را نگه می‌دارند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری با گزینشگر CSS، قلاب‌های بارگذاری یک‌فایلی،
  نبود بازنویسی مهلت گفت‌وگو، نبود `wait --load networkidle`، و نبود
  `responsebody`، خروجی PDF، رهگیری دانلود یا کنش‌های دسته‌ای.
- پروفایل‌های `openclaw` محلی مدیریت‌شده، `cdpPort` و `cdpUrl` را به‌صورت خودکار اختصاص می‌دهند؛
  فقط برای CDP راه‌دور، `cdpUrl` را صریح تنظیم کنید.
- پروفایل‌های محلی مدیریت‌شده می‌توانند `executablePath` را تنظیم کنند تا
  `browser.executablePath` سراسری را برای آن پروفایل بازنویسی کنند. از این برای اجرای یک پروفایل در
  Chrome و پروفایلی دیگر در Brave استفاده کنید.
- پروفایل‌های محلی مدیریت‌شده برای کشف HTTP مربوط به Chrome CDP پس از شروع فرایند از `browser.localLaunchTimeoutMs`
  و برای آمادگی websocket مربوط به CDP پس از راه‌اندازی از `browser.localCdpReadyTimeoutMs` استفاده می‌کنند.
  روی میزبان‌های کندتر که Chrome با موفقیت شروع می‌شود اما بررسی‌های آمادگی با شروع رقابت می‌کنند، این مقادیر را افزایش دهید.
  هر دو مقدار باید عدد صحیح مثبت تا `120000` ms باشند؛ مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را برای پوشه‌ی خانه‌ی سیستم‌عامل شما پیش از راه‌اندازی Chromium می‌پذیرند.
  `userDataDir` هر پروفایل در پروفایل‌های `existing-session` نیز با tilde گسترش می‌یابد.
- سرویس کنترل: فقط loopback (درگاه برگرفته از `gateway.port`، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های راه‌اندازی اضافی را به شروع محلی Chromium اضافه می‌کند (برای مثال
  `--disable-gpu`، اندازه‌گذاری پنجره، یا پرچم‌های اشکال‌زدایی).

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

- `seamColor`: رنگ تأکیدی برای پوسته‌ی UI برنامه‌ی بومی (رنگ حباب Talk Mode و مانند آن).
- `assistant`: بازنویسی هویت Control UI. در نبود آن، به هویت عامل فعال بازمی‌گردد.

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

<Accordion title="Gateway field details">

- `mode`: `local` (اجرای Gateway) یا `remote` (اتصال به Gateway راه‌دور). Gateway از شروع به کار خودداری می‌کند مگر اینکه `local` باشد.
- `port`: پورت واحد و چندمنظوره برای WS + HTTP. اولویت: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP ‏Tailscale)، یا `custom`.
- **نام‌های مستعار bind قدیمی**: در `gateway.bind` از مقدارهای حالت bind استفاده کنید (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، نه نام‌های مستعار میزبان (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **یادداشت Docker**: مقدار پیش‌فرض `loopback` روی `127.0.0.1` داخل کانتینر گوش می‌دهد. با شبکه‌بندی bridge در Docker (`-p 18789:18789`)، ترافیک روی `eth0` می‌رسد، بنابراین Gateway قابل دسترسی نیست. از `--network host` استفاده کنید، یا `bind: "lan"` (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) را تنظیم کنید تا روی همه رابط‌ها گوش دهد.
- **احراز هویت**: به‌طور پیش‌فرض الزامی است. bindهای غیر loopback به احراز هویت Gateway نیاز دارند. در عمل یعنی یک توکن/گذرواژه مشترک یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. جادوگر راه‌اندازی به‌طور پیش‌فرض یک توکن تولید می‌کند.
- اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefs)، `gateway.auth.mode` را صراحتا روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، جریان‌های شروع به کار و نصب/تعمیر سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای راه‌اندازی‌های local loopback مورد اعتماد استفاده کنید؛ این گزینه عمدا در اعلان‌های راه‌اندازی ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک reverse proxy آگاه از هویت واگذار می‌کند و به هدرهای هویتی از `gateway.trustedProxies` اعتماد می‌کند (نگاه کنید به [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)). این حالت به‌طور پیش‌فرض انتظار یک منبع پراکسی **غیر loopback** را دارد؛ reverse proxyهای loopback روی همان میزبان به تنظیم صریح `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند. فراخوان‌های داخلی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان fallback مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار و متقابلا انحصاری است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، هدرهای هویت Tailscale Serve می‌توانند احراز هویت Control UI/WebSocket را برآورده کنند (از طریق `tailscale whois` تأیید می‌شود). نقاط پایانی HTTP API از آن احراز هویت هدر Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت عادی احراز هویت HTTP خود Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway مورد اعتماد است. وقتی `tailscale.mode = "serve"` باشد، مقدار پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکننده اختیاری شکست احراز هویت. برای هر IP مشتری و هر دامنه احراز هویت اعمال می‌شود (shared-secret و device-token جداگانه ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر async ‏Tailscale Serve ‏Control UI، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست، سریالی می‌شوند. بنابراین تلاش‌های بد هم‌زمان از همان مشتری می‌توانند به‌جای اینکه هر دو مانند عدم‌تطابق ساده هم‌زمان عبور کنند، در درخواست دوم محدودکننده را فعال کنند.
  - مقدار پیش‌فرض `gateway.auth.rateLimit.exemptLoopback` برابر `true` است؛ وقتی عمدا می‌خواهید ترافیک localhost نیز محدودسازی نرخ شود (برای راه‌اندازی‌های آزمایشی یا استقرارهای strict proxy)، آن را روی `false` تنظیم کنید.
- تلاش‌های احراز هویت WS با مبدا مرورگر همیشه با غیرفعال بودن معافیت loopback محدودسازی می‌شوند (دفاع چندلایه در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، آن قفل‌شدن‌های با مبدا مرورگر برای هر مقدار نرمال‌شده `Origin`
  جدا می‌شوند، بنابراین شکست‌های تکراری از یک مبدا localhost به‌طور خودکار
  مبدا دیگری را قفل نمی‌کند.
- `tailscale.mode`: `serve` (فقط tailnet، bind به loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `controlUi.allowedOrigins`: فهرست مجاز صریح برای مبدا مرورگر جهت اتصال‌های WebSocket به Gateway. وقتی انتظار می‌رود مشتریان مرورگر از مبداهای غیر loopback باشند، الزامی است.
- `controlUi.chatMessageMaxWidth`: حداکثر عرض اختیاری برای پیام‌های چت گروه‌بندی‌شده Control UI. مقدارهای عرض CSS محدودشده مانند `960px`، `82%`، `min(1280px, 82%)` و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناک که fallback مبدا Host-header را برای استقرارهایی فعال می‌کند که عمدا به سیاست مبدا Host-header متکی هستند.
- `remote.transport`: `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، مقدار `remote.url` باید `ws://` یا `wss://` باشد.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override اضطراری در محیط فرایند سمت مشتری
  که `ws://` متن ساده را به IPهای شبکه خصوصی مورد اعتماد مجاز می‌کند؛ مقدار پیش‌فرض برای متن ساده همچنان فقط loopback است. معادل `openclaw.json`
  وجود ندارد، و پیکربندی شبکه خصوصی مرورگر مانند
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` روی مشتریان WebSocket ‏Gateway
  اثری ندارد.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامه مشتری راه‌دور هستند. آن‌ها به‌تنهایی احراز هویت Gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: URL پایه HTTPS برای relay خارجی APNs که buildهای رسمی/TestFlight ‏iOS پس از انتشار ثبت‌نام‌های متکی بر relay به Gateway از آن استفاده می‌کنند. این URL باید با URL ‏relay که در build ‏iOS کامپایل شده است مطابقت داشته باشد.
- `gateway.push.apns.relay.timeoutMs`: زمان‌سنج ارسال از Gateway به relay بر حسب میلی‌ثانیه. مقدار پیش‌فرض `10000` است.
- ثبت‌نام‌های متکی بر relay به یک هویت Gateway مشخص واگذار می‌شوند. برنامه iOS جفت‌شده `gateway.identity.get` را دریافت می‌کند، آن هویت را در ثبت‌نام relay قرار می‌دهد، و یک مجوز ارسال در محدوده ثبت‌نام را به Gateway ارسال می‌کند. Gateway دیگری نمی‌تواند آن ثبت‌نام ذخیره‌شده را دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه گریز فقط مخصوص توسعه برای URLهای relay ‏HTTP روی loopback. URLهای relay تولیدی باید روی HTTPS بمانند.
- `gateway.handshakeTimeoutMs`: زمان‌سنج handshake پیش از احراز هویت WebSocket ‏Gateway بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد اولویت دارد. این مقدار را روی میزبان‌های پرترافیک یا کم‌توان که مشتریان محلی می‌توانند در حالی که گرم‌کردن شروع به کار هنوز در حال پایدار شدن است وصل شوند، افزایش دهید.
- `gateway.channelHealthCheckMinutes`: بازه health-monitor کانال بر حسب دقیقه. برای غیرفعال کردن restartهای health-monitor در سطح سراسری، `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانه stale-socket بر حسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: بیشینه restartهای health-monitor برای هر کانال/حساب در یک ساعت rolling. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: انصراف در سطح هر کانال از restartهای health-monitor در حالی که مانیتور سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override در سطح هر حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر override سطح کانال اولویت دارد.
- مسیرهای فراخوانی Gateway محلی فقط وقتی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و unresolved باشد، resolve به‌شکل بسته و امن شکست می‌خورد (بدون پوشاندن با fallback راه‌دور).
- `trustedProxies`: IPهای reverse proxy که TLS را terminate می‌کنند یا هدرهای forwarded-client تزریق می‌کنند. فقط پراکسی‌هایی را فهرست کنید که کنترلشان می‌کنید. ورودی‌های loopback همچنان برای راه‌اندازی‌های proxy/local-detection روی همان میزبان معتبرند (برای مثال Tailscale Serve یا یک reverse proxy محلی)، اما درخواست‌های loopback را واجد شرایط `gateway.auth.mode: "trusted-proxy"` نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` وجود نداشته باشد Gateway مقدار `X-Real-IP` را می‌پذیرد. مقدار پیش‌فرض `false` است تا رفتار fail-closed حفظ شود.
- `gateway.nodes.pairing.autoApproveCidrs`: فهرست مجاز CIDR/IP اختیاری برای تأیید خودکار جفت‌سازی نخستین‌بار دستگاه node بدون scopeهای درخواست‌شده. وقتی تنظیم نشده باشد غیرفعال است. این مورد جفت‌سازی operator/browser/Control UI/WebChat را خودکار تأیید نمی‌کند، و ارتقاهای role، scope، metadata یا public-key را نیز خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی سراسری allow/deny برای فرمان‌های اعلام‌شده node پس از جفت‌سازی و ارزیابی فهرست مجاز platform. از `allowCommands` برای انتخاب صریح فرمان‌های خطرناک node مانند `camera.snap`، `camera.clip` و `screen.record` استفاده کنید؛ `denyCommands` حتی اگر پیش‌فرض platform یا allow صریح در حالت عادی فرمانی را شامل شود، آن فرمان را حذف می‌کند. پس از اینکه یک node فهرست فرمان‌های اعلام‌شده خود را تغییر داد، آن جفت‌سازی دستگاه را رد و دوباره تأیید کنید تا Gateway snapshot فرمان به‌روزشده را ذخیره کند.
- `gateway.tools.deny`: نام ابزارهای اضافی مسدودشده برای HTTP `POST /tools/invoke` (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام ابزارها را از فهرست deny پیش‌فرض HTTP حذف می‌کند.

</Accordion>

### نقاط پایانی سازگار با OpenAI

- Chat Completions: به‌طور پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL در Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    فهرست‌های مجاز خالی مانند تنظیم‌نشده در نظر گرفته می‌شوند؛ برای غیرفعال کردن دریافت URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- هدر اختیاری سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای مبداهای HTTPS که کنترلشان می‌کنید تنظیم کنید؛ نگاه کنید به [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### جداسازی چندنمونه‌ای

چند Gateway را روی یک میزبان با پورت‌ها و دایرکتوری‌های state یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

پرچم‌های کمکی: `--dev` (از `~/.openclaw-dev` + پورت `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

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

- `enabled`: TLS termination را روی listener ‏Gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده باشند، یک جفت گواهی/کلید self-signed محلی را خودکار تولید می‌کند؛ فقط برای استفاده محلی/dev.
- `certPath`: مسیر فایل‌سیستم به فایل گواهی TLS.
- `keyPath`: مسیر فایل‌سیستم به فایل کلید خصوصی TLS؛ دسترسی آن را محدود نگه دارید.
- `caPath`: مسیر اختیاری bundle ‏CA برای تأیید مشتری یا زنجیره‌های trust سفارشی.

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
  - `"off"`: ویرایش‌های زنده را نادیده بگیر؛ تغییرات به restart صریح نیاز دارند.
  - `"restart"`: همیشه فرایند Gateway را هنگام تغییر پیکربندی restart کن.
  - `"hot"`: تغییرات را بدون restart در همان فرایند اعمال کن.
  - `"hybrid"` (پیش‌فرض): ابتدا hot reload را امتحان کن؛ اگر لازم بود به restart برگرد.
- `debounceMs`: پنجره debounce بر حسب ms پیش از اعمال تغییرات پیکربندی (عدد صحیح نامنفی).
- `deferralTimeoutMs`: حداکثر زمان اختیاری بر حسب ms برای انتظار عملیات‌های در جریان پیش از اجبار به restart. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای still-pending، `0` تنظیم کنید.

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
- `hooks.token` باید با `gateway.auth.token` **متفاوت** باشد؛ استفادهٔ دوباره از توکن Gateway رد می‌شود.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیرمسیر اختصاصی مثل `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید، برای مثال `["hook:"]`.
- اگر یک نگاشت یا preset از `sessionKey` قالب‌دار استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این opt-in نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط وقتی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` resolve می‌شود
  - مقادیر `sessionKey` در نگاشت که با template رندر شده‌اند، به‌عنوان دادهٔ خارجی در نظر گرفته می‌شوند و آن‌ها هم به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="Mapping details">

- `match.path` با زیرمسیر پس از `/hooks` مطابقت می‌دهد (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` با یک فیلد payload برای مسیرهای generic مطابقت می‌دهد.
- templateهایی مثل `{{messages[0].subject}}` از payload خوانده می‌شوند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش hook برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و داخل `hooks.transformsDir` باقی بماند (مسیرهای مطلق و traversal رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های skill در workspace رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transforms مربوط به hooks منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک agent مشخص route می‌کند؛ شناسه‌های ناشناخته به مقدار پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: route کردن صریح را محدود می‌کند (`*` یا حذف‌شده = همه مجاز، `[]` = همه رد).
- `defaultSessionKey`: کلید session ثابت اختیاری برای اجرای agent مربوط به hook بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای session نگاشت template-driven اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: allowlist پیشوند اختیاری برای مقادیر صریح `sessionKey` (درخواست + نگاشت)، مثلاً `["hook:"]`. وقتی هر نگاشت یا preset از `sessionKey` قالب‌دار استفاده کند، این مورد الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک channel می‌فرستد؛ مقدار پیش‌فرض `channel` برابر `last` است.
- `model` برای این اجرای hook، LLM را override می‌کند (اگر model catalog تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- preset داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر این route کردن به‌ازای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را به namespace مربوط به Gmail محدود کنید، برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، preset را با یک `sessionKey` ایستا به‌جای پیش‌فرض قالب‌دار override کنید.

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

- Gateway هنگام boot، وقتی پیکربندی شده باشد، `gog gmail watch serve` را به‌صورت خودکار شروع می‌کند. برای غیرفعال کردن، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
- یک `gog gmail watch serve` جداگانه را در کنار Gateway اجرا نکنید.

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

- HTML/CSS/JS قابل ویرایش توسط agent و A2UI را روی HTTP زیر پورت Gateway سرو می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- bindهای غیر loopback: مسیرهای canvas مانند سایر سطوح HTTP مربوط به Gateway به احراز هویت Gateway نیاز دارند (token/password/trusted-proxy).
- WebViewهای Node معمولاً headerهای احراز هویت نمی‌فرستند؛ پس از pair و connected شدن یک node، Gateway برای دسترسی canvas/A2UI، URLهای capability محدود به node را تبلیغ می‌کند.
- URLهای capability به session فعال WS مربوط به node متصل‌اند و سریع منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت live-reload را به HTML سرو‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را خودکار ایجاد می‌کند.
- همچنین A2UI را در `/__openclaw__/a2ui/` سرو می‌کند.
- تغییرات به restart کردن gateway نیاز دارند.
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
- `full`: `cliPath` + `sshPort` را شامل می‌شود؛ تبلیغ multicast در LAN همچنان نیاز دارد Plugin بسته‌بندی‌شدهٔ `bonjour` فعال باشد.
- `off`: تبلیغ multicast در LAN را بدون تغییر فعال‌بودن Plugin سرکوب می‌کند.
- Plugin بسته‌بندی‌شدهٔ `bonjour` روی میزبان‌های macOS خودکار شروع می‌شود و روی Linux، Windows، و استقرارهای Gateway کانتینری opt-in است.
- نام میزبان وقتی یک برچسب DNS معتبر باشد، به‌صورت پیش‌فرض همان نام میزبان سیستم است و در غیر این صورت به `openclaw` fallback می‌کند. با `OPENCLAW_MDNS_HOSTNAME` override کنید.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک zone مربوط به unicast DNS-SD را زیر `~/.openclaw/dns/` می‌نویسد. برای کشف cross-network، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + split DNS در Tailscale همراه کنید.

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

- متغیرهای محیطی درون‌خطی فقط زمانی اعمال می‌شوند که محیط فرایند آن کلید را نداشته باشد.
- فایل‌های `.env`: فایل `.env` در CWD + فایل `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
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

- فقط نام‌های حروف بزرگ مطابق می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای موجودنبودن/خالی هنگام بارگذاری پیکربندی خطا ایجاد می‌کنند.
- برای مقدار تحت‌اللفظی `${VAR}` با `$${VAR}` فرار دهید.
- با `$include` کار می‌کند.

---

## اسرار

ارجاع‌های راز افزایشی هستند: مقادیر متن ساده همچنان کار می‌کنند.

### `SecretRef`

از یک شکل شیء استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی شناسه `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- شناسه `source: "file"`: اشاره‌گر مطلق JSON (برای مثال `"/providers/openai/apiKey"`)
- الگوی شناسه `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- شناسه‌های `source: "exec"` نباید شامل بخش‌های مسیر جداشده با اسلش `.` یا `..` باشند (برای مثال `a/../b` رد می‌شود)

### سطح اعتبارنامه پشتیبانی‌شده

- ماتریس مرجع: [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)
- هدف‌های `secrets apply` مسیرهای اعتبارنامه پشتیبانی‌شده `openclaw.json` هستند.
- ارجاع‌های `auth-profiles.json` در حل‌وفصل زمان اجرا و پوشش حسابرسی گنجانده شده‌اند.

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
- مسیرهای ارائه‌دهنده فایل و exec وقتی راستی‌آزمایی ACL در Windows در دسترس نباشد بسته شکست می‌خورند. `allowInsecurePath: true` را فقط برای مسیرهای مورد اعتمادی تنظیم کنید که قابل راستی‌آزمایی نیستند.
- ارائه‌دهنده `exec` به مسیر مطلق `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌صورت پیش‌فرض، مسیرهای فرمان symlink رد می‌شوند. برای مجازکردن مسیرهای symlink همراه با اعتبارسنجی مسیر هدف حل‌شده، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی دایرکتوری مورد اعتماد روی مسیر هدف حل‌شده اعمال می‌شود.
- محیط فرزند `exec` به‌صورت پیش‌فرض حداقلی است؛ متغیرهای لازم را صریحا با `passEnv` عبور دهید.
- ارجاع‌های راز در زمان فعال‌سازی به یک snapshot درون‌حافظه‌ای حل می‌شوند، سپس مسیرهای درخواست فقط snapshot را می‌خوانند.
- فیلترکردن سطح فعال هنگام فعال‌سازی اعمال می‌شود: ارجاع‌های حل‌نشده روی سطح‌های فعال باعث شکست راه‌اندازی/بارگذاری دوباره می‌شوند، در حالی که سطح‌های غیرفعال با تشخیص‌ها نادیده گرفته می‌شوند.

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
- نگاشت‌های مسطح قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را با پشتیبان `.legacy-flat.*.bak` به پروفایل‌های API-key مرجع `provider:default` بازنویسی می‌کند.
- پروفایل‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های پروفایل احراز هویت پشتیبانی‌شده با SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های زمان اجرای ایستا از snapshotهای حل‌شده درون‌حافظه‌ای می‌آیند؛ ورودی‌های ایستای قدیمی `auth.json` هنگام کشف پاک‌سازی می‌شوند.
- واردسازی‌های OAuth قدیمی از `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: عقب‌گرد پایه بر حسب ساعت، زمانی که یک پروفایل به‌دلیل خطاهای واقعی
  صورتحساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح صورتحساب حتی در پاسخ‌های `401`/`403`
  همچنان می‌تواند اینجا قرار بگیرد، اما تطبیق‌دهنده‌های متنِ ویژه هر ارائه‌دهنده در محدوده همان ارائه‌دهنده‌ای
  می‌مانند که مالکشان است (برای مثال OpenRouter
  `Key limit exceeded`). پیام‌های HTTP قابل تلاش مجدد `402` مربوط به پنجره مصرف یا
  سقف هزینه سازمان/فضای کاری به‌جای آن در مسیر `rate_limit`
  می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری برای هر ارائه‌دهنده برای ساعت‌های عقب‌گرد صورتحساب.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی عقب‌گرد صورتحساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: عقب‌گرد پایه بر حسب دقیقه برای شکست‌های با اطمینان بالا از نوع `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد عقب‌گرد `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجره غلتان بر حسب ساعت که برای شمارنده‌های عقب‌گرد استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای بارگذاری بیش‌ازحد، پیش از تغییر به جایگزین مدل (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` اینجا قرار می‌گیرند.
- `overloadedBackoffMs`: تاخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/پروفایلِ بارگذاری‌شده بیش‌ازحد (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای محدودیت نرخ، پیش از تغییر به جایگزین مدل (پیش‌فرض: `1`). آن سطل محدودیت نرخ شامل متن‌هایی با شکل ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، و `resource exhausted` است.

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
- `maxFileBytes`: حداکثر اندازه فایل ثبت وقایع فعال بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 مگابایت). OpenClaw تا پنج آرشیو شماره‌گذاری‌شده را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن با بهترین تلاش برای خروجی کنسول، فایل‌های ثبت وقایع، رکوردهای ثبت وقایع OTLP، و متن رونوشت نشست‌های ذخیره‌شده. `redactSensitive: "off"` فقط این سیاست عمومی ثبت وقایع/رونوشت را غیرفعال می‌کند؛ سطوح ایمنی UI/ابزار/تشخیصی همچنان پیش از انتشار، رازها را می‌پوشانند.

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
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی ثبت وقایع هدفمند را فعال می‌کند (از wildcardهایی مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانه سنِ بدون پیشرفت بر حسب میلی‌ثانیه برای دسته‌بندی نشست‌های پردازش طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled`، یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک، و پیشرفت ACP زمان‌سنج را بازنشانی می‌کنند؛ عیب‌یابی‌های تکراری `session.stuck` تا زمانی که تغییری رخ ندهد عقب‌گرد می‌کنند.
- `otel.enabled`: خط لوله صدور OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، کاتالوگ سیگنال، و مدل حریم خصوصی، [صدور OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: URL گردآورنده برای صدور OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpointهای اختیاری OTLP ویژه سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فراداده HTTP/gRPC اضافی که همراه با درخواست‌های صدور OTel فرستاده می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: صدور trace، metrics، یا log را فعال می‌کند.
- `otel.sampleRate`: نرخ نمونه‌برداری trace از `0` تا `1`.
- `otel.flushIntervalMs`: بازه flush دوره‌ای تله‌متری بر حسب میلی‌ثانیه.
- `otel.captureContent`: ضبط محتوای خام به‌صورت opt-in برای ویژگی‌های span در OTEL. به‌صورت پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را ضبط می‌کند؛ شکل شیء به شما اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs`، و `systemPrompt` را صراحتا فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای تازه‌ترین ویژگی‌های آزمایشی ارائه‌دهنده span در GenAI. به‌صورت پیش‌فرض، spanها برای سازگاری ویژگی قدیمی `gen_ai.system` را نگه می‌دارند؛ metrics مربوط به GenAI از ویژگی‌های معنایی کران‌دار استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از پیش یک SDK سراسری OpenTelemetry ثبت کرده‌اند. در این حالت OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را نادیده می‌گیرد، در حالی که شنونده‌های عیب‌یابی را فعال نگه می‌دارد.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`، و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی endpoint ویژه سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: snapshotهای ردگیری cache را برای اجراهای embedded ثبت می‌کند (پیش‌فرض: `false`).
- `cacheTrace.filePath`: مسیر خروجی برای JSONL ردگیری cache (پیش‌فرض: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: کنترل می‌کند چه چیزی در خروجی ردگیری cache گنجانده شود (همه به‌صورت پیش‌فرض: `true`).

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
- `auto.stableDelayHours`: حداقل تاخیر بر حسب ساعت پیش از اعمال خودکار در کانال پایدار (پیش‌فرض: `6`؛ حداکثر: `168`).
- `auto.stableJitterHours`: پنجره پخش rollout اضافی برای کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ حداکثر: `168`).
- `auto.betaCheckIntervalHours`: فاصله زمانی اجرای بررسی‌های کانال beta بر حسب ساعت (پیش‌فرض: `1`؛ حداکثر: `24`).

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

- `enabled`: دروازه سراسری قابلیت ACP (پیش‌فرض: `true`؛ برای پنهان‌کردن dispatch و امکان‌های spawn در ACP، آن را روی `false` تنظیم کنید).
- `dispatch.enabled`: دروازه مستقل برای dispatch نوبت نشست ACP (پیش‌فرض: `true`). آن را روی `false` تنظیم کنید تا فرمان‌های ACP در دسترس بمانند اما اجرا مسدود شود.
- `backend`: شناسه backend پیش‌فرض runtime برای ACP (باید با یک runtime Plugin ثبت‌شده برای ACP مطابق باشد).
  ابتدا Plugin مربوط به backend را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسه Plugin مربوط به backend را وارد کنید (برای مثال `acpx`) وگرنه backend مربوط به ACP بارگذاری نخواهد شد.
- `defaultAgent`: شناسه عامل هدف جایگزین ACP زمانی که spawnها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: allowlist شناسه‌های عامل مجاز برای نشست‌های runtime در ACP؛ خالی بودن یعنی هیچ محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: حداکثر نشست‌های ACP فعال هم‌زمان.
- `stream.coalesceIdleMs`: پنجره flush بیکار بر حسب میلی‌ثانیه برای متن streamed.
- `stream.maxChunkChars`: حداکثر اندازه chunk پیش از تقسیم projection بلوک streamed.
- `stream.repeatSuppression`: خطوط وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی stream می‌کند؛ `"final_only"` تا رویدادهای پایانی نوبت buffer می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: حداکثر کاراکترهای خروجی دستیار که در هر نوبت ACP project می‌شوند.
- `stream.maxSessionUpdateChars`: حداکثر کاراکترها برای خطوط وضعیت/به‌روزرسانی ACP که project می‌شوند.
- `stream.tagVisibility`: رکوردی از نام tagها به بازنویسی‌های نمایانی بولی برای رویدادهای streamed.
- `runtime.ttlMinutes`: TTL بیکار بر حسب دقیقه برای workerهای نشست ACP پیش از واجد شرایط شدن برای پاک‌سازی.
- `runtime.installCommand`: فرمان نصب اختیاری برای اجرا هنگام bootstrap کردن محیط runtime در ACP.

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
  - `"random"` (پیش‌فرض): taglineهای چرخشی طنز/فصلی.
  - `"default"`: tagline ثابت و خنثی (`All your chats, one OpenClaw.`).
  - `"off"`: بدون متن tagline (عنوان/نسخه بنر همچنان نشان داده می‌شود).
- برای پنهان‌کردن کل بنر (نه فقط taglineها)، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## راهنمای تنظیم

فراداده‌ای که توسط جریان‌های تنظیم هدایت‌شده CLI نوشته می‌شود (`onboard`، `configure`، `doctor`):

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

## پل (میراثی، حذف‌شده)

buildهای فعلی دیگر پل TCP را شامل نمی‌شوند. Nodeها از طریق WebSocket مربوط به Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از schema پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت‌زمان نگه‌داری نشست‌های اجرای Cron ایزوله تکمیل‌شده پیش از هرس از `sessions.json`. همچنین پاک‌سازی رونوشت‌های Cron حذف‌شده آرشیوشده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
- `runLog.maxBytes`: حداکثر اندازه برای هر فایل ثبت اجرای (`cron/runs/<jobId>.jsonl`) پیش از هرس. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین خط‌هایی که هنگام فعال شدن هرس run-log نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن bearer که برای تحویل POST مربوط به Webhook در Cron استفاده می‌شود (`delivery.mode = "webhook"`)، اگر حذف شود هیچ سرآیند احراز هویتی فرستاده نمی‌شود.
- `webhook`: URL میراثی منسوخ fallback برای Webhook (http/https) که فقط برای jobهای ذخیره‌شده‌ای استفاده می‌شود که هنوز `notify: true` دارند.

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

- `maxAttempts`: بیشینه تعداد تلاش‌های دوباره برای کارهای یک‌باره در خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0`–`10`).
- `backoffMs`: آرایه‌ای از تأخیرهای backoff بر حسب ms برای هر تلاش دوباره (پیش‌فرض: `[30000, 60000, 300000]`؛ 1–10 ورودی).
- `retryOn`: انواع خطایی که تلاش دوباره را فعال می‌کنند — `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش دوباره روی همه انواع گذرا، آن را حذف کنید.

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

- `enabled`: هشدارهای شکست را برای کارهای Cron فعال کنید (پیش‌فرض: `false`).
- `after`: تعداد شکست‌های پیاپی پیش از فعال شدن هشدار (عدد صحیح مثبت، کمینه: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: اجراهای ردشده پیاپی را در آستانه هشدار حساب کنید (پیش‌فرض: `false`). اجراهای ردشده جداگانه ردیابی می‌شوند و بر backoff خطای اجرا تأثیر نمی‌گذارند.
- `mode`: حالت تحویل — `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به Webhook پیکربندی‌شده پست می‌کند.
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
- `channel`: بازنویسی کانال برای تحویل announce. `"last"` آخرین کانال تحویل شناخته‌شده را دوباره استفاده می‌کند.
- `to`: هدف صریح announce یا URL وب‌هوک. برای حالت Webhook الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- `delivery.failureDestination` مربوط به هر کار، این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست مربوط به هر کار تنظیم نشده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌شوند، هنگام شکست به همان هدف اصلی announce بازمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای sessionTarget="isolated" پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

[کارهای Cron](/fa/automation/cron-jobs) را ببینید. اجرای‌های Cron ایزوله به‌عنوان [کارهای پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای الگوی مدل رسانه

جای‌نگهدارهای الگو که در `tools.media.models[].args` گسترش می‌یابند:

| متغیر             | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | متن کامل پیام ورودی                              |
| `{{RawBody}}`      | متن خام (بدون پوشش‌های تاریخچه/فرستنده)          |
| `{{BodyStripped}}` | متن با حذف منشن‌های گروه                         |
| `{{From}}`         | شناسه فرستنده                                    |
| `{{To}}`           | شناسه مقصد                                       |
| `{{MessageSid}}`   | شناسه پیام کانال                                 |
| `{{SessionId}}`    | UUID نشست فعلی                                   |
| `{{IsNewSession}}` | `"true"` وقتی نشست جدید ایجاد شده باشد           |
| `{{MediaUrl}}`     | شبه‌URL رسانه ورودی                              |
| `{{MediaPath}}`    | مسیر رسانه محلی                                  |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)                      |
| `{{Transcript}}`   | رونوشت صوتی                                      |
| `{{Prompt}}`       | پرامپت رسانه حل‌شده برای ورودی‌های CLI           |
| `{{MaxChars}}`     | بیشینه نویسه‌های خروجی حل‌شده برای ورودی‌های CLI |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (در حد امکان)                         |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد امکان)               |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد امکان)                 |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد امکان)                 |
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
- آرایه‌ای از فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شوند (موارد بعدی موارد قبلی را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از شامل‌سازی‌ها ادغام می‌شوند (مقادیر شامل‌شده را بازنویسی می‌کنند).
- شامل‌سازی‌های تودرتو: تا عمق 10 سطح.
- مسیرها: نسبت به فایل شامل‌کننده حل می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا (`dirname` مربوط به `openclaw.json`) باقی بمانند. فرم‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل همان مرز حل شوند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالا با پشتوانه یک شامل‌سازی تک‌فایلی را تغییر می‌دهند، در همان فایل شامل‌شده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- شامل‌سازی‌های ریشه، آرایه‌های شامل‌سازی، و شامل‌سازی‌هایی با بازنویسی‌های هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط‌خواندنی هستند؛ این نوشتن‌ها به‌جای تخت کردن پیکربندی، بسته شکست می‌خورند.
- خطاها: پیام‌های روشن برای فایل‌های گم‌شده، خطاهای تجزیه، و شامل‌سازی‌های چرخه‌ای.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

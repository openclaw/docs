---
read_when:
    - به معناشناسی دقیق پیکربندی در سطح فیلد یا مقادیر پیش‌فرض نیاز دارید
    - شما در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای اصلی OpenClaw، پیش‌فرض‌ها، و پیوندها به مراجع زیرسامانه‌های اختصاصی
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-05-02T11:45:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 615dda0385c6a4efb9bfcc010de221b2d799dab73e612f6e4681fd14d45f15d0
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمایی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی یک زیرسامانه مرجع عمیق‌تری برای خودش دارد، به آن پیوند می‌دهد. کاتالوگ‌های فرمان متعلق به کانال‌ها و Pluginها و تنظیمات عمیق حافظه/QMD به‌جای این صفحه، در صفحه‌های خودشان قرار دارند.

حقیقت کد:

- `openclaw config schema` شمای JSON زنده‌ای را که برای اعتبارسنجی و Control UI استفاده می‌شود چاپ می‌کند، و در صورت موجود بودن، فراداده‌های بسته‌بندی‌شده/Plugin/کانال را در آن ادغام می‌کند
- `config.schema.lookup` یک گره شمای محدود به مسیر را برای ابزارهای بررسی جزئیات برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش مبنای مستندات پیکربندی را در برابر سطح شمای فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی عامل: پیش از ویرایش‌ها، از کنش ابزار `gateway` یعنی `config.schema.lookup` برای
مستندات و محدودیت‌های دقیق در سطح فیلد استفاده کنید. برای راهنمایی وظیفه‌محور از
[پیکربندی](/fa/gateway/configuration) و برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها و پیوندها به مراجع زیرسامانه‌ها از این صفحه
استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations` و پیکربندی Dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [فرمان‌های اسلش](/fa/tools/slash-commands) برای کاتالوگ فعلی فرمان‌های داخلی + بسته‌بندی‌شده
- صفحه‌های مالک کانال/Plugin برای سطوح فرمان ویژه کانال

قالب پیکربندی **JSON5** است (کامنت‌ها + کاماهای پایانی مجازند). همه فیلدها اختیاری‌اند — OpenClaw هنگام حذف‌شدن آن‌ها از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند — برای `channels.*`،
از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و کانال‌های
بسته‌بندی‌شده دیگر (احراز هویت، کنترل دسترسی، چندحسابی، دروازه‌گذاری منشن) [پیکربندی — کانال‌ها](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های عامل، چندعاملی، نشست‌ها و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است — برای موارد زیر
[پیکربندی — عامل‌ها](/fa/gateway/config-agents) را ببینید:

- `agents.defaults.*` (فضای کاری، مدل، تفکر، Heartbeat، حافظه، رسانه، Skills، sandbox)
- `multiAgent.*` (مسیریابی و اتصال‌های چندعاملی)
- `session.*` (چرخه عمر نشست، Compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر Markdown)
- `talk.*` (حالت گفت‌وگو)
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار حالت گفت‌وگو در iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، حالت گفت‌وگو پیش از ارسال رونوشت، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، کلیدهای آزمایشی، پیکربندی ابزار مبتنی بر ارائه‌دهنده و راه‌اندازی
ارائه‌دهنده سفارشی / base-URL به صفحه‌ای اختصاصی منتقل شده‌اند — [پیکربندی — ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools) را ببینید.

## مدل‌ها

تعریف‌های ارائه‌دهنده، فهرست‌های مجاز مدل و راه‌اندازی ارائه‌دهنده سفارشی در
[پیکربندی — ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند.
ریشه `models` همچنین رفتار سراسری کاتالوگ مدل را در اختیار دارد.

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
  پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway آغاز می‌شود. وقتی `false` باشد،
  Gateway واکشی‌های کاتالوگ قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقدارهای پیکربندی‌شده
  `models.providers.*.models[].cost` همچنان برای برآوردهای هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط
Pi تعبیه‌شده و دیگر adapterهای زمان اجرا مصرف می‌شوند. فرمان‌های `openclaw mcp list`،
`show`، `set` و `unset` این بلوک را بدون اتصال به سرور
هدف هنگام ویرایش پیکربندی مدیریت می‌کنند.

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

- `mcp.servers`: تعریف‌های نام‌گذاری‌شده سرور MCP از نوع stdio یا راه‌دور برای زمان‌اجراهایی که
  ابزارهای MCP پیکربندی‌شده را در معرض استفاده قرار می‌دهند.
  ورودی‌های راه‌دور از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛
  `type: "http"` یک نام مستعار بومی CLI است که `openclaw mcp set` و
  `openclaw doctor --fix` آن را به فیلد معیار `transport` نرمال می‌کنند.
- `mcp.sessionIdleTtlMs`: TTL بی‌کاری برای زمان‌اجراهای MCP بسته‌بندی‌شده محدود به نشست.
  اجرای‌های تعبیه‌شده یک‌باره درخواست پاک‌سازی پایان اجرا می‌دهند؛ این TTL پشتوانه‌ای برای
  نشست‌های طولانی‌مدت و فراخوان‌های آینده است.
- تغییرات زیر `mcp.*` با کنارگذاشتن زمان‌اجراهای MCP نشستِ کش‌شده به‌صورت داغ اعمال می‌شوند.
  کشف/استفاده بعدی از ابزار آن‌ها را از پیکربندی جدید دوباره می‌سازد، بنابراین ورودی‌های حذف‌شده
  `mcp.servers` بلافاصله جمع‌آوری می‌شوند و منتظر TTL بی‌کاری نمی‌مانند.

برای رفتار زمان اجرا، [MCP](/fa/cli/mcp#openclaw-as-an-mcp-client-registry) و
[پشت‌اندهای CLI](/fa/gateway/cli-backends#bundle-mcp-overlays) را ببینید.

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

- `allowBundled`: فهرست مجاز اختیاری فقط برای Skills بسته‌بندی‌شده (Skills مدیریت‌شده/فضای کاری تحت تأثیر قرار نمی‌گیرند).
- `load.extraDirs`: ریشه‌های مشترک اضافی Skills (کمترین اولویت).
- `install.preferBrew`: وقتی true باشد، در صورت در دسترس بودن `brew`، پیش از بازگشت به انواع نصب‌کننده دیگر، نصب‌کننده‌های Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح نصب‌کننده Node برای مشخصات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` یک Skill را حتی اگر بسته‌بندی/نصب شده باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بری برای Skills که یک متغیر محیطی اصلی اعلام می‌کنند (رشته متن ساده یا شیء SecretRef).

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
- **تغییرات پیکربندی به راه‌اندازی مجدد gateway نیاز دارند.**
- `allow`: فهرست مجاز اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` غلبه دارد.
- `plugins.entries.<id>.apiKey`: فیلد میان‌بر کلید API در سطح Plugin (وقتی توسط Plugin پشتیبانی شود).
- `plugins.entries.<id>.env`: نگاشت متغیر محیطی محدود به Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، هسته `before_prompt_build` را مسدود می‌کند و فیلدهای تغییردهنده prompt از `before_agent_start` قدیمی را نادیده می‌گیرد، در حالی که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. برای hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط bundle پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیر‌بسته‌بندی‌شده مورد اعتماد می‌توانند محتوای خام مکالمه را از hookهای تایپ‌شده‌ای مانند `llm_input`، `llm_output`، `before_agent_finalize` و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌طور صریح به این Plugin اعتماد کنید تا برای اجرای‌های پس‌زمینه subagent، overrideهای `provider` و `model` در هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: فهرست مجاز اختیاری از اهداف معیار `provider/model` برای overrideهای مورد اعتماد subagent. فقط وقتی از `"*"` استفاده کنید که عمداً می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (در صورت موجود بودن، با شمای Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/زمان‌اجرای Plugin کانال زیر `channels.<id>` قرار دارند و باید با فراداده `channelConfigs` در manifest Plugin مالک توصیف شوند، نه با رجیستری گزینه مرکزی OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: تنظیمات ارائه‌دهنده web-fetch در Firecrawl.
  - `apiKey`: کلید API فایرکراول (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، مقدار قدیمی `tools.web.fetch.firecrawl.apiKey` یا متغیر محیطی `FIRECRAWL_API_KEY` بازمی‌گردد.
  - `baseUrl`: URL پایه API فایرکراول (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای خودمیزبان باید endpointهای خصوصی/داخلی را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی صفحه‌ها را استخراج کند (پیش‌فرض: `true`).
  - `maxAgeMs`: بیشینه سن کش بر حسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: timeout درخواست scrape بر حسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جست‌وجوی وب Grok).
  - `enabled`: ارائه‌دهنده X Search را فعال کند.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مانند `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات Dreaming حافظه. برای فازها و آستانه‌ها [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: کلید اصلی Dreaming (پیش‌فرض `false`).
  - `frequency`: آهنگ Cron برای هر پیمایش کامل Dreaming (به‌صورت پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent مربوط به Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن هدف‌ها، با `allowedModels` همراه کنید. خطاهای در دسترس نبودن مدل یک‌بار با مدل پیش‌فرض نشست دوباره تلاش می‌شوند؛ شکست‌های اعتماد یا فهرست مجاز بی‌صدا fallback نمی‌شوند.
  - سیاست فاز و آستانه‌ها جزئیات پیاده‌سازی‌اند (کلیدهای پیکربندی کاربرمحور نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای bundle فعال Claude همچنین می‌توانند پیش‌فرض‌های Pi تعبیه‌شده را از `settings.json` مشارکت دهند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات پاک‌سازی‌شده عامل اعمال می‌کند، نه به‌عنوان patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه `"none"` را انتخاب کنید.
- `plugins.slots.contextEngine`: شناسه Plugin موتور زمینه فعال را انتخاب کنید؛ مگر اینکه موتور دیگری نصب و انتخاب کنید، پیش‌فرض `"legacy"` است.

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
- `tabCleanup` زبانه‌های ردیابی‌شدهٔ عامل اصلی را پس از زمان بیکاری یا وقتی یک
  نشست از سقف خود فراتر می‌رود، بازپس می‌گیرد. برای غیرفعال کردن هرکدام از این
  حالت‌های پاک‌سازی جداگانه، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین ناوبری مرورگر به‌طور پیش‌فرض سخت‌گیرانه می‌ماند.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را فقط وقتی تنظیم کنید که عمداً به ناوبری مرورگر در شبکهٔ خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقاط پایانی پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترس‌پذیری/کشف، مشمول همان مسدودسازی شبکهٔ خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- پروفایل‌های راه‌دور فقط پیوستنی هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl` مقدارهای `http://`، `https://`، `ws://`، و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند از HTTP(S) استفاده کنید؛ وقتی ارائه‌دهندهٔ شما URL مستقیم WebSocket مربوط به DevTools را می‌دهد از WS(S)
  استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترس‌پذیری CDP راه‌دور و
  `attachOnly`، به‌همراه درخواست‌های باز کردن زبانه، اعمال می‌شوند. پروفایل‌های
  local loopback مدیریت‌شده پیش‌فرض‌های CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP مدیریت‌شدهٔ بیرونی از طریق loopback قابل دسترسی است، برای آن
  پروفایل `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw پورت loopback را به‌عنوان یک
  پروفایل مرورگر مدیریت‌شدهٔ محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت پورت محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل پیوست شوند.
- پروفایل‌های `existing-session` می‌توانند `userDataDir` را برای هدف‌گیری یک
  پروفایل مرورگر مبتنی بر Chromium مشخص، مانند Brave یا Edge، تنظیم کنند.
- پروفایل‌های `existing-session` محدودیت‌های مسیر فعلی Chrome MCP را نگه می‌دارند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری با CSS-selector، hookهای بارگذاری تک‌فایل،
  بدون بازنویسی timeout دیالوگ، بدون `wait --load networkidle`، و بدون
  `responsebody`، خروجی PDF، رهگیری دانلود، یا کنش‌های دسته‌ای.
- پروفایل‌های محلی مدیریت‌شدهٔ `openclaw`، `cdpPort` و `cdpUrl` را به‌صورت خودکار اختصاص می‌دهند؛ فقط
  برای CDP راه‌دور، `cdpUrl` را صریح تنظیم کنید.
- پروفایل‌های محلی مدیریت‌شده می‌توانند `executablePath` را تنظیم کنند تا مقدار سراسری
  `browser.executablePath` برای آن پروفایل بازنویسی شود. از این برای اجرای یک پروفایل در
  Chrome و پروفایل دیگر در Brave استفاده کنید.
- پروفایل‌های محلی مدیریت‌شده برای کشف HTTP مربوط به Chrome CDP پس از شروع فرایند از `browser.localLaunchTimeoutMs`
  و برای آمادگی websocket CDP پس از اجرا از `browser.localCdpReadyTimeoutMs`
  استفاده می‌کنند. روی میزبان‌های کندتر که Chrome با موفقیت شروع می‌شود اما
  بررسی‌های آمادگی با راه‌اندازی رقابت می‌کنند، این مقدارها را افزایش دهید. هر دو مقدار باید
  عدد صحیح مثبت تا `120000` میلی‌ثانیه باشند؛ مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را برای پوشهٔ خانهٔ سیستم‌عامل شما پیش از اجرای Chromium
  می‌پذیرند. `userDataDir` مربوط به هر پروفایل در پروفایل‌های `existing-session` نیز tilde-expanded می‌شود.
- سرویس کنترل: فقط loopback (پورت مشتق‌شده از `gateway.port`، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های اجرای اضافه را به شروع Chromium محلی اضافه می‌کند (برای مثال
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

- `seamColor`: رنگ تأکیدی برای کروم رابط کاربری برنامهٔ بومی (رنگ حباب Talk Mode و غیره).
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

- `mode`: `local` (اجرای gateway) یا `remote` (اتصال به Gateway راه‌دور). Gateway راه‌اندازی نمی‌شود مگر اینکه مقدار `local` باشد.
- `port`: پورت منفرد چندمنظوره برای WS + HTTP. تقدم: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP مربوط به Tailscale)، یا `custom`.
- **نام‌های مستعار قدیمی bind**: در `gateway.bind` از مقادیر حالت bind استفاده کنید (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، نه نام‌های مستعار میزبان (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **یادداشت Docker**: مقدار bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکه‌بندی bridge در Docker (`-p 18789:18789`)، ترافیک روی `eth0` وارد می‌شود، بنابراین Gateway دسترس‌پذیر نیست. از `--network host` استفاده کنید، یا `bind: "lan"` (یا `bind: "custom"` با `customBindHost: "0.0.0.0"`) را تنظیم کنید تا روی همهٔ رابط‌ها گوش دهد.
- **احراز هویت**: به‌صورت پیش‌فرض الزامی است. bindهای غیر loopback به احراز هویت Gateway نیاز دارند. در عمل یعنی یک token/password مشترک یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. راه‌انداز onboarding به‌صورت پیش‌فرض یک توکن تولید می‌کند.
- اگر هر دو مقدار `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند (از جمله SecretRefها)، `gateway.auth.mode` را صراحتاً روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده‌اند و mode تنظیم نشده است، جریان‌های راه‌اندازی و نصب/تعمیر سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای تنظیمات local loopback مورد اعتماد استفاده کنید؛ این حالت عمداً در promptهای onboarding ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک reverse proxy آگاه از هویت واگذار کنید و به headerهای هویتی از `gateway.trustedProxies` اعتماد کنید (ببینید [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth)). این حالت به‌صورت پیش‌فرض انتظار یک منبع proxy **غیر loopback** دارد؛ reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی روی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان fallback مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، headerهای هویتی Tailscale Serve می‌توانند احراز هویت Control UI/WebSocket را برآورده کنند (از طریق `tailscale whois` اعتبارسنجی می‌شود). endpointهای HTTP API از آن احراز هویت header مربوط به Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت احراز هویت HTTP عادی Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway مورد اعتماد است. وقتی `tailscale.mode = "serve"` باشد، پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکنندهٔ اختیاری احراز هویت ناموفق. به‌ازای هر IP کلاینت و هر scope احراز هویت اعمال می‌شود (shared-secret و device-token جداگانه ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر ناهمگام Control UI مربوط به Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست به‌صورت ترتیبی اجرا می‌شوند. بنابراین تلاش‌های بد هم‌زمان از همان کلاینت می‌توانند در درخواست دوم محدودکننده را فعال کنند، به‌جای اینکه هر دو صرفاً به‌صورت mismatch عادی عبور کنند.
  - مقدار پیش‌فرض `gateway.auth.rateLimit.exemptLoopback` برابر `true` است؛ وقتی عمداً می‌خواهید ترافیک localhost هم rate-limit شود (برای تنظیمات آزمایشی یا استقرارهای proxy سخت‌گیرانه)، آن را روی `false` تنظیم کنید.
- تلاش‌های احراز هویت WS با منشأ مرورگر همیشه با غیرفعال بودن معافیت loopback محدود می‌شوند (دفاع چندلایه در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، آن قفل‌شدن‌های با منشأ مرورگر به‌ازای مقدار نرمال‌شدهٔ `Origin`
  ایزوله هستند، بنابراین شکست‌های تکراری از یک منشأ localhost به‌طور خودکار
  منشأ دیگری را قفل نمی‌کند.
- `tailscale.mode`: `serve` (فقط tailnet، bind به loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `controlUi.allowedOrigins`: allowlist صریح منشأ مرورگر برای اتصال‌های WebSocket به Gateway. وقتی انتظار می‌رود کلاینت‌های مرورگر از منشأهای غیر loopback بیایند، الزامی است.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناک که fallback منشأ بر پایهٔ Host-header را برای استقرارهایی فعال می‌کند که عمداً به سیاست منشأ Host-header متکی هستند.
- `remote.transport`: `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، مقدار `remote.url` باید `ws://` یا `wss://` باشد.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override اضطراری در محیط پردازش سمت کلاینت
  که `ws://` متنی ساده را برای IPهای شبکهٔ خصوصی مورد اعتماد مجاز می‌کند؛ پیش‌فرض برای متن ساده همچنان فقط loopback است. هیچ معادل `openclaw.json`
  وجود ندارد، و پیکربندی شبکهٔ خصوصی مرورگر مانند
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` بر کلاینت‌های WebSocket
  مربوط به Gateway اثر نمی‌گذارد.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامهٔ کلاینت راه‌دور هستند. آن‌ها به‌تنهایی احراز هویت Gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: URL پایهٔ HTTPS برای relay خارجی APNs که buildهای رسمی/TestFlight iOS پس از انتشار ثبت‌نام‌های متکی به relay در Gateway از آن استفاده می‌کنند. این URL باید با URL مربوط به relay که در build iOS کامپایل شده است مطابقت داشته باشد.
- `gateway.push.apns.relay.timeoutMs`: timeout ارسال از Gateway به relay بر حسب میلی‌ثانیه. پیش‌فرض `10000` است.
- ثبت‌نام‌های متکی به relay به یک هویت مشخص Gateway واگذار می‌شوند. اپلیکیشن iOS جفت‌شده `gateway.identity.get` را واکشی می‌کند، آن هویت را در ثبت‌نام relay می‌گنجاند، و یک مجوز ارسال scoped به ثبت‌نام را به Gateway فوروارد می‌کند. Gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه گریز فقط برای توسعه برای URLهای relay مربوط به HTTP روی loopback. URLهای relay تولیدی باید روی HTTPS باقی بمانند.
- `gateway.handshakeTimeoutMs`: timeout handshake مربوط به WebSocket پیش از احراز هویت Gateway بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد تقدم دارد. این مقدار را روی میزبان‌های پربار یا کم‌توانی که کلاینت‌های محلی می‌توانند در حالی وصل شوند که warmup راه‌اندازی هنوز در حال پایدار شدن است افزایش دهید.
- `gateway.channelHealthCheckMinutes`: بازهٔ مانیتور سلامت کانال بر حسب دقیقه. برای غیرفعال کردن restartهای مانیتور سلامت به‌صورت سراسری، `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانهٔ stale-socket بر حسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: حداکثر restartهای مانیتور سلامت به‌ازای هر کانال/حساب در یک ساعت rolling. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out به‌ازای هر کانال برای restartهای مانیتور سلامت، در حالی که مانیتور سراسری فعال باقی می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override به‌ازای هر حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر override سطح کانال تقدم دارد.
- مسیرهای فراخوانی Gateway محلی فقط وقتی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتاً از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolve به‌صورت fail-closed شکست می‌خورد (بدون masking توسط remote fallback).
- `trustedProxies`: IPهای reverse proxy که TLS را terminate می‌کنند یا headerهای forwarded-client را تزریق می‌کنند. فقط proxyهایی را فهرست کنید که کنترلشان را در اختیار دارید. ورودی‌های loopback همچنان برای تنظیمات proxy/local-detection روی همان میزبان معتبر هستند (برای مثال Tailscale Serve یا یک reverse proxy محلی)، اما آن‌ها درخواست‌های loopback را برای `gateway.auth.mode: "trusted-proxy"` واجد شرایط **نمی‌کنند**.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` وجود نداشته باشد Gateway مقدار `X-Real-IP` را می‌پذیرد. پیش‌فرض `false` است تا رفتار fail-closed باشد.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای تأیید خودکار جفت‌سازی نخستین‌بار دستگاه Node بدون scopeهای درخواست‌شده. وقتی تنظیم نشده باشد غیرفعال است. این مورد جفت‌سازی operator/browser/Control UI/WebChat را به‌صورت خودکار تأیید نمی‌کند، و upgradeهای role، scope، metadata یا public-key را هم خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی سراسری allow/deny برای commandهای اعلام‌شدهٔ Node پس از جفت‌سازی و ارزیابی allowlist پلتفرم. از `allowCommands` برای opt in به commandهای خطرناک Node مانند `camera.snap`، `camera.clip`، و `screen.record` استفاده کنید؛ `denyCommands` یک command را حذف می‌کند حتی اگر پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل می‌شد. پس از اینکه یک Node فهرست commandهای اعلام‌شدهٔ خود را تغییر داد، آن جفت‌سازی دستگاه را رد و دوباره تأیید کنید تا Gateway snapshot به‌روزشدهٔ command را ذخیره کند.
- `gateway.tools.deny`: نام‌های اضافی tool که برای HTTP `POST /tools/invoke` مسدود می‌شوند (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام‌های tool را از فهرست deny پیش‌فرض HTTP حذف می‌کند.

</Accordion>

### endpointهای سازگار با OpenAI

- Chat Completions: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL در Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی تنظیم‌نشده تلقی می‌شوند؛ برای غیرفعال کردن واکشی URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- header اختیاری برای سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای منشأهای HTTPS که کنترلشان را دارید تنظیم کنید؛ ببینید [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### ایزوله‌سازی چند نمونه‌ای

چند Gateway را روی یک میزبان با پورت‌ها و state dirهای یکتا اجرا کنید:

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

- `enabled`: termination مربوط به TLS را روی listener Gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده باشند، یک جفت cert/key محلی self-signed به‌صورت خودکار تولید می‌کند؛ فقط برای استفادهٔ محلی/dev.
- `certPath`: مسیر filesystem به فایل گواهی TLS.
- `keyPath`: مسیر filesystem به فایل کلید خصوصی TLS؛ دسترسی را محدود نگه دارید.
- `caPath`: مسیر اختیاری CA bundle برای اعتبارسنجی کلاینت یا زنجیره‌های trust سفارشی.

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
  - `"off"`: ویرایش‌های زنده را نادیده بگیر؛ تغییرها به restart صریح نیاز دارند.
  - `"restart"`: همیشه هنگام تغییر config پردازش Gateway را restart کن.
  - `"hot"`: تغییرها را بدون restart درون پردازش اعمال کن.
  - `"hybrid"` (پیش‌فرض): ابتدا hot reload را امتحان کن؛ اگر لازم بود به restart fallback کن.
- `debounceMs`: پنجرهٔ debounce بر حسب ms پیش از اعمال تغییرهای config (عدد صحیح غیرمنفی).
- `deferralTimeoutMs`: حداکثر زمان اختیاری بر حسب ms برای انتظار عملیات‌های در جریان پیش از اجبار به restart. برای استفاده از انتظار bounded پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای still-pending، مقدار `0` تنظیم کنید.

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
توکن‌های hook در query-string رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به یک `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید از `gateway.auth.token` **متمایز** باشد؛ استفادهٔ دوباره از توکن Gateway رد می‌شود.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیرمسیر اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا preset از `sessionKey` قالبی استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این opt-in نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط زمانی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقادیر `sessionKey` نگاشت که با Template رندر شده‌اند، به‌عنوان مقادیر تأمین‌شده از بیرون در نظر گرفته می‌شوند و همچنین به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="جزئیات نگاشت">

- `match.path` زیرمسیر پس از `/hooks` را تطبیق می‌دهد (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` یک فیلد payload را برای مسیرهای عمومی تطبیق می‌دهد.
- Templateهایی مانند `{{messages[0].subject}}` از payload می‌خوانند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک عمل hook برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و درون `hooks.transformsDir` بماند (مسیرهای مطلق و traversal رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های Skills فضای کاری رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transforms مربوط به hooks منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک عامل مشخص مسیر می‌دهد؛ شناسه‌های ناشناخته به پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: مسیریابی صریح را محدود می‌کند (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید session ثابت اختیاری برای اجراهای عامل hook بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای session نگاشت مبتنی بر Template اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: allowlist پیشوند اختیاری برای مقادیر `sessionKey` صریح (درخواست + نگاشت)، مثلاً `["hook:"]`. وقتی هر نگاشت یا preset از `sessionKey` قالبی استفاده کند، اجباری می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ `channel` به‌طور پیش‌فرض `last` است.
- `model` برای این اجرای hook، LLM را override می‌کند (اگر کاتالوگ مدل تنظیم شده باشد باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- preset داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر آن مسیریابی در سطح هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را محدود کنید تا با namespace مربوط به Gmail هم‌خوان باشد، برای مثال `["hook:", "hook:gmail:"]`.
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

- Gateway هنگام بوت، در صورت پیکربندی، `gog gmail watch serve` را به‌طور خودکار شروع می‌کند. برای غیرفعال‌سازی، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
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

- HTML/CSS/JS قابل‌ویرایش توسط عامل و A2UI را از طریق HTTP زیر پورت Gateway سرو می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- bindهای غیر-loopback: مسیرهای canvas مانند سایر سطوح HTTP Gateway به احراز هویت Gateway نیاز دارند (توکن/رمز عبور/trusted-proxy).
- WebViewهای Node معمولاً headerهای احراز هویت را ارسال نمی‌کنند؛ پس از جفت و متصل شدن یک node، Gateway برای دسترسی canvas/A2UI، URLهای capability محدود به node را اعلام می‌کند.
- URLهای capability به session فعال WS مربوط به node متصل هستند و سریع منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت live-reload را به HTML سرو‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را به‌طور خودکار ایجاد می‌کند.
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

- `minimal` (پیش‌فرض): `cliPath` + `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: شامل `cliPath` + `sshPort` می‌شود.
- نام میزبان وقتی یک برچسب DNS معتبر باشد، به‌طور پیش‌فرض نام میزبان سیستم است و در غیر این صورت به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` آن را override کنید.

### ناحیه گسترده (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک zone تک‌پخشی DNS-SD را زیر `~/.openclaw/dns/` می‌نویسد. برای کشف بین‌شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + split DNS مربوط به Tailscale همراه کنید.

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

- متغیرهای محیطی درون‌خطی فقط اگر env فرایند فاقد آن کلید باشد اعمال می‌شوند.
- فایل‌های `.env`: فایل `.env` در CWD + `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را override نمی‌کنند).
- `shellEnv`: کلیدهای مورد انتظارِ موجود نیست را از پروفایل login shell شما وارد می‌کند.
- برای ترتیب تقدم کامل، [محیط](/fa/help/environment) را ببینید.

### جایگذاری متغیر محیطی

در هر رشتهٔ config با `${VAR_NAME}` به متغیرهای محیطی ارجاع دهید:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- فقط نام‌های حروف بزرگ تطبیق داده می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای موجود نیست/خالی هنگام بارگذاری config خطا ایجاد می‌کنند.
- برای یک `${VAR}` لفظی، با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## اسرار

ارجاع‌های secret افزایشی هستند: مقادیر plaintext همچنان کار می‌کنند.

### `SecretRef`

از یک شکل object استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی id برای `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id برای `source: "file"`: اشاره‌گر JSON مطلق (برای مثال `"/providers/openai/apiKey"`)
- الگوی id برای `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- idهای `source: "exec"` نباید segmentهای مسیر جداشده با slash شامل `.` یا `..` داشته باشند (برای مثال `a/../b` رد می‌شود)

### سطح اعتبارنامهٔ پشتیبانی‌شده

- ماتریس canonical: [سطح اعتبارنامهٔ SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای اعتبارنامهٔ پشتیبانی‌شدهٔ `openclaw.json` را هدف می‌گیرد.
- ارجاع‌های `auth-profiles.json` در resolution زمان اجرا و پوشش audit گنجانده شده‌اند.

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
- وقتی اعتبارسنجی ACL ویندوز در دسترس نباشد، مسیرهای provider فایل و exec به‌صورت fail closed عمل می‌کنند. `allowInsecurePath: true` را فقط برای مسیرهای مورد اعتمادی تنظیم کنید که نمی‌توان آن‌ها را اعتبارسنجی کرد.
- provider نوع `exec` به یک مسیر مطلق `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌طور پیش‌فرض، مسیرهای command که symlink هستند رد می‌شوند. برای اجازه دادن به مسیرهای symlink همراه با اعتبارسنجی مسیر هدف resolve‌شده، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی trusted-dir روی مسیر هدف resolve‌شده اعمال می‌شود.
- محیط فرزند `exec` به‌طور پیش‌فرض حداقلی است؛ متغیرهای لازم را صراحتاً با `passEnv` عبور دهید.
- ارجاع‌های secret در زمان فعال‌سازی به یک snapshot درون‌حافظه‌ای resolve می‌شوند، سپس مسیرهای درخواست فقط همان snapshot را می‌خوانند.
- فیلترسازی سطح فعال هنگام فعال‌سازی اعمال می‌شود: ارجاع‌های resolve‌نشده روی سطوح فعال باعث شکست startup/reload می‌شوند، در حالی که سطوح غیرفعال با diagnostics نادیده گرفته می‌شوند.

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
- `auth-profiles.json` از ارجاع‌های سطح مقدار (`keyRef` برای `api_key`، `tokenRef` برای `token`) برای حالت‌های اعتبارنامهٔ ایستا پشتیبانی می‌کند.
- mapهای flat قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را با backup دارای پسوند `.legacy-flat.*.bak` به پروفایل‌های canonical کلید API با `provider:default` بازنویسی می‌کند.
- پروفایل‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های auth-profile پشتیبانی‌شده با SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های ایستای زمان اجرا از snapshotهای resolve‌شدهٔ درون‌حافظه‌ای می‌آیند؛ ورودی‌های ایستای قدیمی `auth.json` هنگام کشف پاک‌سازی می‌شوند.
- importهای OAuth قدیمی از `~/.openclaw/credentials/oauth.json`.
- [OAuth](/fa/concepts/oauth) را ببینید.
- رفتار زمان اجرای secrets و ابزارهای `audit/configure/apply`: [مدیریت Secrets](/fa/gateway/secrets).

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

- `billingBackoffHours`: عقب‌نشینی پایه بر حسب ساعت، زمانی که یک پروفایل به‌دلیل خطاهای واقعی صورت‌حساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح مربوط به صورت‌حساب هنوز می‌تواند حتی در پاسخ‌های `401`/`403` اینجا قرار بگیرد، اما تطبیق‌گرهای متنِ ویژهٔ ارائه‌دهنده در محدودهٔ همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای مثال OpenRouter `Key limit exceeded`). پیام‌های قابل تلاش دوبارهٔ HTTP `402` مربوط به پنجرهٔ مصرف یا محدودیت هزینهٔ سازمان/فضای کاری، در عوض در مسیر `rate_limit` می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری برای هر ارائه‌دهنده برای ساعت‌های عقب‌نشینی صورت‌حساب.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی عقب‌نشینی صورت‌حساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: عقب‌نشینی پایه بر حسب دقیقه برای شکست‌های با اطمینان بالا از نوع `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد عقب‌نشینی `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجرهٔ لغزان بر حسب ساعت که برای شمارنده‌های عقب‌نشینی استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: بیشینهٔ چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای سربار، پیش از جابه‌جایی به جایگزین مدل (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مانند `ModelNotReadyException` اینجا قرار می‌گیرند.
- `overloadedBackoffMs`: تأخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/پروفایلِ سربار (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: بیشینهٔ چرخش‌های پروفایل احراز هویت در همان ارائه‌دهنده برای خطاهای محدودیت نرخ، پیش از جابه‌جایی به جایگزین مدل (پیش‌فرض: `1`). این سطل محدودیت نرخ شامل متن‌های با شکل ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded` و `resource exhausted` است.

---

## ثبت‌وقایع

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

- فایل ثبت‌وقایع پیش‌فرض: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- برای یک مسیر پایدار، `logging.file` را تنظیم کنید.
- هنگام استفاده از `--verbose`، مقدار `consoleLevel` به `debug` افزایش می‌یابد.
- `maxFileBytes`: بیشینهٔ اندازهٔ فایل ثبت‌وقایع فعال بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 MB). OpenClaw حداکثر پنج بایگانی شماره‌دار را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن با بهترین تلاش برای خروجی کنسول، ثبت‌وقایع فایل، رکوردهای ثبت‌وقایع OTLP، و متن رونوشت نشستِ ماندگارشده. `redactSensitive: "off"` فقط این سیاست عمومی ثبت‌وقایع/رونوشت را غیرفعال می‌کند؛ سطوح ایمنی UI/ابزار/تشخیصی همچنان پیش از انتشار، رازها را پنهان می‌کنند.

---

## تشخیص‌ها

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
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی ثبت‌وقایع هدفمند را فعال می‌کنند (از وایلدکاردهایی مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانهٔ سن بدون پیشرفت بر حسب میلی‌ثانیه برای دسته‌بندی نشست‌های پردازشی طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled` یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک و پیشرفت ACP زمان‌سنج را بازنشانی می‌کنند؛ تشخیص‌های تکراری `session.stuck` تا وقتی تغییری رخ نداده باشد عقب‌نشینی می‌کنند.
- `otel.enabled`: خط لولهٔ صادر کردن OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، فهرست سیگنال‌ها و مدل حریم خصوصی، [صدور OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: نشانی گردآورنده برای صدور OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP مخصوص سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فرادادهٔ اضافی HTTP/gRPC که همراه با درخواست‌های صدور OTel فرستاده می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: صدور ردگیری، متریک‌ها یا ثبت‌وقایع را فعال کنید.
- `otel.sampleRate`: نرخ نمونه‌برداری ردگیری `0`–`1`.
- `otel.flushIntervalMs`: فاصلهٔ پاک‌سازی دوره‌ای تله‌متری بر حسب میلی‌ثانیه.
- `otel.captureContent`: دریافت محتوای خام به‌صورت opt-in برای ویژگی‌های span در OTEL. به‌طور پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را دریافت می‌کند؛ شکل شیء به شما امکان می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs` و `systemPrompt` را صریحاً فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای ویژگی‌های ارائه‌دهندهٔ span آزمایشی و جدید GenAI. به‌طور پیش‌فرض spanها برای سازگاری ویژگی قدیمی `gen_ai.system` را نگه می‌دارند؛ متریک‌های GenAI از ویژگی‌های معنایی محدود استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از قبل یک SDK سراسری OpenTelemetry را ثبت کرده‌اند. در این حالت OpenClaw راه‌اندازی/خاموشی SDK متعلق به Plugin را رد می‌کند، درحالی‌که شنونده‌های تشخیصی فعال می‌مانند.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطهٔ پایانی مخصوص سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: ثبت نماگرفت‌های ردگیری کش برای اجراهای تعبیه‌شده (پیش‌فرض: `false`).
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
- `checkOnStart`: هنگام شروع Gateway، به‌روزرسانی‌های npm را بررسی کند (پیش‌فرض: `true`).
- `auto.enabled`: به‌روزرسانی خودکار پس‌زمینه را برای نصب‌های بسته فعال کند (پیش‌فرض: `false`).
- `auto.stableDelayHours`: کمینهٔ تأخیر بر حسب ساعت پیش از اعمال خودکار کانال پایدار (پیش‌فرض: `6`؛ بیشینه: `168`).
- `auto.stableJitterHours`: پنجرهٔ گسترش اضافی برای عرضهٔ کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ بیشینه: `168`).
- `auto.betaCheckIntervalHours`: فاصلهٔ اجرای بررسی‌های کانال بتا بر حسب ساعت (پیش‌فرض: `1`؛ بیشینه: `24`).

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

- `enabled`: دروازهٔ ویژگی سراسری ACP (پیش‌فرض: `true`؛ برای پنهان کردن امکانات dispatch و spawn در ACP مقدار `false` را تنظیم کنید).
- `dispatch.enabled`: دروازهٔ مستقل برای dispatch نوبت نشست ACP (پیش‌فرض: `true`). مقدار `false` را تنظیم کنید تا فرمان‌های ACP در دسترس بمانند اما اجرا مسدود شود.
- `backend`: شناسهٔ backend پیش‌فرض runtime در ACP (باید با یک Plugin ثبت‌شدهٔ runtime در ACP مطابقت داشته باشد).
  ابتدا Plugin مربوط به backend را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسهٔ Plugin مربوط به backend را وارد کنید (برای مثال `acpx`) وگرنه backend در ACP بارگذاری نمی‌شود.
- `defaultAgent`: شناسهٔ agent هدفِ جایگزین در ACP وقتی spawnها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: allowlist شناسه‌های agent مجاز برای نشست‌های runtime در ACP؛ خالی بودن یعنی محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: بیشینهٔ نشست‌های ACP فعال هم‌زمان.
- `stream.coalesceIdleMs`: پنجرهٔ پاک‌سازی بیکار بر حسب میلی‌ثانیه برای متن streamشده.
- `stream.maxChunkChars`: بیشینهٔ اندازهٔ قطعه پیش از تقسیم projection بلوک streamشده.
- `stream.repeatSuppression`: خط‌های وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی stream می‌کند؛ `"final_only"` تا رخدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل‌مشاهده پس از رخدادهای پنهان ابزار (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: بیشینهٔ نویسه‌های خروجی دستیار که در هر نوبت ACP projection می‌شوند.
- `stream.maxSessionUpdateChars`: بیشینهٔ نویسه‌ها برای خط‌های وضعیت/به‌روزرسانی ACP که projection می‌شوند.
- `stream.tagVisibility`: رکوردی از نام tagها به بازنویسی‌های دیدپذیری بولی برای رخدادهای streamشده.
- `runtime.ttlMinutes`: TTL بیکار بر حسب دقیقه برای workerهای نشست ACP پیش از واجد شرایط شدن برای پاک‌سازی.
- `runtime.installCommand`: فرمان نصب اختیاری که هنگام راه‌اندازی اولیهٔ محیط runtime در ACP اجرا می‌شود.

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
  - `"off"`: بدون متن شعار (عنوان/نسخهٔ بنر همچنان نمایش داده می‌شود).
- برای پنهان کردن کل بنر (نه فقط شعارها)، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## راه‌انداز

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

فیلدهای هویت `agents.list` را زیر [پیش‌فرض‌های agent](/fa/gateway/config-agents#agent-defaults) ببینید.

---

## پل (قدیمی، حذف‌شده)

بیلدهای فعلی دیگر شامل پل TCP نیستند. Nodeها از طریق WebSocket مربوط به Gateway وصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از schema پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت زمانی که نشست‌های اجرای cron ایزولهٔ تکمیل‌شده پیش از هرس شدن از `sessions.json` نگه داشته می‌شوند. همچنین پاک‌سازی رونوشت‌های cron حذف‌شدهٔ بایگانی‌شده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال کردن، `false` را تنظیم کنید.
- `runLog.maxBytes`: بیشینهٔ اندازه برای هر فایل ثبت اجرای (`cron/runs/<jobId>.jsonl`) پیش از هرس. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین خط‌هایی که هنگام فعال شدن هرس ثبت اجرا نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن bearer که برای تحویل POST Webhook مربوط به cron استفاده می‌شود (`delivery.mode = "webhook"`)، اگر حذف شود هیچ سرآیند احراز هویتی فرستاده نمی‌شود.
- `webhook`: نشانی Webhook جایگزین قدیمی و منسوخ‌شده (http/https) که فقط برای jobهای ذخیره‌شده‌ای استفاده می‌شود که هنوز `notify: true` دارند.

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

- `maxAttempts`: حداکثر تلاش‌های مجدد برای کارهای یک‌باره در خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0`–`10`).
- `backoffMs`: آرایه‌ای از تأخیرهای backoff بر حسب میلی‌ثانیه برای هر تلاش مجدد (پیش‌فرض: `[30000, 60000, 300000]`؛ ۱ تا ۱۰ ورودی).
- `retryOn`: انواع خطاهایی که تلاش مجدد را فعال می‌کنند — `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش مجدد روی همه انواع گذرا، آن را حذف کنید.

فقط برای کارهای Cron یک‌باره اعمال می‌شود. کارهای تکرارشونده از مدیریت خطای جداگانه استفاده می‌کنند.

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
- `after`: تعداد شکست‌های پیاپی پیش از فعال شدن هشدار (عدد صحیح مثبت، حداقل: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: اجراهای ردشده پیاپی را در آستانه هشدار حساب کنید (پیش‌فرض: `false`). اجراهای ردشده جداگانه ردیابی می‌شوند و روی backoff خطای اجرا اثر نمی‌گذارند.
- `mode`: حالت تحویل — `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به Webhook پیکربندی‌شده پست می‌کند.
- `accountId`: شناسه حساب یا کانال اختیاری برای محدود کردن دامنه تحویل هشدار.

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
- `channel`: بازنویسی کانال برای تحویل announce. `"last"` از آخرین کانال تحویل شناخته‌شده دوباره استفاده می‌کند.
- `to`: هدف announce صریح یا URL Webhook. برای حالت webhook الزامی است.
- `accountId`: بازنویسی حساب اختیاری برای تحویل.
- `delivery.failureDestination` در سطح هر کار این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست سطح کار تنظیم شده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌شوند هنگام شکست به همان هدف announce اصلی برمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

[کارهای Cron](/fa/automation/cron-jobs) را ببینید. اجراهای Cron ایزوله به‌عنوان [کارهای پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای الگوی مدل رسانه

جای‌نگهدارهای الگو در `tools.media.models[].args` گسترش می‌یابند:

| متغیر             | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | بدنه کامل پیام ورودی                             |
| `{{RawBody}}`      | بدنه خام (بدون پوشش‌های تاریخچه/فرستنده)         |
| `{{BodyStripped}}` | بدنه با حذف منشن‌های گروه                        |
| `{{From}}`         | شناسه فرستنده                                    |
| `{{To}}`           | شناسه مقصد                                       |
| `{{MessageSid}}`   | شناسه پیام کانال                                 |
| `{{SessionId}}`    | UUID نشست فعلی                                   |
| `{{IsNewSession}}` | `"true"` وقتی نشست جدید ایجاد شده باشد           |
| `{{MediaUrl}}`     | شبه-URL رسانه ورودی                              |
| `{{MediaPath}}`    | مسیر رسانه محلی                                  |
| `{{MediaType}}`    | نوع رسانه (تصویر/صوت/سند/…)                     |
| `{{Transcript}}`   | رونویسی صوتی                                     |
| `{{Prompt}}`       | پرامپت رسانه حل‌شده برای ورودی‌های CLI           |
| `{{MaxChars}}`     | حداکثر نویسه‌های خروجی حل‌شده برای ورودی‌های CLI |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (در حد امکان)                         |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد امکان)               |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد امکان)                 |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد امکان)                 |
| `{{Provider}}`     | راهنمای provider (WhatsApp، Telegram، Discord و غیره) |

---

## درج‌های پیکربندی (`$include`)

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
- کلیدهای هم‌سطح: پس از درج‌ها ادغام می‌شوند (مقادیر درج‌شده را بازنویسی می‌کنند).
- درج‌های تو در تو: تا عمق ۱۰ سطح.
- مسیرها: نسبت به فایل درج‌کننده حل می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا (`dirname` مربوط به `openclaw.json`) باقی بمانند. شکل‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل همان مرز حل شوند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالای پشتیبانی‌شده با درج تک‌فایلی را تغییر می‌دهند، در همان فایل درج‌شده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- درج‌های ریشه، آرایه‌های درج، و درج‌هایی با بازنویسی‌های هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط‌خواندنی هستند؛ این نوشتن‌ها به‌جای تخت کردن پیکربندی، به‌صورت بسته شکست می‌خورند.
- خطاها: پیام‌های روشن برای فایل‌های گمشده، خطاهای parse، و درج‌های چرخشی.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

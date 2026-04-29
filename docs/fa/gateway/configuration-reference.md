---
read_when:
    - به معناشناسی یا پیش‌فرض‌های دقیق پیکربندی در سطح فیلد نیاز دارید
    - شما در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای اصلی OpenClaw، مقادیر پیش‌فرض، و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-04-29T22:49:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fd28b7d6a2e670ab97aac206bb14343bd887da3236c6135d7958cc6e97b735
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی یک زیرسامانه مرجع عمیق‌تر خودش را دارد، به آن پیوند می‌دهد. کاتالوگ‌های فرمان متعلق به کانال و Plugin و تنظیمات عمیق حافظه/QMD به‌جای این صفحه، در صفحه‌های خودشان قرار دارند.

مرجع واقعی کد:

- `openclaw config schema` طرح‌واره JSON زنده‌ای را که برای اعتبارسنجی و Control UI استفاده می‌شود چاپ می‌کند، و در صورت وجود، فراداده‌های بسته‌بندی‌شده/Plugin/کانال در آن ادغام شده‌اند
- `config.schema.lookup` برای ابزارهای واکاوی، یک گره طرح‌واره محدود به مسیر برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش خط‌مبنای مستندات پیکربندی را در برابر سطح طرح‌واره فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی عامل: پیش از ویرایش‌ها، برای مستندات و محدودیت‌های دقیق در سطح فیلد از کنش ابزار `gateway` یعنی `config.schema.lookup` استفاده کنید. برای راهنمایی وظیفه‌محور از [پیکربندی](/fa/gateway/configuration) و برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها، و پیوندها به مراجع زیرسامانه‌ها از این صفحه استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations`، و پیکربندی dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [فرمان‌های اسلش](/fa/tools/slash-commands) برای کاتالوگ فرمان داخلی + بسته‌بندی‌شده فعلی
- صفحه‌های مالک کانال/Plugin برای سطوح فرمان ویژه کانال

قالب پیکربندی **JSON5** است (دیدگاه‌ها + ویرگول‌های پایانی مجازند). همه فیلدها اختیاری‌اند — OpenClaw هنگام حذف شدنشان از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند — برای `channels.*`، از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و کانال‌های بسته‌بندی‌شده دیگر (احراز هویت، کنترل دسترسی، چندحسابی، دروازه‌گذاری منشن)، [پیکربندی — کانال‌ها](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های عامل، چندعاملی، نشست‌ها، و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است — [پیکربندی — عامل‌ها](/fa/gateway/config-agents) را برای این موارد ببینید:

- `agents.defaults.*` (فضای کاری، مدل، تفکر، heartbeat، حافظه، رسانه، skills، سندباکس)
- `multiAgent.*` (مسیریابی و اتصال‌های چندعاملی)
- `session.*` (چرخه عمر نشست، compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر Markdown)
- `talk.*` (حالت Talk)
  - `talk.speechLocale`: شناسه اختیاری locale از نوع BCP 47 برای تشخیص گفتار Talk روی iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال رونوشت، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، کلیدهای آزمایشی، پیکربندی ابزار مبتنی بر ارائه‌دهنده، و راه‌اندازی ارائه‌دهنده / base-URL سفارشی به صفحه‌ای اختصاصی منتقل شده‌اند — [پیکربندی — ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools) را ببینید.

## مدل‌ها

تعریف‌های ارائه‌دهنده، allowlistهای مدل، و راه‌اندازی ارائه‌دهنده سفارشی در [پیکربندی — ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند.
ریشه `models` همچنین مالک رفتار کاتالوگ مدل سراسری است.

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
- `models.pricing.enabled`: bootstrap قیمت‌گذاری پس‌زمینه را کنترل می‌کند. وقتی `false` باشد، راه‌اندازی Gateway واکشی‌های کاتالوگ قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقدارهای پیکربندی‌شده `models.providers.*.models[].cost` همچنان برای برآورد هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط Pi تعبیه‌شده و دیگر آداپتورهای زمان اجرا مصرف می‌شوند. فرمان‌های `openclaw mcp list`، `show`، `set`، و `unset` این بلوک را بدون اتصال به سرور هدف در زمان ویرایش پیکربندی مدیریت می‌کنند.

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

- `mcp.servers`: تعریف‌های نام‌دار سرور MCP از نوع stdio یا راه‌دور برای زمان‌اجراهایی که ابزارهای MCP پیکربندی‌شده را در معرض استفاده قرار می‌دهند.
  ورودی‌های راه‌دور از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛ `type: "http"` یک نام مستعار بومی CLI است که `openclaw mcp set` و `openclaw doctor --fix` آن را به فیلد متعارف `transport` نرمال‌سازی می‌کنند.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای زمان‌اجراهای MCP بسته‌بندی‌شده با دامنه نشست.
  اجراهای تعبیه‌شده تک‌مرحله‌ای، پاک‌سازی پایان اجرا را درخواست می‌کنند؛ این TTL پشتیبان نشست‌های طولانی‌عمر و فراخوان‌های آینده است.
- تغییرات زیر `mcp.*` با کنار گذاشتن زمان‌اجراهای MCP نشست کش‌شده، به‌صورت hot-apply اعمال می‌شوند.
  کشف/استفاده بعدی از ابزار آن‌ها را از پیکربندی جدید دوباره می‌سازد، بنابراین ورودی‌های حذف‌شده `mcp.servers` به‌جای انتظار برای TTL بیکاری، بلافاصله جمع‌آوری می‌شوند.

برای رفتار زمان اجرا، [MCP](/fa/cli/mcp#openclaw-as-an-mcp-client-registry) و [پشتانه‌های CLI](/fa/gateway/cli-backends#bundle-mcp-overlays) را ببینید.

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

- `allowBundled`: allowlist اختیاری فقط برای Skills بسته‌بندی‌شده (Skills مدیریت‌شده/فضای کاری تحت‌تأثیر قرار نمی‌گیرند).
- `load.extraDirs`: ریشه‌های مهارت مشترک اضافه (پایین‌ترین اولویت).
- `install.preferBrew`: وقتی true باشد، اگر `brew` در دسترس باشد، پیش از برگشت به انواع نصب‌کننده دیگر، نصب‌کننده‌های Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح نصب‌کننده node برای مشخصات `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` یک skill را حتی اگر بسته‌بندی/نصب شده باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بری برای Skills که یک متغیر env اصلی اعلام می‌کنند (رشته متن ساده یا شیء SecretRef).

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

- از `~/.openclaw/extensions`، `<workspace>/.openclaw/extensions`، به‌علاوه `plugins.load.paths` بارگذاری می‌شود.
- کشف، Pluginهای بومی OpenClaw به‌علاوه بسته‌های سازگار Codex و بسته‌های Claude را می‌پذیرد، از جمله بسته‌های چیدمان پیش‌فرض Claude بدون manifest.
- **تغییرات پیکربندی به راه‌اندازی دوباره Gateway نیاز دارند.**
- `allow`: allowlist اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` مقدم است.
- `plugins.entries.<id>.apiKey`: فیلد میان‌بر کلید API در سطح Plugin (وقتی توسط Plugin پشتیبانی شود).
- `plugins.entries.<id>.env`: نگاشت متغیر env محدود به Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، هسته `before_prompt_build` را مسدود می‌کند و فیلدهای تغییر‌دهنده prompt از `before_agent_start` قدیمی را نادیده می‌گیرد، در حالی که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. برای hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط بسته‌های پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیربسته‌بندی‌شده مورد اعتماد می‌توانند محتوای خام مکالمه را از hookهای تایپ‌شده مانند `llm_input`، `llm_output`، `before_agent_finalize`، و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌صراحت به این Plugin اعتماد می‌کند تا برای اجراهای subagent پس‌زمینه، overrideهای `provider` و `model` به‌ازای هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist اختیاری از هدف‌های متعارف `provider/model` برای overrideهای subagent مورد اعتماد. فقط وقتی از `"*"` استفاده کنید که عمدا می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (در صورت وجود، توسط طرح‌واره Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/زمان اجرای Plugin کانال زیر `channels.<id>` قرار دارند و باید توسط فراداده `channelConfigs` در manifest متعلق به Plugin مالک توصیف شوند، نه توسط یک رجیستری مرکزی گزینه‌های OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: تنظیمات ارائه‌دهنده web-fetch مربوط به Firecrawl.
  - `apiKey`: کلید API مربوط به Firecrawl (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، `tools.web.fetch.firecrawl.apiKey` قدیمی، یا متغیر env با نام `FIRECRAWL_API_KEY` برمی‌گردد.
  - `baseUrl`: URL پایه API مربوط به Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`).
  - `onlyMainContent`: فقط محتوای اصلی را از صفحه‌ها استخراج می‌کند (پیش‌فرض: `true`).
  - `maxAgeMs`: بیشینه سن کش بر حسب میلی‌ثانیه (پیش‌فرض: `172800000` / 2 روز).
  - `timeoutSeconds`: زمان پایان درخواست scrape بر حسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جست‌وجوی وب Grok).
  - `enabled`: ارائه‌دهنده X Search را فعال می‌کند.
  - `model`: مدل Grok برای استفاده در جست‌وجو (برای مثال `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات dreaming حافظه. برای فازها و آستانه‌ها [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: کلید اصلی dreaming (پیش‌فرض `false`).
  - `frequency`: آهنگ cron برای هر پیمایش کامل dreaming (به‌طور پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent مربوط به Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن هدف‌ها، همراه با `allowedModels` استفاده کنید. خطاهای در دسترس نبودن مدل یک‌بار با مدل پیش‌فرض نشست دوباره تلاش می‌شوند؛ خطاهای اعتماد یا allowlist بی‌صدا fallback نمی‌شوند.
  - سیاست فاز و آستانه‌ها جزئیات پیاده‌سازی هستند (کلیدهای پیکربندی کاربرمحور نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای بسته Claude فعال‌شده همچنین می‌توانند پیش‌فرض‌های Pi تعبیه‌شده را از `settings.json` مشارکت دهند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات عامل پاک‌سازی‌شده اعمال می‌کند، نه patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه `"none"` را انتخاب کنید.
- `plugins.slots.contextEngine`: شناسه Plugin موتور زمینه فعال را انتخاب کنید؛ مگر اینکه موتور دیگری نصب و انتخاب کنید، پیش‌فرض `"legacy"` است.

[Plugins](/fa/tools/plugin) را ببینید.

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
  جلسه از سقف خود عبور کند، بازپس می‌گیرد. برای غیرفعال کردن هرکدام از آن
  حالت‌های پاک‌سازی، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی تنظیم نشده باشد، `ssrfPolicy.dangerouslyAllowPrivateNetwork` غیرفعال است، بنابراین ناوبری مرورگر به‌طور پیش‌فرض سخت‌گیرانه باقی می‌ماند.
- فقط وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید که عمدا به ناوبری مرورگر در شبکه‌ی خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقاط پایانی پروفایل CDP راه دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترس‌پذیری/کشف، مشمول همان مسدودسازی شبکه‌ی خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- پروفایل‌های راه دور فقط-اتصال هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl` مقدارهای `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند از HTTP(S) استفاده کنید؛ وقتی ارائه‌دهنده‌ی شما یک URL مستقیم DevTools WebSocket می‌دهد از WS(S)
  استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترس‌پذیری CDP راه دور و
  `attachOnly` به‌همراه درخواست‌های بازکردن تب اعمال می‌شوند. پروفایل‌های loopback
  مدیریت‌شده، پیش‌فرض‌های CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP با مدیریت بیرونی از طریق loopback در دسترس است، برای آن
  پروفایل `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw پورت loopback را به‌عنوان یک
  پروفایل مرورگر مدیریت‌شده‌ی محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت پورت محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل، متصل شوند.
- پروفایل‌های `existing-session` می‌توانند `userDataDir` را تنظیم کنند تا یک
  پروفایل مشخص مرورگر مبتنی بر Chromium مانند Brave یا Edge هدف‌گیری شود.
- پروفایل‌های `existing-session` محدودیت‌های مسیر فعلی Chrome MCP را حفظ می‌کنند:
  اقدام‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری با گزینشگر CSS، قلاب‌های بارگذاری
  تک‌فایل، نبود بازنویسی زمان‌پایان دیالوگ، نبود `wait --load networkidle`، و نبود
  `responsebody`، خروجی PDF، رهگیری دانلود یا اقدام‌های دسته‌ای.
- پروفایل‌های `openclaw` مدیریت‌شده‌ی محلی، `cdpPort` و `cdpUrl` را به‌طور خودکار اختصاص می‌دهند؛ فقط
  برای CDP راه دور، `cdpUrl` را صریح تنظیم کنید.
- پروفایل‌های مدیریت‌شده‌ی محلی می‌توانند `executablePath` را تنظیم کنند تا مقدار سراسری
  `browser.executablePath` برای آن پروفایل بازنویسی شود. از این برای اجرای یک پروفایل در
  Chrome و پروفایل دیگر در Brave استفاده کنید.
- پروفایل‌های مدیریت‌شده‌ی محلی پس از شروع پردازه، برای کشف HTTP مربوط به Chrome CDP از `browser.localLaunchTimeoutMs`
  و برای آمادگی websocket مربوط به CDP پس از راه‌اندازی از `browser.localCdpReadyTimeoutMs` استفاده می‌کنند. روی میزبان‌های کندتر که Chrome
  با موفقیت شروع می‌شود اما بررسی‌های آمادگی با شروع هم‌زمان می‌شوند، این مقدارها را افزایش دهید. هر دو مقدار باید
  عدد صحیح مثبت تا `120000` میلی‌ثانیه باشند؛ مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را برای پوشه‌ی خانه‌ی سیستم‌عامل شما، پیش از راه‌اندازی Chromium، می‌پذیرند.
  `userDataDir` مخصوص هر پروفایل در پروفایل‌های `existing-session` نیز با تیلدا گسترش داده می‌شود.
- سرویس کنترل: فقط loopback (پورت برگرفته از `gateway.port`، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های اضافی راه‌اندازی را به شروع محلی Chromium اضافه می‌کند (برای مثال
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

- `seamColor`: رنگ تأکیدی برای کروم رابط کاربری برنامه‌ی بومی (رنگ حباب Talk Mode و غیره).
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

- `mode`: `local` (اجرای gateway) یا `remote` (اتصال به gateway راه دور). Gateway شروع به کار را رد می‌کند مگر اینکه `local` باشد.
- `port`: پورت تکی چندمنظوره برای WS + HTTP. اولویت: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP Tailscale)، یا `custom`.
- **نام‌های مستعار قدیمی bind**: در `gateway.bind` از مقادیر حالت bind استفاده کنید (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، نه نام‌های مستعار میزبان (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **یادداشت Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکه‌بندی bridge در Docker (`-p 18789:18789`)، ترافیک از `eth0` می‌رسد، پس gateway قابل دسترسی نیست. از `--network host` استفاده کنید، یا `bind: "lan"` (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) را تنظیم کنید تا روی همه رابط‌ها گوش دهد.
- **احراز هویت**: به‌صورت پیش‌فرض الزامی است. bindهای غیر loopback به احراز هویت gateway نیاز دارند. در عمل این یعنی یک توکن/گذرواژه مشترک یا یک پراکسی معکوس آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. راه‌انداز اولیه به‌صورت پیش‌فرض یک توکن تولید می‌کند.
- اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefs)، `gateway.auth.mode` را صراحتاً روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، جریان‌های شروع به کار و نصب/تعمیر سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای تنظیمات قابل اعتماد local loopback استفاده کنید؛ این حالت عمداً در اعلان‌های راه‌اندازی اولیه ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک پراکسی معکوس آگاه از هویت واگذار کنید و به هدرهای هویت از `gateway.trustedProxies` اعتماد کنید (نگاه کنید به [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)). این حالت به‌صورت پیش‌فرض انتظار یک منبع پراکسی **غیر loopback** دارد؛ پراکسی‌های معکوس loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخواننده‌های داخلی روی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان جایگزین مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار و انحصاری است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، هدرهای هویت Tailscale Serve می‌توانند احراز هویت رابط کاربری کنترل/WebSocket را تأمین کنند (از طریق `tailscale whois` تأیید می‌شود). نقطه‌پایان‌های HTTP API از آن احراز هویت هدر Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت عادی احراز هویت HTTP gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان gateway قابل اعتماد است. وقتی `tailscale.mode = "serve"` باشد، پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکننده اختیاری برای احراز هویت ناموفق. به‌ازای هر IP کلاینت و هر دامنه احراز هویت اعمال می‌شود (shared-secret و device-token جداگانه ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر ناهمگام رابط کاربری کنترل Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست به‌ترتیب اجرا می‌شوند. بنابراین تلاش‌های بد همزمان از همان کلاینت می‌توانند در درخواست دوم محدودکننده را فعال کنند، به‌جای اینکه هر دو صرفاً به‌عنوان عدم تطابق ساده عبور کنند.
  - `gateway.auth.rateLimit.exemptLoopback` به‌صورت پیش‌فرض `true` است؛ وقتی عمداً می‌خواهید ترافیک localhost هم محدودیت نرخ داشته باشد (برای تنظیمات آزمایشی یا استقرارهای سخت‌گیرانه پراکسی)، آن را `false` تنظیم کنید.
- تلاش‌های احراز هویت WS با منشأ مرورگر همیشه با معافیت loopback غیرفعال محدود می‌شوند (دفاع چندلایه در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، این قفل‌شدن‌های منشأ مرورگر به‌ازای مقدار نرمال‌شده `Origin`
  جدا می‌شوند، بنابراین شکست‌های مکرر از یک منشأ localhost به‌طور خودکار
  منشأ دیگری را قفل نمی‌کند.
- `tailscale.mode`: `serve` (فقط tailnet، bind از نوع loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `controlUi.allowedOrigins`: فهرست مجاز صریح منشأ مرورگر برای اتصال‌های WebSocket به Gateway. وقتی انتظار می‌رود کلاینت‌های مرورگر از منشأهای غیر loopback باشند، الزامی است.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناک که fallback منشأ مبتنی بر هدر Host را برای استقرارهایی فعال می‌کند که عمداً به سیاست منشأ مبتنی بر هدر Host متکی هستند.
- `remote.transport`: `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، `remote.url` باید `ws://` یا `wss://` باشد.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: بازنویسی اضطراری سمت کلاینت در محیط فرایند
  که اجازه می‌دهد `ws://` متن ساده به IPهای شبکه خصوصی مورد اعتماد برقرار شود؛
  پیش‌فرض برای متن ساده همچنان فقط loopback است. هیچ معادل `openclaw.json`
  وجود ندارد، و پیکربندی شبکه خصوصی مرورگر مانند
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` روی کلاینت‌های WebSocket
  مربوط به Gateway اثر نمی‌گذارد.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامه کلاینت راه دور هستند. این‌ها به‌تنهایی احراز هویت gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: URL پایه HTTPS برای رله خارجی APNs که buildهای رسمی/TestFlight iOS پس از انتشار ثبت‌نام‌های متکی به رله در gateway از آن استفاده می‌کنند. این URL باید با URL رله‌ای که در build iOS کامپایل شده است مطابقت داشته باشد.
- `gateway.push.apns.relay.timeoutMs`: مهلت زمانی ارسال از gateway به رله بر حسب میلی‌ثانیه. پیش‌فرض `10000` است.
- ثبت‌نام‌های متکی به رله به یک هویت مشخص gateway واگذار می‌شوند. اپ iOS جفت‌شده `gateway.identity.get` را دریافت می‌کند، آن هویت را در ثبت‌نام رله قرار می‌دهد، و یک مجوز ارسال محدود به ثبت‌نام را به gateway ارسال می‌کند. gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: بازنویسی‌های موقت env برای پیکربندی رله بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه فرار فقط برای توسعه جهت URLهای رله HTTP روی loopback. URLهای رله تولید باید روی HTTPS باقی بمانند.
- `gateway.handshakeTimeoutMs`: مهلت زمانی دست‌دهی WebSocket پیش از احراز هویت Gateway بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد، اولویت دارد. این مقدار را روی میزبان‌های پربار یا کم‌قدرت افزایش دهید، جایی که کلاینت‌های محلی ممکن است در حالی وصل شوند که گرم‌شدن شروع هنوز در حال پایدار شدن است.
- `gateway.channelHealthCheckMinutes`: بازه پایش سلامت کانال بر حسب دقیقه. برای غیرفعال‌کردن سراسری راه‌اندازی‌های مجدد پایش سلامت، `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانه socket کهنه بر حسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: بیشینه راه‌اندازی‌های مجدد پایش سلامت به‌ازای هر کانال/حساب در یک ساعت لغزان. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: انصراف به‌ازای هر کانال از راه‌اندازی‌های مجدد پایش سلامت، در حالی که پایشگر سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: بازنویسی به‌ازای هر حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر بازنویسی سطح کانال اولویت دارد.
- مسیرهای فراخوانی gateway محلی فقط وقتی می‌توانند از `gateway.remote.*` به‌عنوان جایگزین استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتاً از طریق SecretRef پیکربندی شده و حل‌نشده باشد، فرایند حل به‌صورت بسته شکست می‌خورد (بدون پوشاندن با fallback راه دور).
- `trustedProxies`: IPهای پراکسی معکوس که TLS را خاتمه می‌دهند یا هدرهای کلاینتِ فورواردشده تزریق می‌کنند. فقط پراکسی‌هایی را فهرست کنید که کنترلشان می‌کنید. ورودی‌های loopback همچنان برای تنظیمات پراکسی/تشخیص محلی روی همان میزبان معتبرند (برای مثال Tailscale Serve یا یک پراکسی معکوس محلی)، اما درخواست‌های loopback را برای `gateway.auth.mode: "trusted-proxy"` واجد شرایط **نمی‌کنند**.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` وجود نداشته باشد، gateway مقدار `X-Real-IP` را می‌پذیرد. پیش‌فرض `false` است تا رفتار fail-closed حفظ شود.
- `gateway.nodes.pairing.autoApproveCidrs`: فهرست مجاز CIDR/IP اختیاری برای تأیید خودکار اولین جفت‌سازی دستگاه node بدون دامنه‌های درخواست‌شده. وقتی تنظیم نشده باشد، غیرفعال است. این مورد جفت‌سازی operator/browser/رابط کاربری کنترل/WebChat را به‌صورت خودکار تأیید نمی‌کند، و ارتقای نقش، دامنه، فراداده، یا کلید عمومی را هم به‌صورت خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی سراسری allow/deny برای فرمان‌های node اعلام‌شده پس از جفت‌سازی و ارزیابی فهرست مجاز پلتفرم. از `allowCommands` برای فعال‌کردن فرمان‌های خطرناک node مانند `camera.snap`، `camera.clip`، و `screen.record` استفاده کنید؛ `denyCommands` یک فرمان را حذف می‌کند حتی اگر پیش‌فرض پلتفرم یا اجازه صریح در غیر این صورت آن را شامل می‌شد. پس از اینکه یک node فهرست فرمان‌های اعلام‌شده خود را تغییر داد، جفت‌سازی آن دستگاه را رد و دوباره تأیید کنید تا gateway تصویر لحظه‌ای فرمانِ به‌روزشده را ذخیره کند.
- `gateway.tools.deny`: نام ابزارهای اضافی که برای HTTP `POST /tools/invoke` مسدود می‌شوند (فهرست منع پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام ابزارها را از فهرست منع پیش‌فرض HTTP حذف می‌کند.

</Accordion>

### نقطه‌پایان‌های سازگار با OpenAI

- Chat Completions: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL در Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    فهرست‌های مجاز خالی به‌عنوان تنظیم‌نشده در نظر گرفته می‌شوند؛ برای غیرفعال‌کردن دریافت URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- هدر اختیاری سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای منشأهای HTTPS که کنترلشان می‌کنید تنظیم شود؛ نگاه کنید به [احراز هویت پراکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### جداسازی چندنمونه‌ای

چند gateway را روی یک میزبان با پورت‌ها و دایرکتوری‌های state یکتا اجرا کنید:

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

- `enabled`: خاتمه TLS را در شنونده gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده باشند، یک جفت گواهی/کلید خودامضاشده محلی را خودکار تولید می‌کند؛ فقط برای استفاده محلی/توسعه.
- `certPath`: مسیر فایل‌سیستم به فایل گواهی TLS.
- `keyPath`: مسیر فایل‌سیستم به فایل کلید خصوصی TLS؛ دسترسی آن را محدود نگه دارید.
- `caPath`: مسیر اختیاری bundle مرجع CA برای راستی‌آزمایی کلاینت یا زنجیره‌های اعتماد سفارشی.

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
  - `"restart"`: همیشه هنگام تغییر پیکربندی، فرایند gateway را دوباره راه‌اندازی کن.
  - `"hot"`: تغییرات را بدون راه‌اندازی مجدد درون فرایند اعمال کن.
  - `"hybrid"` (پیش‌فرض): ابتدا بارگذاری مجدد hot را امتحان کن؛ اگر لازم بود به راه‌اندازی مجدد fallback کن.
- `debounceMs`: پنجره debounce بر حسب ms پیش از اعمال تغییرات پیکربندی (عدد صحیح نامنفی).
- `deferralTimeoutMs`: بیشینه زمان اختیاری بر حسب ms برای انتظار جهت عملیات‌های در حال اجرا پیش از اجبار به راه‌اندازی مجدد. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای درباره همچنان در انتظار بودن، `0` تنظیم کنید.

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
توکن‌های hook در query-string رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به یک `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید از `gateway.auth.token` **متمایز** باشد؛ استفادهٔ دوباره از توکن Gateway رد می‌شود.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیربخش اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` باشد، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا preset از `sessionKey` قالب‌دار استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این اعلام رضایت نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط زمانی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقادیر `sessionKey` نگاشت که با قالب رندر شده‌اند، به‌عنوان مقادیر ارائه‌شده از بیرون در نظر گرفته می‌شوند و آن‌ها نیز به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="Mapping details">

- `match.path` زیربخش پس از `/hooks` را تطبیق می‌دهد (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` یک فیلد payload را برای مسیرهای عمومی تطبیق می‌دهد.
- قالب‌هایی مانند `{{messages[0].subject}}` از payload می‌خوانند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش hook برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و داخل `hooks.transformsDir` بماند (مسیرهای مطلق و پیمایش مسیر رد می‌شوند).
- `agentId` به یک agent مشخص مسیریابی می‌کند؛ شناسه‌های ناشناخته به پیش‌فرض بازمی‌گردند.
- `allowedAgentIds`: مسیریابی صریح را محدود می‌کند (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید session ثابت اختیاری برای اجرای agent مربوط به hook بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای session نگاشت مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: فهرست مجاز پیشوندهای اختیاری برای مقادیر صریح `sessionKey` (درخواست + نگاشت)، مثلاً `["hook:"]`. وقتی هر نگاشت یا preset از `sessionKey` قالب‌دار استفاده کند، این مورد الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ `channel` به‌صورت پیش‌فرض `last` است.
- `model` مدل LLM را برای این اجرای hook بازنویسی می‌کند (اگر کاتالوگ مدل تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- preset داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر این مسیریابی به‌ازای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را به‌گونه‌ای محدود کنید که با namespace مربوط به Gmail همخوان باشد، برای مثال `["hook:", "hook:gmail:"]`.
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

- Gateway هنگام راه‌اندازی، در صورت پیکربندی، `gog gmail watch serve` را به‌طور خودکار اجرا می‌کند. برای غیرفعال‌سازی، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
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

- HTML/CSS/JS قابل ویرایش توسط agent و A2UI را از طریق HTTP زیر پورت Gateway ارائه می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- اتصال‌های غیر loopback: مسیرهای canvas به احراز هویت Gateway نیاز دارند (توکن/گذرواژه/پراکسی مورد اعتماد)، همانند سایر سطوح HTTP مربوط به Gateway.
- WebViewهای Node معمولاً سرآیندهای احراز هویت را ارسال نمی‌کنند؛ پس از جفت‌سازی و اتصال یک node، Gateway نشانی‌های قابلیت با دامنهٔ node را برای دسترسی به canvas/A2UI اعلام می‌کند.
- نشانی‌های قابلیت به نشست فعال WS مربوط به node متصل‌اند و خیلی زود منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت live-reload را به HTML ارائه‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را به‌طور خودکار ایجاد می‌کند.
- همچنین A2UI را در `/__openclaw__/a2ui/` ارائه می‌کند.
- تغییرات به راه‌اندازی دوبارهٔ gateway نیاز دارند.
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
- `full`: `cliPath` + `sshPort` را شامل می‌شود.
- وقتی hostname سیستم یک برچسب معتبر DNS باشد، hostname به‌صورت پیش‌فرض همان است؛ در غیر این صورت به `openclaw` بازمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` بازنویسی کنید.

### گسترهٔ وسیع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک zone تک‌پخشی DNS-SD را زیر `~/.openclaw/dns/` می‌نویسد. برای کشف میان شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + split DNS مربوط به Tailscale همراه کنید.

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

- متغیرهای env درون‌خطی فقط زمانی اعمال می‌شوند که env فرایند کلید را نداشته باشد.
- فایل‌های `.env`: `.env` در CWD + `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
- `shellEnv`: کلیدهای مورد انتظارِ موجود نبودن را از پروفایل login shell شما وارد می‌کند.
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

- فقط نام‌های حروف بزرگ تطبیق داده می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای موجود نبودن/خالی هنگام بارگذاری پیکربندی خطا می‌دهند.
- برای یک `${VAR}` لفظی، با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## Secrets

ارجاع‌های Secret افزایشی هستند: مقادیر plaintext همچنان کار می‌کنند.

### `SecretRef`

از یک شکل شیء استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی id برای `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id برای `source: "file"`: اشاره‌گر JSON مطلق (برای مثال `"/providers/openai/apiKey"`)
- الگوی id برای `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- idهای `source: "exec"` نباید قطعه‌های مسیرِ جداشده با اسلش شامل `.` یا `..` داشته باشند (برای مثال `a/../b` رد می‌شود)

### سطح credential پشتیبانی‌شده

- ماتریس canonical: [سطح credential برای SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای credential پشتیبانی‌شده در `openclaw.json` را هدف می‌گیرد.
- ارجاع‌های `auth-profiles.json` در پوشش resolve زمان اجرا و audit گنجانده می‌شوند.

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

نکات:

- ارائه‌دهنده `file` از `mode: "json"` و `mode: "singleValue"` پشتیبانی می‌کند (`id` در حالت singleValue باید `"value"` باشد).
- وقتی اعتبارسنجی ACL ویندوز در دسترس نباشد، مسیرهای ارائه‌دهنده file و exec به‌صورت fail closed شکست می‌خورند. `allowInsecurePath: true` را فقط برای مسیرهای مورد اعتمادی تنظیم کنید که قابل اعتبارسنجی نیستند.
- ارائه‌دهنده `exec` به یک مسیر `command` مطلق نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌صورت پیش‌فرض، مسیرهای فرمان symlink رد می‌شوند. برای مجاز کردن مسیرهای symlink همراه با اعتبارسنجی مسیر مقصد resolve‌شده، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی trusted-dir روی مسیر مقصد resolve‌شده اعمال می‌شود.
- محیط child برای `exec` به‌صورت پیش‌فرض حداقلی است؛ متغیرهای مورد نیاز را صراحتا با `passEnv` عبور دهید.
- ارجاع‌های Secret در زمان activation به یک snapshot درون‌حافظه‌ای resolve می‌شوند، سپس مسیرهای request فقط snapshot را می‌خوانند.
- فیلترکردن active-surface هنگام activation اعمال می‌شود: ارجاع‌های resolve‌نشده روی سطح‌های فعال باعث شکست startup/reload می‌شوند، در حالی که سطح‌های غیرفعال با diagnostics رد می‌شوند.

---

## ذخیره‌سازی auth

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
- `auth-profiles.json` برای حالت‌های credential ایستا از ارجاع‌های سطح مقدار (`keyRef` برای `api_key`، و `tokenRef` برای `token`) پشتیبانی می‌کند.
- mapهای flat قدیمی در `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` فرمت زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را به پروفایل‌های canonical کلید API با `provider:default` بازنویسی می‌کند و یک نسخه پشتیبان `.legacy-flat.*.bak` می‌سازد.
- پروفایل‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از credentialهای auth-profile مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- credentialهای ایستای زمان اجرا از snapshotهای resolve‌شده درون‌حافظه‌ای می‌آیند؛ ورودی‌های قدیمی ایستای `auth.json` هنگام کشف پاک‌سازی می‌شوند.
- واردسازی‌های قدیمی OAuth از `~/.openclaw/credentials/oauth.json` انجام می‌شوند.
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

- `billingBackoffHours`: backoff پایه بر حسب ساعت وقتی یک پروفایل به‌دلیل خطاهای واقعی
  billing/insufficient-credit شکست می‌خورد (پیش‌فرض: `5`). متن صریح billing
  همچنان می‌تواند حتی روی پاسخ‌های `401`/`403` اینجا قرار بگیرد، اما
  تطبیق‌دهنده‌های متن مختص ارائه‌دهنده در محدوده همان ارائه‌دهنده‌ای می‌مانند
  که مالک آن‌هاست (برای مثال OpenRouter
  `Key limit exceeded`). پیام‌های retryable مربوط به پنجره مصرف HTTP `402` یا
  سقف هزینه organization/workspace به‌جای آن در مسیر `rate_limit`
  می‌مانند.
- `billingBackoffHoursByProvider`: overrideهای اختیاری بر اساس ارائه‌دهنده برای ساعت‌های backoff مربوط به billing.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی backoff مربوط به billing (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: backoff پایه بر حسب دقیقه برای شکست‌های با اطمینان بالا از نوع `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد backoff مربوط به `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجره rolling بر حسب ساعت که برای شمارنده‌های backoff استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: بیشینه rotationهای auth-profile هم‌ارائه‌دهنده برای خطاهای overloaded پیش از رفتن به model fallback (پیش‌فرض: `1`). شکل‌های provider-busy مانند `ModelNotReadyException` اینجا قرار می‌گیرند.
- `overloadedBackoffMs`: تاخیر ثابت پیش از retry کردن rotation برای ارائه‌دهنده/پروفایل overloaded (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: بیشینه rotationهای auth-profile هم‌ارائه‌دهنده برای خطاهای rate-limit پیش از رفتن به model fallback (پیش‌فرض: `1`). آن bucket مربوط به rate-limit شامل متن‌های provider-shaped مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، و `resource exhausted` است.

---

## Logging

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
- `maxFileBytes`: بیشینه اندازه فایل گزارش فعال، بر حسب بایت، پیش از چرخش فایل‌ها (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 مگابایت). OpenClaw تا پنج آرشیو شماره‌گذاری‌شده را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن بر اساس بهترین تلاش برای خروجی کنسول، گزارش‌های فایل، رکوردهای گزارش OTLP و متن ماندگارشده رونوشت نشست. `redactSensitive: "off"` فقط این سیاست عمومی گزارش/رونوشت را غیرفعال می‌کند؛ سطوح ایمنی UI/ابزار/تشخیصی همچنان پیش از انتشار، محرمانه‌ها را می‌پوشانند.

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

- `enabled`: کلید اصلی برای خروجی ابزاربندی (پیش‌فرض: `true`).
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی گزارش هدفمند را فعال می‌کنند (از وایلدکاردهایی مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانه سن بر حسب میلی‌ثانیه برای انتشار هشدارهای نشست گیرکرده، هنگامی که نشست در وضعیت پردازش باقی می‌ماند.
- `otel.enabled`: خط لوله خروجی‌گیری OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، کاتالوگ سیگنال و مدل حریم خصوصی، [خروجی‌گیری OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: URL گردآورنده برای خروجی‌گیری OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP ویژه هر سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال مقدار `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فراداده HTTP/gRPC اضافی که همراه درخواست‌های خروجی‌گیری OTel فرستاده می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: خروجی‌گیری ردگیری، سنجه‌ها یا گزارش را فعال می‌کند.
- `otel.sampleRate`: نرخ نمونه‌برداری ردگیری `0` تا `1`.
- `otel.flushIntervalMs`: بازه تخلیه دوره‌ای دورسنجی بر حسب میلی‌ثانیه.
- `otel.captureContent`: ضبط محتوای خام به‌صورت اختیاری برای ویژگی‌های span در OTEL. به‌طور پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را ضبط می‌کند؛ فرم شیء به شما اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs` و `systemPrompt` را به‌صراحت فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای تازه‌ترین ویژگی‌های آزمایشی ارائه‌دهنده span در GenAI. به‌طور پیش‌فرض، spanها برای سازگاری ویژگی قدیمی `gen_ai.system` را نگه می‌دارند؛ سنجه‌های GenAI از ویژگی‌های معنایی کران‌دار استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از قبل یک SDK سراسری OpenTelemetry را ثبت کرده‌اند. در این حالت OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را رد می‌کند، درحالی‌که شنونده‌های تشخیصی فعال می‌مانند.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطه پایانی ویژه هر سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
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

- `channel`: کانال انتشار برای نصب‌های npm/git — `"stable"`، `"beta"` یا `"dev"`.
- `checkOnStart`: هنگام شروع Gateway، به‌روزرسانی‌های npm را بررسی می‌کند (پیش‌فرض: `true`).
- `auto.enabled`: به‌روزرسانی خودکار پس‌زمینه را برای نصب‌های بسته فعال می‌کند (پیش‌فرض: `false`).
- `auto.stableDelayHours`: حداقل تأخیر بر حسب ساعت پیش از اعمال خودکار کانال پایدار (پیش‌فرض: `6`؛ بیشینه: `168`).
- `auto.stableJitterHours`: پنجره پراکندگی انتشار اضافی برای کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ بیشینه: `168`).
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

- `enabled`: دروازه قابلیت سراسری ACP (پیش‌فرض: `true`؛ برای پنهان کردن امکانات ارسال و ایجاد ACP روی `false` تنظیم کنید).
- `dispatch.enabled`: دروازه مستقل برای ارسال نوبت نشست ACP (پیش‌فرض: `true`). برای در دسترس نگه داشتن فرمان‌های ACP همراه با مسدود کردن اجرا، روی `false` تنظیم کنید.
- `backend`: شناسه بک‌اند اجرای پیش‌فرض ACP (باید با یک Plugin اجرای ACP ثبت‌شده مطابقت داشته باشد).
  اگر `plugins.allow` تنظیم شده است، شناسه Plugin بک‌اند را بگنجانید (برای نمونه `acpx`) وگرنه Plugin پیش‌فرض همراه بارگذاری نخواهد شد.
- `defaultAgent`: شناسه عامل هدف ACP جایگزین، وقتی ایجادها هدف صریحی مشخص نکنند.
- `allowedAgents`: فهرست مجاز شناسه‌های عامل که برای نشست‌های اجرای ACP مجاز هستند؛ خالی بودن یعنی محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: بیشینه نشست‌های ACP فعال هم‌زمان.
- `stream.coalesceIdleMs`: پنجره تخلیه بیکار بر حسب میلی‌ثانیه برای متن جریانی.
- `stream.maxChunkChars`: بیشینه اندازه قطعه پیش از تقسیم کردن تصویرسازی بلوک جریانی.
- `stream.repeatSuppression`: خط‌های وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی جریان می‌دهد؛ `"final_only"` تا رویدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: بیشینه نویسه‌های خروجی دستیار که در هر نوبت ACP تصویرسازی می‌شوند.
- `stream.maxSessionUpdateChars`: بیشینه نویسه‌ها برای خط‌های وضعیت/به‌روزرسانی ACP تصویرسازی‌شده.
- `stream.tagVisibility`: نگاشتی از نام‌های برچسب به بازنویسی‌های نمایانی بولی برای رویدادهای جریانی.
- `runtime.ttlMinutes`: TTL بیکار بر حسب دقیقه برای کارگرهای نشست ACP پیش از واجد شرایط شدن برای پاک‌سازی.
- `runtime.installCommand`: فرمان نصب اختیاری که هنگام راه‌اندازی اولیه یک محیط اجرای ACP اجرا می‌شود.

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
  - `"default"`: شعار ثابت و خنثی (`All your chats, one OpenClaw.`).
  - `"off"`: بدون متن شعار (عنوان/نسخه بنر همچنان نمایش داده می‌شود).
- برای پنهان کردن کل بنر (نه فقط شعارها)، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## ویزارد

فراداده‌ای که توسط جریان‌های راه‌اندازی هدایت‌شده CLI (`onboard`، `configure`، `doctor`) نوشته می‌شود:

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

ساخت‌های فعلی دیگر پل TCP را شامل نمی‌شوند. Nodeها از طریق WebSocket Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از شِمای پیکربندی نیستند (اعتبارسنجی تا زمانی که حذف شوند شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت نگهداری نشست‌های اجرای ایزوله Cron تکمیل‌شده پیش از هرس از `sessions.json`. همچنین پاک‌سازی رونوشت‌های Cron حذف‌شده آرشیوشده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال کردن روی `false` تنظیم کنید.
- `runLog.maxBytes`: بیشینه اندازه هر فایل گزارش اجرا (`cron/runs/<jobId>.jsonl`) پیش از هرس. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: تازه‌ترین خط‌هایی که هنگام فعال شدن هرس گزارش اجرا نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن bearer که برای تحویل POST Webhook در Cron استفاده می‌شود (`delivery.mode = "webhook"`)، اگر حذف شود هیچ سرآیند احراز هویتی فرستاده نمی‌شود.
- `webhook`: URL Webhook جایگزین قدیمی و منسوخ (http/https) که فقط برای کارهای ذخیره‌شده‌ای استفاده می‌شود که هنوز `notify: true` دارند.

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

- `maxAttempts`: بیشینه تلاش‌های دوباره برای کارهای یک‌باره هنگام خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0` تا `10`).
- `backoffMs`: آرایه‌ای از تأخیرهای عقب‌نشینی بر حسب میلی‌ثانیه برای هر تلاش دوباره (پیش‌فرض: `[30000, 60000, 300000]`؛ ۱ تا ۱۰ ورودی).
- `retryOn`: نوع خطاهایی که تلاش دوباره را فعال می‌کنند — `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش دوباره روی همه انواع گذرا حذف کنید.

فقط برای کارهای Cron یک‌باره اعمال می‌شود. کارهای تکرارشونده از مدیریت شکست جداگانه استفاده می‌کنند.

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
- `after`: تعداد شکست‌های پیاپی پیش از فعال شدن یک هشدار (عدد صحیح مثبت، حداقل: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: اجراهای ردشده پیاپی را در آستانه هشدار حساب می‌کند (پیش‌فرض: `false`). اجراهای ردشده جداگانه ردیابی می‌شوند و بر عقب‌نشینی خطای اجرا اثر نمی‌گذارند.
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

- مقصد پیش‌فرض برای اعلان‌های شکست Cron در همهٔ کارها.
- `mode`: `"announce"` یا `"webhook"`؛ وقتی دادهٔ مقصد کافی وجود داشته باشد، پیش‌فرض `"announce"` است.
- `channel`: بازنویسی کانال برای تحویل announce. `"last"` آخرین کانال تحویل شناخته‌شده را دوباره استفاده می‌کند.
- `to`: مقصد صریح announce یا URL Webhook. برای حالت webhook الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- مقدار `delivery.failureDestination` در هر کار، این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست در سطح کار تنظیم شده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌شوند، هنگام شکست به همان مقصد اصلی announce برمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

[وظایف Cron](/fa/automation/cron-jobs) را ببینید. اجراهای Cron ایزوله به‌عنوان [وظایف پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای قالب مدل رسانه

جای‌نگهدارهای قالب که در `tools.media.models[].args` گسترش داده می‌شوند:

| متغیر             | توضیح                                           |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | متن کامل پیام ورودی                         |
| `{{RawBody}}`      | متن خام (بدون پوشش‌های تاریخچه/فرستنده)             |
| `{{BodyStripped}}` | متن با حذف اشاره‌های گروهی                 |
| `{{From}}`         | شناسهٔ فرستنده                                 |
| `{{To}}`           | شناسهٔ مقصد                            |
| `{{MessageSid}}`   | شناسهٔ پیام کانال                                |
| `{{SessionId}}`    | UUID نشست فعلی                              |
| `{{IsNewSession}}` | وقتی نشست جدید ایجاد شده باشد `"true"`                 |
| `{{MediaUrl}}`     | شبه-URL رسانهٔ ورودی                          |
| `{{MediaPath}}`    | مسیر رسانهٔ محلی                                  |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)               |
| `{{Transcript}}`   | رونوشت صوت                                  |
| `{{Prompt}}`       | پرامپت رسانهٔ حل‌شده برای ورودی‌های CLI             |
| `{{MaxChars}}`     | بیشینهٔ نویسه‌های خروجی حل‌شده برای ورودی‌های CLI         |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (در حد امکان)                       |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد امکان)               |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد امکان)                 |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد امکان)                 |
| `{{Provider}}`     | راهنمای Provider (whatsapp، telegram، discord و غیره) |

---

## گنجاندن‌های پیکربندی (`$include`)

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
- آرایه‌ای از فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شود (موارد بعدی، قبلی‌ها را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از includeها ادغام می‌شوند (مقادیر includeشده را بازنویسی می‌کنند).
- includeهای تو در تو: تا عمق ۱۰ سطح.
- مسیرها: نسبت به فایل includeکننده حل می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا (`dirname` مربوط به `openclaw.json`) بمانند. شکل‌های مطلق/`../` فقط وقتی مجاز هستند که همچنان داخل آن مرز حل شوند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالای پشتیبانی‌شده با include تک‌فایلی را تغییر می‌دهند، تغییر را در همان فایل includeشده می‌نویسند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- includeهای ریشه، آرایه‌های include و includeهایی با بازنویسی‌های هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط خواندنی هستند؛ این نوشتن‌ها به‌جای تخت‌کردن پیکربندی، به‌صورت بسته شکست می‌خورند.
- خطاها: پیام‌های روشن برای فایل‌های گم‌شده، خطاهای تجزیه و includeهای چرخه‌ای.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

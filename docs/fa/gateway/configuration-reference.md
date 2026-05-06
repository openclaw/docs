---
read_when:
    - به معناشناسی دقیق پیکربندی در سطح فیلد یا مقادیر پیش‌فرض نیاز دارید
    - در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای هسته‌ای OpenClaw، مقادیر پیش‌فرض، و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-05-06T11:58:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e5f7c2246b28f801d527437ae6242686998f1e8b75fd3977723d240a760d859
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی اصلی برای `~/.openclaw/openclaw.json`. برای یک نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی یک زیرسامانه مرجع عمیق‌تری از خودش دارد، به آن لینک می‌دهد. کاتالوگ‌های فرمان متعلق به کانال و Plugin و گزینه‌های عمیق حافظه/QMD به‌جای این صفحه، در صفحه‌های خودشان قرار دارند.

حقیقت کد:

- `openclaw config schema` طرح‌واره زنده JSON را که برای اعتبارسنجی و Control UI استفاده می‌شود چاپ می‌کند و در صورت موجود بودن، فراداده‌های bundled/plugin/channel را هم ادغام می‌کند
- `config.schema.lookup` یک گره طرح‌واره محدود به مسیر را برای ابزارهای بررسی عمیق برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش مبنای مستندات پیکربندی را در برابر سطح طرح‌واره فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی عامل: پیش از ویرایش‌ها، برای مستندات و محدودیت‌های دقیق در سطح فیلد از کنش ابزار `gateway` یعنی `config.schema.lookup` استفاده کنید. برای راهنمایی وظیفه‌محور از [پیکربندی](/fa/gateway/configuration) و برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها، و لینک‌ها به مراجع زیرسامانه‌ها از این صفحه استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations`، و پیکربندی dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [فرمان‌های Slash](/fa/tools/slash-commands) برای کاتالوگ فعلی فرمان‌های built-in + bundled
- صفحه‌های مالک کانال/Plugin برای سطوح فرمان اختصاصی کانال

قالب پیکربندی **JSON5** است (کامنت و ویرگول انتهایی مجاز است). همه فیلدها اختیاری‌اند - OpenClaw هنگام حذف شدن آن‌ها از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به یک صفحه اختصاصی منتقل شده‌اند - برای `channels.*`، از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و دیگر کانال‌های bundled (احراز هویت، کنترل دسترسی، چندحسابی، و gating برای mention)، [پیکربندی - کانال‌ها](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های عامل، چندعاملی، نشست‌ها، و پیام‌ها

به یک صفحه اختصاصی منتقل شده است - برای موارد زیر [پیکربندی - عامل‌ها](/fa/gateway/config-agents) را ببینید:

- `agents.defaults.*` (workspace، model، thinking، heartbeat، memory، media، skills، sandbox)
- `multiAgent.*` (مسیریابی و bindingهای چندعاملی)
- `session.*` (چرخه عمر نشست، Compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر Markdown)
- `talk.*` (حالت Talk)
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk روی iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال رونویسی، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، سوییچ‌های آزمایشی، پیکربندی ابزار مبتنی بر ارائه‌دهنده، و راه‌اندازی ارائه‌دهنده سفارشی / base-URL به یک صفحه اختصاصی منتقل شده‌اند - [پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools) را ببینید.

## مدل‌ها

تعریف‌های ارائه‌دهنده، allowlistهای مدل، و راه‌اندازی ارائه‌دهنده سفارشی در [پیکربندی - ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند.
ریشه `models` رفتار سراسری کاتالوگ مدل را هم در اختیار دارد.

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
- `models.pricing.enabled`: bootstrap قیمت‌گذاری پس‌زمینه را کنترل می‌کند که پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد، Gateway دریافت‌های کاتالوگ قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقادیر پیکربندی‌شده `models.providers.*.models[].cost` همچنان برای برآوردهای هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط Pi توکار و دیگر آداپتورهای زمان اجرا مصرف می‌شوند. فرمان‌های `openclaw mcp list`، `show`، `set`، و `unset` این بلوک را بدون اتصال به سرور هدف در زمان ویرایش پیکربندی مدیریت می‌کنند.

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

- `mcp.servers`: تعریف‌های نام‌گذاری‌شده سرور MCP از نوع stdio یا remote برای runtimeهایی که ابزارهای MCP پیکربندی‌شده را ارائه می‌کنند.
  ورودی‌های remote از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛
  `type: "http"` یک نام مستعار بومی CLI است که `openclaw mcp set` و
  `openclaw doctor --fix` آن را به فیلد canonical `transport` نرمال‌سازی می‌کنند.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای runtimeهای bundled MCP محدود به نشست.
  اجراهای توکار یک‌باره، پاک‌سازی پایان اجرا را درخواست می‌کنند؛ این TTL پشتیبان نشست‌های بلندمدت و فراخواننده‌های آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP نشست cache‌شده، به‌صورت hot-apply اعمال می‌شوند.
  کشف/استفاده بعدی ابزار آن‌ها را از پیکربندی جدید دوباره می‌سازد، بنابراین ورودی‌های حذف‌شده `mcp.servers` به‌جای انتظار برای TTL بیکاری، بلافاصله جمع‌آوری می‌شوند.

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

- `allowBundled`: allowlist اختیاری فقط برای Skillsهای bundled (Skillsهای managed/workspace تحت‌تأثیر قرار نمی‌گیرند).
- `load.extraDirs`: ریشه‌های shared اضافی Skills (کمترین تقدم).
- `install.preferBrew`: وقتی true باشد، اگر `brew` موجود باشد، پیش از fallback به انواع نصب‌کننده دیگر، نصب‌کننده‌های Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح نصب‌کننده Node برای specهای `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` یک skill را حتی اگر bundled/installed باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بر برای Skillsهایی که یک متغیر محیطی اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

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
- Discovery، Pluginهای بومی OpenClaw به‌علاوه bundleهای سازگار Codex و bundleهای Claude را می‌پذیرد، از جمله bundleهای layout پیش‌فرض Claude بدون manifest.
- **تغییرات پیکربندی به راه‌اندازی مجدد gateway نیاز دارد.**
- `allow`: allowlist اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` اولویت دارد.
- `bundledDiscovery`: برای پیکربندی‌های جدید به‌صورت پیش‌فرض `"allowlist"` است، بنابراین `plugins.allow` غیرخالی، Pluginهای ارائه‌دهنده bundled، از جمله ارائه‌دهندگان runtime جست‌وجوی وب را نیز gate می‌کند. Doctor برای پیکربندی‌های allowlist قدیمی مهاجرت‌داده‌شده `"compat"` می‌نویسد تا رفتار موجود ارائه‌دهنده bundled را تا زمانی که opt in کنید حفظ کند.
- `plugins.entries.<id>.apiKey`: فیلد میان‌بر کلید API در سطح Plugin (وقتی توسط Plugin پشتیبانی شود).
- `plugins.entries.<id>.env`: نگاشت متغیر محیطی محدود به Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، core `before_prompt_build` را مسدود می‌کند و فیلدهای تغییر‌دهنده prompt از `before_agent_start` قدیمی را نادیده می‌گیرد، در حالی که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. برای hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط bundleهای پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیر-bundled مورد اعتماد می‌توانند محتوای خام مکالمه را از hookهای typed مانند `llm_input`، `llm_output`، `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `before_agent_finalize`، و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌صراحت به این Plugin اعتماد می‌کند تا برای اجراهای subagent پس‌زمینه، overrideهای `provider` و `model` در هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist اختیاری از هدف‌های canonical `provider/model` برای overrideهای subagent مورد اعتماد. فقط وقتی عمدا می‌خواهید هر مدلی را مجاز کنید از `"*"` استفاده کنید.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (در صورت موجود بودن، با طرح‌واره Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/زمان اجرای Plugin کانال زیر `channels.<id>` قرار دارند و باید با فراداده `channelConfigs` در manifest Plugin مالک توصیف شوند، نه با یک registry گزینه مرکزی OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: تنظیمات ارائه‌دهنده web-fetch مربوط به Firecrawl.
  - `apiKey`: کلید API Firecrawl (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، `tools.web.fetch.firecrawl.apiKey` قدیمی، یا متغیر محیطی `FIRECRAWL_API_KEY` fallback می‌کند.
  - `baseUrl`: نشانی پایه API Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای self-hosted باید endpointهای خصوصی/داخلی را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی صفحه‌ها را استخراج می‌کند (پیش‌فرض: `true`).
  - `maxAgeMs`: بیشینه عمر cache بر حسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: timeout درخواست scrape بر حسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جست‌وجوی وب Grok).
  - `enabled`: ارائه‌دهنده X Search را فعال می‌کند.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مثلا `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات memory dreaming. برای فازها و آستانه‌ها [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: سوییچ اصلی dreaming (پیش‌فرض `false`).
  - `frequency`: cadence کرون برای هر پیمایش کامل dreaming (به‌صورت پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent مربوط به Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن هدف‌ها با `allowedModels` همراه کنید. خطاهای در دسترس نبودن مدل یک بار با مدل پیش‌فرض نشست retry می‌شوند؛ شکست‌های trust یا allowlist به‌صورت خاموش fallback نمی‌کنند.
  - سیاست فاز و آستانه‌ها جزئیات پیاده‌سازی‌اند (کلیدهای پیکربندی قابل مشاهده برای کاربر نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای bundle شده Claude که فعال باشند، می‌توانند از `settings.json` پیش‌فرض‌های Pi توکار نیز ارائه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات پاک‌سازی‌شده عامل اعمال می‌کند، نه به‌عنوان patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه `"none"` را بگذارید.
- `plugins.slots.contextEngine`: شناسه Plugin فعال context engine را انتخاب کنید؛ مگر اینکه engine دیگری نصب و انتخاب کنید، پیش‌فرض `"legacy"` است.

[Pluginها](/fa/tools/plugin) را ببینید.

---

## تعهدها

`commitments` حافظه follow-up استنباط‌شده را کنترل می‌کند: OpenClaw می‌تواند check-inها را از turnهای مکالمه تشخیص دهد و آن‌ها را از طریق اجراهای Heartbeat تحویل دهد.

- `commitments.enabled`: استخراج، ذخیره‌سازی، و تحویل Heartbeat مخفی LLM را برای تعهدهای follow-up استنباط‌شده فعال می‌کند. پیش‌فرض: `false`.
- `commitments.maxPerDay`: بیشینه تعهدهای follow-up استنباط‌شده که در یک روز rolling برای هر نشست عامل تحویل داده می‌شوند. پیش‌فرض: `3`.

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
- `tabCleanup` تب‌های ردیابی‌شده‌ی عامل اصلی را پس از زمان بیکاری یا وقتی یک
  نشست از سقف خود فراتر می‌رود، بازپس می‌گیرد. برای غیرفعال کردن این حالت‌های
  پاک‌سازی جداگانه، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین پیمایش مرورگر به‌صورت پیش‌فرض سخت‌گیرانه می‌ماند.
- فقط وقتی عمداً به پیمایش مرورگر در شبکه‌ی خصوصی اعتماد دارید، `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید.
- در حالت سخت‌گیرانه، نقاط پایانی پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترس‌پذیری/کشف، مشمول همان مسدودسازی شبکه‌ی خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- پروفایل‌های راه‌دور فقط پیوستنی هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl` مقدارهای `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند، از HTTP(S) استفاده کنید؛
  وقتی ارائه‌دهنده‌ی شما URL مستقیم WebSocket ابزارهای توسعه را می‌دهد، از WS(S)
  استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترس‌پذیری CDP راه‌دور و
  `attachOnly`، به‌علاوه درخواست‌های باز کردن تب اعمال می‌شوند. پروفایل‌های loopback
  مدیریت‌شده، پیش‌فرض‌های CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP مدیریت‌شده‌ی بیرونی از طریق loopback در دسترس است، برای آن
  پروفایل `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw درگاه loopback را به‌عنوان یک
  پروفایل مرورگر مدیریت‌شده‌ی محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت درگاه محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل پیوست شوند.
- پروفایل‌های `existing-session` می‌توانند برای هدف‌گیری یک پروفایل مرورگر
  مبتنی بر Chromium مانند Brave یا Edge، مقدار `userDataDir` را تنظیم کنند.
- پروفایل‌های `existing-session` محدودیت‌های مسیر فعلی Chrome MCP را حفظ می‌کنند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری انتخابگر CSS، هوک‌های بارگذاری
  یک‌فایلی، نبود بازنویسی مهلت‌زمان گفت‌وگو، نبود `wait --load networkidle`، و نبود
  `responsebody`، خروجی PDF، رهگیری دانلود، یا کنش‌های دسته‌ای.
- پروفایل‌های `openclaw` مدیریت‌شده‌ی محلی، `cdpPort` و `cdpUrl` را به‌صورت خودکار تخصیص می‌دهند؛ فقط
  برای CDP راه‌دور، `cdpUrl` را صریح تنظیم کنید.
- پروفایل‌های مدیریت‌شده‌ی محلی می‌توانند برای بازنویسی `browser.executablePath` سراسری
  برای همان پروفایل، `executablePath` را تنظیم کنند. از این برای اجرای یک پروفایل در
  Chrome و پروفایل دیگر در Brave استفاده کنید.
- پروفایل‌های مدیریت‌شده‌ی محلی پس از شروع فرایند، برای کشف HTTP مربوط به Chrome CDP از
  `browser.localLaunchTimeoutMs` و برای آماده‌بودن websocket مربوط به CDP پس از اجرا از
  `browser.localCdpReadyTimeoutMs` استفاده می‌کنند. روی میزبان‌های کندتر که Chrome
  با موفقیت شروع می‌شود اما بررسی‌های آمادگی با شروع هم‌زمان می‌شوند، آن‌ها را افزایش دهید. هر دو مقدار باید
  عدد صحیح مثبت تا `120000` میلی‌ثانیه باشند؛ مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را برای پوشه‌ی خانه‌ی سیستم‌عامل شما پیش از اجرای Chromium می‌پذیرند.
  `userDataDir` برای هر پروفایل در پروفایل‌های `existing-session` نیز با tilde بسط داده می‌شود.
- سرویس کنترل: فقط loopback (درگاه مشتق‌شده از `gateway.port`، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های اجرای اضافی را به شروع محلی Chromium اضافه می‌کند (برای مثال
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

- `seamColor`: رنگ تأکیدی برای قاب رابط کاربری برنامه‌ی بومی (ته‌رنگ حباب حالت گفت‌وگو و غیره).
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
- `port`: پورت چندراههٔ واحد برای WS + HTTP. ترتیب اولویت: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP در Tailscale)، یا `custom`.
- **نام‌های مستعار bind قدیمی**: در `gateway.bind` از مقدارهای حالت bind (`auto`، `loopback`، `lan`، `tailnet`، `custom`) استفاده کنید، نه نام‌های مستعار میزبان (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **نکتهٔ Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکهٔ bridge در Docker (`-p 18789:18789`)، ترافیک از `eth0` وارد می‌شود، بنابراین Gateway در دسترس نیست. از `--network host` استفاده کنید، یا `bind: "lan"` (یا `bind: "custom"` با `customBindHost: "0.0.0.0"`) را تنظیم کنید تا روی همهٔ واسط‌ها گوش دهد.
- **احراز هویت**: به‌صورت پیش‌فرض الزامی است. bindهای غیر loopback به احراز هویت Gateway نیاز دارند. در عمل یعنی یک توکن/گذرواژهٔ مشترک یا یک پروکسی معکوس آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. راهنمای آغازبه‌کار به‌صورت پیش‌فرض یک توکن تولید می‌کند.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefs)، `gateway.auth.mode` را صریحاً روی `token` یا `password` تنظیم کنید. جریان‌های شروع به کار و نصب/تعمیر سرویس وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای راه‌اندازی‌های قابل‌اعتماد local loopback استفاده کنید؛ این مورد عمداً در اعلان‌های آغازبه‌کار ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک پروکسی معکوس آگاه از هویت واگذار کنید و به سرآیندهای هویت از `gateway.trustedProxies` اعتماد کنید (نگاه کنید به [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)). این حالت به‌صورت پیش‌فرض انتظار یک منبع پروکسی **غیر loopback** دارد؛ پروکسی‌های معکوس same-host loopback به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی same-host می‌توانند از `gateway.auth.password` به‌عنوان جایگزین مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، سرآیندهای هویت Tailscale Serve می‌توانند احراز هویت رابط کاربری کنترل/WebSocket را برآورده کنند (از طریق `tailscale whois` تأیید می‌شود). نقطه‌های پایانی HTTP API از آن احراز هویت سرآیند Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت عادی احراز هویت HTTP Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway قابل‌اعتماد است. وقتی `tailscale.mode = "serve"` باشد، پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکنندهٔ اختیاری برای احراز هویت ناموفق. به‌ازای هر IP مشتری و هر دامنهٔ احراز هویت اعمال می‌شود (shared-secret و device-token مستقل ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر ناهمگام رابط کاربری کنترل Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست، ترتیبی می‌شوند. بنابراین تلاش‌های بد همزمان از همان مشتری می‌توانند در درخواست دوم محدودکننده را فعال کنند، به‌جای اینکه هر دو به‌صورت عدم‌تطابق ساده از آن عبور کنند.
  - `gateway.auth.rateLimit.exemptLoopback` به‌صورت پیش‌فرض `true` است؛ وقتی عمداً می‌خواهید ترافیک localhost هم محدود نرخ شود (برای راه‌اندازی‌های آزمایشی یا استقرارهای پروکسی سخت‌گیرانه)، آن را روی `false` بگذارید.
- تلاش‌های احراز هویت WS با مبدأ مرورگر همیشه با غیرفعال بودن معافیت loopback محدود نرخ می‌شوند (دفاع عمیق در برابر حملهٔ brute force مبتنی بر مرورگر روی localhost).
- روی loopback، آن قفل‌شدن‌های مبدأ مرورگر به‌ازای هر مقدار نرمال‌سازی‌شدهٔ `Origin`
  جدا می‌شوند، بنابراین شکست‌های تکراری از یک مبدأ localhost به‌صورت خودکار
  مبدأ دیگری را قفل نمی‌کند.
- `tailscale.mode`: `serve` (فقط tailnet، bind به loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `controlUi.allowedOrigins`: allowlist صریح مبدأ مرورگر برای اتصال‌های WebSocket به Gateway. وقتی انتظار می‌رود مشتریان مرورگر از مبدأهای غیر loopback باشند، الزامی است.
- `controlUi.chatMessageMaxWidth`: حداکثر عرض اختیاری برای پیام‌های گفت‌وگوی گروه‌بندی‌شدهٔ رابط کاربری کنترل. مقدارهای محدودشدهٔ عرض CSS مانند `960px`، `82%`، `min(1280px, 82%)` و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناکی که fallback مبدأ مبتنی بر سرآیند Host را برای استقرارهایی فعال می‌کند که عمداً به سیاست مبدأ مبتنی بر سرآیند Host متکی هستند.
- `remote.transport`: `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، `remote.url` باید `ws://` یا `wss://` باشد.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: دورزدن اضطراری سمت مشتری در محیط فرایند
  که اجازه می‌دهد `ws://` متنی ساده به IPهای قابل‌اعتماد شبکهٔ خصوصی استفاده شود؛
  پیش‌فرض برای متن ساده همچنان فقط loopback است. هیچ معادل `openclaw.json`
  وجود ندارد، و پیکربندی شبکهٔ خصوصی مرورگر مانند
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` روی مشتریان WebSocket
  Gateway اثری ندارد.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامهٔ مشتری راه‌دور هستند. آن‌ها به‌تنهایی احراز هویت Gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: URL پایهٔ HTTPS برای relay خارجی APNs که buildهای رسمی/TestFlight iOS پس از انتشار ثبت‌نام‌های relay-backed در Gateway از آن استفاده می‌کنند. این URL باید با URL relay کامپایل‌شده داخل build iOS مطابقت داشته باشد.
- `gateway.push.apns.relay.timeoutMs`: زمان‌انتظار ارسال Gateway به relay بر حسب میلی‌ثانیه. پیش‌فرض `10000` است.
- ثبت‌نام‌های relay-backed به یک هویت مشخص Gateway واگذار می‌شوند. برنامهٔ iOS جفت‌شده `gateway.identity.get` را دریافت می‌کند، آن هویت را در ثبت‌نام relay قرار می‌دهد، و یک مجوز ارسال scoped به ثبت‌نام را به Gateway ارسال می‌کند. Gateway دیگری نمی‌تواند آن ثبت‌نام ذخیره‌شده را دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه فرار فقط مخصوص توسعه برای URLهای relay روی HTTP loopback. URLهای relay در تولید باید روی HTTPS بمانند.
- `gateway.handshakeTimeoutMs`: زمان‌انتظار handshake WebSocket پیش از احراز هویت Gateway بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد اولویت دارد. این مقدار را روی میزبان‌های پربار یا کم‌قدرتی افزایش دهید که مشتریان محلی می‌توانند در حالی وصل شوند که گرم‌شدن شروع به کار هنوز در حال پایدار شدن است.
- `gateway.channelHealthCheckMinutes`: بازهٔ پایش سلامت کانال بر حسب دقیقه. برای غیرفعال کردن سراسری راه‌اندازی مجددهای پایش سلامت، روی `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانهٔ stale-socket بر حسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: بیشینهٔ راه‌اندازی مجددهای پایش سلامت به‌ازای هر کانال/حساب در یک ساعت غلتان. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: انصراف به‌ازای هر کانال از راه‌اندازی مجددهای پایش سلامت، در حالی که پایشگر سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override به‌ازای هر حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر override سطح کانال اولویت دارد.
- مسیرهای فراخوانی Gateway محلی فقط زمانی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صریحاً از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolve به‌صورت بسته شکست می‌خورد (بدون اینکه fallback راه‌دور آن را پنهان کند).
- `trustedProxies`: IPهای پروکسی معکوس که TLS را خاتمه می‌دهند یا سرآیندهای forwarded-client تزریق می‌کنند. فقط پروکسی‌هایی را فهرست کنید که کنترلشان می‌کنید. ورودی‌های loopback همچنان برای راه‌اندازی‌های تشخیص محلی/پروکسی same-host معتبرند (برای مثال Tailscale Serve یا یک پروکسی معکوس محلی)، اما آن‌ها درخواست‌های loopback را واجد شرایط `gateway.auth.mode: "trusted-proxy"` نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` وجود نداشته باشد Gateway `X-Real-IP` را می‌پذیرد. پیش‌فرض `false` است تا رفتار fail-closed باشد.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای تأیید خودکار جفت‌سازی نخستین‌بار دستگاه Node بدون scopeهای درخواستی. وقتی تنظیم نشده باشد غیرفعال است. این مورد جفت‌سازی operator/browser/Control UI/WebChat را خودکار تأیید نمی‌کند، و ارتقای role، scope، metadata یا public-key را هم خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی سراسری allow/deny برای فرمان‌های اعلام‌شدهٔ Node پس از جفت‌سازی و ارزیابی allowlist پلتفرم. از `allowCommands` برای پذیرش فرمان‌های خطرناک Node مانند `camera.snap`، `camera.clip` و `screen.record` استفاده کنید؛ `denyCommands` یک فرمان را حذف می‌کند حتی اگر پیش‌فرض پلتفرم یا allow صریح در حالت دیگر آن را شامل می‌شد. پس از اینکه یک Node فهرست فرمان‌های اعلام‌شدهٔ خود را تغییر داد، آن جفت‌سازی دستگاه را رد و دوباره تأیید کنید تا Gateway snapshot فرمان به‌روزشده را ذخیره کند.
- `gateway.tools.deny`: نام‌های ابزار اضافی که برای HTTP `POST /tools/invoke` مسدود می‌شوند (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام‌های ابزار را از فهرست deny پیش‌فرض HTTP حذف می‌کند.

</Accordion>

### نقطه‌های پایانی سازگار با OpenAI

- Chat Completions: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی URL-input برای Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی تنظیم‌نشده تلقی می‌شوند؛ برای غیرفعال کردن دریافت URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- سرآیند سخت‌سازی اختیاری پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای مبدأهای HTTPS که کنترلشان می‌کنید تنظیم کنید؛ نگاه کنید به [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### جداسازی چندنمونه‌ای

چند Gateway را روی یک میزبان با پورت‌ها و دایرکتوری‌های state یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

پرچم‌های میانبر: `--dev` (از `~/.openclaw-dev` + پورت `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

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

- `enabled`: خاتمهٔ TLS را در listener Gateway (HTTPS/WSS) فعال می‌کند (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده‌اند، یک جفت cert/key محلی خودامضاشده تولید می‌کند؛ فقط برای استفادهٔ محلی/توسعه.
- `certPath`: مسیر فایل‌سیستم به فایل گواهی TLS.
- `keyPath`: مسیر فایل‌سیستم به فایل کلید خصوصی TLS؛ دسترسی آن را محدود نگه دارید.
- `caPath`: مسیر اختیاری bundle مربوط به CA برای تأیید مشتری یا زنجیره‌های اعتماد سفارشی.

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

- `mode`: کنترل می‌کند ویرایش‌های پیکربندی چگونه در زمان اجرا اعمال شوند.
  - `"off"`: ویرایش‌های زنده را نادیده می‌گیرد؛ تغییرات به راه‌اندازی مجدد صریح نیاز دارند.
  - `"restart"`: همیشه هنگام تغییر پیکربندی، فرایند Gateway را راه‌اندازی مجدد می‌کند.
  - `"hot"`: تغییرات را بدون راه‌اندازی مجدد، درون فرایند اعمال می‌کند.
  - `"hybrid"` (پیش‌فرض): ابتدا hot reload را امتحان می‌کند؛ اگر لازم باشد به راه‌اندازی مجدد fallback می‌کند.
- `debounceMs`: پنجرهٔ debounce بر حسب ms پیش از اعمال تغییرات پیکربندی (عدد صحیح نامنفی).
- `deferralTimeoutMs`: حداکثر زمان اختیاری بر حسب ms برای انتظار عملیات‌های در حال اجرا پیش از اجبار به راه‌اندازی مجدد. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای still-pending، روی `0` تنظیم کنید.

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
- `hooks.token` باید از `gateway.auth.token` **متمایز** باشد؛ استفاده دوباره از توکن Gateway رد می‌شود.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیردرگاه اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا پیش‌تنظیم از `sessionKey` قالب‌بندی‌شده استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ثابت به این فعال‌سازی صریح نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط وقتی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقادیر `sessionKey` نگاشت که با قالب رندر شده‌اند، به‌عنوان مقادیر بیرونی تأمین‌شده در نظر گرفته می‌شوند و همچنین به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="Mapping details">

- `match.path` زیردرگاه پس از `/hooks` را تطبیق می‌دهد (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` یک فیلد payload را برای مسیرهای عمومی تطبیق می‌دهد.
- قالب‌هایی مانند `{{messages[0].subject}}` از payload خوانده می‌شوند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش hook برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و داخل `hooks.transformsDir` باقی بماند (مسیرهای مطلق و پیمایش مسیر رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های Skills در workspace رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transformهای hooks منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک عامل مشخص مسیریابی می‌کند؛ شناسه‌های ناشناخته به پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: مسیریابی صریح را محدود می‌کند (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید نشست ثابت اختیاری برای اجرای عامل hook بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای نشست نگاشتِ مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: فهرست مجاز اختیاری پیشوندها برای مقادیر `sessionKey` صریح (درخواست + نگاشت)، مثلاً `["hook:"]`. وقتی هر نگاشت یا پیش‌تنظیمی از `sessionKey` قالب‌بندی‌شده استفاده کند، این مورد الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ `channel` به‌طور پیش‌فرض `last` است.
- `model` برای این اجرای hook، LLM را بازنویسی می‌کند (اگر کاتالوگ مدل تنظیم شده باشد باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- پیش‌تنظیم داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر این مسیریابی به‌ازای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را برای تطبیق با فضای نام Gmail محدود کنید، برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، پیش‌تنظیم را به‌جای پیش‌فرض قالب‌بندی‌شده، با یک `sessionKey` ثابت بازنویسی کنید.

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

- Gateway هنگام راه‌اندازی، اگر پیکربندی شده باشد، `gog gmail watch serve` را به‌طور خودکار شروع می‌کند. برای غیرفعال‌سازی، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
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

- HTML/CSS/JS قابل‌ویرایش توسط عامل و A2UI را از طریق HTTP زیر درگاه Gateway ارائه می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- اتصال‌های غیر loopback: مسیرهای canvas مانند سایر سطوح HTTP Gateway به احراز هویت Gateway نیاز دارند (توکن/گذرواژه/trusted-proxy).
- WebViewهای Node معمولاً سرآیندهای احراز هویت ارسال نمی‌کنند؛ پس از جفت‌شدن و اتصال یک Node، Gateway نشانی‌های URL قابلیتِ محدود به Node را برای دسترسی canvas/A2UI اعلام می‌کند.
- نشانی‌های URL قابلیت به نشست فعال WS همان Node متصل‌اند و به‌سرعت منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت بارگذاری مجدد زنده را به HTML ارائه‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را به‌طور خودکار ایجاد می‌کند.
- A2UI را نیز در `/__openclaw__/a2ui/` ارائه می‌کند.
- تغییرات به راه‌اندازی مجدد Gateway نیاز دارند.
- بارگذاری مجدد زنده را برای دایرکتوری‌های بزرگ یا خطاهای `EMFILE` غیرفعال کنید.

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

- `minimal` (پیش‌فرض وقتی Plugin بسته‌بندی‌شده `bonjour` فعال باشد): `cliPath` + `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: شامل `cliPath` + `sshPort` می‌شود؛ تبلیغ multicast در LAN همچنان مستلزم فعال بودن Plugin بسته‌بندی‌شده `bonjour` است.
- `off`: تبلیغ multicast در LAN را بدون تغییر فعال‌سازی Plugin سرکوب می‌کند.
- Plugin بسته‌بندی‌شده `bonjour` روی میزبان‌های macOS به‌طور خودکار شروع می‌شود و روی Linux، Windows و استقرارهای Gateway کانتینری اختیاری است.
- نام میزبان وقتی یک برچسب DNS معتبر باشد، به‌طور پیش‌فرض نام میزبان سیستم است و در غیر این صورت به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` بازنویسی کنید.

### گسترده‌ناحیه (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک zone یک‌پخشی DNS-SD را زیر `~/.openclaw/dns/` می‌نویسد. برای کشف میان‌شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + Tailscale split DNS همراه کنید.

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

- متغیرهای env درون‌خطی فقط زمانی اعمال می‌شوند که env فرایند فاقد آن کلید باشد.
- فایل‌های `.env`: فایل `.env` در CWD + `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
- `shellEnv`: کلیدهای مورد انتظارِ موجودنبودن را از پروفایل پوسته ورود شما وارد می‌کند.
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

- فقط نام‌های حروف بزرگ منطبق می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای موجودنبودن/خالی هنگام بارگذاری پیکربندی خطا ایجاد می‌کنند.
- برای مقدار لفظی `${VAR}` با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## رازها

ارجاع‌های راز افزایشی هستند: مقادیر متن ساده همچنان کار می‌کنند.

### `SecretRef`

از یک شکل شیء استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی شناسه `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- شناسه `source: "file"`: اشاره‌گر JSON مطلق (برای مثال `"/providers/openai/apiKey"`)
- الگوی شناسه `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- شناسه‌های `source: "exec"` نباید بخش‌های مسیرِ جداشده با اسلش شامل `.` یا `..` داشته باشند (برای مثال `a/../b` رد می‌شود)

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

یادداشت‌ها:

- ارائه‌دهنده `file` از `mode: "json"` و `mode: "singleValue"` پشتیبانی می‌کند (`id` در حالت singleValue باید `"value"` باشد).
- مسیرهای ارائه‌دهنده فایل و exec وقتی اعتبارسنجی ACL ویندوز در دسترس نباشد، بسته و ناموفق می‌شوند. `allowInsecurePath: true` را فقط برای مسیرهای معتمدی تنظیم کنید که قابل اعتبارسنجی نیستند.
- ارائه‌دهنده `exec` به مسیر مطلق `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌طور پیش‌فرض، مسیرهای دستور symlink رد می‌شوند. برای اجازه‌دادن به مسیرهای symlink هنگام اعتبارسنجی مسیر هدف حل‌شده، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی دایرکتوری معتمد روی مسیر هدف حل‌شده اعمال می‌شود.
- محیط فرزند `exec` به‌طور پیش‌فرض حداقلی است؛ متغیرهای لازم را صراحتا با `passEnv` عبور دهید.
- ارجاع‌های راز هنگام فعال‌سازی به یک snapshot درون‌حافظه‌ای حل می‌شوند، سپس مسیرهای درخواست فقط همان snapshot را می‌خوانند.
- فیلترکردن سطح فعال در طول فعال‌سازی اعمال می‌شود: ارجاع‌های حل‌نشده روی سطح‌های فعال راه‌اندازی/بارگذاری دوباره را ناموفق می‌کنند، در حالی که سطح‌های غیرفعال با diagnostics نادیده گرفته می‌شوند.

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
- `auth-profiles.json` از ارجاع‌های سطح مقدار (`keyRef` برای `api_key`، و `tokenRef` برای `token`) برای حالت‌های اعتبارنامه ایستا پشتیبانی می‌کند.
- نگاشت‌های تخت قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را با یک پشتیبان `.legacy-flat.*.bak` به پروفایل‌های کلید API مرجع `provider:default` بازنویسی می‌کند.
- پروفایل‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های پروفایل احراز هویت مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های زمان اجرای ایستا از snapshotهای حل‌شده درون‌حافظه‌ای می‌آیند؛ ورودی‌های قدیمی ایستای `auth.json` هنگام کشف پاک‌سازی می‌شوند.
- واردسازی‌های قدیمی OAuth از `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: تأخیر پایه به ساعت هنگامی که یک پروفایل به دلیل خطاهای واقعی
  صورت‌حساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح صورت‌حساب
  همچنان می‌تواند حتی در پاسخ‌های `401`/`403` اینجا قرار بگیرد، اما
  تطبیق‌دهنده‌های متن ویژه ارائه‌دهنده در محدوده همان ارائه‌دهنده‌ای می‌مانند
  که مالک آن‌هاست (برای مثال OpenRouter
  `Key limit exceeded`). پیام‌های HTTP `402` قابل تلاش دوباره مربوط به بازه مصرف یا
  سقف هزینه سازمان/فضای کاری در عوض در مسیر `rate_limit`
  می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری برای هر ارائه‌دهنده برای ساعت‌های تأخیر صورت‌حساب.
- `billingMaxHours`: سقف به ساعت برای رشد نمایی تأخیر صورت‌حساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: تأخیر پایه به دقیقه برای شکست‌های `auth_permanent` با اطمینان بالا (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف به دقیقه برای رشد تأخیر `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجره چرخان به ساعت که برای شمارنده‌های تأخیر استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت همان ارائه‌دهنده برای خطاهای بارگذاری بیش از حد، پیش از رفتن به جایگزین مدل (پیش‌فرض: `1`). شکل‌های مشغول بودن ارائه‌دهنده مانند `ModelNotReadyException` اینجا قرار می‌گیرند.
- `overloadedBackoffMs`: تأخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/پروفایل بارگذاری‌شده بیش از حد (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: حداکثر چرخش‌های پروفایل احراز هویت همان ارائه‌دهنده برای خطاهای محدودیت نرخ، پیش از رفتن به جایگزین مدل (پیش‌فرض: `1`). آن سطل محدودیت نرخ شامل متن‌های با شکل ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، و `resource exhausted` است.

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
- `maxFileBytes`: بیشینه اندازه فایل گزارش فعال به بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 MB). OpenClaw تا پنج آرشیو شماره‌دار را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن با بهترین تلاش برای خروجی کنسول، گزارش‌های فایل، رکوردهای گزارش OTLP، و متن رونوشت نشست‌های پایدارشده. `redactSensitive: "off"` فقط این سیاست عمومی گزارش/رونوشت را غیرفعال می‌کند؛ سطح‌های ایمنی UI/ابزار/تشخیصی همچنان پیش از انتشار، رازها را حذف می‌کنند.

---

## تشخیص‌ها

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

- `enabled`: کلید اصلی برای خروجی ابزارسازی (پیش‌فرض: `true`).
- `flags`: آرایه‌ای از رشته‌های پرچم برای فعال کردن خروجی گزارش هدفمند (از wildcardهایی مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانه سن بدون پیشرفت به میلی‌ثانیه برای طبقه‌بندی نشست‌های پردازشی طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled`، یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک، و پیشرفت ACP زمان‌سنج را بازنشانی می‌کنند؛ تشخیص‌های تکراری `session.stuck` تا زمانی که بدون تغییر باشند با تأخیر بیشتر ارسال می‌شوند.
- `stuckSessionAbortMs`: آستانه سن بدون پیشرفت به میلی‌ثانیه پیش از آن‌که کار فعال متوقف‌شده واجد شرایط بتواند برای بازیابی با تخلیه لغو شود. وقتی تنظیم نشده باشد، OpenClaw از پنجره امن‌تر اجرای تعبیه‌شده گسترده‌شده، حداقل ۱۰ دقیقه و ۵ برابر `stuckSessionWarnMs`، استفاده می‌کند.
- `otel.enabled`: خط لوله خروجی OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، کاتالوگ سیگنال، و مدل حریم خصوصی، [خروجی OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: URL گردآورنده برای خروجی OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP ویژه سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال، `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فراداده اضافی HTTP/gRPC که همراه با درخواست‌های خروجی OTel ارسال می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: خروجی ردیابی، معیارها، یا گزارش را فعال می‌کند.
- `otel.sampleRate`: نرخ نمونه‌برداری ردیابی `0`-`1`.
- `otel.flushIntervalMs`: فاصله تخلیه دوره‌ای تله‌متری به میلی‌ثانیه.
- `otel.captureContent`: دریافت اختیاری محتوای خام برای ویژگی‌های span در OTEL. به‌صورت پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را دریافت می‌کند؛ شکل شیء به شما اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs`، و `systemPrompt` را صریح فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای تازه‌ترین ویژگی‌های آزمایشی ارائه‌دهنده span در GenAI. به‌صورت پیش‌فرض spanها برای سازگاری ویژگی قدیمی `gen_ai.system` را نگه می‌دارند؛ معیارهای GenAI از ویژگی‌های معنایی محدود استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از قبل یک SDK جهانی OpenTelemetry ثبت کرده‌اند. سپس OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را رد می‌کند، در حالی که شنونده‌های تشخیصی را فعال نگه می‌دارد.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`، و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطه پایانی ویژه سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: عکس‌های فوری ردیابی کش را برای اجراهای تعبیه‌شده ثبت می‌کند (پیش‌فرض: `false`).
- `cacheTrace.filePath`: مسیر خروجی برای JSONL ردیابی کش (پیش‌فرض: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: کنترل می‌کند چه چیزی در خروجی ردیابی کش گنجانده شود (همه به‌صورت پیش‌فرض: `true`).

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
- `auto.stableDelayHours`: حداقل تأخیر به ساعت پیش از اعمال خودکار کانال پایدار (پیش‌فرض: `6`؛ حداکثر: `168`).
- `auto.stableJitterHours`: پنجره پخش انتشار اضافی کانال پایدار به ساعت (پیش‌فرض: `12`؛ حداکثر: `168`).
- `auto.betaCheckIntervalHours`: هر چند ساعت یک بار بررسی‌های کانال بتا اجرا شوند (پیش‌فرض: `1`؛ حداکثر: `24`).

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

- `enabled`: دروازه سراسری قابلیت ACP (پیش‌فرض: `true`؛ برای پنهان کردن ارسال ACP و امکانات spawn مقدار `false` تنظیم کنید).
- `dispatch.enabled`: دروازه مستقل برای ارسال نوبت نشست ACP (پیش‌فرض: `true`). برای در دسترس نگه داشتن فرمان‌های ACP هم‌زمان با مسدود کردن اجرا، مقدار `false` تنظیم کنید.
- `backend`: شناسه پیش‌فرض backend زمان اجرای ACP (باید با یک Plugin زمان اجرای ACP ثبت‌شده مطابقت داشته باشد).
  ابتدا Plugin مربوط به backend را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسه Plugin مربوط به backend را وارد کنید (برای مثال `acpx`) وگرنه backend مربوط به ACP بارگذاری نمی‌شود.
- `defaultAgent`: شناسه agent هدف ACP برای fallback وقتی spawnها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: فهرست مجاز شناسه‌های agent که برای نشست‌های زمان اجرای ACP مجاز هستند؛ خالی بودن یعنی محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: حداکثر نشست‌های ACP فعال هم‌زمان.
- `stream.coalesceIdleMs`: پنجره تخلیه بیکار به میلی‌ثانیه برای متن جریانی.
- `stream.maxChunkChars`: بیشینه اندازه قطعه پیش از شکستن تصویر بلوک جریانی.
- `stream.repeatSuppression`: خط‌های وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی جریان می‌دهد؛ `"final_only"` تا رویدادهای پایانی نوبت buffer می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: بیشینه نویسه‌های خروجی دستیار که در هر نوبت ACP تصویر می‌شوند.
- `stream.maxSessionUpdateChars`: بیشینه نویسه‌ها برای خط‌های وضعیت/به‌روزرسانی ACP تصویرشده.
- `stream.tagVisibility`: رکوردی از نام‌های tag به بازنویسی‌های دیدپذیری بولی برای رویدادهای جریانی.
- `runtime.ttlMinutes`: TTL بیکار به دقیقه برای workerهای نشست ACP پیش از پاک‌سازی واجد شرایط.
- `runtime.installCommand`: فرمان نصب اختیاری که هنگام راه‌اندازی اولیه محیط زمان اجرای ACP اجرا می‌شود.

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
  - `"off"`: بدون متن tagline (عنوان/نسخه بنر همچنان نمایش داده می‌شود).
- برای پنهان کردن کل بنر (نه فقط taglineها)، متغیر محیطی `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## جادوگر

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

فیلدهای هویت `agents.list` را زیر [پیش‌فرض‌های agent](/fa/gateway/config-agents#agent-defaults) ببینید.

---

## Bridge (قدیمی، حذف‌شده)

ساخت‌های فعلی دیگر شامل bridge مربوط به TCP نیستند. Nodeها از طریق WebSocket مربوط به Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از طرح‌واره پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

<Accordion title="پیکربندی bridge قدیمی (مرجع تاریخی)">

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

- `sessionRetention`: مدت نگهداری نشست‌های اجرای Cron جداشده‌ی تکمیل‌شده پیش از پاک‌سازی از `sessions.json`. همچنین پاک‌سازی رونوشت‌های Cron حذف‌شده‌ی بایگانی‌شده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
- `runLog.maxBytes`: حداکثر اندازه برای هر فایل گزارش اجرا (`cron/runs/<jobId>.jsonl`) پیش از پاک‌سازی. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: تازه‌ترین خط‌هایی که هنگام فعال شدن پاک‌سازی گزارش اجرا حفظ می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن bearer که برای تحویل POST وب‌هوک Cron (`delivery.mode = "webhook"`) استفاده می‌شود؛ اگر حذف شود، هیچ هدر احراز هویتی ارسال نمی‌شود.
- `webhook`: URL وب‌هوک بازگشتی قدیمی و منسوخ‌شده (http/https) که فقط برای کارهای ذخیره‌شده‌ای استفاده می‌شود که هنوز `notify: true` دارند.

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
- `retryOn`: نوع خطاهایی که تلاش دوباره را فعال می‌کنند - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش دوباره روی همه‌ی انواع گذرا، آن را حذف کنید.

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
- `after`: تعداد شکست‌های پیاپی پیش از ارسال هشدار (عدد صحیح مثبت، حداقل: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای یک کار یکسان (عدد صحیح نامنفی).
- `includeSkipped`: اجراهای ردشده‌ی پیاپی را در آستانه‌ی هشدار حساب می‌کند (پیش‌فرض: `false`). اجراهای ردشده جداگانه ردیابی می‌شوند و روی backoff خطای اجرا اثر نمی‌گذارند.
- `mode`: حالت تحویل - `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به وب‌هوک پیکربندی‌شده پست می‌کند.
- `accountId`: شناسه‌ی اختیاری حساب یا کانال برای محدود کردن دامنه‌ی تحویل هشدار.

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

- مقصد پیش‌فرض برای اعلان‌های شکست Cron در همه‌ی کارها.
- `mode`: `"announce"` یا `"webhook"`؛ وقتی داده‌ی کافی برای هدف وجود داشته باشد، پیش‌فرض `"announce"` است.
- `channel`: بازنویسی کانال برای تحویل اعلام. `"last"` از آخرین کانال تحویل شناخته‌شده دوباره استفاده می‌کند.
- `to`: هدف اعلام صریح یا URL وب‌هوک. برای حالت وب‌هوک الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- `delivery.failureDestination` در سطح هر کار، این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست در سطح کار تنظیم نشده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌شوند، هنگام شکست به همان هدف اصلی اعلام بازمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

[کارهای Cron](/fa/automation/cron-jobs) را ببینید. اجراهای Cron جداشده به‌عنوان [کارهای پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای قالب مدل رسانه

جای‌نگهدارهای قالب که در `tools.media.models[].args` گسترش می‌یابند:

| متغیر              | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | بدنه‌ی کامل پیام ورودی                            |
| `{{RawBody}}`      | بدنه‌ی خام (بدون پوشش‌های تاریخچه/فرستنده)        |
| `{{BodyStripped}}` | بدنه با حذف mentionهای گروه                       |
| `{{From}}`         | شناسه‌ی فرستنده                                   |
| `{{To}}`           | شناسه‌ی مقصد                                      |
| `{{MessageSid}}`   | شناسه‌ی پیام کانال                                |
| `{{SessionId}}`    | UUID نشست فعلی                                    |
| `{{IsNewSession}}` | `"true"` وقتی نشست جدید ایجاد شده باشد            |
| `{{MediaUrl}}`     | شبه-URL رسانه‌ی ورودی                             |
| `{{MediaPath}}`    | مسیر رسانه‌ی محلی                                 |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)                       |
| `{{Transcript}}`   | رونوشت صوتی                                       |
| `{{Prompt}}`       | پرامپت رسانه‌ی حل‌شده برای ورودی‌های CLI          |
| `{{MaxChars}}`     | حداکثر نویسه‌های خروجی حل‌شده برای ورودی‌های CLI  |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (در حد امکان)                          |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد امکان)                |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد امکان)                  |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد امکان)                  |
| `{{Provider}}`     | راهنمای provider (whatsapp، telegram، discord و غیره) |

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
- آرایه‌ای از فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شوند (موردهای بعدی موردهای قبلی را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از includeها ادغام می‌شوند (مقدارهای includeشده را بازنویسی می‌کنند).
- includeهای تو‌در‌تو: تا ۱۰ سطح عمق.
- مسیرها: نسبت به فایل includeکننده resolve می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا (`dirname` از `openclaw.json`) باقی بمانند. فرم‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل آن مرز resolve شوند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالای متکی به include تک‌فایل را تغییر می‌دهند، مستقیماً در همان فایل includeشده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده باقی می‌گذارد.
- includeهای ریشه، آرایه‌های include، و includeهایی با بازنویسی هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط خواندنی هستند؛ این نوشتن‌ها به‌جای مسطح کردن پیکربندی، به‌صورت بسته شکست می‌خورند.
- خطاها: پیام‌های روشن برای فایل‌های گم‌شده، خطاهای parse، و includeهای چرخه‌ای.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

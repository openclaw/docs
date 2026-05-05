---
read_when:
    - به معناشناسی دقیق پیکربندی در سطح فیلد یا مقادیر پیش‌فرض نیاز دارید
    - شما در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای اصلی OpenClaw، مقادیر پیش‌فرض، و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-05-05T06:17:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd0b6bf9a77d91bcc240088e4be92e44b6e70910efe00f7ed99534fb70983479
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [پیکربندی](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی یک زیرسامانه مرجع عمیق‌تری مخصوص خود دارد به آن لینک می‌دهد. کاتالوگ‌های فرمان متعلق به کانال و Plugin و تنظیمات عمیق حافظه/QMD به‌جای این صفحه، در صفحه‌های خودشان قرار دارند.

حقیقت کد:

- `openclaw config schema` شِمای JSON زنده‌ای را چاپ می‌کند که برای اعتبارسنجی و Control UI استفاده می‌شود، همراه با فراداده bundled/plugin/channel که در صورت موجود بودن ادغام شده است
- `config.schema.lookup` یک گره شِمای محدود به مسیر را برای ابزارهای بررسی جزئی برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش خط مبنای مستندات پیکربندی را در برابر سطح شِمای فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی عامل: پیش از ویرایش‌ها، برای مستندات و محدودیت‌های دقیق در سطح فیلد، از اقدام ابزار `gateway` یعنی `config.schema.lookup` استفاده کنید. برای راهنمایی وظیفه‌محور از [پیکربندی](/fa/gateway/configuration) و برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها، و لینک‌های مراجع زیرسامانه از این صفحه استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations`، و پیکربندی Dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [فرمان‌های اسلش](/fa/tools/slash-commands) برای کاتالوگ فرمان‌های داخلی + bundled فعلی
- صفحه‌های کانال/Plugin مالک برای سطوح فرمان مخصوص کانال

قالب پیکربندی **JSON5** است (کامنت و کامای انتهایی مجاز است). همه فیلدها اختیاری هستند — OpenClaw هنگام حذف‌شدنشان از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی هر کانال به صفحه‌ای اختصاصی منتقل شده‌اند — برای `channels.*`، از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و دیگر کانال‌های bundled (احراز هویت، کنترل دسترسی، چندحسابی، و دروازه‌گذاری mention)، [پیکربندی — کانال‌ها](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های عامل، چندعاملی، نشست‌ها، و پیام‌ها

به صفحه‌ای اختصاصی منتقل شده است — [پیکربندی — عامل‌ها](/fa/gateway/config-agents) را برای موارد زیر ببینید:

- `agents.defaults.*` (workspace، مدل، thinking، Heartbeat، حافظه، رسانه، Skills، sandbox)
- `multiAgent.*` (مسیردهی و اتصال‌های چندعاملی)
- `session.*` (چرخه عمر نشست، Compaction، هرس)
- `messages.*` (تحویل پیام، TTS، رندر markdown)
- `talk.*` (حالت Talk)
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk در iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال transcript پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)

## ابزارها و ارائه‌دهندگان سفارشی

سیاست ابزار، سوییچ‌های آزمایشی، پیکربندی ابزار مبتنی بر ارائه‌دهنده، و راه‌اندازی ارائه‌دهنده سفارشی / base-URL به صفحه‌ای اختصاصی منتقل شده‌اند — [پیکربندی — ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools) را ببینید.

## مدل‌ها

تعریف‌های ارائه‌دهنده، allowlistهای مدل، و راه‌اندازی ارائه‌دهنده سفارشی در [پیکربندی — ابزارها و ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند. ریشه `models` همچنین رفتار سراسری کاتالوگ مدل را مالک است.

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
- `models.pricing.enabled`: bootstrap قیمت‌گذاری پس‌زمینه را کنترل می‌کند که پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد، Gateway واکشی‌های کاتالوگ قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقادیر پیکربندی‌شده `models.providers.*.models[].cost` همچنان برای برآوردهای هزینه محلی کار می‌کنند.

## MCP

تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط Pi توکار و دیگر adapterهای زمان اجرا مصرف می‌شوند. فرمان‌های `openclaw mcp list`، `show`، `set`، و `unset` این بلوک را بدون اتصال به سرور مقصد هنگام ویرایش پیکربندی مدیریت می‌کنند.

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

- `mcp.servers`: تعریف‌های نام‌گذاری‌شده سرور MCP از نوع stdio یا راه‌دور برای runtimeهایی که ابزارهای MCP پیکربندی‌شده را آشکار می‌کنند. ورودی‌های راه‌دور از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛ `type: "http"` یک alias بومی CLI است که `openclaw mcp set` و `openclaw doctor --fix` آن را به فیلد canonical `transport` نرمال‌سازی می‌کنند.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای runtimeهای MCP bundled محدود به نشست. اجراهای توکار تک‌مرحله‌ای پاک‌سازی پایان اجرا را درخواست می‌کنند؛ این TTL پشتیبان نشست‌های طولانی‌مدت و فراخواننده‌های آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP نشست cacheشده به‌صورت hot-apply اعمال می‌شوند. کشف/استفاده بعدی ابزار آن‌ها را از پیکربندی جدید دوباره می‌سازد، بنابراین ورودی‌های حذف‌شده `mcp.servers` به‌جای انتظار برای TTL بیکاری، بلافاصله جمع‌آوری می‌شوند.

برای رفتار زمان اجرا، [MCP](/fa/cli/mcp#openclaw-as-an-mcp-client-registry) و [backendهای CLI](/fa/gateway/cli-backends#bundle-mcp-overlays) را ببینید.

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

- `allowBundled`: allowlist اختیاری فقط برای Skillsهای bundled (Skillsهای مدیریت‌شده/workspace تحت تأثیر نیستند).
- `load.extraDirs`: ریشه‌های skill مشترک اضافی (کمترین اولویت).
- `install.preferBrew`: وقتی true باشد، در صورت موجود بودن `brew`، پیش از fallback به انواع installer دیگر، installerهای Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح installer Node برای مشخصات `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` یک skill را حتی اگر bundled/installed باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: میان‌بر برای Skillsهایی که env var اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

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
- `allow`: allowlist اختیاری (فقط Pluginهای فهرست‌شده بارگذاری می‌شوند). `deny` برنده می‌شود.
- `bundledDiscovery`: برای پیکربندی‌های جدید به‌طور پیش‌فرض `"allowlist"` است، بنابراین یک `plugins.allow` غیرخالی، Pluginهای ارائه‌دهنده bundled، از جمله ارائه‌دهندگان runtime جست‌وجوی وب را نیز gate می‌کند. Doctor برای پیکربندی‌های allowlist قدیمی مهاجرت‌داده‌شده، `"compat"` می‌نویسد تا رفتار موجود ارائه‌دهنده bundled تا زمان opt in شما حفظ شود.
- `plugins.entries.<id>.apiKey`: فیلد میان‌بر کلید API در سطح Plugin (وقتی توسط Plugin پشتیبانی شود).
- `plugins.entries.<id>.env`: نگاشت env var محدود به Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، core، `before_prompt_build` را مسدود می‌کند و فیلدهای تغییردهنده prompt از `before_agent_start` قدیمی را نادیده می‌گیرد، درحالی‌که `modelOverride` و `providerOverride` قدیمی را حفظ می‌کند. برای hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط bundle پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیرباندل‌شده قابل اعتماد ممکن است محتوای خام مکالمه را از hookهای typed مانند `llm_input`، `llm_output`، `before_agent_finalize`، و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: به‌طور صریح به این Plugin اعتماد کنید تا برای اجراهای subagent پس‌زمینه، overrideهای `provider` و `model` برای هر اجرا درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist اختیاری از هدف‌های canonical `provider/model` برای overrideهای subagent قابل اعتماد. فقط وقتی از `"*"` استفاده کنید که عمداً می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (در صورت موجود بودن، با شِمای Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات حساب/runtime کانال Plugin زیر `channels.<id>` قرار دارند و باید توسط فراداده `channelConfigs` در manifest متعلق به Plugin مالک توصیف شوند، نه توسط یک registry مرکزی گزینه‌های OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: تنظیمات ارائه‌دهنده web-fetch در Firecrawl.
  - `apiKey`: کلید API Firecrawl (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، `tools.web.fetch.firecrawl.apiKey` قدیمی، یا env var با نام `FIRECRAWL_API_KEY` fallback می‌کند.
  - `baseUrl`: URL پایه API Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای self-hosted باید endpointهای خصوصی/داخلی را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی را از صفحه‌ها استخراج کند (پیش‌فرض: `true`).
  - `maxAgeMs`: بیشینه سن cache بر حسب میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: timeout درخواست scrape بر حسب ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جست‌وجوی وب Grok).
  - `enabled`: ارائه‌دهنده X Search را فعال کنید.
  - `model`: مدل Grok برای استفاده در جست‌وجو (مثلاً `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات Dreaming حافظه. برای فازها و thresholdها، [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: کلید اصلی Dreaming (پیش‌فرض `false`).
  - `frequency`: آهنگ Cron برای هر sweep کامل Dreaming (به‌طور پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent برای Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن هدف‌ها با `allowedModels` جفت کنید. خطاهای مدل ناموجود یک‌بار با مدل پیش‌فرض نشست دوباره تلاش می‌شوند؛ شکست‌های اعتماد یا allowlist بی‌صدا fallback نمی‌کنند.
  - سیاست فاز و thresholdها جزئیات پیاده‌سازی هستند (کلیدهای پیکربندی کاربرمحور نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای bundle فعال‌شده Claude همچنین می‌توانند پیش‌فرض‌های Pi توکار را از `settings.json` اضافه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات پاک‌سازی‌شده عامل اعمال می‌کند، نه به‌عنوان patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: شناسه Plugin فعال حافظه را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه `"none"` را انتخاب کنید.
- `plugins.slots.contextEngine`: شناسه Plugin فعال موتور context را انتخاب کنید؛ مگر اینکه موتور دیگری نصب و انتخاب کنید، پیش‌فرض `"legacy"` است.

[Pluginها](/fa/tools/plugin) را ببینید.

---

## تعهدات

`commitments` حافظه پیگیری استنباط‌شده را کنترل می‌کند: OpenClaw می‌تواند check-inها را از turnهای مکالمه تشخیص دهد و آن‌ها را از طریق اجراهای Heartbeat تحویل دهد.

- `commitments.enabled`: استخراج پنهان LLM، ذخیره‌سازی، و تحویل Heartbeat را برای تعهدات پیگیری استنباط‌شده فعال کنید. پیش‌فرض: `false`.
- `commitments.maxPerDay`: بیشینه تعهدات پیگیری استنباط‌شده تحویل‌داده‌شده برای هر نشست عامل در یک روز rolling. پیش‌فرض: `3`.

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
- `tabCleanup` زبانه‌های ردیابی‌شده عامل اصلی را پس از زمان بیکاری یا زمانی که یک
  نشست از سقف خود فراتر می‌رود بازیابی می‌کند. برای غیرفعال کردن آن حالت‌های پاک‌سازی جداگانه،
  `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین ناوبری مرورگر به‌صورت پیش‌فرض سخت‌گیرانه می‌ماند.
- فقط زمانی `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را تنظیم کنید که عمداً به ناوبری مرورگر در شبکه خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقاط پایانی پروفایل CDP راه دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترسی‌پذیری/کشف، مشمول همان مسدودسازی شبکه خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، برای استثناهای صریح از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` استفاده کنید.
- پروفایل‌های راه دور فقط اتصال‌شونده هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl`، `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند از HTTP(S) استفاده کنید؛ وقتی ارائه‌دهنده شما یک URL مستقیم WebSocket برای DevTools می‌دهد
  از WS(S) استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترسی‌پذیری CDP راه دور و
  `attachOnly` به‌همراه درخواست‌های باز کردن زبانه اعمال می‌شوند. پروفایل‌های loopback مدیریت‌شده
  پیش‌فرض‌های CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP مدیریت‌شده بیرونی از طریق loopback در دسترس است،
  `attachOnly: true` همان پروفایل را تنظیم کنید؛ در غیر این صورت OpenClaw پورت loopback را به‌عنوان یک
  پروفایل مرورگر مدیریت‌شده محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت پورت محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی
  میزبان انتخاب‌شده یا از طریق یک گره مرورگر متصل وصل شوند.
- پروفایل‌های `existing-session` می‌توانند `userDataDir` را تنظیم کنند تا یک پروفایل
  مرورگر مبتنی بر Chromium خاص مانند Brave یا Edge را هدف بگیرند.
- پروفایل‌های `existing-session` محدودیت‌های فعلی مسیر Chrome MCP را حفظ می‌کنند:
  اقدام‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری انتخابگر CSS، قلاب‌های بارگذاری تک‌فایلی،
  بدون بازنویسی زمان‌انتظار گفتگو، بدون `wait --load networkidle`، و بدون
  `responsebody`، خروجی PDF، رهگیری دانلود، یا اقدام‌های دسته‌ای.
- پروفایل‌های `openclaw` مدیریت‌شده محلی `cdpPort` و `cdpUrl` را خودکار اختصاص می‌دهند؛ فقط
  برای CDP راه دور، `cdpUrl` را صریح تنظیم کنید.
- پروفایل‌های مدیریت‌شده محلی می‌توانند `executablePath` را تنظیم کنند تا
  `browser.executablePath` سراسری را برای آن پروفایل بازنویسی کنند. از این برای اجرای یک پروفایل در
  Chrome و پروفایلی دیگر در Brave استفاده کنید.
- پروفایل‌های مدیریت‌شده محلی برای کشف HTTP مربوط به Chrome CDP
  پس از شروع فرایند از `browser.localLaunchTimeoutMs` و برای آماده‌بودن websocket مربوط به CDP پس از راه‌اندازی از
  `browser.localCdpReadyTimeoutMs` استفاده می‌کنند. آن‌ها را روی میزبان‌های کندتر که Chrome
  با موفقیت شروع می‌شود اما بررسی‌های آمادگی با راه‌اندازی هم‌زمان می‌شوند افزایش دهید. هر دو مقدار باید
  عدد صحیح مثبت تا `120000` میلی‌ثانیه باشند؛ مقدارهای پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو
  `~` و `~/...` را برای دایرکتوری خانه سیستم‌عامل شما پیش از راه‌اندازی Chromium می‌پذیرند.
  `userDataDir` هر پروفایل در پروفایل‌های `existing-session` نیز با tilde گسترش داده می‌شود.
- سرویس کنترل: فقط loopback (پورت از `gateway.port` مشتق می‌شود، پیش‌فرض `18791`).
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

- `seamColor`: رنگ تأکیدی برای chrome رابط کاربری برنامه بومی (رنگ حباب حالت گفت‌وگو و غیره).
- `assistant`: بازنویسی هویت رابط کاربری کنترل. به هویت عامل فعال برمی‌گردد.

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

- `mode`: `local` (اجرای gateway) یا `remote` (اتصال به gateway راه‌دور). Gateway جز در حالت `local` از شروع به کار خودداری می‌کند.
- `port`: پورت تکی multiplexed برای WS + HTTP. تقدم: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، `loopback` (پیش‌فرض)، `lan` (`0.0.0.0`)، `tailnet` (فقط IP مربوط به Tailscale)، یا `custom`.
- **نام‌های مستعار bind قدیمی**: در `gateway.bind` از مقدارهای حالت bind (`auto`، `loopback`، `lan`، `tailnet`، `custom`) استفاده کنید، نه نام‌های مستعار host (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **نکته Docker**: bind پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکه‌بندی bridge در Docker (`-p 18789:18789`)، ترافیک از `eth0` وارد می‌شود، بنابراین gateway دسترس‌ناپذیر است. از `--network host` استفاده کنید، یا برای گوش‌دادن روی همه رابط‌ها `bind: "lan"` (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) را تنظیم کنید.
- **احراز هویت**: به‌صورت پیش‌فرض الزامی است. bindهای غیر-loopback به احراز هویت gateway نیاز دارند. در عمل یعنی یک token/password مشترک یا یک reverse proxy هویت‌آگاه با `gateway.auth.mode: "trusted-proxy"`. راه‌انداز onboarding به‌صورت پیش‌فرض یک token تولید می‌کند.
- اگر هر دو مقدار `gateway.auth.token` و `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefها)، `gateway.auth.mode` را صراحتا روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، جریان‌های startup و نصب/repair سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای تنظیمات local loopback مورد اعتماد استفاده کنید؛ این گزینه عمدا در promptهای onboarding ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت browser/user را به یک reverse proxy هویت‌آگاه واگذار کنید و به headerهای هویت از `gateway.trustedProxies` اعتماد کنید (به [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth) مراجعه کنید). این حالت به‌صورت پیش‌فرض انتظار یک منبع proxy **غیر-loopback** دارد؛ reverse proxyهای loopback روی همان host به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی روی همان host می‌توانند از `gateway.auth.password` به‌عنوان fallback مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، headerهای هویت Tailscale Serve می‌توانند احراز هویت Control UI/WebSocket را برآورده کنند (با `tailscale whois` تایید می‌شود). endpointهای HTTP API از آن احراز هویت header مربوط به Tailscale استفاده **نمی‌کنند**؛ آن‌ها به‌جای آن از حالت عادی احراز هویت HTTP مربوط به gateway پیروی می‌کنند. این جریان بدون token فرض می‌کند host مربوط به gateway مورد اعتماد است. وقتی `tailscale.mode = "serve"` باشد، مقدار پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکننده اختیاری احراز هویت ناموفق. برای هر IP کلاینت و هر دامنه احراز هویت اعمال می‌شود (shared-secret و device-token جداگانه ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر async مربوط به Tailscale Serve Control UI، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست serialized می‌شوند. بنابراین تلاش‌های بد هم‌زمان از همان کلاینت می‌توانند محدودکننده را در درخواست دوم فعال کنند، به‌جای اینکه هر دو مثل mismatch ساده از آن عبور کنند.
  - مقدار پیش‌فرض `gateway.auth.rateLimit.exemptLoopback` برابر `true` است؛ وقتی عمدا می‌خواهید ترافیک localhost هم rate-limit شود (برای تنظیمات test یا deploymentهای proxy سخت‌گیرانه)، آن را روی `false` تنظیم کنید.
- تلاش‌های احراز هویت WS با origin مرورگر همیشه با غیرفعال بودن معافیت loopback محدودسازی می‌شوند (دفاع چندلایه در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، این lockoutهای با origin مرورگر بر اساس مقدار normalized `Origin`
  جدا می‌شوند، بنابراین شکست‌های تکراری از یک origin مربوط به localhost به‌صورت خودکار
  یک origin متفاوت را قفل نمی‌کند.
- `tailscale.mode`: `serve` (فقط tailnet، bind از نوع loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `controlUi.allowedOrigins`: allowlist صریح origin مرورگر برای اتصال‌های WebSocket مربوط به Gateway. وقتی کلاینت‌های مرورگر از originهای غیر-loopback انتظار می‌روند، الزامی است.
- `controlUi.chatMessageMaxWidth`: حداکثر عرض اختیاری برای پیام‌های گفت‌وگوی گروه‌بندی‌شده در Control UI. مقدارهای عرض CSS محدودشده مانند `960px`، `82%`، `min(1280px, 82%)`، و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناک که origin fallback مبتنی بر Host-header را برای deploymentهایی فعال می‌کند که عمدا به سیاست origin مبتنی بر Host-header متکی‌اند.
- `remote.transport`: `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، مقدار `remote.url` باید `ws://` یا `wss://` باشد.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override اضطراری در محیط پردازش سمت کلاینت
  که اجازه می‌دهد `ws://` بدون رمزنگاری به IPهای شبکه خصوصی مورد اعتماد متصل شود؛
  پیش‌فرض برای متن ساده همچنان فقط loopback است. معادل `openclaw.json`
  وجود ندارد، و پیکربندی شبکه خصوصی مرورگر مانند
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` بر کلاینت‌های WebSocket
  مربوط به Gateway اثری ندارد.
- `gateway.remote.token` / `.password` فیلدهای credential کلاینت راه‌دور هستند. آن‌ها به‌تنهایی احراز هویت gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: URL پایه HTTPS برای relay بیرونی APNs که buildهای رسمی/TestFlight iOS پس از انتشار registrationهای پشتیبانی‌شده با relay به gateway از آن استفاده می‌کنند. این URL باید با URL مربوط به relay که در build iOS کامپایل شده است مطابقت داشته باشد.
- `gateway.push.apns.relay.timeoutMs`: timeout ارسال از gateway به relay بر حسب میلی‌ثانیه. پیش‌فرض `10000` است.
- registrationهای پشتیبانی‌شده با relay به یک هویت مشخص gateway واگذار می‌شوند. اپ iOS جفت‌شده `gateway.identity.get` را دریافت می‌کند، آن هویت را در registration مربوط به relay قرار می‌دهد، و یک مجوز ارسال با دامنه registration را به gateway forward می‌کند. gateway دیگر نمی‌تواند آن registration ذخیره‌شده را دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی relay بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه فرار فقط مخصوص development برای URLهای relay از نوع HTTP روی loopback. URLهای relay در production باید روی HTTPS بمانند.
- `gateway.handshakeTimeoutMs`: timeout مربوط به handshake پیش از احراز هویت WebSocket مربوط به Gateway بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد، تقدم دارد. روی hostهای پربار یا کم‌توان که کلاینت‌های محلی می‌توانند در حالی وصل شوند که گرم‌شدن startup هنوز در حال پایدار شدن است، این مقدار را افزایش دهید.
- `gateway.channelHealthCheckMinutes`: فاصله health-monitor کانال بر حسب دقیقه. برای غیرفعال‌کردن restartهای health-monitor به‌صورت سراسری، آن را روی `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانه stale-socket بر حسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: حداکثر restartهای health-monitor برای هر کانال/حساب در یک ساعت rolling. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: انصراف به‌ازای هر کانال از restartهای health-monitor در حالی که مانیتور سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override به‌ازای هر حساب برای کانال‌های چندحسابی. وقتی تنظیم شود، بر override سطح کانال تقدم دارد.
- مسیرهای فراخوانی gateway محلی فقط زمانی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتا از طریق SecretRef پیکربندی شده و unresolved باشد، resolution به‌صورت fail-closed شکست می‌خورد (بدون اینکه remote fallback آن را mask کند).
- `trustedProxies`: IPهای reverse proxy که TLS را terminate می‌کنند یا headerهای forwarded-client را تزریق می‌کنند. فقط proxyهایی را فهرست کنید که کنترلشان می‌کنید. entryهای loopback همچنان برای تنظیمات proxy/local-detection روی همان host معتبرند (برای مثال Tailscale Serve یا یک reverse proxy محلی)، اما درخواست‌های loopback را برای `gateway.auth.mode: "trusted-proxy"` واجد شرایط نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، gateway در صورت نبودن `X-Forwarded-For` مقدار `X-Real-IP` را می‌پذیرد. مقدار پیش‌فرض `false` برای رفتار fail-closed است.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای تایید خودکار pairing دستگاه node در اولین بار، بدون scopeهای درخواست‌شده. وقتی تنظیم نشده باشد غیرفعال است. این مورد pairing operator/browser/Control UI/WebChat را خودکار تایید نمی‌کند، و ارتقای role، scope، metadata، یا public-key را هم خودکار تایید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی allow/deny سراسری برای commandهای اعلام‌شده node پس از pairing و ارزیابی allowlist پلتفرم. از `allowCommands` برای opt in به commandهای خطرناک node مانند `camera.snap`، `camera.clip`، و `screen.record` استفاده کنید؛ `denyCommands` یک command را حذف می‌کند حتی اگر یک پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل می‌شد. پس از اینکه یک node فهرست command اعلام‌شده خود را تغییر داد، pairing آن دستگاه را رد و دوباره تایید کنید تا gateway snapshot به‌روزشده command را ذخیره کند.
- `gateway.tools.deny`: نام‌های tool اضافی که برای HTTP `POST /tools/invoke` مسدود می‌شوند (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام‌های tool را از فهرست deny پیش‌فرض HTTP حذف می‌کند.

</Accordion>

### endpointهای سازگار با OpenAI

- Chat Completions: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL در Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی به‌عنوان تنظیم‌نشده در نظر گرفته می‌شوند؛ برای غیرفعال‌کردن دریافت URL از
    `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- header اختیاری سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای originهای HTTPS که کنترلشان می‌کنید تنظیم کنید؛ به [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts) مراجعه کنید)

### جداسازی چند instance

چند gateway را روی یک host با پورت‌ها و دایرکتوری‌های state یکتا اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

flagهای کمکی: `--dev` (از `~/.openclaw-dev` + پورت `19001` استفاده می‌کند)، `--profile <name>` (از `~/.openclaw-<name>` استفاده می‌کند).

به [چند Gateway](/fa/gateway/multiple-gateways) مراجعه کنید.

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

- `enabled`: TLS termination را در listener مربوط به gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده‌اند، یک جفت cert/key خودامضای محلی را خودکار تولید می‌کند؛ فقط برای استفاده local/dev.
- `certPath`: مسیر فایل‌سیستم به فایل certificate مربوط به TLS.
- `keyPath`: مسیر فایل‌سیستم به فایل private key مربوط به TLS؛ دسترسی آن را محدود نگه دارید.
- `caPath`: مسیر اختیاری CA bundle برای تایید کلاینت یا trust chainهای سفارشی.

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

- `mode`: کنترل می‌کند ویرایش‌های config در runtime چگونه اعمال شوند.
  - `"off"`: ویرایش‌های live را نادیده بگیر؛ تغییرات به restart صریح نیاز دارند.
  - `"restart"`: همیشه هنگام تغییر config پردازش gateway را restart کن.
  - `"hot"`: تغییرات را بدون restart درون همان پردازش اعمال کن.
  - `"hybrid"` (پیش‌فرض): ابتدا hot reload را امتحان کن؛ در صورت نیاز به restart fallback کن.
- `debounceMs`: پنجره debounce بر حسب ms پیش از اعمال تغییرات config (عدد صحیح غیرمنفی).
- `deferralTimeoutMs`: حداکثر زمان اختیاری بر حسب ms برای انتظار جهت عملیات‌های در حال اجرا پیش از اجباری‌کردن restart. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای still-pending، روی `0` تنظیم کنید.

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
توکن‌های هوک در رشتهٔ پرس‌وجو رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به یک `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید از `gateway.auth.token` **متمایز** باشد؛ استفادهٔ دوباره از توکن Gateway رد می‌شود.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیردامنهٔ مسیر اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا preset از `sessionKey` قالب‌دار استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این opt-in نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از payload درخواست فقط زمانی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` resolve می‌شود
  - مقدارهای `sessionKey` نگاشت که با قالب render شده‌اند، به‌عنوان مقدارهای تأمین‌شده از بیرون در نظر گرفته می‌شوند و آن‌ها هم به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="جزئیات نگاشت">

- `match.path` با زیردامنهٔ مسیر پس از `/hooks` مطابقت می‌کند (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` با یک فیلد payload برای مسیرهای عمومی مطابقت می‌کند.
- قالب‌هایی مانند `{{messages[0].subject}}` از payload می‌خوانند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک اقدام هوک برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و درون `hooks.transformsDir` باقی بماند (مسیرهای مطلق و traversal رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های skill در workspace رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش کرد، ماژول transform را به دایرکتوری transforms هوک‌ها منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک agent مشخص route می‌کند؛ شناسه‌های ناشناخته به پیش‌فرض fallback می‌کنند.
- `allowedAgentIds`: routing صریح را محدود می‌کند (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید session ثابت اختیاری برای اجرای agent هوک بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای session نگاشت مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: allowlist پیشوند اختیاری برای مقدارهای `sessionKey` صریح (درخواست + نگاشت)، مثلاً `["hook:"]`. وقتی هر نگاشت یا preset از `sessionKey` قالب‌دار استفاده کند، الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ پیش‌فرض `channel` برابر `last` است.
- `model`، LLM را برای این اجرای هوک override می‌کند (اگر کاتالوگ مدل تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- preset داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر همان routing به‌ازای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را برای مطابقت با namespace مربوط به Gmail محدود کنید، برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، preset را به‌جای پیش‌فرض قالب‌دار با یک `sessionKey` ایستا override کنید.

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

- Gateway هنگام boot، اگر پیکربندی شده باشد، `gog gmail watch serve` را خودکار شروع می‌کند. برای غیرفعال‌سازی، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
- یک `gog gmail watch serve` جداگانه را کنار Gateway اجرا نکنید.

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

- HTML/CSS/JS قابل‌ویرایش توسط agent و A2UI را از طریق HTTP زیر پورت Gateway ارائه می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- Bindهای غیر-loopback: مسیرهای canvas به احراز هویت Gateway نیاز دارند (token/password/trusted-proxy)، همانند سایر سطح‌های HTTP مربوط به Gateway.
- Node WebViewها معمولاً headerهای احراز هویت را نمی‌فرستند؛ پس از paired و connected شدن یک node، Gateway برای دسترسی canvas/A2UI، URLهای capability محدود به node را اعلام می‌کند.
- URLهای capability به session فعال WS مربوط به node متصل‌اند و سریع منقضی می‌شوند. fallback مبتنی بر IP استفاده نمی‌شود.
- کلاینت live-reload را به HTML ارائه‌شده تزریق می‌کند.
- وقتی خالی باشد، starter `index.html` را خودکار ایجاد می‌کند.
- همچنین A2UI را در `/__openclaw__/a2ui/` ارائه می‌کند.
- تغییرات به restart شدن gateway نیاز دارند.
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

- `minimal` (پیش‌فرض وقتی Plugin باندل‌شدهٔ `bonjour` فعال است): `cliPath` + `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: شامل `cliPath` + `sshPort` می‌شود؛ تبلیغ multicast در LAN همچنان نیاز دارد Plugin باندل‌شدهٔ `bonjour` فعال باشد.
- `off`: تبلیغ multicast در LAN را بدون تغییر در فعال‌بودن Plugin سرکوب می‌کند.
- Plugin باندل‌شدهٔ `bonjour` روی میزبان‌های macOS خودکار شروع می‌شود و روی Linux، Windows، و استقرارهای کانتینری Gateway به‌صورت opt-in است.
- نام میزبان وقتی یک برچسب DNS معتبر باشد، به‌طور پیش‌فرض برابر نام میزبان سیستم است و در غیر این صورت به `openclaw` fallback می‌کند. با `OPENCLAW_MDNS_HOSTNAME` override کنید.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک zone یک‌پخشی DNS-SD زیر `~/.openclaw/dns/` می‌نویسد. برای کشف میان‌شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + split DNS مربوط به Tailscale همراه کنید.

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

- متغیرهای محیطی درون‌خطی فقط وقتی اعمال می‌شوند که محیط فرایند آن کلید را نداشته باشد.
- فایل‌های `.env`: فایل `.env` در CWD + فایل `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
- `shellEnv`: کلیدهای مورد انتظارِ موجودنبودنی را از نمایه پوسته ورود شما وارد می‌کند.
- برای اولویت‌بندی کامل، [محیط](/fa/help/environment) را ببینید.

### جایگزینی متغیرهای محیطی

در هر رشته پیکربندی، با `${VAR_NAME}` به متغیرهای محیطی ارجاع دهید:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- فقط نام‌های با حروف بزرگ مطابق می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای ناموجود/خالی هنگام بارگذاری پیکربندی خطا ایجاد می‌کنند.
- برای مقدار لفظی `${VAR}` با `$${VAR}` آن را گریز دهید.
- با `$include` کار می‌کند.

---

## رازها

ارجاع‌های راز افزایشی هستند: مقدارهای متن ساده همچنان کار می‌کنند.

### `SecretRef`

از یک شکل شیء استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- الگوی شناسه `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- شناسه `source: "file"`: اشاره‌گر JSON مطلق (برای نمونه `"/providers/openai/apiKey"`)
- الگوی شناسه `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- شناسه‌های `source: "exec"` نباید شامل بخش‌های مسیرِ جداشده با اسلشِ `.` یا `..` باشند (برای نمونه `a/../b` رد می‌شود)

### سطح اعتبارنامه پشتیبانی‌شده

- ماتریس مرجع: [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای اعتبارنامه پشتیبانی‌شده در `openclaw.json` را هدف می‌گیرد.
- ارجاع‌های `auth-profiles.json` در حل‌وفصل زمان اجرا و پوشش ممیزی گنجانده می‌شوند.

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
- مسیرهای ارائه‌دهنده فایل و exec وقتی راستی‌آزمایی Windows ACL در دسترس نباشد به‌صورت بسته شکست می‌خورند. `allowInsecurePath: true` را فقط برای مسیرهای معتمدی تنظیم کنید که قابل راستی‌آزمایی نیستند.
- ارائه‌دهنده `exec` به مسیر `command` مطلق نیاز دارد و از بارهای پروتکلی روی stdin/stdout استفاده می‌کند.
- به‌طور پیش‌فرض، مسیرهای فرمانِ پیوند نمادین رد می‌شوند. برای اجازه‌دادن به مسیرهای پیوند نمادین همراه با اعتبارسنجی مسیر مقصدِ حل‌شده، `allowSymlinkCommand: true` را تنظیم کنید.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی دایرکتوری معتمد روی مسیر مقصدِ حل‌شده اعمال می‌شود.
- محیط فرزند `exec` به‌طور پیش‌فرض حداقلی است؛ متغیرهای لازم را صراحتاً با `passEnv` عبور دهید.
- ارجاع‌های راز هنگام فعال‌سازی در یک عکس‌برداشت درون‌حافظه‌ای حل می‌شوند، سپس مسیرهای درخواست فقط همان عکس‌برداشت را می‌خوانند.
- پالایش سطح فعال هنگام فعال‌سازی اعمال می‌شود: ارجاع‌های حل‌نشده روی سطح‌های فعال باعث شکست راه‌اندازی/بارگذاری دوباره می‌شوند، در حالی که سطح‌های غیرفعال با پیام‌های عیب‌یابی نادیده گرفته می‌شوند.

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

- نمایه‌های هر عامل در `<agentDir>/auth-profiles.json` ذخیره می‌شوند.
- `auth-profiles.json` برای حالت‌های اعتبارنامه ایستا از ارجاع‌های سطح مقدار (`keyRef` برای `api_key`، `tokenRef` برای `token`) پشتیبانی می‌کند.
- نگاشت‌های تخت قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را با یک پشتیبان `.legacy-flat.*.bak` به نمایه‌های کلید API مرجع `provider:default` بازنویسی می‌کند.
- نمایه‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های نمایه احراز هویتِ پشتیبانی‌شده با SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های ایستای زمان اجرا از عکس‌برداشت‌های حل‌شده درون‌حافظه‌ای می‌آیند؛ ورودی‌های ایستای قدیمی `auth.json` هنگام کشف پاک‌سازی می‌شوند.
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

- `billingBackoffHours`: عقب‌نشینی پایه به ساعت، وقتی یک نمایه به‌دلیل خطاهای واقعی
  صورت‌حساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح صورت‌حساب می‌تواند
  حتی در پاسخ‌های `401`/`403` هم همچنان به این مسیر برسد، اما تطبیق‌گرهای متن
  اختصاصی هر ارائه‌دهنده در محدوده همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای مثال
  OpenRouter
  `Key limit exceeded`). پیام‌های قابل‌تلاش‌مجدد HTTP `402` مربوط به پنجره مصرف یا
  محدودیت هزینه سازمان/فضای‌کاری، در عوض در مسیر `rate_limit` می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری به‌ازای هر ارائه‌دهنده برای ساعت‌های عقب‌نشینی صورت‌حساب.
- `billingMaxHours`: سقف رشد نمایی عقب‌نشینی صورت‌حساب به ساعت (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: عقب‌نشینی پایه به دقیقه برای شکست‌های با اطمینان بالا از نوع `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف رشد عقب‌نشینی `auth_permanent` به دقیقه (پیش‌فرض: `60`).
- `failureWindowHours`: پنجره غلتان به ساعت که برای شمارنده‌های عقب‌نشینی استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: حداکثر چرخش‌های نمایه احراز هویت برای همان ارائه‌دهنده در خطاهای سربار، پیش از رفتن به جایگزین مدل (پیش‌فرض: `1`). شکل‌های شلوغی ارائه‌دهنده مانند `ModelNotReadyException` به اینجا می‌رسند.
- `overloadedBackoffMs`: تاخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/نمایه سربار (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: حداکثر چرخش‌های نمایه احراز هویت برای همان ارائه‌دهنده در خطاهای محدودیت نرخ، پیش از رفتن به جایگزین مدل (پیش‌فرض: `1`). این سطل محدودیت نرخ شامل متن‌های شکل‌گرفته توسط ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded` و `resource exhausted` است.

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
- `consoleLevel` هنگام استفاده از `--verbose` به `debug` افزایش می‌یابد.
- `maxFileBytes`: حداکثر اندازه فایل فعال ثبت وقایع به بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 مگابایت). OpenClaw تا پنج بایگانی شماره‌دار را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پوشاندن با بهترین تلاش برای خروجی کنسول، فایل‌های ثبت وقایع، رکوردهای ثبت OTLP، و متن رونوشت نشست‌های ماندگارشده. `redactSensitive: "off"` فقط این سیاست عمومی ثبت وقایع/رونوشت را غیرفعال می‌کند؛ سطح‌های ایمنی UI/ابزار/عیب‌یابی همچنان پیش از انتشار رازها را پنهان می‌کنند.

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

- `enabled`: کلید اصلی برای خروجی ابزارسازی (پیش‌فرض: `true`).
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی ثبت هدفمند را فعال می‌کند (از نویسه‌های عام مانند `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانه سن بدون پیشرفت به میلی‌ثانیه برای دسته‌بندی نشست‌های پردازشی طولانی به‌عنوان `session.long_running`، `session.stalled` یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک و پیشرفت ACP زمان‌سنج را بازنشانی می‌کنند؛ عیب‌یابی‌های تکراری `session.stuck` تا وقتی تغییری رخ نداده عقب‌نشینی می‌کنند.
- `stuckSessionAbortMs`: آستانه سن بدون پیشرفت به میلی‌ثانیه، پیش از آنکه کار فعال متوقف‌شده واجد شرایط برای تخلیه-لغو جهت بازیابی باشد. وقتی تنظیم نشده باشد، OpenClaw از پنجره امن‌تر و گسترده‌تر اجرای جاسازی‌شده، دست‌کم 10 دقیقه و 5 برابر `stuckSessionWarnMs`، استفاده می‌کند.
- `otel.enabled`: خط لوله صدور OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، فهرست سیگنال‌ها و مدل حریم خصوصی، [صدور OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: نشانی گردآورنده برای صدور OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP مخصوص هر سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فراداده اضافی HTTP/gRPC که همراه درخواست‌های صدور OTel فرستاده می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: صدور ردگیری، سنجه‌ها یا ثبت وقایع را فعال می‌کند.
- `otel.sampleRate`: نرخ نمونه‌برداری ردگیری `0`–`1`.
- `otel.flushIntervalMs`: بازه تخلیه دوره‌ای تله‌متری به میلی‌ثانیه.
- `otel.captureContent`: ثبت محتوای خام به‌صورت انتخابی برای ویژگی‌های span در OTEL. پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را ثبت می‌کند؛ شکل شیء به شما اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs` و `systemPrompt` را صریحا فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای تازه‌ترین ویژگی‌های آزمایشی ارائه‌دهنده span در GenAI. به‌طور پیش‌فرض spanها برای سازگاری، ویژگی قدیمی `gen_ai.system` را نگه می‌دارند؛ سنجه‌های GenAI از ویژگی‌های معنایی کراندار استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که از پیش یک SDK سراسری OpenTelemetry ثبت کرده‌اند. در این حالت OpenClaw راه‌اندازی/خاموشی SDK متعلق به Plugin را رد می‌کند، درحالی‌که شنونده‌های عیب‌یابی فعال می‌مانند.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطه پایانی مخصوص سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: نماگرفت‌های ردگیری کش را برای اجراهای جاسازی‌شده ثبت می‌کند (پیش‌فرض: `false`).
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
- `auto.stableDelayHours`: حداقل تاخیر به ساعت پیش از اعمال خودکار کانال پایدار (پیش‌فرض: `6`؛ حداکثر: `168`).
- `auto.stableJitterHours`: پنجره پخش عرضه اضافی برای کانال پایدار به ساعت (پیش‌فرض: `12`؛ حداکثر: `168`).
- `auto.betaCheckIntervalHours`: فاصله اجرای بررسی‌های کانال بتا به ساعت (پیش‌فرض: `1`؛ حداکثر: `24`).

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

- `enabled`: دروازه قابلیت سراسری ACP (پیش‌فرض: `true`؛ برای پنهان کردن dispatch و affordanceهای spawn مربوط به ACP، آن را `false` کنید).
- `dispatch.enabled`: دروازه مستقل برای dispatch نوبت نشست ACP (پیش‌فرض: `true`). آن را `false` کنید تا فرمان‌های ACP در دسترس بمانند، اما اجرا مسدود شود.
- `backend`: شناسه پیش‌فرض بک‌اند زمان‌اجرای ACP (باید با یک Plugin زمان‌اجرای ACP ثبت‌شده مطابقت داشته باشد).
  ابتدا Plugin بک‌اند را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسه Plugin بک‌اند (برای مثال `acpx`) را در آن بگنجانید؛ در غیر این صورت بک‌اند ACP بارگذاری نخواهد شد.
- `defaultAgent`: شناسه عامل هدف جایگزین ACP وقتی spawnها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: فهرست مجاز شناسه‌های عامل که برای نشست‌های زمان‌اجرای ACP مجازند؛ خالی بودن یعنی محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: حداکثر نشست‌های ACP فعال هم‌زمان.
- `stream.coalesceIdleMs`: پنجره تخلیه در حالت بیکاری به میلی‌ثانیه برای متن جریان‌یافته.
- `stream.maxChunkChars`: حداکثر اندازه قطعه پیش از تقسیم نگاشت بلوک جریان‌یافته.
- `stream.repeatSuppression`: خط‌های وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی جریان می‌دهد؛ `"final_only"` تا رویدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل‌مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: حداکثر نویسه‌های خروجی دستیار که در هر نوبت ACP نگاشت می‌شوند.
- `stream.maxSessionUpdateChars`: حداکثر نویسه‌ها برای خط‌های وضعیت/به‌روزرسانی نگاشت‌شده ACP.
- `stream.tagVisibility`: نگاشتی از نام برچسب‌ها به بازنویسی‌های نمایانی بولی برای رویدادهای جریان‌یافته.
- `runtime.ttlMinutes`: TTL بیکاری به دقیقه برای کارکنان نشست ACP پیش از واجد شرایط شدن برای پاک‌سازی.
- `runtime.installCommand`: فرمان نصب اختیاری برای اجرا هنگام راه‌اندازی اولیه محیط زمان‌اجرای ACP.

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
- برای پنهان کردن کل بنر (نه فقط شعارها)، متغیر محیطی `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## جادوگر

فراداده نوشته‌شده توسط جریان‌های راه‌اندازی هدایت‌شده CLI (`onboard`، `configure`، `doctor`):

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

ساخت‌های فعلی دیگر شامل پل TCP نیستند. Nodeها از طریق WebSocket مربوط به Gateway متصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از شِمای پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت نگهداری نشست‌های اجرای cron ایزوله و تکمیل‌شده پیش از هرس از `sessions.json`. همچنین پاک‌سازی رونوشت‌های بایگانی‌شده cron حذف‌شده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
- `runLog.maxBytes`: بیشینه اندازه هر فایل گزارش اجرا (`cron/runs/<jobId>.jsonl`) پیش از هرس. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین خط‌هایی که هنگام فعال شدن هرس گزارش اجرا نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن bearer که برای تحویل cron webhook POST استفاده می‌شود (`delivery.mode = "webhook"`)، اگر حذف شود هیچ هدر احراز هویتی ارسال نمی‌شود.
- `webhook`: URL webhook پشتیبان قدیمی منسوخ‌شده (http/https) که فقط برای کارهای ذخیره‌شده‌ای استفاده می‌شود که هنوز `notify: true` دارند.

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

- `maxAttempts`: بیشینه تعداد تلاش‌های مجدد برای کارهای یک‌باره در خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0` تا `10`).
- `backoffMs`: آرایه‌ای از تاخیرهای backoff بر حسب میلی‌ثانیه برای هر تلاش مجدد (پیش‌فرض: `[30000, 60000, 300000]`؛ 1 تا 10 ورودی).
- `retryOn`: انواع خطایی که تلاش مجدد را فعال می‌کنند — `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش مجدد روی همه انواع گذرا، حذف کنید.

فقط برای کارهای cron یک‌باره اعمال می‌شود. کارهای تکرارشونده از رسیدگی جداگانه به شکست استفاده می‌کنند.

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

- `enabled`: فعال‌سازی هشدارهای شکست برای کارهای cron (پیش‌فرض: `false`).
- `after`: تعداد شکست‌های متوالی پیش از فعال شدن هشدار (عدد صحیح مثبت، حداقل: `1`).
- `cooldownMs`: حداقل میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: اجراهای ردشده متوالی را در آستانه هشدار حساب کند (پیش‌فرض: `false`). اجراهای ردشده جداگانه ردیابی می‌شوند و بر backoff خطای اجرا اثر نمی‌گذارند.
- `mode`: حالت تحویل — `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به webhook پیکربندی‌شده پست می‌کند.
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
- `channel`: override کانال برای تحویل announce. `"last"` از آخرین کانال تحویل شناخته‌شده دوباره استفاده می‌کند.
- `to`: هدف announce یا URL webhook صریح. برای حالت webhook الزامی است.
- `accountId`: override اختیاری حساب برای تحویل.
- `delivery.failureDestination` در سطح هر کار، این پیش‌فرض سراسری را override می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست در سطح کار تنظیم شده باشد، کارهایی که از قبل از طریق `announce` تحویل می‌شوند، هنگام شکست به همان هدف announce اصلی بازمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

[کارهای Cron](/fa/automation/cron-jobs) را ببینید. اجراهای cron ایزوله به‌عنوان [وظایف پس‌زمینه](/fa/automation/tasks) ردیابی می‌شوند.

---

## متغیرهای الگوی مدل رسانه

placeholderهای الگو در `tools.media.models[].args` گسترش می‌یابند:

| متغیر             | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | بدنه کامل پیام ورودی                              |
| `{{RawBody}}`      | بدنه خام (بدون پوشش‌های تاریخچه/فرستنده)          |
| `{{BodyStripped}}` | بدنه با حذف اشاره‌های گروهی                       |
| `{{From}}`         | شناسه فرستنده                                     |
| `{{To}}`           | شناسه مقصد                                        |
| `{{MessageSid}}`   | شناسه پیام کانال                                  |
| `{{SessionId}}`    | UUID نشست فعلی                                    |
| `{{IsNewSession}}` | `"true"` وقتی نشست جدید ایجاد شده باشد            |
| `{{MediaUrl}}`     | pseudo-URL رسانه ورودی                            |
| `{{MediaPath}}`    | مسیر رسانه محلی                                   |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)                       |
| `{{Transcript}}`   | رونوشت صوتی                                       |
| `{{Prompt}}`       | prompt رسانه حل‌شده برای ورودی‌های CLI            |
| `{{MaxChars}}`     | بیشینه نویسه‌های خروجی حل‌شده برای ورودی‌های CLI  |
| `{{ChatType}}`     | `"direct"` یا `"group"`                            |
| `{{GroupSubject}}` | موضوع گروه (در حد بهترین تلاش)                    |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد بهترین تلاش)          |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد بهترین تلاش)            |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد بهترین تلاش)            |
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
- آرایه‌ای از فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شوند (موارد بعدی موارد قبلی را override می‌کنند).
- کلیدهای هم‌سطح: پس از includeها ادغام می‌شوند (مقادیر includeشده را override می‌کنند).
- includeهای تو‌در‌تو: تا عمق 10 سطح.
- مسیرها: نسبت به فایل includeکننده حل می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا (`dirname` مربوط به `openclaw.json`) باقی بمانند. شکل‌های مطلق/`../` فقط وقتی مجاز هستند که همچنان داخل آن مرز حل شوند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالای پشتیبانی‌شده با include تک‌فایلی را تغییر می‌دهند، در همان فایل includeشده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- includeهای ریشه، آرایه‌های include، و includeهایی با overrideهای هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط خواندنی هستند؛ این نوشتن‌ها به‌جای flatten کردن پیکربندی، به‌صورت بسته شکست می‌خورند.
- خطاها: پیام‌های واضح برای فایل‌های گمشده، خطاهای parse، و includeهای چرخه‌ای.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

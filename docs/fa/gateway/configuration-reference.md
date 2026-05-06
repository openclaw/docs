---
read_when:
    - به معناشناسی دقیق پیکربندی در سطح فیلد یا مقادیر پیش‌فرض نیاز دارید
    - شما در حال اعتبارسنجی بلوک‌های پیکربندی کانال، مدل، Gateway یا ابزار هستید
summary: مرجع پیکربندی Gateway برای کلیدهای اصلی OpenClaw، مقادیر پیش‌فرض، و پیوندها به مراجع اختصاصی زیرسامانه‌ها
title: مرجع پیکربندی
x-i18n:
    generated_at: "2026-05-06T09:16:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119194a7e041a7ca35b9dd1575c4f4c4d5c67f412cd3002e65bf5b706b210a90
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع پیکربندی هسته برای `~/.openclaw/openclaw.json`. برای نمای کلی وظیفه‌محور، [Configuration](/fa/gateway/configuration) را ببینید.

سطوح اصلی پیکربندی OpenClaw را پوشش می‌دهد و وقتی یک زیرسیستم مرجع عمیق‌تری برای خودش دارد، به آن پیوند می‌دهد. کاتالوگ‌های دستور متعلق به کانال و Plugin و تنظیمات عمیق حافظه/QMD به‌جای این صفحه، در صفحه‌های خودشان قرار دارند.

حقیقت کد:

- `openclaw config schema` JSON Schema زنده‌ای را که برای اعتبارسنجی و Control UI استفاده می‌شود چاپ می‌کند، همراه با فراداده‌های بسته‌بندی‌شده/Plugin/کانال که در صورت وجود ادغام شده‌اند
- `config.schema.lookup` یک گره schema محدود به مسیر را برای ابزارهای drill-down برمی‌گرداند
- `pnpm config:docs:check` / `pnpm config:docs:gen` هش baseline مستندات پیکربندی را در برابر سطح schema فعلی اعتبارسنجی می‌کنند

مسیر جست‌وجوی agent: پیش از ویرایش‌ها، برای مستندات و محدودیت‌های دقیق در سطح فیلد از اکشن ابزار `gateway` با نام `config.schema.lookup` استفاده کنید. برای راهنمایی وظیفه‌محور از [Configuration](/fa/gateway/configuration) و برای نقشه گسترده‌تر فیلدها، پیش‌فرض‌ها و پیوندها به مراجع زیرسیستم‌ها از این صفحه استفاده کنید.

مراجع عمیق اختصاصی:

- [مرجع پیکربندی حافظه](/fa/reference/memory-config) برای `agents.defaults.memorySearch.*`، `memory.qmd.*`، `memory.citations`، و پیکربندی dreaming زیر `plugins.entries.memory-core.config.dreaming`
- [دستورهای اسلش](/fa/tools/slash-commands) برای کاتالوگ فعلی دستورهای داخلی + بسته‌بندی‌شده
- صفحه‌های مالک کانال/Plugin برای سطوح دستور مخصوص کانال

قالب پیکربندی **JSON5** است (کامنت‌ها + کاماهای انتهایی مجازند). همه فیلدها اختیاری‌اند - OpenClaw وقتی حذف شوند از پیش‌فرض‌های امن استفاده می‌کند.

---

## کانال‌ها

کلیدهای پیکربندی مخصوص هر کانال به یک صفحه اختصاصی منتقل شده‌اند - برای `channels.*` از جمله Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و دیگر کانال‌های بسته‌بندی‌شده (احراز هویت، کنترل دسترسی، چندحسابی، mention gating)، [Configuration - channels](/fa/gateway/config-channels) را ببینید.

## پیش‌فرض‌های agent، چند-agent، sessionها و پیام‌ها

به یک صفحه اختصاصی منتقل شده است - [Configuration - agents](/fa/gateway/config-agents) را برای موارد زیر ببینید:

- `agents.defaults.*` (workspace، مدل، thinking، heartbeat، حافظه، رسانه، skills، sandbox)
- `multiAgent.*` (مسیریابی و bindingهای چند-agent)
- `session.*` (چرخه عمر session، compaction، pruning)
- `messages.*` (تحویل پیام، TTS، رندر markdown)
- `talk.*` (حالت Talk)
  - `talk.speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk در iOS/macOS
  - `talk.silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال transcript پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)

## ابزارها و providerهای سفارشی

سیاست ابزار، toggleهای آزمایشی، پیکربندی ابزارهای متکی به provider، و تنظیم provider / base-URL سفارشی به یک صفحه اختصاصی منتقل شده‌اند - [Configuration - tools and custom providers](/fa/gateway/config-tools) را ببینید.

## مدل‌ها

تعریف‌های provider، allowlistهای مدل، و تنظیم provider سفارشی در [Configuration - tools and custom providers](/fa/gateway/config-tools#custom-providers-and-base-urls) قرار دارند. ریشه `models` همچنین رفتار global کاتالوگ مدل را کنترل می‌کند.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: رفتار کاتالوگ provider (`merge` یا `replace`).
- `models.providers`: نگاشت provider سفارشی با کلید id provider.
- `models.pricing.enabled`: bootstrap پس‌زمینه قیمت‌گذاری را کنترل می‌کند که پس از رسیدن sidecarها و کانال‌ها به مسیر آماده Gateway شروع می‌شود. وقتی `false` باشد، Gateway fetchهای کاتالوگ قیمت‌گذاری OpenRouter و LiteLLM را رد می‌کند؛ مقادیر پیکربندی‌شده `models.providers.*.models[].cost` همچنان برای برآورد هزینه محلی کار می‌کنند.

## MCP

تعریف‌های server MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` قرار دارند و توسط Pi تعبیه‌شده و دیگر adapterهای runtime مصرف می‌شوند. دستورهای `openclaw mcp list`، `show`، `set` و `unset` این block را بدون اتصال به server هدف هنگام ویرایش پیکربندی مدیریت می‌کنند.

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

- `mcp.servers`: تعریف‌های server MCP نام‌دار stdio یا remote برای runtimeهایی که ابزارهای MCP پیکربندی‌شده را expose می‌کنند. ورودی‌های remote از `transport: "streamable-http"` یا `transport: "sse"` استفاده می‌کنند؛ `type: "http"` یک alias بومی CLI است که `openclaw mcp set` و `openclaw doctor --fix` آن را به فیلد canonical `transport` normalize می‌کنند.
- `mcp.sessionIdleTtlMs`: TTL بیکاری برای runtimeهای MCP بسته‌بندی‌شده محدود به session. اجراهای تعبیه‌شده one-shot پاک‌سازی پایان اجرا را درخواست می‌کنند؛ این TTL backstop برای sessionهای بلندمدت و callerهای آینده است.
- تغییرات زیر `mcp.*` با dispose کردن runtimeهای MCP کش‌شده session به‌صورت hot-apply اعمال می‌شوند. discovery/use بعدی ابزار، آن‌ها را از پیکربندی جدید دوباره می‌سازد، بنابراین ورودی‌های حذف‌شده `mcp.servers` به‌جای انتظار برای TTL بیکاری، فوری جمع‌آوری می‌شوند.

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

- `allowBundled`: allowlist اختیاری فقط برای skills بسته‌بندی‌شده (skills مدیریت‌شده/workspace تحت تأثیر نیستند).
- `load.extraDirs`: ریشه‌های skill مشترک اضافی (پایین‌ترین تقدم).
- `install.preferBrew`: وقتی true باشد، در صورت در دسترس بودن `brew`، پیش از fallback به انواع دیگر installer، installerهای Homebrew ترجیح داده می‌شوند.
- `install.nodeManager`: ترجیح installer Node برای specهای `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` یک skill را حتی اگر بسته‌بندی‌شده/نصب‌شده باشد غیرفعال می‌کند.
- `entries.<skillKey>.apiKey`: راه میان‌بر برای skills که یک env var اصلی اعلام می‌کنند (رشته plaintext یا شیء SecretRef).

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
- **تغییرات پیکربندی به restart کردن gateway نیاز دارند.**
- `allow`: allowlist اختیاری (فقط Pluginهای فهرست‌شده load می‌شوند). `deny` مقدم است.
- `bundledDiscovery`: برای پیکربندی‌های جدید به‌صورت پیش‌فرض `"allowlist"` است، بنابراین `plugins.allow` غیرخالی، Pluginهای provider بسته‌بندی‌شده را هم gate می‌کند، از جمله providerهای runtime web-search. Doctor برای پیکربندی‌های allowlist legacy مهاجرت‌داده‌شده `"compat"` می‌نویسد تا رفتار موجود provider بسته‌بندی‌شده را تا زمان opt in شما حفظ کند.
- `plugins.entries.<id>.apiKey`: فیلد میان‌بر کلید API در سطح Plugin (وقتی Plugin پشتیبانی کند).
- `plugins.entries.<id>.env`: نگاشت env var محدود به Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: وقتی `false` باشد، core، `before_prompt_build` را block می‌کند و فیلدهای تغییر‌دهنده prompt از legacy `before_agent_start` را نادیده می‌گیرد، در حالی که legacy `modelOverride` و `providerOverride` را حفظ می‌کند. روی hookهای Plugin بومی و دایرکتوری‌های hook ارائه‌شده توسط bundleهای پشتیبانی‌شده اعمال می‌شود.
- `plugins.entries.<id>.hooks.allowConversationAccess`: وقتی `true` باشد، Pluginهای غیر‌بسته‌بندی‌شده trusted می‌توانند محتوای خام conversation را از hookهای typed مانند `llm_input`، `llm_output`، `before_agent_finalize` و `agent_end` بخوانند.
- `plugins.entries.<id>.subagent.allowModelOverride`: صراحتا به این Plugin اعتماد می‌کند تا overrideهای `provider` و `model` برای هر اجرا را برای اجراهای subagent پس‌زمینه درخواست کند.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist اختیاری از هدف‌های canonical `provider/model` برای overrideهای subagent trusted. فقط وقتی از `"*"` استفاده کنید که عمدا می‌خواهید هر مدلی را مجاز کنید.
- `plugins.entries.<id>.config`: شیء پیکربندی تعریف‌شده توسط Plugin (در صورت وجود، با schema Plugin بومی OpenClaw اعتبارسنجی می‌شود).
- تنظیمات account/runtime مربوط به channel Plugin زیر `channels.<id>` قرار دارند و باید توسط فراداده `channelConfigs` در manifest Plugin مالک توصیف شوند، نه توسط یک registry مرکزی گزینه‌های OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: تنظیمات provider web-fetch در Firecrawl.
  - `apiKey`: کلید API Firecrawl (SecretRef را می‌پذیرد). به `plugins.entries.firecrawl.config.webSearch.apiKey`، legacy `tools.web.fetch.firecrawl.apiKey`، یا env var با نام `FIRECRAWL_API_KEY` fallback می‌کند.
  - `baseUrl`: URL پایه API Firecrawl (پیش‌فرض: `https://api.firecrawl.dev`؛ overrideهای self-hosted باید endpointهای private/internal را هدف بگیرند).
  - `onlyMainContent`: فقط محتوای اصلی صفحه‌ها را استخراج کن (پیش‌فرض: `true`).
  - `maxAgeMs`: حداکثر عمر cache به میلی‌ثانیه (پیش‌فرض: `172800000` / ۲ روز).
  - `timeoutSeconds`: timeout درخواست scrape به ثانیه (پیش‌فرض: `60`).
- `plugins.entries.xai.config.xSearch`: تنظیمات xAI X Search (جست‌وجوی وب Grok).
  - `enabled`: provider X Search را فعال می‌کند.
  - `model`: مدل Grok برای استفاده در search (مثلا `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: تنظیمات memory dreaming. برای phaseها و thresholdها [Dreaming](/fa/concepts/dreaming) را ببینید.
  - `enabled`: سوییچ اصلی dreaming (پیش‌فرض `false`).
  - `frequency`: cadence بر پایه Cron برای هر sweep کامل dreaming (به‌صورت پیش‌فرض `"0 3 * * *"`).
  - `model`: override اختیاری مدل subagent برای Dream Diary. به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد؛ برای محدود کردن targetها با `allowedModels` جفت کنید. خطاهای model-unavailable یک بار با مدل پیش‌فرض session retry می‌شوند؛ شکست‌های trust یا allowlist بی‌صدا fallback نمی‌کنند.
  - سیاست phase و thresholdها جزئیات پیاده‌سازی‌اند (کلیدهای پیکربندی کاربرمحور نیستند).
- پیکربندی کامل حافظه در [مرجع پیکربندی حافظه](/fa/reference/memory-config) قرار دارد:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Pluginهای bundle فعال‌شده Claude همچنین می‌توانند از `settings.json` پیش‌فرض‌های Pi تعبیه‌شده را اضافه کنند؛ OpenClaw آن‌ها را به‌عنوان تنظیمات پاک‌سازی‌شده agent اعمال می‌کند، نه به‌عنوان patchهای خام پیکربندی OpenClaw.
- `plugins.slots.memory`: id مربوط به Plugin حافظه فعال را انتخاب کنید، یا برای غیرفعال کردن Pluginهای حافظه `"none"` را انتخاب کنید.
- `plugins.slots.contextEngine`: id مربوط به Plugin فعال context engine را انتخاب کنید؛ مگر این‌که engine دیگری نصب و انتخاب کنید، پیش‌فرض `"legacy"` است.

[Plugins](/fa/tools/plugin) را ببینید.

---

## تعهدها

`commitments` حافظه follow-up استنباط‌شده را کنترل می‌کند: OpenClaw می‌تواند check-inها را از turnهای conversation تشخیص دهد و آن‌ها را از طریق اجراهای heartbeat تحویل دهد.

- `commitments.enabled`: extraction، ذخیره‌سازی و تحویل heartbeat پنهان LLM را برای commitmentهای follow-up استنباط‌شده فعال می‌کند. پیش‌فرض: `false`.
- `commitments.maxPerDay`: حداکثر commitmentهای follow-up استنباط‌شده که در یک روز rolling برای هر session agent تحویل داده می‌شوند. پیش‌فرض: `3`.

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
- `tabCleanup` پس از زمان بیکاری یا وقتی یک نشست از سقف خود فراتر برود، زبانه‌های اصلی ردیابی‌شدهٔ عامل را بازپس می‌گیرد. برای غیرفعال‌کردن هرکدام از حالت‌های پاک‌سازی جداگانه، `idleMinutes: 0` یا `maxTabsPerSession: 0` را تنظیم کنید.
- وقتی `ssrfPolicy.dangerouslyAllowPrivateNetwork` تنظیم نشده باشد غیرفعال است، بنابراین پیمایش مرورگر به‌صورت پیش‌فرض سخت‌گیرانه می‌ماند.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` را فقط وقتی تنظیم کنید که عمداً به پیمایش مرورگر در شبکهٔ خصوصی اعتماد دارید.
- در حالت سخت‌گیرانه، نقاط پایانی پروفایل CDP راه‌دور (`profiles.*.cdpUrl`) هنگام بررسی‌های دسترسی‌پذیری/کشف، مشمول همان مسدودسازی شبکهٔ خصوصی هستند.
- `ssrfPolicy.allowPrivateNetwork` همچنان به‌عنوان نام مستعار قدیمی پشتیبانی می‌شود.
- در حالت سخت‌گیرانه، از `ssrfPolicy.hostnameAllowlist` و `ssrfPolicy.allowedHostnames` برای استثناهای صریح استفاده کنید.
- پروفایل‌های راه‌دور فقط قابل اتصال هستند (شروع/توقف/بازنشانی غیرفعال است).
- `profiles.*.cdpUrl`، `http://`، `https://`، `ws://` و `wss://` را می‌پذیرد.
  وقتی می‌خواهید OpenClaw مسیر `/json/version` را کشف کند، از HTTP(S) استفاده کنید؛ وقتی ارائه‌دهندهٔ شما یک URL مستقیم DevTools WebSocket می‌دهد، از WS(S) استفاده کنید.
- `remoteCdpTimeoutMs` و `remoteCdpHandshakeTimeoutMs` برای دسترسی‌پذیری CDP راه‌دور و `attachOnly` به‌علاوهٔ درخواست‌های بازکردن زبانه اعمال می‌شوند. پروفایل‌های loopback مدیریت‌شده، پیش‌فرض‌های CDP محلی را نگه می‌دارند.
- اگر یک سرویس CDP مدیریت‌شدهٔ بیرونی از طریق loopback در دسترس است، برای آن پروفایل `attachOnly: true` را تنظیم کنید؛ در غیر این صورت OpenClaw پورت loopback را به‌عنوان پروفایل مرورگر مدیریت‌شدهٔ محلی در نظر می‌گیرد و ممکن است خطاهای مالکیت پورت محلی گزارش کند.
- پروفایل‌های `existing-session` به‌جای CDP از Chrome MCP استفاده می‌کنند و می‌توانند روی میزبان انتخاب‌شده یا از طریق یک گرهٔ مرورگر متصل، متصل شوند.
- پروفایل‌های `existing-session` می‌توانند `userDataDir` را برای هدف‌گرفتن یک پروفایل مرورگر مشخص مبتنی بر Chromium مانند Brave یا Edge تنظیم کنند.
- پروفایل‌های `existing-session` محدودیت‌های مسیر فعلی Chrome MCP را نگه می‌دارند:
  کنش‌های مبتنی بر snapshot/ref به‌جای هدف‌گیری با گزینشگر CSS، قلاب‌های بارگذاری یک‌فایلی، بدون بازنویسی مهلت گفت‌وگو، بدون `wait --load networkidle`، و بدون `responsebody`، خروجی PDF، رهگیری دانلود یا کنش‌های دسته‌ای.
- پروفایل‌های `openclaw` مدیریت‌شدهٔ محلی، `cdpPort` و `cdpUrl` را به‌صورت خودکار اختصاص می‌دهند؛ فقط برای CDP راه‌دور، `cdpUrl` را صریح تنظیم کنید.
- پروفایل‌های مدیریت‌شدهٔ محلی می‌توانند `executablePath` را تنظیم کنند تا `browser.executablePath` سراسری را برای آن پروفایل بازنویسی کنند. از این برای اجرای یک پروفایل در Chrome و پروفایل دیگر در Brave استفاده کنید.
- پروفایل‌های مدیریت‌شدهٔ محلی، پس از شروع فرایند برای کشف HTTP مربوط به Chrome CDP از `browser.localLaunchTimeoutMs` و برای آمادگی websocket مربوط به CDP پس از راه‌اندازی از `browser.localCdpReadyTimeoutMs` استفاده می‌کنند. روی میزبان‌های کندتر که Chrome با موفقیت شروع می‌شود اما بررسی‌های آمادگی با راه‌اندازی رقابت می‌کنند، آن‌ها را افزایش دهید. هر دو مقدار باید عددهای صحیح مثبت تا `120000` میلی‌ثانیه باشند؛ مقادیر پیکربندی نامعتبر رد می‌شوند.
- ترتیب تشخیص خودکار: مرورگر پیش‌فرض اگر مبتنی بر Chromium باشد ← Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- `browser.executablePath` و `browser.profiles.<name>.executablePath` هر دو `~` و `~/...` را پیش از راه‌اندازی Chromium، برای فهرست خانهٔ سیستم‌عامل شما می‌پذیرند.
  `userDataDir` هر پروفایل در پروفایل‌های `existing-session` نیز با tilde گسترش داده می‌شود.
- سرویس کنترل: فقط loopback (پورت برگرفته از `gateway.port`، پیش‌فرض `18791`).
- `extraArgs` پرچم‌های راه‌اندازی اضافی را به شروع Chromium محلی اضافه می‌کند (برای مثال `--disable-gpu`، اندازه‌گذاری پنجره، یا پرچم‌های اشکال‌زدایی).

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

<Accordion title="Gateway field details">

- `mode`:‏ `local` (اجرای Gateway) یا `remote` (اتصال به Gateway راه‌دور). Gateway از شروع به کار خودداری می‌کند مگر اینکه مقدار `local` باشد.
- `port`: پورت تکی چندمنظوره برای WS + HTTP. ترتیب اولویت: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`:‏ `auto`،‏ `loopback` (پیش‌فرض)،‏ `lan` (`0.0.0.0`)،‏ `tailnet` (فقط IP مربوط به Tailscale)، یا `custom`.
- **نام‌های مستعار قدیمی bind**: در `gateway.bind` از مقدارهای حالت bind استفاده کنید (`auto`،‏ `loopback`،‏ `lan`،‏ `tailnet`،‏ `custom`)، نه نام‌های مستعار میزبان (`0.0.0.0`،‏ `127.0.0.1`،‏ `localhost`،‏ `::`،‏ `::1`).
- **نکته Docker**: اتصال پیش‌فرض `loopback` داخل کانتینر روی `127.0.0.1` گوش می‌دهد. با شبکه‌سازی bridge در Docker (`-p 18789:18789`)، ترافیک روی `eth0` وارد می‌شود، بنابراین Gateway دسترس‌ناپذیر است. از `--network host` استفاده کنید، یا برای گوش‌دادن روی همه رابط‌ها `bind: "lan"` (یا `bind: "custom"` همراه با `customBindHost: "0.0.0.0"`) را تنظیم کنید.
- **احراز هویت**: به‌صورت پیش‌فرض الزامی است. bindهای غیر loopback به احراز هویت Gateway نیاز دارند. در عمل یعنی یک توکن/گذرواژه مشترک یا یک پروکسی معکوس آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`. جادوگر راه‌اندازی به‌صورت پیش‌فرض یک توکن تولید می‌کند.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefs)، مقدار `gateway.auth.mode` را به‌صراحت روی `token` یا `password` تنظیم کنید. وقتی هر دو پیکربندی شده باشند و mode تنظیم نشده باشد، جریان‌های راه‌اندازی و نصب/تعمیر سرویس شکست می‌خورند.
- `gateway.auth.mode: "none"`: حالت صریح بدون احراز هویت. فقط برای راه‌اندازی‌های trusted local loopback استفاده کنید؛ این مورد عمداً در اعلان‌های راه‌اندازی ارائه نمی‌شود.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت مرورگر/کاربر را به یک پروکسی معکوس آگاه از هویت واگذار می‌کند و به هدرهای هویت از `gateway.trustedProxies` اعتماد می‌کند (نگاه کنید به [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth)). این حالت به‌صورت پیش‌فرض انتظار یک منبع پروکسی **غیر loopback** را دارد؛ پروکسی‌های معکوس loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند. فراخوان‌های داخلی همان میزبان می‌توانند از `gateway.auth.password` به‌عنوان جایگزین مستقیم محلی استفاده کنند؛ `gateway.auth.token` همچنان با حالت trusted-proxy ناسازگار است.
- `gateway.auth.allowTailscale`: وقتی `true` باشد، هدرهای هویت Tailscale Serve می‌توانند احراز هویت رابط کاربری کنترل/WebSocket را برآورده کنند (از طریق `tailscale whois` تأیید می‌شود). نقاط پایانی HTTP API از آن احراز هویت هدر Tailscale استفاده **نمی‌کنند**؛ در عوض از حالت عادی احراز هویت HTTP مربوط به Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway مورد اعتماد است. وقتی `tailscale.mode = "serve"` باشد، مقدار پیش‌فرض `true` است.
- `gateway.auth.rateLimit`: محدودکننده اختیاری برای احراز هویت ناموفق. برای هر IP مشتری و برای هر دامنه احراز هویت اعمال می‌شود (shared-secret و device-token جداگانه ردیابی می‌شوند). تلاش‌های مسدودشده `429` + `Retry-After` برمی‌گردانند.
  - در مسیر ناهمگام رابط کاربری کنترل Tailscale Serve، تلاش‌های ناموفق برای همان `{scope, clientIp}` پیش از نوشتن شکست به‌صورت ترتیبی انجام می‌شوند. بنابراین تلاش‌های بد هم‌زمان از همان مشتری می‌توانند در درخواست دوم محدودکننده را فعال کنند، به‌جای اینکه هر دو صرفاً به‌عنوان عدم تطابق ساده عبور کنند.
  - مقدار پیش‌فرض `gateway.auth.rateLimit.exemptLoopback` برابر `true` است؛ وقتی عمداً می‌خواهید ترافیک localhost هم rate-limit شود (برای راه‌اندازی‌های آزمایشی یا استقرارهای سخت‌گیرانه پروکسی)، آن را روی `false` بگذارید.
- تلاش‌های احراز هویت WS با مبدأ مرورگر همیشه با معافیت loopback غیرفعال محدود می‌شوند (دفاع چندلایه در برابر brute force مبتنی بر مرورگر روی localhost).
- روی loopback، آن قفل‌شدن‌های با مبدأ مرورگر برای هر مقدار نرمال‌شده `Origin`
  جدا می‌شوند، بنابراین شکست‌های تکراری از یک مبدأ localhost به‌صورت خودکار
  مبدأ دیگری را قفل نمی‌کند.
- `tailscale.mode`:‏ `serve` (فقط tailnet، bind روی loopback) یا `funnel` (عمومی، نیازمند احراز هویت).
- `controlUi.allowedOrigins`: allowlist صریح مبدأ مرورگر برای اتصال‌های WebSocket به Gateway. وقتی انتظار می‌رود مشتری‌های مرورگر از مبدأهای غیر loopback باشند الزامی است.
- `controlUi.chatMessageMaxWidth`: حداکثر عرض اختیاری برای پیام‌های چت گروه‌بندی‌شده رابط کاربری کنترل. مقدارهای عرض CSS محدودشده مانند `960px`،‏ `82%`،‏ `min(1280px, 82%)`، و `calc(100% - 2rem)` را می‌پذیرد.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: حالت خطرناکی که جایگزینی مبدأ بر اساس هدر Host را برای استقرارهایی فعال می‌کند که عمداً به سیاست مبدأ مبتنی بر هدر Host متکی هستند.
- `remote.transport`:‏ `ssh` (پیش‌فرض) یا `direct` (ws/wss). برای `direct`، مقدار `remote.url` باید `ws://` یا `wss://` باشد.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: یک override اضطراری در محیط فرایند سمت مشتری
  که اجازه می‌دهد `ws://` متنی ساده به IPهای شبکه خصوصی مورد اعتماد استفاده شود؛
  پیش‌فرض برای متن ساده همچنان فقط loopback است. معادل `openclaw.json`
  وجود ندارد، و پیکربندی شبکه خصوصی مرورگر مانند
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` روی مشتری‌های WebSocket
  مربوط به Gateway اثری ندارد.
- `gateway.remote.token` / `.password` فیلدهای اعتبارنامه مشتری راه‌دور هستند. آن‌ها به‌تنهایی احراز هویت Gateway را پیکربندی نمی‌کنند.
- `gateway.push.apns.relay.baseUrl`: نشانی پایه HTTPS برای رله APNs خارجی که buildهای رسمی/TestFlight iOS پس از انتشار ثبت‌نام‌های متکی به رله در Gateway از آن استفاده می‌کنند. این URL باید با URL رله کامپایل‌شده در build iOS مطابقت داشته باشد.
- `gateway.push.apns.relay.timeoutMs`: مهلت زمانی ارسال از Gateway به رله بر حسب میلی‌ثانیه. مقدار پیش‌فرض `10000` است.
- ثبت‌نام‌های متکی به رله به یک هویت Gateway مشخص واگذار می‌شوند. برنامه جفت‌شده iOS مقدار `gateway.identity.get` را دریافت می‌کند، آن هویت را در ثبت‌نام رله می‌گنجاند، و یک مجوز ارسال محدود به ثبت‌نام را به Gateway فوروارد می‌کند. Gateway دیگری نمی‌تواند از آن ثبت‌نام ذخیره‌شده دوباره استفاده کند.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: overrideهای موقت env برای پیکربندی رله بالا.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: راه فرار فقط مخصوص توسعه برای URLهای رله HTTP روی loopback. URLهای رله تولید باید روی HTTPS بمانند.
- `gateway.handshakeTimeoutMs`: مهلت زمانی handshake پیش از احراز هویت WebSocket مربوط به Gateway بر حسب میلی‌ثانیه. پیش‌فرض: `15000`. وقتی `OPENCLAW_HANDSHAKE_TIMEOUT_MS` تنظیم شده باشد، اولویت دارد. روی میزبان‌های پرمشغله یا کم‌قدرت که مشتری‌های محلی می‌توانند در حالی وصل شوند که گرم‌شدن زمان شروع هنوز در حال پایدارشدن است، این مقدار را افزایش دهید.
- `gateway.channelHealthCheckMinutes`: فاصله پایش سلامت کانال بر حسب دقیقه. برای غیرفعال‌کردن سراسری راه‌اندازی‌های مجدد پایش سلامت، روی `0` تنظیم کنید. پیش‌فرض: `5`.
- `gateway.channelStaleEventThresholdMinutes`: آستانه stale-socket بر حسب دقیقه. این مقدار را بزرگ‌تر یا مساوی `gateway.channelHealthCheckMinutes` نگه دارید. پیش‌فرض: `30`.
- `gateway.channelMaxRestartsPerHour`: بیشینه راه‌اندازی‌های مجدد پایش سلامت برای هر کانال/حساب در یک ساعت چرخشی. پیش‌فرض: `10`.
- `channels.<provider>.healthMonitor.enabled`: انصراف برای هر کانال از راه‌اندازی‌های مجدد پایش سلامت، در حالی که پایشگر سراسری فعال می‌ماند.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override برای هر حساب در کانال‌های چندحسابی. وقتی تنظیم شده باشد، بر override سطح کانال اولویت دارد.
- مسیرهای فراخوان محلی Gateway فقط وقتی می‌توانند از `gateway.remote.*` به‌عنوان جایگزین استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صراحتاً از طریق SecretRef پیکربندی شده و حل‌نشده باشد، حل‌کردن به‌صورت بسته شکست می‌خورد (بدون پوشاندن با جایگزین راه‌دور).
- `trustedProxies`: IPهای پروکسی معکوس که TLS را خاتمه می‌دهند یا هدرهای forwarded-client را تزریق می‌کنند. فقط پروکسی‌هایی را فهرست کنید که کنترلشان می‌کنید. ورودی‌های loopback همچنان برای راه‌اندازی‌های پروکسی/تشخیص محلی روی همان میزبان معتبرند (برای مثال Tailscale Serve یا یک پروکسی معکوس محلی)، اما درخواست‌های loopback را واجد شرایط `gateway.auth.mode: "trusted-proxy"` نمی‌کنند.
- `allowRealIpFallback`: وقتی `true` باشد، اگر `X-Forwarded-For` وجود نداشته باشد Gateway مقدار `X-Real-IP` را می‌پذیرد. پیش‌فرض `false` است تا رفتار fail-closed باشد.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist اختیاری CIDR/IP برای تأیید خودکار جفت‌سازی اولیه دستگاه Node بدون scopeهای درخواستی. وقتی تنظیم نشده باشد غیرفعال است. این مورد جفت‌سازی operator/browser/رابط کاربری کنترل/WebChat را خودکار تأیید نمی‌کند، و ارتقاهای role، scope، metadata یا public-key را هم خودکار تأیید نمی‌کند.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: شکل‌دهی سراسری allow/deny برای فرمان‌های اعلام‌شده Node پس از جفت‌سازی و ارزیابی allowlist پلتفرم. برای پذیرش فرمان‌های خطرناک Node مانند `camera.snap`،‏ `camera.clip`، و `screen.record` از `allowCommands` استفاده کنید؛ `denyCommands` یک فرمان را حذف می‌کند، حتی اگر پیش‌فرض پلتفرم یا allow صریح در غیر این صورت آن را شامل می‌شد. پس از اینکه یک Node فهرست فرمان‌های اعلام‌شده خود را تغییر داد، جفت‌سازی آن دستگاه را رد و دوباره تأیید کنید تا Gateway snapshot فرمان به‌روزشده را ذخیره کند.
- `gateway.tools.deny`: نام ابزارهای اضافی که برای HTTP `POST /tools/invoke` مسدود می‌شوند (فهرست deny پیش‌فرض را گسترش می‌دهد).
- `gateway.tools.allow`: نام ابزارها را از فهرست deny پیش‌فرض HTTP حذف می‌کند.

</Accordion>

### نقاط پایانی سازگار با OpenAI

- Chat Completions: به‌صورت پیش‌فرض غیرفعال است. با `gateway.http.endpoints.chatCompletions.enabled: true` فعال کنید.
- Responses API:‏ `gateway.http.endpoints.responses.enabled`.
- سخت‌سازی ورودی URL در Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlistهای خالی به‌عنوان تنظیم‌نشده در نظر گرفته می‌شوند؛ برای غیرفعال‌کردن دریافت URL از `gateway.http.endpoints.responses.files.allowUrl=false`
    و/یا `gateway.http.endpoints.responses.images.allowUrl=false` استفاده کنید.
- هدر اختیاری سخت‌سازی پاسخ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (فقط برای مبدأهای HTTPS که کنترلشان می‌کنید تنظیم کنید؛ نگاه کنید به [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### جداسازی چندنمونه‌ای

چند Gateway را روی یک میزبان با پورت‌ها و مسیرهای وضعیت یکتا اجرا کنید:

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

- `enabled`: خاتمه TLS را روی listener مربوط به Gateway فعال می‌کند (HTTPS/WSS) (پیش‌فرض: `false`).
- `autoGenerate`: وقتی فایل‌های صریح پیکربندی نشده باشند، یک جفت cert/key خودامضای محلی به‌صورت خودکار تولید می‌کند؛ فقط برای استفاده محلی/توسعه.
- `certPath`: مسیر سیستم فایل به فایل گواهی TLS.
- `keyPath`: مسیر سیستم فایل به فایل کلید خصوصی TLS؛ دسترسی آن را محدود نگه دارید.
- `caPath`: مسیر اختیاری بسته CA برای تأیید مشتری یا زنجیره‌های اعتماد سفارشی.

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
  - `"restart"`: همیشه هنگام تغییر پیکربندی، فرایند Gateway را راه‌اندازی مجدد کن.
  - `"hot"`: تغییرات را بدون راه‌اندازی مجدد، درون فرایند اعمال کن.
  - `"hybrid"` (پیش‌فرض): ابتدا hot reload را امتحان کن؛ در صورت نیاز به restart برگرد.
- `debounceMs`: بازه debounce بر حسب ms پیش از اعمال تغییرات پیکربندی (عدد صحیح نامنفی).
- `deferralTimeoutMs`: بیشینه زمان اختیاری بر حسب ms برای انتظار جهت پایان عملیات‌های در حال انجام، پیش از اجبار به راه‌اندازی مجدد. برای استفاده از انتظار محدود پیش‌فرض (`300000`) آن را حذف کنید؛ برای انتظار نامحدود و ثبت هشدارهای دوره‌ای همچنان در انتظار، مقدار `0` را تنظیم کنید.

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
توکن‌های هوک در رشتهٔ پرس‌وجو رد می‌شوند.

نکات اعتبارسنجی و ایمنی:

- `hooks.enabled=true` به یک `hooks.token` غیرخالی نیاز دارد.
- `hooks.token` باید از `gateway.auth.token` **متمایز** باشد؛ استفادهٔ دوباره از توکن Gateway رد می‌شود.
- `hooks.path` نمی‌تواند `/` باشد؛ از یک زیربخش اختصاصی مانند `/hooks` استفاده کنید.
- اگر `hooks.allowRequestSessionKey=true` است، `hooks.allowedSessionKeyPrefixes` را محدود کنید (برای مثال `["hook:"]`).
- اگر یک نگاشت یا پیش‌تنظیم از `sessionKey` قالب‌دار استفاده می‌کند، `hooks.allowedSessionKeyPrefixes` و `hooks.allowRequestSessionKey=true` را تنظیم کنید. کلیدهای نگاشت ایستا به این انتخاب صریح نیاز ندارند.

**نقاط پایانی:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` از بار درخواست فقط زمانی پذیرفته می‌شود که `hooks.allowRequestSessionKey=true` باشد (پیش‌فرض: `false`).
- `POST /hooks/<name>` → از طریق `hooks.mappings` حل می‌شود
  - مقادیر `sessionKey` نگاشت که با قالب رندر شده‌اند، به‌عنوان مقادیر ارائه‌شده از بیرون در نظر گرفته می‌شوند و آن‌ها هم به `hooks.allowRequestSessionKey=true` نیاز دارند.

<Accordion title="جزئیات نگاشت">

- `match.path` با زیرمسیر پس از `/hooks` مطابقت دارد (مثلاً `/hooks/gmail` → `gmail`).
- `match.source` برای مسیرهای عمومی با یک فیلد بار مطابقت دارد.
- قالب‌هایی مانند `{{messages[0].subject}}` از بار می‌خوانند.
- `transform` می‌تواند به یک ماژول JS/TS اشاره کند که یک کنش هوک برمی‌گرداند.
  - `transform.module` باید یک مسیر نسبی باشد و داخل `hooks.transformsDir` بماند (مسیرهای مطلق و پیمایش مسیر رد می‌شوند).
  - `hooks.transformsDir` را زیر `~/.openclaw/hooks/transforms` نگه دارید؛ دایرکتوری‌های skill در فضای کاری رد می‌شوند. اگر `openclaw doctor` این مسیر را نامعتبر گزارش می‌کند، ماژول تبدیل را به دایرکتوری تبدیل‌های hooks منتقل کنید یا `hooks.transformsDir` را حذف کنید.
- `agentId` به یک عامل مشخص مسیریابی می‌کند؛ شناسه‌های ناشناخته به مقدار پیش‌فرض برمی‌گردند.
- `allowedAgentIds`: مسیریابی صریح را محدود می‌کند (`*` یا حذف‌شده = اجازه به همه، `[]` = رد همه).
- `defaultSessionKey`: کلید جلسهٔ ثابت اختیاری برای اجرای عامل هوک بدون `sessionKey` صریح.
- `allowRequestSessionKey`: به فراخوان‌های `/hooks/agent` و کلیدهای جلسهٔ نگاشت مبتنی بر قالب اجازه می‌دهد `sessionKey` را تنظیم کنند (پیش‌فرض: `false`).
- `allowedSessionKeyPrefixes`: فهرست مجاز اختیاریِ پیشوندها برای مقادیر صریح `sessionKey` (درخواست + نگاشت)، مثلاً `["hook:"]`. وقتی هر نگاشت یا پیش‌تنظیمی از `sessionKey` قالب‌دار استفاده کند، الزامی می‌شود.
- `deliver: true` پاسخ نهایی را به یک کانال می‌فرستد؛ مقدار پیش‌فرض `channel` برابر `last` است.
- `model` برای این اجرای هوک، LLM را بازنویسی می‌کند (اگر کاتالوگ مدل تنظیم شده باشد، باید مجاز باشد).

</Accordion>

### یکپارچه‌سازی Gmail

- پیش‌تنظیم داخلی Gmail از `sessionKey: "hook:gmail:{{messages[0].id}}"` استفاده می‌کند.
- اگر آن مسیریابی به‌ازای هر پیام را نگه می‌دارید، `hooks.allowRequestSessionKey: true` را تنظیم کنید و `hooks.allowedSessionKeyPrefixes` را طوری محدود کنید که با فضای نام Gmail مطابقت داشته باشد، برای مثال `["hook:", "hook:gmail:"]`.
- اگر به `hooks.allowRequestSessionKey: false` نیاز دارید، به‌جای پیش‌فرض قالب‌دار، پیش‌تنظیم را با یک `sessionKey` ایستا بازنویسی کنید.

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

- Gateway هنگام راه‌اندازی، در صورت پیکربندی، `gog gmail watch serve` را به‌صورت خودکار شروع می‌کند. برای غیرفعال کردن، `OPENCLAW_SKIP_GMAIL_WATCHER=1` را تنظیم کنید.
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

- HTML/CSS/JS و A2UI قابل‌ویرایش توسط عامل را از طریق HTTP زیر پورت Gateway ارائه می‌کند:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- فقط محلی: `gateway.bind: "loopback"` را نگه دارید (پیش‌فرض).
- اتصال‌های غیر-loopback: مسیرهای canvas مانند دیگر سطح‌های HTTP در Gateway به احراز هویت Gateway نیاز دارند (توکن/گذرواژه/پروکسی معتمد).
- Node WebViews معمولاً هدرهای احراز هویت ارسال نمی‌کنند؛ پس از جفت‌شدن و اتصال یک node، Gateway URLهای قابلیت با دامنهٔ node را برای دسترسی به canvas/A2UI اعلام می‌کند.
- URLهای قابلیت به نشست WS فعال node متصل‌اند و سریع منقضی می‌شوند. جایگزین مبتنی بر IP استفاده نمی‌شود.
- کلاینت بارگذاری مجدد زنده را به HTML ارائه‌شده تزریق می‌کند.
- وقتی خالی باشد، `index.html` آغازین را به‌صورت خودکار ایجاد می‌کند.
- A2UI را همچنین در `/__openclaw__/a2ui/` ارائه می‌کند.
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

- `minimal` (پیش‌فرض وقتی Plugin داخلی `bonjour` فعال است): `cliPath` + `sshPort` را از رکوردهای TXT حذف می‌کند.
- `full`: `cliPath` + `sshPort` را شامل می‌کند؛ تبلیغ چندپخشی LAN همچنان نیاز دارد Plugin داخلی `bonjour` فعال باشد.
- `off`: تبلیغ چندپخشی LAN را بدون تغییر فعال‌سازی Plugin سرکوب می‌کند.
- Plugin داخلی `bonjour` روی میزبان‌های macOS به‌صورت خودکار شروع می‌شود و روی استقرارهای Linux، Windows و Gateway کانتینری، اختیاری است.
- نام میزبان وقتی یک برچسب DNS معتبر باشد، به‌طور پیش‌فرض برابر نام میزبان سیستم است، وگرنه به `openclaw` برمی‌گردد. با `OPENCLAW_MDNS_HOSTNAME` بازنویسی کنید.

### گسترده‌ناحیه (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

یک ناحیهٔ DNS-SD تک‌پخشی را زیر `~/.openclaw/dns/` می‌نویسد. برای کشف بین‌شبکه‌ای، آن را با یک سرور DNS (CoreDNS توصیه می‌شود) + split DNS در Tailscale جفت کنید.

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

- متغیرهای محیطی درون‌خطی فقط زمانی اعمال می‌شوند که process env فاقد آن کلید باشد.
- فایل‌های `.env`: فایل `.env` در CWD +‏ `~/.openclaw/.env` (هیچ‌کدام متغیرهای موجود را بازنویسی نمی‌کنند).
- `shellEnv`: کلیدهای مورد انتظارِ موجودنبودنی را از پروفایل پوسته ورود شما وارد می‌کند.
- برای ترتیب تقدم کامل، [محیط](/fa/help/environment) را ببینید.

### جایگزینی متغیر محیطی

در هر رشته پیکربندی با `${VAR_NAME}` به متغیرهای محیطی ارجاع دهید:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- فقط نام‌های بزرگ مطابق می‌شوند: `[A-Z_][A-Z0-9_]*`.
- متغیرهای موجودنبودنی/خالی هنگام بارگذاری پیکربندی خطا ایجاد می‌کنند.
- برای مقدار لفظی `${VAR}` با `$${VAR}` escape کنید.
- با `$include` کار می‌کند.

---

## رازها

ارجاع‌های راز افزایشی هستند: مقادیر متن ساده همچنان کار می‌کنند.

### `SecretRef`

از یک شکل آبجکت استفاده کنید:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

اعتبارسنجی:

- الگوی `provider`:‏ `^[a-z][a-z0-9_-]{0,63}$`
- الگوی id برای `source: "env"`:‏ `^[A-Z][A-Z0-9_]{0,127}$`
- id برای `source: "file"`: اشاره‌گر JSON مطلق (برای مثال `"/providers/openai/apiKey"`)
- الگوی id برای `source: "exec"`:‏ `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- idهای `source: "exec"` نباید شامل بخش‌های مسیرِ جداشده با اسلش به شکل `.` یا `..` باشند (برای مثال `a/../b` رد می‌شود)

### سطح اعتبارنامه پشتیبانی‌شده

- ماتریس مرجع: [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)
- `secrets apply` مسیرهای اعتبارنامه پشتیبانی‌شده `openclaw.json` را هدف می‌گیرد.
- ارجاع‌های `auth-profiles.json` در حل‌کردن زمان اجرا و پوشش ممیزی گنجانده می‌شوند.

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
- مسیرهای ارائه‌دهنده file و exec وقتی اعتبارسنجی ACL در Windows در دسترس نباشد، به‌صورت بسته شکست می‌خورند. `allowInsecurePath: true` را فقط برای مسیرهای مورد اعتمادی تنظیم کنید که قابل اعتبارسنجی نیستند.
- ارائه‌دهنده `exec` به مسیر مطلق `command` نیاز دارد و از payloadهای پروتکل روی stdin/stdout استفاده می‌کند.
- به‌طور پیش‌فرض، مسیرهای فرمان symlink رد می‌شوند. `allowSymlinkCommand: true` را تنظیم کنید تا مسیرهای symlink مجاز شوند، درحالی‌که مسیر هدف حل‌شده اعتبارسنجی می‌شود.
- اگر `trustedDirs` پیکربندی شده باشد، بررسی دایرکتوری مورد اعتماد روی مسیر هدف حل‌شده اعمال می‌شود.
- محیط فرزند `exec` به‌طور پیش‌فرض حداقلی است؛ متغیرهای لازم را صراحتا با `passEnv` عبور دهید.
- ارجاع‌های راز هنگام فعال‌سازی به یک snapshot درون‌حافظه‌ای حل می‌شوند، سپس مسیرهای درخواست فقط snapshot را می‌خوانند.
- فیلترکردن سطح فعال هنگام فعال‌سازی اعمال می‌شود: ارجاع‌های حل‌نشده روی سطح‌های فعال باعث شکست راه‌اندازی/بارگذاری مجدد می‌شوند، درحالی‌که سطح‌های غیرفعال با diagnostics رد می‌شوند.

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
- `auth-profiles.json` برای حالت‌های اعتبارنامه ایستا از ارجاع‌های سطح‌مقدار (`keyRef` برای `api_key`،‏ `tokenRef` برای `token`) پشتیبانی می‌کند.
- نگاشت‌های تخت قدیمی `auth-profiles.json` مانند `{ "provider": { "apiKey": "..." } }` قالب زمان اجرا نیستند؛ `openclaw doctor --fix` آن‌ها را به پروفایل‌های کلید API مرجع `provider:default` با پشتیبان `.legacy-flat.*.bak` بازنویسی می‌کند.
- پروفایل‌های حالت OAuth (`auth.profiles.<id>.mode = "oauth"`) از اعتبارنامه‌های auth-profile مبتنی بر SecretRef پشتیبانی نمی‌کنند.
- اعتبارنامه‌های زمان اجرای ایستا از snapshotهای حل‌شده درون‌حافظه‌ای می‌آیند؛ ورودی‌های ایستای قدیمی `auth.json` هنگام کشف پاک‌سازی می‌شوند.
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

- `billingBackoffHours`: وقفه پایه بر حسب ساعت وقتی یک نمایه به دلیل خطاهای واقعی
  صورتحساب/اعتبار ناکافی شکست می‌خورد (پیش‌فرض: `5`). متن صریح صورتحساب می‌تواند
  همچنان حتی در پاسخ‌های `401`/`403` به اینجا برسد، اما تطبیق‌دهنده‌های متن ویژه هر ارائه‌دهنده
  محدود به همان ارائه‌دهنده‌ای می‌مانند که مالک آن‌هاست (برای مثال OpenRouter
  `Key limit exceeded`). پیام‌های قابل‌تلاش‌مجدد HTTP `402` مربوط به بازه مصرف یا
  سقف هزینه سازمان/فضای کاری، به‌جای این مسیر، در مسیر `rate_limit`
  باقی می‌مانند.
- `billingBackoffHoursByProvider`: بازنویسی‌های اختیاری به‌ازای هر ارائه‌دهنده برای ساعت‌های وقفه صورتحساب.
- `billingMaxHours`: سقف بر حسب ساعت برای رشد نمایی وقفه صورتحساب (پیش‌فرض: `24`).
- `authPermanentBackoffMinutes`: وقفه پایه بر حسب دقیقه برای شکست‌های با اطمینان بالا از نوع `auth_permanent` (پیش‌فرض: `10`).
- `authPermanentMaxMinutes`: سقف بر حسب دقیقه برای رشد وقفه `auth_permanent` (پیش‌فرض: `60`).
- `failureWindowHours`: پنجره لغزان بر حسب ساعت که برای شمارنده‌های وقفه استفاده می‌شود (پیش‌فرض: `24`).
- `overloadedProfileRotations`: بیشینه چرخش‌های نمایه احراز هویت همان ارائه‌دهنده برای خطاهای بارگذاری بیش‌ازحد، پیش از رفتن به سراغ جایگزین مدل (پیش‌فرض: `1`). شکل‌های مشغول‌بودن ارائه‌دهنده مثل `ModelNotReadyException` به اینجا می‌رسند.
- `overloadedBackoffMs`: تاخیر ثابت پیش از تلاش دوباره برای چرخش ارائه‌دهنده/نمایه بارگذاری‌شده بیش‌ازحد (پیش‌فرض: `0`).
- `rateLimitedProfileRotations`: بیشینه چرخش‌های نمایه احراز هویت همان ارائه‌دهنده برای خطاهای محدودیت نرخ، پیش از رفتن به سراغ جایگزین مدل (پیش‌فرض: `1`). آن سطل محدودیت نرخ شامل متن‌هایی با شکل ارائه‌دهنده مانند `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، و `resource exhausted` است.

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
- `maxFileBytes`: بیشینه اندازه فایل گزارش فعال بر حسب بایت پیش از چرخش (عدد صحیح مثبت؛ پیش‌فرض: `104857600` = 100 مگابایت). OpenClaw تا پنج بایگانی شماره‌گذاری‌شده را کنار فایل فعال نگه می‌دارد.
- `redactSensitive` / `redactPatterns`: پنهان‌سازی در حد بهترین تلاش برای خروجی کنسول، گزارش‌های فایل، رکوردهای گزارش OTLP، و متن پایدارشده رونوشت نشست. `redactSensitive: "off"` فقط این سیاست عمومی گزارش/رونوشت را غیرفعال می‌کند؛ سطوح ایمنی UI/ابزار/عیب‌یابی همچنان رازها را پیش از انتشار پنهان می‌کنند.

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
- `flags`: آرایه‌ای از رشته‌های پرچم که خروجی گزارش هدفمند را فعال می‌کنند (از نویسه‌های عام مثل `"telegram.*"` یا `"*"` پشتیبانی می‌کند).
- `stuckSessionWarnMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه برای دسته‌بندی نشست‌های پردازشی طولانی‌مدت به‌عنوان `session.long_running`، `session.stalled`، یا `session.stuck`. پاسخ، ابزار، وضعیت، بلوک، و پیشرفت ACP زمان‌سنج را بازنشانی می‌کنند؛ عیب‌یابی‌های تکراری `session.stuck` تا وقتی تغییری رخ ندهد با وقفه افزایشی عقب می‌نشینند.
- `stuckSessionAbortMs`: آستانه سن بدون پیشرفت بر حسب میلی‌ثانیه پیش از آنکه کار فعال متوقف‌شده واجد شرایط بتواند برای بازیابی لغو و تخلیه شود. وقتی تنظیم نشده باشد، OpenClaw از پنجره اجرای تعبیه‌شده امن‌تر و گسترده‌ترِ دست‌کم 10 دقیقه و 5 برابر `stuckSessionWarnMs` استفاده می‌کند.
- `otel.enabled`: خط لوله صدور OpenTelemetry را فعال می‌کند (پیش‌فرض: `false`). برای پیکربندی کامل، کاتالوگ سیگنال، و مدل حریم خصوصی، [صدور OpenTelemetry](/fa/gateway/opentelemetry) را ببینید.
- `otel.endpoint`: URL گردآورنده برای صدور OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط پایانی اختیاری OTLP ویژه سیگنال. وقتی تنظیم شوند، فقط برای همان سیگنال `otel.endpoint` را بازنویسی می‌کنند.
- `otel.protocol`: `"http/protobuf"` (پیش‌فرض) یا `"grpc"`.
- `otel.headers`: سرآیندهای فراداده HTTP/gRPC اضافی که همراه درخواست‌های صدور OTel ارسال می‌شوند.
- `otel.serviceName`: نام سرویس برای ویژگی‌های منبع.
- `otel.traces` / `otel.metrics` / `otel.logs`: صدور ردگیری، سنجه‌ها، یا گزارش را فعال می‌کند.
- `otel.sampleRate`: نرخ نمونه‌برداری ردگیری `0` تا `1`.
- `otel.flushIntervalMs`: فاصله تخلیه دوره‌ای تله‌متری بر حسب میلی‌ثانیه.
- `otel.captureContent`: ضبط محتوای خام با انتخاب صریح برای ویژگی‌های span در OTEL. به‌طور پیش‌فرض خاموش است. مقدار بولی `true` محتوای پیام/ابزار غیرسیستمی را ضبط می‌کند؛ شکل شیء به شما اجازه می‌دهد `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs`، و `systemPrompt` را صریحا فعال کنید.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: کلید محیطی برای آخرین ویژگی‌های آزمایشی ارائه‌دهنده span در GenAI. به‌طور پیش‌فرض spanها برای سازگاری ویژگی قدیمی `gen_ai.system` را نگه می‌دارند؛ سنجه‌های GenAI از ویژگی‌های معنایی کران‌دار استفاده می‌کنند.
- `OPENCLAW_OTEL_PRELOADED=1`: کلید محیطی برای میزبان‌هایی که قبلا یک SDK سراسری OpenTelemetry ثبت کرده‌اند. در این حالت OpenClaw راه‌اندازی/خاموش‌سازی SDK متعلق به Plugin را رد می‌کند، در حالی که شنونده‌های عیب‌یابی را فعال نگه می‌دارد.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`، و `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغیرهای محیطی نقطه پایانی ویژه سیگنال که وقتی کلید پیکربندی متناظر تنظیم نشده باشد استفاده می‌شوند.
- `cacheTrace.enabled`: ثبت عکس‌های لحظه‌ای ردگیری کش برای اجراهای تعبیه‌شده (پیش‌فرض: `false`).
- `cacheTrace.filePath`: مسیر خروجی برای JSONL ردگیری کش (پیش‌فرض: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: کنترل می‌کند چه چیزی در خروجی ردگیری کش گنجانده شود (همگی به‌طور پیش‌فرض: `true`).

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
- `checkOnStart`: بررسی به‌روزرسانی‌های npm هنگام شروع Gateway (پیش‌فرض: `true`).
- `auto.enabled`: فعال‌کردن به‌روزرسانی خودکار پس‌زمینه برای نصب‌های بسته‌ای (پیش‌فرض: `false`).
- `auto.stableDelayHours`: کمینه تاخیر بر حسب ساعت پیش از اعمال خودکار کانال پایدار (پیش‌فرض: `6`؛ بیشینه: `168`).
- `auto.stableJitterHours`: پنجره گستردگی عرضه اضافی برای کانال پایدار بر حسب ساعت (پیش‌فرض: `12`؛ بیشینه: `168`).
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

- `enabled`: دروازه سراسری قابلیت ACP (پیش‌فرض: `true`؛ برای پنهان‌کردن امکانات ارسال و ایجاد ACP، آن را روی `false` بگذارید).
- `dispatch.enabled`: دروازه مستقل برای ارسال نوبت نشست ACP (پیش‌فرض: `true`). برای در دسترس نگه‌داشتن فرمان‌های ACP در حالی که اجرا مسدود است، آن را روی `false` بگذارید.
- `backend`: شناسه پیش‌فرض پشتیبان زمان اجرای ACP (باید با یک Plugin زمان اجرای ACP ثبت‌شده مطابقت داشته باشد).
  ابتدا Plugin پشتیبان را نصب کنید، و اگر `plugins.allow` تنظیم شده است، شناسه Plugin پشتیبان (برای مثال `acpx`) را نیز وارد کنید وگرنه پشتیبان ACP بارگذاری نمی‌شود.
- `defaultAgent`: شناسه عامل هدف جایگزین ACP وقتی ایجادها هدف صریحی مشخص نمی‌کنند.
- `allowedAgents`: فهرست مجاز شناسه‌های عامل که برای نشست‌های زمان اجرای ACP مجاز هستند؛ خالی‌بودن یعنی هیچ محدودیت اضافی وجود ندارد.
- `maxConcurrentSessions`: بیشینه نشست‌های ACP هم‌زمان فعال.
- `stream.coalesceIdleMs`: پنجره تخلیه بیکار بر حسب میلی‌ثانیه برای متن جریان‌یافته.
- `stream.maxChunkChars`: بیشینه اندازه قطعه پیش از تقسیم نمایش بلوک جریان‌یافته.
- `stream.repeatSuppression`: خطوط وضعیت/ابزار تکراری را در هر نوبت سرکوب می‌کند (پیش‌فرض: `true`).
- `stream.deliveryMode`: `"live"` به‌صورت افزایشی جریان می‌دهد؛ `"final_only"` تا رویدادهای پایانی نوبت بافر می‌کند.
- `stream.hiddenBoundarySeparator`: جداکننده پیش از متن قابل‌مشاهده پس از رویدادهای ابزار پنهان (پیش‌فرض: `"paragraph"`).
- `stream.maxOutputChars`: بیشینه نویسه‌های خروجی دستیار که در هر نوبت ACP نمایش داده می‌شود.
- `stream.maxSessionUpdateChars`: بیشینه نویسه‌ها برای خطوط وضعیت/به‌روزرسانی ACP نمایش‌داده‌شده.
- `stream.tagVisibility`: رکوردی از نام‌های برچسب به بازنویسی‌های نمایانی بولی برای رویدادهای جریان‌یافته.
- `runtime.ttlMinutes`: TTL بیکاری بر حسب دقیقه برای کارگرهای نشست ACP پیش از واجد شرایط شدن برای پاک‌سازی.
- `runtime.installCommand`: فرمان نصب اختیاری برای اجرا هنگام بوت‌استرپ محیط زمان اجرای ACP.

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
  - `"off"`: بدون متن شعار (عنوان/نسخه بنر همچنان نشان داده می‌شود).
- برای پنهان‌کردن کل بنر (نه فقط شعارها)، env `OPENCLAW_HIDE_BANNER=1` را تنظیم کنید.

---

## راه‌انداز

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

فیلدهای هویت `agents.list` را زیر [پیش‌فرض‌های عامل](/fa/gateway/config-agents#agent-defaults) ببینید.

---

## پل (قدیمی، حذف‌شده)

ساخت‌های فعلی دیگر شامل پل TCP نیستند. Nodeها از طریق WebSocket مربوط به Gateway وصل می‌شوند. کلیدهای `bridge.*` دیگر بخشی از طرح‌واره پیکربندی نیستند (اعتبارسنجی تا زمان حذف آن‌ها شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند کلیدهای ناشناخته را حذف کند).

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

- `sessionRetention`: مدت نگه‌داری نشست‌های تکمیل‌شدهٔ اجرای ایزولهٔ Cron پیش از پاک‌سازی از `sessions.json`. همچنین پاک‌سازی رونوشت‌های آرشیوشدهٔ Cron حذف‌شده را کنترل می‌کند. پیش‌فرض: `24h`؛ برای غیرفعال‌سازی روی `false` تنظیم کنید.
- `runLog.maxBytes`: بیشینهٔ اندازه برای هر فایل گزارش اجرا (`cron/runs/<jobId>.jsonl`) پیش از پاک‌سازی. پیش‌فرض: `2_000_000` بایت.
- `runLog.keepLines`: جدیدترین خط‌هایی که هنگام فعال شدن پاک‌سازی گزارش اجرا نگه داشته می‌شوند. پیش‌فرض: `2000`.
- `webhookToken`: توکن حامل که برای تحویل POST Webhook مربوط به Cron استفاده می‌شود (`delivery.mode = "webhook"`). اگر حذف شود، هیچ سرآیند احراز هویتی ارسال نمی‌شود.
- `webhook`: نشانی Webhook قدیمیِ جایگزین و منسوخ (http/https) که فقط برای کارهای ذخیره‌شده‌ای استفاده می‌شود که هنوز `notify: true` دارند.

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

- `maxAttempts`: بیشینهٔ تلاش‌های دوباره برای کارهای یک‌باره هنگام خطاهای گذرا (پیش‌فرض: `3`؛ بازه: `0`-`10`).
- `backoffMs`: آرایه‌ای از تأخیرهای backoff بر حسب میلی‌ثانیه برای هر تلاش دوباره (پیش‌فرض: `[30000, 60000, 300000]`؛ 1 تا 10 ورودی).
- `retryOn`: نوع خطاهایی که تلاش دوباره را فعال می‌کنند - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. برای تلاش دوباره روی همهٔ انواع گذرا، حذفش کنید.

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
- `after`: تعداد شکست‌های پیاپی پیش از فعال شدن هشدار (عدد صحیح مثبت، کمینه: `1`).
- `cooldownMs`: کمینهٔ میلی‌ثانیه بین هشدارهای تکراری برای همان کار (عدد صحیح نامنفی).
- `includeSkipped`: اجراهای ردشدهٔ پیاپی را در آستانهٔ هشدار حساب می‌کند (پیش‌فرض: `false`). اجراهای ردشده جداگانه رهگیری می‌شوند و روی backoff خطای اجرا اثر نمی‌گذارند.
- `mode`: حالت تحویل - `"announce"` از طریق پیام کانال ارسال می‌کند؛ `"webhook"` به Webhook پیکربندی‌شده POST می‌کند.
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
- `channel`: بازنویسی کانال برای تحویل announce. `"last"` آخرین کانال تحویل شناخته‌شده را دوباره استفاده می‌کند.
- `to`: هدف announce یا URL صریح Webhook. برای حالت Webhook الزامی است.
- `accountId`: بازنویسی اختیاری حساب برای تحویل.
- `delivery.failureDestination` در سطح هر کار، این پیش‌فرض سراسری را بازنویسی می‌کند.
- وقتی نه مقصد شکست سراسری و نه مقصد شکست در سطح کار تنظیم شده باشد، کارهایی که از پیش از طریق `announce` تحویل می‌دهند، هنگام شکست به همان هدف اصلی announce برمی‌گردند.
- `delivery.failureDestination` فقط برای کارهای `sessionTarget="isolated"` پشتیبانی می‌شود، مگر اینکه `delivery.mode` اصلی کار `"webhook"` باشد.

[کارهای Cron](/fa/automation/cron-jobs) را ببینید. اجراهای Cron ایزوله به‌عنوان [وظایف پس‌زمینه](/fa/automation/tasks) رهگیری می‌شوند.

---

## متغیرهای الگوی مدل رسانه

جای‌نگهدارهای الگو که در `tools.media.models[].args` گسترش می‌یابند:

| متغیر              | توضیح                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | متن کامل پیام ورودی                              |
| `{{RawBody}}`      | متن خام (بدون پوشش‌های تاریخچه/فرستنده)          |
| `{{BodyStripped}}` | متن با حذف اشاره‌های گروه                        |
| `{{From}}`         | شناسهٔ فرستنده                                   |
| `{{To}}`           | شناسهٔ مقصد                                      |
| `{{MessageSid}}`   | شناسهٔ پیام کانال                                |
| `{{SessionId}}`    | UUID نشست فعلی                                   |
| `{{IsNewSession}}` | وقتی نشست جدید ساخته شده باشد `"true"`           |
| `{{MediaUrl}}`     | شبه‌URL رسانهٔ ورودی                             |
| `{{MediaPath}}`    | مسیر محلی رسانه                                  |
| `{{MediaType}}`    | نوع رسانه (تصویر/صدا/سند/…)                      |
| `{{Transcript}}`   | رونوشت صوتی                                      |
| `{{Prompt}}`       | پرامپت رسانهٔ حل‌شده برای ورودی‌های CLI          |
| `{{MaxChars}}`     | بیشینهٔ نویسه‌های خروجی حل‌شده برای ورودی‌های CLI |
| `{{ChatType}}`     | `"direct"` یا `"group"`                           |
| `{{GroupSubject}}` | موضوع گروه (در حد امکان)                         |
| `{{GroupMembers}}` | پیش‌نمایش اعضای گروه (در حد امکان)               |
| `{{SenderName}}`   | نام نمایشی فرستنده (در حد امکان)                 |
| `{{SenderE164}}`   | شماره تلفن فرستنده (در حد امکان)                 |
| `{{Provider}}`     | راهنمای Provider (whatsapp، telegram، discord، و غیره) |

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
- آرایه‌ای از فایل‌ها: به‌ترتیب به‌صورت عمیق ادغام می‌شوند (موارد بعدی، قبلی‌ها را بازنویسی می‌کنند).
- کلیدهای هم‌سطح: پس از includeها ادغام می‌شوند (مقادیر includeشده را بازنویسی می‌کنند).
- includeهای تو در تو: تا 10 سطح عمق.
- مسیرها: نسبت به فایل includeکننده حل می‌شوند، اما باید داخل دایرکتوری پیکربندی سطح بالا (`dirname` مربوط به `openclaw.json`) باقی بمانند. شکل‌های مطلق/`../` فقط وقتی مجازند که همچنان داخل آن مرز حل شوند.
- نوشتن‌های متعلق به OpenClaw که فقط یک بخش سطح بالای پشتیبانی‌شده با include تک‌فایلی را تغییر می‌دهند، در همان فایل includeشده نوشته می‌شوند. برای مثال، `plugins install` مقدار `plugins: { $include: "./plugins.json5" }` را در `plugins.json5` به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد.
- includeهای ریشه، آرایه‌های include، و includeهایی با بازنویسی‌های هم‌سطح برای نوشتن‌های متعلق به OpenClaw فقط‌خواندنی هستند؛ آن نوشتن‌ها به‌جای تخت کردن پیکربندی، به‌صورت بسته شکست می‌خورند.
- خطاها: پیام‌های روشن برای فایل‌های گم‌شده، خطاهای تجزیه، و includeهای حلقوی.

---

_مرتبط: [پیکربندی](/fa/gateway/configuration) · [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)

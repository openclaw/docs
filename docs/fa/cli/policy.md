---
read_when:
    - می‌خواهید تنظیمات OpenClaw را با یک policy.jsonc تألیف‌شده بررسی کنید.
    - شما یافته‌های سیاست را در lint داکتر می‌خواهید
    - برای شواهد حسابرسی به یک هش تأیید سیاست نیاز دارید
summary: مرجع CLI برای بررسی‌های انطباق `openclaw policy`
title: سیاست
x-i18n:
    generated_at: "2026-06-27T17:27:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` توسط Plugin همراه Policy ارائه می‌شود. Policy یک لایه
انطباق سازمانی روی تنظیمات موجود OpenClaw است. این فرمان یک سامانه پیکربندی
دوم اضافه نمی‌کند. `policy.jsonc` الزام‌های نوشته‌شده را تعریف می‌کند،
OpenClaw فضای کاری فعال را به‌عنوان شواهد مشاهده می‌کند، و بررسی‌های سلامت
Policy انحراف را از طریق `doctor --lint` گزارش می‌دهند. سیگنال نهایی انطباق،
اجرای تمیز `doctor --lint` است؛ Policy یافته‌ها را به همان سطح lint مشترک
اضافه می‌کند، به‌جای اینکه یک دروازه سلامت جداگانه بسازد.

Policy در حال حاضر کانال‌های پیکربندی‌شده، سرورهای MCP، ارائه‌دهندگان مدل،
وضعیت SSRF شبکه، وضعیت دسترسی ورودی/کانال، وضعیت در معرض بودن Gateway، وضعیت فضای کاری عامل،
وضعیت مدیریت داده، وضعیت ارائه‌دهنده راز/پروفایل احراز هویت در پیکربندی OpenClaw، و اعلان‌های ابزار
تحت حاکمیت را مدیریت می‌کند. برای مثال، IT یا یک گرداننده فضای کاری می‌تواند ثبت کند که Telegram
یک ارائه‌دهنده کانال تأییدشده نیست، سرورهای MCP و ارجاع‌های مدل را به ورودی‌های
تأییدشده محدود کند، الزام کند دسترسی fetch/browser به شبکه خصوصی
غیرفعال بماند، الزام کند جداسازی نشست پیام مستقیم و وضعیت ورودی کانال
در محدوده‌های بازبینی‌شده بمانند، الزام کند bind/auth/HTTP exposure در Gateway در محدوده‌های بازبینی‌شده
بماند، الزام کند دسترسی فضای کاری عامل و انکارهای ابزار در وضعیتی بازبینی‌شده
بمانند، الزام کند SecretRefهای پیکربندی OpenClaw از ارائه‌دهندگان مدیریت‌شده استفاده کنند، الزام کند
پروفایل‌های احراز هویت پیکربندی metadata ارائه‌دهنده/حالت داشته باشند، الزام کند ابزارهای تحت حاکمیت
metadata ریسک و حساسیت داشته باشند، الزام کند لاگ‌گیری حساس بازنویسی و پوشانده شود، ثبت محتوای
telemetry را منع کند، نگهداری retention نشست را الزام کند، نمایه‌سازی حافظه رونوشت نشست را منع کند،
سپس از `doctor --lint` به‌عنوان دروازه انطباق مشترک استفاده کند.

از Policy زمانی استفاده کنید که یک فضای کاری به بیانیه‌ای پایدار مثل «این کانال‌ها
نباید فعال شوند» یا «ابزارهای تحت حاکمیت باید metadata تأیید را اعلام کنند» و روشی
تکرارپذیر برای اثبات اینکه OpenClaw هنوز با آن بیانیه منطبق است نیاز دارد. وقتی فقط به رفتار محلی نیاز دارید و
به یافته‌های Policy یا خروجی گواهی‌پذیری نیاز ندارید، فقط از پیکربندی معمولی و مستندات فضای کاری استفاده کنید.

## شروع سریع

Plugin همراه Policy را پیش از نخستین استفاده فعال کنید:

```bash
openclaw plugins enable policy
```

وقتی Policy فعال است، doctor می‌تواند بررسی‌های سلامت Policy را بدون فعال‌سازی
Pluginهای دلخواه بارگذاری کند. اگر `policy.jsonc` وجود نداشته باشد، Plugin همچنان
فعال می‌ماند تا doctor بتواند نبودن این مصنوع را گزارش کند.

Policy نوشته می‌شود، نه اینکه از تنظیمات فعلی کاربر تولید شود. یک Policy حداقلی
برای کانال‌ها، سرورهای MCP، ارائه‌دهندگان مدل، وضعیت شبکه، دسترسی ورودی/کانال، میزان در معرض بودن Gateway،
وضعیت فضای کاری عامل، وضعیت runtime سندباکس پیکربندی‌شده، وضعیت مدیریت داده OpenClaw،
وضعیت ارائه‌دهنده راز/پروفایل احراز هویت پیکربندی، وضعیت فایل تأیید exec، و metadata ابزار
به این شکل است:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

قواعد مرجع نهایی هستند. یک بلوک دسته‌بندی فقط یک namespace است؛ بررسی‌ها
زمانی اجرا می‌شوند که یک قاعده مشخص وجود داشته باشد. OpenClaw تنظیمات فعلی `channels.*`،
`mcp.servers.*`، `models.providers.*`، ارجاع‌های مدل عامل انتخاب‌شده، تنظیمات SSRF شبکه،
دامنه نشست پیام مستقیم، Policy پیام مستقیم کانال، Policy گروه کانال،
دروازه‌های mention کانال/گروه، وضعیت bind/auth/Control UI/Tailscale/remote/HTTP در Gateway،
وضعیت دسترسی فضای کاری سندباکس عامل در پیکربندی OpenClaw و وضعیت انکار ابزار،
وضعیت پیکربندی مدیریت داده، منشأ ارائه‌دهنده راز
و SecretRef در پیکربندی، metadata پروفایل احراز هویت پیکربندی، وضعیت ابزار
سراسری/برای هر عامل پیکربندی‌شده، و اعلان‌های `TOOLS.md` را به‌عنوان شواهد می‌خواند، سپس
وضعیت مشاهده‌شده‌ای را که منطبق نیست گزارش می‌کند. اگر یک Policy bindهای غیر loopback
برای Gateway را منع می‌کند، فقط وقتی `gateway.bind` را حذف کنید که
مایلید مقدار پیش‌فرض runtime را بازبینی کنید؛ برای انطباق سخت‌گیرانه پیکربندی، `gateway.bind=loopback` را تنظیم کنید.
برای وضعیت عامل فقط‌خواندنی، حالت سندباکس را روی پیش‌فرض‌ها یا عامل مربوط تنظیم کنید و `workspaceAccess` را روی `none` یا
`ro` بگذارید؛ حالت سندباکس حذف‌شده یا `off` یک Policy فقط‌خواندنی/بدون نوشتن را
برآورده نمی‌کند. `agents.workspace.denyTools` از `exec`، `process`، `write`،
`edit` و `apply_patch` پشتیبانی می‌کند؛ در پیکربندی OpenClaw، `group:fs` ابزارهای تغییر فایل
و `group:runtime` ابزارهای shell/process را پوشش می‌دهد. Policy وضعیت ابزار،
`tools.profile`، `tools.allow`، `tools.alsoAllow`، `tools.deny`،
`tools.fs.workspaceOnly`، `tools.exec.security`، `tools.exec.ask`،
`tools.exec.host`، `tools.elevated.enabled`، و همان overrideهای برای هر عامل
`agents.list[].tools.*` را مشاهده می‌کند. Policy تأیید exec فقط زمانی مصنوع محصول
نام‌گذاری‌شده `exec-approvals.json` را می‌خواند که یک قاعده `execApprovals` وجود داشته باشد؛
شواهد، پیش‌فرض‌ها، وضعیت برای هر عامل، و الگوهای allowlist را بدون توکن‌های socket یا متن دستور آخرین استفاده‌شده
ثبت می‌کنند. Policy فراخوانی‌های ابزار را در runtime اجرا یا تحمیل نمی‌کند. شواهد راز
وضعیت ارائه‌دهنده/منبع و metadata SecretRef را ثبت می‌کند، نه هرگز مقدار خام رازها را. Policy
credential storeهای برای هر عامل مثل `auth-profiles.json` را نمی‌خواند یا گواهی نمی‌کند؛
آن storeها همچنان در مالکیت جریان‌های موجود احراز هویت و credential باقی می‌مانند.
شواهد مدیریت داده فقط وضعیت در سطح پیکربندی است: حالت بازنویسی، toggleهای ثبت محتوای telemetry،
حالت نگهداری نشست، و تنظیمات نمایه‌سازی حافظه رونوشت نشست را بررسی می‌کند. این کار لاگ‌های خام،
خروجی‌های telemetry، محتوای رونوشت، فایل‌های حافظه را بازرسی نمی‌کند، یا ثابت نمی‌کند که هیچ داده شخصی
یا رازی وجود ندارد.

### مرجع قواعد Policy

هر فیلد Policy در زیر اختیاری است. یک بررسی فقط زمانی اجرا می‌شود که قاعده متناظر
در `policy.jsonc` وجود داشته باشد. وضعیت مشاهده‌شده، پیکربندی موجود OpenClaw یا
metadata فضای کاری است؛ Policy انحراف را گزارش می‌کند اما رفتار runtime را بازنویسی نمی‌کند
مگر اینکه یک مسیر repair به‌صورت صریح در دسترس و فعال باشد.
فایل‌های Policy سخت‌گیرانه هستند: بخش‌ها یا کلیدهای قاعده پشتیبانی‌نشده به‌جای نادیده گرفته شدن،
به‌صورت `policy/policy-jsonc-invalid` گزارش می‌شوند.

Overlayهای Policy قواعد گسترده سطح بالا را سراسری نگه می‌دارند، سپس به بلوک‌های scope نام‌گذاری‌شده اجازه می‌دهند
بخش‌های عادی سخت‌گیرانه‌تر Policy را برای selectorهای صریح اضافه کنند. نام scope فقط یک
دسته توصیفی است؛ تطبیق از مقدارهای selector داخل scope استفاده می‌کند.
Overlay افزایشی است: ادعاهای سراسری همچنان اجرا می‌شوند، و یک ادعای scoped می‌تواند
یافته خودش را علیه همان پیکربندی مشاهده‌شده منتشر کند.

#### Overlayهای scoped

وقتی یک مجموعه از عامل‌ها یا کانال‌ها به Policy سخت‌گیرانه‌تر از baseline سطح بالا نیاز دارد،
از `scopes.<scopeName>` استفاده کنید. بخش‌های agent-scoped از `agentIds` استفاده می‌کنند که
از `tools.*`، `agents.workspace.*`، `sandbox.*`، `dataHandling.memory.*`
و `execApprovals.*` پشتیبانی می‌کند. ورودی channel-scoped
از `channelIds` استفاده می‌کند که از `ingress.channels.*` پشتیبانی می‌کند. بخش‌های پشتیبانی‌نشده
به‌جای نادیده گرفته شدن رد می‌شوند. اگر یک ورودی `agentIds` در
`agents.list[]` وجود نداشته باشد، OpenClaw قاعده scoped را در برابر وضعیت ارث‌بری‌شده
سراسری/پیش‌فرض برای آن شناسه عامل runtime ارزیابی می‌کند.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

همان عامل می‌تواند در چند scope ظاهر شود، وقتی هر scope فیلدهای متفاوتی را
حاکم می‌کند، همان‌طور که در بالا نشان داده شده است. یک فیلد scoped تکراری برای همان عامل باید
طبق metadata Policy به همان اندازه یا بیشتر سخت‌گیرانه باشد؛ ادعاهای تکراری ضعیف‌تر
رد می‌شوند. metadata سخت‌گیری با allow-listها مانند زیرمجموعه‌ها،
با deny-listها مانند ابرمجموعه‌ها، و با بولین‌های الزامی مانند الزام‌های ثابت رفتار می‌کند.

Policy وضعیت container فقط در برابر شواهدی ارزیابی می‌شود که OpenClaw می‌تواند
برای عامل تطبیق‌یافته مشاهده کند. اگر یک قاعده فعال `sandbox.containers.*` روی
عاملی اعمال شود که backend سندباکس آن نتواند آن فیلد را آشکار کند، Policy به‌جای قبول دانستن ادعا،
`policy/sandbox-container-posture-unobservable` را گزارش می‌کند. برای گروه‌های عاملی که از backendهای
سندباکس متفاوت استفاده می‌کنند، از scopeهای `agentIds` جداگانه استفاده کنید، و برای
گروه‌هایی که آن فیلدها قابل مشاهده نیستند، قواعد پشتیبانی‌نشده container را تنظیم‌نشده یا false رها کنید.

`ingress.session.requireDmScope` در سطح بالا سراسری باقی می‌ماند زیرا
`session.dmScope` شواهد قابل انتساب به کانال نیست.

| انتخابگر     | بخش‌های پشتیبانی‌شده                                                                 | زمان استفاده                                          |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `agentIds`   | `tools`، `agents.workspace`، `sandbox`، `dataHandling.memory`، و `execApprovals` | یک یا چند عامل زمان اجرا به قواعد سخت‌گیرانه‌تری نیاز دارند.   |
| `channelIds` | `ingress.channels`                                                                 | یک یا چند کانال به قواعد ورودی سخت‌گیرانه‌تری نیاز دارند. |

هر دامنه‌ای که در `policy.jsonc` وجود دارد باید معتبر و قابل اجرا باشد.

#### کانال‌ها

| فیلد سیاست                         | وضعیت مشاهده‌شده                          | زمان استفاده                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | ارائه‌دهنده `channels.*` و وضعیت فعال بودن | جلوگیری از کانال‌های پیکربندی‌شده از یک ارائه‌دهنده مانند `telegram`. |
| `channels.denyRules[].reason`        | پیام یافته و زمینه راهنمای ترمیم | توضیح اینکه چرا ارائه‌دهنده رد شده است.                          |

#### سرورهای MCP

| فیلد سیاست        | وضعیت مشاهده‌شده      | زمان استفاده                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | شناسه‌های `mcp.servers.*` | الزام اینکه هر سرور MCP پیکربندی‌شده در فهرست مجاز باشد. |
| `mcp.servers.deny`  | شناسه‌های `mcp.servers.*` | رد شناسه‌های مشخص سرور MCP پیکربندی‌شده.                   |

#### ارائه‌دهندگان مدل

| فیلد سیاست             | وضعیت مشاهده‌شده                                   | زمان استفاده                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | شناسه‌های `models.providers.*` و ارجاع‌های مدل انتخاب‌شده | الزام اینکه ارائه‌دهندگان پیکربندی‌شده و ارجاع‌های مدل انتخاب‌شده از ارائه‌دهندگان تأییدشده استفاده کنند. |
| `models.providers.deny`  | شناسه‌های `models.providers.*` و ارجاع‌های مدل انتخاب‌شده | رد ارائه‌دهندگان پیکربندی‌شده و ارجاع‌های مدل انتخاب‌شده بر اساس شناسه ارائه‌دهنده.               |

#### شبکه

| فیلد سیاست                   | وضعیت مشاهده‌شده                      | زمان استفاده                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | راه‌های گریز SSRF در شبکه خصوصی | روی `false` تنظیم کنید تا دسترسی به شبکه خصوصی الزاماً غیرفعال بماند. |

#### ورودی و دسترسی کانال

| فیلد سیاست                              | وضعیت مشاهده‌شده                                                 | زمان استفاده                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | الزام به یک دامنه جداسازی پیام مستقیم بازبینی‌شده.                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` و فیلدهای قدیمی سیاست DM کانال      | فقط سیاست‌های کانال پیام مستقیم بازبینی‌شده را مجاز کنید.               |
| `ingress.channels.denyOpenGroups`         | سیاست ورودی کانال، حساب، و گروه                     | رد ورودی گروه باز برای کانال‌ها و حساب‌های پیکربندی‌شده.      |
| `ingress.channels.requireMentionInGroups` | پیکربندی کانال، حساب، گروه، guild، و دروازه mention تو در تو | الزام دروازه‌های mention وقتی ورودی گروه باز یا وابسته به mention است. |

#### Gateway

| فیلد سیاست                            | وضعیت مشاهده‌شده                                 | زمان استفاده                                                     |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | روی `false` تنظیم کنید تا اتصال Gateway به loopback الزامی شود.          |
| `gateway.exposure.allowTailscaleFunnel` | وضعیت serve/funnel در Tailscale برای Gateway         | روی `false` تنظیم کنید تا مواجهه Tailscale Funnel رد شود.            |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | روی `true` تنظیم کنید تا احراز هویت غیرفعال Gateway رد شود.               |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | روی `true` تنظیم کنید تا پیکربندی صریح محدودیت نرخ احراز هویت الزامی شود.    |
| `gateway.controlUi.allowInsecure`       | تغییر وضعیت‌های ناامن احراز هویت/دستگاه/مبدأ در Control UI | روی `false` تنظیم کنید تا تغییر وضعیت‌های مواجهه ناامن Control UI رد شوند. |
| `gateway.remote.allow`                  | حالت/پیکربندی Gateway راه‌دور                     | روی `false` تنظیم کنید تا حالت Gateway راه‌دور رد شود.                  |
| `gateway.http.denyEndpoints`            | نقاط پایانی API HTTP Gateway                     | شناسه‌های نقطه پایانی مانند `chatCompletions` یا `responses` را رد کنید.  |
| `gateway.http.requireUrlAllowlists`     | ورودی‌های واکشی URL در Gateway HTTP                  | روی `true` تنظیم کنید تا فهرست‌های مجاز URL برای ورودی‌های واکشی URL الزامی شوند. |

#### فضای کاری عامل

| فیلد سیاست                     | وضعیت مشاهده‌شده                                                                        | زمان استفاده                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` و `agents.list[].sandbox.workspaceAccess` | فقط مقدارهای دسترسی فضای کاری sandbox مانند `none` یا `ro` را مجاز کنید.                                                  |
| `agents.workspace.denyTools`     | پیکربندی سراسری و به‌ازای هر عامل برای رد ابزارها                                                 | الزام کنید ابزارهای تغییر فضای کاری/زمان اجرا مانند `exec`، `process`، `write`، `edit`، یا `apply_patch` رد شوند. |

#### وضعیت sandbox

| فیلد سیاست                                          | وضعیت مشاهده‌شده                                          | زمان استفاده                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` و حالت به‌ازای هر عامل       | فقط حالت‌های sandbox بازبینی‌شده مانند `all` یا `non-main` را مجاز کنید. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` و backend به‌ازای هر عامل | فقط backendهای sandbox بازبینی‌شده مانند `docker` را مجاز کنید.         |
| `sandbox.containers.denyHostNetwork`                  | حالت شبکه sandbox/browser مبتنی بر container           | حالت شبکه میزبان را رد کنید.                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | حالت شبکه sandbox/browser مبتنی بر container           | پیوستن به فضای نام شبکه container دیگر را رد کنید.              |
| `sandbox.containers.requireReadOnlyMounts`            | حالت mount در sandbox/browser مبتنی بر container             | الزام کنید mountها فقط‌خواندنی باشند.                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | هدف‌های mount در sandbox/browser مبتنی بر container          | mountهای سوکت زمان اجرای container را رد کنید.                          |
| `sandbox.containers.denyUnconfinedProfiles`           | وضعیت پروفایل امنیتی container                      | پروفایل‌های امنیتی unconfined در container را رد کنید.                   |
| `sandbox.browser.requireCdpSourceRange`               | بازه منبع CDP مرورگر sandbox                        | الزام کنید مواجهه CDP مرورگر یک بازه منبع اعلام کند.        |

سیاست، نبود `sandbox.mode` را به‌عنوان پیش‌فرض ضمنی `off` در نظر می‌گیرد، بنابراین
`sandbox.requireMode` یک sandbox تازه یا پیکربندی‌نشده را خارج از
فهرست مجازی مانند `["all"]` گزارش می‌کند.

#### رسیدگی به داده‌ها

| فیلد سیاست                                        | وضعیت مشاهده‌شده                                                                       | زمان استفاده                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | روی `true` تنظیم کنید تا `logging.redactSensitive: "off"` رد شود.              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | روی `true` تنظیم کنید تا ضبط محتوای telemetry رد شود.                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | روی `true` تنظیم کنید تا حالت مؤثر نگهداری نشست `enforce` الزامی شود. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` و `agents.*.memorySearch.experimental.sessionMemory` | روی `true` تنظیم کنید تا نمایه‌سازی transcript نشست در حافظه رد شود.       |

#### اسرار

| فیلد سیاست                      | وضعیت مشاهده‌شده                                           | زمان استفاده                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | Config SecretRefs و اعلان‌های `secrets.providers.*` | روی `true` تنظیم کنید تا SecretRefs الزاماً به ارائه‌دهندگان اعلام‌شده اشاره کنند.     |
| `secrets.denySources`             | منابع ارائه‌دهنده secret و منابع SecretRef            | منابعی مانند `exec`، `file`، یا نام منبع پیکربندی‌شده دیگر را رد کنید. |
| `secrets.allowInsecureProviders`  | پرچم‌های وضعیت ناامن ارائه‌دهنده secret                   | روی `false` تنظیم کنید تا ارائه‌دهندگانی که وضعیت ناامن را می‌پذیرند رد شوند.      |

#### تأییدهای Exec

سیاست تأییدهای Exec مصنوع فعال زمان اجرای `exec-approvals.json`
را مشاهده می‌کند. به‌طور پیش‌فرض این مسیر `~/.openclaw/exec-approvals.json` است؛ وقتی
`OPENCLAW_STATE_DIR` تنظیم شده باشد، Policy از
`$OPENCLAW_STATE_DIR/exec-approvals.json` می‌خواند. قواعد وضعیت واقعی مانند
`execApprovals.defaults.*` یا `execApprovals.agents.*` به شواهد مصنوع
خواندنی نیاز دارند؛ مصنوع گم‌شده یا نامعتبر به‌جای تبدیل شدن به قبولی best-effort
در برابر پیش‌فرض‌های مصنوعی زمان اجرا، به‌عنوان شواهد غیرقابل مشاهده گزارش می‌شود. پس از اینکه
مصنوع خواندنی باشد، فیلدهای تأیید حذف‌شده پیش‌فرض‌های زمان اجرا را به ارث می‌برند: نبود
`defaults.security` برابر `full` است، و نبود امنیت عامل همان
پیش‌فرض را به ارث می‌برد. شواهد شامل `defaults`، `agents.*`، و
`agents.*.allowlist[].pattern` به‌همراه `argPattern` اختیاری، وضعیت مؤثر
`autoAllowSkills`، و منبع ورودی است. این شواهد شامل مسیر/توکن socket،
`commandText`، `lastUsedCommand`، مسیرهای resolve‌شده، یا timestampها نیست.

| فیلد سیاست                                | وضعیت مشاهده‌شده                                                                         | زمان استفاده                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | مسیر `exec-approvals.json` در زمان اجرای فعال                                              | روی `true` تنظیم کنید تا وجود و پارس شدن مصنوع تأییدها الزامی شود.                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`، با مقدار پیش‌فرض `full`                                              | فقط حالت‌های امنیتی تأیید پیش‌فرضِ تأییدشده را مجاز کنید.                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`، با ارث‌بری از پیش‌فرض‌ها                                               | فقط حالت‌های امنیتی تأیید مؤثرِ تأییدشده برای هر عامل را مجاز کنید.                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` و `agents.*.autoAllowSkills`، با ارث‌بری از پیش‌فرض‌های زمان اجرا | روی `false` تنظیم کنید تا فهرست‌های مجاز دستی سخت‌گیرانه بدون تأیید ضمنی CLI مهارت الزامی شوند. |
| `execApprovals.agents.allowlist.expected`   | الگوی تجمیعی `agents.*.allowlist[]` و ورودی‌های اختیاری argPattern               | الزام کنید فهرست مجاز تأییدها با مجموعه الگوهای بازبینی‌شده مطابقت داشته باشد.                      |

برای مثال، وجود مصنوع تأییدها را الزامی کنید، پیش‌فرض‌های سهل‌گیرانه را رد کنید، و
فقط وضعیت تأیید اجرای بازبینی‌شده را برای عامل‌های انتخاب‌شده مجاز کنید:

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### پروفایل‌های احراز هویت

| فیلد سیاست                    | وضعیت مشاهده‌شده                               | زمان استفاده                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | فراداده provider و mode در `auth.profiles.*` | کلیدهای فراداده مانند `provider` و `mode` را در پروفایل‌های احراز هویت پیکربندی الزامی کنید.               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | فقط حالت‌های پشتیبانی‌شده پروفایل احراز هویت مانند `api_key`، `aws-sdk`، `oauth`، یا `token` را مجاز کنید. |

#### فراداده ابزار

| فیلد سیاست            | وضعیت مشاهده‌شده                   | زمان استفاده                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | اعلان‌های مدیریت‌شده `TOOLS.md` | ابزارهای مدیریت‌شده را ملزم کنید کلیدهای فراداده مانند `risk`، `sensitivity`، یا `owner` را اعلام کنند. |

#### وضعیت ابزار

| فیلد سیاست                    | وضعیت مشاهده‌شده                                              | زمان استفاده                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` و `agents.list[].tools.profile`           | فقط شناسه‌های پروفایل ابزار مانند `minimal`، `messaging`، یا `coding` را مجاز کنید.                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` و بازنویسی‌های `tools.fs` برای هر عامل | روی `true` تنظیم کنید تا وضعیت ابزار فایل‌سیستم فقط-فضای‌کار الزامی شود.                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` و امنیت اجرای هر عامل           | فقط حالت‌های امنیت اجرا مانند `deny` یا `allowlist` را مجاز کنید.                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` و حالت پرسش اجرای هر عامل                | وضعیت تأیید مانند `always` را الزامی کنید.                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` و مسیریابی میزبان اجرای هر عامل           | فقط حالت‌های مسیریابی میزبان اجرا مانند `sandbox` را مجاز کنید.                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` و وضعیت ارتقایافته هر عامل     | روی `false` تنظیم کنید تا حالت ابزار ارتقایافته غیرفعال بماند.                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` و `tools.alsoAllow` برای هر عامل           | ورودی‌های دقیق `alsoAllow` را الزامی کنید و اعطای ابزار افزایشیِ گمشده یا غیرمنتظره را گزارش دهید.                 |
| `tools.denyTools`               | `tools.deny` و `agents.list[].tools.deny`                 | الزام کنید فهرست‌های رد ابزارِ پیکربندی‌شده شامل شناسه‌ها یا گروه‌های ابزار مانند `group:runtime` و `group:fs` باشند. |

بررسی‌های فقط-سیاست را هنگام نگارش اجرا کنید:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` فقط مجموعه بررسی سیاست را اجرا می‌کند و شواهد، یافته‌ها، و
هش‌های گواهی را منتشر می‌کند. همان یافته‌ها در `openclaw doctor --lint` نیز ظاهر می‌شوند
وقتی Plugin سیاست فعال باشد.

یک فایل سیاست اپراتور را با یک فایل سیاست مبنای نگارش‌شده مقایسه کنید:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` نحو فایل سیاست را با نحو فایل سیاست مقایسه می‌کند. این فرمان
وضعیت زمان اجرای OpenClaw، شواهد، اعتبارنامه‌ها، یا اسرار را بررسی نمی‌کند. این فرمان
از همان فراداده قانون سیاست استفاده می‌کند که هم‌پوشانی‌های scoped را مدیریت می‌کند: فهرست‌های مجاز باید
برابر یا محدودتر بمانند، فهرست‌های رد باید برابر یا گسترده‌تر بمانند، بولی‌های الزامی
باید مقدار الزامی خود را حفظ کنند، رشته‌های مرتب‌شده فقط باید به سمت انتهای محدودکننده‌تر
ترتیب پیکربندی‌شده حرکت کنند، و فهرست‌های دقیق باید مطابقت داشته باشند.

فایل مبنا می‌تواند سیاستی باشد که سازمان آن را نگارش کرده است. سیاست بررسی‌شده می‌تواند
از مقادیر سخت‌گیرانه‌تر استفاده کند یا قوانین سیاستی اضافی اضافه کند. یک قانون بررسی‌شده سطح بالا نیز می‌تواند
یک قانون مبنای scoped را برآورده کند وقتی به همان اندازه یا محدودکننده‌تر باشد، زیرا
سیاست سطح بالا به‌طور گسترده اعمال می‌شود. نام‌های scope لازم نیست مطابقت داشته باشند؛ مقایسه
scoped بر اساس مقدار انتخاب‌گر مانند `agentIds` یا `channelIds` و بر اساس
فیلد سیاستی که بررسی می‌شود کلیدگذاری می‌شود.

نمونه خروجی پاک JSON مقایسه فقط وضعیت مقایسه فایل سیاست را گزارش می‌کند:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

نمونه خروجی پاک `policy check --json` شامل هش‌های پایداری است که می‌تواند
توسط اپراتور یا ناظر ثبت شود:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## پیکربندی سیاست

پیکربندی سیاست زیر `plugins.entries.policy.config` قرار دارد.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| تنظیم                   | هدف                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | بررسی‌های سیاست را حتی پیش از وجود `policy.jsonc` فعال کنید.         |
| `workspaceRepairs`        | به `doctor --fix` اجازه دهید تنظیمات فضای کارِ مدیریت‌شده با سیاست را ویرایش کند. |
| `expectedHash`            | قفل هش اختیاری برای مصنوع سیاست تأییدشده.            |
| `expectedAttestationHash` | قفل هش اختیاری برای آخرین بررسی پاک سیاست پذیرفته‌شده.    |
| `path`                    | مکان مصنوع سیاست نسبت به فضای کار.             |

`plugins.entries.policy.config.enabled` را روی `false` تنظیم کنید تا بررسی‌های سیاست
برای یک فضای کار غیرفعال شود، در حالی که Plugin نصب‌شده باقی می‌ماند.

الزامات فراداده ابزار در `policy.jsonc` با
`tools.requireMetadata` نگارش می‌شوند، برای مثال `["risk", "sensitivity", "owner"]`.

## پذیرش وضعیت سیاست

نمونه خروجی JSON:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

هش سیاست، آرتیفکت قاعدهٔ تألیف‌شده را شناسایی می‌کند. بلوک شواهد،
وضعیت مشاهده‌شدهٔ OpenClaw را که بررسی‌های سیاست از آن استفاده کرده‌اند
ثبت می‌کند. مقدار `workspace.hash` محمولهٔ شواهد را برای دامنهٔ بررسی‌شده
شناسایی می‌کند. هش یافته‌ها، مجموعهٔ دقیق یافته‌هایی را که بررسی بازگردانده
است شناسایی می‌کند. `checkedAt` زمان اجرای ارزیابی را ثبت می‌کند. هش گواهی،
ادعای پایدار را شناسایی می‌کند: هش سیاست، هش شواهد، هش یافته‌ها، و این‌که
آیا نتیجه پاک بوده است یا نه. این مقدار عمداً `checkedAt` را شامل نمی‌شود،
بنابراین همان وضعیت سیاست در بررسی‌های تکراری همان گواهی را تولید می‌کند.
این موارد با هم تاپل حسابرسی این بررسی سیاست را تشکیل می‌دهند.

اگر Gateway یا سرپرست بعدی از سیاست برای مسدود کردن، تأیید کردن، یا حاشیه‌نویسی
یک اقدام زمان اجرا استفاده کند، باید هش گواهی آخرین بررسی پاک سیاست را ثبت کند.
`checkedAt` برای گزارش‌های حسابرسی در خروجی JSON باقی می‌ماند، اما بخشی از هش
گواهی پایدار نیست.

هنگام پذیرش وضعیت سیاست از این چرخهٔ عمر استفاده کنید:

1. `policy.jsonc` را تألیف یا بازبینی کنید.
2. `openclaw policy check --json` را اجرا کنید.
3. اگر نتیجه پاک است، `attestation.policy.hash` را به‌عنوان `expectedHash` ثبت کنید.
4. `attestation.attestationHash` را به‌عنوان `expectedAttestationHash` ثبت کنید.
5. `openclaw doctor --lint` را دوباره در CI یا دروازه‌های انتشار اجرا کنید.

اگر قواعد سیاست عمداً تغییر کنند، هر دو هش پذیرفته‌شده را از یک بررسی پاک
به‌روزرسانی کنید. اگر تنظیمات فضای کاری عمداً تغییر کند اما سیاست همان بماند،
معمولاً فقط `expectedAttestationHash` تغییر می‌کند.

فعال‌سازی یا ارتقای قواعد `agents.workspace` شواهد `agentWorkspace` را به
هش فضای کاری و هش گواهی اضافه می‌کند. اپراتورها باید شواهد جدید را بازبینی
کنند و پس از فعال‌سازی این قواعد، هش‌های گواهی پذیرفته‌شده را تازه‌سازی کنند.
فعال‌سازی یا ارتقای قواعد وضعیت ابزار نیز به همین روش شواهد `toolPosture` را
اضافه می‌کند.

`openclaw policy watch` همان بررسی را به‌صورت تکراری اجرا می‌کند و زمانی
گزارش می‌دهد که شواهد فعلی دیگر با `expectedAttestationHash` مطابقت نداشته باشد:

```bash
openclaw policy watch --json
```

در CI یا اسکریپت‌هایی که فقط به یک ارزیابی رانش نیاز دارند، از `--once`
استفاده کنید. بدون `--once`، فرمان به‌طور پیش‌فرض هر دو ثانیه نظرسنجی می‌کند؛
برای انتخاب بازه‌ای متفاوت از `--interval-ms` استفاده کنید.

## یافته‌ها

سیاست در حال حاضر موارد زیر را راستی‌آزمایی می‌کند:

| شناسه بررسی                                              | یافته                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | خط‌مشی فعال است اما `policy.jsonc` وجود ندارد.                                    |
| `policy/policy-jsonc-invalid`                            | خط‌مشی قابل تجزیه نیست یا ورودی‌های قاعده نادرست دارد.                           |
| `policy/policy-hash-mismatch`                            | خط‌مشی با `expectedHash` پیکربندی‌شده مطابقت ندارد.                              |
| `policy/attestation-hash-mismatch`                       | شواهد فعلی خط‌مشی دیگر با گواهی پذیرفته‌شده مطابقت ندارد.                       |
| `policy/policy-conformance-invalid`                      | یک فایل خط‌مشی مبنا یا بررسی‌شده نحو مقایسه نامعتبر دارد.                       |
| `policy/policy-conformance-missing`                      | یک فایل خط‌مشی بررسی‌شده قاعده‌ای را که فایل خط‌مشی مبنا لازم دارد ندارد.       |
| `policy/policy-conformance-weaker`                       | یک فایل خط‌مشی بررسی‌شده مقداری ضعیف‌تر از فایل خط‌مشی مبنا دارد.               |
| `policy/channels-denied-provider`                        | یک کانال فعال با قاعده رد کانال مطابقت دارد.                                     |
| `policy/mcp-denied-server`                               | یک سرور MCP پیکربندی‌شده توسط خط‌مشی رد شده است.                                |
| `policy/mcp-unapproved-server`                           | یک سرور MCP پیکربندی‌شده خارج از فهرست مجاز است.                                |
| `policy/models-denied-provider`                          | یک ارائه‌دهنده مدل یا مرجع مدل پیکربندی‌شده از ارائه‌دهنده ردشده استفاده می‌کند. |
| `policy/models-unapproved-provider`                      | یک ارائه‌دهنده مدل یا مرجع مدل پیکربندی‌شده خارج از فهرست مجاز است.             |
| `policy/network-private-access-enabled`                  | یک راه گریز SSRF برای شبکه خصوصی فعال است، در حالی که خط‌مشی آن را رد می‌کند.   |
| `policy/ingress-dm-policy-unapproved`                    | خط‌مشی DM یک کانال خارج از فهرست مجاز خط‌مشی است.                               |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` با دامنه جداسازی DM موردنیاز خط‌مشی مطابقت ندارد.             |
| `policy/ingress-open-groups-denied`                      | خط‌مشی گروه کانال `open` است، در حالی که خط‌مشی ورودی گروه باز را رد می‌کند.    |
| `policy/ingress-group-mention-required`                  | یک ورودی کانال یا گروه دروازه‌های اشاره را غیرفعال می‌کند، در حالی که خط‌مشی آن‌ها را لازم می‌داند. |
| `policy/gateway-non-loopback-bind`                       | وضعیت bind در Gateway امکان افشای غیر loopback را می‌دهد، در حالی که خط‌مشی آن را رد می‌کند. |
| `policy/gateway-auth-disabled`                           | احراز هویت Gateway غیرفعال است، در حالی که خط‌مشی احراز هویت را لازم می‌داند.   |
| `policy/gateway-rate-limit-missing`                      | وضعیت محدودسازی نرخ احراز هویت Gateway صریح نیست، در حالی که خط‌مشی آن را لازم می‌داند. |
| `policy/gateway-control-ui-insecure`                     | گزینه‌های افشای ناامن رابط کنترل Gateway فعال هستند.                            |
| `policy/gateway-tailscale-funnel`                        | افشای Gateway Tailscale Funnel فعال است، در حالی که خط‌مشی آن را رد می‌کند.      |
| `policy/gateway-remote-enabled`                          | حالت راه دور Gateway فعال است، در حالی که خط‌مشی آن را رد می‌کند.               |
| `policy/gateway-http-endpoint-enabled`                   | یک نقطه پایانی API HTTP در Gateway فعال است، در حالی که خط‌مشی آن را رد کرده است. |
| `policy/gateway-http-url-fetch-unrestricted`             | ورودی واکشی URL در HTTP Gateway فاقد فهرست مجاز URL موردنیاز است.               |
| `policy/agents-workspace-access-denied`                  | حالت sandbox عامل یا دسترسی محیط کاری خارج از فهرست مجاز خط‌مشی است.           |
| `policy/agents-tool-not-denied`                          | یک عامل یا پیکربندی پیش‌فرض ابزاری را که خط‌مشی رد آن را لازم می‌داند رد نمی‌کند. |
| `policy/tools-profile-unapproved`                        | یک نمایه ابزار سراسری یا مخصوص عامل پیکربندی‌شده خارج از فهرست مجاز است.       |
| `policy/tools-fs-workspace-only-required`                | ابزارهای فایل‌سیستم با وضعیت مسیر فقط محیط کاری پیکربندی نشده‌اند.             |
| `policy/tools-exec-security-unapproved`                  | حالت امنیتی exec خارج از فهرست مجاز خط‌مشی است.                                 |
| `policy/tools-exec-ask-unapproved`                       | حالت پرسش exec خارج از فهرست مجاز خط‌مشی است.                                   |
| `policy/tools-exec-host-unapproved`                      | مسیریابی میزبان exec خارج از فهرست مجاز خط‌مشی است.                             |
| `policy/tools-elevated-enabled`                          | حالت ابزار ارتقایافته فعال است، در حالی که خط‌مشی آن را رد می‌کند.              |
| `policy/tools-also-allow-missing`                        | فهرست `alsoAllow` پیکربندی‌شده ورودی موردنیاز خط‌مشی را ندارد.                  |
| `policy/tools-also-allow-unexpected`                     | فهرست `alsoAllow` پیکربندی‌شده شامل ورودی‌ای است که خط‌مشی انتظار ندارد.        |
| `policy/tools-required-deny-missing`                     | فهرست رد ابزار سراسری یا مخصوص عامل شامل ابزار ردشده موردنیاز نیست.             |
| `policy/sandbox-mode-unapproved`                         | حالت sandbox خارج از فهرست مجاز خط‌مشی است.                                     |
| `policy/sandbox-backend-unapproved`                      | backend در sandbox خارج از فهرست مجاز خط‌مشی است.                               |
| `policy/sandbox-container-posture-unobservable`          | یک قاعده وضعیت کانتینر برای backendی فعال است که نمی‌تواند آن را مشاهده کند.    |
| `policy/sandbox-container-host-network-denied`           | یک sandbox یا مرورگر مبتنی بر کانتینر از حالت شبکه میزبان استفاده می‌کند.       |
| `policy/sandbox-container-namespace-join-denied`         | یک sandbox یا مرورگر مبتنی بر کانتینر به namespace کانتینر دیگری می‌پیوندد.     |
| `policy/sandbox-container-mount-mode-required`           | mount در sandbox یا مرورگر مبتنی بر کانتینر فقط‌خواندنی نیست.                   |
| `policy/sandbox-container-runtime-socket-mount`          | mount در sandbox یا مرورگر مبتنی بر کانتینر socket زمان اجرای کانتینر را افشا می‌کند. |
| `policy/sandbox-container-unconfined-profile`            | نمایه sandbox کانتینر unconfined است، در حالی که خط‌مشی آن را رد می‌کند.        |
| `policy/sandbox-browser-cdp-source-range-missing`        | محدوده منبع CDP مرورگر sandbox وجود ندارد، در حالی که خط‌مشی آن را لازم می‌داند. |
| `policy/data-handling-redaction-disabled`                | حذف اطلاعات حساس از گزارش‌ها غیرفعال است، در حالی که خط‌مشی آن را لازم می‌داند. |
| `policy/data-handling-telemetry-content-capture`         | ثبت محتوای تله‌متری فعال است، در حالی که خط‌مشی آن را رد می‌کند.                |
| `policy/data-handling-session-retention-not-enforced`    | نگهداری دوره حفظ نشست اجرا نمی‌شود، در حالی که خط‌مشی آن را لازم می‌داند.       |
| `policy/data-handling-session-transcript-memory-enabled` | نمایه‌سازی حافظه رونوشت نشست فعال است، در حالی که خط‌مشی آن را رد می‌کند.       |
| `policy/secrets-unmanaged-provider`                      | یک SecretRef در پیکربندی به ارائه‌دهنده‌ای اشاره می‌کند که زیر `secrets.providers` اعلام نشده است. |
| `policy/secrets-denied-provider-source`                  | یک ارائه‌دهنده secret یا SecretRef در پیکربندی از منبعی استفاده می‌کند که خط‌مشی رد کرده است. |
| `policy/secrets-insecure-provider`                       | یک ارائه‌دهنده secret وضعیت ناامن را انتخاب کرده است، در حالی که خط‌مشی آن را رد می‌کند. |
| `policy/auth-profile-invalid-metadata`                   | یک نمایه احراز هویت در پیکربندی فاقد فراداده معتبر ارائه‌دهنده یا حالت است.     |
| `policy/auth-profile-unapproved-mode`                    | حالت نمایه احراز هویت در پیکربندی خارج از فهرست مجاز خط‌مشی است.               |
| `policy/exec-approvals-missing`                          | خط‌مشی `exec-approvals.json` را لازم می‌داند، اما artifact وجود ندارد.          |
| `policy/exec-approvals-invalid`                          | artifact پیکربندی‌شده تأییدهای exec قابل تجزیه نیست.                            |
| `policy/exec-approvals-default-security-unapproved`      | پیش‌فرض‌های تأیید exec از حالت امنیتی خارج از فهرست مجاز خط‌مشی استفاده می‌کنند. |
| `policy/exec-approvals-agent-security-unapproved`        | حالت امنیتی مؤثر تأیید exec مخصوص عامل خارج از فهرست مجاز است.                 |
| `policy/exec-approvals-auto-allow-skills-enabled`        | یک عامل تأیید exec به‌طور ضمنی CLIهای Skills را به‌صورت خودکار مجاز می‌کند، در حالی که خط‌مشی آن را رد می‌کند. |
| `policy/exec-approvals-allowlist-missing`                | فهرست مجاز تأییدها الگویی را که خط‌مشی لازم دارد ندارد.                         |
| `policy/exec-approvals-allowlist-unexpected`             | فهرست مجاز تأییدها شامل الگویی است که خط‌مشی انتظار ندارد.                      |
| `policy/tools-missing-risk-level`                        | یک اعلان ابزار تحت حاکمیت فاقد فراداده ریسک است.                                |
| `policy/tools-unknown-risk-level`                        | یک اعلان ابزار تحت حاکمیت از مقدار ریسک ناشناخته استفاده می‌کند.                |
| `policy/tools-missing-sensitivity-token`                 | یک اعلان ابزار تحت حاکمیت فاقد فراداده حساسیت است.                              |
| `policy/tools-missing-owner`                             | یک اعلان ابزار تحت حاکمیت فاقد فراداده مالک است.                                |
| `policy/tools-unknown-sensitivity-token`                 | یک اعلان ابزار تحت حاکمیت از مقدار حساسیت ناشناخته استفاده می‌کند.              |

یافته‌های خط‌مشی می‌توانند هم شامل `target` و هم `requirement` باشند. `target`
چیز مشاهده‌شده در محیط کاری است که منطبق نیست. `requirement` قاعده نوشته‌شده
خط‌مشی است که آن را به یک یافته تبدیل کرده است. هر دو مقدار امروز نشانی هستند،
معمولاً مسیرهای `oc://`، اما نام فیلدها نقش آن‌ها در خط‌مشی را توصیف می‌کنند،
نه قالب نشانی را.

نمونه یافته JSON:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

نمونه یافته ابزار:

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

نمونه یافته MCP:

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

نمونه یافته ارائه‌دهنده مدل:

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

نمونه یافته شبکه:

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

نمونه یافته مواجهه Gateway:

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

نمونه یافته فضای کاری عامل:

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## تعمیر

`doctor --lint` و `policy check` فقط خواندنی هستند.

`doctor --fix` فقط زمانی تنظیمات فضای کاریِ مدیریت‌شده توسط خط‌مشی را ویرایش می‌کند که
`workspaceRepairs` به‌صراحت فعال شده باشد. بدون این فعال‌سازی اختیاری، بررسی‌های خط‌مشی
گزارش می‌کنند چه چیزی را تعمیر می‌کردند و تنظیمات را بدون تغییر می‌گذارند.

در این نسخه، تعمیر می‌تواند کانال‌هایی را غیرفعال کند که در پیکربندی OpenClaw فعال هستند
اما توسط `channels.denyRules` رد شده‌اند. `workspaceRepairs` را فقط پس از بازبینی
فایل خط‌مشی فعال کنید، زیرا یک قاعده رد معتبر می‌تواند یک کانال پیکربندی‌شده را خاموش کند:

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## کدهای خروج

| فرمان          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | هیچ یافته‌ای در آستانه وجود ندارد.                          | یک یا چند یافته به آستانه رسیده‌اند.                             | خرابی آرگومان یا زمان اجرا. |
| `policy compare` | فایل خط‌مشی حداقل به‌اندازه خط پایه سخت‌گیرانه است. | فایل خط‌مشی نامعتبر، مفقود، یا ضعیف‌تر از قواعد خط پایه است. | خرابی آرگومان یا زمان اجرا. |
| `policy watch`   | هیچ یافته‌ای وجود ندارد و هش پذیرفته‌شده به‌روز است.              | یافته‌ها وجود دارند یا گواهی پذیرفته‌شده قدیمی است.                    | خرابی آرگومان یا زمان اجرا. |

## مرتبط

- [حالت lint در Doctor](/fa/cli/doctor#lint-mode)
- [CLI مسیر](/fa/cli/path)

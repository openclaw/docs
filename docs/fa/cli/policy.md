---
read_when:
    - می‌خواهید تنظیمات OpenClaw را با یک فایل policy.jsonc تدوین‌شده بررسی کنید
    - شما می‌خواهید یافته‌های خط‌مشی در lint فرمان doctor نمایش داده شوند
    - برای شواهد ممیزی، به هش گواهی خط‌مشی نیاز دارید
summary: مرجع CLI برای بررسی‌های انطباق `openclaw policy`
title: سیاست
x-i18n:
    generated_at: "2026-07-12T09:46:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` توسط Plugin همراه Policy ارائه می‌شود. این قابلیت یک لایه انطباق سازمانی روی تنظیمات موجود OpenClaw است، نه یک سامانه پیکربندی دوم. الزامات را در `policy.jsonc` تعریف می‌کنید؛ OpenClaw فضای کاری فعال را به‌عنوان شواهد مشاهده می‌کند؛ و Policy انحراف را از طریق `doctor --lint` گزارش می‌دهد. Policy فراخوانی ابزارها را اعمال نمی‌کند، رفتار زمان اجرا را هنگام درخواست بازنویسی نمی‌کند و مخازن اعتبارنامه مختص هر عامل، مانند `auth-profiles.json`، را گواهی نمی‌کند.

Policy کانال‌های پیکربندی‌شده، سرورهای MCP، ارائه‌دهندگان مدل، وضعیت SSRF شبکه، دسترسی ورودی/کانال، در معرض‌بودن Gateway و وضعیت فرمان‌های Node، دسترسی عامل به فضای کاری، وضعیت محیط ایزوله، وضعیت مدیریت داده، وضعیت ارائه‌دهنده اسرار/نمایه احراز هویت و فراداده ابزارهای تحت حاکمیت (`TOOLS.md`) را بررسی می‌کند. زمانی از آن استفاده کنید که یک فضای کاری به گزاره‌ای ماندگار و قابل‌بررسی مانند «Telegram نباید فعال باشد» یا «ابزارهای تحت حاکمیت باید فراداده ریسک و مالک را اعلام کنند» نیاز دارد. اگر فقط به رفتار محلی، بدون گواهی یا تشخیص انحراف نیاز دارید، پیکربندی عادی کافی است.

## شروع سریع

```bash
openclaw plugins enable policy
```

حتی زمانی که `policy.jsonc` وجود ندارد، Plugin فعال باقی می‌ماند تا doctor بتواند به‌جای نادیده‌گرفتن بی‌سروصدای بررسی‌ها، نبود این مصنوع را گزارش کند.

`policy.jsonc` را دستی بنویسید؛ این فایل از تنظیمات فعلی تولید نمی‌شود. هر بخش سطح‌بالا یک فضای نام قانون است: هر بررسی فقط زمانی اجرا می‌شود که یک قانون مشخص زیر آن وجود داشته باشد (بخش‌ها یا کلیدهای پشتیبانی‌نشده به‌جای نادیده‌گرفته‌شدن بی‌سروصدا، با `policy/policy-jsonc-invalid` شکست می‌خورند). نمونه‌ای حداقلی که همه بخش‌های پشتیبانی‌شده را پوشش می‌دهد:

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
    "nodes": {
      "denyCommands": ["system.run"],
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

نکات سراسری که از جدول‌های قوانین زیر آشکار نیستند:

- حذف `gateway.bind` در حالی که اتصال‌های غیر local loopback را منع می‌کنید، به این معناست که مقدار پیش‌فرض زمان اجرا را می‌پذیرید؛ برای انطباق سخت‌گیرانه، `gateway.bind: "loopback"` را تنظیم کنید.
- برای یک عامل فقط‌خواندنی، `mode` محیط ایزوله را در پیش‌فرض‌ها/عامل مربوطه روی `all` یا `non-main` و `workspaceAccess` را روی `none` یا `ro` تنظیم کنید. نبود حالت محیط ایزوله یا مقدار `off`، یک Policy فقط‌خواندنی را برآورده نمی‌کند.
- `agents.workspace.denyTools` مقادیر `exec`، `process`، `write`، `edit` و `apply_patch` را می‌پذیرد. گروه‌های منع ابزار در پیکربندی، یعنی `group:fs` (تغییر فایل) و `group:runtime` (پوسته/فرایند)، وضعیت معادل را برآورده می‌کنند.
- بررسی‌های تأیید اجرای فرمان تنها زمانی مصنوع زنده `exec-approvals.json` را می‌خوانند که یک قانون `execApprovals` وجود داشته باشد؛ مصنوع مفقود یا نامعتبر، شواهد مشاهده‌ناپذیر است، نه یک قبولی مصنوعی.
- شواهد اسرار و نمایه احراز هویت فقط وضعیت ارائه‌دهنده/منبع و فراداده SecretRef را ثبت می‌کنند و هرگز مقادیر خام را ثبت نمی‌کنند. Policy مخازن اعتبارنامه مختص هر عامل، مانند `auth-profiles.json`، را نمی‌خواند یا گواهی نمی‌کند.
- شواهد مدیریت داده فقط وضعیت سطح پیکربندی را شامل می‌شوند (حالت پوشاندن، کلید تغییر ثبت تله‌متری، حالت نگهداری نشست و تنظیم نمایه‌سازی رونوشت). این شواهد گزارش‌ها، خروجی‌های تله‌متری، رونوشت‌ها یا فایل‌های حافظه را بررسی نمی‌کنند و نتیجه پاک ثابت نمی‌کند که هیچ داده شخصی یا رازی در آن‌ها وجود ندارد.

### مرجع قوانین Policy

همه قوانین زیر اختیاری هستند؛ هر بررسی فقط زمانی اجرا می‌شود که قانون وجود داشته باشد. وضعیت مشاهده‌شده، پیکربندی موجود OpenClaw یا فراداده فضای کاری است.

#### هم‌پوشانی‌های محدوده‌دار

هنگامی که عامل‌ها یا کانال‌های مشخص به Policy سخت‌گیرانه‌تری نسبت به خط‌مبنای سطح‌بالا نیاز دارند، از `scopes.<scopeName>` استفاده کنید. نام محدوده فقط یک برچسب است؛ تطبیق از گزینشگر داخل محدوده استفاده می‌کند. هم‌پوشانی‌ها افزایشی هستند: قانون سراسری همچنان اجرا می‌شود و قانون محدوده‌دار می‌تواند یافته خاص خود را برای همان شواهد اضافه کند.

| گزینشگر     | بخش‌های پشتیبانی‌شده                                                             | زمان استفاده                                          |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | یک یا چند عامل زمان اجرا به قوانین سخت‌گیرانه‌تری نیاز دارند.   |
| `channelIds` | `ingress.channels`                                                             | یک یا چند کانال به قوانین ورودی سخت‌گیرانه‌تری نیاز دارند. |

اگر یک ورودی `agentIds` در `agents.list[]` وجود نداشته باشد، OpenClaw قانون محدوده‌دار را به‌جای نادیده‌گرفتن، برای آن شناسه عامل زمان اجرا در برابر وضعیت سراسری/پیش‌فرض ارث‌بری‌شده ارزیابی می‌کند.

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

همان عامل می‌تواند، مانند نمونه بالا، در چند محدوده ظاهر شود؛ به‌شرط آنکه هر محدوده فیلد متفاوتی را اداره کند. یک فیلد محدوده‌دار تکراری برای همان عامل باید به همان اندازه یا محدودکننده‌تر باشد؛ ادعای تکراری ضعیف‌تر رد می‌شود (فهرست‌های مجاز زیرمجموعه، فهرست‌های منع ابرمجموعه و مقادیر بولی الزامی ثابت هستند).

قوانین وضعیت کانتینر (`sandbox.containers.*`) فقط در برابر شواهدی بررسی می‌شوند که بک‌اند محیط ایزوله عامل تطبیق‌یافته می‌تواند ارائه کند. اگر یک بک‌اند نتواند قانونی را که برای آن فعال کرده‌اید مشاهده کند، Policy به‌جای اعلام قبولی، `policy/sandbox-container-posture-unobservable` را گزارش می‌دهد؛ قوانین کانتینر را به گروه‌های عاملی محدود کنید که از بک‌اندی استفاده می‌کنند که می‌تواند آن‌ها را ارائه کند.

`ingress.session.requireDmScope` در سطح‌بالا سراسری باقی می‌ماند؛ `session.dmScope` شواهد قابل‌انتساب به کانال نیست، بنابراین نمی‌توان آن را با `channelIds` محدوده‌بندی کرد.

هر محدوده موجود در `policy.jsonc` باید معتبر و قابل‌اعمال باشد.

#### کانال‌ها

| فیلد Policy                         | وضعیت مشاهده‌شده                          | زمان استفاده                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | ارائه‌دهنده `channels.*` و وضعیت فعال‌بودن | منع کانال‌های پیکربندی‌شده از ارائه‌دهنده‌ای مانند `telegram`. |
| `channels.denyRules[].reason`        | پیام یافته و زمینه راهنمای ترمیم | توضیح دلیل منع ارائه‌دهنده.                          |

#### سرورهای MCP

| فیلد Policy        | وضعیت مشاهده‌شده      | زمان استفاده                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | شناسه‌های `mcp.servers.*` | الزام قرارداشتن همه سرورهای MCP پیکربندی‌شده در فهرست مجاز. |
| `mcp.servers.deny`  | شناسه‌های `mcp.servers.*` | منع شناسه‌های مشخص سرور MCP پیکربندی‌شده.                   |

#### ارائه‌دهندگان مدل

| فیلد Policy             | وضعیت مشاهده‌شده                                   | زمان استفاده                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | شناسه‌های `models.providers.*` و ارجاع‌های مدل انتخاب‌شده | الزام استفاده ارائه‌دهندگان پیکربندی‌شده و ارجاع‌های مدل انتخاب‌شده از ارائه‌دهندگان تأییدشده. |
| `models.providers.deny`  | شناسه‌های `models.providers.*` و ارجاع‌های مدل انتخاب‌شده | منع ارائه‌دهندگان پیکربندی‌شده و ارجاع‌های مدل انتخاب‌شده بر اساس شناسه ارائه‌دهنده.               |

#### شبکه

| فیلد Policy                   | وضعیت مشاهده‌شده                      | زمان استفاده                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | راه‌های گریز SSRF شبکه خصوصی | برای الزام غیرفعال‌ماندن دسترسی به شبکه خصوصی، روی `false` تنظیم کنید. |

#### دسترسی ورودی و کانال

| فیلد خط‌مشی                               | وضعیت مشاهده‌شده                                                | مورد استفاده                                                        |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | الزام به دامنه جداسازی بازبینی‌شده برای پیام‌های مستقیم.            |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` و فیلدهای قدیمی خط‌مشی پیام مستقیم کانال | فقط خط‌مشی‌های بازبینی‌شده کانال پیام مستقیم را مجاز کنید.           |
| `ingress.channels.denyOpenGroups`         | خط‌مشی ورودی کانال، حساب و گروه                                 | ورودی گروه باز را برای کانال‌ها و حساب‌های پیکربندی‌شده رد کنید.     |
| `ingress.channels.requireMentionInGroups` | پیکربندی دروازه اشاره در کانال، حساب، گروه، انجمن و سطوح تودرتو | هنگامی که ورودی گروه باز یا مشروط به اشاره است، دروازه اشاره را الزامی کنید. |

#### Gateway

| فیلد خط‌مشی                             | وضعیت مشاهده‌شده                                      | مورد استفاده                                                                                   |
| --------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                        | برای الزام اتصال Gateway به local loopback، روی `false` تنظیم کنید.                            |
| `gateway.exposure.allowTailscaleFunnel` | وضعیت سرویس/تونل Gateway در Tailscale                 | برای رد کردن در معرض‌گذاری Tailscale Funnel، روی `false` تنظیم کنید.                            |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                                   | برای رد کردن احراز هویت غیرفعال Gateway، روی `true` تنظیم کنید.                                 |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                              | برای الزام پیکربندی صریح محدودیت نرخ احراز هویت، روی `true` تنظیم کنید.                         |
| `gateway.controlUi.allowInsecure`       | گزینه‌های ناامن احراز هویت/دستگاه/مبدأ رابط کنترل    | برای رد کردن گزینه‌های ناامن در معرض‌گذاری رابط کنترل، روی `false` تنظیم کنید.                  |
| `gateway.remote.allow`                  | حالت/پیکربندی Gateway راه‌دور                         | برای رد کردن حالت Gateway راه‌دور، روی `false` تنظیم کنید.                                      |
| `gateway.http.denyEndpoints`            | نقاط پایانی API HTTP در Gateway                       | شناسه‌های نقاط پایانی مانند `chatCompletions` یا `responses` را رد کنید.                        |
| `gateway.http.requireUrlAllowlists`     | ورودی‌های واکشی URL در HTTP Gateway                   | برای الزام فهرست‌های مجاز URL در ورودی‌های واکشی URL، روی `true` تنظیم کنید.                    |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                          | الزام کنید شناسه‌های دقیق فرمان Node مانند `system.run` در پیکربندی OpenClaw رد شده باشند.     |

`gateway.nodes.denyCommands` یک قاعده اَبَرمجموعه ردِ دقیق و حساس به حروف بزرگ و کوچک است.
زمانی از آن استفاده کنید که خط‌مشی باید اثبات کند فرمان‌های ممتاز Node به‌صراحت
در پیکربندی OpenClaw رد شده‌اند. استقراری که عمداً یک فرمان ممتاز
Node را مجاز می‌کند، باید پس از بازبینی `policy.jsonc` را به‌روزرسانی کند، نه اینکه
صرفاً به `gateway.nodes.allowCommands` متکی باشد.

#### فضای کاری عامل

| فیلد خط‌مشی                      | وضعیت مشاهده‌شده                                                                       | مورد استفاده                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` و `agents.list[].sandbox.workspaceAccess`    | فقط مقادیر دسترسی فضای کاری محیط ایزوله مانند `none` یا `ro` را مجاز کنید.                      |
| `agents.workspace.denyTools`     | پیکربندی رد ابزار به‌صورت سراسری و برای هر عامل                                        | الزام کنید ابزارهای تغییر (`exec`، `process`، `write`، `edit`، `apply_patch`) رد شده باشند.    |

#### وضعیت محیط ایزوله

| فیلد خط‌مشی                                          | وضعیت مشاهده‌شده                                           | مورد استفاده                                                           |
| --------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `sandbox.requireMode`                               | `agents.defaults.sandbox.mode` و حالت هر عامل              | فقط حالت‌های بازبینی‌شده محیط ایزوله مانند `all` یا `non-main` را مجاز کنید. |
| `sandbox.allowBackends`                             | `agents.defaults.sandbox.backend` و پشتیبان هر عامل        | فقط پشتیبان‌های بازبینی‌شده محیط ایزوله مانند `docker` را مجاز کنید.       |
| `sandbox.containers.denyHostNetwork`                | حالت شبکه محیط ایزوله/مرورگر مبتنی بر کانتینر              | حالت شبکه میزبان را رد کنید.                                           |
| `sandbox.containers.denyContainerNamespaceJoin`     | حالت شبکه محیط ایزوله/مرورگر مبتنی بر کانتینر              | پیوستن به فضای نام شبکه کانتینر دیگر را رد کنید.                         |
| `sandbox.containers.requireReadOnlyMounts`          | حالت سوارسازی محیط ایزوله/مرورگر مبتنی بر کانتینر          | سوارسازی‌ها را ملزم به فقط‌خواندنی بودن کنید.                            |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | اهداف سوارسازی محیط ایزوله/مرورگر مبتنی بر کانتینر        | سوارسازی سوکت زمان اجرای کانتینر را رد کنید.                             |
| `sandbox.containers.denyUnconfinedProfiles`         | وضعیت نمایه امنیتی کانتینر                                 | نمایه‌های امنیتی نامحدود کانتینر را رد کنید.                             |
| `sandbox.browser.requireCdpSourceRange`             | محدوده مبدأ CDP مرورگر محیط ایزوله                         | الزام کنید در معرض‌گذاری CDP مرورگر یک محدوده مبدأ اعلام کند.            |

خط‌مشی، نبود `sandbox.mode` را به‌عنوان مقدار پیش‌فرض ضمنی `off` در نظر می‌گیرد؛ بنابراین
`sandbox.requireMode` یک محیط ایزوله تازه یا پیکربندی‌نشده را خارج از
فهرست مجازی مانند `["all"]` گزارش می‌کند.

#### مدیریت داده

| فیلد خط‌مشی                                        | وضعیت مشاهده‌شده                                                                       | مورد استفاده                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | برای رد کردن `logging.redactSensitive: "off"`، روی `true` تنظیم کنید.         |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | برای رد کردن ضبط محتوای تله‌متری، روی `true` تنظیم کنید.                      |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | برای الزام حالت مؤثر نگهداری نشست `enforce`، روی `true` تنظیم کنید.           |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` و `agents.*.memorySearch.experimental.sessionMemory`   | برای رد کردن نمایه‌سازی رونوشت نشست در حافظه، روی `true` تنظیم کنید.          |

#### اسرار

| فیلد خط‌مشی                      | وضعیت مشاهده‌شده                                            | مورد استفاده                                                                |
| --------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRefهای پیکربندی و اعلان‌های `secrets.providers.*`    | برای الزام ارجاع SecretRefها به ارائه‌دهندگان اعلام‌شده، روی `true` تنظیم کنید. |
| `secrets.denySources`             | منابع ارائه‌دهندگان اسرار و منابع SecretRef                | منابعی مانند `exec`، `file` یا نام منبع پیکربندی‌شده دیگری را رد کنید.       |
| `secrets.allowInsecureProviders`  | پرچم‌های وضعیت ناامن ارائه‌دهندگان اسرار                    | برای رد کردن ارائه‌دهندگانی که وضعیت ناامن را انتخاب می‌کنند، روی `false` تنظیم کنید. |

#### تأییدهای اجرا

بررسی‌های تأیید اجرا، مصنوع زمان اجرای `exec-approvals.json` را می‌خوانند:
به‌طور پیش‌فرض `~/.openclaw/exec-approvals.json`، یا هنگامی که `OPENCLAW_STATE_DIR` تنظیم شده است،
`$OPENCLAW_STATE_DIR/exec-approvals.json`.
قواعد وضعیت زیر `execApprovals.defaults.*` یا `execApprovals.agents.*`
به شواهد مصنوع خواندنی نیاز دارند؛ مصنوع مفقود یا نامعتبر به‌جای قبولی بر پایه
بهترین تلاش، به‌عنوان شواهد مشاهده‌ناپذیر گزارش می‌شود. پس از خواندنی شدن، فیلدهای
حذف‌شده مقادیر پیش‌فرض زمان اجرا را به ارث می‌برند: نبود `defaults.security` برابر `full` است و
نبود امنیت عامل نیز آن مقدار پیش‌فرض را به ارث می‌برد. شواهد شامل `defaults`،
`agents.*`، `agents.*.allowlist[].pattern`، `argPattern` اختیاری، وضعیت مؤثر
`autoAllowSkills` و منبع ورودی است — و هرگز شامل مسیر سوکت/توکن،
`commandText`، `lastUsedCommand`، مسیرهای حل‌شده یا برچسب‌های زمانی نیست.

| فیلد خط‌مشی                                | وضعیت مشاهده‌شده                                                                          | مورد استفاده                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `execApprovals.requireFile`                | مسیر فعال زمان اجرای `exec-approvals.json`                                                | برای الزام وجود و تجزیه‌پذیری مصنوع تأییدها، روی `true` تنظیم کنید.                              |
| `execApprovals.defaults.allowSecurity`     | `defaults.security`، با مقدار پیش‌فرض `full`                                               | فقط حالت‌های امنیتی پیش‌فرض تأییدشده برای تأیید را مجاز کنید.                                    |
| `execApprovals.agents.allowSecurity`       | `agents.*.security`، با به‌ارث‌بردن مقادیر پیش‌فرض                                        | فقط حالت‌های امنیتی مؤثر تأییدشده برای هر عامل را مجاز کنید.                                     |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` و `agents.*.autoAllowSkills`، با به‌ارث‌بردن پیش‌فرض‌های زمان اجرا | برای الزام فهرست‌های مجاز دستی سخت‌گیرانه بدون تأیید ضمنی CLI مهارت، روی `false` تنظیم کنید.     |
| `execApprovals.agents.allowlist.expected`  | تجمیع ورودی‌های الگو و `argPattern` اختیاری در `agents.*.allowlist[]`                      | الزام کنید فهرست مجاز تأییدها با مجموعه الگوهای بازبینی‌شده مطابقت داشته باشد.                    |

مثال: مصنوع تأییدها را الزامی کنید، پیش‌فرض‌های سهل‌گیرانه را رد کنید و
فقط وضعیت تأیید اجرای بازبینی‌شده را برای عامل‌های منتخب مجاز کنید.

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

#### نمایه‌های احراز هویت

| فیلد سیاست                     | وضعیت مشاهده‌شده                              | زمان استفاده                                                                               |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | فرادادهٔ ارائه‌دهنده و حالت در `auth.profiles.*` | الزام کلیدهای فراداده‌ای مانند `provider` و `mode` در نمایه‌های احراز هویت پیکربندی.      |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | مجاز دانستن فقط حالت‌های پشتیبانی‌شدهٔ نمایهٔ احراز هویت، مانند `api_key`، `aws-sdk`، `oauth` یا `token`. |

#### فرادادهٔ ابزار

| فیلد سیاست             | وضعیت مشاهده‌شده                 | زمان استفاده                                                                                |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | اعلان‌های تحت حاکمیت `TOOLS.md` | الزام ابزارهای تحت حاکمیت به اعلام کلیدهای فراداده‌ای مانند `risk`، `sensitivity` یا `owner`. |

#### وضعیت ابزار

| فیلد سیاست                     | وضعیت مشاهده‌شده                                             | زمان استفاده                                                                                                   |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` و `agents.list[].tools.profile`             | مجاز دانستن فقط شناسه‌های نمایهٔ ابزار، مانند `minimal`، `messaging` یا `coding`.                              |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` و بازنویسی‌های `tools.fs` هر عامل | تنظیم روی `true` برای الزام وضعیت دسترسی ابزار فایل‌سیستم به فضای کاری فقط.                                   |
| `tools.exec.allowSecurity`      | `tools.exec.security` و امنیت اجرای هر عامل                 | مجاز دانستن فقط حالت‌های امنیت اجرا، مانند `deny` یا `allowlist`.                                              |
| `tools.exec.requireAsk`         | `tools.exec.ask` و حالت درخواست اجرای هر عامل              | الزام وضعیت تأیید، مانند `always`.                                                                             |
| `tools.exec.allowHosts`         | `tools.exec.host` و مسیریابی میزبان اجرای هر عامل          | مجاز دانستن فقط حالت‌های مسیریابی میزبان اجرا، مانند `sandbox`.                                                |
| `tools.elevated.allow`          | `tools.elevated.enabled` و وضعیت ارتقایافتهٔ هر عامل       | تنظیم روی `false` برای الزام غیرفعال ماندن حالت ابزار ارتقایافته.                                              |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` و `tools.alsoAllow` هر عامل              | الزام ورودی‌های دقیق `alsoAllow` و گزارش مجوزهای افزودهٔ ابزار که وجود ندارند یا غیرمنتظره‌اند.                |
| `tools.denyTools`               | `tools.deny` و `agents.list[].tools.deny`                   | الزام فهرست‌های منع ابزار پیکربندی‌شده به شامل‌کردن شناسه‌ها یا گروه‌های ابزار، مانند `group:runtime` و `group:fs`. |

## اجرای بررسی‌ها

هنگام نگارش، فقط بررسی‌های سیاست را اجرا کنید:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` فقط مجموعهٔ بررسی‌های سیاست را اجرا می‌کند و شواهد، یافته‌ها
و هش‌های گواهی را خروجی می‌دهد. هنگامی که Plugin سیاست فعال باشد، همین یافته‌ها در
`openclaw doctor --lint` نیز نمایش داده می‌شوند.

یک فایل سیاست اپراتور را با یک خط مبنای تدوین‌شده مقایسه کنید:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` نحو فایل سیاست را با نحو فایل سیاست مقایسه می‌کند؛ این فرمان
وضعیت زمان اجرا، شواهد، اعتبارنامه‌ها یا اسرار را بررسی نمی‌کند. این فرمان از همان
فرادادهٔ قواعدی استفاده می‌کند که بر هم‌پوشانی‌های محدوده‌دار حاکم است: فهرست‌های مجاز باید
برابر یا محدودتر باقی بمانند، فهرست‌های منع باید برابر یا گسترده‌تر باقی بمانند، مقادیر بولی
الزامی باید مقدار خود را حفظ کنند، رشته‌های مرتب‌شده فقط می‌توانند به سمت انتهای سخت‌گیرانه‌تر
ترتیب پیکربندی‌شده حرکت کنند و فهرست‌های دقیق باید مطابقت داشته باشند. خط مبنا می‌تواند یک
سیاست تدوین‌شده توسط سازمان باشد؛ سیاست بررسی‌شده می‌تواند مقادیر سخت‌گیرانه‌تر یا
قواعد بیشتری اضافه کند. یک قاعدهٔ سطح بالای بررسی‌شده می‌تواند قاعدهٔ محدوده‌دار خط مبنا را
در صورتی برآورده کند که به همان اندازه یا بیشتر محدودکننده باشد. لازم نیست نام محدوده‌ها میان
فایل‌ها یکسان باشد؛ مقایسه بر اساس انتخاب‌گر (`agentIds`/`channelIds`) و فیلد کلیدگذاری می‌شود.

مقایسهٔ پاک (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

خروجی پاک `policy check --json` شامل هش‌های پایداری است که اپراتور یا
ناظر می‌تواند ثبت کند:

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

پیکربندی سیاست در `plugins.entries.policy.config` قرار دارد.

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

| تنظیم                      | هدف                                                                    |
| -------------------------- | ---------------------------------------------------------------------- |
| `enabled`                  | فعال‌کردن بررسی‌های سیاست حتی پیش از وجود `policy.jsonc`.             |
| `workspaceRepairs`         | اجازه‌دادن به `doctor --fix` برای ویرایش تنظیمات فضای کاری تحت مدیریت سیاست. |
| `expectedHash`             | قفل هش اختیاری برای مصنوع سیاست تأییدشده.                              |
| `expectedAttestationHash`  | قفل هش اختیاری برای آخرین بررسی پاک و پذیرفته‌شدهٔ سیاست.             |
| `path`                     | مکان مصنوع سیاست نسبت به فضای کاری.                                    |

برای غیرفعال‌کردن بررسی‌های سیاست در یک فضای کاری، در حالی که Plugin
نصب‌شده باقی می‌ماند، `plugins.entries.policy.config.enabled` را روی `false` تنظیم کنید.

## پذیرش وضعیت سیاست

نمونهٔ خروجی JSON:

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
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
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

`attestation.policy.hash` مصنوع قاعدهٔ تدوین‌شده را مشخص می‌کند. `evidence`
وضعیت مشاهده‌شدهٔ OpenClaw را که بررسی‌ها از آن استفاده کرده‌اند ثبت می‌کند و
`workspace.hash` بار شواهد را مشخص می‌کند. `findingsHash` مجموعهٔ دقیق یافته‌ها را
مشخص می‌کند. `checkedAt` زمان اجرای بررسی را ثبت می‌کند.
`attestationHash` ادعای پایدار را مشخص می‌کند (هش سیاست، هش شواهد،
هش یافته‌ها و وضعیت پاک/ناپاک) و عمداً `checkedAt` را مستثنا می‌کند؛
بنابراین یک وضعیت سیاست یکسان همیشه همان هش گواهی را تولید می‌کند. این
چهار مقدار در کنار هم چندتایی ممیزی یک بررسی سیاست را تشکیل می‌دهند.

اگر یک Gateway یا ناظر از سیاست برای مسدودکردن، تأییدکردن یا حاشیه‌نویسی یک
کنش زمان اجرا استفاده کند، باید هش گواهی آخرین بررسی پاک را ثبت کند.
`checkedAt` برای گزارش‌های ممیزی در خروجی JSON باقی می‌ماند، اما بخشی از
هش پایدار نیست.

چرخهٔ عمر پذیرش وضعیت سیاست:

1. `policy.jsonc` را تدوین یا بازبینی کنید.
2. `openclaw policy check --json` را اجرا کنید.
3. اگر پاک بود، `attestation.policy.hash` را به‌عنوان `expectedHash` ثبت کنید.
4. `attestation.attestationHash` را به‌عنوان `expectedAttestationHash` ثبت کنید.
5. `openclaw doctor --lint` را دوباره در CI یا دروازه‌های انتشار اجرا کنید.

اگر قواعد سیاست عمداً تغییر می‌کنند، هر دو هش پذیرفته‌شده را بر اساس یک
بررسی پاک به‌روزرسانی کنید. اگر فقط تنظیمات فضای کاری تغییر می‌کنند (و سیاست ثابت می‌ماند)،
معمولاً فقط `expectedAttestationHash` تغییر می‌کند.

فعال‌سازی یا ارتقای قواعد `agents.workspace`، شواهد `agentWorkspace` را
به هش فضای کاری و هش گواهی اضافه می‌کند؛ پس از فعال‌سازی، شواهد جدید را بررسی کنید و
هش‌های گواهی پذیرفته‌شده را نوسازی کنید. فعال‌سازی یا ارتقای قواعد وضعیت ابزار نیز
به همین روش شواهد `toolPosture` را اضافه می‌کند.

`openclaw policy watch` بررسی را دوباره اجرا می‌کند و زمانی گزارش می‌دهد که شواهد فعلی دیگر
با `expectedAttestationHash` مطابقت ندارند:

```bash
openclaw policy watch --json
```

در CI یا اسکریپت‌هایی که به یک ارزیابی واحد از انحراف نیاز دارند، از `--once` استفاده کنید. بدون
`--once`، به‌طور پیش‌فرض هر دو ثانیه یک‌بار بررسی می‌کند؛ برای تغییر
فاصله زمانی از `--interval-ms` استفاده کنید.

## یافته‌ها

| شناسه بررسی                                              | یافته                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | سیاست فعال است، اما `policy.jsonc` وجود ندارد.                                              |
| `policy/policy-jsonc-invalid`                            | سیاست قابل تجزیه نیست یا شامل ورودی‌های قاعده با ساختار نامعتبر است.                        |
| `policy/policy-hash-mismatch`                            | سیاست با `expectedHash` پیکربندی‌شده مطابقت ندارد.                                          |
| `policy/attestation-hash-mismatch`                       | شواهد فعلی سیاست دیگر با گواهی پذیرفته‌شده مطابقت ندارند.                                   |
| `policy/policy-conformance-invalid`                      | فایل سیاست مبنا یا بررسی‌شده دارای نحو مقایسه نامعتبر است.                                  |
| `policy/policy-conformance-missing`                      | فایل سیاست بررسی‌شده، قاعده‌ای الزامی از فایل سیاست مبنا را ندارد.                         |
| `policy/policy-conformance-weaker`                       | مقداری در فایل سیاست بررسی‌شده از مقدار فایل سیاست مبنا ضعیف‌تر است.                       |
| `policy/channels-denied-provider`                        | یک کانال فعال با قاعده منع کانال مطابقت دارد.                                               |
| `policy/mcp-denied-server`                               | یک سرور MCP پیکربندی‌شده توسط سیاست منع شده است.                                            |
| `policy/mcp-unapproved-server`                           | یک سرور MCP پیکربندی‌شده خارج از فهرست مجاز است.                                            |
| `policy/models-denied-provider`                          | یک ارائه‌دهنده مدل یا ارجاع مدل پیکربندی‌شده از ارائه‌دهنده‌ای منع‌شده استفاده می‌کند.     |
| `policy/models-unapproved-provider`                      | یک ارائه‌دهنده مدل یا ارجاع مدل پیکربندی‌شده خارج از فهرست مجاز است.                       |
| `policy/network-private-access-enabled`                  | یک راه گریز SSRF برای شبکه خصوصی، در حالی فعال است که سیاست آن را منع می‌کند.               |
| `policy/ingress-dm-policy-unapproved`                    | سیاست پیام مستقیم یک کانال خارج از فهرست مجاز سیاست است.                                   |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` با دامنه جداسازی پیام مستقیم موردنیاز سیاست مطابقت ندارد.                 |
| `policy/ingress-open-groups-denied`                      | سیاست گروه یک کانال `open` است، در حالی که سیاست ورودی گروه باز را منع می‌کند.              |
| `policy/ingress-group-mention-required`                  | یک ورودی کانال یا گروه، در حالی دروازه‌های اشاره را غیرفعال می‌کند که سیاست آن‌ها را الزامی می‌داند. |
| `policy/gateway-non-loopback-bind`                       | وضعیت اتصال Gateway، در حالی امکان دسترسی غیرمحلی را می‌دهد که سیاست آن را منع می‌کند.     |
| `policy/gateway-auth-disabled`                           | احراز هویت Gateway، در حالی غیرفعال است که سیاست آن را الزامی می‌داند.                      |
| `policy/gateway-rate-limit-missing`                      | وضعیت محدودیت نرخ احراز هویت Gateway، در حالی صریح نیست که سیاست آن را الزامی می‌داند.      |
| `policy/gateway-control-ui-insecure`                     | گزینه‌های دسترسی ناامن رابط کنترل Gateway فعال هستند.                                      |
| `policy/gateway-tailscale-funnel`                        | دسترسی Funnel متعلق به Gateway Tailscale، در حالی فعال است که سیاست آن را منع می‌کند.       |
| `policy/gateway-remote-enabled`                          | حالت راه دور Gateway، در حالی فعال است که سیاست آن را منع می‌کند.                           |
| `policy/gateway-http-endpoint-enabled`                   | یک نقطه پایانی API مبتنی بر HTTP در Gateway، با وجود منع سیاست فعال است.                    |
| `policy/gateway-http-url-fetch-unrestricted`             | ورودی واکشی URL از طریق HTTP در Gateway، فهرست مجاز URL الزامی را ندارد.                    |
| `policy/gateway-node-command-denied`                     | یک فرمان Node که سیاست آن را منع کرده، در پیکربندی OpenClaw منع نشده است.                  |
| `policy/agents-workspace-access-denied`                  | حالت محیط ایزوله عامل یا دسترسی فضای کاری خارج از فهرست مجاز سیاست است.                    |
| `policy/agents-tool-not-denied`                          | پیکربندی یک عامل یا پیکربندی پیش‌فرض، ابزاری را که سیاست منع آن را الزامی می‌داند منع نمی‌کند. |
| `policy/tools-profile-unapproved`                        | پروفایل ابزار سراسری یا مختص عاملِ پیکربندی‌شده خارج از فهرست مجاز است.                    |
| `policy/tools-fs-workspace-only-required`                | ابزارهای سامانه فایل با وضعیت مسیر محدود به فضای کاری پیکربندی نشده‌اند.                   |
| `policy/tools-exec-security-unapproved`                  | حالت امنیت اجرای فرمان خارج از فهرست مجاز سیاست است.                                       |
| `policy/tools-exec-ask-unapproved`                       | حالت درخواست تأیید اجرای فرمان خارج از فهرست مجاز سیاست است.                               |
| `policy/tools-exec-host-unapproved`                      | مسیریابی میزبان اجرای فرمان خارج از فهرست مجاز سیاست است.                                  |
| `policy/tools-elevated-enabled`                          | حالت ابزار دارای دسترسی ارتقایافته، در حالی فعال است که سیاست آن را منع می‌کند.            |
| `policy/tools-also-allow-missing`                        | فهرست `alsoAllow` پیکربندی‌شده فاقد ورودی الزامی سیاست است.                                 |
| `policy/tools-also-allow-unexpected`                     | فهرست `alsoAllow` پیکربندی‌شده شامل ورودی‌ای است که سیاست انتظار آن را ندارد.              |
| `policy/tools-required-deny-missing`                     | فهرست منع ابزار سراسری یا مختص عامل، ابزار منع‌شده الزامی را در بر نمی‌گیرد.                |
| `policy/sandbox-mode-unapproved`                         | حالت محیط ایزوله خارج از فهرست مجاز سیاست است.                                              |
| `policy/sandbox-backend-unapproved`                      | پشتیبان محیط ایزوله خارج از فهرست مجاز سیاست است.                                           |
| `policy/sandbox-container-posture-unobservable`          | یک قاعده وضعیت کانتینر برای پشتیبانی فعال است که نمی‌تواند آن را مشاهده کند.                |
| `policy/sandbox-container-host-network-denied`           | یک محیط ایزوله یا مرورگر مبتنی بر کانتینر از حالت شبکه میزبان استفاده می‌کند.              |
| `policy/sandbox-container-namespace-join-denied`         | یک محیط ایزوله یا مرورگر مبتنی بر کانتینر به فضای نام کانتینر دیگری می‌پیوندد.              |
| `policy/sandbox-container-mount-mode-required`           | اتصال یک محیط ایزوله یا مرورگر مبتنی بر کانتینر فقط‌خواندنی نیست.                           |
| `policy/sandbox-container-runtime-socket-mount`          | اتصال یک محیط ایزوله یا مرورگر مبتنی بر کانتینر، سوکت زمان اجرای کانتینر را در معرض دسترسی قرار می‌دهد. |
| `policy/sandbox-container-unconfined-profile`            | پروفایل محیط ایزوله کانتینر، در حالی نامحدود است که سیاست آن را منع می‌کند.                 |
| `policy/sandbox-browser-cdp-source-range-missing`        | محدوده مبدأ CDP مرورگر محیط ایزوله، در حالی وجود ندارد که سیاست آن را الزامی می‌داند.       |
| `policy/data-handling-redaction-disabled`                | حذف اطلاعات حساس از گزارش‌ها، در حالی غیرفعال است که سیاست آن را الزامی می‌داند.            |
| `policy/data-handling-telemetry-content-capture`         | ثبت محتوای تله‌متری، در حالی فعال است که سیاست آن را منع می‌کند.                            |
| `policy/data-handling-session-retention-not-enforced`    | نگه‌داری دوره‌ای نشست‌ها، در حالی اعمال نمی‌شود که سیاست آن را الزامی می‌داند.              |
| `policy/data-handling-session-transcript-memory-enabled` | نمایه‌سازی حافظه رونوشت نشست، در حالی فعال است که سیاست آن را منع می‌کند.                   |
| `policy/secrets-unmanaged-provider`                      | یک SecretRef در پیکربندی به ارائه‌دهنده‌ای ارجاع می‌دهد که در `secrets.providers` تعریف نشده است. |
| `policy/secrets-denied-provider-source`                  | یک ارائه‌دهنده راز یا SecretRef در پیکربندی از منبعی استفاده می‌کند که سیاست آن را منع کرده است. |
| `policy/secrets-insecure-provider`                       | یک ارائه‌دهنده راز، در حالی وضعیت ناامن را می‌پذیرد که سیاست آن را منع می‌کند.              |
| `policy/auth-profile-invalid-metadata`                   | پروفایل احراز هویت پیکربندی‌شده فاقد فراداده معتبر ارائه‌دهنده یا حالت است.                 |
| `policy/auth-profile-unapproved-mode`                    | حالت پروفایل احراز هویت پیکربندی‌شده خارج از فهرست مجاز سیاست است.                         |
| `policy/exec-approvals-missing`                          | سیاست وجود `exec-approvals.json` را الزامی می‌داند، اما این مصنوع وجود ندارد.               |
| `policy/exec-approvals-invalid`                          | مصنوع تأییدهای اجرای فرمانِ پیکربندی‌شده قابل تجزیه نیست.                                   |
| `policy/exec-approvals-default-security-unapproved`      | پیش‌فرض‌های تأیید اجرای فرمان از حالت امنیتی خارج از فهرست مجاز سیاست استفاده می‌کنند.      |
| `policy/exec-approvals-agent-security-unapproved`        | حالت امنیتی مؤثر تأیید اجرای فرمان برای یک عامل خارج از فهرست مجاز است.                    |
| `policy/exec-approvals-auto-allow-skills-enabled`        | یک عامل تأیید اجرای فرمان، در حالی CLIهای Skills را به‌طور ضمنی و خودکار مجاز می‌کند که سیاست آن را منع می‌کند. |
| `policy/exec-approvals-allowlist-missing`                | فهرست مجاز تأییدها فاقد الگویی است که سیاست آن را الزامی می‌داند.                          |
| `policy/exec-approvals-allowlist-unexpected`             | فهرست مجاز تأییدها شامل الگویی است که سیاست انتظار آن را ندارد.                            |
| `policy/tools-missing-risk-level`                        | اعلان یک ابزار تحت حاکمیت فاقد فراداده ریسک است.                                            |
| `policy/tools-unknown-risk-level`                        | اعلان یک ابزار تحت حاکمیت از مقدار ریسک ناشناخته‌ای استفاده می‌کند.                        |
| `policy/tools-missing-sensitivity-token`                 | اعلان یک ابزار تحت حاکمیت فاقد فراداده حساسیت است.                                         |
| `policy/tools-missing-owner`                             | اعلان یک ابزار تحت حاکمیت فاقد فراداده مالک است.                                           |
| `policy/tools-unknown-sensitivity-token`                 | اعلان یک ابزار تحت حاکمیت از مقدار حساسیت ناشناخته‌ای استفاده می‌کند.                      |

یک یافته می‌تواند هم شامل `target` (مورد مشاهده‌شده در فضای کاری که
مطابقت ندارد) و هم شامل `requirement` (قاعده تدوین‌شده‌ای که باعث ایجاد یافته شده است)
باشد. در حال حاضر هر دو رشته نشانی `oc://` هستند، اما نام فیلدها نقش سیاستی را
توصیف می‌کنند، نه قالب نشانی را.

نمونه یافته‌ها:

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

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

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

## ترمیم

`doctor --lint` و `policy check` فقط خواندنی هستند.

`doctor --fix` تنها زمانی تنظیمات فضای کاری تحت مدیریت خط‌مشی را ویرایش می‌کند که
`workspaceRepairs` به‌صراحت فعال شده باشد؛ در غیر این صورت، بررسی‌ها مواردی را که
ترمیم می‌کردند گزارش می‌کنند و تنظیمات را بدون تغییر باقی می‌گذارند.

در این نسخه، ترمیم می‌تواند کانال‌های منع‌شده توسط `channels.denyRules` را غیرفعال
کند و ترمیم‌های محدودسازی خودکار فهرست‌شده در زیر را اعمال کند. `workspaceRepairs`
را فقط پس از بازبینی فایل خط‌مشی فعال کنید، زیرا یک قاعده معتبر می‌تواند پیکربندی
فضای کاری را تغییر دهد:

- وقتی یک خط‌مشی سراسری ابزارهای دارای سطح دسترسی بالاتر را ممنوع می‌کند، مقدار `tools.elevated.enabled=false` را تنظیم کند
- وقتی خط‌مشی الزام می‌کند آن ابزارها منع شوند، شناسه‌های ابزارِ الزامیِ منع‌شده و مفقود را به `tools.deny` یا
  `agents.list[].tools.deny` اضافه کند
- کلیدهای ناامن `gateway.controlUi.*` را روی `false` تنظیم کند
- وقتی خط‌مشی حالت Gateway راه‌دور را منع می‌کند، `gateway.mode=local` را تنظیم کند
- وقتی خط‌مشی نقاط پایانی API HTTP مربوط به Gateway را منع می‌کند، مسیرهای گزارش‌شده `gateway.http.endpoints.*.enabled` را روی `false` تنظیم کند
- وقتی خط‌مشی ورود باز گروهی را منع می‌کند، مسیرهای گزارش‌شده `groupPolicy` برای ورودی کانال را روی `allowlist` تنظیم کند
- وقتی خط‌مشی اشاره در گروه را الزامی می‌کند، مسیرهای گزارش‌شده `requireMention` برای ورودی کانال را روی `true` تنظیم کند
- وقتی خط‌مشی حذف اطلاعات حساس از گزارش‌ها را الزامی می‌کند، `logging.redactSensitive=tools` را تنظیم کند
- وقتی خط‌مشی ضبط محتوای تله‌متری را منع می‌کند، `diagnostics.otel.captureContent=false` یا برای تنظیمات ضبط تله‌متری با ساختار شیء،
  `diagnostics.otel.captureContent.enabled=false` را تنظیم کند

ترمیم ابزارهای دارای سطح دسترسی بالاتر با دامنه محدود، فقط شناسایی می‌شود. ترمیم‌های
مدیریت داده با دامنه محدود نیز زمانی نادیده گرفته می‌شوند که یافته، پیکربندی مشترک
گزارش‌گیری یا تله‌متری را گزارش کند، زیرا تغییر تنظیم مشترک بر مواردی فراتر از هدف
خط‌مشی با دامنه محدود اثر می‌گذارد.

ترمیم‌های الزامیِ منع‌شده با دامنه محدود زمانی نادیده گرفته می‌شوند که یافته،
`tools.deny` ریشه‌ایِ به‌ارث‌رسیده را گزارش کند، زیرا افزودن ابزار الزامی به
پیکربندی ریشه بر مواردی فراتر از هدف خط‌مشی با دامنه محدود اثر می‌گذارد. ترمیم‌های
الزامیِ منع‌شده محلیِ عامل می‌توانند مسیر گزارش‌شده `agents.list[].tools.deny` را
به‌روزرسانی کنند.

ترمیم‌های ورودی کانال با دامنه محدود زمانی نادیده گرفته می‌شوند که یافته،
`channels.defaults.*` به‌ارث‌رسیده را گزارش کند، زیرا تغییر مقدار پیش‌فرض مشترک
کانال بر مواردی فراتر از هدف خط‌مشی با دامنه محدود اثر می‌گذارد. یافته‌های فهرست
مجاز واکشی URL از طریق HTTP در Gateway همچنان دستی باقی می‌مانند، زیرا ترمیم
خودکار نمی‌تواند مقادیر درست فهرست مجاز URL نقاط پایانی را انتخاب کند.

یافته‌های اتصال Gateway و فرمان Node همچنان نیازمند بازبینی هستند. وقتی
`policy/gateway-non-loopback-bind` یا `policy/gateway-node-command-denied`
را بتوان به یک مسیر پیکربندی نگاشت کرد، `doctor --fix` تغییر پیشنهادی
`gateway.bind` یا `gateway.nodes.denyCommands` را به‌صورت راهنمای پیش‌نمایش
نادیده‌گرفته‌شده گزارش می‌کند. این فرمان تغییر را اعمال نمی‌کند و تا زمانی که
یک اپراتور پیکربندی یا خط‌مشی را بازبینی و به‌روزرسانی نکند، یافته ترمیم‌شده
محسوب نمی‌شود.

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

| فرمان             | `0`                                                        | `1`                                                               | `2`                          |
| ---------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------- |
| `policy check`   | هیچ یافته‌ای در آستانه تعیین‌شده وجود ندارد.               | یک یا چند یافته به آستانه تعیین‌شده رسیده‌اند.                    | شکست آرگومان یا زمان اجرا. |
| `policy compare` | فایل خط‌مشی دست‌کم به‌اندازه خط مبنا سخت‌گیرانه است.       | فایل خط‌مشی نامعتبر، مفقود یا ضعیف‌تر از قواعد خط مبنا است.      | شکست آرگومان یا زمان اجرا. |
| `policy watch`   | هیچ یافته‌ای وجود ندارد و هش پذیرفته‌شده به‌روز است.       | یافته‌هایی وجود دارند یا گواهی پذیرفته‌شده منقضی شده است.        | شکست آرگومان یا زمان اجرا. |

## مرتبط

- [حالت بررسی Doctor](/fa/cli/doctor#lint-mode)
- [CLI مسیر](/fa/cli/path)

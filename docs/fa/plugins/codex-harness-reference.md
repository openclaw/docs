---
read_when:
    - به همهٔ فیلدهای پیکربندی harness در Codex نیاز دارید
    - در حال تغییر رفتار انتقال، احراز هویت، کشف، یا زمان‌پایان app-server هستید
    - در حال اشکال‌زدایی راه‌اندازی هارنس Codex، کشف مدل، یا جداسازی محیط هستید
summary: مرجع پیکربندی، احراز هویت، کشف و سرور برنامه برای harness کدکس
title: مرجع هارنس Codex
x-i18n:
    generated_at: "2026-07-01T08:22:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

این مرجع پیکربندی تفصیلی Plugin همراه `codex` را پوشش می‌دهد. برای راه‌اندازی و تصمیم‌های مسیریابی، از
[مهار Codex](/fa/plugins/codex-harness) شروع کنید.

## سطح پیکربندی Plugin

همه تنظیمات مهار Codex زیر `plugins.entries.codex.config` قرار دارند.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

فیلدهای سطح بالای پشتیبانی‌شده:

| فیلد                       | پیش‌فرض                  | معنی                                                                                                                                       |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | فعال                     | تنظیمات کشف مدل برای `model/list` در app-server کدکس.                                                                                      |
| `appServer`                | app-server مدیریت‌شده stdio | تنظیمات انتقال، فرمان، احراز هویت، تأیید، سندباکس و مهلت زمانی.                                                                          |
| `codexDynamicToolsLoading` | `"searchable"`           | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw مستقیماً در زمینه اولیه ابزار Codex قرار بگیرند.                                   |
| `codexDynamicToolsExclude` | `[]`                     | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های app-server کدکس حذف شوند.                                                        |
| `codexPlugins`             | غیرفعال                  | پشتیبانی بومی Plugin/app کدکس برای Pluginهای گزینش‌شده مهاجرت‌کرده که از منبع نصب شده‌اند. [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins) را ببینید. |
| `computerUse`              | غیرفعال                  | راه‌اندازی Codex Computer Use. [Codex Computer Use](/fa/plugins/codex-computer-use) را ببینید.                                                |

## انتقال app-server

به‌طور پیش‌فرض، OpenClaw باینری مدیریت‌شده Codex را که همراه Plugin همراه عرضه می‌شود، اجرا می‌کند:

```bash
codex app-server --listen stdio://
```

این کار نسخه app-server را به Plugin همراه `codex` گره می‌زند، نه به هر Codex CLI جداگانه‌ای که ممکن است به‌صورت محلی نصب شده باشد. فقط زمانی `appServer.command` را تنظیم کنید که عمداً می‌خواهید یک فایل اجرایی متفاوت را اجرا کنید.

برای یک app-server از قبل در حال اجرا، از انتقال WebSocket استفاده کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

فیلدهای `appServer` پشتیبانی‌شده:

| فیلد                                         | پیش‌فرض                                                | معنا                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"`، Codex را اجرا می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | باینری مدیریت‌شده Codex                                   | فایل اجرایی برای ترابری stdio. برای استفاده از باینری مدیریت‌شده، آن را تنظیم‌نشده بگذارید.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌ها برای ترابری stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | تنظیم‌نشده                                                  | URL سرور برنامه WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | تنظیم‌نشده                                                  | توکن Bearer برای ترابری WebSocket. یک رشته صریح یا SecretInput مانند `${CODEX_APP_SERVER_TOKEN}` را می‌پذیرد.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | سرآیندهای اضافی WebSocket. مقدارهای سرآیند رشته‌های صریح یا مقدارهای SecretInput را می‌پذیرند، برای مثال `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط به‌ارث‌رسیده توسط OpenClaw، از فرایند stdio app-server اجراشده حذف می‌شوند.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | تنظیم‌نشده                                                  | ریشه فضای کاری app-server راه‌دور Codex. وقتی تنظیم شود، OpenClaw ریشه فضای کاری محلی را از فضای کاری حل‌شده OpenClaw استنباط می‌کند، پسوند cwd فعلی را زیر این ریشه راه‌دور حفظ می‌کند، و فقط cwd نهایی app-server را به Codex می‌فرستد. اگر cwd بیرون از ریشه فضای کاری حل‌شده OpenClaw باشد، OpenClaw به‌جای فرستادن یک مسیر محلی Gateway به app-server راه‌دور، به‌صورت بسته شکست می‌خورد. |
| `requestTimeoutMs`                            | `60000`                                                | مهلت زمانی برای فراخوانی‌های صفحه کنترل app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | پنجره سکوت پس از پذیرش یک نوبت توسط Codex یا پس از یک درخواست app-server محدود به نوبت، در حالی که OpenClaw منتظر `turn/completed` می‌ماند.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | نگهبان تکمیل در حالت بیکار و پیشرفت که پس از واگذاری به ابزار، تکمیل ابزار بومی، پیشرفت خام دستیار پس از ابزار، تکمیل خام استدلال، یا پیشرفت استدلال استفاده می‌شود، در حالی که OpenClaw منتظر `turn/completed` می‌ماند. از این گزینه برای بارهای کاری مورد اعتماد یا سنگین استفاده کنید که در آن‌ها ترکیب پس از ابزار می‌تواند به‌طور موجه بیشتر از بودجه انتشار نهایی دستیار ساکت بماند.                                |
| `mode`                                        | `"yolo"` مگر اینکه الزامات محلی Codex، YOLO را مجاز ندانند | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط نگهبان.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` یا یک سیاست تأیید مجاز نگهبان       | سیاست تأیید بومی Codex که به شروع رشته، ازسرگیری، و نوبت فرستاده می‌شود.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` یا یک سندباکس مجاز نگهبان  | حالت سندباکس بومی Codex که به شروع رشته و ازسرگیری فرستاده می‌شود. سندباکس‌های فعال OpenClaw نوبت‌های `danger-full-access` را به `workspace-write` در Codex محدود می‌کنند؛ پرچم شبکه نوبت از خروجی سندباکس OpenClaw پیروی می‌کند.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` یا یک بازبین مجاز نگهبان               | از `"auto_review"` استفاده کنید تا Codex در صورت مجاز بودن، اعلان‌های تأیید بومی را بازبینی کند.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | دایرکتوری فرایند فعلی                              | فضای کاری استفاده‌شده توسط `/codex bind` وقتی `--cwd` حذف شده باشد.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | تنظیم‌نشده                                                  | رده سرویس اختیاری app-server برای Codex. `"priority"` مسیریابی حالت سریع را فعال می‌کند، `"flex"` پردازش flex را درخواست می‌کند، و `null` بازنویسی را پاک می‌کند. `"fast"` قدیمی به‌عنوان `"priority"` پذیرفته می‌شود.                                                                                                                                                                                                 |
| `networkProxy`                                | غیرفعال                                               | انتخاب اختیاری شبکه‌سازی نمایه مجوزهای Codex برای فرمان‌های app-server. OpenClaw پیکربندی انتخاب‌شده `permissions.<profile>.network` را تعریف می‌کند و آن را به‌جای فرستادن `sandbox` با `default_permissions` انتخاب می‌کند.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | انتخاب اختیاری پیش‌نمایش که یک محیط Codex پشتیبانی‌شده با سندباکس OpenClaw را در Codex app-server 0.132.0 یا جدیدتر ثبت می‌کند تا اجرای بومی Codex بتواند داخل سندباکس فعال OpenClaw اجرا شود.                                                                                                                                                                                                         |

`appServer.networkProxy` صریح است، چون قرارداد سندباکس Codex را تغییر می‌دهد.
وقتی فعال باشد، OpenClaw همچنین `features.network_proxy.enabled` و
`default_permissions` را در پیکربندی رشته Codex تنظیم می‌کند تا نمایه مجوز
تولیدشده بتواند شبکه‌سازی مدیریت‌شده Codex را شروع کند. به‌طور پیش‌فرض، OpenClaw
یک نام نمایه مقاوم در برابر برخورد به شکل `openclaw-network-<fingerprint>` را از
بدنه نمایه تولید می‌کند؛ از `profileName` فقط وقتی استفاده کنید که یک نام محلی
پایدار لازم است.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

اگر زمان اجرای معمول app-server قرار بود `danger-full-access` باشد، فعال کردن
`networkProxy` از دسترسی فایل‌سیستمی به سبک فضای کاری برای نمایه مجوز تولیدشده
استفاده می‌کند. اعمال شبکه مدیریت‌شده Codex، شبکه‌سازی سندباکس‌شده است، بنابراین
یک نمایه با دسترسی کامل از ترافیک خروجی محافظت نمی‌کند.

Plugin، دست‌دهی‌های app-server قدیمی‌تر یا بدون نسخه را مسدود می‌کند. Codex app-server
باید نسخه پایدار `0.125.0` یا جدیدتر را گزارش کند.

OpenClaw، URLهای WebSocket سرور برنامه غیر loopback را راه‌دور تلقی می‌کند و
احراز هویت WebSocket دارای هویت را از طریق `appServer.authToken` یا یک
سرآیند `Authorization` الزامی می‌داند. `appServer.authToken` و هر مقدار
`appServer.headers.*` می‌تواند یک SecretInput باشد؛ زمان اجرای secrets، پیش از
آن‌که OpenClaw گزینه‌های شروع سرور برنامه را بسازد، SecretRefها و خلاصه‌نویسی
env را resolve می‌کند، و SecretRefهای ساخت‌یافته resolveنشده پیش از ارسال هر
توکن یا سرآیندی fail می‌شوند. وقتی Pluginهای بومی Codex پیکربندی شده باشند،
OpenClaw از صفحه کنترل Plugin سرور برنامه متصل برای نصب یا تازه‌سازی آن
Pluginها استفاده می‌کند و سپس inventory برنامه را تازه‌سازی می‌کند تا
برنامه‌های متعلق به Plugin برای thread مربوط به Codex قابل مشاهده باشند.
`app/list` همچنان منبع معتبر inventory و metadata است، اما سیاست OpenClaw
تصمیم می‌گیرد که آیا `thread/start` برای یک برنامه قابل دسترسِ فهرست‌شده
`config.apps[appId].enabled = true` را ارسال کند، حتی اگر Codex در حال حاضر آن
را غیرفعال علامت‌گذاری کرده باشد. شناسه‌های برنامه ناشناخته یا گم‌شده همچنان
fail-closed می‌مانند؛ این مسیر فقط Pluginهای marketplace را از طریق
`plugin/install` فعال می‌کند و inventory را تازه‌سازی می‌کند. OpenClaw را فقط
به سرورهای برنامه راه‌دوری متصل کنید که برای پذیرش نصب Pluginهای مدیریت‌شده
توسط OpenClaw و تازه‌سازی inventory برنامه قابل اعتماد هستند.

## حالت‌های تأیید و sandbox

نشست‌های سرور برنامه stdio محلی به‌طور پیش‌فرض از حالت YOLO استفاده می‌کنند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"` و
`sandbox: "danger-full-access"`. این وضعیت اپراتور محلیِ مورد اعتماد اجازه
می‌دهد turnهای بدون نظارت OpenClaw و heartbeatها بدون promptهای تأیید بومی که
کسی برای پاسخ‌گویی به آن‌ها حاضر نیست، پیشرفت کنند.

اگر فایل نیازمندی‌های سیستم محلی Codex مقدارهای ضمنی تأیید YOLO، reviewer یا
sandbox را مجاز نداند، OpenClaw مقدار پیش‌فرض ضمنی را به‌جای آن guardian در نظر
می‌گیرد و مجوزهای guardian مجاز را انتخاب می‌کند. `tools.exec.mode: "auto"`
هم تأییدهای Codex بازبینی‌شده توسط guardian را اجباری می‌کند و overrideهای
ناامن قدیمی `approvalPolicy: "never"` یا `sandbox: "danger-full-access"` را حفظ
نمی‌کند؛ برای وضعیت عمدی بدون تأیید، `tools.exec.mode: "full"` را تنظیم کنید.
ورودی‌های
`[[remote_sandbox_config]]` منطبق با hostname در همان فایل نیازمندی‌ها برای
تصمیم پیش‌فرض sandbox رعایت می‌شوند.

برای تأییدهای Codex بازبینی‌شده توسط guardian، `appServer.mode: "guardian"` را
تنظیم کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

preset مربوط به `guardian` وقتی این مقدارها مجاز باشند، به
`approvalPolicy: "on-request"`، `approvalsReviewer: "auto_review"` و
`sandbox: "workspace-write"` گسترش می‌یابد. فیلدهای سیاست جداگانه `mode` را
override می‌کنند. مقدار reviewer قدیمی‌تر `guardian_subagent` همچنان به‌عنوان
alias سازگاری پذیرفته می‌شود، اما پیکربندی‌های جدید باید از `auto_review`
استفاده کنند.

وقتی یک sandbox در OpenClaw فعال است، فرایند سرور برنامه محلی Codex همچنان روی
میزبان Gateway اجرا می‌شود. بنابراین OpenClaw به‌جای معادل دانستن sandbox سمت
میزبان Codex با backend مربوط به sandbox در OpenClaw، برای آن turn، Code Mode
بومی Codex، سرورهای MCP کاربر و اجرای Pluginهای پشتیبانی‌شده با برنامه را
غیرفعال می‌کند. وقتی ابزارهای عادی exec/process در دسترس باشند، دسترسی shell
از طریق ابزارهای dynamic پشتیبانی‌شده با sandbox در OpenClaw مانند
`sandbox_exec` و `sandbox_process` ارائه می‌شود.

روی میزبان‌های Ubuntu/AppArmor، وقتی عمداً `workspace-write` بومی Codex را بدون
sandboxing فعال OpenClaw اجرا می‌کنید، bwrap مربوط به Codex می‌تواند پیش از
شروع فرمان shell زیر `workspace-write` fail شود. اگر
`bwrap: setting up uid map: Permission denied` یا
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` را دیدید،
`openclaw doctor` را اجرا کنید و سیاست namespace میزبان گزارش‌شده برای کاربر
سرویس OpenClaw را اصلاح کنید، نه این‌که امتیازهای گسترده‌تری به container
Docker بدهید. یک profile محدود AppArmor برای فرایند سرویس را ترجیح دهید؛
fallback مربوط به `kernel.apparmor_restrict_unprivileged_userns=0` در سطح کل
میزبان است و tradeoffهای امنیتی دارد.

## اجرای بومی sandboxشده

پیش‌فرض پایدار fail-closed است: sandboxing فعال OpenClaw سطح‌های اجرای بومی
Codex را که در غیر این صورت از میزبان سرور برنامه Codex اجرا می‌شدند، غیرفعال
می‌کند. فقط وقتی می‌خواهید پشتیبانی محیط راه‌دور Codex را با backend مربوط به
sandbox در OpenClaw امتحان کنید، از `appServer.experimental.sandboxExecServer: true`
استفاده کنید. این مسیر preview به سرور برنامه Codex نسخه 0.132.0 یا جدیدتر
نیاز دارد.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

وقتی این flag روشن باشد و نشست فعلی OpenClaw sandbox شده باشد، OpenClaw یک
سرور اجرای local loopback را که توسط sandbox فعال پشتیبانی می‌شود شروع می‌کند،
آن را در سرور برنامه Codex ثبت می‌کند، و thread و turn مربوط به Codex را با آن
محیط متعلق به OpenClaw شروع می‌کند. اگر سرور برنامه نتواند محیط را ثبت کند،
run به‌جای fallback بی‌صدا به اجرای میزبان، به‌صورت fail-closed شکست می‌خورد.

این مسیر preview فقط محلی است. یک سرور برنامه WebSocket راه‌دور نمی‌تواند به
سرور اجرای loopback دسترسی پیدا کند مگر این‌که روی همان میزبان اجرا شود، پس
OpenClaw این ترکیب را رد می‌کند.

## احراز هویت و جداسازی محیط

احراز هویت به این ترتیب انتخاب می‌شود:

1. یک profile احراز هویت صریح OpenClaw Codex برای agent.
2. حساب موجود سرور برنامه در خانه Codex همان agent.
3. فقط برای اجراهای سرور برنامه stdio محلی، `CODEX_API_KEY` و سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب سرور برنامه‌ای وجود ندارد و احراز هویت
   OpenAI همچنان لازم است.

وقتی OpenClaw یک profile احراز هویت Codex از نوع اشتراک ChatGPT می‌بیند،
`CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند child مربوط به Codex که spawn
شده حذف می‌کند. این کار کلیدهای API سطح Gateway را برای embeddings یا مدل‌های
مستقیم OpenAI در دسترس نگه می‌دارد، بدون آن‌که turnهای سرور برنامه بومی Codex
به‌طور تصادفی از طریق API صورتحساب شوند.

profileهای صریح کلید API مربوط به Codex و fallback کلید env برای stdio محلی،
به‌جای env ارث‌بری‌شده فرایند child، از login سرور برنامه استفاده می‌کنند.
اتصال‌های سرور برنامه WebSocket، fallback کلید API از env مربوط به Gateway را
دریافت نمی‌کنند؛ از یک profile احراز هویت صریح یا حساب خود سرور برنامه
راه‌دور استفاده کنید.

اجراهای سرور برنامه stdio به‌طور پیش‌فرض محیط فرایند OpenClaw را به ارث
می‌برند. OpenClaw مالک پل حساب سرور برنامه Codex است و `CODEX_HOME` را به یک
دایرکتوری per-agent زیر state همان agent در OpenClaw تنظیم می‌کند. این کار
پیکربندی Codex، حساب‌ها، cache/data مربوط به Plugin و state مربوط به thread را
به agent در OpenClaw محدود می‌کند، به‌جای آن‌که از خانه شخصی `~/.codex` اپراتور
نشت کند.

OpenClaw برای اجراهای عادی سرور برنامه محلی، `HOME` را بازنویسی نمی‌کند.
زیرفرایندهای اجراشده توسط Codex مانند `openclaw`، `gh`، `git`، CLIهای cloud و
فرمان‌های shell خانه عادی فرایند را می‌بینند و می‌توانند پیکربندی و tokenهای
خانه کاربر را پیدا کنند. Codex همچنین ممکن است `$HOME/.agents/skills` و
`$HOME/.agents/plugins/marketplace.json` را کشف کند؛ آن کشف `.agents` عمداً با
خانه اپراتور shared است و از state ایزوله `~/.codex` جدا است.

Pluginهای OpenClaw و snapshotهای skill در OpenClaw همچنان از registry اختصاصی
Plugin در OpenClaw و loader مربوط به skill عبور می‌کنند. assetهای شخصی Codex
در `~/.codex` چنین نیستند. اگر Skills یا Pluginهای مفید Codex CLI از یک خانه
Codex دارید که باید بخشی از یک agent در OpenClaw شوند، آن‌ها را صریحاً
inventory کنید:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

اگر یک deployment به جداسازی محیطی بیشتری نیاز دارد، آن متغیرها را به
`appServer.clearEnv` اضافه کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` فقط روی فرایند child مربوط به سرور برنامه Codex که spawn
شده اثر می‌گذارد. OpenClaw هنگام normalization اجرای محلی، `CODEX_HOME` و
`HOME` را از این فهرست حذف می‌کند: `CODEX_HOME` به‌صورت per-agent باقی می‌ماند
و `HOME` ارث‌بری‌شده باقی می‌ماند تا زیرفرایندها بتوانند از state عادی خانه
کاربر استفاده کنند.

## ابزارهای dynamic

ابزارهای dynamic در Codex به‌طور پیش‌فرض با loading از نوع `searchable` کار
می‌کنند. OpenClaw ابزارهای dynamic را که عملیات workspace بومی Codex را
تکرار می‌کنند، expose نمی‌کند:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

بیشتر ابزارهای integration باقی‌مانده OpenClaw، مانند messaging، media، cron،
browser، nodes، gateway، `heartbeat_respond` و `web_search`، از طریق جست‌وجوی
ابزار Codex زیر namespace مربوط به `openclaw` در دسترس هستند. این کار context
اولیه مدل را کوچک‌تر نگه می‌دارد. `sessions_yield` و پاسخ‌های source فقط برای
message-tool مستقیم می‌مانند، چون این‌ها contractهای کنترل turn هستند.
`sessions_spawn` به‌صورت searchable باقی می‌ماند تا `spawn_agent` بومی Codex
سطح اصلی subagent در Codex بماند، درحالی‌که delegation صریح OpenClaw یا ACP
همچنان از طریق namespace ابزار dynamic مربوط به `openclaw` در دسترس است.

فقط وقتی به یک سرور برنامه Codex سفارشی متصل می‌شوید که نمی‌تواند ابزارهای
dynamic deferred را جست‌وجو کند، یا هنگام debugging payload کامل ابزار، مقدار
`codexDynamicToolsLoading: "direct"` را تنظیم کنید.

## Timeoutها

فراخوانی‌های ابزار dynamic متعلق به OpenClaw مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند. هر درخواست `item/tool/call` در Codex
نخستین timeout موجود را به این ترتیب استفاده می‌کند:

- آرگومان مثبت per-call به نام `timeoutMs`.
- برای `image_generate`، مقدار `agents.defaults.imageGenerationModel.timeoutMs`.
- برای `image_generate` بدون timeout پیکربندی‌شده، پیش‌فرض 120 ثانیه‌ای
  تولید تصویر.
- برای ابزار درک رسانه‌ای `image`، مقدار `tools.media.image.timeoutSeconds`
  تبدیل‌شده به میلی‌ثانیه، یا پیش‌فرض 60 ثانیه‌ای media. برای درک تصویر، این
  مورد روی خود درخواست اعمال می‌شود و با کارهای آماده‌سازی قبلی کاهش نمی‌یابد.
- پیش‌فرض 90 ثانیه‌ای ابزار dynamic.

این watchdog بودجه بیرونی dynamic `item/tool/call` است. timeoutهای درخواست
مختص provider درون آن call اجرا می‌شوند و semantics timeout خودشان را نگه
می‌دارند. بودجه‌های ابزار dynamic حداکثر 600000 ms هستند. هنگام timeout،
OpenClaw در موارد پشتیبانی‌شده signal ابزار را abort می‌کند و یک پاسخ
dynamic-tool شکست‌خورده به Codex برمی‌گرداند تا turn بتواند به‌جای باقی‌گذاشتن
نشست در `processing` ادامه پیدا کند.

پس از آن‌که Codex یک turn را پذیرفت، و پس از آن‌که OpenClaw به یک درخواست
سرور برنامه محدود به turn پاسخ داد، harness انتظار دارد Codex در turn فعلی
پیشرفت کند و در نهایت turn بومی را با `turn/completed` به پایان برساند. اگر
سرور برنامه به مدت `appServer.turnCompletionIdleTimeoutMs` ساکت بماند،
OpenClaw به‌صورت best-effort turn مربوط به Codex را interrupt می‌کند، یک
timeout تشخیصی ثبت می‌کند، و lane نشست OpenClaw را آزاد می‌کند تا پیام‌های chat
بعدی پشت یک turn بومی stale در queue نمانند.

بیشتر اعلان‌های غیرپایانی برای همان نوبت، آن watchdog کوتاه را غیرفعال می‌کنند
چون Codex ثابت کرده است که نوبت هنوز زنده است. واگذاری‌های ابزار از بودجه بیکاری
پس از ابزار طولانی‌تری استفاده می‌کنند: پس از اینکه OpenClaw یک پاسخ `item/tool/call` برمی‌گرداند، پس از
کامل شدن آیتم‌های ابزار بومی مانند `commandExecution`، پس از تکمیل‌های خام
`custom_tool_call_output`، و پس از پیشرفت خام دستیار پس از ابزار،
تکمیل‌های خام reasoning، یا پیشرفت reasoning. این محافظ، وقتی پیکربندی شده باشد، از
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` استفاده می‌کند و
در غیر این صورت به‌طور پیش‌فرض پنج دقیقه است. همین بودجه پس از ابزار همچنین
watchdog پیشرفت را برای پنجره سنتز بی‌صدا پیش از اینکه Codex رویداد بعدی
نوبت جاری را منتشر کند، گسترش می‌دهد. تکمیل‌های reasoning، تکمیل‌های
`agentMessage` در commentary، و پیشرفت خام reasoning یا دستیار پیش از ابزار می‌توانند
با یک پاسخ نهایی خودکار دنبال شوند، بنابراین به‌جای آزاد کردن فوری مسیر نشست،
از محافظ پاسخ پس از پیشرفت استفاده می‌کنند. فقط آیتم‌های `agentMessage`
تکمیل‌شده نهایی/غیر-commentary و تکمیل‌های خام دستیار پیش از ابزار،
آزادسازی خروجی دستیار را مسلح می‌کنند: اگر Codex سپس بدون
`turn/completed` ساکت شود، OpenClaw به‌صورت بهترین تلاش، نوبت بومی را قطع
و مسیر نشست را آزاد می‌کند. شکست‌های app-server مبتنی بر stdio که برای replay ایمن هستند، از جمله
timeoutهای بیکاری تکمیل نوبت بدون شواهد دستیار، ابزار، آیتم فعال، یا
اثر جانبی، یک‌بار در یک تلاش تازه app-server تکرار می‌شوند. timeoutهای ناایمن
همچنان کلاینت app-server گیرکرده را بازنشسته می‌کنند و مسیر نشست OpenClaw
را آزاد می‌کنند. آن‌ها همچنین به‌جای replay خودکار، binding کهنه thread بومی را
پاک می‌کنند. timeoutهای پایش تکمیل، متن timeout اختصاصی Codex را نشان می‌دهند:
موارد ایمن برای replay می‌گویند پاسخ ممکن است ناقص باشد، در حالی که موارد ناایمن
به کاربر می‌گویند پیش از تلاش دوباره، وضعیت فعلی را بررسی کند. تشخیص‌های عمومی timeout
شامل فیلدهای ساختاری مانند آخرین متد اعلان app-server،
شناسه/نوع/نقش آیتم پاسخ خام دستیار، شمار درخواست/آیتم فعال، و وضعیت مسلح‌شده
watch هستند. وقتی آخرین اعلان یک آیتم پاسخ خام دستیار باشد، آن‌ها
یک پیش‌نمایش محدود از متن دستیار را نیز شامل می‌شوند. آن‌ها prompt خام یا
محتوای ابزار را شامل نمی‌شوند.

## کشف مدل

به‌طور پیش‌فرض، Plugin مربوط به Codex از app-server مدل‌های موجود را می‌پرسد. دسترس‌پذیری مدل
در مالکیت Codex app-server است، بنابراین این فهرست می‌تواند وقتی OpenClaw
نسخه بسته‌بندی‌شده `@openai/codex` را ارتقا می‌دهد یا وقتی یک استقرار
`appServer.command` را به یک binary متفاوت Codex اشاره می‌دهد، تغییر کند. دسترس‌پذیری می‌تواند
محدود به حساب نیز باشد. برای دیدن catalog زنده
برای آن harness و حساب، روی یک gateway در حال اجرا از `/codex models` استفاده کنید.

اگر کشف شکست بخورد یا timeout شود، OpenClaw از یک catalog fallback بسته‌بندی‌شده برای موارد زیر استفاده می‌کند:

- GPT-5.5
- GPT-5.4 mini

harness بسته‌بندی‌شده فعلی `@openai/codex` `0.142.4` است. یک probe از نوع `model/list`
در برابر آن app-server بسته‌بندی‌شده در یک workspace فعال‌شده برای GPT-5.6 این
ردیف‌های picker عمومی را برگرداند:

| شناسه مدل              | modalityهای ورودی | تلاش‌های reasoning                    |
| --------------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`         | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image      | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image      | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text             | low, medium, high, xhigh             |

دسترسی GPT-5.6 در طول پیش‌نمایش محدود، محدود به حساب است. `max` یک
تلاش reasoning مدل است. `ultra` فراداده جداگانه ارکستراسیون چندعاملی Codex است،
نه یک تلاش reasoning استاندارد OpenAI.

مدل‌های پنهان می‌توانند برای جریان‌های داخلی یا تخصصی توسط catalog مربوط به app-server
برگردانده شوند، اما انتخاب‌های عادی model-picker نیستند.

کشف را زیر `plugins.entries.codex.config.discovery` تنظیم کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

وقتی می‌خواهید startup از probe کردن Codex خودداری کند و فقط از
catalog fallback استفاده کند، کشف را غیرفعال کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## فایل‌های bootstrap workspace

Codex خودش `AGENTS.md` را از طریق کشف بومی مستندات پروژه مدیریت می‌کند. OpenClaw
فایل‌های synthetic مستندات پروژه Codex را نمی‌نویسد یا به نام فایل‌های fallback
Codex برای فایل‌های persona وابسته نیست، چون fallbackهای Codex فقط زمانی اعمال می‌شوند که
`AGENTS.md` وجود نداشته باشد.

برای برابری workspace در OpenClaw، harness مربوط به Codex دیگر فایل‌های bootstrap
را resolve می‌کند. `SOUL.md`، `IDENTITY.md`، `TOOLS.md`، و `USER.md` به‌عنوان
دستورالعمل‌های توسعه‌دهنده OpenClaw Codex ارسال می‌شوند، چون عامل فعال،
راهنمای workspace موجود، و پروفایل کاربر را تعریف می‌کنند. فهرست فشرده Skills
در OpenClaw به‌عنوان دستورالعمل‌های توسعه‌دهنده همکاری محدود به نوبت ارسال می‌شود.
محتوای `HEARTBEAT.md` inject نمی‌شود؛ نوبت‌های heartbeat یک اشاره‌گر حالت همکاری
برای خواندن فایل دریافت می‌کنند، وقتی فایل وجود داشته باشد و خالی نباشد. محتوای `MEMORY.md`
از workspace پیکربندی‌شده عامل، وقتی ابزارهای memory برای آن workspace موجود باشند،
در ورودی نوبت بومی Codex paste نمی‌شود؛ وقتی وجود داشته باشد، harness
یک اشاره‌گر کوچک workspace-memory به دستورالعمل‌های توسعه‌دهنده همکاری محدود به نوبت
اضافه می‌کند و Codex باید وقتی memory پایدار مرتبط است از `memory_search` یا
`memory_get` استفاده کند. اگر ابزارها غیرفعال باشند، جستجوی memory در دسترس نباشد، یا
workspace فعال با workspace حافظه عامل تفاوت داشته باشد، `MEMORY.md` از
مسیر عادی محدودشده turn-context استفاده می‌کند.
`BOOTSTRAP.md` وقتی وجود داشته باشد، به‌عنوان context مرجع ورودی نوبت OpenClaw
ارسال می‌شود.

## overrideهای محیط

overrideهای محیط برای آزمایش محلی همچنان در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم نشده باشد، `OPENCLAW_CODEX_APP_SERVER_BIN`
binary مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا
برای آزمایش محلی موردی از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. Config برای
استقرارهای تکرارپذیر ترجیح دارد، چون رفتار Plugin را در همان فایل بازبینی‌شده‌ای
نگه می‌دارد که بقیه setup مربوط به harness Codex در آن قرار دارد.

## مرتبط

- [harness مربوط به Codex](/fa/plugins/codex-harness)
- [runtime مربوط به harness Codex](/fa/plugins/codex-harness-runtime)
- [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)
- [Codex Computer Use](/fa/plugins/codex-computer-use)
- [provider مربوط به OpenAI](/fa/providers/openai)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)

---
read_when:
    - به همهٔ فیلدهای پیکربندی هارنس Codex نیاز دارید
    - شما در حال تغییر رفتار انتقال، احراز هویت، کشف یا مهلت زمانی app-server هستید
    - شما در حال اشکال‌زدایی راه‌اندازی هارنس Codex، کشف مدل یا جداسازی محیط هستید.
summary: مرجع پیکربندی، احراز هویت، کشف، و سرور برنامه برای هارنس Codex
title: مرجع مهار Codex
x-i18n:
    generated_at: "2026-06-27T18:11:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

این مرجع پیکربندی دقیق Plugin همراه `codex` را پوشش می‌دهد. برای راه‌اندازی و تصمیم‌های مسیریابی، از
[هارنس Codex](/fa/plugins/codex-harness) شروع کنید.

## سطح پیکربندی Plugin

همه تنظیمات هارنس Codex زیر `plugins.entries.codex.config` قرار دارند.

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

| فیلد                       | پیش‌فرض                 | معنا                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | فعال                     | تنظیمات کشف مدل برای `model/list` در app-server کدکس.                                                                                    |
| `appServer`                | app-server مدیریت‌شده stdio | تنظیمات انتقال، فرمان، احراز هویت، تأیید، sandbox، و timeout.                                                                            |
| `codexDynamicToolsLoading` | `"searchable"`           | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw مستقیماً در زمینه ابزار اولیه Codex قرار بگیرند.                                  |
| `codexDynamicToolsExclude` | `[]`                     | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های app-server کدکس حذف شوند.                                                     |
| `codexPlugins`             | غیرفعال                  | پشتیبانی بومی Plugin/app کدکس برای Pluginهای گزینشی منتقل‌شده که از سورس نصب شده‌اند. [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins) را ببینید. |
| `computerUse`              | غیرفعال                  | راه‌اندازی Codex Computer Use. [Codex Computer Use](/fa/plugins/codex-computer-use) را ببینید.                                              |

## انتقال app-server

به‌صورت پیش‌فرض، OpenClaw باینری مدیریت‌شده Codex را که همراه Plugin همراه ارائه می‌شود راه‌اندازی می‌کند:

```bash
codex app-server --listen stdio://
```

این کار نسخه app-server را به Plugin همراه `codex` وابسته نگه می‌دارد، نه به هر Codex CLI جداگانه‌ای که ممکن است به‌صورت محلی نصب شده باشد. فقط زمانی
`appServer.command` را تنظیم کنید که عمداً می‌خواهید یک فایل اجرایی متفاوت را اجرا کنید.

برای app-serverی که از قبل در حال اجراست، از انتقال WebSocket استفاده کنید:

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

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد                                         | پیش‌فرض                                                | معنا                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex را اجرا می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | باینری مدیریت‌شدهٔ Codex                                   | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده، آن را تنظیم‌نشده بگذارید.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌ها برای انتقال stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | تنظیم‌نشده                                                  | نشانی app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | تنظیم‌نشده                                                  | توکن Bearer برای انتقال WebSocket. یک رشتهٔ صریح یا SecretInput مانند `${CODEX_APP_SERVER_TOKEN}` را می‌پذیرد.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | سرآیندهای اضافی WebSocket. مقدارهای سرآیند، رشته‌های صریح یا مقدارهای SecretInput را می‌پذیرند، برای مثال `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw، از فرایند app-server اجراشدهٔ stdio حذف می‌شوند.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | تنظیم‌نشده                                                  | ریشهٔ فضای کاری app-server راه‌دور Codex. وقتی تنظیم شود، OpenClaw ریشهٔ فضای کاری محلی را از فضای کاری حل‌شدهٔ OpenClaw استنباط می‌کند، پسوند cwd فعلی را زیر این ریشهٔ راه‌دور حفظ می‌کند، و فقط cwd نهایی app-server را به Codex می‌فرستد. اگر cwd بیرون از ریشهٔ فضای کاری حل‌شدهٔ OpenClaw باشد، OpenClaw به‌جای فرستادن مسیر محلی Gateway به app-server راه‌دور، به‌صورت بسته شکست می‌خورد. |
| `requestTimeoutMs`                            | `60000`                                                | زمان‌پایان برای فراخوانی‌های سطح کنترل app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | پنجرهٔ سکوت پس از اینکه Codex یک نوبت را می‌پذیرد یا پس از یک درخواست app-server محدود به نوبت، در حالی که OpenClaw منتظر `turn/completed` می‌ماند.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | محافظ سکون تکمیل و پیشرفت که پس از واگذاری به ابزار، تکمیل ابزار بومی، پیشرفت دستیار خام پس از ابزار، تکمیل استدلال خام، یا پیشرفت استدلال استفاده می‌شود، در حالی که OpenClaw منتظر `turn/completed` می‌ماند. از این برای بارهای کاری مورد اعتماد یا سنگین استفاده کنید که در آن‌ها ترکیب پس از ابزار می‌تواند به‌طور مشروع بیشتر از بودجهٔ انتشار نهایی دستیار ساکت بماند.                                |
| `mode`                                        | `"yolo"` مگر اینکه الزامات Codex محلی YOLO را مجاز ندانند | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط نگهبان.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` یا یک سیاست تأیید مجاز نگهبان       | سیاست تأیید بومی Codex که به شروع رشته، ازسرگیری، و نوبت فرستاده می‌شود.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` یا یک sandbox مجاز نگهبان  | حالت sandbox بومی Codex که به شروع و ازسرگیری رشته فرستاده می‌شود. sandboxهای فعال OpenClaw نوبت‌های `danger-full-access` را به `workspace-write` در Codex محدود می‌کنند؛ پرچم شبکهٔ نوبت از خروجی sandbox در OpenClaw پیروی می‌کند.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` یا یک بازبین مجاز نگهبان               | از `"auto_review"` استفاده کنید تا Codex در صورت مجاز بودن، اعلان‌های تأیید بومی را بازبینی کند.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | دایرکتوری فرایند فعلی                              | فضای کاری استفاده‌شده توسط `/codex bind` وقتی `--cwd` حذف شده است.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | تنظیم‌نشده                                                  | ردهٔ سرویس اختیاری app-server در Codex. `"priority"` مسیریابی حالت سریع را فعال می‌کند، `"flex"` پردازش flex را درخواست می‌کند، و `null` بازنویسی را پاک می‌کند. مقدار قدیمی `"fast"` به‌صورت `"priority"` پذیرفته می‌شود.                                                                                                                                                                                                 |
| `networkProxy`                                | غیرفعال                                               | انتخاب داوطلبانهٔ شبکه‌سازی پروفایل مجوزهای Codex برای فرمان‌های app-server. OpenClaw پیکربندی `permissions.<profile>.network` انتخاب‌شده را تعریف می‌کند و آن را با `default_permissions` انتخاب می‌کند، به‌جای اینکه `sandbox` را بفرستد.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | انتخاب داوطلبانهٔ پیش‌نمایش که یک محیط Codex مبتنی بر sandbox OpenClaw را با app-server Codex نسخهٔ 0.132.0 یا جدیدتر ثبت می‌کند تا اجرای بومی Codex بتواند داخل sandbox فعال OpenClaw اجرا شود.                                                                                                                                                                                                         |

`appServer.networkProxy` صریح است چون قرارداد sandbox در Codex را تغییر می‌دهد.
وقتی فعال باشد، OpenClaw همچنین `features.network_proxy.enabled` و
`default_permissions` را در پیکربندی رشتهٔ Codex تنظیم می‌کند تا پروفایل مجوز
تولیدشده بتواند شبکه‌سازی مدیریت‌شدهٔ Codex را شروع کند. به‌طور پیش‌فرض، OpenClaw
یک نام پروفایل مقاوم در برابر برخورد به‌شکل `openclaw-network-<fingerprint>` را از
بدنهٔ پروفایل تولید می‌کند؛ فقط وقتی به یک نام محلی پایدار نیاز است از `profileName` استفاده کنید.

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

اگر زمان اجرای معمول app-server برابر `danger-full-access` باشد، فعال کردن
`networkProxy` برای پروفایل مجوز تولیدشده از دسترسی فایل‌سیستم به سبک workspace
استفاده می‌کند. اعمال شبکهٔ مدیریت‌شدهٔ Codex شبکه‌سازی sandboxشده است،
بنابراین یک پروفایل با دسترسی کامل از ترافیک خروجی محافظت نمی‌کند.

این Plugin دست‌دهی‌های app-server قدیمی‌تر یا بدون نسخه را مسدود می‌کند. app-server
Codex باید نسخهٔ پایدار `0.125.0` یا جدیدتر را گزارش کند.

OpenClaw نشانی‌های URL سرور برنامه WebSocket غیر از local loopback را راه‌دور تلقی می‌کند و
احراز هویت WebSocket دارای هویت را از طریق `appServer.authToken` یا یک
سرآیند `Authorization` الزامی می‌داند. `appServer.authToken` و هر مقدار
`appServer.headers.*` می‌تواند یک SecretInput باشد؛ runtime اسرار، SecretRefها و
میان‌برهای env را پیش از آنکه OpenClaw گزینه‌های شروع سرور برنامه را بسازد حل می‌کند، و
SecretRefهای ساختاریافته حل‌نشده پیش از ارسال هر توکن یا سرآیند شکست می‌خورند. وقتی Pluginهای
بومی Codex پیکربندی شده باشند، OpenClaw از صفحه کنترل Plugin در سرور برنامه متصل
برای نصب یا نوسازی آن Pluginها استفاده می‌کند و سپس موجودی برنامه را نوسازی می‌کند تا
برنامه‌های متعلق به Plugin برای رشته Codex قابل مشاهده باشند. `app/list` همچنان
منبع معتبر موجودی و فراداده است، اما سیاست OpenClaw تصمیم می‌گیرد که آیا
`thread/start` برای یک برنامه دردسترسِ فهرست‌شده، حتی اگر Codex در حال حاضر آن را غیرفعال
علامت‌گذاری کرده باشد، `config.apps[appId].enabled = true` را ارسال کند یا نه.
شناسه‌های برنامه ناشناخته یا مفقود همچنان در حالت خطا بسته می‌مانند؛ این مسیر فقط
Pluginهای marketplace را از طریق `plugin/install` فعال می‌کند و موجودی را نوسازی می‌کند.
OpenClaw را فقط به سرورهای برنامه راه‌دوری متصل کنید که برای پذیرش نصب‌های Plugin مدیریت‌شده
توسط OpenClaw و نوسازی موجودی برنامه مورد اعتماد هستند.

## حالت‌های تأیید و sandbox

نشست‌های سرور برنامه stdio محلی به‌طور پیش‌فرض در حالت YOLO هستند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. این وضعیت اپراتور محلیِ مورد اعتماد اجازه می‌دهد
نوبت‌ها و Heartbeatهای بی‌حضور OpenClaw بدون اعلان‌های تأیید بومی که کسی برای پاسخ‌دادن به آن‌ها
حاضر نیست پیش بروند.

اگر فایل الزامات سیستم محلی Codex مقدارهای ضمنی تأیید YOLO، بازبین، یا sandbox را مجاز نداند،
OpenClaw مقدار پیش‌فرض ضمنی را به‌جای آن guardian تلقی می‌کند و مجوزهای guardian مجاز را انتخاب
می‌کند. `tools.exec.mode: "auto"` نیز تأییدهای Codex بازبینی‌شده توسط guardian را اجباری می‌کند و
overrideهای ناامن قدیمی `approvalPolicy: "never"` یا `sandbox: "danger-full-access"` را حفظ
نمی‌کند؛ برای وضعیت عمدیِ بدون تأیید، `tools.exec.mode: "full"` را تنظیم کنید.
ورودی‌های
`[[remote_sandbox_config]]` منطبق با نام میزبان در همان فایل الزامات برای تصمیم پیش‌فرض
sandbox رعایت می‌شوند.

برای تأییدهای Codex بازبینی‌شده توسط guardian، `appServer.mode: "guardian"` را تنظیم کنید:

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

پیش‌تنظیم `guardian` وقتی این مقدارها مجاز باشند به `approvalPolicy: "on-request"`،
`approvalsReviewer: "auto_review"`، و `sandbox: "workspace-write"` گسترش می‌یابد.
فیلدهای سیاست جداگانه `mode` را override می‌کنند. مقدار بازبین قدیمی‌تر
`guardian_subagent` همچنان به‌عنوان نام مستعار سازگاری پذیرفته می‌شود، اما پیکربندی‌های جدید
باید از `auto_review` استفاده کنند.

وقتی یک sandbox در OpenClaw فعال باشد، فرایند سرور برنامه محلی Codex همچنان
روی میزبان Gateway اجرا می‌شود. بنابراین OpenClaw در آن نوبت، به‌جای اینکه
sandbox کردن سمت میزبان Codex را معادل backend sandbox OpenClaw تلقی کند،
Code Mode بومی Codex، سرورهای MCP کاربر، و اجرای Pluginهای مبتنی بر برنامه را غیرفعال می‌کند.
دسترسی shell از طریق ابزارهای پویای مبتنی بر sandbox OpenClaw مانند `sandbox_exec` و
`sandbox_process`، وقتی ابزارهای معمول exec/process در دسترس باشند، ارائه می‌شود.

روی میزبان‌های Ubuntu/AppArmor، وقتی عمداً `workspace-write` بومی Codex را بدون sandbox فعال
OpenClaw اجرا می‌کنید، bwrap در Codex می‌تواند پیش از شروع فرمان shell در حالت
`workspace-write` شکست بخورد. اگر
`bwrap: setting up uid map: Permission denied` یا
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` را دیدید،
`openclaw doctor` را اجرا کنید و به‌جای اعطای امتیازهای گسترده‌تر به کانتینر Docker،
سیاست namespace میزبان گزارش‌شده برای کاربر سرویس OpenClaw را اصلاح کنید. یک پروفایل
AppArmor محدود به فرایند سرویس را ترجیح دهید؛ fallback
`kernel.apparmor_restrict_unprivileged_userns=0` در سطح کل میزبان است و ملاحظات امنیتی دارد.

## اجرای بومی sandbox‌شده

پیش‌فرض پایدار، شکستِ بسته است: sandbox فعال OpenClaw سطح‌های اجرای بومی Codex را که در غیر
این صورت از میزبان سرور برنامه Codex اجرا می‌شدند، غیرفعال می‌کند. فقط وقتی می‌خواهید
پشتیبانی محیط راه‌دور Codex را با backend sandbox OpenClaw آزمایش کنید،
`appServer.experimental.sandboxExecServer: true` را استفاده کنید. این مسیر پیش‌نمایش به
سرور برنامه Codex نسخه 0.132.0 یا جدیدتر نیاز دارد.

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

وقتی این پرچم روشن باشد و نشست فعلی OpenClaw sandbox شده باشد، OpenClaw یک سرور exec
local loopback را که با sandbox فعال پشتیبانی می‌شود شروع می‌کند، آن را در سرور برنامه Codex
ثبت می‌کند، و رشته و نوبت Codex را با آن محیط متعلق به OpenClaw شروع می‌کند. اگر سرور برنامه
نتواند محیط را ثبت کند، اجرا به‌جای fallback بی‌صدا به اجرای میزبان، به‌صورت بسته شکست
می‌خورد.

این مسیر پیش‌نمایش فقط محلی است. یک سرور برنامه WebSocket راه‌دور نمی‌تواند به سرور exec
loopback دسترسی پیدا کند مگر اینکه روی همان میزبان اجرا شود، بنابراین OpenClaw این ترکیب را
رد می‌کند.

## احراز هویت و ایزوله‌سازی محیط

احراز هویت به این ترتیب انتخاب می‌شود:

1. یک پروفایل احراز هویت صریح OpenClaw Codex برای عامل.
2. حساب موجود سرور برنامه در خانه Codex همان عامل.
3. فقط برای راه‌اندازی‌های سرور برنامه stdio محلی، `CODEX_API_KEY` و سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب سرور برنامه‌ای وجود ندارد و احراز هویت OpenAI
   همچنان لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex از نوع اشتراک ChatGPT را ببیند،
`CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex ایجادشده حذف می‌کند. این کار
کلیدهای API در سطح Gateway را برای embeddings یا مدل‌های مستقیم OpenAI در دسترس نگه می‌دارد،
بدون اینکه نوبت‌های سرور برنامه بومی Codex به‌اشتباه از طریق API صورت‌حساب شوند.

پروفایل‌های صریح کلید API برای Codex و fallback کلید env در stdio محلی به‌جای env به‌ارث‌رسیده
فرایند فرزند، از ورود سرور برنامه استفاده می‌کنند. اتصال‌های سرور برنامه WebSocket،
fallback کلید API از env در Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا
حساب خودِ سرور برنامه راه‌دور استفاده کنید.

راه‌اندازی‌های سرور برنامه stdio به‌طور پیش‌فرض محیط فرایند OpenClaw را به ارث می‌برند.
OpenClaw پل حساب سرور برنامه Codex را مالکیت می‌کند و `CODEX_HOME` را به یک دایرکتوری
برای هر عامل زیر وضعیت OpenClaw همان عامل تنظیم می‌کند. این کار پیکربندی Codex، حساب‌ها،
داده/کش Plugin، و وضعیت رشته را به عامل OpenClaw محدود می‌کند، به‌جای اینکه از خانه شخصی
`~/.codex` اپراتور نشت کند.

OpenClaw برای راه‌اندازی‌های معمول سرور برنامه محلی، `HOME` را بازنویسی نمی‌کند. زیرفرایندهای
اجراشده توسط Codex مانند `openclaw`، `gh`، `git`، CLIهای ابری، و فرمان‌های shell خانه
معمول فرایند را می‌بینند و می‌توانند پیکربندی و توکن‌های خانه کاربر را پیدا کنند. Codex ممکن
است `$HOME/.agents/skills` و `$HOME/.agents/plugins/marketplace.json` را نیز کشف کند؛ این
کشف `.agents` عمداً با خانه اپراتور مشترک است و از وضعیت ایزوله‌شده `~/.codex` جداست.

Pluginهای OpenClaw و snapshotهای Skills در OpenClaw همچنان از registry Plugin و بارگذار Skills
خود OpenClaw عبور می‌کنند. دارایی‌های شخصی Codex در `~/.codex` این کار را نمی‌کنند. اگر Skills
یا Pluginهای مفید CLI در Codex از یک خانه Codex دارید که باید بخشی از یک عامل OpenClaw شوند،
آن‌ها را صریحاً فهرست‌برداری کنید:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

اگر یک استقرار به ایزوله‌سازی محیطی بیشتری نیاز دارد، آن متغیرها را به
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

`appServer.clearEnv` فقط بر فرایند فرزند سرور برنامه Codex ایجادشده اثر می‌گذارد.
OpenClaw هنگام نرمال‌سازی راه‌اندازی محلی، `CODEX_HOME` و `HOME` را از این فهرست حذف می‌کند:
`CODEX_HOME` برای هر عامل باقی می‌ماند، و `HOME` به‌صورت به‌ارث‌رسیده باقی می‌ماند تا
زیرفرایندها بتوانند از وضعیت معمول خانه کاربر استفاده کنند.

## ابزارهای پویا

ابزارهای پویای Codex به‌طور پیش‌فرض با بارگذاری `searchable` هستند. OpenClaw ابزارهای پویایی
را که عملیات فضای کار بومی Codex را تکرار می‌کنند در معرض قرار نمی‌دهد:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

بیشتر ابزارهای یکپارچه‌سازی باقی‌مانده OpenClaw، مانند پیام‌رسانی، رسانه، Cron،
مرورگر، گره‌ها، Gateway، `heartbeat_respond`، و `web_search`، از طریق جست‌وجوی ابزار Codex
زیر namespace `openclaw` در دسترس هستند. این کار context اولیه مدل را کوچک‌تر نگه می‌دارد.
`sessions_yield` و پاسخ‌های منبعیِ فقط برای ابزار پیام مستقیم باقی می‌مانند، چون این‌ها
قراردادهای کنترل نوبت هستند. `sessions_spawn` به‌صورت searchable باقی می‌ماند تا
`spawn_agent` بومی Codex سطح اصلی زیردستیار Codex باقی بماند، در حالی که واگذاری صریح
OpenClaw یا ACP همچنان از طریق namespace ابزار پویای `openclaw` در دسترس است.

`codexDynamicToolsLoading: "direct"` را فقط وقتی تنظیم کنید که به یک سرور برنامه سفارشی Codex
متصل می‌شوید که نمی‌تواند ابزارهای پویای deferred را جست‌وجو کند، یا وقتی payload کامل ابزار
را اشکال‌زدایی می‌کنید.

## مهلت‌های زمانی

فراخوانی‌های ابزار پویای متعلق به OpenClaw مستقل از `appServer.requestTimeoutMs` محدود می‌شوند.
هر درخواست `item/tool/call` در Codex نخستین مهلت زمانی موجود را به این ترتیب استفاده می‌کند:

- آرگومان مثبت `timeoutMs` برای هر فراخوانی.
- برای `image_generate`، مقدار `agents.defaults.imageGenerationModel.timeoutMs`.
- برای `image_generate` بدون مهلت زمانی پیکربندی‌شده، پیش‌فرض 120 ثانیه‌ای تولید تصویر.
- برای ابزار درک رسانه‌ای `image`، مقدار `tools.media.image.timeoutSeconds` تبدیل‌شده به
  میلی‌ثانیه، یا پیش‌فرض رسانه‌ای 60 ثانیه. برای درک تصویر، این مورد بر خود درخواست اعمال
  می‌شود و با کار آماده‌سازی پیشین کاهش نمی‌یابد.
- پیش‌فرض 90 ثانیه‌ای ابزار پویا.

این watchdog بودجه بیرونی `item/tool/call` پویا است. مهلت‌های زمانی درخواست مخصوص ارائه‌دهنده
درون همان فراخوانی اجرا می‌شوند و معناشناسی مهلت زمانی خود را حفظ می‌کنند. بودجه ابزارهای پویا
به 600000 ms محدود می‌شود. هنگام timeout، OpenClaw هرجا پشتیبانی شود سیگنال ابزار را abort
می‌کند و یک پاسخ ابزار پویای شکست‌خورده به Codex برمی‌گرداند تا نوبت بتواند ادامه پیدا کند،
به‌جای اینکه نشست در `processing` باقی بماند.

پس از اینکه Codex یک نوبت را می‌پذیرد، و پس از اینکه OpenClaw به یک درخواست سرور برنامه
محدود به نوبت پاسخ می‌دهد، harness انتظار دارد Codex در نوبت فعلی پیشرفت کند و در نهایت
نوبت بومی را با `turn/completed` تمام کند. اگر سرور برنامه به مدت
`appServer.turnCompletionIdleTimeoutMs` ساکت بماند، OpenClaw تا حد امکان نوبت Codex را
interrupt می‌کند، یک timeout تشخیصی ثبت می‌کند، و lane نشست OpenClaw را آزاد می‌کند تا
پیام‌های chat بعدی پشت یک نوبت بومی کهنه در صف نمانند.

بیشتر اعلان‌های غیرپایانی برای همان نوبت، آن نگهبان کوتاه را غیرفعال می‌کنند
زیرا Codex ثابت کرده است که نوبت هنوز زنده است. واگذاری‌های ابزار از بودجهٔ بیکاری
طولانی‌تری پس از ابزار استفاده می‌کنند: پس از آن‌که OpenClaw پاسخ `item/tool/call` را برمی‌گرداند، پس از
تکمیل آیتم‌های ابزار بومی مانند `commandExecution`، پس از تکمیل‌های خام
`custom_tool_call_output`، و پس از پیشرفت خام دستیار پس از ابزار،
تکمیل‌های خام reasoning، یا پیشرفت reasoning. این محافظ، در صورت پیکربندی،
از `appServer.postToolRawAssistantCompletionIdleTimeoutMs` استفاده می‌کند و
در غیر این صورت به‌طور پیش‌فرض پنج دقیقه است. همین بودجهٔ پس از ابزار، نگهبان
پیشرفت را نیز برای پنجرهٔ سنتز خاموش پیش از آن‌که Codex رویداد بعدی نوبت فعلی را
منتشر کند، تمدید می‌کند. تکمیل‌های reasoning، تکمیل‌های
`agentMessage` در commentary، و پیشرفت خام reasoning یا دستیار پیش از ابزار
می‌توانند با یک پاسخ نهایی خودکار دنبال شوند، بنابراین به‌جای آزاد کردن فوری مسیر نشست،
از محافظ پاسخ پس از پیشرفت استفاده می‌کنند. فقط آیتم‌های `agentMessage`
نهایی/غیر-commentary تکمیل‌شده و تکمیل‌های خام دستیار پیش از ابزار،
آزادسازی خروجی دستیار را مسلح می‌کنند: اگر Codex سپس بدون
`turn/completed` خاموش بماند، OpenClaw به‌شکل بهترین تلاش نوبت بومی را interrupt می‌کند و
مسیر نشست را آزاد می‌کند. خرابی‌های app-server روی stdio که برای بازپخش امن هستند، از جمله
مهلت‌های بیکاری تکمیل نوبت بدون شواهد دستیار، ابزار، آیتم فعال، یا
اثر جانبی، یک‌بار روی یک تلاش تازهٔ app-server دوباره امتحان می‌شوند. مهلت‌های ناامن
همچنان کلاینت app-server گیرکرده را بازنشسته می‌کنند و مسیر نشست OpenClaw را
آزاد می‌کنند. آن‌ها همچنین به‌جای بازپخش خودکار، اتصال رشتهٔ بومی کهنه را پاک می‌کنند.
مهلت‌های پایش تکمیل، متن timeout مخصوص Codex را نشان می‌دهند: موارد امن برای بازپخش
می‌گویند پاسخ ممکن است ناقص باشد، در حالی که موارد ناامن
به کاربر می‌گویند پیش از تلاش دوباره وضعیت فعلی را بررسی کند. عیب‌یابی‌های عمومی timeout
شامل فیلدهای ساختاری مانند آخرین متد اعلان app-server،
شناسه/نوع/نقش آیتم پاسخ خام دستیار، شمار درخواست/آیتم فعال، و وضعیت watch مسلح‌شده هستند.
وقتی آخرین اعلان یک آیتم پاسخ خام دستیار باشد، یک پیش‌نمایش محدود از متن دستیار را نیز
شامل می‌شوند. آن‌ها prompt خام یا محتوای ابزار را شامل نمی‌شوند.

## کشف مدل

به‌طور پیش‌فرض، Plugin مربوط به Codex از app-server مدل‌های موجود را می‌پرسد. مالکیت
دسترس‌پذیری مدل با app-server مربوط به Codex است، بنابراین وقتی OpenClaw
نسخهٔ بسته‌بندی‌شدهٔ `@openai/codex` را ارتقا می‌دهد یا وقتی یک استقرار
`appServer.command` را به یک باینری متفاوت Codex اشاره می‌دهد، فهرست می‌تواند تغییر کند.
دسترس‌پذیری همچنین می‌تواند وابسته به حساب باشد. برای دیدن کاتالوگ زنده
برای آن harness و حساب، روی یک Gateway در حال اجرا از `/codex models` استفاده کنید.

اگر کشف ناموفق شود یا timeout بخورد، OpenClaw برای موارد زیر از یک کاتالوگ fallback
بسته‌بندی‌شده استفاده می‌کند:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

harness بسته‌بندی‌شدهٔ فعلی `@openai/codex` نسخهٔ `0.139.0` است. یک probe از نوع `model/list`
در برابر آن app-server بسته‌بندی‌شده این نتیجه را برگرداند:

| شناسهٔ مدل        | پیش‌فرض | پنهان | شیوه‌های ورودی | سطح‌های تلاش reasoning        |
| --------------- | ------- | ------ | ---------------- | ------------------------ |
| `gpt-5.5`       | بله     | خیر     | متن، تصویر      | کم، متوسط، زیاد، خیلی زیاد |
| `gpt-5.4`       | خیر      | خیر     | متن، تصویر      | کم، متوسط، زیاد، خیلی زیاد |
| `gpt-5.4-mini`  | خیر      | خیر     | متن، تصویر      | کم، متوسط، زیاد، خیلی زیاد |
| `gpt-5.3-codex` | خیر      | خیر     | متن، تصویر      | کم، متوسط، زیاد، خیلی زیاد |
| `gpt-5.2`       | خیر      | خیر     | متن، تصویر      | کم، متوسط، زیاد، خیلی زیاد |

مدل‌های پنهان می‌توانند برای جریان‌های داخلی یا تخصصی توسط کاتالوگ app-server
برگردانده شوند، اما انتخاب‌های عادی انتخابگر مدل نیستند.

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

وقتی می‌خواهید startup از probe کردن Codex پرهیز کند و فقط از کاتالوگ fallback
استفاده کند، کشف را غیرفعال کنید:

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

## فایل‌های bootstrap فضای کاری

Codex خودش `AGENTS.md` را از طریق کشف بومی مستندات پروژه مدیریت می‌کند. OpenClaw
فایل‌های مصنوعی مستندات پروژهٔ Codex را نمی‌نویسد یا به نام‌های فایل fallback مربوط به Codex
برای فایل‌های persona وابسته نیست، زیرا fallbackهای Codex فقط وقتی اعمال می‌شوند که
`AGENTS.md` وجود نداشته باشد.

برای برابری فضای کاری OpenClaw، harness مربوط به Codex فایل‌های bootstrap دیگر را
resolve می‌کند. `SOUL.md`، `IDENTITY.md`، `TOOLS.md`، و `USER.md` به‌عنوان
دستورالعمل‌های توسعه‌دهندهٔ OpenClaw Codex forward می‌شوند، زیرا agent فعال،
راهنمای فضای کاری موجود، و پروفایل کاربر را تعریف می‌کنند. فهرست فشردهٔ Skills در OpenClaw
به‌عنوان دستورالعمل‌های توسعه‌دهندهٔ همکاریِ scoped به نوبت forward می‌شود.
محتوای `HEARTBEAT.md` تزریق نمی‌شود؛ نوبت‌های heartbeat یک اشاره‌گر حالت همکاری
برای خواندن فایل در صورت وجود و غیرخالی بودن دریافت می‌کنند. محتوای `MEMORY.md`
از فضای کاری agent پیکربندی‌شده، وقتی ابزارهای حافظه برای آن فضای کاری در دسترس باشند،
در ورودی نوبت بومی Codex paste نمی‌شود؛ وقتی وجود داشته باشد، harness
یک اشاره‌گر کوچک حافظهٔ فضای کاری را به دستورالعمل‌های توسعه‌دهندهٔ همکاری scoped به نوبت
اضافه می‌کند و Codex باید وقتی حافظهٔ ماندگار مرتبط است از `memory_search` یا `memory_get`
استفاده کند. اگر ابزارها غیرفعال باشند، جست‌وجوی حافظه در دسترس نباشد، یا
فضای کاری فعال با فضای کاری حافظهٔ agent متفاوت باشد، `MEMORY.md` از مسیر عادی
زمینهٔ نوبت محدود استفاده می‌کند.
`BOOTSTRAP.md` در صورت وجود به‌عنوان زمینهٔ مرجع ورودی نوبت OpenClaw forward می‌شود.

## بازنویسی‌های محیط

بازنویسی‌های محیط برای تست محلی همچنان در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم نشده باشد، `OPENCLAW_CODEX_APP_SERVER_BIN`
باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"`، یا برای تست محلی موردی از
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. Config برای استقرارهای تکرارپذیر
ترجیح داده می‌شود، زیرا رفتار Plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد که
بقیهٔ setup مربوط به harness Codex در آن قرار دارد.

## مرتبط

- [harness مربوط به Codex](/fa/plugins/codex-harness)
- [runtime مربوط به harness Codex](/fa/plugins/codex-harness-runtime)
- [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)
- [Codex Computer Use](/fa/plugins/codex-computer-use)
- [ارائه‌دهندهٔ OpenAI](/fa/providers/openai)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)

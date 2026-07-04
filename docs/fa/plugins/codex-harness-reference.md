---
read_when:
    - به همه فیلدهای پیکربندی هارنس Codex نیاز دارید
    - شما در حال تغییر رفتار انتقال، احراز هویت، کشف، یا مهلت زمانی app-server هستید
    - شما در حال اشکال‌زدایی راه‌اندازی harness کدکس، کشف مدل، یا ایزوله‌سازی محیط هستید
summary: مرجع پیکربندی، احراز هویت، کشف، و سرور برنامه برای چارچوب Codex
title: مرجع هارنس Codex
x-i18n:
    generated_at: "2026-07-04T10:53:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

این مرجع پیکربندی دقیق Plugin همراه `codex` را پوشش می‌دهد.
برای راه‌اندازی و تصمیم‌های مسیریابی، از
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

| فیلد                       | پیش‌فرض                  | معنا                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | فعال                     | تنظیمات کشف مدل برای `model/list` در app-server Codex.                                                                                   |
| `appServer`                | app-server مدیریت‌شده stdio | تنظیمات انتقال، فرمان، احراز هویت، تأیید، sandbox و timeout.                                                                              |
| `codexDynamicToolsLoading` | `"searchable"`           | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw مستقیماً در زمینه اولیه ابزار Codex قرار بگیرند.                                   |
| `codexDynamicToolsExclude` | `[]`                     | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های app-server Codex حذف شوند.                                                     |
| `codexPlugins`             | غیرفعال                  | پشتیبانی بومی Codex از Plugin/app برای Pluginهای curated نصب‌شده از منبع و مهاجرت‌شده. [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins) را ببینید. |
| `computerUse`              | غیرفعال                  | راه‌اندازی Codex Computer Use. [Codex Computer Use](/fa/plugins/codex-computer-use) را ببینید.                                               |

## انتقال app-server

به‌طور پیش‌فرض، OpenClaw باینری مدیریت‌شده Codex را که همراه Plugin
bundled ارائه شده اجرا می‌کند:

```bash
codex app-server --listen stdio://
```

این کار نسخه app-server را به Plugin همراه `codex` گره می‌زند، نه به هر
Codex CLI جداگانه‌ای که ممکن است به‌صورت محلی نصب شده باشد. فقط زمانی
`appServer.command` را تنظیم کنید که عمداً می‌خواهید یک فایل اجرایی متفاوت
را اجرا کنید.

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

| فیلد                                         | پیش‌فرض                                                | معنی                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"`، Codex را اجرا می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` وضعیت Codex را برای هر عامل OpenClaw جدا می‌کند. `"user"`، `$CODEX_HOME` بومی یا `~/.codex` را به اشتراک می‌گذارد، از احراز هویت بومی استفاده می‌کند و مدیریت رشته مخصوص مالک را فعال می‌کند. دامنه کاربر به stdio نیاز دارد.                                                                                                                                                                                               |
| `command`                                     | باینری Codex مدیریت‌شده                                   | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده، آن را تنظیم‌نشده بگذارید.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌های انتقال stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | تنظیم‌نشده                                                  | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | تنظیم‌نشده                                                  | توکن Bearer برای انتقال WebSocket. یک رشته لفظی یا SecretInput مانند `${CODEX_APP_SERVER_TOKEN}` را می‌پذیرد.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | سرآیندهای اضافی WebSocket. مقدارهای سرآیند، رشته‌های لفظی یا مقدارهای SecretInput را می‌پذیرند، برای مثال `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | نام‌های متغیر محیطی اضافی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw، از فرایند app-server ایجادشده stdio حذف می‌شوند.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | تنظیم‌نشده                                                  | ریشه فضای کاری app-server راه دور Codex. وقتی تنظیم شود، OpenClaw ریشه فضای کاری محلی را از فضای کاری حل‌شده OpenClaw استنباط می‌کند، پسوند cwd فعلی را زیر این ریشه راه دور حفظ می‌کند و فقط cwd نهایی app-server را به Codex می‌فرستد. اگر cwd بیرون از ریشه فضای کاری حل‌شده OpenClaw باشد، OpenClaw به‌جای ارسال یک مسیر محلی Gateway به app-server راه دور، به‌صورت بسته شکست می‌خورد. |
| `requestTimeoutMs`                            | `60000`                                                | مهلت زمانی برای فراخوانی‌های صفحه کنترل app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | بازه سکوت پس از پذیرش یک نوبت توسط Codex یا پس از یک درخواست app-server محدود به نوبت، در حالی که OpenClaw منتظر `turn/completed` می‌ماند.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | محافظ سکون تکمیل و پیشرفت که پس از تحویل به ابزار، تکمیل ابزار بومی، پیشرفت دستیار خام پس از ابزار، تکمیل استدلال خام، یا پیشرفت استدلال، در حالی که OpenClaw منتظر `turn/completed` می‌ماند، استفاده می‌شود. این را برای بارهای کاری قابل اعتماد یا سنگین به کار ببرید که ترکیب پس از ابزار در آن‌ها می‌تواند به‌طور موجه بیش از بودجه انتشار نهایی دستیار ساکت بماند.                                |
| `mode`                                        | `"yolo"` مگر اینکه الزامات محلی Codex اجازه YOLO ندهند | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط نگهبان.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` یا یک سیاست تأیید مجاز نگهبان       | سیاست تأیید بومی Codex که به شروع رشته، ازسرگیری و نوبت فرستاده می‌شود.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` یا یک sandbox مجاز نگهبان  | حالت sandbox بومی Codex که به شروع و ازسرگیری رشته فرستاده می‌شود. sandboxهای فعال OpenClaw، نوبت‌های `danger-full-access` را به `workspace-write` در Codex محدود می‌کنند؛ پرچم شبکه نوبت از خروجی sandbox در OpenClaw پیروی می‌کند.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` یا یک بازبین مجاز نگهبان               | از `"auto_review"` استفاده کنید تا Codex در صورت مجاز بودن، اعلان‌های تأیید بومی را بازبینی کند.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | دایرکتوری فرایند فعلی                              | فضای کاری استفاده‌شده توسط `/codex bind` وقتی `--cwd` حذف شده باشد.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | تنظیم‌نشده                                                  | رده سرویس اختیاری app-server در Codex. `"priority"` مسیریابی حالت سریع را فعال می‌کند، `"flex"` پردازش flex را درخواست می‌کند، و `null` بازنویسی را پاک می‌کند. مقدار قدیمی `"fast"` به‌عنوان `"priority"` پذیرفته می‌شود.                                                                                                                                                                                                 |
| `networkProxy`                                | غیرفعال                                               | استفاده اختیاری از شبکه‌سازی نمایه مجوزهای Codex برای فرمان‌های app-server. OpenClaw به‌جای ارسال `sandbox`، پیکربندی `permissions.<profile>.network` انتخاب‌شده را تعریف می‌کند و آن را با `default_permissions` انتخاب می‌کند.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | فعال‌سازی آزمایشی پیش‌نمایش که یک محیط Codex پشتیبانی‌شده با sandbox OpenClaw را در Codex app-server نسخه 0.132.0 یا جدیدتر ثبت می‌کند تا اجرای بومی Codex بتواند داخل sandbox فعال OpenClaw اجرا شود.                                                                                                                                                                                                         |

`appServer.networkProxy` صریح است، چون قرارداد sandbox در Codex را تغییر می‌دهد.
وقتی فعال باشد، OpenClaw همچنین `features.network_proxy.enabled` و
`default_permissions` را در پیکربندی رشته Codex تنظیم می‌کند تا نمایه مجوز
تولیدشده بتواند شبکه‌سازی مدیریت‌شده Codex را شروع کند. به‌طور پیش‌فرض، OpenClaw
یک نام نمایه مقاوم در برابر برخورد به‌شکل `openclaw-network-<fingerprint>` را از
بدنه نمایه تولید می‌کند؛ فقط وقتی به یک نام محلی پایدار نیاز است از `profileName` استفاده کنید.

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

اگر runtime عادی app-server برابر `danger-full-access` باشد، فعال‌سازی
`networkProxy` برای پروفایل مجوز تولیدشده از دسترسی filesystem به سبک workspace
استفاده می‌کند. اعمال شبکه‌ی مدیریت‌شده توسط Codex همان شبکه‌سازی sandboxed است،
بنابراین یک پروفایل full-access از ترافیک خروجی محافظت نمی‌کند.

Plugin دست‌دهی‌های قدیمی‌تر یا بدون نسخه‌ی app-server را مسدود می‌کند. app-server
در Codex باید نسخه‌ی پایدار `0.125.0` یا جدیدتر را گزارش کند.

OpenClaw نشانی‌های WebSocket app-server غیر loopback را remote تلقی می‌کند و
احراز هویت WebSocket دارای هویت را از طریق `appServer.authToken` یا یک header
به نام `Authorization` الزامی می‌کند. مقدار `appServer.authToken` و هر مقدار
`appServer.headers.*` می‌تواند یک SecretInput باشد؛ runtime اسرار، SecretRefها و
شکل کوتاه env را پیش از ساخت گزینه‌های شروع app-server توسط OpenClaw resolve
می‌کند، و SecretRefهای ساختاری resolveنشده پیش از ارسال هر token یا header شکست
می‌خورند. وقتی Pluginهای native Codex پیکربندی شده باشند، OpenClaw از control
plane Plugin مربوط به app-server متصل استفاده می‌کند تا آن Pluginها را نصب یا
refresh کند و سپس inventory برنامه را refresh می‌کند تا appهای متعلق به Plugin
برای thread مربوط به Codex قابل مشاهده باشند. `app/list` همچنان منبع معتبر
inventory و metadata است، اما policy OpenClaw تصمیم می‌گیرد که آیا `thread/start`
برای یک app قابل‌دسترسی و فهرست‌شده، `config.apps[appId].enabled = true` را
ارسال کند یا نه، حتی اگر Codex در حال حاضر آن را disabled علامت‌گذاری کرده باشد.
app idهای ناشناخته یا مفقود همچنان fail-closed می‌مانند؛ این مسیر فقط Pluginهای
marketplace را از طریق `plugin/install` فعال می‌کند و inventory را refresh می‌کند.
OpenClaw را فقط به app-serverهای remoteای وصل کنید که برای پذیرش نصب Plugin
مدیریت‌شده توسط OpenClaw و refresh شدن inventory app مورد اعتماد هستند.

## حالت‌های approval و sandbox

نشست‌های local stdio app-server به‌صورت پیش‌فرض در حالت YOLO هستند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. این وضعیت operator محلی مورد اعتماد اجازه می‌دهد
turnها و heartbeatهای بدون نظارت OpenClaw بدون promptهای approval native که کسی
برای پاسخ دادن به آن‌ها حاضر نیست، پیش بروند.

اگر فایل requirements سیستم local مربوط به Codex، approval، reviewer یا مقدارهای
sandbox ضمنی YOLO را مجاز نداند، OpenClaw default ضمنی را به‌جایش guardian تلقی
می‌کند و مجوزهای guardian مجاز را انتخاب می‌کند. `tools.exec.mode: "auto"` نیز
approvalهای Codex با review توسط guardian را اجباری می‌کند و overrideهای legacy
ناامن `approvalPolicy: "never"` یا `sandbox: "danger-full-access"` را حفظ نمی‌کند؛
برای وضعیت عمدی بدون approval، `tools.exec.mode: "full"` را تنظیم کنید. ورودی‌های
`[[remote_sandbox_config]]` که hostname را match می‌کنند و در همان فایل
requirements هستند، برای تصمیم default مربوط به sandbox رعایت می‌شوند.

برای approvalهای Codex با review توسط guardian، `appServer.mode: "guardian"` را
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

preset به نام `guardian` وقتی آن مقدارها مجاز باشند، به
`approvalPolicy: "on-request"`، `approvalsReviewer: "auto_review"`، و
`sandbox: "workspace-write"` گسترش می‌یابد. fieldهای policy تکی، `mode` را
override می‌کنند. مقدار reviewer قدیمی‌تر `guardian_subagent` همچنان به‌عنوان alias
سازگاری پذیرفته می‌شود، اما configهای جدید باید از `auto_review` استفاده کنند.

وقتی sandbox مربوط به OpenClaw فعال باشد، process محلی Codex app-server همچنان
روی host مربوط به Gateway اجرا می‌شود. بنابراین OpenClaw برای آن turn، Code Mode
native مربوط به Codex، serverهای MCP کاربر، و اجرای Plugin متکی بر app را غیرفعال
می‌کند، به‌جای اینکه sandboxing سمت host در Codex را معادل backend sandbox
OpenClaw تلقی کند. وقتی ابزارهای عادی exec/process در دسترس باشند، دسترسی shell
از طریق ابزارهای dynamic متکی بر sandbox OpenClaw مانند `sandbox_exec` و
`sandbox_process` عرضه می‌شود.

روی hostهای Ubuntu/AppArmor، وقتی عمدا `workspace-write` مربوط به native Codex را
بدون sandboxing فعال OpenClaw اجرا می‌کنید، bwrap مربوط به Codex می‌تواند پیش از
شروع command shell زیر `workspace-write` شکست بخورد. اگر
`bwrap: setting up uid map: Permission denied` یا
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` را دیدید،
`openclaw doctor` را اجرا کنید و policy مربوط به namespace میزبان گزارش‌شده برای
کاربر service مربوط به OpenClaw را اصلاح کنید، نه اینکه privilegeهای گسترده‌تری
به container Docker بدهید. یک پروفایل AppArmor scoped برای process service را
ترجیح دهید؛ fallback به `kernel.apparmor_restrict_unprivileged_userns=0` در سطح
کل host است و tradeoffهای امنیتی دارد.

## اجرای native در sandbox

default پایدار fail-closed است: sandboxing فعال OpenClaw سطوح اجرای native Codex
را که در غیر این صورت از host مربوط به Codex app-server اجرا می‌شدند، غیرفعال
می‌کند. فقط وقتی می‌خواهید پشتیبانی remote environment مربوط به Codex را با
backend sandbox OpenClaw امتحان کنید، از
`appServer.experimental.sandboxExecServer: true` استفاده کنید. این مسیر preview به
Codex app-server نسخه‌ی 0.132.0 یا جدیدتر نیاز دارد.

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

وقتی این flag روشن باشد و نشست فعلی OpenClaw sandboxed باشد، OpenClaw یک
exec-server local loopback را که متکی بر sandbox فعال است شروع می‌کند، آن را در
Codex app-server ثبت می‌کند، و thread و turn مربوط به Codex را با آن environment
متعلق به OpenClaw شروع می‌کند. اگر app-server نتواند environment را ثبت کند، run
به‌جای fallback بی‌صدا به اجرای host، fail closed می‌شود.

این مسیر preview فقط local است. یک WebSocket app-server remote نمی‌تواند به
exec-server loopback دسترسی پیدا کند مگر اینکه روی همان host اجرا شود، بنابراین
OpenClaw آن ترکیب را reject می‌کند.

## جداسازی auth و environment

در home پیش‌فرض per-agent، auth به این ترتیب انتخاب می‌شود:

1. یک پروفایل explicit OpenClaw Codex auth برای agent.
2. حساب موجود app-server در Codex home همان agent.
3. فقط برای اجرای local stdio app-server، ابتدا `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب app-server وجود ندارد و OpenAI auth هنوز لازم
   است.

وقتی OpenClaw یک پروفایل Codex auth به سبک subscription در ChatGPT می‌بیند،
`CODEX_API_KEY` و `OPENAI_API_KEY` را از process فرزند Codex که spawn شده حذف
می‌کند. این کار کلیدهای API در سطح Gateway را برای embeddings یا مدل‌های مستقیم
OpenAI در دسترس نگه می‌دارد، بدون اینکه turnهای native Codex app-server به‌اشتباه
از طریق API billing شوند.

پروفایل‌های explicit Codex API-key و fallback کلید env در local stdio به‌جای env
به‌ارث‌رسیده‌ی child-process، از login app-server استفاده می‌کنند. اتصال‌های
WebSocket app-server، fallback کلید API از env مربوط به Gateway را دریافت
نمی‌کنند؛ از یک پروفایل auth explicit یا حساب خود app-server remote استفاده کنید.

اجرای stdio app-server به‌صورت پیش‌فرض environment مربوط به process OpenClaw را
به ارث می‌برد. OpenClaw مالک پل حساب Codex app-server است و `CODEX_HOME` را به
یک directory per-agent زیر state مربوط به OpenClaw همان agent تنظیم می‌کند. این
کار config، حساب‌ها، cache/data مربوط به Plugin، و state مربوط به thread در Codex
را در محدوده‌ی agent OpenClaw نگه می‌دارد، به‌جای اینکه از home شخصی operator در
`~/.codex` نشت کند.

برای اشتراک‌گذاری state مربوط به native Codex با Codex Desktop و CLI،
`appServer.homeScope: "user"` را تنظیم کنید. این حالت فقط local-stdio، وقتی
`$CODEX_HOME` تنظیم شده باشد از آن و در غیر این صورت از `~/.codex` استفاده
می‌کند، از جمله native auth، config، Pluginها، و threadها. OpenClaw پل
auth-profile خود را برای app-server skip می‌کند. turnهای verified owner می‌توانند
از `codex_threads` برای فهرست کردن، search، read، fork، rename، archive، و restore
آن threadها استفاده کنند. پیش از ادامه دادن یک thread در OpenClaw، آن را fork
کنید؛ processهای مستقل Codex نویسنده‌های همزمان برای همان thread را هماهنگ
نمی‌کنند.

OpenClaw برای اجرای عادی local app-server، `HOME` را بازنویسی نمی‌کند.
subprocessهای اجراشده توسط Codex مانند `openclaw`، `gh`، `git`، CLIهای cloud، و
commandهای shell، home عادی process را می‌بینند و می‌توانند config و tokenهای
user-home را پیدا کنند. Codex ممکن است `$HOME/.agents/skills` و
`$HOME/.agents/plugins/marketplace.json` را نیز discover کند؛ آن discovery مربوط
به `.agents` عمدا با home مربوط به operator مشترک است و از state ایزوله‌ی
`~/.codex` جدا است.

در scope پیش‌فرض agent، Pluginهای OpenClaw و snapshotهای skill مربوط به OpenClaw
همچنان از registry Plugin و loader skill خود OpenClaw عبور می‌کنند؛ assetهای شخصی
Codex در `~/.codex` این‌طور نیستند. اگر Skills یا Pluginهای مفید Codex CLI از
یک Codex home دارید که باید بخشی از یک agent ایزوله‌ی OpenClaw شوند، آن‌ها را
explicitly inventory کنید:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

اگر یک deployment به جداسازی environment بیشتری نیاز دارد، آن variableها را به
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

`appServer.clearEnv` فقط روی process فرزند Codex app-server که spawn شده اثر
می‌گذارد. OpenClaw هنگام normalization اجرای local، `CODEX_HOME` و `HOME` را از
این فهرست حذف می‌کند: `CODEX_HOME` همچنان به scope انتخاب‌شده‌ی agent یا user
اشاره می‌کند، و `HOME` همچنان inherited می‌ماند تا subprocessها بتوانند از state
عادی user-home استفاده کنند.

## ابزارهای dynamic

ابزارهای dynamic مربوط به Codex به‌صورت پیش‌فرض از loading نوع `searchable`
استفاده می‌کنند. OpenClaw ابزارهای dynamicای را که عملیات workspace native در
Codex را duplicate می‌کنند expose نمی‌کند:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

بیشتر ابزارهای integration باقی‌مانده‌ی OpenClaw، مانند messaging، media، cron،
browser، nodes، gateway، `heartbeat_respond`، و `web_search` از طریق search ابزار
Codex زیر namespace به نام `openclaw` در دسترس هستند. این کار context اولیه‌ی
model را کوچک‌تر نگه می‌دارد. `sessions_yield` و replyهای source فقط برای
message-tool مستقیم می‌مانند، چون آن‌ها contractهای کنترل turn هستند.
`sessions_spawn` searchable می‌ماند تا `spawn_agent` native مربوط به Codex همچنان
سطح اصلی subagent در Codex باشد، در حالی که delegation explicit OpenClaw یا ACP
همچنان از طریق namespace ابزار dynamic به نام `openclaw` در دسترس است.

فقط وقتی به یک Codex app-server سفارشی وصل می‌شوید که نمی‌تواند ابزارهای dynamic
deferred را search کند، یا وقتی payload کامل ابزار را debug می‌کنید،
`codexDynamicToolsLoading: "direct"` را تنظیم کنید.

## Timeoutها

callهای ابزار dynamic متعلق به OpenClaw مستقل از `appServer.requestTimeoutMs`
bounded هستند. هر request مربوط به `item/tool/call` در Codex از نخستین timeout
در دسترس به این ترتیب استفاده می‌کند:

- آرگومان مثبت per-call به نام `timeoutMs`.
- برای `image_generate`، مقدار
  `agents.defaults.imageGenerationModel.timeoutMs`.
- برای `image_generate` بدون timeout پیکربندی‌شده، default تولید تصویر 120 ثانیه‌ای.
- برای ابزار `image` مربوط به media-understanding، مقدار
  `tools.media.image.timeoutSeconds` که به millisecond تبدیل شده، یا default
  رسانه‌ای 60 ثانیه‌ای. برای image understanding، این روی خود request اعمال
  می‌شود و با کار آماده‌سازی قبلی کاهش نمی‌یابد.
- default ابزار dynamic برابر 90 ثانیه.

این watchdog، budget بیرونی dynamic برای `item/tool/call` است. timeoutهای request
مختص provider داخل آن call اجرا می‌شوند و semantics مربوط به timeout خودشان را
حفظ می‌کنند. budgetهای ابزار dynamic حداکثر تا 600000 ms capped هستند. هنگام
timeout، OpenClaw در صورت پشتیبانی، signal ابزار را abort می‌کند و یک response
ابزار dynamic failed به Codex برمی‌گرداند تا turn بتواند ادامه پیدا کند، به‌جای
اینکه session در `processing` باقی بماند.

پس از اینکه Codex یک turn را پذیرفت، و پس از اینکه OpenClaw به یک request
app-server scoped به turn پاسخ داد، harness انتظار دارد Codex در turn فعلی
پیشرفت کند و در نهایت turn native را با `turn/completed` تمام کند. اگر app-server
به مدت `appServer.turnCompletionIdleTimeoutMs` ساکت بماند، OpenClaw با best-effort
turn مربوط به Codex را interrupt می‌کند، یک diagnostic timeout ثبت می‌کند، و lane
نشست OpenClaw را آزاد می‌کند تا پیام‌های chat بعدی پشت یک turn native stale در
queue نمانند.

بیشتر اعلان‌های غیرپایانی برای همان نوبت، آن ناظر کوتاه را غیرفعال می‌کنند
زیرا Codex ثابت کرده است که نوبت هنوز زنده است. واگذاری‌های ابزار از بودجه بیکاری طولانی‌تری
پس از ابزار استفاده می‌کنند: پس از اینکه OpenClaw یک پاسخ `item/tool/call` برمی‌گرداند، پس از
تکمیل آیتم‌های ابزار بومی مانند `commandExecution`، پس از تکمیل‌های خام
`custom_tool_call_output`، و پس از پیشرفت خام دستیار پس از ابزار،
تکمیل‌های خام استدلال، یا پیشرفت استدلال. این محافظ وقتی
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` پیکربندی شده باشد از آن استفاده می‌کند و
در غیر این صورت به‌طور پیش‌فرض پنج دقیقه است. همان بودجه پس از ابزار، ناظر
پیشرفت را نیز برای پنجره سنتز خاموش پیش از اینکه Codex رویداد بعدی
نوبت جاری را منتشر کند، تمدید می‌کند. تکمیل‌های استدلال، تکمیل‌های
`agentMessage` در commentary، و پیشرفت خام استدلال یا دستیار پیش از ابزار می‌توانند
با یک پاسخ نهایی خودکار دنبال شوند، بنابراین به‌جای آزاد کردن فوری مسیر نشست،
از محافظ پاسخ پس از پیشرفت استفاده می‌کنند. فقط آیتم‌های نهایی/غیر-commentary تکمیل‌شده
`agentMessage` و تکمیل‌های خام دستیار پیش از ابزار، آزادسازی خروجی دستیار را فعال می‌کنند:
اگر Codex سپس بدون `turn/completed` خاموش بماند، OpenClaw به‌صورت بهترین تلاش
نوبت بومی را قطع می‌کند و مسیر نشست را آزاد می‌کند. شکست‌های app-server stdio که برای بازپخش امن هستند،
از جمله وقفه‌های بیکاری تکمیل نوبت بدون شواهد دستیار، ابزار، آیتم فعال، یا
اثر جانبی، یک بار در یک تلاش تازه app-server دوباره امتحان می‌شوند. وقفه‌های ناامن
همچنان کلاینت app-server گیرکرده را بازنشسته می‌کنند و مسیر نشست OpenClaw
را آزاد می‌کنند. آن‌ها همچنین به‌جای اینکه به‌طور خودکار بازپخش شوند، اتصال نخ بومی
مانده را پاک می‌کنند. وقفه‌های پایش تکمیل، متن وقفه ویژه Codex را نشان می‌دهند:
موارد امن برای بازپخش می‌گویند پاسخ ممکن است ناقص باشد، در حالی که موارد ناامن
به کاربر می‌گویند پیش از تلاش دوباره، وضعیت فعلی را تأیید کند. عیب‌یابی‌های عمومی وقفه
شامل فیلدهای ساختاری مانند آخرین متد اعلان app-server،
شناسه/نوع/نقش آیتم پاسخ خام دستیار، شمارش‌های درخواست/آیتم فعال، و وضعیت
پایش فعال‌شده هستند. وقتی آخرین اعلان یک آیتم پاسخ خام دستیار باشد، آن‌ها
یک پیش‌نمایش محدود از متن دستیار را نیز شامل می‌شوند. آن‌ها شامل محتوای خام prompt یا
ابزار نمی‌شوند.

## کشف مدل

به‌طور پیش‌فرض، Plugin Codex از app-server مدل‌های در دسترس را درخواست می‌کند. در دسترس بودن مدل
در مالکیت app-server Codex است، بنابراین فهرست می‌تواند وقتی OpenClaw
نسخه همراه `@openai/codex` را ارتقا می‌دهد یا وقتی یک استقرار
`appServer.command` را به یک باینری متفاوت Codex اشاره می‌دهد، تغییر کند. در دسترس بودن همچنین می‌تواند
محدود به حساب باشد. از `/codex models` روی یک Gateway در حال اجرا استفاده کنید تا catalog زنده
برای آن harness و حساب را ببینید.

اگر کشف شکست بخورد یا دچار وقفه شود، OpenClaw از یک catalog پشتیبان همراه برای موارد زیر استفاده می‌کند:

- GPT-5.5
- GPT-5.4 mini

harness همراه فعلی `@openai/codex` نسخه `0.142.4` است. یک probe با `model/list`
علیه آن app-server همراه در یک workspace دارای GPT-5.6 این ردیف‌های عمومی انتخابگر
را برگرداند:

| شناسه مدل              | گونه‌های ورودی | تلاش‌های استدلال                    |
| --------------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`         | متن، تصویر      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | متن، تصویر      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | متن، تصویر      | low, medium, high, xhigh, max        |
| `gpt-5.5`             | متن، تصویر      | low, medium, high, xhigh             |
| `gpt-5.4`             | متن، تصویر      | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | متن، تصویر      | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | متن، تصویر      | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | متن             | low, medium, high, xhigh             |

دسترسی GPT-5.6 در دوره پیش‌نمایش محدود، محدود به حساب است. `max` یک
تلاش استدلال مدل است. `ultra` فراداده جداگانه ارکستراسیون چندعاملی Codex است،
نه یک تلاش استدلال استاندارد OpenAI.

مدل‌های پنهان ممکن است برای جریان‌های داخلی یا تخصصی توسط catalog app-server
برگردانده شوند، اما گزینه‌های عادی انتخابگر مدل نیستند.

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
catalog پشتیبان استفاده کند، کشف را غیرفعال کنید:

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
فایل‌های ساختگی مستندات پروژه Codex را نمی‌نویسد و به نام‌فایل‌های پشتیبان Codex
برای فایل‌های persona وابسته نیست، زیرا fallbackهای Codex فقط وقتی اعمال می‌شوند که
`AGENTS.md` وجود نداشته باشد.

برای برابری workspace در OpenClaw، harness Codex فایل‌های bootstrap دیگر را
resolve می‌کند. `SOUL.md`، `IDENTITY.md`، `TOOLS.md`، و `USER.md` به‌عنوان
دستورالعمل‌های توسعه‌دهنده OpenClaw Codex ارسال می‌شوند زیرا عامل فعال،
راهنمای workspace در دسترس، و پروفایل کاربر را تعریف می‌کنند. فهرست فشرده Skills در OpenClaw
به‌عنوان دستورالعمل‌های توسعه‌دهنده همکاری محدود به نوبت ارسال می‌شود.
محتوای `HEARTBEAT.md` تزریق نمی‌شود؛ نوبت‌های Heartbeat یک اشاره‌گر حالت همکاری
برای خواندن فایل، وقتی وجود دارد و خالی نیست، دریافت می‌کنند. محتوای `MEMORY.md`
از workspace عامل پیکربندی‌شده، وقتی ابزارهای حافظه برای آن workspace در دسترس باشند،
در ورودی نوبت بومی Codex چسبانده نمی‌شود؛ وقتی وجود دارد، harness
یک اشاره‌گر کوچک حافظه workspace را به دستورالعمل‌های توسعه‌دهنده همکاری محدود به نوبت
اضافه می‌کند و Codex باید وقتی حافظه پایدار مرتبط است از `memory_search` یا
`memory_get` استفاده کند. اگر ابزارها غیرفعال باشند، جستجوی حافظه در دسترس نباشد، یا
workspace فعال با workspace حافظه عامل متفاوت باشد، `MEMORY.md` از مسیر عادی
محدودشده زمینه نوبت استفاده می‌کند.
`BOOTSTRAP.md` وقتی وجود داشته باشد به‌عنوان زمینه مرجع ورودی نوبت OpenClaw ارسال می‌شود.

## بازنویسی‌های محیط

بازنویسی‌های محیط برای آزمون محلی همچنان در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم نشده باشد،
`OPENCLAW_CODEX_APP_SERVER_BIN` باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شد. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا
برای آزمون محلی یک‌باره از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. Config
برای استقرارهای تکرارپذیر ترجیح داده می‌شود زیرا رفتار Plugin را در همان
فایل بازبینی‌شده‌ای نگه می‌دارد که بقیه راه‌اندازی harness Codex در آن قرار دارد.

## مرتبط

- [harness Codex](/fa/plugins/codex-harness)
- [runtime harness Codex](/fa/plugins/codex-harness-runtime)
- [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)
- [استفاده رایانه‌ای Codex](/fa/plugins/codex-computer-use)
- [provider OpenAI](/fa/providers/openai)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)

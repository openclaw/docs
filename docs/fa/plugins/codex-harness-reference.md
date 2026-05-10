---
read_when:
    - به همه فیلدهای پیکربندی هارنس Codex نیاز دارید
    - شما در حال تغییر رفتار انتقال، احراز هویت، کشف، یا وقفهٔ زمانی app-server هستید
    - در حال اشکال‌زدایی راه‌اندازی هارنس Codex، کشف مدل، یا جداسازی محیط هستید
summary: مرجع پیکربندی، احراز هویت، کشف، و سرور برنامه برای هارنس Codex
title: مرجع چارچوب اجرای Codex
x-i18n:
    generated_at: "2026-05-10T19:52:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

این مرجع پیکربندی تفصیلی Plugin پکیج‌شده‌ی `codex` را پوشش می‌دهد. برای راه‌اندازی و تصمیم‌های مسیریابی، از
[هارنس Codex](/fa/plugins/codex-harness) شروع کنید.

## سطح پیکربندی Plugin

همه‌ی تنظیمات هارنس Codex زیر `plugins.entries.codex.config` قرار دارند.

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

| فیلد                       | پیش‌فرض                 | معنا                                                                                                                                     |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | فعال                     | تنظیمات کشف مدل برای `model/list` در app-server Codex.                                                                                   |
| `appServer`                | app-server مدیریت‌شده‌ی stdio | تنظیمات انتقال، فرمان، احراز هویت، تأیید، sandbox و مهلت زمانی.                                                                          |
| `codexDynamicToolsLoading` | `"searchable"`           | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw مستقیماً در زمینه‌ی ابزار اولیه‌ی Codex قرار بگیرند.                              |
| `codexDynamicToolsExclude` | `[]`                     | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های app-server Codex حذف شوند.                                                     |
| `codexPlugins`             | غیرفعال                  | پشتیبانی بومی Codex از Plugin/app برای Pluginهای curated نصب‌شده از منبع که مهاجرت داده شده‌اند. [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins) را ببینید. |
| `computerUse`              | غیرفعال                  | راه‌اندازی Codex Computer Use. [Codex Computer Use](/fa/plugins/codex-computer-use) را ببینید.                                               |

## انتقال app-server

به‌طور پیش‌فرض، OpenClaw باینری مدیریت‌شده‌ی Codex را که همراه Plugin پکیج‌شده ارائه شده است اجرا می‌کند:

```bash
codex app-server --listen stdio://
```

این کار نسخه‌ی app-server را به Plugin پکیج‌شده‌ی `codex` گره می‌زند، نه به هر Codex CLI جداگانه‌ای که ممکن است به‌صورت محلی نصب شده باشد. فقط زمانی `appServer.command` را تنظیم کنید که عمداً بخواهید یک فایل اجرایی متفاوت را اجرا کنید.

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

فیلدهای پشتیبانی‌شده‌ی `appServer`:

| فیلد                          | پیش‌فرض                                               | معنا                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` باعث اجرای Codex می‌شود؛ `"websocket"` به `url` متصل می‌شود.                                                                                                                      |
| `command`                     | باینری مدیریت‌شده‌ی Codex                              | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده، آن را تنظیم‌نشده بگذارید.                                                                                                  |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌های انتقال stdio.                                                                                                                                                                    |
| `url`                         | تنظیم‌نشده                                             | URL app-server مبتنی بر WebSocket.                                                                                                                                                           |
| `authToken`                   | تنظیم‌نشده                                             | توکن Bearer برای انتقال WebSocket.                                                                                                                                                           |
| `headers`                     | `{}`                                                   | هدرهای اضافی WebSocket.                                                                                                                                                                      |
| `clearEnv`                    | `[]`                                                   | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw، از فرایند app-server ایجادشده‌ی stdio حذف می‌شوند.                                                               |
| `requestTimeoutMs`            | `60000`                                                | مهلت زمانی برای فراخوانی‌های control-plane app-server.                                                                                                                                       |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | پنجره‌ی سکوت پس از یک درخواست app-server محدود به نوبت، در حالی که OpenClaw منتظر `turn/completed` می‌ماند.                                                                                  |
| `mode`                        | `"yolo"` مگر اینکه نیازمندی‌های محلی Codex اجازه‌ی YOLO ندهند | preset برای اجرای YOLO یا بررسی‌شده توسط guardian.                                                                                                                                           |
| `approvalPolicy`              | `"never"` یا یک سیاست تأیید مجاز guardian              | سیاست تأیید بومی Codex که به شروع رشته، ازسرگیری و نوبت ارسال می‌شود.                                                                                                                       |
| `sandbox`                     | `"danger-full-access"` یا یک sandbox مجاز guardian     | حالت sandbox بومی Codex که به شروع رشته و ازسرگیری ارسال می‌شود.                                                                                                                            |
| `approvalsReviewer`           | `"user"` یا یک بازبین مجاز guardian                    | از `"auto_review"` استفاده کنید تا Codex، وقتی مجاز است، promptهای تأیید بومی را بررسی کند.                                                                                                  |
| `defaultWorkspaceDir`         | دایرکتوری فرایند فعلی                                  | workspace استفاده‌شده توسط `/codex bind` وقتی `--cwd` حذف شده است.                                                                                                                          |
| `serviceTier`                 | تنظیم‌نشده                                             | سطح سرویس اختیاری app-server Codex. `"priority"` مسیریابی fast-mode را فعال می‌کند، `"flex"` پردازش flex را درخواست می‌کند، و `null` بازنویسی را پاک می‌کند. مقدار قدیمی `"fast"` به‌عنوان `"priority"` پذیرفته می‌شود. |

Plugin handshakeهای قدیمی‌تر یا بدون نسخه‌ی app-server را مسدود می‌کند. app-server Codex باید نسخه‌ی پایدار `0.125.0` یا جدیدتر را گزارش کند.

## حالت‌های تأیید و sandbox

نشست‌های app-server محلی stdio به‌طور پیش‌فرض از حالت YOLO استفاده می‌کنند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. این وضعیت اپراتور محلی مورد اعتماد اجازه می‌دهد نوبت‌های بدون حضور OpenClaw و Heartbeatها بدون promptهای تأیید بومی که کسی برای پاسخ‌دادن به آن‌ها حاضر نیست پیش بروند.

اگر فایل نیازمندی‌های سیستم محلی Codex اجازه‌ی مقدارهای ضمنی تأیید YOLO، بازبین، یا sandbox را ندهد، OpenClaw پیش‌فرض ضمنی را به‌جای آن guardian در نظر می‌گیرد و مجوزهای مجاز guardian را انتخاب می‌کند. ورودی‌های `[[remote_sandbox_config]]` منطبق با hostname در همان فایل نیازمندی‌ها برای تصمیم پیش‌فرض sandbox رعایت می‌شوند.

برای تأییدهای بررسی‌شده توسط guardian در Codex، `appServer.mode: "guardian"` را تنظیم کنید:

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

preset `guardian` وقتی این مقدارها مجاز باشند به `approvalPolicy: "on-request"`،
`approvalsReviewer: "auto_review"`، و `sandbox: "workspace-write"` گسترش می‌یابد. فیلدهای سیاست منفرد، `mode` را override می‌کنند. مقدار بازبین قدیمی‌تر `guardian_subagent` همچنان به‌عنوان alias سازگاری پذیرفته می‌شود، اما پیکربندی‌های جدید باید از `auto_review` استفاده کنند.

## احراز هویت و جداسازی محیط

احراز هویت به این ترتیب انتخاب می‌شود:

1. یک پروفایل احراز هویت صریح OpenClaw Codex برای عامل.
2. حساب موجود app-server در خانه‌ی Codex همان عامل.
3. فقط برای اجراهای app-server محلی stdio، `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب app-serverی وجود ندارد و احراز هویت OpenAI
   هنوز لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex به سبک اشتراک ChatGPT ببیند، `CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex ایجادشده حذف می‌کند. این کار کلیدهای API سطح Gateway را برای embeddings یا مدل‌های مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه نوبت‌های app-server بومی Codex به‌اشتباه از طریق API صورتحساب شوند.

پروفایل‌های صریح کلید API Codex و fallback کلید env محلی stdio به‌جای env ارث‌بری‌شده‌ی فرایند فرزند، از ورود app-server استفاده می‌کنند. اتصال‌های app-server مبتنی بر WebSocket، fallback کلید API env در Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب خود app-server راه‌دور استفاده کنید.

اجراهای app-server مبتنی بر stdio به‌طور پیش‌فرض محیط فرایند OpenClaw را به ارث می‌برند، اما OpenClaw مالک پل حساب app-server Codex است و هر دو `CODEX_HOME` و
`HOME` را به دایرکتوری‌های مختص هر عامل زیر state همان عامل در OpenClaw تنظیم می‌کند. لودر Skill خود Codex از `$CODEX_HOME/skills` و `$HOME/.agents/skills` می‌خواند، بنابراین هر دو مقدار برای اجراهای app-server محلی جدا می‌شوند. این کار Skills، Pluginها، پیکربندی، حساب‌ها و state رشته‌ی بومی Codex را محدود به عامل OpenClaw نگه می‌دارد، به‌جای اینکه از خانه‌ی شخصی Codex CLI اپراتور نشت کنند.

Pluginهای OpenClaw و snapshotهای Skill در OpenClaw همچنان از طریق رجیستری Plugin و لودر Skill خود OpenClaw جریان می‌یابند. دارایی‌های شخصی Codex CLI چنین کاری نمی‌کنند. اگر Skills یا Pluginهای مفیدی در Codex CLI دارید که باید بخشی از یک عامل OpenClaw شوند، آن‌ها را صریحاً فهرست‌برداری کنید:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

اگر یک استقرار به جداسازی محیطی اضافی نیاز دارد، آن متغیرها را به `appServer.clearEnv` اضافه کنید:

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

`appServer.clearEnv` فقط بر فرایند فرزند app-server Codex ایجادشده اثر می‌گذارد.
`CODEX_HOME` و `HOME` برای جداسازی Codex مختص هر عامل در OpenClaw هنگام اجراهای محلی رزرو می‌مانند.

## ابزارهای پویا

ابزارهای پویای Codex به‌طور پیش‌فرض با بارگذاری `searchable` انجام می‌شوند. OpenClaw ابزارهای پویایی را که عملیات workspace بومی Codex را تکرار می‌کنند در معرض قرار نمی‌دهد:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

ابزارهای باقی‌مانده یکپارچه‌سازی OpenClaw، مانند پیام‌رسانی، نشست‌ها، رسانه، Cron،
مرورگر، گره‌ها، Gateway، `heartbeat_respond` و `web_search`، از طریق
جست‌وجوی ابزار Codex در فضای نام `openclaw` در دسترس هستند. این کار بافت اولیه
مدل را کوچک‌تر نگه می‌دارد. `sessions_yield` و پاسخ‌های منبعِ فقط مبتنی بر ابزار پیام
مستقیم باقی می‌مانند، چون این‌ها قراردادهای کنترل نوبت هستند.

`codexDynamicToolsLoading: "direct"` را فقط زمانی تنظیم کنید که به یک سرور برنامه
Codex سفارشی متصل می‌شوید که نمی‌تواند ابزارهای پویای به‌تعویق‌افتاده را جست‌وجو کند،
یا زمانی که در حال اشکال‌زدایی بار کامل ابزار هستید.

## زمان‌انتظارها

فراخوانی‌های ابزار پویای متعلق به OpenClaw مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند. هر درخواست `item/tool/call` در Codex
نخستین زمان‌انتظار موجود را به این ترتیب استفاده می‌کند:

- آرگومان مثبت `timeoutMs` برای هر فراخوانی.
- برای `image_generate`، مقدار `agents.defaults.imageGenerationModel.timeoutMs`.
- برای ابزار `image` مربوط به درک رسانه، مقدار `tools.media.image.timeoutSeconds`
  که به میلی‌ثانیه تبدیل شده است، یا پیش‌فرض ۶۰ ثانیه‌ای رسانه.
- پیش‌فرض ۳۰ ثانیه‌ای ابزار پویا.

بودجه‌های ابزار پویا در 600000 میلی‌ثانیه سقف‌گذاری می‌شوند. هنگام زمان‌انتظار، OpenClaw
در صورت پشتیبانی سیگنال ابزار را لغو می‌کند و یک پاسخ ناموفق ابزار پویا به Codex
برمی‌گرداند تا نوبت بتواند ادامه پیدا کند، به‌جای اینکه نشست در حالت `processing` بماند.

پس از اینکه OpenClaw به یک درخواست سرور برنامه با دامنه نوبت از Codex پاسخ می‌دهد،
هارنس همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` تمام کند. اگر
سرور برنامه پس از آن پاسخ به مدت `appServer.turnCompletionIdleTimeoutMs` ساکت بماند،
OpenClaw به بهترین شکل ممکن نوبت Codex را قطع می‌کند، یک زمان‌انتظار تشخیصی ثبت می‌کند
و مسیر نشست OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی پشت یک نوبت بومی کهنه
در صف نمانند.

هر اعلان غیرپایانی برای همان نوبت، از جمله `rawResponseItem/completed`، آن نگهبان کوتاه را
غیرفعال می‌کند، چون Codex ثابت کرده است نوبت هنوز زنده است. نگهبان پایانی طولانی‌تر
همچنان از نوبت‌هایی که واقعاً گیر کرده‌اند محافظت می‌کند. تشخیص‌های زمان‌انتظار شامل
آخرین متد اعلان سرور برنامه و، برای آیتم‌های پاسخ خام دستیار، نوع آیتم، نقش،
شناسه، و یک پیش‌نمایش محدود از متن دستیار هستند.

## کشف مدل

به‌طور پیش‌فرض، Plugin مربوط به Codex از سرور برنامه مدل‌های موجود را درخواست می‌کند. در دسترس بودن
مدل‌ها در مالکیت سرور برنامه Codex است، بنابراین وقتی OpenClaw نسخه همراه
`@openai/codex` را ارتقا می‌دهد یا وقتی یک استقرار `appServer.command` را به یک باینری
Codex متفاوت اشاره می‌دهد، فهرست می‌تواند تغییر کند. دسترسی همچنین می‌تواند وابسته به حساب باشد.
برای دیدن کاتالوگ زنده آن هارنس و حساب، روی یک gateway در حال اجرا از `/codex models`
استفاده کنید.

اگر کشف ناموفق شود یا به زمان‌انتظار برسد، OpenClaw از یک کاتالوگ جایگزین همراه استفاده می‌کند برای:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

هارنس همراه فعلی `@openai/codex` `0.130.0` است. یک پروب `model/list`
در برابر آن سرور برنامه همراه این نتیجه را برگرداند:

| شناسه مدل             | پیش‌فرض | پنهان | حالت‌های ورودی | تلاش‌های استدلال        |
| --------------------- | ------- | ------ | ---------------- | ------------------------ |
| `gpt-5.5`             | بله     | خیر    | متن، تصویر      | low, medium, high, xhigh |
| `gpt-5.4`             | خیر     | خیر    | متن، تصویر      | low, medium, high, xhigh |
| `gpt-5.4-mini`        | خیر     | خیر    | متن، تصویر      | low, medium, high, xhigh |
| `gpt-5.3-codex`       | خیر     | خیر    | متن، تصویر      | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | خیر     | خیر    | متن             | low, medium, high, xhigh |
| `gpt-5.2`             | خیر     | خیر    | متن، تصویر      | low, medium, high, xhigh |

مدل‌های پنهان می‌توانند برای جریان‌های داخلی یا تخصصی توسط کاتالوگ سرور برنامه برگردانده شوند،
اما گزینه‌های عادی انتخاب‌گر مدل نیستند.

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

وقتی می‌خواهید شروع به کار از پروب کردن Codex پرهیز کند و فقط از کاتالوگ جایگزین استفاده کند،
کشف را غیرفعال کنید:

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

## فایل‌های راه‌اندازی فضای کاری

Codex خودش `AGENTS.md` را از طریق کشف بومی مستندات پروژه مدیریت می‌کند. OpenClaw
فایل‌های مصنوعی مستندات پروژه Codex را نمی‌نویسد و به نام‌فایل‌های جایگزین Codex
برای فایل‌های شخصیت وابسته نیست، چون جایگزین‌های Codex فقط زمانی اعمال می‌شوند که
`AGENTS.md` وجود نداشته باشد.

برای برابری فضای کاری OpenClaw، هارنس Codex فایل‌های راه‌اندازی دیگر را resolve می‌کند،
از جمله `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`،
`HEARTBEAT.md`، `BOOTSTRAP.md` و `MEMORY.md` در صورت وجود، و آن‌ها را
از طریق دستورالعمل‌های توسعه‌دهنده Codex روی `thread/start` و `thread/resume` منتقل می‌کند.
این کار بافت شخصیت و پروفایل فضای کاری را روی مسیر بومی شکل‌دهی رفتار Codex قابل مشاهده نگه می‌دارد،
بدون اینکه `AGENTS.md` را تکرار کند.

## بازنویسی‌های محیطی

بازنویسی‌های محیطی برای آزمایش محلی همچنان در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم نشده باشد، `OPENCLAW_CODEX_APP_SERVER_BIN`
باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای
آزمایش محلی یک‌باره از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. پیکربندی
برای استقرارهای تکرارپذیر ترجیح داده می‌شود، چون رفتار Plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد
که بقیه تنظیمات هارنس Codex در آن قرار دارد.

## مرتبط

- [هارنس Codex](/fa/plugins/codex-harness)
- [زمان اجرای هارنس Codex](/fa/plugins/codex-harness-runtime)
- [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)
- [استفاده رایانه‌ای Codex](/fa/plugins/codex-computer-use)
- [ارائه‌دهنده OpenAI](/fa/providers/openai)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)

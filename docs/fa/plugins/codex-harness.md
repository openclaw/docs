---
read_when:
    - می‌خواهید از هارنس app-server همراه Codex استفاده کنید
    - به نمونه‌های پیکربندی هارنس Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به PI با شکست مواجه شوند
summary: اجرای نوبت‌های عامل تعبیه‌شدهٔ OpenClaw از طریق مهار app-server همراه Codex
title: هارنس Codex
x-i18n:
    generated_at: "2026-05-10T19:53:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43e58bb97b5216318f8e5a58adb670930d57595f5cc4e85eccb65a9d0d33281
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw اجازه می‌دهد نوبت‌های عامل OpenAI جاسازی‌شده را
از طریق app-server Codex به‌جای هارنس PI داخلی اجرا کند.

وقتی می‌خواهید Codex مالک نشست سطح پایین عامل باشد، از هارنس Codex استفاده کنید:
ازسرگیری بومی thread، ادامه‌دادن بومی ابزار، compaction بومی، و
اجرای app-server. OpenClaw همچنان مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل،
ابزارهای پویای OpenClaw، تأییدها، تحویل رسانه، و آینه قابل مشاهده transcript است.

راه‌اندازی معمول از ارجاع‌های مدل OpenAI متعارف مانند `openai/gpt-5.5` استفاده می‌کند.
ارجاع‌های مدل `openai-codex/gpt-*` را پیکربندی نکنید. `openai-codex` ارائه‌دهنده پروفایل احراز هویت
برای پروفایل‌های Codex OAuth یا Codex API-key است، نه پیشوند ارائه‌دهنده مدل
برای پیکربندی جدید عامل.

برای تفکیک گسترده‌تر مدل/ارائه‌دهنده/runtime، از
[runtimeهای عامل](/fa/concepts/agent-runtimes) شروع کنید. نسخه کوتاه این است:
`openai/gpt-5.5` ارجاع مدل است، `codex` runtime است، و Telegram،
Discord، Slack، یا کانال دیگری سطح ارتباطی باقی می‌ماند.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس.
- اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را اضافه کنید.
- app-server Codex نسخه `0.125.0` یا جدیدتر. Plugin همراه به‌طور پیش‌فرض یک
  باینری سازگار app-server Codex را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex` روی `PATH`
  بر راه‌اندازی معمول هارنس اثر نمی‌گذارند.
- احراز هویت Codex از طریق `openclaw models auth login --provider openai-codex`،
  یک حساب app-server در خانه Codex عامل، یا یک پروفایل احراز هویت صریح Codex API-key
  در دسترس باشد.

برای اولویت احراز هویت، ایزوله‌سازی محیط، فرمان‌های سفارشی app-server، کشف مدل،
و همه فیلدهای پیکربندی، ببینید:
[مرجع هارنس Codex](/fa/plugins/codex-harness-reference).

## شروع سریع

بیشتر کاربرانی که Codex را در OpenClaw می‌خواهند، این مسیر را می‌خواهند: با یک
اشتراک ChatGPT/Codex وارد شوید، Plugin همراه `codex` را فعال کنید، و از یک
ارجاع مدل متعارف `openai/gpt-*` استفاده کنید.

ورود با Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Plugin همراه `codex` را فعال کنید و یک مدل عامل OpenAI انتخاب کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را آنجا هم اضافه کنید:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

پس از تغییر پیکربندی Plugin، gateway را راه‌اندازی مجدد کنید. اگر یک چت موجود از قبل
نشست دارد، پیش از آزمایش تغییرات runtime از `/new` یا `/reset` استفاده کنید تا نوبت بعدی
هارنس را از پیکربندی فعلی حل کند.

## پیکربندی

پیکربندی شروع سریع، حداقل پیکربندی قابل استفاده برای هارنس Codex است. گزینه‌های
هارنس Codex را در پیکربندی OpenClaw تنظیم کنید، و از CLI فقط برای احراز هویت Codex استفاده کنید:

| نیاز                                   | تنظیم                                                              | کجا                           |
| -------------------------------------- | ------------------------------------------------------------------ | ----------------------------- |
| فعال‌کردن هارنس                        | `plugins.entries.codex.enabled: true`                              | پیکربندی OpenClaw             |
| نگه‌داشتن نصب Plugin در فهرست مجاز     | افزودن `codex` در `plugins.allow`                                  | پیکربندی OpenClaw             |
| مسیریابی نوبت‌های عامل OpenAI از طریق Codex | `agents.defaults.model` یا `agents.list[].model` به‌صورت `openai/gpt-*` | پیکربندی عامل OpenClaw        |
| ورود با Codex OAuth                    | `openclaw models auth login --provider openai-codex`               | پروفایل احراز هویت CLI        |
| بسته‌ماندن در صورت دردسترس‌نبودن Codex | `agentRuntime.id: "codex"` در ارائه‌دهنده یا مدل                   | پیکربندی مدل/ارائه‌دهنده OpenClaw |
| استفاده از ترافیک مستقیم OpenAI API    | `agentRuntime.id: "pi"` در ارائه‌دهنده یا مدل با احراز هویت معمول OpenAI | پیکربندی مدل/ارائه‌دهنده OpenClaw |
| تنظیم رفتار app-server                 | `plugins.entries.codex.config.appServer.*`                         | پیکربندی Plugin Codex         |
| فعال‌کردن اپ‌های بومی Plugin Codex     | `plugins.entries.codex.config.codexPlugins.*`                      | پیکربندی Plugin Codex         |
| فعال‌کردن Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                       | پیکربندی Plugin Codex         |

برای نوبت‌های عامل OpenAI پشتیبانی‌شده با Codex، از ارجاع‌های مدل `openai/gpt-*` استفاده کنید.
`openai-codex` فقط نام ارائه‌دهنده پروفایل احراز هویت برای Codex OAuth و
پروفایل‌های Codex API-key است. ارجاع‌های مدل جدید `openai-codex/gpt-*` ننویسید.

بقیه این صفحه گونه‌های رایجی را پوشش می‌دهد که کاربران باید بین آن‌ها انتخاب کنند:
شکل استقرار، مسیریابی fail-closed، سیاست تأیید guardian، Pluginهای بومی Codex،
و Computer Use. برای فهرست کامل گزینه‌ها، پیش‌فرض‌ها، enumها، کشف،
ایزوله‌سازی محیط، timeoutها، و فیلدهای انتقال app-server، ببینید:
[مرجع هارنس Codex](/fa/plugins/codex-harness-reference).

## تأیید runtime Codex

در چتی که انتظار Codex دارید از `/status` استفاده کنید. یک نوبت عامل OpenAI
پشتیبانی‌شده با Codex نشان می‌دهد:

```text
Runtime: OpenAI Codex
```

سپس وضعیت app-server Codex را بررسی کنید:

```text
/codex status
/codex models
```

`/codex status` اتصال app-server، حساب، محدودیت‌های نرخ، سرورهای MCP
و skills را گزارش می‌کند. `/codex models` کاتالوگ زنده app-server Codex را برای
هارنس و حساب فهرست می‌کند. اگر `/status` غیرمنتظره است، ببینید:
[عیب‌یابی](#troubleshooting).

## مسیریابی و انتخاب مدل

ارجاع‌های ارائه‌دهنده و سیاست runtime را جدا نگه دارید:

- برای نوبت‌های عامل OpenAI از طریق Codex از `openai/gpt-*` استفاده کنید.
- از `openai-codex/gpt-*` در پیکربندی استفاده نکنید. برای تعمیر ارجاع‌های قدیمی و pinهای مسیر نشست کهنه،
  `openclaw doctor --fix` را اجرا کنید.
- `agentRuntime.id: "codex"` برای حالت خودکار معمول OpenAI اختیاری است، اما زمانی مفید است
  که یک استقرار باید در صورت دردسترس‌نبودن Codex بسته بماند.
- `agentRuntime.id: "pi"` وقتی عمدی باشد، یک ارائه‌دهنده یا مدل را وارد رفتار مستقیم PI می‌کند.
- `/codex ...` مکالمات بومی app-server Codex را از چت کنترل می‌کند.
- ACP/acpx یک مسیر هارنس خارجی جداگانه است. فقط وقتی کاربر ACP/acpx یا
  یک adapter هارنس خارجی می‌خواهد از آن استفاده کنید.

مسیریابی فرمان‌های رایج:

| قصد کاربر                         | استفاده                                  |
| --------------------------------- | ---------------------------------------- |
| پیوست‌کردن چت فعلی                | `/codex bind [--cwd <path>]`             |
| ازسرگیری یک thread موجود Codex    | `/codex resume <thread-id>`              |
| فهرست‌کردن یا فیلترکردن threadهای Codex | `/codex threads [filter]`                |
| فقط ارسال بازخورد Codex           | `/codex diagnostics [note]`              |
| شروع یک وظیفه ACP/acpx            | فرمان‌های نشست ACP/acpx، نه `/codex`     |

| مورد استفاده                                       | پیکربندی                                                        | تأیید                                    | یادداشت‌ها                         |
| -------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| اشتراک ChatGPT/Codex با runtime بومی Codex         | `openai/gpt-*` به‌همراه Plugin فعال `codex`                      | `/status` نشان می‌دهد `Runtime: OpenAI Codex` | مسیر توصیه‌شده                    |
| بسته‌ماندن در صورت دردسترس‌نبودن Codex            | `agentRuntime.id: "codex"` در ارائه‌دهنده یا مدل                 | نوبت به‌جای fallback به PI شکست می‌خورد | برای استقرارهای فقط Codex استفاده کنید |
| ترافیک مستقیم OpenAI API-key از طریق PI            | `agentRuntime.id: "pi"` در ارائه‌دهنده یا مدل و احراز هویت معمول OpenAI | `/status` runtime PI را نشان می‌دهد     | فقط وقتی PI عمدی است استفاده کنید |
| پیکربندی قدیمی                                     | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` آن را بازنویسی می‌کند | پیکربندی جدید را این‌گونه ننویسید |
| adapter Codex برای ACP/acpx                        | ACP `sessions_spawn({ runtime: "acp" })`                         | وضعیت وظیفه/نشست ACP                    | جدا از هارنس بومی Codex           |

`agents.defaults.imageModel` از همان تفکیک پیشوند پیروی می‌کند. برای مسیر معمول OpenAI از
`openai/gpt-*` استفاده کنید و فقط وقتی درک تصویر باید از طریق یک نوبت محدود app-server Codex
اجرا شود، از `codex/gpt-*` استفاده کنید. از `openai-codex/gpt-*` استفاده نکنید؛
doctor آن پیشوند قدیمی را به `openai/gpt-*` بازنویسی می‌کند.

## الگوهای استقرار

### استقرار پایه Codex

وقتی همه نوبت‌های عامل OpenAI باید به‌طور پیش‌فرض از Codex استفاده کنند، از پیکربندی شروع سریع استفاده کنید.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

### استقرار با ارائه‌دهندگان ترکیبی

این شکل Claude را به‌عنوان عامل پیش‌فرض نگه می‌دارد و یک عامل نام‌دار Codex اضافه می‌کند:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

با این پیکربندی، عامل `main` از مسیر عادی ارائه‌دهنده خودش استفاده می‌کند و عامل
`codex` از app-server Codex استفاده می‌کند.

### استقرار Codex به‌صورت fail-closed

برای نوبت‌های عامل OpenAI، وقتی Plugin همراه در دسترس باشد، `openai/gpt-*` از قبل به Codex
حل می‌شود. وقتی یک قانون fail-closed نوشته‌شده می‌خواهید، سیاست runtime صریح اضافه کنید:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

با اجباری‌شدن Codex، اگر Plugin Codex غیرفعال باشد، app-server بیش‌ازحد قدیمی باشد،
یا app-server نتواند شروع شود، OpenClaw زود شکست می‌خورد.

## سیاست app-server

به‌طور پیش‌فرض، Plugin باینری مدیریت‌شده Codex متعلق به OpenClaw را به‌صورت محلی با انتقال stdio
شروع می‌کند. `appServer.command` را فقط وقتی تنظیم کنید که عمداً می‌خواهید یک
فایل اجرایی متفاوت اجرا کنید. انتقال WebSocket را فقط زمانی استفاده کنید که یک app-server از قبل
در جای دیگری در حال اجراست:

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
          },
        },
      },
    },
  },
}
```

نشست‌های محلی app-server با stdio به‌طور پیش‌فرض از وضعیت اپراتور محلی مورد اعتماد استفاده می‌کنند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. اگر الزامات محلی Codex آن وضعیت ضمنی YOLO را مجاز ندانند،
OpenClaw به‌جای آن مجوزهای guardian مجاز را انتخاب می‌کند.

وقتی می‌خواهید Codex پیش از خروج از sandbox یا مجوزهای اضافه، auto-review بومی انجام دهد،
از حالت guardian استفاده کنید:

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

حالت guardian به تأییدهای app-server Codex گسترش می‌یابد، معمولاً
`approvalPolicy: "on-request"`، `approvalsReviewer: "auto_review"`، و
`sandbox: "workspace-write"` وقتی الزامات محلی آن مقادیر را مجاز بدانند.

برای هر فیلد app-server، ترتیب احراز هویت، ایزوله‌سازی محیط، کشف، و
رفتار timeout، ببینید [مرجع هارنس Codex](/fa/plugins/codex-harness-reference).

## فرمان‌ها و عیب‌یابی

Plugin همراه، `/codex` را به‌عنوان یک فرمان slash در هر کانالی که
از فرمان‌های متنی OpenClaw پشتیبانی می‌کند ثبت می‌کند.

شکل‌های رایج:

- `/codex status` اتصال‌پذیری app-server، مدل‌ها، حساب، محدودیت‌های نرخ،
  سرورهای MCP، و Skills را بررسی می‌کند.
- `/codex models` مدل‌های زنده Codex app-server را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر Codex app-server را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک
  رشته موجود Codex متصل می‌کند.
- `/codex compact` از Codex app-server می‌خواهد رشته متصل‌شده را compact کند.
- `/codex review` بازبینی بومی Codex را برای رشته متصل‌شده شروع می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد Codex برای
  رشته متصل‌شده درخواست تأیید می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP در Codex app-server را فهرست می‌کند.
- `/codex skills` Skills در Codex app-server را فهرست می‌کند.

برای بیشتر گزارش‌های پشتیبانی، با `/diagnostics [note]` در گفت‌وگویی شروع کنید
که خطا در آن رخ داده است. این دستور یک گزارش عیب‌یابی Gateway ایجاد می‌کند و،
برای نشست‌های harness مربوط به Codex، برای ارسال بسته بازخورد مرتبط Codex
درخواست تأیید می‌کند. برای مدل حریم خصوصی و رفتار گفت‌وگوی گروهی، به
[خروجی عیب‌یابی](/fa/gateway/diagnostics) مراجعه کنید.

از `/codex diagnostics [note]` فقط زمانی استفاده کنید که به‌طور مشخص می‌خواهید
بارگذاری بازخورد Codex برای رشته‌ای که در حال حاضر متصل است انجام شود، بدون
بسته کامل عیب‌یابی Gateway.

### بررسی محلی رشته‌های Codex

سریع‌ترین راه برای بررسی یک اجرای ناموفق Codex اغلب باز کردن مستقیم رشته بومی
Codex است:

```bash
codex resume <thread-id>
```

شناسه رشته را از پاسخ کامل‌شده `/diagnostics`، از `/codex binding`، یا از
`/codex threads [filter]` بگیرید.

برای سازوکارهای بارگذاری و مرزهای عیب‌یابی در سطح زمان اجرا، به
[زمان اجرای Codex harness](/fa/plugins/codex-harness-runtime#codex-feedback-upload) مراجعه کنید.

احراز هویت به این ترتیب انتخاب می‌شود:

1. یک پروفایل صریح احراز هویت OpenClaw Codex برای agent.
2. حساب موجود app-server در Codex home همان agent.
3. فقط برای راه‌اندازی‌های app-server محلی از نوع stdio، `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب app-server وجود ندارد و احراز هویت OpenAI
   همچنان لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex از نوع اشتراک ChatGPT را می‌بیند،
`CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex که ایجاد می‌شود حذف
می‌کند. این کار کلیدهای API در سطح Gateway را برای embeddings یا مدل‌های مستقیم
OpenAI در دسترس نگه می‌دارد، بدون اینکه نوبت‌های بومی Codex app-server به‌طور
تصادفی از طریق API صورت‌حساب شوند. پروفایل‌های صریح Codex API-key و fallback
کلید محیطی stdio محلی به‌جای env به‌ارث‌رسیده فرایند فرزند، از ورود app-server
استفاده می‌کنند. اتصال‌های WebSocket app-server کلید API محیطی Gateway را به‌عنوان
fallback دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب خود app-server
راه‌دور استفاده کنید.

اگر یک استقرار به جداسازی محیطی بیشتری نیاز دارد، آن متغیرها را به
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

`appServer.clearEnv` فقط بر فرایند فرزند Codex app-server ایجادشده اثر می‌گذارد.

ابزارهای پویای Codex به‌طور پیش‌فرض با بارگذاری `searchable` کار می‌کنند. OpenClaw
ابزارهای پویایی را که عملیات workspace بومی Codex را تکرار می‌کنند در معرض
استفاده قرار نمی‌دهد: `read`، `write`، `edit`، `apply_patch`، `exec`، `process`، و
`update_plan`. ابزارهای ادغام باقی‌مانده OpenClaw مانند پیام‌رسانی، نشست‌ها،
رسانه، cron، مرورگر، nodes، gateway، `heartbeat_respond`، و `web_search` از طریق
جست‌وجوی ابزار Codex زیر namespace با نام `openclaw` در دسترس هستند، که زمینه
اولیه مدل را کوچک‌تر نگه می‌دارد.
`sessions_yield` و پاسخ‌های منبعی که فقط مربوط به ابزار پیام هستند مستقیم باقی
می‌مانند، چون این‌ها قراردادهای کنترل نوبت هستند. دستورالعمل‌های همکاری
Heartbeat به Codex می‌گویند وقتی ابزار از پیش بارگذاری نشده است، پیش از پایان
دادن به یک نوبت Heartbeat، `heartbeat_respond` را جست‌وجو کند.

`codexDynamicToolsLoading: "direct"` را فقط زمانی تنظیم کنید که به یک Codex
app-server سفارشی متصل می‌شوید که نمی‌تواند ابزارهای پویای به‌تعویق‌افتاده را
جست‌وجو کند، یا وقتی payload کامل ابزار را عیب‌یابی می‌کنید.

فیلدهای سطح بالای پشتیبانی‌شده Codex Plugin:

| فیلد                      | پیش‌فرض        | معنا                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw را مستقیماً در زمینه اولیه ابزار Codex قرار دهید. |
| `codexDynamicToolsExclude` | `[]`           | نام‌های اضافی ابزار پویای OpenClaw که باید از نوبت‌های Codex app-server حذف شوند.              |
| `codexPlugins`             | غیرفعال       | پشتیبانی بومی Codex از Plugin/app برای Pluginهای curated نصب‌شده از منبع که مهاجرت کرده‌اند.           |

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد                         | پیش‌فرض                                                | معنا                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                              | `"stdio"` فرایند Codex را ایجاد می‌کند؛ `"websocket"` به `url` متصل می‌شود.                                                                                                                                                                             |
| `command`                     | باینری مدیریت‌شده Codex                                   | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده آن را تنظیم‌نشده بگذارید؛ فقط برای override صریح آن را تنظیم کنید.                                                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌ها برای انتقال stdio.                                                                                                                                                                                                       |
| `url`                         | تنظیم‌نشده                                                  | URL مربوط به WebSocket app-server.                                                                                                                                                                                                            |
| `authToken`                   | تنظیم‌نشده                                                  | توکن Bearer برای انتقال WebSocket.                                                                                                                                                                                                |
| `headers`                     | `{}`                                                   | headerهای اضافی WebSocket.                                                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                                   | نام متغیرهای محیطی اضافی که پس از ساختن محیط به‌ارث‌رسیده توسط OpenClaw، از فرایند stdio app-server ایجادشده حذف می‌شوند. `CODEX_HOME` و `HOME` برای جداسازی Codex به‌ازای هر agent در OpenClaw هنگام راه‌اندازی محلی رزرو شده‌اند. |
| `requestTimeoutMs`            | `60000`                                                | مهلت زمانی برای فراخوانی‌های control-plane در app-server.                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | پنجره سکوت پس از یک درخواست Codex app-server در محدوده نوبت، در حالی که OpenClaw منتظر `turn/completed` می‌ماند. این مقدار را برای فازهای کند پس از ابزار یا synthesis فقط-وضعیت افزایش دهید.                                                                  |
| `mode`                        | `"yolo"` مگر اینکه الزامات محلی Codex اجازه YOLO ندهند | preset برای اجرای YOLO یا اجرای بازبینی‌شده توسط guardian. الزامات محلی stdio که `danger-full-access`، تأیید `never`، یا بازبین `user` را حذف کنند، پیش‌فرض ضمنی را guardian می‌کنند.                                                |
| `approvalPolicy`              | `"never"` یا یک سیاست تأیید مجاز guardian       | سیاست تأیید بومی Codex که به شروع/ازسرگیری/نوبت رشته فرستاده می‌شود. پیش‌فرض‌های guardian وقتی مجاز باشد `"on-request"` را ترجیح می‌دهند.                                                                                                                 |
| `sandbox`                     | `"danger-full-access"` یا یک sandbox مجاز guardian  | حالت sandbox بومی Codex که به شروع/ازسرگیری رشته فرستاده می‌شود. پیش‌فرض‌های guardian وقتی مجاز باشد `"workspace-write"` را ترجیح می‌دهند، وگرنه `"read-only"`.                                                                                           |
| `approvalsReviewer`           | `"user"` یا یک بازبین مجاز guardian               | از `"auto_review"` استفاده کنید تا وقتی مجاز باشد Codex درخواست‌های تأیید بومی را بازبینی کند، در غیر این صورت `guardian_subagent` یا `user`. `guardian_subagent` یک alias قدیمی باقی می‌ماند.                                                                   |
| `serviceTier`                 | تنظیم‌نشده                                                  | سطح سرویس اختیاری Codex app-server. `"priority"` مسیریابی fast-mode را فعال می‌کند، `"flex"` پردازش flex را درخواست می‌کند، `null` override را پاک می‌کند، و `"fast"` قدیمی به‌عنوان `"priority"` پذیرفته می‌شود.                                      |

فراخوانی‌های ابزار پویای متعلق به OpenClaw مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: درخواست‌های Codex `item/tool/call`
به‌طور پیش‌فرض از یک watchdog سی‌ثانیه‌ای OpenClaw استفاده می‌کنند. آرگومان مثبت
`timeoutMs` برای هر فراخوانی، بودجه همان ابزار مشخص را افزایش یا کاهش می‌دهد.
ابزار `image_generate` همچنین وقتی فراخوانی ابزار timeout خودش را ارائه نکند از
`agents.defaults.imageGenerationModel.timeoutMs` استفاده می‌کند، و ابزار `image`
برای درک رسانه از `tools.media.image.timeoutSeconds` یا پیش‌فرض رسانه‌ای ۶۰
ثانیه‌ای خود استفاده می‌کند. بودجه ابزارهای پویا حداکثر تا 600000 ms محدود
می‌شود. هنگام timeout، OpenClaw در جاهایی که پشتیبانی می‌شود سیگنال ابزار را
لغو می‌کند و یک پاسخ ابزار پویای ناموفق به Codex برمی‌گرداند تا نوبت بتواند
ادامه پیدا کند، به‌جای اینکه نشست در `processing` باقی بماند.

پس از اینکه OpenClaw به یک درخواست app-server مربوط به نوبت Codex پاسخ می‌دهد،
harness همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` پایان دهد.
اگر app-server پس از آن پاسخ به‌مدت `appServer.turnCompletionIdleTimeoutMs` ساکت
بماند، OpenClaw به‌صورت best-effort نوبت Codex را interrupt می‌کند، یک timeout
عیب‌یابی ثبت می‌کند، و lane نشست OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی
بعدی پشت یک نوبت بومی stale در صف نمانند. هر اعلان غیرپایانی برای همان نوبت،
از جمله `rawResponseItem/completed`، آن watchdog کوتاه را غیرفعال می‌کند، چون
Codex ثابت کرده است که نوبت هنوز زنده است؛ watchdog پایانی طولانی‌تر همچنان از
نوبت‌هایی که واقعاً گیر کرده‌اند محافظت می‌کند. عیب‌یابی‌های timeout شامل آخرین
method اعلان app-server و، برای آیتم‌های پاسخ خام assistant، نوع آیتم، role،
id، و پیش‌نمایش محدودشده متن assistant هستند.

overrideهای محیطی برای آزمایش محلی همچنان در دسترس‌اند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` وقتی `appServer.command` تنظیم‌نشده است، باینری
مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای
آزمایش محلی یک‌باره از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. پیکربندی
برای استقرارهای تکرارپذیر ترجیح داده می‌شود، چون رفتار Plugin را در همان فایل
بازبینی‌شده‌ای نگه می‌دارد که باقی تنظیمات harness متعلق به Codex در آن قرار دارد.

## Pluginهای بومی Codex

پشتیبانی از Plugin بومی Codex از قابلیت‌های خود برنامه و Plugin در app-server متعلق به Codex
در همان رشته Codex استفاده می‌کند که نوبت harness مربوط به OpenClaw در آن اجرا می‌شود. OpenClaw
Pluginهای Codex را به ابزارهای پویای مصنوعی `codex_plugin_*` در OpenClaw ترجمه نمی‌کند.

`codexPlugins` فقط روی نشست‌هایی اثر می‌گذارد که harness بومی Codex را انتخاب می‌کنند. این
گزینه هیچ اثری روی اجرای PI، اجرای معمول ارائه‌دهنده OpenAI، اتصال‌های گفت‌وگوی ACP،
یا harnessهای دیگر ندارد.

پیکربندی مهاجرت‌یافته حداقلی:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

پیکربندی برنامه رشته زمانی محاسبه می‌شود که OpenClaw یک نشست harness متعلق به Codex ایجاد کند
یا اتصال رشته Codex منقضی‌شده‌ای را جایگزین کند. این پیکربندی در هر نوبت دوباره محاسبه نمی‌شود.
پس از تغییر `codexPlugins`، از `/new` یا `/reset` استفاده کنید، یا Gateway را راه‌اندازی مجدد کنید تا
نشست‌های آینده harness متعلق به Codex با مجموعه برنامه به‌روزشده شروع شوند.

برای شرایط احراز مهاجرت، موجودی برنامه، سیاست اقدام‌های مخرب،
درخواست‌های تکمیلی، و عیب‌یابی Plugin بومی، به
[Pluginهای بومی Codex](/fa/plugins/codex-native-plugins) مراجعه کنید.

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی خودش پوشش داده شده است:
[استفاده از رایانه در Codex](/fa/plugins/codex-computer-use).

نسخه کوتاه: OpenClaw برنامه کنترل دسکتاپ را vendor نمی‌کند و خودش اقدام‌های دسکتاپ را اجرا
نمی‌کند. OpenClaw app-server متعلق به Codex را آماده می‌کند، بررسی می‌کند که سرور MCP
`computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex در نوبت‌های حالت Codex مالک فراخوانی‌های
ابزار MCP بومی باشد.

## مرزهای زمان اجرا

harness متعلق به Codex فقط اجراکننده عامل تعبیه‌شده سطح پایین را تغییر می‌دهد.

- ابزارهای پویای OpenClaw پشتیبانی می‌شوند. Codex از OpenClaw می‌خواهد آن
  ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.
- ابزارهای shell، patch، MCP، و برنامه بومی متعلق به Codex در مالکیت Codex هستند.
  OpenClaw می‌تواند از طریق relay پشتیبانی‌شده رویدادهای بومی انتخاب‌شده را مشاهده یا مسدود کند،
  اما آرگومان‌های ابزار بومی را بازنویسی نمی‌کند.
- Codex مالک Compaction بومی است. OpenClaw یک آینه رونویس برای تاریخچه کانال،
  جست‌وجو، `/new`، `/reset`، و تغییر مدل یا harness در آینده نگه می‌دارد.
- تولید رسانه، فهم رسانه، TTS، تأییدها، و خروجی ابزار پیام‌رسانی
  همچنان از طریق تنظیمات متناظر ارائه‌دهنده/مدل در OpenClaw انجام می‌شوند.
- `tool_result_persist` روی نتایج ابزار در رونویس تحت مالکیت OpenClaw اعمال می‌شود، نه
  رکوردهای نتیجه ابزار بومی Codex.

برای لایه‌های hook، سطح‌های V1 پشتیبانی‌شده، مدیریت مجوز بومی، هدایت صف،
سازوکار بارگذاری بازخورد Codex، و جزئیات Compaction، به
[زمان اجرای harness متعلق به Codex](/fa/plugins/codex-harness-runtime) مراجعه کنید.

## عیب‌یابی

**Codex به‌عنوان یک ارائه‌دهنده معمولی `/model` نمایش داده نمی‌شود:** این رفتار برای
پیکربندی‌های جدید مورد انتظار است. یک مدل `openai/gpt-*` را انتخاب کنید،
`plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید که آیا `plugins.allow`
`codex` را مستثنی کرده است یا نه.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** مطمئن شوید مرجع مدل
`openai/gpt-*` روی ارائه‌دهنده رسمی OpenAI است و Plugin متعلق به Codex
نصب و فعال شده است. اگر هنگام آزمایش به اثبات سخت‌گیرانه نیاز دارید، در ارائه‌دهنده یا
مدل مقدار `agentRuntime.id: "codex"` را تنظیم کنید. زمان اجرای اجباری Codex به‌جای
بازگشت به PI با شکست متوقف می‌شود.

**پیکربندی قدیمی `openai-codex/*` باقی مانده است:** دستور `openclaw doctor --fix` را اجرا کنید.
Doctor مرجع‌های مدل قدیمی را به `openai/*` بازنویسی می‌کند، pinهای قدیمی زمان اجرای نشست و
کل عامل را حذف می‌کند، و overrideهای موجود auth-profile را حفظ می‌کند.

**app-server رد می‌شود:** از app-server متعلق به Codex نسخه `0.125.0` یا جدیدتر استفاده کنید.
پیش‌انتشارهای هم‌نسخه یا نسخه‌های دارای پسوند ساخت، مانند
`0.125.0-alpha.2` یا `0.125.0+custom`، رد می‌شوند چون OpenClaw کف پروتکل پایدار
`0.125.0` را آزمایش می‌کند.

**`/codex status` نمی‌تواند وصل شود:** بررسی کنید که Plugin بسته‌بندی‌شده `codex`
فعال باشد، وقتی allowlist پیکربندی شده است `plugins.allow` شامل آن باشد، و هر
`appServer.command`، `url`، `authToken`، یا header سفارشی معتبر باشد.

**کشف مدل کند است:** مقدار
`plugins.entries.codex.config.discovery.timeoutMs` را کاهش دهید یا کشف را غیرفعال کنید. به
[مرجع harness متعلق به Codex](/fa/plugins/codex-harness-reference#model-discovery) مراجعه کنید.

**انتقال WebSocket بلافاصله شکست می‌خورد:** `appServer.url`، `authToken`،
headerها، و اینکه app-server راه دور همان نسخه پروتکل app-server متعلق به Codex را صحبت کند بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این رفتار مورد انتظار است، مگر اینکه سیاست زمان اجرای
ارائه‌دهنده یا مدل آن را به harness دیگری مسیریابی کند. مرجع‌های معمولی ارائه‌دهنده غیر OpenAI در حالت
`auto` روی مسیر ارائه‌دهنده معمول خودشان باقی می‌مانند.

**استفاده از رایانه نصب شده است اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه
`/codex computer-use status` را بررسی کنید. اگر ابزاری گزارش داد
`Native hook relay unavailable`، از `/new` یا `/reset` استفاده کنید؛ اگر ادامه داشت، Gateway را
راه‌اندازی مجدد کنید تا ثبت‌های hook بومی منقضی پاک شوند. به
[استفاده از رایانه در Codex](/fa/plugins/codex-computer-use#troubleshooting) مراجعه کنید.

## مرتبط

- [مرجع harness متعلق به Codex](/fa/plugins/codex-harness-reference)
- [زمان اجرای harness متعلق به Codex](/fa/plugins/codex-harness-runtime)
- [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)
- [استفاده از رایانه در Codex](/fa/plugins/codex-computer-use)
- [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [ارائه‌دهنده OpenAI](/fa/providers/openai)
- [Pluginهای harness عامل](/fa/plugins/sdk-agent-harness)
- [hookهای Plugin](/fa/plugins/hooks)
- [خروجی عیب‌یابی](/fa/gateway/diagnostics)
- [وضعیت](/fa/cli/status)
- [آزمایش](/fa/help/testing-live#live-codex-app-server-harness-smoke)

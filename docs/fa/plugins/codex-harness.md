---
read_when:
    - می‌خواهید از هارنس سرور برنامه Codex همراه استفاده کنید
    - به نمونه‌های پیکربندی هارنس Codex نیاز دارید
    - می‌خواهید استقرارهای مختص Codex به‌جای بازگشت به PI با شکست مواجه شوند.
summary: نوبت‌های عامل تعبیه‌شدهٔ OpenClaw را از طریق هارنس app-server همراه Codex اجرا کنید
title: هارنس Codex
x-i18n:
    generated_at: "2026-05-11T20:39:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw اجازه می‌دهد turnهای عامل OpenAI را
به‌جای هارنس داخلی PI از طریق app-server مربوط به Codex اجرا کند.

وقتی می‌خواهید Codex مالک نشست عامل در سطح پایین باشد، از هارنس Codex
استفاده کنید: ادامه‌ی thread به‌صورت بومی، ادامه‌ی ابزار به‌صورت بومی،
Compaction بومی، و اجرای app-server. OpenClaw همچنان مالک کانال‌های چت،
فایل‌های نشست، انتخاب مدل، ابزارهای پویای OpenClaw، تأییدها، تحویل رسانه،
و آینه‌ی قابل مشاهده‌ی رونوشت است.

راه‌اندازی معمول از ارجاع‌های مدل متعارف OpenAI مانند `openai/gpt-5.5`
استفاده می‌کند. ارجاع‌های مدل `openai-codex/gpt-*` را پیکربندی نکنید.
ترتیب احراز هویت عامل OpenAI را زیر `auth.order.openai` بگذارید؛ پروفایل‌های
قدیمی‌تر `openai-codex:*` و ورودی‌های `auth.order.openai-codex` برای نصب‌های
موجود همچنان پشتیبانی می‌شوند.

OpenClaw threadهای app-server مربوط به Codex را با حالت کد بومی Codex و
code-mode-only فعال شروع می‌کند. این کار ابزارهای پویای deferred/searchable
OpenClaw را داخل اجرای کد و سطح جست‌وجوی ابزار خود Codex نگه می‌دارد، به‌جای
اینکه یک wrapper جست‌وجوی ابزار به سبک PI روی Codex اضافه کند.

برای تفکیک گسترده‌تر مدل/ارائه‌دهنده/runtime، از
[Runtimeهای عامل](/fa/concepts/agent-runtimes) شروع کنید. نسخه‌ی کوتاه این است:
`openai/gpt-5.5` ارجاع مدل است، `codex` همان runtime است، و Telegram،
Discord، Slack، یا کانال دیگری سطح ارتباطی باقی می‌ماند.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس.
- اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را وارد کنید.
- Codex app-server نسخه‌ی `0.125.0` یا جدیدتر. Plugin همراه به‌صورت پیش‌فرض یک
  باینری سازگار Codex app-server را مدیریت می‌کند، بنابراین فرمان‌های محلی
  `codex` روی `PATH` روی شروع معمول هارنس اثری ندارند.
- احراز هویت Codex از طریق `openclaw models auth login --provider openai-codex`،
  یک حساب app-server در خانه‌ی Codex عامل، یا یک پروفایل صریح احراز هویت
  Codex با API key در دسترس باشد.

برای اولویت احراز هویت، جداسازی محیط، فرمان‌های سفارشی app-server، کشف مدل،
و همه‌ی فیلدهای پیکربندی، ببینید:
[مرجع هارنس Codex](/fa/plugins/codex-harness-reference).

## شروع سریع

بیشتر کاربرانی که Codex را در OpenClaw می‌خواهند، این مسیر را می‌خواهند:
با اشتراک ChatGPT/Codex وارد شوید، Plugin همراه `codex` را فعال کنید، و از
یک ارجاع مدل متعارف `openai/gpt-*` استفاده کنید.

با OAuth مربوط به Codex وارد شوید:

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

پس از تغییر پیکربندی Plugin، Gateway را بازراه‌اندازی کنید. اگر یک چت موجود
از قبل نشست دارد، قبل از آزمودن تغییرات runtime از `/new` یا `/reset` استفاده
کنید تا turn بعدی هارنس را از پیکربندی فعلی resolve کند.

## پیکربندی

پیکربندی شروع سریع، حداقل پیکربندی قابل استفاده برای هارنس Codex است. گزینه‌های
هارنس Codex را در پیکربندی OpenClaw تنظیم کنید و از CLI فقط برای احراز هویت
Codex استفاده کنید:

| نیاز                                   | تنظیم                                                                            | محل                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| فعال کردن هارنس                        | `plugins.entries.codex.enabled: true`                                            | پیکربندی OpenClaw                  |
| نگه داشتن نصب Plugin در allowlist      | وارد کردن `codex` در `plugins.allow`                                             | پیکربندی OpenClaw                  |
| مسیریابی turnهای عامل OpenAI از Codex  | `agents.defaults.model` یا `agents.list[].model` به‌شکل `openai/gpt-*`           | پیکربندی عامل OpenClaw             |
| ورود با OAuth مربوط به Codex           | `openclaw models auth login --provider openai-codex`                             | پروفایل احراز هویت CLI             |
| افزودن پشتیبان API key برای اجراهای Codex | پروفایل API key با `openai:*` که پس از احراز هویت اشتراکی در `auth.order.openai` فهرست شده باشد | پروفایل احراز هویت CLI + پیکربندی OpenClaw |
| fail closed وقتی Codex در دسترس نیست   | `agentRuntime.id: "codex"` در ارائه‌دهنده یا مدل                                 | پیکربندی مدل/ارائه‌دهنده OpenClaw  |
| استفاده از ترافیک مستقیم OpenAI API    | `agentRuntime.id: "pi"` در ارائه‌دهنده یا مدل با احراز هویت معمول OpenAI         | پیکربندی مدل/ارائه‌دهنده OpenClaw  |
| تنظیم رفتار app-server                 | `plugins.entries.codex.config.appServer.*`                                       | پیکربندی Plugin مربوط به Codex     |
| فعال کردن appهای Plugin بومی Codex     | `plugins.entries.codex.config.codexPlugins.*`                                    | پیکربندی Plugin مربوط به Codex     |
| فعال کردن Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | پیکربندی Plugin مربوط به Codex     |

برای turnهای عامل OpenAI که با Codex پشتیبانی می‌شوند، از ارجاع‌های مدل
`openai/gpt-*` استفاده کنید. برای ترتیب «اشتراک در اولویت/API key به‌عنوان
پشتیبان»، `auth.order.openai` را ترجیح دهید. پروفایل‌های احراز هویت موجود
`openai-codex:*` و `auth.order.openai-codex` همچنان معتبرند، اما ارجاع‌های
مدل جدید `openai-codex/gpt-*` ننویسید.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

در این شکل، هر دو پروفایل برای turnهای عامل `openai/gpt-*` همچنان از طریق
Codex اجرا می‌شوند. API key فقط fallback احراز هویت است، نه درخواستی برای
تغییر به PI یا OpenAI Responses ساده.

بقیه‌ی این صفحه variantهای رایجی را پوشش می‌دهد که کاربران باید بین آن‌ها
انتخاب کنند: شکل استقرار، مسیریابی fail-closed، سیاست تأیید guardian،
Pluginهای بومی Codex، و Computer Use. برای فهرست کامل گزینه‌ها، پیش‌فرض‌ها،
enumها، کشف، جداسازی محیط، timeoutها، و فیلدهای انتقال app-server، ببینید:
[مرجع هارنس Codex](/fa/plugins/codex-harness-reference).

## بررسی runtime مربوط به Codex

در چتی که انتظار Codex دارید از `/status` استفاده کنید. یک turn عامل OpenAI
با پشتوانه‌ی Codex این را نشان می‌دهد:

```text
Runtime: OpenAI Codex
```

سپس وضعیت Codex app-server را بررسی کنید:

```text
/codex status
/codex models
```

`/codex status` اتصال app-server، حساب، محدودیت‌های نرخ، سرورهای MCP، و
skills را گزارش می‌کند. `/codex models` کاتالوگ زنده‌ی Codex app-server را
برای هارنس و حساب فهرست می‌کند. اگر `/status` غیرمنتظره است، ببینید:
[عیب‌یابی](#troubleshooting).

## مسیریابی و انتخاب مدل

ارجاع‌های ارائه‌دهنده و سیاست runtime را جدا نگه دارید:

- برای turnهای عامل OpenAI از طریق Codex از `openai/gpt-*` استفاده کنید.
- از `openai-codex/gpt-*` در پیکربندی استفاده نکنید. برای تعمیر ارجاع‌های
  legacy و pinهای قدیمی مسیر نشست، `openclaw doctor --fix` را اجرا کنید.
- `agentRuntime.id: "codex"` برای حالت خودکار معمول OpenAI اختیاری است، اما
  وقتی یک استقرار باید در صورت در دسترس نبودن Codex به‌صورت fail closed عمل کند
  مفید است.
- `agentRuntime.id: "pi"` وقتی این رفتار عمدی است، یک ارائه‌دهنده یا مدل را
  وارد رفتار مستقیم PI می‌کند.
- `/codex ...` مکالمه‌های بومی Codex app-server را از چت کنترل می‌کند.
- ACP/acpx یک مسیر هارنس خارجی جداگانه است. فقط زمانی از آن استفاده کنید که
  کاربر ACP/acpx یا یک adapter هارنس خارجی بخواهد.

مسیریابی فرمان‌های رایج:

| قصد کاربر                         | استفاده                                 |
| ---------------------------------- | --------------------------------------- |
| اتصال چت فعلی                     | `/codex bind [--cwd <path>]`            |
| ادامه دادن یک thread موجود Codex  | `/codex resume <thread-id>`             |
| فهرست یا فیلتر threadهای Codex    | `/codex threads [filter]`               |
| ارسال فقط بازخورد Codex           | `/codex diagnostics [note]`             |
| شروع یک task مربوط به ACP/acpx    | فرمان‌های نشست ACP/acpx، نه `/codex`   |

| مورد استفاده                                         | پیکربندی                                                        | بررسی                                  | یادداشت‌ها                         |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| اشتراک ChatGPT/Codex با runtime بومی Codex           | `openai/gpt-*` به‌همراه Plugin فعال `codex`                     | `/status` نشان می‌دهد `Runtime: OpenAI Codex` | مسیر پیشنهادی                     |
| fail closed اگر Codex در دسترس نیست                  | `agentRuntime.id: "codex"` در ارائه‌دهنده یا مدل                | turn به‌جای fallback به PI شکست می‌خورد | برای استقرارهای فقط Codex استفاده کنید |
| ترافیک مستقیم API key مربوط به OpenAI از طریق PI     | `agentRuntime.id: "pi"` در ارائه‌دهنده یا مدل و احراز هویت معمول OpenAI | `/status` runtime مربوط به PI را نشان می‌دهد | فقط وقتی PI عمدی است استفاده کنید |
| پیکربندی legacy                                      | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` آن را بازنویسی می‌کند | پیکربندی جدید را به این شکل ننویسید |
| adapter مربوط به ACP/acpx برای Codex                 | ACP `sessions_spawn({ runtime: "acp" })`                         | وضعیت task/session مربوط به ACP         | جدا از هارنس بومی Codex            |

`agents.defaults.imageModel` از همان تفکیک prefix پیروی می‌کند. برای مسیر
معمول OpenAI از `openai/gpt-*` و فقط وقتی درک تصویر باید از طریق یک turn
محدود Codex app-server اجرا شود، از `codex/gpt-*` استفاده کنید. از
`openai-codex/gpt-*` استفاده نکنید؛ doctor آن prefix قدیمی را به
`openai/gpt-*` بازنویسی می‌کند.

## الگوهای استقرار

### استقرار پایه‌ی Codex

وقتی همه‌ی turnهای عامل OpenAI باید به‌صورت پیش‌فرض از Codex استفاده کنند،
از پیکربندی شروع سریع استفاده کنید.

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

### استقرار ارائه‌دهنده‌ی ترکیبی

این شکل Claude را به‌عنوان عامل پیش‌فرض نگه می‌دارد و یک عامل نام‌گذاری‌شده‌ی
Codex اضافه می‌کند:

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

با این پیکربندی، عامل `main` از مسیر معمول ارائه‌دهنده‌ی خودش استفاده می‌کند
و عامل `codex` از Codex app-server استفاده می‌کند.

### استقرار Codex به‌صورت fail-closed

برای turnهای عامل OpenAI، وقتی Plugin همراه در دسترس باشد، `openai/gpt-*`
از قبل به Codex resolve می‌شود. وقتی یک قاعده‌ی نوشته‌شده‌ی fail-closed
می‌خواهید، سیاست runtime صریح اضافه کنید:

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

با اجباری شدن Codex، اگر Plugin مربوط به Codex غیرفعال باشد، app-server خیلی
قدیمی باشد، یا app-server نتواند شروع شود، OpenClaw زود شکست می‌خورد.

## سیاست app-server

به‌صورت پیش‌فرض، Plugin باینری مدیریت‌شده‌ی Codex مربوط به OpenClaw را به‌صورت
محلی با انتقال stdio شروع می‌کند. `appServer.command` را فقط زمانی تنظیم کنید
که عمداً می‌خواهید یک executable متفاوت اجرا کنید. از انتقال WebSocket فقط
وقتی استفاده کنید که یک app-server از قبل در جای دیگری در حال اجرا باشد:

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

جلسه‌های محلی app-server از نوع stdio به‌طور پیش‌فرض از وضعیت عملگر محلی مورد اعتماد استفاده می‌کنند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. اگر الزامات محلی Codex این وضعیت ضمنی YOLO را مجاز نداند، OpenClaw به‌جای آن مجوزهای مجاز guardian را انتخاب می‌کند.
وقتی sandbox مربوط به OpenClaw برای جلسه فعال باشد، OpenClaw مقدار
`danger-full-access` در Codex را به `workspace-write` در Codex محدود می‌کند تا نوبت‌های حالت کد بومی Codex داخل فضای کاری sandboxشده باقی بمانند.

زمانی از حالت guardian استفاده کنید که می‌خواهید پیش از خروج از sandbox
یا مجوزهای اضافی، بازبینی خودکار بومی Codex انجام شود:

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

حالت guardian به تأییدهای app-server در Codex گسترش می‌یابد، معمولاً
`approvalPolicy: "on-request"`، `approvalsReviewer: "auto_review"`، و
`sandbox: "workspace-write"`، وقتی الزامات محلی این مقادیر را مجاز بدانند.

برای همه فیلدهای app-server، ترتیب احراز هویت، جداسازی محیط، کشف، و
رفتار timeout، [مرجع harness مربوط به Codex](/fa/plugins/codex-harness-reference) را ببینید.

## فرمان‌ها و عیب‌یابی

Plugin همراه، `/codex` را به‌عنوان یک فرمان slash در هر کانالی ثبت می‌کند که
از فرمان‌های متنی OpenClaw پشتیبانی کند.

شکل‌های رایج:

- `/codex status` اتصال app-server، مدل‌ها، حساب، محدودیت‌های نرخ،
  سرورهای MCP، و Skills را بررسی می‌کند.
- `/codex models` مدل‌های زنده app-server در Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر app-server در Codex را فهرست می‌کند.
- `/codex resume <thread-id>` جلسه فعلی OpenClaw را به یک
  رشته موجود Codex متصل می‌کند.
- `/codex compact` از app-server در Codex می‌خواهد رشته متصل‌شده را فشرده کند.
- `/codex review` بازبینی بومی Codex را برای رشته متصل‌شده آغاز می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد Codex برای
  رشته متصل‌شده درخواست تأیید می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP در app-server مربوط به Codex را فهرست می‌کند.
- `/codex skills` Skills مربوط به app-server در Codex را فهرست می‌کند.

برای بیشتر گزارش‌های پشتیبانی، در گفت‌وگویی که خطا در آن رخ داده است با
`/diagnostics [note]` شروع کنید. این فرمان یک گزارش عیب‌یابی Gateway ایجاد می‌کند و، برای جلسه‌های harness مربوط به Codex، برای ارسال بسته بازخورد مرتبط Codex درخواست تأیید می‌کند.
برای مدل حریم خصوصی و رفتار گروه چت، [صدور عیب‌یابی](/fa/gateway/diagnostics) را ببینید.

فقط زمانی از `/codex diagnostics [note]` استفاده کنید که مشخصاً بارگذاری
بازخورد Codex را برای رشته‌ای که اکنون متصل است بخواهید، بدون بسته کامل عیب‌یابی Gateway.

### بررسی محلی رشته‌های Codex

سریع‌ترین راه برای بررسی یک اجرای ناموفق Codex اغلب این است که رشته بومی Codex را مستقیماً باز کنید:

```bash
codex resume <thread-id>
```

شناسه رشته را از پاسخ تکمیل‌شده `/diagnostics`، `/codex binding`، یا
`/codex threads [filter]` دریافت کنید.

برای سازوکارهای بارگذاری و مرزهای عیب‌یابی در سطح runtime، [runtime مربوط به harness Codex](/fa/plugins/codex-harness-runtime#codex-feedback-upload) را ببینید.

احراز هویت به این ترتیب انتخاب می‌شود:

1. پروفایل‌های احراز هویت OpenAI مرتب‌شده برای عامل، ترجیحاً زیر
   `auth.order.openai`. شناسه‌های پروفایل موجود `openai-codex:*` همچنان معتبر می‌مانند.
2. حساب موجود app-server در خانه Codex آن عامل.
3. فقط برای راه‌اندازی‌های محلی stdio app-server، `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب app-server وجود ندارد و احراز هویت OpenAI
   همچنان لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex از نوع اشتراک ChatGPT ببیند،
`CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex اجراشده حذف می‌کند. این کار کلیدهای API در سطح Gateway را برای embeddings یا مدل‌های مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه نوبت‌های app-server بومی Codex به‌اشتباه از طریق API صورت‌حساب شوند.
پروفایل‌های صریح کلید API مربوط به Codex و fallback کلید env محلی stdio به‌جای env فرایند فرزند به ارث‌رسیده، از ورود app-server استفاده می‌کنند. اتصال‌های app-server از نوع WebSocket، fallback کلید API موجود در env مربوط به Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب خود app-server راه دور استفاده کنید.

اگر یک پروفایل اشتراک به محدودیت مصرف Codex برسد، وقتی Codex زمان بازنشانی را گزارش کند OpenClaw آن را ثبت می‌کند و پروفایل احراز هویت مرتب‌شده بعدی را برای همان اجرای Codex امتحان می‌کند. وقتی زمان بازنشانی بگذرد، پروفایل اشتراک دوباره بدون تغییر مدل انتخاب‌شده `openai/gpt-*` یا runtime مربوط به Codex واجد شرایط می‌شود.

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

`appServer.clearEnv` فقط بر فرایند فرزند app-server مربوط به Codex که اجرا شده است اثر می‌گذارد.

ابزارهای پویای Codex به‌طور پیش‌فرض با بارگذاری `searchable` کار می‌کنند. OpenClaw ابزارهای پویایی را که عملیات فضای کاری بومی Codex را تکرار می‌کنند آشکار نمی‌کند: `read`، `write`،
`edit`، `apply_patch`، `exec`، `process`، و `update_plan`. ابزارهای باقی‌مانده یکپارچه‌سازی OpenClaw مانند پیام‌رسانی، جلسه‌ها، رسانه، cron، مرورگر، nodes،
gateway، `heartbeat_respond`، و `web_search` از طریق جست‌وجوی ابزار Codex زیر namespace
`openclaw` در دسترس‌اند و زمینه اولیه مدل را کوچک‌تر نگه می‌دارند.
`sessions_yield` و پاسخ‌های منبعی که فقط مربوط به ابزار پیام هستند مستقیم باقی می‌مانند، چون این‌ها قراردادهای کنترل نوبت هستند. دستورالعمل‌های همکاری Heartbeat به Codex می‌گویند پیش از پایان دادن به یک نوبت heartbeat، وقتی ابزار از قبل بارگذاری نشده است، `heartbeat_respond` را جست‌وجو کند.

فقط زمانی `codexDynamicToolsLoading: "direct"` را تنظیم کنید که به یک app-server سفارشی Codex وصل می‌شوید که نمی‌تواند ابزارهای پویای تعویق‌افتاده را جست‌وجو کند، یا زمانی که payload کامل ابزار را عیب‌یابی می‌کنید.

فیلدهای سطح بالای پشتیبانی‌شده Plugin مربوط به Codex:

| فیلد                      | پیش‌فرض        | معنی                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw مستقیماً در زمینه اولیه ابزار Codex قرار بگیرند. |
| `codexDynamicToolsExclude` | `[]`           | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های app-server مربوط به Codex حذف شوند.              |
| `codexPlugins`             | غیرفعال       | پشتیبانی بومی Plugin/برنامه در Codex برای Pluginهای گزینشی نصب‌شده از منبع که مهاجرت داده شده‌اند.           |

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد                         | پیش‌فرض                                                | معنی                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"`، Codex را اجرا می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                                                                                                                                |
| `command`                     | باینری مدیریت‌شده Codex                                   | فایل اجرایی برای transport از نوع stdio. برای استفاده از باینری مدیریت‌شده آن را تنظیم‌نشده بگذارید؛ فقط برای override صریح آن را تنظیم کنید.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌ها برای transport از نوع stdio.                                                                                                                                                                                                          |
| `url`                         | تنظیم‌نشده                                                  | URL مربوط به app-server از نوع WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | تنظیم‌نشده                                                  | توکن Bearer برای transport از نوع WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | headerهای اضافی WebSocket.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | نام متغیرهای محیطی اضافی که پس از ساخت محیط به ارث‌رسیده توسط OpenClaw از فرایند app-server از نوع stdio اجراشده حذف می‌شوند. `CODEX_HOME` و `HOME` برای جداسازی Codex به‌ازای هر عامل در OpenClaw در راه‌اندازی‌های محلی رزرو شده‌اند.    |
| `requestTimeoutMs`            | `60000`                                                | Timeout برای فراخوانی‌های control-plane مربوط به app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | پنجره سکوت پس از یک درخواست app-server مربوط به Codex با دامنه نوبت، در حالی که OpenClaw منتظر `turn/completed` می‌ماند. این مقدار را برای فازهای کند پس از ابزار یا فازهای synthesis فقط-وضعیت افزایش دهید.                                                                     |
| `mode`                        | `"yolo"` مگر اینکه الزامات محلی Codex، YOLO را مجاز نداند | preset برای اجرای YOLO یا اجرای بازبینی‌شده توسط guardian. الزامات محلی stdio که `danger-full-access`، تأیید `never`، یا بازبین `user` را حذف کنند، پیش‌فرض ضمنی را guardian می‌کنند.                                                   |
| `approvalPolicy`              | `"never"` یا یک سیاست تأیید مجاز guardian       | سیاست تأیید بومی Codex که به شروع/ازسرگیری/نوبت رشته ارسال می‌شود. پیش‌فرض‌های guardian وقتی مجاز باشد `"on-request"` را ترجیح می‌دهند.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` یا یک sandbox مجاز guardian  | حالت sandbox بومی Codex که به شروع/ازسرگیری رشته ارسال می‌شود. پیش‌فرض‌های guardian وقتی مجاز باشد `"workspace-write"` را ترجیح می‌دهند، وگرنه `"read-only"`. وقتی یک sandbox مربوط به OpenClaw فعال باشد، `danger-full-access` به `"workspace-write"` محدود می‌شود. |
| `approvalsReviewer`           | `"user"` یا یک بازبین مجاز guardian               | از `"auto_review"` استفاده کنید تا Codex وقتی مجاز باشد promptهای تأیید بومی را بازبینی کند، وگرنه `guardian_subagent` یا `user`. `guardian_subagent` همچنان یک alias قدیمی باقی می‌ماند.                                                                      |
| `serviceTier`                 | تنظیم‌نشده                                                  | سطح سرویس اختیاری app-server مربوط به Codex. `"priority"` مسیریابی حالت سریع را فعال می‌کند، `"flex"` پردازش flex را درخواست می‌کند، `null` این override را پاک می‌کند، و مقدار قدیمی `"fast"` به‌عنوان `"priority"` پذیرفته می‌شود.                                         |

OpenClaw متعلق به فراخوانی‌های ابزار پویای خودش را مستقل از
`appServer.requestTimeoutMs` محدود می‌کند: درخواست‌های `item/tool/call` در Codex به‌طور پیش‌فرض از نگهبان ۳۰ ثانیه‌ای
OpenClaw استفاده می‌کنند. آرگومان مثبت `timeoutMs` برای هر فراخوانی، بودجه همان ابزار مشخص را افزایش یا کاهش می‌دهد. ابزار `image_generate` همچنین وقتی فراخوانی ابزار زمان‌پایان خودش را ارائه نکند، از
`agents.defaults.imageGenerationModel.timeoutMs` استفاده می‌کند، و ابزار `image` برای درک رسانه از
`tools.media.image.timeoutSeconds` یا مقدار پیش‌فرض ۶۰ ثانیه‌ای رسانه استفاده می‌کند. بودجه‌های ابزار پویا حداکثر به 600000 ms محدود می‌شوند. در زمان پایان، OpenClaw در صورت پشتیبانی سیگنال ابزار را قطع می‌کند و یک پاسخ ناموفق ابزار پویا به Codex برمی‌گرداند تا نوبت بتواند ادامه پیدا کند، به‌جای اینکه نشست در وضعیت `processing` باقی بماند.

پس از اینکه OpenClaw به درخواست سرور برنامه با دامنه نوبت Codex پاسخ می‌دهد، هارنس همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` تمام کند. اگر سرور برنامه پس از آن پاسخ به مدت `appServer.turnCompletionIdleTimeoutMs` ساکت بماند، OpenClaw با بهترین تلاش نوبت Codex را قطع می‌کند، یک زمان‌پایان تشخیصی ثبت می‌کند و مسیر نشست OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی پشت یک نوبت بومی کهنه در صف نمانند. هر اعلان غیرپایانی برای همان نوبت، از جمله `rawResponseItem/completed`، آن نگهبان کوتاه را غیرفعال می‌کند، چون Codex ثابت کرده است که نوبت هنوز زنده است؛ نگهبان پایانی طولانی‌تر همچنان از نوبت‌های واقعا گیرکرده محافظت می‌کند. تشخیص‌های زمان‌پایان شامل آخرین متد اعلان سرور برنامه و، برای آیتم‌های خام پاسخ دستیار، نوع آیتم، نقش، شناسه، و یک پیش‌نمایش محدود از متن دستیار هستند.

بازنویسی‌های محیطی همچنان برای آزمون محلی در دسترس‌اند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` وقتی `appServer.command` تنظیم نشده باشد، باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای آزمون محلی موردی از
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. پیکربندی برای استقرارهای تکرارپذیر ترجیح دارد، چون رفتار Plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد که باقی تنظیمات هارنس Codex در آن قرار دارد.

## Pluginهای بومی Codex

پشتیبانی از Pluginهای بومی Codex از قابلیت‌های خود سرور برنامه Codex برای برنامه و Plugin در همان رشته Codex که نوبت هارنس OpenClaw در آن قرار دارد استفاده می‌کند. OpenClaw، Pluginهای Codex را به ابزارهای پویای مصنوعی `codex_plugin_*` در OpenClaw ترجمه نمی‌کند.

`codexPlugins` فقط روی نشست‌هایی اثر می‌گذارد که هارنس بومی Codex را انتخاب می‌کنند. این تنظیم روی اجراهای PI، اجراهای عادی ارائه‌دهنده OpenAI، اتصال‌های گفت‌وگوی ACP، یا هارنس‌های دیگر اثری ندارد.

پیکربندی مهاجرت‌داده‌شده حداقلی:

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

پیکربندی برنامه رشته زمانی محاسبه می‌شود که OpenClaw یک نشست هارنس Codex برقرار می‌کند یا اتصال رشته Codex کهنه‌ای را جایگزین می‌کند. این پیکربندی در هر نوبت دوباره محاسبه نمی‌شود. پس از تغییر `codexPlugins`، از `/new` یا `/reset` استفاده کنید، یا gateway را راه‌اندازی مجدد کنید تا نشست‌های آینده هارنس Codex با مجموعه برنامه به‌روزشده شروع شوند.

برای واجدشرایط بودن مهاجرت، فهرست برنامه‌ها، سیاست کنش‌های مخرب، درخواست‌های دریافت اطلاعات، و تشخیص‌های Plugin بومی، [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins) را ببینید.

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی خودش پوشش داده شده است:
[استفاده رایانه‌ای Codex](/fa/plugins/codex-computer-use).

خلاصه‌اش این است: OpenClaw برنامه کنترل دسکتاپ را وندور نمی‌کند و خودش کنش‌های دسکتاپ را اجرا نمی‌کند. OpenClaw سرور برنامه Codex را آماده می‌کند، بررسی می‌کند که سرور MCP مربوط به `computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex در نوبت‌های حالت Codex مالک فراخوانی‌های ابزار MCP بومی باشد.

## مرزهای زمان اجرا

هارنس Codex فقط اجراکننده عامل تعبیه‌شده سطح پایین را تغییر می‌دهد.

- ابزارهای پویای OpenClaw پشتیبانی می‌شوند. Codex از OpenClaw می‌خواهد این ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.
- ابزارهای شل، وصله، MCP، و ابزارهای برنامه بومی متعلق به Codex، توسط Codex مالکیت می‌شوند. OpenClaw می‌تواند از طریق رله پشتیبانی‌شده برخی رویدادهای بومی را مشاهده یا مسدود کند، اما آرگومان‌های ابزار بومی را بازنویسی نمی‌کند.
- Codex مالک Compaction بومی است. OpenClaw یک آینه رونوشت برای تاریخچه کانال، جست‌وجو، `/new`، `/reset`، و تغییر مدل یا هارنس در آینده نگه می‌دارد.
- تولید رسانه، درک رسانه، TTS، تأییدها، و خروجی ابزار پیام‌رسانی از طریق تنظیمات ارائه‌دهنده/مدل متناظر OpenClaw ادامه پیدا می‌کنند.
- `tool_result_persist` روی نتایج ابزار رونوشت تحت مالکیت OpenClaw اعمال می‌شود، نه رکوردهای نتیجه ابزار بومی Codex.

برای لایه‌های هوک، سطوح V1 پشتیبانی‌شده، مدیریت مجوز بومی، هدایت صف، سازوکارهای بارگذاری بازخورد Codex، و جزئیات Compaction، [زمان اجرای هارنس Codex](/fa/plugins/codex-harness-runtime) را ببینید.

## عیب‌یابی

**Codex به‌عنوان یک ارائه‌دهنده عادی `/model` ظاهر نمی‌شود:** این برای پیکربندی‌های جدید مورد انتظار است. یک مدل `openai/gpt-*` را انتخاب کنید، `plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید که آیا `plugins.allow`، `codex` را مستثنا کرده است یا نه.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** مطمئن شوید ارجاع مدل روی ارائه‌دهنده رسمی OpenAI برابر `openai/gpt-*` است و Plugin مربوط به Codex نصب و فعال شده است. اگر هنگام آزمون به اثبات سخت‌گیرانه نیاز دارید، `agentRuntime.id: "codex"` را برای ارائه‌دهنده یا مدل تنظیم کنید. زمان اجرای اجباری Codex به‌جای بازگشت به PI شکست می‌خورد.

**پیکربندی قدیمی `openai-codex/*` باقی مانده است:** `openclaw doctor --fix` را اجرا کنید. Doctor ارجاع‌های مدل قدیمی را به `openai/*` بازنویسی می‌کند، پین‌های زمان اجرای نشست کهنه و کل عامل را حذف می‌کند، و بازنویسی‌های موجود پروفایل احراز هویت را حفظ می‌کند.

**سرور برنامه رد می‌شود:** از سرور برنامه Codex نسخه `0.125.0` یا جدیدتر استفاده کنید. پیش‌انتشارهای همان نسخه یا نسخه‌های دارای پسوند ساخت مانند
`0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون OpenClaw کف پایدار پروتکل `0.125.0` را آزمون می‌کند.

**`/codex status` نمی‌تواند وصل شود:** بررسی کنید که Plugin همراه `codex` فعال باشد، وقتی فهرست مجاز پیکربندی شده است `plugins.allow` آن را شامل شود، و هر `appServer.command`، `url`، `authToken`، یا سرآیند سفارشی معتبر باشد.

**کشف مدل کند است:** مقدار
`plugins.entries.codex.config.discovery.timeoutMs` را کاهش دهید یا کشف را غیرفعال کنید. [مرجع هارنس Codex](/fa/plugins/codex-harness-reference#model-discovery) را ببینید.

**انتقال WebSocket بلافاصله شکست می‌خورد:** `appServer.url`، `authToken`، سرآیندها، و اینکه سرور برنامه راه‌دور همان نسخه پروتکل سرور برنامه Codex را صحبت می‌کند بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این مورد انتظار است، مگر اینکه سیاست زمان اجرای ارائه‌دهنده یا مدل آن را به هارنس دیگری مسیریابی کند. ارجاع‌های ساده ارائه‌دهنده غیر OpenAI در حالت `auto` روی مسیر عادی ارائه‌دهنده خودشان باقی می‌مانند.

**استفاده از رایانه نصب شده اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه، `/codex computer-use status` را بررسی کنید. اگر ابزاری `Native hook relay unavailable` گزارش کرد، از `/new` یا `/reset` استفاده کنید؛ اگر ادامه داشت، gateway را راه‌اندازی مجدد کنید تا ثبت‌های هوک بومی کهنه پاک شوند. [استفاده رایانه‌ای Codex](/fa/plugins/codex-computer-use#troubleshooting) را ببینید.

## مرتبط

- [مرجع هارنس Codex](/fa/plugins/codex-harness-reference)
- [زمان اجرای هارنس Codex](/fa/plugins/codex-harness-runtime)
- [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)
- [استفاده رایانه‌ای Codex](/fa/plugins/codex-computer-use)
- [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [ارائه‌دهنده OpenAI](/fa/providers/openai)
- [Pluginهای هارنس عامل](/fa/plugins/sdk-agent-harness)
- [هوک‌های Plugin](/fa/plugins/hooks)
- [صدور تشخیص‌ها](/fa/gateway/diagnostics)
- [وضعیت](/fa/cli/status)
- [آزمون](/fa/help/testing-live#live-codex-app-server-harness-smoke)

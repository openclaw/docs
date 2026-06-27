---
read_when:
    - می‌خواهید از هارنس app-server همراه Codex استفاده کنید
    - به نمونه‌های پیکربندی هارنس Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به OpenClaw با شکست مواجه شوند
summary: نوبت‌های عامل تعبیه‌شده OpenClaw را از طریق هارنس app-server همراه Codex اجرا کنید
title: مهار Codex
x-i18n:
    generated_at: "2026-06-27T18:12:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw اجازه می‌دهد نوبت‌های عامل OpenAI را
از طریق Codex app-server به‌صورت تعبیه‌شده اجرا کند، به‌جای اینکه از هارنس
داخلی OpenClaw استفاده کند.

وقتی می‌خواهید Codex مالک نشست سطح‌پایین عامل باشد، از هارنس Codex استفاده کنید:
ازسرگیری بومی رشته، ادامه ابزار بومی، Compaction بومی، و اجرای app-server.
OpenClaw همچنان مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل، ابزارهای پویای
OpenClaw، تأییدها، تحویل رسانه، و آینه رونوشت قابل مشاهده است.

راه‌اندازی عادی از ارجاع‌های متعارف مدل OpenAI مانند `openai/gpt-5.5` استفاده می‌کند.
ارجاع‌های GPT قدیمی Codex را پیکربندی نکنید. ترتیب احراز هویت عامل OpenAI را
زیر `auth.order.openai` قرار دهید؛ شناسه‌های قدیمی پروفایل احراز هویت Codex و
ورودی‌های قدیمی ترتیب احراز هویت Codex وضعیت قدیمی هستند که با
`openclaw doctor --fix` ترمیم می‌شوند.

وقتی هیچ سندباکس OpenClaw فعالی وجود ندارد، OpenClaw رشته‌های Codex app-server را
با حالت کد بومی Codex فعال شروع می‌کند و در عین حال حالت فقط-کد را به‌صورت پیش‌فرض خاموش نگه می‌دارد.
این کار قابلیت‌های فضای کاری و کد بومی Codex را در دسترس نگه می‌دارد، در حالی که
ابزارهای پویای OpenClaw از طریق پل `item/tool/call` در app-server ادامه پیدا می‌کنند.
سندباکس فعال OpenClaw و سیاست‌های محدود ابزار، حالت کد بومی را کاملاً غیرفعال می‌کنند،
مگر اینکه مسیر آزمایشی sandbox exec-server را انتخاب کنید.

این قابلیت بومی Codex از
[حالت کد OpenClaw](/fa/reference/code-mode) جداست؛ آن یک runtime انتخابی QuickJS-WASI
برای اجراهای عمومی OpenClaw با شکل ورودی متفاوت `exec` است.

برای تفکیک گسترده‌تر مدل/ارائه‌دهنده/runtime، از
[Runtimeهای عامل](/fa/concepts/agent-runtimes) شروع کنید. نسخه کوتاه این است:
`openai/gpt-5.5` ارجاع مدل است، `codex` runtime است، و Telegram،
Discord، Slack، یا کانالی دیگر سطح ارتباطی باقی می‌ماند.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس.
- اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را اضافه کنید.
- Codex app-server نسخه `0.125.0` یا جدیدتر. Plugin همراه به‌صورت پیش‌فرض یک
  باینری سازگار Codex app-server را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex` در `PATH`
  روی شروع عادی هارنس اثر نمی‌گذارند.
- احراز هویت Codex از طریق `openclaw models auth login --provider openai`،
  یک حساب app-server در خانه Codex عامل، یا یک پروفایل احراز هویت صریح API-key
  برای Codex در دسترس باشد.

برای تقدم احراز هویت، ایزوله‌سازی محیط، فرمان‌های سفارشی app-server، کشف مدل،
و همه فیلدهای پیکربندی، به
[مرجع هارنس Codex](/fa/plugins/codex-harness-reference) مراجعه کنید.

## شروع سریع

بیشتر کاربرانی که Codex را در OpenClaw می‌خواهند، این مسیر را می‌خواهند: با یک
اشتراک ChatGPT/Codex وارد شوید، Plugin همراه `codex` را فعال کنید، و از یک
ارجاع متعارف مدل `openai/gpt-*` استفاده کنید.

با Codex OAuth وارد شوید:

```bash
openclaw models auth login --provider openai
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

پس از تغییر پیکربندی Plugin، Gateway را دوباره راه‌اندازی کنید. اگر یک چت موجود
از قبل نشست دارد، پیش از آزمایش تغییرات runtime از `/new` یا `/reset` استفاده کنید
تا نوبت بعدی هارنس را از پیکربندی فعلی resolve کند.

## پیکربندی

پیکربندی شروع سریع، حداقل پیکربندی قابل استفاده برای هارنس Codex است. گزینه‌های
هارنس Codex را در پیکربندی OpenClaw تنظیم کنید، و از CLI فقط برای احراز هویت Codex استفاده کنید:

| نیاز                                   | تنظیم                                                                             | محل                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| فعال‌سازی هارنس                       | `plugins.entries.codex.enabled: true`                                            | پیکربندی OpenClaw                  |
| نگه داشتن نصب Plugin در فهرست مجاز    | `codex` را در `plugins.allow` اضافه کنید                                         | پیکربندی OpenClaw                  |
| مسیر دادن نوبت‌های عامل OpenAI از طریق Codex | `agents.defaults.model` یا `agents.list[].model` به‌صورت `openai/gpt-*`          | پیکربندی عامل OpenClaw             |
| ورود با ChatGPT/Codex OAuth            | `openclaw models auth login --provider openai`                                   | پروفایل احراز هویت CLI             |
| افزودن پشتیبان API-key برای اجراهای Codex | پروفایل API-key به‌شکل `openai:*` که پس از احراز هویت اشتراکی در `auth.order.openai` فهرست شده است | پروفایل احراز هویت CLI + پیکربندی OpenClaw |
| fail closed وقتی Codex در دسترس نیست  | `agentRuntime.id: "codex"` در ارائه‌دهنده یا مدل                                 | پیکربندی مدل/ارائه‌دهنده OpenClaw |
| استفاده از ترافیک مستقیم OpenAI API   | `agentRuntime.id: "openclaw"` در ارائه‌دهنده یا مدل با احراز هویت عادی OpenAI    | پیکربندی مدل/ارائه‌دهنده OpenClaw |
| تنظیم رفتار app-server                | `plugins.entries.codex.config.appServer.*`                                       | پیکربندی Plugin Codex              |
| فعال‌سازی اپ‌های بومی Plugin Codex    | `plugins.entries.codex.config.codexPlugins.*`                                    | پیکربندی Plugin Codex              |
| فعال‌سازی Codex Computer Use          | `plugins.entries.codex.config.computerUse.*`                                     | پیکربندی Plugin Codex              |

برای نوبت‌های عامل OpenAI پشتیبانی‌شده با Codex، از ارجاع‌های مدل `openai/gpt-*` استفاده کنید. برای ترتیب
اول-اشتراک/پشتیبان-API-key، `auth.order.openai` را ترجیح دهید. شناسه‌های موجود
پروفایل احراز هویت قدیمی Codex و ترتیب قدیمی احراز هویت Codex فقط وضعیت قدیمی
مخصوص doctor هستند؛ ارجاع‌های جدید قدیمی GPT Codex ننویسید.

روی عامل‌های پشتیبانی‌شده با Codex، `compaction.model` یا `compaction.provider` تنظیم نکنید.
Codex از طریق وضعیت رشته بومی app-server خود Compaction انجام می‌دهد، بنابراین OpenClaw
در زمان اجرا این بازنویسی‌های محلی خلاصه‌ساز را نادیده می‌گیرد و `openclaw doctor --fix`
وقتی عامل از Codex استفاده می‌کند آن‌ها را حذف می‌کند.

Lossless همچنان به‌عنوان موتور زمینه برای مونتاژ، دریافت، و نگهداشت پیرامون نوبت‌های Codex
پشتیبانی می‌شود. آن را از طریق
`plugins.slots.contextEngine: "lossless-claw"` و
`plugins.entries.lossless-claw.config.summaryModel` پیکربندی کنید، نه از طریق
`agents.defaults.compaction.provider`. `openclaw doctor --fix` شکل قدیمی
`compaction.provider: "lossless-claw"` را وقتی Codex runtime فعال است به اسلات موتور زمینه Lossless
مهاجرت می‌دهد، اما Codex بومی همچنان مالک Compaction است.

هارنس بومی Codex app-server از موتورهای زمینه‌ای پشتیبانی می‌کند که به
مونتاژ پیش از prompt نیاز دارند. backendهای عمومی CLI، از جمله `codex-cli`، این
قابلیت میزبان را فراهم نمی‌کنند.

برای عامل‌های پشتیبانی‌شده با Codex، `/compact` روی رشته متصل، Compaction بومی
Codex app-server را شروع می‌کند. OpenClaw منتظر تکمیل نمی‌ماند، timeout متعلق به OpenClaw
اعمال نمی‌کند، app-server مشترک را دوباره راه‌اندازی نمی‌کند، و به موتور زمینه یا
خلاصه‌ساز عمومی OpenAI fallback نمی‌کند. اگر اتصال رشته بومی Codex گم شده یا
کهنه باشد، فرمان fail closed می‌شود تا اپراتور مرز واقعی runtime را ببیند،
به‌جای اینکه Compaction به‌صورت بی‌صدا به backendهای دیگر تغییر کند.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

در آن شکل، هر دو پروفایل همچنان برای نوبت‌های عامل `openai/gpt-*` از طریق Codex اجرا می‌شوند.
کلید API فقط یک fallback احراز هویت است، نه درخواستی برای تغییر به OpenClaw یا
OpenAI Responses ساده.

باقی این صفحه گونه‌های رایجی را پوشش می‌دهد که کاربران باید بین آن‌ها انتخاب کنند:
شکل استقرار، مسیریابی fail-closed، سیاست تأیید guardian، Pluginهای بومی Codex،
و Computer Use. برای فهرست کامل گزینه‌ها، پیش‌فرض‌ها، enumها، کشف،
ایزوله‌سازی محیط، timeoutها، و فیلدهای انتقال app-server، به
[مرجع هارنس Codex](/fa/plugins/codex-harness-reference) مراجعه کنید.

## تأیید runtime Codex

در چتی که انتظار Codex دارید از `/status` استفاده کنید. یک نوبت عامل OpenAI
پشتیبانی‌شده با Codex نشان می‌دهد:

```text
Runtime: OpenAI Codex
```

سپس وضعیت Codex app-server را بررسی کنید:

```text
/codex status
/codex models
```

`/codex status` اتصال app-server، حساب، محدودیت‌های نرخ، سرورهای MCP،
و Skills را گزارش می‌دهد. `/codex models` کاتالوگ زنده Codex app-server را برای
هارنس و حساب فهرست می‌کند. اگر `/status` غیرمنتظره است، به
[عیب‌یابی](#troubleshooting) مراجعه کنید.

## مسیریابی و انتخاب مدل

ارجاع‌های ارائه‌دهنده و سیاست runtime را جدا نگه دارید:

- برای نوبت‌های عامل OpenAI از طریق Codex، از `openai/gpt-*` استفاده کنید.
- از ارجاع‌های قدیمی GPT Codex در پیکربندی استفاده نکنید. برای ترمیم ارجاع‌های
  قدیمی و pinهای کهنه مسیر نشست، `openclaw doctor --fix` را اجرا کنید.
- `agentRuntime.id: "codex"` برای حالت خودکار عادی OpenAI اختیاری است، اما وقتی
  یک استقرار باید در صورت نبود Codex به‌صورت fail closed عمل کند مفید است.
- `agentRuntime.id: "openclaw"` یک ارائه‌دهنده یا مدل را، وقتی عمدی باشد، وارد
  runtime تعبیه‌شده OpenClaw می‌کند.
- `/codex ...` گفتگوهای بومی Codex app-server را از چت کنترل می‌کند.
- ACP/acpx یک مسیر هارنس خارجی جداگانه است. فقط وقتی کاربر ACP/acpx یا یک
  آداپتور هارنس خارجی می‌خواهد از آن استفاده کنید.

مسیریابی فرمان‌های رایج:

| قصد کاربر                                             | استفاده                                                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| پیوست کردن چت فعلی                                   | `/codex bind [--cwd <path>]`                                                                          |
| ازسرگیری یک رشته موجود Codex                         | `/codex resume <thread-id>`                                                                           |
| فهرست یا فیلتر کردن رشته‌های Codex                   | `/codex threads [filter]`                                                                             |
| فهرست کردن Pluginهای بومی Codex                      | `/codex plugins list`                                                                                 |
| فعال یا غیرفعال کردن یک Plugin بومی Codex پیکربندی‌شده | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| پیوست کردن یک نشست موجود Codex CLI روی یک node جفت‌شده | `/codex sessions --host <node> [filter]`, سپس `/codex resume <session-id> --host <node> --bind here` |
| ارسال فقط بازخورد Codex                              | `/codex diagnostics [note]`                                                                           |
| شروع یک وظیفه ACP/acpx                               | فرمان‌های نشست ACP/acpx، نه `/codex`                                                                 |

| مورد استفاده                                        | پیکربندی                                                               | راستی‌آزمایی                           | یادداشت‌ها                            |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| اشتراک ChatGPT/Codex با زمان اجرای بومی Codex        | `openai/gpt-*` به‌همراه Plugin فعال `codex`                            | `/status` نشان می‌دهد `Runtime: OpenAI Codex` | مسیر پیشنهادی                        |
| در صورت در دسترس نبودن Codex، بسته شکست بخورد       | ارائه‌دهنده یا مدل `agentRuntime.id: "codex"`                          | نوبت به‌جای جایگزین تعبیه‌شده شکست می‌خورد | برای استقرارهای فقط Codex استفاده کنید |
| ترافیک مستقیم کلید API OpenAI از طریق OpenClaw       | ارائه‌دهنده یا مدل `agentRuntime.id: "openclaw"` و احراز هویت عادی OpenAI | `/status` زمان اجرای OpenClaw را نشان می‌دهد | فقط وقتی استفاده کنید که OpenClaw تعمدی است |
| پیکربندی قدیمی                                      | ارجاع‌های قدیمی Codex GPT                                              | `openclaw doctor --fix` آن را بازنویسی می‌کند | پیکربندی جدید را به این شکل ننویسید |
| آداپتور ACP/acpx Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                               | وضعیت کار/نشست ACP                     | جدا از harness بومی Codex            |

`agents.defaults.imageModel` از همان تفکیک پیشوند پیروی می‌کند. از `openai/gpt-*`
برای مسیر عادی OpenAI استفاده کنید و از `codex/gpt-*` فقط وقتی استفاده کنید که درک تصویر
باید از طریق یک نوبت محدودشده در سرور برنامه Codex اجرا شود. از ارجاع‌های
قدیمی Codex GPT استفاده نکنید؛ doctor آن پیشوند قدیمی را به `openai/gpt-*` بازنویسی می‌کند.

## الگوهای استقرار

### استقرار پایه Codex

وقتی همه نوبت‌های عامل OpenAI باید به‌طور پیش‌فرض از Codex استفاده کنند،
از پیکربندی quickstart استفاده کنید.

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

### استقرار با ارائه‌دهنده‌های ترکیبی

این شکل Claude را به‌عنوان عامل پیش‌فرض نگه می‌دارد و یک عامل نام‌گذاری‌شده Codex اضافه می‌کند:

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

با این پیکربندی، عامل `main` از مسیر عادی ارائه‌دهنده خود استفاده می‌کند و عامل
`codex` از سرور برنامه Codex استفاده می‌کند.

### استقرار fail-closed برای Codex

برای نوبت‌های عامل OpenAI، `openai/gpt-*` وقتی Plugin بسته‌بندی‌شده در دسترس باشد
از پیش به Codex resolve می‌شود. وقتی یک قاعده fail-closed مکتوب می‌خواهید،
سیاست صریح زمان اجرا را اضافه کنید:

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

وقتی Codex اجباری باشد، اگر Plugin Codex غیرفعال باشد، سرور برنامه بیش از حد قدیمی باشد،
یا سرور برنامه نتواند شروع شود، OpenClaw زود شکست می‌خورد.

## سیاست سرور برنامه

به‌طور پیش‌فرض، Plugin باینری مدیریت‌شده Codex متعلق به OpenClaw را به‌صورت محلی با انتقال stdio
شروع می‌کند. `appServer.command` را فقط وقتی تنظیم کنید که عمداً می‌خواهید یک
فایل اجرایی متفاوت را اجرا کنید. از انتقال WebSocket فقط وقتی استفاده کنید که یک سرور برنامه
از قبل در جای دیگری در حال اجرا باشد:

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

نشست‌های محلی سرور برنامه stdio به‌طور پیش‌فرض حالت اپراتور محلی مورد اعتماد را دارند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. اگر الزامات محلی Codex اجازه آن حالت ضمنی YOLO را ندهند،
OpenClaw به‌جای آن مجوزهای guardian مجاز را انتخاب می‌کند.
وقتی یک sandbox OpenClaw برای نشست فعال باشد، OpenClaw برای آن نوبت
Code Mode بومی Codex، سرورهای MCP کاربر، و اجرای Plugin پشتیبانی‌شده توسط برنامه را غیرفعال می‌کند
به‌جای اینکه به sandbox سمت میزبان Codex تکیه کند. دسترسی shell
از طریق ابزارهای پویا با پشتوانه sandbox در OpenClaw مانند `sandbox_exec` و
`sandbox_process` ارائه می‌شود، وقتی ابزارهای عادی exec/process در دسترس باشند.

وقتی پیش از خروج از sandbox یا مجوزهای اضافه، بازبینی خودکار بومی Codex را می‌خواهید،
از حالت exec نرمال‌شده OpenClaw استفاده کنید:

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

برای نشست‌های سرور برنامه Codex، OpenClaw مقدار `tools.exec.mode: "auto"` را به تأییدیه‌های
بازبینی‌شده توسط Codex Guardian نگاشت می‌کند، معمولاً
`approvalPolicy: "on-request"`، `approvalsReviewer: "auto_review"`، و
`sandbox: "workspace-write"` وقتی الزامات محلی اجازه این مقدارها را بدهند.
در `tools.exec.mode: "auto"`، OpenClaw overrideهای ناامن قدیمی Codex یعنی
`approvalPolicy: "never"` یا `sandbox: "danger-full-access"` را حفظ نمی‌کند؛ برای
حالت Codex عمدی بدون تأییدیه از `tools.exec.mode: "full"` استفاده کنید. preset قدیمی
`plugins.entries.codex.config.appServer.mode: "guardian"` همچنان کار می‌کند، اما
`tools.exec.mode: "auto"` سطح نرمال‌شده OpenClaw است.

برای مقایسه در سطح حالت با تأییدهای اجرای میزبان و مجوزهای ACPX،
[حالت‌های مجوز](/fa/tools/permission-modes) را ببینید.

برای همهٔ فیلدهای سرور برنامه، ترتیب احراز هویت، جداسازی محیط، کشف، و
رفتار timeout، [مرجع هارنس Codex](/fa/plugins/codex-harness-reference) را ببینید.

## دستورها و عیب‌یابی

Plugin همراه، `/codex` را به‌عنوان یک دستور اسلش در هر کانالی ثبت می‌کند که
از دستورهای متنی OpenClaw پشتیبانی می‌کند.

شکل‌های رایج:

- `/codex status` اتصال سرور برنامه، مدل‌ها، حساب، محدودیت‌های نرخ،
  سرورهای MCP، و Skills را بررسی می‌کند.
- `/codex models` مدل‌های زندهٔ سرور برنامه Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر سرور برنامه Codex را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک
  رشتهٔ موجود Codex متصل می‌کند.
- `/codex compact` از سرور برنامه Codex می‌خواهد رشتهٔ متصل را compact کند.
- `/codex review` بازبینی بومی Codex را برای رشتهٔ متصل آغاز می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد Codex برای
  رشتهٔ متصل، درخواست تأیید می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرورهای MCP سرور برنامه Codex را فهرست می‌کند.
- `/codex skills` Skills سرور برنامه Codex را فهرست می‌کند.

برای بیشتر گزارش‌های پشتیبانی، با `/diagnostics [note]` در گفت‌وگویی شروع کنید
که باگ در آن رخ داده است. این دستور یک گزارش عیب‌یابی Gateway ایجاد می‌کند و،
برای نشست‌های هارنس Codex، برای ارسال بستهٔ بازخورد مرتبط Codex درخواست تأیید
می‌کند. برای مدل حریم خصوصی و رفتار چت گروهی، [خروجی عیب‌یابی](/fa/gateway/diagnostics)
را ببینید.

فقط زمانی از `/codex diagnostics [note]` استفاده کنید که مشخصاً می‌خواهید
آپلود بازخورد Codex برای رشتهٔ متصل فعلی را بدون بستهٔ کامل عیب‌یابی Gateway
ارسال کنید.

### بررسی محلی رشته‌های Codex

سریع‌ترین راه برای بررسی یک اجرای ناموفق Codex اغلب این است که رشتهٔ بومی Codex
را مستقیماً باز کنید:

```bash
codex resume <thread-id>
```

شناسهٔ رشته را از پاسخ تکمیل‌شدهٔ `/diagnostics`، `/codex binding`، یا
`/codex threads [filter]` بگیرید.

برای سازوکار آپلود و مرزهای عیب‌یابی در سطح runtime، 
[runtime هارنس Codex](/fa/plugins/codex-harness-runtime#codex-feedback-upload) را ببینید.

احراز هویت به این ترتیب انتخاب می‌شود:

1. پروفایل‌های مرتب‌شدهٔ احراز هویت OpenAI برای agent، ترجیحاً زیر
   `auth.order.openai`. برای مهاجرت شناسه‌های پروفایل احراز هویت قدیمی
   Codex و ترتیب احراز هویت قدیمی Codex، `openclaw doctor --fix` را اجرا کنید.
2. حساب موجود سرور برنامه در خانهٔ Codex همان agent.
3. فقط برای راه‌اندازی‌های سرور برنامه stdio محلی، `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب سرور برنامه‌ای وجود ندارد و احراز هویت OpenAI
   همچنان لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex از نوع اشتراک ChatGPT می‌بیند،
`CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex که ایجاد می‌شود حذف
می‌کند. این کار کلیدهای API در سطح Gateway را برای embeddings یا مدل‌های مستقیم
OpenAI در دسترس نگه می‌دارد، بدون آنکه نوبت‌های بومی سرور برنامه Codex به‌اشتباه
از طریق API صورتحساب شوند. پروفایل‌های صریح کلید API Codex و fallback کلید env
برای stdio محلی، به‌جای env به‌ارث‌رسیدهٔ فرایند فرزند، از ورود سرور برنامه
استفاده می‌کنند. اتصال‌های سرور برنامه WebSocket، fallback کلید API env از
Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب خود سرور
برنامهٔ راه‌دور استفاده کنید.
وقتی Pluginهای بومی Codex پیکربندی شده باشند، OpenClaw آن Pluginها را پیش از
نمایان‌کردن برنامه‌های متعلق به Plugin برای رشتهٔ Codex، از طریق سرور برنامهٔ
متصل نصب یا تازه‌سازی می‌کند. `app/list` همچنان منبع حقیقت برای شناسه‌های
برنامه، دسترس‌پذیری، و metadata است، اما OpenClaw مالک تصمیم فعال‌سازی برای هر
رشته است: اگر policy اجازهٔ یک برنامهٔ فهرست‌شده و دسترس‌پذیر را بدهد، OpenClaw
حتی وقتی `app/list` در حال حاضر آن برنامه را غیرفعال گزارش می‌کند،
`thread/start.config.apps[appId].enabled = true` را می‌فرستد. این مسیر برای
شناسه‌های ناشناخته نصب برنامه اختراع نمی‌کند؛ OpenClaw فقط Pluginهای marketplace
را با `plugin/install` فعال می‌کند و سپس موجودی را تازه‌سازی می‌کند.

اگر یک پروفایل اشتراکی به محدودیت استفادهٔ Codex برسد، OpenClaw وقتی Codex زمان
بازنشانی را گزارش کند آن را ثبت می‌کند و برای همان اجرای Codex، پروفایل احراز
هویت مرتب‌شدهٔ بعدی را امتحان می‌کند. وقتی زمان بازنشانی بگذرد، پروفایل اشتراکی
دوباره واجد شرایط می‌شود، بدون تغییر مدل انتخاب‌شدهٔ `openai/gpt-*` یا runtime
Codex.

برای راه‌اندازی‌های سرور برنامه stdio محلی، OpenClaw مقدار `CODEX_HOME` را روی
یک دایرکتوری مختص هر agent تنظیم می‌کند تا پیکربندی Codex، فایل‌های احراز هویت
و حساب، cache/data مربوط به Plugin، و وضعیت رشتهٔ بومی به‌طور پیش‌فرض
`~/.codex` شخصی operator را نخوانند یا ننویسند. OpenClaw مقدار معمول فرایند
`HOME` را حفظ می‌کند؛ زیرفرایندهای اجراشده توسط Codex همچنان می‌توانند
پیکربندی و توکن‌های خانهٔ کاربر را پیدا کنند، و Codex ممکن است ورودی‌های مشترک
`$HOME/.agents/skills` و `$HOME/.agents/plugins/marketplace.json` را کشف کند.

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

`appServer.clearEnv` فقط روی فرایند فرزند سرور برنامه Codex که ایجاد می‌شود اثر
می‌گذارد. OpenClaw در مرحلهٔ نرمال‌سازی راه‌اندازی محلی، `CODEX_HOME` و `HOME`
را از این فهرست حذف می‌کند: `CODEX_HOME` مختص هر agent می‌ماند، و `HOME` به‌صورت
به‌ارث‌رسیده باقی می‌ماند تا زیرفرایندها بتوانند از وضعیت معمول خانهٔ کاربر
استفاده کنند.

ابزارهای پویای Codex به‌طور پیش‌فرض با بارگذاری `searchable` کار می‌کنند. OpenClaw ابزارهای
پویایی را که عملیات بومیِ فضای کاری Codex را تکرار می‌کنند در معرض استفاده قرار نمی‌دهد:
`read`، `write`، `edit`، `apply_patch`، `exec`، `process`، و `update_plan`. بیشتر ابزارهای
یکپارچه‌سازی باقی‌مانده OpenClaw مانند پیام‌رسانی، رسانه، Cron، مرورگر، گره‌ها،
Gateway، و `heartbeat_respond` از طریق جست‌وجوی ابزار Codex در فضای نام
`openclaw` در دسترس هستند و زمینه اولیه مدل را کوچک‌تر نگه می‌دارند. وقتی جست‌وجو
فعال باشد و هیچ ارائه‌دهنده مدیریت‌شده‌ای انتخاب نشده باشد، جست‌وجوی وب به‌طور پیش‌فرض
از ابزار میزبانی‌شده `web_search` متعلق به Codex استفاده می‌کند. جست‌وجوی میزبانی‌شده
بومی و ابزار پویای مدیریت‌شده `web_search` متعلق به OpenClaw ناسازگار و انحصاری‌اند،
تا جست‌وجوی مدیریت‌شده نتواند محدودیت‌های دامنه بومی را دور بزند. OpenClaw زمانی از
ابزار مدیریت‌شده استفاده می‌کند که جست‌وجوی میزبانی‌شده در دسترس نباشد، به‌صراحت
غیرفعال شده باشد، یا با یک ارائه‌دهنده مدیریت‌شده انتخاب‌شده جایگزین شده باشد.
OpenClaw افزونه مستقل `web.run` متعلق به Codex را غیرفعال نگه می‌دارد، چون ترافیک
سرور برنامه تولیدی فضای نام `web` تعریف‌شده توسط کاربر را رد می‌کند.
`tools.web.search.enabled: false` هر دو مسیر را غیرفعال می‌کند، همان‌طور که اجراهای
فقط LLM با ابزارهای غیرفعال نیز چنین می‌کنند. Codex با `"cached"` به‌عنوان یک ترجیح
رفتار می‌کند و آن را برای نوبت‌های نامحدود سرور برنامه به دسترسی خارجی زنده تبدیل
می‌کند. بازگشت خودکار مدیریت‌شده وقتی `allowedDomains` بومی تنظیم شده باشد به‌صورت
بسته شکست می‌خورد تا فهرست مجاز دور زده نشود. تغییرات پایدار در سیاست جست‌وجوی
مؤثر، رشته Codex متصل را پیش از نوبت بعدی چرخش می‌دهند. محدودیت‌های گذرای هر نوبت
از یک رشته محدود موقت استفاده می‌کنند و اتصال موجود را برای ازسرگیری بعدی حفظ
می‌کنند. `sessions_yield` و پاسخ‌های منبعِ فقط ابزار پیام مستقیم باقی می‌مانند، چون
این‌ها قراردادهای کنترل نوبت هستند. `sessions_spawn` قابل جست‌وجو باقی می‌ماند تا
`spawn_agent` بومی Codex سطح اصلی زیرعامل Codex بماند، در حالی که واگذاری صریح
OpenClaw یا ACP همچنان از طریق فضای نام ابزار پویای `openclaw` در دسترس است.
دستورالعمل‌های همکاری Heartbeat به Codex می‌گویند وقتی ابزار از قبل بارگذاری نشده
است، پیش از پایان دادن به نوبت Heartbeat به‌دنبال `heartbeat_respond` بگردد.

`codexDynamicToolsLoading: "direct"` را فقط زمانی تنظیم کنید که به یک سرور برنامه
سفارشی Codex وصل می‌شوید که نمی‌تواند ابزارهای پویای به‌تعویق‌افتاده را جست‌وجو کند،
یا زمانی که در حال اشکال‌زدایی بار کامل ابزار هستید.

فیلدهای سطح بالای پشتیبانی‌شده Plugin مربوط به Codex:

| فیلد                       | پیش‌فرض        | معنی                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw مستقیماً در زمینه اولیه ابزار Codex قرار بگیرند. |
| `codexDynamicToolsExclude` | `[]`           | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های سرور برنامه Codex حذف شوند. |
| `codexPlugins`             | غیرفعال        | پشتیبانی بومی Plugin/برنامه Codex برای Pluginهای گزینش‌شده مهاجرت‌کرده که از منبع نصب شده‌اند. |

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد                                         | پیش‌فرض                                                | معنا                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"`، Codex را اجرا می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                                                                                                                                                                                                                                                                                       |
| `command`                                     | باینری مدیریت‌شدهٔ Codex                               | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده، آن را تنظیم‌نشده بگذارید؛ فقط برای یک بازنویسی صریح تنظیمش کنید.                                                                                                                                                                                                                                                                       |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌های انتقال stdio.                                                                                                                                                                                                                                                                                                                                                                                 |
| `url`                                         | تنظیم‌نشده                                             | نشانی URL سرور برنامهٔ WebSocket.                                                                                                                                                                                                                                                                                                                                                                         |
| `authToken`                                   | تنظیم‌نشده                                             | توکن Bearer برای انتقال WebSocket. یک رشتهٔ لفظی یا SecretInput مانند `${CODEX_APP_SERVER_TOKEN}` را می‌پذیرد.                                                                                                                                                                                                                                                                                            |
| `headers`                                     | `{}`                                                   | سرآیندهای اضافی WebSocket. مقادیر سرآیند رشته‌های لفظی یا مقادیر SecretInput را می‌پذیرند، برای مثال `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                    |
| `clearEnv`                                    | `[]`                                                   | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw، از فرایند app-server مربوط به stdio که اجرا شده حذف می‌شوند. OpenClaw برای اجراهای محلی، `CODEX_HOME` مختص هر عامل و `HOME` ارث‌بری‌شده را نگه می‌دارد.                                                                                                                                                                   |
| `codeModeOnly`                                | `false`                                                | سطح ابزار فقط-حالت-کد Codex را فعال می‌کند. ابزارهای پویای OpenClaw همچنان در Codex ثبت می‌مانند تا فراخوانی‌های تودرتوی `tools.*` از طریق پل `item/tool/call` در app-server برگردند.                                                                                                                                                                                                                    |
| `remoteWorkspaceRoot`                         | تنظیم‌نشده                                             | ریشهٔ فضای کاری app-server راه‌دور Codex. وقتی تنظیم شود، OpenClaw ریشهٔ فضای کاری محلی را از فضای کاری حل‌شدهٔ OpenClaw استنتاج می‌کند، پسوند cwd فعلی را زیر این ریشهٔ راه‌دور حفظ می‌کند، و فقط cwd نهایی app-server را به Codex می‌فرستد. اگر cwd بیرون از ریشهٔ فضای کاری حل‌شدهٔ OpenClaw باشد، OpenClaw به‌جای ارسال یک مسیر محلی Gateway به app-server راه‌دور، fail closed می‌شود. |
| `requestTimeoutMs`                            | `60000`                                                | زمان‌پایان برای فراخوانی‌های صفحهٔ کنترل app-server.                                                                                                                                                                                                                                                                                                                                                      |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | پنجرهٔ سکوت پس از اینکه Codex یک نوبت را می‌پذیرد، یا پس از یک درخواست app-server با دامنهٔ نوبت، در حالی که OpenClaw منتظر `turn/completed` است.                                                                                                                                                                                                                                                       |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | محافظ بیکاری تکمیل و پیشرفت که پس از واگذاری ابزار، تکمیل ابزار بومی، پیشرفت خام دستیار پس از ابزار، تکمیل استدلال خام، یا پیشرفت استدلال استفاده می‌شود، در حالی که OpenClaw منتظر `turn/completed` است. از این گزینه برای بارهای کاری قابل اعتماد یا سنگین استفاده کنید که در آن‌ها ترکیب پس از ابزار می‌تواند به‌طور موجه بیشتر از بودجهٔ انتشار نهایی دستیار ساکت بماند.                 |
| `mode`                                        | `"yolo"` مگر اینکه الزامات Codex محلی YOLO را مجاز ندانند | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط نگهبان. الزامات stdio محلی که `danger-full-access`، تأیید `never`، یا بازبین `user` را حذف کنند، پیش‌فرض ضمنی را نگهبان می‌کنند.                                                                                                                                                                                                                     |
| `approvalPolicy`                              | `"never"` یا یک سیاست تأیید مجاز نگهبان                | سیاست تأیید بومی Codex که به شروع/ازسرگیری/نوبت رشته فرستاده می‌شود. پیش‌فرض‌های نگهبان، وقتی مجاز باشد، `"on-request"` را ترجیح می‌دهند.                                                                                                                                                                                                                                                               |
| `sandbox`                                     | `"danger-full-access"` یا یک سندباکس مجاز نگهبان       | حالت سندباکس بومی Codex که به شروع/ازسرگیری رشته فرستاده می‌شود. پیش‌فرض‌های نگهبان، وقتی مجاز باشد، `"workspace-write"` را ترجیح می‌دهند، وگرنه `"read-only"`. وقتی سندباکس OpenClaw فعال است، نوبت‌های `danger-full-access` از `workspace-write` در Codex استفاده می‌کنند و دسترسی شبکه از تنظیم خروجی سندباکس OpenClaw مشتق می‌شود.                                                             |
| `approvalsReviewer`                           | `"user"` یا یک بازبین مجاز نگهبان                      | از `"auto_review"` استفاده کنید تا Codex، وقتی مجاز باشد، درخواست‌های تأیید بومی را بازبینی کند؛ در غیر این صورت `guardian_subagent` یا `user`. `guardian_subagent` همچنان یک نام مستعار قدیمی است.                                                                                                                                                                                                      |
| `serviceTier`                                 | تنظیم‌نشده                                             | ردهٔ سرویس اختیاری app-server در Codex. `"priority"` مسیریابی حالت سریع را فعال می‌کند، `"flex"` پردازش flex را درخواست می‌کند، `null` بازنویسی را پاک می‌کند، و `"fast"` قدیمی به‌عنوان `"priority"` پذیرفته می‌شود.                                                                                                                                                                                  |
| `networkProxy`                                | غیرفعال                                                | شبکه‌سازی پروفایل مجوزهای Codex را برای فرمان‌های app-server فعال می‌کند. OpenClaw به‌جای فرستادن `sandbox`، پیکربندی `permissions.<profile>.network` انتخاب‌شده را تعریف می‌کند و آن را با `default_permissions` انتخاب می‌کند.                                                                                                                                                                     |
| `experimental.sandboxExecServer`              | `false`                                                | فعال‌سازی آزمایشی پیش‌نمایش که یک محیط Codex با پشتوانهٔ سندباکس OpenClaw را در Codex app-server نسخهٔ 0.132.0 یا جدیدتر ثبت می‌کند تا اجرای بومی Codex بتواند داخل سندباکس فعال OpenClaw اجرا شود.                                                                                                                                                                                                    |

`appServer.networkProxy` صریح است، چون قرارداد سندباکس Codex را تغییر می‌دهد.
وقتی فعال باشد، OpenClaw همچنین `features.network_proxy.enabled` و
`default_permissions` را در پیکربندی رشتهٔ Codex تنظیم می‌کند تا پروفایل
مجوز تولیدشده بتواند شبکه‌سازی مدیریت‌شدهٔ Codex را شروع کند. به‌طور پیش‌فرض،
OpenClaw نام پروفایل مقاوم در برابر برخورد `openclaw-network-<fingerprint>` را
از بدنهٔ پروفایل تولید می‌کند؛ فقط زمانی از `profileName` استفاده کنید که یک
نام محلی پایدار لازم باشد.

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
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
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

اگر زمان اجرای عادی app-server برابر `danger-full-access` باشد، فعال‌کردن
`networkProxy` از دسترسی فایل‌سیستم به سبک workspace برای پروفایل مجوز
تولیدشده استفاده می‌کند. اعمال شبکهٔ مدیریت‌شدهٔ Codex، شبکه‌سازی سندباکس‌شده
است، بنابراین یک پروفایل دسترسی کامل از ترافیک خروجی محافظت نمی‌کند.
ورودی‌های دامنه از `allow` یا `deny` استفاده می‌کنند؛ ورودی‌های سوکت یونیکس از
مقادیر `allow` یا `none` مربوط به Codex استفاده می‌کنند.

فراخوانی‌های ابزار پویا که مالکیتشان با OpenClaw است، مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: درخواست‌های Codex `item/tool/call` به‌طور پیش‌فرض از یک نگهبان ۹۰ ثانیه‌ای
OpenClaw استفاده می‌کنند. آرگومان مثبت `timeoutMs` برای هر فراخوانی، بودجه همان ابزار مشخص را افزایش یا کاهش می‌دهد. ابزار `image_generate` وقتی فراخوانی ابزار زمان‌پایان خودش را ارائه نکند، از
`agents.defaults.imageGenerationModel.timeoutMs` استفاده می‌کند، وگرنه از پیش‌فرض ۱۲۰ ثانیه‌ای تولید تصویر استفاده می‌شود.
ابزار `image` برای درک رسانه از
`tools.media.image.timeoutSeconds` یا پیش‌فرض ۶۰ ثانیه‌ای رسانه استفاده می‌کند. برای درک تصویر، این زمان‌پایان روی خود درخواست اعمال می‌شود و با کارهای آماده‌سازی قبلی کاهش نمی‌یابد. بودجه‌های ابزار پویا حداکثر تا 600000 ms محدود می‌شوند. هنگام زمان‌پایان، OpenClaw در صورت پشتیبانی سیگنال ابزار را قطع می‌کند و یک پاسخ ابزار پویای ناموفق به Codex برمی‌گرداند تا نوبت بتواند ادامه پیدا کند، به‌جای اینکه نشست در وضعیت `processing` باقی بماند.
این نگهبان، بودجه بیرونی `item/tool/call` پویا است؛ زمان‌پایان‌های درخواست مخصوص ارائه‌دهنده داخل همان فراخوانی اجرا می‌شوند و معناشناسی زمان‌پایان خودشان را حفظ می‌کنند.

پس از اینکه Codex یک نوبت را می‌پذیرد، و پس از اینکه OpenClaw به یک درخواست سرور برنامه محدود به نوبت پاسخ می‌دهد، هارنس انتظار دارد Codex در نوبت جاری پیشرفت کند و در نهایت نوبت بومی را با `turn/completed` پایان دهد. اگر سرور برنامه به‌مدت `appServer.turnCompletionIdleTimeoutMs` ساکت بماند، OpenClaw به‌صورت بهترین تلاش نوبت Codex را قطع می‌کند، یک زمان‌پایان تشخیصی ثبت می‌کند، و مسیر نشست OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی پشت یک نوبت بومی کهنه در صف نمانند. بیشتر اعلان‌های غیرپایانی برای همان نوبت، آن نگهبان کوتاه را غیرفعال می‌کنند، چون Codex ثابت کرده که نوبت هنوز زنده است. واگذاری‌های ابزار از بودجه بیکاری طولانی‌تری پس از ابزار استفاده می‌کنند: پس از اینکه OpenClaw یک پاسخ `item/tool/call` برمی‌گرداند، پس از تکمیل آیتم‌های ابزار بومی مانند `commandExecution`، پس از تکمیل‌های خام `custom_tool_call_output`، و پس از پیشرفت خام دستیار پس از ابزار، تکمیل‌های خام استدلال، یا پیشرفت استدلال. این محافظ، وقتی پیکربندی شده باشد، از
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` استفاده می‌کند و در غیر این صورت به‌طور پیش‌فرض پنج دقیقه است. همین بودجه پس از ابزار همچنین نگهبان پیشرفت را برای پنجره ترکیب بی‌صدا پیش از اینکه Codex رویداد بعدی نوبت جاری را منتشر کند، تمدید می‌کند. اعلان‌های سراسری سرور برنامه، مانند به‌روزرسانی‌های محدودیت نرخ، پیشرفت بیکاری نوبت را بازنشانی نمی‌کنند. تکمیل‌های استدلال، تکمیل‌های توضیحی `agentMessage`، و پیشرفت خام استدلال یا دستیار پیش از ابزار می‌توانند با یک پاسخ نهایی خودکار دنبال شوند، بنابراین به‌جای آزاد کردن فوری مسیر نشست از محافظ پاسخ پس از پیشرفت استفاده می‌کنند. فقط آیتم‌های `agentMessage` نهایی/غیرتوضیحی تکمیل‌شده و تکمیل‌های خام دستیار پیش از ابزار، آزادسازی خروجی دستیار را مسلح می‌کنند: اگر Codex سپس بدون `turn/completed` ساکت شود، OpenClaw به‌صورت بهترین تلاش نوبت بومی را قطع می‌کند و مسیر نشست را آزاد می‌کند. خرابی‌های سرور برنامه stdio که برای بازپخش ایمن هستند، از جمله زمان‌پایان‌های بیکاری تکمیل نوبت بدون شواهد دستیار، ابزار، آیتم فعال، یا اثر جانبی، یک‌بار در یک تلاش تازه سرور برنامه دوباره امتحان می‌شوند. زمان‌پایان‌های ناایمن همچنان کلاینت سرور برنامه گیرکرده را بازنشسته می‌کنند و مسیر نشست OpenClaw را آزاد می‌کنند. آن‌ها همچنین اتصال کهنه رشته بومی را پاک می‌کنند، به‌جای اینکه به‌طور خودکار بازپخش شوند. زمان‌پایان‌های پایش تکمیل، متن زمان‌پایان مخصوص Codex را نشان می‌دهند: موارد ایمن برای بازپخش می‌گویند پاسخ ممکن است ناقص باشد، درحالی‌که موارد ناایمن به کاربر می‌گویند پیش از تلاش دوباره وضعیت جاری را بررسی کند. تشخیص‌های عمومی زمان‌پایان شامل فیلدهای ساختاری مانند آخرین روش اعلان سرور برنامه، شناسه/نوع/نقش آیتم پاسخ خام دستیار، تعداد درخواست‌ها/آیتم‌های فعال، و وضعیت پایش مسلح‌شده هستند. وقتی آخرین اعلان یک آیتم پاسخ خام دستیار باشد، یک پیش‌نمایش محدود از متن دستیار را هم شامل می‌شوند. آن‌ها محتوای خام پرامپت یا ابزار را شامل نمی‌شوند.

بازنویسی‌های محیطی برای آزمایش محلی همچنان در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` وقتی
`appServer.command` تنظیم نشده باشد، باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای آزمایش محلی یک‌باره از
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. پیکربندی برای استقرارهای تکرارپذیر ترجیح داده می‌شود، چون رفتار Plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد که بقیه راه‌اندازی هارنس Codex در آن قرار دارد.

## Pluginهای بومی Codex

پشتیبانی Plugin بومی Codex از قابلیت‌های خود برنامه و Plugin سرور برنامه Codex در همان رشته Codex مربوط به نوبت هارنس OpenClaw استفاده می‌کند. OpenClaw، Pluginهای Codex را به ابزارهای پویای مصنوعی `codex_plugin_*` در OpenClaw ترجمه نمی‌کند.

`codexPlugins` فقط روی نشست‌هایی اثر می‌گذارد که هارنس بومی Codex را انتخاب می‌کنند. روی اجراهای هارنس داخلی، اجراهای عادی ارائه‌دهنده OpenAI، اتصال‌های گفت‌وگوی ACP، یا هارنس‌های دیگر اثری ندارد.

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
            allow_destructive_actions: true,
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

پیکربندی برنامه رشته زمانی محاسبه می‌شود که OpenClaw یک نشست هارنس Codex برقرار کند یا یک اتصال کهنه رشته Codex را جایگزین کند. این پیکربندی در هر نوبت دوباره محاسبه نمی‌شود.
پس از تغییر `codexPlugins`، از `/new`، `/reset` استفاده کنید، یا Gateway را دوباره راه‌اندازی کنید تا نشست‌های آینده هارنس Codex با مجموعه برنامه به‌روزشده شروع شوند.

برای شرایط مهاجرت، موجودی برنامه، سیاست اقدام‌های مخرب،
درخواست‌های دریافت اطلاعات، و تشخیص‌های Plugin بومی، به
[Pluginهای بومی Codex](/fa/plugins/codex-native-plugins) مراجعه کنید.

دسترسی برنامه و Plugin در سمت OpenAI توسط حساب واردشده Codex و، برای فضاهای کاری Business و Enterprise/Edu، کنترل‌های برنامه فضای کاری کنترل می‌شود. برای مرور کلی حساب و کنترل‌های فضای کاری OpenAI، به
[استفاده از Codex با طرح ChatGPT خود](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
مراجعه کنید.

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی خودش پوشش داده شده است:
[استفاده از رایانه در Codex](/fa/plugins/codex-computer-use).

خلاصه کوتاه: OpenClaw برنامه کنترل دسکتاپ را در خود جای نمی‌دهد و خودش اقدام‌های دسکتاپ را اجرا نمی‌کند. سرور برنامه Codex را آماده می‌کند، بررسی می‌کند که سرور MCP مربوط به
`computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex مالک فراخوانی‌های ابزار MCP بومی در طول نوبت‌های حالت Codex باشد.

## مرزهای زمان اجرا

هارنس Codex فقط اجراکننده عامل تعبیه‌شده سطح پایین را تغییر می‌دهد.

- ابزارهای پویای OpenClaw پشتیبانی می‌شوند. Codex از OpenClaw می‌خواهد آن ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.
- ابزارهای پوسته، وصله، MCP، و برنامه بومی مخصوص Codex در مالکیت Codex هستند.
  OpenClaw می‌تواند از طریق رله پشتیبانی‌شده رویدادهای بومی منتخب را مشاهده یا مسدود کند، اما آرگومان‌های ابزار بومی را بازنویسی نمی‌کند.
- Codex مالک Compaction بومی است. OpenClaw یک آینه رونوشت برای تاریخچه کانال، جست‌وجو، `/new`، `/reset`، و تغییر مدل یا هارنس در آینده نگه می‌دارد، اما Compaction مربوط به Codex را با خلاصه‌ساز OpenClaw یا موتور زمینه جایگزین نمی‌کند.
- تولید رسانه، درک رسانه، TTS، تأییدها، و خروجی ابزار پیام‌رسانی همچنان از مسیر تنظیمات ارائه‌دهنده/مدل متناظر OpenClaw عبور می‌کنند.
- `tool_result_persist` روی نتایج ابزار رونوشت که مالکیتشان با OpenClaw است اعمال می‌شود، نه رکوردهای نتیجه ابزار بومی Codex.

برای لایه‌های هوک، سطوح V1 پشتیبانی‌شده، مدیریت مجوز بومی، هدایت صف، سازوکارهای بارگذاری بازخورد Codex، و جزئیات Compaction، به
[زمان اجرای هارنس Codex](/fa/plugins/codex-harness-runtime) مراجعه کنید.

## عیب‌یابی

**Codex به‌عنوان یک ارائه‌دهنده عادی `/model` ظاهر نمی‌شود:** این برای پیکربندی‌های جدید مورد انتظار است. یک مدل `openai/gpt-*` انتخاب کنید، `plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید آیا `plugins.allow`، `codex` را مستثنی می‌کند یا نه.

**OpenClaw به‌جای Codex از هارنس داخلی استفاده می‌کند:** مطمئن شوید ارجاع مدل روی ارائه‌دهنده رسمی OpenAI برابر `openai/gpt-*` است و Plugin مربوط به Codex نصب و فعال شده است. اگر هنگام آزمایش به اثبات سخت‌گیرانه نیاز دارید، `agentRuntime.id: "codex"` را برای ارائه‌دهنده یا مدل تنظیم کنید. زمان اجرای اجباری Codex به‌جای بازگشت به OpenClaw شکست می‌خورد.

**زمان اجرای OpenAI Codex به مسیر کلید API بازمی‌گردد:** یک گزیده ویرایش‌شده از Gateway جمع‌آوری کنید که مدل، زمان اجرا، ارائه‌دهنده انتخاب‌شده، و خرابی را نشان دهد.
از همکاران متأثر بخواهید این فرمان فقط‌خواندنی را روی میزبان OpenClaw خود اجرا کنند:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

گزیده‌های مفید معمولاً شامل `openai/gpt-5.5` یا `openai/gpt-5.4`،
`Runtime: OpenAI Codex`، `agentRuntime.id` یا `harnessRuntime`،
`candidateProvider: "openai"`، و نتیجه `401`، `Incorrect API key`، یا
`No API key` هستند. یک اجرای اصلاح‌شده باید مسیر OAuth مربوط به OpenAI را به‌جای خرابی ساده کلید API OpenAI نشان دهد.

**پیکربندی ارجاع‌های مدل قدیمی Codex باقی مانده است:** `openclaw doctor --fix` را اجرا کنید.
Doctor ارجاع‌های مدل قدیمی را به `openai/*` بازنویسی می‌کند، پین‌های کهنه نشست و زمان اجرای کل عامل را حذف می‌کند، و بازنویسی‌های نمایه احراز هویت موجود را حفظ می‌کند.

**سرور برنامه رد می‌شود:** از سرور برنامه Codex نسخه `0.125.0` یا جدیدتر استفاده کنید.
پیش‌انتشارهای همان نسخه یا نسخه‌های دارای پسوند ساخت مانند
`0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون OpenClaw کف پروتکل پایدار `0.125.0` را آزمایش می‌کند.

**`/codex status` نمی‌تواند وصل شود:** بررسی کنید Plugin بسته‌بندی‌شده `codex` فعال باشد، وقتی یک فهرست مجاز پیکربندی شده است `plugins.allow` آن را شامل شود، و هر `appServer.command`، `url`، `authToken`، یا هدر سفارشی معتبر باشد.

**کشف مدل کند است:** مقدار
`plugins.entries.codex.config.discovery.timeoutMs` را کاهش دهید یا کشف را غیرفعال کنید. به
[مرجع هارنس Codex](/fa/plugins/codex-harness-reference#model-discovery) مراجعه کنید.

**انتقال WebSocket فوراً شکست می‌خورد:** `appServer.url`، `authToken`، هدرها، و اینکه سرور برنامه راه‌دور همان نسخه پروتکل سرور برنامه Codex را صحبت می‌کند بررسی کنید.

**ابزارهای پوسته یا وصله بومی با `Native hook relay unavailable` مسدود می‌شوند:**
رشته Codex هنوز تلاش می‌کند از یک شناسه رله هوک بومی استفاده کند که OpenClaw دیگر آن را ثبت‌شده ندارد. این یک مشکل انتقال هوک بومی Codex است، نه خرابی پشتانه ACP، ارائه‌دهنده، GitHub، یا فرمان پوسته. در گفت‌وگوی متأثر با `/new` یا `/reset` یک نشست تازه شروع کنید، سپس یک فرمان بی‌خطر را دوباره امتحان کنید. اگر آن یک‌بار کار کرد اما فراخوانی ابزار بومی بعدی دوباره شکست خورد، `/new` را فقط یک راه‌حل موقت بدانید: پس از راه‌اندازی دوباره سرور برنامه Codex یا OpenClaw Gateway، پرامپت را در یک نشست تازه کپی کنید تا رشته‌های قدیمی کنار گذاشته شوند و ثبت‌های هوک بومی دوباره ساخته شوند.

**یک مدل غیر Codex از هارنس داخلی استفاده می‌کند:** این مورد انتظار است مگر اینکه سیاست زمان اجرای ارائه‌دهنده یا مدل آن را به هارنس دیگری هدایت کند. ارجاع‌های ساده ارائه‌دهنده غیر OpenAI در حالت `auto` روی مسیر عادی ارائه‌دهنده خودشان باقی می‌مانند.

**Computer Use نصب شده است اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه
`/codex computer-use status` را بررسی کنید. اگر ابزاری
`Native hook relay unavailable` را گزارش کرد، از بازیابی رله هوک بومی در بالا استفاده کنید. ببینید:
[Codex Computer Use](/fa/plugins/codex-computer-use#troubleshooting).

## مرتبط

- [مرجع هارنس Codex](/fa/plugins/codex-harness-reference)
- [زمان اجرای هارنس Codex](/fa/plugins/codex-harness-runtime)
- [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)
- [Codex Computer Use](/fa/plugins/codex-computer-use)
- [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [ارائه‌دهنده OpenAI](/fa/providers/openai)
- [راهنمای OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Pluginهای هارنس عامل](/fa/plugins/sdk-agent-harness)
- [هوک‌های Plugin](/fa/plugins/hooks)
- [برون‌برد عیب‌یابی](/fa/gateway/diagnostics)
- [وضعیت](/fa/cli/status)
- [آزمایش](/fa/help/testing-live#live-codex-app-server-harness-smoke)

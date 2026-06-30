---
read_when:
    - می‌خواهید از هارنس app-server همراه Codex استفاده کنید
    - به نمونه‌های پیکربندی harness در Codex نیاز دارید
    - می‌خواهید استقرارهای فقطِ Codex به‌جای بازگشت به OpenClaw با شکست مواجه شوند
summary: اجرای نوبت‌های عامل تعبیه‌شده OpenClaw از طریق چارچوب app-server بسته‌بندی‌شده Codex
title: مهار Codex
x-i18n:
    generated_at: "2026-06-30T14:19:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw اجازه می‌دهد نوبت‌های عامل OpenAI تعبیه‌شده را
به‌جای harness داخلی OpenClaw، از طریق app-serverِ Codex اجرا کند.

وقتی می‌خواهید Codex مالک نشست سطح‌پایین عامل باشد، از harnessِ Codex استفاده کنید:
ازسرگیری بومی رشته گفتگو، ادامه ابزار بومی، Compaction بومی، و اجرای
app-server. OpenClaw همچنان مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل،
ابزارهای پویای OpenClaw، تأییدها، تحویل رسانه، و آینه قابل‌مشاهده رونوشت است.

راه‌اندازی معمول از ارجاع‌های متعارف مدل OpenAI مانند `openai/gpt-5.5` استفاده می‌کند.
ارجاع‌های GPT قدیمی Codex را پیکربندی نکنید. ترتیب احراز هویت عامل OpenAI را
زیر `auth.order.openai` قرار دهید؛ شناسه‌های قدیمی پروفایل احراز هویت Codex و
ورودی‌های قدیمی ترتیب احراز هویت Codex، وضعیت قدیمی هستند که با
`openclaw doctor --fix` ترمیم می‌شوند.

وقتی هیچ sandboxای از OpenClaw فعال نباشد، OpenClaw رشته‌های app-serverِ Codex را
با حالت کد بومی Codex روشن شروع می‌کند، در حالی که code-mode-only را به‌صورت پیش‌فرض خاموش نگه می‌دارد.
این کار قابلیت‌های فضای کاری و کد بومی Codex را در دسترس نگه می‌دارد، در حالی که
ابزارهای پویای OpenClaw از طریق پل `item/tool/call` در app-server ادامه می‌دهند.
sandboxing فعال OpenClaw و سیاست‌های محدود ابزار، حالت کد بومی را
کاملاً غیرفعال می‌کنند مگر این‌که وارد مسیر آزمایشی exec-server برای sandbox شوید.

این قابلیت بومی Codex از
[حالت کد OpenClaw](/fa/reference/code-mode) جدا است؛ آن یک runtime اختیاری QuickJS-WASI
برای اجراهای عمومی OpenClaw با شکل ورودی متفاوت `exec` است.

برای تفکیک گسترده‌تر مدل/ارائه‌دهنده/runtime، از
[runtimeهای عامل](/fa/concepts/agent-runtimes) شروع کنید. نسخه کوتاه این است:
`openai/gpt-5.5` ارجاع مدل است، `codex` runtime است، و Telegram،
Discord، Slack، یا کانالی دیگر سطح ارتباطی باقی می‌ماند.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس.
- اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را هم در آن بگنجانید.
- app-serverِ Codex نسخه `0.125.0` یا جدیدتر. Plugin همراه به‌صورت پیش‌فرض یک
  باینری سازگار app-serverِ Codex را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex` در `PATH`
  روی شروع معمول harness اثر نمی‌گذارند.
- احراز هویت Codex از طریق `openclaw models auth login --provider openai`،
  یک حساب app-server در خانه Codex عامل، یا یک پروفایل احراز هویت صریح کلید APIِ Codex در دسترس باشد.

برای تقدم احراز هویت، ایزوله‌سازی محیط، فرمان‌های سفارشی app-server، کشف مدل،
و همه فیلدهای پیکربندی، ببینید:
[مرجع harnessِ Codex](/fa/plugins/codex-harness-reference).

## شروع سریع

بیشتر کاربرانی که Codex را در OpenClaw می‌خواهند، این مسیر را می‌خواهند: با یک
اشتراک ChatGPT/Codex وارد شوید، Plugin همراه `codex` را فعال کنید، و از یک
ارجاع متعارف مدل `openai/gpt-*` استفاده کنید.

با OAuthِ Codex وارد شوید:

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
از قبل نشست دارد، پیش از آزمایش تغییرات runtime از `/new` یا `/reset` استفاده کنید تا
نوبت بعدی harness را از پیکربندی فعلی resolve کند.

## پیکربندی

پیکربندی شروع سریع، حداقل پیکربندی قابل استفاده برای harnessِ Codex است. گزینه‌های
harnessِ Codex را در پیکربندی OpenClaw تنظیم کنید، و از CLI فقط برای احراز هویت Codex استفاده کنید:

| نیاز                                   | تنظیم                                                                             | محل                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| فعال کردن harness                     | `plugins.entries.codex.enabled: true`                                            | پیکربندی OpenClaw                  |
| نگه داشتن نصب Plugin در allowlist     | گنجاندن `codex` در `plugins.allow`                                               | پیکربندی OpenClaw                  |
| مسیریابی نوبت‌های عامل OpenAI از طریق Codex | `agents.defaults.model` یا `agents.list[].model` به‌صورت `openai/gpt-*`          | پیکربندی عامل OpenClaw             |
| ورود با OAuthِ ChatGPT/Codex           | `openclaw models auth login --provider openai`                                   | پروفایل احراز هویت CLI             |
| افزودن پشتیبان کلید API برای اجراهای Codex | پروفایل کلید APIِ `openai:*` که بعد از احراز هویت اشتراکی در `auth.order.openai` فهرست شده باشد | پروفایل احراز هویت CLI + پیکربندی OpenClaw |
| شکست بسته وقتی Codex در دسترس نیست    | `agentRuntime.id: "codex"` در ارائه‌دهنده یا مدل                                 | پیکربندی مدل/ارائه‌دهنده OpenClaw |
| استفاده از ترافیک مستقیم APIِ OpenAI  | `agentRuntime.id: "openclaw"` در ارائه‌دهنده یا مدل با احراز هویت معمول OpenAI  | پیکربندی مدل/ارائه‌دهنده OpenClaw |
| تنظیم رفتار app-server                | `plugins.entries.codex.config.appServer.*`                                       | پیکربندی Pluginِ Codex             |
| فعال کردن برنامه‌های بومی Pluginِ Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | پیکربندی Pluginِ Codex             |
| فعال کردن Codex Computer Use          | `plugins.entries.codex.config.computerUse.*`                                     | پیکربندی Pluginِ Codex             |

برای نوبت‌های عامل OpenAI که با Codex پشتیبانی می‌شوند، از ارجاع‌های مدل `openai/gpt-*` استفاده کنید. برای
ترتیب «اول اشتراک/پشتیبان کلید API»، `auth.order.openai` را ترجیح دهید. شناسه‌های موجود
پروفایل احراز هویت قدیمی Codex و ترتیب احراز هویت قدیمی Codex فقط وضعیت قدیمی مخصوص doctor هستند؛
ارجاع‌های جدید GPT قدیمی Codex ننویسید.

روی عامل‌های پشتیبانی‌شده با Codex، `compaction.model` یا `compaction.provider` را تنظیم نکنید.
Codex از طریق وضعیت رشته بومی app-server خود compact می‌کند، بنابراین OpenClaw این
بازنویسی‌های خلاصه‌ساز محلی را در زمان اجرا نادیده می‌گیرد و وقتی عامل از Codex استفاده می‌کند
`openclaw doctor --fix` آن‌ها را حذف می‌کند.

Lossless همچنان به‌عنوان موتور زمینه برای assemble، ingestion، و
نگه‌داری پیرامون نوبت‌های Codex پشتیبانی می‌شود. آن را از طریق
`plugins.slots.contextEngine: "lossless-claw"` و
`plugins.entries.lossless-claw.config.summaryModel` پیکربندی کنید، نه از طریق
`agents.defaults.compaction.provider`. وقتی Codex runtime فعال است، `openclaw doctor --fix` شکل قدیمی
`compaction.provider: "lossless-claw"` را به اسلات موتور زمینه Lossless مهاجرت می‌دهد،
اما Codex بومی همچنان مالک Compaction است.

harness بومی app-serverِ Codex از موتورهای زمینه‌ای پشتیبانی می‌کند که به
assemble پیش از prompt نیاز دارند. backendهای عمومی CLI، از جمله `codex-cli`، این
قابلیت میزبان را فراهم نمی‌کنند.

برای عامل‌های پشتیبانی‌شده با Codex، `/compact`، Compaction بومی app-serverِ Codex را روی
رشته متصل شروع می‌کند. OpenClaw منتظر تکمیل نمی‌ماند، timeoutِ OpenClaw اعمال نمی‌کند،
app-server مشترک را دوباره راه‌اندازی نمی‌کند، و به موتور زمینه یا
خلاصه‌ساز عمومی OpenAI fallback نمی‌کند. اگر اتصال رشته بومی Codex گم شده یا
کهنه باشد، فرمان به‌صورت بسته شکست می‌خورد تا اپراتور مرز واقعی runtime را ببیند
به‌جای این‌که backendهای Compaction بی‌صدا عوض شوند.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

در این شکل، هر دو پروفایل همچنان برای نوبت‌های عامل `openai/gpt-*` از طریق Codex اجرا می‌شوند.
کلید API فقط fallback احراز هویت است، نه درخواستی برای تغییر به OpenClaw یا
OpenAI Responses ساده.

باقی این صفحه گونه‌های رایجی را پوشش می‌دهد که کاربران باید بینشان انتخاب کنند:
شکل استقرار، مسیریابی با شکست بسته، سیاست تأیید guardian، Pluginهای بومی Codex،
و Computer Use. برای فهرست کامل گزینه‌ها، پیش‌فرض‌ها، enumها، کشف،
ایزوله‌سازی محیط، timeoutها، و فیلدهای انتقال app-server، ببینید:
[مرجع harnessِ Codex](/fa/plugins/codex-harness-reference).

## تأیید runtimeِ Codex

در چتی که انتظار Codex دارید از `/status` استفاده کنید. یک نوبت عامل OpenAI که با Codex پشتیبانی می‌شود
نشان می‌دهد:

```text
Runtime: OpenAI Codex
```

سپس وضعیت app-serverِ Codex را بررسی کنید:

```text
/codex status
/codex models
```

`/codex status` اتصال app-server، حساب، محدودیت‌های نرخ، سرورهای MCP،
و skills را گزارش می‌کند. `/codex models` کاتالوگ زنده app-serverِ Codex را برای
harness و حساب فهرست می‌کند. اگر `/status` غیرمنتظره است، ببینید:
[عیب‌یابی](#troubleshooting).

## مسیریابی و انتخاب مدل

ارجاع‌های ارائه‌دهنده و سیاست runtime را جدا نگه دارید:

- برای نوبت‌های عامل OpenAI از طریق Codex از `openai/gpt-*` استفاده کنید.
- از ارجاع‌های GPT قدیمی Codex در پیکربندی استفاده نکنید. برای ترمیم ارجاع‌های قدیمی و pinهای مسیر نشست کهنه،
  `openclaw doctor --fix` را اجرا کنید.
- `agentRuntime.id: "codex"` برای حالت خودکار معمول OpenAI اختیاری است، اما وقتی
  یک استقرار باید در صورت در دسترس نبودن Codex به‌صورت بسته شکست بخورد مفید است.
- `agentRuntime.id: "openclaw"` یک ارائه‌دهنده یا مدل را، وقتی عمدی باشد، وارد runtime تعبیه‌شده OpenClaw می‌کند.
- `/codex ...` گفتگوهای بومی app-serverِ Codex را از چت کنترل می‌کند.
- ACP/acpx یک مسیر harness خارجی جداگانه است. فقط وقتی کاربر
  ACP/acpx یا آداپتور harness خارجی می‌خواهد از آن استفاده کنید.

مسیریابی فرمان‌های رایج:

| نیت کاربر                                             | استفاده                                                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| اتصال چت فعلی                                        | `/codex bind [--cwd <path>]`                                                                          |
| ازسرگیری یک رشته موجود Codex                         | `/codex resume <thread-id>`                                                                           |
| فهرست کردن یا فیلتر کردن رشته‌های Codex              | `/codex threads [filter]`                                                                             |
| فهرست کردن Pluginهای بومی Codex                      | `/codex plugins list`                                                                                 |
| فعال یا غیرفعال کردن یک Plugin بومی پیکربندی‌شده Codex | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| اتصال یک نشست موجود Codex CLI روی یک گره جفت‌شده    | `/codex sessions --host <node> [filter]`, سپس `/codex resume <session-id> --host <node> --bind here` |
| فقط ارسال بازخورد Codex                              | `/codex diagnostics [note]`                                                                           |
| شروع یک وظیفه ACP/acpx                               | فرمان‌های نشست ACP/acpx، نه `/codex`                                                                 |

| مورد استفاده                                             | پیکربندی                                                              | راستی‌آزمایی                                  | یادداشت‌ها                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| اشتراک ChatGPT/Codex با زمان اجرای بومی Codex | `openai/gpt-*` به‌همراه Plugin فعال‌شده `codex`                             | `/status` نشان می‌دهد `Runtime: OpenAI Codex` | مسیر پیشنهادی                      |
| اگر Codex در دسترس نبود، به‌صورت بسته شکست بخورد                  | ارائه‌دهنده یا مدل `agentRuntime.id: "codex"`                           | نوبت به‌جای جایگزین تعبیه‌شده شکست می‌خورد | برای استقرارهای فقط Codex استفاده کنید        |
| هدایت ترافیک مستقیم کلید API OpenAI از طریق OpenClaw       | ارائه‌دهنده یا مدل `agentRuntime.id: "openclaw"` و احراز هویت معمول OpenAI | `/status` زمان اجرای OpenClaw را نشان می‌دهد        | فقط وقتی استفاده کنید که OpenClaw عمدی باشد |
| پیکربندی قدیمی                                        | ارجاع‌های قدیمی Codex GPT                                                  | `openclaw doctor --fix` آن را بازنویسی می‌کند     | پیکربندی جدید را به این شکل ننویسید      |
| آداپتور ACP/acpx Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                               | وضعیت کار/نشست ACP                 | جدا از هارنس بومی Codex    |

`agents.defaults.imageModel` از همان جداسازی پیشوند پیروی می‌کند. برای مسیر
معمول OpenAI از `openai/gpt-*` استفاده کنید و فقط وقتی که درک تصویر باید از
طریق یک نوبت محدود سرور برنامه Codex اجرا شود از `codex/gpt-*` استفاده کنید.
از ارجاع‌های قدیمی Codex GPT استفاده نکنید؛ doctor آن پیشوند قدیمی را به
`openai/gpt-*` بازنویسی می‌کند.

## الگوهای استقرار

### استقرار پایه Codex

وقتی همه نوبت‌های عامل OpenAI باید به‌طور پیش‌فرض از Codex استفاده کنند، از
پیکربندی شروع سریع استفاده کنید.

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

### استقرار با ارائه‌دهنده ترکیبی

این شکل، Claude را به‌عنوان عامل پیش‌فرض نگه می‌دارد و یک عامل Codex نام‌دار
اضافه می‌کند:

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

با این پیکربندی، عامل `main` از مسیر معمول ارائه‌دهنده خود استفاده می‌کند و
عامل `codex` از سرور برنامه Codex استفاده می‌کند.

### استقرار Codex با شکست بسته

برای نوبت‌های عامل OpenAI، وقتی Plugin همراه در دسترس باشد، `openai/gpt-*`
از قبل به Codex نگاشت می‌شود. وقتی یک قاعده مکتوب برای شکست بسته می‌خواهید،
سیاست زمان اجرای صریح اضافه کنید:

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

وقتی Codex اجباری باشد، اگر Plugin Codex غیرفعال باشد، سرور برنامه بیش از حد
قدیمی باشد، یا سرور برنامه نتواند شروع شود، OpenClaw زود شکست می‌خورد.

## سیاست سرور برنامه

به‌طور پیش‌فرض، Plugin باینری مدیریت‌شده Codex متعلق به OpenClaw را به‌صورت
محلی با انتقال stdio شروع می‌کند. فقط وقتی `appServer.command` را تنظیم کنید
که عمداً می‌خواهید یک فایل اجرایی متفاوت را اجرا کنید. فقط وقتی از انتقال
WebSocket استفاده کنید که یک سرور برنامه از قبل در جای دیگری در حال اجرا باشد:

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

نشست‌های سرور برنامه stdio محلی به‌طور پیش‌فرض از وضعیت اپراتور محلی مورد
اعتماد استفاده می‌کنند: `approvalPolicy: "never"`، `approvalsReviewer: "user"`،
و `sandbox: "danger-full-access"`. اگر الزامات محلی Codex این وضعیت ضمنی YOLO
را مجاز نداند، OpenClaw به‌جای آن مجوزهای نگهبان مجاز را انتخاب می‌کند.
وقتی یک sandbox OpenClaw برای نشست فعال باشد، OpenClaw برای آن نوبت به‌جای
اتکا به sandbox سمت میزبان Codex، Code Mode بومی Codex، سرورهای MCP کاربر، و
اجرای Plugin پشتیبانی‌شده توسط برنامه را غیرفعال می‌کند. دسترسی shell از طریق
ابزارهای پویای پشتیبانی‌شده توسط sandbox OpenClaw مانند `sandbox_exec` و
`sandbox_process` در صورتی ارائه می‌شود که ابزارهای معمول exec/process در
دسترس باشند.

وقتی می‌خواهید پیش از خروج از sandbox یا مجوزهای اضافی، بازبینی خودکار بومی
Codex را داشته باشید، از حالت exec نرمال‌شده OpenClaw استفاده کنید:

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

برای نشست‌های سرور برنامه Codex، OpenClaw مقدار `tools.exec.mode: "auto"` را
به تأییدهای بازبینی‌شده توسط Codex Guardian نگاشت می‌کند، معمولاً
`approvalPolicy: "on-request"`، `approvalsReviewer: "auto_review"`، و
`sandbox: "workspace-write"` وقتی الزامات محلی آن مقادیر را مجاز بدانند.
در `tools.exec.mode: "auto"`، OpenClaw بازنویسی‌های ناامن قدیمی Codex یعنی
`approvalPolicy: "never"` یا `sandbox: "danger-full-access"` را حفظ نمی‌کند؛
برای یک وضعیت Codex عمدی بدون تأیید، از `tools.exec.mode: "full"` استفاده
کنید. پیش‌تنظیم قدیمی `plugins.entries.codex.config.appServer.mode: "guardian"`
هنوز کار می‌کند، اما `tools.exec.mode: "auto"` سطح نرمال‌شده OpenClaw است.

برای مقایسه در سطح حالت با تأییدهای exec میزبان و مجوزهای ACPX، به
[حالت‌های مجوز](/fa/tools/permission-modes) مراجعه کنید.

برای هر فیلد سرور برنامه، ترتیب احراز هویت، جداسازی محیط، کشف، و رفتار
مهلت زمانی، به [مرجع هارنس Codex](/fa/plugins/codex-harness-reference) مراجعه
کنید.

## فرمان‌ها و عیب‌یابی

Plugin همراه، `/codex` را به‌عنوان یک فرمان اسلش در هر کانالی که از فرمان‌های
متنی OpenClaw پشتیبانی می‌کند ثبت می‌کند.

اجرای بومی و کنترل به یک مالک یا کلاینت Gateway با `operator.admin` نیاز
دارد. این شامل اتصال یا ازسرگیری رشته‌ها، ارسال یا توقف نوبت‌ها، تغییر مدل،
حالت سریع یا وضعیت مجوز، فشرده‌سازی یا بازبینی، و جدا کردن یک اتصال است.
فرستندگان مجاز دیگر وضعیت فقط خواندنی، راهنما، حساب، مدل، رشته، سرور MCP،
skill، و فرمان‌های بازرسی اتصال را نگه می‌دارند.

شکل‌های رایج:

- `/codex status` اتصال سرور برنامه، مدل‌ها، حساب، محدودیت‌های نرخ، سرورهای
  MCP، و skills را بررسی می‌کند.
- `/codex models` مدل‌های زنده سرور برنامه Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر سرور برنامه Codex را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک رشته موجود Codex
  متصل می‌کند.
- `/codex compact` از سرور برنامه Codex می‌خواهد رشته متصل را فشرده کند.
- `/codex review` بازبینی بومی Codex را برای رشته متصل شروع می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد Codex برای رشته متصل
  پرسش می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP سرور برنامه Codex را فهرست می‌کند.
- `/codex skills` skills سرور برنامه Codex را فهرست می‌کند.

برای بیشتر گزارش‌های پشتیبانی، در گفت‌وگویی که خطا رخ داده است با
`/diagnostics [note]` شروع کنید. این کار یک گزارش عیب‌یابی Gateway ایجاد
می‌کند و، برای نشست‌های هارنس Codex، برای ارسال بسته بازخورد مرتبط Codex
درخواست تأیید می‌کند. برای مدل حریم خصوصی و رفتار گپ گروهی، به
[خروجی عیب‌یابی](/fa/gateway/diagnostics) مراجعه کنید.

فقط وقتی از `/codex diagnostics [note]` استفاده کنید که مشخصاً می‌خواهید
بارگذاری بازخورد Codex برای رشته متصل فعلی بدون بسته کامل عیب‌یابی Gateway
انجام شود.

### بازرسی محلی رشته‌های Codex

سریع‌ترین راه برای بازرسی یک اجرای بد Codex اغلب این است که رشته بومی Codex
را مستقیماً باز کنید:

```bash
codex resume <thread-id>
```

شناسه رشته را از پاسخ تکمیل‌شده `/diagnostics`، `/codex binding`، یا
`/codex threads [filter]` بگیرید.

برای سازوکارهای بارگذاری و مرزهای عیب‌یابی در سطح زمان اجرا، به
[زمان اجرای هارنس Codex](/fa/plugins/codex-harness-runtime#codex-feedback-upload)
مراجعه کنید.

احراز هویت به این ترتیب انتخاب می‌شود:

1. پروفایل‌های احراز هویت OpenAI مرتب‌شده برای عامل، ترجیحاً زیر
   `auth.order.openai`. برای مهاجرت شناسه‌های پروفایل احراز هویت قدیمی Codex
   و ترتیب احراز هویت قدیمی Codex، `openclaw doctor --fix` را اجرا کنید.
2. حساب موجود سرور برنامه در خانه Codex آن عامل.
3. فقط برای راه‌اندازی‌های سرور برنامه stdio محلی، وقتی حساب سرور برنامه‌ای
   وجود ندارد و احراز هویت OpenAI هنوز لازم است، `CODEX_API_KEY` و سپس
   `OPENAI_API_KEY`.

وقتی OpenClaw یک پروفایل احراز هویت Codex به سبک اشتراک ChatGPT ببیند،
`CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex ایجادشده حذف
می‌کند. این کار کلیدهای API در سطح Gateway را برای embeddingها یا مدل‌های
مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه نوبت‌های سرور برنامه بومی
Codex به‌طور تصادفی از طریق API صورتحساب شوند. پروفایل‌های صریح کلید API
Codex و جایگزین محلی stdio با کلید محیط، به‌جای env فرایند فرزند به‌ارث‌رسیده،
از ورود سرور برنامه استفاده می‌کنند. اتصال‌های سرور برنامه WebSocket جایگزین
کلید API env Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا
حساب خود سرور برنامه راه‌دور استفاده کنید.
وقتی Pluginهای بومی Codex پیکربندی شده باشند، OpenClaw آن Pluginها را پیش از
نمایان کردن برنامه‌های متعلق به Plugin برای رشته Codex، از طریق سرور برنامه
متصل نصب یا تازه‌سازی می‌کند. `app/list` همچنان منبع حقیقت برای شناسه‌های
برنامه، دسترس‌پذیری، و فراداده است، اما OpenClaw مالک تصمیم فعال‌سازی در هر
رشته است: اگر سیاست یک برنامه دسترس‌پذیر فهرست‌شده را مجاز بداند، OpenClaw
حتی وقتی `app/list` در حال حاضر آن برنامه را غیرفعال گزارش می‌کند،
`thread/start.config.apps[appId].enabled = true` را ارسال می‌کند. این مسیر
برای شناسه‌های ناشناخته نصب برنامه ابداع نمی‌کند؛ OpenClaw فقط Pluginهای
marketplace را با `plugin/install` فعال می‌کند و سپس موجودی را تازه‌سازی
می‌کند.

اگر یک پروفایل اشتراکی به محدودیت استفاده Codex برسد، OpenClaw وقتی Codex
زمان بازنشانی را گزارش کند آن را ثبت می‌کند و پروفایل احراز هویت مرتب‌شده
بعدی را برای همان اجرای Codex امتحان می‌کند. وقتی زمان بازنشانی بگذرد،
پروفایل اشتراکی بدون تغییر مدل انتخاب‌شده `openai/gpt-*` یا زمان اجرای Codex
دوباره واجد شرایط می‌شود.

برای راه‌اندازی‌های سرور برنامه stdio محلی، OpenClaw مقدار `CODEX_HOME` را
به یک دایرکتوری مخصوص هر عامل تنظیم می‌کند تا پیکربندی Codex، فایل‌های
احراز هویت/حساب، کش/داده Plugin، و وضعیت رشته بومی به‌طور پیش‌فرض خانه شخصی
اپراتور یعنی `~/.codex` را نخوانند یا ننویسند. OpenClaw مقدار معمول فرایند
`HOME` را حفظ می‌کند؛ زیرفرایندهای اجراشده توسط Codex همچنان می‌توانند
پیکربندی و توکن‌های خانه کاربر را پیدا کنند، و Codex ممکن است ورودی‌های مشترک
`$HOME/.agents/skills` و `$HOME/.agents/plugins/marketplace.json` را کشف کند.

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

`appServer.clearEnv` فقط بر فرایند فرزند سرور برنامه Codex ایجادشده اثر
می‌گذارد. OpenClaw هنگام نرمال‌سازی راه‌اندازی محلی، `CODEX_HOME` و `HOME`
را از این فهرست حذف می‌کند: `CODEX_HOME` مخصوص هر عامل باقی می‌ماند، و
`HOME` به‌صورت به‌ارث‌رسیده باقی می‌ماند تا زیرفرایندها بتوانند از وضعیت
معمول خانه کاربر استفاده کنند.

ابزارهای پویای Codex به‌طور پیش‌فرض با بارگذاری `searchable` کار می‌کنند. OpenClaw ابزارهای پویایی را که عملیات بومی فضای کاری Codex را تکرار می‌کنند در معرض استفاده قرار نمی‌دهد: `read`، `write`، `edit`، `apply_patch`، `exec`، `process`، و `update_plan`. بیشتر ابزارهای یکپارچه‌سازی باقی‌ماندهٔ OpenClaw مانند پیام‌رسانی، رسانه، cron، مرورگر، گره‌ها، gateway، و `heartbeat_respond` از طریق جست‌وجوی ابزار Codex زیر فضای نام `openclaw` در دسترس هستند و زمینهٔ اولیهٔ مدل را کوچک‌تر نگه می‌دارند. جست‌وجوی وب، وقتی جست‌وجو فعال باشد و هیچ ارائه‌دهندهٔ مدیریت‌شده‌ای انتخاب نشده باشد، به‌طور پیش‌فرض از ابزار میزبانی‌شدهٔ `web_search` در Codex استفاده می‌کند. جست‌وجوی میزبانی‌شدهٔ بومی و ابزار پویای مدیریت‌شدهٔ `web_search` در OpenClaw با هم ناسازگارند تا جست‌وجوی مدیریت‌شده نتواند محدودیت‌های دامنهٔ بومی را دور بزند. OpenClaw وقتی جست‌وجوی میزبانی‌شده در دسترس نباشد، صراحتاً غیرفعال شده باشد، یا با یک ارائه‌دهندهٔ مدیریت‌شدهٔ انتخاب‌شده جایگزین شده باشد، از ابزار مدیریت‌شده استفاده می‌کند. OpenClaw افزونهٔ مستقل `web.run` در Codex را غیرفعال نگه می‌دارد، زیرا ترافیک app-server تولید، فضای نام `web` تعریف‌شده توسط کاربر را رد می‌کند. `tools.web.search.enabled: false` هر دو مسیر را غیرفعال می‌کند، همان‌طور که اجراهای فقط LLM با ابزارهای غیرفعال نیز چنین می‌کنند. Codex با `"cached"` به‌عنوان یک ترجیح رفتار می‌کند و آن را برای نوبت‌های نامحدود app-server به دسترسی خارجی زنده تبدیل می‌کند. وقتی `allowedDomains` بومی تنظیم شده باشد، بازگشت خودکار مدیریت‌شده به‌صورت بسته شکست می‌خورد تا فهرست مجاز دور زده نشود. تغییرات پایدار در سیاست مؤثر جست‌وجو، رشتهٔ Codex متصل را پیش از نوبت بعدی می‌چرخانند. محدودیت‌های گذرای هر نوبت از یک رشتهٔ موقت محدودشده استفاده می‌کنند و اتصال موجود را برای ادامهٔ بعدی حفظ می‌کنند. پاسخ‌های منبع فقط با ابزار پیام و `sessions_yield` مستقیم می‌مانند، زیرا این‌ها قراردادهای کنترل نوبت هستند. `sessions_spawn` قابل جست‌وجو می‌ماند تا `spawn_agent` بومی Codex سطح اصلی زیرعامل Codex باقی بماند، در حالی که واگذاری صریح OpenClaw یا ACP همچنان از طریق فضای نام ابزار پویای `openclaw` در دسترس است. دستورالعمل‌های همکاری Heartbeat به Codex می‌گویند وقتی ابزار از قبل بارگذاری نشده است، پیش از پایان دادن به یک نوبت Heartbeat، `heartbeat_respond` را جست‌وجو کند.

`codexDynamicToolsLoading: "direct"` را فقط زمانی تنظیم کنید که به یک app-server سفارشی Codex وصل می‌شوید که نمی‌تواند ابزارهای پویای به‌تعویق‌افتاده را جست‌وجو کند، یا زمانی که در حال اشکال‌زدایی بار کامل ابزار هستید.

فیلدهای سطح بالای پشتیبانی‌شدهٔ Plugin در Codex:

| فیلد                       | پیش‌فرض       | معنا                                                                                       |
| -------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| `codexDynamicToolsLoading` | `"searchable"` | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw مستقیماً در زمینهٔ اولیهٔ ابزار Codex قرار بگیرند. |
| `codexDynamicToolsExclude` | `[]`          | نام‌های اضافی ابزار پویای OpenClaw که باید از نوبت‌های app-server در Codex حذف شوند.       |
| `codexPlugins`             | غیرفعال       | پشتیبانی بومی Plugin/app در Codex برای Pluginهای گزینش‌شدهٔ نصب‌شده از منبع که مهاجرت کرده‌اند. |

فیلدهای پشتیبانی‌شدهٔ `appServer`:

| فیلد                                         | پیش‌فرض                                                | معنی                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"`، Codex را اجرا می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | باینری مدیریت‌شده Codex                                   | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده تنظیمش نکنید؛ فقط برای بازنویسی صریح آن را تنظیم کنید.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌های انتقال stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | تنظیم‌نشده                                                  | URL app-server نوع WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | تنظیم‌نشده                                                  | توکن Bearer برای انتقال WebSocket. یک رشتهٔ صریح یا SecretInput مانند `${CODEX_APP_SERVER_TOKEN}` را می‌پذیرد.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | سربرگ‌های اضافی WebSocket. مقدارهای سربرگ رشته‌های صریح یا مقدارهای SecretInput را می‌پذیرند، برای مثال `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | نام‌های اضافی متغیر محیطی که پس از ساخت محیط به‌ارث‌رسیده توسط OpenClaw، از فرایند app-server نوع stdio اجراشده حذف می‌شوند. OpenClaw برای اجراهای محلی، `CODEX_HOME` جداگانه برای هر عامل و `HOME` به‌ارث‌رسیده را نگه می‌دارد.                                                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | سطح ابزار فقط-حالت-کد Codex را فعال کنید. ابزارهای پویای OpenClaw همچنان در Codex ثبت می‌مانند تا فراخوانی‌های تودرتوی `tools.*` از طریق پل `item/tool/call` در app-server برگردند.                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | تنظیم‌نشده                                                  | ریشهٔ workspace راه دور app-server در Codex. وقتی تنظیم شود، OpenClaw ریشهٔ workspace محلی را از workspace حل‌شدهٔ OpenClaw استنباط می‌کند، پسوند cwd فعلی را زیر این ریشهٔ راه دور حفظ می‌کند، و فقط cwd نهایی app-server را به Codex می‌فرستد. اگر cwd بیرون از ریشهٔ workspace حل‌شدهٔ OpenClaw باشد، OpenClaw به‌جای فرستادن یک مسیر محلی Gateway به app-server راه دور، به‌صورت بسته شکست می‌خورد. |
| `requestTimeoutMs`                            | `60000`                                                | مهلت زمانی برای فراخوانی‌های صفحهٔ کنترل app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | پنجرهٔ سکوت پس از پذیرش یک نوبت توسط Codex یا پس از یک درخواست app-server محدود به نوبت، در حالی که OpenClaw منتظر `turn/completed` است.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | محافظ سکون تکمیل و پیشرفت که پس از واگذاری ابزار، تکمیل ابزار بومی، پیشرفت خام دستیار پس از ابزار، تکمیل استدلال خام، یا پیشرفت استدلال استفاده می‌شود، در حالی که OpenClaw منتظر `turn/completed` است. از این برای بارهای کاری قابل اعتماد یا سنگین استفاده کنید که در آن‌ها ترکیب پس از ابزار می‌تواند به‌طور مشروع بیشتر از بودجهٔ انتشار نهایی دستیار ساکت بماند.                                |
| `mode`                                        | `"yolo"` مگر اینکه نیازمندی‌های محلی Codex، YOLO را مجاز ندانند | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط نگهبان. نیازمندی‌های محلی stdio که `danger-full-access`، تأیید `never`، یا بازبین `user` را حذف کنند، پیش‌فرض ضمنی را نگهبان می‌کنند.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` یا یک سیاست تأیید مجاز نگهبان       | سیاست تأیید بومی Codex که به شروع/ازسرگیری/نوبت thread فرستاده می‌شود. پیش‌فرض‌های نگهبان وقتی مجاز باشد `"on-request"` را ترجیح می‌دهند.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` یا یک sandbox مجاز نگهبان  | حالت sandbox بومی Codex که به شروع/ازسرگیری thread فرستاده می‌شود. پیش‌فرض‌های نگهبان وقتی مجاز باشد `"workspace-write"` را ترجیح می‌دهند، وگرنه `"read-only"`. وقتی یک sandbox در OpenClaw فعال است، نوبت‌های `danger-full-access` از `workspace-write` در Codex با دسترسی شبکهٔ مشتق‌شده از تنظیم خروجی sandbox در OpenClaw استفاده می‌کنند.                                                                                     |
| `approvalsReviewer`                           | `"user"` یا یک بازبین مجاز نگهبان               | از `"auto_review"` استفاده کنید تا Codex وقتی مجاز باشد درخواست‌های تأیید بومی را بازبینی کند، وگرنه `guardian_subagent` یا `user`. `guardian_subagent` همچنان یک نام مستعار قدیمی است.                                                                                                                                                                                                                              |
| `serviceTier`                                 | تنظیم‌نشده                                                  | ردهٔ سرویس اختیاری app-server در Codex. `"priority"` مسیریابی حالت سریع را فعال می‌کند، `"flex"` پردازش flex را درخواست می‌کند، `null` بازنویسی را پاک می‌کند، و `"fast"` قدیمی به‌عنوان `"priority"` پذیرفته می‌شود.                                                                                                                                                                                                 |
| `networkProxy`                                | غیرفعال                                               | شبکه‌سازی پروفایل مجوزهای Codex را برای فرمان‌های app-server فعال کنید. OpenClaw پیکربندی `permissions.<profile>.network` انتخاب‌شده را تعریف می‌کند و آن را به‌جای فرستادن `sandbox` با `default_permissions` انتخاب می‌کند.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | فعال‌سازی آزمایشی که یک محیط Codex پشتیبانی‌شده با sandbox در OpenClaw را در Codex app-server نسخهٔ 0.132.0 یا جدیدتر ثبت می‌کند تا اجرای بومی Codex بتواند داخل sandbox فعال OpenClaw اجرا شود.                                                                                                                                                                                                         |

`appServer.networkProxy` صریح است چون قرارداد sandbox در Codex را تغییر می‌دهد.
وقتی فعال باشد، OpenClaw همچنین `features.network_proxy.enabled` و
`default_permissions` را در پیکربندی thread در Codex تنظیم می‌کند تا پروفایل
مجوز تولیدشده بتواند شبکه‌سازی مدیریت‌شدهٔ Codex را شروع کند. به‌طور پیش‌فرض،
OpenClaw یک نام پروفایل مقاوم در برابر برخورد با قالب
`openclaw-network-<fingerprint>` از بدنهٔ پروفایل تولید می‌کند؛ فقط وقتی یک نام
محلی پایدار لازم است از `profileName` استفاده کنید.

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

اگر runtime عادی app-server برابر `danger-full-access` باشد، فعال‌سازی
`networkProxy` برای پروفایل مجوز تولیدشده از دسترسی فایل‌سیستم به سبک workspace
استفاده می‌کند. اجرای شبکهٔ مدیریت‌شدهٔ Codex، شبکه‌سازی sandbox‌شده است،
بنابراین یک پروفایل با دسترسی کامل از ترافیک خروجی محافظت نمی‌کند.
ورودی‌های دامنه از `allow` یا `deny` استفاده می‌کنند؛ ورودی‌های سوکت Unix از
مقدارهای `allow` یا `none` در Codex استفاده می‌کنند.

فراخوانی‌های ابزار پویای متعلق به OpenClaw مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: درخواست‌های `item/tool/call` در Codex به‌طور پیش‌فرض از یک دیده‌بان ۹۰ ثانیه‌ای
OpenClaw استفاده می‌کنند. آرگومان مثبت `timeoutMs` برای هر فراخوانی، بودجه همان ابزار مشخص را افزایش یا کاهش می‌دهد. ابزار `image_generate` زمانی از
`agents.defaults.imageGenerationModel.timeoutMs` استفاده می‌کند که فراخوانی ابزار مهلت زمانی خودش را ارائه نکند؛ در غیر این صورت از پیش‌فرض ۱۲۰ ثانیه‌ای تولید تصویر استفاده می‌شود.
ابزار `image` برای درک رسانه از
`tools.media.image.timeoutSeconds` یا پیش‌فرض ۶۰ ثانیه‌ای رسانه استفاده می‌کند. برای درک تصویر، این مهلت زمانی بر خود درخواست اعمال می‌شود و با کارهای آماده‌سازی قبلی
کاهش نمی‌یابد. بودجه‌های ابزار پویا
در 600000 ms سقف‌گذاری می‌شوند. هنگام پایان مهلت زمانی، OpenClaw در صورت پشتیبانی سیگنال ابزار را لغو می‌کند و یک پاسخ ابزار پویای ناموفق به Codex برمی‌گرداند تا نوبت
به‌جای رها کردن نشست در وضعیت `processing` بتواند ادامه پیدا کند.
این دیده‌بان بودجه بیرونی پویای `item/tool/call` است؛ مهلت‌های زمانی درخواست ویژه ارائه‌دهنده داخل همان فراخوانی اجرا می‌شوند و معناشناسی مهلت زمانی خودشان را حفظ می‌کنند.

پس از اینکه Codex یک نوبت را می‌پذیرد، و پس از اینکه OpenClaw به یک درخواست
سرور برنامه محدود به همان نوبت پاسخ می‌دهد، هارنس انتظار دارد Codex در نوبت فعلی پیشرفت کند و
در نهایت نوبت بومی را با `turn/completed` پایان دهد. اگر سرور برنامه به مدت
`appServer.turnCompletionIdleTimeoutMs` ساکت بماند، OpenClaw به‌صورت best-effort
نوبت Codex را قطع می‌کند، یک مهلت زمانی تشخیصی ثبت می‌کند، و مسیر نشست
OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی پشت یک نوبت بومی کهنه
در صف نمانند. بیشتر اعلان‌های غیرپایانی برای همان نوبت، این دیده‌بان کوتاه را غیرفعال می‌کنند
چون Codex ثابت کرده است که نوبت هنوز زنده است. واگذاری‌های ابزار از یک
بودجه بیکاری طولانی‌تر پس از ابزار استفاده می‌کنند: پس از اینکه OpenClaw یک پاسخ `item/tool/call`
را برمی‌گرداند، پس از کامل شدن آیتم‌های ابزار بومی مانند `commandExecution`، پس از تکمیل‌های خام
`custom_tool_call_output`، و پس از پیشرفت خام دستیار بعد از ابزار، تکمیل‌های خام استدلال،
یا پیشرفت استدلال. این محافظ وقتی پیکربندی شده باشد از
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` استفاده می‌کند و در غیر این صورت به‌طور پیش‌فرض پنج دقیقه است. همان بودجه پس از ابزار همچنین
دیده‌بان پیشرفت را برای پنجره ترکیب خاموش پیش از اینکه Codex رویداد بعدی
نوبت فعلی را منتشر کند، افزایش می‌دهد. اعلان‌های سراسری سرور برنامه، مانند به‌روزرسانی‌های محدودیت نرخ،
پیشرفت بیکاری نوبت را بازنشانی نمی‌کنند. تکمیل‌های استدلال، تکمیل‌های
`agentMessage` در commentary، و پیشرفت خام استدلال یا دستیار پیش از ابزار می‌توانند
با یک پاسخ نهایی خودکار دنبال شوند، بنابراین به‌جای آزاد کردن فوری مسیر نشست
از محافظ پاسخ پس از پیشرفت استفاده می‌کنند. فقط آیتم‌های `agentMessage` نهایی/غیر-commentary تکمیل‌شده و
تکمیل‌های خام دستیار پیش از ابزار، آزادسازی خروجی دستیار را مسلح می‌کنند: اگر Codex سپس بدون
`turn/completed` ساکت بماند، OpenClaw به‌صورت best-effort نوبت بومی را قطع می‌کند و
مسیر نشست را آزاد می‌کند. خرابی‌های سرور برنامه stdio که برای بازپخش ایمن هستند، از جمله
مهلت‌های زمانی بیکاری تکمیل نوبت بدون شواهد دستیار، ابزار، آیتم فعال، یا
اثر جانبی، یک بار در یک تلاش تازه سرور برنامه دوباره امتحان می‌شوند. مهلت‌های زمانی ناایمن
همچنان کلاینت سرور برنامه گیرکرده را بازنشسته می‌کنند و مسیر نشست OpenClaw
را آزاد می‌کنند. آن‌ها همچنین اتصال کهنه رشته بومی را به‌جای بازپخش خودکار
پاک می‌کنند. مهلت‌های زمانی پایش تکمیل، متن مهلت زمانی ویژه Codex را نشان می‌دهند: موارد ایمن برای بازپخش می‌گویند پاسخ ممکن است ناقص باشد، در حالی که موارد ناایمن
به کاربر می‌گویند پیش از تلاش دوباره وضعیت فعلی را بررسی کند. تشخیص‌های عمومی مهلت زمانی
شامل فیلدهای ساختاری مانند آخرین متد اعلان سرور برنامه،
شناسه/نوع/نقش آیتم پاسخ خام دستیار، شمار درخواست‌ها/آیتم‌های فعال، و وضعیت
پایش مسلح‌شده هستند. وقتی آخرین اعلان یک آیتم پاسخ خام دستیار باشد، آن‌ها
همچنین یک پیش‌نمایش محدود از متن دستیار را شامل می‌شوند. آن‌ها محتوای خام پرامپت یا
ابزار را شامل نمی‌شوند.

بازنویسی‌های محیط برای آزمون محلی همچنان در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` وقتی
`appServer.command` تنظیم نشده باشد، باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای آزمون محلی یک‌باره از
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. پیکربندی برای استقرارهای تکرارپذیر
ترجیح داده می‌شود، چون رفتار Plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد که بقیه راه‌اندازی هارنس Codex در آن است.

## Pluginهای بومی Codex

پشتیبانی از Plugin بومی Codex از قابلیت‌های برنامه و Plugin خود سرور برنامه Codex
در همان رشته Codex که نوبت هارنس OpenClaw در آن است استفاده می‌کند. OpenClaw
Pluginهای Codex را به ابزارهای پویای مصنوعی `codex_plugin_*` در OpenClaw
ترجمه نمی‌کند.

`codexPlugins` فقط بر نشست‌هایی اثر می‌گذارد که هارنس بومی Codex را انتخاب می‌کنند. این
بر اجرای هارنس داخلی، اجرای عادی ارائه‌دهنده OpenAI، اتصال‌های گفت‌وگوی ACP،
یا هارنس‌های دیگر اثری ندارد.

پیکربندی مهاجرت‌داده‌شده کمینه:

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

پیکربندی برنامه رشته زمانی محاسبه می‌شود که OpenClaw یک نشست هارنس Codex برقرار می‌کند
یا یک اتصال کهنه رشته Codex را جایگزین می‌کند. این پیکربندی در هر نوبت دوباره محاسبه نمی‌شود.
پس از تغییر `codexPlugins`، از `/new`، `/reset` استفاده کنید یا Gateway را بازراه‌اندازی کنید تا
نشست‌های آینده هارنس Codex با مجموعه برنامه به‌روزشده آغاز شوند.

برای واجد شرایط بودن مهاجرت، موجودی برنامه، خط‌مشی کنش مخرب،
درخواست‌های اطلاعات، و تشخیص‌های Plugin بومی، ببینید
[Pluginهای بومی Codex](/fa/plugins/codex-native-plugins).

دسترسی برنامه و Plugin در سمت OpenAI توسط حساب Codex واردشده
و، برای فضاهای کاری Business و Enterprise/Edu، کنترل‌های برنامه فضای کاری کنترل می‌شود. برای
مرور کلی حساب و کنترل فضای کاری OpenAI، ببینید
[استفاده از Codex با طرح ChatGPT شما](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی خودش پوشش داده شده است:
[استفاده از رایانه Codex](/fa/plugins/codex-computer-use).

خلاصه کوتاه: OpenClaw برنامه کنترل دسکتاپ را vendor نمی‌کند و خودش
کنش‌های دسکتاپ را اجرا نمی‌کند. OpenClaw سرور برنامه Codex را آماده می‌کند، بررسی می‌کند که
سرور MCP با نام `computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex مالک فراخوانی‌های
ابزار MCP بومی در طول نوبت‌های حالت Codex باشد.

## مرزهای زمان اجرا

هارنس Codex فقط اجراگر عامل تعبیه‌شده سطح پایین را تغییر می‌دهد.

- ابزارهای پویای OpenClaw پشتیبانی می‌شوند. Codex از OpenClaw می‌خواهد آن
  ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.
- ابزارهای شل، پچ، MCP، و برنامه بومی متعلق به Codex هستند.
  OpenClaw می‌تواند رویدادهای بومی منتخب را از طریق رله پشتیبانی‌شده مشاهده یا مسدود کند،
  اما آرگومان‌های ابزار بومی را بازنویسی نمی‌کند.
- Codex مالک Compaction بومی است. OpenClaw یک آینه رونوشت برای تاریخچه کانال،
  جست‌وجو، `/new`، `/reset`، و تغییر مدل یا هارنس در آینده نگه می‌دارد، اما
  Compaction در Codex را با خلاصه‌ساز OpenClaw یا موتور زمینه
  جایگزین نمی‌کند.
- تولید رسانه، درک رسانه، TTS، تأییدها، و خروجی ابزار پیام‌رسانی
  از طریق تنظیمات ارائه‌دهنده/مدل متناظر OpenClaw ادامه می‌یابند.
- `tool_result_persist` بر نتایج ابزار رونوشت متعلق به OpenClaw اعمال می‌شود، نه
  رکوردهای نتیجه ابزار بومی Codex.

برای لایه‌های هوک، سطوح V1 پشتیبانی‌شده، مدیریت مجوز بومی، هدایت صف،
سازوکارهای بارگذاری بازخورد Codex، و جزئیات Compaction، ببینید
[زمان اجرای هارنس Codex](/fa/plugins/codex-harness-runtime).

## عیب‌یابی

**Codex به‌عنوان یک ارائه‌دهنده عادی `/model` ظاهر نمی‌شود:** این برای
پیکربندی‌های جدید مورد انتظار است. یک مدل `openai/gpt-*` را انتخاب کنید، `plugins.entries.codex.enabled`
را فعال کنید، و بررسی کنید آیا `plugins.allow` مقدار
`codex` را مستثنی کرده است یا نه.

**OpenClaw به‌جای Codex از هارنس داخلی استفاده می‌کند:** مطمئن شوید ارجاع مدل
`openai/gpt-*` روی ارائه‌دهنده رسمی OpenAI است و Plugin Codex
نصب و فعال شده است. اگر هنگام آزمون به اثبات سخت‌گیرانه نیاز دارید، `agentRuntime.id: "codex"` را برای ارائه‌دهنده یا
مدل تنظیم کنید. زمان اجرای Codex اجباری به‌جای بازگشت به OpenClaw
با شکست مواجه می‌شود.

**زمان اجرای OpenAI Codex به مسیر کلید API برمی‌گردد:** یک برش gateway ویرایش‌شده
جمع‌آوری کنید که مدل، زمان اجرا، ارائه‌دهنده انتخاب‌شده، و خرابی را نشان دهد.
از همکاران متاثر بخواهید این فرمان فقط‌خواندنی را روی میزبان OpenClaw خود اجرا کنند:

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

برش‌های مفید معمولا شامل `openai/gpt-5.5` یا `openai/gpt-5.4`،
`Runtime: OpenAI Codex`، `agentRuntime.id` یا `harnessRuntime`،
`candidateProvider: "openai"`، و یک نتیجه `401`، `Incorrect API key`، یا
`No API key` هستند. اجرای اصلاح‌شده باید مسیر OAuth در OpenAI را
به‌جای خرابی ساده کلید API در OpenAI نشان دهد.

**پیکربندی ارجاع‌های مدل قدیمی Codex باقی مانده است:** `openclaw doctor --fix` را اجرا کنید.
Doctor ارجاع‌های مدل قدیمی را به `openai/*` بازنویسی می‌کند، پین‌های زمان اجرای نشست کهنه و
کل عامل را حذف می‌کند، و بازنویسی‌های پروفایل احراز هویت موجود را حفظ می‌کند.

**سرور برنامه رد می‌شود:** از سرور برنامه Codex نسخه `0.125.0` یا جدیدتر استفاده کنید.
پیش‌انتشارهای هم‌نسخه یا نسخه‌های دارای پسوند ساخت مانند
`0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون OpenClaw کف
پروتکل پایدار `0.125.0` را آزمون می‌کند.

**`/codex status` نمی‌تواند وصل شود:** بررسی کنید Plugin همراه `codex`
فعال باشد، وقتی allowlist پیکربندی شده است `plugins.allow` آن را شامل شود، و
هر `appServer.command`، `url`، `authToken` یا header سفارشی معتبر باشد.

**کشف مدل کند است:** مقدار
`plugins.entries.codex.config.discovery.timeoutMs` را کاهش دهید یا کشف را غیرفعال کنید. ببینید
[مرجع هارنس Codex](/fa/plugins/codex-harness-reference#model-discovery).

**انتقال WebSocket بلافاصله شکست می‌خورد:** `appServer.url`، `authToken`،
headerها، و اینکه سرور برنامه راه دور همان نسخه پروتکل سرور برنامه Codex را صحبت می‌کند بررسی کنید.

**ابزارهای شل یا پچ بومی با `Native hook relay unavailable` مسدود می‌شوند:**
رشته Codex هنوز در تلاش است از شناسه رله هوک بومی‌ای استفاده کند که OpenClaw دیگر
ثبت نکرده است. این یک مشکل انتقال هوک بومی Codex است، نه خرابی backend در ACP،
ارائه‌دهنده، GitHub، یا فرمان شل. در گفت‌وگوی متاثر با `/new` یا `/reset` یک نشست تازه
شروع کنید، سپس یک فرمان بی‌خطر را دوباره امتحان کنید. اگر آن یک بار کار کرد اما فراخوانی ابزار بومی بعدی
دوباره شکست خورد، با `/new` فقط به‌عنوان یک راه‌حل موقت برخورد کنید: پس از بازراه‌اندازی سرور برنامه Codex
یا OpenClaw Gateway، پرامپت را در یک نشست تازه کپی کنید تا رشته‌های قدیمی حذف شوند و ثبت‌های هوک بومی
دوباره ساخته شوند.

**یک مدل غیر-Codex از هارنس داخلی استفاده می‌کند:** این مورد انتظار است مگر اینکه
خط‌مشی زمان اجرای ارائه‌دهنده یا مدل آن را به هارنس دیگری هدایت کند. ارجاع‌های ساده ارائه‌دهنده غیر-OpenAI
در حالت `auto` روی مسیر عادی ارائه‌دهنده خود باقی می‌مانند.

**Computer Use نصب شده است اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه
`/codex computer-use status` را بررسی کنید. اگر ابزاری
`Native hook relay unavailable` را گزارش کرد، از بازیابی رله هوک بومی در بالا استفاده کنید. ببینید
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
- [خروجی‌گیری تشخیص‌ها](/fa/gateway/diagnostics)
- [وضعیت](/fa/cli/status)
- [آزمایش](/fa/help/testing-live#live-codex-app-server-harness-smoke)

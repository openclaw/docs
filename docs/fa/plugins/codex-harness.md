---
read_when:
    - می‌خواهید از هارنس app-server همراه Codex استفاده کنید
    - به نمونه‌های پیکربندی هارنس Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به PI شکست بخورند
summary: اجرای نوبت‌های عامل تعبیه‌شدهٔ OpenClaw از طریق هارنس app-server همراه Codex
title: هارنس Codex
x-i18n:
    generated_at: "2026-05-12T01:00:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw امکان می‌دهد گردش‌های عامل OpenAI تعبیه‌شده را
از طریق app-server Codex به‌جای harness داخلی PI اجرا کند.

وقتی می‌خواهید Codex مالک نشست سطح پایین عامل باشد، از harness Codex استفاده کنید:
ازسرگیری بومی thread، ادامه‌دادن بومی ابزار، compaction بومی، و
اجرای app-server. OpenClaw همچنان مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل،
ابزارهای پویای OpenClaw، تأییدها، تحویل رسانه، و آینه transcript قابل مشاهده است.

راه‌اندازی عادی از ارجاع‌های مدل متعارف OpenAI مانند `openai/gpt-5.5` استفاده می‌کند.
ارجاع‌های مدل `openai-codex/gpt-*` را پیکربندی نکنید. ترتیب احراز هویت عامل OpenAI را
زیر `auth.order.openai` قرار دهید؛ پروفایل‌های قدیمی‌تر `openai-codex:*` و
ورودی‌های `auth.order.openai-codex` همچنان برای نصب‌های موجود پشتیبانی می‌شوند.

OpenClaw threadهای app-server Codex را با حالت کد بومی Codex و
فقط-حالت-کد فعال شروع می‌کند. این کار ابزارهای پویای قابل‌تعویق/قابل‌جست‌وجوی OpenClaw را
داخل اجرای کد و سطح جست‌وجوی ابزار خود Codex نگه می‌دارد، به‌جای اینکه یک
پوشش جست‌وجوی ابزار به سبک PI روی Codex اضافه کند.

برای جداسازی گسترده‌تر مدل/ارائه‌دهنده/runtime، با
[Runtimeهای عامل](/fa/concepts/agent-runtimes) شروع کنید. نسخه کوتاه این است:
`openai/gpt-5.5` ارجاع مدل است، `codex` runtime است، و Telegram،
Discord، Slack، یا کانالی دیگر همچنان سطح ارتباطی باقی می‌ماند.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس.
- اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را اضافه کنید.
- app-server Codex نسخه `0.125.0` یا جدیدتر. Plugin همراه به‌صورت پیش‌فرض یک
  باینری سازگار app-server Codex را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex` روی `PATH`
  بر شروع عادی harness اثر نمی‌گذارند.
- احراز هویت Codex از طریق `openclaw models auth login --provider openai-codex`،
  یک حساب app-server در خانه Codex عامل، یا یک پروفایل احراز هویت صریح کلید API Codex
  در دسترس باشد.

برای تقدم احراز هویت، ایزوله‌سازی محیط، فرمان‌های سفارشی app-server، کشف مدل،
و همه فیلدهای پیکربندی، به
[مرجع harness Codex](/fa/plugins/codex-harness-reference) مراجعه کنید.

## شروع سریع

بیشتر کاربرانی که Codex را در OpenClaw می‌خواهند، این مسیر را می‌خواهند: با یک
اشتراک ChatGPT/Codex وارد شوید، Plugin همراه `codex` را فعال کنید، و از یک
ارجاع مدل متعارف `openai/gpt-*` استفاده کنید.

با OAuth Codex وارد شوید:

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
harness را از پیکربندی فعلی حل کند.

## پیکربندی

پیکربندی شروع سریع، حداقل پیکربندی قابل‌استفاده harness Codex است. گزینه‌های
harness Codex را در پیکربندی OpenClaw تنظیم کنید، و از CLI فقط برای احراز هویت Codex استفاده کنید:

| نیاز                                   | تنظیم                                                                            | محل                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| فعال‌کردن harness                      | `plugins.entries.codex.enabled: true`                                            | پیکربندی OpenClaw                  |
| نگه‌داشتن نصب Plugin در allowlist      | `codex` را در `plugins.allow` اضافه کنید                                         | پیکربندی OpenClaw                  |
| مسیریابی گردش‌های عامل OpenAI از طریق Codex | `agents.defaults.model` یا `agents.list[].model` به‌صورت `openai/gpt-*`          | پیکربندی عامل OpenClaw             |
| ورود با OAuth Codex                    | `openclaw models auth login --provider openai-codex`                             | پروفایل احراز هویت CLI             |
| افزودن پشتیبان کلید API برای اجراهای Codex | پروفایل کلید API `openai:*` پس از احراز هویت اشتراک در `auth.order.openai` فهرست شود | پروفایل احراز هویت CLI + پیکربندی OpenClaw |
| بسته‌ماندن در صورت دردسترس‌نبودن Codex | `agentRuntime.id: "codex"` در ارائه‌دهنده یا مدل                                | پیکربندی مدل/ارائه‌دهنده OpenClaw |
| استفاده از ترافیک مستقیم API OpenAI   | `agentRuntime.id: "pi"` در ارائه‌دهنده یا مدل با احراز هویت عادی OpenAI         | پیکربندی مدل/ارائه‌دهنده OpenClaw |
| تنظیم رفتار app-server                 | `plugins.entries.codex.config.appServer.*`                                       | پیکربندی Plugin Codex              |
| فعال‌کردن برنامه‌های بومی Plugin Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | پیکربندی Plugin Codex              |
| فعال‌کردن Computer Use در Codex        | `plugins.entries.codex.config.computerUse.*`                                     | پیکربندی Plugin Codex              |

برای گردش‌های عامل OpenAI پشتیبانی‌شده با Codex از ارجاع‌های مدل `openai/gpt-*` استفاده کنید.
برای ترتیب اشتراک-اول/پشتیبان-کلید-API، `auth.order.openai` را ترجیح دهید. پروفایل‌های
احراز هویت موجود `openai-codex:*` و `auth.order.openai-codex` همچنان معتبرند، اما
ارجاع‌های مدل جدید `openai-codex/gpt-*` ننویسید.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

در این شکل، هر دو پروفایل همچنان برای گردش‌های عامل `openai/gpt-*` از طریق Codex اجرا می‌شوند.
کلید API فقط یک fallback احراز هویت است، نه درخواستی برای تغییر به PI یا
OpenAI Responses ساده.

باقی این صفحه گونه‌های رایجی را پوشش می‌دهد که کاربران باید بین آن‌ها انتخاب کنند:
شکل استقرار، مسیریابی fail-closed، سیاست تأیید guardian، Pluginهای بومی Codex،
و Computer Use. برای فهرست کامل گزینه‌ها، پیش‌فرض‌ها، enumها، کشف،
ایزوله‌سازی محیط، timeoutها، و فیلدهای انتقال app-server، به
[مرجع harness Codex](/fa/plugins/codex-harness-reference) مراجعه کنید.

## بررسی runtime Codex

در چتی که انتظار Codex دارید از `/status` استفاده کنید. یک گردش عامل OpenAI پشتیبانی‌شده با Codex
نمایش می‌دهد:

```text
Runtime: OpenAI Codex
```

سپس وضعیت app-server Codex را بررسی کنید:

```text
/codex status
/codex models
```

`/codex status` اتصال app-server، حساب، محدودیت‌های نرخ، سرورهای MCP
و skills را گزارش می‌کند. `/codex models` فهرست زنده کاتالوگ app-server Codex را برای
harness و حساب نمایش می‌دهد. اگر `/status` غیرمنتظره است، به
[عیب‌یابی](#troubleshooting) مراجعه کنید.

## مسیریابی و انتخاب مدل

ارجاع‌های ارائه‌دهنده و سیاست runtime را جدا نگه دارید:

- برای گردش‌های عامل OpenAI از طریق Codex از `openai/gpt-*` استفاده کنید.
- از `openai-codex/gpt-*` در پیکربندی استفاده نکنید. برای
  تعمیر ارجاع‌های legacy و pinهای route نشست stale، `openclaw doctor --fix` را اجرا کنید.
- `agentRuntime.id: "codex"` برای حالت خودکار عادی OpenAI اختیاری است، اما زمانی مفید است
  که یک استقرار باید در صورت دردسترس‌نبودن Codex fail closed شود.
- `agentRuntime.id: "pi"` یک ارائه‌دهنده یا مدل را وقتی عمدی باشد وارد رفتار مستقیم PI می‌کند.
- `/codex ...` مکالمه‌های بومی app-server Codex را از چت کنترل می‌کند.
- ACP/acpx یک مسیر harness خارجی جداگانه است. فقط زمانی از آن استفاده کنید که کاربر
  ACP/acpx یا یک adapter harness خارجی بخواهد.

مسیریابی فرمان‌های رایج:

| قصد کاربر                         | استفاده کنید                            |
| --------------------------------- | --------------------------------------- |
| پیوست‌کردن چت فعلی                | `/codex bind [--cwd <path>]`            |
| ازسرگیری یک thread موجود Codex    | `/codex resume <thread-id>`             |
| فهرست‌کردن یا فیلتر threadهای Codex | `/codex threads [filter]`               |
| ارسال فقط بازخورد Codex           | `/codex diagnostics [note]`             |
| شروع یک وظیفه ACP/acpx            | فرمان‌های نشست ACP/acpx، نه `/codex`   |

| مورد استفاده                                         | پیکربندی                                                        | بررسی                                  | یادداشت‌ها                          |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| اشتراک ChatGPT/Codex با runtime بومی Codex           | `openai/gpt-*` به‌همراه Plugin فعال `codex`                     | `/status` نشان می‌دهد `Runtime: OpenAI Codex` | مسیر پیشنهادی                      |
| fail closed اگر Codex در دسترس نباشد                 | `agentRuntime.id: "codex"` در ارائه‌دهنده یا مدل                | گردش به‌جای fallback به PI شکست می‌خورد | برای استقرارهای فقط-Codex استفاده کنید |
| ترافیک مستقیم کلید API OpenAI از طریق PI             | `agentRuntime.id: "pi"` در ارائه‌دهنده یا مدل و احراز هویت عادی OpenAI | `/status` runtime PI را نشان می‌دهد     | فقط زمانی استفاده کنید که PI عمدی است |
| پیکربندی legacy                                      | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` آن را بازنویسی می‌کند | پیکربندی جدید را این‌گونه ننویسید  |
| adapter Codex برای ACP/acpx                          | ACP `sessions_spawn({ runtime: "acp" })`                         | وضعیت وظیفه/نشست ACP                   | جدا از harness بومی Codex          |

`agents.defaults.imageModel` از همان جداسازی prefix پیروی می‌کند. برای مسیر عادی OpenAI از
`openai/gpt-*` استفاده کنید و فقط وقتی درک تصویر باید از طریق یک گردش محدود app-server Codex
اجرا شود، از `codex/gpt-*` استفاده کنید. از
`openai-codex/gpt-*` استفاده نکنید؛ doctor آن prefix قدیمی را به `openai/gpt-*` بازنویسی می‌کند.

## الگوهای استقرار

### استقرار پایه Codex

وقتی همه گردش‌های عامل OpenAI باید به‌صورت پیش‌فرض از Codex استفاده کنند، از پیکربندی شروع سریع استفاده کنید.

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

### استقرار ارائه‌دهنده ترکیبی

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

با این پیکربندی، عامل `main` از مسیر عادی ارائه‌دهنده خود استفاده می‌کند و عامل
`codex` از app-server Codex استفاده می‌کند.

### استقرار fail-closed Codex

برای گردش‌های عامل OpenAI، وقتی Plugin همراه در دسترس باشد، `openai/gpt-*` از قبل به Codex resolve می‌شود.
وقتی یک قانون fail-closed مکتوب می‌خواهید، سیاست runtime صریح اضافه کنید:

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

با اجباری‌شدن Codex، اگر Plugin Codex غیرفعال باشد، app-server بیش از حد قدیمی باشد،
یا app-server نتواند شروع شود، OpenClaw زود شکست می‌خورد.

## سیاست app-server

به‌صورت پیش‌فرض، Plugin باینری مدیریت‌شده Codex متعلق به OpenClaw را به‌صورت محلی با انتقال stdio
شروع می‌کند. `appServer.command` را فقط زمانی تنظیم کنید که عمداً بخواهید یک
فایل اجرایی متفاوت را اجرا کنید. از انتقال WebSocket فقط زمانی استفاده کنید که یک app-server از قبل
در جای دیگری در حال اجرا باشد:

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

جلسه‌های محلی stdio app-server به‌طور پیش‌فرض از وضعیت عملگر محلی مورد اعتماد استفاده می‌کنند:
`approvalPolicy: "never"`،‏ `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. اگر الزامات محلی Codex این وضعیت ضمنی YOLO را مجاز نداند، OpenClaw به‌جای آن مجوزهای مجاز guardian را انتخاب می‌کند.
وقتی یک sandbox در OpenClaw برای جلسه فعال باشد، OpenClaw مقدار
`danger-full-access` در Codex را به `workspace-write` در Codex محدود می‌کند تا نوبت‌های بومی code-mode در Codex داخل فضای کاری sandboxشده باقی بمانند.

وقتی می‌خواهید پیش از خروج از sandbox یا دریافت مجوزهای اضافی، بازبینی خودکار بومی Codex انجام شود، از حالت guardian استفاده کنید:

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

حالت guardian به تأییدهای app-server در Codex گسترش می‌یابد، معمولاً به
`approvalPolicy: "on-request"`،‏ `approvalsReviewer: "auto_review"`، و
`sandbox: "workspace-write"` وقتی الزامات محلی این مقادیر را مجاز بدانند.

برای همه فیلدهای app-server، ترتیب احراز هویت، جداسازی محیط، کشف، و رفتار timeout، به [مرجع harness در Codex](/fa/plugins/codex-harness-reference) مراجعه کنید.

## فرمان‌ها و عیب‌یابی

Plugin همراه، `/codex` را به‌عنوان یک فرمان slash در هر کانالی که از فرمان‌های متنی OpenClaw پشتیبانی کند ثبت می‌کند.

شکل‌های رایج:

- `/codex status` اتصال app-server، مدل‌ها، حساب، محدودیت‌های نرخ، سرورهای MCP، و skills را بررسی می‌کند.
- `/codex models` مدل‌های زنده app-server در Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر app-server در Codex را فهرست می‌کند.
- `/codex resume <thread-id>` جلسه فعلی OpenClaw را به یک رشته موجود Codex متصل می‌کند.
- `/codex compact` از app-server در Codex می‌خواهد رشته متصل را compact کند.
- `/codex review` بازبینی بومی Codex را برای رشته متصل شروع می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد Codex برای رشته متصل، درخواست تأیید می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP در app-server مربوط به Codex را فهرست می‌کند.
- `/codex skills` skills app-server در Codex را فهرست می‌کند.

برای بیشتر گزارش‌های پشتیبانی، با `/diagnostics [note]` در همان گفت‌وگویی شروع کنید که خطا در آن رخ داده است. این فرمان یک گزارش عیب‌یابی Gateway ایجاد می‌کند و، برای جلسه‌های harness در Codex، برای ارسال بسته بازخورد مرتبط Codex درخواست تأیید می‌کند.
برای مدل حریم خصوصی و رفتار گفت‌وگوی گروهی، [خروجی عیب‌یابی](/fa/gateway/diagnostics) را ببینید.

فقط زمانی از `/codex diagnostics [note]` استفاده کنید که مشخصاً می‌خواهید بارگذاری بازخورد Codex برای رشته‌ای که در حال حاضر متصل است انجام شود، بدون بسته کامل عیب‌یابی Gateway.

### بررسی محلی رشته‌های Codex

سریع‌ترین راه برای بررسی یک اجرای ناموفق Codex اغلب باز کردن مستقیم رشته بومی Codex است:

```bash
codex resume <thread-id>
```

شناسه رشته را از پاسخ کامل‌شده `/diagnostics`،‏ `/codex binding`، یا
`/codex threads [filter]` بگیرید.

برای سازوکارهای بارگذاری و مرزهای عیب‌یابی در سطح runtime، [runtime مربوط به harness در Codex](/fa/plugins/codex-harness-runtime#codex-feedback-upload) را ببینید.

احراز هویت به این ترتیب انتخاب می‌شود:

1. پروفایل‌های احراز هویت مرتب‌شده OpenAI برای عامل، ترجیحاً زیر
   `auth.order.openai`. شناسه‌های پروفایل موجود `openai-codex:*` همچنان معتبر می‌مانند.
2. حساب موجود app-server در خانه Codex همان عامل.
3. فقط برای راه‌اندازی‌های محلی stdio app-server،‏ `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب app-server وجود ندارد و احراز هویت OpenAI همچنان لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex از نوع اشتراک ChatGPT ببیند، `CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex که ایجاد شده حذف می‌کند. این کار کلیدهای API در سطح Gateway را برای embeddings یا مدل‌های مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه نوبت‌های بومی app-server در Codex به‌طور تصادفی از طریق API صورت‌حساب شوند.
پروفایل‌های صریح کلید API برای Codex و fallback کلید محیط stdio محلی، به‌جای env ارث‌بری‌شده فرایند فرزند، از ورود app-server استفاده می‌کنند. اتصال‌های WebSocket app-server، fallback کلید API محیط Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب خود app-server راه دور استفاده کنید.

اگر یک پروفایل اشتراکی به محدودیت استفاده Codex برسد، OpenClaw وقتی Codex زمان reset را گزارش کند آن را ثبت می‌کند و برای همان اجرای Codex پروفایل احراز هویت مرتب‌شده بعدی را امتحان می‌کند. وقتی زمان reset بگذرد، پروفایل اشتراکی دوباره واجد شرایط می‌شود، بدون تغییر مدل انتخاب‌شده `openai/gpt-*` یا runtime مربوط به Codex.

اگر یک استقرار به جداسازی محیطی اضافی نیاز دارد، آن متغیرها را به
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

`appServer.clearEnv` فقط روی فرایند فرزند app-server در Codex که ایجاد شده اثر می‌گذارد.

ابزارهای پویای Codex به‌طور پیش‌فرض با بارگذاری `searchable` کار می‌کنند. OpenClaw ابزارهای پویایی را که عملیات فضای کاری بومی Codex را تکرار می‌کنند در معرض استفاده قرار نمی‌دهد: `read`،‏ `write`،‏ `edit`،‏ `apply_patch`،‏ `exec`،‏ `process`، و `update_plan`. ابزارهای یکپارچه‌سازی باقی‌مانده OpenClaw مانند پیام‌رسانی، جلسه‌ها، رسانه، cron، مرورگر، nodes، gateway،‏ `heartbeat_respond`، و `web_search` از طریق جست‌وجوی ابزار Codex زیر namespace‏ `openclaw` در دسترس هستند و context اولیه مدل را کوچک‌تر نگه می‌دارند.
`sessions_yield` و پاسخ‌های منبع فقط با ابزار پیام‌رسانی مستقیم باقی می‌مانند، چون این‌ها قراردادهای کنترل نوبت هستند. دستورالعمل‌های همکاری Heartbeat به Codex می‌گویند وقتی ابزار از قبل بارگذاری نشده است، پیش از پایان دادن به یک نوبت Heartbeat، برای `heartbeat_respond` جست‌وجو کند.

فقط وقتی `codexDynamicToolsLoading: "direct"` را تنظیم کنید که به یک app-server سفارشی Codex متصل می‌شوید که نمی‌تواند ابزارهای پویای deferشده را جست‌وجو کند، یا وقتی در حال عیب‌یابی payload کامل ابزار هستید.

فیلدهای سطح بالای پشتیبانی‌شده Plugin مربوط به Codex:

| فیلد                      | پیش‌فرض        | معنی                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw مستقیماً در context اولیه ابزار Codex قرار بگیرند. |
| `codexDynamicToolsExclude` | `[]`           | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های app-server در Codex حذف شوند.              |
| `codexPlugins`             | غیرفعال       | پشتیبانی بومی Plugin/app در Codex برای Pluginهای curated نصب‌شده از منبع که مهاجرت داده شده‌اند.           |

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد                         | پیش‌فرض                                                | معنی                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` Codex را ایجاد می‌کند؛ `"websocket"` به `url` متصل می‌شود.                                                                                                                                                                                |
| `command`                     | باینری مدیریت‌شده Codex                                   | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده، آن را تنظیم‌نشده بگذارید؛ فقط برای override صریح آن را تنظیم کنید.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌ها برای انتقال stdio.                                                                                                                                                                                                          |
| `url`                         | تنظیم‌نشده                                                  | URL app-server مبتنی بر WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | تنظیم‌نشده                                                  | bearer token برای انتقال WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | headerهای اضافی WebSocket.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw از فرایند app-server مبتنی بر stdio که ایجاد شده حذف می‌شوند. `CODEX_HOME` و `HOME` برای جداسازی Codex به‌ازای هر عامل در OpenClaw هنگام راه‌اندازی‌های محلی رزرو شده‌اند.    |
| `requestTimeoutMs`            | `60000`                                                | timeout برای فراخوانی‌های control-plane در app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | پنجره سکوت پس از یک درخواست app-server در Codex در محدوده نوبت، در حالی که OpenClaw منتظر `turn/completed` می‌ماند. این مقدار را برای فازهای کند پس از ابزار یا فازهای synthesis فقط وضعیت افزایش دهید.                                                                     |
| `mode`                        | `"yolo"` مگر اینکه الزامات محلی Codex، YOLO را مجاز نداند | preset برای اجرای YOLO یا اجرای بازبینی‌شده توسط guardian. الزامات محلی stdio که `danger-full-access`، تأیید `never`، یا بازبین `user` را حذف کنند، پیش‌فرض ضمنی را guardian می‌کنند.                                                   |
| `approvalPolicy`              | `"never"` یا یک سیاست تأیید guardian مجاز       | سیاست تأیید بومی Codex که به شروع/ازسرگیری/نوبت رشته ارسال می‌شود. پیش‌فرض‌های guardian وقتی مجاز باشد `"on-request"` را ترجیح می‌دهند.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` یا یک sandbox مجاز guardian  | حالت sandbox بومی Codex که به شروع/ازسرگیری رشته ارسال می‌شود. پیش‌فرض‌های guardian وقتی مجاز باشد `"workspace-write"` را ترجیح می‌دهند، در غیر این صورت `"read-only"`. وقتی یک sandbox در OpenClaw فعال باشد، `danger-full-access` به `"workspace-write"` محدود می‌شود. |
| `approvalsReviewer`           | `"user"` یا یک بازبین guardian مجاز               | از `"auto_review"` استفاده کنید تا Codex وقتی مجاز باشد promptهای تأیید بومی را بازبینی کند، در غیر این صورت `guardian_subagent` یا `user`. `guardian_subagent` همچنان یک alias قدیمی باقی می‌ماند.                                                                      |
| `serviceTier`                 | تنظیم‌نشده                                                  | رده سرویس اختیاری app-server در Codex. `"priority"` مسیریابی fast-mode را فعال می‌کند، `"flex"` پردازش flex را درخواست می‌کند، `null` مقدار override را پاک می‌کند، و `"fast"` قدیمی به‌عنوان `"priority"` پذیرفته می‌شود.                                         |

فراخوانی‌های ابزار پویا که مالکیت آن‌ها با OpenClaw است، مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: درخواست‌های Codex `item/tool/call` به‌طور پیش‌فرض از یک ناظر ۳۰ ثانیه‌ای
OpenClaw استفاده می‌کنند. آرگومان مثبت `timeoutMs` برای هر فراخوانی، بودجه همان ابزار مشخص را افزایش یا کاهش می‌دهد. ابزار `image_generate` نیز وقتی فراخوانی ابزار زمان‌پایان مخصوص خودش را ارائه نکند، از
`agents.defaults.imageGenerationModel.timeoutMs` استفاده می‌کند، و ابزار `image` برای درک رسانه از
`tools.media.image.timeoutSeconds` یا پیش‌فرض رسانه ۶۰ ثانیه‌ای خود استفاده می‌کند. بودجه‌های ابزار پویا حداکثر به 600000 ms محدود می‌شوند. هنگام زمان‌پایان، OpenClaw در صورت پشتیبانی، سیگنال ابزار را لغو می‌کند و یک پاسخ ابزار پویای ناموفق به Codex برمی‌گرداند تا نوبت بتواند به‌جای باقی گذاشتن نشست در وضعیت `processing` ادامه پیدا کند.

پس از اینکه OpenClaw به یک درخواست app-server با دامنه نوبت Codex پاسخ می‌دهد، harness همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` تمام کند. اگر app-server پس از آن پاسخ به مدت `appServer.turnCompletionIdleTimeoutMs` ساکت بماند، OpenClaw با بهترین تلاش نوبت Codex را متوقف می‌کند، یک زمان‌پایان تشخیصی ثبت می‌کند، و مسیر نشست OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی پشت یک نوبت بومی کهنه در صف نمانند. هر اعلان غیرپایانی برای همان نوبت، از جمله `rawResponseItem/completed`، آن ناظر کوتاه را غیرفعال می‌کند، چون Codex ثابت کرده است نوبت هنوز زنده است؛ ناظر پایانی طولانی‌تر همچنان از نوبت‌هایی که واقعا گیر کرده‌اند محافظت می‌کند. تشخیص‌های زمان‌پایان شامل آخرین متد اعلان app-server و، برای آیتم‌های پاسخ خام دستیار، نوع آیتم، نقش، شناسه، و پیش‌نمایش محدودشده‌ای از متن دستیار هستند.

بازنویسی‌های محیطی همچنان برای آزمایش محلی در دسترس‌اند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم نشده باشد،
`OPENCLAW_CODEX_APP_SERVER_BIN` باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای آزمایش محلی موردی از
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. برای استقرارهای تکرارپذیر، پیکربندی ترجیح داده می‌شود، چون رفتار Plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد که بقیه راه‌اندازی harness Codex در آن قرار دارد.

## Pluginهای بومی Codex

پشتیبانی از Plugin بومی Codex از قابلیت‌های app و Plugin خود app-server Codex در همان رشته Codex که نوبت harness OpenClaw در آن است استفاده می‌کند. OpenClaw، Pluginهای Codex را به ابزارهای پویای مصنوعی `codex_plugin_*` متعلق به OpenClaw ترجمه نمی‌کند.

`codexPlugins` فقط روی نشست‌هایی اثر می‌گذارد که harness بومی Codex را انتخاب می‌کنند. این تنظیم روی اجراهای PI، اجراهای عادی ارائه‌دهنده OpenAI، اتصال‌های مکالمه ACP، یا harnessهای دیگر اثری ندارد.

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

پیکربندی app رشته زمانی محاسبه می‌شود که OpenClaw یک نشست harness Codex برقرار کند یا اتصال رشته Codex کهنه‌ای را جایگزین کند. این پیکربندی در هر نوبت دوباره محاسبه نمی‌شود. پس از تغییر `codexPlugins`، از `/new`، `/reset` استفاده کنید یا Gateway را دوباره راه‌اندازی کنید تا نشست‌های harness Codex آینده با مجموعه app به‌روزشده شروع شوند.

برای شرایط احراز مهاجرت، موجودی app، سیاست اقدام مخرب،
درخواست‌های تکمیلی، و تشخیص‌های Plugin بومی، ببینید
[Pluginهای بومی Codex](/fa/plugins/codex-native-plugins).

## Computer Use

Computer Use در راهنمای راه‌اندازی خودش پوشش داده شده است:
[Codex Computer Use](/fa/plugins/codex-computer-use).

نسخه کوتاه: OpenClaw برنامه کنترل دسکتاپ را vendor نمی‌کند و خودش اقدام‌های دسکتاپ را اجرا نمی‌کند. app-server Codex را آماده می‌کند، بررسی می‌کند که سرور MCP `computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex در طول نوبت‌های حالت Codex مالک فراخوانی‌های ابزار MCP بومی باشد.

## مرزهای زمان اجرا

harness Codex فقط اجراکننده سطح پایین agent جاسازی‌شده را تغییر می‌دهد.

- ابزارهای پویای OpenClaw پشتیبانی می‌شوند. Codex از OpenClaw می‌خواهد این ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.
- ابزارهای shell، patch، MCP، و app بومی Codex تحت مالکیت Codex هستند. OpenClaw می‌تواند از طریق relay پشتیبانی‌شده، رویدادهای بومی منتخب را مشاهده یا مسدود کند، اما آرگومان‌های ابزار بومی را بازنویسی نمی‌کند.
- Codex مالک Compaction بومی است. OpenClaw یک آینه transcript برای تاریخچه کانال، جست‌وجو، `/new`، `/reset`، و تغییر مدل یا harness در آینده نگه می‌دارد.
- تولید رسانه، درک رسانه، TTS، تاییدیه‌ها، و خروجی ابزار پیام‌رسانی از طریق تنظیمات ارائه‌دهنده/مدل متناظر OpenClaw ادامه پیدا می‌کنند.
- `tool_result_persist` روی نتیجه‌های ابزار transcript که مالکیت آن‌ها با OpenClaw است اعمال می‌شود، نه رکوردهای نتیجه ابزار بومی Codex.

برای لایه‌های hook، سطوح V1 پشتیبانی‌شده، مدیریت مجوز بومی، هدایت صف،
سازوکارهای بارگذاری بازخورد Codex، و جزئیات Compaction، ببینید
[زمان اجرای harness Codex](/fa/plugins/codex-harness-runtime).

## عیب‌یابی

**Codex به‌عنوان یک ارائه‌دهنده عادی `/model` ظاهر نمی‌شود:** این برای پیکربندی‌های جدید مورد انتظار است. یک مدل `openai/gpt-*` را انتخاب کنید، `plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید آیا `plugins.allow`، `codex` را حذف می‌کند یا نه.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** مطمئن شوید مرجع مدل روی ارائه‌دهنده رسمی OpenAI برابر `openai/gpt-*` است و Plugin Codex نصب و فعال شده است. اگر هنگام آزمایش به اثبات سخت‌گیرانه نیاز دارید، `agentRuntime.id: "codex"` را برای ارائه‌دهنده یا مدل تنظیم کنید. زمان اجرای اجباری Codex به‌جای بازگشت به PI شکست می‌خورد.

**پیکربندی قدیمی `openai-codex/*` باقی مانده است:** `openclaw doctor --fix` را اجرا کنید.
Doctor مرجع‌های مدل قدیمی را به `openai/*` بازنویسی می‌کند، پین‌های زمان اجرای نشست کهنه و کل agent را حذف می‌کند، و بازنویسی‌های موجود auth-profile را حفظ می‌کند.

**app-server رد می‌شود:** از app-server Codex نسخه `0.125.0` یا جدیدتر استفاده کنید.
پیش‌انتشارهای هم‌نسخه یا نسخه‌های دارای پسوند ساخت مانند
`0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون OpenClaw کف پروتکل پایدار `0.125.0` را آزمایش می‌کند.

**`/codex status` نمی‌تواند وصل شود:** بررسی کنید که Plugin همراه `codex` فعال باشد، وقتی allowlist پیکربندی شده است `plugins.allow` آن را شامل شود، و هرگونه `appServer.command`، `url`، `authToken`، یا header سفارشی معتبر باشد.

**کشف مدل کند است:** `plugins.entries.codex.config.discovery.timeoutMs` را کاهش دهید یا کشف را غیرفعال کنید. ببینید
[مرجع harness Codex](/fa/plugins/codex-harness-reference#model-discovery).

**انتقال WebSocket بلافاصله شکست می‌خورد:** `appServer.url`، `authToken`، headerها، و اینکه app-server راه دور با همان نسخه پروتکل app-server Codex صحبت می‌کند را بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این مورد انتظار است، مگر اینکه سیاست زمان اجرای ارائه‌دهنده یا مدل آن را به harness دیگری هدایت کند. مرجع‌های ساده ارائه‌دهنده غیر OpenAI در حالت `auto` روی مسیر ارائه‌دهنده عادی خود باقی می‌مانند.

**Computer Use نصب است اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه، `/codex computer-use status` را بررسی کنید. اگر ابزاری `Native hook relay unavailable` گزارش کرد، از `/new` یا `/reset` استفاده کنید؛ اگر مشکل ادامه داشت، Gateway را دوباره راه‌اندازی کنید تا ثبت‌های hook بومی کهنه پاک شوند. ببینید
[Codex Computer Use](/fa/plugins/codex-computer-use#troubleshooting).

## مرتبط

- [مرجع harness Codex](/fa/plugins/codex-harness-reference)
- [زمان اجرای harness Codex](/fa/plugins/codex-harness-runtime)
- [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)
- [Codex Computer Use](/fa/plugins/codex-computer-use)
- [زمان‌های اجرای agent](/fa/concepts/agent-runtimes)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [ارائه‌دهنده OpenAI](/fa/providers/openai)
- [Pluginهای harness agent](/fa/plugins/sdk-agent-harness)
- [hookهای Plugin](/fa/plugins/hooks)
- [خروجی تشخیص‌ها](/fa/gateway/diagnostics)
- [وضعیت](/fa/cli/status)
- [آزمایش](/fa/help/testing-live#live-codex-app-server-harness-smoke)

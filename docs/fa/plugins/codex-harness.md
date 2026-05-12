---
read_when:
    - می‌خواهید از هارنس app-server همراهِ Codex استفاده کنید
    - به نمونه‌های پیکربندی هارنس Codex نیاز دارید
    - می‌خواهید استقرارهایی که فقط از Codex استفاده می‌کنند، به‌جای بازگشت به PI، شکست بخورند
summary: نوبت‌های عامل تعبیه‌شدهٔ OpenClaw را از طریق هارنس app-server همراهِ Codex اجرا کنید
title: هارنس Codex
x-i18n:
    generated_at: "2026-05-12T08:46:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw امکان می‌دهد چرخش‌های عامل OpenAI تعبیه‌شده را
به‌جای PI harness داخلی، از طریق Codex app-server اجرا کند.

وقتی می‌خواهید Codex مالک نشست عامل سطح پایین باشد، از Codex harness استفاده کنید:
ازسرگیری بومی thread، ادامه ابزار بومی، compaction بومی، و اجرای
app-server. OpenClaw همچنان مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل،
ابزارهای پویای OpenClaw، تأییدها، تحویل رسانه، و آینه transcript قابل مشاهده
است.

راه‌اندازی معمول از ارجاع‌های canonical مدل OpenAI مانند `openai/gpt-5.5` استفاده می‌کند.
ارجاع‌های مدل `openai-codex/gpt-*` را پیکربندی نکنید. ترتیب احراز هویت عامل OpenAI را
زیر `auth.order.openai` قرار دهید؛ پروفایل‌های قدیمی‌تر `openai-codex:*` و
ورودی‌های `auth.order.openai-codex` برای نصب‌های موجود همچنان پشتیبانی می‌شوند.

OpenClaw threadهای Codex app-server را با code mode بومی Codex و
code-mode-only فعال‌شده شروع می‌کند. این کار ابزارهای پویای deferred/searchable OpenClaw را
به‌جای افزودن یک wrapper جست‌وجوی ابزار به سبک PI روی Codex، داخل اجرای کد و سطح جست‌وجوی ابزار خود Codex
نگه می‌دارد.

برای تفکیک گسترده‌تر مدل/ارائه‌دهنده/runtime، با
[Runtimeهای عامل](/fa/concepts/agent-runtimes) شروع کنید. نسخه کوتاه این است:
`openai/gpt-5.5` ارجاع مدل است، `codex` runtime است، و Telegram،
Discord، Slack، یا کانال دیگری سطح ارتباطی باقی می‌ماند.

## نیازمندی‌ها

- OpenClaw با Plugin همراه `codex` در دسترس.
- اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را اضافه کنید.
- Codex app-server `0.125.0` یا جدیدتر. Plugin همراه به‌صورت پیش‌فرض یک
  باینری سازگار Codex app-server را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex` روی `PATH`
  بر شروع معمول harness اثر نمی‌گذارند.
- احراز هویت Codex از طریق `openclaw models auth login --provider openai-codex`،
  یک حساب app-server در خانه Codex عامل، یا یک پروفایل صریح احراز هویت Codex API-key
  در دسترس باشد.

برای اولویت احراز هویت، جداسازی محیط، فرمان‌های سفارشی app-server، کشف مدل،
و همه فیلدهای پیکربندی، ببینید:
[مرجع Codex harness](/fa/plugins/codex-harness-reference).

## شروع سریع

بیشتر کاربرانی که Codex را در OpenClaw می‌خواهند، این مسیر را می‌خواهند: ورود با یک
اشتراک ChatGPT/Codex، فعال‌کردن Plugin همراه `codex`، و استفاده از یک
ارجاع canonical مدل `openai/gpt-*`.

با Codex OAuth وارد شوید:

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

پس از تغییر پیکربندی Plugin، Gateway را راه‌اندازی مجدد کنید. اگر یک چت موجود از قبل
نشست دارد، پیش از آزمودن تغییرات runtime از `/new` یا `/reset` استفاده کنید تا چرخش بعدی
harness را از پیکربندی فعلی resolve کند.

## پیکربندی

پیکربندی شروع سریع، کمینه پیکربندی قابل استفاده Codex harness است. گزینه‌های Codex
harness را در پیکربندی OpenClaw تنظیم کنید، و از CLI فقط برای احراز هویت Codex استفاده کنید:

| نیاز                                   | تنظیم                                                                              | مکان                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| فعال‌کردن harness                     | `plugins.entries.codex.enabled: true`                                            | پیکربندی OpenClaw                    |
| نگه‌داشتن نصب Plugin در allowlist     | اضافه‌کردن `codex` در `plugins.allow`                                               | پیکربندی OpenClaw                    |
| مسیریابی چرخش‌های عامل OpenAI از طریق Codex | `agents.defaults.model` یا `agents.list[].model` به‌شکل `openai/gpt-*`               | پیکربندی عامل OpenClaw              |
| ورود با Codex OAuth               | `openclaw models auth login --provider openai-codex`                             | پروفایل احراز هویت CLI                   |
| افزودن پشتیبان API-key برای اجرای Codex      | پروفایل API-key با `openai:*` که بعد از احراز هویت اشتراکی در `auth.order.openai` فهرست شده است | پروفایل احراز هویت CLI + پیکربندی OpenClaw |
| fail closed وقتی Codex در دسترس نیست  | `agentRuntime.id: "codex"` در ارائه‌دهنده یا مدل                                     | پیکربندی مدل/ارائه‌دهنده OpenClaw     |
| استفاده از ترافیک مستقیم OpenAI API          | `agentRuntime.id: "pi"` در ارائه‌دهنده یا مدل با احراز هویت عادی OpenAI                | پیکربندی مدل/ارائه‌دهنده OpenClaw     |
| تنظیم رفتار app-server               | `plugins.entries.codex.config.appServer.*`                                       | پیکربندی Codex Plugin                |
| فعال‌کردن appهای بومی Codex Plugin        | `plugins.entries.codex.config.codexPlugins.*`                                    | پیکربندی Codex Plugin                |
| فعال‌کردن Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | پیکربندی Codex Plugin                |

برای چرخش‌های عامل OpenAI با پشتوانه Codex از ارجاع‌های مدل `openai/gpt-*` استفاده کنید. برای
ترتیب subscription-first/API-key-backup، `auth.order.openai` را ترجیح دهید. پروفایل‌های احراز هویت موجود
`openai-codex:*` و `auth.order.openai-codex` همچنان معتبر هستند، اما
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

در این شکل، هر دو پروفایل برای چرخش‌های عامل `openai/gpt-*` همچنان از طریق Codex اجرا می‌شوند.
کلید API فقط یک fallback احراز هویت است، نه درخواستی برای جابه‌جایی به PI یا
OpenAI Responses ساده.

بقیه این صفحه گونه‌های رایجی را پوشش می‌دهد که کاربران باید میان آن‌ها انتخاب کنند:
شکل استقرار، مسیریابی fail-closed، سیاست تأیید guardian، Pluginهای بومی Codex،
و Computer Use. برای فهرست کامل گزینه‌ها، پیش‌فرض‌ها، enumها، کشف،
جداسازی محیط، timeoutها، و فیلدهای انتقال app-server، ببینید:
[مرجع Codex harness](/fa/plugins/codex-harness-reference).

## راستی‌آزمایی runtime Codex

در چتی که انتظار Codex دارید از `/status` استفاده کنید. یک چرخش عامل OpenAI با پشتوانه Codex
نشان می‌دهد:

```text
Runtime: OpenAI Codex
```

سپس وضعیت Codex app-server را بررسی کنید:

```text
/codex status
/codex models
```

`/codex status` اتصال app-server، حساب، rate limitها، سرورهای MCP،
و Skills را گزارش می‌کند. `/codex models` کاتالوگ زنده Codex app-server را برای
harness و حساب فهرست می‌کند. اگر `/status` غیرمنتظره است، ببینید:
[عیب‌یابی](#troubleshooting).

## مسیریابی و انتخاب مدل

ارجاع‌های ارائه‌دهنده و سیاست runtime را جدا نگه دارید:

- برای چرخش‌های عامل OpenAI از طریق Codex از `openai/gpt-*` استفاده کنید.
- از `openai-codex/gpt-*` در پیکربندی استفاده نکنید. برای تعمیر ارجاع‌های legacy و pinهای stale مسیر نشست،
  `openclaw doctor --fix` را اجرا کنید.
- `agentRuntime.id: "codex"` برای حالت عادی خودکار OpenAI اختیاری است، اما وقتی
  یک استقرار باید در صورت در دسترس نبودن Codex fail closed شود، مفید است.
- `agentRuntime.id: "pi"` یک ارائه‌دهنده یا مدل را، وقتی عمدی باشد، وارد رفتار مستقیم PI می‌کند.
- `/codex ...` مکالمه‌های بومی Codex app-server را از چت کنترل می‌کند.
- ACP/acpx یک مسیر harness خارجی جداگانه است. فقط وقتی کاربر
  ACP/acpx یا یک adapter harness خارجی را می‌خواهد از آن استفاده کنید.

مسیریابی فرمان‌های رایج:

| قصد کاربر                     | استفاده                                     |
| ------------------------------- | --------------------------------------- |
| اتصال چت فعلی         | `/codex bind [--cwd <path>]`            |
| ازسرگیری یک thread موجود Codex | `/codex resume <thread-id>`             |
| فهرست‌کردن یا فیلترکردن threadهای Codex    | `/codex threads [filter]`               |
| ارسال فقط بازخورد Codex        | `/codex diagnostics [note]`             |
| شروع یک task ACP/acpx          | فرمان‌های نشست ACP/acpx، نه `/codex` |

| مورد استفاده                                             | پیکربندی                                                        | راستی‌آزمایی                                  | نکته‌ها                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| اشتراک ChatGPT/Codex با runtime بومی Codex | `openai/gpt-*` به‌همراه Plugin فعال `codex`                       | `/status` نشان می‌دهد `Runtime: OpenAI Codex` | مسیر پیشنهادی                   |
| fail closed اگر Codex در دسترس نباشد                  | `agentRuntime.id: "codex"` در ارائه‌دهنده یا مدل                     | چرخش به‌جای fallback به PI شکست می‌خورد       | برای استقرارهای فقط Codex استفاده کنید     |
| ترافیک مستقیم OpenAI API-key از طریق PI             | `agentRuntime.id: "pi"` در ارائه‌دهنده یا مدل و احراز هویت عادی OpenAI | `/status` runtime مربوط به PI را نشان می‌دهد              | فقط وقتی PI عمدی است استفاده کنید    |
| پیکربندی legacy                                        | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` آن را بازنویسی می‌کند     | پیکربندی جدید را این‌گونه ننویسید   |
| adapter Codex برای ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                         | وضعیت task/نشست ACP                 | جدا از Codex harness بومی |

`agents.defaults.imageModel` از همان تفکیک prefix پیروی می‌کند. از `openai/gpt-*`
برای مسیر عادی OpenAI و از `codex/gpt-*` فقط وقتی استفاده کنید که image understanding
باید از طریق یک چرخش محدود Codex app-server اجرا شود. از
`openai-codex/gpt-*` استفاده نکنید؛ doctor آن prefix legacy را به `openai/gpt-*` بازنویسی می‌کند.

## الگوهای استقرار

### استقرار پایه Codex

وقتی همه چرخش‌های عامل OpenAI باید به‌صورت پیش‌فرض از Codex استفاده کنند، از پیکربندی شروع سریع
استفاده کنید.

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

### استقرار ترکیبی ارائه‌دهنده

این شکل Claude را به‌عنوان عامل پیش‌فرض نگه می‌دارد و یک عامل Codex نام‌دار اضافه می‌کند:

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
`codex` از Codex app-server استفاده می‌کند.

### استقرار fail-closed Codex

برای چرخش‌های عامل OpenAI، وقتی Plugin همراه در دسترس باشد، `openai/gpt-*` از قبل به Codex
resolve می‌شود. وقتی یک قانون fail-closed مکتوب می‌خواهید، سیاست runtime صریح اضافه کنید:

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

با اجباری‌شدن Codex، اگر Codex Plugin غیرفعال باشد، app-server بیش از حد قدیمی باشد،
یا app-server نتواند شروع شود، OpenClaw زود شکست می‌خورد.

## سیاست app-server

به‌صورت پیش‌فرض، Plugin باینری مدیریت‌شده Codex متعلق به OpenClaw را به‌صورت محلی با stdio
transport شروع می‌کند. `appServer.command` را فقط وقتی تنظیم کنید که عمداً می‌خواهید یک
اجرایی متفاوت را اجرا کنید. فقط وقتی یک app-server از قبل در جای دیگری در حال اجراست از WebSocket transport استفاده کنید:

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

نشست‌های محلی سرور برنامه stdio به‌صورت پیش‌فرض از وضعیت اپراتور محلی مورد اعتماد استفاده می‌کنند:
`approvalPolicy: "never"`،‏ `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. اگر الزامات محلی Codex این وضعیت ضمنی YOLO را مجاز نداند، OpenClaw به‌جای آن مجوزهای نگهبانِ مجاز را انتخاب می‌کند.
وقتی sandbox مربوط به OpenClaw برای نشست فعال باشد، OpenClaw مقدار Codex
`danger-full-access` را به Codex `workspace-write` محدود می‌کند تا نوبت‌های حالت کدنویسی بومی Codex داخل فضای کاری sandboxشده بمانند.

وقتی می‌خواهید پیش از خروج از sandbox یا دریافت مجوزهای اضافی، بازبینی خودکار بومی Codex انجام شود، از حالت نگهبان استفاده کنید:

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

حالت نگهبان به تأییدهای سرور برنامه Codex گسترش می‌یابد، معمولاً
`approvalPolicy: "on-request"`،‏ `approvalsReviewer: "auto_review"`، و
`sandbox: "workspace-write"` وقتی الزامات محلی این مقادیر را مجاز بدانند.

برای همه فیلدهای سرور برنامه، ترتیب احراز هویت، ایزوله‌سازی محیط، کشف، و رفتار timeout، به [مرجع harness مربوط به Codex](/fa/plugins/codex-harness-reference) مراجعه کنید.

## فرمان‌ها و عیب‌یابی

Plugin همراه، `/codex` را به‌عنوان یک فرمان اسلش در هر کانالی که از فرمان‌های متنی OpenClaw پشتیبانی کند ثبت می‌کند.

شکل‌های رایج:

- `/codex status` اتصال سرور برنامه، مدل‌ها، حساب، محدودیت‌های نرخ، سرورهای MCP، و skills را بررسی می‌کند.
- `/codex models` مدل‌های زنده سرور برنامه Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر سرور برنامه Codex را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک رشته موجود Codex متصل می‌کند.
- `/codex compact` از سرور برنامه Codex می‌خواهد رشته متصل‌شده را فشرده کند.
- `/codex review` بازبینی بومی Codex را برای رشته متصل‌شده آغاز می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد Codex برای رشته متصل‌شده، درخواست تأیید می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP سرور برنامه Codex را فهرست می‌کند.
- `/codex skills` skills سرور برنامه Codex را فهرست می‌کند.

برای بیشتر گزارش‌های پشتیبانی، با `/diagnostics [note]` در گفت‌وگویی شروع کنید که خطا در آن رخ داده است. این فرمان یک گزارش عیب‌یابی Gateway ایجاد می‌کند و، برای نشست‌های harness مربوط به Codex، برای ارسال بسته بازخورد مرتبط Codex درخواست تأیید می‌کند.
برای مدل حریم خصوصی و رفتار چت گروهی، [خروجی عیب‌یابی](/fa/gateway/diagnostics) را ببینید.

از `/codex diagnostics [note]` فقط زمانی استفاده کنید که مشخصاً آپلود بازخورد Codex برای رشته‌ای را می‌خواهید که در حال حاضر متصل است، بدون بسته کامل عیب‌یابی Gateway.

### بررسی محلی رشته‌های Codex

سریع‌ترین راه برای بررسی یک اجرای ناموفق Codex اغلب باز کردن مستقیم رشته بومی Codex است:

```bash
codex resume <thread-id>
```

شناسه رشته را از پاسخ کامل‌شده `/diagnostics`،‏ `/codex binding`، یا
`/codex threads [filter]` بگیرید.

برای سازوکارهای آپلود و مرزهای عیب‌یابی در سطح runtime، [runtime مربوط به harness Codex](/fa/plugins/codex-harness-runtime#codex-feedback-upload) را ببینید.

احراز هویت به این ترتیب انتخاب می‌شود:

1. پروفایل‌های احراز هویت مرتب‌شده OpenAI برای agent، ترجیحاً زیر
   `auth.order.openai`. شناسه‌های پروفایل موجود `openai-codex:*` همچنان معتبر می‌مانند.
2. حساب موجود سرور برنامه در خانه Codex همان agent.
3. فقط برای اجرای محلی سرور برنامه stdio،‏ `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب سرور برنامه‌ای وجود ندارد و احراز هویت OpenAI هنوز لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex از نوع اشتراک ChatGPT را تشخیص دهد، `CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex که ایجاد می‌شود حذف می‌کند. این کار کلیدهای API سطح Gateway را برای embeddingها یا مدل‌های مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه نوبت‌های بومی سرور برنامه Codex به‌طور تصادفی از طریق API محاسبه هزینه شوند.
پروفایل‌های صریح کلید API مربوط به Codex و fallback کلید محیطی stdio محلی، به‌جای env ارث‌بری‌شده فرایند فرزند، از ورود سرور برنامه استفاده می‌کنند. اتصال‌های سرور برنامه WebSocket،‏ fallback کلید API محیطی Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب خود سرور برنامه راه‌دور استفاده کنید.

اگر یک پروفایل اشتراکی به محدودیت استفاده Codex برسد، OpenClaw وقتی Codex زمان بازنشانی را گزارش کند آن را ثبت می‌کند و برای همان اجرای Codex، پروفایل احراز هویت مرتب‌شده بعدی را امتحان می‌کند. وقتی زمان بازنشانی بگذرد، پروفایل اشتراکی دوباره واجد شرایط می‌شود، بدون اینکه مدل انتخاب‌شده `openai/gpt-*` یا runtime مربوط به Codex تغییر کند.

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

`appServer.clearEnv` فقط بر فرایند فرزند سرور برنامه Codex که ایجاد می‌شود اثر می‌گذارد.

ابزارهای پویای Codex به‌صورت پیش‌فرض با بارگذاری `searchable` کار می‌کنند. OpenClaw ابزارهای پویایی را که عملیات فضای کاری بومی Codex را تکرار می‌کنند در معرض استفاده قرار نمی‌دهد: `read`،‏ `write`،‏ `edit`،‏ `apply_patch`،‏ `exec`،‏ `process`، و `update_plan`. ابزارهای یکپارچه‌سازی باقی‌مانده OpenClaw مانند پیام‌رسانی، نشست‌ها، رسانه، cron، مرورگر، nodeها، gateway،‏ `heartbeat_respond`، و `web_search` از طریق جست‌وجوی ابزار Codex زیر فضای نام `openclaw` در دسترس هستند و زمینه اولیه مدل را کوچک‌تر نگه می‌دارند.
`sessions_yield` و پاسخ‌های منبعیِ فقط مبتنی بر ابزار پیام مستقیم باقی می‌مانند، چون این‌ها قراردادهای کنترل نوبت هستند. دستورالعمل‌های همکاری Heartbeat به Codex می‌گویند وقتی ابزار از قبل بارگذاری نشده است، پیش از پایان دادن به یک نوبت Heartbeat،‏ `heartbeat_respond` را جست‌وجو کند.

`codexDynamicToolsLoading: "direct"` را فقط زمانی تنظیم کنید که به یک سرور برنامه سفارشی Codex متصل می‌شوید که نمی‌تواند ابزارهای پویای به‌تعویق‌افتاده را جست‌وجو کند، یا هنگام عیب‌یابی payload کامل ابزار.

فیلدهای سطح بالای پشتیبانی‌شده Plugin مربوط به Codex:

| فیلد                       | پیش‌فرض        | معنا                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw مستقیماً در زمینه اولیه ابزار Codex قرار بگیرند. |
| `codexDynamicToolsExclude` | `[]`           | نام‌های اضافی ابزار پویای OpenClaw که باید از نوبت‌های سرور برنامه Codex حذف شوند.              |
| `codexPlugins`             | غیرفعال       | پشتیبانی بومی Plugin/برنامه Codex برای Pluginهای curated نصب‌شده از منبع که مهاجرت داده شده‌اند.           |

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد                          | پیش‌فرض                                                | معنا                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` باعث ایجاد Codex می‌شود؛ `"websocket"` به `url` متصل می‌شود.                                                                                                                                                                                |
| `command`                     | باینری مدیریت‌شده Codex                                   | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده آن را تنظیم‌نشده بگذارید؛ فقط برای override صریح آن را تنظیم کنید.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌ها برای انتقال stdio.                                                                                                                                                                                                          |
| `url`                         | تنظیم‌نشده                                                  | نشانی URL سرور برنامه WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | تنظیم‌نشده                                                  | توکن Bearer برای انتقال WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | هدرهای اضافی WebSocket.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw، از فرایند سرور برنامه stdio ایجادشده حذف می‌شوند. `CODEX_HOME` و `HOME` برای ایزوله‌سازی Codex در سطح هر agent در اجراهای محلی توسط OpenClaw رزرو شده‌اند.    |
| `requestTimeoutMs`            | `60000`                                                | timeout برای فراخوانی‌های control-plane سرور برنامه.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | پنجره سکوت پس از یک درخواست سرور برنامه Codex در محدوده نوبت، در حالی که OpenClaw منتظر `turn/completed` می‌ماند. این مقدار را برای فازهای کند پس از ابزار یا سنتز صرفاً وضعیتی افزایش دهید.                                                                     |
| `mode`                        | `"yolo"` مگر اینکه الزامات محلی Codex، YOLO را مجاز نداند | preset برای اجرای YOLO یا اجرای بازبینی‌شده توسط نگهبان. الزامات stdio محلی که `danger-full-access`، تأیید `never`، یا بازبین `user` را حذف کنند، پیش‌فرض ضمنی را نگهبان می‌کنند.                                                   |
| `approvalPolicy`              | `"never"` یا یک سیاست تأیید مجاز نگهبان       | سیاست تأیید بومی Codex که به آغاز/ازسرگیری/نوبت رشته ارسال می‌شود. پیش‌فرض‌های نگهبان وقتی مجاز باشد `"on-request"` را ترجیح می‌دهند.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` یا یک sandbox مجاز نگهبان  | حالت sandbox بومی Codex که به آغاز/ازسرگیری رشته ارسال می‌شود. پیش‌فرض‌های نگهبان وقتی مجاز باشد `"workspace-write"` را ترجیح می‌دهند، در غیر این صورت `"read-only"`. وقتی sandbox مربوط به OpenClaw فعال باشد، `danger-full-access` به `"workspace-write"` محدود می‌شود. |
| `approvalsReviewer`           | `"user"` یا یک بازبین مجاز نگهبان               | از `"auto_review"` استفاده کنید تا Codex، وقتی مجاز باشد، promptهای تأیید بومی را بازبینی کند؛ در غیر این صورت `guardian_subagent` یا `user`. `guardian_subagent` به‌عنوان alias قدیمی باقی می‌ماند.                                                                      |
| `serviceTier`                 | تنظیم‌نشده                                                  | سطح سرویس اختیاری سرور برنامه Codex. `"priority"` مسیریابی حالت سریع را فعال می‌کند، `"flex"` پردازش flex را درخواست می‌کند، `null` مقدار override را پاک می‌کند، و `"fast"` قدیمی به‌عنوان `"priority"` پذیرفته می‌شود.                                         |

فراخوانی‌های ابزار پویای متعلق به OpenClaw مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: درخواست‌های Codex `item/tool/call` به‌صورت پیش‌فرض از یک دیده‌بان ۳۰ ثانیه‌ای
OpenClaw استفاده می‌کنند. یک آرگومان مثبت `timeoutMs` برای هر فراخوانی، بودجه همان ابزار مشخص را افزایش یا کاهش می‌دهد. ابزار `image_generate` نیز وقتی فراخوانی ابزار مهلت زمانی خودش را ارائه نکند از
`agents.defaults.imageGenerationModel.timeoutMs` استفاده می‌کند، و ابزار `image` برای درک رسانه از
`tools.media.image.timeoutSeconds` یا مقدار پیش‌فرض رسانه‌ای ۶۰ ثانیه‌ای خود استفاده می‌کند. بودجه‌های ابزار پویا به 600000 ms محدود می‌شوند. هنگام پایان مهلت، OpenClaw در صورت پشتیبانی سیگنال ابزار را لغو می‌کند و یک پاسخ ناموفق ابزار پویا به Codex برمی‌گرداند تا نوبت بتواند ادامه پیدا کند، به‌جای اینکه نشست در وضعیت `processing` باقی بماند.

پس از اینکه OpenClaw به یک درخواست app-server با دامنه نوبت Codex پاسخ می‌دهد، harness همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` تمام کند. اگر app-server پس از آن پاسخ به‌مدت `appServer.turnCompletionIdleTimeoutMs` بی‌صدا بماند، OpenClaw به‌صورت best-effort نوبت Codex را متوقف می‌کند، یک پایان مهلت تشخیصی ثبت می‌کند، و مسیر نشست OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی پشت یک نوبت بومی کهنه در صف نمانند. هر اعلان غیرنهایی برای همان نوبت، از جمله `rawResponseItem/completed`، آن دیده‌بان کوتاه را غیرفعال می‌کند، زیرا Codex ثابت کرده است که نوبت هنوز زنده است؛ دیده‌بان نهایی طولانی‌تر همچنان از نوبت‌هایی که واقعاً گیر کرده‌اند محافظت می‌کند. اعلان‌های سراسری app-server، مانند به‌روزرسانی‌های محدودیت نرخ، پیشرفت بیکاری نوبت را بازنشانی نمی‌کنند. وقتی Codex یک مورد `agentMessage` کامل‌شده صادر می‌کند و سپس بدون `turn/completed` بی‌صدا می‌شود، OpenClaw خروجی دستیار را عملاً کامل در نظر می‌گیرد، به‌صورت best-effort نوبت بومی Codex را متوقف می‌کند، و مسیر نشست را آزاد می‌کند. تشخیص‌های پایان مهلت شامل آخرین متد اعلان app-server و، برای موارد پاسخ خام دستیار، نوع مورد، نقش، شناسه، و یک پیش‌نمایش محدود از متن دستیار هستند.

بازنویسی‌های محیطی همچنان برای آزمون محلی در دسترس‌اند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` وقتی
`appServer.command` تنظیم نشده باشد، باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای آزمون محلی موردی از
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. برای استقرارهای تکرارپذیر، پیکربندی ترجیح داده می‌شود، زیرا رفتار plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد که بقیه تنظیمات harness مربوط به Codex در آن قرار دارند.

## pluginهای بومی Codex

پشتیبانی از pluginهای بومی Codex از قابلیت‌های خود app و plugin مربوط به app-server Codex در همان رشته Codex که نوبت harness OpenClaw در آن است استفاده می‌کند. OpenClaw pluginهای Codex را به ابزارهای پویای مصنوعی `codex_plugin_*` OpenClaw ترجمه نمی‌کند.

`codexPlugins` فقط روی نشست‌هایی اثر می‌گذارد که harness بومی Codex را انتخاب می‌کنند. این تنظیم روی اجراهای PI، اجراهای عادی ارائه‌دهنده OpenAI، اتصال‌های گفت‌وگوی ACP، یا harnessهای دیگر اثری ندارد.

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

پیکربندی app رشته زمانی محاسبه می‌شود که OpenClaw یک نشست harness مربوط به Codex برقرار کند یا یک اتصال رشته Codex کهنه را جایگزین کند. این پیکربندی در هر نوبت دوباره محاسبه نمی‌شود. پس از تغییر `codexPlugins`، از `/new`، `/reset` استفاده کنید یا Gateway را دوباره راه‌اندازی کنید تا نشست‌های آینده harness مربوط به Codex با مجموعه app به‌روزشده آغاز شوند.

برای واجد شرایط بودن مهاجرت، موجودی app، خط‌مشی اقدام مخرب، elicitationها، و تشخیص‌های plugin بومی، [pluginهای بومی Codex](/fa/plugins/codex-native-plugins) را ببینید.

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی خودش پوشش داده شده است:
[استفاده از رایانه Codex](/fa/plugins/codex-computer-use).

نسخه کوتاه: OpenClaw app کنترل دسکتاپ را vendor نمی‌کند و خودش اقدام‌های دسکتاپ را اجرا نمی‌کند. OpenClaw app-server مربوط به Codex را آماده می‌کند، در دسترس بودن سرور MCP `computer-use` را بررسی می‌کند، و سپس اجازه می‌دهد Codex مالک فراخوانی‌های ابزار MCP بومی در طول نوبت‌های حالت Codex باشد.

## مرزهای زمان اجرا

harness مربوط به Codex فقط اجراکننده سطح‌پایین agent تعبیه‌شده را تغییر می‌دهد.

- ابزارهای پویای OpenClaw پشتیبانی می‌شوند. Codex از OpenClaw می‌خواهد این ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.
- ابزارهای shell، patch، MCP، و app بومی Codex-native متعلق به Codex هستند. OpenClaw می‌تواند رویدادهای بومی انتخاب‌شده را از طریق relay پشتیبانی‌شده مشاهده یا مسدود کند، اما آرگومان‌های ابزار بومی را بازنویسی نمی‌کند.
- Codex مالک Compaction بومی است. OpenClaw یک آینه رونوشت برای تاریخچه کانال، جست‌وجو، `/new`، `/reset`، و تغییرات آینده مدل یا harness نگه می‌دارد.
- تولید رسانه، درک رسانه، TTS، تأییدها، و خروجی ابزار پیام‌رسانی همچنان از طریق تنظیمات ارائه‌دهنده/مدل متناظر OpenClaw ادامه پیدا می‌کنند.
- `tool_result_persist` روی نتایج ابزار رونوشت متعلق به OpenClaw اعمال می‌شود، نه رکوردهای نتیجه ابزار Codex-native.

برای لایه‌های hook، سطوح V1 پشتیبانی‌شده، مدیریت مجوز بومی، هدایت صف، سازوکارهای بارگذاری بازخورد Codex، و جزئیات Compaction، [زمان اجرای harness مربوط به Codex](/fa/plugins/codex-harness-runtime) را ببینید.

## عیب‌یابی

**Codex به‌عنوان یک ارائه‌دهنده عادی `/model` ظاهر نمی‌شود:** این برای پیکربندی‌های جدید مورد انتظار است. یک مدل `openai/gpt-*` انتخاب کنید، `plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید آیا `plugins.allow`، `codex` را حذف می‌کند یا نه.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** مطمئن شوید مرجع مدل روی ارائه‌دهنده رسمی OpenAI برابر `openai/gpt-*` است و plugin مربوط به Codex نصب و فعال شده است. اگر هنگام آزمون به اثبات سخت‌گیرانه نیاز دارید، برای ارائه‌دهنده یا مدل `agentRuntime.id: "codex"` را تنظیم کنید. زمان اجرای اجباری Codex به‌جای بازگشت به PI شکست می‌خورد.

**پیکربندی قدیمی `openai-codex/*` باقی مانده است:** `openclaw doctor --fix` را اجرا کنید. Doctor مراجع مدل قدیمی را به `openai/*` بازنویسی می‌کند، pinهای کهنه زمان اجرای نشست و کل agent را حذف می‌کند، و بازنویسی‌های auth-profile موجود را حفظ می‌کند.

**app-server رد می‌شود:** از Codex app-server نسخه `0.125.0` یا جدیدتر استفاده کنید. پیش‌انتشارهای هم‌نسخه یا نسخه‌های دارای پسوند ساخت، مانند `0.125.0-alpha.2` یا `0.125.0+custom`، رد می‌شوند، زیرا OpenClaw کف پروتکل پایدار `0.125.0` را آزمون می‌کند.

**`/codex status` نمی‌تواند وصل شود:** بررسی کنید plugin بسته‌بندی‌شده `codex` فعال باشد، وقتی allowlist پیکربندی شده است `plugins.allow` شامل آن باشد، و هر `appServer.command`، `url`، `authToken`، یا header سفارشی معتبر باشد.

**کشف مدل کند است:** مقدار `plugins.entries.codex.config.discovery.timeoutMs` را کاهش دهید یا کشف را غیرفعال کنید. [مرجع harness مربوط به Codex](/fa/plugins/codex-harness-reference#model-discovery) را ببینید.

**انتقال WebSocket بلافاصله شکست می‌خورد:** `appServer.url`، `authToken`، headerها، و اینکه app-server دوردست همان نسخه پروتکل app-server Codex را صحبت می‌کند بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این مورد انتظار است مگر اینکه خط‌مشی زمان اجرای ارائه‌دهنده یا مدل آن را به harness دیگری مسیردهی کند. مراجع ساده ارائه‌دهنده غیر OpenAI در حالت `auto` روی مسیر عادی ارائه‌دهنده خود باقی می‌مانند.

**استفاده از رایانه نصب شده اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه، `/codex computer-use status` را بررسی کنید. اگر ابزاری `Native hook relay unavailable` گزارش کرد، از `/new` یا `/reset` استفاده کنید؛ اگر ادامه داشت، Gateway را دوباره راه‌اندازی کنید تا ثبت‌های hook بومی کهنه پاک شوند. [استفاده از رایانه Codex](/fa/plugins/codex-computer-use#troubleshooting) را ببینید.

## مرتبط

- [مرجع harness مربوط به Codex](/fa/plugins/codex-harness-reference)
- [زمان اجرای harness مربوط به Codex](/fa/plugins/codex-harness-runtime)
- [pluginهای بومی Codex](/fa/plugins/codex-native-plugins)
- [استفاده از رایانه Codex](/fa/plugins/codex-computer-use)
- [زمان‌های اجرای agent](/fa/concepts/agent-runtimes)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [ارائه‌دهنده OpenAI](/fa/providers/openai)
- [pluginهای harness مربوط به agent](/fa/plugins/sdk-agent-harness)
- [hookهای Plugin](/fa/plugins/hooks)
- [صدور تشخیص‌ها](/fa/gateway/diagnostics)
- [وضعیت](/fa/cli/status)
- [آزمون](/fa/help/testing-live#live-codex-app-server-harness-smoke)

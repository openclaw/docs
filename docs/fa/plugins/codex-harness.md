---
read_when:
    - می‌خواهید از هارنس app-server بسته‌بندی‌شدهٔ Codex استفاده کنید
    - به نمونه‌های پیکربندی هارنس Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به OpenClaw ناموفق شوند
summary: نوبت‌های عامل تعبیه‌شده OpenClaw را از طریق هارنس app-server همراه Codex اجرا کنید
title: مهار Codex
x-i18n:
    generated_at: "2026-07-04T10:52:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw امکان می‌دهد نوبت‌های عامل OpenAI را
از طریق Codex app-server به‌صورت تعبیه‌شده اجرا کند، نه از طریق harness داخلی OpenClaw.

وقتی می‌خواهید Codex مالک نشست سطح‌پایین عامل باشد، از Codex harness استفاده کنید:
ازسرگیری بومی thread، ادامه‌دهی بومی ابزار، compaction بومی، و اجرای
app-server. OpenClaw همچنان مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل،
ابزارهای پویای OpenClaw، تأییدها، تحویل رسانه، و آینه transcript قابل‌مشاهده است.

راه‌اندازی معمول از ارجاع‌های مدل canonical OpenAI مانند `openai/gpt-5.5` استفاده می‌کند.
ارجاع‌های قدیمی Codex GPT را پیکربندی نکنید. ترتیب احراز هویت عامل OpenAI را
زیر `auth.order.openai` قرار دهید؛ شناسه‌های قدیمی پروفایل احراز هویت Codex و
ورودی‌های قدیمی ترتیب احراز هویت Codex وضعیت قدیمی‌ای هستند که با
`openclaw doctor --fix` تعمیر می‌شوند.

وقتی هیچ sandbox ای از OpenClaw فعال نیست، OpenClaw threadهای Codex app-server را
با حالت کد بومی Codex فعال آغاز می‌کند، در حالی که حالت فقط-کد را به‌صورت پیش‌فرض خاموش می‌گذارد.
این کار workspace بومی و قابلیت‌های کدنویسی Codex را در دسترس نگه می‌دارد، در حالی که
ابزارهای پویای OpenClaw از طریق پل `item/tool/call` در app-server ادامه می‌یابند.
sandboxing فعال OpenClaw و سیاست‌های محدود ابزار، حالت کد بومی را
به‌طور کامل غیرفعال می‌کنند، مگر اینکه به مسیر آزمایشی sandbox exec-server وارد شوید.

این قابلیت بومی Codex جدا از
[حالت کد OpenClaw](/fa/reference/code-mode) است؛ آن یک runtime اختیاری QuickJS-WASI
برای اجراهای عمومی OpenClaw با شکل ورودی متفاوت `exec` است.

برای تقسیم گسترده‌تر مدل/ارائه‌دهنده/runtime، از
[Runtimeهای عامل](/fa/concepts/agent-runtimes) شروع کنید. خلاصه‌اش این است:
`openai/gpt-5.5` ارجاع مدل است، `codex` runtime است، و Telegram،
Discord، Slack، یا کانالی دیگر سطح ارتباطی باقی می‌ماند.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس.
- اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را شامل کنید.
- Codex app-server نسخه `0.125.0` یا جدیدتر. Plugin همراه به‌صورت پیش‌فرض یک
  binary سازگار Codex app-server را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex` در `PATH`
  بر شروع عادی harness اثری ندارند.
- احراز هویت Codex از طریق `openclaw models auth login --provider openai`،
  یک حساب app-server در خانه Codex عامل، یا یک پروفایل احراز هویت صریح API-key
  برای Codex در دسترس باشد.

برای اولویت احراز هویت، جداسازی محیط، فرمان‌های سفارشی app-server، کشف مدل،
و همه فیلدهای پیکربندی، به
[مرجع Codex harness](/fa/plugins/codex-harness-reference) مراجعه کنید.

## شروع سریع

بیشتر کاربرانی که Codex را در OpenClaw می‌خواهند، این مسیر را می‌خواهند: با یک
اشتراک ChatGPT/Codex وارد شوید، Plugin همراه `codex` را فعال کنید، و از یک
ارجاع مدل canonical `openai/gpt-*` استفاده کنید.

ورود با Codex OAuth:

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

پس از تغییر پیکربندی Plugin، Gateway را restart کنید. اگر یک چت موجود از قبل
نشست دارد، پیش از آزمودن تغییرات runtime از `/new` یا `/reset` استفاده کنید تا نوبت بعدی
harness را از پیکربندی فعلی resolve کند.

## اشتراک threadها با Codex Desktop و CLI

مقدار پیش‌فرض `appServer.homeScope: "agent"` هر عامل OpenClaw را از وضعیت بومی Codex
اپراتور جدا نگه می‌دارد. برای اینکه مالک بتواند از OpenClaw بخواهد همان threadهای بومی را
که Codex Desktop و Codex CLI نشان می‌دهند بررسی و مدیریت کند،
به خانه Codex کاربر وارد شوید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

حالت خانه کاربر فقط با انتقال stdio محلی در دسترس است. این حالت وقتی
`$CODEX_HOME` تنظیم شده باشد از آن و در غیر این صورت از `~/.codex` استفاده می‌کند، شامل احراز هویت بومی Codex،
پیکربندی، plugins، و ذخیره thread همان خانه. OpenClaw پروفایل احراز هویت OpenClaw را
به این app-server تزریق نمی‌کند.

نوبت‌های مالک ابزار `codex_threads` را دریافت می‌کنند. این ابزار می‌تواند threadهای بومی را فهرست، جست‌وجو، بخواند، fork کند،
تغییر نام دهد، archive کند، و restore کند. وقتی می‌خواهید ادامه یک thread را در OpenClaw دنبال کنید،
از عامل بخواهید آن را fork کند؛ fork به نشست فعلی
OpenClaw متصل می‌شود و برای دیگر clientهای بومی Codex قابل‌مشاهده می‌ماند. archive
نیازمند تأیید صریح است که thread در جای دیگری بسته شده است.

یک thread را هم‌زمان از OpenClaw و client دیگری از Codex ازسر نگیرید یا ننویسید.
Codex نویسندگان زنده را داخل یک فرایند app-server هماهنگ می‌کند، نه
در سراسر فرایندهای مستقل Desktop، CLI، و OpenClaw. Fork کردن یک
ادامه جداگانه ایجاد می‌کند و مسیر همزیستی امن است.

## پیکربندی

پیکربندی شروع سریع حداقل پیکربندی قابل‌استفاده Codex harness است. گزینه‌های Codex
harness را در پیکربندی OpenClaw تنظیم کنید، و از CLI فقط برای احراز هویت Codex استفاده کنید:

| نیاز                                   | تنظیم                                                                              | کجا                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| فعال‌کردن harness                     | `plugins.entries.codex.enabled: true`                                            | پیکربندی OpenClaw                    |
| نگه‌داشتن نصب Plugin در allowlist     | شامل‌کردن `codex` در `plugins.allow`                                               | پیکربندی OpenClaw                    |
| هدایت نوبت‌های عامل OpenAI از طریق Codex | `agents.defaults.model` یا `agents.list[].model` به‌صورت `openai/gpt-*`               | پیکربندی عامل OpenClaw              |
| ورود با ChatGPT/Codex OAuth       | `openclaw models auth login --provider openai`                                   | پروفایل احراز هویت CLI                   |
| افزودن پشتیبان API-key برای اجراهای Codex      | پروفایل API-key به‌صورت `openai:*` که پس از احراز هویت اشتراکی در `auth.order.openai` فهرست شده باشد | پروفایل احراز هویت CLI + پیکربندی OpenClaw |
| fail closed وقتی Codex در دسترس نیست  | `agentRuntime.id: "codex"` در ارائه‌دهنده یا مدل                                     | پیکربندی مدل/ارائه‌دهنده OpenClaw     |
| استفاده از ترافیک مستقیم OpenAI API          | `agentRuntime.id: "openclaw"` در ارائه‌دهنده یا مدل با احراز هویت عادی OpenAI          | پیکربندی مدل/ارائه‌دهنده OpenClaw     |
| تنظیم رفتار app-server               | `plugins.entries.codex.config.appServer.*`                                       | پیکربندی Plugin Codex                |
| فعال‌کردن برنامه‌های بومی Plugin در Codex        | `plugins.entries.codex.config.codexPlugins.*`                                    | پیکربندی Plugin Codex                |
| فعال‌کردن Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | پیکربندی Plugin Codex                |

برای نوبت‌های عامل OpenAI پشتیبانی‌شده با Codex از ارجاع‌های مدل `openai/gpt-*` استفاده کنید. برای
ترتیب اول-اشتراک/پشتیبان-API-key، `auth.order.openai` را ترجیح دهید. شناسه‌های موجود
پروفایل احراز هویت قدیمی Codex و ترتیب احراز هویت قدیمی Codex، وضعیت قدیمی مخصوص doctor هستند؛
ارجاع‌های جدید قدیمی Codex GPT ننویسید.

روی عامل‌های پشتیبانی‌شده با Codex، `compaction.model` یا `compaction.provider` تنظیم نکنید.
Codex از طریق وضعیت thread بومی app-server خودش compact می‌کند، بنابراین OpenClaw
این overrideهای summarizer محلی را در runtime نادیده می‌گیرد و `openclaw doctor --fix`
وقتی عامل از Codex استفاده می‌کند آن‌ها را حذف می‌کند.

Lossless همچنان به‌عنوان موتور context برای assembly، ingestion، و
maintenance پیرامون نوبت‌های Codex پشتیبانی می‌شود. آن را از طریق
`plugins.slots.contextEngine: "lossless-claw"` و
`plugins.entries.lossless-claw.config.summaryModel` پیکربندی کنید، نه از طریق
`agents.defaults.compaction.provider`. `openclaw doctor --fix` شکل قدیمی
`compaction.provider: "lossless-claw"` را وقتی Codex runtime فعال است به slot موتور context Lossless
مهاجرت می‌دهد، اما Codex بومی همچنان مالک compaction است.

Codex app-server harness بومی از موتورهای context که به assembly پیش از prompt نیاز دارند
پشتیبانی می‌کند. backendهای عمومی CLI، از جمله `codex-cli`، این قابلیت host را فراهم نمی‌کنند.

برای عامل‌های پشتیبانی‌شده با Codex، `/compact`، compaction بومی Codex app-server را روی
thread متصل آغاز می‌کند. OpenClaw منتظر تکمیل نمی‌ماند، timeout مربوط به OpenClaw
اعمال نمی‌کند، app-server مشترک را restart نمی‌کند، یا به موتور context یا
summarizer عمومی OpenAI fallback نمی‌کند. اگر اتصال thread بومی Codex گم شده یا
کهنه باشد، فرمان fail closed می‌شود تا اپراتور مرز واقعی runtime را ببیند
به‌جای اینکه بی‌صدا backendهای compaction را عوض کند.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

در آن شکل، هر دو پروفایل همچنان برای نوبت‌های عامل `openai/gpt-*`
از طریق Codex اجرا می‌شوند. کلید API فقط یک fallback احراز هویت است، نه درخواستی برای تغییر به OpenClaw یا
OpenAI Responses ساده.

باقی این صفحه گونه‌های رایجی را پوشش می‌دهد که کاربران باید بین آن‌ها انتخاب کنند:
شکل استقرار، routing به‌صورت fail-closed، سیاست تأیید guardian، Pluginهای بومی Codex،
و Computer Use. برای فهرست کامل گزینه‌ها، پیش‌فرض‌ها، enumها، کشف،
جداسازی محیط، timeoutها، و فیلدهای انتقال app-server، به
[مرجع Codex harness](/fa/plugins/codex-harness-reference) مراجعه کنید.

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

`/codex status` اتصال app-server، حساب، rate limitها، سرورهای MCP،
و skills را گزارش می‌کند. `/codex models` کاتالوگ زنده Codex app-server را برای
harness و حساب فهرست می‌کند. اگر `/status` غیرمنتظره است، به
[عیب‌یابی](#troubleshooting) مراجعه کنید.

## Routing و انتخاب مدل

ارجاع‌های ارائه‌دهنده و سیاست runtime را جدا نگه دارید:

- از `openai/gpt-*` برای نوبت‌های عامل OpenAI از طریق Codex استفاده کنید.
- از ارجاع‌های قدیمی Codex GPT در پیکربندی استفاده نکنید. برای
  تعمیر ارجاع‌های قدیمی و pinهای مسیر نشست کهنه، `openclaw doctor --fix` را اجرا کنید.
- `agentRuntime.id: "codex"` برای حالت خودکار عادی OpenAI اختیاری است، اما
  وقتی یک استقرار باید در صورت در دسترس نبودن Codex به‌صورت fail closed عمل کند مفید است.
- `agentRuntime.id: "openclaw"` یک ارائه‌دهنده یا مدل را وقتی عمدی باشد به runtime
  تعبیه‌شده OpenClaw وارد می‌کند.
- `/codex ...` مکالمه‌های بومی Codex app-server را از چت کنترل می‌کند.
- ACP/acpx یک مسیر harness خارجی جداگانه است. فقط وقتی کاربر
  ACP/acpx یا adapter harness خارجی می‌خواهد از آن استفاده کنید.

Routing رایج فرمان:

| نیت کاربر                                            | کاربرد                                                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| پیوست کردن گفت‌وگوی فعلی                              | `/codex bind [--cwd <path>]`                                                                          |
| ازسرگیری یک رشتهٔ موجود Codex                         | `/codex resume <thread-id>`                                                                           |
| فهرست کردن یا فیلتر کردن رشته‌های Codex               | `/codex threads [filter]`                                                                             |
| فهرست کردن Pluginهای بومی Codex                       | `/codex plugins list`                                                                                 |
| فعال یا غیرفعال کردن یک Plugin بومی پیکربندی‌شده Codex | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| پیوست کردن یک نشست موجود Codex CLI روی یک گره جفت‌شده | `/codex sessions --host <node> [filter]`, سپس `/codex resume <session-id> --host <node> --bind here` |
| فقط ارسال بازخورد Codex                               | `/codex diagnostics [note]`                                                                           |
| شروع یک وظیفه ACP/acpx                                | فرمان‌های نشست ACP/acpx، نه `/codex`                                                                 |

| مورد استفاده                                         | پیکربندی                                                               | راستی‌آزمایی                            | یادداشت‌ها                            |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| اشتراک ChatGPT/Codex با زمان‌اجرای بومی Codex        | `openai/gpt-*` به‌همراه Plugin فعال‌شدهٔ `codex`                       | `/status` مقدار `Runtime: OpenAI Codex` را نشان می‌دهد | مسیر توصیه‌شده                        |
| اگر Codex در دسترس نبود، بسته شکست بخورد             | ارائه‌دهنده یا مدل `agentRuntime.id: "codex"`                          | نوبت به‌جای بازگشت تعبیه‌شده شکست می‌خورد | برای استقرارهای فقط Codex استفاده کنید |
| عبور مستقیم ترافیک کلید API OpenAI از طریق OpenClaw  | ارائه‌دهنده یا مدل `agentRuntime.id: "openclaw"` و احراز هویت عادی OpenAI | `/status` زمان‌اجرای OpenClaw را نشان می‌دهد | فقط وقتی OpenClaw عمدی است استفاده کنید |
| پیکربندی قدیمی                                       | ارجاع‌های GPT قدیمی Codex                                              | `openclaw doctor --fix` آن را بازنویسی می‌کند | پیکربندی جدید را به این روش ننویسید   |
| آداپتور ACP/acpx Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                               | وضعیت وظیفه/نشست ACP                   | جدا از مهار بومی Codex                |

`agents.defaults.imageModel` از همان تفکیک پیشوند پیروی می‌کند. برای مسیر
عادی OpenAI از `openai/gpt-*` استفاده کنید و فقط وقتی فهم تصویر باید از طریق
یک نوبت محدود app-server در Codex اجرا شود از `codex/gpt-*` استفاده کنید. از
ارجاع‌های GPT قدیمی Codex استفاده نکنید؛ doctor آن پیشوند قدیمی را به
`openai/gpt-*` بازنویسی می‌کند.

## الگوهای استقرار

### استقرار پایه Codex

وقتی همهٔ نوبت‌های عامل OpenAI باید به‌صورت پیش‌فرض از Codex استفاده کنند،
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

### استقرار ارائه‌دهندهٔ ترکیبی

این شکل Claude را به‌عنوان عامل پیش‌فرض نگه می‌دارد و یک عامل نام‌دار Codex
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

با این پیکربندی، عامل `main` از مسیر عادی ارائه‌دهندهٔ خود استفاده می‌کند و
عامل `codex` از app-server در Codex استفاده می‌کند.

### استقرار Codex با شکست بسته

برای نوبت‌های عامل OpenAI، وقتی Plugin بسته‌بندی‌شده در دسترس باشد،
`openai/gpt-*` از قبل به Codex resolve می‌شود. وقتی یک قاعدهٔ مکتوب شکست بسته
می‌خواهید، سیاست زمان‌اجرای صریح اضافه کنید:

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

وقتی Codex اجباری شود، اگر Plugin Codex غیرفعال باشد، app-server بیش از حد
قدیمی باشد، یا app-server نتواند شروع شود، OpenClaw زود شکست می‌خورد.

## سیاست app-server

به‌صورت پیش‌فرض، Plugin باینری مدیریت‌شدهٔ Codex متعلق به OpenClaw را به‌صورت
محلی با انتقال stdio شروع می‌کند. `appServer.command` را فقط وقتی تنظیم کنید
که عمداً می‌خواهید یک فایل اجرایی متفاوت را اجرا کنید. فقط وقتی app-server
از قبل جای دیگری در حال اجراست از انتقال WebSocket استفاده کنید:

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

نشست‌های محلی stdio app-server به‌صورت پیش‌فرض وضعیت عملگر محلی مورد اعتماد
را دارند: `approvalPolicy: "never"`،‏ `approvalsReviewer: "user"` و
`sandbox: "danger-full-access"`. اگر الزامات محلی Codex اجازهٔ آن وضعیت ضمنی
YOLO را ندهند، OpenClaw به‌جای آن مجوزهای نگهبان مجاز را انتخاب می‌کند.
وقتی برای نشست یک sandbox در OpenClaw فعال باشد، OpenClaw به‌جای تکیه بر
sandbox سمت میزبان Codex، حالت بومی Code Mode در Codex، سرورهای MCP کاربر، و
اجرای Pluginهای پشتیبانی‌شده با app را برای آن نوبت غیرفعال می‌کند. دسترسی
shell از طریق ابزارهای پویای پشتیبانی‌شده با sandbox در OpenClaw، مانند
`sandbox_exec` و `sandbox_process`، وقتی ابزارهای عادی exec/process در دسترس
باشند ارائه می‌شود.

وقتی می‌خواهید پیش از خروج از sandbox یا مجوزهای اضافی، بازبینی خودکار بومی
Codex را داشته باشید، از حالت exec نرمال‌شدهٔ OpenClaw استفاده کنید:

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

برای نشست‌های app-server در Codex، OpenClaw مقدار `tools.exec.mode: "auto"` را
به تأییدهای بازبینی‌شده توسط Guardian در Codex نگاشت می‌کند؛ معمولاً
`approvalPolicy: "on-request"`،‏ `approvalsReviewer: "auto_review"` و
`sandbox: "workspace-write"` وقتی الزامات محلی آن مقادیر را مجاز بدانند.
در `tools.exec.mode: "auto"`، OpenClaw بازنویسی‌های ناامن قدیمی Codex یعنی
`approvalPolicy: "never"` یا `sandbox: "danger-full-access"` را حفظ نمی‌کند؛
برای وضعیت عمدی بدون تأیید در Codex از `tools.exec.mode: "full"` استفاده کنید.
پیش‌تنظیم قدیمی `plugins.entries.codex.config.appServer.mode: "guardian"` هنوز
کار می‌کند، اما `tools.exec.mode: "auto"` سطح نرمال‌شدهٔ OpenClaw است.

برای مقایسهٔ سطح حالت با تأییدهای exec میزبان و مجوزهای ACPX، به
[حالت‌های مجوز](/fa/tools/permission-modes) مراجعه کنید.

برای همهٔ فیلدهای app-server، ترتیب احراز هویت، جداسازی محیط، کشف، و رفتار
مهلت زمانی، به [مرجع مهار Codex](/fa/plugins/codex-harness-reference) مراجعه
کنید.

## فرمان‌ها و عیب‌یابی

Plugin بسته‌بندی‌شده `/codex` را به‌عنوان یک فرمان اسلش در هر کانالی که از
فرمان‌های متنی OpenClaw پشتیبانی کند ثبت می‌کند.

اجرای بومی و کنترل به یک مالک یا یک کلاینت Gateway با `operator.admin` نیاز
دارد. این شامل متصل کردن یا ازسرگیری رشته‌ها، ارسال یا توقف نوبت‌ها، تغییر
مدل، حالت سریع، یا وضعیت مجوز، compact کردن یا بازبینی، و جدا کردن یک اتصال
می‌شود. فرستندگان مجاز دیگر فرمان‌های فقط خواندنی وضعیت، راهنما، حساب، مدل،
رشته، سرور MCP، skill، و بازرسی اتصال را نگه می‌دارند.

شکل‌های رایج:

- `/codex status` اتصال app-server، مدل‌ها، حساب، محدودیت‌های نرخ، سرورهای
  MCP، و skills را بررسی می‌کند.
- `/codex models` مدل‌های زندهٔ app-server در Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر app-server در Codex را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک رشتهٔ موجود Codex
  متصل می‌کند.
- `/codex compact` از app-server در Codex می‌خواهد رشتهٔ متصل‌شده را compact
  کند.
- `/codex review` بازبینی بومی Codex را برای رشتهٔ متصل‌شده شروع می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد Codex برای رشتهٔ متصل‌شده
  سؤال می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP در app-server Codex را فهرست می‌کند.
- `/codex skills` skills app-server در Codex را فهرست می‌کند.

برای بیشتر گزارش‌های پشتیبانی، با `/diagnostics [note]` در همان گفت‌وگویی
شروع کنید که اشکال در آن رخ داده است. این یک گزارش عیب‌یابی Gateway ایجاد
می‌کند و، برای نشست‌های مهار Codex، برای ارسال بستهٔ بازخورد مرتبط Codex
درخواست تأیید می‌کند. برای مدل حریم خصوصی و رفتار گفت‌وگوی گروهی به
[خروجی عیب‌یابی](/fa/gateway/diagnostics) مراجعه کنید.

فقط وقتی از `/codex diagnostics [note]` استفاده کنید که مشخصاً می‌خواهید
بارگذاری بازخورد Codex را برای رشتهٔ فعلاً متصل‌شده بدون بستهٔ کامل عیب‌یابی
Gateway انجام دهید.

### بازرسی محلی رشته‌های Codex

سریع‌ترین راه برای بازرسی یک اجرای بد Codex اغلب باز کردن مستقیم رشتهٔ بومی
Codex است:

```bash
codex resume <thread-id>
```

شناسهٔ رشته را از پاسخ کامل‌شدهٔ `/diagnostics`،‏ `/codex binding`، یا
`/codex threads [filter]` بگیرید.

برای سازوکارهای بارگذاری و مرزهای عیب‌یابی در سطح زمان‌اجرا، به
[زمان‌اجرای مهار Codex](/fa/plugins/codex-harness-runtime#codex-feedback-upload)
مراجعه کنید.

در خانهٔ پیش‌فرض هر عامل، احراز هویت به این ترتیب انتخاب می‌شود:

1. پروفایل‌های احراز هویت مرتب‌شدهٔ OpenAI برای عامل، ترجیحاً زیر
   `auth.order.openai`. برای مهاجرت شناسه‌های قدیمی پروفایل احراز هویت Codex و
   ترتیب احراز هویت قدیمی Codex، `openclaw doctor --fix` را اجرا کنید.
2. حساب موجود app-server در خانهٔ Codex همان عامل.
3. فقط برای راه‌اندازی‌های محلی stdio app-server، وقتی هیچ حساب app-server
   حاضر نیست و احراز هویت OpenAI همچنان لازم است، ابتدا `CODEX_API_KEY` و سپس
   `OPENAI_API_KEY`.

وقتی OpenClaw یک پروفایل احراز هویت Codex به سبک اشتراک ChatGPT می‌بیند،
`CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex ایجادشده حذف
می‌کند. این کار کلیدهای API در سطح Gateway را برای embeddingها یا مدل‌های
مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه نوبت‌های بومی app-server در
Codex به‌طور تصادفی از طریق API صورتحساب شوند. پروفایل‌های صریح کلید API
Codex و بازگشت محلی stdio با کلید محیط به‌جای محیط ارث‌بردهٔ فرایند فرزند از
ورود app-server استفاده می‌کنند. اتصال‌های WebSocket app-server بازگشت کلید
API محیط Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب
خود app-server راه دور استفاده کنید.
وقتی Pluginهای بومی Codex پیکربندی شده باشند، OpenClaw آن Pluginها را پیش از
نمایان کردن appهای متعلق به Plugin برای رشتهٔ Codex، از طریق app-server
متصل‌شده نصب یا تازه‌سازی می‌کند. `app/list` همچنان منبع حقیقت برای شناسه‌های
app، دسترس‌پذیری، و فراداده است، اما OpenClaw مالک تصمیم فعال‌سازی هر رشته
است: اگر سیاست اجازهٔ یک app فهرست‌شدهٔ دسترس‌پذیر را بدهد، OpenClaw مقدار
`thread/start.config.apps[appId].enabled = true` را ارسال می‌کند، حتی وقتی
`app/list` در حال حاضر گزارش دهد که آن app غیرفعال است. این مسیر برای
شناسه‌های ناشناخته نصب app اختراع نمی‌کند؛ OpenClaw فقط Pluginهای marketplace
را با `plugin/install` فعال می‌کند و سپس موجودی را تازه‌سازی می‌کند.

اگر یک پروفایل اشتراکی به محدودیت استفادهٔ Codex بخورد، OpenClaw وقتی Codex
زمان بازنشانی را گزارش کند آن را ثبت می‌کند و برای همان اجرای Codex پروفایل
احراز هویت مرتب‌شدهٔ بعدی را امتحان می‌کند. وقتی زمان بازنشانی بگذرد،
پروفایل اشتراکی دوباره بدون تغییر مدل انتخاب‌شدهٔ `openai/gpt-*` یا
زمان‌اجرای Codex واجد شرایط می‌شود.

برای راه‌اندازی‌های محلی app-server با stdio، OpenClaw مقدار `CODEX_HOME` را روی یک پوشهٔ مخصوص هر عامل تنظیم می‌کند تا پیکربندی Codex، فایل‌های احراز هویت/حساب، کش/داده‌های Plugin و وضعیت بومی رشته به‌طور پیش‌فرض `~/.codex` شخصی اپراتور را نخوانند یا در آن ننویسند. OpenClaw مقدار عادی `HOME` فرایند را حفظ می‌کند؛ زیرفرایندهای اجراشده توسط Codex همچنان می‌توانند پیکربندی و توکن‌های خانهٔ کاربر را پیدا کنند، و Codex ممکن است مدخل‌های مشترک `$HOME/.agents/skills` و `$HOME/.agents/plugins/marketplace.json` را کشف کند. با `appServer.homeScope: "user"`، OpenClaw در عوض از خانهٔ بومی Codex کاربر و حساب موجود آن استفاده می‌کند، بدون اینکه یک نمایهٔ احراز هویت OpenClaw تزریق کند.

اگر یک استقرار به جداسازی محیطی بیشتری نیاز دارد، آن متغیرها را به `appServer.clearEnv` اضافه کنید:

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

`appServer.clearEnv` فقط بر فرایند فرزند app-server مربوط به Codex که ایجاد می‌شود اثر می‌گذارد. OpenClaw هنگام نرمال‌سازی راه‌اندازی محلی، `CODEX_HOME` و `HOME` را از این فهرست حذف می‌کند: `CODEX_HOME` همچنان به محدودهٔ انتخاب‌شدهٔ عامل یا کاربر اشاره می‌کند، و `HOME` همچنان به‌صورت ارث‌بری‌شده باقی می‌ماند تا زیرفرایندها بتوانند از وضعیت عادی خانهٔ کاربر استفاده کنند.

ابزارهای پویای Codex به‌طور پیش‌فرض با بارگذاری `searchable` کار می‌کنند. OpenClaw ابزارهای پویایی را که عملیات بومی فضای کاری Codex را تکرار می‌کنند در معرض استفاده قرار نمی‌دهد: `read`، `write`، `edit`، `apply_patch`، `exec`، `process` و `update_plan`. بیشتر ابزارهای یکپارچه‌سازی باقی‌ماندهٔ OpenClaw، مانند پیام‌رسانی، رسانه، Cron، مرورگر، گره‌ها، Gateway و `heartbeat_respond` از طریق جست‌وجوی ابزار Codex در فضای نام `openclaw` در دسترس هستند و زمینهٔ اولیهٔ مدل را کوچک‌تر نگه می‌دارند. وقتی جست‌وجو فعال باشد و هیچ ارائه‌دهندهٔ مدیریت‌شده‌ای انتخاب نشده باشد، جست‌وجوی وب به‌طور پیش‌فرض از ابزار میزبانی‌شدهٔ `web_search` در Codex استفاده می‌کند. جست‌وجوی میزبانی‌شدهٔ بومی و ابزار پویای مدیریت‌شدهٔ `web_search` در OpenClaw متقابلاً انحصاری هستند تا جست‌وجوی مدیریت‌شده نتواند محدودیت‌های دامنهٔ بومی را دور بزند. OpenClaw وقتی جست‌وجوی میزبانی‌شده در دسترس نباشد، صراحتاً غیرفعال شده باشد، یا با یک ارائه‌دهندهٔ مدیریت‌شدهٔ انتخاب‌شده جایگزین شده باشد، از ابزار مدیریت‌شده استفاده می‌کند. OpenClaw افزونهٔ مستقل `web.run` در Codex را غیرفعال نگه می‌دارد، زیرا ترافیک app-server تولیدی فضای نام تعریف‌شده توسط کاربرِ `web` را رد می‌کند. `tools.web.search.enabled: false` هر دو مسیر را غیرفعال می‌کند؛ اجراهای فقط LLM با ابزارهای غیرفعال نیز همین‌طورند. Codex مقدار `"cached"` را به‌عنوان یک ترجیح در نظر می‌گیرد و آن را برای نوبت‌های app-server بدون محدودیت به دسترسی زندهٔ خارجی تبدیل می‌کند. وقتی `allowedDomains` بومی تنظیم شده باشد، fallback مدیریت‌شدهٔ خودکار به‌صورت بسته شکست می‌خورد تا فهرست مجاز دور زده نشود. تغییرات پایدار در سیاست مؤثر جست‌وجو، رشتهٔ متصل‌شدهٔ Codex را پیش از نوبت بعدی می‌چرخانند. محدودیت‌های گذرای هر نوبت از یک رشتهٔ موقت محدودشده استفاده می‌کنند و اتصال موجود را برای ادامهٔ بعدی حفظ می‌کنند. پاسخ‌های منبع فقط با ابزار پیام و `sessions_yield` مستقیم باقی می‌مانند، زیرا این‌ها قراردادهای کنترل نوبت هستند. `sessions_spawn` قابل جست‌وجو باقی می‌ماند تا `spawn_agent` بومی Codex سطح اصلی زیرعامل Codex باقی بماند، درحالی‌که تفویض صریح OpenClaw یا ACP همچنان از طریق فضای نام ابزار پویای `openclaw` در دسترس است. دستورالعمل‌های همکاری Heartbeat به Codex می‌گویند وقتی ابزار از قبل بارگذاری نشده است، پیش از پایان دادن به یک نوبت Heartbeat، `heartbeat_respond` را جست‌وجو کند.

`codexDynamicToolsLoading: "direct"` را فقط وقتی تنظیم کنید که به یک app-server سفارشی Codex وصل می‌شوید که نمی‌تواند ابزارهای پویای به‌تعویق‌افتاده را جست‌وجو کند، یا وقتی در حال اشکال‌زدایی payload کامل ابزار هستید.

فیلدهای سطح بالای پشتیبانی‌شدهٔ Plugin مربوط به Codex:

| فیلد                       | پیش‌فرض       | معنا                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw مستقیماً در زمینهٔ اولیهٔ ابزار Codex قرار بگیرند. |
| `codexDynamicToolsExclude` | `[]`           | نام ابزارهای پویای اضافی OpenClaw که باید از نوبت‌های app-server مربوط به Codex حذف شوند.              |
| `codexPlugins`             | غیرفعال       | پشتیبانی بومی Plugin/برنامهٔ Codex برای Pluginهای گزینش‌شدهٔ مهاجرت‌کرده که از منبع نصب شده‌اند.           |

فیلدهای پشتیبانی‌شدهٔ `appServer`:

| فیلد                                         | پیش‌فرض                                                | معنا                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"`، Codex را ایجاد می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` وضعیت Codex را برای هر عامل OpenClaw ایزوله می‌کند. `"user"`، `$CODEX_HOME` بومی یا `~/.codex` را به اشتراک می‌گذارد، از احراز هویت بومی استفاده می‌کند، و مدیریت رشتهٔ فقط مالک را فعال می‌کند. دامنهٔ کاربر به stdio نیاز دارد.                                                                                                                                                                                               |
| `command`                                     | باینری مدیریت‌شدهٔ Codex                                   | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده آن را تنظیم‌نشده بگذارید؛ فقط برای بازنویسی صریح تنظیمش کنید.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌ها برای انتقال stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | تنظیم‌نشده                                                  | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | تنظیم‌نشده                                                  | توکن Bearer برای انتقال WebSocket. رشتهٔ لفظی یا SecretInput مانند `${CODEX_APP_SERVER_TOKEN}` را می‌پذیرد.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | سرآیندهای اضافی WebSocket. مقادیر سرآیند، رشته‌های لفظی یا مقادیر SecretInput را می‌پذیرند، برای مثال `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | نام‌های متغیر محیطی اضافی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw، از فرایند app-server ایجادشدهٔ stdio حذف می‌شوند. OpenClaw برای اجراهای محلی، `CODEX_HOME` انتخاب‌شده و `HOME` ارث‌بری‌شده را نگه می‌دارد.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | سطح ابزار فقط حالت کد Codex را فعال کنید. ابزارهای پویای OpenClaw همچنان در Codex ثبت می‌مانند تا فراخوانی‌های تودرتوی `tools.*` از طریق پل `item/tool/call` app-server بازگردند.                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | تنظیم‌نشده                                                  | ریشهٔ فضای کاری app-server راه‌دور Codex. وقتی تنظیم شود، OpenClaw ریشهٔ فضای کاری محلی را از فضای کاری حل‌شدهٔ OpenClaw استنتاج می‌کند، پسوند cwd فعلی را زیر این ریشهٔ راه‌دور حفظ می‌کند، و فقط cwd نهایی app-server را به Codex می‌فرستد. اگر cwd بیرون از ریشهٔ فضای کاری حل‌شدهٔ OpenClaw باشد، OpenClaw به‌جای فرستادن مسیر محلی Gateway به app-server راه‌دور، به‌صورت بسته شکست می‌خورد. |
| `requestTimeoutMs`                            | `60000`                                                | مهلت زمانی برای فراخوانی‌های سطح کنترل app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | پنجرهٔ سکوت پس از پذیرش یک نوبت توسط Codex یا پس از یک درخواست app-server با دامنهٔ نوبت، در حالی که OpenClaw منتظر `turn/completed` است.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | محافظ بیکاری تکمیل و پیشرفت که پس از واگذاری ابزار، تکمیل ابزار بومی، پیشرفت دستیار خام پس از ابزار، تکمیل استدلال خام، یا پیشرفت استدلال استفاده می‌شود، در حالی که OpenClaw منتظر `turn/completed` است. از این برای بارهای کاری مورد اعتماد یا سنگین استفاده کنید که ترکیب پس از ابزار می‌تواند به‌طور مشروع بیشتر از بودجهٔ انتشار نهایی دستیار ساکت بماند.                                |
| `mode`                                        | `"yolo"` مگر اینکه نیازمندی‌های محلی Codex، YOLO را مجاز ندانند | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط نگهبان. نیازمندی‌های stdio محلی که `danger-full-access`، تأیید `never`، یا بازبین `user` را حذف کنند، پیش‌فرض ضمنی را نگهبان می‌کنند.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` یا یک سیاست تأیید مجاز نگهبان       | سیاست تأیید بومی Codex که به شروع/ازسرگیری/نوبت رشته فرستاده می‌شود. پیش‌فرض‌های نگهبان، وقتی مجاز باشد، `"on-request"` را ترجیح می‌دهند.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` یا یک sandbox مجاز نگهبان  | حالت sandbox بومی Codex که به شروع/ازسرگیری رشته فرستاده می‌شود. پیش‌فرض‌های نگهبان، وقتی مجاز باشد، `"workspace-write"` را ترجیح می‌دهند، وگرنه `"read-only"`. وقتی یک sandbox در OpenClaw فعال باشد، نوبت‌های `danger-full-access` از `workspace-write` در Codex با دسترسی شبکه مشتق‌شده از تنظیم خروجی sandbox در OpenClaw استفاده می‌کنند.                                                                                     |
| `approvalsReviewer`                           | `"user"` یا یک بازبین مجاز نگهبان               | از `"auto_review"` استفاده کنید تا Codex، وقتی مجاز باشد، درخواست‌های تأیید بومی را بازبینی کند؛ وگرنه `guardian_subagent` یا `user`. `guardian_subagent` همچنان یک نام مستعار قدیمی است.                                                                                                                                                                                                                              |
| `serviceTier`                                 | تنظیم‌نشده                                                  | ردهٔ سرویس اختیاری app-server در Codex. `"priority"` مسیریابی حالت سریع را فعال می‌کند، `"flex"` پردازش flex را درخواست می‌کند، `null` بازنویسی را پاک می‌کند، و `"fast"` قدیمی به‌عنوان `"priority"` پذیرفته می‌شود.                                                                                                                                                                                                 |
| `networkProxy`                                | غیرفعال                                               | شبکه‌سازی پروفایل مجوزهای Codex را برای فرمان‌های app-server فعال کنید. OpenClaw به‌جای فرستادن `sandbox`، پیکربندی `permissions.<profile>.network` انتخاب‌شده را تعریف می‌کند و آن را با `default_permissions` انتخاب می‌کند.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | فعال‌سازی آزمایشی که یک محیط Codex مبتنی بر sandbox OpenClaw را با app-server Codex نسخهٔ 0.132.0 یا جدیدتر ثبت می‌کند تا اجرای بومی Codex بتواند داخل sandbox فعال OpenClaw اجرا شود.                                                                                                                                                                                                         |

`appServer.networkProxy` صریح است، چون قرارداد sandbox در Codex را تغییر می‌دهد.
وقتی فعال باشد، OpenClaw همچنین `features.network_proxy.enabled` و
`default_permissions` را در پیکربندی رشتهٔ Codex تنظیم می‌کند تا پروفایل مجوز
تولیدشده بتواند شبکه‌سازی مدیریت‌شدهٔ Codex را شروع کند. به‌صورت پیش‌فرض، OpenClaw
یک نام پروفایل مقاوم در برابر برخورد به‌شکل `openclaw-network-<fingerprint>` از بدنهٔ
پروفایل تولید می‌کند؛ فقط وقتی یک نام محلی پایدار لازم است از `profileName` استفاده کنید.

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

اگر زمان اجرای معمولی app-server برابر `danger-full-access` باشد، فعال کردن
`networkProxy` برای نمایهٔ مجوز تولیدشده از دسترسی فایل‌سیستمی به سبک workspace استفاده می‌کند. اجرای شبکهٔ مدیریت‌شدهٔ Codex شبکه‌سازی sandboxed است،
بنابراین نمایهٔ دسترسی کامل از ترافیک خروجی محافظت نمی‌کند.
ورودی‌های دامنه از `allow` یا `deny` استفاده می‌کنند؛ ورودی‌های سوکت Unix از
مقادیر `allow` یا `none` مربوط به Codex استفاده می‌کنند.

فراخوانی‌های ابزار پویا که در مالکیت OpenClaw هستند، مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: درخواست‌های Codex `item/tool/call` به طور پیش‌فرض از یک ناظر ۹۰ ثانیه‌ای OpenClaw استفاده می‌کنند. آرگومان مثبت `timeoutMs` برای هر فراخوانی، بودجهٔ همان ابزار مشخص را افزایش یا کاهش می‌دهد. ابزار `image_generate` وقتی فراخوانی ابزار مهلت زمانی خودش را ارائه نکند از
`agents.defaults.imageGenerationModel.timeoutMs` استفاده می‌کند، وگرنه از پیش‌فرض ۱۲۰ ثانیه‌ای تولید تصویر استفاده می‌شود.
ابزار درک رسانه‌ای `image` از
`tools.media.image.timeoutSeconds` یا پیش‌فرض رسانه‌ای ۶۰ ثانیه‌ای خود استفاده می‌کند. برای درک تصویر، آن مهلت زمانی روی خود درخواست اعمال می‌شود و به خاطر کار آماده‌سازی قبلی کاهش نمی‌یابد. بودجه‌های ابزار پویا
در 600000 ms سقف‌گذاری می‌شوند. هنگام پایان مهلت، OpenClaw در صورت پشتیبانی سیگنال ابزار را لغو می‌کند و یک پاسخ ناموفق ابزار پویا به Codex برمی‌گرداند تا نوبت بتواند ادامه پیدا کند، به جای اینکه نشست در وضعیت `processing` باقی بماند.
این ناظر بودجهٔ بیرونی پویای `item/tool/call` است؛ مهلت‌های زمانی درخواست مخصوص ارائه‌دهنده داخل همان فراخوانی اجرا می‌شوند و معناشناسی مهلت زمانی خودشان را حفظ می‌کنند.

پس از اینکه Codex یک نوبت را می‌پذیرد، و پس از اینکه OpenClaw به یک درخواست app-server محدود به همان نوبت پاسخ می‌دهد، harness انتظار دارد Codex در نوبت فعلی پیشرفت کند و در نهایت نوبت بومی را با `turn/completed` تمام کند. اگر app-server به مدت `appServer.turnCompletionIdleTimeoutMs` ساکت بماند، OpenClaw به صورت best-effort نوبت Codex را interrupt می‌کند، یک timeout تشخیصی ثبت می‌کند، و مسیر نشست OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی پشت یک نوبت بومی کهنه صف نشوند. بیشتر اعلان‌های غیرپایانی برای همان نوبت، آن ناظر کوتاه را غیرفعال می‌کنند، چون Codex ثابت کرده است که نوبت هنوز زنده است. واگذاری‌های ابزار از بودجهٔ idle طولانی‌تری پس از ابزار استفاده می‌کنند: پس از اینکه OpenClaw پاسخ `item/tool/call` را برمی‌گرداند، پس از تکمیل آیتم‌های ابزار بومی مانند `commandExecution`، پس از تکمیل‌های خام `custom_tool_call_output`، و پس از پیشرفت خام دستیار بعد از ابزار، تکمیل‌های reasoning، یا پیشرفت reasoning. این محافظ وقتی پیکربندی شده باشد از
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` استفاده می‌کند و در غیر این صورت به طور پیش‌فرض پنج دقیقه است. همان بودجهٔ پس از ابزار همچنین ناظر پیشرفت را برای پنجرهٔ synthesis بی‌صدا پیش از اینکه Codex رویداد بعدی نوبت فعلی را صادر کند، گسترش می‌دهد. اعلان‌های سراسری app-server، مانند به‌روزرسانی‌های محدودیت نرخ، پیشرفت idle نوبت را بازنشانی نمی‌کنند. تکمیل‌های reasoning، تکمیل‌های `agentMessage` در commentary، و پیشرفت خام reasoning یا دستیار پیش از ابزار می‌توانند با یک پاسخ نهایی خودکار دنبال شوند، بنابراین به جای آزاد کردن فوری مسیر نشست، از محافظ پاسخ پس از پیشرفت استفاده می‌کنند. فقط آیتم‌های `agentMessage` تکمیل‌شدهٔ نهایی/غیر-commentary و تکمیل‌های خام دستیار پیش از ابزار، آزادسازی خروجی دستیار را مسلح می‌کنند: اگر Codex سپس بدون `turn/completed` ساکت بماند، OpenClaw به صورت best-effort نوبت بومی را interrupt می‌کند و مسیر نشست را آزاد می‌کند. اگر یک ناظر نوبت دیگر در آن رقابت آزادسازی پیروز شود، OpenClaw همچنان آیتم دستیار نهایی تکمیل‌شده را می‌پذیرد، به شرطی که دیگر هیچ درخواست بومی، آیتم، یا تکمیل ابزار پویا فعال نمانده باشد و آزادسازی خروجی دستیار هنوز به آخرین آیتم تکمیل‌شده تعلق داشته باشد، بدون تکمیل آیتم بعدی. این می‌تواند پاسخ نهایی را پس از کار ابزار تکمیل‌شده حفظ کند، بدون اینکه نوبت دوباره پخش شود. دلتاهای جزئی دستیار، پاسخ‌های کهنهٔ قبلی، و تکمیل‌های خالی بعدی واجد شرایط نیستند. خرابی‌های app-server روی stdio که برای replay ایمن هستند،
از جمله timeoutهای idle تکمیل نوبت بدون شواهد دستیار، ابزار، آیتم فعال،
یا اثر جانبی، یک بار روی تلاش تازهٔ app-server دوباره امتحان می‌شوند. timeoutهای ناایمن همچنان کلاینت app-server گیرکرده را بازنشسته می‌کنند و مسیر نشست OpenClaw را آزاد می‌کنند. آن‌ها همچنین به جای پخش خودکار دوباره، اتصال کهنهٔ رشتهٔ بومی را پاک می‌کنند. timeoutهای ناظر تکمیل متن timeout مخصوص Codex نشان می‌دهند: موارد replay-safe می‌گویند پاسخ ممکن است ناقص باشد، در حالی که موارد ناایمن به کاربر می‌گویند پیش از تلاش دوباره وضعیت فعلی را بررسی کند. تشخیص‌های عمومی timeout شامل فیلدهای ساختاری مانند آخرین متد اعلان app-server، شناسه/نوع/نقش آیتم پاسخ خام دستیار، تعداد درخواست/آیتم فعال، و وضعیت ناظر مسلح‌شده هستند. وقتی آخرین اعلان یک آیتم پاسخ خام دستیار باشد، آن‌ها همچنین یک پیش‌نمایش محدود از متن دستیار را شامل می‌شوند. آن‌ها prompt خام یا محتوای ابزار را شامل نمی‌شوند.

overrideهای محیطی برای آزمایش محلی همچنان در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم نشده باشد، `OPENCLAW_CODEX_APP_SERVER_BIN` باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای آزمایش محلی تک‌باره از
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. Config برای استقرارهای تکرارپذیر ترجیح داده می‌شود، چون رفتار Plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد که بقیهٔ راه‌اندازی harness Codex در آن قرار دارد.

## Pluginهای بومی Codex

پشتیبانی از Pluginهای بومی Codex از قابلیت‌های برنامه و Plugin خود app-server Codex در همان رشتهٔ Codex که نوبت harness OpenClaw در آن است استفاده می‌کند. OpenClaw Pluginهای Codex را به ابزارهای پویای مصنوعی OpenClaw با نام `codex_plugin_*` ترجمه نمی‌کند.

`codexPlugins` فقط روی نشست‌هایی اثر می‌گذارد که harness بومی Codex را انتخاب می‌کنند. روی اجراهای harness داخلی، اجراهای عادی ارائه‌دهندهٔ OpenAI، اتصال‌های مکالمهٔ ACP، یا harnessهای دیگر اثری ندارد.

Config مهاجرت‌شدهٔ حداقلی:

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

Config برنامهٔ رشته زمانی محاسبه می‌شود که OpenClaw یک نشست harness Codex برقرار می‌کند یا اتصال کهنهٔ رشتهٔ Codex را جایگزین می‌کند. در هر نوبت دوباره محاسبه نمی‌شود.
پس از تغییر `codexPlugins`، از `/new`، `/reset`، یا راه‌اندازی دوبارهٔ gateway استفاده کنید تا نشست‌های آیندهٔ harness Codex با مجموعهٔ برنامهٔ به‌روزشده شروع شوند.

برای واجد شرایط بودن مهاجرت، فهرست برنامه‌ها، سیاست اقدام مخرب،
elicitations، و تشخیص‌های Plugin بومی، به
[Pluginهای بومی Codex](/fa/plugins/codex-native-plugins) مراجعه کنید.

دسترسی برنامه و Plugin سمت OpenAI توسط حساب Codex واردشده و، برای workspaceهای Business و Enterprise/Edu، کنترل‌های برنامهٔ workspace کنترل می‌شود. برای نمای کلی حساب و کنترل workspace در OpenAI به
[استفاده از Codex با طرح ChatGPT خود](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
مراجعه کنید.

## Computer Use

Computer Use در راهنمای راه‌اندازی خودش پوشش داده شده است:
[Codex Computer Use](/fa/plugins/codex-computer-use).

نسخهٔ کوتاه: OpenClaw برنامهٔ کنترل دسکتاپ را vendor نمی‌کند و خودش اقدام‌های دسکتاپ را اجرا نمی‌کند. OpenClaw app-server Codex را آماده می‌کند، بررسی می‌کند که سرور MCP با نام
`computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex در طول نوبت‌های حالت Codex مالک فراخوانی‌های ابزار MCP بومی باشد.

## مرزهای زمان اجرا

harness Codex فقط اجراکنندهٔ agent جاسازی‌شدهٔ سطح پایین را تغییر می‌دهد.

- ابزارهای پویای OpenClaw پشتیبانی می‌شوند. Codex از OpenClaw می‌خواهد آن
  ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.
- ابزارهای shell، patch، MCP، و برنامهٔ بومی مخصوص Codex در مالکیت Codex هستند.
  OpenClaw می‌تواند از طریق relay پشتیبانی‌شده رویدادهای بومی انتخاب‌شده را مشاهده یا مسدود کند، اما آرگومان‌های ابزار بومی را بازنویسی نمی‌کند.
- Codex مالک Compaction بومی است. OpenClaw برای تاریخچهٔ کانال،
  جست‌وجو، `/new`، `/reset`، و تغییر مدل یا harness در آینده یک آینهٔ transcript نگه می‌دارد، اما Compaction مربوط به Codex را با خلاصه‌ساز OpenClaw یا context-engine جایگزین نمی‌کند.
- تولید رسانه، درک رسانه، TTS، تأییدها، و خروجی ابزار پیام‌رسانی همچنان از مسیر تنظیمات ارائه‌دهنده/مدل مطابق OpenClaw عبور می‌کنند.
- `tool_result_persist` روی نتایج ابزار transcript در مالکیت OpenClaw اعمال می‌شود، نه
  رکوردهای نتیجهٔ ابزار بومی Codex.

برای لایه‌های hook، سطوح V1 پشتیبانی‌شده، مدیریت مجوز بومی، هدایت صف،
سازوکار بارگذاری بازخورد Codex، و جزئیات Compaction، به
[زمان اجرای harness Codex](/fa/plugins/codex-harness-runtime) مراجعه کنید.

## عیب‌یابی

**Codex به عنوان یک ارائه‌دهندهٔ عادی `/model` ظاهر نمی‌شود:** این برای configهای جدید مورد انتظار است. یک مدل `openai/gpt-*` انتخاب کنید، `plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید آیا `plugins.allow`، `codex` را مستثنا کرده است یا نه.

**OpenClaw به جای Codex از harness داخلی استفاده می‌کند:** مطمئن شوید model ref برابر
`openai/gpt-*` روی ارائه‌دهندهٔ رسمی OpenAI است و Plugin Codex نصب و فعال شده است. اگر هنگام آزمایش به اثبات سخت‌گیرانه نیاز دارید، provider یا model `agentRuntime.id: "codex"` را تنظیم کنید. زمان اجرای Codex اجباری به جای fallback به OpenClaw، شکست می‌خورد.

**زمان اجرای OpenAI Codex به مسیر کلید API fallback می‌کند:** یک قطعهٔ gateway redactشده جمع‌آوری کنید که مدل، runtime، ارائه‌دهندهٔ انتخاب‌شده، و خرابی را نشان دهد.
از همکاران متاثر بخواهید این دستور read-only را روی میزبان OpenClaw خود اجرا کنند:

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

قطعه‌های مفید معمولاً شامل `openai/gpt-5.5` یا `openai/gpt-5.4`،
`Runtime: OpenAI Codex`، `agentRuntime.id` یا `harnessRuntime`،
`candidateProvider: "openai"`، و نتیجهٔ `401`، `Incorrect API key`، یا
`No API key` هستند. اجرای اصلاح‌شده باید به جای خرابی سادهٔ کلید API مربوط به OpenAI، مسیر OAuth مربوط به OpenAI را نشان دهد.

**Config مربوط به model refهای قدیمی Codex باقی مانده است:** `openclaw doctor --fix` را اجرا کنید.
Doctor، model refهای قدیمی را به `openai/*` بازنویسی می‌کند، pinهای runtime نشست کهنه و whole-agent را حذف می‌کند، و overrideهای auth-profile موجود را حفظ می‌کند.

**app-server رد می‌شود:** از app-server Codex نسخهٔ `0.125.0` یا جدیدتر استفاده کنید.
پیش‌انتشارهای هم‌نسخه یا نسخه‌های دارای پسوند build مانند
`0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون OpenClaw کف پروتکل پایدار `0.125.0` را آزمایش می‌کند.

**`/codex status` نمی‌تواند وصل شود:** بررسی کنید Plugin bundled با نام `codex` فعال باشد، وقتی allowlist پیکربندی شده است `plugins.allow` شامل آن باشد، و هر `appServer.command`، `url`، `authToken`، یا header سفارشی معتبر باشد.

**کشف مدل کند است:** مقدار
`plugins.entries.codex.config.discovery.timeoutMs` را کاهش دهید یا کشف را غیرفعال کنید. به
[مرجع harness Codex](/fa/plugins/codex-harness-reference#model-discovery) مراجعه کنید.

**انتقال WebSocket فوراً شکست می‌خورد:** `appServer.url`، `authToken`،
headerها، و اینکه app-server راه دور همان نسخهٔ پروتکل app-server Codex را صحبت می‌کند بررسی کنید.

**ابزارهای شل بومی یا patch با `Native hook relay unavailable` مسدود شده‌اند:**
رشته Codex هنوز در تلاش است از شناسه‌ی native hook relay استفاده کند که OpenClaw
دیگر آن را ثبت‌شده ندارد. این یک مشکل انتقال native Codex hook است، نه خرابی
بک‌اند ACP، ارائه‌دهنده، GitHub، یا فرمان شل. در گفت‌وگوی تحت تأثیر، یک نشست تازه را با
`/new` یا `/reset` شروع کنید، سپس یک فرمان بی‌خطر را دوباره امتحان کنید. اگر آن
یک بار کار کرد اما فراخوانی ابزار بومی بعدی دوباره شکست خورد، `/new` را فقط یک راهکار موقت
در نظر بگیرید: پس از راه‌اندازی دوباره‌ی Codex
app-server یا OpenClaw Gateway، prompt را در یک نشست تازه کپی کنید تا رشته‌های قدیمی کنار گذاشته شوند و ثبت‌های native hook
دوباره ایجاد شوند.

**یک مدل غیر Codex از harness داخلی استفاده می‌کند:** این مورد مورد انتظار است مگر اینکه
سیاست runtime ارائه‌دهنده یا مدل آن را به harness دیگری هدایت کند. ارجاع‌های ساده‌ی ارائه‌دهنده‌ی غیر OpenAI
در حالت `auto` روی مسیر عادی ارائه‌دهنده‌ی خود باقی می‌مانند.

**Computer Use نصب شده است اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه،
`/codex computer-use status` را بررسی کنید. اگر ابزاری
`Native hook relay unavailable` را گزارش کرد، از بازیابی native hook relay در بالا استفاده کنید. به
[Codex Computer Use](/fa/plugins/codex-computer-use#troubleshooting) مراجعه کنید.

## مرتبط

- [مرجع Codex harness](/fa/plugins/codex-harness-reference)
- [runtime مربوط به Codex harness](/fa/plugins/codex-harness-runtime)
- [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)
- [Codex Computer Use](/fa/plugins/codex-computer-use)
- [runtimeهای عامل](/fa/concepts/agent-runtimes)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [ارائه‌دهنده‌ی OpenAI](/fa/providers/openai)
- [راهنمای OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Pluginهای harness عامل](/fa/plugins/sdk-agent-harness)
- [hookهای Plugin](/fa/plugins/hooks)
- [صدور عیب‌یابی](/fa/gateway/diagnostics)
- [وضعیت](/fa/cli/status)
- [آزمایش](/fa/help/testing-live#live-codex-app-server-harness-smoke)

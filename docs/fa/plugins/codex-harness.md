---
read_when:
    - می‌خواهید از هارنس app-server همراه Codex استفاده کنید
    - به نمونه‌های پیکربندی harness در Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به OpenClaw، شکست بخورند
summary: نوبت‌های عامل تعبیه‌شده OpenClaw را از طریق هارنس app-server همراه Codex اجرا کنید
title: هارنس Codex
x-i18n:
    generated_at: "2026-07-03T17:31:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw امکان می‌دهد چرخه‌های عامل OpenAI را
به‌جای هارنس داخلی OpenClaw، از طریق app-server مربوط به Codex اجرا کند.

وقتی می‌خواهید Codex مالک نشست سطح پایین عامل باشد، از هارنس Codex استفاده کنید:
ازسرگیری بومی رشته، ادامه بومی ابزار، Compaction بومی، و اجرای
app-server. OpenClaw همچنان مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل،
ابزارهای پویای OpenClaw، تأییدها، تحویل رسانه، و آینه قابل مشاهده رونوشت است.

راه‌اندازی معمول از ارجاع‌های مدل متعارف OpenAI مانند `openai/gpt-5.5` استفاده می‌کند.
ارجاع‌های قدیمی Codex GPT را پیکربندی نکنید. ترتیب احراز هویت عامل OpenAI را
زیر `auth.order.openai` قرار دهید؛ شناسه‌های قدیمی پروفایل احراز هویت Codex و
ورودی‌های قدیمی ترتیب احراز هویت Codex وضعیت قدیمی هستند که با
`openclaw doctor --fix` ترمیم می‌شوند.

وقتی هیچ سندباکس OpenClaw فعالی وجود ندارد، OpenClaw رشته‌های app-server مربوط به Codex را
با حالت کد بومی Codex فعال شروع می‌کند و در عین حال حالت فقط-کد را به‌صورت پیش‌فرض خاموش می‌گذارد.
این کار قابلیت‌های فضای کاری بومی و کد Codex را در دسترس نگه می‌دارد، در حالی که
ابزارهای پویای OpenClaw از طریق پل app-server `item/tool/call` ادامه می‌یابند.
سندباکس فعال OpenClaw و سیاست‌های محدود ابزار، حالت کد بومی را کاملاً غیرفعال می‌کنند،
مگر اینکه مسیر آزمایشی exec-server سندباکس را انتخاب کنید.

این قابلیت بومی Codex از
[حالت کد OpenClaw](/fa/reference/code-mode) جداست؛ آن یک runtime اختیاری QuickJS-WASI
برای اجراهای عمومی OpenClaw با شکل ورودی متفاوت `exec` است.

برای جداسازی گسترده‌تر مدل/ارائه‌دهنده/runtime، از
[runtimeهای عامل](/fa/concepts/agent-runtimes) شروع کنید. نسخه کوتاه این است:
`openai/gpt-5.5` ارجاع مدل است، `codex` runtime است، و Telegram،
Discord، Slack، یا کانال دیگری سطح ارتباطی باقی می‌ماند.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس.
- اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را وارد کنید.
- app-server مربوط به Codex نسخه `0.125.0` یا جدیدتر. Plugin همراه به‌صورت پیش‌فرض
  یک باینری سازگار app-server مربوط به Codex را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex`
  روی `PATH` بر راه‌اندازی معمول هارنس اثر نمی‌گذارند.
- احراز هویت Codex از طریق `openclaw models auth login --provider openai`،
  یک حساب app-server در خانه Codex عامل، یا یک پروفایل صریح احراز هویت کلید API مربوط به Codex در دسترس باشد.

برای تقدم احراز هویت، ایزوله‌سازی محیط، فرمان‌های سفارشی app-server، کشف مدل،
و همه فیلدهای پیکربندی، به
[مرجع هارنس Codex](/fa/plugins/codex-harness-reference) مراجعه کنید.

## شروع سریع

بیشتر کاربرانی که Codex را در OpenClaw می‌خواهند، همین مسیر را می‌خواهند: با یک
اشتراک ChatGPT/Codex وارد شوید، Plugin همراه `codex` را فعال کنید، و از یک
ارجاع مدل متعارف `openai/gpt-*` استفاده کنید.

ورود با OAuth مربوط به Codex:

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
از قبل نشست دارد، پیش از آزمودن تغییرات runtime از `/new` یا `/reset` استفاده کنید
تا چرخه بعدی هارنس را از پیکربندی فعلی resolve کند.

## پیکربندی

پیکربندی شروع سریع، حداقل پیکربندی قابل استفاده هارنس Codex است. گزینه‌های هارنس Codex را
در پیکربندی OpenClaw تنظیم کنید، و از CLI فقط برای احراز هویت Codex استفاده کنید:

| نیاز                                   | تنظیم                                                                              | محل                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| فعال کردن هارنس                     | `plugins.entries.codex.enabled: true`                                            | پیکربندی OpenClaw                    |
| نگه داشتن نصب Plugin در فهرست مجاز     | قرار دادن `codex` در `plugins.allow`                                               | پیکربندی OpenClaw                    |
| مسیریابی چرخه‌های عامل OpenAI از طریق Codex | `agents.defaults.model` یا `agents.list[].model` به‌صورت `openai/gpt-*`               | پیکربندی عامل OpenClaw              |
| ورود با OAuth مربوط به ChatGPT/Codex       | `openclaw models auth login --provider openai`                                   | پروفایل احراز هویت CLI                   |
| افزودن پشتیبان کلید API برای اجراهای Codex      | پروفایل کلید API مربوط به `openai:*` که پس از احراز هویت اشتراکی در `auth.order.openai` فهرست شده است | پروفایل احراز هویت CLI + پیکربندی OpenClaw |
| شکست بسته در صورت در دسترس نبودن Codex  | `agentRuntime.id: "codex"` در سطح ارائه‌دهنده یا مدل                                     | پیکربندی مدل/ارائه‌دهنده OpenClaw     |
| استفاده از ترافیک مستقیم OpenAI API          | `agentRuntime.id: "openclaw"` در سطح ارائه‌دهنده یا مدل با احراز هویت معمول OpenAI          | پیکربندی مدل/ارائه‌دهنده OpenClaw     |
| تنظیم رفتار app-server               | `plugins.entries.codex.config.appServer.*`                                       | پیکربندی Plugin مربوط به Codex                |
| فعال کردن برنامه‌های Plugin بومی Codex        | `plugins.entries.codex.config.codexPlugins.*`                                    | پیکربندی Plugin مربوط به Codex                |
| فعال کردن Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | پیکربندی Plugin مربوط به Codex                |

برای چرخه‌های عامل OpenAI پشتیبانی‌شده با Codex از ارجاع‌های مدل `openai/gpt-*` استفاده کنید. برای
ترتیب اشتراک-اول/کلید-API-پشتیبان، `auth.order.openai` را ترجیح دهید. شناسه‌های موجود
پروفایل احراز هویت قدیمی Codex و ترتیب قدیمی احراز هویت Codex، وضعیت قدیمی فقط مخصوص doctor هستند؛
ارجاع‌های جدید قدیمی Codex GPT ننویسید.

روی عامل‌های پشتیبانی‌شده با Codex، `compaction.model` یا `compaction.provider` را تنظیم نکنید.
Codex از طریق وضعیت رشته بومی app-server خودش Compaction انجام می‌دهد، بنابراین OpenClaw
این بازنویسی‌های خلاصه‌ساز محلی را در زمان اجرا نادیده می‌گیرد و `openclaw doctor --fix`
وقتی عامل از Codex استفاده می‌کند آن‌ها را حذف می‌کند.

Lossless همچنان به‌عنوان موتور زمینه برای اسمبل، دریافت، و نگهداری پیرامون چرخه‌های Codex پشتیبانی می‌شود.
آن را از طریق
`plugins.slots.contextEngine: "lossless-claw"` و
`plugins.entries.lossless-claw.config.summaryModel` پیکربندی کنید، نه از طریق
`agents.defaults.compaction.provider`. وقتی Codex runtime فعال است، `openclaw doctor --fix`
شکل قدیمی `compaction.provider: "lossless-claw"` را به اسلات موتور زمینه Lossless مهاجرت می‌دهد،
اما Codex بومی همچنان مالک Compaction است.

هارنس بومی app-server مربوط به Codex از موتورهای زمینه‌ای پشتیبانی می‌کند که به
اسمبل پیش از پرامپت نیاز دارند. backendهای عمومی CLI، از جمله `codex-cli`، آن قابلیت میزبان را فراهم نمی‌کنند.

برای عامل‌های پشتیبانی‌شده با Codex، `/compact` Compaction بومی app-server مربوط به Codex را روی
رشته متصل شروع می‌کند. OpenClaw منتظر تکمیل نمی‌ماند، timeout مربوط به OpenClaw اعمال نمی‌کند،
app-server مشترک را دوباره راه‌اندازی نمی‌کند، و به موتور زمینه یا
خلاصه‌ساز عمومی OpenAI fallback نمی‌کند. اگر اتصال رشته بومی Codex گم شده یا
کهنه باشد، فرمان به‌صورت بسته شکست می‌خورد تا اپراتور مرز واقعی runtime را ببیند
به‌جای اینکه backendهای Compaction بی‌صدا عوض شوند.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

در آن شکل، هر دو پروفایل همچنان برای چرخه‌های عامل `openai/gpt-*` از طریق Codex اجرا می‌شوند.
کلید API فقط یک fallback احراز هویت است، نه درخواستی برای تغییر به OpenClaw یا
OpenAI Responses ساده.

بقیه این صفحه گونه‌های رایجی را پوشش می‌دهد که کاربران باید بین آن‌ها انتخاب کنند:
شکل استقرار، مسیریابی با شکست بسته، سیاست تأیید نگهبان، Pluginهای بومی Codex،
و Computer Use. برای فهرست کامل گزینه‌ها، پیش‌فرض‌ها، enumها، کشف،
ایزوله‌سازی محیط، timeoutها، و فیلدهای انتقال app-server، به
[مرجع هارنس Codex](/fa/plugins/codex-harness-reference) مراجعه کنید.

## تأیید runtime مربوط به Codex

در چتی که انتظار Codex دارید از `/status` استفاده کنید. چرخه عامل OpenAI پشتیبانی‌شده با Codex
نشان می‌دهد:

```text
Runtime: OpenAI Codex
```

سپس وضعیت app-server مربوط به Codex را بررسی کنید:

```text
/codex status
/codex models
```

`/codex status` اتصال app-server، حساب، محدودیت‌های نرخ، سرورهای MCP،
و Skills را گزارش می‌کند. `/codex models` کاتالوگ زنده app-server مربوط به Codex را برای
هارنس و حساب فهرست می‌کند. اگر `/status` غافلگیرکننده است، به
[عیب‌یابی](#troubleshooting) مراجعه کنید.

## مسیریابی و انتخاب مدل

ارجاع‌های ارائه‌دهنده و سیاست runtime را جدا نگه دارید:

- برای چرخه‌های عامل OpenAI از طریق Codex از `openai/gpt-*` استفاده کنید.
- از ارجاع‌های قدیمی Codex GPT در پیکربندی استفاده نکنید. برای ترمیم ارجاع‌های قدیمی و پین‌های کهنه مسیر نشست،
  `openclaw doctor --fix` را اجرا کنید.
- `agentRuntime.id: "codex"` برای حالت خودکار معمول OpenAI اختیاری است، اما وقتی
  یک استقرار باید در صورت در دسترس نبودن Codex به‌صورت بسته شکست بخورد مفید است.
- `agentRuntime.id: "openclaw"` وقتی عمدی باشد، یک ارائه‌دهنده یا مدل را وارد runtime
  تعبیه‌شده OpenClaw می‌کند.
- `/codex ...` مکالمه‌های بومی app-server مربوط به Codex را از چت کنترل می‌کند.
- ACP/acpx یک مسیر هارنس خارجی جداست. فقط وقتی کاربر
  ACP/acpx یا یک آداپتور هارنس خارجی را درخواست می‌کند از آن استفاده کنید.

مسیریابی فرمان‌های رایج:

| قصد کاربر                                           | استفاده                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| پیوست کردن چت فعلی                               | `/codex bind [--cwd <path>]`                                                                          |
| ازسرگیری یک رشته موجود Codex                       | `/codex resume <thread-id>`                                                                           |
| فهرست کردن یا فیلتر کردن رشته‌های Codex                          | `/codex threads [filter]`                                                                             |
| فهرست کردن Pluginهای بومی Codex                             | `/codex plugins list`                                                                                 |
| فعال یا غیرفعال کردن یک Plugin بومی Codex پیکربندی‌شده    | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| پیوست کردن یک نشست موجود Codex CLI روی یک Node جفت‌شده | `/codex sessions --host <node> [filter]`, سپس `/codex resume <session-id> --host <node> --bind here` |
| فقط ارسال بازخورد Codex                              | `/codex diagnostics [note]`                                                                           |
| شروع یک وظیفه ACP/acpx                                | فرمان‌های نشست ACP/acpx، نه `/codex`                                                               |

| مورد استفاده                                             | پیکربندی                                                              | راستی‌آزمایی                                  | یادداشت‌ها                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| اشتراک ChatGPT/Codex با runtime بومی Codex | `openai/gpt-*` به‌علاوه Plugin فعال‌شده `codex`                             | `/status` مقدار `Runtime: OpenAI Codex` را نشان می‌دهد | مسیر پیشنهادی                      |
| اگر Codex در دسترس نبود، fail closed شود                  | Provider یا model با `agentRuntime.id: "codex"`                           | نوبت به‌جای fallback جاسازی‌شده شکست می‌خورد | برای استقرارهای فقط Codex استفاده کنید        |
| عبور مستقیم ترافیک API-key مربوط به OpenAI از OpenClaw       | Provider یا model با `agentRuntime.id: "openclaw"` و احراز هویت معمول OpenAI | `/status` مقدار runtime مربوط به OpenClaw را نشان می‌دهد        | فقط وقتی OpenClaw تعمدی است استفاده کنید |
| پیکربندی قدیمی                                        | ارجاع‌های قدیمی Codex GPT                                                  | `openclaw doctor --fix` آن را بازنویسی می‌کند     | پیکربندی جدید را به این شکل ننویسید      |
| آداپتر ACP/acpx برای Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                               | وضعیت task/session در ACP                 | جدا از harness بومی Codex    |

`agents.defaults.imageModel` از همان تفکیک پیشوند پیروی می‌کند. برای مسیر
معمول OpenAI از `openai/gpt-*` استفاده کنید و فقط وقتی فهم تصویر باید از طریق
یک نوبت محدود app-server مربوط به Codex اجرا شود، از `codex/gpt-*` استفاده
کنید. از ارجاع‌های قدیمی Codex GPT استفاده نکنید؛ doctor آن پیشوند قدیمی را
به `openai/gpt-*` بازنویسی می‌کند.

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

### استقرار با Providerهای ترکیبی

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

با این پیکربندی، عامل `main` از مسیر Provider معمول خود استفاده می‌کند و عامل
`codex` از app-server مربوط به Codex استفاده می‌کند.

### استقرار fail-closed برای Codex

برای نوبت‌های عامل OpenAI، وقتی Plugin همراه در دسترس باشد، `openai/gpt-*`
از قبل به Codex resolve می‌شود. وقتی یک قاعده fail-closed مکتوب می‌خواهید،
سیاست runtime صریح اضافه کنید:

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

وقتی Codex اجباری باشد، اگر Plugin مربوط به Codex غیرفعال باشد، app-server
بیش از حد قدیمی باشد، یا app-server نتواند شروع شود، OpenClaw زود شکست
می‌خورد.

## سیاست app-server

به‌طور پیش‌فرض، Plugin باینری مدیریت‌شده Codex متعلق به OpenClaw را به‌صورت
محلی با transport نوع stdio شروع می‌کند. فقط وقتی عمدا می‌خواهید یک فایل
اجرایی متفاوت را اجرا کنید، `appServer.command` را تنظیم کنید. فقط وقتی یک
app-server از قبل جای دیگری در حال اجرا است، از transport نوع WebSocket
استفاده کنید:

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

نشست‌های app-server محلی stdio به‌طور پیش‌فرض از موضع اپراتور محلی مورد
اعتماد استفاده می‌کنند: `approvalPolicy: "never"`، `approvalsReviewer: "user"`،
و `sandbox: "danger-full-access"`. اگر الزامات محلی Codex این موضع ضمنی YOLO
را مجاز ندانند، OpenClaw به‌جای آن مجوزهای guardian مجاز را انتخاب می‌کند.
وقتی یک sandbox مربوط به OpenClaw برای نشست فعال باشد، OpenClaw در آن نوبت
به‌جای تکیه بر sandboxing سمت میزبان Codex، Code Mode بومی Codex، سرورهای MCP
کاربر، و اجرای Pluginهای پشتیبانی‌شده توسط برنامه را غیرفعال می‌کند. دسترسی
shell از طریق ابزارهای پویای پشتیبانی‌شده با sandbox در OpenClaw، مانند
`sandbox_exec` و `sandbox_process`، در دسترس قرار می‌گیرد، وقتی ابزارهای معمول
exec/process موجود باشند.

وقتی می‌خواهید پیش از خروج از sandbox یا مجوزهای اضافی، auto-review بومی Codex
را داشته باشید، از حالت exec نرمال‌شده OpenClaw استفاده کنید:

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

برای نشست‌های app-server مربوط به Codex، OpenClaw مقدار `tools.exec.mode: "auto"`
را به تأییدیه‌های بررسی‌شده توسط Guardian در Codex نگاشت می‌کند؛ معمولا
`approvalPolicy: "on-request"`، `approvalsReviewer: "auto_review"`، و
`sandbox: "workspace-write"` وقتی الزامات محلی این مقدارها را مجاز بدانند.
در `tools.exec.mode: "auto"`، OpenClaw overrideهای قدیمی و ناامن Codex برای
`approvalPolicy: "never"` یا `sandbox: "danger-full-access"` را حفظ نمی‌کند؛
برای یک موضع Codex عمدی بدون تأیید، از `tools.exec.mode: "full"` استفاده کنید.
preset قدیمی `plugins.entries.codex.config.appServer.mode: "guardian"` هنوز
کار می‌کند، اما `tools.exec.mode: "auto"` سطح نرمال‌شده OpenClaw است.

برای مقایسه سطح حالت با تأییدیه‌های exec میزبان و مجوزهای ACPX، به
[حالت‌های مجوز](/fa/tools/permission-modes) مراجعه کنید.

برای همه فیلدهای app-server، ترتیب احراز هویت، ایزولاسیون محیط، کشف، و رفتار
timeout، به [مرجع harness مربوط به Codex](/fa/plugins/codex-harness-reference)
مراجعه کنید.

## فرمان‌ها و عیب‌یابی

Plugin همراه، `/codex` را به‌عنوان یک فرمان slash در هر کانالی که از فرمان‌های
متنی OpenClaw پشتیبانی کند ثبت می‌کند.

اجرای بومی و کنترل به یک owner یا یک client نوع `operator.admin` در Gateway
نیاز دارد. این شامل binding یا resume کردن threadها، ارسال یا توقف نوبت‌ها،
تغییر model، fast-mode، یا وضعیت مجوز، compact کردن یا review کردن، و detach
کردن یک binding است. فرستنده‌های مجاز دیگر فرمان‌های فقط‌خواندنی وضعیت، help،
account، model، thread، سرور MCP، skill، و بازرسی binding را حفظ می‌کنند.

شکل‌های رایج:

- `/codex status` اتصال app-server، modelها، account، rate limitها، سرورهای
  MCP، و Skills را بررسی می‌کند.
- `/codex models` modelهای زنده app-server مربوط به Codex را فهرست می‌کند.
- `/codex threads [filter]` threadهای اخیر app-server مربوط به Codex را فهرست
  می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک thread موجود Codex
  متصل می‌کند.
- `/codex compact` از app-server مربوط به Codex می‌خواهد thread متصل را compact
  کند.
- `/codex review` review بومی Codex را برای thread متصل شروع می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد Codex برای thread متصل سؤال
  می‌کند.
- `/codex account` وضعیت account و rate-limit را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP در app-server مربوط به Codex را فهرست می‌کند.
- `/codex skills` Skills مربوط به app-server در Codex را فهرست می‌کند.

برای بیشتر گزارش‌های پشتیبانی، با `/diagnostics [note]` در گفت‌وگویی شروع
کنید که باگ در آن رخ داده است. این فرمان یک گزارش عیب‌یابی Gateway ایجاد
می‌کند و، برای نشست‌های harness مربوط به Codex، برای ارسال بسته بازخورد مرتبط
Codex درخواست تأیید می‌کند. برای مدل حریم خصوصی و رفتار group chat به
[صدور عیب‌یابی](/fa/gateway/diagnostics) مراجعه کنید.

فقط وقتی از `/codex diagnostics [note]` استفاده کنید که مشخصا می‌خواهید آپلود
بازخورد Codex برای thread متصل فعلی را بدون بسته کامل عیب‌یابی Gateway ارسال
کنید.

### بررسی محلی threadهای Codex

سریع‌ترین راه برای بررسی یک اجرای خراب Codex اغلب این است که thread بومی
Codex را مستقیم باز کنید:

```bash
codex resume <thread-id>
```

شناسه thread را از پاسخ تکمیل‌شده `/diagnostics`، `/codex binding`، یا
`/codex threads [filter]` بگیرید.

برای سازوکارهای آپلود و مرزهای عیب‌یابی در سطح runtime، به
[runtime harness مربوط به Codex](/fa/plugins/codex-harness-runtime#codex-feedback-upload)
مراجعه کنید.

احراز هویت به این ترتیب انتخاب می‌شود:

1. پروفایل‌های احراز هویت OpenAI مرتب‌شده برای عامل، ترجیحا زیر
   `auth.order.openai`. برای مهاجرت شناسه‌های قدیمی پروفایل احراز هویت Codex
   و ترتیب احراز هویت قدیمی Codex، `openclaw doctor --fix` را اجرا کنید.
2. account موجود app-server در خانه Codex مربوط به آن عامل.
3. فقط برای اجرای app-server محلی stdio، ابتدا `CODEX_API_KEY` و سپس
   `OPENAI_API_KEY`، وقتی هیچ account مربوط به app-server وجود ندارد و احراز
   هویت OpenAI همچنان لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex به سبک اشتراک ChatGPT ببیند،
`CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex ایجادشده حذف
می‌کند. این کار کلیدهای API در سطح Gateway را برای embeddings یا modelهای
مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه نوبت‌های app-server بومی Codex
به‌اشتباه از طریق API صورت‌حساب شوند. پروفایل‌های صریح API-key مربوط به Codex
و fallback کلید محیط برای stdio محلی، به‌جای env ارث‌بری‌شده فرایند فرزند، از
ورود app-server استفاده می‌کنند. اتصال‌های app-server نوع WebSocket fallback
کلید API محیط Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا
account خود app-server راه‌دور استفاده کنید.
وقتی Pluginهای بومی Codex پیکربندی شده باشند، OpenClaw پیش از آنکه برنامه‌های
مالک Plugin را در اختیار thread مربوط به Codex قرار دهد، آن Pluginها را از
طریق app-server متصل نصب یا refresh می‌کند. `app/list` همچنان منبع حقیقت برای
شناسه‌های app، accessibility، و metadata است، اما OpenClaw مالک تصمیم enablement
در هر thread است: اگر سیاست اجازه دهد یک app قابل‌دسترس فهرست‌شده فعال شود،
OpenClaw مقدار `thread/start.config.apps[appId].enabled = true` را ارسال می‌کند،
حتی وقتی `app/list` در حال حاضر گزارش کند آن app غیرفعال است. این مسیر برای
شناسه‌های ناشناخته نصب app ابداع نمی‌کند؛ OpenClaw فقط Pluginهای marketplace
را با `plugin/install` فعال می‌کند و سپس موجودی را refresh می‌کند.

اگر یک پروفایل اشتراکی به محدودیت استفاده Codex برسد، OpenClaw وقتی Codex زمان
reset را گزارش کند آن را ثبت می‌کند و پروفایل احراز هویت مرتب‌شده بعدی را برای
همان اجرای Codex امتحان می‌کند. وقتی زمان reset بگذرد، پروفایل اشتراکی دوباره
واجد شرایط می‌شود، بدون تغییر model انتخاب‌شده `openai/gpt-*` یا runtime مربوط
به Codex.

برای اجرای app-server محلی stdio، OpenClaw مقدار `CODEX_HOME` را روی یک
دایرکتوری به‌ازای هر عامل تنظیم می‌کند تا پیکربندی Codex، فایل‌های auth/account،
cache/data مربوط به Plugin، و وضعیت thread بومی به‌طور پیش‌فرض از `~/.codex`
شخصی اپراتور نخوانند یا در آن ننویسند. OpenClaw مقدار معمول فرایند `HOME` را
حفظ می‌کند؛ subprocessهای اجراشده توسط Codex همچنان می‌توانند پیکربندی و
tokenهای user-home را پیدا کنند، و Codex ممکن است ورودی‌های مشترک
`$HOME/.agents/skills` و `$HOME/.agents/plugins/marketplace.json` را کشف کند.

اگر یک استقرار به ایزولاسیون محیط بیشتری نیاز دارد، آن متغیرها را به
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

`appServer.clearEnv` فقط بر فرایند فرزند app-server مربوط به Codex که ایجاد
می‌شود اثر می‌گذارد. OpenClaw در هنگام نرمال‌سازی اجرای محلی، `CODEX_HOME` و
`HOME` را از این فهرست حذف می‌کند: `CODEX_HOME` به‌ازای هر عامل باقی می‌ماند،
و `HOME` ارث‌بری‌شده باقی می‌ماند تا subprocessها بتوانند از وضعیت معمول
user-home استفاده کنند.

ابزارهای پویای Codex به‌طور پیش‌فرض با بارگذاری `searchable` استفاده می‌شوند. OpenClaw
ابزارهای پویایی را که عملیات بومی فضای کاری Codex را تکرار می‌کنند ارائه نمی‌کند:
`read`، `write`، `edit`، `apply_patch`، `exec`، `process`، و `update_plan`. بیشتر ابزارهای
باقی‌مانده یکپارچه‌سازی OpenClaw مانند پیام‌رسانی، رسانه، Cron، مرورگر، گره‌ها،
Gateway، و `heartbeat_respond` از طریق جست‌وجوی ابزار Codex در فضای نام
`openclaw` در دسترس هستند و زمینه اولیه مدل را کوچک‌تر نگه می‌دارند. جست‌وجوی وب
وقتی جست‌وجو فعال باشد و هیچ ارائه‌دهنده مدیریت‌شده‌ای انتخاب نشده باشد، به‌طور
پیش‌فرض از ابزار میزبانی‌شده `web_search` متعلق به Codex استفاده می‌کند. جست‌وجوی
میزبانی‌شده بومی و ابزار پویای مدیریت‌شده `web_search` متعلق به OpenClaw به‌صورت
متقابل ناسازگار هستند، تا جست‌وجوی مدیریت‌شده نتواند محدودیت‌های دامنه بومی را دور
بزند. OpenClaw وقتی جست‌وجوی میزبانی‌شده در دسترس نباشد، صراحتا غیرفعال شده باشد،
یا با یک ارائه‌دهنده مدیریت‌شده انتخاب‌شده جایگزین شود، از ابزار مدیریت‌شده استفاده
می‌کند. OpenClaw افزونه مستقل `web.run` متعلق به Codex را غیرفعال نگه می‌دارد،
زیرا ترافیک سرور برنامه تولیدی فضای نام `web` تعریف‌شده توسط کاربر را رد می‌کند.
`tools.web.search.enabled: false` هر دو مسیر را غیرفعال می‌کند؛ اجراهای فقط LLM با
ابزارهای غیرفعال نیز همین‌طور هستند. Codex مقدار `"cached"` را به‌عنوان ترجیح در
نظر می‌گیرد و آن را برای نوبت‌های نامحدود سرور برنامه به دسترسی خارجی زنده تبدیل
می‌کند. وقتی `allowedDomains` بومی تنظیم شده باشد، بازگشت خودکار مدیریت‌شده بسته
و ناموفق می‌شود تا فهرست مجاز دور زده نشود. تغییرات پایدار در سیاست مؤثر جست‌وجو
رشته متصل Codex را پیش از نوبت بعدی می‌چرخانند. محدودیت‌های گذرای هر نوبت از یک
رشته محدود موقت استفاده می‌کنند و اتصال موجود را برای ادامه بعدی حفظ می‌کنند.
`sessions_yield` و پاسخ‌های منبع فقط با ابزار پیام‌رسانی مستقیم می‌مانند، زیرا
این‌ها قراردادهای کنترل نوبت هستند. `sessions_spawn` قابل جست‌وجو می‌ماند تا
`spawn_agent` بومی Codex سطح اصلی زیرعامل Codex باقی بماند، در حالی که واگذاری
صریح OpenClaw یا ACP همچنان از طریق فضای نام ابزار پویای `openclaw` در دسترس است.
دستورالعمل‌های همکاری Heartbeat به Codex می‌گویند وقتی ابزار از قبل بارگذاری نشده
است، پیش از پایان دادن به یک نوبت Heartbeat، `heartbeat_respond` را جست‌وجو کند.

`codexDynamicToolsLoading: "direct"` را فقط هنگام اتصال به یک سرور برنامه سفارشی
Codex که نمی‌تواند ابزارهای پویای به‌تعویق‌افتاده را جست‌وجو کند، یا هنگام اشکال‌زدایی
بار کامل ابزار، تنظیم کنید.

فیلدهای Plugin سطح‌بالای Codex که پشتیبانی می‌شوند:

| فیلد                       | پیش‌فرض        | معنی                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | از `"direct"` استفاده کنید تا ابزارهای پویای OpenClaw مستقیما در زمینه اولیه ابزار Codex قرار بگیرند. |
| `codexDynamicToolsExclude` | `[]`           | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های سرور برنامه Codex حذف شوند.    |
| `codexPlugins`             | غیرفعال        | پشتیبانی بومی Plugin/برنامه Codex برای Pluginهای گزینش‌شده مهاجرت‌کرده و نصب‌شده از منبع. |

فیلدهای `appServer` که پشتیبانی می‌شوند:

| فیلد                                         | پیش‌فرض                                                | معنی                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"`، Codex را اجرا می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | باینری مدیریت‌شده Codex                                   | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده، آن را تنظیم‌نشده بگذارید؛ فقط برای بازنویسی صریح آن را تنظیم کنید.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | آرگومان‌های انتقال stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | تنظیم‌نشده                                                  | URL سرور برنامه WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | تنظیم‌نشده                                                  | توکن Bearer برای انتقال WebSocket. یک رشته لفظی یا SecretInput مانند `${CODEX_APP_SERVER_TOKEN}` را می‌پذیرد.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | سربرگ‌های اضافی WebSocket. مقدارهای سربرگ، رشته‌های لفظی یا مقدارهای SecretInput را می‌پذیرند، برای مثال `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw، از فرایند stdio app-server اجراشده حذف می‌شوند. OpenClaw برای اجراهای محلی، `CODEX_HOME` اختصاصی هر عامل و `HOME` ارث‌بری‌شده را نگه می‌دارد.                                                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | سطح ابزار فقط-حالت-کد Codex را فعال می‌کند. ابزارهای پویای OpenClaw همچنان در Codex ثبت می‌مانند تا فراخوانی‌های تودرتوی `tools.*` از طریق پل `item/tool/call` سرور برنامه برگردند.                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | تنظیم‌نشده                                                  | ریشه فضای کاری سرور برنامه Codex راه‌دور. وقتی تنظیم شود، OpenClaw ریشه فضای کاری محلی را از فضای کاری حل‌شده OpenClaw استنتاج می‌کند، پسوند cwd فعلی را زیر این ریشه راه‌دور حفظ می‌کند، و فقط cwd نهایی سرور برنامه را به Codex می‌فرستد. اگر cwd بیرون از ریشه فضای کاری حل‌شده OpenClaw باشد، OpenClaw به‌جای ارسال یک مسیر محلی Gateway به سرور برنامه راه‌دور، به‌صورت بسته شکست می‌خورد. |
| `requestTimeoutMs`                            | `60000`                                                | مهلت زمانی برای فراخوانی‌های صفحه کنترل سرور برنامه.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | پنجره سکوت پس از اینکه Codex یک نوبت را می‌پذیرد یا پس از یک درخواست سرور برنامه محدود به نوبت، در حالی که OpenClaw منتظر `turn/completed` است.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | نگهبان تکمیل-بیکاری و پیشرفت که پس از تحویل ابزار، تکمیل ابزار بومی، پیشرفت خام دستیار پس از ابزار، تکمیل استدلال خام، یا پیشرفت استدلال، در حالی که OpenClaw منتظر `turn/completed` است، استفاده می‌شود. از این برای بارهای کاری مورداعتماد یا سنگین استفاده کنید که در آن‌ها ترکیب پس از ابزار می‌تواند به‌طور موجه بیشتر از بودجه انتشار نهایی دستیار ساکت بماند.                                |
| `mode`                                        | `"yolo"` مگر اینکه نیازمندی‌های محلی Codex اجازه YOLO ندهند | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط نگهبان. نیازمندی‌های محلی stdio که `danger-full-access`، تأیید `never`، یا بازبین `user` را حذف می‌کنند، پیش‌فرض ضمنی را به نگهبان تبدیل می‌کنند.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` یا یک سیاست تأیید مجاز نگهبان       | سیاست تأیید بومی Codex که به شروع/ازسرگیری/نوبت رشته فرستاده می‌شود. پیش‌فرض‌های نگهبان در صورت مجاز بودن، `"on-request"` را ترجیح می‌دهند.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` یا یک sandbox مجاز نگهبان  | حالت sandbox بومی Codex که به شروع/ازسرگیری رشته فرستاده می‌شود. پیش‌فرض‌های نگهبان در صورت مجاز بودن، `"workspace-write"` را ترجیح می‌دهند، وگرنه `"read-only"`. وقتی sandbox OpenClaw فعال باشد، نوبت‌های `danger-full-access` از `workspace-write` در Codex استفاده می‌کنند و دسترسی شبکه از تنظیم خروجی sandbox OpenClaw مشتق می‌شود.                                                                                     |
| `approvalsReviewer`                           | `"user"` یا یک بازبین مجاز نگهبان               | از `"auto_review"` استفاده کنید تا Codex در صورت مجاز بودن، اعلان‌های تأیید بومی را بازبینی کند؛ وگرنه `guardian_subagent` یا `user`. `guardian_subagent` همچنان یک نام مستعار قدیمی است.                                                                                                                                                                                                                              |
| `serviceTier`                                 | تنظیم‌نشده                                                  | سطح سرویس اختیاری سرور برنامه Codex. `"priority"` مسیریابی حالت سریع را فعال می‌کند، `"flex"` پردازش flex را درخواست می‌کند، `null` بازنویسی را پاک می‌کند، و `"fast"` قدیمی به‌عنوان `"priority"` پذیرفته می‌شود.                                                                                                                                                                                                 |
| `networkProxy`                                | غیرفعال                                               | شبکه‌سازی پروفایل مجوزهای Codex را برای فرمان‌های سرور برنامه فعال می‌کند. OpenClaw پیکربندی `permissions.<profile>.network` انتخاب‌شده را تعریف می‌کند و به‌جای ارسال `sandbox`، آن را با `default_permissions` انتخاب می‌کند.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | فعال‌سازی آزمایشی که یک محیط Codex پشتیبانی‌شده با sandbox OpenClaw را در Codex app-server 0.132.0 یا جدیدتر ثبت می‌کند تا اجرای بومی Codex بتواند داخل sandbox فعال OpenClaw اجرا شود.                                                                                                                                                                                                         |

`appServer.networkProxy` صریح است، چون قرارداد sandbox در Codex را تغییر می‌دهد.
وقتی فعال باشد، OpenClaw همچنین `features.network_proxy.enabled` و
`default_permissions` را در پیکربندی رشته Codex تنظیم می‌کند تا پروفایل مجوز
تولیدشده بتواند شبکه‌سازی مدیریت‌شده Codex را شروع کند. به‌طور پیش‌فرض، OpenClaw
یک نام پروفایل مقاوم در برابر برخورد به‌شکل `openclaw-network-<fingerprint>` را از
بدنه پروفایل تولید می‌کند؛ فقط زمانی از `profileName` استفاده کنید که یک نام محلی پایدار لازم باشد.

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

اگر زمان اجرای معمول سرور برنامه `danger-full-access` باشد، فعال‌کردن
`networkProxy` برای پروفایل مجوز تولیدشده از دسترسی فایل‌سیستم به سبک فضای کاری
استفاده می‌کند. اعمال شبکه مدیریت‌شده Codex، شبکه‌سازی sandbox شده است،
بنابراین یک پروفایل با دسترسی کامل از ترافیک خروجی محافظت نمی‌کند.
ورودی‌های دامنه از `allow` یا `deny` استفاده می‌کنند؛ ورودی‌های سوکت Unix از
مقادیر `allow` یا `none` در Codex استفاده می‌کنند.

فراخوانی‌های ابزار پویا که مالکیتشان با OpenClaw است، مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: درخواست‌های Codex `item/tool/call` به‌طور پیش‌فرض از یک دیده‌بان ۹۰ ثانیه‌ای
OpenClaw استفاده می‌کنند. آرگومان مثبت `timeoutMs` برای هر فراخوانی، بودجه همان ابزار مشخص را افزایش
یا کاهش می‌دهد. ابزار `image_generate` وقتی فراخوانی ابزار زمان‌پایان خودش را
ارائه نکند، از
`agents.defaults.imageGenerationModel.timeoutMs` استفاده می‌کند؛ وگرنه از پیش‌فرض ۱۲۰ ثانیه‌ای تولید تصویر استفاده می‌شود.
ابزار `image` برای درک رسانه از
`tools.media.image.timeoutSeconds` یا پیش‌فرض ۶۰ ثانیه‌ای رسانه استفاده می‌کند. برای درک تصویر،
این زمان‌پایان به خود درخواست اعمال می‌شود و با کارهای آماده‌سازی قبلی
کاهش نمی‌یابد. بودجه‌های ابزار پویا
در 600000 ms سقف‌گذاری شده‌اند. هنگام زمان‌پایان، OpenClaw در صورت پشتیبانی سیگنال ابزار را لغو می‌کند
و یک پاسخ ناموفق ابزار پویا به Codex برمی‌گرداند تا نوبت بتواند
ادامه یابد، به‌جای اینکه نشست در `processing` باقی بماند.
این دیده‌بان بودجه بیرونی `item/tool/call` پویا است؛ زمان‌پایان‌های
درخواست ویژه ارائه‌دهنده داخل همان فراخوانی اجرا می‌شوند و معناشناسی زمان‌پایان خودشان را حفظ می‌کنند.

پس از اینکه Codex یک نوبت را می‌پذیرد، و پس از اینکه OpenClaw به یک درخواست
app-server محدود به همان نوبت پاسخ می‌دهد، هارنس انتظار دارد Codex در نوبت فعلی پیشرفت کند و
در نهایت نوبت بومی را با `turn/completed` تمام کند. اگر app-server به مدت
`appServer.turnCompletionIdleTimeoutMs` ساکت بماند، OpenClaw به‌صورت best-effort
نوبت Codex را قطع می‌کند، یک زمان‌پایان تشخیصی ثبت می‌کند، و مسیر نشست
OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی پشت یک نوبت بومی کهنه
در صف نمانند. بیشتر اعلان‌های غیرپایانی برای همان نوبت، این دیده‌بان کوتاه را خلع سلاح می‌کنند
چون Codex ثابت کرده که نوبت هنوز زنده است. واگذاری‌های ابزار از یک
بودجه بیکاری طولانی‌تر پس از ابزار استفاده می‌کنند: پس از اینکه OpenClaw یک پاسخ `item/tool/call`
برمی‌گرداند، پس از تکمیل آیتم‌های ابزار بومی مثل `commandExecution`، پس از تکمیل‌های خام
`custom_tool_call_output`، و پس از پیشرفت خام دستیار پس از ابزار،
تکمیل‌های استدلال خام، یا پیشرفت استدلال. این محافظ وقتی پیکربندی شده باشد از
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` استفاده می‌کند و
در غیر این صورت به‌طور پیش‌فرض پنج دقیقه است. همان بودجه پس از ابزار، دیده‌بان
پیشرفت را نیز برای پنجره سنتز خاموش پیش از اینکه Codex رویداد بعدی
نوبت فعلی را منتشر کند تمدید می‌کند. اعلان‌های سراسری app-server، مثل به‌روزرسانی‌های محدودیت نرخ،
پیشرفت بیکاری نوبت را بازنشانی نمی‌کنند. تکمیل‌های استدلال، تکمیل‌های
`agentMessage` از نوع commentary، و پیشرفت خام استدلال یا دستیار پیش از ابزار می‌توانند
با یک پاسخ نهایی خودکار دنبال شوند، بنابراین به‌جای آزاد کردن فوری مسیر نشست
از محافظ پاسخ پس از پیشرفت استفاده می‌کنند. فقط آیتم‌های `agentMessage`
تکمیل‌شده نهایی/غیر-commentary و تکمیل‌های خام دستیار پیش از ابزار،
آزادسازی خروجی دستیار را مسلح می‌کنند: اگر Codex سپس بدون `turn/completed` ساکت بماند،
OpenClaw به‌صورت best-effort نوبت بومی را قطع می‌کند و مسیر نشست را آزاد می‌کند.
اگر دیده‌بان نوبت دیگری در رقابت آزادسازی برنده شود، OpenClaw همچنان آیتم
دستیار نهایی تکمیل‌شده را می‌پذیرد، به‌محض اینکه هیچ درخواست بومی، آیتم، یا تکمیل
ابزار پویا فعال باقی نمانده باشد و آزادسازی خروجی دستیار همچنان متعلق به آخرین
آیتم تکمیل‌شده باشد، بدون تکمیل آیتم بعدی. این می‌تواند پاسخ نهایی را پس از کار ابزار
تکمیل‌شده حفظ کند، بدون بازپخش نوبت. دلتاهای جزئی دستیار، پاسخ‌های قدیمی‌تر
کهنه، و تکمیل‌های بعدی خالی واجد شرایط نیستند. شکست‌های app-server روی stdio که برای بازپخش امن هستند،
از جمله زمان‌پایان‌های بیکاری تکمیل نوبت بدون شواهد دستیار، ابزار، آیتم فعال،
یا اثر جانبی، یک‌بار روی تلاش تازه app-server دوباره امتحان می‌شوند. زمان‌پایان‌های ناامن
همچنان کلاینت app-server گیرکرده را بازنشسته می‌کنند و مسیر نشست OpenClaw
را آزاد می‌کنند. آن‌ها همچنین اتصال رشته بومی کهنه را پاک می‌کنند، به‌جای اینکه
به‌طور خودکار بازپخش شوند. زمان‌پایان‌های دیده‌بان تکمیل، متن زمان‌پایان ویژه Codex را نمایش می‌دهند:
موارد امن برای بازپخش می‌گویند پاسخ ممکن است ناقص باشد، درحالی‌که موارد ناامن
به کاربر می‌گویند پیش از تلاش دوباره وضعیت فعلی را بررسی کند. تشخیص‌های عمومی زمان‌پایان
شامل فیلدهای ساختاری مانند آخرین متد اعلان app-server،
شناسه/نوع/نقش آیتم پاسخ خام دستیار، شمار درخواست/آیتم فعال، و وضعیت دیده‌بان
مسلح هستند. وقتی آخرین اعلان یک آیتم پاسخ خام دستیار باشد، آن‌ها
یک پیش‌نمایش محدود از متن دستیار را نیز شامل می‌شوند. آن‌ها پرامپت خام یا
محتوای ابزار را شامل نمی‌شوند.

بازنویسی‌های محیطی همچنان برای آزمون محلی در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` وقتی
`appServer.command` تنظیم نشده باشد، باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جایش از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا
برای آزمون محلی موردی از
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. پیکربندی برای استقرارهای تکرارپذیر
ترجیح داده می‌شود، چون رفتار Plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد
که بقیه راه‌اندازی هارنس Codex در آن قرار دارد.

## Pluginهای بومی Codex

پشتیبانی از Plugin بومی Codex از قابلیت‌های برنامه و Plugin خود app-server Codex
در همان رشته Codex مربوط به نوبت هارنس OpenClaw استفاده می‌کند. OpenClaw
Pluginهای Codex را به ابزارهای پویای مصنوعی `codex_plugin_*` در OpenClaw
ترجمه نمی‌کند.

`codexPlugins` فقط روی نشست‌هایی اثر می‌گذارد که هارنس بومی Codex را انتخاب می‌کنند. این
روی اجراهای هارنس داخلی، اجراهای عادی ارائه‌دهنده OpenAI، اتصال‌های مکالمه ACP،
یا هارنس‌های دیگر اثری ندارد.

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

پیکربندی برنامه رشته زمانی محاسبه می‌شود که OpenClaw یک نشست هارنس Codex
برقرار می‌کند یا اتصال رشته Codex کهنه‌ای را جایگزین می‌کند. در هر نوبت
دوباره محاسبه نمی‌شود. پس از تغییر `codexPlugins`، از `/new`، `/reset` استفاده کنید،
یا Gateway را راه‌اندازی مجدد کنید تا نشست‌های آینده هارنس Codex با مجموعه برنامه
به‌روزشده شروع شوند.

برای صلاحیت مهاجرت، موجودی برنامه، سیاست اقدام مخرب،
درخواست‌های تعاملی، و تشخیص‌های Plugin بومی، ببینید
[Pluginهای بومی Codex](/fa/plugins/codex-native-plugins).

دسترسی برنامه و Plugin در سمت OpenAI توسط حساب Codex واردشده و،
برای فضاهای کاری Business و Enterprise/Edu، کنترل‌های برنامه فضای کاری کنترل می‌شود. برای نمای کلی حساب و کنترل‌های فضای کاری OpenAI، ببینید
[استفاده از Codex با طرح ChatGPT شما](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی خودش پوشش داده شده است:
[استفاده از رایانه در Codex](/fa/plugins/codex-computer-use).

نسخه کوتاه: OpenClaw برنامه کنترل دسکتاپ را vendoring نمی‌کند و
خودش اقدام‌های دسکتاپ را اجرا نمی‌کند. این برنامه app-server Codex را آماده می‌کند،
بررسی می‌کند که سرور MCP `computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex
در طول نوبت‌های حالت Codex مالک فراخوانی‌های ابزار MCP بومی باشد.

## مرزهای زمان اجرا

هارنس Codex فقط اجراکننده سطح پایین عامل تعبیه‌شده را تغییر می‌دهد.

- ابزارهای پویای OpenClaw پشتیبانی می‌شوند. Codex از OpenClaw می‌خواهد آن
  ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.
- ابزارهای شل، patch، MCP، و ابزارهای برنامه بومی Codex، متعلق به Codex هستند.
  OpenClaw می‌تواند رویدادهای بومی منتخب را از طریق relay پشتیبانی‌شده مشاهده یا مسدود کند،
  اما آرگومان‌های ابزار بومی را بازنویسی نمی‌کند.
- Codex مالک Compaction بومی است. OpenClaw یک آینه رونوشت برای تاریخچه کانال،
  جست‌وجو، `/new`، `/reset`، و تغییر مدل یا هارنس در آینده نگه می‌دارد، اما
  Compaction متعلق به Codex را با خلاصه‌ساز OpenClaw یا موتور زمینه
  جایگزین نمی‌کند.
- تولید رسانه، درک رسانه، TTS، تاییدها، و خروجی ابزار پیام‌رسانی
  همچنان از مسیر تنظیمات ارائه‌دهنده/مدل متناظر OpenClaw عبور می‌کنند.
- `tool_result_persist` روی نتایج ابزار رونوشت با مالکیت OpenClaw اعمال می‌شود، نه
  روی رکوردهای نتیجه ابزار بومی Codex.

برای لایه‌های hook، سطوح V1 پشتیبانی‌شده، مدیریت مجوز بومی، هدایت صف،
سازوکارهای بارگذاری بازخورد Codex، و جزئیات Compaction، ببینید
[زمان اجرای هارنس Codex](/fa/plugins/codex-harness-runtime).

## عیب‌یابی

**Codex به‌عنوان یک ارائه‌دهنده عادی `/model` ظاهر نمی‌شود:** این برای
پیکربندی‌های جدید انتظار می‌رود. یک مدل `openai/gpt-*` انتخاب کنید،
`plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید آیا `plugins.allow`
`codex` را مستثنی می‌کند یا نه.

**OpenClaw به‌جای Codex از هارنس داخلی استفاده می‌کند:** مطمئن شوید ارجاع مدل
`openai/gpt-*` روی ارائه‌دهنده رسمی OpenAI است و Plugin Codex
نصب و فعال شده است. اگر هنگام آزمون به اثبات سخت‌گیرانه نیاز دارید، در ارائه‌دهنده یا
مدل `agentRuntime.id: "codex"` را تنظیم کنید. زمان اجرای اجباری Codex به‌جای
بازگشت به OpenClaw شکست می‌خورد.

**زمان اجرای OpenAI Codex به مسیر کلید API بازمی‌گردد:** یک برش gateway ویرایش‌شده
جمع‌آوری کنید که مدل، زمان اجرا، ارائه‌دهنده انتخاب‌شده، و شکست را نشان دهد.
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

برش‌های مفید معمولاً شامل `openai/gpt-5.5` یا `openai/gpt-5.4`،
`Runtime: OpenAI Codex`، `agentRuntime.id` یا `harnessRuntime`،
`candidateProvider: "openai"`، و یک نتیجه `401`، `Incorrect API key`، یا
`No API key` هستند. اجرای اصلاح‌شده باید مسیر OAuth متعلق به OpenAI
را به‌جای شکست ساده کلید API OpenAI نشان دهد.

**پیکربندی ارجاع‌های مدل قدیمی Codex باقی مانده است:** `openclaw doctor --fix` را اجرا کنید.
Doctor ارجاع‌های مدل قدیمی را به `openai/*` بازنویسی می‌کند، pinهای زمان اجرای نشست کهنه و
کل عامل را حذف می‌کند، و overrideهای پروفایل احراز هویت موجود را حفظ می‌کند.

**app-server رد می‌شود:** از app-server Codex نسخه `0.125.0` یا جدیدتر استفاده کنید.
پیش‌انتشارهای همان نسخه یا نسخه‌های دارای پسوند build مانند
`0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون OpenClaw کف پروتکل
پایدار `0.125.0` را آزمایش می‌کند.

**`/codex status` نمی‌تواند وصل شود:** بررسی کنید که Plugin همراه `codex`
فعال باشد، وقتی allowlist پیکربندی شده است `plugins.allow` آن را شامل شود، و
هر `appServer.command`، `url`، `authToken`، یا header سفارشی معتبر باشد.

**کشف مدل کند است:** مقدار
`plugins.entries.codex.config.discovery.timeoutMs` را کاهش دهید یا کشف را غیرفعال کنید. ببینید
[مرجع هارنس Codex](/fa/plugins/codex-harness-reference#model-discovery).

**انتقال WebSocket بلافاصله شکست می‌خورد:** `appServer.url`، `authToken`،
headerها، و اینکه app-server دوردست همان نسخه پروتکل app-server Codex را صحبت می‌کند بررسی کنید.

**ابزارهای پوستهٔ بومی یا patch با `Native hook relay unavailable` مسدود شده‌اند:**
رشتهٔ Codex هنوز تلاش می‌کند از شناسهٔ رلهٔ قلاب بومی‌ای استفاده کند که OpenClaw دیگر آن را ثبت نکرده است. این یک مشکل انتقال قلاب بومی Codex است، نه خرابی backend مربوط به ACP، ارائه‌دهنده، GitHub یا فرمان پوسته. در گفت‌وگوی تحت‌تأثیر، یک نشست تازه را با `/new` یا `/reset` شروع کنید، سپس یک فرمان بی‌خطر را دوباره امتحان کنید. اگر این کار یک بار موفق شد اما فراخوانی بعدی ابزار بومی دوباره شکست خورد، `/new` را فقط به‌عنوان یک راهکار موقت در نظر بگیرید: پس از راه‌اندازی دوبارهٔ app-server مربوط به Codex یا OpenClaw Gateway، اعلان را در یک نشست تازه کپی کنید تا رشته‌های قدیمی کنار گذاشته شوند و ثبت‌های قلاب بومی دوباره ایجاد شوند.

**یک مدل غیر Codex از harness داخلی استفاده می‌کند:** این مورد مورد انتظار است، مگر اینکه سیاست runtime ارائه‌دهنده یا مدل آن را به harness دیگری هدایت کند. ارجاع‌های سادهٔ ارائه‌دهندهٔ غیر OpenAI در حالت `auto` روی مسیر عادی ارائه‌دهندهٔ خود باقی می‌مانند.

**Computer Use نصب شده است اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه، `/codex computer-use status` را بررسی کنید. اگر ابزاری `Native hook relay unavailable` را گزارش کرد، از بازیابی رلهٔ قلاب بومی در بالا استفاده کنید. [Codex Computer Use](/fa/plugins/codex-computer-use#troubleshooting) را ببینید.

## مرتبط

- [مرجع harness مربوط به Codex](/fa/plugins/codex-harness-reference)
- [runtime harness مربوط به Codex](/fa/plugins/codex-harness-runtime)
- [Pluginهای بومی Codex](/fa/plugins/codex-native-plugins)
- [Codex Computer Use](/fa/plugins/codex-computer-use)
- [runtimeهای عامل](/fa/concepts/agent-runtimes)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [ارائه‌دهندهٔ OpenAI](/fa/providers/openai)
- [راهنمای OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Pluginهای harness عامل](/fa/plugins/sdk-agent-harness)
- [قلاب‌های Plugin](/fa/plugins/hooks)
- [برون‌ریزی عیب‌یابی](/fa/gateway/diagnostics)
- [وضعیت](/fa/cli/status)
- [آزمایش](/fa/help/testing-live#live-codex-app-server-harness-smoke)

---
read_when:
    - می‌خواهید از هارنس app-server همراه Codex استفاده کنید
    - به نمونه‌های پیکربندی هارنس Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به PI، با شکست مواجه شوند
summary: نوبت‌های عامل تعبیه‌شده OpenClaw را از طریق هارنس app-server همراه Codex اجرا کنید
title: هارنس Codex
x-i18n:
    generated_at: "2026-04-30T20:05:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw اجازه می‌دهد نوبت‌های عامل تعبیه‌شده را به‌جای harness داخلی PI از طریق app-server کدکس اجرا کند.

از این زمانی استفاده کنید که می‌خواهید کدکس مالک نشست عامل در سطح پایین باشد: کشف مدل، ازسرگیری بومی رشته، Compaction بومی، و اجرای app-server. OpenClaw همچنان مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل، ابزارها، تأییدها، تحویل رسانه، و آینهٔ transcript قابل‌مشاهده است.

اگر می‌خواهید جهت‌گیری پیدا کنید، از
[زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) شروع کنید. نسخهٔ کوتاه این است:
`openai/gpt-5.5` ارجاع مدل است، `codex` runtime است، و Telegram،
Discord، Slack، یا کانال دیگری همچنان سطح ارتباطی باقی می‌ماند.

## این Plugin چه چیزی را تغییر می‌دهد

Plugin همراه `codex` چند قابلیت جداگانه اضافه می‌کند:

| قابلیت                           | نحوهٔ استفاده                                       | کاری که انجام می‌دهد                                                        |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| runtime تعبیه‌شدهٔ بومی           | `agentRuntime.id: "codex"`                          | نوبت‌های عامل تعبیه‌شدهٔ OpenClaw را از طریق app-server کدکس اجرا می‌کند.    |
| فرمان‌های کنترل چت بومی           | `/codex bind`, `/codex resume`, `/codex steer`, ... | رشته‌های app-server کدکس را از یک گفت‌وگوی پیام‌رسان متصل و کنترل می‌کند.   |
| ارائه‌دهنده/کاتالوگ app-server کدکس | داخلی‌های `codex`، از طریق harness نمایان می‌شود    | به runtime اجازه می‌دهد مدل‌های app-server را کشف و اعتبارسنجی کند.          |
| مسیر درک رسانه‌ای کدکس            | مسیرهای سازگاری مدل تصویر `codex/*`                 | نوبت‌های محدود app-server کدکس را برای مدل‌های پشتیبانی‌شدهٔ درک تصویر اجرا می‌کند. |
| relay hook بومی                   | hookهای Plugin پیرامون رویدادهای بومی کدکس          | به OpenClaw اجازه می‌دهد رویدادهای ابزار/نهایی‌سازی بومی کدکس را مشاهده/مسدود کند. |

فعال‌سازی Plugin این قابلیت‌ها را در دسترس قرار می‌دهد. این کار **انجام نمی‌دهد**:

- شروع به استفاده از کدکس برای هر مدل OpenAI
- تبدیل ارجاع‌های مدل `openai-codex/*` به runtime بومی
- پیش‌فرض کردن ACP/acpx به‌عنوان مسیر کدکس
- جابه‌جایی داغ نشست‌های موجود که قبلاً runtime PI را ثبت کرده‌اند
- جایگزینی تحویل کانال OpenClaw، فایل‌های نشست، ذخیره‌سازی auth-profile، یا
  مسیریابی پیام

همین Plugin همچنین مالک سطح فرمان کنترل چت بومی `/codex` است. اگر
Plugin فعال باشد و کاربر بخواهد رشته‌های کدکس را از چت bind، resume، steer، stop، یا inspect کند، عامل‌ها باید `/codex ...` را به ACP ترجیح دهند. ACP زمانی fallback صریح باقی می‌ماند که کاربر ACP/acpx را درخواست کند یا در حال آزمودن آداپتور ACP کدکس باشد.

نوبت‌های بومی کدکس hookهای Plugin OpenClaw را به‌عنوان لایهٔ سازگاری عمومی نگه می‌دارند.
این‌ها hookهای درون‌فرآیندی OpenClaw هستند، نه hookهای فرمان `hooks.json` کدکس:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` برای رکوردهای transcript آینه‌شده
- `before_agent_finalize` از طریق relay `Stop` کدکس
- `agent_end`

Pluginها همچنین می‌توانند middleware نتیجهٔ ابزار مستقل از runtime ثبت کنند تا
نتایج ابزار پویای OpenClaw را پس از اجرای ابزار توسط OpenClaw و پیش از بازگرداندن
نتیجه به کدکس بازنویسی کنند. این از hook عمومی Plugin
`tool_result_persist` جداست، که نوشته‌های نتیجهٔ ابزار در transcript تحت مالکیت OpenClaw را تغییر می‌دهد.

برای خود معناشناسی hookهای Plugin، [hookهای Plugin](/fa/plugins/hooks)
و [رفتار guard Plugin](/fa/tools/plugin) را ببینید.

harness به‌صورت پیش‌فرض خاموش است. پیکربندی‌های جدید باید ارجاع‌های مدل OpenAI را
به‌شکل canonical `openai/gpt-*` نگه دارند و وقتی اجرای بومی app-server را
می‌خواهند، صریحاً
`agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex` را اجبار کنند. ارجاع‌های مدل قدیمی `codex/*` همچنان برای سازگاری harness را به‌صورت خودکار انتخاب می‌کنند، اما پیشوندهای قدیمی ارائه‌دهنده که با runtime پشتیبانی می‌شوند، به‌عنوان انتخاب‌های عادی مدل/ارائه‌دهنده نشان داده نمی‌شوند.

اگر Plugin `codex` فعال باشد اما مدل اصلی همچنان
`openai-codex/*` باشد، `openclaw doctor` به‌جای تغییر مسیر هشدار می‌دهد. این
عمدی است: `openai-codex/*` مسیر OAuth/اشتراک PI کدکس باقی می‌ماند، و
اجرای بومی app-server یک انتخاب صریح runtime می‌ماند.

## نقشهٔ مسیر

پیش از تغییر پیکربندی از این جدول استفاده کنید:

| رفتار مطلوب                                  | ارجاع مدل                  | پیکربندی runtime                     | نیازمندی Plugin              | برچسب وضعیت مورد انتظار        |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API از طریق runner عادی OpenClaw     | `openai/gpt-*`             | حذف‌شده یا `runtime: "pi"`             | ارائه‌دهندهٔ OpenAI          | `Runtime: OpenClaw Pi Default` |
| OAuth/اشتراک کدکس از طریق PI                | `openai-codex/gpt-*`       | حذف‌شده یا `runtime: "pi"`             | ارائه‌دهندهٔ OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| نوبت‌های تعبیه‌شدهٔ بومی app-server کدکس     | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| ارائه‌دهنده‌های ترکیبی با حالت خودکار محافظه‌کار | ارجاع‌های ویژهٔ ارائه‌دهنده | `agentRuntime.id: "auto"`              | runtimeهای Plugin اختیاری   | به runtime انتخاب‌شده بستگی دارد |
| نشست صریح آداپتور ACP کدکس                  | وابسته به prompt/model ACP | `sessions_spawn` با `runtime: "acp"`   | backend سالم `acpx`         | وضعیت وظیفه/نشست ACP           |

تفکیک مهم، ارائه‌دهنده در برابر runtime است:

- `openai-codex/*` پاسخ می‌دهد «PI باید از کدام مسیر ارائه‌دهنده/auth استفاده کند؟»
- `agentRuntime.id: "codex"` پاسخ می‌دهد «کدام loop باید این نوبت
  تعبیه‌شده را اجرا کند؟»
- `/codex ...` پاسخ می‌دهد «این چت باید به کدام گفت‌وگوی بومی کدکس متصل شود
  یا آن را کنترل کند؟»
- ACP پاسخ می‌دهد «acpx باید کدام فرآیند harness خارجی را اجرا کند؟»

## پیشوند مدل درست را انتخاب کنید

مسیرهای خانوادهٔ OpenAI به پیشوند وابسته‌اند. وقتی OAuth کدکس از طریق PI را می‌خواهید از `openai-codex/*` استفاده کنید؛ وقتی دسترسی مستقیم OpenAI API را می‌خواهید یا زمانی که harness بومی app-server کدکس را اجبار می‌کنید از `openai/*` استفاده کنید:

| ارجاع مدل                                      | مسیر runtime                                | زمان استفاده                                                              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | ارائه‌دهندهٔ OpenAI از طریق لوله‌کشی OpenClaw/PI | دسترسی مستقیم فعلی به OpenAI Platform API با `OPENAI_API_KEY` می‌خواهید. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth از طریق OpenClaw/PI       | auth اشتراک ChatGPT/Codex را با runner پیش‌فرض PI می‌خواهید.             |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | harness app-server کدکس                     | اجرای بومی app-server کدکس را برای نوبت عامل تعبیه‌شده می‌خواهید.       |

GPT-5.5 در حال حاضر در OpenClaw فقط از طریق اشتراک/OAuth است. برای OAuth در PI از
`openai-codex/gpt-5.5` استفاده کنید، یا از `openai/gpt-5.5` همراه با harness
app-server کدکس. دسترسی مستقیم با کلید API برای `openai/gpt-5.5` پس از فعال کردن GPT-5.5 روی API عمومی توسط OpenAI پشتیبانی می‌شود.

ارجاع‌های قدیمی `codex/gpt-*` همچنان به‌عنوان aliasهای سازگاری پذیرفته می‌شوند. مهاجرت سازگاری doctor ارجاع‌های runtime اصلی قدیمی را به ارجاع‌های مدل canonical بازنویسی می‌کند و سیاست runtime را جداگانه ثبت می‌کند، در حالی که ارجاع‌های قدیمی فقط-fallback بدون تغییر می‌مانند، چون runtime برای کل محفظهٔ عامل پیکربندی می‌شود. پیکربندی‌های جدید PI Codex OAuth باید از `openai-codex/gpt-*` استفاده کنند؛ پیکربندی‌های جدید harness بومی app-server باید از `openai/gpt-*` به‌علاوهٔ
`agentRuntime.id: "codex"` استفاده کنند.

`agents.defaults.imageModel` از همان تفکیک پیشوند پیروی می‌کند. وقتی درک تصویر باید از مسیر ارائه‌دهندهٔ OpenAI Codex OAuth اجرا شود، از
`openai-codex/gpt-*` استفاده کنید. وقتی درک تصویر باید از طریق یک نوبت محدود app-server کدکس اجرا شود، از `codex/gpt-*` استفاده کنید. مدل app-server کدکس باید پشتیبانی از ورودی تصویر را اعلام کند؛ مدل‌های فقط متن کدکس پیش از شروع نوبت رسانه شکست می‌خورند.

برای تأیید harness مؤثر برای نشست فعلی از `/status` استفاده کنید. اگر
انتخاب غیرمنتظره است، logging اشکال‌زدایی را برای زیرسامانهٔ `agents/harness` فعال کنید
و رکورد ساختاریافتهٔ `agent harness selected` در Gateway را بررسی کنید. این رکورد
شناسهٔ harness انتخاب‌شده، دلیل انتخاب، سیاست runtime/fallback، و در حالت `auto`، نتیجهٔ پشتیبانی هر نامزد Plugin را شامل می‌شود.

### هشدارهای doctor یعنی چه

`openclaw doctor` زمانی هشدار می‌دهد که همهٔ این موارد درست باشند:

- Plugin همراه `codex` فعال یا مجاز باشد
- مدل اصلی یک عامل `openai-codex/*` باشد
- runtime مؤثر آن عامل `codex` نباشد

این هشدار وجود دارد چون کاربران اغلب انتظار دارند «Plugin کدکس فعال است» به معنی
«runtime بومی app-server کدکس» باشد. OpenClaw چنین پرشی انجام نمی‌دهد. هشدار یعنی:

- اگر قصد شما ChatGPT/Codex OAuth از طریق PI بوده، **هیچ تغییری لازم نیست**.
- اگر قصد شما اجرای بومی app-server بوده، مدل را به `openai/<model>` تغییر دهید و
  `agentRuntime.id: "codex"` را تنظیم کنید.
- نشست‌های موجود پس از تغییر runtime همچنان به `/new` یا `/reset` نیاز دارند،
  چون pinهای runtime نشست چسبنده‌اند.

انتخاب harness کنترل زندهٔ نشست نیست. وقتی یک نوبت تعبیه‌شده اجرا می‌شود،
OpenClaw شناسهٔ harness انتخاب‌شده را روی آن نشست ثبت می‌کند و برای
نوبت‌های بعدی در همان شناسهٔ نشست به استفاده از آن ادامه می‌دهد. وقتی می‌خواهید نشست‌های آینده از harness دیگری استفاده کنند، پیکربندی `agentRuntime` یا
`OPENCLAW_AGENT_RUNTIME` را تغییر دهید؛ برای شروع یک نشست تازه پیش از جابه‌جایی یک گفت‌وگوی موجود بین PI و کدکس، از `/new` یا `/reset` استفاده کنید. این کار از replay کردن یک transcript از طریق دو سامانهٔ نشست بومی ناسازگار جلوگیری می‌کند.

نشست‌های قدیمی ساخته‌شده پیش از pinهای harness، پس از داشتن تاریخچهٔ transcript به‌عنوان PI-pinned در نظر گرفته می‌شوند. پس از تغییر پیکربندی، برای وارد کردن آن گفت‌وگو به کدکس از `/new` یا `/reset` استفاده کنید.

`/status` runtime مؤثر مدل را نشان می‌دهد. harness پیش‌فرض PI به‌شکل
`Runtime: OpenClaw Pi Default` ظاهر می‌شود، و harness app-server کدکس به‌شکل
`Runtime: OpenAI Codex`.

## نیازمندی‌ها

- OpenClaw با Plugin همراه `codex` در دسترس.
- app-server کدکس `0.125.0` یا جدیدتر. Plugin همراه به‌صورت پیش‌فرض یک binary سازگار app-server کدکس را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex` روی `PATH` بر راه‌اندازی عادی harness اثر نمی‌گذارند.
- auth کدکس در دسترس فرآیند app-server یا پل auth کدکس OpenClaw. راه‌اندازی‌های app-server محلی stdio برای هر عامل از home کدکس مدیریت‌شده توسط OpenClaw و یک child `HOME` ایزوله استفاده می‌کنند، بنابراین به‌صورت پیش‌فرض حساب شخصی
  `~/.codex`، Skills، Pluginها، پیکربندی، وضعیت رشته، یا
  `$HOME/.agents/skills` بومی شما را نمی‌خوانند.

Plugin handshakeهای app-server قدیمی‌تر یا بدون نسخه را مسدود می‌کند. این کار
OpenClaw را روی سطح پروتکلی نگه می‌دارد که علیه آن آزموده شده است.

برای آزمون‌های smoke زنده و Docker، auth معمولاً از حساب Codex CLI
یا یک پروفایل auth `openai-codex` در OpenClaw می‌آید. راه‌اندازی‌های app-server محلی stdio نیز وقتی هیچ حسابی وجود ندارد می‌توانند به `CODEX_API_KEY` / `OPENAI_API_KEY` fallback کنند.

## پیکربندی حداقلی

از `openai/gpt-5.5` استفاده کنید، Plugin همراه را فعال کنید، و harness `codex` را اجبار کنید:

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
      agentRuntime: {
        id: "codex",
      },
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

پیکربندی‌های قدیمی که `agents.defaults.model` یا مدل یک عامل را روی
`codex/<model>` تنظیم می‌کنند همچنان Plugin همراه `codex` را به‌صورت خودکار فعال می‌کنند. پیکربندی‌های جدید باید `openai/<model>` به‌علاوهٔ ورودی صریح `agentRuntime` بالا را ترجیح دهند.

## افزودن کدکس در کنار مدل‌های دیگر

اگر همان عامل باید بتواند آزادانه بین مدل‌های ارائه‌دهنده Codex و غیر Codex جابه‌جا شود، `agentRuntime.id: "codex"` را به‌صورت سراسری تنظیم نکنید. یک runtime اجباری روی هر نوبت تعبیه‌شده برای آن عامل یا نشست اعمال می‌شود. اگر در حالی که آن runtime اجباری است یک مدل Anthropic را انتخاب کنید، OpenClaw همچنان Codex harness را امتحان می‌کند و به‌جای اینکه آن نوبت را بی‌سروصدا از طریق PI مسیریابی کند، بسته و ناموفق می‌شود.

در عوض از یکی از این شکل‌ها استفاده کنید:

- Codex را روی یک عامل اختصاصی با `agentRuntime.id: "codex"` قرار دهید.
- عامل پیش‌فرض را روی `agentRuntime.id: "auto"` و PI fallback برای استفاده عادی با ارائه‌دهندگان ترکیبی نگه دارید.
- از ارجاع‌های قدیمی `codex/*` فقط برای سازگاری استفاده کنید. پیکربندی‌های جدید باید `openai/*` به‌همراه یک سیاست runtime صریح Codex را ترجیح دهند.

برای نمونه، این پیکربندی عامل پیش‌فرض را روی انتخاب خودکار عادی نگه می‌دارد و یک عامل Codex جداگانه اضافه می‌کند:

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
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

با این شکل:

- عامل پیش‌فرض `main` از مسیر عادی ارائه‌دهنده و PI compatibility fallback استفاده می‌کند.
- عامل `codex` از Codex app-server harness استفاده می‌کند.
- اگر Codex برای عامل `codex` موجود یا پشتیبانی‌شده نباشد، نوبت ناموفق می‌شود
  به‌جای اینکه بی‌سروصدا از PI استفاده کند.

## مسیریابی فرمان عامل

عامل‌ها باید درخواست‌های کاربر را بر اساس نیت مسیریابی کنند، نه فقط بر اساس واژه «Codex»:

| کاربر درخواست می‌کند...                                  | عامل باید استفاده کند از...                       |
| -------------------------------------------------------- | ------------------------------------------------ |
| «این گفتگو را به Codex متصل کن»                         | `/codex bind`                                    |
| «رشته Codex `<id>` را اینجا از سر بگیر»                 | `/codex resume <id>`                             |
| «رشته‌های Codex را نشان بده»                            | `/codex threads`                                 |
| «برای یک اجرای بد Codex یک گزارش پشتیبانی ثبت کن»       | `/diagnostics [note]`                            |
| «فقط برای این رشته پیوست‌شده بازخورد Codex بفرست»       | `/codex diagnostics [note]`                      |
| «از Codex به‌عنوان runtime برای این عامل استفاده کن»     | تغییر پیکربندی به `agentRuntime.id`              |
| «از اشتراک ChatGPT/Codex من با OpenClaw عادی استفاده کن» | ارجاع‌های مدل `openai-codex/*`                   |
| «Codex را از طریق ACP/acpx اجرا کن»                     | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| «Claude Code/Gemini/OpenCode/Cursor را در یک رشته شروع کن» | ACP/acpx، نه `/codex` و نه زیرعامل‌های بومی       |

OpenClaw فقط زمانی راهنمای ACP spawn را به عامل‌ها تبلیغ می‌کند که ACP فعال، قابل اعزام، و متکی به یک backend runtime بارگذاری‌شده باشد. اگر ACP در دسترس نباشد، system prompt و Plugin skills نباید به عامل درباره مسیریابی ACP آموزش دهند.

## استقرارهای فقط Codex

وقتی لازم است ثابت کنید هر نوبت عامل تعبیه‌شده از Codex استفاده می‌کند، Codex harness را اجباری کنید. runtimeهای Plugin صریح به‌طور پیش‌فرض PI fallback ندارند، بنابراین `fallback: "none"` اختیاری است اما اغلب به‌عنوان مستندسازی مفید است:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

بازنویسی محیطی:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

وقتی Codex اجباری باشد، اگر Plugin مربوط به Codex غیرفعال باشد، app-server بیش از حد قدیمی باشد، یا app-server نتواند شروع شود، OpenClaw زودهنگام ناموفق می‌شود. فقط زمانی `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` را تنظیم کنید که عمداً می‌خواهید PI انتخاب harness از‌دست‌رفته را مدیریت کند.

## Codex برای هر عامل

می‌توانید یک عامل را فقط Codex کنید در حالی که عامل پیش‌فرض انتخاب خودکار عادی را حفظ می‌کند:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
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
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

برای جابه‌جایی بین عامل‌ها و مدل‌ها از فرمان‌های عادی نشست استفاده کنید. `/new` یک نشست تازه OpenClaw ایجاد می‌کند و Codex harness در صورت نیاز رشته جانبی app-server خود را ایجاد یا از سر می‌گیرد. `/reset` اتصال نشست OpenClaw را برای آن رشته پاک می‌کند و اجازه می‌دهد نوبت بعدی دوباره harness را از پیکربندی فعلی حل کند.

## کشف مدل

به‌طور پیش‌فرض، Plugin مربوط به Codex از app-server مدل‌های موجود را می‌پرسد. اگر کشف ناموفق شود یا زمان آن تمام شود، از یک فهرست fallback همراه برای موارد زیر استفاده می‌کند:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

می‌توانید کشف را زیر `plugins.entries.codex.config.discovery` تنظیم کنید:

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

وقتی می‌خواهید راه‌اندازی از بررسی Codex پرهیز کند و به فهرست fallback پایبند بماند، کشف را غیرفعال کنید:

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

## اتصال و سیاست app-server

به‌طور پیش‌فرض، Plugin باینری مدیریت‌شده Codex مربوط به OpenClaw را به‌صورت محلی با این فرمان شروع می‌کند:

```bash
codex app-server --listen stdio://
```

باینری مدیریت‌شده به‌عنوان وابستگی runtime همراه Plugin اعلام می‌شود و همراه با بقیه وابستگی‌های Plugin مربوط به `codex` آماده‌سازی می‌شود. این کار نسخه app-server را به Plugin همراه گره می‌زند، نه به هر Codex CLI جداگانه‌ای که اتفاقاً به‌صورت محلی نصب شده باشد. فقط زمانی `appServer.command` را تنظیم کنید که عمداً می‌خواهید یک فایل اجرایی متفاوت را اجرا کنید.

به‌طور پیش‌فرض، OpenClaw نشست‌های محلی Codex harness را در حالت YOLO شروع می‌کند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. این وضعیت اپراتور محلی مورد اعتماد است که برای Heartbeatهای خودکار استفاده می‌شود: Codex می‌تواند از ابزارهای shell و شبکه استفاده کند بدون اینکه روی درخواست‌های تأیید بومی که کسی برای پاسخ‌دادن به آن‌ها حاضر نیست متوقف شود.

برای فعال‌کردن تأییدهای بازبینی‌شده توسط نگهبان Codex، `appServer.mode:
"guardian"` را تنظیم کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

حالت Guardian از مسیر تأیید بازبینی خودکار بومی Codex استفاده می‌کند. وقتی Codex درخواست خروج از sandbox، نوشتن بیرون از workspace، یا افزودن مجوزهایی مثل دسترسی شبکه می‌دهد، Codex آن درخواست تأیید را به‌جای اعلان انسانی به بازبین بومی مسیریابی می‌کند. بازبین چارچوب ریسک Codex را اعمال می‌کند و درخواست مشخص را تأیید یا رد می‌کند. وقتی محافظت‌های بیشتری نسبت به حالت YOLO می‌خواهید اما همچنان لازم است عامل‌های بدون مراقبت پیشرفت کنند، از Guardian استفاده کنید.

پیش‌تنظیم `guardian` به `approvalPolicy: "on-request"`،
`approvalsReviewer: "auto_review"`، و `sandbox: "workspace-write"` گسترش می‌یابد.
فیلدهای سیاستی جداگانه همچنان `mode` را بازنویسی می‌کنند، بنابراین استقرارهای پیشرفته می‌توانند پیش‌تنظیم را با انتخاب‌های صریح ترکیب کنند. مقدار بازبین قدیمی‌تر `guardian_subagent` همچنان به‌عنوان نام مستعار سازگاری پذیرفته می‌شود، اما پیکربندی‌های جدید باید از `auto_review` استفاده کنند.

برای یک app-server از قبل در حال اجرا، از انتقال WebSocket استفاده کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

راه‌اندازی‌های stdio app-server به‌طور پیش‌فرض محیط فرایند OpenClaw را به ارث می‌برند، اما OpenClaw پل حساب Codex app-server را مالکیت می‌کند و هر دو `CODEX_HOME` و `HOME` را روی دایرکتوری‌های مختص هر عامل زیر وضعیت OpenClaw همان عامل تنظیم می‌کند. بارگذار Skills خود Codex از `$CODEX_HOME/skills` و
`$HOME/.agents/skills` می‌خواند، بنابراین هر دو مقدار برای راه‌اندازی‌های محلی app-server ایزوله هستند. این کار Skills بومی Codex، Pluginها، پیکربندی، حساب‌ها، و وضعیت رشته را محدود به عامل OpenClaw نگه می‌دارد، نه اینکه از خانه شخصی Codex CLI اپراتور نشت کند.

Pluginهای OpenClaw و snapshotهای Skills مربوط به OpenClaw همچنان از طریق رجیستری Plugin و بارگذار Skills خود OpenClaw جریان پیدا می‌کنند. دارایی‌های شخصی Codex CLI این‌طور نیستند. اگر Skills یا Pluginهای مفیدی در Codex CLI دارید که باید بخشی از یک عامل OpenClaw شوند، آن‌ها را صریحاً فهرست‌برداری کنید:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

ارائه‌دهنده مهاجرت Codex، Skills را در workspace عامل فعلی OpenClaw کپی می‌کند. Pluginهای بومی Codex، hookها، و فایل‌های پیکربندی به‌جای فعال‌شدن خودکار، گزارش یا بایگانی می‌شوند تا به‌صورت دستی بازبینی شوند، چون می‌توانند فرمان اجرا کنند، سرورهای MCP را در معرض دسترس بگذارند، یا اعتبارنامه حمل کنند.

احراز هویت به این ترتیب انتخاب می‌شود:

1. یک پروفایل احراز هویت صریح OpenClaw Codex برای عامل.
2. حساب موجود app-server در خانه Codex همان عامل.
3. فقط برای راه‌اندازی‌های محلی stdio app-server، `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب app-server وجود ندارد و احراز هویت OpenAI
   همچنان لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex به سبک اشتراک ChatGPT می‌بیند، `CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex ایجادشده حذف می‌کند. این کار کلیدهای API سطح Gateway را برای embeddings یا مدل‌های مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه نوبت‌های بومی Codex app-server به‌اشتباه از طریق API صورتحساب شوند. پروفایل‌های صریح کلید API Codex و fallback کلید محیطی stdio محلی به‌جای محیط ارث‌برده فرایند فرزند، از ورود app-server استفاده می‌کنند. اتصال‌های WebSocket app-server، fallback کلید API محیطی Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب خود app-server راه دور استفاده کنید.

اگر یک استقرار به ایزوله‌سازی محیطی بیشتر نیاز دارد، آن متغیرها را به
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

`appServer.clearEnv` فقط روی فرایند فرزند Codex app-server ایجادشده اثر می‌گذارد.

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد               | پیش‌فرض                                  | معنا                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"`، Codex را اجرا می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                                                                                                                             |
| `command`           | باینری مدیریت‌شده Codex                     | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده، آن را تنظیم‌نشده بگذارید؛ فقط برای بازنویسی صریح آن را تنظیم کنید.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | آرگومان‌ها برای انتقال stdio.                                                                                                                                                                                                       |
| `url`               | تنظیم‌نشده                                    | نشانی وب app-server مبتنی بر WebSocket.                                                                                                                                                                                                            |
| `authToken`         | تنظیم‌نشده                                    | توکن Bearer برای انتقال WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | سرآیندهای اضافی WebSocket.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط به‌ارث‌رسیده توسط OpenClaw، از فرایند app-server مبتنی بر stdio حذف می‌شوند. `CODEX_HOME` و `HOME` برای جداسازی Codex به‌ازای هر عامل در OpenClaw هنگام اجراهای محلی رزرو شده‌اند. |
| `requestTimeoutMs`  | `60000`                                  | مهلت زمانی برای فراخوانی‌های صفحه کنترل app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | سیاست تأیید بومی Codex که به شروع/ازسرگیری/نوبت رشته ارسال می‌شود.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | حالت سندباکس بومی Codex که به شروع/ازسرگیری رشته ارسال می‌شود.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | از `"auto_review"` استفاده کنید تا Codex اعلان‌های تأیید بومی را بازبینی کند. `guardian_subagent` همچنان یک نام مستعار قدیمی است.                                                                                                                         |
| `serviceTier`       | تنظیم‌نشده                                    | سطح سرویس اختیاری app-server در Codex: `"fast"`، `"flex"`، یا `null`. مقادیر قدیمی نامعتبر نادیده گرفته می‌شوند.                                                                                                                            |

فراخوانی‌های ابزار پویا که مالکیتشان با OpenClaw است، مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: هر درخواست Codex از نوع `item/tool/call`
باید ظرف ۳۰ ثانیه یک پاسخ OpenClaw دریافت کند. هنگام پایان مهلت، OpenClaw در جاهایی که پشتیبانی شود
سیگنال ابزار را لغو می‌کند و یک پاسخ ابزار پویای ناموفق به Codex برمی‌گرداند تا
نوبت بتواند ادامه پیدا کند، به‌جای اینکه نشست در حالت `processing` باقی بماند.

پس از اینکه OpenClaw به یک درخواست app-server با دامنه نوبت Codex پاسخ می‌دهد، harness
همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` تمام کند. اگر
app-server پس از آن پاسخ به مدت ۶۰ ثانیه ساکت بماند، OpenClaw به‌صورت بهترین تلاش
نوبت Codex را قطع می‌کند، یک پایان مهلت تشخیصی ثبت می‌کند، و مسیر نشست
OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی پشت یک نوبت بومی کهنه
در صف نمانند.

بازنویسی‌های محیطی برای آزمون محلی همچنان در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم‌نشده باشد، `OPENCLAW_CODEX_APP_SERVER_BIN` باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا
برای آزمون محلی موردی از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. برای استقرارهای
تکرارپذیر، پیکربندی ترجیح داده می‌شود چون رفتار Plugin را در همان فایل
بازبینی‌شده‌ای نگه می‌دارد که بقیه راه‌اندازی harness Codex در آن قرار دارد.

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی خودش پوشش داده شده است:
[استفاده از رایانه با Codex](/fa/plugins/codex-computer-use).

نسخه کوتاه: OpenClaw برنامه کنترل دسکتاپ را در خود جای نمی‌دهد و خودش
اقدام‌های دسکتاپ را اجرا نمی‌کند. app-server مربوط به Codex را آماده می‌کند، بررسی می‌کند که
سرور MCP مربوط به `computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex فراخوانی‌های
ابزار MCP بومی را در طول نوبت‌های حالت Codex مدیریت کند.

برای دسترسی مستقیم به درایور TryCua خارج از جریان marketplace مربوط به Codex،
`cua-driver mcp` را با `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ثبت کنید.
برای تفاوت بین استفاده از رایانه تحت مالکیت Codex و ثبت مستقیم MCP، به
[استفاده از رایانه با Codex](/fa/plugins/codex-computer-use) مراجعه کنید.

پیکربندی حداقلی:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

راه‌اندازی را می‌توان از سطح فرمان بررسی یا نصب کرد:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

استفاده از رایانه ویژه macOS است و ممکن است پیش از اینکه
سرور MCP مربوط به Codex بتواند برنامه‌ها را کنترل کند، به مجوزهای محلی سیستم‌عامل نیاز داشته باشد. اگر `computerUse.enabled` برابر true باشد و سرور MCP
در دسترس نباشد، نوبت‌های حالت Codex پیش از شروع رشته شکست می‌خورند، به‌جای اینکه
بی‌صدا بدون ابزارهای بومی استفاده از رایانه اجرا شوند. برای گزینه‌های marketplace،
محدودیت‌های کاتالوگ راه‌دور، دلیل‌های وضعیت، و عیب‌یابی، به
[استفاده از رایانه با Codex](/fa/plugins/codex-computer-use) مراجعه کنید.

وقتی `computerUse.autoInstall` برابر true باشد، OpenClaw می‌تواند marketplace استاندارد
همراه Codex Desktop را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند، اگر Codex
هنوز یک marketplace محلی پیدا نکرده باشد. پس از تغییر پیکربندی زمان‌اجرای یا استفاده از رایانه،
از `/new` یا `/reset` استفاده کنید تا نشست‌های موجود یک اتصال قدیمی PI یا رشته Codex را نگه ندارند.

## دستورالعمل‌های رایج

Codex محلی با انتقال stdio پیش‌فرض:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

اعتبارسنجی harness فقط برای Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
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

تأییدهای Codex بازبینی‌شده توسط guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

app-server راه‌دور با سرآیندهای صریح:

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
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

تغییر مدل تحت کنترل OpenClaw باقی می‌ماند. وقتی یک نشست OpenClaw به یک رشته Codex موجود
متصل باشد، نوبت بعدی دوباره مدل OpenAI، ارائه‌دهنده، سیاست تأیید، سندباکس،
و سطح سرویسِ انتخاب‌شده فعلی را به app-server ارسال می‌کند. تغییر از
`openai/gpt-5.5` به `openai/gpt-5.2` اتصال رشته را حفظ می‌کند اما از Codex می‌خواهد
با مدل تازه انتخاب‌شده ادامه دهد.

## فرمان Codex

Plugin همراه، `/codex` را به‌عنوان یک فرمان اسلش مجاز ثبت می‌کند. این فرمان
عمومی است و روی هر کانالی که از فرمان‌های متنی OpenClaw پشتیبانی کند کار می‌کند.

شکل‌های رایج:

- `/codex status` اتصال زنده app-server، مدل‌ها، حساب، محدودیت‌های نرخ، سرورهای MCP، و Skills را نشان می‌دهد.
- `/codex models` مدل‌های زنده app-server مربوط به Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر Codex را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک رشته Codex موجود متصل می‌کند.
- `/codex compact` از app-server مربوط به Codex می‌خواهد رشته متصل را فشرده کند.
- `/codex review` بازبینی بومی Codex را برای رشته متصل شروع می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد تشخیصی Codex برای رشته متصل، درخواست تأیید می‌کند.
- `/codex computer-use status` Plugin پیکربندی‌شده استفاده از رایانه و سرور MCP را بررسی می‌کند.
- `/codex computer-use install` Plugin پیکربندی‌شده استفاده از رایانه را نصب می‌کند و سرورهای MCP را دوباره بارگذاری می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP مربوط به app-server در Codex را فهرست می‌کند.
- `/codex skills` مهارت‌های app-server مربوط به Codex را فهرست می‌کند.

### گردش‌کار رایج عیب‌یابی

وقتی یک عامل متکی به Codex در Telegram، Discord، Slack،
یا کانال دیگری کار غیرمنتظره‌ای انجام می‌دهد، از همان گفت‌وگویی شروع کنید که مشکل در آن رخ داده است:

1. `/diagnostics bad tool choice after image upload` یا یادداشت کوتاه دیگری را اجرا کنید
   که آنچه دیده‌اید را توصیف می‌کند.
2. درخواست تشخیص را یک بار تأیید کنید. این تأیید، فایل zip تشخیصی محلی Gateway را ایجاد می‌کند
   و چون نشست از harness مربوط به Codex استفاده می‌کند، بسته بازخورد مرتبط Codex را نیز
   به سرورهای OpenAI می‌فرستد.
3. پاسخ تشخیصی تکمیل‌شده را در گزارش خطا یا رشته پشتیبانی کپی کنید.
   این پاسخ شامل مسیر بسته محلی، خلاصه حریم خصوصی، شناسه‌های نشست OpenClaw،
   شناسه‌های رشته Codex، و یک خط `Inspect locally` برای هر رشته Codex است.
4. اگر می‌خواهید اجرا را خودتان عیب‌یابی کنید، فرمان چاپ‌شده `Inspect locally`
   را در ترمینال اجرا کنید. این فرمان شبیه `codex resume <thread-id>` است و
   رشته بومی Codex را باز می‌کند تا بتوانید گفت‌وگو را بررسی کنید، آن را به‌صورت محلی ادامه دهید،
   یا از Codex بپرسید چرا ابزار یا برنامه خاصی را انتخاب کرده است.

از `/codex diagnostics [note]` فقط زمانی استفاده کنید که مشخصا می‌خواهید بارگذاری بازخورد Codex برای رشته فعلی متصل انجام شود، بدون بسته کامل عیب‌یابی Gateway در OpenClaw. برای بیشتر گزارش‌های پشتیبانی، `/diagnostics [note]` نقطه شروع بهتری است، چون وضعیت Gateway محلی و شناسه‌های رشته Codex را در یک پاسخ به هم مرتبط می‌کند. برای مدل کامل حریم خصوصی و رفتار گفت‌وگوی گروهی، [صادرات عیب‌یابی](/fa/gateway/diagnostics) را ببینید.

هسته OpenClaw همچنین `/diagnostics [note]` مخصوص مالک را به‌عنوان فرمان عمومی عیب‌یابی Gateway ارائه می‌کند. پیام تأیید آن مقدمه داده‌های حساس را نشان می‌دهد، به [صادرات عیب‌یابی](/fa/gateway/diagnostics) پیوند می‌دهد، و هر بار از طریق تأیید اجرایی صریح، درخواست `openclaw gateway diagnostics export --json` می‌کند. عیب‌یابی را با قانون مجازسازی همگانی تأیید نکنید. پس از تأیید، OpenClaw گزارشی قابل چسباندن با مسیر بسته محلی و خلاصه manifest می‌فرستد. وقتی نشست فعال OpenClaw از چارچوب اجرایی Codex استفاده می‌کند، همان تأیید همچنین ارسال بسته‌های بازخورد مرتبط Codex به سرورهای OpenAI را مجاز می‌کند. پیام تأیید می‌گوید که بازخورد Codex ارسال خواهد شد، اما پیش از تأیید شناسه‌های نشست یا رشته Codex را فهرست نمی‌کند.

اگر `/diagnostics` توسط یک مالک در گفت‌وگوی گروهی فراخوانی شود، OpenClaw کانال مشترک را تمیز نگه می‌دارد: گروه فقط یک اعلان کوتاه دریافت می‌کند، در حالی که مقدمه عیب‌یابی، پیام‌های تأیید، و شناسه‌های نشست/رشته Codex از طریق مسیر تأیید خصوصی برای مالک فرستاده می‌شوند. اگر مسیر خصوصی مالک وجود نداشته باشد، OpenClaw درخواست گروهی را رد می‌کند و از مالک می‌خواهد آن را از یک پیام مستقیم اجرا کند.

بارگذاری تأییدشده Codex، `feedback/upload` در app-server Codex را فراخوانی می‌کند و از app-server می‌خواهد در صورت موجود بودن، گزارش‌ها را برای هر رشته فهرست‌شده و زیررشته‌های ایجادشده Codex شامل کند. این بارگذاری از مسیر عادی بازخورد Codex به سرورهای OpenAI عبور می‌کند؛ اگر بازخورد Codex در آن app-server غیرفعال باشد، فرمان خطای app-server را برمی‌گرداند. پاسخ کامل‌شده عیب‌یابی، کانال‌ها، شناسه‌های نشست OpenClaw، شناسه‌های رشته Codex، و فرمان‌های محلی `codex resume <thread-id>` را برای رشته‌هایی که ارسال شده‌اند فهرست می‌کند. اگر تأیید را رد یا نادیده بگیرید، OpenClaw آن شناسه‌های Codex را چاپ نمی‌کند. این بارگذاری جایگزین صادرات عیب‌یابی محلی Gateway نمی‌شود.

`/codex resume` همان فایل اتصال sidecar را می‌نویسد که چارچوب اجرایی برای نوبت‌های عادی استفاده می‌کند. در پیام بعدی، OpenClaw آن رشته Codex را از سر می‌گیرد، مدل فعلی انتخاب‌شده OpenClaw را به app-server می‌فرستد، و تاریخچه گسترده را فعال نگه می‌دارد.

### بررسی یک رشته Codex از CLI

سریع‌ترین راه برای فهمیدن یک اجرای بد Codex اغلب باز کردن مستقیم رشته بومی Codex است:

```sh
codex resume <thread-id>
```

از این زمانی استفاده کنید که در یک گفت‌وگوی کانالی متوجه باگی می‌شوید و می‌خواهید نشست مشکل‌دار Codex را بررسی کنید، آن را به‌صورت محلی ادامه دهید، یا از Codex بپرسید چرا یک ابزار یا انتخاب استدلال خاص انجام داده است. ساده‌ترین مسیر معمولا این است که ابتدا `/diagnostics [note]` را اجرا کنید: پس از تأیید، گزارش کامل‌شده هر رشته Codex را فهرست می‌کند و یک فرمان `Inspect locally` چاپ می‌کند، برای مثال `codex resume <thread-id>`. می‌توانید آن فرمان را مستقیما در ترمینال کپی کنید.

همچنین می‌توانید شناسه رشته را از `/codex binding` برای گفت‌وگوی فعلی یا از `/codex threads [filter]` برای رشته‌های اخیر app-server Codex بگیرید، سپس همان فرمان `codex resume` را در shell خود اجرا کنید.

سطح فرمان به app-server Codex نسخه `0.125.0` یا جدیدتر نیاز دارد. اگر یک app-server آینده یا سفارشی آن متد JSON-RPC را ارائه نکند، متدهای کنترلی جداگانه به‌صورت `unsupported by this Codex app-server` گزارش می‌شوند.

## مرزهای hook

چارچوب اجرایی Codex سه لایه hook دارد:

| لایه                                  | مالک                     | هدف                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| hookهای Plugin در OpenClaw            | OpenClaw                 | سازگاری محصول/Plugin در سراسر چارچوب‌های اجرایی PI و Codex.        |
| middleware افزونه app-server Codex    | Pluginهای همراه OpenClaw | رفتار آداپتور در هر نوبت پیرامون ابزارهای پویای OpenClaw.          |
| hookهای بومی Codex                    | Codex                    | چرخه عمر سطح پایین Codex و سیاست ابزار بومی از پیکربندی Codex.    |

OpenClaw از فایل‌های پروژه‌ای یا سراسری `hooks.json` در Codex برای مسیریابی رفتار Pluginهای OpenClaw استفاده نمی‌کند. برای پل ابزار بومی و مجوز پشتیبانی‌شده، OpenClaw پیکربندی Codex در هر رشته را برای `PreToolUse`، `PostToolUse`، `PermissionRequest`، و `Stop` تزریق می‌کند. دیگر hookهای Codex مانند `SessionStart` و `UserPromptSubmit` همچنان کنترل‌های سطح Codex باقی می‌مانند؛ آن‌ها در قرارداد v1 به‌عنوان hookهای Plugin در OpenClaw ارائه نمی‌شوند.

برای ابزارهای پویای OpenClaw، OpenClaw ابزار را پس از درخواست فراخوانی توسط Codex اجرا می‌کند، بنابراین OpenClaw رفتار Plugin و middleware تحت مالکیت خود را در آداپتور چارچوب اجرایی اجرا می‌کند. برای ابزارهای بومی Codex، Codex مالک رکورد مرجع ابزار است. OpenClaw می‌تواند رویدادهای منتخب را بازتاب دهد، اما نمی‌تواند رشته بومی Codex را بازنویسی کند مگر اینکه Codex آن عملیات را از طریق app-server یا callbackهای hook بومی ارائه کند.

تصویرسازی‌های Compaction و چرخه عمر LLM از اعلان‌های app-server Codex و وضعیت آداپتور OpenClaw می‌آیند، نه از فرمان‌های hook بومی Codex. رویدادهای `before_compaction`، `after_compaction`، `llm_input`، و `llm_output` در OpenClaw مشاهده‌های سطح آداپتور هستند، نه ضبط بایت‌به‌بایت درخواست داخلی یا payloadهای Compaction در Codex.

اعلان‌های app-server مربوط به `hook/started` و `hook/completed` بومی Codex به‌عنوان رویدادهای عامل `codex_app_server.hook` برای مسیر اجرا و اشکال‌زدایی تصویرسازی می‌شوند. آن‌ها hookهای Plugin در OpenClaw را فراخوانی نمی‌کنند.

## قرارداد پشتیبانی V1

حالت Codex همان PI با یک فراخوانی مدل متفاوت در زیر آن نیست. Codex مالک بخش بیشتری از حلقه مدل بومی است، و OpenClaw سطوح Plugin و نشست خود را پیرامون آن مرز تطبیق می‌دهد.

پشتیبانی‌شده در runtime v1 Codex:

| سطح                                          | پشتیبانی                               | چرا                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حلقه مدل OpenAI از طریق Codex                 | پشتیبانی‌شده                           | app-server Codex مالک نوبت OpenAI، ازسرگیری رشته بومی، و ادامه ابزار بومی است.                                                                                                                      |
| مسیریابی و تحویل کانال در OpenClaw            | پشتیبانی‌شده                           | Telegram، Discord، Slack، WhatsApp، iMessage، و کانال‌های دیگر بیرون از runtime مدل می‌مانند.                                                                                                      |
| ابزارهای پویای OpenClaw                       | پشتیبانی‌شده                           | Codex از OpenClaw می‌خواهد این ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.                                                                                                   |
| Pluginهای prompt و زمینه                      | پشتیبانی‌شده                           | OpenClaw همپوشان‌های prompt را می‌سازد و پیش از شروع یا ازسرگیری رشته، زمینه را به نوبت Codex تصویرسازی می‌کند.                                                                                   |
| چرخه عمر موتور زمینه                          | پشتیبانی‌شده                           | گردآوری، دریافت یا نگهداری پس از نوبت، و هماهنگی Compaction موتور زمینه برای نوبت‌های Codex اجرا می‌شوند.                                                                                        |
| hookهای ابزار پویا                            | پشتیبانی‌شده                           | `before_tool_call`، `after_tool_call`، و middleware نتیجه ابزار پیرامون ابزارهای پویای تحت مالکیت OpenClaw اجرا می‌شوند.                                                                           |
| hookهای چرخه عمر                              | به‌عنوان مشاهده‌های آداپتور پشتیبانی‌شده | `llm_input`، `llm_output`، `agent_end`، `before_compaction`، و `after_compaction` با payloadهای صادقانه حالت Codex اجرا می‌شوند.                                                                  |
| دروازه بازبینی پاسخ نهایی                     | پشتیبانی‌شده از طریق relay hook بومی   | `Stop` در Codex به `before_agent_finalize` relay می‌شود؛ `revise` از Codex می‌خواهد پیش از نهایی‌سازی یک گذر مدل دیگر انجام دهد.                                                                 |
| shell، patch، و MCP بومی برای مسدودسازی یا مشاهده | پشتیبانی‌شده از طریق relay hook بومی   | `PreToolUse` و `PostToolUse` در Codex برای سطوح ابزار بومی commitشده، شامل payloadهای MCP روی app-server Codex نسخه `0.125.0` یا جدیدتر، relay می‌شوند. مسدودسازی پشتیبانی می‌شود؛ بازنویسی آرگومان پشتیبانی نمی‌شود. |
| سیاست مجوز بومی                              | پشتیبانی‌شده از طریق relay hook بومی   | `PermissionRequest` در Codex می‌تواند در جایی که runtime آن را ارائه می‌کند، از طریق سیاست OpenClaw مسیریابی شود. اگر OpenClaw تصمیمی برنگرداند، Codex از مسیر عادی guardian یا تأیید کاربر خود ادامه می‌دهد. |
| ضبط مسیر اجرای app-server                    | پشتیبانی‌شده                           | OpenClaw درخواستی را که به app-server فرستاده و اعلان‌های app-server را که دریافت می‌کند ثبت می‌کند.                                                                                              |

پشتیبانی‌نشده در runtime v1 Codex:

| سطح                                             | مرز V1                                                                                                                                     | مسیر آینده                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| تغییر آرگومان ابزار بومی Native                       | هوک‌های پیش از ابزار بومی Codex می‌توانند مسدود کنند، اما OpenClaw آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند.                                               | به پشتیبانی هوک/اسکیمای Codex برای جایگزینی ورودی ابزار نیاز دارد.                            |
| تاریخچه قابل ویرایش transcript بومی Codex            | Codex مالک تاریخچه رسمی thread بومی است. OpenClaw مالک یک آینه است و می‌تواند context آینده را طرح‌ریزی کند، اما نباید داخلی‌های پشتیبانی‌نشده را تغییر دهد. | اگر جراحی thread بومی لازم باشد، APIهای صریح app-server در Codex اضافه شود.                    |
| `tool_result_persist` برای رکوردهای ابزار بومی Codex | آن هوک نوشتن‌های transcript متعلق به OpenClaw را تبدیل می‌کند، نه رکوردهای ابزار بومی Codex را.                                                           | می‌تواند رکوردهای تبدیل‌شده را آینه کند، اما بازنویسی رسمی به پشتیبانی Codex نیاز دارد.              |
| فراداده غنی برای compaction بومی                     | OpenClaw شروع و تکمیل compaction را مشاهده می‌کند، اما فهرست پایدار نگه‌داشته‌شده/حذف‌شده، دلتا توکن، یا payload خلاصه دریافت نمی‌کند.            | به رویدادهای compaction غنی‌تر Codex نیاز دارد.                                                     |
| مداخله در Compaction                             | هوک‌های فعلی compaction در OpenClaw در حالت Codex در سطح اعلان هستند.                                                                         | اگر plugins باید compaction بومی را وتو یا بازنویسی کنند، هوک‌های پیش/پس از compaction در Codex اضافه شود. |
| ضبط byte-for-byte درخواست API مدل             | OpenClaw می‌تواند درخواست‌ها و اعلان‌های app-server را ضبط کند، اما هسته Codex درخواست نهایی OpenAI API را به‌صورت داخلی می‌سازد.                      | به یک رویداد ردگیری درخواست مدل در Codex یا API اشکال‌زدایی نیاز دارد.                                   |

## ابزارها، رسانه، و compaction

هارنس Codex فقط اجراکننده عامل embedded سطح پایین را تغییر می‌دهد.

OpenClaw همچنان فهرست ابزارها را می‌سازد و نتایج ابزار پویا را از
هارنس دریافت می‌کند. متن، تصویرها، ویدئو، موسیقی، TTS، تأییدها، و خروجی ابزارهای پیام‌رسانی
از مسیر معمول تحویل OpenClaw ادامه می‌یابند.

رله هوک بومی عمداً عمومی است، اما قرارداد پشتیبانی v1
به مسیرهای ابزار و مجوز بومی Codex که OpenClaw تست می‌کند محدود است. در
runtime Codex، این شامل payloadهای shell، patch، و MCP `PreToolUse`،
`PostToolUse`، و `PermissionRequest` است. فرض نکنید هر رویداد هوک آینده
Codex یک سطح Plugin در OpenClaw است مگر اینکه قرارداد runtime آن را نام ببرد.

برای `PermissionRequest`، OpenClaw فقط وقتی policy تصمیم می‌گیرد، تصمیم‌های صریح allow یا deny
برمی‌گرداند. نتیجه بدون تصمیم allow نیست. Codex آن را به‌عنوان نبود تصمیم هوک
در نظر می‌گیرد و به مسیر guardian یا تأیید کاربر خودش می‌افتد.

درخواست‌های تأیید ابزار MCP در Codex از مسیر جریان تأیید Plugin در OpenClaw
هدایت می‌شوند وقتی Codex مقدار `_meta.codex_approval_kind` را
`"mcp_tool_call"` علامت‌گذاری کند. promptهای `request_user_input` در Codex به
چت مبدأ بازگردانده می‌شوند، و پیام follow-up بعدی در صف به‌جای اینکه به‌عنوان context اضافی
هدایت شود، به آن درخواست server بومی پاسخ می‌دهد. سایر درخواست‌های elicitation در MCP
همچنان fail closed می‌شوند.

هدایت صف اجرای فعال روی `turn/steer` در app-server Codex نگاشت می‌شود. با
پیش‌فرض `messages.queue.mode: "steer"`، OpenClaw پیام‌های چت صف‌شده را
برای پنجره سکوت پیکربندی‌شده دسته‌بندی می‌کند و آن‌ها را به‌ترتیب ورود به‌صورت یک درخواست `turn/steer`
می‌فرستد. حالت قدیمی `queue` درخواست‌های جداگانه `turn/steer` می‌فرستد. نوبت‌های
review و compaction دستی در Codex می‌توانند هدایت same-turn را رد کنند، که در این صورت
OpenClaw وقتی حالت انتخاب‌شده اجازه fallback می‌دهد از صف followup استفاده می‌کند. ببینید
[صف هدایت](/fa/concepts/queue-steering).

وقتی مدل انتخاب‌شده از هارنس Codex استفاده می‌کند، compaction thread بومی به
app-server Codex واگذار می‌شود. OpenClaw برای تاریخچه کانال،
جست‌وجو، `/new`، `/reset`، و تغییر مدل یا هارنس در آینده یک آینه transcript نگه می‌دارد. این
آینه شامل prompt کاربر، متن نهایی assistant، و رکوردهای سبک reasoning یا plan در Codex
است وقتی app-server آن‌ها را منتشر کند. امروز، OpenClaw فقط سیگنال‌های شروع و تکمیل
compaction بومی را ثبت می‌کند. هنوز خلاصه‌ای خوانا برای انسان از compaction یا فهرستی قابل ممیزی از اینکه Codex
پس از compaction کدام ورودی‌ها را نگه داشته است ارائه نمی‌کند.

چون Codex مالک thread بومی رسمی است، `tool_result_persist` در حال حاضر
رکوردهای نتیجه ابزار بومی Codex را بازنویسی نمی‌کند. این فقط وقتی اعمال می‌شود که
OpenClaw در حال نوشتن نتیجه ابزار transcript یک session متعلق به OpenClaw باشد.

تولید رسانه به PI نیاز ندارد. تصویر، ویدئو، موسیقی، PDF، TTS، و فهم رسانه
همچنان از تنظیمات provider/model متناظر مانند
`agents.defaults.imageGenerationModel`، `videoGenerationModel`، `pdfModel`، و
`messages.tts` استفاده می‌کنند.

## عیب‌یابی

**Codex به‌عنوان یک provider معمولی `/model` ظاهر نمی‌شود:** این برای
پیکربندی‌های جدید مورد انتظار است. یک مدل `openai/gpt-*` با
`agentRuntime.id: "codex"` (یا یک ref قدیمی `codex/*`) انتخاب کنید،
`plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید آیا `plugins.allow`
مقدار `codex` را مستثنی کرده است.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** `agentRuntime.id: "auto"` هنوز می‌تواند از PI به‌عنوان
backend سازگاری استفاده کند وقتی هیچ هارنس Codex اجرای مورد نظر را claim نکند. برای اجبار انتخاب Codex
هنگام تست، `agentRuntime.id: "codex"` را تنظیم کنید. runtime اجباری Codex
اکنون به‌جای fallback به PI شکست می‌خورد مگر اینکه به‌صراحت
`agentRuntime.fallback: "pi"` را تنظیم کنید. وقتی app-server Codex
انتخاب شد، شکست‌های آن مستقیماً بدون پیکربندی fallback اضافی نمایش داده می‌شوند.

**app-server رد می‌شود:** Codex را ارتقا دهید تا handshake در app-server
نسخه `0.125.0` یا جدیدتر را گزارش کند. prereleaseهای همان نسخه یا نسخه‌های دارای پسوند build
مانند `0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون کف پروتکل پایدار
`0.125.0` همان چیزی است که OpenClaw تست می‌کند.

**کشف مدل کند است:** مقدار `plugins.entries.codex.config.discovery.timeoutMs` را کاهش دهید
یا discovery را غیرفعال کنید.

**transport WebSocket بلافاصله شکست می‌خورد:** `appServer.url`، `authToken`،
و اینکه app-server راه‌دور همان نسخه پروتکل app-server در Codex را صحبت می‌کند بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این مورد انتظار است مگر اینکه برای آن agent
`agentRuntime.id: "codex"` را اجباری کرده باشید یا یک ref قدیمی
`codex/*` انتخاب کرده باشید. refهای ساده `openai/gpt-*` و سایر providerها در حالت
`auto` روی مسیر provider معمول خودشان می‌مانند. اگر `agentRuntime.id: "codex"` را اجبار کنید، هر turn embedded
برای آن agent باید یک مدل OpenAI پشتیبانی‌شده توسط Codex باشد.

**Computer Use نصب است اما ابزارها اجرا نمی‌شوند:** از یک session تازه
`/codex computer-use status` را بررسی کنید. اگر ابزاری
`Native hook relay unavailable` گزارش داد، از `/new` یا `/reset` استفاده کنید؛ اگر ادامه داشت، Gateway را restart کنید
تا ثبت‌نام‌های هوک بومی stale پاک شوند. اگر `computer-use.list_apps`
timeout شد، Codex Computer Use یا Codex Desktop را restart کنید و دوباره تلاش کنید.

## مرتبط

- [Pluginهای هارنس عامل](/fa/plugins/sdk-agent-harness)
- [runtimeهای عامل](/fa/concepts/agent-runtimes)
- [providerهای مدل](/fa/concepts/model-providers)
- [provider OpenAI](/fa/providers/openai)
- [وضعیت](/fa/cli/status)
- [هوک‌های Plugin](/fa/plugins/hooks)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [تست](/fa/help/testing-live#live-codex-app-server-harness-smoke)

---
read_when:
    - می‌خواهید از چارچوب همراهِ برنامه-سرور Codex استفاده کنید
    - به نمونه‌های پیکربندی هارنس Codex نیاز دارید
    - می‌خواهید استقرارهای مختص Codex به‌جای بازگشت به PI ناموفق شوند
summary: نوبت‌های عامل تعبیه‌شدهٔ OpenClaw را از طریق سازوکار app-server همراه Codex اجرا کنید
title: هارنس Codex
x-i18n:
    generated_at: "2026-04-30T09:39:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw اجازه می‌دهد نوبت‌های عامل جاسازی‌شده را از طریق
اپ‌سرور Codex به‌جای مهار PI داخلی اجرا کند.

از این گزینه زمانی استفاده کنید که می‌خواهید Codex مالک نشست سطح‌پایین عامل باشد: کشف مدل،
ازسرگیری بومی thread، Compaction بومی، و اجرای اپ‌سرور.
OpenClaw همچنان مالک کانال‌های گفتگو، فایل‌های نشست، انتخاب مدل، ابزارها،
تأییدها، تحویل رسانه، و آینه transcript قابل مشاهده است.

اگر می‌خواهید مسیر را پیدا کنید، از
[زمان‌اجرای عامل‌ها](/fa/concepts/agent-runtimes) شروع کنید. نسخه کوتاه این است:
`openai/gpt-5.5` مرجع مدل است، `codex` runtime است، و Telegram،
Discord، Slack، یا کانال دیگری همچنان سطح ارتباطی باقی می‌ماند.

## این Plugin چه چیزی را تغییر می‌دهد

Plugin همراه `codex` چند قابلیت جداگانه اضافه می‌کند:

| قابلیت                          | چگونه از آن استفاده می‌کنید                         | چه کاری انجام می‌دهد                                                            |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| runtime جاسازی‌شده بومی           | `agentRuntime.id: "codex"`                          | نوبت‌های عامل جاسازی‌شده OpenClaw را از طریق اپ‌سرور Codex اجرا می‌کند.      |
| فرمان‌های کنترل گفتگوی بومی       | `/codex bind`, `/codex resume`, `/codex steer`, ... | threadهای اپ‌سرور Codex را از یک گفتگوی پیام‌رسانی متصل و کنترل می‌کند.      |
| ارائه‌دهنده/کاتالوگ اپ‌سرور Codex | درونی‌های `codex`، ارائه‌شده از طریق مهار           | به runtime اجازه می‌دهد مدل‌های اپ‌سرور را کشف و اعتبارسنجی کند.              |
| مسیر درک رسانه Codex              | مسیرهای سازگاری مدل تصویر `codex/*`                | نوبت‌های محدود اپ‌سرور Codex را برای مدل‌های پشتیبانی‌شده درک تصویر اجرا می‌کند. |
| بازپخش hook بومی                 | hookهای Plugin پیرامون رویدادهای بومی Codex         | به OpenClaw اجازه می‌دهد رویدادهای ابزار/نهایی‌سازی بومی Codex پشتیبانی‌شده را مشاهده/مسدود کند. |

فعال‌کردن Plugin این قابلیت‌ها را در دسترس قرار می‌دهد. این کار **موارد زیر را انجام نمی‌دهد**:

- شروع استفاده از Codex برای هر مدل OpenAI
- تبدیل مرجع‌های مدل `openai-codex/*` به runtime بومی
- پیش‌فرض‌کردن ACP/acpx به‌عنوان مسیر Codex
- تغییر داغ نشست‌های موجود که از قبل runtime مربوط به PI را ثبت کرده‌اند
- جایگزینی تحویل کانال OpenClaw، فایل‌های نشست، ذخیره‌سازی auth-profile، یا
  مسیریابی پیام

همین Plugin همچنین سطح فرمان کنترل گفتگوی بومی `/codex` را مالک است. اگر
Plugin فعال باشد و کاربر بخواهد threadهای Codex را از گفتگو bind، resume، steer، stop، یا inspect کند،
عامل‌ها باید `/codex ...` را به ACP ترجیح دهند. ACP زمانی fallback صریح باقی می‌ماند
که کاربر ACP/acpx را بخواهد یا در حال آزمایش adapter
Codex مربوط به ACP باشد.

نوبت‌های بومی Codex hookهای Plugin در OpenClaw را به‌عنوان لایه سازگاری عمومی حفظ می‌کنند.
این‌ها hookهای درون‌فرایندی OpenClaw هستند، نه hookهای فرمان Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` برای رکوردهای transcript آینه‌شده
- `before_agent_finalize` از طریق بازپخش Codex `Stop`
- `agent_end`

Pluginها همچنین می‌توانند middleware نتیجه ابزار بی‌طرف نسبت به runtime ثبت کنند تا
نتایج ابزار پویا در OpenClaw را پس از اجرای ابزار توسط OpenClaw و پیش از
بازگرداندن نتیجه به Codex بازنویسی کنند. این مورد از hook عمومی Plugin با نام
`tool_result_persist` جدا است؛ آن hook نوشتن‌های نتیجه ابزار transcript تحت مالکیت OpenClaw را
تبدیل می‌کند.

برای معناشناسی خود hookهای Plugin، [hookهای Plugin](/fa/plugins/hooks)
و [رفتار guard در Plugin](/fa/tools/plugin) را ببینید.

مهار به‌صورت پیش‌فرض خاموش است. پیکربندی‌های جدید باید مرجع‌های مدل OpenAI را
به‌شکل canonical یعنی `openai/gpt-*` نگه دارند و زمانی که
اجرای بومی اپ‌سرور را می‌خواهند، به‌صراحت
`agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex` را تحمیل کنند.
مرجع‌های مدل قدیمی `codex/*` همچنان برای سازگاری مهار را به‌صورت خودکار انتخاب می‌کنند،
اما پیشوندهای قدیمی ارائه‌دهنده که پشتوانه runtime دارند به‌عنوان انتخاب‌های عادی مدل/ارائه‌دهنده
نمایش داده نمی‌شوند.

اگر Plugin `codex` فعال باشد اما مدل اصلی همچنان
`openai-codex/*` باشد، `openclaw doctor` به‌جای تغییر مسیر هشدار می‌دهد. این
عمدی است: `openai-codex/*` همچنان مسیر OAuth/اشتراک Codex مربوط به PI باقی می‌ماند، و
اجرای بومی اپ‌سرور یک انتخاب صریح runtime می‌ماند.

## نقشه مسیر

پیش از تغییر پیکربندی از این جدول استفاده کنید:

| رفتار مطلوب                                  | مرجع مدل                  | پیکربندی runtime                     | نیازمندی Plugin             | برچسب وضعیت مورد انتظار        |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| API متعلق به OpenAI از طریق runner عادی OpenClaw | `openai/gpt-*`             | حذف‌شده یا `runtime: "pi"`             | ارائه‌دهنده OpenAI          | `Runtime: OpenClaw Pi Default` |
| OAuth/اشتراک Codex از طریق PI               | `openai-codex/gpt-*`       | حذف‌شده یا `runtime: "pi"`             | ارائه‌دهنده OAuth مربوط به OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| نوبت‌های جاسازی‌شده بومی اپ‌سرور Codex      | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| ارائه‌دهنده‌های ترکیبی با حالت خودکار محافظه‌کارانه | مرجع‌های مختص ارائه‌دهنده  | `agentRuntime.id: "auto"`              | runtimeهای Plugin اختیاری   | به runtime انتخاب‌شده بستگی دارد |
| نشست صریح adapter مربوط به Codex ACP        | وابسته به prompt/model در ACP | `sessions_spawn` با `runtime: "acp"` | backend سالم `acpx`         | وضعیت وظیفه/نشست ACP           |

تفکیک مهم بین ارائه‌دهنده و runtime است:

- `openai-codex/*` پاسخ می‌دهد «PI باید از کدام مسیر ارائه‌دهنده/احراز هویت استفاده کند؟»
- `agentRuntime.id: "codex"` پاسخ می‌دهد «کدام حلقه باید این
  نوبت جاسازی‌شده را اجرا کند؟»
- `/codex ...` پاسخ می‌دهد «این گفتگو باید به کدام گفتگوی بومی Codex متصل شود
  یا آن را کنترل کند؟»
- ACP پاسخ می‌دهد «acpx باید کدام فرایند مهار خارجی را راه‌اندازی کند؟»

## پیشوند مدل درست را انتخاب کنید

مسیرهای خانواده OpenAI وابسته به پیشوند هستند. زمانی از `openai-codex/*` استفاده کنید که
OAuth مربوط به Codex را از طریق PI می‌خواهید؛ زمانی از `openai/*` استفاده کنید که دسترسی مستقیم به API
OpenAI را می‌خواهید یا زمانی که مهار بومی اپ‌سرور Codex را تحمیل می‌کنید:

| مرجع مدل                                      | مسیر runtime                                 | زمان استفاده                                                               |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | ارائه‌دهنده OpenAI از طریق لوله‌کشی OpenClaw/PI | دسترسی مستقیم فعلی به API پلتفرم OpenAI با `OPENAI_API_KEY` را می‌خواهید. |
| `openai-codex/gpt-5.5`                        | OAuth مربوط به OpenAI Codex از طریق OpenClaw/PI | احراز هویت اشتراک ChatGPT/Codex را با runner پیش‌فرض PI می‌خواهید.       |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | مهار اپ‌سرور Codex                           | اجرای بومی اپ‌سرور Codex را برای نوبت عامل جاسازی‌شده می‌خواهید.         |

GPT-5.5 در حال حاضر در OpenClaw فقط از طریق اشتراک/OAuth در دسترس است. برای OAuth مربوط به PI از
`openai-codex/gpt-5.5` استفاده کنید، یا از `openai/gpt-5.5` همراه با مهار اپ‌سرور
Codex استفاده کنید. دسترسی مستقیم با کلید API برای `openai/gpt-5.5` زمانی پشتیبانی می‌شود
که OpenAI مدل GPT-5.5 را روی API عمومی فعال کند.

مرجع‌های قدیمی `codex/gpt-*` همچنان به‌عنوان aliasهای سازگاری پذیرفته می‌شوند. مهاجرت
سازگاری doctor مرجع‌های runtime اصلی قدیمی را به مرجع‌های مدل canonical بازنویسی می‌کند
و سیاست runtime را جداگانه ثبت می‌کند، درحالی‌که مرجع‌های قدیمی فقط fallback
بدون تغییر باقی می‌مانند، چون runtime برای کل container عامل پیکربندی می‌شود.
پیکربندی‌های جدید OAuth مربوط به PI Codex باید از `openai-codex/gpt-*` استفاده کنند؛ پیکربندی‌های جدید مهار
بومی اپ‌سرور باید از `openai/gpt-*` به‌همراه
`agentRuntime.id: "codex"` استفاده کنند.

`agents.defaults.imageModel` از همین تفکیک پیشوند پیروی می‌کند. زمانی از
`openai-codex/gpt-*` استفاده کنید که درک تصویر باید از مسیر ارائه‌دهنده OAuth مربوط به OpenAI
Codex اجرا شود. زمانی از `codex/gpt-*` استفاده کنید که درک تصویر باید
از طریق یک نوبت محدود اپ‌سرور Codex اجرا شود. مدل اپ‌سرور Codex باید
پشتیبانی ورودی تصویر را advertise کند؛ مدل‌های فقط متنی Codex پیش از شروع نوبت رسانه
fail می‌شوند.

برای تأیید مهار مؤثر برای نشست فعلی از `/status` استفاده کنید. اگر
انتخاب غافلگیرکننده است، debug logging را برای زیرسیستم `agents/harness` فعال کنید
و رکورد ساخت‌یافته `agent harness selected` مربوط به Gateway را بررسی کنید. این رکورد
شناسه مهار انتخاب‌شده، دلیل انتخاب، سیاست runtime/fallback، و در حالت `auto`،
نتیجه پشتیبانی هر candidate Plugin را شامل می‌شود.

### هشدارهای doctor چه معنایی دارند

`openclaw doctor` زمانی هشدار می‌دهد که همه موارد زیر درست باشند:

- Plugin همراه `codex` فعال یا مجاز باشد
- مدل اصلی یک عامل `openai-codex/*` باشد
- runtime مؤثر آن عامل `codex` نباشد

این هشدار وجود دارد چون کاربران اغلب انتظار دارند «Plugin مربوط به Codex فعال است» به‌معنای
«runtime بومی اپ‌سرور Codex» باشد. OpenClaw چنین جهشی انجام نمی‌دهد. معنای هشدار
این است:

- اگر OAuth مربوط به ChatGPT/Codex از طریق PI را قصد داشتید، **هیچ تغییری لازم نیست**.
- اگر اجرای بومی اپ‌سرور را قصد داشتید، مدل را به `openai/<model>` تغییر دهید و
  `agentRuntime.id: "codex"` را تنظیم کنید.
- نشست‌های موجود پس از تغییر runtime همچنان به `/new` یا `/reset` نیاز دارند،
  چون pinهای runtime نشست چسبنده هستند.

انتخاب مهار یک کنترل زنده نشست نیست. وقتی یک نوبت جاسازی‌شده اجرا می‌شود،
OpenClaw شناسه مهار انتخاب‌شده را روی آن نشست ثبت می‌کند و برای
نوبت‌های بعدی در همان شناسه نشست همچنان از آن استفاده می‌کند. زمانی که می‌خواهید نشست‌های آینده از مهار دیگری استفاده کنند،
پیکربندی `agentRuntime` یا `OPENCLAW_AGENT_RUNTIME` را تغییر دهید؛
برای شروع یک نشست تازه پیش از جابه‌جایی یک گفتگوی موجود
بین PI و Codex، از `/new` یا `/reset` استفاده کنید. این کار از بازپخش یک transcript
از طریق دو سیستم نشست بومی ناسازگار جلوگیری می‌کند.

نشست‌های قدیمی ایجادشده پیش از pinهای مهار، پس از داشتن تاریخچه transcript به‌عنوان PI-pinned
در نظر گرفته می‌شوند. پس از تغییر پیکربندی، برای واردکردن آن گفتگو به Codex از
`/new` یا `/reset` استفاده کنید.

`/status` runtime مؤثر مدل را نشان می‌دهد. مهار پیش‌فرض PI به‌صورت
`Runtime: OpenClaw Pi Default` ظاهر می‌شود، و مهار اپ‌سرور Codex به‌صورت
`Runtime: OpenAI Codex` ظاهر می‌شود.

## نیازمندی‌ها

- OpenClaw با Plugin همراه `codex` در دسترس.
- اپ‌سرور Codex نسخه `0.125.0` یا جدیدتر. Plugin همراه به‌صورت پیش‌فرض یک
  باینری سازگار اپ‌سرور Codex را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex` روی `PATH`
  بر راه‌اندازی عادی مهار اثر نمی‌گذارند.
- احراز هویت Codex در دسترس فرایند اپ‌سرور یا bridge احراز هویت Codex در OpenClaw باشد.

Plugin handshakeهای اپ‌سرور قدیمی‌تر یا بدون نسخه را مسدود می‌کند. این کار
OpenClaw را روی سطح پروتکلی نگه می‌دارد که در برابر آن آزمایش شده است.

برای تست‌های smoke زنده و Docker، احراز هویت معمولاً از حساب CLI مربوط به Codex
یا یک پروفایل احراز هویت `openai-codex` در OpenClaw می‌آید. راه‌اندازی‌های محلی اپ‌سرور stdio نیز
وقتی هیچ حسابی موجود نباشد می‌توانند به `CODEX_API_KEY` / `OPENAI_API_KEY` fallback کنند.

## پیکربندی حداقلی

از `openai/gpt-5.5` استفاده کنید، Plugin همراه را فعال کنید، و مهار `codex` را تحمیل کنید:

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

اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را آنجا هم include کنید:

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
`codex/<model>` تنظیم می‌کنند همچنان Plugin همراه `codex` را به‌صورت خودکار فعال می‌کنند. پیکربندی‌های جدید باید
`openai/<model>` را به‌همراه ورودی صریح `agentRuntime` در بالا ترجیح دهند.

## افزودن Codex در کنار مدل‌های دیگر

اگر همان عامل باید آزادانه بین مدل‌های ارائه‌دهنده Codex و غیر Codex جابه‌جا شود،
`agentRuntime.id: "codex"` را به‌صورت سراسری تنظیم نکنید. یک runtime تحمیلی روی هر
نوبت جاسازی‌شده برای آن عامل یا نشست اعمال می‌شود. اگر درحالی‌که
آن runtime تحمیل شده است یک مدل Anthropic انتخاب کنید، OpenClaw همچنان مهار Codex را امتحان می‌کند و به‌جای
مسیریابی بی‌صدای آن نوبت از طریق PI، به‌صورت fail closed عمل می‌کند.

در عوض از یکی از این ساختارها استفاده کنید:

- Codex را روی یک عامل اختصاصی با `agentRuntime.id: "codex"` قرار دهید.
- عامل پیش‌فرض را روی `agentRuntime.id: "auto"` و بازگشت PI برای استفاده معمول ترکیبی از
  ارائه‌دهنده‌ها نگه دارید.
- ارجاع‌های قدیمی `codex/*` را فقط برای سازگاری استفاده کنید. پیکربندی‌های جدید باید
  `openai/*` به‌همراه یک سیاست runtime صریح Codex را ترجیح دهند.

برای مثال، این پیکربندی عامل پیش‌فرض را روی انتخاب خودکار معمول نگه می‌دارد و
یک عامل جداگانه Codex اضافه می‌کند:

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

با این ساختار:

- عامل پیش‌فرض `main` از مسیر معمول ارائه‌دهنده و بازگشت سازگاری PI استفاده می‌کند.
- عامل `codex` از هارنس سرور برنامه Codex استفاده می‌کند.
- اگر Codex برای عامل `codex` وجود نداشته باشد یا پشتیبانی نشود، نوبت شکست می‌خورد
  به‌جای اینکه بی‌صدا از PI استفاده کند.

## مسیریابی فرمان عامل

عامل‌ها باید درخواست‌های کاربر را بر اساس قصد مسیریابی کنند، نه صرفاً بر اساس واژه "Codex":

| کاربر درخواست می‌کند...                                  | عامل باید استفاده کند...                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| "این گفتگو را به Codex متصل کن"                         | `/codex bind`                                    |
| "رشته Codex با شناسه `<id>` را اینجا از سر بگیر"        | `/codex resume <id>`                             |
| "رشته‌های Codex را نشان بده"                            | `/codex threads`                                 |
| "یک گزارش پشتیبانی برای اجرای بد Codex ثبت کن"          | `/diagnostics [note]`                            |
| "فقط برای این رشته پیوست‌شده بازخورد Codex بفرست"       | `/codex diagnostics [note]`                      |
| "از Codex به‌عنوان runtime این عامل استفاده کن"          | تغییر پیکربندی در `agentRuntime.id`              |
| "از اشتراک ChatGPT/Codex من با OpenClaw معمولی استفاده کن" | ارجاع‌های مدل `openai-codex/*`                   |
| "Codex را از طریق ACP/acpx اجرا کن"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Claude Code/Gemini/OpenCode/Cursor را در یک رشته شروع کن" | ACP/acpx، نه `/codex` و نه زیرعامل‌های بومی      |

OpenClaw راهنمایی ایجاد ACP را فقط زمانی به عامل‌ها اعلام می‌کند که ACP فعال،
قابل ارسال، و توسط یک بک‌اند runtime بارگذاری‌شده پشتیبانی شده باشد. اگر ACP در دسترس نباشد،
پرامپت سیستم و Skills افزونه نباید به عامل درباره مسیریابی ACP آموزش دهند.

## استقرارهای فقط Codex

وقتی باید ثابت کنید که هر نوبت عامل جاسازی‌شده از Codex استفاده می‌کند،
هارنس Codex را اجباری کنید. runtimeهای Plugin صریح به‌طور پیش‌فرض بازگشت PI ندارند، بنابراین
`fallback: "none"` اختیاری است اما اغلب به‌عنوان مستندسازی مفید است:

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

وقتی Codex اجباری باشد، OpenClaw اگر Plugin Codex غیرفعال باشد، سرور برنامه
بیش از حد قدیمی باشد، یا سرور برنامه نتواند شروع شود، زود شکست می‌خورد. فقط زمانی
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` را تنظیم کنید که عمداً می‌خواهید PI انتخاب
هارنسِ موجودنبودن را مدیریت کند.

## Codex برای هر عامل

می‌توانید یک عامل را فقط Codex کنید در حالی که عامل پیش‌فرض انتخاب خودکار معمول را نگه می‌دارد:

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

برای جابه‌جایی عامل‌ها و مدل‌ها از فرمان‌های معمول نشست استفاده کنید. `/new` یک
نشست تازه OpenClaw می‌سازد و هارنس Codex در صورت نیاز رشته جانبی سرور برنامه خود
را می‌سازد یا از سر می‌گیرد. `/reset` اتصال نشست OpenClaw را برای آن رشته پاک می‌کند
و اجازه می‌دهد نوبت بعدی دوباره هارنس را از پیکربندی فعلی حل کند.

## کشف مدل

به‌طور پیش‌فرض، Plugin Codex از سرور برنامه مدل‌های موجود را می‌پرسد. اگر
کشف شکست بخورد یا زمان آن تمام شود، از کاتالوگ بازگشت همراه برای موارد زیر استفاده می‌کند:

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

وقتی می‌خواهید راه‌اندازی از بررسی Codex پرهیز کند و به کاتالوگ بازگشت پایبند بماند،
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

## اتصال و سیاست سرور برنامه

به‌طور پیش‌فرض، Plugin باینری مدیریت‌شده Codex متعلق به OpenClaw را به‌صورت محلی با این فرمان شروع می‌کند:

```bash
codex app-server --listen stdio://
```

باینری مدیریت‌شده به‌عنوان وابستگی runtime همراه Plugin اعلام شده و همراه با
بقیه وابستگی‌های Plugin `codex` آماده‌سازی می‌شود. این کار نسخه سرور برنامه را
به Plugin همراه گره می‌زند، نه به هر Codex CLI جداگانه‌ای که اتفاقاً به‌صورت محلی نصب شده باشد.
فقط زمانی `appServer.command` را تنظیم کنید که عمداً می‌خواهید یک فایل اجرایی متفاوت را اجرا کنید.

به‌طور پیش‌فرض، OpenClaw نشست‌های هارنس Codex محلی را در حالت YOLO شروع می‌کند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"` و
`sandbox: "danger-full-access"`. این وضعیت عملگر محلی مورد اعتماد است که برای
Heartbeatهای خودکار استفاده می‌شود: Codex می‌تواند از ابزارهای shell و شبکه استفاده کند
بدون اینکه روی درخواست‌های تأیید بومی که کسی برای پاسخ به آن‌ها حضور ندارد متوقف شود.

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

حالت نگهبان از مسیر تأیید بازبینی خودکار بومی Codex استفاده می‌کند. وقتی Codex درخواست می‌کند
از sandbox خارج شود، بیرون از فضای کاری بنویسد، یا مجوزهایی مانند دسترسی شبکه اضافه کند،
Codex آن درخواست تأیید را به بازبین بومی مسیریابی می‌کند، نه به یک پرامپت انسانی.
بازبین چارچوب ریسک Codex را اعمال می‌کند و درخواست مشخص را تأیید یا رد می‌کند.
وقتی محافظ‌های بیشتری نسبت به حالت YOLO می‌خواهید اما همچنان لازم دارید عامل‌های بدون حضور
پیشرفت کنند، از نگهبان استفاده کنید.

پیش‌تنظیم `guardian` به `approvalPolicy: "on-request"`،
`approvalsReviewer: "auto_review"` و `sandbox: "workspace-write"` گسترش می‌یابد.
فیلدهای سیاست منفرد همچنان `mode` را بازنویسی می‌کنند، بنابراین استقرارهای پیشرفته می‌توانند
پیش‌تنظیم را با انتخاب‌های صریح ترکیب کنند. مقدار بازبین قدیمی‌تر `guardian_subagent`
هنوز به‌عنوان نام مستعار سازگاری پذیرفته می‌شود، اما پیکربندی‌های جدید باید از
`auto_review` استفاده کنند.

برای یک سرور برنامه از قبل در حال اجرا، از انتقال WebSocket استفاده کنید:

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

اجرای سرور برنامه stdio به‌طور پیش‌فرض محیط فرایند OpenClaw را به ارث می‌برد،
اما OpenClaw پل حساب سرور برنامه Codex را در اختیار دارد. احراز هویت به این ترتیب انتخاب می‌شود:

1. یک پروفایل احراز هویت صریح OpenClaw Codex برای عامل.
2. حساب موجود سرور برنامه، مانند ورود محلی Codex CLI به ChatGPT.
3. فقط برای اجرای محلی سرور برنامه stdio، `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب سرور برنامه‌ای وجود ندارد و احراز هویت OpenAI
   همچنان لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex از نوع اشتراک ChatGPT می‌بیند،
`CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex ایجادشده حذف می‌کند.
این کار کلیدهای API سطح Gateway را برای embeddingها یا مدل‌های مستقیم OpenAI در دسترس نگه می‌دارد،
بدون اینکه نوبت‌های سرور برنامه بومی Codex به‌اشتباه از طریق API صورت‌حساب شوند.
پروفایل‌های صریح کلید API Codex و بازگشت کلید محیطی stdio محلی، به‌جای محیط
به‌ارث‌رسیده فرایند فرزند، از ورود سرور برنامه استفاده می‌کنند. اتصال‌های سرور برنامه
WebSocket بازگشت کلید API محیط Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت
صریح یا حساب خود سرور برنامه راه‌دور استفاده کنید.

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

`appServer.clearEnv` فقط بر فرایند فرزند سرور برنامه Codex ایجادشده اثر می‌گذارد.

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد               | پیش‌فرض                                  | معنا                                                                                                                             |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"`، Codex را ایجاد می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                            |
| `command`           | باینری مدیریت‌شده Codex                     | فایل اجرایی برای ترابری stdio. برای استفاده از باینری مدیریت‌شده، آن را تنظیم‌نشده بگذارید؛ فقط برای override صریح تنظیمش کنید.                        |
| `args`              | `["app-server", "--listen", "stdio://"]` | آرگومان‌ها برای ترابری stdio.                                                                                                      |
| `url`               | تنظیم‌نشده                                    | URL مربوط به WebSocket app-server.                                                                                                           |
| `authToken`         | تنظیم‌نشده                                    | توکن Bearer برای ترابری WebSocket.                                                                                               |
| `headers`           | `{}`                                     | هدرهای اضافی WebSocket.                                                                                                            |
| `clearEnv`          | `[]`                                     | نام متغیرهای محیطی اضافی که پس از ساخت محیط به‌ارث‌رسیده توسط OpenClaw، از فرایند stdio app-server ایجادشده حذف می‌شوند. |
| `requestTimeoutMs`  | `60000`                                  | زمان انقضا برای فراخوانی‌های control-plane مربوط به app-server.                                                                                         |
| `mode`              | `"yolo"`                                 | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط guardian.                                                                                     |
| `approvalPolicy`    | `"never"`                                | سیاست تایید بومی Codex که به شروع/ازسرگیری/نوبت thread فرستاده می‌شود.                                                                      |
| `sandbox`           | `"danger-full-access"`                   | حالت sandbox بومی Codex که به شروع/ازسرگیری thread فرستاده می‌شود.                                                                              |
| `approvalsReviewer` | `"user"`                                 | برای اینکه Codex اعلان‌های تایید بومی را بازبینی کند، از `"auto_review"` استفاده کنید. `guardian_subagent` همچنان یک alias قدیمی است.                        |
| `serviceTier`       | تنظیم‌نشده                                    | رده سرویس اختیاری Codex app-server: `"fast"`، `"flex"`، یا `null`. مقادیر قدیمی نامعتبر نادیده گرفته می‌شوند.                           |

فراخوانی‌های ابزار پویا که در مالکیت OpenClaw هستند، مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: هر درخواست Codex `item/tool/call`
باید ظرف ۳۰ ثانیه پاسخی از OpenClaw دریافت کند. در زمان انقضا، OpenClaw در
صورت پشتیبانی، سیگنال ابزار را abort می‌کند و یک پاسخ ابزار پویای ناموفق به
Codex برمی‌گرداند تا نوبت بتواند ادامه پیدا کند، به‌جای اینکه session در حالت
`processing` باقی بماند.

پس از اینکه OpenClaw به یک درخواست app-server با دامنه نوبت از Codex پاسخ
می‌دهد، harness همچنین انتظار دارد Codex نوبت بومی را با `turn/completed`
تمام کند. اگر app-server پس از آن پاسخ به‌مدت ۶۰ ثانیه ساکت بماند، OpenClaw
بهترین تلاش خود را برای interrupt کردن نوبت Codex انجام می‌دهد، یک زمان‌انقضای
تشخیصی ثبت می‌کند، و lane مربوط به session در OpenClaw را آزاد می‌کند تا
پیام‌های چت بعدی پشت یک نوبت بومی stale در صف نمانند.

overrideهای محیطی برای آزمون محلی همچنان در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم نشده باشد،
`OPENCLAW_CODEX_APP_SERVER_BIN` باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا
برای آزمون محلی یک‌باره از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده
کنید. برای استقرارهای تکرارپذیر، config ترجیح داده می‌شود چون رفتار Plugin
را در همان فایل بازبینی‌شده‌ای نگه می‌دارد که بقیه تنظیمات harness مربوط به
Codex در آن قرار دارد.

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی خودش پوشش داده شده است:
[استفاده از رایانه با Codex](/fa/plugins/codex-computer-use).

نسخه کوتاه: OpenClaw برنامه کنترل دسکتاپ را vendor نمی‌کند و خودش actionهای
دسکتاپ را اجرا نمی‌کند. OpenClaw، Codex app-server را آماده می‌کند، بررسی
می‌کند که سرور MCP مربوط به `computer-use` در دسترس باشد، و سپس اجازه می‌دهد
Codex در طول نوبت‌های حالت Codex فراخوانی‌های ابزار MCP بومی را مدیریت کند.

برای دسترسی مستقیم به درایور TryCua خارج از جریان marketplace مربوط به Codex،
`cua-driver mcp` را با `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`
ثبت کنید. برای تمایز بین استفاده از رایانه در مالکیت Codex و ثبت مستقیم MCP،
[استفاده از رایانه با Codex](/fa/plugins/codex-computer-use) را ببینید.

config حداقلی:

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

استفاده از رایانه مختص macOS است و ممکن است پیش از اینکه سرور MCP مربوط به
Codex بتواند برنامه‌ها را کنترل کند، به مجوزهای محلی سیستم‌عامل نیاز داشته
باشد. اگر `computerUse.enabled` برابر true باشد و سرور MCP در دسترس نباشد،
نوبت‌های حالت Codex پیش از شروع thread شکست می‌خورند، به‌جای اینکه بی‌سروصدا
بدون ابزارهای بومی استفاده از رایانه اجرا شوند. برای گزینه‌های marketplace،
محدودیت‌های کاتالوگ راه‌دور، دلایل وضعیت، و عیب‌یابی، [استفاده از رایانه با Codex](/fa/plugins/codex-computer-use)
را ببینید.

وقتی `computerUse.autoInstall` برابر true باشد، اگر Codex هنوز marketplace
محلی را کشف نکرده باشد، OpenClaw می‌تواند marketplace استاندارد همراه Codex
Desktop را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند.
پس از تغییر config مربوط به runtime یا استفاده از رایانه، از `/new` یا
`/reset` استفاده کنید تا sessionهای موجود اتصال قدیمی PI یا thread قدیمی
Codex را نگه ندارند.

## دستورالعمل‌های رایج

Codex محلی با ترابری stdio پیش‌فرض:

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

تاییدهای Codex بازبینی‌شده توسط guardian:

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

app-server راه‌دور با هدرهای صریح:

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

تغییر مدل همچنان تحت کنترل OpenClaw می‌ماند. وقتی یک session در OpenClaw به
یک thread موجود در Codex متصل است، نوبت بعدی دوباره مدل OpenAI، provider،
سیاست تایید، sandbox، و رده سرویس انتخاب‌شده فعلی را به app-server می‌فرستد.
تغییر از `openai/gpt-5.5` به `openai/gpt-5.2` اتصال thread را نگه می‌دارد،
اما از Codex می‌خواهد با مدل تازه انتخاب‌شده ادامه دهد.

## فرمان Codex

Plugin همراه، `/codex` را به‌عنوان یک slash command مجاز ثبت می‌کند. این
فرمان عمومی است و روی هر channelی که از فرمان‌های متنی OpenClaw پشتیبانی کند
کار می‌کند.

شکل‌های رایج:

- `/codex status` اتصال زنده app-server، مدل‌ها، حساب، rate limitها، سرورهای MCP، و skills را نشان می‌دهد.
- `/codex models` مدل‌های زنده Codex app-server را فهرست می‌کند.
- `/codex threads [filter]` threadهای اخیر Codex را فهرست می‌کند.
- `/codex resume <thread-id>` session فعلی OpenClaw را به یک thread موجود در Codex متصل می‌کند.
- `/codex compact` از Codex app-server می‌خواهد thread متصل را compact کند.
- `/codex review` بازبینی بومی Codex را برای thread متصل شروع می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد تشخیصی Codex برای thread متصل، درخواست تایید می‌کند.
- `/codex computer-use status` Plugin پیکربندی‌شده استفاده از رایانه و سرور MCP را بررسی می‌کند.
- `/codex computer-use install` Plugin پیکربندی‌شده استفاده از رایانه را نصب می‌کند و سرورهای MCP را دوباره بارگذاری می‌کند.
- `/codex account` وضعیت حساب و rate-limit را نشان می‌دهد.
- `/codex mcp` وضعیت سرورهای MCP مربوط به Codex app-server را فهرست می‌کند.
- `/codex skills` skills مربوط به Codex app-server را فهرست می‌کند.

### جریان عیب‌یابی رایج

وقتی یک agent مبتنی بر Codex در Telegram، Discord، Slack، یا channel دیگری
کاری غیرمنتظره انجام می‌دهد، از مکالمه‌ای شروع کنید که مشکل در آن رخ داده
است:

1. `/diagnostics bad tool choice after image upload` یا یادداشت کوتاه دیگری را
   اجرا کنید که آنچه دیده‌اید توصیف می‌کند.
2. درخواست diagnostics را یک‌بار تایید کنید. این تایید، فایل zip تشخیصی محلی
   Gateway را ایجاد می‌کند و، چون session از harness مربوط به Codex استفاده
   می‌کند، بسته بازخورد مرتبط Codex را نیز به سرورهای OpenAI می‌فرستد.
3. پاسخ تکمیل‌شده diagnostics را در گزارش باگ یا thread پشتیبانی قرار دهید.
   این پاسخ شامل مسیر بسته محلی، خلاصه حریم خصوصی، شناسه‌های session در
   OpenClaw، شناسه‌های thread در Codex، و یک خط `Inspect locally` برای هر
   thread در Codex است.
4. اگر می‌خواهید خودتان run را debug کنید، فرمان چاپ‌شده `Inspect locally`
   را در terminal اجرا کنید. این فرمان شبیه `codex resume <thread-id>` است و
   thread بومی Codex را باز می‌کند تا بتوانید مکالمه را بررسی کنید، آن را به
   صورت محلی ادامه دهید، یا از Codex بپرسید چرا یک ابزار یا plan خاص را
   انتخاب کرده است.

فقط زمانی از `/codex diagnostics [note]` استفاده کنید که مشخصا بخواهید
بارگذاری بازخورد Codex برای thread متصل فعلی انجام شود، بدون بسته کامل
diagnostics مربوط به OpenClaw Gateway. برای بیشتر گزارش‌های پشتیبانی،
`/diagnostics [note]` نقطه شروع بهتری است چون وضعیت محلی Gateway و شناسه‌های
thread در Codex را در یک پاسخ به هم پیوند می‌دهد. برای مدل کامل حریم خصوصی و
رفتار group-chat، [خروجی diagnostics](/fa/gateway/diagnostics) را ببینید.

هسته OpenClaw همچنین `/diagnostics [note]` فقط برای owner را به‌عنوان فرمان
عمومی diagnostics مربوط به Gateway در معرض استفاده قرار می‌دهد. اعلان تایید
آن preamble داده‌های حساس را نشان می‌دهد، به [خروجی Diagnostics](/fa/gateway/diagnostics)
پیوند می‌دهد، و هر بار از طریق تایید صریح exec درخواست
`openclaw gateway diagnostics export --json` می‌کند. diagnostics را با یک
قاعده allow-all تایید نکنید. پس از تایید، OpenClaw گزارشی قابل paste کردن با
مسیر بسته محلی و خلاصه manifest می‌فرستد. وقتی session فعال OpenClaw از
harness مربوط به Codex استفاده می‌کند، همان تایید همچنین اجازه ارسال بسته‌های
بازخورد مرتبط Codex به سرورهای OpenAI را می‌دهد. اعلان تایید می‌گوید که
بازخورد Codex ارسال خواهد شد، اما پیش از تایید، شناسه‌های session یا thread
در Codex را فهرست نمی‌کند.

اگر `/diagnostics` توسط یک owner در group chat فراخوانی شود، OpenClaw کانال
اشتراکی را تمیز نگه می‌دارد: گروه فقط یک اعلان کوتاه دریافت می‌کند، در حالی
که preamble مربوط به diagnostics، اعلان‌های تایید، و شناسه‌های session/thread
در Codex از مسیر تایید خصوصی برای owner فرستاده می‌شوند. اگر مسیر خصوصی برای
owner وجود نداشته باشد، OpenClaw درخواست گروه را رد می‌کند و از owner می‌خواهد
آن را از DM اجرا کند.

آپلود تأییدشدهٔ Codex، `feedback/upload` در app-server مربوط به Codex را فراخوانی می‌کند و از app-server می‌خواهد
در صورت موجود بودن، لاگ‌ها را برای هر رشتهٔ فهرست‌شده و زیررشته‌های Codex ایجادشده
شامل کند. آپلود از مسیر عادی بازخورد Codex به سرورهای OpenAI
عبور می‌کند؛ اگر بازخورد Codex در آن app-server غیرفعال باشد، فرمان
خطای app-server را برمی‌گرداند. پاسخ تشخیص کامل‌شده، کانال‌ها،
شناسه‌های نشست OpenClaw، شناسه‌های رشتهٔ Codex، و فرمان‌های محلی `codex resume <thread-id>`
را برای رشته‌هایی که ارسال شده‌اند فهرست می‌کند. اگر تأیید را رد کنید یا نادیده بگیرید،
OpenClaw آن شناسه‌های Codex را چاپ نمی‌کند. این آپلود جایگزین خروجی تشخیصی محلی
Gateway نمی‌شود.

`/codex resume` همان فایل اتصال جانبی را می‌نویسد که هارنس برای
نوبت‌های عادی استفاده می‌کند. در پیام بعدی، OpenClaw آن رشتهٔ Codex را از سر می‌گیرد، مدل
OpenClaw انتخاب‌شدهٔ فعلی را به app-server می‌فرستد، و تاریخچهٔ گسترده را
فعال نگه می‌دارد.

### بررسی یک رشتهٔ Codex از CLI

سریع‌ترین راه برای فهمیدن یک اجرای بد Codex اغلب این است که رشتهٔ بومی Codex
را مستقیم باز کنید:

```sh
codex resume <thread-id>
```

وقتی در یک گفت‌وگوی کانالی متوجه باگی می‌شوید و می‌خواهید نشست
مسئله‌دار Codex را بررسی کنید، آن را محلی ادامه دهید، یا از Codex بپرسید چرا یک
ابزار یا انتخاب استدلالی خاص انجام داده است، از این استفاده کنید. ساده‌ترین مسیر معمولاً این است که ابتدا
`/diagnostics [note]` را اجرا کنید: بعد از تأیید شما، گزارش کامل‌شده
هر رشتهٔ Codex را فهرست می‌کند و یک فرمان `Inspect locally` چاپ می‌کند، برای مثال
`codex resume <thread-id>`. می‌توانید آن فرمان را مستقیم در یک ترمینال کپی کنید.

همچنین می‌توانید شناسهٔ رشته را از `/codex binding` برای گفت‌وگوی فعلی یا
`/codex threads [filter]` برای رشته‌های اخیر app-server مربوط به Codex بگیرید، سپس همان
فرمان `codex resume` را در شل خود اجرا کنید.

سطح فرمان به app-server مربوط به Codex نسخهٔ `0.125.0` یا جدیدتر نیاز دارد. اگر یک
app-server آینده یا سفارشی آن متد JSON-RPC را ارائه نکند، متدهای کنترلی
جداگانه به صورت `unsupported by this Codex app-server` گزارش می‌شوند.

## مرزهای هوک

هارنس Codex سه لایهٔ هوک دارد:

| لایه                                  | مالک                     | هدف                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| هوک‌های Plugin در OpenClaw            | OpenClaw                 | سازگاری محصول/Plugin در هارنس‌های Pi و Codex.                       |
| میان‌افزار افزونهٔ app-server مربوط به Codex | Pluginهای همراه OpenClaw | رفتار آداپتور در هر نوبت پیرامون ابزارهای پویای OpenClaw.          |
| هوک‌های بومی Codex                    | Codex                    | چرخهٔ حیات سطح پایین Codex و سیاست ابزار بومی از پیکربندی Codex.    |

OpenClaw از فایل‌های پروژه یا سراسری `hooks.json` متعلق به Codex برای مسیریابی
رفتار Pluginهای OpenClaw استفاده نمی‌کند. برای پل پشتیبانی‌شدهٔ ابزار بومی و مجوز،
OpenClaw پیکربندی Codex مخصوص هر رشته را برای `PreToolUse`، `PostToolUse`،
`PermissionRequest`، و `Stop` تزریق می‌کند. هوک‌های دیگر Codex مانند `SessionStart` و
`UserPromptSubmit` همچنان کنترل‌های سطح Codex هستند؛ آن‌ها در قرارداد v1 به عنوان
هوک‌های Plugin در OpenClaw در معرض قرار نمی‌گیرند.

برای ابزارهای پویای OpenClaw، OpenClaw ابزار را بعد از درخواست فراخوانی توسط Codex
اجرا می‌کند، بنابراین OpenClaw رفتار Plugin و میان‌افزاری را که در آداپتور
هارنس مالک آن است اجرا می‌کند. برای ابزارهای بومی Codex، Codex مالک رکورد ابزار
مرجع است. OpenClaw می‌تواند رویدادهای منتخب را بازتاب دهد، اما نمی‌تواند رشتهٔ بومی Codex
را بازنویسی کند مگر اینکه Codex آن عملیات را از طریق app-server یا callbackهای هوک بومی
در معرض بگذارد.

پروژکشن‌های Compaction و چرخهٔ حیات LLM از اعلان‌های app-server مربوط به Codex
و وضعیت آداپتور OpenClaw می‌آیند، نه از فرمان‌های هوک بومی Codex.
رویدادهای `before_compaction`، `after_compaction`، `llm_input`، و
`llm_output` متعلق به OpenClaw مشاهده‌های سطح آداپتور هستند، نه ضبط بایت‌به‌بایت
درخواست داخلی Codex یا بارهای Compaction آن.

اعلان‌های app-server مربوط به `hook/started` و `hook/completed` بومی Codex
به عنوان رویدادهای عامل `codex_app_server.hook` برای مسیر اجرا و اشکال‌زدایی
پروژکت می‌شوند. آن‌ها هوک‌های Plugin در OpenClaw را فراخوانی نمی‌کنند.

## قرارداد پشتیبانی V1

حالت Codex، Pi با یک فراخوانی مدل متفاوت در زیر آن نیست. Codex بخش بیشتری از
حلقهٔ مدل بومی را مالک است، و OpenClaw سطح‌های Plugin و نشست خود را
پیرامون آن مرز تطبیق می‌دهد.

پشتیبانی‌شده در زمان اجرای Codex نسخهٔ v1:

| سطح                                          | پشتیبانی                                | چرا                                                                                                                                                                                                  |
| -------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حلقهٔ مدل OpenAI از طریق Codex               | پشتیبانی‌شده                            | app-server مربوط به Codex مالک نوبت OpenAI، ازسرگیری رشتهٔ بومی، و ادامهٔ ابزار بومی است.                                                                                                          |
| مسیریابی و تحویل کانال OpenClaw              | پشتیبانی‌شده                            | Telegram، Discord، Slack، WhatsApp، iMessage، و کانال‌های دیگر بیرون از زمان اجرای مدل باقی می‌مانند.                                                                                              |
| ابزارهای پویای OpenClaw                      | پشتیبانی‌شده                            | Codex از OpenClaw می‌خواهد این ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.                                                                                                   |
| Pluginهای پرامپت و زمینه                     | پشتیبانی‌شده                            | OpenClaw پوشش‌های پرامپت را می‌سازد و پیش از شروع یا ازسرگیری رشته، زمینه را در نوبت Codex پروژکت می‌کند.                                                                                         |
| چرخهٔ حیات موتور زمینه                       | پشتیبانی‌شده                            | مونتاژ، جذب یا نگهداری پس از نوبت، و هماهنگی Compaction موتور زمینه برای نوبت‌های Codex اجرا می‌شوند.                                                                                              |
| هوک‌های ابزار پویا                           | پشتیبانی‌شده                            | `before_tool_call`، `after_tool_call`، و میان‌افزار نتیجهٔ ابزار پیرامون ابزارهای پویای تحت مالکیت OpenClaw اجرا می‌شوند.                                                                          |
| هوک‌های چرخهٔ حیات                           | به عنوان مشاهده‌های آداپتور پشتیبانی‌شده | `llm_input`، `llm_output`، `agent_end`، `before_compaction`، و `after_compaction` با بارهای صادقانهٔ حالت Codex اجرا می‌شوند.                                                                      |
| دروازهٔ بازبینی پاسخ نهایی                   | از طریق رلهٔ هوک بومی پشتیبانی‌شده     | `Stop` در Codex به `before_agent_finalize` رله می‌شود؛ `revise` از Codex یک گذر مدل دیگر پیش از نهایی‌سازی می‌خواهد.                                                                              |
| مسدودسازی یا مشاهدهٔ شل، patch، و MCP بومی  | از طریق رلهٔ هوک بومی پشتیبانی‌شده     | `PreToolUse` و `PostToolUse` در Codex برای سطح‌های ابزار بومی متعهدشده، از جمله بارهای MCP روی app-server مربوط به Codex نسخهٔ `0.125.0` یا جدیدتر، رله می‌شوند. مسدودسازی پشتیبانی می‌شود؛ بازنویسی آرگومان پشتیبانی نمی‌شود. |
| سیاست مجوز بومی                              | از طریق رلهٔ هوک بومی پشتیبانی‌شده     | `PermissionRequest` در Codex می‌تواند در جایی که زمان اجرا آن را ارائه می‌کند، از طریق سیاست OpenClaw مسیریابی شود. اگر OpenClaw تصمیمی برنگرداند، Codex از مسیر نگهبان عادی یا تأیید کاربر خود ادامه می‌دهد. |
| ضبط مسیر اجرای app-server                    | پشتیبانی‌شده                            | OpenClaw درخواستی را که به app-server فرستاده و اعلان‌های app-server را که دریافت می‌کند ثبت می‌کند.                                                                                              |

پشتیبانی‌نشده در زمان اجرای Codex نسخهٔ v1:

| سطح                                                | مرز V1                                                                                                                                          | مسیر آینده                                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| تغییر آرگومان ابزار بومی                          | هوک‌های پیش‌ابزار بومی Codex می‌توانند مسدود کنند، اما OpenClaw آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند.                            | به پشتیبانی هوک/شِما در Codex برای ورودی جایگزین ابزار نیاز دارد.                       |
| تاریخچهٔ رونوشت بومی Codex قابل ویرایش             | Codex مالک تاریخچهٔ مرجع رشتهٔ بومی است. OpenClaw مالک یک آینه است و می‌تواند زمینهٔ آینده را پروژکت کند، اما نباید internals پشتیبانی‌نشده را تغییر دهد. | اگر جراحی رشتهٔ بومی لازم باشد، APIهای صریح app-server مربوط به Codex اضافه شود.        |
| `tool_result_persist` برای رکوردهای ابزار بومی Codex | آن هوک نوشتن‌های رونوشت تحت مالکیت OpenClaw را تبدیل می‌کند، نه رکوردهای ابزار بومی Codex را.                                                | می‌توان رکوردهای تبدیل‌شده را بازتاب داد، اما بازنویسی مرجع به پشتیبانی Codex نیاز دارد. |
| فرادادهٔ غنی Compaction بومی                      | OpenClaw شروع و تکمیل Compaction را مشاهده می‌کند، اما فهرست پایدار نگه‌داشته/حذف‌شده، دلتای توکن، یا بار خلاصه دریافت نمی‌کند.             | به رویدادهای غنی‌تر Compaction در Codex نیاز دارد.                                      |
| مداخله در Compaction                               | هوک‌های فعلی Compaction در OpenClaw در حالت Codex در سطح اعلان هستند.                                                                          | اگر Pluginها نیاز به وتو یا بازنویسی Compaction بومی دارند، هوک‌های پیش/پس Compaction در Codex اضافه شود. |
| ضبط بایت‌به‌بایت درخواست API مدل                  | OpenClaw می‌تواند درخواست‌ها و اعلان‌های app-server را ضبط کند، اما هستهٔ Codex درخواست نهایی OpenAI API را داخلاً می‌سازد.                 | به رویداد ردیابی درخواست مدل یا API اشکال‌زدایی در Codex نیاز دارد.                    |

## ابزارها، رسانه، و Compaction

هارنس Codex فقط مجری عامل تعبیه‌شدهٔ سطح پایین را تغییر می‌دهد.

OpenClaw همچنان فهرست ابزار را می‌سازد و نتایج ابزار پویا را از
هارنس دریافت می‌کند. متن، تصاویر، ویدئو، موسیقی، TTS، تأییدها، و خروجی ابزار پیام‌رسانی
از مسیر تحویل عادی OpenClaw ادامه پیدا می‌کنند.

رلهٔ هوک بومی عمداً عمومی است، اما قرارداد پشتیبانی v1
به مسیرهای ابزار بومی Codex و مجوزی محدود است که OpenClaw آزمایش می‌کند. در
زمان اجرای Codex، این شامل بارهای شل، patch، و MCP برای `PreToolUse`،
`PostToolUse`، و `PermissionRequest` است. تا وقتی قرارداد زمان اجرا نام یک
رویداد هوک آیندهٔ Codex را مشخص نکرده است، فرض نکنید هر رویداد هوک آیندهٔ
Codex یک سطح Plugin در OpenClaw است.

برای `PermissionRequest`، OpenClaw فقط زمانی تصمیم‌های صریح اجازه یا رد
برمی‌گرداند که سیاست تصمیم بگیرد. نتیجهٔ بدون تصمیم به معنی اجازه نیست. Codex آن را به عنوان نبود
تصمیم هوک در نظر می‌گیرد و به مسیر نگهبان یا تأیید کاربر خودش می‌افتد.

درخواست‌های تأیید ابزار MCP در Codex وقتی از طریق جریان تأیید Plugin در OpenClaw
مسیریابی می‌شوند که Codex مقدار `_meta.codex_approval_kind` را
`"mcp_tool_call"` علامت‌گذاری کند. پرامپت‌های `request_user_input` در Codex به
گفت‌وگوی مبدأ فرستاده می‌شوند، و پیام پیگیری بعدی در صف به جای اینکه به عنوان زمینهٔ اضافی
هدایت شود، به آن درخواست سرور بومی پاسخ می‌دهد. درخواست‌های elicitation دیگر MCP
همچنان fail closed می‌شوند.

هدایت صف اجرای فعال به `turn/steer` در app-serverِ Codex نگاشت می‌شود. با
`messages.queue.mode: "steer"` پیش‌فرض، OpenClaw پیام‌های گفت‌وگوی صف‌شده را
برای پنجرهٔ سکوت پیکربندی‌شده دسته‌بندی می‌کند و آن‌ها را به ترتیب ورود، به‌صورت یک درخواست `turn/steer`
می‌فرستد. حالت قدیمی `queue` درخواست‌های جداگانهٔ `turn/steer` می‌فرستد. نوبت‌های
بازبینی Codex و Compaction دستی می‌توانند هدایت همان نوبت را رد کنند؛ در این حالت
OpenClaw، وقتی حالت انتخاب‌شده اجازهٔ fallback بدهد، از صف پیگیری استفاده می‌کند. ببینید
[صف هدایت](/fa/concepts/queue-steering).

وقتی مدل انتخاب‌شده از harnessِ Codex استفاده می‌کند، Compaction بومی رشته
به app-serverِ Codex واگذار می‌شود. OpenClaw یک آینهٔ رونوشت را برای تاریخچهٔ کانال،
جست‌وجو، `/new`، `/reset`، و جابه‌جایی آیندهٔ مدل یا harness نگه می‌دارد. این
آینه شامل پرامپت کاربر، متن نهایی دستیار، و رکوردهای سبک استدلال یا برنامهٔ Codex
است، وقتی app-server آن‌ها را منتشر کند. امروز، OpenClaw فقط سیگنال‌های شروع و
تکمیل Compaction بومی را ثبت می‌کند. هنوز خلاصهٔ خوانای انسانی از Compaction یا
فهرست قابل ممیزی از اینکه Codex پس از Compaction کدام ورودی‌ها را نگه داشته است ارائه نمی‌کند.

از آنجا که Codex مالک رشتهٔ بومی کانونی است، `tool_result_persist` در حال حاضر
رکوردهای نتیجهٔ ابزار بومی Codex را بازنویسی نمی‌کند. این فقط زمانی اعمال می‌شود که
OpenClaw در حال نوشتن نتیجهٔ ابزار رونوشت نشست متعلق به OpenClaw باشد.

تولید رسانه به PI نیاز ندارد. تصویر، ویدئو، موسیقی، PDF، TTS، و فهم رسانه
همچنان از تنظیمات provider/model متناظر مانند
`agents.defaults.imageGenerationModel`، `videoGenerationModel`، `pdfModel`، و
`messages.tts` استفاده می‌کنند.

## عیب‌یابی

**Codex به‌عنوان یک provider معمولی `/model` ظاهر نمی‌شود:** این برای
پیکربندی‌های جدید مورد انتظار است. یک مدل `openai/gpt-*` را با
`agentRuntime.id: "codex"` (یا یک ref قدیمی `codex/*`) انتخاب کنید، 
`plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید که آیا `plugins.allow`، 
`codex` را حذف کرده است یا نه.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** `agentRuntime.id: "auto"` همچنان می‌تواند از PI به‌عنوان
backend سازگاری استفاده کند، وقتی هیچ harnessِ Codex اجرای کار را claim نکند. برای اجبار انتخاب Codex هنگام آزمایش،
`agentRuntime.id: "codex"` را تنظیم کنید. runtime اجباری Codex اکنون به‌جای fallback به PI شکست می‌خورد، مگر اینکه
به‌صراحت `agentRuntime.fallback: "pi"` را تنظیم کنید. وقتی app-serverِ Codex
انتخاب شود، خطاهای آن مستقیما و بدون پیکربندی fallback اضافی نمایش داده می‌شوند.

**app-server رد می‌شود:** Codex را ارتقا دهید تا handshakeِ app-server
نسخهٔ `0.125.0` یا جدیدتر را گزارش کند. پیش‌انتشارهای هم‌نسخه یا نسخه‌های دارای پسوند build
مانند `0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون کف پروتکل پایدار
`0.125.0` چیزی است که OpenClaw آزمایش می‌کند.

**کشف مدل کند است:** مقدار `plugins.entries.codex.config.discovery.timeoutMs`
را کاهش دهید یا discovery را غیرفعال کنید.

**انتقال WebSocket بلافاصله شکست می‌خورد:** `appServer.url`، `authToken`،
و اینکه app-server راه دور همان نسخهٔ پروتکل app-serverِ Codex را صحبت می‌کند بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این مورد انتظار است مگر اینکه
`agentRuntime.id: "codex"` را برای آن agent اجباری کرده باشید یا یک ref قدیمی
`codex/*` را انتخاب کرده باشید. refهای سادهٔ `openai/gpt-*` و سایر providerها در حالت
`auto` روی مسیر معمول provider خود باقی می‌مانند. اگر `agentRuntime.id: "codex"` را اجباری کنید، هر نوبت تعبیه‌شده
برای آن agent باید یک مدل OpenAI پشتیبانی‌شده توسط Codex باشد.

**Computer Use نصب است اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه
`/codex computer-use status` را بررسی کنید. اگر ابزاری
`Native hook relay unavailable` را گزارش کرد، از `/new` یا `/reset` استفاده کنید؛ اگر ادامه داشت، برای پاک‌کردن ثبت‌های stale native hook،
Gateway را راه‌اندازی مجدد کنید. اگر `computer-use.list_apps`
timeout شد، Codex Computer Use یا Codex Desktop را راه‌اندازی مجدد کنید و دوباره تلاش کنید.

## مرتبط

- [Pluginهای harnessِ agent](/fa/plugins/sdk-agent-harness)
- [runtimeهای agent](/fa/concepts/agent-runtimes)
- [providerهای مدل](/fa/concepts/model-providers)
- [providerِ OpenAI](/fa/providers/openai)
- [وضعیت](/fa/cli/status)
- [hookهای Plugin](/fa/plugins/hooks)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [آزمایش](/fa/help/testing-live#live-codex-app-server-harness-smoke)

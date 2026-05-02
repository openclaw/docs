---
read_when:
    - می‌خواهید از هارنس app-server همراه Codex استفاده کنید
    - به نمونه‌های پیکربندی چارچوب اجرای Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به Pi با شکست مواجه شوند
summary: نوبت‌های عامل تعبیه‌شدهٔ OpenClaw را از طریق هارنس app-server همراه Codex اجرا کنید
title: هارنس Codex
x-i18n:
    generated_at: "2026-05-02T23:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ffa0cbb28422b2ed8d7c0eef6ee0222072c523d170b4b33597bb37bd3fa9700
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw اجازه می‌دهد نوبت‌های agent تعبیه‌شده را به‌جای مهارکنندهٔ داخلی PI از طریق app-server مربوط به Codex اجرا کند.

وقتی می‌خواهید Codex مالک نشست سطح پایین agent باشد، از این استفاده کنید: کشف مدل، ازسرگیری بومی thread، Compaction بومی، و اجرای app-server. OpenClaw همچنان مالک کانال‌های گفت‌وگو، فایل‌های نشست، انتخاب مدل، ابزارها، تأییدها، تحویل رسانه، و آینهٔ transcript قابل مشاهده است.

وقتی یک نوبت گفت‌وگوی منبع از طریق مهارکنندهٔ Codex اجرا می‌شود، پاسخ‌های قابل مشاهده به‌طور پیش‌فرض از ابزار `message` در OpenClaw استفاده می‌کنند، مگر اینکه استقرار به‌صراحت `messages.visibleReplies` را پیکربندی کرده باشد. agent همچنان می‌تواند نوبت Codex خود را به‌صورت خصوصی تمام کند؛ فقط وقتی به کانال پیام می‌فرستد که `message(action="send")` را فراخوانی کند. برای نگه داشتن پاسخ‌های نهایی گفت‌وگوی مستقیم روی مسیر تحویل خودکار قدیمی، `messages.visibleReplies: "automatic"` را تنظیم کنید.

نوبت‌های Heartbeat مربوط به Codex نیز به‌طور پیش‌فرض ابزار `heartbeat_respond` را دریافت می‌کنند، بنابراین agent می‌تواند ثبت کند که بیدارسازی باید ساکت بماند یا اطلاع‌رسانی کند، بدون اینکه آن جریان کنترل را در متن نهایی کدگذاری کند.

اگر می‌خواهید جهت‌گیری کلی پیدا کنید، از
[زمان‌های اجرای agent](/fa/concepts/agent-runtimes) شروع کنید. نسخهٔ کوتاه این است:
`openai/gpt-5.5` ارجاع مدل است، `codex` زمان اجرا است، و Telegram،
Discord، Slack، یا کانالی دیگر سطح ارتباطی باقی می‌ماند.

## پیکربندی سریع

بیشتر کاربرانی که «Codex در OpenClaw» می‌خواهند، این مسیر را می‌خواهند: با اشتراک ChatGPT/Codex وارد شوید، سپس نوبت‌های agent تعبیه‌شده را از طریق زمان اجرای بومی app-server مربوط به Codex اجرا کنید. ارجاع مدل همچنان به‌شکل canonical و به‌صورت
`openai/gpt-*` می‌ماند؛ احراز هویت اشتراک از حساب/پروفایل Codex می‌آید، نه از پیشوند مدل `openai-codex/*`.

اگر هنوز انجام نداده‌اید، ابتدا با OAuth مربوط به Codex وارد شوید:

```bash
openclaw models auth login --provider openai-codex
```

سپس Plugin همراه `codex` را فعال کنید و زمان اجرای Codex را اجباری کنید:

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
        fallback: "none",
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

وقتی منظورتان زمان اجرای بومی Codex است، از `openai-codex/gpt-*` استفاده نکنید. آن پیشوند مسیر صریح «OAuth مربوط به Codex از طریق PI» است. تغییرات پیکربندی روی نشست‌های جدید یا بازنشانی‌شده اعمال می‌شوند؛ نشست‌های موجود زمان اجرای ثبت‌شدهٔ خود را نگه می‌دارند.

## این Plugin چه چیزی را تغییر می‌دهد

Plugin همراه `codex` چند قابلیت جداگانه ارائه می‌کند:

| قابلیت | روش استفاده | کاری که انجام می‌دهد |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| زمان اجرای بومی تعبیه‌شده | `agentRuntime.id: "codex"` | نوبت‌های agent تعبیه‌شدهٔ OpenClaw را از طریق app-server مربوط به Codex اجرا می‌کند. |
| فرمان‌های بومی کنترل گفت‌وگو | `/codex bind`, `/codex resume`, `/codex steer`, ... | threadهای app-server مربوط به Codex را از یک مکالمهٔ پیام‌رسانی bind و کنترل می‌کند. |
| provider/catalog مربوط به app-server در Codex | اجزای داخلی `codex`، ارائه‌شده از طریق مهارکننده | به زمان اجرا اجازه می‌دهد مدل‌های app-server را کشف و اعتبارسنجی کند. |
| مسیر درک رسانه در Codex | مسیرهای سازگاری مدل تصویر `codex/*` | برای مدل‌های پشتیبانی‌شدهٔ درک تصویر، نوبت‌های محدود app-server مربوط به Codex را اجرا می‌کند. |
| relay بومی hook | hookهای Plugin پیرامون رویدادهای بومی Codex | به OpenClaw اجازه می‌دهد رویدادهای پشتیبانی‌شدهٔ ابزار/نهایی‌سازی بومی Codex را مشاهده/مسدود کند. |

فعال کردن Plugin این قابلیت‌ها را در دسترس قرار می‌دهد. این کار **موارد زیر را انجام نمی‌دهد**:

- شروع استفاده از Codex برای هر مدل OpenAI
- تبدیل ارجاع‌های مدل `openai-codex/*` به زمان اجرای بومی
- تبدیل ACP/acpx به مسیر پیش‌فرض Codex
- تغییر داغ نشست‌های موجودی که از قبل یک زمان اجرای PI ثبت کرده‌اند
- جایگزینی تحویل کانال OpenClaw، فایل‌های نشست، ذخیره‌سازی auth-profile، یا مسیریابی پیام

همین Plugin همچنین مالک سطح فرمان کنترل گفت‌وگوی بومی `/codex` است. اگر Plugin فعال باشد و کاربر درخواست bind، resume، steer، stop، یا inspect کردن threadهای Codex را از داخل گفت‌وگو بدهد، agentها باید `/codex ...` را به ACP ترجیح دهند. وقتی کاربر ACP/acpx را درخواست می‌کند یا در حال آزمایش adapter مربوط به ACP Codex است، ACP fallback صریح باقی می‌ماند.

نوبت‌های بومی Codex، hookهای Plugin در OpenClaw را به‌عنوان لایهٔ سازگاری عمومی حفظ می‌کنند. این‌ها hookهای درون‌فرایندی OpenClaw هستند، نه hookهای فرمان `hooks.json` در Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` برای رکوردهای transcript آینه‌شده
- `before_agent_finalize` از طریق relay مربوط به `Stop` در Codex
- `agent_end`

Pluginها همچنین می‌توانند middleware خنثی نسبت به زمان اجرا برای نتیجهٔ ابزار ثبت کنند تا پس از اجرای ابزار توسط OpenClaw و پیش از بازگرداندن نتیجه به Codex، نتایج ابزار پویای OpenClaw را بازنویسی کند. این از hook عمومی Plugin با نام
`tool_result_persist` جداست؛ آن hook نوشتن‌های نتیجهٔ ابزار در transcript تحت مالکیت OpenClaw را تبدیل می‌کند.

برای خود معناشناسی hookهای Plugin، [hookهای Plugin](/fa/plugins/hooks)
و [رفتار guard مربوط به Plugin](/fa/tools/plugin) را ببینید.

مهارکننده به‌طور پیش‌فرض خاموش است. پیکربندی‌های جدید باید ارجاع‌های مدل OpenAI را به‌شکل canonical و به‌صورت `openai/gpt-*` نگه دارند و وقتی اجرای بومی app-server را می‌خواهند، به‌صراحت
`agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex` را اجباری کنند. ارجاع‌های مدل قدیمی `codex/*` همچنان برای سازگاری، مهارکننده را به‌صورت خودکار انتخاب می‌کنند، اما پیشوندهای قدیمی provider که پشتوانهٔ زمان اجرا دارند، به‌عنوان انتخاب‌های عادی مدل/provider نمایش داده نمی‌شوند.

اگر Plugin مربوط به `codex` فعال باشد اما مدل اصلی همچنان
`openai-codex/*` باشد، `openclaw doctor` به‌جای تغییر دادن مسیر، هشدار می‌دهد. این عمدی است: `openai-codex/*` مسیر OAuth/اشتراک Codex از طریق PI باقی می‌ماند، و اجرای بومی app-server یک انتخاب صریح زمان اجرا می‌ماند.

## نقشهٔ مسیر

قبل از تغییر پیکربندی از این جدول استفاده کنید:

| رفتار مطلوب | ارجاع مدل | پیکربندی زمان اجرا | مسیر احراز هویت/پروفایل | برچسب وضعیت مورد انتظار |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| اشتراک ChatGPT/Codex با زمان اجرای بومی Codex | `openai/gpt-*` | `agentRuntime.id: "codex"` | OAuth مربوط به Codex یا حساب Codex | `Runtime: OpenAI Codex` |
| OpenAI API از طریق runner عادی OpenClaw | `openai/gpt-*` | حذف‌شده یا `runtime: "pi"` | کلید OpenAI API | `Runtime: OpenClaw Pi Default` |
| اشتراک ChatGPT/Codex از طریق PI | `openai-codex/gpt-*` | حذف‌شده یا `runtime: "pi"` | provider مربوط به OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| providerهای ترکیبی با حالت خودکار محافظه‌کارانه | ارجاع‌های مخصوص provider | `agentRuntime.id: "auto"` | به‌ازای provider انتخاب‌شده | وابسته به زمان اجرای انتخاب‌شده |
| نشست صریح adapter مربوط به Codex ACP | وابسته به prompt/model مربوط به ACP | `sessions_spawn` با `runtime: "acp"` | احراز هویت backend مربوط به ACP | وضعیت task/session مربوط به ACP |

تفکیک مهم، provider در برابر زمان اجرا است:

- `openai-codex/*` پاسخ می‌دهد «PI باید از کدام مسیر provider/auth استفاده کند؟»
- `agentRuntime.id: "codex"` پاسخ می‌دهد «کدام loop باید این نوبت تعبیه‌شده را اجرا کند؟»
- `/codex ...` پاسخ می‌دهد «این گفت‌وگو باید کدام مکالمهٔ بومی Codex را bind یا کنترل کند؟»
- ACP پاسخ می‌دهد «acpx باید کدام فرایند مهارکنندهٔ خارجی را اجرا کند؟»

## پیشوند مدل درست را انتخاب کنید

مسیرهای خانوادهٔ OpenAI به پیشوند وابسته‌اند. برای تنظیم رایج اشتراک همراه با زمان اجرای بومی Codex، از `openai/*` همراه با `agentRuntime.id: "codex"` استفاده کنید.
فقط وقتی از `openai-codex/*` استفاده کنید که عمداً OAuth مربوط به Codex از طریق PI را می‌خواهید:

| ارجاع مدل | مسیر زمان اجرا | زمان استفاده |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4` | provider مربوط به OpenAI از طریق لوله‌کشی OpenClaw/PI | وقتی دسترسی مستقیم فعلی به OpenAI Platform API با `OPENAI_API_KEY` را می‌خواهید. |
| `openai-codex/gpt-5.5` | OAuth مربوط به OpenAI Codex از طریق OpenClaw/PI | وقتی احراز هویت اشتراک ChatGPT/Codex را با runner پیش‌فرض PI می‌خواهید. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | مهارکنندهٔ app-server مربوط به Codex | وقتی احراز هویت اشتراک ChatGPT/Codex را با اجرای بومی Codex می‌خواهید. |

GPT-5.5 می‌تواند وقتی حساب شما آن‌ها را در دسترس قرار می‌دهد، هم در مسیرهای مستقیم کلید API مربوط به OpenAI و هم در مسیرهای اشتراک Codex ظاهر شود. برای زمان اجرای بومی Codex از `openai/gpt-5.5` همراه با مهارکنندهٔ app-server مربوط به Codex استفاده کنید، برای OAuth از طریق PI از `openai-codex/gpt-5.5` استفاده کنید، یا برای ترافیک مستقیم کلید API از `openai/gpt-5.5` بدون override زمان اجرای Codex استفاده کنید.

ارجاع‌های قدیمی `codex/gpt-*` همچنان به‌عنوان aliasهای سازگاری پذیرفته می‌شوند. مهاجرت سازگاری doctor ارجاع‌های قدیمی زمان اجرای اصلی را به ارجاع‌های canonical مدل بازنویسی می‌کند و سیاست زمان اجرا را جداگانه ثبت می‌کند، درحالی‌که ارجاع‌های قدیمی فقط-fallback بدون تغییر می‌مانند، چون زمان اجرا برای کل container مربوط به agent پیکربندی می‌شود.
پیکربندی‌های جدید OAuth مربوط به PI Codex باید از `openai-codex/gpt-*` استفاده کنند؛ پیکربندی‌های جدید مهارکنندهٔ بومی app-server باید از `openai/gpt-*` به‌همراه
`agentRuntime.id: "codex"` استفاده کنند.

`agents.defaults.imageModel` از همان تفکیک پیشوند پیروی می‌کند. وقتی درک تصویر باید از مسیر provider مربوط به OpenAI Codex OAuth اجرا شود، از
`openai-codex/gpt-*` استفاده کنید. وقتی درک تصویر باید از طریق یک نوبت محدود app-server مربوط به Codex اجرا شود، از `codex/gpt-*` استفاده کنید. مدل app-server مربوط به Codex باید پشتیبانی از ورودی تصویر را اعلام کند؛ مدل‌های فقط متن Codex پیش از شروع نوبت رسانه fail می‌شوند.

برای تأیید مهارکنندهٔ مؤثر نشست فعلی، از `/status` استفاده کنید. اگر انتخاب غافلگیرکننده است، logging اشکال‌زدایی را برای زیرسامانهٔ `agents/harness` فعال کنید و رکورد ساختاریافتهٔ `agent harness selected` مربوط به gateway را بررسی کنید. این رکورد شامل شناسهٔ مهارکنندهٔ انتخاب‌شده، دلیل انتخاب، سیاست runtime/fallback، و در حالت `auto`، نتیجهٔ پشتیبانی هر نامزد Plugin است.

### هشدارهای doctor چه معنایی دارند

`openclaw doctor` وقتی همهٔ این موارد درست باشند هشدار می‌دهد:

- Plugin همراه `codex` فعال یا مجاز باشد
- مدل اصلی یک agent برابر `openai-codex/*` باشد
- زمان اجرای مؤثر آن agent، `codex` نباشد

این هشدار وجود دارد چون کاربران اغلب انتظار دارند «Plugin مربوط به Codex فعال است» به‌معنای «زمان اجرای بومی app-server مربوط به Codex» باشد. OpenClaw چنین جهشی انجام نمی‌دهد. معنای هشدار این است:

- اگر قصدتان OAuth مربوط به ChatGPT/Codex از طریق PI بوده، **هیچ تغییری لازم نیست**.
- اگر قصدتان اجرای بومی app-server بوده، مدل را به `openai/<model>` تغییر دهید و
  `agentRuntime.id: "codex"` را تنظیم کنید.
- نشست‌های موجود پس از تغییر زمان اجرا همچنان به `/new` یا `/reset` نیاز دارند،
  چون pinهای زمان اجرای نشست چسبنده هستند.

انتخاب مهارکننده یک کنترل زندهٔ نشست نیست. وقتی یک نوبت تعبیه‌شده اجرا می‌شود،
OpenClaw شناسهٔ مهارکنندهٔ انتخاب‌شده را روی آن نشست ثبت می‌کند و برای نوبت‌های بعدی در همان شناسهٔ نشست، به استفاده از آن ادامه می‌دهد. وقتی می‌خواهید نشست‌های آینده از مهارکنندهٔ دیگری استفاده کنند، پیکربندی `agentRuntime` یا
`OPENCLAW_AGENT_RUNTIME` را تغییر دهید؛ برای شروع یک نشست تازه پیش از جابه‌جایی یک مکالمهٔ موجود بین PI و Codex، از `/new` یا `/reset` استفاده کنید. این کار از replay کردن یک transcript از طریق دو سامانهٔ نشست بومی ناسازگار جلوگیری می‌کند.

نشست‌های قدیمی که پیش از pinهای مهارکننده ایجاد شده‌اند، پس از داشتن تاریخچهٔ transcript به‌عنوان نشست‌های pin‌شده به PI در نظر گرفته می‌شوند. پس از تغییر پیکربندی، برای وارد کردن آن مکالمه به Codex از `/new` یا `/reset` استفاده کنید.

`/status` زمان‌اجرای مؤثر مدل را نشان می‌دهد. هارنس پیش‌فرض PI به صورت
`Runtime: OpenClaw Pi Default` ظاهر می‌شود، و هارنس app-server Codex به صورت
`Runtime: OpenAI Codex`.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس.
- app-server Codex نسخه `0.125.0` یا جدیدتر. Plugin همراه به طور پیش‌فرض یک باینری app-server Codex سازگار را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex` روی `PATH` بر راه‌اندازی معمول هارنس اثر نمی‌گذارند.
- احراز هویت Codex برای فرایند app-server یا برای پل احراز هویت Codex در OpenClaw در دسترس باشد. راه‌اندازی‌های محلی app-server برای هر عامل از خانه Codex مدیریت‌شده توسط OpenClaw و یک فرزند ایزوله‌شده `HOME` استفاده می‌کنند، بنابراین به طور پیش‌فرض حساب شخصی `~/.codex`، Skills، Pluginها، پیکربندی، وضعیت رشته، یا `$HOME/.agents/skills` بومی شما را نمی‌خوانند.

این Plugin دست‌دهی‌های app-server قدیمی‌تر یا بدون نسخه را مسدود می‌کند. این کار OpenClaw را روی سطح پروتکلی نگه می‌دارد که در برابر آن آزموده شده است.

برای آزمون‌های زنده و دود Docker، احراز هویت معمولاً از حساب CLI Codex یا یک پروفایل احراز هویت `openai-codex` در OpenClaw می‌آید. راه‌اندازی‌های محلی stdio app-server همچنین وقتی حسابی وجود نداشته باشد، می‌توانند به `CODEX_API_KEY` / `OPENAI_API_KEY` برگردند.

## فایل‌های راه‌اندازی فضای کاری

Codex خودش `AGENTS.md` را از طریق کشف بومی مستندات پروژه مدیریت می‌کند. OpenClaw فایل‌های مستندات پروژه مصنوعی برای Codex نمی‌نویسد و برای فایل‌های پرسونا به نام‌های جایگزین Codex وابسته نیست، چون جایگزین‌های Codex فقط وقتی اعمال می‌شوند که `AGENTS.md` وجود نداشته باشد.

برای هم‌ترازی فضای کاری OpenClaw، هارنس Codex فایل‌های راه‌اندازی دیگر (`SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`، و `MEMORY.md` در صورت وجود) را حل می‌کند و آن‌ها را از طریق دستورالعمل‌های پیکربندی Codex در `thread/start` و `thread/resume` ارسال می‌کند. این کار زمینه پرسونا/پروفایل فضای کاری `SOUL.md` و فایل‌های مرتبط را بدون تکرار `AGENTS.md` قابل مشاهده نگه می‌دارد.

## افزودن Codex در کنار مدل‌های دیگر

اگر همان عامل باید بتواند آزادانه بین Codex و مدل‌های ارائه‌دهنده غیر Codex جابه‌جا شود، `agentRuntime.id: "codex"` را به صورت سراسری تنظیم نکنید. زمان‌اجرای اجباری برای هر نوبت جاسازی‌شده آن عامل یا نشست اعمال می‌شود. اگر در حالی که آن زمان‌اجرا اجباری است یک مدل Anthropic را انتخاب کنید، OpenClaw همچنان هارنس Codex را امتحان می‌کند و به جای مسیریابی بی‌صدای آن نوبت از طریق PI، با شکست بسته متوقف می‌شود.

به جای آن از یکی از این شکل‌ها استفاده کنید:

- Codex را روی یک عامل اختصاصی با `agentRuntime.id: "codex"` قرار دهید.
- عامل پیش‌فرض را روی `agentRuntime.id: "auto"` و بازگشت PI برای استفاده معمول ترکیبی از ارائه‌دهنده‌ها نگه دارید.
- فقط برای سازگاری از ارجاع‌های قدیمی `codex/*` استفاده کنید. پیکربندی‌های جدید باید `openai/*` به‌همراه یک سیاست صریح زمان‌اجرای Codex را ترجیح دهند.

برای مثال، این پیکربندی عامل پیش‌فرض را روی انتخاب خودکار معمول نگه می‌دارد و یک عامل جداگانه Codex اضافه می‌کند:

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

- عامل پیش‌فرض `main` از مسیر معمول ارائه‌دهنده و بازگشت سازگاری PI استفاده می‌کند.
- عامل `codex` از هارنس app-server Codex استفاده می‌کند.
- اگر Codex برای عامل `codex` موجود یا پشتیبانی‌شده نباشد، نوبت به جای استفاده بی‌صدای PI شکست می‌خورد.

## مسیریابی فرمان عامل

عامل‌ها باید درخواست‌های کاربر را بر اساس نیت مسیریابی کنند، نه فقط بر اساس واژه «Codex»:

| درخواست کاربر...                                      | عامل باید استفاده کند از...                     |
| ------------------------------------------------------ | ------------------------------------------------ |
| «این گفت‌وگو را به Codex متصل کن»                      | `/codex bind`                                    |
| «رشته Codex با شناسه `<id>` را اینجا از سر بگیر»       | `/codex resume <id>`                             |
| «رشته‌های Codex را نشان بده»                           | `/codex threads`                                 |
| «برای یک اجرای بد Codex گزارش پشتیبانی ثبت کن»         | `/diagnostics [note]`                            |
| «فقط برای این رشته پیوست‌شده بازخورد Codex بفرست»      | `/codex diagnostics [note]`                      |
| «از اشتراک ChatGPT/Codex من با زمان‌اجرای Codex استفاده کن» | `openai/*` به‌همراه `agentRuntime.id: "codex"`   |
| «از اشتراک ChatGPT/Codex من از طریق PI استفاده کن»     | ارجاع‌های مدل `openai-codex/*`                  |
| «Codex را از طریق ACP/acpx اجرا کن»                    | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| «Claude Code/Gemini/OpenCode/Cursor را در یک رشته شروع کن» | ACP/acpx، نه `/codex` و نه زیرعامل‌های بومی      |

OpenClaw فقط وقتی راهنمایی ایجاد ACP را برای عامل‌ها تبلیغ می‌کند که ACP فعال، قابل ارسال، و متکی به یک بک‌اند زمان‌اجرای بارگذاری‌شده باشد. اگر ACP در دسترس نباشد، اعلان سیستم و Skills مربوط به Plugin نباید به عامل درباره مسیریابی ACP آموزش دهند.

## استقرارهای فقط Codex

وقتی لازم است ثابت کنید هر نوبت عامل جاسازی‌شده از Codex استفاده می‌کند، هارنس Codex را اجباری کنید. زمان‌اجراهای صریح Plugin به طور پیش‌فرض بازگشت PI ندارند، بنابراین `fallback: "none"` اختیاری است اما اغلب به عنوان مستندات مفید است:

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

بازنویسی محیط:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

با اجباری شدن Codex، اگر Plugin Codex غیرفعال باشد، app-server بیش از حد قدیمی باشد، یا app-server نتواند شروع شود، OpenClaw زود شکست می‌خورد. فقط وقتی `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` را تنظیم کنید که عمداً می‌خواهید PI انتخاب هارنسِ مفقود را مدیریت کند.

## Codex برای هر عامل

می‌توانید یک عامل را فقط Codex کنید، در حالی که عامل پیش‌فرض انتخاب خودکار معمول را نگه می‌دارد:

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

برای جابه‌جایی عامل‌ها و مدل‌ها از فرمان‌های معمول نشست استفاده کنید. `/new` یک نشست تازه OpenClaw می‌سازد و هارنس Codex در صورت نیاز رشته app-server جانبی خود را می‌سازد یا از سر می‌گیرد. `/reset` اتصال نشست OpenClaw را برای آن رشته پاک می‌کند و اجازه می‌دهد نوبت بعدی دوباره هارنس را از پیکربندی فعلی حل کند.

## کشف مدل

به طور پیش‌فرض، Plugin Codex از app-server مدل‌های موجود را می‌پرسد. اگر کشف شکست بخورد یا مهلتش تمام شود، از کاتالوگ بازگشت همراه برای موارد زیر استفاده می‌کند:

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

وقتی می‌خواهید راه‌اندازی از بررسی Codex خودداری کند و به کاتالوگ بازگشت پایبند بماند، کشف را غیرفعال کنید:

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

به طور پیش‌فرض، Plugin باینری Codex مدیریت‌شده توسط OpenClaw را به صورت محلی با این فرمان شروع می‌کند:

```bash
codex app-server --listen stdio://
```

باینری مدیریت‌شده همراه بسته Plugin `codex` ارسال می‌شود. این کار نسخه app-server را به Plugin همراه گره می‌زند، نه به هر CLI جداگانه Codex که اتفاقاً به صورت محلی نصب شده باشد. فقط وقتی `appServer.command` را تنظیم کنید که عمداً می‌خواهید یک فایل اجرایی متفاوت را اجرا کنید.

به طور پیش‌فرض، OpenClaw نشست‌های محلی هارنس Codex را در حالت YOLO شروع می‌کند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. این وضعیت اپراتور محلیِ مورد اعتماد برای Heartbeatهای خودکار است: Codex می‌تواند از ابزارهای shell و شبکه استفاده کند، بدون اینکه روی اعلان‌های تأیید بومی که کسی برای پاسخ‌دادن به آن‌ها حضور ندارد متوقف شود.

برای انتخاب تأییدهای بازبینی‌شده توسط نگهبان Codex، `appServer.mode:
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

حالت Guardian از مسیر تأیید بازبینی خودکار بومی Codex استفاده می‌کند. وقتی Codex درخواست خروج از sandbox، نوشتن خارج از فضای کاری، یا افزودن مجوزهایی مانند دسترسی شبکه را مطرح می‌کند، Codex آن درخواست تأیید را به جای اعلان انسانی به بازبین بومی مسیریابی می‌کند. بازبین چارچوب ریسک Codex را اعمال می‌کند و درخواست مشخص را تأیید یا رد می‌کند. وقتی به حفاظ‌های بیشتری نسبت به حالت YOLO نیاز دارید اما همچنان لازم است عامل‌های بدون نظارت پیشرفت کنند، از Guardian استفاده کنید.

پیش‌تنظیم `guardian` به `approvalPolicy: "on-request"`،
`approvalsReviewer: "auto_review"`، و `sandbox: "workspace-write"` گسترش می‌یابد.
فیلدهای سیاستی جداگانه همچنان `mode` را بازنویسی می‌کنند، بنابراین استقرارهای پیشرفته می‌توانند پیش‌تنظیم را با انتخاب‌های صریح ترکیب کنند. مقدار بازبین قدیمی‌تر `guardian_subagent` هنوز به عنوان نام مستعار سازگاری پذیرفته می‌شود، اما پیکربندی‌های جدید باید از `auto_review` استفاده کنند.

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

راه‌اندازی‌های stdio app-server به طور پیش‌فرض محیط فرایند OpenClaw را به ارث می‌برند، اما OpenClaw مالک پل حساب app-server Codex است و هر دو `CODEX_HOME` و `HOME` را به دایرکتوری‌های مختص هر عامل زیر وضعیت OpenClaw همان عامل تنظیم می‌کند. بارگذار Skills خود Codex از `$CODEX_HOME/skills` و `$HOME/.agents/skills` می‌خواند، بنابراین هر دو مقدار برای راه‌اندازی‌های محلی app-server ایزوله می‌شوند. این کار Skills، Pluginها، پیکربندی، حساب‌ها، و وضعیت رشته بومی Codex را در محدوده عامل OpenClaw نگه می‌دارد، به جای اینکه از خانه CLI Codex شخصی اپراتور نشت کنند.

Pluginهای OpenClaw و نماهای فوری Skills در OpenClaw همچنان از طریق رجیستری Plugin و بارگذار Skills خود OpenClaw جریان پیدا می‌کنند. دارایی‌های CLI Codex شخصی چنین نمی‌کنند. اگر Skills یا Pluginهای مفید CLI Codex دارید که باید بخشی از یک عامل OpenClaw شوند، آن‌ها را صریحاً فهرست‌برداری کنید:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

ارائه‌دهنده مهاجرت Codex، Skills را به فضای کاری عامل فعلی OpenClaw کپی می‌کند. Pluginهای بومی Codex، هوک‌ها، و فایل‌های پیکربندی به جای فعال‌سازی خودکار، برای بازبینی دستی گزارش یا بایگانی می‌شوند، چون می‌توانند فرمان‌ها را اجرا کنند، سرورهای MCP را در معرض قرار دهند، یا اعتبارنامه حمل کنند.

احراز هویت به این ترتیب انتخاب می‌شود:

1. یک پروفایل صریح احراز هویت Codex در OpenClaw برای عامل.
2. حساب موجود app-server در خانه Codex همان عامل.
3. فقط برای راه‌اندازی‌های محلی stdio app-server، `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی حساب app-server وجود نداشته باشد و احراز هویت OpenAI همچنان لازم باشد.

وقتی OpenClaw یک پروفایل احراز هویت Codex از نوع اشتراک ChatGPT می‌بیند، `CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex ایجادشده حذف می‌کند. این کار کلیدهای API در سطح Gateway را برای embeddings یا مدل‌های مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه نوبت‌های بومی app-server Codex به اشتباه از طریق API صورت‌حساب شوند. پروفایل‌های صریح کلید API Codex و بازگشت کلید محیطی stdio محلی، به جای env ارث‌بری‌شده فرایند فرزند، از ورود app-server استفاده می‌کنند. اتصال‌های WebSocket app-server بازگشت کلید API محیط Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب خود app-server راه دور استفاده کنید.

اگر یک استقرار به ایزوله‌سازی محیطی بیشتری نیاز دارد، آن متغیرها را به `appServer.clearEnv` اضافه کنید:

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

`appServer.clearEnv` فقط بر فرایند فرزند app-server در Codex که اجرا می‌شود اثر می‌گذارد.

ابزارهای پویای Codex به‌صورت پیش‌فرض از پروفایل `native-first` استفاده می‌کنند. در این حالت،
OpenClaw ابزارهای پویایی را که عملیات فضای کاری بومی Codex را تکرار می‌کنند در دسترس قرار نمی‌دهد:
`read`، `write`، `edit`، `apply_patch`، `exec`، `process` و
`update_plan`. ابزارهای یکپارچه‌سازی OpenClaw مانند پیام‌رسانی، نشست‌ها، رسانه،
cron، مرورگر، nodes، gateway، `heartbeat_respond` و `web_search` همچنان
در دسترس می‌مانند.

فیلدهای سطح بالای پشتیبانی‌شده برای Plugin مربوط به Codex:

| فیلد                       | پیش‌فرض         | معنا                                                                                     |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | برای در دسترس قرار دادن مجموعه کامل ابزارهای پویای OpenClaw برای app-server مربوط به Codex، از `"openclaw-compat"` استفاده کنید. |
| `codexDynamicToolsExclude` | `[]`             | نام‌های ابزارهای پویای اضافی OpenClaw که باید از نوبت‌های app-server مربوط به Codex حذف شوند. |

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد                | پیش‌فرض                                  | معنا                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` Codex را اجرا می‌کند؛ `"websocket"` به `url` متصل می‌شود.                                                                                                                                                                             |
| `command`           | باینری مدیریت‌شده Codex                 | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده، آن را تنظیم‌نشده بگذارید؛ فقط برای بازنویسی صریح آن را تنظیم کنید.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | آرگومان‌ها برای انتقال stdio.                                                                                                                                                                                                       |
| `url`               | تنظیم‌نشده                               | نشانی URL مربوط به WebSocket app-server.                                                                                                                                                                                                            |
| `authToken`         | تنظیم‌نشده                               | توکن Bearer برای انتقال WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | سربرگ‌های اضافی WebSocket.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | نام متغیرهای محیطی اضافی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw، از فرایند stdio app-server اجراشده حذف می‌شوند. `CODEX_HOME` و `HOME` برای جداسازی Codex به‌ازای هر عامل در OpenClaw هنگام اجرای محلی رزرو شده‌اند. |
| `requestTimeoutMs`  | `60000`                                  | مهلت زمانی برای فراخوانی‌های صفحه کنترل app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | تنظیم آماده برای اجرای YOLO یا اجرای بازبینی‌شده توسط guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | سیاست تأیید بومی Codex که به شروع/ادامه/نوبت رشته ارسال می‌شود.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | حالت سندباکس بومی Codex که به شروع/ادامه رشته ارسال می‌شود.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | برای اجازه دادن به Codex جهت بازبینی درخواست‌های تأیید بومی، از `"auto_review"` استفاده کنید. `guardian_subagent` همچنان یک نام مستعار قدیمی است.                                                                                                                         |
| `serviceTier`       | تنظیم‌نشده                               | سطح سرویس اختیاری Codex app-server: `"fast"`، `"flex"` یا `null`. مقادیر قدیمی نامعتبر نادیده گرفته می‌شوند.                                                                                                                            |

فراخوانی‌های ابزار پویایی که مالکیتشان با OpenClaw است، مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: هر درخواست `item/tool/call` در Codex باید ظرف ۳۰ ثانیه
یک پاسخ OpenClaw دریافت کند. هنگام پایان مهلت زمانی، OpenClaw در صورت پشتیبانی،
سیگنال ابزار را لغو می‌کند و یک پاسخ ابزار پویای ناموفق به Codex برمی‌گرداند تا
نوبت بتواند ادامه یابد، به‌جای آنکه نشست در حالت `processing` باقی بماند.

پس از اینکه OpenClaw به یک درخواست app-server محدود به نوبت در Codex پاسخ می‌دهد، harness
همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` تمام کند. اگر
app-server پس از آن پاسخ به‌مدت ۶۰ ثانیه ساکت بماند، OpenClaw به‌صورت best-effort
نوبت Codex را قطع می‌کند، یک پایان مهلت زمانی تشخیصی ثبت می‌کند و مسیر نشست
OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی پشت یک نوبت بومی کهنه
در صف نمانند.

بازنویسی‌های محیطی همچنان برای آزمون محلی در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم نشده باشد، `OPENCLAW_CODEX_APP_SERVER_BIN` فایل باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از `plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای آزمون محلی موردی از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. برای استقرارهای تکرارپذیر، پیکربندی ترجیح داده می‌شود، زیرا رفتار Plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد که بقیه تنظیمات هارنس Codex در آن قرار دارند.

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی جداگانه خودش پوشش داده شده است:
[استفاده از رایانه در Codex](/fa/plugins/codex-computer-use).

خلاصه‌اش این است: OpenClaw برنامه کنترل دسکتاپ را vendor نمی‌کند و خودش کنش‌های دسکتاپ را اجرا نمی‌کند. این ابزار Codex app-server را آماده می‌کند، بررسی می‌کند که سرور MCPِ `computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex فراخوانی‌های ابزار بومی MCP را در طول نوبت‌های حالت Codex مدیریت کند.

برای دسترسی مستقیم به درایور TryCua خارج از جریان marketplace کدکس، `cua-driver mcp` را با `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ثبت کنید.
برای تفاوت میان استفاده از رایانه تحت مالکیت Codex و ثبت مستقیم MCP، [استفاده از رایانه در Codex](/fa/plugins/codex-computer-use) را ببینید.

پیکربندی کمینه:

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

استفاده از رایانه مخصوص macOS است و ممکن است پیش از آنکه سرور Codex MCP بتواند
برنامه‌ها را کنترل کند، به مجوزهای محلی سیستم‌عامل نیاز داشته باشد. اگر `computerUse.enabled` برابر true باشد و سرور MCP در دسترس نباشد، نوبت‌های حالت Codex پیش از شروع رشته شکست می‌خورند، به‌جای اینکه بی‌صدا بدون ابزارهای بومی استفاده از رایانه اجرا شوند. برای گزینه‌های marketplace، محدودیت‌های کاتالوگ راه‌دور، دلایل وضعیت، و عیب‌یابی، [استفاده از رایانه در Codex](/fa/plugins/codex-computer-use) را ببینید.

وقتی `computerUse.autoInstall` برابر true باشد، OpenClaw می‌تواند marketplace استاندارد
Codex Desktop همراه را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند، اگر Codex
هنوز marketplace محلی‌ای کشف نکرده باشد. پس از تغییر پیکربندی runtime یا استفاده از رایانه، از `/new` یا `/reset` استفاده کنید تا نشست‌های موجود اتصال قدیمی رشته PI یا Codex را نگه ندارند.

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

تأییدهای Codex بازبینی‌شده توسط Guardian:

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

app-server راه‌دور با headerهای صریح:

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

تعویض مدل تحت کنترل OpenClaw می‌ماند. وقتی یک نشست OpenClaw به یک رشته موجود Codex متصل باشد، نوبت بعدی مدل OpenAI، ارائه‌دهنده، سیاست تأیید، sandbox، و سطح سرویسِ درحال‌حاضر انتخاب‌شده را دوباره به app-server می‌فرستد. تغییر از `openai/gpt-5.5` به `openai/gpt-5.2` اتصال رشته را حفظ می‌کند، اما از Codex می‌خواهد با مدل تازه انتخاب‌شده ادامه دهد.

## فرمان Codex

Plugin همراه، `/codex` را به‌عنوان یک فرمان slash مجاز ثبت می‌کند. این فرمان عمومی است و روی هر کانالی که از فرمان‌های متنی OpenClaw پشتیبانی کند کار می‌کند.

قالب‌های رایج:

- `/codex status` اتصال زنده به سرور برنامه، مدل‌ها، حساب، محدودیت‌های نرخ، سرورهای MCP و Skills را نشان می‌دهد.
- `/codex models` مدل‌های زنده سرور برنامه Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر Codex را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک رشته موجود Codex متصل می‌کند.
- `/codex compact` از سرور برنامه Codex می‌خواهد رشته متصل‌شده را فشرده کند.
- `/codex review` بازبینی بومی Codex را برای رشته متصل‌شده شروع می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد تشخیصی Codex برای رشته متصل‌شده درخواست تأیید می‌کند.
- `/codex computer-use status` Plugin پیکربندی‌شده Computer Use و سرور MCP را بررسی می‌کند.
- `/codex computer-use install` Plugin پیکربندی‌شده Computer Use را نصب می‌کند و سرورهای MCP را دوباره بارگذاری می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP سرور برنامه Codex را فهرست می‌کند.
- `/codex skills` Skills سرور برنامه Codex را فهرست می‌کند.

### گردش‌کار رایج برای اشکال‌زدایی

وقتی یک عامل مبتنی بر Codex در Telegram، Discord، Slack،
یا کانال دیگری کاری غیرمنتظره انجام می‌دهد، از همان گفت‌وگویی شروع کنید که مشکل در آن رخ داده است:

1. دستور `/diagnostics bad tool choice after image upload` یا یادداشت کوتاه دیگری را اجرا کنید
   که آنچه دیده‌اید را توصیف می‌کند.
2. درخواست تشخیص را یک بار تأیید کنید. این تأیید، فایل zip تشخیصی Gateway محلی
   را ایجاد می‌کند و، چون نشست از سازوکار Codex استفاده می‌کند، همچنین
   بسته بازخورد مرتبط Codex را به سرورهای OpenAI ارسال می‌کند.
3. پاسخ تکمیل‌شده تشخیص را در گزارش باگ یا رشته پشتیبانی کپی کنید.
   این پاسخ شامل مسیر بسته محلی، خلاصه حریم خصوصی، شناسه‌های نشست OpenClaw،
   شناسه‌های رشته Codex، و یک خط `Inspect locally` برای هر رشته Codex است.
4. اگر می‌خواهید خودتان اجرای برنامه را اشکال‌زدایی کنید، فرمان چاپ‌شده `Inspect locally`
   را در یک ترمینال اجرا کنید. این فرمان شبیه `codex resume <thread-id>` است و
   رشته بومی Codex را باز می‌کند تا بتوانید گفت‌وگو را بررسی کنید، آن را به‌صورت محلی ادامه دهید،
   یا از Codex بپرسید چرا یک ابزار یا برنامه خاص را انتخاب کرده است.

از `/codex diagnostics [note]` فقط زمانی استفاده کنید که مشخصاً بارگذاری بازخورد Codex
را برای رشته‌ای که اکنون متصل است، بدون بسته کامل تشخیصی Gateway
OpenClaw می‌خواهید. برای بیشتر گزارش‌های پشتیبانی، `/diagnostics [note]`
نقطه شروع بهتری است، چون وضعیت Gateway محلی و شناسه‌های رشته Codex
را در یک پاسخ به هم پیوند می‌دهد. برای مدل کامل حریم خصوصی و رفتار گفت‌وگوی گروهی، [صادرات تشخیص](/fa/gateway/diagnostics)
را ببینید.

هسته OpenClaw همچنین `/diagnostics [note]` ویژه مالک را به‌عنوان فرمان عمومی
تشخیص Gateway ارائه می‌کند. اعلان تأیید آن مقدمه داده‌های حساس
را نشان می‌دهد، به [صادرات تشخیص](/fa/gateway/diagnostics) پیوند می‌دهد، و هر بار
`openclaw gateway diagnostics export --json` را از طریق تأیید صریح اجرا درخواست می‌کند.
تشخیص را با یک قاعده اجازه‌دادن به همه تأیید نکنید. پس از تأیید،
OpenClaw گزارشی قابل جای‌گذاری با مسیر بسته محلی و خلاصه manifest
ارسال می‌کند. وقتی نشست فعال OpenClaw از سازوکار Codex استفاده می‌کند، همان
تأیید همچنین ارسال بسته‌های بازخورد مرتبط Codex به سرورهای OpenAI
را مجاز می‌کند. اعلان تأیید می‌گوید که بازخورد Codex ارسال خواهد شد، اما
پیش از تأیید، شناسه‌های نشست یا رشته Codex را فهرست نمی‌کند.

اگر `/diagnostics` توسط یک مالک در گفت‌وگوی گروهی فراخوانی شود، OpenClaw
کانال مشترک را تمیز نگه می‌دارد: گروه فقط یک اعلان کوتاه دریافت می‌کند، در حالی که
مقدمه تشخیص، اعلان‌های تأیید، و شناسه‌های نشست/رشته Codex از طریق
مسیر خصوصی تأیید برای مالک ارسال می‌شوند. اگر مسیر خصوصی مالک وجود نداشته باشد،
OpenClaw درخواست گروهی را رد می‌کند و از مالک می‌خواهد آن را از یک پیام مستقیم اجرا کند.

بارگذاری تأییدشده Codex، `feedback/upload` سرور برنامه Codex را فراخوانی می‌کند و از
سرور برنامه می‌خواهد، در صورت موجود بودن، لاگ‌های هر رشته فهرست‌شده و زیررشته‌های
ایجادشده Codex را هم شامل کند. بارگذاری از مسیر معمول بازخورد Codex به سرورهای OpenAI
عبور می‌کند؛ اگر بازخورد Codex در آن سرور برنامه غیرفعال باشد، فرمان خطای
سرور برنامه را برمی‌گرداند. پاسخ تکمیل‌شده تشخیص، کانال‌ها،
شناسه‌های نشست OpenClaw، شناسه‌های رشته Codex، و فرمان‌های محلی `codex resume <thread-id>`
را برای رشته‌هایی که ارسال شدند فهرست می‌کند. اگر تأیید را رد یا نادیده بگیرید،
OpenClaw آن شناسه‌های Codex را چاپ نمی‌کند. این بارگذاری جایگزین صادرات تشخیص
Gateway محلی نمی‌شود.

`/codex resume` همان فایل اتصال جانبی را می‌نویسد که سازوکار برای نوبت‌های
عادی استفاده می‌کند. در پیام بعدی، OpenClaw همان رشته Codex را از سر می‌گیرد، مدل
اکنون انتخاب‌شده OpenClaw را به سرور برنامه می‌فرستد، و تاریخچه گسترده را
فعال نگه می‌دارد.

### بررسی یک رشته Codex از CLI

سریع‌ترین راه برای فهمیدن یک اجرای بد Codex اغلب این است که رشته بومی Codex
را مستقیماً باز کنید:

```sh
codex resume <thread-id>
```

وقتی در یک گفت‌وگوی کانالی متوجه باگی می‌شوید و می‌خواهید نشست مشکل‌دار
Codex را بررسی کنید، آن را به‌صورت محلی ادامه دهید، یا از Codex بپرسید چرا یک
ابزار یا انتخاب استدلالی خاص را انجام داده است، از این روش استفاده کنید. ساده‌ترین مسیر معمولاً این است که ابتدا
`/diagnostics [note]` را اجرا کنید: پس از تأیید، گزارش تکمیل‌شده هر
رشته Codex را فهرست می‌کند و یک فرمان `Inspect locally` چاپ می‌کند، برای نمونه
`codex resume <thread-id>`. می‌توانید آن فرمان را مستقیماً در ترمینال کپی کنید.

همچنین می‌توانید شناسه رشته را از `/codex binding` برای گفت‌وگوی فعلی یا
`/codex threads [filter]` برای رشته‌های اخیر سرور برنامه Codex بگیرید، سپس همان فرمان
`codex resume` را در پوسته خود اجرا کنید.

سطح فرمان به سرور برنامه Codex نسخه `0.125.0` یا جدیدتر نیاز دارد. اگر
یک سرور برنامه آینده یا سفارشی آن متد JSON-RPC را ارائه نکند، روش‌های کنترلی
تکی با پیام `unsupported by this Codex app-server` گزارش می‌شوند.

## مرزهای هوک

سازوکار Codex سه لایه هوک دارد:

| لایه                                  | مالک                     | هدف                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| هوک‌های Plugin در OpenClaw            | OpenClaw                 | سازگاری محصول/Plugin در سازوکارهای PI و Codex.                     |
| میان‌افزار افزونه سرور برنامه Codex  | Pluginهای همراه OpenClaw | رفتار آداپتور در هر نوبت پیرامون ابزارهای پویای OpenClaw.          |
| هوک‌های بومی Codex                   | Codex                    | چرخه عمر سطح پایین Codex و خط‌مشی ابزار بومی از پیکربندی Codex.    |

OpenClaw از فایل‌های `hooks.json` پروژه یا سراسری Codex برای مسیریابی
رفتار Plugin در OpenClaw استفاده نمی‌کند. برای پل پشتیبانی‌شده ابزار بومی و مجوز،
OpenClaw پیکربندی Codex در سطح هر رشته را برای `PreToolUse`، `PostToolUse`،
`PermissionRequest`، و `Stop` تزریق می‌کند. سایر هوک‌های Codex مانند `SessionStart` و
`UserPromptSubmit` کنترل‌های سطح Codex باقی می‌مانند؛ آن‌ها در قرارداد v1
به‌عنوان هوک‌های Plugin در OpenClaw ارائه نمی‌شوند.

برای ابزارهای پویای OpenClaw، OpenClaw پس از آنکه Codex درخواست فراخوانی کرد
ابزار را اجرا می‌کند، بنابراین OpenClaw رفتار Plugin و میان‌افزاری را که مالک آن است در
آداپتور سازوکار اجرا می‌کند. برای ابزارهای بومی Codex، Codex مالک رکورد معتبر ابزار است.
OpenClaw می‌تواند رویدادهای منتخب را بازتاب دهد، اما نمی‌تواند رشته بومی Codex
را بازنویسی کند مگر اینکه Codex آن عملیات را از طریق سرور برنامه یا callbackهای هوک بومی
ارائه کند.

Compaction و برون‌نمایی‌های چرخه عمر LLM از اعلان‌های سرور برنامه Codex
و وضعیت آداپتور OpenClaw می‌آیند، نه از فرمان‌های هوک بومی Codex.
رویدادهای `before_compaction`، `after_compaction`، `llm_input`، و
`llm_output` در OpenClaw مشاهدات سطح آداپتور هستند، نه ضبط بایت‌به‌بایت
درخواست داخلی Codex یا payloadهای Compaction.

اعلان‌های سرور برنامه بومی Codex با نام‌های `hook/started` و `hook/completed`
به‌عنوان رویدادهای عامل `codex_app_server.hook` برای مسیر اجرا و اشکال‌زدایی
برون‌نمایی می‌شوند. آن‌ها هوک‌های Plugin در OpenClaw را فراخوانی نمی‌کنند.

## قرارداد پشتیبانی V1

حالت Codex همان PI با یک فراخوانی مدل متفاوت در زیر آن نیست. Codex مالک بخش بیشتری از
حلقه مدل بومی است، و OpenClaw سطح‌های Plugin و نشست خود را پیرامون
آن مرز تطبیق می‌دهد.

پشتیبانی‌شده در زمان اجرای Codex نسخه v1:

| سطح                                          | پشتیبانی                                | دلیل                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حلقه مدل OpenAI از طریق Codex                 | پشتیبانی می‌شود                         | سرور برنامه Codex مالک نوبت OpenAI، ازسرگیری رشته بومی، و ادامه ابزار بومی است.                                                                                                                     |
| مسیریابی و تحویل کانال OpenClaw              | پشتیبانی می‌شود                         | Telegram، Discord، Slack، WhatsApp، iMessage و کانال‌های دیگر بیرون از زمان اجرای مدل می‌مانند.                                                                                                     |
| ابزارهای پویای OpenClaw                      | پشتیبانی می‌شود                         | Codex از OpenClaw می‌خواهد این ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.                                                                                                   |
| Pluginهای اعلان و زمینه                      | پشتیبانی می‌شود                         | OpenClaw پوشش‌های اعلان را می‌سازد و پیش از شروع یا ازسرگیری رشته، زمینه را به نوبت Codex برون‌نمایی می‌کند.                                                                                        |
| چرخه عمر موتور زمینه                          | پشتیبانی می‌شود                         | مونتاژ، نگهداری پس از دریافت یا پس از نوبت، و هماهنگی Compaction موتور زمینه برای نوبت‌های Codex اجرا می‌شود.                                                                                      |
| هوک‌های ابزار پویا                            | پشتیبانی می‌شود                         | `before_tool_call`، `after_tool_call`، و میان‌افزار نتیجه ابزار پیرامون ابزارهای پویای تحت مالکیت OpenClaw اجرا می‌شوند.                                                                            |
| هوک‌های چرخه عمر                              | به‌عنوان مشاهدات آداپتور پشتیبانی می‌شود | `llm_input`، `llm_output`، `agent_end`، `before_compaction`، و `after_compaction` با payloadهای صادقانه حالت Codex اجرا می‌شوند.                                                                      |
| دروازه بازنگری پاسخ نهایی                    | از طریق بازپخش هوک بومی پشتیبانی می‌شود | `Stop` در Codex به `before_agent_finalize` بازپخش می‌شود؛ `revise` از Codex یک گذر مدل دیگر پیش از نهایی‌سازی درخواست می‌کند.                                                                       |
| مسدودسازی یا مشاهده پوسته، patch، و MCP بومی | از طریق بازپخش هوک بومی پشتیبانی می‌شود | `PreToolUse` و `PostToolUse` در Codex برای سطح‌های ابزار بومی ثبت‌شده بازپخش می‌شوند، از جمله payloadهای MCP روی سرور برنامه Codex نسخه `0.125.0` یا جدیدتر. مسدودسازی پشتیبانی می‌شود؛ بازنویسی آرگومان نه. |
| خط‌مشی مجوز بومی                              | از طریق بازپخش هوک بومی پشتیبانی می‌شود | `PermissionRequest` در Codex می‌تواند در جایی که زمان اجرا آن را ارائه می‌کند از طریق خط‌مشی OpenClaw مسیریابی شود. اگر OpenClaw تصمیمی برنگرداند، Codex از مسیر معمول guardian یا تأیید کاربر ادامه می‌دهد. |
| ضبط مسیر اجرای سرور برنامه                   | پشتیبانی می‌شود                         | OpenClaw درخواستی را که به سرور برنامه فرستاده و اعلان‌های سرور برنامه را که دریافت می‌کند ثبت می‌کند.                                                                                              |

در زمان اجرای Codex نسخه v1 پشتیبانی نمی‌شود:

| سطح                                                | مرز V1                                                                                                                                     | مسیر آینده                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| تغییر آرگومان ابزار بومی                       | hookهای پیش‌ابزار بومی Codex می‌توانند مسدود کنند، اما OpenClaw آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند.                                               | نیازمند پشتیبانی hook/schema در Codex برای جایگزینی ورودی ابزار است.                            |
| تاریخچه transcript بومی Codex قابل ویرایش            | Codex مالک تاریخچه thread بومی canonical است. OpenClaw مالک یک آینه است و می‌تواند context آینده را project کند، اما نباید internalهای پشتیبانی‌نشده را تغییر دهد. | اگر جراحی thread بومی لازم باشد، APIهای صریح app-server در Codex اضافه شود.                    |
| `tool_result_persist` برای رکوردهای ابزار بومی Codex | آن hook نوشتن‌های transcript تحت مالکیت OpenClaw را transform می‌کند، نه رکوردهای ابزار بومی Codex را.                                                           | می‌تواند رکوردهای transform‌شده را آینه کند، اما بازنویسی canonical نیازمند پشتیبانی Codex است.              |
| metadata غنی Compaction بومی                     | OpenClaw شروع و تکمیل Compaction را مشاهده می‌کند، اما فهرست پایدار موارد نگه‌داشته/حذف‌شده، delta توکن، یا payload خلاصه دریافت نمی‌کند.            | نیازمند رویدادهای غنی‌تر Compaction در Codex است.                                                     |
| مداخله در Compaction                             | hookهای فعلی Compaction در OpenClaw در حالت Codex در سطح اعلان هستند.                                                                         | اگر Pluginها نیاز دارند Compaction بومی را veto یا بازنویسی کنند، hookهای پیش/پس از Compaction در Codex اضافه شود. |
| ضبط byte-for-byte درخواست API مدل             | OpenClaw می‌تواند درخواست‌ها و اعلان‌های app-server را ضبط کند، اما core در Codex درخواست نهایی API OpenAI را به‌صورت داخلی می‌سازد.                      | نیازمند یک رویداد tracing درخواست مدل در Codex یا API debug است.                                   |

## ابزارها، رسانه، و Compaction

harness در Codex فقط executor عامل embedded سطح پایین را تغییر می‌دهد.

OpenClaw همچنان فهرست ابزار را می‌سازد و نتایج ابزار پویا را از
harness دریافت می‌کند. متن، تصویر، ویدیو، موسیقی، TTS، approvalها، و خروجی ابزارهای پیام‌رسانی
از مسیر عادی تحویل OpenClaw ادامه پیدا می‌کنند.

relay بومی hook عمدا generic است، اما قرارداد پشتیبانی v1
به مسیرهای ابزار و permission بومی Codex که OpenClaw آن‌ها را تست می‌کند محدود است. در
runtime در Codex، این شامل payloadهای shell، patch، و MCP `PreToolUse`،
`PostToolUse`، و `PermissionRequest` است. فرض نکنید هر رویداد hook آینده در
Codex یک سطح Plugin در OpenClaw است مگر اینکه قرارداد runtime آن را نام ببرد.

برای `PermissionRequest`، OpenClaw فقط زمانی تصمیم‌های صریح allow یا deny را برمی‌گرداند
که policy تصمیم بگیرد. نتیجه بدون تصمیم allow نیست. Codex آن را به‌عنوان نبود
تصمیم hook در نظر می‌گیرد و به مسیر guardian خودش یا approval کاربر ادامه می‌دهد.

elicitationهای approval ابزار MCP در Codex از طریق جریان approval Plugin در OpenClaw
مسیردهی می‌شوند وقتی Codex مقدار `_meta.codex_approval_kind` را
`"mcp_tool_call"` قرار دهد. promptهای `request_user_input` در Codex به
chat مبدا برگردانده می‌شوند، و پیام follow-up بعدی در صف به آن درخواست native
server پاسخ می‌دهد به‌جای اینکه به‌عنوان context اضافه هدایت شود. سایر درخواست‌های elicitation
در MCP همچنان بسته شکست می‌خورند.

steering صف active-run به `turn/steer` در app-server در Codex نگاشت می‌شود. با
پیش‌فرض `messages.queue.mode: "steer"`، OpenClaw پیام‌های chat صف‌شده را
برای پنجره سکوت پیکربندی‌شده batch می‌کند و آن‌ها را به‌عنوان یک درخواست `turn/steer` به‌ترتیب
رسیدن می‌فرستد. حالت legacy `queue` درخواست‌های جداگانه `turn/steer` می‌فرستد. turnهای
review و Compaction دستی در Codex می‌توانند steering همان turn را رد کنند؛ در این صورت
OpenClaw وقتی حالت انتخاب‌شده fallback را مجاز بداند، از صف followup استفاده می‌کند. ببینید
[صف steering](/fa/concepts/queue-steering).

وقتی مدل انتخاب‌شده از harness در Codex استفاده می‌کند، Compaction thread بومی
به app-server در Codex واگذار می‌شود. OpenClaw یک آینه transcript برای تاریخچه channel،
جستجو، `/new`، `/reset`، و تغییر مدل یا harness در آینده نگه می‌دارد. این
آینه شامل prompt کاربر، متن نهایی assistant، و رکوردهای سبک reasoning یا plan در Codex
است وقتی app-server آن‌ها را emit کند. امروز، OpenClaw فقط
سیگنال‌های شروع و تکمیل Compaction بومی را ثبت می‌کند. هنوز خلاصه‌ای
خوانا برای انسان از Compaction یا فهرست قابل audit از اینکه Codex کدام entryها را
پس از Compaction نگه داشته expose نمی‌کند.

چون Codex مالک thread بومی canonical است، `tool_result_persist` در حال حاضر
رکوردهای نتیجه ابزار بومی Codex را بازنویسی نمی‌کند. این فقط زمانی اعمال می‌شود که
OpenClaw در حال نوشتن نتیجه ابزار transcript یک session تحت مالکیت OpenClaw باشد.

تولید رسانه به PI نیاز ندارد. تصویر، ویدیو، موسیقی، PDF، TTS، و درک رسانه
همچنان از تنظیمات provider/model متناظر مثل
`agents.defaults.imageGenerationModel`، `videoGenerationModel`، `pdfModel`، و
`messages.tts` استفاده می‌کنند.

## عیب‌یابی

**Codex به‌عنوان یک provider عادی `/model` ظاهر نمی‌شود:** این برای
configهای جدید مورد انتظار است. یک مدل `openai/gpt-*` را با
`agentRuntime.id: "codex"` (یا یک ref legacy مثل `codex/*`) انتخاب کنید، 
`plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید آیا `plugins.allow`
مقدار `codex` را exclude می‌کند یا نه.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** `agentRuntime.id: "auto"` همچنان می‌تواند از PI به‌عنوان
backend سازگاری استفاده کند وقتی هیچ harness در Codex run را claim نکند. برای
اجبار انتخاب Codex هنگام تست، `agentRuntime.id: "codex"` را تنظیم کنید. runtime اجباری
Codex اکنون به‌جای fallback به PI شکست می‌خورد مگر اینکه صراحتا
`agentRuntime.fallback: "pi"` را تنظیم کنید. وقتی app-server در Codex
انتخاب شد، failureهای آن مستقیما و بدون config اضافه fallback نمایان می‌شوند.

**app-server رد می‌شود:** Codex را ارتقا دهید تا handshake در app-server
نسخه `0.125.0` یا جدیدتر را گزارش کند. prereleaseهای هم‌نسخه یا نسخه‌های دارای پسوند build
مثل `0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند چون
کف پروتکل stable `0.125.0` همان چیزی است که OpenClaw تست می‌کند.

**کشف مدل کند است:** مقدار `plugins.entries.codex.config.discovery.timeoutMs` را کاهش دهید
یا discovery را غیرفعال کنید.

**انتقال WebSocket فورا شکست می‌خورد:** `appServer.url`، `authToken`،
و اینکه app-server راه دور همان نسخه پروتکل app-server در Codex را صحبت می‌کند بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این مورد انتظار است مگر اینکه
`agentRuntime.id: "codex"` را برای آن agent مجبور کرده باشید یا یک ref legacy
مثل `codex/*` انتخاب کرده باشید. refهای ساده `openai/gpt-*` و سایر providerها در حالت
`auto` روی مسیر provider عادی خود می‌مانند. اگر `agentRuntime.id: "codex"` را مجبور کنید، هر turn embedded
برای آن agent باید یک مدل OpenAI پشتیبانی‌شده توسط Codex باشد.

**Computer Use نصب شده اما ابزارها اجرا نمی‌شوند:** از یک session تازه
`/codex computer-use status` را بررسی کنید. اگر یک ابزار
`Native hook relay unavailable` گزارش کند، از `/new` یا `/reset` استفاده کنید؛ اگر باقی ماند، Gateway را restart کنید
تا registrationهای stale بومی hook پاک شوند. اگر `computer-use.list_apps`
timeout شد، Codex Computer Use یا Codex Desktop را restart کنید و دوباره تلاش کنید.

## مرتبط

- [Pluginهای harness عامل](/fa/plugins/sdk-agent-harness)
- [runtimeهای عامل](/fa/concepts/agent-runtimes)
- [providerهای مدل](/fa/concepts/model-providers)
- [provider OpenAI](/fa/providers/openai)
- [وضعیت](/fa/cli/status)
- [hookهای Plugin](/fa/plugins/hooks)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [تست](/fa/help/testing-live#live-codex-app-server-harness-smoke)

---
read_when:
    - می‌خواهید از هارنس app-server همراه Codex استفاده کنید
    - به نمونه‌های پیکربندی چارچوب اجرایی Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به PI با شکست مواجه شوند
summary: نوبت‌های عامل تعبیه‌شدهٔ OpenClaw را از طریق هارنس app-server همراه Codex اجرا کنید
title: هارنس Codex
x-i18n:
    generated_at: "2026-05-06T09:32:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw اجازه می‌دهد نوبت‌های عامل تعبیه‌شده را به‌جای PI harness داخلی، از طریق Codex app-server اجرا کند.

وقتی می‌خواهید Codex مالک نشست سطح پایین عامل باشد، از این استفاده کنید: کشف مدل، ادامه دادن thread بومی، Compaction بومی، و اجرای app-server. OpenClaw همچنان مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل، ابزارها، تأییدها، تحویل رسانه، و آینه transcript قابل مشاهده است.

وقتی یک نوبت چت منبع از طریق Codex harness اجرا می‌شود، اگر استقرار به‌صورت صریح `messages.visibleReplies` را پیکربندی نکرده باشد، پاسخ‌های قابل مشاهده به‌طور پیش‌فرض از ابزار `message` در OpenClaw استفاده می‌کنند. عامل همچنان می‌تواند نوبت Codex خود را به‌صورت خصوصی تمام کند؛ فقط وقتی به کانال پست می‌کند که `message(action="send")` را فراخوانی کند. برای نگه داشتن پاسخ‌های نهایی چت مستقیم در مسیر تحویل خودکار قدیمی، `messages.visibleReplies: "automatic"` را تنظیم کنید.

نوبت‌های Heartbeat در Codex نیز به‌طور پیش‌فرض ابزار `heartbeat_respond` را دریافت می‌کنند، تا عامل بتواند بدون رمزگذاری آن جریان کنترل در متن نهایی، ثبت کند که آیا بیدارباش باید ساکت بماند یا اعلان ارسال کند.

راهنمای initiative مخصوص Heartbeat به‌عنوان یک دستور توسعه‌دهنده حالت همکاری Codex روی خود نوبت Heartbeat ارسال می‌شود. نوبت‌های چت عادی به‌جای حمل فلسفه Heartbeat در prompt اجرایی عادی خود، حالت Codex Default را بازیابی می‌کنند.

اگر می‌خواهید جهت‌گیری اولیه پیدا کنید، از
[زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) شروع کنید. نسخه کوتاه این است:
`openai/gpt-5.5` ارجاع مدل است، `codex` زمان اجرا است، و Telegram،
Discord، Slack، یا یک کانال دیگر سطح ارتباطی باقی می‌ماند.

## پیکربندی سریع

بیشتر کاربرانی که «Codex در OpenClaw» می‌خواهند، این مسیر را می‌خواهند: با یک اشتراک ChatGPT/Codex وارد شوید، سپس نوبت‌های عامل تعبیه‌شده را از طریق زمان اجرای بومی Codex app-server اجرا کنید. ارجاع مدل همچنان به‌صورت canonical با
`openai/gpt-*` باقی می‌ماند؛ احراز هویت اشتراک از حساب/پروفایل Codex می‌آید، نه از پیشوند مدل `openai-codex/*`.

اگر هنوز انجام نداده‌اید، ابتدا با Codex OAuth وارد شوید:

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
      },
    },
  },
}
```

اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را هم آنجا اضافه کنید:

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

در پیکربندی از `openai-codex/gpt-*` استفاده نکنید. این پیشوند یک مسیر قدیمی است که
`openclaw doctor --fix` آن را در مدل‌های اصلی، fallbackها، overrideهای heartbeat/subagent/compaction، hookها، overrideهای کانال، و pinهای مسیر نشست persist‌شده قدیمی به `openai/gpt-*` بازنویسی می‌کند.

## این Plugin چه چیزی را تغییر می‌دهد

Plugin همراه `codex` چند capability جداگانه اضافه می‌کند:

| Capability                        | چگونه از آن استفاده می‌کنید                         | چه کاری انجام می‌دهد                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| زمان اجرای تعبیه‌شده بومی         | `agentRuntime.id: "codex"`                          | نوبت‌های عامل تعبیه‌شده OpenClaw را از طریق Codex app-server اجرا می‌کند.     |
| فرمان‌های کنترل چت بومی           | `/codex bind`, `/codex resume`, `/codex steer`, ... | threadهای Codex app-server را از یک گفت‌وگوی پیام‌رسان bind و کنترل می‌کند.  |
| provider/catalog برای Codex app-server | داخلی‌های `codex`، که از طریق harness عرضه می‌شوند | به زمان اجرا اجازه می‌دهد مدل‌های app-server را کشف و اعتبارسنجی کند.        |
| مسیر درک رسانه در Codex           | مسیرهای سازگاری مدل تصویر `codex/*`                 | نوبت‌های محدود Codex app-server را برای مدل‌های پشتیبانی‌شده درک تصویر اجرا می‌کند. |
| relay بومی hook                   | Plugin hookها پیرامون رویدادهای بومی Codex          | به OpenClaw اجازه می‌دهد رویدادهای پشتیبانی‌شده ابزار/نهایی‌سازی بومی Codex را مشاهده/مسدود کند. |

فعال کردن Plugin این capabilityها را در دسترس قرار می‌دهد. این کار **انجام نمی‌دهد**:

- شروع استفاده از Codex برای هر مدل OpenAI
- تبدیل ارجاع‌های مدل `openai-codex/*` به زمان اجرای بومی بدون اینکه doctor تأیید کند Codex نصب و فعال است، harness با نام `codex` را ارائه می‌کند، و برای OAuth آماده است
- پیش‌فرض کردن ACP/acpx به‌عنوان مسیر Codex
- تعویض داغ نشست‌های موجودی که از قبل زمان اجرای PI را ثبت کرده‌اند
- جایگزینی تحویل کانال OpenClaw، فایل‌های نشست، ذخیره‌سازی پروفایل احراز هویت، یا مسیریابی پیام

همین Plugin مالک سطح فرمان کنترل چت بومی `/codex` نیز هست. اگر Plugin فعال باشد و کاربر بخواهد threadهای Codex را از چت bind، resume، steer، stop، یا inspect کند، عامل‌ها باید `/codex ...` را به ACP ترجیح دهند. وقتی کاربر ACP/acpx را درخواست می‌کند یا در حال آزمایش adapter Codex برای ACP است، ACP fallback صریح باقی می‌ماند.

نوبت‌های بومی Codex، Plugin hookهای OpenClaw را به‌عنوان لایه سازگاری عمومی نگه می‌دارند. این‌ها hookهای درون‌فرآیندی OpenClaw هستند، نه hookهای فرمان `hooks.json` در Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` برای رکوردهای transcript آینه‌شده
- `before_agent_finalize` از طریق relay مربوط به Codex `Stop`
- `agent_end`

Pluginها همچنین می‌توانند middleware نتیجه ابزارِ مستقل از زمان اجرا ثبت کنند تا پس از اجرای ابزار توسط OpenClaw و پیش از بازگرداندن نتیجه به Codex، نتایج ابزار dynamic در OpenClaw را بازنویسی کنند. این جدا از Plugin hook عمومی
`tool_result_persist` است که نوشتن‌های نتیجه ابزار transcript تحت مالکیت OpenClaw را تبدیل می‌کند.

برای خود معناشناسی Plugin hookها، [Plugin hooks](/fa/plugins/hooks)
و [رفتار guard در Plugin](/fa/tools/plugin) را ببینید.

harness به‌طور پیش‌فرض خاموش است. پیکربندی‌های جدید باید ارجاع‌های مدل OpenAI را به‌صورت canonical با `openai/gpt-*` نگه دارند و وقتی اجرای بومی app-server را می‌خواهند، به‌صورت صریح
`agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex` را اجباری کنند. ارجاع‌های مدل قدیمی `codex/*` همچنان برای سازگاری به‌صورت خودکار harness را انتخاب می‌کنند، اما پیشوندهای provider قدیمی متکی به runtime به‌عنوان انتخاب‌های عادی model/provider نمایش داده نمی‌شوند.

اگر هر مسیر مدل پیکربندی‌شده هنوز `openai-codex/*` باشد، `openclaw doctor --fix`
آن را به `openai/*` بازنویسی می‌کند. برای مسیرهای عامل مطابق، فقط وقتی Codex Plugin نصب و فعال باشد، harness با نام
`codex` را ارائه کند، و OAuth قابل استفاده داشته باشد، زمان اجرای عامل را روی `codex` تنظیم می‌کند؛ در غیر این صورت زمان اجرا را روی `pi` تنظیم می‌کند.

## نقشه مسیر

پیش از تغییر پیکربندی از این جدول استفاده کنید:

| رفتار مطلوب                                          | ارجاع مدل                  | پیکربندی زمان اجرا                      | مسیر احراز هویت/پروفایل      | برچسب وضعیت مورد انتظار        |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| اشتراک ChatGPT/Codex با زمان اجرای بومی Codex       | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth یا حساب Codex    | `Runtime: OpenAI Codex`        |
| OpenAI API از طریق runner عادی OpenClaw             | `openai/gpt-*`             | حذف‌شده یا `runtime: "pi"`             | کلید OpenAI API              | `Runtime: OpenClaw Pi Default` |
| پیکربندی قدیمی که به تعمیر doctor نیاز دارد          | `openai-codex/gpt-*`       | تعمیرشده به `codex` یا `pi`            | احراز هویت پیکربندی‌شده موجود | پس از `doctor --fix` دوباره بررسی کنید |
| providerهای ترکیبی با حالت خودکار محافظه‌کارانه     | ارجاع‌های مخصوص provider   | `agentRuntime.id: "auto"`              | به‌ازای provider انتخاب‌شده  | به زمان اجرای انتخاب‌شده بستگی دارد |
| نشست صریح adapter Codex برای ACP                     | وابسته به prompt/model در ACP | `sessions_spawn` با `runtime: "acp"` | احراز هویت backend مربوط به ACP | وضعیت task/session در ACP      |

تفکیک مهم، provider در برابر runtime است:

- `openai-codex/*` یک مسیر قدیمی است که doctor بازنویسی می‌کند.
- `agentRuntime.id: "codex"` به Codex harness نیاز دارد و اگر در دسترس نباشد به‌صورت بسته شکست می‌خورد.
- `agentRuntime.id: "auto"` به harnessهای ثبت‌شده اجازه می‌دهد مسیرهای provider مطابق را claim کنند، اما ارجاع‌های canonical OpenAI همچنان در مالکیت PI هستند مگر اینکه یک harness از آن جفت provider/model پشتیبانی کند.
- `/codex ...` به این پاسخ می‌دهد که «کدام گفت‌وگوی بومی Codex باید به این چت bind شود یا کنترل شود؟»
- ACP به این پاسخ می‌دهد که «acpx باید کدام فرآیند harness خارجی را راه‌اندازی کند؟»

## انتخاب پیشوند مدل درست

مسیرهای خانواده OpenAI به پیشوند وابسته‌اند. برای راه‌اندازی رایج اشتراک به‌همراه زمان اجرای بومی Codex، از `openai/*` با `agentRuntime.id: "codex"` استفاده کنید.
با `openai-codex/*` مثل پیکربندی قدیمی برخورد کنید که doctor باید آن را بازنویسی کند:

| ارجاع مدل                                     | مسیر زمان اجرا                              | زمان استفاده                                                               |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | provider OpenAI از طریق plumbing در OpenClaw/PI | وقتی دسترسی فعلی مستقیم OpenAI Platform API را با `OPENAI_API_KEY` می‌خواهید. |
| `openai-codex/gpt-5.5`                        | مسیر قدیمی که doctor آن را تعمیر می‌کند      | وقتی روی پیکربندی قدیمی هستید؛ برای بازنویسی آن `openclaw doctor --fix` را اجرا کنید. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | وقتی احراز هویت اشتراک ChatGPT/Codex را با اجرای بومی Codex می‌خواهید.     |

وقتی حساب شما آن‌ها را ارائه کند، GPT-5.5 می‌تواند هم روی مسیرهای مستقیم کلید API در OpenAI و هم مسیرهای اشتراک Codex ظاهر شود. برای زمان اجرای بومی Codex از `openai/gpt-5.5` با Codex app-server
harness استفاده کنید، یا برای ترافیک مستقیم کلید API از `openai/gpt-5.5` بدون override زمان اجرای Codex استفاده کنید.

ارجاع‌های قدیمی `codex/gpt-*` همچنان به‌عنوان aliasهای سازگاری پذیرفته می‌شوند. migration سازگاری doctor ارجاع‌های runtime قدیمی را به ارجاع‌های مدل canonical بازنویسی می‌کند و policy زمان اجرا را جداگانه ثبت می‌کند. پیکربندی‌های جدید harness بومی app-server باید از `openai/gpt-*` به‌همراه `agentRuntime.id: "codex"` استفاده کنند.

`agents.defaults.imageModel` از همان تفکیک پیشوند پیروی می‌کند. برای مسیر عادی OpenAI از
`openai/gpt-*` استفاده کنید و وقتی درک تصویر باید از طریق یک نوبت محدود Codex app-server اجرا شود از `codex/gpt-*` استفاده کنید. از
`openai-codex/gpt-*` استفاده نکنید؛ doctor آن پیشوند قدیمی را به `openai/gpt-*` بازنویسی می‌کند. مدل Codex app-server باید پشتیبانی ورودی تصویر را advertise کند؛ مدل‌های Codex فقط‌متنی پیش از شروع نوبت رسانه شکست می‌خورند.

برای تأیید harness مؤثر نشست فعلی از `/status` استفاده کنید. اگر انتخاب غافلگیرکننده است، logging اشکال‌زدایی را برای زیرسیستم `agents/harness` فعال کنید و رکورد ساختاریافته `agent harness selected` در Gateway را inspect کنید. این رکورد شامل id harness انتخاب‌شده، دلیل انتخاب، policy زمان اجرا/fallback، و در حالت `auto`، نتیجه پشتیبانی هر نامزد Plugin است.

### هشدارهای doctor چه معنایی دارند

`openclaw doctor` وقتی هشدار می‌دهد که ارجاع‌های مدل پیکربندی‌شده یا وضعیت مسیر نشست persist‌شده هنوز از `openai-codex/*` استفاده کنند. `openclaw doctor --fix` آن مسیرها را به موارد زیر بازنویسی می‌کند:

- `openai/<model>`
- `agentRuntime.id: "codex"` وقتی Codex نصب و فعال باشد، harness با نام
  `codex` را ارائه کند، و OAuth قابل استفاده داشته باشد
- در غیر این صورت `agentRuntime.id: "pi"`

مسیر `codex`، Codex harness بومی را اجباری می‌کند. مسیر `pi` عامل را روی runner پیش‌فرض OpenClaw نگه می‌دارد، به‌جای اینکه به‌عنوان اثر جانبی پاک‌سازی مسیر قدیمی، Codex را فعال یا نصب کند.
Doctor همچنین pinهای stale نشست persist‌شده را در storeهای نشست عامل کشف‌شده تعمیر می‌کند تا گفت‌وگوهای قدیمی روی مسیر حذف‌شده گیر نکنند.

انتخاب هارنس یک کنترل نشست زنده نیست. وقتی یک نوبت تعبیه‌شده اجرا می‌شود،
OpenClaw شناسه هارنس انتخاب‌شده را روی آن نشست ثبت می‌کند و برای نوبت‌های
بعدی در همان شناسه نشست همچنان از آن استفاده می‌کند. وقتی می‌خواهید نشست‌های آینده از هارنس دیگری استفاده کنند، پیکربندی `agentRuntime` یا
`OPENCLAW_AGENT_RUNTIME` را تغییر دهید؛ برای شروع یک نشست تازه، پیش از جابه‌جایی یک گفت‌وگوی موجود بین PI و Codex از `/new` یا `/reset` استفاده کنید. این کار از بازپخش یک رونوشت از طریق
دو سامانه نشست بومی ناسازگار جلوگیری می‌کند.

نشست‌های قدیمی که پیش از پین‌های هارنس ایجاد شده‌اند، پس از آنکه
سابقه رونوشت داشته باشند، پین‌شده به PI در نظر گرفته می‌شوند. پس از تغییر پیکربندی، برای وارد کردن آن گفت‌وگو به
Codex از `/new` یا `/reset` استفاده کنید.

`/status` محیط اجرای مؤثر مدل را نشان می‌دهد. هارنس پیش‌فرض PI به صورت
`Runtime: OpenClaw Pi Default` نمایش داده می‌شود، و هارنس app-server متعلق به Codex به صورت
`Runtime: OpenAI Codex` نمایش داده می‌شود.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس.
- app-server متعلق به Codex نسخه `0.125.0` یا جدیدتر. Plugin همراه، به طور پیش‌فرض یک باینری app-server سازگار Codex را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex` در `PATH` روی راه‌اندازی عادی هارنس اثر نمی‌گذارند.
- احراز هویت Codex برای فرایند app-server یا برای پل احراز هویت Codex متعلق به OpenClaw در دسترس باشد. راه‌اندازی‌های app-server محلی برای هر عامل از یک خانه Codex مدیریت‌شده توسط OpenClaw و یک `HOME` فرزند ایزوله استفاده می‌کنند، بنابراین به طور پیش‌فرض حساب شخصی
  `~/.codex`، Skills، Pluginها، پیکربندی، وضعیت رشته، یا
  `$HOME/.agents/skills` بومی شما را نمی‌خوانند.

Plugin دست‌دهی‌های app-server قدیمی‌تر یا بدون نسخه را مسدود می‌کند. این کار
OpenClaw را روی سطح پروتکلی نگه می‌دارد که در برابر آن آزموده شده است.

برای آزمون‌های smoke زنده و Docker، احراز هویت معمولاً از حساب CLI متعلق به Codex
یا یک نمایه احراز هویت `openai-codex` متعلق به OpenClaw می‌آید. راه‌اندازی‌های app-server محلی stdio همچنین می‌توانند وقتی هیچ حسابی وجود ندارد به `CODEX_API_KEY` / `OPENAI_API_KEY` بازگردند.

## فایل‌های راه‌اندازی فضای کاری

Codex خودش `AGENTS.md` را از طریق کشف بومی سندهای پروژه مدیریت می‌کند. OpenClaw
فایل‌های سند پروژه مصنوعی Codex نمی‌نویسد و برای فایل‌های پرسونای خود به نام‌های جایگزین Codex وابسته نیست، چون جایگزین‌های Codex فقط وقتی اعمال می‌شوند که
`AGENTS.md` موجود نباشد.

برای برابری فضای کاری OpenClaw، هارنس Codex فایل‌های راه‌اندازی دیگر را حل می‌کند
(`SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`,
`BOOTSTRAP.md`، و `MEMORY.md` در صورت وجود) و آن‌ها را از طریق دستورالعمل‌های توسعه‌دهنده Codex روی `thread/start` و `thread/resume` ارسال می‌کند. این کار
`SOUL.md` و زمینه پرسونای/نمایه فضای کاری مرتبط را روی مسیر بومی شکل‌دهی رفتار Codex قابل مشاهده نگه می‌دارد، بدون آنکه `AGENTS.md` تکرار شود.

## افزودن Codex در کنار مدل‌های دیگر

اگر همان عامل باید بتواند آزادانه بین Codex و مدل‌های ارائه‌دهنده غیر Codex جابه‌جا شود، `agentRuntime.id: "codex"` را به صورت سراسری تنظیم نکنید. یک محیط اجرای اجباری برای هر
نوبت تعبیه‌شده آن عامل یا نشست اعمال می‌شود. اگر در حالی که آن محیط اجرا اجباری است یک مدل Anthropic انتخاب کنید، OpenClaw همچنان هارنس Codex را امتحان می‌کند و به جای مسیریابی بی‌صدای آن نوبت از طریق PI، به صورت بسته شکست می‌خورد.

به جای آن از یکی از این شکل‌ها استفاده کنید:

- Codex را روی یک عامل اختصاصی با `agentRuntime.id: "codex"` قرار دهید.
- عامل پیش‌فرض را روی `agentRuntime.id: "auto"` و بازگشت سازگاری PI برای استفاده معمول ترکیبی از ارائه‌دهندگان نگه دارید.
- از ارجاع‌های قدیمی `codex/*` فقط برای سازگاری استفاده کنید. پیکربندی‌های جدید باید
  `openai/*` را همراه با یک سیاست محیط اجرای صریح Codex ترجیح دهند.

برای مثال، این پیکربندی عامل پیش‌فرض را روی انتخاب خودکار عادی نگه می‌دارد و
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

- عامل پیش‌فرض `main` از مسیر عادی ارائه‌دهنده و بازگشت سازگاری PI استفاده می‌کند.
- عامل `codex` از هارنس app-server متعلق به Codex استفاده می‌کند.
- اگر Codex برای عامل `codex` موجود یا پشتیبانی‌شده نباشد، نوبت شکست می‌خورد
  و بی‌صدا از PI استفاده نمی‌کند.

## مسیریابی فرمان عامل

عامل‌ها باید درخواست‌های کاربر را بر اساس نیت مسیریابی کنند، نه فقط بر اساس واژه "Codex":

| کاربر درخواست می‌کند...                                       | عامل باید استفاده کند از...                              |
| ------------------------------------------------------ | ------------------------------------------------ |
| "این چت را به Codex متصل کن"                              | `/codex bind`                                    |
| "رشته Codex با شناسه `<id>` را اینجا ادامه بده"                      | `/codex resume <id>`                             |
| "رشته‌های Codex را نشان بده"                                   | `/codex threads`                                 |
| "برای یک اجرای بد Codex گزارش پشتیبانی ثبت کن"            | `/diagnostics [note]`                            |
| "فقط برای این رشته پیوست‌شده بازخورد Codex بفرست"    | `/codex diagnostics [note]`                      |
| "از اشتراک ChatGPT/Codex من با محیط اجرای Codex استفاده کن" | `openai/*` به‌علاوه `agentRuntime.id: "codex"`       |
| "پین‌های پیکربندی/نشست قدیمی `openai-codex/*` را ترمیم کن"      | `openclaw doctor --fix`                          |
| "Codex را از طریق ACP/acpx اجرا کن"                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Claude Code/Gemini/OpenCode/Cursor را در یک رشته شروع کن" | ACP/acpx، نه `/codex` و نه زیردستیارهای بومی |

OpenClaw فقط زمانی راهنمایی spawn مربوط به ACP را به عامل‌ها اعلام می‌کند که ACP فعال،
قابل dispatch، و متکی به یک backend محیط اجرا بارگذاری‌شده باشد. اگر ACP در دسترس نباشد،
اعلان سامانه و Skills مربوط به Plugin نباید به عامل درباره مسیریابی ACP آموزش دهند.

## استقرارهای فقط Codex

وقتی باید ثابت کنید هر نوبت عامل تعبیه‌شده از Codex استفاده می‌کند، هارنس Codex را اجباری کنید. محیط‌های اجرای صریح Plugin به صورت بسته شکست می‌خورند و هرگز بی‌صدا از طریق PI دوباره امتحان نمی‌شوند:

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
}
```

بازنویسی محیط:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

با اجباری بودن Codex، اگر Plugin متعلق به Codex غیرفعال باشد، app-server بیش از حد قدیمی باشد، یا app-server نتواند شروع شود، OpenClaw زود شکست می‌خورد.

## Codex به‌ازای هر عامل

می‌توانید یک عامل را فقط Codex کنید، در حالی که عامل پیش‌فرض انتخاب خودکار عادی را نگه می‌دارد:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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

برای جابه‌جایی عامل‌ها و مدل‌ها از فرمان‌های عادی نشست استفاده کنید. `/new` یک نشست تازه
OpenClaw ایجاد می‌کند و هارنس Codex در صورت نیاز رشته app-server جانبی خود را ایجاد یا از سر می‌گیرد. `/reset` اتصال نشست OpenClaw برای آن رشته را پاک می‌کند
و اجازه می‌دهد نوبت بعدی دوباره هارنس را از پیکربندی فعلی حل کند.

## کشف مدل

به طور پیش‌فرض، Plugin متعلق به Codex از app-server مدل‌های در دسترس را می‌پرسد. اگر
کشف شکست بخورد یا زمانش تمام شود، از یک فهرست جایگزین همراه برای موارد زیر استفاده می‌کند:

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

وقتی می‌خواهید راه‌اندازی از کاوش Codex پرهیز کند و به فهرست جایگزین بچسبد، کشف را غیرفعال کنید:

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

به طور پیش‌فرض، Plugin باینری مدیریت‌شده Codex متعلق به OpenClaw را به صورت محلی با این فرمان شروع می‌کند:

```bash
codex app-server --listen stdio://
```

باینری مدیریت‌شده همراه با بسته Plugin به نام `codex` ارسال می‌شود. این کار نسخه
app-server را به Plugin همراه گره می‌زند، نه به هر CLI جداگانه Codex که اتفاقاً به صورت محلی نصب شده است. فقط وقتی `appServer.command` را تنظیم کنید که عمداً می‌خواهید یک فایل اجرایی متفاوت اجرا کنید.

به طور پیش‌فرض، OpenClaw نشست‌های محلی هارنس Codex را در حالت YOLO شروع می‌کند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. این وضعیت اپراتور محلی مورد اعتماد است که برای
Heartbeatهای خودکار استفاده می‌شود: Codex می‌تواند از ابزارهای shell و شبکه استفاده کند بدون اینکه روی درخواست‌های تأیید بومی که کسی برای پاسخ‌دادن به آن‌ها حاضر نیست متوقف شود.

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

حالت Guardian از مسیر تأیید auto-review بومی Codex استفاده می‌کند. وقتی Codex درخواست می‌کند
از sandbox خارج شود، بیرون از فضای کاری بنویسد، یا مجوزهایی مثل دسترسی شبکه اضافه کند،
Codex آن درخواست تأیید را به جای اعلان انسانی به بازبین بومی مسیریابی می‌کند. بازبین چارچوب ریسک Codex را اعمال می‌کند و درخواست مشخص را تأیید یا رد می‌کند. وقتی محافظت‌های بیشتری نسبت به حالت YOLO می‌خواهید اما همچنان به عامل‌های بدون مراقبت نیاز دارید که پیش بروند، از Guardian استفاده کنید.

پیش‌تنظیم `guardian` به `approvalPolicy: "on-request"`،
`approvalsReviewer: "auto_review"`، و `sandbox: "workspace-write"` گسترش می‌یابد.
فیلدهای سیاست تکی همچنان `mode` را بازنویسی می‌کنند، بنابراین استقرارهای پیشرفته می‌توانند
پیش‌تنظیم را با انتخاب‌های صریح ترکیب کنند. مقدار قدیمی‌تر بازبین `guardian_subagent` همچنان به عنوان نام مستعار سازگاری پذیرفته می‌شود، اما پیکربندی‌های جدید باید از
`auto_review` استفاده کنند.

برای یک app-server که از قبل در حال اجرا است، از انتقال WebSocket استفاده کنید:

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

راه‌اندازی‌های app-server از نوع stdio به طور پیش‌فرض محیط فرایند OpenClaw را به ارث می‌برند،
اما OpenClaw مالک پل حساب app-server متعلق به Codex است و هم
`CODEX_HOME` و هم `HOME` را به دایرکتوری‌های مخصوص هر عامل زیر وضعیت OpenClaw همان عامل تنظیم می‌کند. بارگذار Skill خود Codex از `$CODEX_HOME/skills` و
`$HOME/.agents/skills` می‌خواند، بنابراین هر دو مقدار برای راه‌اندازی‌های app-server محلی
ایزوله هستند. این کار Skills بومی Codex، Pluginها، پیکربندی، حساب‌ها، و وضعیت رشته را به عامل OpenClaw محدود می‌کند، به جای اینکه از خانه CLI شخصی Codex اپراتور نشت کنند.

Pluginهای OpenClaw و snapshotهای Skill متعلق به OpenClaw همچنان از طریق رجیستری Plugin و بارگذار Skill خود OpenClaw جریان پیدا می‌کنند. دارایی‌های CLI شخصی Codex این‌طور نیستند. اگر Skills یا Pluginهای مفید CLI متعلق به Codex دارید که باید بخشی از یک عامل OpenClaw شوند،
آن‌ها را به صورت صریح فهرست‌برداری کنید:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

ارائه‌دهنده مهاجرت Codex، Skills را به فضای کاری عامل فعلی OpenClaw کپی می‌کند.
Pluginهای بومی Codex، hookها، و فایل‌های پیکربندی برای بازبینی دستی گزارش یا بایگانی می‌شوند
و به صورت خودکار فعال نمی‌شوند، چون می‌توانند فرمان اجرا کنند، سرورهای MCP را آشکار کنند، یا اعتبارنامه حمل کنند.

احراز هویت به این ترتیب انتخاب می‌شود:

1. یک نمایه احراز هویت صریح Codex متعلق به OpenClaw برای عامل.
2. حساب موجود app-server در خانه Codex همان عامل.
3. فقط برای راه‌اندازی‌های app-server محلی stdio، `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب app-server موجود نیست و احراز هویت OpenAI
   همچنان لازم است.

وقتی OpenClaw یک نمایه احراز هویت Codex به سبک اشتراک ChatGPT را می‌بیند، `CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex که ایجاد شده حذف می‌کند. این کار کلیدهای API در سطح Gateway را برای جاسازی‌ها یا مدل‌های مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه نوبت‌های بومی app-server در Codex به‌اشتباه از طریق API محاسبه هزینه شوند. نمایه‌های صریح کلید API برای Codex و fallback محلی کلید محیطی stdio به‌جای env به‌ارث‌رسیده فرایند فرزند، از ورود app-server استفاده می‌کنند. اتصال‌های app-server از نوع WebSocket، fallback کلید API محیط Gateway را دریافت نمی‌کنند؛ از یک نمایه احراز هویت صریح یا حساب خود app-server راه‌دور استفاده کنید.

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

`appServer.clearEnv` فقط بر فرایند فرزند app-server در Codex که ایجاد شده اثر می‌گذارد.

ابزارهای پویای Codex به‌طور پیش‌فرض از نمایه `native-first` استفاده می‌کنند. در این حالت، OpenClaw ابزارهای پویایی را که عملیات workspace بومی Codex را تکرار می‌کنند در معرض دسترس قرار نمی‌دهد: `read`، `write`، `edit`، `apply_patch`، `exec`، `process`، و `update_plan`. ابزارهای یکپارچه‌سازی OpenClaw مانند پیام‌رسانی، نشست‌ها، رسانه، cron، مرورگر، گره‌ها، gateway، `heartbeat_respond`، و `web_search` همچنان در دسترس می‌مانند.

فیلدهای سطح بالای پشتیبانی‌شده Plugin برای Codex:

| فیلد                       | پیش‌فرض         | معنی                                                                                         |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | از `"openclaw-compat"` استفاده کنید تا مجموعه کامل ابزارهای پویای OpenClaw در اختیار app-server در Codex قرار گیرد. |
| `codexDynamicToolsExclude` | `[]`             | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های app-server در Codex حذف شوند.     |

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد                | پیش‌فرض                                  | معنی                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` فرایند Codex را ایجاد می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                                                                                                         |
| `command`           | باینری مدیریت‌شده Codex                  | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده آن را تنظیم‌نشده بگذارید؛ فقط برای یک override صریح تنظیمش کنید.                                                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | آرگومان‌ها برای انتقال stdio.                                                                                                                                                                                                       |
| `url`               | تنظیم‌نشده                               | URL مربوط به app-server در WebSocket.                                                                                                                                                                                               |
| `authToken`         | تنظیم‌نشده                               | توکن Bearer برای انتقال WebSocket.                                                                                                                                                                                                 |
| `headers`           | `{}`                                     | headerهای اضافی WebSocket.                                                                                                                                                                                                         |
| `clearEnv`          | `[]`                                     | نام متغیرهای محیطی اضافی که پس از ساخت محیط به‌ارث‌رسیده توسط OpenClaw، از فرایند app-server نوع stdio که ایجاد شده حذف می‌شوند. `CODEX_HOME` و `HOME` برای جداسازی Codex به‌ازای هر agent در OpenClaw هنگام راه‌اندازی‌های محلی رزرو شده‌اند. |
| `requestTimeoutMs`  | `60000`                                  | زمان انقضا برای فراخوانی‌های control-plane مربوط به app-server.                                                                                                                                                                    |
| `mode`              | `"yolo"`                                 | preset برای اجرای YOLO یا اجرای بازبینی‌شده توسط guardian.                                                                                                                                                                        |
| `approvalPolicy`    | `"never"`                                | سیاست تأیید بومی Codex که به شروع/ازسرگیری/نوبت thread فرستاده می‌شود.                                                                                                                                                            |
| `sandbox`           | `"danger-full-access"`                   | حالت sandbox بومی Codex که به شروع/ازسرگیری thread فرستاده می‌شود.                                                                                                                                                                |
| `approvalsReviewer` | `"user"`                                 | از `"auto_review"` استفاده کنید تا Codex اعلان‌های تأیید بومی را بازبینی کند. `guardian_subagent` همچنان یک نام مستعار legacy است.                                                                                                |
| `serviceTier`       | تنظیم‌نشده                               | سطح سرویس اختیاری app-server در Codex: `"fast"`، `"flex"`، یا `null`. مقدارهای legacy نامعتبر نادیده گرفته می‌شوند.                                                                                                               |

فراخوانی‌های ابزار پویای متعلق به OpenClaw مستقل از `appServer.requestTimeoutMs` محدود می‌شوند: هر درخواست Codex از نوع `item/tool/call` باید ظرف ۳۰ ثانیه یک پاسخ OpenClaw دریافت کند. هنگام timeout، OpenClaw در صورت پشتیبانی سیگنال ابزار را abort می‌کند و یک پاسخ ابزار پویای ناموفق به Codex برمی‌گرداند تا نوبت بتواند ادامه پیدا کند، به‌جای اینکه نشست در حالت `processing` باقی بماند.

پس از اینکه OpenClaw به یک درخواست app-server محدود به نوبت Codex پاسخ می‌دهد، harness همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` تمام کند. اگر app-server پس از آن پاسخ به مدت ۶۰ ثانیه ساکت بماند، OpenClaw به‌شکل best-effort نوبت Codex را interrupt می‌کند، یک timeout تشخیصی ثبت می‌کند، و lane نشست OpenClaw را آزاد می‌کند تا پیام‌های chat بعدی پشت یک نوبت بومی stale در صف نمانند.

overrideهای محیطی برای آزمایش محلی همچنان در دسترس‌اند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` وقتی `appServer.command` تنظیم‌نشده است، باینری مدیریت‌شده را bypass می‌کند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از `plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای آزمایش محلی موردی از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. config برای استقرارهای تکرارپذیر ترجیح داده می‌شود، چون رفتار Plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد که بقیه تنظیمات harness مربوط به Codex در آن قرار دارند.

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی خودش پوشش داده شده است:
[استفاده از رایانه با Codex](/fa/plugins/codex-computer-use).

نسخه کوتاه: OpenClaw اپ کنترل دسکتاپ را vendor نمی‌کند و خودش actionهای دسکتاپ را اجرا نمی‌کند. app-server در Codex را آماده می‌کند، بررسی می‌کند که سرور MCP مربوط به `computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex هنگام نوبت‌های حالت Codex، فراخوانی‌های ابزار MCP بومی را مدیریت کند.

برای دسترسی مستقیم به driver در TryCua خارج از جریان marketplace در Codex، `cua-driver mcp` را با `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ثبت کنید. برای تفاوت میان استفاده از رایانه متعلق به Codex و ثبت مستقیم MCP، [استفاده از رایانه با Codex](/fa/plugins/codex-computer-use) را ببینید.

حداقل config:

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
      },
    },
  },
}
```

راه‌اندازی را می‌توان از سطح command بررسی یا نصب کرد:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

استفاده از رایانه مخصوص macOS است و ممکن است پیش از آنکه سرور MCP در Codex بتواند اپ‌ها را کنترل کند، به مجوزهای محلی سیستم‌عامل نیاز داشته باشد. اگر `computerUse.enabled` برابر true باشد و سرور MCP در دسترس نباشد، نوبت‌های حالت Codex پیش از شروع thread شکست می‌خورند، به‌جای اینکه بی‌صدا بدون ابزارهای بومی استفاده از رایانه اجرا شوند. برای گزینه‌های marketplace، محدودیت‌های catalog راه‌دور، دلیل‌های status، و رفع اشکال، [استفاده از رایانه با Codex](/fa/plugins/codex-computer-use) را ببینید.

وقتی `computerUse.autoInstall` برابر true است، اگر Codex هنوز یک marketplace محلی را کشف نکرده باشد، OpenClaw می‌تواند marketplace استاندارد Codex Desktop را که همراه بسته ارائه شده از `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند. پس از تغییر runtime یا config استفاده از رایانه، از `/new` یا `/reset` استفاده کنید تا نشست‌های موجود binding قدیمی PI یا thread مربوط به Codex را نگه ندارند.

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

تعویض مدل تحت کنترل OpenClaw باقی می‌ماند. وقتی یک نشست OpenClaw به یک thread موجود Codex متصل است، نوبت بعدی دوباره مدل OpenAI، provider، سیاست تأیید، sandbox، و سطح سرویس انتخاب‌شده فعلی را به app-server می‌فرستد. تعویض از `openai/gpt-5.5` به `openai/gpt-5.2` اتصال thread را حفظ می‌کند، اما از Codex می‌خواهد با مدل تازه انتخاب‌شده ادامه دهد.

## دستور Codex

Plugin همراه بسته، `/codex` را به‌عنوان یک slash command مجاز ثبت می‌کند. این دستور generic است و روی هر کانالی که از دستورهای متنی OpenClaw پشتیبانی می‌کند کار می‌کند.

شکل‌های رایج:

- `/codex status` اتصال زندهٔ سرور برنامه، مدل‌ها، حساب، محدودیت‌های نرخ، سرورهای MCP و Skills را نشان می‌دهد.
- `/codex models` مدل‌های زندهٔ سرور برنامهٔ Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر Codex را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک رشتهٔ موجود Codex متصل می‌کند.
- `/codex compact` از سرور برنامهٔ Codex می‌خواهد رشتهٔ متصل‌شده را فشرده کند.
- `/codex review` بازبینی بومی Codex را برای رشتهٔ متصل‌شده آغاز می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد عیب‌یابی Codex برای رشتهٔ متصل‌شده سؤال می‌کند.
- `/codex computer-use status` Plugin پیکربندی‌شدهٔ Computer Use و سرور MCP را بررسی می‌کند.
- `/codex computer-use install` Plugin پیکربندی‌شدهٔ Computer Use را نصب می‌کند و سرورهای MCP را دوباره بارگذاری می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP سرور برنامهٔ Codex را فهرست می‌کند.
- `/codex skills` Skills سرور برنامهٔ Codex را فهرست می‌کند.

وقتی Codex خطای حد مصرف را گزارش می‌کند، اگر Codex زمان بازنشانی بعدی
سرور برنامه را ارائه کرده باشد، OpenClaw آن را شامل می‌کند. برای بررسی حساب
فعلی و بازه‌های محدودیت نرخ، از `/codex account` در همان گفتگو استفاده کنید.

### روند رایج اشکال‌زدایی

وقتی یک عامل پشتیبانی‌شده با Codex در Telegram، Discord، Slack،
یا کانالی دیگر کاری غیرمنتظره انجام می‌دهد، از همان گفتگویی شروع کنید که مشکل در آن رخ داده است:

1. دستور `/diagnostics bad tool choice after image upload` یا یادداشت کوتاه دیگری را اجرا کنید
   که آنچه دیده‌اید را توصیف می‌کند.
2. درخواست عیب‌یابی را یک بار تأیید کنید. این تأیید، فایل zip عیب‌یابی Gateway
   محلی را می‌سازد و، چون نشست از هارنس Codex استفاده می‌کند، بستهٔ بازخورد
   مربوط به Codex را نیز به سرورهای OpenAI می‌فرستد.
3. پاسخ کامل‌شدهٔ عیب‌یابی را در گزارش باگ یا رشتهٔ پشتیبانی کپی کنید.
   این پاسخ شامل مسیر بستهٔ محلی، خلاصهٔ حریم خصوصی، شناسه‌های نشست OpenClaw،
   شناسه‌های رشتهٔ Codex، و یک خط `Inspect locally` برای هر رشتهٔ Codex است.
4. اگر می‌خواهید اجرای موردنظر را خودتان اشکال‌زدایی کنید، دستور چاپ‌شدهٔ `Inspect locally`
   را در ترمینال اجرا کنید. این دستور شبیه `codex resume <thread-id>` است و رشتهٔ
   بومی Codex را باز می‌کند تا بتوانید گفتگو را بررسی کنید، آن را به‌صورت محلی ادامه دهید،
   یا از Codex بپرسید چرا ابزار یا طرح خاصی را انتخاب کرده است.

از `/codex diagnostics [note]` فقط وقتی استفاده کنید که به‌طور مشخص بارگذاری
بازخورد Codex برای رشتهٔ متصل‌شدهٔ فعلی را بدون بستهٔ کامل عیب‌یابی
Gateway در OpenClaw می‌خواهید. برای بیشتر گزارش‌های پشتیبانی، `/diagnostics [note]`
نقطهٔ شروع بهتری است، چون وضعیت Gateway محلی و شناسه‌های رشتهٔ Codex را در
یک پاسخ به هم مرتبط می‌کند. برای مدل کامل حریم خصوصی و رفتار گفتگوی گروهی، [صدور عیب‌یابی](/fa/gateway/diagnostics)
را ببینید.

هستهٔ OpenClaw همچنین `/diagnostics [note]` مخصوص مالک را به‌عنوان فرمان عمومی
عیب‌یابی Gateway در اختیار می‌گذارد. پیام تأیید آن مقدمهٔ داده‌های حساس را نشان می‌دهد،
به [صدور عیب‌یابی](/fa/gateway/diagnostics) پیوند می‌دهد، و هر بار از طریق تأیید صریح اجرا
درخواست `openclaw gateway diagnostics export --json` می‌کند. عیب‌یابی را با قاعدهٔ
اجازه به همه تأیید نکنید. پس از تأیید، OpenClaw گزارشی قابل جای‌گذاری با مسیر بستهٔ
محلی و خلاصهٔ مانیفست می‌فرستد. وقتی نشست فعال OpenClaw از هارنس Codex استفاده می‌کند،
همان تأیید، ارسال بسته‌های بازخورد مربوط به Codex به سرورهای OpenAI را نیز مجاز می‌کند.
پیام تأیید می‌گوید که بازخورد Codex ارسال خواهد شد، اما پیش از تأیید، شناسه‌های نشست
یا رشتهٔ Codex را فهرست نمی‌کند.

اگر `/diagnostics` توسط یک مالک در گفتگوی گروهی فراخوانی شود، OpenClaw کانال
مشترک را تمیز نگه می‌دارد: گروه فقط یک اعلان کوتاه دریافت می‌کند، در حالی که
مقدمهٔ عیب‌یابی، پیام‌های تأیید، و شناسه‌های نشست/رشتهٔ Codex از مسیر تأیید خصوصی
برای مالک ارسال می‌شوند. اگر مسیر خصوصی مالک وجود نداشته باشد، OpenClaw درخواست
گروهی را رد می‌کند و از مالک می‌خواهد آن را از پیام مستقیم اجرا کند.

بارگذاری تأییدشدهٔ Codex، `feedback/upload` سرور برنامهٔ Codex را فراخوانی می‌کند و
از سرور برنامه می‌خواهد در صورت دسترس بودن، گزارش‌ها را برای هر رشتهٔ فهرست‌شده و
زیررشته‌های Codex ایجادشده شامل کند. بارگذاری از مسیر معمول بازخورد Codex به
سرورهای OpenAI می‌رود؛ اگر بازخورد Codex در آن سرور برنامه غیرفعال باشد، فرمان خطای
سرور برنامه را برمی‌گرداند. پاسخ کامل‌شدهٔ عیب‌یابی، کانال‌ها، شناسه‌های نشست OpenClaw،
شناسه‌های رشتهٔ Codex، و فرمان‌های محلی `codex resume <thread-id>` را برای رشته‌هایی
که ارسال شده‌اند فهرست می‌کند. اگر تأیید را رد یا نادیده بگیرید، OpenClaw آن شناسه‌های
Codex را چاپ نمی‌کند. این بارگذاری جایگزین صدور عیب‌یابی Gateway محلی نمی‌شود.

`/codex resume` همان فایل اتصال سایدکار را می‌نویسد که هارنس برای نوبت‌های عادی
استفاده می‌کند. در پیام بعدی، OpenClaw آن رشتهٔ Codex را از سر می‌گیرد، مدل
OpenClaw انتخاب‌شدهٔ فعلی را به سرور برنامه می‌فرستد، و تاریخچهٔ گسترده را فعال نگه می‌دارد.

### بررسی یک رشتهٔ Codex از CLI

سریع‌ترین راه برای فهمیدن یک اجرای بد Codex اغلب این است که رشتهٔ بومی Codex را
مستقیماً باز کنید:

```sh
codex resume <thread-id>
```

وقتی در گفتگوی یک کانال باگی می‌بینید و می‌خواهید نشست مشکل‌دار Codex را بررسی کنید،
آن را به‌صورت محلی ادامه دهید، یا از Codex بپرسید چرا انتخاب خاصی در ابزار یا استدلال
انجام داده است، از این استفاده کنید. ساده‌ترین مسیر معمولاً این است که ابتدا
`/diagnostics [note]` را اجرا کنید: پس از تأیید شما، گزارش کامل‌شده هر رشتهٔ Codex را
فهرست می‌کند و یک فرمان `Inspect locally` چاپ می‌کند، برای مثال
`codex resume <thread-id>`. می‌توانید آن فرمان را مستقیم در ترمینال کپی کنید.

همچنین می‌توانید شناسهٔ رشته را از `/codex binding` برای گفتگوی فعلی یا
`/codex threads [filter]` برای رشته‌های اخیر سرور برنامهٔ Codex بگیرید، سپس همان
فرمان `codex resume` را در پوستهٔ خود اجرا کنید.

سطح فرمان به سرور برنامهٔ Codex نسخهٔ `0.125.0` یا جدیدتر نیاز دارد. اگر یک
سرور برنامهٔ آینده یا سفارشی آن متد JSON-RPC را ارائه نکند، روش‌های کنترلی منفرد
با پیام `unsupported by this Codex app-server` گزارش می‌شوند.

## مرزهای هوک

هارنس Codex سه لایهٔ هوک دارد:

| لایه                                  | مالک                     | هدف                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| هوک‌های Plugin در OpenClaw            | OpenClaw                 | سازگاری محصول/Plugin در هارنس‌های PI و Codex.                      |
| میان‌افزار افزونهٔ سرور برنامهٔ Codex | Pluginهای همراه OpenClaw | رفتار آداپتور در هر نوبت پیرامون ابزارهای پویای OpenClaw.          |
| هوک‌های بومی Codex                    | Codex                    | چرخهٔ عمر سطح پایین Codex و سیاست ابزار بومی از پیکربندی Codex.    |

OpenClaw برای مسیریابی رفتار Plugin در OpenClaw از فایل‌های پروژه‌ای یا سراسری
`hooks.json` در Codex استفاده نمی‌کند. برای پل پشتیبانی‌شدهٔ ابزار بومی و مجوز،
OpenClaw پیکربندی Codex مخصوص هر رشته را برای `PreToolUse`، `PostToolUse`،
`PermissionRequest`، و `Stop` تزریق می‌کند. سایر هوک‌های Codex مانند `SessionStart` و
`UserPromptSubmit` کنترل‌های سطح Codex باقی می‌مانند؛ آن‌ها در قرارداد v1 به‌عنوان
هوک‌های Plugin در OpenClaw ارائه نمی‌شوند.

برای ابزارهای پویای OpenClaw، OpenClaw پس از آنکه Codex درخواست فراخوانی می‌دهد،
ابزار را اجرا می‌کند؛ بنابراین OpenClaw رفتار Plugin و میان‌افزاری را که مالک آن است
در آداپتور هارنس اجرا می‌کند. برای ابزارهای بومی Codex، Codex مالک رکورد رسمی ابزار است.
OpenClaw می‌تواند رویدادهای منتخب را بازتاب دهد، اما نمی‌تواند رشتهٔ بومی Codex را
بازنویسی کند مگر آنکه Codex آن عملیات را از طریق سرور برنامه یا callbackهای هوک بومی
در اختیار بگذارد.

بازنمایی‌های Compaction و چرخهٔ عمر LLM از اعلان‌های سرور برنامهٔ Codex و وضعیت
آداپتور OpenClaw می‌آیند، نه از فرمان‌های هوک بومی Codex. رویدادهای
`before_compaction`، `after_compaction`، `llm_input`، و `llm_output` در OpenClaw
مشاهدات سطح آداپتور هستند، نه ثبت بایت‌به‌بایت درخواست داخلی یا payloadهای Compaction
در Codex.

اعلان‌های سرور برنامهٔ `hook/started` و `hook/completed` بومی Codex به‌عنوان رویدادهای
عامل `codex_app_server.hook` برای مسیر اجرا و اشکال‌زدایی بازنمایی می‌شوند.
آن‌ها هوک‌های Plugin در OpenClaw را فراخوانی نمی‌کنند.

## قرارداد پشتیبانی V1

حالت Codex، PI با یک فراخوانی مدل متفاوت در زیر آن نیست. Codex بخش بیشتری از
حلقهٔ مدل بومی را مالک است، و OpenClaw سطوح Plugin و نشست خود را پیرامون آن مرز
سازگار می‌کند.

پشتیبانی‌شده در runtime v1 Codex:

| سطح                                          | پشتیبانی                                | دلیل                                                                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حلقهٔ مدل OpenAI از طریق Codex               | پشتیبانی‌شده                            | سرور برنامهٔ Codex مالک نوبت OpenAI، ازسرگیری رشتهٔ بومی، و ادامهٔ ابزار بومی است.                                                                                                                   |
| مسیریابی و تحویل کانال OpenClaw              | پشتیبانی‌شده                            | Telegram، Discord، Slack، WhatsApp، iMessage، و سایر کانال‌ها خارج از runtime مدل می‌مانند.                                                                                                         |
| ابزارهای پویای OpenClaw                      | پشتیبانی‌شده                            | Codex از OpenClaw می‌خواهد این ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.                                                                                                    |
| Pluginهای prompt و context                   | پشتیبانی‌شده                            | OpenClaw پوشش‌های prompt را می‌سازد و context را پیش از شروع یا ازسرگیری رشته در نوبت Codex بازنمایی می‌کند.                                                                                         |
| چرخهٔ عمر موتور context                      | پشتیبانی‌شده                            | سرهم‌بندی، دریافت یا نگهداری پس از نوبت، و هماهنگی Compaction موتور context برای نوبت‌های Codex اجرا می‌شود.                                                                                        |
| هوک‌های ابزار پویا                           | پشتیبانی‌شده                            | `before_tool_call`، `after_tool_call`، و میان‌افزار نتیجهٔ ابزار پیرامون ابزارهای پویای تحت مالکیت OpenClaw اجرا می‌شوند.                                                                           |
| هوک‌های چرخهٔ عمر                            | پشتیبانی‌شده به‌عنوان مشاهدات آداپتور   | `llm_input`، `llm_output`، `agent_end`، `before_compaction`، و `after_compaction` با payloadهای صادقانهٔ حالت Codex اجرا می‌شوند.                                                                     |
| دروازهٔ بازبینی پاسخ نهایی                   | پشتیبانی‌شده از طریق relay هوک بومی     | `Stop` در Codex به `before_agent_finalize` relay می‌شود؛ `revise` پیش از نهایی‌سازی از Codex یک گذر مدل دیگر می‌خواهد.                                                                              |
| مسدودسازی یا مشاهدهٔ shell، patch، و MCP بومی | پشتیبانی‌شده از طریق relay هوک بومی     | `PreToolUse` و `PostToolUse` در Codex برای سطوح ابزار بومی commitشده relay می‌شوند، از جمله payloadهای MCP در سرور برنامهٔ Codex نسخهٔ `0.125.0` یا جدیدتر. مسدودسازی پشتیبانی می‌شود؛ بازنویسی آرگومان پشتیبانی نمی‌شود. |
| سیاست مجوز بومی                              | پشتیبانی‌شده از طریق relay هوک بومی     | `PermissionRequest` در Codex می‌تواند، جایی که runtime آن را ارائه می‌کند، از طریق سیاست OpenClaw مسیریابی شود. اگر OpenClaw تصمیمی برنگرداند، Codex از مسیر معمول guardian یا تأیید کاربر ادامه می‌دهد. |
| ثبت مسیر اجرای سرور برنامه                   | پشتیبانی‌شده                            | OpenClaw درخواستی را که به سرور برنامه فرستاده و اعلان‌های سرور برنامه‌ای را که دریافت می‌کند ثبت می‌کند.                                                                                          |

پشتیبانی‌نشده در runtime v1 Codex:

| سطح                                                | مرز V1                                                                                                                                      | مسیر آینده                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| تغییر آرگومان ابزار بومی                           | hookهای پیشاابزار بومی Codex می‌توانند مسدود کنند، اما OpenClaw آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند.                                               | نیازمند پشتیبانی hook/schema در Codex برای ورودی ابزار جایگزین است.                            |
| تاریخچه رونوشت بومی Codex قابل ویرایش              | Codex مالک تاریخچه رسمی thread بومی است. OpenClaw مالک یک آینه است و می‌تواند context آینده را projection کند، اما نباید internals پشتیبانی‌نشده را تغییر دهد. | اگر جراحی thread بومی لازم باشد، APIهای صریح app-server در Codex اضافه شود.                    |
| `tool_result_persist` برای رکوردهای ابزار بومی Codex | آن hook نوشتن‌های رونوشت تحت مالکیت OpenClaw را تبدیل می‌کند، نه رکوردهای ابزار بومی Codex را.                                                           | می‌تواند رکوردهای تبدیل‌شده را mirror کند، اما بازنویسی رسمی به پشتیبانی Codex نیاز دارد.              |
| فراداده غنی Compaction بومی                        | OpenClaw شروع و تکمیل Compaction را مشاهده می‌کند، اما فهرست پایدار موارد حفظ‌شده/حذف‌شده، token delta، یا payload خلاصه دریافت نمی‌کند.            | به رویدادهای غنی‌تر Compaction در Codex نیاز دارد.                                                     |
| مداخله در Compaction                               | hookهای فعلی Compaction در OpenClaw در حالت Codex در سطح اعلان هستند.                                                                         | اگر plugins نیاز به veto یا بازنویسی Compaction بومی دارند، hookهای پیش/پس از Compaction در Codex اضافه شود. |
| ثبت byte-for-byte درخواست API مدل                  | OpenClaw می‌تواند درخواست‌ها و اعلان‌های app-server را ثبت کند، اما core Codex درخواست نهایی OpenAI API را به‌صورت داخلی می‌سازد.                      | به یک رویداد tracing درخواست مدل در Codex یا API اشکال‌زدایی نیاز دارد.                                   |

## ابزارها، رسانه، و Compaction

harness در Codex فقط executor سطح پایین عامل تعبیه‌شده را تغییر می‌دهد.

OpenClaw همچنان فهرست ابزار را می‌سازد و نتایج ابزار پویا را از
harness دریافت می‌کند. متن، تصاویر، ویدئو، موسیقی، TTS، تأییدها، و خروجی ابزار پیام‌رسانی
از مسیر عادی تحویل OpenClaw ادامه پیدا می‌کنند.

relay hook بومی عمداً عمومی است، اما قرارداد پشتیبانی v1
به مسیرهای ابزار و مجوز بومی Codex محدود است که OpenClaw آن‌ها را آزمایش می‌کند. در
runtime Codex، این شامل payloadهای shell، patch، و MCP `PreToolUse`،
`PostToolUse`، و `PermissionRequest` است. فرض نکنید هر رویداد hook آینده
Codex یک سطح Plugin در OpenClaw است، تا زمانی که قرارداد runtime آن را نام ببرد.

برای `PermissionRequest`، OpenClaw فقط وقتی policy تصمیم بگیرد، تصمیم‌های صریح allow یا deny
را برمی‌گرداند. نتیجه بدون تصمیم به معنی allow نیست. Codex آن را به‌عنوان نبود
تصمیم hook در نظر می‌گیرد و به guardian خودش یا مسیر تأیید کاربر می‌رسد.

elicitationهای تأیید ابزار Codex MCP از مسیر جریان تأیید Plugin در OpenClaw
عبور داده می‌شوند، وقتی Codex مقدار `_meta.codex_approval_kind` را
`"mcp_tool_call"` علامت‌گذاری کند. promptهای Codex `request_user_input` به chat
مبدأ برگردانده می‌شوند، و پیام follow-up بعدی در صف به آن درخواست native
server پاسخ می‌دهد، به‌جای اینکه به‌عنوان context اضافی هدایت شود. درخواست‌های elicitation
دیگر MCP همچنان fail closed می‌شوند.

هدایت صف active-run به Codex app-server `turn/steer` نگاشت می‌شود. با
پیش‌فرض `messages.queue.mode: "steer"`، OpenClaw پیام‌های chat صف‌شده
را برای بازه سکوت پیکربندی‌شده batch می‌کند و آن‌ها را به‌ترتیب ورود به‌عنوان یک درخواست
`turn/steer` می‌فرستد. حالت legacy `queue` درخواست‌های جداگانه `turn/steer` می‌فرستد. turnهای
review و Compaction دستی در Codex می‌توانند هدایت same-turn را رد کنند، که در این حالت
OpenClaw از صف followup استفاده می‌کند، وقتی حالت انتخاب‌شده fallback را اجازه دهد. ببینید
[صف هدایت](/fa/concepts/queue-steering).

وقتی مدل انتخاب‌شده از harness Codex استفاده می‌کند، Compaction thread بومی
به Codex app-server واگذار می‌شود. OpenClaw یک آینه رونوشت برای تاریخچه channel،
جست‌وجو، `/new`، `/reset`، و تغییر احتمالی آینده مدل یا harness نگه می‌دارد. این
آینه شامل prompt کاربر، متن نهایی assistant، و رکوردهای سبک reasoning یا plan
Codex است، وقتی app-server آن‌ها را emit کند. امروز، OpenClaw فقط
سیگنال‌های شروع و تکمیل Compaction بومی را ثبت می‌کند. هنوز یک خلاصه
خوانا برای انسان از Compaction یا فهرست قابل audit از اینکه Codex پس از
Compaction کدام entryها را نگه داشته است، ارائه نمی‌کند.

از آنجا که Codex مالک thread بومی رسمی است، `tool_result_persist` در حال حاضر
رکوردهای نتیجه ابزار بومی Codex را بازنویسی نمی‌کند. این فقط زمانی اعمال می‌شود که
OpenClaw در حال نوشتن نتیجه ابزار رونوشت session تحت مالکیت OpenClaw باشد.

تولید رسانه به PI نیاز ندارد. تصویر، ویدئو، موسیقی، PDF، TTS، و درک رسانه
همچنان از تنظیمات provider/model متناظر مانند
`agents.defaults.imageGenerationModel`، `videoGenerationModel`، `pdfModel`، و
`messages.tts` استفاده می‌کنند.

## عیب‌یابی

**Codex به‌عنوان یک provider عادی `/model` ظاهر نمی‌شود:** برای configهای
جدید این مورد انتظار است. یک مدل `openai/gpt-*` را با
`agentRuntime.id: "codex"` انتخاب کنید (یا یک ref legacy `codex/*`)،
`plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید آیا `plugins.allow` مقدار
`codex` را حذف کرده است.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** `agentRuntime.id: "auto"` همچنان می‌تواند از PI به‌عنوان
backend سازگاری استفاده کند، وقتی هیچ harness در Codex اجرای کار را claim نکند. برای اجبار انتخاب
Codex هنگام testing، مقدار `agentRuntime.id: "codex"` را تنظیم کنید. runtime
اجباری Codex به‌جای fallback به PI شکست می‌خورد. وقتی Codex app-server
انتخاب شد، failureهای آن مستقیماً surface می‌شوند.

**app-server رد می‌شود:** Codex را ارتقا دهید تا handshake app-server
نسخه `0.125.0` یا جدیدتر را گزارش کند. prereleaseهای همان نسخه یا نسخه‌های دارای پسوند build
مانند `0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون کف protocol
پایدار `0.125.0` همان چیزی است که OpenClaw آزمایش می‌کند.

**کشف مدل کند است:** مقدار `plugins.entries.codex.config.discovery.timeoutMs`
را کاهش دهید یا discovery را غیرفعال کنید.

**انتقال WebSocket فوراً شکست می‌خورد:** `appServer.url`، `authToken`،
و اینکه app-server راه دور همان نسخه protocol app-server Codex را صحبت می‌کند بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این مورد انتظار است، مگر اینکه
`agentRuntime.id: "codex"` را برای آن agent اجبار کرده باشید یا یک ref legacy
`codex/*` انتخاب کرده باشید. refهای ساده `openai/gpt-*` و providerهای دیگر در حالت
`auto` در مسیر عادی provider خود می‌مانند. اگر `agentRuntime.id: "codex"` را اجبار کنید، هر turn تعبیه‌شده
برای آن agent باید یک مدل OpenAI پشتیبانی‌شده توسط Codex باشد.

**Computer Use نصب شده اما ابزارها اجرا نمی‌شوند:** از یک session تازه
`/codex computer-use status` را بررسی کنید. اگر ابزاری
`Native hook relay unavailable` را گزارش کرد، از `/new` یا `/reset` استفاده کنید؛ اگر ادامه داشت، gateway را restart کنید
تا registrationهای hook بومی stale پاک شوند. اگر `computer-use.list_apps`
timeout شد، Codex Computer Use یا Codex Desktop را restart کنید و دوباره تلاش کنید.

## مرتبط

- [plugins harness عامل](/fa/plugins/sdk-agent-harness)
- [runtimeهای عامل](/fa/concepts/agent-runtimes)
- [providerهای مدل](/fa/concepts/model-providers)
- [provider OpenAI](/fa/providers/openai)
- [وضعیت](/fa/cli/status)
- [hookهای Plugin](/fa/plugins/hooks)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [آزمایش](/fa/help/testing-live#live-codex-app-server-harness-smoke)

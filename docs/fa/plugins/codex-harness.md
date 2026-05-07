---
read_when:
    - می‌خواهید از هارنس app-server همراه Codex استفاده کنید
    - به نمونه‌های پیکربندی چارچوب اجرای Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به PI ناموفق شوند
summary: نوبت‌های عامل جاسازی‌شده OpenClaw را از طریق هارنس app-server همراه Codex اجرا کنید
title: هارنس Codex
x-i18n:
    generated_at: "2026-05-07T01:54:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw اجازه می‌دهد نوبت‌های agent تعبیه‌شده را به‌جای harness داخلی PI از طریق app-server Codex اجرا کند.

وقتی می‌خواهید Codex مالک نشست agent در سطح پایین باشد، از این استفاده کنید: کشف مدل، ادامه‌دادن native رشته، Compaction native، و اجرای app-server. OpenClaw همچنان مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل، ابزارها، تأییدها، تحویل رسانه، و آینه transcript قابل‌مشاهده است.

وقتی یک نوبت چت مبدأ از طریق harness Codex اجرا می‌شود، اگر deployment مقدار `messages.visibleReplies` را صریحاً پیکربندی نکرده باشد، پاسخ‌های قابل‌مشاهده به‌طور پیش‌فرض از ابزار `message` OpenClaw استفاده می‌کنند. agent همچنان می‌تواند نوبت Codex خود را به‌صورت خصوصی تمام کند؛ فقط وقتی به کانال پست می‌فرستد که `message(action="send")` را فراخوانی کند. برای نگه‌داشتن پاسخ‌های نهایی چت مستقیم روی مسیر تحویل خودکار قدیمی، `messages.visibleReplies: "automatic"` را تنظیم کنید.

نوبت‌های Heartbeat مربوط به Codex نیز به‌طور پیش‌فرض ابزار `heartbeat_respond` را دریافت می‌کنند، تا agent بتواند ثبت کند که بیدارباش باید بی‌صدا بماند یا بدون کدگذاری آن جریان کنترل در متن نهایی اعلان بفرستد.

راهنمای initiative مخصوص Heartbeat، به‌عنوان یک دستور developer در حالت collaboration مربوط به Codex روی خود نوبت Heartbeat ارسال می‌شود. نوبت‌های عادی چت به‌جای حمل فلسفه Heartbeat در prompt runtime معمول خود، حالت Codex Default را بازیابی می‌کنند.

اگر می‌خواهید جهت‌گیری اولیه پیدا کنید، از
[runtimeهای agent](/fa/concepts/agent-runtimes) شروع کنید. نسخه کوتاه این است:
`openai/gpt-5.5` مرجع مدل است، `codex` runtime است، و Telegram،
Discord، Slack، یا کانال دیگری سطح ارتباطی باقی می‌ماند.

## پیکربندی سریع

بیشتر کاربرانی که «Codex در OpenClaw» می‌خواهند، این مسیر را می‌خواهند: با یک اشتراک ChatGPT/Codex وارد شوید، سپس نوبت‌های agent تعبیه‌شده را از طریق runtime native app-server مربوط به Codex اجرا کنید. مرجع مدل همچنان به‌صورت canonical به شکل
`openai/gpt-*` باقی می‌ماند؛ احراز هویت اشتراکی از حساب/پروفایل Codex می‌آید، نه از پیشوند مدل `openai-codex/*`.

اگر قبلاً انجام نداده‌اید، ابتدا با Codex OAuth وارد شوید:

```bash
openclaw models auth login --provider openai-codex
```

سپس Plugin همراه `codex` را فعال کنید و runtime Codex را اجبار کنید:

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

اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را نیز آنجا قرار دهید:

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

در پیکربندی از `openai-codex/gpt-*` استفاده نکنید. آن پیشوند یک مسیر قدیمی است که
`openclaw doctor --fix` آن را در مدل‌های اصلی، fallbackها، overrideهای heartbeat/subagent/compaction، hookها، overrideهای کانال، و pinهای کهنه مسیر نشست پایدارشده به `openai/gpt-*` بازنویسی می‌کند.

## این Plugin چه چیزی را تغییر می‌دهد

Plugin همراه `codex` چند قابلیت جداگانه ارائه می‌کند:

| قابلیت                            | نحوه استفاده                                           | کاری که انجام می‌دهد                                                        |
| --------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| runtime native تعبیه‌شده          | `agentRuntime.id: "codex"`                             | نوبت‌های agent تعبیه‌شده OpenClaw را از طریق app-server Codex اجرا می‌کند. |
| فرمان‌های native کنترل چت         | `/codex bind`, `/codex resume`, `/codex steer`, ...    | رشته‌های app-server Codex را از یک گفت‌وگوی پیام‌رسان bind و کنترل می‌کند. |
| provider/catalog app-server Codex | داخلیات `codex`، نمایان‌شده از طریق harness            | به runtime اجازه می‌دهد مدل‌های app-server را کشف و اعتبارسنجی کند.        |
| مسیر درک رسانه Codex              | مسیرهای سازگاری مدل تصویر `codex/*`                    | نوبت‌های محدود app-server Codex را برای مدل‌های پشتیبانی‌شده درک تصویر اجرا می‌کند. |
| relay hook native                 | hookهای Plugin پیرامون رویدادهای native مربوط به Codex | به OpenClaw اجازه می‌دهد رویدادهای ابزار/نهایی‌سازی native پشتیبانی‌شده Codex را مشاهده/مسدود کند. |

فعال‌کردن Plugin این قابلیت‌ها را در دسترس قرار می‌دهد. این کار **انجام نمی‌دهد**:

- شروع استفاده از Codex برای هر مدل OpenAI
- تبدیل مراجع مدل `openai-codex/*` به runtime native بدون اینکه doctor تأیید کند Codex نصب و فعال است، harness `codex` را ارائه می‌کند، و برای OAuth آماده است
- تبدیل ACP/acpx به مسیر پیش‌فرض Codex
- hot-switch کردن نشست‌های موجودی که از قبل runtime مربوط به PI را ثبت کرده‌اند
- جایگزین‌کردن تحویل کانال OpenClaw، فایل‌های نشست، ذخیره‌سازی auth-profile، یا مسیریابی پیام

همین Plugin مالک سطح فرمان native کنترل چت `/codex` نیز هست. اگر Plugin فعال باشد و کاربر بخواهد رشته‌های Codex را از چت bind، resume، steer، stop، یا inspect کند، agentها باید `/codex ...` را به ACP ترجیح دهند. ACP زمانی fallback صریح باقی می‌ماند که کاربر ACP/acpx را بخواهد یا در حال آزمایش adapter Codex مربوط به ACP باشد.

نوبت‌های native Codex، hookهای Plugin مربوط به OpenClaw را به‌عنوان لایه سازگاری عمومی نگه می‌دارند. این‌ها hookهای درون‌فرآیندی OpenClaw هستند، نه hookهای فرمان `hooks.json` مربوط به Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` برای رکوردهای transcript آینه‌شده
- `before_agent_finalize` از طریق relay `Stop` مربوط به Codex
- `agent_end`

Pluginها همچنین می‌توانند middleware نتیجه ابزار مستقل از runtime ثبت کنند تا نتیجه‌های ابزار dynamic مربوط به OpenClaw را پس از اجرای ابزار توسط OpenClaw و پیش از بازگرداندن نتیجه به Codex بازنویسی کنند. این از hook عمومی Plugin با نام
`tool_result_persist` جداست، که writeهای نتیجه ابزار transcript تحت مالکیت OpenClaw را تبدیل می‌کند.

برای خود معناشناسی hookهای Plugin، [hookهای Plugin](/fa/plugins/hooks)
و [رفتار guard مربوط به Plugin](/fa/tools/plugin) را ببینید.

harness به‌طور پیش‌فرض خاموش است. پیکربندی‌های جدید باید مراجع مدل OpenAI را به‌صورت canonical با قالب `openai/gpt-*` نگه دارند و وقتی اجرای native app-server را می‌خواهند، صریحاً
`agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex` را اجبار کنند. مراجع قدیمی مدل `codex/*` همچنان برای سازگاری harness را به‌طور خودکار انتخاب می‌کنند، اما پیشوندهای provider قدیمیِ پشتیبانی‌شده با runtime به‌عنوان گزینه‌های عادی مدل/provider نشان داده نمی‌شوند.

اگر هر مسیر مدل پیکربندی‌شده هنوز `openai-codex/*` باشد، `openclaw doctor --fix`
آن را به `openai/*` بازنویسی می‌کند. برای مسیرهای agent مطابق، runtime agent را فقط وقتی به `codex` تنظیم می‌کند که Plugin مربوط به Codex نصب و فعال باشد، harness
`codex` را ارائه کند، و OAuth قابل‌استفاده داشته باشد؛ در غیر این صورت runtime را به `pi` تنظیم می‌کند.

## نقشه مسیر

پیش از تغییر پیکربندی از این جدول استفاده کنید:

| رفتار موردنظر                                      | مرجع مدل                    | پیکربندی runtime                     | مسیر auth/profile            | برچسب وضعیت مورد انتظار        |
| -------------------------------------------------- | --------------------------- | ------------------------------------ | ---------------------------- | ------------------------------- |
| اشتراک ChatGPT/Codex با runtime native Codex       | `openai/gpt-*`              | `agentRuntime.id: "codex"`           | Codex OAuth یا حساب Codex    | `Runtime: OpenAI Codex`         |
| OpenAI API از طریق runner عادی OpenClaw            | `openai/gpt-*`              | حذف‌شده یا `runtime: "pi"`           | کلید OpenAI API              | `Runtime: OpenClaw Pi Default`  |
| پیکربندی قدیمی که به تعمیر doctor نیاز دارد        | `openai-codex/gpt-*`        | تعمیرشده به `codex` یا `pi`          | احراز هویت موجود پیکربندی‌شده | پس از `doctor --fix` دوباره بررسی کنید |
| providerهای ترکیبی با حالت خودکار محافظه‌کارانه   | مراجع مخصوص provider        | `agentRuntime.id: "auto"`            | به‌ازای provider انتخاب‌شده  | وابسته به runtime انتخاب‌شده   |
| نشست صریح adapter Codex مربوط به ACP               | وابسته به prompt/model ACP  | `sessions_spawn` با `runtime: "acp"` | احراز هویت backend ACP       | وضعیت task/session مربوط به ACP |

تفکیک مهم، provider در برابر runtime است:

- `openai-codex/*` یک مسیر قدیمی است که doctor آن را بازنویسی می‌کند.
- `agentRuntime.id: "codex"` به harness مربوط به Codex نیاز دارد و اگر در دسترس نباشد fail closed می‌شود.
- `agentRuntime.id: "auto"` به harnessهای ثبت‌شده اجازه می‌دهد مسیرهای provider مطابق را claim کنند، اما مراجع canonical مربوط به OpenAI همچنان تحت مالکیت PI هستند مگر اینکه یک harness از آن جفت provider/model پشتیبانی کند.
- `/codex ...` به این پاسخ می‌دهد که «این چت باید به کدام گفت‌وگوی native Codex bind شود یا آن را کنترل کند؟»
- ACP به این پاسخ می‌دهد که «acpx باید کدام فرآیند harness خارجی را launch کند؟»

## انتخاب پیشوند مدل درست

مسیرهای خانواده OpenAI به پیشوند وابسته‌اند. برای راه‌اندازی رایج اشتراک به‌همراه runtime native Codex، از `openai/*` با `agentRuntime.id: "codex"` استفاده کنید.
`openai-codex/*` را به‌عنوان پیکربندی قدیمی در نظر بگیرید که doctor باید آن را بازنویسی کند:

| مرجع مدل                                      | مسیر runtime                                  | زمان استفاده                                                              |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | provider OpenAI از طریق plumbing OpenClaw/PI  | دسترسی فعلی مستقیم به OpenAI Platform API را با `OPENAI_API_KEY` می‌خواهید. |
| `openai-codex/gpt-5.5`                        | مسیر قدیمی که doctor تعمیر می‌کند             | روی پیکربندی قدیمی هستید؛ برای بازنویسی آن `openclaw doctor --fix` را اجرا کنید. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | harness app-server Codex                      | احراز هویت اشتراک ChatGPT/Codex را با اجرای native Codex می‌خواهید.       |

GPT-5.5 وقتی حساب شما آن‌ها را ارائه کند، می‌تواند هم روی مسیرهای مستقیم کلید OpenAI API و هم مسیرهای اشتراک Codex ظاهر شود. برای runtime native Codex از `openai/gpt-5.5` همراه با harness app-server Codex استفاده کنید، یا برای ترافیک مستقیم کلید API از `openai/gpt-5.5` بدون override runtime Codex استفاده کنید.

مراجع قدیمی `codex/gpt-*` همچنان به‌عنوان aliasهای سازگاری پذیرفته می‌شوند. migration سازگاری doctor، مراجع runtime قدیمی را به مراجع canonical مدل بازنویسی می‌کند و سیاست runtime را جداگانه ثبت می‌کند. پیکربندی‌های جدید harness native app-server باید از `openai/gpt-*` به‌همراه `agentRuntime.id: "codex"` استفاده کنند.

`agents.defaults.imageModel` از همان تفکیک پیشوند پیروی می‌کند. برای مسیر عادی OpenAI از
`openai/gpt-*` استفاده کنید و وقتی درک تصویر باید از طریق یک نوبت محدود app-server Codex اجرا شود از `codex/gpt-*` استفاده کنید. از
`openai-codex/gpt-*` استفاده نکنید؛ doctor آن پیشوند قدیمی را به `openai/gpt-*` بازنویسی می‌کند. مدل app-server Codex باید پشتیبانی ورودی تصویر را advertise کند؛ مدل‌های text-only مربوط به Codex پیش از شروع نوبت رسانه شکست می‌خورند.

برای تأیید harness مؤثر برای نشست فعلی از `/status` استفاده کنید. اگر انتخاب غافلگیرکننده است، logging debug را برای زیرسامانه `agents/harness` فعال کنید و رکورد ساختاریافته `agent harness selected` مربوط به gateway را بررسی کنید. این رکورد شامل شناسه harness انتخاب‌شده، دلیل انتخاب، سیاست runtime/fallback، و در حالت `auto`، نتیجه پشتیبانی هر candidate Plugin است.

### هشدارهای doctor چه معنایی دارند

`openclaw doctor` زمانی هشدار می‌دهد که مراجع مدل پیکربندی‌شده یا وضعیت مسیر نشست پایدارشده هنوز از `openai-codex/*` استفاده کنند. `openclaw doctor --fix` آن مسیرها را به موارد زیر بازنویسی می‌کند:

- `openai/<model>`
- `agentRuntime.id: "codex"` وقتی Codex نصب و فعال است، harness
  `codex` را ارائه می‌کند، و OAuth قابل‌استفاده دارد
- `agentRuntime.id: "pi"` در غیر این صورت

مسیر `codex` harness native Codex را اجبار می‌کند. مسیر `pi`، به‌جای فعال یا نصب‌کردن Codex به‌عنوان اثر جانبی پاک‌سازی مسیر قدیمی، agent را روی runner پیش‌فرض OpenClaw نگه می‌دارد.
Doctor همچنین pinهای کهنه نشست پایدارشده را در storeهای کشف‌شده نشست agent تعمیر می‌کند تا گفت‌وگوهای قدیمی روی مسیر حذف‌شده گیر نکنند.

انتخاب هارنس، کنترل زندهٔ نشست نیست. وقتی یک نوبت جاسازی‌شده اجرا می‌شود،
OpenClaw شناسهٔ هارنس انتخاب‌شده را روی همان نشست ثبت می‌کند و برای
نوبت‌های بعدی با همان شناسهٔ نشست همچنان از آن استفاده می‌کند. وقتی می‌خواهید
نشست‌های آینده از هارنس دیگری استفاده کنند، پیکربندی `agentRuntime` یا
`OPENCLAW_AGENT_RUNTIME` را تغییر دهید؛ برای شروع یک نشست تازه، پیش از جابه‌جا
کردن یک گفت‌وگوی موجود بین PI و Codex از `/new` یا `/reset` استفاده کنید. این
کار از بازپخش یک رونوشت از مسیر دو سامانهٔ نشست بومی ناسازگار جلوگیری می‌کند.

نشست‌های قدیمی که پیش از پین‌های هارنس ساخته شده‌اند، پس از داشتن سابقهٔ
رونوشت به‌عنوان نشست‌های پین‌شده به PI در نظر گرفته می‌شوند. برای وارد کردن آن
گفت‌وگو به Codex پس از تغییر پیکربندی، از `/new` یا `/reset` استفاده کنید.

`/status` زمان‌اجرای مؤثر مدل را نشان می‌دهد. هارنس پیش‌فرض PI به‌صورت
`Runtime: OpenClaw Pi Default` نمایش داده می‌شود، و هارنس app-server مربوط به
Codex به‌صورت `Runtime: OpenAI Codex`.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس.
- app-server مربوط به Codex نسخهٔ `0.125.0` یا جدیدتر. Plugin همراه، به‌طور
  پیش‌فرض یک باینری سازگار app-server مربوط به Codex را مدیریت می‌کند، بنابراین
  فرمان‌های محلی `codex` روی `PATH` روی راه‌اندازی عادی هارنس اثر نمی‌گذارند.
- احراز هویت Codex در دسترس فرایند app-server یا پل احراز هویت Codex در
  OpenClaw باشد. راه‌اندازی‌های محلی app-server برای هر عامل از یک خانهٔ Codex
  مدیریت‌شده توسط OpenClaw و یک `HOME` فرزند ایزوله استفاده می‌کنند، بنابراین
  به‌طور پیش‌فرض حساب شخصی `~/.codex`، مهارت‌ها، Pluginها، پیکربندی، وضعیت
  رشته، یا `$HOME/.agents/skills` بومی شما را نمی‌خوانند.

Plugin دست‌دهی‌های app-server قدیمی‌تر یا بدون نسخه را مسدود می‌کند. این کار
OpenClaw را روی سطح پروتکلی نگه می‌دارد که در برابر آن آزموده شده است.

برای آزمون‌های دود زنده و Docker، احراز هویت معمولاً از حساب CLI مربوط به
Codex یا یک پروفایل احراز هویت `openai-codex` در OpenClaw می‌آید. راه‌اندازی‌های
محلی stdio app-server همچنین وقتی حسابی وجود ندارد می‌توانند به
`CODEX_API_KEY` / `OPENAI_API_KEY` بازگردند.

## فایل‌های راه‌اندازی فضای کاری

Codex خودش `AGENTS.md` را از طریق کشف بومی سندهای پروژه مدیریت می‌کند.
OpenClaw فایل‌های ساختگی سند پروژهٔ Codex نمی‌نویسد و برای فایل‌های پرسونا به
نام‌های جایگزین Codex وابسته نیست، چون جایگزین‌های Codex فقط وقتی اعمال
می‌شوند که `AGENTS.md` وجود نداشته باشد.

برای همترازی فضای کاری OpenClaw، هارنس Codex سایر فایل‌های راه‌اندازی
(`SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`
و `MEMORY.md` در صورت وجود) را حل می‌کند و آن‌ها را از مسیر دستورالعمل‌های
توسعه‌دهندهٔ Codex روی `thread/start` و `thread/resume` ارسال می‌کند. این کار
`SOUL.md` و زمینهٔ مرتبط پرسونا/پروفایل فضای کاری را روی مسیر بومی شکل‌دهی
رفتار Codex قابل مشاهده نگه می‌دارد، بدون اینکه `AGENTS.md` تکرار شود.

## افزودن Codex در کنار مدل‌های دیگر

اگر همان عامل باید بتواند آزادانه بین Codex و مدل‌های ارائه‌دهندهٔ غیر Codex
جابه‌جا شود، `agentRuntime.id: "codex"` را به‌صورت سراسری تنظیم نکنید. یک
زمان‌اجرای اجباری روی هر نوبت جاسازی‌شده برای آن عامل یا نشست اعمال می‌شود.
اگر در حالی که آن زمان‌اجرا اجباری است یک مدل Anthropic را انتخاب کنید،
OpenClaw همچنان هارنس Codex را امتحان می‌کند و به‌جای مسیردهی بی‌صدا از طریق
PI، به‌صورت بسته شکست می‌خورد.

به‌جای آن از یکی از این شکل‌ها استفاده کنید:

- Codex را روی یک عامل اختصاصی با `agentRuntime.id: "codex"` قرار دهید.
- عامل پیش‌فرض را روی `agentRuntime.id: "auto"` و بازگشت سازگاری PI برای کاربرد
  عادی با ارائه‌دهنده‌های ترکیبی نگه دارید.
- از ارجاع‌های قدیمی `codex/*` فقط برای سازگاری استفاده کنید. پیکربندی‌های
  جدید باید `openai/*` به‌همراه یک سیاست صریح زمان‌اجرای Codex را ترجیح دهند.

برای نمونه، این پیکربندی عامل پیش‌فرض را روی انتخاب خودکار عادی نگه می‌دارد و
یک عامل Codex جداگانه اضافه می‌کند:

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
- عامل `codex` از هارنس app-server مربوط به Codex استفاده می‌کند.
- اگر Codex برای عامل `codex` موجود یا پشتیبانی‌شده نباشد، نوبت به‌جای استفادهٔ
  بی‌سروصدا از PI شکست می‌خورد.

## مسیردهی فرمان عامل

عامل‌ها باید درخواست‌های کاربر را بر اساس نیت مسیریابی کنند، نه فقط بر اساس
واژهٔ «Codex»:

| کاربر چه می‌خواهد...                                  | عامل باید استفاده کند از...                      |
| ------------------------------------------------------ | ------------------------------------------------ |
| «این چت را به Codex متصل کن»                           | `/codex bind`                                    |
| «رشتهٔ Codex با `<id>` را اینجا ادامه بده»             | `/codex resume <id>`                             |
| «رشته‌های Codex را نشان بده»                           | `/codex threads`                                 |
| «برای یک اجرای بد Codex گزارش پشتیبانی ثبت کن»         | `/diagnostics [note]`                            |
| «فقط برای این رشتهٔ پیوست‌شده بازخورد Codex بفرست»     | `/codex diagnostics [note]`                      |
| «از اشتراک ChatGPT/Codex من با زمان‌اجرای Codex استفاده کن» | `openai/*` plus `agentRuntime.id: "codex"`       |
| «پیکربندی/پین‌های نشست قدیمی `openai-codex/*` را تعمیر کن» | `openclaw doctor --fix`                          |
| «Codex را از طریق ACP/acpx اجرا کن»                    | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| «Claude Code/Gemini/OpenCode/Cursor را در یک رشته شروع کن» | ACP/acpx، نه `/codex` و نه زیرعامل‌های بومی |

OpenClaw فقط وقتی راهنمایی spawn مربوط به ACP را به عامل‌ها اعلام می‌کند که ACP
فعال، قابل ارسال، و متکی به یک backend زمان‌اجرای بارگذاری‌شده باشد. اگر ACP در
دسترس نباشد، اعلان سامانه و Skills مربوط به Plugin نباید به عامل دربارهٔ
مسیردهی ACP آموزش بدهند.

## استقرارهای فقط Codex

وقتی لازم است ثابت کنید هر نوبت عامل جاسازی‌شده از Codex استفاده می‌کند،
هارنس Codex را اجباری کنید. زمان‌اجراهای صریح Plugin به‌صورت بسته شکست
می‌خورند و هرگز بی‌صدا از طریق PI دوباره امتحان نمی‌شوند:

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

با اجباری شدن Codex، اگر Plugin مربوط به Codex غیرفعال باشد، app-server خیلی
قدیمی باشد، یا app-server نتواند شروع شود، OpenClaw زود شکست می‌خورد.

## Codex به‌ازای هر عامل

می‌توانید یک عامل را فقط Codex کنید، در حالی که عامل پیش‌فرض انتخاب خودکار
عادی را نگه می‌دارد:

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

برای جابه‌جایی عامل‌ها و مدل‌ها از فرمان‌های عادی نشست استفاده کنید. `/new` یک
نشست تازهٔ OpenClaw می‌سازد و هارنس Codex در صورت نیاز رشتهٔ app-server جانبی
خود را می‌سازد یا ادامه می‌دهد. `/reset` اتصال نشست OpenClaw برای آن رشته را
پاک می‌کند و اجازه می‌دهد نوبت بعدی دوباره هارنس را از پیکربندی جاری حل کند.

## کشف مدل

به‌طور پیش‌فرض، Plugin مربوط به Codex فهرست مدل‌های موجود را از app-server
می‌خواهد. اگر کشف شکست بخورد یا زمانش تمام شود، از یک کاتالوگ بازگشتی همراه
برای موارد زیر استفاده می‌کند:

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

وقتی می‌خواهید راه‌اندازی از کاوش Codex اجتناب کند و به کاتالوگ بازگشتی پایبند
بماند، کشف را غیرفعال کنید:

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

## اتصال app-server و سیاست

به‌طور پیش‌فرض، Plugin باینری مدیریت‌شدهٔ Codex در OpenClaw را به‌صورت محلی با
این فرمان شروع می‌کند:

```bash
codex app-server --listen stdio://
```

باینری مدیریت‌شده همراه بستهٔ Plugin به نام `codex` عرضه می‌شود. این کار نسخهٔ
app-server را به Plugin همراه گره می‌زند، نه به هر CLI جداگانهٔ Codex که ممکن
است به‌صورت محلی نصب شده باشد. `appServer.command` را فقط وقتی تنظیم کنید که
عمداً می‌خواهید یک فایل اجرایی متفاوت را اجرا کنید.

به‌طور پیش‌فرض، OpenClaw نشست‌های محلی هارنس Codex را در حالت YOLO شروع می‌کند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. این وضعیت اپراتور محلی مورد اعتماد است که
برای Heartbeatهای خودکار استفاده می‌شود: Codex می‌تواند بدون توقف روی اعلان‌های
تأیید بومی که کسی برای پاسخ‌دادن به آن‌ها حضور ندارد، از ابزارهای shell و شبکه
استفاده کند.

برای فعال‌سازی تأییدهای بازبینی‌شده توسط نگهبان Codex، `appServer.mode:
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

حالت Guardian از مسیر تأیید بازبینی خودکار بومی Codex استفاده می‌کند. وقتی
Codex درخواست خروج از sandbox، نوشتن بیرون از فضای کاری، یا افزودن مجوزهایی
مانند دسترسی شبکه را می‌دهد، Codex آن درخواست تأیید را به‌جای اعلان انسانی به
بازبین بومی مسیردهی می‌کند. بازبین چارچوب ریسک Codex را اعمال می‌کند و درخواست
مشخص را تأیید یا رد می‌کند. وقتی نسبت به حالت YOLO حفاظ‌های بیشتری می‌خواهید
اما هنوز لازم است عامل‌های بدون نظارت پیشرفت کنند، از Guardian استفاده کنید.

پیش‌تنظیم `guardian` به `approvalPolicy: "on-request"`،
`approvalsReviewer: "auto_review"`، و `sandbox: "workspace-write"` گسترش
می‌یابد. فیلدهای سیاستی منفرد همچنان `mode` را بازنویسی می‌کنند، بنابراین
استقرارهای پیشرفته می‌توانند پیش‌تنظیم را با انتخاب‌های صریح ترکیب کنند. مقدار
قدیمی‌تر بازبین `guardian_subagent` همچنان به‌عنوان نام مستعار سازگاری پذیرفته
می‌شود، اما پیکربندی‌های جدید باید از `auto_review` استفاده کنند.

برای یک app-server که از قبل در حال اجراست، از انتقال WebSocket استفاده کنید:

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

راه‌اندازی‌های stdio app-server به‌طور پیش‌فرض محیط فرایند OpenClaw را به ارث
می‌برند، اما OpenClaw مالک پل حساب app-server مربوط به Codex است و هم
`CODEX_HOME` و هم `HOME` را روی دایرکتوری‌های به‌ازای هر عامل زیر وضعیت همان
عامل OpenClaw تنظیم می‌کند. بارگذار مهارت خود Codex از `$CODEX_HOME/skills` و
`$HOME/.agents/skills` می‌خواند، بنابراین هر دو مقدار برای راه‌اندازی‌های محلی
app-server ایزوله هستند. این کار مهارت‌ها، Pluginها، پیکربندی، حساب‌ها، و
وضعیت رشتهٔ بومی Codex را به عامل OpenClaw محدود می‌کند، به‌جای اینکه از خانهٔ
شخصی CLI مربوط به Codex اپراتور نشت کنند.

Pluginهای OpenClaw و اسنپ‌شات‌های مهارت OpenClaw همچنان از طریق رجیستری Plugin
و بارگذار مهارت خود OpenClaw جریان پیدا می‌کنند. دارایی‌های شخصی CLI مربوط به
Codex این‌طور نیستند. اگر مهارت‌ها یا Pluginهای مفیدی در CLI مربوط به Codex
دارید که باید بخشی از یک عامل OpenClaw شوند، آن‌ها را صریحاً فهرست‌برداری کنید:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

ارائه‌دهندهٔ مهاجرت Codex مهارت‌ها را در فضای کاری عامل جاری OpenClaw کپی
می‌کند. Pluginهای بومی Codex، hookها، و فایل‌های پیکربندی برای بازبینی دستی
گزارش یا بایگانی می‌شوند و به‌صورت خودکار فعال نمی‌شوند، چون می‌توانند فرمان
اجرا کنند، سرورهای MCP را در معرض دسترس بگذارند، یا اعتبارنامه‌ها را حمل کنند.

احراز هویت به این ترتیب انتخاب می‌شود:

1. یک پروفایل صریح احراز هویت Codex در OpenClaw برای عامل.
2. حساب موجود app-server در خانهٔ Codex همان عامل.
3. فقط برای راه‌اندازی‌های محلی stdio app-server، `CODEX_API_KEY` و سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب app-server وجود ندارد و احراز هویت OpenAI
   همچنان لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex به سبک اشتراک ChatGPT را می‌بیند، `CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex ایجادشده حذف می‌کند. این کار باعث می‌شود کلیدهای API در سطح Gateway برای embeddings یا مدل‌های مستقیم OpenAI در دسترس بمانند، بدون اینکه نوبت‌های app-server بومی Codex ناخواسته از طریق API محاسبه هزینه شوند. پروفایل‌های صریح کلید API مخصوص Codex و fallback کلید محیطی stdio محلی، به‌جای env فرایند فرزند موروثی، از ورود app-server استفاده می‌کنند. اتصال‌های app-server از طریق WebSocket، fallback کلید API محیط Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب خود app-server راه‌دور استفاده کنید.

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

`appServer.clearEnv` فقط بر فرایند فرزند app-server ایجادشده Codex اثر می‌گذارد.

ابزارهای پویا Codex به‌طور پیش‌فرض از پروفایل `native-first` استفاده می‌کنند. در این حالت، OpenClaw ابزارهای پویایی را که عملیات فضای کاری بومی Codex را تکرار می‌کنند در معرض استفاده قرار نمی‌دهد: `read`، `write`، `edit`، `apply_patch`، `exec`، `process`، و `update_plan`. ابزارهای یکپارچه‌سازی OpenClaw مانند پیام‌رسانی، نشست‌ها، رسانه، cron، مرورگر، nodes، gateway، `heartbeat_respond`، و `web_search` همچنان در دسترس می‌مانند.

فیلدهای سطح‌بالای پشتیبانی‌شده برای Plugin Codex:

| فیلد                      | پیش‌فرض          | معنی                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | از `"openclaw-compat"` استفاده کنید تا مجموعه کامل ابزارهای پویای OpenClaw در اختیار app-server Codex قرار گیرد. |
| `codexDynamicToolsExclude` | `[]`             | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های app-server Codex حذف شوند.               |

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد               | پیش‌فرض                                  | معنی                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"`، Codex را ایجاد می‌کند؛ `"websocket"` به `url` متصل می‌شود.                                                                                                                                                                             |
| `command`           | باینری مدیریت‌شده Codex                     | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده، آن را تنظیم‌نشده بگذارید؛ فقط برای override صریح آن را تنظیم کنید.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | آرگومان‌ها برای انتقال stdio.                                                                                                                                                                                                       |
| `url`               | تنظیم‌نشده                                    | URL app-server از نوع WebSocket.                                                                                                                                                                                                            |
| `authToken`         | تنظیم‌نشده                                    | توکن Bearer برای انتقال WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | سرآیندهای اضافی WebSocket.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط موروثی توسط OpenClaw، از فرایند app-server ایجادشده stdio حذف می‌شوند. `CODEX_HOME` و `HOME` برای جداسازی Codex به‌ازای هر agent در OpenClaw هنگام راه‌اندازی‌های محلی رزرو شده‌اند. |
| `requestTimeoutMs`  | `60000`                                  | timeout برای فراخوانی‌های control-plane در app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | preset برای اجرای YOLO یا اجرای بازبینی‌شده توسط guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | سیاست تایید بومی Codex که به شروع/ازسرگیری/نوبت thread ارسال می‌شود.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | حالت sandbox بومی Codex که به شروع/ازسرگیری thread ارسال می‌شود.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | از `"auto_review"` استفاده کنید تا Codex promptهای تایید بومی را بازبینی کند. `guardian_subagent` همچنان یک alias قدیمی است.                                                                                                                         |
| `serviceTier`       | تنظیم‌نشده                                    | رده سرویس اختیاری app-server Codex: `"fast"`، `"flex"`، یا `null`. مقادیر قدیمی نامعتبر نادیده گرفته می‌شوند.                                                                                                                            |

فراخوانی‌های ابزار پویای متعلق به OpenClaw مستقل از `appServer.requestTimeoutMs` محدود می‌شوند: هر درخواست Codex `item/tool/call` باید ظرف ۳۰ ثانیه یک پاسخ OpenClaw دریافت کند. هنگام timeout، OpenClaw در صورت پشتیبانی سیگنال ابزار را abort می‌کند و یک پاسخ ابزار پویای ناموفق به Codex برمی‌گرداند تا نوبت بتواند ادامه پیدا کند، به‌جای اینکه نشست در حالت `processing` باقی بماند.

پس از اینکه OpenClaw به یک درخواست app-server محدود به نوبت Codex پاسخ می‌دهد، harness همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` به پایان برساند. اگر app-server پس از آن پاسخ به‌مدت ۶۰ ثانیه ساکت بماند، OpenClaw با بهترین تلاش نوبت Codex را interrupt می‌کند، یک timeout تشخیصی ثبت می‌کند، و lane نشست OpenClaw را آزاد می‌کند تا پیام‌های گفتگوی بعدی پشت یک نوبت بومی stale در صف نمانند.

Overrideهای محیطی برای آزمایش محلی همچنان در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم نشده باشد، `OPENCLAW_CODEX_APP_SERVER_BIN` باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از `plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای آزمایش محلی یک‌باره از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. برای استقرارهای تکرارپذیر، config ترجیح داده می‌شود، چون رفتار Plugin را در همان فایل بازبینی‌شده‌ای نگه می‌دارد که باقی تنظیمات harness Codex در آن قرار دارد.

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی جداگانه خودش پوشش داده شده است:
[استفاده از رایانه با Codex](/fa/plugins/codex-computer-use).

خلاصه‌اش این است: OpenClaw اپ کنترل دسکتاپ را vendor نمی‌کند و خودش اقدام‌های دسکتاپ را اجرا نمی‌کند. OpenClaw app-server Codex را آماده می‌کند، بررسی می‌کند که سرور MCP `computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex فراخوانی‌های ابزار MCP بومی را در طول نوبت‌های حالت Codex مدیریت کند.

برای دسترسی مستقیم به درایور TryCua خارج از جریان marketplace Codex، `cua-driver mcp` را با `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ثبت کنید. برای تفاوت بین استفاده از رایانه متعلق به Codex و ثبت مستقیم MCP، [استفاده از رایانه با Codex](/fa/plugins/codex-computer-use) را ببینید.

Config حداقلی:

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

راه‌اندازی را می‌توان از سطح فرمان بررسی یا نصب کرد:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

استفاده از رایانه مخصوص macOS است و ممکن است پیش از اینکه سرور MCP Codex بتواند اپ‌ها را کنترل کند، به مجوزهای محلی سیستم‌عامل نیاز داشته باشد. اگر `computerUse.enabled` برابر true باشد و سرور MCP در دسترس نباشد، نوبت‌های حالت Codex پیش از شروع thread شکست می‌خورند، به‌جای اینکه بی‌صدا بدون ابزارهای بومی استفاده از رایانه اجرا شوند. برای گزینه‌های marketplace، محدودیت‌های catalog راه‌دور، دلیل‌های status، و عیب‌یابی، [استفاده از رایانه با Codex](/fa/plugins/codex-computer-use) را ببینید.

وقتی `computerUse.autoInstall` برابر true باشد، OpenClaw می‌تواند marketplace استاندارد همراه Codex Desktop را از `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند، اگر Codex هنوز یک marketplace محلی کشف نکرده باشد. پس از تغییر runtime یا config استفاده از رایانه، از `/new` یا `/reset` استفاده کنید تا نشست‌های موجود binding قدیمی PI یا thread Codex را نگه ندارند.

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

تعویض مدل تحت کنترل OpenClaw می‌ماند. وقتی یک نشست OpenClaw به یک thread موجود Codex متصل است، نوبت بعدی مدل OpenAI، provider، سیاست تایید، sandbox، و رده سرویس انتخاب‌شده فعلی را دوباره به app-server ارسال می‌کند. تعویض از `openai/gpt-5.5` به `openai/gpt-5.2`، binding thread را حفظ می‌کند اما از Codex می‌خواهد با مدل تازه انتخاب‌شده ادامه دهد.

## فرمان Codex

Plugin همراه، `/codex` را به‌عنوان یک فرمان slash مجاز ثبت می‌کند. این فرمان عمومی است و روی هر کانالی که از فرمان‌های متنی OpenClaw پشتیبانی کند کار می‌کند.

شکل‌های رایج:

- `/codex status` اتصال زندهٔ سرور برنامه، مدل‌ها، حساب، محدودیت‌های نرخ، سرورهای MCP و Skills را نشان می‌دهد.
- `/codex models` مدل‌های زندهٔ سرور برنامهٔ Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر Codex را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک رشتهٔ موجود Codex متصل می‌کند.
- `/codex compact` از سرور برنامهٔ Codex می‌خواهد رشتهٔ متصل‌شده را compact کند.
- `/codex review` بازبینی بومی Codex را برای رشتهٔ متصل‌شده شروع می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد تشخیصی Codex برای رشتهٔ متصل‌شده درخواست تأیید می‌کند.
- `/codex computer-use status` Plugin و سرور MCP پیکربندی‌شده برای Computer Use را بررسی می‌کند.
- `/codex computer-use install` Plugin پیکربندی‌شده برای Computer Use را نصب می‌کند و سرورهای MCP را دوباره بارگذاری می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP در سرور برنامهٔ Codex را فهرست می‌کند.
- `/codex skills` Skills سرور برنامهٔ Codex را فهرست می‌کند.

وقتی Codex یک شکست ناشی از محدودیت مصرف گزارش می‌کند، اگر Codex زمان بازنشانی بعدی سرور برنامه را ارائه کرده باشد، OpenClaw آن را هم شامل می‌کند. برای بررسی حساب فعلی و پنجره‌های محدودیت نرخ، در همان گفتگو از `/codex account` استفاده کنید.

### گردش‌کار رایج اشکال‌زدایی

وقتی یک عامل پشتیبانی‌شده با Codex در Telegram، Discord، Slack یا کانال دیگری رفتاری غیرمنتظره انجام می‌دهد، از همان گفتگویی شروع کنید که مشکل در آن رخ داده است:

1. `/diagnostics bad tool choice after image upload` یا یادداشت کوتاه دیگری را اجرا کنید که آنچه دیده‌اید را توصیف می‌کند.
2. درخواست تشخیص را یک‌بار تأیید کنید. این تأیید، فایل زیپ تشخیص محلی Gateway را ایجاد می‌کند و چون نشست از مهار Codex استفاده می‌کند، بستهٔ بازخورد مرتبط Codex را نیز به سرورهای OpenAI ارسال می‌کند.
3. پاسخ تکمیل‌شدهٔ تشخیص را در گزارش اشکال یا رشتهٔ پشتیبانی کپی کنید. این پاسخ شامل مسیر بستهٔ محلی، خلاصهٔ حریم خصوصی، شناسه‌های نشست OpenClaw، شناسه‌های رشتهٔ Codex و یک خط `Inspect locally` برای هر رشتهٔ Codex است.
4. اگر می‌خواهید خودتان اجرای آن را اشکال‌زدایی کنید، فرمان چاپ‌شدهٔ `Inspect locally` را در ترمینال اجرا کنید. این فرمان شبیه `codex resume <thread-id>` است و رشتهٔ بومی Codex را باز می‌کند تا بتوانید گفتگو را بررسی کنید، آن را به‌صورت محلی ادامه دهید، یا از Codex بپرسید چرا ابزار یا برنامهٔ خاصی را انتخاب کرده است.

فقط زمانی از `/codex diagnostics [note]` استفاده کنید که مشخصاً می‌خواهید بارگذاری بازخورد Codex برای رشتهٔ فعلاً متصل‌شده انجام شود، بدون بستهٔ کامل تشخیص Gateway مربوط به OpenClaw. برای بیشتر گزارش‌های پشتیبانی، `/diagnostics [note]` نقطهٔ شروع بهتری است، چون وضعیت محلی Gateway و شناسه‌های رشتهٔ Codex را در یک پاسخ به هم پیوند می‌دهد. برای مدل کامل حریم خصوصی و رفتار گفتگوی گروهی، [برون‌بری تشخیص](/fa/gateway/diagnostics) را ببینید.

هستهٔ OpenClaw همچنین `/diagnostics [note]` مخصوص مالک را به‌عنوان فرمان عمومی تشخیص Gateway ارائه می‌کند. درخواست تأیید آن پیش‌گفتار داده‌های حساس را نشان می‌دهد، به [برون‌بری تشخیص](/fa/gateway/diagnostics) پیوند می‌دهد، و هر بار `openclaw gateway diagnostics export --json` را از طریق تأیید صریح اجرا درخواست می‌کند. تشخیص را با قاعدهٔ allow-all تأیید نکنید. پس از تأیید، OpenClaw گزارشی قابل چسباندن با مسیر بستهٔ محلی و خلاصهٔ مانیفست ارسال می‌کند. وقتی نشست فعال OpenClaw از مهار Codex استفاده می‌کند، همان تأیید ارسال بسته‌های بازخورد مرتبط Codex به سرورهای OpenAI را نیز مجاز می‌کند. درخواست تأیید می‌گوید که بازخورد Codex ارسال خواهد شد، اما پیش از تأیید، شناسه‌های نشست یا رشتهٔ Codex را فهرست نمی‌کند.

اگر `/diagnostics` توسط یک مالک در گفتگوی گروهی فراخوانی شود، OpenClaw کانال مشترک را تمیز نگه می‌دارد: گروه فقط یک اعلان کوتاه دریافت می‌کند، در حالی که پیش‌گفتار تشخیص، درخواست‌های تأیید و شناسه‌های نشست/رشتهٔ Codex از مسیر تأیید خصوصی برای مالک ارسال می‌شوند. اگر مسیر خصوصی برای مالک وجود نداشته باشد، OpenClaw درخواست گروه را رد می‌کند و از مالک می‌خواهد آن را از یک DM اجرا کند.

بارگذاری تأییدشدهٔ Codex، `feedback/upload` سرور برنامهٔ Codex را فراخوانی می‌کند و از سرور برنامه می‌خواهد در صورت امکان، لاگ‌ها را برای هر رشتهٔ فهرست‌شده و زیررشته‌های ایجادشدهٔ Codex شامل کند. بارگذاری از مسیر عادی بازخورد Codex به سرورهای OpenAI می‌رود؛ اگر بازخورد Codex در آن سرور برنامه غیرفعال باشد، فرمان خطای سرور برنامه را برمی‌گرداند. پاسخ تکمیل‌شدهٔ تشخیص، کانال‌ها، شناسه‌های نشست OpenClaw، شناسه‌های رشتهٔ Codex و فرمان‌های محلی `codex resume <thread-id>` را برای رشته‌هایی که ارسال شده‌اند فهرست می‌کند. اگر تأیید را رد کنید یا نادیده بگیرید، OpenClaw آن شناسه‌های Codex را چاپ نمی‌کند. این بارگذاری جایگزین برون‌بری تشخیص محلی Gateway نمی‌شود.

`/codex resume` همان فایل اتصال sidecar را می‌نویسد که مهار برای نوبت‌های عادی استفاده می‌کند. در پیام بعدی، OpenClaw همان رشتهٔ Codex را از سر می‌گیرد، مدل فعلاً انتخاب‌شدهٔ OpenClaw را به سرور برنامه می‌فرستد، و تاریخچهٔ گسترده را فعال نگه می‌دارد.

### بررسی یک رشتهٔ Codex از CLI

سریع‌ترین راه برای فهمیدن یک اجرای ناموفق Codex اغلب این است که رشتهٔ بومی Codex را مستقیماً باز کنید:

```sh
codex resume <thread-id>
```

وقتی در یک گفتگوی کانالی متوجه اشکالی می‌شوید و می‌خواهید نشست مشکل‌دار Codex را بررسی کنید، آن را به‌صورت محلی ادامه دهید، یا از Codex بپرسید چرا ابزار یا انتخاب استدلالی خاصی انجام داده است، از این استفاده کنید. ساده‌ترین مسیر معمولاً این است که ابتدا `/diagnostics [note]` را اجرا کنید: پس از تأیید شما، گزارش تکمیل‌شده هر رشتهٔ Codex را فهرست می‌کند و یک فرمان `Inspect locally` چاپ می‌کند، برای مثال `codex resume <thread-id>`. می‌توانید آن فرمان را مستقیم در ترمینال کپی کنید.

همچنین می‌توانید شناسهٔ رشته را از `/codex binding` برای گفتگوی فعلی یا از `/codex threads [filter]` برای رشته‌های اخیر سرور برنامهٔ Codex بگیرید، سپس همان فرمان `codex resume` را در shell خود اجرا کنید.

سطح فرمان به سرور برنامهٔ Codex نسخهٔ `0.125.0` یا جدیدتر نیاز دارد. اگر یک سرور برنامهٔ آینده یا سفارشی آن متد JSON-RPC را ارائه نکند، روش‌های کنترلی جداگانه با پیام `unsupported by this Codex app-server` گزارش می‌شوند.

## مرزهای hook

مهار Codex سه لایهٔ hook دارد:

| لایه                                  | مالک                     | هدف                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| hookهای Plugin مربوط به OpenClaw      | OpenClaw                 | سازگاری محصول/Plugin در مهارهای PI و Codex.                         |
| میان‌افزار افزونهٔ سرور برنامهٔ Codex | Pluginهای همراه OpenClaw | رفتار آداپتر در هر نوبت پیرامون ابزارهای پویا OpenClaw.             |
| hookهای بومی Codex                    | Codex                    | چرخهٔ حیات سطح پایین Codex و سیاست ابزار بومی از پیکربندی Codex.   |

OpenClaw از فایل‌های `hooks.json` پروژه یا سراسری Codex برای مسیریابی رفتار Pluginهای OpenClaw استفاده نمی‌کند. برای ابزار بومی و پل مجوز پشتیبانی‌شده، OpenClaw پیکربندی Codex مخصوص هر رشته را برای `PreToolUse`، `PostToolUse`، `PermissionRequest` و `Stop` تزریق می‌کند. وقتی تأییدهای سرور برنامهٔ Codex فعال باشند (`approvalPolicy` برابر `"never"` نباشد)، پیکربندی hook بومی تزریق‌شدهٔ پیش‌فرض، `PermissionRequest` را حذف می‌کند تا بازبین سرور برنامهٔ Codex و پل تأیید OpenClaw پس از بازبینی، ارتقاهای واقعی را مدیریت کنند. اپراتورها همچنان می‌توانند وقتی به رلهٔ سازگاری نیاز دارند، `permission_request` را صراحتاً به `nativeHookRelay.events` اضافه کنند. hookهای دیگر Codex مانند `SessionStart` و `UserPromptSubmit` کنترل‌های سطح Codex باقی می‌مانند؛ آن‌ها در قرارداد v1 به‌عنوان hookهای Plugin مربوط به OpenClaw ارائه نمی‌شوند.

برای ابزارهای پویای OpenClaw، OpenClaw پس از اینکه Codex درخواست فراخوانی می‌دهد، ابزار را اجرا می‌کند، بنابراین OpenClaw رفتار Plugin و میان‌افزاری را که مالک آن است در آداپتر مهار فعال می‌کند. برای ابزارهای بومی Codex، Codex مالک رکورد مرجع ابزار است. OpenClaw می‌تواند رویدادهای منتخب را بازتاب دهد، اما نمی‌تواند رشتهٔ بومی Codex را بازنویسی کند مگر اینکه Codex آن عملیات را از طریق سرور برنامه یا callbackهای hook بومی ارائه کند.

پروژکشن‌های Compaction و چرخهٔ حیات LLM از اعلان‌های سرور برنامهٔ Codex و وضعیت آداپتر OpenClaw می‌آیند، نه از فرمان‌های hook بومی Codex. رویدادهای `before_compaction`، `after_compaction`، `llm_input` و `llm_output` در OpenClaw مشاهده‌های سطح آداپتر هستند، نه ثبت‌های بایت‌به‌بایت از درخواست داخلی یا payloadهای Compaction در Codex.

اعلان‌های سرور برنامهٔ `hook/started` و `hook/completed` بومی Codex به‌عنوان رویدادهای عامل `codex_app_server.hook` برای مسیر اجرا و اشکال‌زدایی پروجکت می‌شوند. آن‌ها hookهای Plugin مربوط به OpenClaw را فراخوانی نمی‌کنند.

## قرارداد پشتیبانی V1

حالت Codex همان PI با یک فراخوانی مدل متفاوت در زیر آن نیست. Codex بخش بیشتری از حلقهٔ مدل بومی را مالک است، و OpenClaw سطح‌های Plugin و نشست خود را پیرامون آن مرز تطبیق می‌دهد.

در زمان اجرای Codex v1 پشتیبانی می‌شود:

| سطح                                           | پشتیبانی                                                                            | دلیل                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حلقه مدل OpenAI از طریق Codex                 | پشتیبانی می‌شود                                                                      | app-server مربوط به Codex مالک نوبت OpenAI، ازسرگیری بومی رشته گفتگو، و ادامه ابزار بومی است.                                                                                                           |
| مسیریابی و تحویل کانال OpenClaw               | پشتیبانی می‌شود                                                                      | Telegram، Discord، Slack، WhatsApp، iMessage، و کانال‌های دیگر بیرون از زمان اجرای مدل باقی می‌مانند.                                                                                                   |
| ابزارهای پویای OpenClaw                       | پشتیبانی می‌شود                                                                      | Codex از OpenClaw می‌خواهد این ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.                                                                                                        |
| Pluginهای اعلان و زمینه                      | پشتیبانی می‌شود                                                                      | OpenClaw پوشش‌های اعلان را می‌سازد و پیش از شروع یا ازسرگیری رشته گفتگو، زمینه را به نوبت Codex وارد می‌کند.                                                                                            |
| چرخه عمر موتور زمینه                          | پشتیبانی می‌شود                                                                      | مونتاژ، جذب یا نگهداری پس از نوبت، و هماهنگی Compaction موتور زمینه برای نوبت‌های Codex اجرا می‌شود.                                                                                                    |
| هوک‌های ابزار پویا                            | پشتیبانی می‌شود                                                                      | میان‌افزارهای `before_tool_call`، `after_tool_call`، و نتیجه ابزار پیرامون ابزارهای پویای متعلق به OpenClaw اجرا می‌شوند.                                                                               |
| هوک‌های چرخه عمر                              | به‌عنوان مشاهدات آداپتر پشتیبانی می‌شود                                             | `llm_input`، `llm_output`، `agent_end`، `before_compaction`، و `after_compaction` با payloadهای صادقانه حالت Codex فعال می‌شوند.                                                                         |
| دروازه بازنگری پاسخ نهایی                     | از طریق رله هوک بومی پشتیبانی می‌شود                                                | `Stop` مربوط به Codex به `before_agent_finalize` رله می‌شود؛ `revise` از Codex یک گذر مدل دیگر پیش از نهایی‌سازی درخواست می‌کند.                                                                        |
| مسدودسازی یا مشاهده shell، patch، و MCP بومی | از طریق رله هوک بومی پشتیبانی می‌شود                                                | `PreToolUse` و `PostToolUse` مربوط به Codex برای سطوح ابزار بومی متعهدشده، از جمله payloadهای MCP در app-server مربوط به Codex نسخه `0.125.0` یا جدیدتر، رله می‌شوند. مسدودسازی پشتیبانی می‌شود؛ بازنویسی آرگومان پشتیبانی نمی‌شود. |
| سیاست مجوز بومی                               | از طریق تأییدهای app-server مربوط به Codex و رله هوک بومی سازگار پشتیبانی می‌شود    | درخواست‌های تأیید app-server مربوط به Codex پس از بازبینی Codex از طریق OpenClaw مسیر می‌گیرند. رله هوک بومی `PermissionRequest` برای حالت‌های تأیید بومی اختیاری است، چون Codex آن را پیش از بازبینی guardian منتشر می‌کند. |
| ضبط مسیر app-server                           | پشتیبانی می‌شود                                                                      | OpenClaw درخواستی را که به app-server فرستاده و اعلان‌های app-server را که دریافت می‌کند ثبت می‌کند.                                                                                                    |

در زمان اجرای Codex نسخه v1 پشتیبانی نمی‌شود:

| سطح                                                 | مرز V1                                                                                                                                          | مسیر آینده                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| جهش آرگومان ابزار بومی                              | هوک‌های پیش‌ابزار بومی Codex می‌توانند مسدود کنند، اما OpenClaw آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند.                            | نیازمند پشتیبانی هوک/schema در Codex برای ورودی ابزار جایگزین است.                       |
| تاریخچه قابل ویرایش رونوشت بومی Codex              | Codex مالک تاریخچه بومی متعارف رشته گفتگو است. OpenClaw مالک یک آینه است و می‌تواند زمینه آینده را وارد کند، اما نباید داخلی‌های پشتیبانی‌نشده را جهش دهد. | اگر جراحی رشته گفتگوی بومی لازم باشد، APIهای صریح app-server مربوط به Codex را اضافه کنید. |
| `tool_result_persist` برای رکوردهای ابزار بومی Codex | آن هوک نوشتن‌های رونوشت متعلق به OpenClaw را دگرگون می‌کند، نه رکوردهای ابزار بومی Codex.                                                     | می‌تواند رکوردهای دگرگون‌شده را آینه کند، اما بازنویسی متعارف به پشتیبانی Codex نیاز دارد. |
| فراداده غنی Compaction بومی                        | OpenClaw شروع و تکمیل Compaction را مشاهده می‌کند، اما فهرست پایدار نگه‌داشته/حذف‌شده، دلتا توکن، یا payload خلاصه دریافت نمی‌کند.           | به رویدادهای غنی‌تر Compaction در Codex نیاز دارد.                                       |
| مداخله در Compaction                                | هوک‌های فعلی Compaction در OpenClaw در حالت Codex در سطح اعلان هستند.                                                                          | اگر Pluginها نیاز به وتو یا بازنویسی Compaction بومی دارند، هوک‌های پیش/پس Compaction در Codex اضافه کنید. |
| ضبط درخواست API مدل به‌صورت byte-for-byte          | OpenClaw می‌تواند درخواست‌ها و اعلان‌های app-server را ضبط کند، اما هسته Codex درخواست نهایی API OpenAI را به‌صورت داخلی می‌سازد.             | به یک رویداد رهگیری درخواست مدل در Codex یا API اشکال‌زدایی نیاز دارد.                  |

## ابزارها، رسانه، و Compaction

هارنس Codex فقط اجراکننده سطح پایین عامل تعبیه‌شده را تغییر می‌دهد.

OpenClaw همچنان فهرست ابزارها را می‌سازد و نتایج ابزار پویا را از هارنس
دریافت می‌کند. متن، تصویر، ویدیو، موسیقی، TTS، تأییدها، و خروجی ابزار پیام‌رسانی
از مسیر تحویل عادی OpenClaw ادامه می‌یابند.

رله هوک بومی عمداً عمومی است، اما قرارداد پشتیبانی v1
به مسیرهای ابزار و مجوز بومی Codex که OpenClaw آزمایش می‌کند محدود است. در
زمان اجرای Codex، این شامل payloadهای shell، patch، و MCP `PreToolUse`،
`PostToolUse`، و `PermissionRequest` می‌شود. فرض نکنید هر رویداد هوک آینده
Codex یک سطح Plugin در OpenClaw است مگر آنکه قرارداد زمان اجرا نام آن را
ذکر کند.

برای `PermissionRequest`، OpenClaw فقط وقتی سیاست تصمیم بگیرد، تصمیم‌های صریح allow یا deny را برمی‌گرداند.
نتیجه بدون تصمیم، allow نیست. Codex آن را به‌عنوان نبود تصمیم هوک تلقی می‌کند
و به مسیر guardian یا تأیید کاربر خودش ادامه می‌دهد.
حالت‌های تأیید app-server مربوط به Codex این هوک بومی را به‌طور پیش‌فرض حذف می‌کنند؛ این بند
وقتی اعمال می‌شود که `permission_request` به‌طور صریح در
`nativeHookRelay.events` گنجانده شده باشد یا یک زمان اجرای سازگاری آن را نصب کند.
وقتی یک اپراتور برای درخواست مجوز بومی Codex گزینه `allow-always` را انتخاب می‌کند،
OpenClaw همان اثرانگشت دقیق provider/session/tool input/cwd را برای یک
بازه محدود جلسه به خاطر می‌سپارد. تصمیم به‌یادسپرده‌شده عمداً فقط با تطابق دقیق
کار می‌کند: دستور، آرگومان‌ها، payload ابزار، یا cwd تغییریافته یک
تأیید تازه ایجاد می‌کند.

درخواست‌های تأیید ابزار MCP مربوط به Codex وقتی Codex مقدار `_meta.codex_approval_kind` را
`"mcp_tool_call"` علامت‌گذاری کند، از طریق جریان تأیید Plugin در OpenClaw مسیر می‌گیرند.
اعلان‌های `request_user_input` مربوط به Codex به گفت‌وگوی مبدأ برگردانده می‌شوند،
و پیام پیگیری بعدی در صف، به‌جای هدایت شدن به‌عنوان زمینه اضافی، به آن درخواست
server بومی پاسخ می‌دهد. درخواست‌های دیگر MCP همچنان به‌صورت fail closed شکست می‌خورند.

هدایت صف اجرای فعال به `turn/steer` در app-server مربوط به Codex نگاشت می‌شود. با
پیش‌فرض `messages.queue.mode: "steer"`، OpenClaw پیام‌های گفت‌وگوی صف‌شده را
برای پنجره سکوت پیکربندی‌شده دسته‌بندی می‌کند و آن‌ها را در ترتیب ورود به‌صورت یک درخواست
`turn/steer` می‌فرستد. حالت قدیمی `queue` درخواست‌های جداگانه `turn/steer` می‌فرستد. نوبت‌های
بازبینی Codex و Compaction دستی می‌توانند هدایت همان نوبت را رد کنند، که در این صورت
OpenClaw وقتی حالت انتخاب‌شده اجازه fallback بدهد از صف پیگیری استفاده می‌کند. به
[صف هدایت](/fa/concepts/queue-steering) مراجعه کنید.

وقتی مدل انتخاب‌شده از هارنس Codex استفاده می‌کند، Compaction رشته گفتگوی بومی
به app-server مربوط به Codex واگذار می‌شود. OpenClaw یک آینه رونوشت را برای تاریخچه کانال،
جست‌وجو، `/new`، `/reset`، و تغییر مدل یا هارنس در آینده نگه می‌دارد. این
آینه شامل اعلان کاربر، متن نهایی دستیار، و رکوردهای سبک استدلال یا برنامه Codex
می‌شود، وقتی app-server آن‌ها را منتشر کند. امروز، OpenClaw فقط
سیگنال‌های شروع و تکمیل Compaction بومی را ثبت می‌کند. هنوز خلاصه‌ای
خوانا برای انسان یا فهرست قابل ممیزی از اینکه Codex پس از Compaction کدام ورودی‌ها را
نگه داشته است ارائه نمی‌کند.

از آنجا که Codex مالک رشته گفتگوی بومی متعارف است، `tool_result_persist` در حال حاضر
رکوردهای نتیجه ابزار بومی Codex را بازنویسی نمی‌کند. این فقط وقتی اعمال می‌شود که
OpenClaw در حال نوشتن نتیجه ابزار رونوشت جلسه متعلق به OpenClaw باشد.

تولید رسانه به PI نیاز ندارد. تصویر، ویدیو، موسیقی، PDF، TTS، و درک رسانه
همچنان از تنظیمات provider/model متناظر مانند
`agents.defaults.imageGenerationModel`، `videoGenerationModel`، `pdfModel`، و
`messages.tts` استفاده می‌کنند.

## عیب‌یابی

**Codex به‌عنوان provider معمولی `/model` ظاهر نمی‌شود:** این برای
پیکربندی‌های جدید مورد انتظار است. یک مدل `openai/gpt-*` را با
`agentRuntime.id: "codex"` (یا یک ارجاع قدیمی `codex/*`) انتخاب کنید،
`plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید که آیا `plugins.allow`
گزینه `codex` را مستثنی کرده است یا نه.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** `agentRuntime.id: "auto"` همچنان می‌تواند از PI به‌عنوان
backend سازگاری استفاده کند وقتی هیچ هارنس Codex اجرای مورد نظر را claim نکند. برای
اجبار انتخاب Codex هنگام آزمایش، `agentRuntime.id: "codex"` را تنظیم کنید. زمان اجرای
اجباری Codex به‌جای fallback به PI شکست می‌خورد. پس از انتخاب app-server مربوط به Codex،
خرابی‌های آن مستقیماً نمایان می‌شوند.

**app-server رد می‌شود:** Codex را ارتقا دهید تا handshake مربوط به app-server
نسخه `0.125.0` یا جدیدتر را گزارش کند. prereleaseهای همان نسخه یا نسخه‌های دارای پسوند build
مانند `0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون کف
پروتکل پایدار `0.125.0` همان چیزی است که OpenClaw آزمایش می‌کند.

**کشف مدل کند است:** مقدار `plugins.entries.codex.config.discovery.timeoutMs`
را کاهش دهید یا کشف را غیرفعال کنید.

**انتقال WebSocket فوراً شکست می‌خورد:** `appServer.url`، `authToken`،
و اینکه app-server راه‌دور همان نسخه پروتکل app-server مربوط به Codex را صحبت می‌کند بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این مورد انتظار است مگر اینکه
`agentRuntime.id: "codex"` را برای آن عامل اجبار کرده باشید یا یک ارجاع قدیمی
`codex/*` انتخاب کرده باشید. ارجاع‌های ساده `openai/gpt-*` و providerهای دیگر در حالت
`auto` روی مسیر provider عادی خود باقی می‌مانند. اگر `agentRuntime.id: "codex"` را اجبار کنید، هر نوبت تعبیه‌شده
برای آن عامل باید یک مدل OpenAI پشتیبانی‌شده توسط Codex باشد.

**Computer Use نصب است اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه
`/codex computer-use status` را بررسی کنید. اگر ابزاری
`Native hook relay unavailable` را گزارش کرد، از `/new` یا `/reset` استفاده کنید؛ اگر ادامه داشت، gateway را راه‌اندازی مجدد کنید تا ثبت‌های قدیمی قلاب بومی پاک شوند. اگر `computer-use.list_apps` زمان‌بر و متوقف شد، Codex Computer Use یا Codex Desktop را راه‌اندازی مجدد کنید و دوباره تلاش کنید.

## مرتبط

- [Pluginهای مهار عامل](/fa/plugins/sdk-agent-harness)
- [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [ارائه‌دهنده OpenAI](/fa/providers/openai)
- [وضعیت](/fa/cli/status)
- [قلاب‌های Plugin](/fa/plugins/hooks)
- [مرجع پیکربندی Gateway](/fa/gateway/configuration-reference)
- [آزمایش](/fa/help/testing-live#live-codex-app-server-harness-smoke)

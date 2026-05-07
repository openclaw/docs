---
read_when:
    - می‌خواهید از هارنس app-server همراهِ Codex استفاده کنید
    - به نمونه‌های پیکربندی هارنس Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به PI با شکست مواجه شوند
summary: اجرای نوبت‌های عامل تعبیه‌شدهٔ OpenClaw از طریق هارنس app-server همراه Codex
title: چارچوب اجرایی Codex
x-i18n:
    generated_at: "2026-05-07T13:27:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw اجازه می‌دهد چرخش‌های عامل تعبیه‌شده را از طریق
app-server Codex اجرا کند، نه از طریق harness داخلی PI.

از این زمانی استفاده کنید که می‌خواهید Codex مالک نشست سطح‌پایین عامل باشد: کشف مدل،
ازسرگیری بومی رشته، Compaction بومی، و اجرای app-server.
OpenClaw همچنان مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل، ابزارها،
تأییدها، تحویل رسانه، و آینه transcript قابل مشاهده است.

وقتی یک چرخش چت منبع از طریق harness Codex اجرا می‌شود، پاسخ‌های قابل مشاهده در حالت پیش‌فرض
از ابزار `message` در OpenClaw استفاده می‌کنند، اگر استقرار به‌صراحت
`messages.visibleReplies` را پیکربندی نکرده باشد. عامل همچنان می‌تواند چرخش Codex خود را به‌صورت خصوصی تمام کند؛
فقط وقتی در کانال پست می‌کند که `message(action="send")` را فراخوانی کند. برای نگه داشتن پاسخ‌های نهایی چت مستقیم روی
مسیر تحویل خودکار قدیمی، `messages.visibleReplies: "automatic"` را تنظیم کنید.

چرخش‌های Heartbeat در Codex نیز به‌صورت پیش‌فرض ابزار `heartbeat_respond` را دریافت می‌کنند، تا
عامل بتواند ثبت کند که بیدارسازی باید بی‌صدا بماند یا اعلان بدهد، بدون اینکه
آن جریان کنترل را در متن نهایی کدگذاری کند.

راهنمای initiative مخصوص Heartbeat به‌عنوان دستور توسعه‌دهنده collaboration-mode در Codex
روی خود چرخش Heartbeat ارسال می‌شود. چرخش‌های چت عادی به‌جای حمل فلسفه Heartbeat در prompt
اجرای عادی‌شان، حالت Codex Default را بازیابی می‌کنند.

اگر می‌خواهید جهت‌گیری پیدا کنید، از
[زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) شروع کنید. نسخه کوتاه این است:
`openai/gpt-5.5` مرجع مدل است، `codex` runtime است، و Telegram،
Discord، Slack، یا کانال دیگری همچنان سطح ارتباطی باقی می‌ماند.

## پیکربندی سریع

بیشتر کاربرانی که «Codex در OpenClaw» را می‌خواهند، این مسیر را می‌خواهند: با یک
اشتراک ChatGPT/Codex وارد شوید، سپس چرخش‌های عامل تعبیه‌شده را از طریق runtime بومی
app-server Codex اجرا کنید. مرجع مدل همچنان به‌صورت canonical در قالب
`openai/gpt-*` می‌ماند؛ احراز هویت اشتراک از حساب/نمایه Codex می‌آید، نه
از پیشوند مدل `openai-codex/*`.

اگر هنوز این کار را نکرده‌اید، ابتدا با Codex OAuth وارد شوید:

```bash
openclaw models auth login --provider openai-codex
```

سپس Plugin همراه `codex` را فعال کنید و runtime Codex را اجباری کنید:

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

در پیکربندی از `openai-codex/gpt-*` استفاده نکنید. آن پیشوند یک مسیر قدیمی است که
`openclaw doctor --fix` آن را در مدل‌های اصلی،
fallbackها، overrideهای heartbeat/subagent/compaction، hookها، overrideهای کانال،
و پین‌های مسیر نشست پایدارشده قدیمی به `openai/gpt-*` بازنویسی می‌کند.

## این Plugin چه چیزی را تغییر می‌دهد

Plugin همراه `codex` چند قابلیت جداگانه ارائه می‌کند:

| قابلیت                        | نحوه استفاده                                      | کاری که انجام می‌دهد                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| runtime تعبیه‌شده بومی           | `agentRuntime.id: "codex"`                          | چرخش‌های عامل تعبیه‌شده OpenClaw را از طریق app-server Codex اجرا می‌کند.                  |
| فرمان‌های کنترل چت بومی      | `/codex bind`, `/codex resume`, `/codex steer`, ... | رشته‌های app-server Codex را از یک گفت‌وگوی پیام‌رسانی bind و کنترل می‌کند.    |
| provider/catalog app-server Codex | بخش‌های داخلی `codex`، ارائه‌شده از طریق harness     | به runtime اجازه می‌دهد مدل‌های app-server را کشف و اعتبارسنجی کند.                     |
| مسیر درک رسانه‌ای Codex    | مسیرهای سازگاری مدل تصویر `codex/*`           | چرخش‌های محدود app-server Codex را برای مدل‌های پشتیبانی‌شده درک تصویر اجرا می‌کند. |
| relay بومی hook                 | hookهای Plugin پیرامون رویدادهای بومی Codex             | به OpenClaw اجازه می‌دهد رویدادهای پشتیبانی‌شده ابزار/نهایی‌سازی بومی Codex را مشاهده/مسدود کند.  |

فعال کردن Plugin این قابلیت‌ها را در دسترس قرار می‌دهد. این کار **این موارد را انجام نمی‌دهد**:

- جایگزین کردن سطوح مستقیم کلید API مربوط به OpenAI مانند تصاویر، embeddings، گفتار، یا
  realtime
- تبدیل مراجع مدل `openai-codex/*` بدون `openclaw doctor --fix`
- تبدیل ACP/acpx به مسیر پیش‌فرض Codex
- hot-switch کردن نشست‌های موجودی که قبلاً runtime PI را ثبت کرده‌اند
- جایگزین کردن تحویل کانال OpenClaw، فایل‌های نشست، ذخیره‌سازی auth-profile، یا
  مسیریابی پیام

همین Plugin مالک سطح فرمان کنترل چت بومی `/codex` نیز هست. اگر
Plugin فعال باشد و کاربر بخواهد رشته‌های Codex را از چت bind، resume، steer، stop، یا inspect کند،
عامل‌ها باید `/codex ...` را به ACP ترجیح دهند. ACP زمانی fallback صریح باقی می‌ماند
که کاربر ACP/acpx را درخواست کند یا adapter Codex مربوط به ACP را آزمایش کند.

چرخش‌های بومی Codex، hookهای Plugin در OpenClaw را به‌عنوان لایه سازگاری عمومی حفظ می‌کنند.
این‌ها hookهای درون‌فرایندی OpenClaw هستند، نه hookهای فرمان `hooks.json` در Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` برای رکوردهای transcript آینه‌شده
- `before_agent_finalize` از طریق relay `Stop` در Codex
- `agent_end`

Pluginها همچنین می‌توانند middleware نتیجه ابزار مستقل از runtime ثبت کنند تا
نتایج ابزار پویای OpenClaw را پس از اجرای ابزار توسط OpenClaw و پیش از
بازگرداندن نتیجه به Codex بازنویسی کنند. این از hook عمومی Plugin با نام
`tool_result_persist` جدا است، که نوشتن‌های نتیجه ابزار transcript تحت مالکیت OpenClaw را transform می‌کند.

برای معنای خود hookهای Plugin، [hookهای Plugin](/fa/plugins/hooks)
و [رفتار guard در Plugin](/fa/tools/plugin) را ببینید.

مراجع مدل عامل OpenAI به‌صورت پیش‌فرض از harness استفاده می‌کنند. پیکربندی‌های جدید باید
مراجع مدل OpenAI را به‌صورت canonical در قالب `openai/gpt-*` نگه دارند؛ `agentRuntime.id: "codex"`
هنوز معتبر است اما دیگر برای چرخش‌های عامل OpenAI لازم نیست. مراجع مدل قدیمی `codex/*`
همچنان برای سازگاری harness را خودکار انتخاب می‌کنند، اما
پیشوندهای provider قدیمی مبتنی بر runtime به‌عنوان گزینه‌های عادی model/provider نمایش داده نمی‌شوند.

اگر هر مسیر مدل پیکربندی‌شده هنوز `openai-codex/*` باشد، `openclaw doctor --fix`
آن را به `openai/*` بازنویسی می‌کند. برای مسیرهای عامل منطبق، runtime عامل را
روی `codex` تنظیم می‌کند و overrideهای auth profile موجود `openai-codex` را حفظ می‌کند.

## نقشه مسیر

پیش از تغییر پیکربندی از این جدول استفاده کنید:

| رفتار مطلوب                                     | مرجع مدل                  | پیکربندی runtime                         | مسیر auth/profile             | برچسب وضعیت مورد انتظار        |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ------------------------------ | ---------------------------- |
| اشتراک ChatGPT/Codex با runtime بومی Codex | `openai/gpt-*`             | حذف‌شده یا `agentRuntime.id: "codex"`  | Codex OAuth یا حساب Codex   | `Runtime: OpenAI Codex`      |
| احراز هویت کلید API OpenAI برای مدل‌های عامل                 | `openai/gpt-*`             | حذف‌شده یا `agentRuntime.id: "codex"`  | نمایه کلید API `openai-codex` | `Runtime: OpenAI Codex`      |
| پیکربندی قدیمی که نیاز به تعمیر doctor دارد               | `openai-codex/gpt-*`       | تعمیرشده به `codex`                    | احراز هویت پیکربندی‌شده موجود       | پس از `doctor --fix` دوباره بررسی کنید |
| providerهای ترکیبی با حالت خودکار محافظه‌کارانه          | مراجع مخصوص provider     | `agentRuntime.id: "auto"`              | به‌ازای provider انتخاب‌شده          | به runtime انتخاب‌شده بستگی دارد  |
| نشست صریح adapter Codex ACP                   | وابسته به prompt/model در ACP | `sessions_spawn` با `runtime: "acp"` | احراز هویت backend در ACP               | وضعیت task/session در ACP      |

تفکیک مهم، provider در برابر runtime است:

- `openai-codex/*` یک مسیر قدیمی است که doctor بازنویسی می‌کند.
- `agentRuntime.id: "codex"` به harness Codex نیاز دارد و اگر در دسترس نباشد fail closed می‌شود.
- `agentRuntime.id: "auto"` اجازه می‌دهد harnessهای ثبت‌شده مسیرهای provider منطبق را claim کنند؛ مراجع عامل OpenAI به‌جای PI به Codex resolve می‌شوند.
- `/codex ...` پاسخ می‌دهد «این چت باید به کدام گفت‌وگوی بومی Codex bind شود یا آن را کنترل کند؟»
- ACP پاسخ می‌دهد «acpx باید کدام فرایند harness بیرونی را launch کند؟»

## پیشوند مدل درست را انتخاب کنید

مسیرهای خانواده OpenAI به پیشوند حساس هستند. برای تنظیم رایج اشتراک به‌همراه
runtime بومی Codex، از `openai/*` استفاده کنید.
`openai-codex/*` را به‌عنوان پیکربندی قدیمی در نظر بگیرید که doctor باید بازنویسی کند:

| مرجع مدل                                         | مسیر runtime                             | زمان استفاده                                                          |
| ------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `openai/gpt-5.4`                                  | harness app-server Codex برای چرخش‌های عامل | وقتی مدل‌های عامل OpenAI را از طریق Codex می‌خواهید.                       |
| `openai-codex/gpt-5.5`                            | مسیر قدیمی که توسط doctor تعمیر می‌شود          | وقتی روی پیکربندی قدیمی هستید؛ برای بازنویسی آن `openclaw doctor --fix` را اجرا کنید. |
| `openai/gpt-5.5` + نمایه کلید API `openai-codex` | harness app-server Codex                 | وقتی احراز هویت کلید API برای یک مدل عامل OpenAI می‌خواهید.                  |

وقتی حساب شما آن‌ها را ارائه کند، GPT-5.5 می‌تواند هم در مسیرهای مستقیم کلید API OpenAI و هم مسیرهای اشتراک Codex ظاهر شود.
برای runtime بومی Codex از `openai/gpt-5.5` به‌همراه harness app-server Codex استفاده کنید،
یا برای ترافیک مستقیم کلید API از `openai/gpt-5.5` بدون override runtime Codex استفاده کنید.

مراجع قدیمی `codex/gpt-*` همچنان به‌عنوان aliasهای سازگاری پذیرفته می‌شوند. مهاجرت سازگاری doctor
مراجع runtime قدیمی را به مراجع مدل canonical بازنویسی می‌کند
و سیاست runtime را جداگانه ثبت می‌کند. پیکربندی‌های جدید harness بومی app-server
باید از `openai/gpt-*` به‌همراه `agentRuntime.id: "codex"` استفاده کنند.

`agents.defaults.imageModel` از همان تفکیک پیشوند پیروی می‌کند. از
`openai/gpt-*` برای مسیر عادی OpenAI و از `codex/gpt-*` زمانی استفاده کنید که درک تصویر
باید از طریق یک چرخش محدود app-server Codex اجرا شود. از
`openai-codex/gpt-*` استفاده نکنید؛ doctor آن پیشوند قدیمی را به `openai/gpt-*` بازنویسی می‌کند. مدل
app-server Codex باید پشتیبانی ورودی تصویر را advertise کند؛ مدل‌های Codex فقط متنی
پیش از شروع چرخش رسانه fail می‌شوند.

برای تأیید harness مؤثر نشست فعلی، از `/status` استفاده کنید. اگر
انتخاب غیرمنتظره است، debug logging را برای زیرسیستم `agents/harness` فعال کنید
و رکورد ساختاریافته `agent harness selected` در Gateway را بررسی کنید. این رکورد
شناسه harness انتخاب‌شده، دلیل انتخاب، سیاست runtime/fallback، و
در حالت `auto` نتیجه پشتیبانی هر candidate Plugin را شامل می‌شود.

### هشدارهای doctor چه معنایی دارند

`openclaw doctor` زمانی هشدار می‌دهد که مراجع مدل پیکربندی‌شده یا وضعیت مسیر نشست پایدارشده
هنوز از `openai-codex/*` استفاده کنند. `openclaw doctor --fix` این مسیرها را به موارد زیر بازنویسی می‌کند:

- `openai/<model>`
- `agentRuntime.id: "codex"`

مسیر `codex`، harness بومی Codex را اجباری می‌کند. پیکربندی runtime PI برای
چرخش‌های مدل عامل OpenAI مجاز نیست.
Doctor همچنین پین‌های نشست پایدارشده قدیمی را در storeهای نشست عامل کشف‌شده تعمیر می‌کند
تا گفت‌وگوهای قدیمی روی مسیر حذف‌شده گیر نمانند.

انتخاب harness کنترل زنده نشست نیست. وقتی یک چرخش تعبیه‌شده اجرا می‌شود،
OpenClaw شناسه harness انتخاب‌شده را روی آن نشست ثبت می‌کند و برای
چرخش‌های بعدی در همان شناسه نشست از آن استفاده می‌کند. وقتی می‌خواهید نشست‌های آینده از harness دیگری استفاده کنند،
پیکربندی `agentRuntime` یا `OPENCLAW_AGENT_RUNTIME` را تغییر دهید؛
برای شروع یک نشست تازه پیش از جابه‌جایی یک گفت‌وگوی موجود بین PI و Codex، از `/new` یا `/reset` استفاده کنید.
این کار از بازپخش یک transcript از طریق دو سیستم نشست بومی ناسازگار جلوگیری می‌کند.

نشست‌های قدیمی ایجادشده پیش از پین‌های harness، پس از داشتن تاریخچه transcript
به‌عنوان PI-pinned در نظر گرفته می‌شوند. پس از تغییر پیکربندی، برای opt آن گفت‌وگو به Codex
از `/new` یا `/reset` استفاده کنید.

`/status` runtime مؤثر مدل را نشان می‌دهد. harness پیش‌فرض PI به‌صورت
`Runtime: OpenClaw Pi Default` نمایش داده می‌شود، و harness app-server Codex به‌صورت
`Runtime: OpenAI Codex`.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس باشد.
- app-server نسخهٔ `0.125.0` یا جدیدتر برای Codex. Plugin همراه به‌صورت پیش‌فرض یک باینری app-server سازگار برای Codex را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex` در `PATH` روی راه‌اندازی عادی چارچوب آزمایش اثری ندارند.
- احراز هویت Codex برای فرایند app-server یا برای پل احراز هویت Codex در OpenClaw در دسترس باشد. راه‌اندازی‌های محلی app-server برای هر عامل از خانهٔ Codex مدیریت‌شده توسط OpenClaw و یک `HOME` فرزند ایزوله استفاده می‌کنند، بنابراین به‌صورت پیش‌فرض حساب شخصی `~/.codex`، مهارت‌ها، Pluginها، پیکربندی، وضعیت رشته، یا `$HOME/.agents/skills` بومی شما را نمی‌خوانند.

Plugin دست‌دهی‌های app-server قدیمی‌تر یا بدون نسخه را مسدود می‌کند. این کار OpenClaw را روی سطح پروتکلی نگه می‌دارد که در برابر آن آزمایش شده است.

برای آزمون‌های دود زنده و Docker، احراز هویت معمولاً از حساب Codex CLI یا یک پروفایل احراز هویت `openai-codex` در OpenClaw می‌آید. راه‌اندازی‌های محلی app-server از نوع stdio نیز وقتی حسابی وجود نداشته باشد می‌توانند به `CODEX_API_KEY` / `OPENAI_API_KEY` بازگردند.

## فایل‌های راه‌اندازی فضای کاری

Codex خودش `AGENTS.md` را از طریق کشف بومی مستندات پروژه مدیریت می‌کند. OpenClaw فایل‌های مستندات پروژهٔ مصنوعی برای Codex نمی‌نویسد و برای فایل‌های persona به نام‌های جایگزین Codex وابسته نیست، چون fallbackهای Codex فقط وقتی اعمال می‌شوند که `AGENTS.md` وجود نداشته باشد.

برای همسانی فضای کاری OpenClaw، چارچوب Codex فایل‌های راه‌اندازی دیگر (`SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، `BOOTSTRAP.md`، و در صورت وجود `MEMORY.md`) را resolve می‌کند و آن‌ها را در `thread/start` و `thread/resume` از طریق دستورالعمل‌های توسعه‌دهندهٔ Codex ارسال می‌کند. این کار `SOUL.md` و زمینهٔ مرتبط persona/پروفایل فضای کاری را در مسیر بومی شکل‌دهی رفتار Codex قابل مشاهده نگه می‌دارد، بدون اینکه `AGENTS.md` تکرار شود.

## افزودن Codex در کنار مدل‌های دیگر

اگر همان عامل باید آزادانه بین Codex و مدل‌های ارائه‌دهندهٔ غیر Codex جابه‌جا شود، `agentRuntime.id: "codex"` را به‌صورت سراسری تنظیم نکنید. runtime اجباری برای هر نوبت embedded آن عامل یا نشست اعمال می‌شود. اگر در حالی که آن runtime اجباری است یک مدل Anthropic انتخاب کنید، OpenClaw همچنان چارچوب Codex را امتحان می‌کند و به‌جای اینکه بی‌صدا آن نوبت را از طریق PI مسیریابی کند، بسته شکست می‌خورد.

به‌جای آن از یکی از این شکل‌ها استفاده کنید:

- Codex را روی یک عامل اختصاصی با `agentRuntime.id: "codex"` قرار دهید.
- عامل پیش‌فرض را روی `agentRuntime.id: "auto"` و fallback به PI برای استفادهٔ عادی از ارائه‌دهنده‌های ترکیبی نگه دارید.
- از ارجاع‌های قدیمی `codex/*` فقط برای سازگاری استفاده کنید. پیکربندی‌های جدید باید `openai/*` همراه با یک سیاست runtime صریح Codex را ترجیح دهند.

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

- عامل پیش‌فرض `main` از مسیر عادی ارائه‌دهنده و fallback سازگاری PI استفاده می‌کند.
- عامل `codex` از چارچوب app-server برای Codex استفاده می‌کند.
- اگر Codex برای عامل `codex` موجود نباشد یا پشتیبانی نشود، نوبت شکست می‌خورد، نه اینکه بی‌صدا از PI استفاده کند.

## مسیریابی فرمان عامل

عامل‌ها باید درخواست‌های کاربر را بر اساس نیت مسیریابی کنند، نه فقط بر اساس واژهٔ «Codex»:

| کاربر درخواست می‌کند...                                  | عامل باید استفاده کند...                          |
| -------------------------------------------------------- | ------------------------------------------------ |
| «این گفتگو را به Codex bind کن»                          | `/codex bind`                                    |
| «رشتهٔ Codex با شناسهٔ `<id>` را اینجا ادامه بده»        | `/codex resume <id>`                             |
| «رشته‌های Codex را نشان بده»                             | `/codex threads`                                 |
| «برای یک اجرای بد Codex گزارش پشتیبانی ثبت کن»           | `/diagnostics [note]`                            |
| «فقط برای این رشتهٔ پیوست‌شده بازخورد Codex بفرست»       | `/codex diagnostics [note]`                      |
| «اشتراک ChatGPT/Codex من را با runtime Codex استفاده کن» | `openai/*`                                       |
| «پین‌های پیکربندی/نشست قدیمی `openai-codex/*` را تعمیر کن» | `openclaw doctor --fix`                          |
| «Codex را از طریق ACP/acpx اجرا کن»                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| «Claude Code/Gemini/OpenCode/Cursor را در یک رشته شروع کن» | ACP/acpx، نه `/codex` و نه زیرعامل‌های بومی       |

OpenClaw فقط وقتی راهنمای spawn مربوط به ACP را به عامل‌ها تبلیغ می‌کند که ACP فعال، قابل dispatch، و متکی به یک backend runtime بارگذاری‌شده باشد. اگر ACP در دسترس نباشد، prompt سیستم و مهارت‌های Plugin نباید دربارهٔ مسیریابی ACP به عامل آموزش دهند.

## استقرارهای فقط Codex

وقتی باید ثابت کنید که هر نوبت عامل embedded از Codex استفاده می‌کند، چارچوب Codex را اجباری کنید. runtimeهای صریح Plugin بسته شکست می‌خورند و هرگز بی‌صدا از طریق PI دوباره امتحان نمی‌شوند:

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

override محیطی:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

وقتی Codex اجباری باشد، اگر Plugin مربوط به Codex غیرفعال باشد، app-server بیش از حد قدیمی باشد، یا app-server نتواند شروع شود، OpenClaw زود شکست می‌خورد.

## Codex برای هر عامل

می‌توانید یک عامل را فقط Codex کنید، در حالی که عامل پیش‌فرض انتخاب خودکار عادی را حفظ کند:

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

برای جابه‌جایی بین عامل‌ها و مدل‌ها از فرمان‌های عادی نشست استفاده کنید. `/new` یک نشست تازهٔ OpenClaw ایجاد می‌کند و چارچوب Codex در صورت نیاز رشتهٔ app-server جانبی خودش را ایجاد یا ادامه می‌دهد. `/reset` اتصال نشست OpenClaw را برای آن رشته پاک می‌کند و اجازه می‌دهد نوبت بعدی دوباره چارچوب را از پیکربندی فعلی resolve کند.

## کشف مدل

به‌صورت پیش‌فرض، Plugin مربوط به Codex از app-server مدل‌های موجود را می‌پرسد. اگر کشف شکست بخورد یا timeout شود، از کاتالوگ fallback همراه برای این موارد استفاده می‌کند:

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

وقتی می‌خواهید راه‌اندازی از probe کردن Codex پرهیز کند و به کاتالوگ fallback بچسبد، کشف را غیرفعال کنید:

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

به‌صورت پیش‌فرض، Plugin باینری مدیریت‌شدهٔ Codex متعلق به OpenClaw را به‌صورت محلی با این فرمان شروع می‌کند:

```bash
codex app-server --listen stdio://
```

باینری مدیریت‌شده همراه با بستهٔ Plugin مربوط به `codex` ارسال می‌شود. این کار نسخهٔ app-server را به Plugin همراه گره می‌زند، نه به هر Codex CLI جداگانه‌ای که اتفاقاً به‌صورت محلی نصب شده باشد. فقط وقتی `appServer.command` را تنظیم کنید که عمداً می‌خواهید یک executable متفاوت اجرا کنید.

به‌صورت پیش‌فرض، OpenClaw نشست‌های محلی چارچوب Codex را در حالت YOLO شروع می‌کند: `approvalPolicy: "never"`، `approvalsReviewer: "user"`، و `sandbox: "danger-full-access"`. این وضعیت اپراتور محلی مورد اعتماد است که برای Heartbeatهای خودکار استفاده می‌شود: Codex می‌تواند از ابزارهای shell و شبکه استفاده کند، بدون اینکه روی promptهای تأیید بومی که کسی برای پاسخ دادن به آن‌ها حاضر نیست متوقف شود.

برای opt in به تأییدهای بازبینی‌شده توسط نگهبان Codex، `appServer.mode:
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

حالت Guardian از مسیر تأیید auto-review بومی Codex استفاده می‌کند. وقتی Codex درخواست خروج از sandbox، نوشتن بیرون از فضای کاری، یا افزودن مجوزهایی مثل دسترسی شبکه را بدهد، Codex آن درخواست تأیید را به‌جای prompt انسانی به بازبین بومی مسیریابی می‌کند. بازبین چارچوب ریسک Codex را اعمال می‌کند و درخواست مشخص را تأیید یا رد می‌کند. وقتی guardrailهای بیشتری نسبت به حالت YOLO می‌خواهید اما همچنان لازم است عامل‌های unattended پیشرفت کنند، از Guardian استفاده کنید.

preset مربوط به `guardian` به `approvalPolicy: "on-request"`، `approvalsReviewer: "auto_review"`، و `sandbox: "workspace-write"` گسترش می‌یابد. فیلدهای سیاست جداگانه همچنان `mode` را override می‌کنند، بنابراین استقرارهای پیشرفته می‌توانند preset را با انتخاب‌های صریح ترکیب کنند. مقدار بازبین قدیمی‌تر `guardian_subagent` هنوز به‌عنوان alias سازگاری پذیرفته می‌شود، اما پیکربندی‌های جدید باید از `auto_review` استفاده کنند.

برای app-serverی که از قبل در حال اجراست، از انتقال WebSocket استفاده کنید:

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

راه‌اندازی‌های stdio app-server به‌صورت پیش‌فرض محیط فرایند OpenClaw را به ارث می‌برند، اما OpenClaw مالک پل حساب app-server برای Codex است و هر دو مقدار `CODEX_HOME` و `HOME` را روی پوشه‌های مخصوص هر عامل زیر state همان عامل در OpenClaw تنظیم می‌کند. loader مهارت بومی خود Codex از `$CODEX_HOME/skills` و `$HOME/.agents/skills` می‌خواند، بنابراین هر دو مقدار برای راه‌اندازی‌های محلی app-server ایزوله هستند. این کار مهارت‌های بومی Codex، Pluginها، پیکربندی، حساب‌ها، و وضعیت رشته را به‌جای نشت از خانهٔ شخصی Codex CLI اپراتور، در محدودهٔ عامل OpenClaw نگه می‌دارد.

Pluginهای OpenClaw و snapshotهای مهارت OpenClaw همچنان از طریق registry اختصاصی Plugin و loader مهارت OpenClaw جریان پیدا می‌کنند. دارایی‌های شخصی Codex CLI چنین نمی‌کنند. اگر مهارت‌ها یا Pluginهای مفید Codex CLI دارید که باید بخشی از یک عامل OpenClaw شوند، آن‌ها را صریحاً inventory کنید:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

ارائه‌دهندهٔ migration مربوط به Codex مهارت‌ها را در فضای کاری عامل OpenClaw فعلی کپی می‌کند. Pluginهای بومی Codex، hookها، و فایل‌های پیکربندی برای بازبینی دستی گزارش یا archive می‌شوند، نه اینکه به‌صورت خودکار فعال شوند، چون می‌توانند فرمان اجرا کنند، سرورهای MCP را در معرض قرار دهند، یا credential حمل کنند.

احراز هویت به این ترتیب انتخاب می‌شود:

1. یک پروفایل احراز هویت صریح OpenClaw Codex برای عامل.
2. حساب موجود app-server در خانهٔ Codex همان عامل.
3. فقط برای راه‌اندازی‌های محلی stdio app-server، وقتی هیچ حساب app-serverی وجود ندارد و احراز هویت OpenAI همچنان لازم است، ابتدا `CODEX_API_KEY` و سپس `OPENAI_API_KEY`.

وقتی OpenClaw یک پروفایل احراز هویت Codex از نوع اشتراک ChatGPT ببیند، `CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex ایجادشده حذف می‌کند. این کار کلیدهای API در سطح Gateway را برای embeddings یا مدل‌های مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه نوبت‌های بومی app-server برای Codex تصادفاً از طریق API صورتحساب شوند. پروفایل‌های صریح کلید API برای Codex و fallback کلید محیطی stdio محلی از login app-server استفاده می‌کنند، نه از env به‌ارث‌رسیدهٔ فرایند فرزند. اتصال‌های WebSocket app-server fallback کلید API محیط Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب خود app-server راه دور استفاده کنید.

اگر یک استقرار به ایزوله‌سازی محیطی بیشتری نیاز داشته باشد، آن متغیرها را به `appServer.clearEnv` اضافه کنید:

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

`appServer.clearEnv` فقط روی فرایند فرزند app-server مربوط به Codex که spawn شده است اثر می‌گذارد.

ابزارهای پویای Codex به‌طور پیش‌فرض از پروفایل `native-first` استفاده می‌کنند. در آن حالت،
OpenClaw ابزارهای پویایی را که عملیات workspace بومی Codex را تکرار می‌کنند
در دسترس قرار نمی‌دهد: `read`، `write`، `edit`، `apply_patch`، `exec`، `process` و
`update_plan`. ابزارهای یکپارچه‌سازی OpenClaw مانند پیام‌رسانی، نشست‌ها، رسانه،
cron، مرورگر، گره‌ها، gateway، `heartbeat_respond` و `web_search` همچنان
در دسترس می‌مانند.

فیلدهای سطح بالای Plugin Codex که پشتیبانی می‌شوند:

| فیلد                      | پیش‌فرض          | معنا                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | برای در دسترس قرار دادن مجموعه کامل ابزارهای پویای OpenClaw برای app-server مربوط به Codex از `"openclaw-compat"` استفاده کنید. |
| `codexDynamicToolsExclude` | `[]`             | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های app-server مربوط به Codex حذف شوند.               |

فیلدهای `appServer` که پشتیبانی می‌شوند:

| فیلد                         | پیش‌فرض                                  | معنا                                                                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                | `"stdio"` باعث اجرای Codex می‌شود؛ `"websocket"` به `url` متصل می‌شود.                                                                                                                                                                             |
| `command`                     | باینری مدیریت‌شده Codex                     | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده آن را تنظیم‌نشده بگذارید؛ فقط برای بازنویسی صریح آن را تنظیم کنید.                                                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]` | آرگومان‌ها برای انتقال stdio.                                                                                                                                                                                                       |
| `url`                         | تنظیم‌نشده                                    | نشانی app-server مربوط به WebSocket.                                                                                                                                                                                                            |
| `authToken`                   | تنظیم‌نشده                                    | توکن Bearer برای انتقال WebSocket.                                                                                                                                                                                                |
| `headers`                     | `{}`                                     | هدرهای اضافی WebSocket.                                                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                     | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw، از فرایند app-server مربوط به stdio اجراشده حذف می‌شوند. `CODEX_HOME` و `HOME` برای جداسازی Codex به‌ازای هر agent در OpenClaw هنگام اجراهای محلی رزرو شده‌اند. |
| `requestTimeoutMs`            | `60000`                                  | مهلت زمانی برای فراخوانی‌های control-plane مربوط به app-server.                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | پنجره سکوت پس از یک درخواست app-server مربوط به Codex در محدوده نوبت، در حالی که OpenClaw منتظر `turn/completed` می‌ماند. این مقدار را برای مراحل کند پس از ابزار یا مراحل ترکیب فقط-وضعیت افزایش دهید.                                                                  |
| `mode`                        | `"yolo"`                                 | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط guardian.                                                                                                                                                                                      |
| `approvalPolicy`              | `"never"`                                | سیاست تأیید بومی Codex که به شروع/ازسرگیری/نوبت thread ارسال می‌شود.                                                                                                                                                                       |
| `sandbox`                     | `"danger-full-access"`                   | حالت sandbox بومی Codex که به شروع/ازسرگیری thread ارسال می‌شود.                                                                                                                                                                               |
| `approvalsReviewer`           | `"user"`                                 | برای اینکه Codex اعلان‌های تأیید بومی را بازبینی کند از `"auto_review"` استفاده کنید. `guardian_subagent` همچنان یک نام مستعار قدیمی است.                                                                                                                         |
| `serviceTier`                 | تنظیم‌نشده                                    | سطح سرویس اختیاری app-server مربوط به Codex: `"fast"`، `"flex"` یا `null`. مقادیر قدیمی نامعتبر نادیده گرفته می‌شوند.                                                                                                                            |

فراخوانی‌های ابزار پویای متعلق به OpenClaw به‌طور مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: هر درخواست `item/tool/call` در Codex باید
ظرف ۳۰ ثانیه یک پاسخ OpenClaw دریافت کند. هنگام اتمام مهلت زمانی، OpenClaw در موارد پشتیبانی‌شده سیگنال ابزار را لغو می‌کند و یک پاسخ ابزار پویا با وضعیت شکست‌خورده به Codex برمی‌گرداند تا
نوبت بتواند به‌جای باقی گذاشتن نشست در وضعیت `processing` ادامه پیدا کند.

پس از اینکه OpenClaw به یک درخواست app-server مربوط به Codex در محدوده نوبت پاسخ می‌دهد، harness
همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` تمام کند. اگر
app-server پس از آن پاسخ به‌مدت `appServer.turnCompletionIdleTimeoutMs` ساکت بماند،
OpenClaw تا حد امکان نوبت Codex را قطع می‌کند، یک مهلت زمانی تشخیصی
ثبت می‌کند، و lane نشست OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی
پشت یک نوبت بومی مانده در صف نمانند. هر اعلان غیرنهایی برای همان
نوبت، از جمله `rawResponseItem/completed`، آن watchdog کوتاه را غیرفعال می‌کند
زیرا Codex ثابت کرده است که نوبت هنوز زنده است؛ watchdog نهایی طولانی‌تر
همچنان از نوبت‌هایی که واقعا گیر کرده‌اند محافظت می‌کند. تشخیص‌های مهلت زمانی شامل
آخرین متد اعلان app-server و، برای آیتم‌های خام پاسخ assistant، نوع
آیتم، نقش، شناسه، و یک پیش‌نمایش محدود از متن assistant هستند.

بازنویسی‌های محیطی برای آزمون محلی همچنان در دسترس‌اند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم نشده باشد، `OPENCLAW_CODEX_APP_SERVER_BIN`
باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شد. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای
آزمون محلی موردی از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. Config برای
استقرارهای تکرارپذیر ترجیح داده می‌شود، زیرا رفتار Plugin را در همان
فایل بازبینی‌شده‌ای نگه می‌دارد که بقیه راه‌اندازی harness مربوط به Codex در آن قرار دارد.

## استفاده از رایانه

Computer Use در راهنمای راه‌اندازی جداگانه خودش پوشش داده شده است:
[استفاده رایانه‌ای Codex](/fa/plugins/codex-computer-use).

نسخه کوتاه: OpenClaw برنامه کنترل دسکتاپ را vendoring نمی‌کند یا خودش
اقدامات دسکتاپ را اجرا نمی‌کند. این ابزار app-server مربوط به Codex را آماده می‌کند، بررسی می‌کند که
سرور MCP مربوط به `computer-use` در دسترس است، و سپس اجازه می‌دهد Codex در طول
نوبت‌های حالت Codex، فراخوانی‌های ابزار MCP بومی را مدیریت کند.

برای دسترسی مستقیم به درایور TryCua خارج از جریان marketplace مربوط به Codex،
`cua-driver mcp` را با `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ثبت کنید.
برای تمایز بین Computer Use متعلق به Codex و ثبت مستقیم MCP، به [استفاده رایانه‌ای Codex](/fa/plugins/codex-computer-use) مراجعه کنید.

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

Computer Use مخصوص macOS است و ممکن است پیش از آنکه
سرور MCP مربوط به Codex بتواند برنامه‌ها را کنترل کند، به مجوزهای محلی سیستم‌عامل نیاز داشته باشد. اگر `computerUse.enabled` درست باشد و سرور MCP
در دسترس نباشد، نوبت‌های حالت Codex پیش از شروع thread شکست می‌خورند، به‌جای اینکه
بی‌سروصدا بدون ابزارهای Computer Use بومی اجرا شوند. برای گزینه‌های marketplace،
محدودیت‌های کاتالوگ راه‌دور، دلایل وضعیت، و عیب‌یابی به
[استفاده رایانه‌ای Codex](/fa/plugins/codex-computer-use) مراجعه کنید.

وقتی `computerUse.autoInstall` درست باشد، OpenClaw می‌تواند marketplace استاندارد
بسته‌بندی‌شده Codex Desktop را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند، اگر Codex
هنوز marketplace محلی را کشف نکرده باشد. پس از
تغییر config مربوط به runtime یا Computer Use از `/new` یا `/reset` استفاده کنید تا نشست‌های موجود یک
اتصال قدیمی PI یا thread مربوط به Codex را نگه ندارند.

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

اعتبارسنجی harness فقط-Codex:

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

تعویض مدل تحت کنترل OpenClaw باقی می‌ماند. وقتی یک نشست OpenClaw به
یک thread موجود Codex متصل باشد، نوبت بعدی مدل OpenAI، provider،
سیاست تأیید، sandbox و سطح سرویس فعلی انتخاب‌شده را دوباره به
app-server ارسال می‌کند. تغییر از `openai/gpt-5.5` به `openai/gpt-5.2` اتصال
thread را نگه می‌دارد، اما از Codex می‌خواهد با مدل تازه انتخاب‌شده ادامه دهد.

## فرمان Codex

Plugin بسته‌بندی‌شده `/codex` را به‌عنوان یک فرمان slash مجاز ثبت می‌کند. این فرمان
عمومی است و روی هر channel که از فرمان‌های متنی OpenClaw پشتیبانی کند کار می‌کند.

شکل‌های رایج:

- `/codex status` اتصال زنده به app-server، مدل‌ها، حساب، محدودیت‌های نرخ، سرورهای MCP، و Skills را نشان می‌دهد.
- `/codex models` مدل‌های زنده app-server مربوط به Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر Codex را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک رشته موجود Codex متصل می‌کند.
- `/codex compact` از app-server مربوط به Codex می‌خواهد رشته متصل‌شده را Compaction کند.
- `/codex review` بازبینی بومی Codex را برای رشته متصل‌شده شروع می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد عیب‌یابی Codex برای رشته متصل‌شده پرسش تأیید می‌پرسد.
- `/codex computer-use status` Plugin پیکربندی‌شده Computer Use و سرور MCP را بررسی می‌کند.
- `/codex computer-use install` Plugin پیکربندی‌شده Computer Use را نصب می‌کند و سرورهای MCP را دوباره بارگذاری می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP مربوط به app-server مربوط به Codex را فهرست می‌کند.
- `/codex skills` Skills مربوط به app-server مربوط به Codex را فهرست می‌کند.

وقتی Codex یک خطای محدودیت استفاده گزارش می‌کند، اگر Codex زمان بازنشانی بعدی
app-server را ارائه کرده باشد، OpenClaw آن را درج می‌کند. برای بررسی پنجره‌های
فعلی حساب و محدودیت نرخ، از `/codex account` در همان گفت‌وگو استفاده کنید.

### گردش کار رایج برای اشکال‌زدایی

وقتی یک عامل مبتنی بر Codex در Telegram، Discord، Slack،
یا کانالی دیگر کاری غیرمنتظره انجام می‌دهد، از گفت‌وگویی شروع کنید که مشکل در آن رخ داده است:

1. دستور `/diagnostics bad tool choice after image upload` یا یادداشت کوتاه دیگری را اجرا کنید
   که آنچه دیده‌اید را توصیف می‌کند.
2. درخواست عیب‌یابی را یک بار تأیید کنید. این تأیید، فایل zip عیب‌یابی Gateway محلی
   را ایجاد می‌کند و، چون نشست از harness مربوط به Codex استفاده می‌کند، همچنین
   بسته بازخورد مرتبط Codex را به سرورهای OpenAI ارسال می‌کند.
3. پاسخ تکمیل‌شده عیب‌یابی را در گزارش خطا یا رشته پشتیبانی کپی کنید.
   این پاسخ شامل مسیر بسته محلی، خلاصه حریم خصوصی، شناسه‌های نشست OpenClaw،
   شناسه‌های رشته Codex، و یک خط `Inspect locally` برای هر رشته Codex است.
4. اگر می‌خواهید خودتان اجرا را اشکال‌زدایی کنید، دستور چاپ‌شده `Inspect locally`
   را در ترمینال اجرا کنید. این دستور شبیه `codex resume <thread-id>` است و
   رشته بومی Codex را باز می‌کند تا بتوانید گفت‌وگو را بررسی کنید، آن را به‌صورت محلی ادامه دهید،
   یا از Codex بپرسید چرا یک ابزار یا طرح خاص را انتخاب کرده است.

فقط زمانی از `/codex diagnostics [note]` استفاده کنید که مشخصاً آپلود بازخورد Codex
را برای رشته‌ای که در حال حاضر متصل است می‌خواهید، بدون بسته کامل عیب‌یابی
Gateway مربوط به OpenClaw. برای بیشتر گزارش‌های پشتیبانی، `/diagnostics [note]`
نقطه شروع بهتری است، چون وضعیت Gateway محلی و شناسه‌های رشته Codex را در یک پاسخ
به هم پیوند می‌دهد. برای مدل کامل حریم خصوصی و رفتار گفت‌وگوی گروهی، [خروجی عیب‌یابی](/fa/gateway/diagnostics)
را ببینید.

هسته OpenClaw همچنین `/diagnostics [note]` مخصوص مالک را به‌عنوان فرمان عمومی
عیب‌یابی Gateway ارائه می‌کند. پیام تأیید آن پیش‌درآمد داده‌های حساس را نشان می‌دهد،
به [خروجی عیب‌یابی](/fa/gateway/diagnostics) پیوند می‌دهد، و هر بار
`openclaw gateway diagnostics export --json` را از طریق تأیید صریح exec درخواست می‌کند.
عیب‌یابی را با قاعده allow-all تأیید نکنید. پس از تأیید،
OpenClaw گزارشی قابل چسباندن با مسیر بسته محلی و خلاصه manifest ارسال می‌کند.
وقتی نشست فعال OpenClaw از harness مربوط به Codex استفاده می‌کند، همان تأیید
همچنین ارسال بسته‌های بازخورد مرتبط Codex به سرورهای OpenAI را مجاز می‌کند.
پیام تأیید می‌گوید که بازخورد Codex ارسال خواهد شد، اما شناسه‌های نشست یا رشته
Codex را پیش از تأیید فهرست نمی‌کند.

اگر `/diagnostics` توسط مالک در یک گفت‌وگوی گروهی فراخوانی شود، OpenClaw کانال
مشترک را تمیز نگه می‌دارد: گروه فقط یک اعلان کوتاه دریافت می‌کند، در حالی که
پیش‌درآمد عیب‌یابی، پیام‌های تأیید، و شناسه‌های نشست/رشته Codex از مسیر تأیید
خصوصی برای مالک ارسال می‌شوند. اگر مسیر خصوصی مالک وجود نداشته باشد،
OpenClaw درخواست گروه را رد می‌کند و از مالک می‌خواهد آن را از یک DM اجرا کند.

آپلود تأییدشده Codex، `feedback/upload` مربوط به app-server مربوط به Codex را فراخوانی می‌کند و از
app-server می‌خواهد در صورت موجود بودن، logها را برای هر رشته فهرست‌شده و زیررشته‌های
Codex ایجادشده درج کند. آپلود از مسیر عادی بازخورد Codex به سرورهای OpenAI می‌رود؛
اگر بازخورد Codex در آن app-server غیرفعال باشد، فرمان خطای app-server را برمی‌گرداند.
پاسخ تکمیل‌شده عیب‌یابی، کانال‌ها، شناسه‌های نشست OpenClaw، شناسه‌های رشته Codex،
و فرمان‌های محلی `codex resume <thread-id>` را برای رشته‌هایی که ارسال شده‌اند فهرست می‌کند.
اگر تأیید را رد کنید یا نادیده بگیرید، OpenClaw آن شناسه‌های Codex را چاپ نمی‌کند.
این آپلود جایگزین خروجی عیب‌یابی Gateway محلی نمی‌شود.

`/codex resume` همان فایل پیوند جانبی را می‌نویسد که harness برای نوبت‌های عادی استفاده می‌کند.
در پیام بعدی، OpenClaw آن رشته Codex را از سر می‌گیرد، مدل OpenClaw انتخاب‌شده فعلی را
به app-server می‌فرستد، و تاریخچه گسترده را فعال نگه می‌دارد.

### بررسی یک رشته Codex از CLI

سریع‌ترین راه برای فهمیدن یک اجرای بد Codex اغلب این است که رشته بومی Codex
را مستقیم باز کنید:

```sh
codex resume <thread-id>
```

وقتی در یک گفت‌وگوی کانالی متوجه خطایی می‌شوید و می‌خواهید نشست مشکل‌دار Codex را
بررسی کنید، آن را به‌صورت محلی ادامه دهید، یا از Codex بپرسید چرا یک ابزار یا انتخاب
استدلال خاص انجام داده است، از این استفاده کنید. ساده‌ترین مسیر معمولاً این است که ابتدا
`/diagnostics [note]` را اجرا کنید: پس از تأیید آن، گزارش تکمیل‌شده هر رشته Codex را فهرست می‌کند
و یک دستور `Inspect locally` چاپ می‌کند، برای مثال
`codex resume <thread-id>`. می‌توانید آن دستور را مستقیم در ترمینال کپی کنید.

همچنین می‌توانید شناسه رشته را از `/codex binding` برای گفت‌وگوی فعلی یا
`/codex threads [filter]` برای رشته‌های اخیر app-server مربوط به Codex بگیرید، سپس همان
دستور `codex resume` را در shell خود اجرا کنید.

سطح فرمان به app-server مربوط به Codex نسخه `0.125.0` یا جدیدتر نیاز دارد. اگر یک
app-server آینده یا سفارشی آن متد JSON-RPC را ارائه نکند، متدهای کنترلی جداگانه با
`unsupported by this Codex app-server` گزارش می‌شوند.

## مرزهای hook

harness مربوط به Codex سه لایه hook دارد:

| لایه                                  | مالک                     | هدف                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| hookهای Plugin مربوط به OpenClaw      | OpenClaw                 | سازگاری محصول/Plugin در سراسر harnessهای PI و Codex.                |
| میان‌افزار افزونه app-server مربوط به Codex | Pluginهای همراه OpenClaw | رفتار adapter در هر نوبت پیرامون ابزارهای پویای OpenClaw.          |
| hookهای بومی Codex                    | Codex                    | چرخه عمر سطح پایین Codex و سیاست ابزار بومی از پیکربندی Codex.    |

OpenClaw از فایل‌های `hooks.json` پروژه یا سراسری Codex برای مسیریابی
رفتار Plugin مربوط به OpenClaw استفاده نمی‌کند. برای ابزار بومی پشتیبانی‌شده و پل مجوز،
OpenClaw پیکربندی Codex در سطح هر رشته را برای `PreToolUse`، `PostToolUse`،
`PermissionRequest`، و `Stop` تزریق می‌کند. وقتی تأییدهای app-server مربوط به Codex فعال باشند
(`approvalPolicy` برابر `"never"` نباشد)، پیکربندی پیش‌فرض hook بومی تزریق‌شده
`PermissionRequest` را حذف می‌کند تا بازبین app-server مربوط به Codex و پل تأیید OpenClaw
پس از بازبینی، escalationهای واقعی را مدیریت کنند. اپراتورها همچنان می‌توانند وقتی به relay سازگاری
نیاز دارند، `permission_request` را به‌صراحت به `nativeHookRelay.events` اضافه کنند.
hookهای دیگر Codex مانند `SessionStart` و `UserPromptSubmit` کنترل‌های سطح Codex باقی می‌مانند؛
آن‌ها در قرارداد v1 به‌عنوان hookهای Plugin مربوط به OpenClaw ارائه نمی‌شوند.

برای ابزارهای پویای OpenClaw، OpenClaw ابزار را پس از آن اجرا می‌کند که Codex درخواست
فراخوانی می‌دهد، بنابراین OpenClaw رفتار Plugin و میان‌افزاری را که مالک آن است در
adapter harness اجرا می‌کند. برای ابزارهای بومی Codex، Codex مالک رکورد متعارف ابزار است.
OpenClaw می‌تواند رویدادهای منتخب را بازتاب دهد، اما نمی‌تواند رشته بومی Codex
را بازنویسی کند مگر اینکه Codex آن عملیات را از طریق app-server یا callbackهای hook بومی
ارائه کند.

پروژکشن‌های Compaction و چرخه عمر LLM از اعلان‌های app-server مربوط به Codex
و وضعیت adapter مربوط به OpenClaw می‌آیند، نه از فرمان‌های hook بومی Codex.
رویدادهای `before_compaction`، `after_compaction`، `llm_input`، و
`llm_output` مربوط به OpenClaw مشاهده‌های سطح adapter هستند، نه ثبت‌های بایت‌به‌بایت
از درخواست داخلی یا payloadهای Compaction مربوط به Codex.

اعلان‌های app-server بومی Codex با نام‌های `hook/started` و `hook/completed`
به‌عنوان رویدادهای عامل `codex_app_server.hook` برای مسیر اجرا و اشکال‌زدایی
پروژکت می‌شوند. آن‌ها hookهای Plugin مربوط به OpenClaw را فراخوانی نمی‌کنند.

## قرارداد پشتیبانی V1

حالت Codex همان PI با یک فراخوانی مدل متفاوت در زیر آن نیست. Codex بخش بیشتری از
حلقه مدل بومی را مالک است، و OpenClaw سطح‌های Plugin و نشست خود را پیرامون آن مرز
تطبیق می‌دهد.

پشتیبانی‌شده در runtime نسخه v1 مربوط به Codex:

| سطح | پشتیبانی | چرا |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حلقهٔ مدل OpenAI از طریق Codex | پشتیبانی می‌شود | سرور برنامهٔ Codex مالک نوبت OpenAI، ازسرگیری بومی رشته، و ادامهٔ ابزار بومی است. |
| مسیریابی و تحویل کانال OpenClaw | پشتیبانی می‌شود | Telegram، Discord، Slack، WhatsApp، iMessage، و کانال‌های دیگر بیرون از زمان اجرای مدل می‌مانند. |
| ابزارهای پویا در OpenClaw | پشتیبانی می‌شود | Codex از OpenClaw می‌خواهد این ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند. |
| Pluginهای پرامپت و زمینه | پشتیبانی می‌شود | OpenClaw هم‌پوشانی‌های پرامپت را می‌سازد و زمینه را پیش از شروع یا ازسرگیری رشته، به نوبت Codex نگاشت می‌کند. |
| چرخهٔ عمر موتور زمینه | پشتیبانی می‌شود | گردآوری، دریافت یا نگهداشت پس از نوبت، و هماهنگی Compaction موتور زمینه برای نوبت‌های Codex اجرا می‌شود. |
| هوک‌های ابزار پویا | پشتیبانی می‌شود | `before_tool_call`، `after_tool_call`، و میان‌افزار نتیجهٔ ابزار پیرامون ابزارهای پویای تحت مالکیت OpenClaw اجرا می‌شوند. |
| هوک‌های چرخهٔ عمر | به‌صورت مشاهده‌های آداپتر پشتیبانی می‌شود | `llm_input`، `llm_output`، `agent_end`، `before_compaction`، و `after_compaction` با بارهای واقعی حالت Codex اجرا می‌شوند. |
| دروازهٔ بازبینی پاسخ نهایی | از طریق رلهٔ هوک بومی پشتیبانی می‌شود | `Stop` در Codex به `before_agent_finalize` رله می‌شود؛ `revise` از Codex یک گذر مدل دیگر پیش از نهایی‌سازی می‌خواهد. |
| پوسته، وصله، و MCP بومی برای مسدودسازی یا مشاهده | از طریق رلهٔ هوک بومی پشتیبانی می‌شود | `PreToolUse` و `PostToolUse` در Codex برای سطح‌های ابزار بومی ثبت‌شده، از جمله بارهای MCP در سرور برنامهٔ Codex نسخهٔ `0.125.0` یا جدیدتر، رله می‌شوند. مسدودسازی پشتیبانی می‌شود؛ بازنویسی آرگومان پشتیبانی نمی‌شود. |
| سیاست مجوز بومی | از طریق تأییدهای سرور برنامهٔ Codex و رلهٔ هوک بومی سازگاری پشتیبانی می‌شود | درخواست‌های تأیید سرور برنامهٔ Codex پس از بازبینی Codex از طریق OpenClaw مسیریابی می‌شوند. رلهٔ هوک بومی `PermissionRequest` برای حالت‌های تأیید بومی اختیاری است، زیرا Codex آن را پیش از بازبینی نگهبان صادر می‌کند. |
| ضبط مسیر سرور برنامه | پشتیبانی می‌شود | OpenClaw درخواستی را که به سرور برنامه فرستاده و اعلان‌های سرور برنامه را که دریافت می‌کند ثبت می‌کند. |

در زمان اجرای Codex v1 پشتیبانی نمی‌شود:

| سطح | مرز V1 | مسیر آینده |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| تغییر آرگومان ابزار بومی | هوک‌های پیشاابزار بومی Codex می‌توانند مسدود کنند، اما OpenClaw آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند. | به پشتیبانی هوک/شمای Codex برای ورودی ابزار جایگزین نیاز دارد. |
| تاریخچهٔ رونوشت بومی قابل ویرایش Codex | Codex مالک تاریخچهٔ بومی رسمی رشته است. OpenClaw مالک یک آینه است و می‌تواند زمینهٔ آینده را نگاشت کند، اما نباید داخلی‌های پشتیبانی‌نشده را تغییر دهد. | اگر جراحی رشتهٔ بومی لازم باشد، APIهای صریح سرور برنامهٔ Codex اضافه شود. |
| `tool_result_persist` برای رکوردهای ابزار بومی Codex | آن هوک نوشتن‌های رونوشت تحت مالکیت OpenClaw را تبدیل می‌کند، نه رکوردهای ابزار بومی Codex را. | می‌تواند رکوردهای تبدیل‌شده را آینه کند، اما بازنویسی رسمی به پشتیبانی Codex نیاز دارد. |
| فرادادهٔ غنی Compaction بومی | OpenClaw آغاز و تکمیل Compaction را مشاهده می‌کند، اما فهرست پایدار نگه‌داشته‌شده/حذف‌شده، دلتای توکن، یا بار خلاصه دریافت نمی‌کند. | به رویدادهای غنی‌تر Compaction در Codex نیاز دارد. |
| مداخله در Compaction | هوک‌های فعلی Compaction در OpenClaw در حالت Codex در سطح اعلان هستند. | اگر Pluginها باید Compaction بومی را وتو یا بازنویسی کنند، هوک‌های پیشا/پسا Compaction در Codex اضافه شود. |
| ضبط درخواست API مدل به‌صورت بایت‌به‌بایت | OpenClaw می‌تواند درخواست‌ها و اعلان‌های سرور برنامه را ضبط کند، اما هستهٔ Codex درخواست نهایی API OpenAI را در داخل می‌سازد. | به یک رویداد ردگیری درخواست مدل در Codex یا API اشکال‌زدایی نیاز دارد. |

## ابزارها، رسانه، و Compaction

سازوکار Codex فقط مجری سطح پایین عامل تعبیه‌شده را تغییر می‌دهد.

OpenClaw همچنان فهرست ابزارها را می‌سازد و نتیجه‌های ابزار پویا را از سازوکار دریافت می‌کند. متن، تصویر، ویدئو، موسیقی، TTS، تأییدها، و خروجی ابزار پیام‌رسانی از مسیر معمول تحویل OpenClaw ادامه پیدا می‌کنند.

رلهٔ هوک بومی عمداً عمومی است، اما قرارداد پشتیبانی v1 به مسیرهای ابزار و مجوز بومی Codex محدود است که OpenClaw آزمایش می‌کند. در زمان اجرای Codex، این شامل بارهای `PreToolUse`، `PostToolUse`، و `PermissionRequest` برای پوسته، وصله، و MCP است. تا زمانی که قرارداد زمان اجرا رویدادی را نام نبرده است، فرض نکنید هر رویداد هوک آیندهٔ Codex یک سطح Plugin در OpenClaw است.

برای `PermissionRequest`، OpenClaw فقط زمانی تصمیم‌های صریح اجازه یا رد برمی‌گرداند که سیاست تصمیم بگیرد. نتیجهٔ بدون تصمیم، اجازه نیست. Codex آن را نبود تصمیم هوک در نظر می‌گیرد و به مسیر نگهبان یا تأیید کاربر خودش ادامه می‌دهد. حالت‌های تأیید سرور برنامهٔ Codex این هوک بومی را به‌صورت پیش‌فرض حذف می‌کنند؛ این بند زمانی اعمال می‌شود که `permission_request` صریحاً در `nativeHookRelay.events` گنجانده شود یا یک زمان اجرای سازگاری آن را نصب کند. وقتی یک اپراتور برای درخواست مجوز بومی Codex گزینهٔ `allow-always` را انتخاب می‌کند، OpenClaw اثرانگشت دقیق ارائه‌دهنده/نشست/ورودی ابزار/cwd را برای یک پنجرهٔ نشست محدود به خاطر می‌سپارد. تصمیم به‌خاطر‌سپرده‌شده عمداً فقط تطابق دقیق است: فرمان، آرگومان‌ها، بار ابزار، یا cwd تغییرکرده یک تأیید تازه ایجاد می‌کند.

درخواست‌های تأیید ابزار MCP در Codex وقتی Codex مقدار `_meta.codex_approval_kind` را `"mcp_tool_call"` علامت‌گذاری کند، از طریق جریان تأیید Plugin در OpenClaw مسیریابی می‌شوند. پرامپت‌های `request_user_input` در Codex به گفت‌وگوی مبدأ بازگردانده می‌شوند، و پیام پیگیری بعدی در صف به همان درخواست سرور بومی پاسخ می‌دهد، نه اینکه به‌عنوان زمینهٔ اضافی هدایت شود. درخواست‌های دیگر MCP همچنان بسته شکست می‌خورند.

هدایت صف اجرای فعال روی `turn/steer` سرور برنامهٔ Codex نگاشت می‌شود. با مقدار پیش‌فرض `messages.queue.mode: "steer"`، OpenClaw پیام‌های گفت‌وگوی صف‌شده را برای پنجرهٔ سکوت پیکربندی‌شده دسته‌بندی می‌کند و آن‌ها را به‌ترتیب ورود به‌صورت یک درخواست `turn/steer` می‌فرستد. حالت قدیمی `queue` درخواست‌های جداگانهٔ `turn/steer` می‌فرستد. نوبت‌های بازبینی Codex و Compaction دستی می‌توانند هدایت همان نوبت را رد کنند؛ در این حالت OpenClaw وقتی حالت انتخاب‌شده امکان عقب‌گرد را بدهد از صف پیگیری استفاده می‌کند. [صف هدایت](/fa/concepts/queue-steering) را ببینید.

وقتی مدل انتخاب‌شده از سازوکار Codex استفاده می‌کند، Compaction رشتهٔ بومی به سرور برنامهٔ Codex واگذار می‌شود. OpenClaw یک آینهٔ رونوشت برای تاریخچهٔ کانال، جست‌وجو، `/new`، `/reset`، و تغییر مدل یا سازوکار در آینده نگه می‌دارد. این آینه شامل پرامپت کاربر، متن نهایی دستیار، و رکوردهای سبک استدلال یا برنامهٔ Codex است وقتی سرور برنامه آن‌ها را صادر کند. امروز، OpenClaw فقط سیگنال‌های آغاز و تکمیل Compaction بومی را ثبت می‌کند. هنوز خلاصهٔ خواندنی برای انسان یا فهرست قابل ممیزی از اینکه Codex پس از Compaction کدام ورودی‌ها را نگه داشته است افشا نمی‌کند.

از آنجا که Codex مالک رشتهٔ بومی رسمی است، `tool_result_persist` در حال حاضر رکوردهای نتیجهٔ ابزار بومی Codex را بازنویسی نمی‌کند. این فقط زمانی اعمال می‌شود که OpenClaw در حال نوشتن نتیجهٔ ابزار رونوشت نشست تحت مالکیت OpenClaw باشد.

تولید رسانه به PI نیاز ندارد. تصویر، ویدئو، موسیقی، PDF، TTS، و فهم رسانه همچنان از تنظیمات ارائه‌دهنده/مدل متناظر مانند `agents.defaults.imageGenerationModel`، `videoGenerationModel`، `pdfModel`، و `messages.tts` استفاده می‌کنند.

## عیب‌یابی

**Codex به‌عنوان یک ارائه‌دهندهٔ معمولی `/model` ظاهر نمی‌شود:** برای پیکربندی‌های جدید انتظار می‌رود. یک مدل `openai/gpt-*` با `agentRuntime.id: "codex"` (یا یک ارجاع قدیمی `codex/*`) انتخاب کنید، `plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید آیا `plugins.allow` مقدار `codex` را مستثنا می‌کند یا نه.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** `agentRuntime.id: "auto"` همچنان می‌تواند وقتی هیچ سازوکار Codex اجرا را مطالبه نکند، از PI به‌عنوان پشتوانهٔ سازگاری استفاده کند. برای اجبار انتخاب Codex هنگام آزمایش، `agentRuntime.id: "codex"` را تنظیم کنید. زمان اجرای Codex اجباری به‌جای عقب‌گرد به PI شکست می‌خورد. پس از انتخاب سرور برنامهٔ Codex، خطاهای آن مستقیماً نمایان می‌شوند.

**سرور برنامه رد می‌شود:** Codex را ارتقا دهید تا دست‌دهی سرور برنامه نسخهٔ `0.125.0` یا جدیدتر را گزارش کند. پیش‌انتشارهای هم‌نسخه یا نسخه‌های دارای پسوند ساخت مانند `0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، زیرا کف پروتکل پایدار `0.125.0` همان چیزی است که OpenClaw آزمایش می‌کند.

**کشف مدل کند است:** مقدار `plugins.entries.codex.config.discovery.timeoutMs` را کاهش دهید یا کشف را غیرفعال کنید.

**انتقال WebSocket فوراً شکست می‌خورد:** `appServer.url`، `authToken`، و اینکه سرور برنامهٔ راه‌دور همان نسخهٔ پروتکل سرور برنامهٔ Codex را صحبت می‌کند بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این انتظار می‌رود مگر اینکه برای آن عامل `agentRuntime.id: "codex"` را اجباری کرده باشید یا یک ارجاع قدیمی `codex/*` انتخاب کرده باشید. ارجاع‌های سادهٔ `openai/gpt-*` و ارائه‌دهنده‌های دیگر در حالت `auto` روی مسیر معمول ارائه‌دهندهٔ خود باقی می‌مانند. اگر `agentRuntime.id: "codex"` را اجباری کنید، هر نوبت تعبیه‌شده برای آن عامل باید یک مدل OpenAI پشتیبانی‌شده توسط Codex باشد.

**Computer Use نصب شده اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه،
`/codex computer-use status` را بررسی کنید. اگر ابزاری
`Native hook relay unavailable` گزارش داد، از `/new` یا `/reset` استفاده کنید؛ اگر ادامه داشت، Gateway را دوباره راه‌اندازی کنید تا ثبت‌های قدیمی هوک بومی پاک شوند. اگر `computer-use.list_apps`
به پایان مهلت زمانی رسید، Codex Computer Use یا Codex Desktop را دوباره راه‌اندازی کنید و دوباره تلاش کنید.

## مرتبط

- [Pluginهای هارنس عامل](/fa/plugins/sdk-agent-harness)
- [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [ارائه‌دهنده OpenAI](/fa/providers/openai)
- [وضعیت](/fa/cli/status)
- [هوک‌های Plugin](/fa/plugins/hooks)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [آزمون](/fa/help/testing-live#live-codex-app-server-harness-smoke)

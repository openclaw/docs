---
read_when:
    - می‌خواهید از هارنس سرور برنامهٔ همراه Codex استفاده کنید
    - به نمونه‌های پیکربندی هارنس Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به PI شکست بخورند
summary: نوبت‌های عامل تعبیه‌شدهٔ OpenClaw را از طریق هارنس app-server همراه Codex اجرا کنید
title: هارنس Codex
x-i18n:
    generated_at: "2026-05-03T11:39:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83cb442bb2b87fdfe530619e8951bc8f4f5a7d3bfd68ca49eeb16bbdd8b189b4
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw اجازه می‌دهد نوبت‌های عامل تعبیه‌شده را به‌جای مهار داخلی PI، از طریق app-server مربوط به Codex اجرا کند.

از این گزینه زمانی استفاده کنید که می‌خواهید Codex مالک نشست سطح‌پایین عامل باشد: کشف مدل، ازسرگیری بومی رشته گفتگو، Compaction بومی، و اجرای app-server. OpenClaw همچنان مالک کانال‌های گفتگو، فایل‌های نشست، انتخاب مدل، ابزارها، تأییدها، تحویل رسانه، و آینه قابل‌مشاهده رونوشت است.

وقتی یک نوبت گفتگوی مبدأ از طریق مهار Codex اجرا می‌شود، پاسخ‌های قابل‌مشاهده به‌طور پیش‌فرض از ابزار `message` در OpenClaw استفاده می‌کنند، اگر استقرار به‌طور صریح `messages.visibleReplies` را پیکربندی نکرده باشد. عامل همچنان می‌تواند نوبت Codex خود را به‌صورت خصوصی تمام کند؛ فقط زمانی به کانال ارسال می‌کند که `message(action="send")` را فراخوانی کند. برای نگه داشتن پاسخ‌های نهایی گفتگوی مستقیم در مسیر تحویل خودکار قدیمی، `messages.visibleReplies: "automatic"` را تنظیم کنید.

نوبت‌های Heartbeat در Codex نیز به‌طور پیش‌فرض ابزار `heartbeat_respond` را دریافت می‌کنند، تا عامل بتواند ثبت کند که آیا بیدارباش باید ساکت بماند یا بدون کدگذاری آن جریان کنترل در متن نهایی اطلاع‌رسانی کند.

اگر می‌خواهید جهت‌گیری پیدا کنید، با
[زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) شروع کنید. نسخه کوتاه این است:
`openai/gpt-5.5` ارجاع مدل است، `codex` زمان‌اجرا است، و Telegram، Discord، Slack، یا کانالی دیگر همچنان سطح ارتباطی باقی می‌ماند.

## پیکربندی سریع

بیشتر کاربرانی که «Codex در OpenClaw» را می‌خواهند، این مسیر را می‌خواهند: با یک اشتراک ChatGPT/Codex وارد شوید، سپس نوبت‌های عامل تعبیه‌شده را از طریق زمان‌اجرای بومی app-server در Codex اجرا کنید. ارجاع مدل همچنان به‌صورت متعارف `openai/gpt-*` باقی می‌ماند؛ احراز هویت اشتراک از حساب/نمایه Codex می‌آید، نه از پیشوند مدل `openai-codex/*`.

اگر هنوز این کار را نکرده‌اید، ابتدا با Codex OAuth وارد شوید:

```bash
openclaw models auth login --provider openai-codex
```

سپس Plugin همراه `codex` را فعال کنید و زمان‌اجرای Codex را اجباری کنید:

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

وقتی منظورتان زمان‌اجرای بومی Codex است، از `openai-codex/gpt-*` استفاده نکنید. آن پیشوند مسیر صریح «Codex OAuth از طریق PI» است. تغییرات پیکربندی روی نشست‌های جدید یا بازنشانی‌شده اعمال می‌شوند؛ نشست‌های موجود زمان‌اجرای ثبت‌شده خود را نگه می‌دارند.

## این Plugin چه چیزی را تغییر می‌دهد

Plugin همراه `codex` چند قابلیت جداگانه ارائه می‌کند:

| قابلیت | شیوه استفاده | کاری که انجام می‌دهد |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| زمان‌اجرای تعبیه‌شده بومی | `agentRuntime.id: "codex"` | نوبت‌های عامل تعبیه‌شده OpenClaw را از طریق app-server در Codex اجرا می‌کند. |
| فرمان‌های بومی کنترل گفتگو | `/codex bind`, `/codex resume`, `/codex steer`, ... | رشته‌گفتگوهای app-server در Codex را از یک مکالمه پیام‌رسانی متصل و کنترل می‌کند. |
| ارائه‌دهنده/کاتالوگ app-server در Codex | درونی‌های `codex`، که از طریق مهار در دسترس قرار می‌گیرند | به زمان‌اجرا اجازه می‌دهد مدل‌های app-server را کشف و اعتبارسنجی کند. |
| مسیر درک رسانه در Codex | مسیرهای سازگاری مدل تصویر `codex/*` | برای مدل‌های پشتیبانی‌شده درک تصویر، نوبت‌های محدود app-server در Codex را اجرا می‌کند. |
| رله بومی hook | Hookهای Plugin پیرامون رویدادهای بومی Codex | به OpenClaw اجازه می‌دهد رویدادهای پشتیبانی‌شده ابزار/نهایی‌سازی بومی Codex را مشاهده/مسدود کند. |

فعال‌سازی Plugin این قابلیت‌ها را در دسترس قرار می‌دهد. این کار **این‌ها را انجام نمی‌دهد**:

- شروع استفاده از Codex برای هر مدل OpenAI
- تبدیل ارجاع‌های مدل `openai-codex/*` به زمان‌اجرای بومی
- پیش‌فرض کردن ACP/acpx به‌عنوان مسیر Codex
- جابه‌جایی داغ نشست‌های موجودی که از قبل یک زمان‌اجرای PI ثبت کرده‌اند
- جایگزین کردن تحویل کانال OpenClaw، فایل‌های نشست، ذخیره‌سازی نمایه احراز هویت، یا مسیریابی پیام

همان Plugin همچنین مالک سطح فرمان بومی کنترل گفتگوی `/codex` است. اگر Plugin فعال باشد و کاربر بخواهد رشته‌گفتگوهای Codex را از گفتگو bind، resume، steer، stop یا inspect کند، عامل‌ها باید `/codex ...` را به ACP ترجیح دهند. ACP زمانی fallback صریح باقی می‌ماند که کاربر ACP/acpx را بخواهد یا در حال آزمایش آداپتور Codex در ACP باشد.

نوبت‌های بومی Codex، Hookهای Plugin در OpenClaw را به‌عنوان لایه سازگاری عمومی نگه می‌دارند. این‌ها Hookهای درون‌فرآیندی OpenClaw هستند، نه Hookهای فرمان `hooks.json` در Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` برای رکوردهای آینه‌شده رونوشت
- `before_agent_finalize` از طریق رله `Stop` در Codex
- `agent_end`

Pluginها همچنین می‌توانند میان‌افزار نتیجه ابزارِ بی‌طرف نسبت به زمان‌اجرا ثبت کنند تا پس از اجرای ابزار توسط OpenClaw و پیش از بازگرداندن نتیجه به Codex، نتایج ابزار پویای OpenClaw را بازنویسی کنند. این از Hook عمومی Plugin یعنی `tool_result_persist` جداست، که نوشتن‌های نتیجه ابزارِ متعلق به OpenClaw در رونوشت را تبدیل می‌کند.

برای خود معنای Hookهای Plugin، [Hookهای Plugin](/fa/plugins/hooks)
و [رفتار نگهبان Plugin](/fa/tools/plugin) را ببینید.

مهار به‌طور پیش‌فرض خاموش است. پیکربندی‌های جدید باید ارجاع‌های مدل OpenAI را به‌صورت متعارف `openai/gpt-*` نگه دارند و زمانی که اجرای بومی app-server را می‌خواهند، به‌طور صریح `agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex` را اجباری کنند. ارجاع‌های مدل قدیمی `codex/*` همچنان برای سازگاری، مهار را خودکار انتخاب می‌کنند، اما پیشوندهای ارائه‌دهنده قدیمیِ پشتیبانی‌شده با زمان‌اجرا به‌عنوان انتخاب‌های عادی مدل/ارائه‌دهنده نشان داده نمی‌شوند.

اگر Plugin `codex` فعال باشد اما مدل اصلی همچنان `openai-codex/*` باشد، `openclaw doctor` به‌جای تغییر مسیر هشدار می‌دهد. این عمدی است: `openai-codex/*` همچنان مسیر Codex OAuth/اشتراک از طریق PI باقی می‌ماند، و اجرای بومی app-server یک انتخاب صریح زمان‌اجرا باقی می‌ماند.

## نقشه مسیر

پیش از تغییر پیکربندی از این جدول استفاده کنید:

| رفتار مطلوب | ارجاع مدل | پیکربندی زمان‌اجرا | مسیر احراز هویت/نمایه | برچسب وضعیت مورد انتظار |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| اشتراک ChatGPT/Codex با زمان‌اجرای بومی Codex | `openai/gpt-*` | `agentRuntime.id: "codex"` | Codex OAuth یا حساب Codex | `Runtime: OpenAI Codex` |
| OpenAI API از طریق اجراکننده عادی OpenClaw | `openai/gpt-*` | حذف‌شده یا `runtime: "pi"` | کلید OpenAI API | `Runtime: OpenClaw Pi Default` |
| اشتراک ChatGPT/Codex از طریق PI | `openai-codex/gpt-*` | حذف‌شده یا `runtime: "pi"` | ارائه‌دهنده OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| ارائه‌دهندگان ترکیبی با حالت خودکار محافظه‌کارانه | ارجاع‌های خاص ارائه‌دهنده | `agentRuntime.id: "auto"` | بر اساس ارائه‌دهنده انتخاب‌شده | وابسته به زمان‌اجرای انتخاب‌شده |
| نشست صریح آداپتور ACP در Codex | وابسته به اعلان/مدل ACP | `sessions_spawn` با `runtime: "acp"` | احراز هویت backend در ACP | وضعیت task/نشست ACP |

جدایی مهم، ارائه‌دهنده در برابر زمان‌اجرا است:

- `openai-codex/*` پاسخ می‌دهد «PI باید از کدام مسیر ارائه‌دهنده/احراز هویت استفاده کند؟»
- `agentRuntime.id: "codex"` پاسخ می‌دهد «کدام loop باید این نوبت تعبیه‌شده را اجرا کند؟»
- `/codex ...` پاسخ می‌دهد «این گفتگو باید به کدام مکالمه بومی Codex متصل شود یا آن را کنترل کند؟»
- ACP پاسخ می‌دهد «acpx باید کدام فرآیند مهار خارجی را اجرا کند؟»

## پیشوند درست مدل را انتخاب کنید

مسیرهای خانواده OpenAI به پیشوند وابسته‌اند. برای راه‌اندازی رایجِ اشتراک به‌همراه زمان‌اجرای بومی Codex، از `openai/*` با `agentRuntime.id: "codex"` استفاده کنید. فقط زمانی از `openai-codex/*` استفاده کنید که عمداً Codex OAuth از طریق PI را می‌خواهید:

| ارجاع مدل | مسیر زمان‌اجرا | زمان استفاده |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4` | ارائه‌دهنده OpenAI از طریق لوله‌کشی OpenClaw/PI | دسترسی مستقیم فعلی به OpenAI Platform API را با `OPENAI_API_KEY` می‌خواهید. |
| `openai-codex/gpt-5.5` | OpenAI Codex OAuth از طریق OpenClaw/PI | احراز هویت اشتراک ChatGPT/Codex را با اجراکننده پیش‌فرض PI می‌خواهید. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | مهار app-server در Codex | احراز هویت اشتراک ChatGPT/Codex را با اجرای بومی Codex می‌خواهید. |

GPT-5.5 می‌تواند هم در مسیرهای مستقیم کلید API در OpenAI و هم در مسیرهای اشتراک Codex ظاهر شود، وقتی حساب شما آن‌ها را ارائه می‌کند. برای زمان‌اجرای بومی Codex، از `openai/gpt-5.5` با مهار app-server در Codex استفاده کنید؛ برای PI OAuth از `openai-codex/gpt-5.5`؛ یا برای ترافیک مستقیم کلید API، از `openai/gpt-5.5` بدون override زمان‌اجرای Codex.

ارجاع‌های قدیمی `codex/gpt-*` همچنان به‌عنوان نام‌های مستعار سازگاری پذیرفته می‌شوند. مهاجرت سازگاری Doctor ارجاع‌های قدیمی زمان‌اجرای اصلی را به ارجاع‌های متعارف مدل بازنویسی می‌کند و سیاست زمان‌اجرا را جداگانه ثبت می‌کند، در حالی که ارجاع‌های قدیمی فقط fallback بدون تغییر رها می‌شوند، چون زمان‌اجرا برای کل محفظه عامل پیکربندی می‌شود. پیکربندی‌های جدید PI Codex OAuth باید از `openai-codex/gpt-*` استفاده کنند؛ پیکربندی‌های جدید مهار بومی app-server باید از `openai/gpt-*` به‌علاوه `agentRuntime.id: "codex"` استفاده کنند.

`agents.defaults.imageModel` از همان جداسازی پیشوند پیروی می‌کند. وقتی درک تصویر باید از مسیر ارائه‌دهنده OpenAI Codex OAuth اجرا شود، از `openai-codex/gpt-*` استفاده کنید. وقتی درک تصویر باید از طریق یک نوبت محدود app-server در Codex اجرا شود، از `codex/gpt-*` استفاده کنید. مدل app-server در Codex باید پشتیبانی از ورودی تصویر را اعلام کند؛ مدل‌های فقط متنی Codex پیش از شروع نوبت رسانه شکست می‌خورند.

برای تأیید مهار مؤثر نشست فعلی، از `/status` استفاده کنید. اگر انتخاب غافلگیرکننده است، ثبت اشکال‌زدایی را برای زیرسامانه `agents/harness` فعال کنید و رکورد ساختاریافته `agent harness selected` در Gateway را بررسی کنید. این رکورد شامل شناسه مهار انتخاب‌شده، دلیل انتخاب، سیاست زمان‌اجرا/fallback، و در حالت `auto`، نتیجه پشتیبانی هر نامزد Plugin است.

### هشدارهای doctor چه معنایی دارند

`openclaw doctor` زمانی هشدار می‌دهد که همه این موارد درست باشند:

- Plugin همراه `codex` فعال یا مجاز باشد
- مدل اصلی یک عامل `openai-codex/*` باشد
- زمان‌اجرای مؤثر آن عامل `codex` نباشد

این هشدار وجود دارد چون کاربران اغلب انتظار دارند «Plugin Codex فعال است» به‌معنای «زمان‌اجرای بومی app-server در Codex» باشد. OpenClaw چنین پرشی انجام نمی‌دهد. هشدار یعنی:

- اگر قصدتان ChatGPT/Codex OAuth از طریق PI بوده است، **هیچ تغییری لازم نیست**.
- اگر قصدتان اجرای بومی app-server بوده است، مدل را به `openai/<model>` تغییر دهید و `agentRuntime.id: "codex"` را تنظیم کنید.
- پس از تغییر زمان‌اجرا، نشست‌های موجود همچنان به `/new` یا `/reset` نیاز دارند، چون pinهای زمان‌اجرای نشست چسبنده هستند.

انتخاب مهار کنترل زنده نشست نیست. وقتی یک نوبت تعبیه‌شده اجرا می‌شود، OpenClaw شناسه مهار انتخاب‌شده را روی آن نشست ثبت می‌کند و برای نوبت‌های بعدی در همان شناسه نشست از آن استفاده می‌کند. وقتی می‌خواهید نشست‌های آینده از مهار دیگری استفاده کنند، پیکربندی `agentRuntime` یا `OPENCLAW_AGENT_RUNTIME` را تغییر دهید؛ پیش از جابه‌جایی یک مکالمه موجود بین PI و Codex، از `/new` یا `/reset` برای شروع یک نشست تازه استفاده کنید. این از بازپخش یک رونوشت از طریق دو سیستم نشست بومی ناسازگار جلوگیری می‌کند.

نشست‌های قدیمی‌ای که پیش از pinهای مهار ساخته شده‌اند، پس از داشتن تاریخچه رونوشت، به‌عنوان pinشده به PI در نظر گرفته می‌شوند. پس از تغییر پیکربندی، برای وارد کردن آن مکالمه به Codex از `/new` یا `/reset` استفاده کنید.

`/status` زمان اجرای مؤثر مدل را نشان می‌دهد. هارنس پیش‌فرض PI به‌صورت
`Runtime: OpenClaw Pi Default` ظاهر می‌شود، و هارنس app-server مربوط به Codex به‌صورت
`Runtime: OpenAI Codex`.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس.
- Codex app-server نسخه `0.125.0` یا جدیدتر. Plugin همراه به‌طور پیش‌فرض یک
  باینری Codex app-server سازگار را مدیریت می‌کند، بنابراین فرمان‌های محلی
  `codex` در `PATH` بر راه‌اندازی عادی هارنس اثر نمی‌گذارند.
- احراز هویت Codex در دسترس فرایند app-server یا پل احراز هویت Codex در
  OpenClaw باشد. راه‌اندازی‌های app-server محلی برای هر عامل از یک خانه Codex
  مدیریت‌شده توسط OpenClaw و یک `HOME` فرزند ایزوله استفاده می‌کنند، بنابراین
  به‌طور پیش‌فرض حساب شخصی `~/.codex`، Skills، plugins، پیکربندی، وضعیت thread،
  یا `$HOME/.agents/skills` بومی شما را نمی‌خوانند.

Plugin دست‌دهی‌های app-server قدیمی‌تر یا بدون نسخه را مسدود می‌کند. این کار
OpenClaw را روی سطح پروتکلی نگه می‌دارد که در برابر آن آزموده شده است.

برای آزمون‌های smoke زنده و Docker، احراز هویت معمولاً از حساب Codex CLI
یا یک پروفایل احراز هویت `openai-codex` در OpenClaw می‌آید. راه‌اندازی‌های
app-server محلی stdio همچنین می‌توانند وقتی حسابی وجود ندارد به
`CODEX_API_KEY` / `OPENAI_API_KEY` برگردند.

## فایل‌های bootstrap فضای کاری

Codex خودش `AGENTS.md` را از طریق کشف بومی اسناد پروژه مدیریت می‌کند. OpenClaw
فایل‌های مصنوعی اسناد پروژه Codex نمی‌نویسد و برای فایل‌های persona به نام‌های
fallback در Codex وابسته نیست، زیرا fallbackهای Codex فقط وقتی اعمال می‌شوند که
`AGENTS.md` وجود نداشته باشد.

برای برابری فضای کاری OpenClaw، هارنس Codex سایر فایل‌های bootstrap
(`SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`،
`BOOTSTRAP.md`، و `MEMORY.md` در صورت وجود) را resolve می‌کند و آن‌ها را از طریق
دستورالعمل‌های پیکربندی Codex در `thread/start` و `thread/resume` منتقل می‌کند.
این کار باعث می‌شود `SOUL.md` و زمینه persona/profile مرتبط فضای کاری، بدون
تکرار `AGENTS.md`، قابل مشاهده بمانند.

## افزودن Codex در کنار مدل‌های دیگر

اگر همان عامل باید آزادانه بین Codex و مدل‌های ارائه‌دهنده غیر Codex جابه‌جا
شود، `agentRuntime.id: "codex"` را به‌صورت سراسری تنظیم نکنید. زمان اجرای اجباری
روی هر نوبت embedded برای آن عامل یا نشست اعمال می‌شود. اگر در حالی که آن runtime
اجباری است یک مدل Anthropic انتخاب کنید، OpenClaw همچنان هارنس Codex را امتحان
می‌کند و به‌جای مسیریابی بی‌سروصدا از طریق PI، بسته شکست می‌خورد.

به‌جای آن از یکی از این شکل‌ها استفاده کنید:

- Codex را روی یک عامل اختصاصی با `agentRuntime.id: "codex"` قرار دهید.
- عامل پیش‌فرض را روی `agentRuntime.id: "auto"` و fallback مربوط به PI برای
  استفاده عادی مختلط از ارائه‌دهنده‌ها نگه دارید.
- از ارجاع‌های قدیمی `codex/*` فقط برای سازگاری استفاده کنید. پیکربندی‌های جدید
  باید `openai/*` را همراه با یک سیاست runtime صریح Codex ترجیح دهند.

برای نمونه، این پیکربندی عامل پیش‌فرض را روی انتخاب خودکار عادی نگه می‌دارد و
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

- عامل پیش‌فرض `main` از مسیر عادی ارائه‌دهنده و fallback سازگاری PI استفاده می‌کند.
- عامل `codex` از هارنس Codex app-server استفاده می‌کند.
- اگر Codex برای عامل `codex` موجود یا پشتیبانی‌شده نباشد، نوبت شکست می‌خورد
  به‌جای اینکه بی‌سروصدا از PI استفاده کند.

## مسیریابی فرمان عامل

عامل‌ها باید درخواست‌های کاربر را بر اساس نیت مسیریابی کنند، نه فقط بر اساس واژه "Codex":

| کاربر درخواست می‌کند...                               | عامل باید استفاده کند...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "این چت را به Codex متصل کن"                          | `/codex bind`                                    |
| "thread مربوط به Codex با `<id>` را اینجا از سر بگیر" | `/codex resume <id>`                             |
| "threadهای Codex را نشان بده"                         | `/codex threads`                                 |
| "برای یک اجرای بد Codex گزارش پشتیبانی ثبت کن"        | `/diagnostics [note]`                            |
| "فقط برای این thread پیوست‌شده بازخورد Codex بفرست"   | `/codex diagnostics [note]`                      |
| "از اشتراک ChatGPT/Codex من با runtime Codex استفاده کن" | `openai/*` به‌علاوه `agentRuntime.id: "codex"` |
| "از اشتراک ChatGPT/Codex من از طریق PI استفاده کن"    | ارجاع‌های مدل `openai-codex/*`                   |
| "Codex را از طریق ACP/acpx اجرا کن"                    | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Claude Code/Gemini/OpenCode/Cursor را در یک thread شروع کن" | ACP/acpx، نه `/codex` و نه sub-agentهای بومی |

OpenClaw فقط وقتی راهنمای spawn مربوط به ACP را به عامل‌ها تبلیغ می‌کند که ACP
فعال، dispatchable، و متکی به یک backend runtime بارگذاری‌شده باشد. اگر ACP در
دسترس نباشد، system prompt و Skills مربوط به Plugin نباید به عامل درباره
مسیریابی ACP آموزش دهند.

## استقرارهای فقط Codex

وقتی لازم است ثابت کنید هر نوبت عامل embedded از Codex استفاده می‌کند، هارنس
Codex را اجباری کنید. runtimeهای صریح Plugin بسته شکست می‌خورند و هرگز بی‌سروصدا
از طریق PI دوباره تلاش نمی‌شوند:

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

بازنویسی محیطی:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

با اجباری شدن Codex، اگر Plugin مربوط به Codex غیرفعال باشد، app-server بیش از
حد قدیمی باشد، یا app-server نتواند شروع شود، OpenClaw زود شکست می‌خورد.

## Codex برای هر عامل

می‌توانید یک عامل را فقط Codex کنید، در حالی که عامل پیش‌فرض انتخاب خودکار عادی
را نگه می‌دارد:

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

از فرمان‌های عادی نشست برای جابه‌جایی عامل‌ها و مدل‌ها استفاده کنید. `/new` یک
نشست تازه OpenClaw ایجاد می‌کند و هارنس Codex در صورت نیاز thread جانبی
app-server خود را ایجاد یا از سر می‌گیرد. `/reset` binding نشست OpenClaw را برای
آن thread پاک می‌کند و اجازه می‌دهد نوبت بعدی دوباره هارنس را از پیکربندی فعلی
resolve کند.

## کشف مدل

به‌طور پیش‌فرض، Plugin مربوط به Codex از app-server مدل‌های موجود را می‌پرسد.
اگر کشف شکست بخورد یا timeout شود، از یک کاتالوگ fallback همراه برای موارد زیر
استفاده می‌کند:

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

وقتی می‌خواهید startup از probe کردن Codex پرهیز کند و به کاتالوگ fallback
بچسبد، کشف را غیرفعال کنید:

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

به‌طور پیش‌فرض، Plugin باینری Codex مدیریت‌شده توسط OpenClaw را به‌صورت محلی با
این فرمان شروع می‌کند:

```bash
codex app-server --listen stdio://
```

باینری مدیریت‌شده همراه با بسته Plugin مربوط به `codex` عرضه می‌شود. این کار
نسخه app-server را به Plugin همراه گره می‌زند، نه به هر Codex CLI جداگانه‌ای که
اتفاقاً به‌صورت محلی نصب شده باشد. `appServer.command` را فقط وقتی تنظیم کنید که
عمداً می‌خواهید یک executable متفاوت اجرا کنید.

به‌طور پیش‌فرض، OpenClaw نشست‌های هارنس Codex محلی را در حالت YOLO شروع می‌کند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. این حالت اعتماد اپراتور محلی است که برای
Heartbeatهای خودمختار استفاده می‌شود: Codex می‌تواند از ابزارهای shell و شبکه
استفاده کند بدون اینکه روی native approval promptهایی که کسی برای پاسخ‌دادن به
آن‌ها حاضر نیست متوقف شود.

برای فعال‌سازی تأییدهای بازبینی‌شده توسط guardian در Codex، `appServer.mode:
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

حالت Guardian از مسیر تأیید auto-review بومی Codex استفاده می‌کند. وقتی Codex
درخواست خروج از sandbox، نوشتن بیرون از workspace، یا افزودن مجوزهایی مثل دسترسی
شبکه را می‌دهد، Codex آن درخواست تأیید را به‌جای prompt انسانی به reviewer بومی
مسیریابی می‌کند. reviewer چارچوب ریسک Codex را اعمال می‌کند و درخواست مشخص را
تأیید یا رد می‌کند. وقتی guardrailهای بیشتری از حالت YOLO می‌خواهید اما همچنان
نیاز دارید عامل‌های unattended پیشرفت کنند، از Guardian استفاده کنید.

preset مربوط به `guardian` به `approvalPolicy: "on-request"`،
`approvalsReviewer: "auto_review"`، و `sandbox: "workspace-write"` گسترش می‌یابد.
فیلدهای سیاست منفرد همچنان `mode` را override می‌کنند، بنابراین استقرارهای
پیشرفته می‌توانند preset را با انتخاب‌های صریح ترکیب کنند. مقدار reviewer قدیمی‌تر
`guardian_subagent` همچنان به‌عنوان alias سازگاری پذیرفته می‌شود، اما
پیکربندی‌های جدید باید از `auto_review` استفاده کنند.

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

راه‌اندازی‌های app-server از نوع Stdio به‌طور پیش‌فرض محیط فرایند OpenClaw را
به ارث می‌برند، اما OpenClaw پل حساب Codex app-server را در اختیار دارد و هر دو
`CODEX_HOME` و `HOME` را به دایرکتوری‌های مختص هر عامل زیر وضعیت OpenClaw همان
عامل تنظیم می‌کند. skill loader خود Codex مسیرهای `$CODEX_HOME/skills` و
`$HOME/.agents/skills` را می‌خواند، بنابراین هر دو مقدار برای راه‌اندازی‌های
app-server محلی ایزوله هستند. این کار Skills بومی Codex، plugins، پیکربندی،
حساب‌ها، و وضعیت thread را محدود به عامل OpenClaw نگه می‌دارد، به‌جای اینکه از
خانه شخصی Codex CLI اپراتور نشت کند.

Pluginهای OpenClaw و snapshotهای skill مربوط به OpenClaw همچنان از طریق registry
Plugin و skill loader خود OpenClaw جریان می‌یابند. دارایی‌های شخصی Codex CLI
چنین نمی‌کنند. اگر Skills یا plugins مفیدی در Codex CLI دارید که باید بخشی از
یک عامل OpenClaw شوند، آن‌ها را صریحاً inventory کنید:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

provider مهاجرت Codex، Skills را در workspace عامل فعلی OpenClaw کپی می‌کند.
plugins، hooks، و فایل‌های پیکربندی بومی Codex برای بازبینی دستی گزارش یا archive
می‌شوند، به‌جای اینکه خودکار فعال شوند، زیرا می‌توانند فرمان اجرا کنند، سرورهای
MCP را در معرض قرار دهند، یا credentials حمل کنند.

احراز هویت به این ترتیب انتخاب می‌شود:

1. یک پروفایل احراز هویت صریح Codex در OpenClaw برای عامل.
2. حساب موجود app-server در خانه Codex همان عامل.
3. فقط برای راه‌اندازی‌های app-server محلی stdio، ابتدا `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی حساب app-server وجود ندارد و احراز هویت OpenAI هنوز
   لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex به سبک اشتراک ChatGPT می‌بیند،
`CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex ایجادشده حذف می‌کند.
این کار کلیدهای API سطح Gateway را برای embeddings یا مدل‌های مستقیم OpenAI
در دسترس نگه می‌دارد بدون اینکه نوبت‌های بومی Codex app-server به‌اشتباه از طریق
API صورت‌حساب شوند. پروفایل‌های صریح کلید API مربوط به Codex و fallback کلیدهای
محیطی stdio محلی، به‌جای env فرایند فرزند به ارث‌رسیده، از login app-server
استفاده می‌کنند. اتصال‌های WebSocket app-server fallback کلید API محیط Gateway
را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب خود app-server راه دور
استفاده کنید.

اگر یک استقرار به ایزولاسیون محیطی بیشتر نیاز دارد، آن متغیرها را به
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

`appServer.clearEnv` فقط بر فرایند فرزند Codex app-server ایجادشده اثر می‌گذارد.

ابزارهای پویای Codex به‌طور پیش‌فرض از نمایه `native-first` استفاده می‌کنند. در این حالت،
OpenClaw ابزارهای پویایی را که عملیات فضای کاری بومی Codex را تکرار می‌کنند
در دسترس نمی‌گذارد: `read`، `write`، `edit`، `apply_patch`، `exec`، `process` و
`update_plan`. ابزارهای یکپارچه‌سازی OpenClaw مانند پیام‌رسانی، نشست‌ها، رسانه،
cron، مرورگر، گره‌ها، gateway، `heartbeat_respond` و `web_search` همچنان
در دسترس می‌مانند.

فیلدهای Plugin سطح‌بالای پشتیبانی‌شده Codex:

| فیلد                       | پیش‌فرض        | معنی                                                                                         |
| -------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | برای در دسترس گذاشتن مجموعه کامل ابزارهای پویای OpenClaw برای سرور برنامه Codex از `"openclaw-compat"` استفاده کنید. |
| `codexDynamicToolsExclude` | `[]`           | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های سرور برنامه Codex حذف شوند.        |

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد                | پیش‌فرض                                  | معنی                                                                                                                                                                                                                                      |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"`، Codex را اجرا می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                                                                                                                      |
| `command`           | باینری مدیریت‌شده Codex                  | فایل اجرایی برای انتقال stdio. برای استفاده از باینری مدیریت‌شده آن را تنظیم‌نشده بگذارید؛ فقط برای بازنویسی صریح آن را تنظیم کنید.                                                                                                  |
| `args`              | `["app-server", "--listen", "stdio://"]` | آرگومان‌های انتقال stdio.                                                                                                                                                                                                                 |
| `url`               | تنظیم‌نشده                               | URL سرور برنامه WebSocket.                                                                                                                                                                                                                |
| `authToken`         | تنظیم‌نشده                               | توکن Bearer برای انتقال WebSocket.                                                                                                                                                                                                        |
| `headers`           | `{}`                                     | سرآیندهای اضافی WebSocket.                                                                                                                                                                                                                |
| `clearEnv`          | `[]`                                     | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط موروثی OpenClaw از فرایند سرور برنامه stdio اجراشده حذف می‌شوند. `CODEX_HOME` و `HOME` برای ایزوله‌سازی Codex به‌ازای هر عامل OpenClaw در اجراهای محلی رزرو شده‌اند. |
| `requestTimeoutMs`  | `60000`                                  | زمان پایان برای فراخوانی‌های صفحه کنترل سرور برنامه.                                                                                                                                                                                     |
| `mode`              | `"yolo"`                                 | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط نگهبان.                                                                                                                                                                             |
| `approvalPolicy`    | `"never"`                                | سیاست تأیید بومی Codex که به شروع/ازسرگیری/نوبت رشته ارسال می‌شود.                                                                                                                                                                      |
| `sandbox`           | `"danger-full-access"`                   | حالت sandbox بومی Codex که به شروع/ازسرگیری رشته ارسال می‌شود.                                                                                                                                                                          |
| `approvalsReviewer` | `"user"`                                 | برای اینکه Codex اعلان‌های تأیید بومی را بازبینی کند از `"auto_review"` استفاده کنید. `guardian_subagent` همچنان یک نام مستعار قدیمی است.                                                                                             |
| `serviceTier`       | تنظیم‌نشده                               | سطح سرویس اختیاری سرور برنامه Codex: `"fast"`، `"flex"` یا `null`. مقادیر قدیمی نامعتبر نادیده گرفته می‌شوند.                                                                                                                        |

فراخوانی‌های ابزار پویای متعلق به OpenClaw مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: هر درخواست `item/tool/call` در Codex باید
ظرف ۳۰ ثانیه یک پاسخ OpenClaw دریافت کند. هنگام پایان زمان، OpenClaw در صورت پشتیبانی
سیگنال ابزار را لغو می‌کند و یک پاسخ ناموفق ابزار پویا به Codex برمی‌گرداند تا
نوبت بتواند ادامه یابد، به‌جای آنکه نشست در `processing` باقی بماند.

پس از اینکه OpenClaw به یک درخواست سرور برنامه محدود به نوبت Codex پاسخ می‌دهد، چارچوب
همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` تمام کند. اگر
سرور برنامه پس از آن پاسخ به‌مدت ۶۰ ثانیه ساکت بماند، OpenClaw به‌صورت بهترین تلاش
نوبت Codex را قطع می‌کند، یک پایان زمان تشخیصی ثبت می‌کند و مسیر نشست
OpenClaw را آزاد می‌کند تا پیام‌های گفت‌وگوی بعدی پشت یک نوبت بومی مانده
در صف قرار نگیرند.

بازنویسی‌های محیطی همچنان برای آزمایش محلی در دسترس‌اند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم‌نشده باشد، `OPENCLAW_CODEX_APP_SERVER_BIN` باینری مدیریت‌شده را
دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای
آزمایش محلی یک‌باره از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. پیکربندی
برای استقرارهای تکرارپذیر ترجیح داده می‌شود، زیرا رفتار Plugin را در همان
فایل بازبینی‌شده‌ای نگه می‌دارد که بقیه راه‌اندازی چارچوب Codex در آن قرار دارد.

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی خودش پوشش داده شده است:
[استفاده از رایانه با Codex](/fa/plugins/codex-computer-use).

نسخه کوتاه: OpenClaw برنامه کنترل دسکتاپ را همراه خود عرضه نمی‌کند و
خودش اقدامات دسکتاپ را اجرا نمی‌کند. سرور برنامه Codex را آماده می‌کند، تأیید می‌کند که
سرور MCP متعلق به `computer-use` در دسترس است، و سپس به Codex اجازه می‌دهد
در طول نوبت‌های حالت Codex فراخوانی‌های ابزار MCP بومی را مدیریت کند.

برای دسترسی مستقیم به درایور TryCua خارج از جریان بازار Codex،
`cua-driver mcp` را با `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ثبت کنید.
برای تفاوت بین استفاده از رایانه متعلق به Codex و ثبت مستقیم MCP، به
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

استفاده از رایانه ویژه macOS است و ممکن است پیش از آنکه
سرور MCP متعلق به Codex بتواند برنامه‌ها را کنترل کند، به مجوزهای محلی سیستم‌عامل نیاز داشته باشد. اگر `computerUse.enabled` برابر true باشد و سرور MCP
در دسترس نباشد، نوبت‌های حالت Codex پیش از شروع رشته شکست می‌خورند، به‌جای آنکه
بی‌صدا بدون ابزارهای بومی استفاده از رایانه اجرا شوند. برای گزینه‌های بازار،
محدودیت‌های کاتالوگ راه‌دور، دلیل‌های وضعیت و عیب‌یابی به
[استفاده از رایانه با Codex](/fa/plugins/codex-computer-use) مراجعه کنید.

وقتی `computerUse.autoInstall` برابر true باشد، اگر Codex
هنوز یک بازار محلی را کشف نکرده باشد، OpenClaw می‌تواند بازار استاندارد
همراه Codex Desktop را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند. پس از
تغییر پیکربندی زمان اجرا یا استفاده از رایانه، از `/new` یا `/reset` استفاده کنید تا
نشست‌های موجود یک اتصال قدیمی PI یا رشته Codex را نگه ندارند.

## دستورالعمل‌های رایج

Codex محلی با انتقال پیش‌فرض stdio:

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

اعتبارسنجی چارچوب فقط Codex:

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

تأییدهای Codex بازبینی‌شده توسط نگهبان:

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

سرور برنامه راه‌دور با سرآیندهای صریح:

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

تغییر مدل همچنان تحت کنترل OpenClaw می‌ماند. وقتی یک نشست OpenClaw
به یک رشته موجود Codex متصل است، نوبت بعدی مدل OpenAI، ارائه‌دهنده،
سیاست تأیید، sandbox و سطح سرویس انتخاب‌شده فعلی را دوباره به
سرور برنامه ارسال می‌کند. تغییر از `openai/gpt-5.5` به `openai/gpt-5.2` اتصال
رشته را نگه می‌دارد، اما از Codex می‌خواهد با مدل تازه انتخاب‌شده ادامه دهد.

## فرمان Codex

Plugin همراه، `/codex` را به‌عنوان یک فرمان اسلش مجاز ثبت می‌کند. این فرمان
عمومی است و روی هر کانالی که از فرمان‌های متنی OpenClaw پشتیبانی کند کار می‌کند.

شکل‌های رایج:

- `/codex status` اتصال زنده سرور برنامه، مدل‌ها، حساب، محدودیت‌های نرخ، سرورهای MCP و skills را نشان می‌دهد.
- `/codex models` مدل‌های زنده سرور برنامه Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر Codex را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک رشته موجود Codex متصل می‌کند.
- `/codex compact` از سرور برنامه Codex می‌خواهد رشته متصل را compact کند.
- `/codex review` بازبینی بومی Codex را برای رشته متصل شروع می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد تشخیصی Codex برای رشته متصل سؤال می‌کند.
- `/codex computer-use status` Plugin پیکربندی‌شده استفاده از رایانه و سرور MCP را بررسی می‌کند.
- `/codex computer-use install` Plugin پیکربندی‌شده استفاده از رایانه را نصب می‌کند و سرورهای MCP را دوباره بارگذاری می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP سرور برنامه Codex را فهرست می‌کند.
- `/codex skills` skills سرور برنامه Codex را فهرست می‌کند.

### گردش کار رایج عیب‌یابی

وقتی یک عامل متکی بر Codex در Telegram، Discord، Slack
یا کانالی دیگر کاری غیرمنتظره انجام می‌دهد، از گفت‌وگویی شروع کنید که مشکل در آن رخ داده است:

1. ‎`/diagnostics bad tool choice after image upload` یا یادداشت کوتاه دیگری را اجرا کنید
   که آنچه دیده‌اید را توصیف کند.
2. درخواست diagnostics را یک بار تأیید کنید. این تأیید، فایل zip diagnostics محلی Gateway
   را می‌سازد و چون نشست از harness مربوط به Codex استفاده می‌کند، بسته بازخورد مرتبط Codex را نیز
   به سرورهای OpenAI می‌فرستد.
3. پاسخ تکمیل‌شده diagnostics را در گزارش باگ یا رشته پشتیبانی کپی کنید.
   این پاسخ شامل مسیر بسته محلی، خلاصه حریم خصوصی، شناسه‌های نشست OpenClaw،
   شناسه‌های رشته Codex، و یک خط `Inspect locally` برای هر رشته Codex است.
4. اگر می‌خواهید خودتان اجرای انجام‌شده را اشکال‌زدایی کنید، دستور چاپ‌شده `Inspect locally`
   را در ترمینال اجرا کنید. این دستور شبیه `codex resume <thread-id>` است و رشته
   بومی Codex را باز می‌کند تا بتوانید مکالمه را بررسی کنید، آن را به‌صورت محلی ادامه دهید،
   یا از Codex بپرسید چرا ابزار یا برنامه خاصی را انتخاب کرده است.

فقط زمانی از `/codex diagnostics [note]` استفاده کنید که مشخصاً می‌خواهید بازخورد Codex
برای رشته متصل فعلی، بدون بسته کامل diagnostics مربوط به Gateway در OpenClaw، بارگذاری شود.
برای بیشتر گزارش‌های پشتیبانی، `/diagnostics [note]` نقطه شروع بهتری است، چون وضعیت محلی Gateway
و شناسه‌های رشته Codex را در یک پاسخ به هم پیوند می‌دهد. برای مدل کامل حریم خصوصی و رفتار گفت‌وگوی گروهی،
[صادرات diagnostics](/fa/gateway/diagnostics) را ببینید.

هسته OpenClaw همچنین `/diagnostics [note]` فقط مخصوص مالک را به‌عنوان فرمان عمومی diagnostics
برای Gateway ارائه می‌کند. اعلان تأیید آن مقدمه داده‌های حساس را نشان می‌دهد، به
[صادرات Diagnostics](/fa/gateway/diagnostics) پیوند می‌دهد، و هر بار
`openclaw gateway diagnostics export --json` را از طریق تأیید صریح exec درخواست می‌کند.
diagnostics را با یک قانون allow-all تأیید نکنید. پس از تأیید،
OpenClaw گزارشی قابل چسباندن با مسیر بسته محلی و خلاصه manifest می‌فرستد.
وقتی نشست فعال OpenClaw از harness مربوط به Codex استفاده می‌کند، همان تأیید
همچنین ارسال بسته‌های بازخورد مرتبط Codex به سرورهای OpenAI را مجاز می‌کند.
اعلان تأیید می‌گوید که بازخورد Codex ارسال خواهد شد، اما پیش از تأیید
شناسه‌های نشست یا رشته Codex را فهرست نمی‌کند.

اگر `/diagnostics` توسط مالک در یک گفت‌وگوی گروهی فراخوانی شود، OpenClaw کانال
مشترک را تمیز نگه می‌دارد: گروه فقط یک اعلان کوتاه دریافت می‌کند، درحالی‌که
مقدمه diagnostics، اعلان‌های تأیید، و شناسه‌های نشست/رشته Codex از طریق مسیر تأیید خصوصی
برای مالک ارسال می‌شوند. اگر مسیر خصوصی مالک وجود نداشته باشد،
OpenClaw درخواست گروهی را رد می‌کند و از مالک می‌خواهد آن را از یک پیام مستقیم اجرا کند.

بارگذاری تأییدشده Codex، app-server مربوط به Codex با مسیر `feedback/upload` را فراخوانی می‌کند و از
app-server می‌خواهد در صورت امکان، logهای هر رشته فهرست‌شده و زیررشته‌های Codex ایجادشده را نیز
در بر بگیرد. بارگذاری از مسیر معمول بازخورد Codex به سرورهای OpenAI انجام می‌شود؛ اگر بازخورد Codex
در آن app-server غیرفعال باشد، فرمان خطای app-server را برمی‌گرداند. پاسخ تکمیل‌شده diagnostics
کانال‌ها، شناسه‌های نشست OpenClaw، شناسه‌های رشته Codex، و فرمان‌های محلی
`codex resume <thread-id>` را برای رشته‌هایی که ارسال شده‌اند فهرست می‌کند. اگر تأیید را رد یا نادیده بگیرید،
OpenClaw آن شناسه‌های Codex را چاپ نمی‌کند. این بارگذاری جایگزین صادرات محلی diagnostics مربوط به
Gateway نمی‌شود.

`/codex resume` همان فایل binding جانبی را می‌نویسد که harness برای نوبت‌های عادی استفاده می‌کند.
در پیام بعدی، OpenClaw همان رشته Codex را از سر می‌گیرد، مدل OpenClaw انتخاب‌شده فعلی را به
app-server می‌فرستد، و تاریخچه گسترده را فعال نگه می‌دارد.

### بررسی یک رشته Codex از CLI

سریع‌ترین راه برای فهمیدن یک اجرای بد Codex اغلب این است که رشته بومی Codex را
مستقیماً باز کنید:

```sh
codex resume <thread-id>
```

وقتی در یک مکالمه کانالی متوجه باگی می‌شوید و می‌خواهید نشست مشکل‌دار Codex را بررسی کنید،
آن را به‌صورت محلی ادامه دهید، یا از Codex بپرسید چرا یک انتخاب خاص در ابزار یا استدلال انجام داده است،
از این استفاده کنید. ساده‌ترین مسیر معمولاً این است که ابتدا
`/diagnostics [note]` را اجرا کنید: پس از تأیید، گزارش تکمیل‌شده
هر رشته Codex را فهرست می‌کند و یک فرمان `Inspect locally` چاپ می‌کند، برای مثال
`codex resume <thread-id>`. می‌توانید آن فرمان را مستقیماً در ترمینال کپی کنید.

همچنین می‌توانید شناسه رشته را از `/codex binding` برای گفت‌وگوی فعلی یا
`/codex threads [filter]` برای رشته‌های اخیر app-server مربوط به Codex بگیرید، سپس همان فرمان
`codex resume` را در shell خود اجرا کنید.

سطح فرمان به app-server مربوط به Codex نسخه `0.125.0` یا جدیدتر نیاز دارد. اگر یک
app-server آینده یا سفارشی آن متد JSON-RPC را ارائه نکند، متدهای کنترلی جداگانه با پیام
`unsupported by this Codex app-server` گزارش می‌شوند.

## مرزهای hook

harness مربوط به Codex سه لایه hook دارد:

| لایه                                  | مالک                     | هدف                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| hookهای Plugin در OpenClaw            | OpenClaw                 | سازگاری محصول/Plugin میان harnessهای PI و Codex.                   |
| میان‌افزار افزونه app-server Codex    | Pluginهای همراه OpenClaw | رفتار adapter در هر نوبت پیرامون ابزارهای پویای OpenClaw.          |
| hookهای بومی Codex                    | Codex                    | چرخه‌عمر سطح پایین Codex و سیاست ابزار بومی از پیکربندی Codex.     |

OpenClaw از فایل‌های پروژه‌ای یا سراسری Codex با نام `hooks.json` برای مسیریابی
رفتار Plugin در OpenClaw استفاده نمی‌کند. برای پل پشتیبانی‌شده ابزار بومی و مجوز،
OpenClaw پیکربندی Codex مختص هر رشته را برای `PreToolUse`، `PostToolUse`،
`PermissionRequest`، و `Stop` تزریق می‌کند. سایر hookهای Codex مانند `SessionStart` و
`UserPromptSubmit` کنترل‌های سطح Codex باقی می‌مانند؛ آن‌ها در قرارداد v1 به‌عنوان
hookهای Plugin در OpenClaw ارائه نمی‌شوند.

برای ابزارهای پویای OpenClaw، پس از اینکه Codex درخواست فراخوانی را مطرح می‌کند، OpenClaw ابزار را اجرا می‌کند؛
بنابراین OpenClaw رفتار Plugin و میان‌افزاری را که مالک آن است در adapter مربوط به harness اجرا می‌کند.
برای ابزارهای بومی Codex، Codex مالک رکورد canonical ابزار است.
OpenClaw می‌تواند رویدادهای منتخب را mirror کند، اما نمی‌تواند رشته بومی Codex را بازنویسی کند
مگر اینکه Codex آن عملیات را از طریق app-server یا callbackهای hook بومی ارائه کند.

پروجکشن‌های Compaction و چرخه‌عمر LLM از اعلان‌های app-server مربوط به Codex
و وضعیت adapter در OpenClaw می‌آیند، نه از فرمان‌های hook بومی Codex.
رویدادهای `before_compaction`، `after_compaction`، `llm_input`، و
`llm_output` در OpenClaw مشاهده‌های سطح adapter هستند، نه ضبط‌های بایت‌به‌بایت
از درخواست داخلی یا payloadهای Compaction در Codex.

اعلان‌های app-server مربوط به hook بومی Codex با نام‌های `hook/started` و `hook/completed`
به‌عنوان رویدادهای agent از نوع `codex_app_server.hook` برای trajectory و اشکال‌زدایی
پروجکت می‌شوند. آن‌ها hookهای Plugin در OpenClaw را فراخوانی نمی‌کنند.

## قرارداد پشتیبانی V1

حالت Codex همان PI با یک فراخوانی مدل متفاوت در زیر آن نیست. Codex بخش بیشتری از
حلقه مدل بومی را مالک است، و OpenClaw سطح‌های Plugin و نشست خود را
پیرامون آن مرز تطبیق می‌دهد.

پشتیبانی‌شده در runtime نسخه v1 برای Codex:

| سطح                                          | پشتیبانی                                | دلیل                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حلقه مدل OpenAI از طریق Codex                 | پشتیبانی‌شده                            | app-server مربوط به Codex نوبت OpenAI، ازسرگیری رشته بومی، و ادامه ابزار بومی را مالک است.                                                                                                         |
| مسیریابی و تحویل کانال OpenClaw               | پشتیبانی‌شده                            | Telegram، Discord، Slack، WhatsApp، iMessage، و کانال‌های دیگر بیرون از runtime مدل باقی می‌مانند.                                                                                                  |
| ابزارهای پویای OpenClaw                       | پشتیبانی‌شده                            | Codex از OpenClaw می‌خواهد این ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.                                                                                                  |
| Pluginهای prompt و context                    | پشتیبانی‌شده                            | OpenClaw overlayهای prompt را می‌سازد و پیش از شروع یا ازسرگیری رشته، context را به نوبت Codex پروجکت می‌کند.                                                                                       |
| چرخه‌عمر موتور context                        | پشتیبانی‌شده                            | assemble، ingest یا نگهداشت پس از نوبت، و هماهنگی Compaction موتور context برای نوبت‌های Codex اجرا می‌شوند.                                                                                       |
| hookهای ابزار پویا                            | پشتیبانی‌شده                            | `before_tool_call`، `after_tool_call`، و میان‌افزار نتیجه ابزار پیرامون ابزارهای پویای تحت مالکیت OpenClaw اجرا می‌شوند.                                                                           |
| hookهای چرخه‌عمر                              | به‌عنوان مشاهده‌های adapter پشتیبانی‌شده | `llm_input`، `llm_output`، `agent_end`، `before_compaction`، و `after_compaction` با payloadهای صادقانه حالت Codex اجرا می‌شوند.                                                                    |
| gate بازبینی پاسخ نهایی                       | از طریق relay hook بومی پشتیبانی‌شده    | `Stop` در Codex به `before_agent_finalize` relay می‌شود؛ `revise` از Codex می‌خواهد پیش از نهایی‌سازی، یک گذر مدل دیگر انجام دهد.                                                                  |
| block یا observe برای shell، patch، و MCP بومی | از طریق relay hook بومی پشتیبانی‌شده    | `PreToolUse` و `PostToolUse` در Codex برای سطح‌های ابزار بومی commit‌شده relay می‌شوند، از جمله payloadهای MCP روی app-server مربوط به Codex نسخه `0.125.0` یا جدیدتر. مسدودسازی پشتیبانی می‌شود؛ بازنویسی آرگومان پشتیبانی نمی‌شود. |
| سیاست مجوز بومی                               | از طریق relay hook بومی پشتیبانی‌شده    | `PermissionRequest` در Codex می‌تواند در جایی که runtime آن را ارائه می‌کند، از طریق سیاست OpenClaw مسیریابی شود. اگر OpenClaw تصمیمی برنگرداند، Codex از مسیر guardian یا تأیید کاربر معمول خود ادامه می‌دهد. |
| ضبط trajectory از app-server                  | پشتیبانی‌شده                            | OpenClaw درخواستی را که به app-server فرستاده و اعلان‌های app-server را که دریافت می‌کند ثبت می‌کند.                                                                                               |

پشتیبانی‌نشده در runtime نسخه v1 برای Codex:

| سطح                                                 | مرز V1                                                                                                                                             | مسیر آینده                                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| تغییر آرگومان ابزار بومی Native Codex               | هوک‌های بومی پیش‌ابزار Codex می‌توانند مسدود کنند، اما OpenClaw آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند.                               | به پشتیبانی هوک/شمای Codex برای ورودی ابزار جایگزین نیاز دارد.                           |
| تاریخچه رونوشت بومی Codex قابل ویرایش               | Codex مالک تاریخچه بومی و مرجع thread است. OpenClaw مالک یک آینه است و می‌تواند زمینه آینده را تصویر کند، اما نباید داخلی‌های پشتیبانی‌نشده را تغییر دهد. | اگر جراحی thread بومی لازم باشد، APIهای صریح app-server Codex اضافه شود.                 |
| `tool_result_persist` برای رکوردهای ابزار بومی Codex | آن هوک نوشتن‌های رونوشت متعلق به OpenClaw را تبدیل می‌کند، نه رکوردهای ابزار بومی Codex را.                                                       | می‌تواند رکوردهای تبدیل‌شده را آینه کند، اما بازنویسی مرجع به پشتیبانی Codex نیاز دارد. |
| فراداده غنی Compaction بومی                         | OpenClaw شروع و پایان Compaction را مشاهده می‌کند، اما فهرست پایدار موارد نگه‌داشته‌شده/حذف‌شده، تغییر توکن، یا payload خلاصه دریافت نمی‌کند.   | به رویدادهای غنی‌تر Compaction در Codex نیاز دارد.                                       |
| مداخله Compaction                                   | هوک‌های فعلی Compaction در OpenClaw در حالت Codex در سطح اعلان هستند.                                                                            | اگر plugins نیاز به وتو یا بازنویسی Compaction بومی دارند، هوک‌های پیش/پس Compaction در Codex اضافه شود. |
| ضبط درخواست model API به‌صورت بایت‌به‌بایت          | OpenClaw می‌تواند درخواست‌ها و اعلان‌های app-server را ضبط کند، اما هسته Codex درخواست نهایی OpenAI API را به‌صورت داخلی می‌سازد.               | به رویداد ردیابی درخواست مدل در Codex یا API اشکال‌زدایی نیاز دارد.                    |

## ابزارها، رسانه، و Compaction

هارنس Codex فقط اجراکننده عامل تعبیه‌شده سطح پایین را تغییر می‌دهد.

OpenClaw همچنان فهرست ابزارها را می‌سازد و نتایج ابزار پویا را از
هارنس دریافت می‌کند. متن، تصاویر، ویدئو، موسیقی، TTS، تأییدها، و خروجی ابزار پیام‌رسانی
همچنان از مسیر تحویل عادی OpenClaw عبور می‌کنند.

رله هوک بومی عمداً عمومی است، اما قرارداد پشتیبانی v1
به مسیرهای ابزار و مجوز بومی Codex که OpenClaw آزمایش می‌کند محدود است. در
runtime Codex، این شامل payloadهای shell، patch، و MCP `PreToolUse`،
`PostToolUse`، و `PermissionRequest` می‌شود. فرض نکنید هر رویداد هوک آینده
Codex یک سطح Plugin در OpenClaw است، مگر اینکه قرارداد runtime آن را نام ببرد.

برای `PermissionRequest`، OpenClaw فقط وقتی سیاست تصمیم بگیرد، تصمیم‌های صریح اجازه یا رد
برمی‌گرداند. نتیجه بدون تصمیم به معنای اجازه نیست. Codex آن را به‌عنوان نبود
تصمیم هوک تلقی می‌کند و به مسیر guardian خودش یا تأیید کاربر ادامه می‌دهد.

درخواست‌های تأیید ابزار MCP در Codex از طریق جریان تأیید Plugin
در OpenClaw مسیریابی می‌شوند، وقتی Codex مقدار `_meta.codex_approval_kind` را
`"mcp_tool_call"` قرار دهد. Promptهای `request_user_input` در Codex به گفت‌وگوی
مبدأ فرستاده می‌شوند، و پیام follow-up بعدی در صف، به‌جای هدایت شدن به‌عنوان زمینه اضافی،
به آن درخواست server بومی پاسخ می‌دهد. سایر درخواست‌های elicitation در MCP
همچنان به‌صورت بسته شکست می‌خورند.

هدایت صف اجرای فعال به `turn/steer` در app-server Codex نگاشت می‌شود. با
پیش‌فرض `messages.queue.mode: "steer"`، OpenClaw پیام‌های گفت‌وگوی صف‌شده را
برای پنجره سکوت پیکربندی‌شده دسته‌بندی می‌کند و آن‌ها را به ترتیب ورود به‌عنوان یک درخواست
`turn/steer` می‌فرستد. حالت قدیمی `queue` درخواست‌های جداگانه `turn/steer` می‌فرستد. نوبت‌های
بازبینی Codex و Compaction دستی می‌توانند هدایت در همان نوبت را رد کنند، که در این حالت
OpenClaw وقتی حالت انتخاب‌شده اجازه fallback بدهد از صف followup استفاده می‌کند. ببینید
[صف هدایت](/fa/concepts/queue-steering).

وقتی مدل انتخاب‌شده از هارنس Codex استفاده می‌کند، Compaction thread بومی به
app-server Codex واگذار می‌شود. OpenClaw یک آینه رونوشت برای تاریخچه کانال،
جست‌وجو، `/new`، `/reset`، و تغییر مدل یا هارنس در آینده نگه می‌دارد. این
آینه شامل prompt کاربر، متن نهایی assistant، و رکوردهای سبک‌وزن reasoning یا plan در Codex
است، وقتی app-server آن‌ها را منتشر کند. امروز، OpenClaw فقط سیگنال‌های شروع و پایان
Compaction بومی را ثبت می‌کند. هنوز خلاصه Compaction قابل خواندن برای انسان یا فهرست قابل حسابرسی
از اینکه Codex کدام ورودی‌ها را پس از Compaction نگه داشته است ارائه نمی‌کند.

از آنجا که Codex مالک thread بومی مرجع است، `tool_result_persist` در حال حاضر
رکوردهای نتیجه ابزار بومی Codex را بازنویسی نمی‌کند. این فقط وقتی اعمال می‌شود
که OpenClaw در حال نوشتن نتیجه ابزار در رونوشت نشست متعلق به OpenClaw باشد.

تولید رسانه به PI نیاز ندارد. تصویر، ویدئو، موسیقی، PDF، TTS، و درک رسانه
همچنان از تنظیمات provider/model متناظر مانند
`agents.defaults.imageGenerationModel`، `videoGenerationModel`، `pdfModel`، و
`messages.tts` استفاده می‌کنند.

## عیب‌یابی

**Codex به‌عنوان یک provider عادی `/model` ظاهر نمی‌شود:** این برای
پیکربندی‌های جدید مورد انتظار است. یک مدل `openai/gpt-*` با
`agentRuntime.id: "codex"` (یا یک ref قدیمی `codex/*`) انتخاب کنید، 
`plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید آیا `plugins.allow`
مقدار `codex` را مستثنی می‌کند یا نه.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** `agentRuntime.id: "auto"` همچنان می‌تواند از PI به‌عنوان
backend سازگاری استفاده کند وقتی هیچ هارنس Codex اجرای موردنظر را ادعا نکند. برای اجبار انتخاب Codex
هنگام آزمایش، `agentRuntime.id: "codex"` را تنظیم کنید. یک runtime اجباری Codex
به‌جای fallback به PI شکست می‌خورد. پس از انتخاب app-server Codex،
خرابی‌های آن مستقیماً نمایان می‌شوند.

**app-server رد می‌شود:** Codex را ارتقا دهید تا handshake app-server
نسخه `0.125.0` یا جدیدتر را گزارش کند. Prereleaseهای هم‌نسخه یا نسخه‌های دارای پسوند build
مانند `0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون
کف پروتکل پایدار `0.125.0` چیزی است که OpenClaw آزمایش می‌کند.

**کشف مدل کند است:** مقدار `plugins.entries.codex.config.discovery.timeoutMs`
را کاهش دهید یا کشف را غیرفعال کنید.

**انتقال WebSocket فوراً شکست می‌خورد:** `appServer.url`، `authToken`،
و اینکه app-server راه‌دور همان نسخه پروتکل app-server Codex را صحبت می‌کند بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این مورد انتظار است مگر اینکه برای آن agent
`agentRuntime.id: "codex"` را اجباری کرده باشید یا یک ref قدیمی
`codex/*` انتخاب کرده باشید. refهای ساده `openai/gpt-*` و سایر providerها در حالت
`auto` روی مسیر provider عادی خودشان می‌مانند. اگر `agentRuntime.id: "codex"` را اجباری کنید، هر نوبت تعبیه‌شده
برای آن agent باید یک مدل OpenAI پشتیبانی‌شده توسط Codex باشد.

**Computer Use نصب است اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه
`/codex computer-use status` را بررسی کنید. اگر ابزاری
`Native hook relay unavailable` گزارش کرد، از `/new` یا `/reset` استفاده کنید؛ اگر ادامه داشت، Gateway را
restart کنید تا ثبت‌های کهنه هوک بومی پاک شوند. اگر `computer-use.list_apps`
timeout شد، Codex Computer Use یا Codex Desktop را restart کنید و دوباره تلاش کنید.

## مرتبط

- [Plugins هارنس Agent](/fa/plugins/sdk-agent-harness)
- [Runtimeهای Agent](/fa/concepts/agent-runtimes)
- [Providerهای مدل](/fa/concepts/model-providers)
- [Provider OpenAI](/fa/providers/openai)
- [وضعیت](/fa/cli/status)
- [هوک‌های Plugin](/fa/plugins/hooks)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [آزمایش](/fa/help/testing-live#live-codex-app-server-harness-smoke)

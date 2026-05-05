---
read_when:
    - می‌خواهید از چارچوب آزمایشی app-server همراه Codex استفاده کنید
    - به نمونه‌های پیکربندی هارنس Codex نیاز دارید
    - می‌خواهید استقرارهای فقط Codex به‌جای بازگشت به PI شکست بخورند
summary: نوبت‌های عامل تعبیه‌شدهٔ OpenClaw را از طریق چارچوب اجرایی app-server همراه Codex اجرا کنید
title: هارنس Codex
x-i18n:
    generated_at: "2026-05-05T01:49:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin همراه `codex` به OpenClaw اجازه می‌دهد نوبت‌های عاملِ تعبیه‌شده را از طریق
سرور برنامه‌ی Codex به‌جای سازوکار داخلی PI اجرا کند.

وقتی می‌خواهید Codex مالک نشست سطح‌پایین عامل باشد، از این استفاده کنید: کشف
مدل، ازسرگیری بومی رشته، Compaction بومی، و اجرای سرور برنامه. OpenClaw همچنان
مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل، ابزارها، تأییدها، تحویل رسانه، و
آینه‌ی قابل‌مشاهده‌ی رونوشت است.

وقتی یک نوبت چت مبدأ از طریق سازوکار Codex اجرا می‌شود، اگر استقرار به‌صراحت
`messages.visibleReplies` را پیکربندی نکرده باشد، پاسخ‌های قابل‌مشاهده به‌طور
پیش‌فرض از ابزار `message` در OpenClaw استفاده می‌کنند. عامل همچنان می‌تواند
نوبت Codex خود را به‌صورت خصوصی تمام کند؛ فقط زمانی در کانال پست می‌کند که
`message(action="send")` را فراخوانی کند. برای نگه‌داشتن پاسخ‌های نهایی چت
مستقیم روی مسیر تحویل خودکار قدیمی، `messages.visibleReplies: "automatic"` را
تنظیم کنید.

نوبت‌های Heartbeat در Codex نیز به‌طور پیش‌فرض ابزار `heartbeat_respond` را
دریافت می‌کنند، تا عامل بتواند ثبت کند که بیدارباش باید بی‌صدا بماند یا بدون
کدگذاری آن جریان کنترل در متن نهایی، اعلان بدهد.

راهنمای ابتکار مخصوص Heartbeat به‌عنوان یک دستور توسعه‌دهنده‌ی حالت همکاری
Codex روی خود نوبت Heartbeat ارسال می‌شود. نوبت‌های عادی چت به‌جای حمل فلسفه‌ی
Heartbeat در پرامپت زمان‌اجرای معمول خود، حالت پیش‌فرض Codex را بازیابی می‌کنند.

اگر می‌خواهید جهت بگیرید، با
[زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) شروع کنید. نسخه‌ی کوتاه این
است: `openai/gpt-5.5` ارجاع مدل است، `codex` زمان‌اجرا است، و Telegram،
Discord، Slack، یا کانالی دیگر سطح ارتباطی باقی می‌ماند.

## پیکربندی سریع

بیشتر کاربرانی که «Codex در OpenClaw» می‌خواهند این مسیر را می‌خواهند: با یک
اشتراک ChatGPT/Codex وارد شوید، سپس نوبت‌های عامل تعبیه‌شده را از طریق
زمان‌اجرای بومی سرور برنامه‌ی Codex اجرا کنید. ارجاع مدل همچنان به‌شکل
استاندارد `openai/gpt-*` می‌ماند؛ احراز هویت اشتراک از حساب/نمایه‌ی Codex
می‌آید، نه از پیشوند مدل `openai-codex/*`.

اگر هنوز این کار را نکرده‌اید، ابتدا با OAuth در Codex وارد شوید:

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

اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `codex` را آنجا هم قرار دهید:

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

وقتی منظورتان زمان‌اجرای بومی Codex است، از `openai-codex/gpt-*` استفاده نکنید.
آن پیشوند مسیر صریح «OAuth کدکس از طریق PI» است. تغییرات پیکربندی روی نشست‌های
جدید یا بازنشانی‌شده اعمال می‌شوند؛ نشست‌های موجود زمان‌اجرای ثبت‌شده‌ی خود را
نگه می‌دارند.

## این Plugin چه چیزی را تغییر می‌دهد

Plugin همراه `codex` چند قابلیت جداگانه فراهم می‌کند:

| قابلیت                            | نحوه‌ی استفاده                                      | کاری که انجام می‌دهد                                                           |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| زمان‌اجرای تعبیه‌شده‌ی بومی       | `agentRuntime.id: "codex"`                          | نوبت‌های عامل تعبیه‌شده‌ی OpenClaw را از طریق سرور برنامه‌ی Codex اجرا می‌کند. |
| فرمان‌های بومی کنترل چت           | `/codex bind`, `/codex resume`, `/codex steer`, ... | رشته‌های سرور برنامه‌ی Codex را از یک گفت‌وگوی پیام‌رسانی متصل و کنترل می‌کند. |
| ارائه‌دهنده/کاتالوگ سرور برنامه‌ی Codex | داخلی‌های `codex`، ارائه‌شده از طریق سازوکار        | به زمان‌اجرا اجازه می‌دهد مدل‌های سرور برنامه را کشف و اعتبارسنجی کند.        |
| مسیر درک رسانه‌ی Codex            | مسیرهای سازگاری مدل تصویر `codex/*`                 | نوبت‌های محدود سرور برنامه‌ی Codex را برای مدل‌های پشتیبانی‌شده‌ی درک تصویر اجرا می‌کند. |
| رله‌ی Hook بومی                   | Hookهای Plugin پیرامون رویدادهای بومی Codex         | به OpenClaw اجازه می‌دهد رویدادهای ابزار/نهایی‌سازی بومی Codex را مشاهده/مسدود کند. |

فعال‌کردن Plugin این قابلیت‌ها را در دسترس قرار می‌دهد. این کار **موارد زیر را انجام نمی‌دهد**:

- شروع به استفاده از Codex برای هر مدل OpenAI
- تبدیل ارجاع‌های مدل `openai-codex/*` به زمان‌اجرای بومی
- پیش‌فرض‌کردن مسیر Codex به ACP/acpx
- جابه‌جایی داغ نشست‌های موجودی که قبلاً زمان‌اجرای PI ثبت کرده‌اند
- جایگزین‌کردن تحویل کانال OpenClaw، فایل‌های نشست، ذخیره‌سازی نمایه‌ی احراز هویت، یا
  مسیریابی پیام

همین Plugin همچنین مالک سطح فرمان کنترل چت بومی `/codex` است. اگر Plugin فعال
باشد و کاربر بخواهد رشته‌های Codex را از چت متصل، ازسرگیری، هدایت، متوقف، یا
بازرسی کند، عامل‌ها باید `/codex ...` را بر ACP ترجیح دهند. ACP زمانی پشتیبان
صریح باقی می‌ماند که کاربر ACP/acpx را درخواست کند یا در حال آزمایش آداپتور
Codex برای ACP باشد.

نوبت‌های بومی Codex، Hookهای Plugin در OpenClaw را به‌عنوان لایه‌ی سازگاری
عمومی نگه می‌دارند. این‌ها Hookهای درون‌فرایندی OpenClaw هستند، نه Hookهای
فرمانی `hooks.json` در Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` برای رکوردهای رونوشت آینه‌شده
- `before_agent_finalize` از طریق رله‌ی `Stop` در Codex
- `agent_end`

Pluginها همچنین می‌توانند میان‌افزار نتیجه‌ی ابزارِ مستقل از زمان‌اجرا ثبت کنند
تا نتایج ابزار پویای OpenClaw را پس از اجرای ابزار توسط OpenClaw و پیش از
برگرداندن نتیجه به Codex بازنویسی کنند. این از Hook عمومی Plugin با نام
`tool_result_persist` جداست، که نوشتن‌های نتیجه‌ی ابزار در رونوشت‌های متعلق به
OpenClaw را تبدیل می‌کند.

برای خود معنای Hookهای Plugin، [Hookهای Plugin](/fa/plugins/hooks)
و [رفتار محافظ Plugin](/fa/tools/plugin) را ببینید.

این سازوکار به‌طور پیش‌فرض خاموش است. پیکربندی‌های جدید باید ارجاع‌های مدل
OpenAI را به‌شکل استاندارد `openai/gpt-*` نگه دارند و زمانی که اجرای بومی
سرور برنامه را می‌خواهند، به‌صراحت `agentRuntime.id: "codex"` یا
`OPENCLAW_AGENT_RUNTIME=codex` را اجباری کنند. ارجاع‌های مدل قدیمی `codex/*`
هنوز برای سازگاری سازوکار را به‌طور خودکار انتخاب می‌کنند، اما پیشوندهای
ارائه‌دهنده‌ی قدیمیِ متکی به زمان‌اجرا به‌عنوان گزینه‌های عادی مدل/ارائه‌دهنده
نمایش داده نمی‌شوند.

اگر Plugin با نام `codex` فعال باشد اما مدل اصلی همچنان `openai-codex/*` باشد،
`openclaw doctor` به‌جای تغییر مسیر هشدار می‌دهد. این عمدی است:
`openai-codex/*` همچنان مسیر OAuth/اشتراک Codex از طریق PI باقی می‌ماند، و
اجرای بومی سرور برنامه یک انتخاب صریح زمان‌اجرا می‌ماند.

## نقشه‌ی مسیر

پیش از تغییر پیکربندی از این جدول استفاده کنید:

| رفتار مطلوب                                          | ارجاع مدل                  | پیکربندی زمان‌اجرا                  | مسیر احراز هویت/نمایه       | برچسب وضعیت مورد انتظار       |
| ---------------------------------------------------- | -------------------------- | ----------------------------------- | ---------------------------- | ------------------------------ |
| اشتراک ChatGPT/Codex با زمان‌اجرای بومی Codex        | `openai/gpt-*`             | `agentRuntime.id: "codex"`          | OAuth در Codex یا حساب Codex | `Runtime: OpenAI Codex`        |
| API OpenAI از طریق اجراکننده‌ی معمول OpenClaw        | `openai/gpt-*`             | حذف‌شده یا `runtime: "pi"`          | کلید API OpenAI              | `Runtime: OpenClaw Pi Default` |
| اشتراک ChatGPT/Codex از طریق PI                      | `openai-codex/gpt-*`       | حذف‌شده یا `runtime: "pi"`          | ارائه‌دهنده‌ی OAuth کدکس در OpenAI | `Runtime: OpenClaw Pi Default` |
| ارائه‌دهندگان ترکیبی با حالت خودکار محافظه‌کارانه   | ارجاع‌های مخصوص ارائه‌دهنده | `agentRuntime.id: "auto"`           | برای هر ارائه‌دهنده‌ی انتخاب‌شده | وابسته به زمان‌اجرای انتخاب‌شده |
| نشست صریح آداپتور ACP برای Codex                     | وابسته به پرامپت/مدل ACP   | `sessions_spawn` با `runtime: "acp"` | احراز هویت بک‌اند ACP        | وضعیت وظیفه/نشست ACP          |

جداسازی مهم، ارائه‌دهنده در برابر زمان‌اجرا است:

- `openai-codex/*` پاسخ می‌دهد «PI باید از کدام مسیر ارائه‌دهنده/احراز هویت استفاده کند؟»
- `agentRuntime.id: "codex"` پاسخ می‌دهد «کدام حلقه باید این نوبت تعبیه‌شده را اجرا کند؟»
- `/codex ...` پاسخ می‌دهد «این چت باید به کدام گفت‌وگوی بومی Codex متصل شود یا آن را کنترل کند؟»
- ACP پاسخ می‌دهد «acpx باید کدام فرایند سازوکار بیرونی را اجرا کند؟»

## پیشوند مدل درست را انتخاب کنید

مسیرهای خانواده‌ی OpenAI به پیشوند وابسته‌اند. برای راه‌اندازی رایج اشتراک به‌علاوه‌ی
زمان‌اجرای بومی Codex، از `openai/*` با `agentRuntime.id: "codex"` استفاده کنید.
فقط زمانی از `openai-codex/*` استفاده کنید که عمداً OAuth در Codex از طریق PI
را می‌خواهید:

| ارجاع مدل                                     | مسیر زمان‌اجرا                              | زمان استفاده                                                               |
| --------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | ارائه‌دهنده‌ی OpenAI از طریق لوله‌کشی OpenClaw/PI | دسترسی مستقیم فعلی به API پلتفرم OpenAI با `OPENAI_API_KEY` را می‌خواهید. |
| `openai-codex/gpt-5.5`                        | OAuth کدکس در OpenAI از طریق OpenClaw/PI    | احراز هویت اشتراک ChatGPT/Codex با اجراکننده‌ی پیش‌فرض PI را می‌خواهید. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | سازوکار سرور برنامه‌ی Codex                 | احراز هویت اشتراک ChatGPT/Codex با اجرای بومی Codex را می‌خواهید.        |

GPT-5.5 زمانی که حساب شما آن‌ها را ارائه کند، می‌تواند هم روی مسیرهای مستقیم
کلید API در OpenAI و هم مسیرهای اشتراک Codex ظاهر شود. برای زمان‌اجرای بومی
Codex، از `openai/gpt-5.5` با سازوکار سرور برنامه‌ی Codex استفاده کنید؛ برای
OAuth از طریق PI از `openai-codex/gpt-5.5` استفاده کنید؛ یا برای ترافیک مستقیم
کلید API، از `openai/gpt-5.5` بدون بازنویسی زمان‌اجرای Codex استفاده کنید.

ارجاع‌های قدیمی `codex/gpt-*` همچنان به‌عنوان نام‌های مستعار سازگاری پذیرفته
می‌شوند. مهاجرت سازگاری Doctor، ارجاع‌های زمان‌اجرای اصلی قدیمی را به ارجاع‌های
مدل استاندارد بازنویسی می‌کند و سیاست زمان‌اجرا را جداگانه ثبت می‌کند، درحالی‌که
ارجاع‌های قدیمیِ فقط پشتیبان بدون تغییر می‌مانند، چون زمان‌اجرا برای کل محفظه‌ی
عامل پیکربندی می‌شود. پیکربندی‌های جدید OAuth کدکس از طریق PI باید از
`openai-codex/gpt-*` استفاده کنند؛ پیکربندی‌های جدید سازوکار بومی سرور برنامه
باید از `openai/gpt-*` به‌علاوه‌ی `agentRuntime.id: "codex"` استفاده کنند.

`agents.defaults.imageModel` از همین جداسازی پیشوند پیروی می‌کند. وقتی درک
تصویر باید از مسیر ارائه‌دهنده‌ی OAuth کدکس در OpenAI اجرا شود، از
`openai-codex/gpt-*` استفاده کنید. وقتی درک تصویر باید از طریق یک نوبت محدود
سرور برنامه‌ی Codex اجرا شود، از `codex/gpt-*` استفاده کنید. مدل سرور برنامه‌ی
Codex باید پشتیبانی ورودی تصویر را اعلام کند؛ مدل‌های Codex فقط‌متنی پیش از
شروع نوبت رسانه شکست می‌خورند.

برای تأیید سازوکار مؤثر نشست فعلی از `/status` استفاده کنید. اگر انتخاب
غیرمنتظره است، ثبت اشکال‌زدایی را برای زیرسامانه‌ی `agents/harness` فعال کنید
و رکورد ساختاریافته‌ی `agent harness selected` در Gateway را بررسی کنید. این
رکورد شامل شناسه‌ی سازوکار انتخاب‌شده، دلیل انتخاب، سیاست زمان‌اجرا/پشتیبان، و
در حالت `auto`، نتیجه‌ی پشتیبانی هر نامزد Plugin است.

### معنای هشدارهای Doctor چیست

`openclaw doctor` زمانی هشدار می‌دهد که همه‌ی موارد زیر درست باشند:

- Plugin همراه `codex` فعال یا مجاز باشد
- مدل اصلی یک عامل `openai-codex/*` باشد
- زمان‌اجرای مؤثر آن عامل `codex` نباشد

این هشدار وجود دارد چون کاربران اغلب انتظار دارند «Plugin کدکس فعال است» به
معنای «زمان‌اجرای بومی سرور برنامه‌ی Codex» باشد. OpenClaw چنین جهشی انجام
نمی‌دهد. معنای هشدار این است:

- اگر قصدتان OAuth در ChatGPT/Codex از طریق PI بوده است، **هیچ تغییری لازم نیست**.
- اگر قصدتان اجرای بومی سرور برنامه بوده است، مدل را به `openai/<model>` تغییر دهید و
  `agentRuntime.id: "codex"` را تنظیم کنید.
- نشست‌های موجود پس از تغییر زمان‌اجرا همچنان به `/new` یا `/reset` نیاز دارند،
  چون پین‌های زمان‌اجرای نشست چسبنده‌اند.

انتخاب سازوکار یک کنترل نشست زنده نیست. وقتی یک نوبت تعبیه‌شده اجرا می‌شود،
OpenClaw شناسه‌ی سازوکار انتخاب‌شده را روی آن نشست ثبت می‌کند و برای نوبت‌های
بعدی در همان شناسه‌ی نشست از آن استفاده می‌کند. وقتی می‌خواهید نشست‌های آینده
از سازوکار دیگری استفاده کنند، پیکربندی `agentRuntime` یا
`OPENCLAW_AGENT_RUNTIME` را تغییر دهید؛ پیش از جابه‌جایی یک گفت‌وگوی موجود بین
PI و Codex، از `/new` یا `/reset` برای شروع یک نشست تازه استفاده کنید. این کار
از بازپخش یک رونوشت از طریق دو سامانه‌ی نشست بومی ناسازگار جلوگیری می‌کند.

جلسه‌های قدیمی که پیش از pin شدن harness ایجاد شده‌اند، پس از داشتن تاریخچه transcript به‌عنوان PI-pinned در نظر گرفته می‌شوند. پس از تغییر پیکربندی، از `/new` یا `/reset` استفاده کنید تا آن گفت‌وگو به Codex وارد شود.

`/status` runtime مؤثر مدل را نشان می‌دهد. harness پیش‌فرض PI به‌صورت
`Runtime: OpenClaw Pi Default` نمایش داده می‌شود، و harness app-server مربوط به Codex به‌صورت
`Runtime: OpenAI Codex`.

## الزامات

- OpenClaw با Plugin همراه `codex` در دسترس.
- app-server مربوط به Codex نسخه `0.125.0` یا جدیدتر. Plugin همراه به‌طور پیش‌فرض یک باینری app-server سازگار برای Codex را مدیریت می‌کند، بنابراین فرمان‌های محلی `codex` روی `PATH` بر راه‌اندازی عادی harness اثر نمی‌گذارند.
- احراز هویت Codex برای فرایند app-server یا برای پل احراز هویت Codex در OpenClaw در دسترس باشد. راه‌اندازی‌های app-server محلی برای هر agent از یک خانه Codex مدیریت‌شده توسط OpenClaw و یک `HOME` فرزند ایزوله استفاده می‌کنند، بنابراین به‌طور پیش‌فرض حساب شخصی `~/.codex`، Skills، Pluginها، پیکربندی، وضعیت thread، یا `$HOME/.agents/skills` بومی شما را نمی‌خوانند.

Plugin handshakeهای app-server قدیمی‌تر یا بدون نسخه را مسدود می‌کند. این کار OpenClaw را روی سطح پروتکلی نگه می‌دارد که در برابر آن آزموده شده است.

برای آزمون‌های smoke زنده و Docker، احراز هویت معمولاً از حساب Codex CLI یا یک پروفایل احراز هویت `openai-codex` در OpenClaw می‌آید. راه‌اندازی‌های app-server محلی stdio همچنین می‌توانند وقتی هیچ حسابی وجود ندارد به `CODEX_API_KEY` / `OPENAI_API_KEY` برگردند.

## فایل‌های bootstrap فضای کاری

Codex خودش `AGENTS.md` را از طریق کشف بومی project-doc مدیریت می‌کند. OpenClaw فایل‌های project-doc ساختگی Codex نمی‌نویسد و برای فایل‌های persona به نام‌های fallback در Codex وابسته نیست، چون fallbackهای Codex فقط وقتی اعمال می‌شوند که
`AGENTS.md` وجود نداشته باشد.

برای هم‌ترازی فضای کاری OpenClaw، harness مربوط به Codex فایل‌های bootstrap دیگر (`SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`،
`BOOTSTRAP.md`، و `MEMORY.md` در صورت وجود) را resolve می‌کند و آن‌ها را از طریق دستورالعمل‌های پیکربندی Codex در `thread/start` و `thread/resume` ارسال می‌کند. این کار زمینه persona/profile فضای کاری مربوط به `SOUL.md` و فایل‌های مرتبط را بدون تکثیر `AGENTS.md` قابل مشاهده نگه می‌دارد.

## افزودن Codex در کنار مدل‌های دیگر

اگر همان agent باید آزادانه بین Codex و مدل‌های provider غیر Codex جابه‌جا شود، `agentRuntime.id: "codex"` را به‌صورت سراسری تنظیم نکنید. runtime اجباری برای هر turn嵌ه‌شده آن agent یا session اعمال می‌شود. اگر در حالی که آن runtime اجباری است یک مدل Anthropic انتخاب کنید، OpenClaw همچنان harness مربوط به Codex را امتحان می‌کند و به‌جای route کردن بی‌صدا از طریق PI، به‌شکل fail-closed شکست می‌خورد.

به‌جای آن از یکی از این شکل‌ها استفاده کنید:

- Codex را روی یک agent اختصاصی با `agentRuntime.id: "codex"` قرار دهید.
- agent پیش‌فرض را روی `agentRuntime.id: "auto"` و fallback مربوط به PI برای استفاده معمول mixed provider نگه دارید.
- از refهای قدیمی `codex/*` فقط برای سازگاری استفاده کنید. پیکربندی‌های جدید باید `openai/*` به‌همراه یک سیاست runtime صریح Codex را ترجیح دهند.

برای نمونه، این پیکربندی agent پیش‌فرض را روی انتخاب خودکار عادی نگه می‌دارد و یک agent جداگانه برای Codex اضافه می‌کند:

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

- agent پیش‌فرض `main` از مسیر عادی provider و fallback سازگاری PI استفاده می‌کند.
- agent مربوط به `codex` از harness app-server مربوط به Codex استفاده می‌کند.
- اگر Codex برای agent مربوط به `codex` وجود نداشته باشد یا پشتیبانی نشود، turn به‌جای استفاده بی‌سروصدا از PI شکست می‌خورد.

## مسیریابی فرمان‌های agent

agentها باید درخواست‌های کاربر را بر اساس intent مسیریابی کنند، نه فقط بر اساس واژه "Codex":

| کاربر درخواست می‌کند...                                 | agent باید استفاده کند از...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Bind this chat to Codex"                              | `/codex bind`                                    |
| "Resume Codex thread `<id>` here"                      | `/codex resume <id>`                             |
| "Show Codex threads"                                   | `/codex threads`                                 |
| "File a support report for a bad Codex run"            | `/diagnostics [note]`                            |
| "Only send Codex feedback for this attached thread"    | `/codex diagnostics [note]`                      |
| "Use my ChatGPT/Codex subscription with Codex runtime" | `openai/*` به‌همراه `agentRuntime.id: "codex"`   |
| "Use my ChatGPT/Codex subscription through PI"         | refهای مدل `openai-codex/*`                      |
| "Run Codex through ACP/acpx"                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Start Claude Code/Gemini/OpenCode/Cursor in a thread" | ACP/acpx، نه `/codex` و نه sub-agentهای بومی     |

OpenClaw فقط وقتی راهنمایی spawn مربوط به ACP را به agentها تبلیغ می‌کند که ACP فعال، dispatchable، و با یک runtime backend بارگذاری‌شده پشتیبانی شده باشد. اگر ACP در دسترس نباشد، system prompt و plugin skills نباید به agent درباره مسیریابی ACP آموزش دهند.

## استقرارهای فقط Codex

وقتی باید ثابت کنید که هر turn嵌ه‌شده agent از Codex استفاده می‌کند، harness مربوط به Codex را اجباری کنید. runtimeهای صریح Plugin به‌شکل fail-closed شکست می‌خورند و هرگز بی‌سروصدا از طریق PI دوباره امتحان نمی‌شوند:

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

با اجباری شدن Codex، اگر Plugin مربوط به Codex غیرفعال باشد، app-server بیش از حد قدیمی باشد، یا app-server نتواند شروع شود، OpenClaw زود شکست می‌خورد.

## Codex به‌ازای هر agent

می‌توانید یک agent را فقط Codex کنید در حالی که agent پیش‌فرض انتخاب خودکار عادی را نگه می‌دارد:

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

برای جابه‌جایی agentها و مدل‌ها از فرمان‌های عادی session استفاده کنید. `/new` یک session تازه OpenClaw ایجاد می‌کند و harness مربوط به Codex در صورت نیاز thread جانبی app-server خود را ایجاد یا resume می‌کند. `/reset` binding مربوط به session OpenClaw را برای آن thread پاک می‌کند و اجازه می‌دهد turn بعدی دوباره harness را از پیکربندی فعلی resolve کند.

## کشف مدل

به‌طور پیش‌فرض، Plugin مربوط به Codex از app-server مدل‌های در دسترس را می‌پرسد. اگر discovery شکست بخورد یا timeout شود، از یک کاتالوگ fallback همراه برای موارد زیر استفاده می‌کند:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

می‌توانید discovery را زیر `plugins.entries.codex.config.discovery` تنظیم کنید:

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

وقتی می‌خواهید startup از probe کردن Codex پرهیز کند و به کاتالوگ fallback بچسبد، discovery را غیرفعال کنید:

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

به‌طور پیش‌فرض، Plugin باینری Codex مدیریت‌شده توسط OpenClaw را به‌صورت محلی با این فرمان شروع می‌کند:

```bash
codex app-server --listen stdio://
```

باینری مدیریت‌شده با بسته Plugin مربوط به `codex` ارسال می‌شود. این کار نسخه app-server را به Plugin همراه گره می‌زند، نه به هر Codex CLI جداگانه‌ای که اتفاقاً به‌صورت محلی نصب شده باشد. فقط وقتی `appServer.command` را تنظیم کنید که عمداً می‌خواهید یک executable متفاوت اجرا کنید.

به‌طور پیش‌فرض، OpenClaw جلسه‌های محلی harness مربوط به Codex را در حالت YOLO شروع می‌کند:
`approvalPolicy: "never"`، `approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. این وضعیت operator محلی مورد اعتماد است که برای Heartbeatهای خودمختار استفاده می‌شود: Codex می‌تواند از ابزارهای shell و network استفاده کند بدون اینکه روی promptهای approval بومی متوقف شود که کسی برای پاسخ‌دادن به آن‌ها حاضر نیست.

برای ورود به approvalهای بازبینی‌شده توسط guardian مربوط به Codex، `appServer.mode:
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

حالت Guardian از مسیر approval بازبینی خودکار بومی Codex استفاده می‌کند. وقتی Codex درخواست خروج از sandbox، نوشتن بیرون از فضای کاری، یا افزودن permissionهایی مانند دسترسی network را می‌دهد، Codex آن درخواست approval را به‌جای prompt انسانی به reviewer بومی مسیریابی می‌کند. reviewer چارچوب ریسک Codex را اعمال می‌کند و درخواست مشخص را approve یا deny می‌کند. وقتی guardrailهای بیشتری نسبت به حالت YOLO می‌خواهید اما همچنان نیاز دارید agentهای بدون مراقبت پیشرفت کنند، از Guardian استفاده کنید.

preset مربوط به `guardian` به `approvalPolicy: "on-request"`،
`approvalsReviewer: "auto_review"`، و `sandbox: "workspace-write"` گسترش می‌یابد.
fieldهای policy جداگانه همچنان `mode` را override می‌کنند، بنابراین استقرارهای پیشرفته می‌توانند preset را با انتخاب‌های صریح ترکیب کنند. مقدار reviewer قدیمی‌تر `guardian_subagent` همچنان به‌عنوان alias سازگاری پذیرفته می‌شود، اما پیکربندی‌های جدید باید از
`auto_review` استفاده کنند.

برای یک app-server از قبل در حال اجرا، از transport مربوط به WebSocket استفاده کنید:

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

راه‌اندازی‌های stdio app-server به‌طور پیش‌فرض محیط فرایند OpenClaw را به ارث می‌برند، اما OpenClaw مالک پل حساب app-server مربوط به Codex است و هر دو `CODEX_HOME` و `HOME` را روی دایرکتوری‌های مختص هر agent زیر state آن agent در OpenClaw تنظیم می‌کند. skill loader خود Codex از `$CODEX_HOME/skills` و
`$HOME/.agents/skills` می‌خواند، بنابراین هر دو مقدار برای راه‌اندازی‌های app-server محلی ایزوله هستند. این کار Skills، Pluginها، پیکربندی، حساب‌ها، و وضعیت thread بومی Codex را در محدوده agent OpenClaw نگه می‌دارد، به‌جای اینکه از خانه شخصی Codex CLI مربوط به operator نشت کنند.

Pluginهای OpenClaw و snapshotهای skill مربوط به OpenClaw همچنان از طریق registry Plugin و skill loader خود OpenClaw جریان پیدا می‌کنند. دارایی‌های شخصی Codex CLI این‌طور نیستند. اگر Skills یا Pluginهای مفید Codex CLI دارید که باید بخشی از یک agent در OpenClaw شوند، آن‌ها را صریحاً inventory کنید:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

provider مهاجرت Codex، Skills را به فضای کاری agent فعلی OpenClaw کپی می‌کند. Pluginهای بومی Codex، hookها، و فایل‌های پیکربندی به‌جای فعال‌شدن خودکار، برای بازبینی دستی گزارش یا archive می‌شوند، چون می‌توانند فرمان اجرا کنند، serverهای MCP را expose کنند، یا credential حمل کنند.

احراز هویت به این ترتیب انتخاب می‌شود:

1. یک پروفایل احراز هویت صریح OpenClaw Codex برای agent.
2. حساب موجود app-server در خانه Codex همان agent.
3. فقط برای راه‌اندازی‌های app-server محلی stdio، `CODEX_API_KEY`، سپس
   `OPENAI_API_KEY`، وقتی هیچ حساب app-server وجود ندارد و احراز هویت OpenAI همچنان لازم است.

وقتی OpenClaw یک پروفایل احراز هویت Codex از نوع subscription مربوط به ChatGPT می‌بیند، `CODEX_API_KEY` و `OPENAI_API_KEY` را از فرایند فرزند Codex ایجادشده حذف می‌کند. این کار API keyهای سطح Gateway را برای embeddings یا مدل‌های مستقیم OpenAI در دسترس نگه می‌دارد، بدون اینکه turnهای app-server بومی Codex به‌اشتباه از طریق API صورت‌حساب شوند. پروفایل‌های Codex API-key صریح و fallback کلید محیطی stdio محلی، به‌جای env به‌ارث‌رسیده فرایند فرزند، از login app-server استفاده می‌کنند. اتصال‌های WebSocket app-server fallback مربوط به API-key محیط Gateway را دریافت نمی‌کنند؛ از یک پروفایل احراز هویت صریح یا حساب خود app-server remote استفاده کنید.

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

`appServer.clearEnv` فقط بر فرایند فرزند app-server مربوط به Codex که اجرا می‌شود اثر می‌گذارد.

ابزارهای پویای Codex به‌صورت پیش‌فرض از پروفایل `native-first` استفاده می‌کنند. در آن حالت،
OpenClaw ابزارهای پویایی را که عملیات workspace بومی Codex را تکرار می‌کنند
در دسترس قرار نمی‌دهد: `read`، `write`، `edit`، `apply_patch`، `exec`، `process`، و
`update_plan`. ابزارهای یکپارچه‌سازی OpenClaw مانند پیام‌رسانی، نشست‌ها، رسانه،
cron، مرورگر، nodes، gateway، `heartbeat_respond`، و `web_search` همچنان
در دسترس می‌مانند.

فیلدهای سطح بالای پشتیبانی‌شده برای Plugin Codex:

| فیلد                       | پیش‌فرض         | معنا                                                                                       |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | برای در دسترس قرار دادن مجموعه کامل ابزارهای پویای OpenClaw برای Codex app-server از `"openclaw-compat"` استفاده کنید. |
| `codexDynamicToolsExclude` | `[]`             | نام‌های اضافی ابزارهای پویای OpenClaw که باید از نوبت‌های Codex app-server حذف شوند.      |

فیلدهای پشتیبانی‌شده `appServer`:

| فیلد                | پیش‌فرض                                 | معنا                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` Codex را اجرا می‌کند؛ `"websocket"` به `url` وصل می‌شود.                                                                                                                                                                  |
| `command`           | باینری مدیریت‌شده Codex                 | فایل اجرایی برای ترابری stdio. برای استفاده از باینری مدیریت‌شده آن را تنظیم‌نشده بگذارید؛ فقط برای بازنویسی صریح آن را تنظیم کنید.                                                                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | آرگومان‌ها برای ترابری stdio.                                                                                                                                                                                                       |
| `url`               | تنظیم‌نشده                              | URL مربوط به WebSocket app-server.                                                                                                                                                                                                  |
| `authToken`         | تنظیم‌نشده                              | توکن Bearer برای ترابری WebSocket.                                                                                                                                                                                                  |
| `headers`           | `{}`                                     | هدرهای اضافی WebSocket.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | نام‌های اضافی متغیرهای محیطی که پس از ساخت محیط ارث‌بری‌شده توسط OpenClaw، از فرایند stdio app-server اجراشده حذف می‌شوند. `CODEX_HOME` و `HOME` برای جداسازی Codex به‌ازای هر عامل در اجرای محلی توسط OpenClaw رزرو شده‌اند. |
| `requestTimeoutMs`  | `60000`                                  | مهلت زمانی برای فراخوانی‌های control-plane مربوط به app-server.                                                                                                                                                                      |
| `mode`              | `"yolo"`                                 | پیش‌تنظیم برای اجرای YOLO یا اجرای بازبینی‌شده توسط نگهبان.                                                                                                                                                                         |
| `approvalPolicy`    | `"never"`                                | سیاست تایید بومی Codex که به آغاز/ازسرگیری/نوبت thread فرستاده می‌شود.                                                                                                                                                              |
| `sandbox`           | `"danger-full-access"`                   | حالت sandbox بومی Codex که به آغاز/ازسرگیری thread فرستاده می‌شود.                                                                                                                                                                  |
| `approvalsReviewer` | `"user"`                                 | برای اینکه Codex اعلان‌های تایید بومی را بازبینی کند از `"auto_review"` استفاده کنید. `guardian_subagent` همچنان یک نام مستعار قدیمی است.                                                                                          |
| `serviceTier`       | تنظیم‌نشده                              | سطح سرویس اختیاری Codex app-server: `"fast"`، `"flex"`، یا `null`. مقادیر قدیمی نامعتبر نادیده گرفته می‌شوند.                                                                                                                       |

فراخوانی‌های ابزار پویای متعلق به OpenClaw مستقل از
`appServer.requestTimeoutMs` محدود می‌شوند: هر درخواست Codex `item/tool/call` باید
ظرف ۳۰ ثانیه پاسخی از OpenClaw دریافت کند. هنگام timeout، OpenClaw در صورت پشتیبانی
سیگنال ابزار را لغو می‌کند و یک پاسخ ابزار پویا با شکست به Codex برمی‌گرداند تا
نوبت بتواند ادامه پیدا کند، به‌جای اینکه نشست در وضعیت `processing` باقی بماند.

پس از اینکه OpenClaw به یک درخواست app-server محدود به نوبت Codex پاسخ می‌دهد، harness
همچنین انتظار دارد Codex نوبت بومی را با `turn/completed` تمام کند. اگر
app-server پس از آن پاسخ برای ۶۰ ثانیه ساکت بماند، OpenClaw به‌شکل best-effort
نوبت Codex را قطع می‌کند، یک timeout تشخیصی ثبت می‌کند، و lane نشست
OpenClaw را آزاد می‌کند تا پیام‌های چت بعدی پشت یک نوبت بومی کهنه در صف نمانند.

بازنویسی‌های محیطی برای آزمون محلی همچنان در دسترس هستند:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

وقتی `appServer.command` تنظیم‌نشده باشد، `OPENCLAW_CODEX_APP_SERVER_BIN` باینری مدیریت‌شده را دور می‌زند.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` حذف شده است. به‌جای آن از
`plugins.entries.codex.config.appServer.mode: "guardian"` استفاده کنید، یا برای
آزمون محلی یک‌باره از `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` استفاده کنید. Config
برای استقرارهای تکرارپذیر ترجیح داده می‌شود، چون رفتار Plugin را در همان فایل
بازبینی‌شده‌ای نگه می‌دارد که بقیه راه‌اندازی harness مربوط به Codex در آن قرار دارد.

## استفاده از رایانه

استفاده از رایانه در راهنمای راه‌اندازی خودش پوشش داده شده است:
[استفاده از رایانه در Codex](/fa/plugins/codex-computer-use).

خلاصه کوتاه: OpenClaw برنامه کنترل دسکتاپ را vendor نمی‌کند و خودش
اقدام‌های دسکتاپ را اجرا نمی‌کند. Codex app-server را آماده می‌کند، بررسی می‌کند که
سرور MCP مربوط به `computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex در طول
نوبت‌های حالت Codex فراخوانی‌های ابزار MCP بومی را مدیریت کند.

برای دسترسی مستقیم به درایور TryCua خارج از جریان marketplace مربوط به Codex،
`cua-driver mcp` را با `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` ثبت کنید.
برای تفاوت میان استفاده از رایانه متعلق به Codex و ثبت مستقیم MCP، به
[استفاده از رایانه در Codex](/fa/plugins/codex-computer-use) مراجعه کنید.

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

استفاده از رایانه مختص macOS است و ممکن است قبل از اینکه سرور MCP مربوط به
Codex بتواند برنامه‌ها را کنترل کند، به مجوزهای محلی OS نیاز داشته باشد. اگر
`computerUse.enabled` برابر true باشد و سرور MCP در دسترس نباشد، نوبت‌های حالت
Codex پیش از شروع thread شکست می‌خورند، به‌جای اینکه بی‌صدا بدون ابزارهای بومی
استفاده از رایانه اجرا شوند. برای گزینه‌های marketplace، محدودیت‌های کاتالوگ
راه‌دور، دلایل وضعیت، و عیب‌یابی به
[استفاده از رایانه در Codex](/fa/plugins/codex-computer-use) مراجعه کنید.

وقتی `computerUse.autoInstall` برابر true باشد، OpenClaw می‌تواند marketplace
استاندارد همراه Codex Desktop را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند، اگر Codex
هنوز یک marketplace محلی پیدا نکرده باشد. پس از تغییر config مربوط به runtime یا
استفاده از رایانه، از `/new` یا `/reset` استفاده کنید تا نشست‌های موجود یک اتصال
قدیمی PI یا thread مربوط به Codex را نگه ندارند.

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

تاییدهای Codex بازبینی‌شده توسط نگهبان:

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

تعویض مدل تحت کنترل OpenClaw باقی می‌ماند. وقتی یک نشست OpenClaw به یک thread
موجود Codex متصل باشد، نوبت بعدی دوباره مدل OpenAI، ارائه‌دهنده، سیاست تایید،
sandbox، و سطح سرویس انتخاب‌شده فعلی را به app-server می‌فرستد. تعویض از
`openai/gpt-5.5` به `openai/gpt-5.2` اتصال thread را نگه می‌دارد، اما از Codex
می‌خواهد با مدل تازه انتخاب‌شده ادامه دهد.

## فرمان Codex

Plugin همراه، `/codex` را به‌عنوان یک فرمان slash مجاز ثبت می‌کند. این فرمان
عمومی است و روی هر کانالی که از فرمان‌های متنی OpenClaw پشتیبانی کند کار می‌کند.

شکل‌های رایج:

- `/codex status` اتصال زنده به سرور برنامه، مدل‌ها، حساب، محدودیت‌های نرخ، سرورهای MCP و skills را نشان می‌دهد.
- `/codex models` مدل‌های زنده سرور برنامه Codex را فهرست می‌کند.
- `/codex threads [filter]` رشته‌های اخیر Codex را فهرست می‌کند.
- `/codex resume <thread-id>` نشست فعلی OpenClaw را به یک رشته موجود Codex متصل می‌کند.
- `/codex compact` از سرور برنامه Codex می‌خواهد رشته متصل‌شده را فشرده کند.
- `/codex review` بازبینی بومی Codex را برای رشته متصل‌شده آغاز می‌کند.
- `/codex diagnostics [note]` پیش از ارسال بازخورد عیب‌یابی Codex برای رشته متصل‌شده سؤال می‌کند.
- `/codex computer-use status` Plugin پیکربندی‌شده Computer Use و سرور MCP را بررسی می‌کند.
- `/codex computer-use install` Plugin پیکربندی‌شده Computer Use را نصب می‌کند و سرورهای MCP را دوباره بارگذاری می‌کند.
- `/codex account` وضعیت حساب و محدودیت نرخ را نشان می‌دهد.
- `/codex mcp` وضعیت سرور MCP سرور برنامه Codex را فهرست می‌کند.
- `/codex skills` skills سرور برنامه Codex را فهرست می‌کند.

وقتی Codex یک شکست محدودیت مصرف را گزارش می‌کند، اگر Codex زمان بازنشانی بعدی
سرور برنامه را ارائه کرده باشد، OpenClaw آن را نیز درج می‌کند. از `/codex account` در همان
گفت‌وگو استفاده کنید تا حساب فعلی و بازه‌های محدودیت نرخ را بررسی کنید.

### روند رایج اشکال‌زدایی

وقتی یک عامل مبتنی بر Codex در Telegram، Discord، Slack
یا کانالی دیگر رفتاری غیرمنتظره انجام می‌دهد، از گفت‌وگویی شروع کنید که مشکل در آن رخ داده است:

1. دستور `/diagnostics bad tool choice after image upload` یا یادداشت کوتاه دیگری را اجرا کنید
   که چیزی را که دیده‌اید توصیف کند.
2. درخواست عیب‌یابی را یک‌بار تأیید کنید. تأیید، فایل فشرده عیب‌یابی Gateway محلی
   را ایجاد می‌کند و چون نشست از چارچوب اجرای Codex استفاده می‌کند،
   بسته بازخورد مرتبط Codex را نیز به سرورهای OpenAI می‌فرستد.
3. پاسخ کامل‌شده عیب‌یابی را در گزارش باگ یا رشته پشتیبانی کپی کنید.
   این پاسخ شامل مسیر بسته محلی، خلاصه حریم خصوصی، شناسه‌های نشست OpenClaw،
   شناسه‌های رشته Codex و یک خط `Inspect locally` برای هر رشته Codex است.
4. اگر می‌خواهید اجرا را خودتان اشکال‌زدایی کنید، دستور چاپ‌شده `Inspect locally`
   را در ترمینال اجرا کنید. این دستور شبیه `codex resume <thread-id>` است و
   رشته بومی Codex را باز می‌کند تا بتوانید گفت‌وگو را بررسی کنید، آن را به‌صورت محلی ادامه دهید،
   یا از Codex بپرسید چرا ابزار یا طرح خاصی را انتخاب کرده است.

فقط وقتی از `/codex diagnostics [note]` استفاده کنید که به‌طور مشخص بارگذاری بازخورد Codex
را برای رشته متصل‌شده فعلی بدون بسته کامل عیب‌یابی
Gateway مربوط به OpenClaw می‌خواهید. برای بیشتر گزارش‌های پشتیبانی، `/diagnostics [note]`
نقطه شروع بهتری است، چون وضعیت Gateway محلی و شناسه‌های رشته Codex
را در یک پاسخ به هم پیوند می‌دهد. برای مدل کامل حریم خصوصی و رفتار گروه‌گفت‌وگو،
[صادرات عیب‌یابی](/fa/gateway/diagnostics) را ببینید.

هسته OpenClaw همچنین دستور مالک‌محور `/diagnostics [note]` را به‌عنوان فرمان عمومی
عیب‌یابی Gateway ارائه می‌کند. اعلان تأیید آن مقدمه داده‌های حساس را نشان می‌دهد،
به [صادرات عیب‌یابی](/fa/gateway/diagnostics) پیوند می‌دهد و هر بار
از طریق تأیید صریح اجرا، درخواست `openclaw gateway diagnostics export --json`
می‌کند. عیب‌یابی را با قانون اجازه به همه تأیید نکنید. پس از تأیید،
OpenClaw گزارشی قابل چسباندن با مسیر بسته محلی و خلاصه مانیفست می‌فرستد.
وقتی نشست فعال OpenClaw از چارچوب اجرای Codex استفاده می‌کند، همان
تأیید همچنین ارسال بسته‌های بازخورد مرتبط Codex را به
سرورهای OpenAI مجاز می‌کند. اعلان تأیید می‌گوید که بازخورد Codex ارسال خواهد شد، اما
پیش از تأیید، شناسه‌های نشست یا رشته Codex را فهرست نمی‌کند.

اگر `/diagnostics` توسط یک مالک در گروه‌گفت‌وگو فراخوانی شود، OpenClaw
کانال مشترک را تمیز نگه می‌دارد: گروه فقط یک اعلان کوتاه دریافت می‌کند، درحالی‌که
مقدمه عیب‌یابی، اعلان‌های تأیید و شناسه‌های نشست/رشته Codex
از مسیر تأیید خصوصی برای مالک ارسال می‌شوند. اگر مسیر خصوصی مالک وجود نداشته باشد،
OpenClaw درخواست گروه را رد می‌کند و از مالک می‌خواهد آن را از یک پیام مستقیم اجرا کند.

بارگذاری تأییدشده Codex، `feedback/upload` سرور برنامه Codex را فراخوانی می‌کند و از
سرور برنامه می‌خواهد در صورت امکان، گزارش‌ها را برای هر رشته فهرست‌شده و زیررشته‌های
ایجادشده Codex درج کند. این بارگذاری از مسیر عادی بازخورد Codex به سرورهای OpenAI
می‌رود؛ اگر بازخورد Codex در آن سرور برنامه غیرفعال باشد، فرمان
خطای سرور برنامه را برمی‌گرداند. پاسخ کامل‌شده عیب‌یابی، کانال‌ها،
شناسه‌های نشست OpenClaw، شناسه‌های رشته Codex و فرمان‌های محلی `codex resume <thread-id>`
را برای رشته‌هایی که ارسال شدند فهرست می‌کند. اگر تأیید را رد یا نادیده بگیرید،
OpenClaw آن شناسه‌های Codex را چاپ نمی‌کند. این بارگذاری جایگزین صادرات عیب‌یابی
محلی Gateway نمی‌شود.

`/codex resume` همان فایل پیوند جانبی را می‌نویسد که چارچوب اجرا برای
نوبت‌های عادی استفاده می‌کند. در پیام بعدی، OpenClaw آن رشته Codex را از سر می‌گیرد، مدل
فعلاً انتخاب‌شده OpenClaw را به سرور برنامه می‌فرستد و تاریخچه گسترده را
فعال نگه می‌دارد.

### بررسی یک رشته Codex از CLI

سریع‌ترین راه برای فهمیدن یک اجرای بد Codex اغلب باز کردن مستقیم رشته بومی Codex است:

```sh
codex resume <thread-id>
```

وقتی در گفت‌وگوی یک کانال متوجه باگی می‌شوید و می‌خواهید نشست مشکل‌دار Codex را بررسی کنید،
آن را به‌صورت محلی ادامه دهید، یا از Codex بپرسید چرا یک انتخاب خاص ابزار یا استدلال انجام داده است،
از این استفاده کنید. ساده‌ترین مسیر معمولاً این است که ابتدا
`/diagnostics [note]` را اجرا کنید: پس از تأیید شما، گزارش کامل‌شده
هر رشته Codex را فهرست می‌کند و یک فرمان `Inspect locally` چاپ می‌کند، برای مثال
`codex resume <thread-id>`. می‌توانید آن فرمان را مستقیم در ترمینال کپی کنید.

همچنین می‌توانید شناسه رشته را از `/codex binding` برای گفت‌وگوی فعلی یا
`/codex threads [filter]` برای رشته‌های اخیر سرور برنامه Codex بگیرید، سپس همان
فرمان `codex resume` را در پوسته خود اجرا کنید.

سطح فرمان به سرور برنامه Codex نسخه `0.125.0` یا جدیدتر نیاز دارد. اگر یک
سرور برنامه سفارشی یا آینده آن روش JSON-RPC را ارائه نکند، روش‌های کنترلی
جداگانه با پیام `unsupported by this Codex app-server` گزارش می‌شوند.

## مرزهای هوک

چارچوب اجرای Codex سه لایه هوک دارد:

| لایه                                  | مالک                     | هدف                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| هوک‌های Plugin در OpenClaw            | OpenClaw                 | سازگاری محصول/Plugin در چارچوب‌های اجرای PI و Codex.                |
| میان‌افزار افزونه سرور برنامه Codex   | Pluginهای همراه OpenClaw | رفتار آداپتور در هر نوبت پیرامون ابزارهای پویای OpenClaw.          |
| هوک‌های بومی Codex                    | Codex                    | چرخه عمر سطح پایین Codex و سیاست ابزار بومی از پیکربندی Codex.     |

OpenClaw از فایل‌های پروژه یا سراسری Codex به نام `hooks.json` برای مسیریابی
رفتار Pluginهای OpenClaw استفاده نمی‌کند. برای ابزار بومی پشتیبانی‌شده و پل مجوز،
OpenClaw پیکربندی Codex را برای هر رشته به `PreToolUse`، `PostToolUse`،
`PermissionRequest` و `Stop` تزریق می‌کند. هوک‌های دیگر Codex مانند `SessionStart` و
`UserPromptSubmit` کنترل‌های سطح Codex باقی می‌مانند؛ آن‌ها در قرارداد v1
به‌عنوان هوک‌های Plugin در OpenClaw ارائه نمی‌شوند.

برای ابزارهای پویای OpenClaw، پس از اینکه Codex درخواست فراخوانی را می‌دهد،
OpenClaw ابزار را اجرا می‌کند؛ بنابراین OpenClaw رفتار Plugin و میان‌افزاری را که مالک آن است
در آداپتور چارچوب اجرا فعال می‌کند. برای ابزارهای بومی Codex، Codex رکورد معتبر ابزار را مالک است.
OpenClaw می‌تواند رویدادهای انتخاب‌شده را بازتاب دهد، اما نمی‌تواند رشته بومی Codex
را بازنویسی کند مگر اینکه Codex آن عملیات را از طریق سرور برنامه یا callbackهای هوک بومی ارائه کند.

پرتاب‌های Compaction و چرخه عمر LLM از اعلان‌های سرور برنامه Codex
و وضعیت آداپتور OpenClaw می‌آیند، نه از فرمان‌های هوک بومی Codex.
رویدادهای `before_compaction`، `after_compaction`، `llm_input` و
`llm_output` در OpenClaw مشاهده‌های سطح آداپتور هستند، نه برداشت‌های بایت‌به‌بایت
از درخواست داخلی یا بار Compaction در Codex.

اعلان‌های سرور برنامه بومی Codex به نام‌های `hook/started` و `hook/completed`
به‌عنوان رویدادهای عامل `codex_app_server.hook` برای مسیر حرکت و اشکال‌زدایی
بازتاب داده می‌شوند. آن‌ها هوک‌های Plugin در OpenClaw را فراخوانی نمی‌کنند.

## قرارداد پشتیبانی V1

حالت Codex همان PI با یک فراخوانی مدل متفاوت در زیر آن نیست. Codex بخش بیشتری از
حلقه مدل بومی را مالک است، و OpenClaw سطح‌های Plugin و نشست خود را
پیرامون آن مرز تطبیق می‌دهد.

پشتیبانی‌شده در زمان اجرای Codex نسخه v1:

| سطح                                           | پشتیبانی                                | دلیل                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حلقه مدل OpenAI از طریق Codex                 | پشتیبانی‌شده                            | سرور برنامه Codex نوبت OpenAI، ازسرگیری رشته بومی و ادامه ابزار بومی را مالک است.                                                                                                                    |
| مسیریابی و تحویل کانال OpenClaw               | پشتیبانی‌شده                            | Telegram، Discord، Slack، WhatsApp، iMessage و کانال‌های دیگر بیرون از زمان اجرای مدل می‌مانند.                                                                                                      |
| ابزارهای پویای OpenClaw                       | پشتیبانی‌شده                            | Codex از OpenClaw می‌خواهد این ابزارها را اجرا کند، بنابراین OpenClaw در مسیر اجرا باقی می‌ماند.                                                                                                    |
| Pluginهای اعلان و زمینه                       | پشتیبانی‌شده                            | OpenClaw لایه‌های اعلان را می‌سازد و پیش از شروع یا ازسرگیری رشته، زمینه را به نوبت Codex پرتاب می‌کند.                                                                                             |
| چرخه عمر موتور زمینه                          | پشتیبانی‌شده                            | سرهم‌بندی، دریافت یا نگهداری پس از نوبت، و هماهنگی Compaction موتور زمینه برای نوبت‌های Codex اجرا می‌شوند.                                                                                         |
| هوک‌های ابزار پویا                            | پشتیبانی‌شده                            | `before_tool_call`، `after_tool_call` و میان‌افزار نتیجه ابزار پیرامون ابزارهای پویای تحت مالکیت OpenClaw اجرا می‌شوند.                                                                             |
| هوک‌های چرخه عمر                              | پشتیبانی‌شده به‌عنوان مشاهده‌های آداپتور | `llm_input`، `llm_output`، `agent_end`، `before_compaction` و `after_compaction` با بارهای صادقانه حالت Codex فعال می‌شوند.                                                                          |
| دروازه بازبینی پاسخ نهایی                     | پشتیبانی‌شده از طریق رله هوک بومی       | `Stop` در Codex به `before_agent_finalize` رله می‌شود؛ `revise` از Codex یک گذر مدل دیگر پیش از نهایی‌سازی درخواست می‌کند.                                                                           |
| مسدودسازی یا مشاهده پوسته، وصله و MCP بومی    | پشتیبانی‌شده از طریق رله هوک بومی       | `PreToolUse` و `PostToolUse` در Codex برای سطح‌های ابزار بومی ثبت‌شده، از جمله بارهای MCP در سرور برنامه Codex نسخه `0.125.0` یا جدیدتر، رله می‌شوند. مسدودسازی پشتیبانی می‌شود؛ بازنویسی آرگومان نه. |
| سیاست مجوز بومی                               | پشتیبانی‌شده از طریق رله هوک بومی       | `PermissionRequest` در Codex در جایی که زمان اجرا آن را ارائه کند، می‌تواند از مسیر سیاست OpenClaw عبور کند. اگر OpenClaw تصمیمی برنگرداند، Codex از مسیر عادی نگهبان یا تأیید کاربر خود ادامه می‌دهد. |
| ضبط مسیر حرکت سرور برنامه                     | پشتیبانی‌شده                            | OpenClaw درخواستی را که به سرور برنامه فرستاده و اعلان‌هایی را که از سرور برنامه دریافت می‌کند، ثبت می‌کند.                                                                                       |

پشتیبانی‌نشده در زمان اجرای Codex نسخه v1:

| سطح                                                | مرز V1                                                                                                                                     | مسیر آینده                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| تغییر آرگومان ابزار بومی                           | قلاب‌های بومی پیش‌ابزار Codex می‌توانند مسدود کنند، اما OpenClaw آرگومان‌های ابزار بومی Codex را بازنویسی نمی‌کند.                                               | به پشتیبانی قلاب/طرحواره Codex برای جایگزینی ورودی ابزار نیاز دارد.                            |
| تاریخچه قابل ویرایش رونوشت بومی Codex            | Codex مالک تاریخچه رسمی رشته بومی است. OpenClaw مالک یک آینه است و می‌تواند زمینه آینده را تصویر کند، اما نباید داخلیات پشتیبانی‌نشده را تغییر دهد. | اگر جراحی رشته بومی لازم باشد، APIهای صریح سرور برنامه Codex را اضافه کنید.                    |
| `tool_result_persist` برای رکوردهای ابزار بومی Codex | آن قلاب نوشتن‌های رونوشتِ تحت مالکیت OpenClaw را تبدیل می‌کند، نه رکوردهای ابزار بومی Codex را.                                                           | می‌تواند رکوردهای تبدیل‌شده را آینه کند، اما بازنویسی رسمی به پشتیبانی Codex نیاز دارد.              |
| فراداده غنی Compaction بومی                     | OpenClaw شروع و تکمیل Compaction را مشاهده می‌کند، اما فهرست پایدارِ نگه‌داشته/حذف‌شده، دلتای توکن، یا بار خلاصه دریافت نمی‌کند.            | به رویدادهای غنی‌تر Compaction در Codex نیاز دارد.                                                     |
| مداخله در Compaction                             | قلاب‌های فعلی Compaction در OpenClaw در حالت Codex در سطح اعلان هستند.                                                                         | اگر plugins باید بتوانند Compaction بومی را وتو یا بازنویسی کنند، قلاب‌های پیش/پس از Compaction در Codex را اضافه کنید. |
| ضبط درخواست API مدل به‌صورت بایت‌به‌بایت         | OpenClaw می‌تواند درخواست‌ها و اعلان‌های سرور برنامه را ضبط کند، اما هسته Codex درخواست نهایی OpenAI API را به‌صورت داخلی می‌سازد.                      | به رویداد ردگیری درخواست مدل Codex یا API اشکال‌زدایی نیاز دارد.                                   |

## ابزارها، رسانه، و Compaction

مهار Codex فقط اجراکننده عامل تعبیه‌شده سطح پایین را تغییر می‌دهد.

OpenClaw همچنان فهرست ابزارها را می‌سازد و نتایج ابزار پویا را از
مهار دریافت می‌کند. متن، تصویرها، ویدئو، موسیقی، TTS، تأییدها، و خروجی ابزار پیام‌رسانی
از مسیر تحویل عادی OpenClaw ادامه پیدا می‌کنند.

رله قلاب بومی عمداً عمومی است، اما قرارداد پشتیبانی v1
به مسیرهای ابزار و مجوز بومی Codex محدود است که OpenClaw آزمایش می‌کند. در
زمان اجرای Codex، این شامل بارهای shell، patch، و MCP `PreToolUse`،
`PostToolUse`، و `PermissionRequest` است. فرض نکنید هر رویداد قلاب آینده
Codex یک سطح Plugin در OpenClaw است، مگر اینکه قرارداد زمان اجرا آن را نام ببرد.

برای `PermissionRequest`، OpenClaw فقط وقتی سیاست تصمیم بگیرد، تصمیم‌های صریح اجازه یا رد را
برمی‌گرداند. نتیجه بدون تصمیم، اجازه نیست. Codex آن را به‌عنوان نبود تصمیم قلاب
در نظر می‌گیرد و به مسیر نگهبان خودش یا تأیید کاربر ادامه می‌دهد.

درخواست‌های تأیید ابزار Codex MCP از طریق جریان تأیید Plugin در OpenClaw
مسیریابی می‌شوند، وقتی Codex مقدار `_meta.codex_approval_kind` را
`"mcp_tool_call"` علامت‌گذاری کند. اعلان‌های Codex `request_user_input` به
گفت‌وگوی مبدأ بازفرستاده می‌شوند، و پیام پیگیری بعدی در صف به آن درخواست سرور بومی
پاسخ می‌دهد، به‌جای اینکه به‌عنوان زمینه اضافی هدایت شود. درخواست‌های دیگر MCP elicitation
همچنان به‌صورت بسته شکست می‌خورند.

هدایت صف اجرای فعال به Codex app-server `turn/steer` نگاشت می‌شود. با
پیش‌فرض `messages.queue.mode: "steer"`، OpenClaw پیام‌های گفت‌وگوی در صف را
برای پنجره سکوت پیکربندی‌شده دسته‌بندی می‌کند و آن‌ها را به‌ترتیب ورود به‌عنوان یک درخواست
`turn/steer` می‌فرستد. حالت قدیمی `queue` درخواست‌های جداگانه `turn/steer` می‌فرستد. نوبت‌های
بازبینی Codex و Compaction دستی می‌توانند هدایت همان نوبت را رد کنند، که در این حالت
OpenClaw وقتی حالت انتخاب‌شده اجازه جایگزین را بدهد از صف پیگیری استفاده می‌کند. ببینید
[صف هدایت](/fa/concepts/queue-steering).

وقتی مدل انتخاب‌شده از مهار Codex استفاده می‌کند، Compaction رشته بومی به
Codex app-server واگذار می‌شود. OpenClaw یک آینه رونوشت برای تاریخچه کانال،
جست‌وجو، `/new`، `/reset`، و تغییر آینده مدل یا مهار نگه می‌دارد. آینه
شامل اعلان کاربر، متن نهایی دستیار، و رکوردهای سبک استدلال یا برنامه Codex است
وقتی app-server آن‌ها را منتشر کند. امروز، OpenClaw فقط سیگنال‌های شروع و تکمیل
Compaction بومی را ثبت می‌کند. هنوز خلاصه خوانای انسانی از Compaction یا فهرست قابل حسابرسی
از اینکه Codex کدام ورودی‌ها را پس از Compaction نگه داشته است ارائه نمی‌کند.

چون Codex مالک رشته بومی رسمی است، `tool_result_persist` در حال حاضر
رکوردهای نتیجه ابزار بومی Codex را بازنویسی نمی‌کند. فقط وقتی اعمال می‌شود که
OpenClaw در حال نوشتن نتیجه ابزار رونوشت نشست تحت مالکیت OpenClaw باشد.

تولید رسانه به PI نیاز ندارد. تصویر، ویدئو، موسیقی، PDF، TTS، و فهم رسانه
همچنان از تنظیمات provider/model متناظر مانند
`agents.defaults.imageGenerationModel`، `videoGenerationModel`، `pdfModel`، و
`messages.tts` استفاده می‌کنند.

## عیب‌یابی

**Codex به‌عنوان یک provider عادی `/model` ظاهر نمی‌شود:** این برای
پیکربندی‌های جدید مورد انتظار است. یک مدل `openai/gpt-*` با
`agentRuntime.id: "codex"` (یا یک مرجع قدیمی `codex/*`) انتخاب کنید،
`plugins.entries.codex.enabled` را فعال کنید، و بررسی کنید آیا `plugins.allow`
`codex` را مستثنی می‌کند یا نه.

**OpenClaw به‌جای Codex از PI استفاده می‌کند:** `agentRuntime.id: "auto"` همچنان می‌تواند از PI به‌عنوان
پس‌زمینه سازگاری استفاده کند، وقتی هیچ مهار Codex اجرای موردنظر را ادعا نکند. برای اجبار انتخاب
Codex هنگام آزمون، `agentRuntime.id: "codex"` را تنظیم کنید. زمان اجرای Codex اجباری
به‌جای برگشتن به PI شکست می‌خورد. پس از انتخاب Codex app-server،
شکست‌های آن مستقیماً نمایش داده می‌شوند.

**app-server رد می‌شود:** Codex را ارتقا دهید تا دست‌دهی app-server
نسخه `0.125.0` یا جدیدتر را گزارش کند. پیش‌انتشارهای هم‌نسخه یا نسخه‌های دارای پسوند ساخت
مانند `0.125.0-alpha.2` یا `0.125.0+custom` رد می‌شوند، چون کف پروتکل پایدار
`0.125.0` همان چیزی است که OpenClaw آزمایش می‌کند.

**کشف مدل کند است:** مقدار `plugins.entries.codex.config.discovery.timeoutMs`
را کاهش دهید یا کشف را غیرفعال کنید.

**انتقال WebSocket بلافاصله شکست می‌خورد:** `appServer.url`، `authToken`،
و اینکه app-server دوردست همان نسخه پروتکل Codex app-server را صحبت می‌کند بررسی کنید.

**یک مدل غیر Codex از PI استفاده می‌کند:** این مورد انتظار است مگر اینکه برای آن عامل
`agentRuntime.id: "codex"` را اجبار کرده باشید یا یک مرجع قدیمی
`codex/*` را انتخاب کرده باشید. مراجع ساده `openai/gpt-*` و دیگر providerها در حالت
`auto` روی مسیر عادی provider خودشان می‌مانند. اگر `agentRuntime.id: "codex"` را اجبار کنید، هر نوبت تعبیه‌شده
برای آن عامل باید یک مدل OpenAI پشتیبانی‌شده توسط Codex باشد.

**Computer Use نصب است اما ابزارها اجرا نمی‌شوند:** از یک نشست تازه
`/codex computer-use status` را بررسی کنید. اگر ابزاری
`Native hook relay unavailable` گزارش کرد، از `/new` یا `/reset` استفاده کنید؛ اگر ادامه داشت، Gateway
را بازراه‌اندازی کنید تا ثبت‌نام‌های قلاب بومی کهنه پاک شوند. اگر `computer-use.list_apps`
زمان‌بر شد، Codex Computer Use یا Codex Desktop را بازراه‌اندازی کنید و دوباره تلاش کنید.

## مرتبط

- [plugins مهار عامل](/fa/plugins/sdk-agent-harness)
- [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes)
- [providerهای مدل](/fa/concepts/model-providers)
- [provider OpenAI](/fa/providers/openai)
- [وضعیت](/fa/cli/status)
- [قلاب‌های Plugin](/fa/plugins/hooks)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [آزمون](/fa/help/testing-live#live-codex-app-server-harness-smoke)

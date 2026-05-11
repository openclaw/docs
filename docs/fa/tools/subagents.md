---
read_when:
    - می‌خواهید از طریق عامل، کار پس‌زمینه یا موازی انجام دهید
    - شما در حال تغییر خط‌مشی ابزار sessions_spawn یا زیرعامل هستید
    - در حال پیاده‌سازی یا عیب‌یابی نشست‌های زیرعاملِ مقید به رشته هستید
sidebarTitle: Sub-agents
summary: اجراهای عاملِ پس‌زمینهٔ ایزوله را ایجاد کنید که نتایج را به گفت‌وگوی درخواست‌کننده اعلام می‌کنند.
title: عامل‌های فرعی
x-i18n:
    generated_at: "2026-05-11T20:47:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

زیرعامل‌ها اجرای عامل در پس‌زمینه هستند که از یک اجرای عامل موجود ایجاد می‌شوند.
آن‌ها در نشست خودشان (`agent:<agentId>:subagent:<uuid>`) اجرا می‌شوند و،
پس از پایان، نتیجه‌شان را به کانال گفت‌وگوی درخواست‌کننده **اعلام** می‌کنند.
هر اجرای زیرعامل به‌عنوان یک
[کار پس‌زمینه](/fa/automation/tasks) رهگیری می‌شود.

هدف‌های اصلی:

- موازی‌سازی کارهای «پژوهش / وظیفه طولانی / ابزار کند» بدون مسدود کردن اجرای اصلی.
- ایزوله نگه داشتن زیرعامل‌ها به‌صورت پیش‌فرض (جداسازی نشست + sandboxing اختیاری).
- دشوار کردن سوءاستفاده از سطح ابزار: زیرعامل‌ها به‌صورت پیش‌فرض ابزارهای نشست را دریافت نمی‌کنند.
- پشتیبانی از عمق تودرتوی قابل پیکربندی برای الگوهای هماهنگ‌کننده.

<Note>
**نکته هزینه:** هر زیرعامل به‌صورت پیش‌فرض زمینه و مصرف توکن خودش را دارد.
برای وظایف سنگین یا تکراری، یک مدل ارزان‌تر برای زیرعامل‌ها تنظیم کنید
و عامل اصلی خود را روی یک مدل باکیفیت‌تر نگه دارید. از طریق
`agents.defaults.subagents.model` یا بازنویسی‌های هر عامل پیکربندی کنید. وقتی یک فرزند
    واقعا به رونوشت فعلی درخواست‌کننده نیاز دارد، عامل می‌تواند در همان یک ایجاد
    `context: "fork"` را درخواست کند. نشست‌های زیرعامل وابسته به ریسه به‌صورت پیش‌فرض
    `context: "fork"` دارند، چون گفت‌وگوی فعلی را به یک ریسه پیگیری منشعب می‌کنند.
</Note>

## دستور اسلش

از `/subagents` برای بررسی یا کنترل اجراهای زیرعامل برای **نشست فعلی**
استفاده کنید:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

از [`/steer <message>`](/fa/tools/steer) سطح بالا برای هدایت اجرای فعال نشست درخواست‌کننده فعلی استفاده کنید. وقتی هدف یک اجرای فرزند است، از `/subagents steer <id|#> <message>` استفاده کنید.

`/subagents info` فراداده اجرا را نشان می‌دهد (وضعیت، زمان‌مهرها، شناسه نشست،
مسیر رونوشت، پاک‌سازی). از `sessions_history` برای یک نمای یادآوری محدود و
فیلترشده از نظر ایمنی استفاده کنید؛ وقتی به رونوشت خام کامل نیاز دارید،
مسیر رونوشت را روی دیسک بررسی کنید.

### کنترل‌های اتصال ریسه

این دستورها روی کانال‌هایی کار می‌کنند که از اتصال‌های ریسه پایدار پشتیبانی می‌کنند.
[کانال‌های پشتیبان ریسه](#thread-supporting-channels) را در ادامه ببینید.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### رفتار ایجاد

`/subagents spawn` یک زیرعامل پس‌زمینه را به‌عنوان دستور کاربر (نه یک relay
داخلی) شروع می‌کند و وقتی اجرا پایان یابد، یک به‌روزرسانی نهایی تکمیل را به
گفت‌وگوی درخواست‌کننده می‌فرستد.

<AccordionGroup>
  <Accordion title="تکمیل غیرمسدودکننده و مبتنی بر push">
    - دستور ایجاد غیرمسدودکننده است؛ بلافاصله یک شناسه اجرا برمی‌گرداند.
    - پس از تکمیل، زیرعامل یک پیام خلاصه/نتیجه را به کانال گفت‌وگوی درخواست‌کننده اعلام می‌کند.
    - نوبت‌های عاملی که به نتایج فرزند نیاز دارند باید پس از ایجاد کارهای لازم `sessions_yield` را فراخوانی کنند. این کار نوبت فعلی را پایان می‌دهد و اجازه می‌دهد رویدادهای تکمیل به‌عنوان پیام بعدی قابل مشاهده برای مدل وارد شوند.
    - تکمیل مبتنی بر push است. پس از ایجاد، فقط برای انتظار پایان آن، `/subagents list`، `sessions_list` یا `sessions_history` را در حلقه polling نکنید؛ وضعیت را فقط در صورت نیاز برای اشکال‌زدایی یا مداخله بررسی کنید.
    - خروجی فرزند یک گزارش/مدرک برای عامل درخواست‌کننده است تا آن را ترکیب کند. این متن، دستور نوشته‌شده توسط کاربر نیست و نمی‌تواند خط‌مشی سیستم، توسعه‌دهنده یا کاربر را بازنویسی کند.
    - پس از تکمیل، OpenClaw به‌صورت best-effort برگه‌ها/فرآیندهای مرورگری را که توسط آن نشست زیرعامل باز شده‌اند، پیش از ادامه جریان پاک‌سازی اعلام می‌بندد.

  </Accordion>
  <Accordion title="تاب‌آوری تحویل ایجاد دستی">
    - OpenClaw تکمیل‌ها را از طریق یک نوبت `agent` با یک کلید idempotency پایدار به نشست درخواست‌کننده برمی‌گرداند.
    - اگر اجرای درخواست‌کننده هنوز فعال باشد، OpenClaw ابتدا تلاش می‌کند همان اجرا را بیدار/هدایت کند، به‌جای اینکه مسیر پاسخ قابل مشاهده دومی را شروع کند.
    - اگر handoff تکمیل عامل درخواست‌کننده شکست بخورد یا خروجی قابل مشاهده‌ای تولید نکند، OpenClaw تحویل را ناموفق در نظر می‌گیرد و به مسیریابی/تلاش دوباره صف بازمی‌گردد. نتیجه فرزند را به‌صورت خام مستقیما به گفت‌وگوی خارجی نمی‌فرستد.
    - اگر handoff مستقیم قابل استفاده نباشد، به مسیریابی صف بازمی‌گردد.
    - اگر مسیریابی صف هنوز در دسترس نباشد، اعلام با backoff نمایی کوتاه تا پیش از تسلیم نهایی دوباره تلاش می‌شود.
    - تحویل تکمیل مسیر درخواست‌کننده حل‌شده را نگه می‌دارد: مسیرهای تکمیل وابسته به ریسه یا وابسته به گفت‌وگو، وقتی در دسترس باشند، اولویت دارند؛ اگر مبدا تکمیل فقط یک کانال ارائه کند، OpenClaw هدف/حساب گم‌شده را از مسیر حل‌شده نشست درخواست‌کننده (`lastChannel` / `lastTo` / `lastAccountId`) پر می‌کند تا تحویل مستقیم همچنان کار کند.

  </Accordion>
  <Accordion title="فراداده handoff تکمیل">
    handoff تکمیل به نشست درخواست‌کننده، زمینه داخلی تولیدشده در زمان اجرا
    است (نه متن نوشته‌شده توسط کاربر) و شامل موارد زیر است:

    - `Result` — آخرین متن پاسخ قابل مشاهده `assistant`، وگرنه آخرین متن ابزار/toolResult پاک‌سازی‌شده. اجراهای شکست‌خورده پایانی از متن پاسخ ضبط‌شده دوباره استفاده نمی‌کنند.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - آمار فشرده زمان اجرا/توکن.
    - یک دستور تحویل که به عامل درخواست‌کننده می‌گوید با صدای عادی assistant بازنویسی کند (نه اینکه فراداده داخلی خام را forward کند).

  </Accordion>
  <Accordion title="حالت‌ها و زمان اجرای ACP">
    - `--model` و `--thinking` پیش‌فرض‌ها را برای همان اجرای مشخص بازنویسی می‌کنند.
    - از `info`/`log` برای بررسی جزئیات و خروجی پس از تکمیل استفاده کنید.
    - `/subagents spawn` حالت یک‌باره است (`mode: "run"`). برای نشست‌های پایدار وابسته به ریسه، از `sessions_spawn` با `thread: true` و `mode: "session"` استفاده کنید.
    - برای نشست‌های harness مربوط به ACP (Claude Code، Gemini CLI، OpenCode، یا Codex ACP/acpx صریح)، وقتی ابزار آن زمان اجرا را advertised می‌کند، از `sessions_spawn` با `runtime: "acp"` استفاده کنید. هنگام اشکال‌زدایی تکمیل‌ها یا حلقه‌های عامل‌به‌عامل، [مدل تحویل ACP](/fa/tools/acp-agents#delivery-model) را ببینید. وقتی Plugin `codex` فعال است، کنترل گفت‌وگو/ریسه Codex باید `/codex ...` را بر ACP ترجیح دهد، مگر اینکه کاربر صریحا ACP/acpx را درخواست کند.
    - OpenClaw تا زمانی که ACP فعال نشده، درخواست‌کننده sandboxed نباشد، و یک Plugin backend مانند `acpx` بارگذاری نشده باشد، `runtime: "acp"` را پنهان می‌کند. `runtime: "acp"` انتظار یک شناسه harness خارجی ACP را دارد، یا یک ورودی `agents.list[]` با `runtime.type="acp"`؛ برای عامل‌های پیکربندی عادی OpenClaw از `agents_list`، از زمان اجرای پیش‌فرض زیرعامل استفاده کنید.

  </Accordion>
</AccordionGroup>

## حالت‌های زمینه

زیرعامل‌های native ایزوله شروع می‌شوند، مگر اینکه فراخوان صریحا درخواست کند
رونوشت فعلی fork شود.

| حالت       | زمان استفاده                                                                                                                         | رفتار                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | پژوهش تازه، پیاده‌سازی مستقل، کار ابزار کند، یا هر چیزی که بتوان آن را در متن وظیفه خلاصه کرد                           | یک رونوشت فرزند تمیز ایجاد می‌کند. این پیش‌فرض است و مصرف توکن را پایین‌تر نگه می‌دارد.  |
| `fork`     | کاری که به گفت‌وگوی فعلی، نتایج قبلی ابزار، یا دستورهای ظریف موجود در رونوشت درخواست‌کننده وابسته است | رونوشت درخواست‌کننده را پیش از شروع فرزند، به نشست فرزند منشعب می‌کند. |

از `fork` با احتیاط استفاده کنید. این برای واگذاری حساس به زمینه است، نه
جایگزینی برای نوشتن یک prompt وظیفه روشن.

## ابزار: `sessions_spawn`

یک اجرای زیرعامل را با `deliver: false` روی lane سراسری `subagent` شروع می‌کند،
سپس یک گام اعلام را اجرا می‌کند و پاسخ اعلام را به کانال گفت‌وگوی
درخواست‌کننده پست می‌کند.

دسترس‌پذیری به خط‌مشی ابزار موثر فراخوان بستگی دارد. پروفایل‌های `coding` و
`full` به‌صورت پیش‌فرض `sessions_spawn` را ارائه می‌کنند. پروفایل `messaging`
این کار را نمی‌کند؛ برای عامل‌هایی که باید کار را واگذار کنند،
`tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` را اضافه کنید یا از `tools.profile: "coding"` استفاده کنید.
خط‌مشی‌های کانال/گروه، provider، sandbox و allow/deny هر عامل همچنان می‌توانند
پس از مرحله پروفایل ابزار را حذف کنند. از `/tools` در همان نشست برای تایید
فهرست ابزار موثر استفاده کنید.

**پیش‌فرض‌ها:**

- **مدل:** از فراخوان به ارث می‌برد، مگر اینکه `agents.defaults.subagents.model` (یا `agents.list[].subagents.model` برای هر عامل) را تنظیم کنید؛ یک `sessions_spawn.model` صریح همچنان اولویت دارد.
- **تفکر:** از فراخوان به ارث می‌برد، مگر اینکه `agents.defaults.subagents.thinking` (یا `agents.list[].subagents.thinking` برای هر عامل) را تنظیم کنید؛ یک `sessions_spawn.thinking` صریح همچنان اولویت دارد.
- **مهلت زمانی اجرا:** اگر `sessions_spawn.runTimeoutSeconds` حذف شود، OpenClaw وقتی `agents.defaults.subagents.runTimeoutSeconds` تنظیم شده باشد از آن استفاده می‌کند؛ در غیر این صورت به `0` (بدون مهلت زمانی) بازمی‌گردد.

### حالت prompt واگذاری

`agents.defaults.subagents.delegationMode` فقط راهنمایی prompt را کنترل می‌کند؛ خط‌مشی ابزار را تغییر نمی‌دهد یا واگذاری را اعمال نمی‌کند.

- `suggest` (پیش‌فرض): nudge استاندارد prompt برای استفاده از زیرعامل‌ها در کارهای بزرگ‌تر یا کندتر را نگه می‌دارد.
- `prefer`: به عامل اصلی می‌گوید پاسخ‌گو بماند و هر چیزی پیچیده‌تر از یک پاسخ مستقیم را از طریق `sessions_spawn` واگذار کند.

بازنویسی‌های هر عامل از `agents.list[].subagents.delegationMode` استفاده می‌کنند.

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### پارامترهای ابزار

<ParamField path="task" type="string" required>
  شرح وظیفه برای زیرعامل.
</ParamField>
<ParamField path="taskName" type="string">
  دستهٔ پایدار اختیاری برای هدف‌گیری بعدی `subagents`. باید با `[a-z][a-z0-9_]{0,63}` مطابق باشد و نمی‌تواند هدف‌های رزرو‌شده‌ای مانند `last` یا `all` باشد. وقتی هماهنگ‌کننده ممکن است پس از ایجاد چند فرزند، نیاز داشته باشد یک فرزند مشخص را هدایت، متوقف، یا شناسایی کند، استفاده از آن را ترجیح دهید.
</ParamField>
<ParamField path="label" type="string">
  برچسب اختیاری قابل‌خواندن برای انسان.
</ParamField>
<ParamField path="agentId" type="string">
  وقتی `subagents.allowAgents` اجازه دهد، زیر شناسهٔ عامل دیگری ایجاد می‌شود.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` فقط برای هارنس‌های خارجی ACP (`claude`، `droid`، `gemini`، `opencode`، یا Codex ACP/acpx که صراحتا درخواست شده باشد) و برای ورودی‌های `agents.list[]` است که `runtime.type` آنها `acp` است.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  فقط ACP. وقتی `runtime: "acp"` باشد، یک نشست هارنس ACP موجود را از سر می‌گیرد؛ برای ایجاد زیرعامل‌های بومی نادیده گرفته می‌شود.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  فقط ACP. وقتی `runtime: "acp"` باشد، خروجی اجرای ACP را به نشست والد جریان می‌دهد؛ برای ایجاد زیرعامل‌های بومی حذف کنید.
</ParamField>
<ParamField path="model" type="string">
  مدل زیرعامل را بازنویسی کنید. مقدارهای نامعتبر نادیده گرفته می‌شوند و زیرعامل با مدل پیش‌فرض اجرا می‌شود و در نتیجهٔ ابزار یک هشدار نمایش داده می‌شود.
</ParamField>
<ParamField path="thinking" type="string">
  سطح تفکر را برای اجرای زیرعامل بازنویسی کنید.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  وقتی تنظیم شده باشد، مقدار پیش‌فرض `agents.defaults.subagents.runTimeoutSeconds` است، و در غیر این صورت `0`. وقتی تنظیم شود، اجرای زیرعامل پس از N ثانیه لغو می‌شود.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  وقتی `true` باشد، اتصال رشتهٔ کانال برای این نشست زیرعامل درخواست می‌شود.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  اگر `thread: true` باشد و `mode` حذف شده باشد، مقدار پیش‌فرض به `session` تبدیل می‌شود. `mode: "session"` به `thread: true` نیاز دارد.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` بلافاصله پس از اعلام بایگانی می‌کند (همچنان رونوشت را از طریق تغییر نام نگه می‌دارد).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` ایجاد را رد می‌کند مگر اینکه زمان اجرای فرزند هدف در sandbox باشد.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` رونوشت فعلی درخواست‌دهنده را به نشست فرزند شاخه‌بندی می‌کند. فقط زیرعامل‌های بومی. ایجادهای متصل به رشته به‌صورت پیش‌فرض `fork` هستند؛ ایجادهای بدون رشته به‌صورت پیش‌فرض `isolated` هستند.
</ParamField>

<Warning>
`sessions_spawn` پارامترهای تحویل کانال (`target`،
`channel`، `to`، `threadId`، `replyTo`، `transport`) را **نمی‌پذیرد**. برای تحویل، از
`message`/`sessions_send` از اجرای ایجادشده استفاده کنید.
</Warning>

### نام‌های وظیفه و هدف‌گیری

`taskName` یک دستهٔ رو به مدل برای هماهنگ‌سازی است، نه کلید نشست.
وقتی هماهنگ‌کننده ممکن است بعدا نیاز داشته باشد آن فرزند را هدایت
یا متوقف کند، از آن برای نام‌های پایدار فرزند مانند `review_subagents`،
`linux_validation`، یا `docs_update` استفاده کنید.

تفکیک هدف، تطابق‌های دقیق `taskName` و پیشوندهای بدون ابهام را می‌پذیرد.
تطابق به همان پنجرهٔ هدف فعال/اخیر محدود می‌شود که هدف‌های شماره‌دار
`/subagents` از آن استفاده می‌کنند، بنابراین یک فرزند تکمیل‌شدهٔ قدیمی
دستهٔ دوباره‌استفاده‌شده را مبهم نمی‌کند. اگر دو فرزند فعال یا اخیر
`taskName` یکسانی داشته باشند، هدف مبهم است؛ به‌جای آن از نمایهٔ فهرست،
کلید نشست، یا شناسهٔ اجرا استفاده کنید.

هدف‌های رزرو‌شدهٔ `last` و `all` مقدارهای معتبر `taskName` نیستند
زیرا از قبل معناهای کنترلی دارند.

## ابزار: `sessions_yield`

نوبت مدل فعلی را پایان می‌دهد و منتظر رویدادهای زمان اجرا، عمدتا
رویدادهای تکمیل زیرعامل، می‌ماند تا به‌عنوان پیام بعدی برسند. پس از
ایجاد کار فرزند الزامی، وقتی درخواست‌دهنده تا رسیدن آن تکمیل‌ها نمی‌تواند
پاسخ نهایی تولید کند، از آن استفاده کنید.

`sessions_yield` سازوکار انتظار است. آن را صرفا برای تشخیص تکمیل فرزند
با حلقه‌های polling روی `subagents`، `sessions_list`، `sessions_history`، `sleep`
شل، یا polling فرایند جایگزین نکنید.

فقط وقتی از `sessions_yield` استفاده کنید که فهرست ابزار مؤثر نشست شامل
آن باشد. برخی پروفایل‌های ابزار حداقلی یا سفارشی ممکن است `sessions_spawn` و
`subagents` را بدون نمایش `sessions_yield` ارائه کنند؛ در آن حالت، صرفا برای
انتظار تکمیل، حلقهٔ polling ابداع نکنید.

وقتی فرزندهای فعال وجود داشته باشند، OpenClaw یک بلوک اعلان فشردهٔ تولیدشده
توسط زمان اجرا با نام `Active Subagents` را در نوبت‌های عادی تزریق می‌کند تا
درخواست‌دهنده بتواند نشست‌های فرزند فعلی، شناسه‌های اجرا، وضعیت‌ها، برچسب‌ها،
وظیفه‌ها و نام‌های مستعار `taskName` را بدون polling ببیند. فیلدهای وظیفه و
برچسب در آن بلوک به‌عنوان داده نقل‌قول می‌شوند، نه دستورالعمل، چون می‌توانند
از آرگومان‌های ایجادِ ارائه‌شده توسط کاربر/مدل منشأ بگیرند.

## ابزار: `subagents`

اجراهای زیرعامل ایجادشده را که متعلق به نشست درخواست‌دهنده هستند فهرست،
هدایت، یا متوقف می‌کند. به درخواست‌دهندهٔ فعلی محدود است؛ یک فرزند فقط می‌تواند
فرزندهای کنترل‌شدهٔ خودش را ببیند/کنترل کند.

از `subagents` برای وضعیت درخواستی، اشکال‌زدایی، هدایت، یا توقف استفاده کنید.
برای انتظار رویدادهای تکمیل از `sessions_yield` استفاده کنید.

## نشست‌های متصل به رشته

وقتی اتصال‌های رشته برای یک کانال فعال باشند، یک زیرعامل می‌تواند به یک
رشته متصل بماند تا پیام‌های پیگیری کاربر در آن رشته همچنان به همان نشست
زیرعامل مسیریابی شوند.

### کانال‌های پشتیبان رشته

**Discord** در حال حاضر تنها کانال پشتیبانی‌شده است. این کانال از نشست‌های
زیرعامل متصل به رشتهٔ پایدار (`sessions_spawn` با `thread: true`)، کنترل‌های
دستی رشته (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`)
و کلیدهای آداپتر
`channels.discord.threadBindings.enabled`،
`channels.discord.threadBindings.idleHours`،
`channels.discord.threadBindings.maxAgeHours`، و
`channels.discord.threadBindings.spawnSessions` پشتیبانی می‌کند.

### جریان سریع

<Steps>
  <Step title="ایجاد">
    `sessions_spawn` با `thread: true` (و به‌صورت اختیاری `mode: "session"`).
  </Step>
  <Step title="اتصال">
    OpenClaw یک رشته را به هدف آن نشست در کانال فعال ایجاد یا متصل می‌کند.
  </Step>
  <Step title="مسیریابی پیگیری‌ها">
    پاسخ‌ها و پیام‌های پیگیری در آن رشته به نشست متصل مسیریابی می‌شوند.
  </Step>
  <Step title="بررسی مهلت‌ها">
    از `/session idle` برای بررسی/به‌روزرسانی auto-unfocus به دلیل نبود فعالیت و
    از `/session max-age` برای کنترل سقف سخت استفاده کنید.
  </Step>
  <Step title="جداسازی">
    از `/unfocus` برای جداسازی دستی استفاده کنید.
  </Step>
</Steps>

### کنترل‌های دستی

| دستور             | اثر                                                                  |
| ----------------- | -------------------------------------------------------------------- |
| `/focus <target>` | اتصال رشتهٔ فعلی (یا ایجاد یکی) به یک هدف زیرعامل/نشست             |
| `/unfocus`        | حذف اتصال برای رشتهٔ متصل فعلی                                      |
| `/agents`         | فهرست اجراهای فعال و وضعیت اتصال (`thread:<id>` یا `unbound`)       |
| `/session idle`   | بررسی/به‌روزرسانی auto-unfocus در حالت بیکار (فقط رشته‌های متصل متمرکز) |
| `/session max-age` | بررسی/به‌روزرسانی سقف سخت (فقط رشته‌های متصل متمرکز)               |

### کلیدهای پیکربندی

- **پیش‌فرض سراسری:** `session.threadBindings.enabled`، `session.threadBindings.idleHours`، `session.threadBindings.maxAgeHours`.
- **بازنویسی کانال و کلیدهای اتصال خودکار هنگام ایجاد** مخصوص آداپتر هستند. [کانال‌های پشتیبان رشته](#thread-supporting-channels) بالا را ببینید.

برای جزئیات فعلی آداپتر، [مرجع پیکربندی](/fa/gateway/configuration-reference) و
[دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

### فهرست مجاز

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  فهرست شناسه‌های عامل که می‌توانند از طریق `agentId` صریح هدف‌گیری شوند (`["*"]` هر موردی را مجاز می‌کند). پیش‌فرض: فقط عامل درخواست‌دهنده. اگر یک فهرست تنظیم می‌کنید و همچنان می‌خواهید درخواست‌دهنده بتواند خودش را با `agentId` ایجاد کند، شناسهٔ درخواست‌دهنده را در فهرست قرار دهید.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  فهرست مجاز عامل‌های هدف پیش‌فرض که وقتی عامل درخواست‌دهنده `subagents.allowAgents` خودش را تنظیم نکرده باشد استفاده می‌شود.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  فراخوانی‌های `sessions_spawn` را که `agentId` را حذف می‌کنند مسدود می‌کند (انتخاب صریح پروفایل را اجباری می‌کند). بازنویسی به‌ازای عامل: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  مهلت به‌ازای هر فراخوانی برای تلاش‌های تحویل اعلام `agent` توسط Gateway. مقدارها میلی‌ثانیه‌های عدد صحیح مثبت هستند و به بیشینهٔ تایمر ایمن برای پلتفرم محدود می‌شوند. تلاش‌های مجدد گذرا می‌توانند زمان انتظار کل اعلام را از یک مهلت پیکربندی‌شده طولانی‌تر کنند.
</ParamField>

اگر نشست درخواست‌دهنده در sandbox باشد، `sessions_spawn` هدف‌هایی را که بدون
sandbox اجرا می‌شوند رد می‌کند.

### کشف

از `agents_list` استفاده کنید تا ببینید کدام شناسه‌های عامل در حال حاضر برای
`sessions_spawn` مجاز هستند. پاسخ، مدل مؤثر هر عامل فهرست‌شده و فرادادهٔ
زمان اجرای تعبیه‌شده را شامل می‌شود تا فراخواننده‌ها بتوانند PI، app-server
‏Codex و دیگر زمان‌های اجرای بومی پیکربندی‌شده را از هم تشخیص دهند.

### بایگانی خودکار

- نشست‌های زیرعامل پس از `agents.defaults.subagents.archiveAfterMinutes` (پیش‌فرض `60`) به‌صورت خودکار بایگانی می‌شوند.
- بایگانی از `sessions.delete` استفاده می‌کند و نام رونوشت را به `*.deleted.<timestamp>` تغییر می‌دهد (در همان پوشه).
- `cleanup: "delete"` بلافاصله پس از اعلام بایگانی می‌کند (همچنان رونوشت را از طریق تغییر نام نگه می‌دارد).
- بایگانی خودکار به‌صورت best-effort است؛ اگر Gateway راه‌اندازی مجدد شود، تایمرهای معلق از دست می‌روند.
- `runTimeoutSeconds` بایگانی خودکار انجام **نمی‌دهد**؛ فقط اجرا را متوقف می‌کند. نشست تا زمان بایگانی خودکار باقی می‌ماند.
- بایگانی خودکار به‌طور یکسان برای نشست‌های عمق ۱ و عمق ۲ اعمال می‌شود.
- پاک‌سازی مرورگر از پاک‌سازی بایگانی جداست: زبانه‌ها/فرایندهای مرورگرِ ردیابی‌شده، حتی اگر رونوشت/رکورد نشست نگه داشته شود، هنگام پایان اجرا به‌صورت best-effort بسته می‌شوند.

## زیرعامل‌های تودرتو

به‌صورت پیش‌فرض، زیرعامل‌ها نمی‌توانند زیرعامل‌های خودشان را ایجاد کنند
(`maxSpawnDepth: 1`). برای فعال کردن یک سطح تودرتویی، `maxSpawnDepth: 2` را تنظیم کنید
— **الگوی هماهنگ‌کننده**: اصلی → زیرعامل هماهنگ‌کننده →
زیر-زیرعامل‌های worker.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### سطح‌های عمق

| عمق | شکل کلید نشست                                | نقش                                          | می‌تواند ایجاد کند؟          |
| --- | -------------------------------------------- | -------------------------------------------- | ---------------------------- |
| 0   | `agent:<id>:main`                            | عامل اصلی                                    | همیشه                        |
| 1   | `agent:<id>:subagent:<uuid>`                 | زیرعامل (هماهنگ‌کننده وقتی عمق ۲ مجاز باشد) | فقط اگر `maxSpawnDepth >= 2` |
| 2   | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | زیر-زیرعامل (worker برگ)                    | هرگز                         |

### زنجیرهٔ اعلام

نتایج در زنجیره به بالا برمی‌گردند:

1. worker عمق ۲ تمام می‌شود → به والد خود (هماهنگ‌کنندهٔ عمق ۱) اعلام می‌کند.
2. هماهنگ‌کنندهٔ عمق ۱ اعلام را دریافت می‌کند، نتایج را ترکیب می‌کند، تمام می‌شود → به اصلی اعلام می‌کند.
3. عامل اصلی اعلام را دریافت می‌کند و به کاربر تحویل می‌دهد.

هر سطح فقط اعلام‌های فرزندهای مستقیم خود را می‌بیند.

<Note>
**راهنمای عملیاتی:** کار فرزند را یک‌بار آغاز کنید و به‌جای ساختن حلقه‌های polling پیرامون فرمان‌های `sessions_list`،
`sessions_history`، `/subagents list` یا فرمان‌های sleep در `exec`، منتظر رویدادهای تکمیل بمانید.
`sessions_list` و `/subagents list` رابطه‌های جلسهٔ فرزند را بر کار زنده متمرکز نگه می‌دارند — فرزندان زنده پیوسته می‌مانند، فرزندان پایان‌یافته برای یک بازهٔ کوتاه اخیر قابل مشاهده می‌مانند، و پیوندهای فرزندِ فقط-ذخیره‌شدهٔ کهنه پس از پایان پنجرهٔ تازگی‌شان نادیده گرفته می‌شوند. این کار مانع می‌شود metadata قدیمی `spawnedBy` /
`parentSessionKey` پس از restart دوباره فرزندان شبحی را زنده کند. اگر پس از اینکه پاسخ نهایی را فرستاده‌اید رویداد تکمیل فرزند برسد، پیگیری درست همان token خاموش دقیق
`NO_REPLY` / `no_reply` است.
</Note>

### سیاست ابزار بر اساس عمق

- نقش و دامنهٔ کنترل هنگام spawn در metadata جلسه نوشته می‌شود. این کار جلوی این را می‌گیرد که کلیدهای جلسهٔ تخت یا بازیابی‌شده تصادفی دوباره امتیازهای orchestrator بگیرند.
- **عمق 1 (orchestrator، وقتی `maxSpawnDepth >= 2`):** `sessions_spawn`، `subagents`، `sessions_list`، `sessions_history` را می‌گیرد تا بتواند فرزندانش را مدیریت کند. سایر ابزارهای session/system همچنان رد می‌شوند.
- **عمق 1 (leaf، وقتی `maxSpawnDepth == 1`):** هیچ ابزار session ندارد (رفتار پیش‌فرض فعلی).
- **عمق 2 (leaf worker):** هیچ ابزار session ندارد — `sessions_spawn` همیشه در عمق 2 رد می‌شود. نمی‌تواند فرزند بیشتری spawn کند.

### محدودیت spawn برای هر agent

هر جلسهٔ agent (در هر عمقی) می‌تواند هم‌زمان حداکثر `maxChildrenPerAgent`
(پیش‌فرض `5`) فرزند فعال داشته باشد. این کار از fan-out مهارنشده از یک orchestrator واحد جلوگیری می‌کند.

### توقف آبشاری

توقف یک orchestrator عمق-1 به‌طور خودکار همهٔ فرزندان عمق-2 آن را متوقف می‌کند:

- `/stop` در چت اصلی همهٔ agentهای عمق-1 را متوقف می‌کند و به فرزندان عمق-2 آن‌ها سرایت می‌کند.
- `/subagents kill <id>` یک sub-agent مشخص را متوقف می‌کند و به فرزندانش سرایت می‌کند.
- `/subagents kill all` همهٔ sub-agentهای درخواست‌کننده را متوقف می‌کند و سرایت می‌دهد.

## احراز هویت

احراز هویت sub-agent بر اساس **شناسهٔ agent** حل می‌شود، نه بر اساس نوع جلسه:

- کلید جلسهٔ sub-agent برابر `agent:<agentId>:subagent:<uuid>` است.
- auth store از `agentDir` همان agent بارگذاری می‌شود.
- پروفایل‌های احراز هویت agent اصلی به‌عنوان **fallback** ادغام می‌شوند؛ پروفایل‌های agent در تعارض‌ها پروفایل‌های اصلی را override می‌کنند.

ادغام افزایشی است، بنابراین پروفایل‌های اصلی همیشه به‌عنوان fallback در دسترس هستند. احراز هویت کاملا ایزوله برای هر agent هنوز پشتیبانی نمی‌شود.

## اعلام

sub-agentها از طریق یک گام announce گزارش می‌دهند:

- گام announce داخل جلسهٔ sub-agent اجرا می‌شود (نه جلسهٔ درخواست‌کننده).
- اگر sub-agent دقیقا `ANNOUNCE_SKIP` پاسخ دهد، چیزی posted نمی‌شود.
- اگر تازه‌ترین متن assistant همان token خاموش دقیق `NO_REPLY` / `no_reply` باشد، خروجی announce سرکوب می‌شود حتی اگر پیشرفت قابل مشاهدهٔ قبلی وجود داشته باشد.

تحویل به عمق درخواست‌کننده بستگی دارد:

- جلسه‌های درخواست‌کنندهٔ سطح بالا از یک فراخوانی پیگیری `agent` با تحویل خارجی (`deliver=true`) استفاده می‌کنند.
- جلسه‌های subagent درخواست‌کنندهٔ تو در تو یک تزریق پیگیری داخلی (`deliver=false`) دریافت می‌کنند تا orchestrator بتواند نتایج فرزند را درون جلسه synthesize کند.
- اگر یک جلسهٔ subagent درخواست‌کنندهٔ تو در تو از بین رفته باشد، OpenClaw در صورت امکان به درخواست‌کنندهٔ همان جلسه fallback می‌کند.

برای جلسه‌های درخواست‌کنندهٔ سطح بالا، تحویل مستقیم در حالت completion ابتدا هر مسیر conversation/thread و override hook متصل را resolve می‌کند، سپس فیلدهای channel-target جاافتاده را از مسیر ذخیره‌شدهٔ جلسهٔ درخواست‌کننده پر می‌کند. این کار completionها را حتی وقتی مبدا completion فقط channel را شناسایی می‌کند، روی چت/موضوع درست نگه می‌دارد.

هنگام ساخت findings تکمیل تو در تو، تجمیع تکمیل فرزند به اجرای فعلی درخواست‌کننده محدود می‌شود و از نشت خروجی‌های فرزند از اجرای قبلی به announce فعلی جلوگیری می‌کند. پاسخ‌های announce وقتی روی adapterهای channel در دسترس باشند، مسیریابی thread/topic را حفظ می‌کنند.

### زمینهٔ announce

زمینهٔ announce به یک بلوک رویداد داخلی پایدار نرمال‌سازی می‌شود:

| فیلد          | منبع                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` یا `cron`                                                                                          |
| شناسه‌های جلسه    | کلید/شناسهٔ جلسهٔ فرزند                                                                                          |
| نوع           | نوع announce + برچسب task                                                                                    |
| وضعیت         | مشتق‌شده از نتیجهٔ runtime (`success`، `error`، `timeout`، یا `unknown`) — **نه** استنتاج‌شده از متن مدل |
| محتوای نتیجه | تازه‌ترین متن قابل مشاهدهٔ assistant، در غیر این صورت تازه‌ترین متن sanitized ابزار/toolResult                                |
| پیگیری      | دستورالعملی که توضیح می‌دهد چه زمانی پاسخ داده شود و چه زمانی سکوت حفظ شود                                                           |

اجراهای ناموفق terminal وضعیت failure را بدون بازپخش متن پاسخ captureشده گزارش می‌کنند. در timeout، اگر فرزند فقط تا tool callها پیش رفته باشد، announce می‌تواند آن history را به‌جای بازپخش خروجی خام ابزار، به یک خلاصهٔ کوتاه از پیشرفت partial collapse کند.

### خط آمار

payloadهای announce در پایان یک خط آمار دارند (حتی وقتی wrapped باشند):

- Runtime (مثلا `runtime 5m12s`).
- مصرف token (input/output/total).
- هزینهٔ تخمینی وقتی pricing مدل پیکربندی شده باشد (`models.providers.*.models[].cost`).
- `sessionKey`، `sessionId` و مسیر transcript تا agent اصلی بتواند history را از طریق `sessions_history` بگیرد یا فایل روی disk را inspect کند.

metadata داخلی فقط برای orchestration است؛ پاسخ‌های user-facing باید با صدای معمول assistant بازنویسی شوند.

### چرا `sessions_history` ترجیح داده می‌شود

`sessions_history` مسیر orchestration امن‌تری است:

- recall مربوط به assistant ابتدا نرمال‌سازی می‌شود: thinking tagها حذف می‌شوند؛ scaffolding مربوط به `<relevant-memories>` / `<relevant_memories>` حذف می‌شود؛ بلوک‌های payload مربوط به XML فراخوانی ابزار در plain-text (`<tool_call>`، `<function_call>`، `<tool_calls>`، `<function_calls>`) حذف می‌شوند، شامل payloadهای بریده‌شده‌ای که هرگز تمیز بسته نمی‌شوند؛ scaffolding تنزل‌یافتهٔ فراخوانی/نتیجهٔ ابزار و markerهای historical-context حذف می‌شوند؛ tokenهای کنترل مدل لو رفته (`<|assistant|>`، سایر ASCII `<|...|>`، full-width `<｜...｜>`) حذف می‌شوند؛ XML فراخوانی ابزار MiniMax که malformed است حذف می‌شود.
- متن شبیه credential/token redacted می‌شود.
- بلوک‌های بلند می‌توانند truncated شوند.
- historyهای بسیار بزرگ می‌توانند ردیف‌های قدیمی‌تر را drop کنند یا یک ردیف بیش‌ازحد بزرگ را با `[sessions_history omitted: message too large]` جایگزین کنند.
- inspect کردن transcript خام روی disk fallback است وقتی به transcript کامل byte-for-byte نیاز دارید.

## سیاست ابزار

sub-agentها ابتدا از همان profile و pipeline سیاست ابزار والد یا agent هدف استفاده می‌کنند. پس از آن، OpenClaw لایهٔ محدودیت sub-agent را اعمال می‌کند.

بدون `tools.profile` محدودکننده، sub-agentها **همهٔ ابزارها به‌جز ابزارهای session** و ابزارهای سیستمی را می‌گیرند:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` اینجا هم یک نمای recall محدود و sanitized باقی می‌ماند — raw transcript dump نیست.

وقتی `maxSpawnDepth >= 2` باشد، sub-agentهای orchestrator عمق-1 علاوه بر آن `sessions_spawn`، `subagents`، `sessions_list` و
`sessions_history` را دریافت می‌کنند تا بتوانند فرزندانشان را مدیریت کنند.

### Override از طریق config

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` یک filter نهایی allow-only است. می‌تواند مجموعهٔ ابزار ازقبل resolveشده را محدودتر کند، اما نمی‌تواند ابزاری را که توسط `tools.profile` حذف شده **دوباره اضافه کند**. برای مثال، `tools.profile: "coding"` شامل
`web_search`/`web_fetch` هست اما ابزار `browser` را شامل نمی‌شود. برای اینکه به sub-agentهای coding-profile اجازه دهید از browser automation استفاده کنند، browser را در مرحلهٔ profile اضافه کنید:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

وقتی فقط یک agent باید browser automation بگیرد، از `agents.list[].tools.alsoAllow: ["browser"]` برای هر agent استفاده کنید.

## هم‌زمانی

sub-agentها از یک lane اختصاصی queue درون‌فرایندی استفاده می‌کنند:

- **نام lane:** `subagent`
- **هم‌زمانی:** `agents.defaults.subagents.maxConcurrent` (پیش‌فرض `8`)

## زنده‌بودن و بازیابی

OpenClaw نبود `endedAt` را proof دائمی برای اینکه یک sub-agent هنوز alive است در نظر نمی‌گیرد. اجراهای پایان‌نیافته‌ای که از پنجرهٔ stale-run قدیمی‌ترند، دیگر در `/subagents list`، خلاصه‌های وضعیت، descendant completion gating، و بررسی‌های هم‌زمانی برای هر session به‌عنوان active/pending شمرده نمی‌شوند.

پس از restart شدن gateway، اجراهای بازیابی‌شدهٔ کهنه و پایان‌نیافته prune می‌شوند مگر اینکه جلسهٔ فرزند آن‌ها با `abortedLastRun: true` علامت‌گذاری شده باشد. آن جلسه‌های فرزند که در restart aborted شده‌اند، از طریق جریان بازیابی orphan مربوط به sub-agent recoverable می‌مانند؛ این جریان قبل از پاک کردن marker مربوط به aborted، یک پیام resume synthetic می‌فرستد.

بازیابی restart خودکار برای هر جلسهٔ فرزند محدود است. اگر همان فرزند sub-agent درون پنجرهٔ rapid re-wedge به‌طور مکرر برای orphan recovery پذیرفته شود، OpenClaw یک recovery tombstone روی آن جلسه persist می‌کند و در restartهای بعدی auto-resume آن را متوقف می‌کند. برای reconcile کردن task record، `openclaw tasks maintenance --apply` را اجرا کنید، یا برای پاک کردن flagهای stale aborted recovery روی جلسه‌های tombstoned، `openclaw doctor --fix` را اجرا کنید.

<Note>
اگر spawn یک sub-agent با Gateway `PAIRING_REQUIRED` /
`scope-upgrade` شکست خورد، پیش از ویرایش وضعیت pairing، RPC caller را بررسی کنید.
هماهنگی داخلی `sessions_spawn` باید با
`client.id: "gateway-client"` و `client.mode: "backend"` از طریق auth مستقیم local loopback با shared-token/password متصل شود؛ آن مسیر به baseline مربوط به paired-device scope در CLI وابسته نیست. callerهای remote، `deviceIdentity` صریح، مسیرهای صریح device-token، و clientهای browser/node همچنان برای scope upgrade به approval عادی device نیاز دارند.
</Note>

## توقف

- فرستادن `/stop` در چت درخواست‌کننده، جلسهٔ درخواست‌کننده را abort می‌کند و هر اجرای active sub-agent را که از آن spawn شده باشد متوقف می‌کند و به فرزندان تو در تو سرایت می‌کند.
- `/subagents kill <id>` یک sub-agent مشخص را متوقف می‌کند و به فرزندانش سرایت می‌کند.

## محدودیت‌ها

- announce مربوط به sub-agent **best-effort** است. اگر gateway restart شود، کار pending «announce back» از دست می‌رود.
- sub-agentها همچنان منابع همان فرایند gateway را share می‌کنند؛ `maxConcurrent` را به‌عنوان safety valve در نظر بگیرید.
- `sessions_spawn` همیشه non-blocking است: بلافاصله `{ status: "accepted", runId, childSessionKey }` را برمی‌گرداند.
- context مربوط به sub-agent فقط `AGENTS.md`، `TOOLS.md`، `SOUL.md`، `IDENTITY.md` و `USER.md` را inject می‌کند (بدون `MEMORY.md`، `HEARTBEAT.md`، یا `BOOTSTRAP.md`).
- حداکثر عمق nesting برابر 5 است (بازهٔ `maxSpawnDepth`: 1–5). عمق 2 برای بیشتر use caseها توصیه می‌شود.
- `maxChildrenPerAgent` تعداد فرزندان active برای هر session را محدود می‌کند (پیش‌فرض `5`، بازهٔ `1–20`).

## مرتبط

- [agentهای ACP](/fa/tools/acp-agents)
- [ارسال agent](/fa/tools/agent-send)
- [taskهای پس‌زمینه](/fa/automation/tasks)
- [ابزارهای sandbox چند-agentی](/fa/tools/multi-agent-sandbox-tools)

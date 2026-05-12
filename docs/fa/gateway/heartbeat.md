---
read_when:
    - تنظیم تواتر Heartbeat یا پیام‌رسانی
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Heartbeat
summary: پیام‌های پرس‌وجوی Heartbeat و قوانین اعلان
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T23:30:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat در برابر cron؟** برای راهنمایی درباره زمان استفاده از هرکدام، [Automation](/fa/automation) را ببینید.
</Note>

Heartbeat در نشست اصلی **نوبت‌های دوره‌ای عامل** را اجرا می‌کند تا مدل بتواند هر چیزی را که نیازمند توجه است، بدون ارسال پیام‌های مزاحم به شما، مطرح کند.

Heartbeat یک نوبت زمان‌بندی‌شده در نشست اصلی است — رکوردهای [background task](/fa/automation/tasks) ایجاد **نمی‌کند**. رکوردهای کار برای کارهای جداشده هستند (اجرای ACP، زیرعامل‌ها، کارهای cron ایزوله).

عیب‌یابی: [Scheduled Tasks](/fa/automation/cron-jobs#troubleshooting)

## شروع سریع (مبتدی)

<Steps>
  <Step title="Pick a cadence">
    Heartbeat‌ها را فعال بگذارید (پیش‌فرض `30m` است، یا `1h` برای احراز هویت Anthropic OAuth/توکن، از جمله استفادهٔ دوباره از Claude CLI) یا ریتم خودتان را تنظیم کنید.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    یک چک‌لیست کوچک `HEARTBEAT.md` یا بلوک `tasks:` در فضای کاری عامل ایجاد کنید.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` مقدار پیش‌فرض است؛ برای مسیریابی به آخرین مخاطب، `target: "last"` را تنظیم کنید.
  </Step>
  <Step title="Optional tuning">
    - برای شفافیت، تحویل استدلال Heartbeat را فعال کنید.
    - اگر اجراهای Heartbeat فقط به `HEARTBEAT.md` نیاز دارند، از زمینهٔ راه‌اندازی سبک استفاده کنید.
    - برای جلوگیری از ارسال کل تاریخچهٔ مکالمه در هر Heartbeat، نشست‌های ایزوله را فعال کنید.
    - Heartbeat‌ها را به ساعت‌های فعال (زمان محلی) محدود کنید.

  </Step>
</Steps>

نمونه پیکربندی:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## پیش‌فرض‌ها

- بازه: `30m` (یا `1h` وقتی حالت احراز هویت تشخیص‌داده‌شده Anthropic OAuth/توکن باشد، از جمله استفادهٔ دوباره از Claude CLI). `agents.defaults.heartbeat.every` یا `agents.list[].heartbeat.every` را برای هر عامل تنظیم کنید؛ برای غیرفعال‌سازی از `0m` استفاده کنید.
- بدنهٔ پرامپت (قابل پیکربندی از طریق `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- پرامپت Heartbeat به‌صورت **لفظ‌به‌لفظ** به‌عنوان پیام کاربر ارسال می‌شود. پرامپت سیستم فقط وقتی Heartbeat‌ها برای عامل پیش‌فرض فعال باشند، شامل بخش «Heartbeat» می‌شود و اجرا به‌صورت داخلی علامت‌گذاری می‌شود.
- وقتی Heartbeat‌ها با `0m` غیرفعال باشند، اجراهای عادی نیز `HEARTBEAT.md` را از زمینهٔ راه‌اندازی حذف می‌کنند تا مدل دستورالعمل‌های مخصوص Heartbeat را نبیند.
- ساعت‌های فعال (`heartbeat.activeHours`) در منطقهٔ زمانی پیکربندی‌شده بررسی می‌شوند. خارج از این بازه، Heartbeat‌ها تا تیک بعدی داخل بازه نادیده گرفته می‌شوند.
- Heartbeat‌ها هنگام فعال یا در صف بودن کار cron به‌طور خودکار به تعویق می‌افتند. برای اینکه یک عامل هنگام شلوغ بودن زیرعاملِ کلیددار به نشست یا مسیرهای فرمان تو در توی خودش نیز به تعویق بیفتد، `heartbeat.skipWhenBusy: true` را تنظیم کنید؛ عامل‌های هم‌سطح دیگر فقط به‌دلیل اینکه عامل دیگری کار زیرعامل در جریان دارد متوقف نمی‌شوند.

## پرامپت Heartbeat برای چیست

پرامپت پیش‌فرض عمداً گسترده است:

- **کارهای پس‌زمینه**: «در نظر گرفتن کارهای معوق» عامل را تشویق می‌کند پیگیری‌ها را مرور کند (صندوق ورودی، تقویم، یادآورها، کارهای در صف) و هر مورد فوری را مطرح کند.
- **سر زدن به انسان**: «گاهی در طول روز به انسان خود سر بزن» یک پیام سبک و گاه‌به‌گاه از نوع «چیزی نیاز داری؟» را تشویق می‌کند، اما با استفاده از منطقهٔ زمانی محلی پیکربندی‌شدهٔ شما، از پیام‌های مزاحم شبانه جلوگیری می‌کند (به [Timezone](/fa/concepts/timezone) مراجعه کنید).

Heartbeat می‌تواند به [background tasks](/fa/automation/tasks) تکمیل‌شده واکنش نشان دهد، اما خودِ اجرای Heartbeat رکورد کار ایجاد نمی‌کند.

اگر می‌خواهید Heartbeat کاری بسیار مشخص انجام دهد (مثلاً «آمار Gmail PubSub را بررسی کن» یا «سلامت Gateway را تأیید کن»)، `agents.defaults.heartbeat.prompt` (یا `agents.list[].heartbeat.prompt`) را روی یک بدنهٔ سفارشی تنظیم کنید (لفظ‌به‌لفظ ارسال می‌شود).

## قرارداد پاسخ

- اگر چیزی نیازمند توجه نیست، با **`HEARTBEAT_OK`** پاسخ دهید.
- اجراهای Heartbeat دارای قابلیت ابزار می‌توانند در عوض `heartbeat_respond` را با `notify: false` برای نداشتن به‌روزرسانی قابل مشاهده، یا `notify: true` به‌همراه `notificationText` برای هشدار فراخوانی کنند. در صورت وجود، پاسخ ساخت‌یافتهٔ ابزار بر متن جایگزین اولویت دارد.
- در طول اجراهای Heartbeat، OpenClaw وقتی `HEARTBEAT_OK` در **ابتدا یا انتهای** پاسخ ظاهر شود آن را تأییدیه تلقی می‌کند. این توکن حذف می‌شود و اگر محتوای باقی‌مانده **≤ `ackMaxChars`** باشد، پاسخ کنار گذاشته می‌شود (پیش‌فرض: 300).
- اگر `HEARTBEAT_OK` در **میانهٔ** پاسخ ظاهر شود، رفتار ویژه‌ای با آن نمی‌شود.
- برای هشدارها، `HEARTBEAT_OK` را وارد **نکنید**؛ فقط متن هشدار را برگردانید.

خارج از Heartbeat‌ها، `HEARTBEAT_OK` سرگردان در ابتدا/انتهای پیام حذف و ثبت می‌شود؛ پیامی که فقط `HEARTBEAT_OK` باشد کنار گذاشته می‌شود.

## پیکربندی

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### دامنه و تقدم

- `agents.defaults.heartbeat` رفتار سراسری Heartbeat را تنظیم می‌کند.
- `agents.list[].heartbeat` روی آن ادغام می‌شود؛ اگر هر عاملی بلوک `heartbeat` داشته باشد، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند.
- `channels.defaults.heartbeat` پیش‌فرض‌های نمایش‌پذیری را برای همهٔ کانال‌ها تنظیم می‌کند.
- `channels.<channel>.heartbeat` پیش‌فرض‌های کانال را بازنویسی می‌کند.
- `channels.<channel>.accounts.<id>.heartbeat` (کانال‌های چندحسابی) تنظیمات هر کانال را بازنویسی می‌کند.

### Heartbeat‌های هر عامل

اگر هر ورودی `agents.list[]` شامل بلوک `heartbeat` باشد، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند. بلوک هر عامل روی `agents.defaults.heartbeat` ادغام می‌شود (پس می‌توانید پیش‌فرض‌های مشترک را یک بار تنظیم کنید و برای هر عامل بازنویسی کنید).

نمونه: دو عامل، فقط عامل دوم Heartbeat اجرا می‌کند.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### نمونهٔ ساعت‌های فعال

Heartbeat‌ها را به ساعت‌های کاری در یک منطقهٔ زمانی مشخص محدود کنید:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

خارج از این بازه (قبل از 9 صبح یا بعد از 10 شب به وقت شرق آمریکا)، Heartbeat‌ها نادیده گرفته می‌شوند. تیک زمان‌بندی‌شدهٔ بعدی داخل بازه به‌صورت عادی اجرا می‌شود.

### راه‌اندازی 24/7

اگر می‌خواهید Heartbeat‌ها تمام روز اجرا شوند، از یکی از این الگوها استفاده کنید:

- `activeHours` را کاملاً حذف کنید (بدون محدودیت بازهٔ زمانی؛ این رفتار پیش‌فرض است).
- یک بازهٔ تمام‌روزه تنظیم کنید: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
زمان `start` و `end` یکسان تنظیم نکنید (برای مثال `08:00` تا `08:00`). این حالت به‌عنوان بازه‌ای با عرض صفر در نظر گرفته می‌شود، بنابراین Heartbeat‌ها همیشه نادیده گرفته می‌شوند.
</Warning>

### نمونهٔ چندحسابی

برای هدف‌گیری یک حساب مشخص در کانال‌های چندحسابی مانند Telegram از `accountId` استفاده کنید:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### یادداشت‌های فیلد

<ParamField path="every" type="string">
  بازهٔ Heartbeat (رشتهٔ مدت‌زمان؛ واحد پیش‌فرض = دقیقه).
</ParamField>
<ParamField path="model" type="string">
  بازنویسی اختیاری مدل برای اجراهای Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  وقتی فعال باشد، پیام جداگانهٔ `Reasoning:` را نیز در صورت موجود بودن تحویل می‌دهد (همان شکل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  وقتی true باشد، اجراهای Heartbeat از زمینهٔ راه‌اندازی سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های راه‌اندازی فضای کاری نگه می‌دارند.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  وقتی true باشد، هر Heartbeat در یک نشست تازه و بدون تاریخچهٔ مکالمهٔ قبلی اجرا می‌شود. از همان الگوی ایزوله‌سازی cron `sessionTarget: "isolated"` استفاده می‌کند. هزینهٔ توکن هر Heartbeat را به‌شدت کاهش می‌دهد. برای بیشترین صرفه‌جویی با `lightContext: true` ترکیب کنید. مسیریابی تحویل همچنان از زمینهٔ نشست اصلی استفاده می‌کند.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  وقتی true باشد، اجراهای Heartbeat روی مسیرهای شلوغ اضافی همان عامل به تعویق می‌افتند: زیرعاملِ کلیددار به نشست خودش یا کار فرمان تو در تو. مسیرهای Cron همیشه Heartbeat‌ها را به تعویق می‌اندازند، حتی بدون این پرچم، تا میزبان‌های مدل محلی پرامپت‌های cron و Heartbeat را هم‌زمان اجرا نکنند.
</ParamField>
<ParamField path="session" type="string">
  کلید نشست اختیاری برای اجراهای Heartbeat.

- `main` (پیش‌فرض): نشست اصلی عامل.
- کلید نشست صریح (از `openclaw sessions --json` یا [sessions CLI](/fa/cli/sessions) کپی کنید).
- قالب‌های کلید نشست: [Sessions](/fa/concepts/session) و [Groups](/fa/channels/groups) را ببینید.

</ParamField>
<ParamField path="target" type="string">
- `last`: تحویل به آخرین کانال خارجی استفاده‌شده.
- کانال صریح: هر کانال یا شناسهٔ Plugin پیکربندی‌شده، برای مثال `discord`، `matrix`، `telegram`، یا `whatsapp`.
- `none` (پیش‌فرض): Heartbeat را اجرا می‌کند اما بیرونی تحویل **نمی‌دهد**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  رفتار تحویل مستقیم/DM را کنترل می‌کند. `allow`: اجازهٔ تحویل مستقیم/DM Heartbeat. `block`: تحویل مستقیم/DM را متوقف می‌کند (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  بازنویسی اختیاری گیرنده (شناسهٔ ویژهٔ کانال، مثلاً E.164 برای WhatsApp یا شناسهٔ گفت‌وگوی Telegram). برای موضوع‌ها/رشته‌های Telegram، از `<chatId>:topic:<messageThreadId>` استفاده کنید.

</ParamField>
<ParamField path="accountId" type="string">
  شناسهٔ حساب اختیاری برای کانال‌های چندحسابی. وقتی `target: "last"` باشد، شناسهٔ حساب روی آخرین کانال حل‌شده اعمال می‌شود اگر آن کانال از حساب‌ها پشتیبانی کند؛ در غیر این صورت نادیده گرفته می‌شود. اگر شناسهٔ حساب با حساب پیکربندی‌شده‌ای برای کانال حل‌شده مطابقت نداشته باشد، تحویل نادیده گرفته می‌شود.

</ParamField>
<ParamField path="prompt" type="string">
  بدنه پیش‌فرض پرامپت را بازنویسی می‌کند (ادغام نمی‌شود).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  بیشینه تعداد نویسه‌های مجاز پس از `HEARTBEAT_OK` پیش از تحویل.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  وقتی true باشد، payloadهای هشدار خطای ابزار را هنگام اجرای Heartbeat سرکوب می‌کند.

</ParamField>
<ParamField path="activeHours" type="object">
  اجرای Heartbeat را به یک بازه زمانی محدود می‌کند. شیئی با `start` ‏(HH:MM، شامل؛ برای آغاز روز از `00:00` استفاده کنید)، `end` ‏(HH:MM غیرشامل؛ `24:00` برای پایان روز مجاز است)، و `timezone` اختیاری.

- حذف‌شده یا `"user"`: اگر `agents.defaults.userTimezone` تنظیم شده باشد از آن استفاده می‌کند، وگرنه به منطقه زمانی سیستم میزبان برمی‌گردد.
- `"local"`: همیشه از منطقه زمانی سیستم میزبان استفاده می‌کند.
- هر شناسه IANA (مثلاً `America/New_York`): مستقیماً استفاده می‌شود؛ اگر نامعتبر باشد، به رفتار `"user"` بالا برمی‌گردد.
- `start` و `end` نباید برای یک پنجره فعال برابر باشند؛ مقدارهای برابر به‌عنوان پنجره با عرض صفر در نظر گرفته می‌شوند (همیشه خارج از پنجره).
- خارج از پنجره فعال، Heartbeatها تا تیک بعدی داخل پنجره رد می‌شوند.

</ParamField>

## رفتار تحویل

<AccordionGroup>
  <Accordion title="مسیر‌دهی نشست و مقصد">
    - Heartbeatها به‌طور پیش‌فرض در نشست اصلی عامل اجرا می‌شوند (`agent:<id>:<mainKey>`)، یا وقتی `session.scope = "global"` باشد در `global`. برای بازنویسی به یک نشست کانال مشخص (Discord/WhatsApp/غیره)، `session` را تنظیم کنید.
    - `session` فقط بر زمینه اجرا اثر می‌گذارد؛ تحویل با `target` و `to` کنترل می‌شود.
    - برای تحویل به یک کانال/گیرنده مشخص، `target` + `to` را تنظیم کنید. با `target: "last"`، تحویل از آخرین کانال بیرونی برای آن نشست استفاده می‌کند.
    - تحویل‌های Heartbeat به‌طور پیش‌فرض مقصدهای مستقیم/DM را مجاز می‌دانند. برای سرکوب ارسال به مقصد مستقیم در حالی که نوبت Heartbeat همچنان اجرا می‌شود، `directPolicy: "block"` را تنظیم کنید.
    - اگر صف اصلی، مسیر نشست مقصد، مسیر Cron، یا یک کار Cron فعال مشغول باشد، Heartbeat رد می‌شود و بعداً دوباره تلاش می‌شود.
    - اگر `skipWhenBusy: true` باشد، subagent کلیدخورده به نشست این عامل و مسیرهای تو‌در‌تو نیز اجرای Heartbeat را به تعویق می‌اندازند. مسیرهای مشغول عامل‌های دیگر این عامل را به تعویق نمی‌اندازند.
    - اگر `target` به هیچ مقصد بیرونی حل نشود، اجرا همچنان انجام می‌شود اما هیچ پیام خروجی ارسال نمی‌شود.

  </Accordion>
  <Accordion title="رفتار نمایش و رد شدن">
    - اگر `showOk`، `showAlerts`، و `useIndicator` همگی غیرفعال باشند، اجرا از ابتدا با `reason=alerts-disabled` رد می‌شود.
    - اگر فقط تحویل هشدار غیرفعال باشد، OpenClaw همچنان می‌تواند Heartbeat را اجرا کند، timestampهای کارهای موعددار را به‌روزرسانی کند، timestamp بیکاری نشست را بازیابی کند، و payload هشدار بیرونی را سرکوب کند.
    - اگر مقصد حل‌شده Heartbeat از typing پشتیبانی کند، OpenClaw هنگام فعال بودن اجرای Heartbeat، typing را نمایش می‌دهد. این از همان مقصدی استفاده می‌کند که Heartbeat خروجی چت را به آن می‌فرستاد، و با `typingMode: "never"` غیرفعال می‌شود.

  </Accordion>
  <Accordion title="چرخه عمر نشست و ممیزی">
    - پاسخ‌های فقط Heartbeat نشست را زنده نگه نمی‌دارند. metadata مربوط به Heartbeat ممکن است ردیف نشست را به‌روزرسانی کند، اما انقضای بیکاری از `lastInteractionAt` آخرین پیام واقعی کاربر/کانال استفاده می‌کند، و انقضای روزانه از `sessionStartedAt`.
    - Control UI و تاریخچه WebChat، پرامپت‌های Heartbeat و تأییدهای فقط OK را پنهان می‌کنند. transcript زیرین نشست همچنان می‌تواند آن نوبت‌ها را برای ممیزی/بازپخش در خود داشته باشد.
    - [کارهای پس‌زمینه](/fa/automation/tasks) جداشده می‌توانند یک رویداد سیستمی را در صف بگذارند و وقتی نشست اصلی باید سریع متوجه چیزی شود، Heartbeat را بیدار کنند. آن بیدارسازی باعث نمی‌شود اجرای Heartbeat به یک کار پس‌زمینه تبدیل شود.

  </Accordion>
</AccordionGroup>

## کنترل‌های نمایش

به‌طور پیش‌فرض، تأییدهای `HEARTBEAT_OK` سرکوب می‌شوند در حالی که محتوای هشدار تحویل داده می‌شود. می‌توانید این را برای هر کانال یا هر حساب تنظیم کنید:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

اولویت: هر حساب → هر کانال → پیش‌فرض‌های کانال → پیش‌فرض‌های داخلی.

### هر پرچم چه کاری می‌کند

- `showOk`: وقتی مدل یک پاسخ فقط OK برمی‌گرداند، یک تأیید `HEARTBEAT_OK` ارسال می‌کند.
- `showAlerts`: وقتی مدل یک پاسخ غیر OK برمی‌گرداند، محتوای هشدار را ارسال می‌کند.
- `useIndicator`: رویدادهای indicator را برای سطح‌های وضعیت UI منتشر می‌کند.

اگر **هر سه** false باشند، OpenClaw اجرای Heartbeat را کاملاً رد می‌کند (بدون فراخوانی مدل).

### نمونه‌های هر کانال در برابر هر حساب

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### الگوهای رایج

| هدف                                      | پیکربندی                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| رفتار پیش‌فرض (OKهای بی‌صدا، هشدارها روشن) | _(هیچ پیکربندی لازم نیست)_                                                               |
| کاملاً بی‌صدا (بدون پیام، بدون indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| فقط indicator (بدون پیام)                | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKها فقط در یک کانال                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختیاری)

اگر فایل `HEARTBEAT.md` در workspace وجود داشته باشد، پرامپت پیش‌فرض به عامل می‌گوید آن را بخواند. آن را «چک‌لیست Heartbeat» خود در نظر بگیرید: کوچک، پایدار، و امن برای گنجاندن هر ۳۰ دقیقه.

در اجراهای عادی، `HEARTBEAT.md` فقط زمانی تزریق می‌شود که راهنمایی Heartbeat برای عامل پیش‌فرض فعال باشد. غیرفعال کردن cadence مربوط به Heartbeat با `0m` یا تنظیم `includeSystemPromptSection: false` آن را از زمینه bootstrap عادی حذف می‌کند.

اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خط‌های خالی و سربرگ‌های markdown مانند `# Heading`)، OpenClaw اجرای Heartbeat را برای صرفه‌جویی در فراخوانی‌های API رد می‌کند. این رد شدن با `reason=empty-heartbeat-file` گزارش می‌شود. اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کار کند.

آن را بسیار کوچک نگه دارید (چک‌لیست یا یادآوری‌های کوتاه) تا از بزرگ شدن بیش از حد پرامپت جلوگیری شود.

نمونه `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### بلوک‌های `tasks:`

`HEARTBEAT.md` همچنین از یک بلوک ساختاریافته کوچک `tasks:` برای بررسی‌های مبتنی بر فاصله زمانی داخل خود Heartbeat پشتیبانی می‌کند.

نمونه:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="رفتار">
    - OpenClaw بلوک `tasks:` را parse می‌کند و هر کار را در برابر `interval` خودش بررسی می‌کند.
    - فقط کارهای **موعدرسیده** در پرامپت Heartbeat برای آن تیک گنجانده می‌شوند.
    - اگر هیچ کاری موعدرسیده نباشد، Heartbeat کاملاً رد می‌شود (`reason=no-tasks-due`) تا از فراخوانی هدررفته مدل جلوگیری شود.
    - محتوای غیرکار در `HEARTBEAT.md` حفظ می‌شود و به‌عنوان زمینه اضافی پس از فهرست کارهای موعدرسیده افزوده می‌شود.
    - timestampهای آخرین اجرای کار در وضعیت نشست (`heartbeatTaskState`) ذخیره می‌شوند، بنابراین فاصله‌ها از راه‌اندازی‌های دوباره عادی جان سالم به در می‌برند.
    - timestampهای کار فقط پس از آن جلو برده می‌شوند که اجرای Heartbeat مسیر پاسخ عادی خود را کامل کند. اجراهای ردشده `empty-heartbeat-file` / `no-tasks-due` کارها را کامل‌شده علامت نمی‌زنند.

  </Accordion>
</AccordionGroup>

حالت کار زمانی مفید است که بخواهید یک فایل Heartbeat چندین بررسی دوره‌ای را نگه دارد، بدون اینکه در هر تیک هزینه همه آن‌ها را بپردازید.

### آیا عامل می‌تواند HEARTBEAT.md را به‌روزرسانی کند؟

بله — اگر از آن بخواهید.

`HEARTBEAT.md` فقط یک فایل عادی در workspace عامل است، بنابراین می‌توانید به عامل (در یک چت عادی) چیزی شبیه این بگویید:

- «`HEARTBEAT.md` را به‌روزرسانی کن تا یک بررسی روزانه تقویم اضافه شود.»
- «`HEARTBEAT.md` را بازنویسی کن تا کوتاه‌تر و متمرکز بر پیگیری‌های inbox باشد.»

اگر می‌خواهید این کار به‌صورت پیش‌دستانه انجام شود، می‌توانید یک خط صریح نیز در پرامپت Heartbeat خود بگنجانید، مانند: «اگر چک‌لیست کهنه شد، HEARTBEAT.md را با نسخه بهتری به‌روزرسانی کن.»

<Warning>
رازها (کلیدهای API، شماره‌های تلفن، tokenهای خصوصی) را در `HEARTBEAT.md` قرار ندهید — این فایل بخشی از زمینه پرامپت می‌شود.
</Warning>

## بیدارسازی دستی (درخواستی)

می‌توانید یک رویداد سیستمی را در صف بگذارید و یک Heartbeat فوری را با این دستور فعال کنید:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

اگر چندین عامل `heartbeat` پیکربندی کرده باشند، بیدارسازی دستی هر یک از آن Heartbeatهای عامل را فوراً اجرا می‌کند.

برای انتظار تا تیک زمان‌بندی‌شده بعدی، از `--mode next-heartbeat` استفاده کنید.

## تحویل Reasoning (اختیاری)

به‌طور پیش‌فرض، Heartbeatها فقط payload نهایی «پاسخ» را تحویل می‌دهند.

اگر شفافیت می‌خواهید، فعال کنید:

- `agents.defaults.heartbeat.includeReasoning: true`

وقتی فعال باشد، Heartbeatها همچنین یک پیام جداگانه با پیشوند `Reasoning:` تحویل می‌دهند (همان شکل `/reasoning on`). این می‌تواند زمانی مفید باشد که عامل چندین نشست/codex را مدیریت می‌کند و می‌خواهید ببینید چرا تصمیم گرفته به شما پیام بدهد — اما همچنین می‌تواند جزئیات داخلی بیشتری از آنچه می‌خواهید افشا کند. بهتر است در چت‌های گروهی آن را خاموش نگه دارید.

## آگاهی از هزینه

Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند. فاصله‌های کوتاه‌تر token بیشتری مصرف می‌کنند. برای کاهش هزینه:

- از `isolatedSession: true` استفاده کنید تا از ارسال تاریخچه کامل مکالمه جلوگیری شود (~100K token به ~2-5K در هر اجرا).
- از `lightContext: true` استفاده کنید تا فایل‌های bootstrap فقط به `HEARTBEAT.md` محدود شوند.
- یک `model` ارزان‌تر تنظیم کنید (مثلاً `ollama/llama3.2:1b`).
- `HEARTBEAT.md` را کوچک نگه دارید.
- اگر فقط به‌روزرسانی‌های وضعیت داخلی می‌خواهید، از `target: "none"` استفاده کنید.

## سرریز زمینه پس از Heartbeat

اگر یک Heartbeat قبلاً یک نشست موجود را روی یک مدل محلی کوچک‌تر گذاشته باشد، برای مثال یک مدل Ollama با پنجره 32k، و نوبت بعدی نشست اصلی سرریز زمینه را گزارش کند، مدل runtime نشست را به مدل اصلی پیکربندی‌شده بازنشانی کنید. پیام بازنشانی OpenClaw این موضوع را وقتی آخرین مدل runtime با `heartbeat.model` پیکربندی‌شده برابر باشد صریحاً ذکر می‌کند.

Heartbeatهای فعلی پس از کامل شدن اجرا، مدل runtime موجود نشست مشترک را حفظ می‌کنند. همچنان می‌توانید از `isolatedSession: true` برای اجرای Heartbeatها در یک نشست تازه استفاده کنید، آن را با `lightContext: true` برای کوچک‌ترین پرامپت ترکیب کنید، یا یک مدل Heartbeat با پنجره زمینه‌ای انتخاب کنید که برای نشست مشترک به‌اندازه کافی بزرگ باشد.

## مرتبط

- [اتوماسیون](/fa/automation) — همه سازوکارهای اتوماسیون در یک نگاه
- [کارهای پس‌زمینه](/fa/automation/tasks) — کار جداشده چگونه ردیابی می‌شود
- [منطقه زمانی](/fa/concepts/timezone) — منطقه زمانی چگونه بر زمان‌بندی Heartbeat اثر می‌گذارد
- [عیب‌یابی](/fa/automation/cron-jobs#troubleshooting) — اشکال‌زدایی مشکلات اتوماسیون

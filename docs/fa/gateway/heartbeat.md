---
read_when:
    - تنظیم تناوب Heartbeat یا پیام‌رسانی
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Heartbeat
summary: پیام‌های پرس‌وجوی دوره‌ای Heartbeat و قواعد اعلان‌ها
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T11:46:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8198c74e2712c7ed9d34c41bad7c4e9be62043e8755cb4c9a60649222e04e37
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat یا cron؟** برای راهنمایی درباره اینکه چه زمانی از هرکدام استفاده کنید، [اتوماسیون و وظایف](/fa/automation) را ببینید.
</Note>

Heartbeat **نوبت‌های دوره‌ای عامل** را در نشست اصلی اجرا می‌کند تا مدل بتواند هر چیزی را که نیازمند توجه است، بدون ارسال پیام‌های مزاحم به شما مطرح کند.

Heartbeat یک نوبت زمان‌بندی‌شده در نشست اصلی است — [رکوردهای وظیفه پس‌زمینه](/fa/automation/tasks) ایجاد **نمی‌کند**. رکوردهای وظیفه برای کارهای جداشده هستند (اجرای ACP، زیردستیارها، کارهای cron ایزوله).

عیب‌یابی: [وظایف زمان‌بندی‌شده](/fa/automation/cron-jobs#troubleshooting)

## شروع سریع (مبتدی)

<Steps>
  <Step title="انتخاب تناوب">
    Heartbeatها را فعال نگه دارید (پیش‌فرض `30m` است، یا برای احراز هویت Anthropic OAuth/توکن، شامل استفاده مجدد از Claude CLI، `1h`) یا تناوب دلخواه خود را تنظیم کنید.
  </Step>
  <Step title="افزودن HEARTBEAT.md (اختیاری)">
    یک چک‌لیست کوچک `HEARTBEAT.md` یا بلوک `tasks:` در فضای کاری عامل ایجاد کنید.
  </Step>
  <Step title="تصمیم بگیرید پیام‌های Heartbeat کجا بروند">
    `target: "none"` پیش‌فرض است؛ برای مسیردهی به آخرین مخاطب، `target: "last"` را تنظیم کنید.
  </Step>
  <Step title="تنظیم اختیاری">
    - تحویل استدلال Heartbeat را برای شفافیت فعال کنید.
    - اگر اجرای Heartbeatها فقط به `HEARTBEAT.md` نیاز دارد، از زمینه راه‌اندازی سبک استفاده کنید.
    - نشست‌های ایزوله را فعال کنید تا در هر Heartbeat کل تاریخچه گفت‌وگو ارسال نشود.
    - Heartbeatها را به ساعت‌های فعال محدود کنید (زمان محلی).

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
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## پیش‌فرض‌ها

- بازه: `30m` (یا وقتی حالت احراز هویت تشخیص‌داده‌شده، احراز هویت Anthropic OAuth/توکن است، شامل استفاده مجدد از Claude CLI، `1h`). `agents.defaults.heartbeat.every` یا `agents.list[].heartbeat.every` را برای هر عامل تنظیم کنید؛ برای غیرفعال‌سازی از `0m` استفاده کنید.
- متن prompt (قابل پیکربندی از طریق `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- prompt مربوط به Heartbeat **عیناً** به‌عنوان پیام کاربر ارسال می‌شود. prompt سیستمی فقط وقتی Heartbeatها برای عامل پیش‌فرض فعال باشند، بخش «Heartbeat» را شامل می‌شود، و اجرا به‌صورت داخلی علامت‌گذاری می‌شود.
- وقتی Heartbeatها با `0m` غیرفعال می‌شوند، اجراهای عادی نیز `HEARTBEAT.md` را از زمینه راه‌اندازی حذف می‌کنند تا مدل دستورالعمل‌های مخصوص Heartbeat را نبیند.
- ساعت‌های فعال (`heartbeat.activeHours`) در منطقه زمانی پیکربندی‌شده بررسی می‌شوند. بیرون از این بازه، Heartbeatها تا تیک بعدی داخل بازه رد می‌شوند.
- Heartbeatها هنگام فعال بودن یا در صف بودن کار cron، خودکار به تعویق می‌افتند. برای تعویق در مسیرهای شلوغ اضافی (کار زیردستیار یا فرمان‌های تو در تو) نیز `heartbeat.skipWhenBusy: true` را تنظیم کنید؛ این برای Ollama محلی و میزبان‌های تک‌اجرایی محدود دیگر مفید است.

## prompt مربوط به Heartbeat برای چیست

prompt پیش‌فرض عمداً کلی است:

- **وظایف پس‌زمینه**: «در نظر گرفتن وظایف معوق» عامل را ترغیب می‌کند پیگیری‌ها (صندوق ورودی، تقویم، یادآورها، کارهای صف‌شده) را مرور کند و هر چیز فوری را مطرح کند.
- **احوال‌پرسی از انسان**: «گاهی در طول روز از انسان خود احوال‌پرسی کن» یک پیام سبک گهگاهی مانند «چیزی نیاز دارید؟» را ترغیب می‌کند، اما با استفاده از منطقه زمانی محلی پیکربندی‌شده شما از پیام‌های مزاحم شبانه جلوگیری می‌کند (ببینید [منطقه زمانی](/fa/concepts/timezone)).

Heartbeat می‌تواند به [وظایف پس‌زمینه](/fa/automation/tasks) تکمیل‌شده واکنش نشان دهد، اما خود اجرای Heartbeat رکورد وظیفه ایجاد نمی‌کند.

اگر می‌خواهید Heartbeat کار بسیار مشخصی انجام دهد (مثلاً «آمار Gmail PubSub را بررسی کن» یا «سلامت gateway را تأیید کن»)، `agents.defaults.heartbeat.prompt` (یا `agents.list[].heartbeat.prompt`) را روی متن سفارشی تنظیم کنید (عیناً ارسال می‌شود).

## قرارداد پاسخ

- اگر چیزی نیازمند توجه نیست، با **`HEARTBEAT_OK`** پاسخ دهید.
- اجراهای Heartbeat که توانایی ابزار دارند، می‌توانند به‌جای آن `heartbeat_respond` را با `notify: false` برای عدم نمایش به‌روزرسانی قابل مشاهده، یا `notify: true` به‌همراه `notificationText` برای هشدار فراخوانی کنند. در صورت وجود، پاسخ ساختاریافته ابزار بر جایگزین متنی اولویت دارد.
- هنگام اجرای Heartbeat، OpenClaw وقتی `HEARTBEAT_OK` در **ابتدا یا انتهای** پاسخ ظاهر شود، آن را به‌عنوان تأیید در نظر می‌گیرد. این توکن حذف می‌شود و اگر محتوای باقی‌مانده **≤ `ackMaxChars`** باشد، پاسخ کنار گذاشته می‌شود (پیش‌فرض: 300).
- اگر `HEARTBEAT_OK` در **میانه** پاسخ ظاهر شود، رفتار ویژه‌ای با آن نمی‌شود.
- برای هشدارها، `HEARTBEAT_OK` را درج **نکنید**؛ فقط متن هشدار را برگردانید.

بیرون از Heartbeatها، `HEARTBEAT_OK` سرگردان در ابتدا/انتهای یک پیام حذف و ثبت می‌شود؛ پیامی که فقط `HEARTBEAT_OK` باشد، کنار گذاشته می‌شود.

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
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
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
- `channels.defaults.heartbeat` پیش‌فرض‌های نمایش را برای همه کانال‌ها تنظیم می‌کند.
- `channels.<channel>.heartbeat` پیش‌فرض‌های کانال را بازنویسی می‌کند.
- `channels.<channel>.accounts.<id>.heartbeat` (کانال‌های چندحسابی) تنظیمات هر کانال را بازنویسی می‌کند.

### Heartbeat برای هر عامل

اگر هر ورودی `agents.list[]` شامل یک بلوک `heartbeat` باشد، **فقط همان عامل‌ها** Heartbeat را اجرا می‌کنند. بلوک هر عامل روی `agents.defaults.heartbeat` ادغام می‌شود (بنابراین می‌توانید پیش‌فرض‌های مشترک را یک‌بار تنظیم کنید و برای هر عامل بازنویسی کنید).

مثال: دو عامل، فقط عامل دوم Heartbeat را اجرا می‌کند.

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

### نمونه ساعات فعال

Heartbeat را به ساعات کاری در یک منطقه زمانی مشخص محدود کنید:

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

خارج از این بازه (قبل از ساعت ۹ صبح یا بعد از ۱۰ شب به وقت شرق آمریکا)، Heartbeat رد می‌شود. تیک زمان‌بندی‌شده بعدی داخل این بازه به‌طور عادی اجرا خواهد شد.

### راه‌اندازی ۲۴/۷

اگر می‌خواهید Heartbeat در تمام طول روز اجرا شود، از یکی از این الگوها استفاده کنید:

- `activeHours` را کاملاً حذف کنید (بدون محدودیت بازه زمانی؛ این رفتار پیش‌فرض است).
- یک بازه تمام‌روز تنظیم کنید: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
زمان `start` و `end` یکسان تنظیم نکنید (برای مثال `08:00` تا `08:00`). این حالت به‌عنوان یک بازه با عرض صفر در نظر گرفته می‌شود، بنابراین Heartbeat همیشه رد می‌شود.
</Warning>

### نمونه چندحسابی

برای هدف‌گیری یک حساب مشخص در کانال‌های چندحسابی مانند Telegram، از `accountId` استفاده کنید:

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

### نکات فیلدها

<ParamField path="every" type="string">
  بازه Heartbeat (رشته مدت‌زمان؛ واحد پیش‌فرض = دقیقه).
</ParamField>
<ParamField path="model" type="string">
  بازنویسی اختیاری مدل برای اجرای Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  وقتی فعال باشد، پیام جداگانه `Reasoning:` را نیز در صورت موجود بودن تحویل می‌دهد (همان شکل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  وقتی درست باشد، اجرای Heartbeat از زمینه راه‌اندازی سبک استفاده می‌کند و فقط `HEARTBEAT.md` را از فایل‌های راه‌اندازی فضای کاری نگه می‌دارد.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  وقتی درست باشد، هر Heartbeat در یک نشست تازه و بدون تاریخچه مکالمه قبلی اجرا می‌شود. از همان الگوی جداسازی cron با `sessionTarget: "isolated"` استفاده می‌کند. هزینه توکن هر Heartbeat را به‌شدت کاهش می‌دهد. برای بیشترین صرفه‌جویی، با `lightContext: true` ترکیب کنید. مسیریابی تحویل همچنان از زمینه نشست اصلی استفاده می‌کند.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  وقتی درست باشد، اجرای Heartbeat در مسیرهای بسیار شلوغ به تعویق می‌افتد: کار subagent یا فرمان تودرتو. مسیرهای Cron همیشه Heartbeat را به تعویق می‌اندازند، حتی بدون این پرچم، تا میزبان‌های مدل محلی promptهای cron و Heartbeat را هم‌زمان اجرا نکنند.
</ParamField>
<ParamField path="session" type="string">
  کلید نشست اختیاری برای اجرای Heartbeat.

- `main` (پیش‌فرض): نشست اصلی عامل.
- کلید نشست صریح (از `openclaw sessions --json` یا [CLI نشست‌ها](/fa/cli/sessions) کپی کنید).
- قالب‌های کلید نشست: [نشست‌ها](/fa/concepts/session) و [گروه‌ها](/fa/channels/groups) را ببینید.

</ParamField>
<ParamField path="target" type="string">
- `last`: تحویل به آخرین کانال خارجی استفاده‌شده.
- کانال صریح: هر کانال پیکربندی‌شده یا شناسه Plugin، برای مثال `discord`، `matrix`، `telegram` یا `whatsapp`.
- `none` (پیش‌فرض): Heartbeat را اجرا می‌کند اما به بیرون **تحویل نمی‌دهد**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  رفتار تحویل مستقیم/DM را کنترل می‌کند. `allow`: تحویل مستقیم/DM Heartbeat را مجاز می‌کند. `block`: تحویل مستقیم/DM را سرکوب می‌کند (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  بازنویسی اختیاری گیرنده (شناسه مخصوص کانال، برای مثال E.164 برای WhatsApp یا شناسه چت Telegram). برای موضوع‌ها/رشته‌های Telegram، از `<chatId>:topic:<messageThreadId>` استفاده کنید.

</ParamField>
<ParamField path="accountId" type="string">
  شناسه حساب اختیاری برای کانال‌های چندحسابی. وقتی `target: "last"` باشد، شناسه حساب در صورت پشتیبانی کانال نهایی از حساب‌ها، روی آخرین کانال حل‌شده اعمال می‌شود؛ در غیر این صورت نادیده گرفته می‌شود. اگر شناسه حساب با حساب پیکربندی‌شده‌ای برای کانال حل‌شده مطابقت نداشته باشد، تحویل رد می‌شود.

</ParamField>
<ParamField path="prompt" type="string">
  متن پیش‌فرض prompt را بازنویسی می‌کند (ادغام نمی‌شود).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  بیشینه نویسه‌های مجاز پس از `HEARTBEAT_OK` پیش از تحویل.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  وقتی true باشد، payloadهای هشدار خطای ابزار را هنگام اجرای Heartbeat سرکوب می‌کند.

</ParamField>
<ParamField path="activeHours" type="object">
  اجرای Heartbeat را به یک بازه زمانی محدود می‌کند. شیئی با `start` (HH:MM، شامل؛ برای آغاز روز از `00:00` استفاده کنید)، `end` (HH:MM غیرشامل؛ `24:00` برای پایان روز مجاز است)، و `timezone` اختیاری.

- حذف‌شده یا `"user"`: اگر `agents.defaults.userTimezone` شما تنظیم شده باشد از آن استفاده می‌کند، در غیر این صورت به منطقه زمانی سیستم میزبان برمی‌گردد.
- `"local"`: همیشه از منطقه زمانی سیستم میزبان استفاده می‌کند.
- هر شناسه IANA (مثلاً `America/New_York`): مستقیماً استفاده می‌شود؛ اگر نامعتبر باشد، به رفتار `"user"` در بالا برمی‌گردد.
- `start` و `end` برای یک بازه فعال نباید برابر باشند؛ مقدارهای برابر به‌عنوان بازه‌ای با عرض صفر در نظر گرفته می‌شوند (همیشه بیرون از بازه).
- بیرون از بازه فعال، Heartbeatها تا تیک بعدی داخل بازه نادیده گرفته می‌شوند.

</ParamField>

## رفتار تحویل

<AccordionGroup>
  <Accordion title="مسیریابی نشست و مقصد">
    - Heartbeatها به‌طور پیش‌فرض در نشست اصلی عامل اجرا می‌شوند (`agent:<id>:<mainKey>`)، یا وقتی `session.scope = "global"` باشد در `global`. برای بازنویسی به یک نشست کانال مشخص (Discord/WhatsApp/غیره)، `session` را تنظیم کنید.
    - `session` فقط روی زمینه اجرا اثر می‌گذارد؛ تحویل با `target` و `to` کنترل می‌شود.
    - برای تحویل به یک کانال/گیرنده مشخص، `target` + `to` را تنظیم کنید. با `target: "last"`، تحویل از آخرین کانال خارجی آن نشست استفاده می‌کند.
    - تحویل‌های Heartbeat به‌طور پیش‌فرض مقصدهای مستقیم/DM را مجاز می‌کنند. برای سرکوب ارسال‌های مقصد مستقیم، در حالی که نوبت Heartbeat همچنان اجرا شود، `directPolicy: "block"` را تنظیم کنید.
    - اگر صف اصلی، lane نشست مقصد، lane cron، یا یک کار cron فعال مشغول باشد، Heartbeat نادیده گرفته می‌شود و بعداً دوباره تلاش می‌شود.
    - اگر `skipWhenBusy: true` باشد، laneهای subagent و تو‌در‌تو نیز اجرای Heartbeat را به تعویق می‌اندازند.
    - اگر `target` به هیچ مقصد خارجی resolve نشود، اجرا همچنان انجام می‌شود اما پیام خروجی ارسال نمی‌شود.

  </Accordion>
  <Accordion title="رفتار نمایش‌پذیری و رد کردن">
    - اگر `showOk`، `showAlerts`، و `useIndicator` همگی غیرفعال باشند، اجرا از ابتدا با `reason=alerts-disabled` رد می‌شود.
    - اگر فقط تحویل هشدار غیرفعال باشد، OpenClaw همچنان می‌تواند Heartbeat را اجرا کند، timestampهای کارهای موعدرسیده را به‌روزرسانی کند، timestamp بیکاری نشست را بازیابی کند، و payload هشدار بیرونی را سرکوب کند.
    - اگر مقصد resolveشده Heartbeat از typing پشتیبانی کند، OpenClaw هنگام فعال بودن اجرای Heartbeat وضعیت typing را نشان می‌دهد. این از همان مقصدی استفاده می‌کند که Heartbeat خروجی چت را به آن می‌فرستاد، و با `typingMode: "never"` غیرفعال می‌شود.

  </Accordion>
  <Accordion title="چرخه عمر نشست و audit">
    - پاسخ‌های فقط Heartbeat نشست را زنده نگه نمی‌دارند. فراداده Heartbeat ممکن است ردیف نشست را به‌روزرسانی کند، اما انقضای بیکاری از `lastInteractionAt` مربوط به آخرین پیام واقعی کاربر/کانال استفاده می‌کند، و انقضای روزانه از `sessionStartedAt`.
    - تاریخچه Control UI و WebChat، promptهای Heartbeat و تأییدیه‌های فقط OK را پنهان می‌کند. transcript نشست زیربنایی همچنان می‌تواند این نوبت‌ها را برای audit/replay داشته باشد.
    - [کارهای پس‌زمینه](/fa/automation/tasks) جداشده می‌توانند یک رویداد سیستمی را در صف بگذارند و وقتی نشست اصلی باید سریع متوجه چیزی شود، Heartbeat را بیدار کنند. آن بیدارسازی باعث نمی‌شود اجرای Heartbeat به یک کار پس‌زمینه تبدیل شود.

  </Accordion>
</AccordionGroup>

## کنترل‌های نمایش‌پذیری

به‌طور پیش‌فرض، تأییدیه‌های `HEARTBEAT_OK` سرکوب می‌شوند در حالی که محتوای هشدار تحویل داده می‌شود. می‌توانید این را برای هر کانال یا هر حساب تنظیم کنید:

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

### هر پرچم چه کاری انجام می‌دهد

- `showOk`: وقتی مدل یک پاسخ فقط OK برمی‌گرداند، یک تأییدیه `HEARTBEAT_OK` می‌فرستد.
- `showAlerts`: وقتی مدل یک پاسخ غیر OK برمی‌گرداند، محتوای هشدار را می‌فرستد.
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

| هدف                                     | پیکربندی                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| رفتار پیش‌فرض (OKهای بی‌صدا، هشدارها روشن) | _(نیازی به پیکربندی نیست)_                                                                     |
| کاملاً بی‌صدا (بدون پیام، بدون indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| فقط indicator (بدون پیام)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKها فقط در یک کانال                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختیاری)

اگر یک فایل `HEARTBEAT.md` در workspace وجود داشته باشد، prompt پیش‌فرض به عامل می‌گوید آن را بخواند. آن را مانند «چک‌لیست Heartbeat» خود در نظر بگیرید: کوچک، پایدار، و امن برای درج هر ۳۰ دقیقه.

در اجراهای معمولی، `HEARTBEAT.md` فقط وقتی تزریق می‌شود که راهنمایی Heartbeat برای عامل پیش‌فرض فعال باشد. غیرفعال کردن cadence Heartbeat با `0m` یا تنظیم `includeSystemPromptSection: false` آن را از زمینه bootstrap معمولی حذف می‌کند.

اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خط‌های خالی و headerهای markdown مثل `# Heading`)، OpenClaw برای صرفه‌جویی در فراخوانی‌های API اجرای Heartbeat را رد می‌کند. این رد شدن با `reason=empty-heartbeat-file` گزارش می‌شود. اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کند.

برای جلوگیری از متورم شدن prompt، آن را بسیار کوچک نگه دارید (چک‌لیست یا یادآوری‌های کوتاه).

نمونه `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### بلوک‌های `tasks:`

`HEARTBEAT.md` همچنین از یک بلوک ساختاریافته کوچک `tasks:` برای بررسی‌های مبتنی بر فاصله زمانی در خود Heartbeat پشتیبانی می‌کند.

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
    - OpenClaw بلوک `tasks:` را parse می‌کند و هر کار را نسبت به `interval` خودش بررسی می‌کند.
    - فقط کارهای **موعدرسیده** در prompt Heartbeat آن تیک گنجانده می‌شوند.
    - اگر هیچ کاری موعدرسیده نباشد، Heartbeat کاملاً رد می‌شود (`reason=no-tasks-due`) تا از فراخوانی بیهوده مدل جلوگیری شود.
    - محتوای غیرکار در `HEARTBEAT.md` حفظ می‌شود و به‌عنوان زمینه اضافی پس از فهرست کارهای موعدرسیده افزوده می‌شود.
    - timestampهای آخرین اجرای کار در وضعیت نشست (`heartbeatTaskState`) ذخیره می‌شوند، بنابراین فاصله‌ها پس از راه‌اندازی مجدد عادی باقی می‌مانند.
    - timestampهای کار فقط پس از تکمیل مسیر پاسخ عادی یک اجرای Heartbeat جلو برده می‌شوند. اجراهای ردشده `empty-heartbeat-file` / `no-tasks-due` کارها را completed علامت نمی‌زنند.

  </Accordion>
</AccordionGroup>

حالت کار زمانی مفید است که می‌خواهید یک فایل Heartbeat چندین بررسی دوره‌ای را نگه دارد، بدون اینکه در هر تیک هزینه همه آن‌ها را بپردازید.

### آیا عامل می‌تواند HEARTBEAT.md را به‌روزرسانی کند؟

بله — اگر از آن بخواهید.

`HEARTBEAT.md` فقط یک فایل عادی در workspace عامل است، بنابراین می‌توانید به عامل (در یک چت عادی) چیزی شبیه این بگویید:

- «`HEARTBEAT.md` را به‌روزرسانی کن تا یک بررسی تقویم روزانه اضافه شود.»
- «`HEARTBEAT.md` را بازنویسی کن تا کوتاه‌تر و متمرکز بر پیگیری‌های inbox باشد.»

اگر می‌خواهید این کار به‌صورت پیش‌دستانه انجام شود، همچنین می‌توانید یک خط صریح در prompt Heartbeat خود بگنجانید مانند: «اگر چک‌لیست کهنه شد، HEARTBEAT.md را با نسخه بهتر به‌روزرسانی کن.»

<Warning>
secretها (کلیدهای API، شماره‌های تلفن، tokenهای خصوصی) را در `HEARTBEAT.md` قرار ندهید — این فایل بخشی از زمینه prompt می‌شود.
</Warning>

## بیدارسازی دستی (درخواستی)

می‌توانید با این دستور یک رویداد سیستمی را در صف بگذارید و یک Heartbeat فوری را فعال کنید:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

اگر چند عامل `heartbeat` را پیکربندی کرده باشند، بیدارسازی دستی فوراً هر یک از آن Heartbeatهای عامل را اجرا می‌کند.

برای انتظار تا تیک زمان‌بندی‌شده بعدی از `--mode next-heartbeat` استفاده کنید.

## تحویل reasoning (اختیاری)

به‌طور پیش‌فرض، Heartbeatها فقط payload نهایی «answer» را تحویل می‌دهند.

اگر شفافیت می‌خواهید، این را فعال کنید:

- `agents.defaults.heartbeat.includeReasoning: true`

وقتی فعال باشد، Heartbeatها همچنین یک پیام جداگانه با پیشوند `Reasoning:` تحویل می‌دهند (همان شکل `/reasoning on`). این می‌تواند زمانی مفید باشد که عامل چند نشست/codex را مدیریت می‌کند و می‌خواهید ببینید چرا تصمیم گرفته به شما ping بزند — اما همچنین می‌تواند جزئیات داخلی بیشتری از آنچه می‌خواهید فاش کند. ترجیحاً آن را در چت‌های گروهی خاموش نگه دارید.

## آگاهی از هزینه

Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند. فاصله‌های کوتاه‌تر token بیشتری مصرف می‌کنند. برای کاهش هزینه:

- برای جلوگیری از ارسال تاریخچه کامل مکالمه از `isolatedSession: true` استفاده کنید (از حدود 100K token به حدود 2-5K در هر اجرا).
- برای محدود کردن فایل‌های bootstrap فقط به `HEARTBEAT.md` از `lightContext: true` استفاده کنید.
- یک `model` ارزان‌تر تنظیم کنید (مثلاً `ollama/llama3.2:1b`).
- `HEARTBEAT.md` را کوچک نگه دارید.
- اگر فقط به‌روزرسانی‌های وضعیت داخلی می‌خواهید، از `target: "none"` استفاده کنید.

## سرریز زمینه پس از Heartbeat

اگر یک Heartbeat از مدل محلی کوچک‌تری استفاده کند، برای مثال یک مدل Ollama با پنجره 32k، و نوبت بعدی نشست اصلی سرریز زمینه را گزارش کند، بررسی کنید آیا Heartbeat قبلی نشست را روی مدل Heartbeat باقی گذاشته است یا نه. پیام reset OpenClaw وقتی آخرین مدل runtime با `heartbeat.model` پیکربندی‌شده مطابقت داشته باشد به این موضوع اشاره می‌کند.

برای اجرای Heartbeatها در یک نشست تازه از `isolatedSession: true` استفاده کنید، برای کوچک‌ترین prompt آن را با `lightContext: true` ترکیب کنید، یا مدل Heartbeatی انتخاب کنید که پنجره زمینه آن برای نشست مشترک به‌اندازه کافی بزرگ باشد.

## مرتبط

- [اتوماسیون و کارها](/fa/automation) — همه سازوکارهای اتوماسیون در یک نگاه
- [کارهای پس‌زمینه](/fa/automation/tasks) — کار جداشده چگونه پیگیری می‌شود
- [منطقه زمانی](/fa/concepts/timezone) — منطقه زمانی چگونه بر زمان‌بندی Heartbeat اثر می‌گذارد
- [عیب‌یابی](/fa/automation/cron-jobs#troubleshooting) — اشکال‌زدایی مشکلات اتوماسیون

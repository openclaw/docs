---
read_when:
    - تنظیم تناوب Heartbeat یا پیام‌رسانی
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Heartbeat
summary: پیام‌های پایش Heartbeat و قواعد اعلان
title: Heartbeat
x-i18n:
    generated_at: "2026-05-10T19:42:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c4a4076ff4c7a88b47a9bb4daff56b3075173e79409a991ac564ad6ab305a9d
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat در برابر Cron؟** برای راهنمایی درباره زمان استفاده از هرکدام، [خودکارسازی و وظایف](/fa/automation) را ببینید.
</Note>

Heartbeat در نشست اصلی، **نوبت‌های دوره‌ای عامل** را اجرا می‌کند تا مدل بتواند بدون ارسال پیام‌های مزاحم، هر چیزی را که نیازمند توجه است مطرح کند.

Heartbeat یک نوبت زمان‌بندی‌شده در نشست اصلی است؛ **رکوردهای [وظیفه پس‌زمینه](/fa/automation/tasks)** ایجاد نمی‌کند. رکوردهای وظیفه برای کارهای جداشده هستند (اجرای ACP، زیرعامل‌ها، کارهای Cron ایزوله).

عیب‌یابی: [وظایف زمان‌بندی‌شده](/fa/automation/cron-jobs#troubleshooting)

## شروع سریع (مبتدی)

<Steps>
  <Step title="انتخاب دوره زمانی">
    Heartbeatها را فعال نگه دارید (پیش‌فرض `30m` است، یا برای احراز هویت OAuth/token در Anthropic، از جمله استفاده مجدد از Claude CLI، مقدار `1h`) یا دوره زمانی خودتان را تنظیم کنید.
  </Step>
  <Step title="افزودن HEARTBEAT.md (اختیاری)">
    یک چک‌لیست کوچک `HEARTBEAT.md` یا بلوک `tasks:` در فضای کاری عامل ایجاد کنید.
  </Step>
  <Step title="تعیین مقصد پیام‌های Heartbeat">
    `target: "none"` پیش‌فرض است؛ برای هدایت به آخرین مخاطب، `target: "last"` را تنظیم کنید.
  </Step>
  <Step title="تنظیمات اختیاری">
    - برای شفافیت، تحویل استدلال Heartbeat را فعال کنید.
    - اگر اجرای Heartbeat فقط به `HEARTBEAT.md` نیاز دارد، از زمینه راه‌اندازی سبک استفاده کنید.
    - برای جلوگیری از ارسال کل تاریخچه گفتگو در هر Heartbeat، نشست‌های ایزوله را فعال کنید.
    - Heartbeatها را به ساعت‌های فعال (زمان محلی) محدود کنید.

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

- فاصله زمانی: `30m` (یا وقتی حالت احراز هویت تشخیص‌داده‌شده Anthropic OAuth/token auth باشد، از جمله استفاده مجدد از Claude CLI، مقدار `1h`). `agents.defaults.heartbeat.every` یا `agents.list[].heartbeat.every` را برای هر عامل تنظیم کنید؛ برای غیرفعال‌سازی از `0m` استفاده کنید.
- متن اعلان (قابل پیکربندی از طریق `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- اعلان Heartbeat به‌صورت **عین متن** به‌عنوان پیام کاربر ارسال می‌شود. اعلان سیستم فقط وقتی Heartbeatها برای عامل پیش‌فرض فعال باشند، بخش "Heartbeat" را شامل می‌شود و اجرا به‌صورت داخلی علامت‌گذاری می‌شود.
- وقتی Heartbeatها با `0m` غیرفعال شوند، اجراهای عادی نیز `HEARTBEAT.md` را از زمینه راه‌اندازی حذف می‌کنند تا مدل دستورهای مخصوص Heartbeat را نبیند.
- ساعت‌های فعال (`heartbeat.activeHours`) در منطقه زمانی پیکربندی‌شده بررسی می‌شوند. خارج از این بازه، Heartbeatها تا تیک بعدی داخل بازه رد می‌شوند.
- Heartbeatها هنگام فعال یا در صف بودن کار Cron به‌طور خودکار به تعویق می‌افتند. برای به تعویق انداختن روی مسیرهای پرمشغله اضافی (زیرعامل یا کار فرمان تودرتو) نیز `heartbeat.skipWhenBusy: true` را تنظیم کنید؛ این برای Ollama محلی و میزبان‌های تک‌زمان‌اجرای محدود دیگر مفید است.

## کاربرد اعلان Heartbeat

اعلان پیش‌فرض عمدا گسترده است:

- **وظایف پس‌زمینه**: "Consider outstanding tasks" عامل را ترغیب می‌کند پیگیری‌ها (صندوق ورودی، تقویم، یادآورها، کارهای صف‌شده) را بازبینی کند و هر مورد فوری را مطرح کند.
- **بررسی وضعیت انسان**: "Checkup sometimes on your human during day time" به ارسال گهگاه یک پیام سبک مثل "چیزی لازم دارید؟" اشاره می‌کند، اما با استفاده از منطقه زمانی محلی پیکربندی‌شده شما از پیام‌های مزاحم شبانه جلوگیری می‌کند ( [منطقه زمانی](/fa/concepts/timezone) را ببینید).

Heartbeat می‌تواند به [وظایف پس‌زمینه](/fa/automation/tasks) تکمیل‌شده واکنش نشان دهد، اما خود اجرای Heartbeat رکورد وظیفه ایجاد نمی‌کند.

اگر می‌خواهید Heartbeat کار بسیار مشخصی انجام دهد (مثلا "check Gmail PubSub stats" یا "verify gateway health")، `agents.defaults.heartbeat.prompt` (یا `agents.list[].heartbeat.prompt`) را روی یک متن سفارشی تنظیم کنید (عین متن ارسال می‌شود).

## قرارداد پاسخ

- اگر چیزی نیازمند توجه نیست، با **`HEARTBEAT_OK`** پاسخ دهید.
- اجراهای Heartbeat دارای ابزار می‌توانند به‌جای آن `heartbeat_respond` را با `notify: false` برای نداشتن به‌روزرسانی قابل مشاهده، یا با `notify: true` به‌همراه `notificationText` برای هشدار فراخوانی کنند. وقتی موجود باشد، پاسخ ساختاریافته ابزار بر جایگزین متنی اولویت دارد.
- در طول اجراهای Heartbeat، OpenClaw وقتی `HEARTBEAT_OK` در **ابتدا یا انتهای** پاسخ ظاهر شود، آن را ack تلقی می‌کند. توکن حذف می‌شود و اگر محتوای باقی‌مانده **≤ `ackMaxChars`** باشد، پاسخ کنار گذاشته می‌شود (پیش‌فرض: 300).
- اگر `HEARTBEAT_OK` در **میانه** یک پاسخ ظاهر شود، رفتار ویژه‌ای با آن نمی‌شود.
- برای هشدارها، **`HEARTBEAT_OK` را وارد نکنید**؛ فقط متن هشدار را برگردانید.

خارج از Heartbeatها، `HEARTBEAT_OK` ناخواسته در ابتدا/انتهای پیام حذف و ثبت می‌شود؛ پیامی که فقط `HEARTBEAT_OK` باشد کنار گذاشته می‌شود.

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

### دامنه و اولویت

- `agents.defaults.heartbeat` رفتار سراسری Heartbeat را تنظیم می‌کند.
- `agents.list[].heartbeat` روی آن ادغام می‌شود؛ اگر هر عاملی بلوک `heartbeat` داشته باشد، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند.
- `channels.defaults.heartbeat` پیش‌فرض‌های نمایش‌پذیری را برای همه کانال‌ها تنظیم می‌کند.
- `channels.<channel>.heartbeat` پیش‌فرض‌های کانال را بازنویسی می‌کند.
- `channels.<channel>.accounts.<id>.heartbeat` (کانال‌های چندحسابی) تنظیمات هر کانال را بازنویسی می‌کند.

### Heartbeatهای هر عامل

اگر هر ورودی `agents.list[]` شامل بلوک `heartbeat` باشد، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند. بلوک هر عامل روی `agents.defaults.heartbeat` ادغام می‌شود (بنابراین می‌توانید پیش‌فرض‌های مشترک را یک‌بار تنظیم کنید و برای هر عامل بازنویسی کنید).

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

### نمونه ساعت‌های فعال

Heartbeatها را به ساعت‌های کاری در یک منطقه زمانی مشخص محدود کنید:

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

خارج از این بازه (پیش از ۹ صبح یا پس از ۱۰ شب به وقت شرق آمریکا)، Heartbeatها رد می‌شوند. تیک زمان‌بندی‌شده بعدی داخل بازه به‌طور عادی اجرا خواهد شد.

### راه‌اندازی 24/7

اگر می‌خواهید Heartbeatها تمام روز اجرا شوند، از یکی از این الگوها استفاده کنید:

- `activeHours` را کاملا حذف کنید (بدون محدودیت بازه زمانی؛ این رفتار پیش‌فرض است).
- یک بازه تمام‌روزه تنظیم کنید: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
زمان `start` و `end` یکسان تنظیم نکنید (برای مثال `08:00` تا `08:00`). این به‌عنوان بازه‌ای با پهنای صفر تلقی می‌شود، بنابراین Heartbeatها همیشه رد می‌شوند.
</Warning>

### نمونه چندحسابی

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
  فاصله زمانی Heartbeat (رشته مدت‌زمان؛ واحد پیش‌فرض = دقیقه).
</ParamField>
<ParamField path="model" type="string">
  بازنویسی اختیاری مدل برای اجراهای Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  وقتی فعال باشد، در صورت موجود بودن، پیام جداگانه `Reasoning:` را نیز تحویل می‌دهد (با همان شکل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  وقتی true باشد، اجراهای Heartbeat از زمینه راه‌اندازی سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های راه‌اندازی فضای کاری نگه می‌دارند.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  وقتی true باشد، هر Heartbeat در یک نشست تازه و بدون تاریخچه گفتگوی قبلی اجرا می‌شود. از همان الگوی ایزوله‌سازی Cron با `sessionTarget: "isolated"` استفاده می‌کند. هزینه توکن هر Heartbeat را به‌شدت کاهش می‌دهد. برای بیشترین صرفه‌جویی با `lightContext: true` ترکیب کنید. مسیریابی تحویل همچنان از زمینه نشست اصلی استفاده می‌کند.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  وقتی true باشد، اجراهای Heartbeat روی مسیرهای پرمشغله اضافی به تعویق می‌افتند: کار زیرعامل یا فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم، بنابراین میزبان‌های مدل محلی اعلان‌های Cron و Heartbeat را هم‌زمان اجرا نمی‌کنند.
</ParamField>
<ParamField path="session" type="string">
  کلید نشست اختیاری برای اجراهای Heartbeat.

- `main` (پیش‌فرض): نشست اصلی عامل.
- کلید نشست صریح (از `openclaw sessions --json` یا [CLI نشست‌ها](/fa/cli/sessions) کپی کنید).
- قالب‌های کلید نشست: [نشست‌ها](/fa/concepts/session) و [گروه‌ها](/fa/channels/groups) را ببینید.

</ParamField>
<ParamField path="target" type="string">
- `last`: تحویل به آخرین کانال خارجی استفاده‌شده.
- کانال صریح: هر کانال پیکربندی‌شده یا شناسه Plugin، برای مثال `discord`، `matrix`، `telegram`، یا `whatsapp`.
- `none` (پیش‌فرض): Heartbeat را اجرا می‌کند اما به‌صورت خارجی **تحویل نمی‌دهد**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  رفتار تحویل مستقیم/DM را کنترل می‌کند. `allow`: تحویل مستقیم/DM Heartbeat را مجاز می‌کند. `block`: تحویل مستقیم/DM را سرکوب می‌کند (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  بازنویسی اختیاری گیرنده (شناسه مخصوص کانال، مثلا E.164 برای WhatsApp یا شناسه گفتگوی Telegram). برای موضوع‌ها/رشته‌های Telegram، از `<chatId>:topic:<messageThreadId>` استفاده کنید.

</ParamField>
<ParamField path="accountId" type="string">
  شناسه حساب اختیاری برای کانال‌های چندحسابی. وقتی `target: "last"` باشد، شناسه حساب در صورت پشتیبانی از حساب‌ها روی آخرین کانال حل‌شده اعمال می‌شود؛ در غیر این صورت نادیده گرفته می‌شود. اگر شناسه حساب با یک حساب پیکربندی‌شده برای کانال حل‌شده مطابقت نداشته باشد، تحویل رد می‌شود.

</ParamField>
<ParamField path="prompt" type="string">
  متن اعلان پیش‌فرض را بازنویسی می‌کند (ادغام نمی‌شود).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  حداکثر تعداد نویسه‌های مجاز پس از `HEARTBEAT_OK` پیش از تحویل.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  وقتی true باشد، payloadهای هشدار خطای ابزار را هنگام اجرای Heartbeat سرکوب می‌کند.

</ParamField>
<ParamField path="activeHours" type="object">
  اجرای Heartbeat را به یک بازه زمانی محدود می‌کند. آبجکتی با `start` (HH:MM، شامل؛ برای آغاز روز از `00:00` استفاده کنید)، `end` (HH:MM غیرشامل؛ برای پایان روز `24:00` مجاز است)، و `timezone` اختیاری.

- حذف‌شده یا `"user"`: اگر `agents.defaults.userTimezone` شما تنظیم شده باشد از آن استفاده می‌کند، وگرنه به منطقه زمانی سیستم میزبان برمی‌گردد.
- `"local"`: همیشه از منطقه زمانی سیستم میزبان استفاده می‌کند.
- هر شناسه IANA (مثلاً `America/New_York`): مستقیماً استفاده می‌شود؛ اگر نامعتبر باشد، به رفتار `"user"` در بالا برمی‌گردد.
- `start` و `end` برای یک بازه فعال نباید برابر باشند؛ مقادیر برابر به‌عنوان بازه‌ای با عرض صفر در نظر گرفته می‌شوند (همیشه خارج از بازه).
- خارج از بازه فعال، Heartbeatها تا تیک بعدی درون بازه نادیده گرفته می‌شوند.

</ParamField>

## رفتار تحویل

<AccordionGroup>
  <Accordion title="Session and target routing">
    - Heartbeatها به‌صورت پیش‌فرض در نشست اصلی agent اجرا می‌شوند (`agent:<id>:<mainKey>`)، یا وقتی `session.scope = "global"` باشد در `global`. برای بازنویسی به یک نشست کانال مشخص (Discord/WhatsApp/و غیره)، `session` را تنظیم کنید.
    - `session` فقط بر زمینه اجرا اثر می‌گذارد؛ تحویل توسط `target` و `to` کنترل می‌شود.
    - برای تحویل به یک کانال/گیرنده مشخص، `target` + `to` را تنظیم کنید. با `target: "last"`، تحویل از آخرین کانال خارجی برای آن نشست استفاده می‌کند.
    - تحویل‌های Heartbeat به‌صورت پیش‌فرض هدف‌های مستقیم/DM را مجاز می‌دانند. برای سرکوب ارسال‌های هدف مستقیم در حالی که نوبت Heartbeat همچنان اجرا می‌شود، `directPolicy: "block"` را تنظیم کنید.
    - اگر صف اصلی، مسیر نشست هدف، مسیر Cron، یا یک کار Cron فعال مشغول باشد، Heartbeat نادیده گرفته می‌شود و بعداً دوباره تلاش می‌شود.
    - اگر `skipWhenBusy: true` باشد، مسیرهای subagent و تو در تو نیز اجرای Heartbeat را به تعویق می‌اندازند.
    - اگر `target` به هیچ مقصد خارجی‌ای resolve نشود، اجرا همچنان انجام می‌شود اما پیام خروجی ارسال نمی‌شود.

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - اگر `showOk`، `showAlerts`، و `useIndicator` همگی غیرفعال باشند، اجرا از ابتدا با `reason=alerts-disabled` نادیده گرفته می‌شود.
    - اگر فقط تحویل هشدار غیرفعال باشد، OpenClaw همچنان می‌تواند Heartbeat را اجرا کند، زمان‌مهرهای taskهای موعدرسیده را به‌روزرسانی کند، زمان‌مهر بیکاری نشست را بازیابی کند، و payload هشدار بیرونی را سرکوب کند.
    - اگر هدف Heartbeat resolve‌شده از typing پشتیبانی کند، OpenClaw هنگام فعال بودن اجرای Heartbeat، typing را نشان می‌دهد. این همان هدفی را استفاده می‌کند که Heartbeat خروجی chat را به آن می‌فرستاد، و با `typingMode: "never"` غیرفعال می‌شود.

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - پاسخ‌های فقط Heartbeat نشست را زنده نگه **نمی‌دارند**. فراداده Heartbeat ممکن است ردیف نشست را به‌روزرسانی کند، اما انقضای بیکاری از `lastInteractionAt` مربوط به آخرین پیام واقعی کاربر/کانال استفاده می‌کند، و انقضای روزانه از `sessionStartedAt`.
    - تاریخچه UI کنترل و WebChat، promptهای Heartbeat و تأییدهای فقط OK را پنهان می‌کند. transcript نشست زیرین همچنان می‌تواند آن نوبت‌ها را برای audit/replay داشته باشد.
    - [taskهای پس‌زمینه](/fa/automation/tasks) جداشده می‌توانند یک رویداد سیستمی را در صف بگذارند و وقتی نشست اصلی باید سریع متوجه چیزی شود Heartbeat را بیدار کنند. آن بیدارباش، اجرای Heartbeat را به task پس‌زمینه تبدیل نمی‌کند.

  </Accordion>
</AccordionGroup>

## کنترل‌های نمایش

به‌صورت پیش‌فرض، تأییدهای `HEARTBEAT_OK` سرکوب می‌شوند در حالی که محتوای هشدار تحویل داده می‌شود. می‌توانید این را برای هر کانال یا هر حساب تنظیم کنید:

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

اولویت: برای هر حساب → برای هر کانال → پیش‌فرض‌های کانال → پیش‌فرض‌های داخلی.

### هر flag چه کاری انجام می‌دهد

- `showOk`: وقتی مدل یک پاسخ فقط OK برمی‌گرداند، یک تأیید `HEARTBEAT_OK` ارسال می‌کند.
- `showAlerts`: وقتی مدل یک پاسخ غیر OK برمی‌گرداند، محتوای هشدار را ارسال می‌کند.
- `useIndicator`: رویدادهای نشانگر را برای سطح‌های وضعیت UI منتشر می‌کند.

اگر **هر سه** false باشند، OpenClaw اجرای Heartbeat را کاملاً نادیده می‌گیرد (بدون فراخوانی مدل).

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

| هدف                                      | Config                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| رفتار پیش‌فرض (OKهای بی‌صدا، هشدارها روشن) | _(no config needed)_                                                                     |
| کاملاً بی‌صدا (بدون پیام، بدون نشانگر) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| فقط نشانگر (بدون پیام)                  | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKها فقط در یک کانال                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختیاری)

اگر فایل `HEARTBEAT.md` در workspace وجود داشته باشد، prompt پیش‌فرض به agent می‌گوید آن را بخواند. آن را مثل «چک‌لیست Heartbeat» خود در نظر بگیرید: کوچک، پایدار، و امن برای گنجاندن هر ۳۰ دقیقه.

در اجراهای عادی، `HEARTBEAT.md` فقط زمانی تزریق می‌شود که راهنمایی Heartbeat برای agent پیش‌فرض فعال باشد. غیرفعال کردن cadence مربوط به Heartbeat با `0m` یا تنظیم `includeSystemPromptSection: false` آن را از زمینه bootstrap عادی حذف می‌کند.

اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خط‌های خالی و سربرگ‌های markdown مثل `# Heading`)، OpenClaw اجرای Heartbeat را برای صرفه‌جویی در فراخوانی‌های API نادیده می‌گیرد. این نادیده‌گیری به‌صورت `reason=empty-heartbeat-file` گزارش می‌شود. اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کاری انجام دهد.

آن را بسیار کوچک نگه دارید (چک‌لیست کوتاه یا یادآوری‌ها) تا از بزرگ شدن prompt جلوگیری شود.

نمونه `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### بلوک‌های `tasks:`

`HEARTBEAT.md` همچنین از یک بلوک ساخت‌یافته کوچک `tasks:` برای بررسی‌های مبتنی بر interval درون خود Heartbeat پشتیبانی می‌کند.

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
  <Accordion title="Behavior">
    - OpenClaw بلوک `tasks:` را parse می‌کند و هر task را با `interval` خودش بررسی می‌کند.
    - فقط taskهای **موعدرسیده** در prompt مربوط به Heartbeat برای آن تیک گنجانده می‌شوند.
    - اگر هیچ taskی موعدرسیده نباشد، Heartbeat کاملاً نادیده گرفته می‌شود (`reason=no-tasks-due`) تا از یک فراخوانی بیهوده مدل جلوگیری شود.
    - محتوای غیر task در `HEARTBEAT.md` حفظ می‌شود و پس از فهرست taskهای موعدرسیده به‌عنوان زمینه اضافی افزوده می‌شود.
    - زمان‌مهرهای آخرین اجرای task در وضعیت نشست (`heartbeatTaskState`) ذخیره می‌شوند، بنابراین intervalها پس از restartهای عادی باقی می‌مانند.
    - زمان‌مهرهای task فقط پس از اینکه اجرای Heartbeat مسیر پاسخ عادی خود را کامل کرد جلو برده می‌شوند. اجراهای نادیده‌گرفته‌شده `empty-heartbeat-file` / `no-tasks-due`، taskها را کامل‌شده علامت‌گذاری نمی‌کنند.

  </Accordion>
</AccordionGroup>

حالت task زمانی مفید است که می‌خواهید یک فایل Heartbeat چندین بررسی دوره‌ای را نگه دارد بدون اینکه در هر تیک هزینه همه آن‌ها را بپردازید.

### آیا agent می‌تواند HEARTBEAT.md را به‌روزرسانی کند؟

بله — اگر از آن بخواهید.

`HEARTBEAT.md` فقط یک فایل عادی در workspace مربوط به agent است، بنابراین می‌توانید به agent (در یک chat عادی) چیزی شبیه این بگویید:

- "`HEARTBEAT.md` را به‌روزرسانی کن تا یک بررسی تقویم روزانه اضافه شود."
- "`HEARTBEAT.md` را بازنویسی کن تا کوتاه‌تر و متمرکز بر پیگیری‌های inbox باشد."

اگر می‌خواهید این کار به‌صورت proactive انجام شود، می‌توانید یک خط صریح نیز در prompt مربوط به Heartbeat خود بگنجانید مثل: «اگر چک‌لیست stale شد، HEARTBEAT.md را با نسخه‌ای بهتر به‌روزرسانی کن.»

<Warning>
secretها (API keys، شماره تلفن‌ها، tokenهای خصوصی) را در `HEARTBEAT.md` قرار ندهید — این فایل بخشی از زمینه prompt می‌شود.
</Warning>

## بیدارباش دستی (درخواست‌محور)

می‌توانید یک رویداد سیستمی را در صف قرار دهید و یک Heartbeat فوری را با این دستور trigger کنید:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

اگر چند agent دارای `heartbeat` پیکربندی‌شده باشند، بیدارباش دستی هر یک از آن Heartbeatهای agent را فوراً اجرا می‌کند.

برای صبر کردن تا تیک زمان‌بندی‌شده بعدی، از `--mode next-heartbeat` استفاده کنید.

## تحویل reasoning (اختیاری)

به‌صورت پیش‌فرض، Heartbeatها فقط payload نهایی «answer» را تحویل می‌دهند.

اگر شفافیت می‌خواهید، فعال کنید:

- `agents.defaults.heartbeat.includeReasoning: true`

وقتی فعال باشد، Heartbeatها همچنین یک پیام جداگانه با پیشوند `Reasoning:` تحویل می‌دهند (با همان شکل `/reasoning on`). این می‌تواند زمانی مفید باشد که agent چند نشست/codex را مدیریت می‌کند و می‌خواهید ببینید چرا تصمیم گرفته به شما ping کند — اما می‌تواند جزئیات داخلی بیشتری از آنچه می‌خواهید نیز افشا کند. در chatهای گروهی، ترجیحاً آن را خاموش نگه دارید.

## آگاهی از هزینه

Heartbeatها نوبت‌های کامل agent را اجرا می‌کنند. intervalهای کوتاه‌تر tokenهای بیشتری مصرف می‌کنند. برای کاهش هزینه:

- از `isolatedSession: true` استفاده کنید تا از ارسال تاریخچه کامل گفتگو جلوگیری شود (از حدود 100K token به حدود 2-5K در هر اجرا).
- از `lightContext: true` استفاده کنید تا فایل‌های bootstrap فقط به `HEARTBEAT.md` محدود شوند.
- یک `model` ارزان‌تر تنظیم کنید (مثلاً `ollama/llama3.2:1b`).
- `HEARTBEAT.md` را کوچک نگه دارید.
- اگر فقط به‌روزرسانی‌های وضعیت داخلی را می‌خواهید، از `target: "none"` استفاده کنید.

## سرریز context پس از Heartbeat

اگر یک Heartbeat قبلاً یک نشست موجود را روی یک مدل local کوچک‌تر گذاشته باشد، برای مثال یک مدل Ollama با پنجره 32k، و نوبت بعدی نشست اصلی سرریز context را گزارش کند، مدل runtime نشست را به مدل primary پیکربندی‌شده بازنشانی کنید. پیام بازنشانی OpenClaw وقتی آخرین مدل runtime با `heartbeat.model` پیکربندی‌شده مطابق باشد به این موضوع اشاره می‌کند.

Heartbeatهای فعلی پس از کامل شدن اجرا، مدل runtime موجود نشست مشترک را حفظ می‌کنند. همچنان می‌توانید از `isolatedSession: true` برای اجرای Heartbeatها در یک نشست تازه استفاده کنید، آن را با `lightContext: true` برای کوچک‌ترین prompt ترکیب کنید، یا یک مدل Heartbeat با پنجره context به‌اندازه کافی بزرگ برای نشست مشترک انتخاب کنید.

## مرتبط

- [اتوماسیون و taskها](/fa/automation) — همه سازوکارهای اتوماسیون در یک نگاه
- [Taskهای پس‌زمینه](/fa/automation/tasks) — کار جداشده چگونه ردیابی می‌شود
- [منطقه زمانی](/fa/concepts/timezone) — منطقه زمانی چگونه بر زمان‌بندی Heartbeat اثر می‌گذارد
- [عیب‌یابی](/fa/automation/cron-jobs#troubleshooting) — رفع اشکال مسائل اتوماسیون

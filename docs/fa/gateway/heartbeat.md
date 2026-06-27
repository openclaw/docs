---
read_when:
    - تنظیم آهنگ Heartbeat یا پیام‌رسانی
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Heartbeat
summary: پیام‌های پایش دوره‌ای Heartbeat و قواعد اعلان
title: Heartbeat
x-i18n:
    generated_at: "2026-06-27T17:44:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat در برابر Cron؟** برای راهنمایی درباره زمان استفاده از هرکدام، [Automation](/fa/automation) را ببینید.
</Note>

Heartbeat در نشست اصلی، **گردش‌های دوره‌ای عامل** را اجرا می‌کند تا مدل بتواند بدون ارسال هرزپیام به شما، هر چیزی را که نیازمند توجه است مطرح کند.

Heartbeat یک گردش زمان‌بندی‌شده در نشست اصلی است — رکوردهای [وظیفه پس‌زمینه](/fa/automation/tasks) ایجاد **نمی‌کند**. رکوردهای وظیفه برای کارهای جداشده هستند (اجرای ACP، زیرعامل‌ها، کارهای Cron ایزوله).

عیب‌یابی: [وظایف زمان‌بندی‌شده](/fa/automation/cron-jobs#troubleshooting)

## شروع سریع (مبتدی)

<Steps>
  <Step title="انتخاب تناوب">
    Heartbeatها را فعال بگذارید (پیش‌فرض `30m` است، یا برای احراز هویت Anthropic OAuth/توکنی، شامل استفاده مجدد از Claude CLI، `1h`) یا تناوب خودتان را تنظیم کنید.
  </Step>
  <Step title="افزودن HEARTBEAT.md (اختیاری)">
    یک چک‌لیست کوچک `HEARTBEAT.md` یا بلوک `tasks:` در فضای کاری عامل ایجاد کنید.
  </Step>
  <Step title="تصمیم بگیرید پیام‌های Heartbeat کجا بروند">
    `target: "none"` پیش‌فرض است؛ برای مسیردهی به آخرین مخاطب، `target: "last"` را تنظیم کنید.
  </Step>
  <Step title="تنظیم اختیاری">
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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## پیش‌فرض‌ها

- بازه: `30m` (یا وقتی حالت احراز هویت شناسایی‌شده Anthropic OAuth/توکنی است، شامل استفاده مجدد از Claude CLI، `1h`). `agents.defaults.heartbeat.every` یا `agents.list[].heartbeat.every` را تنظیم کنید؛ برای غیرفعال‌کردن از `0m` استفاده کنید.
- بدنه پرامپت (قابل پیکربندی از طریق `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- زمان پایان: گردش‌های Heartbeat تنظیم‌نشده، وقتی `agents.defaults.timeoutSeconds` تنظیم شده باشد از آن استفاده می‌کنند. در غیر این صورت، از تناوب Heartbeat با سقف ۶۰۰ ثانیه استفاده می‌کنند. برای کارهای Heartbeat طولانی‌تر، `agents.defaults.heartbeat.timeoutSeconds` یا برای هر عامل `agents.list[].heartbeat.timeoutSeconds` را تنظیم کنید.
- پرامپت Heartbeat **عیناً** به‌عنوان پیام کاربر ارسال می‌شود. پرامپت سیستم فقط زمانی یک بخش «Heartbeat» دارد که Heartbeatها برای عامل پیش‌فرض فعال باشند، و اجرا به‌صورت داخلی علامت‌گذاری می‌شود.
- وقتی Heartbeatها با `0m` غیرفعال شوند، اجراهای معمولی نیز `HEARTBEAT.md` را از زمینه راه‌اندازی حذف می‌کنند تا مدل دستورالعمل‌های مخصوص Heartbeat را نبیند.
- ساعت‌های فعال (`heartbeat.activeHours`) در منطقه زمانی پیکربندی‌شده بررسی می‌شوند. بیرون از پنجره، Heartbeatها تا تیک بعدی داخل پنجره رد می‌شوند.
- Heartbeatها هنگام فعال یا در صف بودن کار Cron به‌صورت خودکار به تعویق می‌افتند. برای اینکه یک عامل هنگام درگیر بودن زیرعامل دارای کلید نشست خودش یا مسیرهای فرمان تودرتوی خودش نیز به تعویق بیفتد، `heartbeat.skipWhenBusy: true` را تنظیم کنید؛ عامل‌های هم‌سطح دیگر فقط به‌خاطر اینکه عامل دیگری کار زیرعامل در حال اجرا دارد متوقف نمی‌شوند.

## پرامپت Heartbeat برای چیست

پرامپت پیش‌فرض عمداً گسترده است:

- **وظایف پس‌زمینه**: «در نظر گرفتن وظایف باقی‌مانده» عامل را به بررسی پیگیری‌ها (صندوق ورودی، تقویم، یادآورها، کارهای صف‌شده) و مطرح‌کردن موارد فوری ترغیب می‌کند.
- **سرکشی انسانی**: «گاهی در طول روز از انسان خود سرکشی کن» به یک پیام سبک و گاه‌به‌گاه از نوع «چیزی لازم دارید؟» ترغیب می‌کند، اما با استفاده از منطقه زمانی محلی پیکربندی‌شده شما از هرزپیام شبانه جلوگیری می‌کند ([Timezone](/fa/concepts/timezone) را ببینید).

Heartbeat می‌تواند به [وظایف پس‌زمینه](/fa/automation/tasks) تکمیل‌شده واکنش نشان دهد، اما اجرای خود Heartbeat رکورد وظیفه ایجاد نمی‌کند.

اگر می‌خواهید Heartbeat کار بسیار مشخصی انجام دهد (مثلاً «آمار Gmail PubSub را بررسی کن» یا «سلامت Gateway را تأیید کن»)، `agents.defaults.heartbeat.prompt` (یا `agents.list[].heartbeat.prompt`) را به یک بدنه سفارشی تنظیم کنید (عیناً ارسال می‌شود).

## قرارداد پاسخ

- اگر چیزی نیازمند توجه نیست، با **`HEARTBEAT_OK`** پاسخ دهید.
- اجراهای Heartbeat دارای قابلیت ابزار می‌توانند به‌جای آن `heartbeat_respond` را با `notify: false` برای نداشتن به‌روزرسانی قابل مشاهده، یا `notify: true` همراه با `notificationText` برای هشدار فراخوانی کنند. وقتی وجود داشته باشد، پاسخ ابزار ساختاریافته بر جایگزین متنی اولویت دارد.
- در طول اجراهای Heartbeat، OpenClaw وقتی `HEARTBEAT_OK` در **ابتدا یا انتهای** پاسخ ظاهر شود آن را به‌عنوان تأیید در نظر می‌گیرد. توکن حذف می‌شود و اگر محتوای باقی‌مانده **≤ `ackMaxChars`** باشد (پیش‌فرض: ۳۰۰)، پاسخ کنار گذاشته می‌شود.
- اگر `HEARTBEAT_OK` در **میانه** پاسخ ظاهر شود، رفتار ویژه‌ای با آن نمی‌شود.
- برای هشدارها، **`HEARTBEAT_OK` را وارد نکنید**؛ فقط متن هشدار را برگردانید.

بیرون از Heartbeatها، `HEARTBEAT_OK` سرگردان در ابتدا/انتهای پیام حذف و ثبت می‌شود؛ پیامی که فقط `HEARTBEAT_OK` باشد کنار گذاشته می‌شود.

## پیکربندی

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
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

### دامنه و اولویت

- `agents.defaults.heartbeat` رفتار سراسری Heartbeat را تنظیم می‌کند.
- `agents.list[].heartbeat` روی آن ادغام می‌شود؛ اگر هر عاملی یک بلوک `heartbeat` داشته باشد، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند.
- `channels.defaults.heartbeat` پیش‌فرض‌های نمایانی را برای همه کانال‌ها تنظیم می‌کند.
- `channels.<channel>.heartbeat` پیش‌فرض‌های کانال را بازنویسی می‌کند.
- `channels.<channel>.accounts.<id>.heartbeat` (کانال‌های چندحسابی) تنظیمات هر کانال را بازنویسی می‌کند.

### Heartbeatهای هر عامل

اگر هر ورودی `agents.list[]` شامل یک بلوک `heartbeat` باشد، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند. بلوک هر عامل روی `agents.defaults.heartbeat` ادغام می‌شود (بنابراین می‌توانید پیش‌فرض‌های مشترک را یک‌بار تنظیم کنید و برای هر عامل بازنویسی کنید).

مثال: دو عامل، فقط عامل دوم Heartbeat اجرا می‌کند.

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

بیرون از این پنجره (پیش از ۹ صبح یا پس از ۱۰ شب به وقت شرق)، Heartbeatها رد می‌شوند. تیک زمان‌بندی‌شده بعدی داخل پنجره به‌صورت عادی اجرا می‌شود.

### راه‌اندازی ۲۴/۷

اگر می‌خواهید Heartbeatها تمام روز اجرا شوند، از یکی از این الگوها استفاده کنید:

- `activeHours` را کاملاً حذف کنید (بدون محدودیت پنجره زمانی؛ این رفتار پیش‌فرض است).
- یک پنجره تمام‌روز تنظیم کنید: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
زمان `start` و `end` یکسان تنظیم نکنید (برای مثال `08:00` تا `08:00`). این به‌عنوان پنجره‌ای با عرض صفر در نظر گرفته می‌شود، بنابراین Heartbeatها همیشه رد می‌شوند.
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

### نکات فیلدها

<ParamField path="every" type="string">
  بازه Heartbeat (رشته مدت؛ واحد پیش‌فرض = دقیقه).
</ParamField>
<ParamField path="model" type="string">
  بازنویسی اختیاری مدل برای اجراهای Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  وقتی فعال باشد، پیام جداگانه `Thinking` را نیز هنگام موجود بودن تحویل می‌دهد (همان شکل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  وقتی true باشد، اجراهای Heartbeat از زمینه راه‌اندازی سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های راه‌اندازی فضای کاری نگه می‌دارند.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  وقتی true باشد، هر Heartbeat در یک نشست تازه و بدون تاریخچه گفتگوی قبلی اجرا می‌شود. از همان الگوی ایزولاسیون Cron `sessionTarget: "isolated"` استفاده می‌کند. هزینه توکن هر Heartbeat را به‌شدت کاهش می‌دهد. برای بیشترین صرفه‌جویی با `lightContext: true` ترکیب کنید. مسیردهی تحویل همچنان از زمینه نشست اصلی استفاده می‌کند.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  وقتی true باشد، اجراهای Heartbeat روی مسیرهای مشغول اضافی آن عامل به تعویق می‌افتند: زیرعامل دارای کلید نشست خودش یا کار فرمان تودرتوی خودش. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم، تا میزبان‌های مدل محلی پرامپت‌های Cron و Heartbeat را هم‌زمان اجرا نکنند.
</ParamField>
<ParamField path="session" type="string">
  کلید نشست اختیاری برای اجراهای Heartbeat.

- `main` (پیش‌فرض): نشست اصلی عامل.
- کلید نشست صریح (از `openclaw sessions --json` یا [sessions CLI](/fa/cli/sessions) کپی کنید).
- قالب‌های کلید نشست: [Sessions](/fa/concepts/session) و [Groups](/fa/channels/groups) را ببینید.

</ParamField>
<ParamField path="target" type="string">
- `last`: تحویل به آخرین کانال خارجی استفاده‌شده.
- کانال صریح: هر کانال یا شناسه Plugin پیکربندی‌شده، برای مثال `discord`، `matrix`، `telegram`، یا `whatsapp`.
- `none` (پیش‌فرض): Heartbeat را اجرا کن اما بیرون از سیستم **تحویل نده**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  رفتار تحویل مستقیم/DM را کنترل می‌کند. `allow`: تحویل مستقیم/DM Heartbeat را مجاز کن. `block`: تحویل مستقیم/DM را سرکوب کن (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  بازنویسی اختیاری گیرنده (شناسه مخصوص کانال، مثلاً E.164 برای WhatsApp یا شناسه چت Telegram). برای موضوعات/رشته‌های Telegram، از `<chatId>:topic:<messageThreadId>` استفاده کنید.

</ParamField>
<ParamField path="accountId" type="string">
  شناسهٔ اختیاری حساب برای کانال‌های چندحسابی. وقتی `target: "last"` باشد، شناسهٔ حساب روی آخرین کانال حل‌شده اعمال می‌شود، اگر آن کانال از حساب‌ها پشتیبانی کند؛ در غیر این صورت نادیده گرفته می‌شود. اگر شناسهٔ حساب با هیچ حساب پیکربندی‌شده‌ای برای کانال حل‌شده مطابقت نداشته باشد، تحویل رد می‌شود.

</ParamField>
<ParamField path="prompt" type="string">
  بدنهٔ پیش‌فرض پرامپت را بازنویسی می‌کند (ادغام نمی‌شود).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  بیشینهٔ نویسه‌های مجاز پس از `HEARTBEAT_OK` پیش از تحویل.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  وقتی true باشد، در اجرای Heartbeat، محموله‌های هشدار خطای ابزار را سرکوب می‌کند.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  بیشینهٔ ثانیه‌های مجاز برای یک نوبت عامل Heartbeat پیش از لغو شدن. تنظیم‌نشده رها کنید تا در صورت تنظیم بودن `agents.defaults.timeoutSeconds` از آن استفاده شود؛ وگرنه از آهنگ Heartbeat با سقف ۶۰۰ ثانیه استفاده می‌شود.

</ParamField>
<ParamField path="activeHours" type="object">
  اجرای Heartbeat را به یک بازهٔ زمانی محدود می‌کند. شیئی با `start` (HH:MM، شامل؛ برای آغاز روز از `00:00` استفاده کنید)، `end` (HH:MM، غیرشامل؛ `24:00` برای پایان روز مجاز است)، و `timezone` اختیاری.

- حذف‌شده یا `"user"`: اگر `agents.defaults.userTimezone` شما تنظیم شده باشد از آن استفاده می‌کند؛ وگرنه به منطقهٔ زمانی سیستم میزبان برمی‌گردد.
- `"local"`: همیشه از منطقهٔ زمانی سیستم میزبان استفاده می‌کند.
- هر شناسهٔ IANA (برای نمونه `America/New_York`): مستقیم استفاده می‌شود؛ اگر نامعتبر باشد، به رفتار `"user"` در بالا برمی‌گردد.
- `start` و `end` برای یک بازهٔ فعال نباید برابر باشند؛ مقدارهای برابر به‌عنوان پهنای صفر در نظر گرفته می‌شوند (همیشه بیرون از بازه).
- بیرون از بازهٔ فعال، Heartbeatها تا تیک بعدی درون بازه رد می‌شوند.

</ParamField>

## رفتار تحویل

<AccordionGroup>
  <Accordion title="مسیریابی نشست و مقصد">
    - Heartbeatها به‌طور پیش‌فرض در نشست اصلی عامل اجرا می‌شوند (`agent:<id>:<mainKey>`)، یا وقتی `session.scope = "global"` باشد در `global`. برای بازنویسی به یک نشست کانال مشخص (Discord/WhatsApp/و غیره)، `session` را تنظیم کنید.
    - `session` فقط زمینهٔ اجرا را تحت تأثیر قرار می‌دهد؛ تحویل با `target` و `to` کنترل می‌شود.
    - برای تحویل به یک کانال/گیرندهٔ مشخص، `target` + `to` را تنظیم کنید. با `target: "last"`، تحویل از آخرین کانال خارجی برای آن نشست استفاده می‌کند.
    - تحویل‌های Heartbeat به‌طور پیش‌فرض مقصدهای مستقیم/DM را مجاز می‌دانند. برای سرکوب ارسال به مقصدهای مستقیم، در حالی که نوبت Heartbeat همچنان اجرا می‌شود، `directPolicy: "block"` را تنظیم کنید.
    - اگر صف اصلی، مسیر نشست مقصد، مسیر Cron، یا یک کار Cron فعال مشغول باشد، Heartbeat رد می‌شود و بعداً دوباره تلاش می‌شود.
    - اگر `skipWhenBusy: true` باشد، زیرعامل کلیدخورده با نشستِ این عامل و مسیرهای تو در تو نیز اجرای Heartbeat را به تعویق می‌اندازند. مسیرهای مشغول عامل‌های دیگر این عامل را به تعویق نمی‌اندازند.
    - اگر `target` به هیچ مقصد خارجی حل نشود، اجرا همچنان انجام می‌شود اما هیچ پیام خروجی فرستاده نمی‌شود.

  </Accordion>
  <Accordion title="نمایانی و رفتار رد شدن">
    - اگر `showOk`، `showAlerts`، و `useIndicator` همگی غیرفعال باشند، اجرا از ابتدا با `reason=alerts-disabled` رد می‌شود.
    - اگر فقط تحویل هشدار غیرفعال باشد، OpenClaw همچنان می‌تواند Heartbeat را اجرا کند، مهرهای زمانی کارهای سررسیدشده را به‌روزرسانی کند، مهر زمانی بیکاری نشست را بازیابی کند، و محمولهٔ هشدار بیرونی را سرکوب کند.
    - اگر مقصد حل‌شدهٔ Heartbeat از تایپ‌کردن پشتیبانی کند، OpenClaw هنگام فعال بودن اجرای Heartbeat تایپ‌کردن را نشان می‌دهد. این از همان مقصدی استفاده می‌کند که Heartbeat خروجی چت را به آن می‌فرستاد، و با `typingMode: "never"` غیرفعال می‌شود.

  </Accordion>
  <Accordion title="چرخهٔ عمر نشست و ممیزی">
    - پاسخ‌های فقط Heartbeat نشست را زنده نگه **نمی‌دارند**. فرادادهٔ Heartbeat ممکن است ردیف نشست را به‌روزرسانی کند، اما انقضای بیکاری از `lastInteractionAt` از آخرین پیام واقعی کاربر/کانال استفاده می‌کند، و انقضای روزانه از `sessionStartedAt`.
    - تاریخچهٔ Control UI و WebChat پرامپت‌های Heartbeat و تأییدهای فقط OK را پنهان می‌کند. رونوشت نشست زیربنایی همچنان می‌تواند آن نوبت‌ها را برای ممیزی/بازپخش در خود داشته باشد.
    - [کارهای پس‌زمینه](/fa/automation/tasks) جداشده می‌توانند یک رویداد سیستمی را صف کنند و وقتی نشست اصلی باید چیزی را سریع متوجه شود، Heartbeat را بیدار کنند. آن بیدارسازی اجرای Heartbeat را به یک کار پس‌زمینه تبدیل نمی‌کند.

  </Accordion>
</AccordionGroup>

## کنترل‌های نمایانی

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

اولویت: هر حساب → هر کانال → پیش‌فرض‌های کانال → پیش‌فرض‌های توکار.

### هر پرچم چه کاری انجام می‌دهد

- `showOk`: وقتی مدل یک پاسخ فقط OK برمی‌گرداند، یک تأیید `HEARTBEAT_OK` می‌فرستد.
- `showAlerts`: وقتی مدل یک پاسخ غیر OK برمی‌گرداند، محتوای هشدار را می‌فرستد.
- `useIndicator`: رویدادهای نشانگر را برای سطح‌های وضعیت UI منتشر می‌کند.

اگر **هر سه** false باشند، OpenClaw اجرای Heartbeat را به‌طور کامل رد می‌کند (بدون فراخوانی مدل).

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

| هدف                                     | پیکربندی                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| رفتار پیش‌فرض (OKهای بی‌صدا، هشدارها روشن) | _(نیازی به پیکربندی نیست)_                                                               |
| کاملاً بی‌صدا (بدون پیام، بدون نشانگر) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| فقط نشانگر (بدون پیام)                 | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK فقط در یک کانال                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختیاری)

اگر فایل `HEARTBEAT.md` در فضای کاری وجود داشته باشد، پرامپت پیش‌فرض به عامل می‌گوید آن را بخواند. آن را «فهرست بررسی Heartbeat» خود در نظر بگیرید: کوچک، پایدار، و امن برای بررسی هر ۳۰ دقیقه.

در اجراهای عادی، `HEARTBEAT.md` فقط وقتی تزریق می‌شود که راهنمای Heartbeat برای عامل پیش‌فرض فعال باشد. غیرفعال کردن آهنگ Heartbeat با `0m` یا تنظیم `includeSystemPromptSection: false` آن را از زمینهٔ راه‌اندازی عادی حذف می‌کند.

در harness بومی Codex، محتوای `HEARTBEAT.md` به نوبت تزریق نمی‌شود. اگر فایل وجود داشته باشد و محتوای غیر فاصلهٔ سفید داشته باشد، دستورهای حالت همکاری Heartbeat، Codex را به فایل ارجاع می‌دهند و به آن می‌گویند پیش از ادامه آن را بخواند.

اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خط‌های خالی، نظرهای Markdown/HTML، تیترهای Markdown مانند `# Heading`، نشانگرهای fence، یا stubهای خالی فهرست بررسی)، OpenClaw اجرای Heartbeat را برای صرفه‌جویی در فراخوانی‌های API رد می‌کند. آن رد شدن به‌صورت `reason=empty-heartbeat-file` گزارش می‌شود. اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کاری انجام دهد.

آن را بسیار کوچک نگه دارید (فهرست بررسی یا یادآوری‌های کوتاه) تا از بزرگ شدن پرامپت جلوگیری شود.

نمونهٔ `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### بلوک‌های `tasks:`

`HEARTBEAT.md` همچنین از یک بلوک ساخت‌یافتهٔ کوچک `tasks:` برای بررسی‌های مبتنی بر بازه درون خود Heartbeat پشتیبانی می‌کند.

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
    - OpenClaw بلوک `tasks:` را تجزیه می‌کند و هر کار را در برابر `interval` خودش بررسی می‌کند.
    - فقط کارهای **سررسیدشده** در پرامپت Heartbeat برای آن تیک گنجانده می‌شوند.
    - اگر هیچ کاری سررسید نشده باشد، Heartbeat به‌طور کامل رد می‌شود (`reason=no-tasks-due`) تا از فراخوانی هدررفتهٔ مدل جلوگیری شود.
    - محتوای غیرکار در `HEARTBEAT.md` حفظ می‌شود و پس از فهرست کارهای سررسیدشده به‌عنوان زمینهٔ اضافی افزوده می‌شود.
    - مهرهای زمانی آخرین اجرای کار در وضعیت نشست (`heartbeatTaskState`) ذخیره می‌شوند، بنابراین بازه‌ها از راه‌اندازی‌های مجدد عادی جان سالم به در می‌برند.
    - مهرهای زمانی کار فقط پس از کامل شدن اجرای Heartbeat در مسیر پاسخ عادی آن جلو برده می‌شوند. اجراهای ردشدهٔ `empty-heartbeat-file` / `no-tasks-due` کارها را کامل‌شده علامت نمی‌زنند.

  </Accordion>
</AccordionGroup>

حالت کار زمانی مفید است که می‌خواهید یک فایل Heartbeat چند بررسی دوره‌ای را نگه دارد بدون اینکه در هر تیک هزینهٔ همهٔ آن‌ها را بپردازید.

### آیا عامل می‌تواند HEARTBEAT.md را به‌روزرسانی کند؟

بله، اگر از آن بخواهید.

`HEARTBEAT.md` فقط یک فایل عادی در فضای کاری عامل است، بنابراین می‌توانید به عامل (در یک چت عادی) چیزی شبیه این بگویید:

- "`HEARTBEAT.md` را به‌روزرسانی کن تا یک بررسی روزانهٔ تقویم اضافه شود."
- "`HEARTBEAT.md` را بازنویسی کن تا کوتاه‌تر و متمرکز بر پیگیری‌های صندوق ورودی باشد."

اگر می‌خواهید این کار به‌صورت پیش‌دستانه انجام شود، می‌توانید یک خط صریح نیز در پرامپت Heartbeat خود بگنجانید، مانند: «اگر فهرست بررسی کهنه شد، HEARTBEAT.md را با نسخهٔ بهتری به‌روزرسانی کن.»

<Warning>
رازها (کلیدهای API، شماره‌های تلفن، توکن‌های خصوصی) را در `HEARTBEAT.md` نگذارید؛ این فایل بخشی از زمینهٔ پرامپت می‌شود.
</Warning>

## بیدارسازی دستی (درخواستی)

می‌توانید یک رویداد سیستمی را صف کنید و با این دستور یک Heartbeat فوری راه‌اندازی کنید:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

اگر چند عامل `heartbeat` پیکربندی‌شده داشته باشند، بیدارسازی دستی هرکدام از آن Heartbeatهای عامل را فوراً اجرا می‌کند.

برای انتظار تا تیک زمان‌بندی‌شدهٔ بعدی، از `--mode next-heartbeat` استفاده کنید.

## تحویل استدلال (اختیاری)

به‌طور پیش‌فرض، Heartbeatها فقط محمولهٔ «پاسخ» نهایی را تحویل می‌دهند.

اگر شفافیت می‌خواهید، این را فعال کنید:

- `agents.defaults.heartbeat.includeReasoning: true`

وقتی فعال باشد، Heartbeatها همچنین یک پیام جداگانه با پیشوند `Thinking` تحویل می‌دهند (همان شکل `/reasoning on`). این می‌تواند زمانی مفید باشد که عامل چند نشست/کدکس را مدیریت می‌کند و می‌خواهید ببینید چرا تصمیم گرفته به شما پینگ بزند؛ اما همچنین می‌تواند جزئیات داخلی بیشتری از آنچه می‌خواهید افشا کند. بهتر است در چت‌های گروهی آن را خاموش نگه دارید.

## آگاهی از هزینه

Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند. بازه‌های کوتاه‌تر توکن‌های بیشتری مصرف می‌کنند. برای کاهش هزینه:

- از `isolatedSession: true` استفاده کنید تا از ارسال تاریخچهٔ کامل مکالمه جلوگیری شود (از حدود ۱۰۰ هزار توکن به حدود ۲ تا ۵ هزار در هر اجرا).
- از `lightContext: true` استفاده کنید تا فایل‌های راه‌اندازی فقط به `HEARTBEAT.md` محدود شوند.
- یک `model` ارزان‌تر تنظیم کنید (برای نمونه `ollama/llama3.2:1b`).
- `HEARTBEAT.md` را کوچک نگه دارید.
- اگر فقط به‌روزرسانی‌های وضعیت داخلی می‌خواهید، از `target: "none"` استفاده کنید.

## سرریز زمینه پس از Heartbeat

اگر یک Heartbeat قبلاً یک نشست موجود را روی یک مدل محلی کوچک‌تر باقی گذاشته باشد، برای نمونه یک مدل Ollama با پنجرهٔ 32k، و نوبت بعدی نشست اصلی سرریز زمینه گزارش کند، مدل زمان‌اجرای نشست را به مدل اصلی پیکربندی‌شده بازنشانی کنید. پیام بازنشانی OpenClaw وقتی آخرین مدل زمان‌اجرا با `heartbeat.model` پیکربندی‌شده مطابقت داشته باشد، این را صریح بیان می‌کند.

Heartbeatهای فعلی پس از کامل شدن اجرا، مدل زمان‌اجرای موجود نشست مشترک را حفظ می‌کنند. همچنان می‌توانید از `isolatedSession: true` برای اجرای Heartbeatها در یک نشست تازه استفاده کنید، آن را با `lightContext: true` برای کوچک‌ترین پرامپت ترکیب کنید، یا یک مدل Heartbeat با پنجرهٔ زمینهٔ به‌اندازهٔ کافی بزرگ برای نشست مشترک انتخاب کنید.

## مرتبط

- [اتوماسیون](/fa/automation) — همه سازوکارهای اتوماسیون در یک نگاه
- [وظایف پس‌زمینه](/fa/automation/tasks) — نحوه رهگیری کارهای جداشده
- [منطقه زمانی](/fa/concepts/timezone) — نحوه تأثیر منطقه زمانی بر زمان‌بندی Heartbeat
- [عیب‌یابی](/fa/automation/cron-jobs#troubleshooting) — اشکال‌زدایی مشکلات اتوماسیون

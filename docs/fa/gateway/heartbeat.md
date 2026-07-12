---
read_when:
    - تنظیم تناوب یا پیام‌رسانی Heartbeat
    - انتخاب بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Heartbeat
summary: پیام‌های نظرسنجی Heartbeat و قواعد اعلان‌ها
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T10:01:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat یا Cron؟** برای راهنمایی درباره زمان استفاده از هرکدام، به [خودکارسازی](/fa/automation) مراجعه کنید.
</Note>

Heartbeat در نشست اصلی، **نوبت‌های دوره‌ای عامل** را اجرا می‌کند تا مدل بتواند بدون ارسال پیام‌های مزاحم، هر مورد نیازمند توجه را مطرح کند.

Heartbeat یک نوبت زمان‌بندی‌شده در نشست اصلی است و رکوردهای [وظیفه پس‌زمینه](/fa/automation/tasks) را ایجاد **نمی‌کند**. رکوردهای وظیفه برای کارهای جداشده هستند (اجرای ACP، عامل‌های فرعی و کارهای Cron ایزوله).

عیب‌یابی: [وظایف زمان‌بندی‌شده](/fa/automation/cron-jobs#troubleshooting)

## شروع سریع (مبتدی)

<Steps>
  <Step title="انتخاب تناوب">
    Heartbeatها را فعال نگه دارید (مقدار پیش‌فرض `30m` است، یا هنگامی که احراز هویت OAuth/توکنی Anthropic پیکربندی شده باشد، از جمله استفاده مجدد از Claude CLI، مقدار `1h`) یا تناوب دلخواه خود را تنظیم کنید.
  </Step>
  <Step title="افزودن HEARTBEAT.md (اختیاری)">
    یک فهرست بررسی کوچک در `HEARTBEAT.md` یا یک بلوک `tasks:` در فضای کاری عامل ایجاد کنید.
  </Step>
  <Step title="تعیین مقصد پیام‌های Heartbeat">
    مقدار پیش‌فرض `target: "none"` است؛ برای هدایت پیام‌ها به آخرین مخاطب، `target: "last"` را تنظیم کنید.
  </Step>
  <Step title="تنظیم اختیاری">
    - برای شفافیت، ارسال استدلال Heartbeat را فعال کنید.
    - اگر اجرای Heartbeat فقط به `HEARTBEAT.md` نیاز دارد، از زمینه راه‌اندازی سبک استفاده کنید.
    - برای جلوگیری از ارسال کل تاریخچه مکالمه در هر Heartbeat، نشست‌های ایزوله را فعال کنید.
    - Heartbeatها را به ساعات فعال (زمان محلی) محدود کنید.

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

## مقادیر پیش‌فرض

- فاصله زمانی: `30m`. اعمال مقادیر پیش‌فرض ارائه‌دهنده Anthropic، هنگامی که حالت احراز هویت نهایی OAuth/توکنی باشد (از جمله استفاده مجدد از Claude CLI)، آن را به `1h` افزایش می‌دهد، اما فقط تا زمانی که `heartbeat.every` تنظیم نشده باشد. `agents.defaults.heartbeat.every` یا `agents.list[].heartbeat.every` را برای هر عامل تنظیم کنید؛ برای غیرفعال‌سازی از `0m` استفاده کنید.
- متن اعلان (قابل پیکربندی از طریق `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- مهلت زمانی: نوبت‌های Heartbeat که مهلتشان تنظیم نشده است، در صورت تنظیم بودن `agents.defaults.timeoutSeconds` از آن استفاده می‌کنند. در غیر این صورت، از تناوب Heartbeat با سقف ۶۰۰ ثانیه استفاده می‌کنند. برای کارهای طولانی‌تر Heartbeat، `agents.defaults.heartbeat.timeoutSeconds` یا `agents.list[].heartbeat.timeoutSeconds` را برای هر عامل تنظیم کنید.
- اعلان Heartbeat **عیناً** به‌عنوان پیام کاربر ارسال می‌شود. اعلان سیستم فقط زمانی شامل بخش «Heartbeatها» است که Heartbeat برای عامل پیش‌فرض فعال باشد (و `includeSystemPromptSection` برابر `false` نباشد)؛ اجرا نیز به‌صورت داخلی علامت‌گذاری می‌شود.
- هنگامی که Heartbeatها با `0m` غیرفعال شوند، اجراهای عادی نیز `HEARTBEAT.md` را از زمینه راه‌اندازی حذف می‌کنند تا مدل دستورالعمل‌های مختص Heartbeat را نبیند.
- ساعات فعال (`heartbeat.activeHours`) در منطقه زمانی پیکربندی‌شده بررسی می‌شوند. خارج از این بازه، Heartbeatها تا تیک بعدی درون بازه نادیده گرفته می‌شوند.
- Heartbeatها هنگام فعال یا در صف بودن کار Cron به‌طور خودکار به تعویق می‌افتند. برای اینکه اجرای یک عامل هنگام مشغول بودن عامل فرعی مبتنی بر کلید نشست خودش یا مسیرهای فرمان تودرتویش نیز به تعویق بیفتد، `heartbeat.skipWhenBusy: true` را تنظیم کنید؛ عامل‌های هم‌سطح دیگر صرفاً به‌دلیل در حال اجرا بودن کار عامل فرعی یک عامل دیگر متوقف نمی‌شوند.

## کاربرد اعلان Heartbeat

اعلان پیش‌فرض عمداً گسترده است:

- **وظایف پس‌زمینه**: عبارت «وظایف انجام‌نشده را در نظر بگیر» عامل را ترغیب می‌کند پیگیری‌ها (صندوق ورودی، تقویم، یادآوری‌ها و کارهای در صف) را بررسی کند و موارد فوری را مطرح سازد.
- **احوال‌پرسی با انسان**: عبارت «گاهی در طول روز حال انسان خود را بپرس» عامل را به ارسال گاه‌به‌گاه یک پیام سبک مانند «چیزی نیاز دارید؟» ترغیب می‌کند، اما با استفاده از منطقه زمانی محلی پیکربندی‌شده شما، از ارسال پیام‌های مزاحم در شب جلوگیری می‌کند (به [منطقه زمانی](/fa/concepts/timezone) مراجعه کنید).

Heartbeat می‌تواند به [وظایف پس‌زمینه](/fa/automation/tasks) تکمیل‌شده واکنش نشان دهد، اما اجرای خود Heartbeat رکورد وظیفه ایجاد نمی‌کند.

اگر می‌خواهید Heartbeat کار بسیار مشخصی انجام دهد (برای مثال «آمار Gmail PubSub را بررسی کن» یا «سلامت Gateway را تأیید کن»)، `agents.defaults.heartbeat.prompt` (یا `agents.list[].heartbeat.prompt`) را روی متن سفارشی تنظیم کنید (که عیناً ارسال می‌شود).

## قرارداد پاسخ

- اگر هیچ موردی نیازمند توجه نیست، با **`HEARTBEAT_OK`** پاسخ دهید.
- اجرای Heartbeat می‌تواند به‌جای آن `heartbeat_respond` را با `notify: false` برای عدم نمایش به‌روزرسانی، یا با `notify: true` به‌همراه `notificationText` برای ارسال هشدار فراخوانی کند. در صورت وجود، پاسخ ساخت‌یافته ابزار بر متن جایگزین اولویت دارد.
- هنگام اجرای Heartbeat، اگر `HEARTBEAT_OK` در **ابتدا یا انتهای** پاسخ ظاهر شود، OpenClaw آن را به‌عنوان تأیید دریافت در نظر می‌گیرد. این توکن حذف می‌شود و اگر محتوای باقی‌مانده **≤ `ackMaxChars`** باشد (پیش‌فرض: ۳۰۰)، پاسخ کنار گذاشته می‌شود.
- اگر `HEARTBEAT_OK` در **میانه** پاسخ ظاهر شود، رفتار ویژه‌ای با آن نمی‌شود.
- برای هشدارها، `HEARTBEAT_OK` را درج **نکنید**؛ فقط متن هشدار را برگردانید.

خارج از Heartbeatها، `HEARTBEAT_OK`های ناخواسته در ابتدا یا انتهای پیام حذف و ثبت می‌شوند؛ پیامی که فقط شامل `HEARTBEAT_OK` باشد کنار گذاشته می‌شود.

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
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### دامنه و اولویت

- `agents.defaults.heartbeat` رفتار سراسری Heartbeat را تنظیم می‌کند.
- `agents.list[].heartbeat` روی آن ادغام می‌شود؛ اگر هر عاملی بلوک `heartbeat` داشته باشد، **فقط همان عامل‌ها** Heartbeat را اجرا می‌کنند.
- `channels.defaults.heartbeat` مقادیر پیش‌فرض نمایش‌پذیری را برای همه کانال‌ها تنظیم می‌کند.
- `channels.<channel>.heartbeat` مقادیر پیش‌فرض کانال را بازنویسی می‌کند.
- `channels.<channel>.accounts.<id>.heartbeat` (برای کانال‌های چندحسابی) تنظیمات هر کانال را بازنویسی می‌کند.

### Heartbeatهای هر عامل

اگر هر ورودی `agents.list[]` شامل بلوک `heartbeat` باشد، **فقط همان عامل‌ها** Heartbeat را اجرا می‌کنند. بلوک هر عامل روی `agents.defaults.heartbeat` ادغام می‌شود (بنابراین می‌توانید مقادیر پیش‌فرض مشترک را یک‌بار تنظیم و برای هر عامل بازنویسی کنید).

نمونه: دو عامل که فقط عامل دوم Heartbeat را اجرا می‌کند.

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

Heartbeatها را به ساعات کاری در یک منطقه زمانی مشخص محدود کنید:

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

خارج از این بازه (پیش از ساعت ۹ صبح یا پس از ساعت ۱۰ شب به وقت شرق آمریکا)، Heartbeatها نادیده گرفته می‌شوند. تیک زمان‌بندی‌شده بعدی درون بازه به‌طور عادی اجرا خواهد شد.

### راه‌اندازی شبانه‌روزی

اگر می‌خواهید Heartbeatها تمام روز اجرا شوند، از یکی از این الگوها استفاده کنید:

- `activeHours` را به‌طور کامل حذف کنید (بدون محدودیت بازه زمانی؛ این رفتار پیش‌فرض است).
- یک بازه تمام‌روز تنظیم کنید: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
زمان `start` و `end` یکسان تنظیم نکنید (برای مثال از `08:00` تا `08:00`). این حالت به‌عنوان بازه‌ای با عرض صفر در نظر گرفته می‌شود؛ بنابراین Heartbeatها همیشه نادیده گرفته می‌شوند.
</Warning>

### نمونه چندحسابی

برای هدف‌گیری حسابی مشخص در کانال‌های چندحسابی مانند Telegram، از `accountId` استفاده کنید:

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
  فاصله زمانی Heartbeat (رشته مدت‌زمان؛ واحد پیش‌فرض = دقیقه).
</ParamField>
<ParamField path="model" type="string">
  بازنویسی اختیاری مدل برای اجرای Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  در صورت فعال بودن، پیام جداگانه `Thinking` نیز در صورت موجود بودن ارسال می‌شود (با همان ساختار `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  در صورت `true` بودن، اجرای Heartbeat از زمینه راه‌اندازی سبک استفاده می‌کند و از میان فایل‌های راه‌اندازی فضای کاری فقط `HEARTBEAT.md` را نگه می‌دارد.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  در صورت `true` بودن، هر Heartbeat در نشستی تازه و بدون تاریخچه مکالمات قبلی اجرا می‌شود. از همان الگوی ایزوله‌سازی Cron با `sessionTarget: "isolated"` استفاده می‌کند. هزینه توکن هر Heartbeat را به‌شدت کاهش می‌دهد. برای بیشترین صرفه‌جویی، آن را با `lightContext: true` ترکیب کنید. هدایت ارسال همچنان از زمینه نشست اصلی استفاده می‌کند.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  در صورت `true` بودن، اجرای Heartbeat هنگام مشغول بودن مسیرهای اضافی آن عامل به تعویق می‌افتد: عامل فرعی مبتنی بر کلید نشست خودش یا کار فرمان تودرتو. مسیرهای Cron حتی بدون این پرچم همیشه Heartbeatها را به تعویق می‌اندازند تا میزبان‌های مدل محلی، اعلان‌های Cron و Heartbeat را هم‌زمان اجرا نکنند.
</ParamField>
<ParamField path="session" type="string">
  کلید اختیاری نشست برای اجرای Heartbeat.

- `main` (پیش‌فرض): نشست اصلی عامل.
- کلید صریح نشست (آن را از `openclaw sessions --json` یا [CLI نشست‌ها](/fa/cli/sessions) کپی کنید).
- قالب‌های کلید نشست: به [نشست‌ها](/fa/concepts/session) و [گروه‌ها](/fa/channels/groups) مراجعه کنید.

</ParamField>
<ParamField path="target" type="string">
- `last`: ارسال به آخرین کانال خارجی استفاده‌شده.
- کانال صریح: هر کانال پیکربندی‌شده یا شناسه Plugin، برای مثال `discord`، `matrix`، `telegram` یا `whatsapp`.
- `none` (پیش‌فرض): Heartbeat را اجرا می‌کند، اما آن را به‌صورت خارجی ارسال **نمی‌کند**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  رفتار ارسال مستقیم/پیام خصوصی را کنترل می‌کند. `allow`: ارسال مستقیم/پیام خصوصی Heartbeat را مجاز می‌کند. `block`: ارسال مستقیم/پیام خصوصی را متوقف می‌کند (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  بازنویسی اختیاری گیرنده (شناسه‌ای ویژهٔ کانال، برای مثال E.164 برای WhatsApp یا شناسهٔ گفت‌وگوی Telegram). برای موضوع‌ها/رشته‌های Telegram، از `<chatId>:topic:<messageThreadId>` استفاده کنید.

</ParamField>
<ParamField path="accountId" type="string">
  شناسهٔ حساب اختیاری برای کانال‌های چندحسابی. وقتی `target: "last"` است، شناسهٔ حساب برای آخرین کانال حل‌شده اعمال می‌شود، به‌شرط آنکه آن کانال از حساب‌ها پشتیبانی کند؛ در غیر این صورت نادیده گرفته می‌شود. اگر شناسهٔ حساب با هیچ حساب پیکربندی‌شده‌ای برای کانال حل‌شده مطابقت نداشته باشد، تحویل انجام نمی‌شود.

</ParamField>
<ParamField path="prompt" type="string">
  بدنهٔ پیش‌فرض پرامپت را بازنویسی می‌کند (ادغام نمی‌شود).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  تعیین می‌کند که آیا بخش `## Heartbeats` از پرامپت سیستمی عامل پیش‌فرض درج شود یا نه. برای حفظ رفتار زمان اجرای Heartbeat (تناوب، تحویل، HEARTBEAT.md) و در عین حال حذف دستورالعمل‌های Heartbeat از پرامپت سیستمی عامل، آن را روی `false` تنظیم کنید.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  حداکثر تعداد نویسه‌های مجاز پس از `HEARTBEAT_OK` پیش از تحویل.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  وقتی درست باشد، محتوای هشدار خطای ابزار را هنگام اجرای Heartbeat سرکوب می‌کند.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  حداکثر تعداد ثانیه‌های مجاز برای یک نوبت عامل Heartbeat پیش از لغو آن. برای استفاده از `agents.defaults.timeoutSeconds` در صورت تنظیم بودن، و در غیر این صورت استفاده از تناوب Heartbeat با سقف ۶۰۰ ثانیه، این مقدار را تنظیم‌نشده رها کنید.

</ParamField>
<ParamField path="activeHours" type="object">
  اجرای Heartbeat را به یک بازهٔ زمانی محدود می‌کند. شیئی با `start` (HH:MM، شامل ابتدا؛ برای آغاز روز از `00:00` استفاده کنید)، `end` (HH:MM، بدون شامل کردن انتها؛ برای پایان روز استفاده از `24:00` مجاز است) و `timezone` اختیاری.

- حذف‌شده یا `"user"`: اگر `agents.defaults.userTimezone` تنظیم شده باشد از آن استفاده می‌کند؛ در غیر این صورت به منطقهٔ زمانی سیستم میزبان بازمی‌گردد.
- `"local"`: همیشه از منطقهٔ زمانی سیستم میزبان استفاده می‌کند.
- هر شناسهٔ IANA (برای مثال `America/New_York`): مستقیماً استفاده می‌شود؛ اگر نامعتبر باشد، به رفتار `"user"` در بالا بازمی‌گردد.
- برای یک بازهٔ فعال، `start` و `end` نباید برابر باشند؛ مقادیر برابر به‌عنوان بازه‌ای با عرض صفر در نظر گرفته می‌شوند (همیشه خارج از بازه).
- خارج از بازهٔ فعال، Heartbeatها تا تیک بعدی درون بازه نادیده گرفته می‌شوند.

</ParamField>

## رفتار تحویل

<AccordionGroup>
  <Accordion title="چرخهٔ نشست و مسیریابی مقصد">
    - Heartbeatها به‌طور پیش‌فرض در نشست اصلی عامل اجرا می‌شوند (`agent:<id>:<mainKey>`)، یا وقتی `session.scope = "global"` باشد در `global`. برای بازنویسی با یک نشست کانال مشخص (Discord/WhatsApp/و غیره)، `session` را تنظیم کنید.
    - `session` فقط بر زمینهٔ اجرا اثر می‌گذارد؛ تحویل توسط `target` و `to` کنترل می‌شود.
    - برای تحویل به یک کانال/گیرندهٔ مشخص، `target` و `to` را تنظیم کنید. با `target: "last"`، تحویل از آخرین کانال خارجی آن نشست استفاده می‌کند.
    - تحویل‌های Heartbeat به‌طور پیش‌فرض مقصدهای مستقیم/پیام خصوصی را مجاز می‌دانند. برای جلوگیری از ارسال به مقصد مستقیم، در حالی که نوبت Heartbeat همچنان اجرا می‌شود، `directPolicy: "block"` را تنظیم کنید.
    - اگر صف اصلی، مسیر نشست مقصد، مسیر Cron یا یک کار فعال Cron مشغول باشد، Heartbeat نادیده گرفته می‌شود و بعداً دوباره تلاش خواهد شد.
    - اگر `skipWhenBusy: true` باشد، زیرعامل‌ها و مسیرهای تودرتوی وابسته به کلید نشست این عامل نیز اجرای Heartbeat را به تعویق می‌اندازند. مسیرهای مشغول عامل‌های دیگر اجرای این عامل را به تعویق نمی‌اندازند.
    - اگر `target` به هیچ مقصد خارجی حل نشود، اجرا همچنان انجام می‌شود، اما هیچ پیام خروجی ارسال نمی‌شود.

  </Accordion>
  <Accordion title="نمایانی و رفتار نادیده‌گیری">
    - اگر `showOk`، `showAlerts` و `useIndicator` همگی غیرفعال باشند، اجرا از همان ابتدا با `reason=alerts-disabled` نادیده گرفته می‌شود.
    - اگر فقط تحویل هشدار غیرفعال باشد، OpenClaw همچنان می‌تواند Heartbeat را اجرا کند، مُهرهای زمانی کارهای سررسیدشده را به‌روزرسانی کند، مُهر زمانی بیکاری نشست را بازگرداند و محتوای هشدار بیرونی را سرکوب کند.
    - اگر مقصد حل‌شدهٔ Heartbeat از نمایش در حال تایپ پشتیبانی کند، OpenClaw هنگام فعال بودن اجرای Heartbeat وضعیت در حال تایپ را نمایش می‌دهد. این کار از همان مقصدی استفاده می‌کند که Heartbeat خروجی گفت‌وگو را به آن می‌فرستاد و با `typingMode: "never"` غیرفعال می‌شود.

  </Accordion>
  <Accordion title="چرخهٔ عمر نشست و ممیزی">
    - پاسخ‌های صرفاً مربوط به Heartbeat، نشست را زنده نگه **نمی‌دارند**. فرادادهٔ Heartbeat ممکن است ردیف نشست را به‌روزرسانی کند، اما انقضای بیکاری از `lastInteractionAt` مربوط به آخرین پیام واقعی کاربر/کانال استفاده می‌کند و انقضای روزانه از `sessionStartedAt`.
    - تاریخچهٔ رابط کنترل و WebChat، پرامپت‌های Heartbeat و تأییدهای صرفاً OK را پنهان می‌کند. رونوشت زیربنایی نشست همچنان می‌تواند این نوبت‌ها را برای ممیزی/بازپخش در خود داشته باشد.
    - [کارهای پس‌زمینه](/fa/automation/tasks) جداشده می‌توانند یک رویداد سیستمی را در صف قرار دهند و وقتی نشست اصلی باید سریع متوجه چیزی شود، Heartbeat را بیدار کنند. این بیدارسازی، اجرای Heartbeat را به یک کار پس‌زمینه تبدیل نمی‌کند.

  </Accordion>
</AccordionGroup>

## کنترل‌های نمایانی

به‌طور پیش‌فرض، تأییدهای `HEARTBEAT_OK` سرکوب می‌شوند، در حالی که محتوای هشدار تحویل داده می‌شود. می‌توانید این مورد را برای هر کانال یا هر حساب تنظیم کنید:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK را پنهان می‌کند (پیش‌فرض)
      showAlerts: true # پیام‌های هشدار را نمایش می‌دهد (پیش‌فرض)
      useIndicator: true # رویدادهای نشانگر را منتشر می‌کند (پیش‌فرض)
  telegram:
    heartbeat:
      showOk: true # تأییدهای OK را در Telegram نمایش می‌دهد
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # تحویل هشدار برای این حساب را سرکوب می‌کند
```

ترتیب اولویت: به‌ازای حساب ← به‌ازای کانال ← پیش‌فرض‌های کانال ← پیش‌فرض‌های داخلی.

### عملکرد هر پرچم

- `showOk`: وقتی مدل پاسخی صرفاً از نوع OK برمی‌گرداند، یک تأیید `HEARTBEAT_OK` ارسال می‌کند.
- `showAlerts`: وقتی مدل پاسخی غیر از OK برمی‌گرداند، محتوای هشدار را ارسال می‌کند.
- `useIndicator`: رویدادهای نشانگر را برای سطوح وضعیت رابط کاربری منتشر می‌کند.

اگر **هر سه** نادرست باشند، OpenClaw اجرای Heartbeat را کاملاً نادیده می‌گیرد (بدون فراخوانی مدل).

### نمونه‌های به‌ازای کانال و به‌ازای حساب

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # همهٔ حساب‌های Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # هشدارها را فقط برای حساب ops سرکوب می‌کند
  telegram:
    heartbeat:
      showOk: true
```

### الگوهای رایج

| هدف                                      | پیکربندی                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| رفتار پیش‌فرض (OKهای بی‌صدا، هشدارها روشن) | _(نیازی به پیکربندی نیست)_                                                               |
| کاملاً بی‌صدا (بدون پیام و نشانگر)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| فقط نشانگر (بدون پیام)                    | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK فقط در یک کانال                        | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختیاری)

اگر فایل `HEARTBEAT.md` در فضای کاری وجود داشته باشد، پرامپت پیش‌فرض به عامل می‌گوید آن را بخواند. آن را «چک‌لیست Heartbeat» خود در نظر بگیرید: کوچک، پایدار و ایمن برای بررسی هر ۳۰ دقیقه.

در اجراهای عادی، `HEARTBEAT.md` فقط زمانی درج می‌شود که راهنمای Heartbeat برای عامل پیش‌فرض فعال باشد. غیرفعال‌کردن تناوب Heartbeat با `0m` یا تنظیم `includeSystemPromptSection: false` آن را از زمینهٔ راه‌اندازی عادی حذف می‌کند.

در چارچوب بومی Codex، محتوای `HEARTBEAT.md` مانند سایر فایل‌های راه‌اندازی در نوبت درج نمی‌شود. اگر فایل وجود داشته باشد و محتوای غیرسفید داشته باشد، یک یادداشت حالت همکاری Heartbeat، Codex را به آن فایل ارجاع می‌دهد و به آن می‌گوید پیش از ادامه فایل را بخواند.

اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خطوط خالی، توضیحات Markdown/HTML، عنوان‌های Markdown مانند `# Heading`، نشانگرهای حصار یا نمونه‌های خالی چک‌لیست)، OpenClaw برای صرفه‌جویی در فراخوانی‌های API اجرای Heartbeat را نادیده می‌گیرد. این نادیده‌گیری با `reason=empty-heartbeat-file` گزارش می‌شود. اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کاری انجام دهد.

برای جلوگیری از حجیم‌شدن پرامپت، آن را بسیار کوچک نگه دارید (چک‌لیست کوتاه یا یادآوری‌ها).

نمونهٔ `HEARTBEAT.md`:

```md
# چک‌لیست Heartbeat

- بررسی سریع: آیا چیزی فوری در صندوق‌های ورودی وجود دارد؟
- اگر روز است و مورد دیگری در انتظار نیست، یک بررسی مختصر انجام دهید.
- اگر کاری مسدود شده است، _آنچه کم است_ را یادداشت کنید و دفعهٔ بعد از Peter بپرسید.
```

### بلوک‌های `tasks:`

`HEARTBEAT.md` همچنین از یک بلوک ساختاریافتهٔ کوچک `tasks:` برای بررسی‌های مبتنی بر فاصلهٔ زمانی در خود Heartbeat پشتیبانی می‌کند.

نمونه:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "ایمیل‌های خوانده‌نشدهٔ فوری را بررسی کنید و هر مورد حساس به زمان را علامت بزنید."
- name: calendar-scan
  interval: 2h
  prompt: "جلسه‌های پیش رو را که به آماده‌سازی یا پیگیری نیاز دارند بررسی کنید."

# دستورالعمل‌های تکمیلی

- هشدارها را کوتاه نگه دارید.
- اگر پس از همهٔ کارهای سررسیدشده هیچ موردی نیازمند توجه نبود، HEARTBEAT_OK پاسخ دهید.
```

<AccordionGroup>
  <Accordion title="رفتار">
    - OpenClaw بلوک `tasks:` را تجزیه می‌کند و هر کار را بر اساس `interval` خودش بررسی می‌کند.
    - فقط کارهای **سررسیدشده** در پرامپت Heartbeat آن تیک گنجانده می‌شوند.
    - اگر هیچ کاری سررسید نشده باشد، Heartbeat کاملاً نادیده گرفته می‌شود (`reason=no-tasks-due`) تا از یک فراخوانی هدررفتهٔ مدل جلوگیری شود.
    - محتوای غیرمرتبط با کارها در `HEARTBEAT.md` حفظ می‌شود و پس از فهرست کارهای سررسیدشده به‌عنوان زمینهٔ تکمیلی افزوده می‌شود.
    - مُهرهای زمانی آخرین اجرای کارها در وضعیت نشست (`heartbeatTaskState`) ذخیره می‌شوند، بنابراین فاصله‌های زمانی پس از راه‌اندازی مجدد عادی حفظ می‌شوند.
    - مُهرهای زمانی کارها فقط پس از آن به جلو برده می‌شوند که اجرای Heartbeat مسیر پاسخ عادی خود را کامل کند. اجراهای نادیده‌گرفته‌شدهٔ `empty-heartbeat-file` / `no-tasks-due` کارها را تکمیل‌شده علامت نمی‌زنند.

  </Accordion>
</AccordionGroup>

حالت کار زمانی مفید است که می‌خواهید یک فایل Heartbeat چندین بررسی دوره‌ای را نگه دارد، بدون اینکه در هر تیک هزینهٔ همهٔ آن‌ها را بپردازید.

### آیا عامل می‌تواند HEARTBEAT.md را به‌روزرسانی کند؟

بله، اگر از آن بخواهید.

`HEARTBEAT.md` فقط یک فایل عادی در فضای کاری عامل است، بنابراین می‌توانید در یک گفت‌وگوی عادی چیزی شبیه این به عامل بگویید:

- «`HEARTBEAT.md` را به‌روزرسانی کن تا یک بررسی روزانهٔ تقویم اضافه شود.»
- «`HEARTBEAT.md` را بازنویسی کن تا کوتاه‌تر و متمرکز بر پیگیری صندوق ورودی باشد.»

اگر می‌خواهید این کار به‌صورت پیش‌دستانه انجام شود، می‌توانید یک خط صریح مانند این نیز در پرامپت Heartbeat بگنجانید: «اگر چک‌لیست قدیمی شد، HEARTBEAT.md را با نسخهٔ بهتری به‌روزرسانی کن.»

<Warning>
اسرار (کلیدهای API، شماره‌های تلفن، توکن‌های خصوصی) را در `HEARTBEAT.md` قرار ندهید؛ این فایل بخشی از زمینهٔ پرامپت می‌شود.
</Warning>

## بیدارسازی دستی (برحسب درخواست)

برای قرار دادن یک رویداد سیستمی در صف و در صورت تمایل، فعال‌کردن فوری Heartbeat از `openclaw system event` استفاده کنید:

```bash
openclaw system event --text "پیگیری‌های فوری را بررسی کن" --mode now
```

| پرچم                         | توضیحات                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | متن رویداد سیستمی (الزامی).                                                                      |
| `--mode <mode>`              | `now` یک Heartbeat فوری اجرا می‌کند؛ `next-heartbeat` (پیش‌فرض) تا تیک زمان‌بندی‌شدهٔ بعدی منتظر می‌ماند. |
| `--session-key <sessionKey>` | یک نشست مشخص را برای رویداد هدف قرار می‌دهد؛ پیش‌فرض، نشست اصلی عامل است.                         |
| `--json`                     | خروجی JSON.                                                                                      |

اگر هیچ `--session-key` داده نشود و چند عامل دارای `heartbeat` پیکربندی‌شده باشند، `--mode now` Heartbeat هر یک از آن عامل‌ها را فوراً اجرا می‌کند.

کنترل‌های مرتبط Heartbeat در همان گروه CLI:

```bash
openclaw system heartbeat last     # نمایش آخرین رویداد Heartbeat
openclaw system heartbeat enable   # فعال‌کردن Heartbeatها
openclaw system heartbeat disable  # غیرفعال‌کردن Heartbeatها
```

## تحویل استدلال (اختیاری)

به‌طور پیش‌فرض، Heartbeatها فقط بارِ نهایی «پاسخ» را تحویل می‌دهند.

اگر شفافیت می‌خواهید، این گزینه را فعال کنید:

- `agents.defaults.heartbeat.includeReasoning: true`

پس از فعال‌سازی، Heartbeatها یک پیام جداگانه با پیشوند `Thinking` نیز تحویل می‌دهند (با همان ساختار `/reasoning on`). این قابلیت زمانی مفید است که عامل چند نشست/نمونهٔ Codex را مدیریت می‌کند و می‌خواهید بدانید چرا تصمیم گرفته است به شما پیام دهد؛ اما ممکن است جزئیات داخلی بیشتری از حد مطلوب شما افشا کند. در گفت‌وگوهای گروهی بهتر است آن را غیرفعال نگه دارید.

## آگاهی از هزینه

Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند. فاصله‌های زمانی کوتاه‌تر، توکن بیشتری مصرف می‌کنند. برای کاهش هزینه:

- از `isolatedSession: true` استفاده کنید تا تاریخچهٔ کامل گفت‌وگو ارسال نشود (کاهش از حدود ۱۰۰ هزار توکن به حدود ۲ تا ۵ هزار توکن در هر اجرا).
- از `lightContext: true` استفاده کنید تا فایل‌های راه‌اندازی فقط به `HEARTBEAT.md` محدود شوند.
- یک `model` ارزان‌تر تنظیم کنید (برای مثال `ollama/llama3.2:1b`).
- فایل `HEARTBEAT.md` را کوچک نگه دارید.
- اگر فقط به‌روزرسانی‌های وضعیت داخلی را می‌خواهید، از `target: "none"` استفاده کنید.

## سرریز زمینه پس از Heartbeat

Heartbeatها پس از پایان اجرا، مدل زمان‌اجرای موجودِ نشست مشترک را حفظ می‌کنند؛ بنابراین Heartbeatی که نشست را به یک مدل محلی کوچک‌تر تغییر داده باشد (برای مثال یک مدل Ollama با پنجرهٔ ۳۲ هزار توکنی)، ممکن است آن مدل را برای نوبت بعدی نشست اصلی باقی بگذارد. اگر نوبت بعدی سپس سرریز زمینه را گزارش کند و آخرین مدل زمان‌اجرای نشست با `heartbeat.model` پیکربندی‌شده مطابقت داشته باشد، پیام بازیابی OpenClaw نشت مدل Heartbeat را به‌عنوان علت احتمالی مطرح می‌کند و راه‌حلی پیشنهاد می‌دهد.

برای جلوگیری از این وضعیت: از `isolatedSession: true` استفاده کنید تا Heartbeatها در نشستی تازه اجرا شوند (در صورت تمایل همراه با `lightContext: true` برای کوچک‌ترین پرامپت)، یا مدلی برای Heartbeat انتخاب کنید که پنجرهٔ زمینهٔ آن برای نشست مشترک به‌اندازهٔ کافی بزرگ باشد.

## مرتبط

- [خودکارسازی](/fa/automation) - نمایی کلی از همهٔ سازوکارهای خودکارسازی
- [وظایف پس‌زمینه](/fa/automation/tasks) - نحوهٔ ردیابی کارهای جداشده
- [منطقهٔ زمانی](/fa/concepts/timezone) - تأثیر منطقهٔ زمانی بر زمان‌بندی Heartbeat
- [عیب‌یابی](/fa/automation/cron-jobs#troubleshooting) - اشکال‌زدایی مشکلات خودکارسازی

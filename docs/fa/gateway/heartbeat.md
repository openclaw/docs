---
read_when:
    - تنظیم تناوب Heartbeat یا پیام‌رسانی
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Heartbeat
summary: پیام‌های واکشی دوره‌ای Heartbeat و قواعد اعلان
title: Heartbeat
x-i18n:
    generated_at: "2026-04-29T22:52:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bafae7cafb9163015a112c074d36ab070c71d1d7ba1c7c0834e6720521f4275
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat در برابر Cron؟** برای راهنمایی درباره زمان استفاده از هرکدام، [اتوماسیون و وظایف](/fa/automation) را ببینید.
</Note>

Heartbeat، **نوبت‌های دوره‌ای عامل** را در نشست اصلی اجرا می‌کند تا مدل بتواند هر چیزی را که نیاز به توجه دارد، بدون ارسال پیام‌های مزاحم، مطرح کند.

Heartbeat یک نوبت زمان‌بندی‌شده در نشست اصلی است — **رکورد [وظیفه پس‌زمینه](/fa/automation/tasks)** ایجاد نمی‌کند. رکوردهای وظیفه برای کارهای جداشده هستند (اجرای ACP، زیربرنامه‌های عامل، کارهای Cron ایزوله).

عیب‌یابی: [وظایف زمان‌بندی‌شده](/fa/automation/cron-jobs#troubleshooting)

## شروع سریع (مبتدی)

<Steps>
  <Step title="انتخاب تناوب">
    Heartbeatها را فعال بگذارید (پیش‌فرض `30m` است، یا برای احراز هویت Anthropic OAuth/token، شامل استفاده دوباره از Claude CLI، `1h`) یا تناوب خودتان را تنظیم کنید.
  </Step>
  <Step title="افزودن HEARTBEAT.md (اختیاری)">
    یک چک‌لیست کوچک `HEARTBEAT.md` یا بلوک `tasks:` در فضای کاری عامل ایجاد کنید.
  </Step>
  <Step title="تصمیم‌گیری درباره مقصد پیام‌های Heartbeat">
    `target: "none"` پیش‌فرض است؛ برای مسیردهی به آخرین مخاطب، `target: "last"` را تنظیم کنید.
  </Step>
  <Step title="تنظیم اختیاری">
    - برای شفافیت، تحویل استدلال Heartbeat را فعال کنید.
    - اگر اجرای Heartbeatها فقط به `HEARTBEAT.md` نیاز دارد، از زمینه راه‌اندازی سبک استفاده کنید.
    - برای جلوگیری از ارسال کل تاریخچه مکالمه در هر Heartbeat، نشست‌های ایزوله را فعال کنید.
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

- بازه زمانی: `30m` (یا وقتی حالت احراز هویت شناسایی‌شده Anthropic OAuth/token باشد، شامل استفاده دوباره از Claude CLI، `1h`). `agents.defaults.heartbeat.every` یا `agents.list[].heartbeat.every` را برای هر عامل تنظیم کنید؛ برای غیرفعال کردن از `0m` استفاده کنید.
- بدنه اعلان (قابل پیکربندی از طریق `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- اعلان Heartbeat **عیناً** به‌عنوان پیام کاربر ارسال می‌شود. اعلان سیستم فقط زمانی که Heartbeatها برای عامل پیش‌فرض فعال باشند، شامل بخش "Heartbeat" می‌شود و اجرا به‌صورت داخلی علامت‌گذاری می‌شود.
- وقتی Heartbeatها با `0m` غیرفعال می‌شوند، اجراهای عادی نیز `HEARTBEAT.md` را از زمینه راه‌اندازی حذف می‌کنند تا مدل دستورالعمل‌های مخصوص Heartbeat را نبیند.
- ساعت‌های فعال (`heartbeat.activeHours`) در منطقه زمانی پیکربندی‌شده بررسی می‌شوند. بیرون از این بازه، Heartbeatها تا تیک بعدی داخل بازه رد می‌شوند.
- وقتی کار Cron فعال یا در صف باشد، Heartbeatها به‌طور خودکار به تعویق می‌افتند. برای تعویق در مسیرهای اضافه شلوغ (زیربرنامه عامل یا کار فرمان تودرتو) نیز `heartbeat.skipWhenBusy: true` را تنظیم کنید؛ این برای Ollama محلی و میزبان‌های تک‌زمان‌اجرای محدود دیگر مفید است.

## اعلان Heartbeat برای چیست

اعلان پیش‌فرض عمداً گسترده است:

- **وظایف پس‌زمینه**: «وظایف باز را در نظر بگیر» عامل را ترغیب می‌کند پیگیری‌ها را بررسی کند (صندوق ورودی، تقویم، یادآورها، کارهای صف‌شده) و هر مورد فوری را مطرح کند.
- **سر زدن به انسان**: «گاهی در طول روز به انسان خود سر بزن» یک پیام سبک و گاه‌به‌گاه از نوع «چیزی لازم داری؟» را ترغیب می‌کند، اما با استفاده از منطقه زمانی محلی پیکربندی‌شده شما، از پیام‌های مزاحم شبانه جلوگیری می‌کند (نگاه کنید به [منطقه زمانی](/fa/concepts/timezone)).

Heartbeat می‌تواند به [وظایف پس‌زمینه](/fa/automation/tasks) تکمیل‌شده واکنش نشان دهد، اما اجرای خود Heartbeat رکورد وظیفه ایجاد نمی‌کند.

اگر می‌خواهید Heartbeat کاری بسیار مشخص انجام دهد (مثلاً «آمار Gmail PubSub را بررسی کن» یا «سلامت Gateway را تأیید کن»)، `agents.defaults.heartbeat.prompt` (یا `agents.list[].heartbeat.prompt`) را روی بدنه سفارشی تنظیم کنید (عیناً ارسال می‌شود).

## قرارداد پاسخ

- اگر هیچ چیزی نیاز به توجه ندارد، با **`HEARTBEAT_OK`** پاسخ دهید.
- در طول اجرای Heartbeat، OpenClaw وقتی `HEARTBEAT_OK` در **ابتدا یا انتهای** پاسخ ظاهر شود، آن را به‌عنوان تأیید در نظر می‌گیرد. این توکن حذف می‌شود و اگر محتوای باقی‌مانده **≤ `ackMaxChars`** باشد (پیش‌فرض: 300)، پاسخ دور انداخته می‌شود.
- اگر `HEARTBEAT_OK` در **میانه** پاسخ ظاهر شود، رفتار ویژه‌ای با آن نمی‌شود.
- برای هشدارها، **`HEARTBEAT_OK`** را وارد نکنید؛ فقط متن هشدار را برگردانید.

بیرون از Heartbeatها، `HEARTBEAT_OK` پراکنده در ابتدا/انتهای پیام حذف و ثبت می‌شود؛ پیامی که فقط `HEARTBEAT_OK` باشد دور انداخته می‌شود.

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

### دامنه و اولویت

- `agents.defaults.heartbeat` رفتار سراسری Heartbeat را تنظیم می‌کند.
- `agents.list[].heartbeat` روی آن ادغام می‌شود؛ اگر هر عاملی بلوک `heartbeat` داشته باشد، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند.
- `channels.defaults.heartbeat` پیش‌فرض‌های نمایش را برای همه کانال‌ها تنظیم می‌کند.
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

بیرون از این بازه (قبل از ۹ صبح یا بعد از ۱۰ شب به وقت شرق آمریکا)، Heartbeatها رد می‌شوند. تیک زمان‌بندی‌شده بعدی داخل بازه به‌طور عادی اجرا می‌شود.

### راه‌اندازی 24/7

اگر می‌خواهید Heartbeatها تمام روز اجرا شوند، از یکی از این الگوها استفاده کنید:

- `activeHours` را کاملاً حذف کنید (بدون محدودیت بازه زمانی؛ این رفتار پیش‌فرض است).
- یک بازه تمام‌روزه تنظیم کنید: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
زمان `start` و `end` یکسان تنظیم نکنید (برای مثال `08:00` تا `08:00`). این به‌عنوان بازه‌ای با عرض صفر در نظر گرفته می‌شود، بنابراین Heartbeatها همیشه رد می‌شوند.
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

### یادداشت‌های فیلدها

<ParamField path="every" type="string">
  بازه Heartbeat (رشته مدت‌زمان؛ واحد پیش‌فرض = دقیقه).
</ParamField>
<ParamField path="model" type="string">
  بازنویسی اختیاری مدل برای اجرای Heartbeatها (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  وقتی فعال باشد، پیام جداگانه `Reasoning:` را نیز در صورت موجود بودن تحویل می‌دهد (همان شکل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  وقتی true باشد، اجرای Heartbeatها از زمینه راه‌اندازی سبک استفاده می‌کند و فقط `HEARTBEAT.md` را از فایل‌های راه‌اندازی فضای کاری نگه می‌دارد.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  وقتی true باشد، هر Heartbeat در یک نشست تازه بدون تاریخچه مکالمه قبلی اجرا می‌شود. از همان الگوی ایزولاسیون Cron `sessionTarget: "isolated"` استفاده می‌کند. هزینه توکن هر Heartbeat را به‌شدت کاهش می‌دهد. برای بیشترین صرفه‌جویی، با `lightContext: true` ترکیب کنید. مسیردهی تحویل همچنان از زمینه نشست اصلی استفاده می‌کند.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  وقتی true باشد، اجرای Heartbeatها در مسیرهای اضافه شلوغ به تعویق می‌افتد: زیربرنامه عامل یا کار فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم، بنابراین میزبان‌های مدل محلی اعلان‌های Cron و Heartbeat را هم‌زمان اجرا نمی‌کنند.
</ParamField>
<ParamField path="session" type="string">
  کلید نشست اختیاری برای اجرای Heartbeatها.

- `main` (پیش‌فرض): نشست اصلی عامل.
- کلید نشست صریح (از `openclaw sessions --json` یا [CLI نشست‌ها](/fa/cli/sessions) کپی کنید).
- قالب‌های کلید نشست: [نشست‌ها](/fa/concepts/session) و [گروه‌ها](/fa/channels/groups) را ببینید.

</ParamField>
<ParamField path="target" type="string">
- `last`: به آخرین کانال خارجی استفاده‌شده تحویل بده.
- کانال صریح: هر کانال یا شناسه Plugin پیکربندی‌شده، برای مثال `discord`، `matrix`، `telegram`، یا `whatsapp`.
- `none` (پیش‌فرض): Heartbeat را اجرا کن اما بیرونی **تحویل نده**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  رفتار تحویل مستقیم/DM را کنترل می‌کند. `allow`: تحویل مستقیم/DM Heartbeat را مجاز می‌کند. `block`: تحویل مستقیم/DM را سرکوب می‌کند (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  بازنویسی اختیاری گیرنده (شناسه مخصوص کانال، مثلاً E.164 برای WhatsApp یا شناسه گفت‌وگوی Telegram). برای موضوع‌ها/رشته‌های Telegram، از `<chatId>:topic:<messageThreadId>` استفاده کنید.

</ParamField>
<ParamField path="accountId" type="string">
  شناسه حساب اختیاری برای کانال‌های چندحسابی. وقتی `target: "last"` باشد، شناسه حساب در صورت پشتیبانی کانال آخر حل‌شده از حساب‌ها، روی همان کانال اعمال می‌شود؛ وگرنه نادیده گرفته می‌شود. اگر شناسه حساب با حساب پیکربندی‌شده برای کانال حل‌شده مطابقت نداشته باشد، تحویل رد می‌شود.

</ParamField>
<ParamField path="prompt" type="string">
  بدنه اعلان پیش‌فرض را بازنویسی می‌کند (ادغام نمی‌شود).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  بیشینه نویسه‌های مجاز پس از `HEARTBEAT_OK` پیش از تحویل.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  وقتی true باشد، payloadهای هشدار خطای ابزار را هنگام اجرای Heartbeat پنهان می‌کند.

</ParamField>
<ParamField path="activeHours" type="object">
  اجرای Heartbeat را به یک بازهٔ زمانی محدود می‌کند. شیئی با `start` (HH:MM، شامل؛ برای آغاز روز از `00:00` استفاده کنید)، `end` (HH:MM غیرشامل؛ برای پایان روز `24:00` مجاز است)، و `timezone` اختیاری.

- حذف‌شده یا `"user"`: اگر `agents.defaults.userTimezone` تنظیم شده باشد از آن استفاده می‌کند، وگرنه به منطقهٔ زمانی سیستم میزبان برمی‌گردد.
- `"local"`: همیشه از منطقهٔ زمانی سیستم میزبان استفاده می‌کند.
- هر شناسهٔ IANA (مثلاً `America/New_York`): مستقیماً استفاده می‌شود؛ اگر نامعتبر باشد، به رفتار `"user"` بالا برمی‌گردد.
- `start` و `end` برای یک پنجرهٔ فعال نباید برابر باشند؛ مقادیر برابر به‌عنوان عرض صفر در نظر گرفته می‌شوند (همیشه بیرون از پنجره).
- بیرون از پنجرهٔ فعال، Heartbeatها تا tick بعدی داخل پنجره رد می‌شوند.

</ParamField>

## رفتار تحویل

<AccordionGroup>
  <Accordion title="مسیر‌دهی نشست و مقصد">
    - Heartbeatها به‌طور پیش‌فرض در نشست اصلی عامل اجرا می‌شوند (`agent:<id>:<mainKey>`)، یا وقتی `session.scope = "global"` باشد در `global`. برای override کردن به یک نشست کانال مشخص (Discord/WhatsApp/و غیره)، `session` را تنظیم کنید.
    - `session` فقط زمینهٔ اجرا را تحت تأثیر قرار می‌دهد؛ تحویل با `target` و `to` کنترل می‌شود.
    - برای تحویل به یک کانال/گیرندهٔ مشخص، `target` + `to` را تنظیم کنید. با `target: "last"`، تحویل از آخرین کانال خارجی برای آن نشست استفاده می‌کند.
    - تحویل‌های Heartbeat به‌طور پیش‌فرض مقصدهای مستقیم/DM را مجاز می‌دانند. برای پنهان کردن ارسال به مقصدهای مستقیم در حالی که نوبت Heartbeat همچنان اجرا می‌شود، `directPolicy: "block"` را تنظیم کنید.
    - اگر صف اصلی، lane نشست مقصد، lane cron، یا یک کار Cron فعال مشغول باشد، Heartbeat رد می‌شود و بعداً دوباره تلاش می‌شود.
    - اگر `skipWhenBusy: true` باشد، laneهای زیرعامل و تو‌در‌تو نیز اجرای Heartbeat را به تعویق می‌اندازند.
    - اگر `target` به هیچ مقصد خارجی resolve نشود، اجرا همچنان انجام می‌شود اما هیچ پیام خروجی ارسال نمی‌شود.

  </Accordion>
  <Accordion title="قابلیت مشاهده و رفتار رد کردن">
    - اگر `showOk`، `showAlerts`، و `useIndicator` همگی غیرفعال باشند، اجرا از ابتدا با `reason=alerts-disabled` رد می‌شود.
    - اگر فقط تحویل هشدار غیرفعال باشد، OpenClaw همچنان می‌تواند Heartbeat را اجرا کند، timestampهای کارهای سررسیدشده را به‌روزرسانی کند، timestamp بیکاری نشست را بازیابی کند، و payload هشدار بیرونی را پنهان کند.
    - اگر مقصد resolveشدهٔ Heartbeat از typing پشتیبانی کند، OpenClaw تا زمانی که اجرای Heartbeat فعال است typing نشان می‌دهد. این از همان مقصدی استفاده می‌کند که Heartbeat خروجی chat را به آن می‌فرستاد، و با `typingMode: "never"` غیرفعال می‌شود.

  </Accordion>
  <Accordion title="چرخهٔ عمر نشست و audit">
    - پاسخ‌های فقط Heartbeat نشست را زنده نگه نمی‌دارند. فرادادهٔ Heartbeat ممکن است ردیف نشست را به‌روزرسانی کند، اما انقضای بیکاری از `lastInteractionAt` مربوط به آخرین پیام واقعی کاربر/کانال استفاده می‌کند، و انقضای روزانه از `sessionStartedAt`.
    - تاریخچهٔ Control UI و WebChat اعلان‌های Heartbeat و تأییدیه‌های فقط OK را پنهان می‌کند. transcript زیربنایی نشست همچنان می‌تواند آن نوبت‌ها را برای audit/replay در خود داشته باشد.
    - [کارهای پس‌زمینه](/fa/automation/tasks) جداشده می‌توانند یک رویداد سیستمی را در صف بگذارند و وقتی نشست اصلی باید چیزی را سریع متوجه شود، Heartbeat را بیدار کنند. آن بیدارسازی باعث نمی‌شود اجرای Heartbeat به یک کار پس‌زمینه تبدیل شود.

  </Accordion>
</AccordionGroup>

## کنترل‌های قابلیت مشاهده

به‌طور پیش‌فرض، تأییدیه‌های `HEARTBEAT_OK` پنهان می‌شوند در حالی که محتوای هشدار تحویل داده می‌شود. می‌توانید این را برای هر کانال یا هر حساب تنظیم کنید:

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

اولویت: به‌ازای هر حساب → به‌ازای هر کانال → پیش‌فرض‌های کانال → پیش‌فرض‌های داخلی.

### هر flag چه کاری انجام می‌دهد

- `showOk`: وقتی مدل یک پاسخ فقط OK برمی‌گرداند، یک تأییدیهٔ `HEARTBEAT_OK` ارسال می‌کند.
- `showAlerts`: وقتی مدل یک پاسخ غیر OK برمی‌گرداند، محتوای هشدار را ارسال می‌کند.
- `useIndicator`: رویدادهای indicator را برای سطح‌های وضعیت UI منتشر می‌کند.

اگر **هر سه** false باشند، OpenClaw اجرای Heartbeat را کاملاً رد می‌کند (بدون فراخوانی مدل).

### نمونه‌های به‌ازای کانال در برابر به‌ازای حساب

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

اگر فایل `HEARTBEAT.md` در workspace وجود داشته باشد، prompt پیش‌فرض به عامل می‌گوید آن را بخواند. آن را مانند «چک‌لیست Heartbeat» خودتان در نظر بگیرید: کوچک، پایدار، و امن برای گنجاندن هر ۳۰ دقیقه.

در اجراهای عادی، `HEARTBEAT.md` فقط وقتی تزریق می‌شود که راهنمایی Heartbeat برای عامل پیش‌فرض فعال باشد. غیرفعال کردن cadence Heartbeat با `0m` یا تنظیم `includeSystemPromptSection: false` آن را از زمینهٔ bootstrap عادی حذف می‌کند.

اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خط‌های خالی و headerهای markdown مثل `# Heading`)، OpenClaw اجرای Heartbeat را برای صرفه‌جویی در فراخوانی‌های API رد می‌کند. آن رد شدن با `reason=empty-heartbeat-file` گزارش می‌شود. اگر فایل موجود نباشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کند.

آن را بسیار کوچک نگه دارید (چک‌لیست یا یادآوری‌های کوتاه) تا از حجیم شدن prompt جلوگیری شود.

نمونهٔ `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### بلوک‌های `tasks:`

`HEARTBEAT.md` همچنین از یک بلوک ساختاریافتهٔ کوچک `tasks:` برای بررسی‌های مبتنی بر interval داخل خود Heartbeat پشتیبانی می‌کند.

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
    - فقط کارهای **سررسیدشده** در prompt آن tick برای Heartbeat گنجانده می‌شوند.
    - اگر هیچ کاری سررسید نشده باشد، Heartbeat کاملاً رد می‌شود (`reason=no-tasks-due`) تا از فراخوانی هدررفتهٔ مدل جلوگیری شود.
    - محتوای غیرکاری در `HEARTBEAT.md` حفظ می‌شود و پس از فهرست کارهای سررسیدشده به‌عنوان زمینهٔ اضافی اضافه می‌شود.
    - timestampهای آخرین اجرای کار در state نشست (`heartbeatTaskState`) ذخیره می‌شوند، بنابراین intervalها پس از restartهای عادی باقی می‌مانند.
    - timestampهای کار فقط پس از آن جلو برده می‌شوند که اجرای Heartbeat مسیر پاسخ عادی خود را کامل کند. اجراهای ردشدهٔ `empty-heartbeat-file` / `no-tasks-due` کارها را کامل‌شده علامت‌گذاری نمی‌کنند.

  </Accordion>
</AccordionGroup>

حالت کار زمانی مفید است که می‌خواهید یک فایل Heartbeat چند بررسی دوره‌ای را نگه دارد بدون اینکه در هر tick هزینهٔ همهٔ آن‌ها را بپردازید.

### آیا عامل می‌تواند HEARTBEAT.md را به‌روزرسانی کند؟

بله — اگر از آن بخواهید.

`HEARTBEAT.md` فقط یک فایل عادی در workspace عامل است، بنابراین می‌توانید به عامل (در یک chat عادی) چیزی مانند این بگویید:

- «`HEARTBEAT.md` را به‌روزرسانی کن تا یک بررسی روزانهٔ تقویم اضافه شود.»
- «`HEARTBEAT.md` را بازنویسی کن تا کوتاه‌تر و متمرکز بر پیگیری‌های inbox باشد.»

اگر می‌خواهید این کار به‌صورت proactive انجام شود، می‌توانید یک خط صریح هم در prompt Heartbeat خود بگنجانید مثل: «اگر چک‌لیست کهنه شد، HEARTBEAT.md را با نسخهٔ بهتری به‌روزرسانی کن.»

<Warning>
رازها (کلیدهای API، شماره تلفن‌ها، tokenهای خصوصی) را در `HEARTBEAT.md` قرار ندهید — این فایل بخشی از زمینهٔ prompt می‌شود.
</Warning>

## بیدارسازی دستی (درخواستی)

می‌توانید یک رویداد سیستمی را در صف بگذارید و با این دستور یک Heartbeat فوری trigger کنید:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

اگر چند عامل `heartbeat` را پیکربندی کرده باشند، بیدارسازی دستی بلافاصله Heartbeat هر یک از آن عامل‌ها را اجرا می‌کند.

برای منتظر ماندن تا tick زمان‌بندی‌شدهٔ بعدی، از `--mode next-heartbeat` استفاده کنید.

## تحویل reasoning (اختیاری)

به‌طور پیش‌فرض، Heartbeatها فقط payload نهایی «پاسخ» را تحویل می‌دهند.

اگر شفافیت می‌خواهید، این را فعال کنید:

- `agents.defaults.heartbeat.includeReasoning: true`

وقتی فعال باشد، Heartbeatها یک پیام جداگانه با پیشوند `Reasoning:` نیز تحویل می‌دهند (هم‌شکل با `/reasoning on`). این می‌تواند زمانی مفید باشد که عامل چند نشست/codex را مدیریت می‌کند و می‌خواهید ببینید چرا تصمیم گرفته به شما ping بدهد — اما همچنین می‌تواند جزئیات داخلی بیشتری از آنچه می‌خواهید فاش کند. بهتر است در group chatها خاموش نگه داشته شود.

## آگاهی از هزینه

Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند. intervalهای کوتاه‌تر tokenهای بیشتری مصرف می‌کنند. برای کاهش هزینه:

- از `isolatedSession: true` استفاده کنید تا از ارسال کامل تاریخچهٔ مکالمه جلوگیری شود (از حدود 100K token به حدود 2-5K در هر اجرا).
- از `lightContext: true` استفاده کنید تا فایل‌های bootstrap فقط به `HEARTBEAT.md` محدود شوند.
- یک `model` ارزان‌تر تنظیم کنید (مثلاً `ollama/llama3.2:1b`).
- `HEARTBEAT.md` را کوچک نگه دارید.
- اگر فقط به‌روزرسانی‌های state داخلی می‌خواهید، از `target: "none"` استفاده کنید.

## سرریز context پس از Heartbeat

اگر یک Heartbeat از مدل محلی کوچک‌تری استفاده می‌کند، مثلاً یک مدل Ollama با پنجرهٔ 32k، و نوبت بعدی نشست اصلی سرریز context را گزارش می‌کند، بررسی کنید آیا Heartbeat قبلی نشست را روی مدل Heartbeat باقی گذاشته است یا نه. پیام reset در OpenClaw وقتی آخرین مدل runtime با `heartbeat.model` پیکربندی‌شده مطابقت داشته باشد، به این موضوع اشاره می‌کند.

برای اجرای Heartbeatها در یک نشست تازه از `isolatedSession: true` استفاده کنید، برای کوچک‌ترین prompt آن را با `lightContext: true` ترکیب کنید، یا یک مدل Heartbeat با پنجرهٔ context به‌اندازهٔ کافی بزرگ برای نشست مشترک انتخاب کنید.

## مرتبط

- [اتوماسیون و کارها](/fa/automation) — همهٔ سازوکارهای اتوماسیون در یک نگاه
- [کارهای پس‌زمینه](/fa/automation/tasks) — نحوهٔ رهگیری کار جداشده
- [منطقهٔ زمانی](/fa/concepts/timezone) — اینکه منطقهٔ زمانی چگونه بر زمان‌بندی Heartbeat اثر می‌گذارد
- [عیب‌یابی](/fa/automation/cron-jobs#troubleshooting) — debug کردن مشکلات اتوماسیون

---
read_when:
    - تنظیم تناوب Heartbeat یا پیام‌رسانی
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Heartbeat
summary: پیام‌های پرس‌وجوی دوره‌ای Heartbeat و قواعد اعلان
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T20:44:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat در برابر cron؟** برای راهنمایی درباره زمان استفاده از هرکدام، [اتوماسیون و کارها](/fa/automation) را ببینید.
</Note>

Heartbeat در نشست اصلی، **نوبت‌های دوره‌ای عامل** را اجرا می‌کند تا مدل بتواند هر چیزی را که نیاز به توجه دارد، بدون ارسال پیام‌های مزاحم به شما نشان دهد.

Heartbeat یک نوبت زمان‌بندی‌شده در نشست اصلی است؛ **سوابق [کار پس‌زمینه](/fa/automation/tasks)** ایجاد نمی‌کند. سوابق کار برای کارهای جداشده هستند (اجرای ACP، زیرعامل‌ها، کارهای جداافتاده cron).

عیب‌یابی: [کارهای زمان‌بندی‌شده](/fa/automation/cron-jobs#troubleshooting)

## شروع سریع (مبتدی)

<Steps>
  <Step title="یک تناوب انتخاب کنید">
    Heartbeatها را فعال بگذارید (پیش‌فرض `30m` است، یا برای احراز هویت Anthropic OAuth/توکن، شامل استفاده دوباره از Claude CLI، `1h`) یا تناوب دلخواه خود را تنظیم کنید.
  </Step>
  <Step title="HEARTBEAT.md را اضافه کنید (اختیاری)">
    یک چک‌لیست کوچک `HEARTBEAT.md` یا بلوک `tasks:` در فضای کاری عامل ایجاد کنید.
  </Step>
  <Step title="تصمیم بگیرید پیام‌های Heartbeat کجا بروند">
    `target: "none"` پیش‌فرض است؛ برای هدایت به آخرین مخاطب، `target: "last"` را تنظیم کنید.
  </Step>
  <Step title="تنظیم اختیاری">
    - برای شفافیت، تحویل استدلال Heartbeat را فعال کنید.
    - اگر اجرای Heartbeat فقط به `HEARTBEAT.md` نیاز دارد، از زمینه راه‌اندازی سبک استفاده کنید.
    - برای جلوگیری از ارسال تاریخچه کامل مکالمه در هر Heartbeat، نشست‌های جداافتاده را فعال کنید.
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

- فاصله زمانی: `30m` (یا وقتی حالت احراز هویت تشخیص‌داده‌شده Anthropic OAuth/توکن باشد، شامل استفاده دوباره از Claude CLI، `1h`). `agents.defaults.heartbeat.every` یا `agents.list[].heartbeat.every` را برای هر عامل تنظیم کنید؛ برای غیرفعال‌سازی از `0m` استفاده کنید.
- بدنه پرامپت (قابل پیکربندی از طریق `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- پرامپت Heartbeat به‌صورت **کلمه‌به‌کلمه** به‌عنوان پیام کاربر ارسال می‌شود. پرامپت سیستم فقط وقتی Heartbeatها برای عامل پیش‌فرض فعال باشند، یک بخش «Heartbeat» دارد، و اجرا به‌صورت داخلی علامت‌گذاری می‌شود.
- وقتی Heartbeatها با `0m` غیرفعال باشند، اجراهای عادی همچنین `HEARTBEAT.md` را از زمینه راه‌اندازی حذف می‌کنند تا مدل دستورالعمل‌های مخصوص Heartbeat را نبیند.
- ساعت‌های فعال (`heartbeat.activeHours`) در منطقه زمانی پیکربندی‌شده بررسی می‌شوند. بیرون از بازه، Heartbeatها تا تیک بعدی داخل بازه رد می‌شوند.
- Heartbeatها وقتی کار cron فعال یا در صف باشد، به‌صورت خودکار به تعویق می‌افتند. برای به تعویق انداختن در مسیرهای بسیار شلوغ دیگر (کار زیرعامل یا فرمان تودرتو) نیز `heartbeat.skipWhenBusy: true` را تنظیم کنید؛ این برای Ollama محلی و میزبان‌های تک‌زمان‌اجرای محدود دیگر مفید است.

## پرامپت Heartbeat برای چیست

پرامپت پیش‌فرض عمدا گسترده است:

- **کارهای پس‌زمینه**: «کارهای بازمانده را در نظر بگیر» عامل را ترغیب می‌کند پیگیری‌ها (صندوق ورودی، تقویم، یادآورها، کارهای صف‌شده) را مرور کند و هر مورد فوری را نشان دهد.
- **سرکشی به انسان**: «گاهی در طول روز از انسان خود سرکشی کن» پیام سبک و گهگاهی «چیزی لازم داری؟» را ترغیب می‌کند، اما با استفاده از منطقه زمانی محلی پیکربندی‌شده شما از پیام‌های مزاحم شبانه جلوگیری می‌کند ( [منطقه زمانی](/fa/concepts/timezone) را ببینید).

Heartbeat می‌تواند به [کارهای پس‌زمینه](/fa/automation/tasks) تکمیل‌شده واکنش نشان دهد، اما اجرای خود Heartbeat سابقه کار ایجاد نمی‌کند.

اگر می‌خواهید Heartbeat کار بسیار مشخصی انجام دهد (مثلا «آمار Gmail PubSub را بررسی کن» یا «سلامت Gateway را تایید کن»)، `agents.defaults.heartbeat.prompt` (یا `agents.list[].heartbeat.prompt`) را روی بدنه سفارشی تنظیم کنید (کلمه‌به‌کلمه ارسال می‌شود).

## قرارداد پاسخ

- اگر چیزی نیاز به توجه ندارد، با **`HEARTBEAT_OK`** پاسخ دهید.
- اجراهای Heartbeat دارای ابزار ممکن است در عوض `heartbeat_respond` را با `notify: false` برای نبود به‌روزرسانی قابل مشاهده، یا با `notify: true` به‌همراه `notificationText` برای هشدار فراخوانی کنند. در صورت وجود، پاسخ ساخت‌یافته ابزار بر جایگزین متنی اولویت دارد.
- در طول اجرای Heartbeat، OpenClaw وقتی `HEARTBEAT_OK` در **ابتدا یا انتهای** پاسخ ظاهر شود، آن را تایید دریافت در نظر می‌گیرد. توکن حذف می‌شود و اگر محتوای باقی‌مانده **≤ `ackMaxChars`** باشد، پاسخ کنار گذاشته می‌شود (پیش‌فرض: 300).
- اگر `HEARTBEAT_OK` در **میانه** پاسخ ظاهر شود، رفتار ویژه‌ای با آن نمی‌شود.
- برای هشدارها، **`HEARTBEAT_OK` را وارد نکنید**؛ فقط متن هشدار را برگردانید.

بیرون از Heartbeatها، `HEARTBEAT_OK` ناخواسته در ابتدا/انتهای پیام حذف و ثبت می‌شود؛ پیامی که فقط `HEARTBEAT_OK` باشد کنار گذاشته می‌شود.

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

### Heartbeatهای هر عامل

اگر هر ورودی `agents.list[]` شامل بلوک `heartbeat` باشد، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند. بلوک هر عامل روی `agents.defaults.heartbeat` ادغام می‌شود (پس می‌توانید پیش‌فرض‌های مشترک را یک‌بار تنظیم کنید و برای هر عامل بازنویسی کنید).

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

بیرون از این بازه (قبل از 9 صبح یا بعد از 10 شب به وقت شرق آمریکا)، Heartbeatها رد می‌شوند. تیک زمان‌بندی‌شده بعدی داخل بازه به‌طور عادی اجرا خواهد شد.

### راه‌اندازی 24/7

اگر می‌خواهید Heartbeatها در تمام روز اجرا شوند، از یکی از این الگوها استفاده کنید:

- `activeHours` را کاملا حذف کنید (بدون محدودیت بازه زمانی؛ این رفتار پیش‌فرض است).
- یک بازه تمام‌روزه تنظیم کنید: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
زمان `start` و `end` یکسان تنظیم نکنید (برای مثال `08:00` تا `08:00`). این به‌عنوان بازه‌ای با پهنای صفر در نظر گرفته می‌شود، بنابراین Heartbeatها همیشه رد می‌شوند.
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

### یادداشت‌های فیلد

<ParamField path="every" type="string">
  فاصله Heartbeat (رشته مدت‌زمان؛ واحد پیش‌فرض = دقیقه).
</ParamField>
<ParamField path="model" type="string">
  بازنویسی اختیاری مدل برای اجرای Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  وقتی فعال باشد، در صورت موجود بودن، پیام جداگانه `Reasoning:` را نیز تحویل می‌دهد (همان شکل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  وقتی true باشد، اجراهای Heartbeat از زمینه راه‌اندازی سبک استفاده می‌کنند و فقط `HEARTBEAT.md` را از فایل‌های راه‌اندازی فضای کاری نگه می‌دارند.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  وقتی true باشد، هر Heartbeat در یک نشست تازه بدون تاریخچه مکالمه قبلی اجرا می‌شود. از همان الگوی جداسازی cron `sessionTarget: "isolated"` استفاده می‌کند. هزینه توکن هر Heartbeat را به‌طور چشمگیری کاهش می‌دهد. برای بیشترین صرفه‌جویی با `lightContext: true` ترکیب کنید. مسیریابی تحویل همچنان از زمینه نشست اصلی استفاده می‌کند.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  وقتی true باشد، اجرای Heartbeat در مسیرهای بسیار شلوغ به تعویق می‌افتد: کار زیرعامل یا فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را به تعویق می‌اندازند، حتی بدون این پرچم، بنابراین میزبان‌های مدل محلی پرامپت‌های cron و Heartbeat را هم‌زمان اجرا نمی‌کنند.
</ParamField>
<ParamField path="session" type="string">
  کلید نشست اختیاری برای اجراهای Heartbeat.

- `main` (پیش‌فرض): نشست اصلی عامل.
- کلید نشست صریح (از `openclaw sessions --json` یا [CLI نشست‌ها](/fa/cli/sessions) کپی کنید).
- قالب‌های کلید نشست: [نشست‌ها](/fa/concepts/session) و [گروه‌ها](/fa/channels/groups) را ببینید.

</ParamField>
<ParamField path="target" type="string">
- `last`: تحویل به آخرین کانال خارجی استفاده‌شده.
- کانال صریح: هر کانال یا شناسه Plugin پیکربندی‌شده، برای مثال `discord`، `matrix`، `telegram`، یا `whatsapp`.
- `none` (پیش‌فرض): Heartbeat را اجرا می‌کند اما به بیرون **تحویل نمی‌دهد**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  رفتار تحویل مستقیم/DM را کنترل می‌کند. `allow`: تحویل مستقیم/DM Heartbeat را مجاز می‌کند. `block`: تحویل مستقیم/DM را سرکوب می‌کند (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  بازنویسی اختیاری گیرنده (شناسه مخصوص کانال، مثلا E.164 برای WhatsApp یا شناسه گفت‌وگوی Telegram). برای موضوع‌ها/رشته‌های Telegram، از `<chatId>:topic:<messageThreadId>` استفاده کنید.

</ParamField>
<ParamField path="accountId" type="string">
  شناسه حساب اختیاری برای کانال‌های چندحسابی. وقتی `target: "last"` باشد، شناسه حساب در صورت پشتیبانی کانال آخر حل‌شده از حساب‌ها، روی آن اعمال می‌شود؛ در غیر این صورت نادیده گرفته می‌شود. اگر شناسه حساب با حساب پیکربندی‌شده برای کانال حل‌شده مطابقت نداشته باشد، تحویل رد می‌شود.

</ParamField>
<ParamField path="prompt" type="string">
  بدنه پرامپت پیش‌فرض را بازنویسی می‌کند (ادغام نمی‌شود).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  حداکثر تعداد نویسه‌های مجاز پس از `HEARTBEAT_OK` پیش از تحویل.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  وقتی true باشد، بارهای هشدار خطای ابزار را هنگام اجرای Heartbeat سرکوب می‌کند.

</ParamField>
<ParamField path="activeHours" type="object">
  اجرای Heartbeat را به یک بازه زمانی محدود می‌کند. شیئی با `start` (HH:MM، شامل؛ برای شروع روز از `00:00` استفاده کنید)، `end` (HH:MM غیرشامل؛ `24:00` برای پایان روز مجاز است)، و `timezone` اختیاری.

- حذف‌شده یا `"user"`: اگر `agents.defaults.userTimezone` تنظیم شده باشد از آن استفاده می‌کند، وگرنه به منطقه زمانی سیستم میزبان برمی‌گردد.
- `"local"`: همیشه از منطقه زمانی سیستم میزبان استفاده می‌کند.
- هر شناسه IANA (مثلاً `America/New_York`): مستقیماً استفاده می‌شود؛ اگر نامعتبر باشد، به رفتار `"user"` بالا برمی‌گردد.
- `start` و `end` برای یک پنجره فعال نباید برابر باشند؛ مقدارهای برابر به‌عنوان عرض صفر در نظر گرفته می‌شوند (همیشه خارج از پنجره).
- خارج از پنجره فعال، Heartbeatها تا تیک بعدی داخل پنجره نادیده گرفته می‌شوند.

</ParamField>

## رفتار تحویل

<AccordionGroup>
  <Accordion title="مسیریابی نشست و مقصد">
    - Heartbeatها به‌طور پیش‌فرض در نشست اصلی عامل اجرا می‌شوند (`agent:<id>:<mainKey>`)، یا وقتی `session.scope = "global"` باشد در `global`. برای بازنویسی به یک نشست کانال مشخص (Discord/WhatsApp/و غیره)، `session` را تنظیم کنید.
    - `session` فقط زمینه اجرا را تحت تأثیر قرار می‌دهد؛ تحویل توسط `target` و `to` کنترل می‌شود.
    - برای تحویل به یک کانال/گیرنده مشخص، `target` + `to` را تنظیم کنید. با `target: "last"`، تحویل از آخرین کانال خارجی برای آن نشست استفاده می‌کند.
    - تحویل‌های Heartbeat به‌طور پیش‌فرض مقصدهای مستقیم/DM را مجاز می‌دانند. برای سرکوب ارسال به مقصد مستقیم درحالی‌که نوبت Heartbeat همچنان اجرا می‌شود، `directPolicy: "block"` را تنظیم کنید.
    - اگر صف اصلی، خط نشست مقصد، خط cron، یا یک کار cron فعال مشغول باشد، Heartbeat نادیده گرفته می‌شود و بعداً دوباره تلاش می‌شود.
    - اگر `skipWhenBusy: true` باشد، خطوط زیرعامل و تودرتو نیز اجرای Heartbeat را به تعویق می‌اندازند.
    - اگر `target` به هیچ مقصد خارجی resolve نشود، اجرا همچنان انجام می‌شود اما هیچ پیام خروجی ارسال نمی‌شود.

  </Accordion>
  <Accordion title="نمایانی و رفتار نادیده‌گرفتن">
    - اگر `showOk`، `showAlerts`، و `useIndicator` همگی غیرفعال باشند، اجرا از ابتدا با `reason=alerts-disabled` نادیده گرفته می‌شود.
    - اگر فقط تحویل هشدار غیرفعال باشد، OpenClaw همچنان می‌تواند Heartbeat را اجرا کند، زمان‌مهرهای کارهای موعددار را به‌روزرسانی کند، زمان‌مهر بیکاری نشست را بازیابی کند، و بار هشدار بیرونی را سرکوب کند.
    - اگر مقصد Heartbeat resolveشده از typing پشتیبانی کند، OpenClaw هنگام فعال بودن اجرای Heartbeat وضعیت typing را نشان می‌دهد. این از همان مقصدی استفاده می‌کند که Heartbeat خروجی چت را به آن می‌فرستاد، و با `typingMode: "never"` غیرفعال می‌شود.

  </Accordion>
  <Accordion title="چرخه عمر نشست و حسابرسی">
    - پاسخ‌های فقط Heartbeat نشست را زنده نگه نمی‌دارند. فراداده Heartbeat ممکن است ردیف نشست را به‌روزرسانی کند، اما انقضای بیکاری از `lastInteractionAt` آخرین پیام واقعی کاربر/کانال استفاده می‌کند، و انقضای روزانه از `sessionStartedAt`.
    - تاریخچه Control UI و WebChat اعلان‌های Heartbeat و تأییدهای فقط OK را پنهان می‌کند. متن نشست زیربنایی همچنان می‌تواند آن نوبت‌ها را برای حسابرسی/بازپخش داشته باشد.
    - [کارهای پس‌زمینه](/fa/automation/tasks) جداشده می‌توانند یک رویداد سیستمی را صف کنند و وقتی نشست اصلی باید چیزی را سریع متوجه شود Heartbeat را بیدار کنند. آن بیدارکردن اجرای Heartbeat را به یک کار پس‌زمینه تبدیل نمی‌کند.

  </Accordion>
</AccordionGroup>

## کنترل‌های نمایانی

به‌طور پیش‌فرض، تأییدهای `HEARTBEAT_OK` سرکوب می‌شوند، درحالی‌که محتوای هشدار تحویل داده می‌شود. می‌توانید این را برای هر کانال یا هر حساب تنظیم کنید:

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

### هر پرچم چه کاری انجام می‌دهد

- `showOk`: وقتی مدل یک پاسخ فقط OK برمی‌گرداند، یک تأیید `HEARTBEAT_OK` ارسال می‌کند.
- `showAlerts`: وقتی مدل یک پاسخ غیر OK برمی‌گرداند، محتوای هشدار را ارسال می‌کند.
- `useIndicator`: رویدادهای نشانگر را برای سطوح وضعیت UI منتشر می‌کند.

اگر **هر سه** false باشند، OpenClaw اجرای Heartbeat را کاملاً نادیده می‌گیرد (بدون فراخوانی مدل).

### نمونه‌های برای هر کانال در برابر برای هر حساب

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
| رفتار پیش‌فرض (OKهای بی‌صدا، هشدارها روشن) | _(به پیکربندی نیاز نیست)_                                                                     |
| کاملاً بی‌صدا (بدون پیام، بدون نشانگر) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| فقط نشانگر (بدون پیام)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKها فقط در یک کانال                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختیاری)

اگر یک فایل `HEARTBEAT.md` در فضای کاری وجود داشته باشد، اعلان پیش‌فرض به عامل می‌گوید آن را بخواند. آن را مانند «چک‌لیست Heartbeat» خودتان در نظر بگیرید: کوچک، پایدار، و ایمن برای گنجاندن هر ۳۰ دقیقه.

در اجراهای عادی، `HEARTBEAT.md` فقط وقتی تزریق می‌شود که راهنمای Heartbeat برای عامل پیش‌فرض فعال باشد. غیرفعال‌کردن cadence Heartbeat با `0m` یا تنظیم `includeSystemPromptSection: false` آن را از زمینه bootstrap عادی حذف می‌کند.

اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خط‌های خالی و سربرگ‌های markdown مانند `# Heading`)، OpenClaw برای صرفه‌جویی در فراخوانی‌های API اجرای Heartbeat را نادیده می‌گیرد. این نادیده‌گرفتن به‌صورت `reason=empty-heartbeat-file` گزارش می‌شود. اگر فایل وجود نداشته باشد، Heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کند.

آن را بسیار کوچک نگه دارید (چک‌لیست یا یادآوری‌های کوتاه) تا از تورم اعلان جلوگیری شود.

نمونه `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### بلوک‌های `tasks:`

`HEARTBEAT.md` همچنین از یک بلوک ساختاری کوچک `tasks:` برای بررسی‌های مبتنی بر بازه درون خود Heartbeat پشتیبانی می‌کند.

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
    - فقط کارهای **موعددار** در اعلان Heartbeat برای آن تیک گنجانده می‌شوند.
    - اگر هیچ کاری موعددار نباشد، Heartbeat کاملاً نادیده گرفته می‌شود (`reason=no-tasks-due`) تا از فراخوانی بی‌فایده مدل جلوگیری شود.
    - محتوای غیرکاری در `HEARTBEAT.md` حفظ می‌شود و به‌عنوان زمینه اضافی پس از فهرست کارهای موعددار افزوده می‌شود.
    - زمان‌مهرهای آخرین اجرای کار در وضعیت نشست (`heartbeatTaskState`) ذخیره می‌شوند، بنابراین بازه‌ها از راه‌اندازی‌های دوباره عادی جان سالم به در می‌برند.
    - زمان‌مهرهای کار فقط پس از کامل‌شدن مسیر پاسخ عادی یک اجرای Heartbeat پیش برده می‌شوند. اجراهای نادیده‌گرفته‌شده `empty-heartbeat-file` / `no-tasks-due` کارها را کامل‌شده علامت نمی‌زنند.

  </Accordion>
</AccordionGroup>

حالت کار زمانی مفید است که می‌خواهید یک فایل Heartbeat چندین بررسی دوره‌ای را نگه دارد بدون اینکه در هر تیک هزینه همه آن‌ها را بپردازید.

### آیا عامل می‌تواند HEARTBEAT.md را به‌روزرسانی کند؟

بله، اگر از آن بخواهید.

`HEARTBEAT.md` فقط یک فایل عادی در فضای کاری عامل است، بنابراین می‌توانید در یک چت عادی به عامل چیزی شبیه این بگویید:

- «`HEARTBEAT.md` را به‌روزرسانی کن تا یک بررسی روزانه تقویم اضافه شود.»
- «`HEARTBEAT.md` را بازنویسی کن تا کوتاه‌تر و متمرکز بر پیگیری‌های inbox باشد.»

اگر می‌خواهید این کار به‌صورت پیش‌دستانه انجام شود، می‌توانید یک خط صریح هم در اعلان Heartbeat خود بگنجانید، مانند: «اگر چک‌لیست کهنه شد، HEARTBEAT.md را با نسخه بهتری به‌روزرسانی کن.»

<Warning>
رازها (کلیدهای API، شماره تلفن‌ها، توکن‌های خصوصی) را در `HEARTBEAT.md` نگذارید؛ این فایل بخشی از زمینه اعلان می‌شود.
</Warning>

## بیدارسازی دستی (درخواست‌محور)

می‌توانید یک رویداد سیستمی را صف کنید و با این دستور یک Heartbeat فوری را تحریک کنید:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

اگر چندین عامل `heartbeat` پیکربندی‌شده داشته باشند، بیدارسازی دستی Heartbeat هر یک از آن عامل‌ها را بلافاصله اجرا می‌کند.

برای انتظار تا تیک زمان‌بندی‌شده بعدی از `--mode next-heartbeat` استفاده کنید.

## تحویل reasoning (اختیاری)

به‌طور پیش‌فرض، Heartbeatها فقط بار نهایی «پاسخ» را تحویل می‌دهند.

اگر شفافیت می‌خواهید، فعال کنید:

- `agents.defaults.heartbeat.includeReasoning: true`

وقتی فعال باشد، Heartbeatها یک پیام جداگانه با پیشوند `Reasoning:` نیز تحویل می‌دهند (همان شکل `/reasoning on`). این می‌تواند وقتی عامل چندین نشست/codex را مدیریت می‌کند و می‌خواهید ببینید چرا تصمیم گرفته به شما ping بدهد مفید باشد، اما همچنین می‌تواند جزئیات داخلی بیشتری از آنچه می‌خواهید افشا کند. در چت‌های گروهی بهتر است آن را خاموش نگه دارید.

## آگاهی از هزینه

Heartbeatها نوبت‌های کامل عامل را اجرا می‌کنند. بازه‌های کوتاه‌تر توکن‌های بیشتری مصرف می‌کنند. برای کاهش هزینه:

- از `isolatedSession: true` استفاده کنید تا از ارسال تاریخچه کامل گفتگو جلوگیری شود (از حدود ۱۰۰هزار توکن به حدود ۲ تا ۵هزار در هر اجرا).
- از `lightContext: true` استفاده کنید تا فایل‌های bootstrap را فقط به `HEARTBEAT.md` محدود کنید.
- یک `model` ارزان‌تر تنظیم کنید (مثلاً `ollama/llama3.2:1b`).
- `HEARTBEAT.md` را کوچک نگه دارید.
- اگر فقط به‌روزرسانی‌های وضعیت داخلی می‌خواهید، از `target: "none"` استفاده کنید.

## سرریز زمینه پس از Heartbeat

اگر یک Heartbeat قبلاً یک نشست موجود را روی مدل محلی کوچک‌تری گذاشته باشد، برای مثال یک مدل Ollama با پنجره ۳۲k، و نوبت بعدی نشست اصلی سرریز زمینه را گزارش کند، مدل runtime نشست را دوباره به مدل اصلی پیکربندی‌شده بازنشانی کنید. پیام بازنشانی OpenClaw وقتی آخرین مدل runtime با `heartbeat.model` پیکربندی‌شده مطابقت داشته باشد، این را اعلام می‌کند.

Heartbeatهای فعلی پس از کامل‌شدن اجرا مدل runtime موجود نشست مشترک را حفظ می‌کنند. همچنان می‌توانید از `isolatedSession: true` برای اجرای Heartbeatها در یک نشست تازه استفاده کنید، آن را با `lightContext: true` برای کوچک‌ترین اعلان ترکیب کنید، یا یک مدل Heartbeat با پنجره زمینه‌ای انتخاب کنید که برای نشست مشترک به‌اندازه کافی بزرگ باشد.

## مرتبط

- [اتوماسیون و کارها](/fa/automation) — همه سازوکارهای اتوماسیون در یک نگاه
- [کارهای پس‌زمینه](/fa/automation/tasks) — کار جداشده چگونه ردیابی می‌شود
- [منطقه زمانی](/fa/concepts/timezone) — منطقه زمانی چگونه بر زمان‌بندی Heartbeat اثر می‌گذارد
- [عیب‌یابی](/fa/automation/cron-jobs#troubleshooting) — اشکال‌زدایی مشکلات اتوماسیون

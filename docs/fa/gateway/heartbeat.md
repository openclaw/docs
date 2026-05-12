---
read_when:
    - تنظیم تناوب Heartbeat یا پیام‌رسانی
    - تصمیم‌گیری بین Heartbeat و Cron برای وظایف زمان‌بندی‌شده
sidebarTitle: Heartbeat
summary: پیام‌های پایش دوره‌ای Heartbeat و قواعد اعلان
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T00:59:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: de1fee0df75d9e8f356dc02d089f61ae5048c302169acc363eee2149e09aacb3
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat یا cron؟** برای راهنمایی دربارهٔ زمان استفاده از هرکدام، [Automation](/fa/automation) را ببینید.
</Note>

Heartbeat **نوبت‌های دوره‌ای عامل** را در جلسهٔ اصلی اجرا می‌کند تا مدل بتواند هر چیزی را که نیاز به توجه دارد، بدون ارسال پیام‌های مزاحم به شما مطرح کند.

Heartbeat یک نوبت زمان‌بندی‌شده در جلسهٔ اصلی است — [background task](/fa/automation/tasks) record ایجاد نمی‌کند. Task records برای کارهای جداشده هستند (اجرای ACP، subagents، کارهای cron ایزوله).

عیب‌یابی: [Scheduled Tasks](/fa/automation/cron-jobs#troubleshooting)

## شروع سریع (مبتدی)

<Steps>
  <Step title="Pick a cadence">
    Heartbeatها را فعال بگذارید (پیش‌فرض `30m` است، یا برای احراز هویت Anthropic OAuth/token، شامل استفادهٔ مجدد از Claude CLI، `1h`) یا آهنگ اجرای دلخواه خودتان را تنظیم کنید.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    یک چک‌لیست کوچک `HEARTBEAT.md` یا بلوک `tasks:` در workspace عامل بسازید.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` پیش‌فرض است؛ برای مسیریابی به آخرین مخاطب، `target: "last"` را تنظیم کنید.
  </Step>
  <Step title="Optional tuning">
    - تحویل reasoning مربوط به Heartbeat را برای شفافیت فعال کنید.
    - اگر اجرای Heartbeat فقط به `HEARTBEAT.md` نیاز دارد، از زمینهٔ bootstrap سبک استفاده کنید.
    - برای جلوگیری از ارسال کل تاریخچهٔ مکالمه در هر Heartbeat، sessionهای ایزوله را فعال کنید.
    - Heartbeatها را به ساعت‌های فعال محدود کنید (زمان محلی).

  </Step>
</Steps>

نمونهٔ پیکربندی:

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

- فاصله: `30m` (یا وقتی حالت احراز هویت شناسایی‌شده Anthropic OAuth/token است، شامل استفادهٔ مجدد از Claude CLI، `1h`). `agents.defaults.heartbeat.every` یا `agents.list[].heartbeat.every` را تنظیم کنید؛ برای غیرفعال‌سازی از `0m` استفاده کنید.
- بدنهٔ prompt (قابل پیکربندی با `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- prompt مربوط به Heartbeat **عیناً** به‌عنوان پیام کاربر ارسال می‌شود. system prompt فقط وقتی Heartbeatها برای عامل پیش‌فرض فعال باشند یک بخش "Heartbeat" دارد، و اجرا به‌صورت داخلی علامت‌گذاری می‌شود.
- وقتی Heartbeatها با `0m` غیرفعال شوند، اجرای عادی همچنین `HEARTBEAT.md` را از زمینهٔ bootstrap حذف می‌کند تا مدل دستورهای مخصوص Heartbeat را نبیند.
- ساعت‌های فعال (`heartbeat.activeHours`) در timezone پیکربندی‌شده بررسی می‌شوند. بیرون از این بازه، Heartbeatها تا tick بعدی داخل بازه رد می‌شوند.
- وقتی کار cron فعال یا در صف باشد، Heartbeatها خودکار به تعویق می‌افتند. برای به‌تعویق‌انداختن در مسیرهای بسیار مشغول (کار subagent یا فرمان تودرتو) نیز `heartbeat.skipWhenBusy: true` را تنظیم کنید؛ این برای Ollama محلی و hostهای تک-runtime محدود دیگر مفید است.

## کاربرد prompt مربوط به Heartbeat

prompt پیش‌فرض عمداً گسترده است:

- **کارهای پس‌زمینه**: "Consider outstanding tasks" عامل را تشویق می‌کند پیگیری‌ها (inbox، calendar، reminders، کارهای در صف) را مرور کند و هر مورد فوری را مطرح کند.
- **سرکشی به انسان**: "Checkup sometimes on your human during day time" پیام سبک و گهگاهِ "چیزی لازم داری؟" را تشویق می‌کند، اما با استفاده از timezone محلی پیکربندی‌شدهٔ شما، از پیام‌های مزاحم شبانه جلوگیری می‌کند (به [Timezone](/fa/concepts/timezone) مراجعه کنید).

Heartbeat می‌تواند به [background tasks](/fa/automation/tasks) تکمیل‌شده واکنش نشان دهد، اما خود اجرای Heartbeat، task record ایجاد نمی‌کند.

اگر می‌خواهید Heartbeat کاری بسیار مشخص انجام دهد (مثلاً "check Gmail PubSub stats" یا "verify gateway health")، `agents.defaults.heartbeat.prompt` (یا `agents.list[].heartbeat.prompt`) را به یک بدنهٔ سفارشی تنظیم کنید (عیناً ارسال می‌شود).

## قرارداد پاسخ

- اگر چیزی نیاز به توجه ندارد، با **`HEARTBEAT_OK`** پاسخ دهید.
- اجرای Heartbeat دارای ابزار می‌تواند به‌جای آن `heartbeat_respond` را با `notify: false` برای نداشتن به‌روزرسانی قابل‌مشاهده، یا `notify: true` همراه با `notificationText` برای هشدار فراخوانی کند. وقتی موجود باشد، پاسخ ساختاریافتهٔ ابزار بر fallback متنی اولویت دارد.
- هنگام اجرای Heartbeat، OpenClaw وقتی `HEARTBEAT_OK` در **ابتدا یا انتهای** پاسخ ظاهر شود، آن را ack در نظر می‌گیرد. token حذف می‌شود و اگر محتوای باقی‌مانده **≤ `ackMaxChars`** باشد، پاسخ کنار گذاشته می‌شود (پیش‌فرض: 300).
- اگر `HEARTBEAT_OK` در **میانهٔ** پاسخ ظاهر شود، رفتار ویژه‌ای با آن نمی‌شود.
- برای هشدارها، **`HEARTBEAT_OK` را وارد نکنید**؛ فقط متن هشدار را برگردانید.

بیرون از Heartbeatها، `HEARTBEAT_OK` سرگردان در ابتدا/انتهای پیام حذف و log می‌شود؛ پیامی که فقط `HEARTBEAT_OK` باشد کنار گذاشته می‌شود.

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
- `agents.list[].heartbeat` روی آن merge می‌شود؛ اگر هر عاملی بلوک `heartbeat` داشته باشد، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند.
- `channels.defaults.heartbeat` پیش‌فرض‌های visibility را برای همهٔ channelها تنظیم می‌کند.
- `channels.<channel>.heartbeat` پیش‌فرض‌های channel را override می‌کند.
- `channels.<channel>.accounts.<id>.heartbeat` (channelهای چندحسابی) تنظیمات هر channel را override می‌کند.

### Heartbeatهای هر عامل

اگر هر ورودی `agents.list[]` شامل بلوک `heartbeat` باشد، **فقط همان عامل‌ها** Heartbeat اجرا می‌کنند. بلوک هر عامل روی `agents.defaults.heartbeat` merge می‌شود (بنابراین می‌توانید پیش‌فرض‌های مشترک را یک‌بار تنظیم کنید و برای هر عامل override کنید).

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

Heartbeatها را به ساعت کاری در یک timezone مشخص محدود کنید:

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

بیرون از این بازه (قبل از 9 صبح یا بعد از 10 شب به وقت شرق)، Heartbeatها رد می‌شوند. tick زمان‌بندی‌شدهٔ بعدی داخل بازه به‌صورت عادی اجرا خواهد شد.

### راه‌اندازی 24/7

اگر می‌خواهید Heartbeatها تمام روز اجرا شوند، از یکی از این الگوها استفاده کنید:

- `activeHours` را کاملاً حذف کنید (بدون محدودیت بازهٔ زمانی؛ این رفتار پیش‌فرض است).
- یک بازهٔ تمام‌روزه تنظیم کنید: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
زمان `start` و `end` یکسان تنظیم نکنید (برای مثال `08:00` تا `08:00`). این به‌عنوان بازه‌ای با عرض صفر در نظر گرفته می‌شود، بنابراین Heartbeatها همیشه رد می‌شوند.
</Warning>

### نمونهٔ چندحسابی

برای هدف‌گرفتن یک حساب مشخص در channelهای چندحسابی مانند Telegram از `accountId` استفاده کنید:

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
  فاصلهٔ Heartbeat (رشتهٔ duration؛ واحد پیش‌فرض = دقیقه).
</ParamField>
<ParamField path="model" type="string">
  override اختیاری مدل برای اجرای Heartbeatها (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  وقتی فعال باشد، پیام جداگانهٔ `Reasoning:` را نیز در صورت وجود تحویل می‌دهد (همان شکل `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  وقتی true باشد، اجرای Heartbeat از زمینهٔ bootstrap سبک استفاده می‌کند و فقط `HEARTBEAT.md` را از فایل‌های bootstrap workspace نگه می‌دارد.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  وقتی true باشد، هر Heartbeat در یک session تازه و بدون تاریخچهٔ مکالمهٔ قبلی اجرا می‌شود. از همان الگوی ایزوله‌سازی cron `sessionTarget: "isolated"` استفاده می‌کند. هزینهٔ token هر Heartbeat را به‌شدت کاهش می‌دهد. برای بیشترین صرفه‌جویی با `lightContext: true` ترکیب کنید. مسیریابی تحویل همچنان از زمینهٔ session اصلی استفاده می‌کند.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  وقتی true باشد، اجرای Heartbeat در مسیرهای بسیار مشغول به تعویق می‌افتد: کار subagent یا فرمان تودرتو. مسیرهای Cron همیشه Heartbeatها را حتی بدون این flag به تعویق می‌اندازند، بنابراین hostهای مدل محلی promptهای cron و Heartbeat را هم‌زمان اجرا نمی‌کنند.
</ParamField>
<ParamField path="session" type="string">
  کلید session اختیاری برای اجرای Heartbeatها.

- `main` (پیش‌فرض): session اصلی عامل.
- کلید session صریح (از `openclaw sessions --json` یا [sessions CLI](/fa/cli/sessions) کپی کنید).
- قالب‌های کلید session: [Sessions](/fa/concepts/session) و [Groups](/fa/channels/groups) را ببینید.

</ParamField>
<ParamField path="target" type="string">
- `last`: تحویل به آخرین channel خارجی استفاده‌شده.
- channel صریح: هر channel یا Plugin id پیکربندی‌شده، برای مثال `discord`، `matrix`، `telegram`، یا `whatsapp`.
- `none` (پیش‌فرض): Heartbeat را اجرا می‌کند اما به بیرون **تحویل نمی‌دهد**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  رفتار تحویل مستقیم/DM را کنترل می‌کند. `allow`: تحویل مستقیم/DM Heartbeat را مجاز می‌کند. `block`: تحویل مستقیم/DM را متوقف می‌کند (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  override اختیاری گیرنده (شناسهٔ مخصوص channel، مثلاً E.164 برای WhatsApp یا chat id در Telegram). برای topic/threadهای Telegram، از `<chatId>:topic:<messageThreadId>` استفاده کنید.

</ParamField>
<ParamField path="accountId" type="string">
  شناسهٔ حساب اختیاری برای channelهای چندحسابی. وقتی `target: "last"` باشد، شناسهٔ حساب در صورت پشتیبانی channel آخرِ resolve‌شده از حساب‌ها، روی آن اعمال می‌شود؛ در غیر این صورت نادیده گرفته می‌شود. اگر شناسهٔ حساب با حساب پیکربندی‌شده برای channel resolve‌شده مطابقت نداشته باشد، تحویل رد می‌شود.

</ParamField>
<ParamField path="prompt" type="string">
  بدنهٔ prompt پیش‌فرض را override می‌کند (merge نمی‌شود).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  حداکثر نویسه‌های مجاز پس از `HEARTBEAT_OK` پیش از تحویل.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  وقتی true باشد، payloadهای هشدار خطای ابزار را هنگام اجرای heartbeat سرکوب می‌کند.

</ParamField>
<ParamField path="activeHours" type="object">
  اجرای Heartbeat را به یک بازه زمانی محدود می‌کند. شیئی با `start` (HH:MM، شامل؛ برای ابتدای روز از `00:00` استفاده کنید)، `end` (HH:MM غیرشامل؛ `24:00` برای پایان روز مجاز است)، و `timezone` اختیاری.

- حذف‌شده یا `"user"`: اگر `agents.defaults.userTimezone` تنظیم شده باشد از آن استفاده می‌کند، در غیر این صورت به منطقه زمانی سیستم میزبان برمی‌گردد.
- `"local"`: همیشه از منطقه زمانی سیستم میزبان استفاده می‌کند.
- هر شناسه IANA (مثلاً `America/New_York`): مستقیماً استفاده می‌شود؛ اگر نامعتبر باشد، به رفتار `"user"` در بالا برمی‌گردد.
- `start` و `end` برای یک بازه فعال نباید برابر باشند؛ مقادیر برابر به‌عنوان پهنای صفر در نظر گرفته می‌شوند (همیشه بیرون از بازه).
- بیرون از بازه فعال، heartbeatها تا tick بعدی داخل بازه نادیده گرفته می‌شوند.

</ParamField>

## رفتار تحویل

<AccordionGroup>
  <Accordion title="Session and target routing">
    - heartbeatها به‌طور پیش‌فرض در نشست اصلی agent اجرا می‌شوند (`agent:<id>:<mainKey>`)، یا وقتی `session.scope = "global"` باشد در `global`. برای override کردن به یک نشست کانال مشخص (Discord/WhatsApp/غیره)، `session` را تنظیم کنید.
    - `session` فقط بر زمینه اجرا اثر می‌گذارد؛ تحویل با `target` و `to` کنترل می‌شود.
    - برای تحویل به یک کانال/گیرنده مشخص، `target` + `to` را تنظیم کنید. با `target: "last"`، تحویل از آخرین کانال خارجی برای آن نشست استفاده می‌کند.
    - تحویل‌های Heartbeat به‌طور پیش‌فرض targetهای مستقیم/DM را مجاز می‌دانند. برای سرکوب ارسال به target مستقیم در حالی که نوبت heartbeat همچنان اجرا می‌شود، `directPolicy: "block"` را تنظیم کنید.
    - اگر صف اصلی، lane نشست target، lane کران، یا یک کار کران فعال مشغول باشد، heartbeat نادیده گرفته می‌شود و بعداً دوباره تلاش می‌شود.
    - اگر `skipWhenBusy: true` باشد، subagent و laneهای تودرتو نیز اجرای heartbeat را به تعویق می‌اندازند.
    - اگر `target` به هیچ مقصد خارجی resolve نشود، اجرا همچنان انجام می‌شود اما هیچ پیام خروجی ارسال نمی‌شود.

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - اگر `showOk`، `showAlerts`، و `useIndicator` همگی غیرفعال باشند، اجرا از ابتدا با `reason=alerts-disabled` نادیده گرفته می‌شود.
    - اگر فقط تحویل هشدار غیرفعال باشد، OpenClaw همچنان می‌تواند heartbeat را اجرا کند، زمان‌برچسب‌های taskهای سررسیدشده را به‌روزرسانی کند، زمان‌برچسب بیکاری نشست را بازیابی کند، و payload هشدار بیرونی را سرکوب کند.
    - اگر target حل‌شده heartbeat از typing پشتیبانی کند، OpenClaw هنگام فعال بودن اجرای heartbeat، typing را نشان می‌دهد. این همان targetی را به کار می‌برد که heartbeat خروجی چت را به آن ارسال می‌کرد، و با `typingMode: "never"` غیرفعال می‌شود.

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - پاسخ‌های فقط-heartbeat نشست را زنده نگه **نمی‌دارند**. فراداده Heartbeat ممکن است ردیف نشست را به‌روزرسانی کند، اما انقضای بیکاری از `lastInteractionAt` مربوط به آخرین پیام واقعی کاربر/کانال استفاده می‌کند، و انقضای روزانه از `sessionStartedAt`.
    - UI کنترل و تاریخچه WebChat اعلان‌های heartbeat و تأییدیه‌های فقط OK را پنهان می‌کنند. transcript نشست زیرین همچنان می‌تواند آن نوبت‌ها را برای audit/replay داشته باشد.
    - [taskهای پس‌زمینه](/fa/automation/tasks) جداشده می‌توانند یک رویداد سیستم را در صف بگذارند و وقتی نشست اصلی باید سریع متوجه چیزی شود، heartbeat را بیدار کنند. آن بیدارسازی باعث نمی‌شود اجرای heartbeat به یک task پس‌زمینه تبدیل شود.

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

اولویت: برای هر حساب → برای هر کانال → پیش‌فرض‌های کانال → پیش‌فرض‌های داخلی.

### هر flag چه می‌کند

- `showOk`: وقتی مدل یک پاسخ فقط OK برمی‌گرداند، یک تأییدیه `HEARTBEAT_OK` ارسال می‌کند.
- `showAlerts`: وقتی مدل یک پاسخ غیر-OK برمی‌گرداند، محتوای هشدار را ارسال می‌کند.
- `useIndicator`: رویدادهای indicator را برای سطح‌های وضعیت UI منتشر می‌کند.

اگر **هر سه** false باشند، OpenClaw اجرای heartbeat را کاملاً نادیده می‌گیرد (بدون فراخوانی مدل).

### مثال‌های هر کانال در برابر هر حساب

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
| رفتار پیش‌فرض (OKهای بی‌صدا، هشدارها روشن) | _(no config needed)_                                                                     |
| کاملاً بی‌صدا (بدون پیام، بدون indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| فقط indicator (بدون پیام)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKها فقط در یک کانال                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (اختیاری)

اگر یک فایل `HEARTBEAT.md` در workspace وجود داشته باشد، اعلان پیش‌فرض به agent می‌گوید آن را بخواند. آن را مثل «چک‌لیست heartbeat» خود در نظر بگیرید: کوچک، پایدار، و امن برای درج هر ۳۰ دقیقه.

در اجراهای عادی، `HEARTBEAT.md` فقط وقتی تزریق می‌شود که راهنمای heartbeat برای agent پیش‌فرض فعال باشد. غیرفعال کردن cadence مربوط به heartbeat با `0m` یا تنظیم `includeSystemPromptSection: false` آن را از زمینه bootstrap عادی حذف می‌کند.

اگر `HEARTBEAT.md` وجود داشته باشد اما عملاً خالی باشد (فقط خطوط خالی و سربرگ‌های markdown مثل `# Heading`)، OpenClaw برای صرفه‌جویی در فراخوانی‌های API اجرای heartbeat را نادیده می‌گیرد. آن skip به‌صورت `reason=empty-heartbeat-file` گزارش می‌شود. اگر فایل وجود نداشته باشد، heartbeat همچنان اجرا می‌شود و مدل تصمیم می‌گیرد چه کار کند.

آن را بسیار کوچک نگه دارید (چک‌لیست کوتاه یا یادآورها) تا از بزرگ شدن prompt جلوگیری شود.

مثال `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### بلوک‌های `tasks:`

`HEARTBEAT.md` همچنین از یک بلوک ساختاری کوچک `tasks:` برای بررسی‌های مبتنی بر interval داخل خود heartbeat پشتیبانی می‌کند.

مثال:

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
    - OpenClaw بلوک `tasks:` را parse می‌کند و هر task را در برابر `interval` خودش بررسی می‌کند.
    - فقط taskهای **سررسیدشده** در prompt مربوط به heartbeat برای آن tick گنجانده می‌شوند.
    - اگر هیچ taskی سررسید نشده باشد، heartbeat کاملاً نادیده گرفته می‌شود (`reason=no-tasks-due`) تا از یک فراخوانی مدل بیهوده جلوگیری شود.
    - محتوای غیر-task در `HEARTBEAT.md` حفظ می‌شود و بعد از فهرست taskهای سررسیدشده به‌عنوان زمینه اضافی اضافه می‌شود.
    - زمان‌برچسب‌های آخرین اجرای task در وضعیت نشست (`heartbeatTaskState`) ذخیره می‌شوند، بنابراین intervalها پس از restartهای عادی باقی می‌مانند.
    - زمان‌برچسب‌های task فقط پس از کامل شدن مسیر پاسخ عادی یک اجرای heartbeat جلو برده می‌شوند. اجراهای نادیده‌گرفته‌شده `empty-heartbeat-file` / `no-tasks-due`، taskها را به‌عنوان کامل‌شده علامت نمی‌زنند.

  </Accordion>
</AccordionGroup>

حالت task زمانی مفید است که می‌خواهید یک فایل heartbeat چندین بررسی دوره‌ای را نگه دارد، بدون اینکه در هر tick هزینه همه آن‌ها را بپردازید.

### آیا agent می‌تواند HEARTBEAT.md را به‌روزرسانی کند؟

بله — اگر از آن بخواهید.

`HEARTBEAT.md` فقط یک فایل عادی در workspace مربوط به agent است، بنابراین می‌توانید به agent (در یک چت عادی) چیزی شبیه این بگویید:

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

اگر می‌خواهید این کار به‌صورت proactive انجام شود، می‌توانید یک خط صریح نیز در prompt مربوط به heartbeat خود بگنجانید، مثل: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
secrets (کلیدهای API، شماره تلفن‌ها، tokenهای خصوصی) را داخل `HEARTBEAT.md` نگذارید — چون بخشی از زمینه prompt می‌شود.
</Warning>

## بیدارسازی دستی (درخواستی)

می‌توانید یک رویداد سیستم را در صف بگذارید و یک heartbeat فوری را با این دستور فعال کنید:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

اگر چند agent پیکربندی `heartbeat` داشته باشند، یک بیدارسازی دستی هر یک از آن heartbeatهای agent را فوراً اجرا می‌کند.

برای انتظار تا tick زمان‌بندی‌شده بعدی از `--mode next-heartbeat` استفاده کنید.

## تحویل استدلال (اختیاری)

به‌طور پیش‌فرض، heartbeatها فقط payload نهایی «answer» را تحویل می‌دهند.

اگر شفافیت می‌خواهید، این را فعال کنید:

- `agents.defaults.heartbeat.includeReasoning: true`

وقتی فعال باشد، heartbeatها یک پیام جداگانه با پیشوند `Reasoning:` نیز تحویل می‌دهند (همان شکل `/reasoning on`). این می‌تواند وقتی agent چند نشست/codex را مدیریت می‌کند و می‌خواهید ببینید چرا تصمیم گرفته به شما ping کند مفید باشد — اما همچنین می‌تواند جزئیات داخلی بیشتری از آنچه می‌خواهید افشا کند. بهتر است در چت‌های گروهی خاموش نگه داشته شود.

## آگاهی از هزینه

heartbeatها نوبت‌های کامل agent را اجرا می‌کنند. intervalهای کوتاه‌تر token بیشتری مصرف می‌کنند. برای کاهش هزینه:

- از `isolatedSession: true` استفاده کنید تا از ارسال تاریخچه کامل مکالمه جلوگیری شود (حدود ۱۰۰K token تا حدود ۲-۵K در هر اجرا).
- از `lightContext: true` استفاده کنید تا فایل‌های bootstrap به فقط `HEARTBEAT.md` محدود شوند.
- یک `model` ارزان‌تر تنظیم کنید (مثلاً `ollama/llama3.2:1b`).
- `HEARTBEAT.md` را کوچک نگه دارید.
- اگر فقط به‌روزرسانی‌های وضعیت داخلی می‌خواهید، از `target: "none"` استفاده کنید.

## سرریز زمینه پس از heartbeat

اگر یک heartbeat قبلاً یک نشست موجود را روی یک مدل محلی کوچک‌تر باقی گذاشته باشد، مثلاً یک مدل Ollama با پنجره 32k، و نوبت بعدی نشست اصلی context overflow گزارش کند، مدل runtime نشست را به مدل اصلی پیکربندی‌شده برگردانید. پیام reset در OpenClaw وقتی آخرین مدل runtime با `heartbeat.model` پیکربندی‌شده مطابقت داشته باشد، این را صریحاً اعلام می‌کند.

heartbeatهای فعلی پس از کامل شدن اجرا، مدل runtime موجود نشست مشترک را حفظ می‌کنند. همچنان می‌توانید از `isolatedSession: true` برای اجرای heartbeatها در یک نشست تازه استفاده کنید، آن را با `lightContext: true` برای کوچک‌ترین prompt ترکیب کنید، یا یک مدل heartbeat با پنجره زمینه‌ای انتخاب کنید که به‌اندازه کافی برای نشست مشترک بزرگ باشد.

## مرتبط

- [اتوماسیون](/fa/automation) — همه سازوکارهای اتوماسیون در یک نگاه
- [taskهای پس‌زمینه](/fa/automation/tasks) — کار جداشده چگونه ردیابی می‌شود
- [منطقه زمانی](/fa/concepts/timezone) — منطقه زمانی چگونه بر زمان‌بندی heartbeat اثر می‌گذارد
- [عیب‌یابی](/fa/automation/cron-jobs#troubleshooting) — اشکال‌زدایی مشکلات اتوماسیون

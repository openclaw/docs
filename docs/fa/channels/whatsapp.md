---
read_when:
    - کار روی رفتار کانال WhatsApp/وب یا مسیریابی صندوق ورودی
summary: پشتیبانی از کانال WhatsApp، کنترل‌های دسترسی، رفتار تحویل و عملیات
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:41:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

وضعیت: آمادهٔ تولید از طریق WhatsApp Web (Baileys). Gateway مالک نشست(های) پیوندشده است.

## نصب (در صورت نیاز)

- راه‌اندازی اولیه (`openclaw onboard`) و `openclaw channels add --channel whatsapp`
  نخستین باری که WhatsApp Plugin را انتخاب می‌کنید، درخواست نصب آن را نشان می‌دهند.
- `openclaw channels login --channel whatsapp` نیز وقتی
  Plugin هنوز موجود نباشد، جریان نصب را پیشنهاد می‌کند.
- کانال توسعه + checkout گیت: به‌طور پیش‌فرض از مسیر Plugin محلی استفاده می‌کند.
- پایدار/بتا: وقتی بستهٔ فعلی منتشر شده باشد، از بستهٔ npm با نام `@openclaw/whatsapp`
  استفاده می‌کند.

نصب دستی همچنان در دسترس است:

```bash
openclaw plugins install @openclaw/whatsapp
```

اگر npm بستهٔ متعلق به OpenClaw را منسوخ یا ناموجود گزارش کرد، تا وقتی قطار بستهٔ npm
به‌روز شود، از یک ساخت بسته‌بندی‌شدهٔ فعلی OpenClaw یا یک checkout محلی استفاده کنید.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض DM برای فرستنده‌های ناشناخته، جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های میان‌کانالی و راهنماهای تعمیر.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و نمونه‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="پیکربندی سیاست دسترسی WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="پیوند دادن WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    برای یک حساب مشخص:

```bash
openclaw channels login --channel whatsapp --account work
```

    برای اتصال یک پوشهٔ احراز هویت موجود/سفارشی WhatsApp Web پیش از ورود:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="شروع Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="تأیید نخستین درخواست جفت‌سازی (در صورت استفاده از حالت جفت‌سازی)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    درخواست‌های جفت‌سازی پس از 1 ساعت منقضی می‌شوند. درخواست‌های در انتظار برای هر کانال به 3 مورد محدود می‌شوند.

  </Step>
</Steps>

<Note>
OpenClaw توصیه می‌کند در صورت امکان WhatsApp را روی یک شمارهٔ جداگانه اجرا کنید. (فرادادهٔ کانال و جریان راه‌اندازی برای این چیدمان بهینه شده‌اند، اما چیدمان‌های شمارهٔ شخصی نیز پشتیبانی می‌شوند.)
</Note>

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="شمارهٔ اختصاصی (توصیه‌شده)">
    این تمیزترین حالت عملیاتی است:

    - هویت جداگانهٔ WhatsApp برای OpenClaw
    - allowlistهای DM و مرزهای مسیریابی واضح‌تر
    - احتمال کمتر سردرگمی در چت با خود

    الگوی حداقلی سیاست:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="جایگزین شمارهٔ شخصی">
    راه‌اندازی اولیه از حالت شمارهٔ شخصی پشتیبانی می‌کند و یک خط مبنای سازگار با چت با خود می‌نویسد:

    - `dmPolicy: "allowlist"`
    - `allowFrom` شامل شمارهٔ شخصی شماست
    - `selfChatMode: true`

    در زمان اجرا، محافظت‌های چت با خود بر اساس شمارهٔ خودِ پیوندشده و `allowFrom` اعمال می‌شوند.

  </Accordion>

  <Accordion title="دامنهٔ کانال فقط WhatsApp Web">
    کانال سکوی پیام‌رسانی در معماری فعلی کانال‌های OpenClaw مبتنی بر WhatsApp Web (`Baileys`) است.

    در رجیستری داخلی کانال‌های چت، کانال پیام‌رسانی جداگانه‌ای برای Twilio WhatsApp وجود ندارد.

  </Accordion>
</AccordionGroup>

## مدل زمان اجرا

- Gateway مالک سوکت WhatsApp و حلقهٔ اتصال مجدد است.
- ناظر اتصال مجدد از فعالیت انتقال WhatsApp Web استفاده می‌کند، نه فقط حجم پیام‌های ورودی برنامه؛ بنابراین یک نشست دستگاه پیوندشدهٔ کم‌صدا صرفاً به این دلیل که اخیراً کسی پیامی نفرستاده است بازراه‌اندازی نمی‌شود. یک سقف طولانی‌تر سکوت برنامه همچنان اگر فریم‌های انتقال همچنان برسند اما در بازهٔ ناظر هیچ پیام برنامه‌ای پردازش نشود، اتصال مجدد را مجبور می‌کند؛ پس از اتصال مجدد گذرا برای نشستی که اخیراً فعال بوده است، آن بررسی سکوت برنامه برای نخستین پنجرهٔ بازیابی از مهلت عادی پیام استفاده می‌کند.
- زمان‌بندی‌های سوکت Baileys به‌صورت صریح زیر `web.whatsapp.*` قرار دارند: `keepAliveIntervalMs` پینگ‌های برنامهٔ WhatsApp Web را کنترل می‌کند، `connectTimeoutMs` مهلت دست‌دهی آغازین را کنترل می‌کند، و `defaultQueryTimeoutMs` مهلت‌های پرس‌وجوی Baileys را کنترل می‌کند.
- ارسال‌های خروجی برای حساب هدف به یک شنوندهٔ فعال WhatsApp نیاز دارند.
- چت‌های وضعیت و پخش نادیده گرفته می‌شوند (`@status`، `@broadcast`).
- ناظر اتصال مجدد فعالیت انتقال WhatsApp Web را دنبال می‌کند، نه فقط حجم پیام‌های ورودی برنامه: نشست‌های دستگاه پیوندشدهٔ کم‌صدا تا وقتی فریم‌های انتقال ادامه داشته باشند برقرار می‌مانند، اما توقف انتقال خیلی زودتر از مسیر قطع اتصال راه‌دور بعدی باعث اتصال مجدد می‌شود.
- چت‌های مستقیم از قواعد نشست DM استفاده می‌کنند (`session.dmScope`؛ مقدار پیش‌فرض `main`، DMها را در نشست اصلی عامل ادغام می‌کند).
- نشست‌های گروه ایزوله هستند (`agent:<agentId>:whatsapp:group:<jid>`).
- کانال‌ها/خبرنامه‌های WhatsApp می‌توانند با JID بومی `@newsletter` خود هدف‌های خروجی صریح باشند. ارسال‌های خروجی خبرنامه به‌جای معناشناسی نشست DM، از فرادادهٔ نشست کانال (`agent:<agentId>:whatsapp:channel:<jid>`) استفاده می‌کنند.
- انتقال WhatsApp Web از متغیرهای محیطی استاندارد پراکسی روی میزبان Gateway پیروی می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، `NO_PROXY` / گونه‌های حروف کوچک). پیکربندی پراکسی در سطح میزبان را به تنظیمات پراکسی مخصوص کانال WhatsApp ترجیح دهید.
- وقتی `messages.removeAckAfterReply` فعال باشد، OpenClaw پس از تحویل یک پاسخ قابل مشاهده، واکنش تأیید WhatsApp را پاک می‌کند.

## قلاب‌های Plugin و حریم خصوصی

پیام‌های ورودی WhatsApp می‌توانند شامل محتوای پیام شخصی، شماره تلفن‌ها،
شناسه‌های گروه، نام‌های فرستنده، و فیلدهای همبستگی نشست باشند. به همین دلیل،
WhatsApp بارهای `message_received` ورودی را برای Pluginها پخش نمی‌کند
مگر اینکه صریحاً آن را فعال کنید:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

می‌توانید این فعال‌سازی را به یک حساب محدود کنید:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

این گزینه را فقط برای Pluginهایی فعال کنید که به دریافت محتوای پیام‌های ورودی WhatsApp
و شناسه‌ها توسط آن‌ها اعتماد دارید.

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست DM">
    `channels.whatsapp.dmPolicy` دسترسی چت مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند آن است که `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `allowFrom` شماره‌هایی به سبک E.164 می‌پذیرد (به‌صورت داخلی نرمال‌سازی می‌شوند).

    `allowFrom` یک فهرست کنترل دسترسی فرستندهٔ DM است. ارسال‌های خروجی صریح به JIDهای گروه WhatsApp یا JIDهای کانال `@newsletter` را محدود نمی‌کند.

    بازنویسی چندحسابی: `channels.whatsapp.accounts.<id>.dmPolicy` (و `allowFrom`) برای آن حساب بر پیش‌فرض‌های سطح کانال تقدم دارند.

    جزئیات رفتار زمان اجرا:

    - جفت‌سازی‌ها در انبار allow کانال پایدار می‌شوند و با `allowFrom` پیکربندی‌شده ادغام می‌شوند
    - خودکارسازی زمان‌بندی‌شده و جایگزین گیرندهٔ Heartbeat از هدف‌های تحویل صریح یا `allowFrom` پیکربندی‌شده استفاده می‌کنند؛ تأییدهای جفت‌سازی DM گیرندگان ضمنی Cron یا Heartbeat نیستند
    - اگر allowlist پیکربندی نشده باشد، شمارهٔ خودِ پیوندشده به‌طور پیش‌فرض مجاز است
    - OpenClaw هرگز DMهای خروجی `fromMe` را به‌طور خودکار جفت نمی‌کند (پیام‌هایی که از دستگاه پیوندشده برای خودتان می‌فرستید)

  </Tab>

  <Tab title="سیاست گروه + allowlistها">
    دسترسی گروه دو لایه دارد:

    1. **allowlist عضویت گروه** (`channels.whatsapp.groups`)
       - اگر `groups` حذف شده باشد، همهٔ گروه‌ها واجد شرایط هستند
       - اگر `groups` وجود داشته باشد، به‌عنوان allowlist گروه عمل می‌کند (`"*"` مجاز است)

    2. **سیاست فرستندهٔ گروه** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist فرستنده دور زده می‌شود
       - `allowlist`: فرستنده باید با `groupAllowFrom` (یا `*`) مطابقت داشته باشد
       - `disabled`: همهٔ ورودی‌های گروه را مسدود می‌کند

    جایگزین allowlist فرستنده:

    - اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا در صورت وجود به `allowFrom` برمی‌گردد
    - allowlistهای فرستنده پیش از فعال‌سازی با mention/پاسخ ارزیابی می‌شوند

    نکته: اگر اصلاً بلوک `channels.whatsapp` وجود نداشته باشد، جایگزین سیاست گروه در زمان اجرا `allowlist` است (با یک لاگ هشدار)، حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد.

  </Tab>

  <Tab title="Mentionها + /activation">
    پاسخ‌های گروه به‌طور پیش‌فرض به mention نیاز دارند.

    تشخیص mention شامل موارد زیر است:

    - mentionهای صریح WhatsApp از هویت ربات
    - الگوهای regex mention پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، جایگزین `messages.groupChat.mentionPatterns`)
    - رونوشت‌های یادداشت صوتی ورودی برای پیام‌های گروهی مجاز
    - تشخیص ضمنی پاسخ به ربات (فرستندهٔ پاسخ با هویت ربات مطابقت دارد)

    نکتهٔ امنیتی:

    - نقل‌قول/پاسخ فقط شرط mention را برآورده می‌کند؛ **مجوز فرستنده را اعطا نمی‌کند**
    - با `groupPolicy: "allowlist"`، فرستنده‌هایی که در allowlist نیستند همچنان مسدود می‌شوند، حتی اگر به پیام کاربری در allowlist پاسخ دهند

    فرمان فعال‌سازی سطح نشست:

    - `/activation mention`
    - `/activation always`

    `activation` وضعیت نشست را به‌روزرسانی می‌کند (نه پیکربندی سراسری). این کار با مالک محدود می‌شود.

  </Tab>
</Tabs>

## رفتار شمارهٔ شخصی و چت با خود

وقتی شمارهٔ خودِ پیوندشده نیز در `allowFrom` وجود داشته باشد، محافظت‌های چت با خود WhatsApp فعال می‌شوند:

- رد کردن رسیدهای خواندن برای نوبت‌های چت با خود
- نادیده گرفتن رفتار تحریک خودکار mention-JID که در غیر این صورت به خودتان پینگ می‌زد
- اگر `messages.responsePrefix` تنظیم نشده باشد، پاسخ‌های چت با خود به‌طور پیش‌فرض `[{identity.name}]` یا `[openclaw]` هستند

## نرمال‌سازی پیام و زمینه

<AccordionGroup>
  <Accordion title="پاکت ورودی + زمینهٔ پاسخ">
    پیام‌های ورودی WhatsApp در پاکت ورودی مشترک پیچیده می‌شوند.

    اگر پاسخ نقل‌قول‌شده وجود داشته باشد، زمینه به این شکل افزوده می‌شود:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    فیلدهای فرادادهٔ پاسخ نیز در صورت موجود بودن پر می‌شوند (`ReplyToId`، `ReplyToBody`، `ReplyToSender`، JID/E.164 فرستنده).
    وقتی هدف پاسخ نقل‌قول‌شده رسانهٔ قابل دانلود باشد، OpenClaw آن را از طریق
    انبار عادی رسانهٔ ورودی ذخیره می‌کند و به‌صورت `MediaPath`/`MediaType` در دسترس می‌گذارد تا
    عامل بتواند تصویر ارجاع‌شده را بررسی کند، نه اینکه فقط
    `<media:image>` را ببیند.

  </Accordion>

  <Accordion title="جای‌نگهدارهای رسانه و استخراج مکان/مخاطب">
    پیام‌های ورودی فقط‌رسانه با جای‌نگهدارهایی مانند موارد زیر نرمال‌سازی می‌شوند:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    یادداشت‌های صوتی گروهی مجاز پیش از شرط mention رونویسی می‌شوند، وقتی
    بدنه فقط `<media:audio>` باشد؛ بنابراین گفتن mention ربات در یادداشت صوتی می‌تواند
    پاسخ را تحریک کند. اگر رونوشت همچنان به ربات mention نکند،
    رونوشت به‌جای جای‌نگهدار خام در تاریخچهٔ گروه در انتظار نگه داشته می‌شود.

    بدنه‌های مکان از متن مختصر مختصات استفاده می‌کنند. برچسب‌ها/نظرهای مکان و جزئیات مخاطب/vCard به‌صورت فرادادهٔ نامطمئن حصاردار نمایش داده می‌شوند، نه متن درون‌خطی prompt.

  </Accordion>

  <Accordion title="تزریق تاریخچهٔ گروه در انتظار">
    برای گروه‌ها، پیام‌های پردازش‌نشده می‌توانند بافر شوند و وقتی ربات در نهایت تحریک شد، به‌عنوان زمینه تزریق شوند.

    - حد پیش‌فرض: `50`
    - پیکربندی: `channels.whatsapp.historyLimit`
    - جایگزین: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    نشانگرهای تزریق:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="رسیدهای خواندن">
    رسیدهای خواندن برای پیام‌های ورودی پذیرفته‌شدهٔ WhatsApp به‌طور پیش‌فرض فعال هستند.

    غیرفعال‌سازی سراسری:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    بازنویسی برای هر حساب:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    نوبت‌های گفت‌وگوی با خود، حتی وقتی به‌صورت سراسری فعال باشند، رسیدهای خواندن را نادیده می‌گیرند.

  </Accordion>
</AccordionGroup>

## تحویل، قطعه‌بندی، و رسانه

<AccordionGroup>
  <Accordion title="قطعه‌بندی متن">
    - حد پیش‌فرض قطعه: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - حالت `newline` مرزهای پاراگراف را ترجیح می‌دهد (خطوط خالی)، سپس به قطعه‌بندی ایمن بر اساس طول برمی‌گردد

  </Accordion>

  <Accordion title="رفتار رسانه خروجی">
    - از بارهای تصویر، ویدیو، صدا (یادداشت صوتی PTT)، و سند پشتیبانی می‌کند
    - رسانه صوتی از طریق بار `audio` در Baileys با `ptt: true` فرستاده می‌شود، بنابراین کلاینت‌های WhatsApp آن را به‌صورت یادداشت صوتی فشار-برای-صحبت نمایش می‌دهند
    - بارهای پاسخ `audioAsVoice` را حفظ می‌کنند؛ خروجی یادداشت صوتی TTS برای WhatsApp حتی وقتی ارائه‌دهنده MP3 یا WebM برگرداند، روی همین مسیر PTT می‌ماند
    - صدای بومی Ogg/Opus برای سازگاری یادداشت صوتی به‌صورت `audio/ogg; codecs=opus` فرستاده می‌شود
    - صدای غیر Ogg، شامل خروجی MP3/WebM در Microsoft Edge TTS، پیش از تحویل PTT با `ffmpeg` به Ogg/Opus مونو 48 kHz تبدیل می‌شود
    - `/tts latest` آخرین پاسخ دستیار را به‌صورت یک یادداشت صوتی می‌فرستد و ارسال‌های تکراری برای همان پاسخ را سرکوب می‌کند؛ `/tts chat on|off|default`، auto-TTS را برای گفت‌وگوی فعلی WhatsApp کنترل می‌کند
    - پخش GIF متحرک از طریق `gifPlayback: true` در ارسال‌های ویدیویی پشتیبانی می‌شود
    - هنگام ارسال بارهای پاسخ چندرسانه‌ای، زیرنویس‌ها روی نخستین آیتم رسانه اعمال می‌شوند، به‌جز یادداشت‌های صوتی PTT که صدا را اول و متن قابل مشاهده را جداگانه می‌فرستند، چون کلاینت‌های WhatsApp زیرنویس‌های یادداشت صوتی را به‌طور یکنواخت نمایش نمی‌دهند
    - منبع رسانه می‌تواند HTTP(S)، `file://`، یا مسیرهای محلی باشد

  </Accordion>

  <Accordion title="محدودیت‌های اندازه رسانه و رفتار جایگزین">
    - سقف ذخیره رسانه ورودی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - سقف ارسال رسانه خروجی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<accountId>.mediaMaxMb` استفاده می‌کنند
    - تصاویر به‌صورت خودکار بهینه می‌شوند (تغییر اندازه/پیمایش کیفیت) تا در محدودیت‌ها جا شوند
    - در صورت شکست ارسال رسانه، جایگزین آیتم اول به‌جای حذف بی‌صدای پاسخ، هشدار متنی می‌فرستد

  </Accordion>
</AccordionGroup>

## نقل‌قول پاسخ

WhatsApp از نقل‌قول بومی پاسخ پشتیبانی می‌کند، که در آن پاسخ‌های خروجی به‌صورت قابل مشاهده پیام ورودی را نقل می‌کنند. آن را با `channels.whatsapp.replyToMode` کنترل کنید.

| مقدار       | رفتار                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | هرگز نقل‌قول نکن؛ به‌صورت پیام ساده بفرست                                  |
| `"first"`   | فقط نخستین قطعه پاسخ خروجی را نقل‌قول کن                             |
| `"all"`     | هر قطعه پاسخ خروجی را نقل‌قول کن                                      |
| `"batched"` | پاسخ‌های دسته‌ای صف‌شده را نقل‌قول کن و پاسخ‌های فوری را بدون نقل‌قول بگذار |

پیش‌فرض `"off"` است. بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<id>.replyToMode` استفاده می‌کنند.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## سطح واکنش

`channels.whatsapp.reactionLevel` کنترل می‌کند عامل تا چه گستره‌ای از واکنش‌های ایموجی در WhatsApp استفاده کند:

| سطح         | واکنش‌های تأیید | واکنش‌های آغازشده توسط عامل | توضیح                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | خیر            | خیر                        | هیچ واکنشی وجود ندارد                              |
| `"ack"`       | بله           | خیر                        | فقط واکنش‌های تأیید (رسید پیش از پاسخ)           |
| `"minimal"`   | بله           | بله (محافظه‌کارانه)        | تأیید + واکنش‌های عامل با راهنمایی محافظه‌کارانه |
| `"extensive"` | بله           | بله (تشویق‌شده)          | تأیید + واکنش‌های عامل با راهنمایی تشویق‌شده   |

پیش‌فرض: `"minimal"`.

بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<id>.reactionLevel` استفاده می‌کنند.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## واکنش‌های تأیید

WhatsApp از واکنش‌های تأیید فوری هنگام دریافت ورودی از طریق `channels.whatsapp.ackReaction` پشتیبانی می‌کند.
واکنش‌های تأیید با `reactionLevel` کنترل می‌شوند — وقتی `reactionLevel` برابر `"off"` باشد، سرکوب می‌شوند.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

نکات رفتاری:

- بلافاصله پس از پذیرش ورودی فرستاده می‌شود (پیش از پاسخ)
- شکست‌ها ثبت می‌شوند اما تحویل عادی پاسخ را مسدود نمی‌کنند
- حالت گروهی `mentions` در نوبت‌های فعال‌شده با mention واکنش می‌دهد؛ فعال‌سازی گروهی `always` به‌عنوان میان‌بر برای این بررسی عمل می‌کند
- WhatsApp از `channels.whatsapp.ackReaction` استفاده می‌کند (`messages.ackReaction` قدیمی اینجا استفاده نمی‌شود)

## چندحسابی و اعتبارنامه‌ها

<AccordionGroup>
  <Accordion title="انتخاب حساب و پیش‌فرض‌ها">
    - شناسه‌های حساب از `channels.whatsapp.accounts` می‌آیند
    - انتخاب حساب پیش‌فرض: اگر وجود داشته باشد `default`، وگرنه نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده)
    - شناسه‌های حساب برای جست‌وجو به‌صورت داخلی نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="مسیرهای اعتبارنامه و سازگاری قدیمی">
    - مسیر احراز هویت فعلی: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - فایل پشتیبان: `creds.json.bak`
    - احراز هویت پیش‌فرض قدیمی در `~/.openclaw/credentials/` همچنان برای جریان‌های حساب پیش‌فرض شناسایی/مهاجرت می‌شود

  </Accordion>

  <Accordion title="رفتار خروج">
    `openclaw channels logout --channel whatsapp [--account <id>]` وضعیت احراز هویت WhatsApp را برای آن حساب پاک می‌کند.

    وقتی یک Gateway در دسترس باشد، خروج ابتدا شنونده زنده WhatsApp را برای حساب انتخاب‌شده متوقف می‌کند تا نشست پیوندشده تا راه‌اندازی مجدد بعدی همچنان پیام دریافت نکند. `openclaw channels remove --channel whatsapp` نیز پیش از غیرفعال‌سازی یا حذف پیکربندی حساب، شنونده زنده را متوقف می‌کند.

    در پوشه‌های احراز هویت قدیمی، `oauth.json` حفظ می‌شود درحالی‌که فایل‌های احراز هویت Baileys حذف می‌شوند.

  </Accordion>
</AccordionGroup>

## ابزارها، کنش‌ها، و نوشتن پیکربندی

- پشتیبانی ابزار عامل شامل کنش واکنش WhatsApp (`react`) است.
- دروازه‌های کنش:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- نوشتن پیکربندی آغازشده از کانال به‌صورت پیش‌فرض فعال است (غیرفعال‌سازی از طریق `channels.whatsapp.configWrites=false`).

## عیب‌یابی

<AccordionGroup>
  <Accordion title="پیوند نشده (QR لازم است)">
    نشانه: وضعیت کانال گزارش می‌دهد که پیوند نشده است.

    رفع:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="پیوند شده اما قطع است / حلقه اتصال مجدد">
    نشانه: حساب پیوندشده با قطع‌های تکراری یا تلاش‌های اتصال مجدد.

    حساب‌های کم‌ترافیک می‌توانند پس از مهلت عادی پیام متصل بمانند؛ watchdog
    زمانی راه‌اندازی مجدد می‌کند که فعالیت انتقال WhatsApp Web متوقف شود، سوکت بسته شود، یا
    فعالیت سطح برنامه بیش از پنجره ایمنی طولانی‌تر ساکت بماند.

    اگر لاگ‌ها `status=408 Request Time-out Connection was lost` تکراری نشان می‌دهند،
    زمان‌بندی‌های سوکت Baileys را زیر `web.whatsapp` تنظیم کنید. با کوتاه کردن
    `keepAliveIntervalMs` به کمتر از مهلت بیکاری شبکه خود و افزایش
    `connectTimeoutMs` روی پیوندهای کند یا پراتلاف شروع کنید:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    رفع:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    اگر `~/.openclaw/logs/whatsapp-health.log` می‌گوید `Gateway inactive` اما
    `openclaw gateway status` و `openclaw channels status --probe` نشان می‌دهند
    gateway و WhatsApp سالم هستند، `openclaw doctor` را اجرا کنید. در Linux، doctor
    درباره ورودی‌های crontab قدیمی که هنوز
    `~/.openclaw/bin/ensure-whatsapp.sh` را فراخوانی می‌کنند هشدار می‌دهد؛ آن ورودی‌های کهنه را با
    `crontab -e` حذف کنید، چون cron ممکن است محیط systemd user-bus را نداشته باشد و
    باعث شود آن اسکریپت قدیمی سلامت gateway را اشتباه گزارش کند.

    در صورت نیاز، با `channels login` دوباره پیوند دهید.

  </Accordion>

  <Accordion title="ورود QR پشت پراکسی مهلتش تمام می‌شود">
    نشانه: `openclaw channels login --channel whatsapp` پیش از نشان دادن یک کد QR قابل استفاده با `status=408 Request Time-out` یا قطع سوکت TLS شکست می‌خورد.

    ورود WhatsApp Web از محیط پراکسی استاندارد میزبان gateway استفاده می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، گونه‌های حروف کوچک، و `NO_PROXY`). بررسی کنید فرایند gateway env پراکسی را به ارث می‌برد و `NO_PROXY` با `mmg.whatsapp.net` مطابقت ندارد.

  </Accordion>

  <Accordion title="هنگام ارسال شنونده فعالی وجود ندارد">
    ارسال‌های خروجی وقتی هیچ شنونده gateway فعالی برای حساب هدف وجود نداشته باشد سریع شکست می‌خورند.

    مطمئن شوید gateway در حال اجراست و حساب پیوند شده است.

  </Accordion>

  <Accordion title="پاسخ در رونوشت دیده می‌شود اما در WhatsApp نه">
    ردیف‌های رونوشت چیزی را که عامل تولید کرده ثبت می‌کنند. تحویل WhatsApp جداگانه بررسی می‌شود: OpenClaw فقط وقتی یک پاسخ خودکار را ارسال‌شده تلقی می‌کند که Baileys برای دست‌کم یک ارسال متن قابل مشاهده یا رسانه، شناسه پیام خروجی برگرداند.

    واکنش‌های تأیید رسیدهای مستقل پیش از پاسخ هستند. واکنش موفق ثابت نمی‌کند که پاسخ متنی یا رسانه‌ای بعدی توسط WhatsApp پذیرفته شده است.

    لاگ‌های gateway را برای `auto-reply delivery failed` یا `auto-reply was not accepted by WhatsApp provider` بررسی کنید.

  </Accordion>

  <Accordion title="پیام‌های گروهی به‌طور غیرمنتظره نادیده گرفته می‌شوند">
    به این ترتیب بررسی کنید:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - ورودی‌های allowlist در `groups`
    - دروازه‌بانی mention (`requireMention` + الگوهای mention)
    - کلیدهای تکراری در `openclaw.json` (JSON5): ورودی‌های بعدی قبلی‌ها را بازنویسی می‌کنند، پس برای هر scope فقط یک `groupPolicy` نگه دارید

  </Accordion>

  <Accordion title="هشدار زمان اجرای Bun">
    زمان اجرای gateway مربوط به WhatsApp باید از Node استفاده کند. Bun برای عملیات پایدار gateway مربوط به WhatsApp/Telegram ناسازگار علامت‌گذاری شده است.
  </Accordion>
</AccordionGroup>

## اعلان‌های سیستمی

WhatsApp از اعلان‌های سیستمی به سبک Telegram برای گروه‌ها و گفت‌وگوهای مستقیم از طریق نگاشت‌های `groups` و `direct` پشتیبانی می‌کند.

سلسله‌مراتب حل برای پیام‌های گروهی:

نگاشت مؤثر `groups` ابتدا تعیین می‌شود: اگر حساب `groups` خودش را تعریف کند، به‌طور کامل جایگزین نگاشت ریشه `groups` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی اعلان روی همان نگاشت واحد حاصل اجرا می‌شود:

1. **اعلان سیستمی ویژه گروه** (`groups["<groupId>"].systemPrompt`): وقتی ورودی گروه مشخص در نگاشت وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد استفاده می‌شود. اگر `systemPrompt` یک رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ اعلان سیستمی اعمال نمی‌شود.
2. **اعلان سیستمی wildcard گروه** (`groups["*"].systemPrompt`): وقتی ورودی گروه مشخص به‌کلی از نگاشت غایب باشد، یا وقتی وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند استفاده می‌شود.

سلسله‌مراتب حل برای پیام‌های مستقیم:

نگاشت مؤثر `direct` ابتدا تعیین می‌شود: اگر حساب `direct` خودش را تعریف کند، به‌طور کامل جایگزین نگاشت ریشه `direct` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی اعلان روی همان نگاشت واحد حاصل اجرا می‌شود:

1. **اعلان سیستمی ویژه مستقیم** (`direct["<peerId>"].systemPrompt`): وقتی ورودی peer مشخص در نگاشت وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد استفاده می‌شود. اگر `systemPrompt` یک رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ اعلان سیستمی اعمال نمی‌شود.
2. **اعلان سیستمی wildcard مستقیم** (`direct["*"].systemPrompt`): وقتی ورودی peer مشخص به‌کلی از نگاشت غایب باشد، یا وقتی وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند استفاده می‌شود.

<Note>
`dms` همچنان سطل سبک بازنویسی تاریخچه برای هر DM است (`dms.<id>.historyLimit`). بازنویسی‌های اعلان زیر `direct` قرار دارند.
</Note>

**تفاوت با رفتار چندحسابی Telegram:** در Telegram، `groups` ریشه به‌صورت عمدی برای همهٔ حساب‌ها در یک پیکربندی چندحسابی سرکوب می‌شود — حتی حساب‌هایی که هیچ `groups` مخصوص خودشان تعریف نکرده‌اند — تا از دریافت پیام‌های گروهی توسط بات برای گروه‌هایی که عضو آن‌ها نیست جلوگیری شود. WhatsApp این محافظ را اعمال نمی‌کند: `groups` ریشه و `direct` ریشه همیشه توسط حساب‌هایی که بازنویسی در سطح حساب تعریف نکرده‌اند به ارث برده می‌شوند، فارغ از اینکه چند حساب پیکربندی شده باشد. در یک پیکربندی چندحسابی WhatsApp، اگر پرامپت‌های گروهی یا مستقیم جداگانه برای هر حساب می‌خواهید، به‌جای اتکا به پیش‌فرض‌های سطح ریشه، نگاشت کامل را به‌صراحت زیر هر حساب تعریف کنید.

رفتار مهم:

- `channels.whatsapp.groups` هم نگاشت پیکربندی برای هر گروه است و هم فهرست مجاز گروه در سطح چت. در سطح ریشه یا حساب، `groups["*"]` یعنی «همهٔ گروه‌ها برای آن سطح پذیرفته می‌شوند».
- فقط وقتی گروه wildcard با `systemPrompt` اضافه کنید که از قبل می‌خواهید آن سطح همهٔ گروه‌ها را بپذیرد. اگر همچنان می‌خواهید فقط مجموعه‌ای ثابت از شناسه‌های گروه واجد شرایط باشند، از `groups["*"]` برای پیش‌فرض پرامپت استفاده نکنید. به‌جای آن، پرامپت را روی هر ورودی گروهی که به‌صراحت در فهرست مجاز آمده تکرار کنید.
- پذیرش گروه و مجوزدهی فرستنده بررسی‌های جداگانه‌ای هستند. `groups["*"]` مجموعهٔ گروه‌هایی را که می‌توانند به پردازش گروه برسند گسترش می‌دهد، اما به‌تنهایی همهٔ فرستندگان آن گروه‌ها را مجاز نمی‌کند. دسترسی فرستنده همچنان جداگانه با `channels.whatsapp.groupPolicy` و `channels.whatsapp.groupAllowFrom` کنترل می‌شود.
- `channels.whatsapp.direct` همین اثر جانبی را برای DMها ندارد. `direct["*"]` فقط پس از آنکه یک DM توسط `dmPolicy` به‌همراه `allowFrom` یا قواعد pairing-store پذیرفته شد، پیکربندی پیش‌فرض گفت‌وگوی مستقیم را فراهم می‌کند.

مثال:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## اشاره‌گرهای مرجع پیکربندی

مرجع اصلی:

- [مرجع پیکربندی - WhatsApp](/fa/gateway/config-channels#whatsapp)

فیلدهای مهم WhatsApp:

- دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- تحویل: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- چندحسابی: `accounts.<id>.enabled`, `accounts.<id>.authDir`, بازنویسی‌های سطح حساب
- عملیات: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- رفتار نشست: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- پرامپت‌ها: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## مرتبط

- [جفت‌سازی](/fa/channels/pairing)
- [گروه‌ها](/fa/channels/groups)
- [امنیت](/fa/gateway/security)
- [مسیریابی کانال](/fa/channels/channel-routing)
- [مسیریابی چندعامله](/fa/concepts/multi-agent)
- [عیب‌یابی](/fa/channels/troubleshooting)

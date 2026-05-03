---
read_when:
    - کار روی رفتار کانال WhatsApp/وب یا مسیریابی صندوق ورودی
summary: پشتیبانی کانال WhatsApp، کنترل‌های دسترسی، رفتار تحویل، و عملیات
title: WhatsApp
x-i18n:
    generated_at: "2026-05-03T11:32:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f12709fc8ecb45e1b060647daf9a4624485d52b7b6436c3d07f171e6807babf
    source_path: channels/whatsapp.md
    workflow: 16
---

وضعیت: آماده برای تولید از طریق WhatsApp Web (Baileys). Gateway مالک نشست(های) پیوندشده است.

## نصب (در صورت نیاز)

- راه‌اندازی اولیه (`openclaw onboard`) و `openclaw channels add --channel whatsapp`
  هنگام نخستین انتخاب WhatsApp plugin، از شما می‌خواهند آن را نصب کنید.
- `openclaw channels login --channel whatsapp` نیز وقتی
  plugin هنوز موجود نیست، جریان نصب را پیشنهاد می‌کند.
- کانال توسعه + checkout گیت: به‌طور پیش‌فرض از مسیر Plugin محلی استفاده می‌کند.
- Stable/Beta: از بسته npm یعنی `@openclaw/whatsapp` روی برچسب انتشار رسمی فعلی استفاده می‌کند.

نصب دستی همچنان در دسترس است:

```bash
openclaw plugins install @openclaw/whatsapp
```

برای دنبال کردن برچسب انتشار رسمی فعلی، از بسته بدون نسخه استفاده کنید. فقط زمانی نسخه دقیق را
پین کنید که به نصب بازتولیدپذیر نیاز دارید.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای فرستندگان ناشناس، جفت‌سازی است.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی بین‌کانالی و راهنماهای ترمیم.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/fa/gateway/configuration">
    الگوها و نمونه‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="Configure WhatsApp access policy">

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

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    برای یک حساب مشخص:

```bash
openclaw channels login --channel whatsapp --account work
```

    برای اتصال یک دایرکتوری احراز هویت موجود/سفارشی WhatsApp Web پیش از ورود:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    درخواست‌های جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های معلق برای هر کانال به ۳ مورد محدود می‌شوند.

  </Step>
</Steps>

<Note>
OpenClaw توصیه می‌کند در صورت امکان WhatsApp را روی یک شماره جداگانه اجرا کنید. (فراداده کانال و جریان راه‌اندازی برای این نوع راه‌اندازی بهینه شده‌اند، اما راه‌اندازی با شماره شخصی نیز پشتیبانی می‌شود.)
</Note>

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    این تمیزترین حالت عملیاتی است:

    - هویت WhatsApp جداگانه برای OpenClaw
    - فهرست‌های مجاز پیام مستقیم و مرزهای مسیریابی شفاف‌تر
    - احتمال کمتر سردرگمی در گفت‌وگوی با خود

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

  <Accordion title="Personal-number fallback">
    راه‌اندازی اولیه از حالت شماره شخصی پشتیبانی می‌کند و یک خط مبنای سازگار با گفت‌وگوی با خود می‌نویسد:

    - `dmPolicy: "allowlist"`
    - `allowFrom` شامل شماره شخصی شماست
    - `selfChatMode: true`

    در زمان اجرا، محافظت‌های گفت‌وگوی با خود بر اساس شماره خودِ پیوندشده و `allowFrom` عمل می‌کنند.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    کانال سکوی پیام‌رسانی در معماری فعلی کانال OpenClaw مبتنی بر WhatsApp Web (`Baileys`) است.

    در رجیستری داخلی کانال‌های گفت‌وگو، کانال پیام‌رسانی جداگانه‌ای برای Twilio WhatsApp وجود ندارد.

  </Accordion>
</AccordionGroup>

## مدل زمان اجرا

- Gateway مالک سوکت WhatsApp و حلقه اتصال مجدد است.
- ناظر اتصال مجدد از فعالیت انتقال WhatsApp Web استفاده می‌کند، نه فقط حجم پیام‌های ورودی برنامه؛ بنابراین یک نشست دستگاه پیوندشده ساکت صرفا به دلیل اینکه اخیرا کسی پیامی نفرستاده، بازراه‌اندازی نمی‌شود. یک سقف طولانی‌تر سکوت برنامه همچنان اگر فریم‌های انتقال همچنان برسند اما در پنجره ناظر هیچ پیام برنامه‌ای پردازش نشود، اتصال مجدد را اجباری می‌کند؛ پس از یک اتصال مجدد گذرا برای نشستی که اخیرا فعال بوده، این بررسی سکوت برنامه برای نخستین پنجره بازیابی از مهلت عادی پیام استفاده می‌کند.
- زمان‌بندی‌های سوکت Baileys زیر `web.whatsapp.*` صریح هستند: `keepAliveIntervalMs` پینگ‌های برنامه WhatsApp Web را کنترل می‌کند، `connectTimeoutMs` مهلت دست‌دادن آغازین را کنترل می‌کند، و `defaultQueryTimeoutMs` مهلت‌های پرس‌وجوی Baileys را کنترل می‌کند.
- ارسال‌های خروجی به یک شنونده فعال WhatsApp برای حساب هدف نیاز دارند.
- ارسال‌های گروهی برای توکن‌های `@+<digits>` و `@<digits>` در متن و کپشن‌های رسانه، وقتی توکن با فراداده فعلی شرکت‌کننده WhatsApp مطابقت داشته باشد، از جمله گروه‌های پشتیبانی‌شده با LID، فراداده mention بومی را پیوست می‌کنند.
- گفت‌وگوهای وضعیت و پخش نادیده گرفته می‌شوند (`@status`، `@broadcast`).
- ناظر اتصال مجدد فعالیت انتقال WhatsApp Web را دنبال می‌کند، نه فقط حجم پیام‌های ورودی برنامه: نشست‌های دستگاه پیوندشده ساکت تا وقتی فریم‌های انتقال ادامه دارند برقرار می‌مانند، اما توقف انتقال خیلی پیش از مسیر دیرتر قطع اتصال از راه دور، اتصال مجدد را اجباری می‌کند.
- گفت‌وگوهای مستقیم از قواعد نشست پیام مستقیم استفاده می‌کنند (`session.dmScope`؛ مقدار پیش‌فرض `main` پیام‌های مستقیم را در نشست اصلی عامل ادغام می‌کند).
- نشست‌های گروهی ایزوله هستند (`agent:<agentId>:whatsapp:group:<jid>`).
- کانال‌ها/خبرنامه‌های WhatsApp می‌توانند هدف‌های خروجی صریح با JID بومی `@newsletter` خود باشند. ارسال‌های خروجی خبرنامه به‌جای معناشناسی نشست پیام مستقیم، از فراداده نشست کانال (`agent:<agentId>:whatsapp:channel:<jid>`) استفاده می‌کنند.
- انتقال WhatsApp Web متغیرهای محیطی استاندارد پراکسی را روی میزبان Gateway رعایت می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، `NO_PROXY` / گونه‌های حروف کوچک). پیکربندی پراکسی در سطح میزبان را به تنظیمات پراکسی اختصاصی کانال WhatsApp ترجیح دهید.
- وقتی `messages.removeAckAfterReply` فعال باشد، OpenClaw پس از تحویل یک پاسخ قابل مشاهده، واکنش تایید WhatsApp را پاک می‌کند.

## قلاب‌های Plugin و حریم خصوصی

پیام‌های ورودی WhatsApp می‌توانند شامل محتوای پیام شخصی، شماره تلفن‌ها،
شناسه‌های گروه، نام فرستندگان، و فیلدهای هم‌بستگی نشست باشند. به همین دلیل،
WhatsApp payloadهای قلاب ورودی `message_received` را به plugins پخش نمی‌کند
مگر اینکه صراحتا آن را فعال کنید:

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

این گزینه را فقط برای pluginsی فعال کنید که به آن‌ها برای دریافت محتوای پیام
ورودی WhatsApp و شناسه‌ها اعتماد دارید.

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` دسترسی گفت‌وگوی مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند این است که `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `allowFrom` شماره‌های سبک E.164 را می‌پذیرد (داخلی نرمال‌سازی می‌شوند).

    `allowFrom` فهرست کنترل دسترسی فرستنده پیام مستقیم است. ارسال‌های خروجی صریح به JIDهای گروه WhatsApp یا JIDهای کانال `@newsletter` را محدود نمی‌کند.

    بازنویسی چندحسابی: `channels.whatsapp.accounts.<id>.dmPolicy` (و `allowFrom`) برای آن حساب نسبت به پیش‌فرض‌های سطح کانال اولویت دارند.

    جزئیات رفتار زمان اجرا:

    - جفت‌سازی‌ها در allow-store کانال پایدار می‌شوند و با `allowFrom` پیکربندی‌شده ادغام می‌شوند
    - خودکارسازی زمان‌بندی‌شده و بازگشت گیرنده Heartbeat از اهداف تحویل صریح یا `allowFrom` پیکربندی‌شده استفاده می‌کنند؛ تاییدهای جفت‌سازی پیام مستقیم گیرندگان ضمنی cron یا Heartbeat نیستند
    - اگر هیچ فهرست مجازی پیکربندی نشده باشد، شماره خودِ پیوندشده به‌طور پیش‌فرض مجاز است
    - OpenClaw هرگز پیام‌های مستقیم خروجی `fromMe` را به‌طور خودکار جفت نمی‌کند (پیام‌هایی که از دستگاه پیوندشده به خودتان می‌فرستید)

  </Tab>

  <Tab title="Group policy + allowlists">
    دسترسی گروه دو لایه دارد:

    1. **فهرست مجاز عضویت گروه** (`channels.whatsapp.groups`)
       - اگر `groups` حذف شود، همه گروه‌ها واجد شرایط هستند
       - اگر `groups` وجود داشته باشد، به‌عنوان فهرست مجاز گروه عمل می‌کند (`"*"` مجاز است)

    2. **سیاست فرستنده گروه** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: فهرست مجاز فرستنده دور زده می‌شود
       - `allowlist`: فرستنده باید با `groupAllowFrom` (یا `*`) مطابقت داشته باشد
       - `disabled`: همه ورودی‌های گروه مسدود می‌شوند

    بازگشت فهرست مجاز فرستنده:

    - اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا در صورت موجود بودن به `allowFrom` بازمی‌گردد
    - فهرست‌های مجاز فرستنده پیش از فعال‌سازی با mention/reply ارزیابی می‌شوند

    نکته: اگر هیچ بلوک `channels.whatsapp` اصلا وجود نداشته باشد، بازگشت سیاست گروه زمان اجرا `allowlist` است (با ثبت هشدار)، حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد.

  </Tab>

  <Tab title="Mentions + /activation">
    پاسخ‌های گروهی به‌طور پیش‌فرض به mention نیاز دارند.

    تشخیص mention شامل موارد زیر است:

    - mentionهای صریح WhatsApp از هویت ربات
    - الگوهای regex mention پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، بازگشت `messages.groupChat.mentionPatterns`)
    - رونوشت‌های پیام صوتی ورودی برای پیام‌های گروهی مجاز
    - تشخیص ضمنی پاسخ به ربات (فرستنده پاسخ با هویت ربات مطابقت دارد)

    نکته امنیتی:

    - نقل‌قول/پاسخ فقط شرط mention را برآورده می‌کند؛ مجوز فرستنده را اعطا **نمی‌کند**
    - با `groupPolicy: "allowlist"`، فرستندگان خارج از فهرست مجاز حتی اگر به پیام کاربر فهرست‌مجاز پاسخ دهند همچنان مسدود می‌شوند

    فرمان فعال‌سازی در سطح نشست:

    - `/activation mention`
    - `/activation always`

    `activation` وضعیت نشست را به‌روزرسانی می‌کند (نه پیکربندی سراسری). این کار با مالک محدود شده است.

  </Tab>
</Tabs>

## رفتار شماره شخصی و گفت‌وگوی با خود

وقتی شماره خودِ پیوندشده در `allowFrom` نیز وجود داشته باشد، محافظت‌های گفت‌وگوی با خود WhatsApp فعال می‌شوند:

- رسیدهای خواندن برای نوبت‌های گفت‌وگوی با خود رد می‌شوند
- رفتار راه‌انداز خودکار mention-JID که در غیر این صورت به خودتان ping می‌زند نادیده گرفته می‌شود
- اگر `messages.responsePrefix` تنظیم نشده باشد، پاسخ‌های گفت‌وگوی با خود به‌طور پیش‌فرض `[{identity.name}]` یا `[openclaw]` هستند

## نرمال‌سازی پیام و زمینه

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    پیام‌های ورودی WhatsApp در پاکت ورودی مشترک پیچیده می‌شوند.

    اگر پاسخ نقل‌شده‌ای وجود داشته باشد، زمینه به این شکل افزوده می‌شود:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    فیلدهای فراداده پاسخ نیز در صورت موجود بودن پر می‌شوند (`ReplyToId`، `ReplyToBody`، `ReplyToSender`، JID/E.164 فرستنده).
    وقتی هدف پاسخ نقل‌شده رسانه قابل دانلود باشد، OpenClaw آن را از طریق
    ذخیره‌گاه عادی رسانه ورودی ذخیره می‌کند و به‌صورت `MediaPath`/`MediaType` در دسترس می‌گذارد تا
    عامل بتواند تصویر ارجاع‌شده را به‌جای فقط دیدن
    `<media:image>` بررسی کند.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    پیام‌های ورودی فقط‌رسانه با placeholderهایی مانند موارد زیر نرمال‌سازی می‌شوند:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    یادداشت‌های صوتی گروهی مجاز پیش از شرط mention رونویسی می‌شوند، وقتی
    بدنه فقط `<media:audio>` باشد؛ بنابراین گفتن mention ربات در یادداشت صوتی می‌تواند
    پاسخ را فعال کند. اگر رونوشت همچنان به ربات اشاره نکند،
    رونوشت به‌جای placeholder خام در تاریخچه گروه معلق نگه داشته می‌شود.

    بدنه‌های مکان از متن مختصر مختصات استفاده می‌کنند. برچسب‌ها/نظرهای مکان و جزئیات تماس/vCard به‌صورت فراداده نامطمئن حصارکشی‌شده رندر می‌شوند، نه متن prompt درون‌خطی.

  </Accordion>

  <Accordion title="Pending group history injection">
    برای گروه‌ها، پیام‌های پردازش‌نشده می‌توانند بافر شوند و وقتی ربات در نهایت فعال شد، به‌عنوان زمینه تزریق شوند.

    - حد پیش‌فرض: `50`
    - پیکربندی: `channels.whatsapp.historyLimit`
    - بازگشت: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    نشانگرهای تزریق:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    رسیدهای خواندن برای پیام‌های ورودی پذیرفته‌شده WhatsApp به‌طور پیش‌فرض فعال هستند.

    غیرفعال‌سازی به‌صورت سراسری:

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

    نوبت‌های گفت‌وگوی با خود، حتی وقتی به‌صورت سراسری فعال باشند، رسید خواندن را رد می‌کنند.

  </Accordion>
</AccordionGroup>

## تحویل، قطعه‌بندی، و رسانه

<AccordionGroup>
  <Accordion title="قطعه‌بندی متن">
    - حد پیش‌فرض قطعه: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - حالت `newline` مرزهای پاراگراف را ترجیح می‌دهد (خطوط خالی)، سپس به قطعه‌بندی امن از نظر طول برمی‌گردد

  </Accordion>

  <Accordion title="رفتار رسانه خروجی">
    - از payloadهای تصویر، ویدئو، صدا (یادداشت صوتی PTT)، و سند پشتیبانی می‌کند
    - رسانه صوتی از طریق payload ‏`audio` در Baileys با `ptt: true` فرستاده می‌شود، بنابراین کلاینت‌های WhatsApp آن را به‌صورت یادداشت صوتی فشاردادن-برای-صحبت نمایش می‌دهند
    - payloadهای پاسخ، `audioAsVoice` را حفظ می‌کنند؛ خروجی یادداشت صوتی TTS برای WhatsApp حتی وقتی provider فرمت MP3 یا WebM برمی‌گرداند، روی همین مسیر PTT می‌ماند
    - صدای بومی Ogg/Opus برای سازگاری یادداشت صوتی به‌صورت `audio/ogg; codecs=opus` فرستاده می‌شود
    - صدای غیر Ogg، شامل خروجی MP3/WebM از Microsoft Edge TTS، پیش از تحویل PTT با `ffmpeg` به Ogg/Opus مونو 48 kHz تبدیل می‌شود
    - `/tts latest` آخرین پاسخ assistant را به‌صورت یک یادداشت صوتی می‌فرستد و ارسال‌های تکراری برای همان پاسخ را سرکوب می‌کند؛ `/tts chat on|off|default`، auto-TTS را برای گفت‌وگوی فعلی WhatsApp کنترل می‌کند
    - پخش GIF متحرک از طریق `gifPlayback: true` در ارسال‌های ویدئویی پشتیبانی می‌شود
    - هنگام ارسال payloadهای پاسخ چندرسانه‌ای، captionها روی نخستین مورد رسانه اعمال می‌شوند، جز اینکه یادداشت‌های صوتی PTT ابتدا صدا و سپس متن قابل مشاهده را جداگانه می‌فرستند، چون کلاینت‌های WhatsApp، captionهای یادداشت صوتی را به‌طور یکدست نمایش نمی‌دهند
    - منبع رسانه می‌تواند HTTP(S)، ‏`file://`، یا مسیرهای محلی باشد

  </Accordion>

  <Accordion title="محدودیت‌های اندازه رسانه و رفتار جایگزین">
    - سقف ذخیره رسانه ورودی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - سقف ارسال رسانه خروجی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<accountId>.mediaMaxMb` استفاده می‌کنند
    - تصاویر به‌طور خودکار بهینه‌سازی می‌شوند (تغییر اندازه/پویش کیفیت) تا در محدودیت‌ها جا شوند
    - در صورت شکست ارسال رسانه، جایگزین مورد اول به‌جای حذف بی‌صدای پاسخ، هشدار متنی می‌فرستد

  </Accordion>
</AccordionGroup>

## نقل‌قول پاسخ

WhatsApp از نقل‌قول بومی پاسخ پشتیبانی می‌کند، که در آن پاسخ‌های خروجی به‌صورت قابل مشاهده پیام ورودی را نقل می‌کنند. آن را با `channels.whatsapp.replyToMode` کنترل کنید.

| مقدار        | رفتار                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| `"off"`      | هرگز نقل نکن؛ به‌صورت پیام ساده بفرست                                 |
| `"first"`    | فقط نخستین قطعه پاسخ خروجی را نقل کن                                  |
| `"all"`      | هر قطعه پاسخ خروجی را نقل کن                                          |
| `"batched"`  | پاسخ‌های دسته‌ای صف‌شده را نقل کن، درحالی‌که پاسخ‌های فوری بدون نقل می‌مانند |

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

`channels.whatsapp.reactionLevel` کنترل می‌کند که agent تا چه اندازه گسترده از واکنش‌های ایموجی در WhatsApp استفاده کند:

| سطح          | واکنش‌های تأیید دریافت | واکنش‌های آغازشده توسط agent | توضیح                                                |
| ------------ | ---------------------- | ---------------------------- | ---------------------------------------------------- |
| `"off"`      | خیر                    | خیر                          | هیچ واکنشی وجود ندارد                                |
| `"ack"`      | بله                    | خیر                          | فقط واکنش‌های تأیید دریافت (رسید پیش از پاسخ)       |
| `"minimal"`  | بله                    | بله (محافظه‌کارانه)          | تأیید دریافت + واکنش‌های agent با راهنمایی محافظه‌کارانه |
| `"extensive"` | بله                   | بله (تشویق‌شده)              | تأیید دریافت + واکنش‌های agent با راهنمایی تشویق‌شده |

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

## واکنش‌های تأیید دریافت

WhatsApp از واکنش‌های فوری تأیید دریافت در زمان دریافت ورودی از طریق `channels.whatsapp.ackReaction` پشتیبانی می‌کند.
واکنش‌های تأیید دریافت با `reactionLevel` کنترل می‌شوند — وقتی `reactionLevel` برابر `"off"` باشد، سرکوب می‌شوند.

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

- بلافاصله پس از پذیرفته‌شدن ورودی فرستاده می‌شود (پیش از پاسخ)
- شکست‌ها ثبت می‌شوند اما تحویل معمول پاسخ را مسدود نمی‌کنند
- حالت گروه `mentions` در نوبت‌های فعال‌شده با mention واکنش می‌دهد؛ فعال‌سازی گروه `always` برای این بررسی نقش bypass دارد
- WhatsApp از `channels.whatsapp.ackReaction` استفاده می‌کند (`messages.ackReaction` قدیمی اینجا استفاده نمی‌شود)

## چندحسابی و اعتبارنامه‌ها

<AccordionGroup>
  <Accordion title="انتخاب حساب و پیش‌فرض‌ها">
    - شناسه‌های حساب از `channels.whatsapp.accounts` می‌آیند
    - انتخاب حساب پیش‌فرض: اگر `default` وجود داشته باشد، همان؛ در غیر این صورت نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده)
    - شناسه‌های حساب برای جست‌وجو به‌صورت داخلی نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="مسیرهای اعتبارنامه و سازگاری قدیمی">
    - مسیر auth فعلی: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - فایل پشتیبان: `creds.json.bak`
    - auth پیش‌فرض قدیمی در `~/.openclaw/credentials/` همچنان برای جریان‌های حساب پیش‌فرض شناسایی/مهاجرت می‌شود

  </Accordion>

  <Accordion title="رفتار خروج">
    `openclaw channels logout --channel whatsapp [--account <id>]` وضعیت auth مربوط به WhatsApp را برای آن حساب پاک می‌کند.

    وقتی یک Gateway در دسترس باشد، خروج ابتدا listener زنده WhatsApp را برای حساب انتخاب‌شده متوقف می‌کند تا session پیوندشده تا راه‌اندازی مجدد بعدی به دریافت پیام ادامه ندهد. `openclaw channels remove --channel whatsapp` نیز پیش از غیرفعال‌سازی یا حذف پیکربندی حساب، listener زنده را متوقف می‌کند.

    در دایرکتوری‌های auth قدیمی، `oauth.json` حفظ می‌شود درحالی‌که فایل‌های auth مربوط به Baileys حذف می‌شوند.

  </Accordion>
</AccordionGroup>

## ابزارها، اقدام‌ها، و نوشتن پیکربندی

- پشتیبانی ابزار agent شامل اقدام واکنش WhatsApp ‏(`react`) است.
- دروازه‌های اقدام:
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

    حساب‌های کم‌فعالیت می‌توانند فراتر از timeout معمول پیام متصل بمانند؛ watchdog
    وقتی فعالیت انتقال WhatsApp Web متوقف شود، socket بسته شود، یا
    فعالیت سطح برنامه فراتر از پنجره ایمنی طولانی‌تر ساکت بماند، دوباره راه‌اندازی می‌شود.

    اگر logها `status=408 Request Time-out Connection was lost` تکراری نشان می‌دهند،
    زمان‌بندی‌های socket مربوط به Baileys را زیر `web.whatsapp` تنظیم کنید. با کوتاه‌کردن
    `keepAliveIntervalMs` به کمتر از timeout بیکاری شبکه‌تان و افزایش
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
    `openclaw gateway status` و `openclaw channels status --probe` نشان می‌دهند که
    gateway و WhatsApp سالم هستند، `openclaw doctor` را اجرا کنید. در Linux، doctor
    درباره ورودی‌های crontab قدیمی که هنوز
    `~/.openclaw/bin/ensure-whatsapp.sh` را فراخوانی می‌کنند هشدار می‌دهد؛ آن ورودی‌های قدیمی را با
    `crontab -e` حذف کنید، چون cron ممکن است محیط systemd user-bus را نداشته باشد و
    باعث شود آن اسکریپت قدیمی سلامت gateway را اشتباه گزارش کند.

    در صورت نیاز، با `channels login` دوباره پیوند دهید.

  </Accordion>

  <Accordion title="ورود QR پشت proxy منقضی می‌شود">
    نشانه: `openclaw channels login --channel whatsapp` پیش از نشان‌دادن یک کد QR قابل استفاده با `status=408 Request Time-out` یا قطع socket مربوط به TLS شکست می‌خورد.

    ورود WhatsApp Web از محیط proxy استاندارد میزبان gateway استفاده می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، گونه‌های حروف کوچک، و `NO_PROXY`). بررسی کنید فرایند gateway محیط proxy را به ارث می‌برد و `NO_PROXY` با `mmg.whatsapp.net` مطابقت ندارد.

  </Accordion>

  <Accordion title="هنگام ارسال listener فعالی وجود ندارد">
    وقتی هیچ listener فعال gateway برای حساب هدف وجود نداشته باشد، ارسال‌های خروجی سریع شکست می‌خورند.

    مطمئن شوید gateway در حال اجرا است و حساب پیوند شده است.

  </Accordion>

  <Accordion title="پاسخ در transcript ظاهر می‌شود اما در WhatsApp نه">
    ردیف‌های transcript آنچه agent تولید کرده است را ثبت می‌کنند. تحویل WhatsApp جداگانه بررسی می‌شود: OpenClaw فقط پس از اینکه Baileys برای دست‌کم یک ارسال متن قابل مشاهده یا رسانه، شناسه پیام خروجی برگرداند، یک auto-reply را ارسال‌شده تلقی می‌کند.

    واکنش‌های تأیید دریافت، رسیدهای مستقل پیش از پاسخ هستند. واکنش موفق ثابت نمی‌کند که پاسخ متنی یا رسانه‌ای بعدی توسط WhatsApp پذیرفته شده است.

    logهای gateway را برای `auto-reply delivery failed` یا `auto-reply was not accepted by WhatsApp provider` بررسی کنید.

  </Accordion>

  <Accordion title="پیام‌های گروه به‌طور غیرمنتظره نادیده گرفته می‌شوند">
    به این ترتیب بررسی کنید:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - ورودی‌های allowlist در `groups`
    - gating مربوط به mention ‏(`requireMention` + الگوهای mention)
    - کلیدهای تکراری در `openclaw.json` (JSON5): ورودی‌های بعدی ورودی‌های قبلی را بازنویسی می‌کنند، بنابراین برای هر scope فقط یک `groupPolicy` نگه دارید

  </Accordion>

  <Accordion title="هشدار runtime مربوط به Bun">
    runtime مربوط به gateway در WhatsApp باید از Node استفاده کند. Bun برای عملیات پایدار gateway مربوط به WhatsApp/Telegram ناسازگار علامت‌گذاری شده است.
  </Accordion>
</AccordionGroup>

## promptهای سیستم

WhatsApp از promptهای سیستم به سبک Telegram برای گروه‌ها و گفت‌وگوهای مستقیم از طریق mapهای `groups` و `direct` پشتیبانی می‌کند.

سلسله‌مراتب resolution برای پیام‌های گروه:

map مؤثر `groups` ابتدا تعیین می‌شود: اگر حساب، `groups` خودش را تعریف کند، کاملاً جایگزین map ریشه `groups` می‌شود (بدون deep merge). سپس جست‌وجوی prompt روی همان map واحد حاصل اجرا می‌شود:

1. **prompt سیستم مخصوص گروه** (`groups["<groupId>"].systemPrompt`): وقتی ورودی گروه مشخص در map وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد، استفاده می‌شود. اگر `systemPrompt` رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ prompt سیستمی اعمال نمی‌شود.
2. **prompt سیستم wildcard گروه** (`groups["*"].systemPrompt`): وقتی ورودی گروه مشخص کاملاً از map غایب باشد، یا وقتی وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند، استفاده می‌شود.

سلسله‌مراتب resolution برای پیام‌های مستقیم:

map مؤثر `direct` ابتدا تعیین می‌شود: اگر حساب، `direct` خودش را تعریف کند، کاملاً جایگزین map ریشه `direct` می‌شود (بدون deep merge). سپس جست‌وجوی prompt روی همان map واحد حاصل اجرا می‌شود:

1. **prompt سیستم مخصوص مستقیم** (`direct["<peerId>"].systemPrompt`): وقتی ورودی peer مشخص در map وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد، استفاده می‌شود. اگر `systemPrompt` رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ prompt سیستمی اعمال نمی‌شود.
2. **prompt سیستم wildcard مستقیم** (`direct["*"].systemPrompt`): وقتی ورودی peer مشخص کاملاً از map غایب باشد، یا وقتی وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند، استفاده می‌شود.

<Note>
`dms` همچنان bucket سبک بازنویسی history برای هر DM است (`dms.<id>.historyLimit`). بازنویسی‌های prompt زیر `direct` قرار دارند.
</Note>

**تفاوت با رفتار چندحسابی Telegram:** در Telegram، `groups` ریشه در پیکربندی چندحسابی عمداً برای همه حساب‌ها سرکوب می‌شود، حتی حساب‌هایی که `groups` اختصاصی خود را تعریف نکرده‌اند، تا از دریافت پیام‌های گروه‌هایی که ربات عضو آن‌ها نیست جلوگیری شود. WhatsApp این محافظ را اعمال نمی‌کند: `groups` ریشه و `direct` ریشه همیشه توسط حساب‌هایی که بازنویسی سطح حساب تعریف نکرده‌اند به ارث برده می‌شوند، فارغ از اینکه چند حساب پیکربندی شده باشد. در پیکربندی چندحسابی WhatsApp، اگر پرامپت‌های گروهی یا مستقیم جداگانه برای هر حساب می‌خواهید، به‌جای تکیه بر پیش‌فرض‌های سطح ریشه، نقشه کامل را صراحتاً زیر هر حساب تعریف کنید.

رفتار مهم:

- `channels.whatsapp.groups` هم نقشه پیکربندی برای هر گروه است و هم فهرست مجاز گروه‌ها در سطح چت. در دامنه ریشه یا حساب، `groups["*"]` یعنی «همه گروه‌ها برای آن دامنه پذیرفته می‌شوند».
- فقط زمانی `systemPrompt` گروه wildcard را اضافه کنید که از قبل می‌خواهید آن دامنه همه گروه‌ها را بپذیرد. اگر همچنان می‌خواهید فقط مجموعه ثابتی از شناسه‌های گروه واجد شرایط باشند، از `groups["*"]` برای پیش‌فرض پرامپت استفاده نکنید. در عوض، پرامپت را روی هر ورودی گروهی که صراحتاً در فهرست مجاز است تکرار کنید.
- پذیرش گروه و احراز مجوز فرستنده دو بررسی جداگانه‌اند. `groups["*"]` مجموعه گروه‌هایی را که می‌توانند به پردازش گروهی برسند گسترش می‌دهد، اما به‌تنهایی همه فرستندگان در آن گروه‌ها را مجاز نمی‌کند. دسترسی فرستنده همچنان جداگانه با `channels.whatsapp.groupPolicy` و `channels.whatsapp.groupAllowFrom` کنترل می‌شود.
- `channels.whatsapp.direct` همین اثر جانبی را برای DMها ندارد. `direct["*"]` فقط پس از آنکه یک DM از طریق `dmPolicy` به‌همراه `allowFrom` یا قواعد pairing-store پذیرفته شد، پیکربندی پیش‌فرض چت مستقیم را فراهم می‌کند.

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
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
- [عیب‌یابی](/fa/channels/troubleshooting)

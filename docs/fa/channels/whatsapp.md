---
read_when:
    - کار روی رفتار کانال WhatsApp/وب یا مسیریابی صندوق ورودی
summary: پشتیبانی از کانال WhatsApp، کنترل‌های دسترسی، رفتار تحویل و عملیات
title: WhatsApp
x-i18n:
    generated_at: "2026-04-29T22:30:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5acfebb37e16c4a3602ead7c9a4f2e16315d07612dc1e929f30fb7b1bc37761
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: آمادهٔ تولید از طریق WhatsApp Web (Baileys). Gateway مالک نشست‌های پیوندشده است.

## نصب (در صورت نیاز)

- راه‌اندازی اولیه (`openclaw onboard`) و `openclaw channels add --channel whatsapp`
  هنگام نخستین انتخاب WhatsApp plugin، نصب آن را پیشنهاد می‌کنند.
- `openclaw channels login --channel whatsapp` نیز وقتی
  plugin هنوز موجود نباشد، جریان نصب را ارائه می‌کند.
- کانال توسعه + checkout گیت: به‌طور پیش‌فرض از مسیر plugin محلی استفاده می‌کند.
- پایدار/بتا: وقتی یک بستهٔ فعلی
  منتشر شده باشد، از بستهٔ npm با نام `@openclaw/whatsapp` استفاده می‌کند.

نصب دستی همچنان در دسترس است:

```bash
openclaw plugins install @openclaw/whatsapp
```

اگر npm بستهٔ متعلق به OpenClaw را منسوخ یا ناموجود گزارش کرد، تا زمانی که قطار بستهٔ npm
به‌روز شود، از یک build بسته‌بندی‌شدهٔ فعلی OpenClaw یا یک checkout محلی استفاده کنید.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض DM برای فرستندگان ناشناس، pairing است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های بین‌کانالی و playbookهای تعمیر.
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

    برای اتصال یک دایرکتوری احراز هویت موجود/سفارشی WhatsApp Web پیش از ورود:

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

  <Step title="تأیید نخستین درخواست pairing (اگر از حالت pairing استفاده می‌کنید)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    درخواست‌های pairing پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار برای هر کانال به ۳ عدد محدود می‌شوند.

  </Step>
</Steps>

<Note>
OpenClaw توصیه می‌کند در صورت امکان WhatsApp را روی یک شمارهٔ جداگانه اجرا کنید. (فرادادهٔ کانال و جریان راه‌اندازی برای این تنظیم بهینه شده‌اند، اما تنظیمات با شمارهٔ شخصی نیز پشتیبانی می‌شوند.)
</Note>

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="شمارهٔ اختصاصی (توصیه‌شده)">
    این تمیزترین حالت عملیاتی است:

    - هویت جداگانهٔ WhatsApp برای OpenClaw
    - allowlistهای DM و مرزهای مسیریابی روشن‌تر
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
    راه‌اندازی اولیه از حالت شمارهٔ شخصی پشتیبانی می‌کند و یک خط مبنای مناسب برای چت با خود می‌نویسد:

    - `dmPolicy: "allowlist"`
    - `allowFrom` شامل شمارهٔ شخصی شما می‌شود
    - `selfChatMode: true`

    در زمان اجرا، محافظت‌های چت با خود بر اساس شمارهٔ خودِ پیوندشده و `allowFrom` عمل می‌کنند.

  </Accordion>

  <Accordion title="دامنهٔ کانال فقط WhatsApp Web">
    کانال پلتفرم پیام‌رسانی در معماری فعلی کانال OpenClaw مبتنی بر WhatsApp Web (`Baileys`) است.

    در رجیستری داخلی کانال‌های چت، کانال پیام‌رسانی جداگانه‌ای برای Twilio WhatsApp وجود ندارد.

  </Accordion>
</AccordionGroup>

## مدل زمان اجرا

- Gateway مالک سوکت WhatsApp و حلقهٔ اتصال مجدد است.
- نگهبان اتصال مجدد از فعالیت انتقال WhatsApp Web استفاده می‌کند، نه فقط حجم پیام‌های ورودی برنامه؛ بنابراین یک نشست دستگاه پیوندشدهٔ کم‌صدا صرفاً به این دلیل که اخیراً کسی پیام نفرستاده است، بازراه‌اندازی نمی‌شود. یک سقف طولانی‌تر برای سکوت برنامه همچنان اگر فریم‌های انتقال پیوسته برسند اما در پنجرهٔ نگهبان هیچ پیام برنامه‌ای پردازش نشود، اتصال مجدد را اجبار می‌کند؛ پس از اتصال مجدد گذرا برای نشستی که اخیراً فعال بوده، آن بررسی سکوت برنامه برای نخستین پنجرهٔ بازیابی از timeout عادی پیام استفاده می‌کند.
- زمان‌بندی‌های سوکت Baileys به‌صراحت زیر `web.whatsapp.*` قرار دارند: `keepAliveIntervalMs` پینگ‌های برنامهٔ WhatsApp Web را کنترل می‌کند، `connectTimeoutMs` timeout دست‌دهی آغازین را کنترل می‌کند، و `defaultQueryTimeoutMs` timeoutهای پرس‌وجوی Baileys را کنترل می‌کند.
- ارسال‌های خروجی به یک شنوندهٔ فعال WhatsApp برای حساب هدف نیاز دارند.
- چت‌های وضعیت و پخش نادیده گرفته می‌شوند (`@status`، `@broadcast`).
- نگهبان اتصال مجدد فعالیت انتقال WhatsApp Web را دنبال می‌کند، نه فقط حجم پیام‌های ورودی برنامه: نشست‌های دستگاه پیوندشدهٔ کم‌صدا تا زمانی که فریم‌های انتقال ادامه دارند بالا می‌مانند، اما توقف انتقال خیلی پیش از مسیر قطع اتصال دوردست بعدی، اتصال مجدد را اجبار می‌کند.
- چت‌های مستقیم از قواعد نشست DM استفاده می‌کنند (`session.dmScope`؛ مقدار پیش‌فرض `main`، DMها را به نشست اصلی عامل جمع می‌کند).
- نشست‌های گروهی ایزوله هستند (`agent:<agentId>:whatsapp:group:<jid>`).
- انتقال WhatsApp Web متغیرهای محیطی استاندارد proxy را روی میزبان Gateway رعایت می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، `NO_PROXY` / گونه‌های کوچک‌حرف). پیکربندی proxy در سطح میزبان را بر تنظیمات proxy اختصاصی کانال WhatsApp ترجیح دهید.
- وقتی `messages.removeAckAfterReply` فعال باشد، OpenClaw پس از تحویل یک پاسخ قابل‌مشاهده، واکنش تأیید WhatsApp را پاک می‌کند.

## hookهای Plugin و حریم خصوصی

پیام‌های ورودی WhatsApp می‌توانند شامل محتوای پیام شخصی، شماره تلفن‌ها،
شناسه‌های گروه، نام فرستنده‌ها، و فیلدهای همبستگی نشست باشند. به همین دلیل،
WhatsApp محموله‌های hook ورودی `message_received` را برای pluginها پخش نمی‌کند
مگر اینکه صراحتاً آن را فعال کنید:

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

می‌توانید فعال‌سازی را به یک حساب محدود کنید:

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

این را فقط برای pluginهایی فعال کنید که به دریافت محتوای پیام ورودی WhatsApp
و شناسه‌ها اعتماد دارید.

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست DM">
    `channels.whatsapp.dmPolicy` دسترسی چت مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند این است که `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `allowFrom` شماره‌های سبک E.164 را می‌پذیرد (در داخل نرمال‌سازی می‌شوند).

    بازنویسی چندحسابی: `channels.whatsapp.accounts.<id>.dmPolicy` (و `allowFrom`) برای آن حساب بر پیش‌فرض‌های سطح کانال اولویت دارند.

    جزئیات رفتار زمان اجرا:

    - pairingها در allow-store کانال پایدار می‌شوند و با `allowFrom` پیکربندی‌شده ادغام می‌شوند
    - اگر هیچ allowlist پیکربندی نشده باشد، شمارهٔ خودِ پیوندشده به‌طور پیش‌فرض مجاز است
    - OpenClaw هرگز DMهای خروجی `fromMe` را خودکار pairing نمی‌کند (پیام‌هایی که از دستگاه پیوندشده به خودتان می‌فرستید)

  </Tab>

  <Tab title="سیاست گروه + allowlistها">
    دسترسی گروه دو لایه دارد:

    1. **allowlist عضویت گروه** (`channels.whatsapp.groups`)
       - اگر `groups` حذف شده باشد، همهٔ گروه‌ها واجد شرایط‌اند
       - اگر `groups` وجود داشته باشد، به‌عنوان allowlist گروه عمل می‌کند (`"*"` مجاز است)

    2. **سیاست فرستندهٔ گروه** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist فرستنده دور زده می‌شود
       - `allowlist`: فرستنده باید با `groupAllowFrom` (یا `*`) مطابقت داشته باشد
       - `disabled`: همهٔ ورودی‌های گروه را مسدود می‌کند

    جایگزین allowlist فرستنده:

    - اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا در صورت موجود بودن به `allowFrom` برمی‌گردد
    - allowlistهای فرستنده پیش از فعال‌سازی با mention/reply ارزیابی می‌شوند

    نکته: اگر اصلاً هیچ بلوک `channels.whatsapp` وجود نداشته باشد، fallback سیاست گروه در زمان اجرا `allowlist` است (با لاگ هشدار)، حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد.

  </Tab>

  <Tab title="Mentionها + /activation">
    پاسخ‌های گروهی به‌طور پیش‌فرض به mention نیاز دارند.

    تشخیص mention شامل موارد زیر است:

    - mentionهای صریح WhatsApp از هویت ربات
    - الگوهای regex پیکربندی‌شدهٔ mention (`agents.list[].groupChat.mentionPatterns`، fallback با `messages.groupChat.mentionPatterns`)
    - transcriptهای voice-note ورودی برای پیام‌های گروهی مجاز
    - تشخیص ضمنی reply-to-bot (فرستندهٔ پاسخ با هویت ربات مطابقت دارد)

    نکتهٔ امنیتی:

    - quote/reply فقط gate مربوط به mention را ارضا می‌کند؛ **مجوز فرستنده اعطا نمی‌کند**
    - با `groupPolicy: "allowlist"`، فرستندگان خارج از allowlist همچنان مسدود می‌شوند، حتی اگر به پیام یک کاربر allowlist‌شده پاسخ دهند

    فرمان فعال‌سازی در سطح نشست:

    - `/activation mention`
    - `/activation always`

    `activation` وضعیت نشست را به‌روزرسانی می‌کند (نه پیکربندی سراسری). این کار با مالک محدود شده است.

  </Tab>
</Tabs>

## رفتار شمارهٔ شخصی و چت با خود

وقتی شمارهٔ خودِ پیوندشده در `allowFrom` نیز وجود داشته باشد، محافظت‌های چت با خود WhatsApp فعال می‌شوند:

- صرف‌نظر از رسیدهای خواندن برای نوبت‌های چت با خود
- نادیده گرفتن رفتار auto-trigger برای mention-JID که در غیر این صورت خودتان را ping می‌کرد
- اگر `messages.responsePrefix` تنظیم نشده باشد، پاسخ‌های چت با خود به‌طور پیش‌فرض `[{identity.name}]` یا `[openclaw]` هستند

## نرمال‌سازی پیام و زمینه

<AccordionGroup>
  <Accordion title="پاکت ورودی + زمینهٔ پاسخ">
    پیام‌های ورودی WhatsApp در پاکت ورودی مشترک پیچیده می‌شوند.

    اگر پاسخ نقل‌شده‌ای وجود داشته باشد، زمینه با این شکل افزوده می‌شود:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    فیلدهای فرادادهٔ پاسخ نیز در صورت موجود بودن پر می‌شوند (`ReplyToId`، `ReplyToBody`، `ReplyToSender`، JID/E.164 فرستنده).

  </Accordion>

  <Accordion title="placeholderهای رسانه و استخراج مکان/مخاطب">
    پیام‌های ورودی فقط‌رسانه با placeholderهایی مانند موارد زیر نرمال‌سازی می‌شوند:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    voice noteهای گروهی مجاز، وقتی بدنه فقط `<media:audio>` باشد، پیش از gate مربوط به mention رونویسی می‌شوند؛ بنابراین گفتن mention ربات در voice note می‌تواند
    پاسخ را فعال کند. اگر transcript همچنان ربات را mention نکند،
    transcript به‌جای placeholder خام در تاریخچهٔ گروه در انتظار نگه داشته می‌شود.

    بدنه‌های مکان از متن کوتاه مختصات استفاده می‌کنند. برچسب‌ها/نظرهای مکان و جزئیات contact/vCard به‌صورت فرادادهٔ غیرقابل‌اعتماد fenced نمایش داده می‌شوند، نه متن inline prompt.

  </Accordion>

  <Accordion title="تزریق تاریخچهٔ گروه در انتظار">
    برای گروه‌ها، پیام‌های پردازش‌نشده می‌توانند بافر شوند و وقتی ربات سرانجام فعال شد، به‌عنوان زمینه تزریق شوند.

    - حد پیش‌فرض: `50`
    - پیکربندی: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    نشانگرهای تزریق:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="رسیدهای خواندن">
    رسیدهای خواندن به‌طور پیش‌فرض برای پیام‌های ورودی پذیرفته‌شدهٔ WhatsApp فعال هستند.

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

    نوبت‌های چت با خود حتی وقتی به‌صورت سراسری فعال باشد، رسیدهای خواندن را رد می‌کنند.

  </Accordion>
</AccordionGroup>

## تحویل، بخش‌بندی، و رسانه

<AccordionGroup>
  <Accordion title="بخش‌بندی متن">
    - حد پیش‌فرض بخش: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - حالت `newline` مرزهای پاراگراف (خطوط خالی) را ترجیح می‌دهد، سپس به بخش‌بندی امن از نظر طول fallback می‌کند

  </Accordion>

  <Accordion title="رفتار رسانه خروجی">
    - از payloadهای تصویر، ویدئو، صدا (یادداشت صوتی PTT) و سند پشتیبانی می‌کند
    - رسانه صوتی از طریق payload ‏`audio` در Baileys با `ptt: true` ارسال می‌شود، بنابراین کلاینت‌های WhatsApp آن را به‌صورت یادداشت صوتی push-to-talk نمایش می‌دهند
    - payloadهای پاسخ، `audioAsVoice` را حفظ می‌کنند؛ خروجی یادداشت صوتی TTS برای WhatsApp حتی وقتی ارائه‌دهنده MP3 یا WebM برمی‌گرداند، روی همین مسیر PTT می‌ماند
    - صدای بومی Ogg/Opus برای سازگاری یادداشت صوتی به‌صورت `audio/ogg; codecs=opus` ارسال می‌شود
    - صدای غیر Ogg، از جمله خروجی MP3/WebM مربوط به Microsoft Edge TTS، پیش از تحویل PTT با `ffmpeg` به Ogg/Opus مونو 48 کیلوهرتز تبدیل می‌شود
    - `/tts latest` آخرین پاسخ دستیار را به‌صورت یک یادداشت صوتی ارسال می‌کند و ارسال‌های تکراری برای همان پاسخ را متوقف می‌کند؛ `/tts chat on|off|default` ‏auto-TTS را برای چت فعلی WhatsApp کنترل می‌کند
    - پخش GIF متحرک از طریق `gifPlayback: true` در ارسال‌های ویدئویی پشتیبانی می‌شود
    - هنگام ارسال payloadهای پاسخ چندرسانه‌ای، کپشن‌ها روی اولین مورد رسانه اعمال می‌شوند، به‌جز یادداشت‌های صوتی PTT که صدا را ابتدا و متن قابل مشاهده را جداگانه ارسال می‌کنند، چون کلاینت‌های WhatsApp کپشن‌های یادداشت صوتی را به‌طور یکنواخت نمایش نمی‌دهند
    - منبع رسانه می‌تواند HTTP(S)، ‏`file://`، یا مسیرهای محلی باشد

  </Accordion>

  <Accordion title="محدودیت‌های اندازه رسانه و رفتار fallback">
    - سقف ذخیره رسانه ورودی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - سقف ارسال رسانه خروجی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<accountId>.mediaMaxMb` استفاده می‌کنند
    - تصاویر به‌طور خودکار بهینه‌سازی می‌شوند (تغییر اندازه/پیمایش کیفیت) تا در محدودیت‌ها جا بگیرند
    - هنگام شکست ارسال رسانه، fallback مورد اول به‌جای حذف بی‌صدای پاسخ، هشدار متنی ارسال می‌کند

  </Accordion>
</AccordionGroup>

## نمایانی خطا

`channels.whatsapp.exposeErrorText` کنترل می‌کند که آیا متن خطای عامل/ارائه‌دهنده دوباره به WhatsApp تحویل داده شود یا نه. پیش‌فرض `true` است. آن را روی `false` تنظیم کنید تا شکست‌ها در WhatsApp بی‌صدا بمانند و رفتار کانال‌های دیگر حفظ شود.

```json5
{
  channels: {
    whatsapp: {
      exposeErrorText: false,
    },
  },
}
```

بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<id>.exposeErrorText` استفاده می‌کنند.

## نقل‌قول پاسخ

WhatsApp از نقل‌قول بومی پاسخ پشتیبانی می‌کند، که در آن پاسخ‌های خروجی به‌صورت قابل مشاهده پیام ورودی را نقل‌قول می‌کنند. آن را با `channels.whatsapp.replyToMode` کنترل کنید.

| مقدار       | رفتار                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | هرگز نقل‌قول نکن؛ به‌صورت پیام ساده ارسال کن                                  |
| `"first"`   | فقط اولین قطعه پاسخ خروجی را نقل‌قول کن                             |
| `"all"`     | همه قطعه‌های پاسخ خروجی را نقل‌قول کن                                      |
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

`channels.whatsapp.reactionLevel` کنترل می‌کند عامل تا چه حد از واکنش‌های ایموجی در WhatsApp استفاده کند:

| سطح         | واکنش‌های ack | واکنش‌های آغازشده توسط عامل | توضیح                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | خیر            | خیر                        | هیچ واکنشی وجود ندارد                              |
| `"ack"`       | بله           | خیر                        | فقط واکنش‌های ack (رسید پیش از پاسخ)           |
| `"minimal"`   | بله           | بله (محافظه‌کارانه)        | ack + واکنش‌های عامل با راهنمایی محافظه‌کارانه |
| `"extensive"` | بله           | بله (تشویق‌شده)          | ack + واکنش‌های عامل با راهنمایی تشویق‌شده   |

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

WhatsApp از واکنش‌های ack فوری روی دریافت ورودی از طریق `channels.whatsapp.ackReaction` پشتیبانی می‌کند.
واکنش‌های ack توسط `reactionLevel` کنترل می‌شوند — وقتی `reactionLevel` برابر `"off"` باشد، سرکوب می‌شوند.

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

- بلافاصله پس از پذیرش ورودی ارسال می‌شود (پیش از پاسخ)
- شکست‌ها ثبت می‌شوند اما تحویل عادی پاسخ را مسدود نمی‌کنند
- حالت گروه `mentions` در نوبت‌های فعال‌شده با mention واکنش نشان می‌دهد؛ فعال‌سازی گروه `always` به‌عنوان bypass برای این بررسی عمل می‌کند
- WhatsApp از `channels.whatsapp.ackReaction` استفاده می‌کند (`messages.ackReaction` قدیمی اینجا استفاده نمی‌شود)

## چندحسابی و credentials

<AccordionGroup>
  <Accordion title="انتخاب حساب و پیش‌فرض‌ها">
    - شناسه‌های حساب از `channels.whatsapp.accounts` می‌آیند
    - انتخاب حساب پیش‌فرض: اگر `default` حاضر باشد همان، در غیر این صورت اولین شناسه حساب پیکربندی‌شده (مرتب‌شده)
    - شناسه‌های حساب برای lookup به‌صورت داخلی نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="مسیرهای credential و سازگاری قدیمی">
    - مسیر auth فعلی: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - فایل پشتیبان: `creds.json.bak`
    - auth پیش‌فرض قدیمی در `~/.openclaw/credentials/` همچنان برای جریان‌های حساب پیش‌فرض شناسایی/مهاجرت داده می‌شود

  </Accordion>

  <Accordion title="رفتار خروج از حساب">
    `openclaw channels logout --channel whatsapp [--account <id>]` وضعیت auth مربوط به WhatsApp را برای آن حساب پاک می‌کند.

    در دایرکتوری‌های auth قدیمی، `oauth.json` حفظ می‌شود و فایل‌های auth مربوط به Baileys حذف می‌شوند.

  </Accordion>
</AccordionGroup>

## ابزارها، actionها و نوشتن config

- پشتیبانی ابزار عامل شامل action واکنش WhatsApp (`react`) است.
- گیت‌های action:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- نوشتن config آغازشده توسط کانال به‌صورت پیش‌فرض فعال است (غیرفعال‌سازی از طریق `channels.whatsapp.configWrites=false`).

## عیب‌یابی

<AccordionGroup>
  <Accordion title="لینک نشده (QR لازم است)">
    نشانه: وضعیت کانال گزارش می‌دهد که لینک نشده است.

    رفع:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="لینک شده اما قطع است / چرخه اتصال مجدد">
    نشانه: حساب لینک‌شده با قطع‌های تکراری یا تلاش‌های اتصال مجدد.

    حساب‌های کم‌فعالیت می‌توانند پس از timeout عادی پیام متصل بمانند؛ watchdog
    وقتی فعالیت انتقال WhatsApp Web متوقف شود، socket بسته شود، یا
    فعالیت سطح برنامه فراتر از پنجره ایمنی طولانی‌تر ساکت بماند، restart می‌کند.

    اگر logها `status=408 Request Time-out Connection was lost` تکراری نشان می‌دهند، زمان‌بندی‌های socket مربوط به
    Baileys را زیر `web.whatsapp` تنظیم کنید. با کوتاه کردن
    `keepAliveIntervalMs` به کمتر از timeout بیکاری شبکه خود و افزایش
    `connectTimeoutMs` روی لینک‌های کند یا پراتلاف شروع کنید:

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

    در صورت نیاز، با `channels login` دوباره لینک کنید.

  </Accordion>

  <Accordion title="ورود QR پشت proxy به timeout می‌خورد">
    نشانه: `openclaw channels login --channel whatsapp` پیش از نمایش یک QR code قابل استفاده با `status=408 Request Time-out` یا قطع TLS socket شکست می‌خورد.

    ورود WhatsApp Web از محیط proxy استاندارد میزبان Gateway استفاده می‌کند (`HTTPS_PROXY`، ‏`HTTP_PROXY`، گونه‌های lowercase و `NO_PROXY`). بررسی کنید فرایند gateway محیط proxy را به ارث می‌برد و `NO_PROXY` با `mmg.whatsapp.net` مطابقت ندارد.

  </Accordion>

  <Accordion title="هنگام ارسال listener فعالی وجود ندارد">
    وقتی هیچ listener فعال Gateway برای حساب هدف وجود نداشته باشد، ارسال‌های خروجی سریع شکست می‌خورند.

    مطمئن شوید gateway در حال اجرا است و حساب لینک شده است.

  </Accordion>

  <Accordion title="پیام‌های گروهی به‌طور غیرمنتظره نادیده گرفته می‌شوند">
    به این ترتیب بررسی کنید:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - ورودی‌های allowlist در `groups`
    - گیت mention (`requireMention` + الگوهای mention)
    - کلیدهای تکراری در `openclaw.json` (JSON5): ورودی‌های بعدی ورودی‌های قبلی را override می‌کنند، بنابراین در هر scope فقط یک `groupPolicy` نگه دارید

  </Accordion>

  <Accordion title="هشدار runtime مربوط به Bun">
    runtime مربوط به gateway WhatsApp باید از Node استفاده کند. Bun برای عملیات پایدار gateway مربوط به WhatsApp/Telegram ناسازگار علامت‌گذاری شده است.
  </Accordion>
</AccordionGroup>

## پرامپت‌های سیستمی

WhatsApp از پرامپت‌های سیستمی شبیه Telegram برای گروه‌ها و چت‌های مستقیم از طریق mapهای `groups` و `direct` پشتیبانی می‌کند.

سلسله‌مراتب resolve برای پیام‌های گروه:

map مؤثر `groups` ابتدا تعیین می‌شود: اگر حساب `groups` خودش را تعریف کند، به‌طور کامل جایگزین map ریشه `groups` می‌شود (بدون deep merge). سپس lookup پرامپت روی همان map واحد حاصل اجرا می‌شود:

1. **پرامپت سیستمی مخصوص گروه** (`groups["<groupId>"].systemPrompt`): وقتی استفاده می‌شود که ورودی گروه مشخص در map وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. اگر `systemPrompt` رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ پرامپت سیستمی اعمال نمی‌شود.
2. **پرامپت سیستمی wildcard گروه** (`groups["*"].systemPrompt`): وقتی استفاده می‌شود که ورودی گروه مشخص به‌طور کامل از map غایب باشد، یا وقتی وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند.

سلسله‌مراتب resolve برای پیام‌های مستقیم:

map مؤثر `direct` ابتدا تعیین می‌شود: اگر حساب `direct` خودش را تعریف کند، به‌طور کامل جایگزین map ریشه `direct` می‌شود (بدون deep merge). سپس lookup پرامپت روی همان map واحد حاصل اجرا می‌شود:

1. **پرامپت سیستمی مخصوص direct** (`direct["<peerId>"].systemPrompt`): وقتی استفاده می‌شود که ورودی peer مشخص در map وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. اگر `systemPrompt` رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ پرامپت سیستمی اعمال نمی‌شود.
2. **پرامپت سیستمی wildcard مستقیم** (`direct["*"].systemPrompt`): وقتی استفاده می‌شود که ورودی peer مشخص به‌طور کامل از map غایب باشد، یا وقتی وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند.

<Note>
`dms` همچنان bucket سبک بازنویسی تاریخچه برای هر DM است (`dms.<id>.historyLimit`). بازنویسی‌های پرامپت زیر `direct` قرار دارند.
</Note>

**تفاوت با رفتار چندحسابی Telegram:** در Telegram، `groups` ریشه عمداً برای همه حساب‌ها در یک راه‌اندازی چندحسابی سرکوب می‌شود — حتی حساب‌هایی که `groups` مخصوص خودشان را تعریف نکرده‌اند — تا از دریافت پیام‌های گروه‌هایی که bot عضو آن‌ها نیست جلوگیری شود. WhatsApp این guard را اعمال نمی‌کند: `groups` ریشه و `direct` ریشه همیشه توسط حساب‌هایی که هیچ override سطح حساب تعریف نکرده‌اند به ارث برده می‌شوند، صرف‌نظر از اینکه چند حساب پیکربندی شده باشد. در یک راه‌اندازی چندحسابی WhatsApp، اگر پرامپت‌های گروهی یا مستقیم برای هر حساب می‌خواهید، به‌جای تکیه بر پیش‌فرض‌های سطح ریشه، map کامل را به‌صورت صریح زیر هر حساب تعریف کنید.

رفتار مهم:

- `channels.whatsapp.groups` هم یک map پیکربندی برای هر گروه است و هم allowlist گروه در سطح چت. در scope ریشه یا حساب، `groups["*"]` یعنی «همه گروه‌ها پذیرفته می‌شوند» برای آن scope.
- فقط زمانی یک `systemPrompt` گروه wildcard اضافه کنید که از قبل می‌خواهید آن scope همه گروه‌ها را بپذیرد. اگر همچنان می‌خواهید فقط مجموعه ثابتی از IDهای گروه واجد شرایط باشند، از `groups["*"]` برای پیش‌فرض پرامپت استفاده نکنید. به‌جای آن، پرامپت را روی هر ورودی گروهی که صریحاً allowlist شده تکرار کنید.
- پذیرش گروه و مجوز فرستنده بررسی‌های جداگانه‌ای هستند. `groups["*"]` مجموعه گروه‌هایی را که می‌توانند به رسیدگی گروه برسند گسترش می‌دهد، اما به‌تنهایی همه فرستنده‌ها در آن گروه‌ها را مجاز نمی‌کند. دسترسی فرستنده همچنان جداگانه توسط `channels.whatsapp.groupPolicy` و `channels.whatsapp.groupAllowFrom` کنترل می‌شود.
- `channels.whatsapp.direct` برای DMها همان اثر جانبی را ندارد. `direct["*"]` فقط پس از اینکه یک DM از طریق `dmPolicy` به‌علاوه `allowFrom` یا قواعد pairing-store پذیرفته شد، یک config پیش‌فرض برای چت مستقیم فراهم می‌کند.

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

فیلدهای کلیدی WhatsApp:

- دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- تحویل: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`, `exposeErrorText`
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

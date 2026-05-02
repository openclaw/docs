---
read_when:
    - کار روی رفتار کانال WhatsApp/وب یا مسیریابی صندوق ورودی
summary: پشتیبانی از کانال WhatsApp، کنترل‌های دسترسی، رفتار تحویل و عملیات
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T22:16:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: آمادهٔ تولید از طریق WhatsApp Web (Baileys). Gateway مالک نشست(های) پیوندشده است.

## نصب (در صورت نیاز)

- راه‌اندازی اولیه (`openclaw onboard`) و `openclaw channels add --channel whatsapp`
  هنگام نخستین انتخاب، از شما می‌خواهند Plugin مربوط به WhatsApp را نصب کنید.
- `openclaw channels login --channel whatsapp` نیز وقتی
  Plugin هنوز موجود نباشد، جریان نصب را پیشنهاد می‌کند.
- کانال توسعه + checkout گیت: به‌طور پیش‌فرض از مسیر Plugin محلی استفاده می‌کند.
- Stable/Beta: از بستهٔ npm با نام `@openclaw/whatsapp` روی تگ انتشار رسمی
  فعلی استفاده می‌کند.

نصب دستی همچنان در دسترس است:

```bash
openclaw plugins install @openclaw/whatsapp
```

برای دنبال‌کردن تگ انتشار رسمی فعلی، از بستهٔ بدون نسخه استفاده کنید. فقط وقتی
به نصب بازتولیدپذیر نیاز دارید، نسخهٔ دقیق را pin کنید.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای فرستنده‌های ناشناس، جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌ها و راهنماهای تعمیر میان‌کانالی.
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

  <Step title="راه‌اندازی gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="تأیید نخستین درخواست جفت‌سازی (اگر از حالت جفت‌سازی استفاده می‌کنید)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    درخواست‌های جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار برای هر کانال حداکثر ۳ مورد هستند.

  </Step>
</Steps>

<Note>
OpenClaw توصیه می‌کند در صورت امکان WhatsApp را روی یک شمارهٔ جداگانه اجرا کنید. (فرادادهٔ کانال و جریان راه‌اندازی برای این چیدمان بهینه شده‌اند، اما چیدمان‌های شمارهٔ شخصی نیز پشتیبانی می‌شوند.)
</Note>

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="شمارهٔ اختصاصی (توصیه‌شده)">
    این تمیزترین حالت عملیاتی است:

    - هویت WhatsApp جداگانه برای OpenClaw
    - allowlistهای پیام مستقیم و مرزهای مسیریابی روشن‌تر
    - احتمال کمترِ سردرگمی گفت‌وگوی با خود

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
    راه‌اندازی اولیه از حالت شمارهٔ شخصی پشتیبانی می‌کند و یک پایهٔ مناسب برای گفت‌وگوی با خود می‌نویسد:

    - `dmPolicy: "allowlist"`
    - `allowFrom` شامل شمارهٔ شخصی شماست
    - `selfChatMode: true`

    در زمان اجرا، محافظت‌های گفت‌وگوی با خود بر اساس شمارهٔ خودِ پیوندشده و `allowFrom` عمل می‌کنند.

  </Accordion>

  <Accordion title="دامنهٔ کانال فقط WhatsApp Web">
    کانال سکوی پیام‌رسانی در معماری کانال فعلی OpenClaw مبتنی بر WhatsApp Web (`Baileys`) است.

    هیچ کانال پیام‌رسانی جداگانهٔ Twilio WhatsApp در رجیستری داخلی کانال‌های گفت‌وگو وجود ندارد.

  </Accordion>
</AccordionGroup>

## مدل زمان اجرا

- Gateway مالک socket و حلقهٔ اتصال مجدد WhatsApp است.
- watchdog اتصال مجدد از فعالیت انتقال WhatsApp Web استفاده می‌کند، نه فقط حجم پیام‌های ورودی برنامه؛ بنابراین یک نشست دستگاه پیوندشدهٔ کم‌فعالیت صرفاً به این دلیل که اخیراً کسی پیامی نفرستاده، بازراه‌اندازی نمی‌شود. سقف طولانی‌ترِ سکوت برنامه همچنان اگر قاب‌های انتقال همچنان برسند اما هیچ پیام برنامه‌ای در بازهٔ watchdog پردازش نشود، اتصال مجدد را اجبار می‌کند؛ پس از یک اتصال مجدد گذرا برای نشستی که اخیراً فعال بوده، آن بررسی سکوت برنامه برای نخستین پنجرهٔ بازیابی از timeout معمول پیام استفاده می‌کند.
- زمان‌بندی‌های socket در Baileys به‌صراحت زیر `web.whatsapp.*` قرار دارند: `keepAliveIntervalMs` پینگ‌های برنامه‌ای WhatsApp Web را کنترل می‌کند، `connectTimeoutMs` timeout دست‌دهی آغازین را کنترل می‌کند، و `defaultQueryTimeoutMs` timeoutهای query در Baileys را کنترل می‌کند.
- ارسال‌های خروجی برای حساب مقصد به یک شنوندهٔ فعال WhatsApp نیاز دارند.
- گفت‌وگوهای وضعیت و broadcast نادیده گرفته می‌شوند (`@status`, `@broadcast`).
- watchdog اتصال مجدد فعالیت انتقال WhatsApp Web را دنبال می‌کند، نه فقط حجم پیام‌های ورودی برنامه: نشست‌های دستگاه پیوندشدهٔ کم‌فعالیت تا وقتی قاب‌های انتقال ادامه دارند بالا می‌مانند، اما توقف انتقال مدت‌ها پیش از مسیر قطع اتصال دوردستِ بعدی، اتصال مجدد را اجبار می‌کند.
- گفت‌وگوهای مستقیم از قواعد نشست پیام مستقیم استفاده می‌کنند (`session.dmScope`؛ مقدار پیش‌فرض `main` پیام‌های مستقیم را در نشست اصلی agent ادغام می‌کند).
- نشست‌های گروهی جدا هستند (`agent:<agentId>:whatsapp:group:<jid>`).
- کانال‌ها/خبرنامه‌های WhatsApp می‌توانند هدف‌های خروجی صریح با JID بومی `@newsletter` خود باشند. ارسال‌های خروجی خبرنامه به‌جای معناشناسی نشست پیام مستقیم، از فرادادهٔ نشست کانال استفاده می‌کنند (`agent:<agentId>:whatsapp:channel:<jid>`).
- انتقال WhatsApp Web متغیرهای محیطی استاندارد proxy را روی میزبان gateway رعایت می‌کند (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / گونه‌های حروف کوچک). پیکربندی proxy در سطح میزبان را به تنظیمات proxy اختصاصی کانال WhatsApp ترجیح دهید.
- وقتی `messages.removeAckAfterReply` فعال باشد، OpenClaw پس از تحویل پاسخ قابل مشاهده، واکنش ack در WhatsApp را پاک می‌کند.

## hookهای Plugin و حریم خصوصی

پیام‌های ورودی WhatsApp می‌توانند شامل محتوای پیام شخصی، شماره‌تلفن‌ها،
شناسه‌های گروه، نام فرستنده و فیلدهای همبستگی نشست باشند. به همین دلیل،
WhatsApp payloadهای hook ورودی `message_received` را برای Pluginها broadcast نمی‌کند
مگر اینکه صریحاً opt in کنید:

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

می‌توانید opt-in را به یک حساب محدود کنید:

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

این گزینه را فقط برای Pluginهایی فعال کنید که برای دریافت محتوای پیام
ورودی WhatsApp و شناسه‌ها به آن‌ها اعتماد دارید.

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.whatsapp.dmPolicy` دسترسی گفت‌وگوی مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `allowFrom` شماره‌های سبک E.164 را می‌پذیرد (درون سیستم عادی‌سازی می‌شوند).

    `allowFrom` یک فهرست کنترل دسترسی فرستندهٔ پیام مستقیم است. ارسال‌های خروجی صریح به JIDهای گروه WhatsApp یا JIDهای کانال `@newsletter` را کنترل نمی‌کند.

    بازنویسی چندحسابی: `channels.whatsapp.accounts.<id>.dmPolicy` (و `allowFrom`) برای آن حساب بر پیش‌فرض‌های سطح کانال اولویت دارند.

    جزئیات رفتار زمان اجرا:

    - جفت‌سازی‌ها در allow-store کانال ماندگار می‌شوند و با `allowFrom` پیکربندی‌شده ادغام می‌شوند
    - automation زمان‌بندی‌شده و fallback گیرندهٔ Heartbeat از هدف‌های تحویل صریح یا `allowFrom` پیکربندی‌شده استفاده می‌کنند؛ تأییدهای جفت‌سازی پیام مستقیم به‌طور ضمنی گیرندهٔ Cron یا Heartbeat نیستند
    - اگر هیچ allowlistی پیکربندی نشده باشد، شمارهٔ خودِ پیوندشده به‌طور پیش‌فرض مجاز است
    - OpenClaw هرگز پیام‌های مستقیم خروجی `fromMe` را خودکار جفت‌سازی نمی‌کند (پیام‌هایی که از دستگاه پیوندشده برای خودتان می‌فرستید)

  </Tab>

  <Tab title="سیاست گروه + allowlistها">
    دسترسی گروه دو لایه دارد:

    1. **allowlist عضویت گروه** (`channels.whatsapp.groups`)
       - اگر `groups` حذف شده باشد، همهٔ گروه‌ها واجد شرایط هستند
       - اگر `groups` وجود داشته باشد، مانند allowlist گروه عمل می‌کند (`"*"` مجاز است)

    2. **سیاست فرستندهٔ گروه** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist فرستنده دور زده می‌شود
       - `allowlist`: فرستنده باید با `groupAllowFrom` (یا `*`) منطبق باشد
       - `disabled`: همهٔ ورودی‌های گروهی را مسدود می‌کند

    fallback برای allowlist فرستنده:

    - اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا در صورت وجود به `allowFrom` fallback می‌کند
    - allowlistهای فرستنده پیش از فعال‌سازی با mention/reply ارزیابی می‌شوند

    نکته: اگر هیچ بلوک `channels.whatsapp` وجود نداشته باشد، fallback سیاست گروه در زمان اجرا `allowlist` است (با یک log هشدار)، حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد.

  </Tab>

  <Tab title="Mentionها + /activation">
    پاسخ‌های گروهی به‌طور پیش‌فرض به mention نیاز دارند.

    تشخیص mention شامل این موارد است:

    - mentionهای صریح WhatsApp از هویت bot
    - الگوهای regex mention پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback با `messages.groupChat.mentionPatterns`)
    - transcriptهای voice note ورودی برای پیام‌های گروهی مجاز
    - تشخیص ضمنی reply-to-bot (فرستندهٔ پاسخ با هویت bot منطبق است)

    نکتهٔ امنیتی:

    - quote/reply فقط gating mention را برآورده می‌کند؛ به فرستنده مجوز نمی‌دهد
    - با `groupPolicy: "allowlist"`، فرستنده‌های خارج از allowlist حتی اگر به پیام کاربری در allowlist پاسخ دهند، همچنان مسدود می‌شوند

    فرمان فعال‌سازی در سطح نشست:

    - `/activation mention`
    - `/activation always`

    `activation` وضعیت نشست را به‌روزرسانی می‌کند (نه پیکربندی سراسری). این کار با owner-gate محافظت می‌شود.

  </Tab>
</Tabs>

## رفتار شمارهٔ شخصی و گفت‌وگوی با خود

وقتی شمارهٔ خودِ پیوندشده در `allowFrom` نیز وجود داشته باشد، محافظت‌های گفت‌وگوی با خود در WhatsApp فعال می‌شوند:

- read receiptها برای نوبت‌های گفت‌وگوی با خود رد می‌شوند
- رفتار mention-JID auto-trigger که در غیر این صورت خودتان را ping می‌کرد نادیده گرفته می‌شود
- اگر `messages.responsePrefix` تنظیم نشده باشد، پاسخ‌های گفت‌وگوی با خود به‌طور پیش‌فرض `[{identity.name}]` یا `[openclaw]` هستند

## عادی‌سازی پیام و زمینه

<AccordionGroup>
  <Accordion title="envelope ورودی + زمینهٔ پاسخ">
    پیام‌های ورودی WhatsApp در envelope ورودی مشترک پیچیده می‌شوند.

    اگر پاسخ quoteشده‌ای وجود داشته باشد، زمینه با این قالب افزوده می‌شود:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    فیلدهای فرادادهٔ پاسخ نیز در صورت موجود بودن پر می‌شوند (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 فرستنده).
    وقتی هدف پاسخ quoteشده رسانهٔ قابل دانلود باشد، OpenClaw آن را از طریق
    store معمول رسانهٔ ورودی ذخیره می‌کند و به‌صورت `MediaPath`/`MediaType` در دسترس می‌گذارد تا
    agent بتواند تصویر ارجاع‌شده را بررسی کند، نه اینکه فقط
    `<media:image>` را ببیند.

  </Accordion>

  <Accordion title="placeholderهای رسانه و استخراج موقعیت/مخاطب">
    پیام‌های ورودی فقط‌رسانه با placeholderهایی مانند موارد زیر عادی‌سازی می‌شوند:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    voice noteهای گروهی مجاز پیش از gating mention رونویسی می‌شوند، وقتی
    body فقط `<media:audio>` باشد؛ بنابراین گفتن mention مربوط به bot در voice note می‌تواند
    پاسخ را trigger کند. اگر transcript همچنان به bot اشاره نکند،
    transcript به‌جای placeholder خام در تاریخچهٔ گروهی در انتظار نگه داشته می‌شود.

    bodyهای موقعیت از متن مختصر مختصات استفاده می‌کنند. برچسب‌ها/نظرهای موقعیت و جزئیات مخاطب/vCard به‌صورت فرادادهٔ نامطمئن fenced رندر می‌شوند، نه متن prompt درون‌خطی.

  </Accordion>

  <Accordion title="تزریق تاریخچهٔ گروهی در انتظار">
    برای گروه‌ها، پیام‌های پردازش‌نشده می‌توانند buffer شوند و وقتی bot سرانجام trigger شد، به‌عنوان زمینه inject شوند.

    - حد پیش‌فرض: `50`
    - پیکربندی: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    markerهای تزریق:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="read receiptها">
    read receiptها به‌طور پیش‌فرض برای پیام‌های ورودی پذیرفته‌شدهٔ WhatsApp فعال هستند.

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

    نوبت‌های گفت‌وگوی با خود، حتی وقتی به‌صورت سراسری فعال باشند، رسیدهای خواندن را نمی‌فرستند.

  </Accordion>
</AccordionGroup>

## تحویل، بخش‌بندی و رسانه

<AccordionGroup>
  <Accordion title="بخش‌بندی متن">
    - حد پیش‌فرض بخش: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - حالت `newline` مرزهای پاراگراف را ترجیح می‌دهد (خطوط خالی)، سپس به بخش‌بندی امن از نظر طول بازمی‌گردد

  </Accordion>

  <Accordion title="رفتار رسانه خروجی">
    - از محموله‌های تصویر، ویدیو، صدا (یادداشت صوتی PTT) و سند پشتیبانی می‌کند
    - رسانه صوتی از طریق محموله `audio` در Baileys با `ptt: true` ارسال می‌شود، بنابراین کلاینت‌های WhatsApp آن را به‌صورت یادداشت صوتی فشار-برای-صحبت نمایش می‌دهند
    - محموله‌های پاسخ `audioAsVoice` را حفظ می‌کنند؛ خروجی یادداشت صوتی TTS برای WhatsApp حتی وقتی ارائه‌دهنده MP3 یا WebM برمی‌گرداند، روی همین مسیر PTT می‌ماند
    - صدای بومی Ogg/Opus برای سازگاری با یادداشت صوتی به‌صورت `audio/ogg; codecs=opus` ارسال می‌شود
    - صدای غیر Ogg، از جمله خروجی MP3/WebM مربوط به Microsoft Edge TTS، پیش از تحویل PTT با `ffmpeg` به Ogg/Opus تک‌کاناله 48 کیلوهرتز تبدیل می‌شود
    - `/tts latest` آخرین پاسخ دستیار را به‌صورت یک یادداشت صوتی می‌فرستد و ارسال‌های تکراری را برای همان پاسخ سرکوب می‌کند؛ `/tts chat on|off|default`، TTS خودکار را برای گفت‌وگوی فعلی WhatsApp کنترل می‌کند
    - پخش GIF متحرک از طریق `gifPlayback: true` در ارسال‌های ویدیویی پشتیبانی می‌شود
    - هنگام ارسال محموله‌های پاسخ چندرسانه‌ای، کپشن‌ها روی نخستین مورد رسانه اعمال می‌شوند، جز اینکه یادداشت‌های صوتی PTT ابتدا صدا و سپس متن قابل مشاهده را جداگانه می‌فرستند، چون کلاینت‌های WhatsApp کپشن‌های یادداشت صوتی را به‌صورت سازگار نمایش نمی‌دهند
    - منبع رسانه می‌تواند HTTP(S)، `file://` یا مسیرهای محلی باشد

  </Accordion>

  <Accordion title="محدودیت‌های اندازه رسانه و رفتار جایگزین">
    - سقف ذخیره رسانه ورودی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - سقف ارسال رسانه خروجی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<accountId>.mediaMaxMb` استفاده می‌کنند
    - تصاویر به‌صورت خودکار بهینه می‌شوند (تغییر اندازه/پویش کیفیت) تا در محدودیت‌ها جا شوند
    - در صورت شکست ارسال رسانه، جایگزینِ مورد اول به جای حذف بی‌صدای پاسخ، یک هشدار متنی می‌فرستد

  </Accordion>
</AccordionGroup>

## نقل‌قول پاسخ

WhatsApp از نقل‌قول بومی پاسخ پشتیبانی می‌کند، که در آن پاسخ‌های خروجی پیام ورودی را به‌صورت قابل مشاهده نقل‌قول می‌کنند. آن را با `channels.whatsapp.replyToMode` کنترل کنید.

| مقدار       | رفتار                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | هرگز نقل‌قول نکن؛ به‌صورت پیام ساده ارسال کن                                  |
| `"first"`   | فقط نخستین بخش پاسخ خروجی را نقل‌قول کن                             |
| `"all"`     | هر بخش پاسخ خروجی را نقل‌قول کن                                      |
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

`channels.whatsapp.reactionLevel` کنترل می‌کند عامل تا چه اندازه از واکنش‌های ایموجی در WhatsApp استفاده کند:

| سطح         | واکنش‌های تأیید | واکنش‌های آغازشده توسط عامل | شرح                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | خیر            | خیر                       | هیچ واکنشی وجود ندارد                              |
| `"ack"`       | بله           | خیر                        | فقط واکنش‌های تأیید (رسید پیش از پاسخ)           |
| `"minimal"`   | بله           | بله (محافظه‌کارانه)        | تأیید + واکنش‌های عامل با راهنمایی محافظه‌کارانه |
| `"extensive"` | بله           | بله (تشویق‌شده)          | تأیید + واکنش‌های عامل با راهنمایی تشویقی   |

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

WhatsApp از واکنش‌های تأیید فوری هنگام دریافت ورودی از طریق `channels.whatsapp.ackReaction` پشتیبانی می‌کند.
واکنش‌های تأیید با `reactionLevel` کنترل می‌شوند؛ وقتی `reactionLevel` برابر `"off"` باشد، سرکوب می‌شوند.

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

یادداشت‌های رفتاری:

- بلافاصله پس از پذیرفته‌شدن ورودی ارسال می‌شوند (پیش از پاسخ)
- خرابی‌ها ثبت می‌شوند اما تحویل عادی پاسخ را مسدود نمی‌کنند
- حالت گروهی `mentions` در نوبت‌هایی که با منشن فعال شده‌اند واکنش می‌دهد؛ فعال‌سازی گروهی `always` نقش دورزدن این بررسی را دارد
- WhatsApp از `channels.whatsapp.ackReaction` استفاده می‌کند (`messages.ackReaction` قدیمی اینجا استفاده نمی‌شود)

## چندحسابی و اعتبارنامه‌ها

<AccordionGroup>
  <Accordion title="انتخاب حساب و پیش‌فرض‌ها">
    - شناسه‌های حساب از `channels.whatsapp.accounts` می‌آیند
    - انتخاب حساب پیش‌فرض: اگر `default` وجود داشته باشد همان، وگرنه نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده)
    - شناسه‌های حساب برای جست‌وجو به‌صورت داخلی نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="مسیرهای اعتبارنامه و سازگاری با نسخه‌های قدیمی">
    - مسیر احراز هویت فعلی: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - فایل پشتیبان: `creds.json.bak`
    - احراز هویت پیش‌فرض قدیمی در `~/.openclaw/credentials/` همچنان برای جریان‌های حساب پیش‌فرض شناسایی/مهاجرت داده می‌شود

  </Accordion>

  <Accordion title="رفتار خروج از حساب">
    `openclaw channels logout --channel whatsapp [--account <id>]` وضعیت احراز هویت WhatsApp را برای آن حساب پاک می‌کند.

    وقتی یک Gateway در دسترس باشد، خروج از حساب ابتدا شنونده زنده WhatsApp را برای حساب انتخاب‌شده متوقف می‌کند تا نشست پیوندشده تا راه‌اندازی مجدد بعدی به دریافت پیام‌ها ادامه ندهد. `openclaw channels remove --channel whatsapp` نیز پیش از غیرفعال‌کردن یا حذف پیکربندی حساب، شنونده زنده را متوقف می‌کند.

    در دایرکتوری‌های احراز هویت قدیمی، `oauth.json` حفظ می‌شود و فایل‌های احراز هویت Baileys حذف می‌شوند.

  </Accordion>
</AccordionGroup>

## ابزارها، کنش‌ها و نوشتن پیکربندی

- پشتیبانی ابزار عامل شامل کنش واکنش WhatsApp (`react`) است.
- گیت‌های کنش:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- نوشتن‌های پیکربندی آغازشده از کانال به‌طور پیش‌فرض فعال‌اند (غیرفعال‌سازی از طریق `channels.whatsapp.configWrites=false`).

## عیب‌یابی

<AccordionGroup>
  <Accordion title="متصل نشده (QR لازم است)">
    نشانه: وضعیت کانال گزارش می‌دهد که متصل نشده است.

    رفع مشکل:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="متصل شده اما قطع است / حلقه اتصال مجدد">
    نشانه: حساب متصل با قطع‌های مکرر یا تلاش‌های اتصال مجدد.

    حساب‌های کم‌فعالیت می‌توانند پس از مهلت زمانی عادی پیام هم متصل بمانند؛ واچ‌داگ
    وقتی فعالیت انتقال WhatsApp Web متوقف شود، سوکت بسته شود، یا
    فعالیت سطح برنامه بیش از پنجره ایمنی طولانی‌تر ساکت بماند، راه‌اندازی مجدد می‌کند.

    اگر لاگ‌ها `status=408 Request Time-out Connection was lost` تکراری نشان می‌دهند،
    زمان‌بندی‌های سوکت Baileys را زیر `web.whatsapp` تنظیم کنید. با کوتاه‌کردن
    `keepAliveIntervalMs` به کمتر از مهلت بیکاری شبکه‌تان و افزایش
    `connectTimeoutMs` روی پیوندهای کند یا دارای اتلاف شروع کنید:

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

    رفع مشکل:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    اگر `~/.openclaw/logs/whatsapp-health.log` می‌گوید `Gateway inactive` اما
    `openclaw gateway status` و `openclaw channels status --probe` نشان می‌دهند
    Gateway و WhatsApp سالم هستند، `openclaw doctor` را اجرا کنید. در Linux، doctor
    درباره ورودی‌های crontab قدیمی که همچنان
    `~/.openclaw/bin/ensure-whatsapp.sh` را اجرا می‌کنند هشدار می‌دهد؛ آن ورودی‌های stale را با
    `crontab -e` حذف کنید، چون Cron ممکن است محیط user-bus مربوط به systemd را نداشته باشد و
    باعث شود آن اسکریپت قدیمی سلامت Gateway را نادرست گزارش کند.

    در صورت نیاز، با `channels login` دوباره پیوند دهید.

  </Accordion>

  <Accordion title="ورود QR پشت پروکسی با پایان مهلت مواجه می‌شود">
    نشانه: `openclaw channels login --channel whatsapp` پیش از نمایش یک کد QR قابل استفاده با `status=408 Request Time-out` یا قطع سوکت TLS شکست می‌خورد.

    ورود WhatsApp Web از محیط پروکسی استاندارد میزبان Gateway استفاده می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، گونه‌های حروف کوچک، و `NO_PROXY`). بررسی کنید فرایند Gateway محیط پروکسی را به ارث می‌برد و `NO_PROXY` با `mmg.whatsapp.net` مطابقت ندارد.

  </Accordion>

  <Accordion title="هنگام ارسال، شنونده فعالی وجود ندارد">
    ارسال‌های خروجی وقتی هیچ شنونده Gateway فعالی برای حساب هدف وجود نداشته باشد، سریع شکست می‌خورند.

    مطمئن شوید Gateway در حال اجرا است و حساب پیوند شده است.

  </Accordion>

  <Accordion title="پاسخ در رونوشت ظاهر می‌شود اما در WhatsApp نه">
    ردیف‌های رونوشت آنچه عامل تولید کرده است را ثبت می‌کنند. تحویل WhatsApp جداگانه بررسی می‌شود: OpenClaw فقط پس از اینکه Baileys برای دست‌کم یک ارسال متن یا رسانه قابل مشاهده، شناسه پیام خروجی برگرداند، یک پاسخ خودکار را ارسال‌شده در نظر می‌گیرد.

    واکنش‌های تأیید، رسیدهای مستقل پیش از پاسخ هستند. یک واکنش موفق ثابت نمی‌کند که پاسخ متنی یا رسانه‌ای بعدی توسط WhatsApp پذیرفته شده است.

    لاگ‌های Gateway را برای `auto-reply delivery failed` یا `auto-reply was not accepted by WhatsApp provider` بررسی کنید.

  </Accordion>

  <Accordion title="پیام‌های گروه به‌طور غیرمنتظره نادیده گرفته می‌شوند">
    به این ترتیب بررسی کنید:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - ورودی‌های فهرست مجاز `groups`
    - گیت منشن (`requireMention` + الگوهای منشن)
    - کلیدهای تکراری در `openclaw.json` (JSON5): ورودی‌های بعدی ورودی‌های قبلی را بازنویسی می‌کنند، پس در هر دامنه فقط یک `groupPolicy` نگه دارید

  </Accordion>

  <Accordion title="هشدار زمان اجرای Bun">
    زمان اجرای Gateway WhatsApp باید از Node استفاده کند. Bun برای عملکرد پایدار Gateway مربوط به WhatsApp/Telegram ناسازگار علامت‌گذاری شده است.
  </Accordion>
</AccordionGroup>

## پرامپت‌های سیستم

WhatsApp از پرامپت‌های سیستم به سبک Telegram برای گروه‌ها و گفت‌وگوهای مستقیم از طریق نقشه‌های `groups` و `direct` پشتیبانی می‌کند.

سلسله‌مراتب حل برای پیام‌های گروه:

نقشه مؤثر `groups` ابتدا تعیین می‌شود: اگر حساب `groups` خودش را تعریف کند، نقشه ریشه `groups` را به‌طور کامل جایگزین می‌کند (بدون ادغام عمیق). سپس جست‌وجوی پرامپت روی نقشه واحد حاصل اجرا می‌شود:

1. **پرامپت سیستم مخصوص گروه** (`groups["<groupId>"].systemPrompt`): وقتی ورودی گروه مشخص در نقشه وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد استفاده می‌شود. اگر `systemPrompt` یک رشته خالی (`""`) باشد، نویسه عام سرکوب می‌شود و هیچ پرامپت سیستمی اعمال نمی‌شود.
2. **پرامپت سیستم نویسه عام گروه** (`groups["*"].systemPrompt`): وقتی ورودی گروه مشخص به‌طور کامل از نقشه غایب باشد، یا وقتی وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند استفاده می‌شود.

سلسله‌مراتب حل برای پیام‌های مستقیم:

نقشه مؤثر `direct` ابتدا تعیین می‌شود: اگر حساب `direct` خودش را تعریف کند، نقشه ریشه `direct` را به‌طور کامل جایگزین می‌کند (بدون ادغام عمیق). سپس جست‌وجوی پرامپت روی نقشه واحد حاصل اجرا می‌شود:

1. **پرامپت سیستم مخصوص مستقیم** (`direct["<peerId>"].systemPrompt`): وقتی ورودی همتای مشخص در نقشه وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد استفاده می‌شود. اگر `systemPrompt` یک رشته خالی (`""`) باشد، نویسه عام سرکوب می‌شود و هیچ پرامپت سیستمی اعمال نمی‌شود.
2. **پرامپت سیستم نویسه عام مستقیم** (`direct["*"].systemPrompt`): وقتی ورودی همتای مشخص به‌طور کامل از نقشه غایب باشد، یا وقتی وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند استفاده می‌شود.

<Note>
`dms` همچنان مخزن سبک بازنویسی تاریخچه برای هر گفت‌وگوی مستقیم (`dms.<id>.historyLimit`) باقی می‌ماند. بازنویسی‌های پرامپت زیر `direct` قرار دارند.
</Note>

**تفاوت با رفتار چندحسابی Telegram:** در Telegram، `groups` ریشه عمداً برای همه حساب‌ها در یک پیکربندی چندحسابی غیرفعال می‌شود — حتی حساب‌هایی که خودشان هیچ `groups` تعریف نکرده‌اند — تا از دریافت پیام‌های گروه‌هایی که بات عضو آن‌ها نیست جلوگیری شود. WhatsApp این محافظ را اعمال نمی‌کند: `groups` ریشه و `direct` ریشه همیشه توسط حساب‌هایی که بازنویسی در سطح حساب تعریف نکرده‌اند به ارث برده می‌شوند، فارغ از اینکه چند حساب پیکربندی شده باشد. در یک پیکربندی چندحسابی WhatsApp، اگر برای هر حساب پرامپت‌های گروهی یا مستقیم جداگانه می‌خواهید، به‌جای تکیه بر پیش‌فرض‌های سطح ریشه، نقشه کامل را صراحتاً زیر هر حساب تعریف کنید.

رفتار مهم:

- `channels.whatsapp.groups` هم نقشه پیکربندی برای هر گروه است و هم فهرست مجاز گروه‌ها در سطح چت. در سطح ریشه یا حساب، `groups["*"]` یعنی «همه گروه‌ها برای آن دامنه پذیرفته می‌شوند».
- فقط زمانی `systemPrompt` گروه wildcard اضافه کنید که از قبل می‌خواهید آن دامنه همه گروه‌ها را بپذیرد. اگر همچنان می‌خواهید فقط مجموعه ثابتی از شناسه‌های گروه واجد شرایط باشند، از `groups["*"]` برای پیش‌فرض پرامپت استفاده نکنید. در عوض، پرامپت را روی هر ورودی گروهی که صراحتاً مجاز شده است تکرار کنید.
- پذیرش گروه و مجوز فرستنده بررسی‌های جداگانه‌ای هستند. `groups["*"]` مجموعه گروه‌هایی را که می‌توانند به پردازش گروهی برسند گسترش می‌دهد، اما به‌تنهایی همه فرستندگان آن گروه‌ها را مجاز نمی‌کند. دسترسی فرستنده همچنان جداگانه توسط `channels.whatsapp.groupPolicy` و `channels.whatsapp.groupAllowFrom` کنترل می‌شود.
- `channels.whatsapp.direct` همین اثر جانبی را برای پیام‌های مستقیم ندارد. `direct["*"]` فقط پس از آنکه یک پیام مستقیم از طریق `dmPolicy` به‌همراه `allowFrom` یا قواعد مخزن جفت‌سازی پذیرفته شد، یک پیکربندی پیش‌فرض برای چت مستقیم فراهم می‌کند.

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

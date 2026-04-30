---
read_when:
    - کار روی رفتار کانال WhatsApp/وب یا مسیریابی صندوق ورودی
summary: پشتیبانی از کانال WhatsApp، کنترل‌های دسترسی، رفتار تحویل، و عملیات
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T09:34:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

وضعیت: آماده برای تولید از طریق WhatsApp Web (Baileys). Gateway مالک نشست(های) پیوندشده است.

## نصب (در صورت نیاز)

- راه‌اندازی اولیه (`openclaw onboard`) و `openclaw channels add --channel whatsapp`
  هنگام نخستین انتخاب، برای نصب Plugin مربوط به WhatsApp اعلان می‌دهند.
- `openclaw channels login --channel whatsapp` نیز وقتی
  Plugin هنوز موجود نباشد، جریان نصب را پیشنهاد می‌کند.
- کانال توسعه + checkout گیت: به‌طور پیش‌فرض از مسیر Plugin محلی استفاده می‌کند.
- پایدار/بتا: وقتی بسته فعلی منتشر شده باشد، از بسته npm با نام `@openclaw/whatsapp`
  استفاده می‌کند.

نصب دستی همچنان در دسترس است:

```bash
openclaw plugins install @openclaw/whatsapp
```

اگر npm بسته متعلق به OpenClaw را منسوخ یا ناموجود گزارش کرد، تا زمانی که
قطار بسته npm به‌روز شود، از یک ساخت بسته‌بندی‌شده فعلی OpenClaw یا یک checkout محلی
استفاده کنید.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای فرستنده‌های ناشناس، جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های بین‌کانالی و راهنماهای ترمیم.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و مثال‌های کامل پیکربندی کانال.
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

  <Step title="تأیید نخستین درخواست جفت‌سازی (اگر از حالت جفت‌سازی استفاده می‌کنید)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    درخواست‌های جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار برای هر کانال به ۳ عدد محدود هستند.

  </Step>
</Steps>

<Note>
OpenClaw توصیه می‌کند در صورت امکان WhatsApp را روی یک شماره جداگانه اجرا کنید. (فراداده کانال و جریان راه‌اندازی برای این تنظیم بهینه شده‌اند، اما تنظیمات با شماره شخصی نیز پشتیبانی می‌شوند.)
</Note>

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="شماره اختصاصی (توصیه‌شده)">
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

  <Accordion title="جایگزین با شماره شخصی">
    راه‌اندازی اولیه از حالت شماره شخصی پشتیبانی می‌کند و یک خط پایه سازگار با گفت‌وگوی با خود می‌نویسد:

    - `dmPolicy: "allowlist"`
    - `allowFrom` شامل شماره شخصی شماست
    - `selfChatMode: true`

    در زمان اجرا، محافظت‌های گفت‌وگوی با خود بر اساس شماره خود پیوندشده و `allowFrom` کلید می‌خورند.

  </Accordion>

  <Accordion title="دامنه کانال فقط WhatsApp Web">
    کانال پلتفرم پیام‌رسانی در معماری فعلی کانال OpenClaw مبتنی بر WhatsApp Web (`Baileys`) است.

    در رجیستری داخلی کانال گفت‌وگو، کانال پیام‌رسانی جداگانه‌ای برای Twilio WhatsApp وجود ندارد.

  </Accordion>
</AccordionGroup>

## مدل زمان اجرا

- Gateway مالک سوکت WhatsApp و حلقه اتصال مجدد است.
- دیده‌بان اتصال مجدد از فعالیت انتقال WhatsApp Web استفاده می‌کند، نه فقط حجم پیام‌های برنامه ورودی؛ بنابراین نشست آرام دستگاه پیوندشده صرفاً به این دلیل که اخیراً کسی پیامی نفرستاده، بازراه‌اندازی نمی‌شود. یک سقف طولانی‌تر برای سکوت برنامه همچنان اگر فریم‌های انتقال همچنان برسند اما هیچ پیام برنامه‌ای در پنجره دیده‌بان پردازش نشود، اتصال مجدد را اجبار می‌کند؛ پس از یک اتصال مجدد گذرا برای نشستی که اخیراً فعال بوده، آن بررسی سکوت برنامه برای نخستین پنجره بازیابی از مهلت عادی پیام استفاده می‌کند.
- زمان‌بندی‌های سوکت Baileys به‌طور صریح زیر `web.whatsapp.*` هستند: `keepAliveIntervalMs` پینگ‌های برنامه WhatsApp Web را کنترل می‌کند، `connectTimeoutMs` مهلت handshake آغازین را کنترل می‌کند، و `defaultQueryTimeoutMs` مهلت‌های query مربوط به Baileys را کنترل می‌کند.
- ارسال‌های خروجی به یک شنونده فعال WhatsApp برای حساب هدف نیاز دارند.
- گفت‌وگوهای وضعیت و broadcast نادیده گرفته می‌شوند (`@status`, `@broadcast`).
- دیده‌بان اتصال مجدد از فعالیت انتقال WhatsApp Web پیروی می‌کند، نه فقط حجم پیام‌های برنامه ورودی: نشست‌های آرام دستگاه پیوندشده تا وقتی فریم‌های انتقال ادامه دارند برقرار می‌مانند، اما توقف انتقال مدت‌ها پیش از مسیر دیرتر قطع اتصال از راه دور، اتصال مجدد را اجبار می‌کند.
- گفت‌وگوهای مستقیم از قواعد نشست پیام مستقیم استفاده می‌کنند (`session.dmScope`؛ مقدار پیش‌فرض `main` پیام‌های مستقیم را در نشست اصلی عامل ادغام می‌کند).
- نشست‌های گروهی ایزوله هستند (`agent:<agentId>:whatsapp:group:<jid>`).
- انتقال WhatsApp Web متغیرهای محیطی استاندارد proxy را روی میزبان Gateway رعایت می‌کند (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / گونه‌های حروف کوچک). پیکربندی proxy در سطح میزبان را به تنظیمات proxy مخصوص کانال WhatsApp ترجیح دهید.
- وقتی `messages.removeAckAfterReply` فعال باشد، OpenClaw پس از تحویل پاسخ قابل مشاهده، واکنش تأیید WhatsApp را پاک می‌کند.

## hookهای Plugin و حریم خصوصی

پیام‌های ورودی WhatsApp می‌توانند شامل محتوای پیام شخصی، شماره تلفن‌ها،
شناسه‌های گروه، نام فرستنده‌ها، و فیلدهای هم‌بستگی نشست باشند. به همین دلیل،
WhatsApp بارهای hook ورودی `message_received` را برای Pluginها منتشر نمی‌کند
مگر اینکه شما صریحاً آن را فعال کنید:

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

این گزینه را فقط برای Pluginهایی فعال کنید که به آن‌ها برای دریافت محتوای پیام
ورودی WhatsApp و شناسه‌ها اعتماد دارید.

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.whatsapp.dmPolicy` دسترسی گفت‌وگوی مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند آن است که `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `allowFrom` شماره‌هایی به سبک E.164 را می‌پذیرد (داخلی نرمال‌سازی می‌شود).

    بازنویسی چندحسابی: `channels.whatsapp.accounts.<id>.dmPolicy` (و `allowFrom`) برای آن حساب بر پیش‌فرض‌های سطح کانال اولویت دارند.

    جزئیات رفتار زمان اجرا:

    - جفت‌سازی‌ها در allow-store کانال پایدار می‌شوند و با `allowFrom` پیکربندی‌شده ادغام می‌شوند
    - اگر هیچ فهرست مجازی پیکربندی نشده باشد، شماره خود پیوندشده به‌طور پیش‌فرض مجاز است
    - OpenClaw هرگز پیام‌های مستقیم خروجی `fromMe` را به‌طور خودکار جفت‌سازی نمی‌کند (پیام‌هایی که از دستگاه پیوندشده برای خودتان می‌فرستید)

  </Tab>

  <Tab title="سیاست گروه + فهرست‌های مجاز">
    دسترسی گروه دو لایه دارد:

    1. **فهرست مجاز عضویت گروه** (`channels.whatsapp.groups`)
       - اگر `groups` حذف شده باشد، همه گروه‌ها واجد شرایط هستند
       - اگر `groups` وجود داشته باشد، مانند فهرست مجاز گروه عمل می‌کند (`"*"` مجاز است)

    2. **سیاست فرستنده گروه** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: فهرست مجاز فرستنده دور زده می‌شود
       - `allowlist`: فرستنده باید با `groupAllowFrom` (یا `*`) تطابق داشته باشد
       - `disabled`: همه ورودی‌های گروه را مسدود می‌کند

    بازگشت فهرست مجاز فرستنده:

    - اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا در صورت وجود به `allowFrom` بازمی‌گردد
    - فهرست‌های مجاز فرستنده پیش از فعال‌سازی با mention/reply ارزیابی می‌شوند

    نکته: اگر هیچ بلوک `channels.whatsapp` وجود نداشته باشد، بازگشت سیاست گروه در زمان اجرا `allowlist` است (با گزارش هشدار)، حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد.

  </Tab>

  <Tab title="اشاره‌ها + /activation">
    پاسخ‌های گروه به‌طور پیش‌فرض به اشاره نیاز دارند.

    تشخیص اشاره شامل موارد زیر است:

    - اشاره‌های صریح WhatsApp به هویت ربات
    - الگوهای regex اشاره پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، بازگشت `messages.groupChat.mentionPatterns`)
    - رونوشت‌های voice-note ورودی برای پیام‌های گروهی مجاز
    - تشخیص ضمنی پاسخ به ربات (فرستنده پاسخ با هویت ربات تطابق دارد)

    نکته امنیتی:

    - quote/reply فقط شرط اشاره را برآورده می‌کند؛ به فرستنده مجوز نمی‌دهد
    - با `groupPolicy: "allowlist"`، فرستنده‌های خارج از فهرست مجاز همچنان مسدود می‌شوند، حتی اگر به پیام یک کاربر موجود در فهرست مجاز پاسخ دهند

    فرمان فعال‌سازی در سطح نشست:

    - `/activation mention`
    - `/activation always`

    `activation` وضعیت نشست را به‌روزرسانی می‌کند (نه پیکربندی سراسری). این کار با مالک محدود می‌شود.

  </Tab>
</Tabs>

## رفتار شماره شخصی و گفت‌وگوی با خود

وقتی شماره خود پیوندشده در `allowFrom` نیز وجود داشته باشد، محافظت‌های گفت‌وگوی با خود WhatsApp فعال می‌شوند:

- رد کردن رسیدهای خواندن برای نوبت‌های گفت‌وگوی با خود
- نادیده گرفتن رفتار فعال‌سازی خودکار mention-JID که در غیر این صورت خودتان را ping می‌کند
- اگر `messages.responsePrefix` تنظیم نشده باشد، پاسخ‌های گفت‌وگوی با خود به‌طور پیش‌فرض `[{identity.name}]` یا `[openclaw]` هستند

## نرمال‌سازی پیام و زمینه

<AccordionGroup>
  <Accordion title="پاکت ورودی + زمینه پاسخ">
    پیام‌های ورودی WhatsApp در پاکت ورودی مشترک بسته‌بندی می‌شوند.

    اگر یک پاسخ نقل‌شده وجود داشته باشد، زمینه به این شکل افزوده می‌شود:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    فیلدهای فراداده پاسخ نیز در صورت وجود پر می‌شوند (`ReplyToId`, `ReplyToBody`, `ReplyToSender`، JID/E.164 فرستنده).

  </Accordion>

  <Accordion title="جای‌نگهدارهای رسانه و استخراج مکان/مخاطب">
    پیام‌های ورودی فقط‌رسانه با جای‌نگهدارهایی مانند موارد زیر نرمال‌سازی می‌شوند:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    voice noteهای گروهی مجاز، وقتی بدنه فقط `<media:audio>` باشد، پیش از شرط اشاره
    رونویسی می‌شوند؛ بنابراین گفتن اشاره به ربات در voice note می‌تواند
    پاسخ را فعال کند. اگر رونوشت همچنان به ربات اشاره نکند، رونوشت
    به‌جای جای‌نگهدار خام در تاریخچه گروه در انتظار نگه داشته می‌شود.

    بدنه‌های مکان از متن مختصر مختصات استفاده می‌کنند. برچسب‌ها/نظرهای مکان و جزئیات مخاطب/vCard به‌صورت فراداده غیرقابل‌اعتماد در fenced block رندر می‌شوند، نه به‌صورت متن inline در prompt.

  </Accordion>

  <Accordion title="تزریق تاریخچه گروه در انتظار">
    برای گروه‌ها، پیام‌های پردازش‌نشده می‌توانند buffer شوند و وقتی ربات سرانجام فعال شد، به‌عنوان زمینه تزریق شوند.

    - حد پیش‌فرض: `50`
    - پیکربندی: `channels.whatsapp.historyLimit`
    - بازگشت: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    نشانگرهای تزریق:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="رسیدهای خواندن">
    رسیدهای خواندن به‌طور پیش‌فرض برای پیام‌های ورودی پذیرفته‌شده WhatsApp فعال هستند.

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

    نوبت‌های گفت‌وگوی با خود حتی وقتی به‌صورت سراسری فعال باشند، رسیدهای خواندن را رد می‌کنند.

  </Accordion>
</AccordionGroup>

## تحویل، قطعه‌بندی، و رسانه

<AccordionGroup>
  <Accordion title="قطعه‌بندی متن">
    - حد پیش‌فرض قطعه: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - حالت `newline` مرزهای پاراگراف را ترجیح می‌دهد (خطوط خالی)، سپس به قطعه‌بندی ایمن از نظر طول بازمی‌گردد

  </Accordion>

  <Accordion title="رفتار رسانهٔ خروجی">
    - از payloadهای تصویر، ویدئو، صدا (یادداشت صوتی PTT) و سند پشتیبانی می‌کند
    - رسانهٔ صوتی از طریق payload صوتی Baileys یعنی `audio` همراه با `ptt: true` ارسال می‌شود، بنابراین کلاینت‌های WhatsApp آن را به‌صورت یادداشت صوتی push-to-talk نمایش می‌دهند
    - payloadهای پاسخ، `audioAsVoice` را حفظ می‌کنند؛ خروجی یادداشت صوتی TTS برای WhatsApp حتی وقتی ارائه‌دهنده MP3 یا WebM برمی‌گرداند، روی همین مسیر PTT باقی می‌ماند
    - صدای بومی Ogg/Opus برای سازگاری با یادداشت صوتی به‌صورت `audio/ogg; codecs=opus` ارسال می‌شود
    - صدای غیر Ogg، از جمله خروجی MP3/WebM از TTS در Microsoft Edge، پیش از تحویل PTT با `ffmpeg` به Ogg/Opus تک‌کاناله 48 کیلوهرتز تبدیل می‌شود
    - `/tts latest` آخرین پاسخ دستیار را به‌صورت یک یادداشت صوتی ارسال می‌کند و ارسال‌های تکراری برای همان پاسخ را سرکوب می‌کند؛ `/tts chat on|off|default` کنترل TTS خودکار را برای چت فعلی WhatsApp انجام می‌دهد
    - پخش GIF متحرک از طریق `gifPlayback: true` در ارسال‌های ویدئویی پشتیبانی می‌شود
    - هنگام ارسال payloadهای پاسخ چندرسانه‌ای، کپشن‌ها روی نخستین مورد رسانه اعمال می‌شوند، به‌جز یادداشت‌های صوتی PTT که صدا را ابتدا و متن قابل‌مشاهده را جداگانه ارسال می‌کنند، چون کلاینت‌های WhatsApp کپشن‌های یادداشت صوتی را به‌طور یکنواخت نمایش نمی‌دهند
    - منبع رسانه می‌تواند HTTP(S)، `file://`، یا مسیرهای محلی باشد

  </Accordion>

  <Accordion title="محدودیت‌های اندازهٔ رسانه و رفتار جایگزین">
    - سقف ذخیرهٔ رسانهٔ ورودی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - سقف ارسال رسانهٔ خروجی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<accountId>.mediaMaxMb` استفاده می‌کنند
    - تصاویر به‌صورت خودکار بهینه می‌شوند (تغییر اندازه/پیمایش کیفیت) تا در محدودیت‌ها جا بگیرند
    - در صورت شکست ارسال رسانه، جایگزینِ مورد اول به‌جای حذف بی‌صدای پاسخ، هشدار متنی ارسال می‌کند

  </Accordion>
</AccordionGroup>

## نقل‌قول پاسخ

WhatsApp از نقل‌قول بومی پاسخ پشتیبانی می‌کند، که در آن پاسخ‌های خروجی پیام ورودی را به‌صورت قابل‌مشاهده نقل‌قول می‌کنند. آن را با `channels.whatsapp.replyToMode` کنترل کنید.

| مقدار       | رفتار                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | هرگز نقل‌قول نکن؛ به‌صورت پیام ساده ارسال کن                                  |
| `"first"`   | فقط نخستین قطعهٔ پاسخ خروجی را نقل‌قول کن                             |
| `"all"`     | هر قطعهٔ پاسخ خروجی را نقل‌قول کن                                      |
| `"batched"` | پاسخ‌های دسته‌ایِ صف‌شده را نقل‌قول کن و پاسخ‌های فوری را بدون نقل‌قول بگذار |

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

`channels.whatsapp.reactionLevel` کنترل می‌کند که عامل تا چه گستره‌ای از واکنش‌های ایموجی در WhatsApp استفاده کند:

| سطح         | واکنش‌های تأیید دریافت | واکنش‌های آغازشده توسط عامل | توضیح                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | خیر            | خیر                        | هیچ واکنشی انجام نمی‌شود                              |
| `"ack"`       | بله           | خیر                        | فقط واکنش‌های تأیید دریافت (رسید پیش از پاسخ)           |
| `"minimal"`   | بله           | بله (محافظه‌کارانه)        | تأیید دریافت + واکنش‌های عامل با راهنمایی محافظه‌کارانه |
| `"extensive"` | بله           | بله (تشویق‌شده)          | تأیید دریافت + واکنش‌های عامل با راهنمایی تشویق‌شده   |

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

WhatsApp از واکنش‌های فوری تأیید دریافت هنگام دریافت ورودی از طریق `channels.whatsapp.ackReaction` پشتیبانی می‌کند.
واکنش‌های تأیید دریافت با `reactionLevel` محدود می‌شوند — وقتی `reactionLevel` برابر `"off"` باشد، سرکوب می‌شوند.

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
- حالت گروه `mentions` در نوبت‌های فعال‌شده با اشاره واکنش نشان می‌دهد؛ فعال‌سازی گروه `always` به‌عنوان دورزنندهٔ این بررسی عمل می‌کند
- WhatsApp از `channels.whatsapp.ackReaction` استفاده می‌کند (`messages.ackReaction` قدیمی اینجا استفاده نمی‌شود)

## چندحسابی و اعتبارنامه‌ها

<AccordionGroup>
  <Accordion title="انتخاب حساب و پیش‌فرض‌ها">
    - شناسه‌های حساب از `channels.whatsapp.accounts` می‌آیند
    - انتخاب حساب پیش‌فرض: اگر `default` وجود داشته باشد همان، وگرنه نخستین شناسهٔ حساب پیکربندی‌شده (مرتب‌شده)
    - شناسه‌های حساب برای جست‌وجو به‌صورت داخلی نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="مسیرهای اعتبارنامه و سازگاری قدیمی">
    - مسیر احراز هویت فعلی: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - فایل پشتیبان: `creds.json.bak`
    - احراز هویت پیش‌فرض قدیمی در `~/.openclaw/credentials/` همچنان برای جریان‌های حساب پیش‌فرض شناسایی/مهاجرت داده می‌شود

  </Accordion>

  <Accordion title="رفتار خروج از حساب">
    `openclaw channels logout --channel whatsapp [--account <id>]` وضعیت احراز هویت WhatsApp را برای آن حساب پاک می‌کند.

    در دایرکتوری‌های احراز هویت قدیمی، `oauth.json` حفظ می‌شود و فایل‌های احراز هویت Baileys حذف می‌شوند.

  </Accordion>
</AccordionGroup>

## ابزارها، کنش‌ها و نوشتن پیکربندی

- پشتیبانی ابزار عامل شامل کنش واکنش WhatsApp (`react`) است.
- دروازه‌های کنش:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- نوشتن پیکربندیِ آغازشده توسط کانال به‌طور پیش‌فرض فعال است (غیرفعال‌سازی با `channels.whatsapp.configWrites=false`).

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

  <Accordion title="پیوند شده اما قطع است / حلقهٔ اتصال مجدد">
    نشانه: حساب پیوندشده با قطع‌های مکرر یا تلاش‌های اتصال مجدد.

    حساب‌های کم‌رفت‌وآمد می‌توانند پس از مهلت عادی پیام هم متصل بمانند؛ watchdog
    زمانی بازراه‌اندازی می‌شود که فعالیت انتقال WhatsApp Web متوقف شود، سوکت بسته شود، یا
    فعالیت سطح برنامه فراتر از پنجرهٔ ایمنی طولانی‌تر بی‌صدا بماند.

    اگر لاگ‌ها `status=408 Request Time-out Connection was lost` تکراری نشان می‌دهند،
    زمان‌بندی‌های سوکت Baileys را زیر `web.whatsapp` تنظیم کنید. با کوتاه‌کردن
    `keepAliveIntervalMs` به کمتر از مهلت بیکاری شبکه‌تان و افزایش
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

    در صورت نیاز، با `channels login` دوباره پیوند دهید.

  </Accordion>

  <Accordion title="ورود QR پشت پروکسی زمان‌بر می‌شود و منقضی می‌شود">
    نشانه: `openclaw channels login --channel whatsapp` پیش از نمایش یک کد QR قابل‌استفاده با `status=408 Request Time-out` یا قطع سوکت TLS شکست می‌خورد.

    ورود WhatsApp Web از محیط پروکسی استاندارد میزبان Gateway استفاده می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، گونه‌های حروف کوچک، و `NO_PROXY`). بررسی کنید فرایند Gateway محیط پروکسی را به ارث می‌برد و `NO_PROXY` با `mmg.whatsapp.net` مطابقت ندارد.

  </Accordion>

  <Accordion title="هنگام ارسال شنوندهٔ فعالی وجود ندارد">
    وقتی هیچ شنوندهٔ Gateway فعالی برای حساب هدف وجود نداشته باشد، ارسال‌های خروجی سریع شکست می‌خورند.

    مطمئن شوید Gateway در حال اجرا است و حساب پیوند شده است.

  </Accordion>

  <Accordion title="پاسخ در رونوشت ظاهر می‌شود اما در WhatsApp نه">
    ردیف‌های رونوشت آنچه عامل تولید کرده است را ثبت می‌کنند. تحویل WhatsApp جداگانه بررسی می‌شود: OpenClaw فقط زمانی یک پاسخ خودکار را ارسال‌شده محسوب می‌کند که Baileys برای دست‌کم یک ارسال متن قابل‌مشاهده یا رسانه، شناسهٔ پیام خروجی برگرداند.

    واکنش‌های تأیید دریافت، رسیدهای مستقلِ پیش از پاسخ هستند. واکنش موفق ثابت نمی‌کند که پاسخ متنی یا رسانه‌ای بعدی توسط WhatsApp پذیرفته شده است.

    لاگ‌های Gateway را برای `auto-reply delivery failed` یا `auto-reply was not accepted by WhatsApp provider` بررسی کنید.

  </Accordion>

  <Accordion title="پیام‌های گروه به‌طور غیرمنتظره نادیده گرفته می‌شوند">
    به این ترتیب بررسی کنید:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - ورودی‌های فهرست مجاز `groups`
    - دروازه‌گذاری اشاره (`requireMention` + الگوهای اشاره)
    - کلیدهای تکراری در `openclaw.json` (JSON5): ورودی‌های بعدی ورودی‌های قبلی را بازنویسی می‌کنند، پس در هر دامنه فقط یک `groupPolicy` نگه دارید

  </Accordion>

  <Accordion title="هشدار runtime در Bun">
    runtime مربوط به Gateway در WhatsApp باید از Node استفاده کند. Bun برای عملیات پایدار Gateway در WhatsApp/Telegram ناسازگار علامت‌گذاری شده است.
  </Accordion>
</AccordionGroup>

## promptهای سیستمی

WhatsApp از promptهای سیستمی به سبک Telegram برای گروه‌ها و چت‌های مستقیم از طریق mapهای `groups` و `direct` پشتیبانی می‌کند.

سلسله‌مراتب حل برای پیام‌های گروه:

map مؤثر `groups` ابتدا تعیین می‌شود: اگر حساب `groups` خودش را تعریف کرده باشد، map ریشهٔ `groups` را به‌طور کامل جایگزین می‌کند (بدون ادغام عمیق). سپس جست‌وجوی prompt روی همان map واحد حاصل اجرا می‌شود:

1. **prompt سیستمی مخصوص گروه** (`groups["<groupId>"].systemPrompt`): وقتی استفاده می‌شود که ورودی گروه مشخص در map وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. اگر `systemPrompt` یک رشتهٔ خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ prompt سیستمی اعمال نمی‌شود.
2. **prompt سیستمی wildcard گروه** (`groups["*"].systemPrompt`): وقتی استفاده می‌شود که ورودی گروه مشخص کاملاً در map غایب باشد، یا وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند.

سلسله‌مراتب حل برای پیام‌های مستقیم:

map مؤثر `direct` ابتدا تعیین می‌شود: اگر حساب `direct` خودش را تعریف کرده باشد، map ریشهٔ `direct` را به‌طور کامل جایگزین می‌کند (بدون ادغام عمیق). سپس جست‌وجوی prompt روی همان map واحد حاصل اجرا می‌شود:

1. **prompt سیستمی مخصوص مستقیم** (`direct["<peerId>"].systemPrompt`): وقتی استفاده می‌شود که ورودی همتای مشخص در map وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. اگر `systemPrompt` یک رشتهٔ خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ prompt سیستمی اعمال نمی‌شود.
2. **prompt سیستمی wildcard مستقیم** (`direct["*"].systemPrompt`): وقتی استفاده می‌شود که ورودی همتای مشخص کاملاً در map غایب باشد، یا وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند.

<Note>
`dms` همچنان سطل سبک‌وزن بازنویسی تاریخچه برای هر DM است (`dms.<id>.historyLimit`). بازنویسی‌های prompt زیر `direct` قرار می‌گیرند.
</Note>

**تفاوت با رفتار چندحسابی Telegram:** در Telegram، `groups` ریشه عمداً برای همهٔ حساب‌ها در یک راه‌اندازی چندحسابی سرکوب می‌شود — حتی حساب‌هایی که `groups` خودشان را تعریف نکرده‌اند — تا از دریافت پیام‌های گروهی توسط bot برای گروه‌هایی که عضو آن‌ها نیست جلوگیری شود. WhatsApp این محافظ را اعمال نمی‌کند: `groups` ریشه و `direct` ریشه همیشه توسط حساب‌هایی که بازنویسی سطح حساب تعریف نکرده‌اند به ارث برده می‌شوند، صرف‌نظر از اینکه چند حساب پیکربندی شده باشد. در یک راه‌اندازی چندحسابی WhatsApp، اگر promptهای گروهی یا مستقیم برای هر حساب می‌خواهید، به‌جای تکیه بر پیش‌فرض‌های سطح ریشه، map کامل را صراحتاً زیر هر حساب تعریف کنید.

رفتار مهم:

- `channels.whatsapp.groups` هم یک نگاشت پیکربندی برای هر گروه است و هم فهرست مجاز گروه در سطح گفت‌وگو. در حوزهٔ ریشه یا حساب، `groups["*"]` یعنی «همهٔ گروه‌ها برای آن حوزه پذیرفته می‌شوند».
- فقط زمانی یک گروه wildcard با `systemPrompt` اضافه کنید که از قبل می‌خواهید آن حوزه همهٔ گروه‌ها را بپذیرد. اگر همچنان می‌خواهید فقط مجموعه‌ای ثابت از شناسه‌های گروه واجد شرایط باشند، از `groups["*"]` برای پیش‌فرض پرامپت استفاده نکنید. در عوض، پرامپت را روی هر ورودی گروهی که صراحتاً در فهرست مجاز قرار دارد تکرار کنید.
- پذیرش گروه و مجوز فرستنده بررسی‌های جداگانه‌ای هستند. `groups["*"]` مجموعهٔ گروه‌هایی را که می‌توانند به پردازش گروهی برسند گسترش می‌دهد، اما به‌تنهایی هر فرستنده‌ای را در آن گروه‌ها مجاز نمی‌کند. دسترسی فرستنده همچنان جداگانه توسط `channels.whatsapp.groupPolicy` و `channels.whatsapp.groupAllowFrom` کنترل می‌شود.
- `channels.whatsapp.direct` برای DMها همان اثر جانبی را ندارد. `direct["*"]` فقط پس از آنکه یک DM با `dmPolicy` به‌همراه `allowFrom` یا قواعد pairing-store پذیرفته شد، پیکربندی پیش‌فرض گفت‌وگوی مستقیم را فراهم می‌کند.

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

- [Pairing](/fa/channels/pairing)
- [گروه‌ها](/fa/channels/groups)
- [امنیت](/fa/gateway/security)
- [مسیریابی کانال](/fa/channels/channel-routing)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
- [عیب‌یابی](/fa/channels/troubleshooting)

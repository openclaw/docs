---
read_when:
    - کار روی رفتار کانال WhatsApp/وب یا مسیریابی صندوق ورودی
summary: پشتیبانی از کانال WhatsApp، کنترل‌های دسترسی، رفتار تحویل و عملیات
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T00:06:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf363ec2cc7100635ee6b0a7b0e7bb956521d0203b445fd38b5a75a13e8918a6
    source_path: channels/whatsapp.md
    workflow: 16
---

وضعیت: آمادهٔ تولید از طریق WhatsApp Web (Baileys). Gateway مالک نشست(های) پیوندشده است.

## نصب (در صورت نیاز)

- راه‌اندازی اولیه (`openclaw onboard`) و `openclaw channels add --channel whatsapp`
  هنگام نخستین انتخاب WhatsApp Plugin، درخواست نصب آن را نمایش می‌دهند.
- `openclaw channels login --channel whatsapp` نیز وقتی
  Plugin هنوز موجود نیست، روند نصب را پیشنهاد می‌دهد.
- کانال توسعه + checkout گیت: به‌طور پیش‌فرض از مسیر Plugin محلی استفاده می‌کند.
- پایدار/بتا: وقتی بستهٔ فعلی منتشر شده باشد، از بستهٔ npm با نام `@openclaw/whatsapp`
  استفاده می‌کند.

نصب دستی همچنان در دسترس است:

```bash
openclaw plugins install @openclaw/whatsapp
```

اگر npm بستهٔ متعلق به OpenClaw را منسوخ یا ناموجود گزارش کرد، تا زمانی که قطار بستهٔ npm
به‌روز شود، از یک ساخت بسته‌بندی‌شدهٔ فعلی OpenClaw یا یک checkout محلی استفاده کنید.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای فرستندگان ناشناخته، جفت‌سازی است.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی و دستورالعمل‌های ترمیم.
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

    برای اتصال یک پوشهٔ احراز هویت موجود/سفارشی WhatsApp Web پیش از ورود:

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

    درخواست‌های جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار برای هر کانال به ۳ عدد محدود می‌شوند.

  </Step>
</Steps>

<Note>
OpenClaw توصیه می‌کند در صورت امکان WhatsApp را روی یک شمارهٔ جداگانه اجرا کنید. (فرادادهٔ کانال و روند راه‌اندازی برای این چیدمان بهینه شده‌اند، اما چیدمان‌های شمارهٔ شخصی نیز پشتیبانی می‌شوند.)
</Note>

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    این تمیزترین حالت عملیاتی است:

    - هویت جداگانهٔ WhatsApp برای OpenClaw
    - فهرست‌های مجاز پیام مستقیم و مرزهای مسیریابی روشن‌تر
    - احتمال کمتر سردرگمی در گفت‌وگو با خود

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
    راه‌اندازی اولیه از حالت شمارهٔ شخصی پشتیبانی می‌کند و یک مبنای سازگار با گفت‌وگو با خود می‌نویسد:

    - `dmPolicy: "allowlist"`
    - `allowFrom` شامل شمارهٔ شخصی شماست
    - `selfChatMode: true`

    در زمان اجرا، محافظت‌های گفت‌وگو با خود بر اساس شمارهٔ خودِ پیوندشده و `allowFrom` عمل می‌کنند.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    کانال سکوی پیام‌رسانی در معماری کانال فعلی OpenClaw مبتنی بر WhatsApp Web (`Baileys`) است.

    هیچ کانال پیام‌رسانی جداگانهٔ Twilio WhatsApp در رجیستری داخلی کانال‌های چت وجود ندارد.

  </Accordion>
</AccordionGroup>

## مدل زمان اجرا

- Gateway مالک سوکت WhatsApp و حلقهٔ اتصال مجدد است.
- نگهبان اتصال مجدد از فعالیت انتقال WhatsApp Web استفاده می‌کند، نه فقط حجم پیام‌های ورودی برنامه؛ بنابراین نشست دستگاه پیوندشدهٔ آرام صرفاً به این دلیل که اخیراً کسی پیامی نفرستاده، بازراه‌اندازی نمی‌شود. سقف طولانی‌تر سکوت برنامه همچنان اگر قاب‌های انتقال برسند اما هیچ پیام برنامه‌ای در بازهٔ نگهبان پردازش نشود، اتصال مجدد را اجباری می‌کند؛ پس از یک اتصال مجدد گذرا برای نشستی که اخیراً فعال بوده، آن بررسی سکوت برنامه در نخستین پنجرهٔ بازیابی از مهلت عادی پیام استفاده می‌کند.
- زمان‌بندی‌های سوکت Baileys به‌صراحت زیر `web.whatsapp.*` هستند: `keepAliveIntervalMs` پینگ‌های برنامهٔ WhatsApp Web را کنترل می‌کند، `connectTimeoutMs` مهلت دست‌دهی آغازین را کنترل می‌کند، و `defaultQueryTimeoutMs` مهلت پرس‌وجوهای Baileys را کنترل می‌کند.
- ارسال‌های خروجی به یک شنوندهٔ فعال WhatsApp برای حساب مقصد نیاز دارند.
- چت‌های وضعیت و پخش نادیده گرفته می‌شوند (`@status`، `@broadcast`).
- نگهبان اتصال مجدد فعالیت انتقال WhatsApp Web را دنبال می‌کند، نه فقط حجم پیام‌های ورودی برنامه: نشست‌های دستگاه پیوندشدهٔ آرام تا زمانی که قاب‌های انتقال ادامه داشته باشند برقرار می‌مانند، اما توقف انتقال بسیار زودتر از مسیر قطع اتصال دورتر، اتصال مجدد را اجباری می‌کند.
- چت‌های مستقیم از قواعد نشست پیام مستقیم استفاده می‌کنند (`session.dmScope`؛ مقدار پیش‌فرض `main` پیام‌های مستقیم را در نشست اصلی عامل ادغام می‌کند).
- نشست‌های گروهی ایزوله هستند (`agent:<agentId>:whatsapp:group:<jid>`).
- انتقال WhatsApp Web به متغیرهای محیطی استاندارد پراکسی روی میزبان Gateway احترام می‌گذارد (`HTTPS_PROXY`، `HTTP_PROXY`، `NO_PROXY` / گونه‌های حروف کوچک). پیکربندی پراکسی در سطح میزبان را به تنظیمات پراکسی اختصاصی کانال WhatsApp ترجیح دهید.
- وقتی `messages.removeAckAfterReply` فعال باشد، OpenClaw پس از تحویل پاسخ قابل مشاهده، واکنش تأیید WhatsApp را پاک می‌کند.

## قلاب‌های Plugin و حریم خصوصی

پیام‌های ورودی WhatsApp می‌توانند شامل محتوای پیام شخصی، شماره تلفن‌ها،
شناسه‌های گروه، نام فرستنده‌ها، و فیلدهای همبستگی نشست باشند. به همین دلیل،
WhatsApp محموله‌های قلاب ورودی `message_received` را برای Pluginها پخش نمی‌کند،
مگر اینکه صراحتاً اعلام رضایت کنید:

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

می‌توانید این اعلام رضایت را به یک حساب محدود کنید:

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
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` دسترسی چت مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `allowFrom` شماره‌های سبک E.164 را می‌پذیرد (در داخل نرمال‌سازی می‌شوند).

    بازنویسی چندحسابی: `channels.whatsapp.accounts.<id>.dmPolicy` (و `allowFrom`) برای آن حساب بر پیش‌فرض‌های سطح کانال مقدم هستند.

    جزئیات رفتار زمان اجرا:

    - جفت‌سازی‌ها در allow-store کانال ماندگار می‌شوند و با `allowFrom` پیکربندی‌شده ادغام می‌شوند
    - اگر هیچ فهرست مجازی پیکربندی نشده باشد، شمارهٔ خودِ پیوندشده به‌طور پیش‌فرض مجاز است
    - OpenClaw هرگز پیام‌های مستقیم خروجی `fromMe` را به‌طور خودکار جفت نمی‌کند (پیام‌هایی که از دستگاه پیوندشده برای خودتان می‌فرستید)

  </Tab>

  <Tab title="Group policy + allowlists">
    دسترسی گروه دو لایه دارد:

    1. **فهرست مجاز عضویت گروه** (`channels.whatsapp.groups`)
       - اگر `groups` حذف شود، همهٔ گروه‌ها واجد شرایط هستند
       - اگر `groups` موجود باشد، به‌عنوان فهرست مجاز گروه عمل می‌کند (`"*"` مجاز است)

    2. **سیاست فرستندهٔ گروه** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: فهرست مجاز فرستنده دور زده می‌شود
       - `allowlist`: فرستنده باید با `groupAllowFrom` (یا `*`) تطابق داشته باشد
       - `disabled`: همهٔ ورودی‌های گروه را مسدود می‌کند

    fallback فهرست مجاز فرستنده:

    - اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا در صورت وجود به `allowFrom` برمی‌گردد
    - فهرست‌های مجاز فرستنده پیش از فعال‌سازی بر پایهٔ منشن/پاسخ ارزیابی می‌شوند

    نکته: اگر اصلاً بلوک `channels.whatsapp` وجود نداشته باشد، fallback سیاست گروه در زمان اجرا `allowlist` است (همراه با گزارش هشدار)، حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد.

  </Tab>

  <Tab title="Mentions + /activation">
    پاسخ‌های گروهی به‌طور پیش‌فرض به منشن نیاز دارند.

    تشخیص منشن شامل این موارد است:

    - منشن‌های صریح WhatsApp از هویت بات
    - الگوهای regex منشن پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback `messages.groupChat.mentionPatterns`)
    - رونوشت‌های یادداشت صوتی ورودی برای پیام‌های گروهی مجاز
    - تشخیص ضمنی پاسخ به بات (فرستندهٔ پاسخ با هویت بات تطابق دارد)

    نکتهٔ امنیتی:

    - نقل‌قول/پاسخ فقط شرط منشن را برآورده می‌کند؛ **مجوز فرستنده را اعطا نمی‌کند**
    - با `groupPolicy: "allowlist"`، فرستندگان خارج از فهرست مجاز همچنان مسدود می‌شوند، حتی اگر به پیام کاربری در فهرست مجاز پاسخ دهند

    فرمان فعال‌سازی در سطح نشست:

    - `/activation mention`
    - `/activation always`

    `activation` وضعیت نشست را به‌روزرسانی می‌کند (نه پیکربندی سراسری). این کار با مالک محدودسازی شده است.

  </Tab>
</Tabs>

## رفتار شمارهٔ شخصی و گفت‌وگو با خود

وقتی شمارهٔ خودِ پیوندشده در `allowFrom` نیز وجود داشته باشد، محافظت‌های گفت‌وگو با خود WhatsApp فعال می‌شوند:

- رسیدهای خواندن را برای نوبت‌های گفت‌وگو با خود رد می‌کند
- رفتار فعال‌سازی خودکار mention-JID را که در غیر این صورت خودتان را پینگ می‌کرد نادیده می‌گیرد
- اگر `messages.responsePrefix` تنظیم نشده باشد، پاسخ‌های گفت‌وگو با خود به‌طور پیش‌فرض به `[{identity.name}]` یا `[openclaw]` تبدیل می‌شوند

## نرمال‌سازی پیام و زمینه

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    پیام‌های ورودی WhatsApp در پاکت ورودی مشترک پیچیده می‌شوند.

    اگر پاسخ نقل‌قول‌شده‌ای وجود داشته باشد، زمینه به این شکل افزوده می‌شود:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    فیلدهای فرادادهٔ پاسخ نیز در صورت وجود پر می‌شوند (`ReplyToId`، `ReplyToBody`، `ReplyToSender`، JID/E.164 فرستنده).

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    پیام‌های ورودی فقط‌رسانه با placeholderهایی مانند این‌ها نرمال‌سازی می‌شوند:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    یادداشت‌های صوتی گروهی مجاز، وقتی بدنه فقط `<media:audio>` باشد، پیش از شرط منشن رونویسی می‌شوند؛ بنابراین گفتن منشن بات در یادداشت صوتی می‌تواند
    پاسخ را فعال کند. اگر رونوشت همچنان بات را منشن نکند،
    رونوشت به‌جای placeholder خام در تاریخچهٔ گروهِ در انتظار نگه داشته می‌شود.

    بدنه‌های موقعیت مکانی از متن مختصر مختصات استفاده می‌کنند. برچسب‌ها/نظرهای موقعیت مکانی و جزئیات تماس/vCard به‌صورت فرادادهٔ غیرقابل‌اعتماد در بلوک حصاردار رندر می‌شوند، نه به‌صورت متن inline در prompt.

  </Accordion>

  <Accordion title="Pending group history injection">
    برای گروه‌ها، پیام‌های پردازش‌نشده می‌توانند بافر شوند و وقتی بات در نهایت فعال شد، به‌عنوان زمینه تزریق شوند.

    - حد پیش‌فرض: `50`
    - پیکربندی: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    نشانگرهای تزریق:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
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

    نوبت‌های گفت‌وگو با خود حتی وقتی به‌طور سراسری فعال باشد، رسیدهای خواندن را رد می‌کنند.

  </Accordion>
</AccordionGroup>

## تحویل، قطعه‌بندی، و رسانه

<AccordionGroup>
  <Accordion title="Text chunking">
    - حد پیش‌فرض قطعه: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - حالت `newline` مرزهای پاراگراف را ترجیح می‌دهد (خط‌های خالی)، سپس به قطعه‌بندی امن از نظر طول برمی‌گردد

  </Accordion>

  <Accordion title="رفتار رسانه خروجی">
    - از محموله‌های تصویر، ویدئو، صدا (یادداشت صوتی PTT) و سند پشتیبانی می‌کند
    - رسانه صوتی از طریق محموله `audio` در Baileys با `ptt: true` ارسال می‌شود، بنابراین کلاینت‌های WhatsApp آن را به‌صورت یادداشت صوتی فشار-برای-صحبت نمایش می‌دهند
    - محموله‌های پاسخ `audioAsVoice` را حفظ می‌کنند؛ خروجی یادداشت صوتی TTS برای WhatsApp حتی وقتی ارائه‌دهنده MP3 یا WebM برمی‌گرداند، روی همین مسیر PTT می‌ماند
    - صدای بومی Ogg/Opus برای سازگاری با یادداشت صوتی به‌صورت `audio/ogg; codecs=opus` ارسال می‌شود
    - صدای غیر Ogg، از جمله خروجی MP3/WebM از Microsoft Edge TTS، پیش از تحویل PTT با `ffmpeg` به Ogg/Opus مونو 48 kHz تبدیل می‌شود
    - `/tts latest` آخرین پاسخ دستیار را به‌صورت یک یادداشت صوتی ارسال می‌کند و ارسال‌های تکراری برای همان پاسخ را سرکوب می‌کند؛ `/tts chat on|off|default` TTS خودکار را برای گفت‌وگوی فعلی WhatsApp کنترل می‌کند
    - پخش GIF متحرک از طریق `gifPlayback: true` در ارسال‌های ویدئو پشتیبانی می‌شود
    - هنگام ارسال محموله‌های پاسخ چندرسانه‌ای، کپشن‌ها روی نخستین مورد رسانه اعمال می‌شوند، به‌جز اینکه یادداشت‌های صوتی PTT ابتدا صدا و سپس متن قابل مشاهده را جداگانه ارسال می‌کنند، چون کلاینت‌های WhatsApp کپشن‌های یادداشت صوتی را به‌طور سازگار نمایش نمی‌دهند
    - منبع رسانه می‌تواند HTTP(S)، `file://` یا مسیرهای محلی باشد

  </Accordion>

  <Accordion title="محدودیت‌های اندازه رسانه و رفتار بازگشت جایگزین">
    - سقف ذخیره رسانه ورودی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - سقف ارسال رسانه خروجی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<accountId>.mediaMaxMb` استفاده می‌کنند
    - تصاویر به‌طور خودکار بهینه‌سازی می‌شوند (تغییر اندازه/پیمایش کیفیت) تا در محدودیت‌ها جا بگیرند
    - در صورت شکست ارسال رسانه، بازگشت جایگزین مورد اول به‌جای حذف بی‌صدای پاسخ، هشدار متنی ارسال می‌کند

  </Accordion>
</AccordionGroup>

## نقل‌قول در پاسخ

WhatsApp از نقل‌قول بومی در پاسخ پشتیبانی می‌کند، که در آن پاسخ‌های خروجی پیام ورودی را به‌صورت قابل مشاهده نقل‌قول می‌کنند. آن را با `channels.whatsapp.replyToMode` کنترل کنید.

| مقدار       | رفتار                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | هرگز نقل‌قول نکن؛ به‌صورت پیام ساده ارسال کن                                  |
| `"first"`   | فقط نخستین بخش پاسخ خروجی را نقل‌قول کن                             |
| `"all"`     | همه بخش‌های پاسخ خروجی را نقل‌قول کن                                      |
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

`channels.whatsapp.reactionLevel` کنترل می‌کند عامل تا چه اندازه از واکنش‌های ایموجی در WhatsApp استفاده کند:

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
واکنش‌های تأیید توسط `reactionLevel` محدود می‌شوند — وقتی `reactionLevel` برابر `"off"` باشد، سرکوب می‌شوند.

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

- بلافاصله پس از پذیرفته شدن ورودی ارسال می‌شود (پیش از پاسخ)
- شکست‌ها ثبت می‌شوند اما تحویل عادی پاسخ را مسدود نمی‌کنند
- حالت گروهی `mentions` در نوبت‌هایی که با منشن فعال شده‌اند واکنش نشان می‌دهد؛ فعال‌سازی گروهی `always` برای این بررسی نقش گذرگاه را دارد
- WhatsApp از `channels.whatsapp.ackReaction` استفاده می‌کند (`messages.ackReaction` قدیمی اینجا استفاده نمی‌شود)

## چندحسابی و اعتبارنامه‌ها

<AccordionGroup>
  <Accordion title="انتخاب حساب و پیش‌فرض‌ها">
    - شناسه‌های حساب از `channels.whatsapp.accounts` می‌آیند
    - انتخاب حساب پیش‌فرض: اگر `default` وجود داشته باشد همان، وگرنه نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده)
    - شناسه‌های حساب به‌صورت داخلی برای جست‌وجو نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="مسیرهای اعتبارنامه و سازگاری قدیمی">
    - مسیر احراز هویت فعلی: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - فایل پشتیبان: `creds.json.bak`
    - احراز هویت پیش‌فرض قدیمی در `~/.openclaw/credentials/` هنوز برای جریان‌های حساب پیش‌فرض شناسایی/مهاجرت داده می‌شود

  </Accordion>

  <Accordion title="رفتار خروج">
    `openclaw channels logout --channel whatsapp [--account <id>]` وضعیت احراز هویت WhatsApp را برای آن حساب پاک می‌کند.

    در دایرکتوری‌های احراز هویت قدیمی، `oauth.json` حفظ می‌شود و فایل‌های احراز هویت Baileys حذف می‌شوند.

  </Accordion>
</AccordionGroup>

## ابزارها، کنش‌ها و نوشتن پیکربندی

- پشتیبانی ابزار عامل شامل کنش واکنش WhatsApp (`react`) است.
- دروازه‌های کنش:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- نوشتن‌های پیکربندی آغازشده توسط کانال به‌طور پیش‌فرض فعال هستند (با `channels.whatsapp.configWrites=false` غیرفعال کنید).

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

  <Accordion title="پیوند شده اما قطع است / حلقه اتصال دوباره">
    نشانه: حساب پیوندشده با قطع‌های مکرر یا تلاش‌های اتصال دوباره.

    حساب‌های کم‌فعالیت می‌توانند پس از مهلت عادی پیام همچنان متصل بمانند؛ watchdog
    وقتی فعالیت انتقال WhatsApp Web متوقف شود، سوکت بسته شود، یا
    فعالیت سطح برنامه فراتر از پنجره ایمنی طولانی‌تر ساکت بماند، بازراه‌اندازی می‌کند.

    اگر گزارش‌ها `status=408 Request Time-out Connection was lost` مکرر نشان می‌دهند،
    زمان‌بندی‌های سوکت Baileys را زیر `web.whatsapp` تنظیم کنید. با کوتاه‌تر کردن
    `keepAliveIntervalMs` به کمتر از مهلت بیکاری شبکه‌تان و افزایش
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

    در صورت نیاز، با `channels login` دوباره پیوند دهید.

  </Accordion>

  <Accordion title="ورود QR پشت پروکسی منقضی می‌شود">
    نشانه: `openclaw channels login --channel whatsapp` پیش از نمایش یک کد QR قابل استفاده با `status=408 Request Time-out` یا قطع سوکت TLS شکست می‌خورد.

    ورود WhatsApp Web از محیط پروکسی استاندارد میزبان Gateway استفاده می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، گونه‌های حروف کوچک، و `NO_PROXY`). بررسی کنید فرایند Gateway محیط پروکسی را به ارث می‌برد و `NO_PROXY` با `mmg.whatsapp.net` تطبیق ندارد.

  </Accordion>

  <Accordion title="هنگام ارسال شنونده فعالی وجود ندارد">
    وقتی هیچ شنونده Gateway فعالی برای حساب مقصد وجود نداشته باشد، ارسال‌های خروجی سریع شکست می‌خورند.

    مطمئن شوید Gateway در حال اجرا است و حساب پیوند شده است.

  </Accordion>

  <Accordion title="پیام‌های گروهی برخلاف انتظار نادیده گرفته می‌شوند">
    به این ترتیب بررسی کنید:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - ورودی‌های فهرست مجاز `groups`
    - دروازه‌گذاری منشن (`requireMention` + الگوهای منشن)
    - کلیدهای تکراری در `openclaw.json` (JSON5): ورودی‌های بعدی ورودی‌های قبلی را بازنویسی می‌کنند، پس در هر دامنه فقط یک `groupPolicy` نگه دارید

  </Accordion>

  <Accordion title="هشدار زمان‌اجرای Bun">
    زمان‌اجرای Gateway مربوط به WhatsApp باید از Node استفاده کند. Bun برای عملیات پایدار Gateway در WhatsApp/Telegram ناسازگار علامت‌گذاری شده است.
  </Accordion>
</AccordionGroup>

## اعلان‌های سیستمی

WhatsApp از اعلان‌های سیستمی به سبک Telegram برای گروه‌ها و گفت‌وگوهای مستقیم از طریق نقشه‌های `groups` و `direct` پشتیبانی می‌کند.

سلسله‌مراتب حل برای پیام‌های گروهی:

نخست نقشه مؤثر `groups` تعیین می‌شود: اگر حساب `groups` خودش را تعریف کند، کاملاً جایگزین نقشه ریشه `groups` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی اعلان روی همان نقشه واحد حاصل اجرا می‌شود:

1. **اعلان سیستمی مخصوص گروه** (`groups["<groupId>"].systemPrompt`): وقتی ورودی گروه مشخص در نقشه وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد استفاده می‌شود. اگر `systemPrompt` رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ اعلان سیستمی اعمال نمی‌شود.
2. **اعلان سیستمی wildcard گروه** (`groups["*"].systemPrompt`): وقتی ورودی گروه مشخص کاملاً در نقشه غایب باشد، یا وقتی وجود دارد اما هیچ کلید `systemPrompt` تعریف نمی‌کند، استفاده می‌شود.

سلسله‌مراتب حل برای پیام‌های مستقیم:

نخست نقشه مؤثر `direct` تعیین می‌شود: اگر حساب `direct` خودش را تعریف کند، کاملاً جایگزین نقشه ریشه `direct` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی اعلان روی همان نقشه واحد حاصل اجرا می‌شود:

1. **اعلان سیستمی مخصوص مستقیم** (`direct["<peerId>"].systemPrompt`): وقتی ورودی همتای مشخص در نقشه وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد استفاده می‌شود. اگر `systemPrompt` رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ اعلان سیستمی اعمال نمی‌شود.
2. **اعلان سیستمی wildcard مستقیم** (`direct["*"].systemPrompt`): وقتی ورودی همتای مشخص کاملاً در نقشه غایب باشد، یا وقتی وجود دارد اما هیچ کلید `systemPrompt` تعریف نمی‌کند، استفاده می‌شود.

<Note>
`dms` همچنان سطل سبک بازنویسی تاریخچه برای هر DM است (`dms.<id>.historyLimit`). بازنویسی‌های اعلان زیر `direct` قرار می‌گیرند.
</Note>

**تفاوت با رفتار چندحسابی Telegram:** در Telegram، `groups` ریشه عمداً برای همه حساب‌ها در یک راه‌اندازی چندحسابی سرکوب می‌شود — حتی حساب‌هایی که `groups` اختصاصی خودشان را تعریف نکرده‌اند — تا از دریافت پیام‌های گروهی برای گروه‌هایی که ربات عضوشان نیست جلوگیری شود. WhatsApp این محافظ را اعمال نمی‌کند: `groups` ریشه و `direct` ریشه همیشه توسط حساب‌هایی که بازنویسی سطح حساب تعریف نکرده‌اند به ارث برده می‌شوند، صرف‌نظر از اینکه چند حساب پیکربندی شده باشد. در یک راه‌اندازی چندحسابی WhatsApp، اگر اعلان‌های گروهی یا مستقیم مخصوص هر حساب می‌خواهید، به‌جای تکیه بر پیش‌فرض‌های سطح ریشه، نقشه کامل را زیر هر حساب به‌صراحت تعریف کنید.

رفتار مهم:

- `channels.whatsapp.groups` هم نقشه پیکربندی برای هر گروه است و هم فهرست مجاز گروه در سطح گفت‌وگو. در دامنه ریشه یا حساب، `groups["*"]` برای آن دامنه یعنی «همه گروه‌ها پذیرفته می‌شوند».
- فقط وقتی wildcard گروه `systemPrompt` اضافه کنید که از قبل می‌خواهید آن دامنه همه گروه‌ها را بپذیرد. اگر همچنان می‌خواهید فقط مجموعه ثابتی از شناسه‌های گروه واجد شرایط باشند، از `groups["*"]` برای پیش‌فرض اعلان استفاده نکنید. در عوض، اعلان را روی هر ورودی گروهِ به‌صراحت مجازشده تکرار کنید.
- پذیرش گروه و مجوزدهی فرستنده بررسی‌های جداگانه هستند. `groups["*"]` مجموعه گروه‌هایی را که می‌توانند به رسیدگی گروهی برسند گسترش می‌دهد، اما به‌خودی‌خود به هر فرستنده در آن گروه‌ها مجوز نمی‌دهد. دسترسی فرستنده همچنان جداگانه توسط `channels.whatsapp.groupPolicy` و `channels.whatsapp.groupAllowFrom` کنترل می‌شود.
- `channels.whatsapp.direct` همین اثر جانبی را برای DMها ندارد. `direct["*"]` فقط پس از آنکه یک DM از قبل توسط `dmPolicy` به‌همراه `allowFrom` یا قواعد pairing-store پذیرفته شده باشد، پیکربندی پیش‌فرض گفت‌وگوی مستقیم را فراهم می‌کند.

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
- رفتار جلسه: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- پرامپت‌ها: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## مرتبط

- [جفت‌سازی](/fa/channels/pairing)
- [گروه‌ها](/fa/channels/groups)
- [امنیت](/fa/gateway/security)
- [مسیریابی کانال](/fa/channels/channel-routing)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
- [عیب‌یابی](/fa/channels/troubleshooting)

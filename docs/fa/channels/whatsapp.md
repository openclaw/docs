---
read_when:
    - کار روی رفتار کانال WhatsApp/وب یا مسیریابی صندوق ورودی
summary: پشتیبانی کانال WhatsApp، کنترل‌های دسترسی، رفتار تحویل، و عملیات
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T11:37:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a38b2338056b55364577c72b643dac28ebb0006cdc61b480555e6079fb71573
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: آمادهٔ تولید از طریق WhatsApp Web (Baileys). Gateway مالک نشست(های) پیوندشده است.

## نصب (در صورت نیاز)

- فرایند راه‌اندازی (`openclaw onboard`) و `openclaw channels add --channel whatsapp`
  هنگام نخستین انتخاب، از شما می‌خواهند Plugin مربوط به WhatsApp را نصب کنید.
- `openclaw channels login --channel whatsapp` نیز وقتی Plugin هنوز موجود نباشد،
  جریان نصب را پیشنهاد می‌کند.
- کانال توسعه + checkout گیت: به‌طور پیش‌فرض از مسیر Plugin محلی استفاده می‌کند.
- پایدار/بتا: وقتی بستهٔ فعلی منتشر شده باشد، از بستهٔ npm به نام `@openclaw/whatsapp`
  استفاده می‌کند.

نصب دستی همچنان در دسترس است:

```bash
openclaw plugins install @openclaw/whatsapp
```

اگر npm بستهٔ متعلق به OpenClaw را منسوخ یا ناموجود گزارش کرد، تا وقتی قطار انتشار
بستهٔ npm همگام شود، از یک ساخت بسته‌بندی‌شدهٔ فعلی OpenClaw یا یک checkout محلی
استفاده کنید.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام خصوصی برای فرستنده‌های ناشناس، جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های میان‌کانالی و راهنماهای عملیاتی تعمیر.
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

  <Step title="تأیید نخستین درخواست جفت‌سازی (اگر از حالت جفت‌سازی استفاده می‌کنید)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    درخواست‌های جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار برای هر کانال به ۳ مورد محدود می‌شوند.

  </Step>
</Steps>

<Note>
OpenClaw توصیه می‌کند در صورت امکان WhatsApp را روی یک شمارهٔ جداگانه اجرا کنید. (فرادادهٔ کانال و جریان راه‌اندازی برای این تنظیم بهینه شده‌اند، اما تنظیمات مبتنی بر شمارهٔ شخصی نیز پشتیبانی می‌شوند.)
</Note>

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="شمارهٔ اختصاصی (توصیه‌شده)">
    این تمیزترین حالت عملیاتی است:

    - هویت جداگانهٔ WhatsApp برای OpenClaw
    - allowlistهای پیام خصوصی و مرزهای مسیریابی شفاف‌تر
    - احتمال کمتر سردرگمی ناشی از گفت‌وگو با خود

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
    راه‌اندازی از حالت شمارهٔ شخصی پشتیبانی می‌کند و یک خط مبنای سازگار با گفت‌وگو با خود می‌نویسد:

    - `dmPolicy: "allowlist"`
    - `allowFrom` شامل شمارهٔ شخصی شماست
    - `selfChatMode: true`

    در زمان اجرا، محافظت‌های گفت‌وگو با خود بر اساس شمارهٔ خودِ پیوندشده و `allowFrom` عمل می‌کنند.

  </Accordion>

  <Accordion title="دامنهٔ کانال فقط WhatsApp Web">
    کانال سکوی پیام‌رسانی در معماری کانال فعلی OpenClaw مبتنی بر WhatsApp Web (`Baileys`) است.

    در رجیستری داخلی کانال‌های گفت‌وگو، کانال پیام‌رسانی جداگانه‌ای برای Twilio WhatsApp وجود ندارد.

  </Accordion>
</AccordionGroup>

## مدل زمان اجرا

- Gateway مالک سوکت WhatsApp و حلقهٔ اتصال مجدد است.
- نگهبان اتصال مجدد از فعالیت انتقال WhatsApp Web استفاده می‌کند، نه فقط حجم پیام‌های برنامهٔ ورودی؛ بنابراین نشست دستگاه پیوندشدهٔ کم‌رفت‌وآمد صرفاً به این دلیل که اخیراً کسی پیامی نفرستاده، راه‌اندازی مجدد نمی‌شود. با این حال، یک سقف طولانی‌تر برای سکوت برنامه همچنان اگر فریم‌های انتقال همچنان برسند اما در بازهٔ نگهبان هیچ پیام برنامه‌ای پردازش نشود، اتصال مجدد را اجباری می‌کند؛ پس از یک اتصال مجدد گذرا برای نشستی که اخیراً فعال بوده، این بررسی سکوت برنامه در نخستین بازهٔ بازیابی از timeout عادی پیام استفاده می‌کند.
- زمان‌بندی‌های سوکت Baileys به‌صراحت زیر `web.whatsapp.*` قرار دارند: `keepAliveIntervalMs` پینگ‌های برنامهٔ WhatsApp Web را کنترل می‌کند، `connectTimeoutMs` timeout دست‌دهی آغازین را کنترل می‌کند، و `defaultQueryTimeoutMs` timeoutهای پرس‌وجوی Baileys را کنترل می‌کند.
- ارسال‌های خروجی به یک شنوندهٔ فعال WhatsApp برای حساب مقصد نیاز دارند.
- گفت‌وگوهای وضعیت و broadcast نادیده گرفته می‌شوند (`@status`, `@broadcast`).
- نگهبان اتصال مجدد فعالیت انتقال WhatsApp Web را دنبال می‌کند، نه فقط حجم پیام‌های برنامهٔ ورودی: نشست‌های دستگاه پیوندشدهٔ کم‌رفت‌وآمد تا وقتی فریم‌های انتقال ادامه داشته باشند فعال می‌مانند، اما توقف انتقال مدت‌ها پیش از مسیر قطع ارتباط دوردست بعدی، اتصال مجدد را اجباری می‌کند.
- گفت‌وگوهای مستقیم از قواعد نشست پیام خصوصی استفاده می‌کنند (`session.dmScope`؛ مقدار پیش‌فرض `main` پیام‌های خصوصی را در نشست اصلی عامل ادغام می‌کند).
- نشست‌های گروهی ایزوله هستند (`agent:<agentId>:whatsapp:group:<jid>`).
- انتقال WhatsApp Web متغیرهای محیطی استاندارد پروکسی را روی میزبان Gateway رعایت می‌کند (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / گونه‌های حروف کوچک). پیکربندی پروکسی در سطح میزبان را به تنظیمات پروکسی ویژهٔ کانال WhatsApp ترجیح دهید.
- وقتی `messages.removeAckAfterReply` فعال باشد، OpenClaw پس از تحویل یک پاسخ قابل مشاهده، واکنش تأیید WhatsApp را پاک می‌کند.

## hookهای Plugin و حریم خصوصی

پیام‌های ورودی WhatsApp می‌توانند شامل محتوای پیام شخصی، شماره تلفن‌ها،
شناسه‌های گروه، نام فرستنده‌ها، و فیلدهای همبستگی نشست باشند. به همین دلیل،
WhatsApp بارهای `message_received` hook ورودی را برای Pluginها پخش نمی‌کند
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

این گزینه را فقط برای Pluginهایی فعال کنید که به دریافت محتوای پیام‌های ورودی
WhatsApp و شناسه‌ها به آن‌ها اعتماد دارید.

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست پیام خصوصی">
    `channels.whatsapp.dmPolicy` دسترسی گفت‌وگوی مستقیم را کنترل می‌کند:

    - `pairing` (default)
    - `allowlist`
    - `open` (requires `allowFrom` to include `"*"`)
    - `disabled`

    `allowFrom` شماره‌های سبک E.164 را می‌پذیرد (در داخل به شکل نرمال‌شده ذخیره می‌شود).

    بازنویسی چندحسابی: `channels.whatsapp.accounts.<id>.dmPolicy` (و `allowFrom`) برای آن حساب بر پیش‌فرض‌های سطح کانال اولویت دارند.

    جزئیات رفتار زمان اجرا:

    - جفت‌سازی‌ها در allow-store کانال پایدار می‌شوند و با `allowFrom` پیکربندی‌شده ادغام می‌شوند
    - اتوماسیون زمان‌بندی‌شده و fallback گیرنده Heartbeat از مقصدهای تحویل صریح یا `allowFrom` پیکربندی‌شده استفاده می‌کنند؛ تأییدهای جفت‌سازی DM به‌صورت ضمنی گیرنده‌های Cron یا Heartbeat نیستند
    - اگر هیچ فهرست مجازی پیکربندی نشده باشد، شماره خودِ پیوندشده به‌طور پیش‌فرض مجاز است
    - OpenClaw هرگز DMهای خروجی `fromMe` را به‌صورت خودکار جفت نمی‌کند (پیام‌هایی که از دستگاه پیوندشده برای خودتان می‌فرستید)

  </Tab>

  <Tab title="Group policy + allowlists">
    دسترسی گروهی دو لایه دارد:

    1. **فهرست مجاز عضویت گروه** (`channels.whatsapp.groups`)
       - اگر `groups` حذف شده باشد، همه گروه‌ها واجد شرایط هستند
       - اگر `groups` وجود داشته باشد، به‌عنوان فهرست مجاز گروه عمل می‌کند (`"*"` مجاز است)

    2. **سیاست فرستنده گروه** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: فهرست مجاز فرستنده دور زده می‌شود
       - `allowlist`: فرستنده باید با `groupAllowFrom` (یا `*`) مطابقت داشته باشد
       - `disabled`: همه ورودی‌های گروه مسدود می‌شوند

    fallback فهرست مجاز فرستنده:

    - اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا در صورت وجود به `allowFrom` fallback می‌کند
    - فهرست‌های مجاز فرستنده پیش از فعال‌سازی با منشن/پاسخ ارزیابی می‌شوند

    نکته: اگر اصلاً هیچ بلوک `channels.whatsapp` وجود نداشته باشد، fallback سیاست گروه در زمان اجرا `allowlist` است (با یک لاگ هشدار)، حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد.

  </Tab>

  <Tab title="Mentions + /activation">
    پاسخ‌های گروهی به‌طور پیش‌فرض به منشن نیاز دارند.

    تشخیص منشن شامل این موارد است:

    - منشن‌های صریح WhatsApp از هویت بات
    - الگوهای regex منشن پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback به `messages.groupChat.mentionPatterns`)
    - رونوشت‌های یادداشت صوتی ورودی برای پیام‌های گروهی مجاز
    - تشخیص ضمنی پاسخ به بات (فرستنده پاسخ با هویت بات مطابقت دارد)

    نکته امنیتی:

    - نقل‌قول/پاسخ فقط شرط دروازه‌گذاری منشن را برآورده می‌کند؛ **مجوز فرستنده را اعطا نمی‌کند**
    - با `groupPolicy: "allowlist"`، فرستنده‌های خارج از فهرست مجاز همچنان مسدود می‌شوند، حتی اگر به پیام کاربری در فهرست مجاز پاسخ دهند

    فرمان فعال‌سازی سطح نشست:

    - `/activation mention`
    - `/activation always`

    `activation` وضعیت نشست را به‌روزرسانی می‌کند (نه پیکربندی سراسری). این کار با مالک کنترل می‌شود.

  </Tab>
</Tabs>

## رفتار شماره شخصی و گفت‌وگوی با خود

وقتی شماره خودِ پیوندشده همچنین در `allowFrom` وجود داشته باشد، محافظ‌های گفت‌وگوی با خود WhatsApp فعال می‌شوند:

- رسیدهای خواندن برای نوبت‌های گفت‌وگوی با خود رد می‌شوند
- رفتار فعال‌سازی خودکار mention-JID که در حالت عادی خودتان را ping می‌کند نادیده گرفته می‌شود
- اگر `messages.responsePrefix` تنظیم نشده باشد، پاسخ‌های گفت‌وگوی با خود به‌طور پیش‌فرض `[{identity.name}]` یا `[openclaw]` هستند

## نرمال‌سازی پیام و زمینه

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    پیام‌های ورودی WhatsApp در پوشش ورودی مشترک پیچیده می‌شوند.

    اگر پاسخ نقل‌شده وجود داشته باشد، زمینه به این شکل افزوده می‌شود:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    فیلدهای فراداده پاسخ نیز در صورت وجود پر می‌شوند (`ReplyToId`, `ReplyToBody`, `ReplyToSender`، JID/E.164 فرستنده).
    وقتی مقصد پاسخ نقل‌شده رسانه قابل دانلود باشد، OpenClaw آن را از طریق
    ذخیره‌ساز معمول رسانه ورودی ذخیره می‌کند و به‌صورت `MediaPath`/`MediaType`
    در دسترس قرار می‌دهد تا عامل بتواند تصویر ارجاع‌شده را بررسی کند، نه اینکه
    فقط `<media:image>` را ببیند.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    پیام‌های ورودی فقط-رسانه با placeholderهایی مانند این‌ها نرمال‌سازی می‌شوند:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    یادداشت‌های صوتی گروهی مجاز، زمانی که بدنه فقط `<media:audio>` باشد،
    پیش از دروازه‌گذاری منشن رونویسی می‌شوند، بنابراین گفتن منشن بات در یادداشت
    صوتی می‌تواند پاسخ را فعال کند. اگر رونوشت همچنان از بات منشن نکند،
    رونوشت به‌جای placeholder خام در تاریخچه گروه معلق نگه داشته می‌شود.

    بدنه‌های مکان از متن مختصر مختصات استفاده می‌کنند. برچسب‌ها/نظرهای مکان و جزئیات مخاطب/vCard به‌صورت فراداده غیرقابل‌اعتماد حصارکشی‌شده رندر می‌شوند، نه متن inline در prompt.

  </Accordion>

  <Accordion title="Pending group history injection">
    برای گروه‌ها، پیام‌های پردازش‌نشده می‌توانند بافر شوند و وقتی بات در نهایت فعال می‌شود، به‌عنوان زمینه تزریق شوند.

    - حد پیش‌فرض: `50`
    - پیکربندی: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    نشانگرهای تزریق:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    رسیدهای خواندن برای پیام‌های ورودی پذیرفته‌شده WhatsApp به‌طور پیش‌فرض فعال هستند.

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

    نوبت‌های گفت‌وگوی با خود حتی وقتی به‌صورت سراسری فعال باشد، رسیدهای خواندن را رد می‌کنند.

  </Accordion>
</AccordionGroup>

## تحویل، بخش‌بندی، و رسانه

<AccordionGroup>
  <Accordion title="قطعه‌بندی متن">
    - حد پیش‌فرض قطعه: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - حالت `newline` مرزهای بندها (خطوط خالی) را ترجیح می‌دهد، سپس به قطعه‌بندی ایمن از نظر طول برمی‌گردد

  </Accordion>

  <Accordion title="رفتار رسانه خروجی">
    - از محموله‌های تصویر، ویدئو، صدا (یادداشت صوتی PTT)، و سند پشتیبانی می‌کند
    - رسانه صوتی از طریق محموله `audio` در Baileys با `ptt: true` ارسال می‌شود، بنابراین کلاینت‌های WhatsApp آن را به‌صورت یادداشت صوتی push-to-talk نمایش می‌دهند
    - محموله‌های پاسخ `audioAsVoice` را حفظ می‌کنند؛ خروجی یادداشت صوتی TTS برای WhatsApp حتی وقتی ارائه‌دهنده MP3 یا WebM برمی‌گرداند، روی همین مسیر PTT می‌ماند
    - صدای بومی Ogg/Opus برای سازگاری یادداشت صوتی به‌صورت `audio/ogg; codecs=opus` ارسال می‌شود
    - صدای غیر Ogg، از جمله خروجی MP3/WebM مربوط به Microsoft Edge TTS، پیش از تحویل PTT با `ffmpeg` به Ogg/Opus تک‌کاناله 48 kHz تبدیل می‌شود
    - `/tts latest` آخرین پاسخ دستیار را به‌صورت یک یادداشت صوتی ارسال می‌کند و ارسال‌های تکراری برای همان پاسخ را سرکوب می‌کند؛ `/tts chat on|off|default`، TTS خودکار را برای چت فعلی WhatsApp کنترل می‌کند
    - پخش GIF متحرک از طریق `gifPlayback: true` در ارسال‌های ویدئویی پشتیبانی می‌شود
    - هنگام ارسال محموله‌های پاسخ چندرسانه‌ای، کپشن‌ها روی اولین مورد رسانه اعمال می‌شوند، به‌جز یادداشت‌های صوتی PTT که ابتدا صدا و سپس متن قابل‌مشاهده را جداگانه ارسال می‌کنند، چون کلاینت‌های WhatsApp کپشن‌های یادداشت صوتی را به‌طور یکنواخت نمایش نمی‌دهند
    - منبع رسانه می‌تواند HTTP(S)،‏ `file://`، یا مسیرهای محلی باشد

  </Accordion>

  <Accordion title="محدودیت‌های اندازه رسانه و رفتار جایگزین">
    - سقف ذخیره رسانه ورودی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - سقف ارسال رسانه خروجی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<accountId>.mediaMaxMb` استفاده می‌کنند
    - تصاویر به‌طور خودکار بهینه می‌شوند (تغییر اندازه/پیمایش کیفیت) تا در محدودیت‌ها جا شوند
    - هنگام شکست ارسال رسانه، جایگزین مورد اول به‌جای رها کردن بی‌صدای پاسخ، هشدار متنی ارسال می‌کند

  </Accordion>
</AccordionGroup>

## نقل‌قول پاسخ

WhatsApp از نقل‌قول پاسخ بومی پشتیبانی می‌کند، که در آن پاسخ‌های خروجی پیام ورودی را به‌صورت قابل‌مشاهده نقل‌قول می‌کنند. آن را با `channels.whatsapp.replyToMode` کنترل کنید.

| مقدار       | رفتار                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | هرگز نقل‌قول نکن؛ به‌صورت پیام ساده ارسال کن                                  |
| `"first"`   | فقط اولین قطعه پاسخ خروجی را نقل‌قول کن                             |
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

`channels.whatsapp.reactionLevel` کنترل می‌کند عامل تا چه اندازه از واکنش‌های ایموجی در WhatsApp استفاده کند:

| سطح         | واکنش‌های Ack | واکنش‌های آغازشده توسط عامل | توضیح                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | خیر            | خیر                        | بدون هیچ واکنشی                              |
| `"ack"`       | بله           | خیر                        | فقط واکنش‌های Ack (رسید پیش از پاسخ)           |
| `"minimal"`   | بله           | بله (محافظه‌کارانه)        | Ack + واکنش‌های عامل با راهنمایی محافظه‌کارانه |
| `"extensive"` | بله           | بله (تشویق‌شده)          | Ack + واکنش‌های عامل با راهنمایی تشویق‌شده   |

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

WhatsApp از واکنش‌های Ack فوری هنگام دریافت ورودی از طریق `channels.whatsapp.ackReaction` پشتیبانی می‌کند.
واکنش‌های Ack با `reactionLevel` محدود می‌شوند — وقتی `reactionLevel` برابر `"off"` باشد، سرکوب می‌شوند.

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
- حالت گروهی `mentions` در نوبت‌های راه‌اندازی‌شده با اشاره واکنش نشان می‌دهد؛ فعال‌سازی گروهی `always` برای این بررسی نقش دورزدن را دارد
- WhatsApp از `channels.whatsapp.ackReaction` استفاده می‌کند (`messages.ackReaction` قدیمی اینجا استفاده نمی‌شود)

## چندحسابی و اعتبارنامه‌ها

<AccordionGroup>
  <Accordion title="انتخاب حساب و پیش‌فرض‌ها">
    - شناسه‌های حساب از `channels.whatsapp.accounts` می‌آیند
    - انتخاب حساب پیش‌فرض: اگر `default` وجود داشته باشد، همان؛ در غیر این صورت اولین شناسه حساب پیکربندی‌شده (مرتب‌شده)
    - شناسه‌های حساب برای جست‌وجو به‌صورت داخلی نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="مسیرهای اعتبارنامه و سازگاری قدیمی">
    - مسیر احراز هویت فعلی: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - فایل پشتیبان: `creds.json.bak`
    - احراز هویت پیش‌فرض قدیمی در `~/.openclaw/credentials/` همچنان برای جریان‌های حساب پیش‌فرض شناخته/مهاجرت داده می‌شود

  </Accordion>

  <Accordion title="رفتار خروج از حساب">
    `openclaw channels logout --channel whatsapp [--account <id>]` وضعیت احراز هویت WhatsApp را برای آن حساب پاک می‌کند.

    وقتی یک Gateway در دسترس باشد، خروج از حساب ابتدا شنونده زنده WhatsApp را برای حساب انتخاب‌شده متوقف می‌کند تا نشست پیوندشده تا راه‌اندازی مجدد بعدی همچنان پیام دریافت نکند. `openclaw channels remove --channel whatsapp` نیز پیش از غیرفعال‌سازی یا حذف پیکربندی حساب، شنونده زنده را متوقف می‌کند.

    در دایرکتوری‌های احراز هویت قدیمی، `oauth.json` حفظ می‌شود در حالی که فایل‌های احراز هویت Baileys حذف می‌شوند.

  </Accordion>
</AccordionGroup>

## ابزارها، کنش‌ها، و نوشتن پیکربندی

- پشتیبانی ابزار عامل شامل کنش واکنش WhatsApp (`react`) است.
- گیت‌های کنش:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- نوشتن پیکربندی آغازشده توسط کانال به‌طور پیش‌فرض فعال است (غیرفعال‌سازی از طریق `channels.whatsapp.configWrites=false`).

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

    حساب‌های کم‌فعالیت می‌توانند پس از مهلت زمانی عادی پیام هم متصل بمانند؛ watchdog
    وقتی فعالیت انتقال WhatsApp Web متوقف شود، سوکت بسته شود، یا
    فعالیت در سطح برنامه بیش از پنجره ایمنی طولانی‌تر ساکت بماند، دوباره راه‌اندازی می‌شود.

    اگر لاگ‌ها `status=408 Request Time-out Connection was lost` تکراری نشان می‌دهند، زمان‌بندی‌های سوکت
    Baileys را زیر `web.whatsapp` تنظیم کنید. با کوتاه کردن
    `keepAliveIntervalMs` به کمتر از مهلت بی‌کاری شبکه‌تان و افزایش
    `connectTimeoutMs` روی لینک‌های کند یا پرتلفات شروع کنید:

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
    `crontab -e` حذف کنید، چون cron ممکن است محیط user-bus مربوط به systemd را نداشته باشد و
    باعث شود آن اسکریپت قدیمی سلامت gateway را اشتباه گزارش کند.

    در صورت نیاز، با `channels login` دوباره پیوند دهید.

  </Accordion>

  <Accordion title="ورود QR پشت پروکسی منقضی می‌شود">
    نشانه: `openclaw channels login --channel whatsapp` پیش از نمایش یک کد QR قابل‌استفاده با `status=408 Request Time-out` یا قطع سوکت TLS شکست می‌خورد.

    ورود WhatsApp Web از محیط پروکسی استاندارد میزبان gateway استفاده می‌کند (`HTTPS_PROXY`،‏ `HTTP_PROXY`، گونه‌های حروف کوچک، و `NO_PROXY`). بررسی کنید فرایند gateway متغیر محیطی پروکسی را به ارث می‌برد و `NO_PROXY` با `mmg.whatsapp.net` مطابقت ندارد.

  </Accordion>

  <Accordion title="هنگام ارسال شنونده فعالی وجود ندارد">
    ارسال‌های خروجی وقتی هیچ شنونده gateway فعالی برای حساب هدف وجود نداشته باشد، سریع شکست می‌خورند.

    مطمئن شوید gateway در حال اجرا است و حساب پیوند شده است.

  </Accordion>

  <Accordion title="پاسخ در رونوشت ظاهر می‌شود اما در WhatsApp نه">
    ردیف‌های رونوشت آنچه عامل تولید کرده را ثبت می‌کنند. تحویل WhatsApp جداگانه بررسی می‌شود: OpenClaw فقط پس از آن‌که Baileys برای حداقل یک ارسال متن یا رسانه قابل‌مشاهده یک شناسه پیام خروجی برگرداند، یک پاسخ خودکار را ارسال‌شده تلقی می‌کند.

    واکنش‌های Ack رسیدهای مستقل پیش از پاسخ هستند. یک واکنش موفق ثابت نمی‌کند که پاسخ متنی یا رسانه‌ای بعدی توسط WhatsApp پذیرفته شده است.

    لاگ‌های gateway را برای `auto-reply delivery failed` یا `auto-reply was not accepted by WhatsApp provider` بررسی کنید.

  </Accordion>

  <Accordion title="پیام‌های گروهی به‌طور غیرمنتظره نادیده گرفته می‌شوند">
    به این ترتیب بررسی کنید:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - ورودی‌های allowlist در `groups`
    - گیت اشاره (`requireMention` + الگوهای اشاره)
    - کلیدهای تکراری در `openclaw.json` (JSON5): ورودی‌های بعدی ورودی‌های قبلی را بازنویسی می‌کنند، بنابراین در هر دامنه فقط یک `groupPolicy` نگه دارید

  </Accordion>

  <Accordion title="هشدار runtime در Bun">
    runtime مربوط به Gateway در WhatsApp باید از Node استفاده کند. Bun برای عملیات پایدار gateway در WhatsApp/Telegram ناسازگار علامت‌گذاری شده است.
  </Accordion>
</AccordionGroup>

## پرامپت‌های سیستم

WhatsApp از پرامپت‌های سیستم به سبک Telegram برای گروه‌ها و چت‌های مستقیم از طریق نگاشت‌های `groups` و `direct` پشتیبانی می‌کند.

سلسله‌مراتب حل برای پیام‌های گروهی:

نگاشت مؤثر `groups` ابتدا تعیین می‌شود: اگر حساب `groups` خودش را تعریف کند، به‌طور کامل جایگزین نگاشت ریشه `groups` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی پرامپت روی همان نگاشت واحد حاصل اجرا می‌شود:

1. **پرامپت سیستم ویژه گروه** (`groups["<groupId>"].systemPrompt`): وقتی ورودی گروه مشخص در نگاشت وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد استفاده می‌شود. اگر `systemPrompt` یک رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ پرامپت سیستمی اعمال نمی‌شود.
2. **پرامپت سیستم wildcard گروه** (`groups["*"].systemPrompt`): وقتی ورودی گروه مشخص به‌طور کامل از نگاشت غایب باشد، یا وقتی وجود دارد اما هیچ کلید `systemPrompt` تعریف نکند، استفاده می‌شود.

سلسله‌مراتب حل برای پیام‌های مستقیم:

نگاشت مؤثر `direct` ابتدا تعیین می‌شود: اگر حساب `direct` خودش را تعریف کند، به‌طور کامل جایگزین نگاشت ریشه `direct` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی پرامپت روی همان نگاشت واحد حاصل اجرا می‌شود:

1. **پرامپت سیستم ویژه مستقیم** (`direct["<peerId>"].systemPrompt`): وقتی ورودی همتای مشخص در نگاشت وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد استفاده می‌شود. اگر `systemPrompt` یک رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ پرامپت سیستمی اعمال نمی‌شود.
2. **پرامپت سیستم wildcard مستقیم** (`direct["*"].systemPrompt`): وقتی ورودی همتای مشخص به‌طور کامل از نگاشت غایب باشد، یا وقتی وجود دارد اما هیچ کلید `systemPrompt` تعریف نکند، استفاده می‌شود.

<Note>
`dms` همچنان سطل سبک بازنویسی تاریخچه برای هر DM است (`dms.<id>.historyLimit`). بازنویسی‌های پرامپت زیر `direct` قرار دارند.
</Note>

**تفاوت با رفتار چندحسابی Telegram:** در Telegram، `groups` ریشه به‌صورت عمدی برای همهٔ حساب‌ها در یک پیکربندی چندحسابی غیرفعال می‌شود، حتی حساب‌هایی که خودشان هیچ `groups` تعریف نکرده‌اند، تا از دریافت پیام‌های گروه‌هایی که ربات عضو آن‌ها نیست توسط ربات جلوگیری شود. WhatsApp این محافظ را اعمال نمی‌کند: `groups` ریشه و `direct` ریشه همیشه به حساب‌هایی که بازنویسی سطح حساب تعریف نکرده‌اند به ارث می‌رسند، صرف‌نظر از اینکه چند حساب پیکربندی شده باشد. در یک پیکربندی چندحسابی WhatsApp، اگر برای هر حساب اعلان‌های گروهی یا مستقیم جداگانه می‌خواهید، به‌جای تکیه بر پیش‌فرض‌های سطح ریشه، نگاشت کامل را به‌صورت صریح زیر هر حساب تعریف کنید.

رفتارهای مهم:

- `channels.whatsapp.groups` هم یک نگاشت پیکربندی برای هر گروه است و هم فهرست مجاز گروه در سطح گفت‌وگو. در محدودهٔ ریشه یا حساب، `groups["*"]` یعنی «همهٔ گروه‌ها برای آن محدوده پذیرفته می‌شوند».
- فقط زمانی یک `systemPrompt` گروهی عام اضافه کنید که از قبل می‌خواهید آن محدوده همهٔ گروه‌ها را بپذیرد. اگر هنوز می‌خواهید فقط مجموعه‌ای ثابت از شناسه‌های گروه واجد شرایط باشند، برای پیش‌فرض اعلان از `groups["*"]` استفاده نکنید. در عوض، اعلان را روی هر ورودی گروهی که به‌صورت صریح در فهرست مجاز آمده است تکرار کنید.
- پذیرش گروه و مجوز فرستنده دو بررسی جداگانه‌اند. `groups["*"]` مجموعهٔ گروه‌هایی را که می‌توانند به مدیریت گروه برسند گسترده‌تر می‌کند، اما به‌تنهایی همهٔ فرستندگان آن گروه‌ها را مجاز نمی‌کند. دسترسی فرستنده همچنان جداگانه با `channels.whatsapp.groupPolicy` و `channels.whatsapp.groupAllowFrom` کنترل می‌شود.
- `channels.whatsapp.direct` برای پیام‌های مستقیم همان اثر جانبی را ندارد. `direct["*"]` فقط پس از آنکه یک پیام مستقیم از طریق `dmPolicy` به‌همراه `allowFrom` یا قواعد مخزن جفت‌سازی پذیرفته شد، یک پیکربندی پیش‌فرض گفت‌وگوی مستقیم فراهم می‌کند.

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
- اعلان‌ها: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## مرتبط

- [جفت‌سازی](/fa/channels/pairing)
- [گروه‌ها](/fa/channels/groups)
- [امنیت](/fa/gateway/security)
- [مسیریابی کانال](/fa/channels/channel-routing)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
- [عیب‌یابی](/fa/channels/troubleshooting)

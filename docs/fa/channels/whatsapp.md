---
read_when:
    - کار روی رفتار کانال WhatsApp/وب یا مسیریابی صندوق ورودی
summary: پشتیبانی از کانال WhatsApp، کنترل‌های دسترسی، رفتار تحویل و عملیات
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:15:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: آماده برای تولید از طریق WhatsApp Web (Baileys). Gateway مالک نشست(های) لینک‌شده است.

## نصب (در صورت نیاز)

- راه‌اندازی اولیه (`openclaw onboard`) و `openclaw channels add --channel whatsapp`
  هنگام اولین انتخاب WhatsApp plugin، نصب آن را پیشنهاد می‌کنند.
- `openclaw channels login --channel whatsapp` نیز وقتی
  plugin هنوز موجود نیست، جریان نصب را ارائه می‌دهد.
- کانال Dev + checkout گیت: به‌صورت پیش‌فرض از مسیر plugin محلی استفاده می‌کند.
- Stable/Beta: از بسته npm یعنی `@openclaw/whatsapp` روی تگ انتشار رسمی
  فعلی استفاده می‌کند.

نصب دستی همچنان در دسترس است:

```bash
openclaw plugins install @openclaw/whatsapp
```

برای دنبال کردن تگ انتشار رسمی فعلی، از بسته بدون نسخه استفاده کنید. نسخه دقیق را
فقط زمانی pin کنید که به نصب بازتولیدپذیر نیاز دارید.

در Windows، WhatsApp plugin هنگام نصب npm به Git روی `PATH` نیاز دارد، چون
یکی از وابستگی‌های Baileys/libsignal آن از یک URL گیت دریافت می‌شود. Git
for Windows را نصب کنید، سپس shell را دوباره راه‌اندازی کنید و نصب را دوباره اجرا کنید:

```powershell
winget install --id Git.Git -e
```

Portable Git نیز در صورتی کار می‌کند که دایرکتوری `bin` آن روی `PATH` باشد.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض DM برای فرستنده‌های ناشناس pairing است.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی و راهنماهای تعمیر.
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

    درخواست‌های Pairing پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار برای هر کانال به ۳ مورد محدود می‌شوند.

  </Step>
</Steps>

<Note>
OpenClaw توصیه می‌کند در صورت امکان WhatsApp را روی یک شماره جداگانه اجرا کنید. (فراداده کانال و جریان راه‌اندازی برای این تنظیم بهینه شده‌اند، اما تنظیمات با شماره شخصی نیز پشتیبانی می‌شوند.)
</Note>

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    این تمیزترین حالت عملیاتی است:

    - هویت WhatsApp جداگانه برای OpenClaw
    - allowlistهای DM و مرزهای مسیریابی شفاف‌تر
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

  <Accordion title="Personal-number fallback">
    راه‌اندازی اولیه از حالت شماره شخصی پشتیبانی می‌کند و یک baseline سازگار با چت با خود می‌نویسد:

    - `dmPolicy: "allowlist"`
    - `allowFrom` شامل شماره شخصی شما است
    - `selfChatMode: true`

    در زمان اجرا، محافظت‌های چت با خود بر اساس شماره خود لینک‌شده و `allowFrom` عمل می‌کنند.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    کانال پلتفرم پیام‌رسان در معماری کانال فعلی OpenClaw مبتنی بر WhatsApp Web (`Baileys`) است.

    در رجیستری داخلی کانال‌های چت، کانال پیام‌رسانی جداگانه Twilio WhatsApp وجود ندارد.

  </Accordion>
</AccordionGroup>

## مدل زمان اجرا

- Gateway مالک سوکت WhatsApp و حلقه اتصال مجدد است.
- watchdog اتصال مجدد از فعالیت انتقال WhatsApp Web استفاده می‌کند، نه فقط حجم پیام‌های ورودی برنامه؛ بنابراین یک نشست دستگاه لینک‌شده کم‌صدا صرفا به این دلیل که اخیرا کسی پیامی نفرستاده است دوباره راه‌اندازی نمی‌شود. یک سقف طولانی‌تر سکوت برنامه همچنان اگر فریم‌های انتقال همچنان برسند ولی هیچ پیام برنامه‌ای در بازه watchdog پردازش نشود، اتصال مجدد را اجبار می‌کند؛ پس از یک اتصال مجدد گذرا برای نشستی که اخیرا فعال بوده، این بررسی سکوت برنامه برای نخستین پنجره بازیابی از timeout عادی پیام استفاده می‌کند.
- زمان‌بندی‌های سوکت Baileys به‌صورت صریح زیر `web.whatsapp.*` هستند: `keepAliveIntervalMs` pingهای برنامه WhatsApp Web را کنترل می‌کند، `connectTimeoutMs` timeout handshake آغازین را کنترل می‌کند، و `defaultQueryTimeoutMs` timeoutهای query در Baileys را کنترل می‌کند.
- ارسال‌های خروجی به یک شنونده فعال WhatsApp برای حساب مقصد نیاز دارند.
- ارسال‌های گروهی برای tokenهای `@+<digits>` و `@<digits>` در متن و captionهای رسانه، وقتی token با فراداده شرکت‌کننده فعلی WhatsApp مطابقت داشته باشد، از جمله گروه‌های پشتیبانی‌شده با LID، فراداده mention بومی را ضمیمه می‌کنند.
- چت‌های وضعیت و broadcast نادیده گرفته می‌شوند (`@status`، `@broadcast`).
- watchdog اتصال مجدد فعالیت انتقال WhatsApp Web را دنبال می‌کند، نه فقط حجم پیام‌های ورودی برنامه: نشست‌های دستگاه لینک‌شده کم‌صدا تا زمانی که فریم‌های انتقال ادامه دارند برقرار می‌مانند، اما توقف انتقال خیلی زودتر از مسیر قطع اتصال راه دور بعدی، اتصال مجدد را اجبار می‌کند.
- چت‌های مستقیم از قوانین نشست DM استفاده می‌کنند (`session.dmScope`؛ مقدار پیش‌فرض `main`، DMها را به نشست اصلی agent ادغام می‌کند).
- نشست‌های گروهی ایزوله هستند (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters می‌توانند با JID بومی `@newsletter` خود، مقصدهای خروجی صریح باشند. ارسال‌های خروجی newsletter به‌جای معنای نشست DM، از فراداده نشست کانال استفاده می‌کنند (`agent:<agentId>:whatsapp:channel:<jid>`).
- انتقال WhatsApp Web متغیرهای محیطی استاندارد proxy را روی میزبان Gateway رعایت می‌کند (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / گونه‌های lowercase). پیکربندی proxy در سطح میزبان را به تنظیمات proxy اختصاصی WhatsApp برای کانال ترجیح دهید.
- وقتی `messages.removeAckAfterReply` فعال باشد، OpenClaw پس از تحویل یک پاسخ قابل مشاهده، واکنش ack در WhatsApp را پاک می‌کند.

## hookهای Plugin و حریم خصوصی

پیام‌های ورودی WhatsApp می‌توانند شامل محتوای پیام شخصی، شماره تلفن‌ها،
شناسه‌های گروه، نام فرستنده‌ها، و فیلدهای هم‌بستگی نشست باشند. به همین دلیل،
WhatsApp payloadهای hook ورودی `message_received` را برای plugins broadcast نمی‌کند
مگر اینکه صریحا opt in کنید:

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

این را فقط برای pluginsی فعال کنید که به آن‌ها برای دریافت محتوای پیام ورودی
WhatsApp و شناسه‌ها اعتماد دارید.

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` دسترسی چت مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `allowFrom` شماره‌های به سبک E.164 را می‌پذیرد (داخلی normalized می‌شوند).

    `allowFrom` یک فهرست کنترل دسترسی فرستنده DM است. ارسال‌های خروجی صریح به JIDهای گروه WhatsApp یا JIDهای کانال `@newsletter` را gate نمی‌کند.

    override چندحسابی: `channels.whatsapp.accounts.<id>.dmPolicy` (و `allowFrom`) برای آن حساب بر پیش‌فرض‌های سطح کانال اولویت دارند.

    جزئیات رفتار زمان اجرا:

    - pairingها در allow-store کانال پایدار می‌شوند و با `allowFrom` پیکربندی‌شده ادغام می‌شوند
    - automation زمان‌بندی‌شده و fallback گیرنده Heartbeat از مقصدهای تحویل صریح یا `allowFrom` پیکربندی‌شده استفاده می‌کنند؛ تاییدهای pairing در DM، گیرنده‌های ضمنی cron یا heartbeat نیستند
    - اگر هیچ allowlistی پیکربندی نشده باشد، شماره خود لینک‌شده به‌صورت پیش‌فرض مجاز است
    - OpenClaw هرگز DMهای خروجی `fromMe` را به‌صورت خودکار pair نمی‌کند (پیام‌هایی که از دستگاه لینک‌شده به خودتان می‌فرستید)

  </Tab>

  <Tab title="Group policy + allowlists">
    دسترسی گروه دو لایه دارد:

    1. **allowlist عضویت گروه** (`channels.whatsapp.groups`)
       - اگر `groups` حذف شده باشد، همه گروه‌ها واجد شرایط هستند
       - اگر `groups` وجود داشته باشد، به‌عنوان allowlist گروه عمل می‌کند (`"*"` مجاز است)

    2. **سیاست فرستنده گروه** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist فرستنده bypass می‌شود
       - `allowlist`: فرستنده باید با `groupAllowFrom` (یا `*`) مطابقت داشته باشد
       - `disabled`: همه ورودی‌های گروه را مسدود می‌کند

    fallback برای allowlist فرستنده:

    - اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا در صورت وجود به `allowFrom` fallback می‌کند
    - allowlistهای فرستنده پیش از فعال‌سازی mention/reply ارزیابی می‌شوند

    نکته: اگر اصلا هیچ بلوک `channels.whatsapp` وجود نداشته باشد، fallback سیاست گروه در زمان اجرا `allowlist` است (با log هشدار)، حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد.

  </Tab>

  <Tab title="Mentions + /activation">
    پاسخ‌های گروهی به‌صورت پیش‌فرض به mention نیاز دارند.

    تشخیص mention شامل این موارد است:

    - mentionهای صریح WhatsApp از هویت bot
    - الگوهای regex mention پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback به `messages.groupChat.mentionPatterns`)
    - transcriptهای voice-note ورودی برای پیام‌های گروهی مجاز
    - تشخیص ضمنی reply-to-bot (فرستنده reply با هویت bot مطابقت دارد)

    نکته امنیتی:

    - quote/reply فقط gate مربوط به mention را برآورده می‌کند؛ به فرستنده مجوز نمی‌دهد
    - با `groupPolicy: "allowlist"`، فرستنده‌هایی که در allowlist نیستند حتی اگر به پیام کاربری در allowlist پاسخ دهند همچنان مسدود می‌شوند

    فرمان فعال‌سازی در سطح نشست:

    - `/activation mention`
    - `/activation always`

    `activation` وضعیت نشست را به‌روزرسانی می‌کند (نه config سراسری). این کار با مالک gate می‌شود.

  </Tab>
</Tabs>

## رفتار شماره شخصی و چت با خود

وقتی شماره خود لینک‌شده نیز در `allowFrom` وجود داشته باشد، محافظت‌های چت با خود WhatsApp فعال می‌شوند:

- رد کردن read receiptها برای نوبت‌های چت با خود
- نادیده گرفتن رفتار auto-trigger مربوط به mention-JID که در غیر این صورت خودتان را ping می‌کند
- اگر `messages.responsePrefix` تنظیم نشده باشد، پاسخ‌های چت با خود به‌صورت پیش‌فرض `[{identity.name}]` یا `[openclaw]` هستند

## نرمال‌سازی پیام و زمینه

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    پیام‌های ورودی WhatsApp در envelope ورودی مشترک wrap می‌شوند.

    اگر پاسخ نقل‌قول‌شده وجود داشته باشد، context به این شکل اضافه می‌شود:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    فیلدهای فراداده reply نیز در صورت موجود بودن پر می‌شوند (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).
    وقتی مقصد reply نقل‌قول‌شده رسانه قابل دانلود باشد، OpenClaw آن را از طریق
    media store ورودی عادی ذخیره می‌کند و به‌صورت `MediaPath`/`MediaType` ارائه می‌دهد تا
    agent بتواند تصویر ارجاع‌شده را بررسی کند، نه اینکه فقط
    `<media:image>` را ببیند.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    پیام‌های ورودی فقط رسانه‌ای با placeholderهایی مانند موارد زیر normalized می‌شوند:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    voice noteهای گروهی مجاز پیش از gate مربوط به mention، وقتی
    body فقط `<media:audio>` باشد، transcript می‌شوند؛ بنابراین گفتن mention مربوط به bot در voice note می‌تواند
    پاسخ را trigger کند. اگر transcript همچنان bot را mention نکند،
    transcript به‌جای placeholder خام در تاریخچه گروه در انتظار نگه داشته می‌شود.

    بدنه‌های location از متن مختصر مختصات استفاده می‌کنند. labelها/commentهای location و جزئیات contact/vCard به‌صورت فراداده نامطمئن fenced render می‌شوند، نه متن prompt inline.

  </Accordion>

  <Accordion title="Pending group history injection">
    برای گروه‌ها، پیام‌های پردازش‌نشده می‌توانند buffer شوند و وقتی bot در نهایت trigger می‌شود، به‌عنوان context تزریق شوند.

    - حد پیش‌فرض: `50`
    - پیکربندی: `channels.whatsapp.historyLimit`
    - جایگزین: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    نشانگرهای تزریق:

    - `[پیام‌های چت از آخرین پاسخ شما - برای زمینه]`
    - `[پیام فعلی - به این پاسخ دهید]`

  </Accordion>

  <Accordion title="تأییدیه‌های خواندن">
    تأییدیه‌های خواندن برای پیام‌های ورودی پذیرفته‌شده‌ی WhatsApp به‌صورت پیش‌فرض فعال هستند.

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

    نوبت‌های چت با خود، حتی وقتی به‌صورت سراسری فعال باشد، تأییدیه‌های خواندن را رد می‌کنند.

  </Accordion>
</AccordionGroup>

## تحویل، قطعه‌بندی، و رسانه

<AccordionGroup>
  <Accordion title="قطعه‌بندی متن">
    - حد پیش‌فرض قطعه: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - حالت `newline` مرزهای پاراگراف را ترجیح می‌دهد (خطوط خالی)، سپس به قطعه‌بندی امن از نظر طول برمی‌گردد

  </Accordion>

  <Accordion title="رفتار رسانه‌ی خروجی">
    - از محموله‌های تصویر، ویدئو، صدا (یادداشت صوتی PTT)، و سند پشتیبانی می‌کند
    - رسانه‌ی صوتی از طریق محموله‌ی `audio` در Baileys با `ptt: true` ارسال می‌شود، بنابراین کلاینت‌های WhatsApp آن را به‌صورت یادداشت صوتی push-to-talk نمایش می‌دهند
    - محموله‌های پاسخ `audioAsVoice` را حفظ می‌کنند؛ خروجی یادداشت صوتی TTS برای WhatsApp حتی وقتی ارائه‌دهنده MP3 یا WebM برمی‌گرداند، روی همین مسیر PTT می‌ماند
    - صدای بومی Ogg/Opus برای سازگاری یادداشت صوتی به‌صورت `audio/ogg; codecs=opus` ارسال می‌شود
    - صدای غیر Ogg، شامل خروجی MP3/WebM از Microsoft Edge TTS، پیش از تحویل PTT با `ffmpeg` به Ogg/Opus تک‌کاناله‌ی 48 kHz تبدیل می‌شود
    - `/tts latest` آخرین پاسخ دستیار را به‌صورت یک یادداشت صوتی ارسال می‌کند و ارسال‌های تکراری برای همان پاسخ را سرکوب می‌کند؛ `/tts chat on|off|default` TTS خودکار را برای چت فعلی WhatsApp کنترل می‌کند
    - پخش GIF متحرک از طریق `gifPlayback: true` در ارسال‌های ویدئویی پشتیبانی می‌شود
    - هنگام ارسال محموله‌های پاسخ چندرسانه‌ای، زیرنویس‌ها روی نخستین مورد رسانه اعمال می‌شوند، به‌جز یادداشت‌های صوتی PTT که صدا را ابتدا و متن قابل مشاهده را جداگانه ارسال می‌کنند، چون کلاینت‌های WhatsApp زیرنویس‌های یادداشت صوتی را به‌طور پایدار نمایش نمی‌دهند
    - منبع رسانه می‌تواند HTTP(S)، `file://`، یا مسیرهای محلی باشد

  </Accordion>

  <Accordion title="محدودیت‌های اندازه‌ی رسانه و رفتار جایگزین">
    - سقف ذخیره‌ی رسانه‌ی ورودی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - سقف ارسال رسانه‌ی خروجی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<accountId>.mediaMaxMb` استفاده می‌کنند
    - تصاویر برای جا شدن در محدودیت‌ها به‌صورت خودکار بهینه می‌شوند (تغییر اندازه/پویش کیفیت)
    - در صورت شکست ارسال رسانه، جایگزینِ مورد اول به‌جای حذف بی‌صدای پاسخ، هشدار متنی ارسال می‌کند

  </Accordion>
</AccordionGroup>

## نقل‌قول کردن پاسخ

WhatsApp از نقل‌قول بومی پاسخ پشتیبانی می‌کند، که در آن پاسخ‌های خروجی به‌صورت قابل مشاهده پیام ورودی را نقل‌قول می‌کنند. آن را با `channels.whatsapp.replyToMode` کنترل کنید.

| مقدار       | رفتار                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | هرگز نقل‌قول نکن؛ به‌صورت پیام ساده ارسال کن                                  |
| `"first"`   | فقط نخستین قطعه‌ی پاسخ خروجی را نقل‌قول کن                             |
| `"all"`     | هر قطعه‌ی پاسخ خروجی را نقل‌قول کن                                      |
| `"batched"` | پاسخ‌های دسته‌ای صف‌شده را نقل‌قول کن، درحالی‌که پاسخ‌های فوری بدون نقل‌قول می‌مانند |

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

`channels.whatsapp.reactionLevel` کنترل می‌کند که عامل تا چه اندازه از واکنش‌های ایموجی در WhatsApp استفاده کند:

| سطح         | واکنش‌های تأیید | واکنش‌های آغازشده توسط عامل | توضیح                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | خیر            | خیر                        | هیچ واکنشی وجود ندارد                              |
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

## واکنش‌های تأیید

WhatsApp از واکنش‌های تأیید فوری هنگام رسید دریافت ورودی از طریق `channels.whatsapp.ackReaction` پشتیبانی می‌کند.
واکنش‌های تأیید توسط `reactionLevel` کنترل می‌شوند — وقتی `reactionLevel` برابر `"off"` باشد، سرکوب می‌شوند.

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

- بلافاصله پس از پذیرش ورودی ارسال می‌شود (پیش از پاسخ)
- شکست‌ها ثبت می‌شوند اما تحویل عادی پاسخ را مسدود نمی‌کنند
- حالت گروهی `mentions` در نوبت‌های فعال‌شده با اشاره واکنش نشان می‌دهد؛ فعال‌سازی گروهی `always` برای این بررسی به‌عنوان دورزننده عمل می‌کند
- WhatsApp از `channels.whatsapp.ackReaction` استفاده می‌کند (`messages.ackReaction` قدیمی اینجا استفاده نمی‌شود)

## چندحسابی و اعتبارنامه‌ها

<AccordionGroup>
  <Accordion title="انتخاب حساب و پیش‌فرض‌ها">
    - شناسه‌های حساب از `channels.whatsapp.accounts` می‌آیند
    - انتخاب حساب پیش‌فرض: اگر `default` وجود داشته باشد همان، وگرنه نخستین شناسه‌ی حساب پیکربندی‌شده (مرتب‌شده)
    - شناسه‌های حساب برای جست‌وجو به‌صورت داخلی نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="مسیرهای اعتبارنامه و سازگاری قدیمی">
    - مسیر احراز هویت فعلی: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - فایل پشتیبان: `creds.json.bak`
    - احراز هویت پیش‌فرض قدیمی در `~/.openclaw/credentials/` همچنان برای جریان‌های حساب پیش‌فرض شناسایی/مهاجرت داده می‌شود

  </Accordion>

  <Accordion title="رفتار خروج">
    `openclaw channels logout --channel whatsapp [--account <id>]` وضعیت احراز هویت WhatsApp را برای آن حساب پاک می‌کند.

    وقتی یک Gateway قابل دسترسی است، logout ابتدا شنونده زنده WhatsApp را برای حساب انتخاب‌شده متوقف می‌کند تا نشست لینک‌شده تا راه‌اندازی مجدد بعدی همچنان پیام دریافت نکند. `openclaw channels remove --channel whatsapp` نیز قبل از غیرفعال‌سازی یا حذف پیکربندی حساب، شنونده زنده را متوقف می‌کند.

    در دایرکتوری‌های احراز هویت قدیمی، `oauth.json` حفظ می‌شود در حالی که فایل‌های احراز هویت Baileys حذف می‌شوند.

  </Accordion>
</AccordionGroup>

## ابزارها، کنش‌ها، و نوشتن پیکربندی

- پشتیبانی ابزار عامل شامل کنش واکنش WhatsApp (`react`) است.
- دروازه‌های کنش:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- نوشتن پیکربندی آغازشده توسط کانال به‌طور پیش‌فرض فعال است (با `channels.whatsapp.configWrites=false` غیرفعال کنید).

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    نشانه: وضعیت کانال گزارش می‌دهد که لینک نشده است.

    رفع:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    نشانه: حساب لینک‌شده با قطع اتصال‌های تکراری یا تلاش‌های اتصال مجدد.

    حساب‌های کم‌فعالیت می‌توانند پس از پایان مهلت معمول پیام همچنان متصل بمانند؛ نگهبان زمانی راه‌اندازی مجدد می‌شود که فعالیت انتقال WhatsApp Web متوقف شود، سوکت بسته شود، یا فعالیت سطح برنامه فراتر از پنجره ایمنی طولانی‌تر خاموش بماند.

    اگر گزارش‌ها `status=408 Request Time-out Connection was lost` تکراری نشان می‌دهند، زمان‌بندی‌های سوکت Baileys را زیر `web.whatsapp` تنظیم کنید. ابتدا `keepAliveIntervalMs` را کمتر از مهلت بیکاری شبکه خود کوتاه کنید و `connectTimeoutMs` را در پیوندهای کند یا پراتلاف افزایش دهید:

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

    اگر `~/.openclaw/logs/whatsapp-health.log` می‌گوید `Gateway inactive` اما `openclaw gateway status` و `openclaw channels status --probe` نشان می‌دهند که Gateway و WhatsApp سالم هستند، `openclaw doctor` را اجرا کنید. در Linux، doctor درباره ورودی‌های crontab قدیمی که هنوز `~/.openclaw/bin/ensure-whatsapp.sh` را فراخوانی می‌کنند هشدار می‌دهد؛ آن ورودی‌های مانده را با `crontab -e` حذف کنید، زیرا cron ممکن است محیط user-bus مربوط به systemd را نداشته باشد و باعث شود آن اسکریپت قدیمی سلامت Gateway را نادرست گزارش کند.

    در صورت نیاز، با `channels login` دوباره لینک کنید.

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    نشانه: `openclaw channels login --channel whatsapp` پیش از نمایش یک کد QR قابل استفاده، با `status=408 Request Time-out` یا قطع اتصال سوکت TLS شکست می‌خورد.

    ورود WhatsApp Web از محیط پروکسی استاندارد میزبان Gateway استفاده می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، گونه‌های حروف کوچک، و `NO_PROXY`). بررسی کنید که فرایند Gateway محیط پروکسی را به ارث می‌برد و `NO_PROXY` با `mmg.whatsapp.net` مطابقت ندارد.

  </Accordion>

  <Accordion title="No active listener when sending">
    وقتی هیچ شنونده Gateway فعالی برای حساب هدف وجود نداشته باشد، ارسال‌های خروجی سریع شکست می‌خورند.

    مطمئن شوید Gateway در حال اجرا است و حساب لینک شده است.

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    ردیف‌های رونوشت چیزی را ثبت می‌کنند که عامل تولید کرده است. تحویل WhatsApp جداگانه بررسی می‌شود: OpenClaw فقط پس از آن‌که Baileys برای دست‌کم یک ارسال متن یا رسانه قابل مشاهده، شناسه پیام خروجی برگرداند، یک پاسخ خودکار را ارسال‌شده تلقی می‌کند.

    واکنش‌های تایید، رسیدهای مستقل پیش از پاسخ هستند. واکنش موفق ثابت نمی‌کند که پاسخ متنی یا رسانه‌ای بعدی توسط WhatsApp پذیرفته شده است.

    گزارش‌های Gateway را برای `auto-reply delivery failed` یا `auto-reply was not accepted by WhatsApp provider` بررسی کنید.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    به این ترتیب بررسی کنید:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - ورودی‌های فهرست مجاز `groups`
    - دروازه‌گذاری اشاره (`requireMention` + الگوهای اشاره)
    - کلیدهای تکراری در `openclaw.json` (JSON5): ورودی‌های بعدی ورودی‌های قبلی را بازنویسی می‌کنند، بنابراین در هر محدوده فقط یک `groupPolicy` نگه دارید

  </Accordion>

  <Accordion title="Bun runtime warning">
    زمان‌اجرای Gateway مربوط به WhatsApp باید از Node استفاده کند. Bun برای عملیات پایدار Gateway مربوط به WhatsApp/Telegram ناسازگار علامت‌گذاری شده است.
  </Accordion>
</AccordionGroup>

## اعلان‌های سیستم

WhatsApp از اعلان‌های سیستم به سبک Telegram برای گروه‌ها و گفت‌وگوهای مستقیم از طریق نگاشت‌های `groups` و `direct` پشتیبانی می‌کند.

سلسله‌مراتب تفکیک برای پیام‌های گروه:

نگاشت مؤثر `groups` ابتدا تعیین می‌شود: اگر حساب `groups` خودش را تعریف کند، به‌طور کامل جایگزین نگاشت ریشه `groups` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی اعلان روی همان نگاشت واحد حاصل اجرا می‌شود:

1. **اعلان سیستم ویژه گروه** (`groups["<groupId>"].systemPrompt`): زمانی استفاده می‌شود که ورودی گروه مشخص در نگاشت وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. اگر `systemPrompt` یک رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ اعلان سیستمی اعمال نمی‌شود.
2. **اعلان سیستم wildcard گروه** (`groups["*"].systemPrompt`): زمانی استفاده می‌شود که ورودی گروه مشخص به‌طور کامل در نگاشت غایب باشد، یا وقتی وجود دارد اما هیچ کلید `systemPrompt` تعریف نمی‌کند.

سلسله‌مراتب تفکیک برای پیام‌های مستقیم:

نگاشت مؤثر `direct` ابتدا تعیین می‌شود: اگر حساب `direct` خودش را تعریف کند، به‌طور کامل جایگزین نگاشت ریشه `direct` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی اعلان روی همان نگاشت واحد حاصل اجرا می‌شود:

1. **پرامپت سیستمی مخصوص گفت‌وگوی مستقیم** (`direct["<peerId>"].systemPrompt`): زمانی استفاده می‌شود که ورودی همتای مشخص در نقشه وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. اگر `systemPrompt` یک رشتهٔ خالی (`""`) باشد، wildcard نادیده گرفته می‌شود و هیچ پرامپت سیستمی اعمال نمی‌شود.
2. **پرامپت سیستمی wildcard برای گفت‌وگوی مستقیم** (`direct["*"].systemPrompt`): زمانی استفاده می‌شود که ورودی همتای مشخص به‌طور کامل در نقشه وجود نداشته باشد، یا وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند.

<Note>
`dms` همچنان سطل سبک override تاریخچه برای هر DM است (`dms.<id>.historyLimit`). overrideهای پرامپت زیر `direct` قرار می‌گیرند.
</Note>

**تفاوت با رفتار چندحسابی Telegram:** در Telegram، `groups` ریشه عمداً برای همهٔ حساب‌ها در یک راه‌اندازی چندحسابی نادیده گرفته می‌شود - حتی حساب‌هایی که هیچ `groups` مخصوص خودشان تعریف نکرده‌اند - تا از دریافت پیام‌های گروه‌هایی که bot عضو آن‌ها نیست جلوگیری شود. WhatsApp این محافظ را اعمال نمی‌کند: `groups` ریشه و `direct` ریشه همیشه توسط حساب‌هایی که override در سطح حساب تعریف نکرده‌اند به ارث برده می‌شوند، فارغ از اینکه چند حساب پیکربندی شده باشد. در یک راه‌اندازی چندحسابی WhatsApp، اگر پرامپت‌های گروه یا گفت‌وگوی مستقیم مخصوص هر حساب می‌خواهید، به‌جای تکیه بر پیش‌فرض‌های سطح ریشه، نقشهٔ کامل را صریحاً زیر هر حساب تعریف کنید.

رفتار مهم:

- `channels.whatsapp.groups` هم نقشهٔ پیکربندی برای هر گروه است و هم allowlist گروه در سطح chat. در محدودهٔ ریشه یا حساب، `groups["*"]` یعنی «همهٔ گروه‌ها برای این محدوده پذیرفته می‌شوند».
- فقط زمانی wildcard گروه `systemPrompt` اضافه کنید که از قبل می‌خواهید آن محدوده همهٔ گروه‌ها را بپذیرد. اگر همچنان می‌خواهید فقط مجموعهٔ ثابتی از شناسه‌های گروه واجد شرایط باشند، از `groups["*"]` برای پیش‌فرض پرامپت استفاده نکنید. به‌جای آن، پرامپت را روی هر ورودی گروهی که صریحاً در allowlist است تکرار کنید.
- پذیرش گروه و مجوز فرستنده دو بررسی جداگانه هستند. `groups["*"]` مجموعهٔ گروه‌هایی را که می‌توانند به پردازش گروه برسند گسترش می‌دهد، اما به‌تنهایی هر فرستنده‌ای را در آن گروه‌ها مجاز نمی‌کند. دسترسی فرستنده همچنان جداگانه توسط `channels.whatsapp.groupPolicy` و `channels.whatsapp.groupAllowFrom` کنترل می‌شود.
- `channels.whatsapp.direct` همین اثر جانبی را برای DMها ندارد. `direct["*"]` فقط پس از آنکه یک DM از طریق `dmPolicy` به‌همراه `allowFrom` یا قواعد pairing-store پذیرفته شد، یک پیکربندی پیش‌فرض برای گفت‌وگوی مستقیم فراهم می‌کند.

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
- چندحسابی: `accounts.<id>.enabled`, `accounts.<id>.authDir`, overrideهای سطح حساب
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

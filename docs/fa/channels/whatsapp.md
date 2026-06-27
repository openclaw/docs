---
read_when:
    - کار روی رفتار کانال WhatsApp/وب یا مسیریابی صندوق ورودی
summary: پشتیبانی کانال WhatsApp، کنترل‌های دسترسی، رفتار تحویل و عملیات
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:15:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: آمادهٔ تولید از طریق WhatsApp Web (Baileys). Gateway مالک نشست‌های پیوندشده است.

## نصب (در صورت نیاز)

- راه‌اندازی اولیه (`openclaw onboard`) و `openclaw channels add --channel whatsapp`
  نخستین باری که WhatsApp plugin را انتخاب می‌کنید، درخواست نصب آن را نشان می‌دهند.
- `openclaw channels login --channel whatsapp` نیز وقتی هنوز plugin حاضر نیست،
  جریان نصب را پیشنهاد می‌کند.
- کانال توسعه + checkout از git: به‌طور پیش‌فرض از مسیر plugin محلی استفاده می‌کند.
- پایدار/بتا: ابتدا plugin رسمی `@openclaw/whatsapp` را از ClawHub نصب می‌کند
  و npm را به‌عنوان جایگزین به‌کار می‌برد.
- runtime مربوط به WhatsApp بیرون از بستهٔ npm هستهٔ OpenClaw توزیع می‌شود تا
  وابستگی‌های runtime ویژهٔ WhatsApp همراه plugin خارجی باقی بمانند.

نصب دستی همچنان در دسترس است:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

فقط وقتی به جایگزین registry نیاز دارید، از بستهٔ خام npm (`@openclaw/whatsapp`) استفاده کنید. فقط وقتی به نصب بازتولیدپذیر نیاز دارید، یک نسخهٔ دقیق را pin کنید.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض DM برای فرستندگان ناشناس جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌ها و playbookهای تعمیر میان‌کانالی.
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

    ورود فعلی مبتنی بر QR است. در محیط‌های راه‌دور یا بدون رابط گرافیکی، پیش از
    شروع ورود مطمئن شوید مسیر قابل‌اعتمادی برای رساندن کد QR زنده به تلفنی دارید
    که آن را scan خواهد کرد.

    برای یک حساب مشخص:

```bash
openclaw channels login --channel whatsapp --account work
```

    برای متصل کردن یک پوشهٔ احراز هویت موجود/سفارشی WhatsApp Web پیش از ورود:

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

    درخواست‌های جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار برای هر کانال به ۳ محدود می‌شوند.

  </Step>
</Steps>

<Note>
OpenClaw توصیه می‌کند در صورت امکان WhatsApp را روی شماره‌ای جداگانه اجرا کنید. (فرادادهٔ کانال و جریان راه‌اندازی برای این چیدمان بهینه شده‌اند، اما چیدمان‌های شمارهٔ شخصی نیز پشتیبانی می‌شوند.)
</Note>

<Warning>
جریان فعلی راه‌اندازی WhatsApp فقط QR است. QRهای نمایش‌داده‌شده در terminal، screenshotها،
PDFها، یا پیوست‌های chat ممکن است هنگام relay شدن از یک ماشین راه‌دور منقضی یا ناخوانا شوند.
برای میزبان‌های راه‌دور/بدون رابط گرافیکی، مسیر تحویل مستقیم تصویر QR را به ثبت دستی از terminal ترجیح دهید.
</Warning>

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="شمارهٔ اختصاصی (توصیه‌شده)">
    این تمیزترین حالت عملیاتی است:

    - هویت WhatsApp جداگانه برای OpenClaw
    - allowlistهای DM و مرزهای routing روشن‌تر
    - احتمال کمتر ابهام ناشی از self-chat

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
    راه‌اندازی اولیه از حالت شمارهٔ شخصی پشتیبانی می‌کند و یک baseline سازگار با self-chat می‌نویسد:

    - `dmPolicy: "allowlist"`
    - `allowFrom` شامل شمارهٔ شخصی شماست
    - `selfChatMode: true`

    در runtime، حفاظت‌های self-chat بر اساس شمارهٔ خودِ پیوندشده و `allowFrom` عمل می‌کنند.

  </Accordion>

  <Accordion title="دامنهٔ کانال فقط WhatsApp Web">
    کانال سکوی پیام‌رسانی در معماری فعلی کانال OpenClaw مبتنی بر WhatsApp Web (`Baileys`) است.

    در registry داخلی chat-channel، کانال پیام‌رسانی جداگانه‌ای برای Twilio WhatsApp وجود ندارد.

  </Accordion>
</AccordionGroup>

## مدل runtime

- Gateway مالک socket WhatsApp و حلقهٔ اتصال مجدد است.
- watchdog اتصال مجدد از فعالیت transport در WhatsApp Web استفاده می‌کند، نه فقط حجم app-message ورودی؛ بنابراین نشست آرام دستگاه پیوندشده صرفاً به این دلیل که اخیراً کسی پیامی نفرستاده، restart نمی‌شود. یک سقف طولانی‌تر سکوت برنامه همچنان اگر frameهای transport برسند اما هیچ پیام برنامه‌ای در بازهٔ watchdog پردازش نشود، اتصال مجدد را اجباری می‌کند؛ پس از اتصال مجدد گذرا برای نشستی که اخیراً فعال بوده، آن بررسی سکوت برنامه در نخستین بازهٔ بازیابی از timeout عادی پیام استفاده می‌کند.
- زمان‌بندی‌های socket در Baileys به‌طور صریح زیر `web.whatsapp.*` هستند: `keepAliveIntervalMs` pingهای برنامهٔ WhatsApp Web را کنترل می‌کند، `connectTimeoutMs` timeout handshake آغازین را کنترل می‌کند، و `defaultQueryTimeoutMs` انتظارهای query در Baileys به‌علاوهٔ کران‌های عملیات ارسال/حضور خروجی محلی و read-receipt ورودی OpenClaw را کنترل می‌کند.
- ارسال‌های خروجی به listener فعال WhatsApp برای حساب هدف نیاز دارند.
- ارسال‌های گروهی برای tokenهای `@+<digits>` و `@<digits>` در متن و captionهای رسانه، وقتی token با فرادادهٔ فعلی شرکت‌کنندهٔ WhatsApp مطابق باشد، از جمله گروه‌های متکی بر LID، فرادادهٔ mention بومی را متصل می‌کنند.
- chatهای status و broadcast نادیده گرفته می‌شوند (`@status`، `@broadcast`).
- watchdog اتصال مجدد از فعالیت transport در WhatsApp Web پیروی می‌کند، نه فقط حجم app-message ورودی: نشست‌های آرام دستگاه پیوندشده تا وقتی frameهای transport ادامه دارند برقرار می‌مانند، اما توقف transport خیلی پیش از مسیر دیرتر disconnect راه‌دور، اتصال مجدد را اجباری می‌کند.
- chatهای مستقیم از قواعد نشست DM استفاده می‌کنند (`session.dmScope`؛ مقدار پیش‌فرض `main`، DMها را به نشست اصلی agent جمع می‌کند).
- نشست‌های گروهی ایزوله‌اند (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters می‌توانند هدف‌های خروجی صریح با JID بومی `@newsletter` خود باشند. ارسال‌های خروجی newsletter به‌جای معناشناسی نشست DM، از فرادادهٔ نشست کانال (`agent:<agentId>:whatsapp:channel:<jid>`) استفاده می‌کنند.
- transport مربوط به WhatsApp Web متغیرهای محیطی استاندارد proxy را روی میزبان gateway رعایت می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، `NO_PROXY` / گونه‌های lowercase). پیکربندی proxy در سطح میزبان را به تنظیمات proxy ویژهٔ کانال WhatsApp ترجیح دهید.
- وقتی `messages.removeAckAfterReply` فعال باشد، OpenClaw پس از تحویل یک پاسخ قابل‌مشاهده، واکنش ack در WhatsApp را پاک می‌کند.

## اعلان‌های تأیید

WhatsApp می‌تواند اعلان‌های تأیید exec و plugin را با واکنش‌های `👍` / `👎` نمایش دهد. تحویل با پیکربندی forwarding تأیید در سطح بالا کنترل می‌شود:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` و `approvals.plugin` مستقل هستند. فعال کردن WhatsApp به‌عنوان یک کانال فقط transport را پیوند می‌دهد؛ مگر اینکه خانوادهٔ تأیید متناظر فعال باشد و به WhatsApp route شود، اعلان‌های تأیید ارسال نمی‌کند. حالت نشست فقط برای تأییدهایی که از WhatsApp منشأ گرفته‌اند، تأییدهای بومی emoji را تحویل می‌دهد. حالت هدف از pipeline مشترک forwarding برای هدف‌های صریح WhatsApp استفاده می‌کند و fanout جداگانهٔ approver-DM ایجاد نمی‌کند.

واکنش‌های تأیید WhatsApp به approverهای صریح WhatsApp از `allowFrom` یا `"*"` نیاز دارند.
`defaultTo` هدف‌های عادی پیش‌فرض پیام را کنترل می‌کند؛ approver تأیید نیست. فرمان‌های دستی
`/approve` همچنان پیش از resolution تأیید از مسیر عادی مجوزدهی فرستندهٔ WhatsApp عبور می‌کنند.

## hookهای Plugin و حریم خصوصی

پیام‌های ورودی WhatsApp می‌توانند شامل محتوای پیام شخصی، شماره تلفن‌ها،
شناسه‌های گروه، نام فرستندگان، و فیلدهای همبستگی نشست باشند. به همین دلیل،
WhatsApp payloadهای hook ورودی `message_received` را به pluginها broadcast نمی‌کند،
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

این را فقط برای pluginهایی فعال کنید که به آن‌ها برای دریافت محتوای پیام ورودی WhatsApp
و شناسه‌ها اعتماد دارید.

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست DM">
    `channels.whatsapp.dmPolicy` دسترسی chat مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند این است که `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `allowFrom` شماره‌های سبک E.164 را می‌پذیرد (درون سیستم normalize می‌شوند).

    `allowFrom` یک فهرست کنترل دسترسی فرستندهٔ DM است. ارسال‌های خروجی صریح به JIDهای گروه WhatsApp یا JIDهای کانال `@newsletter` را gate نمی‌کند.

    override چندحسابی: `channels.whatsapp.accounts.<id>.dmPolicy` (و `allowFrom`) برای آن حساب بر پیش‌فرض‌های سطح کانال تقدم دارند.

    جزئیات رفتار runtime:

    - جفت‌سازی‌ها در allow-store کانال پایدار می‌شوند و با `allowFrom` پیکربندی‌شده merge می‌شوند
    - automation زمان‌بندی‌شده و fallback گیرندهٔ Heartbeat از هدف‌های تحویل صریح یا `allowFrom` پیکربندی‌شده استفاده می‌کنند؛ تأییدهای جفت‌سازی DM گیرنده‌های ضمنی Cron یا Heartbeat نیستند
    - اگر هیچ allowlist پیکربندی نشده باشد، شمارهٔ خودِ پیوندشده به‌طور پیش‌فرض مجاز است
    - OpenClaw هرگز DMهای خروجی `fromMe` را به‌طور خودکار pair نمی‌کند (پیام‌هایی که از دستگاه پیوندشده به خودتان می‌فرستید)

  </Tab>

  <Tab title="سیاست گروه + allowlistها">
    دسترسی گروه دو لایه دارد:

    1. **allowlist عضویت گروه** (`channels.whatsapp.groups`)
       - اگر `groups` حذف شده باشد، همهٔ گروه‌ها واجد شرایط‌اند
       - اگر `groups` حاضر باشد، به‌عنوان allowlist گروه عمل می‌کند (`"*"` مجاز است)

    2. **سیاست فرستندهٔ گروه** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist فرستنده دور زده می‌شود
       - `allowlist`: فرستنده باید با `groupAllowFrom` (یا `*`) مطابق باشد
       - `disabled`: همهٔ ورودی‌های گروهی را مسدود می‌کند

    fallback برای allowlist فرستنده:

    - اگر `groupAllowFrom` تنظیم نشده باشد، runtime در صورت موجود بودن به `allowFrom` fallback می‌کند
    - allowlistهای فرستنده پیش از فعال‌سازی mention/reply ارزیابی می‌شوند

    نکته: اگر هیچ block مربوط به `channels.whatsapp` اصلاً وجود نداشته باشد، fallback سیاست گروه در runtime برابر `allowlist` است (با warning log)، حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد.

  </Tab>

  <Tab title="Mentionها + /activation">
    پاسخ‌های گروهی به‌طور پیش‌فرض به mention نیاز دارند.

    تشخیص mention شامل این موارد است:

    - mentionهای صریح WhatsApp از هویت bot
    - الگوهای regex پیکربندی‌شدهٔ mention (`agents.list[].groupChat.mentionPatterns`، fallback به `messages.groupChat.mentionPatterns`)
    - transcriptهای voice-note ورودی برای پیام‌های گروهی مجاز
    - تشخیص ضمنی reply-to-bot (فرستندهٔ reply با هویت bot مطابق است)

    نکتهٔ امنیتی:

    - quote/reply فقط gate مربوط به mention را برآورده می‌کند؛ مجوز فرستنده اعطا نمی‌کند
    - با `groupPolicy: "allowlist"`، فرستندگان خارج از allowlist حتی اگر به پیام کاربری داخل allowlist پاسخ دهند همچنان مسدود می‌شوند

    فرمان فعال‌سازی در سطح نشست:

    - `/activation mention`
    - `/activation always`

    `activation` وضعیت نشست را به‌روزرسانی می‌کند (نه پیکربندی global). مالک-gated است.

  </Tab>
</Tabs>

## bindingهای ACP پیکربندی‌شده

WhatsApp از bindingهای پایدار ACP با entryهای سطح بالای `bindings[]` پشتیبانی می‌کند:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- چت‌های مستقیم با شماره‌های E.164 مانند `+15555550123` مطابقت دارند.
- گروه‌ها با JIDهای گروه WhatsApp مانند `120363424282127706@g.us` مطابقت دارند.
- فهرست‌های مجاز گروه، سیاست فرستنده، و دروازه‌گذاری بر اساس منشن یا فعال‌سازی پیش از آن اجرا می‌شوند که OpenClaw مطمئن شود نشست پیکربندی‌شده ACP وجود دارد.
- یک اتصال پیکربندی‌شده ACP که مطابقت پیدا کند، مالک مسیر است. گروه‌های پخش WhatsApp آن نوبت را به نشست‌های عادی WhatsApp پخش نمی‌کنند.

## رفتار شماره شخصی و چت با خود

وقتی شماره خودِ متصل‌شده در `allowFrom` هم وجود داشته باشد، محافظ‌های چت با خود WhatsApp فعال می‌شوند:

- رسیدهای خواندن برای نوبت‌های چت با خود رد می‌شوند
- رفتار فعال‌سازی خودکار mention-JID که در غیر این صورت خودتان را پینگ می‌کرد نادیده گرفته می‌شود
- اگر `messages.responsePrefix` تنظیم نشده باشد، پاسخ‌های چت با خود به‌طور پیش‌فرض `[{identity.name}]` یا `[openclaw]` هستند

## عادی‌سازی پیام و زمینه

<AccordionGroup>
  <Accordion title="پاکت ورودی + زمینه پاسخ">
    پیام‌های ورودی WhatsApp در پاکت ورودی مشترک قرار می‌گیرند.

    اگر پاسخ نقل‌شده‌ای وجود داشته باشد، زمینه با این قالب افزوده می‌شود:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    فیلدهای فراداده پاسخ نیز در صورت موجود بودن پر می‌شوند (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, فرستنده JID/E.164).
    وقتی هدف پاسخ نقل‌شده رسانه قابل دانلود باشد، OpenClaw آن را از طریق
    ذخیره‌ساز عادی رسانه ورودی ذخیره می‌کند و به‌صورت `MediaPath`/`MediaType` ارائه می‌دهد تا
    عامل بتواند تصویر ارجاع‌شده را بررسی کند، به‌جای اینکه فقط
    `<media:image>` را ببیند.

  </Accordion>

  <Accordion title="جای‌نگهدارهای رسانه و استخراج مکان/مخاطب">
    پیام‌های ورودی فقط‌رسانه با جای‌نگهدارهایی مانند این‌ها عادی‌سازی می‌شوند:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    یادداشت‌های صوتی گروه‌های مجاز پیش از دروازه‌گذاری منشن رونویسی می‌شوند، وقتی
    بدنه فقط `<media:audio>` باشد؛ بنابراین گفتن منشن ربات در یادداشت صوتی می‌تواند
    پاسخ را فعال کند. اگر رونویس همچنان به ربات اشاره نکند،
    رونویس به‌جای جای‌نگهدار خام در تاریخچه گروه در انتظار نگه داشته می‌شود.

    بدنه‌های مکان از متن مختصر مختصات استفاده می‌کنند. برچسب‌ها/نظرهای مکان و جزئیات مخاطب/vCard به‌صورت فراداده نامطمئن حصارگذاری‌شده رندر می‌شوند، نه متن درون‌خطی پرامپت.

  </Accordion>

  <Accordion title="تزریق تاریخچه در انتظار گروه">
    برای گروه‌ها، پیام‌های پردازش‌نشده می‌توانند بافر شوند و وقتی ربات در نهایت فعال شد، به‌عنوان زمینه تزریق شوند.

    - حد پیش‌فرض: `50`
    - پیکربندی: `channels.whatsapp.historyLimit`
    - جایگزین: `messages.groupChat.historyLimit`
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

    نوبت‌های چت با خود حتی وقتی به‌صورت سراسری فعال باشد، رسیدهای خواندن را رد می‌کنند.

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
    - از بارهای تصویر، ویدئو، صدا (یادداشت صوتی PTT)، و سند پشتیبانی می‌کند
    - رسانه صوتی از طریق بار `audio` در Baileys با `ptt: true` ارسال می‌شود، بنابراین کلاینت‌های WhatsApp آن را به‌صورت یادداشت صوتی فشار-برای-صحبت رندر می‌کنند
    - بارهای پاسخ `audioAsVoice` را حفظ می‌کنند؛ خروجی یادداشت صوتی TTS برای WhatsApp روی همین مسیر PTT می‌ماند، حتی وقتی ارائه‌دهنده MP3 یا WebM برگرداند
    - صدای بومی Ogg/Opus به‌صورت `audio/ogg; codecs=opus` برای سازگاری یادداشت صوتی ارسال می‌شود
    - صدای غیر Ogg، از جمله خروجی MP3/WebM از Microsoft Edge TTS، پیش از تحویل PTT با `ffmpeg` به Ogg/Opus مونو 48 kHz تبدیل می‌شود
    - `/tts latest` آخرین پاسخ دستیار را به‌صورت یک یادداشت صوتی می‌فرستد و ارسال‌های تکراری برای همان پاسخ را سرکوب می‌کند؛ `/tts chat on|off|default` تبدیل خودکار به گفتار را برای چت فعلی WhatsApp کنترل می‌کند
    - پخش GIF متحرک از طریق `gifPlayback: true` در ارسال‌های ویدئویی پشتیبانی می‌شود
    - `forceDocument` / `asDocument` تصاویر، GIFها، و ویدئوهای خروجی را از طریق بار سند Baileys ارسال می‌کند تا از فشرده‌سازی رسانه WhatsApp جلوگیری شود، در حالی که نام فایل و نوع MIME حل‌شده حفظ می‌شود
    - هنگام ارسال بارهای پاسخ چندرسانه‌ای، کپشن‌ها روی نخستین مورد رسانه اعمال می‌شوند، به‌جز یادداشت‌های صوتی PTT که صدا را ابتدا و متن قابل مشاهده را جداگانه می‌فرستند، چون کلاینت‌های WhatsApp کپشن‌های یادداشت صوتی را به‌طور سازگار رندر نمی‌کنند
    - منبع رسانه می‌تواند HTTP(S)، `file://`، یا مسیرهای محلی باشد

  </Accordion>

  <Accordion title="حدود اندازه رسانه و رفتار جایگزین">
    - سقف ذخیره رسانه ورودی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - سقف ارسال رسانه خروجی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<accountId>.mediaMaxMb` استفاده می‌کنند
    - تصاویر به‌طور خودکار بهینه می‌شوند (تغییر اندازه/پیمایش کیفیت) تا در حدود جا شوند، مگر اینکه `forceDocument` / `asDocument` تحویل سند را درخواست کند
    - در صورت شکست ارسال رسانه، جایگزین مورد نخست به‌جای انداختن بی‌صدای پاسخ، هشدار متنی می‌فرستد

  </Accordion>
</AccordionGroup>

## نقل‌قول پاسخ

WhatsApp از نقل‌قول بومی پاسخ پشتیبانی می‌کند، که در آن پاسخ‌های خروجی پیام ورودی را به‌صورت قابل مشاهده نقل می‌کنند. آن را با `channels.whatsapp.replyToMode` کنترل کنید.

| مقدار       | رفتار                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | هرگز نقل‌قول نکن؛ به‌صورت پیام ساده ارسال کن                                  |
| `"first"`   | فقط نخستین قطعه پاسخ خروجی را نقل‌قول کن                             |
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

`channels.whatsapp.reactionLevel` کنترل می‌کند که عامل تا چه گستره‌ای از واکنش‌های ایموجی در WhatsApp استفاده کند:

| سطح         | واکنش‌های تأیید دریافت | واکنش‌های آغازشده توسط عامل | توضیح                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | خیر            | خیر                        | هیچ واکنشی وجود ندارد                              |
| `"ack"`       | بله           | خیر                        | فقط واکنش‌های تأیید دریافت (رسید پیش از پاسخ)           |
| `"minimal"`   | بله           | بله (محافظه‌کارانه)        | تأیید دریافت + واکنش‌های عامل با راهنمایی محافظه‌کارانه |
| `"extensive"` | بله           | بله (تشویق‌شده)          | تأیید دریافت + واکنش‌های عامل با راهنمایی تشویقی   |

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
واکنش‌های تأیید دریافت با `reactionLevel` دروازه‌گذاری می‌شوند — وقتی `reactionLevel` برابر `"off"` باشد سرکوب می‌شوند.

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

نکته‌های رفتاری:

- بلافاصله پس از پذیرفته شدن ورودی ارسال می‌شود (پیش از پاسخ)
- اگر `ackReaction` بدون `emoji` وجود داشته باشد، WhatsApp از ایموجی هویت عامل مسیریابی‌شده استفاده می‌کند و به "👀" برمی‌گردد؛ برای ارسال نکردن واکنش تأیید دریافت، `ackReaction` را حذف کنید یا `emoji: ""` تنظیم کنید
- شکست‌ها ثبت می‌شوند اما تحویل عادی پاسخ را مسدود نمی‌کنند
- حالت گروه `mentions` در نوبت‌های فعال‌شده با منشن واکنش نشان می‌دهد؛ فعال‌سازی گروه `always` برای این بررسی به‌عنوان دورزن عمل می‌کند
- WhatsApp از `channels.whatsapp.ackReaction` استفاده می‌کند (`messages.ackReaction` قدیمی اینجا استفاده نمی‌شود)

## واکنش‌های وضعیت چرخه حیات

`messages.statusReactions.enabled: true` را تنظیم کنید تا WhatsApp طی یک نوبت به‌جای باقی گذاشتن ایموجی رسید ثابت، واکنش تأیید دریافت را جایگزین کند. وقتی فعال باشد، OpenClaw از همان جایگاه واکنش پیام ورودی برای وضعیت‌های چرخه حیات مانند صف‌شده، در حال فکر کردن، فعالیت ابزار، Compaction، انجام‌شده، و خطا استفاده می‌کند.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

نکته‌های رفتاری:

- `channels.whatsapp.ackReaction` همچنان کنترل می‌کند که آیا واکنش‌های وضعیت برای پیام‌های مستقیم و گروه‌ها واجد شرایط هستند یا نه.
- واکنش وضعیت صف‌شده از همان ایموجی مؤثر تأیید دریافتِ واکنش‌های تأیید دریافت ساده استفاده می‌کند.
- WhatsApp برای هر پیام یک جایگاه واکنش ربات دارد، بنابراین به‌روزرسانی‌های چرخه حیات واکنش فعلی را درجا جایگزین می‌کنند.
- `messages.removeAckAfterReply: true` واکنش وضعیت نهایی را پس از نگه‌داشت پیکربندی‌شده انجام‌شده/خطا پاک می‌کند.
- دسته‌های ایموجی ابزار شامل `tool`، `coding`، `web`، `deploy`، `build`، و `concierge` هستند.

## چندحسابی و اعتبارنامه‌ها

<AccordionGroup>
  <Accordion title="انتخاب حساب و پیش‌فرض‌ها">
    - شناسه‌های حساب از `channels.whatsapp.accounts` می‌آیند
    - انتخاب حساب پیش‌فرض: اگر `default` وجود داشته باشد همان، در غیر این صورت نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده)
    - شناسه‌های حساب برای جست‌وجو به‌صورت داخلی عادی‌سازی می‌شوند

  </Accordion>

  <Accordion title="مسیرهای اعتبارنامه و سازگاری قدیمی">
    - مسیر احراز هویت فعلی: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - فایل پشتیبان: `creds.json.bak`
    - احراز هویت پیش‌فرض قدیمی در `~/.openclaw/credentials/` همچنان برای جریان‌های حساب پیش‌فرض شناسایی/مهاجرت داده می‌شود

  </Accordion>

  <Accordion title="رفتار خروج">
    `openclaw channels logout --channel whatsapp [--account <id>]` وضعیت احراز هویت WhatsApp را برای آن حساب پاک می‌کند.

    وقتی یک Gateway در دسترس باشد، خروج ابتدا شنونده زنده WhatsApp را برای حساب انتخاب‌شده متوقف می‌کند تا نشست متصل‌شده تا راه‌اندازی مجدد بعدی به دریافت پیام‌ها ادامه ندهد. `openclaw channels remove --channel whatsapp` نیز پیش از غیرفعال‌سازی یا حذف پیکربندی حساب، شنونده زنده را متوقف می‌کند.

    در دایرکتوری‌های احراز هویت قدیمی، `oauth.json` حفظ می‌شود در حالی که فایل‌های احراز هویت Baileys حذف می‌شوند.

  </Accordion>
</AccordionGroup>

## ابزارها، کنش‌ها، و نوشتن پیکربندی

- پشتیبانی ابزار عامل شامل کنش واکنش WhatsApp (`react`) است.
- دروازه‌های کنش:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- نوشتن پیکربندی آغازشده توسط کانال به‌طور پیش‌فرض فعال است (غیرفعال‌سازی از طریق `channels.whatsapp.configWrites=false`).

## عیب‌یابی

<AccordionGroup>
  <Accordion title="متصل نیست (QR لازم است)">
    نشانه: وضعیت کانال گزارش می‌دهد متصل نیست.

    رفع:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="متصل است اما قطع شده / حلقه اتصال مجدد">
    نشانه: حساب متصل‌شده با قطع‌های تکراری یا تلاش‌های اتصال مجدد.

    حساب‌های کم‌رفت‌وآمد می‌توانند پس از مهلت عادی پیام همچنان متصل بمانند؛ نگهبان
    وقتی فعالیت انتقال WhatsApp Web متوقف شود، سوکت بسته شود، یا
    فعالیت در سطح برنامه فراتر از پنجره ایمنی طولانی‌تر بی‌صدا بماند، راه‌اندازی مجدد می‌کند.

    اگر لاگ‌ها `status=408 Request Time-out Connection was lost` تکرارشونده نشان می‌دهند، زمان‌بندی‌های سوکت Baileys را زیر `web.whatsapp` تنظیم کنید. با کوتاه کردن `keepAliveIntervalMs` به کمتر از مهلت بیکاری شبکه‌تان و افزایش `connectTimeoutMs` روی پیوندهای کند یا پراتلاف شروع کنید:

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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    اگر پس از اصلاح اتصال میزبان و زمان‌بندی، حلقه همچنان ادامه داشت، از دایرکتوری احراز هویت حساب نسخه پشتیبان بگیرید و آن حساب را دوباره پیوند دهید:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    اگر `~/.openclaw/logs/whatsapp-health.log` می‌گوید `Gateway inactive` اما `openclaw gateway status` و `openclaw channels status --probe` نشان می‌دهند Gateway و WhatsApp سالم هستند، `openclaw doctor` را اجرا کنید. در Linux، doctor درباره ورودی‌های قدیمی crontab هشدار می‌دهد که هنوز `~/.openclaw/bin/ensure-whatsapp.sh` را فراخوانی می‌کنند؛ آن ورودی‌های کهنه را با `crontab -e` حذف کنید، چون cron ممکن است محیط user-bus مربوط به systemd را نداشته باشد و باعث شود آن اسکریپت قدیمی سلامت Gateway را اشتباه گزارش کند.

    در صورت نیاز، با `channels login` دوباره پیوند دهید.

  </Accordion>

  <Accordion title="ورود QR پشت پراکسی منقضی می‌شود">
    نشانه: `openclaw channels login --channel whatsapp` پیش از نمایش یک کد QR قابل استفاده با `status=408 Request Time-out` یا قطع اتصال سوکت TLS شکست می‌خورد.

    ورود WhatsApp Web از محیط پراکسی استاندارد میزبان Gateway استفاده می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، گونه‌های حروف کوچک، و `NO_PROXY`). بررسی کنید فرایند Gateway متغیرهای محیطی پراکسی را به ارث می‌برد و `NO_PROXY` با `mmg.whatsapp.net` تطابق ندارد.

  </Accordion>

  <Accordion title="هنگام ارسال شنونده فعالی وجود ندارد">
    وقتی هیچ شنونده Gateway فعالی برای حساب مقصد وجود نداشته باشد، ارسال‌های خروجی سریعاً شکست می‌خورند.

    مطمئن شوید Gateway در حال اجراست و حساب پیوند شده است.

  </Accordion>

  <Accordion title="پاسخ در رونوشت دیده می‌شود اما در WhatsApp نه">
    ردیف‌های رونوشت آنچه agent تولید کرده را ثبت می‌کنند. تحویل WhatsApp جداگانه بررسی می‌شود: OpenClaw فقط پس از اینکه Baileys برای حداقل یک ارسال متن یا رسانه قابل مشاهده، شناسه پیام خروجی برگرداند، یک پاسخ خودکار را ارسال‌شده در نظر می‌گیرد.

    واکنش‌های تأیید، رسیدهای مستقل پیش از پاسخ هستند. واکنش موفق ثابت نمی‌کند که پاسخ متنی یا رسانه‌ای بعدی توسط WhatsApp پذیرفته شده است.

    لاگ‌های Gateway را برای `auto-reply delivery failed` یا `auto-reply was not accepted by WhatsApp provider` بررسی کنید.

  </Accordion>

  <Accordion title="پیام‌های گروهی به‌طور غیرمنتظره نادیده گرفته می‌شوند">
    به این ترتیب بررسی کنید:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - ورودی‌های فهرست مجاز `groups`
    - دروازه‌گذاری mention (`requireMention` + الگوهای mention)
    - کلیدهای تکراری در `openclaw.json` (JSON5): ورودی‌های بعدی قبلی‌ها را بازنویسی می‌کنند، پس برای هر scope فقط یک `groupPolicy` نگه دارید

    اگر `channels.whatsapp.groups` وجود داشته باشد، WhatsApp همچنان می‌تواند پیام‌های گروه‌های دیگر را مشاهده کند، اما OpenClaw آن‌ها را پیش از مسیریابی نشست کنار می‌گذارد. JID گروه را به `channels.whatsapp.groups` اضافه کنید یا `groups["*"]` را اضافه کنید تا همه گروه‌ها پذیرفته شوند، در حالی که مجوز فرستنده زیر `groupPolicy` و `groupAllowFrom` باقی می‌ماند.

  </Accordion>

  <Accordion title="هشدار runtime مربوط به Bun">
    runtime مربوط به Gateway در WhatsApp باید از Node استفاده کند. Bun برای عملیات پایدار Gateway در WhatsApp/Telegram ناسازگار علامت‌گذاری شده است.
  </Accordion>
</AccordionGroup>

## پرامپت‌های سیستمی

WhatsApp از پرامپت‌های سیستمی به سبک Telegram برای گروه‌ها و گفتگوهای مستقیم از طریق نگاشت‌های `groups` و `direct` پشتیبانی می‌کند.

سلسله‌مراتب حل برای پیام‌های گروهی:

نگاشت مؤثر `groups` ابتدا تعیین می‌شود: اگر حساب `groups` خودش را تعریف کند، به‌طور کامل جایگزین نگاشت ریشه `groups` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی پرامپت روی همان نگاشت واحد حاصل اجرا می‌شود:

1. **پرامپت سیستمی ویژه گروه** (`groups["<groupId>"].systemPrompt`): زمانی استفاده می‌شود که ورودی گروه مشخص در نگاشت وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. اگر `systemPrompt` رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ پرامپت سیستمی اعمال نمی‌شود.
2. **پرامپت سیستمی wildcard گروه** (`groups["*"].systemPrompt`): زمانی استفاده می‌شود که ورودی گروه مشخص کاملاً در نگاشت غایب باشد، یا وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند.

سلسله‌مراتب حل برای پیام‌های مستقیم:

نگاشت مؤثر `direct` ابتدا تعیین می‌شود: اگر حساب `direct` خودش را تعریف کند، به‌طور کامل جایگزین نگاشت ریشه `direct` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی پرامپت روی همان نگاشت واحد حاصل اجرا می‌شود:

1. **پرامپت سیستمی ویژه مستقیم** (`direct["<peerId>"].systemPrompt`): زمانی استفاده می‌شود که ورودی همتای مشخص در نگاشت وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. اگر `systemPrompt` رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ پرامپت سیستمی اعمال نمی‌شود.
2. **پرامپت سیستمی wildcard مستقیم** (`direct["*"].systemPrompt`): زمانی استفاده می‌شود که ورودی همتای مشخص کاملاً در نگاشت غایب باشد، یا وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند.

<Note>
`dms` همچنان سطل سبک override تاریخچه برای هر DM است (`dms.<id>.historyLimit`). overrideهای پرامپت زیر `direct` قرار دارند.
</Note>

**تفاوت با رفتار چندحسابی Telegram:** در Telegram، ریشه `groups` عمداً برای همه حساب‌ها در راه‌اندازی چندحسابی سرکوب می‌شود، حتی حساب‌هایی که `groups` خودشان را تعریف نمی‌کنند، تا از دریافت پیام‌های گروهی توسط bot برای گروه‌هایی که عضو آن‌ها نیست جلوگیری شود. WhatsApp این محافظ را اعمال نمی‌کند: ریشه `groups` و ریشه `direct` همیشه توسط حساب‌هایی که override سطح حساب تعریف نمی‌کنند به ارث برده می‌شوند، صرف‌نظر از اینکه چند حساب پیکربندی شده باشد. در راه‌اندازی چندحسابی WhatsApp، اگر پرامپت‌های گروهی یا مستقیم ویژه هر حساب می‌خواهید، نگاشت کامل را صراحتاً زیر هر حساب تعریف کنید، نه اینکه به پیش‌فرض‌های سطح ریشه تکیه کنید.

رفتار مهم:

- `channels.whatsapp.groups` هم یک نگاشت پیکربندی برای هر گروه است و هم فهرست مجاز گروه در سطح گفتگو. در scope ریشه یا حساب، `groups["*"]` یعنی «همه گروه‌ها پذیرفته می‌شوند» برای آن scope.
- فقط زمانی یک wildcard گروهی `systemPrompt` اضافه کنید که از قبل می‌خواهید آن scope همه گروه‌ها را بپذیرد. اگر همچنان می‌خواهید فقط مجموعه ثابتی از شناسه‌های گروه واجد شرایط باشند، از `groups["*"]` برای پیش‌فرض پرامپت استفاده نکنید. در عوض، پرامپت را روی هر ورودی گروهی که صراحتاً در فهرست مجاز است تکرار کنید.
- پذیرش گروه و مجوز فرستنده بررسی‌های جداگانه‌ای هستند. `groups["*"]` مجموعه گروه‌هایی را که می‌توانند به رسیدگی گروهی برسند گسترش می‌دهد، اما به‌تنهایی هر فرستنده‌ای را در آن گروه‌ها مجاز نمی‌کند. دسترسی فرستنده همچنان جداگانه توسط `channels.whatsapp.groupPolicy` و `channels.whatsapp.groupAllowFrom` کنترل می‌شود.
- `channels.whatsapp.direct` همین اثر جانبی را برای DMها ندارد. `direct["*"]` فقط پس از آنکه یک DM توسط `dmPolicy` به‌علاوه `allowFrom` یا قواعد pairing-store پذیرفته شد، یک پیکربندی پیش‌فرض گفتگوی مستقیم فراهم می‌کند.

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

فیلدهای پرسیگنال WhatsApp:

- دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- تحویل: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- چندحسابی: `accounts.<id>.enabled`, `accounts.<id>.authDir`, overrideهای سطح حساب
- عملیات: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- رفتار نشست: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- پرامپت‌ها: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## مرتبط

- [Pairing](/fa/channels/pairing)
- [گروه‌ها](/fa/channels/groups)
- [امنیت](/fa/gateway/security)
- [مسیریابی کانال](/fa/channels/channel-routing)
- [مسیریابی چند-agent](/fa/concepts/multi-agent)
- [عیب‌یابی](/fa/channels/troubleshooting)

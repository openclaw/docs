---
read_when:
    - کار روی رفتار کانال WhatsApp/وب یا مسیریابی صندوق ورودی
summary: پشتیبانی کانال WhatsApp، کنترل‌های دسترسی، رفتار تحویل، و عملیات
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:50:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: آمادهٔ تولید از طریق WhatsApp Web (Baileys). Gateway مالک نشست(های) پیوندشده است.

## نصب (در صورت نیاز)

- راه‌اندازی اولیه (`openclaw onboard`) و `openclaw channels add --channel whatsapp`
  وقتی نخستین بار WhatsApp plugin را انتخاب می‌کنید، درخواست نصب آن را نمایش می‌دهند.
- `openclaw channels login --channel whatsapp` نیز وقتی
  plugin هنوز موجود نیست، جریان نصب را پیشنهاد می‌کند.
- کانال توسعه + checkout گیت: به‌صورت پیش‌فرض از مسیر plugin محلی استفاده می‌کند.
- پایدار/بتا: ابتدا Plugin رسمی `@openclaw/whatsapp` را از ClawHub
  نصب می‌کند، و npm را به‌عنوان fallback به‌کار می‌برد.
- زمان‌اجرای WhatsApp بیرون از بستهٔ npm هستهٔ OpenClaw توزیع می‌شود تا
  وابستگی‌های زمان‌اجرای مخصوص WhatsApp همراه Plugin خارجی بمانند.

نصب دستی همچنان در دسترس است:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

فقط وقتی به fallback رجیستری نیاز دارید از بستهٔ خام npm (`@openclaw/whatsapp`) استفاده کنید.
فقط وقتی به نصب قابل‌بازتولید نیاز دارید، نسخهٔ دقیق را pin کنید.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    سیاست DM پیش‌فرض برای فرستنده‌های ناشناس، جفت‌سازی است.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی‌های بین‌کانالی و راهنماهای تعمیر.
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

    ورود فعلی مبتنی بر QR است. در محیط‌های راه‌دور یا بدون رابط گرافیکی، پیش از شروع ورود مطمئن شوید
    مسیر قابل‌اعتمادی برای رساندن کد QR زنده به گوشی‌ای که آن را اسکن می‌کند
    دارید.

    برای یک حساب مشخص:

```bash
openclaw channels login --channel whatsapp --account work
```

    برای پیوست‌کردن یک پوشهٔ احراز هویت موجود/سفارشی WhatsApp Web پیش از ورود:

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
OpenClaw توصیه می‌کند در صورت امکان WhatsApp را روی یک شمارهٔ جداگانه اجرا کنید. (فرادادهٔ کانال و جریان راه‌اندازی برای این تنظیم بهینه شده‌اند، اما تنظیمات با شمارهٔ شخصی نیز پشتیبانی می‌شوند.)
</Note>

<Warning>
جریان فعلی راه‌اندازی WhatsApp فقط QR است. QRهای رندرشده در ترمینال، اسکرین‌شات‌ها،
PDFها، یا پیوست‌های گفتگو ممکن است هنگام انتقال از یک ماشین راه‌دور
منقضی یا ناخوانا شوند. برای میزبان‌های راه‌دور/بدون رابط گرافیکی، یک مسیر تحویل مستقیم تصویر QR را
به‌جای گرفتن دستی تصویر از ترمینال ترجیح دهید.
</Warning>

## تماس با درخواست‌کنندهٔ فعلی با MeowCaller (آزمایشی)

WhatsApp plugin می‌تواند `whatsapp_call` را در نوبت‌های عاملِ آغازشده از WhatsApp در دسترس قرار دهد. این ابزار
از [MeowCaller](https://github.com/purpshell/meowcaller) برای برقراری تماس صوتی WhatsApp با
درخواست‌کنندهٔ مجاز فعلی استفاده می‌کند و پس از پاسخ‌دادن او، یک پیام TTS از OpenClaw پخش می‌کند. این ابزار
شمارهٔ مقصد نمی‌پذیرد، بنابراین یک prompt نمی‌تواند تماس را به شخص ثالث منتقل کند.
این قابلیت آزمایشی به‌صورت پیش‌فرض غیرفعال است.

<Warning>
MeowCaller آزمایشی است، انتشار برچسب‌خورده ندارد، و از یک نشست دستگاه پیوندشدهٔ whatsmeow
که جداگانه جفت‌سازی شده استفاده می‌کند. نمی‌تواند از اعتبارنامه‌های Baileys متعلق به WhatsApp plugin دوباره استفاده کند. جفت‌سازی
یک دستگاه پیوندشدهٔ دیگر به همان حساب WhatsApp اضافه می‌کند. با هویت WhatsApp استفاده‌شده توسط
OpenClaw اسکن کنید. حالت شمارهٔ شخصی/گفتگوی با خود نمی‌تواند با خودش تماس بگیرد؛ از یک شمارهٔ اختصاصی OpenClaw
برای تماس با شمارهٔ شخصی خود استفاده کنید.
</Warning>

<Steps>
  <Step title="Enable experimental calls">

    `actions.calls: true` را به کانال WhatsApp در `openclaw.json` اضافه کنید:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    این را در پیکربندی موجود WhatsApp خود ادغام کنید، سپس gateway را راه‌اندازی مجدد کنید. وقتی این
    تنظیم وجود ندارد یا `false` است، OpenClaw ابزار `whatsapp_call` را در اختیار عامل قرار نمی‌دهد.

  </Step>

  <Step title="Install the reviewed MeowCaller CLI">

    آداپتر انتظار دارد یک اجرایی با نام `meowcaller` روی `PATH` میزبان gateway وجود داشته باشد.
    تا زمانی که [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) ادغام شود، شاخهٔ
    بازبینی‌شده در commit `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f` را بسازید:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    مطمئن شوید `$HOME/.local/bin` نیز روی `PATH` سرویس gateway قرار دارد. این بازنگری
    دستورهای صریح `pair` و `notify` فقط-ارسال را فراهم می‌کند. `notify` هیچ میکروفون، بلندگو،
    دستگاه ویدئو، مقصد صوت ورودی، یا ضبط عیب‌یابی را باز نمی‌کند. دستور `play` متعلق به CLI نمونه را
    جایگزین نکنید.

  </Step>

  <Step title="Pair the MeowCaller linked device">

    از عامل WhatsApp بخواهید راه‌اندازی تماس را بررسی کند. کنش وضعیت `whatsapp_call`
    پوشهٔ وضعیت مخصوص حساب و دستور جفت‌سازی را گزارش می‌دهد. برای حساب پیش‌فرض:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    دستور را در یک ترمینال تعاملی اجرا کنید. QR آن را از **WhatsApp > Linked devices**
    اسکن کنید و منتظر `MeowCaller linked device ready` بمانید. سپس دستور خارج می‌شود. `wa-voip.db` را
    خصوصی نگه دارید؛ این نشست دستگاه پیوندشدهٔ MeowCaller است. وقتی از حساب غیرپیش‌فرض استفاده می‌کنید، کنش وضعیت `whatsapp_call`
    دستور و shell مخصوص همان حساب را برمی‌گرداند. در
    Windows، دستور PowerShell آن را اجرا کنید؛ MeowCaller پوشهٔ store را ایجاد می‌کند.

  </Step>

  <Step title="Configure TTS and call from WhatsApp">

    یک [ارائه‌دهندهٔ TTS](/fa/tools/tts) با قابلیت تلفنی را پیکربندی کنید، gateway را راه‌اندازی مجدد کنید، سپس یک
    درخواست WhatsApp مانند `Call me and say the build finished.` بفرستید. ابزار فرستنده را
    از زمینهٔ ورودی مورداعتماد تشخیص می‌دهد، یک فایل WAV خصوصی موقت می‌سازد، MeowCaller را برای یک
    پنجرهٔ تماس محدود اجرا می‌کند، و سپس فایل صوتی را حذف می‌کند. OpenClaw store حساب را
    صراحتا ارسال می‌کند، پس از پاسخ، پخش، و قطع تماس منتظر وضعیت خروج صفر می‌ماند، و
    timeout یا خروج غیرصفر را یک فراخوانی ابزار ناموفق تلقی می‌کند.

  </Step>
</Steps>

محدودیت‌های فعلی:

- فقط تماس‌های صوتی خروجی یک‌به‌یک
- بدون شماره‌های مقصد دلخواه
- بدون احراز هویت مشترک با اتصال گفتگو
- بدون تماس با خود در حالت شمارهٔ شخصی/گفتگوی با خود
- صدای ساخته‌شده به ۶۰ ثانیه محدود است
- بدون رسید شنیده‌شدن سمت گوشی، فراتر از تکمیل پاسخ/پخش/قطع تماس MeowCaller
- OpenClaw فرایند همراه را پس از یک پنجرهٔ محدود ۱۱۵ تا ۱۷۵ ثانیه‌ای متوقف می‌کند، شامل
  مراحل اتصال، پاسخ، پخش، و خاموش‌سازی MeowCaller

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    این تمیزترین حالت عملیاتی است:

    - هویت جداگانهٔ WhatsApp برای OpenClaw
    - allowlistهای DM و مرزهای مسیریابی روشن‌تر
    - احتمال کمتر سردرگمی در گفتگوی با خود

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
    راه‌اندازی اولیه از حالت شمارهٔ شخصی پشتیبانی می‌کند و یک مبنای سازگار با گفتگوی با خود می‌نویسد:

    - `dmPolicy: "allowlist"`
    - `allowFrom` شامل شمارهٔ شخصی شما می‌شود
    - `selfChatMode: true`

    در زمان‌اجرا، محافظت‌های گفتگوی با خود بر اساس شمارهٔ خودِ پیوندشده و `allowFrom` عمل می‌کنند.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    کانال سکوی پیام‌رسانی در معماری فعلی کانال OpenClaw مبتنی بر WhatsApp Web (`Baileys`) است.

    در رجیستری داخلی کانال گفتگو، کانال پیام‌رسانی جداگانه‌ای برای Twilio WhatsApp وجود ندارد.

  </Accordion>
</AccordionGroup>

## مدل زمان‌اجرا

- Gateway مالک socket و حلقهٔ اتصال مجدد WhatsApp است.
- دیده‌بان اتصال مجدد از فعالیت انتقال WhatsApp Web استفاده می‌کند، نه فقط حجم پیام‌های ورودی برنامه؛ بنابراین یک نشست دستگاه پیوندشدهٔ کم‌صدا صرفا به این دلیل که اخیرا کسی پیامی نفرستاده، راه‌اندازی مجدد نمی‌شود. یک سقف طولانی‌تر برای سکوت برنامه همچنان اگر فریم‌های انتقال همچنان برسند اما در پنجرهٔ دیده‌بان هیچ پیام برنامه‌ای پردازش نشود، اتصال مجدد را اجبار می‌کند؛ پس از یک اتصال مجدد گذرا برای نشستی که اخیرا فعال بوده، آن بررسی سکوت برنامه برای نخستین پنجرهٔ بازیابی از timeout عادی پیام استفاده می‌کند.
- زمان‌بندی‌های socket در Baileys به‌صورت صریح زیر `web.whatsapp.*` هستند: `keepAliveIntervalMs` pingهای برنامهٔ WhatsApp Web را کنترل می‌کند، `connectTimeoutMs` timeout handshake آغازین را کنترل می‌کند، و `defaultQueryTimeoutMs` انتظارهای query در Baileys به‌علاوهٔ کران‌های عملیات ارسال خروجی/حضور محلی و رسید خواندن ورودی OpenClaw را کنترل می‌کند.
- ارسال‌های خروجی برای حساب هدف به یک listener فعال WhatsApp نیاز دارند.
- ارسال‌های گروهی برای توکن‌های `@+<digits>` و `@<digits>` در متن و captionهای رسانه، وقتی توکن با فرادادهٔ فعلی مشارکت‌کنندهٔ WhatsApp منطبق باشد، از جمله گروه‌های پشتیبانی‌شده با LID، فرادادهٔ mention بومی را پیوست می‌کنند.
- گفتگوهای وضعیت و broadcast نادیده گرفته می‌شوند (`@status`، `@broadcast`).
- دیده‌بان اتصال مجدد فعالیت انتقال WhatsApp Web را دنبال می‌کند، نه فقط حجم پیام‌های ورودی برنامه: نشست‌های دستگاه پیوندشدهٔ کم‌صدا تا وقتی فریم‌های انتقال ادامه دارند برقرار می‌مانند، اما توقف انتقال بسیار پیش از مسیر دیرتر قطع اتصال راه‌دور، اتصال مجدد را اجبار می‌کند.
- گفتگوهای مستقیم از قواعد نشست DM استفاده می‌کنند (`session.dmScope`؛ مقدار پیش‌فرض `main`، DMها را به نشست اصلی عامل فرو می‌ریزد).
- نشست‌های گروهی جدا هستند (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters می‌توانند هدف‌های خروجی صریح با JID بومی `@newsletter` خود باشند. ارسال‌های newsletter خروجی به‌جای معناشناسی نشست DM از فرادادهٔ نشست کانال (`agent:<agentId>:whatsapp:channel:<jid>`) استفاده می‌کنند.
- انتقال WhatsApp Web متغیرهای محیطی proxy استاندارد روی میزبان gateway را رعایت می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، `NO_PROXY` / گونه‌های حروف کوچک). پیکربندی proxy در سطح میزبان را به تنظیمات proxy مخصوص کانال WhatsApp ترجیح دهید.
- وقتی `messages.removeAckAfterReply` فعال باشد، OpenClaw واکنش ack در WhatsApp را پس از تحویل پاسخ قابل‌مشاهده پاک می‌کند.

## promptهای تأیید

WhatsApp می‌تواند promptهای تأیید exec و plugin را با واکنش‌های `👍` / `👎` نمایش دهد. تحویل
با پیکربندی سطح‌بالای forwarding تأیید کنترل می‌شود:

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

`approvals.exec` و `approvals.plugin` مستقل هستند. فعال‌کردن WhatsApp به‌عنوان یک کانال فقط
انتقال را پیوند می‌دهد؛ مگر اینکه خانوادهٔ تأیید متناظر فعال باشد و به WhatsApp مسیریابی شود،
promptهای تأیید ارسال نمی‌کند. حالت نشست، تأییدهای emoji بومی را فقط برای تأییدهایی تحویل می‌دهد که
از WhatsApp آغاز شده‌اند. حالت هدف از pipeline مشترک forwarding برای هدف‌های صریح WhatsApp
استفاده می‌کند و fanout جداگانهٔ approver-DM ایجاد نمی‌کند.

واکنش‌های تأیید WhatsApp به تأییدکننده‌های صریح WhatsApp از `allowFrom` یا `"*"` نیاز دارند.
`defaultTo` هدف‌های پیام پیش‌فرض عادی را کنترل می‌کند؛ approver تأیید نیست. دستورهای دستی
`/approve` همچنان پیش از
حل تأیید، از مسیر عادی مجوزدهی فرستندهٔ WhatsApp عبور می‌کنند.

## hookهای Plugin و حریم خصوصی

پیام‌های ورودی WhatsApp می‌توانند شامل محتوای پیام شخصی، شماره‌های تلفن،
شناسه‌های گروه، نام‌های فرستنده، و فیلدهای هم‌بستگی نشست باشند. به همین دلیل،
WhatsApp payloadهای hook ورودی `message_received` را برای Pluginها پخش نمی‌کند
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

این گزینه را فقط برای Pluginهایی فعال کنید که برای دریافت محتوای پیام ورودی
WhatsApp و شناسه‌ها به آن‌ها اعتماد دارید.

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="خط‌مشی DM">
    `channels.whatsapp.dmPolicy` دسترسی گفت‌وگوی مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند این است که `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `allowFrom` شماره‌هایی به سبک E.164 را می‌پذیرد (به‌صورت داخلی نرمال‌سازی می‌شوند).

    `allowFrom` فهرست کنترل دسترسی فرستنده DM است. ارسال‌های خروجی صریح به JIDهای گروه WhatsApp یا JIDهای کانال `@newsletter` را محدود نمی‌کند.

    بازنویسی چندحسابی: `channels.whatsapp.accounts.<id>.dmPolicy` (و `allowFrom`) برای آن حساب بر پیش‌فرض‌های سطح کانال مقدم هستند.

    جزئیات رفتار زمان اجرا:

    - جفت‌سازی‌ها در allow-store کانال پایدار می‌شوند و با `allowFrom` پیکربندی‌شده ادغام می‌شوند
    - اتوماسیون زمان‌بندی‌شده و fallback گیرنده Heartbeat از مقصدهای تحویل صریح یا `allowFrom` پیکربندی‌شده استفاده می‌کنند؛ تأییدهای جفت‌سازی DM به‌صورت ضمنی گیرنده‌های cron یا heartbeat نیستند
    - اگر هیچ allowlist پیکربندی نشده باشد، شماره خودِ پیوندشده به‌صورت پیش‌فرض مجاز است
    - OpenClaw هرگز DMهای خروجی `fromMe` را به‌صورت خودکار جفت نمی‌کند (پیام‌هایی که از دستگاه پیوندشده برای خودتان می‌فرستید)

  </Tab>

  <Tab title="خط‌مشی گروه + allowlistها">
    دسترسی گروه دو لایه دارد:

    1. **allowlist عضویت گروه** (`channels.whatsapp.groups`)
       - اگر `groups` حذف شود، همه گروه‌ها واجد شرایط هستند
       - اگر `groups` وجود داشته باشد، مانند allowlist گروه عمل می‌کند (`"*"` مجاز است)

    2. **خط‌مشی فرستنده گروه** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist فرستنده نادیده گرفته می‌شود
       - `allowlist`: فرستنده باید با `groupAllowFrom` (یا `*`) مطابقت داشته باشد
       - `disabled`: همه ورودی‌های گروه را مسدود می‌کند

    fallback allowlist فرستنده:

    - اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا در صورت وجود به `allowFrom` برمی‌گردد
    - allowlistهای فرستنده پیش از فعال‌سازی با mention/reply ارزیابی می‌شوند

    نکته: اگر هیچ بلوک `channels.whatsapp` وجود نداشته باشد، fallback خط‌مشی گروه در زمان اجرا `allowlist` است (همراه با یک گزارش هشدار)، حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد.

  </Tab>

  <Tab title="Mentionها + /activation">
    پاسخ‌های گروه به‌صورت پیش‌فرض به mention نیاز دارند.

    تشخیص mention شامل این موارد است:

    - mentionهای صریح WhatsApp از هویت ربات
    - الگوهای regex پیکربندی‌شده برای mention (`agents.list[].groupChat.mentionPatterns`، با fallback به `messages.groupChat.mentionPatterns`)
    - رونوشت‌های voice-note ورودی برای پیام‌های گروه مجاز
    - تشخیص ضمنی reply-to-bot (فرستنده پاسخ با هویت ربات مطابقت دارد)

    نکته امنیتی:

    - quote/reply فقط شرط mention را برآورده می‌کند؛ به فرستنده مجوز نمی‌دهد
    - با `groupPolicy: "allowlist"`، فرستنده‌هایی که در allowlist نیستند همچنان مسدود می‌شوند، حتی اگر به پیام کاربری در allowlist پاسخ دهند

    دستور فعال‌سازی در سطح نشست:

    - `/activation mention`
    - `/activation always`

    `activation` وضعیت نشست را به‌روزرسانی می‌کند (نه پیکربندی سراسری). این کار با مالک محدود می‌شود.

  </Tab>
</Tabs>

## اتصال‌های ACP پیکربندی‌شده

WhatsApp از اتصال‌های پایدار ACP با ورودی‌های سطح بالای `bindings[]` پشتیبانی می‌کند:

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

- گفت‌وگوهای مستقیم با شماره‌های E.164 مانند `+15555550123` مطابقت دارند.
- گروه‌ها با JIDهای گروه WhatsApp مانند `120363424282127706@g.us` مطابقت دارند.
- allowlistهای گروه، خط‌مشی فرستنده، و کنترل mention یا activation پیش از اینکه OpenClaw وجود نشست ACP پیکربندی‌شده را تضمین کند اجرا می‌شوند.
- یک اتصال ACP پیکربندی‌شده که مطابقت داشته باشد مالک مسیر است. گروه‌های پخش WhatsApp آن نوبت را به نشست‌های معمولی WhatsApp پخش نمی‌کنند.

## رفتار شماره شخصی و گفت‌وگو با خود

وقتی شماره خودِ پیوندشده در `allowFrom` نیز وجود داشته باشد، محافظ‌های گفت‌وگوی با خود در WhatsApp فعال می‌شوند:

- رد کردن رسیدهای خواندن برای نوبت‌های گفت‌وگو با خود
- نادیده گرفتن رفتار فعال‌سازی خودکار mention-JID که در غیر این صورت خودتان را ping می‌کند
- اگر `messages.responsePrefix` تنظیم نشده باشد، پاسخ‌های گفت‌وگو با خود به‌صورت پیش‌فرض `[{identity.name}]` یا `[openclaw]` خواهند بود

## نرمال‌سازی پیام و زمینه

<AccordionGroup>
  <Accordion title="پاکت ورودی + زمینه پاسخ">
    پیام‌های ورودی WhatsApp در پاکت ورودی مشترک پیچیده می‌شوند.

    اگر یک پاسخ نقل‌شده وجود داشته باشد، زمینه به این شکل افزوده می‌شود:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    فیلدهای فراداده پاسخ نیز در صورت وجود پر می‌شوند (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 فرستنده).
    وقتی هدف پاسخ نقل‌شده رسانه قابل دانلود باشد، OpenClaw آن را از طریق
    مخزن معمول رسانه ورودی ذخیره می‌کند و آن را به‌صورت `MediaPath`/`MediaType` در دسترس می‌گذارد تا
    عامل بتواند تصویر ارجاع‌شده را بررسی کند، به‌جای اینکه فقط
    `<media:image>` را ببیند.

  </Accordion>

  <Accordion title="placeholderهای رسانه و استخراج مکان/مخاطب">
    پیام‌های ورودی فقط‌رسانه‌ای با placeholderهایی مانند موارد زیر نرمال‌سازی می‌شوند:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    voice-noteهای گروه مجاز پیش از کنترل mention رونویسی می‌شوند، وقتی
    بدنه فقط `<media:audio>` باشد؛ بنابراین گفتن mention ربات در voice-note می‌تواند
    پاسخ را فعال کند. اگر رونوشت همچنان ربات را mention نکند،
    رونوشت به‌جای placeholder خام در تاریخچه معلق گروه نگه داشته می‌شود.

    بدنه‌های مکان از متن مختصر مختصات استفاده می‌کنند. برچسب‌ها/نظرهای مکان و جزئیات مخاطب/vCard به‌صورت فراداده نامطمئن fenced رندر می‌شوند، نه متن inline در prompt.

  </Accordion>

  <Accordion title="تزریق تاریخچه معلق گروه">
    برای گروه‌ها، پیام‌های پردازش‌نشده می‌توانند بافر شوند و وقتی ربات در نهایت فعال شد به‌عنوان زمینه تزریق شوند.

    - حد پیش‌فرض: `50`
    - پیکربندی: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    نشانگرهای تزریق:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="رسیدهای خواندن">
    رسیدهای خواندن به‌صورت پیش‌فرض برای پیام‌های ورودی پذیرفته‌شده WhatsApp فعال هستند.

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

    نوبت‌های گفت‌وگو با خود حتی وقتی به‌صورت سراسری فعال باشند، رسیدهای خواندن را رد می‌کنند.

  </Accordion>
</AccordionGroup>

## تحویل، قطعه‌بندی، و رسانه

<AccordionGroup>
  <Accordion title="قطعه‌بندی متن">
    - حد قطعه پیش‌فرض: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - حالت `newline` مرزهای بند را ترجیح می‌دهد (خطوط خالی)، سپس به قطعه‌بندی ایمن از نظر طول برمی‌گردد

  </Accordion>

  <Accordion title="رفتار رسانه خروجی">
    - از payloadهای تصویر، ویدئو، صدا (voice-note با PTT)، و سند پشتیبانی می‌کند
    - رسانه صوتی از طریق payload `audio` در Baileys با `ptt: true` فرستاده می‌شود، بنابراین کلاینت‌های WhatsApp آن را به‌عنوان voice note فشار-برای-صحبت رندر می‌کنند
    - payloadهای پاسخ `audioAsVoice` را حفظ می‌کنند؛ خروجی voice-note مربوط به TTS برای WhatsApp حتی وقتی provider خروجی MP3 یا WebM برگرداند، روی همین مسیر PTT باقی می‌ماند
    - صدای بومی Ogg/Opus برای سازگاری voice-note به‌صورت `audio/ogg; codecs=opus` فرستاده می‌شود
    - صدای غیر Ogg، از جمله خروجی MP3/WebM مربوط به Microsoft Edge TTS، پیش از تحویل PTT با `ffmpeg` به Ogg/Opus تک‌کاناله 48 kHz تبدیل می‌شود
    - `/tts latest` آخرین پاسخ دستیار را به‌صورت یک voice note می‌فرستد و ارسال‌های تکراری برای همان پاسخ را سرکوب می‌کند؛ `/tts chat on|off|default`، auto-TTS را برای گفت‌وگوی فعلی WhatsApp کنترل می‌کند
    - پخش GIF متحرک با `gifPlayback: true` در ارسال‌های ویدئویی پشتیبانی می‌شود
    - `forceDocument` / `asDocument` تصاویر، GIFها، و ویدئوهای خروجی را از طریق payload سند Baileys می‌فرستد تا از فشرده‌سازی رسانه WhatsApp جلوگیری شود، در حالی که نام فایل و نوع MIME حل‌شده حفظ می‌شود
    - هنگام ارسال payloadهای پاسخ چندرسانه‌ای، captionها روی نخستین آیتم رسانه اعمال می‌شوند، به‌جز voice noteهای PTT که صدا را ابتدا و متن قابل‌مشاهده را جداگانه می‌فرستند، چون کلاینت‌های WhatsApp captionهای voice-note را به‌صورت سازگار رندر نمی‌کنند
    - منبع رسانه می‌تواند HTTP(S)، `file://`، یا مسیرهای محلی باشد

  </Accordion>

  <Accordion title="محدودیت‌های اندازه رسانه و رفتار fallback">
    - سقف ذخیره رسانه ورودی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - سقف ارسال رسانه خروجی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - بازنویسی‌های هر حساب از `channels.whatsapp.accounts.<accountId>.mediaMaxMb` استفاده می‌کنند
    - تصاویر به‌صورت خودکار بهینه می‌شوند (تغییر اندازه/پیمایش کیفیت) تا در محدودیت‌ها جا شوند، مگر اینکه `forceDocument` / `asDocument` تحویل به‌صورت سند را درخواست کند
    - در صورت شکست ارسال رسانه، fallback آیتم اول به‌جای حذف بی‌صدای پاسخ، هشدار متنی می‌فرستد

  </Accordion>
</AccordionGroup>

## نقل‌قول در پاسخ

WhatsApp از نقل‌قول بومی در پاسخ پشتیبانی می‌کند، که در آن پاسخ‌های خروجی به‌صورت قابل‌مشاهده پیام ورودی را نقل می‌کنند. آن را با `channels.whatsapp.replyToMode` کنترل کنید.

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

`channels.whatsapp.reactionLevel` کنترل می‌کند که عامل تا چه گستردگی از واکنش‌های emoji در WhatsApp استفاده کند:

| سطح         | واکنش‌های تأیید دریافت | واکنش‌های آغازشده توسط عامل | توضیح                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | خیر            | خیر                        | هیچ واکنشی وجود ندارد                              |
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

WhatsApp از واکنش‌های تأیید دریافت فوری هنگام دریافت ورودی از طریق `channels.whatsapp.ackReaction` پشتیبانی می‌کند.
واکنش‌های تأیید دریافت با `reactionLevel` کنترل می‌شوند — وقتی `reactionLevel` برابر `"off"` باشد سرکوب می‌شوند.

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

- بلافاصله پس از پذیرش پیام ورودی ارسال می‌شود (پیش از پاسخ)
- اگر `ackReaction` بدون `emoji` وجود داشته باشد، WhatsApp از ایموجی هویت عامل مسیریابی‌شده استفاده می‌کند و در صورت نبود آن به "👀" برمی‌گردد؛ برای نفرستادن واکنش تأیید، `ackReaction` را حذف کنید یا `emoji: ""` را تنظیم کنید
- خطاها ثبت می‌شوند اما تحویل عادی پاسخ را مسدود نمی‌کنند
- حالت گروه `mentions` در نوبت‌هایی که با منشن فعال شده‌اند واکنش می‌دهد؛ فعال‌سازی گروه `always` به‌عنوان میان‌بری برای این بررسی عمل می‌کند
- WhatsApp از `channels.whatsapp.ackReaction` استفاده می‌کند (`messages.ackReaction` قدیمی اینجا استفاده نمی‌شود)

## واکنش‌های وضعیت چرخه حیات

`messages.statusReactions.enabled: true` را تنظیم کنید تا WhatsApp در طول یک نوبت، به‌جای باقی گذاشتن یک ایموجی رسید ثابت، واکنش تأیید را جایگزین کند. وقتی فعال باشد، OpenClaw از همان جایگاه واکنش پیام ورودی برای وضعیت‌های چرخه حیات مانند در صف، در حال فکر کردن، فعالیت ابزار، Compaction، انجام‌شده و خطا استفاده می‌کند.

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

نکات رفتاری:

- `channels.whatsapp.ackReaction` همچنان کنترل می‌کند که واکنش‌های وضعیت برای پیام‌های مستقیم و گروه‌ها واجد شرایط باشند یا نه.
- واکنش وضعیت در صف از همان ایموجی تأیید مؤثرِ واکنش‌های تأیید ساده استفاده می‌کند.
- WhatsApp برای هر پیام یک جایگاه واکنش ربات دارد، بنابراین به‌روزرسانی‌های چرخه حیات واکنش فعلی را درجا جایگزین می‌کنند.
- `messages.removeAckAfterReply: true` واکنش وضعیت نهایی را پس از نگه‌داشت تنظیم‌شده برای انجام‌شده/خطا پاک می‌کند.
- دسته‌های ایموجی ابزار شامل `tool`، `coding`، `web`، `deploy`، `build` و `concierge` هستند.

## چندحسابی و اعتبارنامه‌ها

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - شناسه‌های حساب از `channels.whatsapp.accounts` می‌آیند
    - انتخاب حساب پیش‌فرض: اگر `default` وجود داشته باشد همان، وگرنه نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده)
    - شناسه‌های حساب برای جست‌وجو به‌صورت داخلی نرمال‌سازی می‌شوند

  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - مسیر احراز هویت فعلی: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - فایل پشتیبان: `creds.json.bak`
    - احراز هویت پیش‌فرض قدیمی در `~/.openclaw/credentials/` همچنان برای جریان‌های حساب پیش‌فرض شناسایی/مهاجرت داده می‌شود

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` وضعیت احراز هویت WhatsApp را برای آن حساب پاک می‌کند.

    وقتی یک Gateway در دسترس باشد، خروج ابتدا شنونده زنده WhatsApp را برای حساب انتخاب‌شده متوقف می‌کند تا نشست پیوندخورده تا راه‌اندازی مجدد بعدی همچنان پیام دریافت نکند. `openclaw channels remove --channel whatsapp` نیز پیش از غیرفعال کردن یا حذف پیکربندی حساب، شنونده زنده را متوقف می‌کند.

    در دایرکتوری‌های احراز هویت قدیمی، `oauth.json` حفظ می‌شود و فایل‌های احراز هویت Baileys حذف می‌شوند.

  </Accordion>
</AccordionGroup>

## ابزارها، کنش‌ها و نوشتن پیکربندی

- پشتیبانی ابزار عامل شامل کنش واکنش WhatsApp (`react`) است.
- دروازه‌های کنش:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- نوشتن پیکربندی آغازشده از کانال به‌صورت پیش‌فرض فعال است (از طریق `channels.whatsapp.configWrites=false` غیرفعال کنید).

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    نشانه: وضعیت کانال گزارش می‌دهد که پیوند برقرار نیست.

    رفع مشکل:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    نشانه: حساب پیوندخورده با قطع اتصال‌های تکراری یا تلاش‌های اتصال مجدد.

    حساب‌های کم‌فعالیت می‌توانند پس از مهلت زمانی عادی پیام متصل بمانند؛ نگهبان
    وقتی فعالیت انتقال WhatsApp Web متوقف شود، سوکت بسته شود، یا
    فعالیت سطح برنامه فراتر از پنجره ایمنی طولانی‌تر ساکت بماند، دوباره راه‌اندازی می‌شود.

    اگر لاگ‌ها `status=408 Request Time-out Connection was lost` تکراری نشان می‌دهند،
    زمان‌بندی‌های سوکت Baileys را زیر `web.whatsapp` تنظیم کنید. با کوتاه کردن
    `keepAliveIntervalMs` به کمتر از مهلت بیکاری شبکه‌تان و افزایش
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

    رفع مشکل:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    اگر پس از رفع اتصال میزبان و زمان‌بندی، حلقه ادامه داشت، از
    دایرکتوری احراز هویت حساب پشتیبان بگیرید و آن حساب را دوباره پیوند دهید:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    اگر `~/.openclaw/logs/whatsapp-health.log` می‌گوید `Gateway inactive` اما
    `openclaw gateway status` و `openclaw channels status --probe` نشان می‌دهند
    Gateway و WhatsApp سالم هستند، `openclaw doctor` را اجرا کنید. در Linux، doctor
    درباره ورودی‌های crontab قدیمی که هنوز
    `~/.openclaw/bin/ensure-whatsapp.sh` را فراخوانی می‌کنند هشدار می‌دهد؛ آن ورودی‌های منسوخ را با
    `crontab -e` حذف کنید، چون cron ممکن است محیط user-bus systemd را نداشته باشد و
    باعث شود آن اسکریپت قدیمی سلامت Gateway را اشتباه گزارش کند.

    در صورت نیاز، با `channels login` دوباره پیوند دهید.

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    نشانه: `openclaw channels login --channel whatsapp` پیش از نمایش یک کد QR قابل استفاده، با `status=408 Request Time-out` یا قطع اتصال سوکت TLS شکست می‌خورد.

    ورود WhatsApp Web از محیط پراکسی استاندارد میزبان Gateway استفاده می‌کند (`HTTPS_PROXY`، `HTTP_PROXY`، گونه‌های حروف کوچک، و `NO_PROXY`). بررسی کنید فرایند Gateway محیط پراکسی را به ارث می‌برد و `NO_PROXY` با `mmg.whatsapp.net` تطبیق ندارد.

  </Accordion>

  <Accordion title="No active listener when sending">
    وقتی هیچ شنونده فعال Gateway برای حساب مقصد وجود نداشته باشد، ارسال‌های خروجی سریع شکست می‌خورند.

    مطمئن شوید Gateway در حال اجرا است و حساب پیوند خورده است.

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    ردیف‌های رونوشت آنچه عامل تولید کرده است را ثبت می‌کنند. تحویل WhatsApp جداگانه بررسی می‌شود: OpenClaw فقط پس از آنکه Baileys برای دست‌کم یک ارسال متن یا رسانه قابل مشاهده، شناسه پیام خروجی برگرداند، یک پاسخ خودکار را ارسال‌شده تلقی می‌کند.

    واکنش‌های تأیید رسیدهای مستقلِ پیش از پاسخ هستند. یک واکنش موفق ثابت نمی‌کند که پاسخ متنی یا رسانه‌ای بعدی توسط WhatsApp پذیرفته شده است.

    لاگ‌های Gateway را برای `auto-reply delivery failed` یا `auto-reply was not accepted by WhatsApp provider` بررسی کنید.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    به این ترتیب بررسی کنید:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - ورودی‌های فهرست مجاز `groups`
    - دروازه‌گذاری منشن (`requireMention` + الگوهای منشن)
    - کلیدهای تکراری در `openclaw.json` (JSON5): ورودی‌های بعدی ورودی‌های قبلی را بازنویسی می‌کنند، پس در هر محدوده فقط یک `groupPolicy` نگه دارید

    اگر `channels.whatsapp.groups` وجود داشته باشد، WhatsApp همچنان می‌تواند پیام‌های گروه‌های دیگر را مشاهده کند، اما OpenClaw آن‌ها را پیش از مسیریابی نشست کنار می‌گذارد. JID گروه را به `channels.whatsapp.groups` اضافه کنید یا `groups["*"]` را اضافه کنید تا همه گروه‌ها پذیرفته شوند، درحالی‌که مجوز فرستنده زیر `groupPolicy` و `groupAllowFrom` باقی می‌ماند.

  </Accordion>

  <Accordion title="Bun runtime warning">
    زمان‌اجرای Gateway مربوط به WhatsApp باید از Node استفاده کند. Bun برای عملیات پایدار Gateway در WhatsApp/Telegram ناسازگار علامت‌گذاری شده است.
  </Accordion>
</AccordionGroup>

## پرامپت‌های سیستم

WhatsApp از پرامپت‌های سیستم به سبک Telegram برای گروه‌ها و گفت‌وگوهای مستقیم از طریق نگاشت‌های `groups` و `direct` پشتیبانی می‌کند.

سلسله‌مراتب حل برای پیام‌های گروهی:

نگاشت مؤثر `groups` ابتدا تعیین می‌شود: اگر حساب `groups` خودش را تعریف کند، به‌طور کامل جایگزین نگاشت ریشه `groups` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی پرامپت روی نگاشت منفرد حاصل اجرا می‌شود:

1. **پرامپت سیستم مخصوص گروه** (`groups["<groupId>"].systemPrompt`): وقتی استفاده می‌شود که ورودی گروه مشخص در نگاشت وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. اگر `systemPrompt` یک رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ پرامپت سیستمی اعمال نمی‌شود.
2. **پرامپت سیستم wildcard گروه** (`groups["*"].systemPrompt`): وقتی استفاده می‌شود که ورودی گروه مشخص کاملاً از نگاشت غایب باشد، یا وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند.

سلسله‌مراتب حل برای پیام‌های مستقیم:

نگاشت مؤثر `direct` ابتدا تعیین می‌شود: اگر حساب `direct` خودش را تعریف کند، به‌طور کامل جایگزین نگاشت ریشه `direct` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی پرامپت روی نگاشت منفرد حاصل اجرا می‌شود:

1. **پرامپت سیستم مخصوص پیام مستقیم** (`direct["<peerId>"].systemPrompt`): وقتی استفاده می‌شود که ورودی همتای مشخص در نگاشت وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. اگر `systemPrompt` یک رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ پرامپت سیستمی اعمال نمی‌شود.
2. **پرامپت سیستم wildcard پیام مستقیم** (`direct["*"].systemPrompt`): وقتی استفاده می‌شود که ورودی همتای مشخص کاملاً از نگاشت غایب باشد، یا وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند.

<Note>
`dms` همچنان سطل سبک override تاریخچه برای هر DM است (`dms.<id>.historyLimit`). Overrideهای پرامپت زیر `direct` قرار دارند.
</Note>

**تفاوت با رفتار چندحسابی Telegram:** در Telegram، ریشه `groups` عمداً برای همه حساب‌ها در یک راه‌اندازی چندحسابی سرکوب می‌شود، حتی حساب‌هایی که `groups` خودشان را تعریف نکرده‌اند، تا از دریافت پیام‌های گروهی توسط ربات برای گروه‌هایی که عضو آن‌ها نیست جلوگیری شود. WhatsApp این محافظ را اعمال نمی‌کند: ریشه `groups` و ریشه `direct` همیشه توسط حساب‌هایی که override سطح حساب تعریف نکرده‌اند به ارث برده می‌شوند، صرف‌نظر از اینکه چند حساب پیکربندی شده باشد. در یک راه‌اندازی چندحسابی WhatsApp، اگر پرامپت‌های گروهی یا مستقیم مخصوص هر حساب می‌خواهید، به‌جای تکیه بر پیش‌فرض‌های سطح ریشه، نگاشت کامل را به‌صراحت زیر هر حساب تعریف کنید.

رفتار مهم:

- `channels.whatsapp.groups` هم یک نگاشت پیکربندی برای هر گروه است و هم فهرست مجاز گروه در سطح گفت‌وگو. در محدوده ریشه یا حساب، `groups["*"]` یعنی «همه گروه‌ها پذیرفته می‌شوند» برای آن محدوده.
- فقط زمانی یک `systemPrompt` گروه wildcard اضافه کنید که از قبل می‌خواهید آن محدوده همه گروه‌ها را بپذیرد. اگر همچنان می‌خواهید فقط مجموعه ثابتی از شناسه‌های گروه واجد شرایط باشند، از `groups["*"]` برای پیش‌فرض پرامپت استفاده نکنید. در عوض، پرامپت را روی هر ورودی گروهی که به‌صراحت در فهرست مجاز است تکرار کنید.
- پذیرش گروه و مجوز فرستنده بررسی‌های جداگانه هستند. `groups["*"]` مجموعه گروه‌هایی را که می‌توانند به پردازش گروه برسند گسترش می‌دهد، اما به‌خودی‌خود هر فرستنده‌ای را در آن گروه‌ها مجاز نمی‌کند. دسترسی فرستنده همچنان جداگانه با `channels.whatsapp.groupPolicy` و `channels.whatsapp.groupAllowFrom` کنترل می‌شود.
- `channels.whatsapp.direct` همان اثر جانبی را برای DMها ندارد. `direct["*"]` فقط پس از آنکه یک DM از طریق `dmPolicy` به‌علاوه `allowFrom` یا قواعد pairing-store پذیرفته شد، یک پیکربندی پیش‌فرض گفت‌وگوی مستقیم فراهم می‌کند.

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

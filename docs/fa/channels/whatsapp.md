---
read_when:
    - کار روی رفتار کانال WhatsApp/وب یا مسیریابی صندوق ورودی
summary: پشتیبانی از کانال WhatsApp، کنترل‌های دسترسی، رفتار تحویل و عملیات
title: WhatsApp
x-i18n:
    generated_at: "2026-07-12T09:37:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

وضعیت: آمادهٔ استفاده در محیط عملیاتی از طریق WhatsApp Web ‏(Baileys). ‏Gateway مالک نشست‌های پیوندشده است؛ کانال جداگانه‌ای برای Twilio WhatsApp وجود ندارد.

## نصب

`openclaw onboard` و `openclaw channels add --channel whatsapp` هنگام نخستین انتخاب، نصب Plugin را پیشنهاد می‌کنند؛ اگر Plugin موجود نباشد، `openclaw channels login --channel whatsapp` نیز همین فرایند نصب را ارائه می‌دهد. نسخه‌های توسعه از مسیر محلی Plugin استفاده می‌کنند؛ نصب‌های پایدار/بتا ابتدا `@openclaw/whatsapp` را از ClawHub نصب می‌کنند و در صورت شکست به npm روی می‌آورند. محیط اجرای WhatsApp خارج از بستهٔ اصلی npm متعلق به OpenClaw عرضه می‌شود، بنابراین وابستگی‌های زمان اجرای آن در Plugin خارجی باقی می‌مانند. نصب دستی:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

از بستهٔ خام npm ‏(`@openclaw/whatsapp`) فقط برای مسیر جایگزین رجیستری استفاده کنید؛ فقط زمانی نسخه‌ای دقیق را سنجاق کنید که نصب بازتولیدپذیر لازم باشد.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای فرستندگان ناشناس، جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    راهنماهای تشخیص و تعمیر میان‌کانالی.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و نمونه‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="پیکربندی سیاست دسترسی">

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

  <Step title="پیوند WhatsApp ‏(QR)">

```bash
openclaw channels login --channel whatsapp
```

    ورود فقط از طریق QR انجام می‌شود. در میزبان‌های راه‌دور یا بدون نمایشگر، پیش از آغاز ورود روشی مطمئن برای رساندن QR زنده به تلفن فراهم کنید؛ QRهای نمایش‌داده‌شده در ترمینال، تصاویر صفحه یا پیوست‌های گفتگو ممکن است هنگام انتقال منقضی شوند.

    برای حسابی مشخص:

```bash
openclaw channels login --channel whatsapp --account work
```

    برای متصل‌کردن پوشهٔ احراز هویت موجود یا سفارشی پیش از ورود:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="راه‌اندازی Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="تأیید نخستین درخواست جفت‌سازی (حالت جفت‌سازی)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    درخواست‌های جفت‌سازی پس از ۱ ساعت منقضی می‌شوند؛ تعداد درخواست‌های در انتظار برای هر حساب حداکثر ۳ مورد است.

  </Step>
</Steps>

<Note>
استفاده از شماره‌ای جداگانه برای WhatsApp توصیه می‌شود (راه‌اندازی و فراداده برای آن بهینه شده‌اند)، اما تنظیمات مبتنی بر شمارهٔ شخصی یا گفت‌وگو با خود نیز به‌طور کامل پشتیبانی می‌شوند.
</Note>

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="شمارهٔ اختصاصی (توصیه‌شده)">
    - هویت جداگانهٔ WhatsApp برای OpenClaw
    - فهرست‌های مجاز پیام مستقیم و مرزهای مسیریابی شفاف‌تر
    - احتمال کمتر سردرگمی در گفت‌وگو با خود

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

  <Accordion title="مسیر جایگزین شمارهٔ شخصی">
    فرایند آغازین از حالت شمارهٔ شخصی پشتیبانی می‌کند و یک پیکربندی پایهٔ سازگار با گفت‌وگو با خود می‌نویسد: `dmPolicy: "allowlist"`، مقدار `allowFrom` شامل شمارهٔ خودتان و `selfChatMode: true`. محافظت‌های زمان اجرا برای گفت‌وگو با خود بر اساس شمارهٔ خودِ پیوندشده به‌همراه `allowFrom` عمل می‌کنند.
  </Accordion>
</AccordionGroup>

## مدل زمان اجرا

- ‏Gateway مالک سوکت WhatsApp و حلقهٔ اتصال مجدد است.
- یک پایشگر نگهبان دو سیگنال را مستقل از یکدیگر ردیابی می‌کند: فعالیت خام انتقال WhatsApp Web و فعالیت پیام‌های برنامه. نشستی که بی‌فعالیت اما متصل است، صرفاً به‌دلیل نرسیدن پیام در زمان اخیر راه‌اندازی مجدد نمی‌شود؛ اتصال مجدد فقط زمانی اجباری می‌شود که دریافت فریم‌های انتقال برای یک بازهٔ داخلی ثابت (غیرقابل پیکربندی توسط کاربر) متوقف شود یا پیام‌های برنامه بیش از ۴ برابر مهلت عادی پیام ساکت بمانند. بلافاصله پس از اتصال مجدد نشستی که اخیراً فعال بوده است، نخستین بازه به‌جای بازهٔ ۴ برابری از مهلت کوتاه‌تر و عادی پیام استفاده می‌کند. OpenClaw می‌تواند به پیام‌های آفلاینی که Baileys در ابتدای آن اتصال مجدد تحویل می‌دهد پاسخ خودکار دهد؛ این رفتار به طول عمر حذف تکراری بر اساس شناسهٔ پیام ورودی محدود است. راه‌اندازی اولیه همچنان از محافظ کوتاه تاریخچهٔ کهنه استفاده می‌کند.
- زمان‌بندی‌های سوکت Baileys به‌صراحت زیر `web.whatsapp.*` تعریف می‌شوند: `keepAliveIntervalMs` (فاصلهٔ پینگ برنامه)، `connectTimeoutMs` (مهلت دست‌دهی آغاز اتصال)، `defaultQueryTimeoutMs` (انتظار برای پرس‌وجوهای Baileys، به‌علاوهٔ مهلت‌های ارسال خروجی، اعلام حضور و رسید خواندن ورودی در OpenClaw).
- ارسال‌های خروجی نیازمند شنوندهٔ فعال WhatsApp برای حساب مقصد هستند؛ در غیر این صورت، ارسال فوراً شکست می‌خورد.
- ارسال‌های گروهی برای توکن‌های `@+<digits>` و `@<digits>` در متن و زیرنویس رسانه، هنگامی که توکن با فرادادهٔ فعلی شرکت‌کننده مطابقت داشته باشد، فرادادهٔ بومی اشاره را ضمیمه می‌کنند؛ این قابلیت گروه‌های مبتنی بر LID را نیز شامل می‌شود.
- گفت‌وگوهای وضعیت و انتشار همگانی (`@status`، `@broadcast`) نادیده گرفته می‌شوند.
- گفت‌وگوهای مستقیم از قواعد نشست پیام مستقیم استفاده می‌کنند (`session.dmScope`؛ مقدار پیش‌فرض `main` پیام‌های مستقیم را در نشست اصلی عامل ادغام می‌کند). نشست‌های گروهی برای هر JID جدا هستند (`agent:<agentId>:whatsapp:group:<jid>`).
- کانال‌ها/خبرنامه‌های WhatsApp می‌توانند با JID بومی `@newsletter` خود، مقصد صریح خروجی باشند و به‌جای معنای پیام مستقیم از فرادادهٔ نشست کانال (`agent:<agentId>:whatsapp:channel:<jid>`) استفاده کنند.
- انتقال WhatsApp Web از متغیرهای استاندارد محیطی پراکسی روی میزبان Gateway ‏(`HTTPS_PROXY`، `HTTP_PROXY`، `NO_PROXY` و گونه‌های حروف کوچک) پیروی می‌کند. پیکربندی پراکسی در سطح میزبان را بر تنظیمات مختص هر کانال ترجیح دهید.
- با فعال‌بودن `messages.removeAckAfterReply`، پس از تحویل یک پاسخ قابل‌مشاهده، OpenClaw واکنش تأیید را پاک می‌کند.

## تماس با درخواست‌کنندهٔ فعلی از طریق MeowCaller (آزمایشی)

Plugin می‌تواند در نوبت‌های عامل که از WhatsApp آغاز شده‌اند، `whatsapp_call` را در دسترس قرار دهد. این قابلیت از [MeowCaller](https://github.com/purpshell/meowcaller) برای برقراری تماس صوتی WhatsApp با درخواست‌کنندهٔ فعلی و مجاز و پخش پیام TTS متعلق به OpenClaw پس از پاسخ‌دادن او استفاده می‌کند. ابزار هیچ پارامتری برای شمارهٔ مقصد ندارد، بنابراین یک درخواست نمی‌تواند تماس را به مقصد دیگری هدایت کند. این قابلیت به‌طور پیش‌فرض غیرفعال است.

<Warning>
MeowCaller آزمایشی است، نسخهٔ برچسب‌خورده‌ای ندارد و از یک نشست دستگاه پیوندشدهٔ whatsmeow با جفت‌سازی جداگانه استفاده می‌کند؛ نمی‌تواند از اعتبارنامه‌های Baileys متعلق به Plugin دوباره استفاده کند. جفت‌سازی، دستگاه پیوندشدهٔ دیگری را به همان حساب WhatsApp اضافه می‌کند؛ کد را با هویتی اسکن کنید که OpenClaw از آن استفاده می‌کند. حالت شمارهٔ شخصی یا گفت‌وگو با خود نمی‌تواند با خودش تماس بگیرد؛ برای تماس با شمارهٔ شخصی خود از شماره‌ای اختصاصی برای OpenClaw استفاده کنید.
</Warning>

<Steps>
  <Step title="فعال‌کردن تماس‌های آزمایشی">

    `actions.calls: true` را به پیکربندی کانال WhatsApp اضافه و Gateway را راه‌اندازی مجدد کنید:

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

    وقتی این مقدار وجود نداشته باشد یا `false` باشد، OpenClaw ابزار `whatsapp_call` را در دسترس قرار نمی‌دهد.

  </Step>

  <Step title="نصب CLI بازبینی‌شدهٔ MeowCaller">

    سازگارکننده انتظار دارد فایل اجرایی `meowcaller` در `PATH` میزبان Gateway موجود باشد. تا زمان ادغام [درخواست ادغام شمارهٔ ۷ MeowCaller](https://github.com/purpshell/meowcaller/pull/7)، شاخهٔ بازبینی‌شده را بسازید:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    مطمئن شوید `$HOME/.local/bin` در `PATH` سرویس Gateway قرار دارد. این بازبینی دارای فرمان‌های صریح `pair` و `notify` فقط‌ارسال است؛ `notify` هیچ میکروفون، بلندگو، دستگاه ویدئویی یا ضبط تشخیصی را باز نمی‌کند. فرمان `play` متعلق به CLI نمونهٔ بالادستی را جایگزین آن نکنید.

  </Step>

  <Step title="جفت‌سازی دستگاه پیوندشدهٔ MeowCaller">

    از عامل WhatsApp بخواهید راه‌اندازی تماس را بررسی کند (کنش وضعیت `whatsapp_call`، پوشهٔ وضعیت مختص حساب و فرمان جفت‌سازی را گزارش می‌کند). برای حساب پیش‌فرض:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    این فرمان را به‌صورت تعاملی اجرا کنید، QR را از مسیر **WhatsApp > Linked devices** اسکن کنید و منتظر پیام `MeowCaller linked device ready` بمانید. `wa-voip.db` را خصوصی نگه دارید؛ این فایل نشست MeowCaller است. حساب‌های غیراصلی مسیر ذخیره‌سازی خود را از کنش وضعیت دریافت می‌کنند؛ در Windows، فرمان PowerShell مربوط به آن را اجرا کنید.

  </Step>

  <Step title="پیکربندی TTS و تماس از WhatsApp">

    یک [ارائه‌دهندهٔ TTS](/fa/tools/tts) با قابلیت تلفنی پیکربندی کنید، Gateway را راه‌اندازی مجدد کنید و سپس درخواستی مانند `با من تماس بگیر و بگو ساخت تمام شد.` ارسال کنید. ابزار، فرستنده را از زمینهٔ ورودی مورد اعتماد تشخیص می‌دهد، یک فایل WAV خصوصی و موقت تولید می‌کند، MeowCaller را برای بازهٔ زمانی محدود تماس اجرا می‌کند و سپس فایل صوتی را حذف می‌کند. OpenClaw محل ذخیره‌سازی حساب را صریحاً ارسال می‌کند، پس از پاسخ، پخش و قطع تماس منتظر وضعیت خروج صفر می‌ماند و پایان مهلت یا وضعیت خروج غیرصفر را تماس ناموفق ابزار در نظر می‌گیرد.

  </Step>
</Steps>

محدودیت‌ها: فقط تماس‌های صوتی خروجی یک‌به‌یک، بدون شماره‌های مقصد دلخواه، بدون احراز هویت مشترک با اتصال گفتگو، بدون تماس با خود در حالت شمارهٔ شخصی یا گفت‌وگو با خود، صدای تولیدشده با سقف ۶۰ ثانیه، بدون رسید شنیده‌شدن در سمت گوشی فراتر از تکمیل پاسخ، پخش و قطع تماس در MeowCaller، و OpenClaw فرایند همراه را پس از بازهٔ محدود ۱۱۵ تا ۱۷۵ ثانیه متوقف می‌کند (شامل مراحل اتصال، پاسخ، پخش و خاموش‌شدن MeowCaller).

## درخواست‌های تأیید

WhatsApp می‌تواند درخواست‌های تأیید اجرای فرمان و Plugin را به‌شکل واکنش‌های `👍`/`👎` نمایش دهد؛ این رفتار با پیکربندی سطح بالای انتقال تأیید کنترل می‌شود:

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

`approvals.exec` و `approvals.plugin` مستقل هستند؛ فعال‌کردن WhatsApp به‌عنوان کانال فقط انتقال را پیوند می‌دهد و تا زمانی که خانوادهٔ تأیید متناظر فعال و به آنجا مسیریابی نشده باشد چیزی ارسال نمی‌کند. حالت نشست، تأییدهای بومی ایموجی را فقط برای تأییدهایی تحویل می‌دهد که از WhatsApp سرچشمه گرفته‌اند. حالت مقصد از خط لولهٔ مشترک انتقال برای مقصدهای صریح استفاده می‌کند و انتشار جداگانهٔ پیام مستقیم به تأییدکنندگان ایجاد نمی‌کند.

واکنش‌های تأیید WhatsApp به تأییدکنندگان صریح در `allowFrom` (یا `"*"`) نیاز دارند. `defaultTo` مقصدهای عادی و پیش‌فرض پیام را تعیین می‌کند، نه فهرست تأییدکنندگان را. فرمان‌های دستی `/approve` نیز پیش از حل تأیید، از مسیر عادی مجوزدهی فرستنده در WhatsApp عبور می‌کنند.

## قلاب‌های Plugin و حریم خصوصی

پیام‌های ورودی WhatsApp ممکن است محتوای شخصی، شماره‌های تلفن، شناسه‌های گروه، نام فرستندگان و فیلدهای هم‌بستگی نشست را دربر داشته باشند. WhatsApp بارهای قلاب ورودی `message_received` را برای Pluginها منتشر نمی‌کند، مگر اینکه آن را صریحاً فعال کنید:

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

فعال‌سازی را با `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` به یک حساب محدود کنید. این گزینه را فقط برای Pluginهایی فعال کنید که برای دسترسی به محتوا و شناسه‌های ورودی WhatsApp به آن‌ها اعتماد دارید.

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.whatsapp.dmPolicy`:

    | مقدار | رفتار |
    | --- | --- |
    | `pairing` (پیش‌فرض) | فرستندگان ناشناس درخواست جفت‌سازی می‌دهند؛ مالک تأیید می‌کند |
    | `allowlist` | فقط فرستندگان موجود در `allowFrom` پذیرفته می‌شوند |
    | `open` | مستلزم وجود `"*"` در `allowFrom` است |
    | `disabled` | همهٔ پیام‌های مستقیم را مسدود می‌کند |

    `allowFrom` شماره‌های به‌سبک E.164 را می‌پذیرد (به‌صورت داخلی نرمال‌سازی می‌شوند). این فقط فهرست کنترل دسترسی فرستندگان پیام مستقیم است و ارسال‌های خروجی صریح به JIDهای گروه یا JIDهای کانال `@newsletter` را محدود نمی‌کند.

    بازنویسی چندحسابی: `channels.whatsapp.accounts.<id>.dmPolicy` (و `.allowFrom`) برای آن حساب بر مقادیر پیش‌فرض سطح کانال اولویت دارند.

    نکات زمان اجرا:

    - جفت‌سازی‌ها در مخزن مجازهای کانال ماندگار می‌شوند و با `allowFrom` پیکربندی‌شده ادغام می‌شوند
    - خودکارسازی زمان‌بندی‌شده و سازوکار بازگشت گیرنده Heartbeat از مقصدهای صریح تحویل یا `allowFrom` پیکربندی‌شده استفاده می‌کنند؛ تأییدهای جفت‌سازی پیام خصوصی به‌طور ضمنی گیرنده Cron یا Heartbeat محسوب نمی‌شوند
    - اگر هیچ فهرست مجازی پیکربندی نشده باشد، شماره خودِ پیوندشده به‌طور پیش‌فرض مجاز است
    - OpenClaw هرگز پیام‌های خصوصی خروجی `fromMe` را به‌طور خودکار جفت نمی‌کند (پیام‌هایی که از دستگاه پیوندشده برای خودتان می‌فرستید)

  </Tab>

  <Tab title="خط‌مشی گروه و فهرست‌های مجاز">
    دسترسی گروه دو لایه دارد:

    1. **فهرست مجاز عضویت گروه** (`channels.whatsapp.groups`): اگر `groups` حذف شده باشد، همه گروه‌ها واجد شرایط‌اند؛ اگر وجود داشته باشد، به‌عنوان فهرست مجاز گروه عمل می‌کند (`"*"` همه را می‌پذیرد).
    2. **خط‌مشی فرستنده گروه** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): مقدار `open` فهرست مجاز فرستنده را دور می‌زند، `allowlist` به تطابق با `groupAllowFrom` (یا `*`) نیاز دارد و `disabled` همه پیام‌های ورودی گروه را مسدود می‌کند.

    اگر `groupAllowFrom` تنظیم نشده باشد، در صورت وجود ورودی در `allowFrom`، بررسی فرستنده از آن به‌عنوان سازوکار بازگشت استفاده می‌کند. فهرست‌های مجاز فرستنده پیش از فعال‌سازی با اشاره/پاسخ ارزیابی می‌شوند.

    اگر اصلاً هیچ بلوک `channels.whatsapp` وجود نداشته باشد، زمان اجرا به `groupPolicy: "allowlist"` بازمی‌گردد (همراه با ثبت هشدار)، حتی اگر `channels.defaults.groupPolicy` روی مقدار دیگری تنظیم شده باشد.

    <Note>
    حل عضویت گروه برای حالت تک‌حساب یک شبکه ایمنی دارد: اگر فقط یک حساب WhatsApp پیکربندی شده باشد و `accounts.<id>.groups` آن صراحتاً یک شیء خالی (`{}`) باشد، این حالت «تنظیم‌نشده» تلقی می‌شود و به‌جای مسدودکردن بی‌سروصدای همه گروه‌ها، به نگاشت ریشه `channels.whatsapp.groups` بازمی‌گردد. با پیکربندی ۲ حساب یا بیشتر، نگاشت صریحاً خالی حساب، خالی باقی می‌ماند و بازگشت انجام نمی‌شود — این امکان می‌دهد یک حساب عمداً همه گروه‌ها را بدون اثرگذاری بر حساب‌های هم‌سطح غیرفعال کند.
    </Note>

  </Tab>

  <Tab title="اشاره‌ها و /activation">
    پاسخ‌های گروه به‌طور پیش‌فرض به اشاره نیاز دارند. تشخیص اشاره شامل موارد زیر است:

    - اشاره‌های صریح WhatsApp به هویت ربات
    - الگوهای عبارت منظم اشاره که پیکربندی شده‌اند (`agents.list[].groupChat.mentionPatterns`، با سازوکار بازگشت به `messages.groupChat.mentionPatterns`)
    - رونوشت یادداشت‌های صوتی ورودی برای پیام‌های مجاز گروه
    - تشخیص ضمنی پاسخ به ربات (فرستنده پاسخ با هویت ربات مطابقت دارد)

    امنیت: نقل‌قول/پاسخ فقط شرط اشاره را برآورده می‌کند — و **مجوز فرستنده را اعطا نمی‌کند**. با `groupPolicy: "allowlist"`، فرستندگانی که در فهرست مجاز نیستند، حتی هنگام پاسخ به پیام کاربری مجاز نیز مسدود می‌مانند.

    فرمان فعال‌سازی در سطح نشست: `/activation mention` یا `/activation always`. این فرمان وضعیت نشست را به‌روزرسانی می‌کند (نه پیکربندی سراسری) و به مالک محدود است.

  </Tab>
</Tabs>

## اتصال‌های پیکربندی‌شده ACP

WhatsApp از اتصال‌های ماندگار ACP از طریق `bindings[]` در سطح بالا پشتیبانی می‌کند:

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

گفت‌وگوهای مستقیم با شماره‌های E.164 مطابقت دارند؛ گروه‌ها با JIDهای گروه WhatsApp مطابقت دارند. فهرست‌های مجاز گروه، خط‌مشی فرستنده و شرط اشاره/فعال‌سازی پیش از آن اجرا می‌شوند که OpenClaw از وجود نشست متصل ACP اطمینان حاصل کند. اتصال منطبق، مالک مسیر است — گروه‌های پخش آن نوبت را به نشست‌های عادی WhatsApp توزیع نمی‌کنند.

## رفتار شماره شخصی و گفت‌وگو با خود

هنگامی که شماره خودِ پیوندشده در `allowFrom` نیز وجود داشته باشد، حفاظت‌های گفت‌وگو با خود فعال می‌شوند: رسید خواندن برای نوبت‌های گفت‌وگو با خود ارسال نمی‌شود، رفتار فعال‌سازی خودکار با JID اشاره که باعث اعلان برای خودتان می‌شود نادیده گرفته می‌شود و هنگامی که `messages.responsePrefix` تنظیم نشده باشد، پاسخ‌ها به‌طور پیش‌فرض با `[{identity.name}]` (یا `[openclaw]`) آغاز می‌شوند.

## نرمال‌سازی پیام و زمینه

<AccordionGroup>
  <Accordion title="پوش ورودی و زمینه پاسخ">
    پیام‌های ورودی در پوش ورودی مشترک قرار می‌گیرند. پاسخ نقل‌قول‌شده، زمینه را با قالب زیر اضافه می‌کند:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    فراداده پاسخ (`ReplyToId`، `ReplyToBody`، `ReplyToSender`، JID/E.164 فرستنده) در صورت دسترس‌بودن پر می‌شود. اگر مقصد نقل‌قول‌شده رسانه قابل‌بارگیری باشد، OpenClaw آن را از طریق مخزن عادی رسانه ورودی ذخیره می‌کند و `MediaPath`/`MediaType` را در دسترس قرار می‌دهد تا عامل بتواند به‌جای مشاهده صرفِ `<media:image>`، آن را مستقیماً بررسی کند.

  </Accordion>

  <Accordion title="جای‌نگهدارهای رسانه و استخراج مکان/مخاطب">
    پیام‌های صرفاً رسانه‌ای به جای‌نگهدارها نرمال می‌شوند: `<media:image>`، `<media:video>`، `<media:audio>`، `<media:document>`، `<media:sticker>`.

    هنگامی که بدنه فقط `<media:audio>` باشد، یادداشت‌های صوتی مجاز گروه پیش از اعمال شرط اشاره رونویسی می‌شوند؛ بنابراین گفتن اشاره ربات در یادداشت صوتی می‌تواند پاسخ را فعال کند. اگر رونوشت همچنان به ربات اشاره نکند، به‌جای جای‌نگهدار خام در تاریخچه در انتظار گروه باقی می‌ماند.

    بدنه‌های مکان به‌صورت متن مختصر مختصات نمایش داده می‌شوند. برچسب‌ها/نظرهای مکان و جزئیات مخاطب/vCard به‌صورت فراداده غیرقابل‌اعتماد محصور در حصار کد نمایش داده می‌شوند، نه به‌عنوان متن درون‌خطی پرامپت.

  </Accordion>

  <Accordion title="تزریق تاریخچه در انتظار گروه">
    پیام‌های پردازش‌نشده گروه بافر می‌شوند و هنگامی که ربات سرانجام فعال شود، به‌عنوان زمینه تزریق می‌شوند.

    - محدودیت پیش‌فرض: `50`
    - پیکربندی: `channels.whatsapp.historyLimit`، با سازوکار بازگشت به `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    نشانگرهای تزریق: `[پیام‌های گفت‌وگو از زمان آخرین پاسخ شما - برای زمینه]` و `[پیام فعلی - به این پاسخ دهید]`.

  </Accordion>

  <Accordion title="رسیدهای خواندن">
    برای پیام‌های ورودی پذیرفته‌شده به‌طور پیش‌فرض فعال است. غیرفعال‌سازی سراسری:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    بازنویسی برای هر حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts`. نوبت‌های گفت‌وگو با خود حتی در صورت فعال‌بودن سراسری، رسید خواندن ارسال نمی‌کنند.

  </Accordion>
</AccordionGroup>

## تحویل، قطعه‌بندی و رسانه

<AccordionGroup>
  <Accordion title="قطعه‌بندی متن">
    - محدودیت پیش‌فرض قطعه: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`؛ مقدار `newline` مرزهای بندها (خطوط خالی) را ترجیح می‌دهد و سپس به قطعه‌بندی ایمن بر اساس طول بازمی‌گردد

  </Accordion>

  <Accordion title="رفتار رسانه خروجی">
    - از محتوای تصویر، ویدئو، صوت (یادداشت صوتی PTT) و سند پشتیبانی می‌کند
    - صوت به‌صورت محتوای `audio` در Baileys همراه با `ptt: true` ارسال و به‌شکل یادداشت صوتی فشردن‌برای‌صحبت نمایش داده می‌شود؛ `audioAsVoice` در محتوای پاسخ حفظ می‌شود تا خروجی یادداشت صوتی TTS، صرف‌نظر از قالب منبع ارائه‌دهنده، در همین مسیر باقی بماند
    - صوت بومی Ogg/Opus به‌صورت `audio/ogg; codecs=opus` ارسال می‌شود؛ هر مورد دیگری (از جمله خروجی MP3/WebM در TTS مربوط به Microsoft Edge) پیش از تحویل PTT با `ffmpeg` به Ogg/Opus تک‌کاناله ۴۸ کیلوهرتز تبدیل می‌شود
    - `/tts latest` آخرین پاسخ دستیار را به‌صورت یک یادداشت صوتی ارسال می‌کند و ارسال‌های تکراری برای همان پاسخ را سرکوب می‌کند؛ `/tts chat on|off|default`، TTS خودکار را برای گفت‌وگوی فعلی کنترل می‌کند
    - تنظیم `gifPlayback: true` برای ارسال ویدئو، پخش GIF متحرک را فعال می‌کند
    - `forceDocument`/`asDocument` تصاویر، GIFها و ویدئوهای خروجی را از مسیر محتوای سند Baileys عبور می‌دهد تا از فشرده‌سازی رسانه در WhatsApp جلوگیری شود و نام فایل و نوع MIME حل‌شده حفظ شوند
    - زیرنویس‌ها روی نخستین مورد رسانه‌ای در پاسخ چندرسانه‌ای اعمال می‌شوند، به‌جز یادداشت‌های صوتی PTT: ابتدا صوت بدون زیرنویس ارسال می‌شود و سپس زیرنویس به‌صورت پیام متنی جداگانه فرستاده می‌شود (کلاینت‌های WhatsApp زیرنویس یادداشت صوتی را به‌طور سازگار نمایش نمی‌دهند)
    - منبع رسانه می‌تواند HTTP(S)،‏ `file://` یا یک مسیر محلی باشد

  </Accordion>

  <Accordion title="محدودیت اندازه رسانه و رفتار بازگشت">
    - سقف ذخیره ورودی و سقف ارسال خروجی: `channels.whatsapp.mediaMaxMb` (پیش‌فرض `50`)
    - بازنویسی برای هر حساب: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - تصاویر برای انطباق با محدودیت‌ها به‌طور خودکار بهینه می‌شوند (تغییر اندازه/پیمایش کیفیت)، مگر اینکه `forceDocument`/`asDocument` تحویل به‌صورت سند را درخواست کند
    - هنگام شکست ارسال رسانه، سازوکار بازگشت برای مورد نخست به‌جای حذف بی‌سروصدای پاسخ، یک هشدار متنی ارسال می‌کند

  </Accordion>
</AccordionGroup>

## نقل‌قول پاسخ

`channels.whatsapp.replyToMode` نقل‌قول بومی پاسخ را کنترل می‌کند (پاسخ‌های خروجی به‌طور قابل‌مشاهده پیام ورودی را نقل‌قول می‌کنند):

| مقدار             | رفتار                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (پیش‌فرض) | هرگز نقل‌قول نکن؛ به‌صورت پیام ساده ارسال کن                           |
| `"first"`         | فقط نخستین قطعه پاسخ خروجی را نقل‌قول کن                      |
| `"all"`           | همه قطعه‌های پاسخ خروجی را نقل‌قول کن                               |
| `"batched"`       | پاسخ‌های دسته‌ای صف‌شده را نقل‌قول کن؛ پاسخ‌های فوری را بدون نقل‌قول بگذار |

بازنویسی برای هر حساب: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## سطح واکنش

`channels.whatsapp.reactionLevel` گستره استفاده عامل از واکنش‌های ایموجی را کنترل می‌کند:

| سطح                 | واکنش‌های تأیید | واکنش‌های آغازشده توسط عامل  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | خیر            | خیر                         |
| `"ack"`               | بله           | خیر                         |
| `"minimal"` (پیش‌فرض) | بله           | بله، با رویکرد محافظه‌کارانه |
| `"extensive"`         | بله           | بله، با رویکرد تشویقی   |

بازنویسی برای هر حساب: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## واکنش‌های تأیید

`channels.whatsapp.ackReaction` هنگام دریافت پیام ورودی، واکنشی فوری ارسال می‌کند که با `reactionLevel` کنترل می‌شود (در حالت `"off"` سرکوب می‌شود):

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

نکات: بلافاصله پس از پذیرش پیام ورودی (پیش از پاسخ) ارسال می‌شود؛ اگر `ackReaction` بدون `emoji` وجود داشته باشد، WhatsApp از ایموجی هویت عامل مسیریابی‌شده استفاده می‌کند و در صورت نبود آن به `"👀"` بازمی‌گردد (`ackReaction` را حذف کنید یا برای نبود تأیید، `emoji: ""` را تنظیم کنید)؛ شکست‌ها ثبت می‌شوند اما تحویل پاسخ را مسدود نمی‌کنند؛ حالت گروه `mentions` فقط در نوبت‌هایی که با اشاره فعال شده‌اند واکنش نشان می‌دهد، درحالی‌که فعال‌سازی گروه `always` این بررسی را دور می‌زند؛ WhatsApp فقط از `channels.whatsapp.ackReaction` استفاده می‌کند (`messages.ackReaction` قدیمی در اینجا اعمال نمی‌شود).

## واکنش‌های وضعیت چرخه حیات

برای اینکه WhatsApp در طول یک نوبت به‌جای باقی‌گذاشتن ایموجی ثابت دریافت، واکنش تأیید را جایگزین کند و میان وضعیت‌هایی مانند در صف، در حال فکر، فعالیت ابزار، Compaction، انجام‌شده و خطا بچرخد، `messages.statusReactions.enabled: true` را تنظیم کنید:

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

نکات: `channels.whatsapp.ackReaction` همچنان واجد شرایط بودن پیام‌های مستقیم و گروه‌ها را کنترل می‌کند؛ وضعیت در صف از همان ایموجی مؤثر واکنش تأیید ساده استفاده می‌کند؛ WhatsApp برای هر پیام یک جایگاه واکنش ربات دارد، بنابراین به‌روزرسانی‌های چرخه حیات واکنش فعلی را در همان محل جایگزین می‌کنند؛ `messages.removeAckAfterReply: true` پس از زمان نگه‌داری پیکربندی‌شده برای انجام‌شده/خطا، واکنش وضعیت نهایی را پاک می‌کند؛ دسته‌های ایموجی ابزار شامل `tool`، `coding`، `web`، `deploy`، `build` و `concierge` هستند.

## چندحسابی و اطلاعات اعتبارسنجی

<AccordionGroup>
  <Accordion title="انتخاب حساب و پیش‌فرض‌ها">
    شناسه‌های حساب از `channels.whatsapp.accounts` می‌آیند. اگر `default` وجود داشته باشد، حساب پیش‌فرض همان است؛ در غیر این صورت، نخستین شناسه حساب پیکربندی‌شده (به‌ترتیب الفبایی) انتخاب می‌شود. شناسه‌های حساب برای جست‌وجوی داخلی نرمال‌سازی می‌شوند.
  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - مسیر احراز هویت فعلی: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (نسخه پشتیبان: `creds.json.bak`)
    - احراز هویت پیش‌فرض قدیمی در `~/.openclaw/credentials/` همچنان برای جریان‌های حساب پیش‌فرض شناسایی/مهاجرت می‌شود

  </Accordion>

  <Accordion title="Logout behavior">
    دستور `openclaw channels logout --channel whatsapp [--account <id>]` وضعیت احراز هویت WhatsApp را برای آن حساب پاک می‌کند. وقتی Gateway در دسترس باشد، خروج ابتدا شنونده فعال آن حساب را متوقف می‌کند تا نشست پیوندشده پیش از راه‌اندازی مجدد بعدی دیگر پیامی دریافت نکند. دستور `openclaw channels remove --channel whatsapp` نیز پیش از غیرفعال‌سازی یا حذف پیکربندی حساب، شنونده فعال را متوقف می‌کند.

    در پوشه‌های احراز هویت قدیمی، `oauth.json` حفظ می‌شود، اما فایل‌های احراز هویت Baileys حذف می‌شوند.

  </Accordion>
</AccordionGroup>

## ابزارها، کنش‌ها و نوشتن پیکربندی

- پشتیبانی ابزار عامل شامل کنش واکنش WhatsApp (`react`) است.
- دروازه‌های کنش: `channels.whatsapp.actions.reactions`، `channels.whatsapp.actions.polls` (مقدار پیش‌فرض کنش‌های موجود `true` است)، `channels.whatsapp.actions.calls` (مقدار پیش‌فرض `false` است؛ MeowCaller را در بالا ببینید).
- نوشتن پیکربندی به ابتکار کانال به‌طور پیش‌فرض فعال است؛ با `channels.whatsapp.configWrites: false` آن را غیرفعال کنید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    نشانه: وضعیت کانال گزارش می‌دهد که پیوند برقرار نیست.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    نشانه: حساب پیوندشده با قطع اتصال‌های مکرر یا تلاش‌های پی‌درپی برای اتصال مجدد.

    حساب‌های کم‌فعالیت می‌توانند پس از مهلت زمانی عادی پیام نیز متصل بمانند؛ نگهبان فقط زمانی راه‌اندازی مجدد می‌کند که فعالیت انتقال WhatsApp Web متوقف شود، سوکت بسته شود، یا فعالیت در سطح برنامه بیش از بازه ایمنی طولانی‌تر ساکت بماند (مدل زمان اجرا را در بالا ببینید).

    اگر گزارش‌ها به‌طور مکرر `status=408 Request Time-out Connection was lost` را نشان می‌دهند، زمان‌بندی‌های سوکت Baileys را زیر `web.whatsapp` تنظیم کنید. ابتدا `keepAliveIntervalMs` را به مقداری کمتر از مهلت بیکاری شبکه خود کاهش دهید و در پیوندهای کند یا دارای اتلاف، `connectTimeoutMs` را افزایش دهید:

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

    راه‌حل:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    اگر پس از اصلاح اتصال میزبان و زمان‌بندی، چرخه ادامه داشت، از پوشه احراز هویت حساب نسخه پشتیبان تهیه و دوباره آن را پیوند دهید:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    اگر `~/.openclaw/logs/whatsapp-health.log` عبارت `Gateway inactive` را نشان می‌دهد، اما `openclaw gateway status` و `openclaw channels status --probe` هر دو وضعیت سالم را نشان می‌دهند، `openclaw doctor` را اجرا کنید. در Linux، doctor درباره ورودی‌های قدیمی crontab که اسکریپت بازنشسته `~/.openclaw/bin/ensure-whatsapp.sh` را فراخوانی می‌کنند هشدار می‌دهد؛ آن ورودی‌ها را با `crontab -e` حذف کنید — cron ممکن است محیط گذرگاه کاربر systemd را نداشته باشد و باعث شود آن اسکریپت قدیمی سلامت Gateway را اشتباه گزارش کند.

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    نشانه: `openclaw channels login --channel whatsapp` پیش از نمایش یک QR قابل استفاده، با `status=408 Request Time-out` یا قطع اتصال سوکت TLS شکست می‌خورد.

    ورود WhatsApp Web از محیط استاندارد پراکسی میزبان Gateway (`HTTPS_PROXY`، `HTTP_PROXY`، گونه‌های حروف کوچک و `NO_PROXY`) استفاده می‌کند. بررسی کنید فرایند Gateway متغیرهای محیطی پراکسی را به ارث می‌برد و `NO_PROXY` با `mmg.whatsapp.net` مطابقت ندارد.

  </Accordion>

  <Accordion title="No active listener when sending">
    وقتی هیچ شنونده فعال Gateway برای حساب مقصد وجود نداشته باشد، ارسال‌های خروجی بلافاصله شکست می‌خورند. تأیید کنید Gateway در حال اجرا و حساب پیوندشده است.
  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    ردیف‌های رونوشت آنچه عامل تولید کرده است ثبت می‌کنند؛ تحویل WhatsApp جداگانه بررسی می‌شود. OpenClaw تنها زمانی پاسخ خودکار را ارسال‌شده تلقی می‌کند که Baileys برای دست‌کم یک ارسال قابل مشاهده متن یا رسانه، شناسه پیام خروجی برگرداند.

    واکنش‌های تأیید دریافت، رسیدهای مستقل پیش از پاسخ هستند — موفقیت یک واکنش ثابت نمی‌کند که پاسخ متنی/رسانه‌ای بعدی پذیرفته شده است. گزارش‌های Gateway را برای `auto-reply delivery failed` یا `auto-reply was not accepted by WhatsApp provider` بررسی کنید.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    به این ترتیب بررسی کنید: `groupPolicy`، ‏`groupAllowFrom`/`allowFrom`، ورودی‌های فهرست مجاز `groups`، دروازه‌گذاری اشاره (`requireMention` همراه با الگوهای اشاره) و کلیدهای تکراری در `openclaw.json` (ورودی‌های بعدی JSON5 ورودی‌های قبلی را بازنویسی می‌کنند — در هر دامنه فقط یک `groupPolicy` نگه دارید).

    اگر `channels.whatsapp.groups` وجود داشته باشد، WhatsApp همچنان می‌تواند پیام‌های گروه‌های دیگر را مشاهده کند، اما OpenClaw آن‌ها را پیش از مسیریابی نشست کنار می‌گذارد. JID گروه را به `channels.whatsapp.groups` اضافه کنید، یا برای پذیرش همه گروه‌ها درحالی‌که مجوز فرستنده همچنان تحت کنترل `groupPolicy`/`groupAllowFrom` است، `groups["*"]` را اضافه کنید.

  </Accordion>

  <Accordion title="Bun runtime warning">
    زمان اجرای Gateway مربوط به WhatsApp باید از Node استفاده کند. Bun برای عملکرد پایدار Gateway در WhatsApp/Telegram ناسازگار علامت‌گذاری شده است.
  </Accordion>
</AccordionGroup>

## اعلان‌های سیستمی

WhatsApp از طریق نگاشت‌های `groups` و `direct` از اعلان‌های سیستمی به سبک Telegram برای گروه‌ها و گفت‌وگوهای مستقیم پشتیبانی می‌کند.

تفکیک برای پیام‌های گروهی: ابتدا نگاشت مؤثر `groups` تعیین می‌شود — اگر حساب اصلاً کلید `groups` مخصوص خود را تعریف کند، آن کلید به‌طور کامل جایگزین نگاشت ریشه `groups` می‌شود (بدون ادغام عمیق). سپس جست‌وجوی اعلان روی همان نگاشت حاصل انجام می‌شود:

1. **اعلان مختص گروه** (`groups["<groupId>"].systemPrompt`): زمانی استفاده می‌شود که ورودی گروه وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. رشته خالی (`""`) نویسه عام را سرکوب می‌کند و هیچ اعلانی اعمال نمی‌شود.
2. **اعلان نویسه عام گروه** (`groups["*"].systemPrompt`): زمانی استفاده می‌شود که ورودی گروه مشخص وجود نداشته باشد، یا وجود داشته باشد اما کلید `systemPrompt` نداشته باشد.

تفکیک پیام‌های مستقیم، همین الگو را به‌طور یکسان روی نگاشت `direct` و `direct["*"]` دنبال می‌کند.

<Note>
`dms` همچنان مخزن سبک بازنویسی تاریخچه برای هر پیام مستقیم است (`dms.<id>.historyLimit`). بازنویسی‌های اعلان زیر `direct` قرار می‌گیرند.
</Note>

<Note>
این رفتار جایگزینی ریشه توسط حساب برای تفکیک اعلان، یک بازنویسی سطحی ساده است: هر کلید `groups`/`direct` در حساب، حتی یک شیء خالی صریح، جایگزین نگاشت ریشه می‌شود. این رفتار با بررسی فهرست مجاز عضویت گروه که در بالا توضیح داده شد متفاوت است؛ آن بررسی برای یک `groups: {}` که تصادفاً خالی باشد، در حالت تک‌حساب یک سازوکار ایمنی دارد.
</Note>

**تفاوت با Telegram:** Telegram در پیکربندی چندحسابی، `groups` ریشه را برای همه حساب‌ها سرکوب می‌کند (حتی حساب‌هایی که `groups` مخصوص خود را ندارند) تا ربات پیام‌های گروه‌هایی را که عضو آن‌ها نیست دریافت نکند. WhatsApp این محافظ را اعمال نمی‌کند — `groups`/`direct` ریشه، صرف‌نظر از تعداد حساب‌ها، توسط هر حسابی که بازنویسی مخصوص خود را نداشته باشد به ارث برده می‌شود. در پیکربندی چندحسابی WhatsApp، اگر اعلان‌های مختص هر حساب می‌خواهید، نگاشت کامل را صریحاً زیر هر حساب تعریف کنید.

رفتار مهم:

- `channels.whatsapp.groups` هم نگاشت پیکربندی هر گروه و هم فهرست مجاز گروه در سطح گفت‌وگو است. در دامنه ریشه یا حساب، `groups["*"]` برای آن دامنه به معنی «همه گروه‌ها پذیرفته می‌شوند» است.
- فقط زمانی `systemPrompt` نویسه عام اضافه کنید که از قبل می‌خواهید آن دامنه همه گروه‌ها را بپذیرد. برای اینکه فقط مجموعه ثابتی از شناسه‌های گروه واجد شرایط بمانند، به‌جای استفاده از `groups["*"]`، اعلان را در هر ورودی صریحاً مجازشده تکرار کنید.
- پذیرش گروه و مجوز فرستنده دو بررسی جداگانه‌اند. `groups["*"]` دامنه گروه‌هایی را که به پردازش گروه می‌رسند گسترش می‌دهد؛ همه فرستندگان آن گروه‌ها را مجاز نمی‌کند — این مورد همچنان توسط `groupPolicy`/`groupAllowFrom` کنترل می‌شود.
- `channels.whatsapp.direct` برای پیام‌های مستقیم اثر جانبی مشابهی ندارد: `direct["*"]` فقط پس از آنکه یک پیام مستقیم توسط `dmPolicy` همراه با `allowFrom` یا قواعد مخزن جفت‌سازی پذیرفته شد، پیکربندی پیش‌فرض را فراهم می‌کند.

نمونه:

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

مرجع اصلی: [مرجع پیکربندی - WhatsApp](/fa/gateway/config-channels#whatsapp)

| حوزه             | فیلدها                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| دسترسی           | `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`                                             |
| تحویل            | `textChunkLimit`، `chunkMode`، `mediaMaxMb`، `sendReadReceipts`، `ackReaction`، `reactionLevel`                |
| چندحسابی         | `accounts.<id>.enabled`، `accounts.<id>.authDir` و سایر بازنویسی‌های مختص حساب                              |
| عملیات           | `configWrites`، `debounceMs`، `web.enabled`، `web.heartbeatSeconds`، `web.reconnect.*`، `web.whatsapp.*`       |
| رفتار نشست       | `session.dmScope`، `historyLimit`، `dmHistoryLimit`، `dms.<id>.historyLimit`                                   |
| اعلان‌ها         | `groups.<id>.systemPrompt`، `groups["*"].systemPrompt`، `direct.<id>.systemPrompt`، `direct["*"].systemPrompt` |

## مرتبط

- [جفت‌سازی](/fa/channels/pairing)
- [گروه‌ها](/fa/channels/groups)
- [امنیت](/fa/gateway/security)
- [مسیریابی کانال](/fa/channels/channel-routing)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
- [عیب‌یابی](/fa/channels/troubleshooting)

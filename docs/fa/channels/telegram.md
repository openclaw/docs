---
read_when:
    - کار روی قابلیت‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-02T11:37:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b5a733970f21e6b5a145b9ebb13134fb8e18b81fa0c723607019837c60f5497
    source_path: channels/telegram.md
    workflow: 16
---

آمادهٔ تولید برای پیام‌های مستقیم بات و گروه‌ها از طریق grammY. حالت پیش‌فرض، نظرسنجی بلندمدت است؛ حالت Webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای Telegram جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی‌های بین‌کانالی و راهنماهای تعمیر.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و نمونه‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="ساخت توکن بات در BotFather">
    Telegram را باز کنید و با **@BotFather** گفت‌وگو کنید (مطمئن شوید شناسه دقیقاً `@BotFather` است).

    `/newbot` را اجرا کنید، اعلان‌ها را دنبال کنید و توکن را ذخیره کنید.

  </Step>

  <Step title="پیکربندی توکن و سیاست پیام مستقیم">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    جایگزین محیطی: `TELEGRAM_BOT_TOKEN=...` (فقط حساب پیش‌فرض).
    Telegram از `openclaw channels login telegram` استفاده **نمی‌کند**؛ توکن را در پیکربندی/محیط تنظیم کنید، سپس Gateway را شروع کنید.

  </Step>

  <Step title="شروع Gateway و تأیید اولین پیام مستقیم">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.

  </Step>

  <Step title="افزودن بات به یک گروه">
    بات را به گروه خود اضافه کنید، سپس `channels.telegram.groups` و `groupPolicy` را متناسب با مدل دسترسی خود تنظیم کنید.
  </Step>
</Steps>

<Note>
ترتیب حل توکن، آگاه از حساب است. در عمل، مقادیر پیکربندی بر جایگزین محیطی اولویت دارند و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و دیدپذیری گروه">
    بات‌های Telegram به‌طور پیش‌فرض روی **حالت حریم خصوصی** هستند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر بات باید همهٔ پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را با `/setprivacy` غیرفعال کنید، یا
    - بات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، بات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت مدیر در تنظیمات گروه Telegram کنترل می‌شود.

    بات‌های مدیر همهٔ پیام‌های گروه را دریافت می‌کنند، که برای رفتار همیشه‌فعال گروهی مفید است.

  </Accordion>

  <Accordion title="تغییرات مفید BotFather">

    - `/setjoingroups` برای اجازه/رد کردن افزودن به گروه‌ها
    - `/setprivacy` برای رفتار دیدپذیری گروه

  </Accordion>
</AccordionGroup>

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.telegram.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (به حداقل یک شناسهٔ فرستنده در `allowFrom` نیاز دارد)
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` اجازه می‌دهد هر حساب Telegram که نام کاربری بات را پیدا یا حدس بزند، به بات فرمان بدهد. فقط برای بات‌های عمداً عمومی با ابزارهای بسیار محدود از آن استفاده کنید؛ بات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربران Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و عادی‌سازی می‌شوند.
    در پیکربندی‌های چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های `allowFrom: ["*"]` در سطح حساب، آن حساب را عمومی نمی‌کنند مگر اینکه فهرست مجاز مؤثر حساب پس از ادغام همچنان شامل یک wildcard صریح باشد.
    `dmPolicy: "allowlist"` همراه با `allowFrom` خالی همهٔ پیام‌های مستقیم را مسدود می‌کند و توسط اعتبارسنجی پیکربندی رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را می‌خواهد.
    اگر ارتقا داده‌اید و پیکربندی شما شامل ورودی‌های فهرست مجاز `@username` است، برای حل آن‌ها `openclaw doctor --fix` را اجرا کنید (بهترین تلاش؛ به توکن بات Telegram نیاز دارد).
    اگر قبلاً به فایل‌های فهرست مجاز ذخیرهٔ جفت‌سازی تکیه داشتید، `openclaw doctor --fix` می‌تواند ورودی‌ها را در جریان‌های فهرست مجاز به `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز هیچ شناسهٔ صریحی ندارد).

    برای بات‌های تک‌مالک، `dmPolicy: "allowlist"` را همراه با شناسه‌های عددی صریح `allowFrom` ترجیح دهید تا سیاست دسترسی در پیکربندی پایدار بماند (به‌جای وابستگی به تأییدهای جفت‌سازی قبلی).

    ابهام رایج: تأیید جفت‌سازی پیام مستقیم به معنی «این فرستنده همه‌جا مجاز است» نیست.
    جفت‌سازی دسترسی پیام مستقیم را اعطا می‌کند. اگر هنوز مالک فرمانی وجود نداشته باشد، اولین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط مالک و تأییدهای اجرا یک حساب اپراتور صریح داشته باشند.
    مجوز فرستندهٔ گروه همچنان از فهرست‌های مجاز صریح در پیکربندی می‌آید.
    اگر می‌خواهید «یک بار مجاز شوم و هم پیام‌های مستقیم و هم فرمان‌های گروهی کار کنند»، شناسهٔ عددی کاربر Telegram خود را در `channels.telegram.allowFrom` بگذارید؛ برای فرمان‌های فقط مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### یافتن شناسهٔ کاربر Telegram شما

    امن‌تر (بدون بات شخص ثالث):

    1. به بات خود پیام مستقیم بدهید.
    2. `openclaw logs --follow` را اجرا کنید.
    3. `from.id` را بخوانید.

    روش رسمی Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    روش شخص ثالث (خصوصی‌بودن کمتر): `@userinfobot` یا `@getidsbot`.

  </Tab>

  <Tab title="سیاست گروه و فهرست‌های مجاز">
    دو کنترل با هم اعمال می‌شوند:

    1. **کدام گروه‌ها مجاز هستند** (`channels.telegram.groups`)
       - بدون پیکربندی `groups`:
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسهٔ گروه را بگذراند
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها مسدود هستند تا زمانی که ورودی‌های `groups` (یا `"*"`) را اضافه کنید
       - `groups` پیکربندی‌شده: مانند فهرست مجاز عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستنده‌های گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` برمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربران Telegram باشند (پیشوندهای `telegram:` / `tg:` عادی‌سازی می‌شوند).
    شناسه‌های گفت‌وگوی گروه یا سوپرگروه Telegram را در `groupAllowFrom` نگذارید. شناسه‌های گفت‌وگوی منفی زیر `channels.telegram.groups` قرار می‌گیرند.
    ورودی‌های غیرعددی برای مجوز فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز مجوز فرستندهٔ گروه تأییدهای ذخیرهٔ جفت‌سازی پیام مستقیم را به ارث **نمی‌برد**.
    جفت‌سازی فقط برای پیام مستقیم می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` ویژهٔ هر گروه/هر موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به `allowFrom` پیکربندی برمی‌گردد، نه ذخیرهٔ جفت‌سازی.
    الگوی عملی برای بات‌های تک‌مالک: شناسهٔ کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکتهٔ زمان اجرا: اگر `channels.telegram` کاملاً وجود نداشته باشد، زمان اجرا به‌طور پیش‌فرض با `groupPolicy="allowlist"` بسته می‌ماند، مگر اینکه `channels.defaults.groupPolicy` صریحاً تنظیم شده باشد.

    مثال: مجاز کردن هر عضو در یک گروه مشخص:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    مثال: مجاز کردن فقط کاربران مشخص در یک گروه مشخص:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      اشتباه رایج: `groupAllowFrom` فهرست مجاز گروه Telegram نیست.

      - شناسه‌های گفت‌وگوی منفی گروه یا سوپرگروه Telegram مانند `-1001234567890` را زیر `channels.telegram.groups` بگذارید.
      - وقتی می‌خواهید محدود کنید کدام افراد داخل یک گروه مجاز می‌توانند بات را فعال کنند، شناسه‌های کاربران Telegram مانند `8734062810` را زیر `groupAllowFrom` بگذارید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با بات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="رفتار منشن">
    پاسخ‌های گروهی به‌طور پیش‌فرض به منشن نیاز دارند.

    منشن می‌تواند از این‌ها بیاید:

    - منشن بومی `@botusername`، یا
    - الگوهای منشن در:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    تغییرهای فرمان در سطح نشست:

    - `/activation always`
    - `/activation mention`

    این‌ها فقط وضعیت نشست را به‌روزرسانی می‌کنند. برای ماندگاری از پیکربندی استفاده کنید.

    نمونهٔ پیکربندی ماندگار:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    گرفتن شناسهٔ گفت‌وگوی گروه:

    - یک پیام گروه را به `@userinfobot` / `@getidsbot` فوروارد کنید
    - یا `chat.id` را از `openclaw logs --follow` بخوانید
    - یا Bot API `getUpdates` را بررسی کنید

  </Tab>
</Tabs>

## رفتار زمان اجرا

- Telegram در مالکیت فرایند Gateway است.
- مسیریابی قطعی است: ورودی‌های Telegram به Telegram پاسخ داده می‌شوند (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به پوشش کانال مشترک همراه با فرادادهٔ پاسخ و جای‌نگهدارهای رسانه عادی‌سازی می‌شوند.
- نشست‌های گروهی بر اساس شناسهٔ گروه ایزوله هستند. موضوعات انجمن `:topic:<threadId>` را اضافه می‌کنند تا موضوعات ایزوله بمانند.
- پیام‌های مستقیم می‌توانند `message_thread_id` داشته باشند؛ OpenClaw شناسهٔ رشته را برای پاسخ‌ها حفظ می‌کند، اما به‌طور پیش‌فرض پیام‌های مستقیم را روی نشست تخت نگه می‌دارد. وقتی عمداً ایزوله‌سازی نشست موضوع پیام مستقیم را می‌خواهید، `channels.telegram.dm.threadReplies: "inbound"`، `channels.telegram.direct.<chatId>.threadReplies: "inbound"`، `requireTopic: true`، یا یک پیکربندی موضوع منطبق را تنظیم کنید.
- نظرسنجی بلندمدت از اجراکنندهٔ grammY با ترتیب‌دهی جداگانه برای هر گفت‌وگو/هر رشته استفاده می‌کند. هم‌روندی کلی sink اجراکننده از `agents.defaults.maxConcurrent` استفاده می‌کند.
- نظرسنجی بلندمدت داخل هر فرایند Gateway محافظت می‌شود تا فقط یک poller فعال بتواند در هر زمان از یک توکن بات استفاده کند. اگر هنوز تعارض‌های 409 در `getUpdates` می‌بینید، احتمالاً یک Gateway دیگر OpenClaw، اسکریپت، یا poller خارجی از همان توکن استفاده می‌کند.
- راه‌اندازی مجدد watchdog نظرسنجی بلندمدت به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون تکمیل liveness مربوط به `getUpdates` فعال می‌شود. فقط اگر استقرار شما همچنان هنگام کارهای طولانی‌مدت راه‌اندازی مجدد کاذب بر اثر توقف نظرسنجی می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ overrideهای هر حساب پشتیبانی می‌شوند.
- Telegram Bot API از رسید خواندن پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="پیش‌نمایش پخش زنده (ویرایش پیام)">
    OpenClaw می‌تواند پاسخ‌های جزئی را هم‌زمان پخش کند:

    - گفت‌وگوهای مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/موضوعات: پیام پیش‌نمایش + `editMessageText`

    نیازمندی:

    - `channels.telegram.streaming` برابر `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - `progress` در Telegram به `partial` نگاشت می‌شود (سازگاری با نام‌گذاری بین‌کانالی)
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده دوباره استفاده کنند یا نه (پیش‌فرض: وقتی پخش پیش‌نمایش فعال است، `true`)
    - مقادیر قدیمی `channels.telegram.streamMode` و مقادیر بولی `streaming` شناسایی می‌شوند؛ برای مهاجرت آن‌ها به `channels.telegram.streaming.mode`، `openclaw doctor --fix` را اجرا کنید

    به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار همان خط‌های کوتاه «در حال کار...» هستند که هنگام اجرای ابزارها نشان داده می‌شوند، برای مثال اجرای فرمان، خواندن فایل، به‌روزرسانی‌های برنامه‌ریزی، یا خلاصه‌های patch. Telegram این‌ها را به‌طور پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشدهٔ OpenClaw از `v2026.4.22` به بعد هماهنگ باشد. برای نگه داشتن پیش‌نمایش ویرایش‌شده برای متن پاسخ اما پنهان کردن خط‌های پیشرفت ابزار، تنظیم کنید:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    از `streaming.mode: "off"` فقط زمانی استفاده کنید که تحویل فقط-نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و گفت‌وگوی عمومی ابزار/پیشرفت به‌جای ارسال به‌صورت پیام‌های مستقل "Working..." سرکوب می‌شود. اعلان‌های تأیید، payloadهای رسانه‌ای، و خطاها همچنان از مسیر تحویل نهایی معمول عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید اما خطوط وضعیت پیشرفت ابزار را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/topic: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و ویرایش نهایی را در همان‌جا انجام می‌دهد
    - پیش‌نمایش‌های قدیمی‌تر از حدود یک دقیقه: OpenClaw پاسخ کامل‌شده را به‌صورت یک پیام نهایی تازه می‌فرستد و سپس پیش‌نمایش را پاک می‌کند، تا زمان‌نمای قابل‌مشاهده Telegram زمان تکمیل را نشان دهد نه زمان ایجاد پیش‌نمایش

    برای پاسخ‌های پیچیده (برای مثال payloadهای رسانه‌ای)، OpenClaw به تحویل نهایی معمول برمی‌گردد و سپس پیام پیش‌نمایش را پاک می‌کند.

    استریم پیش‌نمایش از استریم بلوکی جداست. وقتی استریم بلوکی به‌صراحت برای Telegram فعال شده باشد، OpenClaw برای جلوگیری از استریم دوگانه از استریم پیش‌نمایش صرف‌نظر می‌کند.

    استریم استدلال مخصوص Telegram:

    - `/reasoning stream` هنگام تولید، استدلال را به پیش‌نمایش زنده می‌فرستد
    - پاسخ نهایی بدون متن استدلال ارسال می‌شود

  </Accordion>

  <Accordion title="قالب‌بندی و fallback HTML">
    متن خروجی از `parse_mode: "HTML"` در Telegram استفاده می‌کند.

    - متن شبیه Markdown به HTML ایمن برای Telegram رندر می‌شود.
    - HTML خام مدل escape می‌شود تا شکست‌های parse در Telegram کاهش یابد.
    - اگر Telegram HTML parse‌شده را رد کند، OpenClaw دوباره به‌صورت متن ساده تلاش می‌کند.

    پیش‌نمایش لینک‌ها به‌صورت پیش‌فرض فعال است و می‌تواند با `channels.telegram.linkPreview: false` غیرفعال شود.

  </Accordion>

  <Accordion title="فرمان‌های بومی و فرمان‌های سفارشی">
    ثبت منوی فرمان Telegram هنگام startup با `setMyCommands` انجام می‌شود.

    پیش‌فرض‌های فرمان بومی:

    - `commands.native: "auto"` فرمان‌های بومی را برای Telegram فعال می‌کند

    افزودن ورودی‌های منوی فرمان سفارشی:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    قواعد:

    - نام‌ها normalize می‌شوند (حذف `/` ابتدایی، حروف کوچک)
    - الگوی معتبر: `a-z`، `0-9`، `_`، طول `1..32`
    - فرمان‌های سفارشی نمی‌توانند فرمان‌های بومی را override کنند
    - تداخل‌ها/تکراری‌ها رد می‌شوند و log می‌شوند

    نکته‌ها:

    - فرمان‌های سفارشی فقط ورودی‌های منو هستند؛ رفتار را به‌صورت خودکار پیاده‌سازی نمی‌کنند
    - فرمان‌های plugin/skill همچنان می‌توانند هنگام تایپ کار کنند حتی اگر در منوی Telegram نشان داده نشوند

    اگر فرمان‌های بومی غیرفعال باشند، built-inها حذف می‌شوند. فرمان‌های سفارشی/Plugin ممکن است در صورت پیکربندی همچنان ثبت شوند.

    خطاهای رایج setup:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از trim هم همچنان سرریز شده است؛ فرمان‌های plugin/skill/custom را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` با `404: Not Found` در حالی که فرمان‌های مستقیم curl برای Bot API کار می‌کنند، می‌تواند یعنی `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن bot پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان خطای پاک‌سازی Webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای network/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود است.

    ### فرمان‌های جفت‌سازی دستگاه (`device-pair` plugin)

    وقتی `device-pair` plugin نصب باشد:

    1. `/pair` کد setup تولید می‌کند
    2. کد را در اپ iOS paste کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (از جمله role/scopes)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد setup یک bootstrap token کوتاه‌عمر را حمل می‌کند. handoff داخلی bootstrap توکن primary node را در `scopes: []` نگه می‌دارد؛ هر توکن operator واگذار‌شده به `operator.approvals`، `operator.read`، `operator.talk.secrets`، و `operator.write` محدود می‌ماند. بررسی‌های scope مربوط به bootstrap دارای پیشوند role هستند، بنابراین آن allowlist مربوط به operator فقط درخواست‌های operator را برآورده می‌کند؛ نقش‌های غیر-operator همچنان به scopeهایی زیر پیشوند role خودشان نیاز دارند.

    اگر دستگاهی با جزئیات auth تغییریافته دوباره تلاش کند (برای مثال role/scopes/public key)، درخواست در انتظار قبلی جایگزین می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید، `/pair pending` را دوباره اجرا کنید.

    جزئیات بیشتر: [جفت‌سازی](/fa/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="دکمه‌های inline">
    محدوده صفحه‌کلید inline را پیکربندی کنید:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    override برای هر account:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Scopeها:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (پیش‌فرض)

    `capabilities: ["inlineButtons"]` قدیمی به `inlineButtons: "all"` نگاشت می‌شود.

    نمونه action پیام:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    کلیک‌های callback به‌صورت متن به agent پاس داده می‌شوند:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="actionهای پیام Telegram برای agentها و automation">
    actionهای ابزار Telegram شامل این موارد هستند:

    - `sendMessage` (`to`، `content`، `mediaUrl` اختیاری، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، `iconColor` اختیاری، `iconCustomEmojiId`)

    actionهای پیام channel aliasهای خوش‌دست ارائه می‌کنند (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    کنترل‌های gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌صورت پیش‌فرض فعال‌اند و toggleهای جداگانه `channels.telegram.actions.*` ندارند.
    ارسال‌های Runtime از snapshot فعال config/secrets استفاده می‌کنند (startup/reload)، بنابراین مسیرهای action برای هر ارسال SecretRef را به‌صورت ad-hoc دوباره resolve نمی‌کنند.

    معناشناسی حذف reaction: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="تگ‌های thread پاسخ">
    Telegram از تگ‌های صریح thread پاسخ در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام triggerکننده پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسه پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` نحوه رسیدگی را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی thread پاسخ فعال باشد و متن یا caption اصلی Telegram در دسترس باشد، OpenClaw به‌صورت خودکار یک excerpt نقل‌قول بومی Telegram را وارد می‌کند. Telegram متن نقل‌قول بومی را به 1024 واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل می‌شوند و اگر Telegram نقل‌قول را رد کند به یک پاسخ ساده fallback می‌کنند.

    نکته: `off` thread پاسخ ضمنی را غیرفعال می‌کند. تگ‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="topicهای forum و رفتار thread">
    supergroupهای forum:

    - کلیدهای session مربوط به topic مقدار `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و typing، thread مربوط به topic را هدف می‌گیرند
    - مسیر config مربوط به topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالت ویژه topic عمومی (`threadId=1`):

    - ارسال‌های پیام `message_thread_id` را حذف می‌کنند (Telegram مقدار `sendMessage(...thread_id=1)` را رد می‌کند)
    - actionهای typing همچنان `message_thread_id` را شامل می‌شوند

    ارث‌بری topic: ورودی‌های topic تنظیمات گروه را ارث می‌برند مگر اینکه override شوند (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` فقط مخصوص topic است و از پیش‌فرض‌های گروه ارث‌بری نمی‌کند.

    **مسیریابی agent برای هر topic**: هر topic می‌تواند با تنظیم `agentId` در config topic به agent متفاوتی route شود. این کار به هر topic workspace، memory، و session ایزوله خودش را می‌دهد. نمونه:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    سپس هر topic کلید session خودش را دارد: `agent:zu:telegram:group:-1001234567890:topic:3`

    **binding پایدار topic برای ACP**: topicهای forum می‌توانند sessionهای ACP harness را از طریق bindingهای ACP typed در سطح بالا pin کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و یک id واجد topic مانند `-1001234567890:topic:42`). در حال حاضر به topicهای forum در groupها/supergroupها محدود است. [agentهای ACP](/fa/tools/acp-agents) را ببینید.

    **spawn کردن ACP وابسته به thread از chat**: `/acp spawn <agent> --thread here|auto` topic فعلی را به یک session جدید ACP bind می‌کند؛ follow-upها مستقیماً به همان‌جا route می‌شوند. OpenClaw تأیید spawn را در همان topic pin می‌کند. نیاز دارد `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    template context مقدارهای `MessageThreadId` و `IsForum` را expose می‌کند. chatهای DM با `message_thread_id` به‌صورت پیش‌فرض routing مربوط به DM و metadata پاسخ را روی sessionهای flat نگه می‌دارند؛ آن‌ها فقط وقتی با `threadReplies: "inbound"`، `threadReplies: "always"`، `requireTopic: true`، یا config topic منطبق پیکربندی شده باشند، از کلیدهای session آگاه از thread استفاده می‌کنند. برای پیش‌فرض account از `channels.telegram.dm.threadReplies` در سطح بالا استفاده کنید، یا برای یک DM از `direct.<chatId>.threadReplies`.

  </Accordion>

  <Accordion title="صدا، ویدیو، و stickerها">
    ### پیام‌های صوتی

    Telegram بین voice noteها و فایل‌های صوتی تمایز قائل می‌شود.

    - پیش‌فرض: رفتار فایل صوتی
    - تگ `[[audio_as_voice]]` در پاسخ agent برای اجبار به ارسال voice-note
    - transcriptهای voice-note ورودی در context agent به‌عنوان متن تولیدشده توسط ماشین و
      غیرقابل‌اعتماد framed می‌شوند؛ تشخیص mention همچنان از transcript خام استفاده می‌کند
      تا پیام‌های صوتی وابسته به mention همچنان کار کنند.

    نمونه action پیام:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### پیام‌های ویدیویی

    Telegram بین فایل‌های ویدیویی و video noteها تمایز قائل می‌شود.

    نمونه action پیام:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    video noteها از caption پشتیبانی نمی‌کنند؛ متن پیام ارائه‌شده جداگانه ارسال می‌شود.

    ### Stickerها

    رسیدگی به sticker ورودی:

    - WEBP ایستا: دانلود و پردازش می‌شود (placeholder `<media:sticker>`)
    - TGS متحرک: رد می‌شود
    - WEBM ویدیویی: رد می‌شود

    فیلدهای context برای sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    فایل cache برای sticker:

    - `~/.openclaw/telegram/sticker-cache.json`

    stickerها یک‌بار (در صورت امکان) توصیف و cache می‌شوند تا فراخوانی‌های تکراری vision کاهش یابد.

    فعال‌سازی actionهای sticker:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    ارسال اقدام استیکر:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    جست‌وجوی استیکرهای کش‌شده:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    واکنش‌های Telegram به‌صورت به‌روزرسانی‌های `message_reaction` وارد می‌شوند (جدا از payloadهای پیام).

    وقتی فعال باشد، OpenClaw رویدادهای سیستمی مانند این را در صف می‌گذارد:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکته‌ها:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌هایی که بات فرستاده است (بهترین تلاش از طریق کش پیام‌های ارسالی).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ فرستنده‌های غیرمجاز کنار گذاشته می‌شوند.
    - Telegram در به‌روزرسانی‌های واکنش، شناسه‌های رشته را ارائه نمی‌کند.
      - گروه‌های غیرفورومی به نشست چت گروه هدایت می‌شوند
      - گروه‌های فورومی به نشست موضوع عمومی گروه (`:topic:1`) هدایت می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌طور خودکار شامل `message_reaction` می‌شود.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw، یک ایموجی تأیید ارسال می‌کند.

    ترتیب حل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Telegram انتظار ایموجی یونیکد دارد (برای مثال "👀").
    - برای غیرفعال‌کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی کانال به‌صورت پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌هایی که توسط Telegram آغاز می‌شوند شامل این مواردند:

    - رویدادهای مهاجرت گروه (`migrate_to_chat_id`) برای به‌روزرسانی `channels.telegram.groups`
    - `/config set` و `/config unset` (نیازمند فعال‌سازی فرمان)

    غیرفعال‌سازی:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling در برابر webhook">
    پیش‌فرض long polling است. برای حالت webhook، `channels.telegram.webhookUrl` و `channels.telegram.webhookSecret` را تنظیم کنید؛ `webhookPath`، `webhookHost`، `webhookPort` اختیاری‌اند (پیش‌فرض‌ها `/telegram-webhook`، `127.0.0.1`، `8787`).

    شنونده محلی به `127.0.0.1:8787` متصل می‌شود. برای ورودی عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا عمداً `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook محافظ‌های درخواست، توکن محرمانه Telegram و بدنه JSON را پیش از بازگرداندن `200` به Telegram اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان مسیرهای باتِ به‌ازای هر چت/هر موضوع که در long polling استفاده می‌شوند پردازش می‌کند، بنابراین نوبت‌های کند عامل، ACK تحویل Telegram را معطل نمی‌کنند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش دوباره، و هدف‌های CLI">
    - پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خط‌های خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازه رسانه ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.timeoutSeconds` زمان‌انتظار کلاینت API Telegram را override می‌کند (اگر تنظیم نشود، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های بات، مقدارهای پیکربندی‌شده کمتر از محافظ درخواست 60ثانیه‌ای متن/typing خروجی را clamp می‌کنند تا grammY تحویل پاسخ قابل‌مشاهده را پیش از اجرای محافظ انتقال و fallback OpenClaw قطع نکند. Long polling همچنان از محافظ درخواست 45ثانیه‌ای `getUpdates` استفاده می‌کند تا pollهای بیکار برای همیشه رها نشوند.
    - پیش‌فرض `channels.telegram.pollingStallThresholdMs` برابر `120000` است؛ فقط برای راه‌اندازی‌های مجدد polling-stall مثبت کاذب، آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچه زمینه گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` استفاده می‌کند (پیش‌فرض 50)؛ `0` غیرفعال می‌کند.
    - زمینه تکمیلی reply/quote/forward فعلاً همان‌طور که دریافت شده پاس داده می‌شود.
    - allowlistهای Telegram در درجه اول تعیین می‌کنند چه کسی می‌تواند عامل را trigger کند، نه یک مرز کامل ویرایش زمینه تکمیلی.
    - کنترل‌های تاریخچه DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای قابل‌بازیابی API خروجی، روی helperهای ارسال Telegram (CLI/ابزارها/اقدام‌ها) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای شکست‌های pre-connect Telegram از تلاش دوباره bounded safe-send استفاده می‌کند، اما envelopeهای شبکه مبهم پس از ارسال را که ممکن است پیام‌های قابل‌مشاهده را تکراری کنند، دوباره تلاش نمی‌کند.

    هدف ارسال CLI می‌تواند شناسه عددی چت یا نام کاربری باشد:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    pollهای Telegram از `openclaw message poll` استفاده می‌کنند و از موضوعات فوروم پشتیبانی می‌کنند:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    flagهای فقط مخصوص poll در Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` برای موضوعات فوروم (یا از یک هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین از این موارد پشتیبانی می‌کند:

    - `--presentation` با بلوک‌های `buttons` برای صفحه‌کلیدهای inline، وقتی `channels.telegram.capabilities.inlineButtons` آن را اجازه می‌دهد
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل سنجاق‌شده، وقتی بات بتواند در آن چت سنجاق کند
    - `--force-document` برای ارسال تصاویر و GIFهای خروجی به‌عنوان سند، به‌جای آپلود عکس فشرده یا رسانه متحرک

    gating اقدام‌ها:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها، را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ساخت poll در Telegram را غیرفعال می‌کند و ارسال‌های عادی را فعال نگه می‌دارد

  </Accordion>

  <Accordion title="تأییدهای اجرا در Telegram">
    Telegram از تأییدهای اجرا در DMهای تأییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در چت یا موضوع مبدأ ارسال کند. تأییدکننده‌ها باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی حداقل یک تأییدکننده قابل‌حل باشد، خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی مالک از `commands.ownerAllowFrom` fallback می‌کند)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`، `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom` و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با بات صحبت کند و پاسخ‌های عادی را کجا می‌فرستد. آن‌ها کسی را به تأییدکننده اجرا تبدیل نمی‌کنند. نخستین جفت‌سازی DM تأییدشده، وقتی هنوز مالک فرمانی وجود ندارد، `commands.ownerAllowFrom` را bootstrap می‌کند، بنابراین راه‌اندازی تک‌مالک همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانالی متن فرمان را در چت نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/موضوعات مورداعتماد فعال کنید. وقتی prompt در یک موضوع فوروم قرار می‌گیرد، OpenClaw موضوع را برای prompt تأیید و پیگیری حفظ می‌کند. تأییدهای اجرا به‌صورت پیش‌فرض پس از 30 دقیقه منقضی می‌شوند.

    دکمه‌های تأیید inline همچنین نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group` یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدهای Plugin حل می‌شوند؛ بقیه ابتدا از طریق تأییدهای اجرا حل می‌شوند.

    [تأییدهای اجرا](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی عامل با خطای تحویل یا provider روبه‌رو می‌شود، Telegram می‌تواند یا با متن خطا پاسخ دهد یا آن را سرکوب کند. دو کلید پیکربندی این رفتار را کنترل می‌کنند:

| کلید                                | مقدارها          | پیش‌فرض | توضیح                                                                                          |
| ----------------------------------- | ---------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` یک پیام خطای دوستانه به چت می‌فرستد. `silent` پاسخ‌های خطا را کاملاً سرکوب می‌کند.    |
| `channels.telegram.errorCooldownMs` | عدد (ms)         | `60000` | حداقل زمان بین پاسخ‌های خطا به همان چت. از spam خطا هنگام قطعی‌ها جلوگیری می‌کند.             |

overrideهای به‌ازای حساب، به‌ازای گروه، و به‌ازای موضوع پشتیبانی می‌شوند (همان وراثت کلیدهای دیگر پیکربندی Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="بات به پیام‌های گروهی بدون mention پاسخ نمی‌دهد">

    - اگر `requireMention=false` باشد، حالت حریم خصوصی Telegram باید دید کامل را اجازه دهد.
      - BotFather: `/setprivacy` -> Disable
      - سپس بات را از گروه حذف و دوباره اضافه کنید
    - `openclaw channels status` وقتی پیکربندی انتظار پیام‌های گروهی بدون mention دارد هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ wildcard `"*"` را نمی‌توان از نظر عضویت probe کرد.
    - آزمون سریع نشست: `/activation always`.

  </Accordion>

  <Accordion title="بات اصلاً پیام‌های گروهی را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا شامل `"*"` باشد)
    - عضویت بات در گروه را بررسی کنید
    - لاگ‌ها را مرور کنید: `openclaw logs --follow` برای دلیل‌های skip

  </Accordion>

  <Accordion title="فرمان‌ها به‌صورت ناقص کار می‌کنند یا اصلاً کار نمی‌کنند">

    - هویت فرستنده خود را مجاز کنید (pairing و/یا `allowFrom` عددی)
    - مجوز فرمان حتی وقتی سیاست گروه `open` است همچنان اعمال می‌شود
    - `setMyCommands failed` با `BOT_COMMANDS_TOO_MUCH` یعنی منوی native ورودی‌های بسیار زیادی دارد؛ فرمان‌های Plugin/skill/custom را کاهش دهید یا منوهای native را غیرفعال کنید
    - فراخوانی‌های startup مربوط به `deleteMyCommands` / `setMyCommands` و فراخوانی‌های typing مربوط به `sendChatAction` محدود شده‌اند و هنگام timeout درخواست، از طریق fallback انتقال Telegram یک بار دوباره تلاش می‌شوند. خطاهای ماندگار شبکه/fetch معمولاً نشان‌دهنده مشکلات دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="startup توکن غیرمجاز گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای توکن بات پیکربندی‌شده است.
    - توکن بات را در BotFather دوباره کپی یا بازتولید کنید، سپس برای حساب پیش‌فرض `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken` یا `TELEGRAM_BOT_TOKEN` را به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام startup نیز یک شکست احراز هویت است؛ برخورد با آن به‌عنوان «هیچ webhookی وجود ندارد» فقط همان شکست توکن نامعتبر را به فراخوانی‌های بعدی API موکول می‌کند.
    - اگر `deleteWebhook` هنگام startup polling با خطای شبکه گذرا شکست بخورد، OpenClaw `getWebhookInfo` را بررسی می‌کند؛ وقتی Telegram یک URL webhook خالی گزارش می‌دهد، polling ادامه می‌یابد چون پاک‌سازی از قبل انجام شده است.

  </Accordion>

  <Accordion title="ناپایداری polling یا شبکه">

    - Node 22+ + `fetch`/پراکسی سفارشی می‌تواند در صورت ناسازگاری نوع‌های AbortSignal، رفتار لغو فوری را فعال کند.
    - بعضی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 resolve می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث شکست‌های متناوب API Telegram شود.
    - اگر لاگ‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این موارد را به‌عنوان خطاهای شبکه قابل بازیابی دوباره تلاش می‌کند.
    - اگر سوکت‌های Telegram در یک آهنگ ثابت کوتاه بازیافت می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ کلاینت‌های بات مقادیر پیکربندی‌شده پایین‌تر از محافظ‌های درخواست خروجی و `getUpdates` را محدود می‌کنند، اما نسخه‌های قدیمی‌تر ممکن بود وقتی این مقدار پایین‌تر از آن محافظ‌ها تنظیم می‌شد، در هر poll یا پاسخ لغو شوند.
    - اگر لاگ‌ها شامل `Polling stall detected` باشند، OpenClaw به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون تکمیل‌شدن liveness مربوط به long-poll، polling را بازراه‌اندازی می‌کند و انتقال Telegram را دوباره می‌سازد.
    - `openclaw channels status --probe` و `openclaw doctor` وقتی هشدار می‌دهند که یک حساب polling در حال اجرا پس از مهلت startup، `getUpdates` را کامل نکرده باشد، یک حساب webhook در حال اجرا پس از مهلت startup، `setWebhook` را کامل نکرده باشد، یا آخرین فعالیت موفق انتقال polling قدیمی شده باشد.
    - فقط زمانی `channels.telegram.pollingStallThresholdMs` را افزایش دهید که فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما میزبان شما همچنان بازراه‌اندازی‌های polling-stall کاذب گزارش می‌کند. stallهای پایدار معمولا به مشکلات پراکسی، DNS، IPv6 یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین env پراکسی فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و گونه‌های حروف کوچک آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌توانند `api.telegram.org` را دور بزنند.
    - اگر پراکسی مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای یک محیط سرویس پیکربندی شده باشد و هیچ env پراکسی استانداردی وجود نداشته باشد، Telegram از همان URL برای انتقال Bot API هم استفاده می‌کند.
    - روی میزبان‌های VPS با خروجی مستقیم/TLS ناپایدار، فراخوانی‌های API Telegram را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌طور پیش‌فرض از `autoSelectFamily=true` استفاده می‌کند (به‌جز WSL2). ترتیب نتایج DNS مربوط به Telegram ابتدا از `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، سپس از `channels.telegram.network.dnsResultOrder`، و سپس از پیش‌فرض فرایند مانند `NODE_OPTIONS=--dns-result-order=ipv4first` پیروی می‌کند؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` برمی‌گردد.
    - اگر میزبان شما WSL2 است یا صراحتا با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب family را اجبار کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های محدوده benchmark مربوط به RFC 2544 (`198.18.0.0/15`) از قبل
      برای دانلودهای رسانه Telegram به‌طور پیش‌فرض مجاز هستند. اگر یک fake-IP قابل اعتماد یا
      پراکسی شفاف، `api.telegram.org` را هنگام دانلود رسانه به یک
      نشانی خصوصی/داخلی/کاربرد ویژه دیگر بازنویسی می‌کند، می‌توانید در bypass فقط مخصوص Telegram
      opt-in کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین opt-in برای هر حساب نیز در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر پراکسی شما میزبان‌های رسانه Telegram را به `198.18.x.x` resolve می‌کند، ابتدا
      فلگ خطرناک را خاموش نگه دارید. رسانه Telegram از قبل محدوده benchmark
      مربوط به RFC 2544 را به‌طور پیش‌فرض مجاز می‌کند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF
      رسانه Telegram را ضعیف می‌کند. فقط در محیط‌های پراکسی مورد اعتماد و تحت کنترل اپراتور
      مانند مسیریابی fake-IP در Clash، Mihomo یا Surge از آن استفاده کنید، وقتی آن‌ها
      پاسخ‌های خصوصی یا کاربرد ویژه خارج از محدوده benchmark مربوط به RFC 2544
      می‌سازند. برای دسترسی عادی Telegram از اینترنت عمومی آن را خاموش بگذارید.
    </Warning>

    - overrideهای محیطی (موقت):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - پاسخ‌های DNS را اعتبارسنجی کنید:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

کمک بیشتر: [عیب‌یابی کانال](/fa/channels/troubleshooting).

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Telegram](/fa/gateway/config-channels#telegram).

<Accordion title="فیلدهای پرسیگنال Telegram">

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` باید به یک فایل عادی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, سطح بالای `bindings[]` (`type: "acp"`)
- تاییدهای exec: `execApprovals`, `accounts.*.execApprovals`
- فرمان/منو: `commands.native`, `commands.nativeSkills`, `customCommands`
- threadها/پاسخ‌ها: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (پیش‌نمایش), `streaming.preview.toolProgress`, `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ `/bot<TOKEN>` را شامل نکنید)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- کنش‌ها/قابلیت‌ها: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- واکنش‌ها: `reactionNotifications`, `reactionLevel`
- خطاها: `errorPolicy`, `errorCooldownMs`
- نوشتن‌ها/تاریخچه: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را اضافه کنید) تا مسیریابی پیش‌فرض صریح باشد. در غیر این صورت OpenClaw به اولین شناسه حساب normalized برمی‌گردد و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقادیر `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را با Gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار allowlist گروه و topic.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به agentها مسیریابی کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    گروه‌ها و topicها را به agentها نگاشت کنید.
  </Card>
  <Card title="عیب‌یابی" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های میان‌کانالی.
  </Card>
</CardGroup>

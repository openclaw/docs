---
read_when:
    - کار روی قابلیت‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:25:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

آمادهٔ محیط تولید برای پیام‌های مستقیم بات و گروه‌ها از طریق grammY. نظرسنجی طولانی حالت پیش‌فرض است؛ حالت Webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای Telegram جفت‌سازی است.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های بین‌کانالی و راهنماهای عملیاتی تعمیر.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/fa/gateway/configuration">
    الگوها و نمونه‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="Create the bot token in BotFather">
    Telegram را باز کنید و با **@BotFather** گفتگو کنید (مطمئن شوید شناسه دقیقاً `@BotFather` است).

    دستور `/newbot` را اجرا کنید، اعلان‌ها را دنبال کنید، و توکن را ذخیره کنید.

  </Step>

  <Step title="Configure token and DM policy">

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
    Telegram از `openclaw channels login telegram` استفاده **نمی‌کند**؛ توکن را در config/env پیکربندی کنید، سپس Gateway را شروع کنید.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.

  </Step>

  <Step title="Add the bot to a group">
    بات را به گروه خود اضافه کنید، سپس `channels.telegram.groups` و `groupPolicy` را مطابق مدل دسترسی خود تنظیم کنید.
  </Step>
</Steps>

<Note>
ترتیب حل توکن از حساب آگاه است. در عمل، مقدارهای پیکربندی بر جایگزین محیطی اولویت دارند، و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    بات‌های Telegram به‌طور پیش‌فرض روی **حالت حریم خصوصی** هستند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر بات باید همهٔ پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را از طریق `/setprivacy` غیرفعال کنید، یا
    - بات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، بات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="Group permissions">
    وضعیت مدیر بودن در تنظیمات گروه Telegram کنترل می‌شود.

    بات‌های مدیر همهٔ پیام‌های گروه را دریافت می‌کنند، که برای رفتار گروهی همیشه‌فعال مفید است.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` برای مجاز/غیرمجاز کردن افزودن به گروه‌ها
    - `/setprivacy` برای رفتار دیده‌شدن در گروه

  </Accordion>
</AccordionGroup>

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (به حداقل یک شناسهٔ فرستنده در `allowFrom` نیاز دارد)
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` به هر حساب Telegram که نام کاربری بات را پیدا یا حدس بزند اجازه می‌دهد به بات فرمان بدهد. آن را فقط برای بات‌های عمداً عمومی با ابزارهای بسیار محدود استفاده کنید؛ بات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربران Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در پیکربندی‌های چندحسابی، `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های `allowFrom: ["*"]` در سطح حساب، آن حساب را عمومی نمی‌کنند مگر اینکه allowlist مؤثر حساب پس از ادغام همچنان شامل یک wildcard صریح باشد.
    `dmPolicy: "allowlist"` همراه با `allowFrom` خالی همهٔ پیام‌های مستقیم را مسدود می‌کند و توسط اعتبارسنجی پیکربندی رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند.
    اگر ارتقا داده‌اید و پیکربندی شما شامل ورودی‌های allowlist از نوع `@username` است، برای حل آن‌ها `openclaw doctor --fix` را اجرا کنید (با بهترین تلاش؛ به توکن بات Telegram نیاز دارد).
    اگر قبلاً به فایل‌های allowlist در pairing-store متکی بودید، `openclaw doctor --fix` می‌تواند در جریان‌های allowlist ورودی‌ها را به `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز شناسهٔ صریحی ندارد).

    برای بات‌های تک‌مالک، `dmPolicy: "allowlist"` را همراه با شناسه‌های عددی صریح `allowFrom` ترجیح دهید تا سیاست دسترسی در پیکربندی پایدار بماند (به‌جای وابستگی به تأییدهای جفت‌سازی قبلی).

    ابهام رایج: تأیید جفت‌سازی پیام مستقیم به این معنی نیست که «این فرستنده همه‌جا مجاز است».
    جفت‌سازی دسترسی پیام مستقیم می‌دهد. اگر هنوز مالک فرمانی وجود نداشته باشد، نخستین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط-مالک و تأییدهای اجرا یک حساب عملگر صریح داشته باشند.
    مجازسازی فرستندهٔ گروه همچنان از allowlistهای صریح پیکربندی می‌آید.
    اگر می‌خواهید «یک‌بار مجاز شوم و هم پیام‌های مستقیم و هم فرمان‌های گروه کار کنند»، شناسهٔ عددی کاربر Telegram خود را در `channels.telegram.allowFrom` بگذارید؛ برای فرمان‌های فقط-مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### پیدا کردن شناسهٔ کاربر Telegram خود

    ایمن‌تر (بدون بات شخص ثالث):

    1. به بات خود پیام مستقیم بدهید.
    2. `openclaw logs --follow` را اجرا کنید.
    3. `from.id` را بخوانید.

    روش رسمی Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    روش شخص ثالث (کمتر خصوصی): `@userinfobot` یا `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    دو کنترل با هم اعمال می‌شوند:

    1. **کدام گروه‌ها مجاز هستند** (`channels.telegram.groups`)
       - بدون پیکربندی `groups`:
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسهٔ گروه را بگذراند
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها مسدود می‌شوند تا زمانی که ورودی‌های `groups` (یا `"*"`) اضافه کنید
       - وقتی `groups` پیکربندی شده باشد: مثل allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستندهٔ گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` برمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربران Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های چت گروه یا سوپرگروه Telegram را در `groupAllowFrom` قرار ندهید. شناسه‌های چت منفی زیر `channels.telegram.groups` قرار می‌گیرند.
    ورودی‌های غیرعددی برای مجازسازی فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز فرستندهٔ گروه تأییدهای pairing-store پیام مستقیم را به ارث **نمی‌برد**.
    جفت‌سازی فقط برای پیام مستقیم می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` در سطح گروه/موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به `allowFrom` پیکربندی برمی‌گردد، نه pairing store.
    الگوی عملی برای بات‌های تک‌مالک: شناسهٔ کاربری خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکتهٔ زمان اجرا: اگر `channels.telegram` کاملاً وجود نداشته باشد، زمان اجرا به‌صورت پیش‌فرض به `groupPolicy="allowlist"` بسته و امن برمی‌گردد، مگر اینکه `channels.defaults.groupPolicy` صراحتاً تنظیم شده باشد.

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
      اشتباه رایج: `groupAllowFrom` یک allowlist گروه Telegram نیست.

      - شناسه‌های منفی چت گروه یا سوپرگروه Telegram مانند `-1001234567890` را زیر `channels.telegram.groups` قرار دهید.
      - وقتی می‌خواهید محدود کنید چه کسانی در یک گروه مجاز می‌توانند بات را فعال کنند، شناسه‌های کاربر Telegram مانند `8734062810` را زیر `groupAllowFrom` قرار دهید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با بات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
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

    گرفتن شناسهٔ چت گروه:

    - یک پیام گروه را به `@userinfobot` / `@getidsbot` فوروارد کنید
    - یا `chat.id` را از `openclaw logs --follow` بخوانید
    - یا Bot API `getUpdates` را بررسی کنید

  </Tab>
</Tabs>

## رفتار زمان اجرا

- Telegram تحت مالکیت فرایند Gateway است.
- مسیریابی قطعی است: ورودی Telegram به Telegram پاسخ داده می‌شود (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به envelope مشترک کانال با فرادادهٔ پاسخ، placeholderهای رسانه، و زمینهٔ زنجیرهٔ پاسخِ ماندگارشده برای پاسخ‌های Telegram که Gateway مشاهده کرده است نرمال‌سازی می‌شوند.
- نشست‌های گروه بر اساس شناسهٔ گروه جدا می‌شوند. موضوعات انجمن `:topic:<threadId>` را اضافه می‌کنند تا موضوعات جدا بمانند.
- پیام‌های مستقیم می‌توانند `message_thread_id` داشته باشند؛ OpenClaw شناسهٔ thread را برای پاسخ‌ها حفظ می‌کند اما به‌طور پیش‌فرض پیام‌های مستقیم را روی نشست تخت نگه می‌دارد. وقتی عمداً می‌خواهید جداسازی نشست موضوعی برای پیام مستقیم داشته باشید، `channels.telegram.dm.threadReplies: "inbound"`، `channels.telegram.direct.<chatId>.threadReplies: "inbound"`، `requireTopic: true`، یا یک پیکربندی موضوع مطابق را تنظیم کنید.
- نظرسنجی طولانی از grammY runner با ترتیب‌دهی برای هر چت/هر thread استفاده می‌کند. هم‌روندی کلی runner sink از `agents.defaults.maxConcurrent` استفاده می‌کند.
- نظرسنجی طولانی داخل هر فرایند Gateway محافظت می‌شود تا در هر زمان فقط یک poller فعال بتواند از یک توکن بات استفاده کند. اگر همچنان تعارض‌های 409 در `getUpdates` می‌بینید، احتمالاً یک Gateway دیگر OpenClaw، اسکریپت، یا poller خارجی از همان توکن استفاده می‌کند.
- راه‌اندازی مجدد watchdog نظرسنجی طولانی به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون liveness تکمیل‌شدهٔ `getUpdates` فعال می‌شود. فقط اگر استقرار شما همچنان هنگام کارهای طولانی‌مدت راه‌اندازی مجدد کاذب به‌دلیل توقف نظرسنجی می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ overrideهای هر حساب پشتیبانی می‌شوند.
- Telegram Bot API از رسید خواندن پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw می‌تواند پاسخ‌های جزئی را به‌صورت بی‌درنگ stream کند:

    - چت‌های مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/موضوعات: پیام پیش‌نمایش + `editMessageText`

    نیازمندی:

    - `channels.telegram.streaming` برابر `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - `progress` یک پیش‌نویس وضعیت قابل‌ویرایش برای پیشرفت ابزار نگه می‌دارد، آن را در پایان پاک می‌کند، و پاسخ نهایی را به‌عنوان پیام عادی ارسال می‌کند
    - `streaming.preview.toolProgress` کنترل می‌کند آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده دوباره استفاده کنند یا نه (پیش‌فرض: `true` وقتی preview streaming فعال است)
    - `streaming.preview.commandText` جزئیات فرمان/اجرا را داخل آن خط‌های پیشرفت ابزار کنترل می‌کند: `raw` (پیش‌فرض، رفتار منتشرشده را حفظ می‌کند) یا `status` (فقط برچسب ابزار)
    - مقدارهای قدیمی `channels.telegram.streamMode` و مقدارهای بولی `streaming` شناسایی می‌شوند؛ برای مهاجرت آن‌ها به `channels.telegram.streaming.mode`، `openclaw doctor --fix` را اجرا کنید

    به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار همان خط‌های کوتاه وضعیت هستند که هنگام اجرای ابزارها نشان داده می‌شوند، برای مثال اجرای فرمان، خواندن فایل‌ها، به‌روزرسانی‌های برنامه‌ریزی، یا خلاصه‌های patch. Telegram این‌ها را به‌طور پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشدهٔ OpenClaw از `v2026.4.22` و بعد از آن مطابقت داشته باشد. برای نگه داشتن پیش‌نمایش ویرایش‌شده برای متن پاسخ اما پنهان کردن خط‌های پیشرفت ابزار، تنظیم کنید:

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

    برای اینکه پیشرفت ابزار قابل مشاهده بماند اما متن command/exec پنهان شود، تنظیم کنید:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    وقتی می‌خواهید پیشرفت ابزار قابل مشاهده باشد بدون اینکه پاسخ نهایی در همان پیام ویرایش شود، از حالت `progress` استفاده کنید. سیاست متن فرمان را زیر `streaming.progress` قرار دهید:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    فقط وقتی از `streaming.mode: "off"` استفاده کنید که تحویل فقط-نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و گفت‌وگوی عمومی ابزار/پیشرفت به‌جای ارسال شدن به‌صورت پیام‌های وضعیت مستقل، سرکوب می‌شود. درخواست‌های تأیید، payloadهای رسانه‌ای، و خطاها همچنان از مسیر تحویل نهایی عادی عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و خط‌های وضعیت پیشرفت ابزار را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    <Note>
      پاسخ‌های نقل‌قول انتخاب‌شده Telegram استثنا هستند. وقتی `replyToMode` برابر `"first"`، `"all"`، یا `"batched"` باشد و پیام ورودی شامل متن نقل‌قول انتخاب‌شده باشد، OpenClaw پاسخ نهایی را به‌جای ویرایش پیش‌نمایش پاسخ، از مسیر بومی quote-reply در Telegram ارسال می‌کند؛ بنابراین `streaming.preview.toolProgress` نمی‌تواند خط‌های وضعیت کوتاه را برای آن نوبت نشان دهد. پاسخ‌های مربوط به پیام فعلی بدون متن نقل‌قول انتخاب‌شده همچنان پخش پیش‌نمایش را نگه می‌دارند. وقتی قابل مشاهده بودن پیشرفت ابزار از پاسخ‌های نقل‌قول بومی مهم‌تر است، `replyToMode: "off"` را تنظیم کنید، یا برای پذیرش این بده‌بستان `streaming.preview.toolProgress: false` را تنظیم کنید.
    </Note>

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و ویرایش نهایی را درجا انجام می‌دهد
    - نهایی‌های متنی بلند که به چند پیام Telegram تقسیم می‌شوند، در صورت امکان از پیش‌نمایش موجود به‌عنوان اولین بخش نهایی دوباره استفاده می‌کنند، سپس فقط بخش‌های باقی‌مانده را ارسال می‌کنند
    - نهایی‌های حالت پیشرفت، پیش‌نویس وضعیت را پاک می‌کنند و به‌جای ویرایش پیش‌نویس به پاسخ، از تحویل نهایی عادی استفاده می‌کنند
    - اگر ویرایش نهایی پیش از تأیید متن کامل‌شده شکست بخورد، OpenClaw از تحویل نهایی عادی استفاده می‌کند و پیش‌نمایش کهنه را پاک‌سازی می‌کند

    برای پاسخ‌های پیچیده (برای مثال payloadهای رسانه‌ای)، OpenClaw به تحویل نهایی عادی برمی‌گردد و سپس پیام پیش‌نمایش را پاک‌سازی می‌کند.

    پخش پیش‌نمایش از پخش بلوک جدا است. وقتی پخش بلوک به‌صورت صریح برای Telegram فعال شده باشد، OpenClaw برای جلوگیری از پخش دوگانه، جریان پیش‌نمایش را رد می‌کند.

    جریان استدلال فقط برای Telegram:

    - `/reasoning stream` هنگام تولید، استدلال را به پیش‌نمایش زنده ارسال می‌کند
    - پیش‌نمایش استدلال پس از تحویل نهایی حذف می‌شود؛ وقتی استدلال باید قابل مشاهده بماند از `/reasoning on` استفاده کنید
    - پاسخ نهایی بدون متن استدلال ارسال می‌شود

  </Accordion>

  <Accordion title="قالب‌بندی و fallback به HTML">
    متن خروجی از Telegram `parse_mode: "HTML"` استفاده می‌کند.

    - متن شبیه Markdown به HTML ایمن برای Telegram رندر می‌شود.
    - HTML خام مدل escape می‌شود تا خطاهای parse در Telegram کاهش یابد.
    - اگر Telegram‏ HTML پردازش‌شده را رد کند، OpenClaw دوباره به‌صورت متن ساده تلاش می‌کند.

    پیش‌نمایش‌های لینک به‌صورت پیش‌فرض فعال هستند و می‌توان آن‌ها را با `channels.telegram.linkPreview: false` غیرفعال کرد.

  </Accordion>

  <Accordion title="فرمان‌های بومی و فرمان‌های سفارشی">
    ثبت منوی فرمان Telegram هنگام راه‌اندازی با `setMyCommands` انجام می‌شود.

    پیش‌فرض‌های فرمان بومی:

    - `commands.native: "auto"` فرمان‌های بومی را برای Telegram فعال می‌کند

    ورودی‌های منوی فرمان سفارشی اضافه کنید:

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

    - نام‌ها نرمال‌سازی می‌شوند (`/` ابتدایی حذف می‌شود، حروف کوچک می‌شوند)
    - الگوی معتبر: `a-z`، `0-9`، `_`، طول `1..32`
    - فرمان‌های سفارشی نمی‌توانند فرمان‌های بومی را override کنند
    - تعارض‌ها/تکراری‌ها رد می‌شوند و در لاگ ثبت می‌شوند

    نکات:

    - فرمان‌های سفارشی فقط ورودی منو هستند؛ رفتار را خودکار پیاده‌سازی نمی‌کنند
    - فرمان‌های plugin/skill حتی اگر در منوی Telegram نمایش داده نشوند، همچنان هنگام تایپ می‌توانند کار کنند

    اگر فرمان‌های بومی غیرفعال باشند، موارد built-in حذف می‌شوند. فرمان‌های سفارشی/plugin در صورت پیکربندی همچنان ممکن است ثبت شوند.

    خطاهای رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از کوتاه‌سازی همچنان سرریز شده است؛ فرمان‌های plugin/skill/سفارشی را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` با `404: Not Found` در حالی که فرمان‌های مستقیم curl مربوط به Bot API کار می‌کنند، می‌تواند یعنی `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن bot پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان شکست پاک‌سازی Webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای شبکه/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود شده است.

    ### فرمان‌های جفت‌سازی دستگاه (plugin‏ `device-pair`)

    وقتی plugin‏ `device-pair` نصب شده باشد:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در برنامه iOS paste کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (شامل نقش/scopes)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر را حمل می‌کند. handoff داخلی bootstrap توکن گره اصلی را در `scopes: []` نگه می‌دارد؛ هر توکن operator که hand off شده باشد، به `operator.approvals`، `operator.read`، `operator.talk.secrets`، و `operator.write` محدود می‌ماند. بررسی‌های scope مربوط به bootstrap دارای پیشوند نقش هستند، بنابراین آن allowlist مربوط به operator فقط درخواست‌های operator را برآورده می‌کند؛ نقش‌های غیر-operator همچنان به scopeها زیر پیشوند نقش خودشان نیاز دارند.

    اگر دستگاهی با جزئیات احراز هویت تغییرکرده دوباره تلاش کند (برای مثال نقش/scopes/کلید عمومی)، درخواست در انتظار قبلی جایگزین می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید، دوباره `/pair pending` را اجرا کنید.

    جزئیات بیشتر: [جفت‌سازی](/fa/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="دکمه‌های درون‌خطی">
    محدوده کیبورد درون‌خطی را پیکربندی کنید:

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

    override برای هر حساب:

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

    محدوده‌ها:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (پیش‌فرض)

    `capabilities: ["inlineButtons"]` قدیمی به `inlineButtons: "all"` نگاشت می‌شود.

    نمونه کنش پیام:

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

    کلیک‌های callback به‌صورت متن به عامل پاس داده می‌شوند:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="کنش‌های پیام Telegram برای عامل‌ها و automation">
    کنش‌های ابزار Telegram شامل موارد زیر هستند:

    - `sendMessage` (`to`، `content`، `mediaUrl` اختیاری، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، `iconColor` اختیاری، `iconCustomEmojiId`)

    کنش‌های پیام کانال aliasهای ارگونومیک ارائه می‌کنند (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    کنترل‌های gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌صورت پیش‌فرض فعال هستند و toggleهای جداگانه `channels.telegram.actions.*` ندارند.
    ارسال‌های runtime از snapshot فعال config/secrets استفاده می‌کنند (راه‌اندازی/reload)، بنابراین مسیرهای کنش در هر ارسال SecretRef را به‌صورت ad-hoc دوباره resolve نمی‌کنند.

    معنای حذف reaction: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="تگ‌های threading پاسخ">
    Telegram از تگ‌های threading پاسخ صریح در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام triggerکننده پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسه پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` مدیریت را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی threading پاسخ فعال باشد و متن یا caption اصلی Telegram در دسترس باشد، OpenClaw به‌صورت خودکار یک excerpt نقل‌قول بومی Telegram اضافه می‌کند. Telegram متن نقل‌قول بومی را به 1024 واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل‌قول می‌شوند و اگر Telegram نقل‌قول را رد کند، به یک پاسخ ساده fallback می‌کنند.

    نکته: `off`‏ threading پاسخ ضمنی را غیرفعال می‌کند. تگ‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="موضوعات forum و رفتار thread">
    supergroupهای forum:

    - کلیدهای نشست موضوع `:topic:<threadId>` را append می‌کنند
    - پاسخ‌ها و typing موضوع thread را هدف می‌گیرند
    - مسیر config موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالت خاص موضوع General‏ (`threadId=1`):

    - ارسال‌های پیام `message_thread_id` را omit می‌کنند (Telegram‏ `sendMessage(...thread_id=1)` را رد می‌کند)
    - کنش‌های typing همچنان `message_thread_id` را شامل می‌شوند

    وراثت موضوع: ورودی‌های موضوع تنظیمات گروه را به ارث می‌برند مگر اینکه override شوند (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` فقط مخصوص موضوع است و از پیش‌فرض‌های گروه به ارث نمی‌رسد.

    **مسیریابی عامل برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در config موضوع، به عامل متفاوتی route شود. این کار به هر موضوع workspace، حافظه، و نشست ایزوله خودش را می‌دهد. مثال:

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

    سپس هر موضوع کلید نشست خودش را دارد: `agent:zu:telegram:group:-1001234567890:topic:3`

    **اتصال پایدار موضوع ACP**: موضوعات forum می‌توانند نشست‌های harness مربوط به ACP را از طریق bindingهای تایپ‌شده سطح بالا ACP pin کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و شناسه دارای topic مثل `-1001234567890:topic:42`). در حال حاضر به موضوعات forum در گروه‌ها/supergroupها محدود است. [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

    **spawn کردن ACP محدود به thread از chat**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک نشست جدید ACP bind می‌کند؛ follow-upها مستقیماً به همان‌جا route می‌شوند. OpenClaw تأیید spawn را داخل موضوع pin می‌کند. لازم است `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    زمینهٔ الگو `MessageThreadId` و `IsForum` را در دسترس می‌گذارد. گفت‌وگوهای DM با `message_thread_id` به‌صورت پیش‌فرض مسیریابی DM و فرادادهٔ پاسخ را روی نشست‌های تخت نگه می‌دارند؛ آن‌ها فقط زمانی از کلیدهای نشست آگاه از رشته استفاده می‌کنند که با `threadReplies: "inbound"`، `threadReplies: "always"`، `requireTopic: true`، یا یک پیکربندی موضوع منطبق تنظیم شده باشند. از `channels.telegram.dm.threadReplies` سطح بالا برای پیش‌فرض حساب، یا از `direct.<chatId>.threadReplies` برای یک DM استفاده کنید.

  </Accordion>

  <Accordion title="صدا، ویدیو و استیکرها">
    ### پیام‌های صوتی

    Telegram یادداشت‌های صوتی را از فایل‌های صوتی متمایز می‌کند.

    - پیش‌فرض: رفتار فایل صوتی
    - برچسب `[[audio_as_voice]]` در پاسخ عامل برای اجبار به ارسال یادداشت صوتی
    - رونوشت‌های یادداشت صوتی ورودی در زمینهٔ عامل به‌عنوان متن تولیدشده توسط ماشین و نامطمئن قاب‌بندی می‌شوند؛ تشخیص اشاره همچنان از رونوشت خام استفاده می‌کند تا پیام‌های صوتی وابسته به اشاره همچنان کار کنند.

    نمونهٔ کنش پیام:

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

    Telegram فایل‌های ویدیویی را از یادداشت‌های ویدیویی متمایز می‌کند.

    نمونهٔ کنش پیام:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    یادداشت‌های ویدیویی از زیرنویس پشتیبانی نمی‌کنند؛ متن پیام ارائه‌شده جداگانه ارسال می‌شود.

    ### استیکرها

    مدیریت استیکر ورودی:

    - WEBP ایستا: دانلود و پردازش می‌شود (جای‌نگهدار `<media:sticker>`)
    - TGS متحرک: نادیده گرفته می‌شود
    - WEBM ویدیویی: نادیده گرفته می‌شود

    فیلدهای زمینهٔ استیکر:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    فایل کش استیکر:

    - `~/.openclaw/telegram/sticker-cache.json`

    استیکرها یک‌بار توصیف می‌شوند (در صورت امکان) و برای کاهش فراخوانی‌های تکراری بینایی کش می‌شوند.

    فعال‌سازی کنش‌های استیکر:

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

    کنش ارسال استیکر:

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
    واکنش‌های Telegram به‌صورت به‌روزرسانی‌های `message_reaction` می‌رسند (جدا از بار پیام‌ها).

    وقتی فعال باشد، OpenClaw رویدادهای سامانه‌ای مانند این را در صف قرار می‌دهد:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکات:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط ربات (بهترین تلاش از طریق کش پیام‌های ارسال‌شده).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ فرستندگان غیرمجاز حذف می‌شوند.
    - Telegram شناسه‌های رشته را در به‌روزرسانی‌های واکنش ارائه نمی‌کند.
      - گروه‌های غیرفرومی به نشست گفت‌وگوی گروهی هدایت می‌شوند
      - گروه‌های فرومی به نشست موضوع عمومی گروه (`:topic:1`) هدایت می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌طور خودکار شامل `message_reaction` است.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw یک ایموجی تأیید ارسال می‌کند.

    ترتیب حل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - ایموجی هویت عامل به‌عنوان جایگزین (`agents.list[].identity.emoji`، وگرنه "👀")

    نکات:

    - Telegram انتظار ایموجی یونیکد دارد (برای مثال "👀").
    - از `""` برای غیرفعال‌کردن واکنش برای یک کانال یا حساب استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی کانال به‌صورت پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های برانگیخته‌شده توسط Telegram شامل این موارد است:

    - رویدادهای مهاجرت گروه (`migrate_to_chat_id`) برای به‌روزرسانی `channels.telegram.groups`
    - `/config set` و `/config unset` (نیازمند فعال‌بودن فرمان)

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
    پیش‌فرض long polling است. برای حالت webhook، `channels.telegram.webhookUrl` و `channels.telegram.webhookSecret` را تنظیم کنید؛ `webhookPath`، `webhookHost`، `webhookPort` اختیاری هستند (پیش‌فرض‌ها `/telegram-webhook`، `127.0.0.1`، `8787`).

    در حالت long-polling، OpenClaw نشانهٔ راه‌اندازی مجدد خود را فقط پس از ارسال موفق یک به‌روزرسانی پایدار می‌کند. اگر یک handler شکست بخورد، آن به‌روزرسانی در همان فرایند قابل تلاش مجدد می‌ماند و برای حذف تکرار پس از راه‌اندازی مجدد به‌عنوان تکمیل‌شده نوشته نمی‌شود.

    شنوندهٔ محلی به `127.0.0.1:8787` متصل می‌شود. برای ورودی عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا عمداً `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook محافظ‌های درخواست، توکن محرمانهٔ Telegram، و بدنهٔ JSON را پیش از بازگرداندن `200` به Telegram اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان مسیرهای رباتی به‌ازای هر گفت‌وگو/هر موضوع که در long polling استفاده می‌شوند پردازش می‌کند، بنابراین نوبت‌های کند عامل ACK تحویل Telegram را نگه نمی‌دارند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش مجدد و اهداف CLI">
    - پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خطوط خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازهٔ رسانهٔ ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.mediaGroupFlushMs` (پیش‌فرض 500) کنترل می‌کند آلبوم‌ها/گروه‌های رسانهٔ Telegram چه مدت بافر شوند پیش از آنکه OpenClaw آن‌ها را به‌عنوان یک پیام ورودی ارسال کند. اگر بخش‌های آلبوم دیر می‌رسند، آن را افزایش دهید؛ برای کاهش تأخیر پاسخ آلبوم، آن را کاهش دهید.
    - `channels.telegram.timeoutSeconds` مهلت زمانی کلاینت API Telegram را بازنویسی می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های ربات مقادیر پیکربندی‌شدهٔ کمتر از محافظ 60 ثانیه‌ای درخواست متن/تایپ خروجی را محدود می‌کنند تا grammY تحویل پاسخ قابل مشاهده را پیش از اجرای محافظ انتقال و جایگزین OpenClaw قطع نکند. Long polling همچنان از محافظ درخواست 45 ثانیه‌ای `getUpdates` استفاده می‌کند تا pollingهای بیکار برای همیشه رها نشوند.
    - مقدار پیش‌فرض `channels.telegram.pollingStallThresholdMs` برابر `120000` است؛ فقط برای راه‌اندازی‌های مجدد کاذبِ توقف polling، آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچهٔ زمینهٔ گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` استفاده می‌کند (پیش‌فرض 50)؛ `0` آن را غیرفعال می‌کند.
    - زمینهٔ تکمیلی پاسخ/نقل‌قول/بازارسال زمانی که Gateway پیام‌های والد را مشاهده کرده باشد، در یک پنجرهٔ زمینهٔ گفت‌وگوی انتخاب‌شده نرمال‌سازی می‌شود؛ کش پیام‌های مشاهده‌شده کنار ذخیره‌گاه نشست پایدار می‌شود. Telegram فقط یک `reply_to_message` سطحی را در به‌روزرسانی‌ها شامل می‌کند، بنابراین زنجیره‌های قدیمی‌تر از کش به بار به‌روزرسانی فعلی Telegram محدود هستند.
    - فهرست‌های مجاز Telegram عمدتاً تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند، نه یک مرز کامل برای حذف زمینهٔ تکمیلی.
    - کنترل‌های تاریخچهٔ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای API خروجی قابل بازیابی، روی کمک‌کننده‌های ارسال Telegram (CLI/tools/actions) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای خرابی‌های پیش‌اتصال Telegram از تلاش مجدد محدود safe-send استفاده می‌کند، اما پوشش‌های شبکه‌ای مبهم پس از ارسال را که می‌توانند پیام‌های قابل مشاهده را تکراری کنند دوباره تلاش نمی‌کند.

    اهداف ارسال CLI و ابزار پیام می‌توانند شناسهٔ عددی گفت‌وگو، نام کاربری، یا هدف موضوع فروم باشند:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    pollingهای Telegram از `openclaw message poll` استفاده می‌کنند و از موضوعات فروم پشتیبانی می‌کنند:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    پرچم‌های poll مخصوص Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` برای موضوعات فروم (یا از یک هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین از این موارد پشتیبانی می‌کند:

    - `--presentation` با بلوک‌های `buttons` برای صفحه‌کلیدهای inline هنگامی که `channels.telegram.capabilities.inlineButtons` اجازه دهد
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل سنجاق‌شده هنگامی که ربات می‌تواند در آن گفت‌وگو سنجاق کند
    - `--force-document` برای ارسال تصاویر و GIFهای خروجی به‌صورت سند به‌جای آپلود عکس فشرده یا رسانهٔ متحرک

    محدودسازی کنش:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ایجاد poll در Telegram را غیرفعال می‌کند و ارسال‌های معمول را فعال نگه می‌دارد

  </Accordion>

  <Accordion title="تأییدهای exec در Telegram">
    Telegram از تأییدهای exec در DMهای تأییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در گفت‌وگو یا موضوع مبدأ ارسال کند. تأییدکننده‌ها باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی حداقل یک تأییدکننده قابل حل باشد، به‌طور خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی مالک از `commands.ownerAllowFrom` برمی‌گردد)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom` و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با ربات صحبت کند و ربات پاسخ‌های عادی را کجا می‌فرستد. آن‌ها کسی را به تأییدکنندهٔ exec تبدیل نمی‌کنند. نخستین جفت‌سازی DM تأییدشده، وقتی هنوز مالک فرمانی وجود ندارد، `commands.ownerAllowFrom` را راه‌اندازی می‌کند، بنابراین راه‌اندازی تک‌مالکی همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانالی متن فرمان را در گفت‌وگو نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/موضوعات مورد اعتماد فعال کنید. وقتی prompt در یک موضوع فروم قرار می‌گیرد، OpenClaw موضوع را برای prompt تأیید و پیگیری حفظ می‌کند. تأییدهای exec به‌صورت پیش‌فرض پس از 30 دقیقه منقضی می‌شوند.

    دکمه‌های تأیید inline همچنین نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group`، یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدهای Plugin حل می‌شوند؛ دیگر شناسه‌ها ابتدا از طریق تأییدهای exec حل می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی عامل با خطای تحویل یا provider روبه‌رو می‌شود، Telegram می‌تواند یا با متن خطا پاسخ دهد یا آن را سرکوب کند. دو کلید پیکربندی این رفتار را کنترل می‌کنند:

| کلید                                | مقادیر           | پیش‌فرض | توضیح                                                                                           |
| ----------------------------------- | ---------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` یک پیام خطای دوستانه به گفت‌وگو می‌فرستد. `silent` پاسخ‌های خطا را کاملاً سرکوب می‌کند. |
| `channels.telegram.errorCooldownMs` | عدد (ms)         | `60000` | حداقل زمان بین پاسخ‌های خطا به همان گفت‌وگو. از هرزپیام خطا هنگام قطعی‌ها جلوگیری می‌کند.       |

بازنویسی‌های به‌ازای هر حساب، هر گروه، و هر موضوع پشتیبانی می‌شوند (همان وراثت سایر کلیدهای پیکربندی Telegram).

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
  <Accordion title="ربات به پیام‌های گروهی بدون منشن پاسخ نمی‌دهد">

    - اگر `requireMention=false` باشد، حالت حریم خصوصی Telegram باید دید کامل را مجاز کند.
      - BotFather: `/setprivacy` -> Disable
      - سپس ربات را از گروه حذف کنید و دوباره اضافه کنید
    - وقتی پیکربندی انتظار پیام‌های گروهی بدون منشن را دارد، `openclaw channels status` هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ wildcard `"*"` را نمی‌توان از نظر عضویت بررسی کرد.
    - آزمون سریع نشست: `/activation always`.

  </Accordion>

  <Accordion title="ربات اصلا پیام‌های گروه را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا شامل `"*"` باشد)
    - عضویت ربات در گروه را تأیید کنید
    - لاگ‌ها را برای دلایل رد شدن بررسی کنید: `openclaw logs --follow`

  </Accordion>

  <Accordion title="دستورها به‌صورت ناقص کار می‌کنند یا اصلا کار نمی‌کنند">

    - هویت فرستنده خود را مجاز کنید (pairing و/یا `allowFrom` عددی)
    - مجوزدهی دستور همچنان اعمال می‌شود، حتی وقتی سیاست گروه `open` باشد
    - خطای `setMyCommands failed` با `BOT_COMMANDS_TOO_MUCH` یعنی منوی بومی ورودی‌های زیادی دارد؛ دستورهای Plugin/skill/سفارشی را کاهش دهید یا منوهای بومی را غیرفعال کنید
    - فراخوانی‌های زمان راه‌اندازی `deleteMyCommands` / `setMyCommands` و فراخوانی‌های تایپ `sendChatAction` محدود هستند و در صورت timeout درخواست، یک‌بار از طریق fallback انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار شبکه/fetch معمولا نشان‌دهنده مشکل دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="راه‌اندازی، توکن غیرمجاز گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای توکن ربات پیکربندی‌شده است.
    - توکن ربات را در BotFather دوباره کپی یا بازتولید کنید، سپس `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken`، یا `TELEGRAM_BOT_TOKEN` را برای حساب پیش‌فرض به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام راه‌اندازی نیز یک شکست احراز هویت است؛ تلقی کردن آن به‌عنوان «هیچ Webhook وجود ندارد» فقط همان شکست توکن نامعتبر را به فراخوانی‌های بعدی API موکول می‌کند.

  </Accordion>

  <Accordion title="ناپایداری polling یا شبکه">

    - Node 22+ همراه با fetch/proxy سفارشی می‌تواند در صورت ناسازگاری نوع‌های AbortSignal رفتار abort فوری ایجاد کند.
    - برخی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 resolve می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث شکست‌های متناوب API Telegram شود.
    - اگر لاگ‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این موارد را به‌عنوان خطاهای شبکه قابل‌بازیابی دوباره تلاش می‌کند.
    - هنگام راه‌اندازی polling، OpenClaw probe موفق `getMe` زمان راه‌اندازی را برای grammY بازاستفاده می‌کند تا اجراکننده پیش از نخستین `getUpdates` به `getMe` دوم نیاز نداشته باشد.
    - اگر `deleteWebhook` هنگام راه‌اندازی polling با خطای شبکه گذرا شکست بخورد، OpenClaw به‌جای انجام یک فراخوانی control-plane پیش از polling دیگر، وارد long polling می‌شود. Webhook همچنان فعال به‌صورت تعارض `getUpdates` ظاهر می‌شود؛ سپس OpenClaw انتقال Telegram را بازسازی می‌کند و پاک‌سازی Webhook را دوباره تلاش می‌کند.
    - اگر سوکت‌های Telegram در یک دوره ثابت کوتاه بازیافت می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ کلاینت‌های ربات مقادیر پیکربندی‌شده کمتر از guardهای درخواست outbound و `getUpdates` را clamp می‌کنند، اما نسخه‌های قدیمی‌تر ممکن بود وقتی این مقدار کمتر از آن guardها تنظیم شده بود، هر poll یا پاسخ را abort کنند.
    - اگر لاگ‌ها شامل `Polling stall detected` باشند، OpenClaw به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون liveness کامل long-poll، polling را دوباره راه‌اندازی می‌کند و انتقال Telegram را بازسازی می‌کند.
    - `openclaw channels status --probe` و `openclaw doctor` وقتی هشدار می‌دهند که یک حساب polling در حال اجرا پس از مهلت راه‌اندازی `getUpdates` را کامل نکرده باشد، یک حساب Webhook در حال اجرا پس از مهلت راه‌اندازی `setWebhook` را کامل نکرده باشد، یا آخرین فعالیت موفق انتقال polling قدیمی شده باشد.
    - `channels.telegram.pollingStallThresholdMs` را فقط وقتی افزایش دهید که فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما میزبان شما همچنان راه‌اندازی‌مجددهای polling-stall کاذب گزارش می‌کند. گیرکردن‌های پایدار معمولا به مشکلات proxy، DNS، IPv6، یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین envهای proxy فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و شکل‌های lowercase آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌تواند `api.telegram.org` را bypass کند.
    - اگر proxy مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای یک محیط سرویس پیکربندی شده باشد و هیچ env استاندارد proxy وجود نداشته باشد، Telegram نیز از همان URL برای انتقال Bot API استفاده می‌کند.
    - روی میزبان‌های VPS با خروجی مستقیم/TLS ناپایدار، فراخوانی‌های API Telegram را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌طور پیش‌فرض `autoSelectFamily=true` است (به‌جز WSL2). ترتیب نتایج DNS برای Telegram ابتدا `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، سپس `channels.telegram.network.dnsResultOrder`، سپس پیش‌فرض فرایند مانند `NODE_OPTIONS=--dns-result-order=ipv4first` را رعایت می‌کند؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` fallback می‌کند.
    - اگر میزبان شما WSL2 است یا صراحتا با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب family را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های بازه benchmark مربوط به RFC 2544 (`198.18.0.0/15`) از قبل
      به‌طور پیش‌فرض برای دانلود رسانه Telegram مجاز هستند. اگر یک fake-IP قابل‌اعتماد یا
      proxy شفاف، `api.telegram.org` را هنگام دانلود رسانه به یک نشانی
      private/internal/special-use دیگر بازنویسی کند، می‌توانید
      bypass فقط مخصوص Telegram را فعال کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین فعال‌سازی برای هر حساب نیز در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر proxy شما میزبان‌های رسانه Telegram را به `198.18.x.x` resolve می‌کند، ابتدا
      flag خطرناک را خاموش بگذارید. رسانه Telegram از قبل به‌طور پیش‌فرض بازه
      benchmark مربوط به RFC 2544 را مجاز می‌کند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانه
      Telegram را تضعیف می‌کند. فقط برای محیط‌های proxy قابل‌اعتماد و تحت کنترل اپراتور
      مانند مسیریابی fake-IP در Clash، Mihomo یا Surge از آن استفاده کنید، وقتی آن‌ها
      پاسخ‌های private یا special-use خارج از بازه benchmark مربوط به RFC 2544
      تولید می‌کنند. برای دسترسی عادی Telegram از اینترنت عمومی آن را خاموش بگذارید.
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

راهنمای بیشتر: [عیب‌یابی کانال](/fa/channels/troubleshooting).

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Telegram](/fa/gateway/config-channels#telegram).

<Accordion title="فیلدهای مهم Telegram">

- راه‌اندازی/احراز هویت: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` باید به یک فایل معمولی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, سطح‌بالا `bindings[]` (`type: "acp"`)
- تأییدیه‌های exec: `execApprovals`, `accounts.*.execApprovals`
- دستور/منو: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread/reply: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (پیش‌نمایش), `streaming.preview.toolProgress`, `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ شامل `/bot<TOKEN>` نکنید)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actionها/قابلیت‌ها: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactionها: `reactionNotifications`, `reactionLevel`
- خطاها: `errorPolicy`, `errorCooldownMs`
- نوشتن‌ها/تاریخچه: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را اضافه کنید) تا مسیریابی پیش‌فرض صریح باشد. در غیر این صورت OpenClaw به نخستین شناسه حساب نرمال‌سازی‌شده fallback می‌کند و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقدارهای `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را با Gateway pair کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار allowlist برای گروه و topic.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به agentها مسیریابی کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و مقاوم‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    گروه‌ها و topicها را به agentها نگاشت کنید.
  </Card>
  <Card title="عیب‌یابی" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های میان‌کانالی.
  </Card>
</CardGroup>

---
read_when:
    - کار روی ویژگی‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-04T09:36:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5711d53cf908a14024bc5a94f7d590bb4bcb6963a1d78049d7782871f4eae932
    source_path: channels/telegram.md
    workflow: 16
---

آمادهٔ استفاده در محیط تولید برای پیام‌های مستقیم ربات و گروه‌ها با grammY. حالت پیش‌فرض، long polling است؛ حالت webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای Telegram جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی بین‌کانالی و راهنماهای تعمیر.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و نمونه‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="توکن ربات را در BotFather بسازید">
    Telegram را باز کنید و با **@BotFather** گفتگو کنید (مطمئن شوید شناسه دقیقاً `@BotFather` است).

    دستور `/newbot` را اجرا کنید، اعلان‌ها را دنبال کنید، و توکن را ذخیره کنید.

  </Step>

  <Step title="توکن و سیاست پیام مستقیم را پیکربندی کنید">

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

    جایگزین env: `TELEGRAM_BOT_TOKEN=...` (فقط حساب پیش‌فرض).
    Telegram از `openclaw channels login telegram` استفاده **نمی‌کند**؛ توکن را در config/env پیکربندی کنید، سپس gateway را شروع کنید.

  </Step>

  <Step title="Gateway را شروع کنید و نخستین پیام مستقیم را تأیید کنید">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.

  </Step>

  <Step title="ربات را به یک گروه اضافه کنید">
    ربات را به گروه خود اضافه کنید، سپس `channels.telegram.groups` و `groupPolicy` را مطابق مدل دسترسی خود تنظیم کنید.
  </Step>
</Steps>

<Note>
ترتیب حل توکن، آگاه از حساب است. در عمل، مقادیر config بر جایگزین env اولویت دارند، و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و دیدپذیری گروه">
    ربات‌های Telegram به‌صورت پیش‌فرض روی **Privacy Mode** هستند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر ربات باید همهٔ پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را با `/setprivacy` غیرفعال کنید، یا
    - ربات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، ربات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت مدیر در تنظیمات گروه Telegram کنترل می‌شود.

    ربات‌های مدیر همهٔ پیام‌های گروه را دریافت می‌کنند، که برای رفتار همیشه‌فعال گروه مفید است.

  </Accordion>

  <Accordion title="کلیدهای مفید BotFather">

    - `/setjoingroups` برای اجازه دادن/رد کردن اضافه شدن به گروه
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

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` اجازه می‌دهد هر حساب Telegram که نام کاربری ربات را پیدا یا حدس بزند، به ربات فرمان بدهد. فقط برای ربات‌های عمداً عمومی با ابزارهای به‌شدت محدود از آن استفاده کنید؛ ربات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربران Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در configهای چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های سطح حساب `allowFrom: ["*"]` آن حساب را عمومی نمی‌کنند، مگر اینکه allowlist مؤثر حساب پس از ادغام همچنان شامل wildcard صریح باشد.
    `dmPolicy: "allowlist"` همراه با `allowFrom` خالی همهٔ پیام‌های مستقیم را مسدود می‌کند و در اعتبارسنجی config رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند.
    اگر ارتقا داده‌اید و config شما شامل ورودی‌های allowlist به‌شکل `@username` است، برای حل آن‌ها `openclaw doctor --fix` را اجرا کنید (در حد امکان؛ به توکن ربات Telegram نیاز دارد).
    اگر قبلاً به فایل‌های allowlist در pairing-store تکیه داشتید، `openclaw doctor --fix` می‌تواند در جریان‌های allowlist ورودی‌ها را در `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز شناسهٔ صریحی ندارد).

    برای ربات‌های تک‌مالک، `dmPolicy: "allowlist"` را با شناسه‌های عددی صریح `allowFrom` ترجیح دهید تا سیاست دسترسی در config پایدار بماند (به‌جای وابستگی به تأییدهای جفت‌سازی قبلی).

    ابهام رایج: تأیید جفت‌سازی پیام مستقیم به معنی «این فرستنده همه‌جا مجاز است» نیست.
    جفت‌سازی دسترسی پیام مستقیم می‌دهد. اگر هنوز مالک فرمانی وجود نداشته باشد، نخستین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط‌مالک و تأییدهای exec یک حساب اپراتور صریح داشته باشند.
    مجوز فرستنده در گروه همچنان از allowlistهای صریح config می‌آید.
    اگر می‌خواهید «یک‌بار مجاز شوم و هم پیام‌های مستقیم و هم فرمان‌های گروه کار کنند»، شناسهٔ عددی کاربر Telegram خود را در `channels.telegram.allowFrom` بگذارید؛ برای فرمان‌های فقط‌مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### پیدا کردن شناسهٔ کاربر Telegram شما

    امن‌تر (بدون ربات شخص ثالث):

    1. به ربات خود پیام مستقیم بدهید.
    2. `openclaw logs --follow` را اجرا کنید.
    3. `from.id` را بخوانید.

    روش رسمی Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    روش شخص ثالث (کمتر خصوصی): `@userinfobot` یا `@getidsbot`.

  </Tab>

  <Tab title="سیاست گروه و allowlistها">
    دو کنترل با هم اعمال می‌شوند:

    1. **کدام گروه‌ها مجازند** (`channels.telegram.groups`)
       - بدون config برای `groups`:
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسهٔ گروه را بگذراند
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها تا وقتی ورودی‌های `groups` (یا `"*"`) را اضافه نکنید مسدود می‌شوند
       - `groups` پیکربندی‌شده: به‌عنوان allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجازند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستندهٔ گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` برمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربر Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های چت گروه یا ابرگروه Telegram را در `groupAllowFrom` نگذارید. شناسه‌های منفی چت زیر `channels.telegram.groups` قرار می‌گیرند.
    ورودی‌های غیرعددی برای مجوز فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز مجوز فرستندهٔ گروه تأییدهای pairing-store پیام مستقیم را به ارث **نمی‌برد**.
    جفت‌سازی فقط برای پیام مستقیم باقی می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` در سطح هر گروه/هر topic را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به config `allowFrom` برمی‌گردد، نه pairing store.
    الگوی عملی برای ربات‌های تک‌مالک: شناسهٔ کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکتهٔ runtime: اگر `channels.telegram` کاملاً وجود نداشته باشد، runtime به‌صورت پیش‌فرض به حالت fail-closed با `groupPolicy="allowlist"` می‌رود، مگر اینکه `channels.defaults.groupPolicy` صریحاً تنظیم شده باشد.

    مثال: اجازه دادن به هر عضو در یک گروه مشخص:

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

    مثال: اجازه دادن فقط به کاربران مشخص در یک گروه مشخص:

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
      اشتباه رایج: `groupAllowFrom` allowlist گروه Telegram نیست.

      - شناسه‌های منفی چت گروه یا ابرگروه Telegram مثل `-1001234567890` را زیر `channels.telegram.groups` بگذارید.
      - وقتی می‌خواهید محدود کنید کدام افراد داخل یک گروه مجاز بتوانند ربات را فعال کنند، شناسه‌های کاربر Telegram مثل `8734062810` را زیر `groupAllowFrom` بگذارید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با ربات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="رفتار mention">
    پاسخ‌های گروه به‌صورت پیش‌فرض به mention نیاز دارند.

    mention می‌تواند از این موارد بیاید:

    - mention بومی `@botusername`، یا
    - الگوهای mention در:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    کلیدهای فرمان در سطح session:

    - `/activation always`
    - `/activation mention`

    این‌ها فقط وضعیت session را به‌روزرسانی می‌کنند. برای پایداری از config استفاده کنید.

    نمونهٔ config پایدار:

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

## رفتار runtime

- Telegram در مالکیت فرایند Gateway است.
- مسیریابی قطعی است: ورودی Telegram به Telegram پاسخ داده می‌شود (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به پوشش مشترک کانال با فرادادهٔ پاسخ و placeholderهای رسانه نرمال‌سازی می‌شوند.
- sessionهای گروه با شناسهٔ گروه ایزوله می‌شوند. topicهای forum برای ایزوله نگه داشتن topicها `:topic:<threadId>` را اضافه می‌کنند.
- پیام‌های مستقیم می‌توانند `message_thread_id` داشته باشند؛ OpenClaw شناسهٔ thread را برای پاسخ‌ها حفظ می‌کند اما پیام‌های مستقیم را به‌صورت پیش‌فرض روی session تخت نگه می‌دارد. وقتی عمداً ایزوله‌سازی session topic پیام مستقیم را می‌خواهید، `channels.telegram.dm.threadReplies: "inbound"`، `channels.telegram.direct.<chatId>.threadReplies: "inbound"`، `requireTopic: true`، یا یک config topic مطابق را پیکربندی کنید.
- Long polling از grammY runner با توالی‌بندی بر اساس هر چت/هر thread استفاده می‌کند. همزمانی کلی sink در runner از `agents.defaults.maxConcurrent` استفاده می‌کند.
- Long polling داخل هر فرایند Gateway محافظت می‌شود تا فقط یک poller فعال بتواند هم‌زمان از یک توکن ربات استفاده کند. اگر همچنان تداخل‌های 409 در `getUpdates` می‌بینید، احتمالاً یک Gateway، اسکریپت، یا poller خارجی دیگر OpenClaw از همان توکن استفاده می‌کند.
- راه‌اندازی مجدد watchdog برای long-polling به‌صورت پیش‌فرض پس از ۱۲۰ ثانیه بدون liveness تکمیل‌شدهٔ `getUpdates` فعال می‌شود. فقط اگر استقرار شما هنوز هنگام کارهای طولانی‌مدت راه‌اندازی مجدد کاذب polling-stall می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ overrideهای سطح حساب پشتیبانی می‌شوند.
- Telegram Bot API از رسید خواندن پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="پیش‌نمایش پخش زنده (ویرایش پیام)">
    OpenClaw می‌تواند پاسخ‌های جزئی را در زمان واقعی stream کند:

    - چت‌های مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/topicها: پیام پیش‌نمایش + `editMessageText`

    نیازمندی:

    - `channels.telegram.streaming` برابر `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - `progress` یک پیش‌نویس وضعیت قابل ویرایش را نگه می‌دارد و آن را با پیشرفت ابزار تا تحویل نهایی به‌روزرسانی می‌کند
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده دوباره استفاده کنند یا نه (پیش‌فرض: وقتی preview streaming فعال است `true`)
    - `streaming.preview.commandText` جزئیات command/exec را داخل آن خطوط پیشرفت ابزار کنترل می‌کند: `raw` (پیش‌فرض، رفتار منتشرشده را حفظ می‌کند) یا `status` (فقط برچسب ابزار)
    - مقدارهای قدیمی `channels.telegram.streamMode` و boolean برای `streaming` شناسایی می‌شوند؛ برای مهاجرت آن‌ها به `channels.telegram.streaming.mode` دستور `openclaw doctor --fix` را اجرا کنید

    به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار همان خط‌های کوتاه وضعیت هستند که هنگام اجرای ابزارها نشان داده می‌شوند، برای مثال اجرای فرمان، خواندن فایل، به‌روزرسانی‌های planning، یا خلاصه‌های patch. Telegram این‌ها را به‌صورت پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشدهٔ OpenClaw از `v2026.4.22` و نسخه‌های بعدی مطابقت داشته باشد. برای نگه داشتن پیش‌نمایش ویرایش‌شده برای متن پاسخ اما پنهان کردن خطوط پیشرفت ابزار، تنظیم کنید:

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

    برای نمایان نگه داشتن پیشرفت ابزار اما پنهان کردن متن command/exec، تنظیم کنید:

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

    برای حالت پیش‌نویس پیشرفت، همان سیاست متن فرمان را زیر `streaming.progress` قرار دهید:

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

    فقط زمانی از `streaming.mode: "off"` استفاده کنید که تحویل فقط-نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و گفت‌وگوی عمومی ابزار/پیشرفت به‌جای ارسال به‌صورت پیام‌های وضعیت مستقل، سرکوب می‌شود. اعلان‌های تأیید، payloadهای رسانه‌ای، و خطاها همچنان از مسیر تحویل نهایی عادی عبور می‌کنند. زمانی از `streaming.preview.toolProgress: false` استفاده کنید که فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و خطوط وضعیت پیشرفت ابزار را پنهان کنید.

    <Note>
      پاسخ‌های نقل‌قول انتخاب‌شده در Telegram استثنا هستند. وقتی `replyToMode` برابر `"first"`، `"all"`، یا `"batched"` باشد و پیام ورودی شامل متن نقل‌قول انتخاب‌شده باشد، OpenClaw پاسخ نهایی را به‌جای ویرایش پیش‌نمایش پاسخ، از مسیر بومی پاسخ نقل‌قول Telegram می‌فرستد؛ بنابراین `streaming.preview.toolProgress` نمی‌تواند خطوط کوتاه وضعیت را برای آن نوبت نشان دهد. پاسخ‌های پیام فعلی بدون متن نقل‌قول انتخاب‌شده همچنان جریان پیش‌نمایش را حفظ می‌کنند. وقتی دیده‌شدن پیشرفت ابزار از پاسخ‌های نقل‌قول بومی مهم‌تر است، `replyToMode: "off"` را تنظیم کنید، یا برای پذیرش این بده‌بستان `streaming.preview.toolProgress: false` را تنظیم کنید.
    </Note>

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و یک ویرایش نهایی را در همان‌جا انجام می‌دهد، مگر اینکه پس از ظاهر شدن پیش‌نمایش، یک پیام غیرپیش‌نمایش قابل مشاهده ارسال شده باشد
    - پیش‌نمایش‌هایی که پس از آن‌ها خروجی غیرپیش‌نمایش قابل مشاهده می‌آید: OpenClaw پاسخ کامل‌شده را به‌عنوان یک پیام نهایی تازه ارسال می‌کند و پیش‌نمایش قدیمی‌تر را پاک می‌کند، تا پاسخ نهایی پس از خروجی میانی ظاهر شود
    - پیش‌نمایش‌های قدیمی‌تر از حدود یک دقیقه: OpenClaw پاسخ کامل‌شده را به‌عنوان یک پیام نهایی تازه ارسال می‌کند و سپس پیش‌نمایش را پاک می‌کند، تا timestamp قابل مشاهده Telegram زمان تکمیل را به‌جای زمان ایجاد پیش‌نمایش بازتاب دهد

    برای پاسخ‌های پیچیده (برای مثال payloadهای رسانه‌ای)، OpenClaw به تحویل نهایی عادی برمی‌گردد و سپس پیام پیش‌نمایش را پاک می‌کند.

    جریان پیش‌نمایش از جریان بلوکی جدا است. وقتی جریان بلوکی به‌طور صریح برای Telegram فعال باشد، OpenClaw برای جلوگیری از جریان‌دهی دوگانه، جریان پیش‌نمایش را رد می‌کند.

    جریان استدلال فقط برای Telegram:

    - `/reasoning stream` هنگام تولید، استدلال را به پیش‌نمایش زنده می‌فرستد
    - پیش‌نمایش استدلال پس از تحویل نهایی حذف می‌شود؛ وقتی استدلال باید قابل مشاهده بماند، از `/reasoning on` استفاده کنید
    - پاسخ نهایی بدون متن استدلال ارسال می‌شود

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    متن خروجی از Telegram `parse_mode: "HTML"` استفاده می‌کند.

    - متن شبیه Markdown به HTML ایمن برای Telegram رندر می‌شود.
    - HTML خام مدل escape می‌شود تا شکست‌های parse در Telegram کاهش یابد.
    - اگر Telegram HTML parse‌شده را رد کند، OpenClaw دوباره به‌صورت متن ساده تلاش می‌کند.

    پیش‌نمایش‌های لینک به‌طور پیش‌فرض فعال هستند و می‌توان آن‌ها را با `channels.telegram.linkPreview: false` غیرفعال کرد.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    ثبت منوی فرمان Telegram هنگام راه‌اندازی با `setMyCommands` انجام می‌شود.

    پیش‌فرض‌های فرمان بومی:

    - `commands.native: "auto"` فرمان‌های بومی را برای Telegram فعال می‌کند

    ورودی‌های سفارشی به منوی فرمان اضافه کنید:

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

    قوانین:

    - نام‌ها عادی‌سازی می‌شوند (`/` ابتدایی حذف می‌شود، حروف کوچک می‌شوند)
    - الگوی معتبر: `a-z`، `0-9`، `_`، طول `1..32`
    - فرمان‌های سفارشی نمی‌توانند فرمان‌های بومی را override کنند
    - تداخل‌ها/تکراری‌ها رد و log می‌شوند

    نکته‌ها:

    - فرمان‌های سفارشی فقط ورودی منو هستند؛ رفتار را به‌طور خودکار پیاده‌سازی نمی‌کنند
    - فرمان‌های plugin/skill حتی اگر در منوی Telegram نشان داده نشوند، هنگام تایپ شدن همچنان می‌توانند کار کنند

    اگر فرمان‌های بومی غیرفعال باشند، built-inها حذف می‌شوند. فرمان‌های سفارشی/plugin در صورت پیکربندی همچنان ممکن است ثبت شوند.

    شکست‌های رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از کوتاه‌سازی هم هنوز سرریز شده است؛ تعداد فرمان‌های plugin/skill/سفارشی را کم کنید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` با `404: Not Found` در حالی که فرمان‌های مستقیم curl برای Bot API کار می‌کنند، می‌تواند یعنی `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده بوده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن bot پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان شکست پاک‌سازی webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای network/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود است.

    ### فرمان‌های جفت‌سازی دستگاه (`device-pair` plugin)

    وقتی `device-pair` plugin نصب باشد:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در برنامه iOS paste کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (از جمله role/scopes)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر را حمل می‌کند. handoff داخلی bootstrap توکن primary node را در `scopes: []` نگه می‌دارد؛ هر توکن operator واگذارشده به `operator.approvals`، `operator.read`، `operator.talk.secrets`، و `operator.write` محدود می‌ماند. بررسی‌های scope در bootstrap دارای پیشوند role هستند، بنابراین آن allowlist مربوط به operator فقط درخواست‌های operator را برآورده می‌کند؛ roleهای غیر operator همچنان به scopeهایی زیر پیشوند role خودشان نیاز دارند.

    اگر دستگاهی با جزئیات auth تغییرکرده دوباره تلاش کند (برای مثال role/scopes/public key)، درخواست در انتظار قبلی supersede می‌شود و درخواست جدید از یک `requestId` متفاوت استفاده می‌کند. پیش از تأیید، `/pair pending` را دوباره اجرا کنید.

    جزئیات بیشتر: [جفت‌سازی](/fa/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
    دامنه inline keyboard را پیکربندی کنید:

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

    دامنه‌ها:

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

    کلیک‌های callback به‌صورت متن به agent پاس داده می‌شوند:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    کنش‌های ابزار Telegram شامل این موارد است:

    - `sendMessage` (`to`، `content`، `mediaUrl` اختیاری، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، `iconColor` اختیاری، `iconCustomEmojiId`)

    کنش‌های پیام channel aliasهای ارگونومیک را expose می‌کنند (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    کنترل‌های gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌طور پیش‌فرض فعال هستند و toggleهای جداگانه `channels.telegram.actions.*` ندارند.
    ارسال‌های runtime از snapshot فعال config/secrets استفاده می‌کنند (startup/reload)، بنابراین مسیرهای کنش برای هر ارسال، SecretRef را به‌صورت ad-hoc دوباره resolve نمی‌کنند.

    معناشناسی حذف reaction: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram از tagهای صریح reply threading در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام triggerکننده پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسه پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` handling را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی reply threading فعال باشد و متن یا caption اصلی Telegram در دسترس باشد، OpenClaw به‌طور خودکار یک گزیده نقل‌قول بومی Telegram را شامل می‌کند. Telegram متن نقل‌قول بومی را به 1024 واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل‌قول می‌شوند و اگر Telegram نقل‌قول را رد کند، به یک پاسخ ساده fallback می‌کنند.

    نکته: `off` reply threading ضمنی را غیرفعال می‌کند. tagهای صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    supergroupهای forum:

    - کلیدهای session موضوع، `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و typing موضوع thread را هدف می‌گیرند
    - مسیر config موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    special-case موضوع عمومی (`threadId=1`):

    - ارسال‌های پیام `message_thread_id` را حذف می‌کنند (Telegram مقدار `sendMessage(...thread_id=1)` را رد می‌کند)
    - کنش‌های typing همچنان شامل `message_thread_id` هستند

    inheritance موضوع: ورودی‌های موضوع تنظیمات گروه را به ارث می‌برند مگر اینکه override شده باشند (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` فقط مخصوص موضوع است و از پیش‌فرض‌های گروه به ارث نمی‌رسد.

    **routing agent برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در config موضوع، به یک agent متفاوت route شود. این کار به هر موضوع workspace، memory، و session ایزوله خودش را می‌دهد. مثال:

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

    سپس هر موضوع کلید session خودش را دارد: `agent:zu:telegram:group:-1001234567890:topic:3`

    **اتصال پایدار موضوع ACP**: موضوع‌های forum می‌توانند sessionهای ACP harness را از طریق bindingهای ACP تایپ‌شده سطح بالا pin کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و یک id دارای qualifier موضوع مانند `-1001234567890:topic:42`). در حال حاضر به موضوع‌های forum در groups/supergroups محدود است. [ACP Agents](/fa/tools/acp-agents) را ببینید.

    **spawn کردن ACP وابسته به thread از chat**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک session جدید ACP bind می‌کند؛ follow-upها مستقیماً به آنجا route می‌شوند. OpenClaw تأیید spawn را درون موضوع pin می‌کند. نیاز دارد `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    بافت الگو `MessageThreadId` و `IsForum` را در اختیار می‌گذارد. چت‌های DM با `message_thread_id` به‌صورت پیش‌فرض مسیریابی DM و فرادادهٔ پاسخ را در نشست‌های تخت نگه می‌دارند؛ آن‌ها فقط وقتی از کلیدهای نشست آگاه از رشته استفاده می‌کنند که با `threadReplies: "inbound"`،‏ `threadReplies: "always"`،‏ `requireTopic: true` یا یک پیکربندی موضوع مطابق پیکربندی شده باشند. برای پیش‌فرض حساب از `channels.telegram.dm.threadReplies` در سطح بالا استفاده کنید، یا برای یک DM از `direct.<chatId>.threadReplies`.

  </Accordion>

  <Accordion title="صوت، ویدیو، و استیکرها">
    ### پیام‌های صوتی

    Telegram بین یادداشت‌های صوتی و فایل‌های صوتی تفاوت می‌گذارد.

    - پیش‌فرض: رفتار فایل صوتی
    - برچسب `[[audio_as_voice]]` در پاسخ عامل برای اجبار ارسال به‌صورت یادداشت صوتی
    - رونوشت‌های یادداشت صوتی ورودی در بافت عامل به‌صورت متن تولیدشده توسط ماشین و نامطمئن قاب‌بندی می‌شوند؛ تشخیص اشاره همچنان از رونوشت خام استفاده می‌کند، بنابراین پیام‌های صوتی وابسته به اشاره همچنان کار می‌کنند.

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

    Telegram بین فایل‌های ویدیویی و یادداشت‌های ویدیویی تفاوت می‌گذارد.

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

    یادداشت‌های ویدیویی از کپشن پشتیبانی نمی‌کنند؛ متن پیام ارائه‌شده جداگانه ارسال می‌شود.

    ### استیکرها

    مدیریت استیکر ورودی:

    - WEBP ایستا: دانلود و پردازش می‌شود (جای‌نگهدار `<media:sticker>`)
    - TGS متحرک: رد می‌شود
    - WEBM ویدیویی: رد می‌شود

    فیلدهای بافت استیکر:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    فایل کش استیکر:

    - `~/.openclaw/telegram/sticker-cache.json`

    استیکرها یک‌بار توصیف می‌شوند (وقتی ممکن باشد) و برای کاهش فراخوانی‌های مکرر بینایی کش می‌شوند.

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
    واکنش‌های Telegram به‌صورت به‌روزرسانی‌های `message_reaction` می‌رسند (جدا از payloadهای پیام).

    وقتی فعال باشد، OpenClaw رویدادهای سیستمی مانند این را در صف می‌گذارد:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکته‌ها:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط بات (بهترین تلاش از طریق کش پیام‌های ارسال‌شده).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram (`dmPolicy`،‏ `allowFrom`،‏ `groupPolicy`،‏ `groupAllowFrom`) را رعایت می‌کنند؛ فرستنده‌های غیرمجاز حذف می‌شوند.
    - Telegram در به‌روزرسانی‌های واکنش شناسهٔ رشته ارائه نمی‌کند.
      - گروه‌های غیرفورومی به نشست چت گروه مسیریابی می‌شوند
      - گروه‌های فورومی به نشست موضوع عمومی گروه (`:topic:1`) مسیریابی می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌طور خودکار شامل `message_reaction` می‌شود.

  </Accordion>

  <Accordion title="واکنش‌های ack">
    `ackReaction` هنگامی که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید ارسال می‌کند.

    ترتیب حل‌وفصل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Telegram انتظار ایموجی یونیکد دارد (برای مثال "👀").
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی کانال به‌صورت پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های برانگیخته‌شده توسط Telegram شامل این‌ها هستند:

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
    پیش‌فرض long polling است. برای حالت webhook،‏ `channels.telegram.webhookUrl` و `channels.telegram.webhookSecret` را تنظیم کنید؛ `webhookPath`،‏ `webhookHost`،‏ `webhookPort` اختیاری هستند (پیش‌فرض‌ها `/telegram-webhook`،‏ `127.0.0.1`،‏ `8787`).

    شنوندهٔ محلی به `127.0.0.1:8787` bind می‌شود. برای ورودی عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا عامدانه `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook پیش از بازگرداندن `200` به Telegram، محافظ‌های درخواست، توکن محرمانهٔ Telegram، و بدنهٔ JSON را اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان مسیرهای بات به‌ازای هر چت/هر موضوع که در long polling استفاده می‌شود پردازش می‌کند، بنابراین نوبت‌های کند عامل، ACK تحویل Telegram را نگه نمی‌دارند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش دوباره، و هدف‌های CLI">
    - پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خط‌های خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازهٔ رسانهٔ ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.mediaGroupFlushMs` (پیش‌فرض 500) کنترل می‌کند آلبوم‌ها/گروه‌های رسانه‌ای Telegram چه مدت پیش از آن‌که OpenClaw آن‌ها را به‌صورت یک پیام ورودی ارسال کند، بافر شوند. اگر بخش‌های آلبوم دیر می‌رسند آن را افزایش دهید؛ برای کاهش تأخیر پاسخ آلبوم آن را کاهش دهید.
    - `channels.telegram.timeoutSeconds` زمان‌انتظار کلاینت API Telegram را بازنویسی می‌کند (اگر تنظیم نشود، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های بات مقدارهای پیکربندی‌شدهٔ کمتر از محافظ درخواست ۶۰ ثانیه‌ای متن/typing خروجی را clamp می‌کنند تا grammY پیش از آن‌که محافظ انتقال و fallback در OpenClaw اجرا شود، تحویل پاسخ قابل‌مشاهده را abort نکند. Long polling همچنان از محافظ درخواست ۴۵ ثانیه‌ای `getUpdates` استفاده می‌کند تا pollingهای idle به‌طور نامحدود رها نشوند.
    - پیش‌فرض `channels.telegram.pollingStallThresholdMs` برابر `120000` است؛ فقط برای restartهای مثبت کاذب polling-stall آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچهٔ بافت گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` استفاده می‌کند (پیش‌فرض 50)؛ `0` غیرفعال می‌کند.
    - بافت تکمیلی پاسخ/نقل‌قول/forward در حال حاضر همان‌گونه که دریافت شده، منتقل می‌شود.
    - allowlistهای Telegram عمدتاً کنترل می‌کنند چه کسی می‌تواند عامل را trigger کند، نه یک مرز کامل redaction برای بافت تکمیلی.
    - کنترل‌های تاریخچهٔ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای قابل‌بازیابی API خروجی روی کمک‌رسان‌های ارسال Telegram (CLI/ابزارها/کنش‌ها) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای شکست‌های پیش از اتصال Telegram از یک تلاش دوبارهٔ محدود safe-send استفاده می‌کند، اما envelopeهای شبکهٔ مبهم پس از ارسال را که می‌توانند پیام‌های قابل‌مشاهده را تکراری کنند، دوباره امتحان نمی‌کند.

    هدف‌های ارسال CLI و ابزار پیام می‌توانند شناسهٔ عددی چت، نام کاربری، یا هدف موضوع فوروم باشند:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    pollهای Telegram از `openclaw message poll` استفاده می‌کنند و از موضوع‌های فوروم پشتیبانی می‌کنند:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    فلگ‌های poll فقط مخصوص Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` برای موضوع‌های فوروم (یا از هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین از این‌ها پشتیبانی می‌کند:

    - `--presentation` همراه با بلوک‌های `buttons` برای کیبوردهای inline وقتی `channels.telegram.capabilities.inlineButtons` اجازه دهد
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل پین‌شده وقتی بات بتواند در آن چت pin کند
    - `--force-document` برای ارسال تصاویر و GIFهای خروجی به‌صورت document به‌جای بارگذاری عکس فشرده یا رسانهٔ متحرک

    کنترل کنش:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها، را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ایجاد poll در Telegram را غیرفعال می‌کند و ارسال‌های عادی را فعال نگه می‌دارد

  </Accordion>

  <Accordion title="تأییدیه‌های exec در Telegram">
    Telegram از تأییدیه‌های exec در DMهای تأییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در چت یا موضوع مبدأ پست کند. تأییدکنندگان باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی دست‌کم یک تأییدکننده قابل‌حل باشد خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی مالک از `commands.ownerAllowFrom` fallback می‌کند)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`،‏ `groupAllowFrom`، و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با بات صحبت کند و بات پاسخ‌های عادی را کجا ارسال کند. آن‌ها کسی را به تأییدکنندهٔ exec تبدیل نمی‌کنند. نخستین جفت‌سازی DM تأییدشده وقتی هنوز مالک فرمانی وجود ندارد، `commands.ownerAllowFrom` را bootstrap می‌کند، بنابراین راه‌اندازی تک‌مالکی همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانال متن فرمان را در چت نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/موضوع‌های مورداعتماد فعال کنید. وقتی prompt در یک موضوع فوروم قرار می‌گیرد، OpenClaw موضوع را برای prompt تأیید و پیگیری حفظ می‌کند. تأییدیه‌های exec به‌صورت پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    دکمه‌های تأیید inline نیز نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`،‏ `group`، یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدیه‌های Plugin حل می‌شوند؛ سایر شناسه‌ها ابتدا از طریق تأییدیه‌های exec حل می‌شوند.

    [تأییدیه‌های exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی عامل با خطای تحویل یا provider روبه‌رو می‌شود، Telegram می‌تواند یا با متن خطا پاسخ دهد یا آن را سرکوب کند. دو کلید پیکربندی این رفتار را کنترل می‌کنند:

| کلید                                | مقدارها           | پیش‌فرض | توضیح                                                                                           |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` یک پیام خطای دوستانه به چت ارسال می‌کند. `silent` پاسخ‌های خطا را به‌طور کامل سرکوب می‌کند. |
| `channels.telegram.errorCooldownMs` | عدد (ms)          | `60000` | حداقل زمان بین پاسخ‌های خطا به یک چت. از اسپم خطا هنگام قطعی‌ها جلوگیری می‌کند.                 |

بازنویسی‌های به‌ازای هر حساب، هر گروه، و هر موضوع پشتیبانی می‌شوند (همان ارث‌بری کلیدهای دیگر پیکربندی Telegram).

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
  <Accordion title="بات به پیام‌های گروهی بدون اشاره پاسخ نمی‌دهد">

    - اگر `requireMention=false` باشد، حالت حریم خصوصی Telegram باید دید کامل را مجاز کند.
      - BotFather: `/setprivacy` -> Disable
      - سپس bot را حذف کنید و دوباره به group اضافه کنید
    - وقتی پیکربندی انتظار پیام‌های group بدون mention را داشته باشد، `openclaw channels status` هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح group را بررسی کند؛ wildcard `"*"` را نمی‌توان از نظر عضویت probe کرد.
    - آزمون سریع session: `/activation always`.

  </Accordion>

  <Accordion title="Bot اصلا پیام‌های group را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، group باید فهرست شده باشد (یا شامل `"*"` باشد)
    - عضویت bot در group را بررسی کنید
    - گزارش‌ها را بازبینی کنید: `openclaw logs --follow` برای دلایل skip

  </Accordion>

  <Accordion title="دستورها تا حدی کار می‌کنند یا اصلا کار نمی‌کنند">

    - هویت فرستنده خود را مجاز کنید (pairing و/یا `allowFrom` عددی)
    - مجوزدهی دستور حتی وقتی policy گروه `open` است همچنان اعمال می‌شود
    - `setMyCommands failed` با `BOT_COMMANDS_TOO_MUCH` یعنی منوی native ورودی‌های بیش از حد دارد؛ دستورهای plugin/skill/custom را کاهش دهید یا منوهای native را غیرفعال کنید
    - فراخوانی‌های startup مربوط به `deleteMyCommands` / `setMyCommands` و فراخوانی‌های typing مربوط به `sendChatAction` محدود هستند و هنگام timeout درخواست، یک بار از طریق fallback انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار network/fetch معمولا نشان‌دهنده مشکلات دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="Startup توکن غیرمجاز گزارش می‌کند">

    - `getMe returned 401` شکست احراز هویت Telegram برای bot token پیکربندی‌شده است.
    - bot token را در BotFather دوباره کپی یا بازتولید کنید، سپس `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken` یا `TELEGRAM_BOT_TOKEN` را برای حساب پیش‌فرض به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام startup نیز یک شکست احراز هویت است؛ در نظر گرفتن آن به عنوان «هیچ webhook وجود ندارد» فقط همان شکست bad-token را به فراخوانی‌های بعدی API موکول می‌کند.

  </Accordion>

  <Accordion title="ناپایداری polling یا network">

    - Node 22+ همراه با fetch/proxy سفارشی می‌تواند در صورت ناسازگاری نوع‌های AbortSignal رفتار abort فوری ایجاد کند.
    - بعضی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 resolve می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث شکست‌های متناوب Telegram API شود.
    - اگر گزارش‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این‌ها را به عنوان خطاهای recoverable network دوباره تلاش می‌کند.
    - هنگام startup مربوط به polling، OpenClaw probe موفق startup به نام `getMe` را برای grammY بازاستفاده می‌کند تا runner پیش از اولین `getUpdates` به `getMe` دوم نیاز نداشته باشد.
    - اگر `deleteWebhook` هنگام startup مربوط به polling با خطای گذرای network شکست بخورد، OpenClaw به جای انجام یک فراخوانی control-plane دیگر پیش از poll، وارد long polling می‌شود. webhook همچنان فعال به صورت conflict در `getUpdates` ظاهر می‌شود؛ سپس OpenClaw انتقال Telegram را بازسازی می‌کند و cleanup مربوط به webhook را دوباره تلاش می‌کند.
    - اگر socketهای Telegram با یک آهنگ ثابت کوتاه recycle می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ کلاینت‌های bot مقدارهای پیکربندی‌شده پایین‌تر از guardهای درخواست outbound و `getUpdates` را clamp می‌کنند، اما نسخه‌های قدیمی‌تر می‌توانستند وقتی این مقدار پایین‌تر از آن guardها تنظیم شده بود هر poll یا reply را abort کنند.
    - اگر گزارش‌ها شامل `Polling stall detected` باشند، OpenClaw به طور پیش‌فرض پس از ۱۲۰ ثانیه بدون liveness کامل‌شده long-poll، polling را restart می‌کند و انتقال Telegram را بازسازی می‌کند.
    - `openclaw channels status --probe` و `openclaw doctor` هشدار می‌دهند وقتی یک حساب polling در حال اجرا پس از grace مربوط به startup، `getUpdates` را کامل نکرده باشد، وقتی یک حساب webhook در حال اجرا پس از grace مربوط به startup، `setWebhook` را کامل نکرده باشد، یا وقتی آخرین فعالیت موفق انتقال polling stale باشد.
    - فقط وقتی فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما میزبان شما همچنان restartهای polling-stall کاذب گزارش می‌کند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. stallهای پایدار معمولا به مشکلات proxy، DNS، IPv6 یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین env مربوط به proxy فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و variantهای lowercase آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌تواند `api.telegram.org` را bypass کند.
    - اگر proxy مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای یک service environment پیکربندی شده باشد و هیچ env استاندارد proxy وجود نداشته باشد، Telegram نیز از آن URL برای انتقال Bot API استفاده می‌کند.
    - روی میزبان‌های VPS با خروجی مستقیم/TLS ناپایدار، فراخوانی‌های Telegram API را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به طور پیش‌فرض `autoSelectFamily=true` است (به‌جز WSL2). ترتیب نتیجه DNS برای Telegram ابتدا `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، سپس `channels.telegram.network.dnsResultOrder`، سپس پیش‌فرض فرایند مانند `NODE_OPTIONS=--dns-result-order=ipv4first` را رعایت می‌کند؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` برمی‌گردد.
    - اگر میزبان شما WSL2 است یا صراحتا با رفتار فقط IPv4 بهتر کار می‌کند، family selection را force کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های benchmark-range مربوط به RFC 2544 (`198.18.0.0/15`) از قبل به طور پیش‌فرض
      برای دانلودهای رسانه Telegram مجاز هستند. اگر یک fake-IP مورد اعتماد یا
      proxy شفاف، `api.telegram.org` را هنگام دانلودهای رسانه به یک آدرس
      خصوصی/داخلی/special-use دیگر بازنویسی می‌کند، می‌توانید به bypass فقط مخصوص Telegram
      opt in کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین opt-in برای هر حساب نیز در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر proxy شما میزبان‌های رسانه Telegram را به `198.18.x.x` resolve می‌کند، ابتدا
      flag خطرناک را خاموش بگذارید. رسانه Telegram از قبل به طور پیش‌فرض محدوده
      benchmark مربوط به RFC 2544 را مجاز می‌کند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانه Telegram
      را ضعیف می‌کند. فقط برای محیط‌های proxy مورد اعتماد و تحت کنترل operator
      مانند routing مبتنی بر fake-IP در Clash، Mihomo یا Surge از آن استفاده کنید، وقتی آن‌ها
      پاسخ‌های private یا special-use خارج از محدوده benchmark مربوط به RFC 2544
      را synthesize می‌کنند. برای دسترسی عادی Telegram از internet عمومی، آن را خاموش بگذارید.
    </Warning>

    - بازنویسی‌های Environment (موقت):
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

راهنمای بیشتر: [عیب‌یابی Channel](/fa/channels/troubleshooting).

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Telegram](/fa/gateway/config-channels#telegram).

<Accordion title="فیلدهای پرسیگنال Telegram">

- startup/auth: `enabled`، `botToken`، `tokenFile`، `accounts.*` (`tokenFile` باید به یک فایل عادی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، `bindings[]` سطح بالا (`type: "acp"`)
- تأییدهای exec: `execApprovals`، `accounts.*.execApprovals`
- دستور/menu: `commands.native`، `commands.nativeSkills`، `customCommands`
- thread/replyها: `replyToMode`، `dm.threadReplies`، `direct.*.threadReplies`
- streaming: `streaming` (preview)، `streaming.preview.toolProgress`، `blockStreaming`
- قالب‌بندی/delivery: `textChunkLimit`، `chunkMode`، `linkPreview`، `responsePrefix`
- media/network: `mediaMaxMb`، `mediaGroupFlushMs`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ `/bot<TOKEN>` را include نکنید)
- webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- actionها/capabilityها: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactionها: `reactionNotifications`، `reactionLevel`
- خطاها: `errorPolicy`، `errorCooldownMs`
- نوشتن‌ها/history: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را include کنید) تا routing پیش‌فرض صریح شود. در غیر این صورت OpenClaw به اولین شناسه حساب normalized fallback می‌کند و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقدارهای `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را با gateway pair کنید.
  </Card>
  <Card title="Groupها" icon="users" href="/fa/channels/groups">
    رفتار allowlist برای group و topic.
  </Card>
  <Card title="Routing مربوط به Channel" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به agentها route کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و hardening.
  </Card>
  <Card title="Routing چند-agent" icon="sitemap" href="/fa/concepts/multi-agent">
    groupها و topicها را به agentها map کنید.
  </Card>
  <Card title="عیب‌یابی" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های cross-channel.
  </Card>
</CardGroup>

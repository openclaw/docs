---
read_when:
    - کار روی قابلیت‌های Telegram یا Webhook‌ها
summary: وضعیت پشتیبانی ربات Telegram، قابلیت‌ها و پیکربندی
title: Telegram
x-i18n:
    generated_at: "2026-05-04T07:02:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ef1b019a6a0e261b33972b5edffaedd29310b1333d112bade2e79e9d56887c6
    source_path: channels/telegram.md
    workflow: 16
---

آمادهٔ تولید برای DMهای ربات و گروه‌ها از طریق grammY. حالت پیش‌فرض long polling است؛ حالت Webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست DM پیش‌فرض برای Telegram جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی‌های میان‌کانالی و راهنماهای رفع مشکل.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و مثال‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="ساخت توکن ربات در BotFather">
    Telegram را باز کنید و با **@BotFather** گفتگو کنید (تأیید کنید که شناسه دقیقاً `@BotFather` است).

    دستور `/newbot` را اجرا کنید، اعلان‌ها را دنبال کنید، و توکن را ذخیره کنید.

  </Step>

  <Step title="پیکربندی توکن و سیاست DM">

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

  <Step title="شروع gateway و تأیید اولین DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.

  </Step>

  <Step title="افزودن ربات به یک گروه">
    ربات را به گروه خود اضافه کنید، سپس `channels.telegram.groups` و `groupPolicy` را مطابق مدل دسترسی خود تنظیم کنید.
  </Step>
</Steps>

<Note>
ترتیب حل توکن از حساب آگاه است. در عمل، مقدارهای config بر جایگزین env اولویت دارند، و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و مشاهده‌پذیری گروه">
    ربات‌های Telegram به‌صورت پیش‌فرض در **Privacy Mode** هستند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر ربات باید همه پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را از طریق `/setprivacy` غیرفعال کنید، یا
    - ربات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، ربات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت مدیر بودن در تنظیمات گروه Telegram کنترل می‌شود.

    ربات‌های مدیر همه پیام‌های گروه را دریافت می‌کنند، که برای رفتار همیشه‌فعال در گروه مفید است.

  </Accordion>

  <Accordion title="کلیدهای مفید BotFather">

    - `/setjoingroups` برای مجاز/غیرمجاز کردن افزودن به گروه‌ها
    - `/setprivacy` برای رفتار مشاهده‌پذیری گروه

  </Accordion>
</AccordionGroup>

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست DM">
    `channels.telegram.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (نیازمند حداقل یک شناسه فرستنده در `allowFrom`)
    - `open` (نیازمند این است که `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` به هر حساب Telegram که نام کاربری ربات را پیدا یا حدس بزند اجازه می‌دهد به ربات فرمان بدهد. آن را فقط برای ربات‌های عمداً عمومی با ابزارهای به‌شدت محدود استفاده کنید؛ ربات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربر Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در configهای چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های سطح حساب `allowFrom: ["*"]` آن حساب را عمومی نمی‌کنند مگر اینکه allowlist مؤثر حساب پس از ادغام همچنان یک wildcard صریح داشته باشد.
    `dmPolicy: "allowlist"` با `allowFrom` خالی همه DMها را مسدود می‌کند و توسط اعتبارسنجی config رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند.
    اگر ارتقا داده‌اید و config شما شامل ورودی‌های allowlist از نوع `@username` است، برای حل آن‌ها `openclaw doctor --fix` را اجرا کنید (بهترین تلاش؛ نیازمند توکن ربات Telegram).
    اگر قبلاً به فایل‌های allowlist ذخیره جفت‌سازی متکی بودید، `openclaw doctor --fix` می‌تواند ورودی‌ها را در جریان‌های allowlist به `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز هیچ شناسه صریحی ندارد).

    برای ربات‌های تک‌مالک، `dmPolicy: "allowlist"` را با شناسه‌های عددی صریح `allowFrom` ترجیح دهید تا سیاست دسترسی در config پایدار بماند (به‌جای وابستگی به تأییدهای قبلی جفت‌سازی).

    ابهام رایج: تأیید جفت‌سازی DM به معنی «این فرستنده در همه‌جا مجاز است» نیست.
    جفت‌سازی دسترسی DM را اعطا می‌کند. اگر هنوز مالک فرمانی وجود نداشته باشد، اولین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط‌مالک و تأییدهای exec یک حساب اپراتور صریح داشته باشند.
    مجوز فرستنده در گروه همچنان از allowlistهای صریح config می‌آید.
    اگر می‌خواهید «یک‌بار مجاز شوم و هم DMها و هم فرمان‌های گروه کار کنند»، شناسه عددی کاربر Telegram خود را در `channels.telegram.allowFrom` قرار دهید؛ برای فرمان‌های فقط‌مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### یافتن شناسه کاربر Telegram شما

    امن‌تر (بدون ربات شخص ثالث):

    1. به ربات خود DM بدهید.
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

    1. **کدام گروه‌ها مجاز هستند** (`channels.telegram.groups`)
       - بدون config مربوط به `groups`:
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسه گروه را بگذراند
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها مسدود می‌شوند تا زمانی که ورودی‌های `groups` (یا `"*"`) را اضافه کنید
       - وقتی `groups` پیکربندی شده باشد: مانند allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستنده گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` برمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربر Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های گفتگوی گروه یا ابرگروه Telegram را در `groupAllowFrom` قرار ندهید. شناسه‌های منفی گفتگو زیر `channels.telegram.groups` قرار می‌گیرند.
    ورودی‌های غیرعددی برای مجوز فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز هویت فرستنده گروه، تأییدهای ذخیره جفت‌سازی DM را به ارث **نمی‌برد**.
    جفت‌سازی فقط برای DM باقی می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` در سطح هر گروه/هر موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به config `allowFrom` برمی‌گردد، نه ذخیره جفت‌سازی.
    الگوی عملی برای ربات‌های تک‌مالک: شناسه کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکته زمان اجرا: اگر `channels.telegram` کاملاً وجود نداشته باشد، پیش‌فرض زمان اجرا fail-closed با `groupPolicy="allowlist"` است مگر اینکه `channels.defaults.groupPolicy` صراحتاً تنظیم شده باشد.

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
      اشتباه رایج: `groupAllowFrom`، allowlist گروه Telegram نیست.

      - شناسه‌های منفی گفتگوی گروه یا ابرگروه Telegram مانند `-1001234567890` را زیر `channels.telegram.groups` قرار دهید.
      - وقتی می‌خواهید محدود کنید چه کسانی داخل یک گروه مجاز بتوانند ربات را فعال کنند، شناسه‌های کاربر Telegram مانند `8734062810` را زیر `groupAllowFrom` قرار دهید.
      - فقط زمانی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با ربات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="رفتار منشن">
    پاسخ‌های گروهی به‌صورت پیش‌فرض به منشن نیاز دارند.

    منشن می‌تواند از این موارد بیاید:

    - منشن بومی `@botusername`، یا
    - الگوهای منشن در:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    کلیدهای فرمان در سطح نشست:

    - `/activation always`
    - `/activation mention`

    این‌ها فقط وضعیت نشست را به‌روزرسانی می‌کنند. برای پایداری از config استفاده کنید.

    مثال config پایدار:

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

    دریافت شناسه گفتگوی گروه:

    - یک پیام گروهی را به `@userinfobot` / `@getidsbot` فوروارد کنید
    - یا `chat.id` را از `openclaw logs --follow` بخوانید
    - یا Bot API `getUpdates` را بررسی کنید

  </Tab>
</Tabs>

## رفتار زمان اجرا

- Telegram در مالکیت فرایند gateway است.
- مسیریابی قطعی است: ورودی Telegram به Telegram پاسخ داده می‌شود (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به پوشش مشترک کانال با فراداده پاسخ و جای‌نگهدارهای رسانه نرمال‌سازی می‌شوند.
- نشست‌های گروهی بر اساس شناسه گروه ایزوله می‌شوند. موضوع‌های فروم `:topic:<threadId>` را اضافه می‌کنند تا موضوع‌ها ایزوله بمانند.
- پیام‌های DM می‌توانند `message_thread_id` داشته باشند؛ OpenClaw شناسه رشته را برای پاسخ‌ها حفظ می‌کند اما به‌صورت پیش‌فرض DMها را روی نشست تخت نگه می‌دارد. وقتی عمداً ایزوله‌سازی نشست موضوع DM را می‌خواهید، `channels.telegram.dm.threadReplies: "inbound"`، `channels.telegram.direct.<chatId>.threadReplies: "inbound"`، `requireTopic: true`، یا یک config موضوع مطابق را پیکربندی کنید.
- long polling از grammY runner با ترتیب‌دهی به‌ازای هر گفتگو/هر رشته استفاده می‌کند. همزمانی کلی runner sink از `agents.defaults.maxConcurrent` استفاده می‌کند.
- long polling داخل هر فرایند gateway محافظت می‌شود تا در هر زمان فقط یک poller فعال بتواند از توکن ربات استفاده کند. اگر همچنان تداخل‌های `getUpdates` 409 می‌بینید، احتمالاً یک gateway دیگر OpenClaw، اسکریپت، یا poller خارجی از همان توکن استفاده می‌کند.
- شروع‌های مجدد نگهبان long-polling به‌صورت پیش‌فرض پس از ۱۲۰ ثانیه بدون liveness تکمیل‌شده `getUpdates` فعال می‌شوند. فقط اگر استقرار شما همچنان هنگام کارهای طولانی‌مدت شروع مجددهای کاذب polling-stall می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ overrideهای به‌ازای حساب پشتیبانی می‌شوند.
- Telegram Bot API از رسید خواندن پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="پیش‌نمایش پخش زنده (ویرایش پیام)">
    OpenClaw می‌تواند پاسخ‌های جزئی را به‌صورت بلادرنگ stream کند:

    - گفتگوهای مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/موضوع‌ها: پیام پیش‌نمایش + `editMessageText`

    نیازمندی:

    - `channels.telegram.streaming` برابر `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - `progress` یک پیش‌نویس وضعیت قابل‌ویرایش را نگه می‌دارد و تا تحویل نهایی آن را با پیشرفت ابزار به‌روزرسانی می‌کند
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده دوباره استفاده کنند یا نه (پیش‌فرض: وقتی stream کردن پیش‌نمایش فعال است `true`)
    - `streaming.preview.commandText` جزئیات command/exec داخل آن خطوط tool-progress را کنترل می‌کند: `raw` (پیش‌فرض، رفتار منتشرشده را حفظ می‌کند) یا `status` (فقط برچسب ابزار)
    - مقدارهای قدیمی `channels.telegram.streamMode` و بولی `streaming` شناسایی می‌شوند؛ برای مهاجرت آن‌ها به `channels.telegram.streaming.mode`، `openclaw doctor --fix` را اجرا کنید

    به‌روزرسانی‌های پیش‌نمایش tool-progress خطوط کوتاه وضعیتی هستند که هنگام اجرای ابزارها نشان داده می‌شوند، برای مثال اجرای فرمان، خواندن فایل‌ها، به‌روزرسانی‌های برنامه‌ریزی، یا خلاصه‌های patch. Telegram این‌ها را به‌صورت پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشده OpenClaw از `v2026.4.22` و بعد از آن هم‌خوان باشد. برای نگه داشتن پیش‌نمایش ویرایش‌شده برای متن پاسخ اما پنهان کردن خطوط tool-progress، تنظیم کنید:

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

    برای اینکه tool-progress قابل مشاهده بماند اما متن command/exec پنهان شود، تنظیم کنید:

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

    از `streaming.mode: "off"` فقط زمانی استفاده کنید که تحویل فقط نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و گفت‌وگوی عمومی ابزار/پیشرفت به‌جای ارسال به‌صورت پیام‌های وضعیت مستقل، سرکوب می‌شود. اعلان‌های تأیید، بارهای رسانه‌ای، و خطاها همچنان از مسیر تحویل نهایی معمول عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و خط‌های وضعیت پیشرفت ابزار را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    <Note>
      پاسخ‌های نقل‌قولی انتخاب‌شده در Telegram استثنا هستند. وقتی `replyToMode` برابر `"first"`، `"all"`، یا `"batched"` باشد و پیام ورودی شامل متن نقل‌قول انتخاب‌شده باشد، OpenClaw پاسخ نهایی را به‌جای ویرایش پیش‌نمایش پاسخ، از مسیر بومی پاسخ نقل‌قولی Telegram ارسال می‌کند؛ بنابراین `streaming.preview.toolProgress` نمی‌تواند خط‌های کوتاه وضعیت را برای آن نوبت نشان دهد. پاسخ‌ها به پیام فعلی بدون متن نقل‌قول انتخاب‌شده همچنان پخش پیش‌نمایش را نگه می‌دارند. وقتی دیده‌شدن پیشرفت ابزار از پاسخ‌های نقل‌قولی بومی مهم‌تر است، `replyToMode: "off"` را تنظیم کنید، یا برای پذیرش این بده‌بستان `streaming.preview.toolProgress: false` را تنظیم کنید.
    </Note>

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و یک ویرایش نهایی را درجا انجام می‌دهد، مگر اینکه پس از ظاهر شدن پیش‌نمایش یک پیام غیرپیش‌نمایش قابل مشاهده ارسال شده باشد
    - پیش‌نمایش‌هایی که خروجی غیرپیش‌نمایش قابل مشاهده پس از آنها می‌آید: OpenClaw پاسخ کامل‌شده را به‌صورت یک پیام نهایی تازه ارسال می‌کند و پیش‌نمایش قدیمی‌تر را پاک می‌کند، بنابراین پاسخ نهایی پس از خروجی میانی ظاهر می‌شود
    - پیش‌نمایش‌های قدیمی‌تر از حدود یک دقیقه: OpenClaw پاسخ کامل‌شده را به‌صورت یک پیام نهایی تازه ارسال می‌کند و سپس پیش‌نمایش را پاک می‌کند، بنابراین مهر زمانی قابل مشاهده Telegram به‌جای زمان ایجاد پیش‌نمایش، زمان تکمیل را نشان می‌دهد

    برای پاسخ‌های پیچیده (برای مثال بارهای رسانه‌ای)، OpenClaw به تحویل نهایی معمول برمی‌گردد و سپس پیام پیش‌نمایش را پاک می‌کند.

    پخش پیش‌نمایش از پخش بلوک جداست. وقتی پخش بلوک به‌صراحت برای Telegram فعال باشد، OpenClaw برای جلوگیری از پخش دوگانه، پخش پیش‌نمایش را نادیده می‌گیرد.

    جریان استدلال فقط مخصوص Telegram:

    - `/reasoning stream` هنگام تولید، استدلال را به پیش‌نمایش زنده می‌فرستد
    - پیش‌نمایش استدلال پس از تحویل نهایی حذف می‌شود؛ وقتی استدلال باید قابل مشاهده باقی بماند از `/reasoning on` استفاده کنید
    - پاسخ نهایی بدون متن استدلال ارسال می‌شود

  </Accordion>

  <Accordion title="قالب‌بندی و جایگزین HTML">
    متن خروجی از Telegram `parse_mode: "HTML"` استفاده می‌کند.

    - متن شبیه Markdown به HTML ایمن برای Telegram رندر می‌شود.
    - HTML خام مدل برای کاهش شکست‌های پردازش Telegram escape می‌شود.
    - اگر Telegram HTML پردازش‌شده را رد کند، OpenClaw به‌صورت متن ساده دوباره تلاش می‌کند.

    پیش‌نمایش‌های لینک به‌طور پیش‌فرض فعال هستند و می‌توان آنها را با `channels.telegram.linkPreview: false` غیرفعال کرد.

  </Accordion>

  <Accordion title="فرمان‌های بومی و فرمان‌های سفارشی">
    ثبت منوی فرمان Telegram هنگام راه‌اندازی با `setMyCommands` انجام می‌شود.

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

    - نام‌ها نرمال‌سازی می‌شوند (`/` ابتدایی حذف می‌شود، حروف کوچک می‌شوند)
    - الگوی معتبر: `a-z`، `0-9`، `_`، طول `1..32`
    - فرمان‌های سفارشی نمی‌توانند فرمان‌های بومی را بازنویسی کنند
    - تعارض‌ها/تکراری‌ها نادیده گرفته و ثبت می‌شوند

    نکات:

    - فرمان‌های سفارشی فقط ورودی‌های منو هستند؛ رفتار را به‌طور خودکار پیاده‌سازی نمی‌کنند
    - فرمان‌های plugin/skill حتی اگر در منوی Telegram نمایش داده نشوند، همچنان می‌توانند هنگام تایپ کار کنند

    اگر فرمان‌های بومی غیرفعال باشند، داخلی‌ها حذف می‌شوند. فرمان‌های سفارشی/plugin در صورت پیکربندی همچنان ممکن است ثبت شوند.

    خطاهای رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از کوتاه‌سازی همچنان سرریز شده است؛ فرمان‌های plugin/skill/سفارشی را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` با `404: Not Found` در حالی که فرمان‌های مستقیم curl مربوط به Bot API کار می‌کنند می‌تواند به این معنا باشد که `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن بات پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان شکست پاک‌سازی webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای network/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود شده است.

    ### فرمان‌های جفت‌سازی دستگاه (plugin `device-pair`)

    وقتی plugin `device-pair` نصب شده باشد:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در برنامه iOS جای‌گذاری کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (شامل نقش/دامنه‌ها)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر را حمل می‌کند. واگذاری bootstrap داخلی توکن نود اصلی را در `scopes: []` نگه می‌دارد؛ هر توکن عملگر واگذارشده در محدوده‌های `operator.approvals`، `operator.read`، `operator.talk.secrets`، و `operator.write` محدود می‌ماند. بررسی‌های دامنه bootstrap با پیشوند نقش انجام می‌شوند، بنابراین آن allowlist عملگر فقط درخواست‌های عملگر را برآورده می‌کند؛ نقش‌های غیرعملگر همچنان به دامنه‌هایی زیر پیشوند نقش خودشان نیاز دارند.

    اگر دستگاهی با جزئیات احراز هویت تغییرکرده دوباره تلاش کند (برای مثال نقش/دامنه‌ها/کلید عمومی)، درخواست در انتظار قبلی جایگزین می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید دوباره `/pair pending` را اجرا کنید.

    جزئیات بیشتر: [جفت‌سازی](/fa/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="دکمه‌های درون‌خطی">
    دامنه صفحه‌کلید درون‌خطی را پیکربندی کنید:

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

    بازنویسی برای هر حساب:

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

    کلیک‌های callback به‌صورت متن به عامل منتقل می‌شوند:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="کنش‌های پیام Telegram برای عامل‌ها و خودکارسازی">
    کنش‌های ابزار Telegram شامل این موارد هستند:

    - `sendMessage` (`to`، `content`، اختیاری `mediaUrl`، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، اختیاری `iconColor`، `iconCustomEmojiId`)

    کنش‌های پیام کانال aliasهای ارگونومیک را ارائه می‌کنند (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    کنترل‌های محدودسازی:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌طور پیش‌فرض فعال هستند و toggleهای جداگانه `channels.telegram.actions.*` ندارند.
    ارسال‌های زمان اجرا از snapshot پیکربندی/رازهای فعال (راه‌اندازی/بارگذاری مجدد) استفاده می‌کنند، بنابراین مسیرهای کنش برای هر ارسال بازحل ad-hoc مربوط به SecretRef انجام نمی‌دهند.

    معناشناسی حذف واکنش: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="برچسب‌های رشته‌بندی پاسخ">
    Telegram از برچسب‌های رشته‌بندی پاسخ صریح در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام محرک پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسه پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` مدیریت را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی رشته‌بندی پاسخ فعال باشد و متن یا کپشن اصلی Telegram در دسترس باشد، OpenClaw به‌طور خودکار یک گزیده نقل‌قول بومی Telegram را شامل می‌کند. Telegram متن نقل‌قول بومی را به ۱۰۲۴ واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل‌قول می‌شوند و اگر Telegram نقل‌قول را رد کند به یک پاسخ ساده برمی‌گردند.

    نکته: `off` رشته‌بندی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="موضوعات انجمن و رفتار رشته">
    ابرگروه‌های انجمن:

    - کلیدهای جلسه موضوع `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و typing موضوع رشته را هدف می‌گیرند
    - مسیر پیکربندی موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالت ویژه موضوع عمومی (`threadId=1`):

    - ارسال‌های پیام `message_thread_id` را حذف می‌کنند (Telegram، `sendMessage(...thread_id=1)` را رد می‌کند)
    - کنش‌های typing همچنان `message_thread_id` را شامل می‌شوند

    وراثت موضوع: ورودی‌های موضوع تنظیمات گروه را به ارث می‌برند مگر اینکه بازنویسی شوند (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` فقط مخصوص موضوع است و از پیش‌فرض‌های گروه ارث نمی‌برد.

    **مسیریابی عامل برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در پیکربندی موضوع، به عامل متفاوتی مسیریابی شود. این به هر موضوع workspace، حافظه، و جلسه جداگانه خودش را می‌دهد. مثال:

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

    سپس هر موضوع کلید جلسه خودش را دارد: `agent:zu:telegram:group:-1001234567890:topic:3`

    **اتصال پایدار موضوع ACP**: موضوعات انجمن می‌توانند جلسه‌های harness مربوط به ACP را از طریق اتصال‌های ACP تایپ‌شده سطح بالا pin کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و یک شناسه دارای topic qualifier مانند `-1001234567890:topic:42`). در حال حاضر به موضوعات انجمن در گروه‌ها/ابرگروه‌ها محدود است. [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

    **spawn کردن ACP وابسته به رشته از chat**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک جلسه ACP جدید متصل می‌کند؛ پیگیری‌ها مستقیم به آنجا مسیریابی می‌شوند. OpenClaw تأیید spawn را داخل موضوع pin می‌کند. نیاز دارد `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    زمینهٔ الگو `MessageThreadId` و `IsForum` را در دسترس می‌گذارد. چت‌های DM با `message_thread_id` به‌طور پیش‌فرض مسیریابی DM و فرادادهٔ پاسخ را در نشست‌های تخت نگه می‌دارند؛ آن‌ها فقط وقتی از کلیدهای نشست آگاه از رشته استفاده می‌کنند که با `threadReplies: "inbound"`، `threadReplies: "always"`، `requireTopic: true`، یا یک پیکربندی موضوع منطبق تنظیم شده باشند. برای پیش‌فرض حساب از `channels.telegram.dm.threadReplies` در سطح بالا استفاده کنید، یا برای یک DM از `direct.<chatId>.threadReplies`.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### پیام‌های صوتی

    Telegram میان یادداشت‌های صوتی و فایل‌های صوتی تمایز می‌گذارد.

    - پیش‌فرض: رفتار فایل صوتی
    - برچسب `[[audio_as_voice]]` در پاسخ عامل برای اجبار ارسال یادداشت صوتی
    - رونویسی‌های یادداشت صوتی ورودی در زمینهٔ عامل به‌عنوان متن تولیدشده توسط ماشین و نامطمئن قاب‌بندی می‌شوند؛ تشخیص اشاره همچنان از رونویسی خام استفاده می‌کند تا پیام‌های صوتی وابسته به اشاره همچنان کار کنند.

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

    Telegram میان فایل‌های ویدیویی و یادداشت‌های ویدیویی تمایز می‌گذارد.

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

    ارسال کنش استیکر:

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

  <Accordion title="Reaction notifications">
    واکنش‌های Telegram به‌صورت به‌روزرسانی‌های `message_reaction` می‌رسند (جدا از بارهای پیام).

    هنگام فعال بودن، OpenClaw رویدادهای سیستمی مانند این را در صف قرار می‌دهد:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکته‌ها:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط ربات (بهترین تلاش از طریق کش پیام‌های ارسال‌شده).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ فرستنده‌های غیرمجاز حذف می‌شوند.
    - Telegram شناسهٔ رشته را در به‌روزرسانی‌های واکنش ارائه نمی‌کند.
      - گروه‌های غیرانجمنی به نشست چت گروهی مسیریابی می‌شوند
      - گروه‌های انجمنی به نشست موضوع عمومی گروه (`:topic:1`) مسیریابی می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/Webhook به‌طور خودکار شامل `message_reaction` است.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` در حالی که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید می‌فرستد.

    ترتیب حل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکته‌ها:

    - Telegram انتظار ایموجی یونیکد دارد (برای مثال "👀").
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    نوشتن پیکربندی کانال به‌طور پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های برانگیخته از Telegram شامل این موارد است:

    - رویدادهای مهاجرت گروه (`migrate_to_chat_id`) برای به‌روزرسانی `channels.telegram.groups`
    - `/config set` و `/config unset` (به فعال‌سازی فرمان نیاز دارد)

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

  <Accordion title="Long polling vs webhook">
    پیش‌فرض long polling است. برای حالت Webhook، `channels.telegram.webhookUrl` و `channels.telegram.webhookSecret` را تنظیم کنید؛ `webhookPath`، `webhookHost`، `webhookPort` اختیاری‌اند (پیش‌فرض‌ها `/telegram-webhook`، `127.0.0.1`، `8787`).

    شنوندهٔ محلی به `127.0.0.1:8787` متصل می‌شود. برای ورودی عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا عامدانه `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook پیش از بازگرداندن `200` به Telegram، نگهبان‌های درخواست، توکن محرمانهٔ Telegram، و بدنهٔ JSON را اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان مسیرهای ربات به‌ازای هر چت/هر موضوع که در long polling استفاده می‌شوند پردازش می‌کند، بنابراین نوبت‌های کند عامل، ACK تحویل Telegram را معطل نمی‌کنند.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خطوط خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازهٔ رسانهٔ ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.mediaGroupFlushMs` (پیش‌فرض 500) کنترل می‌کند آلبوم‌ها/گروه‌های رسانه‌ای Telegram چه مدت پیش از اینکه OpenClaw آن‌ها را به‌عنوان یک پیام ورودی dispatch کند، buffer شوند. اگر بخش‌های آلبوم دیر می‌رسند، آن را افزایش دهید؛ برای کاهش تأخیر پاسخ آلبوم، آن را کاهش دهید.
    - `channels.telegram.timeoutSeconds` timeout کلاینت Telegram API را بازنویسی می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های ربات مقادیر پیکربندی‌شدهٔ کمتر از نگهبان 60 ثانیه‌ای درخواست متن/تایپ خروجی را clamp می‌کنند تا grammY تحویل پاسخ قابل مشاهده را پیش از اجرای نگهبان transport و fallback در OpenClaw لغو نکند. Long polling همچنان از نگهبان درخواست 45 ثانیه‌ای `getUpdates` استفاده می‌کند تا pollهای بیکار به‌طور نامحدود رها نشوند.
    - `channels.telegram.pollingStallThresholdMs` به‌طور پیش‌فرض `120000` است؛ فقط برای راه‌اندازی‌های مجدد polling-stall مثبت کاذب، آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچهٔ زمینهٔ گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` استفاده می‌کند (پیش‌فرض 50)؛ `0` غیرفعال می‌کند.
    - زمینهٔ تکمیلی پاسخ/نقل‌قول/forward در حال حاضر همان‌طور که دریافت شده منتقل می‌شود.
    - allowlistهای Telegram عمدتاً کنترل می‌کنند چه کسی می‌تواند عامل را فعال کند، نه یک مرز کامل ویرایش زمینهٔ تکمیلی.
    - کنترل‌های تاریخچهٔ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای API خروجی قابل بازیابی، روی کمک‌تابع‌های ارسال Telegram (CLI/ابزارها/کنش‌ها) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای خرابی‌های پیش‌اتصال Telegram از یک retry محدود safe-send استفاده می‌کند، اما envelopeهای شبکه‌ای مبهم پس از ارسال را که ممکن است پیام‌های قابل مشاهده را تکراری کنند، retry نمی‌کند.

    هدف ارسال CLI می‌تواند شناسهٔ عددی چت یا نام کاربری باشد:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    pollهای Telegram از `openclaw message poll` استفاده می‌کنند و از موضوعات انجمن پشتیبانی می‌کنند:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    پرچم‌های poll فقط مخصوص Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` برای موضوعات انجمن (یا از یک هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین از این موارد پشتیبانی می‌کند:

    - `--presentation` با بلوک‌های `buttons` برای صفحه‌کلیدهای inline وقتی `channels.telegram.capabilities.inlineButtons` اجازه دهد
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل pin‌شده وقتی ربات بتواند در آن چت pin کند
    - `--force-document` برای ارسال تصاویر خروجی و GIFها به‌صورت سند به‌جای آپلود عکس فشرده یا رسانهٔ متحرک

    کنترل کنش:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ساخت poll در Telegram را غیرفعال می‌کند و ارسال‌های عادی را فعال نگه می‌دارد

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram از تأییدهای exec در DMهای تأییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در چت یا موضوع مبدأ ارسال کند. تأییدکنندگان باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی حداقل یک تأییدکننده قابل حل باشد، خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی owner از `commands.ownerAllowFrom` fallback می‌کند)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom`، و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با ربات صحبت کند و ربات پاسخ‌های عادی را کجا ارسال می‌کند. آن‌ها کسی را به تأییدکنندهٔ exec تبدیل نمی‌کنند. نخستین pair کردن DM تأییدشده، وقتی هنوز owner فرمانی وجود ندارد، `commands.ownerAllowFrom` را bootstrap می‌کند، بنابراین راه‌اندازی تک‌مالک همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانال متن فرمان را در چت نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/موضوعات مورد اعتماد فعال کنید. وقتی prompt در یک موضوع انجمن قرار می‌گیرد، OpenClaw موضوع را برای prompt تأیید و پیگیری حفظ می‌کند. تأییدهای exec به‌طور پیش‌فرض پس از 30 دقیقه منقضی می‌شوند.

    دکمه‌های تأیید inline نیز نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group`، یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدهای plugin حل می‌شوند؛ سایر موارد ابتدا از طریق تأییدهای exec حل می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی عامل با خطای تحویل یا provider روبه‌رو می‌شود، Telegram می‌تواند یا با متن خطا پاسخ دهد یا آن را سرکوب کند. دو کلید پیکربندی این رفتار را کنترل می‌کنند:

| کلید                                | مقادیر           | پیش‌فرض | توضیح                                                                                         |
| ----------------------------------- | ---------------- | ------- | --------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` یک پیام خطای دوستانه به چت می‌فرستد. `silent` پاسخ‌های خطا را کاملاً سرکوب می‌کند. |
| `channels.telegram.errorCooldownMs` | عدد (ms)         | `60000` | حداقل زمان بین پاسخ‌های خطا به همان چت. از هرزپیام خطا هنگام قطعی‌ها جلوگیری می‌کند.       |

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
  <Accordion title="Bot does not respond to non mention group messages">

    - اگر `requireMention=false`، حالت حریم خصوصی Telegram باید دید کامل را مجاز کند.
      - BotFather: `/setprivacy` -> Disable
      - سپس ربات را از گروه حذف کنید و دوباره اضافه کنید
    - وقتی پیکربندی انتظار پیام‌های گروهی بدون اشاره را داشته باشد، `openclaw channels status` هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ wildcard `"*"` را نمی‌توان از نظر عضویت probe کرد.
    - آزمون سریع نشست: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا شامل `"*"` باشد)
    - عضویت bot در گروه را تأیید کنید
    - گزارش‌ها را بررسی کنید: `openclaw logs --follow` برای دلایل رد شدن

  </Accordion>

  <Accordion title="دستورات به‌صورت جزئی کار می‌کنند یا اصلاً کار نمی‌کنند">

    - هویت فرستنده خود را مجاز کنید (pairing و/یا `allowFrom` عددی)
    - مجوزدهی دستورها حتی وقتی سیاست گروه `open` است همچنان اعمال می‌شود
    - `setMyCommands failed` با `BOT_COMMANDS_TOO_MUCH` یعنی منوی بومی ورودی‌های بیش‌ازحد زیادی دارد؛ تعداد دستورهای Plugin/Skills/سفارشی را کاهش دهید یا منوهای بومی را غیرفعال کنید
    - فراخوانی‌های راه‌اندازی `deleteMyCommands` / `setMyCommands` و فراخوانی‌های تایپ `sendChatAction` محدود هستند و هنگام timeout درخواست، یک‌بار از طریق fallback انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار شبکه/fetch معمولاً نشان‌دهنده مشکل دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="راه‌اندازی، token غیرمجاز گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای token پیکربندی‌شده bot است.
    - token مربوط به bot را در BotFather دوباره کپی یا بازتولید کنید، سپس `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken` یا `TELEGRAM_BOT_TOKEN` را برای حساب پیش‌فرض به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام راه‌اندازی نیز شکست احراز هویت است؛ تلقی کردن آن به‌عنوان «هیچ webhookی وجود ندارد» فقط همان شکست token نامعتبر را به فراخوانی‌های بعدی API موکول می‌کند.

  </Accordion>

  <Accordion title="ناپایداری polling یا شبکه">

    - Node 22+ همراه با fetch/proxy سفارشی می‌تواند در صورت ناسازگاری نوع‌های AbortSignal باعث رفتار abort فوری شود.
    - برخی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 resolve می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث شکست‌های متناوب API Telegram شود.
    - اگر گزارش‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این‌ها را به‌عنوان خطاهای شبکه قابل بازیابی دوباره تلاش می‌کند.
    - هنگام راه‌اندازی polling، OpenClaw probe موفق `getMe` راه‌اندازی را برای grammY دوباره استفاده می‌کند تا اجراکننده پیش از اولین `getUpdates` به `getMe` دوم نیاز نداشته باشد.
    - اگر `deleteWebhook` هنگام راه‌اندازی polling با خطای شبکه گذرا شکست بخورد، OpenClaw به‌جای انجام یک فراخوانی control-plane دیگر پیش از poll، وارد long polling می‌شود. Webhook همچنان فعال به‌صورت تعارض `getUpdates` نمایان می‌شود؛ سپس OpenClaw انتقال Telegram را دوباره می‌سازد و cleanup webhook را دوباره تلاش می‌کند.
    - اگر socketهای Telegram با یک آهنگ ثابت کوتاه بازیافت می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ clientهای bot مقادیر پیکربندی‌شده زیر guardهای درخواست خروجی و `getUpdates` را clamp می‌کنند، اما نسخه‌های قدیمی‌تر وقتی این مقدار زیر آن guardها تنظیم می‌شد می‌توانستند هر poll یا پاسخ را abort کنند.
    - اگر گزارش‌ها شامل `Polling stall detected` باشند، OpenClaw به‌صورت پیش‌فرض پس از ۱۲۰ ثانیه بدون liveness تکمیل‌شده long-poll، polling را restart می‌کند و انتقال Telegram را دوباره می‌سازد.
    - `openclaw channels status --probe` و `openclaw doctor` وقتی یک حساب polling در حال اجرا پس از مهلت شروع، `getUpdates` را کامل نکرده باشد، وقتی یک حساب webhook در حال اجرا پس از مهلت شروع، `setWebhook` را کامل نکرده باشد، یا وقتی آخرین فعالیت موفق انتقال polling کهنه باشد، هشدار می‌دهند.
    - `channels.telegram.pollingStallThresholdMs` را فقط زمانی افزایش دهید که فراخوانی‌های بلندمدت `getUpdates` سالم هستند اما میزبان شما همچنان restartهای polling-stall مثبت کاذب گزارش می‌کند. stallهای پایدار معمولاً به مشکلات proxy، DNS، IPv6 یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین envهای proxy فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و گونه‌های حروف کوچک آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌تواند `api.telegram.org` را bypass کند.
    - اگر proxy مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای یک محیط سرویس پیکربندی شده باشد و env استاندارد proxy وجود نداشته باشد، Telegram نیز از همان URL برای انتقال Bot API استفاده می‌کند.
    - روی میزبان‌های VPS با خروجی/TLS مستقیم ناپایدار، فراخوانی‌های API Telegram را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌صورت پیش‌فرض `autoSelectFamily=true` دارد (به‌جز WSL2). ترتیب نتیجه DNS برای Telegram ابتدا `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، سپس `channels.telegram.network.dnsResultOrder`، سپس پیش‌فرض فرایند مانند `NODE_OPTIONS=--dns-result-order=ipv4first` را رعایت می‌کند؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` fallback می‌کند.
    - اگر میزبان شما WSL2 است یا صراحتاً با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب خانواده را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های بازه benchmark RFC 2544 (`198.18.0.0/15`) از قبل به‌صورت پیش‌فرض
      برای دانلودهای رسانه Telegram مجاز هستند. اگر یک fake-IP قابل‌اعتماد یا
      proxy شفاف، هنگام دانلود رسانه، `api.telegram.org` را به نشانی خصوصی/داخلی/کاربرد ویژه دیگری بازنویسی کند، می‌توانید
      در bypass مخصوص Telegram opt in کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین opt-in برای هر حساب در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` نیز در دسترس است.
    - اگر proxy شما میزبان‌های رسانه Telegram را به `198.18.x.x` resolve می‌کند، ابتدا
      flag خطرناک را خاموش نگه دارید. رسانه Telegram از قبل بازه benchmark
      RFC 2544 را به‌صورت پیش‌فرض مجاز می‌داند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانه Telegram را تضعیف می‌کند. فقط در محیط‌های proxy قابل‌اعتماد و تحت کنترل operator مانند مسیریابی fake-IP در Clash، Mihomo یا Surge از آن استفاده کنید، آن هم زمانی که پاسخ‌های خصوصی یا کاربرد ویژه خارج از بازه benchmark RFC 2544 تولید می‌کنند. برای دسترسی عادی عمومی اینترنت به Telegram، آن را خاموش نگه دارید.
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

<Accordion title="فیلدهای پُرسیگنال Telegram">

- راه‌اندازی/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` باید به یک فایل معمولی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` سطح بالا (`type: "acp"`)
- تأییدهای exec: `execApprovals`, `accounts.*.execApprovals`
- دستور/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread/reply: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (پیش‌نمایش), `streaming.preview.toolProgress`, `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ شامل `/bot<TOKEN>` نباشد)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actionها/capabilityها: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactionها: `reactionNotifications`, `reactionLevel`
- خطاها: `errorPolicy`, `errorCooldownMs`
- نوشتن/history: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را شامل کنید) تا مسیریابی پیش‌فرض صریح شود. در غیر این صورت OpenClaw به اولین شناسه حساب نرمال‌شده fallback می‌کند و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقدارهای `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را به Gateway pair کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار allowlist گروه و موضوع.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به agentها مسیریابی کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    گروه‌ها و موضوع‌ها را به agentها نگاشت کنید.
  </Card>
  <Card title="عیب‌یابی" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی‌های میان‌کانالی.
  </Card>
</CardGroup>

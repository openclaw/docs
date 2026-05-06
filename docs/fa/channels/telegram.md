---
read_when:
    - کار روی قابلیت‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-06T09:04:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08475cd9dd3cf641f482db94a0581e4e382a60be4bd6f3bf3d50b980b0235090
    source_path: channels/telegram.md
    workflow: 16
---

آمادهٔ تولید برای پیام‌های مستقیم ربات و گروه‌ها از طریق grammY. حالت پیش‌فرض، long polling است؛ حالت Webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای Telegram، جفت‌سازی است.
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
  <Step title="Create the bot token in BotFather">
    Telegram را باز کنید و با **@BotFather** گفت‌وگو کنید (مطمئن شوید شناسه دقیقاً `@BotFather` است).

    `/newbot` را اجرا کنید، دستورها را دنبال کنید، و توکن را ذخیره کنید.

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
    Telegram از `openclaw channels login telegram` استفاده **نمی‌کند**؛ توکن را در پیکربندی/محیط تنظیم کنید، سپس Gateway را شروع کنید.

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
    ربات را به گروه خود اضافه کنید، سپس `channels.telegram.groups` و `groupPolicy` را مطابق مدل دسترسی خود تنظیم کنید.
  </Step>
</Steps>

<Note>
ترتیب حل توکن، حساب‌آگاه است. در عمل، مقادیر پیکربندی بر جایگزین محیطی اولویت دارند، و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    ربات‌های Telegram به‌طور پیش‌فرض از **Privacy Mode** استفاده می‌کنند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر ربات باید همهٔ پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را از طریق `/setprivacy` غیرفعال کنید، یا
    - ربات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، ربات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="Group permissions">
    وضعیت مدیر در تنظیمات گروه Telegram کنترل می‌شود.

    ربات‌های مدیر همهٔ پیام‌های گروه را دریافت می‌کنند، که برای رفتار گروهی همیشه‌فعال مفید است.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` برای اجازه/رد کردن افزودن به گروه
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

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` به هر حساب Telegram که نام کاربری ربات را پیدا یا حدس بزند اجازه می‌دهد به ربات فرمان دهد. فقط برای ربات‌های عمداً عمومی با ابزارهای بسیار محدود از آن استفاده کنید؛ ربات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربران Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در پیکربندی‌های چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های `allowFrom: ["*"]` در سطح حساب، آن حساب را عمومی نمی‌کنند مگر اینکه allowlist مؤثر حساب پس از ادغام همچنان شامل wildcard صریح باشد.
    `dmPolicy: "allowlist"` با `allowFrom` خالی همهٔ پیام‌های مستقیم را مسدود می‌کند و توسط اعتبارسنجی پیکربندی رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند.
    اگر ارتقا داده‌اید و پیکربندی شما شامل ورودی‌های allowlist از نوع `@username` است، `openclaw doctor --fix` را اجرا کنید تا آن‌ها را حل کند (بهترین تلاش؛ به توکن ربات Telegram نیاز دارد).
    اگر قبلاً به فایل‌های allowlist مربوط به pairing-store متکی بودید، `openclaw doctor --fix` می‌تواند در جریان‌های allowlist ورودی‌ها را در `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز شناسهٔ صریحی ندارد).

    برای ربات‌های تک‌مالک، `dmPolicy: "allowlist"` را با شناسه‌های عددی صریح `allowFrom` ترجیح دهید تا سیاست دسترسی در پیکربندی پایدار بماند (به‌جای وابستگی به تأییدهای جفت‌سازی قبلی).

    ابهام رایج: تأیید جفت‌سازی پیام مستقیم به معنی «این فرستنده همه‌جا مجاز است» نیست.
    جفت‌سازی دسترسی پیام مستقیم را اعطا می‌کند. اگر هنوز مالک فرمانی وجود نداشته باشد، نخستین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط‌مالک و تأییدهای اجرا یک حساب اپراتور صریح داشته باشند.
    مجوز فرستنده در گروه همچنان از allowlistهای صریح پیکربندی می‌آید.
    اگر می‌خواهید «یک بار مجاز شوم و هم پیام‌های مستقیم و هم فرمان‌های گروه کار کنند»، شناسهٔ عددی کاربر Telegram خود را در `channels.telegram.allowFrom` قرار دهید؛ برای فرمان‌های فقط‌مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### یافتن شناسهٔ کاربری Telegram خود

    امن‌تر (بدون ربات شخص ثالث):

    1. به ربات خود پیام مستقیم بدهید.
    2. `openclaw logs --follow` را اجرا کنید.
    3. `from.id` را بخوانید.

    روش رسمی Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    روش شخص ثالث (حریم خصوصی کمتر): `@userinfobot` یا `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    دو کنترل با هم اعمال می‌شوند:

    1. **کدام گروه‌ها مجاز هستند** (`channels.telegram.groups`)
       - بدون پیکربندی `groups`:
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسهٔ گروه را بگذراند
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها مسدود می‌شوند تا وقتی ورودی‌های `groups` (یا `"*"`) را اضافه کنید
       - `groups` پیکربندی‌شده: به‌عنوان allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستنده‌های گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` برمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربران Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های چت گروه یا سوپرگروه Telegram را در `groupAllowFrom` قرار ندهید. شناسه‌های چت منفی باید زیر `channels.telegram.groups` باشند.
    ورودی‌های غیرعددی برای مجوز فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز هویت فرستندهٔ گروه، تأییدهای DM pairing-store را به ارث **نمی‌برد**.
    جفت‌سازی فقط برای پیام مستقیم می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` در سطح هر گروه/هر موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به `allowFrom` پیکربندی برمی‌گردد، نه pairing store.
    الگوی عملی برای ربات‌های تک‌مالک: شناسهٔ کاربری خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکتهٔ زمان اجرا: اگر `channels.telegram` کاملاً وجود نداشته باشد، زمان اجرا به‌طور پیش‌فرض روی `groupPolicy="allowlist"` fail-closed می‌شود مگر اینکه `channels.defaults.groupPolicy` صریحاً تنظیم شده باشد.

    مثال: اجازه به هر عضو در یک گروه مشخص:

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

    مثال: اجازه فقط به کاربران مشخص در یک گروه مشخص:

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

      - شناسه‌های چت منفی گروه یا سوپرگروه Telegram مثل `-1001234567890` را زیر `channels.telegram.groups` قرار دهید.
      - وقتی می‌خواهید محدود کنید چه کسانی درون یک گروه مجاز بتوانند ربات را فعال کنند، شناسه‌های کاربری Telegram مثل `8734062810` را زیر `groupAllowFrom` قرار دهید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با ربات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    پاسخ‌های گروه به‌طور پیش‌فرض نیازمند mention هستند.

    mention می‌تواند از این منابع بیاید:

    - mention بومی `@botusername`، یا
    - الگوهای mention در:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    تغییرهای فرمان در سطح نشست:

    - `/activation always`
    - `/activation mention`

    این‌ها فقط وضعیت نشست را به‌روزرسانی می‌کنند. برای پایداری از پیکربندی استفاده کنید.

    نمونهٔ پیکربندی پایدار:

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
    - یا `getUpdates` در Bot API را بررسی کنید

  </Tab>
</Tabs>

## رفتار زمان اجرا

- Telegram در مالکیت فرایند Gateway است.
- مسیریابی قطعی است: ورودی Telegram به Telegram پاسخ داده می‌شود (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به envelope مشترک کانال با فرادادهٔ پاسخ و جای‌نگهدارهای رسانه نرمال‌سازی می‌شوند.
- نشست‌های گروه بر اساس شناسهٔ گروه جدا می‌شوند. موضوع‌های تالار `:topic:<threadId>` را اضافه می‌کنند تا موضوع‌ها جدا بمانند.
- پیام‌های مستقیم می‌توانند `message_thread_id` داشته باشند؛ OpenClaw شناسهٔ thread را برای پاسخ‌ها حفظ می‌کند اما پیام‌های مستقیم را به‌طور پیش‌فرض روی نشست flat نگه می‌دارد. وقتی عمداً جداسازی نشست موضوع پیام مستقیم را می‌خواهید، `channels.telegram.dm.threadReplies: "inbound"`، `channels.telegram.direct.<chatId>.threadReplies: "inbound"`، `requireTopic: true`، یا پیکربندی موضوع منطبق را تنظیم کنید.
- Long polling از grammY runner با ترتیب‌دهی در سطح هر چت/هر thread استفاده می‌کند. هم‌روندی کلی runner sink از `agents.defaults.maxConcurrent` استفاده می‌کند.
- Long polling درون هر فرایند Gateway محافظت می‌شود تا در هر زمان فقط یک poller فعال بتواند از توکن ربات استفاده کند. اگر هنوز تداخل‌های `getUpdates` 409 می‌بینید، احتمالاً یک OpenClaw Gateway، اسکریپت، یا poller خارجی دیگر از همان توکن استفاده می‌کند.
- راه‌اندازی مجدد watchdog برای long-polling به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون liveness تکمیل‌شدهٔ `getUpdates` فعال می‌شود. `channels.telegram.pollingStallThresholdMs` را فقط وقتی افزایش دهید که استقرار شما هنوز هنگام کارهای طولانی‌مدت راه‌اندازی مجدد کاذب به دلیل توقف polling می‌بیند. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ overrideهای سطح حساب پشتیبانی می‌شوند.
- Telegram Bot API از read receipt پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw می‌تواند پاسخ‌های جزئی را به‌صورت بلادرنگ stream کند:

    - چت‌های مستقیم: پیام preview + `editMessageText`
    - گروه‌ها/موضوع‌ها: پیام preview + `editMessageText`

    نیازمندی:

    - `channels.telegram.streaming` برابر `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - `progress` یک پیش‌نویس وضعیت قابل ویرایش برای پیشرفت ابزار نگه می‌دارد، آن را هنگام تکمیل پاک می‌کند، و پاسخ نهایی را به‌عنوان پیام عادی می‌فرستد
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام preview ویرایش‌شده دوباره استفاده کنند یا نه (پیش‌فرض: `true` وقتی preview streaming فعال است)
    - `streaming.preview.commandText` جزئیات فرمان/اجرا را داخل آن خطوط پیشرفت ابزار کنترل می‌کند: `raw` (پیش‌فرض، رفتار منتشرشده را حفظ می‌کند) یا `status` (فقط برچسب ابزار)
    - `channels.telegram.streamMode` قدیمی و مقادیر بولی `streaming` تشخیص داده می‌شوند؛ `openclaw doctor --fix` را اجرا کنید تا آن‌ها را به `channels.telegram.streaming.mode` مهاجرت دهید

    به‌روزرسانی‌های preview پیشرفت ابزار، خطوط وضعیت کوتاهی هستند که هنگام اجرای ابزارها نمایش داده می‌شوند، برای مثال اجرای فرمان، خواندن فایل، به‌روزرسانی‌های برنامه‌ریزی، یا خلاصه‌های patch. Telegram این‌ها را به‌طور پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشدهٔ OpenClaw از `v2026.4.22` و بعد از آن همخوان باشد. برای نگه‌داشتن preview ویرایش‌شده برای متن پاسخ اما پنهان کردن خطوط پیشرفت ابزار، این را تنظیم کنید:

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

    برای اینکه پیشرفت ابزار قابل مشاهده بماند اما متن فرمان/اجرا پنهان شود، این را تنظیم کنید:

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

    زمانی از حالت `progress` استفاده کنید که می‌خواهید پیشرفت ابزار به‌صورت قابل مشاهده نمایش داده شود، بدون اینکه پاسخ نهایی در همان پیام ویرایش شود. خط‌مشی متن فرمان را زیر `streaming.progress` قرار دهید:

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

    فقط زمانی از `streaming.mode: "off"` استفاده کنید که تحویل فقط نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و پیام‌های عمومی ابزار/پیشرفت به‌جای ارسال به‌صورت پیام‌های وضعیت مستقل، سرکوب می‌شوند. درخواست‌های تأیید، payloadهای رسانه و خطاها همچنان از مسیر تحویل نهایی معمول عبور می‌کنند. زمانی از `streaming.preview.toolProgress: false` استفاده کنید که فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و خط‌های وضعیت پیشرفت ابزار را پنهان کنید.

    <Note>
      پاسخ‌های نقل‌قول انتخاب‌شده Telegram استثنا هستند. وقتی `replyToMode` برابر `"first"`، `"all"` یا `"batched"` باشد و پیام ورودی شامل متن نقل‌قول انتخاب‌شده باشد، OpenClaw پاسخ نهایی را به‌جای ویرایش پیش‌نمایش پاسخ، از مسیر بومی پاسخِ نقل‌قول Telegram می‌فرستد؛ بنابراین `streaming.preview.toolProgress` نمی‌تواند خط‌های کوتاه وضعیت را برای آن نوبت نشان دهد. پاسخ‌های پیام جاری بدون متن نقل‌قول انتخاب‌شده همچنان جریان‌دهی پیش‌نمایش را نگه می‌دارند. وقتی دیده‌شدن پیشرفت ابزار از پاسخ‌های نقل‌قول بومی مهم‌تر است، `replyToMode: "off"` را تنظیم کنید، یا برای پذیرش این موازنه، `streaming.preview.toolProgress: false` را تنظیم کنید.
    </Note>

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و ویرایش نهایی را در همان‌جا انجام می‌دهد
    - خروجی‌های نهایی متنی بلند که به چند پیام Telegram تقسیم می‌شوند، در صورت امکان از پیش‌نمایش موجود به‌عنوان نخستین قطعه نهایی استفاده می‌کنند و سپس فقط قطعه‌های باقی‌مانده را می‌فرستند
    - خروجی‌های نهایی حالت پیشرفت، پیش‌نویس وضعیت را پاک می‌کنند و به‌جای ویرایش پیش‌نویس به پاسخ، از تحویل نهایی معمول استفاده می‌کنند
    - اگر ویرایش نهایی پیش از تأیید متن کامل‌شده شکست بخورد، OpenClaw از تحویل نهایی معمول استفاده می‌کند و پیش‌نمایش کهنه را پاک‌سازی می‌کند

    برای پاسخ‌های پیچیده (برای مثال payloadهای رسانه‌ای)، OpenClaw به تحویل نهایی معمول برمی‌گردد و سپس پیام پیش‌نمایش را پاک‌سازی می‌کند.

    جریان‌دهی پیش‌نمایش از جریان‌دهی بلوکی جدا است. وقتی جریان‌دهی بلوکی برای Telegram به‌صراحت فعال شده باشد، OpenClaw برای جلوگیری از جریان‌دهی دوباره، جریان پیش‌نمایش را رد می‌کند.

    جریان استدلال فقط برای Telegram:

    - `/reasoning stream` هنگام تولید، استدلال را به پیش‌نمایش زنده می‌فرستد
    - پیش‌نمایش استدلال پس از تحویل نهایی حذف می‌شود؛ وقتی استدلال باید قابل مشاهده باقی بماند، از `/reasoning on` استفاده کنید
    - پاسخ نهایی بدون متن استدلال ارسال می‌شود

  </Accordion>

  <Accordion title="قالب‌بندی و مسیر جایگزین HTML">
    متن خروجی از `parse_mode: "HTML"` در Telegram استفاده می‌کند.

    - متن شبیه Markdown به HTML امن برای Telegram رندر می‌شود.
    - HTML خام مدل escape می‌شود تا شکست‌های parse در Telegram کاهش یابد.
    - اگر Telegram HTML پردازش‌شده را رد کند، OpenClaw دوباره به‌صورت متن ساده تلاش می‌کند.

    پیش‌نمایش لینک‌ها به‌صورت پیش‌فرض فعال است و می‌توان آن را با `channels.telegram.linkPreview: false` غیرفعال کرد.

  </Accordion>

  <Accordion title="دستورهای بومی و دستورهای سفارشی">
    ثبت منوی دستور Telegram هنگام راه‌اندازی با `setMyCommands` انجام می‌شود.

    پیش‌فرض‌های دستور بومی:

    - `commands.native: "auto"` دستورهای بومی را برای Telegram فعال می‌کند

    مدخل‌های منوی دستور سفارشی اضافه کنید:

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
    - دستورهای سفارشی نمی‌توانند دستورهای بومی را بازنویسی کنند
    - تعارض‌ها/تکراری‌ها رد می‌شوند و در گزارش ثبت می‌شوند

    نکته‌ها:

    - دستورهای سفارشی فقط مدخل‌های منو هستند؛ رفتار را خودکار پیاده‌سازی نمی‌کنند
    - دستورهای Plugin/Skills همچنان می‌توانند هنگام تایپ‌شدن کار کنند، حتی اگر در منوی Telegram نشان داده نشوند

    اگر دستورهای بومی غیرفعال باشند، دستورهای داخلی حذف می‌شوند. دستورهای سفارشی/Plugin ممکن است در صورت پیکربندی همچنان ثبت شوند.

    شکست‌های رایج راه‌اندازی:

    - `setMyCommands failed` با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از کوتاه‌سازی همچنان از حد مجاز گذشته است؛ دستورهای Plugin/Skills/سفارشی را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands` یا `setMyCommands` با `404: Not Found` در حالی که دستورهای مستقیم Bot API با curl کار می‌کنند، می‌تواند به این معنی باشد که `channels.telegram.apiRoot` روی نقطه پایانی کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهاییِ تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن ربات پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile` یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از شروع دریافت دوره‌ای پیام‌ها متوقف می‌شود، بنابراین این مورد به‌عنوان شکست پاک‌سازی Webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای شبکه/واکشی معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود شده است.

    ### دستورهای جفت‌سازی دستگاه (`device-pair` Plugin)

    وقتی `device-pair` Plugin نصب شده باشد:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در برنامه iOS جای‌گذاری کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (شامل role/scopes)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر حمل می‌کند. تحویل داخلی bootstrap، توکن Node اصلی را در `scopes: []` نگه می‌دارد؛ هر توکن operator واگذارشده به `operator.approvals`، `operator.read`، `operator.talk.secrets` و `operator.write` محدود می‌ماند. بررسی‌های scope در bootstrap دارای پیشوند نقش هستند، بنابراین آن allowlist مربوط به operator فقط درخواست‌های operator را برآورده می‌کند؛ نقش‌های غیر operator همچنان به scopeهایی زیر پیشوند نقش خودشان نیاز دارند.

    اگر دستگاهی با جزئیات احراز هویت تغییرکرده دوباره تلاش کند (برای مثال role/scopes/public key)، درخواست در انتظار قبلی جایگزین می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید، دوباره `/pair pending` را اجرا کنید.

    جزئیات بیشتر: [جفت‌سازی](/fa/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="دکمه‌های درون‌خطی">
    محدوده صفحه‌کلید درون‌خطی را پیکربندی کنید:

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

    کلیک‌های بازفراخوانی به‌صورت متن به عامل فرستاده می‌شوند:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="کنش‌های پیام Telegram برای عامل‌ها و خودکارسازی">
    کنش‌های ابزار Telegram شامل این موارد هستند:

    - `sendMessage` (`to`، `content`، `mediaUrl` اختیاری، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، `iconColor` اختیاری، `iconCustomEmojiId`)

    کنش‌های پیام کانال aliasهای آسان‌کار ارائه می‌کنند (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    کنترل‌های محدودسازی:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    توجه: `edit` و `topic-create` در حال حاضر به‌صورت پیش‌فرض فعال هستند و toggleهای جداگانه `channels.telegram.actions.*` ندارند.
    ارسال‌های زمان اجرا از تصویر لحظه‌ای فعال پیکربندی/اسرار (راه‌اندازی/بارگذاری مجدد) استفاده می‌کنند، بنابراین مسیرهای کنش برای هر ارسال، بازحل‌کردن موردی SecretRef انجام نمی‌دهند.

    معناشناسی حذف واکنش: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="برچسب‌های رشته‌بندی پاسخ">
    Telegram از برچسب‌های صریح رشته‌بندی پاسخ در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام محرک پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسه پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` نحوه رسیدگی را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی رشته‌بندی پاسخ فعال باشد و متن یا caption اصلی Telegram در دسترس باشد، OpenClaw به‌طور خودکار یک excerpt نقل‌قول بومی Telegram را شامل می‌کند. Telegram متن نقل‌قول بومی را به 1024 واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل‌قول می‌شوند و اگر Telegram نقل‌قول را رد کند، به پاسخ ساده برمی‌گردند.

    توجه: `off` رشته‌بندی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="موضوع‌های انجمن و رفتار رشته">
    ابرگروه‌های انجمن:

    - کلیدهای نشست موضوع `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و وضعیت تایپ، رشته موضوع را هدف می‌گیرند
    - مسیر پیکربندی موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالت ویژه موضوع عمومی (`threadId=1`):

    - ارسال‌های پیام `message_thread_id` را حذف می‌کنند (Telegram، `sendMessage(...thread_id=1)` را رد می‌کند)
    - کنش‌های تایپ همچنان `message_thread_id` را شامل می‌کنند

    ارث‌بری موضوع: مدخل‌های موضوع تنظیمات گروه را به ارث می‌برند، مگر اینکه بازنویسی شوند (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` فقط مخصوص موضوع است و از پیش‌فرض‌های گروه ارث‌بری نمی‌کند.

    **مسیریابی عامل برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در پیکربندی موضوع، به عامل متفاوتی مسیریابی شود. این کار به هر موضوع، فضای کاری، حافظه و نشست ایزوله خودش را می‌دهد. مثال:

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

    **اتصال پایدار موضوع ACP**: موضوع‌های انجمن می‌توانند نشست‌های harness ACP را از طریق bindingهای ACP typed سطح بالا pin کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"` و یک شناسه واجد موضوع مثل `-1001234567890:topic:42`). در حال حاضر به موضوع‌های انجمن در گروه‌ها/ابرگروه‌ها محدود است. [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

    **spawn کردن ACP وابسته به رشته از چت**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک نشست ACP جدید bind می‌کند؛ پیگیری‌ها مستقیم به همان‌جا مسیریابی می‌شوند. OpenClaw تأیید spawn را در همان موضوع pin می‌کند. نیاز دارد `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    زمینه‌ی الگو `MessageThreadId` و `IsForum` را در دسترس قرار می‌دهد. گفت‌وگوهای DM با `message_thread_id` به‌طور پیش‌فرض مسیریابی DM و فراداده‌ی پاسخ را در نشست‌های تخت نگه می‌دارند؛ آن‌ها فقط وقتی از کلیدهای نشست آگاه از رشته استفاده می‌کنند که با `threadReplies: "inbound"`، `threadReplies: "always"`، `requireTopic: true`، یا پیکربندی topic مطابق تنظیم شده باشند. برای پیش‌فرض حساب از `channels.telegram.dm.threadReplies` در سطح بالا استفاده کنید، یا برای یک DM از `direct.<chatId>.threadReplies`.

  </Accordion>

  <Accordion title="صدا، ویدیو، و استیکرها">
    ### پیام‌های صوتی

    Telegram بین یادداشت‌های صوتی و فایل‌های صوتی تمایز قائل می‌شود.

    - پیش‌فرض: رفتار فایل صوتی
    - برچسب `[[audio_as_voice]]` در پاسخ عامل برای اجبار به ارسال یادداشت صوتی
    - رونوشت‌های یادداشت صوتی ورودی در زمینه‌ی عامل به‌صورت متن ماشین‌تولید و نامطمئن قاب‌بندی می‌شوند؛ تشخیص mention همچنان از رونوشت خام استفاده می‌کند، بنابراین پیام‌های صوتی محدودشده با mention همچنان کار می‌کنند.

    نمونه‌ی کنش پیام:

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

    Telegram بین فایل‌های ویدیویی و یادداشت‌های ویدیویی تمایز قائل می‌شود.

    نمونه‌ی کنش پیام:

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

    - WEBP ایستا: دانلود و پردازش می‌شود (placeholder `<media:sticker>`)
    - TGS متحرک: رد می‌شود
    - WEBM ویدیویی: رد می‌شود

    فیلدهای زمینه‌ی استیکر:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    فایل کش استیکر:

    - `~/.openclaw/telegram/sticker-cache.json`

    استیکرها یک‌بار توصیف می‌شوند (در صورت امکان) و برای کاهش فراخوانی‌های تکراری vision کش می‌شوند.

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

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط بات (بهترین تلاش از طریق کش پیام‌های ارسالی).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ فرستنده‌های غیرمجاز حذف می‌شوند.
    - Telegram در به‌روزرسانی‌های واکنش شناسه‌ی رشته ارائه نمی‌کند.
      - گروه‌های غیرفورومی به نشست گفت‌وگوی گروهی مسیریابی می‌شوند
      - گروه‌های فورومی به نشست topic عمومی گروه (`:topic:1`) مسیریابی می‌شوند، نه topic دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌طور خودکار شامل `message_reaction` است.

  </Accordion>

  <Accordion title="واکنش‌های تأیید دریافت">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw یک ایموجی تأیید دریافت ارسال می‌کند.

    ترتیب تفکیک:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Telegram انتظار ایموجی یونیکد دارد (برای مثال "👀").
    - برای غیرفعال‌کردن واکنش برای یک کانال یا حساب از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی کانال به‌طور پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های تحریک‌شده توسط Telegram شامل موارد زیر است:

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
    پیش‌فرض long polling است. برای حالت webhook، `channels.telegram.webhookUrl` و `channels.telegram.webhookSecret` را تنظیم کنید؛ `webhookPath`، `webhookHost`، `webhookPort` اختیاری هستند (پیش‌فرض‌ها `/telegram-webhook`، `127.0.0.1`، `8787`).

    در حالت long-polling، OpenClaw واترمارک راه‌اندازی مجدد خود را فقط پس از توزیع موفق یک به‌روزرسانی پایدار می‌کند. اگر یک handler شکست بخورد، آن به‌روزرسانی در همان فرایند قابل تلاش دوباره باقی می‌ماند و برای dedupe راه‌اندازی مجدد به‌عنوان تکمیل‌شده نوشته نمی‌شود.

    شنونده‌ی محلی به `127.0.0.1:8787` متصل می‌شود. برای ورودی عمومی، یا یک reverse proxy جلوی پورت محلی بگذارید یا عمداً `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook، guardهای درخواست، توکن محرمانه‌ی Telegram، و بدنه‌ی JSON را پیش از برگرداندن `200` به Telegram اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از همان مسیرهای بات به‌ازای هر گفت‌وگو/هر topic که long polling استفاده می‌کند پردازش می‌کند، بنابراین نوبت‌های کند عامل ACK تحویل Telegram را نگه نمی‌دارند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش دوباره، و هدف‌های CLI">
    - پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خطوط خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازه‌ی رسانه‌ی ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.mediaGroupFlushMs` (پیش‌فرض 500) کنترل می‌کند آلبوم‌ها/گروه‌های رسانه‌ای Telegram چه مدت buffer شوند پیش از آنکه OpenClaw آن‌ها را به‌عنوان یک پیام ورودی توزیع کند. اگر بخش‌های آلبوم دیر می‌رسند آن را افزایش دهید؛ برای کاهش تأخیر پاسخ آلبوم آن را کاهش دهید.
    - `channels.telegram.timeoutSeconds` زمان انتظار کلاینت API تلگرام را بازنویسی می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های بات مقدارهای پیکربندی‌شده‌ی کمتر از guard درخواست ۶۰ ثانیه‌ای متن/typing خروجی را clamp می‌کنند تا grammY تحویل پاسخ قابل مشاهده را پیش از اجرای guard انتقال و fallback در OpenClaw قطع نکند. long polling همچنان از guard درخواست ۴۵ ثانیه‌ای `getUpdates` استفاده می‌کند تا pollهای idle بی‌پایان رها نشوند.
    - پیش‌فرض `channels.telegram.pollingStallThresholdMs` برابر `120000` است؛ فقط برای راه‌اندازی‌های مجدد false-positive ناشی از توقف polling، بین `30000` و `600000` تنظیم کنید.
    - تاریخچه‌ی زمینه‌ی گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` استفاده می‌کند (پیش‌فرض 50)؛ `0` غیرفعال می‌کند.
    - زمینه‌ی تکمیلی reply/quote/forward در حال حاضر همان‌طور که دریافت شده پاس داده می‌شود.
    - allowlistهای Telegram عمدتاً کنترل می‌کنند چه کسی می‌تواند عامل را تحریک کند، نه یک مرز کامل حذف زمینه‌ی تکمیلی.
    - کنترل‌های تاریخچه‌ی DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای API خروجی قابل بازیابی روی helperهای ارسال Telegram (CLI/tools/actions) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای شکست‌های pre-connect در Telegram از تلاش دوباره‌ی safe-send محدود استفاده می‌کند، اما envelopeهای شبکه‌ی مبهم پس از ارسال را که ممکن است پیام‌های قابل مشاهده را تکراری کنند دوباره تلاش نمی‌کند.

    هدف‌های ارسال CLI و message-tool می‌توانند شناسه‌ی عددی گفت‌وگو، نام کاربری، یا هدف topic فوروم باشند:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    pollهای Telegram از `openclaw message poll` استفاده می‌کنند و از topicهای فوروم پشتیبانی می‌کنند:

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
    - `--thread-id` برای topicهای فوروم (یا از هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین پشتیبانی می‌کند از:

    - `--presentation` با بلوک‌های `buttons` برای صفحه‌کلیدهای درون‌خطی وقتی `channels.telegram.capabilities.inlineButtons` اجازه می‌دهد
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل سنجاق‌شده وقتی بات بتواند در آن گفت‌وگو سنجاق کند
    - `--force-document` برای ارسال تصاویر و GIFهای خروجی به‌عنوان سند به‌جای بارگذاری‌های عکس فشرده یا رسانه‌ی متحرک

    کنترل کنش:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها، را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ایجاد poll در Telegram را غیرفعال می‌کند و ارسال‌های عادی را فعال نگه می‌دارد

  </Accordion>

  <Accordion title="تأییدهای exec در Telegram">
    Telegram از تأییدهای exec در DMهای تأییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در گفت‌وگو یا topic مبدأ پست کند. تأییدکننده‌ها باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی حداقل یک تأییدکننده قابل تفکیک باشد خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی مالک از `commands.ownerAllowFrom` fallback می‌کند)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom`، و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با بات صحبت کند و پاسخ‌های عادی را کجا ارسال می‌کند. آن‌ها کسی را به تأییدکننده‌ی exec تبدیل نمی‌کنند. اولین جفت‌سازی DM تأییدشده وقتی هنوز مالک فرمانی وجود ندارد، `commands.ownerAllowFrom` را bootstrap می‌کند، بنابراین راه‌اندازی تک‌مالک همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانال متن فرمان را در گفت‌وگو نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/topicهای مورد اعتماد فعال کنید. وقتی prompt در یک topic فوروم قرار می‌گیرد، OpenClaw همان topic را برای prompt تأیید و پیگیری حفظ می‌کند. تأییدهای exec به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    دکمه‌های تأیید درون‌خطی نیز نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group`، یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدهای Plugin تفکیک می‌شوند؛ بقیه ابتدا از طریق تأییدهای exec تفکیک می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی عامل با خطای تحویل یا provider روبه‌رو می‌شود، Telegram می‌تواند یا با متن خطا پاسخ دهد یا آن را سرکوب کند. دو کلید پیکربندی این رفتار را کنترل می‌کنند:

| کلید                                | مقدارها          | پیش‌فرض | توضیح                                                                                           |
| ----------------------------------- | ---------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` یک پیام خطای دوستانه به گفت‌وگو ارسال می‌کند. `silent` پاسخ‌های خطا را کاملاً سرکوب می‌کند. |
| `channels.telegram.errorCooldownMs` | عدد (ms)         | `60000` | حداقل زمان بین پاسخ‌های خطا به همان گفت‌وگو. از هرزنامه‌ی خطا هنگام قطعی‌ها جلوگیری می‌کند.      |

بازنویسی‌های به‌ازای هر حساب، هر گروه، و هر topic پشتیبانی می‌شوند (همان وراثت کلیدهای دیگر پیکربندی Telegram).

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

    - اگر `requireMention=false` باشد، حالت حریم خصوصی Telegram باید دید کامل را مجاز کند.
      - BotFather: `/setprivacy` -> غیرفعال‌سازی
      - سپس ربات را از گروه حذف کنید و دوباره اضافه کنید
    - وقتی پیکربندی انتظار پیام‌های گروهی بدون منشن را دارد، `openclaw channels status` هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ wildcard `"*"` را نمی‌توان از نظر عضویت بررسی کرد.
    - آزمون سریع نشست: `/activation always`.

  </Accordion>

  <Accordion title="ربات اصلا پیام‌های گروه را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا شامل `"*"` باشد)
    - عضویت ربات در گروه را تأیید کنید
    - گزارش‌ها را بازبینی کنید: `openclaw logs --follow` برای دلایل رد شدن

  </Accordion>

  <Accordion title="فرمان‌ها به‌صورت ناقص کار می‌کنند یا اصلا کار نمی‌کنند">

    - هویت فرستنده خود را مجاز کنید (جفت‌سازی و/یا `allowFrom` عددی)
    - مجوزدهی فرمان حتی وقتی سیاست گروه `open` است همچنان اعمال می‌شود
    - `setMyCommands failed` با `BOT_COMMANDS_TOO_MUCH` یعنی منوی بومی ورودی‌های بیش از حدی دارد؛ فرمان‌های Plugin/skill/سفارشی را کاهش دهید یا منوهای بومی را غیرفعال کنید
    - فراخوانی‌های راه‌اندازی `deleteMyCommands` / `setMyCommands` و فراخوانی‌های تایپ `sendChatAction` محدود هستند و در صورت پایان مهلت درخواست، یک بار از طریق جایگزین انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار شبکه/واکشی معمولا نشان‌دهنده مشکلات دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="راه‌اندازی توکن غیرمجاز گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای توکن ربات پیکربندی‌شده است.
    - توکن ربات را در BotFather دوباره کپی یا بازتولید کنید، سپس برای حساب پیش‌فرض `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken` یا `TELEGRAM_BOT_TOKEN` را به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام راه‌اندازی نیز یک شکست احراز هویت است؛ تلقی آن به‌عنوان «هیچ webhook وجود ندارد» فقط همان شکست توکن نامعتبر را به فراخوانی‌های بعدی API موکول می‌کند.

  </Accordion>

  <Accordion title="ناپایداری polling یا شبکه">

    - Node 22+ + fetch/proxy سفارشی می‌تواند در صورت ناسازگاری نوع‌های AbortSignal، رفتار توقف فوری ایجاد کند.
    - برخی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 resolve می‌کنند؛ خروجی خراب IPv6 می‌تواند باعث شکست‌های متناوب API Telegram شود.
    - اگر گزارش‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این موارد را به‌عنوان خطاهای شبکه قابل بازیابی دوباره تلاش می‌کند.
    - هنگام راه‌اندازی polling، OpenClaw بررسی موفق راه‌اندازی `getMe` را برای grammY دوباره استفاده می‌کند تا اجراکننده پیش از اولین `getUpdates` به `getMe` دوم نیاز نداشته باشد.
    - اگر `deleteWebhook` هنگام راه‌اندازی polling با خطای شبکه گذرا شکست بخورد، OpenClaw به‌جای انجام یک فراخوانی control-plane دیگر پیش از polling، وارد long polling می‌شود. webhook همچنان فعال به‌صورت تعارض `getUpdates` ظاهر می‌شود؛ سپس OpenClaw انتقال Telegram را بازسازی می‌کند و پاک‌سازی webhook را دوباره تلاش می‌کند.
    - اگر سوکت‌های Telegram در یک چرخه ثابت کوتاه بازیافت می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ کلاینت‌های ربات مقادیر پیکربندی‌شده پایین‌تر از محافظ‌های درخواست خروجی و `getUpdates` را محدود می‌کنند، اما نسخه‌های قدیمی‌تر ممکن بود وقتی این مقدار پایین‌تر از آن محافظ‌ها تنظیم شده بود، هر poll یا پاسخ را متوقف کنند.
    - اگر گزارش‌ها شامل `Polling stall detected` باشند، OpenClaw به‌صورت پیش‌فرض پس از 120 ثانیه بدون liveness تکمیل‌شده long-poll، polling را دوباره راه‌اندازی می‌کند و انتقال Telegram را بازسازی می‌کند.
    - `openclaw channels status --probe` و `openclaw doctor` زمانی هشدار می‌دهند که یک حساب polling در حال اجرا پس از مهلت راه‌اندازی `getUpdates` را تکمیل نکرده باشد، یک حساب webhook در حال اجرا پس از مهلت راه‌اندازی `setWebhook` را تکمیل نکرده باشد، یا آخرین فعالیت موفق انتقال polling قدیمی شده باشد.
    - فقط زمانی `channels.telegram.pollingStallThresholdMs` را افزایش دهید که فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما میزبان شما همچنان راه‌اندازی‌های مجدد polling-stall کاذب گزارش می‌کند. توقف‌های پایدار معمولا به مشکلات proxy، DNS، IPv6 یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین env پروکسی فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و گونه‌های حروف کوچک آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌تواند `api.telegram.org` را دور بزند.
    - اگر پروکسی مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای یک محیط سرویس پیکربندی شده باشد و env پروکسی استانداردی وجود نداشته باشد، Telegram نیز از همان URL برای انتقال Bot API استفاده می‌کند.
    - در میزبان‌های VPS با خروجی مستقیم/TLS ناپایدار، فراخوانی‌های API Telegram را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌صورت پیش‌فرض `autoSelectFamily=true` دارد (به‌جز WSL2). ترتیب نتیجه DNS برای Telegram ابتدا `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، سپس `channels.telegram.network.dnsResultOrder`، سپس پیش‌فرض فرایند مانند `NODE_OPTIONS=--dns-result-order=ipv4first` را رعایت می‌کند؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` برمی‌گردد.
    - اگر میزبان شما WSL2 است یا صراحتا با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب خانواده را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های بازه benchmark در RFC 2544‏ (`198.18.0.0/15`) به‌صورت پیش‌فرض از قبل برای دانلودهای رسانه Telegram مجاز هستند. اگر یک fake-IP قابل اعتماد یا پروکسی شفاف هنگام دانلود رسانه، `api.telegram.org` را به آدرس خصوصی/داخلی/با کاربرد ویژه دیگری بازنویسی می‌کند، می‌توانید برای دورزدن فقط مخصوص Telegram opt in کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین opt-in برای هر حساب نیز در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر پروکسی شما میزبان‌های رسانه Telegram را به `198.18.x.x` resolve می‌کند، ابتدا پرچم خطرناک را خاموش بگذارید. رسانه Telegram از قبل به‌صورت پیش‌فرض بازه benchmark در RFC 2544 را مجاز می‌کند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانه Telegram را ضعیف می‌کند. فقط برای محیط‌های پروکسی قابل اعتماد و تحت کنترل اپراتور مانند مسیریابی fake-IP در Clash، Mihomo یا Surge از آن استفاده کنید، زمانی که پاسخ‌های خصوصی یا با کاربرد ویژه خارج از بازه benchmark در RFC 2544 تولید می‌کنند. برای دسترسی عادی Telegram از اینترنت عمومی آن را خاموش بگذارید.
    </Warning>

    - بازنویسی‌های محیطی (موقت):
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

<Accordion title="فیلدهای پربازده Telegram">

- راه‌اندازی/احراز هویت: `enabled`، `botToken`، `tokenFile`، `accounts.*` (`tokenFile` باید به یک فایل عادی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، `bindings[]` سطح بالا (`type: "acp"`)
- تأییدهای exec: `execApprovals`، `accounts.*.execApprovals`
- فرمان/منو: `commands.native`، `commands.nativeSkills`، `customCommands`
- threadها/پاسخ‌ها: `replyToMode`، `dm.threadReplies`، `direct.*.threadReplies`
- streaming: `streaming` (پیش‌نمایش)، `streaming.preview.toolProgress`، `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`، `chunkMode`، `linkPreview`، `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`، `mediaGroupFlushMs`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ `/bot<TOKEN>` را شامل نکنید)
- webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- کنش‌ها/قابلیت‌ها: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- واکنش‌ها: `reactionNotifications`، `reactionLevel`
- خطاها: `errorPolicy`، `errorCooldownMs`
- نوشتن‌ها/تاریخچه: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را شامل کنید) تا مسیریابی پیش‌فرض صریح شود. در غیر این صورت OpenClaw به اولین شناسه حساب نرمال‌سازی‌شده برمی‌گردد و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقدارهای `accounts.default.*` را نه.
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

---
read_when:
    - کار روی قابلیت‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-12T12:48:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 185ac6051d3da2037b2727a6afca98bef946bc62c3f2b22cc9afe9831669297b
    source_path: channels/telegram.md
    workflow: 16
---

برای تولید با پیام‌های مستقیم ربات و گروه‌ها از طریق grammY آماده است. حالت پیش‌فرض، polling طولانی است؛ حالت Webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای Telegram جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های بین‌کانالی و راهنماهای عملی تعمیر.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و نمونه‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="توکن ربات را در BotFather بسازید">
    Telegram را باز کنید و با **@BotFather** گفت‌وگو کنید (تأیید کنید که شناسه دقیقاً `@BotFather` است).

    `/newbot` را اجرا کنید، اعلان‌ها را دنبال کنید، و توکن را ذخیره کنید.

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
    Telegram از `openclaw channels login telegram` استفاده **نمی‌کند**؛ توکن را در پیکربندی/env تنظیم کنید، سپس Gateway را شروع کنید.

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
    ربات را به گروه خود اضافه کنید، سپس هر دو شناسه‌ای را که دسترسی گروه نیاز دارد بگیرید:

    - شناسه کاربر Telegram شما، که در `allowFrom` / `groupAllowFrom` استفاده می‌شود
    - شناسه گفت‌وگوی گروه Telegram، که به‌عنوان کلید زیر `channels.telegram.groups` استفاده می‌شود

    برای راه‌اندازی بار اول، شناسه گفت‌وگوی گروه را از `openclaw logs --follow`، یک ربات شناسهٔ فورواردشده، یا Bot API `getUpdates` بگیرید. پس از مجاز شدن گروه، `/whoami@<bot_username>` می‌تواند شناسه‌های کاربر و گروه را تأیید کند.

    شناسه‌های سوپرگروه منفی Telegram که با `-100` شروع می‌شوند، شناسه‌های گفت‌وگوی گروه هستند. آن‌ها را زیر `channels.telegram.groups` قرار دهید، نه زیر `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتیب رفع توکن از حساب آگاه است. در عمل، مقادیر پیکربندی بر جایگزین env مقدم‌اند، و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و دیده‌شدن گروه">
    ربات‌های Telegram به‌طور پیش‌فرض روی **Privacy Mode** هستند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر ربات باید همه پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را با `/setprivacy` غیرفعال کنید، یا
    - ربات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، ربات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت مدیر در تنظیمات گروه Telegram کنترل می‌شود.

    ربات‌های مدیر همه پیام‌های گروه را دریافت می‌کنند، که برای رفتار گروهی همیشه‌فعال مفید است.

  </Accordion>

  <Accordion title="گزینه‌های مفید BotFather">

    - `/setjoingroups` برای اجازه دادن/رد کردن افزودن به گروه
    - `/setprivacy` برای رفتار دیده‌شدن در گروه

  </Accordion>
</AccordionGroup>

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.telegram.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (به حداقل یک شناسه فرستنده در `allowFrom` نیاز دارد)
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` به هر حساب Telegram که نام کاربری ربات را پیدا یا حدس بزند اجازه می‌دهد به ربات فرمان بدهد. فقط برای ربات‌هایی استفاده کنید که عمداً عمومی هستند و ابزارهایشان به‌شدت محدود شده‌اند؛ ربات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربر Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در پیکربندی‌های چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های سطح حساب `allowFrom: ["*"]` آن حساب را عمومی نمی‌کنند، مگر اینکه allowlist مؤثر حساب پس از ادغام همچنان شامل یک wildcard صریح باشد.
    `dmPolicy: "allowlist"` با `allowFrom` خالی همه پیام‌های مستقیم را مسدود می‌کند و توسط اعتبارسنجی پیکربندی رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند.
    اگر ارتقا داده‌اید و پیکربندی شما شامل ورودی‌های allowlist از نوع `@username` است، `openclaw doctor --fix` را اجرا کنید تا آن‌ها را رفع کند (در حد بهترین تلاش؛ به توکن ربات Telegram نیاز دارد).
    اگر قبلاً به فایل‌های allowlist فروشگاه جفت‌سازی متکی بوده‌اید، `openclaw doctor --fix` می‌تواند در جریان‌های allowlist ورودی‌ها را به `channels.telegram.allowFrom` بازیابی کند (برای نمونه وقتی `dmPolicy: "allowlist"` هنوز شناسه‌های صریح ندارد).

    برای ربات‌های تک‌مالک، `dmPolicy: "allowlist"` را با شناسه‌های عددی صریح `allowFrom` ترجیح دهید تا سیاست دسترسی در پیکربندی پایدار بماند (به‌جای وابستگی به تأییدهای جفت‌سازی قبلی).

    ابهام رایج: تأیید جفت‌سازی پیام مستقیم به این معنا نیست که «این فرستنده همه‌جا مجاز است».
    جفت‌سازی دسترسی پیام مستقیم می‌دهد. اگر هنوز مالک فرمانی وجود نداشته باشد، نخستین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط‌مالک و تأییدهای اجرا یک حساب اپراتور صریح داشته باشند.
    مجوز فرستنده گروه همچنان از allowlistهای صریح پیکربندی می‌آید.
    اگر می‌خواهید «یک بار مجاز شوم و هم پیام‌های مستقیم و هم فرمان‌های گروه کار کنند»، شناسه عددی کاربر Telegram خود را در `channels.telegram.allowFrom` قرار دهید؛ برای فرمان‌های فقط‌مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### پیدا کردن شناسه کاربر Telegram خود

    امن‌تر (بدون ربات شخص ثالث):

    1. به ربات خود پیام مستقیم بدهید.
    2. `openclaw logs --follow` را اجرا کنید.
    3. `from.id` را بخوانید.

    روش رسمی Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    روش شخص ثالث (خصوصی‌تر نیست): `@userinfobot` یا `@getidsbot`.

  </Tab>

  <Tab title="سیاست گروه و allowlistها">
    دو کنترل با هم اعمال می‌شوند:

    1. **کدام گروه‌ها مجاز هستند** (`channels.telegram.groups`)
       - بدون پیکربندی `groups`:
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسه گروه را پشت سر بگذارد
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها تا زمانی که ورودی‌های `groups` (یا `"*"`) را اضافه کنید مسدود می‌شوند
       - `groups` پیکربندی شده: مانند allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستنده گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` برمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربر Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های گفت‌وگوی گروه یا سوپرگروه Telegram را در `groupAllowFrom` قرار ندهید. شناسه‌های گفت‌وگوی منفی زیر `channels.telegram.groups` قرار می‌گیرند.
    ورودی‌های غیرعددی برای مجوز فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز مجوز فرستنده گروه، تأییدهای فروشگاه جفت‌سازی پیام مستقیم را به ارث **نمی‌برد**.
    جفت‌سازی فقط برای پیام مستقیم می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` در سطح گروه/موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به `allowFrom` پیکربندی برمی‌گردد، نه فروشگاه جفت‌سازی.
    الگوی عملی برای ربات‌های تک‌مالک: شناسه کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکته زمان اجرا: اگر `channels.telegram` کاملاً وجود نداشته باشد، زمان اجرا به‌طور پیش‌فرض به `groupPolicy="allowlist"` بسته‌به‌خطا برمی‌گردد، مگر اینکه `channels.defaults.groupPolicy` صریحاً تنظیم شده باشد.

    راه‌اندازی گروه فقط‌مالک:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    آن را از داخل گروه با `@<bot_username> ping` آزمایش کنید. پیام‌های ساده گروهی تا وقتی `requireMention: true` است ربات را فعال نمی‌کنند.

    نمونه: اجازه دادن به هر عضو در یک گروه مشخص:

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

    نمونه: اجازه دادن فقط به کاربران مشخص در یک گروه مشخص:

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

      - شناسه‌های گفت‌وگوی گروه یا سوپرگروه منفی Telegram مانند `-1001234567890` را زیر `channels.telegram.groups` قرار دهید.
      - وقتی می‌خواهید محدود کنید کدام افراد داخل یک گروه مجاز می‌توانند ربات را فعال کنند، شناسه‌های کاربر Telegram مانند `8734062810` را زیر `groupAllowFrom` قرار دهید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با ربات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="رفتار منشن">
    پاسخ‌های گروه به‌طور پیش‌فرض به منشن نیاز دارند.

    منشن می‌تواند از این‌ها بیاید:

    - منشن بومی `@botusername`، یا
    - الگوهای منشن در:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    تغییرهای فرمان در سطح نشست:

    - `/activation always`
    - `/activation mention`

    این‌ها فقط وضعیت نشست را به‌روزرسانی می‌کنند. برای ماندگاری از پیکربندی استفاده کنید.

    نمونه پیکربندی ماندگار:

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

    گرفتن شناسه گفت‌وگوی گروه:

    - یک پیام گروه را به `@userinfobot` / `@getidsbot` فوروارد کنید
    - یا `chat.id` را از `openclaw logs --follow` بخوانید
    - یا Bot API `getUpdates` را بررسی کنید
    - پس از مجاز شدن گروه، اگر فرمان‌های بومی فعال هستند، `/whoami@<bot_username>` را اجرا کنید

  </Tab>
</Tabs>

## رفتار زمان اجرا

- Telegram در مالکیت فرایند Gateway است.
- مسیریابی قطعی است: ورودی Telegram به Telegram پاسخ داده می‌شود (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به پوشش مشترک کانال با فراداده پاسخ، placeholderهای رسانه، و زمینه زنجیره پاسخِ ماندگار برای پاسخ‌های Telegram که Gateway مشاهده کرده است نرمال‌سازی می‌شوند.
- نشست‌های گروه بر اساس شناسه گروه ایزوله می‌شوند. موضوعات انجمن `:topic:<threadId>` را اضافه می‌کنند تا موضوع‌ها ایزوله بمانند.
- پیام‌های مستقیم می‌توانند `message_thread_id` داشته باشند؛ OpenClaw شناسه thread را برای پاسخ‌ها حفظ می‌کند اما پیام‌های مستقیم را به‌طور پیش‌فرض روی نشست تخت نگه می‌دارد. وقتی عمداً ایزوله‌سازی نشست موضوع پیام مستقیم می‌خواهید، `channels.telegram.dm.threadReplies: "inbound"`، `channels.telegram.direct.<chatId>.threadReplies: "inbound"`، `requireTopic: true`، یا یک پیکربندی موضوع منطبق را تنظیم کنید.
- polling طولانی از اجراکننده grammY با ترتیب‌دهی برای هر گفت‌وگو/هر thread استفاده می‌کند. هم‌روندی کلی sink اجراکننده از `agents.defaults.maxConcurrent` استفاده می‌کند.
- polling طولانی داخل هر فرایند Gateway محافظت می‌شود تا در هر زمان فقط یک poller فعال بتواند از یک توکن ربات استفاده کند. اگر همچنان تعارض‌های `getUpdates` 409 می‌بینید، احتمالاً یک Gateway، اسکریپت، یا poller خارجی دیگر OpenClaw از همان توکن استفاده می‌کند.
- راه‌اندازی‌های دوباره watchdog برای polling طولانی، به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون کامل شدن liveness مربوط به `getUpdates` فعال می‌شوند. فقط اگر استقرار شما همچنان هنگام کارهای طولانی‌مدت راه‌اندازی‌های دوباره polling-stall کاذب می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ بازنویسی‌های سطح حساب پشتیبانی می‌شوند.
- Bot API Telegram از رسید خوانده‌شدن پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="پیش‌نمایش پخش زنده (ویرایش پیام‌ها)">
    OpenClaw می‌تواند پاسخ‌های جزئی را در زمان واقعی پخش کند:

    - گفت‌وگوهای مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/موضوعات: پیام پیش‌نمایش + `editMessageText`

    نیازمندی:

    - `channels.telegram.streaming` مقدار `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - `progress` یک پیش‌نویس وضعیت قابل‌ویرایش را برای پیشرفت ابزار نگه می‌دارد، در پایان آن را پاک می‌کند، و پاسخ نهایی را به‌صورت یک پیام عادی می‌فرستد
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده دوباره استفاده کنند یا نه (پیش‌فرض: وقتی جریان پیش‌نمایش فعال است `true`)
    - `streaming.preview.commandText` جزئیات دستور/اجرا را داخل همان خطوط پیشرفت ابزار کنترل می‌کند: `raw` (پیش‌فرض، رفتار منتشرشده را حفظ می‌کند) یا `status` (فقط برچسب ابزار)
    - مقدارهای قدیمی `channels.telegram.streamMode` و مقدارهای بولی `streaming` شناسایی می‌شوند؛ برای مهاجرت آن‌ها به `channels.telegram.streaming.mode` دستور `openclaw doctor --fix` را اجرا کنید

    به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار همان خطوط وضعیت کوتاهی هستند که هنگام اجرای ابزارها نشان داده می‌شوند، برای مثال اجرای دستور، خواندن فایل‌ها، به‌روزرسانی‌های برنامه‌ریزی، یا خلاصه‌های وصله. Telegram این موارد را به‌صورت پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشده OpenClaw از `v2026.4.22` و نسخه‌های بعدی هم‌خوان بماند. برای نگه داشتن پیش‌نمایش ویرایش‌شده برای متن پاسخ اما پنهان کردن خطوط پیشرفت ابزار، تنظیم کنید:

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

    برای اینکه پیشرفت ابزار قابل مشاهده بماند اما متن دستور/اجرا پنهان شود، تنظیم کنید:

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

    وقتی می‌خواهید پیشرفت ابزار قابل مشاهده باشد بدون اینکه پاسخ نهایی در همان پیام ویرایش شود، از حالت `progress` استفاده کنید. سیاست متن دستور را زیر `streaming.progress` قرار دهید:

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

    فقط وقتی از `streaming.mode: "off"` استفاده کنید که تحویل فقط-نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و گفت‌وگوی عمومی ابزار/پیشرفت به‌جای ارسال به‌صورت پیام‌های وضعیت مستقل، سرکوب می‌شود. درخواست‌های تأیید، محموله‌های رسانه‌ای، و خطاها همچنان از مسیر تحویل نهایی عادی عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و خطوط وضعیت پیشرفت ابزار را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    <Note>
      پاسخ‌های نقل‌قول انتخاب‌شده Telegram استثنا هستند. وقتی `replyToMode` برابر `"first"`، `"all"`، یا `"batched"` باشد و پیام ورودی شامل متن نقل‌قول انتخاب‌شده باشد، OpenClaw پاسخ نهایی را به‌جای ویرایش پیش‌نمایش پاسخ، از مسیر بومی پاسخ به نقل‌قول Telegram می‌فرستد، بنابراین `streaming.preview.toolProgress` نمی‌تواند خطوط وضعیت کوتاه را برای آن نوبت نشان دهد. پاسخ‌های پیام فعلی بدون متن نقل‌قول انتخاب‌شده همچنان جریان پیش‌نمایش را نگه می‌دارند. وقتی دیده شدن پیشرفت ابزار از پاسخ‌های نقل‌قول بومی مهم‌تر است، `replyToMode: "off"` را تنظیم کنید، یا برای پذیرفتن این بده‌بستان `streaming.preview.toolProgress: false` را تنظیم کنید.
    </Note>

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و ویرایش نهایی را درجا انجام می‌دهد
    - خروجی‌های نهایی متنی طولانی که به چند پیام Telegram تقسیم می‌شوند، در صورت امکان از پیش‌نمایش موجود به‌عنوان نخستین قطعه نهایی دوباره استفاده می‌کنند و سپس فقط قطعه‌های باقی‌مانده را می‌فرستند
    - خروجی‌های نهایی در حالت progress پیش‌نویس وضعیت را پاک می‌کنند و به‌جای ویرایش پیش‌نویس به پاسخ، از تحویل نهایی عادی استفاده می‌کنند
    - اگر ویرایش نهایی پیش از تأیید متن کامل‌شده شکست بخورد، OpenClaw از تحویل نهایی عادی استفاده می‌کند و پیش‌نمایش کهنه را پاک‌سازی می‌کند

    برای پاسخ‌های پیچیده (برای مثال محموله‌های رسانه‌ای)، OpenClaw به تحویل نهایی عادی بازمی‌گردد و سپس پیام پیش‌نمایش را پاک‌سازی می‌کند.

    جریان پیش‌نمایش از جریان بلوکی جداست. وقتی جریان بلوکی به‌صورت صریح برای Telegram فعال شده باشد، OpenClaw برای جلوگیری از جریان‌دهی دوبل، جریان پیش‌نمایش را رد می‌کند.

    جریان استدلال فقط Telegram:

    - `/reasoning stream` هنگام تولید، استدلال را به پیش‌نمایش زنده می‌فرستد
    - پیش‌نمایش استدلال پس از تحویل نهایی حذف می‌شود؛ وقتی استدلال باید قابل مشاهده بماند از `/reasoning on` استفاده کنید
    - پاسخ نهایی بدون متن استدلال فرستاده می‌شود

  </Accordion>

  <Accordion title="قالب‌بندی و جایگزین HTML">
    متن خروجی از `parse_mode: "HTML"` در Telegram استفاده می‌کند.

    - متن شبیه Markdown به HTML ایمن برای Telegram رندر می‌شود.
    - تگ‌های HTML پشتیبانی‌شده Telegram حفظ می‌شوند؛ HTML پشتیبانی‌نشده escape می‌شود.
    - اگر Telegram HTML تجزیه‌شده را رد کند، OpenClaw دوباره به‌صورت متن ساده تلاش می‌کند.

    پیش‌نمایش لینک‌ها به‌صورت پیش‌فرض فعال است و می‌توان آن را با `channels.telegram.linkPreview: false` غیرفعال کرد.

  </Accordion>

  <Accordion title="دستورهای بومی و دستورهای سفارشی">
    ثبت منوی دستور Telegram هنگام راه‌اندازی با `setMyCommands` انجام می‌شود.

    پیش‌فرض‌های دستور بومی:

    - `commands.native: "auto"` دستورهای بومی را برای Telegram فعال می‌کند

    ورودی‌های سفارشی منوی دستور را اضافه کنید:

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

    - نام‌ها عادی‌سازی می‌شوند (حذف `/` ابتدایی، حروف کوچک)
    - الگوی معتبر: `a-z`، `0-9`، `_`، طول `1..32`
    - دستورهای سفارشی نمی‌توانند دستورهای بومی را بازنویسی کنند
    - تداخل‌ها/تکراری‌ها رد می‌شوند و در لاگ ثبت می‌شوند

    نکته‌ها:

    - دستورهای سفارشی فقط ورودی‌های منو هستند؛ رفتار را به‌صورت خودکار پیاده‌سازی نمی‌کنند
    - دستورهای plugin/skill همچنان می‌توانند هنگام تایپ کار کنند حتی اگر در منوی Telegram نشان داده نشوند

    اگر دستورهای بومی غیرفعال باشند، موارد داخلی حذف می‌شوند. دستورهای سفارشی/plugin ممکن است در صورت پیکربندی همچنان ثبت شوند.

    خرابی‌های رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از برش هم همچنان سرریز شده است؛ تعداد دستورهای plugin/skill/سفارشی را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` با `404: Not Found` در حالی که دستورهای مستقیم curl مربوط به Bot API کار می‌کنند، می‌تواند به این معنی باشد که `channels.telegram.apiRoot` روی نقطه پایانی کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن ربات پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان خرابی پاک‌سازی Webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای شبکه/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود شده است.

    ### دستورهای جفت‌سازی دستگاه (Plugin `device-pair`)

    وقتی Plugin `device-pair` نصب است:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در برنامه iOS جای‌گذاری کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (شامل نقش/دامنه‌ها)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر حمل می‌کند. تحویل bootstrap داخلی توکن گره اصلی را در `scopes: []` نگه می‌دارد؛ هر توکن اپراتور تحویل‌داده‌شده به `operator.approvals`، `operator.read`، `operator.talk.secrets`، و `operator.write` محدود می‌ماند. بررسی‌های دامنه bootstrap با پیشوند نقش انجام می‌شوند، بنابراین آن allowlist اپراتور فقط درخواست‌های اپراتور را برآورده می‌کند؛ نقش‌های غیر اپراتور همچنان به دامنه‌هایی زیر پیشوند نقش خودشان نیاز دارند.

    اگر یک دستگاه با جزئیات احراز هویت تغییرکرده دوباره تلاش کند (برای مثال نقش/دامنه‌ها/کلید عمومی)، درخواست در انتظار قبلی جایگزین می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید، دوباره `/pair pending` را اجرا کنید.

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
    کنش‌های ابزار Telegram شامل موارد زیر است:

    - `sendMessage` (`to`، `content`، `mediaUrl` اختیاری، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، `iconColor` اختیاری، `iconCustomEmojiId`)

    کنش‌های پیام کانال نام‌های مستعار آسان‌کاربرد را ارائه می‌کنند (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    کنترل‌های دروازه‌گذاری:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌صورت پیش‌فرض فعال هستند و toggleهای جداگانه `channels.telegram.actions.*` ندارند.
    ارسال‌های زمان اجرا از snapshot پیکربندی/رازهای فعال (راه‌اندازی/بارگذاری مجدد) استفاده می‌کنند، بنابراین مسیرهای کنش در هر ارسال SecretRef را به‌صورت موقت دوباره resolve نمی‌کنند.

    معناشناسی حذف واکنش: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="برچسب‌های رشته‌بندی پاسخ">
    Telegram از برچسب‌های صریح رشته‌بندی پاسخ در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام محرک پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسه پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` کنترل‌کننده مدیریت است:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی رشته‌بندی پاسخ فعال باشد و متن یا caption اصلی Telegram در دسترس باشد، OpenClaw به‌صورت خودکار یک گزیده نقل‌قول بومی Telegram را وارد می‌کند. Telegram متن نقل‌قول بومی را به 1024 واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل می‌شوند و اگر Telegram نقل‌قول را رد کند به پاسخ ساده بازمی‌گردند.

    نکته: `off` رشته‌بندی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="موضوع‌های انجمن و رفتار رشته">
    ابرگروه‌های انجمن:

    - کلیدهای نشست موضوع `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و typing موضوع رشته را هدف می‌گیرند
    - مسیر پیکربندی موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    مورد ویژه موضوع عمومی (`threadId=1`):

    - ارسال‌های پیام `message_thread_id` را حذف می‌کنند (Telegram دستور `sendMessage(...thread_id=1)` را رد می‌کند)
    - کنش‌های typing همچنان `message_thread_id` را شامل می‌شوند

    وراثت موضوع: ورودی‌های موضوع تنظیمات گروه را به ارث می‌برند مگر اینکه بازنویسی شوند (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` فقط مخصوص موضوع است و از پیش‌فرض‌های گروه به ارث نمی‌رسد.

    **مسیردهی عامل برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در پیکربندی موضوع، به عامل متفاوتی مسیردهی شود. این کار به هر موضوع workspace، حافظه، و نشست جداگانه خودش را می‌دهد. نمونه:

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

    **اتصال پایدار موضوع ACP**: موضوعات انجمن می‌توانند نشست‌های ACP harness را از طریق اتصال‌های ACP نوع‌دار سطح بالا پین کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، و `peer.kind: "group"`، و یک شناسهٔ دارای موضوع مانند `-1001234567890:topic:42`). در حال حاضر به موضوعات انجمن در گروه‌ها/ابرگروه‌ها محدود است. [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

    **ایجاد ACP وابسته به رشته از چت**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک نشست ACP جدید متصل می‌کند؛ پیام‌های بعدی مستقیماً به آنجا هدایت می‌شوند. OpenClaw تأیید ایجاد را در همان موضوع پین می‌کند. نیاز دارد `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    زمینهٔ قالب `MessageThreadId` و `IsForum` را ارائه می‌کند. چت‌های DM با `message_thread_id` به‌طور پیش‌فرض مسیریابی DM و فرادادهٔ پاسخ را روی نشست‌های تخت نگه می‌دارند؛ آن‌ها فقط وقتی با `threadReplies: "inbound"`، `threadReplies: "always"`، `requireTopic: true`، یا یک پیکربندی موضوع منطبق تنظیم شده باشند، از کلیدهای نشست آگاه از رشته استفاده می‌کنند. برای پیش‌فرض حساب از `channels.telegram.dm.threadReplies` در سطح بالا استفاده کنید، یا برای یک DM از `direct.<chatId>.threadReplies`.

  </Accordion>

  <Accordion title="صوت، ویدئو، و استیکرها">
    ### پیام‌های صوتی

    Telegram یادداشت‌های صوتی را از فایل‌های صوتی متمایز می‌کند.

    - پیش‌فرض: رفتار فایل صوتی
    - برچسب `[[audio_as_voice]]` در پاسخ عامل برای اجبار به ارسال یادداشت صوتی
    - رونوشت‌های یادداشت صوتی ورودی در زمینهٔ عامل به‌صورت متن تولیدشده توسط ماشین و نامطمئن قالب‌بندی می‌شوند؛ تشخیص اشاره همچنان از رونوشت خام استفاده می‌کند تا پیام‌های صوتی وابسته به اشاره همچنان کار کنند.

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

    ### پیام‌های ویدئویی

    Telegram فایل‌های ویدئویی را از یادداشت‌های ویدئویی متمایز می‌کند.

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

    یادداشت‌های ویدئویی از کپشن پشتیبانی نمی‌کنند؛ متن پیام ارائه‌شده جداگانه ارسال می‌شود.

    ### استیکرها

    مدیریت استیکر ورودی:

    - WEBP ایستا: دانلود و پردازش می‌شود (جای‌نگهدار `<media:sticker>`)
    - TGS متحرک: نادیده گرفته می‌شود
    - WEBM ویدئویی: نادیده گرفته می‌شود

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
    واکنش‌های Telegram به‌صورت به‌روزرسانی‌های `message_reaction` می‌رسند (جدا از محتوای پیام).

    وقتی فعال باشد، OpenClaw رویدادهای سیستمی مانند این را در صف می‌گذارد:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکات:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط ربات (بهترین تلاش از طریق کش پیام‌های ارسال‌شده).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ فرستنده‌های غیرمجاز حذف می‌شوند.
    - Telegram در به‌روزرسانی‌های واکنش شناسهٔ رشته ارائه نمی‌کند.
      - گروه‌های غیرانجمنی به نشست چت گروه هدایت می‌شوند
      - گروه‌های انجمنی به نشست موضوع عمومی گروه (`:topic:1`) هدایت می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌طور خودکار شامل `message_reaction` می‌شود.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` در زمانی که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید ارسال می‌کند.

    ترتیب حل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکات:

    - Telegram انتظار ایموجی یونیکد دارد (برای مثال "👀").
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی کانال به‌طور پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های تحریک‌شده توسط Telegram شامل این موارد هستند:

    - رویدادهای مهاجرت گروه (`migrate_to_chat_id`) برای به‌روزرسانی `channels.telegram.groups`
    - `/config set` و `/config unset` (نیازمند فعال بودن فرمان)

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

    در حالت long-polling، OpenClaw نشانگر راه‌اندازی مجدد خود را فقط پس از ارسال موفقیت‌آمیز یک به‌روزرسانی پایدار می‌کند. اگر یک handler شکست بخورد، آن به‌روزرسانی در همان فرایند قابل تلاش مجدد می‌ماند و برای حذف تکرار پس از راه‌اندازی مجدد، کامل‌شده نوشته نمی‌شود.

    شنوندهٔ محلی به `127.0.0.1:8787` متصل می‌شود. برای ورودی عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا آگاهانه `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook محافظ‌های درخواست، توکن مخفی Telegram، و بدنهٔ JSON را پیش از بازگرداندن `200` به Telegram اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان مسیرهای ربات برای هر چت/هر موضوع که long polling استفاده می‌کند پردازش می‌کند، بنابراین نوبت‌های کند عامل، ACK تحویل Telegram را نگه نمی‌دارند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش مجدد، و اهداف CLI">
    - پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خطوط خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازهٔ رسانهٔ ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.mediaGroupFlushMs` (پیش‌فرض 500) کنترل می‌کند آلبوم‌ها/گروه‌های رسانه‌ای Telegram چه مدت buffer شوند پیش از آنکه OpenClaw آن‌ها را به‌عنوان یک پیام ورودی ارسال کند. اگر بخش‌های آلبوم دیر می‌رسند، آن را افزایش دهید؛ برای کاهش تأخیر پاسخ آلبوم، آن را کاهش دهید.
    - `channels.telegram.timeoutSeconds` مهلت زمانی سرویس‌گیرندهٔ API Telegram را بازنویسی می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود). سرویس‌گیرنده‌های ربات مقادیر پیکربندی‌شدهٔ کمتر از محافظ درخواست ۶۰ ثانیه‌ای متن/typing خروجی را محدود می‌کنند تا grammY تحویل پاسخ قابل‌مشاهده را پیش از اجرای محافظ انتقال و fallback OpenClaw قطع نکند. Long polling همچنان از محافظ درخواست ۴۵ ثانیه‌ای `getUpdates` استفاده می‌کند تا pollهای بیکار به‌طور نامحدود رها نشوند.
    - `channels.telegram.pollingStallThresholdMs` به‌طور پیش‌فرض `120000` است؛ فقط برای راه‌اندازی‌های مجدد polling-stall با مثبت کاذب، آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچهٔ زمینهٔ گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` استفاده می‌کند (پیش‌فرض 50)؛ `0` غیرفعالش می‌کند.
    - زمینهٔ تکمیلی پاسخ/نقل‌قول/forward وقتی gateway پیام‌های والد را مشاهده کرده باشد، در یک پنجرهٔ زمینهٔ گفت‌وگوی انتخاب‌شده نرمال‌سازی می‌شود؛ کش پیام مشاهده‌شده کنار محل ذخیرهٔ نشست پایدار می‌شود. Telegram فقط یک `reply_to_message` کم‌عمق را در به‌روزرسانی‌ها شامل می‌کند، بنابراین زنجیره‌های قدیمی‌تر از کش به payload به‌روزرسانی فعلی Telegram محدود می‌شوند.
    - فهرست‌های مجاز Telegram عمدتاً کنترل می‌کنند چه کسی می‌تواند عامل را تحریک کند، نه یک مرز کامل ویرایش زمینهٔ تکمیلی.
    - کنترل‌های تاریخچهٔ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای API خروجی قابل بازیابی، روی helperهای ارسال Telegram (CLI/ابزارها/کنش‌ها) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای شکست‌های پیش‌اتصال Telegram از تلاش مجدد safe-send محدود استفاده می‌کند، اما envelopeهای شبکهٔ مبهم پس از ارسال را که می‌توانند پیام‌های قابل‌مشاهده را تکراری کنند، دوباره تلاش نمی‌کند.

    اهداف ارسال CLI و ابزار پیام می‌توانند شناسهٔ عددی چت، نام کاربری، یا هدف موضوع انجمن باشند:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
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
    - `--thread-id` برای موضوعات انجمن (یا از هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین از این موارد پشتیبانی می‌کند:

    - `--presentation` با بلوک‌های `buttons` برای صفحه‌کلیدهای درون‌خطی وقتی `channels.telegram.capabilities.inlineButtons` اجازه دهد
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل پین‌شده وقتی ربات بتواند در آن چت پین کند
    - `--force-document` برای ارسال تصاویر، GIFها، و ویدئوهای خروجی به‌عنوان سند به‌جای بارگذاری‌های عکس فشرده، رسانهٔ متحرک، یا ویدئو

    محدودسازی کنش:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها، را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ایجاد poll در Telegram را غیرفعال می‌کند، در حالی که ارسال‌های عادی فعال می‌مانند

  </Accordion>

  <Accordion title="تأییدهای exec در Telegram">
    Telegram از تأییدهای exec در DMهای تأییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در چت یا موضوع مبدأ ارسال کند. تأییدکنندگان باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی دست‌کم یک تأییدکننده قابل حل باشد، به‌طور خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی مالک از `commands.ownerAllowFrom` fallback می‌کند)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom`، و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با ربات صحبت کند و ربات پاسخ‌های عادی را کجا می‌فرستد. آن‌ها کسی را به تأییدکنندهٔ exec تبدیل نمی‌کنند. نخستین جفت‌سازی DM تأییدشده وقتی هنوز مالک فرمانی وجود ندارد، `commands.ownerAllowFrom` را راه‌اندازی اولیه می‌کند، بنابراین راه‌اندازی تک‌مالک همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانال متن فرمان را در چت نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/موضوعات مورد اعتماد فعال کنید. وقتی prompt در یک موضوع انجمن قرار می‌گیرد، OpenClaw موضوع را برای prompt تأیید و پیگیری حفظ می‌کند. تأییدهای exec به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    دکمه‌های تأیید درون‌خطی نیز نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group`، یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدهای plugin حل می‌شوند؛ سایر موارد ابتدا از طریق تأییدهای exec حل می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی عامل با خطای تحویل یا ارائه‌دهنده روبه‌رو می‌شود، Telegram می‌تواند با متن خطا پاسخ دهد یا آن را سرکوب کند. دو کلید پیکربندی این رفتار را کنترل می‌کنند:

| کلید                                | مقادیر           | پیش‌فرض | توضیح                                                                                           |
| ----------------------------------- | ---------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` یک پیام خطای دوستانه به گفتگو می‌فرستد. `silent` پاسخ‌های خطا را کاملاً سرکوب می‌کند. |
| `channels.telegram.errorCooldownMs` | number (ms)      | `60000` | حداقل زمان بین پاسخ‌های خطا به همان گفتگو. از هرزنگاری خطا هنگام قطعی‌ها جلوگیری می‌کند.       |

بازنویسی‌های مختص هر حساب، هر گروه و هر موضوع پشتیبانی می‌شوند (با همان ارث‌بری کلیدهای پیکربندی دیگر Telegram).

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
  <Accordion title="ربات به پیام‌های گروهی بدون mention پاسخ نمی‌دهد">

    - اگر `requireMention=false` باشد، حالت حریم خصوصی Telegram باید دید کامل را مجاز کند.
      - BotFather: `/setprivacy` -> Disable
      - سپس ربات را از گروه حذف کنید و دوباره اضافه کنید
    - `openclaw channels status` وقتی پیکربندی انتظار پیام‌های گروهی بدون اشاره را دارد هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ wildcard `"*"` را نمی‌توان از نظر عضویت کاوش کرد.
    - آزمون سریع نشست: `/activation always`.

  </Accordion>

  <Accordion title="ربات اصلاً پیام‌های گروه را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا شامل `"*"` باشد)
    - عضویت ربات در گروه را تأیید کنید
    - لاگ‌ها را بازبینی کنید: `openclaw logs --follow` برای دلایل رد شدن

  </Accordion>

  <Accordion title="فرمان‌ها ناقص کار می‌کنند یا اصلاً کار نمی‌کنند">

    - هویت فرستنده خود را مجاز کنید (pairing و/یا `allowFrom` عددی)
    - مجوزدهی فرمان حتی وقتی سیاست گروه `open` است همچنان اعمال می‌شود
    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی بومی ورودی‌های بیش از حد دارد؛ فرمان‌های Plugin/skill/سفارشی را کاهش دهید یا منوهای بومی را غیرفعال کنید
    - فراخوانی‌های راه‌اندازی `deleteMyCommands` / `setMyCommands` و فراخوانی‌های تایپ `sendChatAction` محدود هستند و در زمان timeout درخواست، یک‌بار از طریق fallback انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار شبکه/fetch معمولاً نشان‌دهنده مشکلات دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="راه‌اندازی توکن غیرمجاز گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای توکن ربات پیکربندی‌شده است.
    - توکن ربات را در BotFather دوباره کپی یا بازتولید کنید، سپس برای حساب پیش‌فرض `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken` یا `TELEGRAM_BOT_TOKEN` را به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام راه‌اندازی نیز شکست احراز هویت است؛ برخورد با آن به‌عنوان «هیچ webhook وجود ندارد» فقط همان شکست توکن نامعتبر را به فراخوانی‌های بعدی API موکول می‌کند.

  </Accordion>

  <Accordion title="ناپایداری polling یا شبکه">

    - Node 22+ همراه با fetch/proxy سفارشی می‌تواند در صورت ناسازگاری نوع‌های AbortSignal، رفتار abort فوری ایجاد کند.
    - برخی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 resolve می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث شکست‌های متناوب API Telegram شود.
    - اگر لاگ‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این‌ها را به‌عنوان خطاهای شبکه قابل بازیابی دوباره تلاش می‌کند.
    - هنگام راه‌اندازی polling، OpenClaw کاوش موفق راه‌اندازی `getMe` را برای grammY دوباره استفاده می‌کند تا runner پیش از نخستین `getUpdates` به `getMe` دوم نیاز نداشته باشد.
    - اگر `deleteWebhook` هنگام راه‌اندازی polling با خطای موقت شبکه شکست بخورد، OpenClaw به‌جای انجام یک فراخوانی کنترلی دیگر پیش از poll، وارد long polling می‌شود. یک webhook همچنان فعال به‌صورت تعارض `getUpdates` ظاهر می‌شود؛ سپس OpenClaw انتقال Telegram را بازسازی می‌کند و پاک‌سازی webhook را دوباره تلاش می‌کند.
    - اگر سوکت‌های Telegram روی یک cadence ثابت کوتاه بازیافت می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ کلاینت‌های ربات مقادیر پیکربندی‌شده کمتر از نگهبان‌های درخواست outbound و `getUpdates` را clamp می‌کنند، اما نسخه‌های قدیمی‌تر می‌توانستند وقتی این مقدار کمتر از آن نگهبان‌ها تنظیم شده بود هر poll یا پاسخ را abort کنند.
    - اگر لاگ‌ها شامل `Polling stall detected` باشند، OpenClaw پس از ۱۲۰ ثانیه بدون liveness تکمیل‌شده long-poll، به‌صورت پیش‌فرض polling را راه‌اندازی مجدد می‌کند و انتقال Telegram را بازسازی می‌کند.
    - `openclaw channels status --probe` و `openclaw doctor` وقتی یک حساب polling در حال اجرا پس از مهلت راه‌اندازی `getUpdates` را کامل نکرده باشد، وقتی یک حساب webhook در حال اجرا پس از مهلت راه‌اندازی `setWebhook` را کامل نکرده باشد، یا وقتی آخرین فعالیت موفق انتقال polling کهنه شده باشد هشدار می‌دهند.
    - `channels.telegram.pollingStallThresholdMs` را فقط زمانی افزایش دهید که فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما میزبان شما هنوز راه‌اندازی‌های مجدد polling-stall کاذب گزارش می‌کند. توقف‌های پایدار معمولاً به مشکلات خروجی proxy، DNS، IPv6 یا TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین env پراکسی فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و گونه‌های حروف کوچک آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌تواند `api.telegram.org` را دور بزند.
    - اگر پراکسی مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای یک محیط سرویس پیکربندی شده باشد و هیچ env پراکسی استانداردی حاضر نباشد، Telegram از همان URL برای انتقال Bot API نیز استفاده می‌کند.
    - روی میزبان‌های VPS با خروجی مستقیم/TLS ناپایدار، فراخوانی‌های API Telegram را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌صورت پیش‌فرض `autoSelectFamily=true` است (به‌جز WSL2). ترتیب نتیجه DNS Telegram ابتدا `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، سپس `channels.telegram.network.dnsResultOrder`، سپس پیش‌فرض فرایند مثل `NODE_OPTIONS=--dns-result-order=ipv4first` را رعایت می‌کند؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` برمی‌گردد.
    - اگر میزبان شما WSL2 است یا به‌صراحت با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب family را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های محدوده benchmark ‏RFC 2544 (`198.18.0.0/15`) از قبل
      برای دانلودهای رسانه Telegram به‌صورت پیش‌فرض مجاز هستند. اگر یک fake-IP مورد اعتماد یا
      پراکسی شفاف هنگام دانلود رسانه `api.telegram.org` را به یک نشانی
      خصوصی/داخلی/کاربرد ویژه دیگر بازنویسی کند، می‌توانید برای bypass فقط مخصوص Telegram
      opt in کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین opt-in برای هر حساب در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر پراکسی شما میزبان‌های رسانه Telegram را به `198.18.x.x` resolve می‌کند، ابتدا
      flag خطرناک را خاموش بگذارید. رسانه Telegram به‌صورت پیش‌فرض از قبل محدوده
      benchmark ‏RFC 2544 را مجاز می‌داند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانه Telegram
      را تضعیف می‌کند. فقط برای محیط‌های پراکسی مورد اعتماد و کنترل‌شده توسط اپراتور
      مثل مسیریابی fake-IP در Clash، Mihomo یا Surge از آن استفاده کنید، وقتی که آن‌ها
      پاسخ‌های خصوصی یا کاربرد ویژه خارج از محدوده benchmark ‏RFC 2544
      می‌سازند. برای دسترسی عادی Telegram از اینترنت عمومی آن را خاموش بگذارید.
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

راهنمای بیشتر: [عیب‌یابی کانال](/fa/channels/troubleshooting).

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Telegram](/fa/gateway/config-channels#telegram).

<Accordion title="فیلدهای مهم Telegram">

- راه‌اندازی/احراز هویت: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` باید به یک فایل عادی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, سطح بالای `bindings[]` (`type: "acp"`)
- تأییدیه‌های exec: `execApprovals`, `accounts.*.execApprovals`
- فرمان/منو: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread/replies: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (پیش‌نمایش), `streaming.preview.toolProgress`, `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ `/bot<TOKEN>` را وارد نکنید)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- کنش‌ها/قابلیت‌ها: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- واکنش‌ها: `reactionNotifications`, `reactionLevel`
- خطاها: `errorPolicy`, `errorCooldownMs`
- نوشتن‌ها/تاریخچه: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را شامل کنید) تا مسیریابی پیش‌فرض صریح شود. در غیر این صورت OpenClaw به نخستین شناسه حساب نرمال‌شده fallback می‌کند و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقادیر `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را به gateway pair کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار allowlist گروه و موضوع.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    گروه‌ها و موضوع‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="عیب‌یابی" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های میان‌کانالی.
  </Card>
</CardGroup>

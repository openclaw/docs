---
read_when:
    - کار روی قابلیت‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:22:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

آمادهٔ تولید برای پیام‌های مستقیم ربات و گروه‌ها از طریق grammY. حالت پیش‌فرض، long polling است؛ حالت Webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای Telegram، pairing است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی‌های میان‌کانالی و راهنماهای تعمیر.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و نمونه‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="توکن ربات را در BotFather ایجاد کنید">
    Telegram را باز کنید و با **@BotFather** گفتگو کنید (مطمئن شوید شناسه دقیقاً `@BotFather` است).

    `/newbot` را اجرا کنید، اعلان‌ها را دنبال کنید و توکن را ذخیره کنید.

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

  <Step title="Gateway را شروع کنید و اولین پیام مستقیم را تأیید کنید">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    کدهای pairing پس از ۱ ساعت منقضی می‌شوند.

  </Step>

  <Step title="ربات را به یک گروه اضافه کنید">
    ربات را به گروه خود اضافه کنید، سپس هر دو شناسه‌ای را که دسترسی گروه نیاز دارد دریافت کنید:

    - شناسه کاربری Telegram شما، که در `allowFrom` / `groupAllowFrom` استفاده می‌شود
    - شناسه گفتگوی گروه Telegram، که به‌عنوان کلید زیر `channels.telegram.groups` استفاده می‌شود

    برای راه‌اندازی نخستین‌بار، شناسه گفتگوی گروه را از `openclaw logs --follow`، یک ربات شناسهٔ فورواردشده، یا Bot API `getUpdates` بگیرید. پس از مجاز شدن گروه، `/whoami@<bot_username>` می‌تواند شناسه‌های کاربر و گروه را تأیید کند.

    شناسه‌های منفی سوپرگروه Telegram که با `-100` شروع می‌شوند، شناسه‌های گفتگوی گروه هستند. آن‌ها را زیر `channels.telegram.groups` قرار دهید، نه زیر `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتیب حل توکن، از حساب آگاه است. در عمل، مقدارهای config بر جایگزین env اولویت دارند و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و دیده‌شدن گروه">
    ربات‌های Telegram به‌طور پیش‌فرض روی **Privacy Mode** هستند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر ربات باید همهٔ پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را با `/setprivacy` غیرفعال کنید، یا
    - ربات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، ربات را از هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت مدیر در تنظیمات گروه Telegram کنترل می‌شود.

    ربات‌های مدیر همهٔ پیام‌های گروه را دریافت می‌کنند، که برای رفتار گروهی همیشه‌فعال مفید است.

  </Accordion>

  <Accordion title="تنظیمات مفید BotFather">

    - `/setjoingroups` برای مجاز/غیرمجاز کردن افزودن به گروه
    - `/setprivacy` برای رفتار دیده‌شدن در گروه

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

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` به هر حساب Telegram که نام کاربری ربات را پیدا یا حدس بزند اجازه می‌دهد به ربات فرمان دهد. فقط برای ربات‌های عمداً عمومی با ابزارهای به‌شدت محدود از آن استفاده کنید؛ ربات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربر Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در پیکربندی‌های چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های `allowFrom: ["*"]` در سطح حساب، آن حساب را عمومی نمی‌کنند مگر اینکه allowlist مؤثر حساب پس از ادغام هنوز شامل یک wildcard صریح باشد.
    `dmPolicy: "allowlist"` با `allowFrom` خالی، همهٔ پیام‌های مستقیم را مسدود می‌کند و توسط اعتبارسنجی config رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند.
    اگر ارتقا داده‌اید و config شما شامل ورودی‌های allowlist با `@username` است، `openclaw doctor --fix` را اجرا کنید تا آن‌ها را resolve کند (بهترین تلاش؛ به توکن ربات Telegram نیاز دارد).
    اگر قبلاً به فایل‌های allowlist ذخیرهٔ pairing متکی بودید، `openclaw doctor --fix` می‌تواند ورودی‌ها را در جریان‌های allowlist به `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز هیچ شناسهٔ صریحی ندارد).

    برای ربات‌های تک‌مالک، `dmPolicy: "allowlist"` را با شناسه‌های عددی صریح `allowFrom` ترجیح دهید تا سیاست دسترسی در config پایدار بماند (به‌جای وابستگی به تأییدهای pairing قبلی).

    ابهام رایج: تأیید pairing پیام مستقیم به معنی «این فرستنده همه‌جا مجاز است» نیست.
    Pairing دسترسی پیام مستقیم را اعطا می‌کند. اگر هنوز مالک فرمانی وجود نداشته باشد، اولین pairing تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط‌مالک و تأییدهای exec یک حساب اپراتور صریح داشته باشند.
    مجوزدهی فرستندهٔ گروه همچنان از allowlistهای صریح config می‌آید.
    اگر می‌خواهید «یک بار مجاز شوم و هم پیام‌های مستقیم و هم فرمان‌های گروهی کار کنند»، شناسهٔ عددی کاربر Telegram خود را در `channels.telegram.allowFrom` قرار دهید؛ برای فرمان‌های فقط‌مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### پیدا کردن شناسه کاربری Telegram

    ایمن‌تر (بدون ربات شخص ثالث):

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

    1. **کدام گروه‌ها مجاز هستند** (`channels.telegram.groups`)
       - بدون config برای `groups`:
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسهٔ گروه را بگذراند
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها تا زمانی که ورودی‌های `groups` (یا `"*"`) را اضافه نکنید مسدود هستند
       - `groups` پیکربندی شده: به‌عنوان allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستندهٔ گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` برمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربر Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های گفتگوی گروه یا سوپرگروه Telegram را در `groupAllowFrom` قرار ندهید. شناسه‌های گفتگوی منفی باید زیر `channels.telegram.groups` باشند.
    ورودی‌های غیرعددی برای مجوزدهی فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز مجوز فرستندهٔ گروه تأییدهای ذخیرهٔ pairing پیام مستقیم را به ارث **نمی‌برد**.
    Pairing فقط برای پیام مستقیم باقی می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` در سطح گروه/موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به config `allowFrom` برمی‌گردد، نه ذخیرهٔ pairing.
    الگوی عملی برای ربات‌های تک‌مالک: شناسهٔ کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکتهٔ زمان اجرا: اگر `channels.telegram` کاملاً وجود نداشته باشد، runtime به‌طور پیش‌فرض fail-closed `groupPolicy="allowlist"` را به‌کار می‌گیرد مگر اینکه `channels.defaults.groupPolicy` صریحاً تنظیم شده باشد.

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

    آن را از گروه با `@<bot_username> ping` آزمایش کنید. پیام‌های سادهٔ گروه وقتی `requireMention: true` است ربات را فعال نمی‌کنند.

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

    مثال: مجاز کردن فقط کاربران مشخص درون یک گروه مشخص:

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

      - شناسه‌های منفی گفتگوی گروه یا سوپرگروه Telegram مانند `-1001234567890` را زیر `channels.telegram.groups` قرار دهید.
      - وقتی می‌خواهید محدود کنید چه کسانی داخل یک گروه مجاز بتوانند ربات را فعال کنند، شناسه‌های کاربر Telegram مانند `8734062810` را زیر `groupAllowFrom` قرار دهید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با ربات گفتگو کند.

    </Warning>

  </Tab>

  <Tab title="رفتار mention">
    پاسخ‌های گروهی به‌طور پیش‌فرض به mention نیاز دارند.

    Mention می‌تواند از این موارد بیاید:

    - mention بومی `@botusername`، یا
    - الگوهای mention در:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    toggles فرمان در سطح نشست:

    - `/activation always`
    - `/activation mention`

    این‌ها فقط وضعیت نشست را به‌روزرسانی می‌کنند. برای پایداری از config استفاده کنید.

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

    دریافت شناسهٔ گفتگوی گروه:

    - یک پیام گروهی را به `@userinfobot` / `@getidsbot` فوروارد کنید
    - یا `chat.id` را از `openclaw logs --follow` بخوانید
    - یا Bot API `getUpdates` را بررسی کنید
    - پس از مجاز شدن گروه، اگر فرمان‌های بومی فعال هستند `/whoami@<bot_username>` را اجرا کنید

  </Tab>
</Tabs>

## رفتار زمان اجرا

- Telegram تحت مالکیت فرایند gateway است.
- مسیریابی قطعی است: ورودی Telegram به Telegram پاسخ داده می‌شود (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به پاکت مشترک کانال با فرادادهٔ پاسخ، جای‌نگهدارهای رسانه و زمینهٔ پایدارشدهٔ زنجیرهٔ پاسخ برای پاسخ‌های Telegram که gateway مشاهده کرده است نرمال‌سازی می‌شوند.
- نشست‌های گروهی با شناسهٔ گروه ایزوله می‌شوند. موضوعات انجمن `:topic:<threadId>` را اضافه می‌کنند تا موضوعات ایزوله بمانند.
- پیام‌های مستقیم می‌توانند `message_thread_id` داشته باشند؛ OpenClaw شناسهٔ thread را برای پاسخ‌ها حفظ می‌کند اما پیام‌های مستقیم را به‌طور پیش‌فرض روی نشست تخت نگه می‌دارد. وقتی عمداً ایزوله‌سازی نشست موضوع پیام مستقیم را می‌خواهید، `channels.telegram.dm.threadReplies: "inbound"`، `channels.telegram.direct.<chatId>.threadReplies: "inbound"`، `requireTopic: true`، یا یک config موضوع مطابق را پیکربندی کنید.
- Long polling از grammY runner با توالی‌دهی به‌ازای هر chat/هر thread استفاده می‌کند. هم‌زمانی کلی runner sink از `agents.defaults.maxConcurrent` استفاده می‌کند.
- Long polling داخل هر فرایند gateway محافظت می‌شود تا در هر زمان فقط یک poller فعال بتواند از یک توکن ربات استفاده کند. اگر همچنان تداخل‌های `getUpdates` 409 را می‌بینید، احتمالاً یک gateway دیگر OpenClaw، اسکریپت یا poller خارجی از همان توکن استفاده می‌کند.
- راه‌اندازی‌های مجدد watchdog برای long-polling به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون liveness کامل‌شدهٔ `getUpdates` فعال می‌شوند. فقط اگر استقرار شما هنوز هنگام کارهای طولانی‌مدت راه‌اندازی مجدد کاذب polling-stall می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ overrideهای به‌ازای حساب پشتیبانی می‌شوند.
- Telegram Bot API از رسید خواندن پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="پیش‌نمایش جریان زنده (ویرایش پیام‌ها)">
    OpenClaw می‌تواند پاسخ‌های جزئی را در زمان واقعی stream کند:

    - گفتگوهای مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/موضوعات: پیام پیش‌نمایش + `editMessageText`

    نیازمندی:

    - `channels.telegram.streaming` برابر با `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - `progress` یک پیش‌نویس وضعیت قابل ویرایش را برای پیشرفت ابزار نگه می‌دارد، در پایان آن را پاک می‌کند، و پاسخ نهایی را به‌صورت یک پیام عادی می‌فرستد
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت دوباره از همان پیام پیش‌نمایش ویرایش‌شده استفاده کنند یا نه (پیش‌فرض: `true` وقتی پخش جریانی پیش‌نمایش فعال است)
    - `streaming.preview.commandText` جزئیات دستور/اجرا را داخل آن خطوط پیشرفت ابزار کنترل می‌کند: `raw` (پیش‌فرض، رفتار منتشرشده را حفظ می‌کند) یا `status` (فقط برچسب ابزار)
    - مقدارهای قدیمی `channels.telegram.streamMode` و مقدارهای بولی `streaming` شناسایی می‌شوند؛ برای مهاجرت آن‌ها به `channels.telegram.streaming.mode`، `openclaw doctor --fix` را اجرا کنید

    به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار همان خطوط کوتاه وضعیت هستند که هنگام اجرای ابزارها نشان داده می‌شوند، برای نمونه اجرای دستور، خواندن فایل، به‌روزرسانی‌های برنامه‌ریزی، یا خلاصه‌های وصله. Telegram این موارد را به‌طور پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشده OpenClaw از `v2026.4.22` و نسخه‌های بعدی هم‌خوان باشد. برای حفظ پیش‌نمایش ویرایش‌شده برای متن پاسخ، اما پنهان کردن خطوط پیشرفت ابزار، تنظیم کنید:

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

    برای نمایان نگه داشتن پیشرفت ابزار اما پنهان کردن متن دستور/اجرا، تنظیم کنید:

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

    وقتی پیشرفت ابزار قابل مشاهده را بدون ویرایش پاسخ نهایی در همان پیام می‌خواهید، از حالت `progress` استفاده کنید. سیاست متن دستور را زیر `streaming.progress` قرار دهید:

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

    فقط وقتی از `streaming.mode: "off"` استفاده کنید که تحویل فقط نهایی را می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و گفت‌وگوی عمومی ابزار/پیشرفت به‌جای ارسال شدن به‌صورت پیام‌های وضعیت مستقل، سرکوب می‌شود. درخواست‌های تأیید، محتوای رسانه‌ای، و خطاها همچنان از مسیر تحویل نهایی عادی عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و خطوط وضعیت پیشرفت ابزار را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    <Note>
      پاسخ‌های نقل‌قول انتخاب‌شده در Telegram استثنا هستند. وقتی `replyToMode` برابر با `"first"`، `"all"`، یا `"batched"` باشد و پیام ورودی شامل متن نقل‌قول انتخاب‌شده باشد، OpenClaw پاسخ نهایی را به‌جای ویرایش پیش‌نمایش پاسخ، از مسیر پاسخ نقل‌قول بومی Telegram می‌فرستد؛ بنابراین `streaming.preview.toolProgress` نمی‌تواند خطوط کوتاه وضعیت را برای آن نوبت نشان دهد. پاسخ‌های پیام فعلی بدون متن نقل‌قول انتخاب‌شده همچنان پخش جریانی پیش‌نمایش را نگه می‌دارند. وقتی نمایش پیشرفت ابزار از پاسخ‌های نقل‌قول بومی مهم‌تر است، `replyToMode: "off"` را تنظیم کنید، یا برای پذیرش این مصالحه `streaming.preview.toolProgress: false` را تنظیم کنید.
    </Note>

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه پیام مستقیم/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و ویرایش نهایی را درجا انجام می‌دهد
    - خروجی‌های نهایی متنی طولانی که به چند پیام Telegram تقسیم می‌شوند، در صورت امکان از پیش‌نمایش موجود به‌عنوان قطعه نهایی اول استفاده می‌کنند، سپس فقط قطعه‌های باقی‌مانده را می‌فرستند
    - خروجی‌های نهایی حالت پیشرفت، پیش‌نویس وضعیت را پاک می‌کنند و به‌جای ویرایش پیش‌نویس به پاسخ، از تحویل نهایی عادی استفاده می‌کنند
    - اگر ویرایش نهایی پیش از تأیید متن کامل‌شده شکست بخورد، OpenClaw از تحویل نهایی عادی استفاده می‌کند و پیش‌نمایش کهنه را پاک‌سازی می‌کند

    برای پاسخ‌های پیچیده (برای نمونه محتوای رسانه‌ای)، OpenClaw به تحویل نهایی عادی برمی‌گردد و سپس پیام پیش‌نمایش را پاک‌سازی می‌کند.

    پخش جریانی پیش‌نمایش از پخش جریانی بلوکی جداست. وقتی پخش جریانی بلوکی به‌طور صریح برای Telegram فعال شده باشد، OpenClaw برای جلوگیری از پخش جریانی دوگانه، پخش جریانی پیش‌نمایش را رد می‌کند.

    جریان استدلال فقط برای Telegram:

    - `/reasoning stream` هنگام تولید، استدلال را به پیش‌نمایش زنده می‌فرستد
    - پیش‌نمایش استدلال پس از تحویل نهایی حذف می‌شود؛ وقتی استدلال باید قابل مشاهده بماند از `/reasoning on` استفاده کنید
    - پاسخ نهایی بدون متن استدلال فرستاده می‌شود

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    متن خروجی از `parse_mode: "HTML"` در Telegram استفاده می‌کند.

    - متن شبیه Markdown به HTML ایمن برای Telegram رندر می‌شود.
    - HTML خام مدل escape می‌شود تا خطاهای parse در Telegram کاهش یابد.
    - اگر Telegram HTML پردازش‌شده را رد کند، OpenClaw دوباره به‌صورت متن ساده تلاش می‌کند.

    پیش‌نمایش‌های لینک به‌طور پیش‌فرض فعال هستند و می‌توان آن‌ها را با `channels.telegram.linkPreview: false` غیرفعال کرد.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    ثبت منوی دستورهای Telegram هنگام راه‌اندازی با `setMyCommands` انجام می‌شود.

    پیش‌فرض‌های دستور بومی:

    - `commands.native: "auto"` دستورهای بومی را برای Telegram فعال می‌کند

    ورودی‌های سفارشی به منوی دستور اضافه کنید:

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

    - دستورهای سفارشی فقط ورودی منو هستند؛ رفتار را به‌طور خودکار پیاده‌سازی نمی‌کنند
    - دستورهای plugin/skill همچنان می‌توانند هنگام تایپ شدن کار کنند، حتی اگر در منوی Telegram نشان داده نشوند

    اگر دستورهای بومی غیرفعال باشند، موارد داخلی حذف می‌شوند. دستورهای سفارشی/plugin همچنان ممکن است در صورت پیکربندی ثبت شوند.

    خطاهای رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از کوتاه‌سازی همچنان سرریز شده است؛ دستورهای plugin/skill/سفارشی را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` با `404: Not Found` در حالی که دستورهای مستقیم curl برای Bot API کار می‌کنند، می‌تواند یعنی `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن بات پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان شکست پاک‌سازی Webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای شبکه/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود شده است.

    ### دستورهای جفت‌سازی دستگاه (Plugin `device-pair`)

    وقتی Plugin `device-pair` نصب شده باشد:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در برنامه iOS جای‌گذاری کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (شامل نقش/دامنه‌ها)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر را حمل می‌کند. واگذاری داخلی bootstrap توکن گره اصلی را در `scopes: []` نگه می‌دارد؛ هر توکن operator واگذارشده محدود به `operator.approvals`، `operator.read`، `operator.talk.secrets`، و `operator.write` می‌ماند. بررسی‌های دامنه bootstrap دارای پیشوند نقش هستند، بنابراین آن فهرست مجاز operator فقط درخواست‌های operator را برآورده می‌کند؛ نقش‌های غیر operator همچنان به دامنه‌هایی زیر پیشوند نقش خودشان نیاز دارند.

    اگر دستگاهی با جزئیات auth تغییرکرده دوباره تلاش کند (برای نمونه نقش/دامنه‌ها/کلید عمومی)، درخواست در انتظار قبلی جایگزین می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید، `/pair pending` را دوباره اجرا کنید.

    جزئیات بیشتر: [جفت‌سازی](/fa/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
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

    مقدار قدیمی `capabilities: ["inlineButtons"]` به `inlineButtons: "all"` نگاشت می‌شود.

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

  <Accordion title="Telegram message actions for agents and automation">
    کنش‌های ابزار Telegram شامل موارد زیر هستند:

    - `sendMessage` (`to`، `content`، `mediaUrl` اختیاری، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، `iconColor` اختیاری، `iconCustomEmojiId`)

    کنش‌های پیام کانال aliasهای خوش‌دست ارائه می‌کنند (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    کنترل‌های gate:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌طور پیش‌فرض فعال هستند و toggleهای جداگانه `channels.telegram.actions.*` ندارند.
    ارسال‌های runtime از snapshot فعال پیکربندی/secretها استفاده می‌کنند (راه‌اندازی/reload)، بنابراین مسیرهای کنش برای هر ارسال، re-resolution موردی `SecretRef` انجام نمی‌دهند.

    معنای حذف واکنش: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram از برچسب‌های صریح رشته‌بندی پاسخ در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام محرک پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسه پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` نحوه رسیدگی را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی رشته‌بندی پاسخ فعال باشد و متن یا کپشن اصلی Telegram در دسترس باشد، OpenClaw به‌طور خودکار یک گزیده نقل‌قول بومی Telegram اضافه می‌کند. Telegram متن نقل‌قول بومی را به ۱۰۲۴ واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل‌قول می‌شوند و اگر Telegram نقل‌قول را رد کند، به یک پاسخ ساده برمی‌گردند.

    نکته: `off` رشته‌بندی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    سوپرگروه‌های انجمن:

    - کلیدهای جلسه موضوع، `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و typing موضوع thread را هدف می‌گیرند
    - مسیر پیکربندی موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالت خاص موضوع عمومی (`threadId=1`):

    - ارسال‌های پیام، `message_thread_id` را حذف می‌کنند (Telegram، `sendMessage(...thread_id=1)` را رد می‌کند)
    - کنش‌های typing همچنان `message_thread_id` را شامل می‌شوند

    ارث‌بری موضوع: ورودی‌های موضوع تنظیمات گروه را ارث می‌برند مگر اینکه بازنویسی شده باشند (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` فقط مخصوص موضوع است و از پیش‌فرض‌های گروه ارث نمی‌برد.

    **مسیریابی عامل برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در پیکربندی موضوع، به عامل متفاوتی مسیریابی شود. این کار به هر موضوع workspace، حافظه، و جلسه ایزوله خودش را می‌دهد. نمونه:

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

    **اتصال پایدار موضوع ACP**: موضوع‌های انجمن می‌توانند نشست‌های هارنس ACP را از طریق اتصال‌های ACP تایپ‌شده سطح بالا پین کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و یک شناسه دارای موضوع مانند `-1001234567890:topic:42`). در حال حاضر به موضوع‌های انجمن در گروه‌ها/ابرگروه‌ها محدود است. [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

    **ایجاد ACP وابسته به رشته از چت**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک نشست ACP جدید متصل می‌کند؛ پیگیری‌ها مستقیم به آنجا هدایت می‌شوند. OpenClaw تأیید ایجاد را در همان موضوع پین می‌کند. نیاز دارد `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    زمینه قالب، `MessageThreadId` و `IsForum` را در دسترس می‌گذارد. چت‌های DM با `message_thread_id` به‌طور پیش‌فرض مسیریابی DM و فراداده پاسخ را روی نشست‌های تخت نگه می‌دارند؛ آن‌ها فقط وقتی از کلیدهای نشست آگاه از رشته استفاده می‌کنند که با `threadReplies: "inbound"`، `threadReplies: "always"`، `requireTopic: true`، یا یک پیکربندی موضوع مطابق تنظیم شده باشند. برای پیش‌فرض حساب از `channels.telegram.dm.threadReplies`، یا برای یک DM از `direct.<chatId>.threadReplies` استفاده کنید.

  </Accordion>

  <Accordion title="صدا، ویدیو، و استیکرها">
    ### پیام‌های صوتی

    Telegram میان یادداشت‌های صوتی و فایل‌های صوتی تمایز قائل می‌شود.

    - پیش‌فرض: رفتار فایل صوتی
    - تگ `[[audio_as_voice]]` در پاسخ عامل برای اجباری کردن ارسال به‌صورت یادداشت صوتی
    - رونوشت‌های یادداشت صوتی ورودی در زمینه عامل به‌عنوان متن تولیدشده توسط ماشین و غیرقابل‌اعتماد قاب‌بندی می‌شوند؛ تشخیص منشن همچنان از رونوشت خام استفاده می‌کند، بنابراین پیام‌های صوتی وابسته به منشن همچنان کار می‌کنند.

    نمونه اقدام پیام:

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

    Telegram میان فایل‌های ویدیویی و یادداشت‌های ویدیویی تمایز قائل می‌شود.

    نمونه اقدام پیام:

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

    فیلدهای زمینه استیکر:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    فایل کش استیکر:

    - `~/.openclaw/telegram/sticker-cache.json`

    استیکرها یک‌بار توصیف می‌شوند (هرجا ممکن باشد) و برای کاهش فراخوانی‌های تکراری بینایی کش می‌شوند.

    فعال‌سازی اقدام‌های استیکر:

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

    اقدام ارسال استیکر:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    جستجوی استیکرهای کش‌شده:

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

    وقتی فعال باشد، OpenClaw رویدادهای سیستمی مانند این را صف می‌کند:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکته‌ها:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط ربات (بهترین تلاش از طریق کش پیام‌های ارسالی).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ فرستنده‌های غیرمجاز کنار گذاشته می‌شوند.
    - Telegram در به‌روزرسانی‌های واکنش شناسه رشته ارائه نمی‌کند.
      - گروه‌های غیرانجمنی به نشست چت گروه هدایت می‌شوند
      - گروه‌های انجمنی به نشست موضوع عمومی گروه (`:topic:1`) هدایت می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌طور خودکار شامل `message_reaction` می‌شود.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw، یک ایموجی تأیید ارسال می‌کند.

    ترتیب حل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - بازگشت به ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکته‌ها:

    - Telegram انتظار ایموجی یونیکد دارد (برای مثال "👀").
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی کانال به‌طور پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های تحریک‌شده توسط Telegram شامل این موارد است:

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
    پیش‌فرض long polling است. برای حالت Webhook، `channels.telegram.webhookUrl` و `channels.telegram.webhookSecret` را تنظیم کنید؛ `webhookPath`، `webhookHost`، `webhookPort` اختیاری هستند (پیش‌فرض‌ها `/telegram-webhook`، `127.0.0.1`، `8787`).

    در حالت long-polling، OpenClaw نشانگر راه‌اندازی مجدد خود را فقط پس از توزیع موفق یک به‌روزرسانی پایدار می‌کند. اگر یک handler شکست بخورد، آن به‌روزرسانی در همان فرایند قابل تلاش مجدد می‌ماند و برای حذف تکرار در راه‌اندازی مجدد به‌عنوان تکمیل‌شده نوشته نمی‌شود.

    شنونده محلی به `127.0.0.1:8787` متصل می‌شود. برای ورودی عمومی، یا یک reverse proxy جلوی پورت محلی بگذارید یا عمداً `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook پیش از بازگرداندن `200` به Telegram، محافظ‌های درخواست، توکن محرمانه Telegram، و بدنه JSON را اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان مسیرهای ربات برای هر چت/هر موضوع که long polling استفاده می‌کند پردازش می‌کند، بنابراین نوبت‌های کند عامل ACK تحویل Telegram را نگه نمی‌دارند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش مجدد، و هدف‌های CLI">
    - پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` مرزهای پاراگراف (خطوط خالی) را پیش از تقسیم بر اساس طول ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازه رسانه ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.mediaGroupFlushMs` (پیش‌فرض 500) کنترل می‌کند آلبوم‌ها/گروه‌های رسانه Telegram چه مدت بافر شوند پیش از آن‌که OpenClaw آن‌ها را به‌عنوان یک پیام ورودی توزیع کند. اگر بخش‌های آلبوم دیر می‌رسند، آن را افزایش دهید؛ برای کاهش تأخیر پاسخ آلبوم آن را کاهش دهید.
    - `channels.telegram.timeoutSeconds` زمان‌انتظار کلاینت API Telegram را بازنویسی می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های ربات مقادیر پیکربندی‌شده کمتر از محافظ درخواست متن/تایپ خروجی 60 ثانیه‌ای را محدود می‌کنند تا grammY تحویل پاسخ قابل‌مشاهده را پیش از اجرای محافظ transport و fallback OpenClaw قطع نکند. Long polling همچنان از محافظ درخواست 45 ثانیه‌ای `getUpdates` استفاده می‌کند تا pollهای بیکار نامحدود رها نشوند.
    - `channels.telegram.pollingStallThresholdMs` به‌طور پیش‌فرض `120000` است؛ فقط برای راه‌اندازی‌های مجدد کاذب ناشی از polling-stall، آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچه زمینه گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` استفاده می‌کند (پیش‌فرض 50)؛ `0` غیرفعال می‌کند.
    - زمینه تکمیلی پاسخ/نقل‌قول/forward وقتی Gateway پیام‌های والد را مشاهده کرده باشد، در یک پنجره زمینه گفت‌وگوی انتخاب‌شده عادی‌سازی می‌شود؛ کش پیام‌های مشاهده‌شده کنار محل ذخیره نشست پایدار می‌شود. Telegram فقط یک `reply_to_message` سطحی را در به‌روزرسانی‌ها شامل می‌کند، بنابراین زنجیره‌های قدیمی‌تر از کش به محتوای به‌روزرسانی فعلی Telegram محدود می‌شوند.
    - allowlistهای Telegram در اصل کنترل می‌کنند چه کسی می‌تواند عامل را تحریک کند، نه یک مرز کامل حذف زمینه تکمیلی.
    - کنترل‌های تاریخچه DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای قابل بازیابی API خروجی، روی کمک‌کننده‌های ارسال Telegram (CLI/tools/actions) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای شکست‌های پیش‌اتصال Telegram از یک تلاش مجدد safe-send محدود استفاده می‌کند، اما پاکت‌های شبکه مبهم پس از ارسال را که ممکن است پیام‌های قابل‌مشاهده را تکراری کنند دوباره تلاش نمی‌کند.

    هدف‌های ارسال CLI و ابزار پیام می‌توانند شناسه عددی چت، نام کاربری، یا هدف موضوع انجمن باشند:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    pollهای Telegram از `openclaw message poll` استفاده می‌کنند و از موضوع‌های انجمن پشتیبانی می‌کنند:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    فلگ‌های poll فقط برای Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` برای موضوع‌های انجمن (یا از یک هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین پشتیبانی می‌کند از:

    - `--presentation` با بلوک‌های `buttons` برای صفحه‌کلیدهای inline وقتی `channels.telegram.capabilities.inlineButtons` اجازه می‌دهد
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل پین‌شده وقتی ربات بتواند در آن چت پین کند
    - `--force-document` برای ارسال تصاویر، GIFها، و ویدیوهای خروجی به‌صورت سند به‌جای بارگذاری عکس فشرده، رسانه متحرک، یا ویدیو

    کنترل اقدام:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ساخت poll در Telegram را غیرفعال می‌کند، در حالی که ارسال‌های عادی فعال می‌مانند

  </Accordion>

  <Accordion title="تأییدهای exec در Telegram">
    Telegram از تأییدهای exec در DMهای تأییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در چت یا موضوع مبدأ ارسال کند. تأییدکننده‌ها باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی دست‌کم یک تأییدکننده قابل حل باشد، خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی مالک از `commands.ownerAllowFrom` fallback می‌کند)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom`، و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با ربات صحبت کند و ربات پاسخ‌های عادی را کجا ارسال می‌کند. آن‌ها کسی را به تأییدکننده exec تبدیل نمی‌کنند. نخستین جفت‌سازی DM تأییدشده وقتی هنوز مالک فرمانی وجود ندارد، `commands.ownerAllowFrom` را bootstrap می‌کند، بنابراین راه‌اندازی تک‌مالک همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانالی متن فرمان را در چت نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/موضوع‌های مورد اعتماد فعال کنید. وقتی prompt در یک موضوع انجمن قرار می‌گیرد، OpenClaw موضوع را برای prompt تأیید و پیگیری حفظ می‌کند. تأییدهای exec به‌طور پیش‌فرض پس از 30 دقیقه منقضی می‌شوند.

    دکمه‌های تأیید inline نیز نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group`، یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدهای Plugin حل می‌شوند؛ بقیه ابتدا از طریق تأییدهای exec حل می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی عامل با خطای تحویل یا ارائه‌دهنده روبه‌رو می‌شود، Telegram می‌تواند یا با متن خطا پاسخ دهد یا آن را سرکوب کند. دو کلید پیکربندی این رفتار را کنترل می‌کنند:

| کلید                                | مقادیر           | پیش‌فرض | توضیح                                                                                          |
| ----------------------------------- | ---------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` یک پیام خطای دوستانه به چت می‌فرستد. `silent` پاسخ‌های خطا را کاملاً سرکوب می‌کند. |
| `channels.telegram.errorCooldownMs` | number (ms)      | `60000` | کمترین زمان بین پاسخ‌های خطا به همان چت. از هرزفرستی خطا هنگام قطعی‌ها جلوگیری می‌کند.       |

بازنویسی‌ها در سطح هر حساب، هر گروه، و هر موضوع پشتیبانی می‌شوند (همان وراثت کلیدهای پیکربندی دیگر Telegram).

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
    - `openclaw channels status` وقتی پیکربندی انتظار پیام‌های گروهی بدون mention دارد هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ wildcard `"*"` را نمی‌توان از نظر عضویت probe کرد.
    - آزمون سریع نشست: `/activation always`.

  </Accordion>

  <Accordion title="ربات اصلاً پیام‌های گروه را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا شامل `"*"` باشد)
    - عضویت ربات در گروه را تأیید کنید
    - لاگ‌ها را برای دلایل رد شدن مرور کنید: `openclaw logs --follow`

  </Accordion>

  <Accordion title="دستورها ناقص کار می‌کنند یا اصلاً کار نمی‌کنند">

    - هویت فرستنده خود را مجاز کنید (pairing و/یا `allowFrom` عددی)
    - مجوز دستور حتی وقتی سیاست گروه `open` است همچنان اعمال می‌شود
    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی بومی ورودی‌های بیش از حد دارد؛ دستورهای Plugin/Skills/سفارشی را کاهش دهید یا منوهای بومی را غیرفعال کنید
    - فراخوانی‌های راه‌اندازی `deleteMyCommands` / `setMyCommands` و فراخوانی‌های تایپ `sendChatAction` محدود هستند و هنگام timeout درخواست، یک بار از طریق fallback انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار شبکه/fetch معمولاً نشان‌دهنده مشکلات دسترسی‌پذیری DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="راه‌اندازی، token غیرمجاز گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای token ربات پیکربندی‌شده است.
    - token ربات را در BotFather دوباره کپی یا بازتولید کنید، سپس `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken`، یا `TELEGRAM_BOT_TOKEN` را برای حساب پیش‌فرض به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام راه‌اندازی نیز یک شکست احراز هویت است؛ در نظر گرفتن آن به‌عنوان «Webhook وجود ندارد» فقط همان شکست token نادرست را به فراخوانی‌های API بعدی موکول می‌کند.

  </Accordion>

  <Accordion title="ناپایداری polling یا شبکه">

    - Node 22+ همراه با fetch/proxy سفارشی می‌تواند اگر نوع‌های AbortSignal ناسازگار باشند، رفتار abort فوری ایجاد کند.
    - برخی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 resolve می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث شکست‌های متناوب API Telegram شود.
    - اگر لاگ‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این موارد را به‌عنوان خطاهای شبکه قابل بازیابی دوباره تلاش می‌کند.
    - هنگام راه‌اندازی polling، OpenClaw probe موفق راه‌اندازی `getMe` را برای grammY بازاستفاده می‌کند تا اجراکننده پیش از نخستین `getUpdates` به `getMe` دوم نیاز نداشته باشد.
    - اگر `deleteWebhook` هنگام راه‌اندازی polling با خطای شبکه گذرا شکست بخورد، OpenClaw به‌جای انجام یک فراخوانی control-plane دیگر پیش از poll، وارد long polling می‌شود. Webhook همچنان فعال به‌صورت تعارض `getUpdates` ظاهر می‌شود؛ سپس OpenClaw انتقال Telegram را بازسازی می‌کند و پاک‌سازی Webhook را دوباره تلاش می‌کند.
    - اگر socketهای Telegram با cadence ثابت کوتاهی recycle می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ کلاینت‌های ربات مقدارهای پیکربندی‌شده پایین‌تر از guardهای درخواست outbound و `getUpdates` را clamp می‌کنند، اما نسخه‌های قدیمی‌تر وقتی این مقدار پایین‌تر از آن guardها تنظیم می‌شد می‌توانستند هر poll یا پاسخ را abort کنند.
    - اگر لاگ‌ها شامل `Polling stall detected` باشند، OpenClaw به‌طور پیش‌فرض پس از 120 ثانیه بدون liveness کامل‌شده long-poll، polling را دوباره راه‌اندازی و انتقال Telegram را بازسازی می‌کند.
    - `openclaw channels status --probe` و `openclaw doctor` هشدار می‌دهند وقتی یک حساب polling در حال اجرا پس از grace راه‌اندازی `getUpdates` را کامل نکرده باشد، وقتی یک حساب Webhook در حال اجرا پس از grace راه‌اندازی `setWebhook` را کامل نکرده باشد، یا وقتی آخرین فعالیت موفق انتقال polling کهنه باشد.
    - `channels.telegram.pollingStallThresholdMs` را فقط وقتی افزایش دهید که فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما میزبان شما همچنان راه‌اندازی مجدد polling-stall کاذب گزارش می‌کند. stallهای پایدار معمولاً به مشکلات proxy، DNS، IPv6، یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین env proxy فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و گونه‌های حروف کوچک آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌تواند `api.telegram.org` را دور بزند.
    - اگر proxy مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای محیط سرویس پیکربندی شده باشد و env proxy استانداردی وجود نداشته باشد، Telegram نیز از همان URL برای انتقال Bot API استفاده می‌کند.
    - روی میزبان‌های VPS با خروجی مستقیم/TLS ناپایدار، فراخوانی‌های API Telegram را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌طور پیش‌فرض `autoSelectFamily=true` دارد (به‌جز WSL2). ترتیب نتیجه DNS برای Telegram ابتدا از `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، سپس `channels.telegram.network.dnsResultOrder`، و سپس پیش‌فرض فرایند مانند `NODE_OPTIONS=--dns-result-order=ipv4first` پیروی می‌کند؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` fallback می‌کند.
    - اگر میزبان شما WSL2 است یا صراحتاً با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب family را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های بازه benchmark در RFC 2544 (`198.18.0.0/15`) از قبل به‌طور پیش‌فرض
      برای دانلودهای رسانه Telegram مجاز هستند. اگر یک fake-IP مورد اعتماد یا
      proxy شفاف، `api.telegram.org` را هنگام دانلود رسانه به آدرس
      خصوصی/داخلی/کاربرد-ویژه دیگری بازنویسی کند، می‌توانید به bypass فقط برای Telegram
      opt in کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین opt-in در سطح هر حساب نیز در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر proxy شما میزبان‌های رسانه Telegram را به `198.18.x.x` resolve می‌کند، ابتدا
      flag خطرناک را خاموش نگه دارید. رسانه Telegram از قبل به‌طور پیش‌فرض بازه
      benchmark در RFC 2544 را مجاز می‌کند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانه Telegram را تضعیف می‌کند. آن را فقط برای محیط‌های proxy مورد اعتماد و کنترل‌شده توسط operator مانند مسیریابی fake-IP در Clash، Mihomo، یا Surge استفاده کنید، وقتی پاسخ‌های خصوصی یا کاربرد-ویژه بیرون از بازه benchmark در RFC 2544 می‌سازند. برای دسترسی عادی Telegram از اینترنت عمومی، آن را خاموش نگه دارید.
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

<Accordion title="فیلدهای Telegram با سیگنال بالا">

- راه‌اندازی/احراز هویت: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` باید به یک فایل عادی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, سطح‌بالا `bindings[]` (`type: "acp"`)
- تأییدهای اجرا: `execApprovals`, `accounts.*.execApprovals`
- دستور/منو: `commands.native`, `commands.nativeSkills`, `customCommands`
- threadها/پاسخ‌ها: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (پیش‌نمایش), `streaming.preview.toolProgress`, `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ `/bot<TOKEN>` را شامل نکنید)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- کنش‌ها/قابلیت‌ها: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- خطاها: `errorPolicy`, `errorCooldownMs`
- نوشتن‌ها/تاریخچه: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را شامل کنید) تا مسیریابی پیش‌فرض صریح شود. در غیر این صورت OpenClaw به نخستین شناسه حساب نرمال‌شده fallback می‌کند و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقدارهای `accounts.default.*` را نه.
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
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    گروه‌ها و موضوع‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="عیب‌یابی" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های بین‌کانالی.
  </Card>
</CardGroup>

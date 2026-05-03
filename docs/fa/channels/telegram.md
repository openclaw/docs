---
read_when:
    - کار روی قابلیت‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-03T21:27:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 528ace9dae29eda22f98cc1436ec16146eb9d83edc73aa6db1ab8283f4f873c0
    source_path: channels/telegram.md
    workflow: 16
---

آماده برای تولید برای DMهای ربات و گروه‌ها از طریق grammY. حالت پیش‌فرض، long polling است؛ حالت Webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض DM برای Telegram جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی‌های میان‌کانالی و راهنماهای تعمیر.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و مثال‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="ساخت توکن ربات در BotFather">
    Telegram را باز کنید و با **@BotFather** گفت‌وگو کنید (مطمئن شوید handle دقیقاً `@BotFather` است).

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

    fallback محیطی: `TELEGRAM_BOT_TOKEN=...` (فقط حساب پیش‌فرض).
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
ترتیب resolve شدن توکن، وابسته به حساب است. در عمل، مقادیر config بر fallback محیطی اولویت دارند، و `TELEGRAM_BOT_TOKEN` فقط روی حساب پیش‌فرض اعمال می‌شود.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و دیده‌شدن گروه">
    ربات‌های Telegram به‌طور پیش‌فرض از **Privacy Mode** استفاده می‌کنند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر ربات باید همه پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - privacy mode را از طریق `/setprivacy` غیرفعال کنید، یا
    - ربات را admin گروه کنید.

    هنگام تغییر privacy mode، ربات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت admin در تنظیمات گروه Telegram کنترل می‌شود.

    ربات‌های admin همه پیام‌های گروه را دریافت می‌کنند، که برای رفتار گروهی همیشه‌فعال مفید است.

  </Accordion>

  <Accordion title="تغییرات مفید BotFather">

    - `/setjoingroups` برای اجازه دادن یا ندادن به افزودن به گروه
    - `/setprivacy` برای رفتار دیده‌شدن در گروه

  </Accordion>
</AccordionGroup>

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست DM">
    `channels.telegram.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (حداقل به یک شناسه فرستنده در `allowFrom` نیاز دارد)
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` به هر حساب Telegram که نام کاربری ربات را پیدا یا حدس بزند اجازه می‌دهد به ربات فرمان بدهد. فقط برای ربات‌های عمداً عمومی با ابزارهای بسیار محدود از آن استفاده کنید؛ ربات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربر Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در پیکربندی‌های چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های سطح حساب `allowFrom: ["*"]` آن حساب را عمومی نمی‌کنند مگر اینکه allowlist مؤثر حساب پس از ادغام همچنان دارای یک wildcard صریح باشد.
    `dmPolicy: "allowlist"` با `allowFrom` خالی همه DMها را مسدود می‌کند و توسط اعتبارسنجی config رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند.
    اگر ارتقا داده‌اید و config شما شامل ورودی‌های allowlist به شکل `@username` است، برای resolve کردن آن‌ها `openclaw doctor --fix` را اجرا کنید (تا حد امکان؛ به توکن ربات Telegram نیاز دارد).
    اگر پیش‌تر به فایل‌های allowlist در pairing-store متکی بودید، `openclaw doctor --fix` می‌تواند ورودی‌ها را در جریان‌های allowlist به `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز هیچ شناسه صریحی ندارد).

    برای ربات‌های تک‌مالک، `dmPolicy: "allowlist"` با شناسه‌های عددی صریح `allowFrom` را ترجیح دهید تا سیاست دسترسی در config پایدار بماند (به‌جای وابستگی به تأییدهای جفت‌سازی قبلی).

    سردرگمی رایج: تأیید جفت‌سازی DM به معنی «این فرستنده همه‌جا مجاز است» نیست.
    جفت‌سازی دسترسی DM می‌دهد. اگر هنوز مالک فرمانی وجود نداشته باشد، اولین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط‌مالک و تأییدهای exec یک حساب اپراتور صریح داشته باشند.
    مجوز فرستنده گروه همچنان از allowlistهای صریح config می‌آید.
    اگر می‌خواهید «من یک‌بار مجاز شوم و هم DMها و هم فرمان‌های گروهی کار کنند»، شناسه عددی کاربر Telegram خود را در `channels.telegram.allowFrom` قرار دهید؛ برای فرمان‌های فقط‌مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### یافتن شناسه کاربر Telegram شما

    امن‌تر (بدون ربات شخص ثالث):

    1. به ربات خود DM بدهید.
    2. `openclaw logs --follow` را اجرا کنید.
    3. `from.id` را بخوانید.

    روش رسمی Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    روش شخص ثالث (با حریم خصوصی کمتر): `@userinfobot` یا `@getidsbot`.

  </Tab>

  <Tab title="سیاست گروه و allowlistها">
    دو کنترل با هم اعمال می‌شوند:

    1. **کدام گروه‌ها مجاز هستند** (`channels.telegram.groups`)
       - بدون config برای `groups`:
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسه گروه را پاس کند
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها تا زمانی که ورودی‌های `groups` (یا `"*"`) را اضافه نکنید مسدود می‌شوند
       - `groups` پیکربندی‌شده: به‌عنوان allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستنده گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` برمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربر Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های chat گروه یا supergroup در Telegram را در `groupAllowFrom` قرار ندهید. شناسه‌های chat منفی باید زیر `channels.telegram.groups` قرار بگیرند.
    ورودی‌های غیرعددی برای مجوز فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز مجوز فرستنده گروه، تأییدهای pairing-store مربوط به DM را به ارث **نمی‌برد**.
    جفت‌سازی فقط برای DM باقی می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` در سطح هر گروه/هر topic را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به `allowFrom` در config برمی‌گردد، نه pairing store.
    الگوی عملی برای ربات‌های تک‌مالک: شناسه کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکته runtime: اگر `channels.telegram` کاملاً وجود نداشته باشد، runtime به‌صورت پیش‌فرض fail-closed با `groupPolicy="allowlist"` کار می‌کند، مگر اینکه `channels.defaults.groupPolicy` صریحاً تنظیم شده باشد.

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

    مثال: اجازه دادن فقط به کاربران مشخص داخل یک گروه مشخص:

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

      - شناسه‌های منفی chat گروه یا supergroup در Telegram مانند `-1001234567890` را زیر `channels.telegram.groups` قرار دهید.
      - وقتی می‌خواهید محدود کنید کدام افراد داخل یک گروه مجاز بتوانند ربات را فعال کنند، شناسه‌های کاربر Telegram مانند `8734062810` را زیر `groupAllowFrom` قرار دهید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با ربات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="رفتار mention">
    پاسخ‌های گروه به‌طور پیش‌فرض به mention نیاز دارند.

    mention می‌تواند از این‌ها بیاید:

    - mention بومی `@botusername`، یا
    - الگوهای mention در:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    toggleهای فرمان در سطح session:

    - `/activation always`
    - `/activation mention`

    این‌ها فقط وضعیت session را به‌روزرسانی می‌کنند. برای پایداری از config استفاده کنید.

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

    گرفتن شناسه chat گروه:

    - یک پیام گروه را به `@userinfobot` / `@getidsbot` forward کنید
    - یا `chat.id` را از `openclaw logs --follow` بخوانید
    - یا Bot API `getUpdates` را بررسی کنید

  </Tab>
</Tabs>

## رفتار runtime

- Telegram تحت مالکیت فرایند gateway است.
- مسیریابی قطعی است: ورودی Telegram به Telegram پاسخ داده می‌شود (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به envelope کانال مشترک با metadata پاسخ و placeholderهای رسانه نرمال‌سازی می‌شوند.
- sessionهای گروه بر اساس شناسه گروه ایزوله می‌شوند. topicهای forum، `:topic:<threadId>` را اضافه می‌کنند تا topicها ایزوله بمانند.
- پیام‌های DM می‌توانند `message_thread_id` داشته باشند؛ OpenClaw شناسه thread را برای پاسخ‌ها حفظ می‌کند اما به‌طور پیش‌فرض DMها را روی session تخت نگه می‌دارد. وقتی عمداً ایزوله‌سازی session topic در DM را می‌خواهید، `channels.telegram.dm.threadReplies: "inbound"`، `channels.telegram.direct.<chatId>.threadReplies: "inbound"`، `requireTopic: true`، یا یک config topic منطبق را پیکربندی کنید.
- Long polling از runner در grammY با توالی‌دهی per-chat/per-thread استفاده می‌کند. هم‌روندی کلی runner sink از `agents.defaults.maxConcurrent` استفاده می‌کند.
- Long polling داخل هر فرایند gateway محافظت می‌شود تا در هر زمان فقط یک poller فعال بتواند از یک توکن ربات استفاده کند. اگر همچنان conflictهای `getUpdates` 409 می‌بینید، احتمالاً یک gateway دیگر OpenClaw، یک script، یا یک poller خارجی از همان توکن استفاده می‌کند.
- راه‌اندازی‌های مجدد watchdog برای long-polling به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون liveness کامل‌شده `getUpdates` فعال می‌شوند. فقط اگر deployment شما همچنان هنگام کارهای طولانی‌مدت راه‌اندازی مجدد کاذب polling-stall می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ overrideهای per-account پشتیبانی می‌شوند.
- Telegram Bot API از رسید خواندن پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="پیش‌نمایش live stream (ویرایش پیام‌ها)">
    OpenClaw می‌تواند پاسخ‌های جزئی را به‌صورت real time stream کند:

    - chatهای مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/topicها: پیام پیش‌نمایش + `editMessageText`

    نیازمندی:

    - `channels.telegram.streaming` برابر `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - `progress` یک پیش‌نویس وضعیت قابل‌ویرایش نگه می‌دارد و تا تحویل نهایی، آن را با پیشرفت ابزار به‌روزرسانی می‌کند
    - `streaming.preview.toolProgress` کنترل می‌کند آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده دوباره استفاده کنند یا نه (پیش‌فرض: `true` وقتی preview streaming فعال است)
    - مقادیر legacy `channels.telegram.streamMode` و boolean `streaming` شناسایی می‌شوند؛ برای مهاجرت آن‌ها به `channels.telegram.streaming.mode` دستور `openclaw doctor --fix` را اجرا کنید

    به‌روزرسانی‌های پیش‌نمایش tool-progress همان خطوط کوتاه وضعیت هستند که هنگام اجرای ابزارها نشان داده می‌شوند، برای مثال اجرای فرمان، خواندن فایل، به‌روزرسانی‌های برنامه‌ریزی، یا خلاصه‌های patch. Telegram این‌ها را به‌طور پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشده OpenClaw از `v2026.4.22` و نسخه‌های بعدی منطبق باشد. برای نگه داشتن پیش‌نمایش ویرایش‌شده برای متن پاسخ اما پنهان کردن خطوط tool-progress، تنظیم کنید:

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

    از `streaming.mode: "off"` فقط زمانی استفاده کنید که تحویل فقط-نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و گفت‌وگوی عمومی ابزار/پیشرفت به‌جای ارسال به‌عنوان پیام‌های وضعیت مستقل، سرکوب می‌شود. اعلان‌های تأیید، محموله‌های رسانه‌ای و خطاها همچنان از مسیر تحویل نهایی عادی عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و خطوط وضعیت پیشرفت ابزار را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    <Note>
      پاسخ‌های نقل‌قول انتخاب‌شده Telegram استثنا هستند. وقتی `replyToMode` برابر `"first"`، `"all"` یا `"batched"` باشد و پیام ورودی شامل متن نقل‌قول انتخاب‌شده باشد، OpenClaw پاسخ نهایی را به‌جای ویرایش پیش‌نمایش پاسخ، از مسیر بومی پاسخِ نقل‌قولی Telegram ارسال می‌کند؛ بنابراین `streaming.preview.toolProgress` نمی‌تواند خطوط کوتاه وضعیت را برای آن نوبت نشان دهد. پاسخ‌های پیام فعلی بدون متن نقل‌قول انتخاب‌شده همچنان جریان پیش‌نمایش را نگه می‌دارند. وقتی نمایش پیشرفت ابزار از پاسخ‌های نقل‌قولی بومی مهم‌تر است، `replyToMode: "off"` را تنظیم کنید، یا برای پذیرفتن این بده‌بستان `streaming.preview.toolProgress: false` را تنظیم کنید.
    </Note>

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و یک ویرایش نهایی را در همان‌جا انجام می‌دهد، مگر اینکه پس از ظاهر شدن پیش‌نمایش، یک پیام غیرپیش‌نمایش قابل‌مشاهده ارسال شده باشد
    - پیش‌نمایش‌هایی که خروجی غیرپیش‌نمایش قابل‌مشاهده پس از آن‌ها می‌آید: OpenClaw پاسخ کامل‌شده را به‌عنوان یک پیام نهایی تازه ارسال می‌کند و پیش‌نمایش قدیمی‌تر را پاک می‌کند، بنابراین پاسخ نهایی پس از خروجی میانی ظاهر می‌شود
    - پیش‌نمایش‌های قدیمی‌تر از حدود یک دقیقه: OpenClaw پاسخ کامل‌شده را به‌عنوان یک پیام نهایی تازه ارسال می‌کند و سپس پیش‌نمایش را پاک می‌کند، بنابراین زمان‌نمای قابل‌مشاهده Telegram زمان تکمیل را به‌جای زمان ایجاد پیش‌نمایش نشان می‌دهد

    برای پاسخ‌های پیچیده (برای مثال محموله‌های رسانه‌ای)، OpenClaw به تحویل نهایی عادی بازمی‌گردد و سپس پیام پیش‌نمایش را پاک می‌کند.

    جریان پیش‌نمایش از جریان بلوکی جدا است. وقتی جریان بلوکی به‌طور صریح برای Telegram فعال شده باشد، OpenClaw برای جلوگیری از جریان‌دهی دوگانه، جریان پیش‌نمایش را رد می‌کند.

    جریان استدلال فقط برای Telegram:

    - `/reasoning stream` هنگام تولید، استدلال را به پیش‌نمایش زنده ارسال می‌کند
    - پاسخ نهایی بدون متن استدلال ارسال می‌شود

  </Accordion>

  <Accordion title="قالب‌بندی و جایگزین HTML">
    متن خروجی از Telegram `parse_mode: "HTML"` استفاده می‌کند.

    - متن شبیه Markdown به HTML امن برای Telegram رندر می‌شود.
    - HTML خام مدل escape می‌شود تا شکست‌های parse در Telegram کاهش یابد.
    - اگر Telegram HTML تجزیه‌شده را رد کند، OpenClaw دوباره به‌صورت متن ساده تلاش می‌کند.

    پیش‌نمایش‌های لینک به‌طور پیش‌فرض فعال هستند و می‌توان آن‌ها را با `channels.telegram.linkPreview: false` غیرفعال کرد.

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
    - تداخل‌ها/تکراری‌ها رد می‌شوند و لاگ می‌شوند

    نکته‌ها:

    - فرمان‌های سفارشی فقط ورودی‌های منو هستند؛ آن‌ها رفتار را به‌صورت خودکار پیاده‌سازی نمی‌کنند
    - فرمان‌های Plugin/skill حتی اگر در منوی Telegram نمایش داده نشوند، همچنان هنگام تایپ می‌توانند کار کنند

    اگر فرمان‌های بومی غیرفعال باشند، موارد داخلی حذف می‌شوند. فرمان‌های سفارشی/Plugin در صورت پیکربندی همچنان ممکن است ثبت شوند.

    شکست‌های رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram حتی پس از کوتاه‌سازی هم سرریز شده است؛ فرمان‌های Plugin/skill/سفارشی را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands` یا `setMyCommands` با `404: Not Found` در حالی که فرمان‌های مستقیم curl برای Bot API کار می‌کنند، می‌تواند یعنی `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن بات پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile` یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان شکست پاک‌سازی Webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای network/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود شده است.

    ### فرمان‌های جفت‌سازی دستگاه (Plugin `device-pair`)

    وقتی Plugin `device-pair` نصب شده باشد:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در برنامه iOS جای‌گذاری کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (شامل نقش/دامنه‌ها)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای تازه‌ترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر را حمل می‌کند. handoff داخلی bootstrap توکن node اصلی را در `scopes: []` نگه می‌دارد؛ هر توکن operator واگذار‌شده به `operator.approvals`، `operator.read`، `operator.talk.secrets` و `operator.write` محدود می‌ماند. بررسی‌های دامنه bootstrap با پیشوند نقش هستند، بنابراین آن allowlist مربوط به operator فقط درخواست‌های operator را برآورده می‌کند؛ نقش‌های غیر-operator همچنان به دامنه‌هایی زیر پیشوند نقش خودشان نیاز دارند.

    اگر دستگاهی با جزئیات احراز هویت تغییر‌یافته دوباره تلاش کند (برای مثال نقش/دامنه‌ها/کلید عمومی)، درخواست در انتظار قبلی جایگزین می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید، `/pair pending` را دوباره اجرا کنید.

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

    نمونه اقدام پیام:

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

  <Accordion title="اقدام‌های پیام Telegram برای agentها و اتوماسیون">
    اقدام‌های ابزار Telegram شامل این موارد است:

    - `sendMessage` (`to`, `content`, اختیاری `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, اختیاری `iconColor`, `iconCustomEmojiId`)

    اقدام‌های پیام channel نام‌های مستعار خوش‌دست را ارائه می‌کنند (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    کنترل‌های gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌طور پیش‌فرض فعال هستند و toggleهای جداگانه `channels.telegram.actions.*` ندارند.
    ارسال‌های runtime از snapshot فعال پیکربندی/secretها (راه‌اندازی/بارگذاری مجدد) استفاده می‌کنند، بنابراین مسیرهای اقدام برای هر ارسال، SecretRef را به‌صورت ad-hoc دوباره resolve نمی‌کنند.

    معنای حذف واکنش: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="تگ‌های رشته‌بندی پاسخ">
    Telegram از تگ‌های صریح رشته‌بندی پاسخ در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام تحریک‌کننده پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسه پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` مدیریت را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی رشته‌بندی پاسخ فعال باشد و متن یا caption اصلی Telegram در دسترس باشد، OpenClaw به‌طور خودکار یک گزیده نقل‌قول بومی Telegram را شامل می‌کند. Telegram متن نقل‌قول بومی را به 1024 واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل می‌شوند و اگر Telegram نقل‌قول را رد کند، به پاسخ ساده fallback می‌کنند.

    نکته: `off` رشته‌بندی ضمنی پاسخ را غیرفعال می‌کند. تگ‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="موضوعات Forum و رفتار thread">
    ابرگروه‌های Forum:

    - کلیدهای session موضوع `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و typing موضوع thread را هدف می‌گیرند
    - مسیر پیکربندی موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالت ویژه موضوع عمومی (`threadId=1`):

    - ارسال پیام‌ها `message_thread_id` را حذف می‌کند (Telegram `sendMessage(...thread_id=1)` را رد می‌کند)
    - اقدام‌های typing همچنان `message_thread_id` را شامل می‌شوند

    ارث‌بری موضوع: ورودی‌های موضوع تنظیمات گروه را ارث می‌برند مگر اینکه بازنویسی شده باشند (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` فقط مخصوص موضوع است و از پیش‌فرض‌های گروه ارث نمی‌برد.

    **مسیریابی agent برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در پیکربندی موضوع، به agent متفاوتی مسیر داده شود. این کار به هر موضوع workspace، memory و session ایزوله خودش را می‌دهد. مثال:

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

    **اتصال پایدار موضوع ACP**: موضوعات Forum می‌توانند sessionهای harness مربوط به ACP را از طریق bindingهای تایپ‌شده ACP در سطح بالا pin کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و یک شناسه واجد موضوع مثل `-1001234567890:topic:42`). در حال حاضر به موضوعات Forum در گروه‌ها/ابرگروه‌ها محدود است. [Agentهای ACP](/fa/tools/acp-agents) را ببینید.

    **spawn وابسته به thread برای ACP از chat**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک session جدید ACP متصل می‌کند؛ پیگیری‌ها مستقیماً به همان‌جا مسیر داده می‌شوند. OpenClaw تأیید spawn را درون موضوع pin می‌کند. نیاز دارد `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    زمینه template، `MessageThreadId` و `IsForum` را ارائه می‌کند. chatهای DM با `message_thread_id` به‌طور پیش‌فرض مسیریابی DM و metadata پاسخ را روی sessionهای تخت نگه می‌دارند؛ آن‌ها فقط زمانی از کلیدهای session آگاه از thread استفاده می‌کنند که با `threadReplies: "inbound"`، `threadReplies: "always"`، `requireTopic: true` یا یک پیکربندی موضوع مطابق پیکربندی شده باشند. برای پیش‌فرض حساب از `channels.telegram.dm.threadReplies` در سطح بالا، یا برای یک DM از `direct.<chatId>.threadReplies` استفاده کنید.

  </Accordion>

  <Accordion title="صدا، ویدیو و استیکرها">
    ### پیام‌های صوتی

    Telegram یادداشت‌های صوتی را از فایل‌های صوتی متمایز می‌کند.

    - پیش‌فرض: رفتار فایل صوتی
    - تگ `[[audio_as_voice]]` در پاسخ agent برای اجبار ارسال به‌صورت یادداشت صوتی
    - رونوشت‌های یادداشت صوتی ورودی در زمینه agent به‌عنوان متن تولیدشده توسط ماشین و نامطمئن frame می‌شوند؛ تشخیص mention همچنان از رونوشت خام استفاده می‌کند، بنابراین پیام‌های صوتی وابسته به mention همچنان کار می‌کنند.

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

    Telegram فایل‌های ویدیویی را از پیام‌های ویدیویی متمایز می‌کند.

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

    پیام‌های ویدیویی از کپشن پشتیبانی نمی‌کنند؛ متن پیام ارائه‌شده جداگانه ارسال می‌شود.

    ### استیکرها

    مدیریت استیکرهای ورودی:

    - WEBP ایستا: دانلود و پردازش می‌شود (placeholder `<media:sticker>`)
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
    واکنش‌های Telegram به‌صورت به‌روزرسانی‌های `message_reaction` دریافت می‌شوند (جدا از payloadهای پیام).

    وقتی فعال باشد، OpenClaw رویدادهای سیستمی مانند این را در صف قرار می‌دهد:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکته‌ها:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط bot (بهترین تلاش از طریق کش پیام‌های ارسال‌شده).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) را رعایت می‌کنند؛ فرستندگان غیرمجاز حذف می‌شوند.
    - Telegram در به‌روزرسانی‌های واکنش شناسهٔ thread ارائه نمی‌کند.
      - گروه‌های غیر forum به نشست چت گروهی هدایت می‌شوند
      - گروه‌های forum به نشست موضوع عمومی گروه (`:topic:1`) هدایت می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌طور خودکار شامل `message_reaction` است.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` هنگام پردازش پیام ورودی توسط OpenClaw یک emoji تأیید ارسال می‌کند.

    ترتیب حل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback emoji هویت agent (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Telegram انتظار emoji یونیکد دارد (برای مثال "👀").
    - از `""` برای غیرفعال‌کردن واکنش برای یک channel یا account استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی channel به‌طور پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های فعال‌شده توسط Telegram شامل موارد زیر است:

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
    پیش‌فرض long polling است. برای حالت webhook، `channels.telegram.webhookUrl` و `channels.telegram.webhookSecret` را تنظیم کنید؛ `webhookPath`، `webhookHost` و `webhookPort` اختیاری هستند (پیش‌فرض‌ها `/telegram-webhook`، `127.0.0.1`، `8787`).

    شنوندهٔ محلی به `127.0.0.1:8787` متصل می‌شود. برای ورودی عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا عمداً `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت webhook پیش از بازگرداندن `200` به Telegram، guardهای درخواست، توکن محرمانهٔ Telegram و بدنهٔ JSON را اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان مسیرهای bot برای هر چت/هر موضوع که long polling استفاده می‌کند پردازش می‌کند، بنابراین نوبت‌های کند agent باعث نگه‌داشتن ACK تحویل Telegram نمی‌شوند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش مجدد، و هدف‌های CLI">
    - پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خطوط خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازهٔ رسانهٔ ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.mediaGroupFlushMs` (پیش‌فرض 500) کنترل می‌کند که آلبوم‌ها/گروه‌های رسانه‌ای Telegram چه مدت buffer شوند پیش از آنکه OpenClaw آن‌ها را به‌عنوان یک پیام ورودی dispatch کند. اگر بخش‌های آلبوم دیر می‌رسند، آن را افزایش دهید؛ برای کاهش تأخیر پاسخ آلبوم آن را کاهش دهید.
    - `channels.telegram.timeoutSeconds` timeout کلاینت API Telegram را override می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های bot مقدارهای پیکربندی‌شدهٔ کمتر از guard درخواست 60 ثانیه‌ای متن/typing خروجی را clamp می‌کنند تا grammY پیش از اجرای transport guard و fallback OpenClaw، تحویل پاسخ قابل مشاهده را abort نکند. long polling همچنان از guard درخواست 45 ثانیه‌ای `getUpdates` استفاده می‌کند تا pollهای idle برای همیشه رها نشوند.
    - `channels.telegram.pollingStallThresholdMs` به‌طور پیش‌فرض `120000` است؛ فقط برای restartهای false-positive polling-stall، آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچهٔ زمینهٔ گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` استفاده می‌کند (پیش‌فرض 50)؛ `0` غیرفعال می‌کند.
    - زمینهٔ تکمیلی reply/quote/forward در حال حاضر همان‌طور که دریافت شده منتقل می‌شود.
    - allowlistهای Telegram عمدتاً تعیین می‌کنند چه کسی می‌تواند agent را فعال کند، نه اینکه یک مرز کامل حذف زمینهٔ تکمیلی باشند.
    - کنترل‌های تاریخچهٔ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای قابل بازیابی API خروجی، روی helperهای ارسال Telegram (CLI/tools/actions) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای خرابی‌های پیش‌اتصال Telegram از تلاش مجدد safe-send محدود استفاده می‌کند، اما envelopeهای شبکهٔ مبهم پس از ارسال را که می‌توانند پیام‌های قابل مشاهده را تکراری کنند، دوباره امتحان نمی‌کند.

    هدف ارسال CLI می‌تواند شناسهٔ عددی چت یا نام کاربری باشد:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    pollهای Telegram از `openclaw message poll` استفاده می‌کنند و از موضوع‌های forum پشتیبانی می‌کنند:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    flagهای poll مخصوص Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` برای موضوع‌های forum (یا از هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین پشتیبانی می‌کند از:

    - `--presentation` همراه با blockهای `buttons` برای inline keyboardها وقتی `channels.telegram.capabilities.inlineButtons` اجازه دهد
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل pinned وقتی bot بتواند در آن چت pin کند
    - `--force-document` برای ارسال تصویرها و GIFهای خروجی به‌صورت document به‌جای آپلودهای photo فشرده یا animated-media

    gating کنش:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ایجاد poll در Telegram را غیرفعال می‌کند و ارسال‌های عادی را فعال نگه می‌دارد

  </Accordion>

  <Accordion title="تأییدهای exec در Telegram">
    Telegram از تأییدهای exec در DMهای approver پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در چت یا موضوع مبدأ ارسال کند. Approverها باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی دست‌کم یک approver قابل resolve باشد، خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی owner از `commands.ownerAllowFrom` fallback می‌کند)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom` و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با bot صحبت کند و bot پاسخ‌های عادی را کجا ارسال کند. این‌ها کسی را به approver exec تبدیل نمی‌کنند. نخستین جفت‌سازی DM تأییدشده، وقتی هنوز owner فرمانی وجود ندارد، `commands.ownerAllowFrom` را bootstrap می‌کند، بنابراین راه‌اندازی تک-owner همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل channel متن فرمان را در چت نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/موضوع‌های مورد اعتماد فعال کنید. وقتی prompt در یک موضوع forum قرار می‌گیرد، OpenClaw موضوع را برای prompt تأیید و پیام follow-up حفظ می‌کند. تأییدهای exec به‌طور پیش‌فرض پس از 30 دقیقه منقضی می‌شوند.

    دکمه‌های تأیید inline همچنین نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group`، یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدهای plugin resolve می‌شوند؛ بقیه ابتدا از طریق تأییدهای exec resolve می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی agent با خطای تحویل یا provider مواجه می‌شود، Telegram می‌تواند یا با متن خطا پاسخ دهد یا آن را suppress کند. دو کلید پیکربندی این رفتار را کنترل می‌کنند:

| کلید                                | مقدارها           | پیش‌فرض | توضیح                                                                                           |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` یک پیام خطای دوستانه به چت ارسال می‌کند. `silent` پاسخ‌های خطا را کاملاً suppress می‌کند. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | حداقل زمان بین پاسخ‌های خطا به همان چت. از spam خطا هنگام قطعی جلوگیری می‌کند.                  |

Overrideهای per-account، per-group و per-topic پشتیبانی می‌شوند (همان inheritance کلیدهای دیگر پیکربندی Telegram).

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
  <Accordion title="Bot به پیام‌های گروهی بدون mention پاسخ نمی‌دهد">

    - اگر `requireMention=false`، حالت privacy در Telegram باید visibility کامل را مجاز کند.
      - BotFather: `/setprivacy` -> Disable
      - سپس bot را از گروه حذف و دوباره اضافه کنید
    - وقتی پیکربندی انتظار پیام‌های گروهی بدون mention دارد، `openclaw channels status` هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ wildcard `"*"` را نمی‌توان membership-probe کرد.
    - تست سریع نشست: `/activation always`.

  </Accordion>

  <Accordion title="Bot اصلاً پیام‌های گروه را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا شامل `"*"`)
    - عضویت bot در گروه را بررسی کنید
    - لاگ‌ها را مرور کنید: `openclaw logs --follow` برای دلایل skip

  </Accordion>

  <Accordion title="فرمان‌ها به‌صورت جزئی کار می‌کنند یا اصلاً کار نمی‌کنند">

    - هویت فرستندهٔ خود را مجاز کنید (pairing و/یا `allowFrom` عددی)
    - مجوز فرمان حتی وقتی policy گروه `open` باشد همچنان اعمال می‌شود
    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی native ورودی‌های زیادی دارد؛ فرمان‌های Plugin/skill/custom را کاهش دهید یا منوهای native را غیرفعال کنید
    - فراخوانی‌های startup مربوط به `deleteMyCommands` / `setMyCommands` و فراخوانی‌های typing مربوط به `sendChatAction` محدود هستند و در timeout درخواست، یک‌بار از طریق fallback transport Telegram دوباره امتحان می‌شوند. خطاهای پایدار network/fetch معمولاً نشان‌دهندهٔ مشکلات دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="Startup توکن غیرمجاز گزارش می‌کند">

    - `getMe returned 401` شکست احراز هویت Telegram برای توکن بات پیکربندی‌شده است.
    - توکن بات را در BotFather دوباره کپی یا بازتولید کنید، سپس `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken`، یا `TELEGRAM_BOT_TOKEN` را برای حساب پیش‌فرض به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام راه‌اندازی نیز شکست احراز هویت است؛ در نظر گرفتن آن به‌عنوان «هیچ webhookای وجود ندارد» فقط همان شکست ناشی از توکن نامعتبر را به فراخوانی‌های بعدی API موکول می‌کند.

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ به‌همراه fetch/proxy سفارشی می‌تواند در صورت ناسازگاری نوع‌های AbortSignal، رفتار لغو فوری را فعال کند.
    - برخی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 حل می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث شکست‌های متناوب API Telegram شود.
    - اگر لاگ‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این موارد را به‌عنوان خطاهای شبکه قابل بازیابی دوباره تلاش می‌کند.
    - هنگام راه‌اندازی polling، OpenClaw همان بررسی موفق `getMe` زمان راه‌اندازی را برای grammY دوباره استفاده می‌کند تا اجراکننده پیش از نخستین `getUpdates` به `getMe` دوم نیاز نداشته باشد.
    - اگر `deleteWebhook` هنگام راه‌اندازی polling با خطای شبکه گذرا شکست بخورد، OpenClaw به‌جای انجام یک فراخوانی control-plane دیگر پیش از poll، وارد long polling می‌شود. webhook همچنان فعال به‌صورت تعارض `getUpdates` ظاهر می‌شود؛ سپس OpenClaw انتقال Telegram را بازسازی می‌کند و پاک‌سازی webhook را دوباره تلاش می‌کند.
    - اگر سوکت‌های Telegram در یک تناوب کوتاه و ثابت بازیافت می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ کلاینت‌های بات مقدارهای پیکربندی‌شده کمتر از محافظ‌های درخواست خروجی و `getUpdates` را محدود می‌کنند، اما نسخه‌های قدیمی‌تر ممکن بود وقتی این مقدار کمتر از آن محافظ‌ها تنظیم می‌شد، هر poll یا پاسخ را لغو کنند.
    - اگر لاگ‌ها شامل `Polling stall detected` باشند، OpenClaw به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون زنده‌بودن long-poll کامل‌شده، polling را دوباره شروع می‌کند و انتقال Telegram را بازسازی می‌کند.
    - `openclaw channels status --probe` و `openclaw doctor` زمانی هشدار می‌دهند که یک حساب polling در حال اجرا پس از مهلت راه‌اندازی `getUpdates` را کامل نکرده باشد، یک حساب webhook در حال اجرا پس از مهلت راه‌اندازی `setWebhook` را کامل نکرده باشد، یا آخرین فعالیت موفق انتقال polling کهنه شده باشد.
    - `channels.telegram.pollingStallThresholdMs` را فقط زمانی افزایش دهید که فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما میزبان شما همچنان راه‌اندازی‌های مجدد polling-stall کاذب گزارش می‌کند. توقف‌های پایدار معمولاً به مشکلات proxy، DNS، IPv6، یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین envهای proxy فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و گونه‌های حروف کوچک آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌تواند `api.telegram.org` را دور بزند.
    - اگر proxy مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای محیط سرویس پیکربندی شده باشد و هیچ env استاندارد proxy وجود نداشته باشد، Telegram نیز از همان URL برای انتقال Bot API استفاده می‌کند.
    - روی میزبان‌های VPS با خروجی مستقیم/TLS ناپایدار، فراخوانی‌های API Telegram را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌طور پیش‌فرض `autoSelectFamily=true` است (به‌جز WSL2). ترتیب نتیجه DNS برای Telegram ابتدا `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، سپس `channels.telegram.network.dnsResultOrder`، سپس پیش‌فرض فرایند مانند `NODE_OPTIONS=--dns-result-order=ipv4first` را رعایت می‌کند؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` بازمی‌گردد.
    - اگر میزبان شما WSL2 است یا صراحتاً با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب خانواده را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های محدوده benchmark در RFC 2544 (`198.18.0.0/15`) از قبل به‌طور پیش‌فرض
      برای دانلودهای رسانه Telegram مجاز هستند. اگر یک fake-IP یا
      proxy شفاف مورد اعتماد، `api.telegram.org` را هنگام دانلود رسانه به نشانی
      خصوصی/داخلی/با کاربرد ویژه دیگری بازنویسی می‌کند، می‌توانید برای دورزدن فقط مخصوص Telegram
      opt-in کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین opt-in برای هر حساب نیز در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر proxy شما میزبان‌های رسانه Telegram را به `198.18.x.x` حل می‌کند، ابتدا
      پرچم خطرناک را خاموش نگه دارید. رسانه Telegram از قبل به‌طور پیش‌فرض محدوده
      benchmark در RFC 2544 را مجاز می‌داند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانه Telegram را تضعیف می‌کند. از آن فقط برای محیط‌های proxy مورد اعتماد و تحت کنترل اپراتور مانند Clash، Mihomo، یا مسیریابی fake-IP در Surge استفاده کنید، آن هم زمانی که پاسخ‌های خصوصی یا با کاربرد ویژه خارج از محدوده benchmark در RFC 2544 تولید می‌کنند. برای دسترسی عادی Telegram روی اینترنت عمومی آن را خاموش نگه دارید.
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

<Accordion title="High-signal Telegram fields">

- راه‌اندازی/احراز هویت: `enabled`، `botToken`، `tokenFile`، `accounts.*` (`tokenFile` باید به یک فایل معمولی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، `bindings[]` سطح بالا (`type: "acp"`)
- تأییدهای اجرا: `execApprovals`، `accounts.*.execApprovals`
- فرمان/منو: `commands.native`، `commands.nativeSkills`، `customCommands`
- threadها/پاسخ‌ها: `replyToMode`، `dm.threadReplies`، `direct.*.threadReplies`
- streaming: `streaming` (پیش‌نمایش)، `streaming.preview.toolProgress`، `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`، `chunkMode`، `linkPreview`، `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`، `mediaGroupFlushMs`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ `/bot<TOKEN>` را وارد نکنید)
- webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- کنش‌ها/قابلیت‌ها: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- واکنش‌ها: `reactionNotifications`، `reactionLevel`
- خطاها: `errorPolicy`، `errorCooldownMs`
- نوشتن‌ها/تاریخچه: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را شامل کنید) تا مسیریابی پیش‌فرض صریح شود. در غیر این صورت OpenClaw به نخستین شناسه حساب نرمال‌سازی‌شده بازمی‌گردد و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقدارهای `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را با Gateway جفت کنید.
  </Card>
  <Card title="Groups" icon="users" href="/fa/channels/groups">
    رفتار allowlist برای گروه و موضوع.
  </Card>
  <Card title="Channel routing" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به agentها مسیریابی کنید.
  </Card>
  <Card title="Security" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/fa/concepts/multi-agent">
    گروه‌ها و موضوع‌ها را به agentها نگاشت کنید.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی.
  </Card>
</CardGroup>

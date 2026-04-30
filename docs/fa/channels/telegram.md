---
read_when:
    - کار روی قابلیت‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-30T16:27:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d18ca6c7ab39d7d34848c562857661501d8364329f6e5a266213aa23846047dd
    source_path: channels/telegram.md
    workflow: 16
---

آمادهٔ تولید برای پیام‌های مستقیم ربات و گروه‌ها از طریق grammY. Long polling حالت پیش‌فرض است؛ حالت webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای Telegram، جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌ها و دستورالعمل‌های تعمیر بین‌کانالی.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و نمونه‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="توکن ربات را در BotFather بسازید">
    Telegram را باز کنید و با **@BotFather** گفت‌وگو کنید (تأیید کنید که شناسه دقیقاً `@BotFather` است).

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
    Telegram از `openclaw channels login telegram` استفاده **نمی‌کند**؛ توکن را در پیکربندی/env تنظیم کنید، سپس gateway را شروع کنید.

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
ترتیب تشخیص توکن از حساب آگاه است. در عمل، مقدارهای پیکربندی بر جایگزین env اولویت دارند و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و نمایش‌پذیری گروه">
    ربات‌های Telegram به‌طور پیش‌فرض از **Privacy Mode** استفاده می‌کنند که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر ربات باید همهٔ پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را از طریق `/setprivacy` غیرفعال کنید، یا
    - ربات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، ربات را از هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت مدیر در تنظیمات گروه Telegram کنترل می‌شود.

    ربات‌های مدیر همهٔ پیام‌های گروه را دریافت می‌کنند، که برای رفتار همیشه‌فعال گروه مفید است.

  </Accordion>

  <Accordion title="کلیدهای مفید BotFather">

    - `/setjoingroups` برای مجاز/غیرمجاز کردن افزودن به گروه
    - `/setprivacy` برای رفتار نمایش‌پذیری گروه

  </Accordion>
</AccordionGroup>

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.telegram.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (حداقل به یک شناسهٔ فرستنده در `allowFrom` نیاز دارد)
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` اجازه می‌دهد هر حساب Telegram که نام کاربری ربات را پیدا یا حدس می‌زند، به ربات فرمان بدهد. فقط برای ربات‌های عمداً عمومی با ابزارهای بسیار محدود از آن استفاده کنید؛ ربات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربر Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در پیکربندی‌های چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های سطح حساب `allowFrom: ["*"]` آن حساب را عمومی نمی‌کنند، مگر اینکه allowlist مؤثر حساب پس از ادغام همچنان شامل wildcard صریح باشد.
    `dmPolicy: "allowlist"` با `allowFrom` خالی همهٔ پیام‌های مستقیم را مسدود می‌کند و توسط اعتبارسنجی پیکربندی رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند.
    اگر ارتقا داده‌اید و پیکربندی شما شامل ورودی‌های allowlist به‌شکل `@username` است، `openclaw doctor --fix` را اجرا کنید تا آن‌ها را رفع کند (بهترین تلاش؛ به توکن ربات Telegram نیاز دارد).
    اگر قبلاً به فایل‌های allowlist فروشگاه جفت‌سازی متکی بودید، `openclaw doctor --fix` می‌تواند ورودی‌ها را در جریان‌های allowlist به `channels.telegram.allowFrom` بازیابی کند (برای نمونه وقتی `dmPolicy: "allowlist"` هنوز هیچ شناسهٔ صریحی ندارد).

    برای ربات‌های تک‌مالک، `dmPolicy: "allowlist"` را با شناسه‌های عددی صریح `allowFrom` ترجیح دهید تا سیاست دسترسی در پیکربندی ماندگار بماند (به‌جای وابستگی به تأییدهای قبلی جفت‌سازی).

    ابهام رایج: تأیید جفت‌سازی پیام مستقیم به این معنا نیست که «این فرستنده همه‌جا مجاز است».
    جفت‌سازی دسترسی پیام مستقیم را اعطا می‌کند. اگر هنوز مالک فرمانی وجود نداشته باشد، نخستین جفت‌سازی تأییدشده `commands.ownerAllowFrom` را هم تنظیم می‌کند تا فرمان‌های فقط‌مالک و تأییدهای exec یک حساب اپراتور صریح داشته باشند.
    مجوز فرستندهٔ گروه همچنان از allowlistهای صریح پیکربندی می‌آید.
    اگر می‌خواهید «یک بار مجاز شوم و هم پیام‌های مستقیم و هم فرمان‌های گروه کار کنند»، شناسهٔ عددی کاربر Telegram خود را در `channels.telegram.allowFrom` قرار دهید؛ برای فرمان‌های فقط‌مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### پیدا کردن شناسهٔ کاربر Telegram خود

    ایمن‌تر (بدون ربات شخص ثالث):

    1. به ربات خود پیام مستقیم بدهید.
    2. `openclaw logs --follow` را اجرا کنید.
    3. `from.id` را بخوانید.

    روش رسمی Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    روش شخص ثالث (حریم خصوصی کمتر): `@userinfobot` یا `@getidsbot`.

  </Tab>

  <Tab title="سیاست گروه و allowlistها">
    دو کنترل با هم اعمال می‌شوند:

    1. **کدام گروه‌ها مجاز هستند** (`channels.telegram.groups`)
       - بدون پیکربندی `groups`:
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسهٔ گروه را پشت سر بگذارد
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها مسدود می‌شوند تا زمانی که ورودی‌های `groups` (یا `"*"`) را اضافه کنید
       - `groups` پیکربندی شده: به‌عنوان allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستندهٔ گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` بازمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربر Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های گفت‌وگوی گروه یا ابرگروه Telegram را در `groupAllowFrom` قرار ندهید. شناسه‌های منفی گفت‌وگو باید زیر `channels.telegram.groups` باشند.
    ورودی‌های غیرعددی برای مجوز فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز هویت فرستندهٔ گروه تأییدهای فروشگاه جفت‌سازی پیام مستقیم را به ارث **نمی‌برد**.
    جفت‌سازی فقط برای پیام مستقیم باقی می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` در سطح هر گروه/هر موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به `allowFrom` پیکربندی بازمی‌گردد، نه فروشگاه جفت‌سازی.
    الگوی عملی برای ربات‌های تک‌مالک: شناسهٔ کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکتهٔ زمان اجرا: اگر `channels.telegram` کاملاً وجود نداشته باشد، مقدارهای پیش‌فرض زمان اجرا به `groupPolicy="allowlist"` با حالت بسته در برابر خطا بازمی‌گردند، مگر اینکه `channels.defaults.groupPolicy` صریحاً تنظیم شده باشد.

    نمونه: مجاز کردن هر عضو در یک گروه مشخص:

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

    نمونه: مجاز کردن فقط کاربران مشخص داخل یک گروه مشخص:

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

      - شناسه‌های گفت‌وگوی گروه یا ابرگروه Telegram منفی مانند `-1001234567890` را زیر `channels.telegram.groups` قرار دهید.
      - وقتی می‌خواهید محدود کنید چه افرادی داخل یک گروه مجاز بتوانند ربات را فعال کنند، شناسه‌های کاربر Telegram مانند `8734062810` را زیر `groupAllowFrom` قرار دهید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با ربات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="رفتار منشن">
    پاسخ‌های گروه به‌طور پیش‌فرض به منشن نیاز دارند.

    منشن می‌تواند از این موارد بیاید:

    - منشن بومی `@botusername`، یا
    - الگوهای منشن در:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    کلیدهای فرمان در سطح نشست:

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
    - یا `getUpdates` در Bot API را بررسی کنید

  </Tab>
</Tabs>

## رفتار زمان اجرا

- Telegram توسط فرایند gateway مالکیت می‌شود.
- مسیریابی قطعی است: ورودی‌های Telegram به Telegram پاسخ داده می‌شوند (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به پوشش کانال مشترک با فرادادهٔ پاسخ و placeholderهای رسانه نرمال‌سازی می‌شوند.
- نشست‌های گروه با شناسهٔ گروه جدا می‌شوند. موضوع‌های انجمن `:topic:<threadId>` را اضافه می‌کنند تا موضوع‌ها جدا بمانند.
- پیام‌های مستقیم می‌توانند `message_thread_id` داشته باشند؛ OpenClaw آن‌ها را با کلیدهای نشست آگاه از رشته مسیریابی می‌کند و شناسهٔ رشته را برای پاسخ‌ها حفظ می‌کند.
- Long polling از اجراکنندهٔ grammY با توالی‌بندی در سطح هر گفت‌وگو/هر رشته استفاده می‌کند. هم‌روندی کلی sink اجراکننده از `agents.defaults.maxConcurrent` استفاده می‌کند.
- Long polling داخل هر فرایند gateway محافظت می‌شود تا در هر زمان فقط یک poller فعال بتواند از یک توکن ربات استفاده کند. اگر همچنان تعارض‌های `getUpdates` 409 می‌بینید، احتمالاً یک gateway، اسکریپت، یا poller خارجی OpenClaw دیگر از همان توکن استفاده می‌کند.
- راه‌اندازی‌های مجدد watchdog برای long-polling به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون liveness تکمیل‌شدهٔ `getUpdates` فعال می‌شوند. فقط اگر استقرار شما همچنان هنگام کارهای طولانی‌مدت راه‌اندازی مجدد کاذب polling-stall می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ override در سطح هر حساب پشتیبانی می‌شود.
- Telegram Bot API از رسید خواندن پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="پیش‌نمایش پخش زنده (ویرایش پیام)">
    OpenClaw می‌تواند پاسخ‌های جزئی را در زمان واقعی stream کند:

    - گفت‌وگوهای مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/موضوع‌ها: پیام پیش‌نمایش + `editMessageText`

    نیازمندی:

    - `channels.telegram.streaming` برابر `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - `progress` در Telegram به `partial` نگاشت می‌شود (سازگاری با نام‌گذاری بین‌کانالی)
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده دوباره استفاده کنند یا نه (پیش‌فرض: `true` وقتی streaming پیش‌نمایش فعال است)
    - مقدارهای قدیمی `channels.telegram.streamMode` و مقدارهای بولی `streaming` شناسایی می‌شوند؛ `openclaw doctor --fix` را اجرا کنید تا آن‌ها را به `channels.telegram.streaming.mode` مهاجرت دهد

    به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار همان خط‌های کوتاه «در حال کار...» هستند که هنگام اجرای ابزارها نمایش داده می‌شوند، برای نمونه اجرای فرمان، خواندن فایل، به‌روزرسانی‌های برنامه‌ریزی، یا خلاصه‌های patch. Telegram این‌ها را به‌طور پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشدهٔ OpenClaw از `v2026.4.22` و بعد از آن منطبق باشد. برای نگه داشتن پیش‌نمایش ویرایش‌شده برای متن پاسخ اما پنهان کردن خط‌های پیشرفت ابزار، تنظیم کنید:

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

    فقط زمانی از `streaming.mode: "off"` استفاده کنید که تحویل فقط نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و گفت‌وگوی عمومی ابزار/پیشرفت به‌جای ارسال به‌عنوان پیام‌های مستقل «در حال کار...» سرکوب می‌شود. اعلان‌های تأیید، payloadهای رسانه، و خطاها همچنان از مسیر تحویل نهایی معمول عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و هم‌زمان خط‌های وضعیت پیشرفت ابزار را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و در پایان همان‌جا آن را ویرایش می‌کند
    - پیش‌نمایش‌های قدیمی‌تر از حدود یک دقیقه: OpenClaw پاسخ تکمیل‌شده را به‌عنوان یک پیام نهایی تازه ارسال می‌کند و سپس پیش‌نمایش را پاک می‌کند، تا زمان‌نمای قابل مشاهده Telegram زمان تکمیل را به‌جای زمان ایجاد پیش‌نمایش نشان دهد

    برای پاسخ‌های پیچیده (برای مثال بارهای رسانه‌ای)، OpenClaw به تحویل نهایی عادی برمی‌گردد و سپس پیام پیش‌نمایش را پاک می‌کند.

    جریان‌دهی پیش‌نمایش از جریان‌دهی بلوک جدا است. وقتی جریان‌دهی بلوک به‌صراحت برای Telegram فعال شده باشد، OpenClaw جریان پیش‌نمایش را رد می‌کند تا از جریان‌دهی دوباره جلوگیری شود.

    جریان استدلال ویژه Telegram:

    - `/reasoning stream` هنگام تولید، استدلال را به پیش‌نمایش زنده می‌فرستد
    - پاسخ نهایی بدون متن استدلال ارسال می‌شود

  </Accordion>

  <Accordion title="قالب‌بندی و جایگزین HTML">
    متن خروجی از Telegram `parse_mode: "HTML"` استفاده می‌کند.

    - متن شبیه Markdown به HTML امن برای Telegram رندر می‌شود.
    - HTML خام مدل escape می‌شود تا خطاهای parse در Telegram کاهش یابد.
    - اگر Telegram HTML پردازش‌شده را رد کند، OpenClaw به‌صورت متن ساده دوباره تلاش می‌کند.

    پیش‌نمایش لینک‌ها به‌صورت پیش‌فرض فعال است و می‌توان آن را با `channels.telegram.linkPreview: false` غیرفعال کرد.

  </Accordion>

  <Accordion title="دستورهای بومی و دستورهای سفارشی">
    ثبت منوی دستور Telegram هنگام راه‌اندازی با `setMyCommands` انجام می‌شود.

    پیش‌فرض‌های دستور بومی:

    - `commands.native: "auto"` دستورهای بومی را برای Telegram فعال می‌کند

    ورودی‌های منوی دستور سفارشی را اضافه کنید:

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

    - نام‌ها نرمال می‌شوند (حذف `/` ابتدایی، حروف کوچک)
    - الگوی معتبر: `a-z`، `0-9`، `_`، طول `1..32`
    - دستورهای سفارشی نمی‌توانند دستورهای بومی را بازنویسی کنند
    - تداخل‌ها/تکراری‌ها رد و ثبت می‌شوند

    نکته‌ها:

    - دستورهای سفارشی فقط ورودی منو هستند؛ رفتار را به‌صورت خودکار پیاده‌سازی نمی‌کنند
    - دستورهای Plugin/skill همچنان می‌توانند هنگام تایپ کار کنند، حتی اگر در منوی Telegram نمایش داده نشوند

    اگر دستورهای بومی غیرفعال باشند، موارد داخلی حذف می‌شوند. دستورهای سفارشی/Plugin ممکن است در صورت پیکربندی همچنان ثبت شوند.

    خطاهای رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از کوتاه‌سازی همچنان سرریز شده است؛ دستورهای Plugin/skill/سفارشی را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - خطای `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` همراه با `404: Not Found` در حالی که دستورهای مستقیم Bot API با curl کار می‌کنند، می‌تواند یعنی `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن bot پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، پس این مورد به‌عنوان خطای پاک‌سازی Webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای شبکه/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود است.

    ### دستورهای جفت‌سازی دستگاه (`device-pair` plugin)

    وقتی `device-pair` plugin نصب شده باشد:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در برنامه iOS جای‌گذاری کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (شامل نقش/دامنه‌ها)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر را حمل می‌کند. تحویل bootstrap داخلی، توکن node اصلی را در `scopes: []` نگه می‌دارد؛ هر توکن operator تحویل‌داده‌شده در محدوده `operator.approvals`، `operator.read`، `operator.talk.secrets`، و `operator.write` باقی می‌ماند. بررسی‌های دامنه bootstrap با پیشوند نقش هستند، بنابراین آن allowlist مربوط به operator فقط درخواست‌های operator را برآورده می‌کند؛ نقش‌های غیر operator همچنان به دامنه‌هایی زیر پیشوند نقش خودشان نیاز دارند.

    اگر دستگاهی با جزئیات احراز هویت تغییرکرده دوباره تلاش کند (برای مثال نقش/دامنه‌ها/کلید عمومی)، درخواست در انتظار قبلی جایگزین می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید، `/pair pending` را دوباره اجرا کنید.

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

    کلیک‌های callback به‌صورت متن به agent داده می‌شوند:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="actionهای پیام Telegram برای agentها و automation">
    actionهای ابزار Telegram شامل موارد زیر است:

    - `sendMessage` (`to`, `content`, اختیاری `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, اختیاری `iconColor`, `iconCustomEmojiId`)

    actionهای پیام کانال aliasهای خوش‌دست ارائه می‌کنند (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    کنترل‌های gate:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌صورت پیش‌فرض فعال هستند و toggle جداگانه `channels.telegram.actions.*` ندارند.
    ارسال‌های runtime از snapshot فعال پیکربندی/secretها (راه‌اندازی/reload) استفاده می‌کنند، بنابراین مسیرهای action برای هر ارسال SecretRef را به‌صورت ad-hoc دوباره resolve نمی‌کنند.

    معناشناسی حذف reaction: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="برچسب‌های رشته‌بندی پاسخ">
    Telegram از برچسب‌های صریح رشته‌بندی پاسخ در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام محرک پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسه پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` نحوه رسیدگی را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی رشته‌بندی پاسخ فعال باشد و متن یا caption اصلی Telegram در دسترس باشد، OpenClaw به‌صورت خودکار یک excerpt نقل‌قول بومی Telegram را اضافه می‌کند. Telegram متن نقل‌قول بومی را به 1024 واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل می‌شوند و اگر Telegram نقل‌قول را رد کند، به یک پاسخ ساده برمی‌گردند.

    نکته: `off` رشته‌بندی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="موضوع‌های forum و رفتار thread">
    supergroupهای forum:

    - کلیدهای session موضوع، `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و typing موضوع thread را هدف می‌گیرند
    - مسیر پیکربندی موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالت ویژه موضوع عمومی (`threadId=1`):

    - ارسال‌های پیام `message_thread_id` را حذف می‌کنند (Telegram `sendMessage(...thread_id=1)` را رد می‌کند)
    - actionهای typing همچنان `message_thread_id` را شامل می‌شوند

    ارث‌بری موضوع: ورودی‌های موضوع تنظیمات گروه را به ارث می‌برند مگر اینکه بازنویسی شوند (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` فقط مربوط به موضوع است و از پیش‌فرض‌های گروه ارث نمی‌برد.

    **مسیریابی agent برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در پیکربندی موضوع، به agent متفاوتی route شود. این به هر موضوع workspace، memory، و session ایزوله خودش را می‌دهد. مثال:

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

    **binding پایدار موضوع ACP**: موضوع‌های forum می‌توانند sessionهای harness ACP را از طریق bindingهای ACP تایپ‌شده سطح بالا pin کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و شناسه دارای qualifier موضوع مثل `-1001234567890:topic:42`). در حال حاضر محدود به موضوع‌های forum در گروه‌ها/supergroupها است. [Agentهای ACP](/fa/tools/acp-agents) را ببینید.

    **spawn کردن ACP وابسته به thread از chat**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک session جدید ACP bind می‌کند؛ follow-upها مستقیم به همان‌جا route می‌شوند. OpenClaw تأیید spawn را داخل موضوع pin می‌کند. نیازمند `channels.telegram.threadBindings.spawnAcpSessions=true` است.

    context قالب `MessageThreadId` و `IsForum` را expose می‌کند. chatهای DM دارای `message_thread_id` مسیریابی DM را نگه می‌دارند اما از کلیدهای session آگاه از thread استفاده می‌کنند.

  </Accordion>

  <Accordion title="صدا، ویدئو، و استیکرها">
    ### پیام‌های صوتی

    Telegram بین voice noteها و فایل‌های صوتی تمایز می‌گذارد.

    - پیش‌فرض: رفتار فایل صوتی
    - برچسب `[[audio_as_voice]]` در پاسخ agent برای اجبار به ارسال voice-note
    - transcriptهای voice-note ورودی در context agent به‌عنوان متن ماشین‌تولیدشده و غیرقابل اعتماد قاب‌بندی می‌شوند؛ تشخیص mention همچنان از transcript خام استفاده می‌کند تا پیام‌های صوتی mention-gated به کار ادامه دهند.

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

    ### پیام‌های ویدئویی

    Telegram بین فایل‌های ویدئویی و video noteها تمایز می‌گذارد.

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

    Video noteها از caption پشتیبانی نمی‌کنند؛ متن پیام ارائه‌شده جداگانه ارسال می‌شود.

    ### استیکرها

    رسیدگی به استیکر ورودی:

    - WEBP ثابت: دانلود و پردازش می‌شود (placeholder `<media:sticker>`)
    - TGS متحرک: رد می‌شود
    - WEBM ویدئویی: رد می‌شود

    فیلدهای context استیکر:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    فایل cache استیکر:

    - `~/.openclaw/telegram/sticker-cache.json`

    استیکرها یک‌بار (در صورت امکان) توصیف و cache می‌شوند تا فراخوانی‌های vision تکراری کاهش یابد.

    actionهای استیکر را فعال کنید:

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

    action ارسال استیکر:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    جست‌وجوی استیکرهای cacheشده:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="اعلان‌های reaction">
    reactionهای Telegram به‌صورت updateهای `message_reaction` دریافت می‌شوند (جدا از payloadهای پیام).

    وقتی فعال باشد، OpenClaw رویدادهای سیستمی مانند موارد زیر را enqueue می‌کند:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکته‌ها:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط ربات (بهترین تلاش از طریق کش پیام‌های ارسال‌شده).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)؛ فرستنده‌های غیرمجاز حذف می‌شوند.
    - Telegram در به‌روزرسانی‌های واکنش، شناسهٔ رشته ارائه نمی‌کند.
      - گروه‌های غیرانجمنی به نشست چت گروه هدایت می‌شوند
      - گروه‌های انجمنی به نشست موضوع عمومی گروه (`:topic:1`) هدایت می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌طور خودکار شامل `message_reaction` است.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw، یک ایموجی تأیید ارسال می‌کند.

    ترتیب حل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Telegram انتظار ایموجی unicode دارد (برای مثال "👀").
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی کانال به‌طور پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های فعال‌شده توسط Telegram شامل موارد زیر است:

    - رویدادهای مهاجرت گروه (`migrate_to_chat_id`) برای به‌روزرسانی `channels.telegram.groups`
    - `/config set` و `/config unset` (نیازمند فعال بودن فرمان)

    غیرفعال کردن:

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

    شنوندهٔ محلی به `127.0.0.1:8787` متصل می‌شود. برای ورودی عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا آگاهانه `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook پیش از بازگرداندن `200` به Telegram، نگهبان‌های درخواست، توکن محرمانهٔ Telegram و بدنهٔ JSON را اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان مسیرهای ربات برای هر چت/هر موضوع که در long polling استفاده می‌شود پردازش می‌کند، بنابراین نوبت‌های کند عامل، ACK تحویل Telegram را نگه نمی‌دارند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش دوباره، و هدف‌های CLI">
    - مقدار پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خط‌های خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازهٔ رسانهٔ ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.timeoutSeconds` مهلت زمانی کلاینت API Telegram را بازنویسی می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های ربات long-polling مقدارهای پیکربندی‌شده کمتر از نگهبان درخواست 45 ثانیه‌ای `getUpdates` را محدود می‌کنند تا pollهای بیکار پیش از تکمیل پنجرهٔ poll سی‌ثانیه‌ای لغو نشوند.
    - مقدار پیش‌فرض `channels.telegram.pollingStallThresholdMs` برابر `120000` است؛ فقط برای راه‌اندازی‌های دوبارهٔ مثبت کاذب توقف polling، آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچهٔ بافت گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` استفاده می‌کند (پیش‌فرض 50)؛ `0` غیرفعال می‌کند.
    - بافت تکمیلی پاسخ/نقل‌قول/بازارسال در حال حاضر همان‌طور که دریافت شده منتقل می‌شود.
    - allowlistهای Telegram عمدتاً کنترل می‌کنند چه کسی می‌تواند عامل را فعال کند، نه یک مرز کامل حذف بافت تکمیلی.
    - کنترل‌های تاریخچهٔ DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای قابل بازیابی API خروجی، روی کمک‌کننده‌های ارسال Telegram (CLI/ابزارها/کنش‌ها) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای خرابی‌های پیش‌اتصال Telegram از یک تلاش دوبارهٔ محدود safe-send استفاده می‌کند، اما envelopeهای شبکه‌ای مبهم پس از ارسال را که می‌توانند پیام‌های قابل مشاهده را تکراری کنند دوباره تلاش نمی‌کند.

    هدف ارسال CLI می‌تواند شناسهٔ عددی چت یا نام کاربری باشد:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    pollهای Telegram از `openclaw message poll` استفاده می‌کنند و از موضوع‌های انجمن پشتیبانی می‌کنند:

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
    - `--thread-id` برای موضوع‌های انجمن (یا از یک هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین پشتیبانی می‌کند از:

    - `--presentation` با بلوک‌های `buttons` برای صفحه‌کلیدهای inline وقتی `channels.telegram.capabilities.inlineButtons` اجازه دهد
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل سنجاق‌شده وقتی ربات بتواند در آن چت سنجاق کند
    - `--force-document` برای ارسال تصویرها و GIFهای خروجی به‌صورت سند به‌جای بارگذاری‌های عکس فشرده یا رسانهٔ متحرک

    محدودسازی کنش:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ایجاد poll در Telegram را غیرفعال می‌کند، در حالی که ارسال‌های معمولی همچنان فعال می‌مانند

  </Accordion>

  <Accordion title="تأییدهای exec در Telegram">
    Telegram از تأییدهای exec در DMهای تأییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری اعلان‌ها را در چت یا موضوع مبدأ منتشر کند. تأییدکننده‌ها باید شناسهٔ عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی دست‌کم یک تأییدکننده قابل حل باشد، به‌طور خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی مالک از `commands.ownerAllowFrom` برمی‌گردد)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom` و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با ربات صحبت کند و ربات پاسخ‌های عادی را کجا بفرستد. آن‌ها کسی را به تأییدکنندهٔ exec تبدیل نمی‌کنند. نخستین جفت‌سازی DM تأییدشده، وقتی هنوز هیچ مالک فرمانی وجود ندارد، `commands.ownerAllowFrom` را bootstrap می‌کند، بنابراین راه‌اندازی تک‌مالک همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانال متن فرمان را در چت نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/موضوع‌های مورد اعتماد فعال کنید. وقتی اعلان در یک موضوع انجمن قرار می‌گیرد، OpenClaw موضوع را برای اعلان تأیید و پیگیری حفظ می‌کند. تأییدهای exec به‌طور پیش‌فرض پس از 30 دقیقه منقضی می‌شوند.

    دکمه‌های تأیید inline نیز نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group` یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدهای plugin حل می‌شوند؛ بقیه ابتدا از طریق تأییدهای exec حل می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی عامل با خطای تحویل یا ارائه‌دهنده روبه‌رو می‌شود، Telegram می‌تواند یا با متن خطا پاسخ دهد یا آن را سرکوب کند. دو کلید پیکربندی این رفتار را کنترل می‌کنند:

| کلید                                | مقدارها           | پیش‌فرض | توضیح                                                                                          |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` یک پیام خطای دوستانه به چت می‌فرستد. `silent` پاسخ‌های خطا را کاملاً سرکوب می‌کند.     |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | حداقل زمان بین پاسخ‌های خطا به همان چت. از هرزپراکنی خطا هنگام قطعی‌ها جلوگیری می‌کند.        |

بازنویسی‌های برای هر حساب، هر گروه، و هر موضوع پشتیبانی می‌شوند (همان وراثت کلیدهای پیکربندی دیگر Telegram).

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
      - سپس ربات را از گروه حذف و دوباره اضافه کنید
    - وقتی پیکربندی انتظار پیام‌های گروهی بدون mention را داشته باشد، `openclaw channels status` هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ عضویت wildcard `"*"` قابل probe نیست.
    - آزمون سریع نشست: `/activation always`.

  </Accordion>

  <Accordion title="ربات اصلاً پیام‌های گروه را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا شامل `"*"` باشد)
    - عضویت ربات در گروه را بررسی کنید
    - لاگ‌ها را بازبینی کنید: `openclaw logs --follow` برای دلیل‌های رد شدن

  </Accordion>

  <Accordion title="فرمان‌ها تا حدی کار می‌کنند یا اصلاً کار نمی‌کنند">

    - هویت فرستندهٔ خود را مجاز کنید (جفت‌سازی و/یا `allowFrom` عددی)
    - مجوزدهی فرمان حتی وقتی سیاست گروه `open` باشد همچنان اعمال می‌شود
    - `setMyCommands failed` با `BOT_COMMANDS_TOO_MUCH` یعنی منوی بومی ورودی‌های خیلی زیادی دارد؛ فرمان‌های plugin/skill/سفارشی را کاهش دهید یا منوهای بومی را غیرفعال کنید
    - فراخوانی‌های راه‌اندازی `deleteMyCommands` / `setMyCommands` محدود هستند و هنگام مهلت زمانی درخواست، یک‌بار از طریق fallback انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار شبکه/fetch معمولاً نشان‌دهندهٔ مشکلات دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="راه‌اندازی توکن غیرمجاز گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای توکن پیکربندی‌شدهٔ ربات است.
    - توکن ربات را در BotFather دوباره کپی یا بازتولید کنید، سپس برای حساب پیش‌فرض `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken`، یا `TELEGRAM_BOT_TOKEN` را به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام راه‌اندازی نیز شکست احراز هویت است؛ برخورد با آن به‌عنوان «هیچ webhookای وجود ندارد» فقط همان شکست توکن بد را به فراخوانی‌های بعدی API موکول می‌کند.
    - اگر `deleteWebhook` هنگام راه‌اندازی polling با خطای گذرای شبکه شکست بخورد، OpenClaw `getWebhookInfo` را بررسی می‌کند؛ وقتی Telegram یک URL خالی webhook گزارش کند، polling ادامه می‌یابد چون پاک‌سازی از قبل برآورده شده است.

  </Accordion>

  <Accordion title="ناپایداری polling یا شبکه">

    - Node 22+ و fetch/proxy سفارشی می‌توانند در صورت ناسازگاری نوع‌های AbortSignal، رفتار لغو فوری را فعال کنند.
    - برخی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 resolve می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث خطاهای متناوب Telegram API شود.
    - اگر logها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این موارد را به‌عنوان خطاهای شبکه قابل بازیابی دوباره تلاش می‌کند.
    - اگر socketهای Telegram با یک آهنگ ثابت کوتاه بازیافت می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ bot clientهای long-polling مقدارهای پیکربندی‌شده پایین‌تر از guard درخواست `getUpdates` را محدود می‌کنند، اما نسخه‌های قدیمی‌تر وقتی این مقدار پایین‌تر از timeout مربوط به long-poll تنظیم می‌شد، می‌توانستند هر poll را لغو کنند.
    - اگر logها شامل `Polling stall detected` باشند، OpenClaw به‌صورت پیش‌فرض پس از ۱۲۰ ثانیه بدون کامل‌شدن liveness مربوط به long-poll، polling را دوباره راه‌اندازی می‌کند و transport تلگرام را دوباره می‌سازد.
    - `openclaw channels status --probe` و `openclaw doctor` وقتی یک حساب polling در حال اجرا پس از مهلت startup، `getUpdates` را کامل نکرده باشد، وقتی یک حساب webhook در حال اجرا پس از مهلت startup، `setWebhook` را کامل نکرده باشد، یا وقتی آخرین فعالیت موفق transport مربوط به polling قدیمی شده باشد، هشدار می‌دهند.
    - فقط زمانی `channels.telegram.pollingStallThresholdMs` را افزایش دهید که فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما میزبان شما همچنان restartهای کاذب polling-stall گزارش می‌کند. stallهای پایدار معمولا به مشکلات proxy، DNS، IPv6 یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین envهای proxy فرایند را برای transport مربوط به Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و گونه‌های حروف کوچک آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌توانند `api.telegram.org` را دور بزنند.
    - اگر proxy مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای یک محیط service پیکربندی شده باشد و env استاندارد proxy وجود نداشته باشد، Telegram از همان URL برای transport مربوط به Bot API نیز استفاده می‌کند.
    - در میزبان‌های VPS با خروجی مستقیم/TLS ناپایدار، فراخوانی‌های Telegram API را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌صورت پیش‌فرض از `autoSelectFamily=true` (به‌جز WSL2) و `dnsResultOrder=ipv4first` استفاده می‌کند.
    - اگر میزبان شما WSL2 است یا به‌صراحت با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب family را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های benchmark-range مربوط به RFC 2544 (`198.18.0.0/15`) از قبل به‌صورت پیش‌فرض
      برای دانلودهای رسانه‌ای Telegram مجاز هستند. اگر یک fake-IP قابل اعتماد یا
      proxy شفاف، `api.telegram.org` را هنگام دانلود رسانه به یک نشانی
      private/internal/special-use دیگر بازنویسی می‌کند، می‌توانید bypass فقط مخصوص Telegram را
      فعال کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین opt-in به‌ازای هر حساب نیز در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر proxy شما میزبان‌های رسانه‌ای Telegram را به `198.18.x.x` resolve می‌کند، ابتدا
      flag خطرناک را خاموش نگه دارید. رسانه Telegram از قبل به‌صورت پیش‌فرض محدوده
      benchmark مربوط به RFC 2544 را مجاز می‌داند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانه
      Telegram را ضعیف می‌کند. فقط در محیط‌های proxy قابل اعتماد و تحت کنترل operator
      مانند مسیریابی fake-IP در Clash، Mihomo یا Surge، وقتی پاسخ‌های private یا special-use
      خارج از محدوده benchmark مربوط به RFC 2544 تولید می‌کنند، از آن استفاده کنید.
      برای دسترسی معمول Telegram از اینترنت عمومی، آن را خاموش نگه دارید.
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

- راه‌اندازی/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` باید به یک فایل معمولی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- تأییدهای exec: `execApprovals`, `accounts.*.execApprovals`
- فرمان/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threadها/replyها: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- رسانه/network: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ `/bot<TOKEN>` را وارد نکنید)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actionها/capabilityها: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- واکنش‌ها: `reactionNotifications`, `reactionLevel`
- خطاها: `errorPolicy`, `errorCooldownMs`
- نوشتن‌ها/history: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند account ID پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را شامل کنید) تا routing پیش‌فرض صریح شود. در غیر این صورت OpenClaw به اولین account ID نرمال‌شده fallback می‌کند و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقدارهای `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را با gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار allowlist گروه و topic.
  </Card>
  <Card title="routing کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به agentها route کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و مقاوم‌سازی.
  </Card>
  <Card title="routing چند-agent" icon="sitemap" href="/fa/concepts/multi-agent">
    گروه‌ها و topicها را به agentها map کنید.
  </Card>
  <Card title="عیب‌یابی" icon="wrench" href="/fa/channels/troubleshooting">
    diagnostics بین‌کانالی.
  </Card>
</CardGroup>

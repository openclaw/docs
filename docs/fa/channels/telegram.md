---
read_when:
    - کار روی قابلیت‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-29T22:29:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ffc0c1a6bb94fbab81ede0f08b0e3a165f06c599d4d06d4b9e70c8ba41121f7
    source_path: channels/telegram.md
    workflow: 16
---

آمادهٔ استفادهٔ production برای DMهای ربات و گروه‌ها از طریق grammY. حالت پیش‌فرض، long polling است؛ حالت webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض DM برای Telegram جفت‌سازی است.
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
  <Step title="توکن ربات را در BotFather بسازید">
    Telegram را باز کنید و با **@BotFather** گفتگو کنید (مطمئن شوید handle دقیقاً `@BotFather` است).

    `/newbot` را اجرا کنید، اعلان‌ها را دنبال کنید، و توکن را ذخیره کنید.

  </Step>

  <Step title="توکن و سیاست DM را پیکربندی کنید">

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
    Telegram از `openclaw channels login telegram` استفاده **نمی‌کند**؛ توکن را در config/env پیکربندی کنید، سپس gateway را راه‌اندازی کنید.

  </Step>

  <Step title="Gateway را راه‌اندازی کنید و نخستین DM را تأیید کنید">

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
ترتیب تشخیص توکن، حساب‌آگاه است. در عمل، مقادیر config بر جایگزین env اولویت دارند، و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و دیده‌شدن گروه">
    ربات‌های Telegram به‌طور پیش‌فرض از **Privacy Mode** استفاده می‌کنند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر ربات باید همهٔ پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را با `/setprivacy` غیرفعال کنید، یا
    - ربات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، ربات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت مدیر در تنظیمات گروه Telegram کنترل می‌شود.

    ربات‌های مدیر همهٔ پیام‌های گروه را دریافت می‌کنند، که برای رفتار گروهی همیشه‌فعال مفید است.

  </Accordion>

  <Accordion title="کلیدهای BotFather مفید">

    - `/setjoingroups` برای اجازه/رد کردن افزودن به گروه‌ها
    - `/setprivacy` برای رفتار دیده‌شدن در گروه

  </Accordion>
</AccordionGroup>

## کنترل دسترسی و فعال‌سازی

<Tabs>
  <Tab title="سیاست DM">
    `channels.telegram.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (به حداقل یک شناسهٔ فرستنده در `allowFrom` نیاز دارد)
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` به هر حساب Telegram که نام کاربری ربات را پیدا یا حدس بزند اجازه می‌دهد به ربات فرمان بدهد. فقط برای ربات‌های عمداً عمومی با ابزارهای بسیار محدود از آن استفاده کنید؛ ربات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربر Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در پیکربندی‌های چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های `allowFrom: ["*"]` در سطح حساب، آن حساب را عمومی نمی‌کنند مگر اینکه allowlist مؤثر حساب پس از ادغام هنوز شامل یک wildcard صریح باشد.
    `dmPolicy: "allowlist"` با `allowFrom` خالی همهٔ DMها را مسدود می‌کند و توسط اعتبارسنجی config رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند.
    اگر ارتقا داده‌اید و config شما شامل ورودی‌های allowlist از نوع `@username` است، `openclaw doctor --fix` را اجرا کنید تا آن‌ها را resolve کند (best-effort؛ به توکن ربات Telegram نیاز دارد).
    اگر قبلاً به فایل‌های allowlist در pairing-store متکی بودید، `openclaw doctor --fix` می‌تواند در جریان‌های allowlist ورودی‌ها را به `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز شناسهٔ صریحی ندارد).

    برای ربات‌های تک‌مالک، `dmPolicy: "allowlist"` را همراه با شناسه‌های عددی صریح `allowFrom` ترجیح دهید تا سیاست دسترسی در config پایدار بماند (به‌جای وابستگی به تأییدهای جفت‌سازی قبلی).

    سردرگمی رایج: تأیید جفت‌سازی DM به معنی «این فرستنده همه‌جا مجاز است» نیست.
    جفت‌سازی دسترسی DM می‌دهد. اگر هنوز مالک فرمانی وجود نداشته باشد، نخستین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط‌مالک و تأییدهای exec یک حساب اپراتور صریح داشته باشند.
    مجوز فرستنده در گروه همچنان از allowlistهای صریح config می‌آید.
    اگر می‌خواهید «یک بار مجاز شوم و هم DMها و هم فرمان‌های گروهی کار کنند»، شناسهٔ عددی کاربر Telegram خود را در `channels.telegram.allowFrom` قرار دهید؛ برای فرمان‌های فقط‌مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### پیدا کردن شناسهٔ کاربر Telegram شما

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
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسهٔ گروه را بگذراند
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها تا زمانی که ورودی‌های `groups` (یا `"*"`) را اضافه کنید مسدود می‌مانند
       - `groups` پیکربندی شده: مثل allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر فرستندهٔ گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` fallback می‌کند.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربر Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های گفتگوی گروه یا supergroup در Telegram را در `groupAllowFrom` قرار ندهید. شناسه‌های منفی گفتگو باید زیر `channels.telegram.groups` باشند.
    ورودی‌های غیرعددی برای مجوز فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز هویت فرستندهٔ گروه تأییدهای DM در pairing-store را به ارث **نمی‌برد**.
    جفت‌سازی فقط برای DM باقی می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` در سطح هر گروه/هر موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به `allowFrom` در config fallback می‌کند، نه pairing store.
    الگوی عملی برای ربات‌های تک‌مالک: شناسهٔ کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکتهٔ runtime: اگر `channels.telegram` کاملاً وجود نداشته باشد، پیش‌فرض‌های runtime به‌صورت fail-closed روی `groupPolicy="allowlist"` قرار می‌گیرند مگر اینکه `channels.defaults.groupPolicy` صریحاً تنظیم شده باشد.

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

    مثال: اجازه فقط به کاربران مشخص درون یک گروه مشخص:

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

      - شناسه‌های منفی گروه یا supergroup در Telegram مانند `-1001234567890` را زیر `channels.telegram.groups` قرار دهید.
      - وقتی می‌خواهید محدود کنید کدام افراد درون یک گروه مجاز می‌توانند ربات را trigger کنند، شناسه‌های کاربر Telegram مانند `8734062810` را زیر `groupAllowFrom` قرار دهید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با ربات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="رفتار mention">
    پاسخ‌های گروهی به‌طور پیش‌فرض به mention نیاز دارند.

    mention می‌تواند از این‌ها بیاید:

    - mention بومی `@botusername`، یا
    - الگوهای mention در:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    کلیدهای فرمان در سطح session:

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

    دریافت شناسهٔ گفتگوی گروه:

    - یک پیام گروه را به `@userinfobot` / `@getidsbot` فوروارد کنید
    - یا `chat.id` را از `openclaw logs --follow` بخوانید
    - یا Bot API `getUpdates` را بررسی کنید

  </Tab>
</Tabs>

## رفتار runtime

- Telegram تحت مالکیت فرایند gateway است.
- مسیریابی قطعی است: ورودی Telegram به Telegram پاسخ می‌دهد (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به envelope مشترک کانال با metadata پاسخ و placeholderهای رسانه نرمال‌سازی می‌شوند.
- sessionهای گروه با شناسهٔ گروه ایزوله می‌شوند. موضوع‌های انجمن `:topic:<threadId>` را اضافه می‌کنند تا موضوع‌ها ایزوله بمانند.
- پیام‌های DM می‌توانند `message_thread_id` داشته باشند؛ OpenClaw آن‌ها را با کلیدهای session آگاه از thread مسیریابی می‌کند و شناسهٔ thread را برای پاسخ‌ها حفظ می‌کند.
- Long polling از grammY runner با ترتیب‌دهی per-chat/per-thread استفاده می‌کند. هم‌زمانی کلی runner sink از `agents.defaults.maxConcurrent` استفاده می‌کند.
- Long polling درون هر فرایند gateway محافظت می‌شود تا هر بار فقط یک poller فعال بتواند از یک توکن ربات استفاده کند. اگر هنوز conflictهای `getUpdates` 409 می‌بینید، احتمالاً یک OpenClaw gateway، اسکریپت، یا poller خارجی دیگر از همان توکن استفاده می‌کند.
- watchdog مربوط به long-polling به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون liveness کامل‌شدهٔ `getUpdates` restart را trigger می‌کند. فقط اگر deployment شما هنوز هنگام کارهای طولانی false polling-stall restart می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ overrideهای per-account پشتیبانی می‌شوند.
- Telegram Bot API از read-receipt پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="پیش‌نمایش live stream (ویرایش پیام)">
    OpenClaw می‌تواند پاسخ‌های جزئی را به‌صورت real time stream کند:

    - گفتگوهای مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/موضوع‌ها: پیام پیش‌نمایش + `editMessageText`

    الزام:

    - `channels.telegram.streaming` برابر `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - `progress` در Telegram به `partial` map می‌شود (سازگاری با نام‌گذاری بین‌کانالی)
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده دوباره استفاده کنند یا نه (پیش‌فرض: وقتی preview streaming فعال است `true`)
    - مقادیر legacy `channels.telegram.streamMode` و boolean `streaming` شناسایی می‌شوند؛ `openclaw doctor --fix` را اجرا کنید تا آن‌ها را به `channels.telegram.streaming.mode` migrate کند

    به‌روزرسانی‌های پیش‌نمایش tool-progress همان خط‌های کوتاه «در حال کار...» هستند که هنگام اجرای ابزارها نشان داده می‌شوند، برای مثال اجرای فرمان، خواندن فایل، به‌روزرسانی‌های برنامه‌ریزی، یا خلاصه‌های patch. Telegram این‌ها را به‌طور پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشدهٔ OpenClaw از `v2026.4.22` و بعد از آن هماهنگ باشد. برای نگه داشتن پیش‌نمایش ویرایش‌شده برای متن پاسخ اما پنهان کردن خط‌های tool-progress، تنظیم کنید:

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

    فقط وقتی از `streaming.mode: "off"` استفاده کنید که تحویل فقط نهایی را می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و گفتگوی عمومی ابزار/پیشرفت به‌جای ارسال به‌عنوان پیام‌های مستقل «در حال کار...» سرکوب می‌شود. اعلان‌های تأیید، payloadهای رسانه، و خطاها همچنان از مسیر تحویل نهایی عادی عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و در عین حال خط‌های وضعیت tool-progress را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    برای پاسخ‌های فقط‌متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/topic: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و در پایان همان را درجا ویرایش می‌کند
    - پیش‌نمایش‌های قدیمی‌تر از حدود یک دقیقه: OpenClaw پاسخ کامل‌شده را به‌عنوان یک پیام نهایی تازه می‌فرستد و سپس پیش‌نمایش را پاک می‌کند، تا زمان‌نمای قابل‌مشاهده Telegram به‌جای زمان ایجاد پیش‌نمایش، زمان تکمیل را نشان دهد

    برای پاسخ‌های پیچیده (برای مثال payloadهای رسانه‌ای)، OpenClaw به تحویل نهایی معمولی برمی‌گردد و سپس پیام پیش‌نمایش را پاک می‌کند.

    استریم پیش‌نمایش از استریم بلوک جداست. وقتی استریم بلوک به‌طور صریح برای Telegram فعال شده باشد، OpenClaw برای جلوگیری از دوبار استریم‌کردن، استریم پیش‌نمایش را رد می‌کند.

    اگر انتقال draft بومی در دسترس نباشد/رد شود، OpenClaw به‌طور خودکار به `sendMessage` + `editMessageText` برمی‌گردد.

    استریم reasoning فقط برای Telegram:

    - `/reasoning stream` هنگام تولید، reasoning را به پیش‌نمایش زنده می‌فرستد
    - پاسخ نهایی بدون متن reasoning ارسال می‌شود

  </Accordion>

  <Accordion title="قالب‌بندی و fallback HTML">
    متن خروجی از Telegram `parse_mode: "HTML"` استفاده می‌کند.

    - متن شبیه Markdown به HTML ایمن برای Telegram رندر می‌شود.
    - HTML خام مدل escape می‌شود تا خطاهای parse در Telegram کاهش یابد.
    - اگر Telegram، HTML پردازش‌شده را رد کند، OpenClaw دوباره به‌صورت متن ساده تلاش می‌کند.

    پیش‌نمایش لینک‌ها به‌صورت پیش‌فرض فعال است و می‌توان آن را با `channels.telegram.linkPreview: false` غیرفعال کرد.

  </Accordion>

  <Accordion title="دستورهای بومی و دستورهای سفارشی">
    ثبت منوی دستور Telegram هنگام راه‌اندازی با `setMyCommands` انجام می‌شود.

    پیش‌فرض‌های دستور بومی:

    - `commands.native: "auto"` دستورهای بومی را برای Telegram فعال می‌کند

    افزودن ورودی‌های سفارشی به منوی دستور:

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
    - دستورهای سفارشی نمی‌توانند دستورهای بومی را override کنند
    - تداخل‌ها/تکراری‌ها رد و لاگ می‌شوند

    نکته‌ها:

    - دستورهای سفارشی فقط ورودی‌های منو هستند؛ رفتار را خودکار پیاده‌سازی نمی‌کنند
    - دستورهای plugin/skill حتی اگر در منوی Telegram نشان داده نشوند، همچنان می‌توانند هنگام تایپ‌شدن کار کنند

    اگر دستورهای بومی غیرفعال باشند، موارد داخلی حذف می‌شوند. دستورهای سفارشی/plugin اگر پیکربندی شده باشند همچنان ممکن است ثبت شوند.

    خطاهای رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram حتی پس از کوتاه‌سازی هم سرریز شده است؛ تعداد دستورهای plugin/skill/سفارشی را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - خطای `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` همراه با `404: Not Found` درحالی‌که دستورهای مستقیم curl برای Bot API کار می‌کنند، می‌تواند یعنی `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن bot پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان خطای پاک‌سازی webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای network/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود است.

    ### دستورهای جفت‌سازی دستگاه (plugin `device-pair`)

    وقتی plugin `device-pair` نصب باشد:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در اپ iOS جای‌گذاری کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (از جمله role/scopes)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر را حمل می‌کند. handoff داخلی bootstrap، توکن primary node را روی `scopes: []` نگه می‌دارد؛ هر توکن operator واگذارشده محدود به `operator.approvals`، `operator.read`، `operator.talk.secrets`، و `operator.write` می‌ماند. بررسی‌های scope مربوط به bootstrap با پیشوند role انجام می‌شوند، بنابراین allowlist مربوط به operator فقط درخواست‌های operator را برآورده می‌کند؛ roleهای غیر-operator همچنان به scopeهای زیر پیشوند role خودشان نیاز دارند.

    اگر دستگاهی با جزئیات auth تغییرکرده دوباره تلاش کند (برای مثال role/scopes/کلید عمومی)، درخواست در انتظار قبلی جایگزین می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید، دوباره `/pair pending` را اجرا کنید.

    جزئیات بیشتر: [جفت‌سازی](/fa/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="دکمه‌های inline">
    scope صفحه‌کلید inline را پیکربندی کنید:

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

    کلیک‌های callback به‌صورت متن به agent داده می‌شوند:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="actionهای پیام Telegram برای agentها و خودکارسازی">
    actionهای tool در Telegram شامل این موارد هستند:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    actionهای پیام کانال aliasهای خوش‌دست ارائه می‌کنند (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    کنترل‌های gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌صورت پیش‌فرض فعال هستند و toggleهای جداگانه `channels.telegram.actions.*` ندارند.
    ارسال‌های زمان اجرا از snapshot فعال config/secrets (startup/reload) استفاده می‌کنند، بنابراین مسیرهای action برای هر ارسال، باز-حل‌کردن موردی SecretRef انجام نمی‌دهند.

    معنای حذف reaction: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="تگ‌های threading پاسخ">
    Telegram از تگ‌های threading پاسخ صریح در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام triggerکننده پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک ID پیام مشخص در Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` مدیریت را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی threading پاسخ فعال باشد و متن یا caption اصلی Telegram در دسترس باشد، OpenClaw به‌طور خودکار یک excerpt quote بومی Telegram اضافه می‌کند. Telegram متن quote بومی را به 1024 code unit در UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا quote می‌شوند و اگر Telegram quote را رد کند، به پاسخ ساده برمی‌گردند.

    نکته: `off`، threading پاسخ ضمنی را غیرفعال می‌کند. تگ‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="topicهای forum و رفتار thread">
    supergroupهای forum:

    - کلیدهای session مربوط به topic، `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و typing به thread مربوط به topic هدف‌گیری می‌شوند
    - مسیر config مربوط به topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالت خاص topic عمومی (`threadId=1`):

    - ارسال‌های پیام `message_thread_id` را حذف می‌کنند (Telegram، `sendMessage(...thread_id=1)` را رد می‌کند)
    - actionهای typing همچنان `message_thread_id` را شامل می‌شوند

    وراثت topic: ورودی‌های topic تنظیمات گروه را به ارث می‌برند مگر اینکه override شده باشند (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` فقط مخصوص topic است و از پیش‌فرض‌های گروه به ارث نمی‌رسد.

    **مسیریابی agent برای هر topic**: هر topic می‌تواند با تنظیم `agentId` در config همان topic به agent متفاوتی route شود. این کار برای هر topic فضای کاری، حافظه، و session ایزوله خودش را فراهم می‌کند. مثال:

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

    **اتصال ماندگار topic در ACP**: topicهای forum می‌توانند sessionهای ACP harness را از طریق bindingهای ACP تایپ‌شده در سطح بالا pin کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و id واجد topic مانند `-1001234567890:topic:42`). در حال حاضر به topicهای forum در گروه‌ها/supergroupها محدود است. [ACP Agents](/fa/tools/acp-agents) را ببینید.

    **spawn کردن ACP وابسته به thread از chat**: `/acp spawn <agent> --thread here|auto`، topic فعلی را به یک session جدید ACP متصل می‌کند؛ follow-upها مستقیماً به همان‌جا route می‌شوند. OpenClaw تأیید spawn را داخل topic pin می‌کند. به `channels.telegram.threadBindings.spawnAcpSessions=true` نیاز دارد.

    context قالب، `MessageThreadId` و `IsForum` را expose می‌کند. chatهای DM با `message_thread_id` مسیریابی DM را نگه می‌دارند اما از کلیدهای session آگاه به thread استفاده می‌کنند.

  </Accordion>

  <Accordion title="صدا، ویدیو، و stickerها">
    ### پیام‌های صوتی

    Telegram بین voice note و فایل صوتی تمایز می‌گذارد.

    - پیش‌فرض: رفتار فایل صوتی
    - تگ `[[audio_as_voice]]` در پاسخ agent برای اجبار به ارسال به‌صورت voice-note
    - transcriptهای voice-note ورودی در context مربوط به agent به‌عنوان متن تولیدشده توسط ماشین و نامطمئن قاب‌بندی می‌شوند؛ تشخیص mention همچنان از transcript خام استفاده می‌کند، بنابراین پیام‌های صوتی mention-gated به کار خود ادامه می‌دهند.

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

    Telegram بین فایل‌های ویدیویی و video noteها تمایز می‌گذارد.

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

    ### Stickerها

    مدیریت sticker ورودی:

    - WEBP ایستا: دانلود و پردازش می‌شود (placeholder `<media:sticker>`)
    - TGS متحرک: رد می‌شود
    - WEBM ویدیویی: رد می‌شود

    فیلدهای context مربوط به sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    فایل cache مربوط به sticker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stickerها یک‌بار (در صورت امکان) توصیف و cache می‌شوند تا فراخوانی‌های vision تکراری کاهش یابد.

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

    action ارسال sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    جست‌وجوی stickerهای cache‌شده:

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
    reactionهای Telegram به‌صورت به‌روزرسانی‌های `message_reaction` می‌رسند (جدا از payloadهای پیام).

    وقتی فعال باشد، OpenClaw رویدادهای system مانند این‌ها را enqueue می‌کند:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکته‌ها:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط بات (به‌صورت best-effort از طریق کش پیام‌های ارسال‌شده).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ فرستنده‌های غیرمجاز حذف می‌شوند.
    - Telegram در به‌روزرسانی‌های واکنش، شناسه thread ارائه نمی‌کند.
      - گروه‌های غیر forum به نشست گفت‌وگوی گروه هدایت می‌شوند
      - گروه‌های forum به نشست موضوع عمومی گروه (`:topic:1`) هدایت می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌صورت خودکار شامل `message_reaction` می‌شود.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` هنگامی که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید می‌فرستد.

    ترتیب تشخیص:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکته‌ها:

    - Telegram انتظار ایموجی unicode دارد (برای مثال "👀").
    - برای غیرفعال‌کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی کانال به‌صورت پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های برانگیخته‌شده توسط Telegram شامل موارد زیر است:

    - رویدادهای مهاجرت گروه (`migrate_to_chat_id`) برای به‌روزرسانی `channels.telegram.groups`
    - `/config set` و `/config unset` (به فعال‌بودن فرمان نیاز دارد)

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
    پیش‌فرض، long polling است. برای حالت webhook، `channels.telegram.webhookUrl` و `channels.telegram.webhookSecret` را تنظیم کنید؛ `webhookPath`، `webhookHost`، `webhookPort` اختیاری هستند (پیش‌فرض‌ها `/telegram-webhook`، `127.0.0.1`، `8787`).

    شنونده محلی به `127.0.0.1:8787` متصل می‌شود. برای ورودی عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا آگاهانه `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook قبل از برگرداندن `200` به Telegram، محافظ‌های درخواست، توکن محرمانه Telegram و بدنه JSON را اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان مسیرهای باتِ هر گفت‌وگو/هر موضوع که در long polling استفاده می‌شوند پردازش می‌کند، بنابراین نوبت‌های کند عامل، ACK تحویل Telegram را معطل نمی‌کنند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش دوباره، و هدف‌های CLI">
    - پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خطوط خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازه رسانه ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.timeoutSeconds` مهلت زمانی کلاینت Telegram API را بازنویسی می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود).
    - `channels.telegram.pollingStallThresholdMs` به‌صورت پیش‌فرض `120000` است؛ فقط برای راه‌اندازی دوباره‌های کاذب polling-stall آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچه زمینه گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` استفاده می‌کند (پیش‌فرض 50)؛ `0` آن را غیرفعال می‌کند.
    - زمینه تکمیلی reply/quote/forward در حال حاضر همان‌طور که دریافت می‌شود ارسال می‌شود.
    - allowlistهای Telegram عمدتاً تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند، نه یک مرز کامل حذف زمینه تکمیلی.
    - کنترل‌های تاریخچه DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای قابل‌بازیابی API خروجی، روی کمک‌کننده‌های ارسال Telegram (CLI/tools/actions) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای خرابی‌های پیش از اتصال Telegram از یک safe-send retry محدود استفاده می‌کند، اما envelopeهای شبکه مبهم پس از ارسال را که می‌توانند پیام‌های قابل‌مشاهده را تکراری کنند دوباره امتحان نمی‌کند.

    هدف ارسال CLI می‌تواند شناسه عددی گفت‌وگو یا نام کاربری باشد:

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

    پرچم‌های poll مختص Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` برای موضوع‌های forum (یا از هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین پشتیبانی می‌کند از:

    - `--presentation` همراه با بلوک‌های `buttons` برای صفحه‌کلیدهای inline، وقتی `channels.telegram.capabilities.inlineButtons` اجازه دهد
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل pin‌شده، وقتی بات بتواند در آن گفت‌وگو pin کند
    - `--force-document` برای ارسال تصاویر و GIFهای خروجی به‌صورت سند، به‌جای بارگذاری‌های عکس فشرده یا رسانه متحرک

    کنترل action:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها، را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ساخت poll در Telegram را غیرفعال می‌کند و ارسال‌های معمول را فعال نگه می‌دارد

  </Accordion>

  <Accordion title="تأییدهای exec در Telegram">
    Telegram از تأییدهای exec در DMهای تأییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در گفت‌وگو یا موضوع مبدأ منتشر کند. تأییدکنندگان باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی حداقل یک تأییدکننده قابل تشخیص باشد، خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی مالک از `commands.ownerAllowFrom` برمی‌گردد)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`، `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom`، و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با بات صحبت کند و بات پاسخ‌های عادی را کجا می‌فرستد. این‌ها کسی را به تأییدکننده exec تبدیل نمی‌کنند. اولین جفت‌سازی DM تأییدشده، وقتی هنوز مالک فرمانی وجود ندارد، `commands.ownerAllowFrom` را راه‌اندازی اولیه می‌کند، بنابراین راه‌اندازی تک‌مالک همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانال، متن فرمان را در گفت‌وگو نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/موضوع‌های مورد اعتماد فعال کنید. وقتی prompt در یک موضوع forum قرار می‌گیرد، OpenClaw موضوع را برای prompt تأیید و پیگیری حفظ می‌کند. تأییدهای exec به‌صورت پیش‌فرض پس از 30 دقیقه منقضی می‌شوند.

    دکمه‌های تأیید inline نیز نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group`، یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدهای Plugin resolve می‌شوند؛ سایر موارد ابتدا از طریق تأییدهای exec resolve می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی عامل با خطای تحویل یا provider روبه‌رو می‌شود، Telegram می‌تواند با متن خطا پاسخ دهد یا آن را سرکوب کند. دو کلید پیکربندی این رفتار را کنترل می‌کنند:

| کلید                                | مقدارها          | پیش‌فرض | توضیح                                                                                          |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` یک پیام خطای دوستانه به گفت‌وگو می‌فرستد. `silent` پاسخ‌های خطا را کاملاً سرکوب می‌کند. |
| `channels.telegram.errorCooldownMs` | عدد (ms)          | `60000` | حداقل زمان بین پاسخ‌های خطا به همان گفت‌وگو. از هرزپیام خطا هنگام اختلال جلوگیری می‌کند.        |

بازنویسی‌های هر حساب، هر گروه، و هر موضوع پشتیبانی می‌شوند (همان وراثت کلیدهای دیگر پیکربندی Telegram).

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

    - اگر `requireMention=false` باشد، حالت privacy در Telegram باید دید کامل را اجازه دهد.
      - BotFather: `/setprivacy` -> Disable
      - سپس بات را از گروه حذف و دوباره اضافه کنید
    - وقتی پیکربندی انتظار پیام‌های گروهی بدون mention را دارد، `openclaw channels status` هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ wildcard `"*"` را نمی‌توان از نظر عضویت probe کرد.
    - آزمون سریع نشست: `/activation always`.

  </Accordion>

  <Accordion title="بات اصلاً پیام‌های گروه را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا شامل `"*"` باشد)
    - عضویت بات در گروه را تأیید کنید
    - لاگ‌ها را بررسی کنید: `openclaw logs --follow` برای دلیل‌های نادیده‌گرفتن

  </Accordion>

  <Accordion title="فرمان‌ها به‌صورت ناقص یا اصلاً کار نمی‌کنند">

    - هویت فرستنده خود را مجاز کنید (جفت‌سازی و/یا `allowFrom` عددی)
    - مجوز فرمان حتی وقتی سیاست گروه `open` است نیز اعمال می‌شود
    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی بومی ورودی‌های زیادی دارد؛ فرمان‌های Plugin/skill/custom را کاهش دهید یا منوهای بومی را غیرفعال کنید
    - فراخوانی‌های startup مربوط به `deleteMyCommands` / `setMyCommands` محدود هستند و هنگام timeout درخواست، یک‌بار از طریق fallback انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار network/fetch معمولاً نشان‌دهنده مشکلات دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="startup توکن غیرمجاز گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای توکن بات پیکربندی‌شده است.
    - توکن بات را در BotFather دوباره کپی یا بازتولید کنید، سپس `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken`، یا `TELEGRAM_BOT_TOKEN` را برای حساب پیش‌فرض به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام startup نیز شکست auth است؛ برخورد با آن به‌عنوان «هیچ webhook وجود ندارد» فقط همان شکست bad-token را به فراخوانی‌های بعدی API موکول می‌کند.
    - اگر `deleteWebhook` هنگام startup مربوط به polling با خطای گذرای شبکه شکست بخورد، OpenClaw `getWebhookInfo` را بررسی می‌کند؛ وقتی Telegram یک URL خالی webhook گزارش می‌کند، polling ادامه می‌یابد چون پاک‌سازی از قبل انجام شده است.

  </Accordion>

  <Accordion title="ناپایداری polling یا شبکه">

    - Node 22+ + واکشی/پراکسی سفارشی می‌تواند در صورت ناسازگاری نوع‌های AbortSignal باعث رفتار لغو فوری شود.
    - بعضی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 resolve می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث خرابی‌های متناوب API Telegram شود.
    - اگر لاگ‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این موارد را به‌عنوان خطاهای شبکه قابل‌بازیابی دوباره تلاش می‌کند.
    - اگر لاگ‌ها شامل `Polling stall detected` باشند، OpenClaw به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون تکمیل زنده‌بودن long-poll، polling را دوباره راه‌اندازی می‌کند و انتقال Telegram را دوباره می‌سازد.
    - `openclaw channels status --probe` و `openclaw doctor` زمانی هشدار می‌دهند که یک حساب polling در حال اجرا پس از مهلت شروع، `getUpdates` را تکمیل نکرده باشد، یک حساب webhook در حال اجرا پس از مهلت شروع، `setWebhook` را تکمیل نکرده باشد، یا آخرین فعالیت موفق انتقال polling کهنه شده باشد.
    - فقط زمانی `channels.telegram.pollingStallThresholdMs` را افزایش دهید که فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما میزبان شما همچنان راه‌اندازی‌های دوباره کاذب polling-stall را گزارش می‌کند. stallهای پایدار معمولا به مشکلات پراکسی، DNS، IPv6 یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین env پراکسی فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY` و گونه‌های حروف کوچک آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌تواند `api.telegram.org` را دور بزند.
    - اگر پراکسی مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای یک محیط سرویس پیکربندی شده باشد و هیچ env پراکسی استانداردی وجود نداشته باشد، Telegram برای انتقال Bot API نیز از همان URL استفاده می‌کند.
    - روی میزبان‌های VPS با خروجی مستقیم/TLS ناپایدار، فراخوانی‌های API Telegram را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌طور پیش‌فرض از `autoSelectFamily=true` (به‌جز WSL2) و `dnsResultOrder=ipv4first` استفاده می‌کند.
    - اگر میزبان شما WSL2 است یا صراحتا با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب family را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های محدوده بنچمارک RFC 2544 (`198.18.0.0/15`) از قبل به‌طور پیش‌فرض
      برای دانلودهای رسانه Telegram مجاز هستند. اگر یک fake-IP مورد اعتماد یا
      پراکسی شفاف، `api.telegram.org` را هنگام دانلود رسانه به یک نشانی
      خصوصی/داخلی/کاربرد ویژه دیگر بازنویسی می‌کند، می‌توانید برای دور زدن
      فقط مخصوص Telegram opt in کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین opt-in برای هر حساب نیز در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر پراکسی شما میزبان‌های رسانه Telegram را به `198.18.x.x` resolve می‌کند، ابتدا
      پرچم خطرناک را خاموش نگه دارید. رسانه Telegram از قبل به‌طور پیش‌فرض
      محدوده بنچمارک RFC 2544 را مجاز می‌کند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` حفاظت‌های SSRF رسانه
      Telegram را ضعیف می‌کند. فقط برای محیط‌های پراکسی مورد اعتماد و تحت کنترل
      اپراتور مانند مسیریابی fake-IP در Clash، Mihomo یا Surge از آن استفاده کنید،
      زمانی که آن‌ها پاسخ‌های خصوصی یا کاربرد ویژه خارج از محدوده بنچمارک RFC 2544
      می‌سازند. برای دسترسی عادی Telegram از اینترنت عمومی، آن را خاموش نگه دارید.
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

<Accordion title="فیلدهای پرسیگنال Telegram">

- راه‌اندازی/احراز هویت: `enabled`، `botToken`، `tokenFile`، `accounts.*` (`tokenFile` باید به یک فایل عادی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، `bindings[]` سطح بالا (`type: "acp"`)
- تاییدهای exec: `execApprovals`، `accounts.*.execApprovals`
- فرمان/منو: `commands.native`، `commands.nativeSkills`، `customCommands`
- رشته‌بندی/پاسخ‌ها: `replyToMode`
- streaming: `streaming` (پیش‌نمایش)، `streaming.preview.toolProgress`، `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`، `chunkMode`، `linkPreview`، `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ `/bot<TOKEN>` را شامل نکنید)
- webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- کنش‌ها/قابلیت‌ها: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- واکنش‌ها: `reactionNotifications`، `reactionLevel`
- خطاها: `errorPolicy`، `errorCooldownMs`
- نوشتن‌ها/تاریخچه: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را شامل کنید) تا مسیریابی پیش‌فرض صریح شود. در غیر این صورت OpenClaw به اولین شناسه حساب نرمال‌شده fallback می‌کند و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقدارهای `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را به Gateway جفت کنید.
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
  <Card title="مسیریابی چند-agent" icon="sitemap" href="/fa/concepts/multi-agent">
    گروه‌ها و موضوع‌ها را به agentها نگاشت کنید.
  </Card>
  <Card title="عیب‌یابی" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی‌های بین‌کانالی.
  </Card>
</CardGroup>

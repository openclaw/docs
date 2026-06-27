---
read_when:
    - کار روی ویژگی‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-06-27T17:14:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

آمادهٔ تولید برای پیام‌های مستقیم ربات و گروه‌ها از طریق grammY. حالت پیش‌فرض، نظرسنجی طولانی است؛ حالت Webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای Telegram جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های بین‌کانالی و راهنماهای تعمیر.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و مثال‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="توکن ربات را در BotFather بسازید">
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

    جایگزین محیطی: `TELEGRAM_BOT_TOKEN=...` (فقط حساب پیش‌فرض).
    Telegram از `openclaw channels login telegram` استفاده **نمی‌کند**؛ توکن را در پیکربندی/محیط تنظیم کنید، سپس Gateway را راه‌اندازی کنید.

  </Step>

  <Step title="Gateway را راه‌اندازی و نخستین پیام مستقیم را تأیید کنید">

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
    - شناسه گفتگوی گروه Telegram، که به‌عنوان کلید زیر `channels.telegram.groups` استفاده می‌شود

    برای راه‌اندازی اولیه، شناسه گفتگوی گروه را از `openclaw logs --follow`، یک ربات شناسهٔ فورواردشده، یا `getUpdates` در Bot API بگیرید. پس از مجاز شدن گروه، `/whoami@<bot_username>` می‌تواند شناسه‌های کاربر و گروه را تأیید کند.

    شناسه‌های منفی سوپرگروه Telegram که با `-100` شروع می‌شوند، شناسه‌های گفتگوی گروه هستند. آن‌ها را زیر `channels.telegram.groups` قرار دهید، نه زیر `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتیب تشخیص توکن به حساب وابسته است. در عمل، مقادیر پیکربندی بر جایگزین محیطی مقدم هستند و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
پس از راه‌اندازی موفق، OpenClaw هویت ربات را تا ۲۴ ساعت در پوشهٔ وضعیت کش می‌کند تا راه‌اندازی‌های مجدد بتوانند از یک فراخوانی اضافی `getMe` در Telegram پرهیز کنند؛ تغییر یا حذف توکن، آن کش را پاک می‌کند.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و دیده‌شدن در گروه">
    ربات‌های Telegram به‌صورت پیش‌فرض روی **حالت حریم خصوصی** هستند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر ربات باید همهٔ پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را از طریق `/setprivacy` غیرفعال کنید، یا
    - ربات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، ربات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت مدیر در تنظیمات گروه Telegram کنترل می‌شود.

    ربات‌های مدیر همهٔ پیام‌های گروه را دریافت می‌کنند، که برای رفتار همیشه‌فعال در گروه مفید است.

  </Accordion>

  <Accordion title="گزینه‌های مفید BotFather">

    - `/setjoingroups` برای اجازه/رد اضافه شدن به گروه‌ها
    - `/setprivacy` برای رفتار دیده‌شدن در گروه

  </Accordion>
</AccordionGroup>

## کنترل دسترسی و فعال‌سازی

### هویت ربات در گروه

در گروه‌ها و موضوعات انجمنی Telegram، اشارهٔ صریح به شناسهٔ ربات پیکربندی‌شده (برای مثال `@my_bot`) به‌عنوان خطاب به عامل انتخاب‌شدهٔ OpenClaw در نظر گرفته می‌شود، حتی وقتی نام شخصیت عامل با نام کاربری Telegram متفاوت باشد. سیاست سکوت گروه همچنان برای ترافیک نامرتبط گروه اعمال می‌شود، اما خود شناسهٔ ربات «شخص دیگری» محسوب نمی‌شود.

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.telegram.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (به حداقل یک شناسه فرستنده در `allowFrom` نیاز دارد)
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` اجازه می‌دهد هر حساب Telegram که نام کاربری ربات را پیدا یا حدس بزند، به ربات فرمان بدهد. آن را فقط برای ربات‌های عمداً عمومی با ابزارهای به‌شدت محدود استفاده کنید؛ ربات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربران Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در پیکربندی‌های چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های `allowFrom: ["*"]` در سطح حساب، آن حساب را عمومی نمی‌کنند مگر اینکه فهرست مجاز مؤثر حساب پس از ادغام همچنان یک wildcard صریح داشته باشد.
    `dmPolicy: "allowlist"` با `allowFrom` خالی همهٔ پیام‌های مستقیم را مسدود می‌کند و توسط اعتبارسنجی پیکربندی رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را می‌پرسد.
    اگر ارتقا داده‌اید و پیکربندی شما ورودی‌های allowlist به‌شکل `@username` دارد، `openclaw doctor --fix` را اجرا کنید تا آن‌ها را حل کند (بهترین تلاش؛ به توکن ربات Telegram نیاز دارد).
    اگر قبلاً به فایل‌های allowlist در مخزن جفت‌سازی متکی بودید، `openclaw doctor --fix` می‌تواند در جریان‌های allowlist ورودی‌ها را به `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز شناسه‌های صریح ندارد).

    برای ربات‌های تک‌مالک، `dmPolicy: "allowlist"` را با شناسه‌های عددی صریح `allowFrom` ترجیح دهید تا سیاست دسترسی در پیکربندی پایدار بماند (به‌جای وابستگی به تأییدهای جفت‌سازی قبلی).

    سردرگمی رایج: تأیید جفت‌سازی پیام مستقیم به‌معنای «این فرستنده همه‌جا مجاز است» نیست.
    جفت‌سازی دسترسی پیام مستقیم را اعطا می‌کند. اگر هنوز مالک فرمانی وجود نداشته باشد، نخستین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط‌مالک و تأییدهای اجرا یک حساب اپراتور صریح داشته باشند.
    مجوز فرستنده در گروه همچنان از allowlistهای صریح پیکربندی می‌آید.
    اگر می‌خواهید «یک‌بار مجاز شوم و هم پیام‌های مستقیم و هم فرمان‌های گروه کار کنند»، شناسه عددی کاربر Telegram خود را در `channels.telegram.allowFrom` بگذارید؛ برای فرمان‌های فقط‌مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### پیدا کردن شناسه کاربر Telegram خود

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

    1. **کدام گروه‌ها مجاز هستند** (`channels.telegram.groups`)
       - بدون پیکربندی `groups`:
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسهٔ گروه را بگذراند
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها مسدود می‌شوند تا زمانی که ورودی‌های `groups` (یا `"*"`) را اضافه کنید
       - `groups` پیکربندی‌شده: به‌عنوان allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستندهٔ گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` برمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربران Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های گفتگوی گروه یا سوپرگروه Telegram را در `groupAllowFrom` قرار ندهید. شناسه‌های گفتگوی منفی زیر `channels.telegram.groups` قرار می‌گیرند.
    ورودی‌های غیرعددی برای مجوز فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز مجوز فرستندهٔ گروه تأییدهای مخزن جفت‌سازی پیام مستقیم را **به ارث نمی‌برد**.
    جفت‌سازی فقط برای پیام مستقیم می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` در سطح گروه/موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به پیکربندی `allowFrom` برمی‌گردد، نه مخزن جفت‌سازی.
    الگوی عملی برای ربات‌های تک‌مالک: شناسه کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکتهٔ زمان اجرا: اگر `channels.telegram` کاملاً غایب باشد، زمان اجرا به‌صورت پیش‌فرض با `groupPolicy="allowlist"` بسته‌محور عمل می‌کند، مگر اینکه `channels.defaults.groupPolicy` صریحاً تنظیم شده باشد.

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

    آن را از گروه با `@<bot_username> ping` آزمایش کنید. پیام‌های سادهٔ گروهی تا وقتی `requireMention: true` است ربات را فعال نمی‌کنند.

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

    مثال: اجازه فقط به کاربران مشخص داخل یک گروه مشخص:

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
      - وقتی می‌خواهید محدود کنید چه کسانی داخل یک گروه مجاز می‌توانند ربات را فعال کنند، شناسه‌های کاربران Telegram مانند `8734062810` را زیر `groupAllowFrom` قرار دهید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با ربات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="رفتار اشاره">
    پاسخ‌های گروه به‌صورت پیش‌فرض به اشاره نیاز دارند.

    اشاره می‌تواند از این‌ها بیاید:

    - اشارهٔ بومی `@botusername`، یا
    - الگوهای اشاره در:
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

    زمینهٔ تاریخچهٔ گروه به‌صورت پیش‌فرض `mention-only` است: پیام‌های قبلی گروه
    فقط وقتی گنجانده می‌شوند که خطاب به ربات بوده باشند، پاسخ به ربات باشند،
    یا پیام‌های خود ربات باشند. `includeGroupHistoryContext: "recent"` را تنظیم کنید تا
    تاریخچهٔ اخیر اتاق برای گروه‌های مورد اعتماد گنجانده شود. `includeGroupHistoryContext: "none"` را تنظیم کنید تا
    هیچ تاریخچهٔ قبلی گروه Telegram با نوبت بعدی ارسال نشود.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    گرفتن شناسه گفتگوی گروه:

    - یک پیام گروه را به `@userinfobot` / `@getidsbot` فوروارد کنید
    - یا `chat.id` را از `openclaw logs --follow` بخوانید
    - یا `getUpdates` در Bot API را بررسی کنید
    - پس از مجاز شدن گروه، اگر فرمان‌های بومی فعال هستند، `/whoami@<bot_username>` را اجرا کنید

  </Tab>
</Tabs>

## رفتار زمان اجرا

- Telegram در مالکیت فرایند Gateway است.
- مسیریابی قطعی است: پاسخ‌های ورودی Telegram به Telegram برمی‌گردند (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به پاکت کانال مشترک با فراداده پاسخ، جای‌نگهدارهای رسانه، و زمینه پایدارشده زنجیره پاسخ برای پاسخ‌های Telegram که Gateway مشاهده کرده است، نرمال‌سازی می‌شوند.
- نشست‌های گروهی بر اساس شناسه گروه ایزوله می‌شوند. موضوعات انجمن `:topic:<threadId>` را اضافه می‌کنند تا موضوعات ایزوله بمانند.
- پیام‌های DM می‌توانند `message_thread_id` داشته باشند؛ OpenClaw آن را برای پاسخ‌ها حفظ می‌کند. نشست‌های موضوعی DM فقط وقتی جدا می‌شوند که Telegram `getMe` برای ربات `has_topics_enabled: true` گزارش کند؛ در غیر این صورت DMها روی نشست تخت باقی می‌مانند.
- Long polling از grammY runner با توالی‌دهی به‌ازای هر گفت‌وگو/هر رشته استفاده می‌کند. هم‌زمانی کلی runner sink از `agents.defaults.maxConcurrent` استفاده می‌کند.
- راه‌اندازی چندحسابی، کاوش‌های هم‌زمان Telegram `getMe` را محدود می‌کند تا ناوگان‌های بزرگ ربات همه کاوش‌های حساب را هم‌زمان منشعب نکنند.
- Long polling داخل هر فرایند Gateway محافظت می‌شود تا در هر لحظه فقط یک poller فعال بتواند از یک توکن ربات استفاده کند. اگر همچنان تعارض‌های `getUpdates` 409 را می‌بینید، احتمالا یک Gateway دیگر OpenClaw، اسکریپت، یا poller خارجی از همان توکن استفاده می‌کند.
- راه‌اندازی مجدد watchdog مربوط به Long-polling به‌طور پیش‌فرض پس از 120 ثانیه بدون liveness تکمیل‌شده `getUpdates` فعال می‌شود. فقط اگر استقرار شما هنوز هنگام کارهای طولانی‌مدت راه‌اندازی مجدد کاذب به‌دلیل توقف polling می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ بازنویسی‌های به‌ازای هر حساب پشتیبانی می‌شوند.
- Telegram Bot API از رسید خواندن پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

<Note>
  `channels.telegram.dm.threadReplies` و `channels.telegram.direct.<chatId>.threadReplies` حذف شده‌اند. اگر پیکربندی شما هنوز این کلیدها را دارد، پس از ارتقا `openclaw doctor --fix` را اجرا کنید. مسیریابی موضوع DM اکنون از قابلیت ربات در Telegram `getMe.has_topics_enabled` پیروی می‌کند، که توسط حالت رشته‌ای BotFather کنترل می‌شود: ربات‌های دارای موضوع وقتی Telegram `message_thread_id` می‌فرستد از نشست‌های DM محدود به رشته استفاده می‌کنند؛ DMهای دیگر روی نشست تخت باقی می‌مانند.
</Note>

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="پیش‌نمایش پخش زنده (ویرایش پیام‌ها)">
    OpenClaw می‌تواند پاسخ‌های جزئی را به‌صورت بی‌درنگ پخش کند:

    - گفت‌وگوهای مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/موضوعات: پیام پیش‌نمایش + `editMessageText`

    الزام:

    - `channels.telegram.streaming` برابر `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - پیش‌نمایش‌های کوتاه پاسخ اولیه debounce می‌شوند، سپس اگر اجرا همچنان فعال باشد پس از یک تاخیر محدود materialize می‌شوند
    - `progress` یک پیش‌نویس وضعیت قابل ویرایش را برای پیشرفت ابزار نگه می‌دارد، وقتی فعالیت پاسخ پیش از پیشرفت ابزار برسد برچسب وضعیت پایدار را نشان می‌دهد، آن را در پایان پاک می‌کند، و پاسخ نهایی را به‌عنوان پیام عادی می‌فرستد
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده دوباره استفاده کنند یا نه (پیش‌فرض: `true` وقتی پخش پیش‌نمایش فعال است)
    - `streaming.preview.commandText` جزئیات فرمان/اجرا را داخل آن خطوط پیشرفت ابزار کنترل می‌کند: `raw` (پیش‌فرض، رفتار منتشرشده را حفظ می‌کند) یا `status` (فقط برچسب ابزار)
    - `streaming.progress.commentary` (پیش‌فرض: `false`) متن commentary/مقدمه دستیار را در پیش‌نویس موقت پیشرفت فعال می‌کند
    - `channels.telegram.streamMode` قدیمی، مقدارهای بولی `streaming`، و کلیدهای بازنشسته پیش‌نمایش پیش‌نویس بومی شناسایی می‌شوند؛ برای مهاجرت آن‌ها به پیکربندی جاری streaming، `openclaw doctor --fix` را اجرا کنید

    به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار، خطوط کوتاه وضعیتی هستند که هنگام اجرای ابزارها نشان داده می‌شوند، برای مثال اجرای فرمان، خواندن فایل، به‌روزرسانی‌های برنامه‌ریزی، خلاصه‌های patch، یا متن مقدمه/commentary مربوط به Codex در حالت app-server Codex. Telegram این‌ها را به‌طور پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشده OpenClaw از `v2026.4.22` و بعد از آن همخوان باشد.

    برای نگه داشتن پیش‌نمایش ویرایش‌شده برای متن پاسخ اما پنهان کردن خطوط پیشرفت ابزار، تنظیم کنید:

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

    برای قابل مشاهده نگه داشتن پیشرفت ابزار اما پنهان کردن متن فرمان/اجرا، تنظیم کنید:

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

    وقتی پیشرفت ابزار قابل مشاهده را بدون ویرایش پاسخ نهایی در همان پیام می‌خواهید، از حالت `progress` استفاده کنید. سیاست متن فرمان را زیر `streaming.progress` قرار دهید:

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

    فقط وقتی از `streaming.mode: "off"` استفاده کنید که تحویل صرفا نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و گفت‌وگوی عمومی ابزار/پیشرفت به‌جای ارسال به‌عنوان پیام‌های وضعیت مستقل سرکوب می‌شود. اعلان‌های تایید، payloadهای رسانه، و خطاها همچنان از مسیر تحویل نهایی عادی عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و خطوط وضعیت پیشرفت ابزار را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    <Note>
      پاسخ‌های نقل‌قول انتخاب‌شده Telegram استثنا هستند. وقتی `replyToMode` برابر `"first"`، `"all"`، یا `"batched"` است و پیام ورودی شامل متن نقل‌قول انتخاب‌شده است، OpenClaw پاسخ نهایی را به‌جای ویرایش پیش‌نمایش پاسخ از مسیر بومی quote-reply در Telegram می‌فرستد، بنابراین `streaming.preview.toolProgress` نمی‌تواند خطوط کوتاه وضعیت را برای آن نوبت نشان دهد. پاسخ‌های پیام جاری بدون متن نقل‌قول انتخاب‌شده همچنان پخش پیش‌نمایش را نگه می‌دارند. وقتی دیده‌شدن پیشرفت ابزار از پاسخ‌های نقل‌قول بومی مهم‌تر است، `replyToMode: "off"` را تنظیم کنید، یا برای پذیرش این بده‌بستان `streaming.preview.toolProgress: false` را تنظیم کنید.
    </Note>

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و ویرایش نهایی را درجا انجام می‌دهد
    - نهایی‌های متنی بلند که به چند پیام Telegram تقسیم می‌شوند، در صورت امکان از پیش‌نمایش موجود به‌عنوان نخستین قطعه نهایی دوباره استفاده می‌کنند، سپس فقط قطعه‌های باقی‌مانده را می‌فرستند
    - نهایی‌های حالت progress پیش‌نویس وضعیت را پاک می‌کنند و به‌جای ویرایش پیش‌نویس به پاسخ، از تحویل نهایی عادی استفاده می‌کنند
    - اگر ویرایش نهایی پیش از تایید متن کامل‌شده شکست بخورد، OpenClaw از تحویل نهایی عادی استفاده می‌کند و پیش‌نمایش stale را پاک‌سازی می‌کند

    برای پاسخ‌های پیچیده (برای مثال payloadهای رسانه)، OpenClaw به تحویل نهایی عادی fallback می‌کند و سپس پیام پیش‌نمایش را پاک‌سازی می‌کند.

    پخش پیش‌نمایش از block streaming جدا است. وقتی block streaming به‌طور صریح برای Telegram فعال شده باشد، OpenClaw برای جلوگیری از پخش دوبل از جریان پیش‌نمایش صرف‌نظر می‌کند.

    رفتار جریان reasoning:

    - `/reasoning stream` از مسیر پیش‌نمایش reasoning یک کانال پشتیبانی‌شده استفاده می‌کند؛ در Telegram، هنگام تولید، reasoning را داخل پیش‌نمایش زنده پخش می‌کند
    - پیش‌نمایش reasoning پس از تحویل نهایی حذف می‌شود؛ وقتی reasoning باید قابل مشاهده بماند از `/reasoning on` استفاده کنید
    - پاسخ نهایی بدون متن reasoning ارسال می‌شود

  </Accordion>

  <Accordion title="قالب‌بندی پیام غنی">
    متن خروجی به‌طور پیش‌فرض از پیام‌های HTML استاندارد Telegram استفاده می‌کند تا پاسخ‌ها در کلاینت‌های فعلی Telegram خوانا بمانند. این حالت سازگاری از bold، italic، لینک‌ها، کد، spoilers، و نقل‌قول‌های عادی پشتیبانی می‌کند، اما نه از بلوک‌های فقط غنی Bot API 10.1 مانند جدول‌های بومی، details، رسانه غنی، و فرمول‌ها.

    برای فعال کردن پیام‌های غنی Bot API 10.1، `channels.telegram.richMessages: true` را تنظیم کنید:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    وقتی فعال باشد:

    - به agent گفته می‌شود که پیام‌های غنی Telegram برای این ربات/حساب در دسترس هستند.
    - متن Markdown از طریق Markdown IR مربوط به OpenClaw render می‌شود و به‌صورت HTML غنی Telegram ارسال می‌شود.
    - payloadهای HTML غنی صریح، تگ‌های پشتیبانی‌شده Bot API 10.1 مانند headings، tables، details، rich media، و formulas را حفظ می‌کنند.
    - کپشن‌های رسانه همچنان از کپشن‌های HTML Telegram استفاده می‌کنند، چون پیام‌های غنی جایگزین کپشن‌ها نمی‌شوند.

    این کار متن مدل را از sigilهای Telegram Rich Markdown دور نگه می‌دارد، بنابراین مقادیری مثل `$400-600K` به‌عنوان ریاضی parse نمی‌شوند. متن غنی بلند به‌طور خودکار بین محدودیت‌های متن غنی و بلوک غنی Telegram تقسیم می‌شود. جدول‌هایی که از حد ستون Telegram فراتر می‌روند به‌صورت بلوک‌های کد ارسال می‌شوند.

    پیش‌فرض: برای سازگاری کلاینت خاموش است. پیام‌های غنی به کلاینت‌های سازگار Telegram نیاز دارند؛ برخی کلاینت‌های فعلی Desktop، Web، Android، و شخص ثالث پیام‌های غنی پذیرفته‌شده را به‌صورت پشتیبانی‌نشده نمایش می‌دهند. این گزینه را غیرفعال نگه دارید مگر اینکه هر کلاینتی که با ربات استفاده می‌شود بتواند آن‌ها را render کند. `/status` نشان می‌دهد که پیام‌های غنی برای نشست فعلی Telegram روشن هستند یا خاموش.

    پیش‌نمایش لینک‌ها به‌طور پیش‌فرض فعال است. `channels.telegram.linkPreview: false` تشخیص خودکار entity را برای متن غنی رد می‌کند.

  </Accordion>

  <Accordion title="فرمان‌های بومی و فرمان‌های سفارشی">
    ثبت منوی فرمان Telegram هنگام راه‌اندازی با `setMyCommands` انجام می‌شود.

    پیش‌فرض‌های فرمان بومی:

    - `commands.native: "auto"` فرمان‌های بومی را برای Telegram فعال می‌کند

    افزودن ورودی‌های سفارشی منوی فرمان:

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
    - تعارض‌ها/تکراری‌ها رد می‌شوند و در log ثبت می‌شوند

    نکته‌ها:

    - فرمان‌های سفارشی فقط ورودی منو هستند؛ رفتار را خودکار پیاده‌سازی نمی‌کنند
    - فرمان‌های plugin/skill حتی اگر در منوی Telegram نشان داده نشوند، هنگام تایپ همچنان می‌توانند کار کنند

    اگر فرمان‌های بومی غیرفعال باشند، built-inها حذف می‌شوند. فرمان‌های سفارشی/plugin اگر پیکربندی شده باشند همچنان ممکن است ثبت شوند.

    خطاهای رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از trimming همچنان سرریز شده است؛ فرمان‌های plugin/skill/سفارشی را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` با `404: Not Found` در حالی که فرمان‌های مستقیم curl مربوط به Bot API کار می‌کنند، می‌تواند یعنی `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن ربات پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان شکست پاک‌سازی webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای network/fetch معمولا یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود شده است.

    ### فرمان‌های جفت‌سازی دستگاه (plugin `device-pair`)

    وقتی plugin `device-pair` نصب باشد:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در برنامه iOS paste کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (شامل role/scopes)
    4. درخواست را تایید کنید:
       - `/pair approve <requestId>` برای تایید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر حمل می‌کند. bootstrap داخلی setup-code فقط node است: نخستین اتصال یک درخواست node در انتظار ایجاد می‌کند، و پس از تایید، Gateway یک توکن node پایدار با `scopes: []` برمی‌گرداند. توکن operator واگذارشده برنمی‌گرداند؛ دسترسی operator به یک جریان جداگانه جفت‌سازی operator یا توکن تاییدشده نیاز دارد.

    اگر دستگاهی با جزئیات احراز هویت تغییریافته دوباره تلاش کند (برای مثال role/scopes/کلید عمومی)، درخواست در انتظار قبلی supersede می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تایید، `/pair pending` را دوباره اجرا کنید.

    جزئیات بیشتر: [جفت‌سازی](/fa/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="دکمه‌های درون‌خطی">
    دامنهٔ صفحه‌کلید درون‌خطی را پیکربندی کنید:

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

    نمونهٔ کنش پیام:

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

    نمونهٔ دکمهٔ Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    دکمه‌های `web_app` در Telegram فقط در چت‌های خصوصی میان کاربر و
    ربات کار می‌کنند.

    کلیک‌های Callback به‌صورت متن به agent ارسال می‌شوند:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="کنش‌های پیام Telegram برای agentها و خودکارسازی">
    کنش‌های ابزار Telegram شامل این موارد است:

    - `sendMessage` (`to`, `content`، `mediaUrl` اختیاری، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`، `content` یا `caption`، دکمه‌های درون‌خطی `presentation` اختیاری؛ ویرایش‌های فقط دکمه، نشانه‌گذاری پاسخ را به‌روزرسانی می‌کنند)
    - `createForumTopic` (`chatId`, `name`، `iconColor` اختیاری، `iconCustomEmojiId`)

    کنش‌های پیام کانال، نام‌های مستعار خوش‌دست ارائه می‌کنند (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    کنترل‌های محدودسازی:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌صورت پیش‌فرض فعال‌اند و toggleهای جداگانهٔ `channels.telegram.actions.*` ندارند.
    ارسال‌های زمان اجرا از snapshot پیکربندی/secretهای فعال (راه‌اندازی/بارگذاری دوباره) استفاده می‌کنند، بنابراین مسیرهای کنش برای هر ارسال، SecretRef را به‌صورت موردی دوباره resolve نمی‌کنند.

    معناشناسی حذف واکنش: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="برچسب‌های رشته‌بندی پاسخ">
    Telegram از برچسب‌های صریح رشته‌بندی پاسخ در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام محرک پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسهٔ پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` نحوهٔ رسیدگی را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی رشته‌بندی پاسخ فعال باشد و متن یا caption اصلی Telegram در دسترس باشد، OpenClaw به‌صورت خودکار یک بریده‌نقل‌قول بومی Telegram را اضافه می‌کند. Telegram متن نقل‌قول بومی را به ۱۰۲۴ واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل‌قول می‌شوند و اگر Telegram نقل‌قول را رد کند، به یک پاسخ ساده برمی‌گردند.

    نکته: `off` رشته‌بندی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="موضوع‌های انجمن و رفتار رشته">
    ابرگروه‌های انجمنی:

    - کلیدهای نشست موضوع، `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و typing موضوع رشته را هدف می‌گیرند
    - مسیر پیکربندی موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    مورد ویژهٔ موضوع عمومی (`threadId=1`):

    - ارسال‌های پیام، `message_thread_id` را حذف می‌کنند (Telegram مقدار `sendMessage(...thread_id=1)` را رد می‌کند)
    - کنش‌های typing همچنان `message_thread_id` را شامل می‌شوند

    ارث‌بری موضوع: مدخل‌های موضوع تنظیمات گروه را به ارث می‌برند مگر اینکه بازنویسی شده باشند (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` فقط مختص موضوع است و از پیش‌فرض‌های گروه ارث نمی‌برد.
    `topics."*"` پیش‌فرض‌ها را برای همهٔ موضوع‌های آن گروه تنظیم می‌کند؛ شناسه‌های دقیق موضوع همچنان بر `"*"` اولویت دارند.

    **مسیر‌دهی agent برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در پیکربندی موضوع، به agent متفاوتی مسیر‌دهی شود. این کار به هر موضوع workspace، حافظه و نشست ایزولهٔ خودش را می‌دهد. نمونه:

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

    **اتصال پایدار موضوع ACP**: موضوع‌های انجمن می‌توانند نشست‌های harness مربوط به ACP را از طریق bindingهای تایپ‌شدهٔ ACP در سطح بالا pin کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و یک شناسهٔ topic-qualified مانند `-1001234567890:topic:42`). در حال حاضر به موضوع‌های انجمن در گروه‌ها/ابرگروه‌ها محدود است. [agentهای ACP](/fa/tools/acp-agents) را ببینید.

    **spawn کردن ACP مقید به رشته از چت**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک نشست ACP جدید متصل می‌کند؛ پیگیری‌ها مستقیما به همان‌جا مسیر‌دهی می‌شوند. OpenClaw تایید spawn را در همان موضوع pin می‌کند. لازم است `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    زمینهٔ قالب، `MessageThreadId` و `IsForum` را در دسترس قرار می‌دهد. چت‌های DM با `message_thread_id` فرادادهٔ پاسخ را نگه می‌دارند؛ آن‌ها فقط زمانی از کلیدهای نشست آگاه از رشته استفاده می‌کنند که `getMe` در Telegram برای ربات مقدار `has_topics_enabled: true` را گزارش کند.
    بازنویسی‌های پیشین `dm.threadReplies` و `direct.*.threadReplies` عمدا بازنشسته شده‌اند؛ از حالت رشته‌ای BotFather به‌عنوان تنها منبع حقیقت استفاده کنید و برای حذف کلیدهای پیکربندی کهنه، `openclaw doctor --fix` را اجرا کنید.

  </Accordion>

  <Accordion title="صدا، ویدئو و استیکرها">
    ### پیام‌های صوتی

    Telegram میان voice note و فایل صوتی تمایز قائل می‌شود.

    - پیش‌فرض: رفتار فایل صوتی
    - برچسب `[[audio_as_voice]]` در پاسخ agent برای اجبار به ارسال voice-note
    - رونوشت‌های voice-note ورودی به‌عنوان متن تولیدشده توسط ماشین و
      نامطمئن در زمینهٔ agent قاب‌بندی می‌شوند؛ تشخیص mention همچنان از
      رونوشت خام استفاده می‌کند، بنابراین پیام‌های صوتی وابسته به mention همچنان کار می‌کنند.

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

    Telegram بین فایل‌های ویدیویی و یادداشت‌های ویدیویی تمایز می‌گذارد.

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

    توضیحات استیکر در وضعیت Plugin مبتنی بر SQLite در OpenClaw کش می‌شوند تا فراخوانی‌های تکراری بینایی کاهش یابد.

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

  <Accordion title="Reaction notifications">
    واکنش‌های Telegram به‌صورت به‌روزرسانی‌های `message_reaction` می‌رسند (جدا از بارهای پیام).

    وقتی فعال باشد، OpenClaw رویدادهای سیستمی مانند این را در صف قرار می‌دهد:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکته‌ها:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط بات (بهترین تلاش از طریق کش پیام‌های ارسال‌شده).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ فرستندگان غیرمجاز حذف می‌شوند.
    - Telegram شناسه‌های رشته را در به‌روزرسانی‌های واکنش ارائه نمی‌کند.
      - گروه‌های غیرفورومی به نشست گفت‌وگوی گروه هدایت می‌شوند
      - گروه‌های فورومی به نشست موضوع عمومی گروه (`:topic:1`) هدایت می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌صورت خودکار شامل `message_reaction` است.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` درحالی‌که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید ارسال می‌کند. `ackReactionScope` تعیین می‌کند آن ایموجی واقعاً *چه زمانی* ارسال شود.

    **ترتیب حل ایموجی (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Telegram انتظار ایموجی یونیکد دارد (برای مثال "👀").
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

    **دامنه (`messages.ackReactionScope`):**

    ارائه‌دهندهٔ Telegram دامنه را از `messages.ackReactionScope` می‌خواند (پیش‌فرض `"group-mentions"`). امروز هیچ override در سطح حساب Telegram یا کانال Telegram وجود ندارد.

    مقادیر: `"all"` (پیام‌های مستقیم + گروه‌ها)، `"direct"` (فقط پیام‌های مستقیم)، `"group-all"` (همهٔ پیام‌های گروهی، بدون پیام مستقیم)، `"group-mentions"` (گروه‌ها وقتی بات mention می‌شود؛ **بدون پیام مستقیم** — این پیش‌فرض است)، `"off"` / `"none"` (غیرفعال).

    <Note>
    دامنهٔ پیش‌فرض (`"group-mentions"`) واکنش‌های تأیید را در پیام‌های مستقیم اجرا نمی‌کند. برای دریافت واکنش تأیید روی پیام‌های مستقیم ورودی Telegram، `messages.ackReactionScope` را روی `"direct"` یا `"all"` تنظیم کنید. مقدار هنگام راه‌اندازی ارائه‌دهندهٔ Telegram خوانده می‌شود، بنابراین برای اعمال تغییر باید Gateway راه‌اندازی مجدد شود.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    نوشتن پیکربندی کانال به‌صورت پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های برانگیخته‌شده توسط Telegram شامل این موارد است:

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

  <Accordion title="Long polling vs webhook">
    پیش‌فرض long polling است. برای حالت webhook، `channels.telegram.webhookUrl` و `channels.telegram.webhookSecret` را تنظیم کنید؛ `webhookPath`، `webhookHost`، `webhookPort` اختیاری هستند (پیش‌فرض‌ها: `/telegram-webhook`، `127.0.0.1`، `8787`).

    در حالت long-polling، OpenClaw نشانگر راه‌اندازی مجدد خود را فقط پس از ارسال موفق یک به‌روزرسانی پایدار می‌کند. اگر یک handler شکست بخورد، آن به‌روزرسانی در همان فرایند قابل تلاش مجدد باقی می‌ماند و برای حذف تکراری‌ها پس از راه‌اندازی مجدد، به‌عنوان تکمیل‌شده نوشته نمی‌شود.

    شنوندهٔ محلی به `127.0.0.1:8787` متصل می‌شود. برای ورود عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا عمداً `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook پیش از بازگرداندن `200` به Telegram، نگهبان‌های درخواست، توکن محرمانهٔ Telegram، و بدنهٔ JSON را اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان مسیرهای بات به‌ازای هر گفت‌وگو/هر موضوع که long polling استفاده می‌کند پردازش می‌کند، بنابراین نوبت‌های کند عامل، ACK تحویل Telegram را نگه نمی‌دارند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش دوباره، و هدف‌های CLI">
    - پیش‌فرض `channels.telegram.textChunkLimit` برابر با 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خط‌های خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازه رسانه ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.mediaGroupFlushMs` (پیش‌فرض 500) کنترل می‌کند آلبوم‌ها/گروه‌های رسانه‌ای Telegram چه مدت بافر شوند تا OpenClaw آن‌ها را به‌صورت یک پیام ورودی ارسال کند. اگر بخش‌های آلبوم دیر می‌رسند آن را افزایش دهید؛ برای کاهش تأخیر پاسخ آلبوم آن را کاهش دهید.
    - `channels.telegram.timeoutSeconds` زمان‌انتظار کلاینت API تلگرام را بازنویسی می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های ربات مقدارهای پیکربندی‌شده کمتر از محافظ درخواست 60 ثانیه‌ای متن/درحال‌نوشتن خروجی را محدود می‌کنند تا grammY پیش از اجرای محافظ انتقال و fallback در OpenClaw، تحویل پاسخ قابل مشاهده را لغو نکند. long polling همچنان از محافظ درخواست 45 ثانیه‌ای `getUpdates` استفاده می‌کند تا pollهای بیکار برای همیشه رها نشوند.
    - پیش‌فرض `channels.telegram.pollingStallThresholdMs` برابر با `120000` است؛ فقط برای راه‌اندازی‌های دوباره کاذب ناشی از توقف polling، آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچه زمینه گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` استفاده می‌کند (پیش‌فرض 50)؛ `0` آن را غیرفعال می‌کند.
    - زمینه تکمیلی پاسخ/نقل‌قول/فوروارد وقتی Gateway پیام‌های والد را مشاهده کرده باشد، در یک پنجره زمینه مکالمه انتخاب‌شده نرمال‌سازی می‌شود؛ کش پیام‌های مشاهده‌شده در وضعیت Plugin مبتنی بر SQLite در OpenClaw قرار دارد، و `openclaw doctor --fix` sidecarهای قدیمی را وارد می‌کند. Telegram در به‌روزرسانی‌ها فقط یک `reply_to_message` سطحی را شامل می‌شود، بنابراین زنجیره‌های قدیمی‌تر از کش به payload به‌روزرسانی فعلی Telegram محدود هستند.
    - allowlistهای Telegram عمدتاً کنترل می‌کنند چه کسی می‌تواند عامل را فعال کند، نه اینکه یک مرز کامل پنهان‌سازی زمینه تکمیلی باشند.
    - کنترل‌های تاریخچه DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای API خروجی قابل بازیابی، روی helperهای ارسال Telegram (CLI/ابزارها/کنش‌ها) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای شکست‌های پیش از اتصال Telegram از تلاش دوباره محدود و امن برای ارسال استفاده می‌کند، اما پاکت‌های شبکه‌ای مبهم پس از ارسال را که می‌توانند پیام‌های قابل مشاهده را تکراری کنند دوباره تلاش نمی‌کند.

    هدف‌های ارسال CLI و ابزار پیام می‌توانند شناسه عددی chat، نام کاربری، یا هدف topic در forum باشند:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    pollهای Telegram از `openclaw message poll` استفاده می‌کنند و از topicهای forum پشتیبانی می‌کنند:

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
    - `--thread-id` برای topicهای forum (یا از یک هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین از موارد زیر پشتیبانی می‌کند:

    - `--presentation` همراه با بلوک‌های `buttons` برای صفحه‌کلیدهای درون‌خطی، وقتی `channels.telegram.capabilities.inlineButtons` آن را مجاز کند
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل سنجاق‌شده، وقتی ربات بتواند در آن chat سنجاق کند
    - `--force-document` برای ارسال تصاویر، GIFها و ویدیوهای خروجی به‌عنوان سند، به‌جای بارگذاری‌های عکس فشرده، رسانه متحرک، یا ویدیو

    کنترل کنش‌ها:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ایجاد poll در Telegram را غیرفعال می‌کند، در حالی که ارسال‌های عادی فعال می‌مانند

  </Accordion>

  <Accordion title="تأییدهای exec در Telegram">
    Telegram از تأییدهای exec در DMهای تأییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در chat یا topic مبدأ ارسال کند. تأییدکنندگان باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی دست‌کم یک تأییدکننده قابل resolve باشد به‌طور خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی مالک از `commands.ownerAllowFrom` بازمی‌گردد)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom`، و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با ربات صحبت کند و ربات پاسخ‌های عادی را کجا بفرستد. این‌ها کسی را به تأییدکننده exec تبدیل نمی‌کنند. نخستین جفت‌سازی DM تأییدشده، وقتی هنوز مالک فرمانی وجود ندارد، `commands.ownerAllowFrom` را راه‌اندازی اولیه می‌کند؛ بنابراین راه‌اندازی تک‌مالکی همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانالی متن فرمان را در chat نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/topicهای قابل اعتماد فعال کنید. وقتی prompt در یک topic مربوط به forum قرار می‌گیرد، OpenClaw آن topic را برای prompt تأیید و پیام بعدی حفظ می‌کند. تأییدهای exec به‌صورت پیش‌فرض پس از 30 دقیقه منقضی می‌شوند.

    دکمه‌های تأیید درون‌خطی نیز نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group`، یا `all`) را مجاز کند. شناسه‌های تأییدی که با `plugin:` شروع می‌شوند از طریق تأییدهای Plugin resolve می‌شوند؛ بقیه ابتدا از طریق تأییدهای exec resolve می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی عامل با خطای تحویل یا ارائه‌دهنده روبه‌رو می‌شود، Telegram می‌تواند یا با متن خطا پاسخ دهد یا آن را سرکوب کند. دو کلید پیکربندی این رفتار را کنترل می‌کنند:

| کلید                                | مقدارها           | پیش‌فرض | توضیح                                                                                           |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` یک پیام خطای دوستانه به chat می‌فرستد. `silent` پاسخ‌های خطا را کاملاً سرکوب می‌کند. |
| `channels.telegram.errorCooldownMs` | عدد (ms)          | `60000` | حداقل زمان بین پاسخ‌های خطا به همان chat. از spam خطا هنگام قطعی‌ها جلوگیری می‌کند.           |

بازنویسی‌های سطح حساب، گروه، و topic پشتیبانی می‌شوند (همان وراثت سایر کلیدهای پیکربندی Telegram).

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
    - وقتی پیکربندی انتظار پیام‌های گروهی بدون mention داشته باشد، `openclaw channels status` هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ wildcard `"*"` را نمی‌توان از نظر عضویت probe کرد.
    - آزمون سریع session: `/activation always`.

  </Accordion>

  <Accordion title="ربات اصلاً پیام‌های گروه را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا `"*"` را شامل شود)
    - عضویت ربات در گروه را بررسی کنید
    - لاگ‌ها را بازبینی کنید: `openclaw logs --follow` برای دلیل‌های رد شدن

  </Accordion>

  <Accordion title="فرمان‌ها تا حدی کار می‌کنند یا اصلاً کار نمی‌کنند">

    - هویت فرستنده خود را مجاز کنید (جفت‌سازی و/یا `allowFrom` عددی)
    - مجوزدهی فرمان حتی وقتی policy گروه `open` باشد همچنان اعمال می‌شود
    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی بومی ورودی‌های بیش از حدی دارد؛ فرمان‌های Plugin/skill/سفارشی را کاهش دهید یا منوهای بومی را غیرفعال کنید
    - فراخوانی‌های startup مربوط به `deleteMyCommands` / `setMyCommands` و فراخوانی‌های تایپ `sendChatAction` محدود هستند و هنگام timeout درخواست، یک بار از طریق fallback انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار شبکه/fetch معمولاً نشان‌دهنده مشکلات دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="startup توکن غیرمجاز گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای توکن ربات پیکربندی‌شده است.
    - توکن ربات را در BotFather دوباره کپی یا بازتولید کنید، سپس برای حساب پیش‌فرض `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken`، یا `TELEGRAM_BOT_TOKEN` را به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام startup نیز یک شکست احراز هویت است؛ تلقی کردن آن به‌عنوان «هیچ Webhookای وجود ندارد» فقط همان شکست توکن نامعتبر را به فراخوانی‌های API بعدی موکول می‌کند.

  </Accordion>

  <Accordion title="ناپایداری polling یا شبکه">

    - Node 22+ همراه با fetch/proxy سفارشی می‌تواند در صورت ناسازگاری نوع‌های AbortSignal، رفتار abort فوری ایجاد کند.
    - برخی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 resolve می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث شکست‌های متناوب API تلگرام شود.
    - اگر لاگ‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این‌ها را به‌عنوان خطاهای شبکه قابل بازیابی دوباره تلاش می‌کند.
    - هنگام startup مربوط به polling، OpenClaw probe موفق startup یعنی `getMe` را برای grammY دوباره استفاده می‌کند تا runner پیش از نخستین `getUpdates` به یک `getMe` دوم نیاز نداشته باشد.
    - اگر `deleteWebhook` هنگام startup مربوط به polling با خطای گذرای شبکه شکست بخورد، OpenClaw به‌جای انجام یک فراخوانی control-plane دیگر پیش از poll، وارد long polling می‌شود. Webhook همچنان فعال به‌صورت conflict در `getUpdates` ظاهر می‌شود؛ سپس OpenClaw انتقال Telegram را بازسازی می‌کند و پاک‌سازی Webhook را دوباره تلاش می‌کند.
    - اگر socketهای Telegram در یک cadence ثابت کوتاه بازیافت می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ کلاینت‌های ربات مقدارهای پیکربندی‌شده کمتر از محافظ‌های درخواست خروجی و `getUpdates` را محدود می‌کنند، اما نسخه‌های قدیمی‌تر وقتی این مقدار کمتر از آن محافظ‌ها تنظیم شده بود می‌توانستند هر poll یا پاسخ را abort کنند.
    - اگر لاگ‌ها شامل `Polling stall detected` باشند، OpenClaw پس از 120 ثانیه بدون تکمیل liveness مربوط به long-poll، به‌صورت پیش‌فرض polling را دوباره راه‌اندازی و انتقال Telegram را بازسازی می‌کند.
    - `openclaw channels status --probe` و `openclaw doctor` هشدار می‌دهند وقتی یک حساب polling در حال اجرا پس از مهلت startup، `getUpdates` را کامل نکرده باشد، وقتی یک حساب Webhook در حال اجرا پس از مهلت startup، `setWebhook` را کامل نکرده باشد، یا وقتی آخرین فعالیت موفق انتقال polling قدیمی شده باشد.
    - `channels.telegram.pollingStallThresholdMs` را فقط وقتی افزایش دهید که فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما میزبان شما همچنان راه‌اندازی‌های دوباره کاذب ناشی از توقف polling گزارش می‌کند. توقف‌های پایدار معمولاً به مشکلات proxy، DNS، IPv6، یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین envهای proxy فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY`، و گونه‌های حروف کوچک آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌تواند `api.telegram.org` را دور بزند.
    - اگر proxy مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای محیط سرویس پیکربندی شده باشد و هیچ env استاندارد proxy وجود نداشته باشد، Telegram نیز از همان URL برای انتقال Bot API استفاده می‌کند.
    - روی میزبان‌های VPS با خروجی مستقیم/TLS ناپایدار، فراخوانی‌های API تلگرام را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌صورت پیش‌فرض `autoSelectFamily=true` دارد (به‌جز WSL2). ترتیب نتیجه DNS تلگرام ابتدا از `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، سپس `channels.telegram.network.dnsResultOrder`، سپس پیش‌فرض فرایند مانند `NODE_OPTIONS=--dns-result-order=ipv4first` پیروی می‌کند؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` بازمی‌گردد.
    - اگر میزبان شما WSL2 است یا صریحاً با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب family را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های بازهٔ بنچمارک RFC 2544 (`198.18.0.0/15`) از قبل به‌طور پیش‌فرض
      برای دانلود رسانه‌های Telegram مجاز هستند. اگر یک fake-IP قابل اعتماد یا
      پراکسی شفاف، هنگام دانلود رسانه، `api.telegram.org` را به یک نشانی
      خصوصی/داخلی/کاربرد-ویژهٔ دیگر بازنویسی کند، می‌توانید دورزدن فقط مختص Telegram
      را فعال کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین فعال‌سازی به‌ازای هر حساب در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` نیز در دسترس است.
    - اگر پراکسی شما میزبان‌های رسانهٔ Telegram را به `198.18.x.x` resolve می‌کند،
      ابتدا پرچم خطرناک را خاموش بگذارید. رسانهٔ Telegram از قبل بازهٔ بنچمارک
      RFC 2544 را به‌طور پیش‌فرض مجاز می‌داند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانهٔ Telegram
      را ضعیف می‌کند. فقط در محیط‌های پراکسی مورد اعتماد و تحت کنترل اپراتور
      مانند مسیریابی fake-IP در Clash، Mihomo یا Surge از آن استفاده کنید، آن هم
      زمانی که پاسخ‌های خصوصی یا کاربرد-ویژه‌ای خارج از بازهٔ بنچمارک RFC 2544
      تولید می‌کنند. برای دسترسی عادی Telegram از اینترنت عمومی، آن را خاموش بگذارید.
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

- راه‌اندازی/احراز هویت: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` باید به یک فایل معمولی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` سطح بالا (`type: "acp"`)
- پیش‌فرض‌های موضوع: `groups.<chatId>.topics."*"` روی موضوع‌های انجمنِ بدون تطابق اعمال می‌شود؛ شناسه‌های دقیق موضوع آن را بازنویسی می‌کنند
- تأییدهای اجرا: `execApprovals`, `accounts.*.execApprovals`
- فرمان/منو: `commands.native`, `commands.nativeSkills`, `customCommands`
- رشته‌ها/پاسخ‌ها: `replyToMode`
- جریان‌دهی: `streaming` (پیش‌نمایش), `streaming.preview.toolProgress`, `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ریشهٔ API سفارشی: `apiRoot` (فقط ریشهٔ Bot API؛ `/bot<TOKEN>` را وارد نکنید)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- کنش‌ها/قابلیت‌ها: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- واکنش‌ها: `reactionNotifications`, `reactionLevel`
- خطاها: `errorPolicy`, `errorCooldownMs`
- نوشتن‌ها/تاریخچه: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسهٔ حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را اضافه کنید) تا مسیریابی پیش‌فرض صریح باشد. در غیر این صورت OpenClaw به نخستین شناسهٔ حساب نرمال‌شده برمی‌گردد و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقادیر `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را با Gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار allowlist برای گروه و موضوع.
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

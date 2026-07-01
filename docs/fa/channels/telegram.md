---
read_when:
    - کار روی قابلیت‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی ربات Telegram، قابلیت‌ها و پیکربندی
title: Telegram
x-i18n:
    generated_at: "2026-07-01T20:27:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 541ce276cf045b19461167513d86e2dd9a5bb8ff95bcb9e55f10440e2e66a165
    source_path: channels/telegram.md
    workflow: 16
---

آماده تولید برای پیام‌های خصوصی ربات و گروه‌ها از طریق grammY. حالت پیش‌فرض، پولینگ طولانی است؛ حالت Webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام خصوصی برای Telegram جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی و راهنماهای تعمیر.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و مثال‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="ساخت توکن ربات در BotFather">
    Telegram را باز کنید و با **@BotFather** گفتگو کنید (تأیید کنید که شناسه دقیقاً `@BotFather` است).

    `/newbot` را اجرا کنید، درخواست‌ها را دنبال کنید و توکن را ذخیره کنید.

  </Step>

  <Step title="پیکربندی توکن و سیاست پیام خصوصی">

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
    Telegram از `openclaw channels login telegram` استفاده **نمی‌کند**؛ توکن را در config/env پیکربندی کنید، سپس Gateway را شروع کنید.

  </Step>

  <Step title="شروع Gateway و تأیید نخستین پیام خصوصی">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.

  </Step>

  <Step title="افزودن ربات به گروه">
    ربات را به گروه خود اضافه کنید، سپس هر دو شناسه‌ای را که دسترسی گروه به آن‌ها نیاز دارد دریافت کنید:

    - شناسه کاربری Telegram شما، که در `allowFrom` / `groupAllowFrom` استفاده می‌شود
    - شناسه گفتگوی گروه Telegram، که به‌عنوان کلید زیر `channels.telegram.groups` استفاده می‌شود

    برای راه‌اندازی بار اول، شناسه گفتگوی گروه را از `openclaw logs --follow`، یک ربات شناسه فورواردشده، یا Bot API `getUpdates` دریافت کنید. پس از مجاز شدن گروه، `/whoami@<bot_username>` می‌تواند شناسه‌های کاربر و گروه را تأیید کند.

    شناسه‌های منفی ابرگروه Telegram که با `-100` شروع می‌شوند، شناسه گفتگوی گروه هستند. آن‌ها را زیر `channels.telegram.groups` قرار دهید، نه زیر `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتیب حل توکن وابسته به حساب است. در عمل، مقادیر config بر جایگزین env مقدم‌اند، و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
پس از شروع موفق، OpenClaw هویت ربات را تا ۲۴ ساعت در دایرکتوری state کش می‌کند تا راه‌اندازی‌های مجدد بتوانند از یک فراخوانی اضافی Telegram `getMe` اجتناب کنند؛ تغییر دادن یا حذف توکن این کش را پاک می‌کند.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و نمایش‌پذیری گروه">
    ربات‌های Telegram به‌صورت پیش‌فرض از **حالت حریم خصوصی** استفاده می‌کنند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر ربات باید همه پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را از طریق `/setprivacy` غیرفعال کنید، یا
    - ربات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، ربات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت مدیر در تنظیمات گروه Telegram کنترل می‌شود.

    ربات‌های مدیر همه پیام‌های گروه را دریافت می‌کنند، که برای رفتار گروهی همیشه‌فعال مفید است.

  </Accordion>

  <Accordion title="کلیدهای مفید BotFather">

    - `/setjoingroups` برای اجازه دادن/رد کردن افزودن به گروه
    - `/setprivacy` برای رفتار نمایش‌پذیری گروه

  </Accordion>
</AccordionGroup>

## کنترل دسترسی و فعال‌سازی

### هویت ربات گروه

در گروه‌ها و موضوعات انجمن Telegram، اشاره صریح به شناسه پیکربندی‌شده ربات (برای مثال `@my_bot`) به‌عنوان خطاب به عامل انتخاب‌شده OpenClaw تلقی می‌شود، حتی وقتی نام پرسونای عامل با نام کاربری Telegram فرق دارد. سیاست سکوت گروه همچنان برای ترافیک نامرتبط گروه اعمال می‌شود، اما خود شناسه ربات «شخص دیگری» محسوب نمی‌شود.

<Tabs>
  <Tab title="سیاست پیام خصوصی">
    `channels.telegram.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (به حداقل یک شناسه فرستنده در `allowFrom` نیاز دارد)
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` اجازه می‌دهد هر حساب Telegram که نام کاربری ربات را پیدا یا حدس می‌زند به ربات فرمان بدهد. آن را فقط برای ربات‌های عمداً عمومی با ابزارهای به‌شدت محدود استفاده کنید؛ ربات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربر Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در پیکربندی‌های چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های سطح حساب `allowFrom: ["*"]` آن حساب را عمومی نمی‌کنند، مگر اینکه allowlist مؤثر حساب پس از ادغام همچنان شامل یک wildcard صریح باشد.
    `dmPolicy: "allowlist"` با `allowFrom` خالی همه پیام‌های خصوصی را مسدود می‌کند و توسط اعتبارسنجی config رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند.
    اگر ارتقا داده‌اید و config شما شامل ورودی‌های allowlist از نوع `@username` است، برای حل آن‌ها `openclaw doctor --fix` را اجرا کنید (بهترین تلاش؛ به توکن ربات Telegram نیاز دارد).
    اگر قبلاً به فایل‌های allowlist در ذخیره جفت‌سازی متکی بودید، `openclaw doctor --fix` می‌تواند در جریان‌های allowlist ورودی‌ها را به `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز هیچ شناسه صریحی ندارد).

    برای ربات‌های تک‌مالک، `dmPolicy: "allowlist"` همراه با شناسه‌های عددی صریح `allowFrom` را ترجیح دهید تا سیاست دسترسی در config پایدار بماند (به‌جای وابستگی به تأییدهای جفت‌سازی قبلی).

    ابهام رایج: تأیید جفت‌سازی پیام خصوصی به معنای «این فرستنده همه‌جا مجاز است» نیست.
    جفت‌سازی دسترسی پیام خصوصی را اعطا می‌کند. اگر هنوز مالک فرمانی وجود نداشته باشد، نخستین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط‌مالک و تأییدهای exec یک حساب اپراتور صریح داشته باشند.
    مجوز فرستنده گروه همچنان از allowlistهای صریح config می‌آید.
    اگر می‌خواهید «یک‌بار مجاز شوم و هم پیام‌های خصوصی و هم فرمان‌های گروه کار کنند»، شناسه عددی کاربر Telegram خود را در `channels.telegram.allowFrom` قرار دهید؛ برای فرمان‌های فقط‌مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### پیدا کردن شناسه کاربر Telegram خود

    امن‌تر (بدون ربات شخص ثالث):

    1. به ربات خود پیام خصوصی بدهید.
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
         - با `groupPolicy: "open"`: هر گروهی می‌تواند از بررسی‌های شناسه گروه عبور کند
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها تا زمانی که ورودی‌های `groups` (یا `"*"`) را اضافه کنید مسدود می‌شوند
       - `groups` پیکربندی‌شده: به‌عنوان allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستنده گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` برمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربر Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های گفتگوی گروه یا ابرگروه Telegram را در `groupAllowFrom` قرار ندهید. شناسه‌های گفتگوی منفی به `channels.telegram.groups` تعلق دارند.
    ورودی‌های غیرعددی برای مجوزدهی فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز مجوز فرستنده گروه تأییدهای ذخیره جفت‌سازی پیام خصوصی را به ارث **نمی‌برد**.
    جفت‌سازی فقط برای پیام خصوصی می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` مخصوص هر گروه/موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به config `allowFrom` برمی‌گردد، نه ذخیره جفت‌سازی.
    الگوی عملی برای ربات‌های تک‌مالک: شناسه کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکته زمان اجرا: اگر `channels.telegram` کاملاً غایب باشد، زمان اجرا به‌صورت پیش‌فرض fail-closed `groupPolicy="allowlist"` را استفاده می‌کند، مگر اینکه `channels.defaults.groupPolicy` صراحتاً تنظیم شده باشد.

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

    آن را از گروه با `@<bot_username> ping` آزمایش کنید. پیام‌های ساده گروه وقتی `requireMention: true` است ربات را فعال نمی‌کنند.

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

      - شناسه‌های منفی گفتگوی گروه یا ابرگروه Telegram مثل `-1001234567890` را زیر `channels.telegram.groups` قرار دهید.
      - وقتی می‌خواهید محدود کنید کدام افراد درون یک گروه مجاز بتوانند ربات را فعال کنند، شناسه‌های کاربر Telegram مثل `8734062810` را زیر `groupAllowFrom` قرار دهید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با ربات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="رفتار اشاره">
    پاسخ‌های گروهی به‌صورت پیش‌فرض به اشاره نیاز دارند.

    اشاره می‌تواند از این موارد بیاید:

    - اشاره بومی `@botusername`، یا
    - الگوهای اشاره در:
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

    زمینه تاریخچه گروه به‌صورت پیش‌فرض `mention-only` است: پیام‌های قبلی گروه
    فقط وقتی گنجانده می‌شوند که خطاب به ربات بوده باشند، پاسخ به ربات باشند،
    یا پیام‌های خود ربات باشند. برای گنجاندن تاریخچه اخیر اتاق در گروه‌های مورد اعتماد،
    `includeGroupHistoryContext: "recent"` را تنظیم کنید. برای ارسال نکردن هیچ تاریخچه قبلی گروه Telegram
    در نوبت بعدی، `includeGroupHistoryContext: "none"` را تنظیم کنید.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    دریافت شناسه گفتگوی گروه:

    - یک پیام گروه را به `@userinfobot` / `@getidsbot` فوروارد کنید
    - یا `chat.id` را از `openclaw logs --follow` بخوانید
    - یا Bot API `getUpdates` را بررسی کنید
    - پس از مجاز شدن گروه، اگر فرمان‌های بومی فعال هستند، `/whoami@<bot_username>` را اجرا کنید

  </Tab>
</Tabs>

## رفتار زمان اجرا

- Telegram در مالکیت فرایند Gateway است.
- مسیریابی قطعی است: پاسخ‌های ورودی Telegram به Telegram برمی‌گردند (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به پوشش مشترک کانال با فراداده پاسخ، جای‌نگهدارهای رسانه، و زمینه زنجیره پاسخ ماندگارشده برای پاسخ‌های Telegram که Gateway مشاهده کرده است، نرمال‌سازی می‌شوند.
- نشست‌های گروهی با شناسه گروه ایزوله می‌شوند. موضوعات انجمن `:topic:<threadId>` را اضافه می‌کنند تا موضوعات ایزوله بمانند.
- پیام‌های DM می‌توانند `message_thread_id` داشته باشند؛ OpenClaw آن را برای پاسخ‌ها حفظ می‌کند. نشست‌های موضوعی DM فقط وقتی جدا می‌شوند که `getMe` در Telegram برای ربات `has_topics_enabled: true` گزارش کند؛ در غیر این صورت DMها روی نشست تخت باقی می‌مانند.
- Long polling از grammY runner با توالی‌بندی به‌ازای هر چت/هر رشته استفاده می‌کند. هم‌زمانی کلی runner sink از `agents.defaults.maxConcurrent` استفاده می‌کند.
- راه‌اندازی چندحسابی، کاوش‌های هم‌زمان Telegram `getMe` را محدود می‌کند تا ناوگان‌های بزرگ ربات همه کاوش‌های حساب‌ها را یک‌باره پخش نکنند.
- Long polling داخل هر فرایند Gateway محافظت می‌شود تا فقط یک poller فعال بتواند در هر لحظه از یک توکن ربات استفاده کند. اگر همچنان تداخل‌های `getUpdates` 409 می‌بینید، احتمالاً یک Gateway دیگر OpenClaw، اسکریپت، یا poller خارجی از همان توکن استفاده می‌کند.
- راه‌اندازی مجدد watchdog برای long-polling به‌طور پیش‌فرض پس از 120 ثانیه بدون liveness کامل‌شده `getUpdates` فعال می‌شود. فقط اگر استقرار شما همچنان هنگام کارهای طولانی‌مدت راه‌اندازی‌های مجدد کاذب polling-stall می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ بازنویسی‌های به‌ازای هر حساب پشتیبانی می‌شوند.
- Telegram Bot API از رسید خواندن پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

<Note>
  `channels.telegram.dm.threadReplies` و `channels.telegram.direct.<chatId>.threadReplies` حذف شده‌اند. اگر پیکربندی شما هنوز این کلیدها را دارد، پس از ارتقا `openclaw doctor --fix` را اجرا کنید. مسیریابی موضوعی DM اکنون از قابلیت ربات در Telegram `getMe.has_topics_enabled` پیروی می‌کند، که توسط حالت رشته‌ای BotFather کنترل می‌شود: ربات‌های دارای موضوع، وقتی Telegram مقدار `message_thread_id` را ارسال می‌کند، از نشست‌های DM محدود به رشته استفاده می‌کنند؛ سایر DMها روی نشست تخت باقی می‌مانند.
</Note>

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="پیش‌نمایش جریان زنده (ویرایش پیام)">
    OpenClaw می‌تواند پاسخ‌های جزئی را در زمان واقعی جریان دهد:

    - چت‌های مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/موضوعات: پیام پیش‌نمایش + `editMessageText`

    نیازمندی:

    - `channels.telegram.streaming` برابر با `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - پیش‌نمایش‌های کوتاه پاسخ اولیه debounce می‌شوند، سپس اگر اجرا هنوز فعال باشد پس از تأخیری محدود materialize می‌شوند
    - `progress` یک پیش‌نویس وضعیت قابل ویرایش را برای پیشرفت ابزار نگه می‌دارد، وقتی فعالیت پاسخ پیش از پیشرفت ابزار برسد برچسب وضعیت پایدار را نشان می‌دهد، در پایان آن را پاک می‌کند، و پاسخ نهایی را به‌صورت پیام عادی ارسال می‌کند
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده دوباره استفاده کنند یا نه (پیش‌فرض: وقتی جریان پیش‌نمایش فعال باشد `true`)
    - `streaming.preview.commandText` جزئیات فرمان/اجرا را داخل آن خط‌های پیشرفت ابزار کنترل می‌کند: `raw` (پیش‌فرض، رفتار منتشرشده را حفظ می‌کند) یا `status` (فقط برچسب ابزار)
    - `streaming.progress.commentary` (پیش‌فرض: `false`) متن commentary/مقدمه دستیار را در پیش‌نویس موقت پیشرفت فعال می‌کند
    - `channels.telegram.streamMode` قدیمی، مقادیر بولی `streaming`، و کلیدهای بازنشسته پیش‌نمایش پیش‌نویس بومی شناسایی می‌شوند؛ برای مهاجرت آن‌ها به پیکربندی فعلی streaming، `openclaw doctor --fix` را اجرا کنید

    به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار، خط‌های کوتاه وضعیتی هستند که هنگام اجرای ابزارها نشان داده می‌شوند، برای مثال اجرای فرمان، خواندن فایل، به‌روزرسانی‌های برنامه‌ریزی، خلاصه‌های patch، یا متن مقدمه/commentary در Codex در حالت app-server کدکس. Telegram این‌ها را به‌طور پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشده OpenClaw از `v2026.4.22` و بعد از آن همخوان باشد.

    برای نگه داشتن پیش‌نمایش ویرایش‌شده برای متن پاسخ اما پنهان کردن خط‌های پیشرفت ابزار، تنظیم کنید:

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

    زمانی از حالت `progress` استفاده کنید که پیشرفت قابل مشاهده ابزار را بدون ویرایش پاسخ نهایی در همان پیام می‌خواهید. سیاست متن فرمان را زیر `streaming.progress` قرار دهید:

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

    فقط زمانی از `streaming.mode: "off"` استفاده کنید که تحویل فقط نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و گفت‌وگوی عمومی ابزار/پیشرفت به‌جای ارسال به‌عنوان پیام‌های وضعیت مستقل، سرکوب می‌شود. اعلان‌های تأیید، payloadهای رسانه، و خطاها همچنان از مسیر تحویل نهایی عادی عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و خط‌های وضعیت پیشرفت ابزار را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    <Note>
      پاسخ‌های نقل‌قول انتخاب‌شده Telegram استثنا هستند. وقتی `replyToMode` برابر با `"first"`، `"all"`، یا `"batched"` باشد و پیام ورودی شامل متن نقل‌قول انتخاب‌شده باشد، OpenClaw پاسخ نهایی را به‌جای ویرایش پیش‌نمایش پاسخ، از مسیر بومی quote-reply در Telegram ارسال می‌کند؛ بنابراین `streaming.preview.toolProgress` نمی‌تواند خط‌های کوتاه وضعیت را برای آن نوبت نشان دهد. پاسخ‌های پیام فعلی بدون متن نقل‌قول انتخاب‌شده همچنان جریان پیش‌نمایش را نگه می‌دارند. وقتی دیده‌شدن پیشرفت ابزار از پاسخ‌های نقل‌قول بومی مهم‌تر است، `replyToMode: "off"` را تنظیم کنید، یا برای پذیرش این trade-off مقدار `streaming.preview.toolProgress: false` را تنظیم کنید.
    </Note>

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و ویرایش نهایی را درجا انجام می‌دهد
    - متن‌های نهایی طولانی که به چند پیام Telegram تقسیم می‌شوند، در صورت امکان از پیش‌نمایش موجود به‌عنوان نخستین قطعه نهایی دوباره استفاده می‌کنند، سپس فقط قطعه‌های باقی‌مانده را ارسال می‌کنند
    - نهایی‌های حالت progress پیش‌نویس وضعیت را پاک می‌کنند و به‌جای ویرایش پیش‌نویس به پاسخ، از تحویل نهایی عادی استفاده می‌کنند
    - اگر ویرایش نهایی پیش از تأیید متن کامل‌شده شکست بخورد، OpenClaw از تحویل نهایی عادی استفاده می‌کند و پیش‌نمایش stale را پاک‌سازی می‌کند

    برای پاسخ‌های پیچیده (برای مثال payloadهای رسانه)، OpenClaw به تحویل نهایی عادی fallback می‌کند و سپس پیام پیش‌نمایش را پاک‌سازی می‌کند.

    جریان پیش‌نمایش از جریان بلوکی جدا است. وقتی block streaming به‌طور صریح برای Telegram فعال باشد، OpenClaw برای جلوگیری از دو بار جریان دادن، جریان پیش‌نمایش را رد می‌کند.

    رفتار جریان reasoning:

    - `/reasoning stream` از مسیر پیش‌نمایش reasoning یک کانال پشتیبانی‌شده استفاده می‌کند؛ در Telegram، هنگام تولید، reasoning را در پیش‌نمایش زنده جریان می‌دهد
    - پیش‌نمایش reasoning پس از تحویل نهایی حذف می‌شود؛ وقتی reasoning باید قابل مشاهده بماند از `/reasoning on` استفاده کنید
    - پاسخ نهایی بدون متن reasoning ارسال می‌شود

  </Accordion>

  <Accordion title="قالب‌بندی پیام غنی">
    متن خروجی به‌طور پیش‌فرض از پیام‌های HTML استاندارد Telegram استفاده می‌کند تا پاسخ‌ها در کلاینت‌های فعلی Telegram خوانا بمانند. این حالت سازگاری از bold، italic، لینک‌ها، code، spoilerها، و quoteهای عادی پشتیبانی می‌کند، اما نه از بلوک‌های فقط غنی Bot API 10.1 مانند جدول‌های بومی، details، rich media، و فرمول‌ها.

    برای فعال کردن پیام‌های غنی Bot API 10.1 مقدار `channels.telegram.richMessages: true` را تنظیم کنید:

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
    - متن Markdown از طریق Markdown IR در OpenClaw رندر می‌شود و به‌عنوان HTML غنی Telegram ارسال می‌شود.
    - payloadهای HTML غنی صریح، tagهای پشتیبانی‌شده Bot API 10.1 مانند headingها، tableها، details، rich media، و formulaها را حفظ می‌کنند.
    - کپشن‌های رسانه همچنان از کپشن‌های HTML در Telegram استفاده می‌کنند، چون پیام‌های غنی جایگزین کپشن‌ها نمی‌شوند.

    این کار متن مدل را از نشانه‌های Telegram Rich Markdown دور نگه می‌دارد، بنابراین مقادیر پولی مانند `$400-600K` به‌عنوان ریاضی parse نمی‌شوند. متن غنی طولانی به‌طور خودکار در محدودیت‌های متن غنی و بلوک غنی Telegram تقسیم می‌شود. جدول‌هایی که از حد ستون Telegram بیشتر باشند، به‌عنوان بلوک‌های code ارسال می‌شوند.

    پیش‌فرض: برای سازگاری کلاینت خاموش است. پیام‌های غنی به کلاینت‌های سازگار Telegram نیاز دارند؛ برخی از کلاینت‌های فعلی Desktop، Web، Android، و شخص ثالث، پیام‌های غنی پذیرفته‌شده را به‌صورت پشتیبانی‌نشده نمایش می‌دهند. این گزینه را غیرفعال نگه دارید مگر اینکه هر کلاینتی که با ربات استفاده می‌شود بتواند آن‌ها را رندر کند. `/status` نشان می‌دهد که پیام‌های غنی برای نشست فعلی Telegram روشن است یا خاموش.

    پیش‌نمایش لینک‌ها به‌طور پیش‌فرض فعال است. `channels.telegram.linkPreview: false` تشخیص خودکار entity را برای متن غنی رد می‌کند.

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

    - نام‌ها نرمال‌سازی می‌شوند (حذف `/` ابتدایی، حروف کوچک)
    - الگوی معتبر: `a-z`، `0-9`، `_`، طول `1..32`
    - فرمان‌های سفارشی نمی‌توانند فرمان‌های بومی را override کنند
    - تداخل‌ها/تکراری‌ها رد می‌شوند و log می‌شوند

    نکته‌ها:

    - فرمان‌های سفارشی فقط ورودی‌های منو هستند؛ آن‌ها رفتار را خودکار پیاده‌سازی نمی‌کنند
    - فرمان‌های plugin/skill همچنان هنگام تایپ می‌توانند کار کنند، حتی اگر در منوی Telegram نشان داده نشوند

    اگر فرمان‌های بومی غیرفعال باشند، built-inها حذف می‌شوند. فرمان‌های سفارشی/plugin در صورت پیکربندی همچنان ممکن است ثبت شوند.

    خطاهای رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از trimming همچنان overflow شده است؛ فرمان‌های plugin/skill/سفارشی را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` با `404: Not Found` در حالی که فرمان‌های مستقیم curl برای Bot API کار می‌کنند، می‌تواند یعنی `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن ربات پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان شکست پاک‌سازی Webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای شبکه/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود است.

    ### فرمان‌های جفت‌سازی دستگاه (`device-pair` plugin)

    وقتی `device-pair` plugin نصب شده باشد:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در برنامه iOS paste کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (شامل نقش/دامنه‌ها)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر حمل می‌کند. bootstrap کد راه‌اندازی built-in فقط node-only است: نخستین اتصال یک درخواست node در انتظار ایجاد می‌کند، و پس از تأیید، Gateway یک توکن node بادوام با `scopes: []` برمی‌گرداند. توکن operator واگذارشده برنمی‌گرداند؛ دسترسی operator به یک جفت‌سازی operator تأییدشده جداگانه یا جریان توکن جداگانه نیاز دارد.

    اگر دستگاهی با جزئیات auth تغییرکرده دوباره تلاش کند (برای مثال نقش/دامنه‌ها/کلید عمومی)، درخواست در انتظار قبلی supersede می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید، `/pair pending` را دوباره اجرا کنید.

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

    نمونه دکمه Mini App:

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

    دکمه‌های `web_app` در Telegram فقط در گفت‌وگوهای خصوصی بین کاربر و
    ربات کار می‌کنند.

    کلیک‌های callback که یک کنترل‌گر تعاملی Plugin ثبت‌شده آن‌ها را ادعا نکند
    به‌صورت متن به عامل ارسال می‌شوند:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="کنش‌های پیام Telegram برای عامل‌ها و خودکارسازی">
    کنش‌های ابزار Telegram شامل موارد زیر است:

    - `sendMessage` (`to`, `content`, اختیاری `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` یا `caption`, دکمه‌های درون‌خطی اختیاری `presentation`؛ ویرایش‌های فقط‌دکمه‌ای نشانه‌گذاری پاسخ را به‌روزرسانی می‌کنند)
    - `createForumTopic` (`chatId`, `name`, اختیاری `iconColor`, `iconCustomEmojiId`)

    کنش‌های پیام کانال نام‌های مستعار کاربرپسند را در اختیار می‌گذارند (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    کنترل‌های محدودسازی:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌صورت پیش‌فرض فعال هستند و toggleهای جداگانه `channels.telegram.actions.*` ندارند.
    ارسال‌های زمان اجرا از snapshot فعال پیکربندی/اسرار استفاده می‌کنند (راه‌اندازی/بارگذاری مجدد)، بنابراین مسیرهای کنش برای هر ارسال، SecretRef را به‌صورت موردی دوباره resolve نمی‌کنند.

    معناشناسی حذف واکنش: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="برچسب‌های رشته پاسخ">
    Telegram از برچسب‌های صریح رشته پاسخ در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام محرک پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسه پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` نحوه مدیریت را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی رشته پاسخ فعال باشد و متن یا کپشن اصلی Telegram در دسترس باشد، OpenClaw به‌صورت خودکار یک بریده نقل‌قول بومی Telegram را اضافه می‌کند. Telegram متن نقل‌قول بومی را به 1024 واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل می‌شوند و اگر Telegram نقل‌قول را رد کند، به پاسخ ساده fallback می‌کنند.

    نکته: `off` رشته پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="موضوع‌های انجمن و رفتار رشته">
    ابرگروه‌های انجمن:

    - کلیدهای نشست موضوع، `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و تایپ کردن، رشته موضوع را هدف می‌گیرند
    - مسیر پیکربندی موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالت خاص موضوع عمومی (`threadId=1`):

    - ارسال پیام‌ها `message_thread_id` را حذف می‌کند (Telegram، `sendMessage(...thread_id=1)` را رد می‌کند)
    - کنش‌های تایپ کردن همچنان `message_thread_id` را شامل می‌شوند

    وراثت موضوع: ورودی‌های موضوع، تنظیمات گروه را به ارث می‌برند مگر اینکه بازنویسی شده باشند (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` فقط مخصوص موضوع است و از پیش‌فرض‌های گروه به ارث برده نمی‌شود.
    `topics."*"` پیش‌فرض‌ها را برای هر موضوع در آن گروه تنظیم می‌کند؛ شناسه‌های دقیق موضوع همچنان بر `"*"` مقدم‌اند.

    **مسیریابی عامل برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در پیکربندی موضوع به عامل متفاوتی مسیریابی شود. این به هر موضوع فضای کاری، حافظه و نشست جداگانه خودش را می‌دهد. نمونه:

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

    **اتصال پایدار موضوع ACP**: موضوع‌های انجمن می‌توانند نشست‌های harness مربوط به ACP را از طریق bindingهای تایپ‌شده ACP در سطح بالا pin کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و شناسه واجد شرایط موضوع مانند `-1001234567890:topic:42`). در حال حاضر به موضوع‌های انجمن در گروه‌ها/ابرگروه‌ها محدود است. [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

    **ایجاد ACP مقید به رشته از چت**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک نشست ACP جدید متصل می‌کند؛ پیگیری‌ها مستقیما به همان‌جا مسیریابی می‌شوند. OpenClaw تایید ایجاد را داخل موضوع pin می‌کند. نیاز دارد `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    زمینه قالب، `MessageThreadId` و `IsForum` را در اختیار می‌گذارد. چت‌های DM با `message_thread_id` فراداده پاسخ را نگه می‌دارند؛ آن‌ها فقط وقتی از کلیدهای نشست آگاه به رشته استفاده می‌کنند که `getMe` در Telegram برای ربات، `has_topics_enabled: true` را گزارش کند.
    بازنویسی‌های پیشین `dm.threadReplies` و `direct.*.threadReplies` عمدا بازنشسته شده‌اند؛ از حالت رشته‌ای BotFather به‌عنوان تنها منبع حقیقت استفاده کنید و برای حذف کلیدهای پیکربندی قدیمی `openclaw doctor --fix` را اجرا کنید.

  </Accordion>

  <Accordion title="صوت، ویدیو و استیکرها">
    ### پیام‌های صوتی

    Telegram بین یادداشت‌های صوتی و فایل‌های صوتی تمایز می‌گذارد.

    - پیش‌فرض: رفتار فایل صوتی
    - برچسب `[[audio_as_voice]]` در پاسخ عامل برای اجبار ارسال به‌صورت یادداشت صوتی
    - transcriptهای ورودی یادداشت صوتی در زمینه عامل به‌عنوان متن تولیدشده توسط ماشین و
      غیرقابل اعتماد قاب‌بندی می‌شوند؛ تشخیص mention همچنان از transcript خام استفاده می‌کند
      تا پیام‌های صوتی محدودشده با mention همچنان کار کنند.

    نمونه کنش پیام:

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

    نمونه کنش پیام:

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
    - TGS متحرک: نادیده گرفته می‌شود
    - WEBM ویدیویی: نادیده گرفته می‌شود

    فیلدهای زمینه استیکر:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    توضیحات استیکرها در وضعیت SQLite مربوط به Plugin در OpenClaw کش می‌شوند تا فراخوانی‌های تکراری vision کاهش یابد.

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

  <Accordion title="Reaction notifications">
    واکنش‌های Telegram به‌صورت به‌روزرسانی‌های `message_reaction` دریافت می‌شوند (جدا از بارهای پیام).

    وقتی فعال باشد، OpenClaw رویدادهای سیستمی مانند این را در صف قرار می‌دهد:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    یادداشت‌ها:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط بات (بهترین تلاش از طریق کش پیام‌های ارسال‌شده).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ فرستنده‌های غیرمجاز حذف می‌شوند.
    - Telegram در به‌روزرسانی‌های واکنش، شناسه‌های رشته گفتگو را ارائه نمی‌کند.
      - گروه‌های غیرفورومی به نشست گفتگوی گروه هدایت می‌شوند
      - گروه‌های فورومی به نشست موضوع عمومی گروه (`:topic:1`) هدایت می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌صورت خودکار شامل `message_reaction` است.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw، یک ایموجی تأیید ارسال می‌کند. `ackReactionScope` تعیین می‌کند آن ایموجی واقعاً *چه زمانی* ارسال شود.

    **ترتیب حل ایموجی (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت agent (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکات:

    - Telegram انتظار ایموجی یونیکد دارد (برای مثال "👀").
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

    **دامنه (`messages.ackReactionScope`):**

    ارائه‌دهنده Telegram دامنه را از `messages.ackReactionScope` می‌خواند (پیش‌فرض `"group-mentions"`). در حال حاضر هیچ بازنویسی در سطح حساب Telegram یا سطح کانال Telegram وجود ندارد.

    مقادیر: `"all"` (پیام‌های مستقیم + گروه‌ها)، `"direct"` (فقط پیام‌های مستقیم)، `"group-all"` (هر پیام گروهی، بدون پیام مستقیم)، `"group-mentions"` (گروه‌ها زمانی که بات mention شود؛ **بدون پیام مستقیم** — این پیش‌فرض است)، `"off"` / `"none"` (غیرفعال).

    <Note>
    دامنه پیش‌فرض (`"group-mentions"`) واکنش‌های تأیید را در پیام‌های مستقیم فعال نمی‌کند. برای دریافت واکنش تأیید در پیام‌های مستقیم ورودی Telegram، `messages.ackReactionScope` را روی `"direct"` یا `"all"` تنظیم کنید. این مقدار هنگام راه‌اندازی ارائه‌دهنده Telegram خوانده می‌شود، بنابراین برای اعمال تغییر باید gateway دوباره راه‌اندازی شود.
    </Note>

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی کانال به‌طور پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های فعال‌شده توسط Telegram شامل موارد زیر است:

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

    در حالت long-polling، OpenClaw نشانگر آبِ شروع مجدد خود را فقط پس از ارسال موفق یک به‌روزرسانی پایدار می‌کند. اگر یک handler شکست بخورد، آن به‌روزرسانی در همان فرایند قابل تلاش دوباره باقی می‌ماند و برای حذف تکرار پس از شروع مجدد، به‌عنوان تکمیل‌شده نوشته نمی‌شود.

    شنونده محلی به `127.0.0.1:8787` متصل می‌شود. برای ورودی عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا عمداً `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook محافظ‌های درخواست، توکن محرمانه Telegram، و بدنه JSON را پیش از بازگرداندن `200` به Telegram اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان مسیرهای بات به‌ازای هر گفتگو/هر موضوع که در long polling استفاده می‌شوند پردازش می‌کند، بنابراین نوبت‌های کند agent، ACK تحویل Telegram را نگه نمی‌دارند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش دوباره، و اهداف CLI">
    - مقدار پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خطوط خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازه رسانه ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.mediaGroupFlushMs` (پیش‌فرض 500) کنترل می‌کند آلبوم‌ها/گروه‌های رسانه‌ای Telegram چه مدت در بافر نگه داشته شوند تا OpenClaw آن‌ها را به‌صورت یک پیام ورودی ارسال کند. اگر بخش‌های آلبوم دیر می‌رسند، آن را افزایش دهید؛ برای کاهش تاخیر پاسخ آلبوم، آن را کاهش دهید.
    - `channels.telegram.timeoutSeconds` مهلت زمانی کلاینت API Telegram را بازنویسی می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های ربات مقادیر پیکربندی‌شده پایین‌تر از گارد درخواست 60 ثانیه‌ای متن/تایپ خروجی را محدود می‌کنند تا grammY تحویل پاسخ قابل مشاهده را پیش از اجرای گارد انتقال و fallback در OpenClaw لغو نکند. long polling همچنان از گارد درخواست 45 ثانیه‌ای `getUpdates` استفاده می‌کند تا pollهای بیکار برای همیشه رها نشوند.
    - مقدار پیش‌فرض `channels.telegram.pollingStallThresholdMs` برابر `120000` است؛ فقط برای راه‌اندازی‌های دوباره کاذب ناشی از polling-stall، آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچه زمینه گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` (پیش‌فرض 50) استفاده می‌کند؛ `0` آن را غیرفعال می‌کند.
    - زمینه تکمیلی reply/quote/forward وقتی Gateway پیام‌های والد را مشاهده کرده باشد، در یک پنجره زمینه مکالمه انتخاب‌شده نرمال‌سازی می‌شود؛ cache پیام‌های مشاهده‌شده در وضعیت Plugin SQLite مربوط به OpenClaw نگهداری می‌شود، و `openclaw doctor --fix` sidecarهای قدیمی را وارد می‌کند. Telegram فقط یک `reply_to_message` کم‌عمق را در updateها شامل می‌کند، بنابراین زنجیره‌های قدیمی‌تر از cache به payload فعلی update در Telegram محدود هستند.
    - فهرست‌های مجاز Telegram در درجه اول کنترل می‌کنند چه کسی می‌تواند agent را فعال کند، نه اینکه یک مرز کامل برای حذف زمینه تکمیلی باشند.
    - کنترل‌های تاریخچه DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای API خروجی قابل بازیابی، روی کمک‌کننده‌های ارسال Telegram (CLI/tools/actions) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای شکست‌های پیش از اتصال Telegram از تلاش دوباره bounded safe-send استفاده می‌کند، اما envelopeهای شبکه‌ای مبهم پس از ارسال را که ممکن است پیام‌های قابل مشاهده را تکراری کنند دوباره تلاش نمی‌کند.

    اهداف ارسال CLI و message-tool می‌توانند شناسه عددی چت، نام کاربری، یا هدف topic در forum باشند:

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

    flagهای poll فقط برای Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` برای topicهای forum (یا از هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین از این موارد پشتیبانی می‌کند:

    - `--presentation` همراه با بلوک‌های `buttons` برای صفحه‌کلیدهای inline، وقتی `channels.telegram.capabilities.inlineButtons` اجازه دهد
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل سنجاق‌شده، وقتی ربات بتواند در آن چت pin کند
    - `--force-document` برای ارسال تصاویر، GIFها، و ویدئوهای خروجی به‌صورت سند به‌جای آپلودهای عکس فشرده، رسانه متحرک، یا ویدئو

    کنترل اقدام‌ها:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ایجاد poll در Telegram را غیرفعال می‌کند، در حالی که ارسال‌های معمولی همچنان فعال می‌مانند

  </Accordion>

  <Accordion title="تاییدهای exec در Telegram">
    Telegram از تاییدهای exec در DMهای تاییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در چت یا topic مبدا ارسال کند. تاییدکننده‌ها باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی دست‌کم یک تاییدکننده قابل resolve باشد، به‌صورت خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی owner از `commands.ownerAllowFrom` برمی‌گردد)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom`، و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با ربات صحبت کند و ربات پاسخ‌های عادی را کجا بفرستد. آن‌ها کسی را به تاییدکننده exec تبدیل نمی‌کنند. نخستین جفت‌سازی DM تاییدشده، وقتی هنوز هیچ owner فرمانی وجود ندارد، `commands.ownerAllowFrom` را راه‌اندازی می‌کند؛ بنابراین راه‌اندازی تک-owner همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل channel متن فرمان را در چت نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/topicهای مورد اعتماد فعال کنید. وقتی prompt در یک topic forum قرار می‌گیرد، OpenClaw همان topic را برای prompt تایید و follow-up حفظ می‌کند. تاییدهای exec به‌صورت پیش‌فرض پس از 30 دقیقه منقضی می‌شوند.

    دکمه‌های تایید inline همچنین نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group`، یا `all`) را مجاز کند. شناسه‌های تایید با پیشوند `plugin:` از طریق تاییدهای plugin resolve می‌شوند؛ سایر موارد ابتدا از طریق تاییدهای exec resolve می‌شوند.

    [تاییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی agent با خطای تحویل یا provider روبه‌رو می‌شود، سیاست خطا کنترل می‌کند آیا پیام‌های خطا به چت Telegram ارسال شوند یا نه:

| کلید                                | مقادیر                    | پیش‌فرض        | توضیح                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — هر پیام خطا را به چت ارسال می‌کند. `once` — هر پیام خطای یکتا را یک بار در هر پنجره cooldown ارسال می‌کند (خطاهای یکسان تکراری را سرکوب می‌کند). `silent` — هرگز پیام‌های خطا را به چت ارسال نمی‌کند. |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | پنجره cooldown برای سیاست `once`. پس از ارسال یک خطا، همان پیام خطا تا پایان این بازه سرکوب می‌شود. از اسپم خطا هنگام قطعی‌ها جلوگیری می‌کند.                                      |

بازنویسی‌های هر حساب، هر گروه، و هر topic پشتیبانی می‌شوند (با همان وراثت سایر کلیدهای پیکربندی Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ wildcard `"*"` را نمی‌توان از نظر عضویت probe کرد.
    - آزمایش سریع session: `/activation always`.

  </Accordion>

  <Accordion title="ربات اصلا پیام‌های گروه را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا `"*"` را شامل شود)
    - عضویت ربات در گروه را بررسی کنید
    - logها را بررسی کنید: `openclaw logs --follow` برای دلایل skip

  </Accordion>

  <Accordion title="فرمان‌ها ناقص کار می‌کنند یا اصلا کار نمی‌کنند">

    - هویت فرستنده خود را authorize کنید (pairing و/یا `allowFrom` عددی)
    - مجوز فرمان حتی وقتی سیاست گروه `open` است همچنان اعمال می‌شود
    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی native ورودی‌های بسیار زیادی دارد؛ فرمان‌های plugin/skill/custom را کاهش دهید یا منوهای native را غیرفعال کنید
    - فراخوانی‌های startup مربوط به `deleteMyCommands` / `setMyCommands` و فراخوانی‌های تایپ `sendChatAction` bounded هستند و هنگام request timeout یک بار از طریق fallback انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار network/fetch معمولا نشان‌دهنده مشکلات دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="Startup توکن unauthorized گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای توکن پیکربندی‌شده ربات است.
    - توکن ربات را در BotFather دوباره کپی یا regenerate کنید، سپس `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken`، یا `TELEGRAM_BOT_TOKEN` را برای حساب پیش‌فرض به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام startup نیز یک شکست auth است؛ برخورد با آن به‌عنوان «هیچ webhookی وجود ندارد» فقط همان شکست bad-token را به فراخوانی‌های API بعدی موکول می‌کند.

  </Accordion>

  <Accordion title="ناپایداری polling یا شبکه">

    - Node 22+ همراه با fetch/proxy سفارشی می‌تواند در صورت ناهماهنگی انواع AbortSignal رفتار abort فوری ایجاد کند.
    - برخی hostها `api.telegram.org` را ابتدا به IPv6 resolve می‌کنند؛ egress خراب IPv6 می‌تواند باعث شکست‌های متناوب API در Telegram شود.
    - اگر logها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این موارد را به‌عنوان خطاهای شبکه قابل بازیابی دوباره تلاش می‌کند.
    - هنگام startup مربوط به polling، OpenClaw probe موفق startup یعنی `getMe` را برای grammY دوباره استفاده می‌کند تا runner پیش از نخستین `getUpdates` به `getMe` دوم نیاز نداشته باشد.
    - اگر `deleteWebhook` هنگام startup مربوط به polling با یک خطای شبکه گذرا شکست بخورد، OpenClaw به‌جای انجام یک فراخوانی control-plane دیگر پیش از poll، وارد long polling می‌شود. webhook همچنان فعال به‌صورت conflict در `getUpdates` ظاهر می‌شود؛ سپس OpenClaw انتقال Telegram را دوباره می‌سازد و cleanup مربوط به webhook را دوباره تلاش می‌کند.
    - اگر socketهای Telegram با یک cadence کوتاه ثابت recycle می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ کلاینت‌های ربات مقادیر پیکربندی‌شده پایین‌تر از گاردهای درخواست خروجی و `getUpdates` را محدود می‌کنند، اما نسخه‌های قدیمی‌تر ممکن بود وقتی این مقدار پایین‌تر از آن گاردها تنظیم شده بود، هر poll یا پاسخ را abort کنند.
    - اگر logها شامل `Polling stall detected` باشند، OpenClaw به‌صورت پیش‌فرض پس از 120 ثانیه بدون liveness کامل long-poll، polling را دوباره راه‌اندازی و انتقال Telegram را دوباره می‌سازد.
    - `openclaw channels status --probe` و `openclaw doctor` وقتی یک حساب polling در حال اجرا پس از مهلت startup، `getUpdates` را کامل نکرده باشد، وقتی یک حساب webhook در حال اجرا پس از مهلت startup، `setWebhook` را کامل نکرده باشد، یا وقتی آخرین فعالیت موفق انتقال polling قدیمی باشد، هشدار می‌دهند.
    - `channels.telegram.pollingStallThresholdMs` را فقط وقتی افزایش دهید که فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما host شما همچنان restartهای کاذب polling-stall گزارش می‌کند. stallهای پایدار معمولا به مشکلات proxy، DNS، IPv6، یا TLS egress بین host و `api.telegram.org` اشاره دارند.
    - Telegram همچنین env مربوط به proxy فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY`، و نسخه‌های lowercase آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌تواند `api.telegram.org` را bypass کند.
    - اگر proxy مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای یک محیط service پیکربندی شده باشد و هیچ env استاندارد proxy وجود نداشته باشد، Telegram نیز از همان URL برای انتقال Bot API استفاده می‌کند.
    - روی hostهای VPS با egress/TLS مستقیم ناپایدار، فراخوانی‌های API Telegram را از طریق `channels.telegram.proxy` route کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - پیش‌فرض Node 22+ برابر `autoSelectFamily=true` است (به‌جز WSL2). ترتیب نتیجه‌های DNS برای Telegram ابتدا از `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، سپس از `channels.telegram.network.dnsResultOrder`، و بعد از پیش‌فرض فرایند مانند `NODE_OPTIONS=--dns-result-order=ipv4first` پیروی می‌کند؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` برمی‌گردد.
    - اگر میزبان شما WSL2 است یا به‌طور صریح با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب خانواده را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های بازه بنچمارک RFC 2544 (`198.18.0.0/15`) از پیش به‌طور پیش‌فرض
      برای دانلود رسانه‌های Telegram مجاز هستند. اگر یک fake-IP قابل اعتماد یا
      پراکسی شفاف، `api.telegram.org` را هنگام دانلود رسانه‌ها به یک نشانی
      خصوصی/داخلی/کاربرد-ویژه دیگر بازنویسی کند، می‌توانید گذر فقط مخصوص
      Telegram را فعال کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین فعال‌سازی اختیاری برای هر حساب نیز در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر پراکسی شما میزبان‌های رسانه Telegram را به `198.18.x.x` resolve می‌کند، ابتدا
      پرچم خطرناک را خاموش نگه دارید. رسانه Telegram از پیش به‌طور پیش‌فرض بازه
      بنچمارک RFC 2544 را مجاز می‌داند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانه
      Telegram را ضعیف می‌کند. فقط در محیط‌های پراکسی قابل اعتماد و تحت کنترل اپراتور
      مانند مسیریابی fake-IP در Clash، Mihomo، یا Surge از آن استفاده کنید، وقتی که
      پاسخ‌های خصوصی یا کاربرد-ویژه خارج از بازه بنچمارک RFC 2544 تولید می‌کنند.
      برای دسترسی عادی Telegram از اینترنت عمومی، آن را خاموش نگه دارید.
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

<Accordion title="High-signal Telegram fields">

- راه‌اندازی/احراز هویت: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` باید به یک فایل عادی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, سطح بالای `bindings[]` (`type: "acp"`)
- پیش‌فرض‌های topic: `groups.<chatId>.topics."*"` برای topicهای forum بدون تطابق اعمال می‌شود؛ شناسه‌های دقیق topic آن را override می‌کنند
- تاییدیه‌های exec: `execApprovals`, `accounts.*.execApprovals`
- فرمان/منو: `commands.native`, `commands.nativeSkills`, `customCommands`
- threadها/پاسخ‌ها: `replyToMode`
- streaming: `streaming` (پیش‌نمایش), `streaming.preview.toolProgress`, `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ `/bot<TOKEN>` را شامل نکنید)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- کنش‌ها/قابلیت‌ها: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- واکنش‌ها: `reactionNotifications`, `reactionLevel`
- خطاها: `errorPolicy`, `errorCooldownMs`
- نوشتن‌ها/تاریخچه: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را اضافه کنید) تا مسیریابی پیش‌فرض صریح باشد. در غیر این صورت OpenClaw به نخستین شناسه حساب نرمال‌شده برمی‌گردد و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقادیر `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را با Gateway جفت کنید.
  </Card>
  <Card title="Groups" icon="users" href="/fa/channels/groups">
    رفتار allowlist برای گروه و topic.
  </Card>
  <Card title="Channel routing" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="Security" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/fa/concepts/multi-agent">
    گروه‌ها و topicها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی.
  </Card>
</CardGroup>

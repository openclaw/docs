---
read_when:
    - کار روی ویژگی‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-06-30T14:11:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e143096bbcdf949ef11566ffe2a5360eea261cd5bf99f0cf90d31c8e9d4637d6
    source_path: channels/telegram.md
    workflow: 16
---

آمادهٔ استفاده در تولید برای پیام‌های خصوصی ربات و گروه‌ها از طریق grammY. Long polling حالت پیش‌فرض است؛ حالت webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام خصوصی برای Telegram جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های بین‌کانالی و راهنماهای اجرایی تعمیر.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و نمونه‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="توکن ربات را در BotFather بسازید">
    Telegram را باز کنید و با **@BotFather** گفتگو کنید (تأیید کنید که شناسه دقیقاً `@BotFather` است).

    `/newbot` را اجرا کنید، اعلان‌ها را دنبال کنید و توکن را ذخیره کنید.

  </Step>

  <Step title="توکن و سیاست پیام خصوصی را پیکربندی کنید">

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

  <Step title="Gateway را شروع کنید و اولین پیام خصوصی را تأیید کنید">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.

  </Step>

  <Step title="ربات را به یک گروه اضافه کنید">
    ربات را به گروه خود اضافه کنید، سپس هر دو شناسه‌ای را که دسترسی گروه نیاز دارد دریافت کنید:

    - شناسه کاربر Telegram شما، که در `allowFrom` / `groupAllowFrom` استفاده می‌شود
    - شناسه گفتگوی گروه Telegram، که به‌عنوان کلید زیر `channels.telegram.groups` استفاده می‌شود

    برای راه‌اندازی نخستین‌بار، شناسه گفتگوی گروه را از `openclaw logs --follow`، یک ربات forwarded-ID، یا `getUpdates` در Bot API بگیرید. پس از مجاز شدن گروه، `/whoami@<bot_username>` می‌تواند شناسه‌های کاربر و گروه را تأیید کند.

    شناسه‌های منفی سوپرگروه Telegram که با `-100` شروع می‌شوند، شناسه‌های گفتگوی گروه هستند. آن‌ها را زیر `channels.telegram.groups` قرار دهید، نه زیر `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتیب تعیین توکن از حساب آگاه است. در عمل، مقدارهای config بر جایگزین env اولویت دارند، و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
پس از راه‌اندازی موفق، OpenClaw هویت ربات را تا ۲۴ ساعت در دایرکتوری state کش می‌کند تا راه‌اندازی‌های مجدد بتوانند از یک فراخوانی اضافی `getMe` در Telegram جلوگیری کنند؛ تغییر دادن یا حذف کردن توکن این کش را پاک می‌کند.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و دیده‌شدن در گروه">
    ربات‌های Telegram به‌صورت پیش‌فرض از **Privacy Mode** استفاده می‌کنند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر ربات باید همه پیام‌های گروه را ببیند، یکی از این دو کار را انجام دهید:

    - حالت حریم خصوصی را از طریق `/setprivacy` غیرفعال کنید، یا
    - ربات را ادمین گروه کنید.

    هنگام تغییر حالت حریم خصوصی، ربات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت ادمین در تنظیمات گروه Telegram کنترل می‌شود.

    ربات‌های ادمین همه پیام‌های گروه را دریافت می‌کنند، که برای رفتار گروهی همیشه‌فعال مفید است.

  </Accordion>

  <Accordion title="گزینه‌های مفید BotFather">

    - `/setjoingroups` برای اجازه دادن/ندادن به افزودن به گروه
    - `/setprivacy` برای رفتار دیده‌شدن در گروه

  </Accordion>
</AccordionGroup>

## کنترل دسترسی و فعال‌سازی

### هویت ربات گروه

در گروه‌ها و موضوعات انجمنی Telegram، ذکر صریح شناسه ربات پیکربندی‌شده (برای مثال `@my_bot`) به‌عنوان خطاب به عامل انتخاب‌شده OpenClaw در نظر گرفته می‌شود، حتی وقتی نام شخصیت عامل با نام کاربری Telegram تفاوت دارد. سیاست سکوت گروه همچنان برای ترافیک نامرتبط گروه اعمال می‌شود، اما خود شناسه ربات «شخص دیگری» محسوب نمی‌شود.

<Tabs>
  <Tab title="سیاست پیام خصوصی">
    `channels.telegram.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (نیازمند دست‌کم یک شناسه فرستنده در `allowFrom`)
    - `open` (نیازمند این است که `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` به هر حساب Telegram که نام کاربری ربات را پیدا یا حدس بزند اجازه می‌دهد به ربات فرمان بدهد. فقط برای ربات‌های عمداً عمومی با ابزارهای به‌شدت محدود از آن استفاده کنید؛ ربات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربر Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در پیکربندی‌های چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های `allowFrom: ["*"]` در سطح حساب، آن حساب را عمومی نمی‌کنند مگر اینکه allowlist مؤثر حساب پس از ادغام همچنان شامل یک wildcard صریح باشد.
    `dmPolicy: "allowlist"` با `allowFrom` خالی همه پیام‌های خصوصی را مسدود می‌کند و توسط اعتبارسنجی config رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند.
    اگر ارتقا داده‌اید و config شما شامل ورودی‌های allowlist از نوع `@username` است، برای resolve کردن آن‌ها `openclaw doctor --fix` را اجرا کنید (best-effort؛ نیازمند توکن ربات Telegram).
    اگر پیش‌تر به فایل‌های allowlist در pairing-store متکی بودید، `openclaw doctor --fix` می‌تواند در جریان‌های allowlist ورودی‌ها را به `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز شناسه صریحی ندارد).

    برای ربات‌های تک‌مالک، `dmPolicy: "allowlist"` را با شناسه‌های عددی صریح `allowFrom` ترجیح دهید تا سیاست دسترسی در config پایدار بماند (به‌جای وابستگی به تأییدهای قبلی جفت‌سازی).

    ابهام رایج: تأیید جفت‌سازی پیام خصوصی به معنای «این فرستنده همه‌جا مجاز است» نیست.
    جفت‌سازی دسترسی پیام خصوصی را اعطا می‌کند. اگر هنوز مالک فرمانی وجود نداشته باشد، نخستین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط‌مالک و تأییدهای exec یک حساب اپراتور صریح داشته باشند.
    مجوزدهی به فرستنده گروه همچنان از allowlistهای صریح config می‌آید.
    اگر می‌خواهید «یک‌بار مجاز شده‌ام و هم پیام‌های خصوصی و هم فرمان‌های گروه کار کنند»، شناسه عددی کاربر Telegram خود را در `channels.telegram.allowFrom` قرار دهید؛ برای فرمان‌های فقط‌مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### یافتن شناسه کاربر Telegram خود

    امن‌تر (بدون ربات شخص ثالث):

    1. به ربات خود پیام خصوصی بدهید.
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
       - بدون config برای `groups`:
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسه گروه را پشت سر بگذارد
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها تا زمانی که ورودی‌های `groups` (یا `"*"`) را اضافه کنید مسدود می‌شوند
       - `groups` پیکربندی‌شده: مانند allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستنده گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` بازمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربر Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های گفتگوی گروه یا سوپرگروه Telegram را در `groupAllowFrom` قرار ندهید. شناسه‌های گفتگوی منفی زیر `channels.telegram.groups` قرار می‌گیرند.
    ورودی‌های غیرعددی برای مجوزدهی فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز مجوز فرستنده گروه، تأییدهای pairing-store پیام خصوصی را **به ارث نمی‌برد**.
    جفت‌سازی فقط برای پیام خصوصی باقی می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` در سطح هر گروه/هر موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به config `allowFrom` بازمی‌گردد، نه pairing store.
    الگوی عملی برای ربات‌های تک‌مالک: شناسه کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکته runtime: اگر `channels.telegram` کاملاً وجود نداشته باشد، runtime به‌صورت پیش‌فرض با `groupPolicy="allowlist"` بسته‌می‌ماند، مگر اینکه `channels.defaults.groupPolicy` صریحاً تنظیم شده باشد.

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

    آن را از گروه با `@<bot_username> ping` آزمایش کنید. پیام‌های ساده گروه تا وقتی `requireMention: true` است ربات را فعال نمی‌کنند.

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

    مثال: فقط کاربران مشخص در یک گروه مشخص مجاز باشند:

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

      - شناسه‌های منفی گروه یا سوپرگروه Telegram مانند `-1001234567890` را زیر `channels.telegram.groups` قرار دهید.
      - وقتی می‌خواهید محدود کنید کدام افراد داخل یک گروه مجاز بتوانند ربات را فعال کنند، شناسه‌های کاربر Telegram مانند `8734062810` را زیر `groupAllowFrom` قرار دهید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با ربات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="رفتار mention">
    پاسخ‌های گروه به‌صورت پیش‌فرض نیازمند mention هستند.

    mention می‌تواند از این موارد بیاید:

    - mention بومی `@botusername`، یا
    - الگوهای mention در:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    تغییر وضعیت فرمان در سطح نشست:

    - `/activation always`
    - `/activation mention`

    این‌ها فقط state نشست را به‌روزرسانی می‌کنند. برای ماندگاری از config استفاده کنید.

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
    فقط وقتی شامل می‌شوند که خطاب به ربات بوده باشند، پاسخ به ربات باشند،
    یا پیام‌های خود ربات باشند. برای گنجاندن تاریخچه اخیر اتاق برای گروه‌های مورداعتماد،
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

    گرفتن شناسه گفتگوی گروه:

    - یک پیام گروه را به `@userinfobot` / `@getidsbot` فوروارد کنید
    - یا `chat.id` را از `openclaw logs --follow` بخوانید
    - یا `getUpdates` در Bot API را بررسی کنید
    - پس از مجاز شدن گروه، اگر فرمان‌های بومی فعال هستند، `/whoami@<bot_username>` را اجرا کنید

  </Tab>
</Tabs>

## رفتار runtime

- Telegram در مالکیت فرایند gateway است.
- مسیریابی قطعی است: پاسخ‌های ورودی Telegram به Telegram برمی‌گردند (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به پاکت مشترک کانال نرمال‌سازی می‌شوند و شامل فراداده پاسخ، نگهدارنده‌های رسانه، و زمینه زنجیره پاسخِ پایدارشده برای پاسخ‌های Telegram هستند که gateway مشاهده کرده است.
- نشست‌های گروهی بر اساس شناسه گروه ایزوله می‌شوند. موضوعات تالار `:topic:<threadId>` را اضافه می‌کنند تا موضوعات ایزوله بمانند.
- پیام‌های DM می‌توانند `message_thread_id` داشته باشند؛ OpenClaw آن را برای پاسخ‌ها حفظ می‌کند. نشست‌های موضوعی DM فقط وقتی جدا می‌شوند که `getMe` در Telegram برای ربات `has_topics_enabled: true` گزارش کند؛ در غیر این صورت DMها روی نشست تخت باقی می‌مانند.
- long polling از grammY runner با توالی‌بندی به‌ازای هر گفت‌وگو/هر نخ استفاده می‌کند. هم‌روندی کلی runner sink از `agents.defaults.maxConcurrent` استفاده می‌کند.
- راه‌اندازی چندحسابی، probeهای هم‌روند Telegram `getMe` را محدود می‌کند تا ناوگان‌های بزرگ ربات همه probeهای حساب‌ها را هم‌زمان منشعب نکنند.
- Long polling داخل هر فرایند gateway محافظت می‌شود تا در هر زمان فقط یک poller فعال بتواند از یک توکن ربات استفاده کند. اگر همچنان تداخل‌های 409 در `getUpdates` می‌بینید، احتمالاً یک gateway دیگر OpenClaw، اسکریپت، یا poller خارجی از همان توکن استفاده می‌کند.
- راه‌اندازی‌های مجدد نگهبان long-polling به‌صورت پیش‌فرض پس از 120 ثانیه بدون liveness کامل‌شده `getUpdates` فعال می‌شوند. `channels.telegram.pollingStallThresholdMs` را فقط وقتی افزایش دهید که استقرار شما هنوز هنگام کارهای طولانی‌مدت راه‌اندازی مجدد کاذب polling-stall می‌بیند. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ overrideهای به‌ازای هر حساب پشتیبانی می‌شوند.
- Telegram Bot API از رسید خواندن پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

<Note>
  `channels.telegram.dm.threadReplies` و `channels.telegram.direct.<chatId>.threadReplies` حذف شده‌اند. اگر پیکربندی شما هنوز این کلیدها را دارد، پس از ارتقا `openclaw doctor --fix` را اجرا کنید. مسیریابی موضوع DM اکنون از قابلیت ربات در Telegram `getMe.has_topics_enabled` پیروی می‌کند که توسط حالت رشته‌ای BotFather کنترل می‌شود: ربات‌های دارای موضوع وقتی Telegram `message_thread_id` می‌فرستد از نشست‌های DM محدوده‌بندی‌شده به نخ استفاده می‌کنند؛ سایر DMها روی نشست تخت می‌مانند.
</Note>

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="پیش‌نمایش پخش زنده (ویرایش پیام‌ها)">
    OpenClaw می‌تواند پاسخ‌های جزئی را بی‌درنگ پخش کند:

    - گفت‌وگوهای مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/موضوعات: پیام پیش‌نمایش + `editMessageText`

    نیازمندی:

    - `channels.telegram.streaming` برابر `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - پیش‌نمایش‌های کوتاه پاسخ اولیه debounce می‌شوند، سپس اگر اجرا هنوز فعال باشد پس از تأخیری محدود materialize می‌شوند
    - `progress` یک پیش‌نویس وضعیت قابل ویرایش را برای پیشرفت ابزار نگه می‌دارد، وقتی فعالیت پاسخ پیش از پیشرفت ابزار برسد برچسب وضعیت پایدار را نشان می‌دهد، در پایان آن را پاک می‌کند، و پاسخ نهایی را به‌صورت پیام عادی می‌فرستد
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده استفاده کنند یا نه (پیش‌فرض: وقتی پخش پیش‌نمایش فعال است `true`)
    - `streaming.preview.commandText` جزئیات command/exec را داخل آن خط‌های پیشرفت ابزار کنترل می‌کند: `raw` (پیش‌فرض، رفتار منتشرشده را حفظ می‌کند) یا `status` (فقط برچسب ابزار)
    - `streaming.progress.commentary` (پیش‌فرض: `false`) متن توضیح/مقدمه assistant را در پیش‌نویس موقت پیشرفت فعال می‌کند
    - `channels.telegram.streamMode` قدیمی، مقدارهای بولی `streaming`، و کلیدهای بازنشسته پیش‌نمایش پیش‌نویس بومی شناسایی می‌شوند؛ برای مهاجرت آن‌ها به پیکربندی streaming فعلی `openclaw doctor --fix` را اجرا کنید

    به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار، خط‌های کوتاه وضعیتی هستند که هنگام اجرای ابزارها نشان داده می‌شوند؛ برای مثال اجرای فرمان، خواندن فایل، به‌روزرسانی‌های برنامه‌ریزی، خلاصه‌های patch، یا متن مقدمه/توضیح Codex در حالت app-server Codex. Telegram این‌ها را به‌صورت پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشده OpenClaw از `v2026.4.22` و بعد از آن هماهنگ باشد.

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

    وقتی پیشرفت قابل مشاهده ابزار را بدون ویرایش پاسخ نهایی در همان پیام می‌خواهید، از حالت `progress` استفاده کنید. سیاست متن فرمان را زیر `streaming.progress` بگذارید:

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

    از `streaming.mode: "off"` فقط وقتی استفاده کنید که تحویل فقط نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و گفت‌وگوی عمومی ابزار/پیشرفت به‌جای ارسال به‌صورت پیام‌های وضعیت مستقل، سرکوب می‌شود. درخواست‌های تأیید، payloadهای رسانه، و خطاها همچنان از مسیر تحویل نهایی عادی عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و خط‌های وضعیت پیشرفت ابزار را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    <Note>
      پاسخ‌های نقل‌قول انتخاب‌شده Telegram استثنا هستند. وقتی `replyToMode` برابر `"first"`، `"all"`، یا `"batched"` است و پیام ورودی متن نقل‌قول انتخاب‌شده دارد، OpenClaw پاسخ نهایی را به‌جای ویرایش پیش‌نمایش پاسخ، از مسیر بومی quote-reply در Telegram می‌فرستد؛ بنابراین `streaming.preview.toolProgress` نمی‌تواند خط‌های کوتاه وضعیت را برای آن نوبت نشان دهد. پاسخ‌های پیام فعلی بدون متن نقل‌قول انتخاب‌شده همچنان پخش پیش‌نمایش را نگه می‌دارند. وقتی نمایانی پیشرفت ابزار از پاسخ‌های نقل‌قول بومی مهم‌تر است، `replyToMode: "off"` را تنظیم کنید، یا برای پذیرفتن این بده‌بستان `streaming.preview.toolProgress: false` را تنظیم کنید.
    </Note>

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و ویرایش نهایی را درجا انجام می‌دهد
    - متن‌های نهایی طولانی که به چند پیام Telegram تقسیم می‌شوند، در صورت امکان از پیش‌نمایش موجود به‌عنوان نخستین قطعه نهایی استفاده می‌کنند، سپس فقط قطعه‌های باقی‌مانده را می‌فرستند
    - خروجی‌های نهایی حالت progress پیش‌نویس وضعیت را پاک می‌کنند و به‌جای ویرایش پیش‌نویس به پاسخ، از تحویل نهایی عادی استفاده می‌کنند
    - اگر ویرایش نهایی پیش از تأیید متن کامل‌شده شکست بخورد، OpenClaw از تحویل نهایی عادی استفاده می‌کند و پیش‌نمایش قدیمی را پاک‌سازی می‌کند

    برای پاسخ‌های پیچیده (برای مثال payloadهای رسانه)، OpenClaw به تحویل نهایی عادی fallback می‌کند و سپس پیام پیش‌نمایش را پاک‌سازی می‌کند.

    پخش پیش‌نمایش از پخش block جدا است. وقتی پخش block صراحتاً برای Telegram فعال شده باشد، OpenClaw برای جلوگیری از پخش دوگانه، پخش پیش‌نمایش را رد می‌کند.

    رفتار جریان reasoning:

    - `/reasoning stream` از مسیر پیش‌نمایش reasoning یک کانال پشتیبانی‌شده استفاده می‌کند؛ در Telegram، هنگام تولید، reasoning را در پیش‌نمایش زنده پخش می‌کند
    - پیش‌نمایش reasoning پس از تحویل نهایی حذف می‌شود؛ وقتی reasoning باید قابل مشاهده بماند از `/reasoning on` استفاده کنید
    - پاسخ نهایی بدون متن reasoning فرستاده می‌شود

  </Accordion>

  <Accordion title="قالب‌بندی پیام غنی">
    متن خروجی به‌صورت پیش‌فرض از پیام‌های HTML استاندارد Telegram استفاده می‌کند تا پاسخ‌ها در کلاینت‌های فعلی Telegram خوانا بمانند. این حالت سازگاری از bold، italic، پیوندها، کد، spoilers، و نقل‌قول‌های معمولی پشتیبانی می‌کند، اما از بلوک‌های فقط غنی Bot API 10.1 مانند جدول‌های بومی، details، رسانه غنی، و فرمول‌ها پشتیبانی نمی‌کند.

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
    - متن Markdown از طریق Markdown IR در OpenClaw render می‌شود و به‌صورت HTML غنی Telegram فرستاده می‌شود.
    - payloadهای HTML غنی صریح، tagهای پشتیبانی‌شده Bot API 10.1 مانند headings، tables، details، rich media، و formulas را حفظ می‌کنند.
    - captionهای رسانه همچنان از captionهای HTML در Telegram استفاده می‌کنند، زیرا پیام‌های غنی جایگزین captionها نمی‌شوند.

    این کار متن مدل را از sigilهای Telegram Rich Markdown دور نگه می‌دارد، بنابراین مقدارهایی مانند `$400-600K` به‌عنوان ریاضی parse نمی‌شوند. متن غنی طولانی به‌صورت خودکار در محدوده‌های متن غنی و بلوک غنی Telegram تقسیم می‌شود. جدول‌هایی که از حد ستون Telegram فراتر بروند به‌صورت code block فرستاده می‌شوند.

    پیش‌فرض: برای سازگاری کلاینت خاموش است. پیام‌های غنی به کلاینت‌های سازگار Telegram نیاز دارند؛ برخی کلاینت‌های فعلی Desktop، Web، Android، و شخص ثالث، پیام‌های غنی پذیرفته‌شده را به‌صورت پشتیبانی‌نشده نمایش می‌دهند. این گزینه را غیرفعال نگه دارید مگر اینکه همه کلاینت‌های استفاده‌شده با ربات بتوانند آن‌ها را render کنند. `/status` نشان می‌دهد که پیام‌های غنی برای نشست فعلی Telegram روشن یا خاموش هستند.

    پیش‌نمایش پیوندها به‌صورت پیش‌فرض فعال است. `channels.telegram.linkPreview: false` تشخیص خودکار entity را برای متن غنی رد می‌کند.

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

    - نام‌ها نرمال‌سازی می‌شوند (حذف `/` ابتدایی، حروف کوچک)
    - الگوی معتبر: `a-z`، `0-9`، `_`، طول `1..32`
    - فرمان‌های سفارشی نمی‌توانند فرمان‌های بومی را override کنند
    - تداخل‌ها/تکراری‌ها رد می‌شوند و log می‌شوند

    یادداشت‌ها:

    - فرمان‌های سفارشی فقط ورودی‌های منو هستند؛ رفتار را به‌صورت خودکار پیاده‌سازی نمی‌کنند
    - فرمان‌های plugin/skill حتی اگر در منوی Telegram نشان داده نشوند، همچنان هنگام تایپ شدن می‌توانند کار کنند

    اگر فرمان‌های بومی غیرفعال باشند، built-inها حذف می‌شوند. فرمان‌های سفارشی/plugin ممکن است در صورت پیکربندی همچنان ثبت شوند.

    شکست‌های رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از کوتاه‌سازی همچنان سرریز شده است؛ فرمان‌های plugin/skill/custom را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` همراه با `404: Not Found` در حالی که فرمان‌های مستقیم Bot API با curl کار می‌کنند، می‌تواند به این معنی باشد که `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن ربات پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان شکست پاک‌سازی webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای network/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود شده است.

    ### فرمان‌های جفت‌سازی دستگاه (plugin `device-pair`)

    وقتی plugin `device-pair` نصب شده باشد:

    1. `/pair` کد setup تولید می‌کند
    2. کد را در برنامه iOS paste کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (شامل role/scopes)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد setup یک توکن bootstrap کوتاه‌عمر حمل می‌کند. bootstrap داخلی کد setup فقط node است: نخستین اتصال یک درخواست node در انتظار ایجاد می‌کند، و پس از تأیید، Gateway یک توکن node پایدار با `scopes: []` برمی‌گرداند. توکن operator واگذارشده برنمی‌گرداند؛ دسترسی operator به یک جفت‌سازی operator تأییدشده جداگانه یا جریان توکن نیاز دارد.

    اگر دستگاهی با جزئیات auth تغییرکرده دوباره تلاش کند (برای مثال role/scopes/public key)، درخواست در انتظار قبلی supersede می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید، `/pair pending` را دوباره اجرا کنید.

    جزئیات بیشتر: [جفت‌سازی](/fa/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="دکمه‌های درون‌خطی">
    محدودهٔ صفحه‌کلید درون‌خطی را پیکربندی کنید:

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

    دکمه‌های `web_app` در Telegram فقط در چت‌های خصوصی بین کاربر و
    بات کار می‌کنند.

    کلیک‌های callback به‌صورت متن به agent ارسال می‌شوند:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="کنش‌های پیام Telegram برای agentها و خودکارسازی">
    کنش‌های ابزار Telegram شامل موارد زیر است:

    - `sendMessage` (`to`, `content`, `mediaUrl` اختیاری، `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` یا `caption`، دکمه‌های درون‌خطی `presentation` اختیاری؛ ویرایش‌های فقط دکمه نشانه‌گذاری پاسخ را به‌روزرسانی می‌کنند)
    - `createForumTopic` (`chatId`, `name`, `iconColor` اختیاری، `iconCustomEmojiId`)

    کنش‌های پیام کانال نام‌های مستعار ارگونومیک ارائه می‌کنند (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    کنترل‌های محدودسازی:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌طور پیش‌فرض فعال‌اند و کلیدهای جداگانهٔ `channels.telegram.actions.*` ندارند.
    ارسال‌های زمان اجرا از عکس‌برداشت پیکربندی/رازهای فعال (راه‌اندازی/بارگذاری دوباره) استفاده می‌کنند، بنابراین مسیرهای کنش برای هر ارسال بازحل موردی SecretRef انجام نمی‌دهند.

    معناشناسی حذف واکنش: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="برچسب‌های رشته‌بندی پاسخ">
    Telegram از برچسب‌های صریح رشته‌بندی پاسخ در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام آغازگر پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسهٔ پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` نحوهٔ مدیریت را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی رشته‌بندی پاسخ فعال باشد و متن یا کپشن اصلی Telegram در دسترس باشد، OpenClaw به‌طور خودکار یک بریده‌نقل‌قول بومی Telegram درج می‌کند. Telegram متن نقل‌قول بومی را به ۱۰۲۴ واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل‌قول می‌شوند و اگر Telegram نقل‌قول را رد کند، به پاسخ ساده برمی‌گردند.

    نکته: `off` رشته‌بندی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="موضوع‌های انجمن و رفتار رشته">
    ابرگروه‌های انجمن:

    - کلیدهای نشست موضوع `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و تایپ‌کردن، رشتهٔ موضوع را هدف می‌گیرند
    - مسیر پیکربندی موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالت ویژهٔ موضوع عمومی (`threadId=1`):

    - ارسال‌های پیام `message_thread_id` را حذف می‌کنند (Telegram مقدار `sendMessage(...thread_id=1)` را رد می‌کند)
    - کنش‌های تایپ همچنان `message_thread_id` را شامل می‌شوند

    وراثت موضوع: ورودی‌های موضوع تنظیمات گروه را به ارث می‌برند مگر آنکه بازنویسی شوند (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` فقط مختص موضوع است و از پیش‌فرض‌های گروه به ارث نمی‌رسد.
    `topics."*"` پیش‌فرض‌ها را برای هر موضوع در آن گروه تنظیم می‌کند؛ شناسه‌های دقیق موضوع همچنان بر `"*"` مقدم‌اند.

    **مسیریابی agent برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در پیکربندی موضوع، به agent متفاوتی مسیریابی شود. این کار به هر موضوع فضای کاری، حافظه و نشست ایزولهٔ خودش را می‌دهد. نمونه:

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

    **اتصال پایدار موضوع ACP**: موضوع‌های انجمن می‌توانند نشست‌های harness ACP را از طریق اتصال‌های ACP تایپ‌شدهٔ سطح بالا سنجاق کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و شناسهٔ واجد موضوع مانند `-1001234567890:topic:42`). در حال حاضر به موضوع‌های انجمن در گروه‌ها/ابرگروه‌ها محدود است. [agentهای ACP](/fa/tools/acp-agents) را ببینید.

    **ایجاد ACP وابسته به رشته از چت**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک نشست ACP جدید متصل می‌کند؛ پیام‌های بعدی مستقیماً به آنجا مسیریابی می‌شوند. OpenClaw تأیید ایجاد را داخل موضوع سنجاق می‌کند. نیاز دارد `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    زمینهٔ قالب `MessageThreadId` و `IsForum` را در معرض می‌گذارد. چت‌های DM با `message_thread_id` فرادادهٔ پاسخ را نگه می‌دارند؛ آن‌ها فقط زمانی از کلیدهای نشست آگاه از رشته استفاده می‌کنند که `getMe` در Telegram مقدار `has_topics_enabled: true` را برای بات گزارش کند.
    بازنویسی‌های سابق `dm.threadReplies` و `direct.*.threadReplies` عمداً بازنشسته شده‌اند؛ از حالت رشته‌ای BotFather به‌عنوان تنها منبع حقیقت استفاده کنید و برای حذف کلیدهای پیکربندی کهنه `openclaw doctor --fix` را اجرا کنید.

  </Accordion>

  <Accordion title="صدا، ویدیو و استیکرها">
    ### پیام‌های صوتی

    Telegram یادداشت‌های صوتی را از فایل‌های صوتی متمایز می‌کند.

    - پیش‌فرض: رفتار فایل صوتی
    - برچسب `[[audio_as_voice]]` در پاسخ agent برای اجبار ارسال یادداشت صوتی
    - رونوشت‌های یادداشت صوتی ورودی در زمینهٔ agent به‌عنوان متن تولیدشده توسط ماشین و
      نامطمئن قالب‌بندی می‌شوند؛ تشخیص mention همچنان از رونوشت خام استفاده می‌کند
      تا پیام‌های صوتی محدودشده با mention همچنان کار کنند.

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

    رسیدگی به استیکرهای ورودی:

    - WEBP ایستا: دانلود و پردازش می‌شود (جای‌نگهدار `<media:sticker>`)
    - TGS متحرک: نادیده گرفته می‌شود
    - WEBM ویدیویی: نادیده گرفته می‌شود

    فیلدهای زمینه استیکر:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    توضیحات استیکرها در وضعیت Plugin ‏SQLite مربوط به OpenClaw کش می‌شوند تا فراخوانی‌های تکراری بینایی کاهش یابد.

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

    وقتی فعال باشد، OpenClaw رویدادهای سیستمی مانند این‌ها را در صف می‌گذارد:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکات:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط بات (بهترین تلاش از طریق کش پیام‌های ارسالی).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)؛ فرستنده‌های غیرمجاز حذف می‌شوند.
    - Telegram در به‌روزرسانی‌های واکنش، شناسه thread ارائه نمی‌کند.
      - گروه‌های غیر forum به جلسه گفت‌وگوی گروهی هدایت می‌شوند
      - گروه‌های forum به جلسه موضوع عمومی گروه (`:topic:1`) هدایت می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌طور خودکار شامل `message_reaction` می‌شود.

  </Accordion>

  <Accordion title="واکنش‌های Ack">
    `ackReaction` هنگامی که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید ارسال می‌کند. `ackReactionScope` تعیین می‌کند آن ایموجی واقعاً *چه زمانی* ارسال شود.

    **ترتیب تعیین ایموجی (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت agent (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکات:

    - Telegram انتظار ایموجی unicode دارد (برای مثال "👀").
    - برای غیرفعال کردن واکنش برای یک channel یا account از `""` استفاده کنید.

    **دامنه (`messages.ackReactionScope`):**

    ارائه‌دهنده Telegram دامنه را از `messages.ackReactionScope` می‌خواند (پیش‌فرض `"group-mentions"`). امروز هیچ بازنویسی در سطح account یا channel مربوط به Telegram وجود ندارد.

    مقادیر: `"all"` (DMها + گروه‌ها)، `"direct"` (فقط DMها)، `"group-all"` (هر پیام گروهی، بدون DM)، `"group-mentions"` (گروه‌ها وقتی بات mention شده باشد؛ **بدون DM** — این پیش‌فرض است)، `"off"` / `"none"` (غیرفعال).

    <Note>
    دامنه پیش‌فرض (`"group-mentions"`) واکنش‌های ack را در پیام‌های مستقیم اجرا نمی‌کند. برای دریافت واکنش ack روی DMهای ورودی Telegram، `messages.ackReactionScope` را روی `"direct"` یا `"all"` تنظیم کنید. مقدار هنگام راه‌اندازی ارائه‌دهنده Telegram خوانده می‌شود، بنابراین برای اعمال تغییر باید gateway بازراه‌اندازی شود.
    </Note>

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی channel به‌طور پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های تحریک‌شده توسط Telegram شامل موارد زیر است:

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
    پیش‌فرض long polling است. برای حالت webhook، `channels.telegram.webhookUrl` و `channels.telegram.webhookSecret` را تنظیم کنید؛ `webhookPath`، `webhookHost`، `webhookPort` اختیاری هستند (پیش‌فرض‌ها: `/telegram-webhook`، `127.0.0.1`، `8787`).

    در حالت long-polling، OpenClaw watermark بازراه‌اندازی خود را فقط پس از dispatch موفق یک به‌روزرسانی پایدار می‌کند. اگر handler شکست بخورد، آن به‌روزرسانی در همان فرایند قابل تلاش مجدد باقی می‌ماند و برای حذف تکرار پس از بازراه‌اندازی به‌عنوان کامل‌شده نوشته نمی‌شود.

    شنونده محلی به `127.0.0.1:8787` bind می‌شود. برای ingress عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا عمداً `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook قبل از بازگرداندن `200` به Telegram، محافظ‌های درخواست، توکن محرمانه Telegram و بدنه JSON را اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان laneهای بات به‌ازای هر گفت‌وگو/هر موضوع که در long polling استفاده می‌شوند پردازش می‌کند، بنابراین نوبت‌های کند agent، ACK تحویل Telegram را معطل نمی‌کنند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش مجدد، و هدف‌های CLI">
    - مقدار پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خطوط خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازه رسانه ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.mediaGroupFlushMs` (پیش‌فرض 500) کنترل می‌کند آلبوم‌ها/گروه‌های رسانه‌ای Telegram چه مدت بافر شوند پیش از اینکه OpenClaw آن‌ها را به‌عنوان یک پیام ورودی واحد ارسال کند. اگر بخش‌های آلبوم دیر می‌رسند آن را افزایش دهید؛ برای کاهش تأخیر پاسخ آلبوم آن را کاهش دهید.
    - `channels.telegram.timeoutSeconds` زمان‌انتظار کلاینت API Telegram را بازنویسی می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های بات مقادیر پیکربندی‌شده کمتر از نگهبان درخواست 60 ثانیه‌ای متن/درحال‌نوشتن خروجی را محدود می‌کنند تا grammY تحویل پاسخ قابل‌مشاهده را پیش از اجرای نگهبان انتقال و جایگزین OpenClaw قطع نکند. Long polling همچنان از نگهبان درخواست 45 ثانیه‌ای `getUpdates` استفاده می‌کند تا نظرسنجی‌های بیکار برای همیشه رها نشوند.
    - مقدار پیش‌فرض `channels.telegram.pollingStallThresholdMs` برابر `120000` است؛ فقط برای راه‌اندازی‌های مجدد مثبت کاذب توقف نظرسنجی، آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچه زمینه گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` (پیش‌فرض 50) استفاده می‌کند؛ `0` غیرفعال می‌کند.
    - زمینه تکمیلی پاسخ/نقل‌قول/بازارسال، وقتی Gateway پیام‌های والد را مشاهده کرده باشد، در یک پنجره زمینه مکالمه انتخاب‌شده نرمال‌سازی می‌شود؛ کش پیام مشاهده‌شده در وضعیت Plugin SQLite مربوط به OpenClaw قرار دارد، و `openclaw doctor --fix` فایل‌های جانبی قدیمی را وارد می‌کند. Telegram فقط یک `reply_to_message` سطحی را در به‌روزرسانی‌ها شامل می‌کند، بنابراین زنجیره‌های قدیمی‌تر از کش به محتوای فعلی به‌روزرسانی Telegram محدود هستند.
    - فهرست‌های مجاز Telegram عمدتاً کنترل می‌کنند چه کسی می‌تواند عامل را تحریک کند، نه یک مرز کامل ویرایش زمینه تکمیلی.
    - کنترل‌های تاریخچه DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای API خروجی قابل‌بازیابی، روی کمک‌کننده‌های ارسال Telegram (CLI/ابزارها/کنش‌ها) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای شکست‌های پیش‌اتصال Telegram از یک تلاش مجدد امن و محدود استفاده می‌کند، اما پاکت‌های شبکه مبهم پس از ارسال را که می‌توانند پیام‌های قابل‌مشاهده را تکراری کنند دوباره تلاش نمی‌کند.

    هدف‌های ارسال CLI و ابزار پیام می‌توانند شناسه عددی چت، نام کاربری، یا هدف موضوع انجمن باشند:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    نظرسنجی‌های Telegram از `openclaw message poll` استفاده می‌کنند و از موضوع‌های انجمن پشتیبانی می‌کنند:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    پرچم‌های نظرسنجی مخصوص Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` برای موضوع‌های انجمن (یا از هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین پشتیبانی می‌کند از:

    - `--presentation` با بلوک‌های `buttons` برای صفحه‌کلیدهای درون‌خطی وقتی `channels.telegram.capabilities.inlineButtons` اجازه دهد
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل سنجاق‌شده وقتی بات بتواند در آن چت سنجاق کند
    - `--force-document` برای ارسال تصاویر، GIFها، و ویدیوهای خروجی به‌عنوان سند به‌جای بارگذاری‌های عکس فشرده، رسانه متحرک، یا ویدیو

    کنترل کنش‌ها:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله نظرسنجی‌ها را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ایجاد نظرسنجی Telegram را غیرفعال می‌کند در حالی که ارسال‌های معمولی فعال می‌مانند

  </Accordion>

  <Accordion title="تأییدیه‌های اجرا در Telegram">
    Telegram از تأییدیه‌های اجرا در DMهای تأییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری درخواست‌ها را در چت یا موضوع مبدأ منتشر کند. تأییدکنندگان باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی دست‌کم یک تأییدکننده قابل‌حل باشد به‌طور خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی مالک از `commands.ownerAllowFrom` بازمی‌گردد)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom`، و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با بات صحبت کند و بات پاسخ‌های عادی را کجا ارسال کند. آن‌ها کسی را به تأییدکننده اجرا تبدیل نمی‌کنند. نخستین جفت‌سازی DM تأییدشده، وقتی هنوز مالک فرمانی وجود ندارد، `commands.ownerAllowFrom` را راه‌اندازی اولیه می‌کند؛ بنابراین راه‌اندازی تک‌مالکه همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانالی متن فرمان را در چت نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/موضوع‌های مورداعتماد فعال کنید. وقتی درخواست در یک موضوع انجمن قرار می‌گیرد، OpenClaw موضوع را برای درخواست تأیید و پیگیری حفظ می‌کند. تأییدیه‌های اجرا به‌طور پیش‌فرض پس از 30 دقیقه منقضی می‌شوند.

    دکمه‌های تأیید درون‌خطی نیز نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group`، یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدیه‌های Plugin حل می‌شوند؛ بقیه ابتدا از طریق تأییدیه‌های اجرا حل می‌شوند.

    [تأییدیه‌های اجرا](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی عامل با خطای تحویل یا ارائه‌دهنده روبه‌رو می‌شود، سیاست خطا کنترل می‌کند آیا پیام‌های خطا به چت Telegram ارسال شوند یا نه:

| کلید                                 | مقادیر                     | پیش‌فرض         | توضیح                                                                                                                                                                                               |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — هر پیام خطا را به چت ارسال می‌کند. `once` — هر پیام خطای یکتا را یک‌بار در هر پنجره سردشدن ارسال می‌کند (خطاهای یکسان تکراری را سرکوب می‌کند). `silent` — هرگز پیام خطا را به چت ارسال نمی‌کند. |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | پنجره سردشدن برای سیاست `once`. پس از ارسال یک خطا، همان پیام خطا تا پایان این بازه سرکوب می‌شود. از هرزفرستی خطا هنگام قطعی‌ها جلوگیری می‌کند.                                      |

بازنویسی‌های بر اساس حساب، گروه، و موضوع پشتیبانی می‌شوند (همان وراثت کلیدهای پیکربندی دیگر Telegram).

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
  <Accordion title="بات به پیام‌های گروهی بدون اشاره پاسخ نمی‌دهد">

    - اگر `requireMention=false` باشد، حالت حریم خصوصی Telegram باید دید کامل را مجاز کند.
      - BotFather: `/setprivacy` -> Disable
      - سپس بات را از گروه حذف و دوباره اضافه کنید
    - وقتی پیکربندی انتظار پیام‌های گروهی بدون اشاره را دارد، `openclaw channels status` هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ عضویت wildcard `"*"` قابل‌کاوش نیست.
    - آزمون سریع جلسه: `/activation always`.

  </Accordion>

  <Accordion title="بات اصلاً پیام‌های گروه را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا شامل `"*"` باشد)
    - عضویت بات در گروه را بررسی کنید
    - گزارش‌ها را بررسی کنید: `openclaw logs --follow` برای دلایل رد شدن

  </Accordion>

  <Accordion title="فرمان‌ها ناقص کار می‌کنند یا اصلاً کار نمی‌کنند">

    - هویت فرستنده خود را مجاز کنید (جفت‌سازی و/یا `allowFrom` عددی)
    - مجوزدهی فرمان حتی وقتی سیاست گروه `open` است همچنان اعمال می‌شود
    - `setMyCommands failed` با `BOT_COMMANDS_TOO_MUCH` یعنی منوی بومی ورودی‌های بسیار زیادی دارد؛ فرمان‌های Plugin/skill/سفارشی را کاهش دهید یا منوهای بومی را غیرفعال کنید
    - فراخوانی‌های راه‌اندازی `deleteMyCommands` / `setMyCommands` و فراخوانی‌های درحال‌نوشتن `sendChatAction` محدود هستند و هنگام پایان زمان درخواست، یک‌بار از طریق جایگزین انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار شبکه/fetch معمولاً نشان‌دهنده مشکل دسترسی‌پذیری DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="راه‌اندازی، توکن غیرمجاز گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای توکن بات پیکربندی‌شده است.
    - توکن بات را در BotFather دوباره کپی یا بازتولید کنید، سپس `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken`، یا `TELEGRAM_BOT_TOKEN` را برای حساب پیش‌فرض به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام راه‌اندازی نیز شکست احراز هویت است؛ تلقی کردن آن به‌عنوان «هیچ Webhook وجود ندارد» فقط همان شکست توکن بد را به فراخوانی‌های بعدی API موکول می‌کند.

  </Accordion>

  <Accordion title="ناپایداری نظرسنجی یا شبکه">

    - Node 22+ به‌همراه fetch/proxy سفارشی می‌تواند در صورت ناهماهنگی انواع AbortSignal، رفتار قطع فوری را تحریک کند.
    - برخی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 حل می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث شکست‌های متناوب API Telegram شود.
    - اگر گزارش‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این‌ها را به‌عنوان خطاهای شبکه قابل‌بازیابی دوباره تلاش می‌کند.
    - هنگام راه‌اندازی نظرسنجی، OpenClaw کاوش موفق راه‌اندازی `getMe` را برای grammY دوباره استفاده می‌کند تا اجراکننده پیش از نخستین `getUpdates` به `getMe` دوم نیاز نداشته باشد.
    - اگر `deleteWebhook` هنگام راه‌اندازی نظرسنجی با خطای شبکه گذرا شکست بخورد، OpenClaw به‌جای انجام یک فراخوانی کنترل‌پلین دیگر پیش از نظرسنجی، وارد long polling می‌شود. Webhook همچنان فعال به‌صورت تداخل `getUpdates` نمایان می‌شود؛ سپس OpenClaw انتقال Telegram را دوباره می‌سازد و پاک‌سازی Webhook را دوباره تلاش می‌کند.
    - اگر سوکت‌های Telegram با یک آهنگ ثابت کوتاه بازیافت می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ کلاینت‌های بات مقادیر پیکربندی‌شده کمتر از نگهبان‌های درخواست خروجی و `getUpdates` را محدود می‌کنند، اما نسخه‌های قدیمی‌تر می‌توانستند هر نظرسنجی یا پاسخ را وقتی این مقدار زیر آن نگهبان‌ها تنظیم شده بود قطع کنند.
    - اگر گزارش‌ها شامل `Polling stall detected` باشند، OpenClaw پس از 120 ثانیه بدون تکمیل زنده‌بودن long-poll به‌طور پیش‌فرض نظرسنجی را بازراه‌اندازی و انتقال Telegram را دوباره می‌سازد.
    - `openclaw channels status --probe` و `openclaw doctor` وقتی یک حساب نظرسنجی در حال اجرا پس از مهلت راه‌اندازی `getUpdates` را کامل نکرده باشد، وقتی یک حساب Webhook در حال اجرا پس از مهلت راه‌اندازی `setWebhook` را کامل نکرده باشد، یا وقتی آخرین فعالیت موفق انتقال نظرسنجی کهنه باشد هشدار می‌دهند.
    - `channels.telegram.pollingStallThresholdMs` را فقط وقتی افزایش دهید که فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما میزبان شما همچنان راه‌اندازی‌های مجدد مثبت کاذب توقف نظرسنجی را گزارش می‌کند. توقف‌های پایدار معمولاً به مشکلات proxy، DNS، IPv6، یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین env پروکسی فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY`، و نسخه‌های حروف کوچک آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌تواند `api.telegram.org` را دور بزند.
    - اگر پروکسی مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای یک محیط سرویس پیکربندی شده باشد و هیچ env پروکسی استانداردی حاضر نباشد، Telegram نیز از همان URL برای انتقال Bot API استفاده می‌کند.
    - روی میزبان‌های VPS با خروجی/TLS مستقیم ناپایدار، فراخوانی‌های API Telegram را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌طور پیش‌فرض از `autoSelectFamily=true` استفاده می‌کند (به‌جز WSL2). ترتیب نتایج DNS در Telegram ابتدا از `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، سپس از `channels.telegram.network.dnsResultOrder`، و بعد از پیش‌فرض فرایند مانند `NODE_OPTIONS=--dns-result-order=ipv4first` پیروی می‌کند؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` برمی‌گردد.
    - اگر میزبان شما WSL2 است یا صریحاً با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب خانواده را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های بازه بنچمارک RFC 2544 (`198.18.0.0/15`) از قبل به‌طور پیش‌فرض
      برای دانلود رسانه‌های Telegram مجاز هستند. اگر یک fake-IP مورد اعتماد یا
      پروکسی شفاف، هنگام دانلود رسانه، `api.telegram.org` را به نشانی
      خصوصی/داخلی/با کاربرد ویژه دیگری بازنویسی می‌کند، می‌توانید برای دورزدن
      فقط در Telegram فعال‌سازی کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین فعال‌سازی برای هر حساب نیز در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر پروکسی شما میزبان‌های رسانه Telegram را به `198.18.x.x` تبدیل می‌کند، ابتدا
      پرچم خطرناک را خاموش بگذارید. رسانه Telegram از قبل به‌طور پیش‌فرض بازه
      بنچمارک RFC 2544 را مجاز می‌داند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانه
      Telegram را تضعیف می‌کند. فقط در محیط‌های پروکسی مورد اعتماد و تحت کنترل
      اپراتور، مانند مسیریابی fake-IP در Clash، Mihomo یا Surge، از آن استفاده کنید
      وقتی پاسخ‌های خصوصی یا با کاربرد ویژه‌ای خارج از بازه بنچمارک RFC 2544
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

<Accordion title="High-signal Telegram fields">

- راه‌اندازی/احراز هویت: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` باید به یک فایل عادی اشاره کند؛ پیوندهای نمادین رد می‌شوند)
- کنترل دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, سطح بالای `bindings[]` (`type: "acp"`)
- پیش‌فرض‌های موضوع: `groups.<chatId>.topics."*"` برای موضوع‌های انجمنِ بدون تطابق اعمال می‌شود؛ شناسه‌های دقیق موضوع آن را بازنویسی می‌کنند
- تأییدیه‌های اجرا: `execApprovals`, `accounts.*.execApprovals`
- فرمان/منو: `commands.native`, `commands.nativeSkills`, `customCommands`
- رشته‌بندی/پاسخ‌ها: `replyToMode`
- پخش جریانی: `streaming` (پیش‌نمایش)، `streaming.preview.toolProgress`, `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ `/bot<TOKEN>` را شامل نکنید)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- کنش‌ها/قابلیت‌ها: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- واکنش‌ها: `reactionNotifications`, `reactionLevel`
- خطاها: `errorPolicy`, `errorCooldownMs`
- نوشتن‌ها/تاریخچه: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را اضافه کنید) تا مسیریابی پیش‌فرض صریح شود. در غیر این صورت OpenClaw به اولین شناسه حساب نرمال‌شده برمی‌گردد و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقادیر `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را با Gateway جفت کنید.
  </Card>
  <Card title="Groups" icon="users" href="/fa/channels/groups">
    رفتار فهرست مجاز گروه و موضوع.
  </Card>
  <Card title="Channel routing" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="Security" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/fa/concepts/multi-agent">
    گروه‌ها و موضوع‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی.
  </Card>
</CardGroup>

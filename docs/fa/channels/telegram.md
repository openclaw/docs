---
read_when:
    - کار روی قابلیت‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:42:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

آمادهٔ تولید برای پیام‌های مستقیم بات و گروه‌ها از طریق grammY. long polling حالت پیش‌فرض است؛ حالت Webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای Telegram جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌ها و راهنماهای تعمیر میان‌کانالی.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و مثال‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="ساخت توکن بات در BotFather">
    Telegram را باز کنید و با **@BotFather** گفتگو کنید (مطمئن شوید نام کاربری دقیقاً `@BotFather` است).

    `/newbot` را اجرا کنید، دستورالعمل‌ها را دنبال کنید، و توکن را ذخیره کنید.

  </Step>

  <Step title="پیکربندی توکن و سیاست پیام مستقیم">

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

  <Step title="شروع Gateway و تأیید اولین پیام مستقیم">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.

  </Step>

  <Step title="افزودن بات به گروه">
    بات را به گروه خود اضافه کنید، سپس هر دو شناسه‌ای را که دسترسی گروه نیاز دارد دریافت کنید:

    - شناسهٔ کاربر Telegram شما، که در `allowFrom` / `groupAllowFrom` استفاده می‌شود
    - شناسهٔ گفتگوی گروه Telegram، که به‌عنوان کلید زیر `channels.telegram.groups` استفاده می‌شود

    برای راه‌اندازی اولیه، شناسهٔ گفتگوی گروه را از `openclaw logs --follow`، یک بات شناسهٔ فورواردشده، یا `getUpdates` در Bot API بگیرید. پس از مجاز شدن گروه، `/whoami@<bot_username>` می‌تواند شناسه‌های کاربر و گروه را تأیید کند.

    شناسه‌های منفی ابرگروه Telegram که با `-100` شروع می‌شوند شناسه‌های گفتگوی گروه هستند. آن‌ها را زیر `channels.telegram.groups` قرار دهید، نه زیر `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتیب حل توکن نسبت به حساب آگاه است. در عمل، مقادیر پیکربندی بر جایگزین محیطی اولویت دارند، و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
پس از شروع موفق، OpenClaw هویت بات را تا ۲۴ ساعت در پوشهٔ وضعیت cache می‌کند تا شروع‌های دوباره بتوانند از یک فراخوانی اضافی `getMe` در Telegram پرهیز کنند؛ تغییر یا حذف توکن این cache را پاک می‌کند.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و دیده‌شدن گروه">
    بات‌های Telegram به‌صورت پیش‌فرض روی **Privacy Mode** هستند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر بات باید همهٔ پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را از طریق `/setprivacy` غیرفعال کنید، یا
    - بات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، بات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت مدیر در تنظیمات گروه Telegram کنترل می‌شود.

    بات‌های مدیر همهٔ پیام‌های گروه را دریافت می‌کنند، که برای رفتار گروهی همیشه‌فعال مفید است.

  </Accordion>

  <Accordion title="گزینه‌های مفید BotFather">

    - `/setjoingroups` برای اجازه/رد افزودن به گروه‌ها
    - `/setprivacy` برای رفتار دیده‌شدن در گروه

  </Accordion>
</AccordionGroup>

## کنترل دسترسی و فعال‌سازی

### هویت بات گروه

در گروه‌ها و موضوعات انجمنی Telegram، اشارهٔ صریح به نام کاربری پیکربندی‌شدهٔ بات (برای مثال `@my_bot`) به‌عنوان خطاب به عامل انتخاب‌شدهٔ OpenClaw در نظر گرفته می‌شود، حتی وقتی نام شخصیت عامل با نام کاربری Telegram متفاوت باشد. سیاست سکوت گروه همچنان برای ترافیک نامرتبط گروه اعمال می‌شود، اما خود نام کاربری بات «شخص دیگری» محسوب نمی‌شود.

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.telegram.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (حداقل به یک شناسهٔ فرستنده در `allowFrom` نیاز دارد)
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` به هر حساب Telegram که نام کاربری بات را پیدا کند یا حدس بزند اجازه می‌دهد به بات فرمان بدهد. فقط برای بات‌های عمداً عمومی با ابزارهای به‌شدت محدود از آن استفاده کنید؛ بات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربر Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در پیکربندی‌های چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های سطح حساب `allowFrom: ["*"]` آن حساب را عمومی نمی‌کنند، مگر اینکه allowlist مؤثر حساب پس از ادغام همچنان شامل یک wildcard صریح باشد.
    `dmPolicy: "allowlist"` با `allowFrom` خالی همهٔ پیام‌های مستقیم را مسدود می‌کند و توسط اعتبارسنجی پیکربندی رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را می‌پرسد.
    اگر ارتقا داده‌اید و پیکربندی شما شامل ورودی‌های allowlist از نوع `@username` است، `openclaw doctor --fix` را اجرا کنید تا آن‌ها را حل کند (بهترین تلاش؛ به توکن بات Telegram نیاز دارد).
    اگر قبلاً به فایل‌های allowlist در pairing-store متکی بودید، `openclaw doctor --fix` می‌تواند در جریان‌های allowlist ورودی‌ها را در `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز هیچ شناسهٔ صریحی ندارد).

    برای بات‌های تک‌مالک، `dmPolicy: "allowlist"` با شناسه‌های عددی صریح `allowFrom` را ترجیح دهید تا سیاست دسترسی در پیکربندی پایدار بماند (به‌جای وابستگی به تأییدهای قبلی جفت‌سازی).

    ابهام رایج: تأیید جفت‌سازی پیام مستقیم به معنی «این فرستنده همه‌جا مجاز است» نیست.
    جفت‌سازی دسترسی پیام مستقیم می‌دهد. اگر هنوز مالک فرمانی وجود نداشته باشد، اولین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط‌مالک و تأییدهای exec یک حساب اپراتور صریح داشته باشند.
    مجوزدهی فرستندهٔ گروه همچنان از allowlistهای صریح پیکربندی می‌آید.
    اگر می‌خواهید «یک‌بار مجاز شوم و هم پیام‌های مستقیم و هم فرمان‌های گروه کار کنند»، شناسهٔ عددی کاربر Telegram خود را در `channels.telegram.allowFrom` قرار دهید؛ برای فرمان‌های فقط‌مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### پیدا کردن شناسهٔ کاربر Telegram شما

    ایمن‌تر (بدون بات شخص ثالث):

    1. به بات خود پیام مستقیم بدهید.
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
         - با `groupPolicy: "open"`: هر گروهی می‌تواند بررسی‌های شناسهٔ گروه را عبور دهد
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها تا زمانی که ورودی‌های `groups` (یا `"*"`) اضافه کنید مسدود می‌مانند
       - `groups` پیکربندی شده: مانند allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستندهٔ گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` fallback می‌کند.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربر Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های گفتگوی گروه یا ابرگروه Telegram را در `groupAllowFrom` قرار ندهید. شناسه‌های گفتگوی منفی زیر `channels.telegram.groups` قرار می‌گیرند.
    ورودی‌های غیرعددی برای مجوزدهی فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز مجوز فرستندهٔ گروه تأییدهای pairing-store پیام مستقیم را به ارث **نمی‌برد**.
    جفت‌سازی فقط برای پیام مستقیم باقی می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` در سطح هر گروه/هر موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به `allowFrom` پیکربندی fallback می‌کند، نه به pairing store.
    الگوی عملی برای بات‌های تک‌مالک: شناسهٔ کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکتهٔ runtime: اگر `channels.telegram` کاملاً وجود نداشته باشد، runtime به‌صورت پیش‌فرض روی fail-closed با `groupPolicy="allowlist"` می‌رود، مگر اینکه `channels.defaults.groupPolicy` صریحاً تنظیم شده باشد.

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

    آن را از گروه با `@<bot_username> ping` آزمایش کنید. پیام‌های سادهٔ گروه تا وقتی `requireMention: true` باشد بات را فعال نمی‌کنند.

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

      - شناسه‌های منفی گروه یا ابرگروه Telegram مانند `-1001234567890` را زیر `channels.telegram.groups` قرار دهید.
      - وقتی می‌خواهید محدود کنید کدام افراد داخل یک گروه مجاز می‌توانند بات را فعال کنند، شناسه‌های کاربر Telegram مانند `8734062810` را زیر `groupAllowFrom` قرار دهید.
      - فقط وقتی از `groupAllowFrom: ["*"]` استفاده کنید که می‌خواهید هر عضو یک گروه مجاز بتواند با بات صحبت کند.

    </Warning>

  </Tab>

  <Tab title="رفتار اشاره">
    پاسخ‌های گروه به‌صورت پیش‌فرض نیازمند اشاره هستند.

    اشاره می‌تواند از این موارد بیاید:

    - اشارهٔ بومی `@botusername`، یا
    - الگوهای اشاره در:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    تغییرهای فرمان در سطح نشست:

    - `/activation always`
    - `/activation mention`

    این‌ها فقط وضعیت نشست را به‌روزرسانی می‌کنند. برای ماندگاری از پیکربندی استفاده کنید.

    مثال پیکربندی ماندگار:

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

    زمینهٔ تاریخچهٔ گروه همیشه برای گروه‌ها فعال است و با
    `historyLimit` محدود می‌شود. برای غیرفعال کردن پنجرهٔ تاریخچهٔ گروه
    Telegram، مقدار `channels.telegram.historyLimit: 0` را تنظیم کنید. کلید بازنشستهٔ `includeGroupHistoryContext`
    توسط `openclaw doctor --fix` حذف می‌شود.

    دریافت شناسهٔ گفتگوی گروه:

    - یک پیام گروه را به `@userinfobot` / `@getidsbot` فوروارد کنید
    - یا `chat.id` را از `openclaw logs --follow` بخوانید
    - یا Bot API `getUpdates` را بررسی کنید
    - پس از مجاز شدن گروه، اگر فرمان‌های بومی فعال هستند، `/whoami@<bot_username>` را اجرا کنید

  </Tab>
</Tabs>

## رفتار runtime

- Telegram متعلق به فرایند Gateway است.
- مسیریابی قطعی است: پاسخ‌های ورودی Telegram به Telegram برمی‌گردند (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به envelope مشترک کانال با فراداده پاسخ، جای‌نگهدارهای رسانه، و زمینه زنجیره پاسخ پایدارشده برای پاسخ‌های Telegram که Gateway مشاهده کرده است، نرمال‌سازی می‌شوند.
- نشست‌های گروهی بر اساس شناسه گروه ایزوله می‌شوند. موضوعات انجمن `:topic:<threadId>` را اضافه می‌کنند تا موضوعات ایزوله بمانند.
- پیام‌های DM می‌توانند `message_thread_id` داشته باشند؛ OpenClaw آن را برای پاسخ‌ها حفظ می‌کند. نشست‌های موضوعی DM فقط زمانی جدا می‌شوند که `getMe` در Telegram برای ربات `has_topics_enabled: true` گزارش کند؛ در غیر این صورت DMها روی نشست تخت باقی می‌مانند.
- نظرسنجی طولانی از اجراکننده grammY با توالی‌گذاری به‌ازای هر چت/هر رشته استفاده می‌کند. همزمانی کلی sink اجراکننده از `agents.defaults.maxConcurrent` استفاده می‌کند.
- راه‌اندازی چندحسابی، probeهای همزمان Telegram `getMe` را محدود می‌کند تا ناوگان‌های بزرگ ربات همه probeهای حساب‌ها را یک‌باره پخش نکنند.
- نظرسنجی طولانی داخل هر فرایند Gateway محافظت می‌شود تا فقط یک poller فعال بتواند در هر زمان از یک توکن ربات استفاده کند. اگر هنوز تعارض‌های `getUpdates` 409 را می‌بینید، احتمالاً یک Gateway دیگر OpenClaw، اسکریپت، یا poller خارجی از همان توکن استفاده می‌کند.
- راه‌اندازی‌های مجدد watchdog نظرسنجی طولانی، به‌طور پیش‌فرض پس از ۱۲۰ ثانیه بدون liveness کامل‌شده `getUpdates` فعال می‌شوند. فقط اگر استقرار شما همچنان هنگام کارهای طولانی‌مدت راه‌اندازی‌های مجدد کاذب polling-stall می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ overrideهای به‌ازای هر حساب پشتیبانی می‌شوند.
- Telegram Bot API پشتیبانی رسید خواندن ندارد (`sendReadReceipts` اعمال نمی‌شود).

<Note>
  `channels.telegram.dm.threadReplies` و `channels.telegram.direct.<chatId>.threadReplies` حذف شده‌اند. اگر پیکربندی شما هنوز این کلیدها را دارد، پس از ارتقا `openclaw doctor --fix` را اجرا کنید. مسیریابی موضوع DM اکنون از قابلیت ربات در Telegram `getMe.has_topics_enabled` پیروی می‌کند، که توسط حالت رشته‌ای BotFather کنترل می‌شود: ربات‌های دارای موضوع، وقتی Telegram `message_thread_id` می‌فرستد، از نشست‌های DM با scope رشته استفاده می‌کنند؛ DMهای دیگر روی نشست تخت باقی می‌مانند.
</Note>

## مرجع قابلیت‌ها

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw می‌تواند پاسخ‌های جزئی را در زمان واقعی stream کند:

    - چت‌های مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/موضوعات: پیام پیش‌نمایش + `editMessageText`

    الزامات:

    - `channels.telegram.streaming` برابر `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - پیش‌نمایش‌های کوتاه پاسخ اولیه debounce می‌شوند، سپس اگر اجرا هنوز فعال باشد پس از یک تأخیر محدود materialize می‌شوند
    - `progress` یک پیش‌نویس وضعیت قابل‌ویرایش را برای پیشرفت ابزار نگه می‌دارد، وقتی فعالیت پاسخ پیش از پیشرفت ابزار برسد برچسب وضعیت پایدار را نشان می‌دهد، در پایان آن را پاک می‌کند، و پاسخ نهایی را به‌عنوان پیام عادی می‌فرستد
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده دوباره استفاده کنند یا نه (پیش‌فرض: `true` وقتی streaming پیش‌نمایش فعال است)
    - `streaming.preview.commandText` جزئیات command/exec را داخل آن خطوط پیشرفت ابزار کنترل می‌کند: `raw` (پیش‌فرض، رفتار منتشرشده را حفظ می‌کند) یا `status` (فقط برچسب ابزار)
    - `streaming.progress.commentary` (پیش‌فرض: `false`) متن commentary/مقدمه دستیار را در پیش‌نویس موقت پیشرفت فعال می‌کند
    - `channels.telegram.streamMode` قدیمی، مقدارهای boolean برای `streaming`، و کلیدهای بازنشسته پیش‌نمایش پیش‌نویس native شناسایی می‌شوند؛ برای مهاجرت آن‌ها به پیکربندی streaming فعلی `openclaw doctor --fix` را اجرا کنید

    به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار همان خطوط کوتاه وضعیت هستند که هنگام اجرای ابزارها نشان داده می‌شوند، برای نمونه اجرای فرمان، خواندن فایل، به‌روزرسانی‌های برنامه‌ریزی، خلاصه‌های patch، یا متن مقدمه/commentary Codex در حالت app-server Codex. Telegram این‌ها را به‌طور پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشده OpenClaw از `v2026.4.22` و بعد از آن هماهنگ باشد.

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

    برای قابل‌مشاهده نگه داشتن پیشرفت ابزار اما پنهان کردن متن command/exec، تنظیم کنید:

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

    وقتی پیشرفت ابزار قابل‌مشاهده می‌خواهید بدون اینکه پاسخ نهایی در همان پیام ویرایش شود، از حالت `progress` استفاده کنید. خط‌مشی متن فرمان را زیر `streaming.progress` قرار دهید:

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

    فقط زمانی از `streaming.mode: "off"` استفاده کنید که تحویل فقط نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و chatter عمومی ابزار/پیشرفت به‌جای ارسال به‌صورت پیام‌های وضعیت مستقل، سرکوب می‌شود. درخواست‌های تأیید، payloadهای رسانه، و خطاها همچنان از مسیر تحویل نهایی عادی عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و خطوط وضعیت پیشرفت ابزار را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    <Note>
      پاسخ‌های نقل‌قول انتخاب‌شده Telegram استثنا هستند. وقتی `replyToMode` برابر `"first"`، `"all"`، یا `"batched"` است و پیام ورودی شامل متن نقل‌قول انتخاب‌شده است، OpenClaw پاسخ نهایی را به‌جای ویرایش پیش‌نمایش پاسخ، از مسیر quote-reply native Telegram می‌فرستد، بنابراین `streaming.preview.toolProgress` نمی‌تواند خطوط کوتاه وضعیت را برای آن turn نشان دهد. پاسخ‌های پیام فعلی بدون متن نقل‌قول انتخاب‌شده همچنان streaming پیش‌نمایش را نگه می‌دارند. وقتی دیده‌شدن پیشرفت ابزار از پاسخ‌های نقل‌قول native مهم‌تر است، `replyToMode: "off"` را تنظیم کنید، یا برای پذیرش این trade-off، `streaming.preview.toolProgress: false` را تنظیم کنید.
    </Note>

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و ویرایش نهایی را درجا انجام می‌دهد
    - نهایی‌های متنی طولانی که به چند پیام Telegram تقسیم می‌شوند، در صورت امکان از پیش‌نمایش موجود به‌عنوان اولین قطعه نهایی دوباره استفاده می‌کنند، سپس فقط قطعه‌های باقی‌مانده را می‌فرستند
    - نهایی‌های حالت progress، پیش‌نویس وضعیت را پاک می‌کنند و به‌جای ویرایش پیش‌نویس به پاسخ، از تحویل نهایی عادی استفاده می‌کنند
    - اگر ویرایش نهایی پیش از تأیید متن کامل‌شده شکست بخورد، OpenClaw از تحویل نهایی عادی استفاده می‌کند و پیش‌نمایش کهنه را پاک‌سازی می‌کند

    برای پاسخ‌های پیچیده (برای نمونه payloadهای رسانه)، OpenClaw به تحویل نهایی عادی برمی‌گردد و سپس پیام پیش‌نمایش را پاک‌سازی می‌کند.

    Streaming پیش‌نمایش از streaming بلوکی جدا است. وقتی streaming بلوکی به‌طور صریح برای Telegram فعال باشد، OpenClaw برای جلوگیری از double-streaming از stream پیش‌نمایش صرف‌نظر می‌کند.

    رفتار stream استدلال:

    - `/reasoning stream` از مسیر پیش‌نمایش استدلال یک کانال پشتیبانی‌شده استفاده می‌کند؛ در Telegram، هنگام تولید، استدلال را داخل پیش‌نمایش زنده stream می‌کند
    - پیش‌نمایش استدلال پس از تحویل نهایی حذف می‌شود؛ وقتی استدلال باید قابل‌مشاهده بماند از `/reasoning on` استفاده کنید
    - پاسخ نهایی بدون متن استدلال فرستاده می‌شود

  </Accordion>

  <Accordion title="Rich message formatting">
    متن خروجی به‌طور پیش‌فرض از پیام‌های HTML استاندارد Telegram استفاده می‌کند تا پاسخ‌ها در کلاینت‌های فعلی Telegram خوانا بمانند. این حالت سازگاری از bold، italic، پیوندها، کد، spoilers، و quotes عادی پشتیبانی می‌کند، اما از بلوک‌های rich-only در Bot API 10.1 مانند جدول‌های native، details، rich media، و formulaها پشتیبانی نمی‌کند.

    برای فعال کردن پیام‌های rich در Bot API 10.1، `channels.telegram.richMessages: true` را تنظیم کنید:

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

    - به agent گفته می‌شود که پیام‌های rich Telegram برای این ربات/حساب در دسترس هستند.
    - متن Markdown از مسیر Markdown IR در OpenClaw render می‌شود و به‌صورت HTML rich Telegram فرستاده می‌شود.
    - payloadهای HTML rich صریح، tagهای پشتیبانی‌شده Bot API 10.1 مانند headingها، tableها، details، rich media، و formulaها را حفظ می‌کنند.
    - captionهای رسانه همچنان از captionهای HTML Telegram استفاده می‌کنند، زیرا پیام‌های rich جایگزین captionها نمی‌شوند.

    این کار متن مدل را از sigilهای Telegram Rich Markdown دور نگه می‌دارد، بنابراین مقادیری مانند `$400-600K` به‌عنوان ریاضی parse نمی‌شوند. متن rich طولانی به‌طور خودکار در محدوده‌های متن rich و بلوک rich در Telegram تقسیم می‌شود. جدول‌هایی که از محدودیت ستون Telegram فراتر می‌روند به‌صورت بلوک کد فرستاده می‌شوند.

    پیش‌فرض: برای سازگاری کلاینت خاموش است. پیام‌های rich به کلاینت‌های سازگار Telegram نیاز دارند؛ برخی کلاینت‌های فعلی Desktop، Web، Android، و شخص ثالث پیام‌های rich پذیرفته‌شده را به‌صورت پشتیبانی‌نشده نمایش می‌دهند. این گزینه را غیرفعال نگه دارید مگر اینکه هر کلاینتی که با ربات استفاده می‌شود بتواند آن‌ها را render کند. `/status` نشان می‌دهد که پیام‌های rich در نشست فعلی Telegram روشن یا خاموش هستند.

    پیش‌نمایش‌های پیوند به‌طور پیش‌فرض فعال هستند. `channels.telegram.linkPreview: false` تشخیص خودکار entity برای متن rich را رد می‌کند.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    ثبت منوی فرمان Telegram هنگام راه‌اندازی با `setMyCommands` انجام می‌شود.

    پیش‌فرض‌های فرمان native:

    - `commands.native: "auto"` فرمان‌های native را برای Telegram فعال می‌کند

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

    - نام‌ها نرمال‌سازی می‌شوند (حذف `/` ابتدایی، حروف کوچک)
    - الگوی معتبر: `a-z`، `0-9`، `_`، طول `1..32`
    - فرمان‌های سفارشی نمی‌توانند فرمان‌های native را override کنند
    - تعارض‌ها/تکراری‌ها رد می‌شوند و log می‌شوند

    نکات:

    - فرمان‌های سفارشی فقط ورودی‌های منو هستند؛ رفتار را خودکار پیاده‌سازی نمی‌کنند
    - فرمان‌های plugin/skill همچنان ممکن است هنگام تایپ شدن کار کنند، حتی اگر در منوی Telegram نمایش داده نشوند

    اگر فرمان‌های native غیرفعال باشند، built-inها حذف می‌شوند. فرمان‌های سفارشی/plugin ممکن است همچنان در صورت پیکربندی ثبت شوند.

    خطاهای رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از trimming هنوز overflow شده است؛ فرمان‌های plugin/skill/سفارشی را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` با `404: Not Found` در حالی که فرمان‌های مستقیم curl برای Bot API کار می‌کنند، می‌تواند یعنی `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن ربات پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان شکست پاک‌سازی Webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای network/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود است.

    ### فرمان‌های جفت‌سازی دستگاه (Plugin `device-pair`)

    وقتی Plugin `device-pair` نصب باشد:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در برنامه iOS paste کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (شامل role/scopes)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای جدیدترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر حمل می‌کند. bootstrap کد راه‌اندازی built-in فقط node-only است: اولین اتصال یک درخواست node در انتظار ایجاد می‌کند، و پس از تأیید، Gateway یک توکن پایدار node با `scopes: []` برمی‌گرداند. توکن operator واگذارشده برنمی‌گرداند؛ دسترسی operator به جفت‌سازی operator جداگانه تأییدشده یا جریان توکن نیاز دارد.

    اگر دستگاهی با جزئیات احراز هویت تغییرکرده دوباره تلاش کند (برای نمونه role/scopes/public key)، درخواست در انتظار قبلی supersede می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید، `/pair pending` را دوباره اجرا کنید.

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

    دکمه‌های Telegram `web_app` فقط در چت‌های خصوصی بین یک کاربر و
    ربات کار می‌کنند.

    کلیک‌های Callback که توسط handler تعاملی یک Plugin ثبت‌شده
    ادعا نشده باشند، به‌صورت متن به عامل ارسال می‌شوند:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="کنش‌های پیام Telegram برای عامل‌ها و خودکارسازی">
    کنش‌های ابزار Telegram شامل این موارد هستند:

    - `sendMessage` (`to`, `content`, اختیاری `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` یا `caption`, دکمه‌های درون‌خطی اختیاری `presentation`؛ ویرایش‌های فقط دکمه، reply markup را به‌روزرسانی می‌کنند)
    - `createForumTopic` (`chatId`, `name`, اختیاری `iconColor`, `iconCustomEmojiId`)

    کنش‌های پیام کانال نام‌های مستعار کاربردی ارائه می‌کنند (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    کنترل‌های محدودسازی:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌صورت پیش‌فرض فعال‌اند و toggleهای جداگانهٔ `channels.telegram.actions.*` ندارند.
    ارسال‌های زمان اجرا از snapshot فعال پیکربندی/secretها استفاده می‌کنند (راه‌اندازی/بارگذاری دوباره)، بنابراین مسیرهای کنش برای هر ارسال، SecretRef را به‌صورت موقت دوباره resolve نمی‌کنند.

    معناشناسی حذف واکنش: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="برچسب‌های رشته‌بندی پاسخ">
    Telegram از برچسب‌های صریح رشته‌بندی پاسخ در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام آغازگر پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسهٔ پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` نحوهٔ پردازش را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی رشته‌بندی پاسخ فعال باشد و متن یا caption اصلی Telegram در دسترس باشد، OpenClaw به‌صورت خودکار یک excerpt نقل‌قول بومی Telegram را اضافه می‌کند. Telegram متن نقل‌قول بومی را به 1024 واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل‌قول می‌شوند و اگر Telegram نقل‌قول را رد کند، به یک پاسخ ساده fallback می‌کنند.

    نکته: `off` رشته‌بندی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="موضوعات انجمن و رفتار رشته">
    سوپرگروه‌های انجمن:

    - کلیدهای نشست موضوع `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و تایپ کردن، رشتهٔ موضوع را هدف می‌گیرند
    - مسیر پیکربندی موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالت ویژهٔ موضوع عمومی (`threadId=1`):

    - ارسال پیام‌ها `message_thread_id` را حذف می‌کنند (Telegram مقدار `sendMessage(...thread_id=1)` را رد می‌کند)
    - کنش‌های تایپ همچنان `message_thread_id` را شامل می‌شوند

    وراثت موضوع: ورودی‌های موضوع، تنظیمات گروه را به ارث می‌برند مگر اینکه بازنویسی شوند (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` فقط مخصوص موضوع است و از پیش‌فرض‌های گروه به ارث نمی‌رسد.
    `topics."*"` پیش‌فرض‌ها را برای هر موضوع در آن گروه تنظیم می‌کند؛ شناسه‌های دقیق موضوع همچنان بر `"*"` اولویت دارند.

    **مسیریابی عامل برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در پیکربندی موضوع، به یک عامل متفاوت مسیریابی شود. این کار به هر موضوع فضای کاری، حافظه و نشست جداگانهٔ خودش را می‌دهد. نمونه:

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

    **اتصال پایدار موضوع ACP**: موضوعات انجمن می‌توانند نشست‌های harness ACP را از طریق bindingهای ACP نوع‌دار سطح بالا pin کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و یک شناسهٔ دارای topic مانند `-1001234567890:topic:42`). در حال حاضر به موضوعات انجمن در گروه‌ها/سوپرگروه‌ها محدود است. [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

    **ایجاد ACP وابسته به رشته از چت**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک نشست ACP جدید متصل می‌کند؛ پیگیری‌ها مستقیماً به همان‌جا مسیریابی می‌شوند. OpenClaw تأیید ایجاد را در همان موضوع pin می‌کند. نیاز دارد `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    زمینهٔ قالب، `MessageThreadId` و `IsForum` را در معرض می‌گذارد. چت‌های DM دارای `message_thread_id` فرادادهٔ پاسخ را نگه می‌دارند؛ آن‌ها فقط زمانی از کلیدهای نشست آگاه از رشته استفاده می‌کنند که `getMe` در Telegram برای ربات، `has_topics_enabled: true` را گزارش کند.
    بازنویسی‌های قبلی `dm.threadReplies` و `direct.*.threadReplies` عمداً بازنشسته شده‌اند؛ از حالت رشته‌ای BotFather به‌عنوان تنها منبع حقیقت استفاده کنید و برای حذف کلیدهای پیکربندی کهنه، `openclaw doctor --fix` را اجرا کنید.

  </Accordion>

  <Accordion title="صدا، ویدئو و استیکرها">
    ### پیام‌های صوتی

    Telegram بین یادداشت‌های صوتی و فایل‌های صوتی تمایز قائل می‌شود.

    - پیش‌فرض: رفتار فایل صوتی
    - برچسب `[[audio_as_voice]]` در پاسخ عامل برای اجبار ارسال به‌صورت یادداشت صوتی
    - transcriptهای یادداشت صوتی ورودی در زمینهٔ عامل به‌عنوان متن ماشین‌تولیدشده و
      نامطمئن قاب‌بندی می‌شوند؛ تشخیص mention همچنان از transcript خام استفاده می‌کند،
      بنابراین پیام‌های صوتی محدودشده با mention همچنان کار می‌کنند.

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

    Telegram بین فایل‌های ویدیویی و یادداشت‌های ویدیویی تفاوت قائل می‌شود.

    نمونهٔ اقدام پیام:

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

    مدیریت استیکرهای ورودی:

    - WEBP ایستا: دانلود و پردازش می‌شود (جای‌نگهدار `<media:sticker>`)
    - TGS متحرک: نادیده گرفته می‌شود
    - WEBM ویدیویی: نادیده گرفته می‌شود

    فیلدهای زمینهٔ استیکر:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    توضیحات استیکرها در وضعیت Plugin SQLite مربوط به OpenClaw کش می‌شوند تا فراخوانی‌های تکراری بینایی کاهش یابد.

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
    واکنش‌های Telegram به‌صورت به‌روزرسانی‌های `message_reaction` می‌رسند (جدا از بارهای پیام).

    وقتی فعال باشد، OpenClaw رویدادهای سیستمی مانند این را در صف قرار می‌دهد:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکته‌ها:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط ربات (به‌صورت بهترین تلاش از طریق کش پیام‌های ارسالی).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)؛ فرستنده‌های غیرمجاز حذف می‌شوند.
    - Telegram در به‌روزرسانی‌های واکنش شناسهٔ رشته ارائه نمی‌کند.
      - گروه‌های غیرانجمنی به نشست گفت‌وگوی گروهی هدایت می‌شوند
      - گروه‌های انجمنی به نشست موضوع عمومی گروه (`:topic:1`) هدایت می‌شوند، نه موضوع دقیق مبدأ

    `allowed_updates` برای polling/webhook به‌طور خودکار شامل `message_reaction` می‌شود.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` زمانی که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید ارسال می‌کند. `ackReactionScope` تعیین می‌کند آن ایموجی واقعاً *چه زمانی* ارسال شود.

    **ترتیب حل ایموجی (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکته‌ها:

    - Telegram انتظار ایموجی unicode دارد (برای مثال "👀").
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

    **دامنه (`messages.ackReactionScope`):**

    ارائه‌دهندهٔ Telegram دامنه را از `messages.ackReactionScope` می‌خواند (پیش‌فرض `"group-mentions"`). امروزه هیچ بازنویسی در سطح حساب Telegram یا سطح کانال Telegram وجود ندارد.

    مقادیر: `"all"` (پیام‌های مستقیم + گروه‌ها)، `"direct"` (فقط پیام‌های مستقیم)، `"group-all"` (هر پیام گروهی، بدون پیام مستقیم)، `"group-mentions"` (گروه‌ها وقتی ربات منشن شود؛ **بدون پیام مستقیم** — این پیش‌فرض است)، `"off"` / `"none"` (غیرفعال).

    <Note>
    دامنهٔ پیش‌فرض (`"group-mentions"`) واکنش‌های تأیید را در پیام‌های مستقیم اجرا نمی‌کند. برای دریافت واکنش تأیید روی پیام‌های مستقیم ورودی Telegram، `messages.ackReactionScope` را روی `"direct"` یا `"all"` تنظیم کنید. مقدار هنگام راه‌اندازی ارائه‌دهندهٔ Telegram خوانده می‌شود، بنابراین برای اعمال تغییر، راه‌اندازی مجدد Gateway لازم است.
    </Note>

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی کانال به‌صورت پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های تحریک‌شده توسط Telegram شامل این موارد است:

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

  <Accordion title="Long polling در برابر Webhook">
    پیش‌فرض long polling است. برای حالت Webhook، `channels.telegram.webhookUrl` و `channels.telegram.webhookSecret` را تنظیم کنید؛ `webhookPath`، `webhookHost`، `webhookPort` اختیاری هستند (پیش‌فرض‌ها `/telegram-webhook`، `127.0.0.1`، `8787`).

    در حالت long-polling، OpenClaw نشانگر راه‌اندازی مجدد خود را فقط پس از ارسال موفق یک به‌روزرسانی پایدار می‌کند. اگر یک handler شکست بخورد، آن به‌روزرسانی در همان فرایند قابل تلاش دوباره باقی می‌ماند و برای حذف تکرار در راه‌اندازی مجدد به‌عنوان کامل‌شده نوشته نمی‌شود.

    شنوندهٔ محلی به `127.0.0.1:8787` متصل می‌شود. برای ورودی عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا عمداً `webhookHost: "0.0.0.0"` را تنظیم کنید.

    حالت Webhook نگهبان‌های درخواست، توکن محرمانهٔ Telegram، و بدنهٔ JSON را پیش از برگرداندن `200` به Telegram اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان laneهای ربات به‌ازای هر گفت‌وگو/هر موضوع که long polling استفاده می‌کند پردازش می‌کند، بنابراین نوبت‌های کند عامل، ACK تحویل Telegram را نگه نمی‌دارند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش مجدد، و اهداف CLI">
    - مقدار پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف (خط‌های خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازه رسانه ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.mediaGroupFlushMs` (پیش‌فرض 500) کنترل می‌کند آلبوم‌ها/گروه‌های رسانه‌ای Telegram چه مدت بافر شوند پیش از آنکه OpenClaw آن‌ها را به‌صورت یک پیام ورودی ارسال کند. اگر بخش‌های آلبوم دیر می‌رسند، آن را افزایش دهید؛ برای کاهش تأخیر پاسخ آلبوم، آن را کاهش دهید.
    - `channels.telegram.timeoutSeconds` زمان‌انتظار کلاینت API Telegram را بازنویسی می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های بات مقدارهای پیکربندی‌شده کمتر از گارد درخواست 60 ثانیه‌ای متن/تایپ خروجی را محدود می‌کنند تا grammY تحویل پاسخ قابل مشاهده را پیش از اجرای گارد انتقال و fallback OpenClaw قطع نکند. long polling همچنان از گارد درخواست 45 ثانیه‌ای `getUpdates` استفاده می‌کند تا pollهای بیکار برای همیشه رها نشوند.
    - مقدار پیش‌فرض `channels.telegram.pollingStallThresholdMs` برابر `120000` است؛ فقط برای راه‌اندازی‌های مجدد مثبت کاذب ناشی از توقف polling، آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچه زمینه گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` استفاده می‌کند (پیش‌فرض 50)؛ `0` آن را غیرفعال می‌کند.
    - زمینه تکمیلی پاسخ/نقل‌قول/بازارسال، وقتی gateway پیام‌های والد را مشاهده کرده باشد، در یک پنجره زمینه گفت‌وگوی انتخاب‌شده نرمال‌سازی می‌شود؛ کش پیام‌های مشاهده‌شده در وضعیت Plugin SQLite متعلق به OpenClaw نگه‌داری می‌شود، و `openclaw doctor --fix` sidecarهای قدیمی را وارد می‌کند. Telegram در به‌روزرسانی‌ها فقط یک `reply_to_message` کم‌عمق را شامل می‌شود، بنابراین زنجیره‌های قدیمی‌تر از کش، به payload فعلی به‌روزرسانی Telegram محدود هستند.
    - فهرست‌های مجاز Telegram عمدتاً تعیین می‌کنند چه کسی می‌تواند agent را فعال کند، نه یک مرز کامل ویرایش زمینه تکمیلی.
    - کنترل‌های تاریخچه DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای API خروجی قابل بازیابی، روی کمک‌کننده‌های ارسال Telegram (CLI/ابزارها/کنش‌ها) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای خطاهای پیش از اتصال Telegram از تلاش مجدد محدود safe-send استفاده می‌کند، اما پاکت‌های شبکه مبهم پس از ارسال را که ممکن است پیام‌های قابل مشاهده را تکراری کنند، دوباره تلاش نمی‌کند.

    اهداف ارسال CLI و ابزار پیام می‌توانند شناسه عددی چت، نام کاربری، یا هدف موضوع forum باشند:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    pollهای Telegram از `openclaw message poll` استفاده می‌کنند و از موضوع‌های forum پشتیبانی می‌کنند:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    فلگ‌های poll مخصوص Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` برای موضوع‌های forum (یا از یک هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین پشتیبانی می‌کند از:

    - `--presentation` همراه با بلوک‌های `buttons` برای صفحه‌کلیدهای درون‌خطی وقتی `channels.telegram.capabilities.inlineButtons` آن را مجاز کند
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل سنجاق‌شده وقتی بات بتواند در آن چت سنجاق کند
    - `--force-document` برای ارسال تصاویر، GIFها، و ویدئوهای خروجی به‌صورت سند به‌جای بارگذاری عکس فشرده، رسانه متحرک، یا ویدئو

    کنترل دسترسی کنش‌ها:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله pollها، را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ساخت poll در Telegram را غیرفعال می‌کند، در حالی که ارسال‌های عادی همچنان فعال می‌مانند

  </Accordion>

  <Accordion title="تأییدهای exec در Telegram">
    Telegram از تأییدهای exec در DMهای تأییدکننده پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در چت یا موضوع مبدأ نیز ارسال کند. تأییدکننده‌ها باید شناسه‌های عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی دست‌کم یک تأییدکننده قابل حل باشد، خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی مالک از `commands.ownerAllowFrom` fallback می‌کند)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom`، و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با بات صحبت کند و بات پاسخ‌های عادی را کجا می‌فرستد. آن‌ها کسی را تأییدکننده exec نمی‌کنند. نخستین جفت‌سازی DM تأییدشده، وقتی هنوز هیچ مالک فرمانی وجود نداشته باشد، `commands.ownerAllowFrom` را راه‌اندازی اولیه می‌کند، بنابراین راه‌اندازی تک‌مالک همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانالی متن فرمان را در چت نشان می‌دهد؛ فقط در گروه‌ها/موضوع‌های مورد اعتماد `channel` یا `both` را فعال کنید. وقتی prompt در یک موضوع forum قرار می‌گیرد، OpenClaw موضوع را برای prompt تأیید و پیام پیگیری حفظ می‌کند. تأییدهای exec به‌طور پیش‌فرض پس از 30 دقیقه منقضی می‌شوند.

    دکمه‌های تأیید درون‌خطی نیز نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group`، یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدهای plugin حل می‌شوند؛ دیگر موارد ابتدا از طریق تأییدهای exec حل می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی agent با خطای تحویل یا provider روبه‌رو می‌شود، سیاست خطا کنترل می‌کند آیا پیام‌های خطا به چت Telegram ارسال شوند یا نه:

| کلید                                | مقدارها                   | پیش‌فرض        | توضیح                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — هر پیام خطا را به چت ارسال کن. `once` — هر پیام خطای یکتا را در هر پنجره cooldown یک‌بار ارسال کن (خطاهای تکراری یکسان را سرکوب کن). `silent` — هرگز پیام خطا را به چت ارسال نکن. |
| `channels.telegram.errorCooldownMs` | عدد (ms)                   | `14400000` (4h) | پنجره cooldown برای سیاست `once`. پس از ارسال یک خطا، همان پیام خطا تا پایان این بازه سرکوب می‌شود. از هرزفرستادن خطا در زمان قطعی‌ها جلوگیری می‌کند.                                      |

بازنویسی‌های سطح حساب، گروه، و موضوع پشتیبانی می‌شوند (همان وراثت سایر کلیدهای پیکربندی Telegram).

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
  <Accordion title="بات به پیام‌های گروهی بدون mention پاسخ نمی‌دهد">

    - اگر `requireMention=false` باشد، حالت حریم خصوصی Telegram باید دید کامل را مجاز کند.
      - BotFather: `/setprivacy` -> Disable
      - سپس بات را از گروه حذف کنید و دوباره اضافه کنید
    - وقتی پیکربندی انتظار پیام‌های گروهی بدون mention دارد، `openclaw channels status` هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ wildcard `"*"` را نمی‌توان از نظر عضویت probe کرد.
    - آزمون سریع session: `/activation always`.

  </Accordion>

  <Accordion title="بات اصلاً پیام‌های گروه را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا `"*"` را شامل شود)
    - عضویت بات در گروه را تأیید کنید
    - لاگ‌ها را بررسی کنید: `openclaw logs --follow` برای دلیل‌های رد شدن

  </Accordion>

  <Accordion title="فرمان‌ها به‌صورت ناقص کار می‌کنند یا اصلاً کار نمی‌کنند">

    - هویت فرستنده خود را مجاز کنید (جفت‌سازی و/یا `allowFrom` عددی)
    - مجوز فرمان حتی وقتی سیاست گروه `open` باشد همچنان اعمال می‌شود
    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی native ورودی‌های زیادی دارد؛ فرمان‌های plugin/skill/سفارشی را کاهش دهید یا منوهای native را غیرفعال کنید
    - فراخوانی‌های راه‌اندازی `deleteMyCommands` / `setMyCommands` و فراخوانی‌های تایپ `sendChatAction` محدود هستند و در زمان timeout درخواست، یک‌بار از طریق fallback انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار شبکه/fetch معمولاً نشان‌دهنده مشکلات دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="راه‌اندازی، token غیرمجاز گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای token پیکربندی‌شده بات است.
    - token بات را در BotFather دوباره کپی یا بازتولید کنید، سپس برای حساب پیش‌فرض `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken`، یا `TELEGRAM_BOT_TOKEN` را به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` در زمان راه‌اندازی نیز یک شکست احراز هویت است؛ برخورد با آن به‌عنوان «هیچ webhookای وجود ندارد» فقط همان شکست token نامعتبر را به فراخوانی‌های API بعدی موکول می‌کند.

  </Accordion>

  <Accordion title="ناپایداری polling یا شبکه">

    - Node 22+ همراه با fetch/proxy سفارشی می‌تواند در صورت ناسازگاری نوع‌های AbortSignal باعث رفتار abort فوری شود.
    - برخی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 resolve می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث شکست‌های متناوب API Telegram شود.
    - اگر لاگ‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این‌ها را به‌عنوان خطاهای شبکه قابل بازیابی دوباره تلاش می‌کند.
    - هنگام راه‌اندازی polling، OpenClaw probe موفق `getMe` زمان راه‌اندازی را برای grammY دوباره استفاده می‌کند تا runner پیش از نخستین `getUpdates` به یک `getMe` دوم نیاز نداشته باشد.
    - اگر `deleteWebhook` هنگام راه‌اندازی polling با خطای شبکه گذرا شکست بخورد، OpenClaw به‌جای انجام یک فراخوانی control-plane دیگر پیش از poll، وارد long polling می‌شود. یک webhook همچنان فعال به‌صورت تداخل `getUpdates` ظاهر می‌شود؛ سپس OpenClaw انتقال Telegram را دوباره می‌سازد و پاک‌سازی webhook را دوباره تلاش می‌کند.
    - اگر socketهای Telegram با یک cadence ثابت کوتاه بازیافت می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ کلاینت‌های بات مقدارهای پیکربندی‌شده کمتر از گاردهای درخواست خروجی و `getUpdates` را محدود می‌کنند، اما نسخه‌های قدیمی‌تر ممکن بود هر poll یا پاسخ را وقتی این مقدار کمتر از آن گاردها تنظیم شده بود abort کنند.
    - اگر لاگ‌ها شامل `Polling stall detected` باشند، OpenClaw به‌طور پیش‌فرض پس از 120 ثانیه بدون تکمیل liveness در long-poll، polling را دوباره راه‌اندازی می‌کند و انتقال Telegram را دوباره می‌سازد.
    - `openclaw channels status --probe` و `openclaw doctor` زمانی هشدار می‌دهند که یک حساب polling در حال اجرا پس از مهلت راه‌اندازی `getUpdates` را تکمیل نکرده باشد، یک حساب webhook در حال اجرا پس از مهلت راه‌اندازی `setWebhook` را تکمیل نکرده باشد، یا آخرین فعالیت موفق انتقال polling کهنه باشد.
    - `channels.telegram.pollingStallThresholdMs` را فقط وقتی افزایش دهید که فراخوانی‌های طولانی‌مدت `getUpdates` سالم هستند اما میزبان شما همچنان راه‌اندازی‌های مجدد مثبت کاذب توقف polling را گزارش می‌کند. توقف‌های پایدار معمولاً به مشکلات proxy، DNS، IPv6، یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین envهای proxy فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY`، و گونه‌های حروف کوچک آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌تواند `api.telegram.org` را دور بزند.
    - اگر proxy مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای محیط سرویس پیکربندی شده باشد و هیچ env استاندارد proxy وجود نداشته باشد، Telegram نیز از همان URL برای انتقال Bot API استفاده می‌کند.
    - روی میزبان‌های VPS با خروجی مستقیم/TLS ناپایدار، فراخوانی‌های API Telegram را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌طور پیش‌فرض `autoSelectFamily=true` است (به‌جز WSL2). ترتیب نتیجه DNS در Telegram ابتدا از `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، سپس از `channels.telegram.network.dnsResultOrder`، و بعد از پیش‌فرض فرایند مانند `NODE_OPTIONS=--dns-result-order=ipv4first` پیروی می‌کند؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` بازمی‌گردد.
    - اگر میزبان شما WSL2 است یا صراحتاً با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب خانواده را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های بازه بنچمارک RFC 2544 (`198.18.0.0/15`) از قبل به‌طور پیش‌فرض
      برای دانلودهای رسانه‌ای Telegram مجاز هستند. اگر یک IP جعلی مورداعتماد یا
      پروکسی شفاف، هنگام دانلود رسانه، `api.telegram.org` را به یک آدرس
      خصوصی/داخلی/کاربرد ویژه دیگر بازنویسی می‌کند، می‌توانید گذر مخصوص Telegram
      را فعال کنید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین فعال‌سازی برای هر حساب نیز در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر پروکسی شما میزبان‌های رسانه‌ای Telegram را به `198.18.x.x` resolve می‌کند، ابتدا
      پرچم خطرناک را خاموش بگذارید. رسانه Telegram از قبل به‌طور پیش‌فرض بازه
      بنچمارک RFC 2544 را مجاز می‌داند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانه
      Telegram را تضعیف می‌کند. فقط در محیط‌های پروکسی مورداعتماد و تحت کنترل اپراتور
      مانند مسیریابی IP جعلی Clash، Mihomo، یا Surge از آن استفاده کنید، وقتی که
      پاسخ‌های خصوصی یا کاربرد ویژه خارج از بازه بنچمارک RFC 2544 تولید می‌کنند.
      برای دسترسی عادی Telegram از اینترنت عمومی، آن را خاموش بگذارید.
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

- راه‌اندازی/احراز هویت: `enabled`، `botToken`، `tokenFile`، `accounts.*` (`tokenFile` باید به یک فایل عادی اشاره کند؛ symlinkها رد می‌شوند)
- کنترل دسترسی: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، `bindings[]` سطح بالا (`type: "acp"`)
- پیش‌فرض‌های موضوع: `groups.<chatId>.topics."*"` برای موضوع‌های انجمن بدون تطابق اعمال می‌شود؛ شناسه‌های دقیق موضوع آن را بازنویسی می‌کنند
- تأییدهای exec: `execApprovals`، `accounts.*.execApprovals`
- دستور/منو: `commands.native`، `commands.nativeSkills`، `customCommands`
- نخ‌ها/پاسخ‌ها: `replyToMode`
- استریمینگ: `streaming` (پیش‌نمایش)، `streaming.preview.toolProgress`، `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`، `chunkMode`، `richMessages`، `linkPreview`، `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`، `mediaGroupFlushMs`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- ریشه API سفارشی: `apiRoot` (فقط ریشه Bot API؛ `/bot<TOKEN>` را وارد نکنید)
- Webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- کنش‌ها/قابلیت‌ها: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- واکنش‌ها: `reactionNotifications`، `reactionLevel`
- خطاها: `errorPolicy`، `errorCooldownMs`
- نوشتن‌ها/تاریخچه: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را وارد کنید) تا مسیریابی پیش‌فرض صریح شود. در غیر این صورت OpenClaw به نخستین شناسه حساب نرمال‌شده بازمی‌گردد و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقادیر `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را با Gateway جفت کنید.
  </Card>
  <Card title="Groups" icon="users" href="/fa/channels/groups">
    رفتار allowlist گروه و موضوع.
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
    عیب‌یابی بین‌کانالی.
  </Card>
</CardGroup>

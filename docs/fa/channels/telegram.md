---
read_when:
    - کار روی قابلیت‌های Telegram یا Webhookها
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-03T17:29:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 202d6eaaf9348203855659d30616368995bce9269082e60dfed67c8d444abf18
    source_path: channels/telegram.md
    workflow: 16
---

آمادهٔ تولید برای پیام‌های مستقیم ربات و گروه‌ها از طریق grammY. Long polling حالت پیش‌فرض است؛ حالت webhook اختیاری است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    سیاست پیش‌فرض پیام مستقیم برای Telegram، جفت‌سازی است.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌ها و راهنماهای تعمیر بین‌کانالی.
  </Card>
  <Card title="پیکربندی Gateway" icon="settings" href="/fa/gateway/configuration">
    الگوها و مثال‌های کامل پیکربندی کانال.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Steps>
  <Step title="توکن ربات را در BotFather ایجاد کنید">
    Telegram را باز کنید و با **@BotFather** گفتگو کنید (تأیید کنید که شناسه دقیقاً `@BotFather` است).

    `/newbot` را اجرا کنید، درخواست‌ها را دنبال کنید و توکن را ذخیره کنید.

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

    جایگزین env: `TELEGRAM_BOT_TOKEN=...` (فقط حساب پیش‌فرض).
    Telegram از `openclaw channels login telegram` استفاده **نمی‌کند**؛ توکن را در config/env پیکربندی کنید، سپس gateway را شروع کنید.

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

    - شناسه کاربر Telegram شما، استفاده‌شده در `allowFrom` / `groupAllowFrom`
    - شناسه گفتگوی گروه Telegram، استفاده‌شده به‌عنوان کلید زیر `channels.telegram.groups`

    برای راه‌اندازی نخستین‌بار، شناسه گفتگوی گروه را از `openclaw logs --follow`، یک ربات شناسهٔ فورواردشده، یا Bot API `getUpdates` بگیرید. پس از مجاز شدن گروه، `/whoami@<bot_username>` می‌تواند شناسه‌های کاربر و گروه را تأیید کند.

    شناسه‌های منفی supergroup در Telegram که با `-100` شروع می‌شوند، شناسه‌های گفتگوی گروه هستند. آن‌ها را زیر `channels.telegram.groups` قرار دهید، نه زیر `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتیب تشخیص توکن نسبت به حساب آگاه است. در عمل، مقدارهای config بر جایگزین env اولویت دارند، و `TELEGRAM_BOT_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
پس از راه‌اندازی موفق، OpenClaw هویت ربات را تا ۲۴ ساعت در پوشهٔ وضعیت کش می‌کند تا راه‌اندازی‌های دوباره بتوانند از یک فراخوانی اضافی Telegram `getMe` پرهیز کنند؛ تغییر دادن یا حذف توکن این کش را پاک می‌کند.
</Note>

## تنظیمات سمت Telegram

<AccordionGroup>
  <Accordion title="حالت حریم خصوصی و دیده‌شدن گروه">
    ربات‌های Telegram به‌صورت پیش‌فرض روی **حالت حریم خصوصی** هستند، که پیام‌های گروهی دریافتی آن‌ها را محدود می‌کند.

    اگر ربات باید همهٔ پیام‌های گروه را ببیند، یکی از این کارها را انجام دهید:

    - حالت حریم خصوصی را از طریق `/setprivacy` غیرفعال کنید، یا
    - ربات را مدیر گروه کنید.

    هنگام تغییر حالت حریم خصوصی، ربات را در هر گروه حذف و دوباره اضافه کنید تا Telegram تغییر را اعمال کند.

  </Accordion>

  <Accordion title="مجوزهای گروه">
    وضعیت مدیر در تنظیمات گروه Telegram کنترل می‌شود.

    ربات‌های مدیر همهٔ پیام‌های گروه را دریافت می‌کنند، که برای رفتار همیشه‌فعال گروه مفید است.

  </Accordion>

  <Accordion title="تغییرات مفید BotFather">

    - `/setjoingroups` برای اجازه دادن/ندادن به افزودن به گروه‌ها
    - `/setprivacy` برای رفتار دیده‌شدن در گروه

  </Accordion>
</AccordionGroup>

## کنترل دسترسی و فعال‌سازی

### هویت ربات گروه

در گروه‌ها و موضوعات انجمن Telegram، اشارهٔ صریح به شناسهٔ پیکربندی‌شدهٔ ربات (برای مثال `@my_bot`) به‌عنوان خطاب به عامل OpenClaw انتخاب‌شده در نظر گرفته می‌شود، حتی وقتی نام شخصیت عامل با نام کاربری Telegram متفاوت باشد. سیاست سکوت گروه همچنان برای ترافیک نامرتبط گروه اعمال می‌شود، اما خود شناسهٔ ربات «شخص دیگری» محسوب نمی‌شود.

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.telegram.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (به حداقل یک شناسه فرستنده در `allowFrom` نیاز دارد)
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    `dmPolicy: "open"` همراه با `allowFrom: ["*"]` به هر حساب Telegram که نام کاربری ربات را پیدا کند یا حدس بزند اجازه می‌دهد به ربات فرمان دهد. فقط برای ربات‌های عمداً عمومی با ابزارهای به‌شدت محدود از آن استفاده کنید؛ ربات‌های تک‌مالک باید از `allowlist` با شناسه‌های عددی کاربر استفاده کنند.

    `channels.telegram.allowFrom` شناسه‌های عددی کاربر Telegram را می‌پذیرد. پیشوندهای `telegram:` / `tg:` پذیرفته و نرمال‌سازی می‌شوند.
    در configهای چندحسابی، یک `channels.telegram.allowFrom` محدودکننده در سطح بالا به‌عنوان مرز ایمنی در نظر گرفته می‌شود: ورودی‌های `allowFrom: ["*"]` در سطح حساب، آن حساب را عمومی نمی‌کنند مگر اینکه allowlist مؤثر حساب پس از ادغام همچنان یک wildcard صریح داشته باشد.
    `dmPolicy: "allowlist"` با `allowFrom` خالی همهٔ پیام‌های مستقیم را مسدود می‌کند و توسط اعتبارسنجی config رد می‌شود.
    راه‌اندازی فقط شناسه‌های عددی کاربر را درخواست می‌کند.
    اگر ارتقا داده‌اید و config شما شامل ورودی‌های allowlist از نوع `@username` است، `openclaw doctor --fix` را اجرا کنید تا آن‌ها را resolve کند (بهترین تلاش؛ نیازمند توکن ربات Telegram).
    اگر قبلاً به فایل‌های allowlist مربوط به pairing-store متکی بوده‌اید، `openclaw doctor --fix` می‌تواند ورودی‌ها را در جریان‌های allowlist به `channels.telegram.allowFrom` بازیابی کند (برای مثال وقتی `dmPolicy: "allowlist"` هنوز شناسه‌های صریحی ندارد).

    برای ربات‌های تک‌مالک، `dmPolicy: "allowlist"` را همراه با شناسه‌های عددی صریح `allowFrom` ترجیح دهید تا سیاست دسترسی در config پایدار بماند (به‌جای وابستگی به تأییدهای جفت‌سازی قبلی).

    سردرگمی رایج: تأیید جفت‌سازی پیام مستقیم به معنی «این فرستنده همه‌جا مجاز است» نیست.
    جفت‌سازی دسترسی پیام مستقیم را اعطا می‌کند. اگر هنوز مالک فرمانی وجود نداشته باشد، نخستین جفت‌سازی تأییدشده همچنین `commands.ownerAllowFrom` را تنظیم می‌کند تا فرمان‌های فقط مالک و تأییدهای exec یک حساب اپراتور صریح داشته باشند.
    مجوز فرستندهٔ گروه همچنان از allowlistهای صریح config می‌آید.
    اگر می‌خواهید «یک‌بار مجاز شوم و هم پیام‌های مستقیم و هم فرمان‌های گروه کار کنند»، شناسه عددی کاربر Telegram خود را در `channels.telegram.allowFrom` بگذارید؛ برای فرمان‌های فقط مالک، مطمئن شوید `commands.ownerAllowFrom` شامل `telegram:<your user id>` است.

    ### یافتن شناسه کاربر Telegram شما

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
         - با `groupPolicy: "allowlist"` (پیش‌فرض): گروه‌ها تا وقتی ورودی‌های `groups` (یا `"*"`) را اضافه کنید مسدود می‌شوند
       - `groups` پیکربندی‌شده: مانند allowlist عمل می‌کند (شناسه‌های صریح یا `"*"`)

    2. **کدام فرستنده‌ها در گروه‌ها مجاز هستند** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (پیش‌فرض)
       - `disabled`

    `groupAllowFrom` برای فیلتر کردن فرستندهٔ گروه استفاده می‌شود. اگر تنظیم نشده باشد، Telegram به `allowFrom` برمی‌گردد.
    ورودی‌های `groupAllowFrom` باید شناسه‌های عددی کاربر Telegram باشند (پیشوندهای `telegram:` / `tg:` نرمال‌سازی می‌شوند).
    شناسه‌های گفتگوی گروه یا supergroup در Telegram را در `groupAllowFrom` نگذارید. شناسه‌های منفی گفتگو زیر `channels.telegram.groups` قرار می‌گیرند.
    ورودی‌های غیرعددی برای مجوز فرستنده نادیده گرفته می‌شوند.
    مرز امنیتی (`2026.2.25+`): احراز هویت فرستندهٔ گروه تأییدهای pairing-store پیام مستقیم را به ارث **نمی‌برد**.
    جفت‌سازی فقط مخصوص پیام مستقیم می‌ماند. برای گروه‌ها، `groupAllowFrom` یا `allowFrom` سطح گروه/موضوع را تنظیم کنید.
    اگر `groupAllowFrom` تنظیم نشده باشد، Telegram به config `allowFrom` برمی‌گردد، نه pairing store.
    الگوی عملی برای ربات‌های تک‌مالک: شناسه کاربر خود را در `channels.telegram.allowFrom` تنظیم کنید، `groupAllowFrom` را تنظیم‌نشده بگذارید، و گروه‌های هدف را زیر `channels.telegram.groups` مجاز کنید.
    نکتهٔ runtime: اگر `channels.telegram` کاملاً وجود نداشته باشد، runtime به‌صورت پیش‌فرض fail-closed با `groupPolicy="allowlist"` عمل می‌کند مگر اینکه `channels.defaults.groupPolicy` صریحاً تنظیم شده باشد.

    راه‌اندازی گروه فقط مالک:

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

    مثال: اجازه دادن فقط به کاربران مشخص در یک گروه مشخص:

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

      - شناسه‌های منفی گفتگوی گروه یا supergroup در Telegram مانند `-1001234567890` را زیر `channels.telegram.groups` بگذارید.
      - وقتی می‌خواهید محدود کنید کدام افراد داخل یک گروه مجاز می‌توانند ربات را فعال کنند، شناسه‌های کاربر Telegram مانند `8734062810` را زیر `groupAllowFrom` بگذارید.
      - فقط وقتی می‌خواهید هر عضو یک گروه مجاز بتواند با ربات صحبت کند، از `groupAllowFrom: ["*"]` استفاده کنید.

    </Warning>

  </Tab>

  <Tab title="رفتار اشاره">
    پاسخ‌های گروهی به‌صورت پیش‌فرض نیازمند اشاره هستند.

    اشاره می‌تواند از این موارد بیاید:

    - اشارهٔ بومی `@botusername`، یا
    - الگوهای اشاره در:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    تغییرهای فرمان در سطح نشست:

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

    زمینهٔ تاریخچهٔ گروه همیشه برای گروه‌ها روشن است و توسط
    `historyLimit` محدود می‌شود. برای غیرفعال کردن پنجرهٔ تاریخچهٔ گروه
    Telegram، `channels.telegram.historyLimit: 0` را تنظیم کنید. کلید بازنشستهٔ `includeGroupHistoryContext`
    توسط `openclaw doctor --fix` حذف می‌شود.

    گرفتن شناسه گفتگوی گروه:

    - یک پیام گروه را به `@userinfobot` / `@getidsbot` فوروارد کنید
    - یا `chat.id` را از `openclaw logs --follow` بخوانید
    - یا Bot API `getUpdates` را بررسی کنید
    - پس از مجاز شدن گروه، اگر فرمان‌های بومی فعال هستند، `/whoami@<bot_username>` را اجرا کنید

  </Tab>
</Tabs>

## رفتار runtime

- Telegram متعلق به فرایند Gateway است.
- مسیریابی قطعی است: پاسخ‌های ورودی Telegram دوباره به Telegram برمی‌گردند (مدل کانال‌ها را انتخاب نمی‌کند).
- پیام‌های ورودی به پوشش کانال مشترک با فراداده پاسخ، جای‌نگهدارهای رسانه، و زمینه زنجیره پاسخ پایدارشده برای پاسخ‌های Telegram که Gateway مشاهده کرده است، نرمال‌سازی می‌شوند.
- نشست‌های گروهی بر اساس شناسه گروه جدا می‌شوند. موضوعات انجمن `:topic:<threadId>` را اضافه می‌کنند تا موضوعات جدا بمانند.
- پیام‌های DM می‌توانند `message_thread_id` داشته باشند؛ OpenClaw آن را برای پاسخ‌ها حفظ می‌کند. نشست‌های موضوعی DM فقط وقتی جدا می‌شوند که `getMe` در Telegram برای ربات `has_topics_enabled: true` گزارش کند؛ در غیر این صورت DMها روی نشست تخت باقی می‌مانند.
- Long polling از grammY runner با توالی‌دهی به‌ازای هر چت/هر رشته استفاده می‌کند. هم‌روندی کلی runner sink از `agents.defaults.maxConcurrent` استفاده می‌کند.
- راه‌اندازی چندحسابی، probeهای هم‌روند Telegram `getMe` را محدود می‌کند تا ناوگان‌های بزرگ ربات، همه probeهای حساب‌ها را هم‌زمان پخش نکنند.
- Long polling داخل هر فرایند Gateway محافظت می‌شود تا در هر زمان فقط یک poller فعال بتواند از یک توکن ربات استفاده کند. اگر هنوز تعارض‌های 409 در `getUpdates` می‌بینید، احتمالاً یک Gateway دیگر OpenClaw، اسکریپت، یا poller خارجی از همان توکن استفاده می‌کند.
- راه‌اندازی مجدد watchdog مربوط به Long-polling به‌طور پیش‌فرض پس از 120 ثانیه بدون liveness تکمیل‌شده `getUpdates` فعال می‌شود. فقط اگر استقرار شما هنوز هنگام کارهای طولانی‌مدت راه‌اندازی مجدد کاذب polling-stall می‌بیند، `channels.telegram.pollingStallThresholdMs` را افزایش دهید. مقدار بر حسب میلی‌ثانیه است و از `30000` تا `600000` مجاز است؛ overrideهای به‌ازای هر حساب پشتیبانی می‌شوند.
- Telegram Bot API از رسید خواندن پشتیبانی نمی‌کند (`sendReadReceipts` اعمال نمی‌شود).

<Note>
  `channels.telegram.dm.threadReplies` و `channels.telegram.direct.<chatId>.threadReplies` حذف شده‌اند. اگر پیکربندی شما هنوز این کلیدها را دارد، پس از ارتقا `openclaw doctor --fix` را اجرا کنید. مسیریابی موضوعی DM اکنون از قابلیت ربات در Telegram `getMe.has_topics_enabled` پیروی می‌کند که با حالت رشته‌ای BotFather کنترل می‌شود: ربات‌های دارای topic از نشست‌های DM با محدوده رشته استفاده می‌کنند وقتی Telegram `message_thread_id` می‌فرستد؛ سایر DMها روی نشست تخت باقی می‌مانند.
</Note>

## مرجع ویژگی‌ها

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw می‌تواند پاسخ‌های جزئی را به‌صورت بلادرنگ stream کند:

    - چت‌های مستقیم: پیام پیش‌نمایش + `editMessageText`
    - گروه‌ها/موضوعات: پیام پیش‌نمایش + `editMessageText`

    نیازمندی:

    - `channels.telegram.streaming` برابر `off | partial | block | progress` است (پیش‌فرض: `partial`)
    - پیش‌نمایش‌های کوتاه پاسخ اولیه debounce می‌شوند، سپس اگر اجرا هنوز فعال باشد پس از یک تأخیر محدود materialize می‌شوند
    - `progress` یک پیش‌نویس وضعیت قابل ویرایش را برای پیشرفت ابزار نگه می‌دارد، وقتی فعالیت پاسخ پیش از پیشرفت ابزار می‌رسد برچسب وضعیت پایدار را نشان می‌دهد، در پایان آن را پاک می‌کند، و پاسخ نهایی را به‌عنوان پیام معمولی می‌فرستد
    - `streaming.preview.toolProgress` کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از همان پیام پیش‌نمایش ویرایش‌شده استفاده کنند یا نه (پیش‌فرض: وقتی streaming پیش‌نمایش فعال است `true`)
    - `streaming.preview.commandText` جزئیات command/exec را داخل آن خطوط پیشرفت ابزار کنترل می‌کند: `raw` (پیش‌فرض، رفتار منتشرشده را حفظ می‌کند) یا `status` (فقط برچسب ابزار)
    - `streaming.progress.commentary` (پیش‌فرض: `false`) متن commentary/مقدمه دستیار را در پیش‌نویس موقت پیشرفت فعال می‌کند
    - `channels.telegram.streamMode` قدیمی، مقدارهای boolean برای `streaming`، و کلیدهای بازنشسته پیش‌نمایش پیش‌نویس native شناسایی می‌شوند؛ برای مهاجرت آن‌ها به پیکربندی streaming فعلی، `openclaw doctor --fix` را اجرا کنید

    به‌روزرسانی‌های پیش‌نمایش پیشرفت ابزار همان خطوط وضعیت کوتاهی هستند که هنگام اجرای ابزارها نشان داده می‌شوند، برای مثال اجرای فرمان، خواندن فایل، به‌روزرسانی‌های برنامه‌ریزی، خلاصه‌های patch، یا متن مقدمه/commentary مربوط به Codex در حالت app-server Codex. Telegram این‌ها را به‌طور پیش‌فرض فعال نگه می‌دارد تا با رفتار منتشرشده OpenClaw از `v2026.4.22` و نسخه‌های بعدی هم‌خوان باشد.

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

    فقط وقتی `streaming.mode: "off"` را استفاده کنید که تحویل فقط نهایی می‌خواهید: ویرایش‌های پیش‌نمایش Telegram غیرفعال می‌شوند و chatter عمومی ابزار/پیشرفت به‌جای ارسال به‌صورت پیام‌های وضعیت مستقل، سرکوب می‌شود. درخواست‌های تأیید، payloadهای رسانه، و خطاها همچنان از مسیر تحویل نهایی معمول عبور می‌کنند. وقتی فقط می‌خواهید ویرایش‌های پیش‌نمایش پاسخ را نگه دارید و خطوط وضعیت پیشرفت ابزار را پنهان کنید، از `streaming.preview.toolProgress: false` استفاده کنید.

    <Note>
      پاسخ‌های نقل‌قول انتخاب‌شده Telegram استثنا هستند. وقتی `replyToMode` برابر `"first"`، `"all"`، یا `"batched"` است و پیام ورودی شامل متن نقل‌قول انتخاب‌شده است، OpenClaw پاسخ نهایی را به‌جای ویرایش پیش‌نمایش پاسخ، از مسیر native quote-reply در Telegram می‌فرستد، بنابراین `streaming.preview.toolProgress` نمی‌تواند خطوط وضعیت کوتاه را برای آن نوبت نشان دهد. پاسخ‌های پیام فعلی بدون متن نقل‌قول انتخاب‌شده همچنان streaming پیش‌نمایش را نگه می‌دارند. وقتی قابل‌مشاهده بودن پیشرفت ابزار از پاسخ‌های نقل‌قول native مهم‌تر است، `replyToMode: "off"` را تنظیم کنید، یا برای پذیرش این بده‌بستان `streaming.preview.toolProgress: false` را تنظیم کنید.
    </Note>

    برای پاسخ‌های فقط متنی:

    - پیش‌نمایش‌های کوتاه DM/گروه/موضوع: OpenClaw همان پیام پیش‌نمایش را نگه می‌دارد و ویرایش نهایی را درجا انجام می‌دهد
    - نهایی‌های متنی طولانی که به چند پیام Telegram تقسیم می‌شوند، در صورت امکان از پیش‌نمایش موجود به‌عنوان نخستین قطعه نهایی دوباره استفاده می‌کنند، سپس فقط قطعه‌های باقی‌مانده را می‌فرستند
    - نهایی‌های حالت progress پیش‌نویس وضعیت را پاک می‌کنند و به‌جای ویرایش پیش‌نویس به پاسخ، از تحویل نهایی معمول استفاده می‌کنند
    - اگر ویرایش نهایی پیش از تأیید متن تکمیل‌شده شکست بخورد، OpenClaw از تحویل نهایی معمول استفاده می‌کند و پیش‌نمایش کهنه را پاک‌سازی می‌کند

    برای پاسخ‌های پیچیده (برای مثال payloadهای رسانه)، OpenClaw به تحویل نهایی معمول fallback می‌کند و سپس پیام پیش‌نمایش را پاک‌سازی می‌کند.

    Streaming پیش‌نمایش از block streaming جدا است. وقتی block streaming به‌طور صریح برای Telegram فعال شده باشد، OpenClaw برای جلوگیری از streaming دوگانه از stream پیش‌نمایش صرف‌نظر می‌کند.

    رفتار stream استدلال:

    - `/reasoning stream` از مسیر reasoning-preview یک کانال پشتیبانی‌شده استفاده می‌کند؛ در Telegram، هنگام تولید، استدلال را در پیش‌نمایش زنده stream می‌کند
    - پیش‌نمایش استدلال پس از تحویل نهایی حذف می‌شود؛ وقتی استدلال باید قابل مشاهده بماند از `/reasoning on` استفاده کنید
    - پاسخ نهایی بدون متن استدلال فرستاده می‌شود

  </Accordion>

  <Accordion title="Rich message formatting">
    متن خروجی به‌طور پیش‌فرض از پیام‌های HTML استاندارد Telegram استفاده می‌کند تا پاسخ‌ها در کلاینت‌های فعلی Telegram خوانا بمانند. این حالت سازگاری از bold، italic، پیوندها، code، spoilers، و نقل‌قول‌های معمول پشتیبانی می‌کند، اما از بلوک‌های فقط rich در Bot API 10.1 مانند جدول‌های native، details، رسانه rich، و formulaها پشتیبانی نمی‌کند.

    برای فعال‌سازی پیام‌های rich در Bot API 10.1 مقدار `channels.telegram.richMessages: true` را تنظیم کنید:

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
    - متن Markdown از طریق Markdown IR در OpenClaw render می‌شود و به‌صورت HTML rich در Telegram فرستاده می‌شود.
    - payloadهای HTML rich صریح، tagهای پشتیبانی‌شده Bot API 10.1 مانند headingها، جدول‌ها، details، رسانه rich، و formulaها را حفظ می‌کنند.
    - captionهای رسانه همچنان از captionهای HTML در Telegram استفاده می‌کنند، چون پیام‌های rich جایگزین captionها نمی‌شوند.

    این کار متن مدل را از sigilهای Telegram Rich Markdown دور نگه می‌دارد، بنابراین ارزهایی مانند `$400-600K` به‌عنوان ریاضی parse نمی‌شوند. متن rich طولانی به‌صورت خودکار بر اساس محدودیت‌های متن rich و بلوک rich در Telegram تقسیم می‌شود. جدول‌هایی که از محدودیت ستون Telegram بیشتر باشند، به‌صورت code block فرستاده می‌شوند.

    پیش‌فرض: برای سازگاری کلاینت خاموش است. پیام‌های rich به کلاینت‌های سازگار Telegram نیاز دارند؛ برخی کلاینت‌های فعلی Desktop، Web، Android، و شخص ثالث پیام‌های rich پذیرفته‌شده را به‌صورت پشتیبانی‌نشده نمایش می‌دهند. این گزینه را غیرفعال نگه دارید مگر اینکه همه کلاینت‌هایی که با ربات استفاده می‌شوند بتوانند آن‌ها را render کنند. `/status` نشان می‌دهد که نشست فعلی Telegram پیام‌های rich را روشن دارد یا خاموش.

    پیش‌نمایش‌های پیوند به‌طور پیش‌فرض فعال هستند. `channels.telegram.linkPreview: false` تشخیص خودکار entity را برای متن rich رد می‌کند.

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

    نکته‌ها:

    - فرمان‌های سفارشی فقط ورودی‌های منو هستند؛ رفتار را به‌طور خودکار پیاده‌سازی نمی‌کنند
    - فرمان‌های plugin/skill حتی اگر در منوی Telegram نمایش داده نشوند، هنگام تایپ همچنان می‌توانند کار کنند

    اگر فرمان‌های native غیرفعال باشند، built-inها حذف می‌شوند. فرمان‌های سفارشی/plugin ممکن است در صورت پیکربندی همچنان ثبت شوند.

    شکست‌های رایج راه‌اندازی:

    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی Telegram پس از trimming همچنان overflow شده است؛ فرمان‌های plugin/skill/سفارشی را کاهش دهید یا `channels.telegram.commands.native` را غیرفعال کنید.
    - شکست `deleteWebhook`، `deleteMyCommands`، یا `setMyCommands` همراه با `404: Not Found` در حالی که فرمان‌های مستقیم curl برای Bot API کار می‌کنند، می‌تواند یعنی `channels.telegram.apiRoot` روی endpoint کامل `/bot<TOKEN>` تنظیم شده است. `apiRoot` باید فقط ریشه Bot API باشد، و `openclaw doctor --fix` یک `/bot<TOKEN>` انتهایی تصادفی را حذف می‌کند.
    - `getMe returned 401` یعنی Telegram توکن ربات پیکربندی‌شده را رد کرده است. `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` را با توکن فعلی BotFather به‌روزرسانی کنید؛ OpenClaw پیش از polling متوقف می‌شود، بنابراین این مورد به‌عنوان شکست پاک‌سازی Webhook گزارش نمی‌شود.
    - `setMyCommands failed` همراه با خطاهای network/fetch معمولاً یعنی DNS/HTTPS خروجی به `api.telegram.org` مسدود شده است.

    ### فرمان‌های جفت‌سازی دستگاه (plugin `device-pair`)

    وقتی plugin `device-pair` نصب شده باشد:

    1. `/pair` کد راه‌اندازی تولید می‌کند
    2. کد را در اپ iOS paste کنید
    3. `/pair pending` درخواست‌های در انتظار را فهرست می‌کند (شامل role/scopes)
    4. درخواست را تأیید کنید:
       - `/pair approve <requestId>` برای تأیید صریح
       - `/pair approve` وقتی فقط یک درخواست در انتظار وجود دارد
       - `/pair approve latest` برای تازه‌ترین مورد

    کد راه‌اندازی یک توکن bootstrap کوتاه‌عمر حمل می‌کند. bootstrap داخلی setup-code یک توکن node پایدار با `scopes: []` به‌همراه یک توکن handoff اپراتور محدود برای onboarding موبایل قابل اعتماد برمی‌گرداند. آن توکن اپراتور می‌تواند پیکربندی native زمان راه‌اندازی را بخواند، اما scopeهای mutation جفت‌سازی یا `operator.admin` را اعطا نمی‌کند.

    اگر دستگاهی با جزئیات auth تغییرکرده دوباره تلاش کند (برای مثال role/scopes/public key)، درخواست در انتظار قبلی supersede می‌شود و درخواست جدید از `requestId` متفاوتی استفاده می‌کند. پیش از تأیید دوباره `/pair pending` را اجرا کنید.

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

    دکمه‌های `web_app` در Telegram فقط در چت‌های خصوصی بین کاربر و
    ربات کار می‌کنند.

    کلیک‌های بازفراخوانی که توسط یک handler تعاملی ثبت‌شده Plugin دریافت نشوند
    به‌صورت متن به عامل ارسال می‌شوند:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="کنش‌های پیام Telegram برای عامل‌ها و خودکارسازی">
    کنش‌های ابزار Telegram شامل این موارد هستند:

    - `sendMessage` (`to`, `content`, اختیاری `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` یا `caption`, دکمه‌های درون‌خطی اختیاری `presentation`؛ ویرایش‌های فقط دکمه، نشانه‌گذاری پاسخ را به‌روزرسانی می‌کنند)
    - `createForumTopic` (`chatId`, `name`, اختیاری `iconColor`, `iconCustomEmojiId`)

    کنش‌های پیام کانال نام‌های مستعار کاربردی ارائه می‌کنند (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    کنترل‌های دروازه‌بانی:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (پیش‌فرض: غیرفعال)

    نکته: `edit` و `topic-create` در حال حاضر به‌طور پیش‌فرض فعال هستند و toggle جداگانه `channels.telegram.actions.*` ندارند.
    ارسال‌های زمان اجرا از snapshot فعال پیکربندی/secretها استفاده می‌کنند (راه‌اندازی/بارگذاری مجدد)، بنابراین مسیرهای کنش برای هر ارسال، SecretRef را به‌صورت موردی دوباره resolve نمی‌کنند.

    معناشناسی حذف واکنش: [/tools/reactions](/fa/tools/reactions)

  </Accordion>

  <Accordion title="برچسب‌های رشته‌بندی پاسخ">
    Telegram از برچسب‌های صریح رشته‌بندی پاسخ در خروجی تولیدشده پشتیبانی می‌کند:

    - `[[reply_to_current]]` به پیام محرک پاسخ می‌دهد
    - `[[reply_to:<id>]]` به یک شناسه پیام مشخص Telegram پاسخ می‌دهد

    `channels.telegram.replyToMode` شیوه پردازش را کنترل می‌کند:

    - `off` (پیش‌فرض)
    - `first`
    - `all`

    وقتی رشته‌بندی پاسخ فعال باشد و متن یا caption اصلی Telegram در دسترس باشد، OpenClaw به‌طور خودکار یک گزیده نقل‌قول بومی Telegram اضافه می‌کند. Telegram متن نقل‌قول بومی را به 1024 واحد کد UTF-16 محدود می‌کند، بنابراین پیام‌های طولانی‌تر از ابتدا نقل می‌شوند و اگر Telegram نقل‌قول را رد کند، به یک پاسخ ساده fallback می‌کنند.

    نکته: `off` رشته‌بندی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.

  </Accordion>

  <Accordion title="موضوعات انجمن و رفتار رشته">
    supergroupهای انجمن:

    - کلیدهای session موضوع، `:topic:<threadId>` را اضافه می‌کنند
    - پاسخ‌ها و typing موضوع thread را هدف می‌گیرند
    - مسیر پیکربندی موضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    مورد خاص موضوع عمومی (`threadId=1`):

    - ارسال‌های پیام، `message_thread_id` را حذف می‌کنند (Telegram مقدار `sendMessage(...thread_id=1)` را رد می‌کند)
    - کنش‌های typing همچنان `message_thread_id` را شامل می‌شوند

    وراثت موضوع: ورودی‌های موضوع، تنظیمات گروه را به ارث می‌برند مگر اینکه بازنویسی شده باشند (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` فقط مخصوص موضوع است و از پیش‌فرض‌های گروه ارث‌بری نمی‌کند.
    `topics."*"` پیش‌فرض‌ها را برای هر موضوع در آن گروه تنظیم می‌کند؛ شناسه‌های دقیق موضوع همچنان بر `"*"` اولویت دارند.

    **مسیریابی عامل برای هر موضوع**: هر موضوع می‌تواند با تنظیم `agentId` در پیکربندی موضوع، به عامل متفاوتی مسیریابی شود. این کار به هر موضوع workspace، memory و session ایزوله خودش را می‌دهد. مثال:

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

    **اتصال پایدار موضوع ACP**: موضوعات انجمن می‌توانند sessionهای harness ACP را از طریق اتصال‌های ACP تایپ‌شده سطح بالا pin کنند (`bindings[]` با `type: "acp"` و `match.channel: "telegram"`، `peer.kind: "group"`، و شناسه‌ای واجد شرایط موضوع مانند `-1001234567890:topic:42`). در حال حاضر به موضوعات انجمن در گروه‌ها/supergroupها محدود است. [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

    **ساخت ACP مقید به thread از چت**: `/acp spawn <agent> --thread here|auto` موضوع فعلی را به یک session جدید ACP متصل می‌کند؛ پیگیری‌ها مستقیماً به همان‌جا مسیریابی می‌شوند. OpenClaw تأیید ساخت را داخل موضوع pin می‌کند. نیاز دارد `channels.telegram.threadBindings.spawnSessions` فعال بماند (پیش‌فرض: `true`).

    context قالب، `MessageThreadId` و `IsForum` را ارائه می‌کند. چت‌های DM با `message_thread_id` فراداده پاسخ را نگه می‌دارند؛ آن‌ها فقط وقتی از کلیدهای session آگاه از thread استفاده می‌کنند که `getMe` در Telegram برای ربات، `has_topics_enabled: true` گزارش دهد.
    بازنویسی‌های قبلی `dm.threadReplies` و `direct.*.threadReplies` عمداً بازنشسته شده‌اند؛ از حالت thread شده BotFather به‌عنوان تنها منبع حقیقت استفاده کنید و برای حذف کلیدهای پیکربندی stale، `openclaw doctor --fix` را اجرا کنید.

  </Accordion>

  <Accordion title="صدا، ویدیو، و استیکرها">
    ### پیام‌های صوتی

    Telegram بین voice noteها و فایل‌های صوتی تمایز قائل می‌شود.

    - پیش‌فرض: رفتار فایل صوتی
    - برچسب `[[audio_as_voice]]` در پاسخ عامل برای اجبار ارسال به‌صورت voice-note
    - transcriptهای voice-note ورودی در context عامل به‌صورت متن تولیدشده توسط ماشین و
      غیرقابل اعتماد قاب‌بندی می‌شوند؛ تشخیص mention همچنان از transcript خام استفاده می‌کند
      تا پیام‌های صوتی mention-gated همچنان کار کنند.

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

    Telegram بین فایل‌های ویدیویی و یادداشت‌های ویدیویی تفاوت قائل می‌شود.

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

    رسیدگی به استیکر ورودی:

    - WEBP ایستا: دانلود و پردازش می‌شود (جای‌نگهدار `<media:sticker>`)
    - TGS متحرک: نادیده گرفته می‌شود
    - WEBM ویدیویی: نادیده گرفته می‌شود

    فیلدهای زمینه استیکر:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    توضیحات استیکرها در وضعیت Plugin SQLite مربوط به OpenClaw کش می‌شوند تا فراخوانی‌های تکراری vision کاهش یابد.

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
    واکنش‌های Telegram به‌صورت به‌روزرسانی‌های `message_reaction` می‌رسند (جدا از بارهای پیام).

    وقتی فعال باشد، OpenClaw رویدادهای سیستمی مانند این را در صف قرار می‌دهد:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    پیکربندی:

    - `channels.telegram.reactionNotifications`: `off | own | all` (پیش‌فرض: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (پیش‌فرض: `minimal`)

    نکته‌ها:

    - `own` یعنی فقط واکنش‌های کاربر به پیام‌های ارسال‌شده توسط ربات (بهترین تلاش از طریق کش پیام‌های ارسالی).
    - رویدادهای واکنش همچنان کنترل‌های دسترسی Telegram را رعایت می‌کنند (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ فرستندگان غیرمجاز حذف می‌شوند.
    - Telegram در به‌روزرسانی‌های واکنش، شناسه‌های رشته را ارائه نمی‌کند.
      - گروه‌های غیرانجمنی به نشست گفت‌وگوی گروهی هدایت می‌شوند
      - گروه‌های انجمنی به نشست موضوع عمومی گروه (`:topic:1`) هدایت می‌شوند، نه موضوع مبدأ دقیق

    `allowed_updates` برای polling/Webhook به‌طور خودکار شامل `message_reaction` می‌شود.

  </Accordion>

  <Accordion title="واکنش‌های تایید">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw، یک ایموجی تایید ارسال می‌کند. `ackReactionScope` تعیین می‌کند آن ایموجی واقعاً *چه زمانی* ارسال شود.

    **ترتیب حل ایموجی (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Telegram انتظار ایموجی یونیکد دارد (برای مثال "👀").
    - برای غیرفعال‌کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

    **دامنه (`messages.ackReactionScope`):**

    ارائه‌دهنده Telegram دامنه را از `messages.ackReactionScope` می‌خواند (پیش‌فرض `"group-mentions"`). امروز هیچ بازنویسی در سطح حساب Telegram یا کانال Telegram وجود ندارد.

    مقادیر: `"all"` (DMها + گروه‌ها)، `"direct"` (فقط DMها)، `"group-all"` (هر پیام گروهی، بدون DM)، `"group-mentions"` (گروه‌ها وقتی ربات منشن شده باشد؛ **بدون DM** — این پیش‌فرض است)، `"off"` / `"none"` (غیرفعال).

    <Note>
    دامنه پیش‌فرض (`"group-mentions"`) واکنش‌های تایید را در پیام‌های مستقیم فعال نمی‌کند. برای دریافت واکنش تایید روی DMهای ورودی Telegram، `messages.ackReactionScope` را روی `"direct"` یا `"all"` تنظیم کنید. مقدار هنگام راه‌اندازی ارائه‌دهنده Telegram خوانده می‌شود، بنابراین برای اعمال تغییر باید Gateway دوباره راه‌اندازی شود.
    </Note>

  </Accordion>

  <Accordion title="نوشتن پیکربندی از رویدادها و فرمان‌های Telegram">
    نوشتن پیکربندی کانال به‌طور پیش‌فرض فعال است (`configWrites !== false`).

    نوشتن‌های تحریک‌شده توسط Telegram شامل این موارد هستند:

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

    در حالت long-polling، OpenClaw نشانگر راه‌اندازی دوباره خود را فقط پس از ارسال موفق یک به‌روزرسانی پایدار می‌کند. اگر یک handler ناموفق شود، آن به‌روزرسانی در همان فرایند قابل تلاش دوباره می‌ماند و برای حذف تکرار هنگام راه‌اندازی دوباره، به‌عنوان کامل‌شده نوشته نمی‌شود.

    شنونده محلی به `127.0.0.1:8787` متصل می‌شود. برای ورود عمومی، یا یک reverse proxy جلوی پورت محلی قرار دهید یا `webhookHost: "0.0.0.0"` را عامدانه تنظیم کنید.

    حالت Webhook قبل از بازگرداندن `200` به Telegram، guardهای درخواست، توکن محرمانه Telegram و بدنه JSON را اعتبارسنجی می‌کند.
    سپس OpenClaw به‌روزرسانی را به‌صورت ناهمگام از طریق همان مسیرهای ربات به‌ازای هر گفت‌وگو/هر موضوع پردازش می‌کند که long polling از آن‌ها استفاده می‌کند، بنابراین نوبت‌های کند عامل، ACK تحویل Telegram را نگه نمی‌دارند.

  </Accordion>

  <Accordion title="محدودیت‌ها، تلاش دوباره، و هدف‌های CLI">
    - مقدار پیش‌فرض `channels.telegram.textChunkLimit` برابر 4000 است.
    - `channels.telegram.chunkMode="newline"` پیش از تقسیم بر اساس طول، مرزهای پاراگراف‌ها (خط‌های خالی) را ترجیح می‌دهد.
    - `channels.telegram.mediaMaxMb` (پیش‌فرض 100) اندازه رسانه‌های ورودی و خروجی Telegram را محدود می‌کند.
    - `channels.telegram.mediaGroupFlushMs` (پیش‌فرض 500) کنترل می‌کند آلبوم‌ها/گروه‌های رسانه‌ای Telegram چه مدت در بافر بمانند پیش از اینکه OpenClaw آن‌ها را به‌عنوان یک پیام ورودی واحد ارسال کند. اگر بخش‌های آلبوم دیر می‌رسند، آن را افزایش دهید؛ برای کاهش تأخیر پاسخ آلبوم، آن را کاهش دهید.
    - `channels.telegram.timeoutSeconds` زمان‌انتظار کلاینت Telegram API را بازنویسی می‌کند (اگر تنظیم نشده باشد، پیش‌فرض grammY اعمال می‌شود). کلاینت‌های بات، مقادیر پیکربندی‌شده کمتر از محافظ 60 ثانیه‌ای درخواست متن/تایپ خروجی را محدود می‌کنند تا grammY تحویل پاسخ قابل مشاهده را پیش از اجرای محافظ انتقال و مسیر جایگزین OpenClaw قطع نکند. long polling همچنان از محافظ درخواست 45 ثانیه‌ای `getUpdates` استفاده می‌کند تا نظرسنجی‌های بیکار برای همیشه رها نشوند.
    - مقدار پیش‌فرض `channels.telegram.pollingStallThresholdMs` برابر `120000` است؛ فقط برای راه‌اندازی‌های مجدد کاذب ناشی از توقف polling، آن را بین `30000` و `600000` تنظیم کنید.
    - تاریخچه زمینه گروه از `channels.telegram.historyLimit` یا `messages.groupChat.historyLimit` (پیش‌فرض 50) استفاده می‌کند؛ `0` آن را غیرفعال می‌کند.
    - زمینه تکمیلی پاسخ/نقل‌قول/فوروارد، وقتی Gateway پیام‌های والد را مشاهده کرده باشد، در یک پنجره زمینه مکالمه انتخاب‌شده نرمال‌سازی می‌شود؛ کش پیام‌های مشاهده‌شده در وضعیت Plugin SQLite مربوط به OpenClaw قرار دارد، و `openclaw doctor --fix` فایل‌های جانبی قدیمی را وارد می‌کند. Telegram فقط یک `reply_to_message` سطحی را در به‌روزرسانی‌ها شامل می‌شود، بنابراین زنجیره‌های قدیمی‌تر از کش به payload به‌روزرسانی فعلی Telegram محدود هستند.
    - فهرست‌های مجاز Telegram عمدتاً تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند، نه اینکه مرز کامل پاک‌سازی زمینه تکمیلی باشند.
    - کنترل‌های تاریخچه DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - پیکربندی `channels.telegram.retry` برای خطاهای قابل بازیابی API خروجی، روی helperهای ارسال Telegram (CLI/ابزارها/کنش‌ها) اعمال می‌شود. تحویل پاسخ نهایی ورودی نیز برای شکست‌های پیش از اتصال Telegram از تلاش دوباره محدود و ایمن برای ارسال استفاده می‌کند، اما پوش‌های شبکه مبهم پس از ارسال را که می‌توانند پیام‌های قابل مشاهده را تکراری کنند دوباره تلاش نمی‌کند.

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

    پرچم‌های نظرسنجی ویژه Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` برای موضوع‌های انجمن (یا از یک هدف `:topic:` استفاده کنید)

    ارسال Telegram همچنین پشتیبانی می‌کند از:

    - `--presentation` همراه با بلوک‌های `buttons` برای صفحه‌کلیدهای inline، وقتی `channels.telegram.capabilities.inlineButtons` آن را مجاز کند
    - `--pin` یا `--delivery '{"pin":true}'` برای درخواست تحویل سنجاق‌شده، وقتی بات بتواند در آن چت سنجاق کند
    - `--force-document` برای ارسال تصاویر، GIFها، و ویدیوهای خروجی به‌صورت سند، به‌جای بارگذاری‌های عکس فشرده، رسانه متحرک، یا ویدیو

    کنترل دسترسی کنش‌ها:

    - `channels.telegram.actions.sendMessage=false` پیام‌های خروجی Telegram، از جمله نظرسنجی‌ها، را غیرفعال می‌کند
    - `channels.telegram.actions.poll=false` ساخت نظرسنجی Telegram را غیرفعال می‌کند، در حالی که ارسال‌های عادی همچنان فعال می‌مانند

  </Accordion>

  <Accordion title="تأییدهای exec در Telegram">
    Telegram از تأییدهای exec در DMهای تأییدکننده‌ها پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptها را در چت یا موضوع مبدأ ارسال کند. تأییدکننده‌ها باید شناسه عددی کاربر Telegram باشند.

    مسیر پیکربندی:

    - `channels.telegram.execApprovals.enabled` (وقتی حداقل یک تأییدکننده قابل resolve باشد به‌صورت خودکار فعال می‌شود)
    - `channels.telegram.execApprovals.approvers` (به شناسه‌های عددی مالک از `commands.ownerAllowFrom` fallback می‌کند)
    - `channels.telegram.execApprovals.target`: `dm` (پیش‌فرض) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`، `groupAllowFrom`، و `defaultTo` کنترل می‌کنند چه کسی می‌تواند با بات صحبت کند و بات پاسخ‌های عادی را کجا بفرستد. آن‌ها کسی را به تأییدکننده exec تبدیل نمی‌کنند. نخستین جفت‌سازی DM تأییدشده، وقتی هنوز مالک فرمانی وجود ندارد، `commands.ownerAllowFrom` را bootstrap می‌کند، بنابراین راه‌اندازی تک‌مالک همچنان بدون تکرار شناسه‌ها زیر `execApprovals.approvers` کار می‌کند.

    تحویل کانالی متن فرمان را در چت نشان می‌دهد؛ `channel` یا `both` را فقط در گروه‌ها/موضوع‌های مورد اعتماد فعال کنید. وقتی prompt در یک موضوع انجمن قرار می‌گیرد، OpenClaw موضوع را برای prompt تأیید و پیگیری بعدی حفظ می‌کند. تأییدهای exec به‌صورت پیش‌فرض پس از 30 دقیقه منقضی می‌شوند.

    دکمه‌های تأیید inline همچنین نیاز دارند `channels.telegram.capabilities.inlineButtons` سطح هدف (`dm`، `group`، یا `all`) را مجاز کند. شناسه‌های تأیید با پیشوند `plugin:` از طریق تأییدهای Plugin resolve می‌شوند؛ بقیه ابتدا از طریق تأییدهای exec resolve می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## کنترل‌های پاسخ خطا

وقتی عامل با خطای تحویل یا ارائه‌دهنده روبه‌رو می‌شود، سیاست خطا کنترل می‌کند که آیا پیام‌های خطا به چت Telegram فرستاده شوند یا نه:

| کلید                                | مقادیر                    | پیش‌فرض        | توضیح                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — هر پیام خطا را به چت بفرست. `once` — هر پیام خطای یکتا را در هر پنجره cooldown یک بار بفرست (خطاهای یکسان تکراری را سرکوب کن). `silent` — هرگز پیام خطا را به چت نفرست. |
| `channels.telegram.errorCooldownMs` | عدد (ms)                  | `14400000` (4h) | پنجره cooldown برای سیاست `once`. پس از ارسال یک خطا، همان پیام خطا تا پایان این بازه سرکوب می‌شود. از هرزنامه شدن خطاها هنگام قطعی جلوگیری می‌کند.                                                     |

بازنویسی‌های سطح حساب، گروه، و موضوع پشتیبانی می‌شوند (همان وراثت دیگر کلیدهای پیکربندی Telegram).

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
      - سپس بات را از گروه حذف و دوباره اضافه کنید
    - وقتی پیکربندی انتظار پیام‌های گروهی بدون mention داشته باشد، `openclaw channels status` هشدار می‌دهد.
    - `openclaw channels status --probe` می‌تواند شناسه‌های عددی صریح گروه را بررسی کند؛ wildcard `"*"` را نمی‌توان از نظر عضویت probe کرد.
    - آزمون سریع نشست: `/activation always`.

  </Accordion>

  <Accordion title="بات اصلاً پیام‌های گروه را نمی‌بیند">

    - وقتی `channels.telegram.groups` وجود دارد، گروه باید فهرست شده باشد (یا شامل `"*"` باشد)
    - عضویت بات در گروه را بررسی کنید
    - لاگ‌ها را بازبینی کنید: `openclaw logs --follow` برای دلیل‌های skip

  </Accordion>

  <Accordion title="فرمان‌ها ناقص کار می‌کنند یا اصلاً کار نمی‌کنند">

    - هویت فرستنده خود را مجاز کنید (جفت‌سازی و/یا `allowFrom` عددی)
    - مجوزدهی فرمان حتی وقتی سیاست گروه `open` باشد همچنان اعمال می‌شود
    - `setMyCommands failed` همراه با `BOT_COMMANDS_TOO_MUCH` یعنی منوی native ورودی‌های بیش از حد دارد؛ فرمان‌های Plugin/skill/سفارشی را کاهش دهید یا منوهای native را غیرفعال کنید
    - فراخوانی‌های startup مربوط به `deleteMyCommands` / `setMyCommands` و فراخوانی‌های تایپ `sendChatAction` محدود هستند و هنگام timeout درخواست، یک بار از طریق fallback انتقال Telegram دوباره تلاش می‌شوند. خطاهای پایدار شبکه/fetch معمولاً نشان‌دهنده مشکلات دسترسی DNS/HTTPS به `api.telegram.org` هستند

  </Accordion>

  <Accordion title="Startup توکن غیرمجاز گزارش می‌کند">

    - `getMe returned 401` یک شکست احراز هویت Telegram برای توکن بات پیکربندی‌شده است.
    - توکن بات را در BotFather دوباره کپی یا بازتولید کنید، سپس `channels.telegram.botToken`، `channels.telegram.tokenFile`، `channels.telegram.accounts.<id>.botToken`، یا `TELEGRAM_BOT_TOKEN` را برای حساب پیش‌فرض به‌روزرسانی کنید.
    - `deleteWebhook 401 Unauthorized` هنگام startup نیز شکست احراز هویت است؛ تلقی کردن آن به‌عنوان «هیچ webhookای وجود ندارد» فقط همان شکست توکن نامعتبر را به فراخوانی‌های API بعدی موکول می‌کند.

  </Accordion>

  <Accordion title="ناپایداری polling یا شبکه">

    - Node 22+ همراه با fetch/proxy سفارشی می‌تواند اگر نوع‌های AbortSignal ناسازگار باشند، رفتار abort فوری ایجاد کند.
    - برخی میزبان‌ها ابتدا `api.telegram.org` را به IPv6 resolve می‌کنند؛ خروجی IPv6 خراب می‌تواند باعث شکست‌های متناوب Telegram API شود.
    - اگر لاگ‌ها شامل `TypeError: fetch failed` یا `Network request for 'getUpdates' failed!` باشند، OpenClaw اکنون این موارد را به‌عنوان خطاهای شبکه قابل بازیابی دوباره تلاش می‌کند.
    - هنگام startup مربوط به polling، OpenClaw probe موفق startup با `getMe` را برای grammY دوباره استفاده می‌کند تا runner پیش از نخستین `getUpdates` به `getMe` دوم نیاز نداشته باشد.
    - اگر `deleteWebhook` هنگام startup مربوط به polling با خطای گذرای شبکه شکست بخورد، OpenClaw به‌جای انجام یک فراخوانی control-plane دیگر پیش از poll، وارد long polling می‌شود. webhook همچنان فعال به‌صورت conflict در `getUpdates` ظاهر می‌شود؛ سپس OpenClaw انتقال Telegram را دوباره می‌سازد و پاک‌سازی webhook را دوباره تلاش می‌کند.
    - اگر سوکت‌های Telegram با یک cadence ثابت کوتاه بازیافت می‌شوند، مقدار پایین `channels.telegram.timeoutSeconds` را بررسی کنید؛ کلاینت‌های بات مقادیر پیکربندی‌شده کمتر از محافظ‌های درخواست خروجی و `getUpdates` را محدود می‌کنند، اما نسخه‌های قدیمی‌تر ممکن بود وقتی این مقدار کمتر از آن محافظ‌ها تنظیم شده بود، هر poll یا پاسخ را abort کنند.
    - اگر لاگ‌ها شامل `Polling stall detected` باشند، OpenClaw به‌صورت پیش‌فرض پس از 120 ثانیه بدون liveness تکمیل‌شده long-poll، polling را دوباره راه‌اندازی می‌کند و انتقال Telegram را دوباره می‌سازد.
    - `openclaw channels status --probe` و `openclaw doctor` هشدار می‌دهند وقتی یک حساب polling در حال اجرا پس از مهلت startup، `getUpdates` را تکمیل نکرده باشد، وقتی یک حساب webhook در حال اجرا پس از مهلت startup، `setWebhook` را تکمیل نکرده باشد، یا وقتی آخرین فعالیت موفق انتقال polling کهنه باشد.
    - `channels.telegram.pollingStallThresholdMs` را فقط وقتی افزایش دهید که فراخوانی‌های بلندمدت `getUpdates` سالم هستند اما میزبان شما همچنان راه‌اندازی‌های مجدد کاذب polling-stall گزارش می‌کند. توقف‌های پایدار معمولاً به مشکلات proxy، DNS، IPv6، یا خروجی TLS بین میزبان و `api.telegram.org` اشاره دارند.
    - Telegram همچنین envهای proxy فرایند را برای انتقال Bot API رعایت می‌کند، از جمله `HTTP_PROXY`، `HTTPS_PROXY`، `ALL_PROXY`، و گونه‌های lowercase آن‌ها. `NO_PROXY` / `no_proxy` همچنان می‌توانند `api.telegram.org` را bypass کنند.
    - اگر proxy مدیریت‌شده OpenClaw از طریق `OPENCLAW_PROXY_URL` برای یک محیط سرویس پیکربندی شده باشد و هیچ env استاندارد proxy وجود نداشته باشد، Telegram نیز از همان URL برای انتقال Bot API استفاده می‌کند.
    - روی میزبان‌های VPS با خروجی/TLS مستقیم ناپایدار، فراخوانی‌های Telegram API را از طریق `channels.telegram.proxy` مسیریابی کنید:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ به‌صورت پیش‌فرض از `autoSelectFamily=true` استفاده می‌کند (به‌جز WSL2). ترتیب نتایج DNS برای Telegram ابتدا از `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` پیروی می‌کند، سپس از `channels.telegram.network.dnsResultOrder`، و بعد از پیش‌فرض فرایند مانند `NODE_OPTIONS=--dns-result-order=ipv4first`؛ اگر هیچ‌کدام اعمال نشود، Node 22+ به `ipv4first` برمی‌گردد.
    - اگر میزبان شما WSL2 است یا صراحتا با رفتار فقط IPv4 بهتر کار می‌کند، انتخاب خانواده را اجباری کنید:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - پاسخ‌های محدوده بنچمارک RFC 2544 (`198.18.0.0/15`) از قبل به‌صورت پیش‌فرض
      برای دانلود رسانه‌های Telegram مجاز هستند. اگر یک fake-IP معتمد یا
      پراکسی شفاف، `api.telegram.org` را هنگام دانلود رسانه‌ها به یک نشانی
      خصوصی/داخلی/با کاربرد ویژه دیگر بازنویسی می‌کند، می‌توانید به دور زدن
      مخصوص Telegram رضایت دهید:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - همین رضایت‌دهی برای هر حساب نیز در
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` در دسترس است.
    - اگر پراکسی شما میزبان‌های رسانه Telegram را به `198.18.x.x` resolve می‌کند، ابتدا
      پرچم خطرناک را خاموش بگذارید. رسانه Telegram از قبل به‌صورت پیش‌فرض
      محدوده بنچمارک RFC 2544 را مجاز می‌داند.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` محافظت‌های SSRF رسانه
      Telegram را ضعیف می‌کند. فقط در محیط‌های پراکسی معتمد و تحت کنترل اپراتور
      مانند مسیریابی fake-IP در Clash، Mihomo یا Surge از آن استفاده کنید، آن هم زمانی که
      پاسخ‌های خصوصی یا با کاربرد ویژه خارج از محدوده بنچمارک RFC 2544
      تولید می‌کنند. برای دسترسی معمول Telegram از اینترنت عمومی، آن را خاموش بگذارید.
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
- کنترل دسترسی: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` سطح بالا (`type: "acp"`)
- پیش‌فرض‌های موضوع: `groups.<chatId>.topics."*"` برای موضوع‌های forum بدون تطابق اعمال می‌شود؛ شناسه‌های دقیق موضوع آن را بازنویسی می‌کنند
- تاییدیه‌های اجرا: `execApprovals`, `accounts.*.execApprovals`
- فرمان/منو: `commands.native`, `commands.nativeSkills`, `customCommands`
- رشته‌بندی/پاسخ‌ها: `replyToMode`
- استریمینگ: `streaming` (پیش‌نمایش), `streaming.preview.toolProgress`, `blockStreaming`
- قالب‌بندی/تحویل: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- رسانه/شبکه: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- ریشه سفارشی API: `apiRoot` (فقط ریشه Bot API؛ `/bot<TOKEN>` را شامل نکنید)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- کنش‌ها/قابلیت‌ها: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- واکنش‌ها: `reactionNotifications`, `reactionLevel`
- خطاها: `errorPolicy`, `errorCooldownMs`
- نوشتن‌ها/تاریخچه: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
اولویت چندحسابی: وقتی دو یا چند شناسه حساب پیکربندی شده‌اند، `channels.telegram.defaultAccount` را تنظیم کنید (یا `channels.telegram.accounts.default` را شامل کنید) تا مسیریابی پیش‌فرض صریح باشد. در غیر این صورت OpenClaw به نخستین شناسه حساب نرمال‌شده برمی‌گردد و `openclaw doctor` هشدار می‌دهد. حساب‌های نام‌گذاری‌شده `channels.telegram.allowFrom` / `groupAllowFrom` را به ارث می‌برند، اما مقدارهای `accounts.default.*` را نه.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Telegram را با Gateway جفت کنید.
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
    عیب‌یابی میان‌کانالی.
  </Card>
</CardGroup>

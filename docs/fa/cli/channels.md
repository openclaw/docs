---
read_when:
    - می‌خواهید حساب‌های کانال را اضافه/حذف کنید (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - می‌خواهید وضعیت کانال را بررسی کنید یا لاگ‌های کانال را به‌صورت زنده دنبال کنید.
summary: مرجع CLI برای `openclaw channels` (حساب‌ها، وضعیت، ورود/خروج، گزارش‌ها)
title: کانال‌ها
x-i18n:
    generated_at: "2026-05-11T20:28:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a964b4db9526defab6ee47b7a99c11086e345d42c8d20f5262fc134337947f
    source_path: cli/channels.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw channels`

حساب‌های کانال گفت‌وگو و وضعیت زمان‌اجرای آن‌ها را روی Gateway مدیریت کنید.

اسناد مرتبط:

- راهنماهای کانال: [کانال‌ها](/fa/channels)
- پیکربندی Gateway: [پیکربندی](/fa/gateway/configuration)

## فرمان‌های رایج

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` فقط کانال‌های گفت‌وگو را نشان می‌دهد: به‌طور پیش‌فرض حساب‌های پیکربندی‌شده، همراه با برچسب‌های وضعیت `installed`، `configured` و `enabled` برای هر حساب. برای نمایش کانال‌های همراهی که هنوز حساب پیکربندی‌شده ندارند و کانال‌های کاتالوگ قابل‌نصب که هنوز روی دیسک نیستند، `--all` را ارسال کنید. ارائه‌دهندگان احراز هویت (OAuth + کلیدهای API) و اسنپ‌شات‌های مصرف/سهمیهٔ ارائه‌دهندهٔ مدل دیگر اینجا چاپ نمی‌شوند؛ برای پروفایل‌های احراز هویت ارائه‌دهنده از `openclaw models auth list` و برای مصرف از `openclaw status` یا `openclaw models list` استفاده کنید.

## وضعیت / قابلیت‌ها / resolve / لاگ‌ها

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (فقط همراه با `--channel`)، `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` مسیر زنده است: روی Gateway قابل‌دسترسی، بررسی‌های
`probeAccount` برای هر حساب و بررسی‌های اختیاری `auditAccount` را اجرا می‌کند، بنابراین خروجی می‌تواند شامل وضعیت انتقال
به‌همراه نتایج کاوش مانند `works`، `probe failed`، `audit ok` یا `audit failed` باشد.
اگر Gateway دردسترس نباشد، `channels status` به‌جای خروجی کاوش زنده، به خلاصه‌های فقط‌پیکربندی
بازمی‌گردد.

از `openclaw sessions`، `sessions.list` در Gateway، یا ابزار
`sessions_list` عامل به‌عنوان سیگنال سلامت سوکت کانال استفاده نکنید. این سطوح
ردیف‌های گفت‌وگوی ذخیره‌شده را گزارش می‌کنند، نه وضعیت زمان‌اجرای ارائه‌دهنده. پس از راه‌اندازی مجدد ارائه‌دهندهٔ Discord،
یک حساب متصل اما ساکت ممکن است سالم باشد، درحالی‌که تا رویداد گفت‌وگوی ورودی یا خروجی بعدی هیچ ردیف نشست Discord
ظاهر نشود.

## افزودن / حذف حساب‌ها

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` پرچم‌های هر کانال را نشان می‌دهد (توکن، کلید خصوصی، توکن برنامه، مسیرهای signal-cli و غیره).
</Tip>

`channels remove` فقط روی Pluginهای کانال نصب‌شده/پیکربندی‌شده عمل می‌کند. برای کانال‌های کاتالوگ قابل‌نصب، ابتدا از `channels add` استفاده کنید.
برای Pluginهای کانال دارای پشتوانهٔ زمان‌اجرا، `channels remove` همچنین از Gateway در حال اجرا می‌خواهد حساب انتخاب‌شده را پیش از به‌روزرسانی پیکربندی متوقف کند، بنابراین غیرفعال‌کردن یا حذف یک حساب باعث نمی‌شود شنوندهٔ قدیمی تا زمان راه‌اندازی مجدد فعال بماند.

سطوح رایج افزودن غیرتعاملی شامل این مواردند:

- کانال‌های bot-token: `--token`، `--bot-token`، `--app-token`، `--token-file`
- فیلدهای انتقال Signal/iMessage: `--signal-number`، `--cli-path`، `--http-url`، `--http-host`، `--http-port`، `--db-path`، `--service`، `--region`
- فیلدهای Google Chat: `--webhook-path`، `--webhook-url`، `--audience-type`، `--audience`
- فیلدهای Matrix: `--homeserver`، `--user-id`، `--access-token`، `--password`، `--device-name`، `--initial-sync-limit`
- فیلدهای Nostr: `--private-key`، `--relay-urls`
- فیلدهای Tlon: `--ship`، `--url`، `--code`، `--group-channels`، `--dm-allowlist`، `--auto-discover-channels`
- `--use-env` برای احراز هویت حساب پیش‌فرض با پشتوانهٔ env در موارد پشتیبانی‌شده

اگر هنگام اجرای فرمان افزودن مبتنی بر پرچم لازم باشد یک Plugin کانال نصب شود، OpenClaw بدون بازکردن اعلان تعاملی نصب Plugin، از منبع نصب پیش‌فرض آن کانال استفاده می‌کند.

وقتی `openclaw channels add` را بدون پرچم اجرا می‌کنید، ویزارد تعاملی می‌تواند این موارد را درخواست کند:

- شناسه‌های حساب برای هر کانال انتخاب‌شده
- نام‌های نمایشی اختیاری برای آن حساب‌ها
- `Route these channel accounts to agents now?`

اگر اتصال را اکنون تأیید کنید، ویزارد می‌پرسد کدام عامل باید مالک هر حساب کانال پیکربندی‌شده باشد و bindingهای مسیریابی با دامنهٔ حساب را می‌نویسد.

همچنین می‌توانید همین قواعد مسیریابی را بعداً با `openclaw agents bindings`، `openclaw agents bind` و `openclaw agents unbind` مدیریت کنید (نگاه کنید به [agents](/fa/cli/agents)).

وقتی یک حساب غیرپیش‌فرض را به کانالی اضافه می‌کنید که هنوز از تنظیمات سطح‌بالای تک‌حسابی استفاده می‌کند، OpenClaw پیش از نوشتن حساب جدید، مقدارهای سطح‌بالای با دامنهٔ حساب را به نقشهٔ حساب آن کانال ارتقا می‌دهد. بیشتر کانال‌ها این مقدارها را در `channels.<channel>.accounts.default` قرار می‌دهند، اما کانال‌های همراه می‌توانند به‌جای آن یک حساب ارتقایافتهٔ مطابق و موجود را حفظ کنند. Matrix نمونهٔ فعلی است: اگر یک حساب نام‌دار از قبل وجود داشته باشد، یا `defaultAccount` به یک حساب نام‌دار موجود اشاره کند، ارتقا آن حساب را به‌جای ایجاد `accounts.default` جدید حفظ می‌کند.

رفتار مسیریابی سازگار می‌ماند:

- bindingهای موجود فقط‌کانال (بدون `accountId`) همچنان با حساب پیش‌فرض مطابقت دارند.
- `channels add` در حالت غیرتعاملی bindingها را به‌طور خودکار ایجاد یا بازنویسی نمی‌کند.
- راه‌اندازی تعاملی می‌تواند به‌صورت اختیاری bindingهای با دامنهٔ حساب اضافه کند.

اگر پیکربندی شما از قبل در وضعیت آمیخته بود (حساب‌های نام‌دار وجود دارند و مقدارهای سطح‌بالای تک‌حسابی هنوز تنظیم شده‌اند)، `openclaw doctor --fix` را اجرا کنید تا مقدارهای با دامنهٔ حساب به حساب ارتقایافتهٔ انتخاب‌شده برای آن کانال منتقل شوند. بیشتر کانال‌ها به `accounts.default` ارتقا می‌دهند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌دار/پیش‌فرض موجود را حفظ کند.

## ورود و خروج (تعاملی)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` از `--verbose` پشتیبانی می‌کند.
- `channels login` و `logout` وقتی فقط یک هدف ورود پشتیبانی‌شده پیکربندی شده باشد، می‌توانند کانال را استنتاج کنند.
- `channels logout` در صورت دردسترس‌بودن، مسیر زندهٔ Gateway را ترجیح می‌دهد، بنابراین خروج پیش از پاک‌کردن وضعیت احراز هویت کانال، هر شنوندهٔ فعال را متوقف می‌کند. اگر Gateway محلی دردسترس نباشد، به پاک‌سازی محلی احراز هویت بازمی‌گردد.
- `channels login` را از یک ترمینال روی میزبان gateway اجرا کنید. `exec` عامل این جریان ورود تعاملی را مسدود می‌کند؛ ابزارهای ورود بومی کانال برای عامل، مانند `whatsapp_login`، در صورت موجودبودن باید از گفت‌وگو استفاده شوند.

## عیب‌یابی

- برای کاوش گسترده، `openclaw status --deep` را اجرا کنید.
- برای رفع‌های هدایت‌شده از `openclaw doctor` استفاده کنید.
- `openclaw channels list` دیگر اسنپ‌شات‌های مصرف/سهمیهٔ ارائه‌دهندهٔ مدل را چاپ نمی‌کند. برای آن‌ها از `openclaw status` (نمای کلی) یا `openclaw models list` (برای هر ارائه‌دهنده) استفاده کنید.
- وقتی gateway دردسترس نباشد، `openclaw channels status` به خلاصه‌های فقط‌پیکربندی بازمی‌گردد. اگر اعتبارنامهٔ یک کانال پشتیبانی‌شده از طریق SecretRef پیکربندی شده اما در مسیر فرمان فعلی دردسترس نباشد، آن حساب را به‌عنوان پیکربندی‌شده همراه با یادداشت‌های کاهش‌یافته گزارش می‌کند، نه اینکه آن را پیکربندی‌نشده نشان دهد.

## کاوش قابلیت‌ها

راهنمایی‌های قابلیت ارائه‌دهنده (intents/scopes در صورت وجود) را به‌همراه پشتیبانی ایستای ویژگی دریافت کنید:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

نکات:

- `--channel` اختیاری است؛ برای فهرست‌کردن همهٔ کانال‌ها (از جمله افزونه‌ها) آن را حذف کنید.
- `--account` فقط همراه با `--channel` معتبر است.
- `--target` مقدار `channel:<id>` یا یک شناسهٔ عددی خام کانال را می‌پذیرد و فقط برای Discord اعمال می‌شود. برای کانال‌های صوتی Discord، بررسی مجوز، نبود `ViewChannel`، `Connect`، `Speak`، `SendMessages` و `ReadMessageHistory` را پرچم‌گذاری می‌کند.
- کاوش‌ها مختص ارائه‌دهنده هستند: intents در Discord + مجوزهای اختیاری کانال؛ دامنه‌های بات + کاربر در Slack؛ پرچم‌های بات Telegram + Webhook؛ نسخهٔ daemon در Signal؛ توکن برنامهٔ Microsoft Teams + نقش‌ها/دامنه‌های Graph (در موارد شناخته‌شده با توضیح). کانال‌های بدون کاوش، `Probe: unavailable` را گزارش می‌کنند.

## تبدیل نام‌ها به شناسه‌ها

نام‌های کانال/کاربر را با استفاده از فهرست ارائه‌دهنده به شناسه تبدیل کنید:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

نکات:

- برای اجبار نوع هدف از `--kind user|group|auto` استفاده کنید.
- وقتی چند ورودی نام یکسانی دارند، resolve مطابقت‌های فعال را ترجیح می‌دهد.
- `channels resolve` فقط‌خواندنی است. اگر حساب انتخاب‌شده از طریق SecretRef پیکربندی شده باشد اما آن اعتبارنامه در مسیر فرمان فعلی دردسترس نباشد، فرمان به‌جای متوقف‌کردن کل اجرا، نتایج resolveنشدهٔ کاهش‌یافته را همراه با یادداشت‌ها برمی‌گرداند.
- `channels resolve` Pluginهای کانال را نصب نمی‌کند. پیش از resolve نام‌ها برای یک کانال کاتالوگ قابل‌نصب، از `channels add --channel <name>` استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی کانال‌ها](/fa/channels)

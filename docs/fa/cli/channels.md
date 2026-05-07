---
read_when:
    - می‌خواهید حساب‌های کانال را اضافه/حذف کنید (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - می‌خواهید وضعیت کانال را بررسی کنید یا لاگ‌های کانال را به‌صورت زنده دنبال کنید
summary: مرجع CLI برای `openclaw channels` (حساب‌ها، وضعیت، ورود/خروج، لاگ‌ها)
title: کانال‌ها
x-i18n:
    generated_at: "2026-05-07T13:13:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

حساب‌های کانال گفتگو و وضعیت زمان اجرای آن‌ها را روی Gateway مدیریت کنید.

مستندات مرتبط:

- راهنماهای کانال: [کانال‌ها](/fa/channels)
- پیکربندی Gateway: [پیکربندی](/fa/gateway/configuration)

## دستورهای رایج

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

`channels list` فقط کانال‌های گفتگو را نشان می‌دهد: به‌طور پیش‌فرض حساب‌های پیکربندی‌شده، همراه با برچسب‌های وضعیت `installed`، `configured` و `enabled` برای هر حساب. `--all` را بدهید تا کانال‌های بسته‌بندی‌شده‌ای که هنوز هیچ حساب پیکربندی‌شده‌ای ندارند و کانال‌های کاتالوگ قابل نصبی که هنوز روی دیسک نیستند نیز نمایش داده شوند. ارائه‌دهندگان احراز هویت (OAuth + کلیدهای API) و نماهای لحظه‌ای مصرف/سهمیه ارائه‌دهنده مدل دیگر اینجا چاپ نمی‌شوند؛ برای پروفایل‌های احراز هویت ارائه‌دهنده از `openclaw models auth list` و برای مصرف از `openclaw status` یا `openclaw models list` استفاده کنید.

## وضعیت / قابلیت‌ها / حل نام / گزارش‌ها

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (فقط با `--channel`)، `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` مسیر زنده است: روی یک Gateway در دسترس، بررسی‌های `probeAccount` و در صورت نیاز `auditAccount` را برای هر حساب اجرا می‌کند، بنابراین خروجی می‌تواند وضعیت انتقال را همراه با نتایج بررسی‌هایی مانند `works`، `probe failed`، `audit ok` یا `audit failed` شامل شود. اگر Gateway در دسترس نباشد، `channels status` به‌جای خروجی بررسی زنده، به خلاصه‌های فقط مبتنی بر پیکربندی برمی‌گردد.

از `openclaw sessions`، ‏`sessions.list` مربوط به Gateway، یا ابزار `sessions_list` عامل به‌عنوان سیگنال سلامت سوکت کانال استفاده نکنید. این سطوح ردیف‌های ذخیره‌شده گفتگو را گزارش می‌کنند، نه وضعیت زمان اجرای ارائه‌دهنده. پس از راه‌اندازی دوباره ارائه‌دهنده Discord، یک حساب متصل اما کم‌فعالیت ممکن است سالم باشد، در حالی که تا رویداد گفتگوی ورودی یا خروجی بعدی هیچ ردیف نشست Discord ظاهر نشود.

## افزودن / حذف حساب‌ها

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` پرچم‌های مخصوص هر کانال را نشان می‌دهد (توکن، کلید خصوصی، توکن برنامه، مسیرهای signal-cli و غیره).
</Tip>

`channels remove` فقط روی Pluginهای کانال نصب‌شده/پیکربندی‌شده عمل می‌کند. برای کانال‌های کاتالوگ قابل نصب، ابتدا از `channels add` استفاده کنید.
برای Pluginهای کانال متکی به زمان اجرا، `channels remove` همچنین از Gateway در حال اجرا می‌خواهد حساب انتخاب‌شده را پیش از به‌روزرسانی پیکربندی متوقف کند، بنابراین غیرفعال یا حذف کردن یک حساب باعث نمی‌شود شنونده قدیمی تا راه‌اندازی دوباره فعال بماند.

سطوح افزودن غیرتعاملی رایج شامل این‌ها هستند:

- کانال‌های bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- فیلدهای انتقال Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- فیلدهای Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- فیلدهای Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- فیلدهای Nostr: `--private-key`, `--relay-urls`
- فیلدهای Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` برای احراز هویت پشتیبانی‌شده با env برای حساب پیش‌فرض، در مواردی که پشتیبانی می‌شود

اگر یک Plugin کانال لازم باشد هنگام اجرای دستور افزودن مبتنی بر پرچم نصب شود، OpenClaw از منبع نصب پیش‌فرض همان کانال استفاده می‌کند، بدون اینکه اعلان تعاملی نصب Plugin را باز کند.

وقتی `openclaw channels add` را بدون پرچم اجرا می‌کنید، راهنمای تعاملی می‌تواند این موارد را درخواست کند:

- شناسه‌های حساب برای هر کانال انتخاب‌شده
- نام‌های نمایشی اختیاری برای آن حساب‌ها
- `Bind configured channel accounts to agents now?`

اگر اتصال فوری را تأیید کنید، راهنما می‌پرسد کدام عامل باید مالک هر حساب کانال پیکربندی‌شده باشد و اتصال‌های مسیریابی در محدوده حساب را می‌نویسد.

همچنین می‌توانید همین قواعد مسیریابی را بعداً با `openclaw agents bindings`، ‏`openclaw agents bind` و `openclaw agents unbind` مدیریت کنید (به [عامل‌ها](/fa/cli/agents) مراجعه کنید).

وقتی یک حساب غیرپیش‌فرض را به کانالی اضافه می‌کنید که هنوز از تنظیمات سطح بالای تک‌حساب استفاده می‌کند، OpenClaw پیش از نوشتن حساب جدید، مقدارهای سطح بالای در محدوده حساب را به نگاشت حساب‌های کانال ارتقا می‌دهد. بیشتر کانال‌ها این مقدارها را در `channels.<channel>.accounts.default` قرار می‌دهند، اما کانال‌های بسته‌بندی‌شده می‌توانند به‌جای آن یک حساب ارتقایافته مطابق موجود را حفظ کنند. Matrix نمونه فعلی است: اگر یک حساب نام‌دار از قبل وجود داشته باشد، یا `defaultAccount` به یک حساب نام‌دار موجود اشاره کند، ارتقا به‌جای ایجاد `accounts.default` جدید، همان حساب را حفظ می‌کند.

رفتار مسیریابی سازگار می‌ماند:

- اتصال‌های موجود فقط-کانال (بدون `accountId`) همچنان با حساب پیش‌فرض مطابقت می‌کنند.
- `channels add` در حالت غیرتعاملی، اتصال‌ها را به‌صورت خودکار ایجاد یا بازنویسی نمی‌کند.
- راه‌اندازی تعاملی می‌تواند به‌صورت اختیاری اتصال‌های در محدوده حساب اضافه کند.

اگر پیکربندی شما از قبل در وضعیت ترکیبی بود (حساب‌های نام‌دار وجود داشتند و مقدارهای سطح بالای تک‌حساب همچنان تنظیم شده بودند)، `openclaw doctor --fix` را اجرا کنید تا مقدارهای در محدوده حساب به حساب ارتقایافته انتخاب‌شده برای آن کانال منتقل شوند. بیشتر کانال‌ها به `accounts.default` ارتقا می‌دهند؛ Matrix می‌تواند به‌جای آن یک مقصد نام‌دار/پیش‌فرض موجود را حفظ کند.

## ورود و خروج (تعاملی)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` از `--verbose` پشتیبانی می‌کند.
- `channels login` و `logout` وقتی فقط یک هدف ورود پشتیبانی‌شده پیکربندی شده باشد، می‌توانند کانال را استنباط کنند.
- `channels logout` وقتی مسیر زنده Gateway در دسترس باشد آن را ترجیح می‌دهد، بنابراین خروج پیش از پاک کردن وضعیت احراز هویت کانال، هر شنونده فعال را متوقف می‌کند. اگر Gateway محلی در دسترس نباشد، به پاک‌سازی احراز هویت محلی برمی‌گردد.
- `channels login` را از یک ترمینال روی میزبان Gateway اجرا کنید. `exec` عامل این جریان ورود تعاملی را مسدود می‌کند؛ ابزارهای ورود بومی کانال برای عامل، مانند `whatsapp_login`، در صورت وجود باید از گفتگو استفاده شوند.

## عیب‌یابی

- برای بررسی گسترده، `openclaw status --deep` را اجرا کنید.
- برای رفع مشکلات هدایت‌شده از `openclaw doctor` استفاده کنید.
- `openclaw channels list` دیگر نماهای لحظه‌ای مصرف/سهمیه ارائه‌دهنده مدل را چاپ نمی‌کند. برای آن‌ها از `openclaw status` (نمای کلی) یا `openclaw models list` (برای هر ارائه‌دهنده) استفاده کنید.
- وقتی Gateway در دسترس نباشد، `openclaw channels status` به خلاصه‌های فقط مبتنی بر پیکربندی برمی‌گردد. اگر یک اعتبارنامه کانال پشتیبانی‌شده از طریق SecretRef پیکربندی شده اما در مسیر دستور فعلی در دسترس نباشد، آن حساب را به‌جای نمایش به‌عنوان پیکربندی‌نشده، با یادداشت‌های تنزل‌یافته به‌عنوان پیکربندی‌شده گزارش می‌کند.

## بررسی قابلیت‌ها

نکته‌های قابلیت ارائه‌دهنده (intents/scopes در صورت وجود) را همراه با پشتیبانی ایستای ویژگی‌ها دریافت کنید:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

نکته‌ها:

- `--channel` اختیاری است؛ آن را حذف کنید تا همه کانال‌ها (از جمله افزونه‌ها) فهرست شوند.
- `--account` فقط با `--channel` معتبر است.
- `--target` مقدار `channel:<id>` یا یک شناسه عددی خام کانال را می‌پذیرد و فقط برای Discord اعمال می‌شود. برای کانال‌های صوتی Discord، بررسی مجوز نبودن `ViewChannel`، ‏`Connect`، ‏`Speak`، ‏`SendMessages` و `ReadMessageHistory` را علامت‌گذاری می‌کند.
- بررسی‌ها مخصوص ارائه‌دهنده‌اند: intents مربوط به Discord + مجوزهای اختیاری کانال؛ ربات Slack + scopeهای کاربر؛ پرچم‌های ربات Telegram + Webhook؛ نسخه daemon مربوط به Signal؛ توکن برنامه Microsoft Teams + نقش‌ها/scopeهای Graph (در موارد شناخته‌شده حاشیه‌نویسی شده). کانال‌هایی که بررسی ندارند `Probe: unavailable` گزارش می‌کنند.

## حل نام‌ها به شناسه‌ها

نام‌های کانال/کاربر را با استفاده از فهرست ارائه‌دهنده به شناسه‌ها حل کنید:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

نکته‌ها:

- برای اجبار نوع هدف از `--kind user|group|auto` استفاده کنید.
- وقتی چند ورودی نام یکسانی دارند، حل نام تطابق‌های فعال را ترجیح می‌دهد.
- `channels resolve` فقط‌خواندنی است. اگر یک حساب انتخاب‌شده از طریق SecretRef پیکربندی شده اما آن اعتبارنامه در مسیر دستور فعلی در دسترس نباشد، دستور به‌جای متوقف کردن کل اجرا، نتایج حل‌نشده تنزل‌یافته را همراه با یادداشت‌ها برمی‌گرداند.
- `channels resolve`، Pluginهای کانال را نصب نمی‌کند. پیش از حل نام‌ها برای یک کانال کاتالوگ قابل نصب، از `channels add --channel <name>` استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی کانال‌ها](/fa/channels)

---
read_when:
    - می‌خواهید حساب‌های کانال (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix) را اضافه/حذف کنید
    - می‌خواهید وضعیت کانال را بررسی کنید یا لاگ‌های کانال را به‌صورت زنده دنبال کنید
summary: مرجع CLI برای `openclaw channels` (accounts، status، login/logout، logs)
title: کانال‌ها
x-i18n:
    generated_at: "2026-05-10T19:30:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

حساب‌های کانال چت و وضعیت زمان اجرای آن‌ها را روی Gateway مدیریت کنید.

مستندات مرتبط:

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

`channels list` فقط کانال‌های چت را نشان می‌دهد: به‌صورت پیش‌فرض حساب‌های پیکربندی‌شده، همراه با برچسب‌های وضعیت `installed`، `configured` و `enabled` برای هر حساب. `--all` را بدهید تا کانال‌های همراهی که هنوز حساب پیکربندی‌شده ندارند و کانال‌های کاتالوگی قابل‌نصبی که هنوز روی دیسک نیستند نیز نمایش داده شوند. ارائه‌دهندگان احراز هویت (OAuth + کلیدهای API) و نماهای فوری مصرف/سهمیه ارائه‌دهنده مدل دیگر اینجا چاپ نمی‌شوند؛ برای نمایه‌های احراز هویت ارائه‌دهنده از `openclaw models auth list` و برای مصرف از `openclaw status` یا `openclaw models list` استفاده کنید.

## وضعیت / قابلیت‌ها / حل‌کردن / لاگ‌ها

- `channels status`: `--probe`، `--timeout <ms>`، `--json`
- `channels capabilities`: `--channel <name>`، `--account <id>` (فقط همراه با `--channel`)، `--target <dest>`، `--timeout <ms>`، `--json`
- `channels resolve`: `<entries...>`، `--channel <name>`، `--account <id>`، `--kind <auto|user|group>`، `--json`
- `channels logs`: `--channel <name|all>`، `--lines <n>`، `--json`

`channels status --probe` مسیر زنده است: روی Gateway قابل‌دسترسی، بررسی‌های
`probeAccount` برای هر حساب و بررسی‌های اختیاری `auditAccount` را اجرا می‌کند، بنابراین خروجی می‌تواند
وضعیت انتقال را همراه با نتایج probe مانند `works`، `probe failed`، `audit ok` یا `audit failed` شامل شود.
اگر Gateway در دسترس نباشد، `channels status` به‌جای خروجی probe زنده به خلاصه‌های فقط مبتنی بر پیکربندی
برمی‌گردد.

از `openclaw sessions`، `sessions.list` در Gateway یا ابزار
`sessions_list` عامل به‌عنوان سیگنال سلامت سوکت کانال استفاده نکنید. این سطوح
ردیف‌های مکالمه ذخیره‌شده را گزارش می‌کنند، نه وضعیت زمان اجرای ارائه‌دهنده. پس از راه‌اندازی دوباره ارائه‌دهنده Discord،
ممکن است یک حساب متصل اما ساکت سالم باشد، در حالی که تا رویداد مکالمه ورودی یا خروجی بعدی
هیچ ردیف نشست Discord ظاهر نشود.

## افزودن / حذف حساب‌ها

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` پرچم‌های مخصوص هر کانال را نشان می‌دهد (توکن، کلید خصوصی، توکن برنامه، مسیرهای signal-cli و غیره).
</Tip>

`channels remove` فقط روی Pluginهای کانال نصب‌شده/پیکربندی‌شده عمل می‌کند. برای کانال‌های کاتالوگی قابل‌نصب ابتدا از `channels add` استفاده کنید.
برای Pluginهای کانالی که پشتوانه زمان اجرا دارند، `channels remove` همچنین از Gateway در حال اجرا می‌خواهد پیش از به‌روزرسانی پیکربندی، حساب انتخاب‌شده را متوقف کند؛ بنابراین غیرفعال‌سازی یا حذف یک حساب باعث نمی‌شود شنونده قدیمی تا راه‌اندازی دوباره فعال بماند.

سطوح رایج افزودن غیرتعاملی شامل این موارد هستند:

- کانال‌های bot-token: `--token`، `--bot-token`، `--app-token`، `--token-file`
- فیلدهای انتقال Signal/iMessage: `--signal-number`، `--cli-path`، `--http-url`، `--http-host`، `--http-port`، `--db-path`، `--service`، `--region`
- فیلدهای Google Chat: `--webhook-path`، `--webhook-url`، `--audience-type`، `--audience`
- فیلدهای Matrix: `--homeserver`، `--user-id`، `--access-token`، `--password`، `--device-name`، `--initial-sync-limit`
- فیلدهای Nostr: `--private-key`، `--relay-urls`
- فیلدهای Tlon: `--ship`، `--url`، `--code`، `--group-channels`، `--dm-allowlist`، `--auto-discover-channels`
- `--use-env` برای احراز هویت پیش‌فرض حساب با پشتوانه env در مواردی که پشتیبانی می‌شود

اگر لازم باشد یک Plugin کانال هنگام اجرای فرمان افزودن مبتنی بر پرچم نصب شود، OpenClaw بدون بازکردن اعلان تعاملی نصب Plugin، از منبع نصب پیش‌فرض کانال استفاده می‌کند.

وقتی `openclaw channels add` را بدون پرچم اجرا می‌کنید، راهنمای تعاملی می‌تواند این موارد را درخواست کند:

- شناسه‌های حساب برای هر کانال انتخاب‌شده
- نام‌های نمایشی اختیاری برای آن حساب‌ها
- `Route these channel accounts to agents now?`

اگر اتصال همین حالا را تأیید کنید، راهنما می‌پرسد کدام عامل باید مالک هر حساب کانال پیکربندی‌شده باشد و bindingهای مسیریابی محدود به حساب را می‌نویسد.

همچنین می‌توانید همین قواعد مسیریابی را بعداً با `openclaw agents bindings`، `openclaw agents bind` و `openclaw agents unbind` مدیریت کنید (ببینید [agents](/fa/cli/agents)).

وقتی یک حساب غیرپیش‌فرض را به کانالی اضافه می‌کنید که هنوز از تنظیمات سطح بالای تک‌حسابی استفاده می‌کند، OpenClaw مقدارهای سطح بالای محدود به حساب را پیش از نوشتن حساب جدید، به نگاشت حساب‌های کانال ارتقا می‌دهد. بیشتر کانال‌ها این مقدارها را در `channels.<channel>.accounts.default` قرار می‌دهند، اما کانال‌های همراه می‌توانند به‌جای آن یک حساب ارتقایافته موجود و منطبق را حفظ کنند. Matrix نمونه فعلی است: اگر یک حساب نام‌دار از قبل وجود داشته باشد، یا `defaultAccount` به یک حساب نام‌دار موجود اشاره کند، ارتقا به‌جای ایجاد `accounts.default` جدید، همان حساب را حفظ می‌کند.

رفتار مسیریابی سازگار می‌ماند:

- bindingهای موجود فقط مخصوص کانال (بدون `accountId`) همچنان با حساب پیش‌فرض تطبیق داده می‌شوند.
- `channels add` در حالت غیرتعاملی bindingها را به‌صورت خودکار ایجاد یا بازنویسی نمی‌کند.
- راه‌اندازی تعاملی می‌تواند به‌صورت اختیاری bindingهای محدود به حساب اضافه کند.

اگر پیکربندی شما از قبل در وضعیت آمیخته بود (حساب‌های نام‌دار وجود دارند و مقدارهای تک‌حسابی سطح بالا همچنان تنظیم شده‌اند)، `openclaw doctor --fix` را اجرا کنید تا مقدارهای محدود به حساب به حساب ارتقایافته‌ای که برای آن کانال انتخاب شده منتقل شوند. بیشتر کانال‌ها به `accounts.default` ارتقا می‌دهند؛ Matrix می‌تواند به‌جای آن یک مقصد نام‌دار/پیش‌فرض موجود را حفظ کند.

## ورود و خروج (تعاملی)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` از `--verbose` پشتیبانی می‌کند.
- `channels login` و `logout` وقتی فقط یک هدف ورود پشتیبانی‌شده پیکربندی شده باشد، می‌توانند کانال را استنباط کنند.
- `channels logout` وقتی قابل‌دسترسی باشد مسیر زنده Gateway را ترجیح می‌دهد، بنابراین خروج پیش از پاک‌کردن وضعیت احراز هویت کانال، هر شنونده فعال را متوقف می‌کند. اگر Gateway محلی قابل‌دسترسی نباشد، به پاک‌سازی احراز هویت محلی برمی‌گردد.
- `channels login` را از یک ترمینال روی میزبان Gateway اجرا کنید. `exec` عامل این جریان ورود تعاملی را مسدود می‌کند؛ ابزارهای ورود بومی کانال برای عامل، مانند `whatsapp_login`، در صورت وجود باید از چت استفاده شوند.

## عیب‌یابی

- برای یک probe گسترده `openclaw status --deep` را اجرا کنید.
- برای اصلاح‌های راهنمایی‌شده از `openclaw doctor` استفاده کنید.
- `openclaw channels list` دیگر نماهای فوری مصرف/سهمیه ارائه‌دهنده مدل را چاپ نمی‌کند. برای آن‌ها از `openclaw status` (نمای کلی) یا `openclaw models list` (برای هر ارائه‌دهنده) استفاده کنید.
- وقتی Gateway در دسترس نباشد، `openclaw channels status` به خلاصه‌های فقط مبتنی بر پیکربندی برمی‌گردد. اگر اعتبارنامه یک کانال پشتیبانی‌شده از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، آن حساب را به‌جای نمایش به‌عنوان پیکربندی‌نشده، به‌عنوان پیکربندی‌شده همراه با یادداشت‌های کاهش‌یافته گزارش می‌کند.

## Probe قابلیت‌ها

راهنماهای قابلیت ارائه‌دهنده (intentها/scopeها در صورت وجود) را همراه با پشتیبانی ویژگی ثابت دریافت کنید:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

نکته‌ها:

- `--channel` اختیاری است؛ برای فهرست‌کردن همه کانال‌ها (از جمله افزونه‌ها) آن را حذف کنید.
- `--account` فقط همراه با `--channel` معتبر است.
- `--target` مقدار `channel:<id>` یا یک شناسه عددی خام کانال را می‌پذیرد و فقط برای Discord اعمال می‌شود. برای کانال‌های صوتی Discord، بررسی مجوز نبودن `ViewChannel`، `Connect`، `Speak`، `SendMessages` و `ReadMessageHistory` را علامت‌گذاری می‌کند.
- Probeها مخصوص ارائه‌دهنده‌اند: intentهای Discord + مجوزهای اختیاری کانال؛ scopeهای ربات + کاربر Slack؛ پرچم‌های ربات Telegram + Webhook؛ نسخه daemon در Signal؛ توکن برنامه Microsoft Teams + نقش‌ها/scopeهای Graph (در موارد شناخته‌شده حاشیه‌نویسی می‌شود). کانال‌های بدون probe مقدار `Probe: unavailable` را گزارش می‌کنند.

## حل نام‌ها به شناسه‌ها

نام‌های کانال/کاربر را با استفاده از دایرکتوری ارائه‌دهنده به شناسه تبدیل کنید:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

نکته‌ها:

- برای اجباری‌کردن نوع هدف از `--kind user|group|auto` استفاده کنید.
- وقتی چند ورودی نام یکسانی دارند، حل‌کردن، تطبیق‌های فعال را ترجیح می‌دهد.
- `channels resolve` فقط خواندنی است. اگر یک حساب انتخاب‌شده از طریق SecretRef پیکربندی شده باشد اما آن اعتبارنامه در مسیر فرمان فعلی در دسترس نباشد، فرمان به‌جای متوقف‌کردن کل اجرا، نتایج حل‌نشده کاهش‌یافته را همراه با یادداشت‌ها برمی‌گرداند.
- `channels resolve` Pluginهای کانال را نصب نمی‌کند. پیش از حل نام‌ها برای یک کانال کاتالوگی قابل‌نصب، از `channels add --channel <name>` استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی کانال‌ها](/fa/channels)

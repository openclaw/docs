---
read_when:
    - می‌خواهید حساب‌های کانال را اضافه/حذف کنید (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - می‌خواهید وضعیت کانال را بررسی کنید یا گزارش‌های کانال را دنبال کنید
summary: مرجع CLI برای `openclaw channels` (حساب‌ها، وضعیت، ورود/خروج، گزارش‌ها)
title: کانال‌ها
x-i18n:
    generated_at: "2026-04-29T22:33:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
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
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## وضعیت / قابلیت‌ها / حل نام‌ها / لاگ‌ها

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (فقط همراه با `--channel`)، `--target <dest>`، `--timeout <ms>`، `--json`
- `channels resolve`: `<entries...>`، `--channel <name>`، `--account <id>`، `--kind <auto|user|group>`، `--json`
- `channels logs`: `--channel <name|all>`، `--lines <n>`، `--json`

`channels status --probe` مسیر زنده است: روی یک Gateway در دسترس، برای هر حساب
بررسی‌های `probeAccount` و در صورت وجود `auditAccount` را اجرا می‌کند، بنابراین خروجی می‌تواند شامل
وضعیت انتقال به‌همراه نتایج بررسی مانند `works`، `probe failed`، `audit ok`، یا `audit failed` باشد.
اگر Gateway در دسترس نباشد، `channels status` به‌جای خروجی بررسی زنده، به خلاصه‌های فقط مبتنی بر پیکربندی
بازمی‌گردد.

## افزودن / حذف حساب‌ها

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` پرچم‌های مخصوص هر کانال را نشان می‌دهد (توکن، کلید خصوصی، توکن برنامه، مسیرهای signal-cli و غیره).
</Tip>

سطح‌های افزودن غیرتعاملی رایج شامل این‌ها هستند:

- کانال‌های bot-token: `--token`، `--bot-token`، `--app-token`، `--token-file`
- فیلدهای انتقال Signal/iMessage: `--signal-number`، `--cli-path`، `--http-url`، `--http-host`، `--http-port`، `--db-path`، `--service`، `--region`
- فیلدهای Google Chat: `--webhook-path`، `--webhook-url`، `--audience-type`، `--audience`
- فیلدهای Matrix: `--homeserver`، `--user-id`، `--access-token`، `--password`، `--device-name`، `--initial-sync-limit`
- فیلدهای Nostr: `--private-key`، `--relay-urls`
- فیلدهای Tlon: `--ship`، `--url`، `--code`، `--group-channels`، `--dm-allowlist`، `--auto-discover-channels`
- `--use-env` برای احراز هویت حساب پیش‌فرض با پشتیبانی env در موارد پشتیبانی‌شده

اگر در طول یک دستور افزودن مبتنی بر پرچم لازم باشد Plugin یک کانال نصب شود، OpenClaw بدون باز کردن اعلان نصب تعاملی Plugin، از منبع نصب پیش‌فرض همان کانال استفاده می‌کند.

وقتی `openclaw channels add` را بدون پرچم اجرا می‌کنید، جادوگر تعاملی می‌تواند این موارد را درخواست کند:

- شناسه‌های حساب برای هر کانال انتخاب‌شده
- نام‌های نمایشی اختیاری برای آن حساب‌ها
- `Bind configured channel accounts to agents now?`

اگر اتصال در همان لحظه را تأیید کنید، جادوگر می‌پرسد کدام عامل باید مالک هر حساب کانال پیکربندی‌شده باشد و اتصال‌های مسیریابی محدود به حساب را می‌نویسد.

بعداً نیز می‌توانید همین قوانین مسیریابی را با `openclaw agents bindings`، `openclaw agents bind`، و `openclaw agents unbind` مدیریت کنید (به [عامل‌ها](/fa/cli/agents) مراجعه کنید).

وقتی یک حساب غیرپیش‌فرض را به کانالی اضافه می‌کنید که هنوز از تنظیمات سطح بالای تک‌حسابی استفاده می‌کند، OpenClaw پیش از نوشتن حساب جدید، مقدارهای سطح بالای محدود به حساب را به نقشه حساب‌های کانال منتقل می‌کند. بیشتر کانال‌ها این مقدارها را در `channels.<channel>.accounts.default` قرار می‌دهند، اما کانال‌های همراه می‌توانند در عوض یک حساب ارتقایافته مطابق موجود را حفظ کنند. Matrix نمونه فعلی است: اگر یک حساب نام‌دار از قبل وجود داشته باشد، یا `defaultAccount` به یک حساب نام‌دار موجود اشاره کند، ارتقا به‌جای ساختن `accounts.default` جدید، همان حساب را حفظ می‌کند.

رفتار مسیریابی سازگار می‌ماند:

- اتصال‌های موجود فقط بر اساس کانال (بدون `accountId`) همچنان با حساب پیش‌فرض تطبیق داده می‌شوند.
- `channels add` در حالت غیرتعاملی، اتصال‌ها را به‌صورت خودکار ایجاد یا بازنویسی نمی‌کند.
- راه‌اندازی تعاملی می‌تواند به‌صورت اختیاری اتصال‌های محدود به حساب اضافه کند.

اگر پیکربندی شما از قبل در وضعیت ترکیبی بوده است (حساب‌های نام‌دار وجود دارند و مقدارهای تک‌حسابی سطح بالا هنوز تنظیم شده‌اند)، `openclaw doctor --fix` را اجرا کنید تا مقدارهای محدود به حساب به حساب ارتقایافته انتخاب‌شده برای آن کانال منتقل شوند. بیشتر کانال‌ها به `accounts.default` ارتقا می‌دهند؛ Matrix می‌تواند در عوض یک مقصد نام‌دار/پیش‌فرض موجود را حفظ کند.

## ورود و خروج (تعاملی)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` از `--verbose` پشتیبانی می‌کند.
- وقتی فقط یک مقصد ورود پشتیبانی‌شده پیکربندی شده باشد، `channels login` و `logout` می‌توانند کانال را استنباط کنند.
- `channels login` را از یک ترمینال روی میزبان Gateway اجرا کنید. `exec` عامل این جریان ورود تعاملی را مسدود می‌کند؛ ابزارهای ورود بومی کانال برای عامل، مانند `whatsapp_login`، در صورت وجود باید از گفتگو استفاده شوند.

## عیب‌یابی

- برای یک بررسی گسترده، `openclaw status --deep` را اجرا کنید.
- برای رفع مشکلات راهنمایی‌شده، از `openclaw doctor` استفاده کنید.
- `openclaw channels list` مقدار `Claude: HTTP 403 ... user:profile` را چاپ می‌کند → اسنپ‌شات استفاده به scope با نام `user:profile` نیاز دارد. از `--no-usage` استفاده کنید، یا یک کلید نشست claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) ارائه دهید، یا از طریق Claude CLI دوباره احراز هویت کنید.
- وقتی Gateway در دسترس نباشد، `openclaw channels status` به خلاصه‌های فقط مبتنی بر پیکربندی بازمی‌گردد. اگر اعتبارنامه یک کانال پشتیبانی‌شده از طریق SecretRef پیکربندی شده باشد اما در مسیر دستور فعلی در دسترس نباشد، آن حساب را به‌جای نمایش به‌عنوان پیکربندی‌نشده، به‌صورت پیکربندی‌شده همراه با یادداشت‌های تنزل‌یافته گزارش می‌کند.

## بررسی قابلیت‌ها

راهنماهای قابلیت ارائه‌دهنده (intents/scopes در صورت وجود) را به‌همراه پشتیبانی ویژگی‌های ایستا دریافت کنید:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

نکته‌ها:

- `--channel` اختیاری است؛ برای فهرست کردن همه کانال‌ها (از جمله extensions) آن را حذف کنید.
- `--account` فقط همراه با `--channel` معتبر است.
- `--target` مقدار `channel:<id>` یا یک شناسه کانال عددی خام را می‌پذیرد و فقط برای Discord اعمال می‌شود.
- بررسی‌ها مخصوص ارائه‌دهنده هستند: intents در Discord به‌همراه مجوزهای اختیاری کانال؛ scopeهای ربات و کاربر در Slack؛ پرچم‌های ربات و Webhook در Telegram؛ نسخه daemon در Signal؛ توکن برنامه Microsoft Teams به‌همراه نقش‌ها/scopeهای Graph (در موارد شناخته‌شده با توضیح). کانال‌های بدون بررسی، `Probe: unavailable` گزارش می‌کنند.

## تبدیل نام‌ها به شناسه‌ها

نام کانال/کاربر را با استفاده از فهرست ارائه‌دهنده به شناسه تبدیل کنید:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

نکته‌ها:

- از `--kind user|group|auto` برای اجبار نوع مقصد استفاده کنید.
- وقتی چند ورودی نام یکسانی دارند، حل نام، تطبیق‌های فعال را ترجیح می‌دهد.
- `channels resolve` فقط خواندنی است. اگر یک حساب انتخاب‌شده از طریق SecretRef پیکربندی شده باشد اما آن اعتبارنامه در مسیر دستور فعلی در دسترس نباشد، دستور به‌جای متوقف کردن کل اجرا، نتایج حل‌نشده تنزل‌یافته را همراه با یادداشت‌ها برمی‌گرداند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی کانال‌ها](/fa/channels)

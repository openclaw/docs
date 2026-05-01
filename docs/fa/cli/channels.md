---
read_when:
    - می‌خواهید حساب‌های کانال را اضافه/حذف کنید (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - می‌خواهید وضعیت کانال را بررسی کنید یا لاگ‌های کانال را دنبال کنید
summary: مرجع CLI برای `openclaw channels` (حساب‌ها، وضعیت، ورود/خروج، لاگ‌ها)
title: کانال‌ها
x-i18n:
    generated_at: "2026-05-01T11:42:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f673a626b46cd4c8ba7eb28963d27e7e3f630dd86723332faab9b4c86553da9
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

حساب‌های کانال گفت‌وگو و وضعیت زمان اجرای آن‌ها را روی Gateway مدیریت کنید.

مستندات مرتبط:

- راهنماهای کانال: [کانال‌ها](/fa/channels)
- پیکربندی Gateway: [پیکربندی](/fa/gateway/configuration)

## فرمان‌های رایج

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## وضعیت / قابلیت‌ها / resolve / گزارش‌ها

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (فقط همراه با `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` مسیر زنده است: روی یک Gateway دردسترس، بررسی‌های `probeAccount` برای هر حساب و بررسی‌های اختیاری `auditAccount` را اجرا می‌کند؛ بنابراین خروجی می‌تواند شامل وضعیت انتقال به‌همراه نتایج بررسی مانند `works`، `probe failed`، `audit ok` یا `audit failed` باشد. اگر Gateway دردسترس نباشد، `channels status` به‌جای خروجی بررسی زنده، به خلاصه‌های فقط‌پیکربندی برمی‌گردد.

## افزودن / حذف حساب‌ها

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` پرچم‌های مخصوص هر کانال را نشان می‌دهد (توکن، کلید خصوصی، توکن برنامه، مسیرهای signal-cli و غیره).
</Tip>

`channels remove` فقط روی Pluginهای کانال نصب‌شده/پیکربندی‌شده عمل می‌کند. برای کانال‌های کاتالوگ قابل‌نصب، ابتدا از `channels add` استفاده کنید.

سطح‌های رایج افزودن غیرتعاملی شامل این‌ها هستند:

- کانال‌های bot-token: `--token`، `--bot-token`، `--app-token`، `--token-file`
- فیلدهای انتقال Signal/iMessage: `--signal-number`، `--cli-path`، `--http-url`، `--http-host`، `--http-port`، `--db-path`، `--service`، `--region`
- فیلدهای Google Chat: `--webhook-path`، `--webhook-url`، `--audience-type`، `--audience`
- فیلدهای Matrix: `--homeserver`، `--user-id`، `--access-token`، `--password`، `--device-name`، `--initial-sync-limit`
- فیلدهای Nostr: `--private-key`، `--relay-urls`
- فیلدهای Tlon: `--ship`، `--url`، `--code`، `--group-channels`، `--dm-allowlist`، `--auto-discover-channels`
- `--use-env` برای احراز هویت حساب پیش‌فرض مبتنی بر env در جاهایی که پشتیبانی می‌شود

اگر لازم باشد یک Plugin کانال هنگام اجرای فرمان افزودن مبتنی بر پرچم نصب شود، OpenClaw از منبع نصب پیش‌فرض کانال استفاده می‌کند و اعلان تعاملی نصب Plugin را باز نمی‌کند.

وقتی `openclaw channels add` را بدون پرچم اجرا می‌کنید، راه‌انداز تعاملی می‌تواند این موارد را درخواست کند:

- شناسه‌های حساب برای هر کانال انتخاب‌شده
- نام‌های نمایشی اختیاری برای آن حساب‌ها
- `Bind configured channel accounts to agents now?`

اگر اتصال فوری را تأیید کنید، راه‌انداز می‌پرسد کدام عامل باید مالک هر حساب کانال پیکربندی‌شده باشد و اتصال‌های مسیریابی در محدوده حساب را می‌نویسد.

همچنین می‌توانید همین قواعد مسیریابی را بعداً با `openclaw agents bindings`، `openclaw agents bind` و `openclaw agents unbind` مدیریت کنید (ببینید [عامل‌ها](/fa/cli/agents)).

وقتی یک حساب غیرپیش‌فرض را به کانالی اضافه می‌کنید که هنوز از تنظیمات سطح‌بالای تک‌حسابی استفاده می‌کند، OpenClaw پیش از نوشتن حساب جدید، مقادیر سطح‌بالای در محدوده حساب را به نقشه حساب‌های کانال ارتقا می‌دهد. بیشتر کانال‌ها این مقادیر را در `channels.<channel>.accounts.default` قرار می‌دهند، اما کانال‌های همراه می‌توانند به‌جای آن یک حساب ارتقایافته منطبق موجود را حفظ کنند. Matrix نمونه فعلی است: اگر از قبل یک حساب نام‌دار وجود داشته باشد، یا `defaultAccount` به یک حساب نام‌دار موجود اشاره کند، ارتقا به‌جای ایجاد یک `accounts.default` جدید، همان حساب را حفظ می‌کند.

رفتار مسیریابی یکسان می‌ماند:

- اتصال‌های موجود فقط‌کانال (بدون `accountId`) همچنان با حساب پیش‌فرض تطبیق می‌یابند.
- `channels add` در حالت غیرتعاملی اتصال‌ها را خودکار ایجاد یا بازنویسی نمی‌کند.
- راه‌اندازی تعاملی می‌تواند به‌صورت اختیاری اتصال‌های در محدوده حساب اضافه کند.

اگر پیکربندی شما از قبل در وضعیت ترکیبی بود (حساب‌های نام‌دار وجود داشتند و مقادیر سطح‌بالای تک‌حسابی هنوز تنظیم بودند)، `openclaw doctor --fix` را اجرا کنید تا مقادیر در محدوده حساب به حساب ارتقایافته انتخاب‌شده برای آن کانال منتقل شوند. بیشتر کانال‌ها به `accounts.default` ارتقا می‌دهند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌دار/پیش‌فرض موجود را حفظ کند.

## ورود و خروج (تعاملی)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` از `--verbose` پشتیبانی می‌کند.
- وقتی فقط یک هدف ورود پشتیبانی‌شده پیکربندی شده باشد، `channels login` و `logout` می‌توانند کانال را استنباط کنند.
- `channels login` را از یک پایانه روی میزبان Gateway اجرا کنید. `exec` عامل این جریان ورود تعاملی را مسدود می‌کند؛ ابزارهای ورود بومی کانال برای عامل، مانند `whatsapp_login`، در صورت دردسترس بودن باید از گفت‌وگو استفاده شوند.

## عیب‌یابی

- برای یک بررسی گسترده، `openclaw status --deep` را اجرا کنید.
- برای اصلاح‌های راهنمایی‌شده از `openclaw doctor` استفاده کنید.
- `openclaw channels list` مقدار `Claude: HTTP 403 ... user:profile` را چاپ می‌کند ← نماگرفت مصرف به محدوده `user:profile` نیاز دارد. از `--no-usage` استفاده کنید، یا یک کلید نشست claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) ارائه دهید، یا از طریق Claude CLI دوباره احراز هویت کنید.
- وقتی Gateway دردسترس نباشد، `openclaw channels status` به خلاصه‌های فقط‌پیکربندی برمی‌گردد. اگر اعتبارنامه یک کانال پشتیبانی‌شده از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی دردسترس نباشد، آن حساب را به‌عنوان پیکربندی‌شده با یادداشت‌های تنزل‌یافته گزارش می‌کند، نه به‌عنوان پیکربندی‌نشده.

## بررسی قابلیت‌ها

نکته‌های قابلیت ارائه‌دهنده (intentها/محدوده‌ها در صورت وجود) به‌همراه پشتیبانی ایستای ویژگی‌ها را دریافت کنید:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

یادداشت‌ها:

- `--channel` اختیاری است؛ آن را حذف کنید تا همه کانال‌ها (از جمله extensions) فهرست شوند.
- `--account` فقط همراه با `--channel` معتبر است.
- `--target` مقدار `channel:<id>` یا یک شناسه عددی خام کانال را می‌پذیرد و فقط برای Discord اعمال می‌شود.
- بررسی‌ها مخصوص ارائه‌دهنده هستند: intentهای Discord + مجوزهای اختیاری کانال؛ محدوده‌های ربات + کاربر Slack؛ پرچم‌های ربات Telegram + Webhook؛ نسخه daemon برای Signal؛ توکن برنامه Microsoft Teams + نقش‌ها/محدوده‌های Graph (در جاهایی که شناخته شده، حاشیه‌نویسی شده است). کانال‌های بدون بررسی، `Probe: unavailable` را گزارش می‌کنند.

## تبدیل نام‌ها به شناسه‌ها

نام‌های کانال/کاربر را با استفاده از فهرست ارائه‌دهنده به شناسه تبدیل کنید:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

یادداشت‌ها:

- برای اجبار نوع هدف، از `--kind user|group|auto` استفاده کنید.
- وقتی چند ورودی نام یکسانی دارند، resolve تطبیق‌های فعال را ترجیح می‌دهد.
- `channels resolve` فقط‌خواندنی است. اگر یک حساب انتخاب‌شده از طریق SecretRef پیکربندی شده باشد اما آن اعتبارنامه در مسیر فرمان فعلی دردسترس نباشد، فرمان به‌جای متوقف کردن کل اجرا، نتایج resolveنشده تنزل‌یافته را همراه با یادداشت‌ها برمی‌گرداند.
- `channels resolve`، Pluginهای کانال را نصب نمی‌کند. پیش از resolve کردن نام‌ها برای یک کانال کاتالوگ قابل‌نصب، از `channels add --channel <name>` استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی کانال‌ها](/fa/channels)

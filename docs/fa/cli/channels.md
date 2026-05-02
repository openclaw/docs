---
read_when:
    - می‌خواهید حساب‌های کانال را اضافه/حذف کنید (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - می‌خواهید وضعیت کانال را بررسی کنید یا لاگ‌های کانال را دنبال کنید
summary: مرجع CLI برای `openclaw channels` (حساب‌ها، وضعیت، ورود/خروج، گزارش‌ها)
title: کانال‌ها
x-i18n:
    generated_at: "2026-05-02T11:37:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
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
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## وضعیت / قابلیت‌ها / resolve / لاگ‌ها

- `channels status`: `--probe`، `--timeout <ms>`، `--json`
- `channels capabilities`: `--channel <name>`، `--account <id>` (فقط با `--channel`)، `--target <dest>`، `--timeout <ms>`، `--json`
- `channels resolve`: `<entries...>`، `--channel <name>`، `--account <id>`، `--kind <auto|user|group>`، `--json`
- `channels logs`: `--channel <name|all>`، `--lines <n>`، `--json`

`channels status --probe` مسیر زنده است: روی Gateway قابل دسترس، برای هر حساب بررسی‌های
`probeAccount` و در صورت امکان `auditAccount` را اجرا می‌کند، بنابراین خروجی می‌تواند شامل وضعیت
انتقال به‌همراه نتایج بررسی مانند `works`، `probe failed`، `audit ok`، یا `audit failed` باشد.
اگر Gateway قابل دسترس نباشد، `channels status` به‌جای خروجی بررسی زنده، به خلاصه‌های فقط مبتنی بر پیکربندی
بازمی‌گردد.

از `openclaw sessions`، `sessions.list` مربوط به Gateway، یا ابزار
`sessions_list` عامل به‌عنوان سیگنال سلامت سوکت کانال استفاده نکنید. این سطوح،
ردیف‌های ذخیره‌شده مکالمه را گزارش می‌کنند، نه وضعیت زمان اجرای ارائه‌دهنده. پس از راه‌اندازی دوباره ارائه‌دهنده Discord،
ممکن است یک حساب متصل اما بی‌صدا سالم باشد، درحالی‌که تا رویداد بعدی مکالمه ورودی یا خروجی هیچ ردیف جلسه Discord
ظاهر نشود.

## افزودن / حذف حساب‌ها

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` پرچم‌های مخصوص هر کانال را نشان می‌دهد (توکن، کلید خصوصی، توکن برنامه، مسیرهای signal-cli و غیره).
</Tip>

`channels remove` فقط روی Pluginهای کانال نصب‌شده/پیکربندی‌شده عمل می‌کند. برای کانال‌های کاتالوگ قابل نصب ابتدا از `channels add` استفاده کنید.
برای Pluginهای کانال دارای پشتوانه زمان اجرا، `channels remove` همچنین از Gateway در حال اجرا می‌خواهد حساب انتخاب‌شده را پیش از به‌روزرسانی پیکربندی متوقف کند، بنابراین غیرفعال‌سازی یا حذف یک حساب باعث نمی‌شود شنونده قدیمی تا راه‌اندازی دوباره فعال بماند.

سطوح رایج افزودن غیرتعاملی شامل این‌ها هستند:

- کانال‌های bot-token: `--token`، `--bot-token`، `--app-token`، `--token-file`
- فیلدهای انتقال Signal/iMessage: `--signal-number`، `--cli-path`، `--http-url`، `--http-host`، `--http-port`، `--db-path`، `--service`، `--region`
- فیلدهای Google Chat: `--webhook-path`، `--webhook-url`، `--audience-type`، `--audience`
- فیلدهای Matrix: `--homeserver`، `--user-id`، `--access-token`، `--password`، `--device-name`، `--initial-sync-limit`
- فیلدهای Nostr: `--private-key`، `--relay-urls`
- فیلدهای Tlon: `--ship`، `--url`، `--code`، `--group-channels`، `--dm-allowlist`، `--auto-discover-channels`
- `--use-env` برای احراز هویت مبتنی بر env برای حساب پیش‌فرض، در مواردی که پشتیبانی می‌شود

اگر لازم باشد یک Plugin کانال هنگام اجرای فرمان افزودن مبتنی بر پرچم نصب شود، OpenClaw از منبع نصب پیش‌فرض آن کانال استفاده می‌کند و اعلان تعاملی نصب Plugin را باز نمی‌کند.

وقتی `openclaw channels add` را بدون پرچم اجرا می‌کنید، راه‌انداز تعاملی می‌تواند این موارد را درخواست کند:

- شناسه‌های حساب برای هر کانال انتخاب‌شده
- نام‌های نمایشی اختیاری برای آن حساب‌ها
- `Bind configured channel accounts to agents now?`

اگر اتصال فوری را تأیید کنید، راه‌انداز می‌پرسد کدام عامل باید مالک هر حساب کانال پیکربندی‌شده باشد و اتصال‌های مسیریابی محدود به حساب را می‌نویسد.

همچنین می‌توانید همان قوانین مسیریابی را بعداً با `openclaw agents bindings`، `openclaw agents bind` و `openclaw agents unbind` مدیریت کنید (نگاه کنید به [عامل‌ها](/fa/cli/agents)).

وقتی یک حساب غیرپیش‌فرض را به کانالی اضافه می‌کنید که هنوز از تنظیمات سطح بالای تک‌حسابی استفاده می‌کند، OpenClaw مقادیر سطح بالای محدود به حساب را پیش از نوشتن حساب جدید، به نقشه حساب‌های کانال ارتقا می‌دهد. بیشتر کانال‌ها این مقادیر را در `channels.<channel>.accounts.default` قرار می‌دهند، اما کانال‌های همراه می‌توانند به‌جای آن یک حساب ارتقایافته موجود و مطابق را حفظ کنند. Matrix نمونه فعلی است: اگر یک حساب نام‌دار از قبل وجود داشته باشد، یا `defaultAccount` به یک حساب نام‌دار موجود اشاره کند، ارتقا آن حساب را به‌جای ایجاد `accounts.default` جدید حفظ می‌کند.

رفتار مسیریابی سازگار می‌ماند:

- اتصال‌های موجود فقط‌کانال (بدون `accountId`) همچنان با حساب پیش‌فرض مطابقت دارند.
- `channels add` در حالت غیرتعاملی اتصال‌ها را به‌صورت خودکار ایجاد یا بازنویسی نمی‌کند.
- راه‌اندازی تعاملی می‌تواند به‌صورت اختیاری اتصال‌های محدود به حساب اضافه کند.

اگر پیکربندی شما از قبل در حالت ترکیبی بود (حساب‌های نام‌دار موجود بودند و مقادیر تک‌حسابی سطح بالا هنوز تنظیم شده بودند)، `openclaw doctor --fix` را اجرا کنید تا مقادیر محدود به حساب به حساب ارتقایافته انتخاب‌شده برای آن کانال منتقل شوند. بیشتر کانال‌ها به `accounts.default` ارتقا می‌دهند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌دار/پیش‌فرض موجود را حفظ کند.

## ورود و خروج (تعاملی)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` از `--verbose` پشتیبانی می‌کند.
- `channels login` و `logout` می‌توانند کانال را زمانی که فقط یک هدف ورود پشتیبانی‌شده پیکربندی شده باشد، استنتاج کنند.
- `channels logout` وقتی قابل دسترس باشد مسیر زنده Gateway را ترجیح می‌دهد، بنابراین خروج پیش از پاک‌سازی وضعیت احراز هویت کانال، هر شنونده فعال را متوقف می‌کند. اگر Gateway محلی قابل دسترس نباشد، به پاک‌سازی محلی احراز هویت بازمی‌گردد.
- `channels login` را از یک ترمینال روی میزبان Gateway اجرا کنید. `exec` عامل این جریان ورود تعاملی را مسدود می‌کند؛ ابزارهای ورود عامل بومی کانال، مانند `whatsapp_login`، در صورت در دسترس بودن باید از چت استفاده شوند.

## عیب‌یابی

- برای یک بررسی گسترده، `openclaw status --deep` را اجرا کنید.
- برای اصلاحات هدایت‌شده از `openclaw doctor` استفاده کنید.
- `openclaw channels list` این را چاپ می‌کند: `Claude: HTTP 403 ... user:profile` ← نمای لحظه‌ای مصرف به دامنه `user:profile` نیاز دارد. از `--no-usage` استفاده کنید، یا یک کلید جلسه claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) ارائه دهید، یا از طریق Claude CLI دوباره احراز هویت کنید.
- وقتی Gateway قابل دسترس نباشد، `openclaw channels status` به خلاصه‌های فقط مبتنی بر پیکربندی بازمی‌گردد. اگر اعتبارنامه یک کانال پشتیبانی‌شده از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، آن حساب را به‌جای نمایش به‌عنوان پیکربندی‌نشده، به‌عنوان پیکربندی‌شده همراه با یادداشت‌های کاهش‌یافته گزارش می‌کند.

## بررسی قابلیت‌ها

راهنمایی‌های قابلیت ارائه‌دهنده (intents/scopes در صورت در دسترس بودن) به‌علاوه پشتیبانی ثابت از قابلیت‌ها را دریافت کنید:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

نکته‌ها:

- `--channel` اختیاری است؛ آن را حذف کنید تا همه کانال‌ها (از جمله افزونه‌ها) فهرست شوند.
- `--account` فقط با `--channel` معتبر است.
- `--target` مقدار `channel:<id>` یا یک شناسه عددی خام کانال را می‌پذیرد و فقط برای Discord اعمال می‌شود.
- بررسی‌ها مخصوص ارائه‌دهنده هستند: intentهای Discord + مجوزهای اختیاری کانال؛ دامنه‌های ربات + کاربر Slack؛ پرچم‌های ربات Telegram + Webhook؛ نسخه daemon مربوط به Signal؛ توکن برنامه Microsoft Teams + نقش‌ها/دامنه‌های Graph (در موارد شناخته‌شده حاشیه‌نویسی شده‌اند). کانال‌های بدون بررسی، `Probe: unavailable` گزارش می‌کنند.

## تبدیل نام‌ها به شناسه‌ها

نام کانال/کاربر را با استفاده از فهرست ارائه‌دهنده به شناسه تبدیل کنید:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

نکته‌ها:

- برای اجبار نوع هدف از `--kind user|group|auto` استفاده کنید.
- وقتی چندین ورودی نام یکسانی دارند، تبدیل، مطابقت‌های فعال را ترجیح می‌دهد.
- `channels resolve` فقط‌خواندنی است. اگر یک حساب انتخاب‌شده از طریق SecretRef پیکربندی شده باشد اما آن اعتبارنامه در مسیر فرمان فعلی در دسترس نباشد، فرمان به‌جای متوقف کردن کل اجرا، نتایج تبدیل‌نشده کاهش‌یافته همراه با یادداشت‌ها را برمی‌گرداند.
- `channels resolve` Pluginهای کانال را نصب نمی‌کند. پیش از تبدیل نام‌ها برای یک کانال کاتالوگ قابل نصب، از `channels add --channel <name>` استفاده کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی کانال‌ها](/fa/channels)

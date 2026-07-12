---
read_when:
    - اجرای اسکریپت‌ها از مخزن
    - افزودن یا تغییر اسکریپت‌ها در `./scripts`
summary: 'اسکریپت‌های مخزن: هدف، دامنه و نکات ایمنی'
title: اسکریپت‌ها
x-i18n:
    generated_at: "2026-07-12T10:08:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` شامل اسکریپت‌های کمکی برای گردش‌کارهای محلی و وظایف عملیاتی است. هنگامی از آن‌ها استفاده کنید که وظیفه به‌وضوح به یک اسکریپت مرتبط باشد؛ در غیر این صورت، CLI را ترجیح دهید.

## قراردادها

- اسکریپت‌ها **اختیاری** هستند، مگر آنکه در مستندات یا چک‌لیست‌های انتشار به آن‌ها ارجاع شده باشد.
- هرگاه رابط‌های CLI موجود باشند، آن‌ها را ترجیح دهید (برای نمونه: `openclaw models status --check`).
- فرض کنید اسکریپت‌ها مختص میزبان هستند؛ پیش از اجرای آن‌ها روی دستگاهی جدید، محتوایشان را بخوانید.

## اسکریپت‌های پایش احراز هویت

احراز هویت عمومی مدل در [احراز هویت](/fa/gateway/authentication) توضیح داده شده است. اسکریپت‌های زیر سامانه‌ای جداگانه و اختیاری برای پایش **توکن اشتراک Claude Code CLI** روی میزبانی راه‌دور یا بدون رابط گرافیکی و احراز هویت مجدد از طریق تلفن هستند:

- `scripts/setup-auth-system.sh` - راه‌اندازی یک‌باره: احراز هویت فعلی را بررسی می‌کند، در ایجاد یک `claude setup-token` با عمر طولانی کمک می‌کند و مراحل نصب systemd/Termux را نمایش می‌دهد.
- `scripts/claude-auth-status.sh [full|json|simple]` - وضعیت احراز هویت Claude Code و OpenClaw را بررسی می‌کند.
- `scripts/auth-monitor.sh` - وضعیت را به‌صورت دوره‌ای بررسی می‌کند و هنگامی که توکن به زمان انقضا نزدیک می‌شود، اعلانی ارسال می‌کند (از طریق ارسال OpenClaw و/یا ntfy.sh). متغیرهای محیطی: `WARN_HOURS` (پیش‌فرض `2`)، `NOTIFY_PHONE`، `NOTIFY_NTFY`. آن را طبق زمان‌بندی و با استفاده از `scripts/systemd/openclaw-auth-monitor.{service,timer}` همراه اجرا کنید (هر ۳۰ دقیقه).
- `scripts/mobile-reauth.sh` - فرمان `claude setup-token` را دوباره اجرا می‌کند و نشانی‌هایی را برای باز کردن روی تلفن نمایش می‌دهد تا از طریق SSH در Termux استفاده شوند.
- `scripts/termux-quick-auth.sh`، `scripts/termux-auth-widget.sh`، `scripts/termux-sync-widget.sh` - اسکریپت‌های Termux:Widget که از طریق SSH به میزبان متصل می‌شوند، یک پیام کوتاه وضعیت نمایش می‌دهند و در صورت انقضای احراز هویت، کنسول یا دستورالعمل‌های احراز هویت مجدد را باز می‌کنند.

## ابزار کمکی خواندن GitHub

هنگامی از `scripts/gh-read` استفاده کنید که می‌خواهید `gh` برای فراخوانی‌های خواندنی محدود به مخزن، از توکن نصب GitHub App استفاده کند و در عین حال `gh` معمولی برای عملیات نوشتن با ورود شخصی شما باقی بماند.

متغیرهای محیطی الزامی:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

متغیرهای محیطی اختیاری:

- `OPENCLAW_GH_READ_INSTALLATION_ID` هنگامی که می‌خواهید جست‌وجوی نصب بر اساس مخزن را نادیده بگیرید
- `OPENCLAW_GH_READ_PERMISSIONS` به‌عنوان جایگزینی جداشده با ویرگول برای زیرمجموعه مجوزهای خواندن که باید درخواست شود

ترتیب تشخیص مخزن:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

نمونه‌ها:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## هنگام افزودن اسکریپت‌ها

- اسکریپت‌ها را متمرکز و مستند نگه دارید.
- یک مدخل کوتاه به سند مرتبط اضافه کنید (یا اگر موجود نیست، سندی ایجاد کنید).

## مطالب مرتبط

- [آزمایش](/fa/help/testing)
- [آزمایش زنده](/fa/help/testing-live)

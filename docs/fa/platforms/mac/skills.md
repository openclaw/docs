---
read_when:
    - به‌روزرسانی رابط کاربری تنظیمات Skills در macOS
    - تغییر گیتینگ Skills یا رفتار نصب
summary: رابط کاربری تنظیمات Skills در macOS و وضعیت پشتیبانی‌شده با Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T18:08:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

اپ macOS مهارت‌های OpenClaw را از طریق Gateway نمایش می‌دهد؛ مهارت‌ها را به‌صورت محلی تجزیه نمی‌کند.

## منبع داده

- `skills.status` (Gateway) همهٔ مهارت‌ها را به‌همراه واجد شرایط بودن و نیازمندی‌های مفقود برمی‌گرداند
  (از جمله مسدودسازی‌های فهرست مجاز برای مهارت‌های همراه).
- نیازمندی‌ها از `metadata.openclaw.requires` در هر `SKILL.md` مشتق می‌شوند.

## اقدام‌های نصب

- `metadata.openclaw.install` گزینه‌های نصب را تعریف می‌کند (brew/node/go/uv).
- اپ `skills.install` را فراخوانی می‌کند تا نصب‌کننده‌ها روی میزبان Gateway اجرا شوند.
- `security.installPolicy` که در مالکیت اپراتور است، می‌تواند نصب مهارت‌های پشتیبانی‌شده با Gateway را
  پیش از اجرای فرادادهٔ نصب‌کننده مسدود کند. مسدودسازی داخلی کد خطرناک در زمان نصب
  بخشی از جریان نصب مهارت نیست.
- اگر همهٔ گزینه‌های نصب `download` باشند، Gateway همهٔ انتخاب‌های دانلود را نمایش می‌دهد.
- در غیر این صورت، Gateway با استفاده از ترجیحات نصب فعلی
  و باینری‌های میزبان، یک نصب‌کنندهٔ ترجیحی را انتخاب می‌کند: ابتدا Homebrew وقتی
  `skills.install.preferBrew` فعال است و `brew` وجود دارد، سپس `uv`، سپس
  مدیر Node پیکربندی‌شده از `skills.install.nodeManager`، و بعد
  جایگزین‌های بعدی مانند `go` یا `download`.
- برچسب‌های نصب Node مدیر Node پیکربندی‌شده، از جمله `yarn`، را منعکس می‌کنند.

## کلیدهای Env/API

- اپ کلیدها را در `~/.openclaw/openclaw.json` زیر `skills.entries.<skillKey>` ذخیره می‌کند.
- `skills.update` مقادیر `enabled`، `apiKey` و `env` را وصله می‌کند.

## حالت ریموت

- نصب و به‌روزرسانی‌های پیکربندی روی میزبان Gateway انجام می‌شوند (نه Mac محلی).

## مرتبط

- [Skills](/fa/tools/skills)
- [اپ macOS](/fa/platforms/macos)

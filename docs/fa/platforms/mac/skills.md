---
read_when:
    - به‌روزرسانی رابط کاربری تنظیمات Skills در macOS
    - تغییر گیتینگ Skills یا رفتار نصب
summary: رابط کاربری تنظیمات Skills در macOS و وضعیت مبتنی بر Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-29T23:12:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 16
---

برنامه macOS، Skills مربوط به OpenClaw را از طریق Gateway در دسترس قرار می‌دهد؛ این برنامه Skills را به‌صورت محلی تجزیه نمی‌کند.

## منبع داده

- `skills.status` (Gateway) همه Skills را به‌همراه واجدشرایط‌بودن و الزامات مفقود برمی‌گرداند
  (از جمله مسدودسازی‌های فهرست مجاز برای Skills بسته‌بندی‌شده).
- الزامات از `metadata.openclaw.requires` در هر `SKILL.md` استخراج می‌شوند.

## اقدامات نصب

- `metadata.openclaw.install` گزینه‌های نصب را تعریف می‌کند (brew/node/go/uv).
- برنامه `skills.install` را فراخوانی می‌کند تا نصب‌کننده‌ها روی میزبان Gateway اجرا شوند.
- یافته‌های داخلی dangerous-code با سطح `critical` به‌صورت پیش‌فرض `skills.install` را مسدود می‌کنند؛ یافته‌های مشکوک همچنان فقط هشدار می‌دهند. بازنویسی خطرناک روی درخواست Gateway وجود دارد، اما جریان پیش‌فرض برنامه در حالت بسته-در-صورت-خطا باقی می‌ماند.
- اگر همه گزینه‌های نصب `download` باشند، Gateway همه گزینه‌های دانلود را
  نمایش می‌دهد.
- در غیر این صورت، Gateway با استفاده از ترجیحات نصب فعلی
  و باینری‌های میزبان، یک نصب‌کننده ترجیحی را انتخاب می‌کند: ابتدا Homebrew وقتی
  `skills.install.preferBrew` فعال است و `brew` وجود دارد، سپس `uv`، سپس
  مدیر node پیکربندی‌شده از `skills.install.nodeManager`، و بعد
  گزینه‌های جایگزین بعدی مانند `go` یا `download`.
- برچسب‌های نصب Node مدیر node پیکربندی‌شده، از جمله `yarn`، را منعکس می‌کنند.

## کلیدهای محیط/API

- برنامه کلیدها را در `~/.openclaw/openclaw.json` زیر `skills.entries.<skillKey>` ذخیره می‌کند.
- `skills.update` مقدارهای `enabled`، `apiKey` و `env` را وصله می‌کند.

## حالت راه دور

- نصب و به‌روزرسانی‌های پیکربندی روی میزبان Gateway انجام می‌شوند (نه Mac محلی).

## مرتبط

- [Skills](/fa/tools/skills)
- [برنامه macOS](/fa/platforms/macos)

---
read_when:
    - به‌روزرسانی رابط کاربری تنظیمات Skills در macOS
    - تغییر محدودسازی یا رفتار نصب Skills
summary: رابط کاربری تنظیمات Skills در macOS و وضعیت مبتنی بر Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T10:22:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

برنامهٔ macOS، Skills مربوط به OpenClaw را از طریق Gateway نمایش می‌دهد و آن‌ها را به‌صورت محلی تجزیه نمی‌کند.

## منبع داده

- `skills.status` در Gateway همهٔ Skills را به‌همراه وضعیت واجد شرایط بودن و نیازمندی‌های برآورده‌نشده، از جمله مسدودشدن توسط فهرست مجاز برای Skills همراه، برمی‌گرداند.
- نیازمندی‌ها از `metadata.openclaw.requires` در فایل `SKILL.md` هر Skill دریافت می‌شوند.

## عملیات نصب

- `metadata.openclaw.install` گزینه‌های نصب (`brew`/`node`/`go`/`uv`/`download`) را تعریف می‌کند.
- برنامه برای اجرای نصب‌کننده‌ها روی میزبان Gateway، `skills.install` را فراخوانی می‌کند.
- `security.installPolicy` تحت مالکیت اپراتور (`enabled`، `targets`، `exec`) می‌تواند پیش از اجرای فرادادهٔ نصب‌کننده، نصب Skills از طریق Gateway را مسدود کند. اسکن داخلی کد خطرناک که برای نصب Pluginها استفاده می‌شود، به جریان نصب Skill متصل نیست.
- اگر همهٔ گزینه‌های نصب `download` باشند، Gateway تمام گزینه‌های بارگیری را نمایش می‌دهد.
- در غیر این صورت، Gateway با استفاده از ترجیحات فعلی نصب (`skills.install.preferBrew` و `skills.install.nodeManager`) و فایل‌های اجرایی موجود روی میزبان، یک نصب‌کنندهٔ ترجیحی را انتخاب می‌کند: ابتدا Homebrew، در صورتی که `preferBrew` فعال و `brew` موجود باشد؛ سپس `uv`؛ پس از آن مدیر Node پیکربندی‌شده؛ سپس در صورت موجود بودن، دوباره Homebrew (حتی بدون `preferBrew`)؛ بعد `go`؛ و در پایان `download`.
- برچسب‌های نصب Node، از جمله `yarn`، مدیر Node پیکربندی‌شده را منعکس می‌کنند.

## متغیرهای محیطی/کلیدهای API

- برنامه کلیدها را در `~/.openclaw/openclaw.json` و زیر `skills.entries.<skillKey>` ذخیره می‌کند.
- `skills.update` مقادیر `enabled`، `apiKey` و `env` را وصله می‌کند.

## حالت راه‌دور

- نصب و به‌روزرسانی‌های پیکربندی روی میزبان Gateway انجام می‌شوند، نه روی Mac محلی.

## مرتبط

- [Skills](/fa/tools/skills)
- [برنامهٔ macOS](/fa/platforms/macos)

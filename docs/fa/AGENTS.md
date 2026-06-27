---
x-i18n:
    generated_at: "2026-06-27T17:08:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# راهنمای مستندات

این دایرکتوری مالک نگارش مستندات، قواعد پیوند Mintlify، و سیاست i18n مستندات است.

## قواعد Mintlify

- مستندات روی Mintlify (`https://docs.openclaw.ai`) میزبانی می‌شوند.
- پیوندهای داخلی مستندات در `docs/**/*.md` باید نسبت به ریشه باقی بمانند و پسوند `.md` یا `.mdx` نداشته باشند (نمونه: `[Config](/gateway/configuration)`).
- ارجاع‌های متقاطع بخش‌ها باید از anchor روی مسیرهای نسبت به ریشه استفاده کنند (نمونه: `[Hooks](/gateway/configuration-reference#hooks)`).
- عنوان‌های مستندات باید از em dash و apostrophe پرهیز کنند، چون تولید anchor در Mintlify در این موارد شکننده است.
- README و سایر مستنداتی که در GitHub رندر می‌شوند باید URLهای مطلق مستندات را نگه دارند تا پیوندها بیرون از Mintlify هم کار کنند.
- محتوای مستندات باید عمومی بماند: نام دستگاه شخصی، hostname، یا مسیر محلی نداشته باشد؛ از placeholderهایی مثل `user@gateway-host` استفاده کنید.

## قواعد محتوای مستندات

- برای مستندات، متن UI، و فهرست‌های انتخاب‌گر، سرویس‌ها/ارائه‌دهندگان را به ترتیب الفبایی مرتب کنید مگر اینکه بخش به‌طور صریح ترتیب runtime یا ترتیب auto-detection را توضیح دهد.
- نام‌گذاری Pluginهای همراه را با قواعد اصطلاح‌شناسی Plugin در سطح کل repo در `AGENTS.md` ریشه هماهنگ نگه دارید.

## مستندات داخلی

- مستندات خصوصی بلندمدت operator باید در `~/Projects/manager/docs/` قرار بگیرند.
- مستندات scratch/mirror داخلی و محلی repo می‌توانند زیر `docs/internal/` نادیده‌گرفته‌شده قرار بگیرند.
- هرگز صفحه‌های `docs/internal/**` را به ناوبری `docs/docs.json` اضافه نکنید یا از مستندات عمومی به آن‌ها پیوند ندهید.
- اگر صفحه‌ای بعداً به‌اجبار اضافه شود، `scripts/docs-sync-publish.mjs` آن را از repo انتشار عمومی `openclaw/docs` حذف و هرس می‌کند.
- مستندات داخلی می‌توانند به مسیرهای repo، نام‌های app خصوصی، نام‌های آیتم 1Password، و runbookها اشاره کنند، اما هرگز نباید مقدار secret را شامل شوند.

## ویرایش کارت امتیاز بلوغ

`taxonomy.yaml` و `qa/maturity-scores.yaml` ورودی‌های منبع هستند؛ مستندات بلوغ تولیدشده زیر `docs/maturity/` projection هستند و نباید برای امتیاز، LTS، taxonomy، پروفایل QA، یا جدول‌های شواهد به‌صورت دستی ویرایش شوند.
`scripts/qa/render-maturity-docs.ts` مالک تولید است؛ برای به‌روزرسانی مستندات commit‌شده از `pnpm maturity:render` و برای راستی‌آزمایی آن‌ها از `pnpm maturity:check` استفاده کنید.
`.github/workflows/maturity-scorecard.yml` پیش‌نمایش‌های artifact را رندر می‌کند و می‌تواند PRهای مستندات تولیدشده را باز کند؛ `.github/workflows/openclaw-release-checks.yml` آن را برای QA انتشار dispatch می‌کند.
داده‌های قطعی `qa-evidence.json.scorecard` را در artifactهای GitHub Actions نگه دارید مگر اینکه maintainer صراحتاً یک projection پاک‌سازی‌شده و commit‌شده بخواهد.
overrideهای انسانی باید وضعیت منبع را در یک PR تغییر دهند و دلیل را همراه با شواهد عمومی یا ویرایش‌شده توضیح دهند.

## i18n مستندات

- مستندات زبان‌های خارجی در این repo نگهداری نمی‌شوند. خروجی انتشار تولیدشده در repo جداگانه `openclaw/docs` قرار دارد (که اغلب به‌صورت محلی با نام `../openclaw-docs` clone می‌شود).
- اینجا مستندات محلی‌سازی‌شده را زیر `docs/<locale>/**` اضافه یا ویرایش نکنید.
- مستندات انگلیسی در این repo به‌همراه فایل‌های glossary را منبع حقیقت بدانید.
- Pipeline: مستندات انگلیسی را اینجا به‌روزرسانی کنید، در صورت نیاز `docs/.i18n/glossary.<locale>.json` را به‌روزرسانی کنید، سپس بگذارید همگام‌سازی repo انتشار و `scripts/docs-i18n` در `openclaw/docs` اجرا شوند.
- پیش از اجرای دوباره `scripts/docs-i18n`، برای هر اصطلاح فنی جدید، عنوان صفحه، یا برچسب کوتاه ناوبری که باید انگلیسی بماند یا ترجمه ثابت داشته باشد، ورودی glossary اضافه کنید.
- `pnpm docs:check-i18n-glossary` guard برای عنوان‌های تغییریافته مستندات انگلیسی و برچسب‌های کوتاه مستندات داخلی است.
- حافظه ترجمه در فایل‌های تولیدشده `docs/.i18n/*.tm.jsonl` در repo انتشار قرار دارد.
- `docs/.i18n/README.md` را ببینید.

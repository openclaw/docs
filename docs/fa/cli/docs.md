---
read_when:
    - می‌خواهید مستندات زنده‌ی OpenClaw را از ترمینال جست‌وجو کنید
    - باید بدانید CLI مستندات کدام API جست‌وجوی میزبانی‌شده را فراخوانی می‌کند
summary: مرجع CLI برای `openclaw docs` (جست‌وجوی نمایه زنده مستندات)
title: مستندات
x-i18n:
    generated_at: "2026-06-27T17:23:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

فهرست زندهٔ مستندات OpenClaw را از پایانه جست‌وجو کنید. این فرمان API جست‌وجوی مستندات میزبانی‌شده توسط Cloudflare برای OpenClaw را فراخوانی می‌کند و نتایج را در پایانهٔ شما نمایش می‌دهد.

## کاربرد

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

آرگومان‌ها:

| آرگومان      | توضیح                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| `[query...]` | عبارت جست‌وجوی آزاد. عبارت‌های چندکلمه‌ای با فاصله به هم پیوسته و به‌صورت یکجا ارسال می‌شوند. |

## نمونه‌ها

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

بدون عبارت جست‌وجو، `openclaw docs` به‌جای اجرای جست‌وجو، URL نقطهٔ ورود مستندات را همراه با یک فرمان نمونهٔ جست‌وجو چاپ می‌کند.

## روش کار

`openclaw docs` نشانی `https://docs.openclaw.ai/api/search` را فراخوانی می‌کند و نتایج JSON را نمایش می‌دهد. فراخوانی جست‌وجو از مهلت زمانی ثابت ۳۰ ثانیه‌ای استفاده می‌کند.

## خروجی

در یک پایانهٔ غنی (TTY)، نتایج به‌صورت یک عنوان و سپس یک فهرست گلوله‌ای نمایش داده می‌شوند. هر گلوله عنوان صفحه، URL لینک‌شدهٔ مستندات، و در خط بعد یک گزیدهٔ کوتاه را نشان می‌دهد. نتایج خالی، «نتیجه‌ای یافت نشد.» را چاپ می‌کنند.

در خروجی غیرغنی (پایپ‌شده، `--no-color`، اسکریپت‌ها)، همان داده‌ها به‌صورت Markdown نمایش داده می‌شوند:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## کدهای خروج

| کد  | معنا                                                              |
| --- | ----------------------------------------------------------------- |
| `0` | جست‌وجو موفق بود (از جمله پاسخ‌های بدون نتیجه).                  |
| `1` | فراخوانی API جست‌وجوی مستندات میزبانی‌شده ناموفق بود؛ stderr به‌صورت درون‌خطی چاپ می‌شود. |

## مرتبط

- [مرجع CLI](/fa/cli)
- [مستندات زنده](https://docs.openclaw.ai)

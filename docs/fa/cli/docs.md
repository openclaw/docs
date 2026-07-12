---
read_when:
    - می‌خواهید مستندات زندهٔ OpenClaw را از ترمینال جست‌وجو کنید
    - باید بدانید CLI مستندات کدام API جست‌وجوی میزبانی‌شده را فراخوانی می‌کند
summary: مرجع CLI برای `openclaw docs` (جست‌وجو در نمایهٔ زندهٔ مستندات)
title: مستندات
x-i18n:
    generated_at: "2026-07-12T09:44:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

نمایهٔ زندهٔ مستندات OpenClaw را از ترمینال جست‌وجو کنید.

## نحوهٔ استفاده

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

| آرگومان      | توضیحات                                                                                 |
| ------------ | --------------------------------------------------------------------------------------- |
| `[query...]` | عبارت جست‌وجوی آزاد. عبارت‌های چندواژه‌ای با فاصله به هم متصل و به‌صورت یک عبارت ارسال می‌شوند. |

اگر عبارتی وارد نشود، `openclaw docs` به‌جای اجرای جست‌وجو، نشانی URL نقطهٔ ورود مستندات و یک فرمان نمونهٔ جست‌وجو را نمایش می‌دهد.

## مثال‌ها

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## نحوهٔ کار

`openclaw docs` نشانی `https://docs.openclaw.ai/api/search` را فراخوانی و نتایج JSON را نمایش می‌دهد. درخواست جست‌وجو از مهلت زمانی ثابت ۳۰ ثانیه‌ای استفاده می‌کند.

## خروجی

در یک ترمینال غنی (TTY)، نتایج به‌شکل یک عنوان و سپس فهرستی نشانه‌دار نمایش داده می‌شوند: عنوان صفحه، نشانی پیوندشدهٔ مستندات و قطعه‌متنی کوتاه در خط بعد. در صورت نبود نتیجه، پیام «نتیجه‌ای یافت نشد.» نمایش داده می‌شود.

در خروجی غیرغنی (ارسال‌شده از طریق پایپ، `--no-color`، اسکریپت‌ها)، همان داده‌ها به‌صورت Markdown نمایش داده می‌شوند:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## کدهای خروج

| کد  | معنا                                                                                     |
| --- | ---------------------------------------------------------------------------------------- |
| `0` | جست‌وجو موفق بود؛ پاسخ‌های بدون نتیجه نیز شامل می‌شوند.                                  |
| `1` | فراخوانی API جست‌وجوی مستندات میزبانی‌شده ناموفق بود؛ پیام خطا در stderr نمایش داده می‌شود. |

## مرتبط

- [مرجع CLI](/fa/cli)
- [مستندات زنده](https://docs.openclaw.ai)

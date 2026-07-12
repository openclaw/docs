---
read_when:
    - شما در حال نصب، پیکربندی یا ممیزی Plugin انتقال فایل هستید
summary: فایل‌ها را در Nodeهای جفت‌شده از طریق فرمان‌های اختصاصی Node دریافت، فهرست و ذخیره کنید. با استفاده از base64 از طریق `node.invoke` برای فایل‌های باینری تا ۱۶ مگابایت، محدودیت قطع‌شدن خروجی استاندارد bash را دور می‌زند.
title: Plugin انتقال فایل
x-i18n:
    generated_at: "2026-07-12T10:30:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# Plugin انتقال فایل

فایل‌ها را در Nodeهای جفت‌شده با استفاده از فرمان‌های اختصاصی Node دریافت، فهرست و ایجاد کنید. با استفاده از base64 روی `node.invoke`، محدودیت کوتاه‌سازی stdout در bash را برای فایل‌های دودویی تا ۱۶ مگابایت دور می‌زند.

## توزیع

- بسته: `@openclaw/file-transfer`
- روش نصب: همراه OpenClaw ارائه می‌شود

## سطح

قراردادها: ابزارها

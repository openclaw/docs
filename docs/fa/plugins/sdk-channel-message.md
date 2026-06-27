---
summary: تغییر مسیر به /plugins/sdk-channel-outbound
title: API پیام کانال
x-i18n:
    generated_at: "2026-06-27T18:30:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

این صفحه به [API خروجی کانال](/fa/plugins/sdk-channel-outbound) منتقل شد.

`openclaw/plugin-sdk/channel-message` و
`openclaw/plugin-sdk/channel-message-runtime` همچنان زیرمسیرهای سازگاری منسوخ برای Pluginهای قدیمی‌تر هستند. Pluginهای کانال جدید باید برای چرخه حیات پیام، رسید، ارسال پایدار، و راهنماهای پیش‌نمایش زنده از
`openclaw/plugin-sdk/channel-outbound` استفاده کنند. زیرمسیرهای منسوخ، نام‌های مستعار نازکی روی هسته مشترک پیام کانال و سطح‌های SDK متمرکز ورودی/خروجی هستند؛ راهنماهای جدیدی آنجا اضافه نکنید.

برنامه حذف: این نام‌های مستعار را تا پایان بازه مهاجرت Plugin خارجی نگه دارید، سپس پس از انتقال فراخوان‌ها به
`channel-outbound`، آن‌ها را در پاک‌سازی عمده بعدی SDK حذف کنید.

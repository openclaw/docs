---
summary: تغییرمسیر به /plugins/sdk-channel-outbound
title: API پیام کانال
x-i18n:
    generated_at: "2026-07-12T10:39:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

این صفحه به [رابط برنامه‌نویسی خروجی کانال](/fa/plugins/sdk-channel-outbound) منتقل شده است.

`openclaw/plugin-sdk/channel-message` و
`openclaw/plugin-sdk/channel-message-runtime` همچنان زیرمسیرهای سازگاری
منسوخ‌شده برای Pluginهای قدیمی هستند؛ هر دو نام مستعار ساده‌ای برای هسته
مشترک پیام‌رسانی کانال‌اند. Pluginهای کانال جدید باید برای چرخه عمر پیام،
رسید، ارسال پایدار و ابزارهای پیش‌نمایش زنده از
`openclaw/plugin-sdk/channel-outbound` استفاده کنند، نه اینکه ابزارهای جدیدی
به زیرمسیرهای منسوخ‌شده بیفزایند.

برنامه حذف: این نام‌های مستعار را تا پایان بازه مهاجرت Pluginهای خارجی حفظ
کنید، سپس پس از انتقال فراخوان‌ها به `channel-outbound`، آن‌ها را در پاک‌سازی
اصلی بعدی SDK حذف کنید.

---
doc-schema-version: 1
read_when:
    - می‌خواهید Pluginهای شخص ثالث OpenClaw را پیدا کنید
    - می‌خواهید Plugin خودتان را در ClawHub منتشر کنید یا در فهرست قرار دهید
summary: یافتن و انتشار Plugin‌های OpenClaw که توسط جامعه نگه‌داری می‌شوند
title: Pluginهای جامعه
x-i18n:
    generated_at: "2026-06-27T18:14:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

Pluginهای جامعه بسته‌های شخص ثالثی هستند که OpenClaw را با کانال‌ها،
ابزارها، ارائه‌دهنده‌ها، hookها یا قابلیت‌های دیگر گسترش می‌دهند. از [ClawHub](/fa/clawhub) به‌عنوان
سطح اصلی کشف برای Pluginهای عمومی جامعه استفاده کنید.

## یافتن Pluginها

از CLI در ClawHub جستجو کنید:

```bash
openclaw plugins search "calendar"
```

یک Plugin از ClawHub را با پیشوند منبع صریح نصب کنید:

```bash
openclaw plugins install clawhub:<package-name>
```

npm در طول گذار راه‌اندازی همچنان یک مسیر نصب مستقیم پشتیبانی‌شده است:

```bash
openclaw plugins install npm:<package-name>
```

برای نمونه‌های رایج نصب، به‌روزرسانی،
بازرسی، و حذف نصب، از [مدیریت Pluginها](/fa/plugins/manage-plugins) استفاده کنید. برای
مرجع کامل فرمان‌ها و قواعد انتخاب منبع، از [`openclaw plugins`](/fa/cli/plugins) استفاده کنید.

## انتشار Pluginها

وقتی می‌خواهید کاربران OpenClaw آن‌ها را
کشف و نصب کنند، Pluginهای عمومی جامعه را در ClawHub منتشر کنید. ClawHub فهرست زنده بسته‌ها، تاریخچه انتشار،
وضعیت اسکن، و راهنمای نصب را مدیریت می‌کند؛ مستندات یک کاتالوگ ایستای
Pluginهای شخص ثالث نگه نمی‌دارند.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

پیش از انتشار، مطمئن شوید Plugin دارای فراداده بسته، مانیفست Plugin،
مستندات راه‌اندازی، و مالک نگهداشت مشخص است. ClawHub محدوده مالک،
نام بسته، نسخه، محدودیت‌های فایل، و فراداده منبع را پیش از ایجاد
release اعتبارسنجی می‌کند، سپس releaseهای جدید را تا پایان بررسی و راستی‌آزمایی
از سطح‌های نصب و دانلود معمول پنهان نگه می‌دارد.

پیش از انتشار از این چک‌لیست استفاده کنید:

| الزام                 | دلیل                                                    |
| --------------------- | ------------------------------------------------------- |
| منتشرشده در ClawHub   | کاربران نیاز دارند راهنماهای `openclaw plugins install` کار کنند |
| مخزن عمومی GitHub     | بررسی منبع، پیگیری issue، شفافیت                       |
| مستندات راه‌اندازی و استفاده | کاربران باید بدانند چگونه آن را پیکربندی کنند       |
| نگهداشت فعال          | به‌روزرسانی‌های اخیر یا رسیدگی پاسخ‌گو به issueها       |

برای قرارداد کامل انتشار از این صفحه‌ها استفاده کنید:

- [انتشار در ClawHub](/fa/clawhub/publishing) مالکان، محدوده‌ها، releaseها،
  بررسی، اعتبارسنجی بسته، و انتقال بسته را توضیح می‌دهد.
- [ساخت Pluginها](/fa/plugins/building-plugins) شکل بسته Plugin
  و گردش کار نخستین انتشار را نشان می‌دهد.
- [مانیفست Plugin](/fa/plugins/manifest) فیلدهای مانیفست Plugin بومی را تعریف می‌کند.

## مرتبط

- [Pluginها](/fa/tools/plugin) - نصب، پیکربندی، راه‌اندازی دوباره، و عیب‌یابی
- [مدیریت Pluginها](/fa/plugins/manage-plugins) - نمونه‌های فرمان
- [انتشار در ClawHub](/fa/clawhub/publishing) - قواعد انتشار و release

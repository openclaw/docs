---
doc-schema-version: 1
read_when:
    - می‌خواهید Pluginهای شخص ثالث OpenClaw را پیدا کنید
    - می‌خواهید Plugin خودتان را در ClawHub منتشر یا فهرست کنید
summary: Pluginهای OpenClaw را که جامعه نگهداری می‌کند پیدا و منتشر کنید
title: Pluginهای جامعه کاربری
x-i18n:
    generated_at: "2026-07-12T10:25:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

Pluginهای انجمن، بسته‌های شخص ثالثی هستند که OpenClaw را با
کانال‌ها، ابزارها، ارائه‌دهندگان، هوک‌ها یا قابلیت‌های دیگر گسترش می‌دهند. از
[ClawHub](/clawhub) به‌عنوان بستر اصلی کشف Pluginهای عمومی انجمن
استفاده کنید.

## یافتن Pluginها

از طریق CLI در ClawHub جست‌وجو کنید:

```bash
openclaw plugins search "calendar"
```

یک Plugin از ClawHub را با پیشوند صریح منبع نصب کنید:

```bash
openclaw plugins install clawhub:<package-name>
```

در دورهٔ گذار راه‌اندازی، npm همچنان به‌عنوان مسیر پشتیبانی‌شدهٔ نصب مستقیم باقی می‌ماند:

```bash
openclaw plugins install npm:<package-name>
```

برای نمونه‌های متداول نصب، به‌روزرسانی، بررسی و حذف، از
[مدیریت Pluginها](/fa/plugins/manage-plugins) استفاده کنید. برای مرجع کامل فرمان‌ها
و قواعد انتخاب منبع، از [`openclaw plugins`](/fa/cli/plugins) استفاده کنید.

## انتشار Pluginها

Pluginهای عمومی انجمن را در ClawHub منتشر کنید تا کاربران OpenClaw بتوانند
آن‌ها را پیدا و نصب کنند. ClawHub فهرست زندهٔ بسته‌ها، تاریخچهٔ انتشارها،
وضعیت اسکن و راهنمای نصب را مدیریت می‌کند؛ مستندات، کاتالوگ ثابتی از
Pluginهای شخص ثالث نگه‌داری نمی‌کنند.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

پیش از انتشار، مطمئن شوید Plugin دارای فرادادهٔ بسته، مانیفست Plugin،
مستندات راه‌اندازی و یک مسئول نگه‌داری مشخص است. ClawHub پیش از
ایجاد انتشار، محدودهٔ مالک، نام بسته، نسخه، محدودیت‌های فایل و فرادادهٔ منبع
را اعتبارسنجی می‌کند؛ سپس انتشارهای جدید را تا پایان بازبینی و راستی‌آزمایی،
از بسترهای عادی نصب و دانلود پنهان نگه می‌دارد.

فهرست بررسی پیش از انتشار:

| الزام                  | دلیل                                                         |
| ---------------------- | ------------------------------------------------------------ |
| انتشار در ClawHub      | راهنمای `openclaw plugins install` باید برای کاربران کار کند |
| مخزن عمومی GitHub      | بازبینی منبع، پیگیری مشکلات و شفافیت                          |
| مستندات راه‌اندازی و استفاده | کاربران باید نحوهٔ پیکربندی آن را بدانند                |
| نگه‌داری فعال          | به‌روزرسانی‌های اخیر یا رسیدگی پاسخ‌گو به مشکلات              |

قرارداد کامل انتشار:

- [انتشار در ClawHub](/fa/clawhub/publishing) - مالکان، محدوده‌ها، انتشارها،
  بازبینی، اعتبارسنجی بسته و انتقال بسته
- [ساخت Pluginها](/fa/plugins/building-plugins) - ساختار بستهٔ Plugin
  و روند نخستین انتشار
- [مانیفست Plugin](/fa/plugins/manifest) - فیلدهای مانیفست بومی Plugin

## مرتبط

- [Pluginها](/fa/tools/plugin) - نصب، پیکربندی، راه‌اندازی مجدد و عیب‌یابی
- [مدیریت Pluginها](/fa/plugins/manage-plugins) - نمونه‌های فرمان
- [انتشار در ClawHub](/fa/clawhub/publishing) - قواعد انتشار و عرضه

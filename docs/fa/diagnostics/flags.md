---
read_when:
    - به لاگ‌های اشکال‌زدایی هدفمند نیاز دارید، بدون اینکه سطوح لاگ‌گیری سراسری را افزایش دهید
    - لازم است لاگ‌های ویژهٔ زیرسامانه را برای پشتیبانی جمع‌آوری کنید.
summary: پرچم‌های عیب‌یابی برای گزارش‌های اشکال‌زدایی هدفمند
title: پرچم‌های عیب‌یابی
x-i18n:
    generated_at: "2026-05-02T11:44:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d0ff92d45cf1c5a12a7103ba5b97d656a55a13a7a4f2e86e26ba3a9cfae7687
    source_path: diagnostics/flags.md
    workflow: 16
---

پرچم‌های عیب‌یابی به شما امکان می‌دهند لاگ‌های اشکال‌زدایی هدفمند را بدون فعال کردن لاگ‌گیری تفصیلی در همه‌جا فعال کنید. پرچم‌ها اختیاری‌اند و مگر اینکه یک زیرسامانه آن‌ها را بررسی کند، اثری ندارند.

## نحوه کار

- پرچم‌ها رشته هستند (بدون حساسیت به بزرگی/کوچکی حروف).
- می‌توانید پرچم‌ها را در پیکربندی یا از طریق یک بازنویسی env فعال کنید.
- وایلدکارت‌ها پشتیبانی می‌شوند:
  - `telegram.*` با `telegram.http` مطابقت دارد
  - `*` همه پرچم‌ها را فعال می‌کند

## فعال‌سازی از طریق پیکربندی

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

چند پرچم:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

پس از تغییر پرچم‌ها، Gateway را بازراه‌اندازی کنید.

## بازنویسی env (موردی)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

غیرفعال کردن همه پرچم‌ها:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## مصنوع‌های Timeline

پرچم `timeline` رویدادهای زمان‌بندی ساختاریافته راه‌اندازی و زمان اجرا را برای
هارنس‌های QA خارجی می‌نویسد:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

همچنین می‌توانید آن را در پیکربندی فعال کنید:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

مسیر فایل timeline همچنان از
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` می‌آید. وقتی `timeline` فقط از طریق
پیکربندی فعال شده باشد، نخستین spanهای بارگذاری پیکربندی منتشر نمی‌شوند، چون OpenClaw هنوز
پیکربندی را نخوانده است؛ spanهای بعدی راه‌اندازی از پرچم پیکربندی استفاده می‌کنند.

`OPENCLAW_DIAGNOSTICS=1`، `OPENCLAW_DIAGNOSTICS=all`، و
`OPENCLAW_DIAGNOSTICS=*` نیز timeline را فعال می‌کنند، چون همه
پرچم‌های عیب‌یابی را فعال می‌کنند. وقتی فقط مصنوع زمان‌بندی JSONL را می‌خواهید،
`timeline` را ترجیح دهید.

رکوردهای Timeline از پوشش `openclaw.diagnostics.v1` استفاده می‌کنند. رویدادها می‌توانند شامل
شناسه‌های پردازه، نام فازها، نام spanها، مدت‌زمان‌ها، شناسه‌های Plugin، تعداد وابستگی‌ها،
نمونه‌های تاخیر حلقه رویداد، نام عملیات provider، وضعیت خروج فرایند فرزند،
و نام‌ها/پیام‌های خطای راه‌اندازی باشند. فایل‌های timeline را به‌عنوان
مصنوع‌های عیب‌یابی محلی در نظر بگیرید؛ پیش از اشتراک‌گذاری خارج از دستگاهتان آن‌ها را بازبینی کنید.

## محل لاگ‌ها

پرچم‌ها لاگ‌ها را در فایل لاگ عیب‌یابی استاندارد منتشر می‌کنند. به‌طور پیش‌فرض:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

اگر `logging.file` را تنظیم کرده‌اید، به‌جای آن از همان مسیر استفاده کنید. لاگ‌ها JSONL هستند (یک شیء JSON در هر خط). ویرایش اطلاعات حساس همچنان بر اساس `logging.redactSensitive` اعمال می‌شود.

## استخراج لاگ‌ها

جدیدترین فایل لاگ را انتخاب کنید:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

فیلتر کردن عیب‌یابی HTTP مربوط به Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

فیلتر کردن عیب‌یابی HTTP مربوط به Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

یا هنگام بازتولید مشکل، tail کنید:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

برای Gatewayهای راه دور، می‌توانید از `openclaw logs --follow` نیز استفاده کنید (به [/cli/logs](/fa/cli/logs) مراجعه کنید).

## نکات

- اگر `logging.level` بالاتر از `warn` تنظیم شده باشد، ممکن است این لاگ‌ها سرکوب شوند. مقدار پیش‌فرض `info` مناسب است.
- `brave.http` نشانی‌های URL/پارامترهای query درخواست Brave Search، وضعیت/زمان‌بندی پاسخ، و رویدادهای برخورد/عدم برخورد/نوشتن cache را لاگ می‌کند. کلیدهای API یا بدنه پاسخ را لاگ نمی‌کند، اما queryهای جست‌وجو می‌توانند حساس باشند.
- فعال گذاشتن پرچم‌ها ایمن است؛ آن‌ها فقط حجم لاگ را برای زیرسامانه مشخص تحت تاثیر قرار می‌دهند.
- برای تغییر مقصدهای لاگ، سطح‌ها، و ویرایش اطلاعات حساس از [/logging](/fa/logging) استفاده کنید.

## مرتبط

- [عیب‌یابی Gateway](/fa/gateway/diagnostics)
- [رفع اشکال Gateway](/fa/gateway/troubleshooting)

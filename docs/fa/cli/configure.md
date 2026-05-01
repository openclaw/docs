---
read_when:
    - می‌خواهید اعتبارنامه‌ها، دستگاه‌ها یا پیش‌فرض‌های عامل را به‌صورت تعاملی تنظیم کنید
summary: مرجع CLI برای `openclaw configure` (درخواست‌های پیکربندی تعاملی)
title: پیکربندی
x-i18n:
    generated_at: "2026-05-01T11:42:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 437a6ec43a48611bf08bdeb0a6e692581c488fac283f0104b172088db37949bb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

اعلان تعاملی برای راه‌اندازی اعتبارنامه‌ها، دستگاه‌ها و پیش‌فرض‌های عامل.

<Note>
بخش **مدل** شامل یک انتخاب چندگانه برای فهرست مجاز `agents.defaults.models` است (چیزی که در `/model` و انتخاب‌گر مدل نمایش داده می‌شود). انتخاب‌های راه‌اندازی محدود به ارائه‌دهنده، مدل‌های انتخاب‌شده‌شان را به فهرست مجاز موجود ادغام می‌کنند، به‌جای اینکه ارائه‌دهندگان نامرتبطی را که از قبل در پیکربندی هستند جایگزین کنند. اجرای دوباره احراز هویت ارائه‌دهنده از configure مقدار موجود `agents.defaults.model.primary` را حفظ می‌کند. زمانی از `openclaw models auth login --provider <id> --set-default` یا `openclaw models set <model>` استفاده کنید که عمدا می‌خواهید مدل پیش‌فرض را تغییر دهید.
</Note>

وقتی configure از یک انتخاب احراز هویت ارائه‌دهنده شروع می‌شود، انتخاب‌گرهای مدل پیش‌فرض و فهرست مجاز به‌طور خودکار همان ارائه‌دهنده را ترجیح می‌دهند. برای ارائه‌دهندگان جفت‌شده مانند Volcengine و BytePlus، همین ترجیح نسخه‌های طرح کدنویسی آن‌ها (`volcengine-plan/*`، `byteplus-plan/*`) را هم تطبیق می‌دهد. اگر فیلتر ارائه‌دهنده ترجیحی فهرستی خالی تولید کند، configure به‌جای نشان دادن یک انتخاب‌گر خالی، به کاتالوگ فیلترنشده برمی‌گردد.

<Tip>
`openclaw config` بدون زیرفرمان، همان ویزارد را باز می‌کند. برای ویرایش‌های غیرتعاملی از `openclaw config get|set|unset` استفاده کنید.
</Tip>

برای جست‌وجوی وب، `openclaw configure --section web` به شما امکان می‌دهد یک ارائه‌دهنده را انتخاب کنید
و اعتبارنامه‌های آن را پیکربندی کنید. برخی ارائه‌دهندگان همچنین اعلان‌های پیگیری
مخصوص ارائه‌دهنده را نشان می‌دهند:

- **Grok** می‌تواند راه‌اندازی اختیاری `x_search` را با همان `XAI_API_KEY` پیشنهاد دهد و
  به شما اجازه دهد یک مدل `x_search` انتخاب کنید.
- **Kimi** می‌تواند منطقه API مربوط به Moonshot (`api.moonshot.ai` در برابر
  `api.moonshot.cn`) و مدل پیش‌فرض جست‌وجوی وب Kimi را بپرسد.

مرتبط:

- مرجع پیکربندی Gateway: [پیکربندی](/fa/gateway/configuration)
- CLI پیکربندی: [Config](/fa/cli/config)

## گزینه‌ها

- `--section <section>`: فیلتر بخش تکرارپذیر

بخش‌های موجود:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

نکته‌ها:

- انتخاب محل اجرای Gateway همیشه `gateway.mode` را به‌روزرسانی می‌کند. اگر همین تنها چیزی است که نیاز دارید، می‌توانید بدون بخش‌های دیگر "ادامه" را انتخاب کنید.
- پس از نوشتن پیکربندی محلی، configure وابستگی‌های زمان اجرای Plugin همراهی را که تازه لازم شده‌اند مادی‌سازی می‌کند. این یک مرحله محدود تعمیر مدیر بسته است، نه یک اجرای کامل `openclaw doctor`. پیکربندی Gateway راه دور وابستگی‌های Plugin محلی را نصب نمی‌کند.
- سرویس‌های کانال‌محور (Slack/Discord/Matrix/Microsoft Teams) هنگام راه‌اندازی برای فهرست‌های مجاز کانال/اتاق اعلان می‌دهند. می‌توانید نام‌ها یا شناسه‌ها را وارد کنید؛ ویزارد در صورت امکان نام‌ها را به شناسه‌ها تبدیل می‌کند.
- اگر مرحله نصب daemon را اجرا کنید، احراز هویت توکنی به توکن نیاز داشته باشد، و `gateway.auth.token` با SecretRef مدیریت شود، configure مقدار SecretRef را اعتبارسنجی می‌کند اما مقادیر توکن متن ساده حل‌شده را در فراداده محیط سرویس supervisor ذخیره نمی‌کند.
- اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل نشده باشد، configure نصب daemon را با راهنمایی اصلاحی قابل اقدام مسدود می‌کند.
- اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، configure نصب daemon را تا زمانی که mode به‌صراحت تنظیم شود مسدود می‌کند.

## نمونه‌ها

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [پیکربندی](/fa/gateway/configuration)

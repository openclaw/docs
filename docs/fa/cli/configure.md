---
read_when:
    - می‌خواهید اعتبارنامه‌ها، دستگاه‌ها یا پیش‌فرض‌های عامل را به‌صورت تعاملی تنظیم کنید
summary: مرجع CLI برای `openclaw configure` (درخواست‌های پیکربندی تعاملی)
title: پیکربندی
x-i18n:
    generated_at: "2026-04-29T22:33:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

پرامپت تعاملی برای تنظیم اعتبارنامه‌ها، دستگاه‌ها، و پیش‌فرض‌های عامل.

<Note>
بخش **مدل** شامل یک انتخاب چندگانه برای فهرست مجاز `agents.defaults.models` است (آنچه در `/model` و انتخاب‌گر مدل نمایش داده می‌شود). گزینه‌های تنظیم با دامنه ارائه‌دهنده، مدل‌های انتخاب‌شده خود را به فهرست مجاز موجود ادغام می‌کنند، به‌جای اینکه ارائه‌دهندگان نامرتبطی را که از قبل در پیکربندی هستند جایگزین کنند. اجرای دوباره احراز هویت ارائه‌دهنده از داخل configure مقدار موجود `agents.defaults.model.primary` را حفظ می‌کند. زمانی که عمدا می‌خواهید مدل پیش‌فرض را تغییر دهید، از `openclaw models auth login --provider <id> --set-default` یا `openclaw models set <model>` استفاده کنید.
</Note>

وقتی configure از یک گزینه احراز هویت ارائه‌دهنده شروع می‌شود، انتخاب‌گرهای مدل پیش‌فرض و فهرست مجاز به‌طور خودکار همان ارائه‌دهنده را ترجیح می‌دهند. برای ارائه‌دهندگان جفت‌شده مانند Volcengine و BytePlus، همین ترجیح با گونه‌های طرح کدنویسی آن‌ها نیز مطابقت دارد (`volcengine-plan/*`، `byteplus-plan/*`). اگر فیلتر ارائه‌دهنده ترجیحی فهرستی خالی ایجاد کند، configure به‌جای نمایش یک انتخاب‌گر خالی، به کاتالوگ بدون فیلتر برمی‌گردد.

<Tip>
`openclaw config` بدون زیر‌دستور، همان جادوگر را باز می‌کند. برای ویرایش‌های غیرتعاملی از `openclaw config get|set|unset` استفاده کنید.
</Tip>

برای جستجوی وب، `openclaw configure --section web` به شما امکان می‌دهد یک ارائه‌دهنده را انتخاب کنید
و اعتبارنامه‌های آن را پیکربندی کنید. برخی ارائه‌دهندگان همچنین پرامپت‌های پیگیری
ویژه ارائه‌دهنده را نمایش می‌دهند:

- **Grok** می‌تواند تنظیم اختیاری `x_search` را با همان `XAI_API_KEY` پیشنهاد کند و
  به شما اجازه دهد یک مدل `x_search` انتخاب کنید.
- **Kimi** می‌تواند منطقه API Moonshot (`api.moonshot.ai` در برابر
  `api.moonshot.cn`) و مدل پیش‌فرض جستجوی وب Kimi را بپرسد.

مرتبط:

- مرجع پیکربندی Gateway: [پیکربندی](/fa/gateway/configuration)
- CLI پیکربندی: [پیکربندی](/fa/cli/config)

## گزینه‌ها

- `--section <section>`: فیلتر بخش تکرارشونده

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

- انتخاب محل اجرای Gateway همیشه `gateway.mode` را به‌روزرسانی می‌کند. اگر فقط به همین نیاز دارید، می‌توانید بدون بخش‌های دیگر «ادامه» را انتخاب کنید.
- سرویس‌های کانال‌محور (Slack/Discord/Matrix/Microsoft Teams) هنگام راه‌اندازی برای فهرست‌های مجاز کانال/اتاق پرامپت می‌دهند. می‌توانید نام‌ها یا شناسه‌ها را وارد کنید؛ جادوگر در صورت امکان نام‌ها را به شناسه‌ها تبدیل می‌کند.
- اگر مرحله نصب daemon را اجرا کنید، احراز هویت توکنی به توکن نیاز داشته باشد، و `gateway.auth.token` با SecretRef مدیریت شود، configure مقدار SecretRef را اعتبارسنجی می‌کند اما مقادیر متن ساده توکن حل‌شده را در فراداده محیط سرویس supervisor ذخیره نمی‌کند.
- اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل نشده باشد، configure نصب daemon را با راهنمایی اصلاحی قابل اقدام مسدود می‌کند.
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، configure نصب daemon را تا زمانی که حالت به‌صراحت تنظیم شود مسدود می‌کند.

## مثال‌ها

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [پیکربندی](/fa/gateway/configuration)

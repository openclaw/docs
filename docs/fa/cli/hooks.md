---
read_when:
    - می‌خواهید هوک‌های عامل را مدیریت کنید
    - می‌خواهید در دسترس بودن هوک‌ها را بررسی کنید یا هوک‌های فضای کاری را فعال کنید
summary: مرجع CLI برای `openclaw hooks` (قلاب‌های عامل)
title: هوک‌ها
x-i18n:
    generated_at: "2026-07-12T09:44:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

قلاب‌های عامل را مدیریت کنید (خودکارسازی‌های رویدادمحور برای فرمان‌هایی مانند `/new`، `/reset` و راه‌اندازی Gateway). اجرای سادهٔ `openclaw hooks` معادل `openclaw hooks list` است.

مرتبط: [قلاب‌ها](/fa/automation/hooks) - [قلاب‌های Plugin](/fa/plugins/hooks)

## فهرست قلاب‌ها

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

قلاب‌های شناسایی‌شده در فضای کاری و دایرکتوری‌های مدیریت‌شده، اضافی و همراه را فهرست می‌کند.

- `--eligible`: فقط قلاب‌هایی که الزاماتشان برآورده شده است.
- `--json`: خروجی ساختاریافته.
- `-v, --verbose`: افزودن ستون Missing شامل الزامات برآورده‌نشده.

```
قلاب‌ها (۴/۵ آماده)

آماده:
  🚀 boot-md ✓ - اجرای BOOT.md هنگام راه‌اندازی Gateway
  📎 bootstrap-extra-files ✓ - تزریق فایل‌های راه‌اندازی اولیهٔ اضافی فضای کاری هنگام راه‌اندازی اولیهٔ عامل
  📝 command-logger ✓ - ثبت همهٔ رویدادهای فرمان در یک فایل متمرکز ممیزی
  💾 session-memory ✓ - ذخیرهٔ زمینهٔ نشست در حافظه هنگام صدور فرمان /new یا /reset
```

## دریافت اطلاعات قلاب

```bash
openclaw hooks info <name> [--json]
```

`<name>` نام یا کلید قلاب است (برای مثال `session-memory`). منبع، مسیرهای فایل/رسیدگی‌کننده، صفحهٔ اصلی، رویدادها و وضعیت هر الزام (فایل‌های اجرایی، متغیرهای محیطی، پیکربندی و سیستم‌عامل) را نمایش می‌دهد.

## بررسی واجد شرایط بودن

```bash
openclaw hooks check [--json]
```

خلاصه‌ای از تعداد آماده/ناآماده را چاپ می‌کند؛ اگر قلاب‌هایی آماده نباشند، هرکدام را همراه با دلیل مسدودکننده فهرست می‌کند.

## فعال‌کردن یک قلاب

```bash
openclaw hooks enable <name>
```

مقدار `hooks.internal.entries.<name>.enabled = true` را در پیکربندی اضافه یا به‌روزرسانی می‌کند و کلید اصلی `hooks.internal.enabled` را نیز روشن می‌کند (Gateway تا زمانی که دست‌کم یک قلاب پیکربندی نشده باشد، هیچ رسیدگی‌کنندهٔ قلاب داخلی را بارگذاری نمی‌کند). اگر قلاب وجود نداشته باشد، تحت مدیریت Plugin باشد یا واجد شرایط نباشد (الزامات آن برآورده نشده باشد)، فرمان ناموفق خواهد بود.

قلاب‌های تحت مدیریت Plugin در `hooks list` به‌صورت `plugin:<id>` نمایش داده می‌شوند و در اینجا نمی‌توان آن‌ها را فعال یا غیرفعال کرد؛ در عوض، Plugin مالک را فعال یا غیرفعال کنید.

پس از فعال‌کردن، Gateway را راه‌اندازی مجدد کنید (راه‌اندازی مجدد برنامهٔ نوار منوی macOS یا فرایند Gateway در محیط توسعه) تا قلاب‌ها دوباره بارگذاری شوند.

## غیرفعال‌کردن یک قلاب

```bash
openclaw hooks disable <name>
```

مقدار `hooks.internal.entries.<name>.enabled = false` را تنظیم می‌کند. سپس Gateway را راه‌اندازی مجدد کنید.

## نصب و به‌روزرسانی بسته‌های قلاب

```bash
openclaw plugins install <package>        # npm به‌طور پیش‌فرض
openclaw plugins install npm:<package>    # فقط npm
openclaw plugins install <package> --pin  # تثبیت نسخهٔ حل‌شده
openclaw plugins install <path>           # دایرکتوری یا بایگانی محلی
openclaw plugins install -l <path>        # پیوند دادن دایرکتوری محلی به‌جای کپی‌کردن

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

بسته‌های قلاب از طریق نصب‌کننده/به‌روزرسان یکپارچهٔ Pluginها نصب می‌شوند؛ `openclaw hooks install` / `openclaw hooks update` همچنان به‌عنوان نام‌های مستعار منسوخ‌شده کار می‌کنند، هشداری چاپ می‌کنند و درخواست را به فرمان‌های `plugins` هدایت می‌کنند.

- مشخصات Npm فقط می‌توانند از رجیستری باشند: نام بسته به‌همراه یک نسخهٔ دقیق یا برچسب توزیع اختیاری. مشخصات Git/نشانی وب/فایل و بازه‌های semver پذیرفته نمی‌شوند. وابستگی‌ها به‌صورت محلی در پروژه و با `--ignore-scripts` نصب می‌شوند.
- مشخصات ساده و `@latest` در مسیر پایدار باقی می‌مانند؛ اگر npm یک نسخهٔ پیش‌انتشار را برگرداند، OpenClaw متوقف می‌شود و از شما می‌خواهد صریحاً آن را بپذیرید (`@beta`، `@rc` یا یک نسخهٔ دقیق پیش‌انتشار).
- بایگانی‌های پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`.
- گزینهٔ `-l, --link` به‌جای کپی‌کردن، یک دایرکتوری محلی را پیوند می‌دهد (آن را به `hooks.internal.load.extraDirs` اضافه می‌کند)؛ بسته‌های قلاب پیوندشده، قلاب‌های مدیریت‌شده از یک دایرکتوری پیکربندی‌شده توسط گرداننده هستند، نه قلاب‌های فضای کاری.
- گزینهٔ `--pin` نصب‌های npm را به‌صورت `name@version` دقیق و حل‌شده در `hooks.internal.installs` ثبت می‌کند.
- نصب، بسته را در `~/.openclaw/hooks/<id>` کپی می‌کند، قلاب‌های آن را زیر `hooks.internal.entries.*` فعال می‌کند و نصب را زیر `hooks.internal.installs` ثبت می‌کند.
- اگر هش یکپارچگی ذخیره‌شده دیگر با دست‌ساختهٔ دریافت‌شده مطابقت نداشته باشد، OpenClaw پیش از ادامه هشدار می‌دهد و تأیید می‌خواهد؛ برای ردکردن این درخواست، گزینهٔ سراسری `--yes` را ارسال کنید (برای مثال در CI).

## قلاب‌های همراه

| قلاب                  | رویدادها                                          | کاری که انجام می‌دهد                                                                                     |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | برای هر محدودهٔ عامل پیکربندی‌شده، `BOOT.md` را هنگام راه‌اندازی Gateway اجرا می‌کند                    |
| bootstrap-extra-files | `agent:bootstrap`                                 | هنگام راه‌اندازی اولیهٔ عامل، فایل‌های راه‌اندازی اولیهٔ اضافی (برای مثال `AGENTS.md`/`TOOLS.md` در مخزن یکپارچه) را تزریق می‌کند |
| command-logger        | `command`                                         | رویدادهای فرمان را در `~/.openclaw/logs/commands.log` ثبت می‌کند                                        |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | هنگام آغاز و پایان Compaction نشست، اعلان‌های قابل‌مشاهده‌ای در گفتگو ارسال می‌کند                      |
| session-memory        | `command:new`, `command:reset`                    | زمینهٔ نشست را هنگام `/new` یا `/reset` در حافظه ذخیره می‌کند                                           |

هر قلاب همراه را با `openclaw hooks enable <hook-name>` فعال کنید. جزئیات کامل، کلیدهای پیکربندی و مقادیر پیش‌فرض: [قلاب‌های همراه](/fa/automation/hooks#bundled-hooks).

### فایل گزارش command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # فرمان‌های اخیر
cat ~/.openclaw/logs/commands.log | jq .          # چاپ خوانا
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # پالایش بر اساس کنش
```

## نکته‌ها

- فرمان‌های `hooks list --json`، `info --json` و `check --json`، JSON ساختاریافته را مستقیماً در خروجی استاندارد می‌نویسند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [قلاب‌های خودکارسازی](/fa/automation/hooks)

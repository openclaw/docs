---
doc-schema-version: 1
read_when:
    - می‌خواهید نمونه‌های سریع برای فهرست کردن، نصب، به‌روزرسانی، بررسی یا حذف Plugin داشته باشید
    - می‌خواهید منبع نصب Plugin را انتخاب کنید
    - می‌خواهید مرجع درست برای انتشار بسته‌های Plugin را داشته باشید
sidebarTitle: Manage plugins
summary: نمونه‌های سریع برای فهرست‌کردن، نصب، به‌روزرسانی، بررسی و حذف نصب Pluginهای OpenClaw
title: مدیریت Pluginها
x-i18n:
    generated_at: "2026-06-27T18:18:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

از این صفحه برای دستورهای رایج مدیریت Plugin استفاده کنید. برای قرارداد کامل دستور،
فلگ‌ها، قواعد انتخاب منبع، و حالت‌های خاص، به
[`openclaw plugins`](/fa/cli/plugins) مراجعه کنید.

بیشتر گردش‌کارهای نصب چنین هستند:

1. پیدا کردن یک بسته
2. نصب آن از ClawHub، npm، git، یا یک مسیر محلی
3. اجازه دادن به Gateway مدیریت‌شده برای راه‌اندازی مجدد خودکار، یا راه‌اندازی مجدد دستی آن وقتی مدیریت‌نشده است
4. بررسی ثبت‌های runtime مربوط به Plugin

## فهرست‌کردن و جست‌وجوی Plugin‌ها

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

برای اسکریپت‌ها از `--json` استفاده کنید:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` یک بررسی موجودی سرد است. نشان می‌دهد OpenClaw چه چیزهایی را
می‌تواند از config، manifestها، و registry مربوط به Plugin کشف کند؛ اما ثابت
نمی‌کند Gatewayای که همین حالا در حال اجراست runtime مربوط به Plugin را import
کرده است. خروجی JSON شامل diagnostics مربوط به registry و `dependencyStatus`
ایستای هر Plugin است، وقتی بسته Plugin، `dependencies` یا `optionalDependencies`
را اعلام کرده باشد.

`plugins search` از ClawHub برای بسته‌های Plugin قابل نصب پرس‌وجو می‌کند و
راهنماهای نصب مانند `openclaw plugins install clawhub:<package>` را چاپ می‌کند.

## نصب Plugin‌ها

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

مشخصات بسته بدون پیشوند در زمان گذار راه‌اندازی از npm نصب می‌شوند. وقتی به
انتخاب منبع قطعی نیاز دارید از `clawhub:`، `npm:`، `git:`، یا `npm-pack:`
استفاده کنید. اگر نام بدون پیشوند با شناسه یک Plugin رسمی مطابقت داشته باشد،
OpenClaw می‌تواند ورودی catalog را مستقیم نصب کند.

از `--force` فقط وقتی استفاده کنید که عمدا می‌خواهید هدف نصب موجود را بازنویسی
کنید. برای ارتقاهای معمول نصب‌های ردیابی‌شده npm، ClawHub، یا hook-pack، از
`openclaw plugins update` استفاده کنید.

## راه‌اندازی مجدد و بررسی

پس از نصب، به‌روزرسانی، یا حذف کد Plugin، یک Gateway مدیریت‌شده در حال اجرا که
بارگذاری مجدد config در آن فعال است به‌طور خودکار راه‌اندازی مجدد می‌شود. اگر
Gateway مدیریت‌شده نیست یا بارگذاری مجدد غیرفعال است، پیش از بررسی سطح‌های
runtime زنده، خودتان آن را راه‌اندازی مجدد کنید:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

وقتی به اثبات نیاز دارید که Plugin سطح‌های runtime مانند ابزارها، hookها،
serviceها، متدهای Gateway، مسیرهای HTTP، یا دستورهای CLI متعلق به Plugin را
ثبت کرده است، از `inspect --runtime` استفاده کنید. `inspect` و `list` ساده،
بررسی‌های سرد manifest، config، و registry هستند.

## به‌روزرسانی Plugin‌ها

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

وقتی یک شناسه Plugin را می‌دهید، OpenClaw از مشخصات نصب ردیابی‌شده دوباره
استفاده می‌کند. dist-tagهای ذخیره‌شده مانند `@beta` و نسخه‌های دقیق pin شده
در اجرای بعدی `update <plugin-id>` همچنان استفاده می‌شوند.

`openclaw plugins update --all` مسیر نگهداری دسته‌جمعی است. همچنان به مشخصات
نصب ردیابی‌شده معمول احترام می‌گذارد، اما رکوردهای رسمی و مورد اعتماد Plugin
در OpenClaw می‌توانند به‌جای ماندن روی یک بسته رسمی دقیق اما قدیمی، با هدف
catalog رسمی فعلی همگام شوند. اگر `update.channel` روی `beta` تنظیم شده باشد،
این همگام‌سازی رسمی دسته‌جمعی از زمینه کانال beta استفاده می‌کند. وقتی عمدا
می‌خواهید یک مشخصات رسمی دقیق یا برچسب‌خورده دست‌نخورده بماند، از
`update <plugin-id>` هدفمند استفاده کنید.

برای نصب‌های npm، می‌توانید یک مشخصات بسته صریح بدهید تا رکورد ردیابی‌شده را
تغییر دهید:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

دستور دوم وقتی Plugin قبلا به یک نسخه دقیق یا tag پین شده بوده، آن را به خط
انتشار پیش‌فرض registry برمی‌گرداند.

وقتی `openclaw update` روی کانال beta اجرا می‌شود، رکوردهای Plugin می‌توانند
انتشارهای مطابق `@beta` را ترجیح دهند. برای fallback دقیق و قواعد pinning، به
[`openclaw plugins`](/fa/cli/plugins#update) مراجعه کنید.

## حذف نصب Plugin‌ها

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

حذف نصب، ورودی config مربوط به Plugin، رکورد پایدارشده index مربوط به Plugin،
ورودی‌های فهرست allow/deny، و مسیرهای load لینک‌شده را در صورت کاربرد حذف
می‌کند. دایرکتوری‌های نصب مدیریت‌شده حذف می‌شوند مگر اینکه `--keep-files` را
بدهید. وقتی حذف نصب منبع Plugin را تغییر دهد، یک Gateway مدیریت‌شده در حال اجرا
به‌طور خودکار راه‌اندازی مجدد می‌شود.

در حالت Nix (`OPENCLAW_NIX_MODE=1`)، دستورهای نصب، به‌روزرسانی، حذف نصب، فعال
کردن، و غیرفعال کردن Plugin غیرفعال هستند. به‌جای آن، این انتخاب‌ها را در منبع
Nix مربوط به نصب مدیریت کنید.

## انتخاب منبع

| منبع        | زمان استفاده                                                                 | مثال                                                           |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | کشف بومی OpenClaw، خلاصه‌های scan، نسخه‌ها، و راهنماها را می‌خواهید        | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | از قبل بسته‌های JavaScript منتشر می‌کنید یا به dist-tagهای npm/registry خصوصی نیاز دارید | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | یک branch، tag، یا commit از یک repository می‌خواهید                        | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| مسیر محلی   | در حال توسعه یا آزمایش یک Plugin روی همان ماشین هستید                      | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | در حال اثبات یک artifact بسته محلی از طریق semantics نصب npm هستید         | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | در حال نصب یک Plugin بازارچه سازگار با Claude هستید                        | `openclaw plugins install <plugin> --marketplace <source>`     |

نصب‌های مسیر محلی مدیریت‌شده باید دایرکتوری یا archiveهای Plugin باشند. فایل‌های
مستقل Plugin را به‌جای نصب با `plugins install` در `plugins.load.paths` قرار
دهید.

## انتشار Plugin‌ها

ClawHub سطح اصلی کشف عمومی برای Plugin‌های OpenClaw است. وقتی می‌خواهید کاربران
پیش از نصب، metadata مربوط به Plugin، تاریخچه نسخه‌ها، نتایج scan مربوط به
registry، و راهنماهای نصب را پیدا کنند، آنجا منتشر کنید.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Plugin‌های بومی npm باید پیش از انتشار، یک manifest مربوط به Plugin و metadata
بسته داشته باشند:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

برای قرارداد کامل انتشار، به‌جای اینکه این صفحه را مرجع انتشار بدانید، از این
صفحه‌ها استفاده کنید:

- [انتشار در ClawHub](/fa/clawhub/publishing) مالکان، scopeها، انتشارها،
  review، اعتبارسنجی بسته، و انتقال بسته را توضیح می‌دهد.
- [ساخت Plugin‌ها](/fa/plugins/building-plugins) شکل بسته Plugin و گردش‌کار اولین
  انتشار را نشان می‌دهد.
- [Manifest مربوط به Plugin](/fa/plugins/manifest) فیلدهای manifest بومی Plugin را
  تعریف می‌کند.

اگر یک بسته هم در ClawHub و هم در npm در دسترس است، وقتی نیاز دارید یک منبع را
اجبار کنید از پیشوند صریح `clawhub:` یا `npm:` استفاده کنید.

## مرتبط

- [Plugin‌ها](/fa/tools/plugin) - نصب، پیکربندی، راه‌اندازی مجدد، و عیب‌یابی
- [`openclaw plugins`](/fa/cli/plugins) - مرجع کامل CLI
- [Plugin‌های جامعه](/fa/plugins/community) - کشف عمومی و انتشار در ClawHub
- [ClawHub](/fa/clawhub/cli) - عملیات CLI مربوط به registry
- [ساخت Plugin‌ها](/fa/plugins/building-plugins) - ایجاد یک بسته Plugin
- [Manifest مربوط به Plugin](/fa/plugins/manifest) - manifest و metadata بسته

---
doc-schema-version: 1
read_when:
    - می‌خواهید Pluginها را در رابط کاربری کنترل مرور، نصب، فعال یا غیرفعال کنید
    - نمونه‌های سریعی برای فهرست‌کردن، نصب، به‌روزرسانی، بررسی یا حذف Plugin می‌خواهید
    - می‌خواهید یک منبع نصب Plugin انتخاب کنید
    - شما به مرجع مناسبی برای انتشار بسته‌های Plugin نیاز دارید
sidebarTitle: Manage plugins
summary: Pluginهای OpenClaw را از طریق رابط کاربری کنترل یا CLI مدیریت کنید
title: مدیریت Pluginها
x-i18n:
    generated_at: "2026-07-12T10:27:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

رابط کنترل گردش‌کار رایج کشف، نصب، فعال‌سازی و غیرفعال‌سازی را پوشش می‌دهد. CLI امکانات به‌روزرسانی، حذف نصب، پیکربندی پیشرفته و کنترل صریح منبع نصب را اضافه می‌کند. برای قرارداد کامل فرمان، پرچم‌ها، قواعد انتخاب منبع و موارد مرزی آن، به [`openclaw plugins`](/fa/cli/plugins) مراجعه کنید.

گردش‌کار معمول CLI: یک بسته پیدا کنید، آن را از ClawHub، npm، git یا یک مسیر محلی نصب کنید، اجازه دهید Gateway مدیریت‌شده به‌طور خودکار راه‌اندازی مجدد شود (یا آن را به‌صورت دستی راه‌اندازی مجدد کنید)، سپس ثبت‌های زمان اجرای Plugin را تأیید کنید.

## استفاده از رابط کنترل

در رابط کنترل، **Pluginها** را باز کنید، یا از `/settings/plugins` نسبت به مسیر پایه پیکربندی‌شده رابط کنترل استفاده کنید. برای مثال، مسیر پایه `/openclaw` از `/openclaw/settings/plugins` استفاده می‌کند. این صفحه دو زبانه دارد:

- **نصب‌شده** فهرست کامل محلی را به تفکیک دسته (کانال‌ها، ارائه‌دهندگان مدل، حافظه، ابزارها) نمایش می‌دهد. هر ردیف نمای جزئیات را باز می‌کند؛ منوی سرریز (`…`) آن Plugin را فعال یا غیرفعال می‌کند و برای Pluginهای نصب‌شده از منابع خارجی، گزینه **حذف** را ارائه می‌دهد. این زبانه همچنین [سرورهای MCP](/fa/cli/mcp) پیکربندی‌شده را با همان عملیات منومحور فعال‌سازی، غیرفعال‌سازی و حذف فهرست می‌کند و `mcp.servers` را در پیکربندی Gateway ویرایش می‌کند.
- **کشف** فروشگاه است: Pluginهای شاخص همراه OpenClaw، Pluginهای رسمی خارجی و قفسه‌ای منتخب از اتصال‌دهنده‌ها. کارت‌های اتصال‌دهنده یا با یک کلیک یک سرور MCP میزبانی‌شده اضافه می‌کنند (GitHub، Notion، Linear، Sentry، Home Assistant)، یا به جست‌وجوی ازپیش‌تکمیل‌شده ClawHub می‌روند. تایپ در کادر جست‌وجو، [ClawHub](https://clawhub.ai/plugins) را به‌صورت درون‌خطی جست‌وجو می‌کند و بخشی با عنوان **از ClawHub** شامل شمار دانلودها و نشان‌های تأیید منبع می‌افزاید.

Pluginهای همراه به نصب بسته نیاز ندارند. عملیات منوی آن‌ها **فعال‌سازی** یا **غیرفعال‌سازی** است. برای مثال، Workboard همراه OpenClaw ارائه می‌شود و به‌طور پیش‌فرض غیرفعال است؛ بنابراین برای روشن‌کردن آن، **فعال‌سازی** را انتخاب کنید. Pluginهای بسته‌بندی‌شده قابل حذف نیستند و فقط می‌توان آن‌ها را غیرفعال کرد.

دسترسی به کاتالوگ و جست‌وجو به `operator.read` نیاز دارد. نصب، فعال‌سازی، غیرفعال‌سازی، حذف و تغییرات سرور MCP به `operator.admin` نیاز دارند. نصب از ClawHub توسط Gateway انجام می‌شود و بررسی‌های سیاست اعتماد، یکپارچگی و نصب Plugin را حفظ می‌کند.

نصب یا حذف کد Plugin به راه‌اندازی مجدد Gateway نیاز دارد. وقتی Plugin نصب‌شده و زمان اجرای فعلی Gateway از آن پشتیبانی کنند، تغییرات فعال‌سازی را می‌توان بدون راه‌اندازی مجدد اعمال کرد؛ در غیر این صورت، رابط کاربری به شما اطلاع می‌دهد که راه‌اندازی مجدد لازم است. اتصال‌دهنده‌های MCP مبتنی بر OAuth پس از اضافه‌شدن همچنان به اجرای یک‌باره `openclaw mcp login <name>` از CLI نیاز دارند.

رابط کنترل از منابع دلخواه npm، git یا مسیر محلی نصب نمی‌کند، Pluginها را به‌روزرسانی نمی‌کند و پیکربندی پیشرفته Plugin را در دسترس قرار نمی‌دهد. برای این عملیات از گردش‌کارهای CLI زیر استفاده کنید.

## فهرست‌کردن و جست‌وجوی Pluginها

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` برای اسکریپت‌ها:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` یک بررسی سرد فهرست موجودی است: آنچه OpenClaw می‌تواند از پیکربندی، مانیفست‌ها و رجیستری ماندگار Plugin کشف کند. این فرمان ثابت نمی‌کند که یک Gateway ازپیش‌درحال‌اجرا، زمان اجرای Plugin را وارد کرده است. خروجی JSON شامل اطلاعات تشخیصی رجیستری و `dependencyStatus` هر Plugin است (اینکه آیا `dependencies`/`optionalDependencies` اعلام‌شده روی دیسک قابل تفکیک هستند یا نه).

`plugins search` برای بسته‌های Plugin قابل نصب در ClawHub جست‌وجو می‌کند و برای هر نتیجه یک راهنمای نصب (`openclaw plugins install clawhub:<package>`) نمایش می‌دهد.

## فعال‌سازی و غیرفعال‌سازی Pluginها

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

ورودی پیکربندی یک Plugin را بدون دست‌زدن به فایل‌های نصب‌شده تغییر می‌دهد. برخی Pluginهای بسته‌بندی‌شده (ارائه‌دهندگان بسته‌بندی‌شده مدل/گفتار و Plugin بسته‌بندی‌شده مرورگر) به‌طور پیش‌فرض فعال هستند؛ سایرین پس از نصب به `enable` نیاز دارند.

## نصب Pluginها

```bash
# بسته‌های Plugin را در ClawHub جست‌وجو کنید.
openclaw plugins search "calendar"

# از ClawHub نصب کنید.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# از npm نصب کنید.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# از یک مصنوع محلی npm-pack نصب کنید.
openclaw plugins install npm-pack:<path.tgz>

# از git یا یک نسخه کاری محلی توسعه نصب کنید.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

مشخصات بسته بدون پیشوند در هنگام گذار راه‌اندازی از npm نصب می‌شوند، مگر اینکه نام با شناسه یک Plugin بسته‌بندی‌شده یا رسمی مطابقت داشته باشد؛ در آن صورت OpenClaw به‌جای آن از نسخه محلی/رسمی استفاده می‌کند. برای انتخاب قطعی منبع از `clawhub:`، `npm:`، `git:` یا `npm-pack:` استفاده کنید.

از `--force` فقط برای بازنویسی یک مقصد نصب موجود از منبعی متفاوت استفاده کنید. برای ارتقاهای معمول یک نصب رهگیری‌شده npm، ClawHub یا hook-pack، به‌جای آن از `openclaw plugins update` استفاده کنید؛ `--force` همراه `--link` پشتیبانی نمی‌شود.

## راه‌اندازی مجدد و بازرسی

یک Gateway مدیریت‌شده در حال اجرا که بارگذاری مجدد پیکربندی در آن فعال است، پس از نصب، به‌روزرسانی یا حذف نصب کد Plugin به‌طور خودکار راه‌اندازی مجدد می‌شود. اگر Gateway مدیریت‌نشده است یا بارگذاری مجدد غیرفعال است، پیش از بررسی سطوح زنده زمان اجرا، خودتان آن را راه‌اندازی مجدد کنید:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` ماژول Plugin را بارگذاری می‌کند و ثابت می‌کند که سطوح زمان اجرا (ابزارها، هوک‌ها، سرویس‌ها، متدهای Gateway، مسیرهای HTTP و فرمان‌های CLI متعلق به Plugin) را ثبت کرده است. `inspect` ساده و `list` فقط بررسی‌های سرد مانیفست/پیکربندی/رجیستری هستند.

## به‌روزرسانی Pluginها

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

ارسال شناسه Plugin، مشخصات نصب رهگیری‌شده آن را دوباره استفاده می‌کند: برچسب‌های توزیع ذخیره‌شده (`@beta`) و نسخه‌های دقیق سنجاق‌شده به اجرای بعدی `update <plugin-id>` منتقل می‌شوند.

`openclaw plugins update --all` مسیر نگه‌داری انبوه است. این فرمان همچنان مشخصات عادی نصب رهگیری‌شده را رعایت می‌کند، اما رکوردهای قابل اعتماد Pluginهای رسمی OpenClaw به‌جای باقی‌ماندن روی یک بسته رسمی دقیق و قدیمی، با مقصد فعلی کاتالوگ رسمی همگام می‌شوند؛ وقتی `update.channel` برابر `beta` باشد، این همگام‌سازی خط انتشار بتا را ترجیح می‌دهد. برای دست‌نخورده نگه‌داشتن مشخصات دقیق یا برچسب‌خورده رسمی، از `update <plugin-id>` هدفمند استفاده کنید.

برای نصب‌های npm، جهت تغییر رکورد رهگیری‌شده یک مشخصات صریح بسته ارسال کنید:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

فرمان دوم، وقتی Plugin پیش‌تر به یک نسخه یا برچسب دقیق سنجاق شده باشد، آن را به خط انتشار پیش‌فرض رجیستری بازمی‌گرداند.

برای قواعد دقیق بازگشت و سنجاق‌کردن، به [`openclaw plugins`](/fa/cli/plugins#update) مراجعه کنید.

## حذف نصب Pluginها

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

حذف نصب، ورودی پیکربندی Plugin، رکورد ماندگار فهرست Plugin، ورودی‌های فهرست مجاز/غیرمجاز و در صورت کاربرد، ورودی‌های پیوندشده `plugins.load.paths` را حذف می‌کند. دایرکتوری نصب مدیریت‌شده حذف می‌شود، مگر اینکه `--keep-files` را ارسال کنید. وقتی حذف نصب منبع Plugin را تغییر دهد، Gateway مدیریت‌شده در حال اجرا به‌طور خودکار راه‌اندازی مجدد می‌شود.

در حالت Nix (`OPENCLAW_NIX_MODE=1`)، نصب، به‌روزرسانی، حذف نصب، فعال‌سازی و غیرفعال‌سازی Plugin همگی غیرفعال هستند؛ این انتخاب‌ها را در منبع Nix مربوط به نصب مدیریت کنید.

## انتخاب منبع

| منبع       | زمانی استفاده کنید که                                                      | نمونه                                                          |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | کشف بومی OpenClaw، خلاصه اسکن‌ها، نسخه‌ها و راهنماها را می‌خواهید           | `openclaw plugins install clawhub:<package>`                   |
| git         | یک شاخه، برچسب یا کامیت از یک مخزن می‌خواهید                                | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| مسیر محلی   | در حال توسعه یا آزمایش یک Plugin روی همان دستگاه هستید                     | `openclaw plugins install --link ./my-plugin`                  |
| بازارگاه    | در حال نصب یک Plugin بازارگاه سازگار با Claude هستید                        | `openclaw plugins install <plugin> --marketplace <source>`     |
| بسته npm    | در حال اثبات یک مصنوع بسته محلی از طریق معناشناسی نصب npm هستید            | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | از قبل بسته‌های JavaScript منتشر می‌کنید یا به برچسب‌های توزیع npm/رجیستری خصوصی نیاز دارید | `openclaw plugins install npm:@acme/openclaw-plugin`           |

نصب‌های مدیریت‌شده از مسیر محلی باید دایرکتوری یا بایگانی Plugin باشند. فایل‌های مستقل Plugin را به‌جای نصب با `plugins install` در `plugins.load.paths` قرار دهید.

## انتشار Pluginها

ClawHub سطح اصلی کشف عمومی برای Pluginهای OpenClaw است. وقتی می‌خواهید کاربران پیش از نصب، فراداده Plugin، تاریخچه نسخه‌ها، نتایج اسکن رجیستری و راهنماهای نصب را پیدا کنند، آنجا منتشر کنید.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Pluginهای بومی npm باید پیش از انتشار، یک مانیفست Plugin (`openclaw.plugin.json`) به‌همراه فراداده `package.json` ارائه کنند:

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

به‌جای درنظرگرفتن این صفحه به‌عنوان مرجع انتشار، برای قرارداد کامل انتشار از صفحات زیر استفاده کنید:

- [انتشار در ClawHub](/fa/clawhub/publishing) مالکان، حوزه‌ها، انتشارها، بازبینی، اعتبارسنجی بسته و انتقال بسته را توضیح می‌دهد.
- [ساخت Pluginها](/fa/plugins/building-plugins) ساختار کامل بسته Plugin (از جمله `openclaw.plugin.json`) و گردش‌کار نخستین انتشار را نشان می‌دهد.
- [مانیفست Plugin](/fa/plugins/manifest) فیلدهای مانیفست بومی Plugin را تعریف می‌کند.

اگر همان بسته هم در ClawHub و هم در npm موجود است، برای اجبار به استفاده از یک منبع، از پیشوند صریح `clawhub:` یا `npm:` استفاده کنید.

## مرتبط

- [Pluginها](/fa/tools/plugin) - نصب، پیکربندی، راه‌اندازی مجدد و عیب‌یابی
- [`openclaw plugins`](/fa/cli/plugins) - مرجع کامل CLI
- [Pluginهای جامعه](/fa/plugins/community) - کشف عمومی و انتشار در ClawHub
- [ClawHub](/fa/clawhub/cli) - عملیات CLI رجیستری
- [ساخت Pluginها](/fa/plugins/building-plugins) - ایجاد یک بسته Plugin
- [مانیفست Plugin](/fa/plugins/manifest) - مانیفست و فراداده بسته

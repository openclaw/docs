---
doc-schema-version: 1
read_when:
    - می‌خواهید Pluginها را در رابط کاربری کنترل مرور، نصب، فعال یا غیرفعال کنید
    - نمونه‌های سریعی برای فهرست‌کردن، نصب، به‌روزرسانی، بررسی یا حذف Plugin می‌خواهید
    - می‌خواهید منبع نصب Plugin را انتخاب کنید
    - مرجع مناسب برای انتشار بسته‌های Plugin را می‌خواهید
sidebarTitle: Manage plugins
summary: Pluginهای OpenClaw را از طریق رابط کاربری کنترل یا CLI مدیریت کنید
title: مدیریت Pluginها
x-i18n:
    generated_at: "2026-07-16T16:47:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2e22483a7bfb6da4f1eafef036ebc1e2151a725e21565e0634c615ff2f168c1d
    source_path: plugins/manage-plugins.md
    workflow: 16
---

رابط کاربری کنترل، گردش‌کار رایجِ کشف، نصب، فعال‌سازی و غیرفعال‌سازی را
پوشش می‌دهد. CLI امکانات به‌روزرسانی، حذف نصب، پیکربندی پیشرفته و کنترل‌های
صریح منبع نصب را اضافه می‌کند. برای قرارداد کامل فرمان، پرچم‌ها، قواعد انتخاب
منبع و حالت‌های مرزی آن، به [`openclaw plugins`](/fa/cli/plugins) مراجعه کنید.

گردش‌کار معمول CLI: یک بسته را پیدا کنید، آن را از ClawHub، npm، git یا یک
مسیر محلی نصب کنید، اجازه دهید Gateway مدیریت‌شده به‌طور خودکار راه‌اندازی مجدد
شود (یا آن را دستی راه‌اندازی مجدد کنید)، سپس ثبت‌های زمان اجرای Plugin را
بررسی کنید.

## استفاده از رابط کاربری کنترل

در رابط کاربری کنترل، **Pluginها** را باز کنید، یا از `/settings/plugins` نسبت به
مسیر پایه پیکربندی‌شده رابط کاربری کنترل استفاده کنید. برای نمونه، مسیر پایه
`/openclaw` از `/openclaw/settings/plugins` استفاده می‌کند. این صفحه دو زبانه دارد:

- **نصب‌شده** موجودی کامل محلی را به تفکیک دسته (کانال‌ها،
  ارائه‌دهندگان مدل، حافظه، ابزارها) نشان می‌دهد. هر ردیف نمای جزئیات را باز
  می‌کند؛ منوی سرریز (`…`) آن Plugin را فعال یا غیرفعال می‌کند و
  برای Pluginهای نصب‌شده از خارج، گزینه **حذف** را ارائه می‌دهد. این زبانه
  [سرورهای MCP](/fa/cli/mcp) پیکربندی‌شده را نیز با همان کنش‌های فعال‌سازی،
  غیرفعال‌سازی و حذفِ مبتنی بر منو فهرست می‌کند و `mcp.servers` را در
  پیکربندی Gateway ویرایش می‌کند.
- **کشف** فروشگاه است: Pluginهای منتخب همراه OpenClaw،
  Pluginهای رسمی خارجی و قفسه‌ای گزینش‌شده از اتصال‌دهنده‌ها. کارت‌های
  اتصال‌دهنده یا با یک کلیک یک سرور MCP میزبانی‌شده اضافه می‌کنند (GitHub،
  Notion، Linear، Sentry، Home Assistant) یا به جست‌وجوی ازپیش‌پُرشده ClawHub
  می‌روند. تایپ در کادر جست‌وجو، [ClawHub](https://clawhub.ai/plugins) را به‌صورت
  درون‌خطی جست‌وجو می‌کند و بخشی با عنوان **از ClawHub** شامل تعداد بارگیری‌ها
  و نشان‌های تأیید منبع می‌افزاید.

Pluginهای همراه نیازی به نصب بسته ندارند. کنش منوی آن‌ها **فعال‌سازی** یا
**غیرفعال‌سازی** است. برای نمونه، Workboard همراه OpenClaw است و به‌طور پیش‌فرض
غیرفعال است؛ بنابراین برای روشن‌کردن آن **فعال‌سازی** را انتخاب کنید. Pluginهای
همراه را نمی‌توان حذف کرد و فقط می‌توان غیرفعالشان کرد.

دسترسی به کاتالوگ و جست‌وجو به `operator.read` نیاز دارد. نصب، فعال‌سازی،
غیرفعال‌سازی، حذف و تغییرات سرور MCP به `operator.admin` نیاز دارند. نصب از
ClawHub به‌وسیله Gateway انجام می‌شود و بررسی‌های سیاست اعتماد، یکپارچگی و نصب
Plugin را حفظ می‌کند. فعال‌کردن یک Plugin نصب‌شده به‌عنوان مدیر، با افزودن
Plugin انتخاب‌شده به فهرست محدودکننده موجودِ `plugins.allow`، آن اعتماد صریح
را نیز ثبت می‌کند. ورودی صریح `plugins.deny` همچنان مرجع نهایی است و باید
پیش از فعال‌کردن Plugin حذف شود.

نصب یا حذف کد Plugin به راه‌اندازی مجدد Gateway نیاز دارد. اگر Plugin نصب‌شده
و زمان اجرای فعلی Gateway از آن پشتیبانی کنند، تغییرات فعال‌سازی را می‌توان
بدون راه‌اندازی مجدد اعمال کرد؛ در غیر این صورت رابط کاربری اعلام می‌کند که
راه‌اندازی مجدد لازم است. اتصال‌دهنده‌های MCP مبتنی بر OAuth پس از افزوده‌شدن
همچنان به یک‌بار اجرای `openclaw mcp login <name>` از CLI نیاز دارند.

رابط کاربری کنترل از منابع دلخواه npm، git یا مسیر محلی نصب نمی‌کند، Pluginها
را به‌روزرسانی نمی‌کند و پیکربندی غنی Plugin را در دسترس قرار نمی‌دهد. برای این
عملیات از گردش‌کارهای CLI زیر استفاده کنید.

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

`plugins list` یک بررسی سرد موجودی است: آنچه OpenClaw می‌تواند از
پیکربندی، مانیفست‌ها و رجیستری پایدار Plugin کشف کند. این بررسی ثابت نمی‌کند
که یک Gateway ازپیش‌درحال‌اجرا، زمان اجرای Plugin را وارد کرده است. خروجی JSON
شامل عیب‌یابی رجیستری و `dependencyStatus` هر Plugin است (اینکه
`dependencies`/`optionalDependencies` اعلام‌شده روی دیسک قابل حل هستند یا نه).

`plugins search` برای بسته‌های Plugin قابل نصب در ClawHub پرس‌وجو می‌کند و
برای هر نتیجه یک راهنمای نصب (`openclaw plugins install clawhub:<package>`) چاپ می‌کند.

## فعال و غیرفعال‌کردن Pluginها

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

ورودی پیکربندی یک Plugin را بدون دست‌زدن به فایل‌های نصب‌شده تغییر می‌دهد.
برخی Pluginهای همراه (ارائه‌دهندگان همراه مدل/گفتار و Plugin همراه مرورگر)
به‌طور پیش‌فرض فعال هستند؛ سایرین پس از نصب به `enable` نیاز دارند.

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

# از git یا یک وارسی محلی توسعه نصب کنید.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

مشخصات بسته بدون پیشوند، هنگام گذار راه‌اندازی از npm نصب می‌شوند، مگر اینکه
نام با شناسه یک Plugin همراه یا رسمی مطابقت داشته باشد که در آن صورت OpenClaw
به‌جای آن از نسخه محلی/رسمی استفاده می‌کند. برای انتخاب قطعی منبع، از
`clawhub:`، `npm:`، `git:` یا
`npm-pack:` استفاده کنید. بسته‌های کاتالوگ همراه و رسمی OpenClaw در کنار
بسته‌های ClawHub مورد اعتماد هستند. منابع دلخواه جدید npm، git، مسیر/بایگانی
محلی، `npm-pack:` یا بازارگاه، پس از بررسی و اعتماد به منبع، در نصب‌های
غیرتعاملی به `--force` نیاز دارند.

`--force` یک منبع غیر ClawHub را بدون درخواست تأیید می‌کند و در صورت
نیاز مقصد نصب موجود را بازنویسی می‌کند. برای ارتقاهای معمول یک نصب ردیابی‌شده
npm، ClawHub یا hook-pack، به‌جای آن از `openclaw plugins update` استفاده کنید. با
`--link`، گزینه `--force` فقط منبع را تأیید می‌کند؛ پوشه
پیوندشده کپی یا بازنویسی نمی‌شود.

## راه‌اندازی مجدد و بازرسی

یک Gateway مدیریت‌شده درحال‌اجرا که بارگذاری مجدد پیکربندی در آن فعال است، پس
از نصب، به‌روزرسانی یا حذف نصب کد Plugin به‌طور خودکار راه‌اندازی مجدد می‌شود.
اگر Gateway مدیریت‌نشده است یا بارگذاری مجدد غیرفعال است، پیش از بررسی سطوح
زنده زمان اجرا آن را خودتان راه‌اندازی مجدد کنید:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` ماژول Plugin را بارگذاری می‌کند و ثابت می‌کند که سطوح زمان
اجرا (ابزارها، هوک‌ها، سرویس‌ها، متدهای Gateway، مسیرهای HTTP و فرمان‌های CLI
متعلق به Plugin) را ثبت کرده است. `inspect` ساده و
`list` فقط بررسی‌های سرد مانیفست/پیکربندی/رجیستری هستند.

## به‌روزرسانی Pluginها

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

ارسال شناسه Plugin از مشخصات نصب ردیابی‌شده آن دوباره استفاده می‌کند:
dist-tagهای ذخیره‌شده (`@beta`) و نسخه‌های دقیق سنجاق‌شده به اجراهای
بعدی `update <plugin-id>` منتقل می‌شوند.

`openclaw plugins update --all` مسیر نگه‌داری انبوه است. این مسیر همچنان به مشخصات معمول
نصب ردیابی‌شده احترام می‌گذارد، اما رکوردهای مورد اعتماد Plugin رسمی OpenClaw
به‌جای سنجاق‌ماندن به یک بسته رسمی دقیق و منسوخ، با مقصد فعلی کاتالوگ رسمی
همگام می‌شوند؛ وقتی `update.channel` برابر با `beta` باشد، این
همگام‌سازی خط انتشار بتا را ترجیح می‌دهد. برای دست‌نخورده نگه‌داشتن مشخصات دقیق
یا برچسب‌خورده رسمی، از `update <plugin-id>` هدفمند استفاده کنید.

برای نصب‌های npm، جهت تغییر رکورد ردیابی‌شده یک مشخصات صریح بسته ارسال کنید:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

فرمان دوم، Pluginی را که پیش‌تر به یک نسخه یا برچسب دقیق سنجاق شده بود، به خط
انتشار پیش‌فرض رجیستری بازمی‌گرداند.

برای قواعد دقیق جایگزینی و سنجاق‌کردن، به
[`openclaw plugins`](/fa/cli/plugins#update) مراجعه کنید.

## حذف نصب Pluginها

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

حذف نصب، ورودی پیکربندی Plugin، رکورد پایدار نمایه Plugin، ورودی‌های فهرست
مجاز/ممنوع و در صورت کاربرد، ورودی‌های پیوندشده `plugins.load.paths` را حذف
می‌کند. پوشه نصب مدیریت‌شده حذف می‌شود، مگر اینکه `--keep-files` را ارسال
کنید. وقتی حذف نصب منبع Plugin را تغییر دهد، Gateway مدیریت‌شده درحال‌اجرا
به‌طور خودکار راه‌اندازی مجدد می‌شود.

در حالت Nix (`OPENCLAW_NIX_MODE=1`) نصب، به‌روزرسانی، حذف نصب، فعال‌سازی و
غیرفعال‌سازی Plugin همگی غیرفعال هستند؛ این انتخاب‌ها را در منبع Nix مربوط به
نصب مدیریت کنید.

## انتخاب منبع

| منبع       | زمان استفاده                                                                 | نمونه                                                          |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | وقتی کشف بومی OpenClaw، خلاصه‌های اسکن، نسخه‌ها و راهنماها را می‌خواهید     | `openclaw plugins install clawhub:<package>`                   |
| git         | وقتی یک شاخه، برچسب یا کامیت از یک مخزن را می‌خواهید                        | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| مسیر محلی   | وقتی Pluginی را روی همان دستگاه توسعه یا آزمایش می‌کنید                     | `openclaw plugins install --link ./my-plugin`                  |
| بازارگاه    | وقتی یک Plugin بازارگاه سازگار با Claude را نصب می‌کنید                     | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | وقتی یک مصنوع بسته محلی را با معناشناسی نصب npm اثبات می‌کنید               | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | وقتی از قبل بسته‌های JavaScript منتشر می‌کنید یا به dist-tagهای npm/رجیستری خصوصی نیاز دارید | `openclaw plugins install npm:@acme/openclaw-plugin`           |

نصب‌های مدیریت‌شده مسیر محلی باید پوشه یا بایگانی Plugin باشند. فایل‌های
مستقل Plugin را به‌جای نصب با `plugins install`، در `plugins.load.paths`
قرار دهید.

## انتشار Pluginها

ClawHub سطح اصلی کشف عمومی برای Pluginهای OpenClaw است. وقتی می‌خواهید کاربران
پیش از نصب، فراداده Plugin، تاریخچه نسخه، نتایج اسکن رجیستری و راهنماهای نصب را
پیدا کنند، آنجا منتشر کنید.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Pluginهای بومی npm باید پیش از انتشار، یک مانیفست Plugin
(`openclaw.plugin.json`) به‌همراه فراداده `package.json` ارائه کنند:

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

برای قرارداد کامل انتشار از این صفحه‌ها استفاده کنید و این صفحه را مرجع
انتشار در نظر نگیرید:

- [انتشار در ClawHub](/fa/clawhub/publishing) مالکان، دامنه‌ها،
  انتشارها، بازبینی، اعتبارسنجی بسته و انتقال بسته را توضیح می‌دهد.
- [ساخت Pluginها](/fa/plugins/building-plugins) شکل کامل بسته
  Plugin (از جمله `openclaw.plugin.json`) و گردش‌کار نخستین انتشار را نشان می‌دهد.
- [مانیفست Plugin](/fa/plugins/manifest) فیلدهای مانیفست بومی
  Plugin را تعریف می‌کند.

اگر یک بسته در هر دو ClawHub و npm موجود است، برای اجبار یک منبع از پیشوند
صریح `clawhub:` یا `npm:` استفاده کنید.

## مرتبط

- [Pluginها](/fa/tools/plugin) - نصب، پیکربندی، راه‌اندازی مجدد و عیب‌یابی
- [`openclaw plugins`](/fa/cli/plugins) - مرجع کامل CLI
- [Pluginهای جامعه](/fa/plugins/community) - کشف عمومی و انتشار در ClawHub
- [ClawHub](/fa/clawhub/cli) - عملیات CLI رجیستری
- [ساخت Pluginها](/fa/plugins/building-plugins) - ایجاد یک بسته Plugin
- [مانیفست Plugin](/fa/plugins/manifest) - مانیفست و فراداده بسته

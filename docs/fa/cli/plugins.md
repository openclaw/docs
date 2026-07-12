---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید یک Plugin ابزار ساده را ایجاد یا اعتبارسنجی کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (مقداردهی اولیه، ساخت، اعتبارسنجی، فهرست‌کردن، نصب، بازارچه، حذف نصب، فعال/غیرفعال‌کردن، عیب‌یابی)
title: Pluginها
x-i18n:
    generated_at: "2026-07-12T09:48:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های هوک و بسته‌های سازگار.

<CardGroup cols={2}>
  <Card title="سامانه Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی و عیب‌یابی Pluginها.
  </Card>
  <Card title="مدیریت Pluginها" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست‌کردن، به‌روزرسانی، حذف نصب و انتشار.
  </Card>
  <Card title="بسته‌های Plugin" href="/fa/plugins/bundles">
    مدل سازگاری بسته‌ها.
  </Card>
  <Card title="مانیفست Plugin" href="/fa/plugins/manifest">
    فیلدهای مانیفست و شِمای پیکربندی.
  </Card>
  <Card title="امنیت" href="/fa/gateway/security">
    مقاوم‌سازی امنیتی نصب Pluginها.
  </Card>
</CardGroup>

## فرمان‌ها

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

برای بررسی نصب، بازرسی، حذف نصب یا تازه‌سازی رجیستری که کند انجام می‌شود، فرمان را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. ردیابی، زمان‌بندی مرحله‌ها را در stderr می‌نویسد و خروجی JSON را قابل تجزیه نگه می‌دارد. به [عیب‌یابی](/fa/help/debugging#plugin-lifecycle-trace) مراجعه کنید.

<Note>
در حالت Nix (`OPENCLAW_NIX_MODE=1`)، فایل `openclaw.json` تغییرناپذیر است. فرمان‌های `install`، `update`، `uninstall`، `enable` و `disable` همگی از اجرا خودداری می‌کنند. در عوض، منبع Nix این نصب را ویرایش کنید (`programs.openclaw.config` یا برای nix-openclaw، `instances.<name>.config`) و سپس دوباره بسازید. به [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) با رویکرد عامل‌محور مراجعه کنید.
</Note>

<Note>
Pluginهای همراه با OpenClaw عرضه می‌شوند. برخی به‌طور پیش‌فرض فعال‌اند (برای مثال، ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه و Plugin مرورگر همراه)؛ سایر موارد به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw فایل `openclaw.plugin.json` را با یک شِمای JSON درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه می‌کنند. بسته‌های سازگار در عوض از مانیفست بستهٔ خود استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی مفصل فهرست/اطلاعات، زیرنوع بسته (`codex`، `claude` یا `cursor`) و همچنین قابلیت‌های شناسایی‌شدهٔ بسته را نمایش می‌دهد.
</Note>

## ساخت

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` به‌طور پیش‌فرض یک Plugin ابزار حداقلی TypeScript ایجاد می‌کند. آرگومان نخست شناسهٔ Plugin است؛ `--name` نام نمایشی را تنظیم می‌کند. OpenClaw از این شناسه برای پوشهٔ خروجی پیش‌فرض و نام‌گذاری بسته استفاده می‌کند. داربست‌های ابزار از `defineToolPlugin` استفاده می‌کنند و اسکریپت‌های `plugin:build` و `plugin:validate` را در `package.json` ایجاد می‌کنند که ابتدا می‌سازند و سپس `openclaw plugins build`/`validate` را فراخوانی می‌کنند.

`plugins build` ورودی ساخته‌شده را وارد می‌کند، فرادادهٔ ایستای ابزار را می‌خواند، `openclaw.plugin.json` را می‌نویسد و `openclaw.extensions` در `package.json` را همگام نگه می‌دارد. `plugins validate` بررسی می‌کند که مانیفست تولیدشده، فرادادهٔ بسته و خروجی فعلی ورودی همچنان با یکدیگر مطابقت داشته باشند. برای گردش‌کار کامل ساخت، به [Pluginهای ابزار](/fa/plugins/tool-plugins) مراجعه کنید.

داربست، کد منبع TypeScript را می‌نویسد اما فراداده را از ورودی ساخته‌شدهٔ `./dist/index.js` تولید می‌کند؛ بنابراین این گردش‌کار با CLI منتشرشده نیز کار می‌کند. هنگامی که ورودی، ورودی پیش‌فرض بسته نیست، از `--entry <path>` استفاده کنید. در CI از `plugins build --check` استفاده کنید تا در صورت منسوخ‌بودن فرادادهٔ تولیدشده، بدون بازنویسی فایل‌ها با شکست مواجه شود.

### داربست ارائه‌دهنده

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

داربست‌های ارائه‌دهنده، یک Plugin عمومی ارائه‌دهندهٔ مدل سازگار با OpenAI ایجاد می‌کنند که شامل سازوکار احراز هویت با کلید API، اسکریپت `npm run validate` برای اجرای `clawhub package validate`، فرادادهٔ بستهٔ ClawHub و یک گردش‌کار GitHub Actions با اجرای دستی برای انتشار قابل‌اعتماد آتی از طریق GitHub OIDC است. داربست‌های ارائه‌دهنده Skills تولید نمی‌کنند و از `openclaw plugins build`/`validate` استفاده نمی‌کنند؛ این فرمان‌ها برای مسیر فرادادهٔ تولیدشدهٔ داربست ابزار هستند.

پیش از انتشار، نشانی پایهٔ API جای‌نگهدار، کاتالوگ مدل، مسیر مستندات، متن اطلاعات اعتبارنامه و متن README را با جزئیات واقعی ارائه‌دهنده جایگزین کنید. برای نخستین انتشار در ClawHub و راه‌اندازی ناشر قابل‌اعتماد، از README تولیدشده استفاده کنید.

## نصب

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

نگه‌دارندگانی که نصب‌های زمان راه‌اندازی را آزمایش می‌کنند، می‌توانند منابع خودکار نصب Plugin را با متغیرهای محیطی محافظت‌شده بازنویسی کنند. به [بازنویسی‌های نصب Plugin](/fa/plugins/install-overrides) مراجعه کنید.

<Warning>
در دورهٔ گذار عرضه، نام‌های سادهٔ بسته به‌طور پیش‌فرض از npm نصب می‌شوند، مگر اینکه با شناسهٔ یک Plugin همراه یا رسمی مطابقت داشته باشند؛ در این صورت OpenClaw به‌جای مراجعه به رجیستری npm از همان نسخهٔ محلی/رسمی استفاده می‌کند. هنگامی که عمداً یک بستهٔ خارجی npm می‌خواهید، از `npm:<package>` استفاده کنید. برای ClawHub از `clawhub:<package>` استفاده کنید. با نصب Pluginها مانند اجرای کد رفتار کنید؛ نسخه‌های سنجاق‌شده را ترجیح دهید.
</Warning>

`plugins search` برای یافتن بسته‌های قابل نصب `code-plugin` و `bundle-plugin` از ClawHub پرس‌وجو می‌کند (نه Skills؛ برای آن‌ها از `openclaw skills search` استفاده کنید). مقدار پیش‌فرض `--limit` برابر ۲۰ است و حداکثر به ۱۰۰ محدود می‌شود. این فرمان فقط کاتالوگ راه‌دور را می‌خواند: هیچ بازرسی وضعیت محلی، تغییر پیکربندی، نصب بسته یا بارگذاری زمان اجرای Plugin انجام نمی‌شود. نتایج شامل نام بستهٔ ClawHub، خانواده، کانال، نسخه، خلاصه و راهنمای نصب مانند `openclaw plugins install clawhub:<package>` هستند.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. npm همچنان به‌عنوان مسیر جایگزین پشتیبانی‌شده و نصب مستقیم باقی می‌ماند. بسته‌های Plugin متعلق به OpenClaw با الگوی `@openclaw/*` دوباره در npm منتشر می‌شوند؛ فهرست فعلی را در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا [فهرست موجودی Pluginها](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند. نصب‌ها و به‌روزرسانی‌های کانال بتا در صورت موجودبودن، برچسب توزیع `beta` در npm را ترجیح می‌دهند و در غیر این صورت به `latest` بازمی‌گردند. در کانال پایدارِ بلندمدت، Pluginهای رسمی npm با قصد ساده/پیش‌فرض یا `latest` دقیقاً به نسخهٔ نصب‌شدهٔ هسته نگاشت می‌شوند. سنجاق‌های دقیق و برچسب‌های صریح غیر از `latest`، بسته‌های شخص ثالث و منابع غیر npm بازنویسی نمی‌شوند.
</Note>

<AccordionGroup>
  <Accordion title="شامل‌سازی پیکربندی و ترمیم پیکربندی نامعتبر">
    اگر بخش `plugins` شما توسط یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` تغییرات را مستقیماً در همان فایل شامل‌شده می‌نویسد و `openclaw.json` را دست‌نخورده باقی می‌گذارد. شامل‌سازی‌های ریشه، آرایه‌های شامل‌سازی و شامل‌سازی‌هایی با بازنویسی‌های هم‌سطح، به‌جای مسطح‌سازی به‌صورت بسته شکست می‌خورند. برای شکل‌های پشتیبانی‌شده به [شامل‌سازی‌های پیکربندی](/fa/gateway/configuration) مراجعه کنید.

    اگر هنگام نصب پیکربندی نامعتبر باشد، `plugins install` معمولاً به‌صورت بسته شکست می‌خورد و از شما می‌خواهد ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و بارگذاری مجدد داغ، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگری به‌صورت بسته شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر Plugin را قرنطینه کند. تنها استثنای مستندشده در زمان نصب، مسیر محدود بازیابی Plugin همراه برای Pluginهایی است که صراحتاً `openclaw.install.allowInvalidConfigRecovery` را فعال می‌کنند.

  </Accordion>
  <Accordion title="--force و نصب مجدد در برابر به‌روزرسانی">
    `--force` از مقصد نصب موجود دوباره استفاده می‌کند و یک Plugin یا بستهٔ هوک ازپیش‌نصب‌شده را در همان محل بازنویسی می‌کند. زمانی از آن استفاده کنید که عمداً همان شناسه را از یک مسیر محلی، بایگانی، بستهٔ ClawHub یا مصنوع npm جدید دوباره نصب می‌کنید. برای ارتقای معمول یک Plugin npm که از قبل ردیابی می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای شناسهٔ Pluginی اجرا کنید که از قبل نصب شده است، OpenClaw متوقف می‌شود و برای ارتقای عادی شما را به `plugins update <id-or-npm-spec>`، یا هنگامی که واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید به `plugins install <package> --force` هدایت می‌کند. استفاده از `--force` همراه با `--link` پشتیبانی نمی‌شود.

  </Accordion>
  <Accordion title="دامنهٔ --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود و مقدار دقیق حل‌شدهٔ `<name>@<version>` را ثبت می‌کند. این گزینه همراه با نصب‌های `git:` پشتیبانی نمی‌شود (در عوض مرجع را در مشخصات سنجاق کنید، برای مثال `git:github.com/acme/plugin@v1.2.3`) و با `--marketplace` نیز پشتیبانی نمی‌شود (نصب‌های بازارگاه به‌جای مشخصات npm، فرادادهٔ منبع بازارگاه را ماندگار می‌کنند).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` منسوخ شده و اکنون هیچ عملی انجام نمی‌دهد. OpenClaw دیگر مسدودسازی داخلی کد خطرناک در زمان نصب را برای نصب Pluginها اجرا نمی‌کند.

    هنگامی که سیاست نصب ویژهٔ میزبان لازم است، از سطح تحت مالکیت اپراتور `security.installPolicy` استفاده کنید. هوک‌های `before_install` در Plugin، هوک‌های چرخهٔ عمر زمان اجرای Plugin هستند، نه مرز اصلی سیاست برای نصب‌های CLI.

    اگر Pluginی که در ClawHub منتشر کرده‌اید به‌دلیل اسکن رجیستری پنهان یا مسدود شده است، از مراحل ناشر در [انتشار ClawHub](/fa/clawhub/publishing) استفاده کنید. `--dangerously-force-unsafe-install` از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا نسخهٔ مسدودشده را عمومی سازد.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    نصب‌های انجمن ClawHub پیش از دانلود، سابقهٔ اعتماد نسخهٔ انتخاب‌شده را بررسی می‌کنند. اگر ClawHub دانلود نسخه را غیرفعال کند، یافته‌های اسکن مخرب را گزارش دهد یا نسخه را در وضعیت تعدیل‌کنندهٔ مسدودکننده قرار دهد (قرنطینه‌شده یا لغوشده)، OpenClaw صرف‌نظر از این پرچم آن را به‌طور کامل رد می‌کند. برای وضعیت‌های پرخطر اما غیرمسدودکنندهٔ اسکن یا تعدیل، OpenClaw جزئیات اعتماد را نمایش می‌دهد و پیش از ادامه تأیید می‌خواهد.

    تنها پس از بررسی هشدار ClawHub و تصمیم به ادامه بدون اعلان تعاملی، از `--acknowledge-clawhub-risk` استفاده کنید. نتایج اسکن در انتظار یا منسوخ (هنوز پاک‌نشده) هشدار می‌دهند، اما به تأیید نیاز ندارند. بسته‌های رسمی ClawHub و منابع Plugin همراه OpenClaw این بررسی اعتماد نسخه را به‌طور کامل دور می‌زنند.

  </Accordion>
  <Accordion title="بسته‌های هوک و مشخصات npm">
    `plugins install` همچنین سطح نصب بسته‌های هوکی است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای مشاهدهٔ فیلترشدهٔ هوک‌ها و فعال‌سازی جداگانهٔ هر هوک از `openclaw hooks` استفاده کنید، نه برای نصب بسته.

    مشخصات npm **فقط محدود به رجیستری** هستند (نام بسته به‌همراه **نسخهٔ دقیق** یا **dist-tag** اختیاری). مشخصات Git/URL/فایل و بازه‌های semver رد می‌شوند. برای ایمنی، نصب وابستگی‌ها در یک پروژهٔ مدیریت‌شدهٔ npm به‌ازای هر Plugin و با `--ignore-scripts` اجرا می‌شود، حتی اگر پوستهٔ شما تنظیمات سراسری نصب npm داشته باشد. پروژه‌های مدیریت‌شدهٔ npm مربوط به Plugin، تنظیمات npm `overrides` در سطح بستهٔ OpenClaw را به ارث می‌برند؛ بنابراین تثبیت‌های امنیتی میزبان برای وابستگی‌های بالاکشیده‌شدهٔ Plugin نیز اعمال می‌شوند.

    برای صریح‌کردن وضوح npm، از `npm:<package>` استفاده کنید. مشخصات سادهٔ بسته نیز هنگام گذار راه‌اندازی مستقیماً از npm نصب می‌شوند، مگر اینکه با شناسهٔ یک Plugin رسمی مطابقت داشته باشند.

    مشخصات خام `@openclaw/*` که با Pluginهای همراه مطابقت دارند، پیش از بازگشت به npm به نسخهٔ همراهِ متعلق به ایمیج منتهی می‌شوند. برای نمونه، `openclaw plugins install @openclaw/discord@2026.5.20 --pin` به‌جای ایجاد یک جایگزینی مدیریت‌شدهٔ npm، از Plugin همراه Discord در بیلد فعلی OpenClaw استفاده می‌کند. برای اجبار استفاده از بستهٔ خارجی npm، از `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` استفاده کنید.

    مشخصات ساده و `@latest` در مسیر پایدار باقی می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` در این بررسی پایدار محسوب می‌شوند. اگر npm هرکدام از این دو شکل را به یک پیش‌انتشار منتهی کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک برچسب پیش‌انتشار (`@beta`/`@rc`) یا نسخهٔ دقیق پیش‌انتشار (`@1.2.3-beta.4`) صریحاً موافقت کنید.

    برای نصب‌های npm بدون نسخهٔ دقیق (`npm:<package>` یا `npm:<package>@latest`)، OpenClaw پیش از نصب فرادادهٔ بستهٔ تعیین‌شده را بررسی می‌کند. اگر جدیدترین بستهٔ پایدار به API جدیدتری از Plugin در OpenClaw یا حداقل نسخهٔ بالاتری از میزبان نیاز داشته باشد، OpenClaw نسخه‌های پایدار قدیمی‌تر را بررسی و جدیدترین انتشار سازگار را نصب می‌کند. نسخه‌های دقیق و dist-tagهای صریح سخت‌گیرانه باقی می‌مانند: انتخاب ناسازگار ناموفق می‌شود و از شما می‌خواهد OpenClaw را ارتقا دهید یا نسخه‌ای سازگار انتخاب کنید.

    اگر مشخصات نصب ساده با شناسهٔ یک Plugin رسمی مطابقت داشته باشد (برای نمونه `diffs`)، OpenClaw ورودی کاتالوگ را مستقیماً نصب می‌کند. برای نصب بسته‌ای از npm با همان نام، از مشخصات صریح دامنه‌دار استفاده کنید (برای نمونه `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    برای نصب مستقیم از یک مخزن git، از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده: `git:github.com/owner/repo`،‏ `git:owner/repo`، نشانی کامل `https://`،‏ `ssh://`،‏ `git://`،‏ `file://` و URLهای کلون `git@host:owner/repo.git`. برای بررسی یک شاخه، برچسب یا کامیت پیش از نصب، `@<ref>` یا `#<ref>` را اضافه کنید.

    نصب‌های Git مخزن را در یک دایرکتوری موقت کلون می‌کنند، در صورت وجود مرجع درخواستی آن را checkout می‌کنند و سپس از نصب‌کنندهٔ عادی دایرکتوری Plugin استفاده می‌کنند؛ بنابراین اعتبارسنجی مانیفست، خط‌مشی نصب اپراتور، عملیات نصب مدیر بسته و سوابق نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های ثبت‌شدهٔ git شامل URL/مرجع مبدأ و کامیت تعیین‌شده هستند تا `openclaw plugins update` بتواند بعداً مبدأ را دوباره تعیین کند.

    پس از نصب از git، از `openclaw plugins inspect <id> --runtime --json` برای تأیید ثبت‌های زمان اجرا مانند متدهای Gateway و فرمان‌های CLI استفاده کنید. اگر Plugin یک ریشهٔ CLI را با `api.registerCli` ثبت کرده است، آن فرمان را مستقیماً از طریق CLI ریشهٔ OpenClaw اجرا کنید؛ برای نمونه `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="بایگانی‌ها">
    بایگانی‌های پشتیبانی‌شده: `.zip`،‏ `.tgz`،‏ `.tar.gz`،‏ `.tar`. بایگانی‌های بومی Plugin در OpenClaw باید در ریشهٔ استخراج‌شدهٔ Plugin دارای یک `openclaw.plugin.json` معتبر باشند؛ بایگانی‌هایی که فقط شامل `package.json` هستند، پیش از آنکه OpenClaw سوابق نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball ساخته‌شده با npm است و می‌خواهید
    از همان مسیر پروژهٔ مدیریت‌شدهٔ npm به‌ازای هر Plugin که در نصب‌های رجیستری استفاده می‌شود بهره ببرید،
    از `npm-pack:<path.tgz>` استفاده کنید؛ این مسیر شامل تأیید `package-lock.json`،
    اسکن وابستگی‌های بالاکشیده‌شده
    و سوابق نصب npm است. مسیرهای سادهٔ بایگانی همچنان به‌عنوان بایگانی‌های محلی
    زیر ریشهٔ افزونه‌های Plugin نصب می‌شوند.

    نصب از بازار Claude نیز پشتیبانی می‌شود.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از مکان‌یاب صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

مشخصات ساده و ایمن برای npm مربوط به Plugin، هنگام گذار راه‌اندازی به‌طور پیش‌فرض از npm نصب می‌شوند، مگر اینکه با شناسهٔ یک Plugin رسمی مطابقت داشته باشند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح‌کردن وضوح مختص npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، سازگاری اعلام‌شدهٔ API مربوط به Plugin / حداقل Gateway را بررسی می‌کند. وقتی نسخهٔ انتخاب‌شدهٔ ClawHub یک مصنوع ClawPack منتشر کرده باشد، OpenClaw فایل `.tgz` نسخه‌دارِ npm-pack را بارگیری می‌کند، سرآیند چکیدهٔ ClawHub و چکیدهٔ مصنوع را تأیید می‌کند و سپس آن را از طریق مسیر عادی بایگانی نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub که فاقد فرادادهٔ ClawPack هستند همچنان از مسیر قدیمی تأیید بایگانی بسته نصب می‌شوند. نصب‌های ثبت‌شده، فرادادهٔ مبدأ ClawHub، نوع مصنوع، یکپارچگی npm،‏ shasum مربوط به npm، نام tarball و اطلاعات چکیدهٔ ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های بدون نسخهٔ ClawHub مشخصات ثبت‌شدهٔ بدون نسخه را حفظ می‌کنند تا `openclaw plugins update` بتواند انتشارهای جدیدتر ClawHub را دنبال کند؛ انتخابگرهای نسخه یا برچسب صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` به همان انتخابگر تثبیت‌شده باقی می‌مانند.

### شکل کوتاه بازار

وقتی نام بازار در کش رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از شکل کوتاه `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

برای ارسال صریح مبدأ بازار، از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="مبدأهای بازار">
    - نام بازار شناخته‌شدهٔ Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشهٔ بازار محلی یا مسیر `marketplace.json`
    - شکل کوتاه یک مخزن GitHub مانند `owner/repo`
    - URL یک مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL مربوط به git

  </Tab>
  <Tab title="قواعد بازار راه‌دور">
    برای بازارهای راه‌دوری که از GitHub یا git بارگیری می‌شوند، ورودی‌های Plugin باید داخل مخزن کلون‌شدهٔ بازار باقی بمانند. OpenClaw مبدأهای مسیر نسبی را از آن مخزن می‌پذیرد و مبدأهای HTTP(S)، مسیر مطلق، git،‏ GitHub و سایر مبدأهای غیرمسیرِ Plugin را در مانیفست‌های راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و بایگانی‌های محلی، OpenClaw موارد زیر را به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json`، یا چیدمان پیش‌فرض اجزای Claude وقتی آن فایل مانیفست وجود ندارد)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

نصب‌های محلی مدیریت‌شده باید دایرکتوری یا بایگانی Plugin باشند. فایل‌های مستقل Plugin با پسوندهای `.js`،
`.mjs`،‏ `.cjs` و `.ts` توسط `plugins install` در ریشهٔ مدیریت‌شدهٔ Plugin
کپی نمی‌شوند و با قراردادن مستقیم آن‌ها در
`~/.openclaw/extensions` یا `<workspace>/.openclaw/extensions` نیز بارگیری نمی‌شوند؛ آن
ریشه‌های کشف خودکار، دایرکتوری‌های بسته یا بستهٔ جامع Plugin را بارگیری می‌کنند و
فایل‌های اسکریپت سطح بالا را به‌عنوان ابزارهای کمکی محلی نادیده می‌گیرند. در عوض فایل‌های مستقل را
به‌طور صریح در `plugins.load.paths` فهرست کنید.

<Note>
بسته‌های سازگار در ریشهٔ عادی Plugin نصب می‌شوند و در همان گردش فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی مشارکت می‌کنند. در حال حاضر، Skills بسته، مهارت‌های فرمان Claude، پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های `.lsp.json` مربوط به Claude /‏ `lspServers` اعلام‌شده در مانیفست، مهارت‌های فرمان Cursor و دایرکتوری‌های hook سازگار با Codex پشتیبانی می‌شوند؛ دیگر قابلیت‌های شناسایی‌شدهٔ بسته در عیب‌یابی/اطلاعات نمایش داده می‌شوند، اما هنوز به اجرای زمان اجرا متصل نشده‌اند.
</Note>

برای اشاره به یک دایرکتوری محلی Plugin بدون کپی‌کردن آن، از `-l`/`--link` استفاده کنید (آن را
به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` با `--force` پشتیبانی نمی‌شود (Pluginهای پیوندی مستقیماً به مسیر مبدأ
اشاره می‌کنند، بنابراین چیزی برای بازنویسی در محل وجود ندارد)، همچنین با `--marketplace` یا
نصب‌های `git:` پشتیبانی نمی‌شود و به یک مسیر محلی ازپیش‌موجود نیاز دارد.

<Note>
Pluginهای با مبدأ فضای کاری که از ریشهٔ افزونه‌های فضای کاری کشف می‌شوند،
تا زمانی که به‌طور صریح فعال نشوند وارد یا اجرا نمی‌شوند. برای توسعهٔ محلی،
`openclaw plugins enable <plugin-id>` را اجرا کنید یا
`plugins.entries.<plugin-id>.enabled: true` را تنظیم کنید؛ اگر پیکربندی شما از
`plugins.allow` استفاده می‌کند، همان شناسهٔ Plugin را نیز در آن قرار دهید. این قاعدهٔ
بسته‌بودن پیش‌فرض همچنین زمانی اعمال می‌شود که راه‌اندازی کانال به‌طور صریح یک Plugin با مبدأ فضای کاری را برای
بارگیری صرفاً جهت راه‌اندازی هدف قرار دهد؛ بنابراین تا زمانی که آن
Plugin فضای کاری غیرفعال یا از فهرست مجاز حذف‌شده باشد، کد راه‌اندازی Plugin کانال محلی اجرا نخواهد شد. نصب‌های پیوندی
و ورودی‌های صریح `plugins.load.paths` از خط‌مشی عادی مبدأ
Plugin تعیین‌شدهٔ خود پیروی می‌کنند. به
[پیکربندی خط‌مشی Plugin](/fa/tools/plugin#configure-plugin-policy)
و [مرجع پیکربندی](/fa/gateway/configuration-reference#plugins) مراجعه کنید.

در نصب‌های npm از `--pin` استفاده کنید تا مشخصات دقیق تعیین‌شده (`name@version`) در نمایهٔ مدیریت‌شدهٔ Plugin ذخیره شود، درحالی‌که رفتار پیش‌فرض بدون تثبیت باقی می‌ماند.
</Note>

## فهرست

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  فقط Pluginهای فعال را نمایش می‌دهد.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خطوط جزئیات هر Plugin با فرادادهٔ قالب/مبدأ/خاستگاه/نسخه/فعال‌سازی تغییر می‌دهد.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن برای ماشین به‌همراه عیب‌یابی رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی پایدارشدهٔ Plugin را می‌خواند و وقتی رجیستری وجود ندارد یا نامعتبر است، از جایگزین مشتق‌شدهٔ صرفاً مبتنی بر مانیفست استفاده می‌کند. این فرمان برای بررسی نصب‌بودن، فعال‌بودن و قابل‌مشاهده‌بودن یک Plugin در برنامه‌ریزی راه‌اندازی سرد مفید است، اما یک کاوش زندهٔ زمان اجرا از فرایند Gateway ازپیش‌درحال‌اجرا نیست. پس از تغییر کد Plugin، وضعیت فعال‌سازی، خط‌مشی hook یا `plugins.load.paths`،‏ Gateway ارائه‌دهندهٔ کانال را بازراه‌اندازی کنید تا انتظار داشته باشید کد جدید `register(api)` یا hookها اجرا شوند. در استقرارهای راه‌دور/کانتینری، تأیید کنید که فرزند واقعی `openclaw gateway run` را بازراه‌اندازی می‌کنید، نه فقط یک فرایند پوشاننده را.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `dependencies` و
`optionalDependencies` در `package.json` است. OpenClaw بررسی می‌کند که آیا نام این بسته‌ها
در مسیر عادی جست‌وجوی `node_modules` مربوط به Node برای Plugin وجود دارند یا نه؛ این فرمان
کد زمان اجرای Plugin را وارد نمی‌کند، مدیر بسته را اجرا نمی‌کند و وابستگی‌های
مفقود را ترمیم نمی‌کند.
</Note>

اگر راه‌اندازی پیام `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` را ثبت کرد،
`openclaw plugins list --enabled --verbose` یا
`openclaw plugins inspect <id>` را با شناسهٔ یکی از Pluginهای فهرست‌شده اجرا کنید تا شناسه‌های Plugin
تأیید شوند و شناسه‌های قابل‌اعتماد را در `plugins.allow` در `openclaw.json` کپی کنید. وقتی
هشدار بتواند همهٔ Pluginهای کشف‌شده را فهرست کند، یک قطعهٔ آمادهٔ جای‌گذاری
برای `plugins.allow` چاپ می‌کند که از قبل شامل آن شناسه‌ها است. اگر یک Plugin
بدون منشأ نصب/مسیر بارگیری بار شود، آن شناسهٔ Plugin را بررسی کنید و سپس یا
شناسهٔ قابل‌اعتماد را در `plugins.allow` تثبیت کنید یا Plugin را از یک مبدأ قابل‌اعتماد
دوباره نصب کنید تا OpenClaw منشأ نصب را ثبت کند.

برای کار روی Plugin همراه درون یک ایمیج بسته‌بندی‌شدهٔ Docker، دایرکتوری
مبدأ Plugin را به‌صورت bind mount روی مسیر مبدأ بسته‌بندی‌شدهٔ متناظر، مانند
`/app/extensions/synology-chat`، سوار کنید. OpenClaw این لایهٔ مبدأ سوارشده را
پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری مبدأ که صرفاً کپی شده باشد
غیرفعال باقی می‌ماند، بنابراین نصب‌های بسته‌بندی‌شدهٔ عادی همچنان از dist کامپایل‌شده استفاده می‌کنند.

برای اشکال‌زدایی hook زمان اجرا:

- دستور `openclaw plugins inspect <id> --runtime --json` قلاب‌های ثبت‌شده و اطلاعات عیب‌یابی حاصل از یک مرحلهٔ بازرسی با ماژول بارگذاری‌شده را نمایش می‌دهد. بازرسی زمان اجرا هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت وابستگی‌های قدیمی یا بازیابی Pluginهای قابل‌دریافتِ مفقودی که در پیکربندی به آن‌ها ارجاع شده است، از `openclaw doctor --fix` استفاده کنید.
- دستور `openclaw gateway status --deep --require-rpc` نشانی اینترنتی/نمایهٔ Gateway قابل‌دسترسی، راهنمایی‌های سرویس/فرایند، مسیر پیکربندی و سلامت RPC را تأیید می‌کند.
- قلاب‌های مکالمهٔ غیربسته‌بندی‌شده (`llm_input`، `llm_output`، `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `before_agent_finalize`، `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

### نمایهٔ Plugin

فرادادهٔ نصب Plugin، وضعیتی تحت مدیریت ماشین است، نه پیکربندی کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در پایگاه دادهٔ وضعیت مشترک SQLite در پوشهٔ وضعیت فعال OpenClaw می‌نویسند. ردیف `installed_plugin_index` فرادادهٔ پایدار `installRecords` را ذخیره می‌کند؛ از جمله رکوردهای مانیفست‌های خراب یا مفقود Plugin و یک حافظهٔ نهان رجیستری سرد که از مانیفست استخراج شده و توسط `openclaw plugins update`، حذف نصب، عیب‌یابی و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای قدیمیِ عرضه‌شدهٔ `plugins.installs` را در پیکربندی می‌بیند، خواندن‌های زمان اجرا بدون بازنویسی `openclaw.json` با آن‌ها به‌عنوان ورودی سازگاری رفتار می‌کنند. نوشتن‌های صریح Plugin و `openclaw doctor --fix` این رکوردها را به نمایهٔ Plugin منتقل و، در صورت مجاز بودن نوشتن پیکربندی، کلید پیکربندی را حذف می‌کنند؛ اگر هرکدام از نوشتن‌ها ناموفق باشد، رکوردهای پیکربندی نگه داشته می‌شوند تا فرادادهٔ نصب از بین نرود.

## حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

دستور `uninstall` رکوردهای Plugin را از `plugins.entries`، نمایهٔ پایدار Plugin، ورودی‌های فهرست مجاز/غیرمجاز Plugin و، در صورت کاربرد، ورودی‌های پیوندشدهٔ `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب پوشهٔ نصب مدیریت‌شدهٔ ردیابی‌شده را نیز حذف می‌کند، اما فقط وقتی مسیر آن در ریشهٔ افزونه‌های Plugin متعلق به OpenClaw قرار گیرد. اگر Plugin در حال حاضر مالک جایگاه `memory` یا `contextEngine` باشد، آن جایگاه به مقدار پیش‌فرض خود بازنشانی می‌شود (`memory-core` برای حافظه و `legacy` برای موتور زمینه).

دستور `uninstall` پیش‌نمایشی از مواردی که حذف خواهند شد چاپ می‌کند و سپس پیش از اعمال تغییرات، پرسش `Plugin "<id>" حذف نصب شود؟` را نمایش می‌دهد. برای رد کردن پرسش تأیید، `--force` را ارسال کنید (مناسب برای اسکریپت‌ها و اجراهای غیرتعاملی)؛ بدون آن، حذف نصب به یک TTY تعاملی نیاز دارد. گزینهٔ `--dry-run` همان پیش‌نمایش را چاپ می‌کند و بدون نمایش پرسش یا تغییر چیزی خارج می‌شود.

<Note>
گزینهٔ `--keep-config` به‌عنوان نام مستعار منسوخ‌شدهٔ `--keep-files` پشتیبانی می‌شود.
</Note>

## به‌روزرسانی

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

به‌روزرسانی‌ها روی نصب‌های ردیابی‌شدهٔ Plugin در نمایهٔ مدیریت‌شدهٔ Plugin و نصب‌های ردیابی‌شدهٔ بستهٔ قلاب در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="تفکیک شناسهٔ Plugin از مشخصات npm">
    وقتی شناسهٔ یک Plugin را وارد می‌کنید، OpenClaw مشخصات نصب ثبت‌شدهٔ همان Plugin را دوباره استفاده می‌کند. یعنی برچسب‌های توزیع ازپیش‌ذخیره‌شده مانند `@beta` و نسخه‌های دقیق سنجاق‌شده در اجراهای بعدی `update <id>` همچنان استفاده می‌شوند.

    هنگام `update <id> --dry-run`، نصب‌های npm که به نسخه‌ای دقیق سنجاق شده‌اند، سنجاق‌شده باقی می‌مانند. اگر OpenClaw بتواند خط انتشار پیش‌فرض رجیستری بسته را نیز تفکیک کند و آن خط پیش‌فرض از نسخهٔ سنجاق‌شدهٔ نصب‌شده جدیدتر باشد، اجرای آزمایشی سنجاق را گزارش و فرمان صریح به‌روزرسانی بسته با `@latest` را برای دنبال کردن خط پیش‌فرض رجیستری چاپ می‌کند.

    این قاعدهٔ به‌روزرسانی هدفمند با مسیر نگه‌داری گروهی `openclaw plugins update --all` متفاوت است. به‌روزرسانی‌های گروهی همچنان مشخصات عادی نصب‌های ردیابی‌شده را رعایت می‌کنند، اما رکوردهای مورداعتمادِ Plugin رسمی OpenClaw می‌توانند به‌جای ماندن روی یک بستهٔ رسمی دقیق و قدیمی، با هدف فعلی کاتالوگ رسمی همگام شوند. وقتی عمداً می‌خواهید یک مشخصات رسمی دقیق یا برچسب‌دار بدون تغییر بماند، از `update <id>` هدفمند استفاده کنید.

    برای نصب‌های npm، می‌توانید یک مشخصات صریح بستهٔ npm با برچسب توزیع یا نسخهٔ دقیق نیز وارد کنید. OpenClaw نام آن بسته را به رکورد ردیابی‌شدهٔ Plugin مرتبط می‌کند، Plugin نصب‌شده را به‌روزرسانی می‌کند و مشخصات جدید npm را برای به‌روزرسانی‌های آینده بر پایهٔ شناسه ثبت می‌کند.

    وارد کردن نام بستهٔ npm بدون نسخه یا برچسب نیز آن را به رکورد ردیابی‌شدهٔ Plugin مرتبط می‌کند. وقتی Plugin به نسخه‌ای دقیق سنجاق شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این روش استفاده کنید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال بتا">
    فرمان هدفمند `openclaw plugins update <id-or-npm-spec>` مشخصات ردیابی‌شدهٔ Plugin را دوباره استفاده می‌کند، مگر اینکه مشخصات جدیدی وارد کنید. فرمان گروهی `openclaw plugins update --all` هنگام همگام‌سازی رکوردهای مورداعتمادِ Plugin رسمی با هدف کاتالوگ رسمی از `update.channel` پیکربندی‌شده استفاده می‌کند؛ بنابراین نصب‌های کانال بتا می‌توانند به‌جای اینکه بی‌سروصدا به پایدار/جدیدترین تبدیل شوند، روی خط انتشار بتا باقی بمانند.

    `openclaw update` کانال فعال به‌روزرسانی OpenClaw را نیز می‌شناسد: در کانال بتا، رکوردهای Plugin مربوط به خط پیش‌فرض npm و ClawHub ابتدا `@beta` را امتحان می‌کنند. اگر انتشار بتای Plugin وجود نداشته باشد، به مشخصات ثبت‌شدهٔ پیش‌فرض/جدیدترین برمی‌گردند؛ Pluginهای npm همچنین وقتی بستهٔ بتا وجود دارد اما در اعتبارسنجی نصب شکست می‌خورد، به حالت جایگزین برمی‌گردند. این بازگشت به‌صورت هشدار گزارش می‌شود و باعث شکست به‌روزرسانی هسته نمی‌شود. نسخه‌های دقیق و برچسب‌های صریح در به‌روزرسانی‌های هدفمند به همان انتخابگر سنجاق‌شده باقی می‌مانند.

  </Accordion>
  <Accordion title="بررسی نسخه و تغییر یکپارچگی">
    پیش از یک به‌روزرسانی زندهٔ npm، OpenClaw نسخهٔ بستهٔ نصب‌شده را با فرادادهٔ رجیستری npm مقایسه می‌کند. اگر نسخهٔ نصب‌شده و هویت مصنوع ثبت‌شده از قبل با هدف تفکیک‌شده مطابقت داشته باشند، به‌روزرسانی بدون دریافت، نصب مجدد یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی هش یکپارچگی ذخیره‌شده وجود دارد و هش مصنوع دریافت‌شده تغییر می‌کند، OpenClaw آن را تغییر مصنوع npm در نظر می‌گیرد. فرمان تعاملی `openclaw plugins update` هش موردانتظار و هش واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. ابزارهای غیرتعاملی به‌روزرسانی به‌طور پیش‌فرض ادامه نمی‌دهند، مگر اینکه فراخواننده سیاست صریح ادامه را ارائه کند.

  </Accordion>
  <Accordion title="گزینهٔ --dangerously-force-unsafe-install در به‌روزرسانی">
    گزینهٔ `--dangerously-force-unsafe-install` برای سازگاری در `plugins update` نیز پذیرفته می‌شود، اما منسوخ شده و دیگر رفتار به‌روزرسانی Plugin را تغییر نمی‌دهد. `security.installPolicy` متعلق به اپراتور همچنان می‌تواند به‌روزرسانی‌ها را مسدود کند؛ قلاب‌های `before_install` متعلق به Plugin فقط در فرایندهایی اعمال می‌شوند که قلاب‌های Plugin در آن‌ها بارگذاری شده‌اند.
  </Accordion>
  <Accordion title="گزینهٔ --acknowledge-clawhub-risk در به‌روزرسانی">
    به‌روزرسانی Pluginهای انجمن که از ClawHub پشتیبانی می‌شوند، پیش از دریافت بستهٔ جایگزین همان بررسی اعتمادِ انتشار دقیقِ نصب‌ها را اجرا می‌کنند. برای خودکارسازی بررسی‌شده‌ای که باید هنگام وجود هشدار پرخطر اعتماد برای انتشار انتخاب‌شدهٔ ClawHub ادامه یابد، از `--acknowledge-clawhub-risk` استفاده کنید. بسته‌های رسمی ClawHub و منابع بسته‌بندی‌شدهٔ Plugin متعلق به OpenClaw از این پرسش اعتماد به انتشار عبور می‌کنند.
  </Accordion>
</AccordionGroup>

## بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

بازرسی، هویت، وضعیت بارگذاری، منبع، قابلیت‌های مانیفست، پرچم‌های سیاست، اطلاعات عیب‌یابی، فرادادهٔ نصب، قابلیت‌های بسته و هرگونه پشتیبانی شناسایی‌شده از سرور MCP یا LSP را نمایش می‌دهد، بی‌آنکه به‌طور پیش‌فرض زمان اجرای Plugin را وارد کند. خروجی JSON قراردادهای مانیفست Plugin مانند `contracts.agentToolResultMiddleware` و `contracts.trustedToolPolicies` را در بر می‌گیرد تا اپراتورها بتوانند پیش از فعال‌سازی یا راه‌اندازی مجدد Plugin، اعلان‌های سطح مورداعتماد را ممیزی کنند. برای بارگذاری ماژول Plugin و افزودن قلاب‌ها، ابزارها، فرمان‌ها، سرویس‌ها، روش‌های Gateway و مسیرهای HTTP ثبت‌شده، `--runtime` را اضافه کنید. بازرسی زمان اجرا وابستگی‌های مفقود Plugin را مستقیماً گزارش می‌کند؛ نصب‌ها و تعمیرات در `openclaw plugins install`، `openclaw plugins update` و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI متعلق به Plugin معمولاً به‌صورت گروه‌های فرمان ریشهٔ `openclaw` نصب می‌شوند، اما Pluginها می‌توانند فرمان‌های تودرتو را نیز زیر یک والد هسته مانند `openclaw nodes` ثبت کنند. پس از اینکه `inspect --runtime` فرمانی را زیر `cliCommands` نمایش داد، آن را در مسیر فهرست‌شده اجرا کنید؛ برای نمونه، Pluginی که `demo-git` را ثبت می‌کند با `openclaw demo-git ping` قابل‌تأیید است.

هر Plugin بر اساس آنچه واقعاً در زمان اجرا ثبت می‌کند، طبقه‌بندی می‌شود:

| شکل                 | معنا                                                               |
| ------------------- | ------------------------------------------------------------------ |
| `plain-capability`  | دقیقاً یک نوع قابلیت (برای مثال، Pluginی که فقط ارائه‌دهنده است)   |
| `hybrid-capability` | بیش از یک نوع قابلیت (برای مثال، متن + گفتار + تصویر)              |
| `hook-only`         | فقط قلاب‌ها، بدون قابلیت، ابزار، فرمان، سرویس یا مسیر               |
| `non-capability`    | ابزارها/فرمان‌ها/سرویس‌ها، اما بدون قابلیت                          |

برای اطلاعات بیشتر دربارهٔ مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل‌خواندن برای ماشین ارائه می‌کند که برای اسکریپت‌نویسی و ممیزی مناسب است. `inspect --all` جدولی سراسری برای همهٔ Pluginها با ستون‌های شکل، انواع قابلیت، اعلان‌های سازگاری، قابلیت‌های بسته و خلاصهٔ قلاب نمایش می‌دهد. `info` نام مستعار `inspect` است.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، اطلاعات عیب‌یابی مانیفست/کشف، اعلان‌های سازگاری و ارجاع‌های کهنهٔ پیکربندی Plugin مانند جایگاه‌های مفقود Plugin را گزارش می‌کند. وقتی درخت نصب و پیکربندی Plugin پاک باشند، پیام `هیچ مشکلی در Plugin شناسایی نشد.` را چاپ می‌کند. اگر پیکربندی کهنه باقی مانده باشد اما درخت نصب در غیر این صورت سالم باشد، خلاصه همین موضوع را بیان می‌کند و به‌اشتباه سلامت کامل Plugin را القا نمی‌کند.

اگر Plugin پیکربندی‌شده روی دیسک موجود باشد اما بررسی‌های ایمنی مسیرِ بارگذار آن را مسدود کنند، اعتبارسنجی پیکربندی ورودی Plugin را نگه می‌دارد و آن را به‌صورت `موجود اما مسدود` گزارش می‌کند. به‌جای حذف پیکربندی `plugins.entries.<id>` یا `plugins.allow`، مشکل عیب‌یابی قبلی Plugin مسدودشده، مانند مالکیت مسیر یا مجوزهای قابل‌نوشتن برای همه، را برطرف کنید.

برای شکست‌های شکل ماژول، مانند نبود خروجی‌های `register`/`activate`، فرمان را با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` دوباره اجرا کنید تا خلاصه‌ای فشرده از شکل خروجی در خروجی عیب‌یابی گنجانده شود.

## رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin، مدل خواندنی سرد و پایدار OpenClaw برای هویت Plugin نصب‌شده، وضعیت فعال‌سازی، فرادادهٔ منبع و مالکیت مشارکت‌ها است. راه‌اندازی عادی، جست‌وجوی مالک ارائه‌دهنده، طبقه‌بندی راه‌اندازی کانال و موجودی Plugin می‌توانند بدون وارد کردن ماژول‌های زمان اجرای Plugin آن را بخوانند.

برای بررسی اینکه رجیستری پایدار موجود، جاری یا کهنه است، از `plugins registry` استفاده کنید. برای بازسازی آن از نمایهٔ پایدار Plugin، سیاست پیکربندی و فرادادهٔ مانیفست/بسته، از `--refresh` استفاده کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی زمان اجرا.

`openclaw doctor --fix` تغییرات مدیریت‌شدهٔ npm در مجاورت رجیستری را نیز تعمیر می‌کند: اگر یک بستهٔ یتیم یا بازیابی‌شدهٔ `@openclaw/*` در یک پروژهٔ npm مدیریت‌شدهٔ Plugin یا ریشهٔ قدیمی و مسطح npm مدیریت‌شده، یک Plugin بسته‌بندی‌شده را تحت‌الشعاع قرار دهد، doctor آن بستهٔ کهنه را حذف و رجیستری را بازسازی می‌کند تا راه‌اندازی در برابر مانیفست بسته‌بندی‌شده اعتبارسنجی شود. doctor همچنین بستهٔ میزبان `openclaw` را دوباره به Pluginهای npm مدیریت‌شده‌ای که `peerDependencies.openclaw` را اعلام می‌کنند پیوند می‌دهد تا واردکردن‌های محلی زمان اجرای بسته مانند `openclaw/plugin-sdk/*` پس از به‌روزرسانی‌ها یا تعمیرات npm تفکیک شوند.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک کلید سازگاری اضطراری و منسوخ‌شده برای شکست خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ بازگشت مبتنی بر متغیر محیطی فقط برای بازیابی اضطراری راه‌اندازی در مدت عرضهٔ تدریجی مهاجرت است.
</Warning>

## بازارگاه

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` مدخل‌های فید پیکربندی‌شدهٔ بازار OpenClaw را فهرست می‌کند. به‌طور پیش‌فرض، ابتدا فید میزبانی‌شده را امتحان می‌کند و در صورت عدم موفقیت، از جدیدترین اسنپ‌شات پذیرفته‌شده یا داده‌های همراه استفاده می‌کند. برای خواندن یک پروفایل پیکربندی‌شدهٔ مشخص از `--feed-profile <name>`، برای خواندن URL صریح یک فید میزبانی‌شده از `--feed-url <url>` و برای خواندن جدیدترین اسنپ‌شات پذیرفته‌شده بدون دریافت فید از `--offline` استفاده کنید.

`plugins marketplace refresh` اسنپ‌شات فید میزبانی‌شدهٔ پیکربندی‌شده را تازه‌سازی می‌کند و گزارش می‌دهد که آیا OpenClaw داده‌های میزبانی‌شده، یک اسنپ‌شات میزبانی‌شده یا داده‌های همراهِ جایگزین را پذیرفته است. هنگامی که فراخواننده لازم دارد فرمان شکست بخورد مگر اینکه یک محتوای تازهٔ میزبانی‌شده با جمع کنترلی ثابت‌شده مطابقت داشته باشد، از `--expected-sha256` استفاده کنید.

فرمان `list` بازار، مسیر محلی یک بازار، مسیر یک `marketplace.json`، شکل کوتاه GitHub مانند `owner/repo`، URL یک مخزن GitHub یا یک URL گیت را می‌پذیرد. `--json` برچسب منبع حل‌شده را به‌همراه مانیفست تجزیه‌شدهٔ بازار و مدخل‌های Plugin چاپ می‌کند.

تازه‌سازی بازار، یک فید میزبانی‌شدهٔ بازار OpenClaw را بارگذاری می‌کند و پاسخ اعتبارسنجی‌شده را به‌عنوان اسنپ‌شات محلی فید میزبانی‌شده ذخیره می‌کند. بدون گزینه‌ها، از پروفایل پیش‌فرض پیکربندی‌شدهٔ فید استفاده می‌کند. برای تازه‌سازی یک پروفایل پیکربندی‌شدهٔ مشخص از `--feed-profile <name>`، برای تازه‌سازی URL صریح یک فید میزبانی‌شده از `--feed-url <url>`، برای الزام به مطابقت جمع کنترلی محتوا از `--expected-sha256 <sha256>` (`sha256:<hex>` یا یک چکیدهٔ هگزادسیمال ۶۴ نویسه‌ای بدون پیشوند) و برای خروجی قابل‌خواندن توسط ماشین از `--json` استفاده کنید. URLهای صریح فید میزبانی‌شده نباید شامل اطلاعات احراز هویت، رشته‌های پرس‌وجو یا قطعه‌ها باشند. تازه‌سازی‌های بدون مقدار ثابت می‌توانند بدون شکست فرمان، نتیجهٔ اسنپ‌شات میزبانی‌شده یا داده‌های همراهِ جایگزین را گزارش کنند. تازه‌سازی‌های دارای مقدار ثابت شکست می‌خورند، مگر اینکه یک محتوای تازهٔ میزبانی‌شده را بپذیرند؛ همچنین تازه‌سازی‌های موفق میزبانی‌شده در صورتی شکست می‌خورند که OpenClaw نتواند اسنپ‌شات اعتبارسنجی‌شده را ذخیره کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [ClawHub](/clawhub)

---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید یک Plugin ابزار ساده را چارچوب‌بندی یا اعتبارسنجی کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (مقداردهی اولیه، ساخت، اعتبارسنجی، فهرست‌کردن، نصب، بازار، حذف نصب، فعال/غیرفعال‌کردن، عیب‌یابی)
title: Pluginها
x-i18n:
    generated_at: "2026-07-16T15:54:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

Pluginهای Gateway، بسته‌های هوک و باندل‌های سازگار را مدیریت کنید.

<CardGroup cols={2}>
  <Card title="سامانه Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی و عیب‌یابی Pluginها.
  </Card>
  <Card title="مدیریت Pluginها" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست‌کردن، به‌روزرسانی، حذف نصب و انتشار.
  </Card>
  <Card title="باندل‌های Plugin" href="/fa/plugins/bundles">
    مدل سازگاری باندل.
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
openclaw plugins info <id>                    # نام مستعار inspect
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

برای بررسی کندی نصب، بازرسی، حذف نصب یا تازه‌سازی رجیستری، فرمان را با
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. ردیابی، زمان‌بندی مرحله‌ها را در stderr می‌نویسد
و خروجی JSON را قابل تجزیه نگه می‌دارد. به [عیب‌یابی](/fa/help/debugging#plugin-lifecycle-trace) مراجعه کنید.

<Note>
در حالت Nix (`OPENCLAW_NIX_MODE=1`)، `openclaw.json` تغییرناپذیر است. اجرای `install`، `update`، `uninstall`، `enable` و `disable` همگی رد می‌شود. در عوض، منبع Nix این نصب را ویرایش کنید (`programs.openclaw.config` یا `instances.<name>.config` برای nix-openclaw)، سپس دوباره آن را بسازید. به [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) مبتنی بر عامل مراجعه کنید.
</Note>

<Note>
Pluginهای همراه با OpenClaw عرضه می‌شوند. برخی به‌طور پیش‌فرض فعال‌اند (برای نمونه، ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه و Plugin مرورگر همراه)؛ بقیه به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw، `openclaw.plugin.json` را با یک شِمای JSON درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه می‌کنند. باندل‌های سازگار در عوض از مانیفست‌های باندل خودشان استفاده می‌کنند.

`plugins list`، `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی مفصل فهرست/اطلاعات، زیرنوع باندل (`codex`، `claude` یا `cursor`) را نیز همراه با قابلیت‌های شناسایی‌شده باندل نشان می‌دهد.
</Note>

## توسعه

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` به‌طور پیش‌فرض یک Plugin ابزار حداقلی TypeScript ایجاد می‌کند. آرگومان نخست، شناسه Plugin است؛ `--name` نام نمایشی را تعیین می‌کند. OpenClaw از شناسه برای پوشه خروجی پیش‌فرض و نام‌گذاری بسته استفاده می‌کند. داربست‌های ابزار از `defineToolPlugin` استفاده می‌کنند و اسکریپت‌های `package.json` یعنی `plugin:build` و
`plugin:validate` را تولید می‌کنند که ابتدا ساخت را انجام می‌دهند و سپس `openclaw plugins build`/`validate` را فراخوانی می‌کنند.

`plugins build` ورودی ساخته‌شده را وارد می‌کند، فراداده ایستای ابزار آن را می‌خواند، `openclaw.plugin.json` را می‌نویسد و `openclaw.extensions` متعلق به `package.json` را همگام نگه می‌دارد.
`plugins validate` بررسی می‌کند که مانیفست تولیدشده، فراداده بسته و
خروجی فعلی ورودی همچنان با یکدیگر منطبق باشند. برای گردش‌کار کامل توسعه، به
[Pluginهای ابزار](/fa/plugins/tool-plugins) مراجعه کنید.

داربست، کد منبع TypeScript را می‌نویسد اما فراداده را از ورودی ساخته‌شده
`./dist/index.js` تولید می‌کند؛ بنابراین این گردش‌کار با CLI منتشرشده نیز کار می‌کند. وقتی ورودی، ورودی پیش‌فرض بسته نیست، از `--entry <path>` استفاده کنید. در CI از
`plugins build --check` استفاده کنید تا در صورت منسوخ‌بودن فراداده تولیدشده، بدون
بازنویسی فایل‌ها با شکست مواجه شود.

### داربست ارائه‌دهنده

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

داربست‌های ارائه‌دهنده، یک Plugin عمومی ارائه‌دهنده مدل سازگار با OpenAI
با زیرساخت احراز هویت کلید API، یک اسکریپت `npm run validate` که
`clawhub package validate` را اجرا می‌کند، فراداده بسته ClawHub و یک گردش‌کار GitHub Actions با اجرای
دستی برای انتشار قابل‌اعتماد آینده از طریق GitHub
OIDC ایجاد می‌کنند. داربست‌های ارائه‌دهنده Skills تولید نمی‌کنند و از
`openclaw plugins build`/`validate` استفاده نمی‌کنند؛ آن فرمان‌ها برای مسیر فراداده تولیدشده
داربست ابزار هستند.

پیش از انتشار، نشانی پایه API جای‌نگهدار، کاتالوگ مدل، مسیر مستندات،
متن اطلاعات ورود و متن README را با جزئیات واقعی ارائه‌دهنده جایگزین کنید. برای
نخستین انتشار در ClawHub و راه‌اندازی ناشر قابل‌اعتماد، از README تولیدشده استفاده کنید.

## نصب

```bash
openclaw plugins search "calendar"                      # جست‌وجوی Pluginهای ClawHub
openclaw plugins install @openclaw/<package>            # کاتالوگ رسمی قابل‌اعتماد
openclaw plugins install <package>                       # بسته دلخواه npm
openclaw plugins install clawhub:<package>                # فقط ClawHub
openclaw plugins install npm:<package>                    # فقط npm
openclaw plugins install npm-pack:<path.tgz>               # تاربال محلی npm-pack
openclaw plugins install git:github.com/<owner>/<repo>     # مخزن git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # مسیر یا بایگانی محلی
openclaw plugins install -l <path>                         # پیوند به‌جای کپی
openclaw plugins install <plugin>@<marketplace>             # صورت کوتاه بازار
openclaw plugins install <plugin> --marketplace <name>      # بازار (صریح)
openclaw plugins install <package> --force                  # تأیید منبع / بازنویسی مورد موجود
openclaw plugins install <package> --pin                    # سنجاق‌کردن نسخه حل‌شده npm
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

نگه‌دارندگانی که نصب هنگام راه‌اندازی را آزمایش می‌کنند، می‌توانند منابع نصب خودکار Plugin را
با متغیرهای محیطی محافظت‌شده بازنویسی کنند. به
[بازنویسی منابع نصب Plugin](/fa/plugins/install-overrides) مراجعه کنید.

<Warning>
در دوره گذار راه‌اندازی، نام‌های ساده بسته به‌طور پیش‌فرض از npm نصب می‌شوند، مگر آنکه با شناسه یک Plugin همراه یا رسمی مطابقت داشته باشند؛ در این صورت، OpenClaw به‌جای مراجعه به رجیستری npm از همان نسخه محلی/رسمی استفاده می‌کند. وقتی عمداً یک بسته خارجی npm می‌خواهید، از `npm:<package>` استفاده کنید. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Plugin را مانند اجرای کد در نظر بگیرید؛ نسخه‌های سنجاق‌شده را ترجیح دهید.
</Warning>

<Warning>
بسته‌های ClawHub و کاتالوگ همراه/رسمی OpenClaw، منابع نصب قابل‌اعتماد هستند. یک منبع جدید و دلخواه npm، `npm-pack:`، git، مسیر/بایگانی محلی یا
بازار، پیش از ادامه هشدار می‌دهد و تأیید می‌خواهد. نصب‌های غیرتعاملی از منابع دلخواه باید پس از بررسی و اعتماد به منبع، `--force` را ارسال کنند. همین
پرچم در صورت نیاز، مقصد نصب موجود را نیز بازنویسی می‌کند. به‌روزرسانی‌های عادی یک
نصب ازپیش‌ردیابی‌شده به آن نیاز ندارند. این تأیید جدا از
`--acknowledge-clawhub-risk` است که فقط برای هشدارهای اعتماد به انتشار پرخطر ClawHub
کاربرد دارد. `--force`، `security.installPolicy` یا دیگر
بررسی‌های ایمنی نصب را دور نمی‌زند.
</Warning>

`plugins search` برای بسته‌های قابل‌نصب `code-plugin` و
`bundle-plugin` از ClawHub پرس‌وجو می‌کند (نه Skills؛ برای آن‌ها از `openclaw skills search` استفاده کنید).
مقدار پیش‌فرض `--limit` برابر 20 و سقف آن 100 است. این فرمان فقط کاتالوگ راه‌دور را می‌خواند: هیچ
بازرسی وضعیت محلی، تغییر پیکربندی، نصب بسته یا بارگذاری زمان اجرای Plugin انجام نمی‌شود.
نتایج شامل نام بسته ClawHub، خانواده، کانال، نسخه،
خلاصه و راهنمای نصب مانند `openclaw plugins install clawhub:<package>` هستند.

<Note>
ClawHub سطح اصلی توزیع و کشف بیشتر Pluginها است. Npm
همچنان به‌عنوان مسیر جایگزین پشتیبانی‌شده و نصب مستقیم باقی می‌ماند. بسته‌های Plugin متعلق به OpenClaw با
`@openclaw/*` دوباره در npm منتشر می‌شوند؛ فهرست فعلی را در
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا
[موجودی Pluginها](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند.
نصب‌ها و به‌روزرسانی‌های کانال بتا، در صورت موجودبودن dist-tag مربوط به npm یعنی `beta` را ترجیح می‌دهند
و در غیر این صورت به `latest` بازمی‌گردند. در کانال پایدار طولانی‌مدت، Pluginهای رسمی npm
با قصد ساده/پیش‌فرض یا `latest` به نسخه دقیق نصب‌شده هسته
حل می‌شوند. سنجاق‌های دقیق و تگ‌های صریح غیر `latest`، بسته‌های شخص ثالث و
منابع غیر npm بازنویسی نمی‌شوند.
</Note>

<AccordionGroup>
  <Accordion title="شامل‌کردن پیکربندی و ترمیم پیکربندی نامعتبر">
    اگر بخش `plugins` با یک `$include` تک‌فایلی پشتیبانی شود، `plugins install/update/enable/disable/uninstall` تغییرات را مستقیماً در همان فایل شامل‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. شامل‌کردن در ریشه، آرایه‌های شامل و شامل‌هایی با بازنویسی‌های هم‌سطح، به‌جای تخت‌سازی به‌صورت بسته شکست می‌خورند. برای شکل‌های پشتیبانی‌شده، به [شامل‌کردن پیکربندی](/fa/gateway/configuration) مراجعه کنید.

    اگر هنگام نصب، پیکربندی نامعتبر باشد، `plugins install` معمولاً به‌صورت بسته شکست می‌خورد و اعلام می‌کند ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و بارگذاری مجدد داغ، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگری به‌صورت بسته شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر Plugin را قرنطینه کند. تنها استثنای مستند هنگام نصب، یک مسیر محدود بازیابی Plugin همراه برای Pluginهایی است که صریحاً `openclaw.install.allowInvalidConfigRecovery` را فعال می‌کنند.

  </Accordion>
  <Accordion title="تأیید --force و نصب مجدد در برابر به‌روزرسانی">
    `--force` یک منبع غیر ClawHub را بدون نمایش اعلان تأیید می‌کند. این گزینه `security.installPolicy` یا دیگر بررسی‌های ایمنی نصب را دور نمی‌زند. وقتی Plugin یا بسته هوک از قبل نصب شده باشد، مقصد موجود را نیز دوباره استفاده می‌کند و آن را درجا بازنویسی می‌کند. پس از بررسی یک منبع دلخواه npm، محلی، بایگانی، git یا بازار، یا هنگام نصب مجدد عمدی همان شناسه، از آن استفاده کنید. برای ارتقاهای معمول یک Plugin ازپیش‌ردیابی‌شده npm، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای شناسه Plugin ازپیش‌نصب‌شده اجرا کنید، OpenClaw متوقف می‌شود و برای ارتقای عادی شما را به `plugins update <id-or-npm-spec>` یا، وقتی واقعاً می‌خواهید نصب فعلی را از منبع دیگری بازنویسی کنید، به `plugins install <package> --force` هدایت می‌کند. منابع دلخواه همچنان هشدار تعاملی منشأ را نشان می‌دهند؛ نصب‌های غیرتعاملی باید پس از بررسی `--force` را ارسال کنند. منابع قابل‌اعتماد ClawHub و کاتالوگ OpenClaw به آن نیاز ندارند. با `--link`، `--force` منبع را تأیید می‌کند اما حالت نصب مسیر پیوندشده را تغییر نمی‌دهد.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm کاربرد دارد و `<name>@<version>` دقیق حل‌شده را ثبت می‌کند. این گزینه با نصب‌های `git:` پشتیبانی نمی‌شود (در عوض مرجع را در مشخصه سنجاق کنید، برای نمونه `git:github.com/acme/plugin@v1.2.3`) و با `--marketplace` نیز پشتیبانی نمی‌شود (نصب‌های بازار به‌جای مشخصه npm، فراداده منبع بازار را نگه می‌دارند).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` منسوخ شده و اکنون هیچ عملی انجام نمی‌دهد. OpenClaw دیگر هنگام نصب Plugin، مسدودسازی داخلی کد خطرناک را اجرا نمی‌کند.

    برای زمانی که سیاست نصب ویژهٔ میزبان لازم است، از سطح تحت مالکیت اپراتور `security.installPolicy` استفاده کنید. هوک‌های Plugin ‏`before_install` هوک‌های چرخهٔ عمر زمان اجرای Plugin هستند، نه مرز اصلی سیاست برای نصب‌های CLI.

    اگر Pluginای که در ClawHub منتشر کرده‌اید به‌دلیل اسکن رجیستری پنهان یا مسدود شده است، از مراحل ناشر در [انتشار در ClawHub](/fa/clawhub/publishing) استفاده کنید. `--dangerously-force-unsafe-install` از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا یک نسخهٔ مسدودشده را عمومی کند.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    نصب‌های انجمن ClawHub پیش از دانلود، سابقهٔ اعتماد نسخهٔ انتخاب‌شده را بررسی می‌کنند. اگر ClawHub دانلود نسخه را غیرفعال کند، یافته‌های اسکن مخرب را گزارش دهد، یا نسخه را در وضعیت نظارتی مسدودکننده (قرنطینه‌شده، لغوشده) قرار دهد، OpenClaw صرف‌نظر از این پرچم، آن را صراحتاً رد می‌کند. برای وضعیت‌های اسکن پرخطر یا وضعیت‌های نظارتی غیرمسدودکننده، OpenClaw جزئیات اعتماد را نمایش می‌دهد و پیش از ادامه تأیید می‌خواهد.

    فقط پس از بررسی هشدار ClawHub و تصمیم به ادامه بدون اعلان تعاملی، از `--acknowledge-clawhub-risk` استفاده کنید. نتایج اسکن در انتظار یا کهنه (هنوز پاک‌نشده) هشدار می‌دهند، اما به تأیید نیاز ندارند. بسته‌های رسمی ClawHub و منابع Plugin همراه OpenClaw این بررسی اعتماد نسخه را به‌طور کامل دور می‌زنند.

  </Accordion>
  <Accordion title="بسته‌های هوک و مشخصات npm">
    `plugins install` همچنین سطح نصب بسته‌های هوکی است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای کنترل نمایش هوک‌های فیلترشده و فعال‌سازی هر هوک از `openclaw hooks` استفاده کنید، نه برای نصب بسته.

    مشخصات npm **فقط برای رجیستری** هستند (نام بسته به‌همراه **نسخهٔ دقیق** یا **dist-tag** اختیاری). مشخصات Git/URL/file و بازه‌های semver رد می‌شوند. برای ایمنی، نصب وابستگی‌ها در یک پروژهٔ مدیریت‌شدهٔ npm به‌ازای هر Plugin و با `--ignore-scripts` اجرا می‌شود، حتی وقتی پوستهٔ شما تنظیمات سراسری نصب npm دارد. پروژه‌های مدیریت‌شدهٔ npm برای Plugin، مقدار `overrides` سطح بستهٔ npm در OpenClaw را به ارث می‌برند؛ بنابراین پین‌های امنیتی میزبان برای وابستگی‌های بالابرده‌شدهٔ Plugin نیز اعمال می‌شوند.

    برای صریح‌کردن تفکیک npm از `npm:<package>` استفاده کنید. مشخصات سادهٔ بسته نیز هنگام گذار راه‌اندازی مستقیماً از npm نصب می‌شوند، مگر اینکه با شناسهٔ یک Plugin رسمی مطابقت داشته باشند.

    مشخصات خام `@openclaw/*` که با Pluginهای همراه مطابقت دارند، پیش از بازگشت به npm به نسخهٔ همراه تحت مالکیت ایمیج تفکیک می‌شوند. برای نمونه، `openclaw plugins install @openclaw/discord@2026.5.20 --pin` به‌جای ایجاد یک جایگزین مدیریت‌شدهٔ npm، از Plugin همراه Discord در بیلد فعلی OpenClaw استفاده می‌کند. برای اجبار استفاده از بستهٔ خارجی npm، از `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` استفاده کنید.

    مشخصات ساده و `@latest` در مسیر پایدار باقی می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` برای این بررسی پایدار محسوب می‌شوند. اگر npm هرکدام از این دو شکل را به یک پیش‌انتشار تفکیک کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک برچسب پیش‌انتشار (`@beta`/`@rc`) یا یک نسخهٔ دقیق پیش‌انتشار (`@1.2.3-beta.4`) صراحتاً موافقت کنید.

    برای نصب‌های npm بدون نسخهٔ دقیق (`npm:<package>` یا `npm:<package>@latest`)، OpenClaw پیش از نصب فرادادهٔ بستهٔ تفکیک‌شده را بررسی می‌کند. اگر جدیدترین بستهٔ پایدار به API جدیدتر Plugin در OpenClaw یا نسخهٔ حداقل جدیدتری از میزبان نیاز داشته باشد، OpenClaw نسخه‌های پایدار قدیمی‌تر را بررسی و جدیدترین نسخهٔ سازگار را نصب می‌کند. نسخه‌های دقیق و dist-tagهای صریح سخت‌گیرانه باقی می‌مانند: انتخاب ناسازگار شکست می‌خورد و از شما می‌خواهد OpenClaw را ارتقا دهید یا نسخه‌ای سازگار انتخاب کنید.

    اگر یک مشخصهٔ نصب ساده با شناسهٔ یک Plugin رسمی مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی کاتالوگ را مستقیماً نصب می‌کند. برای نصب بستهٔ npm با همان نام، از یک مشخصهٔ صریح دارای محدوده استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    برای نصب مستقیم از یک مخزن git از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده: `git:github.com/owner/repo`، `git:owner/repo`، `https://` کامل، `ssh://`، `git://`، `file://` و URLهای clone ‏`git@host:owner/repo.git`. برای checkout کردن شاخه، برچسب یا commit پیش از نصب، `@<ref>` یا `#<ref>` را اضافه کنید.

    نصب‌های Git مخزن را در یک پوشهٔ موقت clone می‌کنند، در صورت وجود ref درخواستی آن را checkout می‌کنند و سپس از نصب‌کنندهٔ معمول پوشهٔ Plugin استفاده می‌کنند؛ بنابراین اعتبارسنجی manifest، سیاست نصب اپراتور، عملیات نصب مدیر بسته و سوابق نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های ثبت‌شدهٔ git شامل URL/ref منبع به‌همراه commit تفکیک‌شده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره تفکیک کند.

    پس از نصب از git، برای تأیید ثبت‌های زمان اجرا مانند متدهای Gateway و فرمان‌های CLI از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. اگر Plugin یک ریشهٔ CLI را با `api.registerCli` ثبت کرده است، آن فرمان را مستقیماً از طریق CLI ریشهٔ OpenClaw اجرا کنید؛ برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="بایگانی‌ها">
    بایگانی‌های پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. بایگانی‌های بومی Plugin در OpenClaw باید در ریشهٔ استخراج‌شدهٔ Plugin دارای `openclaw.plugin.json` معتبر باشند؛ بایگانی‌هایی که فقط شامل `package.json` هستند، پیش از آنکه OpenClaw سوابق نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball ساخته‌شده با npm-pack است و می‌خواهید
    از همان مسیر پروژهٔ مدیریت‌شدهٔ npm به‌ازای هر Plugin که نصب‌های رجیستری استفاده می‌کنند بهره ببرید، از `npm-pack:<path.tgz>` استفاده کنید؛
    این مسیر شامل تأیید `package-lock.json`، اسکن وابستگی‌های بالابرده‌شده
    و سوابق نصب npm است. مسیرهای سادهٔ بایگانی همچنان به‌عنوان بایگانی‌های
    محلی زیر ریشهٔ افزونه‌های Plugin نصب می‌شوند.

    نصب‌های marketplace در Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از مکان‌یاب صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

مشخصات ساده و ایمن برای npm در جریان گذار راه‌اندازی، به‌طور پیش‌فرض از npm نصب می‌شوند، مگر اینکه با شناسهٔ یک Plugin رسمی مطابقت داشته باشند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح‌کردن تفکیک صرفاً از npm از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، سازگاری اعلام‌شدهٔ API ‏Plugin / حداقل Gateway را بررسی می‌کند. وقتی نسخهٔ انتخاب‌شدهٔ ClawHub یک مصنوع ClawPack منتشر کرده باشد، OpenClaw فایل نسخه‌دار npm-pack ‏`.tgz` را دانلود می‌کند، سرآیند digest ‏ClawHub و digest مصنوع را تأیید می‌کند و سپس آن را از طریق مسیر معمول بایگانی نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون فرادادهٔ ClawPack همچنان از طریق مسیر قدیمی تأیید بایگانی بسته نصب می‌شوند. نصب‌های ثبت‌شده فرادادهٔ منبع ClawHub، نوع مصنوع، یکپارچگی npm، shasum ‏npm، نام tarball و داده‌های digest ‏ClawPack را برای به‌روزرسانی‌های بعدی حفظ می‌کنند.
نصب‌های بدون نسخهٔ ClawHub یک مشخصهٔ ثبت‌شدهٔ بدون نسخه را نگه می‌دارند تا `openclaw plugins update` بتواند نسخه‌های جدیدتر ClawHub را دنبال کند؛ گزینش‌گرهای صریح نسخه یا برچسب مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` به همان گزینش‌گر پین می‌مانند.

### شکل کوتاه marketplace

وقتی نام marketplace در کش رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از شکل کوتاه `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

برای ارسال صریح منبع marketplace از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="منابع marketplace">
    - یک نام شناخته‌شدهٔ marketplace در Claude از `~/.claude/plugins/known_marketplaces.json`
    - یک ریشهٔ marketplace محلی یا مسیر `marketplace.json`
    - یک شکل کوتاه مخزن GitHub مانند `owner/repo`
    - یک URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL ‏git

  </Tab>
  <Tab title="قواعد marketplace راه‌دور">
    برای marketplaceهای راه‌دور بارگذاری‌شده از GitHub یا git، ورودی‌های Plugin باید داخل مخزن clone‌شدهٔ marketplace باقی بمانند. OpenClaw منابع دارای مسیر نسبی از آن مخزن را می‌پذیرد و منابع HTTP(S)، مسیر مطلق، git، GitHub و دیگر منابع بدون مسیر Plugin را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و بایگانی‌های محلی، OpenClaw به‌طور خودکار این موارد را تشخیص می‌دهد:

- Pluginهای بومی OpenClaw ‏(`openclaw.plugin.json`)
- بسته‌های سازگار با Codex ‏(`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude ‏(`.claude-plugin/plugin.json`، یا چیدمان پیش‌فرض مؤلفه‌های Claude وقتی آن فایل manifest وجود ندارد)
- بسته‌های سازگار با Cursor ‏(`.cursor-plugin/plugin.json`)

نصب‌های محلی مدیریت‌شده باید پوشه یا بایگانی Plugin باشند. فایل‌های مستقل Plugin با پسوندهای `.js`،
`.mjs`، `.cjs` و `.ts` توسط `plugins install` در ریشهٔ مدیریت‌شدهٔ Plugin
کپی نمی‌شوند و با قراردادن مستقیم آن‌ها در
`~/.openclaw/extensions` یا `<workspace>/.openclaw/extensions` نیز بارگذاری نمی‌شوند؛ این
ریشه‌های با کشف خودکار، پوشه‌های بسته یا بستهٔ Plugin را بارگذاری می‌کنند و
فایل‌های اسکریپت سطح بالا را به‌عنوان ابزارهای کمکی محلی نادیده می‌گیرند. در عوض فایل‌های مستقل را صراحتاً در
`plugins.load.paths` فهرست کنید.

<Note>
بسته‌های سازگار در ریشهٔ معمول Plugin نصب می‌شوند و در همان روند فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. در حال حاضر، Skills بسته، مهارت‌های فرمان Claude، پیش‌فرض‌های `settings.json` در Claude، پیش‌فرض‌های `.lsp.json` در Claude / پیش‌فرض‌های `lspServers` اعلام‌شده در manifest، مهارت‌های فرمان Cursor و پوشه‌های هوک سازگار با Codex پشتیبانی می‌شوند؛ دیگر قابلیت‌های شناسایی‌شدهٔ بسته در عیب‌یابی/اطلاعات نمایش داده می‌شوند، اما هنوز به اجرای زمان اجرا متصل نشده‌اند.
</Note>

برای اشاره به یک پوشهٔ محلی Plugin بدون کپی‌کردن آن از `-l`/`--link` استفاده کنید (آن را
به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` با نصب‌های `--marketplace` یا `git:` پشتیبانی نمی‌شود و
به یک مسیر محلی ازپیش‌موجود نیاز دارد. برای پیوند محلی غیرتعاملی،
پس از بررسی منبع، `--force` را ارسال کنید؛ این گزینه منشأ را تأیید می‌کند، اما
پوشهٔ پیوندشده را کپی یا بازنویسی نمی‌کند.

<Note>
Pluginهای با منشأ فضای کاری که از ریشهٔ افزونه‌های فضای کاری کشف می‌شوند،
تا زمانی که صراحتاً فعال نشوند وارد یا اجرا نمی‌شوند. برای توسعهٔ محلی،
`openclaw plugins enable <plugin-id>` را اجرا کنید یا
`plugins.entries.<plugin-id>.enabled: true` را تنظیم کنید؛ اگر پیکربندی شما از
`plugins.allow` استفاده می‌کند، همان شناسهٔ Plugin را در آن نیز وارد کنید. این قاعدهٔ بسته‌بودن در حالت شکست،
زمانی هم اعمال می‌شود که راه‌اندازی کانال صراحتاً یک Plugin با منشأ فضای کاری را برای
بارگذاری صرفاً جهت راه‌اندازی هدف قرار دهد؛ بنابراین تا وقتی آن
Plugin فضای کاری غیرفعال یا از فهرست مجاز کنار گذاشته شده باشد، کد راه‌اندازی Plugin کانال محلی اجرا نمی‌شود. نصب‌های پیوندی
و ورودی‌های صریح `plugins.load.paths` از سیاست عادی برای
منشأ تفکیک‌شدهٔ Plugin خود پیروی می‌کنند. به
[پیکربندی سیاست Plugin](/fa/tools/plugin#configure-plugin-policy)
و [مرجع پیکربندی](/fa/gateway/configuration-reference#plugins) مراجعه کنید.

برای ذخیرهٔ مشخصهٔ دقیق تفکیک‌شده (`name@version`) در نمایهٔ مدیریت‌شدهٔ Plugin و درعین‌حال حفظ رفتار پیش‌فرض بدون پین، در نصب‌های npm از `--pin` استفاده کنید.
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
  از نمای جدول به خطوط جزئیات هر Plugin با فرادادهٔ قالب/منبع/منشأ/نسخه/فعال‌سازی تغییر می‌دهد.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن برای ماشین به‌همراه عیب‌یابی رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی ماندگارشدهٔ Plugin را می‌خواند و اگر رجیستری موجود نباشد یا نامعتبر باشد، از یک مسیر جایگزین مشتق‌شده فقط از مانیفست استفاده می‌کند. این فرمان برای بررسی نصب و فعال بودن یک Plugin و قابل‌مشاهده بودن آن برای برنامه‌ریزی راه‌اندازی سرد مفید است، اما کاوش زندهٔ زمان اجرا برای یک فرایند Gateway که از قبل در حال اجراست، نیست. پس از تغییر کد Plugin، وضعیت فعال‌سازی، سیاست هوک یا `plugins.load.paths`، پیش از انتظار برای اجرای کد یا هوک‌های جدید `register(api)`، Gateway ارائه‌دهندهٔ کانال را مجدداً راه‌اندازی کنید. در استقرارهای راه‌دور/کانتینری، مطمئن شوید فرزند واقعی `openclaw gateway run` را مجدداً راه‌اندازی می‌کنید، نه فقط یک فرایند پوشاننده را.

`plugins list --json`، `dependencyStatus` هر Plugin را از `package.json`
`dependencies` و `optionalDependencies` در بر می‌گیرد. OpenClaw بررسی می‌کند که آیا نام این بسته‌ها
در مسیر عادی جست‌وجوی `node_modules` مربوط به Node برای Plugin وجود دارند یا نه؛ این فرمان
کد زمان اجرای Plugin را وارد نمی‌کند، مدیر بسته‌ای را اجرا نمی‌کند و وابستگی‌های
ازدست‌رفته را ترمیم نمی‌کند.
</Note>

اگر هنگام راه‌اندازی، `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` در گزارش‌ها ثبت شد،
`openclaw plugins list --enabled --verbose` یا
`openclaw plugins inspect <id>` را با یکی از شناسه‌های فهرست‌شدهٔ Plugin اجرا کنید تا شناسه‌های
Plugin را تأیید کنید و شناسه‌های مورد اعتماد را در `plugins.allow` در `openclaw.json` کپی کنید. وقتی
هشدار بتواند همهٔ Pluginهای کشف‌شده را فهرست کند، یک قطعهٔ
`plugins.allow` آمادهٔ جای‌گذاری چاپ می‌کند که از قبل آن شناسه‌ها را در بر دارد. اگر Plugin بدون
منشأ نصب/مسیر بارگذاری بارگذاری می‌شود، آن شناسهٔ Plugin را بررسی کنید، سپس یا
شناسهٔ مورد اعتماد را در `plugins.allow` سنجاق کنید یا Plugin را از منبعی مورد اعتماد
دوباره نصب کنید تا OpenClaw منشأ نصب را ثبت کند.

برای کار روی Plugin همراه‌شده درون یک تصویر بسته‌بندی‌شدهٔ Docker، دایرکتوری
منبع Plugin را به‌صورت bind mount روی مسیر منبع بسته‌بندی‌شدهٔ متناظر سوار کنید، مانند
`/app/extensions/synology-chat`. OpenClaw آن پوشش منبع سوارشده را
پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع که صرفاً کپی شده باشد
غیرفعال می‌ماند، بنابراین نصب‌های بسته‌بندی‌شدهٔ عادی همچنان از dist کامپایل‌شده استفاده می‌کنند.

برای اشکال‌زدایی هوک‌های زمان اجرا:

- `openclaw plugins inspect <id> --runtime --json` هوک‌های ثبت‌شده و عیب‌یابی‌های حاصل از یک گذر بررسی با ماژول بارگذاری‌شده را نشان می‌دهد. بررسی زمان اجرا هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت قدیمی وابستگی یا بازیابی Pluginهای قابل‌دریافت ازدست‌رفته‌ای که پیکربندی به آن‌ها ارجاع می‌دهد، از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` نشانی اینترنتی/پروفایل قابل‌دسترسی Gateway، راهنمایی‌های سرویس/فرایند، مسیر پیکربندی و سلامت RPC را تأیید می‌کند.
- هوک‌های مکالمهٔ همراه‌نشده (`llm_input`، `llm_output`، `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `before_agent_finalize`، `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

### نمایهٔ Plugin

فرادادهٔ نصب Plugin، وضعیتی مدیریت‌شده توسط ماشین است، نه پیکربندی کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در پایگاه دادهٔ مشترک SQLite زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. ردیف `installed_plugin_index` فرادادهٔ ماندگار `installRecords` را ذخیره می‌کند؛ از جمله رکوردهای مانیفست‌های خراب یا ازدست‌رفتهٔ Plugin و یک حافظهٔ نهان رجیستری سرد مشتق‌شده از مانیفست که توسط `openclaw plugins update`، حذف نصب، عیب‌یابی‌ها و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای قدیمی و منتشرشدهٔ `plugins.installs` را در پیکربندی می‌بیند، خواندن‌های زمان اجرا بدون بازنویسی `openclaw.json` با آن‌ها به‌عنوان ورودی سازگاری رفتار می‌کنند. نوشتن‌های صریح Plugin و `openclaw doctor --fix` آن رکوردها را به نمایهٔ Plugin منتقل می‌کنند و در صورت مجاز بودن نوشتن پیکربندی، کلید پیکربندی را حذف می‌کنند؛ اگر هرکدام از این نوشتن‌ها ناموفق باشد، رکوردهای پیکربندی حفظ می‌شوند تا فرادادهٔ نصب از بین نرود.

## حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، نمایهٔ ماندگار Plugin، مدخل‌های فهرست مجاز/غیرمجاز Plugin و در صورت کاربرد، مدخل‌های پیوندشدهٔ `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب دایرکتوری نصب مدیریت‌شدهٔ ردیابی‌شده را نیز حذف می‌کند، اما فقط وقتی مسیر نهایی آن درون ریشهٔ افزونه‌های Plugin در OpenClaw باشد. اگر Plugin در حال حاضر مالک جایگاه `memory` یا `contextEngine` باشد، آن جایگاه به مقدار پیش‌فرض خود بازنشانی می‌شود (`memory-core` برای حافظه و `legacy` برای موتور زمینه).

`uninstall` پیش‌نمایشی از مواردی که حذف خواهند شد چاپ می‌کند، سپس پیش از اعمال تغییرات، `Uninstall plugin "<id>"?` را درخواست می‌کند. برای رد کردن درخواست تأیید، `--force` را ارسال کنید (برای اسکریپت‌ها و اجراهای غیرتعاملی مفید است)؛ بدون آن، حذف نصب به یک TTY تعاملی نیاز دارد. `--dry-run` همان پیش‌نمایش را چاپ می‌کند و بدون درخواست تأیید یا ایجاد هیچ تغییری خارج می‌شود.

<Note>
`--keep-config` به‌عنوان نام مستعار منسوخ‌شده برای `--keep-files` پشتیبانی می‌شود.
</Note>

## به‌روزرسانی

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

به‌روزرسانی‌ها روی نصب‌های ردیابی‌شدهٔ Plugin در نمایهٔ مدیریت‌شدهٔ Plugin و نصب‌های ردیابی‌شدهٔ بستهٔ هوک در `hooks.internal.installs` اعمال می‌شوند. آن‌ها از همان منبعی که کاربر هنگام نصب Plugin انتخاب کرده است دوباره استفاده می‌کنند، بنابراین به تأیید دوبارهٔ منبع نیاز ندارند.

<AccordionGroup>
  <Accordion title="تفکیک شناسهٔ Plugin از مشخصات npm">
    وقتی شناسهٔ Plugin را ارسال می‌کنید، OpenClaw از مشخصات نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شدهٔ قبلی مانند `@beta` و نسخه‌های دقیق سنجاق‌شده در اجراهای بعدی `update <id>` نیز همچنان استفاده می‌شوند.

    در جریان `update <id> --dry-run`، نصب‌های npm با نسخهٔ دقیق سنجاق‌شده، سنجاق‌شده باقی می‌مانند. اگر OpenClaw بتواند خط پیش‌فرض رجیستری بسته را نیز تفکیک کند و آن خط پیش‌فرض از نسخهٔ سنجاق‌شدهٔ نصب‌شده جدیدتر باشد، اجرای آزمایشی سنجاق را گزارش می‌دهد و فرمان صریح به‌روزرسانی بستهٔ `@latest` را برای دنبال کردن خط پیش‌فرض رجیستری چاپ می‌کند.

    این قاعدهٔ به‌روزرسانی هدفمند با مسیر نگهداشت انبوه `openclaw plugins update --all` متفاوت است. به‌روزرسانی‌های انبوه همچنان مشخصات عادی نصب ردیابی‌شده را رعایت می‌کنند، اما رکوردهای مورد اعتماد Plugin رسمی OpenClaw می‌توانند به‌جای ماندن روی یک بستهٔ رسمی دقیق و قدیمی، با مقصد کنونی کاتالوگ رسمی همگام شوند. وقتی عمداً می‌خواهید یک مشخصات رسمی دقیق یا برچسب‌خورده دست‌نخورده بماند، از `update <id>` هدفمند استفاده کنید.

    برای نصب‌های npm، می‌توانید مشخصات صریح بستهٔ npm را نیز با یک dist-tag یا نسخهٔ دقیق ارسال کنید. OpenClaw نام آن بسته را به رکورد ردیابی‌شدهٔ Plugin برمی‌گرداند، همان Plugin نصب‌شده را به‌روزرسانی می‌کند و مشخصات جدید npm را برای به‌روزرسانی‌های آینده بر اساس شناسه ثبت می‌کند.

    ارسال نام بستهٔ npm بدون نسخه یا برچسب نیز آن را به رکورد ردیابی‌شدهٔ Plugin برمی‌گرداند. زمانی از این روش استفاده کنید که یک Plugin روی نسخه‌ای دقیق سنجاق شده باشد و بخواهید آن را به خط انتشار پیش‌فرض رجیستری بازگردانید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال بتا">
    `openclaw plugins update <id-or-npm-spec>` هدفمند، مگر اینکه مشخصات جدیدی ارسال کنید، از مشخصات ردیابی‌شدهٔ Plugin دوباره استفاده می‌کند. `openclaw plugins update --all` انبوه هنگام همگام‌سازی رکوردهای مورد اعتماد Plugin رسمی با مقصد کاتالوگ رسمی، از `update.channel` پیکربندی‌شده استفاده می‌کند؛ بنابراین نصب‌های کانال بتا می‌توانند به‌جای اینکه بی‌سروصدا به stable/latest عادی‌سازی شوند، روی خط انتشار بتا بمانند.

    `openclaw update` کانال فعال به‌روزرسانی OpenClaw را نیز می‌شناسد: در کانال بتا، رکوردهای Plugin مربوط به npm در خط پیش‌فرض و ClawHub ابتدا `@beta` را امتحان می‌کنند. اگر هیچ انتشار بتایی برای Plugin وجود نداشته باشد، به مشخصات پیش‌فرض/latest ثبت‌شده بازمی‌گردند؛ Pluginهای npm همچنین وقتی بستهٔ بتا وجود داشته باشد اما اعتبارسنجی نصب آن ناموفق شود، به مسیر جایگزین بازمی‌گردند. این بازگشت به‌صورت هشدار گزارش می‌شود و باعث شکست به‌روزرسانی هسته نمی‌شود. نسخه‌های دقیق و برچسب‌های صریح برای به‌روزرسانی‌های هدفمند روی همان انتخابگر سنجاق‌شده باقی می‌مانند.

  </Accordion>
  <Accordion title="بررسی نسخه و انحراف یکپارچگی">
    پیش از به‌روزرسانی زندهٔ npm، OpenClaw نسخهٔ بستهٔ نصب‌شده را با فرادادهٔ رجیستری npm بررسی می‌کند. اگر نسخهٔ نصب‌شده و هویت ثبت‌شدهٔ مصنوع هر دو از قبل با مقصد تفکیک‌شده مطابقت داشته باشند، به‌روزرسانی بدون دریافت، نصب مجدد یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی هش یکپارچگی ذخیره‌شده وجود داشته باشد و هش مصنوع دریافت‌شده تغییر کند، OpenClaw آن را انحراف مصنوع npm تلقی می‌کند. فرمان تعاملی `openclaw plugins update` هش‌های مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه، تأیید می‌خواهد. ابزارهای کمکی به‌روزرسانی غیرتعاملی، مگر اینکه فراخواننده سیاست صریحی برای ادامه ارائه کند، به‌صورت بسته شکست می‌خورند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install هنگام به‌روزرسانی">
    `--dangerously-force-unsafe-install` برای سازگاری در `plugins update` نیز پذیرفته می‌شود، اما منسوخ شده و دیگر رفتار به‌روزرسانی Plugin را تغییر نمی‌دهد. `security.installPolicy` اپراتور همچنان می‌تواند به‌روزرسانی‌ها را مسدود کند؛ هوک‌های `before_install` مربوط به Plugin فقط در فرایندهایی اعمال می‌شوند که هوک‌های Plugin در آن‌ها بارگذاری شده‌اند.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk هنگام به‌روزرسانی">
    به‌روزرسانی Pluginهای انجمن که از ClawHub پشتیبانی می‌شوند، پیش از دریافت بستهٔ جایگزین همان بررسی اعتماد به انتشار دقیق را که در نصب‌ها انجام می‌شود اجرا می‌کنند. برای خودکارسازی بازبینی‌شده‌ای که باید هنگام وجود هشدار اعتماد پرخطر برای انتشار انتخاب‌شدهٔ ClawHub ادامه یابد، از `--acknowledge-clawhub-risk` استفاده کنید. بسته‌های رسمی ClawHub و منابع همراه‌شدهٔ Plugin در OpenClaw این درخواست تأیید اعتماد به انتشار را دور می‌زنند.
  </Accordion>
</AccordionGroup>

## بررسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

بررسی، هویت، وضعیت بارگذاری، منبع، قابلیت‌های مانیفست، پرچم‌های سیاست، عیب‌یابی‌ها، فرادادهٔ نصب، قابلیت‌های بسته و هرگونه پشتیبانی شناسایی‌شده از سرور MCP یا LSP را بدون وارد کردن پیش‌فرض زمان اجرای Plugin نشان می‌دهد. خروجی JSON قراردادهای مانیفست Plugin، مانند `contracts.agentToolResultMiddleware` و `contracts.trustedToolPolicies` را در بر می‌گیرد تا اپراتورها بتوانند پیش از فعال‌سازی یا راه‌اندازی مجدد یک Plugin، اعلان‌های سطح مورد اعتماد را ممیزی کنند. برای بارگذاری ماژول Plugin و گنجاندن هوک‌ها، ابزارها، فرمان‌ها، سرویس‌ها، روش‌های Gateway و مسیرهای HTTP ثبت‌شده، `--runtime` را اضافه کنید. بررسی زمان اجرا وابستگی‌های ازدست‌رفتهٔ Plugin را مستقیماً گزارش می‌کند؛ نصب‌ها و تعمیرات در `openclaw plugins install`، `openclaw plugins update` و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI متعلق به Plugin معمولاً به‌عنوان گروه‌های فرمان ریشهٔ `openclaw` نصب می‌شوند، اما Pluginها می‌توانند فرمان‌های تو‌در‌تو را نیز زیر یک والد هسته‌ای مانند `openclaw nodes` ثبت کنند. پس از اینکه `inspect --runtime` یک فرمان را زیر `cliCommands` نشان داد، آن را در مسیر فهرست‌شده اجرا کنید؛ برای مثال، Pluginی که `demo-git` را ثبت می‌کند، با `openclaw demo-git ping` قابل تأیید است.

هر Plugin بر اساس آنچه واقعاً در زمان اجرا ثبت می‌کند طبقه‌بندی می‌شود:

| شکل               | معنا                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | دقیقاً یک نوع قابلیت (برای مثال، Plugin فقط ارائه‌دهنده)         |
| `hybrid-capability` | بیش از یک نوع قابلیت (برای مثال، متن + گفتار + تصویر)       |
| `hook-only`         | فقط هوک‌ها، بدون قابلیت، ابزار، فرمان، سرویس یا مسیر |
| `non-capability`    | ابزارها/فرمان‌ها/سرویس‌ها، اما بدون قابلیت                       |

برای اطلاعات بیشتر دربارهٔ مدل قابلیت، به [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) مراجعه کنید.

<Note>
پرچم `--json` گزارشی ماشین‌خوان و مناسب اسکریپت‌نویسی و ممیزی تولید می‌کند. `inspect --all` جدولی سراسری برای مجموعه با ستون‌های شکل، انواع قابلیت، اعلان‌های سازگاری، قابلیت‌های بسته و خلاصهٔ هوک نمایش می‌دهد. `info` نام مستعار `inspect` است.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، عیب‌یابی‌های مانیفست/کشف، اعلان‌های سازگاری و ارجاع‌های منسوخ پیکربندی Plugin، مانند جایگاه‌های مفقود Plugin، را گزارش می‌کند. هنگامی که درخت نصب و پیکربندی Plugin پاک باشند، `No plugin issues detected.` را چاپ می‌کند. اگر پیکربندی منسوخ باقی مانده باشد اما درخت نصب از سایر جهات سالم باشد، خلاصه به‌جای القای سلامت کامل Plugin، این موضوع را بیان می‌کند.

اگر یک Plugin پیکربندی‌شده روی دیسک موجود باشد اما بررسی‌های ایمنی مسیر بارگذار آن را مسدود کنند، اعتبارسنجی پیکربندی ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف پیکربندی `plugins.entries.<id>` یا `plugins.allow`، عیب‌یابی پیشینِ Plugin مسدودشده، مانند مالکیت مسیر یا مجوزهای قابل‌نوشتن برای همه، را برطرف کنید.

برای خرابی‌های ساختار ماژول، مانند نبود exportهای `register`/`activate`، فرمان را دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا خلاصه‌ای فشرده از ساختار export در خروجی عیب‌یابی گنجانده شود.

## رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin، مدل خواندن سرد و پایدار OpenClaw برای هویت Pluginهای نصب‌شده، وضعیت فعال‌بودن، فراداده منبع و مالکیت مشارکت‌ها است. راه‌اندازی عادی، جست‌وجوی مالک ارائه‌دهنده، طبقه‌بندی راه‌اندازی کانال و فهرست‌برداری Plugin می‌توانند بدون import کردن ماژول‌های زمان اجرای Plugin آن را بخوانند.

از `plugins registry` برای بررسی موجود، به‌روز یا منسوخ بودن رجیستری پایدار استفاده کنید. از `--refresh` برای بازسازی آن بر اساس نمایه پایدار Plugin، خط‌مشی پیکربندی و فراداده مانیفست/بسته استفاده کنید. این مسیری برای تعمیر است، نه مسیری برای فعال‌سازی زمان اجرا.

`openclaw doctor --fix` همچنین ناهماهنگی مدیریت‌شده npm در مجاورت رجیستری را تعمیر می‌کند: اگر یک بسته یتیم یا بازیابی‌شده `@openclaw/*` زیر یک پروژه مدیریت‌شده npm مربوط به Plugin یا ریشه مسطح و قدیمی npm مدیریت‌شده، یک Plugin همراه را تحت‌الشعاع قرار دهد، doctor آن بسته منسوخ را حذف و رجیستری را بازسازی می‌کند تا راه‌اندازی بر اساس مانیفست همراه اعتبارسنجی شود. doctor همچنین بسته میزبان `openclaw` را دوباره به Pluginهای مدیریت‌شده npm که `peerDependencies.openclaw` را اعلام می‌کنند پیوند می‌دهد تا importهای زمان اجرای محلی بسته، مانند `openclaw/plugin-sdk/*`، پس از به‌روزرسانی‌ها یا تعمیرات npm قابل resolve باشند.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک کلید سازگاری اضطراری و منسوخ برای خرابی‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback متغیر محیطی فقط برای بازیابی اضطراری راه‌اندازی در مدت استقرار مهاجرت است.
</Warning>

## بازارچه

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

`plugins marketplace entries` ورودی‌های فید پیکربندی‌شده بازارچه OpenClaw را فهرست می‌کند. به‌طور پیش‌فرض، فید میزبانی‌شده را امتحان می‌کند و در صورت عدم موفقیت به جدیدترین snapshot پذیرفته‌شده یا داده‌های همراه بازمی‌گردد. از `--feed-profile <name>` برای خواندن یک پروفایل پیکربندی‌شده مشخص، از `--feed-url <url>` برای خواندن URL صریح یک فید میزبانی‌شده و از `--offline` برای خواندن جدیدترین snapshot پذیرفته‌شده بدون دریافت فید استفاده کنید.

`plugins marketplace refresh` snapshot فید میزبانی‌شده پیکربندی‌شده را تازه‌سازی می‌کند و گزارش می‌دهد که آیا OpenClaw داده‌های میزبانی‌شده، یک snapshot میزبانی‌شده یا داده‌های fallback همراه را پذیرفته است. هنگامی که فراخواننده نیاز دارد فرمان جز در صورت مطابقت یک payload تازه میزبانی‌شده با checksum ثابت‌شده ناموفق باشد، از `--expected-sha256` استفاده کنید.

`list` بازارچه یک مسیر محلی بازارچه، یک مسیر `marketplace.json`، یک شکل کوتاه GitHub مانند `owner/repo`، یک URL مخزن GitHub یا یک URL مربوط به git را می‌پذیرد. `--json` برچسب منبع resolveشده را همراه با مانیفست تجزیه‌شده بازارچه و ورودی‌های Plugin چاپ می‌کند.

تازه‌سازی بازارچه یک فید میزبانی‌شده بازارچه OpenClaw را بارگذاری می‌کند و پاسخ
اعتبارسنجی‌شده را به‌عنوان snapshot محلی فید میزبانی‌شده به‌صورت پایدار ذخیره می‌کند. بدون گزینه‌ها، از
پروفایل پیش‌فرض پیکربندی‌شده فید استفاده می‌کند. از `--feed-profile <name>` برای تازه‌سازی یک
پروفایل پیکربندی‌شده مشخص، از `--feed-url <url>` برای تازه‌سازی یک URL صریح فید
میزبانی‌شده، از `--expected-sha256 <sha256>` برای الزام مطابقت checksum محتوای قابل‌انتقال
(`sha256:<hex>` یا یک digest هگزادسیمال ساده 64 نویسه‌ای) و از `--json` برای
خروجی ماشین‌خوان استفاده کنید. URLهای صریح فید میزبانی‌شده نباید شامل
اعتبارنامه‌ها، رشته‌های query یا fragmentها باشند. تازه‌سازی‌های بدون مقدار ثابت می‌توانند نتیجه
snapshot میزبانی‌شده یا fallback همراه را بدون ناموفق کردن فرمان گزارش کنند. تازه‌سازی‌های
دارای مقدار ثابت، جز در صورت پذیرش یک payload تازه میزبانی‌شده، ناموفق می‌شوند و تازه‌سازی‌های
موفق میزبانی‌شده در صورتی ناموفق می‌شوند که OpenClaw نتواند snapshot اعتبارسنجی‌شده را به‌صورت پایدار ذخیره کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [ClawHub](/clawhub)

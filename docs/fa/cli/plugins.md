---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید یک Plugin ابزار ساده را چارچوب‌بندی یا اعتبارسنجی کنید
    - می‌خواهید خرابی‌های بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginها
x-i18n:
    generated_at: "2026-06-28T20:43:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

Pluginهای Gateway، بسته‌های هوک، و باندل‌های سازگار را مدیریت کنید.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی، و عیب‌یابی Pluginها.
  </Card>
  <Card title="Manage plugins" href="/fa/plugins/manage-plugins">
    مثال‌های سریع برای نصب، فهرست‌کردن، به‌روزرسانی، حذف نصب، و انتشار.
  </Card>
  <Card title="Plugin bundles" href="/fa/plugins/bundles">
    مدل سازگاری باندل.
  </Card>
  <Card title="Plugin manifest" href="/fa/plugins/manifest">
    فیلدهای مانیفست و طرحواره پیکربندی.
  </Card>
  <Card title="Security" href="/fa/gateway/security">
    سخت‌سازی امنیتی برای نصب Pluginها.
  </Card>
</CardGroup>

## دستورها

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

برای بررسی نصب، بازرسی، حذف نصب، یا تازه‌سازی رجیستری که کند است، دستور را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. ردگیری، زمان‌بندی مرحله‌ها را در stderr می‌نویسد و خروجی JSON را قابل پردازش نگه می‌دارد. [عیب‌یابی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییر‌دهنده‌های چرخه عمر Plugin غیرفعال هستند. به‌جای `plugins install`، `plugins update`، `plugins uninstall`، `plugins enable`، یا `plugins disable` از منبع Nix برای این نصب استفاده کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) agent-first استفاده کنید.
</Note>

<Note>
Pluginهای همراه با OpenClaw عرضه می‌شوند. بعضی به‌صورت پیش‌فرض فعال هستند (برای مثال ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه)؛ بقیه به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را همراه با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. باندل‌های سازگار به‌جای آن از مانیفست‌های باندل خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی فهرست/اطلاعات در حالت مفصل، زیرنوع باندل (`codex`، `claude`، یا `cursor`) به‌همراه قابلیت‌های باندلِ شناسایی‌شده را نیز نشان می‌دهد.
</Note>

### نویسنده

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` به‌صورت پیش‌فرض یک Plugin ابزار TypeScript حداقلی می‌سازد. آرگومان اول شناسه Plugin است؛ برای نام نمایشی، `--name` را پاس دهید. OpenClaw از شناسه برای دایرکتوری خروجی پیش‌فرض و نام‌گذاری بسته استفاده می‌کند. قالب‌های ابزار از `defineToolPlugin` استفاده می‌کنند.
`plugins build` ورودی ساخته‌شده را import می‌کند، فراداده ایستای ابزار آن را می‌خواند، `openclaw.plugin.json` را می‌نویسد، و `package.json` `openclaw.extensions` را همگام نگه می‌دارد.
`plugins validate` بررسی می‌کند که مانیفست تولیدشده، فراداده بسته، و export ورودی فعلی همچنان با هم همخوان باشند. برای گردش‌کار کامل نویسندگی ابزار، [Pluginهای ابزار](/fa/plugins/tool-plugins) را ببینید.

قالب، سورس TypeScript می‌نویسد اما فراداده را از ورودی ساخته‌شده `./dist/index.js` تولید می‌کند تا این گردش‌کار با CLI منتشرشده نیز کار کند. وقتی ورودی، ورودی پیش‌فرض بسته نیست، از `--entry <path>` استفاده کنید. در CI از `plugins build --check` استفاده کنید تا وقتی فراداده تولیدشده قدیمی است، بدون بازنویسی فایل‌ها شکست بخورد.

### قالب ارائه‌دهنده

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

قالب‌های ارائه‌دهنده، یک Plugin عمومی ارائه‌دهنده متن/مدل با لوله‌کشی کلید API سازگار با OpenAI، یک اسکریپت داخلی `npm run validate` برای `clawhub package validate`، فراداده بسته ClawHub، و یک گردش‌کار GitHub با اجرای دستی برای انتشار مورد اعتماد آینده از طریق GitHub Actions OIDC می‌سازند. قالب‌های ارائه‌دهنده Skills تولید نمی‌کنند و از `openclaw plugins build` یا `openclaw plugins validate` استفاده نمی‌کنند؛ این دستورها برای مسیر فراداده تولیدشده قالب ابزار هستند.

پیش از انتشار، URL پایه API نمونه، کاتالوگ مدل، مسیر مستندات، متن اعتبارنامه، و متن README را با جزئیات واقعی ارائه‌دهنده جایگزین کنید. برای انتشار نخستین‌بار در ClawHub و راه‌اندازی ناشر مورد اعتماد، از README تولیدشده استفاده کنید.

### نصب

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

نگه‌دارندگان که نصب‌های زمان راه‌اندازی را آزمایش می‌کنند، می‌توانند منابع نصب خودکار Plugin را با متغیرهای محیطی محافظت‌شده بازنویسی کنند. [بازنویسی‌های نصب Plugin](/fa/plugins/install-overrides) را ببینید.

<Warning>
نام‌های ساده بسته در دوره گذار راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند، مگر اینکه با شناسه یک Plugin رسمی مطابقت داشته باشند. مشخصه‌های خام بسته `@openclaw/*` که با Pluginهای همراه مطابقت دارند، از نسخه همراهی استفاده می‌کنند که با ساخت فعلی OpenClaw عرضه شده است. وقتی عمدا یک بسته npm خارجی می‌خواهید، از `npm:<package>` استفاده کنید. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Pluginها را مثل اجرای کد در نظر بگیرید. نسخه‌های pin‌شده را ترجیح دهید.
</Warning>

`plugins search` برای بسته‌های Plugin قابل نصب از ClawHub پرس‌وجو می‌کند و نام بسته‌های آماده نصب را چاپ می‌کند. این دستور بسته‌های code-plugin و bundle-plugin را جست‌وجو می‌کند، نه Skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. Npm همچنان به‌عنوان مسیر پشتیبان و نصب مستقیم پشتیبانی می‌شود. بسته‌های Plugin متعلق به OpenClaw با نام `@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا [موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند. نصب‌ها و به‌روزرسانی‌های کانال بتا، وقتی npm `beta` dist-tag در دسترس باشد آن را ترجیح می‌دهند، سپس به `latest` برمی‌گردند.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` در همان فایل include‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای ریشه، آرایه‌های include، و includeهایی با بازنویسی‌های هم‌سطح، به‌جای تخت‌سازی fail closed می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولا fail closed می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و بارگذاری مجدد داغ، پیکربندی نامعتبر Plugin مثل هر پیکربندی نامعتبر دیگر fail closed می‌شود؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر Plugin را قرنطینه کند. تنها استثنای مستند زمان نصب، یک مسیر بازیابی محدود برای Plugin همراه است، برای Pluginهایی که صراحتا `openclaw.install.allowInvalidConfigRecovery` را فعال می‌کنند.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` از هدف نصب موجود دوباره استفاده می‌کند و یک Plugin یا بسته هوک از پیش نصب‌شده را درجا بازنویسی می‌کند. وقتی عمدا همان شناسه را از یک مسیر محلی جدید، آرشیو، بسته ClawHub، یا artifact مربوط به npm دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل رهگیری می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای شناسه Pluginی اجرا کنید که از قبل نصب شده است، OpenClaw متوقف می‌شود و برای ارتقای معمول شما را به `plugins update <id-or-npm-spec>`، یا وقتی واقعا می‌خواهید نصب فعلی را از منبع دیگری بازنویسی کنید به `plugins install <package> --force` راهنمایی می‌کند.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` فقط روی نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pin‌شده می‌خواهید، از یک ref صریح git مثل `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای مشخصه npm، فراداده منبع marketplace را پایدار می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` منسوخ شده و اکنون no-op است. OpenClaw دیگر مسدودسازی داخلی کد خطرناک در زمان نصب را برای نصب Pluginها اجرا نمی‌کند.

    وقتی سیاست نصب ویژه میزبان لازم است، از سطح مشترک و متعلق به اپراتور `security.installPolicy` استفاده کنید. هوک‌های Plugin `before_install` هوک‌های چرخه عمر زمان اجرای Plugin هستند و مرز سیاست اصلی برای نصب‌های CLI نیستند.

    اگر Pluginی که در ClawHub منتشر کرده‌اید با اسکن رجیستری پنهان یا مسدود شده است، از گام‌های ناشر در [انتشار ClawHub](/fa/clawhub/publishing) استفاده کنید. `--dangerously-force-unsafe-install` از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا انتشار مسدودشده را عمومی کند.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    نصب‌های جامعه ClawHub پیش از دانلود بسته، رکورد اعتماد انتشار انتخاب‌شده را بررسی می‌کنند. اگر ClawHub دانلود را برای انتشار غیرفعال کند، یافته‌های اسکن مخرب گزارش کند، یا انتشار را در وضعیت تعدیل مسدودکننده‌ای مثل قرنطینه قرار دهد، OpenClaw انتشار را رد می‌کند. برای وضعیت‌های اسکن پرخطر اما غیرمسدودکننده، وضعیت‌های تعدیل پرخطر، یا دلایل رجیستری، OpenClaw جزئیات اعتماد را نشان می‌دهد و پیش از ادامه درخواست تأیید می‌کند.

    فقط پس از بررسی هشدار ClawHub و تصمیم به ادامه بدون prompt تعاملی از `--acknowledge-clawhub-risk` استفاده کنید. رکوردهای اعتماد پاکِ در انتظار یا قدیمی هشدار می‌دهند اما به تأیید نیاز ندارند. بسته‌های رسمی ClawHub و منابع Plugin همراه OpenClaw این prompt اعتماد انتشار را دور می‌زنند.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` همچنین سطح نصب برای بسته‌های هوکی است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای مشاهده فیلترشده هوک و فعال‌سازی جداگانه هر هوک، از `openclaw hooks` استفاده کنید، نه برای نصب بسته.

    مشخصات npm **فقط رجیستری** هستند (نام بسته + **نسخه دقیق** اختیاری یا **dist-tag**). مشخصات Git/URL/file و بازه‌های semver رد می‌شوند. نصب وابستگی‌ها برای ایمنی در یک پروژه npm مدیریت‌شده برای هر plugin با `--ignore-scripts` اجرا می‌شود، حتی زمانی که پوسته شما تنظیمات نصب npm سراسری داشته باشد. پروژه‌های npm مدیریت‌شده plugin، `overrides` سطح بسته npm مربوط به OpenClaw را به ارث می‌برند، بنابراین pinهای امنیتی میزبان روی وابستگی‌های hoisted plugin هم اعمال می‌شوند.

    وقتی می‌خواهید حل‌وفصل npm را صریح کنید، از `npm:<package>` استفاده کنید. مشخصات بسته بدون پیشوند نیز در دوره گذار راه‌اندازی مستقیماً از npm نصب می‌شوند، مگر اینکه با شناسه رسمی plugin مطابقت داشته باشند.

    مشخصات خام بسته `@openclaw/*` که با pluginهای باندل‌شده مطابقت دارند، پیش از fallback به npm به نسخه باندل‌شده متعلق به image حل می‌شوند. برای مثال، `openclaw plugins install @openclaw/discord@2026.5.20 --pin` به‌جای ایجاد override مدیریت‌شده npm، از plugin باندل‌شده Discord در build فعلی OpenClaw استفاده می‌کند. برای اجبار به استفاده از بسته npm خارجی، از `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` استفاده کنید.

    مشخصات بدون پیشوند و `@latest` روی مسیر پایدار باقی می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` برای این بررسی releaseهای پایدار محسوب می‌شوند. اگر npm هرکدام از این‌ها را به یک prerelease حل کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک برچسب prerelease مانند `@beta`/`@rc` یا یک نسخه دقیق prerelease مانند `@1.2.3-beta.4` صراحتاً opt in کنید.

    برای نصب‌های npm بدون نسخه دقیق (`npm:<package>` یا `npm:<package>@latest`)، OpenClaw پیش از نصب، فراداده بسته حل‌شده را بررسی می‌کند. اگر آخرین بسته پایدار به API جدیدتر plugin در OpenClaw یا حداقل نسخه میزبان جدیدتری نیاز داشته باشد، OpenClaw نسخه‌های پایدار قدیمی‌تر را بررسی می‌کند و به‌جای آن جدیدترین release سازگار را نصب می‌کند. نسخه‌های دقیق و dist-tagهای صریح مانند `@beta` سخت‌گیرانه باقی می‌مانند: اگر بسته انتخاب‌شده ناسازگار باشد، فرمان شکست می‌خورد و از شما می‌خواهد OpenClaw را ارتقا دهید یا نسخه‌ای سازگار انتخاب کنید.

    اگر مشخصات نصب بدون پیشوند با شناسه رسمی plugin مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی کاتالوگ را مستقیماً نصب می‌کند. برای نصب یک بسته npm با همان نام، از یک مشخصات scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    برای نصب مستقیم از یک مخزن git از `git:<repo>` استفاده کنید. قالب‌های پشتیبانی‌شده شامل URLهای clone مانند `git:github.com/owner/repo`، `git:owner/repo`، `https://` کامل، `ssh://`، `git://`، `file://` و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` اضافه کنید.

    نصب‌های Git در یک دایرکتوری موقت clone می‌شوند، در صورت وجود ref درخواستی آن را checkout می‌کنند، سپس از نصب‌کننده عادی دایرکتوری plugin استفاده می‌کنند. یعنی اعتبارسنجی manifest، سیاست نصب operator، کار نصب package-manager، و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit حل‌شده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    پس از نصب از git، از `openclaw plugins inspect <id> --runtime --json` برای تأیید ثبت‌های runtime مانند متدهای gateway و فرمان‌های CLI استفاده کنید. اگر plugin یک ریشه CLI را با `api.registerCli` ثبت کرده باشد، آن فرمان را مستقیماً از طریق CLI ریشه OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    آرشیوهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. آرشیوهای native plugin در OpenClaw باید در ریشه plugin استخراج‌شده یک `openclaw.plugin.json` معتبر داشته باشند؛ آرشیوهایی که فقط `package.json` دارند پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball از نوع npm-pack است و می‌خواهید همان مسیر پروژه npm مدیریت‌شده برای هر plugin را که نصب‌های رجیستری استفاده می‌کنند آزمایش کنید، از `npm-pack:<path.tgz>` استفاده کنید؛ شامل اعتبارسنجی `package-lock.json`، اسکن وابستگی‌های hoisted، و رکوردهای نصب npm. مسیرهای آرشیو ساده همچنان به‌عنوان آرشیوهای محلی زیر ریشه extensions مربوط به plugin نصب می‌شوند.

    نصب‌های marketplace کلود نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

مشخصات plugin سازگار با npm و بدون پیشوند در دوره گذار راه‌اندازی به‌طور پیش‌فرض از npm نصب می‌شوند، مگر اینکه با شناسه رسمی plugin مطابقت داشته باشند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح کردن حل‌وفصل فقط از npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، API تبلیغ‌شده plugin / حداقل سازگاری gateway را بررسی می‌کند. وقتی نسخه انتخاب‌شده ClawHub یک artifact از نوع ClawPack منتشر کند، OpenClaw فایل npm-pack `.tgz` نسخه‌دار را دانلود می‌کند، header digest مربوط به ClawHub و digest خود artifact را تأیید می‌کند، سپس آن را از مسیر عادی آرشیو نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون فراداده ClawPack همچنان از مسیر قدیمی اعتبارسنجی آرشیو بسته نصب می‌شوند. نصب‌های ثبت‌شده فراداده منبع ClawHub، نوع artifact، integrity مربوط به npm، shasum مربوط به npm، نام tarball، و اطلاعات digest مربوط به ClawPack را برای updateهای بعدی نگه می‌دارند.
نصب‌های بدون نسخه ClawHub یک مشخصات ثبت‌شده بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند releaseهای جدیدتر ClawHub را دنبال کند؛ selectorهای نسخه یا tag صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` به همان selector pinned باقی می‌مانند.

#### میان‌بر marketplace

وقتی نام marketplace در cache رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از میان‌بر `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع marketplace را صریحاً پاس دهید، از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - یک نام known-marketplace مربوط به Claude از `~/.claude/plugins/known_marketplaces.json`
    - یک ریشه marketplace محلی یا مسیر `marketplace.json`
    - یک میان‌بر مخزن GitHub مانند `owner/repo`
    - یک URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    برای marketplaceهای remote که از GitHub یا git بارگذاری می‌شوند، ورودی‌های plugin باید داخل مخزن marketplace clone‌شده باقی بمانند. OpenClaw منابع مسیر نسبی از همان مخزن را می‌پذیرد و منابع plugin از نوع HTTP(S)، مسیر مطلق، git، GitHub، و سایر منابع غیرمسیر را از manifestهای remote رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw به‌صورت خودکار تشخیص می‌دهد:

- pluginهای native در OpenClaw (`openclaw.plugin.json`)
- bundleهای سازگار با Codex (`.codex-plugin/plugin.json`)
- bundleهای سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه Claude)
- bundleهای سازگار با Cursor (`.cursor-plugin/plugin.json`)

نصب‌های محلی مدیریت‌شده باید دایرکتوری plugin یا آرشیو باشند. فایل‌های standalone plugin با پسوندهای `.js`، `.mjs`، `.cjs`، و `.ts` توسط `plugins install` در ریشه plugin مدیریت‌شده کپی نمی‌شوند؛ به‌جای آن، آن‌ها را صراحتاً در `plugins.load.paths` فهرست کنید.

<Note>
bundleهای سازگار در ریشه عادی plugin نصب می‌شوند و در همان جریان list/info/enable/disable شرکت می‌کنند. در حال حاضر، bundle skills، command-skills مربوط به Claude، پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های `lspServers` اعلام‌شده در `.lsp.json` / manifest مربوط به Claude، command-skills مربوط به Cursor، و دایرکتوری‌های hook سازگار با Codex پشتیبانی می‌شوند؛ قابلیت‌های bundle دیگری که تشخیص داده می‌شوند در diagnostics/info نمایش داده می‌شوند اما هنوز به اجرای runtime متصل نشده‌اند.
</Note>

### فهرست

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  فقط pluginهای فعال را نمایش دهید.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خط‌های جزئیات برای هر plugin با فراداده source/origin/version/activation تغییر دهید.
</ParamField>
<ParamField path="--json" type="boolean">
  inventory قابل خواندن برای ماشین به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی persistent مربوط به plugin را می‌خواند، و وقتی رجیستری موجود نیست یا نامعتبر است از fallback مشتق‌شده فقط از manifest استفاده می‌کند. این فرمان برای بررسی اینکه آیا یک plugin نصب، فعال، و برای برنامه‌ریزی cold startup قابل مشاهده است مفید است، اما probe زنده runtime برای فرایند Gateway از قبل در حال اجرا نیست. پس از تغییر کد plugin، enablement، سیاست hook، یا `plugins.load.paths`، پیش از انتظار برای اجرای کد `register(api)` یا hookهای جدید، Gatewayای را که channel را سرو می‌کند restart کنید. برای deploymentهای remote/container، تأیید کنید که child واقعی `openclaw gateway run` را restart می‌کنید، نه فقط یک wrapper process.

`plugins list --json` شامل `dependencyStatus` هر plugin از `dependencies` و `optionalDependencies` در `package.json` است. OpenClaw بررسی می‌کند آیا آن نام‌های بسته در مسیر عادی lookup مربوط به `node_modules` برای plugin وجود دارند یا نه؛ کد runtime مربوط به plugin را import نمی‌کند، package manager اجرا نمی‌کند، و وابستگی‌های گم‌شده را repair نمی‌کند.
</Note>

اگر startup لاگ کند `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`،
برای تأیید شناسه‌های plugin، `openclaw plugins list --enabled --verbose` یا
`openclaw plugins inspect <id>` را با یک شناسه plugin فهرست‌شده اجرا کنید و شناسه‌های مورد اعتماد را در `plugins.allow` در `openclaw.json` کپی کنید. وقتی warning بتواند همه pluginهای کشف‌شده را فهرست کند، یک snippet آماده paste برای `plugins.allow` چاپ می‌کند که از قبل شامل آن شناسه‌هاست. اگر یک plugin بدون provenance نصب/load-path بارگذاری شود، آن شناسه plugin را inspect کنید، سپس یا شناسه مورد اعتماد را در `plugins.allow` pin کنید یا plugin را از یک منبع مورد اعتماد دوباره نصب کنید تا OpenClaw provenance نصب را ثبت کند.

`plugins search` یک lookup کاتالوگ remote در ClawHub است. این فرمان state محلی را inspect نمی‌کند، config را mutate نمی‌کند، بسته نصب نمی‌کند، یا کد runtime مربوط به plugin را load نمی‌کند. نتایج جست‌وجو شامل نام بسته ClawHub، family، channel، version، summary، و یک hint نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی plugin باندل‌شده داخل یک image بسته‌بندی‌شده Docker، دایرکتوری source مربوط به plugin را روی مسیر source بسته‌بندی‌شده متناظر bind-mount کنید، مانند `/app/extensions/synology-chat`. OpenClaw آن overlay source mount‌شده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری source که صرفاً کپی شده باشد inert باقی می‌ماند تا نصب‌های بسته‌بندی‌شده عادی همچنان از dist کامپایل‌شده استفاده کنند.

برای debugging hookهای runtime:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics از یک pass inspection با module-loaded را نشان می‌دهد. inspection مربوط به Runtime هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی legacy dependency state یا بازیابی pluginهای دانلودشدنی گم‌شده که config به آن‌ها ارجاع می‌دهد، از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` نشانی URL/profile قابل دسترس Gateway، hintهای service/process، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای conversation غیر باندل‌شده (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی کردن یک دایرکتوری plugin محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

فایل‌های standalone plugin باید به‌جای نصب با `plugins install` یا قرار گرفتن مستقیم در `~/.openclaw/extensions` یا `<workspace>/.openclaw/extensions`، در `plugins.load.paths` فهرست شوند. آن ریشه‌های auto-discovered دایرکتوری‌های بسته یا bundle مربوط به plugin را load می‌کنند، در حالی که فایل‌های script سطح بالا به‌عنوان helperهای محلی در نظر گرفته می‌شوند و skip می‌شوند.

<Note>
Pluginهای با خاستگاه workspace که از ریشهٔ extensions یک workspace کشف می‌شوند، تا زمانی که صراحتاً فعال نشده باشند
import یا اجرا نمی‌شوند. برای توسعهٔ محلی،
`openclaw plugins enable <plugin-id>` را اجرا کنید یا
`plugins.entries.<plugin-id>.enabled: true` را تنظیم کنید؛ اگر پیکربندی شما از
`plugins.allow` استفاده می‌کند، همان شناسهٔ Plugin را آنجا هم اضافه کنید. این قاعدهٔ fail-closed
وقتی هم اعمال می‌شود که راه‌اندازی کانال صراحتاً یک Plugin با خاستگاه workspace را برای
بارگذاری صرفاً جهت راه‌اندازی هدف بگیرد، بنابراین کد راه‌اندازی Plugin کانال محلی تا وقتی آن
Plugin workspace غیرفعال بماند یا از allowlist کنار گذاشته شده باشد اجرا نخواهد شد. نصب‌های لینک‌شده
و ورودی‌های صریح `plugins.load.paths` از سیاست عادی برای خاستگاه Plugin
حل‌شدهٔ خود پیروی می‌کنند. ببینید
[پیکربندی سیاست Plugin](/fa/tools/plugin#configure-plugin-policy)
و [مرجع پیکربندی](/fa/gateway/configuration-reference#plugins).

`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های لینک‌شده به‌جای کپی کردن روی یک هدف نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کنند.

برای نصب‌های npm از `--pin` استفاده کنید تا spec دقیق حل‌شده (`name@version`) در فهرست Plugin مدیریت‌شده ذخیره شود، در حالی که رفتار پیش‌فرض بدون pin باقی بماند.
</Note>

### فهرست Plugin

فرادادهٔ نصب Plugin وضعیتِ مدیریت‌شده توسط ماشین است، نه پیکربندی کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در پایگاه‌دادهٔ وضعیت مشترک SQLite زیر پوشهٔ وضعیت فعال OpenClaw می‌نویسند. ردیف `installed_plugin_index` فرادادهٔ پایدار `installRecords` را ذخیره می‌کند، از جمله رکوردهای مربوط به manifestهای خراب یا گم‌شدهٔ Plugin، به‌علاوهٔ یک cache سرد registry مشتق‌شده از manifest که توسط `openclaw plugins update`، حذف نصب، diagnostics و registry سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای legacy منتشرشدهٔ `plugins.installs` را در پیکربندی ببیند، خواندن‌های runtime با آن‌ها به‌عنوان ورودی سازگاری رفتار می‌کنند، بدون اینکه `openclaw.json` را بازنویسی کنند. نوشتن‌های صریح Plugin و `openclaw doctor --fix` این رکوردها را به فهرست Plugin منتقل می‌کنند و وقتی نوشتن پیکربندی مجاز باشد کلید پیکربندی را حذف می‌کنند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، رکوردهای پیکربندی نگه داشته می‌شوند تا فرادادهٔ نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، فهرست پایدار Plugin، ورودی‌های فهرست allow/deny Plugin، و ورودی‌های لینک‌شدهٔ `plugins.load.paths` در صورت کاربرد حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین پوشهٔ نصب مدیریت‌شدهٔ ردیابی‌شده را وقتی داخل ریشهٔ extensions مربوط به Pluginهای OpenClaw باشد حذف می‌کند. برای Pluginهای Active Memory، slot حافظه به `memory-core` بازنشانی می‌شود.

<Note>
`--keep-config` به‌عنوان alias منسوخ‌شده برای `--keep-files` پشتیبانی می‌شود.
</Note>

### به‌روزرسانی

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

به‌روزرسانی‌ها روی نصب‌های ردیابی‌شدهٔ Plugin در فهرست Plugin مدیریت‌شده و نصب‌های hook-pack ردیابی‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="حل شناسهٔ Plugin در برابر spec npm">
    وقتی یک شناسهٔ Plugin را پاس می‌دهید، OpenClaw از spec نصب ثبت‌شده برای همان Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شدهٔ قبلی مانند `@beta` و نسخه‌های دقیق pin‌شده در اجرای بعدی `update <id>` همچنان استفاده می‌شوند.

    هنگام `update <id> --dry-run`، نصب‌های npm با نسخهٔ دقیق pin‌شده همان‌طور pin‌شده می‌مانند. اگر OpenClaw بتواند خط پیش‌فرض registry آن package را هم حل کند و آن خط پیش‌فرض از نسخهٔ pin‌شدهٔ نصب‌شده جدیدتر باشد، اجرای dry run آن pin را گزارش می‌کند و فرمان صریح به‌روزرسانی package با `@latest` را برای دنبال کردن خط پیش‌فرض registry چاپ می‌کند.

    این قاعدهٔ به‌روزرسانی هدفمند با مسیر نگهداری دسته‌ای `openclaw plugins update --all` متفاوت است. به‌روزرسانی‌های دسته‌ای همچنان به specهای نصب ردیابی‌شدهٔ عادی احترام می‌گذارند، اما رکوردهای Plugin رسمی و مورداعتماد OpenClaw می‌توانند به‌جای ماندن روی یک package رسمی دقیق و قدیمی، با هدف فعلی catalog رسمی sync شوند. وقتی عمداً می‌خواهید یک spec رسمی دقیق یا tag‌شده دست‌نخورده بماند، از `update <id>` هدفمند استفاده کنید.

    برای نصب‌های npm، می‌توانید یک spec صریح package npm با dist-tag یا نسخهٔ دقیق هم پاس بدهید. OpenClaw آن نام package را دوباره به رکورد Plugin ردیابی‌شده حل می‌کند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های آینده بر اساس شناسه ثبت می‌کند.

    پاس دادن نام package npm بدون نسخه یا tag هم دوباره به رکورد Plugin ردیابی‌شده حل می‌شود. وقتی یک Plugin به نسخهٔ دقیق pin شده و می‌خواهید آن را به خط انتشار پیش‌فرض registry برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال بتا">
    `openclaw plugins update <id-or-npm-spec>` هدفمند از spec ردیابی‌شدهٔ Plugin دوباره استفاده می‌کند، مگر اینکه spec جدیدی پاس بدهید. `openclaw plugins update --all` دسته‌ای هنگام sync کردن رکوردهای Plugin رسمی مورداعتماد با هدف catalog رسمی، از `update.channel` پیکربندی‌شده استفاده می‌کند، بنابراین نصب‌های کانال بتا می‌توانند به‌جای اینکه بی‌صدا به stable/latest نرمال‌سازی شوند، روی خط انتشار بتا بمانند.

    `openclaw update` کانال به‌روزرسانی فعال OpenClaw را هم می‌شناسد: روی کانال بتا، رکوردهای Plugin مربوط به npm و ClawHub با خط پیش‌فرض ابتدا `@beta` را امتحان می‌کنند. اگر هیچ انتشار بتای Plugin وجود نداشته باشد، به spec پیش‌فرض/latest ثبت‌شده برمی‌گردند؛ Pluginهای npm همچنین وقتی package بتا وجود دارد اما validation نصب را رد می‌کند هم fallback می‌کنند. آن fallback به‌عنوان هشدار گزارش می‌شود و به‌روزرسانی core را ناموفق نمی‌کند. نسخه‌های دقیق و tagهای صریح برای به‌روزرسانی‌های هدفمند روی همان selector pin‌شده می‌مانند.

  </Accordion>
  <Accordion title="بررسی نسخه و drift یکپارچگی">
    پیش از یک به‌روزرسانی زندهٔ npm، OpenClaw نسخهٔ package نصب‌شده را با فرادادهٔ registry npm بررسی می‌کند. اگر نسخهٔ نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف حل‌شده یکی باشند، به‌روزرسانی بدون download، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact دریافت‌شده تغییر کند، OpenClaw با آن به‌عنوان drift در artifact npm رفتار می‌کند. فرمان تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی fail closed می‌شوند، مگر اینکه caller یک سیاست ادامهٔ صریح فراهم کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install در به‌روزرسانی">
    `--dangerously-force-unsafe-install` برای سازگاری روی `plugins update` هم پذیرفته می‌شود، اما منسوخ شده و دیگر رفتار به‌روزرسانی Plugin را تغییر نمی‌دهد. `security.installPolicy` متعلق به operator همچنان می‌تواند به‌روزرسانی‌ها را block کند؛ hookهای `before_install` مربوط به Plugin فقط در فرایندهایی اعمال می‌شوند که hookهای Plugin بارگذاری شده‌اند.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk در به‌روزرسانی">
    به‌روزرسانی‌های Plugin پشتیبانی‌شده توسط ClawHub جامعه، پیش از download کردن package جایگزین، همان بررسی اعتماد exact-release نصب‌ها را اجرا می‌کنند. برای automation بازبینی‌شده‌ای که باید وقتی انتشار انتخاب‌شدهٔ ClawHub هشدار اعتماد پرریسک دارد ادامه پیدا کند، از `--acknowledge-clawhub-risk` استفاده کنید. Packageهای رسمی ClawHub و منابع Plugin باندل‌شدهٔ OpenClaw این prompt اعتماد به انتشار را دور می‌زنند.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect هویت، وضعیت load، منبع، قابلیت‌های manifest، flagهای سیاست، diagnostics، فرادادهٔ نصب، قابلیت‌های bundle، و هرگونه پشتیبانی تشخیص‌داده‌شدهٔ server مربوط به MCP یا LSP را به‌طور پیش‌فرض بدون import کردن runtime مربوط به Plugin نشان می‌دهد. خروجی JSON قراردادهای manifest Plugin را شامل می‌شود، مانند `contracts.agentToolResultMiddleware` و `contracts.trustedToolPolicies`، تا operatorها بتوانند declarationهای سطح مورداعتماد را پیش از فعال کردن یا restart کردن یک Plugin audit کنند. برای load کردن module Plugin و شامل کردن hookها، toolها، commandها، serviceها، methodهای Gateway، و routeهای HTTP ثبت‌شده، `--runtime` را اضافه کنید. بازرسی runtime وابستگی‌های گم‌شدهٔ Plugin را مستقیماً گزارش می‌کند؛ نصب‌ها و repairها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI متعلق به Plugin معمولاً به‌عنوان گروه‌های فرمان root در `openclaw` نصب می‌شوند، اما Pluginها ممکن است فرمان‌های nested را زیر یک parent core مانند `openclaw nodes` هم ثبت کنند. بعد از اینکه `inspect --runtime` یک فرمان را زیر `cliCommands` نشان داد، آن را در مسیر فهرست‌شده اجرا کنید؛ برای نمونه، Pluginی که `demo-git` را ثبت می‌کند با `openclaw demo-git ping` قابل بررسی است.

هر Plugin بر اساس چیزی که واقعاً در runtime ثبت می‌کند دسته‌بندی می‌شود:

- **قابلیت ساده** — یک نوع قابلیت، مثل Plugin فقط provider
- **قابلیت ترکیبی** — چند نوع قابلیت، مثل متن + گفتار + تصویر
- **فقط hook** — فقط hookها، بدون قابلیت یا سطح
- **بدون قابلیت** — toolها/commandها/serviceها اما بدون قابلیت

برای اطلاعات بیشتر دربارهٔ مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
flag `--json` گزارشی machine-readable مناسب scripting و auditing خروجی می‌دهد. `inspect --all` یک جدول fleet-wide با ستون‌های shape، انواع capability، noticeهای سازگاری، قابلیت‌های bundle، و خلاصهٔ hookها render می‌کند. `info` alias برای `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای load Plugin، diagnostics مربوط به manifest/discovery، noticeهای سازگاری، و ارجاع‌های stale پیکربندی Plugin مانند slotهای گم‌شدهٔ Plugin را گزارش می‌کند. وقتی درخت نصب و پیکربندی Plugin پاک باشند، `No plugin issues detected.` را چاپ می‌کند. اگر پیکربندی stale باقی مانده باشد اما درخت نصب از جهات دیگر سالم باشد، summary همین را می‌گوید، نه اینکه سلامت کامل Plugin را القا کند.

اگر یک Plugin پیکربندی‌شده روی disk وجود داشته باشد اما توسط بررسی‌های path-safety loader block شود، validation پیکربندی ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف پیکربندی `plugins.entries.<id>` یا `plugins.allow`، diagnostic قبلی مربوط به Plugin block‌شده را درست کنید، مانند مالکیت path یا permissionهای world-writable.

برای شکست‌های module-shape مانند exportهای گم‌شدهٔ `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا یک خلاصهٔ فشرده از export-shape در خروجی diagnostic اضافه شود.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry محلی Plugin، مدل خواندن سرد و پایدار OpenClaw برای هویت، فعال‌سازی، فرادادهٔ منبع، و مالکیت contribution مربوط به Pluginهای نصب‌شده است. startup عادی، lookup مالک provider، دسته‌بندی راه‌اندازی کانال، و inventory Plugin می‌توانند بدون import کردن moduleهای runtime مربوط به Plugin آن را بخوانند.

از `plugins registry` برای بررسی اینکه registry پایدار موجود، به‌روز، یا stale است استفاده کنید. از `--refresh` برای بازسازی آن از فهرست پایدار Plugin، سیاست پیکربندی، و فرادادهٔ manifest/package استفاده کنید. این یک مسیر repair است، نه مسیر فعال‌سازی runtime.

`openclaw doctor --fix` همچنین drift مدیریت‌شدهٔ npm در مجاورت registry را repair می‌کند: اگر یک package یتیم یا بازیابی‌شدهٔ `@openclaw/*` زیر یک پروژهٔ npm مدیریت‌شدهٔ Plugin یا ریشهٔ legacy flat managed npm یک Plugin باندل‌شده را shadow کند، doctor آن package stale را حذف می‌کند و registry را بازسازی می‌کند تا startup در برابر manifest باندل‌شده validate شود. Doctor همچنین package میزبان `openclaw` را به Pluginهای npm مدیریت‌شده‌ای که `peerDependencies.openclaw` اعلام می‌کنند دوباره link می‌کند، تا importهای runtime محلی package مانند `openclaw/plugin-sdk/*` پس از به‌روزرسانی‌ها یا repairهای npm resolve شوند.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک switch سازگاری break-glass منسوخ‌شده برای شکست‌های خواندن registry است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback مربوط به env فقط برای بازیابی startup اضطراری هنگام rollout migration است.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

فهرست بازارچه یک مسیر بازارچهٔ محلی، مسیر `marketplace.json`، کوتاه‌نویسی GitHub مانند `owner/repo`، نشانی مخزن GitHub، یا نشانی git را می‌پذیرد. `--json` برچسب منبع حل‌شده را همراه با مانیفست بازارچهٔ تجزیه‌شده و ورودی‌های Plugin چاپ می‌کند.

بازآوری بازارچه یک خوراک بازارچهٔ میزبانی‌شدهٔ OpenClaw را بارگیری می‌کند و پاسخ
اعتبارسنجی‌شده را به‌عنوان نماگرفت خوراک میزبانی‌شدهٔ محلی ذخیره می‌کند. بدون گزینه‌ها، از
پروفایل خوراک پیش‌فرض پیکربندی‌شده استفاده می‌کند. از `--feed-profile <name>` برای بازآوری یک
پروفایل پیکربندی‌شدهٔ مشخص، از `--feed-url <url>` برای بازآوری یک نشانی صریح خوراک
میزبانی‌شده، از `--expected-sha256 <sha256>` برای الزام به checksum همسان payload
(`sha256:<hex>` یا digest خام hex با ۶۴ نویسه)، و از `--json` برای
خروجی قابل‌خواندن برای ماشین استفاده کنید. نشانی‌های صریح خوراک میزبانی‌شده نباید شامل
credentials، query strings، یا fragments باشند. بازآوری‌های pinنشده می‌توانند یک
نتیجهٔ نماگرفت میزبانی‌شده یا fallback همراه‌بسته را بدون شکست فرمان گزارش کنند. بازآوری‌های
pinشده شکست می‌خورند مگر اینکه payload میزبانی‌شدهٔ تازه‌ای را بپذیرند، و بازآوری‌های میزبانی‌شدهٔ
موفق اگر OpenClaw نتواند نماگرفت اعتبارسنجی‌شده را ذخیره کند شکست می‌خورند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [ClawHub](/fa/clawhub)

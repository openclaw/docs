---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید یک Plugin ابزار ساده را داربست‌بندی یا اعتبارسنجی کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (init، build، validate، list، install، marketplace، uninstall، enable/disable، doctor)
title: Pluginها
x-i18n:
    generated_at: "2026-06-28T22:33:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های hook و bundleهای سازگار.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی و عیب‌یابی Pluginها.
  </Card>
  <Card title="Manage plugins" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست‌کردن، به‌روزرسانی، حذف نصب و انتشار.
  </Card>
  <Card title="Plugin bundles" href="/fa/plugins/bundles">
    مدل سازگاری bundle.
  </Card>
  <Card title="Plugin manifest" href="/fa/plugins/manifest">
    فیلدهای مانیفست و طرح‌واره پیکربندی.
  </Card>
  <Card title="Security" href="/fa/gateway/security">
    سخت‌سازی امنیتی برای نصب Pluginها.
  </Card>
</CardGroup>

## فرمان‌ها

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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
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

برای بررسی نصب، بازرسی، حذف نصب، یا تازه‌سازی رجیستری که کند است، فرمان را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی مرحله‌ها را در stderr می‌نویسد و خروجی JSON را قابل تجزیه نگه می‌دارد. [عیب‌یابی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییر‌دهنده‌های چرخه عمر Plugin غیرفعال هستند. برای این نصب، به‌جای `plugins install`، `plugins update`، `plugins uninstall`، `plugins enable`، یا `plugins disable` از منبع Nix استفاده کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) مبتنی بر agent استفاده کنید.
</Note>

<Note>
Pluginهای همراه با OpenClaw عرضه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه و Plugin مرورگر همراه)؛ بقیه به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. bundleهای سازگار در عوض از مانیفست‌های bundle خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی مفصل list/info همچنین زیرنوع bundle (`codex`، `claude`، یا `cursor`) به‌همراه قابلیت‌های bundle شناسایی‌شده را نشان می‌دهد.
</Note>

### نویسنده

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` به‌صورت پیش‌فرض یک Plugin ابزار TypeScript حداقلی ایجاد می‌کند. آرگومان اول شناسه Plugin است؛ برای نام نمایشی، `--name` را پاس دهید. OpenClaw از شناسه برای پوشه خروجی پیش‌فرض و نام‌گذاری بسته استفاده می‌کند. داربست‌های ابزار از `defineToolPlugin` استفاده می‌کنند.
`plugins build` ورودی ساخته‌شده را import می‌کند، فراداده ایستای ابزار آن را می‌خواند، `openclaw.plugin.json` را می‌نویسد و `package.json` `openclaw.extensions` را همگام نگه می‌دارد.
`plugins validate` بررسی می‌کند که مانیفست تولیدشده، فراداده بسته و export ورودی فعلی همچنان با هم سازگار باشند. برای جریان کاری کامل نگارش ابزار، [Pluginهای ابزار](/fa/plugins/tool-plugins) را ببینید.

داربست، منبع TypeScript را می‌نویسد اما فراداده را از ورودی ساخته‌شده `./dist/index.js` تولید می‌کند تا این جریان کاری با CLI منتشرشده نیز کار کند. وقتی ورودی، ورودی پیش‌فرض بسته نیست، از `--entry <path>` استفاده کنید. در CI از `plugins build --check` استفاده کنید تا وقتی فراداده تولیدشده بدون بازنویسی فایل‌ها کهنه است، شکست بخورد.

### داربست ارائه‌دهنده

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

داربست‌های ارائه‌دهنده، یک Plugin عمومی ارائه‌دهنده متن/مدل با سیم‌کشی کلید API سازگار با OpenAI، یک اسکریپت داخلی `npm run validate` برای `clawhub package validate`، فراداده بسته ClawHub و یک workflow دستی GitHub برای انتشار مطمئن آینده از طریق GitHub Actions OIDC ایجاد می‌کنند. داربست‌های ارائه‌دهنده Skills تولید نمی‌کنند و از `openclaw plugins build` یا `openclaw plugins validate` استفاده نمی‌کنند؛ این فرمان‌ها برای مسیر فراداده تولیدشده داربست ابزار هستند.

پیش از انتشار، نشانی پایه API نگه‌دارنده، کاتالوگ مدل، مسیر مستندات، متن اعتبارنامه و متن README را با جزئیات واقعی ارائه‌دهنده جایگزین کنید. برای انتشار نخستین‌بار در ClawHub و راه‌اندازی ناشر مطمئن، از README تولیدشده استفاده کنید.

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

نگه‌دارندگان هنگام آزمودن نصب‌های زمان راه‌اندازی می‌توانند منابع نصب خودکار Plugin را با متغیرهای محیطی محافظت‌شده بازنویسی کنند. [بازنویسی‌های نصب Plugin](/fa/plugins/install-overrides) را ببینید.

<Warning>
نام‌های بسته بدون پیشوند، در دوره گذار راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند، مگر اینکه با شناسه یک Plugin رسمی مطابقت داشته باشند. مشخصات خام بسته `@openclaw/*` که با Pluginهای همراه مطابقت دارند، از نسخه همراهی استفاده می‌کنند که با build فعلی OpenClaw عرضه شده است. وقتی عمدا یک بسته npm خارجی می‌خواهید، از `npm:<package>` استفاده کنید. برای ClawHub از `clawhub:<package>` استفاده کنید. با نصب Pluginها مانند اجرای کد برخورد کنید. نسخه‌های pin‌شده را ترجیح دهید.
</Warning>

`plugins search` برای بسته‌های Plugin قابل نصب، ClawHub را query می‌کند و نام بسته‌های آماده نصب را چاپ می‌کند. این فرمان بسته‌های code-plugin و bundle-plugin را جست‌وجو می‌کند، نه skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. Npm همچنان یک مسیر fallback و نصب مستقیم پشتیبانی‌شده باقی می‌ماند. بسته‌های Plugin متعلق به OpenClaw با نام `@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا [موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند. نصب‌ها و به‌روزرسانی‌های کانال بتا وقتی npm dist-tag با نام `beta` در دسترس باشد، آن را ترجیح می‌دهند و سپس به `latest` fallback می‌کنند.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` در همان فایل include‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای ریشه، آرایه‌های include و includeهایی با بازنویسی‌های sibling به‌جای تخت‌سازی، به‌صورت fail closed شکست می‌خورند. برای شکل‌های پشتیبانی‌شده، [Config includes](/fa/gateway/configuration) را ببینید.

    اگر هنگام نصب، پیکربندی نامعتبر باشد، `plugins install` معمولا به‌صورت fail closed شکست می‌خورد و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. در زمان راه‌اندازی Gateway و hot reload، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگر به‌صورت fail closed شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر Plugin را قرنطینه کند. تنها استثنای مستندشده زمان نصب، یک مسیر بازیابی محدود برای Plugin همراه است، برای Pluginهایی که صراحتا `openclaw.install.allowInvalidConfigRecovery` را انتخاب می‌کنند.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` از هدف نصب موجود دوباره استفاده می‌کند و یک Plugin یا بسته hook ازقبل‌نصب‌شده را درجا بازنویسی می‌کند. وقتی عمدا همان شناسه را از یک مسیر محلی جدید، آرشیو، بسته ClawHub، یا artifact npm دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل پیگیری می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای شناسه Pluginای اجرا کنید که از قبل نصب شده است، OpenClaw متوقف می‌شود و برای یک ارتقای معمول شما را به `plugins update <id-or-npm-spec>` راهنمایی می‌کند، یا وقتی واقعا می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید، به `plugins install <package> --force` اشاره می‌کند.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pin‌شده می‌خواهید، از یک ref صریح git مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای مشخصه npm، فراداده منبع marketplace را پایدار می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` منسوخ شده و اکنون no-op است. OpenClaw دیگر مسدودسازی داخلی کد خطرناک در زمان نصب را برای نصب Pluginها اجرا نمی‌کند.

    وقتی سیاست نصب خاص میزبان لازم است، از سطح مشترک و متعلق به operator با نام `security.installPolicy` استفاده کنید. hookهای Plugin با نام `before_install`، hookهای چرخه عمر runtime Plugin هستند و مرز سیاست اصلی برای نصب‌های CLI نیستند.

    اگر Pluginای که در ClawHub منتشر کرده‌اید با یک اسکن رجیستری پنهان یا مسدود شده است، از مراحل ناشر در [انتشار ClawHub](/fa/clawhub/publishing) استفاده کنید. `--dangerously-force-unsafe-install` از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا یک انتشار مسدودشده را عمومی کند.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    نصب‌های جامعه ClawHub پیش از دانلود بسته، رکورد اعتماد انتشار انتخاب‌شده را بررسی می‌کنند. اگر ClawHub دانلود را برای انتشار غیرفعال کند، یافته‌های اسکن مخرب گزارش کند، یا انتشار را در یک وضعیت moderation مسدودکننده مانند قرنطینه قرار دهد، OpenClaw آن انتشار را رد می‌کند. برای وضعیت‌های اسکن پرخطر اما غیرمسدودکننده، وضعیت‌های moderation پرخطر، یا دلایل رجیستری، OpenClaw جزئیات اعتماد را نشان می‌دهد و پیش از ادامه، تایید می‌خواهد.

    فقط پس از بازبینی هشدار ClawHub و تصمیم به ادامه بدون prompt تعاملی، از `--acknowledge-clawhub-risk` استفاده کنید. رکوردهای اعتماد پاکِ در انتظار یا کهنه هشدار می‌دهند اما به تایید نیاز ندارند. بسته‌های رسمی ClawHub و منابع Plugin همراه OpenClaw این prompt اعتماد انتشار را دور می‌زنند.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای مشاهده hookهای فیلترشده و فعال‌سازی جداگانه هر hook، از `openclaw hooks` استفاده کنید، نه نصب بسته.

    مشخصه‌های npm **فقط-رجیستری** هستند (نام بسته + **نسخه دقیق** اختیاری یا **dist-tag** اختیاری). مشخصه‌های Git/URL/file و بازه‌های semver رد می‌شوند. نصب وابستگی‌ها در یک پروژه npm مدیریت‌شده برای هر Plugin با `--ignore-scripts` برای ایمنی اجرا می‌شود، حتی وقتی shell شما تنظیمات نصب npm سراسری دارد. پروژه‌های npm مدیریت‌شده Plugin، `overrides` سطح بسته npm مربوط به OpenClaw را به ارث می‌برند، بنابراین pinهای امنیتی میزبان روی وابستگی‌های hoist‌شده Plugin هم اعمال می‌شوند.

    وقتی می‌خواهید resolution npm را صریح کنید، از `npm:<package>` استفاده کنید. مشخصه‌های بسته بدون پیشوند نیز در دوره انتقال راه‌اندازی، مگر اینکه با یک شناسه Plugin رسمی مطابقت داشته باشند، مستقیما از npm نصب می‌شوند.

    مشخصه‌های خام بسته `@openclaw/*` که با Pluginهای بسته‌بندی‌شده مطابقت دارند، پیش از fallback به npm به نسخه بسته‌بندی‌شده تحت مالکیت image resolve می‌شوند. برای مثال، `openclaw plugins install @openclaw/discord@2026.5.20 --pin` به‌جای ساخت یک override مدیریت‌شده npm، از Plugin بسته‌بندی‌شده Discord در build فعلی OpenClaw استفاده می‌کند. برای اجبار به استفاده از بسته npm خارجی، از `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` استفاده کنید.

    مشخصه‌های بدون پیشوند و `@latest` روی مسیر پایدار می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` برای این بررسی، انتشار پایدار محسوب می‌شوند. اگر npm هرکدام از آن‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک تگ prerelease مانند `@beta`/`@rc` یا یک نسخه دقیق prerelease مانند `@1.2.3-beta.4` صریحا انتخاب کنید.

    برای نصب‌های npm بدون نسخه دقیق (`npm:<package>` یا `npm:<package>@latest`)، OpenClaw پیش از نصب، metadata بسته resolve‌شده را بررسی می‌کند. اگر آخرین بسته پایدار به API جدیدتر Plugin در OpenClaw یا حداقل نسخه میزبان جدیدتری نیاز داشته باشد، OpenClaw نسخه‌های پایدار قدیمی‌تر را بررسی می‌کند و به‌جای آن جدیدترین انتشار سازگار را نصب می‌کند. نسخه‌های دقیق و dist-tagهای صریح مانند `@beta` سخت‌گیرانه باقی می‌مانند: اگر بسته انتخاب‌شده ناسازگار باشد، فرمان شکست می‌خورد و از شما می‌خواهد OpenClaw را ارتقا دهید یا نسخه‌ای سازگار انتخاب کنید.

    اگر یک مشخصه نصب بدون پیشوند با شناسه Plugin رسمی مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی کاتالوگ را مستقیما نصب می‌کند. برای نصب یک بسته npm با همان نام، از یک مشخصه scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    برای نصب مستقیم از یک مخزن git، از `git:<repo>` استفاده کنید. قالب‌های پشتیبانی‌شده شامل URLهای clone به‌شکل `git:github.com/owner/repo`، `git:owner/repo`، `https://` کامل، `ssh://`، `git://`، `file://` و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` را اضافه کنید.

    نصب‌های Git در یک directory موقت clone می‌شوند، در صورت وجود ref درخواستی آن را checkout می‌کنند، سپس از نصب‌کننده معمول directory Plugin استفاده می‌کنند. یعنی اعتبارسنجی manifest، سیاست نصب operator، کار نصب package-manager و recordهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های ثبت‌شده git شامل URL/ref منبع به‌همراه commit resolve‌شده هستند تا `openclaw plugins update` بتواند بعدا منبع را دوباره resolve کند.

    پس از نصب از git، از `openclaw plugins inspect <id> --runtime --json` استفاده کنید تا registrationهای runtime مانند methodهای gateway و فرمان‌های CLI را تأیید کنید. اگر Plugin یک root CLI را با `api.registerCli` ثبت کرده باشد، آن فرمان را مستقیما از طریق CLI ریشه OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. archiveهای بومی Plugin در OpenClaw باید در root استخراج‌شده Plugin یک `openclaw.plugin.json` معتبر داشته باشند؛ archiveهایی که فقط `package.json` دارند پیش از اینکه OpenClaw recordهای نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball از npm-pack است و می‌خواهید همان مسیر پروژه npm مدیریت‌شده برای هر Plugin را که نصب‌های رجیستری استفاده می‌کنند آزمایش کنید، از `npm-pack:<path.tgz>` استفاده کنید؛ این شامل تأیید `package-lock.json`، اسکن وابستگی‌های hoist‌شده و recordهای نصب npm است. مسیرهای archive ساده همچنان به‌عنوان archiveهای local زیر root افزونه‌های Plugin نصب می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

مشخصه‌های Plugin بدون پیشوند که برای npm معتبر هستند، در دوره انتقال راه‌اندازی به‌طور پیش‌فرض از npm نصب می‌شوند، مگر اینکه با یک شناسه Plugin رسمی مطابقت داشته باشند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح کردن resolution فقط از npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، سازگاری API تبلیغ‌شده Plugin / حداقل gateway را بررسی می‌کند. وقتی نسخه انتخاب‌شده ClawHub یک artifact از ClawPack منتشر می‌کند، OpenClaw فایل npm-pack نسخه‌دار `.tgz` را دانلود می‌کند، header digest مربوط به ClawHub و digest مربوط به artifact را تأیید می‌کند، سپس آن را از مسیر معمول archive نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون metadata مربوط به ClawPack همچنان از مسیر legacy تأیید archive بسته نصب می‌شوند. نصب‌های ثبت‌شده، metadata منبع ClawHub، نوع artifact، integrity مربوط به npm، shasum مربوط به npm، نام tarball و facts مربوط به digest در ClawPack را برای updateهای بعدی نگه می‌دارند.
نصب‌های ClawHub بدون نسخه، یک مشخصه ثبت‌شده بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند releaseهای جدیدتر ClawHub را دنبال کند؛ selectorهای نسخه یا tag صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` به همان selector pin می‌مانند.

#### میان‌بر marketplace

وقتی نام marketplace در cache رجیستری local مربوط به Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از میان‌بر `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع marketplace را صریحا پاس دهید، از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - نام known-marketplace مربوط به Claude از `~/.claude/plugins/known_marketplaces.json`
    - root محلی marketplace یا مسیر `marketplace.json`
    - shorthand مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL مربوط به git

  </Tab>
  <Tab title="Remote marketplace rules">
    برای marketplaceهای remote که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند. OpenClaw منابع مسیر relative از آن مخزن را می‌پذیرد و منابع HTTP(S)، مسیر absolute، git، GitHub و دیگر منابع غیرمسیر Plugin را از manifestهای remote رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و archiveهای local، OpenClaw به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- bundleهای سازگار با Codex (`.codex-plugin/plugin.json`)
- bundleهای سازگار با Claude (`.claude-plugin/plugin.json` یا layout پیش‌فرض componentهای Claude)
- bundleهای سازگار با Cursor (`.cursor-plugin/plugin.json`)

نصب‌های local مدیریت‌شده باید directory یا archiveهای Plugin باشند. فایل‌های مستقل Plugin با پسوند `.js`،
`.mjs`، `.cjs` و `.ts` توسط `plugins install` در root مدیریت‌شده Plugin کپی نمی‌شوند؛ به‌جای آن، آن‌ها را صریحا در `plugins.load.paths` فهرست کنید.

<Note>
bundleهای سازگار در root معمول Plugin نصب می‌شوند و در همان flow مربوط به list/info/enable/disable شرکت می‌کنند. امروز، skillsهای bundle، command-skills مربوط به Claude، defaultهای `settings.json` در Claude، defaultهای `.lsp.json` مربوط به Claude / `lspServers` اعلام‌شده در manifest، command-skills مربوط به Cursor و directoryهای hook سازگار با Codex پشتیبانی می‌شوند؛ قابلیت‌های bundle دیگری که تشخیص داده شوند در diagnostics/info نشان داده می‌شوند اما هنوز به اجرای runtime متصل نشده‌اند.
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
  فقط Pluginهای enabled را نشان بده.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خط‌های جزئیات برای هر Plugin با metadata مربوط به source/origin/version/activation تغییر بده.
</ParamField>
<ParamField path="--json" type="boolean">
  inventory قابل خواندن توسط ماشین به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری local پایدارشده Plugin را می‌خواند و وقتی رجیستری وجود ندارد یا نامعتبر است، از fallback مشتق‌شده فقط از manifest استفاده می‌کند. این برای بررسی اینکه آیا یک Plugin نصب، enabled و برای برنامه‌ریزی cold startup قابل مشاهده است مفید است، اما probe زنده runtime از یک فرایند Gateway که از قبل در حال اجراست نیست. پس از تغییر code مربوط به Plugin، enablement، سیاست hook یا `plugins.load.paths`، پیش از انتظار برای اجرای code جدید `register(api)` یا hookها، Gatewayای را که به channel سرویس می‌دهد restart کنید. برای deploymentهای remote/container، تأیید کنید که child واقعی `openclaw gateway run` را restart می‌کنید، نه فقط یک فرایند wrapper.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `dependencies` و `optionalDependencies` در `package.json` است. OpenClaw بررسی می‌کند که آیا نام‌های آن بسته‌ها در مسیر lookup معمول Node `node_modules` مربوط به Plugin وجود دارند یا نه؛ code runtime مربوط به Plugin را import نمی‌کند، package manager اجرا نمی‌کند و وابستگی‌های missing را repair نمی‌کند.
</Note>

اگر startup لاگ کند `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`،
برای تأیید شناسه‌های Plugin، `openclaw plugins list --enabled --verbose` یا
`openclaw plugins inspect <id>` را با یک شناسه Plugin فهرست‌شده اجرا کنید و شناسه‌های مورد اعتماد را در `plugins.allow` داخل `openclaw.json` کپی کنید. وقتی warning بتواند همه Pluginهای کشف‌شده را فهرست کند، یک snippet آماده برای paste مربوط به `plugins.allow` چاپ می‌کند که از قبل شامل آن شناسه‌هاست. اگر یک Plugin بدون provenance مربوط به install/load-path بارگذاری شود، آن شناسه Plugin را inspect کنید، سپس یا شناسه مورد اعتماد را در `plugins.allow` pin کنید یا Plugin را از یک منبع مورد اعتماد دوباره نصب کنید تا OpenClaw provenance نصب را ثبت کند.

`plugins search` یک lookup کاتالوگ remote در ClawHub است. وضعیت local را inspect نمی‌کند، config را mutate نمی‌کند، بسته‌ها را نصب نمی‌کند یا code runtime مربوط به Plugin را load نمی‌کند. نتایج جست‌وجو شامل نام بسته ClawHub، family، channel، version، summary و یک hint نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Pluginهای بسته‌بندی‌شده داخل یک image بسته‌بندی‌شده Docker، directory منبع Plugin را روی مسیر منبع بسته‌بندی‌شده مطابق آن bind-mount کنید، مانند `/app/extensions/synology-chat`. OpenClaw آن overlay منبع mount‌شده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک directory منبع که صرفا کپی شده باشد inert باقی می‌ماند تا نصب‌های بسته‌بندی‌شده معمول همچنان از dist کامپایل‌شده استفاده کنند.

برای debugging hook در runtime:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics را از یک pass inspection با module-loaded نشان می‌دهد. inspection در runtime هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت legacy وابستگی یا recovery کردن Pluginهای قابل دانلود missing که توسط config ارجاع شده‌اند، از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` پروفایل/URL قابل دسترس Gateway، hintهای service/process، مسیر config و سلامت RPC را تأیید می‌کند.
- hookهای مکالمه non-bundled (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی کردن یک directory local مربوط به Plugin از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

فایل‌های مستقل Plugin باید به‌جای نصب شدن با `plugins install` یا قرار گرفتن مستقیم در `~/.openclaw/extensions` یا `<workspace>/.openclaw/extensions`، در `plugins.load.paths` فهرست شوند. آن rootهای auto-discovered، directoryهای package یا bundle مربوط به Plugin را load می‌کنند، درحالی‌که فایل‌های script سطح بالا به‌عنوان helperهای local تلقی و skip می‌شوند.

<Note>
Pluginهای با منشأ workspace که از ریشه extensions یک workspace کشف می‌شوند تا زمانی که صریحاً فعال نشده باشند
import یا اجرا نمی‌شوند. برای توسعه محلی،
`openclaw plugins enable <plugin-id>` را اجرا کنید یا
`plugins.entries.<plugin-id>.enabled: true` را تنظیم کنید؛ اگر پیکربندی شما از
`plugins.allow` استفاده می‌کند، همان شناسه Plugin را آنجا هم درج کنید. این قاعده fail-closed
همچنین وقتی اعمال می‌شود که راه‌اندازی کانال صریحاً یک Plugin با منشأ workspace را برای
بارگذاری صرفاً جهت راه‌اندازی هدف بگیرد، بنابراین کد راه‌اندازی Plugin کانال محلی تا وقتی آن
Plugin workspace غیرفعال بماند یا از allowlist کنار گذاشته شود اجرا نخواهد شد. نصب‌های لینک‌شده
و ورودی‌های صریح `plugins.load.paths` از سیاست عادی برای منشأ Plugin
حل‌شده خود پیروی می‌کنند. ببینید
[پیکربندی سیاست Plugin](/fa/tools/plugin#configure-plugin-policy)
و [مرجع پیکربندی](/fa/gateway/configuration-reference#plugins).

`--force` همراه با `--link` پشتیبانی نمی‌شود، زیرا نصب‌های لینک‌شده به‌جای کپی کردن روی یک هدف نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کنند.

برای نصب‌های npm از `--pin` استفاده کنید تا spec دقیق حل‌شده (`name@version`) در شاخص Plugin مدیریت‌شده ذخیره شود، در حالی که رفتار پیش‌فرض unpinned باقی می‌ماند.
</Note>

### شاخص Plugin

فراداده نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه پیکربندی کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در پایگاه داده وضعیت SQLite مشترک، زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. ردیف `installed_plugin_index` فراداده پایدار `installRecords` را ذخیره می‌کند، از جمله رکوردهای manifestهای خراب یا گمشده Plugin، به‌همراه یک cache سرد registry مشتق‌شده از manifest که توسط `openclaw plugins update`، حذف نصب، diagnostics، و registry سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای legacy ارسال‌شده `plugins.installs` را در پیکربندی ببیند، خواندن‌های runtime با آن‌ها به‌عنوان ورودی سازگاری رفتار می‌کنند بدون اینکه `openclaw.json` را بازنویسی کنند. نوشتن‌های صریح Plugin و `openclaw doctor --fix` آن رکوردها را به شاخص Plugin منتقل می‌کنند و وقتی نوشتن پیکربندی مجاز باشد، کلید پیکربندی را حذف می‌کنند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، رکوردهای پیکربندی نگه داشته می‌شوند تا فراداده نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، شاخص پایدار Plugin، ورودی‌های فهرست allow/deny Plugin، و ورودی‌های لینک‌شده `plugins.load.paths` در صورت کاربرد حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شده رهگیری‌شده را وقتی داخل ریشه extensions مربوط به Pluginهای OpenClaw باشد حذف می‌کند. برای Pluginهای active memory، slot حافظه به `memory-core` بازنشانی می‌شود.

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

به‌روزرسانی‌ها روی نصب‌های Plugin رهگیری‌شده در شاخص Plugin مدیریت‌شده و نصب‌های hook-pack رهگیری‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="حل شناسه Plugin در برابر npm spec">
    وقتی یک شناسه Plugin می‌دهید، OpenClaw از spec نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شده قبلی مانند `@beta` و نسخه‌های دقیق pinned همچنان در اجراهای بعدی `update <id>` استفاده می‌شوند.

    هنگام `update <id> --dry-run`، نصب‌های npm دقیق pinned همچنان pinned می‌مانند. اگر OpenClaw همچنین بتواند خط پیش‌فرض registry آن بسته را حل کند و آن خط پیش‌فرض از نسخه pinned نصب‌شده جدیدتر باشد، dry run وضعیت pin را گزارش می‌کند و فرمان صریح به‌روزرسانی بسته `@latest` را برای دنبال کردن خط پیش‌فرض registry چاپ می‌کند.

    آن قاعده به‌روزرسانی هدفمند با مسیر نگهداری گروهی `openclaw plugins update --all` متفاوت است. به‌روزرسانی‌های گروهی همچنان به specهای نصب رهگیری‌شده عادی احترام می‌گذارند، اما رکوردهای Plugin رسمی قابل‌اعتماد OpenClaw می‌توانند به‌جای ماندن روی یک بسته رسمی دقیق منسوخ، با هدف فعلی catalog رسمی همگام شوند. وقتی عمداً می‌خواهید یک spec رسمی دقیق یا tagged دست‌نخورده بماند، از `update <id>` هدفمند استفاده کنید.

    برای نصب‌های npm، همچنین می‌توانید یک spec صریح بسته npm با dist-tag یا نسخه دقیق بدهید. OpenClaw آن نام بسته را به رکورد Plugin رهگیری‌شده برمی‌گرداند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های آینده مبتنی بر شناسه ثبت می‌کند.

    دادن نام بسته npm بدون نسخه یا tag نیز به رکورد Plugin رهگیری‌شده برمی‌گردد. وقتی یک Plugin به نسخه‌ای دقیق pinned شده و می‌خواهید آن را به خط انتشار پیش‌فرض registry برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال beta">
    `openclaw plugins update <id-or-npm-spec>` هدفمند از spec Plugin رهگیری‌شده دوباره استفاده می‌کند مگر اینکه spec جدیدی بدهید. `openclaw plugins update --all` گروهی وقتی رکوردهای Plugin رسمی قابل‌اعتماد را با هدف catalog رسمی همگام می‌کند از `update.channel` پیکربندی‌شده استفاده می‌کند، بنابراین نصب‌های کانال beta می‌توانند به‌جای اینکه بی‌صدا به stable/latest نرمال‌سازی شوند، روی خط انتشار beta بمانند.

    `openclaw update` همچنین کانال به‌روزرسانی فعال OpenClaw را می‌شناسد: روی کانال beta، رکوردهای Plugin مربوط به npm خط پیش‌فرض و ClawHub ابتدا `@beta` را امتحان می‌کنند. اگر انتشار beta برای Plugin وجود نداشته باشد به spec پیش‌فرض/latest ثبت‌شده برمی‌گردند؛ Pluginهای npm همچنین وقتی بسته beta وجود دارد اما اعتبارسنجی نصب را رد می‌کند fallback می‌کنند. آن fallback به‌عنوان هشدار گزارش می‌شود و به‌روزرسانی core را fail نمی‌کند. نسخه‌های دقیق و tagهای صریح برای به‌روزرسانی‌های هدفمند به همان selector pinned می‌مانند.

  </Accordion>
  <Accordion title="بررسی نسخه و drift یکپارچگی">
    پیش از یک به‌روزرسانی زنده npm، OpenClaw نسخه بسته نصب‌شده را با فراداده registry npm بررسی می‌کند. اگر نسخه نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف حل‌شده یکی باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact واکشی‌شده تغییر کند، OpenClaw آن را drift در artifact npm در نظر می‌گیرد. فرمان تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی fail closed می‌شوند مگر اینکه caller یک سیاست ادامه صریح فراهم کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install در به‌روزرسانی">
    `--dangerously-force-unsafe-install` برای سازگاری روی `plugins update` نیز پذیرفته می‌شود، اما منسوخ شده و دیگر رفتار به‌روزرسانی Plugin را تغییر نمی‌دهد. `security.installPolicy` مربوط به operator همچنان می‌تواند به‌روزرسانی‌ها را مسدود کند؛ hookهای `before_install` مربوط به Plugin فقط در فرایندهایی اعمال می‌شوند که hookهای Plugin در آن‌ها بارگذاری شده‌اند.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk در به‌روزرسانی">
    به‌روزرسانی‌های Pluginهای جامعه که پشتوانه ClawHub دارند، پیش از دانلود بسته جایگزین، همان بررسی اعتماد exact-release نصب‌ها را اجرا می‌کنند. برای automation بازبینی‌شده‌ای که باید وقتی انتشار انتخاب‌شده ClawHub هشدار اعتماد پرریسک دارد ادامه دهد، از `--acknowledge-clawhub-risk` استفاده کنید. بسته‌های رسمی ClawHub و منابع Plugin بسته‌بندی‌شده OpenClaw این prompt اعتماد انتشار را دور می‌زنند.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect به‌صورت پیش‌فرض بدون import کردن runtime Plugin، identity، وضعیت load، source، قابلیت‌های manifest، flagهای policy، diagnostics، فراداده نصب، قابلیت‌های bundle، و هر پشتیبانی شناسایی‌شده از سرور MCP یا LSP را نشان می‌دهد. خروجی JSON شامل قراردادهای manifest مربوط به Plugin است، مانند `contracts.agentToolResultMiddleware` و `contracts.trustedToolPolicies`، تا operatorها بتوانند پیش از فعال‌سازی یا restart یک Plugin، اعلان‌های سطح قابل‌اعتماد را audit کنند. برای load کردن ماژول Plugin و درج hookها، tools، commands، services، gateway methods، و HTTP routes ثبت‌شده، `--runtime` را اضافه کنید. بازرسی runtime وابستگی‌های گمشده Plugin را مستقیم گزارش می‌کند؛ نصب‌ها و repairها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI مالکیت‌شده توسط Plugin معمولاً به‌عنوان گروه‌های فرمان root `openclaw` نصب می‌شوند، اما Pluginها همچنین می‌توانند فرمان‌های تو در تو را زیر یک والد core مانند `openclaw nodes` ثبت کنند. پس از اینکه `inspect --runtime` یک فرمان را زیر `cliCommands` نشان داد، آن را در مسیر فهرست‌شده اجرا کنید؛ برای مثال Pluginی که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin بر اساس چیزی که واقعاً در runtime ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت، مثلاً یک Plugin فقط provider
- **hybrid-capability** — چند نوع قابلیت، مثلاً متن + گفتار + تصویر
- **hook-only** — فقط hookها، بدون قابلیت یا سطح
- **non-capability** — tools/commands/services اما بدون قابلیت

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
flag `--json` گزارشی machine-readable مناسب برای اسکریپت‌نویسی و audit خروجی می‌دهد. `inspect --all` یک جدول در سطح fleet با ستون‌های shape، گونه‌های capability، اطلاعیه‌های سازگاری، قابلیت‌های bundle، و خلاصه hook رندر می‌کند. `info` یک alias برای `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای load مربوط به Plugin، diagnosticsهای manifest/discovery، اطلاعیه‌های سازگاری، و ارجاع‌های پیکربندی stale Plugin مانند slotهای گمشده Plugin را گزارش می‌کند. وقتی درخت نصب و پیکربندی Plugin پاک باشند، `No plugin issues detected.` را چاپ می‌کند. اگر پیکربندی stale باقی مانده باشد اما درخت نصب در غیر این صورت سالم باشد، خلاصه به‌جای القای سلامت کامل Plugin همین را می‌گوید.

اگر یک Plugin پیکربندی‌شده روی disk حاضر باشد اما توسط بررسی‌های path-safety loader مسدود شود، اعتبارسنجی پیکربندی ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف پیکربندی `plugins.entries.<id>` یا `plugins.allow`، diagnostic قبلی Plugin مسدودشده، مانند مالکیت مسیر یا مجوزهای world-writable را رفع کنید.

برای خرابی‌های module-shape مانند exportهای گمشده `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا یک خلاصه فشرده export-shape در خروجی diagnostic درج شود.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

registry محلی Plugin مدل read سرد پایدار OpenClaw برای identity، enablement، فراداده source، و مالکیت contribution مربوط به Plugin نصب‌شده است. startup عادی، lookup مالک provider، طبقه‌بندی راه‌اندازی کانال، و inventory Plugin می‌توانند بدون import کردن ماژول‌های runtime Plugin آن را بخوانند.

از `plugins registry` برای بررسی اینکه registry پایدار موجود، فعلی، یا stale است استفاده کنید. از `--refresh` برای بازسازی آن از شاخص پایدار Plugin، policy پیکربندی، و فراداده manifest/package استفاده کنید. این یک مسیر repair است، نه مسیر فعال‌سازی runtime.

`openclaw doctor --fix` همچنین drift مدیریت‌شده npm نزدیک به registry را repair می‌کند: اگر یک بسته orphaned یا recovered از نوع `@openclaw/*` زیر یک پروژه npm مدیریت‌شده Plugin یا ریشه flat مدیریت‌شده legacy npm، یک Plugin بسته‌بندی‌شده را shadow کند، doctor آن بسته stale را حذف می‌کند و registry را بازسازی می‌کند تا startup بر اساس manifest بسته‌بندی‌شده اعتبارسنجی شود. Doctor همچنین بسته host `openclaw` را در Pluginهای npm مدیریت‌شده‌ای که `peerDependencies.openclaw` اعلام می‌کنند relink می‌کند، تا importهای runtime محلی بسته مانند `openclaw/plugin-sdk/*` پس از به‌روزرسانی‌ها یا repairهای npm resolve شوند.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک سوییچ سازگاری break-glass منسوخ‌شده برای خرابی‌های خواندن registry است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback env فقط برای بازیابی اضطراری startup هنگام rollout شدن migration است.
</Warning>

### بازارچه

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

`plugins marketplace entries` ورودی‌های خوراک بازارچه پیکربندی‌شده OpenClaw را فهرست می‌کند. به‌طور پیش‌فرض، خوراک میزبانی‌شده را امتحان می‌کند و در صورت نیاز به تازه‌ترین نماگرفت پذیرفته‌شده یا داده‌های همراه بازمی‌گردد. برای خواندن یک پروفایل پیکربندی‌شده مشخص از `--feed-profile <name>`، برای خواندن یک URL صریح خوراک میزبانی‌شده از `--feed-url <url>`، و برای خواندن تازه‌ترین نماگرفت پذیرفته‌شده بدون واکشی خوراک از `--offline` استفاده کنید.

`plugins marketplace refresh` نماگرفت خوراک میزبانی‌شده پیکربندی‌شده را تازه‌سازی می‌کند و گزارش می‌دهد که آیا OpenClaw داده‌های میزبانی‌شده، یک نماگرفت میزبانی‌شده، یا داده‌های همراه جایگزین را پذیرفته است. وقتی فراخواننده لازم دارد دستور شکست بخورد مگر اینکه محتوای تازه میزبانی‌شده با یک جمع کنترلی ثابت‌شده مطابقت داشته باشد، از `--expected-sha256` استفاده کنید.

`list` بازارچه یک مسیر محلی بازارچه، مسیر `marketplace.json`، میان‌نویس GitHub مانند `owner/repo`، URL مخزن GitHub، یا URL git را می‌پذیرد. `--json` برچسب منبع حل‌شده را همراه با مانیفست بازارچه تجزیه‌شده و ورودی‌های Plugin چاپ می‌کند.

تازه‌سازی بازارچه یک خوراک میزبانی‌شده بازارچه OpenClaw را بار می‌کند و پاسخ
اعتبارسنجی‌شده را به‌عنوان نماگرفت محلی خوراک میزبانی‌شده ماندگار می‌کند. بدون گزینه‌ها، از
پروفایل خوراک پیش‌فرض پیکربندی‌شده استفاده می‌کند. برای تازه‌سازی یک
پروفایل پیکربندی‌شده مشخص از `--feed-profile <name>`، برای تازه‌سازی یک URL صریح
خوراک میزبانی‌شده از `--feed-url <url>`، برای الزام به مطابقت جمع کنترلی محتوا
(`sha256:<hex>` یا یک digest هگز ۶۴ نویسه‌ای ساده) از `--expected-sha256 <sha256>`،
و برای خروجی قابل‌خواندن توسط ماشین از `--json` استفاده کنید. URLهای صریح خوراک میزبانی‌شده نباید
شامل اطلاعات اعتبار، رشته‌های پرس‌وجو، یا fragment باشند. تازه‌سازی‌های بدون ثابت‌سازی می‌توانند نتیجه
نماگرفت میزبانی‌شده یا جایگزین همراه را بدون شکست دادن دستور گزارش کنند. تازه‌سازی‌های
ثابت‌شده شکست می‌خورند مگر اینکه یک محتوای تازه میزبانی‌شده را بپذیرند، و تازه‌سازی‌های موفق
میزبانی‌شده اگر OpenClaw نتواند نماگرفت اعتبارسنجی‌شده را ماندگار کند شکست می‌خورند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [ClawHub](/fa/clawhub)

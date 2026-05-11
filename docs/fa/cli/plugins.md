---
read_when:
    - می‌خواهید Plugin‌های Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginها
x-i18n:
    generated_at: "2026-05-11T20:29:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های hook، و bundleهای سازگار.

<CardGroup cols={2}>
  <Card title="سیستم Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی، و عیب‌یابی Pluginها.
  </Card>
  <Card title="مدیریت Pluginها" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست‌کردن، به‌روزرسانی، حذف نصب، و انتشار.
  </Card>
  <Card title="bundleهای Plugin" href="/fa/plugins/bundles">
    مدل سازگاری bundle.
  </Card>
  <Card title="manifest مربوط به Plugin" href="/fa/plugins/manifest">
    فیلدهای manifest و شِمای پیکربندی.
  </Card>
  <Card title="امنیت" href="/fa/gateway/security">
    سخت‌سازی امنیتی برای نصب‌های Plugin.
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
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

برای بررسی نصب، inspect، حذف نصب، یا تازه‌سازی registry که کند است، فرمان را با
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی مرحله‌ها را در
stderr می‌نویسد و خروجی JSON را قابل parse نگه می‌دارد. [عیب‌یابی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییر‌دهنده‌های چرخه‌عمر Plugin غیرفعال هستند. برای این نصب به‌جای `plugins install`، `plugins update`، `plugins uninstall`، `plugins enable`، یا `plugins disable` از منبع Nix استفاده کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) agent-first استفاده کنید.
</Note>

<Note>
Pluginهای همراه با OpenClaw عرضه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال ارائه‌دهنده‌های مدل همراه، ارائه‌دهنده‌های گفتار همراه، و Plugin مرورگر همراه)؛ بقیه به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را همراه با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) ارائه کنند. bundleهای سازگار در عوض از manifestهای bundle خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی verbose فهرست/info همچنین زیرنوع bundle (`codex`، `claude`، یا `cursor`) به‌علاوه قابلیت‌های bundle شناسایی‌شده را نشان می‌دهد.
</Note>

### نصب

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

نگه‌دارندگان هنگام آزمودن نصب‌های زمان راه‌اندازی می‌توانند با متغیرهای محیطی محافظت‌شده
منابع نصب خودکار Plugin را بازنویسی کنند. [بازنویسی‌های نصب Plugin](/fa/plugins/install-overrides) را ببینید.

<Warning>
نام‌های package بدون پیشوند در دوره گذارِ launch به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب‌های Plugin را مانند اجرای کد در نظر بگیرید. نسخه‌های pin‌شده را ترجیح دهید.
</Warning>

`plugins search` در ClawHub برای packageهای Plugin قابل نصب جست‌وجو می‌کند و
نام packageهای آماده نصب را چاپ می‌کند. این فرمان packageهای code-plugin و bundle-plugin را جست‌وجو می‌کند،
نه skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. npm
همچنان یک مسیر fallback و نصب مستقیم پشتیبانی‌شده باقی می‌ماند. packageهای Plugin متعلق به OpenClaw با نام
`@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را در
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا
[موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند.
نصب‌ها و به‌روزرسانی‌های کانال بتا وقتی تگ موجود باشد، npm `beta` dist-tag را ترجیح می‌دهند،
سپس به `latest` برمی‌گردند.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و ترمیم پیکربندی نامعتبر">
    اگر بخش `plugins` شما توسط یک `$include` تک‌فایلی پشتیبانی شود، `plugins install/update/enable/disable/uninstall` در همان فایل include‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای ریشه، آرایه‌های include، و includeهایی با بازنویسی‌های sibling به‌جای flatten شدن، fail closed می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولاً fail closed می‌شود و از شما می‌خواهد ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و hot reload، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگر fail closed می‌شود؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر Plugin را قرنطینه کند. تنها استثنای مستندشده در زمان نصب، یک مسیر بازیابی محدود برای Pluginهای همراه است که صراحتاً `openclaw.install.allowInvalidConfigRecovery` را انتخاب کرده‌اند.

  </Accordion>
  <Accordion title="--force و نصب دوباره در برابر update">
    `--force` از هدف نصب موجود دوباره استفاده می‌کند و یک Plugin یا بسته hook ازپیش‌نصب‌شده را در همان‌جا بازنویسی می‌کند. وقتی عمداً همان id را از یک مسیر محلی جدید، archive، package در ClawHub، یا artifact در npm دوباره نصب می‌کنید، از آن استفاده کنید. برای upgradeهای معمول یک Plugin در npm که از قبل track شده است، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای یک id مربوط به Plugin که از قبل نصب شده اجرا کنید، OpenClaw متوقف می‌شود و برای upgrade معمولی شما را به `plugins update <id-or-npm-spec>` راهنمایی می‌کند، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید، به `plugins install <package> --force` ارجاع می‌دهد.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pin‌شده می‌خواهید، از یک git ref صریح مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec مربوط به npm، metadata منبع marketplace را ذخیره می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` گزینه‌ای break-glass برای false positiveها در اسکنر داخلی dangerous-code است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه پیدا کند، اما بلوک‌های سیاست hook مربوط به Plugin `before_install` را دور نمی‌زند و شکست‌های scan را نیز دور نمی‌زند.

    این flag در CLI برای جریان‌های نصب/update مربوط به Plugin اعمال می‌شود. نصب‌های وابستگی Skills که پشتوانه Gateway دارند از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب Skill از ClawHub است.

    اگر Pluginی که در ClawHub منتشر کرده‌اید توسط scan مربوط به registry مسدود شده است، از مراحل ناشر در [ClawHub](/fa/clawhub/security) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های hook و specهای npm">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای دید hook فیلترشده و فعال‌سازی جداگانه هر hook از `openclaw hooks` استفاده کنید، نه برای نصب package.

    specهای npm **فقط registry** هستند (نام package + **نسخه دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های وابستگی به‌صورت project-local و برای ایمنی با `--ignore-scripts` اجرا می‌شوند، حتی وقتی shell شما تنظیمات نصب سراسری npm دارد. ریشه‌های npm مدیریت‌شده Plugin، `overrides` مربوط به npm در سطح package از OpenClaw را به ارث می‌برند، بنابراین pinهای امنیتی host روی وابستگی‌های hoist‌شده Plugin هم اعمال می‌شوند.

    وقتی می‌خواهید resolution در npm را صریح کنید، از `npm:<package>` استفاده کنید. specهای package بدون پیشوند نیز در دوره گذار launch مستقیماً از npm نصب می‌شوند.

    specهای بدون پیشوند و `@latest` روی مسیر پایدار می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` برای این بررسی releaseهای پایدار هستند. اگر npm هرکدام از این‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک تگ prerelease مانند `@beta`/`@rc` یا یک نسخه prerelease دقیق مانند `@1.2.3-beta.4` صراحتاً opt in کنید.

    اگر یک install spec بدون پیشوند با id یک Plugin رسمی مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی catalog را مستقیماً نصب می‌کند. برای نصب یک package در npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    برای نصب مستقیم از یک مخزن git از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل `git:github.com/owner/repo`، `git:owner/repo`، URLهای کامل clone با `https://`، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` اضافه کنید.

    نصب‌های Git در یک دایرکتوری موقت clone می‌شوند، اگر ref درخواست‌شده وجود داشته باشد آن را checkout می‌کنند، سپس از نصب‌کننده عادی دایرکتوری Plugin استفاده می‌کنند. یعنی اعتبارسنجی manifest، scan مربوط به dangerous-code، کار نصب package-manager، و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌علاوه commit resolve‌شده هستند تا `openclaw plugins update` بعداً بتواند منبع را دوباره resolve کند.

    پس از نصب از git، برای راستی‌آزمایی registrationهای runtime مانند methodهای gateway و فرمان‌های CLI از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. اگر Plugin با `api.registerCli` یک ریشه CLI ثبت کرده است، آن فرمان را مستقیماً از طریق CLI ریشه OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiveها">
    archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. archiveهای Plugin بومی OpenClaw باید در ریشه Plugin استخراج‌شده یک `openclaw.plugin.json` معتبر داشته باشند؛ archiveهایی که فقط `package.json` دارند پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball مربوط به npm-pack است و می‌خواهید همان مسیر نصب مدیریت‌شده npm-root را که نصب‌های registry استفاده می‌کنند
    آزمایش کنید، از `npm-pack:<path.tgz>` استفاده کنید،
    شامل راستی‌آزمایی `package-lock.json`، scan وابستگی‌های hoist‌شده، و
    رکوردهای نصب npm. مسیرهای archive ساده همچنان به‌عنوان archiveهای محلی
    زیر ریشه افزونه‌های Plugin نصب می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

specهای Plugin سازگار با npm و بدون پیشوند در دوره گذار launch به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح‌کردن resolution فقط از npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، سازگاری API اعلام‌شدهٔ Plugin / حداقل Gateway را بررسی می‌کند. وقتی نسخهٔ انتخاب‌شدهٔ ClawHub یک آرتیفکت ClawPack منتشر می‌کند، OpenClaw بستهٔ نسخه‌دار npm با پسوند `.tgz` را دانلود می‌کند، هدر digest مربوط به ClawHub و digest آرتیفکت را تأیید می‌کند، سپس آن را از مسیر عادی آرشیو نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون فرادادهٔ ClawPack همچنان از مسیر قدیمی تأیید آرشیو بسته نصب می‌شوند. نصب‌های ثبت‌شده، فرادادهٔ منبع ClawHub، نوع آرتیفکت، یکپارچگی npm، shasum مربوط به npm، نام tarball، و حقایق digest مربوط به ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های بدون نسخهٔ ClawHub یک مشخصهٔ ثبت‌شدهٔ بدون نسخه را نگه می‌دارند تا `openclaw plugins update` بتواند نسخه‌های جدیدتر ClawHub را دنبال کند؛ انتخابگرهای نسخه یا tag صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` به همان انتخابگر سنجاق‌شده باقی می‌مانند.

#### کوتاه‌نویسی Marketplace

وقتی نام marketplace در کش رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از کوتاه‌نویسی `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع marketplace را صریحاً ارسال کنید، از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="منابع Marketplace">
    - یک نام marketplace شناخته‌شدهٔ Claude از `~/.claude/plugins/known_marketplaces.json`
    - یک ریشهٔ marketplace محلی یا مسیر `marketplace.json`
    - کوتاه‌نویسی مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL مربوط به git

  </Tab>
  <Tab title="قواعد marketplace راه‌دور">
    برای marketplaceهای راه‌دور که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند. OpenClaw منابع مسیر نسبی را از همان مخزن می‌پذیرد و منابع Plugin از نوع HTTP(S)، مسیر مطلق، git، GitHub و سایر منابع غیرمسیر را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw موارد زیر را به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفهٔ Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشهٔ عادی Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. در حال حاضر، Skills بسته، command-skillهای Claude، پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های `.lsp.json` / `lspServers` اعلام‌شده در manifest مربوط به Claude، command-skillهای Cursor، و دایرکتوری‌های hook سازگار Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگر بسته‌های تشخیص‌داده‌شده در diagnostics/info نمایش داده می‌شوند، اما هنوز به اجرای runtime متصل نشده‌اند.
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
  فقط Pluginهای فعال را نشان بده.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خطوط جزئیات به‌ازای هر Plugin با فرادادهٔ منبع/خاستگاه/نسخه/فعال‌سازی تغییر بده.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن برای ماشین به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی پایدارشدهٔ Plugin را می‌خواند و وقتی رجیستری وجود نداشته باشد یا نامعتبر باشد، از fallback مشتق‌شدهٔ صرفاً مبتنی بر manifest استفاده می‌کند. این برای بررسی اینکه آیا یک Plugin نصب، فعال، و برای برنامه‌ریزی راه‌اندازی سرد قابل‌مشاهده است مفید است، اما یک probe زندهٔ runtime از فرایند Gateway ازپیش‌درحال‌اجرا نیست. پس از تغییر کد Plugin، فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار برای اجرای کد `register(api)` یا hookهای جدید، Gatewayای را که به کانال سرویس می‌دهد restart کنید. برای استقرارهای راه‌دور/کانتینری، بررسی کنید که فرزند واقعی `openclaw gateway run` را restart می‌کنید، نه فقط یک فرایند wrapper.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `dependencies` و `optionalDependencies` در `package.json` است. OpenClaw بررسی می‌کند که آیا نام این بسته‌ها در مسیر lookup عادی `node_modules` مربوط به Node برای Plugin وجود دارند یا نه؛ کد runtime مربوط به Plugin را import نمی‌کند، package manager اجرا نمی‌کند، و وابستگی‌های گمشده را ترمیم نمی‌کند.
</Note>

`plugins search` یک lookup راه‌دور در کاتالوگ ClawHub است. وضعیت محلی را بررسی نمی‌کند، config را تغییر نمی‌دهد، بسته نصب نمی‌کند، یا کد runtime مربوط به Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو شامل نام بستهٔ ClawHub، خانواده، کانال، نسخه، خلاصه، و یک راهنمای نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Pluginهای همراه داخل یک image بسته‌بندی‌شدهٔ Docker، دایرکتوری منبع Plugin را روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mount کنید، مانند `/app/extensions/synology-chat`. OpenClaw آن overlay منبع mountشده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع که صرفاً کپی شده باشد غیرفعال می‌ماند، بنابراین نصب‌های عادی بسته‌بندی‌شده همچنان از dist کامپایل‌شده استفاده می‌کنند.

برای اشکال‌زدایی hookهای runtime:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics حاصل از یک گذر بازرسی با ماژول بارگذاری‌شده را نشان می‌دهد. بازرسی runtime هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت وابستگی قدیمی یا بازیابی Pluginهای قابل‌دانلود گمشده که config به آن‌ها اشاره می‌کند، از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل‌دسترسی، راهنماهای سرویس/فرایند، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای گفت‌وگوی غیرهمراه (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای پرهیز از کپی‌کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های لینک‌شده به‌جای کپی‌کردن روی یک مقصد نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کنند.

برای نصب‌های npm از `--pin` استفاده کنید تا مشخصهٔ دقیق resolve‌شده (`name@version`) در index مدیریت‌شدهٔ Plugin ذخیره شود، در حالی که رفتار پیش‌فرض بدون pin باقی می‌ماند.
</Note>

### Index مربوط به Plugin

فرادادهٔ نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. map سطح بالای `installRecords` منبع پایدار فرادادهٔ نصب است، از جمله رکوردهای مربوط به manifestهای شکسته یا گمشدهٔ Plugin. آرایهٔ `plugins` کش رجیستری سرد مشتق‌شده از manifest است. فایل شامل هشدار «ویرایش نکنید» است و توسط `openclaw plugins update`، حذف نصب، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای قدیمی ارسال‌شدهٔ `plugins.installs` را در config می‌بیند، خواندن‌های runtime با آن‌ها به‌عنوان ورودی سازگاری رفتار می‌کنند، بدون اینکه `openclaw.json` را بازنویسی کنند. نوشتن‌های صریح Plugin و `openclaw doctor --fix` این رکوردها را به index مربوط به Plugin منتقل می‌کنند و وقتی نوشتن config مجاز باشد، کلید config را حذف می‌کنند؛ اگر هرکدام از این نوشتن‌ها شکست بخورد، رکوردهای config نگه داشته می‌شوند تا فرادادهٔ نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، index پایدارشدهٔ Plugin، ورودی‌های فهرست allow/deny مربوط به Plugin، و در صورت کاربرد، ورودی‌های لینک‌شدهٔ `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شدهٔ ردیابی‌شده را وقتی داخل ریشهٔ extensions مربوط به Pluginهای OpenClaw باشد حذف می‌کند. برای Pluginهای active memory، slot حافظه به `memory-core` بازنشانی می‌شود.

<Note>
`--keep-config` به‌عنوان alias منسوخ‌شده برای `--keep-files` پشتیبانی می‌شود.
</Note>

### به‌روزرسانی

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

به‌روزرسانی‌ها روی نصب‌های Plugin ردیابی‌شده در index مدیریت‌شدهٔ Plugin و نصب‌های hook-pack ردیابی‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="resolve کردن شناسهٔ Plugin در برابر مشخصهٔ npm">
    وقتی یک شناسهٔ Plugin ارسال می‌کنید، OpenClaw از مشخصهٔ نصب ثبت‌شده برای همان Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شدهٔ قبلی مانند `@beta` و نسخه‌های دقیق pinشده در اجرای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، همچنین می‌توانید یک مشخصهٔ صریح بستهٔ npm همراه با dist-tag یا نسخهٔ دقیق ارسال کنید. OpenClaw آن نام بسته را دوباره به رکورد Plugin ردیابی‌شده resolve می‌کند، همان Plugin نصب‌شده را به‌روزرسانی می‌کند، و مشخصهٔ جدید npm را برای به‌روزرسانی‌های مبتنی بر شناسه در آینده ثبت می‌کند.

    ارسال نام بستهٔ npm بدون نسخه یا tag نیز دوباره به رکورد Plugin ردیابی‌شده resolve می‌شود. وقتی یک Plugin به نسخه‌ای دقیق pin شده و می‌خواهید آن را دوباره به خط انتشار پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال بتا">
    `openclaw plugins update` از مشخصهٔ Plugin ردیابی‌شده دوباره استفاده می‌کند مگر اینکه مشخصهٔ جدیدی ارسال کنید. `openclaw update` علاوه بر آن کانال فعال به‌روزرسانی OpenClaw را می‌شناسد: در کانال بتا، رکوردهای Plugin در خط پیش‌فرض npm و ClawHub ابتدا `@beta` را امتحان می‌کنند، سپس اگر هیچ انتشار بتای Plugin وجود نداشته باشد به مشخصهٔ پیش‌فرض/latest ثبت‌شده fallback می‌کنند. آن fallback به‌صورت هشدار گزارش می‌شود و به‌روزرسانی core را fail نمی‌کند. نسخه‌های دقیق و tagهای صریح به همان انتخابگر pinشده باقی می‌مانند.

  </Accordion>
  <Accordion title="بررسی نسخه و drift یکپارچگی">
    پیش از یک به‌روزرسانی زندهٔ npm، OpenClaw نسخهٔ بستهٔ نصب‌شده را با فرادادهٔ رجیستری npm بررسی می‌کند. اگر نسخهٔ نصب‌شده و هویت آرتیفکت ثبت‌شده از قبل با هدف resolve‌شده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی یک hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash آرتیفکت دریافت‌شده تغییر کند، OpenClaw با آن به‌عنوان drift آرتیفکت npm رفتار می‌کند. دستور تعاملی `openclaw plugins update` hashهای موردانتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی به‌صورت fail-closed متوقف می‌شوند مگر اینکه فراخواننده یک سیاست ادامهٔ صریح ارائه کند.

  </Accordion>
  <Accordion title="`--dangerously-force-unsafe-install` در به‌روزرسانی">
    `--dangerously-force-unsafe-install` همچنین در `plugins update` به‌عنوان override اضطراری برای false positiveهای اسکن کد خطرناک داخلی هنگام به‌روزرسانی Plugin در دسترس است. همچنان بلوک‌های سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند، و فقط برای به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، flagهای سیاست، diagnostics، فرادادهٔ نصب، قابلیت‌های بسته، و هرگونه پشتیبانی تشخیص‌داده‌شده از سرور MCP یا LSP را به‌صورت پیش‌فرض بدون import کردن runtime مربوط به Plugin نشان می‌دهد. برای بارگذاری ماژول Plugin و شامل کردن hookها، ابزارها، commandها، سرویس‌ها، متدهای Gateway، و routeهای HTTP ثبت‌شده، `--runtime` را اضافه کنید. بازرسی runtime وابستگی‌های گمشدهٔ Plugin را مستقیماً گزارش می‌کند؛ نصب‌ها و ترمیم‌ها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

commandهای CLI متعلق به Plugin معمولاً به‌عنوان گروه‌های command ریشهٔ `openclaw` نصب می‌شوند، اما Pluginها همچنین ممکن است commandهای تو در تو را زیر یک والد core مانند `openclaw nodes` ثبت کنند. پس از آنکه `inspect --runtime` یک command را زیر `cliCommands` نشان داد، آن را در مسیر فهرست‌شده اجرا کنید؛ برای مثال Pluginای که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin بر اساس آنچه واقعاً در runtime ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (مثلاً یک Plugin فقط-ارائه‌دهنده)
- **hybrid-capability** — چند نوع قابلیت (مثلاً متن + گفتار + تصاویر)
- **hook-only** — فقط هوک‌ها، بدون قابلیت‌ها یا سطوح
- **non-capability** — ابزارها/دستورها/سرویس‌ها اما بدون قابلیت‌ها

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل خواندن برای ماشین خروجی می‌دهد که برای اسکریپت‌نویسی و حسابرسی مناسب است. `inspect --all` جدولی در سطح کل ناوگان با ستون‌های شکل، گونه‌های قابلیت، اعلان‌های سازگاری، قابلیت‌های بسته، و خلاصه هوک‌ها نمایش می‌دهد. `info` نام مستعار `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، تشخیص‌های manifest/discovery، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

اگر یک Plugin پیکربندی‌شده روی دیسک وجود داشته باشد اما توسط بررسی‌های ایمنی مسیر loader مسدود شود، اعتبارسنجی پیکربندی ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف پیکربندی `plugins.entries.<id>` یا `plugins.allow`، تشخیص قبلی مربوط به Plugin مسدودشده، مانند مالکیت مسیر یا مجوزهای قابل نوشتن برای همه، را برطرف کنید.

برای خرابی‌های شکل ماژول مانند خروجی‌های گم‌شده `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا خلاصه‌ای فشرده از شکل خروجی‌ها در خروجی تشخیصی درج شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin مدل خواندن سرد و پایدار OpenClaw برای هویت Pluginهای نصب‌شده، فعال‌سازی، فراداده منبع، و مالکیت مشارکت است. راه‌اندازی عادی، جست‌وجوی مالک ارائه‌دهنده، طبقه‌بندی راه‌اندازی کانال، و موجودی Plugin می‌توانند بدون وارد کردن ماژول‌های runtime Plugin آن را بخوانند.

از `plugins registry` برای بررسی این‌که رجیستری پایدار وجود دارد، جاری است، یا کهنه شده استفاده کنید. از `--refresh` برای بازسازی آن از اندیس پایدار Plugin، سیاست پیکربندی، و فراداده manifest/package استفاده کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی runtime.

`openclaw doctor --fix` همچنین drift مربوط به npm مدیریت‌شده در اطراف رجیستری را تعمیر می‌کند: اگر یک بسته `@openclaw/*` یتیم یا بازیابی‌شده زیر ریشه npm مربوط به Plugin مدیریت‌شده، یک Plugin بسته‌بندی‌شده را تحت‌الشعاع قرار دهد، doctor آن بسته کهنه را حذف می‌کند و رجیستری را بازسازی می‌کند تا راه‌اندازی در برابر manifest بسته‌بندی‌شده اعتبارسنجی شود.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک سوئیچ سازگاری اضطراری منسوخ‌شده برای خرابی‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback محیطی فقط برای بازیابی اضطراری راه‌اندازی در زمان عرضه migration است.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست Marketplace یک مسیر محلی Marketplace، یک مسیر `marketplace.json`، یک shorthand گیت‌هاب مانند `owner/repo`، یک URL مخزن گیت‌هاب، یا یک URL گیت را می‌پذیرد. `--json` برچسب منبع حل‌شده را همراه با manifest تحلیل‌شده Marketplace و ورودی‌های Plugin چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [ClawHub](/fa/clawhub)

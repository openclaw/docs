---
read_when:
    - می‌خواهید Plugin‌های Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خرابی‌های بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Pluginها
x-i18n:
    generated_at: "2026-05-10T19:32:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های hook و bundleهای سازگار.

<CardGroup cols={2}>
  <Card title="سیستم Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی و عیب‌یابی Pluginها.
  </Card>
  <Card title="مدیریت Pluginها" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست‌کردن، به‌روزرسانی، حذف نصب و انتشار.
  </Card>
  <Card title="bundleهای Plugin" href="/fa/plugins/bundles">
    مدل سازگاری bundle.
  </Card>
  <Card title="مانیفست Plugin" href="/fa/plugins/manifest">
    فیلدهای مانیفست و schema پیکربندی.
  </Card>
  <Card title="امنیت" href="/fa/gateway/security">
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
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

برای بررسی کندی نصب، inspect، حذف نصب، یا refresh کردن registry، فرمان را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی فازها را در stderr می‌نویسد و خروجی JSON را قابل parse نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییر‌دهنده‌های چرخه عمر Plugin غیرفعال هستند. برای این نصب، به‌جای `plugins install`، `plugins update`، `plugins uninstall`، `plugins enable` یا `plugins disable` از منبع Nix استفاده کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) عامل‌محور استفاده کنید.
</Note>

<Note>
Pluginهای bundled همراه OpenClaw ارائه می‌شوند. بعضی به‌صورت پیش‌فرض فعال هستند (برای نمونه ارائه‌دهندگان مدل bundled، ارائه‌دهندگان گفتار bundled، و Plugin مرورگر bundled)؛ بقیه به `plugins enable` نیاز دارند.

Pluginهای native OpenClaw باید `openclaw.plugin.json` را همراه یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) ارائه کنند. bundleهای سازگار به‌جای آن از مانیفست‌های bundle خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی verbose در list/info همچنین زیرگونه bundle (`codex`، `claude` یا `cursor`) به‌علاوه قابلیت‌های bundle شناسایی‌شده را نشان می‌دهد.
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

نگه‌دارندگان هنگام آزمودن نصب‌های زمان راه‌اندازی می‌توانند منابع نصب خودکار Plugin را با متغیرهای محیطی محافظت‌شده override کنند. [overrideهای نصب Plugin](/fa/plugins/install-overrides) را ببینید.

<Warning>
در دوره cutover راه‌اندازی، نام‌های package بدون پیشوند به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Pluginها را مانند اجرای کد در نظر بگیرید. نسخه‌های pin‌شده را ترجیح دهید.
</Warning>

`plugins search` از ClawHub برای packageهای Plugin قابل نصب پرس‌وجو می‌کند و نام packageهای آماده نصب را چاپ می‌کند. این فرمان packageهای code-plugin و bundle-plugin را جست‌وجو می‌کند، نه Skills. برای Skillsهای ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. Npm همچنان یک مسیر fallback و نصب مستقیم پشتیبانی‌شده باقی می‌ماند. packageهای Plugin متعلق به OpenClaw با الگوی `@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا [موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند. نصب‌ها و به‌روزرسانی‌های کانال beta وقتی npm dist-tag با نام `beta` موجود باشد آن را ترجیح می‌دهند، سپس به `latest` برمی‌گردند.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و تعمیر پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` تغییرات را به همان فایل include‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای root، آرایه‌های include، و includeهایی با overrideهای هم‌سطح به‌جای flatten شدن، fail closed می‌شوند. برای شکل‌های پشتیبانی‌شده [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولا fail closed می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و hot reload، پیکربندی نامعتبر Plugin مثل هر پیکربندی نامعتبر دیگری fail closed می‌شود؛ `openclaw doctor --fix` می‌تواند ورودی Plugin نامعتبر را قرنطینه کند. تنها استثنای مستند در زمان نصب، یک مسیر بازیابی محدود برای Pluginهای bundled است که صراحتا `openclaw.install.allowInvalidConfigRecovery` را فعال کرده‌اند.

  </Accordion>
  <Accordion title="--force و نصب دوباره در برابر به‌روزرسانی">
    `--force` از target نصب موجود دوباره استفاده می‌کند و یک Plugin یا بسته hook از قبل نصب‌شده را در همان محل overwrite می‌کند. وقتی عمدا همان id را از یک مسیر محلی، archive، package ClawHub یا artifact npm جدید دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل ردیابی می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id مربوط به Plugin که از قبل نصب شده اجرا کنید، OpenClaw متوقف می‌شود و برای یک ارتقای معمول شما را به `plugins update <id-or-npm-spec>` راهنمایی می‌کند، یا وقتی واقعا می‌خواهید نصب فعلی را از منبعی متفاوت overwrite کنید، به `plugins install <package> --force` ارجاع می‌دهد.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pin‌شده می‌خواهید، از یک git ref صریح مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای یک npm spec، metadata منبع marketplace را persist می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` یک گزینه break-glass برای false positiveها در اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه پیدا کند، اما policy blockهای hook مربوط به `before_install` در Plugin را bypass نمی‌کند و scan failureها را هم bypass نمی‌کند.

    این پرچم CLI برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های dependency مربوط به skill که از Gateway پشتیبانی می‌شوند از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب skill از ClawHub است.

    اگر Pluginی که روی ClawHub منتشر کرده‌اید به‌دلیل scan رجیستری مسدود شده است، از گام‌های ناشر در [ClawHub](/fa/clawhub/security) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های hook و specهای npm">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` expose می‌کنند. برای مشاهده hook به‌صورت فیلترشده و فعال‌سازی هر hook، از `openclaw hooks` استفاده کنید، نه برای نصب package.

    specهای Npm **فقط registry** هستند (نام package + **نسخه دقیق** یا **dist-tag** اختیاری). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب dependencyها برای ایمنی به‌صورت project-local با `--ignore-scripts` اجرا می‌شود، حتی وقتی shell شما تنظیمات سراسری نصب npm دارد. ریشه‌های npm مربوط به Pluginهای مدیریت‌شده، `overrides` سطح package متعلق به OpenClaw را به ارث می‌برند، بنابراین pinهای امنیتی host روی dependencyهای hoist‌شده Plugin هم اعمال می‌شوند.

    وقتی می‌خواهید resolution مربوط به npm را صریح کنید، از `npm:<package>` استفاده کنید. specهای package بدون پیشوند نیز در دوره cutover راه‌اندازی مستقیما از npm نصب می‌شوند.

    specهای بدون پیشوند و `@latest` روی مسیر پایدار می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` برای این بررسی releaseهای پایدار هستند. اگر npm هرکدام از آن‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک tag مربوط به prerelease مانند `@beta`/`@rc` یا یک نسخه دقیق prerelease مانند `@1.2.3-beta.4` صراحتا opt in کنید.

    اگر یک install spec بدون پیشوند با id رسمی یک Plugin مطابق باشد (برای نمونه `diffs`)، OpenClaw ورودی catalog را مستقیما نصب می‌کند. برای نصب یک package npm با همان نام، از یک spec scoped صریح استفاده کنید (برای نمونه `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    از `git:<repo>` برای نصب مستقیم از یک مخزن git استفاده کنید. شکل‌های پشتیبانی‌شده شامل `git:github.com/owner/repo`، `git:owner/repo`، URLهای clone کامل `https://`، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag یا commit پیش از نصب، `@<ref>` یا `#<ref>` اضافه کنید.

    نصب‌های Git در یک دایرکتوری موقت clone می‌شوند، ref درخواستی را در صورت وجود checkout می‌کنند، سپس از نصب‌کننده عادی دایرکتوری Plugin استفاده می‌کنند. یعنی اعتبارسنجی مانیفست، scan کد خطرناک، کار نصب package-manager، و رکوردهای نصب مثل نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده URL/ref منبع به‌همراه commit resolve‌شده را شامل می‌شوند تا `openclaw plugins update` بتواند بعدا منبع را دوباره resolve کند.

    پس از نصب از git، از `openclaw plugins inspect <id> --runtime --json` برای تأیید registrationهای runtime مانند متدهای gateway و فرمان‌های CLI استفاده کنید. اگر Plugin یک root مربوط به CLI را با `api.registerCli` ثبت کرده است، آن فرمان را مستقیما از طریق root CLI متعلق به OpenClaw اجرا کنید، برای نمونه `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiveها">
    archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. archiveهای Plugin native OpenClaw باید در root استخراج‌شده Plugin یک `openclaw.plugin.json` معتبر داشته باشند؛ archiveهایی که فقط `package.json` دارند، پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball ساخته‌شده با npm-pack است و می‌خواهید همان مسیر نصب managed npm-root استفاده‌شده در نصب‌های registry را test کنید، از `npm-pack:<path.tgz>` استفاده کنید؛ شامل اعتبارسنجی `package-lock.json`، scan dependencyهای hoist‌شده، و رکوردهای نصب npm. مسیرهای archive ساده همچنان به‌عنوان archiveهای محلی زیر ریشه افزونه‌های Plugin نصب می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

specهای Plugin سازگار با npm و بدون پیشوند در دوره cutover راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح کردن resolution فقط از npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، API / حداقل سازگاری Gateway اعلام‌شده برای Plugin را بررسی می‌کند. وقتی نسخهٔ انتخاب‌شدهٔ ClawHub یک آرتیفکت ClawPack منتشر کرده باشد، OpenClaw بستهٔ نسخه‌دار npm-pack با پسوند `.tgz` را دانلود می‌کند، سربرگ digest در ClawHub و digest آرتیفکت را تأیید می‌کند، سپس آن را از مسیر معمول آرشیو نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون فرادادهٔ ClawPack همچنان از مسیر قدیمی تأیید آرشیو بسته نصب می‌شوند. نصب‌های ثبت‌شده، فرادادهٔ منبع ClawHub، نوع آرتیفکت، یکپارچگی npm، shasum مربوط به npm، نام tarball، و واقعیت‌های digest مربوط به ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های بدون نسخهٔ ClawHub یک مشخصهٔ ثبت‌شدهٔ بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند انتشارهای جدیدتر ClawHub را دنبال کند؛ انتخاب‌گرهای نسخه یا برچسب صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان انتخاب‌گر سنجاق می‌مانند.

#### میان‌بر بازارچه

وقتی نام بازارچه در کش رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از میان‌بر `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع بازارچه را صراحتاً پاس دهید، از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - نام بازارچهٔ شناخته‌شدهٔ Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشهٔ بازارچهٔ محلی یا مسیر `marketplace.json`
    - میان‌بر مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL مربوط به git

  </Tab>
  <Tab title="Remote marketplace rules">
    برای بازارچه‌های راه‌دوری که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن بازارچهٔ کلون‌شده باقی بمانند. OpenClaw منابع مسیر نسبی را از همان مخزن می‌پذیرد و منابع Plugin از نوع HTTP(S)، مسیر مطلق، git، GitHub، و دیگر منابع غیرمسیری را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw این موارد را خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفهٔ Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشهٔ معمول Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. امروز، مهارت‌های بسته، command-skillهای Claude، پیش‌فرض‌های `settings.json` در Claude، پیش‌فرض‌های `.lsp.json` / `lspServers` اعلام‌شده در manifest مربوط به Claude، command-skillهای Cursor، و دایرکتوری‌های hook سازگار Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگر بسته‌های شناسایی‌شده در diagnostics/info نشان داده می‌شوند اما هنوز به اجرای زمان اجرا متصل نشده‌اند.
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
  فقط Pluginهای فعال‌شده را نشان می‌دهد.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خط‌های جزئیات جداگانه برای هر Plugin همراه با فرادادهٔ منبع/خاستگاه/نسخه/فعال‌سازی جابه‌جا می‌شود.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل خواندن توسط ماشین به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی پایدارشدهٔ Plugin را می‌خواند، و وقتی رجیستری موجود نباشد یا نامعتبر باشد از fallback مشتق‌شده فقط از manifest استفاده می‌کند. این برای بررسی نصب بودن، فعال بودن، و قابل مشاهده بودن یک Plugin در برنامه‌ریزی شروع سرد مفید است، اما probe زندهٔ زمان اجرا از یک پردازش Gateway از قبل در حال اجرا نیست. پس از تغییر کد Plugin، وضعیت فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار برای اجرای کد جدید `register(api)` یا hookها، Gateway سرویس‌دهنده به کانال را بازراه‌اندازی کنید. برای استقرارهای راه‌دور/کانتینری، تأیید کنید که فرزند واقعی `openclaw gateway run` را بازراه‌اندازی می‌کنید، نه فقط یک پردازش wrapper.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `dependencies` و `optionalDependencies` در `package.json` است. OpenClaw بررسی می‌کند آیا نام آن بسته‌ها در مسیر معمول lookup مربوط به Node `node_modules` برای Plugin وجود دارند یا نه؛ کد زمان اجرای Plugin را import نمی‌کند، package manager را اجرا نمی‌کند، و وابستگی‌های گمشده را ترمیم نمی‌کند.
</Note>

`plugins search` یک جست‌وجوی راه‌دور در کاتالوگ ClawHub است. این دستور وضعیت محلی را بررسی نمی‌کند، config را تغییر نمی‌دهد، بسته نصب نمی‌کند، و کد زمان اجرای Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو شامل نام بستهٔ ClawHub، خانواده، کانال، نسخه، خلاصه، و یک راهنمای نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Plugin بسته‌بندی‌شده داخل یک تصویر Docker بسته‌بندی‌شده، دایرکتوری منبع Plugin را روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mount کنید، مانند `/app/extensions/synology-chat`. OpenClaw آن overlay منبع mount‌شده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع صرفاً کپی‌شده بی‌اثر می‌ماند تا نصب‌های بسته‌بندی‌شدهٔ معمول همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hook زمان اجرا:

- `openclaw plugins inspect <id> --runtime --json`، hookهای ثبت‌شده و diagnostics را از یک گذر بازرسی با ماژول بارگذاری‌شده نشان می‌دهد. بازرسی زمان اجرا هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت قدیمی وابستگی یا بازیابی Pluginهای قابل دانلود گمشده که در config ارجاع داده شده‌اند، از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc`، Gateway قابل دسترس، راهنماهای سرویس/پردازش، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای مکالمهٔ غیربسته‌بندی‌شده (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای پرهیز از کپی کردن یک دایرکتوری محلی، از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، زیرا نصب‌های linked به‌جای کپی کردن روی هدف نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کنند.

برای نصب‌های npm، از `--pin` استفاده کنید تا مشخصهٔ دقیق resolve‌شده (`name@version`) در ایندکس Plugin مدیریت‌شده ذخیره شود، در حالی که رفتار پیش‌فرض بدون pin باقی می‌ماند.
</Note>

### ایندکس Plugin

فرادادهٔ نصب Plugin، وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. نگاشت سطح بالای `installRecords` منبع پایدار فرادادهٔ نصب است، از جمله رکوردهای manifestهای خراب یا گمشدهٔ Plugin. آرایهٔ `plugins` کش رجیستری سرد مشتق‌شده از manifest است. این فایل یک هشدار ویرایش‌نکنید دارد و توسط `openclaw plugins update`، حذف نصب، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای قدیمی ارسال‌شدهٔ `plugins.installs` را در config ببیند، خواندن‌های زمان اجرا آن‌ها را بدون بازنویسی `openclaw.json` به‌عنوان ورودی سازگاری در نظر می‌گیرند. نوشتن‌های صریح Plugin و `openclaw doctor --fix` این رکوردها را به ایندکس Plugin منتقل می‌کنند و وقتی نوشتن config مجاز باشد، کلید config را حذف می‌کنند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، رکوردهای config نگه داشته می‌شوند تا فرادادهٔ نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، ایندکس پایدارشدهٔ Plugin، ورودی‌های فهرست allow/deny مربوط به Plugin، و در صورت کاربرد، ورودی‌های linked در `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شدهٔ ردیابی‌شده را وقتی داخل ریشهٔ افزونه‌های Plugin در OpenClaw باشد حذف می‌کند. برای Pluginهای Active Memory، slot حافظه به `memory-core` بازنشانی می‌شود.

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

به‌روزرسانی‌ها روی نصب‌های Plugin ردیابی‌شده در ایندکس Plugin مدیریت‌شده و نصب‌های hook-pack ردیابی‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    وقتی یک شناسهٔ Plugin پاس می‌دهید، OpenClaw مشخصهٔ نصب ثبت‌شده برای همان Plugin را دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شدهٔ قبلی مانند `@beta` و نسخه‌های دقیق pin‌شده همچنان در اجراهای بعدی `update <id>` استفاده می‌شوند.

    برای نصب‌های npm، می‌توانید یک مشخصهٔ صریح بستهٔ npm همراه با dist-tag یا نسخهٔ دقیق نیز پاس دهید. OpenClaw نام آن بسته را به رکورد Plugin ردیابی‌شده resolve می‌کند، همان Plugin نصب‌شده را به‌روزرسانی می‌کند، و مشخصهٔ جدید npm را برای به‌روزرسانی‌های مبتنی بر شناسه در آینده ثبت می‌کند.

    پاس دادن نام بستهٔ npm بدون نسخه یا برچسب نیز به رکورد Plugin ردیابی‌شده resolve می‌شود. وقتی یک Plugin به نسخهٔ دقیق pin شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` مشخصهٔ Plugin ردیابی‌شده را دوباره استفاده می‌کند مگر اینکه مشخصهٔ جدیدی پاس دهید. `openclaw update` علاوه بر این، کانال به‌روزرسانی فعال OpenClaw را می‌شناسد: روی کانال beta، رکوردهای Plugin مربوط به npm خط پیش‌فرض و ClawHub ابتدا `@beta` را امتحان می‌کنند، سپس اگر انتشار beta برای Plugin وجود نداشته باشد، به مشخصهٔ پیش‌فرض/آخرین ثبت‌شده fallback می‌کنند. نسخه‌های دقیق و برچسب‌های صریح به همان انتخاب‌گر pin می‌مانند.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    پیش از یک به‌روزرسانی زندهٔ npm، OpenClaw نسخهٔ بستهٔ نصب‌شده را با فرادادهٔ رجیستری npm بررسی می‌کند. اگر نسخهٔ نصب‌شده و هویت آرتیفکت ثبت‌شده از قبل با هدف resolve‌شده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب مجدد، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی یک hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash آرتیفکت دریافت‌شده تغییر کند، OpenClaw آن را به‌عنوان drift آرتیفکت npm در نظر می‌گیرد. دستور تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه، تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی fail closed می‌شوند مگر اینکه فراخواننده یک سیاست ادامهٔ صریح ارائه کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` روی `plugins update` نیز به‌عنوان یک override اضطراری برای false positiveهای اسکن کد خطرناک داخلی هنگام به‌روزرسانی Pluginها در دسترس است. این همچنان بلوک‌های سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند، و فقط روی به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect به‌صورت پیش‌فرض بدون import کردن زمان اجرای Plugin، هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، پرچم‌های سیاست، diagnostics، فرادادهٔ نصب، قابلیت‌های بسته، و هرگونه پشتیبانی شناسایی‌شده از سرور MCP یا LSP را نشان می‌دهد. برای بارگذاری ماژول Plugin و شامل کردن hookها، ابزارها، فرمان‌ها، سرویس‌ها، متدهای Gateway، و مسیرهای HTTP ثبت‌شده، `--runtime` را اضافه کنید. بازرسی زمان اجرا وابستگی‌های گمشدهٔ Plugin را مستقیم گزارش می‌کند؛ نصب‌ها و ترمیم‌ها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI متعلق به Plugin معمولاً به‌عنوان گروه‌های فرمان ریشهٔ `openclaw` نصب می‌شوند، اما Pluginها ممکن است فرمان‌های تو در تو را نیز زیر یک parent هسته مانند `openclaw nodes` ثبت کنند. پس از اینکه `inspect --runtime` یک فرمان را زیر `cliCommands` نشان داد، آن را در مسیر فهرست‌شده اجرا کنید؛ برای مثال Pluginی که `demo-git` را ثبت می‌کند، می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin بر اساس چیزی که واقعاً در زمان اجرا ثبت می‌کند، طبقه‌بندی می‌شود:

- **قابلیت ساده** — یک نوع قابلیت (مثلاً یک Plugin فقط برای ارائه‌دهنده)
- **قابلیت ترکیبی** — چند نوع قابلیت (مثلاً متن + گفتار + تصاویر)
- **فقط hook** — فقط hookها، بدون قابلیت‌ها یا سطح‌ها
- **بدون قابلیت** — ابزارها/فرمان‌ها/سرویس‌ها اما بدون قابلیت‌ها

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل‌خواندن برای ماشین خروجی می‌دهد که برای اسکریپت‌نویسی و ممیزی مناسب است. `inspect --all` جدولی در سطح کل ناوگان نمایش می‌دهد که شامل ستون‌های شکل، انواع قابلیت، اعلان‌های سازگاری، قابلیت‌های bundle، و خلاصه hook است. `info` نام مستعار `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، عیب‌یابی‌های manifest/discovery، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

اگر یک Plugin پیکربندی‌شده روی دیسک وجود داشته باشد اما توسط بررسی‌های ایمنی مسیرِ loader مسدود شده باشد، اعتبارسنجی پیکربندی ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف پیکربندی `plugins.entries.<id>` یا `plugins.allow`، عیب‌یابی Plugin مسدودشده قبلی، مانند مالکیت مسیر یا مجوزهای قابل‌نوشتن برای همه، را رفع کنید.

برای شکست‌های شکل ماژول مانند نبود exportهای `register`/`activate`، با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` دوباره اجرا کنید تا خلاصه‌ای فشرده از شکل export در خروجی عیب‌یابی گنجانده شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری Plugin محلی، مدل خواندن سردِ پایدارشده OpenClaw برای هویت Plugin نصب‌شده، فعال‌سازی، فراداده منبع، و مالکیت مشارکت است. راه‌اندازی عادی، جست‌وجوی مالک ارائه‌دهنده، طبقه‌بندی راه‌اندازی کانال، و موجودی Plugin می‌توانند بدون import کردن ماژول‌های runtime Plugin آن را بخوانند.

از `plugins registry` برای بررسی اینکه رجیستری پایدارشده وجود دارد، به‌روز است یا stale شده استفاده کنید. از `--refresh` برای بازسازی آن از ایندکس پایدارشده Plugin، سیاست پیکربندی، و فراداده manifest/package استفاده کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی runtime.

`openclaw doctor --fix` همچنین drift مربوط به managed npm در نزدیکی رجیستری را تعمیر می‌کند: اگر یک بسته یتیم یا بازیابی‌شده `@openclaw/*` زیر ریشه npm مدیریت‌شده Plugin روی یک Plugin بسته‌بندی‌شده سایه بیندازد، doctor آن بسته stale را حذف و رجیستری را بازسازی می‌کند تا راه‌اندازی در برابر manifest بسته‌بندی‌شده اعتبارسنجی شود.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک سوئیچ سازگاری break-glass منسوخ برای شکست‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback محیطی فقط برای بازیابی اضطراری راه‌اندازی هنگام rollout مهاجرت است.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست Marketplace یک مسیر Marketplace محلی، یک مسیر `marketplace.json`، یک shorthand در GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git را می‌پذیرد. `--json` برچسب منبع resolve‌شده را به‌همراه manifest تجزیه‌شده Marketplace و ورودی‌های Plugin چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [ClawHub](/fa/clawhub)

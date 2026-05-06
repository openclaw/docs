---
read_when:
    - می‌خواهید Plugin‌های Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-06T17:55:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 734366b6bbee5f036fdc2cfac5197ae86d2e8fbc7c977ccc4e22add2f4206951
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
    فیلدهای مانیفست و طرح‌واره پیکربندی.
  </Card>
  <Card title="امنیت" href="/fa/gateway/security">
    سخت‌سازی امنیتی برای نصب‌های Plugin.
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
```

برای بررسی نصب، بازرسی، حذف نصب یا تازه‌سازی رجیستریِ کند، دستور را با
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. ردگیری، زمان‌بندی فازها را در stderr می‌نویسد
و خروجی JSON را قابل تجزیه نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییر‌دهنده‌های چرخه‌عمر Plugin غیرفعال هستند. برای این نصب به‌جای `plugins install`، `plugins update`، `plugins uninstall`، `plugins enable` یا `plugins disable` از منبع Nix استفاده کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) agent-first استفاده کنید.
</Note>

<Note>
Pluginهای همراه با OpenClaw عرضه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه و Plugin مرورگر همراه)؛ برخی دیگر به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. bundleهای سازگار به‌جای آن از مانیفست‌های bundle خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی تفصیلی list/info همچنین زیرنوع bundle (`codex`، `claude` یا `cursor`) به‌همراه قابلیت‌های bundle شناسایی‌شده را نشان می‌دهد.
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

<Warning>
نام‌های ساده بسته در دوره جابه‌جایی زمان عرضه، به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Pluginها را مثل اجرای کد در نظر بگیرید. نسخه‌های pinشده را ترجیح دهید.
</Warning>

`plugins search` در ClawHub برای بسته‌های Plugin قابل نصب جست‌وجو می‌کند و
نام‌های بسته آماده نصب را چاپ می‌کند. این دستور بسته‌های code-plugin و bundle-plugin را جست‌وجو می‌کند،
نه Skills را. برای Skillsهای ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. npm
همچنان یک مسیر پشتیبان و نصب مستقیم پشتیبانی‌شده است. بسته‌های Plugin متعلق به OpenClaw با الگوی
`@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را در
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا
[فهرست موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند.
نصب‌ها و به‌روزرسانی‌های کانال beta، وقتی برچسب توزیع npm با نام `beta` موجود باشد، آن را ترجیح می‌دهند
و سپس به `latest` برمی‌گردند.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و تعمیر پیکربندی نامعتبر">
    اگر بخش `plugins` شما پشت یک `$include` تک‌فایلی باشد، `plugins install/update/enable/disable/uninstall` تغییرات را در همان فایل includeشده می‌نویسند و `openclaw.json` را دست‌نخورده می‌گذارند. includeهای ریشه، آرایه‌های include و includeهایی با overrideهای هم‌سطح، به‌جای flatten شدن، fail closed می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولاً fail closed می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و بارگذاری مجدد داغ، پیکربندی نامعتبر Plugin مثل هر پیکربندی نامعتبر دیگری fail closed می‌شود؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر Plugin را قرنطینه کند. تنها استثنای مستند در زمان نصب، یک مسیر بازیابی محدود برای Pluginهای همراه است که صراحتاً `openclaw.install.allowInvalidConfigRecovery` را فعال کرده‌اند.

  </Accordion>
  <Accordion title="--force و نصب مجدد در برابر به‌روزرسانی">
    `--force` مقصد نصب موجود را دوباره استفاده می‌کند و یک Plugin یا بسته hook از قبل نصب‌شده را درجا بازنویسی می‌کند. زمانی از آن استفاده کنید که عمداً همان id را از یک مسیر محلی جدید، آرشیو، بسته ClawHub یا artifact npm دوباره نصب می‌کنید. برای ارتقاهای معمول یک Plugin npm که از قبل ردیابی می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id یک Plugin که از قبل نصب شده اجرا کنید، OpenClaw متوقف می‌شود و برای یک ارتقای معمول شما را به `plugins update <id-or-npm-spec>` ارجاع می‌دهد، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید، به `plugins install <package> --force`.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی یک منبع pinشده می‌خواهید، از یک ref صریح git مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec npm، فراداده منبع marketplace را نگه می‌دارند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` یک گزینه break-glass برای مثبت‌های کاذب در اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه یابد، اما بلوک‌های سیاست hook مربوط به `before_install` در Plugin را دور نمی‌زند و شکست‌های اسکن را نیز دور نمی‌زند.

    این پرچم CLI برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skill با پشتوانه Gateway از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب Skill از ClawHub است.

    اگر Pluginی که روی ClawHub منتشر کرده‌اید با اسکن رجیستری مسدود شده است، از مراحل ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های hook و specهای npm">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای دیدپذیری فیلترشده hook و فعال‌سازی جداگانه هر hook از `openclaw hooks` استفاده کنید، نه برای نصب بسته.

    specهای npm **فقط رجیستری** هستند (نام بسته + **نسخه دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های وابستگی برای ایمنی به‌صورت project-local با `--ignore-scripts` اجرا می‌شوند، حتی وقتی shell شما تنظیمات سراسری نصب npm دارد. ریشه‌های npm مدیریت‌شده Plugin، `overrides` سطح بسته OpenClaw را به ارث می‌برند، پس pinهای امنیتی میزبان روی وابستگی‌های hoisted Plugin هم اعمال می‌شوند.

    وقتی می‌خواهید حل‌وفصل npm را صریح کنید، از `npm:<package>` استفاده کنید. specهای ساده بسته هم در دوره جابه‌جایی زمان عرضه مستقیماً از npm نصب می‌شوند.

    specهای ساده و `@latest` روی مسیر پایدار می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` برای این بررسی، انتشارهای پایدار هستند. اگر npm هرکدام از آن‌ها را به یک prerelease حل کند، OpenClaw متوقف می‌شود و از شما می‌خواهد صراحتاً با یک برچسب prerelease مانند `@beta`/`@rc` یا یک نسخه دقیق prerelease مانند `@1.2.3-beta.4` وارد شوید.

    اگر یک spec نصب ساده با id یک Plugin رسمی مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی کاتالوگ را مستقیماً نصب می‌کند. برای نصب یک بسته npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    برای نصب مستقیم از یک مخزن git از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل `git:github.com/owner/repo`، `git:owner/repo`، URLهای clone کامل `https://`، `ssh://`، `git://`، `file://` و `git@host:owner/repo.git` هستند. برای checkout کردن یک شاخه، tag یا commit پیش از نصب، `@<ref>` یا `#<ref>` اضافه کنید.

    نصب‌های Git در یک دایرکتوری موقت clone می‌شوند، در صورت وجود ref درخواستی آن را checkout می‌کنند، سپس از نصاب معمول دایرکتوری Plugin استفاده می‌کنند. یعنی اعتبارسنجی مانیفست، اسکن کد خطرناک، کار نصب package-manager و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit حل‌شده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    پس از نصب از git، از `openclaw plugins inspect <id> --runtime --json` برای تأیید ثبت‌های زمان اجرا مانند متدهای gateway و دستورهای CLI استفاده کنید. اگر Plugin یک ریشه CLI را با `api.registerCli` ثبت کرده است، آن دستور را مستقیماً از طریق CLI ریشه OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="آرشیوها">
    آرشیوهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. آرشیوهای Plugin بومی OpenClaw باید یک `openclaw.plugin.json` معتبر در ریشه Plugin استخراج‌شده داشته باشند؛ آرشیوهایی که فقط `package.json` دارند پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball از npm-pack است و می‌خواهید همان مسیر نصب npm-root مدیریت‌شده را که نصب‌های رجیستری استفاده می‌کنند آزمایش کنید،
    از `npm-pack:<path.tgz>` استفاده کنید؛
    شامل اعتبارسنجی `package-lock.json`، اسکن وابستگی‌های hoisted و
    رکوردهای نصب npm. مسیرهای آرشیو ساده همچنان به‌عنوان آرشیوهای محلی
    زیر ریشه extensions مربوط به Plugin نصب می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

specهای Plugin ساده و امن برای npm، در دوره جابه‌جایی زمان عرضه به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح‌کردن حل‌وفصل فقط از npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، API اعلام‌شدهٔ Plugin / حداقل سازگاری Gateway را بررسی می‌کند. وقتی نسخهٔ انتخاب‌شدهٔ ClawHub یک مصنوع ClawPack منتشر می‌کند، OpenClaw بستهٔ `.tgz` نسخه‌دارِ npm-pack را دانلود می‌کند، سربرگ digest مربوط به ClawHub و digest مصنوع را راستی‌آزمایی می‌کند، سپس آن را از مسیر معمول آرشیو نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub که فاقد فرادادهٔ ClawPack هستند، همچنان از مسیر قدیمی راستی‌آزمایی آرشیو بسته نصب می‌شوند. نصب‌های ثبت‌شده، فرادادهٔ منبع ClawHub، نوع مصنوع، یکپارچگی npm، shasum مربوط به npm، نام tarball، و واقعیت‌های digest مربوط به ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های بدون نسخهٔ ClawHub یک مشخصهٔ ثبت‌شدهٔ بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند نسخه‌های جدیدتر ClawHub را دنبال کند؛ انتخاب‌گرهای نسخه یا برچسب صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان انتخاب‌گر سنجاق‌شده باقی می‌مانند.

#### خلاصه‌نویسی Marketplace

وقتی نام marketplace در کش رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از خلاصه‌نویسی `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع marketplace را صراحتاً بدهید، از `--marketplace` استفاده کنید:

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
    - خلاصه‌نویسی مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL مربوط به git

  </Tab>
  <Tab title="قواعد marketplace راه‌دور">
    برای marketplaceهای راه‌دوری که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند. OpenClaw منابع مسیر نسبی را از آن مخزن می‌پذیرد و منابع Plugin از نوع HTTP(S)، مسیر مطلق، git، GitHub و سایر منابع غیرمسیر را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw این موارد را به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه‌های Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشهٔ معمول Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. امروز، Skills بسته، command-skillهای Claude، پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های `.lsp.json` مربوط به Claude / `lspServers` اعلام‌شده در manifest، command-skillهای Cursor، و دایرکتوری‌های hook سازگار Codex پشتیبانی می‌شوند؛ سایر قابلیت‌های تشخیص‌داده‌شدهٔ بسته در عیب‌یابی/اطلاعات نشان داده می‌شوند اما هنوز به اجرای زمان اجرا وصل نشده‌اند.
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
  از نمای جدول به خطوط جزئیات جداگانه برای هر Plugin با فرادادهٔ منبع/خاستگاه/نسخه/فعال‌سازی جابه‌جا شو.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن توسط ماشین به‌همراه عیب‌یابی‌های رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی پایدارشدهٔ Plugin را می‌خواند، و اگر رجیستری وجود نداشته باشد یا نامعتبر باشد، از یک fallback مشتق‌شده فقط از manifest استفاده می‌کند. این دستور برای بررسی نصب بودن، فعال بودن، و قابل‌مشاهده بودن یک Plugin برای برنامه‌ریزی راه‌اندازی سرد مفید است، اما یک کاوش زندهٔ زمان اجرا از یک فرایند Gateway ازقبل‌درحال‌اجرا نیست. پس از تغییر کد Plugin، وضعیت فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار برای اجرای کد جدید `register(api)` یا hookها، Gateway سرویس‌دهندهٔ کانال را بازراه‌اندازی کنید. برای استقرارهای راه‌دور/کانتینری، مطمئن شوید که فرزند واقعی `openclaw gateway run` را بازراه‌اندازی می‌کنید، نه فقط یک فرایند wrapper را.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `package.json`
`dependencies` و `optionalDependencies` است. OpenClaw بررسی می‌کند که آیا آن نام‌های بسته در مسیر جست‌وجوی معمول `node_modules` مربوط به Node برای Plugin حضور دارند یا نه؛
کد زمان اجرای Plugin را import نمی‌کند، package manager اجرا نمی‌کند، و وابستگی‌های مفقود را ترمیم نمی‌کند.
</Note>

`plugins search` یک جست‌وجوی راه‌دور در کاتالوگ ClawHub است. این دستور وضعیت محلی را بررسی نمی‌کند، config را تغییر نمی‌دهد، بسته‌ها را نصب نمی‌کند، و کد زمان اجرای Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو شامل نام بستهٔ ClawHub، خانواده، کانال، نسخه، خلاصه، و یک راهنمای نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Pluginهای همراه داخل یک image بسته‌بندی‌شدهٔ Docker، دایرکتوری منبع Plugin را روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mount کنید، مانند
`/app/extensions/synology-chat`. OpenClaw آن overlay منبع mountشده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع صرفاً کپی‌شده غیرفعال می‌ماند تا نصب‌های بسته‌بندی‌شدهٔ معمول همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hook زمان اجرا:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و عیب‌یابی‌ها را از یک گذر بازرسیِ module-loaded نشان می‌دهد. بازرسی زمان اجرا هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت وابستگی قدیمی یا بازیابی Pluginهای قابل‌دانلودِ مفقودی که در config ارجاع شده‌اند، از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل‌دسترسی، راهنماهای سرویس/فرایند، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای گفت‌وگوی غیرهمراه (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای پرهیز از کپی کردن یک دایرکتوری محلی، از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های پیوندی به‌جای کپی کردن روی یک هدف نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کنند.

برای نصب‌های npm، از `--pin` استفاده کنید تا مشخصهٔ دقیق حل‌شده (`name@version`) در نمایهٔ Plugin مدیریت‌شده ذخیره شود و رفتار پیش‌فرض بدون سنجاق‌کردن باقی بماند.
</Note>

### نمایهٔ Plugin

فرادادهٔ نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. نگاشت سطح‌بالای `installRecords` منبع پایدار فرادادهٔ نصب است، از جمله رکوردهای manifestهای Plugin خراب یا مفقود. آرایهٔ `plugins` کش رجیستری سردِ مشتق‌شده از manifest است. این فایل شامل هشدار ویرایش‌نکنید است و توسط `openclaw plugins update`، حذف نصب، عیب‌یابی‌ها، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای قدیمی ارسال‌شدهٔ `plugins.installs` را در config می‌بیند، خواندن‌های زمان اجرا آن‌ها را بدون بازنویسی `openclaw.json` به‌عنوان ورودی سازگاری در نظر می‌گیرند. نوشتن‌های صریح Plugin و `openclaw doctor --fix` این رکوردها را به نمایهٔ Plugin منتقل می‌کنند و وقتی نوشتن config مجاز باشد، کلید config را حذف می‌کنند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، رکوردهای config نگه داشته می‌شوند تا فرادادهٔ نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، نمایهٔ پایدارشدهٔ Plugin، ورودی‌های فهرست اجازه/رد Plugin، و در صورت کاربرد، ورودی‌های پیوندی `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شدهٔ ردیابی‌شده را وقتی داخل ریشهٔ افزونه‌های Plugin مربوط به OpenClaw باشد حذف می‌کند. برای Pluginهای حافظهٔ فعال، slot حافظه به `memory-core` بازنشانی می‌شود.

<Note>
`--keep-config` به‌عنوان نام مستعار منسوخ‌شده برای `--keep-files` پشتیبانی می‌شود.
</Note>

### به‌روزرسانی

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

به‌روزرسانی‌ها روی نصب‌های Plugin ردیابی‌شده در نمایهٔ Plugin مدیریت‌شده و نصب‌های hook-pack ردیابی‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="حل شناسهٔ Plugin در برابر مشخصهٔ npm">
    وقتی یک شناسهٔ Plugin می‌دهید، OpenClaw از مشخصهٔ نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شدهٔ قبلی مانند `@beta` و نسخه‌های دقیق سنجاق‌شده در اجراهای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، می‌توانید یک مشخصهٔ بستهٔ npm صریح با dist-tag یا نسخهٔ دقیق نیز بدهید. OpenClaw آن نام بسته را به رکورد Plugin ردیابی‌شده برمی‌گرداند، همان Plugin نصب‌شده را به‌روزرسانی می‌کند، و مشخصهٔ npm جدید را برای به‌روزرسانی‌های آینده مبتنی بر شناسه ثبت می‌کند.

    دادن نام بستهٔ npm بدون نسخه یا برچسب نیز به رکورد Plugin ردیابی‌شده برمی‌گردد. وقتی یک Plugin به نسخه‌ای دقیق سنجاق شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این روش استفاده کنید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال Beta">
    `openclaw plugins update` از مشخصهٔ Plugin ردیابی‌شده دوباره استفاده می‌کند مگر اینکه مشخصهٔ جدیدی بدهید. `openclaw update` همچنین کانال فعال به‌روزرسانی OpenClaw را می‌شناسد: در کانال beta، رکوردهای Plugin مربوط به npm و ClawHub در خط پیش‌فرض ابتدا `@beta` را امتحان می‌کنند، سپس اگر نسخهٔ beta برای Plugin وجود نداشته باشد به مشخصهٔ پیش‌فرض/latest ثبت‌شده fallback می‌کنند. نسخه‌های دقیق و برچسب‌های صریح به همان انتخاب‌گر سنجاق‌شده باقی می‌مانند.

  </Accordion>
  <Accordion title="بررسی‌های نسخه و انحراف یکپارچگی">
    پیش از یک به‌روزرسانی زندهٔ npm، OpenClaw نسخهٔ بستهٔ نصب‌شده را با فرادادهٔ رجیستری npm بررسی می‌کند. اگر نسخهٔ نصب‌شده و هویت مصنوع ثبت‌شده از قبل با هدف حل‌شده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash مصنوع دریافت‌شده تغییر کند، OpenClaw این را به‌عنوان انحراف مصنوع npm در نظر می‌گیرد. دستور تعاملی `openclaw plugins update` hashهای موردانتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی بسته شکست می‌خورند مگر اینکه فراخوان یک سیاست ادامهٔ صریح ارائه کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install هنگام به‌روزرسانی">
    `--dangerously-force-unsafe-install` همچنین در `plugins update` به‌عنوان یک override اضطراری برای مثبت‌های کاذب اسکن کد خطرناک داخلی هنگام به‌روزرسانی Plugin در دسترس است. این گزینه همچنان blockهای سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند، و فقط برای به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

بازرسی، هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، پرچم‌های سیاست، عیب‌یابی‌ها، فرادادهٔ نصب، قابلیت‌های بسته، و هر پشتیبانی شناسایی‌شده از serverهای MCP یا LSP را بدون import کردن زمان اجرای Plugin به‌صورت پیش‌فرض نشان می‌دهد. برای بارگذاری ماژول Plugin و شامل کردن hookها، ابزارها، فرمان‌ها، سرویس‌ها، متدهای Gateway، و routeهای HTTP ثبت‌شده، `--runtime` را اضافه کنید. بازرسی زمان اجرا وابستگی‌های مفقود Plugin را مستقیماً گزارش می‌کند؛ نصب‌ها و ترمیم‌ها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI متعلق به Plugin به‌عنوان گروه‌های فرمان ریشهٔ `openclaw` نصب می‌شوند. پس از اینکه `inspect --runtime` یک فرمان را زیر `cliCommands` نشان داد، آن را به‌صورت `openclaw <command> ...` اجرا کنید؛ برای مثال Pluginی که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` راستی‌آزمایی شود.

هر Plugin بر اساس آنچه واقعاً در زمان اجرا ثبت می‌کند طبقه‌بندی می‌شود:

- **قابلیت-ساده** — یک نوع قابلیت (مثلاً یک Plugin فقط ارائه‌دهنده)
- **قابلیت-ترکیبی** — چند نوع قابلیت (مثلاً متن + گفتار + تصویر)
- **فقط-هوک** — فقط هوک‌ها، بدون قابلیت‌ها یا سطح‌ها
- **بدون-قابلیت** — ابزارها/دستورها/سرویس‌ها اما بدون قابلیت‌ها

برای اطلاعات بیشتر دربارهٔ مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل‌خواندن برای ماشین تولید می‌کند که برای اسکریپت‌نویسی و حسابرسی مناسب است. `inspect --all` یک جدول سراسری برای کل ناوگان نمایش می‌دهد که شامل ستون‌های شکل، گونه‌های قابلیت، اعلان‌های سازگاری، قابلیت‌های بسته، و خلاصهٔ هوک‌ها است. `info` نام مستعار `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، عیب‌یابی‌های manifest/کشف، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

اگر یک Plugin پیکربندی‌شده روی دیسک موجود باشد اما توسط بررسی‌های ایمنی مسیر loader مسدود شود، اعتبارسنجی پیکربندی ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف پیکربندی `plugins.entries.<id>` یا `plugins.allow`، عیب‌یابی قبلیِ Plugin مسدودشده را اصلاح کنید، مانند مالکیت مسیر یا مجوزهای قابل‌نوشتن برای همه.

برای خرابی‌های شکل ماژول مانند نبودن خروجی‌های `register`/`activate`، با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` دوباره اجرا کنید تا یک خلاصهٔ فشرده از شکل خروجی‌ها در خروجی عیب‌یابی گنجانده شود.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin، مدل خواندن سرد و پایدار OpenClaw برای هویت Plugin نصب‌شده، فعال‌سازی، فرادادهٔ منبع، و مالکیت مشارکت‌ها است. راه‌اندازی عادی، جست‌وجوی مالک ارائه‌دهنده، طبقه‌بندی تنظیم کانال، و موجودی Plugin می‌توانند آن را بدون وارد کردن ماژول‌های runtime مربوط به Plugin بخوانند.

از `plugins registry` استفاده کنید تا بررسی کنید رجیستری پایدار موجود، به‌روز، یا منسوخ است. از `--refresh` استفاده کنید تا آن را از ایندکس پایدار Plugin، سیاست پیکربندی، و فرادادهٔ manifest/package دوباره بسازید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی runtime.

`openclaw doctor --fix` همچنین drift مربوط به npm مدیریت‌شده در حوالی رجیستری را تعمیر می‌کند: اگر یک بستهٔ یتیم یا بازیابی‌شدهٔ `@openclaw/*` زیر ریشهٔ npm مربوط به Plugin مدیریت‌شده، یک Plugin همراه را تحت‌الشعاع قرار دهد، doctor آن بستهٔ منسوخ را حذف می‌کند و رجیستری را دوباره می‌سازد تا راه‌اندازی در برابر manifest همراه اعتبارسنجی شود.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک کلید سازگاری منسوخِ اضطراری برای خرابی‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback مبتنی بر env فقط برای بازیابی اضطراری راه‌اندازی در زمان عرضهٔ تدریجی مهاجرت است.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست Marketplace یک مسیر Marketplace محلی، یک مسیر `marketplace.json`، یک خلاصه‌نویسی GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git را می‌پذیرد. `--json` برچسب منبع حل‌شده را به‌همراه manifest تحلیل‌شدهٔ Marketplace و ورودی‌های Plugin چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

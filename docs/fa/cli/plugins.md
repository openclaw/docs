---
read_when:
    - می‌خواهید Plugin‌های Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید شکست‌های بارگذاری Plugin را عیب‌یابی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-06T11:58:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ba9facc76f272d765068bbf78d2319484c6268f8a598ceac43998e34e889a26
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های hook و bundleهای سازگار.

<CardGroup cols={2}>
  <Card title="سیستم Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی و عیب‌یابی Pluginها.
  </Card>
  <Card title="مدیریت Pluginها" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست‌گیری، به‌روزرسانی، حذف نصب و انتشار.
  </Card>
  <Card title="bundleهای Plugin" href="/fa/plugins/bundles">
    مدل سازگاری bundle.
  </Card>
  <Card title="مانیفست Plugin" href="/fa/plugins/manifest">
    فیلدهای مانیفست و اسکیمای پیکربندی.
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

برای بررسی نصب، inspect، حذف نصب، یا تازه‌سازی رجیستریِ کند، فرمان را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی فازها را در stderr می‌نویسد و خروجی JSON را قابل parse نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
Pluginهای همراه همراه OpenClaw عرضه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال providerهای مدل همراه، providerهای گفتار همراه و Plugin مرورگر همراه)؛ برخی دیگر به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. bundleهای سازگار به‌جای آن از مانیفست‌های bundle خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی verbose list/info همچنین زیرنوع bundle (`codex`، `claude`، یا `cursor`) به‌همراه قابلیت‌های bundle شناسایی‌شده را نشان می‌دهد.
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
نام‌های ساده package در دوره گذار راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Pluginها را مانند اجرای کد در نظر بگیرید. نسخه‌های pinشده را ترجیح دهید.
</Warning>

`plugins search` در ClawHub برای packageهای Plugin قابل نصب جست‌وجو می‌کند و نام‌های package آماده نصب را چاپ می‌کند. این فرمان packageهای code-plugin و bundle-plugin را جست‌وجو می‌کند، نه skills. برای Skillsهای ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. Npm همچنان یک مسیر fallback و نصب مستقیم پشتیبانی‌شده است. packageهای Plugin متعلق به OpenClaw با نام `@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا [موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند. نصب‌ها و به‌روزرسانی‌های کانال beta وقتی tag در دسترس باشد، dist-tag مربوط به npm یعنی `beta` را ترجیح می‌دهند و سپس به `latest` برمی‌گردند.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و تعمیر پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` در همان فایل includeشده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای root، آرایه‌های include و includeهایی با overrideهای sibling به‌جای flatten شدن، بسته شکست می‌خورند. برای شکل‌های پشتیبانی‌شده [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولا بسته شکست می‌خورد و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و بارگذاری مجدد داغ، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگری بسته شکست می‌خورد؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر Plugin را قرنطینه کند. تنها استثنای مستند در زمان نصب، یک مسیر بازیابی محدود برای Pluginهای همراه است که صراحتا `openclaw.install.allowInvalidConfigRecovery` را فعال می‌کنند.

  </Accordion>
  <Accordion title="--force و نصب مجدد در برابر به‌روزرسانی">
    `--force` از هدف نصب موجود دوباره استفاده می‌کند و یک Plugin یا بسته hook را که از قبل نصب شده، درجا بازنویسی می‌کند. زمانی از آن استفاده کنید که عمدا همان id را از یک مسیر محلی جدید، archive، package ClawHub یا artifact npm دوباره نصب می‌کنید. برای ارتقاهای معمول یک Plugin npm که از قبل دنبال می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id یک Plugin که از قبل نصب شده اجرا کنید، OpenClaw متوقف می‌شود و برای ارتقای معمول شما را به `plugins update <id-or-npm-spec>`، یا وقتی واقعا می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید به `plugins install <package> --force` هدایت می‌کند.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. این گزینه با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pinشده می‌خواهید از یک ref صریح git مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای یک spec مربوط به npm، metadata منبع marketplace را پایدار نگه می‌دارند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` یک گزینه اضطراری برای مثبت‌های کاذب در اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه پیدا کند، اما بلاک‌های policy مربوط به hook `before_install` در Plugin را دور نمی‌زند و خرابی‌های اسکن را هم دور نمی‌زند.

    این flag در CLI برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skill که از Gateway پشتیبانی می‌شوند از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، درحالی‌که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب Skill از ClawHub است.

    اگر Pluginی که روی ClawHub منتشر کرده‌اید با اسکن رجیستری مسدود شده است، از مراحل ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های hook و specهای npm">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای دیدپذیری فیلترشده hook و فعال‌سازی هر hook، از `openclaw hooks` استفاده کنید، نه برای نصب package.

    specهای npm **فقط رجیستری** هستند (نام package + نسخه **دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های وابستگی برای ایمنی به‌صورت project-local با `--ignore-scripts` اجرا می‌شوند، حتی اگر shell شما تنظیمات نصب global npm داشته باشد. rootهای npm مدیریت‌شده Plugin، `overrides` سطح package OpenClaw را به ارث می‌برند، بنابراین pinهای امنیتی میزبان برای وابستگی‌های hoistشده Plugin هم اعمال می‌شوند.

    وقتی می‌خواهید resolution مربوط به npm را صریح کنید از `npm:<package>` استفاده کنید. specهای ساده package نیز در دوره گذار راه‌اندازی مستقیما از npm نصب می‌شوند.

    specهای ساده و `@latest` روی مسیر پایدار می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` برای این بررسی releaseهای پایدار هستند. اگر npm هرکدام از این‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک tag prerelease مانند `@beta`/`@rc` یا یک نسخه دقیق prerelease مانند `@1.2.3-beta.4` صراحتا opt in کنید.

    اگر یک spec نصب ساده با id یک Plugin رسمی مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی کاتالوگ را مستقیما نصب می‌کند. برای نصب یک package npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    برای نصب مستقیم از یک مخزن git از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل URLهای clone به‌صورت `git:github.com/owner/repo`، `git:owner/repo`، `https://` کامل، `ssh://`، `git://`، `file://` و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag یا commit پیش از نصب، `@<ref>` یا `#<ref>` اضافه کنید.

    نصب‌های Git در یک دایرکتوری موقت clone می‌شوند، در صورت وجود ref درخواستی آن را checkout می‌کنند، سپس از installer عادی دایرکتوری Plugin استفاده می‌کنند. یعنی اعتبارسنجی مانیفست، اسکن کد خطرناک، کار نصب package-manager و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit resolveشده هستند تا `openclaw plugins update` بتواند بعدا منبع را دوباره resolve کند.

    پس از نصب از git، برای تأیید ثبت‌های runtime مانند methodهای gateway و فرمان‌های CLI از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. اگر Plugin با `api.registerCli` یک root برای CLI ثبت کرده است، آن فرمان را مستقیما از طریق CLI root متعلق به OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiveها">
    archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. archiveهای Plugin بومی OpenClaw باید در root استخراج‌شده Plugin یک `openclaw.plugin.json` معتبر داشته باشند؛ archiveهایی که فقط `package.json` دارند پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball از npm-pack است و می‌خواهید همان مسیر نصب npm-root مدیریت‌شده را که نصب‌های رجیستری استفاده می‌کنند تست کنید، از `npm-pack:<path.tgz>` استفاده کنید؛ شامل اعتبارسنجی `package-lock.json`، اسکن وابستگی‌های hoistشده و رکوردهای نصب npm. مسیرهای archive ساده همچنان به‌عنوان archiveهای محلی زیر root افزونه‌های Plugin نصب می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از یک locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

specهای Plugin ساده و امن برای npm در دوره گذار راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح کردن resolution فقط از npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، سازگاری API تبلیغ‌شده Plugin / حداقل Gateway را بررسی می‌کند. وقتی نسخه انتخاب‌شده ClawHub یک artifact از نوع ClawPack منتشر می‌کند، OpenClaw فایل versioned npm-pack با پسوند `.tgz` را دانلود می‌کند، header digest مربوط به ClawHub و digest artifact را تأیید می‌کند، سپس آن را از مسیر عادی archive نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون metadata مربوط به ClawPack همچنان از مسیر قدیمی اعتبارسنجی archive package نصب می‌شوند. نصب‌های ثبت‌شده metadata منبع ClawHub، نوع artifact، integrity مربوط به npm، shasum مربوط به npm، نام tarball و واقعیت‌های digest مربوط به ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های ClawHub بدون نسخه یک spec ثبت‌شده بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند releaseهای جدیدتر ClawHub را دنبال کند؛ selectorهای نسخه یا tag صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان selector pin می‌مانند.

#### shorthand مربوط به marketplace

وقتی نام marketplace در cache رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از shorthand به‌شکل `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع marketplace را به‌صورت صریح بدهید، از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - یک نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشه یک marketplace محلی یا مسیر `marketplace.json`
    - خلاصه‌نویسی مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL گیت

  </Tab>
  <Tab title="Remote marketplace rules">
    برای marketplaceهای راه‌دور که از GitHub یا گیت بارگذاری می‌شوند، مدخل‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند. OpenClaw منابع مسیر نسبی را از همان مخزن می‌پذیرد و منابع Plugin از نوع HTTP(S)، مسیر مطلق، گیت، GitHub و دیگر منابع غیرمسیری را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرهای محلی و آرشیوها، OpenClaw به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشه معمول Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. امروز، bundle skills، مهارت‌های فرمان Claude، پیش‌فرض‌های Claude `settings.json`، پیش‌فرض‌های Claude `.lsp.json` / `lspServers` اعلام‌شده در manifest، مهارت‌های فرمان Cursor، و دایرکتوری‌های hook سازگار Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگر بسته که تشخیص داده می‌شوند در diagnostics/info نمایش داده می‌شوند اما هنوز به اجرای زمان اجرا متصل نشده‌اند.
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
  فقط Pluginهای فعال‌شده را نشان بده.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خط‌های جزئیات هر Plugin با فراداده منبع/خاستگاه/نسخه/فعال‌سازی جابه‌جا شو.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن برای ماشین به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی ماندگارشده Plugin را می‌خواند و وقتی رجیستری موجود نباشد یا نامعتبر باشد، از جایگزین مشتق‌شده فقط از manifest استفاده می‌کند. این دستور برای بررسی نصب‌بودن، فعال‌بودن و قابل‌مشاهده‌بودن یک Plugin برای برنامه‌ریزی راه‌اندازی سرد مفید است، اما probe زنده زمان اجرا برای یک فرایند Gateway که از قبل در حال اجراست نیست. پس از تغییر کد Plugin، فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار اجرای کد `register(api)` یا hookهای جدید، Gateway ارائه‌دهنده کانال را بازراه‌اندازی کنید. برای استقرارهای راه‌دور/کانتینری، بررسی کنید که child واقعی `openclaw gateway run` را بازراه‌اندازی می‌کنید، نه فقط یک فرایند wrapper را.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `dependencies` و `optionalDependencies` در `package.json` است. OpenClaw بررسی می‌کند که آیا نام‌های این بسته‌ها در مسیر lookup معمول Node `node_modules` برای آن Plugin وجود دارند یا نه؛ کد زمان اجرای Plugin را import نمی‌کند، package manager اجرا نمی‌کند، و وابستگی‌های گم‌شده را ترمیم نمی‌کند.
</Note>

`plugins search` یک جست‌وجوی کاتالوگ راه‌دور ClawHub است. وضعیت محلی را بررسی نمی‌کند، config را تغییر نمی‌دهد، بسته نصب نمی‌کند، یا کد زمان اجرای Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو شامل نام بسته ClawHub، خانواده، کانال، نسخه، خلاصه، و یک راهنمای نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Pluginهای همراه درون یک تصویر Docker بسته‌بندی‌شده، دایرکتوری منبع Plugin را روی مسیر منبع بسته‌بندی‌شده متناظر bind-mount کنید، مانند `/app/extensions/synology-chat`. OpenClaw آن overlay منبع mount‌شده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع صرفاً کپی‌شده بی‌اثر می‌ماند تا نصب‌های بسته‌بندی‌شده معمول همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hook زمان اجرا:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics را از یک گذر inspection با ماژول بارگذاری‌شده نشان می‌دهد. inspection زمان اجرا هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت قدیمی وابستگی‌ها یا بازیابی Pluginهای قابل‌دانلود گم‌شده که در config ارجاع داده شده‌اند، از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل‌دسترسی، راهنمایی‌های سرویس/فرایند، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای گفت‌وگوی غیرهمراه (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی‌کردن یک دایرکتوری محلی، از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` با `--link` پشتیبانی نمی‌شود، چون نصب‌های لینک‌شده به‌جای کپی‌کردن روی هدف نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کنند.

برای ذخیره spec دقیق resolveشده (`name@version`) در ایندکس Plugin مدیریت‌شده، درحالی‌که رفتار پیش‌فرض بدون pin باقی می‌ماند، روی نصب‌های npm از `--pin` استفاده کنید.
</Note>

### ایندکس Plugin

فراداده نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. نگاشت سطح بالای `installRecords` منبع پایدار فراداده نصب است، شامل رکوردهای manifestهای خراب یا گم‌شده Plugin. آرایه `plugins` کش رجیستری سرد مشتق‌شده از manifest است. فایل شامل هشدار ویرایش‌نکنید است و توسط `openclaw plugins update`، uninstall، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای قدیمی ارسال‌شده `plugins.installs` را در config ببیند، آن‌ها را به ایندکس Plugin منتقل می‌کند و کلید config را حذف می‌کند؛ اگر هرکدام از writeها شکست بخورد، رکوردهای config حفظ می‌شوند تا فراداده نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، ایندکس ماندگار Plugin، مدخل‌های فهرست اجازه/رد Plugin، و مدخل‌های لینک‌شده `plugins.load.paths` در صورت کاربرد حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، uninstall دایرکتوری نصب مدیریت‌شده رهگیری‌شده را نیز وقتی داخل ریشه افزونه‌های Plugin OpenClaw باشد حذف می‌کند. برای Pluginهای حافظه فعال، اسلات حافظه به `memory-core` بازنشانی می‌شود.

<Note>
`--keep-config` به‌عنوان alias منسوخ برای `--keep-files` پشتیبانی می‌شود.
</Note>

### به‌روزرسانی

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

به‌روزرسانی‌ها روی نصب‌های Plugin رهگیری‌شده در ایندکس Plugin مدیریت‌شده و نصب‌های hook-pack رهگیری‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    وقتی یک شناسه Plugin می‌دهید، OpenClaw از spec نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شده پیشین مانند `@beta` و نسخه‌های دقیق pinشده در اجراهای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، می‌توانید یک spec صریح بسته npm با dist-tag یا نسخه دقیق نیز بدهید. OpenClaw آن نام بسته را به رکورد Plugin رهگیری‌شده resolve می‌کند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های آینده مبتنی بر شناسه ثبت می‌کند.

    دادن نام بسته npm بدون نسخه یا tag نیز به رکورد Plugin رهگیری‌شده resolve می‌شود. وقتی یک Plugin به نسخه‌ای دقیق pin شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` از spec رهگیری‌شده Plugin دوباره استفاده می‌کند مگر اینکه spec جدیدی بدهید. `openclaw update` علاوه‌براین کانال به‌روزرسانی فعال OpenClaw را می‌شناسد: در کانال beta، رکوردهای Plugin پیش‌فرض npm و ClawHub ابتدا `@beta` را امتحان می‌کنند، سپس اگر هیچ انتشار beta برای Plugin وجود نداشت، به spec پیش‌فرض/latest ثبت‌شده برمی‌گردند. نسخه‌های دقیق و tagهای صریح روی همان selector ثابت می‌مانند.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    پیش از یک به‌روزرسانی زنده npm، OpenClaw نسخه بسته نصب‌شده را با فراداده رجیستری npm بررسی می‌کند. اگر نسخه نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف resolveشده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact دریافت‌شده تغییر کند، OpenClaw آن را drift artifact npm تلقی می‌کند. فرمان تعاملی `openclaw plugins update` hashهای موردانتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی fail closed می‌شوند مگر اینکه فراخواننده یک سیاست ادامه صریح فراهم کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` روی `plugins update` نیز به‌عنوان override اضطراری برای false positiveهای scan کد خطرناک داخلی هنگام به‌روزرسانی Pluginها در دسترس است. این گزینه همچنان blockهای سیاست `before_install` مربوط به Plugin یا blocking ناشی از scan-failure را دور نمی‌زند، و فقط برای به‌روزرسانی Plugin اعمال می‌شود، نه به‌روزرسانی hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، پرچم‌های سیاست، diagnostics، فراداده نصب، قابلیت‌های بسته، و هر پشتیبانی MCP یا LSP server تشخیص‌داده‌شده را بدون importکردن زمان اجرای Plugin به‌صورت پیش‌فرض نشان می‌دهد. برای بارگذاری ماژول Plugin و افزودن hookها، tools، commands، services، gateway methods، و HTTP routes ثبت‌شده، `--runtime` را اضافه کنید. inspection زمان اجرا وابستگی‌های گم‌شده Plugin را مستقیم گزارش می‌کند؛ نصب‌ها و ترمیم‌ها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI مالکیت‌شده توسط Plugin به‌عنوان گروه‌های فرمان ریشه `openclaw` نصب می‌شوند. پس از اینکه `inspect --runtime` فرمانی را زیر `cliCommands` نشان داد، آن را به‌شکل `openclaw <command> ...` اجرا کنید؛ برای نمونه، Pluginی که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin بر اساس آنچه واقعاً در زمان اجرا ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (برای مثال، یک Plugin فقط provider)
- **hybrid-capability** — چند نوع قابلیت (برای مثال، متن + گفتار + تصاویر)
- **hook-only** — فقط hookها، بدون قابلیت‌ها یا سطح‌ها
- **non-capability** — ابزارها/فرمان‌ها/سرویس‌ها اما بدون قابلیت‌ها

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل‌خواندن برای ماشین مناسب scripting و audit خروجی می‌دهد. `inspect --all` یک جدول سراسری با ستون‌های شکل، گونه‌های قابلیت، اعلان‌های سازگاری، قابلیت‌های بسته، و خلاصه hook رندر می‌کند. `info` alias برای `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، diagnostics مربوط به manifest/discovery، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز تمیز باشد، `No plugin issues detected.` را چاپ می‌کند.

اگر یک Plugin پیکربندی‌شده روی دیسک حاضر باشد اما توسط بررسی‌های ایمنی مسیر loader مسدود شده باشد، اعتبارسنجی config مدخل Plugin را نگه می‌دارد و آن را به‌عنوان `present but blocked` گزارش می‌کند. به‌جای حذف config مربوط به `plugins.entries.<id>` یا `plugins.allow`، diagnostic قبلی Plugin مسدودشده، مانند مالکیت مسیر یا مجوزهای world-writable، را رفع کنید.

برای خرابی‌های شکل ماژول، مانند نبودن خروجی‌های `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا یک خلاصه فشرده از شکل خروجی‌ها در خروجی عیب‌یابی گنجانده شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin مدل خواندن سرد و پایدار OpenClaw برای هویت Plugin نصب‌شده، فعال‌سازی، فراداده منبع، و مالکیت مشارکت است. راه‌اندازی معمولی، جست‌وجوی مالک ارائه‌دهنده، طبقه‌بندی تنظیم کانال، و موجودی Plugin می‌توانند آن را بدون وارد کردن ماژول‌های زمان اجرای Plugin بخوانند.

از `plugins registry` برای بررسی اینکه رجیستری پایدار وجود دارد، به‌روز است، یا قدیمی شده است استفاده کنید. از `--refresh` برای بازسازی آن از نمایه پایدار Plugin، سیاست پیکربندی، و فراداده manifest/package استفاده کنید. این یک مسیر ترمیم است، نه مسیر فعال‌سازی زمان اجرا.

`openclaw doctor --fix` همچنین drift مدیریت‌شده npm در مجاورت رجیستری را ترمیم می‌کند: اگر یک بسته یتیم یا بازیابی‌شده `@openclaw/*` زیر ریشه npm مدیریت‌شده Plugin روی یک Plugin همراه سایه بیندازد، doctor آن بسته قدیمی را حذف می‌کند و رجیستری را بازسازی می‌کند تا راه‌اندازی بر اساس manifest همراه اعتبارسنجی شود.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک سوییچ سازگاری منسوخ‌شده اضطراری برای خرابی‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback متغیر محیطی فقط برای بازیابی اضطراری راه‌اندازی در زمان عرضه مهاجرت است.
</Warning>

### بازارچه

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست بازارچه یک مسیر بازارچه محلی، یک مسیر `marketplace.json`، یک خلاصه GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git را می‌پذیرد. `--json` برچسب منبع حل‌شده را همراه با manifest بازارچه تجزیه‌شده و ورودی‌های Plugin چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

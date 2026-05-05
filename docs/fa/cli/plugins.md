---
read_when:
    - می‌خواهید Plugin‌های Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خرابی‌های بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Pluginها
x-i18n:
    generated_at: "2026-05-05T01:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24d274f33213231eaed48ac848a9266802a2179ba0311ab18462ad783219095a
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های hook، و باندل‌های سازگار.

<CardGroup cols={2}>
  <Card title="سیستم Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی، و عیب‌یابی Pluginها.
  </Card>
  <Card title="مدیریت Pluginها" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست‌کردن، به‌روزرسانی، حذف نصب، و انتشار.
  </Card>
  <Card title="باندل‌های Plugin" href="/fa/plugins/bundles">
    مدل سازگاری باندل.
  </Card>
  <Card title="مانیفست Plugin" href="/fa/plugins/manifest">
    فیلدهای مانیفست و طرح‌واره پیکربندی.
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

برای بررسی نصب، بازرسی، حذف نصب، یا تازه‌سازی رجیستری که کند انجام می‌شود، فرمان را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی فازها را در stderr می‌نویسد و خروجی JSON را قابل parse نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
Pluginهای باندل‌شده همراه OpenClaw ارائه می‌شوند. برخی به‌صورت پیش‌فرض فعال‌اند (برای مثال ارائه‌دهنده‌های مدل باندل‌شده، ارائه‌دهنده‌های گفتار باندل‌شده، و Plugin مرورگر باندل‌شده)؛ برخی دیگر به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را همراه با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) ارائه کنند. باندل‌های سازگار به‌جای آن از مانیفست‌های باندل خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی مفصل list/info همچنین زیرنوع باندل (`codex`، `claude`، یا `cursor`) به‌همراه قابلیت‌های باندل شناسایی‌شده را نشان می‌دهد.
</Note>

### نصب

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
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
نام‌های بسته ساده در دوره گذار راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Pluginها را مانند اجرای کد در نظر بگیرید. نسخه‌های pin‌شده را ترجیح دهید.
</Warning>

`plugins search` در ClawHub برای بسته‌های Plugin قابل نصب جست‌وجو می‌کند و نام بسته‌های آماده نصب را چاپ می‌کند. این فرمان بسته‌های code-plugin و bundle-plugin را جست‌وجو می‌کند، نه Skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. npm همچنان یک مسیر fallback و نصب مستقیم پشتیبانی‌شده است. بسته‌های Plugin متعلق به OpenClaw با الگوی `@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا [موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند. نصب‌ها و به‌روزرسانی‌های کانال بتا، وقتی تگ موجود باشد، dist-tag با نام `beta` در npm را ترجیح می‌دهند و سپس به `latest` fallback می‌کنند.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و تعمیر پیکربندی نامعتبر">
    اگر بخش `plugins` شما توسط یک `$include` تک‌فایلی پشتیبانی شود، `plugins install/update/enable/disable/uninstall` تغییرات را در همان فایل include‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای ریشه، آرایه‌های include، و includeهایی با overrideهای هم‌سطح، به‌جای flatten شدن، fail closed می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر هنگام نصب، پیکربندی نامعتبر باشد، `plugins install` معمولاً fail closed می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و hot reload، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگری fail closed می‌شود؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر Plugin را قرنطینه کند. تنها استثنای مستند در زمان نصب، یک مسیر بازیابی محدود برای Plugin باندل‌شده است، برای Pluginهایی که صراحتاً `openclaw.install.allowInvalidConfigRecovery` را فعال کرده‌اند.

  </Accordion>
  <Accordion title="--force و نصب مجدد در برابر به‌روزرسانی">
    `--force` از هدف نصب موجود دوباره استفاده می‌کند و یک Plugin یا بسته hook از قبل نصب‌شده را در همان محل بازنویسی می‌کند. وقتی عمداً همان id را از یک مسیر محلی جدید، آرشیو، بسته ClawHub، یا artifact در npm دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای روتین یک Plugin در npm که از قبل رهگیری می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id یک Plugin که از قبل نصب شده اجرا کنید، OpenClaw متوقف می‌شود و برای ارتقای عادی شما را به `plugins update <id-or-npm-spec>`، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید به `plugins install <package> --force` راهنمایی می‌کند.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط روی نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pin‌شده می‌خواهید، از یک ref صریح git مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec در npm، فراداده منبع marketplace را پایدار نگه می‌دارند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` گزینه break-glass برای false positiveها در اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه یابد، اما مسدودسازی‌های سیاست hook با نام `before_install` در Plugin را دور نمی‌زند و failureهای اسکن را هم دور نمی‌زند.

    این پرچم CLI روی جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب وابستگی Skills مبتنی بر Gateway از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کند، در حالی‌که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب Skill از ClawHub است.

    اگر Pluginی که در ClawHub منتشر کرده‌اید توسط اسکن رجیستری مسدود شده، از گام‌های ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های hook و specهای npm">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای مشاهده hookهای فیلترشده و فعال‌سازی هر hook، از `openclaw hooks` استفاده کنید، نه برای نصب بسته.

    specهای npm **فقط رجیستری** هستند (نام بسته + **نسخه دقیق** اختیاری یا **dist-tag** اختیاری). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های وابستگی برای ایمنی به‌صورت محلی در پروژه و با `--ignore-scripts` اجرا می‌شوند، حتی وقتی shell شما تنظیمات نصب سراسری npm دارد.

    وقتی می‌خواهید resolution در npm را صریح کنید، از `npm:<package>` استفاده کنید. در دوره گذار راه‌اندازی، specهای بسته ساده نیز مستقیماً از npm نصب می‌شوند.

    specهای ساده و `@latest` روی مسیر پایدار می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` برای این بررسی releaseهای پایدار هستند. اگر npm هرکدام از آن‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک تگ prerelease مانند `@beta`/`@rc` یا یک نسخه دقیق prerelease مانند `@1.2.3-beta.4` صراحتاً opt in کنید.

    اگر یک spec نصب ساده با id یک Plugin رسمی مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی کاتالوگ را مستقیماً نصب می‌کند. برای نصب یک بسته npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    برای نصب مستقیم از یک مخزن git از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل URLهای clone با الگوهای `git:github.com/owner/repo`، `git:owner/repo`، کامل `https://`، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` اضافه کنید.

    نصب‌های Git در یک دایرکتوری موقت clone می‌شوند، اگر ref درخواست‌شده وجود داشته باشد آن را check out می‌کنند، سپس از نصب‌کننده عادی دایرکتوری Plugin استفاده می‌کنند. یعنی اعتبارسنجی مانیفست، اسکن کد خطرناک، کار نصب package-manager، و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit resolve‌شده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    پس از نصب از git، برای تأیید registrationهای runtime مانند متدهای gateway و فرمان‌های CLI از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. اگر Plugin با `api.registerCli` یک ریشه CLI ثبت کرده باشد، آن فرمان را مستقیماً از طریق CLI ریشه OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="آرشیوها">
    آرشیوهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. آرشیوهای Plugin بومی OpenClaw باید یک `openclaw.plugin.json` معتبر در ریشه Plugin استخراج‌شده داشته باشند؛ آرشیوهایی که فقط `package.json` دارند پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

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

OpenClaw پیش از نصب، سازگاری API اعلام‌شده Plugin / حداقل gateway را بررسی می‌کند. وقتی نسخه انتخاب‌شده ClawHub یک artifact از نوع ClawPack منتشر کند، OpenClaw فایل `.tgz` نسخه‌دار npm-pack را دانلود می‌کند، header digest مربوط به ClawHub و digest مربوط به artifact را تأیید می‌کند، سپس آن را از مسیر عادی آرشیو نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون فراداده ClawPack همچنان از مسیر قدیمی تأیید آرشیو بسته نصب می‌شوند. نصب‌های ثبت‌شده فراداده منبع ClawHub، نوع artifact، integrity در npm، shasum در npm، نام tarball، و داده‌های digest مربوط به ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های ClawHub بدون نسخه، یک spec ثبت‌شده بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند releaseهای جدیدتر ClawHub را دنبال کند؛ selectorهای نسخه یا تگ صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان selector pin می‌مانند.

#### shorthand مربوط به Marketplace

وقتی نام marketplace در cache رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از shorthand با الگوی `plugin@marketplace` استفاده کنید:

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
  <Tab title="Marketplace sources">
    - نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشه marketplace محلی یا مسیر `marketplace.json`
    - کوتاه‌نوشت مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL گیت

  </Tab>
  <Tab title="Remote marketplace rules">
    برای marketplaceهای راه‌دوری که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند. OpenClaw منابع مسیر نسبی را از آن مخزن می‌پذیرد و منابع Plugin از نوع HTTP(S)، مسیر مطلق، git، GitHub و دیگر منابع غیرمسیر را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw به‌طور خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه‌های Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشه عادی Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. امروز، Skills بسته، command-skills مربوط به Claude، پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های `.lsp.json` مربوط به Claude / `lspServers` اعلام‌شده در manifest، command-skills مربوط به Cursor، و دایرکتوری‌های hook سازگار با Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگر بسته که تشخیص داده می‌شوند در diagnostics/info نمایش داده می‌شوند اما هنوز به اجرای runtime وصل نشده‌اند.
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
  از نمای جدول به خطوط جزئیات جداگانه برای هر Plugin با فراداده منبع/خاستگاه/نسخه/فعال‌سازی جابه‌جا شو.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن برای ماشین، به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری Plugin محلی پایدارشده را می‌خواند و وقتی رجیستری موجود نباشد یا نامعتبر باشد از fallback مشتق‌شده فقط از manifest استفاده می‌کند. این دستور برای بررسی اینکه آیا یک Plugin نصب، فعال، و برای برنامه‌ریزی راه‌اندازی سرد قابل‌مشاهده است مفید است، اما یک probe زنده runtime از فرایند Gateway ازپیش‌درحال‌اجرا نیست. پس از تغییر کد Plugin، فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار برای اجرای کد `register(api)` یا hookهای جدید، Gatewayای را که به کانال سرویس می‌دهد بازراه‌اندازی کنید. برای استقرارهای راه‌دور/کانتینری، بررسی کنید که فرزند واقعی `openclaw gateway run` را بازراه‌اندازی می‌کنید، نه فقط یک فرایند wrapper.

`plugins list --json` برای هر Plugin، `dependencyStatus` را از `package.json`
`dependencies` و `optionalDependencies` شامل می‌شود. OpenClaw بررسی می‌کند که آیا آن نام‌های بسته در مسیر lookup عادی `node_modules` مربوط به Node برای Plugin وجود دارند یا نه؛ کد runtime مربوط به Plugin را import نمی‌کند، مدیر بسته اجرا نمی‌کند، و وابستگی‌های گم‌شده را تعمیر نمی‌کند.
</Note>

`plugins search` یک lookup کاتالوگ راه‌دور ClawHub است. وضعیت محلی را بررسی نمی‌کند، config را تغییر نمی‌دهد، بسته نصب نمی‌کند، یا کد runtime مربوط به Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو نام بسته ClawHub، خانواده، کانال، نسخه، خلاصه، و یک راهنمای نصب مانند `openclaw plugins install clawhub:<package>` را شامل می‌شوند.

برای کار روی Pluginهای بسته‌شده داخل یک تصویر Docker بسته‌بندی‌شده، دایرکتوری منبع Plugin را روی مسیر منبع بسته‌بندی‌شده متناظر bind-mount کنید، مانند `/app/extensions/synology-chat`. OpenClaw آن overlay منبع mount‌شده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع که صرفاً کپی شده باشد بی‌اثر می‌ماند تا نصب‌های بسته‌بندی‌شده عادی همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hookهای runtime:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics را از یک گذر inspection با ماژول بارگذاری‌شده نشان می‌دهد. inspection مربوط به runtime هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت وابستگی legacy یا بازیابی Pluginهای دانلودشدنی گم‌شده که در config ارجاع شده‌اند از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل‌دسترسی، نکته‌های سرویس/فرایند، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای مکالمه‌ای غیر‌باندل‌شده (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی‌کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، زیرا نصب‌های لینک‌شده به‌جای کپی‌کردن روی هدف نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کنند.

در نصب‌های npm از `--pin` استفاده کنید تا spec دقیق resolve‌شده (`name@version`) در index مدیریت‌شده Plugin ذخیره شود، درحالی‌که رفتار پیش‌فرض بدون pin باقی می‌ماند.
</Note>

### index مربوط به Plugin

فراداده نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. map سطح بالای `installRecords` منبع پایدار فراداده نصب است، از جمله رکوردهای manifestهای خراب یا گم‌شده Plugin. آرایه `plugins` کش رجیستری سرد مشتق‌شده از manifest است. این فایل شامل هشدار ویرایش‌نکنید است و توسط `openclaw plugins update`، حذف نصب، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای legacy ارسالی `plugins.installs` را در config ببیند، آن‌ها را به index مربوط به Plugin منتقل می‌کند و کلید config را حذف می‌کند؛ اگر هرکدام از writeها شکست بخورد، رکوردهای config نگه داشته می‌شوند تا فراداده نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، index پایدار Plugin، ورودی‌های فهرست allow/deny مربوط به Plugin، و در صورت کاربرد ورودی‌های لینک‌شده `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شده ردیابی‌شده را وقتی داخل ریشه افزونه‌های Plugin مربوط به OpenClaw باشد حذف می‌کند. برای Pluginهای active memory، slot حافظه به `memory-core` بازنشانی می‌شود.

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

به‌روزرسانی‌ها روی نصب‌های ردیابی‌شده Plugin در index مدیریت‌شده Plugin و نصب‌های ردیابی‌شده hook-pack در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    وقتی یک id مربوط به Plugin می‌دهید، OpenClaw از spec نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. یعنی dist-tagهای قبلاً ذخیره‌شده مانند `@beta` و نسخه‌های دقیق pinشده در اجراهای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، می‌توانید یک spec صریح بسته npm با dist-tag یا نسخه دقیق نیز بدهید. OpenClaw آن نام بسته را به رکورد ردیابی‌شده Plugin برمی‌گرداند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های آینده مبتنی بر id ثبت می‌کند.

    دادن نام بسته npm بدون نسخه یا tag نیز به رکورد ردیابی‌شده Plugin resolve می‌شود. وقتی یک Plugin به نسخه دقیق pin شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` از spec ردیابی‌شده Plugin دوباره استفاده می‌کند مگر اینکه spec جدیدی بدهید. `openclaw update` علاوه‌براین کانال فعال به‌روزرسانی OpenClaw را می‌شناسد: در کانال beta، رکوردهای Plugin مربوط به npm و ClawHub در خط پیش‌فرض ابتدا `@beta` را امتحان می‌کنند، سپس اگر انتشار beta برای Plugin وجود نداشته باشد به spec پیش‌فرض/latest ثبت‌شده برمی‌گردند. نسخه‌های دقیق و tagهای صریح روی همان selector pin می‌مانند.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    پیش از یک به‌روزرسانی زنده npm، OpenClaw نسخه بسته نصب‌شده را با فراداده رجیستری npm بررسی می‌کند. اگر نسخه نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف resolve‌شده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` نادیده گرفته می‌شود.

    وقتی hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact دریافت‌شده تغییر کند، OpenClaw این را drift artifact مربوط به npm تلقی می‌کند. دستور تعاملی `openclaw plugins update` hashهای موردانتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی به‌صورت fail closed عمل می‌کنند، مگر اینکه فراخواننده یک سیاست ادامه صریح ارائه دهد.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` همچنین در `plugins update` به‌عنوان override اضطراری برای false positiveهای اسکن کد خطرناک داخلی هنگام به‌روزرسانی Pluginها در دسترس است. همچنان بلوک‌های سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند، و فقط روی به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، پرچم‌های سیاست، diagnostics، فراداده نصب، قابلیت‌های بسته، و هر پشتیبانی تشخیص‌داده‌شده از سرور MCP یا LSP را بدون import کردن runtime مربوط به Plugin به‌صورت پیش‌فرض نشان می‌دهد. `--runtime` را اضافه کنید تا ماژول Plugin بارگذاری شود و hookها، ابزارها، commands، services، متدهای Gateway، و routeهای HTTP ثبت‌شده شامل شوند. inspection مربوط به runtime وابستگی‌های گم‌شده Plugin را مستقیماً گزارش می‌کند؛ نصب‌ها و تعمیرها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

commandهای CLI تحت مالکیت Plugin به‌عنوان گروه‌های command ریشه `openclaw` نصب می‌شوند. پس از اینکه `inspect --runtime` یک command را زیر `cliCommands` نشان داد، آن را به‌صورت `openclaw <command> ...` اجرا کنید؛ برای مثال Pluginای که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin براساس چیزی که واقعاً در runtime ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع capability (مثلاً یک Plugin فقط provider)
- **hybrid-capability** — چند نوع capability (مثلاً متن + گفتار + تصویر)
- **hook-only** — فقط hookها، بدون capability یا surface
- **non-capability** — ابزارها/commands/services اما بدون capability

برای اطلاعات بیشتر درباره مدل capability، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل‌خواندن برای ماشین تولید می‌کند که برای اسکریپت‌نویسی و audit مناسب است. `inspect --all` جدولی در سطح کل ناوگان با ستون‌های shape، گونه‌های capability، اعلان‌های سازگاری، قابلیت‌های بسته، و خلاصه hook نمایش می‌دهد. `info` alias برای `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، diagnostics مربوط به manifest/discovery، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

اگر یک Plugin پیکربندی‌شده روی دیسک وجود داشته باشد اما توسط بررسی‌های ایمنی مسیر loader مسدود شده باشد، اعتبارسنجی config ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف `plugins.entries.<id>` یا config مربوط به `plugins.allow`، diagnostic قبلی مربوط به Plugin مسدودشده، مانند مالکیت مسیر یا مجوزهای world-writable، را رفع کنید.

برای شکست‌های شکل ماژول مانند exportهای گم‌شده `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا خلاصه فشرده‌ای از شکل export در خروجی diagnostic شامل شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin مدل خواندنی سرد پایدارشده OpenClaw برای هویت Plugin نصب‌شده، فعال‌سازی، فراداده منبع، و مالکیت contribution است. راه‌اندازی عادی، lookup مالک provider، طبقه‌بندی راه‌اندازی channel، و موجودی Plugin می‌توانند آن را بدون import کردن ماژول‌های runtime مربوط به Plugin بخوانند.

از `plugins registry` برای بررسی این استفاده کنید که آیا رجیستری پایدارشده وجود دارد، به‌روز است، یا کهنه شده است. از `--refresh` برای بازسازی آن از نمایه پایدارشده Plugin، سیاست پیکربندی، و فراداده مانیفست/بسته استفاده کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی زمان اجرا.

`openclaw doctor --fix` همچنین انحراف npm مدیریت‌شده نزدیک به رجیستری را تعمیر می‌کند: اگر یک بسته یتیم یا بازیابی‌شده `@openclaw/*` زیر ریشه npm مدیریت‌شده Plugin یک Plugin همراه را پنهان کند، دستور doctor آن بسته کهنه را حذف می‌کند و رجیستری را بازسازی می‌کند تا راه‌اندازی در برابر مانیفست همراه اعتبارسنجی شود.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک کلید سازگاری منسوخ اضطراری برای خرابی‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback محیط فقط برای بازیابی اضطراری راه‌اندازی هنگام عرضه تدریجی مهاجرت است.
</Warning>

### بازارچه

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست بازارچه یک مسیر محلی بازارچه، یک مسیر `marketplace.json`، یک کوتاه‌نویسی GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git را می‌پذیرد. `--json` برچسب منبع حل‌شده را به‌همراه مانیفست بازارچه تجزیه‌شده و ورودی‌های Plugin چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

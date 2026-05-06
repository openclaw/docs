---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Pluginها
x-i18n:
    generated_at: "2026-05-06T09:07:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های hook، و bundleهای سازگار.

<CardGroup cols={2}>
  <Card title="سیستم Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی، و عیب‌یابی Pluginها.
  </Card>
  <Card title="مدیریت Pluginها" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست‌کردن، به‌روزرسانی، حذف، و انتشار.
  </Card>
  <Card title="Bundleهای Plugin" href="/fa/plugins/bundles">
    مدل سازگاری bundle.
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

برای بررسی نصب، inspect، حذف، یا به‌روزرسانی registry که کند است، فرمان را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. ردگیری، زمان‌بندی فازها را در stderr می‌نویسد و خروجی JSON را قابل‌تجزیه نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
Pluginهای همراه همراه OpenClaw عرضه می‌شوند. بعضی‌ها به‌صورت پیش‌فرض فعال هستند (برای مثال ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه)؛ بقیه به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را همراه با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. Bundleهای سازگار به‌جای آن از مانیفست‌های bundle خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی فهرست/اطلاعات با حالت verbose همچنین زیرنوع bundle (`codex`، `claude`، یا `cursor`) را به‌همراه قابلیت‌های bundle شناسایی‌شده نشان می‌دهد.
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
نام‌های بسته بدون پیشوند، در دوره گذار راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Pluginها را مثل اجرای کد در نظر بگیرید. نسخه‌های pin‌شده را ترجیح دهید.
</Warning>

`plugins search` در ClawHub به‌دنبال بسته‌های Plugin قابل‌نصب می‌گردد و نام بسته‌های آماده نصب را چاپ می‌کند. این فرمان بسته‌های code-plugin و bundle-plugin را جست‌وجو می‌کند، نه Skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. Npm همچنان یک مسیر پشتیبان و نصب مستقیم پشتیبانی‌شده باقی می‌ماند. بسته‌های Plugin متعلق به OpenClaw با نام `@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا [موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند. نصب‌ها و به‌روزرسانی‌های کانال بتا وقتی تگ npm `beta` موجود باشد آن dist-tag را ترجیح می‌دهند، سپس به `latest` برمی‌گردند.
</Note>

<AccordionGroup>
  <Accordion title="Includeهای پیکربندی و ترمیم پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` در همان فایل include‌شده می‌نویسند و `openclaw.json` را دست‌نخورده می‌گذارند. Includeهای ریشه، آرایه‌های include، و includeهایی با overrideهای هم‌سطح به‌جای flatten شدن fail closed می‌شوند. برای شکل‌های پشتیبانی‌شده، [Config includes](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولاً fail closed می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و بارگذاری مجدد داغ، پیکربندی نامعتبر Plugin مثل هر پیکربندی نامعتبر دیگری fail closed می‌شود؛ `openclaw doctor --fix` می‌تواند ورودی Plugin نامعتبر را قرنطینه کند. تنها استثنای مستند در زمان نصب، یک مسیر بازیابی محدود برای Pluginهای همراه است که صراحتاً در `openclaw.install.allowInvalidConfigRecovery` opt in می‌کنند.

  </Accordion>
  <Accordion title="--force و نصب مجدد در برابر به‌روزرسانی">
    `--force` از هدف نصب موجود دوباره استفاده می‌کند و یک Plugin یا بسته hook ازقبل‌نصب‌شده را در همان محل بازنویسی می‌کند. وقتی عمداً همان id را از یک مسیر محلی جدید، آرشیو، بسته ClawHub، یا artifact npm دوباره نصب می‌کنید از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل ردیابی می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id یک Plugin که از قبل نصب است اجرا کنید، OpenClaw متوقف می‌شود و برای ارتقای معمول شما را به `plugins update <id-or-npm-spec>`، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید به `plugins install <package> --force` راهنمایی می‌کند.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط روی نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pin‌شده می‌خواهید از یک ref صریح git مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای یک spec مربوط به npm، فراداده منبع marketplace را پایدار نگه می‌دارند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` یک گزینه اضطراری برای مثبت‌های کاذب در اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه پیدا کند، اما بلوک‌های سیاست hook مربوط به `before_install` در Plugin را دور نمی‌زند و خرابی‌های اسکن را هم دور نمی‌زند.

    این پرچم CLI روی جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skill که با Gateway پشتیبانی می‌شوند از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب Skill از ClawHub است.

    اگر Pluginی که در ClawHub منتشر کرده‌اید با اسکن registry مسدود شده است، از مراحل ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های Hook و specهای npm">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای مشاهده hookها به‌صورت فیلترشده و فعال‌سازی هر hook از `openclaw hooks` استفاده کنید، نه برای نصب بسته.

    Specهای npm **فقط registry** هستند (نام بسته + **نسخه دقیق** اختیاری یا **dist-tag** اختیاری). Specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های وابستگی برای ایمنی به‌صورت project-local و با `--ignore-scripts` اجرا می‌شوند، حتی وقتی shell شما تنظیمات نصب سراسری npm دارد.

    وقتی می‌خواهید resolution npm را صریح کنید از `npm:<package>` استفاده کنید. Specهای بسته بدون پیشوند نیز در دوره گذار راه‌اندازی مستقیماً از npm نصب می‌شوند.

    Specهای بدون پیشوند و `@latest` روی مسیر پایدار می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` برای این بررسی انتشارهای پایدار هستند. اگر npm هرکدام از این‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک تگ prerelease مانند `@beta`/`@rc` یا یک نسخه prerelease دقیق مانند `@1.2.3-beta.4` صراحتاً opt in کنید.

    اگر یک spec نصب بدون پیشوند با id یک Plugin رسمی مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی catalog را مستقیماً نصب می‌کند. برای نصب یک بسته npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    از `git:<repo>` برای نصب مستقیم از یک مخزن git استفاده کنید. شکل‌های پشتیبانی‌شده شامل URLهای clone به‌شکل `git:github.com/owner/repo`، `git:owner/repo`، `https://` کامل، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای check out کردن یک branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` را اضافه کنید.

    نصب‌های Git در یک دایرکتوری موقت clone می‌شوند، در صورت وجود ref درخواست‌شده را check out می‌کنند، سپس از نصب‌کننده عادی دایرکتوری Plugin استفاده می‌کنند. یعنی اعتبارسنجی مانیفست، اسکن کد خطرناک، کار نصب package-manager، و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده URL/ref منبع به‌همراه commit resolve‌شده را شامل می‌شوند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    پس از نصب از git، از `openclaw plugins inspect <id> --runtime --json` برای راستی‌آزمایی ثبت‌های runtime مانند متدهای gateway و فرمان‌های CLI استفاده کنید. اگر Plugin یک ریشه CLI را با `api.registerCli` ثبت کرده باشد، آن فرمان را مستقیماً از طریق CLI ریشه OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="آرشیوها">
    آرشیوهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. آرشیوهای Plugin بومی OpenClaw باید یک `openclaw.plugin.json` معتبر در ریشه Plugin استخراج‌شده داشته باشند؛ آرشیوهایی که فقط `package.json` دارند پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball از npm-pack است و می‌خواهید همان مسیر نصب مدیریت‌شده npm-root را که نصب‌های registry استفاده می‌کنند آزمایش کنید، از `npm-pack:<path.tgz>` استفاده کنید؛ شامل اعتبارسنجی `package-lock.json`، اسکن وابستگی‌های hoisted، و رکوردهای نصب npm. مسیرهای آرشیو ساده همچنان به‌عنوان آرشیوهای محلی زیر ریشه extensions مربوط به Plugin نصب می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Specهای Plugin سازگار با npm و بدون پیشوند، در دوره گذار راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح‌کردن resolution فقط از npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، API اعلام‌شده Plugin / حداقل سازگاری gateway را بررسی می‌کند. وقتی نسخه انتخاب‌شده ClawHub یک artifact از نوع ClawPack منتشر می‌کند، OpenClaw فایل `.tgz` مربوط به npm-pack نسخه‌دار را دانلود می‌کند، digest header مربوط به ClawHub و digest خود artifact را راستی‌آزمایی می‌کند، سپس آن را از مسیر عادی آرشیو نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون فراداده ClawPack همچنان از مسیر قدیمی اعتبارسنجی آرشیو بسته نصب می‌شوند. نصب‌های ثبت‌شده، فراداده منبع ClawHub، نوع artifact، integrity مربوط به npm، shasum مربوط به npm، نام tarball، و واقعیت‌های digest مربوط به ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های بدون نسخه ClawHub یک spec ثبت‌شده بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند انتشارهای جدیدتر ClawHub را دنبال کند؛ selectorهای نسخه یا تگ صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` روی همان selector pin می‌مانند.

#### میان‌بر Marketplace

وقتی نام marketplace در cache محلی registry مربوط به Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از میان‌بر `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع marketplace را صریحاً پاس بدهید، از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="منابع بازارچه">
    - نام بازارچه شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشه بازارچه محلی یا مسیر `marketplace.json`
    - کوتاه‌نویسی مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL مربوط به git

  </Tab>
  <Tab title="قواعد بازارچه راه‌دور">
    برای بازارچه‌های راه‌دوری که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن بازارچه کلون‌شده باقی بمانند. OpenClaw منابع مسیر نسبی را از همان مخزن می‌پذیرد و منابع HTTP(S)، مسیر مطلق، git، GitHub، و دیگر منابع غیرمسیر Plugin را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرهای محلی و آرشیوها، OpenClaw به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشه معمول Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. امروز، Skills بسته‌ها، command-skills مربوط به Claude، پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های `.lsp.json` مربوط به Claude / `lspServers` اعلام‌شده در manifest، command-skills مربوط به Cursor، و دایرکتوری‌های hook سازگار با Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگرِ شناسایی‌شده بسته در diagnostics/info نشان داده می‌شوند اما هنوز به اجرای runtime وصل نشده‌اند.
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
  فقط Pluginهای فعال را نشان می‌دهد.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خط‌های جزئیات برای هر Plugin با فراداده منبع/خاستگاه/نسخه/فعال‌سازی تغییر می‌دهد.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن برای ماشین به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی ماندگارشده Plugin را می‌خواند، و وقتی رجیستری وجود ندارد یا نامعتبر است از جایگزین مشتق‌شده فقط از manifest استفاده می‌کند. این دستور برای بررسی نصب، فعال بودن، و قابل‌مشاهده بودن یک Plugin برای برنامه‌ریزی راه‌اندازی سرد مفید است، اما کاوشگر زنده runtime برای فرایند Gateway از قبل در حال اجرا نیست. پس از تغییر کد Plugin، فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار برای اجرای کد `register(api)` یا hookهای جدید، Gatewayای را که به کانال سرویس می‌دهد راه‌اندازی مجدد کنید. برای استقرارهای راه‌دور/کانتینری، بررسی کنید که فرزند واقعی `openclaw gateway run` را راه‌اندازی مجدد می‌کنید، نه فقط یک فرایند پوشاننده.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `package.json`
`dependencies` و `optionalDependencies` است. OpenClaw بررسی می‌کند آیا آن نام‌های بسته
در مسیر جست‌وجوی معمول Node `node_modules` مربوط به Plugin حضور دارند یا نه؛
کد runtime Plugin را import نمی‌کند، package manager اجرا نمی‌کند، یا وابستگی‌های
گم‌شده را تعمیر نمی‌کند.
</Note>

`plugins search` جست‌وجوی کاتالوگ راه‌دور ClawHub است. این دستور وضعیت محلی را بررسی نمی‌کند،
config را تغییر نمی‌دهد، بسته‌ها را نصب نمی‌کند، یا کد runtime مربوط به Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو
شامل نام بسته ClawHub، خانواده، کانال، نسخه، خلاصه، و
راهنمای نصبی مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Pluginهای همراه داخل یک image بسته‌بندی‌شده Docker، دایرکتوری
منبع Plugin را روی مسیر منبع بسته‌بندی‌شده متناظر bind-mount کنید، مانند
`/app/extensions/synology-chat`. OpenClaw آن overlay منبع mountشده را
پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع
صرفا کپی‌شده بی‌اثر می‌ماند تا نصب‌های بسته‌بندی‌شده معمول همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hook در runtime:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics را از یک گذر بازرسی که ماژول را بارگذاری کرده نشان می‌دهد. بازرسی runtime هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت وابستگی legacy یا بازیابی Pluginهای قابل‌دانلود گم‌شده که در config به آن‌ها ارجاع شده از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway در دسترس، راهنمایی‌های service/process، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای گفت‌وگوی غیرهمراه (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های لینک‌شده به‌جای کپی کردن روی هدف نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کنند.

برای نصب‌های npm از `--pin` استفاده کنید تا spec دقیق resolveشده (`name@version`) در شاخص Plugin مدیریت‌شده ذخیره شود، درحالی‌که رفتار پیش‌فرض بدون pin باقی می‌ماند.
</Note>

### شاخص Plugin

فراداده نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. نقشه سطح بالای `installRecords` منبع پایدار فراداده نصب است، از جمله رکوردهای manifestهای خراب یا گم‌شده Plugin. آرایه `plugins` کش رجیستری سرد مشتق‌شده از manifest است. این فایل شامل هشدار ویرایش نکنید است و توسط `openclaw plugins update`، حذف نصب، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای legacy ارسالی `plugins.installs` را در config ببیند، آن‌ها را به شاخص Plugin منتقل می‌کند و کلید config را حذف می‌کند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، رکوردهای config نگه داشته می‌شوند تا فراداده نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، شاخص ماندگارشده Plugin، ورودی‌های فهرست مجاز/غیرمجاز Plugin، و ورودی‌های لینک‌شده `plugins.load.paths` در صورت کاربرد حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شده ردیابی‌شده را وقتی داخل ریشه افزونه‌های Plugin مربوط به OpenClaw باشد حذف می‌کند. برای Pluginهای active memory، شکاف حافظه به `memory-core` بازنشانی می‌شود.

<Note>
`--keep-config` به‌عنوان نام مستعار منسوخ برای `--keep-files` پشتیبانی می‌شود.
</Note>

### به‌روزرسانی

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

به‌روزرسانی‌ها روی نصب‌های ردیابی‌شده Plugin در شاخص Plugin مدیریت‌شده و نصب‌های ردیابی‌شده hook-pack در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="resolve کردن شناسه Plugin در برابر spec npm">
    وقتی یک شناسه Plugin را وارد می‌کنید، OpenClaw از spec نصب ثبت‌شده برای همان Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شده قبلی مانند `@beta` و نسخه‌های دقیق pinشده همچنان در اجراهای بعدی `update <id>` استفاده می‌شوند.

    برای نصب‌های npm، می‌توانید یک spec صریح بسته npm با یک dist-tag یا نسخه دقیق نیز وارد کنید. OpenClaw آن نام بسته را دوباره به رکورد Plugin ردیابی‌شده resolve می‌کند، همان Plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های آینده مبتنی بر شناسه ثبت می‌کند.

    وارد کردن نام بسته npm بدون نسخه یا tag نیز دوباره به رکورد Plugin ردیابی‌شده resolve می‌شود. زمانی از این استفاده کنید که یک Plugin به نسخه‌ای دقیق pin شده و می‌خواهید آن را دوباره به خط انتشار پیش‌فرض رجیستری برگردانید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال beta">
    `openclaw plugins update` از spec Plugin ردیابی‌شده دوباره استفاده می‌کند مگر اینکه spec جدیدی وارد کنید. `openclaw update` افزون بر این کانال به‌روزرسانی فعال OpenClaw را می‌شناسد: در کانال beta، رکوردهای Plugin مربوط به npm خط پیش‌فرض و ClawHub ابتدا `@beta` را امتحان می‌کنند، سپس اگر هیچ انتشار beta برای Plugin وجود نداشته باشد به spec پیش‌فرض/latest ثبت‌شده برمی‌گردند. نسخه‌های دقیق و tagهای صریح به همان گزینشگر pin می‌مانند.

  </Accordion>
  <Accordion title="بررسی‌های نسخه و تغییر یکپارچگی">
    پیش از یک به‌روزرسانی زنده npm، OpenClaw نسخه بسته نصب‌شده را در برابر فراداده رجیستری npm بررسی می‌کند. اگر نسخه نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف resolveشده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب مجدد، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی یک hash یکپارچگی ذخیره‌شده وجود دارد و hash artifact دریافت‌شده تغییر می‌کند، OpenClaw آن را به‌عنوان تغییر artifact در npm در نظر می‌گیرد. دستور تعاملی `openclaw plugins update` hashهای موردانتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. کمک‌کننده‌های به‌روزرسانی غیرتعاملی به‌صورت بسته شکست می‌خورند مگر اینکه فراخواننده سیاست ادامه صریحی فراهم کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install در به‌روزرسانی">
    `--dangerously-force-unsafe-install` همچنین در `plugins update` به‌عنوان override اضطراری برای مثبت‌های کاذب اسکن built-in کد خطرناک هنگام به‌روزرسانی Plugin در دسترس است. با این حال، همچنان بلوک‌های سیاست `before_install` مربوط به Plugin یا مسدودسازی شکست اسکن را دور نمی‌زند، و فقط برای به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

بازرسی، هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، پرچم‌های سیاست، diagnostics، فراداده نصب، قابلیت‌های بسته، و هرگونه پشتیبانی شناسایی‌شده از سرور MCP یا LSP را بدون import کردن runtime مربوط به Plugin به‌صورت پیش‌فرض نشان می‌دهد. `--runtime` را اضافه کنید تا ماژول Plugin بارگذاری شود و hookها، ابزارها، commandها، serviceها، متدهای Gateway، و routeهای HTTP ثبت‌شده نیز درج شوند. بازرسی runtime وابستگی‌های گم‌شده Plugin را مستقیما گزارش می‌کند؛ نصب‌ها و تعمیرها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

دستورهای CLI تحت مالکیت Plugin به‌عنوان گروه‌های دستور ریشه `openclaw` نصب می‌شوند. پس از اینکه `inspect --runtime` یک دستور را زیر `cliCommands` نشان داد، آن را به‌شکل `openclaw <command> ...` اجرا کنید؛ برای مثال Pluginای که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin بر اساس آنچه واقعا در runtime ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (مثلا یک Plugin فقط provider)
- **hybrid-capability** — چند نوع قابلیت (مثلا متن + گفتار + تصویر)
- **hook-only** — فقط hookها، بدون قابلیت یا سطح
- **non-capability** — ابزارها/commandها/serviceها اما بدون قابلیت

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل‌خواندن برای ماشین خروجی می‌دهد که برای اسکریپت‌نویسی و audit مناسب است. `inspect --all` جدولی در سطح کل fleet با ستون‌های شکل، انواع قابلیت، اعلان‌های سازگاری، قابلیت‌های بسته، و خلاصه hook رندر می‌کند. `info` نام مستعار `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، diagnostics مربوط به manifest/discovery، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز پاک باشد `No plugin issues detected.` را چاپ می‌کند.

اگر یک Plugin پیکربندی‌شده روی دیسک حاضر باشد اما توسط بررسی‌های ایمنی مسیرِ loader مسدود شود، اعتبارسنجی config ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف config مربوط به `plugins.entries.<id>` یا `plugins.allow`، diagnostic قبلی Plugin مسدودشده را، مانند مالکیت مسیر یا مجوزهای قابل‌نوشتن برای همه، اصلاح کنید.

برای شکست‌های شکل ماژول مانند exportهای گم‌شده `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا خلاصه فشرده شکل export در خروجی diagnostic درج شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری Plugin محلی، مدل خواندن سردِ ماندگارشده‌ی OpenClaw برای هویت Pluginهای نصب‌شده، فعال‌سازی، فراداده‌ی منبع، و مالکیت مشارکت‌ها است. راه‌اندازی عادی، جست‌وجوی مالک ارائه‌دهنده، دسته‌بندی راه‌اندازی کانال، و موجودی Plugin می‌توانند بدون وارد کردن ماژول‌های زمان اجرای Plugin آن را بخوانند.

از `plugins registry` برای بررسی اینکه رجیستری ماندگارشده موجود، به‌روز یا کهنه است استفاده کنید. از `--refresh` برای بازسازی آن از نمایه‌ی Plugin ماندگارشده، خط‌مشی پیکربندی، و فراداده‌ی manifest/package استفاده کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی زمان اجرا.

`openclaw doctor --fix` همچنین drift مدیریت‌شده‌ی npm در مجاورت رجیستری را تعمیر می‌کند: اگر یک بسته‌ی یتیم یا بازیابی‌شده‌ی `@openclaw/*` زیر ریشه‌ی npm مدیریت‌شده‌ی Plugin، یک Plugin همراه را تحت‌الشعاع قرار دهد، doctor آن بسته‌ی کهنه را حذف می‌کند و رجیستری را بازسازی می‌کند تا راه‌اندازی در برابر manifest همراه اعتبارسنجی شود.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک سوییچ سازگاری منسوخ‌شده‌ی اضطراری برای شکست‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback محیطی فقط برای بازیابی اضطراری راه‌اندازی هنگام rollout مهاجرت است.
</Warning>

### بازارچه

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست بازارچه یک مسیر بازارچه‌ی محلی، یک مسیر `marketplace.json`، یک کوتاه‌نویسی GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git را می‌پذیرد. `--json` برچسب منبع حل‌شده به‌همراه manifest بازارچه‌ی تجزیه‌شده و ورودی‌های Plugin را چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

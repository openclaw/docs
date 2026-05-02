---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginها
x-i18n:
    generated_at: "2026-05-02T22:18:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های hook و bundleهای سازگار.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی و عیب‌یابی pluginها.
  </Card>
  <Card title="Manage plugins" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست‌گیری، به‌روزرسانی، حذف نصب و انتشار.
  </Card>
  <Card title="Plugin bundles" href="/fa/plugins/bundles">
    مدل سازگاری bundle.
  </Card>
  <Card title="Plugin manifest" href="/fa/plugins/manifest">
    فیلدهای manifest و schema پیکربندی.
  </Card>
  <Card title="Security" href="/fa/gateway/security">
    سخت‌سازی امنیتی برای نصب pluginها.
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

برای بررسی نصب، inspect، حذف نصب، یا تازه‌سازی registry که کند است، دستور را با
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی فازها را در stderr می‌نویسد
و خروجی JSON را قابل parse نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
pluginهای bundleشده همراه OpenClaw ارائه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال providerهای مدل bundleشده، providerهای گفتار bundleشده، و plugin مرورگر bundleشده)؛ بقیه به `plugins enable` نیاز دارند.

pluginهای بومی OpenClaw باید `openclaw.plugin.json` را با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) ارائه کنند. bundleهای سازگار به‌جای آن از manifestهای bundle خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی verbose فهرست/info همچنین زیرگونه bundle (`codex`، `claude`، یا `cursor`) به‌همراه قابلیت‌های bundle شناسایی‌شده را نشان می‌دهد.
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
نام‌های package بدون پیشوند، در دوره گذار راه‌اندازی، به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب pluginها را مانند اجرای کد در نظر بگیرید. نسخه‌های pinشده را ترجیح دهید.
</Warning>

`plugins search` از ClawHub برای packageهای plugin قابل نصب query می‌گیرد و نام packageهای
آماده نصب را چاپ می‌کند. این دستور packageهای code-plugin و bundle-plugin را جست‌وجو می‌کند،
نه Skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر pluginها است. Npm
همچنان به‌عنوان مسیر fallback و نصب مستقیم پشتیبانی می‌شود. packageهای plugin متعلق به OpenClaw با نام
`@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را
در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا
[موجودی plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند.
نصب‌ها و به‌روزرسانی‌های کانال beta، وقتی تگ در دسترس باشد، dist-tag
`beta` در npm را ترجیح می‌دهند و سپس به `latest` fallback می‌کنند.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config recovery">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` تغییرات را در همان فایل includeشده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای ریشه، آرایه‌های include، و includeهایی با overrideهای هم‌سطح، به‌جای flatten شدن، به‌صورت بسته fail می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر هنگام نصب پیکربندی نامعتبر باشد، `plugins install` معمولاً به‌صورت بسته fail می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام startup شدن Gateway، پیکربندی نامعتبر برای یک plugin فقط به همان plugin محدود می‌شود تا channelها و pluginهای دیگر بتوانند به کار ادامه دهند؛ `openclaw doctor --fix` می‌تواند entry نامعتبر plugin را قرنطینه کند. تنها استثنای مستند در زمان نصب، یک مسیر بازیابی محدود برای pluginهای bundleشده است که صراحتاً `openclaw.install.allowInvalidConfigRecovery` را opt in می‌کنند.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` مقصد نصب موجود را دوباره استفاده می‌کند و یک plugin یا بسته hook از قبل نصب‌شده را در همان محل بازنویسی می‌کند. وقتی عمداً همان id را از یک مسیر محلی جدید، archive، package در ClawHub، یا artifact در npm دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای معمول یک plugin در npm که از قبل track شده است، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id یک plugin که از قبل نصب شده اجرا کنید، OpenClaw متوقف می‌شود و برای ارتقای عادی شما را به `plugins update <id-or-npm-spec>`، یا وقتی واقعاً می‌خواهید نصب فعلی را از یک منبع متفاوت بازنویسی کنید، به `plugins install <package> --force` راهنمایی می‌کند.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pinشده می‌خواهید، از یک ref صریح git مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec در npm، فراداده منبع marketplace را نگه می‌دارند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` یک گزینه اضطراری برای مثبت‌های کاذب در scanner داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی وقتی scanner داخلی یافته‌های `critical` گزارش می‌کند ادامه یابد، اما blockهای policy مربوط به hook `before_install` در plugin را دور نمی‌زند و failureهای scan را نیز دور نمی‌زند.

    این flag در CLI برای جریان‌های نصب/به‌روزرسانی plugin اعمال می‌شود. نصب dependencyهای Skills که با Gateway پشتیبانی می‌شوند از override متناظر درخواست `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب Skill از ClawHub است.

    اگر pluginی که در ClawHub منتشر کرده‌اید با scan registry مسدود شده است، از مراحل publisher در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` expose می‌کنند. برای visibility فیلترشده hook و فعال‌سازی به‌ازای هر hook، از `openclaw hooks` استفاده کنید، نه برای نصب package.

    specهای npm **فقط registry** هستند (نام package + **نسخه دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و rangeهای semver رد می‌شوند. نصب dependencyها برای ایمنی به‌صورت project-local با `--ignore-scripts` اجرا می‌شود، حتی وقتی shell شما تنظیمات نصب global npm دارد.

    وقتی می‌خواهید resolution در npm را صریح کنید، از `npm:<package>` استفاده کنید. specهای package بدون پیشوند نیز در دوره گذار راه‌اندازی مستقیماً از npm نصب می‌شوند.

    specهای بدون پیشوند و `@latest` روی مسیر پایدار می‌مانند. اگر npm هرکدام از این‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد صراحتاً با یک تگ prerelease مانند `@beta`/`@rc` یا یک نسخه prerelease دقیق مانند `@1.2.3-beta.4` opt in کنید.

    اگر یک spec نصب بدون پیشوند با id یک plugin رسمی مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw entry کاتالوگ را مستقیماً نصب می‌کند. برای نصب یک package در npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    برای نصب مستقیم از یک repository در git، از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل `git:github.com/owner/repo`، `git:owner/repo`، URLهای کامل clone با `https://`، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای checkout کردن branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` اضافه کنید.

    نصب‌های Git در یک directory موقت clone می‌شوند، وقتی ref درخواست‌شده وجود داشته باشد آن را check out می‌کنند، سپس از installer عادی directory plugin استفاده می‌کنند. یعنی اعتبارسنجی manifest، scan کد خطرناک، کار نصب package-manager، و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit resolveشده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    پس از نصب از git، از `openclaw plugins inspect <id> --runtime --json` استفاده کنید تا registrationهای runtime مانند methodهای gateway و دستورهای CLI را تأیید کنید. اگر plugin یک ریشه CLI با `api.registerCli` ثبت کرده است، آن دستور را مستقیماً از طریق CLI ریشه OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. archiveهای plugin بومی OpenClaw باید یک `openclaw.plugin.json` معتبر در ریشه plugin استخراج‌شده داشته باشند؛ archiveهایی که فقط `package.json` دارند، پیش از آن‌که OpenClaw رکوردهای نصب را بنویسد، رد می‌شوند.

    نصب‌های marketplace در Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

specهای plugin سازگار با npm و بدون پیشوند، در دوره گذار راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح کردن resolution فقط از npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، API اعلام‌شده plugin / حداقل سازگاری gateway را بررسی می‌کند. وقتی نسخه انتخاب‌شده ClawHub یک artifact از نوع ClawPack منتشر می‌کند، OpenClaw `.tgz` نسخه‌بندی‌شده npm-pack را دانلود می‌کند، header digest در ClawHub و digest artifact را تأیید می‌کند، سپس آن را از مسیر archive عادی نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون فراداده ClawPack همچنان از مسیر قدیمی اعتبارسنجی archive package نصب می‌شوند. نصب‌های ثبت‌شده، فراداده منبع ClawHub، نوع artifact، integrity در npm، shasum در npm، نام tarball، و facts مربوط به digest در ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های ClawHub بدون نسخه، spec ثبت‌شده بدون نسخه را نگه می‌دارند تا `openclaw plugins update` بتواند releaseهای جدیدتر ClawHub را دنبال کند؛ selectorهای صریح نسخه یا tag مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان selector pin می‌مانند.

#### shorthand در Marketplace

وقتی نام marketplace در cache محلی registry متعلق به Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از shorthand `plugin@marketplace` استفاده کنید:

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
  <Tab title="منابع Marketplace">
    - نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشه marketplace محلی یا مسیر `marketplace.json`
    - کوتاه‌نویسی مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - URL گیت

  </Tab>
  <Tab title="قواعد marketplace راه‌دور">
    برای marketplaceهای راه‌دور که از GitHub یا گیت بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند. OpenClaw منابع مسیر نسبی از آن مخزن را می‌پذیرد و منابع Plugin از نوع HTTP(S)، مسیر مطلق، گیت، GitHub و دیگر منابع غیرمسیر را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشه معمول Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. امروز، Skills بسته، command-skillهای Claude، پیش‌فرض‌های `settings.json` در Claude، پیش‌فرض‌های `.lsp.json` در Claude / `lspServers` اعلام‌شده در manifest، command-skillهای Cursor، و دایرکتوری‌های hook سازگار Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگر بسته که شناسایی می‌شوند در diagnostics/info نمایش داده می‌شوند اما هنوز به اجرای runtime وصل نشده‌اند.
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
  از نمای جدول به خط‌های جزئیات برای هر Plugin، همراه با فراداده منبع/خاستگاه/نسخه/فعال‌سازی، تغییر وضعیت بده.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن توسط ماشین به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های package.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری Plugin محلی ذخیره‌شده را می‌خواند و وقتی رجیستری وجود نداشته باشد یا نامعتبر باشد، از fallback مشتق‌شده فقط از manifest استفاده می‌کند. این دستور برای بررسی اینکه آیا یک Plugin نصب، فعال و برای برنامه‌ریزی راه‌اندازی سرد قابل‌مشاهده است مفید است، اما probe زنده runtime از یک فرایند Gateway در حال اجرا نیست. پس از تغییر کد Plugin، فعال‌سازی، سیاست hook یا `plugins.load.paths`، پیش از انتظار اجرای کد `register(api)` یا hookهای جدید، Gatewayای را که به کانال سرویس می‌دهد دوباره راه‌اندازی کنید. برای استقرارهای راه‌دور/container، بررسی کنید که فرزند واقعی `openclaw gateway run` را دوباره راه‌اندازی می‌کنید، نه فقط یک فرایند wrapper.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `package.json`
`dependencies` و `optionalDependencies` است. OpenClaw بررسی می‌کند که آیا آن نام‌های package در مسیر lookup معمول Node `node_modules` برای Plugin وجود دارند؛
کد runtime Plugin را import نمی‌کند، package manager را اجرا نمی‌کند، و وابستگی‌های
گم‌شده را repair نمی‌کند.
</Note>

`plugins search` یک جست‌وجوی catalog راه‌دور ClawHub است. وضعیت محلی را بررسی نمی‌کند، config را تغییر نمی‌دهد، package نصب نمی‌کند، یا کد runtime Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو شامل نام package در ClawHub، خانواده، کانال، نسخه، خلاصه، و راهنمای نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Pluginهای همراه داخل یک image بسته‌بندی‌شده Docker، دایرکتوری source Plugin را روی مسیر source بسته‌بندی‌شده متناظر bind-mount کنید، مانند
`/app/extensions/synology-chat`. OpenClaw آن overlay source mount‌شده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری source که صرفاً کپی شده باشد بی‌اثر می‌ماند تا نصب‌های بسته‌بندی‌شده معمول همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hookهای runtime:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics را از یک گذر inspection با module-loaded نشان می‌دهد. Runtime inspection هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت وابستگی legacy یا نصب Pluginهای دانلودی پیکربندی‌شده گم‌شده از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل‌دسترسی، راهنماهای service/process، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای گفت‌وگوی غیرهمراه (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی‌کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` با `--link` پشتیبانی نمی‌شود، زیرا نصب‌های لینک‌شده به‌جای کپی‌کردن روی مقصد نصب مدیریت‌شده، از مسیر source دوباره استفاده می‌کنند.

در نصب‌های npm از `--pin` استفاده کنید تا spec دقیق resolve‌شده (`name@version`) در index Plugin مدیریت‌شده ذخیره شود، درحالی‌که رفتار پیش‌فرض بدون pin باقی می‌ماند.
</Note>

### index Plugin

فراداده نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. map سطح بالای `installRecords` منبع پایدار فراداده نصب است، شامل رکوردهای manifestهای Plugin خراب یا گم‌شده. آرایه `plugins` کش رجیستری سرد مشتق‌شده از manifest است. فایل شامل هشدار ویرایش‌نکنید است و توسط `openclaw plugins update`، حذف نصب، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای legacy ارسال‌شده `plugins.installs` را در config می‌بیند، آن‌ها را به index Plugin منتقل می‌کند و کلید config را حذف می‌کند؛ اگر هرکدام از writeها شکست بخورد، رکوردهای config نگه داشته می‌شوند تا فراداده نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، index ذخیره‌شده Plugin، ورودی‌های allow/deny list Plugin، و ورودی‌های لینک‌شده `plugins.load.paths` در صورت کاربرد حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شده ردیابی‌شده را وقتی داخل ریشه افزونه‌های Plugin در OpenClaw باشد حذف می‌کند. برای Pluginهای active memory، slot حافظه به `memory-core` reset می‌شود.

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

به‌روزرسانی‌ها روی نصب‌های Plugin ردیابی‌شده در index Plugin مدیریت‌شده و نصب‌های hook-pack ردیابی‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="Resolve کردن id Plugin در برابر spec npm">
    وقتی یک id Plugin را می‌دهید، OpenClaw از spec نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شده قبلی مانند `@beta` و نسخه‌های دقیق pin‌شده در اجراهای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، همچنین می‌توانید یک spec صریح package npm با dist-tag یا نسخه دقیق بدهید. OpenClaw آن نام package را به رکورد Plugin ردیابی‌شده resolve می‌کند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های آینده مبتنی بر id ثبت می‌کند.

    دادن نام package npm بدون نسخه یا tag نیز به رکورد Plugin ردیابی‌شده resolve می‌شود. وقتی Plugin به یک نسخه دقیق pin شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال بتا">
    `openclaw plugins update` از spec Plugin ردیابی‌شده دوباره استفاده می‌کند مگر اینکه spec جدیدی بدهید. `openclaw update` علاوه بر این کانال به‌روزرسانی فعال OpenClaw را می‌شناسد: در کانال بتا، رکوردهای Plugin پیش‌فرض npm و ClawHub ابتدا `@beta` را امتحان می‌کنند، سپس اگر انتشار بتای Plugin وجود نداشته باشد به spec پیش‌فرض/latest ثبت‌شده برمی‌گردند. نسخه‌های دقیق و tagهای صریح به همان selector خود pin می‌مانند.

  </Accordion>
  <Accordion title="بررسی‌های نسخه و drift یکپارچگی">
    پیش از به‌روزرسانی زنده npm، OpenClaw نسخه package نصب‌شده را در برابر فراداده رجیستری npm بررسی می‌کند. اگر نسخه نصب‌شده و هویت artifact ثبت‌شده از قبل با target resolve‌شده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact دریافت‌شده تغییر کند، OpenClaw آن را drift artifact در npm تلقی می‌کند. دستور تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی به‌صورت fail closed عمل می‌کنند مگر اینکه فراخواننده یک سیاست ادامه صریح ارائه دهد.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install در update">
    `--dangerously-force-unsafe-install` همچنین در `plugins update` به‌عنوان override اضطراری برای false positiveهای scan کد خطرناک داخلی هنگام به‌روزرسانی Pluginها در دسترس است. این همچنان blockهای سیاست `before_install` در Plugin یا blocking شکست scan را دور نمی‌زند، و فقط برای به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، flagهای سیاست، diagnostics، فراداده نصب، قابلیت‌های bundle، و هر پشتیبانی شناسایی‌شده MCP یا LSP server را بدون import کردن runtime Plugin به‌صورت پیش‌فرض نشان می‌دهد. `--runtime` را اضافه کنید تا module Plugin بارگذاری شود و hookها، tools، commands، services، gateway methods، و routeهای HTTP ثبت‌شده شامل شوند. Runtime inspection وابستگی‌های گم‌شده Plugin را مستقیم گزارش می‌کند؛ نصب‌ها و repairها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

دستورهای CLI تحت مالکیت Plugin به‌عنوان گروه‌های دستور ریشه `openclaw` نصب می‌شوند. پس از اینکه `inspect --runtime` یک دستور را زیر `cliCommands` نشان داد، آن را به‌شکل `openclaw <command> ...` اجرا کنید؛ برای مثال Pluginی که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin بر اساس چیزی که واقعاً در runtime ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (مثلاً Plugin فقط provider)
- **hybrid-capability** — چند نوع قابلیت (مثلاً متن + گفتار + تصویر)
- **hook-only** — فقط hookها، بدون قابلیت یا سطح‌ها
- **non-capability** — tools/commands/services اما بدون قابلیت‌ها

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
flag `--json` گزارشی قابل‌خواندن توسط ماشین مناسب scripting و auditing خروجی می‌دهد. `inspect --all` جدولی برای کل fleet با ستون‌های shape، گونه‌های قابلیت، اعلان‌های سازگاری، قابلیت‌های bundle، و خلاصه hook نمایش می‌دهد. `info` alias برای `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، diagnostics مربوط به manifest/discovery، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز clean باشد `No plugin issues detected.` را چاپ می‌کند.

برای شکست‌های module-shape مانند exportهای گم‌شده `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا خلاصه فشرده export-shape در خروجی diagnostic درج شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin مدل خواندن سرد ذخیره‌شده OpenClaw برای هویت Plugin نصب‌شده، فعال‌سازی، فراداده source، و مالکیت contribution است. راه‌اندازی معمول، lookup مالک provider، طبقه‌بندی setup کانال، و موجودی Plugin می‌توانند آن را بدون import کردن moduleهای runtime Plugin بخوانند.

از `plugins registry` برای بررسی اینکه آیا رجیستری ذخیره‌شده حاضر، current، یا stale است استفاده کنید. از `--refresh` برای بازسازی آن از index ذخیره‌شده Plugin، سیاست config، و فراداده manifest/package استفاده کنید. این یک مسیر repair است، نه مسیر فعال‌سازی runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک کلید سازگاری اضطراری منسوخ‌شده برای خرابی‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ جایگزین env فقط برای بازیابی اضطراری راه‌اندازی هنگام عرضهٔ مهاجرت است.
</Warning>

### بازارچه

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست بازارچه یک مسیر بازارچهٔ محلی، یک مسیر `marketplace.json`، یک خلاصه‌نویسی GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL گیت را می‌پذیرد. `--json` برچسب منبع حل‌شده را همراه با مانیفست بازارچهٔ تجزیه‌شده و مدخل‌های Plugin چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

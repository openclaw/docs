---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خرابی‌های بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T20:42:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc046a04175c1b22f787920bf5ec28c24d0bb7d62eda4d9517da8f5dbac4c50
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Plugin‌های Gateway، بسته‌های hook، و bundle‌های سازگار.

<CardGroup cols={2}>
  <Card title="سامانه Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی، و عیب‌یابی Plugin‌ها.
  </Card>
  <Card title="مدیریت Plugin‌ها" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای install، list، update، uninstall، و انتشار.
  </Card>
  <Card title="bundle‌های Plugin" href="/fa/plugins/bundles">
    مدل سازگاری bundle.
  </Card>
  <Card title="manifest Plugin" href="/fa/plugins/manifest">
    فیلدهای manifest و schema پیکربندی.
  </Card>
  <Card title="امنیت" href="/fa/gateway/security">
    سخت‌سازی امنیتی برای نصب Plugin‌ها.
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

برای بررسی نصب، inspect، حذف، یا تازه‌سازی registry که کند است، دستور را با
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی فازها را در stderr
می‌نویسد و خروجی JSON را قابل parse نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
Plugin‌های همراه با OpenClaw همراه محصول عرضه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای نمونه provider‌های مدل همراه، provider‌های گفتار همراه، و Plugin مرورگر همراه)؛ برخی دیگر به `plugins enable` نیاز دارند.

Plugin‌های بومی OpenClaw باید `openclaw.plugin.json` را با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. bundle‌های سازگار در عوض از manifest‌های bundle خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی verbose list/info همچنین زیرنوع bundle (`codex`، `claude`، یا `cursor`) به‌علاوه قابلیت‌های bundle شناسایی‌شده را نشان می‌دهد.
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
نام‌های package بدون پیشوند در دوره گذار راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Plugin‌ها را مانند اجرای کد در نظر بگیرید. نسخه‌های pin‌شده را ترجیح دهید.
</Warning>

`plugins search` از ClawHub درباره package‌های Plugin قابل نصب پرس‌وجو می‌کند و نام‌های package آماده نصب را چاپ می‌کند. این دستور package‌های code-plugin و bundle-plugin را جست‌وجو می‌کند، نه Skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Plugin‌ها است. npm همچنان یک fallback پشتیبانی‌شده و مسیر نصب مستقیم باقی می‌ماند. در جریان مهاجرت به ClawHub، OpenClaw هنوز برخی package‌های Plugin متعلق به OpenClaw با نام `@openclaw/*` را روی npm عرضه می‌کند؛ نسخه‌های آن package‌ها ممکن است بین قطارهای انتشار Plugin از منبع همراه عقب‌تر باشند. اگر npm یک package Plugin متعلق به OpenClaw را deprecated گزارش کند، آن نسخه منتشرشده یک artifact خارجی قدیمی است؛ تا زمانی که package جدیدتر npm منتشر شود، از Plugin همراه OpenClaw فعلی یا یک checkout محلی استفاده کنید.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و بازیابی پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` تغییرات را در همان فایل include‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. include‌های root، آرایه‌های include، و include‌هایی با overrideهای sibling به‌جای flatten شدن با حالت fail closed متوقف می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولا با حالت fail closed متوقف می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway، پیکربندی نامعتبر برای یک Plugin به همان Plugin محدود می‌شود تا کانال‌ها و Plugin‌های دیگر بتوانند به اجرا ادامه دهند؛ `openclaw doctor --fix` می‌تواند ورودی Plugin نامعتبر را قرنطینه کند. تنها استثنای مستند هنگام نصب، یک مسیر باریک بازیابی Plugin همراه برای Plugin‌هایی است که صراحتا `openclaw.install.allowInvalidConfigRecovery` را فعال می‌کنند.

  </Accordion>
  <Accordion title="--force و نصب دوباره در برابر update">
    `--force` هدف نصب موجود را دوباره استفاده می‌کند و یک Plugin یا بسته hook از پیش نصب‌شده را در جای خودش overwrite می‌کند. وقتی عمدا همان id را از یک مسیر محلی، archive، package در ClawHub، یا artifact در npm جدید دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل ردیابی می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id مربوط به Pluginی اجرا کنید که از قبل نصب شده است، OpenClaw متوقف می‌شود و برای ارتقای عادی شما را به `plugins update <id-or-npm-spec>`، یا وقتی واقعا می‌خواهید نصب فعلی را از منبعی متفاوت overwrite کنید به `plugins install <package> --force` راهنمایی می‌کند.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی یک منبع pin‌شده می‌خواهید، از یک git ref صریح مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای npm spec، metadata منبع marketplace را نگه می‌دارند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` گزینه‌ای break-glass برای false positiveها در اسکنر کد خطرناک داخلی است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی findingهای `critical` گزارش می‌کند ادامه پیدا کند، اما blockهای سیاست hook مربوط به `before_install` در Plugin را bypass نمی‌کند و failureهای scan را bypass نمی‌کند.

    این flag در CLI برای جریان‌های install/update Plugin اعمال می‌شود. نصب dependencyهای Skill با پشتیبانی Gateway از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کند، در حالی که `openclaw skills install` همچنان یک جریان جداگانه download/install Skill از ClawHub است.

    اگر Pluginی که در ClawHub منتشر کرده‌اید با scan رجیستری block شده است، از گام‌های ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های hook و specهای npm">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` expose می‌کنند. برای دیدپذیری فیلترشده hook و فعال‌سازی هر hook، از `openclaw hooks` استفاده کنید، نه نصب package.

    specهای npm **فقط رجیستری** هستند (نام package + **نسخه دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و rangeهای semver رد می‌شوند. نصب dependencyها برای ایمنی به‌صورت project-local با `--ignore-scripts` اجرا می‌شود، حتی وقتی shell شما تنظیمات نصب npm سراسری دارد.

    وقتی می‌خواهید resolution از npm را صریح کنید، از `npm:<package>` استفاده کنید. در دوره گذار راه‌اندازی، specهای package بدون پیشوند نیز مستقیما از npm نصب می‌شوند.

    specهای بدون پیشوند و `@latest` روی مسیر stable می‌مانند. اگر npm هرکدام از این‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک tag prerelease مانند `@beta`/`@rc` یا یک نسخه prerelease دقیق مانند `@1.2.3-beta.4` صراحتا opt in کنید.

    اگر یک spec نصب بدون پیشوند با id رسمی Plugin مطابقت داشته باشد (برای نمونه `diffs`)، OpenClaw ورودی catalog را مستقیما نصب می‌کند. برای نصب یک package npm با همان نام، از یک spec scoped صریح استفاده کنید (برای نمونه `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    برای نصب مستقیم از یک مخزن git از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل URLهای clone مانند `git:github.com/owner/repo`، `git:owner/repo`، `https://` کامل، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` اضافه کنید.

    نصب‌های Git در یک دایرکتوری موقت clone می‌شوند، در صورت وجود ref درخواست‌شده آن را checkout می‌کنند، سپس از installer معمول دایرکتوری Plugin استفاده می‌کنند. یعنی اعتبارسنجی manifest، اسکن کد خطرناک، کار install مدیر package، و رکوردهای install مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌علاوه commit resolve‌شده هستند تا `openclaw plugins update` بتواند بعدا منبع را دوباره resolve کند.

    پس از نصب از git، از `openclaw plugins inspect <id> --runtime --json` استفاده کنید تا ثبت‌های runtime مانند methodهای gateway و دستورهای CLI را verify کنید. اگر Plugin یک root CLI با `api.registerCli` ثبت کرده است، آن دستور را مستقیما از طریق root CLI OpenClaw اجرا کنید، برای نمونه `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiveها">
    archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. archiveهای Plugin بومی OpenClaw باید یک `openclaw.plugin.json` معتبر در root استخراج‌شده Plugin داشته باشند؛ archiveهایی که فقط `package.json` دارند پیش از اینکه OpenClaw رکوردهای install را بنویسد رد می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

specهای Plugin امن برای npm و بدون پیشوند در دوره گذار راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح کردن resolution فقط از npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، سازگاری API Plugin اعلام‌شده / حداقل Gateway را بررسی می‌کند. وقتی نسخه انتخاب‌شده ClawHub یک artifact از نوع ClawPack منتشر می‌کند، OpenClaw فایل `.tgz` مربوط به npm-pack نسخه‌دار را download می‌کند، header مربوط به digest در ClawHub و digest artifact را verify می‌کند، سپس آن را از مسیر معمول archive نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون metadata مربوط به ClawPack همچنان از مسیر قدیمی verification archive package نصب می‌شوند. نصب‌های ثبت‌شده metadata منبع ClawHub، نوع artifact، integrity مربوط به npm، shasum مربوط به npm، نام tarball، و واقعیت‌های digest مربوط به ClawPack را برای updateهای بعدی نگه می‌دارند.
نصب‌های ClawHub بدون نسخه یک spec ثبت‌شده بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند releaseهای جدیدتر ClawHub را دنبال کند؛ selectorهای نسخه یا tag صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان selector pin می‌مانند.

#### shorthand برای Marketplace

وقتی نام marketplace در cache رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از shorthand `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع marketplace را صریح pass کنید، از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="منابع marketplace">
    - نام known-marketplace مربوط به Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشه marketplace محلی یا مسیر `marketplace.json`
    - خلاصه‌نویسی مخزن GitHub مانند `owner/repo`
    - نشانی مخزن GitHub مانند `https://github.com/owner/repo`
    - یک نشانی git

  </Tab>
  <Tab title="قواعد marketplace راه‌دور">
    برای marketplaceهای راه‌دور که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن marketplace شبیه‌سازی‌شده باقی بمانند. OpenClaw منابع مسیر نسبی را از آن مخزن می‌پذیرد و HTTP(S)، مسیرهای مطلق، git، GitHub و دیگر منابع غیرمسیری Plugin را از مانیفست‌های راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw این موارد را خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشه معمول Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. امروز، مهارت‌های بسته، command-skills مربوط به Claude، پیش‌فرض‌های `settings.json` در Claude، پیش‌فرض‌های `.lsp.json` در Claude / `lspServers` اعلام‌شده در مانیفست، command-skills مربوط به Cursor، و دایرکتوری‌های hook سازگار Codex پشتیبانی می‌شوند؛ سایر قابلیت‌های شناسایی‌شده بسته در diagnostics/info نمایش داده می‌شوند اما هنوز به اجرای زمان اجرا متصل نشده‌اند.
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
  از نمای جدول به خط‌های جزئیات برای هر Plugin با فراداده منبع/خاستگاه/نسخه/فعال‌سازی تغییر بده.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل خواندن برای ماشین به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری Plugin محلی پایدارشده را می‌خواند، و اگر رجیستری وجود نداشته باشد یا نامعتبر باشد، از fallback مشتق‌شده فقط از مانیفست استفاده می‌کند. این برای بررسی نصب بودن، فعال بودن، و قابل مشاهده بودن یک Plugin برای برنامه‌ریزی راه‌اندازی سرد مفید است، اما probe زنده زمان اجرای یک فرایند Gateway از پیش در حال اجرا نیست. پس از تغییر کد Plugin، وضعیت فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار برای اجرای کد `register(api)` جدید یا hookها، Gateway ارائه‌دهنده کانال را دوباره راه‌اندازی کنید. برای استقرارهای راه‌دور/کانتینری، بررسی کنید که فرزند واقعی `openclaw gateway run` را دوباره راه‌اندازی می‌کنید، نه فقط یک فرایند wrapper.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `package.json`
`dependencies` و `optionalDependencies` است. OpenClaw بررسی می‌کند آیا نام آن بسته‌ها در مسیر معمول lookup مربوط به Node `node_modules` برای Plugin وجود دارند؛
کد زمان اجرای Plugin را import نمی‌کند، مدیر بسته اجرا نمی‌کند، و وابستگی‌های
گم‌شده را ترمیم نمی‌کند.
</Note>

`plugins search` یک lookup کاتالوگ ClawHub راه‌دور است. وضعیت محلی را بررسی
نمی‌کند، config را تغییر نمی‌دهد، بسته‌ها را نصب نمی‌کند، یا کد زمان اجرای Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو شامل نام بسته ClawHub، خانواده، کانال، نسخه، خلاصه، و
یک راهنمای نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Plugin بسته‌بندی‌شده داخل یک تصویر Docker بسته‌بندی‌شده، دایرکتوری منبع Plugin را روی مسیر منبع بسته‌بندی‌شده متناظر bind-mount کنید، مانند
`/app/extensions/synology-chat`. OpenClaw آن overlay منبع mountشده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع که فقط کپی شده باشد بی‌اثر می‌ماند، بنابراین نصب‌های بسته‌بندی‌شده معمول همچنان از dist کامپایل‌شده استفاده می‌کنند.

برای اشکال‌زدایی hook زمان اجرا:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics را از یک گذر بازرسی module-loaded نشان می‌دهد. بازرسی زمان اجرا هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت وابستگی legacy یا نصب Pluginهای قابل دانلود پیکربندی‌شده گم‌شده از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل دسترسی، راهنماهای سرویس/فرایند، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای گفت‌وگوی غیربسته‌بندی‌شده (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای پرهیز از کپی کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های linked به‌جای کپی کردن روی هدف نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کنند.

برای نصب‌های npm از `--pin` استفاده کنید تا spec دقیق resolveشده (`name@version`) در شاخص Plugin مدیریت‌شده ذخیره شود، در حالی که رفتار پیش‌فرض unpinned باقی بماند.
</Note>

### شاخص Plugin

فراداده نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. map سطح بالای `installRecords` منبع پایدار فراداده نصب است، از جمله recordها برای مانیفست‌های خراب یا گم‌شده Plugin. آرایه `plugins` cache رجیستری سرد مشتق‌شده از مانیفست است. این فایل شامل هشدار ویرایش‌نکردن است و توسط `openclaw plugins update`، uninstall، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای legacy ارسال‌شده `plugins.installs` را در config می‌بیند، آن‌ها را به شاخص Plugin منتقل می‌کند و کلید config را حذف می‌کند؛ اگر هرکدام از writeها شکست بخورد، رکوردهای config نگه داشته می‌شوند تا فراداده نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، شاخص پایدارشده Plugin، ورودی‌های فهرست allow/deny مربوط به Plugin، و ورودی‌های linked `plugins.load.paths` در صورت کاربرد حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شده رهگیری‌شده را هنگامی که داخل ریشه plugin extensions مربوط به OpenClaw باشد حذف می‌کند. برای Pluginهای حافظه فعال، slot حافظه به `memory-core` بازنشانی می‌شود.

<Note>
`--keep-config` به‌عنوان alias منسوخ برای `--keep-files` پشتیبانی می‌شود.
</Note>

### به‌روزرسانی

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

به‌روزرسانی‌ها روی نصب‌های رهگیری‌شده Plugin در شاخص مدیریت‌شده Plugin و نصب‌های hook-pack رهگیری‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="حل‌وفصل id Plugin در برابر spec مربوط به npm">
    وقتی یک id مربوط به Plugin را پاس می‌دهید، OpenClaw از spec نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. این یعنی dist-tagهای ذخیره‌شده قبلی مانند `@beta` و نسخه‌های دقیق pinشده در اجرای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، می‌توانید یک spec صریح بسته npm با dist-tag یا نسخه دقیق هم پاس بدهید. OpenClaw آن نام بسته را دوباره به رکورد Plugin رهگیری‌شده resolve می‌کند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های id-based آینده ثبت می‌کند.

    پاس دادن نام بسته npm بدون نسخه یا tag نیز دوباره به رکورد Plugin رهگیری‌شده resolve می‌شود. زمانی از این استفاده کنید که یک Plugin به نسخه دقیق pin شده بود و می‌خواهید آن را دوباره به خط انتشار پیش‌فرض رجیستری برگردانید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال بتا">
    `openclaw plugins update` spec رهگیری‌شده Plugin را دوباره استفاده می‌کند مگر اینکه spec جدیدی پاس بدهید. `openclaw update` افزون بر این، کانال به‌روزرسانی فعال OpenClaw را می‌شناسد: در کانال بتا، رکوردهای Plugin مربوط به npm و ClawHub روی خط پیش‌فرض ابتدا `@beta` را امتحان می‌کنند، سپس اگر انتشار بتای Plugin وجود نداشته باشد به spec پیش‌فرض/latest ثبت‌شده برمی‌گردند. نسخه‌های دقیق و tagهای صریح روی همان selector ثابت می‌مانند.

  </Accordion>
  <Accordion title="بررسی نسخه و drift یکپارچگی">
    پیش از یک به‌روزرسانی زنده npm، OpenClaw نسخه بسته نصب‌شده را در برابر فراداده رجیستری npm بررسی می‌کند. اگر نسخه نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف resolveشده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact دریافت‌شده تغییر کند، OpenClaw این را drift مربوط به artifact در npm تلقی می‌کند. فرمان تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی fail closed می‌شوند مگر اینکه فراخواننده یک سیاست ادامه صریح فراهم کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install در update">
    `--dangerously-force-unsafe-install` همچنین روی `plugins update` به‌عنوان override اضطراری برای مثبت‌های کاذب اسکن کد خطرناک داخلی هنگام به‌روزرسانی Pluginها در دسترس است. این همچنان blockهای سیاست `before_install` مربوط به Plugin یا blocking ناشی از شکست اسکن را دور نمی‌زند، و فقط برای به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect هویت، وضعیت بارگذاری، منبع، قابلیت‌های مانیفست، flagهای سیاست، diagnostics، فراداده نصب، قابلیت‌های بسته، و هر پشتیبانی شناسایی‌شده از MCP یا سرور LSP را بدون import کردن پیش‌فرض زمان اجرای Plugin نشان می‌دهد. `--runtime` را اضافه کنید تا ماژول Plugin بارگذاری شود و hookها، ابزارها، فرمان‌ها، سرویس‌ها، متدهای Gateway، و routeهای HTTP ثبت‌شده را شامل شود. بازرسی زمان اجرا وابستگی‌های گم‌شده Plugin را مستقیم گزارش می‌کند؛ نصب‌ها و ترمیم‌ها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI متعلق به Plugin به‌عنوان گروه‌های فرمان ریشه `openclaw` نصب می‌شوند. پس از اینکه `inspect --runtime` فرمانی را زیر `cliCommands` نشان داد، آن را به‌شکل `openclaw <command> ...` اجرا کنید؛ برای مثال Pluginای که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin بر اساس چیزی که واقعاً در زمان اجرا ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (مثلاً Plugin فقط-provider)
- **hybrid-capability** — چند نوع قابلیت (مثلاً متن + گفتار + تصویر)
- **hook-only** — فقط hookها، بدون قابلیت یا سطح
- **non-capability** — ابزارها/فرمان‌ها/سرویس‌ها اما بدون قابلیت

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
flag `--json` گزارشی قابل خواندن برای ماشین مناسب اسکریپت‌نویسی و audit خروجی می‌دهد. `inspect --all` یک جدول fleet-wide با ستون‌های شکل، گونه‌های قابلیت، اعلان‌های سازگاری، قابلیت‌های بسته، و خلاصه hook رندر می‌کند. `info` یک alias برای `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، diagnostics مربوط به مانیفست/کشف، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

برای شکست‌های شکل ماژول مانند exportهای گم‌شده `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا یک خلاصه فشرده از شکل export در خروجی diagnostic گنجانده شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری Plugin محلی مدل خواندن سرد پایدارشده OpenClaw برای هویت Plugin نصب‌شده، فعال‌سازی، فراداده منبع، و مالکیت contribution است. راه‌اندازی معمول، lookup مالک provider، طبقه‌بندی setup کانال، و موجودی Plugin می‌توانند آن را بدون import کردن ماژول‌های زمان اجرای Plugin بخوانند.

از `plugins registry` برای بررسی اینکه آیا رجیستری پایدارشده وجود دارد، جاری است، یا stale شده استفاده کنید. از `--refresh` برای بازسازی آن از شاخص پایدارشده Plugin، سیاست config، و فراداده مانیفست/بسته استفاده کنید. این یک مسیر ترمیم است، نه مسیر فعال‌سازی زمان اجرا.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک سوییچ سازگاری منسوخ‌شده برای شرایط اضطراری در زمان شکست خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ مسیر جایگزین env فقط برای بازیابی اضطراری راه‌اندازی هنگام عرضهٔ مهاجرت است.
</Warning>

### بازارچه

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست بازارچه یک مسیر محلی بازارچه، مسیر `marketplace.json`، کوتاه‌نویسی GitHub مانند `owner/repo`، نشانی مخزن GitHub، یا نشانی git را می‌پذیرد. `--json` برچسب منبع حل‌شده را به‌همراه مانیفست بازارچهٔ پردازش‌شده و ورودی‌های Plugin چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

---
read_when:
    - می‌خواهید Plugin‌های Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-07T01:51:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های hook و بسته‌های سازگار.

<CardGroup cols={2}>
  <Card title="سیستم Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی و عیب‌یابی Pluginها.
  </Card>
  <Card title="مدیریت Pluginها" href="/fa/plugins/manage-plugins">
    مثال‌های سریع برای نصب، فهرست‌کردن، به‌روزرسانی، حذف نصب و انتشار.
  </Card>
  <Card title="بسته‌های Plugin" href="/fa/plugins/bundles">
    مدل سازگاری بسته.
  </Card>
  <Card title="Manifest Plugin" href="/fa/plugins/manifest">
    فیلدهای manifest و schema پیکربندی.
  </Card>
  <Card title="امنیت" href="/fa/gateway/security">
    سخت‌سازی امنیتی برای نصب Plugin.
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

برای بررسی نصب، inspect، حذف نصب، یا نوسازی registry که کند انجام می‌شود، دستور را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی فازها را در stderr می‌نویسد و خروجی JSON را قابل parse نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییر‌دهنده‌های چرخه عمر Plugin غیرفعال هستند. برای این نصب، به‌جای `plugins install`، `plugins update`، `plugins uninstall`، `plugins enable` یا `plugins disable` از منبع Nix استفاده کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) agent-first استفاده کنید.
</Note>

<Note>
Pluginهای همراه با OpenClaw همراه محصول عرضه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال providerهای مدل همراه، providerهای گفتار همراه، و Plugin مرورگر همراه)؛ برخی دیگر به `plugins enable` نیاز دارند.

Pluginهای native OpenClaw باید `openclaw.plugin.json` را همراه یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) ارائه کنند. بسته‌های سازگار در عوض از manifestهای بسته خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی verbose list/info همچنین زیرنوع بسته (`codex`، `claude` یا `cursor`) به‌همراه قابلیت‌های شناسایی‌شده بسته را نشان می‌دهد.
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
نام‌های بسته بدون پیشوند، در دوره گذار راه‌اندازی، به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Pluginها را مانند اجرای کد در نظر بگیرید. نسخه‌های pin‌شده را ترجیح دهید.
</Warning>

`plugins search` از ClawHub برای یافتن بسته‌های Plugin قابل نصب query می‌گیرد و نام بسته‌های آماده نصب را چاپ می‌کند. این دستور بسته‌های code-plugin و bundle-plugin را جست‌وجو می‌کند، نه Skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. Npm همچنان به‌عنوان مسیر fallback و نصب مستقیم پشتیبانی می‌شود. بسته‌های Plugin متعلق به OpenClaw با نام `@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا [فهرست موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های stable از `latest` استفاده می‌کنند. نصب‌ها و به‌روزرسانی‌های کانال beta وقتی آن tag در دسترس باشد، dist-tag `beta` در npm را ترجیح می‌دهند و سپس به `latest` برمی‌گردند.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و تعمیر پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` تغییرات را در همان فایل include‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای root، آرایه‌های include، و includeهایی با overrideهای sibling، به‌جای flatten شدن، fail closed می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولا fail closed می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام startup و hot reload در Gateway، پیکربندی نامعتبر Plugin مثل هر پیکربندی نامعتبر دیگر fail closed می‌شود؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر Plugin را quarantine کند. تنها استثنای مستند در زمان نصب، یک مسیر بازیابی محدود برای Plugin همراه است که صراحتا به `openclaw.install.allowInvalidConfigRecovery` opt in می‌کند.

  </Accordion>
  <Accordion title="--force و نصب مجدد در برابر به‌روزرسانی">
    `--force` هدف نصب موجود را دوباره استفاده می‌کند و یک Plugin یا بسته hook نصب‌شده را در همان محل overwrite می‌کند. وقتی عمدا همان id را از یک مسیر محلی جدید، archive، بسته ClawHub یا artifact npm دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل ردیابی شده است، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id یک Plugin که از قبل نصب شده است اجرا کنید، OpenClaw متوقف می‌شود و شما را برای ارتقای عادی به `plugins update <id-or-npm-spec>`، یا وقتی واقعا می‌خواهید نصب فعلی را از منبعی متفاوت overwrite کنید به `plugins install <package> --force` ارجاع می‌دهد.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pin‌شده می‌خواهید، از ref صریح git مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec npm، metadata منبع marketplace را پایدار می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` گزینه‌ای break-glass برای false positiveها در scanner داخلی dangerous-code است. این گزینه اجازه می‌دهد نصب حتی وقتی scanner داخلی یافته‌های `critical` گزارش می‌کند ادامه پیدا کند، اما blockهای policy مربوط به hook `before_install` در Plugin را bypass نمی‌کند و failureهای scan را bypass نمی‌کند.

    این flag در CLI برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skill که پشتوانه Gateway دارند از override متناظر درخواست `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان یک جریان جداگانه download/install Skill از ClawHub است.

    اگر Pluginی که در ClawHub منتشر کرده‌اید توسط scan registry مسدود شده است، از گام‌های ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های hook و specهای npm">
    `plugins install` سطح نصب برای بسته‌های hook نیز هست که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای visibility فیلترشده hook و فعال‌سازی هر hook از `openclaw hooks` استفاده کنید، نه برای نصب package.

    specهای npm **فقط registry** هستند (نام package + **نسخه دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های dependency برای ایمنی به‌صورت project-local با `--ignore-scripts` اجرا می‌شوند، حتی وقتی shell شما تنظیمات global نصب npm دارد. ریشه‌های npm مدیریت‌شده Plugin، `overrides` در سطح package متعلق به OpenClaw را به ارث می‌برند، بنابراین pinهای امنیتی host برای dependencyهای hoist‌شده Plugin نیز اعمال می‌شوند.

    وقتی می‌خواهید resolution npm را صریح کنید، از `npm:<package>` استفاده کنید. specهای package بدون پیشوند نیز در دوره گذار راه‌اندازی مستقیما از npm نصب می‌شوند.

    specهای بدون پیشوند و `@latest` روی track stable می‌مانند. نسخه‌های correction قدیمی OpenClaw مانند `2026.5.3-1` هنوز برای این check به‌عنوان releaseهای stable تلقی می‌شوند تا packageهای قدیمی‌تر با ایمنی به‌روزرسانی شوند. برنامه این است که کار support-line ماهانه جدید به‌جای suffixهای correction با hyphen، از شماره‌های patch معمول SemVer استفاده کند. اگر npm یک spec پیش‌فرض را به prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد صراحتا با یک tag prerelease مانند `@beta`/`@rc` یا یک نسخه prerelease دقیق مانند `@1.2.3-beta.4` opt in کنید.

    اگر یک spec نصب بدون پیشوند با id یک Plugin رسمی مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی catalog را مستقیما نصب می‌کند. برای نصب یک package npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="repositoryهای Git">
    برای نصب مستقیم از یک repository git از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل URLهای clone به‌صورت `git:github.com/owner/repo`، `git:owner/repo`، `https://` کامل، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای checkout کردن branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` را اضافه کنید.

    نصب‌های Git در یک directory موقت clone می‌شوند، در صورت وجود ref درخواست‌شده را check out می‌کنند، سپس از installer عادی directory Plugin استفاده می‌کنند. یعنی validation manifest، scan کد خطرناک، کار نصب package-manager و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit resolve‌شده هستند تا `openclaw plugins update` بعدا بتواند منبع را دوباره resolve کند.

    پس از نصب از git، برای verify کردن registrationهای runtime مانند methodهای Gateway و commandهای CLI از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. اگر Plugin با `api.registerCli` یک root برای CLI ثبت کرده است، آن command را مستقیما از طریق root CLI در OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiveها">
    archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. archiveهای Plugin native OpenClaw باید در root استخراج‌شده Plugin یک `openclaw.plugin.json` معتبر داشته باشند؛ archiveهایی که فقط `package.json` دارند، پیش از آنکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball از npm-pack است و می‌خواهید همان مسیر نصب npm-root مدیریت‌شده را که توسط نصب‌های registry استفاده می‌شود تست کنید، از `npm-pack:<path.tgz>` استفاده کنید؛ شامل verification برای `package-lock.json`، scan dependencyهای hoist‌شده، و رکوردهای نصب npm. مسیرهای archive ساده همچنان به‌عنوان archiveهای محلی زیر root مربوط به plugin extensions نصب می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

specهای Plugin بدون پیشوند و سازگار با npm در دوره گذار راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح کردن resolution فقط npm از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، سازگاری API اعلام‌شدهٔ Plugin / حداقل Gateway را بررسی می‌کند. وقتی نسخهٔ انتخاب‌شدهٔ ClawHub یک آرتیفکت ClawPack منتشر کند، OpenClaw بستهٔ versioned npm-pack با پسوند `.tgz` را دانلود می‌کند، سرآیند digest مربوط به ClawHub و digest آرتیفکت را بررسی می‌کند، سپس آن را از مسیر معمول آرشیو نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub که metadata مربوط به ClawPack ندارند همچنان از مسیر legacy راستی‌آزمایی آرشیو package نصب می‌شوند. نصب‌های ثبت‌شده metadata منبع ClawHub، نوع آرتیفکت، npm integrity، npm shasum، نام tarball، و داده‌های digest مربوط به ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های ClawHub بدون نسخه یک spec ثبت‌شدهٔ بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند نسخه‌های جدیدتر ClawHub را دنبال کند؛ selectorهای نسخه یا tag صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان selector پین می‌مانند.

#### میان‌بر Marketplace

وقتی نام marketplace در cache رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از میان‌بر `plugin@marketplace` استفاده کنید:

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
    - یک نام marketplace شناخته‌شدهٔ Claude از `~/.claude/plugins/known_marketplaces.json`
    - یک ریشهٔ marketplace محلی یا مسیر `marketplace.json`
    - یک میان‌بر repo در GitHub مانند `owner/repo`
    - یک URL مربوط به repo در GitHub مانند `https://github.com/owner/repo`
    - یک URL مربوط به git

  </Tab>
  <Tab title="Remote marketplace rules">
    برای marketplaceهای remote که از GitHub یا git بارگذاری می‌شوند، entryهای Plugin باید داخل repo کلون‌شدهٔ marketplace باقی بمانند. OpenClaw منابع مسیر نسبی از همان repo را می‌پذیرد و منابع Plugin از نوع HTTP(S)، مسیر مطلق، git، GitHub، و دیگر منابع غیرمسیر را از manifestهای remote رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw این موارد را به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای native مربوط به OpenClaw (`openclaw.plugin.json`)
- bundleهای سازگار با Codex (`.codex-plugin/plugin.json`)
- bundleهای سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان component پیش‌فرض Claude)
- bundleهای سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
bundleهای سازگار در ریشهٔ معمول Plugin نصب می‌شوند و در همان جریان list/info/enable/disable مشارکت می‌کنند. در حال حاضر، bundle skills، command-skills مربوط به Claude، پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های `.lsp.json` مربوط به Claude / `lspServers` اعلام‌شده در manifest، command-skills مربوط به Cursor، و directoryهای hook سازگار با Codex پشتیبانی می‌شوند؛ قابلیت‌های bundle دیگری که تشخیص داده شوند در diagnostics/info نمایش داده می‌شوند، اما هنوز به اجرای runtime متصل نشده‌اند.
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
  از نمای table به خط‌های جزئیات جداگانه برای هر Plugin همراه با metadata منبع/خاستگاه/نسخه/فعال‌سازی تغییر می‌کند.
</ParamField>
<ParamField path="--json" type="boolean">
  inventory قابل‌خواندن برای ماشین به‌همراه diagnostics رجیستری و وضعیت نصب dependencyهای package.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری Plugin محلی persisted را می‌خواند و اگر رجیستری وجود نداشته باشد یا نامعتبر باشد، از fallback مشتق‌شدهٔ فقط manifest استفاده می‌کند. این فرمان برای بررسی اینکه آیا یک Plugin نصب شده، فعال است، و برای برنامه‌ریزی cold startup قابل مشاهده است مفید است، اما probe زندهٔ runtime برای یک فرایند Gateway از پیش در حال اجرا نیست. پس از تغییر code مربوط به Plugin، enablement، policy مربوط به hook، یا `plugins.load.paths`، پیش از انتظار اجرای code یا hookهای جدید `register(api)`، Gateway ارائه‌دهندهٔ channel را restart کنید. برای deploymentهای remote/container، بررسی کنید که child واقعی `openclaw gateway run` را restart می‌کنید، نه فقط یک فرایند wrapper.

`plugins list --json` برای هر Plugin مقدار `dependencyStatus` را از `package.json`
`dependencies` و `optionalDependencies` شامل می‌شود. OpenClaw بررسی می‌کند که آیا آن نام‌های package در مسیر lookup معمول Node `node_modules` مربوط به Plugin وجود دارند یا نه؛
code runtime مربوط به Plugin را import نمی‌کند، package manager اجرا نمی‌کند، و dependencyهای مفقود را repair نمی‌کند.
</Note>

`plugins search` یک lookup catalog remote در ClawHub است. این فرمان state محلی را بررسی نمی‌کند،
config را mutate نمی‌کند، package نصب نمی‌کند، و code runtime مربوط به Plugin را load نمی‌کند. نتیجه‌های search شامل نام package در ClawHub، family، channel، version، summary، و
یک hint نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Pluginهای bundled داخل یک image بسته‌بندی‌شدهٔ Docker، directory منبع Plugin را
روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mount کنید، مانند
`/app/extensions/synology-chat`. OpenClaw آن overlay منبع mount‌شده را
پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک directory منبع که صرفا copy شده باشد
غیرفعال می‌ماند تا نصب‌های معمول بسته‌بندی‌شده همچنان از dist کامپایل‌شده استفاده کنند.

برای debug کردن hookهای runtime:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics از یک گذر inspection با module-loaded را نشان می‌دهد. inspection مربوط به runtime هرگز dependency نصب نمی‌کند؛ برای پاک‌سازی state مربوط به dependencyهای legacy یا بازیابی Pluginهای downloadable مفقودی که config به آن‌ها reference داده است، از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل‌دسترسی، hintهای service/process، مسیر config، و سلامت RPC را تایید می‌کند.
- hookهای conversation غیرباندل‌شده (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از copy کردن یک directory محلی، از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های linked به‌جای copy کردن روی target نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کنند.

برای نصب‌های npm، از `--pin` استفاده کنید تا spec دقیق resolve‌شده (`name@version`) در index مربوط به Plugin مدیریت‌شده ذخیره شود، در حالی که رفتار پیش‌فرض unpinned باقی می‌ماند.
</Note>

### index مربوط به Plugin

metadata نصب Plugin یک state مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر directory فعال state مربوط به OpenClaw می‌نویسند. map سطح بالای `installRecords` منبع durable برای metadata نصب است، از جمله recordهای مربوط به manifestهای خراب یا مفقود Plugin. آرایهٔ `plugins` همان cache رجیستری cold مشتق‌شده از manifest است. این فایل یک هشدار do-not-edit دارد و توسط `openclaw plugins update`، uninstall، diagnostics، و رجیستری cold مربوط به Plugin استفاده می‌شود.

وقتی OpenClaw recordهای legacy ارسال‌شدهٔ `plugins.installs` را در config ببیند، خواندن‌های runtime با آن‌ها به‌عنوان ورودی compatibility برخورد می‌کنند بدون اینکه `openclaw.json` را بازنویسی کنند. نوشتن‌های صریح Plugin و `openclaw doctor --fix` آن recordها را به index مربوط به Plugin منتقل می‌کنند و وقتی نوشتن config مجاز باشد، key مربوط به config را حذف می‌کنند؛ اگر هرکدام از این writeها fail شود، recordهای config نگه داشته می‌شوند تا metadata نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` recordهای Plugin را از `plugins.entries`، index persisted مربوط به Plugin، entryهای allow/deny list مربوط به Plugin، و در صورت کاربرد، entryهای linked مربوط به `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، uninstall همچنین directory نصب مدیریت‌شدهٔ track‌شده را وقتی داخل ریشهٔ extensions مربوط به Pluginهای OpenClaw باشد حذف می‌کند. برای Pluginهای active memory، slot حافظه به `memory-core` reset می‌شود.

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

به‌روزرسانی‌ها روی نصب‌های track‌شدهٔ Plugin در index مدیریت‌شدهٔ Plugin و نصب‌های hook-pack track‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    وقتی یک id مربوط به Plugin را می‌دهید، OpenClaw از spec نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. یعنی dist-tagهای قبلا ذخیره‌شده مانند `@beta` و نسخه‌های دقیق pin‌شده در اجرای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، می‌توانید یک spec صریح package npm همراه با dist-tag یا نسخهٔ دقیق نیز بدهید. OpenClaw آن نام package را به record مربوط به Plugin track‌شده resolve می‌کند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های آینده بر اساس id ثبت می‌کند.

    دادن نام package npm بدون نسخه یا tag نیز به record مربوط به Plugin track‌شده resolve می‌شود. وقتی یک Plugin به یک نسخهٔ دقیق pin شده و می‌خواهید آن را به release line پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` از spec مربوط به Plugin track‌شده دوباره استفاده می‌کند مگر اینکه spec جدیدی بدهید. `openclaw update` علاوه بر این، channel فعال به‌روزرسانی OpenClaw را می‌شناسد: در channel بتا، recordهای Plugin مربوط به npm و ClawHub روی خط پیش‌فرض ابتدا `@beta` را امتحان می‌کنند، سپس اگر release بتا برای Plugin وجود نداشته باشد، به spec پیش‌فرض/latest ثبت‌شده fallback می‌کنند. نسخه‌های دقیق و tagهای صریح به همان selector پین می‌مانند.

    OpenClaw هنوز channelهای Plugin مربوط به پشتیبانی LTS یا ماهانه را expose نمی‌کند. کار برنامه‌ریزی‌شده برای support-line به packageهای Plugin و tagهای ClawHub نیاز خواهد داشت تا همان support line مربوط به package اصلی را دنبال کنند.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    پیش از یک به‌روزرسانی زندهٔ npm، OpenClaw نسخهٔ package نصب‌شده را با metadata رجیستری npm بررسی می‌کند. اگر نسخهٔ نصب‌شده و identity ثبت‌شدهٔ آرتیفکت از قبل با target resolve‌شده یکی باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` skip می‌شود.

    وقتی hash ذخیره‌شدهٔ integrity وجود داشته باشد و hash آرتیفکت fetched تغییر کند، OpenClaw با آن به‌عنوان drift آرتیفکت npm برخورد می‌کند. فرمان interactive `openclaw plugins update` hashهای expected و actual را چاپ می‌کند و پیش از ادامه confirmation می‌خواهد. helperهای non-interactive مربوط به update به‌صورت fail closed عمل می‌کنند مگر اینکه caller یک continuation policy صریح بدهد.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` روی `plugins update` نیز به‌عنوان break-glass override برای false positiveهای scan کد خطرناک built-in هنگام به‌روزرسانی Plugin در دسترس است. این گزینه همچنان blockهای policy مربوط به `before_install` در Plugin یا blocking ناشی از scan-failure را bypass نمی‌کند، و فقط برای به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect بدون import کردن runtime مربوط به Plugin به‌صورت پیش‌فرض، identity، وضعیت load، source، قابلیت‌های manifest، flagهای policy، diagnostics، metadata نصب، قابلیت‌های bundle، و هرگونه پشتیبانی تشخیص‌داده‌شده از serverهای MCP یا LSP را نشان می‌دهد. برای load کردن module مربوط به Plugin و شامل کردن hookها، toolها، commandها، serviceها، methodهای gateway، و routeهای HTTP ثبت‌شده، `--runtime` را اضافه کنید. Runtime inspection dependencyهای مفقود Plugin را مستقیما گزارش می‌کند؛ نصب‌ها و repairها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

commandهای CLI متعلق به Plugin به‌عنوان command groupهای ریشهٔ `openclaw` نصب می‌شوند. پس از اینکه `inspect --runtime` یک command را زیر `cliCommands` نشان داد، آن را به‌صورت `openclaw <command> ...` اجرا کنید؛ برای مثال Pluginای که `demo-git` را register می‌کند با `openclaw demo-git ping` قابل verify است.

هر Plugin بر اساس آنچه واقعا در runtime ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (مثلاً یک Plugin فقط-ارائه‌دهنده)
- **hybrid-capability** — چند نوع قابلیت (مثلاً متن + گفتار + تصویر)
- **hook-only** — فقط هوک‌ها، بدون قابلیت‌ها یا سطح‌ها
- **non-capability** — ابزارها/فرمان‌ها/سرویس‌ها، اما بدون قابلیت‌ها

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل خواندن توسط ماشین تولید می‌کند که برای اسکریپت‌نویسی و ممیزی مناسب است. `inspect --all` جدولی در سطح کل ناوگان با ستون‌های شکل، انواع قابلیت، اعلان‌های سازگاری، قابلیت‌های باندل، و خلاصه هوک رندر می‌کند. `info` نام مستعار `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، عیب‌یابی‌های مانیفست/کشف، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

اگر یک Plugin پیکربندی‌شده روی دیسک وجود داشته باشد اما توسط بررسی‌های ایمنی مسیرِ بارگذار مسدود شده باشد، اعتبارسنجی پیکربندی ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف پیکربندی `plugins.entries.<id>` یا `plugins.allow`، عیب‌یابی Plugin مسدودشده قبلی، مانند مالکیت مسیر یا مجوزهای قابل نوشتن برای همه را برطرف کنید.

برای خرابی‌های شکل ماژول، مانند نبود خروجی‌های `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا خلاصه‌ای فشرده از شکل خروجی‌ها در خروجی عیب‌یابی گنجانده شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin مدل خواندن سردِ ماندگار OpenClaw برای هویت Plugin نصب‌شده، فعال‌سازی، فراداده منبع، و مالکیت مشارکت‌ها است. راه‌اندازی عادی، جست‌وجوی مالک ارائه‌دهنده، طبقه‌بندی راه‌اندازی کانال، و موجودی Plugin می‌توانند بدون وارد کردن ماژول‌های زمان اجرای Plugin آن را بخوانند.

از `plugins registry` برای بررسی اینکه رجیستری ماندگار وجود دارد، به‌روز است، یا کهنه شده استفاده کنید. از `--refresh` برای بازسازی آن از نمایه ماندگار Plugin، سیاست پیکربندی، و فراداده مانیفست/بسته استفاده کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی زمان اجرا.

`openclaw doctor --fix` همچنین انحراف npm مدیریت‌شده نزدیک به رجیستری را تعمیر می‌کند: اگر یک بسته یتیم یا بازیابی‌شده `@openclaw/*` زیر ریشه npm مدیریت‌شده Plugin یک Plugin باندل‌شده را سایه بیندازد، doctor آن بسته کهنه را حذف می‌کند و رجیستری را بازسازی می‌کند تا راه‌اندازی در برابر مانیفست باندل‌شده اعتبارسنجی شود.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک سوییچ سازگاری منسوخِ اضطراری برای خرابی‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ جایگزین env فقط برای بازیابی اضطراری راه‌اندازی هنگام عرضه مهاجرت است.
</Warning>

### بازارچه

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست بازارچه یک مسیر محلی بازارچه، مسیر `marketplace.json`، کوتاه‌نویسی GitHub مانند `owner/repo`، URL مخزن GitHub، یا URL گیت را می‌پذیرد. `--json` برچسب منبع حل‌شده را همراه با مانیفست بازارچه تجزیه‌شده و ورودی‌های Plugin چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

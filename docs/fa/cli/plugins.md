---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خرابی‌های بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (فهرست، نصب، بازارچه، حذف نصب، فعال‌سازی/غیرفعال‌سازی، عیب‌یابی)
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-04T09:37:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های hook، و bundleهای سازگار.

<CardGroup cols={2}>
  <Card title="سیستم Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی، و عیب‌یابی Pluginها.
  </Card>
  <Card title="مدیریت Pluginها" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست، به‌روزرسانی، حذف نصب، و انتشار.
  </Card>
  <Card title="bundleهای Plugin" href="/fa/plugins/bundles">
    مدل سازگاری bundle.
  </Card>
  <Card title="manifest مربوط به Plugin" href="/fa/plugins/manifest">
    فیلدهای manifest و طرح‌واره پیکربندی.
  </Card>
  <Card title="امنیت" href="/fa/gateway/security">
    سخت‌سازی امنیتی برای نصب Pluginها.
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
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی مرحله‌ها را در
stderr می‌نویسد و خروجی JSON را قابل تجزیه نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
Pluginهای bundle‌شده همراه OpenClaw ارائه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال ارائه‌دهندگان مدل bundle‌شده، ارائه‌دهندگان گفتار bundle‌شده، و Plugin مرورگر bundle‌شده)؛ برخی دیگر به `plugins enable` نیاز دارند.

Pluginهای native OpenClaw باید `openclaw.plugin.json` را همراه با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) ارائه کنند. bundleهای سازگار به‌جای آن از manifestهای bundle خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی verbose فهرست/info همچنین زیرنوع bundle (`codex`، `claude`، یا `cursor`) و قابلیت‌های bundle شناسایی‌شده را نشان می‌دهد.
</Note>

### نصب

```bash
openclaw plugins search "calendar"                   # جست‌وجوی Pluginهای ClawHub
openclaw plugins install <package>                      # npm به‌صورت پیش‌فرض
openclaw plugins install clawhub:<package>              # فقط ClawHub
openclaw plugins install npm:<package>                  # فقط npm
openclaw plugins install git:github.com/<owner>/<repo>  # مخزن git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # بازنویسی نصب موجود
openclaw plugins install <package> --pin                # سنجاق کردن نسخه
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # مسیر محلی
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (صریح)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
در دوره انتقال راه‌اندازی، نام‌های خام package به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Pluginها را مانند اجرای کد در نظر بگیرید. نسخه‌های سنجاق‌شده را ترجیح دهید.
</Warning>

`plugins search` از ClawHub برای packageهای Plugin قابل نصب پرس‌وجو می‌کند و
نام packageهای آماده نصب را چاپ می‌کند. این دستور packageهای code-plugin و bundle-plugin را جست‌وجو می‌کند،
نه Skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. Npm
همچنان به‌عنوان fallback پشتیبانی‌شده و مسیر نصب مستقیم باقی می‌ماند. packageهای Plugin متعلق به OpenClaw با نام
`@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را در
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا
[موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند.
نصب‌ها و به‌روزرسانی‌های کانال beta وقتی tag مربوطه موجود باشد، dist-tag مربوط به npm یعنی `beta` را ترجیح می‌دهند
و سپس به `latest` برمی‌گردند.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و تعمیر پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی شود، `plugins install/update/enable/disable/uninstall` تغییرات را در همان فایل include‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای ریشه، آرایه‌های include، و includeهایی با overrideهای هم‌سطح به‌جای flatten شدن، بسته و ناموفق می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولاً بسته و ناموفق می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و reload داغ، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگری بسته و ناموفق می‌شود؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر Plugin را قرنطینه کند. تنها استثنای مستند در زمان نصب، یک مسیر بازیابی محدود برای Pluginهای bundle‌شده است که صراحتاً `openclaw.install.allowInvalidConfigRecovery` را فعال کرده‌اند.

  </Accordion>
  <Accordion title="--force و نصب دوباره در برابر به‌روزرسانی">
    `--force` هدف نصب موجود را دوباره استفاده می‌کند و یک Plugin یا بسته hook ازقبل‌نصب‌شده را درجا بازنویسی می‌کند. زمانی از آن استفاده کنید که عمداً همان id را از یک مسیر محلی جدید، archive، package در ClawHub، یا artifact در npm دوباره نصب می‌کنید. برای ارتقاهای معمول یک Plugin npm که از قبل رهگیری می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای یک id مربوط به Plugin که از قبل نصب شده اجرا کنید، OpenClaw متوقف می‌شود و برای ارتقای عادی شما را به `plugins update <id-or-npm-spec>` راهنمایی می‌کند، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید، به `plugins install <package> --force` اشاره می‌کند.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع سنجاق‌شده می‌خواهید، از ref صریح git مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec مربوط به npm، فراداده منبع marketplace را پایدار می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` گزینه‌ای اضطراری برای مثبت‌های کاذب در اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه یابد، اما بلوک‌های سیاست hook مربوط به `before_install` در Plugin را دور نمی‌زند و شکست‌های اسکن را نیز دور نمی‌زند.

    این flag در CLI برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skills که از Gateway پشتیبانی می‌شوند از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، درحالی‌که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب Skill از ClawHub است.

    اگر Pluginی که در ClawHub منتشر کرده‌اید به‌دلیل اسکن registry مسدود شده است، از مراحل ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های hook و specهای npm">
    `plugins install` سطح نصب برای بسته‌های hook نیز هست که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای نمایان‌سازی hookهای فیلترشده و فعال‌سازی هر hook از `openclaw hooks` استفاده کنید، نه برای نصب package.

    specهای npm **فقط registry** هستند (نام package + نسخه **دقیق** اختیاری یا **dist-tag** اختیاری). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های وابستگی برای ایمنی به‌صورت project-local و با `--ignore-scripts` اجرا می‌شوند، حتی وقتی shell شما تنظیمات نصب سراسری npm دارد.

    وقتی می‌خواهید resolution مربوط به npm را صریح کنید، از `npm:<package>` استفاده کنید. در دوره انتقال راه‌اندازی، specهای خام package نیز مستقیماً از npm نصب می‌شوند.

    specهای خام و `@latest` روی مسیر پایدار می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` برای این بررسی releaseهای پایدار هستند. اگر npm هرکدام از این‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک tag مربوط به prerelease مانند `@beta`/`@rc` یا یک نسخه دقیق prerelease مانند `@1.2.3-beta.4` صراحتاً opt in کنید.

    اگر یک spec نصب خام با id رسمی Plugin مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی کاتالوگ را مستقیماً نصب می‌کند. برای نصب یک package در npm با همان نام، از spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    برای نصب مستقیم از یک مخزن git از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل `git:github.com/owner/repo`، `git:owner/repo`، نشانی‌های clone کامل `https://`، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای check out کردن یک branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` را اضافه کنید.

    نصب‌های Git در یک دایرکتوری موقت clone می‌شوند، در صورت وجود ref درخواستی آن را check out می‌کنند، سپس از نصب‌کننده عادی دایرکتوری Plugin استفاده می‌کنند. یعنی اعتبارسنجی manifest، اسکن کد خطرناک، کار نصب package-manager، و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit resolve‌شده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    پس از نصب از git، از `openclaw plugins inspect <id> --runtime --json` برای تأیید registrationهای runtime مانند متدهای gateway و دستورهای CLI استفاده کنید. اگر Plugin یک root در CLI با `api.registerCli` ثبت کرده است، آن دستور را مستقیماً از طریق CLI ریشه OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiveها">
    archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. archiveهای native Plugin در OpenClaw باید یک `openclaw.plugin.json` معتبر در ریشه Plugin استخراج‌شده داشته باشند؛ archiveهایی که فقط `package.json` دارند پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

در دوره انتقال راه‌اندازی، specهای Plugin سازگار با npm به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح کردن resolution فقط npm از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، API اعلام‌شده Plugin / حداقل سازگاری gateway را بررسی می‌کند. وقتی نسخه انتخاب‌شده ClawHub یک artifact مربوط به ClawPack منتشر می‌کند، OpenClaw فایل `.tgz` مربوط به npm-pack نسخه‌دار را دانلود می‌کند، header مربوط به digest در ClawHub و digest مربوط به artifact را تأیید می‌کند، سپس آن را از مسیر عادی archive نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون فراداده ClawPack همچنان از مسیر قدیمی اعتبارسنجی archive package نصب می‌شوند. نصب‌های ثبت‌شده فراداده منبع ClawHub، نوع artifact، integrity مربوط به npm، shasum مربوط به npm، نام tarball، و facts مربوط به digest در ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های بدون نسخه ClawHub یک spec ثبت‌شده بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند releaseهای جدیدتر ClawHub را دنبال کند؛ selectorهای نسخه یا tag صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` به همان selector سنجاق‌شده باقی می‌مانند.

#### shorthand مربوط به Marketplace

وقتی نام marketplace در cache محلی registry مربوط به Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از shorthand به‌شکل `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع marketplace را صریح ارسال کنید، از `--marketplace` استفاده کنید:

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
    - خلاصه مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL گیت

  </Tab>
  <Tab title="قواعد Marketplace راه‌دور">
    برای marketplaceهای راه‌دور که از GitHub یا گیت بارگذاری می‌شوند، ورودی‌های plugin باید داخل مخزن marketplace شبیه‌سازی‌شده باقی بمانند. OpenClaw منابع مسیر نسبی را از همان مخزن می‌پذیرد و منابع Plugin از نوع HTTP(S)، مسیر مطلق، گیت، GitHub و دیگر منابع غیرمسیری را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw به‌صورت خودکار تشخیص می‌دهد:

- pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشه معمول plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. در حال حاضر، Skills بسته، command-skills کلود، پیش‌فرض‌های `settings.json` کلود، پیش‌فرض‌های `.lsp.json` کلود / `lspServers` اعلام‌شده در manifest، command-skills کِرسِر، و دایرکتوری‌های hook سازگار Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگر بسته که تشخیص داده می‌شوند در diagnostics/info نمایش داده می‌شوند اما هنوز به اجرای زمان اجرا متصل نشده‌اند.
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
  فقط pluginهای فعال‌شده را نشان بده.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خط‌های جزئیات جداگانه برای هر plugin با فراداده‌های منبع/خاستگاه/نسخه/فعال‌سازی جابه‌جا شو.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن برای ماشین به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های package.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری plugin محلی پایدارشده را می‌خواند و وقتی رجیستری موجود نباشد یا نامعتبر باشد، از fallback مشتق‌شده فقط از manifest استفاده می‌کند. این دستور برای بررسی اینکه آیا یک plugin نصب، فعال و برای برنامه‌ریزی راه‌اندازی سرد قابل مشاهده است مفید است، اما یک probe زنده زمان اجرا از فرایند Gateway ازپیش‌درحال‌اجرا نیست. پس از تغییر کد plugin، فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار برای اجرای کد `register(api)` یا hookهای جدید، Gatewayی را که channel را سرویس می‌دهد راه‌اندازی مجدد کنید. برای استقرارهای راه‌دور/کانتینری، بررسی کنید که فرزند واقعی `openclaw gateway run` را راه‌اندازی مجدد می‌کنید، نه فقط یک فرایند wrapper.

`plugins list --json` شامل `dependencyStatus` هر plugin از `dependencies` و `optionalDependencies` در `package.json` است. OpenClaw بررسی می‌کند که آیا نام آن packageها در مسیر عادی lookup مربوط به `node_modules` در Node برای آن plugin وجود دارند یا نه؛ کد زمان اجرای plugin را import نمی‌کند، package manager اجرا نمی‌کند، و وابستگی‌های جاافتاده را repair نمی‌کند.
</Note>

`plugins search` یک جست‌وجوی کاتالوگ راه‌دور ClawHub است. وضعیت محلی را بررسی نمی‌کند، config را تغییر نمی‌دهد، package نصب نمی‌کند، یا کد زمان اجرای plugin را بارگذاری نمی‌کند. نتایج جست‌وجو شامل نام package در ClawHub، خانواده، channel، نسخه، خلاصه، و راهنمای نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی plugin بسته‌بندی‌شده درون یک image پکیج‌شده Docker، دایرکتوری منبع plugin را روی مسیر منبع پکیج‌شده متناظر bind-mount کنید، مانند `/app/extensions/synology-chat`. OpenClaw آن overlay منبع mountشده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع که صرفاً کپی شده باشد بی‌اثر می‌ماند تا نصب‌های پکیج‌شده عادی همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hook زمان اجرا:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics را از یک گذر inspection با module-loaded نشان می‌دهد. Runtime inspection هرگز وابستگی‌ها را نصب نمی‌کند؛ از `openclaw doctor --fix` برای پاک‌سازی وضعیت legacy وابستگی یا نصب pluginهای قابل‌دانلودِ تنظیم‌شده‌ای که جاافتاده‌اند استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل‌دسترسی، راهنماهای سرویس/فرایند، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای مکالمه غیربسته‌بندی‌شده (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی‌کردن یک دایرکتوری محلی، از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌شود):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های لینک‌شده به‌جای کپی‌کردن روی یک هدف نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کنند.

برای نصب‌های npm از `--pin` استفاده کنید تا spec دقیق resolveشده (`name@version`) در index plugin مدیریت‌شده ذخیره شود، درحالی‌که رفتار پیش‌فرض بدون pin باقی می‌ماند.
</Note>

### Index plugin

فراداده نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. map سطح‌بالای `installRecords` منبع پایدار فراداده نصب است، از جمله رکوردهای مربوط به manifestهای plugin خراب یا جاافتاده. آرایه `plugins` cache رجیستری سرد مشتق‌شده از manifest است. فایل شامل هشدار ویرایش‌نکنید است و توسط `openclaw plugins update`، uninstall، diagnostics، و رجیستری سرد plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای legacy ارسال‌شده `plugins.installs` را در config ببیند، آن‌ها را به index plugin منتقل می‌کند و کلید config را حذف می‌کند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، رکوردهای config نگه داشته می‌شوند تا فراداده نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای plugin را از `plugins.entries`، index پایدارشده plugin، ورودی‌های فهرست allow/deny برای plugin، و در صورت کاربرد، ورودی‌های لینک‌شده `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، uninstall همچنین دایرکتوری نصب مدیریت‌شده ردیابی‌شده را وقتی داخل ریشه extensions pluginهای OpenClaw باشد حذف می‌کند. برای pluginهای active memory، slot حافظه به `memory-core` بازنشانی می‌شود.

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

به‌روزرسانی‌ها روی نصب‌های plugin ردیابی‌شده در index مدیریت‌شده plugin و نصب‌های hook-pack ردیابی‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="Resolve کردن id plugin در برابر spec npm">
    وقتی یک id plugin را پاس می‌دهید، OpenClaw از spec نصب ثبت‌شده برای همان plugin دوباره استفاده می‌کند. یعنی dist-tagهایی مانند `@beta` که قبلاً ذخیره شده‌اند و نسخه‌های دقیق pinشده در اجراهای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، همچنین می‌توانید یک spec صریح package npm با dist-tag یا نسخه دقیق پاس بدهید. OpenClaw آن نام package را به رکورد plugin ردیابی‌شده برمی‌گرداند، آن plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های آینده مبتنی بر id ثبت می‌کند.

    پاس‌دادن نام package npm بدون نسخه یا tag نیز به رکورد plugin ردیابی‌شده برمی‌گردد. وقتی یک plugin به نسخه دقیق pin شده است و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های channel بتا">
    `openclaw plugins update` از spec ردیابی‌شده plugin دوباره استفاده می‌کند، مگر اینکه spec جدیدی پاس بدهید. `openclaw update` علاوه بر این channel فعال به‌روزرسانی OpenClaw را می‌شناسد: روی channel بتا، رکوردهای plugin npm و ClawHub از خط پیش‌فرض ابتدا `@beta` را امتحان می‌کنند، سپس اگر هیچ انتشار بتایی برای plugin وجود نداشته باشد به spec پیش‌فرض/latest ثبت‌شده fallback می‌کنند. نسخه‌های دقیق و tagهای صریح روی همان selector pin می‌مانند.

  </Accordion>
  <Accordion title="بررسی‌های نسخه و drift یکپارچگی">
    پیش از یک به‌روزرسانی زنده npm، OpenClaw نسخه package نصب‌شده را در برابر فراداده رجیستری npm بررسی می‌کند. اگر نسخه نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف resolveشده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب مجدد، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact دریافت‌شده تغییر کند، OpenClaw آن را drift مربوط به artifact npm تلقی می‌کند. فرمان تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی به‌صورت fail closed عمل می‌کنند، مگر اینکه فراخواننده یک سیاست ادامه صریح ارائه کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install در update">
    `--dangerously-force-unsafe-install` همچنین در `plugins update` به‌عنوان override اضطراری برای مثبت‌های کاذب scan کد خطرناک داخلی هنگام به‌روزرسانی plugin در دسترس است. همچنان blockهای سیاست `before_install` مربوط به plugin یا مسدودسازی ناشی از شکست scan را دور نمی‌زند، و فقط برای به‌روزرسانی‌های plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect هویت، وضعیت load، منبع، قابلیت‌های manifest، پرچم‌های سیاست، diagnostics، فراداده نصب، قابلیت‌های بسته، و هرگونه پشتیبانی تشخیص‌داده‌شده از سرور MCP یا LSP را به‌طور پیش‌فرض بدون import کردن زمان اجرای plugin نشان می‌دهد. `--runtime` را اضافه کنید تا module plugin بارگذاری شود و hookها، tools، commands، services، متدهای gateway، و مسیرهای HTTP ثبت‌شده نیز شامل شوند. Runtime inspection وابستگی‌های جاافتاده plugin را مستقیماً گزارش می‌کند؛ نصب‌ها و repairها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI متعلق به plugin به‌عنوان گروه‌های فرمان ریشه `openclaw` نصب می‌شوند. پس از آنکه `inspect --runtime` یک فرمان را زیر `cliCommands` نشان داد، آن را به‌صورت `openclaw <command> ...` اجرا کنید؛ برای نمونه pluginی که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` تأیید شود.

هر plugin بر اساس چیزی که واقعاً در زمان اجرا ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (مثلاً یک plugin فقط-provider)
- **hybrid-capability** — چند نوع قابلیت (مثلاً متن + گفتار + تصویر)
- **hook-only** — فقط hookها، بدون قابلیت یا surface
- **non-capability** — tools/commands/services اما بدون قابلیت

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل‌خواندن برای ماشین تولید می‌کند که برای scripting و auditing مناسب است. `inspect --all` یک جدول fleet-wide با ستون‌های shape، گونه‌های capability، compatibility notices، bundle capabilities، و hook summary رندر می‌کند. `info` alias برای `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای load مربوط به plugin، diagnostics مربوط به manifest/discovery، و compatibility notices را گزارش می‌کند. وقتی همه‌چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

اگر یک plugin تنظیم‌شده روی دیسک حاضر باشد اما توسط بررسی‌های path-safety loader مسدود شود، اعتبارسنجی config ورودی plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف config مربوط به `plugins.entries.<id>` یا `plugins.allow`، diagnostic قبلی plugin مسدودشده، مانند مالکیت مسیر یا مجوزهای world-writable، را اصلاح کنید.

برای شکست‌های module-shape مانند exportهای جاافتاده `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا یک خلاصه فشرده از export-shape در خروجی diagnostic درج شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری plugin محلی مدل خواندن سرد پایدارشده OpenClaw برای هویت plugin نصب‌شده، فعال‌سازی، فراداده منبع، و مالکیت contribution است. راه‌اندازی عادی، lookup مالک provider، طبقه‌بندی تنظیم channel، و موجودی plugin می‌توانند آن را بدون import کردن moduleهای زمان اجرای plugin بخوانند.

از `plugins registry` برای بررسی اینکه رجیستری ماندگارشده موجود، به‌روز یا کهنه است استفاده کنید. از `--refresh` برای بازسازی آن از شاخص ماندگارشدهٔ Plugin، سیاست پیکربندی، و فرادادهٔ manifest/package استفاده کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی در زمان اجرا.

`openclaw doctor --fix` همچنین ناهماهنگی npm مدیریت‌شدهٔ مرتبط با رجیستری را تعمیر می‌کند: اگر یک بستهٔ یتیم یا بازیابی‌شدهٔ `@openclaw/*` زیر ریشهٔ npm مدیریت‌شدهٔ Plugin یک Plugin همراه‌شده را تحت‌الشعاع قرار دهد، doctor آن بستهٔ کهنه را حذف می‌کند و رجیستری را بازسازی می‌کند تا راه‌اندازی در برابر manifest همراه‌شده اعتبارسنجی شود.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک سوییچ سازگاری اضطراری منسوخ برای شکست‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ جایگزین env فقط برای بازیابی اضطراری راه‌اندازی در زمانی است که مهاجرت در حال عرضه است.
</Warning>

### بازارچه

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست بازارچه یک مسیر بازارچهٔ محلی، یک مسیر `marketplace.json`، یک اختصار GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL گیت را می‌پذیرد. `--json` برچسب منبع حل‌شده به‌همراه manifest بازارچهٔ تجزیه‌شده و ورودی‌های Plugin را چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

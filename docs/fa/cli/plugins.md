---
read_when:
    - می‌خواهید Plugin‌های Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Pluginها
x-i18n:
    generated_at: "2026-05-07T13:15:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
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
  <Card title="manifest Plugin" href="/fa/plugins/manifest">
    فیلدهای manifest و شِمای پیکربندی.
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

برای بررسی نصب، بازرسی، حذف نصب، یا نوسازی registry که کند است، دستور را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی مرحله‌ها را در stderr می‌نویسد و خروجی JSON را قابل parse نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییردهنده‌های چرخهٔ عمر Plugin غیرفعال هستند. به‌جای `plugins install`، `plugins update`، `plugins uninstall`، `plugins enable`، یا `plugins disable` از منبع Nix برای این نصب استفاده کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) agent-first استفاده کنید.
</Note>

<Note>
Pluginهای همراه با OpenClaw عرضه می‌شوند. بعضی به‌صورت پیش‌فرض فعال‌اند (برای مثال providerهای مدل همراه، providerهای گفتار همراه، و Plugin مرورگر همراه)؛ بقیه به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را همراه با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. bundleهای سازگار به‌جای آن از manifestهای bundle خودشان استفاده می‌کنند.

`plugins list`، `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی مفصل list/info همچنین زیرنوع bundle (`codex`، `claude`، یا `cursor`) به‌علاوهٔ قابلیت‌های bundle شناسایی‌شده را نشان می‌دهد.
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
نام‌های سادهٔ package در دورهٔ جابه‌جایی راه‌اندازی، به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Pluginها را مانند اجرای کد در نظر بگیرید. نسخه‌های pin‌شده را ترجیح دهید.
</Warning>

`plugins search` از ClawHub برای packageهای Plugin قابل نصب پرس‌وجو می‌کند و نام packageهای آمادهٔ نصب را چاپ می‌کند. این دستور packageهای code-plugin و bundle-plugin را جست‌وجو می‌کند، نه skills. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. Npm همچنان یک مسیر fallback و نصب مستقیم پشتیبانی‌شده است. packageهای Plugin متعلق به OpenClaw با نام `@openclaw/*` دوباره در npm منتشر می‌شوند؛ فهرست فعلی را در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا [موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند. نصب‌ها و به‌روزرسانی‌های کانال beta، وقتی تگ npm `beta` موجود باشد، آن dist-tag را ترجیح می‌دهند و سپس به `latest` fallback می‌کنند.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و تعمیر پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی شود، `plugins install/update/enable/disable/uninstall` همان فایل included را می‌نویسند و `openclaw.json` را دست‌نخورده می‌گذارند. includeهای ریشه، آرایه‌های include، و includeهایی با overrideهای هم‌سطح، به‌جای flatten شدن، بسته fail می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولاً بسته fail می‌شود و به شما می‌گوید اول `openclaw doctor --fix` را اجرا کنید. هنگام شروع Gateway و hot reload، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگری بسته fail می‌شود؛ `openclaw doctor --fix` می‌تواند ورودی Plugin نامعتبر را قرنطینه کند. تنها استثنای مستندشده در زمان نصب، یک مسیر بازیابی محدود برای Pluginهای همراهی است که صراحتاً `openclaw.install.allowInvalidConfigRecovery` را فعال کرده‌اند.

  </Accordion>
  <Accordion title="--force و نصب دوباره در برابر به‌روزرسانی">
    `--force` از مقصد نصب موجود دوباره استفاده می‌کند و یک Plugin یا بستهٔ hook ازقبل‌نصب‌شده را درجا بازنویسی می‌کند. وقتی عمداً همان id را از یک مسیر محلی، archive، package ClawHub، یا artifact npm جدید دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل tracked است، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id یک Plugin که از قبل نصب شده اجرا کنید، OpenClaw متوقف می‌شود و شما را برای ارتقای عادی به `plugins update <id-or-npm-spec>`، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید به `plugins install <package> --force` ارجاع می‌دهد.

  </Accordion>
  <Accordion title="دامنهٔ --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pin‌شده می‌خواهید، از ref صریح git مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec npm، metadata منبع marketplace را پایدار می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` یک گزینهٔ اضطراری برای false positiveها در scanner داخلی کد خطرناک است. اجازه می‌دهد نصب حتی وقتی scanner داخلی یافته‌های `critical` گزارش می‌کند ادامه پیدا کند، اما blockهای policy مربوط به hook `before_install` در Plugin را دور نمی‌زند و failureهای scan را نیز دور نمی‌زند.

    این flag در CLI برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های dependency مربوط به skill با پشتیبانی Gateway از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان یک جریان جداگانهٔ دانلود/نصب skill از ClawHub است.

    اگر Pluginای که در ClawHub منتشر کرده‌اید توسط scan رجیستری block شده است، از مراحل publisher در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های hook و specهای npm">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای مشاهده‌پذیری hook فیلترشده و فعال‌سازی تک‌hook، از `openclaw hooks` استفاده کنید، نه برای نصب package.

    specهای npm **فقط registry** هستند (نام package + نسخهٔ **دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های dependency برای ایمنی به‌صورت project-local با `--ignore-scripts` اجرا می‌شوند، حتی وقتی shell شما تنظیمات نصب npm سراسری داشته باشد. ریشه‌های npm مدیریت‌شدهٔ Plugin، `overrides` سطح package مربوط به npm در OpenClaw را به ارث می‌برند، پس pinهای امنیتی host روی dependencyهای hoisted Plugin هم اعمال می‌شوند.

    وقتی می‌خواهید resolution مربوط به npm را صریح کنید، از `npm:<package>` استفاده کنید. specهای سادهٔ package نیز در دورهٔ جابه‌جایی راه‌اندازی مستقیماً از npm نصب می‌شوند.

    specهای ساده و `@latest` روی مسیر پایدار می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` برای این check انتشارهای پایدار هستند. اگر npm هرکدام از این‌ها را به prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک تگ prerelease مانند `@beta`/`@rc` یا یک نسخهٔ prerelease دقیق مانند `@1.2.3-beta.4` صراحتاً opt in کنید.

    اگر یک spec نصب ساده با id یک Plugin رسمی match شود (برای مثال `diffs`)، OpenClaw ورودی catalog را مستقیماً نصب می‌کند. برای نصب یک package npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    از `git:<repo>` برای نصب مستقیم از یک مخزن git استفاده کنید. شکل‌های پشتیبانی‌شده شامل `git:github.com/owner/repo`، `git:owner/repo`، نشانی‌های clone کامل `https://`، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` اضافه کنید.

    نصب‌های Git در یک دایرکتوری موقت clone می‌شوند، در صورت وجود ref درخواست‌شده آن را checkout می‌کنند، سپس از نصب‌کنندهٔ عادی دایرکتوری Plugin استفاده می‌کنند. یعنی اعتبارسنجی manifest، scanning کد خطرناک، کار نصب package-manager، و رکوردهای نصب مثل نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌علاوهٔ commit resolve‌شده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    پس از نصب از git، از `openclaw plugins inspect <id> --runtime --json` برای تأیید registrationهای runtime مانند methodهای gateway و دستورهای CLI استفاده کنید. اگر Plugin یک root CLI را با `api.registerCli` ثبت کرده است، آن دستور را مستقیماً از طریق CLI ریشهٔ OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiveها">
    archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. archiveهای Plugin بومی OpenClaw باید در ریشهٔ Plugin استخراج‌شده یک `openclaw.plugin.json` معتبر داشته باشند؛ archiveهایی که فقط `package.json` دارند، پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball از npm-pack است و می‌خواهید همان مسیر نصب مدیریت‌شدهٔ npm-root را که نصب‌های registry استفاده می‌کنند تست کنید، از `npm-pack:<path.tgz>` استفاده کنید؛ شامل تأیید `package-lock.json`، scanning dependencyهای hoisted، و رکوردهای نصب npm. مسیرهای archive ساده همچنان به‌عنوان archiveهای محلی زیر ریشهٔ extensions مربوط به Plugin نصب می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

specهای npm-safe سادهٔ Plugin در دورهٔ جابه‌جایی راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح‌کردن resolution فقط از npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، API اعلام‌شدهٔ Plugin / حداقل سازگاری Gateway را بررسی می‌کند. وقتی نسخهٔ انتخاب‌شدهٔ ClawHub یک آرتیفکت ClawPack منتشر کرده باشد، OpenClaw بستهٔ npm نسخه‌گذاری‌شدهٔ `.tgz` را دانلود می‌کند، سربرگ چکیدهٔ ClawHub و چکیدهٔ آرتیفکت را تأیید می‌کند، سپس آن را از مسیر عادی آرشیو نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون فرادادهٔ ClawPack همچنان از مسیر قدیمی تأیید آرشیو بسته نصب می‌شوند. نصب‌های ثبت‌شده، فرادادهٔ منبع ClawHub، نوع آرتیفکت، یکپارچگی npm، shasum npm، نام tarball، و واقعیت‌های چکیدهٔ ClawPack خود را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های ClawHub بدون نسخه، یک مشخصات ثبت‌شدهٔ بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند نسخه‌های جدیدتر ClawHub را دنبال کند؛ گزینشگرهای نسخه یا برچسب صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان گزینشگر سنجاق می‌مانند.

#### میان‌بر بازارچه

وقتی نام بازارچه در کش رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از میان‌بر `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع بازارچه را به‌صورت صریح بدهید، از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="منابع بازارچه">
    - یک نام بازارچهٔ شناخته‌شدهٔ Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشهٔ بازارچهٔ محلی یا مسیر `marketplace.json`
    - میان‌بر مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL گیت

  </Tab>
  <Tab title="قواعد بازارچهٔ راه‌دور">
    برای بازارچه‌های راه‌دور که از GitHub یا گیت بارگذاری می‌شوند، مدخل‌های Plugin باید داخل مخزن بازارچهٔ کلون‌شده باقی بمانند. OpenClaw منابع مسیر نسبی را از همان مخزن می‌پذیرد و منابع Plugin از نوع HTTP(S)، مسیر مطلق، گیت، GitHub، و دیگر منابع نامسیری را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفهٔ Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشهٔ عادی Plugin نصب می‌شوند و در همان جریان list/info/enable/disable شرکت می‌کنند. امروز، Skills بسته، command-skillsهای Claude، پیش‌فرض‌های Claude `settings.json`، پیش‌فرض‌های Claude `.lsp.json` / `lspServers` اعلام‌شده در manifest، command-skillsهای Cursor، و دایرکتوری‌های hook سازگار Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگر بسته که تشخیص داده می‌شوند در diagnostics/info نمایش داده می‌شوند اما هنوز به اجرای runtime متصل نشده‌اند.
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
  از نمای جدول به خط‌های جزئیات جداگانه برای هر Plugin با فرادادهٔ منبع/خاستگاه/نسخه/فعال‌سازی برو.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن برای ماشین، به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی ماندگارشدهٔ Plugin را می‌خواند و وقتی رجیستری گم شده یا نامعتبر باشد، به یک جایگزین مشتق‌شده فقط از manifest رجوع می‌کند. این برای بررسی نصب‌بودن، فعال‌بودن، و قابل‌مشاهده‌بودن یک Plugin برای برنامه‌ریزی شروع سرد مفید است، اما یک کاوش زندهٔ runtime از فرایند Gateway درحال‌اجرا نیست. پس از تغییر کد Plugin، وضعیت فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار اجرای کد `register(api)` یا hookهای جدید، Gatewayی را که به کانال سرویس می‌دهد دوباره راه‌اندازی کنید. برای استقرارهای راه‌دور/کانتینری، تأیید کنید که فرزند واقعی `openclaw gateway run` را دوباره راه‌اندازی می‌کنید، نه فقط یک فرایند wrapper.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `package.json`
`dependencies` و `optionalDependencies` است. OpenClaw بررسی می‌کند که آیا آن نام‌های بسته در مسیر عادی جست‌وجوی Node `node_modules` مربوط به Plugin وجود دارند یا نه؛
کد runtime Plugin را import نمی‌کند، مدیر بسته اجرا نمی‌کند، و وابستگی‌های گم‌شده را تعمیر نمی‌کند.
</Note>

`plugins search` یک جست‌وجوی کاتالوگ راه‌دور ClawHub است. وضعیت محلی را بررسی نمی‌کند، config را تغییر نمی‌دهد، بسته نصب نمی‌کند، یا کد runtime Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو شامل نام بستهٔ ClawHub، خانواده، کانال، نسخه، خلاصه، و راهنمای نصبی مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Plugin همراه داخل یک تصویر Docker بسته‌بندی‌شده، دایرکتوری منبع Plugin را روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mount کنید، مانند
`/app/extensions/synology-chat`. OpenClaw این overlay منبع mount‌شده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع که صرفاً کپی شده باشد بی‌اثر می‌ماند، تا نصب‌های بسته‌بندی‌شدهٔ عادی همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hookهای runtime:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics را از یک گذر بازرسی با ماژول بارگذاری‌شده نشان می‌دهد. بازرسی runtime هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت وابستگی قدیمی یا بازیابی Pluginهای قابل‌دانلود گم‌شده که در config ارجاع شده‌اند، از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل‌دسترسی، راهنمایی‌های سرویس/فرایند، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای گفت‌وگوی غیربسته‌ای (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی‌کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` با `--link` پشتیبانی نمی‌شود، چون نصب‌های پیوندی به‌جای کپی‌کردن روی یک هدف نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کنند.

برای نصب‌های npm، از `--pin` استفاده کنید تا مشخصات دقیق حل‌شده (`name@version`) در نمایهٔ Plugin مدیریت‌شده ذخیره شود، درحالی‌که رفتار پیش‌فرض بدون سنجاق باقی می‌ماند.
</Note>

### نمایهٔ Plugin

فرادادهٔ نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. نگاشت سطح‌بالای `installRecords` منبع پایدار فرادادهٔ نصب است، از جمله رکوردهای مربوط به manifestهای خراب یا گم‌شدهٔ Plugin. آرایهٔ `plugins` کش رجیستری سرد مشتق‌شده از manifest است. این فایل شامل هشدار ویرایش‌نکنید است و توسط `openclaw plugins update`، حذف نصب، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای قدیمی ارسال‌شدهٔ `plugins.installs` را در config می‌بیند، خواندن‌های runtime با آن‌ها به‌عنوان ورودی سازگاری رفتار می‌کنند، بدون بازنویسی `openclaw.json`. نوشتن‌های صریح Plugin و `openclaw doctor --fix` وقتی نوشتن config مجاز باشد، آن رکوردها را به نمایهٔ Plugin منتقل می‌کنند و کلید config را حذف می‌کنند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، رکوردهای config نگه داشته می‌شوند تا فرادادهٔ نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، نمایهٔ ماندگارشدهٔ Plugin، مدخل‌های فهرست اجازه/رد Plugin، و مدخل‌های پیوندی `plugins.load.paths` در صورت کاربرد حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شدهٔ رهگیری‌شده را وقتی داخل ریشهٔ extensions مربوط به Pluginهای OpenClaw باشد حذف می‌کند. برای Pluginهای Active Memory، slot حافظه به `memory-core` بازنشانی می‌شود.

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

به‌روزرسانی‌ها روی نصب‌های رهگیری‌شدهٔ Plugin در نمایهٔ Plugin مدیریت‌شده و نصب‌های رهگیری‌شدهٔ hook-pack در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="حل‌کردن شناسهٔ Plugin در برابر مشخصات npm">
    وقتی یک شناسهٔ Plugin می‌دهید، OpenClaw از مشخصات نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شدهٔ قبلی مانند `@beta` و نسخه‌های دقیق سنجاق‌شده در اجراهای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، می‌توانید یک مشخصات صریح بستهٔ npm با dist-tag یا نسخهٔ دقیق نیز بدهید. OpenClaw آن نام بسته را به رکورد رهگیری‌شدهٔ Plugin برمی‌گرداند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و مشخصات npm جدید را برای به‌روزرسانی‌های آیندهٔ مبتنی بر شناسه ثبت می‌کند.

    دادن نام بستهٔ npm بدون نسخه یا برچسب نیز به رکورد رهگیری‌شدهٔ Plugin برمی‌گردد. وقتی یک Plugin به نسخه‌ای دقیق سنجاق شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال بتا">
    `openclaw plugins update` از مشخصات رهگیری‌شدهٔ Plugin دوباره استفاده می‌کند مگر اینکه مشخصات جدیدی بدهید. `openclaw update` افزون بر این، کانال به‌روزرسانی فعال OpenClaw را می‌شناسد: در کانال بتا، رکوردهای Plugin پیش‌فرض npm و ClawHub ابتدا `@beta` را امتحان می‌کنند، سپس اگر انتشار بتای Plugin وجود نداشته باشد به مشخصات پیش‌فرض/latest ثبت‌شده برمی‌گردند. نسخه‌های دقیق و برچسب‌های صریح به همان گزینشگر سنجاق می‌مانند.

  </Accordion>
  <Accordion title="بررسی‌های نسخه و تغییر یکپارچگی">
    پیش از یک به‌روزرسانی زندهٔ npm، OpenClaw نسخهٔ بستهٔ نصب‌شده را با فرادادهٔ رجیستری npm بررسی می‌کند. اگر نسخهٔ نصب‌شده و هویت آرتیفکت ثبت‌شده از پیش با هدف حل‌شده مطابق باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی یک هش یکپارچگی ذخیره‌شده وجود داشته باشد و هش آرتیفکت واکشی‌شده تغییر کند، OpenClaw آن را تغییر آرتیفکت npm تلقی می‌کند. فرمان تعاملی `openclaw plugins update` هش‌های موردانتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. کمک‌ابزارهای به‌روزرسانی غیرتعاملی بسته می‌مانند و شکست می‌خورند، مگر اینکه فراخواننده یک سیاست ادامهٔ صریح فراهم کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install در به‌روزرسانی">
    `--dangerously-force-unsafe-install` روی `plugins update` نیز به‌عنوان override اضطراری برای موارد مثبت کاذب scan کد خطرناک داخلی در هنگام به‌روزرسانی Pluginها در دسترس است. همچنان بلوک‌های سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست scan را دور نمی‌زند، و فقط روی به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect به‌صورت پیش‌فرض بدون import کردن runtime Plugin، هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، پرچم‌های سیاست، diagnostics، فرادادهٔ نصب، قابلیت‌های بسته، و هر پشتیبانی شناسایی‌شدهٔ سرور MCP یا LSP را نشان می‌دهد. `--runtime` را اضافه کنید تا ماژول Plugin بارگذاری شود و hookها، ابزارها، فرمان‌ها، سرویس‌ها، متدهای Gateway، و مسیرهای HTTP ثبت‌شده نیز شامل شوند. بازرسی runtime وابستگی‌های گم‌شدهٔ Plugin را مستقیماً گزارش می‌کند؛ نصب‌ها و تعمیرها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI متعلق به Plugin معمولاً به‌عنوان گروه‌های فرمان ریشهٔ `openclaw` نصب می‌شوند، اما Pluginها ممکن است فرمان‌های تودرتو را نیز زیر یک والد هسته مانند `openclaw nodes` ثبت کنند. پس از اینکه `inspect --runtime` فرمانی را زیر `cliCommands` نشان داد، آن را در مسیر فهرست‌شده اجرا کنید؛ برای مثال، Pluginی که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin بر اساس چیزی که واقعاً در runtime ثبت می‌کند دسته‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (مثلاً یک plugin فقط مخصوص ارائه‌دهنده)
- **hybrid-capability** — چند نوع قابلیت (مثلاً متن + گفتار + تصاویر)
- **hook-only** — فقط hookها، بدون قابلیت‌ها یا سطح‌ها
- **non-capability** — ابزارها/فرمان‌ها/سرویس‌ها اما بدون قابلیت‌ها

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل خواندن برای ماشین تولید می‌کند که برای اسکریپت‌نویسی و ممیزی مناسب است. `inspect --all` جدولی در سطح کل ناوگان با ستون‌های شکل، انواع قابلیت، اعلان‌های سازگاری، قابلیت‌های بسته، و خلاصه hook نمایش می‌دهد. `info` نام مستعار `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری plugin، عیب‌یابی‌های manifest/discovery، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

اگر یک plugin پیکربندی‌شده روی دیسک وجود داشته باشد اما توسط بررسی‌های ایمنی مسیر loader مسدود شده باشد، اعتبارسنجی پیکربندی ورودی plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف پیکربندی `plugins.entries.<id>` یا `plugins.allow`، عیب‌یابی قبلی plugin مسدودشده، مانند مالکیت مسیر یا مجوزهای world-writable، را برطرف کنید.

برای خرابی‌های شکل ماژول، مانند نبود خروجی‌های `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا خلاصه‌ای فشرده از شکل exportها در خروجی عیب‌یابی گنجانده شود.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

registry محلی plugin مدل خواندن سرد پایدار OpenClaw برای هویت plugin نصب‌شده، فعال‌سازی، فراداده منبع، و مالکیت مشارکت است. راه‌اندازی عادی، جست‌وجوی مالک ارائه‌دهنده، طبقه‌بندی تنظیم کانال، و موجودی plugin می‌توانند بدون import کردن ماژول‌های runtime plugin آن را بخوانند.

از `plugins registry` برای بررسی اینکه registry پایدار موجود، به‌روز، یا قدیمی است استفاده کنید. از `--refresh` برای بازسازی آن از نمایه پایدار plugin، سیاست پیکربندی، و فراداده manifest/package استفاده کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی runtime.

`openclaw doctor --fix` همچنین drift مربوط به npm مدیریت‌شده در مجاورت registry را تعمیر می‌کند: اگر یک بسته یتیم یا بازیابی‌شده `@openclaw/*` زیر ریشه npm مدیریت‌شده plugin روی یک plugin بسته‌بندی‌شده سایه بیندازد، doctor آن بسته قدیمی را حذف می‌کند و registry را بازسازی می‌کند تا راه‌اندازی بر اساس manifest بسته‌بندی‌شده اعتبارسنجی شود.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک کلید سازگاری اضطراری منسوخ برای خرابی‌های خواندن registry است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback محیطی فقط برای بازیابی اضطراری راه‌اندازی هنگام rollout مهاجرت است.
</Warning>

### بازارچه

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست بازارچه یک مسیر بازارچه محلی، یک مسیر `marketplace.json`، یک خلاصه GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git را می‌پذیرد. `--json` برچسب منبع حل‌شده به‌همراه manifest بازارچه parse‌شده و ورودی‌های plugin را چاپ می‌کند.

## مرتبط

- [ساخت pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [pluginهای جامعه](/fa/plugins/community)

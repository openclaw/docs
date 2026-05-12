---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خرابی‌های بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-12T08:45:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b51646a103e9e020f6e53cd08aa25e7291fb629741fd41bdab520d80b7416ff
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های hook، و bundleهای سازگار.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی، و عیب‌یابی pluginها.
  </Card>
  <Card title="Manage plugins" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست‌کردن، به‌روزرسانی، حذف نصب، و انتشار.
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

برای بررسی نصب، inspect، حذف نصب، یا تازه‌سازی registry که کند است، فرمان را با
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی فازها را در stderr می‌نویسد
و خروجی JSON را قابل parse نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
در حالت Nix (`OPENCLAW_NIX_MODE=1`)، تغییر‌دهنده‌های چرخه‌عمر plugin غیرفعال هستند. برای این نصب به‌جای `plugins install`، `plugins update`، `plugins uninstall`، `plugins enable`، یا `plugins disable` از منبع Nix استفاده کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) agent-first استفاده کنید.
</Note>

<Note>
Pluginهای همراه با OpenClaw عرضه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال providerهای مدل همراه، providerهای گفتار همراه، و plugin مرورگر همراه)؛ برخی دیگر به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. bundleهای سازگار به‌جای آن از manifestهای bundle خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی verbose برای list/info همچنین زیرنوع bundle (`codex`، `claude`، یا `cursor`) به‌همراه قابلیت‌های bundle شناسایی‌شده را نشان می‌دهد.
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

نگه‌دارندگان هنگام آزمودن نصب‌های زمان setup می‌توانند منابع نصب خودکار plugin
را با متغیرهای محیطی محافظت‌شده override کنند. [Overrideهای نصب Plugin](/fa/plugins/install-overrides) را ببینید.

<Warning>
نام‌های بسته‌ی ساده در دوره‌ی جابه‌جایی انتشار به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. با نصب pluginها مثل اجرای کد برخورد کنید. نسخه‌های pin‌شده را ترجیح دهید.
</Warning>

`plugins search` در ClawHub برای بسته‌های plugin قابل نصب query می‌زند و نام‌های بسته‌ی آماده‌ی نصب را چاپ می‌کند. این فرمان بسته‌های code-plugin و bundle-plugin را جست‌وجو می‌کند، نه Skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر pluginها است. npm همچنان یک fallback پشتیبانی‌شده و مسیر نصب مستقیم است. بسته‌های plugin متعلق به OpenClaw با الگوی `@openclaw/*` دوباره در npm منتشر می‌شوند؛ فهرست فعلی را در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا [inventory plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند. نصب‌ها و به‌روزرسانی‌های کانال beta وقتی npm dist-tag با نام `beta` در دسترس باشد آن را ترجیح می‌دهند، سپس به `latest` fallback می‌کنند.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` در همان فایل include‌شده می‌نویسند و `openclaw.json` را دست‌نخورده می‌گذارند. Includeهای root، آرایه‌های include، و includeهایی با overrideهای هم‌سطح به‌جای flatten شدن، بسته و ناموفق می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولاً بسته و ناموفق می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و hot reload، پیکربندی نامعتبر plugin مثل هر پیکربندی نامعتبر دیگری بسته و ناموفق می‌شود؛ `openclaw doctor --fix` می‌تواند entry نامعتبر plugin را قرنطینه کند. تنها استثنای مستندشده در زمان نصب، مسیر بازیابی محدود برای plugin همراه است، برای pluginهایی که به‌صراحت در `openclaw.install.allowInvalidConfigRecovery` opt in می‌کنند.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` هدف نصب موجود را دوباره استفاده می‌کند و plugin یا بسته‌ی hook ازقبل‌نصب‌شده را در جای خودش بازنویسی می‌کند. وقتی آگاهانه همان id را از یک مسیر محلی، archive، بسته‌ی ClawHub، یا artifact npm جدید دوباره نصب می‌کنید از آن استفاده کنید. برای ارتقاهای معمول یک plugin npm که از قبل track شده است، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id مربوط به pluginی اجرا کنید که از قبل نصب شده است، OpenClaw متوقف می‌شود و برای ارتقای معمول شما را به `plugins update <id-or-npm-spec>` راهنمایی می‌کند، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبع دیگری بازنویسی کنید به `plugins install <package> --force`.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` فقط روی نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pin‌شده می‌خواهید، از یک git ref صریح مثل `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای npm spec، metadata منبع marketplace را ماندگار می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` گزینه‌ای اضطراری برای مثبت‌های کاذب در اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه پیدا کند، اما blockهای policy مربوط به hookهای `before_install` در plugin را دور نمی‌زند و failureهای scan را دور نمی‌زند.

    این CLI flag روی جریان‌های نصب/به‌روزرسانی plugin اعمال می‌شود. نصب‌های dependency مربوط به skill که با Gateway پشتیبانی می‌شوند از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، درحالی‌که `openclaw skills install` همچنان جریان جداگانه‌ی دانلود/نصب skill از ClawHub است.

    اگر pluginی که در ClawHub منتشر کرده‌اید با scan در registry مسدود شده است، از مراحل ناشر در [ClawHub](/fa/clawhub/security) استفاده کنید.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` expose می‌کنند. برای visibility فیلترشده‌ی hook و فعال‌سازی هر hook، نه نصب package، از `openclaw hooks` استفاده کنید.

    specهای npm **فقط registry** هستند (نام package + **نسخه‌ی دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های dependency برای ایمنی به‌صورت project-local با `--ignore-scripts` اجرا می‌شوند، حتی وقتی shell شما تنظیمات سراسری نصب npm دارد. ریشه‌های npm مدیریت‌شده‌ی plugin، `overrides` سطح package متعلق به OpenClaw را به ارث می‌برند، بنابراین pinهای امنیتی host روی dependencyهای hoist‌شده‌ی plugin هم اعمال می‌شوند.

    وقتی می‌خواهید resolution npm را صریح کنید، از `npm:<package>` استفاده کنید. specهای ساده‌ی package هم در دوره‌ی جابه‌جایی انتشار مستقیماً از npm نصب می‌شوند.

    specهای ساده و `@latest` روی track پایدار می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مثل `2026.5.3-1` برای این check، releaseهای پایدار هستند. اگر npm هرکدام از آن‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک tag prerelease مثل `@beta`/`@rc` یا یک نسخه‌ی دقیق prerelease مثل `@1.2.3-beta.4` صریحاً opt in کنید.

    اگر یک install spec ساده با id رسمی plugin مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw مستقیماً entry کاتالوگ را نصب می‌کند. برای نصب یک package npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    برای نصب مستقیم از یک repository در git، از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل clone URLهای `git:github.com/owner/repo`، `git:owner/repo`، `https://` کامل، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` را اضافه کنید.

    نصب‌های Git در یک directory موقت clone می‌کنند، وقتی ref درخواست‌شده وجود داشته باشد آن را check out می‌کنند، سپس از installer عادی directory plugin استفاده می‌کنند. یعنی اعتبارسنجی manifest، اسکن کد خطرناک، کار نصب package-manager، و recordهای نصب مثل نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit resolve‌شده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    بعد از نصب از git، از `openclaw plugins inspect <id> --runtime --json` برای تأیید registrationهای runtime مثل متدهای gateway و فرمان‌های CLI استفاده کنید. اگر plugin با `api.registerCli` یک CLI root ثبت کرده است، آن فرمان را مستقیماً از طریق CLI root متعلق به OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. Archiveهای plugin بومی OpenClaw باید در root استخراج‌شده‌ی plugin یک `openclaw.plugin.json` معتبر داشته باشند؛ archiveهایی که فقط `package.json` دارند پیش از اینکه OpenClaw recordهای نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball از npm-pack است و می‌خواهید همان مسیر نصب npm-root مدیریت‌شده را که نصب‌های registry استفاده می‌کنند تست کنید، از `npm-pack:<path.tgz>` استفاده کنید،
    شامل تأیید `package-lock.json`، اسکن dependencyهای hoist‌شده، و
    recordهای نصب npm. مسیرهای archive ساده همچنان به‌عنوان archive محلی
    زیر root مربوط به extensions plugin نصب می‌شوند.

    نصب‌های marketplace مربوط به Claude هم پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

specهای plugin ساده و ایمن برای npm در دوره‌ی جابه‌جایی انتشار به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح‌کردن resolution فقط-npm از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، سازگاری API تبلیغ‌شدهٔ Plugin / حداقل سازگاری Gateway را بررسی می‌کند. وقتی نسخهٔ انتخاب‌شدهٔ ClawHub یک آرتیفکت ClawPack منتشر می‌کند، OpenClaw بستهٔ npm-pack نسخه‌دار `.tgz` را دانلود می‌کند، سرآیند digest در ClawHub و digest آرتیفکت را تأیید می‌کند، سپس آن را از مسیر معمول آرشیو نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون فرادادهٔ ClawPack همچنان از مسیر قدیمی تأیید آرشیو بسته نصب می‌شوند. نصب‌های ثبت‌شده، فرادادهٔ منبع ClawHub، نوع آرتیفکت، یکپارچگی npm، shasum در npm، نام tarball، و واقعیت‌های digest در ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های ClawHub بدون نسخه، یک مشخصهٔ ثبت‌شدهٔ بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند انتشارهای جدیدتر ClawHub را دنبال کند؛ انتخابگرهای نسخه یا برچسب صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان انتخابگر سنجاق می‌مانند.

#### کوتاه‌نویسی بازار

وقتی نام بازار در کش رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از کوتاه‌نویسی `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع بازار را صریحاً ارسال کنید، از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="منابع بازار">
    - یک نام بازار شناخته‌شدهٔ Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشهٔ بازار محلی یا مسیر `marketplace.json`
    - کوتاه‌نویسی مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL مربوط به git

  </Tab>
  <Tab title="قواعد بازار راه دور">
    برای بازارهای راه دور که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن بازار cloneشده باقی بمانند. OpenClaw منابع مسیر نسبی را از همان مخزن می‌پذیرد و منابع Plugin از نوع HTTP(S)، مسیر مطلق، git، GitHub، و دیگر منابع غیرمسیر را از manifestهای راه دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفهٔ Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشهٔ معمول Plugin نصب می‌شوند و در همان جریان list/info/enable/disable شرکت می‌کنند. امروز، bundle skills، command-skills مربوط به Claude، پیش‌فرض‌های `settings.json` در Claude، پیش‌فرض‌های `.lsp.json` در Claude / `lspServers` اعلام‌شده در manifest، command-skills مربوط به Cursor، و دایرکتوری‌های hook سازگار با Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگر بسته که شناسایی می‌شوند در diagnostics/info نمایش داده می‌شوند، اما هنوز به اجرای زمان اجرا متصل نشده‌اند.
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
  از نمای جدولی به خط‌های جزئیات هر Plugin با فرادادهٔ منبع/خاستگاه/نسخه/فعال‌سازی جابه‌جا شو.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن توسط ماشین به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی پایدارشدهٔ Plugin را می‌خواند، و وقتی رجیستری وجود نداشته باشد یا نامعتبر باشد، از fallback مشتق‌شده فقط از manifest استفاده می‌کند. این دستور برای بررسی اینکه آیا یک Plugin نصب، فعال، و برای برنامه‌ریزی راه‌اندازی سرد قابل مشاهده است مفید است، اما probe زندهٔ زمان اجرا از یک فرایند Gateway از قبل در حال اجرا نیست. پس از تغییر کد Plugin، فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار برای اجرای کد `register(api)` جدید یا hookها، Gateway سرویس‌دهندهٔ کانال را راه‌اندازی دوباره کنید. برای استقرارهای راه دور/کانتینری، تأیید کنید که child واقعی `openclaw gateway run` را راه‌اندازی دوباره می‌کنید، نه فقط یک فرایند wrapper.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `package.json`
`dependencies` و `optionalDependencies` است. OpenClaw بررسی می‌کند که آیا آن نام‌های بسته
در مسیر lookup معمول `node_modules` متعلق به Node برای Plugin حضور دارند یا نه؛
کد زمان اجرای Plugin را import نمی‌کند، package manager اجرا نمی‌کند، و وابستگی‌های
گمشده را repair نمی‌کند.
</Note>

`plugins search` یک جست‌وجوی کاتالوگ راه دور ClawHub است. وضعیت محلی را بررسی نمی‌کند،
config را تغییر نمی‌دهد، بسته نصب نمی‌کند، و کد زمان اجرای Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو
شامل نام بستهٔ ClawHub، خانواده، کانال، نسخه، خلاصه، و
راهنمای نصبی مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Pluginهای همراه داخل یک image بسته‌بندی‌شدهٔ Docker، دایرکتوری منبع Plugin
را روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mount کنید، مانند
`/app/extensions/synology-chat`. OpenClaw آن overlay منبع mountشده را
پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع صرفاً کپی‌شده
بی‌اثر می‌ماند تا نصب‌های بسته‌بندی‌شدهٔ معمول همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hook زمان اجرا:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics را از یک گذر inspection با module-loaded نشان می‌دهد. inspection زمان اجرا هرگز وابستگی‌ها را نصب نمی‌کند؛ از `openclaw doctor --fix` برای پاک‌سازی وضعیت وابستگی قدیمی یا بازیابی Pluginهای دانلودشدنی گمشده که در config ارجاع شده‌اند استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل‌دسترسی، راهنماهای سرویس/فرایند، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای گفت‌وگوی غیرهمراه (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی‌کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های پیوندی به‌جای کپی‌کردن روی یک هدف نصب مدیریت‌شده، مسیر منبع را بازاستفاده می‌کنند.

در نصب‌های npm از `--pin` استفاده کنید تا مشخصهٔ دقیق resolveشده (`name@version`) در index مدیریت‌شدهٔ Plugin ذخیره شود، در حالی‌که رفتار پیش‌فرض بدون pin باقی می‌ماند.
</Note>

### index مربوط به Plugin

فرادادهٔ نصب Plugin وضعیتی مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. map سطح بالای `installRecords` منبع پایدار فرادادهٔ نصب است، از جمله رکوردهای manifestهای خراب یا گمشدهٔ Plugin. آرایهٔ `plugins` کش رجیستری سرد مشتق‌شده از manifest است. این فایل شامل هشدار ویرایش‌نکنید است و توسط `openclaw plugins update`، حذف نصب، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای قدیمی عرضه‌شدهٔ `plugins.installs` را در config می‌بیند، خواندن‌های زمان اجرا با آن‌ها به‌عنوان ورودی سازگاری رفتار می‌کنند، بدون اینکه `openclaw.json` را بازنویسی کنند. نوشتن‌های صریح Plugin و `openclaw doctor --fix` آن رکوردها را به index مربوط به Plugin منتقل می‌کنند و وقتی نوشتن config مجاز باشد کلید config را حذف می‌کنند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، رکوردهای config نگه داشته می‌شوند تا فرادادهٔ نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، index پایدارشدهٔ Plugin، ورودی‌های فهرست allow/deny مربوط به Plugin، و در صورت کاربرد ورودی‌های پیوندی `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شدهٔ ردیابی‌شده را وقتی داخل ریشهٔ extensions مربوط به Pluginهای OpenClaw باشد حذف می‌کند. برای Pluginهای active memory، slot حافظه به `memory-core` بازنشانی می‌شود.

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

به‌روزرسانی‌ها روی نصب‌های ردیابی‌شدهٔ Plugin در index مدیریت‌شدهٔ Plugin و نصب‌های ردیابی‌شدهٔ hook-pack در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="resolve کردن شناسهٔ Plugin در برابر مشخصهٔ npm">
    وقتی یک شناسهٔ Plugin ارسال می‌کنید، OpenClaw مشخصهٔ نصب ثبت‌شده برای آن Plugin را بازاستفاده می‌کند. یعنی dist-tagهای قبلاً ذخیره‌شده مانند `@beta` و نسخه‌های دقیق pinشده در اجرای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، همچنین می‌توانید یک مشخصهٔ صریح بستهٔ npm با dist-tag یا نسخهٔ دقیق ارسال کنید. OpenClaw آن نام بسته را به رکورد Plugin ردیابی‌شده resolve می‌کند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و مشخصهٔ جدید npm را برای به‌روزرسانی‌های آینده بر پایهٔ شناسه ثبت می‌کند.

    ارسال نام بستهٔ npm بدون نسخه یا برچسب نیز به رکورد Plugin ردیابی‌شده resolve می‌شود. وقتی یک Plugin به نسخه‌ای دقیق pin شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال beta">
    `openclaw plugins update` مشخصهٔ Plugin ردیابی‌شده را بازاستفاده می‌کند مگر اینکه مشخصهٔ جدیدی ارسال کنید. `openclaw update` علاوه بر آن کانال به‌روزرسانی فعال OpenClaw را می‌شناسد: در کانال beta، رکوردهای Plugin مربوط به npm و ClawHub در خط پیش‌فرض ابتدا `@beta` را امتحان می‌کنند، سپس اگر انتشار beta برای Plugin وجود نداشته باشد به مشخصهٔ پیش‌فرض/آخرین ثبت‌شده fallback می‌کنند. این fallback به‌عنوان هشدار گزارش می‌شود و باعث شکست به‌روزرسانی هسته نمی‌شود. نسخه‌های دقیق و برچسب‌های صریح به همان انتخابگر pin می‌مانند.

  </Accordion>
  <Accordion title="بررسی‌های نسخه و drift یکپارچگی">
    پیش از یک به‌روزرسانی زندهٔ npm، OpenClaw نسخهٔ بستهٔ نصب‌شده را با فرادادهٔ رجیستری npm بررسی می‌کند. اگر نسخهٔ نصب‌شده و هویت آرتیفکت ثبت‌شده از قبل با هدف resolveشده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash آرتیفکت fetchشده تغییر کند، OpenClaw با آن به‌عنوان drift آرتیفکت npm رفتار می‌کند. دستور تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی به‌صورت fail-closed شکست می‌خورند مگر اینکه caller یک سیاست ادامهٔ صریح فراهم کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install در به‌روزرسانی">
    `--dangerously-force-unsafe-install` همچنین در `plugins update` به‌عنوان override اضطراری برای false positiveهای scan کد خطرناک داخلی هنگام به‌روزرسانی Pluginها در دسترس است. این گزینه همچنان blockهای سیاست `before_install` مربوط به Plugin یا block ناشی از شکست scan را دور نمی‌زند، و فقط برای به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، پرچم‌های سیاست، diagnostics، فرادادهٔ نصب، قابلیت‌های بسته، و هرگونه پشتیبانی شناسایی‌شده از سرور MCP یا LSP را به‌صورت پیش‌فرض بدون import کردن زمان اجرای Plugin نشان می‌دهد. `--runtime` را اضافه کنید تا ماژول Plugin بارگذاری شود و hookها، ابزارها، commandها، سرویس‌ها، متدهای Gateway، و routeهای HTTP ثبت‌شده را شامل شود. inspection زمان اجرا وابستگی‌های گمشدهٔ Plugin را مستقیماً گزارش می‌کند؛ نصب‌ها و repairها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

commandهای CLI تحت مالکیت Plugin معمولاً به‌عنوان گروه‌های command ریشهٔ `openclaw` نصب می‌شوند، اما Pluginها ممکن است commandهای تودرتو را نیز زیر یک والد هسته مانند `openclaw nodes` ثبت کنند. پس از اینکه `inspect --runtime` یک command را زیر `cliCommands` نشان داد، آن را در مسیر فهرست‌شده اجرا کنید؛ برای مثال یک Plugin که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin بر اساس آنچه واقعاً در زمان اجرا ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (مثلاً یک Plugin که فقط ارائه‌دهنده است)
- **hybrid-capability** — چند نوع قابلیت (مثلاً متن + گفتار + تصویر)
- **hook-only** — فقط هوک‌ها، بدون قابلیت یا سطح
- **non-capability** — ابزارها/فرمان‌ها/سرویس‌ها اما بدون قابلیت

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل‌خواندن برای ماشین تولید می‌کند که برای اسکریپت‌نویسی و ممیزی مناسب است. `inspect --all` جدولی در سطح کل مجموعه با ستون‌های شکل، انواع قابلیت، اعلان‌های سازگاری، قابلیت‌های باندل، و خلاصه هوک‌ها نمایش می‌دهد. `info` نام مستعار `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، عیب‌یابی‌های manifest/discovery، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

اگر یک Plugin پیکربندی‌شده روی دیسک وجود داشته باشد اما توسط بررسی‌های ایمنی مسیرِ بارگذار مسدود شده باشد، اعتبارسنجی پیکربندی ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف پیکربندی `plugins.entries.<id>` یا `plugins.allow`، عیب‌یابی قبلی مربوط به Plugin مسدودشده، مانند مالکیت مسیر یا مجوزهای قابل‌نوشتن برای همه، را رفع کنید.

برای شکست‌های مربوط به شکل ماژول، مانند نبود exportهای `register`/`activate`، با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` دوباره اجرا کنید تا خلاصه‌ای فشرده از شکل exportها در خروجی عیب‌یابی گنجانده شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin، مدل خواندن سرد و پایدار OpenClaw برای هویت Plugin نصب‌شده، فعال‌بودن، فراداده منبع، و مالکیت مشارکت‌ها است. راه‌اندازی عادی، جست‌وجوی مالک ارائه‌دهنده، طبقه‌بندی راه‌اندازی کانال، و موجودی Plugin می‌توانند آن را بدون import کردن ماژول‌های runtime Plugin بخوانند.

از `plugins registry` برای بررسی اینکه رجیستری پایدار وجود دارد، به‌روز است، یا منسوخ شده استفاده کنید. از `--refresh` برای بازسازی آن از ایندکس پایدار Plugin، سیاست پیکربندی، و فراداده manifest/package استفاده کنید. این مسیر تعمیر است، نه مسیر فعال‌سازی runtime.

`openclaw doctor --fix` همچنین ناهماهنگی npm مدیریت‌شده در مجاورت رجیستری را تعمیر می‌کند: اگر یک بسته یتیم یا بازیابی‌شده `@openclaw/*` زیر ریشه npm مربوط به Plugin مدیریت‌شده، یک Plugin باندل‌شده را تحت‌الشعاع قرار دهد، doctor آن بسته منسوخ را حذف می‌کند و رجیستری را بازسازی می‌کند تا راه‌اندازی در برابر manifest باندل‌شده اعتبارسنجی شود. Doctor همچنین بسته میزبان `openclaw` را به Pluginهای npm مدیریت‌شده‌ای که `peerDependencies.openclaw` را اعلام می‌کنند، دوباره لینک می‌کند تا importهای runtime محلی بسته مانند `openclaw/plugin-sdk/*` پس از به‌روزرسانی‌ها یا تعمیرهای npm resolve شوند.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک سوییچ سازگاری منسوخِ اضطراری برای شکست‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback مبتنی بر env فقط برای بازیابی اضطراری راه‌اندازی هنگام عرضه مهاجرت است.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست Marketplace یک مسیر محلی Marketplace، مسیر `marketplace.json`، shorthand گیت‌هاب مانند `owner/repo`، URL مخزن گیت‌هاب، یا URL گیت را می‌پذیرد. `--json` برچسب منبع resolve‌شده را همراه با manifest تجزیه‌شده Marketplace و ورودی‌های Plugin چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [ClawHub](/fa/clawhub)

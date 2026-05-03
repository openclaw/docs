---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-03T21:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های hook و باندل‌های سازگار.

<CardGroup cols={2}>
  <Card title="سامانه Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی و عیب‌یابی Pluginها.
  </Card>
  <Card title="مدیریت Pluginها" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست‌کردن، به‌روزرسانی، حذف نصب و انتشار.
  </Card>
  <Card title="باندل‌های Plugin" href="/fa/plugins/bundles">
    مدل سازگاری باندل.
  </Card>
  <Card title="مانیفست Plugin" href="/fa/plugins/manifest">
    فیلدهای مانیفست و شِمای پیکربندی.
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

برای بررسی نصب، inspect، حذف نصب یا تازه‌سازی رجیستری که کند است، فرمان را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی فازها را در stderr می‌نویسد و خروجی JSON را قابل تجزیه نگه می‌دارد. [عیب‌یابی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
Pluginهای همراه با OpenClaw همراه محصول ارائه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه)؛ بقیه به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را همراه یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) ارائه کنند. باندل‌های سازگار به‌جای آن از مانیفست‌های باندل خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی مفصل list/info همچنین زیرنوع باندل (`codex`، `claude` یا `cursor`) به‌علاوه قابلیت‌های شناسایی‌شده باندل را نشان می‌دهد.
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
در دوره گذار راه‌اندازی، نام‌های ساده بسته به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Plugin را مانند اجرای کد در نظر بگیرید. نسخه‌های پین‌شده را ترجیح دهید.
</Warning>

`plugins search` برای بسته‌های Plugin قابل نصب، ClawHub را جست‌وجو می‌کند و نام بسته‌های آماده نصب را چاپ می‌کند. این فرمان بسته‌های code-plugin و bundle-plugin را جست‌وجو می‌کند، نه Skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. Npm همچنان یک مسیر fallback پشتیبانی‌شده و مسیر نصب مستقیم است. بسته‌های Plugin متعلق به OpenClaw با الگوی `@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا [فهرست موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند. نصب‌ها و به‌روزرسانی‌های کانال beta، وقتی npm dist-tag با نام `beta` در دسترس باشد آن را ترجیح می‌دهند و سپس به `latest` برمی‌گردند.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و تعمیر پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` تغییرات را در همان فایل includeشده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای ریشه، آرایه‌های include و includeهایی با overrideهای هم‌سطح، به‌جای تخت‌سازی با حالت fail closed متوقف می‌شوند. برای شکل‌های پشتیبانی‌شده [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولاً با حالت fail closed متوقف می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و بارگذاری مجدد داغ، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگری با حالت fail closed متوقف می‌شود؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر Plugin را قرنطینه کند. تنها استثنای مستند در زمان نصب، مسیر بازیابی محدودی برای Pluginهای همراه است که صراحتاً `openclaw.install.allowInvalidConfigRecovery` را فعال کرده‌اند.

  </Accordion>
  <Accordion title="--force و نصب مجدد در برابر به‌روزرسانی">
    `--force` هدف نصب موجود را دوباره استفاده می‌کند و Plugin یا بسته hook نصب‌شده قبلی را در همان‌جا بازنویسی می‌کند. وقتی عمداً همان شناسه را از یک مسیر محلی جدید، آرشیو، بسته ClawHub یا artifact مربوط به npm دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای معمول یک Plugin مربوط به npm که از قبل ردیابی شده است، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای شناسه Pluginای اجرا کنید که از قبل نصب شده است، OpenClaw متوقف می‌شود و برای ارتقای عادی شما را به `plugins update <id-or-npm-spec>`، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید به `plugins install <package> --force` ارجاع می‌دهد.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع پین‌شده می‌خواهید، از یک git ref صریح مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای npm spec فراداده منبع marketplace را نگه می‌دارند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` گزینه‌ای اضطراری برای مثبت‌های کاذب در اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه یابد، اما مسدودسازی‌های سیاست hook مربوط به `before_install` در Plugin را دور نمی‌زند و شکست‌های اسکن را نیز دور نمی‌زند.

    این پرچم CLI برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skill مبتنی بر Gateway از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب Skill از ClawHub است.

    اگر Pluginای که در ClawHub منتشر کرده‌اید توسط اسکن رجیستری مسدود شده است، از مراحل ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های hook و specهای npm">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای دیدپذیری فیلترشده hook و فعال‌سازی تک‌به‌تک hookها از `openclaw hooks` استفاده کنید، نه برای نصب بسته.

    specهای npm **فقط رجیستری** هستند (نام بسته + **نسخه دقیق** اختیاری یا **dist-tag** اختیاری). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های وابستگی برای ایمنی، حتی وقتی shell شما تنظیمات نصب سراسری npm دارد، به‌صورت project-local با `--ignore-scripts` اجرا می‌شوند.

    وقتی می‌خواهید حل‌وفصل npm را صریح کنید، از `npm:<package>` استفاده کنید. در دوره گذار راه‌اندازی، specهای ساده بسته نیز مستقیماً از npm نصب می‌شوند.

    specهای ساده و `@latest` روی مسیر پایدار می‌مانند. اگر npm هرکدام از آن‌ها را به یک prerelease حل کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک برچسب prerelease مانند `@beta`/`@rc` یا یک نسخه دقیق prerelease مانند `@1.2.3-beta.4` صریحاً opt in کنید.

    اگر یک spec نصب ساده با شناسه رسمی Plugin منطبق باشد (برای مثال `diffs`)، OpenClaw مستقیماً ورودی کاتالوگ را نصب می‌کند. برای نصب بسته npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    برای نصب مستقیم از یک مخزن git از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل URLهای clone با قالب‌های `git:github.com/owner/repo`، `git:owner/repo`، `https://` کامل، `ssh://`، `git://`، `file://` و `git@host:owner/repo.git` هستند. برای checkout کردن یک شاخه، tag یا commit پیش از نصب، `@<ref>` یا `#<ref>` را اضافه کنید.

    نصب‌های Git در یک پوشه موقت clone می‌شوند، در صورت وجود ref درخواستی آن را checkout می‌کنند، و سپس از نصب‌کننده عادی پوشه Plugin استفاده می‌کنند. یعنی اعتبارسنجی مانیفست، اسکن کد خطرناک، کار نصب package-manager و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit حل‌شده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    پس از نصب از git، برای تأیید ثبت‌های runtime مانند متدهای gateway و فرمان‌های CLI از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. اگر Plugin با `api.registerCli` یک ریشه CLI ثبت کرده باشد، آن فرمان را مستقیماً از طریق CLI ریشه OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="آرشیوها">
    آرشیوهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. آرشیوهای Plugin بومی OpenClaw باید در ریشه Plugin استخراج‌شده یک `openclaw.plugin.json` معتبر داشته باشند؛ آرشیوهایی که فقط `package.json` دارند پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

در دوره گذار راه‌اندازی، specهای Plugin ساده و امن برای npm به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح‌کردن حل‌وفصل فقط npm از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، API اعلام‌شده Plugin / حداقل سازگاری Gateway را بررسی می‌کند. وقتی نسخه انتخاب‌شده ClawHub یک artifact از نوع ClawPack منتشر کند، OpenClaw فایل `.tgz` نسخه‌دار npm-pack را دانلود می‌کند، header digest مربوط به ClawHub و artifact digest را تأیید می‌کند، سپس آن را از مسیر عادی آرشیو نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون فراداده ClawPack همچنان از مسیر قدیمی تأیید آرشیو بسته نصب می‌شوند. نصب‌های ثبت‌شده فراداده منبع ClawHub، نوع artifact، integrity مربوط به npm، shasum مربوط به npm، نام tarball و واقعیت‌های digest مربوط به ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های بدون نسخه ClawHub یک spec ثبت‌شده بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند نسخه‌های جدیدتر ClawHub را دنبال کند؛ انتخابگرهای نسخه یا tag صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` به همان انتخابگر پین‌شده باقی می‌مانند.

#### کوتاه‌نویسی Marketplace

وقتی نام marketplace در cache رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از کوتاه‌نویسی `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع marketplace را صریحاً پاس دهید، از `--marketplace` استفاده کنید:

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
    - یک URL git

  </Tab>
  <Tab title="قواعد marketplace راه‌دور">
    برای marketplaceهای راه‌دوری که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند. OpenClaw منابع مسیر نسبی را از آن مخزن می‌پذیرد و منابع HTTP(S)، مسیر مطلق، git، GitHub و دیگر منابع غیرمسیری Plugin را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشه معمول Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. امروز، Skills بسته، command-skillsهای Claude، پیش‌فرض‌های Claude `settings.json`، پیش‌فرض‌های Claude `.lsp.json` / `lspServers` اعلام‌شده در manifest، command-skillsهای Cursor، و دایرکتوری‌های hook سازگار Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگر بسته که شناسایی شوند در diagnostics/info نمایش داده می‌شوند اما هنوز به اجرای زمان اجرا متصل نشده‌اند.
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
  از نمای جدول به خط‌های جزئیات برای هر Plugin با metadata منبع/خاستگاه/نسخه/فعال‌سازی تغییر بده.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن برای ماشین همراه با diagnostics رجیستری و وضعیت نصب وابستگی بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی پایدارشده Plugin را می‌خواند، و اگر رجیستری وجود نداشته باشد یا نامعتبر باشد از یک fallback مشتق‌شده فقط از manifest استفاده می‌کند. این فرمان برای بررسی اینکه آیا یک Plugin نصب، فعال و برای برنامه‌ریزی شروع سرد قابل مشاهده است مفید است، اما probe زنده زمان اجرا برای یک فرایند Gateway ازپیش‌درحال‌اجرا نیست. پس از تغییر کد Plugin، فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار اجرای کد `register(api)` یا hookهای جدید، Gatewayای را که به کانال سرویس می‌دهد راه‌اندازی مجدد کنید. برای استقرارهای راه‌دور/کانتینری، بررسی کنید که فرزند واقعی `openclaw gateway run` را راه‌اندازی مجدد می‌کنید، نه فقط یک فرایند wrapper.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `package.json`
`dependencies` و `optionalDependencies` است. OpenClaw بررسی می‌کند که آیا نام‌های آن بسته‌ها در مسیر lookup معمول Node `node_modules` برای Plugin وجود دارند یا نه؛ کد زمان اجرای Plugin را import نمی‌کند، package manager اجرا نمی‌کند، و وابستگی‌های گمشده را repair نمی‌کند.
</Note>

`plugins search` یک lookup کاتالوگ راه‌دور ClawHub است. این فرمان وضعیت محلی را بازرسی نمی‌کند، config را تغییر نمی‌دهد، بسته‌ها را نصب نمی‌کند، یا کد زمان اجرای Plugin را بارگذاری نمی‌کند. نتایج جستجو شامل نام بسته ClawHub، خانواده، کانال، نسخه، خلاصه، و یک راهنمای نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Pluginهای بسته‌بندی‌شده داخل یک تصویر Docker بسته‌بندی‌شده، دایرکتوری منبع Plugin را روی مسیر منبع بسته‌بندی‌شده متناظر bind-mount کنید، مانند `/app/extensions/synology-chat`. OpenClaw آن overlay منبع mount‌شده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع صرفا کپی‌شده بی‌اثر می‌ماند تا نصب‌های بسته‌بندی‌شده معمول همچنان از dist کامپایل‌شده استفاده کنند.

برای عیب‌یابی hook زمان اجرا:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics را از یک pass بازرسی با module-loaded نشان می‌دهد. بازرسی زمان اجرا هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت وابستگی legacy یا نصب Pluginهای قابل‌دانلود پیکربندی‌شده گمشده از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل دسترس، راهنمایی‌های سرویس/فرایند، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای گفت‌وگوی غیر bundled (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی‌کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، زیرا نصب‌های linked به‌جای کپی‌کردن روی یک هدف نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کنند.

در نصب‌های npm از `--pin` استفاده کنید تا spec دقیق resolve‌شده (`name@version`) در اندیس Plugin مدیریت‌شده ذخیره شود و در عین حال رفتار پیش‌فرض unpinned باقی بماند.
</Note>

### اندیس Plugin

metadata نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. map سطح بالای `installRecords` منبع پایدار metadata نصب است، شامل رکوردهای manifestهای Plugin خراب یا گمشده. آرایه `plugins` کش رجیستری سرد مشتق‌شده از manifest است. این فایل شامل هشدار ویرایش‌نکنید است و توسط `openclaw plugins update`، حذف نصب، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای legacy ارسال‌شده `plugins.installs` را در config ببیند، آن‌ها را به اندیس Plugin منتقل می‌کند و کلید config را حذف می‌کند؛ اگر هرکدام از writeها شکست بخورد، رکوردهای config نگه داشته می‌شوند تا metadata نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، اندیس پایدارشده Plugin، ورودی‌های فهرست allow/deny برای Plugin، و ورودی‌های linked `plugins.load.paths` در صورت کاربرد حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شده track‌شده را وقتی داخل ریشه extensions Pluginهای OpenClaw باشد حذف می‌کند. برای Pluginهای active memory، slot حافظه به `memory-core` بازنشانی می‌شود.

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

به‌روزرسانی‌ها روی نصب‌های Plugin track‌شده در اندیس Plugin مدیریت‌شده و نصب‌های hook-pack track‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="Resolve کردن شناسه Plugin در برابر spec npm">
    وقتی یک شناسه Plugin پاس می‌دهید، OpenClaw از spec نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شده قبلی مانند `@beta` و نسخه‌های دقیق pinned همچنان در اجراهای بعدی `update <id>` استفاده می‌شوند.

    برای نصب‌های npm، همچنین می‌توانید یک spec صریح بسته npm با dist-tag یا نسخه دقیق پاس دهید. OpenClaw آن نام بسته را به رکورد Plugin track‌شده برمی‌گرداند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های مبتنی بر شناسه در آینده ثبت می‌کند.

    پاس‌دادن نام بسته npm بدون نسخه یا tag نیز به رکورد Plugin track‌شده برمی‌گردد. وقتی یک Plugin به یک نسخه دقیق pinned شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال beta">
    `openclaw plugins update` از spec Plugin track‌شده دوباره استفاده می‌کند مگر اینکه spec جدیدی پاس دهید. `openclaw update` علاوه بر این کانال فعال به‌روزرسانی OpenClaw را می‌شناسد: در کانال beta، رکوردهای Plugin خط پیش‌فرض npm و ClawHub ابتدا `@beta` را امتحان می‌کنند، سپس اگر انتشار beta برای Plugin وجود نداشته باشد به spec پیش‌فرض/latest ثبت‌شده fallback می‌کنند. نسخه‌های دقیق و tagهای صریح روی همان selector pinned می‌مانند.

  </Accordion>
  <Accordion title="بررسی‌های نسخه و drift یکپارچگی">
    پیش از به‌روزرسانی زنده npm، OpenClaw نسخه بسته نصب‌شده را با metadata رجیستری npm بررسی می‌کند. اگر نسخه نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف resolve‌شده تطبیق داشته باشند، به‌روزرسانی بدون دانلود، نصب مجدد، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی یک hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact دریافت‌شده تغییر کند، OpenClaw آن را drift artifact npm تلقی می‌کند. فرمان تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی به‌صورت fail closed عمل می‌کنند مگر اینکه caller یک سیاست ادامه صریح ارائه کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install در update">
    `--dangerously-force-unsafe-install` همچنین در `plugins update` به‌عنوان override اضطراری برای مثبت‌های کاذب اسکن dangerous-code داخلی هنگام به‌روزرسانی Pluginها در دسترس است. این گزینه همچنان blockهای سیاست `before_install` Plugin یا blocking ناشی از شکست اسکن را دور نمی‌زند، و فقط روی به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، flagهای سیاست، diagnostics، metadata نصب، قابلیت‌های بسته، و هر پشتیبانی شناسایی‌شده MCP یا سرور LSP را بدون import کردن پیش‌فرض زمان اجرای Plugin نشان می‌دهد. برای بارگذاری ماژول Plugin و شامل‌کردن hookها، tools، commands، services، متدهای gateway، و routeهای HTTP ثبت‌شده، `--runtime` را اضافه کنید. بازرسی زمان اجرا وابستگی‌های گمشده Plugin را مستقیما گزارش می‌کند؛ نصب‌ها و repairها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI متعلق به Plugin به‌عنوان گروه‌های فرمان ریشه `openclaw` نصب می‌شوند. پس از اینکه `inspect --runtime` یک فرمان را زیر `cliCommands` نشان داد، آن را به‌شکل `openclaw <command> ...` اجرا کنید؛ برای مثال Pluginای که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin بر اساس چیزی که واقعا در زمان اجرا ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (برای مثال یک Plugin فقط provider)
- **hybrid-capability** — چند نوع قابلیت (برای مثال متن + گفتار + تصویر)
- **hook-only** — فقط hookها، بدون قابلیت یا surface
- **non-capability** — tools/commands/services اما بدون قابلیت

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
flag `--json` گزارشی قابل‌خواندن برای ماشین تولید می‌کند که برای اسکریپت‌نویسی و auditing مناسب است. `inspect --all` یک جدول سراسری با ستون‌های shape، نوع‌های قابلیت، اعلان‌های سازگاری، قابلیت‌های بسته، و خلاصه hook رندر می‌کند. `info` نام مستعار `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، diagnostics مربوط به manifest/discovery، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

اگر یک Plugin پیکربندی‌شده روی دیسک حاضر باشد اما توسط بررسی‌های path-safety لودر blocked شده باشد، اعتبارسنجی config ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف config مربوط به `plugins.entries.<id>` یا `plugins.allow`، diagnostic قبلی Plugin blocked را رفع کنید، مانند مالکیت مسیر یا مجوزهای world-writable.

برای شکست‌های شکل ماژول مانند exportهای گمشده `register`/`activate`، با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` دوباره اجرا کنید تا خلاصه فشرده‌ای از export-shape در خروجی diagnostic گنجانده شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin مدل خواندن سرد پایدارشده OpenClaw برای هویت Plugin نصب‌شده، فعال‌سازی، metadata منبع، و مالکیت contribution است. شروع معمول، lookup مالک provider، طبقه‌بندی راه‌اندازی کانال، و موجودی Plugin می‌توانند بدون import کردن ماژول‌های زمان اجرای Plugin آن را بخوانند.

از `plugins registry` برای بررسی اینکه رجیستری پایدارشده موجود، به‌روز یا قدیمی است استفاده کنید. از `--refresh` برای بازسازی آن از نمایهٔ Plugin پایدارشده، سیاست پیکربندی، و فرادادهٔ manifest/package استفاده کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی در زمان اجرا.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک سوییچ سازگاری منسوخ‌شدهٔ اضطراری برای خطاهای خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback محیطی فقط برای بازیابی اضطراری راه‌اندازی هنگام عرضهٔ مهاجرت است.
</Warning>

### بازارچه

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست بازارچه یک مسیر بازارچهٔ محلی، یک مسیر `marketplace.json`، یک اختصار GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL گیت را می‌پذیرد. `--json` برچسب منبع حل‌شده را به‌همراه manifest بازارچهٔ تجزیه‌شده و ورودی‌های Plugin چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

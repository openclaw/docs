---
read_when:
    - می‌خواهید Plugin‌های Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Pluginها
x-i18n:
    generated_at: "2026-05-04T07:03:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36ae7edb12986ead7e126f25e0761bf312b2644b35017181b674082105886776
    source_path: cli/plugins.md
    workflow: 16
---

Pluginهای Gateway، بسته‌های hook و bundleهای سازگار را مدیریت کنید.

<CardGroup cols={2}>
  <Card title="سامانه Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی و عیب‌یابی Pluginها.
  </Card>
  <Card title="مدیریت Pluginها" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست‌کردن، به‌روزرسانی، حذف نصب و انتشار.
  </Card>
  <Card title="bundleهای Plugin" href="/fa/plugins/bundles">
    مدل سازگاری bundle.
  </Card>
  <Card title="مانیفست Plugin" href="/fa/plugins/manifest">
    فیلدهای مانیفست و شِمای پیکربندی.
  </Card>
  <Card title="امنیت" href="/fa/gateway/security">
    مقاوم‌سازی امنیتی برای نصب Pluginها.
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

برای بررسی نصب، inspect، حذف نصب یا تازه‌سازی registry که کند است، فرمان را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی فازها را در stderr می‌نویسد و خروجی JSON را قابل parse نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
Pluginهای bundled همراه OpenClaw ارائه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال providerهای مدل bundled، providerهای گفتار bundled و Plugin مرورگر bundled)؛ بقیه به `plugins enable` نیاز دارند.

Pluginهای native OpenClaw باید `openclaw.plugin.json` را با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) ارائه کنند. bundleهای سازگار به‌جای آن از مانیفست‌های bundle خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی verbose فهرست/اطلاعات همچنین زیرگونه bundle (`codex`، `claude` یا `cursor`) به‌همراه قابلیت‌های bundle شناسایی‌شده را نشان می‌دهد.
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
نام‌های ساده package در دوره جابه‌جایی launch به‌صورت پیش‌فرض از npm نصب می‌شوند. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Plugin را مثل اجرای کد در نظر بگیرید. نسخه‌های pinned را ترجیح دهید.
</Warning>

`plugins search` برای packageهای Plugin قابل نصب از ClawHub پرس‌وجو می‌کند و نام‌های package آماده نصب را چاپ می‌کند. این فرمان packageهای code-plugin و bundle-plugin را جست‌وجو می‌کند، نه skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. npm همچنان یک fallback پشتیبانی‌شده و مسیر نصب مستقیم باقی می‌ماند. packageهای Plugin متعلق به OpenClaw با الگوی `@openclaw/*` دوباره روی npm منتشر می‌شوند؛ فهرست فعلی را در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا [موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های پایدار از `latest` استفاده می‌کنند. نصب‌ها و به‌روزرسانی‌های کانال beta وقتی tag در دسترس باشد، dist-tag مربوط به `beta` در npm را ترجیح می‌دهند و سپس به `latest` fallback می‌کنند.
</Note>

<AccordionGroup>
  <Accordion title="Config includes و ترمیم پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` در همان فایل includeشده می‌نویسد و `openclaw.json` را دست‌نخورده باقی می‌گذارد. includeهای ریشه، آرایه‌های include و includeهایی با overrideهای هم‌سطح به‌جای flatten شدن، fail closed می‌شوند. برای شکل‌های پشتیبانی‌شده، [Config includes](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولاً fail closed می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway و hot reload، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگر fail closed می‌شود؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر Plugin را قرنطینه کند. تنها استثنای مستندشده در زمان نصب، یک مسیر بازیابی محدود برای Pluginهای bundled است که صراحتاً `openclaw.install.allowInvalidConfigRecovery` را opt in می‌کنند.

  </Accordion>
  <Accordion title="--force و نصب مجدد در برابر به‌روزرسانی">
    `--force` از مقصد نصب موجود دوباره استفاده می‌کند و یک Plugin یا hook pack ازپیش‌نصب‌شده را درجا بازنویسی می‌کند. وقتی عمداً همان id را از یک مسیر محلی جدید، archive، package از ClawHub یا artifact از npm دوباره نصب می‌کنید از آن استفاده کنید. برای ارتقاهای معمول یک Plugin از npm که از قبل دنبال می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id یک Plugin که از قبل نصب شده اجرا کنید، OpenClaw متوقف می‌شود و برای ارتقای معمول شما را به `plugins update <id-or-npm-spec>` ارجاع می‌دهد، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید، به `plugins install <package> --force` ارجاع می‌دهد.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pinned می‌خواهید، از یک git ref صریح مثل `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec از npm، metadata منبع marketplace را پایدار می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` یک گزینه break-glass برای مثبت‌های کاذب در اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه پیدا کند، اما blockهای policy مربوط به hook `before_install` در Plugin را دور نمی‌زند و خطاهای scan را هم دور نمی‌زند.

    این پرچم CLI برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skills که از Gateway پشتیبانی می‌شوند از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب Skills از ClawHub باقی می‌ماند.

    اگر Pluginی که روی ClawHub منتشر کرده‌اید با scan registry مسدود شده است، از گام‌های ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="Hook packها و specهای npm">
    `plugins install` همچنین سطح نصب برای hook packهایی است که `openclaw.hooks` را در `package.json` عرضه می‌کنند. برای دید محدودشده hook و فعال‌سازی هر hook از `openclaw hooks` استفاده کنید، نه برای نصب package.

    specهای npm **فقط registry** هستند (نام package + **نسخه دقیق** اختیاری یا **dist-tag** اختیاری). specهای Git/URL/file و rangeهای semver رد می‌شوند. نصب‌های dependency برای ایمنی، حتی وقتی shell شما تنظیمات global نصب npm دارد، به‌صورت project-local با `--ignore-scripts` اجرا می‌شوند.

    وقتی می‌خواهید resolution مربوط به npm را صریح کنید، از `npm:<package>` استفاده کنید. specهای ساده package نیز در دوره جابه‌جایی launch مستقیماً از npm نصب می‌شوند.

    specهای ساده و `@latest` روی track پایدار باقی می‌مانند. نسخه‌های اصلاحی date-stamped مربوط به OpenClaw مانند `2026.5.3-1` برای این check، releaseهای پایدار هستند. اگر npm هرکدام از این‌ها را به prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک tag prerelease مانند `@beta`/`@rc` یا یک نسخه دقیق prerelease مانند `@1.2.3-beta.4` صریحاً opt in کنید.

    اگر یک spec نصب ساده با id رسمی Plugin مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی catalog را مستقیماً نصب می‌کند. برای نصب یک package از npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مخازن Git">
    برای نصب مستقیم از یک مخزن git از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل URLهای clone با الگوهای `git:github.com/owner/repo`، `git:owner/repo`، `https://` کامل، `ssh://`، `git://`، `file://` و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag یا commit پیش از نصب، `@<ref>` یا `#<ref>` اضافه کنید.

    نصب‌های Git در یک دایرکتوری موقت clone می‌شوند، اگر ref درخواست‌شده وجود داشته باشد آن را checkout می‌کنند و سپس از نصب‌کننده عادی دایرکتوری Plugin استفاده می‌کنند. یعنی اعتبارسنجی manifest، اسکن کد خطرناک، کار نصب package-manager و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit resolveشده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    پس از نصب از git، از `openclaw plugins inspect <id> --runtime --json` برای تأیید registrationهای runtime مانند methodهای gateway و فرمان‌های CLI استفاده کنید. اگر Plugin با `api.registerCli` یک root مربوط به CLI ثبت کرده باشد، آن فرمان را مستقیماً از طریق CLI ریشه OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiveها">
    Archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. Archiveهای Plugin native OpenClaw باید در ریشه Plugin استخراج‌شده یک `openclaw.plugin.json` معتبر داشته باشند؛ archiveهایی که فقط شامل `package.json` هستند پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از یک locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

specهای ساده Plugin که برای npm امن هستند، در دوره جابه‌جایی launch به‌صورت پیش‌فرض از npm نصب می‌شوند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح‌کردن resolution فقط از npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw سازگاری API تبلیغ‌شده Plugin / حداقل Gateway را پیش از نصب بررسی می‌کند. وقتی نسخه انتخاب‌شده ClawHub یک artifact از ClawPack منتشر می‌کند، OpenClaw فایل `.tgz` مربوط به npm-pack نسخه‌گذاری‌شده را دانلود می‌کند، header digest مربوط به ClawHub و digest artifact را تأیید می‌کند، سپس آن را از مسیر عادی archive نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون metadata مربوط به ClawPack همچنان از مسیر قدیمی اعتبارسنجی archive مربوط به package نصب می‌شوند. نصب‌های ثبت‌شده metadata منبع ClawHub، نوع artifact، integrity مربوط به npm، shasum مربوط به npm، نام tarball و واقعیت‌های digest مربوط به ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های ClawHub بدون نسخه، spec ثبت‌شده بدون نسخه را نگه می‌دارند تا `openclaw plugins update` بتواند releaseهای جدیدتر ClawHub را دنبال کند؛ selectorهای نسخه یا tag صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` به همان selector pinned باقی می‌مانند.

#### کوتاه‌نویسی Marketplace

وقتی نام marketplace در cache محلی registry مربوط به Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از کوتاه‌نویسی `plugin@marketplace` استفاده کنید:

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
  <Tab title="منابع بازار">
    - یک نام بازار شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`
    - یک ریشه بازار محلی یا مسیر `marketplace.json`
    - یک کوتاه‌نویسی مخزن GitHub مانند `owner/repo`
    - یک URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL git

  </Tab>
  <Tab title="قواعد بازار راه‌دور">
    برای بازارهای راه‌دوری که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن بازار کلون‌شده بمانند. OpenClaw منابع مسیر نسبی را از همان مخزن می‌پذیرد و منابع HTTP(S)، مسیر مطلق، git، GitHub، و دیگر منابع غیرمسیر Plugin را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw به‌طور خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه‌های Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشه معمول Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. امروز، Skills بسته، command-skills مربوط به Claude، پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های `.lsp.json` مربوط به Claude / `lspServers` اعلام‌شده در manifest، command-skills مربوط به Cursor، و دایرکتوری‌های hook سازگار Codex پشتیبانی می‌شوند؛ قابلیت‌های بسته دیگری که تشخیص داده شوند در diagnostics/info نمایش داده می‌شوند، اما هنوز به اجرای زمان اجرا متصل نشده‌اند.
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
  از نمای جدول به خط‌های جزئیات برای هر Plugin با فراداده منبع/مبدأ/نسخه/فعال‌سازی تغییر بده.
</ParamField>
<ParamField path="--json" type="boolean">
  فهرست موجودی قابل خواندن برای ماشین، به‌همراه diagnostics رجیستری و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی ماندگارشده Plugin را می‌خواند، و وقتی رجیستری وجود نداشته باشد یا نامعتبر باشد از جایگزین مشتق‌شده فقط از manifest استفاده می‌کند. این دستور برای بررسی اینکه آیا یک Plugin نصب شده، فعال است، و برای برنامه‌ریزی راه‌اندازی سرد قابل مشاهده است مفید است، اما یک کاوش زنده زمان اجرا از فرایند Gateway در حال اجرا نیست. پس از تغییر کد Plugin، فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار برای اجرای کد `register(api)` یا hookهای جدید، Gatewayای را که به کانال سرویس می‌دهد راه‌اندازی مجدد کنید. برای استقرارهای راه‌دور/کانتینری، مطمئن شوید فرزند واقعی `openclaw gateway run` را راه‌اندازی مجدد می‌کنید، نه فقط یک فرایند wrapper.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `dependencies` و `optionalDependencies` در `package.json` است. OpenClaw بررسی می‌کند که آیا نام‌های آن بسته‌ها در مسیر معمول جست‌وجوی Node `node_modules` مربوط به Plugin وجود دارند؛ کد زمان اجرای Plugin را import نمی‌کند، package manager اجرا نمی‌کند، و وابستگی‌های گم‌شده را تعمیر نمی‌کند.
</Note>

`plugins search` یک جست‌وجوی کاتالوگ راه‌دور ClawHub است. این دستور وضعیت محلی را بازرسی نمی‌کند، config را تغییر نمی‌دهد، بسته‌ها را نصب نمی‌کند، و کد زمان اجرای Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو شامل نام بسته ClawHub، خانواده، کانال، نسخه، خلاصه، و یک راهنمای نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Pluginهای بسته‌بندی‌شده داخل یک تصویر Docker بسته‌بندی‌شده، دایرکتوری منبع Plugin را روی مسیر منبع بسته‌بندی‌شده متناظر bind-mount کنید، مانند `/app/extensions/synology-chat`. OpenClaw آن overlay منبع mount‌شده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع که صرفاً کپی شده باشد بی‌اثر می‌ماند تا نصب‌های بسته‌بندی‌شده معمول همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hookهای زمان اجرا:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics را از یک گذر بازرسی با ماژول بارگذاری‌شده نشان می‌دهد. بازرسی زمان اجرا هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت وابستگی قدیمی یا نصب Pluginهای قابل دانلودِ پیکربندی‌شده و گم‌شده از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل دسترسی، اشاره‌های سرویس/فرایند، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای گفت‌وگوی غیرهمراه (`llm_input`، `llm_output`، `before_agent_finalize`، `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های linked به‌جای کپی کردن روی هدف نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کنند.

در نصب‌های npm از `--pin` استفاده کنید تا spec دقیق resolve‌شده (`name@version`) در نمایه Plugin مدیریت‌شده ذخیره شود، در حالی که رفتار پیش‌فرض بدون pin باقی بماند.
</Note>

### نمایه Plugin

فراداده نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. نگاشت سطح‌بالای `installRecords` منبع ماندگار فراداده نصب است، از جمله recordهای مربوط به manifestهای خراب یا گم‌شده Plugin. آرایه `plugins` کش رجیستری سرد مشتق‌شده از manifest است. فایل شامل هشدار ویرایش‌نکنید است و توسط `openclaw plugins update`، uninstall، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw recordهای قدیمی ارسال‌شده `plugins.installs` را در config ببیند، آن‌ها را به نمایه Plugin منتقل می‌کند و کلید config را حذف می‌کند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، recordهای config حفظ می‌شوند تا فراداده نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` recordهای Plugin را از `plugins.entries`، نمایه ماندگار Plugin، ورودی‌های فهرست allow/deny مربوط به Plugin، و در صورت کاربرد ورودی‌های linked `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، uninstall همچنین دایرکتوری نصب مدیریت‌شده ردیابی‌شده را وقتی داخل ریشه افزونه‌های Plugin OpenClaw باشد حذف می‌کند. برای Pluginهای حافظه فعال، slot حافظه به `memory-core` بازنشانی می‌شود.

<Note>
`--keep-config` به‌عنوان نام مستعار منسوخ‌شده برای `--keep-files` پشتیبانی می‌شود.
</Note>

### به‌روزرسانی

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

به‌روزرسانی‌ها روی نصب‌های Plugin ردیابی‌شده در نمایه Plugin مدیریت‌شده و نصب‌های hook-pack ردیابی‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="حل‌کردن id Plugin در برابر spec npm">
    وقتی یک id مربوط به Plugin را می‌دهید، OpenClaw از spec نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شده قبلی مانند `@beta` و نسخه‌های دقیق pinشده در اجرای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، می‌توانید یک spec صریح بسته npm با dist-tag یا نسخه دقیق هم بدهید. OpenClaw آن نام بسته را به record ردیابی‌شده Plugin برمی‌گرداند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های آینده مبتنی بر id ثبت می‌کند.

    دادن نام بسته npm بدون نسخه یا tag نیز به record ردیابی‌شده Plugin برمی‌گردد. وقتی Plugin به یک نسخه دقیق pin شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="به‌روزرسانی‌های کانال بتا">
    `openclaw plugins update` از spec ردیابی‌شده Plugin دوباره استفاده می‌کند، مگر اینکه spec جدیدی بدهید. `openclaw update` علاوه بر این کانال به‌روزرسانی فعال OpenClaw را می‌شناسد: در کانال بتا، recordهای Plugin مربوط به npm و ClawHub در خط پیش‌فرض ابتدا `@beta` را امتحان می‌کنند، سپس اگر انتشار بتای Plugin وجود نداشته باشد به spec پیش‌فرض/latest ثبت‌شده برمی‌گردند. نسخه‌های دقیق و tagهای صریح روی همان selector pin می‌مانند.

  </Accordion>
  <Accordion title="بررسی‌های نسخه و drift یکپارچگی">
    پیش از یک به‌روزرسانی زنده npm، OpenClaw نسخه بسته نصب‌شده را در برابر فراداده رجیستری npm بررسی می‌کند. اگر نسخه نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف resolve‌شده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب مجدد، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی یک hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact دریافت‌شده تغییر کند، OpenClaw آن را drift در artifact npm تلقی می‌کند. دستور تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی fail closed می‌شوند، مگر اینکه فراخوان یک سیاست ادامه صریح ارائه کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install در update">
    `--dangerously-force-unsafe-install` روی `plugins update` نیز به‌عنوان override اضطراری برای false positiveهای اسکن داخلی کد خطرناک هنگام به‌روزرسانی Plugin در دسترس است. این گزینه همچنان blockهای سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند، و فقط برای به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، پرچم‌های سیاست، diagnostics، فراداده نصب، قابلیت‌های بسته، و هر پشتیبانی تشخیص‌داده‌شده از سرور MCP یا LSP را بدون import کردن زمان اجرای Plugin به‌صورت پیش‌فرض نشان می‌دهد. برای بارگذاری ماژول Plugin و شامل‌کردن hookها، tools، commands، services، methodهای gateway، و routeهای HTTP ثبت‌شده، `--runtime` را اضافه کنید. بازرسی زمان اجرا وابستگی‌های گم‌شده Plugin را مستقیماً گزارش می‌کند؛ نصب‌ها و تعمیرها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

دستورهای CLI متعلق به Plugin به‌عنوان گروه‌های دستور ریشه `openclaw` نصب می‌شوند. پس از اینکه `inspect --runtime` یک دستور را زیر `cliCommands` نشان داد، آن را به‌صورت `openclaw <command> ...` اجرا کنید؛ برای نمونه، Pluginای که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin بر اساس آنچه واقعاً در زمان اجرا ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (مثلاً یک Plugin فقط provider)
- **hybrid-capability** — چند نوع قابلیت (مثلاً متن + گفتار + تصاویر)
- **hook-only** — فقط hookها، بدون قابلیت یا surface
- **non-capability** — tools/commands/services اما بدون قابلیت

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل خواندن برای ماشین تولید می‌کند که برای اسکریپت‌نویسی و حسابرسی مناسب است. `inspect --all` یک جدول در سطح کل مجموعه با ستون‌های شکل، گونه‌های قابلیت، اعلان‌های سازگاری، قابلیت‌های بسته، و خلاصه hook نمایش می‌دهد. `info` نام مستعار `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، diagnostics مربوط به manifest/discovery، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

اگر یک Plugin پیکربندی‌شده روی دیسک وجود داشته باشد اما توسط بررسی‌های path-safety loader مسدود شود، اعتبارسنجی config ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف config مربوط به `plugins.entries.<id>` یا `plugins.allow`، diagnostic قبلی Plugin مسدودشده، مانند مالکیت مسیر یا مجوزهای world-writable را اصلاح کنید.

برای شکست‌های شکل ماژول مانند exportهای گم‌شده `register`/`activate`، با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` دوباره اجرا کنید تا یک خلاصه فشرده از شکل exportها در خروجی diagnostic گنجانده شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin مدل خواندن سرد ماندگار OpenClaw برای هویت Plugin نصب‌شده، فعال‌سازی، فراداده منبع، و مالکیت مشارکت است. راه‌اندازی معمول، جست‌وجوی مالک provider، طبقه‌بندی راه‌اندازی کانال، و موجودی Plugin می‌توانند بدون import کردن ماژول‌های زمان اجرای Plugin آن را بخوانند.

از `plugins registry` استفاده کنید تا بررسی کنید آیا رجیستری پایدارشده وجود دارد، به‌روز است، یا کهنه شده است. از `--refresh` استفاده کنید تا آن را از شاخص Plugin پایدارشده، سیاست پیکربندی، و فراداده‌های manifest/package بازسازی کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی در زمان اجرا.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک کلید سازگاری اضطراری منسوخ برای خرابی‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ جایگزین env فقط برای بازیابی اضطراری شروع به کار در زمانی است که مهاجرت در حال انتشار است.
</Warning>

### بازارچه

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست بازارچه یک مسیر بازارچه محلی، یک مسیر `marketplace.json`، یک خلاصه‌نویسی GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git را می‌پذیرد. `--json` برچسب منبع حل‌شده را همراه با manifest بازارچه تجزیه‌شده و ورودی‌های Plugin چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

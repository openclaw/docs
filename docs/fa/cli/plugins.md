---
read_when:
    - می‌خواهید Plugin‌های Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خرابی‌های بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Pluginها
x-i18n:
    generated_at: "2026-05-01T11:44:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7aebe4ee647d7821b881cdb9d5af01d70508c38b36462ff7b57fb44769dc2f
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های hook، و بسته‌های سازگار.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی، و عیب‌یابی Pluginها.
  </Card>
  <Card title="Plugin bundles" href="/fa/plugins/bundles">
    مدل سازگاری بسته.
  </Card>
  <Card title="Plugin manifest" href="/fa/plugins/manifest">
    فیلدهای مانیفست و شمای پیکربندی.
  </Card>
  <Card title="Security" href="/fa/gateway/security">
    سخت‌سازی امنیتی برای نصب Plugin.
  </Card>
</CardGroup>

## دستورها

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
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
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

برای بررسی نصب، بازرسی، حذف نصب، یا تازه‌سازی registry که کند است، دستور را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. ردگیری، زمان‌بندی فازها را در stderr می‌نویسد و خروجی JSON را قابل parse نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
Pluginهای همراه، همراه OpenClaw عرضه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه)؛ بقیه به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. بسته‌های سازگار به‌جای آن از مانیفست‌های بسته خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی مفصل list/info همچنین زیرنوع بسته (`codex`، `claude`، یا `cursor`) به‌همراه قابلیت‌های شناسایی‌شده بسته را نشان می‌دهد.
</Note>

### نصب

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
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
نام‌های بسته بدون پیشوند ابتدا در ClawHub و سپس در npm بررسی می‌شوند. نصب Pluginها را مانند اجرای کد در نظر بگیرید. نسخه‌های pin‌شده را ترجیح دهید.
</Warning>

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. Npm همچنان یک مسیر fallback و نصب مستقیم پشتیبانی‌شده است. در طول مهاجرت به ClawHub، OpenClaw هنوز برخی بسته‌های Plugin متعلق به OpenClaw با نام `@openclaw/*` را روی npm عرضه می‌کند؛ نسخه‌های آن بسته‌ها ممکن است بین چرخه‌های انتشار Plugin از منبع همراه عقب بمانند. اگر npm یک بسته Plugin متعلق به OpenClaw را deprecated گزارش کند، آن نسخه منتشرشده یک artifact خارجی قدیمی است؛ تا زمانی که بسته npm جدیدتری منتشر شود، از Plugin همراه OpenClaw فعلی یا یک checkout محلی استفاده کنید.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config recovery">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` تغییرات را در همان فایل include‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای ریشه، آرایه‌های include، و includeهایی با overrideهای هم‌سطح به‌جای flatten شدن، fail closed می‌شوند. برای شکل‌های پشتیبانی‌شده، [Config includes](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولاً fail closed می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway، پیکربندی نامعتبر برای یک Plugin به همان Plugin محدود می‌شود تا کانال‌ها و Pluginهای دیگر بتوانند به کار ادامه دهند؛ `openclaw doctor --fix` می‌تواند ورودی Plugin نامعتبر را قرنطینه کند. تنها استثنای مستند در زمان نصب، یک مسیر بازیابی محدود برای Plugin همراه است که صراحتاً در `openclaw.install.allowInvalidConfigRecovery` opt in کرده باشد.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` هدف نصب موجود را دوباره استفاده می‌کند و یک Plugin یا بسته hook ازپیش‌نصب‌شده را در همان محل بازنویسی می‌کند. وقتی عمداً همان id را از یک مسیر محلی جدید، archive، بسته ClawHub، یا artifact npm دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل tracked است، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id یک Plugin که از قبل نصب شده اجرا کنید، OpenClaw متوقف می‌شود و برای ارتقای عادی شما را به `plugins update <id-or-npm-spec>`، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید به `plugins install <package> --force` راهنمایی می‌کند.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pin‌شده می‌خواهید، از یک git ref صریح مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای یک npm spec، metadata منبع marketplace را پایدار می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` گزینه‌ای break-glass برای false positiveها در اسکنر کد خطرناک داخلی است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه پیدا کند، اما بلوک‌های سیاست hook مربوط به `before_install` در Plugin را bypass نمی‌کند و failureهای scan را نیز bypass نمی‌کند.

    این flag مربوط به CLI روی جریان‌های install/update Plugin اعمال می‌شود. نصب وابستگی‌های skill مبتنی بر Gateway از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کند، در حالی که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب skill از ClawHub باقی می‌ماند.

    اگر Pluginی که روی ClawHub منتشر کرده‌اید توسط registry scan مسدود شده است، از مراحل publisher در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` expose می‌کنند. برای دیدپذیری فیلترشده hook و فعال‌سازی هر hook، از `openclaw hooks` استفاده کنید، نه نصب بسته.

    specهای npm **فقط registry** هستند (نام بسته + **نسخه دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب وابستگی‌ها برای ایمنی به‌صورت project-local و با `--ignore-scripts` اجرا می‌شود، حتی وقتی shell شما تنظیمات نصب npm سراسری دارد.

    وقتی می‌خواهید lookup در ClawHub را رد کنید و مستقیم از npm نصب کنید، از `npm:<package>` استفاده کنید. specهای بسته بدون پیشوند هنوز ClawHub را ترجیح می‌دهند و فقط وقتی ClawHub آن بسته یا نسخه را ندارد به npm fallback می‌کنند.

    specهای بدون پیشوند و `@latest` روی مسیر stable می‌مانند. اگر npm هرکدام از آن‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد صراحتاً با یک tag prerelease مانند `@beta`/`@rc` یا یک نسخه prerelease دقیق مانند `@1.2.3-beta.4` opt in کنید.

    اگر یک spec نصب بدون پیشوند با id یک Plugin همراه مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw مستقیماً Plugin همراه را نصب می‌کند. برای نصب یک بسته npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    برای نصب مستقیم از یک repository git، از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل URLهای clone به‌شکل `git:github.com/owner/repo`، `git:owner/repo`، کامل `https://`، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` اضافه کنید.

    نصب‌های Git در یک directory موقت clone می‌شوند، در صورت وجود ref درخواست‌شده را checkout می‌کنند، سپس از installer عادی directory مربوط به Plugin استفاده می‌کنند. یعنی اعتبارسنجی مانیفست، اسکن کد خطرناک، staging وابستگی runtime، و recordهای نصب مانند نصب‌های local-path رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit resolve‌شده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    پس از نصب از git، برای تأیید registrationهای runtime مانند methodهای gateway و دستورهای CLI از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. اگر Plugin یک ریشه CLI با `api.registerCli` ثبت کرده، آن دستور را مستقیماً از طریق CLI ریشه OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. archiveهای Plugin بومی OpenClaw باید در ریشه Plugin استخراج‌شده یک `openclaw.plugin.json` معتبر داشته باشند؛ archiveهایی که فقط `package.json` دارند پیش از اینکه OpenClaw recordهای نصب را بنویسد رد می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw اکنون برای specهای Plugin امن برای npm و بدون پیشوند نیز ClawHub را ترجیح می‌دهد. تنها اگر ClawHub آن بسته یا نسخه را نداشته باشد به npm fallback می‌کند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای تحمیل resolution فقط از npm، مثلاً وقتی ClawHub در دسترس نیست یا می‌دانید بسته فقط روی npm وجود دارد، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw archive بسته را از ClawHub دانلود می‌کند، سازگاری advertised plugin API / حداقل Gateway را بررسی می‌کند، سپس آن را از مسیر archive عادی نصب می‌کند. نصب‌های ثبت‌شده metadata منبع ClawHub خود را برای updateهای بعدی نگه می‌دارند.
نصب‌های ClawHub بدون نسخه یک spec ثبت‌شده بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند releaseهای جدیدتر ClawHub را دنبال کند؛ selectorهای نسخه یا tag صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان selector pin می‌مانند.

#### خلاصه‌نویسی marketplace

وقتی نام marketplace در cache registry محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از shorthand `plugin@marketplace` استفاده کنید:

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
  <Tab title="Marketplace sources">
    - یک نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشه marketplace محلی یا مسیر `marketplace.json`
    - shorthand یک repo در GitHub مانند `owner/repo`
    - URL یک repo در GitHub مانند `https://github.com/owner/repo`
    - یک URL مربوط به git

  </Tab>
  <Tab title="Remote marketplace rules">
    برای marketplaceهای remote که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل repository clone‌شده marketplace باقی بمانند. OpenClaw منابع path نسبی از همان repo را می‌پذیرد و منابع Plugin از نوع HTTP(S)، absolute-path، git، GitHub، و دیگر منابع غیر-path را از مانیفست‌های remote رد می‌کند.
  </Tab>
</Tabs>

برای مسیرهای محلی و archiveها، OpenClaw به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه‌های Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشهٔ عادی Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. در حال حاضر، Skillsهای بسته، command-skillهای Claude، پیش‌فرض‌های Claude `settings.json`، پیش‌فرض‌های Claude `.lsp.json` / `lspServers` اعلام‌شده در مانیفست، command-skillهای Cursor، و دایرکتوری‌های hook سازگار با Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگر بسته که شناسایی شوند در diagnostics/info نمایش داده می‌شوند اما هنوز به اجرای زمان اجرا متصل نشده‌اند.
</Note>

### فهرست

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  فقط Pluginهای فعال را نشان می‌دهد.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خط‌های جزئیات برای هر Plugin با فرادادهٔ منبع/خاستگاه/نسخه/فعال‌سازی تغییر می‌کند.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن برای ماشین به‌همراه diagnostics رجیستری.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری Plugin محلی پایدارشده را می‌خواند، و وقتی رجیستری وجود نداشته باشد یا نامعتبر باشد از جایگزین مشتق‌شده فقط از مانیفست استفاده می‌کند. این دستور برای بررسی اینکه آیا یک Plugin نصب، فعال، و برای برنامه‌ریزی شروع سرد قابل‌مشاهده است مفید است، اما کاوش زندهٔ زمان اجرا از یک فرایند Gateway از قبل در حال اجرا نیست. پس از تغییر کد Plugin، وضعیت فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار برای اجرای کد جدید `register(api)` یا hookها، Gateway سرویس‌دهندهٔ کانال را راه‌اندازی مجدد کنید. برای استقرارهای راه‌دور/کانتینری، مطمئن شوید فرزند واقعی `openclaw gateway run` را راه‌اندازی مجدد می‌کنید، نه فقط یک فرایند wrapper.
</Note>

برای کار روی Plugin بسته‌بندی‌شده داخل یک تصویر Docker بسته‌بندی‌شده، دایرکتوری
منبع Plugin را روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mount کنید، مانند
`/app/extensions/synology-chat`. OpenClaw آن هم‌پوشانی منبع mount‌شده را پیش از
`/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع که صرفاً کپی
شده باشد بی‌اثر می‌ماند، بنابراین نصب‌های بسته‌بندی‌شدهٔ عادی همچنان از dist کامپایل‌شده استفاده می‌کنند.

برای عیب‌یابی hook زمان اجرا:

- `openclaw plugins inspect <id> --runtime --json` هوک‌های ثبت‌شده و diagnostics حاصل از یک گذر بازرسی با ماژول بارگذاری‌شده را نشان می‌دهد. بازرسی زمان اجرا هرگز وابستگی‌های زمان اجرای بسته‌ایِ مفقود را دانلود نمی‌کند؛ وقتی تعمیر لازم است از `openclaw plugins deps --repair` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل‌دسترسی، راهنمایی‌های سرویس/فرایند، مسیر پیکربندی، و سلامت RPC را تأیید می‌کند.
- هوک‌های مکالمهٔ غیربسته‌ای (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، زیرا نصب‌های لینک‌شده به‌جای کپی کردن روی هدف نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کنند.

در نصب‌های npm از `--pin` استفاده کنید تا spec دقیق resolve‌شده (`name@version`) در شاخص Plugin مدیریت‌شده ذخیره شود، در حالی که رفتار پیش‌فرض بدون pin باقی می‌ماند.
</Note>

### شاخص Plugin

فرادادهٔ نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه پیکربندی کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. نگاشت سطح‌بالای `installRecords` منبع پایدار فرادادهٔ نصب است، از جمله رکوردهای مانیفست‌های خراب یا مفقود Plugin. آرایهٔ `plugins` کش رجیستری سرد مشتق‌شده از مانیفست است. این فایل شامل هشدار ویرایش‌نکنید است و توسط `openclaw plugins update`، حذف نصب، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای قدیمی ارسال‌شدهٔ `plugins.installs` را در پیکربندی ببیند، آن‌ها را به شاخص Plugin منتقل می‌کند و کلید پیکربندی را حذف می‌کند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، رکوردهای پیکربندی نگه داشته می‌شوند تا فرادادهٔ نصب از دست نرود.

### وابستگی‌های زمان اجرا

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` مرحلهٔ وابستگی زمان اجرای بسته‌بندی‌شده را برای Pluginهای بسته‌ای متعلق به OpenClaw که توسط پیکربندی Plugin، کانال‌های فعال/پیکربندی‌شده، ارائه‌دهندگان مدل پیکربندی‌شده، یا پیش‌فرض‌های مانیفست بسته‌ای انتخاب شده‌اند بررسی می‌کند. این مسیر نصب/به‌روزرسانی برای Pluginهای شخص ثالث npm یا ClawHub نیست.

وقتی یک نصب بسته‌بندی‌شده در زمان شروع Gateway یا `plugins doctor` وابستگی‌های زمان اجرای بسته‌ای مفقود را گزارش می‌کند، از `--repair` استفاده کنید. تعمیر فقط وابستگی‌های مفقود Pluginهای بسته‌ای فعال را با اسکریپت‌های چرخهٔ عمر غیرفعال نصب می‌کند. برای حذف ریشه‌های وابستگی زمان اجرای خارجی ناشناختهٔ مانده از چیدمان‌های بسته‌بندی‌شدهٔ قدیمی، از `--prune` استفاده کنید.

برای طرح کامل، آماده‌سازی، و چرخهٔ عمر تعمیر، [تفکیک وابستگی Plugin](/fa/plugins/dependency-resolution) را ببینید.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، شاخص Plugin پایدارشده، ورودی‌های فهرست مجاز/ممنوع Plugin، و در صورت کاربرد ورودی‌های لینک‌شدهٔ `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب دایرکتوری نصب مدیریت‌شدهٔ ردیابی‌شده را نیز وقتی داخل ریشهٔ extensions مربوط به Pluginهای OpenClaw باشد حذف می‌کند. برای Pluginهای active memory، اسلات حافظه به `memory-core` بازنشانی می‌شود.

<Note>
`--keep-config` به‌عنوان نام مستعار منسوخ‌شده برای `--keep-files` پشتیبانی می‌شود.
</Note>

### به‌روزرسانی

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

به‌روزرسانی‌ها روی نصب‌های Plugin ردیابی‌شده در شاخص Plugin مدیریت‌شده و نصب‌های hook-pack ردیابی‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="رفع تفاوت شناسه Plugin و مشخصه npm">
    وقتی یک شناسه Plugin را می‌دهید، OpenClaw از مشخصه نصب ثبت‌شده برای همان Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شده قبلی مانند `@beta` و نسخه‌های دقیق پین‌شده، در اجراهای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، می‌توانید یک مشخصه صریح بسته npm با dist-tag یا نسخه دقیق هم بدهید. OpenClaw نام آن بسته را دوباره به رکورد Plugin پیگیری‌شده نگاشت می‌کند، همان Plugin نصب‌شده را به‌روزرسانی می‌کند، و مشخصه npm جدید را برای به‌روزرسانی‌های مبتنی بر شناسه در آینده ثبت می‌کند.

    دادن نام بسته npm بدون نسخه یا برچسب هم دوباره به رکورد Plugin پیگیری‌شده نگاشت می‌شود. وقتی یک Plugin به نسخه‌ای دقیق پین شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این روش استفاده کنید.

  </Accordion>
  <Accordion title="بررسی‌های نسخه و انحراف یکپارچگی">
    پیش از به‌روزرسانی زنده npm، OpenClaw نسخه بسته نصب‌شده را با فراداده رجیستری npm بررسی می‌کند. اگر نسخه نصب‌شده و هویت مصنوع ثبت‌شده از قبل با هدف حل‌شده برابر باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی هش یکپارچگی ذخیره‌شده وجود داشته باشد و هش مصنوع دریافت‌شده تغییر کند، OpenClaw آن را به‌عنوان انحراف مصنوع npm در نظر می‌گیرد. دستور تعاملی `openclaw plugins update` هش‌های مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه، تأیید می‌خواهد. کمک‌کننده‌های به‌روزرسانی غیرتعاملی به‌صورت بسته شکست می‌خورند، مگر اینکه فراخواننده سیاست ادامه صریحی ارائه کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install هنگام به‌روزرسانی">
    `--dangerously-force-unsafe-install` روی `plugins update` هم به‌عنوان یک بازنویسی اضطراری برای مثبت‌های کاذب اسکن کد خطرناک داخلی هنگام به‌روزرسانی‌های Plugin در دسترس است. این گزینه همچنان بلوک‌های سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند، و فقط برای به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

بازرسی، هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، پرچم‌های سیاست، عیب‌یابی‌ها، فراداده نصب، قابلیت‌های بسته، و هرگونه پشتیبانی شناسایی‌شده از سرور MCP یا LSP را بدون وارد کردن runtime مربوط به Plugin به‌صورت پیش‌فرض نشان می‌دهد. برای بارگذاری ماژول Plugin و شامل کردن hookها، ابزارها، فرمان‌ها، سرویس‌ها، متدهای Gateway، و مسیرهای HTTP ثبت‌شده، `--runtime` را اضافه کنید. وقتی وابستگی‌های runtime بسته‌بندی‌شده وجود نداشته باشند، بازرسی runtime با یک راهنمای تعمیر شکست می‌خورد؛ برای تعمیر صریح آن‌ها از `openclaw plugins deps --repair` استفاده کنید.

فرمان‌های CLI مالک‌شده توسط Plugin به‌عنوان گروه‌های فرمان ریشه `openclaw` نصب می‌شوند. پس از اینکه `inspect --runtime` یک فرمان را زیر `cliCommands` نشان داد، آن را به‌شکل `openclaw <command> ...` اجرا کنید؛ برای مثال، Pluginای که `demo-git` را ثبت می‌کند را می‌توان با `openclaw demo-git ping` راستی‌آزمایی کرد.

هر Plugin بر اساس آنچه واقعاً در runtime ثبت می‌کند دسته‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت، مثلاً یک Plugin فقط مخصوص provider
- **hybrid-capability** — چند نوع قابلیت، مثلاً متن + گفتار + تصویر
- **hook-only** — فقط hookها، بدون قابلیت‌ها یا سطح‌ها
- **non-capability** — ابزارها/فرمان‌ها/سرویس‌ها اما بدون قابلیت‌ها

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل‌خواندن برای ماشین تولید می‌کند که برای اسکریپت‌نویسی و حسابرسی مناسب است. `inspect --all` یک جدول سراسری از کل ناوگان با ستون‌های شکل، انواع قابلیت، اعلان‌های سازگاری، قابلیت‌های بسته، و خلاصه hook نمایش می‌دهد. `info` نام مستعار `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، عیب‌یابی‌های manifest/کشف، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

برای شکست‌های شکل ماژول، مانند نبود خروجی‌های `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا یک خلاصه فشرده از شکل خروجی‌ها در خروجی عیب‌یابی گنجانده شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin، مدل خواندن سرد و پایدارشده OpenClaw برای هویت Plugin نصب‌شده، فعال‌سازی، فراداده منبع، و مالکیت مشارکت‌ها است. راه‌اندازی عادی، جست‌وجوی مالک provider، دسته‌بندی راه‌اندازی کانال، و موجودی Plugin می‌توانند آن را بدون وارد کردن ماژول‌های runtime مربوط به Plugin بخوانند.

برای بررسی اینکه رجیستری پایدارشده وجود دارد، به‌روز است، یا قدیمی شده، از `plugins registry` استفاده کنید. برای بازسازی آن از نمایه پایدارشده Plugin، سیاست پیکربندی، و فراداده manifest/package، از `--refresh` استفاده کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک کلید سازگاری اضطراری منسوخ برای شکست‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback محیطی فقط برای بازیابی اضطراری راه‌اندازی هنگام عرضه مهاجرت است.
</Warning>

### بازارچه

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست بازارچه یک مسیر محلی بازارچه، یک مسیر `marketplace.json`، یک کوتاه‌نویسی GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git را می‌پذیرد. `--json` برچسب منبع حل‌شده به‌همراه manifest بازارچه تحلیل‌شده و ورودی‌های Plugin را چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

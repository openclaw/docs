---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خرابی‌های بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، deps، doctor)
title: Plugin‌ها
x-i18n:
    generated_at: "2026-04-30T00:06:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c1ba79bccbbb74e3403188afc2dffc06e4215d433e2b23ed998b1fb09419601b
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های هوک، و بسته‌های سازگار.

<CardGroup cols={2}>
  <Card title="سیستم Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی، و عیب‌یابی Pluginها.
  </Card>
  <Card title="بسته‌های Plugin" href="/fa/plugins/bundles">
    مدل سازگاری بسته.
  </Card>
  <Card title="manifest Plugin" href="/fa/plugins/manifest">
    فیلدهای manifest و schema پیکربندی.
  </Card>
  <Card title="امنیت" href="/fa/gateway/security">
    سخت‌سازی امنیتی برای نصب Pluginها.
  </Card>
</CardGroup>

## دستورات

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
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

برای بررسی نصب، بازبینی، حذف نصب، یا تازه‌سازی رجیستری که کند است، دستور را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی فازها را در stderr می‌نویسد و خروجی JSON را قابل parse نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
Pluginهای همراه با OpenClaw همراه OpenClaw عرضه می‌شوند. بعضی به‌صورت پیش‌فرض فعال هستند (برای مثال providerهای مدل همراه، providerهای گفتار همراه، و Plugin مرورگر همراه)؛ بقیه به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. بسته‌های سازگار به‌جای آن از manifestهای بسته خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی verbose list/info همچنین subtype بسته (`codex`، `claude`، یا `cursor`) به‌همراه قابلیت‌های شناسایی‌شده بسته را نشان می‌دهد.
</Note>

### نصب

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
نام‌های bare package ابتدا در ClawHub و سپس در npm بررسی می‌شوند. نصب Pluginها را مانند اجرای کد در نظر بگیرید. نسخه‌های pin‌شده را ترجیح دهید.
</Warning>

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. npm همچنان یک مسیر fallback و نصب مستقیم پشتیبانی‌شده باقی می‌ماند. در طول مهاجرت به ClawHub، OpenClaw هنوز بعضی بسته‌های Plugin متعلق به OpenClaw با نام `@openclaw/*` را در npm عرضه می‌کند؛ نسخه‌های آن بسته‌ها ممکن است بین قطارهای انتشار Plugin از source همراه عقب بمانند. اگر npm یک بسته Plugin متعلق به OpenClaw را deprecated گزارش کند، آن نسخه منتشرشده یک artifact خارجی قدیمی است؛ تا زمانی که بسته npm جدیدتری منتشر شود، از Plugin همراه OpenClaw فعلی یا یک checkout محلی استفاده کنید.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و بازیابی پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` در همان فایل include‌شده می‌نویسند و `openclaw.json` را دست‌نخورده می‌گذارند. includeهای root، آرایه‌های include، و includeهایی با overrideهای sibling به‌جای flatten شدن به‌صورت fail closed متوقف می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر هنگام نصب، پیکربندی نامعتبر باشد، `plugins install` معمولاً به‌صورت fail closed متوقف می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway، پیکربندی نامعتبر برای یک Plugin فقط به همان Plugin محدود می‌شود تا کانال‌ها و Pluginهای دیگر بتوانند به اجرا ادامه دهند؛ `openclaw doctor --fix` می‌تواند ورودی Plugin نامعتبر را قرنطینه کند. تنها استثنای مستند در زمان نصب، یک مسیر بازیابی محدود برای Pluginهای همراه است که صراحتاً `openclaw.install.allowInvalidConfigRecovery` را فعال کرده‌اند.

  </Accordion>
  <Accordion title="--force و نصب دوباره در برابر update">
    `--force` از target نصب موجود دوباره استفاده می‌کند و یک Plugin یا بسته هوک از قبل نصب‌شده را در همان محل overwrite می‌کند. وقتی عمداً همان id را از یک مسیر محلی جدید، archive، بسته ClawHub، یا artifact npm دوباره نصب می‌کنید از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل track شده، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای id یک Plugin که از قبل نصب شده اجرا کنید، OpenClaw متوقف می‌شود و برای یک ارتقای معمول شما را به `plugins update <id-or-npm-spec>` راهنمایی می‌کند، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت overwrite کنید، به `plugins install <package> --force` ارجاع می‌دهد.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط روی نصب‌های npm اعمال می‌شود. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec npm، metadata منبع marketplace را نگه می‌دارند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` گزینه‌ای اضطراری برای false positiveها در اسکنر کد خطرناک داخلی است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه پیدا کند، اما blockهای policy هوک `before_install` Plugin را bypass نمی‌کند و failureهای scan را نیز bypass نمی‌کند.

    این flag در CLI روی flowهای install/update Plugin اعمال می‌شود. نصب dependencyهای skill مبتنی بر Gateway از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کند، در حالی که `openclaw skills install` همچنان یک flow جداگانه download/install skill از ClawHub است.

    اگر Pluginی که در ClawHub منتشر کرده‌اید با یک اسکن رجیستری block شده، از مراحل ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های هوک و specهای npm">
    `plugins install` همچنین سطح نصب برای بسته‌های هوکی است که `openclaw.hooks` را در `package.json` expose می‌کنند. برای visibility فیلترشده هوک و فعال‌سازی هر هوک از `openclaw hooks` استفاده کنید، نه برای نصب package.

    specهای npm **فقط رجیستری** هستند (نام package + **نسخه دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب dependencyها برای ایمنی به‌صورت project-local و با `--ignore-scripts` اجرا می‌شود، حتی وقتی shell شما تنظیمات نصب npm global دارد.

    وقتی می‌خواهید lookup در ClawHub را رد کنید و مستقیماً از npm نصب کنید، از `npm:<package>` استفاده کنید. specهای bare package همچنان ClawHub را ترجیح می‌دهند و فقط وقتی ClawHub آن package یا نسخه را نداشته باشد به npm fallback می‌کنند.

    specهای bare و `@latest` روی track پایدار می‌مانند. اگر npm هرکدام از آن‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد صراحتاً با یک tag prerelease مانند `@beta`/`@rc` یا یک نسخه prerelease دقیق مانند `@1.2.3-beta.4` opt in کنید.

    اگر یک spec نصب bare با id یک Plugin همراه match شود (برای مثال `diffs`)، OpenClaw مستقیماً Plugin همراه را نصب می‌کند. برای نصب یک package npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="Archiveها">
    archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. archiveهای Plugin بومی OpenClaw باید در root استخراج‌شده Plugin یک `openclaw.plugin.json` معتبر داشته باشند؛ archiveهایی که فقط `package.json` دارند پیش از اینکه OpenClaw recordهای نصب را بنویسد رد می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw اکنون برای specهای Plugin امن برای npm و bare نیز ClawHub را ترجیح می‌دهد. فقط زمانی به npm fallback می‌کند که ClawHub آن package یا نسخه را نداشته باشد:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای اجبار به resolution فقط از npm، مثلاً وقتی ClawHub در دسترس نیست یا می‌دانید package فقط در npm وجود دارد، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw archive package را از ClawHub download می‌کند، سازگاری plugin API / حداقل gateway اعلام‌شده را بررسی می‌کند، سپس آن را از مسیر archive معمول نصب می‌کند. نصب‌های ثبت‌شده metadata منبع ClawHub خود را برای updateهای بعدی نگه می‌دارند.
نصب‌های ClawHub بدون نسخه، spec ثبت‌شده بدون نسخه را نگه می‌دارند تا `openclaw plugins update` بتواند releaseهای جدیدتر ClawHub را دنبال کند؛ selectorهای نسخه یا tag صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان selector pin می‌مانند.

#### shorthand مربوط به marketplace

وقتی نام marketplace در cache رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از shorthand به‌شکل `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع marketplace را صریحاً pass کنید از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="منابع marketplace">
    - یک نام known-marketplace مربوط به Claude از `~/.claude/plugins/known_marketplaces.json`
    - یک root محلی marketplace یا مسیر `marketplace.json`
    - shorthand مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL git

  </Tab>
  <Tab title="قواعد marketplace راه‌دور">
    برای marketplaceهای راه‌دور که از GitHub یا git load می‌شوند، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند. OpenClaw منابع relative path را از همان مخزن می‌پذیرد و منابع Plugin از نوع HTTP(S)، absolute-path، git، GitHub، و دیگر منابع غیر-path را از manifestهای راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرهای محلی و archiveها، OpenClaw به‌صورت خودکار شناسایی می‌کند:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا layout پیش‌فرض componentهای Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در root معمول Plugin نصب می‌شوند و در همان flow list/info/enable/disable شرکت می‌کنند. امروز، bundle skills، command-skills مربوط به Claude، defaultهای `settings.json` در Claude، defaultهای Claude `.lsp.json` / `lspServers` اعلام‌شده در manifest، command-skills مربوط به Cursor، و دایرکتوری‌های hook سازگار با Codex پشتیبانی می‌شوند؛ قابلیت‌های bundle شناسایی‌شده دیگر در diagnostics/info نشان داده می‌شوند اما هنوز به اجرای runtime وصل نشده‌اند.
</Note>

### فهرست

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  فقط Pluginهای فعال را نشان بده.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خطوط جزئیات هر Plugin با metadata مربوط به source/origin/version/activation تغییر دهید.
</ParamField>
<ParamField path="--json" type="boolean">
  inventory قابل خواندن برای ماشین به‌همراه diagnostics رجیستری.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی پایدارشدهٔ Plugin را می‌خواند، و وقتی رجیستری وجود نداشته باشد یا نامعتبر باشد از جایگزین مشتق‌شدهٔ صرفاً مبتنی بر manifest استفاده می‌کند. این دستور برای بررسی این‌که آیا یک Plugin نصب، فعال، و برای برنامه‌ریزی راه‌اندازی سرد قابل مشاهده است مفید است، اما یک بررسی زندهٔ runtime از فرایند Gateway از قبل در حال اجرا نیست. پس از تغییر کد Plugin، فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار برای اجرای کد `register(api)` یا hookهای جدید، Gatewayای را که channel را سرو می‌کند دوباره راه‌اندازی کنید. برای استقرارهای remote/container، مطمئن شوید فرزند واقعی `openclaw gateway run` را دوباره راه‌اندازی می‌کنید، نه فقط یک فرایند wrapper را.
</Note>

برای کار روی Pluginهای bundled داخل یک تصویر Docker بسته‌بندی‌شده، دایرکتوری source مربوط به Plugin را
روی مسیر source بسته‌بندی‌شدهٔ متناظر bind-mount کنید، مانند
`/app/extensions/synology-chat`. OpenClaw آن overlay از source نصب‌شده را
پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری source
که صرفاً کپی شده باشد غیرفعال می‌ماند تا نصب‌های بسته‌بندی‌شدهٔ معمول همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hookهای runtime:

- `openclaw plugins inspect <id> --json` hookهای ثبت‌شده و diagnostics حاصل از یک گذر inspection با module-loaded را نشان می‌دهد.
- `openclaw gateway status --deep --require-rpc` Gateway قابل دسترس، راهنماهای service/process، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای conversation غیر-bundled (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی‌کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های linked به‌جای کپی‌کردن روی یک هدف نصب managed، از مسیر source دوباره استفاده می‌کنند.

برای نصب‌های npm از `--pin` استفاده کنید تا spec دقیق resolve‌شده (`name@version`) در فهرست managed Plugin ذخیره شود، در حالی که رفتار پیش‌فرض بدون pin باقی می‌ماند.
</Note>

### فهرست Plugin

فرادادهٔ نصب Plugin وضعیتی مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری state فعال OpenClaw می‌نویسند. map سطح بالای `installRecords` منبع پایدار فرادادهٔ نصب است، شامل recordهای مربوط به manifestهای خراب یا گم‌شدهٔ Plugin. آرایهٔ `plugins` کش رجیستری سرد مشتق‌شده از manifest است. فایل شامل هشدار ویرایش‌نکردن است و توسط `openclaw plugins update`، uninstall، diagnostics، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای legacy ارسال‌شدهٔ `plugins.installs` را در config ببیند، آن‌ها را به فهرست Plugin منتقل می‌کند و کلید config را حذف می‌کند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، recordهای config نگه داشته می‌شوند تا فرادادهٔ نصب از دست نرود.

### وابستگی‌های runtime

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` مرحلهٔ وابستگی runtime بسته‌بندی‌شده را برای Pluginهای bundled متعلق به OpenClaw بررسی می‌کند. این مسیر نصب/به‌روزرسانی برای Pluginهای npm شخص ثالث یا ClawHub نیست.

وقتی یک نصب بسته‌بندی‌شده هنگام راه‌اندازی Gateway یا `plugins doctor` وابستگی‌های runtime bundled گم‌شده را گزارش می‌کند، از `--repair` استفاده کنید. repair فقط وابستگی‌های گم‌شدهٔ Pluginهای bundled فعال را با lifecycle scriptهای غیرفعال نصب می‌کند. برای حذف ریشه‌های وابستگی runtime خارجی ناشناخته و قدیمی که از layoutهای بسته‌بندی‌شدهٔ قدیمی باقی مانده‌اند، از `--prune` استفاده کنید.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` recordهای Plugin را از `plugins.entries`، فهرست پایدارشدهٔ Plugin، entryهای فهرست allow/deny برای Plugin، و در صورت کاربرد، entryهای linked در `plugins.load.paths` حذف می‌کند. مگر این‌که `--keep-files` تنظیم شده باشد، uninstall دایرکتوری نصب managed رهگیری‌شده را نیز وقتی داخل ریشهٔ extensions مربوط به Pluginهای OpenClaw باشد حذف می‌کند. برای Pluginهای active memory، slot حافظه به `memory-core` بازنشانی می‌شود.

<Note>
`--keep-config` به‌عنوان alias منسوخ‌شده برای `--keep-files` پشتیبانی می‌شود.
</Note>

### به‌روزرسانی

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

به‌روزرسانی‌ها روی نصب‌های Plugin رهگیری‌شده در فهرست managed Plugin و نصب‌های hook-pack رهگیری‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    وقتی یک id مربوط به Plugin را ارسال می‌کنید، OpenClaw از spec نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شدهٔ قبلی مانند `@beta` و نسخه‌های دقیق pin‌شده در اجرای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، همچنین می‌توانید یک spec صریح بستهٔ npm با dist-tag یا نسخهٔ دقیق ارسال کنید. OpenClaw آن نام بسته را به record رهگیری‌شدهٔ Plugin resolve می‌کند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های آیندهٔ مبتنی بر id ثبت می‌کند.

    ارسال نام بستهٔ npm بدون نسخه یا tag نیز به record رهگیری‌شدهٔ Plugin resolve می‌شود. وقتی یک Plugin به نسخه‌ای دقیق pin شده و می‌خواهید آن را دوباره به خط انتشار پیش‌فرض رجیستری برگردانید، از این روش استفاده کنید.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    پیش از به‌روزرسانی زندهٔ npm، OpenClaw نسخهٔ بستهٔ نصب‌شده را با فرادادهٔ رجیستری npm بررسی می‌کند. اگر نسخهٔ نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف resolve‌شده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب مجدد، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی hash ذخیره‌شدهٔ integrity وجود داشته باشد و hash artifact دریافت‌شده تغییر کند، OpenClaw آن را drift در artifact npm تلقی می‌کند. فرمان تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی به‌صورت fail closed عمل می‌کنند، مگر این‌که فراخواننده یک سیاست ادامهٔ صریح فراهم کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` روی `plugins update` نیز به‌عنوان override اضطراری برای false positiveهای اسکن built-in dangerous-code هنگام به‌روزرسانی Pluginها در دسترس است. این گزینه همچنان blockهای سیاست `before_install` مربوط به Plugin یا blocking ناشی از scan-failure را دور نمی‌زند، و فقط برای به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بررسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

درون‌نگری عمیق برای یک Plugin واحد. identity، وضعیت load، source، capabilityهای ثبت‌شده، hookها، tools، commands، services، methodهای gateway، routeهای HTTP، flagهای policy، diagnostics، فرادادهٔ نصب، capabilityهای bundle، و هرگونه پشتیبانی شناسایی‌شدهٔ MCP یا LSP server را نشان می‌دهد.

هر Plugin بر اساس چیزی که واقعاً در runtime ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع capability (برای مثال یک Plugin فقط-provider)
- **hybrid-capability** — چند نوع capability (برای مثال text + speech + images)
- **hook-only** — فقط hookها، بدون capability یا surface
- **non-capability** — tools/commands/services اما بدون capability

برای اطلاعات بیشتر دربارهٔ مدل capability، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
flag `--json` گزارشی machine-readable مناسب برای scriptنویسی و audit خروجی می‌دهد. `inspect --all` جدولی fleet-wide با ستون‌های shape، گونه‌های capability، noticeهای compatibility، capabilityهای bundle، و خلاصهٔ hook رندر می‌کند. `info` یک alias برای `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای load مربوط به Plugin، diagnostics مربوط به manifest/discovery، و noticeهای compatibility را گزارش می‌کند. وقتی همه‌چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

برای شکست‌های module-shape مانند exportهای گم‌شدهٔ `register`/`activate`، با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` دوباره اجرا کنید تا یک خلاصهٔ compact از export-shape در خروجی diagnostic درج شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin، مدل خواندن سرد پایدارشدهٔ OpenClaw برای identity، فعال‌سازی، فرادادهٔ source، و مالکیت contribution مربوط به Pluginهای نصب‌شده است. راه‌اندازی معمول، lookup مالک provider، طبقه‌بندی setup مربوط به channel، و inventory مربوط به Plugin می‌توانند بدون import کردن moduleهای runtime مربوط به Plugin آن را بخوانند.

از `plugins registry` برای بررسی این‌که آیا رجیستری پایدارشده حاضر، جاری، یا stale است استفاده کنید. از `--refresh` برای بازسازی آن از فهرست پایدارشدهٔ Plugin، سیاست config، و فرادادهٔ manifest/package استفاده کنید. این یک مسیر repair است، نه مسیر activation مربوط به runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک switch سازگاری اضطراری منسوخ‌شده برای شکست‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback مبتنی بر env فقط برای بازیابی راه‌اندازی اضطراری هنگام rollout مهاجرت است.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست Marketplace یک مسیر marketplace محلی، مسیر `marketplace.json`، shorthand گیت‌هاب مانند `owner/repo`، URL مخزن گیت‌هاب، یا URL مربوط به git را می‌پذیرد. `--json` برچسب source resolve‌شده به‌همراه manifest تجزیه‌شدهٔ marketplace و entryهای Plugin را چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

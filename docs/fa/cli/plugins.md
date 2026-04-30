---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Pluginها
x-i18n:
    generated_at: "2026-04-30T09:34:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Plugin‌های Gateway، بسته‌های hook و باندل‌های سازگار را مدیریت کنید.

<CardGroup cols={2}>
  <Card title="سامانه Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی و عیب‌یابی Plugin‌ها.
  </Card>
  <Card title="باندل‌های Plugin" href="/fa/plugins/bundles">
    مدل سازگاری باندل.
  </Card>
  <Card title="مانیفست Plugin" href="/fa/plugins/manifest">
    فیلدهای مانیفست و شِمای پیکربندی.
  </Card>
  <Card title="امنیت" href="/fa/gateway/security">
    سخت‌سازی امنیتی برای نصب‌های Plugin.
  </Card>
</CardGroup>

## فرمان‌ها

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

برای بررسی نصب، بازرسی، حذف نصب یا نوسازی رجیستری که کند است، فرمان را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. ردگیری، زمان‌بندی فازها را در stderr می‌نویسد و خروجی JSON را قابل تجزیه نگه می‌دارد. [عیب‌یابی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
Plugin‌های همراه، با OpenClaw عرضه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه و Plugin مرورگر همراه)؛ برخی دیگر به `plugins enable` نیاز دارند.

Plugin‌های بومی OpenClaw باید `openclaw.plugin.json` را با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. باندل‌های سازگار به‌جای آن از مانیفست‌های باندل خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی فهرست/اطلاعات در حالت مفصل، زیرنوع باندل (`codex`، `claude` یا `cursor`) به‌علاوه قابلیت‌های باندل شناسایی‌شده را نیز نشان می‌دهد.
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
نام‌های خام بسته ابتدا در ClawHub و سپس در npm بررسی می‌شوند. نصب Plugin را مانند اجرای کد در نظر بگیرید. نسخه‌های سنجاق‌شده را ترجیح دهید.
</Warning>

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Plugin‌ها است. Npm همچنان به‌عنوان مسیر پشتیبان و نصب مستقیم پشتیبانی می‌شود. در طول مهاجرت به ClawHub، OpenClaw هنوز برخی بسته‌های Plugin متعلق به OpenClaw با نام `@openclaw/*` را در npm عرضه می‌کند؛ نسخه‌های آن بسته‌ها می‌توانند بین قطارهای انتشار Plugin از سورس همراه عقب بمانند. اگر npm یک بسته Plugin متعلق به OpenClaw را منسوخ گزارش کند، آن نسخه منتشرشده یک آرتیفکت خارجی قدیمی است؛ تا زمانی که بسته npm جدیدتری منتشر شود، از Plugin همراه با OpenClaw فعلی یا یک checkout محلی استفاده کنید.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و بازیابی پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` در همان فایل include‌شده می‌نویسد و `openclaw.json` را دست‌نخورده باقی می‌گذارد. includeهای ریشه، آرایه‌های include و includeهایی با بازنویسی‌های هم‌سطح به‌جای تخت‌سازی، به‌صورت بسته شکست می‌خورند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولاً به‌صورت بسته شکست می‌خورد و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway، پیکربندی نامعتبر برای یک Plugin به همان Plugin محدود می‌شود تا کانال‌ها و Plugin‌های دیگر بتوانند به اجرا ادامه دهند؛ `openclaw doctor --fix` می‌تواند ورودی Plugin نامعتبر را قرنطینه کند. تنها استثنای مستندشده در زمان نصب، یک مسیر بازیابی محدود برای Plugin‌های همراه است که صراحتاً `openclaw.install.allowInvalidConfigRecovery` را فعال کرده‌اند.

  </Accordion>
  <Accordion title="--force و نصب مجدد در برابر به‌روزرسانی">
    `--force` هدف نصب موجود را دوباره استفاده می‌کند و یک Plugin یا بسته hook از پیش نصب‌شده را در همان محل بازنویسی می‌کند. وقتی عمداً همان شناسه را از یک مسیر محلی جدید، آرشیو، بسته ClawHub یا آرتیفکت npm دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل رهگیری می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای شناسه Pluginی اجرا کنید که از قبل نصب شده است، OpenClaw متوقف می‌شود و برای یک ارتقای عادی شما را به `plugins update <id-or-npm-spec>`، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید، به `plugins install <package> --force` هدایت می‌کند.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای یک مشخصه npm، فراداده منبع marketplace را نگه می‌دارند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` یک گزینه اضطراری برای مثبت‌های کاذب در اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی زمانی که اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه پیدا کند، اما بلوک‌های سیاست hook مربوط به `before_install` در Plugin را دور نمی‌زند و شکست‌های اسکن را نیز دور نمی‌زند.

    این پرچم CLI برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skills که از Gateway پشتیبانی می‌شوند از بازنویسی درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، درحالی‌که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب Skill از ClawHub است.

    اگر Pluginی که در ClawHub منتشر کرده‌اید توسط اسکن رجیستری مسدود شده است، از گام‌های ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های hook و مشخصه‌های npm">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای مشاهده hookها به‌صورت فیلترشده و فعال‌سازی هر hook، از `openclaw hooks` استفاده کنید، نه برای نصب بسته.

    مشخصه‌های npm **فقط رجیستری** هستند (نام بسته به‌علاوه **نسخه دقیق** یا **dist-tag** اختیاری). مشخصه‌های Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های وابستگی برای ایمنی به‌صورت محلی در پروژه و با `--ignore-scripts` اجرا می‌شوند، حتی وقتی پوسته شما تنظیمات نصب سراسری npm دارد.

    وقتی می‌خواهید جست‌وجوی ClawHub را رد کنید و مستقیماً از npm نصب کنید، از `npm:<package>` استفاده کنید. مشخصه‌های خام بسته همچنان ClawHub را ترجیح می‌دهند و فقط وقتی ClawHub آن بسته یا نسخه را ندارد به npm برمی‌گردند.

    مشخصه‌های خام و `@latest` روی مسیر پایدار می‌مانند. اگر npm هرکدام از این‌ها را به یک prerelease حل کند، OpenClaw متوقف می‌شود و از شما می‌خواهد صراحتاً با یک برچسب prerelease مانند `@beta`/`@rc` یا یک نسخه دقیق prerelease مانند `@1.2.3-beta.4` وارد شوید.

    اگر یک مشخصه نصب خام با شناسه Plugin همراه مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw همان Plugin همراه را مستقیماً نصب می‌کند. برای نصب یک بسته npm با همان نام، از یک مشخصه scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="آرشیوها">
    آرشیوهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. آرشیوهای Plugin بومی OpenClaw باید یک `openclaw.plugin.json` معتبر در ریشه Plugin استخراج‌شده داشته باشند؛ آرشیوهایی که فقط `package.json` دارند، پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از یک locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw اکنون برای مشخصه‌های Plugin خام و امن برای npm نیز ClawHub را ترجیح می‌دهد. فقط زمانی به npm برمی‌گردد که ClawHub آن بسته یا نسخه را نداشته باشد:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای اجبار به حل فقط از npm، مثلاً وقتی ClawHub در دسترس نیست یا می‌دانید بسته فقط در npm وجود دارد، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw آرشیو بسته را از ClawHub دانلود می‌کند، سازگاری اعلام‌شده API Plugin / حداقل Gateway را بررسی می‌کند، سپس آن را از مسیر عادی آرشیو نصب می‌کند. نصب‌های ثبت‌شده، فراداده منبع ClawHub خود را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های بدون نسخه ClawHub یک مشخصه ثبت‌شده بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند انتشارهای جدیدتر ClawHub را دنبال کند؛ انتخابگرهای نسخه یا برچسب صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` به همان انتخابگر سنجاق‌شده باقی می‌مانند.

#### کوتاه‌نویسی marketplace

وقتی نام marketplace در کش رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از کوتاه‌نویسی `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع marketplace را صریحاً بدهید، از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="منابع marketplace">
    - نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشه marketplace محلی یا مسیر `marketplace.json`
    - کوتاه‌نویسی مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL git

  </Tab>
  <Tab title="قواعد marketplace راه‌دور">
    برای marketplaceهای راه‌دور که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند. OpenClaw منابع مسیر نسبی از همان مخزن را می‌پذیرد و منابع Plugin از نوع HTTP(S)، مسیر مطلق، git، GitHub و سایر منابع غیرمسیر را از مانیفست‌های راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرهای محلی و آرشیوها، OpenClaw به‌صورت خودکار شناسایی می‌کند:

- Plugin‌های بومی OpenClaw (`openclaw.plugin.json`)
- باندل‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- باندل‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه Claude)
- باندل‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
باندل‌های سازگار در ریشه عادی Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. امروز، bundle skills، command-skills مربوط به Claude، پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های `.lsp.json` / `lspServers` اعلام‌شده در مانیفست مربوط به Claude، command-skills مربوط به Cursor و دایرکتوری‌های hook سازگار با Codex پشتیبانی می‌شوند؛ سایر قابلیت‌های باندل شناسایی‌شده در diagnostics/info نشان داده می‌شوند اما هنوز به اجرای زمان اجرا متصل نشده‌اند.
</Note>

### فهرست

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  فقط Plugin‌های فعال را نشان دهید.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خطوط جزئیات برای هر Plugin با فراداده source/origin/version/activation تغییر دهید.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل‌خواندن برای ماشین به‌علاوه diagnostics رجیستری.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی ذخیره‌شدهٔ افزونه را می‌خواند، و اگر رجیستری وجود نداشته باشد یا نامعتبر باشد، از یک جایگزین مشتق‌شده فقط از manifest استفاده می‌کند. این دستور برای بررسی اینکه آیا یک افزونه نصب، فعال، و برای برنامه‌ریزی شروع سرد قابل مشاهده است مفید است، اما یک کاوش زندهٔ زمان اجرا از یک فرایند Gateway که از قبل در حال اجراست نیست. پس از تغییر کد افزونه، فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار اجرای کد جدید `register(api)` یا hookها، Gatewayای را که کانال را سرویس می‌دهد دوباره راه‌اندازی کنید. برای استقرارهای راه دور/کانتینری، بررسی کنید که فرزند واقعی `openclaw gateway run` را دوباره راه‌اندازی می‌کنید، نه فقط یک فرایند wrapper.
</Note>

برای کار روی افزونهٔ همراه‌شده داخل یک تصویر Docker بسته‌بندی‌شده، دایرکتوری
مبدأ افزونه را روی مسیر مبدأ بسته‌بندی‌شدهٔ متناظر bind-mount کنید، مانند
`/app/extensions/synology-chat`. OpenClaw آن overlay مبدأ mount‌شده را
پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری مبدأ
صرفاً کپی‌شده بی‌اثر می‌ماند تا نصب‌های بسته‌بندی‌شدهٔ معمول همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hookهای زمان اجرا:

- `openclaw plugins inspect <id> --json` hookهای ثبت‌شده و عیب‌یابی‌های حاصل از یک گذر بازرسی module-loaded را نشان می‌دهد.
- `openclaw gateway status --deep --require-rpc` Gateway قابل دسترس، راهنمایی‌های سرویس/فرایند، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای گفت‌وگوی غیرهمراه (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی‌کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های link‌شده به‌جای کپی‌کردن روی مقصد نصب مدیریت‌شده، همان مسیر مبدأ را دوباره استفاده می‌کنند.

در نصب‌های npm از `--pin` استفاده کنید تا spec دقیق resolve‌شده (`name@version`) در فهرست افزونه‌های مدیریت‌شده ذخیره شود، در حالی که رفتار پیش‌فرض بدون pin باقی می‌ماند.
</Note>

### فهرست Plugin

فرادادهٔ نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه config کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. نگاشت سطح بالای `installRecords` منبع پایدار فرادادهٔ نصب است، از جمله رکوردهای manifestهای خراب یا گم‌شدهٔ افزونه. آرایهٔ `plugins` کش رجیستری سرد مشتق‌شده از manifest است. فایل شامل هشدار «ویرایش نکنید» است و توسط `openclaw plugins update`، حذف نصب، عیب‌یابی‌ها، و رجیستری سرد افزونه استفاده می‌شود.

وقتی OpenClaw رکوردهای legacy ارسال‌شدهٔ `plugins.installs` را در config ببیند، آن‌ها را به فهرست افزونه منتقل می‌کند و کلید config را حذف می‌کند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، رکوردهای config نگه داشته می‌شوند تا فرادادهٔ نصب از دست نرود.

### وابستگی‌های زمان اجرا

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` مرحلهٔ وابستگی زمان اجرای بسته‌بندی‌شده را برای افزونه‌های همراه مالکیت OpenClaw که با config افزونه، کانال‌های فعال/پیکربندی‌شده، providerهای مدل پیکربندی‌شده، یا پیش‌فرض‌های manifest همراه انتخاب شده‌اند بررسی می‌کند. این مسیر نصب/به‌روزرسانی برای افزونه‌های شخص ثالث npm یا ClawHub نیست.

وقتی یک نصب بسته‌بندی‌شده هنگام شروع Gateway یا `plugins doctor` وابستگی‌های زمان اجرای همراهِ گم‌شده را گزارش می‌کند، از `--repair` استفاده کنید. repair فقط وابستگی‌های گم‌شدهٔ افزونه‌های همراه فعال را با اسکریپت‌های lifecycle غیرفعال نصب می‌کند. از `--prune` برای حذف ریشه‌های کهنهٔ ناشناختهٔ خارجیِ وابستگی زمان اجرا که از layoutهای بسته‌بندی‌شدهٔ قدیمی باقی مانده‌اند استفاده کنید.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای افزونه را از `plugins.entries`، فهرست ذخیره‌شدهٔ افزونه، ورودی‌های فهرست allow/deny افزونه، و در صورت کاربرد، ورودی‌های link‌شدهٔ `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شدهٔ رهگیری‌شده را زمانی که داخل ریشهٔ extensions افزونهٔ OpenClaw باشد حذف می‌کند. برای افزونه‌های active memory، slot حافظه به `memory-core` بازنشانی می‌شود.

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

به‌روزرسانی‌ها روی نصب‌های رهگیری‌شدهٔ افزونه در فهرست افزونهٔ مدیریت‌شده و نصب‌های hook-pack رهگیری‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="Resolve کردن شناسهٔ افزونه در برابر npm spec">
    وقتی یک شناسهٔ افزونه را می‌دهید، OpenClaw از spec نصب ثبت‌شده برای آن افزونه دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شدهٔ قبلی مانند `@beta` و نسخه‌های دقیق pin‌شده در اجراهای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، می‌توانید یک npm package spec صریح با dist-tag یا نسخهٔ دقیق نیز بدهید. OpenClaw نام آن package را به رکورد افزونهٔ رهگیری‌شده resolve می‌کند، آن افزونهٔ نصب‌شده را به‌روزرسانی می‌کند، و npm spec جدید را برای به‌روزرسانی‌های مبتنی بر شناسه در آینده ثبت می‌کند.

    دادن نام package در npm بدون نسخه یا tag نیز به رکورد افزونهٔ رهگیری‌شده resolve می‌شود. وقتی افزونه‌ای به یک نسخهٔ دقیق pin شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="بررسی‌های نسخه و تغییر هویت integrity">
    پیش از یک به‌روزرسانی زندهٔ npm، OpenClaw نسخهٔ package نصب‌شده را در برابر فرادادهٔ رجیستری npm بررسی می‌کند. اگر نسخهٔ نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف resolve‌شده یکسان باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی یک hash ذخیره‌شدهٔ integrity وجود داشته باشد و hash artifact دریافت‌شده تغییر کند، OpenClaw آن را تغییر artifact در npm در نظر می‌گیرد. دستور تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی به‌صورت بسته شکست می‌خورند، مگر اینکه فراخواننده یک سیاست ادامهٔ صریح ارائه کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install در update">
    `--dangerously-force-unsafe-install` همچنین روی `plugins update` به‌عنوان override اضطراری برای مثبت‌های کاذب اسکن کد خطرناک داخلی هنگام به‌روزرسانی افزونه‌ها در دسترس است. این همچنان blockهای سیاست `before_install` افزونه یا مسدودسازی شکست اسکن را دور نمی‌زند، و فقط برای به‌روزرسانی افزونه‌ها اعمال می‌شود، نه به‌روزرسانی hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

درون‌نگری عمیق برای یک افزونهٔ واحد. هویت، وضعیت بارگذاری، مبدأ، قابلیت‌های ثبت‌شده، hookها، ابزارها، commandها، سرویس‌ها، methodهای Gateway، routeهای HTTP، پرچم‌های سیاست، عیب‌یابی‌ها، فرادادهٔ نصب، قابلیت‌های bundle، و هر پشتیبانی تشخیص‌داده‌شده از serverهای MCP یا LSP را نشان می‌دهد.

هر افزونه بر اساس آنچه واقعاً در زمان اجرا ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (مثلاً افزونهٔ فقط provider)
- **hybrid-capability** — چند نوع قابلیت (مثلاً متن + گفتار + تصویر)
- **hook-only** — فقط hookها، بدون قابلیت‌ها یا سطح‌ها
- **non-capability** — ابزارها/commandها/سرویس‌ها اما بدون قابلیت‌ها

برای اطلاعات بیشتر دربارهٔ مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی machine-readable مناسب برای اسکریپت‌نویسی و ممیزی خروجی می‌دهد. `inspect --all` یک جدول در سطح کل fleet با ستون‌های شکل، نوع‌های قابلیت، اطلاعیه‌های سازگاری، قابلیت‌های bundle، و خلاصهٔ hook رندر می‌کند. `info` نام مستعار `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری افزونه، عیب‌یابی‌های manifest/کشف، و اطلاعیه‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

برای شکست‌های شکل module مانند exportهای گم‌شدهٔ `register`/`activate`، با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` دوباره اجرا کنید تا خلاصه‌ای فشرده از شکل export در خروجی عیب‌یابی اضافه شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی افزونه مدل خواندن سرد ذخیره‌شدهٔ OpenClaw برای هویت افزونهٔ نصب‌شده، فعال‌سازی، فرادادهٔ مبدأ، و مالکیت contribution است. شروع معمول، lookup مالک provider، طبقه‌بندی setup کانال، و inventory افزونه می‌توانند آن را بدون import کردن moduleهای زمان اجرای افزونه بخوانند.

از `plugins registry` برای بررسی اینکه آیا رجیستری ذخیره‌شده وجود دارد، به‌روز است، یا کهنه شده استفاده کنید. از `--refresh` برای بازسازی آن از فهرست ذخیره‌شدهٔ افزونه، سیاست config، و فرادادهٔ manifest/package استفاده کنید. این یک مسیر repair است، نه مسیر فعال‌سازی زمان اجرا.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک سوییچ سازگاری اضطراری منسوخ‌شده برای شکست‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback env فقط برای بازیابی اضطراری شروع در هنگام rollout مهاجرت است.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست Marketplace یک مسیر محلی marketplace، مسیر `marketplace.json`، shorthand گیت‌هاب مانند `owner/repo`، URL مخزن گیت‌هاب، یا URL git را می‌پذیرد. `--json` برچسب مبدأ resolve‌شده به‌علاوهٔ manifest marketplace و ورودی‌های افزونهٔ parse‌شده را چاپ می‌کند.

## مرتبط

- [ساخت افزونه‌ها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [افزونه‌های جامعه](/fa/plugins/community)

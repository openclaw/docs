---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (فهرست، نصب، بازارچه، حذف نصب، فعال/غیرفعال کردن، عیب‌یابی)
title: Plugin‌ها
x-i18n:
    generated_at: "2026-04-29T22:38:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68d6a2734c7b4a3608467c64426f48bdf8dc1a36e33b51ba024313fc36762b5b
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های هوک، و بسته‌های سازگار.

<CardGroup cols={2}>
  <Card title="سامانه Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی، و عیب‌یابی Pluginها.
  </Card>
  <Card title="بسته‌های Plugin" href="/fa/plugins/bundles">
    مدل سازگاری بسته‌ها.
  </Card>
  <Card title="مانیفست Plugin" href="/fa/plugins/manifest">
    فیلدهای مانیفست و طرح‌واره پیکربندی.
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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

برای بررسی نصب، بازرسی، حذف نصب، یا تازه‌سازی رجیستری که کند است، فرمان را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. ردگیری، زمان‌بندی فازها را در stderr می‌نویسد و خروجی JSON را قابل تجزیه نگه می‌دارد. [عیب‌یابی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
Pluginهای همراه با OpenClaw همراه OpenClaw عرضه می‌شوند. برخی به‌صورت پیش‌فرض فعال‌اند (برای مثال ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه)؛ برخی دیگر به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. بسته‌های سازگار به‌جای آن از مانیفست‌های بسته خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی فهرست/اطلاعات در حالت verbose همچنین زیرنوع بسته (`codex`، `claude`، یا `cursor`) به‌همراه قابلیت‌های شناسایی‌شده بسته را نشان می‌دهد.
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
نام‌های بسته بدون پیشوند ابتدا در ClawHub و سپس در npm بررسی می‌شوند. نصب Pluginها را مانند اجرای کد در نظر بگیرید. نسخه‌های پین‌شده را ترجیح دهید.
</Warning>

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. Npm همچنان به‌عنوان مسیر جایگزین پشتیبانی‌شده و نصب مستقیم پشتیبانی می‌شود. در طول مهاجرت به ClawHub، OpenClaw هنوز برخی بسته‌های Plugin متعلق به OpenClaw با نام `@openclaw/*` را روی npm عرضه می‌کند؛ نسخه‌های آن بسته‌ها ممکن است بین قطارهای انتشار Plugin از منبع همراه عقب بمانند. اگر npm یک بسته Plugin متعلق به OpenClaw را منسوخ گزارش کند، آن نسخه منتشرشده یک آرتیفکت خارجی قدیمی است؛ تا زمانی که بسته npm جدیدتری منتشر شود، از Plugin همراه با OpenClaw فعلی یا یک checkout محلی استفاده کنید.
</Note>

<AccordionGroup>
  <Accordion title="includeهای پیکربندی و بازیابی پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` در همان فایل include‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای ریشه، آرایه‌های include، و includeهای دارای overrideهای هم‌سطح به‌جای flatten شدن، بسته و ناموفق می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولاً بسته و ناموفق می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway، پیکربندی نامعتبر برای یک Plugin به همان Plugin محدود می‌شود تا کانال‌ها و Pluginهای دیگر بتوانند به اجرا ادامه دهند؛ `openclaw doctor --fix` می‌تواند ورودی Plugin نامعتبر را قرنطینه کند. تنها استثنای مستندشده در زمان نصب، مسیر بازیابی محدود Plugin همراه برای Pluginهایی است که صراحتاً `openclaw.install.allowInvalidConfigRecovery` را فعال می‌کنند.

  </Accordion>
  <Accordion title="--force و نصب دوباره در برابر به‌روزرسانی">
    `--force` هدف نصب موجود را دوباره استفاده می‌کند و یک Plugin یا بسته هوک از قبل نصب‌شده را درجا بازنویسی می‌کند. وقتی عمداً همان شناسه را از یک مسیر محلی جدید، آرشیو، بسته ClawHub، یا آرتیفکت npm دوباره نصب می‌کنید از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل ردیابی می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای شناسه Pluginای اجرا کنید که از قبل نصب شده است، OpenClaw متوقف می‌شود و برای یک ارتقای عادی شما را به `plugins update <id-or-npm-spec>`، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید به `plugins install <package> --force` راهنمایی می‌کند.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec مربوط به npm، فراداده منبع marketplace را ماندگار می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` گزینه‌ای اضطراری برای مثبت‌های کاذب در اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه یابد، اما بلوک‌های سیاست هوک `before_install` مربوط به Plugin را دور نمی‌زند و شکست‌های اسکن را نیز دور نمی‌زند.

    این پرچم CLI برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skills که با Gateway پشتیبانی می‌شوند از override متناظر درخواست `dangerouslyForceUnsafeInstall` استفاده می‌کنند، درحالی‌که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب Skill از ClawHub است.

    اگر Pluginای که در ClawHub منتشر کرده‌اید با اسکن رجیستری مسدود شده است، از مراحل ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های هوک و specهای npm">
    `plugins install` همچنین سطح نصب برای بسته‌های هوکی است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای مشاهده فیلترشده هوک و فعال‌سازی هر هوک، نه نصب بسته، از `openclaw hooks` استفاده کنید.

    specهای npm **فقط رجیستری** هستند (نام بسته + **نسخه دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های وابستگی برای ایمنی به‌صورت project-local با `--ignore-scripts` اجرا می‌شوند، حتی وقتی shell شما تنظیمات نصب npm سراسری دارد.

    وقتی می‌خواهید جست‌وجوی ClawHub را رد کنید و مستقیماً از npm نصب کنید، از `npm:<package>` استفاده کنید. specهای بسته بدون پیشوند همچنان ClawHub را ترجیح می‌دهند و فقط وقتی ClawHub آن بسته یا نسخه را نداشته باشد به npm fallback می‌کنند.

    specهای بدون پیشوند و `@latest` روی مسیر پایدار می‌مانند. اگر npm هرکدام از این‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک تگ prerelease مانند `@beta`/`@rc` یا یک نسخه prerelease دقیق مانند `@1.2.3-beta.4` صراحتاً opt in کنید.

    اگر یک spec نصب بدون پیشوند با شناسه Plugin همراه تطبیق داشته باشد (برای مثال `diffs`)، OpenClaw همان Plugin همراه را مستقیماً نصب می‌کند. برای نصب یک بسته npm با همان نام، از یک spec scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="آرشیوها">
    آرشیوهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. آرشیوهای Plugin بومی OpenClaw باید یک `openclaw.plugin.json` معتبر در ریشه Plugin استخراج‌شده داشته باشند؛ آرشیوهایی که فقط `package.json` دارند پیش از آنکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw اکنون برای specهای Plugin بدون پیشوند و امن برای npm نیز ClawHub را ترجیح می‌دهد. فقط وقتی ClawHub آن بسته یا نسخه را نداشته باشد به npm fallback می‌کند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای اجبار به resolve فقط از npm، مثلاً وقتی ClawHub در دسترس نیست یا می‌دانید بسته فقط روی npm وجود دارد، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw آرشیو بسته را از ClawHub دانلود می‌کند، سازگاری API Plugin اعلام‌شده / حداقل Gateway را بررسی می‌کند، سپس آن را از مسیر عادی آرشیو نصب می‌کند. نصب‌های ثبت‌شده فراداده منبع ClawHub خود را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های ClawHub بدون نسخه، spec ثبت‌شده بدون نسخه را نگه می‌دارند تا `openclaw plugins update` بتواند انتشارهای جدیدتر ClawHub را دنبال کند؛ انتخابگرهای نسخه یا تگ صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان انتخابگر پین می‌مانند.

#### خلاصه‌نویسی marketplace

وقتی نام marketplace در کش رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از خلاصه‌نویسی `plugin@marketplace` استفاده کنید:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

وقتی می‌خواهید منبع marketplace را صراحتاً پاس بدهید، از `--marketplace` استفاده کنید:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="منابع marketplace">
    - یک نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشه marketplace محلی یا مسیر `marketplace.json`
    - خلاصه‌نویسی مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL مربوط به git

  </Tab>
  <Tab title="قواعد marketplace راه‌دور">
    برای marketplaceهای راه‌دور که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده بمانند. OpenClaw منابع مسیر نسبی از همان مخزن را می‌پذیرد و منابع Plugin از نوع HTTP(S)، مسیر مطلق، git، GitHub، و سایر منابع غیرمسیر را از مانیفست‌های راه‌دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و آرشیوهای محلی، OpenClaw به‌صورت خودکار شناسایی می‌کند:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشه عادی Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی مشارکت می‌کنند. امروز، Skillهای بسته، command-skillهای Claude، پیش‌فرض‌های `settings.json` در Claude، پیش‌فرض‌های `.lsp.json` در Claude / `lspServers` اعلام‌شده در مانیفست، command-skillهای Cursor، و دایرکتوری‌های هوک سازگار Codex پشتیبانی می‌شوند؛ دیگر قابلیت‌های بسته شناسایی‌شده در diagnostics/info نشان داده می‌شوند اما هنوز به اجرای runtime متصل نشده‌اند.
</Note>

### فهرست

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  فقط Pluginهای فعال را نشان دهید.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خطوط جزئیات هر Plugin با فراداده منبع/مبدا/نسخه/فعال‌سازی جابه‌جا شوید.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل خواندن توسط ماشین به‌همراه diagnostics رجیستری.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی پایدارشده Plugin را می‌خواند، و وقتی رجیستری وجود نداشته باشد یا نامعتبر باشد، از یک جایگزین مشتق‌شده فقط از manifest استفاده می‌کند. این فرمان برای بررسی اینکه آیا یک Plugin نصب، فعال، و برای برنامه‌ریزی راه‌اندازی سرد قابل مشاهده است مفید است، اما یک کاوشگر زنده زمان اجرا برای یک فرایند Gateway ازپیش‌درحال‌اجرا نیست. پس از تغییر کد Plugin، فعال‌سازی، سیاست hook، یا `plugins.load.paths`، پیش از انتظار اجرای کد جدید `register(api)` یا hookها، Gatewayی را که به کانال سرویس می‌دهد بازراه‌اندازی کنید. برای استقرارهای راه‌دور/کانتینری، بررسی کنید که فرزند واقعی `openclaw gateway run` را بازراه‌اندازی می‌کنید، نه فقط یک فرایند wrapper را.
</Note>

برای کار روی Pluginهای همراه درون یک تصویر Docker بسته‌بندی‌شده، دایرکتوری منبع Plugin را روی مسیر منبع بسته‌بندی‌شده متناظر bind-mount کنید، مانند `/app/extensions/synology-chat`. OpenClaw آن overlay منبع mountشده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع که صرفا کپی شده باشد غیرفعال می‌ماند تا نصب‌های بسته‌بندی‌شده معمول همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hookهای زمان اجرا:

- `openclaw plugins inspect <id> --json` hookهای ثبت‌شده و عیب‌یابی‌های حاصل از یک گذر بازرسیِ ماژول‌بارگذاری‌شده را نشان می‌دهد.
- `openclaw gateway status --deep --require-rpc` Gateway قابل دسترس، راهنمایی‌های سرویس/فرایند، مسیر پیکربندی، و سلامت RPC را تایید می‌کند.
- hookهای گفت‌وگوی غیرهمراه (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های لینک‌شده به‌جای کپی کردن روی یک مقصد نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کنند.

در نصب‌های npm از `--pin` استفاده کنید تا spec دقیق resolveشده (`name@version`) در شاخص Plugin مدیریت‌شده ذخیره شود، در حالی که رفتار پیش‌فرض بدون pin باقی می‌ماند.
</Note>

### شاخص Plugin

فراداده نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه پیکربندی کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. نگاشت سطح‌بالای `installRecords` منبع پایدار فراداده نصب است، از جمله رکوردهای manifestهای خراب یا گم‌شده Plugin. آرایه `plugins` کش رجیستری سرد مشتق‌شده از manifest است. این فایل شامل هشدار «ویرایش نکنید» است و توسط `openclaw plugins update`، حذف نصب، عیب‌یابی‌ها، و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای قدیمی ارسال‌شده `plugins.installs` را در پیکربندی ببیند، آن‌ها را به شاخص Plugin منتقل می‌کند و کلید پیکربندی را حذف می‌کند؛ اگر هرکدام از عملیات‌های نوشتن شکست بخورد، رکوردهای پیکربندی نگه داشته می‌شوند تا فراداده نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، شاخص پایدارشده Plugin، ورودی‌های فهرست مجاز/غیرمجاز Plugin، و در صورت کاربرد ورودی‌های لینک‌شده `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شده ردیابی‌شده را زمانی که داخل ریشه extensions مربوط به Pluginهای OpenClaw باشد حذف می‌کند. برای Pluginهای active memory، اسلات حافظه به `memory-core` بازنشانی می‌شود.

<Note>
`--keep-config` به‌عنوان یک alias منسوخ برای `--keep-files` پشتیبانی می‌شود.
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
  <Accordion title="Resolve کردن شناسه Plugin در برابر spec مربوط به npm">
    وقتی یک شناسه Plugin می‌دهید، OpenClaw از spec نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. این یعنی dist-tagهای ذخیره‌شده قبلی مانند `@beta` و نسخه‌های دقیق pinشده در اجراهای بعدی `update <id>` همچنان استفاده می‌شوند.

    برای نصب‌های npm، می‌توانید یک spec صریح بسته npm را نیز با dist-tag یا نسخه دقیق بدهید. OpenClaw نام آن بسته را به رکورد Plugin ردیابی‌شده resolve می‌کند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند، و spec جدید npm را برای به‌روزرسانی‌های آینده مبتنی بر شناسه ثبت می‌کند.

    دادن نام بسته npm بدون نسخه یا tag نیز به رکورد Plugin ردیابی‌شده resolve می‌شود. وقتی یک Plugin به نسخه‌ای دقیق pin شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این روش استفاده کنید.

  </Accordion>
  <Accordion title="بررسی‌های نسخه و drift یکپارچگی">
    پیش از یک به‌روزرسانی زنده npm، OpenClaw نسخه بسته نصب‌شده را در برابر فراداده رجیستری npm بررسی می‌کند. اگر نسخه نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف resolveشده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی یک hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact دریافت‌شده تغییر کند، OpenClaw آن را به‌عنوان drift در artifact مربوط به npm در نظر می‌گیرد. فرمان تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه تایید می‌خواهد. کمک‌کننده‌های به‌روزرسانی غیرتعاملی بسته می‌مانند، مگر اینکه فراخواننده یک سیاست ادامه صریح ارائه کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install هنگام به‌روزرسانی">
    `--dangerously-force-unsafe-install` روی `plugins update` نیز به‌عنوان یک override اضطراری برای مثبت‌های کاذب اسکن کد خطرناک داخلی هنگام به‌روزرسانی‌های Plugin در دسترس است. این گزینه همچنان بلوک‌های سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند، و فقط برای به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

درون‌نگری عمیق برای یک Plugin واحد. هویت، وضعیت بارگذاری، منبع، قابلیت‌های ثبت‌شده، hookها، ابزارها، فرمان‌ها، سرویس‌ها، متدهای Gateway، مسیرهای HTTP، پرچم‌های سیاست، عیب‌یابی‌ها، فراداده نصب، قابلیت‌های bundle، و هرگونه پشتیبانی شناسایی‌شده از سرور MCP یا LSP را نشان می‌دهد.

هر Plugin بر اساس آنچه واقعا در زمان اجرا ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (مثلا یک Plugin فقط provider)
- **hybrid-capability** — چند نوع قابلیت (مثلا متن + گفتار + تصویر)
- **hook-only** — فقط hookها، بدون قابلیت یا سطح
- **non-capability** — ابزارها/فرمان‌ها/سرویس‌ها اما بدون قابلیت

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل خواندن توسط ماشین تولید می‌کند که برای اسکریپت‌نویسی و حسابرسی مناسب است. `inspect --all` جدولی در سطح ناوگان با ستون‌های شکل، گونه‌های قابلیت، اعلان‌های سازگاری، قابلیت‌های bundle، و خلاصه hook نمایش می‌دهد. `info` یک alias برای `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، عیب‌یابی‌های manifest/کشف، و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

برای شکست‌های شکل ماژول مانند exportهای گم‌شده `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا یک خلاصه فشرده از شکل export در خروجی عیب‌یابی درج شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin مدل خواندن سرد پایدارشده OpenClaw برای هویت Plugin نصب‌شده، فعال‌سازی، فراداده منبع، و مالکیت contribution است. راه‌اندازی معمول، جست‌وجوی مالک provider، طبقه‌بندی راه‌اندازی کانال، و inventory مربوط به Plugin می‌توانند آن را بدون import کردن ماژول‌های زمان اجرای Plugin بخوانند.

از `plugins registry` برای بررسی اینکه آیا رجیستری پایدارشده وجود دارد، به‌روز است، یا کهنه شده استفاده کنید. از `--refresh` برای بازسازی آن از شاخص پایدارشده Plugin، سیاست پیکربندی، و فراداده manifest/package استفاده کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی زمان اجرا.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک کلید سازگاری اضطراری منسوخ برای شکست‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback محیطی فقط برای بازیابی اضطراری راه‌اندازی هنگام rollout مهاجرت است.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست Marketplace یک مسیر Marketplace محلی، یک مسیر `marketplace.json`، یک shorthand گیت‌هاب مانند `owner/repo`، یک URL مخزن گیت‌هاب، یا یک URL مربوط به git را می‌پذیرد. `--json` برچسب منبع resolveشده به‌همراه manifest تجزیه‌شده Marketplace و ورودی‌های Plugin را چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

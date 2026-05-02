---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید خطاهای بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-02T11:40:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 963a4292f86d651a23f06ee83fd82d7ad80cb99ff3397a665940d8247225252c
    source_path: cli/plugins.md
    workflow: 16
---

مدیریت Pluginهای Gateway، بسته‌های هوک، و بسته‌های سازگار.

<CardGroup cols={2}>
  <Card title="سامانه Plugin" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی و عیب‌یابی Pluginها.
  </Card>
  <Card title="بسته‌های Plugin" href="/fa/plugins/bundles">
    مدل سازگاری بسته.
  </Card>
  <Card title="مانیفست Plugin" href="/fa/plugins/manifest">
    فیلدهای مانیفست و طرح‌واره پیکربندی.
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

برای بررسی نصب، بازرسی، حذف نصب، یا تازه‌سازی رجیستری که کند است، دستور را با `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. ردگیری، زمان‌بندی فازها را در stderr می‌نویسد و خروجی JSON را قابل تجزیه نگه می‌دارد. [اشکال‌زدایی](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
Pluginهای همراه با OpenClaw عرضه می‌شوند. برخی به‌صورت پیش‌فرض فعال هستند (برای مثال ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه)؛ بقیه به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را همراه با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. بسته‌های سازگار به‌جای آن از مانیفست‌های بسته خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی مفصل فهرست/اطلاعات، زیرنوع بسته (`codex`، `claude`، یا `cursor`) به‌همراه قابلیت‌های تشخیص‌داده‌شده بسته را نیز نشان می‌دهد.
</Note>

### نصب

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
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
نام‌های خام بسته ابتدا در ClawHub و سپس در npm بررسی می‌شوند. نصب Pluginها را مانند اجرای کد در نظر بگیرید. نسخه‌های پین‌شده را ترجیح دهید.
</Warning>

`plugins search` از ClawHub برای بسته‌های Plugin قابل نصب پرس‌وجو می‌کند و نام بسته‌های آماده نصب را چاپ می‌کند. این دستور بسته‌های code-plugin و bundle-plugin را جست‌وجو می‌کند، نه Skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و کشف برای بیشتر Pluginها است. Npm همچنان به‌عنوان مسیر جایگزین پشتیبانی‌شده و نصب مستقیم پشتیبانی می‌شود. در طول مهاجرت به ClawHub، OpenClaw هنوز برخی بسته‌های Plugin متعلق به OpenClaw با نام `@openclaw/*` را در npm عرضه می‌کند؛ نسخه‌های آن بسته‌ها ممکن است بین قطارهای انتشار Plugin از منبع همراه عقب بمانند. اگر npm یک بسته Plugin متعلق به OpenClaw را منسوخ گزارش کند، آن نسخه منتشرشده یک آرتیفکت خارجی قدیمی است؛ تا زمانی که بسته npm جدیدتری منتشر شود، از Plugin همراه با OpenClaw فعلی یا یک checkout محلی استفاده کنید.
</Note>

<AccordionGroup>
  <Accordion title="شامل‌سازی‌های پیکربندی و بازیابی پیکربندی نامعتبر">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` در همان فایل شامل‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. شامل‌سازی‌های ریشه، آرایه‌های شامل‌سازی، و شامل‌سازی‌هایی با overrideهای هم‌سطح به‌جای تخت‌سازی، به‌صورت بسته شکست می‌خورند. برای شکل‌های پشتیبانی‌شده، [شامل‌سازی‌های پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولاً به‌صورت بسته شکست می‌خورد و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام راه‌اندازی Gateway، پیکربندی نامعتبر برای یک Plugin به همان Plugin محدود می‌شود تا کانال‌ها و Pluginهای دیگر بتوانند به کار ادامه دهند؛ `openclaw doctor --fix` می‌تواند ورودی Plugin نامعتبر را قرنطینه کند. تنها استثنای مستندشده در زمان نصب، یک مسیر بازیابی محدود برای Pluginهای همراه است که صراحتاً به `openclaw.install.allowInvalidConfigRecovery` opt in می‌کنند.

  </Accordion>
  <Accordion title="--force و نصب دوباره در برابر به‌روزرسانی">
    `--force` هدف نصب موجود را دوباره استفاده می‌کند و یک Plugin یا بسته هوک نصب‌شده را درجا بازنویسی می‌کند. وقتی عمداً همان شناسه را از یک مسیر محلی جدید، آرشیو، بسته ClawHub، یا آرتیفکت npm دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل ردیابی می‌شود، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای شناسه Pluginی اجرا کنید که از قبل نصب شده است، OpenClaw متوقف می‌شود و برای ارتقای عادی شما را به `plugins update <id-or-npm-spec>`، یا وقتی واقعاً می‌خواهید نصب فعلی را از منبعی متفاوت بازنویسی کنید، به `plugins install <package> --force` راهنمایی می‌کند.

  </Accordion>
  <Accordion title="دامنه --pin">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع پین‌شده می‌خواهید، از یک ref صریح git مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، زیرا نصب‌های marketplace به‌جای spec مربوط به npm، فراداده منبع marketplace را پایدار می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` یک گزینه اضطراری برای مثبت‌های کاذب در اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب حتی وقتی اسکنر داخلی یافته‌های `critical` گزارش می‌کند ادامه پیدا کند، اما بلوک‌های سیاست هوک `before_install` در Plugin را دور نمی‌زند و شکست‌های اسکن را نیز دور نمی‌زند.

    این پرچم CLI برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skill مبتنی بر Gateway از override درخواست متناظر `dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان یک جریان جداگانه دانلود/نصب Skill از ClawHub است.

    اگر Pluginی که در ClawHub منتشر کرده‌اید توسط اسکن رجیستری مسدود شده است، از گام‌های ناشر در [ClawHub](/fa/tools/clawhub) استفاده کنید.

  </Accordion>
  <Accordion title="بسته‌های هوک و specهای npm">
    `plugins install` همچنین سطح نصب برای بسته‌های هوکی است که `openclaw.hooks` را در `package.json` ارائه می‌کنند. برای مشاهده فیلترشده هوک و فعال‌سازی جداگانه هر هوک از `openclaw hooks` استفاده کنید، نه برای نصب بسته.

    specهای npm **فقط رجیستری** هستند (نام بسته + **نسخه دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های وابستگی برای ایمنی به‌صورت محلی در پروژه و با `--ignore-scripts` اجرا می‌شوند، حتی وقتی shell شما تنظیمات نصب سراسری npm دارد.

    وقتی می‌خواهید جست‌وجوی ClawHub را رد کنید و مستقیم از npm نصب کنید، از `npm:<package>` استفاده کنید. specهای خام بسته همچنان ClawHub را ترجیح می‌دهند و فقط وقتی ClawHub آن بسته یا نسخه را نداشته باشد به npm برمی‌گردند.

    specهای خام و `@latest` روی مسیر پایدار می‌مانند. اگر npm هرکدام از این‌ها را به یک پیش‌انتشار resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک برچسب پیش‌انتشار مانند `@beta`/`@rc` یا یک نسخه دقیق پیش‌انتشار مانند `@1.2.3-beta.4` صریحاً opt in کنید.

    اگر یک spec نصب خام با شناسه یک Plugin رسمی مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی کاتالوگ را مستقیم نصب می‌کند. برای نصب یک بسته npm با همان نام، از یک spec scopeدار صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مخزن‌های Git">
    برای نصب مستقیم از یک مخزن git از `git:<repo>` استفاده کنید. شکل‌های پشتیبانی‌شده شامل URLهای clone مانند `git:github.com/owner/repo`، `git:owner/repo`، `https://` کامل، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` را اضافه کنید.

    نصب‌های Git در یک دایرکتوری موقت clone می‌شوند، در صورت وجود ref درخواستی را checkout می‌کنند، سپس از نصب‌کننده عادی دایرکتوری Plugin استفاده می‌کنند. یعنی اعتبارسنجی مانیفست، اسکن کد خطرناک، کار نصب package-manager، و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit resolveشده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    پس از نصب از git، برای تأیید ثبت‌های زمان اجرا مانند متدهای gateway و دستورهای CLI از `openclaw plugins inspect <id> --runtime --json` استفاده کنید. اگر Plugin یک ریشه CLI با `api.registerCli` ثبت کرده باشد، آن دستور را مستقیم از طریق CLI ریشه OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="آرشیوها">
    آرشیوهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. آرشیوهای Plugin بومی OpenClaw باید یک `openclaw.plugin.json` معتبر در ریشه Plugin استخراج‌شده داشته باشند؛ آرشیوهایی که فقط `package.json` دارند پیش از اینکه OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    نصب‌های marketplace متعلق به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw اکنون برای specهای Plugin خام و ایمن برای npm نیز ClawHub را ترجیح می‌دهد. فقط اگر ClawHub آن بسته یا نسخه را نداشته باشد به npm برمی‌گردد:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای اجبار resolve فقط از npm، برای مثال وقتی ClawHub در دسترس نیست یا می‌دانید بسته فقط در npm وجود دارد، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، سازگاری API تبلیغ‌شده Plugin / حداقل Gateway را بررسی می‌کند. وقتی نسخه انتخاب‌شده ClawHub یک آرتیفکت ClawPack منتشر می‌کند، OpenClaw نسخه‌بندی‌شده ClawPack را دانلود می‌کند، هدر digest ClawHub و digest آرتیفکت را تأیید می‌کند، سپس آن را از مسیر عادی آرشیو نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون فراداده ClawPack همچنان از مسیر قدیمی اعتبارسنجی آرشیو بسته نصب می‌شوند. نصب‌های ثبت‌شده، فراداده منبع ClawHub و واقعیت‌های digest مربوط به ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های بدون نسخه ClawHub یک spec ثبت‌شده بدون نسخه نگه می‌دارند تا `openclaw plugins update` بتواند انتشارهای جدیدتر ClawHub را دنبال کند؛ انتخابگرهای نسخه یا برچسب صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` به همان انتخابگر پین‌شده می‌مانند.

#### کوتاه‌نویسی Marketplace

وقتی نام marketplace در کش رجیستری محلی Claude در `~/.claude/plugins/known_marketplaces.json` وجود دارد، از کوتاه‌نویسی `plugin@marketplace` استفاده کنید:

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
  <Tab title="Marketplace sources">
    - نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشه marketplace محلی یا مسیر `marketplace.json`
    - خلاصه‌نویسی مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL گیت

  </Tab>
  <Tab title="Remote marketplace rules">
    برای marketplaceهای راه دور که از GitHub یا گیت بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند. OpenClaw منابع مسیر نسبی را از همان مخزن می‌پذیرد و منابع Plugin از HTTP(S)، مسیر مطلق، گیت، GitHub و دیگر منابع غیرمسیر را از manifestهای راه دور رد می‌کند.
  </Tab>
</Tabs>

برای مسیرهای محلی و آرشیوها، OpenClaw به‌طور خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- بسته‌های سازگار با Codex (`.codex-plugin/plugin.json`)
- بسته‌های سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض مؤلفه Claude)
- بسته‌های سازگار با Cursor (`.cursor-plugin/plugin.json`)

<Note>
بسته‌های سازگار در ریشه عادی Plugin نصب می‌شوند و در همان جریان فهرست/اطلاعات/فعال‌سازی/غیرفعال‌سازی شرکت می‌کنند. امروز، bundle skills، مهارت‌های دستوری Claude، پیش‌فرض‌های Claude `settings.json`، پیش‌فرض‌های Claude `.lsp.json` / `lspServers` اعلام‌شده در manifest، مهارت‌های دستوری Cursor و دایرکتوری‌های hook سازگار Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگر بسته که شناسایی می‌شوند در diagnostics/info نمایش داده می‌شوند، اما هنوز به اجرای زمان اجرا متصل نشده‌اند.
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
  فقط Pluginهای فعال را نشان می‌دهد.
</ParamField>
<ParamField path="--verbose" type="boolean">
  از نمای جدول به خط‌های جزئیات جداگانه برای هر Plugin با فراداده منبع/خاستگاه/نسخه/فعال‌سازی تغییر می‌کند.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل خواندن برای ماشین به‌همراه diagnostics رجیستری.
</ParamField>

<Note>
`plugins list` ابتدا رجیستری محلی ماندگارشده Plugin را می‌خواند و وقتی رجیستری وجود ندارد یا نامعتبر است از جایگزین مشتق‌شده فقط از manifest استفاده می‌کند. این برای بررسی اینکه آیا یک Plugin نصب، فعال و برای برنامه‌ریزی راه‌اندازی سرد قابل مشاهده است مفید است، اما کاوشگر زنده زمان اجرا برای یک فرایند Gateway از قبل در حال اجرا نیست. پس از تغییر کد Plugin، فعال‌سازی، سیاست hook یا `plugins.load.paths`، پیش از انتظار برای اجرای کد `register(api)` یا hookهای جدید، Gatewayای را که به کانال سرویس می‌دهد بازراه‌اندازی کنید. برای استقرارهای راه دور/کانتینری، تأیید کنید که فرزند واقعی `openclaw gateway run` را بازراه‌اندازی می‌کنید، نه فقط یک فرایند wrapper.
</Note>

`plugins search` یک جست‌وجوی راه دور در کاتالوگ ClawHub است. وضعیت محلی را بررسی نمی‌کند، پیکربندی را تغییر نمی‌دهد، بسته‌ها را نصب نمی‌کند یا کد زمان اجرای Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو شامل نام بسته ClawHub، خانواده، کانال، نسخه، خلاصه و راهنمای نصبی مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Plugin همراه داخل یک تصویر Docker بسته‌بندی‌شده، دایرکتوری منبع Plugin را روی مسیر منبع بسته‌بندی‌شده متناظر bind-mount کنید، مانند `/app/extensions/synology-chat`. OpenClaw آن overlay منبع mount‌شده را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک دایرکتوری منبع که صرفاً کپی شده باشد غیرفعال باقی می‌ماند تا نصب‌های بسته‌بندی‌شده عادی همچنان از dist کامپایل‌شده استفاده کنند.

برای اشکال‌زدایی hook زمان اجرا:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics را از یک گذر بازرسی بارگذاری‌شده به‌صورت ماژول نشان می‌دهد. بازرسی زمان اجرا هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی وضعیت وابستگی قدیمی یا نصب Pluginهای قابل دانلود پیکربندی‌شده که وجود ندارند از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` Gateway قابل دسترس، راهنماهای سرویس/فرایند، مسیر پیکربندی و سلامت RPC را تأیید می‌کند.
- hookهای مکالمه غیرهمراه (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی‌کردن یک دایرکتوری محلی از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌شود):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` با `--link` پشتیبانی نمی‌شود، زیرا نصب‌های linked به‌جای کپی‌کردن روی هدف نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کنند.

برای نصب‌های npm از `--pin` استفاده کنید تا spec دقیق resolve‌شده (`name@version`) در فهرست Plugin مدیریت‌شده ذخیره شود، درحالی‌که رفتار پیش‌فرض unpinned باقی می‌ماند.
</Note>

### فهرست Plugin

فراداده نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه پیکربندی کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در `plugins/installs.json` زیر دایرکتوری وضعیت فعال OpenClaw می‌نویسند. نگاشت سطح بالای `installRecords` منبع پایدار فراداده نصب است، از جمله رکوردهای manifestهای خراب یا مفقود Plugin. آرایه `plugins` حافظه پنهان رجیستری سرد مشتق‌شده از manifest است. فایل شامل هشدار ویرایش‌نکنید است و توسط `openclaw plugins update`، حذف نصب، diagnostics و رجیستری سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای shipped legacy `plugins.installs` را در پیکربندی می‌بیند، آن‌ها را به فهرست Plugin منتقل می‌کند و کلید پیکربندی را حذف می‌کند؛ اگر هرکدام از نوشتن‌ها شکست بخورد، رکوردهای پیکربندی نگه داشته می‌شوند تا فراداده نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، فهرست ماندگارشده Plugin، ورودی‌های allow/deny list برای Plugin و ورودی‌های linked `plugins.load.paths` در صورت کاربرد حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شده ردیابی‌شده را وقتی داخل ریشه افزونه‌های Plugin در OpenClaw باشد حذف می‌کند. برای Pluginهای حافظه فعال، شکاف حافظه به `memory-core` بازنشانی می‌شود.

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

به‌روزرسانی‌ها روی نصب‌های Plugin ردیابی‌شده در فهرست Plugin مدیریت‌شده و نصب‌های hook-pack ردیابی‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    وقتی یک شناسه Plugin می‌دهید، OpenClaw از spec نصب ثبت‌شده برای آن Plugin دوباره استفاده می‌کند. این یعنی dist-tagهای ذخیره‌شده قبلی مانند `@beta` و نسخه‌های دقیق pin‌شده همچنان در اجراهای بعدی `update <id>` استفاده می‌شوند.

    برای نصب‌های npm، همچنین می‌توانید یک spec صریح بسته npm با dist-tag یا نسخه دقیق بدهید. OpenClaw آن نام بسته را به رکورد Plugin ردیابی‌شده برمی‌گرداند، آن Plugin نصب‌شده را به‌روزرسانی می‌کند و spec جدید npm را برای به‌روزرسانی‌های آینده مبتنی بر شناسه ثبت می‌کند.

    دادن نام بسته npm بدون نسخه یا tag نیز به رکورد Plugin ردیابی‌شده برمی‌گردد. وقتی یک Plugin به نسخه دقیق pin شده و می‌خواهید آن را به خط انتشار پیش‌فرض رجیستری برگردانید، از این استفاده کنید.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    پیش از یک به‌روزرسانی زنده npm، OpenClaw نسخه بسته نصب‌شده را با فراداده رجیستری npm بررسی می‌کند. اگر نسخه نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف resolve‌شده منطبق باشند، به‌روزرسانی بدون دانلود، نصب مجدد یا بازنویسی `openclaw.json` نادیده گرفته می‌شود.

    وقتی یک hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact واکشی‌شده تغییر کند، OpenClaw آن را drift در artifact npm تلقی می‌کند. فرمان تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه، تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی به‌صورت fail closed شکست می‌خورند، مگر اینکه فراخواننده یک سیاست ادامه صریح ارائه کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` همچنین در `plugins update` به‌عنوان override اضطراری برای false positiveهای اسکن کد خطرناک داخلی در طول به‌روزرسانی‌های Plugin در دسترس است. همچنان بلوک‌های سیاست `before_install` Plugin یا مسدودسازی شکست اسکن را دور نمی‌زند و فقط برای به‌روزرسانی‌های Plugin اعمال می‌شود، نه به‌روزرسانی‌های hook-pack.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، پرچم‌های سیاست، diagnostics، فراداده نصب، قابلیت‌های بسته و هرگونه پشتیبانی شناسایی‌شده از سرور MCP یا LSP را بدون import کردن زمان اجرای Plugin به‌صورت پیش‌فرض نشان می‌دهد. برای بارگذاری ماژول Plugin و شامل‌کردن hookها، ابزارها، فرمان‌ها، سرویس‌ها، متدهای Gateway و routeهای HTTP ثبت‌شده، `--runtime` را اضافه کنید. بازرسی زمان اجرا وابستگی‌های مفقود Plugin را مستقیماً گزارش می‌کند؛ نصب‌ها و تعمیرها در `openclaw plugins install`، `openclaw plugins update` و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI مالکیت‌شده توسط Plugin به‌عنوان گروه‌های فرمان ریشه `openclaw` نصب می‌شوند. پس از اینکه `inspect --runtime` یک فرمان را زیر `cliCommands` نشان داد، آن را به‌صورت `openclaw <command> ...` اجرا کنید؛ برای مثال Pluginای که `demo-git` را ثبت می‌کند، می‌تواند با `openclaw demo-git ping` تأیید شود.

هر Plugin بر اساس چیزی که واقعاً در زمان اجرا ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع قابلیت (مثلاً یک Plugin فقط provider)
- **hybrid-capability** — چند نوع قابلیت (مثلاً متن + گفتار + تصویر)
- **hook-only** — فقط hookها، بدون قابلیت یا سطح
- **non-capability** — ابزارها/فرمان‌ها/سرویس‌ها اما بدون قابلیت

برای اطلاعات بیشتر درباره مدل قابلیت، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
پرچم `--json` گزارشی قابل خواندن برای ماشین تولید می‌کند که برای اسکریپت‌نویسی و حسابرسی مناسب است. `inspect --all` یک جدول کل ناوگان با ستون‌های شکل، گونه‌های قابلیت، اعلان‌های سازگاری، قابلیت‌های بسته و خلاصه hook رندر می‌کند. `info` یک alias برای `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، diagnostics مربوط به manifest/discovery و اعلان‌های سازگاری را گزارش می‌کند. وقتی همه‌چیز پاک باشد، `No plugin issues detected.` را چاپ می‌کند.

برای شکست‌های شکل ماژول مانند exportهای مفقود `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا خلاصه‌ای فشرده از شکل export در خروجی diagnostic گنجانده شود.

### رجیستری

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

رجیستری محلی Plugin، مدل خواندن سرد ماندگارشده OpenClaw برای هویت Plugin نصب‌شده، فعال‌سازی، فراداده منبع و مالکیت contribution است. راه‌اندازی عادی، lookup مالک provider، طبقه‌بندی setup کانال و موجودی Plugin می‌توانند آن را بدون import کردن ماژول‌های زمان اجرای Plugin بخوانند.

از `plugins registry` برای بررسی اینکه رجیستری ماندگارشده وجود دارد، به‌روز است یا stale شده استفاده کنید. از `--refresh` برای بازسازی آن از فهرست ماندگارشده Plugin، سیاست پیکربندی و فراداده manifest/package استفاده کنید. این یک مسیر تعمیر است، نه مسیر فعال‌سازی زمان اجرا.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک سوییچ سازگاری اضطراری منسوخ‌شده برای شکست‌های خواندن رجیستری است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback مبتنی بر env فقط برای بازیابی اضطراری راه‌اندازی هنگام rollout شدن migration است.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست Marketplace یک مسیر marketplace محلی، مسیر `marketplace.json`، خلاصه‌نویسی GitHub مانند `owner/repo`، URL مخزن GitHub یا URL گیت را می‌پذیرد. `--json` برچسب منبع resolve‌شده را به‌همراه manifest marketplace parse‌شده و ورودی‌های Plugin چاپ می‌کند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [Pluginهای جامعه](/fa/plugins/community)

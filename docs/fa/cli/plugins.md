---
read_when:
    - می‌خواهید Pluginهای Gateway یا بسته‌های سازگار را نصب یا مدیریت کنید
    - می‌خواهید ساختار اولیه یک Plugin ابزار ساده را بسازید یا آن را اعتبارسنجی کنید
    - می‌خواهید خرابی‌های بارگذاری Plugin را اشکال‌زدایی کنید
sidebarTitle: Plugins
summary: مرجع CLI برای `openclaw plugins` (init، build، validate، list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugin
x-i18n:
    generated_at: "2026-06-27T17:27:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
    source_path: cli/plugins.md
    workflow: 16
---

Pluginهای Gateway، بسته‌های hook و bundleهای سازگار را مدیریت کنید.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای نصب، فعال‌سازی و عیب‌یابی Pluginها.
  </Card>
  <Card title="Manage plugins" href="/fa/plugins/manage-plugins">
    نمونه‌های سریع برای نصب، فهرست کردن، به‌روزرسانی، حذف نصب و انتشار.
  </Card>
  <Card title="Plugin bundles" href="/fa/plugins/bundles">
    مدل سازگاری bundle.
  </Card>
  <Card title="Plugin manifest" href="/fa/plugins/manifest">
    فیلدهای manifest و schema پیکربندی.
  </Card>
  <Card title="Security" href="/fa/gateway/security">
    سخت‌سازی امنیتی برای نصب‌های Plugin.
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
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

برای بررسی نصب، inspect، حذف نصب یا refresh کردن registry که کند است، دستور را با
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` اجرا کنید. trace زمان‌بندی فازها را در stderr می‌نویسد
و خروجی JSON را قابل parse نگه می‌دارد. [Debugging](/fa/help/debugging#plugin-lifecycle-trace) را ببینید.

<Note>
در حالت Nix (`OPENCLAW_NIX_MODE=1`)، mutatorهای چرخه‌عمر Plugin غیرفعال هستند. برای این نصب به‌جای `plugins install`، `plugins update`، `plugins uninstall`، `plugins enable` یا `plugins disable` از منبع Nix استفاده کنید؛ برای nix-openclaw، از [شروع سریع](https://github.com/openclaw/nix-openclaw#quick-start) agent-first استفاده کنید.
</Note>

<Note>
Pluginهای همراه با OpenClaw عرضه می‌شوند. برخی به‌طور پیش‌فرض فعال هستند (برای نمونه providerهای مدل همراه، providerهای گفتار همراه، و Plugin مرورگر همراه)؛ سایر موارد به `plugins enable` نیاز دارند.

Pluginهای بومی OpenClaw باید `openclaw.plugin.json` را با یک JSON Schema درون‌خطی (`configSchema`، حتی اگر خالی باشد) عرضه کنند. bundleهای سازگار در عوض از manifestهای bundle خودشان استفاده می‌کنند.

`plugins list` مقدار `Format: openclaw` یا `Format: bundle` را نشان می‌دهد. خروجی verbose فهرست/info همچنین subtype bundle (`codex`، `claude` یا `cursor`) به‌همراه capabilityهای bundle شناسایی‌شده را نشان می‌دهد.
</Note>

### نویسنده

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` به‌طور پیش‌فرض یک Plugin ابزار TypeScript حداقلی ایجاد می‌کند. آرگومان اول
شناسه Plugin است؛ برای نام نمایشی `--name` را پاس دهید. OpenClaw از شناسه برای
دایرکتوری خروجی پیش‌فرض و نام‌گذاری package استفاده می‌کند. scaffoldهای ابزار از
`defineToolPlugin` استفاده می‌کنند.
`plugins build` entry ساخته‌شده را import می‌کند، metadata ایستای ابزار آن را می‌خواند، `openclaw.plugin.json` را می‌نویسد
و `openclaw.extensions` در `package.json` را همسو نگه می‌دارد.
`plugins validate` بررسی می‌کند که manifest تولیدشده، metadata package و
export فعلی entry همچنان با هم سازگار باشند. برای workflow کامل نوشتن ابزار، [Pluginهای ابزار](/fa/plugins/tool-plugins) را ببینید.

scaffold کد منبع TypeScript می‌نویسد اما metadata را از entry ساخته‌شده
`./dist/index.js` تولید می‌کند، بنابراین workflow با CLI منتشرشده نیز کار می‌کند. وقتی entry، entry پیش‌فرض package نیست، از
`--entry <path>` استفاده کنید. در CI از
`plugins build --check` استفاده کنید تا وقتی metadata تولیدشده قدیمی است، بدون
بازنویسی فایل‌ها fail شود.

### Scaffold برای Provider

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

scaffoldهای provider یک Plugin عمومی provider متن/مدل با plumbing کلید API سازگار با OpenAI،
یک اسکریپت داخلی `npm run validate` برای `clawhub package
validate`، metadata package برای ClawHub و یک workflow GitHub با dispatch دستی
برای انتشار trusted آینده از طریق GitHub Actions OIDC ایجاد می‌کنند. scaffoldهای provider
Skills تولید نمی‌کنند و از `openclaw plugins build` یا
`openclaw plugins validate` استفاده نمی‌کنند؛ این دستورها برای مسیر metadata تولیدشده
در scaffold ابزار هستند.

پیش از انتشار، URL پایه API placeholder، catalog مدل، مسیر docs،
متن credential و متن README را با جزئیات واقعی provider جایگزین کنید. از
README تولیدشده برای انتشار اولیه در ClawHub و راه‌اندازی trusted publisher استفاده کنید.

### نصب

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

نگهدارندگانی که نصب‌های زمان setup را آزمایش می‌کنند می‌توانند منابع نصب خودکار Plugin را
با متغیرهای محیطی محافظت‌شده override کنند. [overrideهای نصب Plugin](/fa/plugins/install-overrides) را ببینید.

<Warning>
نام‌های package بدون prefix در طول cutover راه‌اندازی به‌طور پیش‌فرض از npm نصب می‌شوند، مگر اینکه با شناسه رسمی Plugin تطبیق داشته باشند. specهای خام package از نوع `@openclaw/*` که با Pluginهای همراه تطبیق دارند، از کپی همراهی استفاده می‌کنند که با build فعلی OpenClaw عرضه شده است. وقتی عمدا یک package خارجی npm می‌خواهید، از `npm:<package>` استفاده کنید. برای ClawHub از `clawhub:<package>` استفاده کنید. نصب Pluginها را مانند اجرای کد در نظر بگیرید. نسخه‌های pinned را ترجیح دهید.
</Warning>

`plugins search` در ClawHub برای packageهای Plugin قابل نصب query می‌زند و
نام‌های package آماده نصب را چاپ می‌کند. این دستور packageهای code-plugin و bundle-plugin را جست‌وجو می‌کند،
نه Skills را. برای Skills در ClawHub از `openclaw skills search` استفاده کنید.

<Note>
ClawHub سطح اصلی توزیع و discovery برای بیشتر Pluginها است. Npm
همچنان یک fallback پشتیبانی‌شده و مسیر نصب مستقیم است. packageهای Plugin
`@openclaw/*` متعلق به OpenClaw دوباره در npm منتشر می‌شوند؛ فهرست فعلی را
در [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) یا
[موجودی Plugin](/fa/plugins/plugin-inventory) ببینید. نصب‌های stable از `latest` استفاده می‌کنند.
نصب‌ها و به‌روزرسانی‌های کانال beta، وقتی npm `beta` dist-tag در دسترس باشد، آن را ترجیح می‌دهند
و سپس به `latest` fallback می‌کنند.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    اگر بخش `plugins` شما با یک `$include` تک‌فایلی پشتیبانی می‌شود، `plugins install/update/enable/disable/uninstall` در همان فایل include‌شده می‌نویسد و `openclaw.json` را دست‌نخورده می‌گذارد. includeهای root، آرایه‌های include و includeهایی با overrideهای sibling به‌جای flatten شدن fail closed می‌شوند. برای شکل‌های پشتیبانی‌شده، [includeهای پیکربندی](/fa/gateway/configuration) را ببینید.

    اگر پیکربندی هنگام نصب نامعتبر باشد، `plugins install` معمولا fail closed می‌شود و به شما می‌گوید ابتدا `openclaw doctor --fix` را اجرا کنید. هنگام startup و hot reload در Gateway، پیکربندی نامعتبر Plugin مانند هر پیکربندی نامعتبر دیگر fail closed می‌شود؛ `openclaw doctor --fix` می‌تواند entry نامعتبر Plugin را quarantine کند. تنها استثنای مستندشده در زمان نصب، یک مسیر بازیابی محدود برای Pluginهای همراه است که صراحتا در `openclaw.install.allowInvalidConfigRecovery` opt in می‌کنند.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` هدف نصب موجود را دوباره استفاده می‌کند و یک Plugin یا بسته hook نصب‌شده را درجا overwrite می‌کند. وقتی عمدا همان شناسه را از یک مسیر محلی جدید، archive، package در ClawHub یا artifact در npm دوباره نصب می‌کنید، از آن استفاده کنید. برای ارتقاهای معمول یک Plugin npm که از قبل track شده است، `openclaw plugins update <id-or-npm-spec>` را ترجیح دهید.

    اگر `plugins install` را برای شناسه Pluginی اجرا کنید که از قبل نصب شده است، OpenClaw متوقف می‌شود و برای یک ارتقای معمول شما را به `plugins update <id-or-npm-spec>` ارجاع می‌دهد، یا وقتی واقعا می‌خواهید نصب فعلی را از منبعی متفاوت overwrite کنید، به `plugins install <package> --force` ارجاع می‌دهد.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` فقط برای نصب‌های npm اعمال می‌شود. با نصب‌های `git:` پشتیبانی نمی‌شود؛ وقتی منبع pinned می‌خواهید، از یک ref صریح git مانند `git:github.com/acme/plugin@v1.2.3` استفاده کنید. با `--marketplace` پشتیبانی نمی‌شود، چون نصب‌های marketplace به‌جای spec مربوط به npm، metadata منبع marketplace را persist می‌کنند.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` منسوخ شده و اکنون no-op است. OpenClaw دیگر blocking داخلی کد خطرناک در زمان نصب را برای نصب‌های Plugin اجرا نمی‌کند.

    وقتی policy نصب ویژه host لازم است، از سطح مشترک و متعلق به operator یعنی `security.installPolicy` استفاده کنید. hookهای `before_install` در Plugin، hookهای چرخه‌عمر runtime Plugin هستند و مرز اصلی policy برای نصب‌های CLI نیستند.

    اگر Pluginی که در ClawHub منتشر کرده‌اید با scan registry پنهان یا block شده است، از مراحل publisher در [انتشار در ClawHub](/fa/clawhub/publishing) استفاده کنید. `--dangerously-force-unsafe-install` از ClawHub نمی‌خواهد Plugin را دوباره scan کند یا release مسدودشده را عمومی کند.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    نصب‌های community از ClawHub پیش از دانلود package، trust record مربوط به release انتخاب‌شده را بررسی می‌کنند. اگر ClawHub دانلود را برای release غیرفعال کند، یافته‌های scan مخرب را گزارش کند، یا release را در یک وضعیت moderation مسدودکننده مانند quarantine قرار دهد، OpenClaw آن release را رد می‌کند. برای وضعیت‌های scan پرریسک اما غیرمسدودکننده، وضعیت‌های moderation پرریسک، یا دلایل registry، OpenClaw جزئیات trust را نشان می‌دهد و پیش از ادامه confirmation می‌خواهد.

    فقط پس از مرور هشدار ClawHub و تصمیم به ادامه بدون prompt تعاملی، از `--acknowledge-clawhub-risk` استفاده کنید. trust recordهای clean که pending یا stale هستند هشدار می‌دهند اما acknowledgement لازم ندارند. packageهای رسمی ClawHub و منابع Plugin همراه OpenClaw این prompt مربوط به release-trust را bypass می‌کنند.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` همچنین سطح نصب برای بسته‌های hook است که `openclaw.hooks` را در `package.json` expose می‌کنند. برای visibility فیلترشده hook و فعال‌سازی جداگانه هر hook از `openclaw hooks` استفاده کنید، نه برای نصب package.

    specهای npm **فقط registry** هستند (نام package + **نسخه دقیق** اختیاری یا **dist-tag**). specهای Git/URL/file و rangeهای semver رد می‌شوند. نصب dependencyها در یک پروژه npm مدیریت‌شده برای هر Plugin با `--ignore-scripts` برای ایمنی اجرا می‌شود، حتی وقتی shell شما تنظیمات سراسری نصب npm دارد. پروژه‌های npm مدیریت‌شده Plugin، `overrides` در سطح package متعلق به OpenClaw را inherit می‌کنند، بنابراین pinهای امنیتی host برای dependencyهای hoisted مربوط به Plugin نیز اعمال می‌شوند.

    وقتی می‌خواهید resolution مربوط به npm را صریح کنید، از `npm:<package>` استفاده کنید. specهای package بدون prefix نیز در طول cutover راه‌اندازی مستقیما از npm نصب می‌شوند، مگر اینکه با شناسه رسمی Plugin تطبیق داشته باشند.

    مشخصه‌های خام بسته‌های `@openclaw/*` که با Pluginهای همراه مطابقت دارند، پیش از fallback به npm، به نسخهٔ همراه متعلق به image حل می‌شوند. برای مثال، `openclaw plugins install @openclaw/discord@2026.5.20 --pin` به‌جای ایجاد یک override مدیریت‌شدهٔ npm، از Plugin همراه Discord در build فعلی OpenClaw استفاده می‌کند. برای اجبار به استفاده از بستهٔ خارجی npm، از `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` استفاده کنید.

    مشخصه‌های bare و `@latest` روی مسیر پایدار باقی می‌مانند. نسخه‌های اصلاحی تاریخ‌دار OpenClaw مانند `2026.5.3-1` برای این بررسی releaseهای پایدار هستند. اگر npm هرکدام از آن‌ها را به یک prerelease حل کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک برچسب prerelease مانند `@beta`/`@rc` یا یک نسخهٔ prerelease دقیق مانند `@1.2.3-beta.4` صراحتاً اعلام موافقت کنید.

    برای نصب‌های npm بدون نسخهٔ دقیق (`npm:<package>` یا `npm:<package>@latest`)، OpenClaw پیش از نصب metadata بستهٔ حل‌شده را بررسی می‌کند. اگر آخرین بستهٔ پایدار به API جدیدتر Plugin در OpenClaw یا حداقل نسخهٔ میزبان جدیدتری نیاز داشته باشد، OpenClaw نسخه‌های پایدار قدیمی‌تر را بررسی می‌کند و به‌جای آن جدیدترین release سازگار را نصب می‌کند. نسخه‌های دقیق و dist-tagهای صریح مانند `@beta` سخت‌گیرانه باقی می‌مانند: اگر بستهٔ انتخاب‌شده ناسازگار باشد، فرمان شکست می‌خورد و از شما می‌خواهد OpenClaw را ارتقا دهید یا یک نسخهٔ سازگار انتخاب کنید.

    اگر یک مشخصهٔ نصب bare با شناسهٔ یک Plugin رسمی مطابقت داشته باشد (برای مثال `diffs`)، OpenClaw ورودی catalog را مستقیماً نصب می‌کند. برای نصب یک بستهٔ npm با همان نام، از یک مشخصهٔ scoped صریح استفاده کنید (برای مثال `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    برای نصب مستقیم از یک مخزن git از `git:<repo>` استفاده کنید. فرم‌های پشتیبانی‌شده شامل URLهای clone مانند `git:github.com/owner/repo`، `git:owner/repo`، `https://` کامل، `ssh://`، `git://`، `file://`، و `git@host:owner/repo.git` هستند. برای checkout کردن یک branch، tag، یا commit پیش از نصب، `@<ref>` یا `#<ref>` اضافه کنید.

    نصب‌های git در یک شاخهٔ موقت clone می‌شوند، در صورت وجود ref درخواست‌شده را checkout می‌کنند، سپس از نصب‌کنندهٔ عادی شاخهٔ Plugin استفاده می‌کنند. یعنی اعتبارسنجی manifest، سیاست نصب operator، کار نصب package-manager، و رکوردهای نصب مانند نصب‌های npm رفتار می‌کنند. نصب‌های git ثبت‌شده شامل URL/ref منبع به‌همراه commit حل‌شده هستند تا `openclaw plugins update` بتواند بعداً منبع را دوباره resolve کند.

    پس از نصب از git، از `openclaw plugins inspect <id> --runtime --json` استفاده کنید تا ثبت‌های runtime مانند متدهای gateway و فرمان‌های CLI را راستی‌آزمایی کنید. اگر Plugin یک ریشهٔ CLI را با `api.registerCli` ثبت کرده است، آن فرمان را مستقیماً از طریق CLI ریشهٔ OpenClaw اجرا کنید، برای مثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    archiveهای پشتیبانی‌شده: `.zip`، `.tgz`، `.tar.gz`، `.tar`. archiveهای بومی Pluginهای OpenClaw باید در ریشهٔ Plugin استخراج‌شده یک `openclaw.plugin.json` معتبر داشته باشند؛ archiveهایی که فقط شامل `package.json` هستند پیش از آن‌که OpenClaw رکوردهای نصب را بنویسد رد می‌شوند.

    وقتی فایل یک tarball از npm-pack است و می‌خواهید همان مسیر پروژهٔ npm مدیریت‌شدهٔ هر Plugin را که نصب‌های registry استفاده می‌کنند آزمایش کنید، از `npm-pack:<path.tgz>` استفاده کنید؛ از جمله راستی‌آزمایی `package-lock.json`، اسکن وابستگی‌های hoisted، و رکوردهای نصب npm. مسیرهای archive ساده همچنان به‌عنوان archiveهای محلی زیر ریشهٔ extensions مربوط به Plugin نصب می‌شوند.

    نصب‌های marketplace مربوط به Claude نیز پشتیبانی می‌شوند.

  </Accordion>
</AccordionGroup>

نصب‌های ClawHub از locator صریح `clawhub:<package>` استفاده می‌کنند:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

مشخصه‌های bare و امن برای npm مربوط به Plugin، در طول cutover راه‌اندازی به‌صورت پیش‌فرض از npm نصب می‌شوند، مگر آن‌که با شناسهٔ یک Plugin رسمی مطابقت داشته باشند:

```bash
openclaw plugins install openclaw-codex-app-server
```

برای صریح کردن resolve فقط از npm، از `npm:` استفاده کنید:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw پیش از نصب، سازگاری API تبلیغ‌شدهٔ Plugin / حداقل Gateway را بررسی می‌کند. وقتی نسخهٔ انتخاب‌شدهٔ ClawHub یک artifact از نوع ClawPack منتشر می‌کند، OpenClaw فایل npm-pack نسخه‌دار `.tgz` را دانلود می‌کند، header digest مربوط به ClawHub و digest artifact را راستی‌آزمایی می‌کند، سپس آن را از طریق مسیر عادی archive نصب می‌کند. نسخه‌های قدیمی‌تر ClawHub بدون metadata مربوط به ClawPack همچنان از طریق مسیر قدیمی راستی‌آزمایی archive بسته نصب می‌شوند. نصب‌های ثبت‌شده metadata منبع ClawHub، نوع artifact، integrity مربوط به npm، shasum مربوط به npm، نام tarball، و facts مربوط به digest در ClawPack را برای به‌روزرسانی‌های بعدی نگه می‌دارند.
نصب‌های بدون نسخهٔ ClawHub یک مشخصهٔ ثبت‌شدهٔ بدون نسخه را نگه می‌دارند تا `openclaw plugins update` بتواند releaseهای جدیدتر ClawHub را دنبال کند؛ selectorهای نسخه یا برچسب صریح مانند `clawhub:pkg@1.2.3` و `clawhub:pkg@beta` همچنان به همان selector پین می‌مانند.

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
  <Tab title="Marketplace sources">
    - یک نام marketplace شناخته‌شدهٔ Claude از `~/.claude/plugins/known_marketplaces.json`
    - ریشهٔ marketplace محلی یا مسیر `marketplace.json`
    - کوتاه‌نویسی مخزن GitHub مانند `owner/repo`
    - URL مخزن GitHub مانند `https://github.com/owner/repo`
    - یک URL مربوط به git

  </Tab>
  <Tab title="Remote marketplace rules">
    برای marketplaceهای remote که از GitHub یا git بارگذاری می‌شوند، ورودی‌های Plugin باید داخل مخزن marketplace clone‌شده باقی بمانند. OpenClaw منبع‌های مسیر نسبی از همان مخزن را می‌پذیرد و منبع‌های Plugin از نوع HTTP(S)، مسیر مطلق، git، GitHub، و دیگر منبع‌های غیرمسیر را از manifestهای remote رد می‌کند.
  </Tab>
</Tabs>

برای مسیرها و archiveهای محلی، OpenClaw به‌صورت خودکار تشخیص می‌دهد:

- Pluginهای بومی OpenClaw (`openclaw.plugin.json`)
- bundleهای سازگار با Codex (`.codex-plugin/plugin.json`)
- bundleهای سازگار با Claude (`.claude-plugin/plugin.json` یا چیدمان پیش‌فرض component در Claude)
- bundleهای سازگار با Cursor (`.cursor-plugin/plugin.json`)

نصب‌های محلی مدیریت‌شده باید شاخه‌های Plugin یا archive باشند. فایل‌های مستقل Plugin با پسوندهای `.js`، `.mjs`، `.cjs`، و `.ts` توسط `plugins install` در ریشهٔ Plugin مدیریت‌شده کپی نمی‌شوند؛ به‌جای آن، آن‌ها را صریحاً در `plugins.load.paths` فهرست کنید.

<Note>
bundleهای سازگار در ریشهٔ عادی Plugin نصب می‌شوند و در همان flow مربوط به list/info/enable/disable شرکت می‌کنند. امروز، Skills مربوط به bundle، command-skillهای Claude، پیش‌فرض‌های `settings.json` در Claude، پیش‌فرض‌های `.lsp.json` در Claude / `lspServers` اعلام‌شده در manifest، command-skillهای Cursor، و شاخه‌های hook سازگار با Codex پشتیبانی می‌شوند؛ قابلیت‌های دیگر bundle که تشخیص داده می‌شوند در diagnostics/info نمایش داده می‌شوند اما هنوز به اجرای runtime وصل نشده‌اند.
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
  از نمای جدول به خط‌های جزئیات هر Plugin با metadata مربوط به source/origin/version/activation تغییر بده.
</ParamField>
<ParamField path="--json" type="boolean">
  موجودی قابل خواندن برای ماشین به‌همراه diagnostics مربوط به registry و وضعیت نصب وابستگی‌های بسته.
</ParamField>

<Note>
`plugins list` ابتدا registry محلی ماندگارشدهٔ Plugin را می‌خواند، و وقتی registry وجود ندارد یا نامعتبر است از fallback مشتق‌شدهٔ فقط مبتنی بر manifest استفاده می‌کند. این فرمان برای بررسی این‌که آیا یک Plugin نصب شده، فعال است، و برای برنامه‌ریزی startup سرد قابل مشاهده است مفید است، اما یک probe زندهٔ runtime از یک پردازهٔ Gateway که از قبل در حال اجراست نیست. پس از تغییر کد Plugin، enablement، سیاست hook، یا `plugins.load.paths`، پیش از انتظار اجرای کد `register(api)` جدید یا hookها، Gatewayای را که به channel سرویس می‌دهد restart کنید. برای deploymentهای remote/container، راستی‌آزمایی کنید که child واقعی `openclaw gateway run` را restart می‌کنید، نه فقط یک پردازهٔ wrapper.

`plugins list --json` شامل `dependencyStatus` هر Plugin از `dependencies` و `optionalDependencies` در `package.json` است. OpenClaw بررسی می‌کند که آیا آن نام‌های بسته در مسیر lookup عادی `node_modules` مربوط به Node برای آن Plugin وجود دارند؛ کد runtime مربوط به Plugin را import نمی‌کند، package manager را اجرا نمی‌کند، یا وابستگی‌های گمشده را تعمیر نمی‌کند.
</Note>

اگر startup پیام `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` را log کرد، `openclaw plugins list --enabled --verbose` یا `openclaw plugins inspect <id>` را با یک شناسهٔ Plugin فهرست‌شده اجرا کنید تا شناسه‌های Plugin را تأیید کنید و شناسه‌های مورد اعتماد را در `plugins.allow` داخل `openclaw.json` کپی کنید. وقتی warning بتواند همهٔ Pluginهای کشف‌شده را فهرست کند، یک snippet آمادهٔ paste برای `plugins.allow` چاپ می‌کند که از قبل شامل همان شناسه‌هاست. اگر یک Plugin بدون provenance مربوط به install/load-path بارگذاری می‌شود، آن شناسهٔ Plugin را inspect کنید، سپس یا شناسهٔ مورد اعتماد را در `plugins.allow` پین کنید یا Plugin را از یک منبع مورد اعتماد دوباره نصب کنید تا OpenClaw provenance نصب را ثبت کند.

`plugins search` یک lookup در catalog remote مربوط به ClawHub است. این فرمان state محلی را inspect نمی‌کند، config را تغییر نمی‌دهد، بسته‌ها را نصب نمی‌کند، یا کد runtime مربوط به Plugin را بارگذاری نمی‌کند. نتایج جست‌وجو شامل نام بستهٔ ClawHub، family، channel، نسخه، summary، و یک راهنمای نصب مانند `openclaw plugins install clawhub:<package>` هستند.

برای کار روی Plugin همراه داخل یک image بسته‌بندی‌شدهٔ Docker، شاخهٔ source مربوط به Plugin را روی مسیر source بسته‌بندی‌شدهٔ متناظر bind-mount کنید، مانند `/app/extensions/synology-chat`. OpenClaw آن overlay مربوط به source mounted را پیش از `/app/dist/extensions/synology-chat` کشف می‌کند؛ یک شاخهٔ source که صرفاً کپی شده باشد inert می‌ماند تا نصب‌های بسته‌بندی‌شدهٔ عادی همچنان از dist کامپایل‌شده استفاده کنند.

برای debugging hookهای runtime:

- `openclaw plugins inspect <id> --runtime --json` hookهای ثبت‌شده و diagnostics حاصل از یک گذر inspection با module-loaded را نشان می‌دهد. inspection مربوط به runtime هرگز وابستگی‌ها را نصب نمی‌کند؛ برای پاک‌سازی state قدیمی وابستگی‌ها یا بازیابی Pluginهای دانلودشدنی گمشده‌ای که config به آن‌ها ارجاع داده است، از `openclaw doctor --fix` استفاده کنید.
- `openclaw gateway status --deep --require-rpc` URL/profile قابل دسترسی Gateway، hintهای service/process، مسیر config، و سلامت RPC را تأیید می‌کند.
- hookهای conversation غیرهمراه (`llm_input`، `llm_output`، `before_model_resolve`، `before_agent_reply`، `before_agent_run`، `before_agent_finalize`، `agent_end`) به `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.

برای جلوگیری از کپی کردن یک شاخهٔ Plugin محلی، از `--link` استفاده کنید (به `plugins.load.paths` اضافه می‌کند):

```bash
openclaw plugins install -l ./my-plugin
```

فایل‌های مستقل Plugin باید به‌جای نصب با `plugins install` یا قرار گرفتن مستقیم در `~/.openclaw/extensions` یا `<workspace>/.openclaw/extensions`، در `plugins.load.paths` فهرست شوند. آن ریشه‌های auto-discovered شاخه‌های package یا bundle مربوط به Plugin را بارگذاری می‌کنند، درحالی‌که فایل‌های script سطح بالا به‌عنوان helperهای محلی در نظر گرفته می‌شوند و skip می‌شوند.

<Note>
Plugin‌های با مبدأ workspace که از ریشهٔ extensions یک فضای کاری کشف می‌شوند، تا زمانی که به‌صراحت فعال نشده باشند
import یا اجرا نمی‌شوند. برای توسعهٔ محلی،
`openclaw plugins enable <plugin-id>` را اجرا کنید یا
`plugins.entries.<plugin-id>.enabled: true` را تنظیم کنید؛ اگر پیکربندی شما از
`plugins.allow` استفاده می‌کند، همان شناسهٔ Plugin را آنجا هم وارد کنید. این قاعدهٔ بسته‌ماندن در حالت خطا
همچنین زمانی اعمال می‌شود که راه‌اندازی کانال، یک Plugin با مبدأ workspace را به‌صراحت برای
بارگذاری فقط مخصوص setup هدف می‌گیرد، بنابراین کد setup Plugin کانال محلی تا وقتی آن
Plugin فضای کاری غیرفعال بماند یا از فهرست مجاز کنار گذاشته شده باشد اجرا نمی‌شود. نصب‌های لینک‌شده
و ورودی‌های صریح `plugins.load.paths` از سیاست عادی مربوط به
مبدأ Plugin حل‌شدهٔ خود پیروی می‌کنند. ببینید
[پیکربندی سیاست Plugin](/fa/tools/plugin#configure-plugin-policy)
و [مرجع پیکربندی](/fa/gateway/configuration-reference#plugins).

`--force` همراه با `--link` پشتیبانی نمی‌شود، چون نصب‌های لینک‌شده به‌جای کپی کردن روی مقصد نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کنند.

برای نصب‌های npm از `--pin` استفاده کنید تا spec دقیق حل‌شده (`name@version`) در نمایهٔ Plugin مدیریت‌شده ذخیره شود، در حالی که رفتار پیش‌فرض بدون pin باقی می‌ماند.
</Note>

### نمایهٔ Plugin

فرادادهٔ نصب Plugin وضعیت مدیریت‌شده توسط ماشین است، نه پیکربندی کاربر. نصب‌ها و به‌روزرسانی‌ها آن را در پایگاه دادهٔ وضعیت SQLite مشترک، زیر دایرکتوری وضعیت فعال OpenClaw، می‌نویسند. ردیف `installed_plugin_index` فرادادهٔ پایدار `installRecords` را ذخیره می‌کند، از جمله رکوردهای manifestهای خراب یا گم‌شدهٔ Plugin، به‌علاوهٔ یک cache سرد registry مشتق‌شده از manifest که توسط `openclaw plugins update`، حذف نصب، diagnostics و registry سرد Plugin استفاده می‌شود.

وقتی OpenClaw رکوردهای legacy ارسال‌شدهٔ `plugins.installs` را در پیکربندی می‌بیند، خواندن‌های runtime با آن‌ها به‌عنوان ورودی سازگاری رفتار می‌کنند، بدون اینکه `openclaw.json` را بازنویسی کنند. نوشتن‌های صریح Plugin و `openclaw doctor --fix` آن رکوردها را به نمایهٔ Plugin منتقل می‌کنند و وقتی نوشتن پیکربندی مجاز باشد کلید پیکربندی را حذف می‌کنند؛ اگر هر یک از این نوشتن‌ها شکست بخورد، رکوردهای پیکربندی نگه داشته می‌شوند تا فرادادهٔ نصب از دست نرود.

### حذف نصب

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` رکوردهای Plugin را از `plugins.entries`، نمایهٔ پایدار Plugin، ورودی‌های فهرست allow/deny مربوط به Plugin، و در صورت کاربرد، ورودی‌های لینک‌شدهٔ `plugins.load.paths` حذف می‌کند. مگر اینکه `--keep-files` تنظیم شده باشد، حذف نصب همچنین دایرکتوری نصب مدیریت‌شدهٔ ردیابی‌شده را وقتی داخل ریشهٔ extensions مربوط به Plugin‌های OpenClaw باشد حذف می‌کند. برای Plugin‌های active memory، slot حافظه به `memory-core` بازنشانی می‌شود.

<Note>
`--keep-config` به‌عنوان یک alias منسوخ برای `--keep-files` پشتیبانی می‌شود.
</Note>

### به‌روزرسانی

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

به‌روزرسانی‌ها روی نصب‌های Plugin ردیابی‌شده در نمایهٔ Plugin مدیریت‌شده و نصب‌های hook-pack ردیابی‌شده در `hooks.internal.installs` اعمال می‌شوند.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    وقتی یک شناسهٔ Plugin می‌دهید، OpenClaw از spec نصب ثبت‌شده برای همان Plugin دوباره استفاده می‌کند. یعنی dist-tagهای ذخیره‌شدهٔ قبلی مانند `@beta` و نسخه‌های دقیق pin‌شده همچنان در اجراهای بعدی `update <id>` استفاده می‌شوند.

    این قاعدهٔ به‌روزرسانی هدفمند با مسیر نگهداشت گروهی `openclaw plugins update --all` متفاوت است. به‌روزرسانی‌های گروهی همچنان به specهای نصب ردیابی‌شدهٔ معمول احترام می‌گذارند، اما رکوردهای Plugin رسمی و مورد اعتماد OpenClaw می‌توانند به‌جای ماندن روی یک بستهٔ رسمی دقیق و stale، با هدف فعلی کاتالوگ رسمی همگام شوند. وقتی عمداً می‌خواهید یک spec رسمی دقیق یا tag‌شده دست‌نخورده بماند، از `update <id>` هدفمند استفاده کنید.

    برای نصب‌های npm، می‌توانید یک spec صریح بستهٔ npm همراه با dist-tag یا نسخهٔ دقیق هم بدهید. OpenClaw نام آن بسته را به رکورد Plugin ردیابی‌شده برمی‌گرداند، همان Plugin نصب‌شده را به‌روزرسانی می‌کند و spec جدید npm را برای به‌روزرسانی‌های آیندهٔ مبتنی بر شناسه ثبت می‌کند.

    دادن نام بستهٔ npm بدون نسخه یا tag نیز به رکورد Plugin ردیابی‌شده برمی‌گردد. وقتی یک Plugin به نسخه‌ای دقیق pin شده و می‌خواهید آن را به خط انتشار پیش‌فرض registry برگردانید، از این روش استفاده کنید.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update <id-or-npm-spec>` هدفمند، مگر اینکه spec جدیدی بدهید، از spec Plugin ردیابی‌شده دوباره استفاده می‌کند. `openclaw plugins update --all` گروهی وقتی رکوردهای Plugin رسمی و مورد اعتماد را با هدف کاتالوگ رسمی همگام می‌کند، از `update.channel` پیکربندی‌شده استفاده می‌کند، بنابراین نصب‌های beta-channel می‌توانند روی خط انتشار beta بمانند، به‌جای اینکه بی‌صدا به stable/latest نرمال شوند.

    `openclaw update` کانال به‌روزرسانی فعال OpenClaw را هم می‌شناسد: روی کانال beta، رکوردهای Plugin پیش‌فرض npm و ClawHub ابتدا `@beta` را امتحان می‌کنند. اگر هیچ انتشار beta برای Plugin وجود نداشته باشد، به spec پیش‌فرض/latest ثبت‌شده برمی‌گردند؛ Plugin‌های npm همچنین وقتی بستهٔ beta وجود دارد اما اعتبارسنجی نصب آن شکست می‌خورد، fallback می‌کنند. آن fallback به‌صورت هشدار گزارش می‌شود و به‌روزرسانی core را fail نمی‌کند. نسخه‌های دقیق و tagهای صریح برای به‌روزرسانی‌های هدفمند روی همان selector pin می‌مانند.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    پیش از یک به‌روزرسانی زندهٔ npm، OpenClaw نسخهٔ بستهٔ نصب‌شده را با فرادادهٔ registry npm بررسی می‌کند. اگر نسخهٔ نصب‌شده و هویت artifact ثبت‌شده از قبل با هدف حل‌شده مطابقت داشته باشند، به‌روزرسانی بدون دانلود، نصب دوباره، یا بازنویسی `openclaw.json` رد می‌شود.

    وقتی یک hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact دریافت‌شده تغییر کند، OpenClaw این وضعیت را به‌عنوان drift artifact npm در نظر می‌گیرد. فرمان تعاملی `openclaw plugins update` hashهای مورد انتظار و واقعی را چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. helperهای به‌روزرسانی غیرتعاملی به‌صورت fail-closed شکست می‌خورند، مگر اینکه caller یک سیاست ادامهٔ صریح فراهم کند.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` برای سازگاری روی `plugins update` هم پذیرفته می‌شود، اما منسوخ شده و دیگر رفتار به‌روزرسانی Plugin را تغییر نمی‌دهد. `security.installPolicy` اپراتور همچنان می‌تواند به‌روزرسانی‌ها را مسدود کند؛ hookهای `before_install` مربوط به Plugin فقط در فرایندهایی اعمال می‌شوند که hookهای Plugin در آن‌ها بارگذاری شده‌اند.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    به‌روزرسانی‌های Plugin مبتنی بر ClawHub جامعه، پیش از دانلود بستهٔ جایگزین، همان بررسی اعتماد exact-release نصب‌ها را اجرا می‌کنند. برای automation بازبینی‌شده‌ای که باید وقتی انتشار انتخاب‌شدهٔ ClawHub هشدار اعتماد پرریسک دارد ادامه دهد، از `--acknowledge-clawhub-risk` استفاده کنید. بسته‌های رسمی ClawHub و منابع Plugin همراه OpenClaw از این prompt اعتماد انتشار عبور می‌کنند.
  </Accordion>
</AccordionGroup>

### بازرسی

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect هویت، وضعیت بارگذاری، منبع، قابلیت‌های manifest، flagهای سیاست، diagnostics، فرادادهٔ نصب، قابلیت‌های bundle، و هر پشتیبانی تشخیص‌داده‌شدهٔ MCP یا LSP server را به‌صورت پیش‌فرض بدون import کردن runtime Plugin نشان می‌دهد. خروجی JSON شامل قراردادهای manifest مربوط به Plugin است، مانند `contracts.agentToolResultMiddleware` و `contracts.trustedToolPolicies`، تا اپراتورها بتوانند اعلان‌های سطح مورد اعتماد را پیش از فعال‌سازی یا راه‌اندازی دوبارهٔ یک Plugin audit کنند. برای بارگذاری module مربوط به Plugin و شامل کردن hookها، tools، commands، services، gateway methods و HTTP routes ثبت‌شده، `--runtime` را اضافه کنید. بازرسی runtime وابستگی‌های گم‌شدهٔ Plugin را مستقیماً گزارش می‌کند؛ نصب‌ها و repairها در `openclaw plugins install`، `openclaw plugins update`، و `openclaw doctor --fix` باقی می‌مانند.

فرمان‌های CLI متعلق به Plugin معمولاً به‌عنوان گروه‌های فرمان root `openclaw` نصب می‌شوند، اما Plugin‌ها همچنین می‌توانند فرمان‌های nested را زیر یک parent متعلق به core مانند `openclaw nodes` ثبت کنند. پس از اینکه `inspect --runtime` یک فرمان را زیر `cliCommands` نشان داد، آن را در مسیر فهرست‌شده اجرا کنید؛ برای نمونه Pluginای که `demo-git` را ثبت می‌کند می‌تواند با `openclaw demo-git ping` راستی‌آزمایی شود.

هر Plugin بر اساس آنچه واقعاً در runtime ثبت می‌کند طبقه‌بندی می‌شود:

- **plain-capability** — یک نوع capability، مانند یک Plugin فقط provider
- **hybrid-capability** — چند نوع capability، مانند text + speech + images
- **hook-only** — فقط hookها، بدون capability یا surface
- **non-capability** — tools/commands/services اما بدون capability

برای اطلاعات بیشتر دربارهٔ مدل capability، [شکل‌های Plugin](/fa/plugins/architecture#plugin-shapes) را ببینید.

<Note>
flag `--json` گزارشی machine-readable مناسب برای scripting و auditing خروجی می‌دهد. `inspect --all` جدولی fleet-wide با ستون‌های shape، گونه‌های capability، notices سازگاری، bundle capabilities و خلاصهٔ hook رندر می‌کند. `info` یک alias برای `inspect` است.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` خطاهای بارگذاری Plugin، diagnostics مربوط به manifest/discovery، notices سازگاری، و ارجاع‌های stale پیکربندی Plugin مانند slotهای گم‌شدهٔ Plugin را گزارش می‌کند. وقتی درخت نصب و پیکربندی Plugin پاک باشند، `No plugin issues detected.` را چاپ می‌کند. اگر پیکربندی stale باقی مانده باشد اما درخت نصب در غیر این صورت سالم باشد، summary همین را می‌گوید، به‌جای اینکه سلامت کامل Plugin را القا کند.

اگر یک Plugin پیکربندی‌شده روی disk حاضر باشد اما توسط بررسی‌های path-safety مربوط به loader مسدود شود، اعتبارسنجی پیکربندی ورودی Plugin را نگه می‌دارد و آن را به‌صورت `present but blocked` گزارش می‌کند. به‌جای حذف پیکربندی `plugins.entries.<id>` یا `plugins.allow`، diagnostic قبلیِ Plugin مسدودشده را، مانند ownership مسیر یا مجوزهای world-writable، رفع کنید.

برای شکست‌های module-shape مانند exportهای گم‌شدهٔ `register`/`activate`، دوباره با `OPENCLAW_PLUGIN_LOAD_DEBUG=1` اجرا کنید تا یک خلاصهٔ فشردهٔ export-shape در خروجی diagnostic گنجانده شود.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

registry محلی Plugin مدل خواندن سرد و پایدار OpenClaw برای هویت Plugin نصب‌شده، enablement، فرادادهٔ منبع، و مالکیت contribution است. startup عادی، lookup مالک provider، طبقه‌بندی setup کانال، و inventory Plugin می‌توانند آن را بدون import کردن moduleهای runtime Plugin بخوانند.

برای بررسی اینکه registry پایدار حاضر، جاری، یا stale است، از `plugins registry` استفاده کنید. برای ساخت دوبارهٔ آن از نمایهٔ پایدار Plugin، سیاست پیکربندی، و فرادادهٔ manifest/package از `--refresh` استفاده کنید. این یک مسیر repair است، نه مسیر فعال‌سازی runtime.

`openclaw doctor --fix` همچنین drift مدیریت‌شدهٔ npm نزدیک به registry را repair می‌کند: اگر یک بستهٔ orphaned یا recovered با نام `@openclaw/*` زیر یک پروژهٔ npm مدیریت‌شدهٔ Plugin یا ریشهٔ legacy flat managed npm، یک Plugin همراه را shadow کند، doctor آن بستهٔ stale را حذف می‌کند و registry را دوباره می‌سازد تا startup در برابر manifest همراه اعتبارسنجی شود. Doctor همچنین بستهٔ host `openclaw` را به Plugin‌های npm مدیریت‌شده‌ای که `peerDependencies.openclaw` اعلام می‌کنند relink می‌کند، تا importهای runtime محلی بسته مانند `openclaw/plugin-sdk/*` پس از به‌روزرسانی‌ها یا repairهای npm resolve شوند.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` یک switch سازگاری break-glass منسوخ برای شکست‌های خواندن registry است. `plugins registry --refresh` یا `openclaw doctor --fix` را ترجیح دهید؛ fallback env فقط برای بازیابی اضطراری startup هنگام rollout شدن migration است.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

فهرست Marketplace یک مسیر marketplace محلی، یک مسیر `marketplace.json`، یک shorthand گیت‌هاب مانند `owner/repo`، یک URL repo گیت‌هاب، یا یک URL git را می‌پذیرد. `--json` برچسب منبع حل‌شده به‌علاوهٔ manifest marketplace parse‌شده و ورودی‌های Plugin را چاپ می‌کند.

## مرتبط

- [ساخت Plugin‌ها](/fa/plugins/building-plugins)
- [مرجع CLI](/fa/cli)
- [ClawHub](/fa/clawhub)

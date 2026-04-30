---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شد یا اجرا نشد
    - شما در حال عیب‌یابی بررسی‌های ناموفق GitHub Actions هستید
summary: گراف کارهای CI، گیت‌های محدوده، و معادل‌های فرمان محلی
title: خط لوله یکپارچه‌سازی مداوم
x-i18n:
    generated_at: "2026-04-30T00:06:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8ebc01707b673ab866c584abdfa5ccb8064d580f3a250c60304c2d056d109dc
    source_path: ci.md
    workflow: 16
---

CI در هر push به `main` و هر pull request اجرا می‌شود. از محدوده‌بندی هوشمند استفاده می‌کند تا وقتی فقط بخش‌های نامرتبط تغییر کرده‌اند، کارهای پرهزینه را رد کند. اجراهای دستی `workflow_dispatch` عمدا محدوده‌بندی هوشمند را دور می‌زنند و گراف کامل CI عادی را برای نامزدهای انتشار یا اعتبارسنجی گسترده پخش می‌کنند؛ مسیرهای Android برای اجراهای دستی مستقل از طریق `include_android` اختیاری هستند. مسیرهای prerelease مخصوص انتشار برای Pluginها در workflow جداگانه `Plugin Prerelease` قرار دارند و فقط از `Full Release Validation` یا dispatch دستی صریح اجرا می‌شوند.

شارد `check-dependencies` دستور `pnpm deadcode:dependencies` را اجرا می‌کند؛ یک گذر production فقط برای وابستگی‌های Knip که به آخرین نسخه Knip مورد استفاده آن اسکریپت سنجاق شده است، با غیرفعال بودن حداقل سن انتشار pnpm برای نصب `dlx`. همچنین `pnpm deadcode:unused-files` را اجرا می‌کند که یافته‌های فایل‌های استفاده‌نشده production از Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. این محافظ وقتی یک PR فایل استفاده‌نشده جدید و بازبینی‌نشده‌ای اضافه کند یا پس از پاک‌سازی یک ورودی allowlist کهنه باقی بگذارد، شکست می‌خورد؛ در عین حال سطوح عمدی مربوط به Plugin پویا، تولیدشده، build، live-test و پل package را که Knip نمی‌تواند به‌صورت ایستا resolve کند، حفظ می‌کند.

`Full Release Validation` workflow چتری دستی برای «اجرای همه چیز پیش از انتشار» است. یک branch، tag یا commit SHA کامل می‌پذیرد، workflow دستی `CI` را با آن هدف dispatch می‌کند، `Plugin Prerelease` را برای اثبات مخصوص انتشارِ Plugin/package/static/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، package acceptance، suiteهای مسیر انتشار Docker، live/E2E، OpenWebUI، برابری QA Lab، Matrix و مسیرهای Telegram dispatch می‌کند. همچنین وقتی یک spec package منتشرشده ارائه شود، می‌تواند workflow پس از انتشار `NPM Telegram Beta E2E` را اجرا کند. `release_profile=minimum|stable|full` گستره live/provider ارسال‌شده به release checks را کنترل می‌کند: `minimum` سریع‌ترین مسیرهای حیاتی انتشار OpenAI/core را نگه می‌دارد، `stable` مجموعه پایدار provider/backend را اضافه می‌کند، و `full` ماتریس گسترده advisory provider/media را اجرا می‌کند. چتر، شناسه‌های اجرای child dispatch‌شده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی اجرای child را دوباره بررسی می‌کند و جدول‌های کندترین job را برای هر اجرای child پیوست می‌کند. اگر یک workflow فرزند دوباره اجرا شود و سبز شود، فقط job verifier والد را دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی تازه شود.

برای بازیابی، `Full Release Validation` و `OpenClaw Release Checks` هر دو `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all` استفاده کنید، برای فقط child کامل CI عادی از `ci`، برای هر child انتشار از `release-checks`، یا یک گروه انتشار محدودتر: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار rerun یک جعبه انتشار شکست‌خورده را پس از یک اصلاح متمرکز محدود نگه می‌دارد.

فرزند live/E2E انتشار، پوشش گسترده native `pnpm test:live` را حفظ می‌کند، اما آن را به‌جای یک job سریالی، به‌صورت شاردهای نام‌گذاری‌شده (`native-live-src-agents`، `native-live-src-gateway-core`، jobهای provider-filtered `native-live-src-gateway-profiles`، `native-live-src-gateway-backends`، `native-live-test`، `native-live-extensions-a-k`، `native-live-extensions-l-n`، `native-live-extensions-openai`، `native-live-extensions-o-z-other`، `native-live-extensions-xai`، شاردهای جداشده media audio/video، و شاردهای music با provider-filtered) از طریق `scripts/test-live-shard.mjs` اجرا می‌کند. این کار همان پوشش فایل را نگه می‌دارد و در عین حال rerun و عیب‌یابی شکست‌های کند provider زنده را آسان‌تر می‌کند. نام‌های شارد تجمعی `native-live-extensions-o-z`، `native-live-extensions-media` و `native-live-extensions-media-music` همچنان برای rerunهای دستی یک‌باره معتبر می‌مانند.

شاردهای native live media در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط workflow `Live Media Runner Image` ساخته می‌شود. آن image، `ffmpeg` و `ffprobe` را از پیش نصب می‌کند؛ jobهای media فقط binaryها را پیش از setup بررسی می‌کنند. suiteهای live متکی بر Docker را روی runnerهای عادی Blacksmith نگه دارید، چون container jobها محل نادرستی برای اجرای تست‌های Docker تو‌در‌تو هستند.

شاردهای live model/backend متکی بر Docker از یک image مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` برای هر commit انتخاب‌شده استفاده می‌کنند. workflow live release آن image را یک بار می‌سازد و push می‌کند، سپس شاردهای Docker live model، Gateway، CLI backend، ACP bind و Codex harness با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. اگر این شاردها هدف Docker کامل source را مستقل دوباره بسازند، اجرای انتشار بدپیکربندی شده است و زمان wall clock را روی ساخت‌های تکراری image هدر می‌دهد.

`OpenClaw Release Checks` از ref مطمئن workflow استفاده می‌کند تا ref انتخاب‌شده را یک بار به tarball `release-package-under-test` resolve کند، سپس آن artifact را هم به workflow Docker مسیر انتشار live/E2E و هم به شارد package acceptance پاس می‌دهد. این کار byteهای package را در جعبه‌های انتشار یکسان نگه می‌دارد و از repack کردن همان نامزد در چند job فرزند جلوگیری می‌کند.

`Package Acceptance` workflow جانبی برای اعتبارسنجی یک artifact package بدون مسدود کردن workflow انتشار است. این workflow یک نامزد را از یک spec npm منتشرشده، یک `package_ref` مطمئن ساخته‌شده با harness انتخاب‌شده `workflow_ref`، یک URL tarball از نوع HTTPS با SHA-256، یا یک artifact tarball از اجرای دیگر GitHub Actions resolve می‌کند، آن را به‌عنوان `package-under-test` آپلود می‌کند، سپس scheduler Docker release/E2E را با آن tarball به‌جای repack کردن checkout workflow دوباره استفاده می‌کند. Profileها smoke، package، product، full و انتخاب‌های custom Docker lane را پوشش می‌دهند. profile `package` از پوشش Plugin آفلاین استفاده می‌کند تا اعتبارسنجی package منتشرشده وابسته به دسترس‌بودن live ClawHub نباشد. مسیر اختیاری Telegram از artifact `package-under-test` در workflow `NPM Telegram Beta E2E` دوباره استفاده می‌کند، و مسیر spec npm منتشرشده برای dispatchهای مستقل حفظ می‌شود.

## پذیرش package

از `Package Acceptance` وقتی استفاده کنید که پرسش این است: «آیا این package قابل نصب OpenClaw به‌عنوان محصول کار می‌کند؟» این با CI عادی متفاوت است: CI عادی درخت source را اعتبارسنجی می‌کند، در حالی که package acceptance یک tarball واحد را از طریق همان Docker E2E harness که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند، اعتبارسنجی می‌کند.

این workflow چهار job دارد:

1. `resolve_package`، `workflow_ref` را checkout می‌کند، یک نامزد package را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact `package-under-test` آپلود می‌کند، و source، workflow ref، package ref، version، SHA-256 و profile را در خلاصه step در GitHub چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. workflow قابل استفاده مجدد آن artifact را دانلود می‌کند، موجودی tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker با package-digest را آماده می‌کند، و مسیرهای Docker انتخاب‌شده را به‌جای pack کردن checkout workflow، علیه آن package اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب کند، workflow قابل استفاده مجدد package و imageهای مشترک را یک بار آماده می‌کند، سپس آن laneها را به‌صورت jobهای Docker هدفمند موازی با artifactهای منحصربه‌فرد پخش می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و وقتی Package Acceptance یکی را resolve کرده باشد، همان artifact `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec npm منتشرشده را نصب کند.
4. `summary` اگر resolve package، Docker acceptance یا مسیر اختیاری Telegram شکست خورده باشد، workflow را fail می‌کند.

منابع نامزد:

- `source=npm`: فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش beta/stable منتشرشده استفاده کنید.
- `source=ref`: یک branch، tag یا commit SHA کامل مطمئن `package_ref` را pack می‌کند. resolver، branchها/tagهای OpenClaw را fetch می‌کند، بررسی می‌کند commit انتخاب‌شده از تاریخچه branch مخزن یا یک tag انتشار قابل دسترسی باشد، deps را در یک worktree جداشده نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` pack می‌کند.
- `source=url`: یک `.tgz` از HTTPS دانلود می‌کند؛ `package_sha256` الزامی است.
- `source=artifact`: یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما باید برای artifactهای به‌اشتراک‌گذاشته‌شده خارجی ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد workflow/harness مطمئنی است که تست را اجرا می‌کند. `package_ref`، commit منبعی است که وقتی `source=ref` باشد pack می‌شود. این اجازه می‌دهد harness تست فعلی، commitهای منبع مطمئن قدیمی‌تر را بدون اجرای منطق workflow قدیمی اعتبارسنجی کند.

Profileها به پوشش Docker نگاشت می‌شوند:

- `smoke`: `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package`: `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `bundled-channel-deps-compat`، `plugins-offline`، `plugin-update`
- `product`: `package` به‌علاوه `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full`: قطعه‌های کامل مسیر انتشار Docker با OpenWebUI
- `custom`: `docker_lanes` دقیق؛ وقتی `suite_profile=custom` باشد الزامی است

Release checks، Package Acceptance را با `source=ref`، `package_ref=<release-ref>`، `workflow_ref=<release workflow ref>`، `suite_profile=custom`، `docker_lanes='bundled-channel-deps-compat plugins-offline'` و `telegram_mode=mock-openai` فراخوانی می‌کند. قطعه‌های Docker مسیر انتشار، laneهای هم‌پوشان package/update/plugin را پوشش می‌دهند، در حالی که Package Acceptance اثبات bundled-channel compat بومی artifact، Plugin آفلاین و Telegram را علیه همان tarball package resolve‌شده نگه می‌دارد.
Cross-OS release checks همچنان onboarding، installer و رفتار platform مختص OS را پوشش می‌دهد؛ اعتبارسنجی محصول package/update باید با Package Acceptance شروع شود. laneهای fresh مربوط به packaged و installer در Windows نیز بررسی می‌کنند که یک package نصب‌شده بتواند یک browser-control override را از یک مسیر خام مطلق Windows import کند. smoke مربوط به agent-turn در OpenAI cross-OS به‌صورت پیش‌فرض وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4-mini` استفاده می‌کند، تا اثبات نصب و Gateway سریع و قطعی بماند. laneهای اختصاصی live provider/model همچنان مسیریابی گسترده‌تر model، از جمله پیش‌فرض‌های کندتر frontier، را پوشش می‌دهند.

Package Acceptance پنجره‌های legacy-compatibility محدود برای packageهایی دارد که از قبل منتشر شده‌اند. packageهای تا `2026.4.25`، از جمله `2026.4.25-beta.*`، ممکن است از مسیر سازگاری برای ورودی‌های شناخته‌شده QA خصوصی در `dist/postinstall-inventory.json` استفاده کنند که به فایل‌های حذف‌شده از tarball اشاره می‌کنند؛ `doctor-switch` ممکن است زیرحالت persistence مربوط به `gateway install --wrapper` را وقتی package آن flag را expose نمی‌کند رد کند؛ `update-channel-switch` ممکن است `pnpm.patchedDependencies` مفقود را از fake git fixture مشتق‌شده از tarball prune کند و ممکن است `update.channel` persist‌شده مفقود را log کند؛ smokeهای Plugin ممکن است مکان‌های legacy install-record را بخوانند یا persistence مفقود marketplace install-record را بپذیرند؛ و `plugin-update` ممکن است migration metadata پیکربندی را اجازه دهد، در حالی که همچنان الزام می‌کند install record و رفتار no-reinstall بدون تغییر بمانند. package منتشرشده `2026.4.26` نیز ممکن است برای فایل‌های stamp مربوط به metadata ساخت محلی که قبلا منتشر شده بودند هشدار دهد. packageهای بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای warn یا skip، fail می‌شوند.

مثال‌ها:

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

هنگام اشکال‌زدایی اجرای ناموفق پذیرش بسته، از خلاصه‌ی `resolve_package`
شروع کنید تا منبع بسته، نسخه و SHA-256 را تأیید کنید. سپس اجرای فرزند
`docker_acceptance` و آرتیفکت‌های Docker آن را بررسی کنید:
`.artifacts/docker-tests/**/summary.json`، `failures.json`، لاگ‌های lane، زمان‌بندی‌های phase
و دستورهای اجرای دوباره. به‌جای اجرای دوباره‌ی اعتبارسنجی کامل انتشار، ترجیحاً پروفایل بسته‌ی ناموفق یا
laneهای دقیق Docker را دوباره اجرا کنید.

QA Lab laneهای CI اختصاصی بیرون از workflow اصلی با scope هوشمند دارد.
workflow `Parity gate` روی تغییرات PR مطابق و dispatch دستی اجرا می‌شود؛
runtime خصوصی QA را می‌سازد و packهای agentic مربوط به mock GPT-5.5 و Opus 4.6 را
مقایسه می‌کند. workflow `QA-Lab - All Lanes` هر شب روی `main` و با
dispatch دستی اجرا می‌شود؛ gate برابری mock، lane زنده‌ی Matrix و laneهای زنده‌ی
Telegram و Discord را به‌صورت jobهای موازی پخش می‌کند. jobهای زنده از محیط
`qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند. بررسی‌های انتشار
laneهای transport زنده‌ی Matrix و Telegram را با provider mock قطعی و مدل‌های واجد شرایط mock
(`mock-openai/gpt-5.5` و
`mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا contract کانال از تأخیر مدل زنده
و راه‌اندازی عادی provider-plugin جدا بماند. Gateway زنده‌ی transport همچنین
جست‌وجوی memory را غیرفعال می‌کند، چون برابری QA رفتار memory را جداگانه پوشش می‌دهد؛
اتصال provider توسط suiteهای جداگانه‌ی مدل زنده، provider بومی و provider Docker پوشش داده می‌شود. Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند،
و فقط وقتی CLI checkout شده از آن پشتیبانی کند، `--fail-fast` را اضافه می‌کند. پیش‌فرض CLI
و ورودی workflow دستی همچنان `all` است؛ dispatch دستی `matrix_profile=all`
همیشه پوشش کامل Matrix را به jobهای `transport`، `media`،
`e2ee-smoke`، `e2ee-deep` و `e2ee-cli` shard می‌کند. `OpenClaw Release Checks` همچنین
laneهای حیاتی انتشار QA Lab را پیش از تأیید انتشار اجرا می‌کند؛ gate برابری QA آن
packهای candidate و baseline را به‌صورت jobهای lane موازی اجرا می‌کند، سپس
هر دو آرتیفکت را در یک job گزارش کوچک دانلود می‌کند تا مقایسه‌ی نهایی برابری انجام شود.
مسیر landing PR را پشت `Parity gate` قرار ندهید، مگر اینکه تغییر واقعاً
runtime QA، برابری model-pack یا surfaceای را لمس کند که workflow برابری مالک آن است.
برای اصلاحات عادی کانال، config، docs یا unit-test، آن را یک سیگنال اختیاری
در نظر بگیرید و به شواهد CI/check دارای scope عمل کنید.

workflow `Duplicate PRs After Merge` یک workflow دستی نگه‌دارنده برای
پاک‌سازی duplicate پس از land است. به‌صورت پیش‌فرض dry-run است و فقط PRهای صراحتاً
فهرست‌شده را وقتی `apply=true` باشد می‌بندد. پیش از تغییر دادن GitHub، تأیید می‌کند که
PR land شده merge شده است و هر duplicate یا issue ارجاع‌شده‌ی مشترک دارد
یا hunkهای تغییر یافته‌ی هم‌پوشان.

workflow `CodeQL` عمداً یک scanner امنیتی narrow first-pass است،
نه sweep کامل repository. اجراهای روزانه و دستی، کد workflowهای Actions
به‌علاوه‌ی پرریسک‌ترین surfaceهای احراز هویت، secrets، sandbox، Cron و
Gateway در JavaScript/TypeScript را با queryهای امنیتی high-precision زیر category
`/codeql-critical-security/core-auth-secrets` scan می‌کنند. job
channel-runtime-boundary به‌صورت جداگانه contractهای پیاده‌سازی کانال core
به‌علاوه‌ی runtime کانال Plugin، Gateway، Plugin SDK، secrets و
touchpointهای audit را زیر category `/codeql-critical-security/channel-runtime-boundary`
scan می‌کند تا سیگنال امنیت کانال بتواند بدون گسترده‌تر کردن category پایه‌ی
auth/secrets مقیاس بگیرد. job network-ssrf-boundary سطح‌های SSRF در core، parsing IP،
network guard، web-fetch و سیاست SSRF در Plugin SDK را زیر category
`/codeql-critical-security/network-ssrf-boundary` scan می‌کند تا سیگنال مرز اعتماد شبکه
از baseline امنیتی auth/secrets جدا بماند.
job mcp-process-tool-boundary سرورهای MCP، helperهای اجرای process،
تحویل outbound و gateهای اجرای tool در agent را زیر category
`/codeql-critical-security/mcp-process-tool-boundary` scan می‌کند تا سیگنال مرز command و
tool از baseline احراز هویت/secrets و shard کیفیت غیرامنیتی MCP/process جدا بماند. job plugin-trust-boundary
سطح‌های اعتماد نصب plugin، loader، manifest، registry، staging وابستگی runtime،
source-loading، public-surface و contract بسته‌ی Plugin SDK
را زیر category `/codeql-critical-security/plugin-trust-boundary` scan می‌کند تا سیگنال supply-chain و runtime-loading plugin
از کد پیاده‌سازی pluginهای bundled و shard کیفیت غیرامنیتی plugin جدا بماند.

workflow `CodeQL Android Critical Security` shard زمان‌بندی‌شده‌ی امنیت Android است.
برای CodeQL اپ Android را به‌صورت دستی روی کوچک‌ترین label runner لینوکس Blacksmith
که workflow sanity می‌پذیرد می‌سازد و نتایج را
زیر category `/codeql-critical-security/android` آپلود می‌کند.

workflow `CodeQL macOS Critical Security` shard هفتگی/دستی امنیت macOS است.
برای CodeQL اپ macOS را به‌صورت دستی روی macOS Blacksmith می‌سازد،
نتایج build وابستگی را از SARIF آپلودشده فیلتر می‌کند و نتایج را
زیر category `/codeql-critical-security/macos` آپلود می‌کند. آن را بیرون از workflow پیش‌فرض روزانه نگه دارید
چون build macOS حتی وقتی تمیز باشد runtime را غالب می‌کند.

workflow `CodeQL Critical Quality` shard غیرامنیتی متناظر است. فقط queryهای کیفیت
JavaScript/TypeScript با severity خطا و غیرامنیتی را
روی surfaceهای narrow و ارزشمند روی runner کوچک‌تر لینوکس Blacksmith اجرا می‌کند. dispatch دستی آن
`profile=all|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary` را می‌پذیرد؛
پروفایل‌های narrow hookهای آموزشی/iteration برای اجرای یک shard کیفیت
به‌صورت جداگانه بدون dispatch کردن بقیه‌ی workflow هستند.
job
core-auth-secrets آن کد مرز امنیتی auth، secrets، sandbox، Cron و Gateway
را زیر category جداگانه‌ی `/codeql-critical-quality/core-auth-secrets`
scan می‌کند. job config-boundary
contractهای config schema، migration، normalization و IO را زیر
category جداگانه‌ی `/codeql-critical-quality/config-boundary` scan می‌کند. job
gateway-runtime-boundary schemaهای protocol Gateway و contractهای method سرور
را زیر category جداگانه‌ی
`/codeql-critical-quality/gateway-runtime-boundary` scan می‌کند. job
channel-runtime-boundary contractهای پیاده‌سازی کانال core را زیر
category جداگانه‌ی `/codeql-critical-quality/channel-runtime-boundary` scan می‌کند. job
agent-runtime-boundary اجرای command، dispatch مدل/provider،
dispatch و queueهای auto-reply، و contractهای runtime control-plane مربوط به ACP را زیر
category جداگانه‌ی `/codeql-critical-quality/agent-runtime-boundary` scan می‌کند. job
mcp-process-runtime-boundary سرورهای MCP و bridgeهای tool، helperهای
supervision process و contractهای تحویل outbound را زیر category جداگانه‌ی
`/codeql-critical-quality/mcp-process-runtime-boundary` scan می‌کند. job
memory-runtime-boundary، SDK میزبان memory، facadeهای runtime حافظه،
aliasهای memory Plugin SDK، glue فعال‌سازی runtime حافظه و commandهای doctor حافظه
را زیر category جداگانه‌ی `/codeql-critical-quality/memory-runtime-boundary`
scan می‌کند. job session-diagnostics-boundary internals صف reply،
queueهای تحویل session، helperهای binding/delivery برای session outbound، surfaceهای
event/log bundle تشخیصی و contractهای CLI مربوط به session doctor را زیر category جداگانه‌ی
`/codeql-critical-quality/session-diagnostics-boundary` scan می‌کند. job
plugin-sdk-reply-runtime dispatch پاسخ inbound در Plugin SDK، helperهای
payload/chunking/runtime پاسخ، گزینه‌های پاسخ کانال، queueهای تحویل و
helperهای binding مربوط به session/thread را زیر category جداگانه‌ی
`/codeql-critical-quality/plugin-sdk-reply-runtime` scan می‌کند. job
provider-runtime-boundary نرمال‌سازی catalog مدل، auth و discovery مربوط به provider،
ثبت runtime provider، defaults/catalogهای provider و registryهای provider مربوط به
web/search/fetch/embedding را زیر category جداگانه‌ی
`/codeql-critical-quality/provider-runtime-boundary` scan می‌کند. job
ui-control-plane bootstrap مربوط به Control UI، persistence محلی، جریان‌های کنترل Gateway
و contractهای runtime مربوط به control-plane task را زیر category جداگانه‌ی
`/codeql-critical-quality/ui-control-plane` scan می‌کند. job
web-media-runtime-boundary contractهای runtime مربوط به web fetch/search در core، media IO، فهم رسانه،
image-generation و media-generation را زیر
category جداگانه‌ی `/codeql-critical-quality/web-media-runtime-boundary` scan می‌کند. job
plugin-boundary contractهای loader، registry، public-surface و entrypointهای Plugin SDK
را زیر category جداگانه‌ی `/codeql-critical-quality/plugin-boundary`
scan می‌کند. job plugin-sdk-package-contract سورس Plugin SDK سمت بسته‌ی منتشرشده
و helperهای contract بسته‌ی plugin را زیر category جداگانه‌ی
`/codeql-critical-quality/plugin-sdk-package-contract` scan می‌کند. workflow را
از امنیت جدا نگه دارید تا findingهای کیفیت بتوانند بدون پنهان کردن سیگنال امنیتی
زمان‌بندی، اندازه‌گیری، غیرفعال یا گسترش داده شوند.
گسترش CodeQL برای Swift، Python و pluginهای bundled فقط پس از آنکه پروفایل‌های narrow
runtime و سیگنال پایدار پیدا کردند، باید دوباره به‌عنوان کار follow-up دارای scope یا shard شده اضافه شود.

workflow `Docs Agent` یک lane نگه‌داری event-driven در Codex برای هم‌راستا نگه داشتن
docs موجود با تغییرات تازه land شده است. schedule خالص ندارد: یک
اجرای CI موفق push غیر-bot روی `main` می‌تواند آن را trigger کند، و dispatch دستی می‌تواند
مستقیماً آن را اجرا کند. invocationهای workflow-run وقتی `main` جلوتر رفته باشد یا وقتی
یک اجرای غیر-skipped دیگر Docs Agent در یک ساعت گذشته ایجاد شده باشد skip می‌شوند. وقتی اجرا می‌شود، محدوده‌ی commit را از SHA منبع غیر-skipped قبلی Docs Agent تا
`main` فعلی review می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه‌ی تغییرات main انباشته‌شده از
آخرین pass docs را پوشش دهد.

workflow `Test Performance Agent` یک lane نگه‌داری event-driven در Codex
برای testهای کند است. schedule خالص ندارد: یک اجرای CI موفق push غیر-bot روی
`main` می‌تواند آن را trigger کند، اما اگر invocation workflow-run دیگری در آن روز UTC
قبلاً اجرا شده یا در حال اجرا باشد skip می‌شود. dispatch دستی آن gate فعالیت روزانه
را دور می‌زند. این lane یک گزارش کامل grouped Vitest performance برای suite کامل می‌سازد، به Codex اجازه می‌دهد
فقط اصلاحات کوچک performance test با حفظ coverage انجام دهد نه refactorهای گسترده،
سپس گزارش suite کامل را دوباره اجرا می‌کند و تغییراتی را که تعداد baseline testهای passing را کاهش دهند reject می‌کند. اگر baseline testهای failing داشته باشد، Codex فقط می‌تواند
failureهای واضح را اصلاح کند و گزارش suite کامل پس از agent باید پیش از
commit شدن هر چیزی pass شود. وقتی `main` پیش از land شدن push bot جلو می‌رود، lane
patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند و push را retry می‌کند؛
patchهای stale دارای conflict skip می‌شوند. از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا action مربوط به Codex
بتواند همان وضعیت ایمنی drop-sudo مانند docs agent را حفظ کند.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## نمای کلی job

| کار | هدف | زمان اجرا |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | تشخیص تغییرات فقط مستندات، دامنه‌های تغییرکرده، extensionهای تغییرکرده، و ساخت manifest مربوط به CI | همیشه در pushها و PRهای غیر draft |
| `security-scm-fast` | تشخیص کلید خصوصی و ممیزی workflow از طریق `zizmor` | همیشه در pushها و PRهای غیر draft |
| `security-dependency-audit` | ممیزی lockfile تولیدی بدون وابستگی در برابر advisoryهای npm | همیشه در pushها و PRهای غیر draft |
| `security-fast` | تجمیع الزامی برای کارهای امنیتی سریع | همیشه در pushها و PRهای غیر draft |
| `build-artifacts` | ساخت `dist/`، رابط کاربری کنترل، بررسی‌های artifact ساخته‌شده، و artifactهای قابل استفاده مجدد برای مراحل پایین‌دستی | تغییرات مرتبط با Node |
| `checks-fast-core` | laneهای سریع صحت‌سنجی Linux مانند بررسی‌های بسته‌بندی‌شده/قرارداد Plugin/protocol | تغییرات مرتبط با Node |
| `checks-fast-contracts-channels` | بررسی‌های shardشده قرارداد کانال با نتیجه بررسی تجمیعی پایدار | تغییرات مرتبط با Node |
| `checks-node-core-test` | shardهای تست هسته Node، به‌جز laneهای کانال، بسته‌بندی‌شده، قرارداد، و extension | تغییرات مرتبط با Node |
| `check` | معادل shardشده gate محلی اصلی: typeهای تولید، lint، guardها، typeهای تست، و smoke سخت‌گیرانه | تغییرات مرتبط با Node |
| `check-additional` | shardهای معماری، مرزها، guardهای سطح extension، مرز بسته، و gateway-watch | تغییرات مرتبط با Node |
| `build-smoke` | تست‌های smoke مربوط به CLI ساخته‌شده و smoke حافظه راه‌اندازی | تغییرات مرتبط با Node |
| `checks` | تأییدکننده تست‌های کانال artifact ساخته‌شده | تغییرات مرتبط با Node |
| `checks-node-compat-node22` | lane ساخت و smoke سازگاری Node 22 | اجرای دستی CI برای انتشارها |
| `check-docs` | بررسی‌های قالب‌بندی مستندات، lint، و لینک‌های خراب | مستندات تغییر کرده‌اند |
| `skills-python` | Ruff + pytest برای Skills مبتنی بر Python | تغییرات مرتبط با Python-skill |
| `checks-windows` | تست‌های مخصوص فرایند/مسیر در Windows به‌همراه regressionهای مشترک specifier واردسازی runtime | تغییرات مرتبط با Windows |
| `macos-node` | lane تست TypeScript در macOS با استفاده از artifactهای ساخته‌شده مشترک | تغییرات مرتبط با macOS |
| `macos-swift` | lint، ساخت، و تست‌های Swift برای برنامه macOS | تغییرات مرتبط با macOS |
| `android` | تست‌های واحد Android برای هر دو flavor به‌همراه یک ساخت debug APK | تغییرات مرتبط با Android |
| `test-performance-agent` | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت قابل اعتماد | موفقیت CI اصلی یا اجرای دستی |

اجرای دستی CI همان گراف کار CI عادی را اجرا می‌کند، اما همه laneهای دامنه‌دار غیر Android را اجباری فعال می‌کند: shardهای Linux Node، shardهای Plugin بسته‌بندی‌شده، قراردادهای کانال، سازگاری Node 22، `check`، `check-additional`، smoke ساخت، بررسی‌های مستندات، Skills مربوط به Python، Windows، macOS، و i18n رابط کاربری کنترل. اجرای دستی مستقل CI فقط با `include_android=true`، Android را اجرا می‌کند؛ چتر انتشار کامل با پاس دادن `include_android=true`، Android را فعال می‌کند. بررسی‌های ایستای پیش‌انتشار Plugin، shard مخصوص انتشار `agentic-plugins`، sweep کامل دسته extension، و laneهای Docker پیش‌انتشار Plugin از CI حذف شده‌اند. مجموعه پیش‌انتشار Docker فقط زمانی اجرا می‌شود که `Full Release Validation`، workflow جداگانه `Plugin Prerelease` را با فعال بودن gate اعتبارسنجی انتشار اجرا کند. اجراهای دستی از یک گروه concurrency یکتا استفاده می‌کنند تا مجموعه کامل release-candidate با اجرای push یا PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به فراخوان قابل اعتماد اجازه می‌دهد آن گراف را روی یک branch، tag، یا commit SHA کامل اجرا کند، در حالی که از فایل workflow مربوط به ref اجرای انتخاب‌شده استفاده می‌شود.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ترتیب fail-fast

کارها طوری مرتب شده‌اند که بررسی‌های کم‌هزینه پیش از اجرای موارد پرهزینه شکست بخورند:

1. `preflight` تصمیم می‌گیرد که اساساً کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` گام‌هایی داخل این کار هستند، نه کارهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای کارهای سنگین‌تر matrix مربوط به artifact و platform سریع شکست می‌خورند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان پایین‌دستی به‌محض آماده شدن ساخت مشترک بتوانند شروع کنند.
4. سپس laneهای سنگین‌تر platform و runtime منشعب می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

منطق دامنه در `scripts/ci-changed-scope.mjs` قرار دارد و با تست‌های واحد در `src/scripts/ci-changed-scope.test.ts` پوشش داده می‌شود.
اجرای دستی، تشخیص دامنه تغییرات را رد می‌کند و باعث می‌شود manifest پیش‌پرواز
طوری عمل کند که انگار هر ناحیه دامنه‌دار تغییر کرده است.
ویرایش‌های workflow مربوط به CI، گراف CI مربوط به Node به‌همراه lint کردن workflow را اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای بومی Windows، Android یا macOS را اجباری نمی‌کنند؛ آن laneهای پلتفرمی همچنان به تغییرات سورس پلتفرم محدود می‌مانند.
ویرایش‌های فقط مربوط به مسیریابی CI، برخی ویرایش‌های ارزان fixture تست هسته، و ویرایش‌های محدود helper/مسیر‌دهی تست قرارداد Plugin از مسیر سریع manifest فقط برای Node استفاده می‌کنند: پیش‌پرواز، امنیت، و یک وظیفه `checks-fast-core`. این مسیر وقتی فایل‌های تغییرکرده به سطح‌های مسیریابی یا helper محدود باشند که وظیفه سریع مستقیما آن‌ها را اجرا می‌کند، از artifactهای build، سازگاری Node 22، قراردادهای کانال، shardهای کامل هسته، shardهای Pluginهای همراه، و ماتریس‌های guard اضافی پرهیز می‌کند.
بررسی‌های Windows Node به wrapperهای مخصوص فرایند/مسیر Windows، helperهای اجراکننده npm/pnpm/UI، پیکربندی package manager، و سطح‌های workflow مربوط به CI که آن lane را اجرا می‌کنند محدود هستند؛ تغییرات نامرتبط در سورس، Plugin، install-smoke، و تغییرات فقط تست روی laneهای Linux Node باقی می‌مانند تا یک worker 16-vCPU مربوط به Windows را برای پوششی که از قبل توسط shardهای تست عادی اجرا می‌شود رزرو نکنند.
workflow جداگانه `install-smoke` همان اسکریپت دامنه را از طریق job خودش یعنی `preflight` دوباره استفاده می‌کند. این workflow پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند. Pull requestها مسیر سریع را برای سطح‌های Docker/package، تغییرات package/manifest مربوط به Plugin همراه، و سطح‌های Plugin/کانال/Gateway/Plugin SDK هسته که jobهای Docker smoke اجرا می‌کنند، اجرا می‌کنند. تغییرات فقط سورس در Plugin همراه، ویرایش‌های فقط تست، و ویرایش‌های فقط مستندات، workerهای Docker را رزرو نمی‌کنند. مسیر سریع، image مربوط به Dockerfile ریشه را یک‌بار build می‌کند، CLI را بررسی می‌کند، smoke مربوط به CLI برای حذف agents در shared-workspace را اجرا می‌کند، e2e مربوط به container gateway-network را اجرا می‌کند، یک build arg مربوط به extension همراه را تأیید می‌کند، و پروفایل Docker محدودِ Plugin همراه را با timeout تجمعی ۲۴۰ ثانیه‌ای برای command اجرا می‌کند، در حالی که اجرای Docker هر سناریو جداگانه محدود می‌شود. مسیر کامل، نصب QR package و پوشش Docker/update مربوط به installer را برای اجراهای برنامه‌ریزی‌شده شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call، و pull requestهایی نگه می‌دارد که واقعا سطح‌های installer/package/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک image مربوط به smoke برای Dockerfile ریشه GHCR با SHA هدف را آماده یا دوباره استفاده می‌کند، سپس نصب QR package، smokeهای Dockerfile/Gateway ریشه، smokeهای installer/update، و Docker E2E سریع Plugin همراه را به‌عنوان jobهای جداگانه اجرا می‌کند تا کار installer پشت smokeهای image ریشه منتظر نماند. pushهای `main`، از جمله merge commitها، مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق دامنه تغییرات روی یک push پوشش کامل را درخواست کند، workflow همان Docker smoke سریع را نگه می‌دارد و install smoke کامل را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند. smoke کند image-provider برای نصب سراسری Bun به‌صورت جداگانه با `run_bun_global_install_smoke` کنترل می‌شود؛ این مورد در زمان‌بندی شبانه و از workflow بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `install-smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` آن را اجرا نمی‌کنند. تست‌های QR و installer Docker، Dockerfileهای متمرکز بر نصب خودشان را حفظ می‌کنند. `test:docker:all` محلی یک image مشترک live-test را از قبل build می‌کند، OpenClaw را یک‌بار به‌عنوان tarball مربوط به npm بسته‌بندی می‌کند، و دو image مشترک `scripts/e2e/Dockerfile` می‌سازد: یک اجراکننده bare Node/Git برای laneهای installer/update/plugin-dependency و یک image کاربردی که همان tarball را برای laneهای عادی قابلیت‌ها در `/app` نصب می‌کند. تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` برای هر lane image را انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند؛ تعداد پیش‌فرض slotهای main-pool یعنی ۱۰ را با `OPENCLAW_DOCKER_ALL_PARALLELISM` و تعداد slotهای tail-pool حساس به provider یعنی ۱۰ را با `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` تنظیم کنید. سقف laneهای سنگین به‌طور پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` است تا laneهای npm install و چندسرویسی، Docker را بیش‌ازحد متعهد نکنند، در حالی که laneهای سبک‌تر همچنان slotهای در دسترس را پر می‌کنند. یک lane که از سقف‌های مؤثر سنگین‌تر است همچنان می‌تواند از یک pool خالی شروع شود، سپس تا زمان آزاد کردن ظرفیت به‌تنهایی اجرا می‌شود. شروع laneها به‌طور پیش‌فرض با فاصله ۲ ثانیه انجام می‌شود تا از موج ایجاد container توسط Docker daemon محلی جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` یا مقدار میلی‌ثانیه‌ای دیگر آن را override کنید. aggregate محلی، Docker را پیش‌پرواز می‌کند، containerهای stale مربوط به OpenClaw E2E را حذف می‌کند، وضعیت laneهای فعال را منتشر می‌کند، زمان‌بندی laneها را برای ترتیب longest-first پایدار می‌کند، و از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` برای بررسی scheduler پشتیبانی می‌کند. به‌طور پیش‌فرض پس از اولین failure، زمان‌بندی laneهای pooled جدید را متوقف می‌کند، و هر lane یک timeout پشتیبان ۱۲۰ دقیقه‌ای دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل override است؛ برخی laneهای live/tail انتخاب‌شده از سقف‌های دقیق‌تر مخصوص هر lane استفاده می‌کنند. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` laneهای دقیق scheduler را اجرا می‌کند، از جمله laneهای فقط انتشار مانند `install-e2e` و laneهای split مربوط به update همراه مانند `bundled-channel-update-acpx`، در حالی که cleanup smoke را رد می‌کند تا agents بتوانند یک lane failed را بازتولید کنند. workflow قابل استفاده مجدد live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد کدام package، نوع image، live image، lane، و پوشش credential لازم است، سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا یک artifact package از اجرای فعلی را دانلود می‌کند، یا یک artifact package را از `package_artifact_run_id` دانلود می‌کند؛ inventory tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای package-installed نیاز داشته باشد، imageهای bare/functional مربوط به GHCR Docker E2E را با tag مبتنی بر digest package از طریق cache لایه Docker در Blacksmith می‌سازد و push می‌کند؛ و به‌جای build دوباره، inputهای ارائه‌شده `docker_e2e_bare_image`/`docker_e2e_functional_image` یا imageهای موجود مبتنی بر digest package را دوباره استفاده می‌کند. pull کردن imageهای Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش retry می‌شود تا یک جریان گیرکرده registry/cache به‌جای مصرف بخش عمده مسیر بحرانی CI، سریع retry شود. workflow مربوط به `Package Acceptance` گیت سطح بالای package است: یک کاندید را از npm، یک `package_ref` مورد اعتماد، یک tarball مبتنی بر HTTPS به‌همراه SHA-256، یا artifact یک workflow قبلی resolve می‌کند، سپس همان artifact واحد `package-under-test` را به workflow قابل استفاده مجدد Docker E2E می‌دهد. این workflow، `workflow_ref` را از `package_ref` جدا نگه می‌دارد تا منطق فعلی پذیرش بتواند commitهای قدیمی‌تر مورد اعتماد را بدون checkout کردن کد workflow قدیمی اعتبارسنجی کند. بررسی‌های انتشار یک delta سفارشی Package Acceptance را برای ref هدف اجرا می‌کنند: سازگاری bundled-channel، fixtureهای Plugin آفلاین، و QA package مربوط به Telegram روی tarball resolve‌شده. مجموعه Docker مسیر انتشار، jobهای کوچک‌تر و chunkشده را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع image موردنیازش را pull کند و چندین lane را از طریق همان scheduler وزن‌دار اجرا کند (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`، `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). وقتی پوشش کامل release-path آن را درخواست کند، OpenWebUI در `plugins-runtime-services` ادغام می‌شود، و فقط برای dispatchهای مختص OpenWebUI، chunk مستقل `openwebui` را نگه می‌دارد. نام‌های legacy aggregate chunk یعنی `package-update`، `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان برای rerunهای دستی کار می‌کنند، اما workflow انتشار از chunkهای split استفاده می‌کند تا installer E2E و sweepهای install/uninstall مربوط به Pluginهای همراه بر مسیر بحرانی مسلط نشوند. alias lane یعنی `install-e2e` به‌عنوان alias aggregate rerun دستی برای هر دو lane installer provider باقی می‌ماند. chunk مربوط به `bundled-channels` به‌جای lane ترتیبی همه‌در‌یکی `bundled-channel-deps`، laneهای split `bundled-channel-*` و `bundled-channel-update-*` را اجرا می‌کند. هر chunk، `.artifacts/docker-tests/` را با logهای lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های فاز، JSON plan مربوط به scheduler، جدول‌های laneهای کند، و commandهای rerun مخصوص هر lane upload می‌کند. input مربوط به `docker_lanes` در workflow، laneهای انتخاب‌شده را روی imageهای آماده‌شده به‌جای jobهای chunk اجرا می‌کند، که debugging مربوط به lane failed را به یک job هدفمند Docker محدود نگه می‌دارد و artifact package را برای آن اجرا آماده، دانلود، یا دوباره استفاده می‌کند؛ اگر lane انتخاب‌شده یک live Docker lane باشد، job هدفمند، image مربوط به live-test را برای آن rerun به‌صورت محلی build می‌کند. commandهای rerun GitHub تولیدشده برای هر lane، وقتی آن مقدارها وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name`، و inputهای image آماده‌شده هستند، تا یک lane failed بتواند همان package و imageهای دقیق اجرای failed را دوباره استفاده کند. از `pnpm test:docker:rerun <run-id>` برای دانلود artifactهای Docker از یک اجرای GitHub و چاپ commandهای rerun هدفمند ترکیبی/مخصوص هر lane استفاده کنید؛ از `pnpm test:docker:timings <summary.json>` برای خلاصه‌های lane کند و مسیر بحرانی فاز استفاده کنید. workflow برنامه‌ریزی‌شده live/E2E هر روز مجموعه کامل release-path Docker را اجرا می‌کند. ماتریس update همراه بر اساس هدف update split شده است تا پاس‌های تکراری npm update و repair مربوط به doctor بتوانند همراه سایر بررسی‌های همراه shard شوند.

chunkهای فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، `plugins-runtime-install-a`، `plugins-runtime-install-b`، `plugins-runtime-install-c`، `plugins-runtime-install-d`، `plugins-runtime-install-e`، `plugins-runtime-install-f`، `plugins-runtime-install-g`، `plugins-runtime-install-h`، `bundled-channels-core`، `bundled-channels-update-a`، `bundled-channels-update-discord`، `bundled-channels-update-b`، و `bundled-channels-contracts`. chunk aggregate یعنی `bundled-channels` همچنان برای rerunهای دستی یک‌باره در دسترس است، و `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای aggregate مربوط به Plugin/runtime باقی می‌مانند، اما workflow انتشار از chunkهای split استفاده می‌کند تا smokeهای کانال، هدف‌های update، بررسی‌های runtime مربوط به Plugin، و sweepهای install/uninstall مربوط به Plugin همراه بتوانند موازی اجرا شوند. dispatchهای هدفمند `docker_lanes` نیز پس از یک مرحله آماده‌سازی مشترک package/image، چند lane انتخاب‌شده را به jobهای موازی split می‌کنند، و laneهای update مربوط به bundled-channel برای failureهای گذرای شبکه npm یک‌بار retry می‌شوند.

منطق محلی خط تغییر‌یافته در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. این دروازه بررسی محلی درباره مرزهای معماری سخت‌گیرتر از دامنه گسترده پلتفرم CI است: تغییرات تولیدی هسته، typecheck تولیدی هسته و typecheck تست هسته به‌علاوه lint/guardهای هسته را اجرا می‌کنند؛ تغییرات فقط‌تستی هسته فقط typecheck تست هسته به‌علاوه lint هسته را اجرا می‌کنند؛ تغییرات تولیدی افزونه، typecheck تولیدی افزونه و typecheck تست افزونه به‌علاوه lint افزونه را اجرا می‌کنند؛ و تغییرات فقط‌تستی افزونه، typecheck تست افزونه به‌علاوه lint افزونه را اجرا می‌کنند. تغییرات عمومی Plugin SDK یا قرارداد Plugin به typecheck افزونه گسترش می‌یابند، چون افزونه‌ها به آن قراردادهای هسته وابسته‌اند، اما sweepهای Vitest افزونه کار تست صریح هستند. افزایش نسخه‌هایی که فقط فراداده انتشار را تغییر می‌دهند، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی ریشه را اجرا می‌کنند. تغییرات ناشناخته ریشه/پیکربندی برای ایمنی به همه خط‌های بررسی می‌افتند.
مسیر‌دهی محلی تست‌های تغییر‌یافته در `scripts/test-projects.test-support.mjs` قرار دارد و
عمدا از `check:changed` ارزان‌تر است: ویرایش مستقیم تست‌ها خودشان را اجرا می‌کند،
ویرایش منبع ابتدا نگاشت‌های صریح را ترجیح می‌دهد، سپس تست‌های هم‌سطح و وابستگان
گراف import را. پیکربندی مشترک تحویل اتاق گروهی یکی از نگاشت‌های صریح است:
تغییرات در پیکربندی پاسخ مرئی گروه، حالت تحویل پاسخ منبع، یا
مسیر اعلان سیستمی message-tool از تست‌های پاسخ هسته به‌علاوه رگرسیون‌های تحویل Discord و
Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین push روابط عمومی شکست بخورد. از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط وقتی استفاده کنید که تغییر
آن‌قدر در سطح harness گسترده باشد که مجموعه نگاشت‌شده ارزان نماینده قابل اعتمادی نباشد.

برای اعتبارسنجی Testbox، از ریشه مخزن اجرا کنید و برای اثبات گسترده، یک box تازه گرم‌شده را ترجیح دهید. پیش از صرف زمان برای یک دروازه کند روی boxای که دوباره استفاده شده، منقضی شده، یا
به‌تازگی همگام‌سازی غیرمنتظره بزرگی گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل
box اجرا کنید. بررسی sanity وقتی فایل‌های ریشه ضروری مانند
`pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` دست‌کم ۲۰۰
حذف ردیابی‌شده نشان دهد، سریع شکست می‌خورد. این معمولا یعنی وضعیت همگام‌سازی راه دور نسخه قابل اعتمادی
از روابط عمومی نیست. به‌جای اشکال‌زدایی شکست تست محصول، آن box را متوقف کنید و یک مورد تازه را گرم کنید.
برای روابط عمومی‌هایی که عمدا حذف‌های بزرگ دارند، برای آن اجرای sanity مقدار
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید. `pnpm
testbox:run` همچنین فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از همگام‌سازی در
مرحله sync بماند، خاتمه می‌دهد. برای غیرفعال‌کردن آن guard مقدار
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ از مقدار
میلی‌ثانیه بزرگ‌تری استفاده کنید.

dispatchهای دستی CI، `checks-node-compat-node22` را به‌عنوان پوشش سازگاری گسترده اجرا می‌کنند. Android برای CI دستی مستقل از طریق `include_android=true` اختیاری است و برای `Full Release Validation` همیشه فعال است. `Plugin Prerelease` پوشش محصول/بسته پرهزینه‌تری است، بنابراین یک workflow جداگانه است که توسط `Full Release Validation` یا یک اپراتور صریح dispatch می‌شود. روابط عمومی‌های عادی، pushهای `main`، و dispatchهای دستی مستقل CI آن مجموعه را خاموش نگه می‌دارند.

کندترین خانواده‌های تست Node تقسیم یا متوازن شده‌اند تا هر job بدون رزرو بیش‌ازحد runnerها کوچک بماند: قراردادهای کانال به سه shard وزن‌دار اجرا می‌شوند، خط‌های کوچک unit هسته جفت می‌شوند، auto-reply به‌صورت چهار worker متوازن اجرا می‌شود که زیرشاخه reply به shardهای agent-runner، dispatch، و commands/state-routing تقسیم شده است، و پیکربندی‌های agentic gateway/plugin به‌جای انتظار برای artifactهای ساخته‌شده، میان jobهای agentic Node موجود که فقط منبع هستند پخش می‌شوند. تست‌های گسترده مرورگر، QA، رسانه، و Pluginهای متفرقه به‌جای catch-all مشترک Plugin از پیکربندی‌های اختصاصی Vitest خود استفاده می‌کنند. `Plugin Prerelease` تست‌های Pluginهای بسته‌بندی‌شده را میان هشت worker افزونه متوازن می‌کند؛ آن jobهای shard افزونه حداکثر دو گروه پیکربندی Plugin را هم‌زمان، با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا دسته‌های Plugin سنگین از نظر import، jobهای اضافی CI ایجاد نکنند. خط گسترده agents از زمان‌بند مشترک موازی فایل Vitest استفاده می‌کند، چون تحت سلطه import/زمان‌بندی است نه متعلق به یک فایل تست کند واحد. `runtime-config` همراه با shard زیرساخت core-runtime اجرا می‌شود تا shard مشترک runtime مالک انتهای زمان اجرا نشود. shardهای include-pattern ورودی‌های زمان‌بندی را با نام shard در CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک پیکربندی کامل را از shard فیلترشده تشخیص دهد. `check-additional` کارهای compile/canary محدود به بسته را کنار هم نگه می‌دارد و معماری topology زمان اجرا را از پوشش gateway watch جدا می‌کند؛ shard guard مرزی، guardهای کوچک مستقل خود را هم‌زمان داخل یک job اجرا می‌کند. Gateway watch، تست‌های کانال، و shard مرز پشتیبانی هسته، پس از اینکه `dist/` و `dist-runtime/` از قبل ساخته شده‌اند، هم‌زمان داخل `build-artifacts` اجرا می‌شوند و نام‌های قدیمی check خود را به‌عنوان jobهای verifier سبک نگه می‌دارند، درحالی‌که از دو worker اضافی Blacksmith و یک صف دوم مصرف‌کننده artifact جلوگیری می‌کنند.
CI مربوط به Android هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند، سپس APK دیباگ Play را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه‌ای ندارد؛ خط unit-test آن همچنان آن flavor را با flagهای BuildConfig مربوط به SMS/call-log کامپایل می‌کند، درحالی‌که از job بسته‌بندی APK دیباگ تکراری در هر push مرتبط با Android جلوگیری می‌کند.
GitHub ممکن است وقتی push جدیدتری روی همان روابط عمومی یا ref `main` قرار می‌گیرد، jobهای superseded را به‌صورت `cancelled` علامت‌گذاری کند. این را نویز CI در نظر بگیرید، مگر اینکه جدیدترین اجرا برای همان ref نیز شکست بخورد. بررسی‌های aggregate shard از `!cancelled() && always()` استفاده می‌کنند تا همچنان شکست‌های عادی shard را گزارش کنند اما پس از اینکه کل workflow قبلا superseded شده است در صف قرار نگیرند.
کلید هم‌زمانی خودکار CI نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در یک گروه صف قدیمی نتواند اجراهای جدیدتر main را نامحدود مسدود کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در حال انجام را لغو نمی‌کنند.

## اجراکننده‌ها

| اجراکننده                           | کارها                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، jobهای امنیتی سریع و aggregateها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع پروتکل/قرارداد/بسته‌بندی‌شده، بررسی‌های shardشده قرارداد کانال، shardهای `check` به‌جز lint، shardها و aggregateهای `check-additional`، verifierهای aggregate تست Node، بررسی‌های مستندات، Skills پایتون، workflow-sanity، labeler، auto-response؛ install-smoke preflight نیز از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا ماتریس Blacksmith زودتر بتواند صف شود |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، shardهای افزونه با وزن کمتر، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types`، و `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، shardهای تست Linux Node، shardهای تست Pluginهای بسته‌بندی‌شده، `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`، که همچنان آن‌قدر به CPU حساس است که ۸ vCPU بیش از آنچه صرفه‌جویی کند هزینه ایجاد می‌کند؛ buildهای Docker مربوط به install-smoke، جایی که زمان صف ۳۲-vCPU بیش از آنچه صرفه‌جویی کند هزینه ایجاد می‌کند                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-latest` برمی‌گردند                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` روی `openclaw/openclaw`؛ forkها به `macos-latest` برمی‌گردند                                                                                                                                                                                                                                                                                                                                                                                                 |

## معادل‌های محلی

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:changed   # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های انتشار](/fa/install/development-channels)

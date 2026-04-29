---
read_when:
    - باید بدانید چرا یک کار CI اجرا شد یا نشد
    - شما در حال اشکال‌زدایی بررسی‌های ناموفق GitHub Actions هستید
summary: نمودار کارهای CI، گیت‌های محدوده و معادل‌های فرمان‌های محلی
title: خط لولهٔ CI
x-i18n:
    generated_at: "2026-04-29T22:31:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64ba894cef8b847b3e7a298cfeb2c2977f7c589c64998a8fb5feb17a9e359160
    source_path: ci.md
    workflow: 16
---

CI روی هر push به `main` و هر pull request اجرا می‌شود. از محدوده‌بندی هوشمند استفاده می‌کند تا وقتی فقط بخش‌های نامرتبط تغییر کرده‌اند، کارهای پرهزینه را رد کند. اجراهای دستی `workflow_dispatch` عمداً محدوده‌بندی هوشمند را دور می‌زنند و گراف کامل CI عادی را برای نامزدهای انتشار یا اعتبارسنجی گسترده پخش می‌کنند؛ مسیرهای Android برای اجراهای دستی مستقل از طریق `include_android` اختیاری هستند. مسیرهای پیش‌انتشار Plugin که فقط مخصوص انتشار هستند در گردش‌کار جداگانه `Plugin Prerelease` قرار دارند و فقط از `Full Release Validation` یا یک dispatch دستی صریح اجرا می‌شوند.

شارد `check-dependencies` دستور `pnpm deadcode:dependencies` را اجرا می‌کند؛ یک گذر فقط وابستگی Knip در production که به آخرین نسخه Knip استفاده‌شده توسط همان اسکریپت سنجاق شده است، در حالی که حداقل سن انتشار pnpm برای نصب `dlx` غیرفعال است. همچنین `pnpm deadcode:unused-files` را اجرا می‌کند که یافته‌های فایل‌های استفاده‌نشده production از Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. این نگهبان وقتی یک PR فایل استفاده‌نشده جدید و بازبینی‌نشده‌ای اضافه کند یا پس از پاک‌سازی یک ورودی allowlist کهنه باقی بگذارد شکست می‌خورد، در حالی که سطوح عمدی Plugin پویا، تولیدشده، build، آزمون زنده، و پل بسته را که Knip نمی‌تواند به‌صورت ایستا حل کند حفظ می‌کند.

`Full Release Validation` گردش‌کار چتری دستی برای «اجرای همه‌چیز
پیش از انتشار» است. یک branch، tag، یا SHA کامل commit می‌پذیرد، گردش‌کار
دستی `CI` را با آن هدف dispatch می‌کند، `Plugin Prerelease` را برای
اثبات‌های فقط-انتشار Plugin/package/static/Docker dispatch می‌کند، و
`OpenClaw Release Checks` را برای install smoke، package acceptance، مجموعه‌های
release-path مربوط به Docker، live/E2E، OpenWebUI، برابری QA Lab، Matrix، و مسیرهای Telegram
dispatch می‌کند. همچنین وقتی مشخصه بسته منتشرشده ارائه شود می‌تواند گردش‌کار
پس از انتشار `NPM Telegram Beta E2E` را اجرا کند. `release_profile=minimum|stable|full` گستره live/provider
ارسال‌شده به release checks را کنترل می‌کند: `minimum` سریع‌ترین مسیرهای OpenAI/core
حیاتی برای انتشار را نگه می‌دارد، `stable` مجموعه provider/backend پایدار را اضافه می‌کند، و
`full` ماتریس گسترده provider/media مشورتی را اجرا می‌کند. چتر شناسه‌های اجرای
فرزند dispatch‌شده را ثبت می‌کند، و کار نهایی `Verify full validation`
نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین کار را برای هر اجرای فرزند
ضمیمه می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط کار verifier والد را
دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks`
ورودی `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all` استفاده کنید، برای فقط فرزند
CI کامل عادی از `ci`، برای هر فرزند انتشار از `release-checks`، یا از یک
گروه انتشار محدودتر: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`،
`qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای دوباره یک
جعبه انتشار شکست‌خورده را پس از یک اصلاح متمرکز محدود نگه می‌دارد.

فرزند live/E2E انتشار پوشش گسترده بومی `pnpm test:live` را نگه می‌دارد، اما آن را
به‌صورت شاردهای نام‌دار اجرا می‌کند (`native-live-src-agents`،
`native-live-src-gateway-core`، کارهای provider-filtered
`native-live-src-gateway-profiles`،
`native-live-src-gateway-backends`، `native-live-test`،
`native-live-extensions-a-k`، `native-live-extensions-l-n`،
`native-live-extensions-openai`، `native-live-extensions-o-z-other`،
`native-live-extensions-xai`، شاردهای جداشده audio/video رسانه، و
شاردهای موسیقی provider-filtered) از طریق `scripts/test-live-shard.mjs` به‌جای
یک کار سریالی. این همان پوشش فایل را نگه می‌دارد و در عین حال اجرای دوباره و تشخیص
شکست‌های کند provider زنده را آسان‌تر می‌کند. نام‌های شارد تجمیعی
`native-live-extensions-o-z`، `native-live-extensions-media`، و
`native-live-extensions-media-music` همچنان برای اجرای دوباره دستی
یک‌باره معتبر می‌مانند.

شاردهای رسانه زنده بومی در
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط
گردش‌کار `Live Media Runner Image` ساخته شده است. آن image از پیش `ffmpeg` و
`ffprobe` را نصب می‌کند؛ کارهای رسانه فقط پیش از راه‌اندازی binaryها را تأیید می‌کنند. مجموعه‌های
زنده مبتنی بر Docker را روی runnerهای عادی Blacksmith نگه دارید، چون کارهای container
جای درستی برای راه‌اندازی آزمون‌های Docker تو در تو نیستند.

شاردهای live مدل/backend مبتنی بر Docker برای هر commit انتخاب‌شده از یک image مشترک جداگانه
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. گردش‌کار انتشار live
آن image را یک‌بار می‌سازد و push می‌کند، سپس شاردهای مدل Docker live،
gateway، backend مربوط به CLI، bind مربوط به ACP، و harness مربوط به Codex با
`OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. اگر آن شاردها هدف Docker کامل source را
به‌صورت مستقل دوباره بسازند، اجرای انتشار بدپیکربندی شده است و زمان واقعی را صرف
ساخت‌های تکراری image خواهد کرد.

`OpenClaw Release Checks` از workflow ref مورداعتماد استفاده می‌کند تا ref انتخاب‌شده را
یک‌بار به tarball به نام `release-package-under-test` حل کند، سپس آن artifact را
به هر دو گردش‌کار Docker مسیر live/E2E انتشار و شارد package acceptance
می‌دهد. این کار byteهای package را در جعبه‌های انتشار یکسان نگه می‌دارد و از
بسته‌بندی دوباره همان نامزد در چند کار فرزند جلوگیری می‌کند.

`Package Acceptance` گردش‌کار جانبی برای اعتبارسنجی یک artifact بسته است
بدون اینکه گردش‌کار انتشار را مسدود کند. یک نامزد را از یک مشخصه npm
منتشرشده، یک `package_ref` مورداعتماد ساخته‌شده با harness انتخاب‌شده
`workflow_ref`، یک URL tarball به‌صورت HTTPS همراه با SHA-256، یا یک artifact tarball
از اجرای دیگر GitHub Actions حل می‌کند، آن را به‌عنوان `package-under-test` آپلود می‌کند، سپس
زمان‌بند Docker release/E2E را با همان tarball، به‌جای بسته‌بندی دوباره
checkout گردش‌کار، بازاستفاده می‌کند. profileها انتخاب‌های مسیر Docker از نوع smoke، package،
product، full، و custom را پوشش می‌دهند. profile مربوط به `package` از پوشش Plugin آفلاین استفاده می‌کند تا
اعتبارسنجی بسته منتشرشده به دسترس‌بودن زنده ClawHub وابسته نباشد. مسیر
اختیاری Telegram از artifact
`package-under-test` در گردش‌کار `NPM Telegram Beta E2E` بازاستفاده می‌کند، در حالی که
مسیر مشخصه npm منتشرشده برای dispatchهای مستقل حفظ می‌شود.

## پذیرش بسته

از `Package Acceptance` وقتی استفاده کنید که سؤال این است: «آیا این بسته نصب‌شدنی OpenClaw
به‌عنوان یک محصول کار می‌کند؟» این با CI عادی فرق دارد: CI عادی
درخت source را اعتبارسنجی می‌کند، در حالی که package acceptance یک tarball واحد را از طریق همان
harness Docker E2E که کاربران پس از نصب یا update اجرا می‌کنند اعتبارسنجی می‌کند.

گردش‌کار چهار کار دارد:

1. `resolve_package`، `workflow_ref` را checkout می‌کند، یک نامزد package را حل می‌کند،
   `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد،
   `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان
   artifact به نام `package-under-test` آپلود می‌کند، و source، workflow ref، package
   ref، نسخه، SHA-256، و profile را در خلاصه مرحله GitHub چاپ می‌کند.
2. `docker_acceptance`،
   `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و
   `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار قابل‌استفاده‌مجدد
   آن artifact را دانلود می‌کند، inventory مربوط به tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker
   با package-digest را آماده می‌کند، و مسیرهای Docker انتخاب‌شده را در برابر همان
   package، به‌جای pack کردن checkout گردش‌کار، اجرا می‌کند. وقتی یک profile چند
   `docker_lanes` هدفمند را انتخاب می‌کند، گردش‌کار قابل‌استفاده‌مجدد package
   و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن مسیرها را به‌صورت کارهای Docker هدفمند موازی
   با artifactهای یکتا پخش می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی
   `telegram_mode` برابر `none` نباشد اجرا می‌شود و وقتی Package Acceptance یکی را حل کرده باشد همان artifact
   `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram
   همچنان می‌تواند یک مشخصه npm منتشرشده را نصب کند.
4. `summary` اگر package resolution، Docker acceptance، یا
   مسیر اختیاری Telegram شکست بخورد، گردش‌کار را شکست‌خورده می‌کند.

منابع نامزد:

- `source=npm`: فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق
  انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. برای
  پذیرش beta/stable منتشرشده از این استفاده کنید.
- `source=ref`: یک branch، tag، یا SHA کامل commit مربوط به `package_ref` مورداعتماد را pack می‌کند.
  resolver، branchها/tagهای OpenClaw را fetch می‌کند، تأیید می‌کند commit انتخاب‌شده از
  تاریخچه branch مخزن یا یک release tag قابل‌دسترسی است، deps را در یک
  worktree detached نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` pack می‌کند.
- `source=url`: یک `.tgz` به‌صورت HTTPS دانلود می‌کند؛ `package_sha256` الزامی است.
- `source=artifact`: یک `.tgz` را از `artifact_run_id` و
  `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای
  artifactهای اشتراک‌گذاری‌شده خارجی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد مورداعتماد
workflow/harness است که آزمون را اجرا می‌کند. `package_ref` همان source commit
است که وقتی `source=ref` باشد pack می‌شود. این اجازه می‌دهد harness آزمون فعلی
commitهای source مورداعتماد قدیمی‌تر را بدون اجرای منطق workflow قدیمی اعتبارسنجی کند.

profileها به پوشش Docker نگاشت می‌شوند:

- `smoke`: `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package`: `npm-onboard-channel-agent`، `doctor-switch`،
  `update-channel-switch`، `bundled-channel-deps-compat`، `plugins-offline`،
  `plugin-update`
- `product`: `package` به‌علاوه `mcp-channels`، `cron-mcp-cleanup`،
  `openai-web-search-minimal`، `openwebui`
- `full`: chunkهای کامل release-path مربوط به Docker همراه با OpenWebUI
- `custom`: مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد الزامی است

Release checks، Package Acceptance را با `source=ref`،
`package_ref=<release-ref>`، `workflow_ref=<release workflow ref>`،
`suite_profile=custom`،
`docker_lanes='bundled-channel-deps-compat plugins-offline'`، و
`telegram_mode=mock-openai` فراخوانی می‌کنند. chunkهای Docker
release-path مسیرهای همپوشان package/update/plugin را پوشش می‌دهند، در حالی که Package
Acceptance اثبات سازگاری bundled-channel به‌صورت artifact-native، Plugin آفلاین، و
Telegram را در برابر همان tarball package حل‌شده نگه می‌دارد.
Release checks مربوط به Cross-OS همچنان onboarding، installer، و
رفتار platform مختص سیستم‌عامل را پوشش می‌دهند؛ اعتبارسنجی محصول package/update باید با Package
Acceptance شروع شود. مسیرهای packaged و installer fresh در Windows همچنین تأیید می‌کنند که یک
package نصب‌شده می‌تواند یک override کنترل مرورگر را از یک مسیر خام مطلق
Windows import کند. smoke مربوط به نوبت agent در Cross-OS برای OpenAI به‌صورت پیش‌فرض از
`OPENCLAW_CROSS_OS_OPENAI_MODEL` وقتی تنظیم شده باشد استفاده می‌کند، و در غیر این صورت از `openai/gpt-5.4-mini`، تا
اثبات install و gateway سریع و قطعی بماند. مسیرهای اختصاصی live
provider/model همچنان مسیریابی گسترده‌تر مدل را پوشش می‌دهند، از جمله پیش‌فرض‌های کندتر
frontier.

Package Acceptance پنجره‌های سازگاری قدیمی محدود برای packageهای از قبل
منتشرشده دارد. packageها تا `2026.4.25`، شامل `2026.4.25-beta.*`،
ممکن است از مسیر سازگاری برای ورودی‌های QA خصوصی شناخته‌شده در
`dist/postinstall-inventory.json` استفاده کنند که به فایل‌های حذف‌شده از tarball اشاره دارند؛
`doctor-switch` ممکن است زیرمورد persistence مربوط به `gateway install --wrapper` را
وقتی package آن flag را ارائه نمی‌کند رد کند؛ `update-channel-switch` ممکن است
`pnpm.patchedDependencies` گم‌شده را از fixture جعلی git مشتق‌شده از tarball حذف کند و
`update.channel` ذخیره‌شده گم‌شده را log کند؛ smokeهای Plugin ممکن است مکان‌های install-record قدیمی را بخوانند
یا نبود persistence مربوط به marketplace install-record را بپذیرند؛ و
`plugin-update` ممکن است مهاجرت metadata مربوط به config را مجاز بداند در حالی که همچنان
الزام می‌کند install record و رفتار no-reinstall بدون تغییر بمانند. package منتشرشده
`2026.4.26` نیز ممکن است برای فایل‌های local build metadata stamp که
از قبل منتشر شده بودند هشدار دهد. packageهای بعدی باید قراردادهای مدرن را برآورده کنند؛ همان
شرایط به‌جای warn یا skip شکست می‌خورند.

نمونه‌ها:

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
شروع کنید تا منبع بسته، نسخه، و SHA-256 را تأیید کنید. سپس اجرای فرزند
`docker_acceptance` و آرتیفکت‌های Docker آن را بررسی کنید:
`.artifacts/docker-tests/**/summary.json`، `failures.json`، گزارش‌های lane، زمان‌بندی‌های فاز،
و فرمان‌های اجرای دوباره. به‌جای اجرای دوباره‌ی کل اعتبارسنجی انتشار، اجرای دوباره‌ی پروفایل بسته‌ی ناموفق یا
laneهای دقیق Docker را ترجیح دهید.

QA Lab دارای laneهای CI اختصاصی خارج از گردش‌کار اصلی با دامنه‌گذاری هوشمند است. گردش‌کار
`Parity gate` روی تغییرات PR منطبق و dispatch دستی اجرا می‌شود؛ این گردش‌کار
runtime خصوصی QA را می‌سازد و بسته‌های agentic شبیه‌سازی‌شده‌ی GPT-5.5 و Opus 4.6 را
مقایسه می‌کند. گردش‌کار `QA-Lab - All Lanes` هر شب روی `main` و با
dispatch دستی اجرا می‌شود؛ این گردش‌کار parity gate شبیه‌سازی‌شده، lane زنده‌ی Matrix، و laneهای زنده‌ی
Telegram و Discord را به‌صورت jobهای موازی منشعب می‌کند. jobهای زنده از
محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند. بررسی‌های انتشار
laneهای transport زنده‌ی Matrix و Telegram را با provider شبیه‌سازی‌شده‌ی قطعی
و مدل‌های واجدشرایط mock (`mock-openai/gpt-5.5` و
`mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد کانال از تأخیر مدل زنده
و راه‌اندازی عادی provider-plugin جدا بماند. Gateway transport زنده همچنین
جست‌وجوی حافظه را غیرفعال می‌کند، زیرا parity مربوط به QA رفتار حافظه را جداگانه پوشش می‌دهد؛
اتصال‌پذیری provider توسط مجموعه‌های جداگانه‌ی مدل زنده، provider بومی،
و provider Docker پوشش داده می‌شود. Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند،
و فقط وقتی CLI checkout‌شده از آن پشتیبانی کند، `--fail-fast` را اضافه می‌کند. مقدار پیش‌فرض CLI
و ورودی دستی گردش‌کار همچنان `all` است؛ dispatch دستی `matrix_profile=all`
همیشه پوشش کامل Matrix را به jobهای `transport`، `media`،
`e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` تقسیم می‌کند. `OpenClaw Release Checks` همچنین
laneهای انتشار-حیاتی QA Lab را پیش از تأیید انتشار اجرا می‌کند؛ gate برابری QA آن
بسته‌های candidate و baseline را به‌صورت jobهای lane موازی اجرا می‌کند، سپس
هر دو آرتیفکت را در یک job گزارش کوچک دانلود می‌کند تا مقایسه‌ی parity نهایی انجام شود.
مسیر landing مربوط به PR را پشت `Parity gate` قرار ندهید، مگر اینکه تغییر واقعاً
runtime مربوط به QA، parity بسته‌ی مدل، یا سطحی را لمس کند که گردش‌کار parity مالک آن است.
برای اصلاحات عادی کانال، پیکربندی، مستندات، یا آزمون واحد، آن را سیگنالی اختیاری
در نظر بگیرید و به شواهد CI/check دامنه‌گذاری‌شده عمل کنید.

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای
پاک‌سازی تکراری‌ها پس از land است. پیش‌فرض آن dry-run است و فقط PRهای صراحتاً
فهرست‌شده را زمانی می‌بندد که `apply=true` باشد. پیش از تغییر GitHub، تأیید می‌کند که
PR land‌شده merge شده است و هر تکراری یا issue ارجاع‌شده‌ی مشترک دارد
یا hunkهای تغییر یافته‌ی هم‌پوشان.

گردش‌کار `CodeQL` عمداً یک اسکنر امنیتی narrow first-pass است،
نه پیمایش کامل repository. اجراهای روزانه و دستی کد گردش‌کار Actions
به‌علاوه‌ی سطح‌های پرریسک‌تر JavaScript/TypeScript مربوط به auth، secrets، sandbox، cron، و
gateway را با queryهای امنیتی high-precision در دسته‌ی
`/codeql-critical-security/core-auth-secrets` اسکن می‌کنند. job مربوط به
channel-runtime-boundary به‌طور جداگانه قراردادهای پیاده‌سازی کانال core
به‌علاوه‌ی runtime مربوط به channel plugin، gateway، Plugin SDK، secrets، و
نقاط تماس audit را زیر دسته‌ی `/codeql-critical-security/channel-runtime-boundary`
اسکن می‌کند تا سیگنال امنیت کانال بدون گسترش دسته‌ی baseline
auth/secrets مقیاس‌پذیر بماند. job مربوط به network-ssrf-boundary سطح‌های core SSRF، پردازش IP،
network guard، web-fetch، و سیاست SSRF در Plugin SDK را زیر دسته‌ی
`/codeql-critical-security/network-ssrf-boundary` اسکن می‌کند تا سیگنال مرز اعتماد شبکه
از baseline امنیتی auth/secrets جدا بماند.
job مربوط به mcp-process-tool-boundary سرورهای MCP، helperهای اجرای process،
تحویل خروجی، و gateهای اجرای ابزار agent را زیر دسته‌ی
`/codeql-critical-security/mcp-process-tool-boundary` اسکن می‌کند تا سیگنال مرز command و
tool هم از baseline auth/secrets و هم از shard کیفیت غیرامنیتی MCP/process
جدا بماند. job مربوط به plugin-trust-boundary سطح‌های اعتماد مربوط به نصب
plugin، loader، manifest، registry، staging وابستگی runtime،
source-loading، public-surface، و قرارداد بسته‌ی Plugin SDK را زیر
دسته‌ی `/codeql-critical-security/plugin-trust-boundary` اسکن می‌کند تا سیگنال
زنجیره‌ی تأمین plugin و بارگذاری runtime هم از کد پیاده‌سازی pluginهای bundled
و هم از shard کیفیت غیرامنیتی plugin جدا بماند.

گردش‌کار `CodeQL Android Critical Security` shard زمان‌بندی‌شده‌ی امنیت Android است.
این گردش‌کار برنامه‌ی Android را به‌صورت دستی برای CodeQL روی کوچک‌ترین label مربوط به
runner لینوکسی Blacksmith که workflow sanity آن را می‌پذیرد می‌سازد و نتایج را
زیر دسته‌ی `/codeql-critical-security/android` بارگذاری می‌کند.

گردش‌کار `CodeQL macOS Critical Security` shard امنیت هفتگی/دستی macOS است.
این گردش‌کار برنامه‌ی macOS را به‌صورت دستی برای CodeQL روی Blacksmith macOS می‌سازد،
نتایج build وابستگی را از SARIF بارگذاری‌شده فیلتر می‌کند، و نتایج را
زیر دسته‌ی `/codeql-critical-security/macos` بارگذاری می‌کند. آن را بیرون از گردش‌کار پیش‌فرض روزانه
نگه دارید، زیرا build مربوط به macOS حتی در حالت clean نیز runtime را تحت سلطه می‌گیرد.

گردش‌کار `CodeQL Critical Quality` shard غیرامنیتی متناظر است. این گردش‌کار
فقط queryهای کیفیت JavaScript/TypeScript غیرامنیتی با severity خطا را
روی سطح‌های محدود و ارزشمند در runner لینوکسی کوچک‌تر Blacksmith اجرا می‌کند. dispatch دستی آن
`profile=all|plugin-sdk-package-contract` را می‌پذیرد؛ پروفایل narrow
نخستین hook آموزشی/تکراری برای اجرای یک shard کیفیت به‌صورت
ایزوله و بدون dispatch کردن بقیه‌ی گردش‌کار است.
job مربوط به
core-auth-secrets کد مرز امنیتی auth، secrets، sandbox، cron، و gateway را
زیر دسته‌ی جداگانه‌ی `/codeql-critical-quality/core-auth-secrets`
اسکن می‌کند. job مربوط به config-boundary
قراردادهای schema پیکربندی، migration، normalization، و IO را زیر
دسته‌ی جداگانه‌ی `/codeql-critical-quality/config-boundary` اسکن می‌کند. job مربوط به
gateway-runtime-boundary schemaهای پروتکل gateway و قراردادهای method سرور
را زیر دسته‌ی جداگانه‌ی
`/codeql-critical-quality/gateway-runtime-boundary` اسکن می‌کند. job مربوط به
channel-runtime-boundary قراردادهای پیاده‌سازی کانال core را
زیر دسته‌ی جداگانه‌ی `/codeql-critical-quality/channel-runtime-boundary` اسکن می‌کند. job مربوط به
agent-runtime-boundary اجرای command، dispatch مدل/provider،
dispatch و queueهای auto-reply، و قراردادهای runtime مربوط به control-plane در ACP را
زیر دسته‌ی جداگانه‌ی `/codeql-critical-quality/agent-runtime-boundary` اسکن می‌کند. job مربوط به
mcp-process-runtime-boundary سرورهای MCP و bridgeهای tool، helperهای
supervision مربوط به process، و قراردادهای تحویل outbound را زیر دسته‌ی جداگانه‌ی
`/codeql-critical-quality/mcp-process-runtime-boundary` اسکن می‌کند. job مربوط به
memory-runtime-boundary حافظه‌ی host SDK، facadeهای runtime حافظه،
aliasهای حافظه در Plugin SDK، glue فعال‌سازی runtime حافظه، و فرمان‌های doctor حافظه
را زیر دسته‌ی جداگانه‌ی `/codeql-critical-quality/memory-runtime-boundary`
اسکن می‌کند. job مربوط به
ui-control-plane راه‌اندازی Control UI، پایداری محلی، جریان‌های کنترل gateway،
و قراردادهای runtime مربوط به control-plane وظایف را زیر دسته‌ی جداگانه‌ی
`/codeql-critical-quality/ui-control-plane` اسکن می‌کند. job مربوط به
web-media-runtime-boundary قراردادهای runtime مربوط به fetch/search وب core، IO رسانه،
درک رسانه، تولید تصویر، و تولید رسانه را زیر دسته‌ی جداگانه‌ی
`/codeql-critical-quality/web-media-runtime-boundary` اسکن می‌کند. job مربوط به
plugin-boundary قراردادهای entrypoint مربوط به loader، registry، public-surface، و Plugin SDK
را زیر یک دسته‌ی جداگانه‌ی `/codeql-critical-quality/plugin-boundary`
اسکن می‌کند. job مربوط به plugin-sdk-package-contract منبع Plugin SDK منتشرشده در سمت بسته
و helperهای قرارداد بسته‌ی plugin را زیر دسته‌ی جداگانه‌ی
`/codeql-critical-quality/plugin-sdk-package-contract` اسکن می‌کند. گردش‌کار را
از امنیت جدا نگه دارید تا یافته‌های کیفیت بتوانند بدون پنهان کردن سیگنال امنیتی
زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند.
گسترش CodeQL برای Swift، Python، و pluginهای bundled فقط پس از آنکه پروفایل‌های narrow
runtime و سیگنال پایدار داشتند، باید به‌عنوان کار follow-up دامنه‌گذاری‌شده یا shardشده
دوباره اضافه شود.

گردش‌کار `Docs Agent` یک lane نگه‌داری Codex رویدادمحور برای هم‌راستا نگه داشتن
مستندات موجود با تغییرات اخیراً land‌شده است. برنامه‌ی زمان‌بندی خالص ندارد: اجرای موفق
CI مربوط به push غیر-bot روی `main` می‌تواند آن را trigger کند، و dispatch دستی می‌تواند
آن را مستقیماً اجرا کند. invocationهای workflow-run زمانی skip می‌شوند که `main` جلوتر رفته باشد یا وقتی
اجرای Docs Agent غیر-skip‌شده‌ی دیگری در یک ساعت گذشته ایجاد شده باشد. وقتی اجرا می‌شود،
بازه‌ی commit از SHA منبع قبلی Docs Agent غیر-skip‌شده تا
`main` فعلی را بازبینی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه‌ی تغییرات main انباشته‌شده از
آخرین نوبت مستندات را پوشش دهد.

گردش‌کار `Test Performance Agent` یک lane نگه‌داری Codex رویدادمحور
برای آزمون‌های کند است. برنامه‌ی زمان‌بندی خالص ندارد: اجرای موفق CI مربوط به push غیر-bot روی
`main` می‌تواند آن را trigger کند، اما اگر invocation دیگری از workflow-run در همان روز UTC
قبلاً اجرا شده باشد یا در حال اجرا باشد، skip می‌شود. dispatch دستی از آن gate فعالیت روزانه
عبور می‌کند. این lane گزارش عملکرد Vitest گروه‌بندی‌شده‌ی full-suite می‌سازد، به Codex اجازه می‌دهد
به‌جای refactorهای گسترده فقط اصلاحات کوچک عملکرد آزمون با حفظ پوشش انجام دهد،
سپس گزارش full-suite را دوباره اجرا می‌کند و تغییراتی را که تعداد آزمون‌های baseline pass‌شده را کاهش دهند
رد می‌کند. اگر baseline آزمون‌های failing داشته باشد، Codex ممکن است
فقط failureهای واضح را اصلاح کند و گزارش full-suite پس از agent باید قبل از
commit شدن هر چیزی pass شود. وقتی `main` پیش از land شدن push ربات جلو می‌رود، این lane
patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را دوباره تلاش می‌کند؛
patchهای stale دارای conflict skip می‌شوند. این lane از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا action مربوط به Codex
بتواند همان وضعیت ایمنی drop-sudo را مثل docs agent حفظ کند.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## نمای کلی کار

| کار                              | هدف                                                                                      | زمان اجرا                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تغییرات فقط مستندات، محدوده‌های تغییرکرده، افزونه‌های تغییرکرده، و مانیفست CI را شناسایی می‌کند      | همیشه در pushها و PRهای غیرپیش‌نویس |
| `security-scm-fast`              | شناسایی کلید خصوصی و ممیزی workflow از طریق `zizmor`                                        | همیشه در pushها و PRهای غیرپیش‌نویس |
| `security-dependency-audit`      | ممیزی lockfile تولید بدون وابستگی در برابر اعلان‌های امنیتی npm                             | همیشه در pushها و PRهای غیرپیش‌نویس |
| `security-fast`                  | تجمیع الزامی برای کارهای امنیتی سریع                                                | همیشه در pushها و PRهای غیرپیش‌نویس |
| `build-artifacts`                | ساخت `dist/`، رابط کاربری کنترل، بررسی‌های artifactهای ساخته‌شده، و artifactهای downstream قابل استفاده مجدد          | تغییرات مرتبط با Node              |
| `checks-fast-core`               | مسیرهای سریع صحت‌سنجی Linux مانند بررسی‌های bundled/plugin-contract/protocol                 | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های shardشده قرارداد کانال با نتیجه بررسی تجمیعی پایدار                         | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای آزمون Core Node، به‌جز مسیرهای کانال، bundled، contract، و extension             | تغییرات مرتبط با Node              |
| `check`                          | معادل shardشده دروازه محلی اصلی: نوع‌های تولید، lint، guardها، نوع‌های آزمون، و smoke سخت‌گیرانه   | تغییرات مرتبط با Node              |
| `check-additional`               | معماری، مرز، guardهای سطح extension، مرز package، و shardهای gateway-watch | تغییرات مرتبط با Node              |
| `build-smoke`                    | آزمون‌های smoke برای CLI ساخته‌شده و smoke حافظه راه‌اندازی                                               | تغییرات مرتبط با Node              |
| `checks`                         | تأییدکننده برای آزمون‌های کانال artifactهای ساخته‌شده                                                    | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | مسیر ساخت و smoke سازگاری Node 22                                                   | اجرای دستی CI برای انتشارها    |
| `check-docs`                     | قالب‌بندی مستندات، lint، و بررسی لینک‌های خراب                                                | مستندات تغییر کرده‌اند                       |
| `skills-python`                  | Ruff + pytest برای skills مبتنی بر Python                                                       | تغییرات مرتبط با skills پایتونی      |
| `checks-windows`                 | آزمون‌های مخصوص فرایند/مسیر Windows به‌علاوه رگرسیون‌های مشترک مشخص‌کننده import زمان اجرا         | تغییرات مرتبط با Windows           |
| `macos-node`                     | مسیر آزمون TypeScript در macOS با استفاده از artifactهای ساخته‌شده مشترک                                  | تغییرات مرتبط با macOS             |
| `macos-swift`                    | lint، ساخت، و آزمون‌های Swift برای برنامه macOS                                               | تغییرات مرتبط با macOS             |
| `android`                        | آزمون‌های واحد Android برای هر دو flavor به‌علاوه یک ساخت APK debug                                 | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه آزمون‌های کند Codex پس از فعالیت مورد اعتماد                                    | موفقیت CI اصلی یا اجرای دستی |

اجراهای دستی CI همان گراف کار CI عادی را اجرا می‌کنند اما هر مسیر
محدوده‌بندی‌شده غیر Android را روشن می‌کنند: shardهای Linux Node، shardهای bundled-plugin، قراردادهای کانال،
سازگاری Node 22، `check`، `check-additional`، smoke ساخت، بررسی‌های مستندات،
Skills پایتونی، Windows، macOS، و i18n رابط کاربری کنترل. اجراهای دستی مستقل CI
فقط با `include_android=true`، Android را اجرا می‌کنند؛ چتر کامل انتشار
با پاس‌دادن `include_android=true`، Android را فعال می‌کند. بررسی‌های ایستای پیش‌انتشار Plugin،
shard فقط مخصوص انتشار `agentic-plugins`، پیمایش دسته‌ای کامل extension،
و مسیرهای Docker پیش‌انتشار Plugin از CI کنار گذاشته شده‌اند. مجموعه پیش‌انتشار Docker
فقط وقتی اجرا می‌شود که `Full Release Validation`، workflow جداگانه
`Plugin Prerelease` را با فعال‌بودن دروازه اعتبارسنجی انتشار اجرا کند.
اجراهای دستی از یک گروه همزمانی
یکتا استفاده می‌کنند تا یک مجموعه کامل release-candidate توسط
push یا PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به یک
فراخواننده مورد اعتماد اجازه می‌دهد آن گراف را روی یک branch، tag، یا SHA کامل commit اجرا کند، در حالی که
از فایل workflow مربوط به ref انتخاب‌شده برای اجرا استفاده می‌شود.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ترتیب fail-fast

کارها به‌گونه‌ای مرتب شده‌اند که بررسی‌های ارزان، پیش از اجرای بررسی‌های پرهزینه شکست بخورند:

1. `preflight` تصمیم می‌گیرد اصلاً کدام مسیرها وجود داشته باشند. منطق‌های `docs-scope` و `changed-scope` گام‌هایی داخل این کار هستند، نه کارهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای کارهای سنگین‌تر artifact و ماتریس پلتفرم، سریع شکست می‌خورند.
3. `build-artifacts` با مسیرهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان downstream به‌محض آماده‌شدن ساخت مشترک شروع کنند.
4. پس از آن، مسیرهای سنگین‌تر پلتفرم و زمان اجرا منشعب می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با تست‌های واحد در `src/scripts/ci-changed-scope.test.ts` پوشش داده می‌شود.
اجرای دستی، تشخیص changed-scope را رد می‌کند و باعث می‌شود مانیفست preflight
طوری عمل کند که انگار همه ناحیه‌های scoped تغییر کرده‌اند.
ویرایش‌های workflow مربوط به CI، گراف Node CI به‌همراه linting workflow را اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native ویندوز، Android یا macOS را اجباری نمی‌کنند؛ آن laneهای پلتفرمی همچنان فقط به تغییرات source همان پلتفرم محدود می‌مانند.
ویرایش‌های فقط مربوط به routing در CI، ویرایش‌های منتخب fixture ارزان برای core-test، و ویرایش‌های محدود helper/test-routing برای قرارداد Plugin از مسیر سریع مانیفست فقط-Node استفاده می‌کنند: preflight، security، و یک تسک `checks-fast-core`. این مسیر وقتی فایل‌های تغییریافته محدود به سطح‌های routing یا helper هستند که تسک سریع مستقیما تمرینشان می‌کند، از build artifactها، سازگاری Node 22، قراردادهای channel، shardهای کامل core، shardهای Pluginهای بسته‌بندی‌شده، و ماتریس‌های guard اضافی پرهیز می‌کند.
بررسی‌های Windows Node به wrapperهای مخصوص فرایند/مسیر ویندوز، helperهای runner مربوط به npm/pnpm/UI، پیکربندی package manager، و سطح‌های workflow مربوط به CI که آن lane را اجرا می‌کنند محدود هستند؛ تغییرات نامرتبط در source، Plugin، install-smoke، و فقط-test روی laneهای Linux Node می‌مانند تا یک worker ویندوز 16-vCPU را برای پوششی که از قبل توسط shardهای عادی test تمرین می‌شود رزرو نکنند.
workflow جداگانه `install-smoke` همان اسکریپت scope را از طریق job خودش به نام `preflight` دوباره استفاده می‌کند. این workflow پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند. pull requestها مسیر سریع را برای سطح‌های Docker/package، تغییرات package/manifest مربوط به Plugin بسته‌بندی‌شده، و سطح‌های core plugin/channel/gateway/Plugin SDK که jobهای Docker smoke تمرین می‌کنند اجرا می‌کنند. تغییرات فقط-source در Pluginهای بسته‌بندی‌شده، ویرایش‌های فقط-test، و ویرایش‌های فقط-docs workerهای Docker را رزرو نمی‌کنند. مسیر سریع، image مربوط به root Dockerfile را یک بار build می‌کند، CLI را بررسی می‌کند، smoke مربوط به CLI برای حذف agents در shared-workspace را اجرا می‌کند، e2e مربوط به container gateway-network را اجرا می‌کند، یک build arg برای extension بسته‌بندی‌شده را راستی‌آزمایی می‌کند، و پروفایل Docker محدود مربوط به Plugin بسته‌بندی‌شده را زیر timeout تجمعی 240 ثانیه‌ای اجرا می‌کند که Docker run هر سناریو جداگانه محدود شده است. مسیر کامل، نصب QR package و پوشش installer Docker/update را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، بررسی‌های release با workflow-call، و pull requestهایی نگه می‌دارد که واقعا سطح‌های installer/package/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک image مخصوص smoke از root Dockerfile در GHCR برای target-SHA آماده یا دوباره استفاده می‌کند، سپس نصب QR package، smokeهای root Dockerfile/gateway، smokeهای installer/update، و Docker E2E سریع Plugin بسته‌بندی‌شده را به‌عنوان jobهای جداگانه اجرا می‌کند تا کار installer پشت smokeهای root image منتظر نماند. pushهای `main`، از جمله merge commitها، مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق changed-scope روی یک push درخواست پوشش کامل می‌دهد، workflow همان Docker smoke سریع را نگه می‌دارد و full install smoke را به اعتبارسنجی شبانه یا release واگذار می‌کند. smoke کند image-provider برای نصب global با Bun به‌طور جداگانه با `run_bun_global_install_smoke` gate می‌شود؛ این smoke در زمان‌بندی شبانه و از workflow بررسی‌های release اجرا می‌شود، و dispatchهای دستی `install-smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` آن را اجرا نمی‌کنند. تست‌های QR و installer Docker، Dockerfileهای install-focused خودشان را نگه می‌دارند. اجرای محلی `test:docker:all` یک image مشترک live-test را از پیش build می‌کند، OpenClaw را یک بار به‌صورت tarball مربوط به npm package می‌کند، و دو image مشترک `scripts/e2e/Dockerfile` می‌سازد: یک runner خام Node/Git برای laneهای installer/update/plugin-dependency و یک image functional که همان tarball را برای laneهای عملکرد عادی در `/app` نصب می‌کند. تعریف laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` برای هر lane image را انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند؛ تعداد slot پیش‌فرض main-pool را که 10 است با `OPENCLAW_DOCKER_ALL_PARALLELISM` و تعداد slot مربوط به tail-pool حساس به provider را که 10 است با `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` تنظیم کنید. سقف laneهای سنگین به‌طور پیش‌فرض `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` است تا laneهای npm install و چندسرویسی، Docker را بیش از ظرفیت درگیر نکنند، درحالی‌که laneهای سبک‌تر همچنان slotهای موجود را پر می‌کنند. یک lane واحد که از سقف‌های موثر سنگین‌تر است، همچنان می‌تواند از pool خالی شروع شود و سپس تا آزاد کردن ظرفیت به‌تنهایی اجرا می‌شود. شروع laneها به‌طور پیش‌فرض با فاصله 2 ثانیه‌ای انجام می‌شود تا از طوفان create در daemon محلی Docker جلوگیری شود؛ با `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` یا مقدار دیگری برحسب میلی‌ثانیه آن را override کنید. preflight تجمعی محلی Docker را preflight می‌کند، containerهای کهنه OpenClaw E2E را حذف می‌کند، وضعیت active-lane را منتشر می‌کند، زمان‌بندی laneها را برای مرتب‌سازی longest-first پایدار می‌کند، و از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` برای بررسی scheduler پشتیبانی می‌کند. به‌طور پیش‌فرض پس از اولین failure، زمان‌بندی laneهای pooled جدید را متوقف می‌کند، و هر lane یک timeout پشتیبان 120 دقیقه‌ای دارد که با `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` قابل override است؛ laneهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تر مخصوص هر lane دارند. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` laneهای دقیق scheduler را اجرا می‌کند، از جمله laneهای فقط-release مانند `install-e2e` و laneهای split bundled update مانند `bundled-channel-update-acpx`، درحالی‌که cleanup smoke را رد می‌کند تا agents بتوانند یک lane شکست‌خورده را بازتولید کنند. workflow قابل استفاده مجدد live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد که کدام package، نوع image، live image، lane، و پوشش credential لازم است، سپس `scripts/docker-e2e.mjs` آن plan را به outputها و summaryهای GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` package می‌کند، یا artifact مربوط به package از اجرای فعلی را دانلود می‌کند، یا artifact مربوط به package را از `package_artifact_run_id` دانلود می‌کند؛ inventory tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای package-installed نیاز دارد، imageهای GHCR Docker E2E از نوع bare/functional با tag بر پایه package digest را از طریق cache لایه Docker متعلق به Blacksmith build و push می‌کند؛ و به‌جای rebuild، از ورودی‌های ارائه‌شده `docker_e2e_bare_image`/`docker_e2e_functional_image` یا imageهای موجود بر پایه package digest دوباره استفاده می‌کند. pull کردن Docker imageها با timeout محدود 180 ثانیه‌ای برای هر attempt دوباره تلاش می‌شود تا جریان registry/cache گیرکرده، به‌جای مصرف بخش بزرگی از critical path در CI، سریع retry شود. workflow `Package Acceptance` gate سطح‌بالای package است: یک candidate را از npm، یک `package_ref` قابل اعتماد، یک tarball HTTPS به‌همراه SHA-256، یا artifact مربوط به workflow قبلی resolve می‌کند، سپس همان artifact واحد `package-under-test` را وارد workflow قابل استفاده مجدد Docker E2E می‌کند. این workflow `workflow_ref` را جدا از `package_ref` نگه می‌دارد تا منطق پذیرش فعلی بتواند commitهای قدیمی‌تر قابل اعتماد را بدون checkout کردن کد workflow قدیمی اعتبارسنجی کند. بررسی‌های release یک delta سفارشی Package Acceptance برای target ref اجرا می‌کنند: سازگاری bundled-channel، fixtureهای offline plugin، و QA مربوط به Telegram package در برابر tarball resolve‌شده. suite مربوط به release-path Docker، jobهای کوچک‌تر و chunkشده را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع image مورد نیاز خودش را pull کند و چند lane را از طریق همان scheduler وزن‌دار اجرا کند (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`، `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). وقتی پوشش کامل release-path آن را درخواست کند، OpenWebUI در `plugins-runtime-services` ادغام می‌شود، و chunk مستقل `openwebui` را فقط برای dispatchهای فقط-OpenWebUI نگه می‌دارد. نام‌های قدیمی chunk تجمعی `package-update`، `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان برای rerunهای دستی کار می‌کنند، اما workflow release از chunkهای split استفاده می‌کند تا installer E2E و sweepهای install/uninstall مربوط به Plugin بسته‌بندی‌شده critical path را اشغال نکنند. alias lane به نام `install-e2e` همچنان alias تجمعی rerun دستی برای هر دو lane installer مربوط به provider باقی می‌ماند. chunk `bundled-channels` به‌جای lane ترتیبی all-in-one به نام `bundled-channel-deps`، laneهای split `bundled-channel-*` و `bundled-channel-update-*` را اجرا می‌کند. هر chunk، `.artifacts/docker-tests/` را با logهای lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های phase، plan JSON مربوط به scheduler، جدول‌های slow-lane، و commandهای rerun برای هر lane upload می‌کند. ورودی `docker_lanes` در workflow، laneهای انتخاب‌شده را در برابر imageهای آماده‌شده اجرا می‌کند، نه jobهای chunk را؛ این کار debugging lane شکست‌خورده را به یک job هدفمند Docker محدود می‌کند و artifact مربوط به package را برای همان run آماده، دانلود، یا دوباره استفاده می‌کند؛ اگر lane انتخاب‌شده یک lane live Docker باشد، job هدفمند برای همان rerun، image مربوط به live-test را به‌صورت محلی build می‌کند. commandهای rerun تولیدشده GitHub برای هر lane، وقتی آن مقادیر وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name`، و ورودی‌های image آماده‌شده هستند، تا یک lane شکست‌خورده بتواند دقیقا همان package و imageهای run شکست‌خورده را دوباره استفاده کند. از `pnpm test:docker:rerun <run-id>` برای دانلود artifactهای Docker از یک run در GitHub و چاپ commandهای rerun هدفمند ترکیبی/برای هر lane استفاده کنید؛ از `pnpm test:docker:timings <summary.json>` برای summaryهای slow-lane و critical-path مربوط به phase استفاده کنید. workflow زمان‌بندی‌شده live/E2E هر روز suite کامل release-path Docker را اجرا می‌کند. ماتریس bundled update بر اساس target به‌روزرسانی split شده است تا پاس‌های تکراری npm update و doctor repair بتوانند همراه با سایر بررسی‌های bundled shard شوند.

chunkهای فعلی release Docker عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، `plugins-runtime-install-a`، `plugins-runtime-install-b`، `plugins-runtime-install-c`، `plugins-runtime-install-d`، `plugins-runtime-install-e`، `plugins-runtime-install-f`، `plugins-runtime-install-g`، `plugins-runtime-install-h`، `bundled-channels-core`، `bundled-channels-update-a`، `bundled-channels-update-discord`، `bundled-channels-update-b`، و `bundled-channels-contracts`. chunk تجمعی `bundled-channels` همچنان برای rerunهای دستی one-shot در دسترس است، و `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای تجمعی plugin/runtime باقی می‌مانند، اما workflow release از chunkهای split استفاده می‌کند تا channel smokeها، targetهای update، بررسی‌های runtime مربوط به Plugin، و sweepهای install/uninstall مربوط به Plugin بسته‌بندی‌شده بتوانند موازی اجرا شوند. dispatchهای هدفمند `docker_lanes` نیز پس از یک مرحله مشترک آماده‌سازی package/image، چند lane انتخاب‌شده را به jobهای موازی split می‌کنند، و laneهای update مربوط به bundled-channel برای failureهای گذرای شبکه npm یک بار retry می‌شوند.

منطق محلی خط تغییر‌یافته در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. این دروازه بررسی محلی نسبت به محدوده گسترده پلتفرم CI درباره مرزهای معماری سخت‌گیرتر است: تغییرات تولیدی هسته، typecheck تولید هسته و test هسته به‌همراه lint/guardهای هسته را اجرا می‌کنند، تغییرات فقط test هسته فقط typecheck تست هسته به‌همراه lint هسته را اجرا می‌کنند، تغییرات تولیدی افزونه، typecheck تولید افزونه و test افزونه به‌همراه lint افزونه را اجرا می‌کنند، و تغییرات فقط test افزونه، typecheck test افزونه به‌همراه lint افزونه را اجرا می‌کنند. تغییرات عمومی Plugin SDK یا قرارداد Plugin به typecheck افزونه گسترش می‌یابند، چون افزونه‌ها به آن قراردادهای هسته وابسته‌اند، اما sweepهای Vitest افزونه کار test صریح هستند. افزایش نسخه‌هایی که فقط فراداده انتشار را تغییر می‌دهند، بررسی‌های هدفمند نسخه/config/root-dependency را اجرا می‌کنند. تغییرات ناشناخته root/config برای ایمنی به همه خط‌های بررسی fail safe می‌شوند.
مسیریابی محلی test تغییر‌یافته در `scripts/test-projects.test-support.mjs` قرار دارد و
عمدا ارزان‌تر از `check:changed` است: ویرایش مستقیم testها خودشان را اجرا می‌کنند،
ویرایش‌های source ابتدا mappingهای صریح، سپس testهای sibling و وابسته‌های import-graph
را ترجیح می‌دهند. پیکربندی تحویل group-room مشترک یکی از mappingهای صریح است:
تغییرات در پیکربندی visible-reply گروه، حالت تحویل پاسخ source، یا
system prompt ابزار message از طریق testهای پاسخ هسته به‌همراه regressionهای تحویل Discord و
Slack مسیر‌یابی می‌شوند تا تغییر default مشترک پیش از نخستین push
PR شکست بخورد. فقط زمانی از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید که تغییر
آن‌قدر در سطح harness گسترده باشد که مجموعه mapped ارزان proxy قابل اعتمادی نباشد.

برای اعتبارسنجی Testbox، از ریشه repo اجرا کنید و برای اثبات گسترده، box گرم‌شده تازه را ترجیح دهید.
قبل از صرف یک دروازه کند روی boxای که دوباره استفاده شده، منقضی شده، یا
تازه sync غیرمنتظره بزرگی گزارش داده است، ابتدا `pnpm testbox:sanity` را داخل
box اجرا کنید. بررسی sanity وقتی فایل‌های root لازم مانند
`pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` دست‌کم 200
حذف tracked را نشان دهد، سریع fail می‌شود. این معمولا یعنی وضعیت sync راه‌دور کپی قابل اعتمادی
از PR نیست. به‌جای debug کردن failure تست محصول، آن box را متوقف کنید و
یک box تازه گرم کنید. برای PRهای حذف بزرگ عمدی،
برای آن اجرای sanity مقدار `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید. `pnpm
testbox:run` همچنین یک invocation محلی Blacksmith CLI را که بیش از پنج دقیقه
بدون خروجی پس از sync در فاز sync بماند، خاتمه می‌دهد. برای غیرفعال کردن آن guard مقدار
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ از
مقدار millisecond بزرگ‌تری استفاده کنید.

dispatchهای دستی CI، `checks-node-compat-node22` را به‌عنوان پوشش compatibility گسترده اجرا می‌کنند. Android برای CI دستی standalone با `include_android=true` opt-in است و همیشه برای `Full Release Validation` فعال است. `Plugin Prerelease` پوشش محصول/پکیج پرهزینه‌تری است، بنابراین workflow جداگانه‌ای است که توسط `Full Release Validation` یا operator صریح dispatch می‌شود. pull requestهای معمول، pushهای `main`، و dispatchهای دستی standalone CI آن suite را خاموش نگه می‌دارند.

کندترین خانواده‌های test Node تقسیم یا متوازن شده‌اند تا هر job بدون reserve بیش‌ازحد runnerها کوچک بماند: قراردادهای channel به‌صورت سه shard وزن‌دار اجرا می‌شوند، خط‌های unit کوچک هسته paired هستند، auto-reply به‌صورت چهار worker متوازن با subtree پاسخ تقسیم‌شده به shardهای agent-runner، dispatch، و commands/state-routing اجرا می‌شود، و پیکربندی‌های agentic gateway/plugin بین jobهای Node موجود فقط-source agentic پخش می‌شوند، نه اینکه منتظر artifactهای build شده بمانند. testهای گسترده browser، QA، media، و plugin متفرقه به‌جای catch-all مشترک plugin از configهای اختصاصی Vitest خودشان استفاده می‌کنند. `Plugin Prerelease` testهای plugin bundled را بین هشت worker افزونه متوازن می‌کند؛ آن jobهای shard افزونه در هر بار تا دو گروه config plugin را با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای plugin سنگین از نظر import، jobهای CI اضافی ایجاد نکنند. خط گسترده agents از scheduler مشترک file-parallel Vitest استفاده می‌کند، چون بیشتر تحت تاثیر import/scheduling است، نه اینکه متعلق به یک فایل test کند باشد. `runtime-config` با shard infra core-runtime اجرا می‌شود تا shard runtime مشترک مالک tail نشود. shardهای include-pattern با نام shard CI، entryهای timing را ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک config کامل را از shard فیلترشده تشخیص دهد. `check-additional` کارهای compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و معماری runtime topology را از پوشش gateway watch جدا می‌کند؛ shard boundary guard، guardهای مستقل کوچک خود را هم‌زمان داخل یک job اجرا می‌کند. Gateway watch، testهای channel، و shard support-boundary هسته پس از اینکه `dist/` و `dist-runtime/` از قبل build شده‌اند، هم‌زمان داخل `build-artifacts` اجرا می‌شوند و نام‌های check قدیمی خود را به‌عنوان jobهای verifier سبک نگه می‌دارند، در حالی که از دو worker اضافی Blacksmith و یک صف artifact-consumer دوم پرهیز می‌کنند.
CI مربوط به Android هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK debug مربوط به Play را build می‌کند. flavor third-party هیچ source set یا manifest جداگانه‌ای ندارد؛ خط unit-test آن همچنان آن flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، در حالی که از job بسته‌بندی debug APK تکراری در هر push مرتبط با Android پرهیز می‌کند.
GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref `main` انجام می‌شود، jobهای superseded را به‌صورت `cancelled` علامت بزند. مگر اینکه جدیدترین run برای همان ref نیز fail شده باشد، آن را noise مربوط به CI تلقی کنید. checkهای aggregate shard از `!cancelled() && always()` استفاده می‌کنند تا همچنان failureهای عادی shard را گزارش کنند، اما پس از اینکه کل workflow از قبل superseded شده است، صف نشوند.
کلید concurrency خودکار CI نسخه‌گذاری شده است (`CI-v7-*`) تا zombie سمت GitHub در یک گروه queue قدیمی نتواند runهای جدیدتر main را به‌طور نامحدود block کند. runهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و runهای درحال‌اجرا را cancel نمی‌کنند.

## Runnerها

| Runner                           | Jobها                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، jobهای امنیتی سریع و aggregateها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع protocol/contract/bundled، بررسی‌های sharded قرارداد channel، shardهای `check` به‌جز lint، shardها و aggregateهای `check-additional`، verifierهای aggregate test Node، بررسی‌های docs، Python skills، workflow-sanity، labeler، auto-response؛ preflight مربوط به install-smoke نیز از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا matrix مربوط به Blacksmith زودتر بتواند queue شود |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، shardهای افزونه با وزن پایین‌تر، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types`، و `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، shardهای test Linux Node، shardهای test plugin bundled، `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`، که هنوز آن‌قدر به CPU حساس است که 8 vCPU بیش از صرفه‌جویی‌اش هزینه داشت؛ buildهای Docker مربوط به install-smoke، جایی که زمان queue مربوط به 32-vCPU بیش از صرفه‌جویی‌اش هزینه داشت                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-latest` fallback می‌کنند                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` روی `openclaw/openclaw`؛ forkها به `macos-latest` fallback می‌کنند                                                                                                                                                                                                                                                                                                                                                                                                 |

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

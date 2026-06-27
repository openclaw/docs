---
read_when:
    - تغییر رفتار به‌روزرسانی، doctor، پذیرش بسته، یا نصب Plugin در OpenClaw
    - آماده‌سازی یا تأیید یک نامزد انتشار
    - اشکال‌زدایی رگرسیون‌های به‌روزرسانی بسته، پاک‌سازی وابستگی‌های Plugin، یا نصب Plugin
sidebarTitle: Update and plugin tests
summary: OpenClaw چگونه مسیرهای به‌روزرسانی، مهاجرت‌های بسته و رفتار نصب/به‌روزرسانی Plugin را اعتبارسنجی می‌کند
title: 'آزمایش: به‌روزرسانی‌ها و Pluginها'
x-i18n:
    generated_at: "2026-06-27T17:54:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

این چک‌لیست اختصاصی برای اعتبارسنجی به‌روزرسانی و Plugin است. هدف
ساده است: ثابت کند بسته‌ی قابل نصب می‌تواند وضعیت واقعی کاربر را به‌روزرسانی کند، وضعیت
legacy کهنه را از طریق `doctor` ترمیم کند، و همچنان Pluginها را از منابع پشتیبانی‌شده
نصب، بارگذاری، به‌روزرسانی، و حذف کند.

برای نقشه‌ی گسترده‌تر اجراکننده‌ی تست، [تست‌کردن](/fa/help/testing) را ببینید. برای کلیدهای provider زنده
و مجموعه‌تست‌هایی که شبکه را لمس می‌کنند، [تست زنده](/fa/help/testing-live) را ببینید.

## از چه چیزی محافظت می‌کنیم

تست‌های به‌روزرسانی و Plugin از این قراردادها محافظت می‌کنند:

- یک tarball بسته کامل است، `dist/postinstall-inventory.json` معتبر دارد،
  و به فایل‌های بازشده‌ی repo وابسته نیست.
- کاربر می‌تواند از یک بسته‌ی منتشرشده‌ی قدیمی‌تر به بسته‌ی candidate منتقل شود
  بدون اینکه config، agentها، sessionها، workspaceها، allowlistهای Plugin، یا
  config کانال را از دست بدهد.
- `openclaw doctor --fix --non-interactive` مالک مسیرهای پاک‌سازی و ترمیم legacy است.
  startup نباید migrationهای compatibility پنهان برای وضعیت کهنه‌ی Plugin ایجاد کند.
- نصب Plugin از دایرکتوری‌های محلی، repoهای git، بسته‌های npm، و مسیر registry
  ClawHub کار می‌کند.
- وابستگی‌های npm مربوط به Plugin در یک پروژه‌ی npm مدیریت‌شده برای هر Plugin نصب می‌شوند،
  پیش از trust اسکن می‌شوند، و هنگام uninstall از طریق npm حذف می‌شوند تا
  وابستگی‌های hoist‌شده باقی نمانند.
- به‌روزرسانی Plugin وقتی چیزی تغییر نکرده پایدار است: رکوردهای نصب، منبع resolve‌شده،
  چیدمان وابستگی نصب‌شده، و وضعیت enabled دست‌نخورده می‌مانند.

## اثبات محلی هنگام توسعه

از محدوده‌ی باریک شروع کنید:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

برای تغییرات نصب Plugin، حذف نصب، وابستگی، یا inventory بسته، تست‌های متمرکزی را هم
اجرا کنید که seam ویرایش‌شده را پوشش می‌دهند:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

پیش از آنکه هر lane Docker بسته‌ای یک tarball را مصرف کند، artifact بسته را اثبات کنید:

```bash
pnpm release:check
```

`release:check` بررسی‌های drift مربوط به config/docs/API را اجرا می‌کند، inventory توزیع بسته را می‌نویسد،
`npm pack --dry-run` را اجرا می‌کند، فایل‌های بسته‌بندی‌شده‌ی ممنوع را رد می‌کند، tarball را
در یک prefix موقت نصب می‌کند، postinstall را اجرا می‌کند، و entrypointهای کانال bundled را smoke می‌کند.

## laneهای Docker

laneهای Docker اثبات سطح محصول هستند. آن‌ها یک بسته‌ی واقعی را داخل containerهای Linux
نصب یا به‌روزرسانی می‌کنند و رفتار را از طریق فرمان‌های CLI،
startup Gateway، probeهای HTTP، وضعیت RPC، و وضعیت فایل‌سیستم assert می‌کنند.

هنگام تکرار و اصلاح، از laneهای متمرکز استفاده کنید:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

laneهای مهم:

- `test:docker:plugins` smoke نصب Plugin، نصب از پوشه‌ی محلی،
  رفتار skip در به‌روزرسانی پوشه‌ی محلی، پوشه‌های محلی با وابستگی‌های از پیش نصب‌شده،
  نصب بسته‌های `file:`، نصب‌های git با اجرای CLI، به‌روزرسانی‌های moving-ref در git،
  نصب‌های registry npm با وابستگی‌های transitive hoist‌شده، no-opهای به‌روزرسانی npm،
  رد metadata معیوب بسته‌ی npm، نصب fixture محلی ClawHub و no-opهای به‌روزرسانی،
  رفتار به‌روزرسانی marketplace، و فعال‌سازی/inspect بسته‌ی Claude را اعتبارسنجی می‌کند. برای
  hermetic/offline نگه‌داشتن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید.
- `test:docker:plugin-lifecycle-matrix` بسته‌ی candidate را در یک container خالی نصب می‌کند،
  یک Plugin npm را از مسیرهای install، inspect، disable، enable،
  upgrade صریح، downgrade صریح، و uninstall پس از حذف کد Plugin عبور می‌دهد.
  برای هر phase، معیارهای RSS و CPU را log می‌کند.
- `test:docker:plugin-update` اعتبارسنجی می‌کند که یک Plugin نصب‌شده‌ی بدون تغییر
  هنگام `openclaw plugins update` دوباره نصب نشود یا metadata نصب را از دست ندهد.
- `test:docker:upgrade-survivor` tarball candidate را روی یک fixture کاربر قدیمی آلوده نصب می‌کند،
  به‌روزرسانی بسته همراه با doctor غیرتعاملی را اجرا می‌کند، سپس یک Gateway loopback را شروع می‌کند
  و حفظ وضعیت را بررسی می‌کند.
- `test:docker:published-upgrade-survivor` ابتدا یک baseline منتشرشده را نصب می‌کند،
  آن را از طریق recipe پخته‌شده‌ی `openclaw config set` پیکربندی می‌کند، به tarball
  candidate به‌روزرسانی می‌کند، doctor را اجرا می‌کند، پاک‌سازی legacy را بررسی می‌کند، Gateway را شروع می‌کند، و
  `/healthz`، `/readyz`، و وضعیت RPC را probe می‌کند.
- `test:docker:update-restart-auth` بسته‌ی candidate را نصب می‌کند، یک Gateway مدیریت‌شده با token-auth را شروع می‌کند،
  env مربوط به auth gateway caller را برای
  `openclaw update --yes --json` unset می‌کند، و الزام می‌کند فرمان به‌روزرسانی candidate
  پیش از probeهای معمول Gateway را restart کند.
- `test:docker:update-migration` lane به‌روزرسانی منتشرشده با پاک‌سازی سنگین است. از
  وضعیت کاربر پیکربندی‌شده به سبک Discord/Telegram شروع می‌کند، doctor baseline را اجرا می‌کند
  تا وابستگی‌های Plugin پیکربندی‌شده فرصت materialize شدن داشته باشند، debris وابستگی legacy Plugin را برای یک Plugin بسته‌بندی‌شده‌ی پیکربندی‌شده seed می‌کند،
  به tarball candidate به‌روزرسانی می‌کند، و post-update doctor را ملزم می‌کند
  rootهای legacy وابستگی را حذف کند.

variantهای مفید published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

سناریوهای موجود عبارت‌اند از `base`، `feishu-channel`، `bootstrap-persona`،
`plugin-deps-cleanup`، `configured-plugin-installs`،
`stale-source-plugin-shadow`، `tilde-log-path`، و `versioned-runtime-deps`. در اجراهای تجمیعی،
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` به همه‌ی سناریوهای شکل‌گرفته از issueهای گزارش‌شده گسترش می‌یابد،
از جمله migration نصب Plugin پیکربندی‌شده.

migration کامل به‌روزرسانی عمدا از Full Release CI جدا است. وقتی پرسش release این است که «آیا هر
release پایدار منتشرشده از 2026.4.23 به بعد می‌تواند به این candidate به‌روزرسانی شود و
debris وابستگی Plugin را پاک کند؟»، از workflow دستی `Update Migration` استفاده کنید:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance گیت native بسته در GitHub است. یک بسته‌ی candidate را به یک tarball
`package-under-test` resolve می‌کند، version و SHA-256 را ثبت می‌کند، سپس
laneهای Docker E2E قابل استفاده‌ی مجدد را علیه همان tarball دقیق اجرا می‌کند. ref harness workflow
از ref منبع بسته جدا است، بنابراین منطق تست فعلی می‌تواند releaseهای trusted قدیمی‌تر را اعتبارسنجی کند.

منابع candidate:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک version دقیق
  منتشرشده را اعتبارسنجی کنید.
- `source=ref`: یک branch، tag، یا commit trusted را با harness فعلی انتخاب‌شده
  pack کنید.
- `source=url`: یک tarball عمومی HTTPS را با `package_sha256` الزامی اعتبارسنجی کنید.
  این مسیر credentialهای URL، portهای HTTPS غیرپیش‌فرض، hostnameها یا نتایج DNS/IP خصوصی/داخلی،
  فضای IP با کاربری ویژه، و redirectهای ناامن را رد می‌کند.
- `source=trusted-url`: یک tarball HTTPS را با
  `package_sha256` و `trusted_source_id` الزامی علیه policy متعلق به maintainer
  در `.github/package-trusted-sources.json` اعتبارسنجی کنید. برای mirrorهای enterprise/private
  به‌جای ضعیف‌کردن `source=url` با یک switch سطح ورودی allow-private، از این استفاده کنید.
  Bearer auth، وقتی توسط policy پیکربندی شده باشد، از secret ثابت
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN` استفاده می‌کند.
- `source=artifact`: از tarball بارگذاری‌شده توسط یک اجرای دیگر Actions دوباره استفاده کنید.

Full Release Validation به‌صورت پیش‌فرض از `source=artifact` استفاده می‌کند، که از
SHA release resolve‌شده ساخته شده است. برای اثبات پس از انتشار،
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` را پاس دهید تا همان ماتریس upgrade
به‌جای آن بسته‌ی npm ship‌شده را هدف بگیرد.

بررسی‌های release، Package Acceptance را با مجموعه‌ی package/update/restart/plugin فراخوانی می‌کنند:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

وقتی release soak فعال باشد، این‌ها را هم پاس می‌دهند:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

این کار migration بسته، switching کانال به‌روزرسانی، تحمل Plugin مدیریت‌شده‌ی خراب،
پاک‌سازی وابستگی کهنه‌ی Plugin، پوشش Plugin آفلاین،
رفتار به‌روزرسانی Plugin، و QA بسته‌ی Telegram را روی همان artifact resolve‌شده نگه می‌دارد بدون اینکه
گیت پیش‌فرض بسته‌ی release را مجبور کند همه‌ی releaseهای منتشرشده را طی کند.

`last-stable-4` به چهار release پایدار آخر OpenClaw که در npm منتشر شده‌اند resolve می‌شود.
release package acceptance مقدار `2026.4.23` را به‌عنوان نخستین مرز compatibility به‌روزرسانی Plugin،
`2026.5.2` را به‌عنوان مرز churn معماری Plugin، و
`2026.4.15` را به‌عنوان یک baseline قدیمی‌تر به‌روزرسانی منتشرشده‌ی 2026.4.1x pin می‌کند؛ resolver
pinهایی را که از قبل در چهار مورد آخر هستند dedupe می‌کند. برای پوشش exhaustive migration
به‌روزرسانی منتشرشده، به‌جای Full Release CI از `all-since-2026.4.23` در workflow جداگانه‌ی Update
Migration استفاده کنید. وقتی anchor قدیمی پیش از تاریخ را هم می‌خواهید،
`release-history` همچنان برای نمونه‌گیری دستی گسترده‌تر در دسترس است.

وقتی چند baseline published-upgrade survivor انتخاب شود، workflow قابل استفاده‌ی مجدد
Docker هر baseline را به job هدفمند runner خودش shard می‌کند. هر
baseline shard همچنان مجموعه سناریوی انتخاب‌شده را اجرا می‌کند، اما logها و artifactها
per-baseline می‌مانند و زمان wall به‌جای یک job serial بزرگ با کندترین shard محدود می‌شود.

هنگام اعتبارسنجی candidate پیش از release، یک profile بسته را دستی اجرا کنید:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

وقتی پرسش release شامل کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، یا OpenWebUI است،
از `suite_profile=product` استفاده کنید. فقط وقتی به پوشش کامل مسیر release در Docker نیاز دارید
از `suite_profile=full` استفاده کنید.

## پیش‌فرض release

برای release candidateها، stack اثبات پیش‌فرض چنین است:

1. `pnpm check:changed` و `pnpm test:changed` برای regressionهای سطح source.
2. `pnpm release:check` برای integrity artifact بسته.
3. profile `package` مربوط به Package Acceptance یا laneهای package سفارشی release-check
   برای قراردادهای install/update/restart/plugin.
4. بررسی‌های release بین سیستم‌عامل‌ها برای installer، onboarding، و رفتار platform
   وابسته به OS.
5. مجموعه‌تست‌های زنده فقط وقتی surface تغییرکرده رفتار provider یا hosted-service را لمس می‌کند.

روی ماشین‌های maintainer، gateهای گسترده و اثبات product مربوط به Docker/package باید در
Testbox اجرا شوند مگر اینکه صراحتا اثبات محلی انجام شود.

## compatibility legacy

leniency مربوط به compatibility باریک و زمان‌دار است:

- بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، ممکن است
  gapهای metadata بسته که قبلا ship شده‌اند را در Package Acceptance تحمل کنند.
- بسته‌ی منتشرشده‌ی `2026.4.26` ممکن است برای فایل‌های stamp مربوط به metadata build محلی
  که قبلا ship شده‌اند warn کند.
- بسته‌های بعدی باید قراردادهای مدرن را رعایت کنند. همان gapها به‌جای
  warning یا skipping شکست می‌خورند.

برای این shapeهای قدیمی، migrationهای startup جدید اضافه نکنید. یک ترمیم doctor اضافه یا گسترش دهید،
سپس وقتی فرمان update مالک restart است، آن را با `upgrade-survivor`، `published-upgrade-survivor`، یا
`update-restart-auth` اثبات کنید.

## افزودن پوشش

هنگام تغییر رفتار update یا Plugin، پوشش را در پایین‌ترین لایه‌ای اضافه کنید که
می‌تواند به دلیل درست fail شود:

- منطق صرفاً مربوط به مسیر یا فراداده: تست واحد کنار منبع.
- رفتار موجودی بسته یا فایل‌های بسته‌بندی‌شده: تست `package-dist-inventory` یا بررسی‌کننده tarball.
- رفتار نصب/به‌روزرسانی CLI: assertion مسیر Docker یا fixture.
- رفتار مهاجرت انتشار منتشرشده: سناریوی `published-upgrade-survivor`.
- رفتار راه‌اندازی مجدد تحت مالکیت به‌روزرسانی: `update-restart-auth`.
- رفتار منبع registry/بسته: fixture مربوط به `test:docker:plugins` یا سرور fixture مربوط به ClawHub.
- رفتار چیدمان وابستگی یا پاک‌سازی: هم اجرای runtime و هم مرز فایل‌سیستم را assert کنید. وابستگی‌های npm ممکن است داخل پروژه npm مدیریت‌شده Plugin بالا کشیده شوند، بنابراین تست‌ها باید ثابت کنند که همان پروژه اسکن/پاک‌سازی می‌شود، نه اینکه فرض کنند فقط درخت `node_modules` محلیِ بسته Plugin بررسی می‌شود.

fixtureهای جدید Docker را به‌صورت پیش‌فرض hermetic نگه دارید. از registryهای fixture محلی و بسته‌های جعلی استفاده کنید، مگر اینکه هدف تست، رفتار registry زنده باشد.

## تریاژ شکست

با هویت artifact شروع کنید:

- خلاصه `resolve_package` در Package Acceptance: منبع، نسخه، SHA-256 و نام artifact.
- artifactهای Docker: `.artifacts/docker-tests/**/summary.json`، `failures.json`، لاگ‌های مسیر و فرمان‌های اجرای مجدد.
- خلاصه upgrade survivor: `.artifacts/upgrade-survivor/summary.json`، شامل نسخه baseline، نسخه candidate، سناریو، زمان‌بندی‌های phase و گام‌های recipe.

اجرای مجدد همان مسیر دقیقِ شکست‌خورده با همان artifact بسته را به اجرای مجدد کل چتر انتشار ترجیح دهید.

---
read_when:
    - تغییر رفتار به‌روزرسانی، doctor، پذیرش بسته، یا نصب Plugin در OpenClaw
    - آماده‌سازی یا تأیید یک نامزد انتشار
    - اشکال‌زدایی به‌روزرسانی بسته، پاک‌سازی وابستگی‌های Plugin، یا رگرسیون‌های نصب Plugin
sidebarTitle: Update and plugin tests
summary: OpenClaw چگونه مسیرهای به‌روزرسانی، مهاجرت‌های بسته، و رفتار نصب/به‌روزرسانی Plugin را اعتبارسنجی می‌کند
title: 'آزمایش: به‌روزرسانی‌ها و Plugin‌ها'
x-i18n:
    generated_at: "2026-05-06T09:23:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

این چک‌لیست اختصاصی برای اعتبارسنجی به‌روزرسانی و Plugin است. هدف ساده است: ثابت کردن اینکه بستهٔ قابل نصب می‌تواند وضعیت واقعی کاربر را به‌روزرسانی کند، وضعیت قدیمی و کهنهٔ legacy را از طریق `doctor` ترمیم کند، و همچنان Pluginها را از منابع پشتیبانی‌شده نصب، بارگذاری، به‌روزرسانی و حذف نصب کند.

برای نقشهٔ گسترده‌تر اجراکنندهٔ تست، [Testing](/fa/help/testing) را ببینید. برای کلیدهای ارائه‌دهندهٔ زنده و مجموعه‌تست‌هایی که با شبکه تماس دارند، [Testing live](/fa/help/testing-live) را ببینید.

## از چه چیزی محافظت می‌کنیم

تست‌های به‌روزرسانی و Plugin از این قراردادها محافظت می‌کنند:

- یک tarball بسته کامل است، یک `dist/postinstall-inventory.json` معتبر دارد، و به فایل‌های بازنشدهٔ repo وابسته نیست.
- کاربر می‌تواند بدون از دست دادن config، agentها، sessionها، workspaceها، allowlistهای Plugin، یا config کانال، از یک بستهٔ منتشرشدهٔ قدیمی‌تر به بستهٔ candidate منتقل شود.
- `openclaw doctor --fix --non-interactive` مالک مسیرهای پاک‌سازی و ترمیم legacy است. Startup نباید migrationهای سازگاری پنهان برای وضعیت کهنهٔ Plugin اضافه کند.
- نصب Plugin از directoryهای local، repoهای git، packageهای npm، و مسیر registry در ClawHub کار می‌کند.
- وابستگی‌های npm مربوط به Plugin در npm root مدیریت‌شده نصب می‌شوند، پیش از trust اسکن می‌شوند، و هنگام uninstall از طریق npm حذف می‌شوند تا وابستگی‌های hoist‌شده باقی نمانند.
- به‌روزرسانی Plugin وقتی چیزی تغییر نکرده پایدار است: رکوردهای نصب، source resolve‌شده، چیدمان وابستگی نصب‌شده، و وضعیت enabled دست‌نخورده می‌مانند.

## اثبات local هنگام توسعه

محدود شروع کنید:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

برای تغییرات نصب، حذف نصب، وابستگی، یا package-inventory مربوط به Plugin، تست‌های متمرکزی را هم اجرا کنید که seam ویرایش‌شده را پوشش می‌دهند:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

پیش از اینکه هر lane مربوط به package Docker یک tarball را مصرف کند، artifact بسته را ثابت کنید:

```bash
pnpm release:check
```

`release:check` بررسی‌های drift مربوط به config/docs/API را اجرا می‌کند، package dist inventory را می‌نویسد، `npm pack --dry-run` را اجرا می‌کند، فایل‌های packed ممنوع را رد می‌کند، tarball را در یک prefix موقت نصب می‌کند، postinstall را اجرا می‌کند، و entrypointهای کانال bundled را smoke می‌کند.

## laneهای Docker

laneهای Docker اثبات در سطح محصول هستند. آن‌ها یک package واقعی را داخل containerهای Linux نصب یا به‌روزرسانی می‌کنند و رفتار را از طریق commandهای CLI، startup مربوط به Gateway، probeهای HTTP، وضعیت RPC، و وضعیت filesystem assert می‌کنند.

هنگام iteration از laneهای متمرکز استفاده کنید:

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

- `test:docker:plugins` smoke نصب Plugin، نصب‌های local folder، رفتار skip در update برای local folder، local folderهای دارای وابستگی‌های از پیش نصب‌شده، نصب packageهای `file:`، نصب‌های git با اجرای CLI، updateهای moving-ref در git، نصب‌های npm registry با وابستگی‌های transitive hoist‌شده، no-opهای update در npm، نصب‌های fixture محلی ClawHub و no-opهای update، رفتار marketplace update، و enable/inspect برای Claude-bundle را اعتبارسنجی می‌کند. برای hermetic/offline نگه داشتن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید.
- `test:docker:plugin-lifecycle-matrix` بستهٔ candidate را در یک container خالی نصب می‌کند، یک npm Plugin را از مسیر install، inspect، disable، enable، upgrade صریح، downgrade صریح، و uninstall پس از حذف کد Plugin عبور می‌دهد. برای هر phase معیارهای RSS و CPU را log می‌کند.
- `test:docker:plugin-update` اعتبارسنجی می‌کند که یک Plugin نصب‌شدهٔ بدون تغییر، هنگام `openclaw plugins update` دوباره install نشود یا metadata نصب را از دست ندهد.
- `test:docker:upgrade-survivor` candidate tarball را روی یک fixture کاربر قدیمی کثیف نصب می‌کند، package update به‌همراه doctor غیرتعاملی را اجرا می‌کند، سپس یک Gateway روی loopback راه‌اندازی می‌کند و حفظ وضعیت را بررسی می‌کند.
- `test:docker:published-upgrade-survivor` ابتدا یک baseline منتشرشده را نصب می‌کند، آن را از طریق recipe آمادهٔ `openclaw config set` پیکربندی می‌کند، آن را به candidate tarball به‌روزرسانی می‌کند، doctor را اجرا می‌کند، پاک‌سازی legacy را بررسی می‌کند، Gateway را شروع می‌کند، و `/healthz`، `/readyz`، و وضعیت RPC را probe می‌کند.
- `test:docker:update-restart-auth` بستهٔ candidate را نصب می‌کند، یک Gateway مدیریت‌شده با token-auth را شروع می‌کند، env مربوط به gateway auth فراخواننده را برای `openclaw update --yes --json` unset می‌کند، و از command به‌روزرسانی candidate می‌خواهد Gateway را پیش از probeهای معمول restart کند.
- `test:docker:update-migration` lane منتشرشده-update سنگین از نظر پاک‌سازی است. از وضعیت کاربر پیکربندی‌شده به سبک Discord/Telegram شروع می‌کند، doctor baseline را اجرا می‌کند تا وابستگی‌های Plugin پیکربندی‌شده فرصت materialize شدن داشته باشند، برای یک packaged plugin پیکربندی‌شده بقایای legacy وابستگی Plugin را seed می‌کند، به candidate tarball به‌روزرسانی می‌کند، و از doctor پس از update می‌خواهد rootهای legacy وابستگی را حذف کند.

variantهای مفید published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

scenarioهای موجود عبارت‌اند از `base`، `feishu-channel`، `bootstrap-persona`، `plugin-deps-cleanup`، `configured-plugin-installs`، `stale-source-plugin-shadow`، `tilde-log-path`، و `versioned-runtime-deps`. در اجرای تجمیعی، `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` به همهٔ scenarioهای مشابه issueهای گزارش‌شده گسترش می‌یابد، از جمله migration نصب Plugin پیکربندی‌شده.

Full update migration عمداً از Full Release CI جداست. وقتی پرسش release این است که «آیا هر release stable منتشرشده از 2026.4.23 به بعد می‌تواند به این candidate به‌روزرسانی شود و بقایای وابستگی Plugin را پاک کند؟»، از workflow دستی `Update Migration` استفاده کنید:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## پذیرش بسته

Package Acceptance gate بستهٔ native در GitHub است. یک package candidate را به tarball با نام `package-under-test` resolve می‌کند، version و SHA-256 را ثبت می‌کند، سپس laneهای Docker E2E قابل استفادهٔ مجدد را روی همان tarball دقیق اجرا می‌کند. ref مربوط به harness workflow از ref منبع package جداست، بنابراین منطق فعلی تست می‌تواند releaseهای trusted قدیمی‌تر را اعتبارسنجی کند.

منابع candidate:

- `source=npm`: اعتبارسنجی `openclaw@beta`، `openclaw@latest`، یا یک version دقیق منتشرشده.
- `source=ref`: pack کردن یک branch، tag، یا commit قابل اعتماد با harness فعلی انتخاب‌شده.
- `source=url`: اعتبارسنجی یک HTTPS tarball با `package_sha256` الزامی.
- `source=artifact`: استفادهٔ دوباره از tarball آپلودشده توسط یک run دیگر در Actions.

Full Release Validation به‌صورت پیش‌فرض از `source=artifact` استفاده می‌کند که از SHA resolve‌شدهٔ release ساخته شده است. برای اثبات پس از انتشار، `package_acceptance_package_spec=openclaw@YYYY.M.D` را pass کنید تا همان upgrade matrix به‌جای آن package ارسال‌شدهٔ npm را هدف بگیرد.

release checkها Package Acceptance را با مجموعهٔ package/update/restart/plugin فراخوانی می‌کنند:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

وقتی release soak فعال است، این‌ها را هم pass می‌کنند:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

این کار migration بسته، تغییر update channel، تحمل corrupt managed-plugin، پاک‌سازی وابستگی کهنهٔ Plugin، پوشش offline Plugin، رفتار به‌روزرسانی Plugin، و package QA مربوط به Telegram را روی همان artifact resolve‌شده نگه می‌دارد، بدون اینکه gate پیش‌فرض release package هر release منتشرشده را طی کند.

`last-stable-4` به چهار release stable آخر OpenClaw که در npm منتشر شده‌اند resolve می‌شود. release package acceptance، `2026.4.23` را به‌عنوان اولین مرز سازگاری plugin-update، `2026.5.2` را به‌عنوان مرز churn در معماری Plugin، و `2026.4.15` را به‌عنوان baseline قدیمی‌تر published-update از سری 2026.4.1x pin می‌کند؛ resolver، pinهایی را که از قبل در چهار مورد آخر هستند dedupe می‌کند. برای پوشش کامل published update migration، به‌جای Full Release CI از `all-since-2026.4.23` در workflow جداگانهٔ Update Migration استفاده کنید. `release-history` همچنان برای نمونه‌گیری دستی گسترده‌تر در دسترس است، وقتی anchor قدیمی پیش از تاریخ را هم می‌خواهید.

وقتی چند baseline مربوط به published-upgrade survivor انتخاب شده‌اند، reusable Docker workflow هر baseline را در job runner هدفمند خودش shard می‌کند. هر shard مربوط به baseline همچنان مجموعهٔ scenario انتخاب‌شده را اجرا می‌کند، اما logها و artifactها per-baseline می‌مانند و wall time به کندترین shard محدود می‌شود، نه یک job بزرگ serial.

هنگام اعتبارسنجی candidate پیش از release، یک package profile را دستی اجرا کنید:

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

وقتی پرسش release شامل کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، یا OpenWebUI است، از `suite_profile=product` استفاده کنید. فقط وقتی به پوشش کامل مسیر release در Docker نیاز دارید از `suite_profile=full` استفاده کنید.

## پیش‌فرض release

برای release candidateها، stack اثبات پیش‌فرض این است:

1. `pnpm check:changed` و `pnpm test:changed` برای regressionهای سطح source.
2. `pnpm release:check` برای integrity مربوط به artifact بسته.
3. profile `package` در Package Acceptance یا laneهای custom package مربوط به release-check برای قراردادهای install/update/restart/plugin.
4. release checkهای Cross-OS برای installer، onboarding، و رفتار platform خاص OS.
5. مجموعه‌تست‌های live فقط وقتی surface تغییرکرده رفتار provider یا hosted-service را لمس می‌کند.

روی ماشین‌های maintainer، gateهای گسترده و اثبات محصول Docker/package باید در Testbox اجرا شوند مگر اینکه صراحتاً اثبات local انجام می‌دهید.

## سازگاری legacy

leniency سازگاری محدود و time boxed است:

- packageها تا `2026.4.25`، از جمله `2026.4.25-beta.*`، ممکن است gapهای metadata بسته را که قبلاً ارسال شده‌اند در Package Acceptance تحمل کنند.
- package منتشرشدهٔ `2026.4.26` ممکن است برای فایل‌های stamp مربوط به local build metadata که قبلاً ارسال شده‌اند warning بدهد.
- packageهای بعدی باید قراردادهای مدرن را برآورده کنند. همان gapها به‌جای warning یا skipping باعث fail می‌شوند.

برای این شکل‌های قدیمی migration جدید هنگام startup اضافه نکنید. یک doctor repair اضافه یا گسترش دهید، سپس وقتی command به‌روزرسانی مالک restart است، آن را با `upgrade-survivor`، `published-upgrade-survivor`، یا `update-restart-auth` ثابت کنید.

## افزودن پوشش

وقتی رفتار update یا Plugin را تغییر می‌دهید، در پایین‌ترین لایه‌ای که می‌تواند به دلیل درست fail شود coverage اضافه کنید:

- منطق pure مربوط به path یا metadata: unit test کنار source.
- رفتار package inventory یا packed-file: تست `package-dist-inventory` یا tarball checker.
- رفتار install/update در CLI: assertion یا fixture در Docker lane.
- رفتار migration برای published-release: scenario در `published-upgrade-survivor`.
- رفتار restart که مالک آن update است: `update-restart-auth`.
- رفتار source مربوط به registry/package: fixture در `test:docker:plugins` یا fixture server مربوط به ClawHub.
- رفتار چیدمان یا پاک‌سازی وابستگی: هم اجرای runtime و هم مرز filesystem را assert کنید. وابستگی‌های npm ممکن است زیر managed npm root hoist شوند، بنابراین تست‌ها باید ثابت کنند که root اسکن/پاک‌سازی می‌شود، نه اینکه یک درخت `node_modules` محلیِ package را فرض کنند.

fixtureهای Docker جدید را به‌صورت پیش‌فرض hermetic نگه دارید. از registryهای fixture محلی و packageهای fake استفاده کنید، مگر اینکه هدف تست رفتار registry زنده باشد.

## triage شکست

از هویت artifact شروع کنید:

- خلاصهٔ Package Acceptance `resolve_package`: منبع، نسخه، SHA-256، و
  نام آرتیفکت.
- آرتیفکت‌های Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`، لاگ‌های lane، و فرمان‌های اجرای مجدد.
- خلاصهٔ بقا در ارتقا: `.artifacts/upgrade-survivor/summary.json`,
  شامل نسخهٔ مبنا، نسخهٔ کاندیدا، سناریو، زمان‌بندی‌های مرحله‌ها، و
  گام‌های دستورالعمل.

ترجیح دهید lane دقیق شکست‌خورده را با همان آرتیفکت بسته دوباره اجرا کنید،
به‌جای اینکه کل چتر انتشار را دوباره اجرا کنید.

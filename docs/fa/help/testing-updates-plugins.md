---
read_when:
    - تغییر رفتار به‌روزرسانی، doctor، پذیرش بسته، یا نصب Plugin در OpenClaw
    - آماده‌سازی یا تأیید نامزد انتشار
    - اشکال‌زدایی به‌روزرسانی بسته، پاک‌سازی وابستگی‌های Plugin، یا رگرسیون‌های نصب Plugin
sidebarTitle: Update and plugin tests
summary: نحوهٔ اعتبارسنجی مسیرهای به‌روزرسانی، مهاجرت‌های بسته، و رفتار نصب/به‌روزرسانی Plugin توسط OpenClaw
title: 'آزمون: به‌روزرسانی‌ها و Plugin‌ها'
x-i18n:
    generated_at: "2026-05-03T11:37:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

این چک‌لیست اختصاصی برای اعتبارسنجی به‌روزرسانی و Plugin است. هدف
ساده است: ثابت کنیم بستهٔ قابل‌نصب می‌تواند وضعیت واقعی کاربر را به‌روزرسانی کند، وضعیت
قدیمی و ماندهٔ legacy را از طریق `doctor` ترمیم کند، و همچنان بتواند
Pluginها را از منابع پشتیبانی‌شده نصب، بارگذاری، به‌روزرسانی و حذف نصب کند.

برای نقشهٔ گسترده‌تر اجراکنندهٔ تست، [Testing](/fa/help/testing) را ببینید. برای کلیدهای ارائه‌دهندهٔ زنده
و مجموعه‌هایی که شبکه را لمس می‌کنند، [Testing live](/fa/help/testing-live) را ببینید.

## از چه چیزی محافظت می‌کنیم

تست‌های به‌روزرسانی و Plugin از این قراردادها محافظت می‌کنند:

- یک tarball بسته کامل است، `dist/postinstall-inventory.json` معتبر دارد،
  و به فایل‌های بازنشدهٔ repo وابسته نیست.
- کاربر می‌تواند از یک بستهٔ منتشرشدهٔ قدیمی‌تر به بستهٔ candidate
  بدون از دست دادن config، agentها، sessionها، workspaceها، allowlistهای Plugin، یا
  channel config مهاجرت کند.
- `openclaw doctor --fix --non-interactive` مالک مسیرهای پاک‌سازی و ترمیم
  legacy است. Startup نباید migrationهای سازگاری پنهان برای وضعیت ماندهٔ
  Plugin اضافه کند.
- نصب Plugin از دایرکتوری‌های محلی، repoهای git، بسته‌های npm، و مسیر
  registry در ClawHub کار می‌کند.
- وابستگی‌های npm مربوط به Plugin در ریشهٔ npm مدیریت‌شده نصب می‌شوند، پیش از
  trust اسکن می‌شوند، و هنگام uninstall از طریق npm حذف می‌شوند تا وابستگی‌های hoistشده
  باقی نمانند.
- به‌روزرسانی Plugin وقتی چیزی تغییر نکرده پایدار است: رکوردهای نصب، source
  resolveشده، چیدمان وابستگی نصب‌شده، و وضعیت enabled دست‌نخورده می‌مانند.

## اثبات محلی هنگام توسعه

محدود شروع کنید:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

برای تغییرات install، uninstall، dependency یا package-inventory مربوط به Plugin، همچنین
تست‌های متمرکزی را اجرا کنید که seam ویرایش‌شده را پوشش می‌دهند:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

پیش از آنکه هر lane مربوط به Package Docker یک tarball را مصرف کند، artifact بسته را اثبات کنید:

```bash
pnpm release:check
```

`release:check` بررسی‌های drift مربوط به config/docs/API را اجرا می‌کند، موجودی dist بسته را
می‌نویسد، `npm pack --dry-run` را اجرا می‌کند، فایل‌های بسته‌بندی‌شدهٔ ممنوع را رد می‌کند،
tarball را در یک prefix موقت نصب می‌کند، postinstall را اجرا می‌کند، و entrypointهای channel
باندل‌شده را smoke می‌کند.

## laneهای Docker

laneهای Docker اثبات در سطح محصول هستند. آن‌ها یک بستهٔ واقعی را داخل containerهای
Linux نصب یا به‌روزرسانی می‌کنند و رفتار را از طریق فرمان‌های CLI،
راه‌اندازی Gateway، probeهای HTTP، وضعیت RPC، و وضعیت filesystem بررسی می‌کنند.

هنگام iteration از laneهای متمرکز استفاده کنید:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

laneهای مهم:

- `test:docker:plugins` smoke نصب Plugin، نصب از پوشهٔ محلی،
  رفتار skip در update پوشهٔ محلی، پوشه‌های محلی با وابستگی‌های ازپیش‌نصب‌شده،
  نصب بسته‌های `file:`، نصب از git با اجرای CLI، به‌روزرسانی‌های moving-ref در git، نصب از
  registry در npm با وابستگی‌های transitive هوist‌شده، no-opهای update در npm، نصب از fixture محلی
  ClawHub و no-opهای update، رفتار update در marketplace، و enable/inspect بستهٔ Claude را
  اعتبارسنجی می‌کند. برای hermetic/offline نگه داشتن بلوک ClawHub،
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید.
- `test:docker:plugin-lifecycle-matrix` بستهٔ candidate را در یک container خام نصب می‌کند،
  یک npm Plugin را از مسیر install، inspect، disable، enable،
  upgrade صریح، downgrade صریح، و uninstall پس از حذف کد Plugin عبور می‌دهد.
  برای هر فاز metricهای RSS و CPU را log می‌کند.
- `test:docker:plugin-update` اعتبارسنجی می‌کند که یک Plugin نصب‌شدهٔ بدون تغییر
  هنگام `openclaw plugins update` دوباره نصب نشود یا metadata نصب را از دست ندهد.
- `test:docker:upgrade-survivor` tarball candidate را روی یک fixture کاربر قدیمی و آلوده
  نصب می‌کند، update بسته به‌همراه doctor غیرتعاملی را اجرا می‌کند، سپس
  یک Gateway روی loopback راه‌اندازی می‌کند و preservation وضعیت را بررسی می‌کند.
- `test:docker:published-upgrade-survivor` ابتدا یک baseline منتشرشده را نصب می‌کند،
  آن را از طریق recipe پخته‌شدهٔ `openclaw config set` پیکربندی می‌کند، آن را به
  tarball candidate به‌روزرسانی می‌کند، doctor را اجرا می‌کند، cleanup legacy را بررسی می‌کند،
  Gateway را راه‌اندازی می‌کند، و `/healthz`، `/readyz` و وضعیت RPC را probe می‌کند.
- `test:docker:update-migration` lane منتشرشدهٔ update با تمرکز زیاد بر cleanup است. از
  وضعیت کاربری پیکربندی‌شده به سبک Discord/Telegram شروع می‌کند، baseline
  doctor را اجرا می‌کند تا وابستگی‌های Plugin پیکربندی‌شده فرصت materialize شدن داشته باشند، برای یک Plugin بسته‌بندی‌شدهٔ پیکربندی‌شده
  debris وابستگی legacy Plugin را seed می‌کند، به tarball candidate
  به‌روزرسانی می‌کند، و از doctor پس از update می‌خواهد ریشه‌های وابستگی legacy را حذف کند.

variantهای مفید برای published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

scenarioهای موجود عبارت‌اند از `base`، `feishu-channel`، `bootstrap-persona`،
`plugin-deps-cleanup`، `configured-plugin-installs`، `tilde-log-path`، و
`versioned-runtime-deps`. در اجرای تجمیعی،
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` به همهٔ scenarioهای شبیه issue گزارش‌شده
گسترش می‌یابد، از جمله migration نصب Plugin پیکربندی‌شده.

update migration کامل عمداً از Full Release CI جداست. وقتی پرسش release این است که «آیا هر
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

Package Acceptance gate بومی GitHub برای بسته است. یک بستهٔ candidate را به یک tarball
`package-under-test` resolve می‌کند، version و SHA-256 را ثبت می‌کند، سپس
laneهای Docker E2E قابل‌استفادهٔ مجدد را در برابر همان tarball دقیق اجرا می‌کند. harness
workflow ref جدا از package source ref است، پس منطق تست فعلی می‌تواند releaseهای مورداعتماد قدیمی‌تر را
اعتبارسنجی کند.

منابع candidate:

- `source=npm`: اعتبارسنجی `openclaw@beta`، `openclaw@latest`، یا یک
  version منتشرشدهٔ دقیق.
- `source=ref`: pack کردن یک branch، tag، یا commit مورداعتماد با harness فعلی انتخاب‌شده.
- `source=url`: اعتبارسنجی یک tarball HTTPS با `package_sha256` الزامی.
- `source=artifact`: استفادهٔ مجدد از tarball آپلودشده توسط یک اجرای دیگر Actions.

Full Release Validation به‌صورت پیش‌فرض از `source=artifact` استفاده می‌کند، که از
SHA resolveشدهٔ release ساخته شده است. برای اثبات پس از publish،
`package_acceptance_package_spec=openclaw@YYYY.M.D` را پاس بدهید تا همان ماتریس upgrade
بستهٔ npm ارسال‌شده را هدف بگیرد.

Release checkها Package Acceptance را با مجموعهٔ package/update/plugin فراخوانی می‌کنند:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

همچنین این موارد را پاس می‌دهند:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

این کار migration بسته، switching channel برای update، cleanup وابستگی ماندهٔ Plugin،
پوشش offline Plugin، رفتار update Plugin، و QA بستهٔ Telegram را روی همان artifact
resolveشده نگه می‌دارد.

`all-since-2026.4.23` نمونهٔ upgrade در Full Release CI است: هر release پایدار منتشرشده در npm از `2026.4.23` تا `latest`. برای پوشش کامل
published update migration، به‌جای Full Release CI از `all-since-2026.4.23` در workflow جداگانهٔ Update
Migration استفاده کنید. `release-history` همچنان
برای نمونه‌گیری گسترده‌تر دستی در دسترس است، وقتی anchor legacy مربوط به پیش از آن تاریخ را هم می‌خواهید.

هنگام اعتبارسنجی یک candidate پیش از release، یک profile بسته را دستی اجرا کنید:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

وقتی پرسش release شامل channelهای MCP،
cleanup مربوط به cron/subagent، جست‌وجوی وب OpenAI، یا OpenWebUI است، از `suite_profile=product` استفاده کنید. فقط وقتی به پوشش کامل
Docker برای مسیر release نیاز دارید از `suite_profile=full` استفاده کنید.

## پیش‌فرض release

برای release candidateها، stack اثبات پیش‌فرض این است:

1. `pnpm check:changed` و `pnpm test:changed` برای regressionهای سطح source.
2. `pnpm release:check` برای سلامت artifact بسته.
3. profile `package` در Package Acceptance یا laneهای سفارشی package مربوط به release-check
   برای قراردادهای install/update/plugin.
4. Cross-OS release checkها برای installer، onboarding، و رفتار platform-specific.
5. مجموعه‌های live فقط وقتی سطح تغییریافته رفتار provider یا hosted-service را لمس می‌کند.

روی ماشین‌های maintainer، gateهای گسترده و اثبات محصول Docker/package باید در
Testbox اجرا شوند، مگر اینکه صراحتاً اثبات محلی انجام می‌دهید.

## سازگاری legacy

leniency سازگاری محدود و دارای بازهٔ زمانی است:

- بسته‌ها تا `2026.4.25`، از جمله `2026.4.25-beta.*`، ممکن است gapهای metadata بستهٔ ازپیش‌ارسال‌شده را
  در Package Acceptance تحمل کنند.
- بستهٔ منتشرشدهٔ `2026.4.26` ممکن است برای فایل‌های stamp مربوط به local build metadata
  که از قبل ارسال شده‌اند هشدار بدهد.
- بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند. همان gapها به‌جای
  warning یا skip باعث failure می‌شوند.

برای این شکل‌های قدیمی، migration تازه‌ای در startup اضافه نکنید. یک ترمیم doctor
اضافه یا گسترش دهید، سپس آن را با `upgrade-survivor` یا `published-upgrade-survivor` اثبات کنید.

## افزودن پوشش

هنگام تغییر رفتار update یا Plugin، پوشش را در پایین‌ترین لایه‌ای اضافه کنید که
می‌تواند به دلیل درست fail شود:

- منطق pure path یا metadata: unit test کنار source.
- رفتار package inventory یا packed-file: تست `package-dist-inventory` یا tarball
  checker.
- رفتار CLI install/update: assertion یا fixture در lane Docker.
- رفتار migration برای published-release: scenario در `published-upgrade-survivor`.
- رفتار registry/package source: fixture در `test:docker:plugins` یا server fixture
  ClawHub.
- رفتار چیدمان یا cleanup وابستگی: هم اجرای runtime و هم مرز filesystem را assert کنید. وابستگی‌های npm ممکن است زیر ریشهٔ npm مدیریت‌شده hoist شوند،
  بنابراین تست‌ها باید ثابت کنند ریشه اسکن/پاک می‌شود، نه اینکه یک درخت `node_modules`
  محلی بسته را فرض کنند.

fixtureهای Docker جدید را به‌صورت پیش‌فرض hermetic نگه دارید. از registryهای fixture محلی و
بسته‌های fake استفاده کنید، مگر اینکه هدف تست رفتار registry زنده باشد.

## تریاژ failure

از هویت artifact شروع کنید:

- summary مربوط به `resolve_package` در Package Acceptance: source، version، SHA-256، و
  نام artifact.
- artifactهای Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`، logهای lane، و فرمان‌های rerun.
- summary مربوط به Upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  شامل baseline version، candidate version، scenario، timingهای phase، و
  recipe stepها.

rerun همان lane دقیق failشده با همان artifact بسته را به
rerun کل چتر release ترجیح دهید.

---
read_when:
    - تغییر رفتار به‌روزرسانی OpenClaw، doctor، پذیرش بسته یا نصب Plugin
    - آماده‌سازی یا تأیید یک نامزد انتشار
    - اشکال‌زدایی از پسرفت‌های به‌روزرسانی بسته، پاک‌سازی وابستگی‌های Plugin، یا نصب Plugin
sidebarTitle: Update and plugin tests
summary: نحوه اعتبارسنجی مسیرهای به‌روزرسانی، مهاجرت‌های بسته، و رفتار نصب/به‌روزرسانی Plugin توسط OpenClaw
title: 'آزمایش: به‌روزرسانی‌ها و Pluginها'
x-i18n:
    generated_at: "2026-05-05T01:49:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

این چک‌لیست اختصاصی برای اعتبارسنجی به‌روزرسانی و Plugin است. هدف ساده است: ثابت شود بستهٔ قابل نصب می‌تواند وضعیت واقعی کاربر را به‌روزرسانی کند، وضعیت قدیمی و کهنهٔ legacy را از طریق `doctor` تعمیر کند، و همچنان Pluginها را از منابع پشتیبانی‌شده نصب، بارگذاری، به‌روزرسانی و حذف کند.

برای نقشهٔ گسترده‌تر اجرای آزمون‌ها، [آزمون‌گیری](/fa/help/testing) را ببینید. برای کلیدهای provider زنده و مجموعه‌هایی که با شبکه سروکار دارند، [آزمون‌گیری زنده](/fa/help/testing-live) را ببینید.

## از چه چیزی محافظت می‌کنیم

آزمون‌های به‌روزرسانی و Plugin از این قراردادها محافظت می‌کنند:

- یک tarball بسته کامل است، `dist/postinstall-inventory.json` معتبر دارد، و به فایل‌های بازشدهٔ repo وابسته نیست.
- کاربر می‌تواند از یک بستهٔ منتشرشدهٔ قدیمی‌تر به بستهٔ candidate منتقل شود، بدون اینکه config، agentها، sessionها، workspaceها، allowlistهای Plugin، یا config کانال را از دست بدهد.
- `openclaw doctor --fix --non-interactive` مالک مسیرهای پاک‌سازی و تعمیر legacy است. startup نباید migrationهای compatibility پنهان برای وضعیت کهنهٔ Plugin ایجاد کند.
- نصب Plugin از directoryهای local، repoهای git، بسته‌های npm، و مسیر registry مربوط به ClawHub کار می‌کند.
- وابستگی‌های npm مربوط به Plugin در root مدیریت‌شدهٔ npm نصب می‌شوند، قبل از trust اسکن می‌شوند، و هنگام uninstall از طریق npm حذف می‌شوند تا وابستگی‌های hoist‌شده باقی نمانند.
- به‌روزرسانی Plugin وقتی چیزی تغییر نکرده پایدار است: recordهای نصب، source حل‌شده، layout وابستگی نصب‌شده، و وضعیت enabled دست‌نخورده می‌مانند.

## اثبات local هنگام توسعه

محدود شروع کنید:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

برای تغییرات نصب، حذف، وابستگی، یا package-inventory مربوط به Plugin، آزمون‌های متمرکزی را هم اجرا کنید که seam ویرایش‌شده را پوشش می‌دهند:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

پیش از اینکه هر lane بستهٔ Docker یک tarball مصرف کند، artifact بسته را ثابت کنید:

```bash
pnpm release:check
```

`release:check` بررسی‌های drift مربوط به config/docs/API را اجرا می‌کند، package dist inventory را می‌نویسد، `npm pack --dry-run` را اجرا می‌کند، فایل‌های packed ممنوع را رد می‌کند، tarball را در یک prefix موقت نصب می‌کند، postinstall را اجرا می‌کند، و entrypointهای کانال bundle‌شده را smoke می‌کند.

## laneهای Docker

laneهای Docker اثبات سطح محصول هستند. آن‌ها یک بستهٔ واقعی را داخل containerهای Linux نصب یا به‌روزرسانی می‌کنند و رفتار را از طریق دستورهای CLI، راه‌اندازی Gateway، probeهای HTTP، وضعیت RPC، و وضعیت filesystem assert می‌کنند.

هنگام تکرار و اصلاح، از laneهای متمرکز استفاده کنید:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

laneهای مهم:

- `test:docker:plugins` smoke نصب Plugin، نصب از folderهای local، رفتار skip به‌روزرسانی folderهای local، folderهای local با وابستگی‌های ازپیش‌نصب‌شده، نصب بسته‌های `file:`، نصب‌های git همراه با اجرای CLI، به‌روزرسانی ref متحرک git، نصب‌های registry مربوط به npm با وابستگی‌های transitive هوist‌شده، no-opهای به‌روزرسانی npm، نصب‌های fixture local مربوط به ClawHub و no-opهای به‌روزرسانی، رفتار به‌روزرسانی marketplace، و enable/inspect مربوط به bundle کلود را اعتبارسنجی می‌کند. برای hermetic/offline نگه‌داشتن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید.
- `test:docker:plugin-lifecycle-matrix` بستهٔ candidate را در یک container bare نصب می‌کند، یک Plugin از نوع npm را از مسیر install، inspect، disable، enable، upgrade صریح، downgrade صریح، و uninstall پس از حذف کد Plugin عبور می‌دهد. برای هر phase، metricهای RSS و CPU را log می‌کند.
- `test:docker:plugin-update` اعتبارسنجی می‌کند که یک Plugin نصب‌شدهٔ بدون تغییر هنگام `openclaw plugins update` دوباره نصب نشود یا metadata نصب را از دست ندهد.
- `test:docker:upgrade-survivor` tarball مربوط به candidate را روی یک fixture قدیمی و آلودهٔ کاربر نصب می‌کند، به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را اجرا می‌کند، سپس یک Gateway از نوع loopback راه‌اندازی می‌کند و حفظ وضعیت را بررسی می‌کند.
- `test:docker:published-upgrade-survivor` ابتدا یک baseline منتشرشده را نصب می‌کند، آن را از طریق recipe پخته‌شدهٔ `openclaw config set` config می‌کند، به tarball مربوط به candidate به‌روزرسانی می‌کند، doctor را اجرا می‌کند، پاک‌سازی legacy را بررسی می‌کند، Gateway را راه‌اندازی می‌کند، و `/healthz`، `/readyz`، و وضعیت RPC را probe می‌کند.
- `test:docker:update-migration` lane به‌روزرسانی منتشرشده‌ای است که پاک‌سازی در آن سنگین است. از یک وضعیت کاربر config‌شده شبیه Discord/Telegram شروع می‌کند، baseline doctor را اجرا می‌کند تا وابستگی‌های Pluginهای config‌شده فرصت materialize شدن داشته باشند، debris مربوط به وابستگی‌های legacy Plugin را برای یک Plugin بسته‌بندی‌شدهٔ config‌شده seed می‌کند، به tarball مربوط به candidate به‌روزرسانی می‌کند، و از doctor پس از به‌روزرسانی می‌خواهد rootهای وابستگی legacy را حذف کند.

variantهای مفید published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

scenarioهای موجود عبارت‌اند از `base`، `feishu-channel`، `bootstrap-persona`، `plugin-deps-cleanup`، `configured-plugin-installs`، `stale-source-plugin-shadow`، `tilde-log-path`، و `versioned-runtime-deps`. در اجراهای aggregate، `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` به همهٔ scenarioهای شبیه issue گزارش‌شده گسترش می‌یابد، از جمله migration نصب Plugin config‌شده.

migration کامل به‌روزرسانی عمداً از Full Release CI جداست. وقتی پرسش release این است که «آیا هر release پایدار منتشرشده از 2026.4.23 به بعد می‌تواند به این candidate به‌روزرسانی شود و debris وابستگی‌های Plugin را پاک کند؟»، از workflow دستی `Update Migration` استفاده کنید:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## پذیرش بسته

Package Acceptance گیت package بومی GitHub است. یک بستهٔ candidate را به یک tarball با نام `package-under-test` resolve می‌کند، version و SHA-256 را ثبت می‌کند، سپس laneهای reusable مربوط به Docker E2E را روی همان tarball دقیق اجرا می‌کند. ref مربوط به harness workflow از ref مربوط به source بسته جداست، بنابراین منطق آزمون فعلی می‌تواند releaseهای مورد اعتماد قدیمی‌تر را اعتبارسنجی کند.

sourceهای candidate:

- `source=npm`: اعتبارسنجی `openclaw@beta`، `openclaw@latest`، یا یک version منتشرشدهٔ دقیق.
- `source=ref`: pack کردن یک branch، tag، یا commit مورد اعتماد با harness فعلی انتخاب‌شده.
- `source=url`: اعتبارسنجی یک tarball از نوع HTTPS با `package_sha256` الزامی.
- `source=artifact`: استفادهٔ دوباره از tarball آپلودشده توسط یک run دیگر از Actions.

Full Release Validation به‌صورت پیش‌فرض از `source=artifact` استفاده می‌کند، ساخته‌شده از SHA مربوط به release حل‌شده. برای اثبات پس از انتشار، `package_acceptance_package_spec=openclaw@YYYY.M.D` را pass کنید تا همان matrix ارتقا، بستهٔ npm ارسال‌شده را هدف بگیرد.

بررسی‌های release، Package Acceptance را با مجموعهٔ package/update/plugin فراخوانی می‌کنند:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

آن‌ها همچنین این موارد را pass می‌کنند:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

این کار migration بسته، تغییر کانال به‌روزرسانی، پاک‌سازی وابستگی‌های کهنهٔ Plugin، پوشش offline Plugin، رفتار به‌روزرسانی Plugin، و QA بستهٔ Telegram را روی همان artifact حل‌شده نگه می‌دارد.

`all-since-2026.4.23` نمونهٔ upgrade مربوط به Full Release CI است: هر release پایدار منتشرشده در npm از `2026.4.23` تا `latest`. برای پوشش exhaustive migration به‌روزرسانی منتشرشده، به‌جای Full Release CI از `all-since-2026.4.23` در workflow جداگانهٔ Update Migration استفاده کنید. `release-history` برای نمونه‌برداری دستی گسترده‌تر، وقتی anchor قدیمی pre-date را هم می‌خواهید، همچنان در دسترس است.

هنگام اعتبارسنجی candidate پیش از release، یک profile بسته را دستی اجرا کنید:

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

وقتی پرسش release شامل کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، یا OpenWebUI است، از `suite_profile=product` استفاده کنید. فقط وقتی به پوشش کامل مسیر release در Docker نیاز دارید، از `suite_profile=full` استفاده کنید.

## پیش‌فرض release

برای release candidateها، stack اثبات پیش‌فرض این است:

1. `pnpm check:changed` و `pnpm test:changed` برای regressionهای سطح source.
2. `pnpm release:check` برای یکپارچگی artifact بسته.
3. profile `package` مربوط به Package Acceptance یا laneهای custom package مربوط به release-check برای قراردادهای install/update/plugin.
4. بررسی‌های release میان‌سیستمی برای installer، onboarding، و رفتار platform مخصوص OS.
5. مجموعه‌های زنده فقط زمانی که سطح تغییر با رفتار provider یا سرویس hosted تماس دارد.

روی ماشین‌های maintainer، gateهای broad و اثبات محصول Docker/package باید در Testbox اجرا شوند، مگر اینکه اثبات local صراحتاً انجام شود.

## سازگاری legacy

نرمش compatibility محدود و زمان‌بندی‌شده است:

- بسته‌ها تا `2026.4.25`، از جمله `2026.4.25-beta.*`، ممکن است gapهای metadata بسته را که قبلاً ارسال شده‌اند در Package Acceptance تحمل کنند.
- بستهٔ منتشرشدهٔ `2026.4.26` ممکن است برای فایل‌های stamp مربوط به metadata build local که قبلاً ارسال شده‌اند هشدار بدهد.
- بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند. همان gapها به‌جای warning یا skipping، fail می‌شوند.

برای این شکل‌های قدیمی، startup migrationهای جدید اضافه نکنید. یک repair در doctor اضافه یا extend کنید، سپس آن را با `upgrade-survivor` یا `published-upgrade-survivor` ثابت کنید.

## افزودن پوشش

هنگام تغییر رفتار به‌روزرسانی یا Plugin، پوشش را در پایین‌ترین لایه‌ای اضافه کنید که بتواند به دلیل درست fail شود:

- منطق pure مربوط به path یا metadata: unit test کنار source.
- رفتار package inventory یا packed-file: آزمون `package-dist-inventory` یا checker مربوط به tarball.
- رفتار نصب/به‌روزرسانی CLI: assertion یا fixture در lane مربوط به Docker.
- رفتار migration مربوط به published-release: scenario در `published-upgrade-survivor`.
- رفتار registry/package source: fixture مربوط به `test:docker:plugins` یا server fixture مربوط به ClawHub.
- رفتار layout یا پاک‌سازی وابستگی: هم اجرای runtime و هم مرز filesystem را assert کنید. وابستگی‌های npm ممکن است زیر root مدیریت‌شدهٔ npm hoist شوند، بنابراین آزمون‌ها باید به‌جای فرض کردن یک tree از نوع `node_modules` در سطح package-local، ثابت کنند root اسکن/پاک‌سازی می‌شود.

fixtureهای جدید Docker را به‌صورت پیش‌فرض hermetic نگه دارید. از registryهای fixture local و بسته‌های fake استفاده کنید، مگر اینکه نکتهٔ آزمون رفتار registry زنده باشد.

## triage شکست

با هویت artifact شروع کنید:

- summary مربوط به Package Acceptance `resolve_package`: source، version، SHA-256، و نام artifact.
- artifactهای Docker: `.artifacts/docker-tests/**/summary.json`، `failures.json`، logهای lane، و دستورهای rerun.
- summary مربوط به Upgrade survivor: `.artifacts/upgrade-survivor/summary.json`، شامل version مربوط به baseline، version مربوط به candidate، scenario، timingهای phase، و stepهای recipe.

rerun کردن lane دقیق fail‌شده با همان artifact بسته را به rerun کردن کل چتر release ترجیح دهید.

---
read_when:
    - تغییر رفتار به‌روزرسانی OpenClaw، doctor، پذیرش بسته یا نصب Plugin
    - آماده‌سازی یا تأیید یک نامزد انتشار
    - اشکال‌زدایی از پسرفت‌های به‌روزرسانی بسته، پاک‌سازی وابستگی‌های Plugin یا نصب Plugin
sidebarTitle: Update and plugin tests
summary: OpenClaw چگونه مسیرهای به‌روزرسانی، مهاجرت‌های بسته‌ها، و رفتار نصب/به‌روزرسانی Plugin را اعتبارسنجی می‌کند
title: 'آزمون: به‌روزرسانی‌ها و Pluginها'
x-i18n:
    generated_at: "2026-05-02T20:46:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

این چک‌لیست اختصاصی برای اعتبارسنجی به‌روزرسانی و Plugin است. هدف ساده است: ثابت کنیم بستهٔ قابل نصب می‌تواند وضعیت واقعی کاربر را به‌روزرسانی کند، وضعیت قدیمی و منسوخ‌شده را از طریق `doctor` ترمیم کند، و همچنان Pluginها را از منابع پشتیبانی‌شده نصب، بارگذاری، به‌روزرسانی و حذف کند.

برای نقشهٔ گسترده‌تر اجراکنندهٔ آزمون، [آزمون](/fa/help/testing) را ببینید. برای کلیدهای ارائه‌دهندهٔ زنده و مجموعه‌هایی که با شبکه تماس دارند، [آزمون زنده](/fa/help/testing-live) را ببینید.

## از چه چیزی محافظت می‌کنیم

آزمون‌های به‌روزرسانی و Plugin از این قراردادها محافظت می‌کنند:

- یک tarball بسته کامل است، `dist/postinstall-inventory.json` معتبر دارد، و به فایل‌های بازنشدهٔ مخزن وابسته نیست.
- کاربر می‌تواند از یک بستهٔ منتشرشدهٔ قدیمی‌تر به بستهٔ کاندید منتقل شود، بدون اینکه config، عامل‌ها، نشست‌ها، workspaceها، allowlistهای Plugin یا config کانال را از دست بدهد.
- `openclaw doctor --fix --non-interactive` مالک مسیرهای پاک‌سازی و ترمیم قدیمی است. راه‌اندازی نباید migrationهای سازگاری پنهان برای وضعیت کهنهٔ Plugin اضافه کند.
- نصب Plugin از دایرکتوری‌های محلی، repoهای git، بسته‌های npm، و مسیر registry مربوط به ClawHub کار می‌کند.
- وابستگی‌های npm مربوط به Plugin در ریشهٔ npm مدیریت‌شده نصب می‌شوند، پیش از اعتماد اسکن می‌شوند، و هنگام حذف از طریق npm برداشته می‌شوند تا وابستگی‌های hoistشده باقی نمانند.
- به‌روزرسانی Plugin وقتی چیزی تغییر نکرده پایدار است: رکوردهای نصب، منبع resolvedشده، چیدمان وابستگی نصب‌شده، و وضعیت فعال‌بودن دست‌نخورده می‌مانند.

## اثبات محلی هنگام توسعه

با محدودهٔ باریک شروع کنید:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

برای تغییرات نصب، حذف، وابستگی، یا inventory بستهٔ Plugin، آزمون‌های متمرکزی را هم اجرا کنید که seam ویرایش‌شده را پوشش می‌دهند:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

پیش از اینکه هر lane بستهٔ Docker یک tarball را مصرف کند، artifact بسته را اثبات کنید:

```bash
pnpm release:check
```

`release:check` بررسی‌های drift مربوط به config/docs/API را اجرا می‌کند، inventory توزیع بسته را می‌نویسد، `npm pack --dry-run` را اجرا می‌کند، فایل‌های بسته‌بندی‌شدهٔ ممنوع را رد می‌کند، tarball را در یک prefix موقت نصب می‌کند، postinstall را اجرا می‌کند، و entrypointهای کانال‌های bundled را smoke می‌کند.

## laneهای Docker

laneهای Docker اثبات سطح محصول هستند. آن‌ها یک بستهٔ واقعی را داخل containerهای Linux نصب یا به‌روزرسانی می‌کنند و رفتار را از طریق فرمان‌های CLI، راه‌اندازی Gateway، probeهای HTTP، وضعیت RPC، و وضعیت filesystem بررسی می‌کنند.

هنگام iteration از laneهای متمرکز استفاده کنید:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

laneهای مهم:

- `test:docker:plugins` smoke نصب Plugin، نصب‌های پوشهٔ محلی، رفتار skip در به‌روزرسانی پوشهٔ محلی، پوشه‌های محلی با وابستگی‌های از پیش نصب‌شده، نصب بسته‌های `file:`، نصب‌های git با اجرای CLI، به‌روزرسانی‌های moving-ref در git، نصب‌های registry مربوط به npm با وابستگی‌های گذرای hoistشده، no-opهای به‌روزرسانی npm، نصب‌های fixture محلی ClawHub و no-opهای به‌روزرسانی، رفتار به‌روزرسانی marketplace، و فعال‌سازی/بازرسی bundle مربوط به Claude را اعتبارسنجی می‌کند. برای hermetic/offline نگه داشتن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید.
- `test:docker:plugin-update` اعتبارسنجی می‌کند که یک Plugin نصب‌شدهٔ بدون تغییر، هنگام `openclaw plugins update` دوباره نصب نشود یا metadata نصب را از دست ندهد.
- `test:docker:upgrade-survivor` tarball کاندید را روی یک fixture کاربر قدیمی کثیف نصب می‌کند، به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را اجرا می‌کند، سپس یک Gateway loopback را شروع می‌کند و حفظ وضعیت را بررسی می‌کند.
- `test:docker:published-upgrade-survivor` ابتدا یک baseline منتشرشده را نصب می‌کند، آن را از طریق recipe آمادهٔ `openclaw config set` پیکربندی می‌کند، آن را به tarball کاندید به‌روزرسانی می‌کند، doctor را اجرا می‌کند، پاک‌سازی legacy را بررسی می‌کند، Gateway را شروع می‌کند، و `/healthz`، `/readyz`، و وضعیت RPC را probe می‌کند.
- `test:docker:update-migration` lane منتشرشده-به‌روزرسانی با تمرکز زیاد بر پاک‌سازی است. از وضعیت کاربر پیکربندی‌شده به سبک Discord/Telegram شروع می‌کند، doctor مربوط به baseline را اجرا می‌کند تا وابستگی‌های Plugin پیکربندی‌شده فرصت materialize شدن داشته باشند، بقایای وابستگی Plugin legacy را برای یک Plugin بسته‌بندی‌شدهٔ پیکربندی‌شده seed می‌کند، به tarball کاندید به‌روزرسانی می‌کند، و لازم می‌داند doctor پس از به‌روزرسانی ریشه‌های وابستگی legacy را حذف کند.

variantهای مفید published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

سناریوهای موجود `base`، `feishu-channel`، `bootstrap-persona`، `plugin-deps-cleanup`، `configured-plugin-installs`، `tilde-log-path`، و `versioned-runtime-deps` هستند. در اجراهای تجمیعی، `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` به همهٔ سناریوهای شبیه issue گزارش‌شده گسترش می‌یابد، از جمله migration نصب Plugin پیکربندی‌شده.

migration کامل به‌روزرسانی عمداً از Full Release CI جدا است. وقتی پرسش انتشار این است که «آیا هر انتشار stable منتشرشده از `2026.4.23` به بعد می‌تواند به این کاندید به‌روزرسانی شود و بقایای وابستگی Plugin را پاک کند؟»، از workflow دستی `Update Migration` استفاده کنید:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## پذیرش بسته

پذیرش بسته gate بومی GitHub برای بسته است. یک بستهٔ کاندید را به یک tarball با نام `package-under-test` resolve می‌کند، نسخه و SHA-256 را ثبت می‌کند، سپس laneهای Docker E2E قابل استفادهٔ مجدد را روی همان tarball دقیق اجرا می‌کند. ref مربوط به harness workflow از ref منبع بسته جدا است، بنابراین منطق آزمون فعلی می‌تواند انتشارهای مورداعتماد قدیمی‌تر را اعتبارسنجی کند.

منابع کاندید:

- `source=npm`: اعتبارسنجی `openclaw@beta`، `openclaw@latest`، یا یک نسخهٔ منتشرشدهٔ دقیق.
- `source=ref`: بسته‌بندی یک branch، tag، یا commit مورداعتماد با harness فعلی انتخاب‌شده.
- `source=url`: اعتبارسنجی یک tarball HTTPS با `package_sha256` الزامی.
- `source=artifact`: استفادهٔ دوباره از tarball بارگذاری‌شده توسط یک اجرای دیگر Actions.

Full Release Validation به‌صورت پیش‌فرض از `source=artifact` استفاده می‌کند که از SHA انتشار resolveشده ساخته شده است. برای اثبات پس از انتشار، `package_acceptance_package_spec=openclaw@YYYY.M.D` را پاس دهید تا همان ماتریس upgrade بستهٔ npm ارسال‌شده را هدف بگیرد.

بررسی‌های انتشار، پذیرش بسته را با مجموعهٔ بسته/به‌روزرسانی/Plugin فراخوانی می‌کنند:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

همچنین این‌ها را پاس می‌دهند:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

این کار migration بسته، تعویض کانال به‌روزرسانی، پاک‌سازی وابستگی کهنهٔ Plugin، پوشش offline Plugin، رفتار به‌روزرسانی Plugin، و QA بستهٔ Telegram را روی همان artifact resolveشده نگه می‌دارد.

`all-since-2026.4.23` نمونهٔ upgrade مربوط به Full Release CI است: هر انتشار stable منتشرشده در npm از `2026.4.23` تا `latest`. برای پوشش exhaustively migration به‌روزرسانی منتشرشده، به‌جای Full Release CI از `all-since-2026.4.23` در workflow جداگانهٔ Update Migration استفاده کنید. `release-history` همچنان برای نمونه‌گیری گسترده‌تر دستی، وقتی anchor قدیمی پیش از تاریخ را هم می‌خواهید، در دسترس است.

هنگام اعتبارسنجی یک کاندید پیش از انتشار، یک profile بسته را دستی اجرا کنید:

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

وقتی پرسش انتشار شامل کانال‌های MCP، پاک‌سازی cron/subagent، جست‌وجوی وب OpenAI، یا OpenWebUI است، از `suite_profile=product` استفاده کنید. فقط وقتی به پوشش کامل مسیر انتشار Docker نیاز دارید از `suite_profile=full` استفاده کنید.

## پیش‌فرض انتشار

برای کاندیدهای انتشار، stack اثبات پیش‌فرض این است:

1. `pnpm check:changed` و `pnpm test:changed` برای رگرسیون‌های سطح source.
2. `pnpm release:check` برای یکپارچگی artifact بسته.
3. profile پذیرش بستهٔ `package` یا laneهای بستهٔ سفارشی release-check برای قراردادهای نصب/به‌روزرسانی/Plugin.
4. بررسی‌های انتشار Cross-OS برای رفتارهای installer، onboarding، و platform مختص سیستم‌عامل.
5. مجموعه‌های زنده فقط وقتی سطح تغییرکرده به رفتار ارائه‌دهنده یا hosted-service مربوط است.

روی ماشین‌های maintainer، gateهای گسترده و اثبات محصول Docker/بسته باید در Testbox اجرا شوند، مگر اینکه صراحتاً اثبات محلی انجام شود.

## سازگاری legacy

سهل‌گیری سازگاری باریک و زمان‌دار است:

- بسته‌ها تا `2026.4.25`، از جمله `2026.4.25-beta.*`، ممکن است gapهای metadata بسته را که قبلاً ارسال شده‌اند در پذیرش بسته تحمل کنند.
- بستهٔ منتشرشدهٔ `2026.4.26` ممکن است برای فایل‌های stamp مربوط به metadata build محلی که قبلاً ارسال شده‌اند هشدار بدهد.
- بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند. همان gapها به‌جای هشدار یا skip، باعث شکست می‌شوند.

برای این شکل‌های قدیمی migrationهای راه‌اندازی جدید اضافه نکنید. یک ترمیم doctor اضافه یا گسترش دهید، سپس آن را با `upgrade-survivor` یا `published-upgrade-survivor` اثبات کنید.

## افزودن پوشش

هنگام تغییر رفتار به‌روزرسانی یا Plugin، پوشش را در پایین‌ترین لایه‌ای اضافه کنید که می‌تواند به دلیل درست شکست بخورد:

- منطق خالص مسیر یا metadata: آزمون unit کنار source.
- رفتار inventory بسته یا فایل بسته‌بندی‌شده: آزمون `package-dist-inventory` یا checker مربوط به tarball.
- رفتار نصب/به‌روزرسانی CLI: assertion یا fixture در lane Docker.
- رفتار migration انتشار منتشرشده: سناریوی `published-upgrade-survivor`.
- رفتار منبع registry/بسته: fixture در `test:docker:plugins` یا سرور fixture مربوط به ClawHub.
- رفتار چیدمان یا پاک‌سازی وابستگی: هم اجرای runtime و هم مرز filesystem را assert کنید. وابستگی‌های npm ممکن است زیر ریشهٔ npm مدیریت‌شده hoist شوند، بنابراین آزمون‌ها باید ثابت کنند ریشه اسکن/پاک‌سازی می‌شود، نه اینکه یک درخت `node_modules` محلیِ بسته را فرض کنند.

fixtureهای Docker جدید را به‌صورت پیش‌فرض hermetic نگه دارید. از registryهای fixture محلی و بسته‌های fake استفاده کنید، مگر اینکه هدف آزمون رفتار registry زنده باشد.

## triage شکست

با هویت artifact شروع کنید:

- خلاصهٔ `resolve_package` در پذیرش بسته: source، version، SHA-256، و نام artifact.
- artifactهای Docker: `.artifacts/docker-tests/**/summary.json`، `failures.json`، logهای lane، و فرمان‌های rerun.
- خلاصهٔ upgrade survivor: `.artifacts/upgrade-survivor/summary.json`، شامل نسخهٔ baseline، نسخهٔ کاندید، سناریو، زمان‌بندی‌های phase، و گام‌های recipe.

اجرای دوبارهٔ همان lane دقیقِ شکست‌خورده با همان artifact بسته را به اجرای دوبارهٔ کل چتر انتشار ترجیح دهید.

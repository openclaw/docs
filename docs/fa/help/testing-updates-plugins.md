---
read_when:
    - تغییر رفتار به‌روزرسانی، بررسی سلامت، پذیرش بسته، یا نصب Plugin در OpenClaw
    - آماده‌سازی یا تأیید نامزد انتشار
    - اشکال‌زدایی به‌روزرسانی بسته، پاک‌سازی وابستگی‌های Plugin، یا پسرفت‌های نصب Plugin
sidebarTitle: Update and plugin tests
summary: چگونه OpenClaw مسیرهای به‌روزرسانی، مهاجرت‌های بسته و رفتار نصب/به‌روزرسانی Plugin را اعتبارسنجی می‌کند
title: 'تست: به‌روزرسانی‌ها و Pluginها'
x-i18n:
    generated_at: "2026-05-02T11:50:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

این چک‌لیست اختصاصی برای اعتبارسنجی به‌روزرسانی و Plugin است. هدف
ساده است: اثبات اینکه بسته قابل نصب می‌تواند وضعیت واقعی کاربر را به‌روزرسانی کند، وضعیت
میراثی stale را از طریق `doctor` ترمیم کند، و همچنان Pluginها را از منابع پشتیبانی‌شده
نصب، بارگذاری، به‌روزرسانی و حذف نصب کند.

برای نقشه گسترده‌تر اجراکننده تست، [تست‌کردن](/fa/help/testing) را ببینید. برای کلیدهای
ارائه‌دهنده زنده و مجموعه‌هایی که با شبکه تماس می‌گیرند، [تست‌کردن زنده](/fa/help/testing-live) را ببینید.

## از چه چیزی محافظت می‌کنیم

تست‌های به‌روزرسانی و Plugin از این قراردادها محافظت می‌کنند:

- یک tarball بسته کامل است، یک `dist/postinstall-inventory.json` معتبر دارد،
  و به فایل‌های بازنشده مخزن وابسته نیست.
- کاربر می‌تواند از یک بسته منتشرشده قدیمی‌تر به بسته نامزد منتقل شود
  بدون اینکه پیکربندی، agentها، نشست‌ها، workspaceها، allowlistهای Plugin، یا
  پیکربندی کانال را از دست بدهد.
- `openclaw doctor --fix --non-interactive` مالک مسیرهای پاک‌سازی و ترمیم
  میراثی است. راه‌اندازی نباید مهاجرت‌های سازگاری پنهان برای وضعیت stale
  Plugin اضافه کند.
- نصب‌های Plugin از دایرکتوری‌های محلی، مخزن‌های git، بسته‌های npm، و مسیر
  رجیستری ClawHub کار می‌کنند.
- وابستگی‌های npm مربوط به Plugin در ریشه npm مدیریت‌شده نصب می‌شوند، پیش از
  اعتماد اسکن می‌شوند، و هنگام حذف نصب از طریق npm حذف می‌شوند تا وابستگی‌های
  hoisted باقی نمانند.
- به‌روزرسانی Plugin وقتی چیزی تغییر نکرده پایدار است: رکوردهای نصب، منبع
  resolve‌شده، چیدمان وابستگی نصب‌شده، و وضعیت فعال‌سازی دست‌نخورده می‌مانند.

## اثبات محلی هنگام توسعه

محدود شروع کنید:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

برای تغییرات نصب، حذف نصب، وابستگی، یا inventory بسته مربوط به Plugin، تست‌های
متمرکزی را هم اجرا کنید که seam ویرایش‌شده را پوشش می‌دهند:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

پیش از اینکه هر lane بسته Docker یک tarball مصرف کند، artifact بسته را اثبات کنید:

```bash
pnpm release:check
```

`release:check` بررسی‌های drift پیکربندی/مستندات/API را اجرا می‌کند، inventory توزیع
بسته را می‌نویسد، `npm pack --dry-run` را اجرا می‌کند، فایل‌های ممنوعه بسته‌بندی‌شده را
رد می‌کند، tarball را در یک prefix موقت نصب می‌کند، postinstall را اجرا می‌کند، و
entrypointهای کانال bundled را smoke می‌کند.

## laneهای Docker

laneهای Docker اثبات سطح محصول هستند. آن‌ها یک بسته واقعی را داخل containerهای Linux
نصب یا به‌روزرسانی می‌کنند و رفتار را از طریق فرمان‌های CLI، راه‌اندازی Gateway،
probeهای HTTP، وضعیت RPC، و وضعیت فایل‌سیستم assert می‌کنند.

هنگام تکرار، از laneهای متمرکز استفاده کنید:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

laneهای مهم:

- `test:docker:plugins` smoke نصب Plugin، نصب پوشه محلی، رفتار skip در به‌روزرسانی
  پوشه محلی، پوشه‌های محلی با وابستگی‌های ازپیش‌نصب‌شده، نصب بسته‌های `file:`،
  نصب‌های git با اجرای CLI، به‌روزرسانی‌های moving-ref در git، نصب‌های رجیستری npm
  با وابستگی‌های transitive hoisted، no-op بودن به‌روزرسانی npm، نصب‌های fixture محلی
  ClawHub و no-op بودن به‌روزرسانی، رفتار به‌روزرسانی marketplace، و فعال‌سازی/بازرسی
  bundle مربوط به Claude را اعتبارسنجی می‌کند. برای hermetic/offline نگه داشتن بخش
  ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید.
- `test:docker:plugin-update` اعتبارسنجی می‌کند که یک Plugin نصب‌شده و بدون تغییر
  هنگام `openclaw plugins update` دوباره نصب نشود یا metadata نصب را از دست ندهد.
- `test:docker:upgrade-survivor` tarball نامزد را روی یک fixture کاربر قدیمی کثیف
  نصب می‌کند، به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را اجرا می‌کند، سپس یک Gateway
  loopback را شروع می‌کند و حفظ وضعیت را بررسی می‌کند.
- `test:docker:published-upgrade-survivor` ابتدا یک baseline منتشرشده را نصب می‌کند،
  آن را از طریق یک دستورالعمل baked `openclaw config set` پیکربندی می‌کند، آن را به
  tarball نامزد به‌روزرسانی می‌کند، doctor را اجرا می‌کند، پاک‌سازی میراثی را بررسی می‌کند،
  Gateway را شروع می‌کند، و `/healthz`، `/readyz`، و وضعیت RPC را probe می‌کند.
- `test:docker:update-migration` lane به‌روزرسانی منتشرشده با تمرکز سنگین بر پاک‌سازی است.
  از یک وضعیت کاربر پیکربندی‌شده به سبک Discord/Telegram شروع می‌کند، baseline doctor را
  اجرا می‌کند تا وابستگی‌های Plugin پیکربندی‌شده فرصت materialize شدن داشته باشند، debris
  میراثی وابستگی Plugin را برای یک Plugin بسته‌بندی‌شده پیکربندی‌شده seed می‌کند، به tarball
  نامزد به‌روزرسانی می‌کند، و الزام می‌کند doctor پس از به‌روزرسانی ریشه‌های وابستگی میراثی
  را حذف کند.

variantهای مفید published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

سناریوهای موجود `base`، `feishu-channel`، `bootstrap-persona`،
`plugin-deps-cleanup`، `tilde-log-path`، و `versioned-runtime-deps` هستند. در اجراهای تجمیعی،
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` به همه سناریوهای شکل‌گرفته از
issueهای گزارش‌شده گسترش می‌یابد.

مهاجرت کامل به‌روزرسانی عمدا از Full Release CI جدا است. وقتی پرسش release این است که
«آیا هر release پایدار منتشرشده از 2026.4.23 به بعد می‌تواند به این نامزد به‌روزرسانی شود
و debris وابستگی Plugin را پاک کند؟»، از workflow دستی `Update Migration` استفاده کنید:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## پذیرش بسته

پذیرش بسته gate بسته به‌صورت بومی GitHub است. یک بسته نامزد را به یک tarball
`package-under-test` resolve می‌کند، نسخه و SHA-256 را ثبت می‌کند، سپس laneهای Docker E2E
قابل استفاده مجدد را در برابر همان tarball دقیق اجرا می‌کند. ref مربوط به harness workflow
از ref منبع بسته جدا است، بنابراین منطق تست فعلی می‌تواند releaseهای trusted قدیمی‌تر را
اعتبارسنجی کند.

منابع نامزد:

- `source=npm`: `openclaw@beta`، `openclaw@latest`، یا یک نسخه منتشرشده دقیق را اعتبارسنجی کنید.
- `source=ref`: یک branch، tag، یا commit مورد اعتماد را با harness فعلی انتخاب‌شده pack کنید.
- `source=url`: یک tarball HTTPS را با `package_sha256` الزامی اعتبارسنجی کنید.
- `source=artifact`: از tarball آپلودشده توسط یک اجرای Actions دیگر دوباره استفاده کنید.

بررسی‌های release، پذیرش بسته را با مجموعه package/update/plugin فراخوانی می‌کنند:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

آن‌ها همچنین این موارد را پاس می‌دهند:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

این کار مهاجرت بسته، تعویض کانال به‌روزرسانی، پاک‌سازی وابستگی stale مربوط به Plugin،
پوشش آفلاین Plugin، رفتار به‌روزرسانی Plugin، و QA بسته Telegram را روی همان artifact
resolve‌شده نگه می‌دارد.

`release-history` یک نمونه محدود برای بررسی release است: شش release پایدار آخر،
`2026.4.23`، و یک anchor قدیمی‌تر پیش از آن تاریخ. برای پوشش جامع مهاجرت به‌روزرسانی
منتشرشده، به‌جای Full Release CI از `all-since-2026.4.23` در workflow جداگانه Update Migration
استفاده کنید.

هنگام اعتبارسنجی یک نامزد پیش از release، یک profile بسته را دستی اجرا کنید:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

وقتی پرسش release شامل کانال‌های MCP، پاک‌سازی Cron/subagent، جست‌وجوی وب OpenAI، یا
OpenWebUI است، از `suite_profile=product` استفاده کنید. فقط وقتی به پوشش کامل مسیر release
در Docker نیاز دارید، از `suite_profile=full` استفاده کنید.

## پیش‌فرض release

برای نامزدهای release، stack اثبات پیش‌فرض این است:

1. `pnpm check:changed` و `pnpm test:changed` برای regressionهای سطح source.
2. `pnpm release:check` برای یکپارچگی artifact بسته.
3. profile `package` در پذیرش بسته یا laneهای سفارشی release-check مربوط به بسته
   برای قراردادهای نصب/به‌روزرسانی/Plugin.
4. بررسی‌های release میان‌سیستمی برای رفتارهای ویژه OS در installer، onboarding، و platform.
5. مجموعه‌های live فقط وقتی سطح تغییر یافته به رفتار ارائه‌دهنده یا سرویس hosted مربوط است.

روی ماشین‌های maintainer، gateهای گسترده و اثبات محصول Docker/package باید در Testbox اجرا شوند
مگر اینکه صراحتا اثبات محلی انجام می‌شود.

## سازگاری میراثی

مدارای سازگاری محدود و زمان‌دار است:

- بسته‌ها تا `2026.4.25`، از جمله `2026.4.25-beta.*`، ممکن است gapهای metadata بسته را که
  قبلا shipped شده‌اند در پذیرش بسته تحمل کنند.
- بسته منتشرشده `2026.4.26` ممکن است برای فایل‌های stamp مربوط به metadata build محلی که
  قبلا shipped شده‌اند هشدار بدهد.
- بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند. همان gapها به‌جای هشدار یا skip،
  fail می‌شوند.

برای این shapeهای قدیمی، migration راه‌اندازی جدید اضافه نکنید. یک ترمیم doctor اضافه یا
گسترش دهید، سپس آن را با `upgrade-survivor` یا `published-upgrade-survivor` اثبات کنید.

## افزودن پوشش

هنگام تغییر رفتار به‌روزرسانی یا Plugin، پوشش را در پایین‌ترین لایه‌ای اضافه کنید که
می‌تواند به دلیل درست fail شود:

- منطق pure مربوط به path یا metadata: تست unit کنار source.
- رفتار inventory بسته یا فایل‌های packed: تست `package-dist-inventory` یا checker مربوط به tarball.
- رفتار نصب/به‌روزرسانی CLI: assertion یا fixture در lane Docker.
- رفتار مهاجرت release منتشرشده: سناریوی `published-upgrade-survivor`.
- رفتار منبع registry/package: fixture مربوط به `test:docker:plugins` یا سرور fixture مربوط به ClawHub.
- رفتار چیدمان یا پاک‌سازی وابستگی: هم اجرای runtime و هم مرز فایل‌سیستم را assert کنید.
  وابستگی‌های npm ممکن است زیر ریشه npm مدیریت‌شده hoist شوند، بنابراین تست‌ها باید اثبات کنند
  ریشه اسکن/پاک می‌شود به‌جای اینکه یک درخت `node_modules` محلی بسته را فرض کنند.

fixtureهای Docker جدید را به‌صورت پیش‌فرض hermetic نگه دارید. از registryهای fixture محلی و
بسته‌های جعلی استفاده کنید مگر اینکه نکته تست، رفتار registry live باشد.

## triage شکست

با هویت artifact شروع کنید:

- خلاصه `resolve_package` مربوط به پذیرش بسته: source، version، SHA-256، و
  نام artifact.
- artifactهای Docker: `.artifacts/docker-tests/**/summary.json`،
  `failures.json`، logهای lane، و فرمان‌های rerun.
- خلاصه Upgrade survivor: `.artifacts/upgrade-survivor/summary.json`،
  شامل نسخه baseline، نسخه نامزد، سناریو، timingهای phase، و گام‌های recipe.

rerun کردن همان lane دقیق fail‌شده با همان artifact بسته را به rerun کردن کل umbrella
release ترجیح دهید.

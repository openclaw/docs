---
read_when:
    - تغییر رفتار به‌روزرسانی OpenClaw، doctor، پذیرش بسته، یا نصب Plugin
    - آماده‌سازی یا تأیید یک کاندیدای انتشار
    - اشکال‌زدایی از به‌روزرسانی بسته، پاک‌سازی وابستگی‌های Plugin، یا رگرسیون‌های نصب Plugin
sidebarTitle: Update and plugin tests
summary: OpenClaw چگونه مسیرهای به‌روزرسانی، مهاجرت‌های بسته و رفتار نصب/به‌روزرسانی Plugin را اعتبارسنجی می‌کند
title: 'آزمایش: به‌روزرسانی‌ها و Pluginها'
x-i18n:
    generated_at: "2026-05-05T06:18:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

این چک‌لیست اختصاصی برای اعتبارسنجی به‌روزرسانی و Plugin است. هدف
ساده است: اثبات اینکه بستهٔ قابل نصب می‌تواند وضعیت واقعی کاربر را به‌روزرسانی کند، وضعیت
قدیمی و کهنهٔ legacy را از طریق `doctor` تعمیر کند، و همچنان Pluginها را از منابع پشتیبانی‌شده
نصب، بارگذاری، به‌روزرسانی و حذف نصب کند.

برای نقشهٔ گسترده‌تر اجراکنندهٔ تست، [آزمایش](/fa/help/testing) را ببینید. برای کلیدهای
ارائه‌دهندهٔ زنده و مجموعه‌هایی که با شبکه کار می‌کنند، [آزمایش زنده](/fa/help/testing-live) را ببینید.

## از چه چیزی محافظت می‌کنیم

تست‌های به‌روزرسانی و Plugin از این قراردادها محافظت می‌کنند:

- یک tarball بسته کامل است، `dist/postinstall-inventory.json` معتبر دارد،
  و به فایل‌های بازنشدهٔ repo وابسته نیست.
- کاربر می‌تواند از یک بستهٔ منتشرشدهٔ قدیمی‌تر به بستهٔ نامزد منتقل شود
  بدون اینکه config، agentها، sessionها، workspaceها، فهرست‌های مجاز Plugin، یا
  config کانال را از دست بدهد.
- `openclaw doctor --fix --non-interactive` مالک مسیرهای پاک‌سازی و تعمیر
  legacy است. startup نباید migrationهای سازگاری پنهان برای وضعیت کهنهٔ
  Plugin ایجاد کند.
- نصب‌های Plugin از پوشه‌های محلی، repoهای git، بسته‌های npm، و مسیر
  registry در ClawHub کار می‌کنند.
- وابستگی‌های npm مربوط به Plugin در ریشهٔ npm مدیریت‌شده نصب می‌شوند، پیش از
  اعتماد اسکن می‌شوند، و هنگام حذف نصب از طریق npm حذف می‌شوند تا وابستگی‌های
  hoist‌شده باقی نمانند.
- به‌روزرسانی Plugin وقتی چیزی تغییر نکرده پایدار است: رکوردهای نصب، منبع
  resolve‌شده، چیدمان وابستگی نصب‌شده، و وضعیت enabled دست‌نخورده می‌مانند.

## اثبات محلی هنگام توسعه

محدود شروع کنید:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

برای تغییرات نصب Plugin، حذف نصب، وابستگی، یا inventory بسته، همچنین
تست‌های متمرکزی را اجرا کنید که seam ویرایش‌شده را پوشش می‌دهند:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

پیش از اینکه هر lane مربوط به Docker بسته یک tarball را مصرف کند، artifact بسته را اثبات کنید:

```bash
pnpm release:check
```

`release:check` بررسی‌های drift مربوط به config/docs/API را اجرا می‌کند، package dist
inventory را می‌نویسد، `npm pack --dry-run` را اجرا می‌کند، فایل‌های بسته‌بندی‌شدهٔ ممنوع را رد می‌کند، tarball را در یک prefix موقت نصب می‌کند، postinstall را اجرا می‌کند، و entrypointهای کانال‌های bundled را smoke می‌کند.

## Laneهای Docker

Laneهای Docker اثبات سطح محصول هستند. آن‌ها یک بستهٔ واقعی را داخل containerهای Linux
نصب یا به‌روزرسانی می‌کنند و رفتار را از طریق دستورهای CLI،
startup مربوط به Gateway، probeهای HTTP، وضعیت RPC، و وضعیت filesystem assert می‌کنند.

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

Laneهای مهم:

- `test:docker:plugins` نصب smoke مربوط به Plugin، نصب از پوشهٔ محلی،
  رفتار skip در به‌روزرسانی پوشهٔ محلی، پوشه‌های محلی با وابستگی‌های
  از پیش نصب‌شده، نصب بسته‌های `file:`، نصب‌های git با اجرای CLI، به‌روزرسانی‌های
  moving-ref در git، نصب‌های registry مربوط به npm با وابستگی‌های transitive
  hoist‌شده، no-opهای به‌روزرسانی npm، نصب‌های fixture محلی ClawHub و no-opهای
  به‌روزرسانی، رفتار به‌روزرسانی marketplace، و enable/inspect مربوط به Claude-bundle را اعتبارسنجی می‌کند.
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید تا بلوک ClawHub hermetic/offline بماند.
- `test:docker:plugin-lifecycle-matrix` بستهٔ نامزد را در یک container خالی نصب می‌کند،
  یک Plugin npm را از مسیر install، inspect، disable، enable،
  upgrade صریح، downgrade صریح، و uninstall پس از حذف کد Plugin عبور می‌دهد.
  برای هر مرحله متریک‌های RSS و CPU را log می‌کند.
- `test:docker:plugin-update` اعتبارسنجی می‌کند که یک Plugin نصب‌شدهٔ بدون تغییر
  هنگام `openclaw plugins update` دوباره نصب نشود یا metadata نصب را از دست ندهد.
- `test:docker:upgrade-survivor` tarball نامزد را روی یک fixture کاربر قدیمی کثیف نصب می‌کند،
  به‌روزرسانی بسته به‌علاوهٔ doctor غیرتعاملی را اجرا می‌کند، سپس یک Gateway روی loopback
  راه‌اندازی می‌کند و حفظ وضعیت را بررسی می‌کند.
- `test:docker:published-upgrade-survivor` ابتدا یک baseline منتشرشده را نصب می‌کند،
  آن را از طریق recipe آمادهٔ `openclaw config set` پیکربندی می‌کند، به tarball
  نامزد به‌روزرسانی می‌کند، doctor را اجرا می‌کند، پاک‌سازی legacy را بررسی می‌کند،
  Gateway را راه‌اندازی می‌کند، و `/healthz`، `/readyz` و وضعیت RPC را probe می‌کند.
- `test:docker:update-restart-auth` بستهٔ نامزد را نصب می‌کند، یک Gateway مدیریت‌شده با token-auth
  راه‌اندازی می‌کند، env احراز هویت gateway مربوط به caller را برای
  `openclaw update --yes --json` unset می‌کند، و الزام می‌کند دستور به‌روزرسانی نامزد
  پیش از probeهای معمول Gateway را restart کند.
- `test:docker:update-migration` lane منتشرشدهٔ به‌روزرسانی با تمرکز سنگین بر پاک‌سازی است. از یک وضعیت کاربر
  پیکربندی‌شده شبیه Discord/Telegram شروع می‌کند، doctor baseline را اجرا می‌کند تا وابستگی‌های Plugin
  پیکربندی‌شده فرصت materialize شدن داشته باشند، debris وابستگی Plugin legacy را برای یک Plugin
  بسته‌بندی‌شدهٔ پیکربندی‌شده seed می‌کند، به tarball نامزد به‌روزرسانی می‌کند، و الزام می‌کند
  doctor پس از به‌روزرسانی ریشه‌های وابستگی legacy را حذف کند.

Variantهای مفید published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

سناریوهای موجود `base`، `feishu-channel`، `bootstrap-persona`،
`plugin-deps-cleanup`، `configured-plugin-installs`،
`stale-source-plugin-shadow`، `tilde-log-path`، و `versioned-runtime-deps` هستند. در اجرای aggregate،
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` به همهٔ سناریوهای شبیه issue گزارش‌شده گسترش می‌یابد،
از جمله migration نصب Plugin پیکربندی‌شده.

migration کامل به‌روزرسانی عمدا از Full Release CI جداست. زمانی از workflow
دستی `Update Migration` استفاده کنید که پرسش release این باشد: «آیا همهٔ
انتشارهای stable منتشرشده از 2026.4.23 به بعد می‌توانند به این نامزد
به‌روزرسانی شوند و debris وابستگی Plugin را پاک کنند؟»:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## پذیرش بسته

Package Acceptance gate بومی GitHub برای بسته است. یک بستهٔ نامزد را به یک tarball
`package-under-test` resolve می‌کند، version و SHA-256 را ثبت می‌کند، سپس laneهای Docker E2E
قابل استفادهٔ مجدد را روی همان tarball دقیق اجرا می‌کند. ref مربوط به harness workflow از ref منبع
بسته جداست، بنابراین منطق تست فعلی می‌تواند انتشارهای trusted قدیمی‌تر را اعتبارسنجی کند.

منابع نامزد:

- `source=npm`: اعتبارسنجی `openclaw@beta`، `openclaw@latest`، یا یک
  version منتشرشدهٔ دقیق.
- `source=ref`: pack کردن یک branch، tag، یا commit trusted با harness فعلی انتخاب‌شده.
- `source=url`: اعتبارسنجی یک tarball HTTPS با `package_sha256` الزامی.
- `source=artifact`: استفادهٔ دوباره از tarball آپلودشده توسط یک اجرای دیگر Actions.

Full Release Validation به‌طور پیش‌فرض از `source=artifact` استفاده می‌کند که از
SHA انتشار resolve‌شده ساخته شده است. برای اثبات پس از انتشار،
`package_acceptance_package_spec=openclaw@YYYY.M.D` را پاس کنید تا همان matrix ارتقا
در عوض بستهٔ npm منتشرشده را هدف بگیرد.

بررسی‌های release، Package Acceptance را با مجموعهٔ package/update/restart/plugin فراخوانی می‌کنند:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

وقتی soak مربوط به release فعال باشد، آن‌ها همچنین این موارد را پاس می‌کنند:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

این کار migration بسته، switching کانال update، پاک‌سازی وابستگی کهنهٔ Plugin،
پوشش offline Plugin، رفتار به‌روزرسانی Plugin، و QA بستهٔ Telegram را روی همان artifact
resolve‌شده نگه می‌دارد، بدون اینکه gate پیش‌فرض بستهٔ release را وادار کند
همهٔ انتشارهای منتشرشده را طی کند.

`last-stable-4` به چهار انتشار stable اخیر OpenClaw که در npm منتشر شده‌اند resolve می‌شود.
پذیرش بستهٔ release، `2026.4.23` را به‌عنوان نخستین مرز سازگاری به‌روزرسانی Plugin،
`2026.5.2` را به‌عنوان مرز churn معماری Plugin، و
`2026.4.15` را به‌عنوان یک baseline قدیمی‌تر به‌روزرسانی منتشرشدهٔ 2026.4.1x pin می‌کند؛ resolver
pinهایی را که از قبل در چهار مورد اخیر هستند dedupe می‌کند. برای پوشش exhaustive migration
به‌روزرسانی منتشرشده، به‌جای Full Release CI از `all-since-2026.4.23` در workflow جداگانهٔ Update
Migration استفاده کنید. `release-history` برای نمونه‌گیری دستی گسترده‌تر، زمانی که anchor
قدیمی pre-date را هم می‌خواهید، همچنان در دسترس است.

وقتی چند baseline مربوط به published-upgrade survivor انتخاب شوند، workflow قابل استفادهٔ مجدد
Docker هر baseline را به job runner هدفمند خودش shard می‌کند. هر shard مربوط به baseline همچنان
مجموعهٔ سناریوی انتخاب‌شده را اجرا می‌کند، اما logها و artifactها برای هر baseline جدا می‌مانند
و زمان wall به کندترین shard محدود می‌شود، نه به یک job بزرگ serial.

هنگام اعتبارسنجی یک نامزد پیش از release، profile بسته را دستی اجرا کنید:

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
از `suite_profile=product` استفاده کنید. فقط زمانی از `suite_profile=full` استفاده کنید که به پوشش کامل
مسیر release در Docker نیاز دارید.

## پیش‌فرض release

برای نامزدهای release، stack اثبات پیش‌فرض این است:

1. `pnpm check:changed` و `pnpm test:changed` برای regressionهای سطح source.
2. `pnpm release:check` برای یکپارچگی artifact بسته.
3. profile مربوط به Package Acceptance `package` یا laneهای سفارشی بستهٔ release-check
   برای قراردادهای install/update/restart/plugin.
4. بررسی‌های release بین‌سیستم‌عاملی برای رفتار installer، onboarding، و platform
   خاص هر سیستم‌عامل.
5. مجموعه‌های live فقط وقتی surface تغییرکرده رفتار provider یا hosted-service را لمس می‌کند.

روی ماشین‌های maintainer، gateهای گسترده و اثبات محصول Docker/package باید در
Testbox اجرا شوند، مگر اینکه صراحتا اثبات محلی انجام شود.

## سازگاری legacy

leniency سازگاری محدود و زمان‌بندی‌شده است:

- بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، ممکن است gapهای
  metadata بسته را که قبلا shipped شده‌اند در Package Acceptance تحمل کنند.
- بستهٔ منتشرشدهٔ `2026.4.26` ممکن است برای فایل‌های stamp مربوط به metadata build محلی
  که قبلا shipped شده‌اند warning بدهد.
- بسته‌های بعدی باید قراردادهای modern را برآورده کنند. همان gapها به‌جای
  warning یا skipping شکست می‌خورند.

برای این شکل‌های قدیمی migration startup جدید اضافه نکنید. یک تعمیر doctor
اضافه یا گسترش دهید، سپس آن را با `upgrade-survivor`، `published-upgrade-survivor`، یا
`update-restart-auth` اثبات کنید، وقتی دستور update مالک restart است.

## افزودن پوشش

هنگام تغییر رفتار update یا Plugin، پوشش را در پایین‌ترین لایه‌ای اضافه کنید که
می‌تواند به دلیل درست fail شود:

- منطق خالص path یا metadata: تست unit کنار source.
- رفتار inventory بسته یا فایل‌های packed: تست `package-dist-inventory` یا checker tarball.
- رفتار install/update مربوط به CLI: assertion یا fixture مربوط به lane Docker.
- رفتار migration انتشار منتشرشده: سناریوی `published-upgrade-survivor`.
- رفتار restart تحت مالکیت update: `update-restart-auth`.
- رفتار منبع registry/package: fixture مربوط به `test:docker:plugins` یا سرور fixture
  ClawHub.
- رفتار چیدمان یا پاک‌سازی وابستگی: هم اجرای runtime و هم مرز
  filesystem را assert کنید. وابستگی‌های npm ممکن است زیر ریشهٔ npm مدیریت‌شده hoist شوند،
  بنابراین تست‌ها باید اثبات کنند که root اسکن/پاک می‌شود، نه اینکه یک درخت
  `node_modules` محلی بسته را فرض کنند.

fixtureهای Docker جدید را به‌طور پیش‌فرض hermetic نگه دارید. از registryهای fixture محلی و
بسته‌های fake استفاده کنید، مگر اینکه هدف تست رفتار registry زنده باشد.

## triage شکست

با هویت artifact شروع کنید:

- خلاصهٔ پذیرش بستهٔ `resolve_package`: منبع، نسخه، SHA-256، و
  نام آرتیفکت.
- آرتیفکت‌های Docker: `.artifacts/docker-tests/**/summary.json`،
  `failures.json`، گزارش‌های مسیرها، و فرمان‌های اجرای دوباره.
- خلاصهٔ بازماندهٔ ارتقا: `.artifacts/upgrade-survivor/summary.json`،
  شامل نسخهٔ مبنا، نسخهٔ نامزد، سناریو، زمان‌بندی‌های فاز، و
  گام‌های دستورالعمل.

اجرای دوبارهٔ همان مسیر دقیق ناموفق با همان آرتیفکت بسته را به
اجرای دوبارهٔ کل چتر انتشار ترجیح دهید.

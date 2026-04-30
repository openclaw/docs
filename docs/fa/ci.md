---
read_when:
    - باید بدانید چرا یک کار CI اجرا شد یا اجرا نشد
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگی برای اجرای اعتبارسنجی انتشار یا اجرای مجدد آن هستید
summary: گراف وظایف CI، دروازه‌های محدوده، چترهای انتشار، و معادل‌های فرمان‌های محلی
title: خط لولهٔ CI
x-i18n:
    generated_at: "2026-04-30T09:34:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI در هر push به `main` و هر pull request اجرا می‌شود. کار `preflight` diff را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده باشند، laneهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمدا scoping هوشمند را دور می‌زنند و برای release candidateها و اعتبارسنجی گسترده، کل گراف را fan out می‌کنند. laneهای Android از طریق `include_android` به‌صورت opt-in باقی می‌مانند. پوشش Plugin مخصوص release در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| کار                              | هدف                                                                                      | زمان اجرا                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط-مستندات، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest CI      | همیشه روی pushها و PRهای غیر-draft |
| `security-scm-fast`              | تشخیص کلید خصوصی و audit workflow از طریق `zizmor`                                        | همیشه روی pushها و PRهای غیر-draft |
| `security-dependency-audit`      | audit lockfile تولید بدون وابستگی در برابر advisoryهای npm                             | همیشه روی pushها و PRهای غیر-draft |
| `security-fast`                  | aggregate الزامی برای کارهای امنیتی سریع                                                | همیشه روی pushها و PRهای غیر-draft |
| `check-dependencies`             | عبور production Knip فقط برای dependency به‌علاوه guard allowlist فایل‌های استفاده‌نشده                    | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی‌های artifact ساخته‌شده، و artifactهای downstream قابل استفاده‌مجدد          | تغییرات مرتبط با Node              |
| `checks-fast-core`               | laneهای درستی‌سنجی سریع Linux مانند بررسی‌های bundled/plugin-contract/protocol                 | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های sharded قرارداد channel با نتیجه aggregate check پایدار                         | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای تست Core Node، به‌جز laneهای channel، bundled، contract، و extension             | تغییرات مرتبط با Node              |
| `check`                          | معادل gate محلی اصلی به‌صورت sharded: typeهای prod، lint، guardها، typeهای تست، و smoke سخت‌گیرانه   | تغییرات مرتبط با Node              |
| `check-additional`               | shardهای معماری، boundary، guardهای extension-surface، package-boundary، و gateway-watch | تغییرات مرتبط با Node              |
| `build-smoke`                    | تست‌های smoke برای CLI ساخته‌شده و smoke حافظه startup                                               | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای تست‌های channel artifact ساخته‌شده                                                    | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | lane سازگاری build و smoke برای Node 22                                                   | dispatch دستی CI برای releaseها    |
| `check-docs`                     | قالب‌بندی مستندات، lint، و بررسی لینک‌های شکسته                                                | تغییر مستندات                       |
| `skills-python`                  | Ruff + pytest برای skills مبتنی بر Python                                                       | تغییرات مرتبط با skillهای Python      |
| `checks-windows`                 | تست‌های مخصوص process/path در Windows به‌علاوه regressionهای specifier import runtime مشترک         | تغییرات مرتبط با Windows           |
| `macos-node`                     | lane تست TypeScript در macOS با استفاده از artifactهای ساخته‌شده مشترک                                  | تغییرات مرتبط با macOS             |
| `macos-swift`                    | lint، build، و تست‌های Swift برای app macOS                                               | تغییرات مرتبط با macOS             |
| `android`                        | تست‌های unit Android برای هر دو flavor به‌علاوه یک build APK debug                                 | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت trusted                                    | موفقیت CI روی main یا dispatch دستی |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد اصلا کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` مرحله‌هایی داخل همین کار هستند، نه کارهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای کارهای سنگین‌تر artifact و platform matrix سریع fail می‌شوند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کننده‌های downstream به‌محض آماده شدن build مشترک شروع شوند.
4. laneهای سنگین‌تر platform و runtime بعد از آن fan out می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref `main` وارد می‌شود، کارهای superseded را به‌صورت `cancelled` علامت‌گذاری کند. این را noise در CI در نظر بگیرید، مگر اینکه جدیدترین اجرا برای همان ref نیز در حال fail شدن باشد. بررسی‌های aggregate shard از `!cancelled() && always()` استفاده می‌کنند تا همچنان failureهای عادی shard را گزارش کنند، اما پس از اینکه کل workflow قبلا superseded شده است، در صف نمانند. کلید concurrency خودکار CI نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در یک گروه صف قدیمی نتواند اجراهای جدیدتر main را برای مدت نامحدود مسدود کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در حال پیشرفت را cancel نمی‌کنند.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با تست‌های unit در `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی تشخیص changed-scope را skip می‌کند و باعث می‌شود manifest مربوط به preflight طوری رفتار کند که انگار هر بخش scoped تغییر کرده است.

- **ویرایش‌های workflow CI** گراف Node CI به‌علاوه workflow linting را اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، Android، یا macOS را اجباری نمی‌کنند؛ آن laneهای platform به تغییرات source مربوط به platform محدود می‌مانند.
- **ویرایش‌های فقط routing در CI، ویرایش‌های fixture ارزان و منتخب core-test، و ویرایش‌های محدود helper/test-routing قرارداد Plugin** از یک مسیر سریع manifest فقط-Node استفاده می‌کنند: `preflight`، security، و یک task منفرد `checks-fast-core`. وقتی تغییر به سطح‌های routing یا helper که task سریع مستقیما exercise می‌کند محدود باشد، آن مسیر artifactهای build، سازگاری Node 22، قراردادهای channel، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی را skip می‌کند.
- **بررسی‌های Windows Node** به wrapperهای مخصوص process/path در Windows، helperهای runner برای npm/pnpm/UI، config package manager، و سطح‌های workflow CI که آن lane را اجرا می‌کنند محدود شده‌اند؛ تغییرات نامرتبط در source، Plugin، install-smoke، و فقط-تست روی laneهای Linux Node باقی می‌مانند.

کندترین خانواده‌های تست Node split یا balance شده‌اند تا هر کار بدون رزرو بیش‌ازحد runnerها کوچک بماند: قراردادهای channel به‌صورت سه shard وزنی اجرا می‌شوند، laneهای کوچک unit مربوط به core جفت شده‌اند، auto-reply به‌صورت چهار worker متوازن اجرا می‌شود (با subtree مربوط به reply که به shardهای agent-runner، dispatch، و commands/state-routing تقسیم شده است)، و configهای agentic مربوط به Gateway/Plugin به‌جای انتظار برای artifactهای ساخته‌شده، در سراسر کارهای موجود agentic Node فقط-source پخش شده‌اند. تست‌های گسترده browser، QA، media، و Pluginهای miscellaneous به‌جای catch-all مشترک Plugin از configهای اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern ورودی‌های timing را با نام shard در CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک config کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کار compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و معماری topology runtime را از پوشش gateway watch جدا می‌کند؛ shard مربوط به boundary guard، guardهای مستقل کوچک خود را به‌صورت concurrent داخل یک کار اجرا می‌کند. Gateway watch، تست‌های channel، و shard مربوط به support-boundary در core پس از اینکه `dist/` و `dist-runtime/` از قبل ساخته شدند، به‌صورت concurrent داخل `build-artifacts` اجرا می‌شوند.

Android CI هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK debug مربوط به Play را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه ندارد؛ lane unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، در حالی که از یک کار تکراری packaging برای APK debug در هر push مرتبط با Android جلوگیری می‌کند.

shard مربوط به `check-dependencies`، `pnpm deadcode:dependencies` (یک عبور production Knip فقط برای dependency که به آخرین نسخه Knip pin شده است، با minimum release age مربوط به pnpm که برای install از طریق `dlx` غیرفعال شده است) و `pnpm deadcode:unused-files` را اجرا می‌کند؛ دومی یافته‌های production unused-file در Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard فایل استفاده‌نشده وقتی یک PR فایل استفاده‌نشده جدید و reviewنشده اضافه کند یا entry کهنه‌ای در allowlist باقی بگذارد fail می‌شود، در حالی که سطح‌های intentional dynamic Plugin، generated، build، live-test، و package bridge را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## Dispatchهای دستی

dispatchهای دستی CI همان گراف کاری CI عادی را اجرا می‌کنند، اما هر lane scoped غیر-Android را forced on می‌کنند: shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Python skills، Windows، macOS، و Control UI i18n. dispatchهای دستی standalone CI فقط با `include_android=true`، Android را اجرا می‌کنند؛ umbrella کامل release با پاس دادن `include_android=true`، Android را فعال می‌کند. بررسی‌های static مربوط به Plugin prerelease، shard فقط-release با نام `agentic-plugins`، sweep کامل batch مربوط به extension، و laneهای Docker مربوط به Plugin prerelease از CI مستثنا هستند. مجموعه prerelease مربوط به Docker فقط زمانی اجرا می‌شود که `Full Release Validation` workflow جداگانه `Plugin Prerelease` را با gate مربوط به release-validation فعال dispatch کند.

اجراهای دستی از یک گروه concurrency یکتا استفاده می‌کنند تا full suite مربوط به release-candidate با push یا اجرای PR دیگری روی همان ref cancel نشود. input اختیاری `target_ref` به یک caller trusted اجازه می‌دهد آن گراف را روی یک branch، tag، یا commit SHA کامل اجرا کند، در حالی که از فایل workflow مربوط به dispatch ref منتخب استفاده می‌کند.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnerها

| اجراکننده                           | کارها                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، کارهای امنیتی سریع و تجمیع‌ها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع پروتکل/قرارداد/باندل‌شده، بررسی‌های شاردشده قرارداد کانال، شاردهای `check` به‌جز lint، شاردها و تجمیع‌های `check-additional`، راستی‌آزمایی‌های تجمیعی آزمون Node، بررسی‌های مستندات، Skills پایتون، workflow-sanity، labeler، auto-response؛ پیش‌پرواز install-smoke نیز از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا ماتریس Blacksmith بتواند زودتر در صف قرار گیرد |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، شاردهای سبک‌تر Pluginها، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types` و `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، شاردهای آزمون Node روی لینوکس، شاردهای آزمون Pluginهای باندل‌شده، `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (آن‌قدر به CPU حساس است که 8 vCPU بیش از مقداری که صرفه‌جویی کردند هزینه داشتند)؛ بیلدهای Docker برای install-smoke (زمان صف 32-vCPU بیش از مقداری که صرفه‌جویی کرد هزینه داشت)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` روی `openclaw/openclaw`؛ فورک‌ها به `macos-latest` برمی‌گردند                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` روی `openclaw/openclaw`؛ فورک‌ها به `macos-latest` برمی‌گردند                                                                                                                                                                                                                                                                                                                                                                                                 |

## معادل‌های محلی

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## اعتبارسنجی کامل انتشار

`Full Release Validation` گردش‌کار چتری دستی برای «اجرای همه‌چیز پیش از انتشار» است. یک شاخه، تگ، یا SHA کامل کامیت را می‌پذیرد، گردش‌کار دستی `CI` را با همان هدف dispatch می‌کند، `Plugin Prerelease` را برای اثبات مخصوص انتشارِ Plugin/بسته/استاتیک/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، پذیرش بسته، مجموعه‌های مسیر انتشار Docker، live/E2E، OpenWebUI، هم‌ترازی QA Lab، Matrix و مسیرهای Telegram dispatch می‌کند. همچنین وقتی مشخصه بسته منتشرشده ارائه شود، می‌تواند گردش‌کار پس از انتشار `NPM Telegram Beta E2E` را اجرا کند.

`release_profile` گستره live/provider ارسال‌شده به بررسی‌های انتشار را کنترل می‌کند:

- `minimum` سریع‌ترین مسیرهای حیاتی انتشار OpenAI/هسته را نگه می‌دارد.
- `stable` مجموعه پایدار provider/backend را اضافه می‌کند.
- `full` ماتریس گسترده advisory provider/media را اجرا می‌کند.

این چتر شناسه اجراهای فرزند dispatch‌شده را ثبت می‌کند، و کار نهایی `Verify full validation` نتیجه‌های فعلی اجراهای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین کارها را برای هر اجرای فرزند پیوست می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط کار راستی‌آزمای والد را دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی به‌روزرسانی شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all`، فقط برای فرزند CI کامل عادی از `ci`، برای هر فرزند انتشار از `release-checks`، یا از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای دوباره یک جعبه انتشار شکست‌خورده را پس از یک اصلاح متمرکز محدود نگه می‌دارد.

`OpenClaw Release Checks` از ref مورد اعتماد گردش‌کار استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به یک tarball با نام `release-package-under-test` resolve کند، سپس همان artifact را هم به گردش‌کار Docker مسیر انتشار live/E2E و هم به شارد پذیرش بسته می‌دهد. این کار بایت‌های بسته را در سراسر جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوباره همان نامزد در چندین کار فرزند جلوگیری می‌کند.

## شاردهای Live و E2E

فرزند live/E2E انتشار پوشش گسترده بومی `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک کار ترتیبی، به‌صورت شاردهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- کارهای provider-filtered `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- شاردهای جداشده صوت/ویدئوی media و شاردهای موسیقی provider-filtered

این کار همان پوشش فایل را حفظ می‌کند و در عین حال اجرای دوباره و عیب‌یابی شکست‌های کند providerهای live را آسان‌تر می‌کند. نام‌های شارد تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media` و `native-live-extensions-media-music` برای اجرای دوباره دستی یک‌مرحله‌ای همچنان معتبر می‌مانند.

شاردهای media بومی live در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط گردش‌کار `Live Media Runner Image` ساخته می‌شود. آن image از پیش `ffmpeg` و `ffprobe` را نصب می‌کند؛ کارهای media فقط پیش از راه‌اندازی، باینری‌ها را راستی‌آزمایی می‌کنند. مجموعه‌های live متکی به Docker را روی runnerهای عادی Blacksmith نگه دارید؛ کارهای container جای مناسبی برای راه‌اندازی آزمون‌های Docker تودرتو نیستند.

شاردهای live مدل/backend متکی به Docker برای هر کامیت انتخاب‌شده از یک image مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. گردش‌کار انتشار live آن image را یک‌بار می‌سازد و push می‌کند، سپس شاردهای مدل live در Docker، Gateway، backend CLI، اتصال ACP، و harness کدکس با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. اگر این شاردها هدف کامل Docker منبع را مستقل دوباره بسازند، اجرای انتشار بد پیکربندی شده است و زمان دیواری را صرف بیلدهای تکراری image خواهد کرد.

## پذیرش بسته

وقتی پرسش این است که «آیا این بسته قابل نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI عادی فرق دارد: CI عادی درخت منبع را اعتبارسنجی می‌کند، در حالی که پذیرش بسته یک tarball منفرد را از طریق همان harness Docker E2E اعتبارسنجی می‌کند که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند.

### کارها

1. `resolve_package`، `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` بارگذاری می‌کند، و منبع، ref گردش‌کار، ref بسته، نسخه، SHA-256، و profile را در خلاصه گام GitHub چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار قابل استفاده مجدد آن artifact را دانلود می‌کند، inventory tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker مربوط به package-digest را آماده می‌کند، و مسیرهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout گردش‌کار، در برابر آن بسته اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب می‌کند، گردش‌کار قابل استفاده مجدد بسته و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن مسیرها را به‌صورت کارهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و اگر Package Acceptance یک بسته را resolve کرده باشد، همان artifact با نام `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک مشخصه npm منتشرشده را نصب کند.
4. اگر resolve بسته، پذیرش Docker، یا مسیر اختیاری Telegram شکست خورده باشد، `summary` گردش‌کار را fail می‌کند.

### منابع نامزدها

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این گزینه برای پذیرش بتا/پایدار منتشرشده استفاده کنید.
- `source=ref` یک شاخه، برچسب، یا SHA کامل کامیتِ مورد اعتماد `package_ref` را بسته‌بندی می‌کند. حل‌کننده شاخه‌ها/برچسب‌های OpenClaw را دریافت می‌کند، بررسی می‌کند که کامیت انتخاب‌شده از تاریخچه شاخه مخزن یا یک برچسب انتشار قابل دسترسی باشد، وابستگی‌ها را در یک worktree جداشده نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` از HTTPS دانلود می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای artifactهای به‌اشتراک‌گذاشته‌شده بیرونی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد workflow/harness مورد اعتمادی است که آزمون را اجرا می‌کند. `package_ref` کامیت مبدأیی است که هنگام `source=ref` بسته‌بندی می‌شود. این کار به harness آزمون فعلی اجازه می‌دهد کامیت‌های مبدأ قدیمی‌ترِ مورد اعتماد را بدون اجرای منطق workflow قدیمی اعتبارسنجی کند.

### پروفایل‌های مجموعه آزمون

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `bundled-channel-deps-compat`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — بخش‌های کامل مسیر انتشار Docker با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد الزامی است

پروفایل `package` از پوشش آفلاین Plugin استفاده می‌کند تا اعتبارسنجی بسته منتشرشده به دسترس‌بودن زنده ClawHub وابسته نباشد. مسیر اختیاری Telegram از artifact با نام `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، در حالی که مسیر مشخصه npm منتشرشده برای dispatchهای مستقل حفظ می‌شود.

بررسی‌های انتشار Package Acceptance را با `source=ref`، `package_ref=<release-ref>`، `workflow_ref=<release workflow ref>`، `suite_profile=custom`، `docker_lanes='bundled-channel-deps-compat plugins-offline'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. بخش‌های Docker مسیر انتشار، مسیرهای هم‌پوشان package/update/plugin را پوشش می‌دهند؛ Package Acceptance سازگاری artifact-native کانال همراه، Plugin آفلاین، و اثبات Telegram را در برابر همان tarball بسته حل‌شده نگه می‌دارد. بررسی‌های انتشار Cross-OS همچنان onboarding، نصب‌کننده، و رفتارهای پلتفرمیِ مخصوص سیستم‌عامل را پوشش می‌دهند؛ اعتبارسنجی محصول package/update باید از Package Acceptance شروع شود. مسیرهای تازه Windows packaged و installer نیز بررسی می‌کنند که یک بسته نصب‌شده بتواند یک override کنترل مرورگر را از یک مسیر خام و مطلق Windows import کند. smoke چرخش عامل Cross-OS مربوط به OpenAI به‌طور پیش‌فرض وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4-mini`، تا اثبات نصب و Gateway سریع و قطعی بماند.

### بازه‌های سازگاری قدیمی

Package Acceptance برای بسته‌های از پیش منتشرشده، بازه‌های سازگاری قدیمیِ محدود دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- ورودی‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌های حذف‌شده از tarball اشاره کنند؛
- `doctor-switch` ممکن است زیرمورد پایداری `gateway install --wrapper` را وقتی بسته آن flag را ارائه نمی‌کند رد کند؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies`های مفقود را از fixture جعلی git مشتق‌شده از tarball حذف کند و ممکن است نبود `update.channel` پایدارشده را log کند؛
- smokeهای Plugin ممکن است مکان‌های قدیمی install-record را بخوانند یا نبود پایداری install-record بازارچه را بپذیرند؛
- `plugin-update` ممکن است مهاجرت فراداده پیکربندی را مجاز بداند، در حالی که همچنان الزام می‌کند install record و رفتار no-reinstall بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` نیز ممکن است برای فایل‌های stamp فراداده build محلی که از قبل ارسال شده بودند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا ردشدن، شکست می‌خورند.

### نمونه‌ها

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

هنگام اشکال‌زدایی اجرای ناموفق پذیرش بسته، از خلاصه `resolve_package` شروع کنید تا مبدأ بسته، نسخه، و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و artifactهای Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، logهای مسیر، زمان‌بندی‌های مرحله، و فرمان‌های اجرای دوباره. به‌جای اجرای دوباره اعتبارسنجی کامل انتشار، اجرای دوباره پروفایل بسته ناموفق یا مسیرهای دقیق Docker را ترجیح دهید.

## smoke نصب

workflow جداگانه `Install Smoke` همان اسکریپت محدوده را از طریق job خودش با نام `preflight` دوباره استفاده می‌کند. این workflow پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطح‌های Docker/package، تغییرات package/manifest مربوط به Pluginهای همراه، یا سطح‌های Plugin/کانال/Gateway/Plugin SDK هسته را که jobهای Docker smoke تمرین می‌کنند لمس می‌کنند. تغییرات فقط-مبدأ در Plugin همراه، ویرایش‌های فقط-آزمون، و ویرایش‌های فقط-مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع تصویر Dockerfile ریشه را یک‌بار build می‌کند، CLI را بررسی می‌کند، smoke مربوط به CLI حذف agents در shared-workspace را اجرا می‌کند، e2e کانتینری gateway-network را اجرا می‌کند، یک آرگومان build برای افزونه همراه را تأیید می‌کند، و پروفایل Docker محدودِ bundled-plugin را با timeout تجمیعی ۲۴۰ ثانیه‌ای برای فرمان اجرا می‌کند (هر اجرای Docker سناریو جداگانه capped می‌شود).
- **مسیر کامل** نصب بسته QR و پوشش Docker/update نصب‌کننده را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call، و pull requestهایی نگه می‌دارد که واقعاً سطح‌های installer/package/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک تصویر smoke مربوط به Dockerfile ریشه GHCR با target-SHA را آماده یا دوباره استفاده می‌کند، سپس نصب بسته QR، smokeهای Dockerfile/Gateway ریشه، smokeهای installer/update، و E2E سریع Docker مربوط به bundled-plugin را به‌عنوان jobهای جداگانه اجرا می‌کند تا کار نصب‌کننده پشت smokeهای تصویر ریشه منتظر نماند.

pushهای `main`، شامل کامیت‌های merge، مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق changed-scope روی یک push پوشش کامل درخواست کند، workflow smoke سریع Docker را نگه می‌دارد و smoke کامل نصب را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

smoke کند image-provider مربوط به نصب global با Bun جداگانه با `run_bun_global_install_smoke` کنترل می‌شود. این مورد در زمان‌بندی شبانه و از workflow بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای install-focused خودشان را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک تصویر shared live-test را از قبل build می‌کند، OpenClaw را یک‌بار به‌عنوان tarball مربوط به npm بسته‌بندی می‌کند، و دو تصویر مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner خام Node/Git برای مسیرهای installer/update/plugin-dependency؛
- یک تصویر کاربردی که همان tarball را برای مسیرهای عملکردی معمول در `/app` نصب می‌کند.

تعریف‌های مسیر Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. زمان‌بند با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` تصویر هر مسیر را انتخاب می‌کند، سپس مسیرها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیم‌پذیرها

| متغیر                                 | پیش‌فرض | هدف                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای main-pool برای مسیرهای معمول.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف مسیر زنده هم‌زمان تا providerها throttle نکنند.                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف مسیر نصب هم‌زمان npm.                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف مسیر چندسرویسی هم‌زمان.                                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله بین شروع مسیرها برای جلوگیری از طوفان create در daemon Docker؛ برای بدون فاصله `0` بگذارید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout fallback برای هر مسیر (۱۲۰ دقیقه)؛ مسیرهای زنده/tail انتخاب‌شده capهای سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` برنامه زمان‌بند را بدون اجرای مسیرها چاپ می‌کند.                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق مسیرها با جداکننده کاما؛ smoke پاک‌سازی را رد می‌کند تا agents بتوانند یک مسیر ناموفق را بازتولید کنند. |

مسیری که از cap مؤثر خود سنگین‌تر است همچنان می‌تواند از یک pool خالی شروع شود، سپس تا زمانی که ظرفیت را آزاد کند به‌تنهایی اجرا می‌شود. preflight تجمیعی محلی Docker را بررسی می‌کند، کانتینرهای OpenClaw E2E مانده را حذف می‌کند، وضعیت مسیرهای فعال را منتشر می‌کند، زمان‌بندی مسیرها را برای ترتیب longest-first پایدار می‌کند، و به‌طور پیش‌فرض پس از نخستین شکست، زمان‌بندی مسیرهای pooled جدید را متوقف می‌کند.

### workflow زنده/E2E قابل استفاده مجدد

workflow زنده/E2E قابل استفاده مجدد از `scripts/test-docker-all.mjs --plan-json` می‌پرسد چه پوشش package، نوع تصویر، تصویر زنده، مسیر، و credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا یک artifact بسته مربوط به اجرای فعلی را دانلود می‌کند، یا یک artifact بسته را از `package_artifact_run_id` دانلود می‌کند؛ inventory tarball را اعتبارسنجی می‌کند؛ وقتی plan به مسیرهای package-installed نیاز داشته باشد، تصاویر Docker E2E خام/کاربردی GHCR با برچسب package-digest را از طریق کش لایه Docker در Blacksmith build و push می‌کند؛ و به‌جای build دوباره، ورودی‌های ارائه‌شده `docker_e2e_bare_image`/`docker_e2e_functional_image` یا تصاویر موجود package-digest را دوباره استفاده می‌کند. pullهای تصویر Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش دوباره امتحان می‌شوند تا stream گیرکرده registry/cache سریع retry شود، نه اینکه بیشتر مسیر بحرانی CI را مصرف کند.

### بخش‌های مسیر انتشار

پوشش Docker انتشار jobهای chunked کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر بخش فقط نوع تصویر موردنیازش را pull کند و چندین مسیر را از طریق همان زمان‌بند وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

بخش‌های Docker در انتشار فعلی عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، از `plugins-runtime-install-a` تا `plugins-runtime-install-h`، `bundled-channels-core`، `bundled-channels-update-a`، `bundled-channels-update-discord`، `bundled-channels-update-b` و `bundled-channels-contracts`. بخش تجمیعی `bundled-channels` همچنان برای اجرای مجدد دستی و یک‌باره در دسترس است، و `plugins-runtime-core`، `plugins-runtime` و `plugins-integrations` همچنان نام‌های مستعار تجمیعی Plugin/runtime باقی می‌مانند. نام مستعار لِین `install-e2e` همچنان نام مستعار تجمیعی اجرای مجدد دستی برای هر دو لِین نصب‌کننده provider است. بخش `bundled-channels` به‌جای لِین سریالی همه‌چیزدر‌یکی `bundled-channel-deps`، لِین‌های تفکیک‌شده `bundled-channel-*` و `bundled-channel-update-*` را اجرا می‌کند.

OpenWebUI زمانی که پوشش کامل مسیر انتشار آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و فقط برای dispatchهای مخصوص OpenWebUI، یک بخش مستقل `openwebui` نگه می‌دارد. لِین‌های به‌روزرسانی bundled-channel برای شکست‌های گذرای شبکه npm یک بار دوباره تلاش می‌کنند.

هر بخش، `.artifacts/docker-tests/` را همراه با لاگ‌های لِین، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی فازها، JSON برنامه scheduler، جدول‌های لِین‌های کند، و فرمان‌های اجرای مجدد برای هر لِین بارگذاری می‌کند. ورودی `docker_lanes` در workflow، لِین‌های انتخاب‌شده را به‌جای کارهای بخش‌ها در برابر imageهای آماده‌شده اجرا می‌کند؛ این کار دیباگ لِین شکست‌خورده را به یک job هدفمند Docker محدود نگه می‌دارد و artifact بسته را برای آن اجرا آماده، دانلود، یا بازاستفاده می‌کند؛ اگر یک لِین انتخاب‌شده، لِین زنده Docker باشد، job هدفمند image تست زنده را برای آن اجرای مجدد به‌صورت محلی می‌سازد. فرمان‌های اجرای مجدد GitHub که برای هر لِین تولید می‌شوند، وقتی این مقادیر وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name` و ورودی‌های image آماده‌شده هستند، تا یک لِین شکست‌خورده بتواند از همان بسته و imageهای دقیق اجرای شکست‌خورده دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # دانلود artifactهای Docker و چاپ فرمان‌های اجرای مجدد هدفمند ترکیبی/برای هر لِین
pnpm test:docker:timings <summary>   # خلاصه‌های مسیر بحرانی لِین کند و فاز
```

workflow زمان‌بندی‌شده live/E2E هر روز مجموعه کامل Docker مسیر انتشار را اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته پرهزینه‌تری است، بنابراین یک workflow جداگانه است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. pull requestهای عادی، pushهای `main` و dispatchهای دستی مستقل CI آن مجموعه را خاموش نگه می‌دارند. این workflow تست‌های bundled plugin را میان هشت worker افزونه متوازن می‌کند؛ آن jobهای shard افزونه تا دو گروه تنظیمات Plugin را هم‌زمان با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin با import سنگین jobهای اضافی CI ایجاد نکنند.

## QA Lab

QA Lab لِین‌های اختصاصی CI بیرون از workflow اصلی با محدوده هوشمند دارد.

- workflow `Parity gate` روی تغییرات PR منطبق و dispatch دستی اجرا می‌شود؛ runtime خصوصی QA را می‌سازد و بسته‌های agentic شبیه‌سازی‌شده GPT-5.5 و Opus 4.6 را مقایسه می‌کند.
- workflow `QA-Lab - All Lanes` هر شب روی `main` و با dispatch دستی اجرا می‌شود؛ mock parity gate، لِین زنده Matrix، و لِین‌های زنده Telegram و Discord را به‌صورت jobهای موازی fan out می‌کند. jobهای زنده از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار لِین‌های transport زنده Matrix و Telegram را با provider شبیه‌سازی‌شده قطعی و مدل‌های واجد شرایط mock (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد channel از تأخیر مدل زنده و راه‌اندازی عادی provider-plugin جدا بماند. Gateway transport زنده جست‌وجوی memory را غیرفعال می‌کند، چون QA parity رفتار memory را جداگانه پوشش می‌دهد؛ اتصال provider توسط مجموعه‌های جداگانه مدل زنده، provider بومی و provider Docker پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند و فقط زمانی `--fail-fast` را اضافه می‌کند که CLI checkoutشده از آن پشتیبانی کند. مقدار پیش‌فرض CLI و ورودی دستی workflow همچنان `all` است؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep` و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین لِین‌های حیاتی انتشار QA Lab را پیش از تأیید انتشار اجرا می‌کند؛ parity gate مربوط به QA، بسته‌های candidate و baseline را به‌عنوان jobهای موازی لِین اجرا می‌کند، سپس هر دو artifact را در یک job گزارش کوچک دانلود می‌کند تا مقایسه نهایی parity انجام شود.

مسیر landing مربوط به PR را پشت `Parity gate` قرار ندهید، مگر اینکه تغییر واقعاً runtime مربوط به QA، parity بسته مدل، یا سطحی را که workflow parity مالک آن است لمس کند. برای اصلاحات عادی channel، تنظیمات، مستندات، یا unit-test، آن را به‌عنوان سیگنال اختیاری در نظر بگیرید و به‌جای آن شواهد محدوده‌دار CI/check را دنبال کنید.

## CodeQL

workflow `CodeQL` عمداً یک scanner امنیتی باریک و مرحله اول است، نه sweep کامل repository. اجراهای روزانه، دستی و guard مربوط به pull requestهای غیر draft، کد workflowهای Actions به‌علاوه پرریسک‌ترین سطح‌های JavaScript/TypeScript را با queryهای امنیتی با اطمینان بالا که به `security-severity` بالا/بحرانی فیلتر شده‌اند scan می‌کنند.

guard مربوط به pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages` یا `src` شروع می‌شود، و همان ماتریس امنیتی با اطمینان بالا را مثل workflow زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS خارج از پیش‌فرض‌های PR می‌مانند.

### دسته‌بندی‌های امنیتی

| دسته‌بندی                                         | سطح                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth، secrets، sandbox، cron و baseline مربوط به Gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی channel هسته به‌علاوه runtime مربوط به channel plugin، Gateway، Plugin SDK، secrets و نقاط تماس audit           |
| `/codeql-security-high/network-ssrf-boundary`     | سطح‌های SSRF هسته، parsing آدرس IP، network guard، web-fetch و سیاست SSRF در Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | serverهای MCP، helperهای اجرای process، outbound delivery و gateهای اجرای ابزار agent                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | سطح‌های اعتماد مربوط به نصب Plugin، loader، manifest، registry، staging وابستگی runtime، source-loading و قرارداد بسته Plugin SDK      |

### shardهای امنیتی مخصوص پلتفرم

- `CodeQL Android Critical Security` — shard زمان‌بندی‌شده امنیت Android. برنامه Android را برای CodeQL روی کوچک‌ترین runner لینوکسی Blacksmith که workflow sanity می‌پذیرد به‌صورت دستی می‌سازد. زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — shard امنیت macOS هفتگی/دستی. برنامه macOS را برای CodeQL روی Blacksmith macOS به‌صورت دستی می‌سازد، نتایج build وابستگی را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده است، چون build مربوط به macOS حتی وقتی پاک باشد بر زمان اجرا غالب است.

### دسته‌بندی‌های کیفیت بحرانی

`CodeQL Critical Quality` shard غیرامنیتی متناظر است. فقط queryهای کیفیت JavaScript/TypeScript با severity خطا و غیرامنیتی را روی سطح‌های باریک و باارزش بالا در runner کوچک‌تر لینوکسی Blacksmith اجرا می‌کند. guard مربوط به pull request آن عمداً از پروفایل زمان‌بندی‌شده کوچک‌تر است: PRهای غیر draft فقط shardهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract` و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای command/model/tool مربوط به agent و dispatch پاسخ، کد schema/migration/IO تنظیمات، کد auth/secrets/sandbox/security، channel هسته و runtime مربوط به bundled channel plugin، protocol/server-method مربوط به Gateway، چسب runtime/SDK مربوط به memory، MCP/process/outbound delivery، runtime/catalog مدل مربوط به provider، صف‌های diagnostics/delivery مربوط به session، loader مربوط به Plugin، قرارداد Plugin SDK/package، یا runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات تنظیمات CodeQL و workflow کیفیت، همه دوازده shard کیفیت PR را اجرا می‌کنند.

dispatch دستی این موارد را می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های باریک hookهای آموزش/iteration برای اجرای یک shard کیفیت به‌صورت جداگانه هستند.

| دسته                                                | سطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، اسرار، سندباکس، Cron، و Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | قراردادهای شِما، مهاجرت، نرمال‌سازی، و ورودی/خروجی پیکربندی                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | شِماهای پروتکل Gateway و قراردادهای متدهای سرور                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال بسته‌بندی‌شده                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | قراردادهای زمان اجرای اجرای فرمان، توزیع مدل/ارائه‌دهنده، توزیع و صف‌های پاسخ خودکار، و صفحه کنترل ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، ابزارهای کمکی نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، نماهای زمان اجرای حافظه، نام‌های مستعار SDK حافظه Plugin، چسب اتصال فعال‌سازی زمان اجرای حافظه، و فرمان‌های doctor حافظه                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | بخش‌های داخلی صف پاسخ، صف‌های تحویل نشست، ابزارهای کمکی اتصال/تحویل نشست خروجی، سطوح بسته رویداد/لاگ تشخیصی، و قراردادهای CLI doctor نشست |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توزیع پاسخ ورودی SDK Plugin، ابزارهای کمکی payload/قطعه‌بندی/زمان اجرای پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و ابزارهای کمکی اتصال نشست/رشته             |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و کشف ارائه‌دهنده، ثبت زمان اجرای ارائه‌دهنده، پیش‌فرض‌ها/کاتالوگ‌های ارائه‌دهنده، و رجیستری‌های وب/جست‌وجو/واکشی/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | راه‌اندازی رابط کاربری کنترل، ماندگاری محلی، جریان‌های کنترل Gateway، و قراردادهای زمان اجرای صفحه کنترل کار                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای زمان اجرای واکشی/جست‌وجوی وب هسته، ورودی/خروجی رسانه، فهم رسانه، تولید تصویر، و تولید رسانه                                                    |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای لودر، رجیستری، سطح عمومی، و نقطه ورود SDK Plugin                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع SDK Plugin سمت بسته منتشرشده و ابزارهای کمکی قرارداد بسته Plugin                                                                                      |

کیفیت جدا از امنیت می‌ماند تا یافته‌های کیفیت بتوانند بدون مبهم کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و Pluginهای بسته‌بندی‌شده فقط پس از پایدار شدن زمان اجرا و سیگنال پروفایل‌های محدود، باید دوباره به‌عنوان کار پیگیری محدوده‌بندی‌شده یا شاردشده اضافه شود.

## گردش‌کارهای نگهداری

### Docs Agent

گردش‌کار `Docs Agent` یک مسیر نگهداری رویدادمحور Codex برای همسو نگه داشتن مستندات موجود با تغییرات تازه لندشده است. برنامه زمان‌بندی خالص ندارد: یک اجرای CI موفق push غیرربات روی `main` می‌تواند آن را فعال کند، و dispatch دستی می‌تواند آن را مستقیما اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلو رفته باشد یا وقتی اجرای Docs Agent غیرپرش‌شده دیگری در ساعت گذشته ایجاد شده باشد، رد می‌شوند. وقتی اجرا می‌شود، بازه commit از SHA منبع Docs Agent غیرپرش‌شده قبلی تا `main` فعلی را بررسی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### Test Performance Agent

گردش‌کار `Test Performance Agent` یک مسیر نگهداری رویدادمحور Codex برای تست‌های کند است. برنامه زمان‌بندی خالص ندارد: یک اجرای CI موفق push غیرربات روی `main` می‌تواند آن را فعال کند، اما اگر فراخوانی workflow-run دیگری در آن روز UTC از قبل اجرا شده باشد یا در حال اجرا باشد، رد می‌شود. dispatch دستی این گیت فعالیت روزانه را دور می‌زند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای کل مجموعه می‌سازد، به Codex اجازه می‌دهد به‌جای بازآرایی‌های گسترده فقط اصلاحات کوچک عملکرد تست را با حفظ پوشش انجام دهد، سپس گزارش کل مجموعه را دوباره اجرا می‌کند و تغییراتی را که تعداد تست‌های پاس‌شده baseline را کاهش دهند رد می‌کند. اگر baseline تست‌های ناموفق داشته باشد، Codex فقط می‌تواند شکست‌های واضح را اصلاح کند و گزارش کل مجموعه پس از عامل باید قبل از commit شدن هر چیزی پاس شود. وقتی `main` پیش از لند شدن push ربات جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را دوباره تلاش می‌کند؛ patchهای کهنه متعارض رد می‌شوند. از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا اکشن Codex بتواند همان وضعیت ایمنی drop-sudo را مثل عامل مستندات حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی نگهدارنده برای پاک‌سازی تکراری‌ها پس از لند شدن است. به‌طور پیش‌فرض dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتا فهرست‌شده را می‌بندد. پیش از تغییر GitHub، تأیید می‌کند که PR لندشده merge شده است و هر مورد تکراری یا issue ارجاع‌شده مشترک دارد یا hunkهای تغییر یافته هم‌پوشان دارد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## گیت‌های بررسی محلی و مسیریابی تغییرات

منطق محلی مسیر تغییرات در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن گیت بررسی محلی نسبت به محدوده پلتفرم CI گسترده، درباره مرزهای معماری سخت‌گیرتر است:

- تغییرات تولید هسته، typecheck تولید هسته و تست هسته به‌علاوه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط تست هسته، فقط typecheck تست هسته به‌علاوه lint هسته را اجرا می‌کنند؛
- تغییرات تولید extension، typecheck تولید extension و تست extension به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات فقط تست extension، typecheck تست extension به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات SDK عمومی Plugin یا قرارداد plugin به typecheck extension گسترش می‌یابند چون extensionها به آن قراردادهای هسته وابسته‌اند (sweepهای Vitest برای extension همچنان کار تست صریح می‌مانند)؛
- افزایش نسخه فقط metadata انتشار، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی ریشه را اجرا می‌کند؛
- تغییرات ناشناخته ریشه/پیکربندی برای ایمنی به همه مسیرهای بررسی fail می‌شوند.

مسیریابی محلی تست‌های تغییرکرده در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش مستقیم تست‌ها خودشان را اجرا می‌کنند، ویرایش منبع نگاشت‌های صریح را ترجیح می‌دهد، سپس تست‌های هم‌سطح و وابسته‌های گراف import را. پیکربندی تحویل اتاق گروه مشترک یکی از نگاشت‌های صریح است: تغییرات در پیکربندی پاسخ قابل‌مشاهده گروه، حالت تحویل پاسخ منبع، یا prompt سیستمی ابزار پیام از مسیر تست‌های پاسخ هسته به‌علاوه regressionهای تحویل Discord و Slack عبور می‌کند تا تغییر پیش‌فرض مشترک پیش از نخستین push PR fail شود. فقط وقتی تغییر به‌اندازه‌ای در سطح harness گسترده است که مجموعه ارزان نگاشت‌شده proxy قابل‌اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Testbox را از ریشه repo اجرا کنید و برای اثبات گسترده، یک box تازه گرم‌شده را ترجیح دهید. پیش از صرف کردن یک گیت کند روی boxای که دوباره استفاده شده، منقضی شده، یا همین حالا sync غیرمنتظره بزرگی گزارش کرده است، ابتدا `pnpm testbox:sanity` را داخل box اجرا کنید.

وقتی فایل‌های ریشه لازم مانند `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` دست‌کم ۲۰۰ حذف tracked نشان دهد، بررسی sanity سریع fail می‌شود. این معمولا یعنی وضعیت sync ریموت کپی قابل‌اعتمادی از PR نیست؛ به‌جای debug کردن شکست تست محصول، آن box را متوقف کنید و یک box تازه گرم کنید. برای PRهای عمدی با حذف گسترده، برای آن اجرای sanity مقدار `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از sync در فاز sync بماند پایان می‌دهد. برای غیرفعال کردن آن guard مقدار `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرعادی بزرگ از مقدار بزرگ‌تر به میلی‌ثانیه استفاده کنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)

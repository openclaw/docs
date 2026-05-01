---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شد یا اجرا نشد
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگ‌سازی یک اجرای اعتبارسنجی انتشار یا اجرای مجدد آن هستید.
summary: گراف کار CI، دروازه‌های دامنه، چترهای انتشار، و معادل‌های فرمان‌های محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-05-01T11:42:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 679913539743f9495fffa010489ec95e05ce875751afa8a93bf8bf7045d6d9de
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. job `preflight` diff را دسته‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده باشند، laneهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمداً scope هوشمند را دور می‌زنند و کل graph را برای release candidateها و validation گسترده پخش می‌کنند. laneهای Android از طریق `include_android` همچنان opt-in می‌مانند. پوشش Plugin مخصوص release در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| Job                              | هدف                                                                                      | زمان اجرا                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط docs، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest CI      | همیشه روی pushها و PRهای غیردرفت |
| `security-scm-fast`              | تشخیص private key و audit workflow از طریق `zizmor`                                        | همیشه روی pushها و PRهای غیردرفت |
| `security-dependency-audit`      | audit lockfile تولیدی بدون dependency در برابر advisoryهای npm                             | همیشه روی pushها و PRهای غیردرفت |
| `security-fast`                  | aggregate الزامی برای jobهای امنیتی سریع                                                | همیشه روی pushها و PRهای غیردرفت |
| `check-dependencies`             | اجرای فقط dependency تولیدی Knip به‌همراه نگهبان allowlist فایل‌های استفاده‌نشده                    | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی‌های artifact ساخته‌شده، و artifactهای پایین‌دستی قابل استفاده مجدد          | تغییرات مرتبط با Node              |
| `checks-fast-core`               | laneهای صحت‌سنجی سریع Linux مانند بررسی‌های bundled/plugin-contract/protocol                 | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های sharded قرارداد channel با نتیجه aggregate check پایدار                         | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای تست Core Node، به‌جز laneهای channel، bundled، contract، و extension             | تغییرات مرتبط با Node              |
| `check`                          | معادل sharded دروازه محلی اصلی: typeهای prod، lint، guardها، typeهای test، و smoke سخت‌گیرانه   | تغییرات مرتبط با Node              |
| `check-additional`               | shardهای architecture، boundary، guardهای سطح extension، package-boundary، و gateway-watch | تغییرات مرتبط با Node              |
| `build-smoke`                    | تست‌های smoke برای CLI ساخته‌شده و smoke حافظه startup                                               | تغییرات مرتبط با Node              |
| `checks`                         | verifier برای تست‌های channel artifact ساخته‌شده                                                    | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | lane ساخت و smoke سازگاری Node 22                                                   | dispatch دستی CI برای releaseها    |
| `check-docs`                     | formatting، lint، و بررسی broken-link برای docs                                                | وقتی docs تغییر کرده باشد                       |
| `skills-python`                  | Ruff + pytest برای Skills پشتیبانی‌شده با Python                                                       | تغییرات مرتبط با Skillهای Python      |
| `checks-windows`                 | تست‌های process/path مخصوص Windows به‌همراه regressionهای import specifier runtime مشترک         | تغییرات مرتبط با Windows           |
| `macos-node`                     | lane تست TypeScript macOS با استفاده از artifactهای ساخته‌شده مشترک                                  | تغییرات مرتبط با macOS             |
| `macos-swift`                    | Swift lint، build، و تست‌ها برای اپ macOS                                               | تغییرات مرتبط با macOS             |
| `android`                        | تست‌های unit Android برای هر دو flavor به‌همراه یک ساخت debug APK                                 | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت trusted                                    | موفقیت CI اصلی یا dispatch دستی |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد که کدام laneها اصلاً وجود داشته باشند. منطق‌های `docs-scope` و `changed-scope` stepهایی داخل همین job هستند، نه jobهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و matrix پلتفرم سریع fail می‌شوند.
3. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان پایین‌دستی به‌محض آماده شدن build مشترک بتوانند شروع کنند.
4. laneهای سنگین‌تر پلتفرم و runtime بعد از آن پخش می‌شوند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref `main` وارد می‌شود، jobهای superseded را `cancelled` علامت بزند. این را noise مربوط به CI در نظر بگیرید، مگر اینکه جدیدترین run برای همان ref هم fail شده باشد. aggregate shard checkها از `!cancelled() && always()` استفاده می‌کنند تا همچنان شکست‌های عادی shard را گزارش کنند، اما بعد از اینکه کل workflow از قبل superseded شده است صف نشوند. کلید concurrency خودکار CI نسخه‌دار است (`CI-v7-*`) تا یک zombie سمت GitHub در یک queue group قدیمی نتواند runهای جدیدتر main را تا ابد block کند. runهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و runهای درحال اجرا را cancel نمی‌کنند.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با unit testهای `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest preflight طوری عمل کند که انگار همه areaهای scoped تغییر کرده‌اند.

- **ویرایش‌های workflow CI** graph مربوط به Node CI به‌همراه workflow linting را validation می‌کنند، اما به‌تنهایی buildهای native Windows، Android، یا macOS را force نمی‌کنند؛ آن laneهای پلتفرم scoped به تغییرات source پلتفرم باقی می‌مانند.
- **ویرایش‌های فقط routing مربوط به CI، ویرایش‌های منتخب ارزان fixtureهای core-test، و ویرایش‌های محدود helper/test-routing قرارداد Plugin** از یک مسیر manifest سریع فقط Node استفاده می‌کنند: `preflight`، security، و یک task `checks-fast-core`. وقتی change محدود به سطح‌های routing یا helper باشد که task سریع مستقیماً exercise می‌کند، آن مسیر build artifactها، سازگاری Node 22، قراردادهای channel، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی را skip می‌کند.
- **بررسی‌های Windows Node** به wrapperهای process/path مخصوص Windows، helperهای runner مربوط به npm/pnpm/UI، config package manager، و سطح‌های workflow مربوط به CI که آن lane را اجرا می‌کنند scoped هستند؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط test روی laneهای Linux Node باقی می‌مانند.

کندترین خانواده‌های تست Node split یا balance شده‌اند تا هر job بدون over-reserve کردن runnerها کوچک بماند: قراردادهای channel به‌صورت سه shard وزن‌دار اجرا می‌شوند، laneهای کوچک unit مربوط به core جفت می‌شوند، auto-reply به‌صورت چهار worker متعادل اجرا می‌شود (با subtree مربوط به reply که به shardهای agent-runner، dispatch، و commands/state-routing split شده است)، و configهای agentic مربوط به Gateway/Plugin به‌جای انتظار برای artifactهای ساخته‌شده، بین jobهای agentic Node موجود که فقط source هستند پخش می‌شوند. تست‌های گسترده browser، QA، media، و Pluginهای miscellaneous به‌جای catch-all مشترک Plugin از configهای اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern ورودی‌های timing را با استفاده از نام shard در CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک config کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کار compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و architecture مربوط به topology runtime را از پوشش gateway watch جدا می‌کند؛ shard guard مربوط به boundary، guardهای مستقل کوچک خود را هم‌زمان داخل یک job اجرا می‌کند. Gateway watch، تست‌های channel، و shard مربوط به core support-boundary بعد از اینکه `dist/` و `dist-runtime/` از قبل ساخته شدند، هم‌زمان داخل `build-artifacts` اجرا می‌شوند.

Android CI هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس Play debug APK را می‌سازد. flavor مربوط به third-party هیچ source set یا manifest جداگانه‌ای ندارد؛ lane unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، درحالی‌که از job بسته‌بندی debug APK تکراری روی هر push مرتبط با Android اجتناب می‌کند.

shard `check-dependencies` دستور `pnpm deadcode:dependencies` (یک اجرای Knip فقط dependency تولیدی که به آخرین نسخه Knip pin شده است، با minimum release age مربوط به pnpm که برای نصب `dlx` disabled شده است) و `pnpm deadcode:unused-files` را اجرا می‌کند؛ دومی یافته‌های فایل استفاده‌نشده تولیدی Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. نگهبان unused-file وقتی یک PR فایل استفاده‌نشده جدیدِ reviewنشده اضافه کند یا یک allowlist entry stale باقی بگذارد fail می‌شود، درحالی‌که سطح‌های dynamic Plugin، generated، build، live-test، و package bridge عمدی را که Knip نمی‌تواند به‌صورت statically resolve کند حفظ می‌کند.

## dispatchهای دستی

dispatchهای دستی CI همان job graph معمول CI را اجرا می‌کنند، اما هر lane scoped غیرAndroid را روشن force می‌کنند: shardهای Linux Node، shardهای bundled-plugin، قراردادهای channel، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های docs، Python skills، Windows، macOS، و i18n مربوط به Control UI. dispatchهای دستی standalone مربوط به CI فقط با `include_android=true`، Android را اجرا می‌کنند؛ چتر full release با پاس‌دادن `include_android=true`، Android را فعال می‌کند. بررسی‌های static مربوط به prerelease Plugin، shard فقط release با نام `agentic-plugins`، sweep کامل batch extension، و laneهای Docker مربوط به prerelease Plugin از CI excluded هستند. suite مربوط به Docker prerelease فقط زمانی اجرا می‌شود که `Full Release Validation`، workflow جداگانه `Plugin Prerelease` را با gate مربوط به release-validation فعال dispatch کند.

runهای دستی از یک concurrency group یکتا استفاده می‌کنند تا full suite مربوط به release-candidate توسط push یا PR run دیگری روی همان ref cancel نشود. input اختیاری `target_ref` به یک caller trusted اجازه می‌دهد آن graph را در برابر یک branch، tag، یا full commit SHA اجرا کند، درحالی‌که از فایل workflow مربوط به ref انتخاب‌شده برای dispatch استفاده می‌شود.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnerها

| اجراکننده                         | کارها                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، کارها و تجمیع‌های امنیتی سریع (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع پروتکل/قرارداد/باندل‌شده، بررسی‌های شاردشده قرارداد کانال، شاردهای `check` به‌جز lint، شاردها و تجمیع‌های `check-additional`، راستی‌آزمایی‌های تجمیعی تست Node، بررسی‌های مستندات، Skills پایتون، workflow-sanity، labeler، auto-response؛ پیش‌پرواز install-smoke نیز از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا ماتریس Blacksmith زودتر بتواند در صف قرار بگیرد |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، شاردهای سبک‌تر Plugin، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types`، و `check-test-types`                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، شاردهای تست Node روی Linux، شاردهای تست Pluginهای باندل‌شده، `android`                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (آن‌قدر به CPU حساس است که 8 vCPU بیش از مقداری که صرفه‌جویی می‌کرد هزینه داشت)؛ بیلدهای Docker مربوط به install-smoke (زمان صف 32-vCPU بیش از مقداری که صرفه‌جویی می‌کرد هزینه داشت)                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-latest` برمی‌گردند                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` روی `openclaw/openclaw`؛ forkها به `macos-latest` برمی‌گردند                                                                                                                                                                                                                                                                                                                                                                                            |

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

`Full Release Validation` گردش‌کار چتری دستی برای «اجرای همه‌چیز پیش از انتشار» است. یک شاخه، تگ، یا SHA کامل commit را می‌پذیرد، گردش‌کار دستی `CI` را با آن هدف اجرا می‌کند، `Plugin Prerelease` را برای اثبات مخصوص انتشار Plugin/بسته/استاتیک/Docker اجرا می‌کند، و `OpenClaw Release Checks` را برای دودسنجی نصب، پذیرش بسته، مجموعه‌های مسیر انتشار Docker، زنده/E2E، OpenWebUI، هم‌ارزی QA Lab، Matrix، و مسیرهای Telegram اجرا می‌کند. وقتی مشخصه بسته منتشرشده ارائه شود، می‌تواند گردش‌کار پس از انتشار `NPM Telegram Beta E2E` را نیز اجرا کند.

برای ماتریس مرحله‌ها، نام دقیق کارهای گردش‌کار، تفاوت‌های پروفایل، آرتیفکت‌ها، و دسته‌های اجرای دوباره متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`release_profile` گستره زنده/ارائه‌دهنده ارسال‌شده به بررسی‌های انتشار را کنترل می‌کند. گردش‌کارهای دستی انتشار به‌طور پیش‌فرض `stable` هستند؛ فقط زمانی از `full` استفاده کنید که عمدا ماتریس گسترده مشورتی ارائه‌دهنده/رسانه را می‌خواهید.

- `minimum` سریع‌ترین مسیرهای حیاتی انتشار OpenAI/هسته را نگه می‌دارد.
- `stable` مجموعه پایدار ارائه‌دهنده/بک‌اند را اضافه می‌کند.
- `full` ماتریس گسترده مشورتی ارائه‌دهنده/رسانه را اجرا می‌کند.

چتر، شناسه‌های اجرای فرزند dispatch‌شده را ثبت می‌کند، و کار نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین کارها را برای هر اجرای فرزند اضافه می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط کار راستی‌آزمای والد را دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای کاندید انتشار از `all`، فقط برای فرزند CI کامل معمولی از `ci`، فقط برای فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای دوباره یک جعبه انتشار ناموفق را پس از یک اصلاح متمرکز محدود نگه می‌دارد.

`OpenClaw Release Checks` از ref گردش‌کار مورد اعتماد استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به tarball `release-package-under-test` resolve کند، سپس آن آرتیفکت را هم به گردش‌کار Docker مسیر انتشار زنده/E2E و هم به شارد پذیرش بسته ارسال می‌کند. این کار بایت‌های بسته را در همه جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی مجدد همان کاندید در چند کار فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all` چتر قدیمی‌تر را منسوخ می‌کنند. وقتی والد لغو شود، پایشگر والد هر گردش‌کار فرزندی را که قبلا dispatch کرده لغو می‌کند، بنابراین اعتبارسنجی جدیدتر main پشت یک اجرای دو ساعته قدیمی release-check معطل نمی‌ماند. اعتبارسنجی شاخه/تگ انتشار و گروه‌های اجرای دوباره متمرکز، `cancel-in-progress: false` را نگه می‌دارند.

## شاردهای زنده و E2E

فرزند زنده/E2E انتشار پوشش گسترده بومی `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک کار سریالی، به‌صورت شاردهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

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
- شاردهای جداشده صوت/ویدیوی رسانه و شاردهای موسیقی provider-filtered

این کار همان پوشش فایل را حفظ می‌کند و در عین حال اجرای دوباره و عیب‌یابی شکست‌های کند ارائه‌دهنده زنده را آسان‌تر می‌سازد. نام شاردهای تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` برای اجرای دوباره دستی یک‌باره همچنان معتبر می‌مانند.

شاردهای رسانه زنده بومی در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط گردش‌کار `Live Media Runner Image` ساخته شده است. آن image، `ffmpeg` و `ffprobe` را از قبل نصب می‌کند؛ کارهای رسانه فقط پیش از setup وجود باینری‌ها را راستی‌آزمایی می‌کنند. مجموعه‌های زنده متکی بر Docker را روی اجراکننده‌های معمولی Blacksmith نگه دارید — کارهای کانتینری جای مناسبی برای اجرای تست‌های Docker تو‌در‌تو نیستند.

شاردهای مدل/بک‌اند زنده متکی بر Docker برای هر commit انتخاب‌شده از یک image مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. گردش‌کار زنده انتشار آن image را یک‌بار می‌سازد و push می‌کند، سپس شاردهای مدل زنده Docker، Gateway شاردشده بر اساس ارائه‌دهنده، بک‌اند CLI، bind مربوط به ACP، و harness مربوط به Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. شاردهای Docker مربوط به Gateway دارای سقف‌های صریح `timeout` در سطح اسکریپت، پایین‌تر از timeout کار گردش‌کار هستند تا یک کانتینر گیرکرده یا مسیر cleanup به‌جای مصرف کل بودجه release-check سریع شکست بخورد. اگر آن شاردها هدف Docker کامل منبع را مستقل دوباره بسازند، اجرای انتشار بد پیکربندی شده و زمان wall clock را برای بیلدهای تکراری image هدر خواهد داد.

## پذیرش بسته

وقتی پرسش این است که «آیا این بسته نصب‌پذیر OpenClaw به‌عنوان محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI معمولی متفاوت است: CI معمولی درخت منبع را اعتبارسنجی می‌کند، در حالی که پذیرش بسته یک tarball واحد را از طریق همان harness Docker E2E که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند اعتبارسنجی می‌کند.

### کارها

1. `resolve_package` مقدار `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` آپلود می‌کند، و منبع، workflow ref، package ref، نسخه، SHA-256، و profile را در خلاصه مرحله GitHub چاپ می‌کند.
2. `docker_acceptance` فایل `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. workflow قابل‌استفاده‌مجدد آن artifact را دانلود می‌کند، inventory فایل tarball را اعتبارسنجی می‌کند، در صورت نیاز imageهای Docker مربوط به package-digest را آماده می‌کند، و laneهای Docker انتخاب‌شده را به‌جای package کردن checkout مربوط به workflow، روی همان package اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب می‌کند، workflow قابل‌استفاده‌مجدد package و imageهای مشترک را یک‌بار آماده می‌کند، سپس آن laneها را به‌صورت jobهای هدفمند و موازی Docker با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و زمانی که Package Acceptance یکی را resolve کرده باشد، همان artifact با نام `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده npm را نصب کند.
4. اگر resolution بسته، Docker acceptance، یا lane اختیاری Telegram شکست بخورد، `summary` باعث شکست workflow می‌شود.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این گزینه برای acceptance نسخه‌های beta/stable منتشرشده استفاده کنید.
- `source=ref` یک branch، tag، یا SHA کامل commit قابل‌اعتماد در `package_ref` را package می‌کند. resolver branchها/tagهای OpenClaw را fetch می‌کند، بررسی می‌کند commit انتخاب‌شده از تاریخچه branch مخزن یا یک release tag قابل دسترسی باشد، dependencyها را در یک worktree detached نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` package می‌کند.
- `source=url` یک فایل HTTPS با پسوند `.tgz` را دانلود می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک فایل `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای artifactهایی که بیرونی به‌اشتراک گذاشته می‌شوند باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` همان کد workflow/harness قابل‌اعتمادی است که test را اجرا می‌کند. `package_ref` همان commit منبعی است که وقتی `source=ref` باشد package می‌شود. این کار به test harness فعلی اجازه می‌دهد commitهای منبع قدیمی‌تر و قابل‌اعتماد را بدون اجرای منطق workflow قدیمی اعتبارسنجی کند.

### Profileهای suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunkهای کامل مسیر انتشار Docker با OpenWebUI
- `custom` — `docker_lanes` دقیق؛ وقتی `suite_profile=custom` باشد الزامی است

profile مربوط به `package` از پوشش offline برای Plugin استفاده می‌کند تا validation بسته منتشرشده به در دسترس بودن live ClawHub وابسته نباشد. lane اختیاری Telegram از artifact با نام `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند و مسیر spec منتشرشده npm برای dispatchهای مستقل حفظ می‌شود.

Release checkها Package Acceptance را با `source=ref`، `package_ref=<release-ref>`، `workflow_ref=<release workflow ref>`، `suite_profile=custom`، `docker_lanes='bundled-channel-deps-compat plugins-offline'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. chunkهای Docker مسیر انتشار، laneهای هم‌پوشان package/update/plugin را پوشش می‌دهند؛ Package Acceptance اثبات artifact-native برای سازگاری bundled-channel، Plugin آفلاین، و Telegram را در برابر همان package tarball resolve‌شده نگه می‌دارد. Cross-OS release checkها همچنان onboarding، installer، و رفتار platform مختص OS را پوشش می‌دهند؛ validation محصول برای package/update باید با Package Acceptance شروع شود. lane مربوط به Docker با نام `published-upgrade-survivor` در هر اجرا یک baseline بسته منتشرشده را اعتبارسنجی می‌کند. در Package Acceptance، tarball resolve‌شده `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده fallback را انتخاب می‌کند که پیش‌فرض آن `openclaw@latest` است؛ دستورهای rerun برای laneهای شکست‌خورده آن baseline را حفظ می‌کنند. `published_upgrade_survivor_baselines=release-history` را تنظیم کنید تا lane روی یک ماتریس تاریخچه deduped گسترش یابد: شش انتشار stable آخر، `2026.4.23`، و آخرین انتشار stable پیش از `2026-03-15`. `published_upgrade_survivor_scenarios=reported-issues` را تنظیم کنید تا همان baselineها روی fixtureهای issue-shaped برای config/runtime-deps مربوط به Feishu، فایل‌های bootstrap/persona حفظ‌شده، مسیرهای log با tilde، و ریشه‌های runtime-deps نسخه‌دار stale گسترش یابند. اجراهای aggregate محلی می‌توانند specهای دقیق package را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` پاس بدهند، یک lane واحد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را برای ماتریس scenario تنظیم کنند. lane منتشرشده baseline را با یک دستور recipe آماده‌شده `openclaw config set` پیکربندی می‌کند، گام‌های recipe را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz`، به‌علاوه وضعیت RPC را probe می‌کند. laneهای fresh مربوط به package و installer ویندوز نیز بررسی می‌کنند که یک package نصب‌شده بتواند override مربوط به browser-control را از یک مسیر خام و مطلق ویندوز import کند. smoke مربوط به OpenAI cross-OS agent-turn وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد به‌صورت پیش‌فرض از آن استفاده می‌کند، وگرنه از `openai/gpt-5.4-mini` استفاده می‌کند، تا اثبات install و gateway سریع و deterministic بماند.

### پنجره‌های سازگاری legacy

Package Acceptance برای packageهای از پیش منتشرشده پنجره‌های محدود سازگاری legacy دارد. packageها تا `2026.4.25`، از جمله `2026.4.25-beta.*`، ممکن است از مسیر سازگاری استفاده کنند:

- entryهای QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌های حذف‌شده از tarball اشاره کنند؛
- وقتی package آن flag را expose نمی‌کند، `doctor-switch` ممکن است زیرحالت persistence مربوط به `gateway install --wrapper` را رد کند؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` جاافتاده را از fixture جعلی git مشتق‌شده از tarball prune کند و ممکن است `update.channel` persistشده جاافتاده را log کند؛
- smokeهای Plugin ممکن است locationهای legacy مربوط به install-record را بخوانند یا persistence جاافتاده install-record مربوط به marketplace را بپذیرند؛
- `plugin-update` ممکن است migration مربوط به config metadata را مجاز بداند درحالی‌که همچنان الزام می‌کند install record و رفتار no-reinstall بدون تغییر بمانند.

package منتشرشده `2026.4.26` نیز ممکن است برای فایل‌های stamp مربوط به metadata ساخت محلی که قبلا منتشر شده‌اند warning بدهد. packageهای بعدی باید contractهای مدرن را برآورده کنند؛ همان شرایط به‌جای warning یا skip باعث شکست می‌شوند.

### مثال‌ها

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

هنگام debug کردن یک اجرای ناموفق package acceptance، از خلاصه `resolve_package` شروع کنید تا منبع package، نسخه، و SHA-256 را تایید کنید. سپس اجرای فرزند `docker_acceptance` و artifactهای Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، logهای lane، timingهای phase، و دستورهای rerun. به‌جای اجرای دوباره validation کامل release، اجرای دوباره profile ناموفق package یا laneهای دقیق Docker را ترجیح دهید.

## Smoke نصب

workflow جداگانه `Install Smoke` از همان scope script از طریق job خودش با نام `preflight` دوباره استفاده می‌کند. این workflow پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که surfaceهای Docker/package، تغییرات package/manifest مربوط به Pluginهای bundled، یا surfaceهای core plugin/channel/gateway/Plugin SDK را لمس می‌کنند که jobهای Docker smoke آن‌ها را exercise می‌کنند. تغییرات source-only در Pluginهای bundled، ویرایش‌های test-only، و ویرایش‌های docs-only، workerهای Docker را reserve نمی‌کنند. مسیر سریع image مربوط به Dockerfile ریشه را یک‌بار build می‌کند، CLI را بررسی می‌کند، smoke مربوط به CLI برای حذف agents در shared-workspace را اجرا می‌کند، e2e مربوط به container gateway-network را اجرا می‌کند، یک build arg مربوط به extension bundled را verify می‌کند، و profile محدود Docker برای bundled-plugin را تحت timeout تجمیعی 240 ثانیه‌ای command اجرا می‌کند (اجرای Docker هر scenario جداگانه cap می‌شود).
- **مسیر کامل** پوشش نصب QR package و installer Docker/update را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، workflow-call release checkها، و pull requestهایی نگه می‌دارد که واقعا surfaceهای installer/package/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک image smoke مربوط به target-SHA GHCR و Dockerfile ریشه را آماده یا دوباره استفاده می‌کند، سپس نصب QR package، smokeهای Dockerfile/gateway ریشه، smokeهای installer/update، و Docker E2E سریع bundled-plugin را به‌صورت jobهای جداگانه اجرا می‌کند تا کار installer پشت smokeهای image ریشه منتظر نماند.

pushهای `main`، از جمله merge commitها، مسیر کامل را force نمی‌کنند؛ وقتی منطق changed-scope روی push پوشش کامل را درخواست کند، workflow همان Docker smoke سریع را نگه می‌دارد و install smoke کامل را به validation شبانه یا release واگذار می‌کند.

smoke کند مربوط به Bun global install image-provider جداگانه با `run_bun_global_install_smoke` gate می‌شود. این مورد در schedule شبانه و از workflow مربوط به release checkها اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. testهای QR و installer Docker، Dockerfileهای install-focused خودشان را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک image مشترک live-test را از قبل build می‌کند، OpenClaw را یک‌بار به‌صورت npm tarball package می‌کند، و دو image مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner خام Node/Git برای laneهای installer/update/plugin-dependency؛
- یک image functional که همان tarball را در `/app` برای laneهای عملکردی معمول نصب می‌کند.

تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` image هر lane را انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### قابل تنظیم‌ها

| متغیر                                 | پیش‌فرض | هدف                                                                                       |
| -------------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد اسلات‌های استخر اصلی برای مسیرهای معمولی.                                           |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد اسلات‌های استخر انتهایی حساس به ارائه‌دهنده.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف مسیرهای زنده هم‌زمان تا ارائه‌دهنده‌ها محدودسازی نکنند.                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف مسیرهای هم‌زمان نصب npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف مسیرهای هم‌زمان چندسرویسی.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع مسیرها برای جلوگیری از هجوم ساخت توسط دیمن Docker؛ برای نبود فاصله‌گذاری روی `0` تنظیم کنید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلت پشتیبان برای هر مسیر (۱۲۰ دقیقه)؛ مسیرهای زنده/انتهایی منتخب از سقف‌های محدودتر استفاده می‌کنند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | تنظیم‌نشده | `1` برنامه زمان‌بند را بدون اجرای مسیرها چاپ می‌کند.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | تنظیم‌نشده | فهرست دقیق مسیرها که با ویرگول جدا شده‌اند؛ smoke پاک‌سازی را رد می‌کند تا عامل‌ها بتوانند یک مسیر شکست‌خورده را بازتولید کنند. |

مسیری که از سقف مؤثر خود سنگین‌تر است همچنان می‌تواند از یک استخر خالی شروع شود، سپس تا زمانی که ظرفیت را آزاد کند به‌تنهایی اجرا می‌شود. تجمیع‌کننده محلی Docker را پیش‌بررسی می‌کند، کانتینرهای E2E قدیمی OpenClaw را حذف می‌کند، وضعیت مسیرهای فعال را منتشر می‌کند، زمان‌بندی مسیرها را برای ترتیب‌دهی از طولانی‌ترین به کوتاه‌ترین پایدار می‌کند، و به‌طور پیش‌فرض پس از نخستین شکست زمان‌بندی مسیرهای جدیدِ استخرشده را متوقف می‌کند.

### گردش‌کار زنده/E2E قابل استفاده مجدد

گردش‌کار زنده/E2E قابل استفاده مجدد از `scripts/test-docker-all.mjs --plan-json` می‌پرسد که کدام بسته، نوع تصویر، تصویر زنده، مسیر، و پوشش اعتبارنامه لازم است. سپس `scripts/docker-e2e.mjs` آن برنامه را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این گردش‌کار یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا artifact بسته مربوط به اجرای فعلی را دانلود می‌کند، یا artifact بسته را از `package_artifact_run_id` دانلود می‌کند؛ موجودی tarball را اعتبارسنجی می‌کند؛ وقتی برنامه به مسیرهای نصب‌شده از بسته نیاز دارد، تصویرهای bare/functional GHCR Docker E2E با تگ digest بسته را از طریق cache لایه Docker متعلق به Blacksmith می‌سازد و push می‌کند؛ و به‌جای بازسازی، ورودی‌های ارائه‌شده `docker_e2e_bare_image`/`docker_e2e_functional_image` یا تصویرهای موجود با digest بسته را دوباره استفاده می‌کند. pull کردن تصویرهای Docker با مهلت محدود ۱۸۰ ثانیه برای هر تلاش دوباره امتحان می‌شود تا جریان گیرکرده registry/cache به‌جای مصرف بیشتر مسیر بحرانی CI، سریع دوباره تلاش شود.

### قطعه‌های مسیر انتشار

پوشش Docker انتشار، jobهای قطعه‌بندی‌شده کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر قطعه فقط نوع تصویر مورد نیاز خود را pull کند و چندین مسیر را از طریق همان زمان‌بند وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

قطعه‌های فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، `plugins-runtime-install-a` تا `plugins-runtime-install-h`، `bundled-channels-core`، `bundled-channels-update-a`، `bundled-channels-update-discord`، `bundled-channels-update-b`، و `bundled-channels-contracts`. قطعه تجمیعی `bundled-channels` برای اجرای مجدد دستی یک‌باره همچنان در دسترس است، و `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` نیز aliasهای تجمیعی Plugin/runtime باقی می‌مانند. alias مسیر `install-e2e` برای هر دو مسیر نصب‌کننده ارائه‌دهنده، alias تجمیعی اجرای مجدد دستی باقی می‌ماند. قطعه `bundled-channels` به‌جای مسیر سریالی همه‌چیزدر-یک `bundled-channel-deps`، مسیرهای جداشده `bundled-channel-*` و `bundled-channel-update-*` را اجرا می‌کند.

OpenWebUI وقتی پوشش کامل مسیر انتشار آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و فقط برای dispatchهای مختص OpenWebUI یک قطعه مستقل `openwebui` نگه می‌دارد. مسیرهای به‌روزرسانی کانال‌های bundled برای شکست‌های گذرای شبکه npm یک بار دوباره تلاش می‌کنند.

هر قطعه `.artifacts/docker-tests/` را همراه با logهای مسیر، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی فازها، JSON برنامه زمان‌بند، جدول‌های مسیرهای کند، و فرمان‌های اجرای مجدد هر مسیر upload می‌کند. ورودی `docker_lanes` گردش‌کار، مسیرهای منتخب را به‌جای jobهای قطعه‌ای در برابر تصویرهای آماده‌شده اجرا می‌کند؛ این کار اشکال‌زدایی مسیر شکست‌خورده را به یک job هدفمند Docker محدود نگه می‌دارد و artifact بسته را برای آن اجرا آماده، دانلود، یا دوباره استفاده می‌کند؛ اگر یک مسیر منتخب مسیر زنده Docker باشد، job هدفمند تصویر آزمون زنده را برای آن اجرای مجدد به‌صورت محلی می‌سازد. فرمان‌های اجرای مجدد GitHub تولیدشده برای هر مسیر، وقتی این مقدارها وجود داشته باشند، `package_artifact_run_id`، `package_artifact_name`، و ورودی‌های تصویر آماده‌شده را شامل می‌شوند تا یک مسیر شکست‌خورده بتواند دقیقاً همان بسته و تصویرهای اجرای شکست‌خورده را دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

گردش‌کار زمان‌بندی‌شده زنده/E2E، مجموعه کامل Docker مسیر انتشار را روزانه اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته پرهزینه‌تری است، بنابراین یک گردش‌کار جداگانه است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. درخواست‌های pull معمولی، pushهای `main`، و dispatchهای CI دستی مستقل، آن مجموعه را غیرفعال نگه می‌دارند. این گردش‌کار آزمون‌های Pluginهای bundled را میان هشت worker افزونه متوازن می‌کند؛ آن jobهای shard افزونه تا دو گروه پیکربندی Plugin را هم‌زمان با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin با import سنگین jobهای CI اضافی ایجاد نکنند. مسیر پیش‌انتشار Docker مختص انتشار، مسیرهای هدفمند Docker را در گروه‌های کوچک batch می‌کند تا از رزرو ده‌ها runner برای jobهای یک تا سه دقیقه‌ای جلوگیری شود.

## QA Lab

QA Lab مسیرهای CI اختصاصی خارج از گردش‌کار اصلی با scope هوشمند دارد.

- گردش‌کار `Parity gate` روی تغییرات PR منطبق و dispatch دستی اجرا می‌شود؛ runtime خصوصی QA را می‌سازد و packهای عاملی mock GPT-5.5 و Opus 4.6 را مقایسه می‌کند.
- گردش‌کار `QA-Lab - All Lanes` هر شب روی `main` و روی dispatch دستی اجرا می‌شود؛ gate برابری mock، مسیر زنده Matrix، و مسیرهای زنده Telegram و Discord را به‌صورت jobهای موازی منشعب می‌کند. jobهای زنده از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار، مسیرهای انتقال زنده Matrix و Telegram را با ارائه‌دهنده mock قطعی و مدل‌های واجد شرایط mock (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد کانال از تأخیر مدل زنده و startup معمول Plugin ارائه‌دهنده جدا بماند. Gateway انتقال زنده، جست‌وجوی حافظه را غیرفعال می‌کند زیرا برابری QA رفتار حافظه را جداگانه پوشش می‌دهد؛ اتصال‌پذیری ارائه‌دهنده توسط مجموعه‌های جداگانه مدل زنده، ارائه‌دهنده بومی، و ارائه‌دهنده Docker پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند و فقط وقتی CLI checkout‌شده از آن پشتیبانی کند `--fail-fast` را اضافه می‌کند. پیش‌فرض CLI و ورودی گردش‌کار دستی همچنان `all` است؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین پیش از تأیید انتشار، مسیرهای حیاتی QA Lab برای انتشار را اجرا می‌کند؛ gate برابری QA آن packهای candidate و baseline را به‌صورت jobهای مسیر موازی اجرا می‌کند، سپس هر دو artifact را در یک job گزارش کوچک برای مقایسه نهایی برابری دانلود می‌کند.

مسیر landing PR را پشت `Parity gate` قرار ندهید مگر اینکه تغییر واقعاً runtime QA، برابری model-pack، یا سطحی را لمس کند که گردش‌کار برابری مالک آن است. برای اصلاحات معمول کانال، پیکربندی، مستندات، یا آزمون واحد، آن را سیگنال اختیاری بدانید و به‌جای آن از شواهد CI/check دارای scope پیروی کنید.

## CodeQL

گردش‌کار `CodeQL` عمداً یک اسکنر امنیتی مرحله اول و محدود است، نه sweep کامل مخزن. اجراهای نگهبان روزانه، دستی، و pull requestهای غیر draft، کد گردش‌کار Actions به‌علاوه پرریسک‌ترین سطوح JavaScript/TypeScript را با queryهای امنیتی با اطمینان بالا که به `security-severity` بالا/بحرانی فیلتر شده‌اند اسکن می‌کنند.

نگهبان pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود، و همان ماتریس امنیتی با اطمینان بالا را مانند گردش‌کار زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS خارج از پیش‌فرض‌های PR می‌ماند.

### دسته‌بندی‌های امنیتی

| دسته‌بندی                                        | سطح                                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | خط پایه auth، secrets، sandbox، cron، و gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال core به‌علاوه runtime Plugin کانال، Gateway، Plugin SDK، secrets، نقاط تماس audit                    |
| `/codeql-security-high/network-ssrf-boundary`     | سطح‌های سیاست SSRF مربوط به core SSRF، parsing آی‌پی، محافظ شبکه، web-fetch، و Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، helperهای اجرای process، تحویل outbound، و gateهای اجرای ابزار عامل                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | سطح‌های اعتماد مربوط به نصب Plugin، loader، manifest، registry، آماده‌سازی dependency runtime، source-loading، و قرارداد بسته Plugin SDK |

### shardهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — shard زمان‌بندی‌شده امنیت Android. برنامه Android را برای CodeQL به‌صورت دستی روی کوچک‌ترین runner لینوکسی Blacksmith که workflow sanity می‌پذیرد می‌سازد. زیر `/codeql-critical-security/android` upload می‌کند.
- `CodeQL macOS Critical Security` — shard امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL روی Blacksmith macOS به‌صورت دستی می‌سازد، نتایج build وابستگی‌ها را از SARIF آپلودشده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` upload می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده است زیرا build macOS حتی در حالت پاک، زمان اجرا را غالب می‌کند.

### دسته‌بندی‌های کیفیت بحرانی

`CodeQL Critical Quality` shard غیرامنیتی متناظر است. این گردش‌کار فقط queryهای کیفیت JavaScript/TypeScript با شدت error و غیرامنیتی را روی سطح‌های محدود و پرارزش در runner لینوکسی کوچک‌تر Blacksmith اجرا می‌کند. نگهبان pull request آن عمداً از پروفایل زمان‌بندی‌شده کوچک‌تر است: PRهای غیر draft فقط shardهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای فرمان/مدل/ابزار عامل و dispatch پاسخ، کد schema/migration/IO پیکربندی، کد auth/secrets/sandbox/security، runtime کانال core و Plugin کانال bundled، protocol/server-method مربوط به Gateway، runtime حافظه/چسب SDK، MCP/process/تحویل outbound، runtime ارائه‌دهنده/catalog مدل، diagnostics نشست/صف‌های تحویل، loader Plugin، قرارداد Plugin SDK/package، یا runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت، هر دوازده shard کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های محدود، قلاب‌های آموزش/تکرار برای اجرای یک بخش کیفیت به‌صورت جداگانه هستند.

| دسته‌بندی                                               | سطح                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرزی امنیتی احراز هویت، رازها، sandbox، Cron و Gateway                                                                                                        |
| `/codeql-critical-quality/config-boundary`              | قراردادهای طرح‌واره پیکربندی، مهاجرت، نرمال‌سازی و IO                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`     | طرح‌واره‌های پروتکل Gateway و قراردادهای متد سرور                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای کانال core و پیاده‌سازی Plugin کانال‌های بسته‌بندی‌شده                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای فرمان، توزیع model/provider، توزیع و صف‌های auto-reply، و قراردادهای runtime سطح کنترل ACP                                                                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، کمک‌کننده‌های نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                             |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK، پوسته‌های memory runtime، نام‌های مستعار memory Plugin SDK، چسب فعال‌سازی memory runtime، و فرمان‌های memory doctor                            |
| `/codeql-critical-quality/session-diagnostics-boundary` | بخش‌های داخلی صف پاسخ، صف‌های تحویل نشست، کمک‌کننده‌های اتصال/تحویل نشست خروجی، سطح‌های رویداد تشخیصی/بسته لاگ، و قراردادهای CLI مربوط به session doctor       |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توزیع پاسخ ورودی Plugin SDK، کمک‌کننده‌های reply payload/chunking/runtime، گزینه‌های پاسخ کانال، صف‌های تحویل، و کمک‌کننده‌های اتصال نشست/رشته                  |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و کشف provider، ثبت provider runtime، پیش‌فرض‌ها/کاتالوگ‌های provider، و رجیستری‌های web/search/fetch/embedding              |
| `/codeql-critical-quality/ui-control-plane`             | راه‌اندازی Control UI، ماندگاری محلی، جریان‌های کنترل Gateway، و قراردادهای runtime سطح کنترل وظیفه                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای runtime مربوط به fetch/search وب core، media IO، درک رسانه، image-generation و media-generation                                                       |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، public-surface و نقطه ورود Plugin SDK                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع منتشرشده سمت بسته برای Plugin SDK و کمک‌کننده‌های قرارداد بسته Plugin                                                                                       |

کیفیت جدا از امنیت می‌ماند تا یافته‌های کیفیت بتوانند بدون مبهم کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال یا گسترش داده شوند. گسترش CodeQL برای Swift، Python و Pluginهای بسته‌بندی‌شده باید فقط پس از پایدار شدن runtime و سیگنال پروفایل‌های محدود، به‌عنوان کار پیگیری scoped یا sharded دوباره اضافه شود.

## گردش‌کارهای نگهداری

### Docs Agent

گردش‌کار `Docs Agent` یک مسیر نگهداری رویدادمحور Codex برای همسو نگه داشتن مستندات موجود با تغییراتی است که اخیرا ادغام شده‌اند. زمان‌بندی خالص ندارد: یک اجرای موفق CI مربوط به push غیر bot روی `main` می‌تواند آن را فعال کند، و manual dispatch می‌تواند آن را مستقیم اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلوتر رفته باشد یا وقتی در یک ساعت گذشته اجرای non-skipped دیگری از Docs Agent ساخته شده باشد، رد می‌شوند. هنگام اجرا، بازه commit از SHA منبع قبلی Docs Agent که non-skipped بوده تا `main` فعلی را بررسی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### Test Performance Agent

گردش‌کار `Test Performance Agent` یک مسیر نگهداری رویدادمحور Codex برای تست‌های کند است. زمان‌بندی خالص ندارد: یک اجرای موفق CI مربوط به push غیر bot روی `main` می‌تواند آن را فعال کند، اما اگر فراخوانی workflow-run دیگری در همان روز UTC قبلا اجرا شده یا در حال اجرا باشد، رد می‌شود. Manual dispatch این گیت فعالیت روزانه را دور می‌زند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای کل مجموعه می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک عملکرد تست را که پوشش را حفظ می‌کنند انجام دهد، نه refactorهای گسترده، سپس گزارش کل مجموعه را دوباره اجرا می‌کند و تغییراتی را که شمار تست‌های موفق baseline را کاهش دهند رد می‌کند. اگر baseline تست‌های ناموفق داشته باشد، Codex فقط می‌تواند شکست‌های واضح را رفع کند و گزارش کل مجموعه پس از agent باید قبل از commit هر چیزی موفق شود. وقتی `main` قبل از رسیدن push بات جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند و push را دوباره تلاش می‌کند؛ patchهای قدیمی متعارض رد می‌شوند. از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا اکشن Codex بتواند همان وضعیت ایمنی drop-sudo را مانند docs agent حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای پاک‌سازی تکراری‌ها پس از land است. پیش‌فرض آن dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتا فهرست‌شده را می‌بندد. پیش از تغییر دادن GitHub، بررسی می‌کند که PR ادغام‌شده merge شده باشد و هر تکراری یا issue ارجاعی مشترک داشته باشد یا hunkهای تغییر‌یافته همپوشان داشته باشد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## گیت‌های بررسی محلی و مسیریابی تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. این گیت بررسی محلی درباره مرزهای معماری سخت‌گیرتر از دامنه گسترده پلتفرم CI است:

- تغییرات تولید core، typecheck تولید core و تست core به‌همراه lint/guardهای core را اجرا می‌کنند؛
- تغییرات فقط تست core، فقط typecheck تست core به‌همراه lint core را اجرا می‌کنند؛
- تغییرات تولید extension، typecheck تولید extension و تست extension به‌همراه lint extension را اجرا می‌کنند؛
- تغییرات فقط تست extension، typecheck تست extension به‌همراه lint extension را اجرا می‌کنند؛
- تغییرات public Plugin SDK یا plugin-contract به typecheck extension گسترش می‌یابند، چون extensionها به آن قراردادهای core وابسته‌اند (جاروب‌های Vitest extension کار تست صریح باقی می‌مانند)؛
- افزایش‌های نسخه فقط metadata انتشار، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کنند؛
- تغییرات ناشناخته root/config برای ایمنی به همه مسیرهای بررسی fail می‌شوند.

مسیریابی changed-test محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش‌های مستقیم تست خودشان را اجرا می‌کنند، ویرایش‌های source نگاشت‌های صریح را ترجیح می‌دهند، سپس تست‌های sibling و وابسته‌های import-graph را. پیکربندی تحویل shared group-room یکی از نگاشت‌های صریح است: تغییرات در پیکربندی visible-reply گروه، حالت تحویل پاسخ source، یا مسیر system prompt ابزار پیام از طریق تست‌های پاسخ core به‌همراه regressionهای تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین push PR شکست بخورد. فقط وقتی تغییر آن‌قدر harness-wide است که مجموعه نگاشت‌شده ارزان نماینده قابل اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Testbox را از root repo اجرا کنید و برای اثبات گسترده یک box تازه warmed را ترجیح دهید. پیش از صرف یک گیت کند روی boxای که reused، expired شده یا به‌تازگی sync غیرمنتظره بزرگی گزارش کرده، ابتدا `pnpm testbox:sanity` را داخل box اجرا کنید.

بررسی sanity وقتی فایل‌های root لازم مانند `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` حداقل ۲۰۰ حذف tracked نشان دهد، سریع شکست می‌خورد. این معمولا یعنی وضعیت sync remote یک کپی قابل اعتماد از PR نیست؛ به‌جای debug کردن شکست تست محصول، آن box را متوقف کنید و یک box تازه warm کنید. برای PRهای large-deletion عمدی، برای همان اجرای sanity مقدار `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی post-sync در مرحله sync بماند، پایان می‌دهد. برای غیرفعال کردن این guard مقدار `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرعادی بزرگ از مقدار بزرگ‌تر بر حسب میلی‌ثانیه استفاده کنید.

Crabbox مسیر دوم remote-box متعلق به repo برای اثبات Linux است، زمانی که Blacksmith در دسترس نیست یا ظرفیت cloud متعلق به خود پروژه ترجیح داده می‌شود. یک box را warm کنید، آن را از طریق project workflow hydrate کنید، سپس فرمان‌ها را از طریق Crabbox CLI اجرا کنید:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` پیش‌فرض‌های provider، sync و hydration مربوط به GitHub Actions را مالکیت می‌کند. این فایل `.git` محلی را مستثنی می‌کند تا checkout مربوط به Actions که hydrate شده، metadata ریموت Git خودش را به‌جای sync کردن remotes و object stores محلی maintainer نگه دارد، و artifactهای runtime/build محلی را که هرگز نباید منتقل شوند مستثنی می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، fetch مربوط به `origin/main`، و handoff محیط non-secret است که فرمان‌های بعدی `crabbox run --id <cbx_id>` آن را source می‌کنند.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)

---
read_when:
    - باید بفهمید چرا یک وظیفه CI اجرا شد یا نشد
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگ‌کردن اجرای اعتبارسنجی انتشار یا اجرای مجدد آن هستید
    - شما در حال تغییر ارسال ClawSweeper یا بازارسال فعالیت GitHub هستید
summary: گراف کارهای یکپارچه‌سازی مداوم، گیت‌های محدوده، چترهای انتشار، و معادل‌های فرمان محلی
title: پایپ‌لاین CI
x-i18n:
    generated_at: "2026-05-02T11:38:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39af4afcb3e7c847c44a9d47513ac4b99c62d13fb139ece0bee979f24687ea38
    source_path: ci.md
    workflow: 16
---

یکپارچه‌سازی مداوم OpenClaw روی هر push به `main` و هر pull request اجرا می‌شود. کار `preflight` diff را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده باشند، مسیرهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمدا محدوده‌بندی هوشمند را دور می‌زنند و برای نامزدهای انتشار و اعتبارسنجی گسترده، کل گراف را گسترش می‌دهند. مسیرهای Android از طریق `include_android` اختیاری باقی می‌مانند. پوشش Plugin مخصوص انتشار در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک ارسال دستی صریح اجرا می‌شود.

## نمای کلی Pipeline

| کار                              | هدف                                                                                      | زمان اجرا                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | تشخیص تغییرات فقط مستندات، محدوده‌های تغییرکرده، extensionهای تغییرکرده، و ساخت مانیفست یکپارچه‌سازی مداوم      | همیشه روی pushها و PRهای غیر draft |
| `security-scm-fast`              | تشخیص کلید خصوصی و audit workflow از طریق `zizmor`                                        | همیشه روی pushها و PRهای غیر draft |
| `security-dependency-audit`      | audit lockfile تولیدی بدون وابستگی در برابر advisoryهای npm                             | همیشه روی pushها و PRهای غیر draft |
| `security-fast`                  | تجمیع موردنیاز برای کارهای امنیتی سریع                                                | همیشه روی pushها و PRهای غیر draft |
| `check-dependencies`             | گذر dependency-only تولیدی Knip به‌همراه محافظ allowlist فایل‌های استفاده‌نشده                    | تغییرات مرتبط با Node              |
| `build-artifacts`                | ساخت `dist/`، Control UI، بررسی‌های artifact ساخته‌شده، و artifactهای پایین‌دستی قابل استفاده‌مجدد          | تغییرات مرتبط با Node              |
| `checks-fast-core`               | مسیرهای صحت‌سنجی سریع Linux مانند بررسی‌های bundled/plugin-contract/protocol                 | تغییرات مرتبط با Node              |
| `checks-fast-contracts-channels` | بررسی‌های sharded contract کانال با نتیجه بررسی تجمیعی پایدار                         | تغییرات مرتبط با Node              |
| `checks-node-core-test`          | shardهای تست Node هسته، به‌جز مسیرهای کانال، bundled، contract، و extension             | تغییرات مرتبط با Node              |
| `check`                          | معادل sharded دروازه محلی اصلی: typeهای تولیدی، lint، guardها، typeهای تست، و smoke سخت‌گیرانه   | تغییرات مرتبط با Node              |
| `check-additional`               | shardهای معماری، boundary، guardهای سطح extension، package-boundary، و gateway-watch | تغییرات مرتبط با Node              |
| `build-smoke`                    | تست‌های smoke برای CLI ساخته‌شده و smoke حافظه شروع به کار                                               | تغییرات مرتبط با Node              |
| `checks`                         | تأییدکننده تست‌های کانال artifact ساخته‌شده                                                    | تغییرات مرتبط با Node              |
| `checks-node-compat-node22`      | مسیر build و smoke سازگاری Node 22                                                   | ارسال دستی یکپارچه‌سازی مداوم برای انتشارها    |
| `check-docs`                     | قالب‌بندی مستندات، lint، و بررسی لینک‌های شکسته                                                | مستندات تغییر کرده‌اند                       |
| `skills-python`                  | Ruff + pytest برای skills پشتیبانی‌شده با Python                                                       | تغییرات مرتبط با skillهای Python      |
| `checks-windows`                 | تست‌های مخصوص Windows برای process/path به‌همراه regressionهای مشترک specifier import زمان اجرا         | تغییرات مرتبط با Windows           |
| `macos-node`                     | مسیر تست TypeScript در macOS با استفاده از artifactهای ساخته‌شده مشترک                                  | تغییرات مرتبط با macOS             |
| `macos-swift`                    | lint، build، و تست‌های Swift برای برنامه macOS                                               | تغییرات مرتبط با macOS             |
| `android`                        | تست‌های unit Android برای هر دو flavor به‌همراه ساخت یک debug APK                                 | تغییرات مرتبط با Android           |
| `test-performance-agent`         | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت معتمد                                    | موفقیت یکپارچه‌سازی مداوم main یا ارسال دستی |

## ترتیب fail-fast

1. `preflight` تصمیم می‌گیرد کدام مسیرها اساسا وجود داشته باشند. منطق‌های `docs-scope` و `changed-scope` مرحله‌هایی داخل همین کار هستند، نه کارهای مستقل.
2. `security-scm-fast`، `security-dependency-audit`، `security-fast`، `check`، `check-additional`، `check-docs`، و `skills-python` بدون انتظار برای کارهای سنگین‌تر artifact و ماتریس پلتفرم، سریع شکست می‌خورند.
3. `build-artifacts` با مسیرهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان پایین‌دستی به‌محض آماده شدن build مشترک شروع کنند.
4. مسیرهای سنگین‌تر پلتفرم و زمان اجرا پس از آن گسترش می‌یابند: `checks-fast-core`، `checks-fast-contracts-channels`، `checks-node-core-test`، `checks`، `checks-windows`، `macos-node`، `macos-swift`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref `main` وارد می‌شود، کارهای جایگزین‌شده را به‌صورت `cancelled` علامت‌گذاری کند. این را نویز یکپارچه‌سازی مداوم در نظر بگیرید مگر اینکه جدیدترین اجرا برای همان ref نیز در حال شکست باشد. بررسی‌های shard تجمیعی از `!cancelled() && always()` استفاده می‌کنند تا همچنان شکست‌های عادی shard را گزارش کنند، اما پس از اینکه کل workflow از قبل جایگزین شده است در صف قرار نگیرند. کلید هم‌زمانی خودکار یکپارچه‌سازی مداوم نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در یک گروه صف قدیمی نتواند اجراهای جدیدتر main را برای مدت نامحدود مسدود کند. اجراهای دستی مجموعه کامل از `CI-manual-v1-*` استفاده می‌کنند و اجراهای درحال‌انجام را cancel نمی‌کنند.

## محدوده و مسیریابی

منطق محدوده در `scripts/ci-changed-scope.mjs` قرار دارد و با unit testهای `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. ارسال دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود مانیفست preflight طوری عمل کند که انگار هر بخش محدوده‌دار تغییر کرده است.

- **ویرایش‌های workflow یکپارچه‌سازی مداوم** گراف یکپارچه‌سازی مداوم Node را به‌همراه lint کردن workflow اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native Windows، Android، یا macOS را اجبار نمی‌کنند؛ آن مسیرهای پلتفرم به تغییرات source پلتفرم محدود می‌مانند.
- **ویرایش‌های فقط مسیریابی یکپارچه‌سازی مداوم، ویرایش‌های منتخب ارزان fixtureهای core-test، و ویرایش‌های محدود helper/test-routing قرارداد Plugin** از یک مسیر مانیفست سریع فقط Node استفاده می‌کنند: `preflight`، امنیت، و یک task واحد `checks-fast-core`. وقتی تغییر به سطح‌های مسیریابی یا helper که task سریع مستقیما تمرین می‌کند محدود باشد، آن مسیر artifactهای build، سازگاری Node 22، contractهای کانال، shardهای کامل هسته، shardهای bundled-plugin، و ماتریس‌های guard اضافی را رد می‌کند.
- **بررسی‌های Windows Node** به wrapperهای process/path مخصوص Windows، helperهای runner برای npm/pnpm/UI، پیکربندی package manager، و سطح‌های workflow یکپارچه‌سازی مداوم که آن مسیر را اجرا می‌کنند محدود هستند؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط تست روی مسیرهای Linux Node باقی می‌مانند.

کندترین خانواده‌های تست Node split یا balanced شده‌اند تا هر کار بدون over-reserve کردن runnerها کوچک بماند: contractهای کانال به‌صورت سه shard وزن‌دار اجرا می‌شوند، مسیرهای unit کوچک هسته جفت شده‌اند، auto-reply به‌صورت چهار worker متوازن اجرا می‌شود (با subtree پاسخ که به shardهای agent-runner، dispatch، و commands/state-routing split شده است)، و پیکربندی‌های agentic gateway/plugin به‌جای انتظار برای artifactهای ساخته‌شده، میان کارهای موجود agentic Node فقط source پخش شده‌اند. تست‌های گسترده browser، QA، media، و Pluginهای متفرقه به‌جای catch-all مشترک Plugin از پیکربندی‌های اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern ورودی‌های timing را با استفاده از نام shard یکپارچه‌سازی مداوم ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک پیکربندی کامل را از یک shard فیلترشده تشخیص دهد. `check-additional` کار compile/canary مربوط به package-boundary را کنار هم نگه می‌دارد و معماری topology زمان اجرا را از پوشش gateway watch جدا می‌کند؛ shard محافظ boundary محافظ‌های کوچک مستقل خود را هم‌زمان داخل یک کار اجرا می‌کند. Gateway watch، تست‌های کانال، و shard support-boundary هسته پس از اینکه `dist/` و `dist-runtime/` از قبل ساخته شدند، هم‌زمان داخل `build-artifacts` اجرا می‌شوند.

یکپارچه‌سازی مداوم Android هر دو `testPlayDebugUnitTest` و `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس Play debug APK را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه ندارد؛ مسیر unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، درحالی‌که از job تکراری packaging برای debug APK در هر push مرتبط با Android جلوگیری می‌کند.

shard `check-dependencies` دستور `pnpm deadcode:dependencies` (یک گذر production Knip dependency-only که به آخرین نسخه Knip pin شده است، با حداقل سن انتشار pnpm که برای install از `dlx` غیرفعال شده) و `pnpm deadcode:unused-files` را اجرا می‌کند، که یافته‌های فایل استفاده‌نشده تولیدی Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. محافظ فایل استفاده‌نشده وقتی یک PR فایل استفاده‌نشده جدید و بررسی‌نشده‌ای اضافه کند یا entry قدیمی allowlist را باقی بگذارد شکست می‌خورد، درحالی‌که سطح‌های عمدی dynamic plugin، generated، build، live-test، و package bridge را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## ارسال فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت مقصد از فعالیت repository در OpenClaw به ClawSweeper است. این workflow کد pull request نامطمئن را checkout یا اجرا نمی‌کند. workflow یک token مربوط به GitHub App را از `CLAWSWEEPER_APP_PRIVATE_KEY` می‌سازد، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` ارسال می‌کند.

این workflow چهار مسیر دارد:

- `clawsweeper_item` برای درخواست‌های دقیق review issue و pull request؛
- `clawsweeper_comment` برای commandهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های review در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است بررسی کند.

مسیر `github_activity` فقط metadata نرمال‌سازی‌شده را ارسال می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این مسیر عمدا از ارسال کل body مربوط به Webhook خودداری می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper` برابر `.github/workflows/github-activity.yml` است، که event نرمال‌سازی‌شده را به hook مربوط به OpenClaw Gateway برای agent مربوط به ClawSweeper post می‌کند.

فعالیت عمومی مشاهده است، نه تحویل به‌صورت پیش‌فرض. agent مربوط به ClawSweeper هدف Discord را در prompt خود دریافت می‌کند و فقط وقتی باید در `#clawsweeper` post کند که event غافلگیرکننده، اقدام‌پذیر، پرریسک، یا از نظر عملیاتی مفید باشد. باز کردن‌های routine، ویرایش‌ها، churn ربات، نویز Webhook تکراری، و ترافیک review عادی باید به `NO_REPLY` منجر شوند.

titleها، commentها، bodyها، متن review، نام branchها، و پیام‌های commit در GitHub را در سراسر این مسیر داده نامطمئن در نظر بگیرید. آنها ورودی برای summarization و triage هستند، نه دستورالعمل برای workflow یا runtime agent.

## ارسال‌های دستی

ارسال‌های دستی یکپارچه‌سازی مداوم همان گراف job را مثل یکپارچه‌سازی مداوم عادی اجرا می‌کنند، اما هر مسیر محدوده‌دار غیر Android را روشن می‌کنند: shardهای Linux Node، shardهای bundled-plugin، contractهای کانال، سازگاری Node 22، `check`، `check-additional`، build smoke، بررسی‌های مستندات، Python skills، Windows، macOS، و i18n مربوط به Control UI. ارسال‌های دستی مستقل یکپارچه‌سازی مداوم فقط با `include_android=true`، Android را اجرا می‌کنند؛ umbrella کامل انتشار با پاس دادن `include_android=true`، Android را فعال می‌کند. بررسی‌های static پیش‌انتشار Plugin، shard مخصوص انتشار `agentic-plugins`، sweep کامل batch مربوط به extension، و مسیرهای Docker پیش‌انتشار Plugin از یکپارچه‌سازی مداوم خارج شده‌اند. مجموعه پیش‌انتشار Docker فقط زمانی اجرا می‌شود که `Full Release Validation`، workflow جداگانه `Plugin Prerelease` را با gate اعتبارسنجی انتشار فعال dispatch کند.

اجراهای دستی از یک گروه هم‌زمانی یکتا استفاده می‌کنند تا مجموعه کامل release-candidate توسط push یا اجرای PR دیگری روی همان ref cancel نشود. input اختیاری `target_ref` به caller معتمد اجازه می‌دهد آن گراف را در برابر یک branch، tag، یا SHA کامل commit اجرا کند، درحالی‌که از فایل workflow مربوط به ref ارسال انتخاب‌شده استفاده می‌کند.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## اجراکننده‌ها

| اجراکننده                         | کارها                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، کارهای امنیتی سریع و تجمیع‌ها (`security-scm-fast`، `security-dependency-audit`، `security-fast`)، بررسی‌های سریع پروتکل/قرارداد/باندل‌شده، بررسی‌های قرارداد کانال به‌صورت شاردشده، شاردهای `check` به‌جز lint، شاردها و تجمیع‌های `check-additional`، اعتبارسنج‌های تجمیعی آزمون Node، بررسی‌های مستندات، مهارت‌های Python، workflow-sanity، labeler، auto-response؛ پیش‌پرواز install-smoke نیز از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا ماتریس Blacksmith زودتر بتواند در صف قرار گیرد |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، شاردهای سبک‌تر Plugin، `checks-fast-core`، `checks-node-compat-node22`، `check-prod-types`، و `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، build-smoke، شاردهای آزمون Linux Node، شاردهای آزمون Pluginهای باندل‌شده، `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (آن‌قدر به CPU حساس است که 8 vCPU بیش از صرفه‌جویی‌اش هزینه ایجاد کرد)؛ ساخت‌های Docker مربوط به install-smoke (هزینه زمان صف 32-vCPU بیش از صرفه‌جویی‌اش بود)                                                                                                                                                                                                                                                                                                                     |
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

`Full Release Validation` گردش‌کار چتری دستی برای «اجرای همه‌چیز پیش از انتشار» است. یک شاخه، تگ، یا SHA کامل کامیت را می‌پذیرد، گردش‌کار دستی `CI` را با آن هدف dispatch می‌کند، `Plugin Prerelease` را برای اثبات فقط‌انتشاری Plugin/بسته/ایستا/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای install smoke، پذیرش بسته، مجموعه‌های مسیر انتشار Docker، live/E2E، OpenWebUI، هم‌ارزی QA Lab، Matrix، و مسیرهای Telegram dispatch می‌کند. با `rerun_group=all` و `release_profile=full`، همچنین `NPM Telegram Beta E2E` را در برابر آرتیفکت `release-package-under-test` از بررسی‌های انتشار اجرا می‌کند. پس از انتشار، `npm_telegram_package_spec` را بدهید تا همان مسیر بسته Telegram در برابر بسته npm منتشرشده دوباره اجرا شود.

برای ماتریس مرحله‌ها، نام دقیق کارهای گردش‌کار، تفاوت‌های پروفایل، آرتیفکت‌ها، و هندل‌های بازاجرای متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` گردش‌کار دستی تغییردهنده انتشار است. پس از وجود داشتن تگ انتشار و پس از موفقیت پیش‌پرواز npm مربوط به OpenClaw، آن را از `release/YYYY.M.D` یا `main` dispatch کنید. این گردش‌کار `pnpm plugins:sync:check` را تأیید می‌کند، `Plugin NPM Release` را برای همه بسته‌های Plugin قابل انتشار dispatch می‌کند، `Plugin ClawHub Release` را برای همان SHA انتشار dispatch می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده dispatch می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات کامیت پین‌شده روی شاخه‌ای که سریع حرکت می‌کند، به‌جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

رفرنس‌های dispatch گردش‌کار GitHub باید شاخه یا تگ باشند، نه SHA خام کامیت. helper یک شاخه موقت `release-ci/<sha>-...` را روی SHA هدف push می‌کند، `Full Release Validation` را از آن رفرنس پین‌شده dispatch می‌کند، تأیید می‌کند که `headSha` هر گردش‌کار فرزند با هدف مطابقت دارد، و پس از تکمیل اجرا شاخه موقت را حذف می‌کند. اعتبارسنج چتری همچنین اگر هر گردش‌کار فرزند روی SHA متفاوتی اجرا شده باشد شکست می‌خورد.

`release_profile` گستره live/provider را که به بررسی‌های انتشار پاس داده می‌شود کنترل می‌کند. گردش‌کارهای دستی انتشار به‌صورت پیش‌فرض `stable` هستند؛ فقط وقتی از `full` استفاده کنید که عمداً ماتریس گسترده مشورتی provider/media را می‌خواهید.

- `minimum` سریع‌ترین مسیرهای حیاتی انتشار OpenAI/هسته را نگه می‌دارد.
- `stable` مجموعه provider/backend پایدار را اضافه می‌کند.
- `full` ماتریس گسترده مشورتی provider/media را اجرا می‌کند.

چتر، شناسه‌های اجرای فرزند dispatch‌شده را ثبت می‌کند، و کار نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین کارها را برای هر اجرای فرزند اضافه می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط کار اعتبارسنج والد را دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هم `Full Release Validation` و هم `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all` استفاده کنید، برای فقط فرزند CI کامل معمولی از `ci`، برای فقط فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از گروهی محدودتر: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار بازاجرای جعبه انتشار شکست‌خورده را پس از یک اصلاح متمرکز محدود نگه می‌دارد.

`OpenClaw Release Checks` از رفرنس گردش‌کار مورد اعتماد استفاده می‌کند تا رفرنس انتخاب‌شده را یک‌بار به یک tarball به نام `release-package-under-test` حل کند، سپس آن آرتیفکت را هم به گردش‌کار Docker مسیر انتشار live/E2E و هم به شارد پذیرش بسته پاس می‌دهد. این کار بایت‌های بسته را در سراسر جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوباره همان نامزد در چندین کار فرزند جلوگیری می‌کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all` چتر قدیمی‌تر را supersede می‌کنند. مانیتور والد هر گردش‌کار فرزندی را که قبلاً dispatch کرده باشد هنگام لغو والد لغو می‌کند، بنابراین اعتبارسنجی جدیدتر main پشت یک اجرای کهنه دو ساعته release-check معطل نمی‌ماند. اعتبارسنجی شاخه/تگ انتشار و گروه‌های بازاجرای متمرکز `cancel-in-progress: false` را نگه می‌دارند.

## شاردهای Live و E2E

فرزند live/E2E انتشار پوشش گسترده بومی `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک کار سریال، از طریق `scripts/test-live-shard.mjs` به‌صورت شاردهای نام‌گذاری‌شده اجرا می‌کند:

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
- شاردهای جداشده صوت/ویدئوی media و شاردهای music فیلترشده بر اساس provider

این کار همان پوشش فایل را حفظ می‌کند و در عین حال بازاجرا و عیب‌یابی شکست‌های کند provider زنده را آسان‌تر می‌کند. نام شاردهای تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` برای بازاجراهای دستی یک‌باره همچنان معتبر می‌مانند.

شاردهای media زنده بومی در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط گردش‌کار `Live Media Runner Image` ساخته شده است. آن image، `ffmpeg` و `ffprobe` را از پیش نصب می‌کند؛ کارهای media فقط پیش از setup باینری‌ها را تأیید می‌کنند. مجموعه‌های live متکی بر Docker را روی اجراکننده‌های عادی Blacksmith نگه دارید — کارهای container جای مناسبی برای راه‌اندازی آزمون‌های Docker تودرتو نیستند.

شاردهای مدل/بک‌اند زنده مبتنی بر Docker از یک تصویر مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` برای هر کامیت انتخاب‌شده استفاده می‌کنند. گردش‌کار انتشار زنده آن تصویر را یک‌بار می‌سازد و push می‌کند، سپس شاردهای مدل زنده Docker، Gateway شاردشده بر اساس ارائه‌دهنده، بک‌اند CLI، اتصال ACP و مهار Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. شاردهای Docker مربوط به Gateway سقف‌های صریح `timeout` در سطح اسکریپت دارند که پایین‌تر از timeout کار گردش‌کار است، تا کانتینر گیرکرده یا مسیر پاک‌سازی، به‌جای مصرف کل بودجه بررسی انتشار، سریع شکست بخورد. اگر آن شاردها هدف کامل Docker منبع را به‌صورت مستقل دوباره بسازند، اجرای انتشار نادرست پیکربندی شده و زمان واقعی را برای ساخت‌های تکراری تصویر هدر خواهد داد.

## پذیرش بسته

از `Package Acceptance` زمانی استفاده کنید که پرسش این است: «آیا این بسته قابل نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» این با CI معمولی متفاوت است: CI معمولی درخت منبع را اعتبارسنجی می‌کند، درحالی‌که پذیرش بسته یک tarball منفرد را از طریق همان مهار Docker E2E اعتبارسنجی می‌کند که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند.

### کارها

1. `resolve_package`، `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان آرتیفکت `package-under-test` بارگذاری می‌کند، و منبع، ref گردش‌کار، ref بسته، نسخه، SHA-256 و پروفایل را در خلاصه گام GitHub چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار قابل استفاده مجدد آن آرتیفکت را دانلود می‌کند، موجودی tarball را اعتبارسنجی می‌کند، در صورت نیاز تصویرهای Docker با digest بسته را آماده می‌کند، و laneهای Docker انتخاب‌شده را به‌جای pack کردن checkout گردش‌کار، در برابر همان بسته اجرا می‌کند. وقتی یک پروفایل چند `docker_lanes` هدفمند را انتخاب می‌کند، گردش‌کار قابل استفاده مجدد بسته و تصویرهای مشترک را یک‌بار آماده می‌کند، سپس آن laneها را به‌صورت کارهای Docker هدفمند موازی با آرتیفکت‌های یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و زمانی که Package Acceptance یک بسته را resolve کرده باشد، همان آرتیفکت `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک مشخصه npm منتشرشده را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker، یا lane اختیاری Telegram شکست خورده باشد، گردش‌کار را fail می‌کند.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش بتا/پایدار منتشرشده استفاده کنید.
- `source=ref` یک شاخه، tag، یا SHA کامل کامیتِ قابل اعتماد `package_ref` را pack می‌کند. resolver شاخه‌ها/tagهای OpenClaw را fetch می‌کند، بررسی می‌کند کامیت انتخاب‌شده از تاریخچه شاخه مخزن یا یک tag انتشار قابل دسترسی باشد، وابستگی‌ها را در یک worktree جداشده نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` pack می‌کند.
- `source=url` یک `.tgz` از HTTPS دانلود می‌کند؛ `package_sha256` الزامی است.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است، اما برای آرتیفکت‌های اشتراک‌گذاری‌شده بیرونی بهتر است ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد گردش‌کار/مهار قابل اعتمادی است که آزمون را اجرا می‌کند. `package_ref` کامیت منبعی است که وقتی `source=ref` باشد pack می‌شود. این کار به مهار آزمون فعلی اجازه می‌دهد کامیت‌های منبع قدیمی‌تر و قابل اعتماد را بدون اجرای منطق گردش‌کار قدیمی اعتبارسنجی کند.

### پروفایل‌های مجموعه

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — قطعه‌های کامل مسیر انتشار Docker همراه با OpenWebUI
- `custom` — `docker_lanes` دقیق؛ زمانی الزامی است که `suite_profile=custom` باشد

پروفایل `package` از پوشش آفلاین plugin استفاده می‌کند تا اعتبارسنجی بسته منتشرشده به دسترس‌بودن زنده ClawHub وابسته نباشد. lane اختیاری Telegram در `NPM Telegram Beta E2E` از آرتیفکت `package-under-test` دوباره استفاده می‌کند، درحالی‌که مسیر مشخصه npm منتشرشده برای dispatchهای مستقل نگه داشته شده است.

برای سیاست اختصاصی آزمون‌های به‌روزرسانی و plugin، شامل فرمان‌های محلی،
laneهای Docker، ورودی‌های Package Acceptance، پیش‌فرض‌های انتشار، و تریاژ شکست،
[آزمون به‌روزرسانی‌ها و pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار Package Acceptance را با `source=artifact`، آرتیفکت بسته انتشار آماده‌شده، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، `published_upgrade_survivor_baselines=release-history`، `published_upgrade_survivor_scenarios=reported-issues` و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار اثبات مهاجرت بسته، به‌روزرسانی، پاک‌سازی وابستگی plugin کهنه، plugin آفلاین، به‌روزرسانی plugin و Telegram را روی همان tarball بسته resolveشده نگه می‌دارد. بررسی‌های انتشار Cross-OS همچنان onboarding، نصاب و رفتار پلتفرم مختص سیستم‌عامل را پوشش می‌دهند؛ اعتبارسنجی محصول بسته/به‌روزرسانی باید با Package Acceptance شروع شود. lane Docker به نام `published-upgrade-survivor` در هر اجرا یک baseline بسته منتشرشده را اعتبارسنجی می‌کند. در Package Acceptance، tarball resolveشده `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده fallback را انتخاب می‌کند که پیش‌فرض آن `openclaw@latest` است؛ فرمان‌های اجرای دوباره lane شکست‌خورده آن baseline را حفظ می‌کنند. `published_upgrade_survivor_baselines=release-history` را تنظیم کنید تا lane در یک ماتریس تاریخچه dedupeشده گسترش یابد: شش انتشار پایدار آخر، `2026.4.23` و آخرین انتشار پایدار پیش از `2026-03-15`. `published_upgrade_survivor_scenarios=reported-issues` را تنظیم کنید تا همان baselineها در fixtureهای مشابه issue برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، مسیرهای لاگ tilde، و ریشه‌های وابستگی plugin قدیمی و کهنه گسترش یابند. گردش‌کار جداگانه `Update Migration` از lane Docker به نام `update-migration` با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند، وقتی پرسش پاک‌سازی جامع به‌روزرسانی منتشرشده است، نه گستره معمول Full Release CI. اجراهای تجمیعی محلی می‌توانند مشخصه‌های دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` پاس بدهند، یک lane منفرد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را برای ماتریس سناریو تنظیم کنند. lane منتشرشده baseline را با یک recipe فرمان bakeشده `openclaw config set` پیکربندی می‌کند، گام‌های recipe را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz` و وضعیت RPC را probe می‌کند. laneهای تازه بسته‌بندی‌شده و نصاب Windows نیز بررسی می‌کنند که یک بسته نصب‌شده بتواند override کنترل مرورگر را از یک مسیر خام مطلق Windows import کند. smoke چرخش agent مربوط به OpenAI cross-OS در صورت تنظیم، به‌طور پیش‌فرض از `OPENCLAW_CROSS_OS_OPENAI_MODEL` استفاده می‌کند، وگرنه از `openai/gpt-5.5`، تا اثبات نصب و Gateway روی مدل ترجیحی آزمون GPT-5 باقی بماند.

### پنجره‌های سازگاری قدیمی

Package Acceptance برای بسته‌های ازپیش منتشرشده پنجره‌های سازگاری قدیمی محدود دارد. بسته‌ها تا `2026.4.25`، از جمله `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- ورودی‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌های حذف‌شده از tarball اشاره کنند؛
- `doctor-switch` ممکن است زیرمورد ماندگاری `gateway install --wrapper` را وقتی بسته آن flag را expose نمی‌کند skip کند؛
- `update-channel-switch` ممکن است `pnpm.patchedDependencies` گم‌شده را از fixture جعلی git مشتق‌شده از tarball prune کند و ممکن است `update.channel` ماندگارشده گم‌شده را log کند؛
- smokeهای plugin ممکن است مکان‌های قدیمی install-record را بخوانند یا نبود ماندگاری install-record بازارچه را بپذیرند؛
- `plugin-update` ممکن است مهاجرت فراداده پیکربندی را مجاز بداند، درحالی‌که همچنان لازم است install record و رفتار no-reinstall بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` نیز ممکن است برای فایل‌های stamp فراداده ساخت محلی که قبلا منتشر شده‌اند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا skip، fail می‌شوند.

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

هنگام اشکال‌زدایی یک اجرای شکست‌خورده پذیرش بسته، از خلاصه `resolve_package` شروع کنید تا منبع بسته، نسخه و SHA-256 را تایید کنید. سپس اجرای فرزند `docker_acceptance` و آرتیفکت‌های Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، لاگ‌های lane، زمان‌بندی‌های فاز و فرمان‌های اجرای دوباره. اجرای دوباره پروفایل بسته شکست‌خورده یا laneهای دقیق Docker را به اجرای دوباره اعتبارسنجی کامل انتشار ترجیح دهید.

## Install smoke

گردش‌کار جداگانه `Install Smoke` از همان اسکریپت دامنه از طریق کار `preflight` خودش دوباره استفاده می‌کند. این گردش‌کار پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطوح Docker/بسته، تغییرات بسته/manifest مربوط به pluginهای bundled، یا سطوح هسته plugin/channel/gateway/Plugin SDK را لمس می‌کنند که کارهای Docker smoke آن‌ها را اجرا می‌کنند. تغییرات فقط-منبع در pluginهای bundled، ویرایش‌های فقط-آزمون، و ویرایش‌های فقط-مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع تصویر Dockerfile ریشه را یک‌بار می‌سازد، CLI را بررسی می‌کند، smoke فرمان CLI حذف agents در workspace مشترک را اجرا می‌کند، e2e کانتینر gateway-network را اجرا می‌کند، یک آرگومان ساخت extension bundled را بررسی می‌کند، و پروفایل Docker محدود pluginهای bundled را زیر یک timeout تجمیعی ۲۴۰ ثانیه‌ای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه cap شده است).
- **مسیر کامل** پوشش نصب بسته QR و Docker/update نصاب را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call و pull requestهایی که واقعا سطوح نصاب/بسته/Docker را لمس می‌کنند نگه می‌دارد. در حالت کامل، install-smoke یک تصویر smoke مربوط به Dockerfile ریشه GHCR برای target-SHA را آماده یا دوباره استفاده می‌کند، سپس نصب بسته QR، smokeهای Dockerfile/Gateway ریشه، smokeهای نصاب/به‌روزرسانی، و Docker E2E سریع pluginهای bundled را به‌عنوان کارهای جداگانه اجرا می‌کند تا کار نصاب پشت smokeهای تصویر ریشه منتظر نماند.

pushهای `main`، از جمله merge commitها، مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق دامنه تغییرات روی یک push پوشش کامل درخواست کند، گردش‌کار smoke سریع Docker را نگه می‌دارد و smoke کامل نصب را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

smoke کند نصب سراسری Bun برای image-provider به‌صورت جداگانه با `run_bun_global_install_smoke` gate می‌شود. این smoke در زمان‌بندی شبانه و از گردش‌کار بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` این کار را نمی‌کنند. آزمون‌های Docker مربوط به QR و نصاب Dockerfileهای نصب‌محور خود را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک تصویر live-test مشترک را از پیش می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball npm pack می‌کند، و دو تصویر مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner خام Node/Git برای laneهای نصاب/به‌روزرسانی/وابستگی plugin؛
- یک تصویر کاربردی که همان tarball را برای laneهای عملکرد معمولی در `/app` نصب می‌کند.

تعریف‌های مسیر Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق برنامه‌ریز در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و اجراکننده فقط برنامه انتخاب‌شده را اجرا می‌کند. زمان‌بند تصویر را برای هر مسیر با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس مسیرها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیمات قابل تغییر

| متغیر                                  | پیش‌فرض | هدف                                                                                           |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد اسلات‌های استخر اصلی برای مسیرهای عادی.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد اسلات‌های استخر انتهایی حساس به ارائه‌دهنده.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف مسیرهای زنده همزمان تا ارائه‌دهندگان محدودسازی نکنند.                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | سقف مسیرهای همزمان نصب npm.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف مسیرهای همزمان چندسرویسی.                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع مسیرها برای جلوگیری از هجوم ایجاد در daemon Docker؛ برای نبود فاصله‌گذاری `0` بگذارید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلت fallback برای هر مسیر (120 دقیقه)؛ مسیرهای زنده/انتهایی انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | تنظیم‌نشده | `1` برنامه زمان‌بند را بدون اجرای مسیرها چاپ می‌کند.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | تنظیم‌نشده | فهرست دقیق مسیرها با جداکننده کاما؛ smoke پاک‌سازی را رد می‌کند تا agentها بتوانند یک مسیر ناموفق را بازتولید کنند. |

مسیری که از سقف مؤثرش سنگین‌تر است همچنان می‌تواند از یک استخر خالی شروع شود، سپس تا زمانی که ظرفیت را آزاد کند تنها اجرا می‌شود. aggregate محلی Docker را از پیش بررسی می‌کند، کانتینرهای قدیمی OpenClaw E2E را حذف می‌کند، وضعیت مسیر فعال را منتشر می‌کند، زمان‌بندی مسیرها را برای ترتیب‌دهی طولانی‌ترین-اول پایدار می‌کند، و به‌طور پیش‌فرض پس از نخستین شکست، زمان‌بندی مسیرهای pooled جدید را متوقف می‌کند.

### گردش‌کار زنده/E2E قابل استفاده دوباره

گردش‌کار زنده/E2E قابل استفاده دوباره از `scripts/test-docker-all.mjs --plan-json` می‌پرسد کدام بسته، نوع تصویر، تصویر زنده، مسیر، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن برنامه را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این گردش‌کار یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا artifact بسته از اجرای فعلی را دانلود می‌کند، یا artifact بسته را از `package_artifact_run_id` دانلود می‌کند؛ موجودی tarball را اعتبارسنجی می‌کند؛ وقتی برنامه به مسیرهای نصب‌شده از بسته نیاز دارد، تصویرهای bare/functional GHCR Docker E2E برچسب‌خورده با digest بسته را از طریق cache لایه Docker متعلق به Blacksmith می‌سازد و push می‌کند؛ و به‌جای ساخت دوباره، ورودی‌های `docker_e2e_bare_image`/`docker_e2e_functional_image` ارائه‌شده یا تصویرهای موجود با digest بسته را دوباره استفاده می‌کند. pull تصویرهای Docker با مهلت محدود 180 ثانیه برای هر تلاش دوباره انجام می‌شود تا جریان گیرکرده registry/cache به‌جای مصرف بخش بزرگی از مسیر بحرانی CI، سریع دوباره تلاش شود.

### قطعه‌های مسیر انتشار

پوشش Docker انتشار، jobهای کوچک‌تر قطعه‌بندی‌شده را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر قطعه فقط نوع تصویری را که نیاز دارد pull کند و چند مسیر را از طریق همان زمان‌بند وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

قطعه‌های فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و از `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای aggregate Plugin/runtime هستند. alias مسیر `install-e2e` همچنان alias بازاجرای دستی aggregate برای هر دو مسیر نصب‌کننده ارائه‌دهنده است.

وقتی پوشش کامل release-path آن را درخواست کند، OpenWebUI در `plugins-runtime-services` ادغام می‌شود، و فقط برای dispatchهای مخصوص OpenWebUI یک قطعه مستقل `openwebui` را نگه می‌دارد. مسیرهای به‌روزرسانی کانال‌های bundle‌شده برای شکست‌های گذرای شبکه npm یک بار retry می‌کنند.

هر قطعه `.artifacts/docker-tests/` را با لاگ‌های مسیر، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های فاز، JSON برنامه زمان‌بند، جدول‌های مسیرهای کند، و فرمان‌های بازاجرا برای هر مسیر upload می‌کند. ورودی `docker_lanes` در گردش‌کار، مسیرهای انتخاب‌شده را به‌جای jobهای قطعه‌ای در برابر تصویرهای آماده اجرا می‌کند؛ این کار اشکال‌زدایی مسیر ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و artifact بسته را برای آن اجرا آماده، دانلود، یا دوباره استفاده می‌کند؛ اگر مسیر انتخاب‌شده یک مسیر زنده Docker باشد، job هدفمند تصویر live-test را برای همان بازاجرا به‌صورت محلی می‌سازد. فرمان‌های بازاجرای GitHub تولیدشده برای هر مسیر، وقتی این مقدارها وجود داشته باشند، `package_artifact_run_id`، `package_artifact_name`، و ورودی‌های تصویر آماده را شامل می‌شوند تا یک مسیر ناموفق بتواند دقیقاً همان بسته و تصویرهای اجرای ناموفق را دوباره استفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

گردش‌کار زمان‌بندی‌شده زنده/E2E مجموعه کامل Docker مربوط به release-path را روزانه اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/بسته پرهزینه‌تری است، بنابراین یک گردش‌کار جداگانه است که توسط `Full Release Validation` یا توسط یک operator صریح dispatch می‌شود. pull requestهای عادی، pushهای `main`، و dispatchهای دستی مستقل CI آن مجموعه را خاموش نگه می‌دارند. این گردش‌کار تست‌های Pluginهای bundle‌شده را میان هشت worker افزونه متوازن می‌کند؛ آن jobهای shard افزونه، همزمان تا دو گروه config Plugin را با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin با import سنگین، jobهای CI اضافی ایجاد نکنند. مسیر پیش‌انتشار Docker مخصوص انتشار، مسیرهای Docker هدفمند را در گروه‌های کوچک batch می‌کند تا برای jobهای یک تا سه دقیقه‌ای ده‌ها runner رزرو نشود.

## QA Lab

QA Lab مسیرهای CI اختصاصی خارج از گردش‌کار اصلی smart-scoped دارد.

- گردش‌کار `Parity gate` روی تغییرات PR مطابق و dispatch دستی اجرا می‌شود؛ runtime خصوصی QA را می‌سازد و packهای agentic مربوط به mock GPT-5.5 و Opus 4.6 را مقایسه می‌کند.
- گردش‌کار `QA-Lab - All Lanes` هر شب روی `main` و روی dispatch دستی اجرا می‌شود؛ mock parity gate، مسیر زنده Matrix، و مسیرهای زنده Telegram و Discord را به‌عنوان jobهای موازی fan out می‌کند. jobهای زنده از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار مسیرهای transport زنده Matrix و Telegram را با ارائه‌دهنده mock قطعی و مدل‌های واجد شرایط mock (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد کانال از تأخیر مدل زنده و startup عادی Plugin ارائه‌دهنده جدا شود. Gateway زنده transport جست‌وجوی حافظه را غیرفعال می‌کند چون برابری QA رفتار حافظه را جداگانه پوشش می‌دهد؛ اتصال ارائه‌دهنده توسط مجموعه‌های جداگانه مدل زنده، ارائه‌دهنده native، و ارائه‌دهنده Docker پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند، و فقط وقتی CLI checkout‌شده از آن پشتیبانی کند `--fail-fast` را اضافه می‌کند. پیش‌فرض CLI و ورودی گردش‌کار دستی همچنان `all` می‌مانند؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین پیش از تأیید انتشار، مسیرهای release-critical در QA Lab را اجرا می‌کند؛ parity gate آن برای QA، packهای candidate و baseline را به‌عنوان jobهای مسیر موازی اجرا می‌کند، سپس هر دو artifact را در یک job گزارش کوچک برای مقایسه نهایی parity دانلود می‌کند.

مسیر landing PR را پشت `Parity gate` نگذارید مگر اینکه تغییر واقعاً runtime QA، برابری model-pack، یا سطحی را لمس کند که گردش‌کار parity مالک آن است. برای اصلاحات عادی کانال، config، docs، یا unit-test، آن را یک سیگنال اختیاری بدانید و از شواهد scoped CI/check پیروی کنید.

## CodeQL

گردش‌کار `CodeQL` عمداً یک scanner امنیتی first-pass محدود است، نه sweep کامل repository. اجراهای روزانه، دستی، و guard مربوط به pull requestهای غیر draft، کد گردش‌کار Actions به‌علاوه پرریسک‌ترین سطوح JavaScript/TypeScript را با queryهای امنیتی high-confidence که به `security-severity` بالا/critical فیلتر شده‌اند scan می‌کنند.

guard pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود، و همان ماتریس امنیتی high-confidence را مانند گردش‌کار زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS خارج از پیش‌فرض‌های PR می‌ماند.

### دسته‌های امنیتی

| دسته                                             | سطح                                                                                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | baseline مربوط به auth، secrets، sandbox، cron، و gateway                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال core به‌همراه runtime Plugin کانال، Gateway، Plugin SDK، secrets، نقاط تماس audit                   |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح core SSRF، parsing IP، network guard، web-fetch، و سیاست SSRF در Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | serverهای MCP، helperهای اجرای process، تحویل outbound، و gateهای اجرای tool توسط agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد مربوط به نصب Plugin، loader، manifest، registry، نصب package-manager، source-loading، و قرارداد بسته Plugin SDK     |

### shardهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — shard امنیتی زمان‌بندی‌شده Android. برنامه Android را برای CodeQL روی کوچک‌ترین runner لینوکسی Blacksmith که workflow sanity می‌پذیرد، به‌صورت دستی build می‌کند. زیر `/codeql-critical-security/android` upload می‌کند.
- `CodeQL macOS Critical Security` — shard امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL روی Blacksmith macOS به‌صورت دستی build می‌کند، نتایج build dependency را از SARIF آپلودشده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` upload می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده چون build macOS حتی وقتی clean باشد runtime را غالب می‌کند.

### دسته‌های Critical Quality

`CodeQL Critical Quality` shard متناظر غیرامنیتی است. این shard فقط queryهای کیفیت JavaScript/TypeScript با error-severity و غیرامنیتی را روی سطوح محدود و پرارزش، روی runner لینوکسی کوچک‌تر Blacksmith اجرا می‌کند. guard آن برای pull request عمداً از پروفایل زمان‌بندی‌شده کوچک‌تر است: PRهای غیر draft فقط shardهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای فرمان/model/tool توسط agent و dispatch پاسخ، کد schema/migration/IO مربوط به config، کد auth/secrets/sandbox/security، کانال core و runtime Plugin کانال bundle‌شده، protocol/server-method مربوط به Gateway، runtime حافظه/glue مربوط به SDK، MCP/process/تحویل outbound، runtime ارائه‌دهنده/catalog مدل، session diagnostics/صف‌های تحویل، Plugin loader، Plugin SDK/package-contract، یا runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات config و گردش‌کار quality مربوط به CodeQL هر دوازده shard کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های محدود، هوک‌های آموزش/تکرار برای اجرای یک شارد کیفیت به‌صورت ایزوله هستند.

| دسته‌بندی                                                | سطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، secrets، sandbox، Cron و Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | قراردادهای طرح‌واره پیکربندی، مهاجرت، نرمال‌سازی و IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | طرح‌واره‌های پروتکل Gateway و قراردادهای متد سرور                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال‌های هسته و Pluginهای کانال بسته‌بندی‌شده                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای دستور، توزیع model/provider، توزیع و صف‌های auto-reply، و قراردادهای زمان اجرای control-plane در ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، helperهای نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، facadeهای زمان اجرای حافظه، aliasهای Plugin SDK حافظه، glue فعال‌سازی زمان اجرای حافظه، و دستورهای doctor حافظه                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | internals صف پاسخ، صف‌های تحویل نشست، helperهای اتصال/تحویل نشست خروجی، سطح‌های بسته رویداد/گزارش تشخیصی، و قراردادهای CLI doctor نشست |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | توزیع پاسخ ورودی Plugin SDK، helperهای payload/chunking/runtime پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و helperهای اتصال نشست/رشته             |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و کشف provider، ثبت زمان اجرای provider، پیش‌فرض‌ها/کاتالوگ‌های provider، و registryهای web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | راه‌اندازی Control UI، ماندگاری محلی، جریان‌های کنترل Gateway، و قراردادهای زمان اجرای control-plane وظیفه                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای زمان اجرای fetch/search وب هسته، IO رسانه، فهم رسانه، تولید تصویر، و تولید رسانه                                                    |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، سطح عمومی، و نقطه ورود Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع Plugin SDK سمت بسته منتشرشده و helperهای قرارداد بسته Plugin                                                                                      |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند بدون مبهم‌کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال یا گسترش داده شوند. گسترش CodeQL برای Swift، Python و Pluginهای بسته‌بندی‌شده فقط پس از اینکه پروفایل‌های محدود زمان اجرای پایدار و سیگنال پایدار داشتند، باید به‌عنوان کار پیگیری scoped یا sharded دوباره اضافه شود.

## گردش‌کارهای نگه‌داری

### Docs Agent

گردش‌کار `Docs Agent` یک مسیر نگه‌داری رویدادمحور Codex برای هم‌راستا نگه‌داشتن مستندات موجود با تغییرات تازه ادغام‌شده است. زمان‌بندی خالص ندارد: یک اجرای موفق CI push غیررباتی روی `main` می‌تواند آن را trigger کند، و dispatch دستی می‌تواند آن را مستقیما اجرا کند. invocationهای workflow-run وقتی `main` جلو رفته باشد یا وقتی اجرای Docs Agent غیر-skipped دیگری در یک ساعت گذشته ایجاد شده باشد، skip می‌شوند. وقتی اجرا می‌شود، بازه commit را از SHA منبع قبلی Docs Agent غیر-skipped تا `main` فعلی بازبینی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main را که از آخرین گذر مستندات جمع شده‌اند پوشش دهد.

### Test Performance Agent

گردش‌کار `Test Performance Agent` یک مسیر نگه‌داری رویدادمحور Codex برای تست‌های کند است. زمان‌بندی خالص ندارد: یک اجرای موفق CI push غیررباتی روی `main` می‌تواند آن را trigger کند، اما اگر invocation دیگری از workflow-run در همان روز UTC قبلا اجرا شده باشد یا در حال اجرا باشد، skip می‌کند. dispatch دستی از این گیت فعالیت روزانه عبور می‌کند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده از کل suite می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک عملکرد تست را که پوشش را حفظ می‌کنند انجام دهد نه refactorهای گسترده، سپس گزارش کل suite را دوباره اجرا می‌کند و تغییراتی را که شمار تست‌های گذرای baseline را کاهش دهند رد می‌کند. اگر baseline تست‌های ناموفق داشته باشد، Codex فقط می‌تواند failureهای واضح را رفع کند و گزارش کل suite پس از agent باید پیش از commit شدن هر چیزی pass شود. وقتی `main` پیش از push بات جلو برود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را retry می‌کند؛ patchهای قدیمی دارای conflict skip می‌شوند. این مسیر از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo عامل مستندات را حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای پاک‌سازی تکراری‌ها پس از land است. به‌صورت پیش‌فرض dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتا فهرست‌شده را می‌بندد. پیش از mutate کردن GitHub، بررسی می‌کند که PR landed ادغام شده باشد و هر duplicate یا issue ارجاع‌شده مشترک داشته باشد یا hunkهای تغییرکرده همپوشان داشته باشد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## گیت‌های بررسی محلی و مسیریابی تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن گیت بررسی محلی درباره مرزهای معماری سخت‌گیرتر از scope گسترده پلتفرم CI است:

- تغییرات production هسته، typecheck هسته prod و هسته test به‌همراه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط-test هسته، فقط typecheck تست هسته به‌همراه lint هسته را اجرا می‌کنند؛
- تغییرات production extension، typecheck extension prod و extension test به‌همراه lint extension را اجرا می‌کنند؛
- تغییرات فقط-test extension، typecheck تست extension به‌همراه lint extension را اجرا می‌کنند؛
- تغییرات public Plugin SDK یا plugin-contract به typecheck extension گسترش می‌یابند، چون extensionها به آن قراردادهای هسته وابسته‌اند (sweepهای extension در Vitest همچنان کار تست explicit می‌مانند)؛
- bumpهای نسخه فقط metadata انتشار، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کنند؛
- تغییرات ناشناخته root/config برای ایمنی به همه check laneها fail safe می‌شوند.

مسیریابی changed-test محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش‌های مستقیم تست خودشان را اجرا می‌کنند، ویرایش‌های source ابتدا mappingهای explicit را ترجیح می‌دهند، سپس تست‌های sibling و وابسته‌های import-graph. پیکربندی تحویل group-room مشترک یکی از mappingهای explicit است: تغییرات در پیکربندی visible-reply گروه، حالت تحویل پاسخ source، یا system prompt ابزار پیام، از مسیر تست‌های پاسخ هسته به‌همراه regressionهای تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین PR push شکست بخورد. فقط وقتی تغییر آن‌قدر harness-wide است که مجموعه mapped ارزان proxy قابل اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Testbox را از root repo اجرا کنید و برای اثبات گسترده، یک box تازه warmed را ترجیح دهید. پیش از صرف‌کردن یک گیت کند روی boxی که reuse شده، منقضی شده، یا تازه sync غیرمنتظره بزرگی گزارش کرده است، ابتدا داخل box دستور `pnpm testbox:sanity` را اجرا کنید.

sanity check وقتی فایل‌های root ضروری مانند `pnpm-lock.yaml` ناپدید شده باشند یا وقتی `git status --short` حداقل ۲۰۰ حذف tracked نشان دهد، سریع fail می‌شود. این معمولا یعنی وضعیت sync راه دور کپی قابل اعتمادی از PR نیست؛ به‌جای debug کردن failure تست محصول، آن box را stop کنید و یکی تازه warm کنید. برای PRهایی با حذف بزرگ عمدی، برای آن اجرای sanity مقدار `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

`pnpm testbox:run` همچنین invocation محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از sync در phase sync بماند terminate می‌کند. برای غیرفعال کردن آن guard، `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ، مقدار میلی‌ثانیه بزرگ‌تری به‌کار ببرید.

Crabbox مسیر دوم remote-box متعلق به repo برای اثبات Linux است، وقتی Blacksmith در دسترس نیست یا وقتی ظرفیت cloud متعلق به خودمان ترجیح دارد. یک box را warm کنید، آن را از طریق workflow پروژه hydrate کنید، سپس commandها را از طریق Crabbox CLI اجرا کنید:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` مالک پیش‌فرض‌های provider، sync، و hydration در GitHub Actions است. این فایل `.git` محلی را exclude می‌کند تا checkout هیدراته‌شده Actions به‌جای sync کردن remoteهای محلی maintainer و object storeها، metadata Git راه دور خودش را حفظ کند، و artifactهای runtime/build محلی را که هرگز نباید منتقل شوند exclude می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، fetch کردن `origin/main`، و handoff محیط غیر-secret است که commandهای بعدی `crabbox run --id <cbx_id>` source می‌کنند.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)

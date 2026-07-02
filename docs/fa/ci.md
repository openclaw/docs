---
read_when:
    - باید بدانید چرا یک کار CI اجرا شده یا نشده است
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگی اجرای اعتبارسنجی انتشار یا اجرای مجدد آن هستید
    - شما در حال تغییر ارسال ClawSweeper یا بازارسال فعالیت GitHub هستید
summary: نمودار کارهای CI، دروازه‌های دامنه، چترهای انتشار، و معادل‌های فرمان محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-07-02T14:07:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

CI در OpenClaw روی هر push به `main` و هر درخواست pull اجرا می‌شود. pushهای canonical به
`main` ابتدا از یک پنجره پذیرش ۹۰ ثانیه‌ای hosted-runner عبور می‌کنند.
concurrency group موجود `CI` وقتی commit جدیدتری وارد شود، آن اجرای در انتظار را لغو می‌کند،
بنابراین mergeهای پیاپی هر کدام یک matrix کامل Blacksmith را ثبت نمی‌کنند.
درخواست‌های pull و dispatchهای دستی از این انتظار عبور می‌کنند. job مربوط به `preflight`
سپس diff را طبقه‌بندی می‌کند و وقتی فقط نواحی نامرتبط تغییر کرده باشند، laneهای پرهزینه را خاموش می‌کند.
اجراهای دستی `workflow_dispatch` عمدا scoping هوشمند را دور می‌زنند
و برای نامزدهای انتشار و اعتبارسنجی گسترده، کل graph را fan out می‌کنند. laneهای Android
از طریق `include_android` همچنان opt-in می‌مانند. پوشش Plugin مختص انتشار در workflow جداگانه
[`پیش‌انتشار Plugin`](#plugin-prerelease) قرار دارد و فقط از
[`اعتبارسنجی کامل انتشار`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| Job                                | هدف                                                                                                   | زمان اجرا                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | تشخیص تغییرات فقط-docs، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest مربوط به CI                   | همیشه روی pushها و PRهای غیر draft                  |
| `runner-admission`                 | debounce میزبانی‌شده ۹۰ ثانیه‌ای برای pushهای canonical به `main` پیش از ثبت کار Blacksmith                | هر اجرای CI؛ sleep فقط روی pushهای canonical به `main` |
| `security-fast`                    | تشخیص کلید خصوصی، audit workflowهای تغییرکرده از طریق `zizmor`، و audit lockfile تولید                 | همیشه روی pushها و PRهای غیر draft                  |
| `check-dependencies`               | اجرای فقط-dependency در Knip برای تولید به‌علاوه guard مربوط به allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node                               |
| `build-artifacts`                  | ساخت `dist/`، Control UI، smoke checkهای built-CLI، checkهای embedded built-artifact، و artifactهای قابل استفاده مجدد | تغییرات مرتبط با Node                               |
| `checks-fast-core`                 | laneهای سریع صحت‌سنجی Linux مانند bundled، protocol، QA Smoke CI، و checkهای CI-routing                | تغییرات مرتبط با Node                               |
| `checks-fast-contracts-plugins-*`  | دو check shardشده برای contractهای Plugin                                                                        | تغییرات مرتبط با Node                               |
| `checks-fast-contracts-channels-*` | دو check shardشده برای contractهای channel                                                                       | تغییرات مرتبط با Node                               |
| `checks-node-core-*`               | shardهای تست core در Node، به‌جز laneهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node                               |
| `check-*`                          | معادل gate محلی اصلی به‌صورت shardشده: typeهای prod، lint، guardها، typeهای test، و smoke سخت‌گیرانه                | تغییرات مرتبط با Node                               |
| `check-additional-*`               | معماری، drift مربوط به boundary/prompt به‌صورت shardشده، guardهای extension، boundary package، و topology runtime     | تغییرات مرتبط با Node                               |
| `checks-node-compat-node22`        | build و smoke lane سازگاری Node 22                                                                | dispatch دستی CI برای انتشارها                     |
| `check-docs`                       | قالب‌بندی docs، lint، و checkهای لینک شکسته                                                             | تغییر docs                                        |
| `skills-python`                    | Ruff + pytest برای Skills مبتنی بر Python                                                                    | تغییرات مرتبط با Skillهای Python                       |
| `checks-windows`                   | تست‌های مختص Windows برای process/path به‌علاوه regressionهای specifier import در runtime مشترک                      | تغییرات مرتبط با Windows                            |
| `macos-node`                       | lane تست TypeScript در macOS با استفاده از artifactهای built مشترک                                               | تغییرات مرتبط با macOS                              |
| `macos-swift`                      | Swift lint، build، و testها برای app مربوط به macOS                                                            | تغییرات مرتبط با macOS                              |
| `ios-build`                        | تولید پروژه Xcode به‌علاوه build شبیه‌ساز app مربوط به iOS                                                 | app مربوط به iOS، shared app kit، یا تغییرات Swabble         |
| `android`                          | تست‌های unit در Android برای هر دو flavor به‌علاوه یک build از debug APK                                              | تغییرات مرتبط با Android                            |
| `test-performance-agent`           | بهینه‌سازی روزانه slow-test در Codex پس از activity قابل اعتماد                                                 | موفقیت CI اصلی یا dispatch دستی                  |
| `openclaw-performance`             | گزارش‌های عملکرد runtime روزانه/درخواستی Kova با laneهای mock-provider، deep-profile، و live برای GPT 5.5 | dispatch زمان‌بندی‌شده و دستی                       |

## ترتیب fail-fast

1. `runner-admission` فقط برای pushهای canonical به `main` منتظر می‌ماند؛ push جدیدتر پیش از ثبت Blacksmith اجرا را لغو می‌کند.
2. `preflight` تصمیم می‌گیرد اصلا کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` stepهایی داخل همین job هستند، نه jobهای مستقل.
3. `security-fast`، `check-*`، `check-additional-*`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و platform matrix سریع fail می‌شوند.
4. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان downstream به‌محض آماده شدن build مشترک شروع کنند.
5. laneهای سنگین‌تر platform و runtime بعد از آن fan out می‌شوند: `checks-fast-core`، `checks-fast-contracts-plugins-*`، `checks-fast-contracts-channels-*`، `checks-node-core-*`، `checks-windows`، `macos-node`، `macos-swift`، `ios-build`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref مربوط به `main` وارد می‌شود، jobهای superseded را با وضعیت `cancelled` علامت بزند. مگر اینکه جدیدترین اجرا برای همان ref هم در حال fail شدن باشد، آن را نویز CI در نظر بگیرید. jobهای matrix از `fail-fast: false` استفاده می‌کنند، و `build-artifacts` شکست‌های embedded channel، core-support-boundary، و gateway-watch را مستقیم گزارش می‌کند، به‌جای اینکه jobهای verifier کوچک را در صف بگذارد. کلید concurrency خودکار CI نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در یک queue group قدیمی نتواند اجراهای جدیدتر main را تا ابد مسدود کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در حال انجام را لغو نمی‌کنند.

برای خلاصه کردن wall time، queue time، کندترین jobها، شکست‌ها، و barrier مربوط به fanout در `pnpm-store-warmup` از GitHub Actions، از `pnpm ci:timings`، `pnpm ci:timings:recent`، یا `node scripts/ci-run-timings.mjs <run-id>` استفاده کنید. CI همان خلاصه اجرا را نیز به‌عنوان artifact با نام `ci-timings-summary` آپلود می‌کند. برای timing ساخت، step مربوط به `Build dist` در job `build-artifacts` را بررسی کنید: `pnpm build:ci-artifacts` عبارت `[build-all] phase timings:` را چاپ می‌کند و شامل `ui:build` است؛ job همچنین artifact مربوط به `startup-memory` را آپلود می‌کند.

برای اجراهای درخواست pull، job نهایی timing-summary پیش از پاس دادن `GH_TOKEN` به `gh run view`، helper را از revision پایه قابل اعتماد اجرا می‌کند. این کار query دارای token را از کد کنترل‌شده توسط branch بیرون نگه می‌دارد و هم‌زمان اجرای CI فعلی درخواست pull را خلاصه می‌کند.

## زمینه و شواهد PR

PRهای contributor خارجی یک gate برای زمینه و شواهد PR از
`.github/workflows/real-behavior-proof.yml` اجرا می‌کنند. این workflow commit پایه قابل اعتماد را
check out می‌کند و فقط body مربوط به PR را ارزیابی می‌کند؛ کدی از branch مربوط به contributor اجرا نمی‌کند.

این gate برای نویسندگان PR اعمال می‌شود که owner، member،
collaborator، یا bot مخزن نیستند. وقتی body مربوط به PR شامل sectionهای authored
`What Problem This Solves` و `Evidence` باشد، pass می‌شود. شواهد می‌تواند یک
test متمرکز، نتیجه CI، screenshot، recording، خروجی terminal، مشاهده live،
log redacted، یا لینک artifact باشد. body نیت و اعتبارسنجی مفید را فراهم می‌کند؛
reviewerها کد، testها، و CI را بررسی می‌کنند تا correctness را ارزیابی کنند.

وقتی check شکست می‌خورد، به‌جای push کردن یک commit کد دیگر، body مربوط به PR را update کنید.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با unit testهای `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest مربوط به preflight طوری عمل کند که انگار هر ناحیه scoped تغییر کرده است.

- **ویرایش‌های workflow مربوط به CI** graph مربوط به CI در Node را به‌علاوه linting مربوط به workflow اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native در Windows، iOS، Android، یا macOS را اجباری نمی‌کنند؛ آن laneهای platform همچنان به تغییرات source مربوط به platform scoped می‌مانند.
- **Workflow Sanity**، `actionlint`، `zizmor` روی همه فایل‌های YAML مربوط به workflow، guard مربوط به interpolation در composite-action، و guard مربوط به conflict-marker را اجرا می‌کند. job مربوط به `security-fast` که به PR scoped است نیز `zizmor` را روی فایل‌های workflow تغییرکرده اجرا می‌کند تا findings امنیتی workflow در graph اصلی CI زود fail شوند.
- **Docs روی pushهای `main`** توسط workflow مستقل `Docs` با همان mirror مربوط به docs در ClawHub که CI استفاده می‌کند check می‌شوند، بنابراین pushهای ترکیبی code+docs همچنین shard مربوط به `check-docs` در CI را صف نمی‌کنند. درخواست‌های pull و CI دستی همچنان وقتی docs تغییر کرده باشد، `check-docs` را از CI اجرا می‌کنند.
- **TUI PTY** برای تغییرات TUI در shard مربوط به `checks-node-core-runtime-tui-pty` در Linux Node اجرا می‌شود. این shard، `test/vitest/vitest.tui-pty.config.ts` را با `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` اجرا می‌کند، بنابراین هم lane مربوط به fixture قطعی `TuiBackend` را پوشش می‌دهد و هم smoke کندتر `tui --local` را که فقط endpoint مدل خارجی را mock می‌کند.
- **ویرایش‌های فقط CI routing، ویرایش‌های منتخب و ارزان fixture برای core-test، و ویرایش‌های محدود helper/test-routing در contractهای Plugin** از یک مسیر manifest سریع فقط-Node استفاده می‌کنند: `preflight`، security، و یک task واحد `checks-fast-core`. وقتی تغییر به سطوح routing یا helper که task سریع مستقیما exercise می‌کند محدود باشد، آن مسیر artifactهای build، سازگاری Node 22، contractهای channel، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی را رد می‌کند.
- **checkهای Windows Node** به wrapperهای مختص Windows برای process/path، helperهای runner مربوط به npm/pnpm/UI، config مربوط به package manager، و سطوح workflow مربوط به CI که آن lane را اجرا می‌کنند scoped هستند؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط-test روی laneهای Linux Node باقی می‌مانند.

کندترین خانواده‌های آزمون Node تقسیم یا متوازن شده‌اند تا هر job بدون رزرو بیش از حد runnerها کوچک بماند: قراردادهای plugin و قراردادهای کانال هرکدام به‌صورت دو shard وزن‌دار با پشتیبانی Blacksmith و fallback استاندارد GitHub runner اجرا می‌شوند، laneهای سریع/پشتیبانی واحد core جداگانه اجرا می‌شوند، زیرساخت runtime core بین state، process/config، shared و سه shard دامنه cron تقسیم شده است، auto-reply به‌صورت workerهای متوازن اجرا می‌شود (با زیردرخت reply که به shardهای agent-runner، dispatch و commands/state-routing تقسیم شده است)، و پیکربندی‌های agentic gateway/server به‌جای انتظار برای artifactهای ساخته‌شده، در laneهای chat/auth/model/http-plugin/runtime/startup تقسیم شده‌اند. سپس CI عادی فقط shardهای include-pattern زیرساخت ایزوله را در بسته‌های قطعیِ حداکثر 64 فایل آزمون بسته‌بندی می‌کند، که ماتریس Node را بدون ادغام مجموعه‌های command/cron غیرایزوله، agents-core دارای state، یا gateway/server کاهش می‌دهد؛ مجموعه‌های ثابت سنگین روی 8 vCPU می‌مانند، در حالی که laneهای بسته‌بندی‌شده و کم‌وزن‌تر از 4 vCPU استفاده می‌کنند. Pull requestها در مخزن canonical از یک برنامه پذیرش فشرده اضافی استفاده می‌کنند: همان گروه‌های per-config در subprocessهای ایزوله داخل برنامه فعلی 34-job Linux Node اجرا می‌شوند، بنابراین یک PR واحد کل ماتریس بیش از 70-job Node را ثبت نمی‌کند. pushهای `main`، dispatchهای دستی، و gateهای release ماتریس کامل را حفظ می‌کنند. آزمون‌های گسترده مرورگر، QA، رسانه، و pluginهای متفرقه به‌جای catch-all مشترک plugin، از پیکربندی‌های اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern ورودی‌های زمان‌بندی را با نام shard CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک config کامل را از یک shard فیلترشده تشخیص دهد. `check-additional-*` کار compile/canary مرز package را کنار هم نگه می‌دارد و معماری توپولوژی runtime را از پوشش gateway watch جدا می‌کند؛ فهرست guard مرزی به یک shard سنگین از نظر prompt و یک shard ترکیبی برای باقی stripeهای guard تقسیم می‌شود، که هرکدام guardهای مستقل منتخب را هم‌زمان اجرا می‌کنند و زمان‌بندی هر check را چاپ می‌کنند. بررسی پرهزینه drift snapshot prompt مسیر موفق Codex به‌عنوان job اضافی خودش فقط برای CI دستی و تغییرات اثرگذار بر prompt اجرا می‌شود، بنابراین تغییرات Node عادی و نامرتبط پشت تولید سرد snapshot prompt منتظر نمی‌مانند و shardهای مرزی متوازن می‌مانند، در حالی که prompt drift همچنان به PR ایجادکننده آن سنجاق می‌شود؛ همان flag تولید Vitest snapshot prompt را داخل shard ساخته‌شده core support-boundary نیز رد می‌کند. Gateway watch، آزمون‌های کانال، و shard core support-boundary پس از اینکه `dist/` و `dist-runtime/` از قبل ساخته شده‌اند، داخل `build-artifacts` هم‌زمان اجرا می‌شوند.

پس از پذیرش، CI canonical لینوکس تا 24 job آزمون Node هم‌زمان و
12 مورد برای laneهای کوچک‌تر fast/check مجاز می‌داند؛ Windows و Android روی دو می‌مانند چون
استخرهای runner آن‌ها محدودتر است.

برنامه PR فشرده برای مجموعه فعلی 18 job Node منتشر می‌کند: گروه‌های
whole-config در subprocessهای ایزوله با timeout دسته‌ای 120 دقیقه‌ای batch می‌شوند،
در حالی که گروه‌های include-pattern همان بودجه محدود job را به اشتراک می‌گذارند.

CI Android هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK دیباگ Play را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه ندارد؛ lane آزمون واحد آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، در حالی که از job بسته‌بندی APK دیباگ تکراری در هر push مرتبط با Android اجتناب می‌کند.

shard `check-dependencies`، `pnpm deadcode:dependencies` (یک pass فقط وابستگی Knip تولید که به آخرین نسخه Knip سنجاق شده است، با حداقل سن انتشار pnpm که برای نصب `dlx` غیرفعال شده) و `pnpm deadcode:unused-files` را اجرا می‌کند، که یافته‌های فایل استفاده‌نشده تولیدی Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard فایل استفاده‌نشده وقتی PR یک فایل استفاده‌نشده جدید و بررسی‌نشده اضافه کند یا یک ورودی stale allowlist باقی بگذارد fail می‌شود، در حالی که سطوح عمدی dynamic plugin، generated، build، live-test، و package bridge را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## هدایت فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت مقصد از فعالیت مخزن OpenClaw به ClawSweeper است. این workflow کد pull request نامطمئن را checkout یا اجرا نمی‌کند. workflow از `CLAWSWEEPER_APP_PRIVATE_KEY` یک token GitHub App می‌سازد، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق بررسی issue و pull request؛
- `clawsweeper_comment` برای فرمان‌های صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های بررسی در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که عامل ClawSweeper ممکن است بررسی کند.

lane `github_activity` فقط metadata نرمال‌شده را هدایت می‌کند: نوع event، action، actor، repository، شماره item، URL، عنوان، state، و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این lane عمدا از هدایت بدنه کامل webhook اجتناب می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper` برابر `.github/workflows/github-activity.yml` است، که event نرمال‌شده را برای عامل ClawSweeper به hook OpenClaw Gateway ارسال می‌کند.

فعالیت عمومی مشاهده است، نه تحویل به‌صورت پیش‌فرض. عامل ClawSweeper هدف Discord را در prompt خود دریافت می‌کند و فقط وقتی event غیرمنتظره، اقدام‌پذیر، پرریسک، یا از نظر عملیاتی مفید باشد باید در `#clawsweeper` پست کند. باز شدن‌ها، ویرایش‌ها، churn ربات، نویز webhook تکراری، و ترافیک review عادی باید به `NO_REPLY` منجر شوند.

در سراسر این مسیر، عنوان‌های GitHub، commentها، bodyها، متن review، نام branchها، و پیام‌های commit را داده نامطمئن تلقی کنید. آن‌ها ورودی برای خلاصه‌سازی و triage هستند، نه دستورالعمل برای workflow یا runtime عامل.

## dispatchهای دستی

dispatchهای دستی CI همان graph job مانند CI عادی را اجرا می‌کنند اما هر lane scoped غیر Android را روشن می‌کنند: shardهای Linux Node، shardهای bundled-plugin، shardهای قرارداد plugin و کانال، سازگاری Node 22، `check-*`، `check-additional-*`، بررسی‌های smoke artifact ساخته‌شده، بررسی‌های docs، Python skills، Windows، macOS، build iOS، و Control UI i18n. dispatchهای دستی مستقل CI فقط با `include_android=true` Android را اجرا می‌کنند؛ چتر release کامل با پاس دادن `include_android=true`، Android را فعال می‌کند. بررسی‌های static پیش‌انتشار plugin، shard فقط release یعنی `agentic-plugins`، sweep کامل دسته extension، و laneهای Docker پیش‌انتشار plugin از CI مستثنا هستند. مجموعه پیش‌انتشار Docker فقط وقتی اجرا می‌شود که `Full Release Validation` workflow جداگانه `Plugin Prerelease` را با gate اعتبارسنجی release فعال dispatch کند.

runهای دستی از یک concurrency group یکتا استفاده می‌کنند تا مجموعه کامل release-candidate با push یا run PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به یک فراخواننده trusted اجازه می‌دهد آن graph را علیه یک branch، tag، یا SHA کامل commit اجرا کند، در حالی که از فایل workflow از dispatch ref انتخاب‌شده استفاده می‌کند.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnerها

| Runner                          | Jobها                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | dispatch دستی CI و fallbackهای مخزن غیر canonical، اسکن‌های کیفیت CodeQL JavaScript/actions، workflow-sanity، labeler، auto-response، workflowهای docs خارج از CI، و install-smoke preflight تا ماتریس Blacksmith بتواند زودتر queue شود                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`، `security-fast`، shardهای کم‌وزن‌تر extension، `checks-fast-core`، shardهای قرارداد plugin/channel، بیشتر shardهای bundled/کم‌وزن‌تر Linux Node، `check-guards`، `check-prod-types`، `check-test-types`، shardهای منتخب `check-additional-*`، و `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | مجموعه‌های سنگین Linux Node که حفظ شده‌اند، shardهای سنگین از نظر boundary/extension مربوط به `check-additional-*`، و `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`، `check-lint` (به‌اندازه‌ای حساس به CPU که 8 vCPU بیشتر از مقداری که صرفه‌جویی کرد هزینه داشت)؛ buildهای Docker مربوط به install-smoke (زمان queue در 32-vCPU بیشتر از مقداری که صرفه‌جویی کرد هزینه داشت)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-15` fallback می‌کنند                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` و `ios-build` روی `openclaw/openclaw`؛ forkها به `macos-26` fallback می‌کنند                                                                                                                                                                                                  |

## بودجه ثبت runner

bucket فعلی ثبت runner در GitHub برای OpenClaw در `ghx api rate_limit` تعداد 10,000 ثبت runner خودمیزبان
در هر 5 دقیقه گزارش می‌کند. پیش از هر pass تنظیم، دوباره
`actions_runner_registration` را بررسی کنید، چون GitHub می‌تواند
این bucket را تغییر دهد. این limit توسط همه ثبت‌های Blacksmith runner در سازمان
`openclaw` به اشتراک گذاشته می‌شود، بنابراین افزودن یک نصب Blacksmith دیگر
bucket جدیدی اضافه نمی‌کند.

labelهای Blacksmith را منبع کمیاب کنترل burst تلقی کنید. jobهایی که
فقط route، notify، summarize، انتخاب shard، یا اسکن‌های کوتاه CodeQL اجرا می‌کنند باید
روی runnerهای میزبان GitHub بمانند مگر اینکه نیازهای اندازه‌گیری‌شده خاص Blacksmith داشته باشند.
هر ماتریس جدید Blacksmith، `max-parallel` بزرگ‌تر، یا
workflow پرتکرار باید تعداد ثبت بدترین حالت خود را نشان دهد و هدف سطح سازمان را
زیر حدود 60% bucket زنده نگه دارد. با bucket فعلی 10,000 ثبت،
این یعنی هدف عملیاتی 6,000 ثبت، با فضای اضافه برای
مخزن‌های هم‌زمان، retryها، و هم‌پوشانی burst.

CI مخزن canonical، Blacksmith را به‌عنوان مسیر runner پیش‌فرض برای runهای عادی push و pull-request نگه می‌دارد. `workflow_dispatch` و runهای مخزن غیر canonical از runnerهای میزبان GitHub استفاده می‌کنند، اما runهای canonical عادی در حال حاضر سلامت queue Blacksmith را probe نمی‌کنند یا وقتی Blacksmith در دسترس نیست به‌طور خودکار به labelهای میزبان GitHub fallback نمی‌کنند.

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## عملکرد OpenClaw

`OpenClaw Performance` گردش‌کار عملکرد محصول/زمان اجرا است. این گردش‌کار هر روز روی `main` اجرا می‌شود و می‌توان آن را دستی هم اجرا کرد:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

اجرای دستی معمولا مرجع گردش‌کار را بنچمارک می‌کند. برای بنچمارک کردن یک تگ انتشار یا شاخه‌ای دیگر با پیاده‌سازی فعلی گردش‌کار، `target_ref` را تنظیم کنید. مسیرهای گزارش منتشرشده و اشاره‌گرهای آخرین نسخه بر اساس مرجع آزمایش‌شده کلیدگذاری می‌شوند، و هر `index.md` مرجع/SHA آزمایش‌شده، مرجع/SHA گردش‌کار، مرجع Kova، پروفایل، حالت احراز هویت lane، مدل، تعداد تکرار، و فیلترهای سناریو را ثبت می‌کند.

این گردش‌کار OCM را از یک انتشار پین‌شده و Kova را از `openclaw/Kova` در ورودی پین‌شده `kova_ref` نصب می‌کند، سپس سه lane را اجرا می‌کند:

- `mock-provider`: سناریوهای تشخیصی Kova در برابر زمان اجرای ساخت محلی با احراز هویت جعلی قطعی و سازگار با OpenAI.
- `mock-deep-profile`: پروفایل‌گیری CPU/heap/trace برای نقاط داغ راه‌اندازی، Gateway، و نوبت عامل.
- `live-openai-candidate`: یک نوبت عامل واقعی OpenAI `openai/gpt-5.5`، که وقتی `OPENAI_API_KEY` در دسترس نباشد رد می‌شود.

lane مربوط به mock-provider پس از گذر Kova، پروب‌های منبع بومی OpenClaw را نیز اجرا می‌کند: زمان‌بندی بوت Gateway و حافظه در حالت‌های راه‌اندازی پیش‌فرض، hook، و ۵۰-Plugin؛ RSS وارد کردن Pluginهای همراه؛ حلقه‌های سلام تکرارشونده mock-OpenAI `channel-chat-baseline`؛ فرمان‌های راه‌اندازی CLI در برابر Gateway بوت‌شده؛ و پروب عملکرد smoke وضعیت SQLite. وقتی گزارش منبع mock-provider منتشرشده قبلی برای مرجع آزمایش‌شده در دسترس باشد، خلاصه منبع مقدارهای فعلی RSS و heap را با آن خط مبنا مقایسه می‌کند و افزایش‌های بزرگ RSS را با `watch` علامت‌گذاری می‌کند. خلاصه Markdown پروب منبع در بسته گزارش، در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر lane آرتیفکت‌های GitHub را بارگذاری می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، این گردش‌کار همچنین `report.json`، `report.md`، بسته‌ها، `index.md`، و آرتیفکت‌های پروب منبع را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` commit می‌کند. اشاره‌گر فعلی مرجع آزمایش‌شده به صورت `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` گردش‌کار چتری دستی برای «اجرای همه‌چیز پیش از انتشار» است. این گردش‌کار یک شاخه، تگ، یا SHA کامل commit را می‌پذیرد، گردش‌کار دستی `CI` را با آن هدف اجرا می‌کند، `Plugin Prerelease` را برای اثبات ویژه انتشارِ Plugin/بسته/ایستا/Docker اجرا می‌کند، و `OpenClaw Release Checks` را برای smoke نصب، پذیرش بسته، بررسی‌های بسته میان‌سیستمی، رندر کارت امتیاز بلوغ از شواهد پروفایل QA، همسانی QA Lab، Matrix، و laneهای Telegram اجرا می‌کند. پروفایل‌های پایدار و کامل همیشه پوشش جامع live/E2E و soak مسیر انتشار Docker را شامل می‌شوند؛ پروفایل بتا می‌تواند با `run_release_soak=true` آن را فعال کند. E2E کانونی بسته Telegram داخل Package Acceptance اجرا می‌شود، بنابراین یک نامزد کامل poller زنده تکراری شروع نمی‌کند. پس از انتشار، `release_package_spec` را بدهید تا بسته npm منتشرشده در سراسر بررسی‌های انتشار، Package Acceptance، Docker، میان‌سیستمی، و Telegram بدون ساخت دوباره استفاده شود. فقط برای اجرای مجدد متمرکز Telegram با بسته منتشرشده از `npm_telegram_package_spec` استفاده کنید. lane بسته زنده Plugin مربوط به Codex به طور پیش‌فرض از همان وضعیت انتخاب‌شده استفاده می‌کند: `release_package_spec=openclaw@<tag>` منتشرشده، `codex_plugin_spec=npm:@openclaw/codex@<tag>` را به دست می‌آورد، در حالی که اجراهای SHA/آرتیفکت، `extensions/codex` را از مرجع انتخاب‌شده بسته‌بندی می‌کنند. برای منابع سفارشی Plugin مانند مشخصات `npm:`، `npm-pack:`، یا `git:`، `codex_plugin_spec` را صریحا تنظیم کنید.

برای ماتریس مرحله‌ها، نام دقیق jobهای گردش‌کار، تفاوت‌های پروفایل، آرتیفکت‌ها، و handleهای اجرای مجدد متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` گردش‌کار دستی جهش‌دهنده انتشار است. پس از وجود تگ انتشار و پس از موفقیت preflight مربوط به npm در OpenClaw، آن را از `release/YYYY.M.PATCH` یا `main` اجرا کنید. این گردش‌کار `pnpm plugins:sync:check` را بررسی می‌کند، `Plugin NPM Release` را برای همه بسته‌های Plugin قابل انتشار اجرا می‌کند، `Plugin ClawHub Release` را برای همان SHA انتشار اجرا می‌کند، و فقط بعد از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده اجرا می‌کند. انتشار پایدار همچنین به یک `windows_node_tag` دقیق نیاز دارد؛ این گردش‌کار پیش از هر فرزند انتشار، انتشار منبع Windows را بررسی می‌کند و نصب‌کننده‌های x64/ARM64 آن را با ورودی تاییدشده نامزد `windows_node_installer_digests` مقایسه می‌کند، سپس همان digestهای پین‌شده نصب‌کننده به‌علاوه آرتیفکت همراه دقیق و قرارداد checksum را پیش از انتشار پیش‌نویس انتشار GitHub ترویج و تایید می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات commit پین‌شده روی شاخه‌ای که سریع تغییر می‌کند، به جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

مرجع‌های dispatch گردش‌کار GitHub باید شاخه یا تگ باشند، نه SHA خام commit. این helper یک شاخه موقت `release-ci/<sha>-...` را در SHA هدف push می‌کند، `Full Release Validation` را از آن مرجع پین‌شده اجرا می‌کند، بررسی می‌کند که `headSha` هر گردش‌کار فرزند با هدف مطابقت داشته باشد، و پس از کامل شدن اجرا، شاخه موقت را حذف می‌کند. verifier چتری همچنین اگر هر گردش‌کار فرزند روی SHA متفاوتی اجرا شده باشد fail می‌شود.

`release_profile` گستره live/provider ارسال‌شده به بررسی‌های انتشار را کنترل می‌کند. گردش‌کارهای دستی انتشار به طور پیش‌فرض `stable` هستند؛ فقط وقتی عمدا ماتریس گسترده مشورتی provider/media را می‌خواهید از `full` استفاده کنید. بررسی‌های انتشار پایدار و کامل همیشه soak جامع live/E2E و Docker مسیر انتشار را اجرا می‌کنند؛ پروفایل بتا می‌تواند با `run_release_soak=true` آن را فعال کند.

- `minimum` سریع‌ترین laneهای حیاتی انتشار OpenAI/هسته را نگه می‌دارد.
- `stable` مجموعه پایدار provider/backend را اضافه می‌کند.
- `full` ماتریس گسترده مشورتی provider/media را اجرا می‌کند.

چتر، شناسه‌های اجرای فرزند dispatch‌شده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین jobها را برای هر اجرای فرزند اضافه می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط job verifier والد را دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` از `rerun_group` پشتیبانی می‌کنند. برای یک نامزد انتشار از `all`، فقط برای فرزند CI کامل عادی از `ci`، فقط برای فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای مجدد یک جعبه انتشار fail‌شده را پس از یک fix متمرکز محدود نگه می‌دارد. برای یک lane میان‌سیستمی fail‌شده، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ فرمان‌های طولانی میان‌سیستمی خط‌های Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade شامل زمان‌بندی هر فاز هستند. laneهای بررسی انتشار QA مشورتی هستند، به‌جز gate پوشش ابزار زمان اجرای استاندارد، که وقتی ابزارهای پویای OpenClaw مورد نیاز از خلاصه tier استاندارد منحرف شوند یا ناپدید شوند، مسدود می‌کند.

`OpenClaw Release Checks` از مرجع گردش‌کار مورد اعتماد استفاده می‌کند تا مرجع انتخاب‌شده را یک‌بار به یک tarball با نام `release-package-under-test` resolve کند، سپس آن آرتیفکت را به بررسی‌های میان‌سیستمی و Package Acceptance، و همچنین به گردش‌کار Docker مسیر انتشار live/E2E هنگام اجرای پوشش soak، می‌فرستد. این کار byteهای بسته را در سراسر جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوباره همان نامزد در چندین job فرزند جلوگیری می‌کند. برای lane زنده npm-Plugin مربوط به Codex، بررسی‌های انتشار یا یک مشخصات Plugin منتشرشده همسان مشتق‌شده از `release_package_spec` را می‌فرستند، یا `codex_plugin_spec` ارائه‌شده توسط operator را می‌فرستند، یا ورودی را خالی می‌گذارند تا اسکریپت Docker، Plugin مربوط به Codex را از checkout انتخاب‌شده بسته‌بندی کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all` چتر قدیمی‌تر را جایگزین می‌کنند. مانیتور والد وقتی والد لغو شود هر گردش‌کار فرزندی را که قبلا dispatch کرده است لغو می‌کند، بنابراین اعتبارسنجی جدیدتر main پشت یک اجرای کهنه دو ساعته release-check معطل نمی‌ماند. اعتبارسنجی شاخه/تگ انتشار و گروه‌های اجرای مجدد متمرکز، `cancel-in-progress: false` را نگه می‌دارند.

## shardهای Live و E2E

فرزند live/E2E انتشار، پوشش گسترده بومی `pnpm test:live` را نگه می‌دارد، اما آن را به جای یک job سریالی، به عنوان shardهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobهای provider-filtered `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shardهای جداگانه صوت/ویدئوی رسانه و shardهای موسیقی provider-filtered

این کار همان پوشش فایل را نگه می‌دارد، در حالی که اجرای مجدد و تشخیص fail شدن‌های کند provider زنده را آسان‌تر می‌کند. نام‌های shard تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` برای اجراهای مجدد دستی یک‌باره همچنان معتبر می‌مانند.

shardهای رسانه بومی زنده در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند، که توسط گردش‌کار `Live Media Runner Image` ساخته شده است. آن image، `ffmpeg` و `ffprobe` را از پیش نصب می‌کند؛ jobهای رسانه فقط پیش از setup باینری‌ها را بررسی می‌کنند. suiteهای زنده متکی به Docker را روی runnerهای عادی Blacksmith نگه دارید؛ jobهای container جای درستی برای اجرای تست‌های Docker تودرتو نیستند.

شاردهای مدل/بک‌اند زنده‌ی پشتیبانی‌شده با Docker برای هر کامیت انتخاب‌شده از یک ایمیج مشترک جداگانه‌ی `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. گردش‌کار انتشار زنده آن ایمیج را یک‌بار می‌سازد و push می‌کند، سپس شاردهای مدل زنده‌ی Docker، Gateway شاردشده بر اساس provider، بک‌اند CLI، اتصال ACP، و harness مربوط به Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. شاردهای Docker مربوط به Gateway در سطح اسکریپت سقف‌های صریح `timeout` دارند که پایین‌تر از timeout کار گردش‌کار است، تا یک کانتینر گیرکرده یا مسیر پاک‌سازی، به‌جای مصرف کل بودجه‌ی بررسی انتشار، سریع شکست بخورد. اگر این شاردها هدف Docker کاملِ سورس را مستقل بازسازی کنند، اجرای انتشار بد پیکربندی شده است و زمان واقعی را برای ساخت‌های تکراری ایمیج هدر می‌دهد.

## پذیرش بسته

از `Package Acceptance` زمانی استفاده کنید که پرسش این است: «آیا این بسته‌ی نصب‌پذیر OpenClaw به‌عنوان یک محصول کار می‌کند؟» این با CI عادی فرق دارد: CI عادی درخت سورس را اعتبارسنجی می‌کند، درحالی‌که پذیرش بسته یک tarball واحد را از همان harness سرتاسری Docker عبور می‌دهد که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند.

### کارها

1. `resolve_package`، `workflow_ref` را checkout می‌کند، یک کاندیدای بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` آپلود می‌کند، و منبع، ref گردش‌کار، ref بسته، نسخه، SHA-256، و profile را در خلاصه‌ی گام GitHub چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار قابل‌استفاده‌ی مجدد آن artifact را دانلود می‌کند، موجودی tarball را اعتبارسنجی می‌کند، در صورت نیاز ایمیج‌های Docker مبتنی بر digest بسته را آماده می‌کند، و laneهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout گردش‌کار، در برابر همان بسته اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب کند، گردش‌کار قابل‌استفاده‌ی مجدد بسته و ایمیج‌های مشترک را یک‌بار آماده می‌کند، سپس آن laneها را به‌صورت کارهای Docker هدفمندِ موازی با artifactهای یکتا پخش می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و اگر پذیرش بسته یکی را resolve کرده باشد، همان artifact با نام `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده‌ی npm را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker، یا lane اختیاری Telegram شکست خورده باشد، گردش‌کار را fail می‌کند.

### منابع کاندیدا

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه‌ی دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش نسخه‌های prerelease/stable منتشرشده استفاده کنید.
- `source=ref` یک branch، tag، یا SHA کامل کامیتِ مورد اعتماد در `package_ref` را بسته‌بندی می‌کند. resolver، branchها/tagهای OpenClaw را fetch می‌کند، تأیید می‌کند که کامیت انتخاب‌شده از تاریخچه‌ی branch مخزن یا یک tag انتشار قابل‌دسترسی است، dependencyها را در یک worktree جدا نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` عمومی HTTPS را دانلود می‌کند؛ `package_sha256` الزامی است. این مسیر credentialهای URL، پورت‌های HTTPS غیرپیش‌فرض، hostnameها یا IPهای resolveشده‌ی خصوصی/داخلی/کاربرد ویژه، و redirectهای خارج از همان سیاست ایمنی عمومی را رد می‌کند.
- `source=trusted-url` یک `.tgz` مربوط به HTTPS را از یک سیاست trusted-source نام‌گذاری‌شده در `.github/package-trusted-sources.json` دانلود می‌کند؛ `package_sha256` و `trusted_source_id` الزامی هستند. فقط برای mirrorهای سازمانی متعلق به maintainer یا مخزن‌های بسته‌ی خصوصی که به hostها، پورت‌ها، prefixهای مسیر، hostهای redirect، یا resolve شبکه‌ی خصوصی پیکربندی‌شده نیاز دارند از این استفاده کنید. اگر سیاست bearer auth را اعلام کند، گردش‌کار از secret ثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN` استفاده می‌کند؛ credentialهای تعبیه‌شده در URL همچنان رد می‌شوند.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای artifactهایی که بیرونی به اشتراک گذاشته می‌شوند باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد مورد اعتماد گردش‌کار/harness است که تست را اجرا می‌کند. `package_ref` کامیت سورسی است که هنگام `source=ref` بسته‌بندی می‌شود. این اجازه می‌دهد harness تست فعلی، کامیت‌های سورس مورد اعتماد قدیمی‌تر را بدون اجرای منطق گردش‌کار قدیمی اعتبارسنجی کند.

### profileهای suite

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `skill-install`، `update-corrupt-plugin`، `upgrade-survivor`، `published-upgrade-survivor`، `update-restart-auth`، `plugins-offline`، `plugin-update`
- `product` — `package` به‌علاوه‌ی `mcp-channels`، `cron-mcp-cleanup`، `openai-web-search-minimal`، `openwebui`
- `full` — قطعه‌های کامل مسیر انتشار Docker همراه با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد الزامی است

profile مربوط به `package` از پوشش آفلاین Plugin استفاده می‌کند تا اعتبارسنجی بسته‌ی منتشرشده وابسته به در دسترس بودن زنده‌ی ClawHub نباشد. lane اختیاری Telegram از artifact با نام `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، درحالی‌که مسیر spec منتشرشده‌ی npm برای dispatchهای مستقل حفظ می‌شود.

برای سیاست اختصاصی تست به‌روزرسانی و Plugin، شامل فرمان‌های محلی،
laneهای Docker، ورودی‌های پذیرش بسته، پیش‌فرض‌های انتشار، و triage شکست،
[تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار، پذیرش بسته را با `source=artifact`، artifact بسته‌ی انتشار آماده‌شده، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار اثبات مهاجرت بسته، به‌روزرسانی، نصب زنده‌ی Skill از ClawHub، پاک‌سازی dependencyهای stale مربوط به Plugin، تعمیر نصب Plugin پیکربندی‌شده، Plugin آفلاین، به‌روزرسانی Plugin، و Telegram را روی همان tarball بسته‌ی resolveشده نگه می‌دارد. پس از انتشار یک beta، `release_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید تا همان ماتریس را بدون بازسازی، در برابر بسته‌ی npm منتشرشده اجرا کند؛ فقط وقتی پذیرش بسته به بسته‌ای متفاوت از بقیه‌ی اعتبارسنجی انتشار نیاز دارد `package_acceptance_package_spec` را تنظیم کنید. بررسی‌های انتشار بین‌سیستم‌عاملی همچنان onboarding، installer، و رفتارهای مختص پلتفرم را پوشش می‌دهند؛ اعتبارسنجی محصول برای بسته/به‌روزرسانی باید با پذیرش بسته شروع شود. lane مربوط به Docker با نام `published-upgrade-survivor` در مسیر مسدودکننده‌ی انتشار، در هر اجرا یک baseline بسته‌ی منتشرشده را اعتبارسنجی می‌کند. در پذیرش بسته، tarball resolveشده‌ی `package-under-test` همیشه کاندیداست و `published_upgrade_survivor_baseline` baseline منتشرشده‌ی fallback را انتخاب می‌کند که پیش‌فرض آن `openclaw@latest` است؛ فرمان‌های rerun برای lane شکست‌خورده آن baseline را حفظ می‌کنند. Full Release Validation با `run_release_soak=true` یا `release_profile=full`، `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا در چهار انتشار stable اخیر npm به‌علاوه‌ی انتشارهای ثابت‌شده‌ی مرز سازگاری Plugin و fixtureهای issue-shaped برای config مربوط به Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده‌ی OpenClaw، مسیرهای log با tilde، و ریشه‌های stale dependency مربوط به Pluginهای legacy گسترش یابد. انتخاب‌های چند-baseline برای published-upgrade survivor بر اساس baseline به کارهای جداگانه‌ی Docker runner هدفمند شارد می‌شوند. گردش‌کار جداگانه‌ی `Update Migration` وقتی استفاده می‌شود که پرسش، پاک‌سازی جامع به‌روزرسانی‌های منتشرشده باشد، نه گستره‌ی عادی CI کامل انتشار؛ این گردش‌کار lane Docker با نام `update-migration` را با `all-since-2026.4.23` و `plugin-deps-cleanup` به‌کار می‌برد. اجراهای تجمیعی محلی می‌توانند specهای دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` پاس بدهند، با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` یک lane واحد مانند `openclaw@2026.4.15` نگه دارند، یا برای ماتریس سناریو `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را تنظیم کنند. lane منتشرشده baseline را با یک recipe پخته‌شده‌ی فرمان `openclaw config set` پیکربندی می‌کند، گام‌های recipe را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz`، به‌علاوه‌ی وضعیت RPC را probe می‌کند. laneهای تازه‌ی بسته‌بندی‌شده و installer مربوط به Windows همچنین تأیید می‌کنند که یک بسته‌ی نصب‌شده می‌تواند override کنترل مرورگر را از یک مسیر خام مطلق Windows import کند. smoke مربوط به agent-turn بین‌سیستم‌عاملی OpenAI اگر `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد از آن استفاده می‌کند، وگرنه از `openai/gpt-5.5`، تا اثبات نصب و Gateway روی یک مدل تست GPT-5 بماند و در عین حال از پیش‌فرض‌های GPT-4.x پرهیز شود.

### پنجره‌های سازگاری legacy

پذیرش بسته برای بسته‌های ازپیش‌منتشرشده پنجره‌های محدود سازگاری legacy دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- entryهای خصوصی شناخته‌شده‌ی QA در `dist/postinstall-inventory.json` ممکن است به فایل‌های حذف‌شده از tarball اشاره کنند؛
- `doctor-switch` وقتی بسته آن flag را expose نکند، ممکن است subcase مربوط به persistence در `gateway install --wrapper` را رد کند؛
- `update-channel-switch` ممکن است `patchedDependencies` گم‌شده‌ی pnpm را از fixture جعلی git مشتق‌شده از tarball prune کند و ممکن است `update.channel` persistشده‌ی گم‌شده را log کند؛
- smokeهای Plugin ممکن است locationهای legacy مربوط به install-record را بخوانند یا persistence گم‌شده‌ی install-record مربوط به marketplace را بپذیرند؛
- `plugin-update` ممکن است مهاجرت metadata پیکربندی را اجازه دهد، درحالی‌که همچنان الزام می‌کند install record و رفتار no-reinstall بدون تغییر بمانند.

بسته‌ی منتشرشده‌ی `2026.4.26` همچنین ممکن است برای فایل‌های stamp مربوط به metadata ساخت محلی که قبلاً منتشر شده بودند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا skip، شکست می‌خورند.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

هنگام debug کردن یک اجرای شکست‌خورده‌ی پذیرش بسته، از خلاصه‌ی `resolve_package` شروع کنید تا منبع بسته، نسخه، و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و artifactهای Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، logهای lane، زمان‌بندی‌های phase، و فرمان‌های rerun. به‌جای اجرای دوباره‌ی اعتبارسنجی کامل انتشار، اجرای دوباره‌ی profile بسته‌ی شکست‌خورده یا laneهای دقیق Docker را ترجیح دهید.

## smoke نصب

گردش‌کار جداگانه‌ی `Install Smoke` همان اسکریپت scope را از طریق کار `preflight` خودش دوباره استفاده می‌کند. این گردش‌کار پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull request‌هایی اجرا می‌شود که سطح‌های Docker/package، تغییرات package/manifest مربوط به Plugin بسته‌بندی‌شده، یا سطح‌های core plugin/channel/gateway/Plugin SDK را که کارهای Docker smoke اجرا می‌کنند لمس می‌کنند. تغییرات فقط-منبع در Plugin بسته‌بندی‌شده، ویرایش‌های فقط-تست، و ویرایش‌های فقط-مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع image مربوط به Dockerfile ریشه را یک بار می‌سازد، CLI را بررسی می‌کند، smoke مربوط به CLI حذف agents در shared-workspace را اجرا می‌کند، e2e مربوط به container gateway-network را اجرا می‌کند، یک build arg برای extension بسته‌بندی‌شده را تأیید می‌کند، و پروفایل Docker محدودشده‌ی bundled-plugin را زیر یک timeout تجمیعی ۲۴۰ ثانیه‌ای برای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود شده است).
- **مسیر کامل** پوشش نصب package مربوط به QR و Docker/update نصب‌کننده را برای اجراهای زمان‌بندی‌شده‌ی شبانه، dispatchهای دستی، بررسی‌های release از نوع workflow-call، و pull requestهایی که واقعاً سطح‌های installer/package/Docker را لمس می‌کنند نگه می‌دارد. در حالت کامل، install-smoke یک image smoke مربوط به GHCR root Dockerfile با target-SHA واحد را آماده یا بازاستفاده می‌کند، سپس نصب package مربوط به QR، smokeهای root Dockerfile/gateway، smokeهای installer/update، و Docker E2E سریع bundled-plugin را به‌صورت jobهای جداگانه اجرا می‌کند تا کار نصب‌کننده پشت smokeهای image ریشه منتظر نماند.

pushهای `main` (از جمله merge commitها) مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق changed-scope روی یک push پوشش کامل را درخواست کند، workflow همان Docker smoke سریع را نگه می‌دارد و smoke نصب کامل را به اعتبارسنجی شبانه یا release واگذار می‌کند.

smoke کند نصب سراسری Bun برای image-provider به‌صورت جداگانه با `run_bun_global_install_smoke` gate می‌شود. این smoke روی زمان‌بندی شبانه و از workflow بررسی‌های release اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` آن را اجرا نمی‌کنند. CI معمول PR همچنان lane رگرسیون سریع launcher مربوط به Bun را برای تغییرات مرتبط با Node اجرا می‌کند. تست‌های Docker مربوط به QR و installer، Dockerfileهای install-focused خودشان را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک image مشترک live-test را از قبل می‌سازد، OpenClaw را یک بار به‌صورت npm tarball بسته‌بندی می‌کند، و دو image مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner خام Node/Git برای laneهای installer/update/plugin-dependency؛
- یک image کاربردی که همان tarball را برای laneهای عملکردی معمول در `/app` نصب می‌کند.

تعریف laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، image را برای هر lane انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیم‌پذیرها

| متغیر                                 | پیش‌فرض | هدف                                                                                           |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای pool اصلی برای laneهای معمول.                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | سقف laneهای نصب npm هم‌زمان.                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای multi-service هم‌زمان.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع laneها برای جلوگیری از create storm در Docker daemon؛ برای بدون فاصله‌گذاری، `0` تنظیم کنید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout fallback برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` plan مربوط به scheduler را بدون اجرای laneها چاپ می‌کند.                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق laneها، جداشده با کاما؛ cleanup smoke را رد می‌کند تا agentها بتوانند یک lane شکست‌خورده را بازتولید کنند. |

lane‌ای که از سقف مؤثر خود سنگین‌تر باشد همچنان می‌تواند از یک pool خالی شروع شود، سپس تنها اجرا می‌شود تا ظرفیت را آزاد کند. preflight تجمیعی محلی Docker را بررسی می‌کند، containerهای کهنه‌ی OpenClaw E2E را حذف می‌کند، وضعیت active-lane را منتشر می‌کند، زمان‌بندی laneها را برای مرتب‌سازی longest-first پایدار می‌کند، و به‌صورت پیش‌فرض پس از نخستین failure زمان‌بندی laneهای pooled جدید را متوقف می‌کند.

### workflow قابل‌بازاستفاده‌ی live/E2E

workflow قابل‌بازاستفاده‌ی live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد کدام package، نوع image، live image، lane، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به outputها و summaryهای GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا artifact مربوط به package در اجرای فعلی را دانلود می‌کند، یا artifact مربوط به package را از `package_artifact_run_id` دانلود می‌کند؛ inventory tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای package-installed نیاز داشته باشد، imageهای Docker E2E خام/کاربردی GHCR با tag مبتنی بر package-digest را از طریق cache لایه Docker در Blacksmith می‌سازد و push می‌کند؛ و به‌جای build دوباره، inputهای ارائه‌شده‌ی `docker_e2e_bare_image`/`docker_e2e_functional_image` یا imageهای موجود مبتنی بر package-digest را بازاستفاده می‌کند. pullهای image مربوط به Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش retry می‌شوند تا stream گیرکرده‌ی registry/cache، به‌جای مصرف بیشتر مسیر بحرانی CI، سریع retry شود.

### chunkهای مسیر release

پوشش Docker مربوط به release، jobهای کوچک‌تر chunk شده را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع image موردنیاز خود را pull کند و چندین lane را از طریق همان scheduler وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunkهای فعلی Docker مربوط به release عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `package-update-openai` شامل lane package مربوط به Plugin live Codex است که package نامزد OpenClaw را نصب می‌کند، Plugin مربوط به Codex را از `codex_plugin_spec` یا یک tarball هم‌ref با تأیید صریح نصب Codex CLI نصب می‌کند، preflight مربوط به Codex CLI را اجرا می‌کند، سپس چندین turn مربوط به agent هم‌نشست OpenClaw را در برابر OpenAI اجرا می‌کند. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای تجمیعی plugin/runtime باقی می‌مانند. alias مربوط به lane `install-e2e` همچنان alias تجمیعی بازاجرای دستی برای هر دو lane نصب‌کننده‌ی provider است.

OpenWebUI زمانی که پوشش کامل release-path آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و chunk مستقل `openwebui` را فقط برای dispatchهای فقط-OpenWebUI نگه می‌دارد. laneهای update مربوط به bundled-channel برای failureهای گذرای شبکه npm یک بار retry می‌کنند.

هر chunk، `.artifacts/docker-tests/` را با logهای lane، timingها، `summary.json`، `failures.json`، timingهای phase، JSON مربوط به plan scheduler، جدول‌های slow-lane، و فرمان‌های rerun برای هر lane upload می‌کند. input مربوط به `docker_lanes` در workflow، laneهای انتخاب‌شده را به‌جای jobهای chunk در برابر imageهای آماده اجرا می‌کند؛ این کار debugging lane شکست‌خورده را به یک job Docker هدفمند محدود می‌کند و artifact مربوط به package را برای آن اجرا آماده، دانلود، یا بازاستفاده می‌کند؛ اگر lane انتخاب‌شده یک lane live Docker باشد، job هدفمند image مربوط به live-test را برای آن rerun به‌صورت محلی می‌سازد. فرمان‌های rerun تولیدشده‌ی GitHub برای هر lane، وقتی این مقادیر وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name`، و inputهای image آماده هستند، تا lane شکست‌خورده بتواند همان package و imageهای دقیق اجرای شکست‌خورده را بازاستفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow زمان‌بندی‌شده‌ی live/E2E هر روز suite کامل Docker مربوط به release-path را اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش product/package پرهزینه‌تری است، بنابراین workflow جداگانه‌ای است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. pull requestهای معمول، pushهای `main`، و dispatchهای دستی مستقل CI این suite را خاموش نگه می‌دارند. این workflow تست‌های Plugin بسته‌بندی‌شده را بین هشت worker مربوط به extension متوازن می‌کند؛ آن jobهای shard مربوط به extension هم‌زمان تا دو گروه config مربوط به Plugin را با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin سنگین از نظر import، jobهای CI اضافی ایجاد نکنند. مسیر فقط-release مربوط به Docker prerelease، laneهای Docker هدفمند را در گروه‌های کوچک batch می‌کند تا برای jobهای یک تا سه دقیقه‌ای ده‌ها runner رزرو نشود. این workflow همچنین یک artifact اطلاع‌رسانی `plugin-inspector-advisory` را از `@openclaw/plugin-inspector` upload می‌کند؛ یافته‌های inspector ورودی triage هستند و gate مسدودکننده‌ی Plugin Prerelease را تغییر نمی‌دهند.

## آزمایشگاه QA

آزمایشگاه QA laneهای CI اختصاصی خارج از workflow اصلی smart-scoped دارد. برابری agentic زیر harnessهای گسترده‌ی QA و release قرار می‌گیرد، نه یک workflow مستقل PR. وقتی برابری باید همراه یک اجرای اعتبارسنجی گسترده باشد، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- workflow مربوط به `QA-Lab - All Lanes` هر شب روی `main` و در dispatch دستی اجرا می‌شود؛ این workflow lane برابری mock، lane live Matrix، و laneهای live Telegram و Discord را به‌صورت jobهای موازی fan out می‌کند. jobهای live از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های release، laneهای transport live مربوط به Matrix و Telegram را با provider mock قطعی و modelهای واجد شرایط mock (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد channel از latency مدل live و startup معمول provider-plugin جدا شود. gateway مربوط به transport live، جست‌وجوی memory را غیرفعال می‌کند چون QA parity رفتار memory را جداگانه پوشش می‌دهد؛ اتصال provider توسط suiteهای جداگانه‌ی live model، native provider، و Docker provider پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و release از `--profile fast` استفاده می‌کند و فقط زمانی `--fail-fast` را اضافه می‌کند که CLI checkout شده از آن پشتیبانی کند. پیش‌فرض CLI و input دستی workflow همچنان `all` است؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای release-critical مربوط به آزمایشگاه QA را پیش از تأیید release اجرا می‌کند؛ gate مربوط به QA parity، packهای candidate و baseline را به‌صورت jobهای lane موازی اجرا می‌کند، سپس هر دو artifact را در یک job گزارش کوچک دانلود می‌کند تا مقایسه نهایی برابری انجام شود.

برای PRهای معمول، به‌جای اینکه parity را یک status الزامی بدانید، از شواهد CI/check محدود به scope پیروی کنید.

## CodeQL

workflow مربوط به `CodeQL` عمداً یک scanner امنیتی محدود برای گذر اول است، نه sweep کامل repository. اجراهای guard روزانه، دستی، و pull requestهای non-draft، کد workflowهای Actions به‌علاوه‌ی پرریسک‌ترین سطح‌های JavaScript/TypeScript را با queryهای امنیتی high-confidence که به `security-severity` بالا/بحرانی فیلتر شده‌اند scan می‌کنند.

guard مربوط به pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، `scripts`، `src`، یا مسیرهای runtime مربوط به Plugin بسته‌بندی‌شده‌ی مالک فرایند شروع می‌شود، و همان matrix امنیتی high-confidence را مثل workflow زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS خارج از پیش‌فرض‌های PR می‌مانند.

### دسته‌بندی‌های امنیتی

| دسته‌بندی                                          | سطح                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth، اسرار، sandbox، cron، و خط پایه gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته، به‌همراه زمان‌اجرای Plugin کانال، gateway، Plugin SDK، اسرار، نقاط تماس حسابرسی              |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF هسته، تجزیه IP، محافظ شبکه، web-fetch، و سطوح سیاست SSRF در Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، کمک‌گرهای اجرای فرایند، تحویل خروجی، و گیت‌های اجرای ابزار عامل                                           |
| `/codeql-security-high/process-exec-boundary`     | پوسته محلی، کمک‌گرهای ایجاد فرایند، زمان‌اجراهای Plugin بسته‌بندی‌شده که مالک زیرفرایند هستند، و چسب اسکریپت workflow                             |
| `/codeql-security-high/plugin-trust-boundary`     | نصب Plugin، loader، manifest، registry، نصب package-manager، بارگذاری منبع، و سطوح اعتماد قرارداد بسته Plugin SDK |

### شاردهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — شارد امنیتی زمان‌بندی‌شده Android. برنامه Android را برای CodeQL روی کوچک‌ترین اجراکننده Blacksmith Linux که توسط سنجش سلامت workflow پذیرفته می‌شود، به‌صورت دستی می‌سازد. خروجی‌ها را زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — شارد امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL روی Blacksmith macOS به‌صورت دستی می‌سازد، نتایج ساخت وابستگی را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده است، چون ساخت macOS حتی وقتی پاک است بر زمان اجرا غالب می‌شود.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` شارد غیرامنیتی متناظر است. فقط پرس‌وجوهای کیفیت JavaScript/TypeScript با شدت خطا و غیرامنیتی را روی سطوح باریک و پرارزش در اجراکننده‌های Linux میزبانی‌شده در GitHub اجرا می‌کند تا اسکن‌های کیفیت بودجه ثبت اجراکننده Blacksmith را مصرف نکنند. گارد pull request آن عمدا کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیر draft فقط شاردهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای کد اجرای فرمان/مدل/ابزار عامل و ارسال پاسخ، کد schema/مهاجرت/IO پیکربندی، کد auth/اسرار/sandbox/امنیت، زمان‌اجرای Plugin کانال هسته و کانال بسته‌بندی‌شده، protocol/server-method در gateway، چسب زمان‌اجرای حافظه/SDK، MCP/فرایند/تحویل خروجی، کاتالوگ زمان‌اجرای provider/model، صف‌های تشخیص/تحویل نشست، loader Plugin، قرارداد Plugin SDK/package، یا تغییرات زمان‌اجرای پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و workflow کیفیت، هر دوازده شارد کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های باریک، قلاب‌های آموزش/تکرار برای اجرای یک شارد کیفیت به‌صورت جداگانه هستند.

| دسته‌بندی                                                | سطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد auth، اسرار، sandbox، cron، و مرز امنیتی gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema، مهاجرت، نرمال‌سازی، و IO پیکربندی                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای پروتکل Gateway و قراردادهای متد سرور                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی Plugin کانال هسته و کانال بسته‌بندی‌شده                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای فرمان، ارسال model/provider، ارسال و صف‌های پاسخ خودکار، و قراردادهای زمان‌اجرای control-plane در ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، کمک‌گرهای نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، facadeهای زمان‌اجرای حافظه، aliasهای حافظه در Plugin SDK، چسب فعال‌سازی زمان‌اجرای حافظه، و فرمان‌های doctor حافظه                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | اجزای داخلی صف پاسخ، صف‌های تحویل نشست، کمک‌گرهای binding/تحویل نشست خروجی، سطوح رویداد تشخیصی/بسته log، و قراردادهای CLI مربوط به doctor نشست |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | ارسال پاسخ ورودی Plugin SDK، payload پاسخ/قطعه‌بندی/کمک‌گرهای زمان‌اجرا، گزینه‌های پاسخ کانال، صف‌های تحویل، و کمک‌گرهای binding نشست/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، auth و کشف provider، ثبت زمان‌اجرای provider، پیش‌فرض‌ها/کاتالوگ‌های provider، و registryهای web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap رابط کاربری کنترل، ماندگاری محلی، جریان‌های کنترل gateway، و قراردادهای زمان‌اجرای control-plane وظیفه                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | fetch/search وب هسته، IO رسانه، درک رسانه، تولید تصویر، و قراردادهای زمان‌اجرای تولید رسانه                                                    |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای loader، registry، سطح عمومی، و entrypoint در Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع Plugin SDK سمت بسته منتشرشده و کمک‌گرهای قرارداد بسته plugin                                                                                      |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند بدون مبهم‌کردن سیگنال امنیتی، زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و plugin بسته‌بندی‌شده باید فقط پس از آنکه پروفایل‌های باریک زمان‌اجرا و سیگنال پایدار داشتند، به‌عنوان کار پیگیری scoped یا sharded دوباره اضافه شود.

## workflowهای نگهداشت

### عامل مستندات

workflow `Docs Agent` یک مسیر نگهداشت Codex رویدادمحور برای هم‌راستا نگه‌داشتن مستندات موجود با تغییرات تازه land شده است. برنامه زمان‌بندی خالص ندارد: یک اجرای CI موفق push غیر bot روی `main` می‌تواند آن را trigger کند، و dispatch دستی می‌تواند آن را مستقیما اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلوتر رفته باشد یا وقتی اجرای Docs Agent غیر skipped دیگری در ساعت گذشته ایجاد شده باشد، skip می‌شوند. وقتی اجرا می‌شود، بازه commit را از SHA منبع Docs Agent غیر skipped قبلی تا `main` فعلی بررسی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### عامل عملکرد تست

workflow `Test Performance Agent` یک مسیر نگهداشت Codex رویدادمحور برای تست‌های کند است. برنامه زمان‌بندی خالص ندارد: یک اجرای CI موفق push غیر bot روی `main` می‌تواند آن را trigger کند، اما اگر فراخوانی workflow-run دیگری در همان روز UTC قبلا اجرا شده باشد یا در حال اجرا باشد، skip می‌شود. dispatch دستی از آن گیت فعالیت روزانه عبور می‌کند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای کل مجموعه می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک عملکرد تست که پوشش را حفظ می‌کنند انجام دهد نه refactorهای گسترده، سپس گزارش کل مجموعه را دوباره اجرا می‌کند و تغییراتی را که شمار پایه تست‌های passing را کاهش دهند رد می‌کند. گزارش گروه‌بندی‌شده زمان دیواری هر config و بیشینه RSS را روی Linux و macOS ثبت می‌کند، بنابراین مقایسه قبل/بعد، دلتاهای حافظه تست را کنار دلتاهای مدت‌زمان نشان می‌دهد. اگر baseline تست‌های failing داشته باشد، Codex فقط می‌تواند failureهای آشکار را اصلاح کند و گزارش کل مجموعه پس از agent باید قبل از commit شدن هر چیزی pass شود. وقتی `main` پیش از land شدن push بات جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را retry می‌کند؛ patchهای stale دارای conflict skip می‌شوند. از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo عامل مستندات را حفظ کند.

### PRهای تکراری پس از Merge

workflow `Duplicate PRs After Merge` یک workflow دستی نگه‌دارنده برای پاک‌سازی تکراری‌ها پس از land است. پیش‌فرض آن dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتا فهرست‌شده را می‌بندد. پیش از mutate کردن GitHub، تأیید می‌کند که PR land شده merge شده است و هر duplicate یا issue ارجاع‌شده مشترک دارد یا hunkهای تغییر یافته هم‌پوشان دارد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## گیت‌های بررسی محلی و routing تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن گیت بررسی محلی درباره مرزهای معماری سخت‌گیرتر از گستره پلتفرمی وسیع CI است:

- تغییرات production هسته، typecheck تولید هسته و تست هسته به‌همراه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط تست هسته، فقط typecheck تست هسته به‌همراه lint هسته را اجرا می‌کنند؛
- تغییرات production افزونه، typecheck تولید افزونه و تست افزونه به‌همراه lint افزونه را اجرا می‌کنند؛
- تغییرات فقط تست افزونه، typecheck تست افزونه به‌همراه lint افزونه را اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا plugin-contract به typecheck افزونه گسترش می‌یابند، چون افزونه‌ها به آن قراردادهای هسته وابسته‌اند (sweepهای افزونه Vitest کار تست صریح باقی می‌مانند)؛
- افزایش نسخه‌های فقط metadata انتشار، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کنند؛
- تغییرات ناشناخته root/config برای ایمنی به همه check laneها fail می‌شوند.

routing تست تغییر یافته محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش مستقیم تست‌ها خودشان را اجرا می‌کنند، ویرایش‌های منبع mappingهای صریح را ترجیح می‌دهند، سپس تست‌های sibling و dependentهای import-graph. پیکربندی تحویل group-room مشترک یکی از mappingهای صریح است: تغییرات در پیکربندی visible-reply گروه، حالت تحویل پاسخ منبع، یا system prompt ابزار پیام از مسیر تست‌های پاسخ هسته به‌همراه regressionهای تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین push PR fail شود. فقط وقتی تغییر به‌اندازه‌ای harness-wide است که مجموعه mapped ارزان proxy قابل اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Crabbox پوشش جعبهٔ راه‌دور متعلق به مخزن برای اثبات لینوکسی نگه‌دارندگان است. از آن
از ریشهٔ مخزن استفاده کنید وقتی یک بررسی برای چرخهٔ ویرایش محلی بیش از حد گسترده است، وقتی همسانی با CI
اهمیت دارد، یا وقتی اثبات به رازها، Docker، مسیرهای بسته،
جعبه‌های قابل‌استفادهٔ مجدد، یا لاگ‌های راه‌دور نیاز دارد. بک‌اند معمول OpenClaw
`blacksmith-testbox` است؛ ظرفیت AWS/Hetzner تحت مالکیت، راهکار پشتیبان برای قطعی‌های Blacksmith،
مشکلات سهمیه، یا آزمون صریح با ظرفیت تحت مالکیت است.

اجراهای Blacksmith مبتنی بر Crabbox، Testboxهای یک‌بارمصرف را گرم، claim، همگام‌سازی، اجرا، گزارش و پاک‌سازی
می‌کنند. بررسی سلامت داخلی همگام‌سازی وقتی فایل‌های ضروری ریشه
مانند `pnpm-lock.yaml` ناپدید شوند یا وقتی `git status --short`
دست‌کم ۲۰۰ حذف ردیابی‌شده نشان دهد، سریع شکست می‌خورد. برای PRهای عمدی با حذف‌های بزرگ، برای فرمان راه‌دور
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

Crabbox همچنین فراخوانی محلی CLI مربوط به Blacksmith را که بیش از پنج دقیقه
بدون خروجی پس از همگام‌سازی در مرحلهٔ همگام‌سازی بماند، خاتمه می‌دهد. برای غیرفعال کردن این محافظ
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمولاً بزرگ
از مقدار میلی‌ثانیه‌ای بزرگ‌تر استفاده کنید.

پیش از نخستین اجرا، پوشش را از ریشهٔ مخزن بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

پوشش مخزن، باینری کهنهٔ Crabbox را که `blacksmith-testbox` را اعلام نمی‌کند رد می‌کند. حتی با اینکه `.crabbox.yaml` پیش‌فرض‌های ابر تحت مالکیت را دارد، provider را صریح پاس دهید. در worktreeهای Codex یا checkoutهای پیوندی/پراکنده، از اسکریپت محلی `pnpm crabbox:run` پرهیز کنید چون pnpm ممکن است پیش از شروع Crabbox وابستگی‌ها را همسان کند؛ به‌جای آن پوشش node را مستقیم فراخوانی کنید:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

اجراهای مبتنی بر Blacksmith به Crabbox 0.22.0 یا جدیدتر نیاز دارند تا پوشش رفتار فعلی همگام‌سازی، صف و پاک‌سازی Testbox را دریافت کند. هنگام استفاده از checkout هم‌سطح، پیش از کار زمان‌سنجی یا اثبات، باینری محلی نادیده‌گرفته‌شده را دوباره بسازید:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

گیت تغییرات:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

اجرای دوبارهٔ آزمون متمرکز:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

مجموعهٔ کامل:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

خلاصهٔ JSON نهایی را بخوانید. فیلدهای مفید `provider`، `leaseId`،
`syncDelegated`، `exitCode`، `commandMs` و `totalMs` هستند. برای اجراهای
Blacksmith Testbox واگذارشده، کد خروج پوشش Crabbox و خلاصهٔ JSON نتیجهٔ
فرمان هستند. اجرای GitHub Actions پیوندشده مالک hydration و keepalive است؛
وقتی Testbox پس از بازگشت فرمان SSH از بیرون متوقف شده باشد، ممکن است با وضعیت `cancelled`
تمام شود. مگر اینکه `exitCode` پوشش غیرصفر باشد یا خروجی فرمان آزمون شکست‌خورده‌ای را نشان دهد،
این را یک مصنوع پاک‌سازی/وضعیت در نظر بگیرید.
اجراهای یک‌بارمصرف Crabbox مبتنی بر Blacksmith باید Testbox را خودکار متوقف کنند؛
اگر اجرایی قطع شد یا پاک‌سازی روشن نبود، جعبه‌های زنده را بررسی کنید و فقط
جعبه‌هایی را که خودتان ساخته‌اید متوقف کنید:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

فقط وقتی reuse را به کار ببرید که عمداً به چند فرمان روی همان جعبهٔ hydrateشده نیاز دارید:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

اگر لایهٔ خراب Crabbox است اما خود Blacksmith کار می‌کند، از Blacksmith مستقیم
فقط برای عیب‌یابی‌هایی مانند `list`، `status` و پاک‌سازی استفاده کنید. پیش از اینکه
اجرای مستقیم Blacksmith را اثبات نگه‌دارنده محسوب کنید، مسیر Crabbox را درست کنید.

اگر `blacksmith testbox list --all` و `blacksmith testbox status` کار می‌کنند اما warmupهای تازه
پس از چند دقیقه در حالت `queued` می‌مانند و IP یا URL اجرای Actions ندارند،
آن را فشار provider، صف، صورت‌حساب، یا محدودیت سازمانی Blacksmith بدانید. شناسه‌های صف‌شده‌ای را
که خودتان ساخته‌اید متوقف کنید، از شروع Testboxهای بیشتر پرهیز کنید، و اثبات را به
مسیر ظرفیت Crabbox تحت مالکیت در ادامه منتقل کنید تا کسی داشبورد Blacksmith،
صورت‌حساب و محدودیت‌های سازمانی را بررسی کند.

فقط وقتی به ظرفیت Crabbox تحت مالکیت ارتقا دهید که Blacksmith قطع است، محدودیت سهمیه دارد، محیط موردنیاز را ندارد، یا ظرفیت تحت مالکیت صراحتاً هدف است:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

زیر فشار AWS، از `class=beast` پرهیز کنید مگر اینکه کار واقعاً به CPU در کلاس 48xlarge نیاز داشته باشد. درخواست `beast` از ۱۹۲ vCPU شروع می‌شود و ساده‌ترین راه برای برخورد با سهمیهٔ منطقه‌ای EC2 Spot یا On-Demand Standard است. `.crabbox.yaml` متعلق به مخزن به‌صورت پیش‌فرض `standard`، چند منطقهٔ ظرفیت، و `capacity.hints: true` دارد تا leaseهای کارگزاری‌شدهٔ AWS منطقه/بازار انتخاب‌شده، فشار سهمیه، fallback برای Spot، و هشدارهای کلاس پرفشار را چاپ کنند. برای بررسی‌های گستردهٔ سنگین‌تر از `fast` استفاده کنید، فقط پس از کافی نبودن standard/fast از `large` استفاده کنید، و `beast` را فقط برای مسیرهای استثنایی وابسته به CPU مانند مجموعهٔ کامل یا ماتریس‌های Docker همهٔ Pluginها، اعتبارسنجی صریح انتشار/مسدودکننده، یا پروفایل‌گیری عملکرد با تعداد هستهٔ بالا به کار ببرید. از `beast` برای `pnpm check:changed`، آزمون‌های متمرکز، کار فقط مستندات، lint/typecheck عادی، بازتولیدهای کوچک E2E، یا triage قطعی Blacksmith استفاده نکنید. برای تشخیص ظرفیت از `--market on-demand` استفاده کنید تا نوسان بازار Spot با سیگنال مخلوط نشود.

`.crabbox.yaml` مالک پیش‌فرض‌های provider، همگام‌سازی، و hydration در GitHub Actions برای مسیرهای ابر تحت مالکیت است. این فایل `.git` محلی را مستثنا می‌کند تا checkout مربوط به Actions که hydrate شده است، به‌جای همگام‌سازی remoteهای محلی نگه‌دارنده و object storeها، metadata راه‌دور Git خودش را حفظ کند، و artifactهای محلی runtime/build را که هرگز نباید منتقل شوند مستثنا می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، fetch کردن `origin/main`، و تحویل محیط غیرمحرمانه برای فرمان‌های ابر تحت مالکیت `crabbox run --id <cbx_id>` است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)

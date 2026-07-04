---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شد یا نشد
    - شما در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگ‌کردن اجرای اعتبارسنجی انتشار یا اجرای دوباره آن هستید
    - شما در حال تغییر ارسال ClawSweeper یا بازفرستادن فعالیت GitHub هستید
summary: نمودار کارهای CI، دروازه‌های دامنه، چترهای انتشار و معادل‌های فرمان محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-07-04T06:41:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. pushهای معیار
`main` ابتدا از یک پنجره پذیرش ۹۰ ثانیه‌ای hosted-runner عبور می‌کنند.
گروه هم‌زمانی موجود `CI` وقتی commit تازه‌تری وارد شود آن اجرای در انتظار را لغو
می‌کند، بنابراین mergeهای پیاپی هر کدام یک ماتریس کامل Blacksmith را ثبت
نمی‌کنند. pull requestها و dispatchهای دستی از این انتظار عبور می‌کنند. سپس job
`preflight` diff را طبقه‌بندی می‌کند و وقتی فقط ناحیه‌های نامرتبط تغییر کرده
باشند laneهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمداً
scoping هوشمند را دور می‌زنند و برای release candidateها و اعتبارسنجی گسترده،
کل graph را fan out می‌کنند. laneهای Android از طریق `include_android` همچنان
opt-in می‌مانند. پوشش Plugin مخصوص انتشار در workflow جداگانه
[`پیش‌انتشار Plugin`](#plugin-prerelease) قرار دارد و فقط از
[`اعتبارسنجی کامل انتشار`](#full-release-validation) یا یک dispatch دستی صریح
اجرا می‌شود.

## نمای کلی Pipeline

| Job                                | هدف                                                                                                   | زمان اجرا                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | تشخیص تغییرات فقط-docs، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest CI                   | همیشه روی pushها و PRهای غیر draft                  |
| `runner-admission`                 | debounce میزبانی‌شده ۹۰ ثانیه‌ای برای pushهای معیار `main` پیش از ثبت کار Blacksmith                | هر اجرای CI؛ sleep فقط روی pushهای معیار `main` |
| `security-fast`                    | تشخیص کلید خصوصی، audit workflowهای تغییرکرده از طریق `zizmor`، و audit lockfile تولید                 | همیشه روی pushها و PRهای غیر draft                  |
| `check-dependencies`               | گذر dependency-only تولید Knip به‌همراه guard allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node                               |
| `build-artifacts`                  | ساخت `dist/`، Control UI، smoke checkهای built-CLI، checkهای built-artifact تعبیه‌شده، و artifactهای قابل‌استفاده‌مجدد | تغییرات مرتبط با Node                               |
| `checks-fast-core`                 | laneهای سریع درستی لینوکس مانند bundled، protocol، QA Smoke CI، و checkهای CI-routing                | تغییرات مرتبط با Node                               |
| `checks-fast-contracts-plugins-*`  | دو check شاردشده قرارداد Plugin                                                                        | تغییرات مرتبط با Node                               |
| `checks-fast-contracts-channels-*` | دو check شاردشده قرارداد channel                                                                       | تغییرات مرتبط با Node                               |
| `checks-node-core-*`               | shardهای تست Core Node، به‌جز laneهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node                               |
| `check-*`                          | معادل gate محلی اصلی شاردشده: types تولید، lint، guardها، test types، و smoke سخت‌گیرانه                | تغییرات مرتبط با Node                               |
| `check-additional-*`               | معماری، boundary/prompt drift شاردشده، guardهای extension، package boundary، و topology runtime     | تغییرات مرتبط با Node                               |
| `checks-node-compat-node22`        | lane ساخت سازگاری Node 22 و smoke                                                                | dispatch دستی CI برای انتشارها                     |
| `check-docs`                       | قالب‌بندی docs، lint، و checkهای broken-link                                                             | تغییر docs                                        |
| `skills-python`                    | Ruff + pytest برای skills مبتنی بر Python                                                                    | تغییرات مرتبط با skillهای Python                       |
| `checks-windows`                   | تست‌های مخصوص Windows برای process/path به‌همراه regressionهای shared runtime import specifier                      | تغییرات مرتبط با Windows                            |
| `macos-node`                       | lane تست TypeScript در macOS با استفاده از artifactهای built مشترک                                               | تغییرات مرتبط با macOS                              |
| `macos-swift`                      | Swift lint، build، و تست‌ها برای app macOS                                                            | تغییرات مرتبط با macOS                              |
| `ios-build`                        | تولید پروژه Xcode به‌همراه build شبیه‌ساز app iOS                                                 | app iOS، shared app kit، یا تغییرات Swabble         |
| `android`                          | تست‌های unit Android برای هر دو flavor به‌همراه یک build debug APK                                              | تغییرات مرتبط با Android                            |
| `test-performance-agent`           | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت trusted                                                 | موفقیت CI اصلی یا dispatch دستی                  |
| `openclaw-performance`             | گزارش‌های عملکرد روزانه/درخواستی runtime Kova با laneهای mock-provider، deep-profile، و live GPT 5.5 | dispatch زمان‌بندی‌شده و دستی                       |

## ترتیب Fail-fast

1. `runner-admission` فقط برای pushهای معیار `main` منتظر می‌ماند؛ یک push تازه‌تر اجرا را پیش از ثبت Blacksmith لغو می‌کند.
2. `preflight` تصمیم می‌گیرد اساساً کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` stepهایی داخل همین job هستند، نه jobهای مستقل.
3. `security-fast`، `check-*`، `check-additional-*`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و matrix پلتفرم، سریع fail می‌شوند.
4. `build-artifacts` با laneهای سریع لینوکس هم‌پوشانی دارد تا مصرف‌کنندگان downstream به‌محض آماده شدن build مشترک بتوانند شروع کنند.
5. laneهای سنگین‌تر پلتفرم و runtime پس از آن fan out می‌شوند: `checks-fast-core`، `checks-fast-contracts-plugins-*`، `checks-fast-contracts-channels-*`، `checks-node-core-*`، `checks-windows`، `macos-node`، `macos-swift`، `ios-build`، و `android`.

GitHub ممکن است وقتی push تازه‌تری روی همان PR یا ref `main` وارد می‌شود، jobهای superseded را با وضعیت `cancelled` علامت بزند. مگر اینکه تازه‌ترین اجرا برای همان ref نیز در حال fail باشد، آن را noise مربوط به CI در نظر بگیرید. jobهای matrix از `fail-fast: false` استفاده می‌کنند، و `build-artifacts` خطاهای embedded channel، core-support-boundary، و gateway-watch را مستقیماً گزارش می‌کند، به‌جای اینکه jobهای verifier کوچک را در صف بگذارد. کلید هم‌زمانی خودکار CI نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در یک گروه صف قدیمی نتواند اجراهای جدیدتر main را برای همیشه block کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در حال انجام را لغو نمی‌کنند.

برای خلاصه کردن wall time، queue time، کندترین jobها، failureها، و مانع fanout مربوط به `pnpm-store-warmup` از GitHub Actions از `pnpm ci:timings`، `pnpm ci:timings:recent`، یا `node scripts/ci-run-timings.mjs <run-id>` استفاده کنید. CI همین خلاصه اجرا را نیز به‌عنوان artifact با نام `ci-timings-summary` upload می‌کند. برای زمان‌بندی build، step `Build dist` در job `build-artifacts` را بررسی کنید: `pnpm build:ci-artifacts` عبارت `[build-all] phase timings:` را چاپ می‌کند و شامل `ui:build` است؛ این job همچنین artifact `startup-memory` را upload می‌کند.

برای اجراهای pull request، job پایانی timing-summary پیش از پاس دادن `GH_TOKEN` به `gh run view`، helper را از revision پایه trusted اجرا می‌کند. این کار query دارای token را از کد کنترل‌شده توسط branch بیرون نگه می‌دارد، در حالی که همچنان اجرای CI فعلی pull request را خلاصه می‌کند.

## زمینه و شواهد PR

PRهای contributor خارجی یک gate زمینه و شواهد PR را از
`.github/workflows/real-behavior-proof.yml` اجرا می‌کنند. workflow commit پایه trusted
را checkout می‌کند و فقط بدنه PR را ارزیابی می‌کند؛ هیچ کدی از branch
contributor اجرا نمی‌کند.

این gate برای نویسندگان PR اعمال می‌شود که مالک repository، عضو،
collaborator، یا bot نیستند. وقتی بدنه PR شامل بخش‌های نگارش‌شده
`What Problem This Solves` و `Evidence` باشد، pass می‌شود. شواهد می‌تواند یک
تست متمرکز، نتیجه CI، screenshot، recording، خروجی terminal، مشاهده live،
log redacted، یا لینک artifact باشد. بدنه intent و اعتبارسنجی مفید را فراهم
می‌کند؛ reviewerها کد، تست‌ها، و CI را برای ارزیابی درستی بررسی می‌کنند.

وقتی check fail می‌شود، به‌جای push کردن commit کد دیگر، بدنه PR را update کنید.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با unit testهای موجود در `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest مربوط به preflight طوری عمل کند که انگار هر ناحیه scoped تغییر کرده است.

- **ویرایش‌های workflow CI** graph مربوط به Node CI را به‌همراه linting workflow اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، iOS، Android، یا macOS را مجبور نمی‌کنند؛ آن laneهای پلتفرم به تغییرات source پلتفرم scoped می‌مانند.
- **Workflow Sanity** روی همه فایل‌های YAML workflow، `actionlint`، `zizmor`، guard مربوط به interpolation در composite-action، و guard مربوط به conflict-marker را اجرا می‌کند. job `security-fast` scoped به PR نیز `zizmor` را روی فایل‌های workflow تغییرکرده اجرا می‌کند تا findingهای امنیتی workflow زودتر در graph اصلی CI fail شوند.
- **Docs روی pushهای `main`** توسط workflow مستقل `Docs` با همان mirror docs مربوط به ClawHub که CI استفاده می‌کند check می‌شوند، بنابراین pushهای ترکیبی code+docs، shard `check-docs` در CI را نیز در صف نمی‌گذارند. pull requestها و CI دستی همچنان وقتی docs تغییر کرده باشد، `check-docs` را از CI اجرا می‌کنند.
- **TUI PTY** برای تغییرات TUI در shard لینوکس Node به نام `checks-node-core-runtime-tui-pty` اجرا می‌شود. این shard فایل `test/vitest/vitest.tui-pty.config.ts` را با `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` اجرا می‌کند، بنابراین هم lane fixture قطعی `TuiBackend` و هم smoke کندتر `tui --local` را پوشش می‌دهد که فقط endpoint مدل خارجی را mock می‌کند.
- **ویرایش‌های فقط CI routing، ویرایش‌های منتخب و ارزان fixture تست core، و ویرایش‌های محدود helper/test-routing قرارداد Plugin** از مسیر manifest سریع فقط Node استفاده می‌کنند: `preflight`، security، و یک task واحد `checks-fast-core`. وقتی تغییر به سطح‌های routing یا helper محدود باشد که task سریع مستقیماً آن‌ها را exercise می‌کند، این مسیر artifactهای build، سازگاری Node 22، قراردادهای channel، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی را رد می‌کند.
- **checkهای Windows Node** به wrapperهای process/path مخصوص Windows، helperهای runner مربوط به npm/pnpm/UI، config package manager، و سطح‌های workflow CI که آن lane را اجرا می‌کنند scoped هستند؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط-test روی laneهای لینوکس Node می‌مانند.

کندترین خانواده‌های تست Node تقسیم یا متوازن شده‌اند تا هر job کوچک بماند، بدون اینکه runnerها بیش از حد رزرو شوند: قراردادهای plugin و قراردادهای channel هرکدام به‌صورت دو shard وزن‌دار با پشتوانه Blacksmith و fallback استاندارد runner GitHub اجرا می‌شوند، laneهای fast/support برای واحدهای core جداگانه اجرا می‌شوند، زیرساخت runtime core بین state، process/config، shared و سه shard دامنه cron تقسیم شده است، auto-reply به‌صورت workerهای متوازن اجرا می‌شود (با زیردرخت reply که به shardهای agent-runner، dispatch و commands/state-routing تقسیم شده است)، و پیکربندی‌های agentic gateway/server به‌جای انتظار برای artifactهای ساخته‌شده، در laneهای chat/auth/model/http-plugin/runtime/startup تقسیم شده‌اند. سپس CI عادی فقط shardهای include-pattern زیرساخت ایزوله را در بسته‌های قطعی با حداکثر 64 فایل تست بسته‌بندی می‌کند، که matrix Node را بدون ادغام suiteهای غیرایزوله command/cron، agents-core دارای state، یا gateway/server کاهش می‌دهد؛ suiteهای ثابت سنگین روی 8 vCPU می‌مانند، درحالی‌که laneهای بسته‌بندی‌شده و کم‌وزن‌تر از 4 vCPU استفاده می‌کنند. Pull requestها روی repository کانونی از یک plan پذیرش فشرده اضافی استفاده می‌کنند: همان گروه‌های per-config داخل plan فعلی 34-job Linux Node در subprocessهای ایزوله اجرا می‌شوند، بنابراین یک PR منفرد matrix کامل بیش از 70-job Node را ثبت نمی‌کند. pushهای `main`، dispatchهای دستی، و gateهای release matrix کامل را حفظ می‌کنند. تست‌های گسترده browser، QA، media و pluginهای متفرقه به‌جای catch-all مشترک plugin از پیکربندی‌های اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern ورودی‌های timing را با استفاده از نام shard در CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند کل یک config را از یک shard فیلترشده تشخیص دهد. `check-additional-*` کارهای compile/canary مرزبندی package را کنار هم نگه می‌دارد و معماری topology runtime را از پوشش gateway watch جدا می‌کند؛ فهرست boundary guard به یک shard سنگین از نظر prompt و یک shard ترکیبی برای guard stripeهای باقی‌مانده stripe می‌شود، که هرکدام guardهای مستقل انتخاب‌شده را هم‌زمان اجرا می‌کنند و timing هر check را چاپ می‌کنند. بررسی پرهزینه drift برای snapshot prompt مسیر موفق Codex به‌عنوان job اضافی خودش فقط برای CI دستی و تغییرات اثرگذار بر prompt اجرا می‌شود، بنابراین تغییرات عادی و نامرتبط Node پشت تولید سرد snapshot prompt منتظر نمی‌مانند و shardهای boundary متوازن می‌مانند، درحالی‌که prompt drift همچنان به همان PR که باعث آن شده pin می‌شود؛ همان flag تولید Vitest مربوط به snapshot prompt را داخل shard ساخته‌شده core support-boundary نیز رد می‌کند. Gateway watch، تست‌های channel، و shard core support-boundary پس از اینکه `dist/` و `dist-runtime/` از قبل ساخته شدند، به‌صورت هم‌زمان داخل `build-artifacts` اجرا می‌شوند.

پس از پذیرش، CI کانونی Linux تا 24 job تست Node هم‌زمان و
12 job برای laneهای کوچک‌تر fast/check را مجاز می‌کند؛ Windows و Android روی دو می‌مانند، چون
poolهای runner آن‌ها محدودتر است.

plan فشرده PR برای suite فعلی 18 job Node تولید می‌کند: گروه‌های whole-config
در subprocessهای ایزوله با timeout دسته‌ای 120 دقیقه‌ای batch می‌شوند،
درحالی‌که گروه‌های include-pattern همان بودجه job محدود را به اشتراک می‌گذارند.

CI Android هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK debug مربوط به Play را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه‌ای ندارد؛ lane unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، درحالی‌که از job تکراری packaging برای APK debug در هر push مرتبط با Android جلوگیری می‌کند.

shard `check-dependencies` فرمان `pnpm deadcode:dependencies` (یک pass مخصوص dependencyهای production در Knip، pin شده به آخرین نسخه Knip، با غیرفعال‌سازی حداقل سن release در pnpm برای نصب `dlx`) و `pnpm deadcode:unused-files` را اجرا می‌کند، که یافته‌های unused-file تولیدی Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard مربوط به unused-file وقتی یک PR فایل unused جدید و بررسی‌نشده‌ای اضافه کند یا یک entry کهنه در allowlist باقی بگذارد fail می‌شود، درحالی‌که سطوح عمدی dynamic plugin، generated، build، live-test و package bridge را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## فوروارد کردن فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت هدف از فعالیت repository OpenClaw به ClawSweeper است. این workflow کد pull request غیرقابل‌اعتماد را checkout یا اجرا نمی‌کند. workflow از `CLAWSWEEPER_APP_PRIVATE_KEY` یک token مربوط به GitHub App می‌سازد، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق بررسی issue و pull request؛
- `clawsweeper_comment` برای فرمان‌های صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های بررسی در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent ClawSweeper ممکن است بررسی کند.

lane مربوط به `github_activity` فقط metadata نرمال‌شده را فوروارد می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها وقتی وجود داشته باشند. این lane عمداً از فوروارد کردن کل body مربوط به webhook خودداری می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper` برابر است با `.github/workflows/github-activity.yml`، که event نرمال‌شده را برای agent ClawSweeper به hook مربوط به OpenClaw Gateway post می‌کند.

فعالیت عمومی مشاهده است، نه ارسال به‌صورت پیش‌فرض. agent ClawSweeper مقصد Discord را در prompt خود دریافت می‌کند و فقط زمانی باید به `#clawsweeper` post کند که event غافلگیرکننده، قابل اقدام، پرریسک، یا از نظر عملیاتی مفید باشد. باز شدن‌های روتین، ویرایش‌ها، churn ربات‌ها، نویز webhook تکراری، و ترافیک عادی review باید به `NO_REPLY` منجر شوند.

titleها، commentها، bodyها، متن review، نام branchها، و پیام‌های commit در GitHub را در تمام این مسیر به‌عنوان داده غیرقابل‌اعتماد در نظر بگیرید. آن‌ها ورودی summarization و triage هستند، نه دستورالعمل‌هایی برای workflow یا runtime agent.

## Dispatchهای دستی

dispatchهای دستی CI همان graph job را مثل CI عادی اجرا می‌کنند اما هر lane scoped غیر Android را روشن می‌کنند: shardهای Linux Node، shardهای bundled-plugin، shardهای قرارداد plugin و channel، سازگاری Node 22، `check-*`، `check-additional-*`، بررسی‌های smoke مربوط به built-artifact، بررسی‌های docs، Skills پایتون، Windows، macOS، build iOS، و i18n مربوط به Control UI. dispatchهای دستی مستقل CI فقط وقتی `include_android=true` باشد Android را اجرا می‌کنند؛ چتر کامل release با پاس دادن `include_android=true`، Android را فعال می‌کند. بررسی‌های static مربوط به prerelease plugin، shard فقط مخصوص release به نام `agentic-plugins`، sweep کامل batch مربوط به extension، و laneهای Docker مربوط به prerelease plugin از CI مستثنا هستند. suite مربوط به prerelease Docker فقط زمانی اجرا می‌شود که `Full Release Validation`، workflow جداگانه `Plugin Prerelease` را با فعال بودن gate مربوط به release-validation dispatch کند.

runهای دستی از یک concurrency group یکتا استفاده می‌کنند تا suite کامل release-candidate توسط push یا PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به یک caller قابل‌اعتماد اجازه می‌دهد آن graph را روی یک branch، tag، یا SHA کامل commit اجرا کند، درحالی‌که از فایل workflow مربوط به dispatch ref انتخاب‌شده استفاده می‌کند.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnerها

| Runner                          | Jobها                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | dispatch دستی CI و fallbackهای repository غیرکانونی، scanهای کیفیت CodeQL JavaScript/actions، workflow-sanity، labeler، auto-response، workflowهای docs خارج از CI، و preflight مربوط به install-smoke تا matrix مربوط به Blacksmith بتواند زودتر queue شود                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`، `security-fast`، shardهای کم‌وزن‌تر extension، `checks-fast-core` به‌جز QA Smoke CI، shardهای قرارداد plugin/channel، بیشتر shardهای bundled/کم‌وزن‌تر Linux Node، `check-guards`، `check-prod-types`، `check-test-types`، shardهای انتخاب‌شده `check-additional-*`، و `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | suiteهای سنگین حفظ‌شده Linux Node، shardهای `check-additional-*` سنگین از نظر boundary/extension، و `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI، `build-artifacts` در CI و Testbox، `check-lint` (به‌اندازه‌ای حساس به CPU که 8 vCPU بیش از مقداری که صرفه‌جویی کند هزینه داشت)؛ buildهای Docker مربوط به install-smoke (زمان queue با 32-vCPU بیش از مقداری که صرفه‌جویی کند هزینه داشت)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-15` fallback می‌کنند                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` و `ios-build` روی `openclaw/openclaw`؛ forkها به `macos-26` fallback می‌کنند                                                                                                                                                                                                                     |

## بودجه ثبت Runner

bucket فعلی OpenClaw برای ثبت runner در GitHub در `ghx api rate_limit` تعداد 10,000
runner registration self-hosted در هر 5 دقیقه گزارش می‌کند. پیش از هر pass تنظیم، دوباره
`actions_runner_registration` را بررسی کنید، چون GitHub می‌تواند
این bucket را تغییر دهد. این limit بین همه ثبت‌های runner مربوط به Blacksmith در
سازمان `openclaw` مشترک است، بنابراین افزودن یک نصب Blacksmith دیگر
bucket جدیدی اضافه نمی‌کند.

labelهای Blacksmith را منبع کمیاب برای کنترل burst در نظر بگیرید. jobهایی که
فقط route، notify، summarize، shard انتخاب می‌کنند، یا scanهای کوتاه CodeQL اجرا می‌کنند
باید روی runnerهای میزبانی‌شده توسط GitHub بمانند، مگر اینکه نیازهای Blacksmith-specific
اندازه‌گیری‌شده داشته باشند. هر matrix جدید Blacksmith، `max-parallel` بزرگ‌تر، یا workflow پرتکرار
باید تعداد registration در بدترین حالت خود را نشان دهد و target سطح سازمان را
زیر حدود 60٪ از bucket زنده نگه دارد. با bucket فعلی 10,000-registration،
این یعنی target عملیاتی 6,000-registration، با فضای اضافه برای
repositoryهای هم‌زمان، retryها، و همپوشانی burst.

CI repository کانونی Blacksmith را به‌عنوان مسیر پیش‌فرض runner برای runهای عادی push و pull-request نگه می‌دارد. `workflow_dispatch` و runهای repository غیرکانونی از runnerهای میزبانی‌شده توسط GitHub استفاده می‌کنند، اما runهای عادی کانونی در حال حاضر سلامت queue در Blacksmith را probe نمی‌کنند یا وقتی Blacksmith در دسترس نباشد به‌صورت خودکار به labelهای میزبانی‌شده توسط GitHub fallback نمی‌کنند.

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

`OpenClaw Performance` گردش‌کار عملکرد محصول/زمان اجرا است. این گردش‌کار هر روز روی `main` اجرا می‌شود و می‌توان آن را دستی نیز اجرا کرد:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

اجرای دستی معمولاً ref خود گردش‌کار را معیارسنجی می‌کند. برای معیارسنجی یک برچسب انتشار یا شاخه‌ای دیگر با پیاده‌سازی فعلی گردش‌کار، `target_ref` را تنظیم کنید. مسیرهای گزارش منتشرشده و اشاره‌گرهای آخرین نسخه بر اساس ref آزمایش‌شده کلیدگذاری می‌شوند، و هر `index.md`، ref/SHA آزمایش‌شده، ref/SHA گردش‌کار، ref مربوط به Kova، پروفایل، حالت احراز هویت lane، مدل، تعداد تکرار، و فیلترهای سناریو را ثبت می‌کند.

این گردش‌کار OCM را از یک انتشار پین‌شده و Kova را از `openclaw/Kova` در ورودی پین‌شده `kova_ref` نصب می‌کند، سپس سه lane را اجرا می‌کند:

- `mock-provider`: سناریوهای تشخیصی Kova در برابر زمان اجرای ساخت محلی با احراز هویت جعلی قطعی و سازگار با OpenAI.
- `mock-deep-profile`: پروفایل‌گیری CPU/heap/trace برای نقاط داغ راه‌اندازی، Gateway، و نوبت عامل.
- `live-openai-candidate`: یک نوبت واقعی عامل OpenAI `openai/gpt-5.5`، که وقتی `OPENAI_API_KEY` در دسترس نباشد رد می‌شود.

lane مربوط به mock-provider همچنین پس از گذر Kova، پروب‌های منبع بومی OpenClaw را اجرا می‌کند: زمان‌بندی راه‌اندازی Gateway و حافظه در حالت‌های راه‌اندازی پیش‌فرض، hook، و ۵۰-Plugin؛ RSS واردسازی Pluginهای همراه، حلقه‌های سلام تکراری mock-OpenAI `channel-chat-baseline`، فرمان‌های راه‌اندازی CLI در برابر Gateway راه‌اندازی‌شده، و پروب عملکرد smoke وضعیت SQLite. وقتی گزارش منبع mock-provider منتشرشده قبلی برای ref آزمایش‌شده در دسترس باشد، خلاصه منبع مقدارهای فعلی RSS و heap را با آن مبنا مقایسه می‌کند و افزایش‌های بزرگ RSS را به‌صورت `watch` علامت‌گذاری می‌کند. خلاصه Markdown پروب منبع در بسته گزارش، در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر lane آرتیفکت‌های GitHub را بارگذاری می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، گردش‌کار همچنین `report.json`، `report.md`، بسته‌ها، `index.md`، و آرتیفکت‌های پروب منبع را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` کامیت می‌کند. اشاره‌گر فعلی ref آزمایش‌شده به‌صورت `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` گردش‌کار چتری دستی برای «اجرای همه‌چیز پیش از انتشار» است. این گردش‌کار یک شاخه، برچسب، یا SHA کامل کامیت را می‌پذیرد، گردش‌کار دستی `CI` را با آن هدف اجرا می‌کند، `Plugin Prerelease` را برای اثبات ویژه انتشارِ Plugin/بسته/استاتیک/Docker اجرا می‌کند، و `OpenClaw Release Checks` را برای smoke نصب، پذیرش بسته، بررسی بسته میان‌سیستمی، رندر کارت امتیاز بلوغ از شواهد پروفایل QA، همسانی QA Lab، Matrix، و laneهای Telegram اجرا می‌کند. پروفایل‌های پایدار و کامل همیشه پوشش جامع live/E2E و soak مسیر انتشار Docker را شامل می‌شوند؛ پروفایل بتا می‌تواند با `run_release_soak=true` آن را فعال کند. E2E بسته canonical Telegram داخل Package Acceptance اجرا می‌شود، بنابراین یک نامزد کامل poller زنده تکراری را شروع نمی‌کند. پس از انتشار، `release_package_spec` را ارسال کنید تا بسته npm منتشرشده در بررسی‌های انتشار، Package Acceptance، Docker، میان‌سیستمی، و Telegram بدون ساخت مجدد دوباره استفاده شود. از `npm_telegram_package_spec` فقط برای اجرای دوباره متمرکز Telegram با بسته منتشرشده استفاده کنید. lane بسته زنده Plugin مربوط به Codex به‌طور پیش‌فرض از همان وضعیت انتخاب‌شده استفاده می‌کند: مقدار منتشرشده `release_package_spec=openclaw@<tag>`، مقدار `codex_plugin_spec=npm:@openclaw/codex@<tag>` را نتیجه می‌دهد، در حالی که اجراهای SHA/آرتیفکت، `extensions/codex` را از ref انتخاب‌شده بسته‌بندی می‌کنند. برای منابع Plugin سفارشی مانند مشخصه‌های `npm:`، `npm-pack:`، یا `git:`، مقدار `codex_plugin_spec` را صریح تنظیم کنید.

برای ماتریس مرحله‌ها، نام دقیق jobهای گردش‌کار، تفاوت پروفایل‌ها، آرتیفکت‌ها، و دستگیره‌های اجرای دوباره متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` گردش‌کار انتشار دستیِ تغییردهنده است. پس از وجود داشتن برچسب انتشار و پس از موفق شدن preflight مربوط به npm در OpenClaw، آن را از `release/YYYY.M.PATCH` یا `main` اجرا کنید. این گردش‌کار `pnpm plugins:sync:check` را تأیید می‌کند، `Plugin NPM Release` را برای همه بسته‌های Plugin قابل انتشار اجرا می‌کند، `Plugin ClawHub Release` را برای همان SHA انتشار اجرا می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده اجرا می‌کند. انتشار پایدار همچنین به `windows_node_tag` دقیق نیاز دارد؛ گردش‌کار انتشار منبع Windows را تأیید می‌کند و نصب‌کننده‌های x64/ARM64 آن را پیش از هر فرزند انتشار با ورودی تأییدشده نامزد `windows_node_installer_digests` مقایسه می‌کند، سپس همان digestهای پین‌شده نصب‌کننده به‌علاوه قرارداد دقیق آرتیفکت همراه و checksum را پیش از انتشار پیش‌نویس انتشار GitHub، ترفیع و تأیید می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات کامیت پین‌شده روی شاخه‌ای که سریع تغییر می‌کند، به‌جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

refهای اجرای گردش‌کار GitHub باید شاخه یا برچسب باشند، نه SHA خام کامیت. helper یک شاخه موقت `release-ci/<sha>-...` را در SHA هدف push می‌کند، `Full Release Validation` را از آن ref پین‌شده اجرا می‌کند، تأیید می‌کند که `headSha` هر گردش‌کار فرزند با هدف مطابقت دارد، و وقتی اجرا کامل شد شاخه موقت را حذف می‌کند. تأییدکننده چتری همچنین اگر هر گردش‌کار فرزند در SHA متفاوتی اجرا شده باشد شکست می‌خورد.

`release_profile` گستره live/provider ارسال‌شده به بررسی‌های انتشار را کنترل می‌کند. گردش‌کارهای انتشار دستی به‌طور پیش‌فرض `stable` هستند؛ فقط وقتی عمداً ماتریس گسترده provider/media مشورتی را می‌خواهید از `full` استفاده کنید. بررسی‌های انتشار پایدار و کامل همیشه soak جامع live/E2E و مسیر انتشار Docker را اجرا می‌کنند؛ پروفایل بتا می‌تواند با `run_release_soak=true` آن را فعال کند.

- `minimum` سریع‌ترین laneهای حیاتی انتشار OpenAI/core را نگه می‌دارد.
- `stable` مجموعه provider/backend پایدار را اضافه می‌کند.
- `full` ماتریس گسترده provider/media مشورتی را اجرا می‌کند.

چتر، شناسه‌های اجرای فرزندِ اجراشده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین job را برای هر اجرای فرزند اضافه می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط job تأییدکننده والد را دوباره اجرا کنید تا نتیجه چتری و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all`، فقط برای فرزند CI کامل معمولی از `ci`، فقط برای فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از گروهی محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای دوباره یک جعبه انتشار شکست‌خورده را پس از اصلاح متمرکز محدود نگه می‌دارد. برای یک lane میان‌سیستمی شکست‌خورده، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ فرمان‌های طولانی میان‌سیستمی خطوط Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade شامل زمان‌بندی هر فاز هستند. laneهای بررسی انتشار QA، به‌جز gate استاندارد پوشش ابزار زمان اجرا، مشورتی هستند؛ آن gate وقتی ابزارهای پویای لازم OpenClaw از خلاصه رده استاندارد فاصله بگیرند یا ناپدید شوند، مانع می‌شود.

`OpenClaw Release Checks` از ref گردش‌کار مورد اعتماد استفاده می‌کند تا ref انتخاب‌شده را یک بار به tarball به نام `release-package-under-test` تبدیل کند، سپس آن آرتیفکت را به بررسی‌های میان‌سیستمی و Package Acceptance، و همچنین به گردش‌کار Docker مسیر انتشار live/E2E هنگام اجرای پوشش soak ارسال می‌کند. این کار بایت‌های بسته را در همه جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوباره همان نامزد در چند job فرزند جلوگیری می‌کند. برای lane زنده Plugin مربوط به Codex npm، بررسی‌های انتشار یا مشخصه Plugin منتشرشده منطبق و مشتق‌شده از `release_package_spec` را ارسال می‌کنند، یا `codex_plugin_spec` فراهم‌شده توسط operator را ارسال می‌کنند، یا ورودی را خالی می‌گذارند تا اسکریپت Docker، Plugin مربوط به Codex در checkout انتخاب‌شده را بسته‌بندی کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all` چتر قدیمی‌تر را جایگزین می‌کنند. پایشگر والد هر گردش‌کار فرزندی را که قبلاً اجرا کرده باشد، هنگام لغو والد لغو می‌کند، بنابراین اعتبارسنجی جدیدتر main پشت یک اجرای کهنه دو ساعته بررسی انتشار نمی‌ماند. اعتبارسنجی شاخه/برچسب انتشار و گروه‌های اجرای دوباره متمرکز، `cancel-in-progress: false` را حفظ می‌کنند.

## shardهای Live و E2E

فرزند live/E2E انتشار پوشش گسترده بومی `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک job سریالی، به‌صورت shardهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobهای `native-live-src-gateway-profiles` فیلترشده بر اساس provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shardهای جداگانه media صوت/ویدئو و shardهای موسیقی فیلترشده بر اساس provider

این کار همان پوشش فایل را نگه می‌دارد و در عین حال اجرای دوباره و عیب‌یابی شکست‌های کند provider زنده را آسان‌تر می‌کند. نام shardهای تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` برای اجرای دوباره دستی یک‌باره همچنان معتبر می‌مانند.

shardهای media زنده بومی در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند، که توسط گردش‌کار `Live Media Runner Image` ساخته شده است. آن image، `ffmpeg` و `ffprobe` را از قبل نصب می‌کند؛ jobهای media فقط پیش از setup باینری‌ها را تأیید می‌کنند. مجموعه‌های live مبتنی بر Docker را روی runnerهای معمول Blacksmith نگه دارید؛ jobهای container جای مناسبی برای اجرای تست‌های Docker تو در تو نیستند.

شاردهای مدل زنده/بک‌اند مبتنی بر Docker برای هر commit انتخاب‌شده از یک تصویر مشترک جداگانه با نام `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. گردش‌کار انتشار زنده آن تصویر را یک‌بار می‌سازد و push می‌کند، سپس شاردهای مدل زنده Docker، Gateway شاردشده بر اساس provider، بک‌اند CLI، اتصال ACP، و هارنس Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. شاردهای Docker مربوط به Gateway سقف‌های صریح `timeout` در سطح اسکریپت دارند که پایین‌تر از مهلت job گردش‌کار است، تا یک container گیرکرده یا مسیر cleanup به‌جای مصرف کل بودجه release-check سریع شکست بخورد. اگر آن شاردها هدف Docker کامل منبع را مستقل بازسازی کنند، اجرای انتشار بد پیکربندی شده و زمان دیواری را برای ساخت‌های تکراری تصویر هدر خواهد داد.

## پذیرش بسته

از `Package Acceptance` زمانی استفاده کنید که پرسش این است: «آیا این بسته نصب‌پذیر OpenClaw به‌عنوان یک محصول کار می‌کند؟» این با CI عادی فرق دارد: CI عادی درخت منبع را اعتبارسنجی می‌کند، درحالی‌که پذیرش بسته یک tarball واحد را از طریق همان هارنس Docker E2E که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند اعتبارسنجی می‌کند.

### وظایف

1. `resolve_package`، `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` upload می‌کند، و منبع، workflow ref، package ref، نسخه، SHA-256، و profile را در خلاصه مرحله GitHub چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار قابل‌استفاده‌مجدد آن artifact را download می‌کند، موجودی tarball را اعتبارسنجی می‌کند، در صورت نیاز تصویرهای Docker با package-digest را آماده می‌کند، و laneهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout گردش‌کار، روی همان بسته اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب کند، گردش‌کار قابل‌استفاده‌مجدد بسته و تصویرهای مشترک را یک‌بار آماده می‌کند، سپس آن laneها را به‌صورت jobهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و اگر پذیرش بسته یکی را resolve کرده باشد، همان artifact با نام `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده npm را نصب کند.
4. `summary` اگر resolution بسته، پذیرش Docker، یا lane اختیاری Telegram شکست خورده باشد، گردش‌کار را ناموفق می‌کند.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش prerelease/stable منتشرشده استفاده کنید.
- `source=ref` یک branch، tag، یا SHA کامل commit مورد اعتماد در `package_ref` را بسته‌بندی می‌کند. resolver شاخه‌ها/tagهای OpenClaw را fetch می‌کند، بررسی می‌کند commit انتخاب‌شده از تاریخچه branch مخزن یا یک release tag قابل‌دسترسی باشد، dependencyها را در یک worktree جداشده نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` عمومی HTTPS را download می‌کند؛ `package_sha256` الزامی است. این مسیر credentialهای URL، پورت‌های HTTPS غیرپیش‌فرض، hostnameها یا IPهای resolveشده خصوصی/داخلی/special-use، و redirectهای خارج از همان سیاست ایمنی عمومی را رد می‌کند.
- `source=trusted-url` یک `.tgz` HTTPS را از یک سیاست trusted-source نام‌گذاری‌شده در `.github/package-trusted-sources.json` download می‌کند؛ `package_sha256` و `trusted_source_id` الزامی هستند. این را فقط برای mirrorهای سازمانی تحت مالکیت maintainer یا مخزن‌های خصوصی بسته استفاده کنید که به host، port، prefix مسیر، hostهای redirect، یا resolution شبکه خصوصی پیکربندی‌شده نیاز دارند. اگر سیاست bearer auth را اعلام کند، گردش‌کار از secret ثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN` استفاده می‌کند؛ credentialهای تعبیه‌شده در URL همچنان رد می‌شوند.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` download می‌کند؛ `package_sha256` اختیاری است اما برای artifactهای به‌اشتراک‌گذاشته‌شده خارجی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد مورد اعتماد گردش‌کار/هارنس است که آزمون را اجرا می‌کند. `package_ref`، commit منبعی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این باعث می‌شود هارنس آزمون فعلی بتواند commitهای منبع قدیمی‌تر و مورد اعتماد را بدون اجرای منطق قدیمی گردش‌کار اعتبارسنجی کند.

### پروفایل‌های مجموعه آزمون

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — قطعه‌های کامل مسیر انتشار Docker با OpenWebUI
- `custom` — `docker_lanes` دقیق؛ وقتی `suite_profile=custom` باشد الزامی است

پروفایل `package` از پوشش Plugin آفلاین استفاده می‌کند تا اعتبارسنجی بسته منتشرشده به دسترس‌بودن زنده ClawHub وابسته نباشد. lane اختیاری Telegram از artifact با نام `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، و مسیر spec منتشرشده npm برای dispatchهای مستقل حفظ می‌شود.

برای سیاست اختصاصی آزمون به‌روزرسانی و Plugin، شامل فرمان‌های محلی،
laneهای Docker، ورودی‌های پذیرش بسته، پیش‌فرض‌های انتشار، و triage شکست،
[آزمودن به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار، پذیرش بسته را با `source=artifact`، artifact بسته انتشار آماده‌شده، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار اثبات migration بسته، update، نصب Skill زنده ClawHub، cleanup وابستگی stale-plugin، repair نصب configured-plugin، Plugin آفلاین، plugin-update، و Telegram را روی همان tarball بسته resolveشده نگه می‌دارد. پس از انتشار یک beta، `release_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید تا همان matrix بدون بازسازی در برابر بسته npm ارسال‌شده اجرا شود؛ `package_acceptance_package_spec` را فقط زمانی تنظیم کنید که پذیرش بسته به بسته‌ای متفاوت از بقیه اعتبارسنجی انتشار نیاز داشته باشد. بررسی‌های انتشار cross-OS همچنان onboarding، installer، و رفتار پلتفرمی وابسته به OS را پوشش می‌دهند؛ اعتبارسنجی محصول package/update باید با پذیرش بسته شروع شود. lane Docker با نام `published-upgrade-survivor` در مسیر انتشار blocking، در هر اجرا یک baseline بسته منتشرشده را اعتبارسنجی می‌کند. در پذیرش بسته، tarball resolveشده `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده fallback را انتخاب می‌کند که به‌صورت پیش‌فرض `openclaw@latest` است؛ فرمان‌های rerun مربوط به laneهای شکست‌خورده آن baseline را حفظ می‌کنند. Full Release Validation با `run_release_soak=true` یا `release_profile=full`، `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا چهار انتشار stable آخر npm به‌علاوه انتشارهای مرزی pinned برای سازگاری Plugin و fixtureهای مسئله‌محور برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده OpenClaw، مسیرهای log با tilde، و ریشه‌های وابستگی قدیمی و stale مربوط به Plugin را پوشش دهد. انتخاب‌های published-upgrade survivor چند-baseline بر اساس baseline به jobهای runner Docker هدفمند جداگانه shard می‌شوند. گردش‌کار جداگانه `Update Migration` از lane Docker با نام `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند، وقتی پرسش cleanup جامع update منتشرشده است، نه گستره عادی Full Release CI. اجراهای تجمیعی محلی می‌توانند specهای دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` پاس بدهند، با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` یک lane واحد مانند `openclaw@2026.4.15` را نگه دارند، یا `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را برای matrix سناریو تنظیم کنند. lane منتشرشده baseline را با یک recipe فرمان baked `openclaw config set` پیکربندی می‌کند، گام‌های recipe را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz`، به‌علاوه وضعیت RPC را probe می‌کند. laneهای تازه Windows packaged و installer نیز بررسی می‌کنند که یک بسته نصب‌شده بتواند یک override کنترل browser را از یک مسیر absolute خام Windows import کند. smoke مربوط به agent-turn در OpenAI cross-OS به‌صورت پیش‌فرض وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد از آن استفاده می‌کند، وگرنه `openai/gpt-5.5`، تا اثبات نصب و Gateway روی یک مدل آزمون GPT-5 بماند و از پیش‌فرض‌های GPT-4.x پرهیز شود.

### پنجره‌های سازگاری قدیمی

پذیرش بسته برای بسته‌های ازپیش‌منتشرشده پنجره‌های سازگاری قدیمی محدود دارد. بسته‌ها تا `2026.4.25`، از جمله `2026.4.25-beta.*`، ممکن است از مسیر سازگاری استفاده کنند:

- ورودی‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- `doctor-switch` ممکن است subcase پایداری `gateway install --wrapper` را وقتی بسته آن flag را expose نمی‌کند skip کند؛
- `update-channel-switch` ممکن است `patchedDependencies` مفقود pnpm را از fixture fake git مشتق‌شده از tarball prune کند و ممکن است `update.channel` پایدارشده مفقود را log کند؛
- smokeهای Plugin ممکن است مکان‌های قدیمی install-record را بخوانند یا نبود پایداری install-record در marketplace را بپذیرند؛
- `plugin-update` ممکن است migration metadata پیکربندی را اجازه دهد، درحالی‌که همچنان الزام می‌کند install record و رفتار no-reinstall بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` نیز ممکن است برای فایل‌های stamp مربوط به metadata ساخت محلی که قبلا ارسال شده بودند warning بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای warning یا skip شکست می‌خورند.

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

هنگام debug کردن یک اجرای ناموفق پذیرش بسته، از خلاصه `resolve_package` شروع کنید تا منبع بسته، نسخه، و SHA-256 را تایید کنید. سپس اجرای فرزند `docker_acceptance` و artifactهای Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، logهای lane، زمان‌بندی‌های phase، و فرمان‌های rerun. به‌جای اجرای دوباره اعتبارسنجی کامل انتشار، rerun کردن پروفایل بسته شکست‌خورده یا laneهای دقیق Docker را ترجیح دهید.

## آزمون دود نصب

گردش‌کار جداگانه `Install Smoke` همان اسکریپت scope را از طریق job اختصاصی `preflight` خود دوباره استفاده می‌کند. این گردش‌کار پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطوح Docker/package، تغییرات package/manifest در Pluginهای همراه، یا سطوح core plugin/channel/gateway/Plugin SDK را لمس می‌کنند که jobهای smoke مربوط به Docker آن‌ها را تمرین می‌دهند. تغییرات فقط-منبع در Pluginهای همراه، ویرایش‌های فقط-تست، و ویرایش‌های فقط-مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع image مربوط به Dockerfile ریشه را یک بار می‌سازد، CLI را بررسی می‌کند، smoke مربوط به agents delete shared-workspace CLI را اجرا می‌کند، e2e مربوط به container gateway-network را اجرا می‌کند، یک build arg برای extension همراه را تأیید می‌کند، و پروفایل محدود Docker برای bundled-plugin را زیر timeout تجمیعی ۲۴۰ ثانیه‌ای command اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** پوشش نصب package QR و Docker/update نصب‌کننده را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، بررسی‌های release با workflow-call، و pull requestهایی نگه می‌دارد که واقعاً سطوح installer/package/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک image smoke مربوط به GHCR root Dockerfile با target-SHA را آماده یا بازاستفاده می‌کند، سپس نصب package QR، smokeهای root Dockerfile/gateway، smokeهای installer/update، و E2E سریع Docker برای bundled-plugin را به‌عنوان jobهای جداگانه اجرا می‌کند تا کار installer پشت smokeهای image ریشه منتظر نماند.

pushهای `main` (از جمله merge commitها) مسیر کامل را اجبار نمی‌کنند؛ وقتی منطق changed-scope در یک push پوشش کامل را درخواست کند، workflow همان smoke سریع Docker را نگه می‌دارد و smoke کامل install را به اعتبارسنجی شبانه یا release واگذار می‌کند.

smoke کند image-provider برای نصب سراسری Bun جداگانه با `run_bun_global_install_smoke` gate می‌شود. این smoke در زمان‌بندی شبانه و از workflow بررسی‌های release اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` آن را اجرا نمی‌کنند. CI معمول PR همچنان lane رگرسیون سریع Bun launcher را برای تغییرات مرتبط با Node اجرا می‌کند. تست‌های Docker مربوط به QR و installer، Dockerfileهای install-focused خودشان را نگه می‌دارند.

## E2E محلی Docker

`pnpm test:docker:all` یک image مشترک live-test را از پیش می‌سازد، OpenClaw را یک بار به‌صورت npm tarball بسته‌بندی می‌کند، و دو image مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner خام Node/Git برای laneهای installer/update/plugin-dependency؛
- یک image کاربردی که همان tarball را برای laneهای عادی عملکردی در `/app` نصب می‌کند.

تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` image را برای هر lane انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### قابل تنظیم‌ها

| متغیر                                | پیش‌فرض | هدف                                                                                                      |
| ------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای main-pool برای laneهای عادی.                                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | سقف laneهای هم‌زمان نصب npm.                                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای هم‌زمان چند-service.                                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله stagger بین شروع laneها برای جلوگیری از طوفان create در daemon Docker؛ برای بدون stagger روی `0` بگذارید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout fallback برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail منتخب سقف‌های سخت‌گیرانه‌تری دارند.        |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | مقدار `1` plan مربوط به scheduler را بدون اجرای laneها چاپ می‌کند.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق laneها با جداکننده کاما؛ smoke پاک‌سازی را رد می‌کند تا agentها بتوانند یک lane شکست‌خورده را بازتولید کنند. |

laneیی که از سقف مؤثر خود سنگین‌تر است، همچنان می‌تواند از یک pool خالی شروع شود، سپس تا زمانی که capacity را آزاد کند تنها اجرا می‌شود. preflight تجمیعی محلی Docker را بررسی می‌کند، containerهای قدیمی OpenClaw E2E را حذف می‌کند، وضعیت active-lane را منتشر می‌کند، زمان‌بندی laneها را برای ترتیب longest-first پایدار می‌کند، و به‌صورت پیش‌فرض پس از نخستین failure، زمان‌بندی laneهای pooled جدید را متوقف می‌کند.

### workflow قابل استفاده مجدد live/E2E

workflow قابل استفاده مجدد live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد که کدام package، نوع image، image زنده، lane، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و summaryهای GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا artifact مربوط به package از اجرای فعلی را دانلود می‌کند، یا artifact مربوط به package را از `package_artifact_run_id` دانلود می‌کند؛ inventory tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای package-installed نیاز دارد، imageهای bare/functional GHCR Docker E2E با tag بر پایه package-digest را از طریق cache لایه Docker در Blacksmith می‌سازد و push می‌کند؛ و به‌جای rebuild، inputهای ارائه‌شده `docker_e2e_bare_image`/`docker_e2e_functional_image` یا imageهای موجود package-digest را بازاستفاده می‌کند. pullهای image Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش retry می‌شوند تا stream گیرکرده registry/cache، به‌جای مصرف بیشتر مسیر بحرانی CI، سریع retry شود.

### بخش‌های مسیر release

پوشش Docker مربوط به release، jobهای chunked کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع image مورد نیاز خود را pull کند و چند lane را از طریق همان scheduler وزنی اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunkهای فعلی Docker برای release عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `package-update-openai` شامل lane زنده package مربوط به Codex plugin است که package نامزد OpenClaw را نصب می‌کند، Codex plugin را از `codex_plugin_spec` یا tarball هم‌ref با تأیید صریح نصب Codex CLI نصب می‌کند، preflight مربوط به Codex CLI را اجرا می‌کند، سپس چند turn مربوط به agent هم‌session OpenClaw را در برابر OpenAI اجرا می‌کند. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای تجمیعی plugin/runtime می‌مانند. alias lane `install-e2e` همچنان alias بازاجرای دستی تجمیعی برای هر دو lane نصب‌کننده provider است.

وقتی پوشش کامل release-path آن را درخواست کند، OpenWebUI در `plugins-runtime-services` ادغام می‌شود، و chunk مستقل `openwebui` را فقط برای dispatchهای فقط-OpenWebUI نگه می‌دارد. laneهای update مربوط به bundled-channel برای failureهای گذرای شبکه npm یک بار retry می‌کنند.

هر chunk، `.artifacts/docker-tests/` را همراه با logهای lane، timings، `summary.json`، `failures.json`، phase timings، JSON مربوط به scheduler plan، جدول‌های slow-lane، و commandهای بازاجرای هر lane upload می‌کند. input مربوط به `docker_lanes` در workflow، laneهای انتخاب‌شده را به‌جای jobهای chunk در برابر imageهای آماده اجرا می‌کند؛ این کار debugging lane شکست‌خورده را به یک job هدفمند Docker محدود نگه می‌دارد و artifact مربوط به package را برای آن اجرا آماده، دانلود، یا بازاستفاده می‌کند؛ اگر یک lane انتخاب‌شده، lane زنده Docker باشد، job هدفمند image مربوط به live-test را برای آن بازاجرا به‌صورت محلی می‌سازد. commandهای GitHub تولیدشده برای بازاجرای هر lane، وقتی این مقدارها وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name`، و inputهای image آماده هستند، تا یک lane شکست‌خورده بتواند همان package و imageهای دقیق اجرای شکست‌خورده را بازاستفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # دانلود artifactهای Docker و چاپ commandهای بازاجرای هدفمند ترکیبی/هر lane
pnpm test:docker:timings <summary>   # summaryهای slow-lane و مسیر بحرانی phase
```

workflow زمان‌بندی‌شده live/E2E هر روز suite کامل Docker مربوط به release-path را اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش پرهزینه‌تر product/package است، بنابراین workflow جداگانه‌ای است که با `Full Release Validation` یا توسط operator صریح dispatch می‌شود. pull requestهای عادی، pushهای `main`، و dispatchهای دستی standalone CI آن suite را خاموش نگه می‌دارند. این workflow تست‌های Plugin همراه را میان هشت worker مربوط به extension متوازن می‌کند؛ آن jobهای shard مربوط به extension تا دو گروه config مربوط به plugin را هم‌زمان با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای plugin سنگین از نظر import، jobهای CI اضافی نسازند. مسیر prerelease فقط-release مربوط به Docker، laneهای هدفمند Docker را در گروه‌های کوچک batch می‌کند تا ده‌ها runner برای jobهای یک تا سه دقیقه‌ای رزرو نشوند. این workflow همچنین artifact اطلاع‌رسانی `plugin-inspector-advisory` را از `@openclaw/plugin-inspector` upload می‌کند؛ findings مربوط به inspector ورودی triage هستند و gate مسدودکننده Plugin Prerelease را تغییر نمی‌دهند.

## QA Lab

QA Lab در خارج از workflow اصلی smart-scoped، laneهای CI اختصاصی دارد. هم‌ارزی agentic زیر harnessهای گسترده QA و release nested است، نه یک workflow مستقل PR. وقتی parity باید همراه با یک اجرای اعتبارسنجی گسترده حرکت کند، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- workflow مربوط به `QA-Lab - All Lanes` هر شب روی `main` و با dispatch دستی اجرا می‌شود؛ این workflow lane مربوط به mock parity، lane زنده Matrix، و laneهای زنده Telegram و Discord را به‌صورت jobهای موازی fan out می‌کند. jobهای live از environment مربوط به `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های release، laneهای transport زنده Matrix و Telegram را با provider ساختگی deterministic و modelهای mock-qualified (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد channel از latency model زنده و startup عادی provider-plugin جدا شود. Gateway مربوط به transport زنده، memory search را غیرفعال می‌کند چون QA parity رفتار memory را جداگانه پوشش می‌دهد؛ اتصال provider توسط suiteهای جداگانه live model، native provider، و Docker provider پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و release از `--profile fast` استفاده می‌کند و `--fail-fast` را فقط وقتی اضافه می‌کند که CLI checkout‌شده از آن پشتیبانی کند. پیش‌فرض CLI و input دستی workflow همچنان `all` می‌مانند؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای release-critical مربوط به QA Lab را پیش از approval release اجرا می‌کند؛ gate مربوط به QA parity در آن، packهای candidate و baseline را به‌عنوان jobهای lane موازی اجرا می‌کند، سپس هر دو artifact را در یک job کوچک report برای مقایسه نهایی parity دانلود می‌کند.

برای PRهای عادی، به‌جای اینکه parity را یک وضعیت الزامی بدانید، از شواهد CI/check scoped پیروی کنید.

## CodeQL

workflow مربوط به `CodeQL` عمداً یک اسکنر امنیتی first-pass محدود است، نه sweep کامل repository. اجراهای روزانه، دستی، و guard مربوط به pull requestهای non-draft کد workflowهای Actions به‌علاوه پرریسک‌ترین سطوح JavaScript/TypeScript را با queryهای امنیتی high-confidence فیلترشده به `security-severity` بالا/بحرانی اسکن می‌کنند.

guard مربوط به pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، `scripts`، `src`، یا مسیرهای runtime مربوط به Plugin همراه مالک process شروع می‌شود، و همان matrix امنیتی high-confidence workflow زمان‌بندی‌شده را اجرا می‌کند. CodeQL مربوط به Android و macOS خارج از پیش‌فرض‌های PR می‌ماند.

### دسته‌های امنیتی

| دسته‌بندی                                          | سطح                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | خط پایه احراز هویت، اسرار، محیط ایزوله، Cron و Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌علاوه زمان اجرای Plugin کانال، Gateway، Plugin SDK، اسرار و نقاط تماس حسابرسی              |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح سیاست SSRF هسته، تجزیه IP، محافظ شبکه، واکشی وب و SSRF در Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، کمک‌کننده‌های اجرای فرایند، تحویل خروجی، و گیت‌های اجرای ابزار عامل                                           |
| `/codeql-security-high/process-exec-boundary`     | پوسته محلی، کمک‌کننده‌های ایجاد فرایند، زمان‌های اجرای Plugin همراه مالک زیرفرایند، و چسب اسکریپت گردش‌کار                             |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد نصب Plugin، بارگذار، مانیفست، رجیستری، نصب مدیر بسته، بارگذاری منبع، و قرارداد بسته Plugin SDK |

### شاردهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — شارد امنیتی زمان‌بندی‌شده Android. برنامه Android را برای CodeQL به‌صورت دستی روی کوچک‌ترین رانر Blacksmith Linux که توسط sanity گردش‌کار پذیرفته می‌شود می‌سازد. زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — شارد امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL به‌صورت دستی روی Blacksmith macOS می‌سازد، نتایج ساخت وابستگی را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده چون ساخت macOS حتی در حالت تمیز هم بر زمان اجرا غالب است.

### دسته‌بندی‌های کیفیت بحرانی

`CodeQL Critical Quality` شارد غیرامنیتی متناظر است. فقط کوئری‌های کیفیت JavaScript/TypeScript غیرامنیتی با شدت خطا را روی سطوح باریک و پرارزش در رانرهای Linux میزبانی‌شده توسط GitHub اجرا می‌کند تا اسکن‌های کیفیت بودجه ثبت رانر Blacksmith را مصرف نکنند. گارد pull request آن عمدا کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیرپیش‌نویس فقط شاردهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract` و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای دستور/مدل/ابزار عامل و ارسال پاسخ، کد شِما/مهاجرت/ورودی‌وخروجی پیکربندی، کد احراز هویت/اسرار/محیط ایزوله/امنیت، زمان اجرای کانال هسته و Plugin کانال همراه، پروتکل Gateway/متد سرور، چسب زمان اجرای حافظه/SDK، MCP/فرایند/تحویل خروجی، کاتالوگ زمان اجرای ارائه‌دهنده/مدل، صف‌های عیب‌یابی/تحویل نشست، بارگذار Plugin، قرارداد Plugin SDK/بسته، یا زمان اجرای پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت هر دوازده شارد کیفیت PR را اجرا می‌کنند.

dispatch دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های باریک، قلاب‌های آموزش/تکرار برای اجرای یک شارد کیفیت به‌صورت جداگانه هستند.

| دسته‌بندی                                                | سطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، اسرار، محیط ایزوله، Cron و Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | قراردادهای شِمای پیکربندی، مهاجرت، نرمال‌سازی و ورودی‌وخروجی                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | شِماهای پروتکل Gateway و قراردادهای متد سرور                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال همراه                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | قراردادهای زمان اجرای اجرای دستور، dispatch مدل/ارائه‌دهنده، dispatch و صف‌های پاسخ خودکار، و صفحه کنترل ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، کمک‌کننده‌های نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، نماهای زمان اجرای حافظه، نام‌های مستعار حافظه در Plugin SDK، چسب فعال‌سازی زمان اجرای حافظه، و دستورهای doctor حافظه                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | اجزای داخلی صف پاسخ، صف‌های تحویل نشست، کمک‌کننده‌های اتصال/تحویل نشست خروجی، سطوح رویداد تشخیصی/بسته گزارش، و قراردادهای CLI doctor نشست |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | dispatch پاسخ ورودی Plugin SDK، کمک‌کننده‌های payload/قطعه‌بندی/زمان اجرای پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و کمک‌کننده‌های اتصال نشست/رشته             |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و کشف ارائه‌دهنده، ثبت زمان اجرای ارائه‌دهنده، پیش‌فرض‌ها/کاتالوگ‌های ارائه‌دهنده، و رجیستری‌های وب/جست‌وجو/واکشی/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | راه‌اندازی Control UI، ماندگاری محلی، جریان‌های کنترل Gateway، و قراردادهای زمان اجرای صفحه کنترل وظیفه                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | واکشی/جست‌وجوی وب هسته، ورودی‌وخروجی رسانه، فهم رسانه، تولید تصویر، و قراردادهای زمان اجرای تولید رسانه                                                    |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای بارگذار، رجیستری، سطح عمومی، و نقطه ورود Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع Plugin SDK سمت بسته منتشرشده و کمک‌کننده‌های قرارداد بسته Plugin                                                                                      |

کیفیت جدا از امنیت می‌ماند تا یافته‌های کیفیت بتوانند بدون کدر کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال یا گسترش داده شوند. گسترش CodeQL برای Swift، Python و Plugin همراه باید فقط پس از پایدار شدن زمان اجرا و سیگنال پروفایل‌های باریک، دوباره به‌عنوان کار پیگیری scoped یا sharded اضافه شود.

## گردش‌کارهای نگهداری

### عامل Docs

گردش‌کار `Docs Agent` یک مسیر نگهداری Codex رویدادمحور برای هم‌راستا نگه داشتن اسناد موجود با تغییرات اخیرا land شده است. زمان‌بندی خالص ندارد: اجرای موفق CI push غیرربات روی `main` می‌تواند آن را trigger کند، و dispatch دستی می‌تواند مستقیما آن را اجرا کند. فراخوانی‌های workflow-run زمانی skip می‌شوند که `main` جلوتر رفته باشد یا وقتی اجرای غیر-skip دیگری از Docs Agent در ساعت گذشته ایجاد شده باشد. وقتی اجرا می‌شود، بازه commit از SHA منبع Docs Agent غیر-skip قبلی تا `main` فعلی را مرور می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر اسناد را پوشش دهد.

### عامل عملکرد تست

گردش‌کار `Test Performance Agent` یک مسیر نگهداری Codex رویدادمحور برای تست‌های کند است. زمان‌بندی خالص ندارد: اجرای موفق CI push غیرربات روی `main` می‌تواند آن را trigger کند، اما اگر فراخوانی workflow-run دیگری همان روز UTC قبلا اجرا شده یا در حال اجرا باشد، skip می‌کند. dispatch دستی آن گیت فعالیت روزانه را دور می‌زند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای کل suite می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک حفظ‌کننده پوشش برای عملکرد تست انجام دهد نه refactorهای گسترده، سپس گزارش کل suite را دوباره اجرا می‌کند و تغییراتی را که تعداد تست‌های baseline پاس‌شده را کاهش دهند رد می‌کند. گزارش گروه‌بندی‌شده زمان دیواری هر config و حداکثر RSS را روی Linux و macOS ثبت می‌کند، بنابراین مقایسه قبل/بعد دلتاهای حافظه تست را کنار دلتاهای مدت‌زمان نشان می‌دهد. اگر baseline تست‌های failing داشته باشد، Codex فقط می‌تواند failureهای بدیهی را اصلاح کند و گزارش کل suite پس از عامل باید پیش از commit شدن هر چیزی pass شود. وقتی `main` پیش از land شدن push ربات جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را retry می‌کند؛ patchهای stale دارای conflict skip می‌شوند. از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo عامل اسناد را حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای پاکسازی duplicate پس از land است. به‌صورت پیش‌فرض dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتا فهرست‌شده را close می‌کند. پیش از تغییر دادن GitHub، بررسی می‌کند که PR land شده merge شده باشد و هر duplicate یا issue ارجاع‌شده مشترک داشته باشد یا hunkهای تغییر یافته هم‌پوشان داشته باشد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## گیت‌های بررسی محلی و مسیریابی تغییرات

منطق محلی changed-lane در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن گیت بررسی محلی درباره مرزهای معماری سخت‌گیرتر از دامنه گسترده پلتفرم CI است:

- تغییرات production هسته، typecheck تولید هسته و تست هسته به‌علاوه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط-تست هسته، فقط typecheck تست هسته به‌علاوه lint هسته را اجرا می‌کنند؛
- تغییرات production افزونه، typecheck تولید افزونه و تست افزونه به‌علاوه lint افزونه را اجرا می‌کنند؛
- تغییرات فقط-تست افزونه، typecheck تست افزونه به‌علاوه lint افزونه را اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا قرارداد plugin به typecheck افزونه گسترش می‌یابند چون افزونه‌ها به آن قراردادهای هسته وابسته‌اند (sweepهای افزونه Vitest همچنان کار تست صریح می‌مانند)؛
- version bumpهای فقط metadata انتشار، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی root را اجرا می‌کنند؛
- تغییرات root/config ناشناخته برای ایمنی fail به همه مسیرهای بررسی می‌روند.

مسیریابی محلی changed-test در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش‌های مستقیم تست خودشان اجرا می‌شوند، ویرایش‌های منبع ابتدا mappingهای صریح، سپس تست‌های sibling و وابستگان import-graph را ترجیح می‌دهند. پیکربندی تحویل group-room مشترک یکی از mappingهای صریح است: تغییرات در پیکربندی visible-reply گروه، حالت تحویل پاسخ منبع، یا prompt سیستم message-tool از مسیر تست‌های پاسخ هسته به‌علاوه regressionهای تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین push PR fail شود. فقط وقتی تغییر به‌اندازه کافی کل harness را درگیر می‌کند که مجموعه mapped ارزان proxy قابل اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Crabbox پوشش remote-box متعلق به مخزن برای اثبات لینوکسی نگه‌دارندگان است. زمانی از ریشهٔ مخزن از آن استفاده کنید که یک بررسی برای چرخهٔ ویرایش محلی بیش از حد گسترده است، وقتی هم‌ارزی با CI اهمیت دارد، یا وقتی اثبات به اسرار، Docker، مسیرهای بسته، boxهای قابل‌استفادهٔ مجدد، یا گزارش‌های راه‌دور نیاز دارد. backend عادی OpenClaw برابر است با
`blacksmith-testbox`؛ ظرفیت AWS/Hetzner متعلق به پروژه، fallback برای قطعی‌های Blacksmith، مشکلات سهمیه، یا آزمون صریح با ظرفیت متعلق به پروژه است.

اجراهای مبتنی بر Crabbox در Blacksmith، Testboxهای یک‌بارمصرف را گرم می‌کنند، ادعا می‌کنند، همگام‌سازی می‌کنند، اجرا می‌کنند، گزارش می‌دهند، و پاک‌سازی می‌کنند. بررسی داخلی سلامت همگام‌سازی وقتی فایل‌های ریشهٔ لازم مانند `pnpm-lock.yaml` ناپدید شوند یا وقتی `git status --short` دست‌کم ۲۰۰ حذفِ track‌شده نشان دهد، سریعاً شکست می‌خورد. برای PRهای عمدی با حذف‌های گسترده، برای فرمان راه‌دور `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

Crabbox همچنین یک فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از همگام‌سازی در مرحلهٔ sync می‌ماند، خاتمه می‌دهد. برای غیرفعال کردن این محافظ، `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمولاً بزرگ، مقدار بزرگ‌تری بر حسب میلی‌ثانیه استفاده کنید.

پیش از نخستین اجرا، پوشش را از ریشهٔ مخزن بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

پوشش مخزن یک باینری قدیمی Crabbox را که `blacksmith-testbox` را اعلام نمی‌کند، رد می‌کند. provider را صریحاً پاس بدهید، حتی با اینکه `.crabbox.yaml` پیش‌فرض‌های owned-cloud دارد. در worktreeهای Codex یا checkoutهای linked/sparse، از اسکریپت محلی `pnpm crabbox:run` پرهیز کنید، چون pnpm ممکن است پیش از شروع Crabbox وابستگی‌ها را reconcile کند؛ به‌جای آن، پوشش node را مستقیماً فراخوانی کنید:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

اجراهای مبتنی بر Blacksmith به Crabbox 0.22.0 یا جدیدتر نیاز دارند تا پوشش رفتار فعلی همگام‌سازی، صف، و پاک‌سازی Testbox را دریافت کند. هنگام استفاده از checkout هم‌سطح، پیش از کارهای زمان‌سنجی یا اثبات، باینری محلی ignoreشده را دوباره بسازید:

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

خلاصهٔ JSON نهایی را بخوانید. فیلدهای مفید عبارت‌اند از `provider`، `leaseId`،
`syncDelegated`، `exitCode`، `commandMs`، و `totalMs`. برای اجراهای delegated در Blacksmith Testbox، کد خروج پوشش Crabbox و خلاصهٔ JSON نتیجهٔ فرمان هستند. اجرای GitHub Actions پیوندشده مالک hydration و keepalive است؛ وقتی Testbox پس از بازگشت فرمان SSH از بیرون متوقف شده باشد، می‌تواند با وضعیت `cancelled` تمام شود. این را یک artifact پاک‌سازی/وضعیت در نظر بگیرید، مگر اینکه `exitCode` پوشش غیرصفر باشد یا خروجی فرمان یک آزمون شکست‌خورده نشان دهد. اجراهای یک‌بارمصرف Crabbox مبتنی بر Blacksmith باید Testbox را به‌طور خودکار متوقف کنند؛ اگر اجرایی interrupt شد یا پاک‌سازی نامشخص بود، boxهای زنده را بررسی کنید و فقط boxهایی را که خودتان ایجاد کرده‌اید متوقف کنید:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

reuse را فقط وقتی استفاده کنید که عمداً به چند فرمان روی همان box هیدراته‌شده نیاز دارید:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

اگر Crabbox همان لایهٔ خراب است اما خود Blacksmith کار می‌کند، از Blacksmith مستقیم فقط برای diagnostics مانند `list`، `status`، و پاک‌سازی استفاده کنید. پیش از اینکه یک اجرای مستقیم Blacksmith را اثبات نگه‌دارنده در نظر بگیرید، مسیر Crabbox را اصلاح کنید.

اگر `blacksmith testbox list --all` و `blacksmith testbox status` کار می‌کنند اما warmupهای جدید پس از چند دقیقه بدون IP یا URL اجرای Actions در وضعیت `queued` می‌مانند، آن را فشار provider، صف، billing، یا محدودیت سازمانی Blacksmith در نظر بگیرید. idهای queued را که ایجاد کرده‌اید متوقف کنید، از شروع Testboxهای بیشتر پرهیز کنید، و اثبات را به مسیر ظرفیت Crabbox متعلق به پروژه در پایین منتقل کنید تا هم‌زمان کسی dashboard، billing، و محدودیت‌های سازمانی Blacksmith را بررسی کند.

فقط وقتی به ظرفیت Crabbox متعلق به پروژه escalate کنید که Blacksmith down است، سهمیه‌اش محدود شده، محیط لازم را ندارد، یا ظرفیت متعلق به پروژه صراحتاً هدف است:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

زیر فشار AWS، از `class=beast` پرهیز کنید مگر اینکه کار واقعاً به CPU در کلاس 48xlarge نیاز داشته باشد. یک درخواست `beast` از ۱۹۲ vCPU شروع می‌شود و ساده‌ترین راه برای برخورد با سهمیهٔ منطقه‌ای EC2 Spot یا On-Demand Standard است. `.crabbox.yaml` متعلق به مخزن به‌طور پیش‌فرض `standard`، چندین منطقهٔ ظرفیت، و `capacity.hints: true` را تنظیم می‌کند تا leaseهای AWS brokered، منطقه/market انتخاب‌شده، فشار سهمیه، fallback Spot، و هشدارهای کلاس پرفشار را چاپ کنند. برای بررسی‌های گستردهٔ سنگین‌تر از `fast` استفاده کنید، فقط پس از کافی نبودن standard/fast از `large` استفاده کنید، و `beast` را فقط برای مسیرهای CPU-bound استثنایی مانند ماتریس‌های full-suite یا all-plugin Docker، اعتبارسنجی صریح release/blocker، یا profiling عملکرد high-core به کار ببرید. از `beast` برای `pnpm check:changed`، آزمون‌های متمرکز، کارهای docs-only، lint/typecheck معمولی، reproهای کوچک E2E، یا triage قطعی Blacksmith استفاده نکنید. برای تشخیص ظرفیت از `--market on-demand` استفاده کنید تا نوسان market مربوط به Spot با سیگنال آمیخته نشود.

`.crabbox.yaml` مالک پیش‌فرض‌های provider، sync، و hydration در GitHub Actions برای مسیرهای owned-cloud است. این فایل `.git` محلی را exclude می‌کند تا checkout هیدراته‌شدهٔ Actions به‌جای همگام‌سازی remoteهای محلی نگه‌دارنده و object storeها، metadata گیت remote خودش را نگه دارد، و artifactهای runtime/build محلی را که هرگز نباید منتقل شوند exclude می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، fetch کردن `origin/main`، و handoff محیط غیرمحرمانه برای فرمان‌های owned-cloud `crabbox run --id <cbx_id>` است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)

---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شد یا اجرا نشد
    - در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگ‌کردن اجرای اعتبارسنجی انتشار یا اجرای دوبارهٔ آن هستید
    - شما در حال تغییر ارسال ClawSweeper یا بازارسال فعالیت GitHub هستید
summary: گراف وظایف CI، گیت‌های محدوده، چترهای انتشار، و معادل‌های فرمان محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-06-28T00:10:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. pushهای متعارف
`main` ابتدا از یک پنجره پذیرش ۹۰ ثانیه‌ای hosted-runner عبور می‌کنند.
گروه هم‌زمانی موجود `CI` وقتی commit جدیدتری وارد شود، آن اجرای در انتظار را
لغو می‌کند، بنابراین mergeهای متوالی هرکدام یک ماتریس کامل Blacksmith ثبت
نمی‌کنند. pull requestها و dispatchهای دستی از این انتظار عبور می‌کنند. سپس job
`preflight` diff را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده‌اند،
laneهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمدا scoping
هوشمند را دور می‌زنند و برای release candidateها و اعتبارسنجی گسترده، کل گراف را
fan out می‌کنند. laneهای Android از طریق `include_android` همچنان opt-in می‌مانند.
پوشش فقط-انتشار Plugin در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease)
قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک dispatch
دستی صریح اجرا می‌شود.

## نمای کلی Pipeline

| Job                                | هدف                                                                                                   | زمان اجرا                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | تشخیص تغییرات فقط-مستندات، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest CI                   | همیشه روی pushها و PRهای غیر draft                  |
| `runner-admission`                 | debounce میزبانی‌شده ۹۰ ثانیه‌ای برای pushهای متعارف `main` پیش از ثبت کار Blacksmith                | هر اجرای CI؛ sleep فقط روی pushهای متعارف `main` |
| `security-fast`                    | تشخیص کلید خصوصی، audit workflowهای تغییرکرده با `zizmor`، و audit lockfile تولید                 | همیشه روی pushها و PRهای غیر draft                  |
| `check-dependencies`               | عبور فقط-وابستگی Knip تولید به‌علاوه guard فهرست مجاز فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node                               |
| `build-artifacts`                  | ساخت `dist/`، Control UI، بررسی‌های smoke برای CLI ساخته‌شده، بررسی‌های artifact ساخته‌شده embed شده، و artifactهای قابل استفاده مجدد | تغییرات مرتبط با Node                               |
| `checks-fast-core`                 | laneهای سریع صحت‌سنجی Linux مانند bundled، protocol، QA Smoke CI، و بررسی‌های routing CI                | تغییرات مرتبط با Node                               |
| `checks-fast-contracts-plugins-*`  | دو بررسی shard شده قرارداد Plugin                                                                        | تغییرات مرتبط با Node                               |
| `checks-fast-contracts-channels-*` | دو بررسی shard شده قرارداد channel                                                                       | تغییرات مرتبط با Node                               |
| `checks-node-core-*`               | shardهای تست Core Node، به‌استثنای laneهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node                               |
| `check-*`                          | معادل shard شده gate اصلی محلی: typeهای تولید، lint، guardها، typeهای test، و smoke سخت‌گیرانه                | تغییرات مرتبط با Node                               |
| `check-additional-*`               | معماری، drift boundary/prompt به‌صورت shard شده، guardهای extension، boundary package، و topology runtime     | تغییرات مرتبط با Node                               |
| `checks-node-compat-node22`        | lane ساخت و smoke سازگاری Node 22                                                                | dispatch دستی CI برای انتشارها                     |
| `check-docs`                       | قالب‌بندی، lint، و بررسی لینک‌های شکسته مستندات                                                             | مستندات تغییر کرده باشند                                        |
| `skills-python`                    | Ruff + pytest برای Skills مبتنی بر Python                                                                    | تغییرات مرتبط با Skillهای Python                       |
| `checks-windows`                   | تست‌های اختصاصی process/path در Windows به‌علاوه regressionهای specifier import runtime مشترک                      | تغییرات مرتبط با Windows                            |
| `macos-node`                       | lane تست TypeScript در macOS با استفاده از artifactهای ساخته‌شده مشترک                                               | تغییرات مرتبط با macOS                              |
| `macos-swift`                      | lint، build، و testهای Swift برای app macOS                                                            | تغییرات مرتبط با macOS                              |
| `ios-build`                        | تولید پروژه Xcode به‌علاوه ساخت simulator app iOS                                                 | تغییرات app iOS، app kit مشترک، یا Swabble         |
| `android`                          | testهای unit Android برای هر دو flavor به‌علاوه ساخت یک debug APK                                              | تغییرات مرتبط با Android                            |
| `test-performance-agent`           | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت مورد اعتماد                                                 | موفقیت CI اصلی یا dispatch دستی                  |
| `openclaw-performance`             | گزارش‌های عملکرد runtime روزانه/درخواستی Kova با mock-provider، deep-profile، و laneهای زنده GPT 5.5 | dispatch زمان‌بندی‌شده و دستی                       |

## ترتیب fail-fast

1. `runner-admission` فقط برای pushهای متعارف `main` منتظر می‌ماند؛ push جدیدتر اجرا را پیش از ثبت Blacksmith لغو می‌کند.
2. `preflight` تصمیم می‌گیرد اصلا کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` مرحله‌هایی درون همین job هستند، نه jobهای مستقل.
3. `security-fast`، `check-*`، `check-additional-*`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و ماتریس platform سریع fail می‌شوند.
4. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان downstream به‌محض آماده شدن build مشترک شروع کنند.
5. laneهای سنگین‌تر platform و runtime پس از آن fan out می‌شوند: `checks-fast-core`، `checks-fast-contracts-plugins-*`، `checks-fast-contracts-channels-*`، `checks-node-core-*`، `checks-windows`، `macos-node`، `macos-swift`، `ios-build`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref `main` وارد می‌شود، jobهای superseded را به‌صورت `cancelled` علامت بزند. مگر اینکه جدیدترین اجرا برای همان ref نیز fail شده باشد، این را نویز CI تلقی کنید. jobهای ماتریسی از `fail-fast: false` استفاده می‌کنند، و `build-artifacts` به‌جای صف کردن jobهای verifier کوچک، شکست‌های embedded channel، core-support-boundary، و gateway-watch را مستقیم گزارش می‌کند. کلید هم‌زمانی خودکار CI نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در گروه صف قدیمی نتواند اجراهای جدیدتر main را برای همیشه block کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای درحال انجام را لغو نمی‌کنند.

برای خلاصه کردن wall time، queue time، کندترین jobها، failureها، و barrier مربوط به fanout `pnpm-store-warmup` از GitHub Actions، از `pnpm ci:timings`، `pnpm ci:timings:recent`، یا `node scripts/ci-run-timings.mjs <run-id>` استفاده کنید. CI همین خلاصه اجرا را نیز به‌عنوان artifact با نام `ci-timings-summary` upload می‌کند. برای زمان‌بندی build، مرحله `Build dist` در job `build-artifacts` را بررسی کنید: `pnpm build:ci-artifacts` عبارت `[build-all] phase timings:` را چاپ می‌کند و شامل `ui:build` است؛ job همچنین artifact `startup-memory` را upload می‌کند.

برای اجراهای pull request، job پایانی timing-summary پیش از پاس دادن `GH_TOKEN` به `gh run view`، helper را از revision پایه مورد اعتماد اجرا می‌کند. این کار query دارای token را بیرون از کد تحت کنترل branch نگه می‌دارد و همچنان اجرای CI فعلی pull request را خلاصه می‌کند.

## زمینه PR و شواهد

PRهای contributor خارجی یک gate زمینه PR و شواهد را از
`.github/workflows/real-behavior-proof.yml` اجرا می‌کنند. این workflow commit پایه مورد اعتماد
را checkout می‌کند و فقط بدنه PR را ارزیابی می‌کند؛ کدی از branch contributor اجرا نمی‌کند.

این gate روی نویسندگان PR اعمال می‌شود که owner، member،
collaborator، یا bot مخزن نیستند. وقتی بدنه PR شامل بخش‌های نوشته‌شده
`What Problem This Solves` و `Evidence` باشد، pass می‌شود. شواهد می‌تواند یک
test متمرکز، نتیجه CI، screenshot، recording، خروجی terminal، مشاهده زنده،
log redact شده، یا لینک artifact باشد. بدنه intent و اعتبارسنجی مفید را فراهم می‌کند؛
reviewerها code، testها، و CI را بررسی می‌کنند تا correctness را ارزیابی کنند.

وقتی check fail می‌شود، به‌جای push کردن commit کد دیگر، بدنه PR را به‌روزرسانی کنید.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با unit testهای `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest preflight طوری عمل کند که انگار هر بخش scoped تغییر کرده است.

- **ویرایش‌های CI workflow** گراف CI مربوط به Node را به‌همراه linting workflow اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، iOS، Android، یا macOS را force نمی‌کنند؛ آن laneهای platform همچنان به تغییرات source platform محدود می‌مانند.
- **Workflow Sanity**، `actionlint`، `zizmor` را روی همه فایل‌های YAML مربوط به workflow، guard interpolation برای composite-action، و guard conflict-marker اجرا می‌کند. job `security-fast` محدود به PR نیز `zizmor` را روی فایل‌های workflow تغییرکرده اجرا می‌کند تا findingهای امنیتی workflow زودتر در گراف اصلی CI fail شوند.
- **مستندات روی pushهای `main`** با workflow مستقل `Docs` و همان mirror مستندات ClawHub که CI استفاده می‌کند، بررسی می‌شوند؛ بنابراین pushهای ترکیبی code+docs، shard مربوط به `check-docs` در CI را نیز صف نمی‌کنند. pull requestها و CI دستی همچنان وقتی مستندات تغییر کرده باشند `check-docs` را از CI اجرا می‌کنند.
- **TUI PTY** برای تغییرات TUI در shard Linux Node با نام `checks-node-core-runtime-tui-pty` اجرا می‌شود. این shard، `test/vitest/vitest.tui-pty.config.ts` را با `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` اجرا می‌کند، بنابراین هم lane fixture قطعی `TuiBackend` و هم smoke کندتر `tui --local` را پوشش می‌دهد که فقط endpoint مدل خارجی را mock می‌کند.
- **ویرایش‌های فقط routing در CI، ویرایش‌های منتخب fixture ارزان core-test، و ویرایش‌های محدود helper/test-routing برای قرارداد Plugin** از یک مسیر manifest سریع فقط-Node استفاده می‌کنند: `preflight`، security، و یک task `checks-fast-core`. وقتی تغییر فقط به سطح‌های routing یا helper محدود باشد که task سریع مستقیما آن‌ها را exercise می‌کند، آن مسیر artifactهای build، سازگاری Node 22، قراردادهای channel، shardهای کامل core، shardهای bundled-plugin، و ماتریس‌های guard اضافی را رد می‌کند.
- **بررسی‌های Windows Node** به wrapperهای process/path اختصاصی Windows، helperهای runner مربوط به npm/pnpm/UI، config مربوط به package manager، و سطح‌های CI workflow که آن lane را اجرا می‌کنند محدود است؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط-test روی laneهای Linux Node باقی می‌مانند.

کندترین خانواده‌های آزمون Node تقسیم یا متوازن شده‌اند تا هر کار بدون رزرو بیش‌ازحد اجراکننده‌ها کوچک بماند: قراردادهای plugin و قراردادهای کانال هرکدام به‌صورت دو شارد وزن‌دار با پشتوانه Blacksmith و fallback استاندارد اجراکننده GitHub اجرا می‌شوند، مسیرهای سریع/پشتیبانی واحد هسته جداگانه اجرا می‌شوند، زیرساخت runtime هسته میان state، process/config، shared و سه شارد دامنه cron تقسیم شده است، auto-reply به‌صورت workerهای متوازن اجرا می‌شود (با تقسیم زیردرخت reply به شاردهای agent-runner، dispatch و commands/state-routing)، و پیکربندی‌های agentic gateway/server به‌جای انتظار برای artifactهای ساخته‌شده، میان مسیرهای chat/auth/model/http-plugin/runtime/startup تقسیم شده‌اند. سپس CI عادی فقط شاردهای include-pattern زیرساخت ایزوله را در بسته‌های قطعی حداکثر ۶۴ فایل آزمون بسته‌بندی می‌کند، که ماتریس Node را بدون ادغام مجموعه‌های non-isolated command/cron، agents-core حالت‌دار، یا gateway/server کاهش می‌دهد؛ مجموعه‌های ثابت سنگین روی ۸ vCPU می‌مانند، درحالی‌که مسیرهای بسته‌بندی‌شده و کم‌وزن‌تر از ۴ vCPU استفاده می‌کنند. Pull requestها روی repository رسمی از یک طرح پذیرش فشرده اضافی استفاده می‌کنند: همان گروه‌های per-config در subprocessهای ایزوله داخل طرح فعلی ۳۴ کاری Linux Node اجرا می‌شوند، بنابراین یک PR منفرد ماتریس کامل بیش از ۷۰ کاری Node را ثبت نمی‌کند. pushهای `main`، dispatchهای دستی، و gateهای انتشار ماتریس کامل را حفظ می‌کنند. آزمون‌های گسترده مرورگر، QA، رسانه و pluginهای متفرقه به‌جای catch-all مشترک plugin از پیکربندی‌های اختصاصی Vitest خود استفاده می‌کنند. شاردهای include-pattern ورودی‌های زمان‌بندی را با نام شارد CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک پیکربندی کامل را از یک شارد فیلترشده تشخیص دهد. `check-additional-*` کارهای compile/canary مرز package را کنار هم نگه می‌دارد و معماری توپولوژی runtime را از پوشش gateway watch جدا می‌کند؛ فهرست boundary guard به یک شارد سنگین از نظر prompt و یک شارد ترکیبی برای stripeهای guard باقی‌مانده تقسیم می‌شود، که هرکدام guardهای مستقل انتخاب‌شده را هم‌زمان اجرا می‌کنند و زمان‌بندی هر check را چاپ می‌کنند. بررسی پرهزینه drift snapshot prompt مسیر خوشحال Codex به‌عنوان کار اضافی جداگانه فقط برای CI دستی و تغییرات اثرگذار بر prompt اجرا می‌شود، بنابراین تغییرات عادی و نامرتبط Node پشت تولید سرد snapshot prompt منتظر نمی‌مانند و شاردهای boundary متوازن می‌مانند، درحالی‌که prompt drift همچنان به PRای که باعث آن شده وصل می‌ماند؛ همان flag تولید Vitest snapshot prompt را داخل شارد built-artifact core support-boundary رد می‌کند. Gateway watch، آزمون‌های کانال، و شارد core support-boundary داخل `build-artifacts` پس از آن‌که `dist/` و `dist-runtime/` از قبل ساخته شدند، هم‌زمان اجرا می‌شوند.

پس از پذیرش، CI رسمی Linux تا ۲۴ کار آزمون Node هم‌زمان و
۱۲ کار برای مسیرهای کوچک‌تر fast/check را مجاز می‌کند؛ Windows و Android روی دو می‌مانند چون
poolهای اجراکننده آن‌ها محدودتر است.

طرح PR فشرده برای مجموعه فعلی ۱۸ کار Node تولید می‌کند: گروه‌های whole-config
در subprocessهای ایزوله با timeout بسته ۱۲۰ دقیقه‌ای batch می‌شوند،
درحالی‌که گروه‌های include-pattern همان بودجه کاری محدود را به اشتراک می‌گذارند.

CI Android هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK دیباگ Play را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه‌ای ندارد؛ مسیر unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، درحالی‌که از کار تکراری بسته‌بندی APK دیباگ در هر push مرتبط با Android جلوگیری می‌کند.

شارد `check-dependencies` دستور `pnpm deadcode:dependencies` (یک گذر production Knip فقط برای وابستگی‌ها که به آخرین نسخه Knip pin شده، با غیرفعال‌سازی حداقل سن انتشار pnpm برای نصب `dlx`) و `pnpm deadcode:unused-files` را اجرا می‌کند، که یافته‌های فایل استفاده‌نشده production در Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard فایل استفاده‌نشده وقتی PR یک فایل استفاده‌نشده جدید و بازبینی‌نشده اضافه کند یا یک ورودی stale در allowlist باقی بگذارد fail می‌شود، درحالی‌که سطح‌های عمدی dynamic plugin، generated، build، live-test و package bridge را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## انتقال فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت هدف از فعالیت repository OpenClaw به ClawSweeper است. این workflow کد pull request نامطمئن را checkout یا اجرا نمی‌کند. workflow یک token مربوط به GitHub App را از `CLAWSWEEPER_APP_PRIVATE_KEY` می‌سازد، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار مسیر دارد:

- `clawsweeper_item` برای درخواست‌های دقیق بازبینی issue و pull request؛
- `clawsweeper_comment` برای دستورهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های بازبینی در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent ClawSweeper ممکن است بررسی کند.

مسیر `github_activity` فقط metadata نرمال‌شده را forward می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این مسیر عمدا از forward کردن بدنه کامل webhook پرهیز می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper` برابر `.github/workflows/github-activity.yml` است، که event نرمال‌شده را به hook Gateway OpenClaw برای agent ClawSweeper ارسال می‌کند.

فعالیت عمومی مشاهده است، نه تحویل پیش‌فرض. agent ClawSweeper هدف Discord را در prompt خود دریافت می‌کند و فقط زمانی باید در `#clawsweeper` پست کند که event غافلگیرکننده، قابل اقدام، پرریسک یا از نظر عملیاتی مفید باشد. باز شدن‌ها و ویرایش‌های روتین، گردش botها، نویز webhook تکراری و ترافیک review عادی باید به `NO_REPLY` منجر شوند.

در سراسر این مسیر با titleها، commentها، bodyها، متن review، نام branchها و پیام‌های commit در GitHub به‌عنوان داده نامطمئن برخورد کنید. آن‌ها ورودی خلاصه‌سازی و triage هستند، نه دستورهایی برای workflow یا runtime agent.

## Dispatchهای دستی

dispatchهای دستی CI همان گراف کاری CI عادی را اجرا می‌کنند اما هر مسیر scoped غیر Android را روشن می‌کنند: شاردهای Linux Node، شاردهای bundled-plugin، شاردهای قرارداد plugin و کانال، سازگاری Node 22، `check-*`، `check-additional-*`، بررسی‌های smoke برای built-artifact، بررسی‌های docs، Python skills، Windows، macOS، build iOS و i18n مربوط به Control UI. dispatchهای دستی مستقل CI فقط با `include_android=true` Android را اجرا می‌کنند؛ چتر انتشار کامل با پاس‌دادن `include_android=true` Android را فعال می‌کند. بررسی‌های static پیش‌انتشار plugin، شارد فقط انتشار `agentic-plugins`، sweep کامل batch افزونه، و مسیرهای Docker پیش‌انتشار plugin از CI حذف شده‌اند. مجموعه پیش‌انتشار Docker فقط زمانی اجرا می‌شود که `Full Release Validation` workflow جداگانه `Plugin Prerelease` را با gate اعتبارسنجی انتشار فعال dispatch کند.

اجرای دستی از یک گروه concurrency یکتا استفاده می‌کند تا مجموعه کامل release-candidate با اجرای push یا PR دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به caller قابل اعتماد اجازه می‌دهد آن گراف را علیه یک branch، tag یا SHA کامل commit اجرا کند، درحالی‌که از فایل workflow در ref انتخاب‌شده dispatch استفاده می‌کند.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## اجراکننده‌ها

| اجراکننده                       | کارها                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | dispatch دستی CI و fallbackهای repository غیر رسمی، scanهای کیفیت CodeQL JavaScript/actions، workflow-sanity، labeler، auto-response، workflowهای docs خارج از CI، و install-smoke preflight تا ماتریس Blacksmith بتواند زودتر queue شود                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`، `security-fast`، شاردهای افزونه کم‌وزن‌تر، `checks-fast-core`، شاردهای قرارداد plugin/channel، بیشتر شاردهای bundled/کم‌وزن‌تر Linux Node، `check-guards`، `check-prod-types`، `check-test-types`، شاردهای منتخب `check-additional-*`، و `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | مجموعه‌های سنگین Linux Node حفظ‌شده، شاردهای `check-additional-*` سنگین از نظر boundary/extension، و `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`، `check-lint` (آن‌قدر به CPU حساس است که ۸ vCPU بیش از صرفه‌جویی‌اش هزینه داشت)؛ buildهای Docker مربوط به install-smoke (زمان queue با ۳۲ vCPU بیش از صرفه‌جویی‌اش هزینه داشت)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-15` fallback می‌کنند                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` و `ios-build` روی `openclaw/openclaw`؛ forkها به `macos-26` fallback می‌کنند                                                                                                                                                                                                  |

## بودجه ثبت اجراکننده

bucket فعلی ثبت اجراکننده GitHub در OpenClaw اجازه ۳٬۰۰۰ ثبت اجراکننده self-hosted
در هر ۵ دقیقه را می‌دهد. این limit میان همه ثبت‌های اجراکننده Blacksmith
در سازمان `openclaw` مشترک است، بنابراین افزودن یک نصب Blacksmith دیگر
bucket جدیدی اضافه نمی‌کند.

labelهای Blacksmith را منبع کمیاب برای کنترل burst در نظر بگیرید. کارهایی که
فقط route، notify، summarize، انتخاب shard یا scanهای کوتاه CodeQL را اجرا می‌کنند باید
روی اجراکننده‌های GitHub-hosted بمانند، مگر این‌که نیازهای اندازه‌گیری‌شده مخصوص Blacksmith
داشته باشند. هر ماتریس Blacksmith جدید، `max-parallel` بزرگ‌تر، یا workflow پرتکرار
باید count ثبت بدترین حالت خود را نشان دهد و هدف سطح سازمان را
زیر ۲٬۰۰۰ ثبت در هر ۵ دقیقه نگه دارد، تا برای repositoryهای هم‌زمان
و کارهای retry شده headroom باقی بماند.

CI repository رسمی، Blacksmith را به‌عنوان مسیر پیش‌فرض اجراکننده برای اجرای عادی push و pull-request نگه می‌دارد. `workflow_dispatch` و اجرای repositoryهای غیر رسمی از اجراکننده‌های GitHub-hosted استفاده می‌کنند، اما اجراهای عادی رسمی فعلا سلامت queue در Blacksmith را probe نمی‌کنند یا هنگام unavailable بودن Blacksmith به‌صورت خودکار به labelهای GitHub-hosted fallback نمی‌کنند.

## معادل‌های محلی

```bash
pnpm changed:lanes                            # دسته‌بند lane تغییرکرده محلی را برای origin/main...HEAD بررسی می‌کند
pnpm check:changed                            # دروازه بررسی محلی هوشمند: typecheck/lint/guards تغییرکرده بر اساس lane مرزی
pnpm check                                    # دروازه محلی سریع: tsgo تولید + lint بخش‌بندی‌شده + guards سریع موازی
pnpm check:test-types
pnpm check:timed                              # همان دروازه با زمان‌بندی هر مرحله
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # آزمون‌های vitest
pnpm test:changed                             # هدف‌های Vitest تغییرکرده هوشمند و ارزان
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # قالب‌بندی مستندات + lint + پیوندهای خراب
pnpm build                                    # ساخت dist وقتی artifactهای CI یا بررسی‌های smoke اهمیت دارند
pnpm ios:build                                # ایجاد و ساخت پروژه برنامه iOS
pnpm ci:timings                               # خلاصه کردن آخرین اجرای CI پوش origin/main
pnpm ci:timings:recent                        # مقایسه اجراهای موفق اخیر CI روی main
node scripts/ci-run-timings.mjs <run-id>      # خلاصه کردن زمان دیواری، زمان صف، و کندترین کارها
node scripts/ci-run-timings.mjs --latest-main # نادیده گرفتن نویز issue/comment و انتخاب CI پوش origin/main
node scripts/ci-run-timings.mjs --recent 10   # مقایسه اجراهای موفق اخیر CI روی main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## کارایی OpenClaw

`OpenClaw Performance` گردش‌کار کارایی محصول/runtime است. این گردش‌کار هر روز روی `main` اجرا می‌شود و می‌تواند به‌صورت دستی نیز dispatch شود:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

dispatch دستی معمولاً ref گردش‌کار را benchmark می‌کند. برای benchmark کردن یک برچسب انتشار یا شاخه‌ای دیگر با پیاده‌سازی فعلی گردش‌کار، `target_ref` را تنظیم کنید. مسیرهای گزارش منتشرشده و اشاره‌گرهای latest بر اساس ref آزموده‌شده کلید می‌خورند، و هر `index.md` ref/SHA آزموده‌شده، ref/SHA گردش‌کار، ref Kova، پروفایل، حالت احراز هویت lane، مدل، شمار تکرار، و فیلترهای سناریو را ثبت می‌کند.

این گردش‌کار OCM را از یک انتشار pin‌شده و Kova را از `openclaw/Kova` در ورودی pin‌شده `kova_ref` نصب می‌کند، سپس سه lane را اجرا می‌کند:

- `mock-provider`: سناریوهای تشخیصی Kova در برابر runtime ساخت محلی با احراز هویت جعلی سازگار با OpenAI و قطعی.
- `mock-deep-profile`: profiling پردازنده/heap/trace برای نقاط داغ راه‌اندازی، Gateway، و agent-turn.
- `live-openai-candidate`: یک نوبت عامل واقعی OpenAI `openai/gpt-5.5`، که وقتی `OPENAI_API_KEY` در دسترس نباشد رد می‌شود.

lane مربوط به mock-provider همچنین پس از گذر Kova، probeهای منبع بومی OpenClaw را اجرا می‌کند: زمان‌بندی و حافظه بوت Gateway در حالت‌های راه‌اندازی پیش‌فرض، hook، و ۵۰ Plugin؛ RSS وارد کردن Pluginهای همراه، حلقه‌های hello تکرارشونده mock-OpenAI برای `channel-chat-baseline`، فرمان‌های راه‌اندازی CLI در برابر Gateway بوت‌شده، و probe کارایی smoke وضعیت SQLite. وقتی گزارش منبع mock-provider منتشرشده قبلی برای ref آزموده‌شده در دسترس باشد، خلاصه منبع مقدارهای فعلی RSS و heap را با آن baseline مقایسه می‌کند و افزایش‌های بزرگ RSS را به‌عنوان `watch` علامت‌گذاری می‌کند. خلاصه Markdown probe منبع در بسته گزارش در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر lane artifactهای GitHub را بارگذاری می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، گردش‌کار همچنین `report.json`، `report.md`، بسته‌ها، `index.md`، و artifactهای source-probe را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` commit می‌کند. اشاره‌گر ref آزموده‌شده فعلی به‌صورت `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` گردش‌کار چتری دستی برای «اجرای همه‌چیز پیش از انتشار» است. این گردش‌کار یک شاخه، برچسب، یا SHA کامل commit را می‌پذیرد، گردش‌کار دستی `CI` را با آن هدف dispatch می‌کند، `Plugin Prerelease` را برای اثبات فقط-انتشار Plugin/package/static/Docker dispatch می‌کند، و `OpenClaw Release Checks` را برای smoke نصب، پذیرش package، بررسی‌های package میان‌سیستمی، رندر کارت امتیاز بلوغ از شواهد پروفایل QA، همترازی QA Lab، Matrix، و laneهای Telegram dispatch می‌کند. پروفایل‌های پایدار و کامل همیشه پوشش جامع live/E2E و soak مسیر انتشار Docker را شامل می‌شوند؛ پروفایل beta می‌تواند با `run_release_soak=true` آن را فعال کند. E2E مرجع package برای Telegram داخل Package Acceptance اجرا می‌شود، پس یک نامزد کامل poller زنده تکراری شروع نمی‌کند. پس از انتشار، `release_package_spec` را بدهید تا از package ارسال‌شده npm در release checks، Package Acceptance، Docker، cross-OS، و Telegram بدون ساخت دوباره استفاده شود. `npm_telegram_package_spec` را فقط برای اجرای دوباره متمرکز Telegram با package منتشرشده استفاده کنید. lane بسته زنده Plugin مربوط به Codex به‌صورت پیش‌فرض از همان وضعیت انتخاب‌شده استفاده می‌کند: `release_package_spec=openclaw@<tag>` منتشرشده، `codex_plugin_spec=npm:@openclaw/codex@<tag>` را استخراج می‌کند، در حالی که اجراهای SHA/artifact، `extensions/codex` را از ref انتخاب‌شده pack می‌کنند. برای منبع‌های سفارشی Plugin مانند specهای `npm:`، `npm-pack:`، یا `git:`، `codex_plugin_spec` را صراحتاً تنظیم کنید.

برای ماتریس مرحله‌ها، نام دقیق jobهای گردش‌کار، تفاوت‌های پروفایل، artifactها، و handleهای اجرای دوباره متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` گردش‌کار انتشار دستی و تغییردهنده است. پس از وجود داشتن برچسب انتشار و موفق شدن preflight مربوط به npm OpenClaw، آن را از `release/YYYY.M.PATCH` یا `main` dispatch کنید. این گردش‌کار `pnpm plugins:sync:check` را راستی‌آزمایی می‌کند، `Plugin NPM Release` را برای همه packageهای Plugin قابل انتشار dispatch می‌کند، `Plugin ClawHub Release` را برای همان SHA انتشار dispatch می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده dispatch می‌کند. انتشار پایدار همچنین به یک `windows_node_tag` دقیق نیاز دارد؛ گردش‌کار انتشار منبع Windows را راستی‌آزمایی می‌کند و نصب‌کننده‌های x64/ARM64 آن را با ورودی تأییدشده نامزد `windows_node_installer_digests` پیش از هر فرزند انتشار مقایسه می‌کند، سپس همان digestهای pin‌شده نصب‌کننده به‌همراه asset همراه دقیق و قرارداد checksum را پیش از انتشار پیش‌نویس GitHub release ترویج و راستی‌آزمایی می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات commit سنجاق‌شده روی شاخه‌ای که سریع تغییر می‌کند، به‌جای
`gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

ارجاع‌های dispatch در گردش‌کار GitHub باید شاخه یا tag باشند، نه SHA خام commit. این
helper یک شاخه موقت `release-ci/<sha>-...` را در SHA هدف push می‌کند،
`Full Release Validation` را از همان ref سنجاق‌شده dispatch می‌کند، بررسی می‌کند که
`headSha` همه گردش‌کارهای فرزند با هدف منطبق باشد، و پس از تکمیل اجرا شاخه موقت را
حذف می‌کند. verifier چتری همچنین اگر هر گردش‌کار فرزندی با SHA متفاوتی اجرا شده
باشد fail می‌شود.

`release_profile` گستره زنده/ارائه‌دهنده‌ای را کنترل می‌کند که به بررسی‌های release
ارسال می‌شود. گردش‌کارهای release دستی به‌صورت پیش‌فرض از `stable` استفاده می‌کنند؛
فقط وقتی از `full` استفاده کنید که عمداً ماتریس گسترده advisory ارائه‌دهنده/رسانه را
می‌خواهید. بررسی‌های release در حالت stable و full همیشه soak کامل مسیر release برای
live/E2E و Docker را اجرا می‌کنند؛ profile بتا می‌تواند با `run_release_soak=true`
آن را فعال کند.

- `minimum` سریع‌ترین laneهای حیاتی release مربوط به OpenAI/core را نگه می‌دارد.
- `stable` مجموعه پایدار ارائه‌دهنده/backend را اضافه می‌کند.
- `full` ماتریس گسترده advisory ارائه‌دهنده/رسانه را اجرا می‌کند.

چتر شناسه‌های اجرای فرزند dispatch‌شده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین job را برای هر اجرای فرزند اضافه می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط job verifier والد را دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هم `Full Release Validation` و هم `OpenClaw Release Checks` ورودی `rerun_group` را می‌پذیرند. برای یک release candidate از `all` استفاده کنید، برای فقط فرزند CI کامل معمولی از `ci`، برای فقط فرزند prerelease مربوط به plugin از `plugin-prerelease`، برای هر فرزند release از `release-checks`، یا روی چتر از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram`. این کار rerun یک box شکست‌خورده release را پس از یک fix متمرکز محدود نگه می‌دارد. برای یک lane شکست‌خورده cross-OS، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ فرمان‌های طولانی cross-OS خطوط Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade شامل زمان‌بندی هر فاز هستند. laneهای QA مربوط به release-check حالت advisory دارند، به‌جز gate استاندارد پوشش ابزار runtime که وقتی ابزارهای dynamic لازم OpenClaw از خلاصه tier استاندارد منحرف شوند یا ناپدید شوند، block می‌کند.

`OpenClaw Release Checks` از ref مورد اعتماد گردش‌کار استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به یک tarball با نام `release-package-under-test` resolve کند، سپس آن artifact را به بررسی‌های cross-OS و Package Acceptance، به‌علاوه گردش‌کار Docker مسیر release زنده/E2E هنگام اجرای پوشش soak ارسال می‌کند. این کار byteهای package را در boxهای release یکسان نگه می‌دارد و از بسته‌بندی دوباره همان candidate در چند job فرزند جلوگیری می‌کند. برای lane زنده npm-plugin مربوط به Codex، بررسی‌های release یا یک spec plugin منتشرشده و منطبق را که از `release_package_spec` مشتق شده ارسال می‌کنند، یا `codex_plugin_spec` ارائه‌شده توسط operator را ارسال می‌کنند، یا input را خالی می‌گذارند تا script Docker، Codex plugin مربوط به checkout انتخاب‌شده را pack کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all`
چتر قدیمی‌تر را جایگزین می‌کنند. monitor والد هر گردش‌کار فرزندی را که قبلاً dispatch
کرده باشد هنگام لغو والد cancel می‌کند، بنابراین validation جدید main پشت یک اجرای
قدیمی دو ساعته release-check نمی‌ماند. validation شاخه/tag مربوط به release و گروه‌های
rerun متمرکز، `cancel-in-progress: false` را نگه می‌دارند.

## شاردهای زنده و E2E

فرزند live/E2E مربوط به release پوشش گسترده native `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک job سریالی، به‌صورت شاردهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobهای `native-live-src-gateway-profiles` فیلترشده بر اساس ارائه‌دهنده
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- شاردهای جداشده صوت/ویدئوی رسانه و شاردهای موسیقی فیلترشده بر اساس ارائه‌دهنده

این کار همان پوشش فایل را حفظ می‌کند و در عین حال rerun و تشخیص failureهای کند ارائه‌دهنده زنده را آسان‌تر می‌کند. نام‌های شارد aggregate یعنی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` برای rerunهای دستی یک‌باره همچنان معتبر می‌مانند.

شاردهای native live media در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط گردش‌کار `Live Media Runner Image` ساخته شده است. آن image از قبل `ffmpeg` و `ffprobe` را نصب می‌کند؛ jobهای رسانه فقط پیش از setup وجود binaryها را بررسی می‌کنند. suiteهای زنده مبتنی بر Docker را روی runnerهای معمول Blacksmith نگه دارید؛ jobهای container جای درستی برای اجرای testهای Docker تودرتو نیستند.

شاردهای زنده مدل/بک‌اند با پشتوانه Docker برای هر کامیت انتخاب‌شده از یک تصویر مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. workflow انتشار زنده این تصویر را یک بار می‌سازد و push می‌کند، سپس شاردهای مدل زنده Docker، Gateway شاردشده بر اساس provider، بک‌اند CLI، اتصال ACP و هارنس Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. شاردهای Gateway Docker سقف‌های صریح `timeout` در سطح اسکریپت دارند که پایین‌تر از مهلت job در workflow است، تا یک کانتینر گیرکرده یا مسیر پاک‌سازی به‌جای مصرف کل بودجه release-check سریع fail شود. اگر آن شاردها تارگت کامل Docker منبع را مستقل دوباره بسازند، اجرای انتشار اشتباه پیکربندی شده و زمان واقعی را صرف ساخت‌های تکراری تصویر خواهد کرد.

## پذیرش بسته

از `Package Acceptance` زمانی استفاده کنید که سؤال این است: «آیا این بسته قابل‌نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» این با CI معمولی فرق دارد: CI معمولی درخت منبع را اعتبارسنجی می‌کند، در حالی که پذیرش بسته یک tarball واحد را از طریق همان هارنس Docker E2E که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند اعتبارسنجی می‌کند.

### Jobها

1. `resolve_package`، `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` آپلود می‌کند، و source، workflow ref، package ref، نسخه، SHA-256 و profile را در خلاصه مرحله GitHub چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. workflow بازاستفاده‌پذیر آن artifact را دانلود می‌کند، موجودی tarball را اعتبارسنجی می‌کند، در صورت نیاز تصویرهای Docker مبتنی بر digest بسته را آماده می‌کند، و laneهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout workflow، روی آن بسته اجرا می‌کند. وقتی یک profile چند `docker_lanes` هدفمند را انتخاب کند، workflow بازاستفاده‌پذیر بسته و تصویرهای مشترک را یک بار آماده می‌کند، سپس آن laneها را به‌صورت jobهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. زمانی اجرا می‌شود که `telegram_mode` برابر `none` نباشد و اگر پذیرش بسته یک مورد را resolve کرده باشد، همان artifact با نام `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده npm را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker، یا lane اختیاری Telegram fail شده باشد، workflow را fail می‌کند.

### منبع‌های نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه انتشار دقیق OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش prerelease/stable منتشرشده استفاده کنید.
- `source=ref` یک branch، tag یا SHA کامل کامیتِ مورداعتمادِ `package_ref` را بسته‌بندی می‌کند. resolver شاخه‌ها/تگ‌های OpenClaw را fetch می‌کند، بررسی می‌کند کامیت انتخاب‌شده از تاریخچه branch مخزن یا یک tag انتشار قابل‌دسترسی باشد، وابستگی‌ها را در یک worktree detached نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` عمومی HTTPS را دانلود می‌کند؛ `package_sha256` الزامی است. این مسیر credentialهای URL، پورت‌های HTTPS غیراستاندارد، hostnameها یا IPهای resolve‌شده خصوصی/داخلی/کاربرد ویژه، و redirect به خارج از همان سیاست ایمنی عمومی را رد می‌کند.
- `source=trusted-url` یک `.tgz` از HTTPS را از یک سیاست trusted-source نام‌گذاری‌شده در `.github/package-trusted-sources.json` دانلود می‌کند؛ `package_sha256` و `trusted_source_id` الزامی‌اند. این را فقط برای mirrorهای enterprise تحت مالکیت maintainer یا مخزن‌های بسته خصوصی استفاده کنید که به hostها، پورت‌ها، پیشوندهای مسیر، hostهای redirect، یا resolve شبکه خصوصی پیکربندی‌شده نیاز دارند. اگر سیاست bearer auth تعریف کند، workflow از secret ثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN` استفاده می‌کند؛ credentialهای جاسازی‌شده در URL همچنان رد می‌شوند.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای artifactهای به‌اشتراک‌گذاشته‌شده بیرونی باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد workflow/هارنس مورداعتمادی است که تست را اجرا می‌کند. `package_ref` کامیت منبعی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این اجازه می‌دهد هارنس تست فعلی کامیت‌های قدیمی‌تر منبع مورداعتماد را بدون اجرای منطق workflow قدیمی اعتبارسنجی کند.

### پروفایل‌های suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` به‌همراه `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunkهای کامل مسیر انتشار Docker با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد الزامی است

پروفایل `package` از پوشش آفلاین Plugin استفاده می‌کند تا اعتبارسنجی بسته منتشرشده وابسته به دسترس‌بودن زنده ClawHub نباشد. lane اختیاری Telegram از artifact با نام `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، در حالی که مسیر spec منتشرشده npm برای dispatchهای مستقل حفظ می‌شود.

برای سیاست اختصاصی تست به‌روزرسانی و Plugin، شامل دستورهای محلی،
laneهای Docker، ورودی‌های پذیرش بسته، پیش‌فرض‌های انتشار، و تریاژ failure،
[تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار، پذیرش بسته را با `source=artifact`، artifact بسته انتشار آماده‌شده، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار migration بسته، به‌روزرسانی، نصب Skills زنده ClawHub، پاک‌سازی وابستگی Plugin کهنه، تعمیر نصب Plugin پیکربندی‌شده، Plugin آفلاین، به‌روزرسانی Plugin، و proof Telegram را روی همان tarball بسته resolve‌شده نگه می‌دارد. پس از انتشار یک beta، `release_package_spec` را روی اعتبارسنجی کامل انتشار یا بررسی‌های انتشار OpenClaw تنظیم کنید تا همان matrix را بدون ساخت دوباره روی بسته npm منتشرشده اجرا کند؛ `package_acceptance_package_spec` را فقط زمانی تنظیم کنید که پذیرش بسته به بسته‌ای متفاوت از بقیه اعتبارسنجی انتشار نیاز دارد. بررسی‌های انتشار بین‌سیستمی همچنان onboarding، نصب‌کننده، و رفتار platform خاص هر OS را پوشش می‌دهند؛ اعتبارسنجی محصول بسته/به‌روزرسانی باید با پذیرش بسته شروع شود. lane Docker با نام `published-upgrade-survivor` در مسیر انتشار blocking، در هر اجرا یک baseline بسته منتشرشده را اعتبارسنجی می‌کند. در پذیرش بسته، tarball resolve‌شده `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده fallback را انتخاب می‌کند که پیش‌فرض آن `openclaw@latest` است؛ دستورهای rerun مربوط به laneهای failشده آن baseline را حفظ می‌کنند. اعتبارسنجی کامل انتشار با `run_release_soak=true` یا `release_profile=full`، `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا در چهار انتشار stable اخیر npm به‌علاوه انتشارهای pinned مرز سازگاری Plugin و fixtureهای مسئله‌مانند برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده OpenClaw، مسیرهای log با tilde، و ریشه‌های وابستگی Plugin قدیمی و کهنه گسترش یابد. انتخاب‌های چند-baseline در published-upgrade survivor بر اساس baseline به jobهای جداگانه runner هدفمند Docker شارد می‌شوند. workflow جداگانه `Update Migration` از lane Docker با نام `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند، زمانی که سؤال پاک‌سازی جامع به‌روزرسانی منتشرشده است، نه گستره معمول CI کامل انتشار. اجراهای aggregate محلی می‌توانند specهای دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` پاس بدهند، یک lane واحد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا برای matrix سناریو `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را تنظیم کنند. lane منتشرشده baseline را با یک دستورالعمل پخته‌شده `openclaw config set` پیکربندی می‌کند، گام‌های recipe را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz`، به‌همراه وضعیت RPC را probe می‌کند. laneهای fresh مربوط به بسته و نصب‌کننده Windows همچنین بررسی می‌کنند که یک بسته نصب‌شده بتواند override کنترل مرورگر را از یک مسیر خام absolute در Windows import کند. smoke بین‌سیستمی agent-turn برای OpenAI در صورت تنظیم، پیش‌فرض را از `OPENCLAW_CROSS_OS_OPENAI_MODEL` می‌گیرد، وگرنه `openai/gpt-5.5`، تا proof نصب و Gateway روی یک مدل تست GPT-5 باقی بماند و از پیش‌فرض‌های GPT-4.x اجتناب شود.

### پنجره‌های سازگاری legacy

پذیرش بسته برای بسته‌های ازقبل‌منتشرشده پنجره‌های محدود سازگاری legacy دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- ورودی‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- `doctor-switch` ممکن است زیرحالت پایداری `gateway install --wrapper` را وقتی بسته آن flag را expose نمی‌کند skip کند؛
- `update-channel-switch` ممکن است `patchedDependencies` گم‌شده pnpm را از fixture fake git مشتق‌شده از tarball حذف کند و ممکن است `update.channel` پایدارشده گم‌شده را log کند؛
- smokeهای Plugin ممکن است locationهای legacy رکورد نصب را بخوانند یا نبود پایداری رکورد نصب marketplace را بپذیرند؛
- `plugin-update` ممکن است migration metadata پیکربندی را مجاز بداند، در حالی که همچنان الزام می‌کند رکورد نصب و رفتار no-reinstall بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` نیز ممکن است برای فایل‌های stamp metadata ساخت محلی که از قبل shipped شده بودند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای warn یا skip، fail می‌شوند.

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

هنگام debug کردن یک اجرای failشده پذیرش بسته، از خلاصه `resolve_package` شروع کنید تا منبع بسته، نسخه، و SHA-256 را تأیید کنید. سپس اجرای child مربوط به `docker_acceptance` و artifactهای Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، logهای lane، زمان‌بندی فازها، و دستورهای rerun. به‌جای اجرای دوباره اعتبارسنجی کامل انتشار، rerun کردن پروفایل بسته failشده یا laneهای دقیق Docker را ترجیح دهید.

## smoke نصب

workflow جداگانه `Install Smoke` همان اسکریپت scope را از طریق job اختصاصی `preflight` خود دوباره استفاده می‌کند. این workflow پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای pull requestهایی اجرا می‌شود که سطح‌های Docker/package، تغییرات بسته/manifest مربوط به Pluginهای همراه، یا سطح‌های core plugin/channel/gateway/Plugin SDK را لمس می‌کنند که کارهای Docker smoke آن‌ها را اجرا می‌کنند. تغییرات فقط-سورس در Pluginهای همراه، ویرایش‌های فقط-تست، و ویرایش‌های فقط-مستندات کارگرهای Docker را رزرو نمی‌کنند. مسیر سریع image مربوط به Dockerfile ریشه را یک بار می‌سازد، CLI را بررسی می‌کند، smoke مربوط به CLI حذف agents در shared-workspace را اجرا می‌کند، e2e مربوط به container gateway-network را اجرا می‌کند، یک build arg برای extension همراه را تأیید می‌کند، و پروفایل محدود bundled-plugin Docker را تحت یک command timeout تجمیعی ۲۴۰ ثانیه‌ای اجرا می‌کند (اجرای Docker هر سناریو جداگانه سقف‌گذاری می‌شود).
- **مسیر کامل** پوشش نصب بسته QR و Docker/update نصب‌کننده را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call، و pull requestهایی نگه می‌دارد که واقعاً سطح‌های installer/package/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک image اسموک GHCR root Dockerfile با target-SHA را آماده یا بازاستفاده می‌کند، سپس نصب بسته QR، اسموک‌های root Dockerfile/gateway، اسموک‌های installer/update، و Docker E2E سریع مربوط به bundled-plugin را به‌صورت jobهای جدا اجرا می‌کند تا کار نصب‌کننده پشت اسموک‌های image ریشه منتظر نماند.

pushهای `main` (از جمله merge commitها) مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق changed-scope در یک push پوشش کامل درخواست کند، workflow اسموک سریع Docker را نگه می‌دارد و اسموک نصب کامل را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

اسموک کند Bun global install image-provider به‌صورت جداگانه با `run_bun_global_install_smoke` کنترل می‌شود. این اسموک در زمان‌بندی شبانه و از workflow بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما pull requestها و pushهای `main` آن را اجرا نمی‌کنند. CI عادی PR همچنان lane سریع رگرسیون Bun launcher را برای تغییرات مرتبط با Node اجرا می‌کند. تست‌های QR و installer Docker، Dockerfileهای نصب‌محور خودشان را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک image مشترک live-test را از قبل می‌سازد، OpenClaw را یک بار به‌صورت یک npm tarball بسته‌بندی می‌کند، و دو image مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner خام Node/Git برای laneهای installer/update/plugin-dependency؛
- یک image کاربردی که همان tarball را برای laneهای عملکردی عادی در `/app` نصب می‌کند.

تعریف laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` برای هر lane image را انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیم‌پذیرها

| متغیر                                  | پیش‌فرض | هدف                                                                                           |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای main-pool برای laneهای عادی.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live همزمان تا providerها throttle نکنند.                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | سقف laneهای نصب npm همزمان.                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی همزمان.                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع laneها برای جلوگیری از طوفان create در daemon Docker؛ برای بدون فاصله‌گذاری `0` تنظیم کنید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout پشتیبان برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` plan مربوط به scheduler را بدون اجرای laneها چاپ می‌کند.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق laneها با جداکننده ویرگول؛ smoke پاک‌سازی را رد می‌کند تا agents بتوانند یک lane ناموفق را بازتولید کنند. |

laneیی که از سقف مؤثر خود سنگین‌تر است همچنان می‌تواند از یک pool خالی شروع شود، سپس تا وقتی capacity را آزاد کند به‌تنهایی اجرا می‌شود. aggregate محلی Docker را preflight می‌کند، containerهای قدیمی OpenClaw E2E را حذف می‌کند، وضعیت laneهای فعال را منتشر می‌کند، زمان‌بندی laneها را برای مرتب‌سازی طولانی‌ترین-اول پایدار می‌کند، و به‌صورت پیش‌فرض پس از اولین failure زمان‌بندی laneهای pooled جدید را متوقف می‌کند.

### workflow قابل‌بازاستفاده live/E2E

workflow قابل‌بازاستفاده live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد کدام پوشش package، نوع image، live image، lane، و credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به outputها و summaryهای GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا artifact بسته مربوط به اجرای فعلی را دانلود می‌کند، یا artifact بسته را از `package_artifact_run_id` دانلود می‌کند؛ inventory tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای package-installed نیاز دارد imageهای Docker E2E خام/کاربردی GHCR با tag مبتنی بر package-digest را از طریق cache لایه Docker در Blacksmith می‌سازد و push می‌کند؛ و به‌جای ساخت دوباره، inputهای ارائه‌شده `docker_e2e_bare_image`/`docker_e2e_functional_image` یا imageهای موجود مبتنی بر package-digest را بازاستفاده می‌کند. pullهای image Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش retry می‌شوند تا stream گیرکرده registry/cache سریع retry شود و بخش عمده مسیر بحرانی CI را مصرف نکند.

### chunkهای مسیر انتشار

پوشش Docker انتشار jobهای chunkشده کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع image مورد نیازش را pull کند و چندین lane را از طریق همان scheduler وزنی اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunkهای فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و از `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `package-update-openai` شامل lane بسته live Codex plugin است، که بسته candidate OpenClaw را نصب می‌کند، Codex plugin را از `codex_plugin_spec` یا یک tarball هم‌رفرنس با تأیید صریح نصب Codex CLI نصب می‌کند، preflight مربوط به Codex CLI را اجرا می‌کند، سپس چندین turn همان‌نشستی OpenClaw agent را علیه OpenAI اجرا می‌کند. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` به‌عنوان aliasهای تجمیعی plugin/runtime باقی می‌مانند. alias lane مربوط به `install-e2e` به‌عنوان alias بازاجرای دستی تجمیعی برای هر دو lane نصب‌کننده provider باقی می‌ماند.

OpenWebUI وقتی پوشش کامل release-path آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و chunk مستقل `openwebui` را فقط برای dispatchهای مخصوص OpenWebUI نگه می‌دارد. laneهای به‌روزرسانی bundled-channel برای failureهای گذرای شبکه npm یک بار retry می‌شوند.

هر chunk، `.artifacts/docker-tests/` را همراه با لاگ‌های lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های phase، JSON مربوط به scheduler plan، جدول‌های slow-lane، و commandهای بازاجرای هر lane upload می‌کند. input مربوط به `docker_lanes` در workflow، laneهای انتخاب‌شده را علیه imageهای آماده‌شده اجرا می‌کند، نه jobهای chunk را؛ این کار debugging مربوط به failed-lane را به یک job هدفمند Docker محدود نگه می‌دارد و artifact بسته را برای آن اجرا آماده، دانلود، یا بازاستفاده می‌کند؛ اگر lane انتخاب‌شده یک lane live Docker باشد، job هدفمند image مربوط به live-test را برای آن بازاجرا به‌صورت محلی می‌سازد. commandهای بازاجرای GitHub تولیدشده برای هر lane، وقتی این مقادیر وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name`، و inputهای image آماده‌شده هستند، تا یک lane ناموفق بتواند دقیقاً همان بسته و imageهای اجرای ناموفق را بازاستفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow زمان‌بندی‌شده live/E2E، suite کامل Docker مسیر انتشار را روزانه اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/package پرهزینه‌تری است، بنابراین workflow جداگانه‌ای است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. pull requestهای عادی، pushهای `main`، و dispatchهای دستی مستقل CI آن suite را خاموش نگه می‌دارند. این workflow تست‌های Plugin همراه را بین هشت کارگر extension متوازن می‌کند؛ آن jobهای shard مربوط به extension تا دو گروه پیکربندی Plugin را همزمان با یک کارگر Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin با import سنگین jobهای اضافه CI ایجاد نکنند. مسیر فقط-انتشار prerelease Docker، laneهای هدفمند Docker را در گروه‌های کوچک batch می‌کند تا از رزرو ده‌ها runner برای jobهای یک تا سه دقیقه‌ای جلوگیری شود. workflow همچنین یک artifact اطلاع‌رسانی `plugin-inspector-advisory` از `@openclaw/plugin-inspector` upload می‌کند؛ findings بازرس ورودی triage هستند و gate مسدودکننده Plugin Prerelease را تغییر نمی‌دهند.

## QA Lab

QA Lab، laneهای اختصاصی CI خارج از workflow اصلی smart-scoped دارد. parity عامل‌محور زیر harnessهای گسترده QA و انتشار تو در تو قرار دارد، نه به‌عنوان workflow مستقل PR. وقتی parity باید همراه یک اجرای اعتبارسنجی گسترده حرکت کند، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- workflow مربوط به `QA-Lab - All Lanes` هر شب روی `main` و در dispatch دستی اجرا می‌شود؛ این workflow lane mock parity، lane live Matrix، و laneهای live Telegram و Discord را به‌عنوان jobهای موازی fan out می‌کند. jobهای live از environment مربوط به `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار laneهای live transport مربوط به Matrix و Telegram را با provider mock قطعی و مدل‌های mock-qualified (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا contract کانال از latency مدل live و startup عادی provider-plugin جدا شود. live transport gateway جست‌وجوی memory را غیرفعال می‌کند زیرا QA parity رفتار memory را جداگانه پوشش می‌دهد؛ اتصال provider توسط suiteهای جداگانه مدل live، provider بومی، و Docker provider پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند، و فقط وقتی CLI checkout‌شده آن را پشتیبانی کند `--fail-fast` را اضافه می‌کند. پیش‌فرض CLI و input دستی workflow همچنان `all` باقی می‌مانند؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای release-critical مربوط به QA Lab را پیش از تأیید انتشار اجرا می‌کند؛ gate QA parity آن، packهای candidate و baseline را به‌عنوان jobهای lane موازی اجرا می‌کند، سپس هر دو artifact را در یک job گزارش کوچک برای مقایسه نهایی parity دانلود می‌کند.

برای PRهای عادی، به‌جای اینکه parity را به‌عنوان status الزامی در نظر بگیرید، شواهد CI/check محدوده‌مند را دنبال کنید.

## CodeQL

workflow مربوط به `CodeQL` عمداً یک scanner امنیتی first-pass محدود است، نه sweep کامل repository. اجراهای روزانه، دستی، و guard مربوط به pull request غیر draft، کد workflow مربوط به Actions به‌همراه پرریسک‌ترین سطح‌های JavaScript/TypeScript را با queryهای امنیتی high-confidence فیلترشده به `security-severity` بالا/بحرانی scan می‌کنند.

guard مربوط به pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود، و همان matrix امنیتی high-confidence را مانند workflow زمان‌بندی‌شده اجرا می‌کند. CodeQL مربوط به Android و macOS از پیش‌فرض‌های PR بیرون می‌مانند.

### دسته‌های امنیتی

| Category                                          | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | احراز هویت، اسرار، sandbox، Cron، و مبنای Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌همراه runtime مربوط به Plugin کانال، Gateway، Plugin SDK، اسرار، و نقاط تماس حسابرسی              |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح سیاست SSRF در هسته، تجزیه IP، محافظ شبکه، واکشی وب، و Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، کمک‌کننده‌های اجرای فرایند، تحویل خروجی، و دروازه‌های اجرای ابزار عامل                                           |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد قرارداد بسته برای نصب Plugin، بارگذار، manifest، رجیستری، نصب با package-manager، بارگذاری منبع، و Plugin SDK |

### شاردهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — شارد زمان‌بندی‌شده امنیت Android. برنامه Android را برای CodeQL به‌صورت دستی روی کوچک‌ترین runner لینوکسی Blacksmith که توسط سلامت workflow پذیرفته می‌شود می‌سازد. زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — شارد امنیت macOS هفتگی/دستی. برنامه macOS را برای CodeQL به‌صورت دستی روی Blacksmith macOS می‌سازد، نتایج ساخت وابستگی‌ها را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. بیرون از پیش‌فرض‌های روزانه نگه داشته شده است، چون ساخت macOS حتی در حالت پاک نیز بر زمان اجرای کل غالب است.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` شارد غیرامنیتی متناظر است. فقط queryهای کیفیت JavaScript/TypeScript غیرامنیتی با شدت خطا را روی سطوح محدود و باارزش در runnerهای لینوکسی میزبانی‌شده توسط GitHub اجرا می‌کند تا اسکن‌های کیفیت بودجه ثبت runner در Blacksmith را مصرف نکنند. محافظ pull request آن عمدا کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیر draft فقط شاردهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای فرمان/مدل/ابزار عامل و ارسال پاسخ، کد schema/مهاجرت/IO پیکربندی، کد احراز هویت/اسرار/sandbox/امنیت، runtime کانال هسته و Plugin کانال باندل‌شده، پروتکل Gateway/متد سرور، چسب runtime/SDK حافظه، تحویل MCP/فرایند/خروجی، کاتالوگ runtime/مدل ارائه‌دهنده، صف‌های تشخیص/تحویل نشست، بارگذار Plugin، قرارداد Plugin SDK/بسته، یا runtime پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و workflow کیفیت همه دوازده شارد کیفیت PR را اجرا می‌کنند.

اجرای دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های محدود، قلاب‌های آموزش/تکرار برای اجرای یک شارد کیفیت به‌صورت جداگانه هستند.

| Category                                                | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، اسرار، sandbox، Cron، و Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema پیکربندی، مهاجرت، نرمال‌سازی، و IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای پروتکل Gateway و قراردادهای متد سرور                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال باندل‌شده                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | قراردادهای runtime اجرای فرمان، ارسال مدل/ارائه‌دهنده، ارسال و صف‌های پاسخ خودکار، و control-plane در ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | قراردادهای سرورهای MCP و پل‌های ابزار، کمک‌کننده‌های نظارت بر فرایند، و تحویل خروجی                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، facadeهای runtime حافظه، aliasهای Plugin SDK حافظه، چسب فعال‌سازی runtime حافظه، و فرمان‌های doctor حافظه                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | بخش‌های داخلی صف پاسخ، صف‌های تحویل نشست، کمک‌کننده‌های اتصال/تحویل نشست خروجی، سطوح بسته رویداد/لاگ تشخیصی، و قراردادهای CLI مربوط به doctor نشست |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | ارسال پاسخ ورودی Plugin SDK، کمک‌کننده‌های payload/قطعه‌بندی/runtime پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و کمک‌کننده‌های اتصال نشست/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و کشف ارائه‌دهنده، ثبت runtime ارائه‌دهنده، پیش‌فرض‌ها/کاتالوگ‌های ارائه‌دهنده، و رجیستری‌های وب/جستجو/واکشی/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | راه‌اندازی Control UI، پایداری محلی، جریان‌های کنترل Gateway، و قراردادهای runtime کنترل وظیفه                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای runtime واکشی/جستجوی وب هسته، IO رسانه، درک رسانه، تولید تصویر، و تولید رسانه                                                    |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای بارگذار، رجیستری، سطح عمومی، و entrypoint در Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع منتشرشده Plugin SDK در سمت بسته و کمک‌کننده‌های قرارداد بسته Plugin                                                                                      |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند بدون مبهم‌کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و Pluginهای باندل‌شده باید فقط پس از آن‌که پروفایل‌های محدود runtime و سیگنال پایدار پیدا کردند، دوباره به‌عنوان کار پیگیری scopeشده یا شاردشده افزوده شود.

## workflowهای نگهداری

### عامل مستندات

workflow `Docs Agent` یک مسیر نگهداری رویدادمحور Codex برای همسو نگه‌داشتن مستندات موجود با تغییرات تازه ادغام‌شده است. برنامه زمانی خالص ندارد: یک اجرای موفق CI مربوط به push غیر bot روی `main` می‌تواند آن را فعال کند، و اجرای دستی می‌تواند آن را مستقیما اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلو رفته باشد یا وقتی اجرای غیر ردشده دیگری از Docs Agent در ساعت گذشته ساخته شده باشد رد می‌شوند. وقتی اجرا می‌شود، بازه commit از SHA منبع قبلیِ Docs Agent که رد نشده تا `main` فعلی را بازبینی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### عامل عملکرد تست

workflow `Test Performance Agent` یک مسیر نگهداری رویدادمحور Codex برای تست‌های کند است. برنامه زمانی خالص ندارد: یک اجرای موفق CI مربوط به push غیر bot روی `main` می‌تواند آن را فعال کند، اما اگر فراخوانی workflow-run دیگری در همان روز UTC قبلا اجرا شده باشد یا در حال اجرا باشد، رد می‌شود. اجرای دستی از این دروازه فعالیت روزانه عبور می‌کند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای کل suite می‌سازد، به Codex اجازه می‌دهد به‌جای refactorهای گسترده فقط اصلاحات کوچک عملکرد تست با حفظ پوشش انجام دهد، سپس گزارش کل suite را دوباره اجرا می‌کند و تغییراتی را که شمارش baseline تست‌های پاس‌شده را کاهش دهند رد می‌کند. گزارش گروه‌بندی‌شده زمان دیواری هر پیکربندی و بیشینه RSS را روی Linux و macOS ثبت می‌کند، بنابراین مقایسه قبل/بعد، deltaهای حافظه تست را کنار deltaهای مدت‌زمان نشان می‌دهد. اگر baseline تست‌های شکست‌خورده داشته باشد، Codex فقط می‌تواند شکست‌های واضح را اصلاح کند و گزارش کل suite پس از عامل باید پیش از commit شدن هر چیزی پاس شود. وقتی `main` پیش از رسیدن push bot جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را دوباره تلاش می‌کند؛ patchهای کهنه دارای conflict رد می‌شوند. از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo عامل مستندات را حفظ کند.

### PRهای تکراری پس از ادغام

workflow `Duplicate PRs After Merge` یک workflow دستی نگهدارنده برای پاک‌سازی تکراری‌های پس از land است. پیش‌فرض آن dry-run است و فقط PRهای صراحتا فهرست‌شده را وقتی `apply=true` باشد می‌بندد. پیش از تغییر دادن GitHub، بررسی می‌کند که PR landشده merge شده باشد و هر تکراری یا issue ارجاع‌شده مشترک داشته باشد یا hunkهای تغییریافته هم‌پوشان داشته باشد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## دروازه‌های بررسی محلی و مسیریابی تغییرات

منطق lane محلی برای تغییرات در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن دروازه بررسی محلی نسبت به دامنه گسترده پلتفرم CI درباره مرزهای معماری سخت‌گیرتر است:

- تغییرات production هسته، typecheck مربوط به prod هسته و تست هسته به‌همراه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط تست هسته، فقط typecheck تست هسته به‌همراه lint هسته را اجرا می‌کنند؛
- تغییرات production افزونه، typecheck مربوط به prod افزونه و تست افزونه به‌همراه lint افزونه را اجرا می‌کنند؛
- تغییرات فقط تست افزونه، typecheck تست افزونه به‌همراه lint افزونه را اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا قرارداد Plugin به typecheck افزونه گسترش می‌یابند، چون افزونه‌ها به آن قراردادهای هسته وابسته‌اند؛ sweepهای افزونه Vitest همچنان کار تست صریح می‌مانند؛
- bumpهای نسخه‌ای فقط metadata انتشار، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی ریشه را اجرا می‌کنند؛
- تغییرات ناشناخته ریشه/پیکربندی برای ایمنی به همه laneهای بررسی fail می‌شوند.

مسیریابی محلی تست تغییرات در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش مستقیم تست‌ها خودشان را اجرا می‌کند، ویرایش‌های منبع ابتدا نگاشت‌های صریح، سپس تست‌های sibling و وابسته‌های import-graph را ترجیح می‌دهند. پیکربندی مشترک تحویل گروه-room یکی از نگاشت‌های صریح است: تغییرات در پیکربندی visible-reply گروه، حالت تحویل پاسخ منبع، یا prompt سیستمی message-tool از مسیر تست‌های پاسخ هسته به‌همراه regressionهای تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین push PR شکست بخورد. فقط وقتی تغییر آن‌قدر در سطح harness گسترده است که مجموعه نگاشت‌شده ارزان proxy قابل‌اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Crabbox wrapper متعلق به repo برای remote-box جهت اثبات نگهدارنده روی Linux است. وقتی بررسی برای حلقه ویرایش محلی بیش از حد گسترده است، وقتی هم‌ترازی با CI مهم است، یا وقتی اثبات به secrets، Docker، laneهای بسته، boxهای قابل استفاده مجدد، یا لاگ‌های remote نیاز دارد، آن را از ریشه repo استفاده کنید. backend معمول OpenClaw برابر `blacksmith-testbox` است؛ ظرفیت AWS/Hetzner تحت مالکیت، fallback برای قطعی‌های Blacksmith، مسائل quota، یا تست صریح با ظرفیت تحت مالکیت است.

Crabbox-backed Blacksmith اجراهای یک‌باره Testbox را گرم، claim، sync، run، report و پاک‌سازی می‌کند. بررسی سلامت sync داخلی وقتی فایل‌های ضروری ریشه مانند `pnpm-lock.yaml` ناپدید شوند یا وقتی `git status --short` دست‌کم ۲۰۰ حذف ردیابی‌شده را نشان دهد، سریع fail می‌شود. برای PRهای عمدی با حذف‌های بزرگ، برای فرمان راه‌دور `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

Crabbox همچنین فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از sync در مرحله sync بماند، خاتمه می‌دهد. برای غیرفعال کردن این محافظ، `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ از مقدار بزرگ‌تر برحسب میلی‌ثانیه استفاده کنید.

پیش از نخستین اجرا، wrapper را از ریشه repo بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper repo یک باینری Crabbox کهنه را که `blacksmith-testbox` را اعلام نمی‌کند رد می‌کند. provider را صریح پاس دهید، حتی با اینکه `.crabbox.yaml` پیش‌فرض‌های owned-cloud دارد. در worktreeهای Codex یا checkoutهای linked/sparse، از اسکریپت محلی `pnpm crabbox:run` پرهیز کنید، چون pnpm ممکن است پیش از شروع Crabbox وابستگی‌ها را reconcile کند؛ به‌جای آن wrapper مبتنی بر node را مستقیم فراخوانی کنید:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

اجراهای پشتیبانی‌شده با Blacksmith به Crabbox 0.22.0 یا جدیدتر نیاز دارند تا wrapper رفتار فعلی sync، صف و پاک‌سازی Testbox را دریافت کند. هنگام استفاده از checkout هم‌نیای، پیش از کار زمان‌سنجی یا اثبات، باینری محلی نادیده‌گرفته‌شده را دوباره بسازید:

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

اجرای دوباره آزمون متمرکز:

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

مجموعه کامل:

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

خلاصه JSON نهایی را بخوانید. فیلدهای مفید `provider`، `leaseId`، `syncDelegated`، `exitCode`، `commandMs` و `totalMs` هستند. برای اجراهای واگذار‌شده Blacksmith Testbox، کد خروج wrapper Crabbox و خلاصه JSON نتیجه فرمان هستند. اجرای لینک‌شده GitHub Actions مالک hydration و keepalive است؛ وقتی Testbox پس از بازگشت فرمان SSH از بیرون متوقف شده باشد، می‌تواند با وضعیت `cancelled` پایان یابد. مگر اینکه `exitCode` wrapper غیرصفر باشد یا خروجی فرمان یک آزمون ناموفق نشان دهد، آن را یک artifact پاک‌سازی/وضعیت در نظر بگیرید. اجراهای یک‌باره Crabbox با پشتیبانی Blacksmith باید Testbox را خودکار متوقف کنند؛ اگر اجرایی قطع شد یا پاک‌سازی نامشخص بود، boxهای زنده را بررسی کنید و فقط boxهایی را که خودتان ساخته‌اید متوقف کنید:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

فقط زمانی از reuse استفاده کنید که عمدا به چند فرمان روی همان box آماده‌شده نیاز دارید:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

اگر لایه خراب Crabbox است اما خود Blacksmith کار می‌کند، از Blacksmith مستقیم فقط برای عیب‌یابی‌هایی مانند `list`، `status` و پاک‌سازی استفاده کنید. پیش از اینکه یک اجرای مستقیم Blacksmith را به‌عنوان اثبات نگه‌دارنده در نظر بگیرید، مسیر Crabbox را درست کنید.

اگر `blacksmith testbox list --all` و `blacksmith testbox status` کار می‌کنند اما warmupهای جدید پس از چند دقیقه بدون IP یا URL اجرای Actions در وضعیت `queued` می‌مانند، آن را فشار provider، صف، billing یا محدودیت org در Blacksmith در نظر بگیرید. idهای queued را که ساخته‌اید متوقف کنید، از شروع Testboxهای بیشتر پرهیز کنید، و درحالی‌که کسی داشبورد Blacksmith، billing و محدودیت‌های org را بررسی می‌کند، اثبات را به مسیر ظرفیت Crabbox مالکیتی زیر منتقل کنید.

فقط زمانی به ظرفیت مالکیتی Crabbox ارتقا دهید که Blacksmith down باشد، با سهمیه محدود شده باشد، محیط لازم را نداشته باشد، یا ظرفیت مالکیتی صراحتا هدف باشد:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

زیر فشار AWS، از `class=beast` پرهیز کنید مگر اینکه task واقعا به CPU در حد 48xlarge نیاز داشته باشد. یک درخواست `beast` از ۱۹۲ vCPU شروع می‌شود و ساده‌ترین راه برای برخورد با سهمیه منطقه‌ای EC2 Spot یا On-Demand Standard است. `.crabbox.yaml` متعلق به repo به‌صورت پیش‌فرض از `standard`، چندین منطقه ظرفیت و `capacity.hints: true` استفاده می‌کند تا leaseهای AWS brokered منطقه/market انتخاب‌شده، فشار سهمیه، fallback به Spot و هشدارهای کلاس پرفشار را چاپ کنند. برای بررسی‌های گسترده سنگین‌تر از `fast` استفاده کنید، فقط پس از کافی نبودن standard/fast از `large` استفاده کنید، و `beast` را فقط برای laneهای استثنایی CPU-bound مانند full-suite یا matrixهای Docker همه Pluginها، اعتبارسنجی صریح release/blocker، یا پروفایلینگ عملکرد با هسته‌های زیاد به کار ببرید. از `beast` برای `pnpm check:changed`، آزمون‌های متمرکز، کار فقط مستندات، lint/typecheck عادی، reproهای کوچک E2E، یا triage قطعی Blacksmith استفاده نکنید. برای تشخیص ظرفیت از `--market on-demand` استفاده کنید تا نوسان بازار Spot با سیگنال مخلوط نشود.

`.crabbox.yaml` مالک پیش‌فرض‌های provider، sync و hydration مربوط به GitHub Actions برای laneهای owned-cloud است. این فایل `.git` محلی را مستثنا می‌کند تا checkout آماده‌شده Actions به‌جای sync کردن remoteهای محلی نگه‌دارنده و object storeها، metadata راه‌دور Git خودش را نگه دارد، و artifactهای runtime/build محلی را که هرگز نباید منتقل شوند مستثنا می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، fetch کردن `origin/main` و تحویل محیط غیرمحرمانه برای فرمان‌های owned-cloud `crabbox run --id <cbx_id>` است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)

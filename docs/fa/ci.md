---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شد یا نشد
    - در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگ‌کردن یک اجرای اعتبارسنجی انتشار یا اجرای دوباره آن هستید
    - شما در حال تغییر ارسال ClawSweeper یا بازفرستادن فعالیت GitHub هستید
summary: گراف کارهای CI، دروازه‌های دامنه، چترهای انتشار، و معادل‌های فرمان محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-06-30T14:12:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر push به `main` و هر pull request اجرا می‌شود. pushهای canonical
`main` ابتدا از یک پنجره پذیرش ۹۰ ثانیه‌ای hosted-runner عبور می‌کنند.
concurrency group موجود `CI` وقتی commit جدیدتری وارد می‌شود آن اجرای در انتظار را لغو می‌کند، بنابراین mergeهای پیاپی هرکدام یک matrix کامل Blacksmith ثبت نمی‌کنند. Pull requestها و dispatchهای دستی از این انتظار عبور می‌کنند. سپس job `preflight` diff را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده‌اند laneهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمدا smart scoping را دور می‌زنند و برای release candidateها و اعتبارسنجی گسترده، کل graph را fan out می‌کنند. laneهای Android از طریق `include_android` همچنان opt-in می‌مانند. پوشش plugin مخصوص release در workflow جداگانه [`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از [`Full Release Validation`](#full-release-validation) یا یک dispatch دستی صریح اجرا می‌شود.

## نمای کلی pipeline

| Job                                | هدف                                                                                                   | زمان اجرا                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | تشخیص تغییرات فقط-مستندات، scopeهای تغییرکرده، extensionهای تغییرکرده، و ساخت manifest مربوط به CI                   | همیشه روی pushها و PRهای غیر draft                  |
| `runner-admission`                 | debounce میزبانی‌شده ۹۰ ثانیه‌ای برای pushهای canonical `main` پیش از ثبت کار Blacksmith                | هر اجرای CI؛ sleep فقط روی pushهای canonical `main` |
| `security-fast`                    | تشخیص کلید خصوصی، audit workflow تغییرکرده از طریق `zizmor`، و audit lockfile تولید                 | همیشه روی pushها و PRهای غیر draft                  |
| `check-dependencies`               | گذر dependency-only تولید با Knip به‌همراه guard مربوط به allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node                               |
| `build-artifacts`                  | ساخت `dist/`، Control UI، smoke checkهای built-CLI، بررسی‌های built-artifact تعبیه‌شده، و artifactهای قابل استفاده مجدد | تغییرات مرتبط با Node                               |
| `checks-fast-core`                 | laneهای سریع صحت روی Linux مانند bundled، protocol، QA Smoke CI، و بررسی‌های routing مربوط به CI                | تغییرات مرتبط با Node                               |
| `checks-fast-contracts-plugins-*`  | دو بررسی sharded برای قراردادهای plugin                                                                        | تغییرات مرتبط با Node                               |
| `checks-fast-contracts-channels-*` | دو بررسی sharded برای قراردادهای channel                                                                       | تغییرات مرتبط با Node                               |
| `checks-node-core-*`               | shardهای تست Core Node، به‌جز laneهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node                               |
| `check-*`                          | معادل sharded gate اصلی محلی: typeهای تولید، lint، guardها، typeهای تست، و strict smoke                | تغییرات مرتبط با Node                               |
| `check-additional-*`               | معماری، boundary/prompt drift به‌صورت sharded، guardهای extension، package boundary، و runtime topology     | تغییرات مرتبط با Node                               |
| `checks-node-compat-node22`        | build سازگاری Node 22 و lane smoke                                                                | dispatch دستی CI برای releaseها                     |
| `check-docs`                       | قالب‌بندی مستندات، lint، و بررسی لینک‌های خراب                                                             | وقتی مستندات تغییر کرده‌اند                                        |
| `skills-python`                    | Ruff + pytest برای skillهای متکی به Python                                                                    | تغییرات مرتبط با skillهای Python                       |
| `checks-windows`                   | تست‌های مخصوص Windows برای process/path به‌همراه regressionهای shared runtime import specifier                      | تغییرات مرتبط با Windows                            |
| `macos-node`                       | lane تست TypeScript در macOS با استفاده از artifactهای ساخته‌شده مشترک                                               | تغییرات مرتبط با macOS                              |
| `macos-swift`                      | Swift lint، build، و تست‌ها برای app macOS                                                            | تغییرات مرتبط با macOS                              |
| `ios-build`                        | تولید پروژه Xcode به‌همراه build شبیه‌ساز app iOS                                                 | app iOS، shared app kit، یا تغییرات Swabble         |
| `android`                          | تست‌های unit Android برای هر دو flavor به‌همراه یک build debug APK                                              | تغییرات مرتبط با Android                            |
| `test-performance-agent`           | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت trusted                                                 | موفقیت CI اصلی یا dispatch دستی                  |
| `openclaw-performance`             | گزارش‌های عملکرد runtime روزانه/درخواستی Kova با mock-provider، deep-profile، و laneهای live با GPT 5.5 | dispatch زمان‌بندی‌شده و دستی                       |

## ترتیب fail-fast

1. `runner-admission` فقط برای pushهای canonical `main` منتظر می‌ماند؛ push جدیدتر اجرا را پیش از ثبت Blacksmith لغو می‌کند.
2. `preflight` تصمیم می‌گیرد کدام laneها اصلا وجود داشته باشند. منطق `docs-scope` و `changed-scope` stepهایی داخل این job هستند، نه jobهای مستقل.
3. `security-fast`، `check-*`، `check-additional-*`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و platform matrix سریع fail می‌شوند.
4. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان پایین‌دستی به‌محض آماده‌شدن build مشترک شروع کنند.
5. laneهای سنگین‌تر platform و runtime پس از آن fan out می‌شوند: `checks-fast-core`، `checks-fast-contracts-plugins-*`، `checks-fast-contracts-channels-*`، `checks-node-core-*`، `checks-windows`، `macos-node`، `macos-swift`، `ios-build`، و `android`.

ممکن است GitHub وقتی push جدیدتری روی همان PR یا ref `main` وارد می‌شود jobهای جایگزین‌شده را با وضعیت `cancelled` علامت‌گذاری کند. مگر اینکه جدیدترین اجرا برای همان ref هم failing باشد، آن را noise مربوط به CI در نظر بگیرید. jobهای matrix از `fail-fast: false` استفاده می‌کنند، و `build-artifacts` به‌جای صف‌کردن jobهای verifier کوچک، failureهای embedded channel، core-support-boundary، و gateway-watch را مستقیم گزارش می‌کند. کلید concurrency خودکار CI versioned است (`CI-v7-*`) تا یک zombie سمت GitHub در queue group قدیمی نتواند اجراهای جدیدتر main را برای همیشه block کند. اجراهای دستی full-suite از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در حال انجام را لغو نمی‌کنند.

برای خلاصه‌کردن wall time، queue time، کندترین jobها، failureها، و مانع fanout مربوط به `pnpm-store-warmup` از GitHub Actions، از `pnpm ci:timings`، `pnpm ci:timings:recent`، یا `node scripts/ci-run-timings.mjs <run-id>` استفاده کنید. CI همان خلاصه اجرا را نیز به‌عنوان artifact با نام `ci-timings-summary` بارگذاری می‌کند. برای زمان‌بندی build، step `Build dist` در job `build-artifacts` را بررسی کنید: `pnpm build:ci-artifacts` مقدار `[build-all] phase timings:` را چاپ می‌کند و شامل `ui:build` است؛ این job همچنین artifact `startup-memory` را بارگذاری می‌کند.

برای اجراهای pull request، job پایانی timing-summary پیش از پاس‌دادن `GH_TOKEN` به `gh run view`، helper را از revision پایه trusted اجرا می‌کند. این کار query دارای token را بیرون از کد کنترل‌شده توسط branch نگه می‌دارد و همچنان اجرای CI فعلی pull request را خلاصه می‌کند.

## زمینه PR و شواهد

PRهای contributor خارجی یک gate مربوط به زمینه PR و شواهد را از
`.github/workflows/real-behavior-proof.yml` اجرا می‌کنند. این workflow commit پایه trusted را checkout می‌کند و فقط بدنه PR را ارزیابی می‌کند؛ کدی از branch contributor اجرا نمی‌کند.

این gate برای نویسندگان PR اعمال می‌شود که مالک، عضو،
collaborator، یا bot مخزن نیستند. وقتی بدنه PR شامل بخش‌های نوشته‌شده
`What Problem This Solves` و `Evidence` باشد، pass می‌شود. شواهد می‌تواند یک تست متمرکز،
نتیجه CI، screenshot، recording، خروجی terminal، مشاهده live،
log redacted، یا لینک artifact باشد. بدنه intent و اعتبارسنجی مفید را فراهم می‌کند؛
reviewerها کد، تست‌ها، و CI را برای ارزیابی correctness بررسی می‌کنند.

وقتی این check fail می‌شود، به‌جای push کردن commit کد دیگر، بدنه PR را به‌روزرسانی کنید.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با unit testهای `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. dispatch دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest مربوط به preflight طوری عمل کند که انگار هر بخش scoped تغییر کرده است.

- **ویرایش‌های workflow مربوط به CI** graph مربوط به Node CI را به‌همراه workflow linting اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native مربوط به Windows، iOS، Android، یا macOS را اجباری نمی‌کنند؛ آن laneهای platform همچنان به تغییرات source مربوط به platform محدود می‌مانند.
- **Workflow Sanity**، `actionlint`، `zizmor` را روی همه فایل‌های YAML مربوط به workflow، guard مربوط به composite-action interpolation، و guard مربوط به conflict-marker اجرا می‌کند. job `security-fast` محدود به PR نیز `zizmor` را روی فایل‌های workflow تغییرکرده اجرا می‌کند تا یافته‌های امنیتی workflow زودتر در graph اصلی CI fail شوند.
- **مستندات روی pushهای `main`** توسط workflow مستقل `Docs` با همان mirror مستندات ClawHub که CI استفاده می‌کند بررسی می‌شوند، بنابراین pushهای ترکیبی code+docs، shard مربوط به CI یعنی `check-docs` را هم صف نمی‌کنند. Pull requestها و CI دستی همچنان وقتی مستندات تغییر کرده‌اند `check-docs` را از CI اجرا می‌کنند.
- **TUI PTY** برای تغییرات TUI در shard Linux Node با نام `checks-node-core-runtime-tui-pty` اجرا می‌شود. این shard، `test/vitest/vitest.tui-pty.config.ts` را با `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` اجرا می‌کند، بنابراین هم lane fixture قطعی `TuiBackend` را پوشش می‌دهد و هم smoke کندتر `tui --local` را که فقط endpoint مدل خارجی را mock می‌کند.
- **ویرایش‌های فقط routing مربوط به CI، ویرایش‌های منتخب ارزان fixtureهای core-test، و ویرایش‌های محدود helper/test-routing مربوط به قرارداد plugin** از یک مسیر سریع manifest فقط-Node استفاده می‌کنند: `preflight`، security، و یک task واحد `checks-fast-core`. وقتی تغییر به سطح‌های routing یا helper محدود باشد که task سریع مستقیم تمرین می‌کند، آن مسیر build artifactها، سازگاری Node 22، قراردادهای channel، shardهای کامل core، shardهای bundled-plugin، و matrixهای guard اضافی را رد می‌کند.
- **بررسی‌های Windows Node** به wrapperهای process/path مخصوص Windows، helperهای runner مربوط به npm/pnpm/UI، config package manager، و سطح‌های workflow مربوط به CI که آن lane را اجرا می‌کنند محدود می‌شوند؛ تغییرات نامرتبط source، plugin، install-smoke، و فقط-تست روی laneهای Linux Node باقی می‌مانند.

کندترین خانواده‌های آزمون Node تقسیم یا متوازن شده‌اند تا هر کار، بدون رزرو بیش‌ازحد اجراکننده‌ها، کوچک بماند: قراردادهای Plugin و قراردادهای کانال هرکدام به‌صورت دو شارد وزن‌دارِ پشتیبانی‌شده با Blacksmith و با fallback استاندارد اجراکننده GitHub اجرا می‌شوند، مسیرهای سریع/پشتیبانی واحد core جداگانه اجرا می‌شوند، زیرساخت runtime هسته بین state، process/config، shared و سه شارد دامنه cron تقسیم شده است، auto-reply به‌صورت workerهای متوازن اجرا می‌شود (با زیردرخت reply که به شاردهای agent-runner، dispatch و commands/state-routing تقسیم شده است)، و پیکربندی‌های Gateway/server عامل‌محور به‌جای انتظار برای artifactهای ساخته‌شده، در مسیرهای chat/auth/model/http-plugin/runtime/startup تقسیم می‌شوند. سپس CI عادی فقط شاردهای الگوی include زیرساخت ایزوله را در بسته‌های قطعی با حداکثر ۶۴ فایل آزمون بسته‌بندی می‌کند و ماتریس Node را بدون ادغام مجموعه‌های غیرایزوله command/cron، agents-core دارای state، یا gateway/server کاهش می‌دهد؛ مجموعه‌های ثابت سنگین روی ۸ vCPU می‌مانند، در حالی که مسیرهای بسته‌بندی‌شده و کم‌وزن‌تر از ۴ vCPU استفاده می‌کنند. درخواست‌های pull روی مخزن canonical از یک برنامه پذیرش فشرده اضافی استفاده می‌کنند: همان گروه‌های per-config داخل برنامه فعلی ۳۴ کاری Linux Node در زیرفرایندهای ایزوله اجرا می‌شوند، بنابراین یک PR منفرد ماتریس کامل بیش از ۷۰ کاری Node را ثبت نمی‌کند. pushهای `main`، dispatchهای دستی و gateهای انتشار ماتریس کامل را حفظ می‌کنند. آزمون‌های گسترده مرورگر، QA، رسانه و Pluginهای متفرقه به‌جای catch-all مشترک Plugin از پیکربندی‌های اختصاصی Vitest خود استفاده می‌کنند. شاردهای الگوی include ورودی‌های زمان‌بندی را با نام شارد CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک پیکربندی کامل را از یک شارد فیلترشده تشخیص دهد. `check-additional-*` کارهای compile/canary مرز بسته را کنار هم نگه می‌دارد و معماری توپولوژی runtime را از پوشش watch مربوط به Gateway جدا می‌کند؛ فهرست guard مرزی به یک شارد سنگین از نظر prompt و یک شارد ترکیبی برای stripeهای باقی‌مانده guard تقسیم می‌شود، که هرکدام guardهای مستقل انتخاب‌شده را هم‌زمان اجرا می‌کنند و زمان‌بندی هر check را چاپ می‌کنند. check پرهزینه drift در snapshot prompt مسیر خوشایند Codex به‌عنوان کار additional مستقل خود فقط برای CI دستی و تغییرات اثرگذار بر prompt اجرا می‌شود، بنابراین تغییرات عادی و نامرتبط Node پشت تولید سرد snapshot prompt منتظر نمی‌مانند و شاردهای مرزی متوازن می‌مانند، در حالی که drift مربوط به prompt همچنان به همان PR که آن را ایجاد کرده سنجاق می‌شود؛ همان flag تولید snapshot prompt در Vitest را داخل شارد core support-boundary مبتنی بر artifact ساخته‌شده رد می‌کند. Gateway watch، آزمون‌های کانال، و شارد core support-boundary پس از اینکه `dist/` و `dist-runtime/` از قبل ساخته شدند، داخل `build-artifacts` به‌صورت هم‌زمان اجرا می‌شوند.

پس از پذیرش، CI canonical لینوکس تا ۲۴ کار آزمون Node هم‌زمان و
۱۲ کار برای مسیرهای کوچک‌تر fast/check مجاز می‌کند؛ Windows و Android روی دو می‌مانند چون
استخرهای آن اجراکننده‌ها محدودتر هستند.

برنامه فشرده PR برای مجموعه فعلی ۱۸ کار Node منتشر می‌کند: گروه‌های
whole-config در زیرفرایندهای ایزوله با timeout دسته‌ای ۱۲۰ دقیقه‌ای batch می‌شوند،
در حالی که گروه‌های الگوی include همان بودجه کاری محدود را به اشتراک می‌گذارند.

CI اندروید هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK debug مربوط به Play را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه ندارد؛ مسیر unit-test آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log کامپایل می‌کند، در حالی که از یک کار بسته‌بندی debug APK تکراری در هر push مرتبط با Android جلوگیری می‌کند.

شارد `check-dependencies`، `pnpm deadcode:dependencies` (یک گذر production فقط برای وابستگی Knip که به آخرین نسخه Knip سنجاق شده و حداقل سن انتشار pnpm برای نصب `dlx` غیرفعال شده است) و `pnpm deadcode:unused-files` را اجرا می‌کند، که یافته‌های فایل استفاده‌نشده production در Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard فایل استفاده‌نشده زمانی شکست می‌خورد که یک PR فایل استفاده‌نشده جدید و بازبینی‌نشده‌ای اضافه کند یا یک ورودی allowlist کهنه باقی بگذارد، در حالی که سطح‌های Plugin پویا، generated، build، live-test و package bridge عمدی را که Knip نمی‌تواند به‌صورت ایستا resolve کند حفظ می‌کند.

## ارسال فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت مقصد از فعالیت مخزن OpenClaw به ClawSweeper است. این workflow کد pull request نامطمئن را checkout یا اجرا نمی‌کند. workflow از `CLAWSWEEPER_APP_PRIVATE_KEY` یک token مربوط به GitHub App می‌سازد، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار مسیر دارد:

- `clawsweeper_item` برای درخواست‌های دقیق بازبینی issue و pull request؛
- `clawsweeper_comment` برای دستورهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های بازبینی در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است بررسی کند.

مسیر `github_activity` فقط metadata نرمال‌شده را ارسال می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state، و excerptهای کوتاه برای commentها یا reviewها هنگام وجود. این مسیر عمدا از ارسال بدنه کامل webhook پرهیز می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper`، `.github/workflows/github-activity.yml` است، که event نرمال‌شده را برای hook مربوط به OpenClaw Gateway برای agent مربوط به ClawSweeper ارسال می‌کند.

فعالیت عمومی مشاهده است، نه ارسال به‌صورت پیش‌فرض. agent مربوط به ClawSweeper هدف Discord را در prompt خود دریافت می‌کند و فقط زمانی باید در `#clawsweeper` پست کند که event غافلگیرکننده، قابل اقدام، پرریسک، یا از نظر عملیاتی مفید باشد. باز کردن‌ها، ویرایش‌ها، churn ربات، نویز webhook تکراری، و ترافیک عادی review باید به `NO_REPLY` منتهی شوند.

در سراسر این مسیر، titleها، commentها، bodyها، متن review، نام branchها، و پیام‌های commit در GitHub را داده نامطمئن در نظر بگیرید. آن‌ها ورودی برای خلاصه‌سازی و triage هستند، نه دستورالعمل برای workflow یا runtime عامل.

## dispatchهای دستی

dispatchهای دستی CI همان گراف کاری CI عادی را اجرا می‌کنند اما همه مسیرهای scoped غیر Android را روشن می‌کنند: شاردهای Linux Node، شاردهای bundled-plugin، شاردهای قرارداد Plugin و کانال، سازگاری Node 22، `check-*`، `check-additional-*`، smoke checkهای artifact ساخته‌شده، checkهای docs، Skills پایتون، Windows، macOS، build مربوط به iOS، و i18n مربوط به Control UI. dispatchهای دستی مستقل CI فقط با `include_android=true` اندروید را اجرا می‌کنند؛ چتر کامل release با پاس دادن `include_android=true` اندروید را فعال می‌کند. checkهای ایستای prerelease مربوط به Plugin، شارد فقط release با نام `agentic-plugins`، sweep کامل batch extension، و مسیرهای Docker prerelease مربوط به Plugin از CI حذف شده‌اند. مجموعه Docker prerelease فقط زمانی اجرا می‌شود که `Full Release Validation`، workflow جداگانه `Plugin Prerelease` را با gate release-validation فعال dispatch کند.

اجراهای دستی از یک گروه concurrency یکتا استفاده می‌کنند تا یک مجموعه کامل release-candidate توسط push یا اجرای PR دیگر روی همان ref لغو نشود. ورودی اختیاری `target_ref` به یک caller معتمد اجازه می‌دهد آن گراف را روی یک branch، tag، یا SHA کامل commit اجرا کند، در حالی که از فایل workflow از ref انتخاب‌شده برای dispatch استفاده می‌شود.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## اجراکننده‌ها

| اجراکننده                          | کارها                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | dispatch دستی CI و fallbackهای مخزن غیر canonical، اسکن‌های کیفیت CodeQL JavaScript/actions، workflow-sanity، labeler، auto-response، workflowهای docs خارج از CI، و پیش‌پرواز install-smoke تا ماتریس Blacksmith بتواند زودتر در صف قرار بگیرد                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`، `security-fast`، شاردهای extension کم‌وزن‌تر، `checks-fast-core`، شاردهای قرارداد Plugin/کانال، بیشتر شاردهای bundled/کم‌وزن‌تر Linux Node، `check-guards`، `check-prod-types`، `check-test-types`، شاردهای منتخب `check-additional-*`، و `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | مجموعه‌های سنگین Linux Node که حفظ شده‌اند، شاردهای `check-additional-*` سنگین از نظر boundary/extension، و `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`، `check-lint` (به‌اندازه‌ای حساس به CPU که ۸ vCPU بیش از صرفه‌جویی، هزینه ایجاد می‌کرد)؛ buildهای Docker مربوط به install-smoke (زمان صف ۳۲ vCPU بیش از صرفه‌جویی، هزینه ایجاد می‌کرد)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-15` fallback می‌کنند                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` و `ios-build` روی `openclaw/openclaw`؛ forkها به `macos-26` fallback می‌کنند                                                                                                                                                                                                  |

## بودجه ثبت‌نام اجراکننده

bucket فعلی ثبت‌نام اجراکننده GitHub در OpenClaw در `ghx api rate_limit` مقدار ۱۰٬۰۰۰ ثبت‌نام اجراکننده self-hosted
در هر ۵ دقیقه را گزارش می‌کند. پیش از هر گذر tuning، دوباره
`actions_runner_registration` را بررسی کنید، چون GitHub می‌تواند
این bucket را تغییر دهد. این limit میان همه ثبت‌نام‌های اجراکننده Blacksmith در سازمان
`openclaw` مشترک است، بنابراین افزودن نصب Blacksmith دیگر bucket
جدیدی اضافه نمی‌کند.

labelهای Blacksmith را منبع کمیاب برای کنترل burst در نظر بگیرید. کارهایی که
فقط route، notify، summarize، انتخاب شارد، یا اسکن‌های کوتاه CodeQL را اجرا می‌کنند باید
روی اجراکننده‌های GitHub-hosted بمانند، مگر اینکه نیازهای اندازه‌گیری‌شده خاص Blacksmith داشته باشند. هر ماتریس جدید Blacksmith، `max-parallel` بزرگ‌تر، یا
workflow پرتکرار باید بدترین count ثبت‌نام خود را نشان دهد و هدف سطح سازمان را
زیر حدود ۶۰٪ bucket زنده نگه دارد. با bucket فعلی ۱۰٬۰۰۰ ثبت‌نام،
این یعنی هدف عملیاتی ۶٬۰۰۰ ثبت‌نام، با فضای اضافه برای
مخازن هم‌زمان، retryها، و هم‌پوشانی burst.

CI مخزن canonical، Blacksmith را به‌عنوان مسیر پیش‌فرض اجراکننده برای اجراهای عادی push و pull-request نگه می‌دارد. `workflow_dispatch` و اجراهای مخزن غیر canonical از اجراکننده‌های GitHub-hosted استفاده می‌کنند، اما اجراهای عادی canonical در حال حاضر سلامت صف Blacksmith را probe نمی‌کنند یا وقتی Blacksmith در دسترس نیست به‌صورت خودکار به labelهای GitHub-hosted fallback نمی‌کنند.

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

اجرای دستی معمولاً همان ref گردش‌کار را بنچمارک می‌کند. برای بنچمارک کردن یک برچسب انتشار یا شاخه‌ای دیگر با پیاده‌سازی فعلی گردش‌کار، `target_ref` را تنظیم کنید. مسیرهای گزارش منتشرشده و اشاره‌گرهای latest بر اساس ref آزموده‌شده کلیدگذاری می‌شوند، و هر `index.md` ref/SHA آزموده‌شده، ref/SHA گردش‌کار، ref مربوط به Kova، پروفایل، حالت احراز هویت lane، مدل، تعداد تکرار و فیلترهای سناریو را ثبت می‌کند.

این گردش‌کار OCM را از یک انتشار پین‌شده و Kova را از `openclaw/Kova` در ورودی پین‌شده `kova_ref` نصب می‌کند، سپس سه lane را اجرا می‌کند:

- `mock-provider`: سناریوهای تشخیصی Kova در برابر زمان اجرای ساخته‌شده محلی با احراز هویت ساختگی و قطعی سازگار با OpenAI.
- `mock-deep-profile`: پروفایل‌گیری CPU/heap/trace برای نقاط داغ راه‌اندازی، Gateway و نوبت عامل.
- `live-openai-candidate`: یک نوبت عامل واقعی OpenAI `openai/gpt-5.5`، که وقتی `OPENAI_API_KEY` در دسترس نباشد رد می‌شود.

lane مربوط به mock-provider پس از گذر Kova، probeهای منبع بومی OpenClaw را نیز اجرا می‌کند: زمان‌بندی بوت و حافظه Gateway در حالت‌های راه‌اندازی پیش‌فرض، hook و ۵۰-Plugin؛ RSS وارد کردن Pluginهای همراه، حلقه‌های hello تکراری mock-OpenAI `channel-chat-baseline`، فرمان‌های راه‌اندازی CLI در برابر Gateway بوت‌شده، و probe عملکرد smoke وضعیت SQLite. وقتی گزارش منبع mock-provider منتشرشده قبلی برای ref آزموده‌شده در دسترس باشد، خلاصه منبع مقدارهای فعلی RSS و heap را با آن baseline مقایسه می‌کند و افزایش‌های بزرگ RSS را به‌صورت `watch` علامت‌گذاری می‌کند. خلاصه Markdown مربوط به probe منبع در بسته گزارش، در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر lane artifactهای GitHub را بارگذاری می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، این گردش‌کار همچنین `report.json`، `report.md`، بسته‌ها، `index.md` و artifactهای source-probe را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` commit می‌کند. اشاره‌گر فعلی tested-ref به‌صورت `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` گردش‌کار چتری دستی برای «اجرای همه چیز قبل از انتشار» است. این گردش‌کار یک شاخه، برچسب یا SHA کامل commit را می‌پذیرد، گردش‌کار دستی `CI` را با آن هدف اجرا می‌کند، `Plugin Prerelease` را برای اثبات مخصوص انتشار مربوط به Plugin/بسته/static/Docker اجرا می‌کند، و `OpenClaw Release Checks` را برای install smoke، پذیرش بسته، بررسی بسته روی چند سیستم‌عامل، رندر کارت امتیاز بلوغ از شواهد پروفایل QA، برابری QA Lab، Matrix و laneهای Telegram اجرا می‌کند. پروفایل‌های پایدار و کامل همیشه پوشش کامل live/E2E و soak مسیر انتشار Docker را شامل می‌شوند؛ پروفایل بتا می‌تواند با `run_release_soak=true` آن را فعال کند. E2E مرجع Telegram برای بسته داخل Package Acceptance اجرا می‌شود، بنابراین یک نامزد کامل poller زنده تکراری راه‌اندازی نمی‌کند. پس از انتشار، `release_package_spec` را پاس بدهید تا از بسته npm منتشرشده در release checks، Package Acceptance، Docker، cross-OS و Telegram بدون بازسازی دوباره استفاده شود. `npm_telegram_package_spec` را فقط برای اجرای دوباره متمرکز Telegram با بسته منتشرشده استفاده کنید. lane بسته live مربوط به Plugin Codex به‌طور پیش‌فرض از همان حالت انتخاب‌شده استفاده می‌کند: `release_package_spec=openclaw@<tag>` منتشرشده، `codex_plugin_spec=npm:@openclaw/codex@<tag>` را استخراج می‌کند، در حالی که اجراهای SHA/artifact، `extensions/codex` را از ref انتخاب‌شده بسته‌بندی می‌کنند. برای منابع Plugin سفارشی مانند specهای `npm:`، `npm-pack:` یا `git:`، `codex_plugin_spec` را صراحتاً تنظیم کنید.

برای ماتریس مرحله‌ها، نام دقیق jobهای گردش‌کار، تفاوت پروفایل‌ها، artifactها و دسته‌های اجرای دوباره متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` گردش‌کار انتشار دستی و تغییردهنده است. پس از وجود برچسب انتشار و موفقیت preflight مربوط به npm OpenClaw، آن را از `release/YYYY.M.PATCH` یا `main` اجرا کنید. این گردش‌کار `pnpm plugins:sync:check` را بررسی می‌کند، `Plugin NPM Release` را برای همه بسته‌های Plugin قابل انتشار اجرا می‌کند، `Plugin ClawHub Release` را برای همان SHA انتشار اجرا می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده اجرا می‌کند. انتشار پایدار همچنین به یک `windows_node_tag` دقیق نیاز دارد؛ گردش‌کار انتشار منبع Windows را بررسی می‌کند و نصب‌کننده‌های x64/ARM64 آن را پیش از هر child انتشار، با ورودی تأییدشده نامزد `windows_node_installer_digests` مقایسه می‌کند، سپس همان digestهای نصب‌کننده پین‌شده به‌همراه asset همراه دقیق و قرارداد checksum را پیش از انتشار draft انتشار GitHub ترویج و بررسی می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات commit پین‌شده روی شاخه‌ای که سریع تغییر می‌کند، به‌جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

refهای dispatch گردش‌کار GitHub باید شاخه یا برچسب باشند، نه SHA خام commit. این helper یک شاخه موقت `release-ci/<sha>-...` را در SHA هدف push می‌کند، `Full Release Validation` را از آن ref پین‌شده اجرا می‌کند، بررسی می‌کند که `headSha` هر گردش‌کار child با هدف مطابقت دارد، و پس از کامل شدن اجرا شاخه موقت را حذف می‌کند. verifier چتری همچنین اگر هر گردش‌کار child در SHA متفاوتی اجرا شده باشد fail می‌شود.

`release_profile` گستره live/provider پاس‌داده‌شده به release checks را کنترل می‌کند. گردش‌کارهای انتشار دستی به‌طور پیش‌فرض `stable` هستند؛ فقط وقتی عمداً ماتریس گسترده advisory مربوط به provider/media را می‌خواهید از `full` استفاده کنید. بررسی‌های انتشار stable و full همیشه soak کامل live/E2E و مسیر انتشار Docker را اجرا می‌کنند؛ پروفایل بتا می‌تواند با `run_release_soak=true` آن را فعال کند.

- `minimum` سریع‌ترین laneهای حیاتی انتشار مربوط به OpenAI/core را نگه می‌دارد.
- `stable` مجموعه پایدار provider/backend را اضافه می‌کند.
- `full` ماتریس گسترده advisory مربوط به provider/media را اجرا می‌کند.

چتر، شناسه‌های اجرای child اجراشده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی اجرای childها را دوباره بررسی می‌کند و جدول‌های کندترین jobها را برای هر اجرای child اضافه می‌کند. اگر یک گردش‌کار child دوباره اجرا شود و سبز شود، فقط job verifier والد را دوباره اجرا کنید تا نتیجه چتری و خلاصه زمان‌بندی به‌روز شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای نامزد انتشار از `all`، فقط برای child کامل CI معمولی از `ci`، فقط برای child prerelease Plugin از `plugin-prerelease`، برای همه childهای انتشار از `release-checks`، یا از یک گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live` یا `npm-telegram` روی چتر. این کار پس از یک اصلاح متمرکز، اجرای دوباره یک جعبه انتشار failشده را محدود نگه می‌دارد. برای یک lane cross-OS failشده، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ فرمان‌های طولانی cross-OS خط‌های Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade زمان‌بندی هر فاز را شامل می‌شوند. laneهای QA release-check به‌جز gate استاندارد پوشش ابزار زمان اجرا advisory هستند؛ آن gate وقتی ابزارهای پویا و ضروری OpenClaw از خلاصه سطح استاندارد منحرف شوند یا ناپدید شوند، مسدود می‌کند.

`OpenClaw Release Checks` از ref گردش‌کار مورد اعتماد استفاده می‌کند تا ref انتخاب‌شده را یک‌بار به tarball با نام `release-package-under-test` resolve کند، سپس آن artifact را به بررسی‌های cross-OS و Package Acceptance، به‌همراه گردش‌کار Docker مسیر انتشار live/E2E در صورت اجرای پوشش soak، پاس می‌دهد. این کار byteهای بسته را در جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوباره همان نامزد در چند job child جلوگیری می‌کند. برای lane live مربوط به npm-plugin Codex، release checks یا یک spec Plugin منتشرشده مطابق را که از `release_package_spec` استخراج شده پاس می‌دهد، یا `codex_plugin_spec` ارائه‌شده توسط اپراتور را پاس می‌دهد، یا ورودی را خالی می‌گذارد تا اسکریپت Docker، Plugin Codex مربوط به checkout انتخاب‌شده را بسته‌بندی کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all` چتر قدیمی‌تر را supersede می‌کنند. monitor والد هر گردش‌کار child را که پیش‌تر dispatch کرده است هنگام لغو والد cancel می‌کند، بنابراین اعتبارسنجی جدیدتر main پشت یک اجرای release-check قدیمی دو ساعته نمی‌نشیند. اعتبارسنجی شاخه/برچسب انتشار و گروه‌های اجرای دوباره متمرکز، `cancel-in-progress: false` را حفظ می‌کنند.

## شاردهای live و E2E

child مربوط به live/E2E انتشار پوشش گسترده بومی `pnpm test:live` را حفظ می‌کند، اما آن را به‌جای یک job ترتیبی، به‌صورت شاردهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

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
- شاردهای جداشده صوت/ویدئوی media و شاردهای music فیلترشده بر اساس provider

این کار همان پوشش فایل را حفظ می‌کند، در حالی که اجرای دوباره و تشخیص failهای کند providerهای live را آسان‌تر می‌کند. نام شاردهای تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media` و `native-live-extensions-media-music` همچنان برای اجرای دوباره دستی یک‌مرحله‌ای معتبر می‌مانند.

شاردهای native live media در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند، که با گردش‌کار `Live Media Runner Image` ساخته شده است. آن image از قبل `ffmpeg` و `ffprobe` را نصب می‌کند؛ jobهای media فقط پیش از setup باینری‌ها را بررسی می‌کنند. suiteهای live مبتنی بر Docker را روی runnerهای معمولی Blacksmith نگه دارید؛ jobهای container جای نامناسبی برای راه‌اندازی آزمون‌های Docker تو در تو هستند.

مدل زنده و شاردهای بک‌اندِ پشتیبانی‌شده با Docker برای هر کامیت انتخاب‌شده از یک ایمیج مشترک جداگانه‌ی `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. گردش‌کار انتشار زنده آن ایمیج را یک‌بار می‌سازد و پوش می‌کند، سپس مدل زنده‌ی Docker، Gateway شاردشده بر پایه‌ی ارائه‌دهنده، بک‌اند CLI، اتصال ACP، و شاردهای هارنس Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. شاردهای Docker مربوط به Gateway سقف‌های صریح `timeout` در سطح اسکریپت دارند که کمتر از timeout کار گردش‌کار است تا کانتینر گیرکرده یا مسیر پاک‌سازی، به‌جای مصرف کل بودجه‌ی بررسی انتشار، سریع شکست بخورد. اگر آن شاردها هدف Docker کاملِ منبع را مستقل بازسازی کنند، اجرای انتشار بدپیکربندی شده و زمان دیواری را صرف ساخت‌های تکراری ایمیج خواهد کرد.

## پذیرش بسته

وقتی پرسش این است که «آیا این بسته‌ی قابل‌نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI معمولی فرق دارد: CI معمولی درخت منبع را اعتبارسنجی می‌کند، درحالی‌که پذیرش بسته یک tarball واحد را از همان هارنس E2E مبتنی بر Docker که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند، اعتبارسنجی می‌کند.

### کارها

1. `resolve_package`، `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان آرتیفکت `package-under-test` بارگذاری می‌کند، و منبع، ref گردش‌کار، ref بسته، نسخه، SHA-256، و پروفایل را در خلاصه‌ی مرحله‌ی GitHub چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار قابل‌استفاده‌مجدد آن آرتیفکت را دانلود می‌کند، موجودی tarball را اعتبارسنجی می‌کند، در صورت نیاز ایمیج‌های Docker با digest بسته را آماده می‌کند، و laneهای Docker انتخاب‌شده را به‌جای pack کردن checkout گردش‌کار، روی همان بسته اجرا می‌کند. وقتی یک پروفایل چند `docker_lanes` هدفمند را انتخاب می‌کند، گردش‌کار قابل‌استفاده‌مجدد بسته و ایمیج‌های مشترک را یک‌بار آماده می‌کند، سپس آن laneها را به‌صورت کارهای Docker هدفمند موازی با آرتیفکت‌های یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و اگر پذیرش بسته یک مورد را resolve کرده باشد، همان آرتیفکت `package-under-test` را نصب می‌کند؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده‌ی npm را نصب کند.
4. اگر resolve بسته، پذیرش Docker، یا lane اختیاری Telegram شکست خورده باشد، `summary` گردش‌کار را شکست می‌دهد.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه‌ی دقیق انتشار OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش پیش‌انتشار/پایدار منتشرشده استفاده کنید.
- `source=ref` یک شاخه، تگ، یا SHA کامل کامیتِ مورداعتماد در `package_ref` را pack می‌کند. resolver شاخه‌ها/تگ‌های OpenClaw را fetch می‌کند، بررسی می‌کند که کامیت انتخاب‌شده از تاریخچه‌ی شاخه‌ی مخزن یا یک تگ انتشار قابل‌دسترسی باشد، وابستگی‌ها را در یک worktree جداشده نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` pack می‌کند.
- `source=url` یک `.tgz` عمومی HTTPS را دانلود می‌کند؛ `package_sha256` الزامی است. این مسیر credentialهای URL، پورت‌های HTTPS غیردیفالت، hostnameها یا IPهای resolveشده‌ی خصوصی/داخلی/کاربردویژه، و redirectهای خارج از همان سیاست ایمنی عمومی را رد می‌کند.
- `source=trusted-url` یک `.tgz` HTTPS را از یک سیاست trusted-source نام‌گذاری‌شده در `.github/package-trusted-sources.json` دانلود می‌کند؛ `package_sha256` و `trusted_source_id` الزامی هستند. این را فقط برای mirrorهای سازمانی تحت مالکیت نگه‌دارنده یا مخزن‌های خصوصی بسته که به hostها، پورت‌ها، پیشوندهای مسیر، hostهای redirect، یا resolve شبکه‌ی خصوصی پیکربندی‌شده نیاز دارند استفاده کنید. اگر سیاست bearer auth اعلام کند، گردش‌کار از secret ثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN` استفاده می‌کند؛ credentialهای جاسازی‌شده در URL همچنان رد می‌شوند.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای آرتیفکت‌هایی که بیرونی به اشتراک گذاشته می‌شوند باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد مورداعتماد گردش‌کار/هارنس است که تست را اجرا می‌کند. `package_ref` کامیت منبعی است که وقتی `source=ref` باشد pack می‌شود. این اجازه می‌دهد هارنس تست فعلی کامیت‌های منبع قدیمی‌تر اما مورداعتماد را بدون اجرای منطق گردش‌کار قدیمی اعتبارسنجی کند.

### پروفایل‌های مجموعه

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` به‌علاوه‌ی `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — قطعه‌های کامل مسیر انتشار Docker همراه با OpenWebUI
- `custom` — `docker_lanes` دقیق؛ وقتی `suite_profile=custom` باشد الزامی است

پروفایل `package` از پوشش Plugin آفلاین استفاده می‌کند تا اعتبارسنجی بسته‌ی منتشرشده به دسترس‌بودن زنده‌ی ClawHub وابسته نباشد. lane اختیاری Telegram از آرتیفکت `package-under-test` در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، درحالی‌که مسیر spec منتشرشده‌ی npm برای dispatchهای مستقل حفظ می‌شود.

برای سیاست اختصاصی تست به‌روزرسانی و Plugin، شامل فرمان‌های محلی،
laneهای Docker، ورودی‌های پذیرش بسته، پیش‌فرض‌های انتشار، و تریاژ شکست،
[تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار، پذیرش بسته را با `source=artifact`، آرتیفکت بسته‌ی انتشارِ آماده‌شده، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار مهاجرت بسته، به‌روزرسانی، نصب Skills زنده‌ی ClawHub، پاک‌سازی وابستگی stale Plugin، تعمیر نصب Plugin پیکربندی‌شده، Plugin آفلاین، به‌روزرسانی Plugin، و اثبات Telegram را روی همان tarball بسته‌ی resolveشده نگه می‌دارد. پس از انتشار یک beta، `release_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید تا همان ماتریس روی بسته‌ی npm ارسال‌شده بدون بازسازی اجرا شود؛ `package_acceptance_package_spec` را فقط وقتی تنظیم کنید که پذیرش بسته به بسته‌ای متفاوت از بقیه‌ی اعتبارسنجی انتشار نیاز دارد. بررسی‌های انتشار میان‌سیستم‌عاملی همچنان onboarding، installer، و رفتار platform-specific را پوشش می‌دهند؛ اعتبارسنجی محصولِ بسته/به‌روزرسانی باید با پذیرش بسته شروع شود. lane Docker به‌نام `published-upgrade-survivor` در مسیر مسدودکننده‌ی انتشار، در هر اجرا یک baseline بسته‌ی منتشرشده را اعتبارسنجی می‌کند. در پذیرش بسته، tarball resolveشده‌ی `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline` baseline منتشرشده‌ی fallback را انتخاب می‌کند که پیش‌فرض آن `openclaw@latest` است؛ فرمان‌های اجرای دوباره‌ی lane شکست‌خورده آن baseline را حفظ می‌کنند. Full Release Validation با `run_release_soak=true` یا `release_profile=full`، `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا در چهار انتشار پایدار آخر npm به‌علاوه‌ی انتشارهای مرزی سنجاق‌شده برای سازگاری Plugin و fixtureهای شکل‌گرفته از issue برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده‌ی OpenClaw، مسیرهای لاگ tilde، و ریشه‌های وابستگی Plugin قدیمی stale گسترش یابد. انتخاب‌های چند-baseline برای published-upgrade survivor بر اساس baseline به کارهای جداگانه‌ی runner هدفمند Docker شارد می‌شوند. گردش‌کار جداگانه‌ی `Update Migration` از lane Docker به‌نام `update-migration` با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند، وقتی پرسش پاک‌سازی جامع به‌روزرسانی منتشرشده است، نه گستره‌ی عادی Full Release CI. اجراهای تجمعی محلی می‌توانند specهای دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` پاس بدهند، یک lane واحد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مانند `openclaw@2026.4.15` نگه دارند، یا برای ماتریس سناریو `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را تنظیم کنند. lane منتشرشده baseline را با دستورالعمل فرمان `openclaw config set` از پیش پخته‌شده پیکربندی می‌کند، گام‌های دستورالعمل را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz`، به‌علاوه‌ی وضعیت RPC را probe می‌کند. laneهای تازه‌ی بسته‌بندی‌شده و installer در Windows نیز بررسی می‌کنند که یک بسته‌ی نصب‌شده بتواند override کنترل مرورگر را از یک مسیر خام و مطلق Windows import کند. smoke مربوط به agent-turn میان‌سیستم‌عاملی OpenAI به‌صورت پیش‌فرض از `OPENCLAW_CROSS_OS_OPENAI_MODEL` هنگام تنظیم‌بودن استفاده می‌کند، وگرنه از `openai/gpt-5.5`، تا اثبات نصب و Gateway روی یک مدل تست GPT-5 بماند و درعین‌حال از پیش‌فرض‌های GPT-4.x دوری کند.

### پنجره‌های سازگاری legacy

پذیرش بسته برای بسته‌هایی که پیش‌تر منتشر شده‌اند، پنجره‌های محدود سازگاری legacy دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- entryهای QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- وقتی بسته آن flag را expose نکند، `doctor-switch` ممکن است زیرمورد persistence مربوط به `gateway install --wrapper` را رد کند؛
- `update-channel-switch` ممکن است `patchedDependencies` مربوط به pnpm را که در fixture جعلی git مشتق‌شده از tarball وجود ندارند prune کند و ممکن است نبود `update.channel` persistشده را log کند؛
- smokeهای Plugin ممکن است مکان‌های legacy رکورد نصب را بخوانند یا نبود persistence رکورد نصب marketplace را بپذیرند؛
- `plugin-update` ممکن است migration متادیتای config را مجاز بداند، درحالی‌که همچنان الزام می‌کند رکورد نصب و رفتار بدون نصب دوباره بدون تغییر بمانند.

بسته‌ی منتشرشده‌ی `2026.4.26` نیز ممکن است برای فایل‌های stamp متادیتای build محلی که پیش‌تر ارسال شده بودند هشدار بدهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا skip، شکست می‌خورند.

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

هنگام اشکال‌زدایی یک اجرای ناموفق پذیرش بسته، از خلاصه‌ی `resolve_package` شروع کنید تا منبع بسته، نسخه، و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و آرتیفکت‌های Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، لاگ‌های lane، زمان‌بندی‌های فاز، و فرمان‌های اجرای دوباره. اجرای دوباره‌ی پروفایل بسته‌ی شکست‌خورده یا laneهای دقیق Docker را به اجرای دوباره‌ی اعتبارسنجی کامل انتشار ترجیح دهید.

## smoke نصب

گردش‌کار جداگانه‌ی `Install Smoke` همان اسکریپت scope را از طریق کار `preflight` خودش دوباره استفاده می‌کند. این گردش‌کار پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای درخواست‌های کششی اجرا می‌شود که سطوح Docker/package، تغییرات package/manifest مربوط به Pluginهای bundled، یا سطوح core plugin/channel/gateway/Plugin SDK را لمس می‌کنند که jobهای Docker smoke آن‌ها را تمرین می‌دهند. تغییرات فقط‌منبع در Pluginهای bundled، ویرایش‌های فقط‌تست، و ویرایش‌های فقط‌مستندات Docker worker رزرو نمی‌کنند. مسیر سریع تصویر root Dockerfile را یک‌بار می‌سازد، CLI را بررسی می‌کند، smoke مربوط به agents delete shared-workspace CLI را اجرا می‌کند، e2e مربوط به container gateway-network را اجرا می‌کند، یک bundled extension build arg را تأیید می‌کند، و پروفایل bounded bundled-plugin Docker را زیر timeout تجمیعی ۲۴۰ ثانیه‌ای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** پوشش نصب QR package و installer Docker/update را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، workflow-call release checkها، و درخواست‌های کششی‌ای نگه می‌دارد که واقعاً سطوح installer/package/Docker را لمس می‌کنند. در حالت کامل، install-smoke یک تصویر GHCR root Dockerfile smoke با target-SHA را آماده یا بازاستفاده می‌کند، سپس QR package install، smokeهای root Dockerfile/gateway، smokeهای installer/update، و Docker E2E سریع bundled-plugin را به‌صورت jobهای جداگانه اجرا می‌کند تا کار installer پشت smokeهای تصویر root منتظر نماند.

pushهای `main` (از جمله merge commitها) مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق changed-scope روی یک push پوشش کامل را درخواست کند، workflow همان Docker smoke سریع را نگه می‌دارد و install smoke کامل را به اعتبارسنجی شبانه یا release واگذار می‌کند.

smoke کند Bun global install image-provider جداگانه با `run_bun_global_install_smoke` gate می‌شود. این smoke در برنامه شبانه و از workflow مربوط به release checkها اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما درخواست‌های کششی و pushهای `main` این کار را نمی‌کنند. CI عادی PR همچنان lane سریع regression مربوط به Bun launcher را برای تغییرات مرتبط با Node اجرا می‌کند. تست‌های QR و installer Docker، Dockerfileهای install-focused خودشان را حفظ می‌کنند.

## Docker E2E محلی

`pnpm test:docker:all` یک تصویر live-test مشترک را از قبل می‌سازد، OpenClaw را یک‌بار به‌صورت npm tarball بسته‌بندی می‌کند، و دو تصویر مشترک `scripts/e2e/Dockerfile` می‌سازد:

- یک runner خام Node/Git برای laneهای installer/update/plugin-dependency؛
- یک تصویر functional که همان tarball را برای laneهای عملکرد عادی در `/app` نصب می‌کند.

تعریف laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler تصویر هر lane را با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### قابل‌تنظیم‌ها

| متغیر                                | پیش‌فرض | هدف                                                                                         |
| ------------------------------------ | ------- | ------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`    | 10      | تعداد slotهای main-pool برای laneهای عادی.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`     | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`      | 5       | سقف laneهای نصب npm هم‌زمان.                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`  | 7       | سقف laneهای multi-service هم‌زمان.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع laneها برای پرهیز از توفان create در Docker daemon؛ برای بدون فاصله‌گذاری `0` تنظیم کنید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000 | timeout پشتیبان برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail منتخب سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`        | unset   | `1` plan مربوط به scheduler را بدون اجرای laneها چاپ می‌کند.                               |
| `OPENCLAW_DOCKER_ALL_LANES`          | unset   | فهرست دقیق laneها با جداسازی کاما؛ cleanup smoke را رد می‌کند تا agentها بتوانند یک lane ناموفق را بازتولید کنند. |

laneای که از سقف مؤثرش سنگین‌تر است همچنان می‌تواند از یک pool خالی شروع شود، سپس تا وقتی capacity را آزاد کند تنها اجرا می‌شود. aggregate محلی Docker را preflight می‌کند، containerهای قدیمی OpenClaw E2E را حذف می‌کند، وضعیت active-lane را منتشر می‌کند، زمان‌بندی laneها را برای ترتیب‌دهی longest-first پایدار می‌کند، و به‌صورت پیش‌فرض پس از نخستین failure زمان‌بندی laneهای pooled جدید را متوقف می‌کند.

### workflow بازاستفاده‌پذیر live/E2E

workflow بازاستفاده‌پذیر live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد کدام package، نوع تصویر، تصویر live، lane، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و summaryهای GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا artifact مربوط به package اجرای فعلی را دانلود می‌کند، یا artifact مربوط به package را از `package_artifact_run_id` دانلود می‌کند؛ موجودی tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای package-installed نیاز دارد، تصاویر bare/functional GHCR Docker E2E با tag مبتنی بر digest package را از طریق cache لایه Docker متعلق به Blacksmith می‌سازد و push می‌کند؛ و به‌جای build دوباره، inputهای `docker_e2e_bare_image`/`docker_e2e_functional_image` ارائه‌شده یا تصاویر موجود مبتنی بر package-digest را بازاستفاده می‌کند. pullهای تصویر Docker با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش retry می‌شوند تا stream گیرکرده registry/cache سریع retry شود، نه اینکه بیشتر critical path مربوط به CI را مصرف کند.

### chunkهای مسیر release

پوشش Release Docker jobهای chunked کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع تصویری را pull کند که لازم دارد و چند lane را از طریق همان scheduler وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunkهای فعلی Release Docker عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `package-update-openai` شامل lane مربوط به live Codex plugin package است که candidate OpenClaw package را نصب می‌کند، Codex plugin را از `codex_plugin_spec` یا یک tarball هم‌ارجاع با تأیید صریح نصب Codex CLI نصب می‌کند، preflight مربوط به Codex CLI را اجرا می‌کند، سپس چند turn مربوط به OpenClaw agent در همان session را روی OpenAI اجرا می‌کند. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای aggregate مربوط به plugin/runtime هستند. alias مربوط به lane `install-e2e` همچنان alias aggregate rerun دستی برای هر دو lane نصب‌کننده provider است.

OpenWebUI وقتی پوشش کامل release-path آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و chunk مستقل `openwebui` را فقط برای dispatchهای مخصوص OpenWebUI نگه می‌دارد. laneهای به‌روزرسانی bundled-channel برای failureهای گذرای شبکه npm یک‌بار retry می‌کنند.

هر chunk، `.artifacts/docker-tests/` را همراه با logهای lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی phaseها، JSON مربوط به scheduler plan، جدول‌های slow-lane، و فرمان‌های rerun برای هر lane upload می‌کند. input مربوط به `docker_lanes` در workflow، laneهای منتخب را روی تصاویر آماده اجرا می‌کند نه jobهای chunk را؛ این کار debugging یک lane ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و artifact مربوط به package را برای آن اجرا آماده، دانلود، یا بازاستفاده می‌کند؛ اگر lane منتخب یک lane live Docker باشد، job هدفمند تصویر live-test را برای آن rerun به‌صورت محلی می‌سازد. فرمان‌های rerun GitHub تولیدشده برای هر lane وقتی این مقدارها وجود داشته باشند شامل `package_artifact_run_id`، `package_artifact_name`، و inputهای تصویر آماده هستند، تا یک lane ناموفق بتواند دقیقاً همان package و تصویرهای اجرای ناموفق را بازاستفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow زمان‌بندی‌شده live/E2E مجموعه کامل Release-path Docker را روزانه اجرا می‌کند.

## Plugin Prerelease

`Plugin Prerelease` پوشش product/package پرهزینه‌تری است، بنابراین یک workflow جداگانه است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. درخواست‌های کششی عادی، pushهای `main`، و dispatchهای دستی مستقل CI این suite را خاموش نگه می‌دارند. این workflow تست‌های bundled plugin را میان هشت extension worker متوازن می‌کند؛ آن jobهای extension shard هم‌زمان تا دو گروه config مربوط به plugin را با یک Vitest worker برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای plugin با import سنگین jobهای CI اضافی ایجاد نکنند. مسیر Docker prerelease مخصوص release، laneهای Docker هدفمند را در گروه‌های کوچک batch می‌کند تا ده‌ها runner برای jobهای یک تا سه دقیقه‌ای رزرو نشود. workflow همچنین artifact اطلاع‌رسانی `plugin-inspector-advisory` را از `@openclaw/plugin-inspector` upload می‌کند؛ یافته‌های inspector ورودی triage هستند و gate مسدودکننده Plugin Prerelease را تغییر نمی‌دهند.

## QA Lab

QA Lab laneهای CI اختصاصی بیرون از workflow اصلی smart-scoped دارد. parity عاملی زیر harnessهای گسترده QA و release تو در تو شده است، نه یک workflow مستقل PR. وقتی parity باید همراه یک اجرای اعتبارسنجی گسترده حرکت کند، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- workflow مربوط به `QA-Lab - All Lanes` هر شب روی `main` و با dispatch دستی اجرا می‌شود؛ lane مربوط به mock parity، lane مربوط به live Matrix، و laneهای live Telegram و Discord را به‌صورت jobهای موازی پخش می‌کند. jobهای live از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

Release checkها laneهای transport مربوط به Matrix و Telegram live را با deterministic mock provider و مدل‌های mock-qualified (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد channel از تأخیر مدل live و startup عادی provider-plugin جدا شود. live transport gateway جست‌وجوی memory را غیرفعال می‌کند چون QA parity رفتار memory را جداگانه پوشش می‌دهد؛ اتصال provider با suiteهای جداگانه live model، native provider، و Docker provider پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و release از `--profile fast` استفاده می‌کند و فقط وقتی CLI checkout‌شده از آن پشتیبانی کند `--fail-fast` را اضافه می‌کند. پیش‌فرض CLI و input workflow دستی همچنان `all` می‌ماند؛ dispatch دستی با `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای release-critical مربوط به QA Lab را پیش از تأیید release اجرا می‌کند؛ gate مربوط به QA parity، packهای candidate و baseline را به‌صورت jobهای lane موازی اجرا می‌کند، سپس هر دو artifact را در یک job گزارش کوچک برای مقایسه نهایی parity دانلود می‌کند.

برای PRهای عادی، به‌جای اینکه parity را یک وضعیت الزامی بدانید، از شواهد scoped CI/check پیروی کنید.

## CodeQL

workflow مربوط به `CodeQL` عمداً یک اسکنر امنیتی first-pass محدود است، نه sweep کامل repository. اجراهای guard روزانه، دستی، و درخواست کششی غیر draft، کد workflow مربوط به Actions به‌علاوه پرریسک‌ترین سطوح JavaScript/TypeScript را با queryهای امنیتی high-confidence فیلترشده به `security-severity` بالا/بحرانی اسکن می‌کنند.

guard مربوط به درخواست کششی سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود و همان matrix امنیتی high-confidence را مانند workflow زمان‌بندی‌شده اجرا می‌کند. Android و macOS CodeQL خارج از پیش‌فرض‌های PR می‌مانند.

### دسته‌های امنیتی

| دسته‌بندی                                          | سطح                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | احراز هویت، اسرار، سندباکس، cron، و خط پایه Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌همراه زمان اجرای Plugin کانال، Gateway، Plugin SDK، اسرار، نقاط تماس ممیزی              |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF هسته، تجزیه IP، محافظ شبکه، web-fetch، و سطوح سیاست SSRF در Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، کمک‌کننده‌های اجرای فرایند، تحویل خروجی، و دروازه‌های اجرای ابزار عامل                                           |
| `/codeql-security-high/plugin-trust-boundary`     | نصب Plugin، بارگذار، manifest، رجیستری، نصب package-manager، بارگذاری منبع، و سطوح اعتماد قرارداد بسته Plugin SDK |

### شاردهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — شارد امنیتی زمان‌بندی‌شده Android. برنامه Android را برای CodeQL روی کوچک‌ترین رانر Blacksmith Linux که sanity گردش‌کار می‌پذیرد، به‌صورت دستی می‌سازد. زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — شارد امنیتی هفتگی/دستی macOS. برنامه macOS را برای CodeQL روی Blacksmith macOS به‌صورت دستی می‌سازد، نتایج ساخت وابستگی را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. بیرون از پیش‌فرض‌های روزانه نگه داشته شده چون ساخت macOS حتی وقتی پاک است، زمان اجرا را غالب می‌کند.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` شارد غیرامنیتی متناظر است. فقط queryهای کیفیت JavaScript/TypeScript غیرامنیتی با شدت خطا را روی سطوح باریک و باارزش، روی رانرهای Linux میزبانی‌شده توسط GitHub اجرا می‌کند تا اسکن‌های کیفیت بودجه ثبت رانر Blacksmith را مصرف نکنند. نگهبان pull request آن عمدا کوچک‌تر از نمایه زمان‌بندی‌شده است: PRهای غیر draft فقط شاردهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای فرمان/مدل/ابزار عامل و dispatch پاسخ، کد schema/مهاجرت/IO پیکربندی، کد احراز هویت/اسرار/سندباکس/امنیت، زمان اجرای کانال هسته و Plugin کانال bundled، پروتکل Gateway/روش سرور، چسب زمان اجرای حافظه/SDK، تحویل MCP/فرایند/خروجی، کاتالوگ زمان اجرای provider/مدل، صف‌های diagnostics/تحویل session، بارگذار Plugin، قرارداد بسته/Plugin SDK، یا زمان اجرای پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت، هر دوازده شارد کیفیت PR را اجرا می‌کنند.

اجرای دستی این موارد را می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

نمایه‌های باریک، قلاب‌های آموزش/تکرار برای اجرای یک شارد کیفیت به‌صورت جداگانه هستند.

| دسته‌بندی                                                | سطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، اسرار، سندباکس، cron، و Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | قراردادهای schema پیکربندی، مهاجرت، نرمال‌سازی، و IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schemaهای پروتکل Gateway و قراردادهای روش سرور                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال bundled                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | قراردادهای زمان اجرای اجرای فرمان، dispatch مدل/provider، dispatch و صف‌های پاسخ خودکار، و control-plane مربوط به ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، کمک‌کننده‌های نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، facadeهای زمان اجرای حافظه، aliasهای Plugin SDK حافظه، چسب فعال‌سازی زمان اجرای حافظه، و فرمان‌های doctor حافظه                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | درون‌سازوکارهای صف پاسخ، صف‌های تحویل session، کمک‌کننده‌های اتصال/تحویل session خروجی، سطوح bundle رویداد/log تشخیصی، و قراردادهای CLI مربوط به doctor session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | dispatch پاسخ ورودی Plugin SDK، کمک‌کننده‌های payload/تکه‌بندی/زمان اجرای پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و کمک‌کننده‌های اتصال session/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و discovery مربوط به provider، ثبت زمان اجرای provider، پیش‌فرض‌ها/کاتالوگ‌های provider، و رجیستری‌های web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap رابط کنترل، ماندگاری محلی، جریان‌های کنترل Gateway، و قراردادهای زمان اجرای control-plane وظیفه                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای زمان اجرای fetch/search وب هسته، IO رسانه، فهم رسانه، image-generation، و media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای بارگذار، رجیستری، سطح عمومی، و entrypointهای Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع Plugin SDK سمت بسته منتشرشده و کمک‌کننده‌های قرارداد بسته Plugin                                                                                      |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بدون مبهم‌کردن سیگنال امنیتی، زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و Pluginهای bundled باید فقط پس از پایدار شدن زمان اجرا و سیگنال نمایه‌های باریک، به‌عنوان کار پیگیری scoped یا sharded دوباره اضافه شود.

## گردش‌کارهای نگهداشت

### عامل اسناد

گردش‌کار `Docs Agent` یک مسیر نگهداشت رویدادمحور Codex برای همسو نگه داشتن اسناد موجود با تغییرات اخیرا land شده است. زمان‌بندی خالص ندارد: یک اجرای موفق CI مربوط به push غیر bot روی `main` می‌تواند آن را trigger کند، و اجرای دستی می‌تواند آن را مستقیما اجرا کند. invocationهای workflow-run وقتی `main` جلو رفته باشد یا وقتی اجرای غیر skipped دیگری از Docs Agent در ساعت گذشته ایجاد شده باشد، skip می‌شوند. وقتی اجرا می‌شود، بازه commit را از SHA منبع قبلی غیر skipped Docs Agent تا `main` فعلی بررسی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main را که از آخرین گذر اسناد انباشته شده‌اند پوشش دهد.

### عامل عملکرد تست

گردش‌کار `Test Performance Agent` یک مسیر نگهداشت رویدادمحور Codex برای تست‌های کند است. زمان‌بندی خالص ندارد: یک اجرای موفق CI مربوط به push غیر bot روی `main` می‌تواند آن را trigger کند، اما اگر invocation دیگری از workflow-run در همان روز UTC قبلا اجرا شده یا در حال اجرا باشد، skip می‌شود. اجرای دستی این دروازه فعالیت روزانه را دور می‌زند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای full-suite می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک عملکرد تست را که پوشش را حفظ می‌کنند انجام دهد، نه refactorهای گسترده، سپس گزارش full-suite را دوباره اجرا می‌کند و تغییراتی را که تعداد تست‌های baseline پاس‌شده را کاهش دهند رد می‌کند. گزارش گروه‌بندی‌شده wall time هر پیکربندی و حداکثر RSS روی Linux و macOS را ثبت می‌کند، بنابراین مقایسه قبل/بعد دلتاهای حافظه تست را کنار دلتاهای مدت زمان نشان می‌دهد. اگر baseline تست‌های failing داشته باشد، Codex فقط می‌تواند failureهای واضح را اصلاح کند و گزارش full-suite پس از عامل باید قبل از commit شدن هر چیز پاس شود. وقتی `main` قبل از land شدن push بات جلو می‌رود، این مسیر patch اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را دوباره تلاش می‌کند؛ patchهای stale متضاد skip می‌شوند. از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا action مربوط به Codex بتواند همان وضعیت ایمنی drop-sudo عامل اسناد را حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی maintainer برای پاک‌سازی duplicate پس از land است. به‌صورت پیش‌فرض dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتا فهرست‌شده را می‌بندد. پیش از mutation در GitHub، تأیید می‌کند که PR land شده merge شده و هر duplicate یا issue ارجاع‌شده مشترک دارد یا hunkهای تغییر‌یافته هم‌پوشان.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## دروازه‌های بررسی محلی و مسیریابی تغییرات

منطق changed-lane محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن دروازه بررسی محلی نسبت به scope گسترده پلتفرم CI درباره مرزهای معماری سخت‌گیرتر است:

- تغییرات production هسته، typecheck تولید هسته و تست هسته را به‌همراه lint/guardهای هسته اجرا می‌کنند؛
- تغییرات فقط تست هسته، فقط typecheck تست هسته را به‌همراه lint هسته اجرا می‌کنند؛
- تغییرات production افزونه، typecheck تولید افزونه و تست افزونه را به‌همراه lint افزونه اجرا می‌کنند؛
- تغییرات فقط تست افزونه، typecheck تست افزونه را به‌همراه lint افزونه اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا قرارداد Plugin به typecheck افزونه گسترش می‌یابند، چون افزونه‌ها به آن قراردادهای هسته وابسته‌اند (sweepهای افزونه Vitest همچنان کار تست صریح می‌مانند)؛
- bumpهای نسخه فقط metadata انتشار، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی root را اجرا می‌کنند؛
- تغییرات ناشناخته root/پیکربندی به‌صورت fail safe به همه مسیرهای بررسی می‌روند.

مسیریابی changed-test محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش‌های مستقیم تست خودشان را اجرا می‌کنند، ویرایش‌های منبع ابتدا mappingهای صریح را ترجیح می‌دهند، سپس تست‌های sibling و وابستگان import-graph را. پیکربندی تحویل group-room مشترک یکی از mappingهای صریح است: تغییرات در پیکربندی پاسخ visible گروه، حالت تحویل پاسخ منبع، یا prompt سیستمی message-tool از مسیر تست‌های پاسخ هسته به‌همراه regressionهای تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از اولین push PR شکست بخورد. فقط وقتی تغییر آن‌قدر در سطح harness گسترده است که مجموعه mapped ارزان، proxy قابل اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Crabbox wrapper remote-box مالک repo برای اثبات maintainer در Linux است. وقتی یک بررسی برای حلقه ویرایش محلی بیش از حد گسترده است، وقتی هم‌ارزی CI مهم است، یا وقتی proof به secrets، Docker، مسیرهای بسته، boxهای reusable، یا logهای remote نیاز دارد، آن را از root repo استفاده کنید. backend عادی OpenClaw برابر با `blacksmith-testbox` است؛ ظرفیت مالکیت‌شده AWS/Hetzner fallbackی برای outageهای Blacksmith، مشکلات quota، یا تست صریح روی ظرفیت مالکیت‌شده است.

اجراهای Blacksmith با پشتوانه Crabbox، Testboxهای یک‌باره را گرم، claim، sync، اجرا، گزارش و پاک‌سازی می‌کنند. بررسی سلامت sync داخلی وقتی فایل‌های ضروری ریشه مانند `pnpm-lock.yaml` ناپدید شوند یا وقتی `git status --short` دست‌کم ۲۰۰ حذف track‌شده را نشان دهد، سریع شکست می‌خورد. برای PRهای بزرگ‌حذف عمدی، برای فرمان راه‌دور `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

Crabbox همچنین فراخوانی محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از sync در مرحله sync بماند، خاتمه می‌دهد. برای غیرفعال‌کردن آن guard، `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ، مقدار میلی‌ثانیه بزرگ‌تری استفاده کنید.

پیش از نخستین اجرا، wrapper را از ریشه repo بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper repo باینری کهنه Crabbox را که `blacksmith-testbox` را advertise نمی‌کند رد می‌کند. provider را صریح پاس بدهید، حتی اگر `.crabbox.yaml` پیش‌فرض‌های owned-cloud داشته باشد. در worktreeهای Codex یا checkoutهای linked/sparse، از اسکریپت محلی `pnpm crabbox:run` پرهیز کنید چون pnpm ممکن است پیش از شروع Crabbox وابستگی‌ها را reconcile کند؛ در عوض node wrapper را مستقیم فراخوانی کنید:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

اجراهای با پشتوانه Blacksmith به Crabbox 0.22.0 یا جدیدتر نیاز دارند تا wrapper رفتار فعلی sync، queue و cleanup مربوط به Testbox را دریافت کند. هنگام استفاده از checkout هم‌سطح، پیش از کارهای timing یا proof، باینری محلی ignoreشده را دوباره build کنید:

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

اجرای دوباره تست متمرکز:

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

خلاصه JSON نهایی را بخوانید. فیلدهای مفید `provider`، `leaseId`، `syncDelegated`، `exitCode`، `commandMs` و `totalMs` هستند. برای اجراهای Blacksmith Testbox تفویض‌شده، کد خروج wrapper Crabbox و خلاصه JSON نتیجه فرمان هستند. اجرای لینک‌شده GitHub Actions مالک hydration و keepalive است؛ وقتی Testbox پس از بازگشت فرمان SSH از بیرون متوقف شده باشد، ممکن است با وضعیت `cancelled` تمام شود. مگر اینکه `exitCode` wrapper غیرصفر باشد یا خروجی فرمان تست شکست‌خورده‌ای را نشان دهد، آن را artifact مربوط به cleanup/status در نظر بگیرید. اجراهای یک‌باره Crabbox با پشتوانه Blacksmith باید Testbox را به‌صورت خودکار متوقف کنند؛ اگر اجرایی interrupt شد یا cleanup روشن نبود، boxهای live را بررسی کنید و فقط boxهایی را که خودتان ساخته‌اید متوقف کنید:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

فقط وقتی reuse را به کار ببرید که عمدا به چند فرمان روی همان box hydrateشده نیاز دارید:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

اگر Crabbox لایه خراب است اما خود Blacksmith کار می‌کند، Blacksmith مستقیم را فقط برای diagnostics مانند `list`، `status` و cleanup به کار ببرید. پیش از اینکه اجرای مستقیم Blacksmith را به‌عنوان proof نگه‌دارنده بپذیرید، مسیر Crabbox را درست کنید.

اگر `blacksmith testbox list --all` و `blacksmith testbox status` کار می‌کنند اما warmupهای جدید پس از چند دقیقه با وضعیت `queued` بدون IP یا URL اجرای Actions می‌مانند، آن را فشار مربوط به provider، queue، billing یا org-limit در Blacksmith در نظر بگیرید. idهای queuedیی را که ساخته‌اید متوقف کنید، Testboxهای بیشتری شروع نکنید، و proof را به مسیر ظرفیت Crabbox مالکیتی زیر منتقل کنید تا هم‌زمان کسی dashboard، billing و org limits مربوط به Blacksmith را بررسی کند.

فقط وقتی به ظرفیت Crabbox مالکیتی escalation کنید که Blacksmith down باشد، quota-limited باشد، محیط لازم را نداشته باشد، یا ظرفیت مالکیتی صراحتا هدف باشد:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

زیر فشار AWS، از `class=beast` پرهیز کنید مگر اینکه کار واقعا به CPU در سطح 48xlarge نیاز داشته باشد. درخواست `beast` از ۱۹۲ vCPU شروع می‌شود و ساده‌ترین راه برای برخورد با quota منطقه‌ای EC2 Spot یا On-Demand Standard است. `.crabbox.yaml` متعلق به repo به‌صورت پیش‌فرض از `standard`، چند منطقه ظرفیت و `capacity.hints: true` استفاده می‌کند تا leaseهای AWS واسطه‌شده، region/market انتخاب‌شده، فشار quota، fallback به Spot و هشدارهای کلاس پرفشار را چاپ کنند. برای بررسی‌های گسترده سنگین‌تر از `fast` استفاده کنید، `large` را فقط پس از کافی نبودن standard/fast به کار ببرید، و `beast` را فقط برای laneهای استثنایی CPU-bound مانند full-suite یا ماتریس‌های Docker همه Pluginها، validation صریح release/blocker، یا profiling عملکرد high-core استفاده کنید. از `beast` برای `pnpm check:changed`، تست‌های متمرکز، کار docs-only، lint/typecheck معمولی، reproهای کوچک E2E یا triage قطعی Blacksmith استفاده نکنید. برای diagnosis ظرفیت از `--market on-demand` استفاده کنید تا نوسان بازار Spot با signal مخلوط نشود.

`.crabbox.yaml` مالک پیش‌فرض‌های provider، sync و hydration مربوط به GitHub Actions برای laneهای owned-cloud است. این فایل `.git` محلی را exclude می‌کند تا checkout hydrateشده Actions به‌جای sync کردن remoteهای محلی نگه‌دارنده و object storeها، metadata راه‌دور Git خودش را نگه دارد، و artifactهای محلی runtime/build را که هرگز نباید منتقل شوند exclude می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، fetch کردن `origin/main`، و handoff محیط non-secret برای فرمان‌های owned-cloud `crabbox run --id <cbx_id>` است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)

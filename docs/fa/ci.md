---
read_when:
    - باید بفهمید چرا یک وظیفهٔ CI اجرا شد یا نشد
    - در حال اشکال‌زدایی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگی اجرای اعتبارسنجی انتشار یا اجرای دوبارهٔ آن هستید
    - شما در حال تغییر ارسال ClawSweeper یا بازارسال فعالیت GitHub هستید
summary: گراف کارهای CI، دروازه‌های دامنه، چترهای انتشار، و معادل‌های فرمان محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-07-04T18:11:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI روی هر ارسال به `main` و هر درخواست کشش اجرا می‌شود. ارسال‌های متعارف
`main` ابتدا از یک پنجره پذیرش ۹۰ ثانیه‌ای روی اجراکننده میزبانی‌شده عبور می‌کنند.
گروه هم‌زمانی موجود `CI` آن اجرای در حال انتظار را وقتی commit جدیدتری وارد شود لغو می‌کند،
بنابراین ادغام‌های پیاپی هرکدام یک ماتریس کامل Blacksmith ثبت نمی‌کنند. درخواست‌های کشش و اجراهای دستی از انتظار عبور می‌کنند. سپس job
`preflight` تفاوت‌ها را دسته‌بندی می‌کند و وقتی فقط ناحیه‌های نامرتبط تغییر کرده باشند، laneهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمدا محدوده‌بندی هوشمند را دور می‌زنند
و برای نامزدهای انتشار و اعتبارسنجی گسترده، کل گراف را منشعب می‌کنند. laneهای Android از طریق `include_android` همچنان اختیاری می‌مانند. پوشش Plugin فقط مخصوص انتشار در workflow جداگانه [`پیش‌انتشار Plugin`](#plugin-prerelease) قرار دارد و فقط از [`اعتبارسنجی کامل انتشار`](#full-release-validation)
یا یک اجرای دستی صریح اجرا می‌شود.

## نمای کلی Pipeline

| Job                                | هدف                                                                                                   | زمان اجرا                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | تغییرات فقط مستندات، scopeهای تغییرکرده، extensionهای تغییرکرده، و مانیفست ساخت CI را شناسایی می‌کند                   | همیشه روی ارسال‌ها و PRهای غیرپیش‌نویس                  |
| `runner-admission`                 | debounce میزبانی‌شده ۹۰ ثانیه‌ای برای ارسال‌های متعارف `main` پیش از ثبت کار Blacksmith                | هر اجرای CI؛ خواب فقط روی ارسال‌های متعارف `main` |
| `security-fast`                    | تشخیص کلید خصوصی، ممیزی workflow تغییرکرده از طریق `zizmor`، و ممیزی lockfile تولید                 | همیشه روی ارسال‌ها و PRهای غیرپیش‌نویس                  |
| `check-dependencies`               | گذر فقط‌وابستگی Knip برای تولید به‌همراه نگهبان allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node                               |
| `build-artifacts`                  | ساخت `dist/`، Control UI، smoke checkهای CLI ساخته‌شده، بررسی‌های artifact ساخته‌شده جاسازی‌شده، و artifactهای قابل‌استفاده مجدد | تغییرات مرتبط با Node                               |
| `checks-fast-core`                 | laneهای سریع صحت Linux مانند bundled، protocol، QA Smoke CI، و بررسی‌های routing CI                | تغییرات مرتبط با Node                               |
| `checks-fast-contracts-plugins-*`  | دو بررسی sharded قرارداد Plugin                                                                        | تغییرات مرتبط با Node                               |
| `checks-fast-contracts-channels-*` | دو بررسی sharded قرارداد channel                                                                       | تغییرات مرتبط با Node                               |
| `checks-node-core-*`               | shardهای تست هسته Node، به‌جز laneهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node                               |
| `check-*`                          | معادل gate محلی اصلی به‌صورت sharded: نوع‌های تولید، lint، guardها، نوع‌های تست، و smoke سخت‌گیرانه                | تغییرات مرتبط با Node                               |
| `check-additional-*`               | معماری، drift مرزی/prompt به‌صورت sharded، guardهای extension، مرز package، و توپولوژی runtime     | تغییرات مرتبط با Node                               |
| `checks-node-compat-node22`        | lane ساخت و smoke سازگاری Node 22                                                                | اجرای دستی CI برای انتشارها                     |
| `check-docs`                       | قالب‌بندی مستندات، lint، و بررسی لینک‌های خراب                                                             | مستندات تغییر کرده‌اند                                        |
| `skills-python`                    | Ruff + pytest برای Skills پشتیبانی‌شده با Python                                                                    | تغییرات مرتبط با Skillهای Python                       |
| `checks-windows`                   | تست‌های فرایند/مسیر مخصوص Windows به‌همراه رگرسیون‌های specifier import مشترک runtime                      | تغییرات مرتبط با Windows                            |
| `macos-node`                       | lane تست TypeScript در macOS با استفاده از artifactهای ساخته‌شده مشترک                                               | تغییرات مرتبط با macOS                              |
| `macos-swift`                      | lint، ساخت، و تست‌های Swift برای برنامه macOS                                                            | تغییرات مرتبط با macOS                              |
| `ios-build`                        | تولید پروژه Xcode به‌همراه ساخت simulator برنامه iOS                                                 | برنامه iOS، app kit مشترک، یا تغییرات Swabble         |
| `android`                          | تست‌های واحد Android برای هر دو flavor به‌همراه ساخت یک APK debug                                              | تغییرات مرتبط با Android                            |
| `test-performance-agent`           | بهینه‌سازی روزانه تست‌های کند Codex پس از فعالیت قابل‌اعتماد                                                 | موفقیت CI اصلی یا اجرای دستی                  |
| `openclaw-performance`             | گزارش‌های عملکرد runtime روزانه/درخواستی Kova با laneهای mock-provider، deep-profile، و زنده GPT 5.5 | زمان‌بندی‌شده و اجرای دستی                       |

## ترتیب fail-fast

1. `runner-admission` فقط برای ارسال‌های متعارف `main` منتظر می‌ماند؛ ارسال جدیدتر اجرا را پیش از ثبت Blacksmith لغو می‌کند.
2. `preflight` تصمیم می‌گیرد اصلا کدام laneها وجود داشته باشند. منطق `docs-scope` و `changed-scope` گام‌هایی داخل این job هستند، نه jobهای مستقل.
3. `security-fast`، `check-*`، `check-additional-*`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و ماتریس platform سریع شکست می‌خورند.
4. `build-artifacts` با laneهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان پایین‌دستی به‌محض آماده‌شدن ساخت مشترک شروع شوند.
5. laneهای سنگین‌تر platform و runtime پس از آن منشعب می‌شوند: `checks-fast-core`، `checks-fast-contracts-plugins-*`، `checks-fast-contracts-channels-*`، `checks-node-core-*`، `checks-windows`، `macos-node`، `macos-swift`، `ios-build`، و `android`.

وقتی ارسال جدیدتری روی همان PR یا ref `main` وارد شود، GitHub ممکن است jobهای جایگزین‌شده را با وضعیت `cancelled` علامت‌گذاری کند. این را نویز CI در نظر بگیرید، مگر اینکه جدیدترین اجرا برای همان ref نیز در حال شکست باشد. jobهای ماتریسی از `fail-fast: false` استفاده می‌کنند، و `build-artifacts` شکست‌های embedded channel، core-support-boundary، و gateway-watch را مستقیما گزارش می‌کند، به‌جای اینکه jobهای verifier کوچک را در صف بگذارد. کلید هم‌زمانی خودکار CI نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در یک گروه صف قدیمی نتواند اجراهای جدیدتر main را نامحدود مسدود کند. اجراهای دستی مجموعه کامل از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در حال انجام را لغو نمی‌کنند.

برای خلاصه‌کردن زمان دیواری، زمان صف، کندترین jobها، شکست‌ها، و مانع fanout مربوط به `pnpm-store-warmup` از GitHub Actions، از `pnpm ci:timings`، `pnpm ci:timings:recent`، یا `node scripts/ci-run-timings.mjs <run-id>` استفاده کنید. CI همان خلاصه اجرا را نیز به‌عنوان artifact با نام `ci-timings-summary` بارگذاری می‌کند. برای زمان‌بندی ساخت، گام `Build dist` در job `build-artifacts` را بررسی کنید: `pnpm build:ci-artifacts` عبارت `[build-all] phase timings:` را چاپ می‌کند و شامل `ui:build` است؛ job همچنین artifact `startup-memory` را بارگذاری می‌کند.

برای اجراهای درخواست کشش، job پایانی timing-summary پیش از پاس‌دادن `GH_TOKEN` به `gh run view`، helper را از revision پایه قابل‌اعتماد اجرا می‌کند. این کار query دارای token را بیرون از کد کنترل‌شده توسط branch نگه می‌دارد و هم‌زمان اجرای CI فعلی درخواست کشش را خلاصه می‌کند.

## زمینه PR و شواهد

PRهای مشارکت‌کنندگان خارجی یک gate زمینه PR و شواهد را از
`.github/workflows/real-behavior-proof.yml` اجرا می‌کنند. این workflow، commit پایه قابل‌اعتماد را checkout می‌کند
و فقط بدنه PR را ارزیابی می‌کند؛ کدی از branch مشارکت‌کننده اجرا نمی‌کند.

این gate برای نویسندگان PR اعمال می‌شود که مالک repository، عضو،
collaborator، یا bot نیستند. وقتی بدنه PR شامل بخش‌های نوشته‌شده
`What Problem This Solves` و `Evidence` باشد، عبور می‌کند. شواهد می‌تواند یک
تست متمرکز، نتیجه CI، screenshot، recording، خروجی terminal، مشاهده زنده،
log ویرایش‌شده، یا لینک artifact باشد. بدنه، هدف و اعتبارسنجی مفید را فراهم می‌کند؛
reviewerها کد، تست‌ها، و CI را برای ارزیابی درستی بررسی می‌کنند.

وقتی check شکست می‌خورد، به‌جای ارسال commit کد دیگر، بدنه PR را به‌روزرسانی کنید.

## Scope و routing

منطق scope در `scripts/ci-changed-scope.mjs` قرار دارد و با تست‌های واحد در `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. اجرای دستی، تشخیص changed-scope را رد می‌کند و باعث می‌شود مانیفست preflight طوری رفتار کند که انگار هر ناحیه scopeدار تغییر کرده است.

- **ویرایش‌های workflow CI** گراف CI مربوط به Node را به‌همراه linting workflow اعتبارسنجی می‌کنند، اما به‌تنهایی ساخت‌های native مربوط به Windows، iOS، Android، یا macOS را اجبار نمی‌کنند؛ آن laneهای platform همچنان به تغییرات source همان platform محدود می‌مانند.
- **Workflow Sanity**، `actionlint`، `zizmor` را روی همه فایل‌های YAML workflow، نگهبان interpolation مربوط به composite-action، و نگهبان conflict-marker اجرا می‌کند. job `security-fast` محدود به PR نیز `zizmor` را روی فایل‌های workflow تغییرکرده اجرا می‌کند تا یافته‌های امنیتی workflow زودتر در گراف اصلی CI شکست بخورند.
- **مستندات روی ارسال‌های `main`** توسط workflow مستقل `Docs` با همان mirror مستندات ClawHub که CI استفاده می‌کند بررسی می‌شوند، بنابراین ارسال‌های ترکیبی کد+مستندات shard `check-docs` مربوط به CI را نیز در صف نمی‌گذارند. درخواست‌های کشش و CI دستی همچنان وقتی مستندات تغییر کرده باشند، `check-docs` را از CI اجرا می‌کنند.
- **TUI PTY** برای تغییرات TUI در shard مربوط به `checks-node-core-runtime-tui-pty` روی Linux Node اجرا می‌شود. این shard، `test/vitest/vitest.tui-pty.config.ts` را با `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` اجرا می‌کند، بنابراین هم lane fixture قطعی `TuiBackend` و هم smoke کندتر `tui --local` را پوشش می‌دهد که فقط endpoint مدل خارجی را mock می‌کند.
- **ویرایش‌های فقط routing CI، ویرایش‌های منتخب fixture ارزان core-test، و ویرایش‌های محدود helper/test-routing قرارداد Plugin** از یک مسیر مانیفست سریع فقط Node استفاده می‌کنند: `preflight`، security، و یک task منفرد `checks-fast-core`. وقتی تغییر محدود به سطح‌های routing یا helper باشد که task سریع مستقیما تمرین می‌کند، آن مسیر artifactهای ساخت، سازگاری Node 22، قراردادهای channel، shardهای کامل core، shardهای bundled-plugin، و ماتریس‌های guard اضافی را رد می‌کند.
- **بررسی‌های Node روی Windows** به wrapperهای فرایند/مسیر مخصوص Windows، helperهای runner مربوط به npm/pnpm/UI، پیکربندی package manager، و سطح‌های workflow CI که آن lane را اجرا می‌کنند محدود هستند؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط‌تست روی laneهای Linux Node می‌مانند.

کندترین خانواده‌های آزمون Node تقسیم یا متوازن شده‌اند تا هر job بدون رزرو بیش از حد runnerها کوچک بماند: قراردادهای plugin و قراردادهای کانال هرکدام به‌صورت دو shard وزن‌دار با پشتوانه Blacksmith و fallback استاندارد runner گیت‌هاب اجرا می‌شوند، laneهای سریع/پشتیبان واحد core جداگانه اجرا می‌شوند، زیرساخت runtime هسته بین state، process/config، shared و سه shard دامنه cron تقسیم شده است، auto-reply به‌صورت workerهای متوازن اجرا می‌شود (با زیردرخت reply که به shardهای agent-runner، dispatch و commands/state-routing تقسیم شده است)، و پیکربندی‌های gateway/server عامل‌محور به‌جای انتظار برای artifactهای ساخته‌شده، در laneهای chat/auth/model/http-plugin/runtime/startup تقسیم شده‌اند. سپس CI عادی فقط shardهای الگوی include زیرساخت ایزوله را در بسته‌های قطعی با حداکثر 64 فایل آزمون بسته‌بندی می‌کند، که ماتریس Node را بدون ادغام suiteهای command/cron غیرایزوله، agents-core دارای state، یا gateway/server کاهش می‌دهد؛ suiteهای ثابت سنگین روی 8 vCPU می‌مانند، درحالی‌که laneهای بسته‌بندی‌شده و کم‌وزن‌تر از 4 vCPU استفاده می‌کنند. Pull requestها روی مخزن canonical از یک طرح پذیرش compact اضافی استفاده می‌کنند: همان گروه‌های per-config در subprocessهای ایزوله داخل طرح فعلی 34-job Linux Node اجرا می‌شوند، بنابراین یک PR واحد کل ماتریس 70-plus-job Node را ثبت نمی‌کند. pushهای `main`، dispatchهای دستی و gateهای انتشار ماتریس کامل را حفظ می‌کنند. آزمون‌های گسترده browser، QA، media و pluginهای متفرقه به‌جای catch-all مشترک plugin، از پیکربندی‌های اختصاصی Vitest خود استفاده می‌کنند. shardهای الگوی include ورودی‌های timing را با نام shard در CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک پیکربندی کامل را از یک shard فیلترشده تشخیص دهد. `check-additional-*` کار compile/canary مرز package را کنار هم نگه می‌دارد و معماری topology runtime را از پوشش gateway watch جدا می‌کند؛ فهرست boundary guard به یک shard سنگین از نظر prompt و یک shard ترکیبی برای باقی نوارهای guard تقسیم شده است، که هرکدام guardهای مستقل انتخاب‌شده را هم‌زمان اجرا می‌کنند و timing هر check را چاپ می‌کنند. بررسی پرهزینه drift در snapshot prompt مسیر خوشحال Codex به‌عنوان job اضافی خودش فقط برای CI دستی و تغییرات اثرگذار بر prompt اجرا می‌شود، بنابراین تغییرات عادی و نامرتبط Node پشت تولید سرد snapshot prompt منتظر نمی‌مانند و shardهای boundary متوازن می‌مانند، درحالی‌که prompt drift همچنان به PR ایجادکننده آن متصل است؛ همان flag تولید Vitest snapshot prompt را داخل shard پشتیبان/مرزی core با artifact ساخته‌شده رد می‌کند. Gateway watch، آزمون‌های کانال و shard پشتیبان/مرزی core داخل `build-artifacts` پس از ساخته‌شدن `dist/` و `dist-runtime/` هم‌زمان اجرا می‌شوند.

پس از پذیرش، CI canonical لینوکس تا 24 job هم‌زمان آزمون Node و
12 مورد برای laneهای کوچک‌تر fast/check را مجاز می‌کند؛ Windows و Android روی دو می‌مانند زیرا
poolهای runner آن‌ها محدودتر هستند.

طرح compact PR برای suite فعلی 18 job Node تولید می‌کند: گروه‌های whole-config
در subprocessهای ایزوله با timeout دسته‌ای 120 دقیقه‌ای batch می‌شوند،
درحالی‌که گروه‌های الگوی include همان بودجه job محدود را به اشتراک می‌گذارند.

CI اندروید هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK اشکال‌زدایی Play را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه‌ای ندارد؛ lane آزمون واحد آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log compile می‌کند، درحالی‌که از job بسته‌بندی تکراری APK اشکال‌زدایی در هر push مرتبط با Android پرهیز می‌کند.

shard `check-dependencies` دستور `pnpm deadcode:dependencies` (یک pass وابستگی‌محور فقط production با Knip که به آخرین نسخه Knip pin شده، با minimum release age مربوط به pnpm برای نصب `dlx` غیرفعال) و `pnpm deadcode:unused-files` را اجرا می‌کند، که یافته‌های production Knip برای فایل‌های استفاده‌نشده را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard فایل استفاده‌نشده وقتی شکست می‌خورد که یک PR فایل استفاده‌نشده جدید و بازبینی‌نشده‌ای اضافه کند یا یک entry کهنه allowlist را باقی بگذارد، درحالی‌که سطوح intentional dynamic plugin، generated، build، live-test و package bridge را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## ارسال فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت مقصد از فعالیت مخزن OpenClaw به ClawSweeper است. این workflow کد pull request غیرقابل‌اعتماد را checkout یا اجرا نمی‌کند. workflow از `CLAWSWEEPER_APP_PRIVATE_KEY` یک token برای GitHub App می‌سازد، سپس payloadهای compact `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق بازبینی issue و pull request؛
- `clawsweeper_comment` برای فرمان‌های صریح ClawSweeper در نظرهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های بازبینی در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی گیت‌هاب که عامل ClawSweeper ممکن است بررسی کند.

lane `github_activity` فقط metadata نرمال‌سازی‌شده را forward می‌کند: نوع event، action، actor، repository، شماره item، URL، title، state و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این lane عمداً از forward کردن بدنه کامل webhook پرهیز می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper` برابر `.github/workflows/github-activity.yml` است که event نرمال‌شده را برای عامل ClawSweeper به hook مربوط به OpenClaw Gateway ارسال می‌کند.

فعالیت عمومی observation است، نه delivery-by-default. عامل ClawSweeper هدف Discord را در prompt خود دریافت می‌کند و فقط وقتی event غیرمنتظره، اقدام‌پذیر، پرریسک یا از نظر عملیاتی مفید است باید در `#clawsweeper` پست کند. بازکردن‌ها، ویرایش‌ها، churn ربات‌ها، نویز تکراری webhook و ترافیک عادی review باید به `NO_REPLY` منجر شوند.

در کل این مسیر، titleها، commentها، bodyها، متن review، نام branchها و پیام‌های commit گیت‌هاب را داده غیرقابل‌اعتماد در نظر بگیرید. آن‌ها ورودی summarization و triage هستند، نه دستورهایی برای workflow یا runtime عامل.

## dispatchهای دستی

dispatchهای دستی CI همان گراف job CI عادی را اجرا می‌کنند اما هر lane scoped غیر Android را forced on می‌کنند: shardهای Linux Node، shardهای bundled-plugin، shardهای قرارداد plugin و کانال، سازگاری Node 22، `check-*`، `check-additional-*`، بررسی‌های smoke artifact ساخته‌شده، بررسی‌های docs، Python skills، Windows، macOS، ساخت iOS و Control UI i18n. dispatchهای مستقل دستی CI فقط با `include_android=true` اندروید را اجرا می‌کنند؛ چتر انتشار کامل با پاس‌دادن `include_android=true` اندروید را فعال می‌کند. بررسی‌های static پیش‌انتشار plugin، shard فقط انتشار `agentic-plugins`، sweep دسته کامل extension و laneهای Docker پیش‌انتشار plugin از CI مستثنا هستند. suite پیش‌انتشار Docker فقط وقتی اجرا می‌شود که `Full Release Validation` workflow جداگانه `Plugin Prerelease` را با gate release-validation فعال dispatch کند.

runهای دستی از یک concurrency group یکتا استفاده می‌کنند تا suite کامل release-candidate با push یا PR run دیگری روی همان ref لغو نشود. ورودی اختیاری `target_ref` به caller قابل‌اعتماد اجازه می‌دهد آن گراف را علیه یک branch، tag یا SHA کامل commit اجرا کند، درحالی‌که از فایل workflow مربوط به dispatch ref انتخاب‌شده استفاده می‌کند.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

مسیر monthly npm-only extended-stable استثناست: هم preflight مربوط به `OpenClaw NPM
Release` و هم `Full Release Validation` را از branch دقیق
`extended-stable/YYYY.M.33` dispatch کنید، run IDهای آن‌ها را حفظ کنید و هر دو ID را به
run انتشار مستقیم npm پاس دهید. برای فرمان‌ها، الزامات دقیق identity، readback registry و رویه repair selector به [انتشار extended-stable ماهانه فقط npm](/fa/reference/RELEASING#monthly-npm-only-extended-stable-publication) مراجعه کنید.
این مسیر انتشار plugin، macOS، Windows، GitHub
Release، dist-tag خصوصی یا سایر platformها را dispatch نمی‌کند.

## Runnerها

| Runner                          | Jobها                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | dispatch دستی CI و fallbackهای مخزن غیر canonical، اسکن‌های کیفیت CodeQL JavaScript/actions، workflow-sanity، labeler، auto-response، workflowهای docs خارج از CI، و preflight install-smoke تا ماتریس Blacksmith بتواند زودتر queue شود                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`، `security-fast`، shardهای extension کم‌وزن‌تر، `checks-fast-core` به‌جز QA Smoke CI، shardهای قرارداد plugin/channel، بیشتر shardهای bundled/کم‌وزن‌تر Linux Node، `check-guards`، `check-prod-types`، `check-test-types`، shardهای منتخب `check-additional-*`، و `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | suiteهای سنگین Linux Node حفظ‌شده، shardهای `check-additional-*` سنگین از نظر boundary/extension، و `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI، `build-artifacts` در CI و Testbox، `check-lint` (به‌اندازه‌ای حساس به CPU که 8 vCPU بیش از صرفه‌جویی هزینه داشت)؛ buildهای Docker مربوط به install-smoke (هزینه زمان queue با 32-vCPU بیش از صرفه‌جویی بود)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-15` fallback می‌کنند                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` و `ios-build` روی `openclaw/openclaw`؛ forkها به `macos-26` fallback می‌کنند                                                                                                                                                                                                                     |

## بودجه ثبت runner

bucket فعلی ثبت runner گیت‌هاب OpenClaw در `ghx api rate_limit` تعداد 10,000 ثبت runner خودمیزبان
در هر 5 دقیقه را گزارش می‌کند. پیش از هر pass تنظیم، `actions_runner_registration` را دوباره بررسی کنید
زیرا گیت‌هاب می‌تواند این bucket را تغییر دهد. این limit بین همه ثبت‌های runner مربوط به Blacksmith در سازمان
`openclaw` مشترک است، بنابراین افزودن یک نصب Blacksmith دیگر bucket جدیدی اضافه نمی‌کند.

labelهای Blacksmith را منبع کمیاب برای کنترل burst در نظر بگیرید. jobهایی که فقط route، notify، summarize، انتخاب shard یا اجرای اسکن‌های کوتاه CodeQL انجام می‌دهند باید روی runnerهای میزبانی‌شده گیت‌هاب بمانند مگر اینکه نیازهای Blacksmith-specific اندازه‌گیری‌شده داشته باشند. هر ماتریس Blacksmith جدید، `max-parallel` بزرگ‌تر یا workflow با فرکانس بالا باید worst-case count ثبت خود را نشان دهد و هدف سطح org را زیر حدود 60% bucket زنده نگه دارد. با bucket فعلی 10,000 ثبت، این یعنی هدف عملیاتی 6,000 ثبت، که برای مخزن‌های هم‌زمان، retryها و هم‌پوشانی burst فضای headroom باقی می‌گذارد.

CI مخزن canonical، Blacksmith را به‌عنوان مسیر پیش‌فرض runner برای runهای عادی push و pull-request نگه می‌دارد. `workflow_dispatch` و runهای مخزن غیر canonical از runnerهای میزبانی‌شده گیت‌هاب استفاده می‌کنند، اما runهای عادی canonical در حال حاضر سلامت queue Blacksmith را probe نمی‌کنند یا وقتی Blacksmith در دسترس نیست به‌صورت خودکار به labelهای میزبانی‌شده گیت‌هاب fallback نمی‌کنند.

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

## کارایی OpenClaw

`OpenClaw Performance` گردش‌کار کارایی محصول/زمان اجرا است. این گردش‌کار روزانه روی `main` اجرا می‌شود و می‌توان آن را به‌صورت دستی نیز اجرا کرد:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

اجرای دستی معمولاً مرجع گردش‌کار را بنچمارک می‌کند. برای بنچمارک کردن یک برچسب انتشار یا شاخه‌ای دیگر با پیاده‌سازی فعلی گردش‌کار، `target_ref` را تنظیم کنید. مسیرهای گزارش منتشرشده و اشاره‌گرهای آخرین نسخه بر اساس مرجع آزمایش‌شده کلیدگذاری می‌شوند، و هر `index.md` مرجع/SHA آزمایش‌شده، مرجع/SHA گردش‌کار، مرجع Kova، پروفایل، حالت احراز هویت مسیر، مدل، تعداد تکرار، و فیلترهای سناریو را ثبت می‌کند.

این گردش‌کار OCM را از یک انتشار پین‌شده و Kova را از `openclaw/Kova` در ورودی پین‌شده `kova_ref` نصب می‌کند، سپس سه مسیر را اجرا می‌کند:

- `mock-provider`: سناریوهای تشخیصی Kova در برابر یک زمان اجرای ساخته‌شده محلی با احراز هویت جعلی و قطعیِ سازگار با OpenAI.
- `mock-deep-profile`: پروفایل‌گیری CPU/heap/trace برای نقاط داغ راه‌اندازی، Gateway، و نوبت عامل.
- `live-openai-candidate`: یک نوبت عامل واقعی OpenAI `openai/gpt-5.5`، که وقتی `OPENAI_API_KEY` در دسترس نباشد رد می‌شود.

مسیر mock-provider پس از گذر Kova، پروب‌های منبع بومی OpenClaw را نیز اجرا می‌کند: زمان‌بندی بوت Gateway و حافظه در حالت‌های راه‌اندازی پیش‌فرض، hook، و ۵۰-Plugin؛ RSS وارد کردن Pluginهای همراه، حلقه‌های تکراری سلامِ mock-OpenAI `channel-chat-baseline`، فرمان‌های راه‌اندازی CLI در برابر Gateway بوت‌شده، و پروب کارایی smoke وضعیت SQLite. وقتی گزارش منبع mock-provider منتشرشده قبلی برای مرجع آزمایش‌شده در دسترس باشد، خلاصه منبع مقدارهای فعلی RSS و heap را با آن خط مبنا مقایسه می‌کند و افزایش‌های بزرگ RSS را به‌صورت `watch` علامت‌گذاری می‌کند. خلاصه Markdown پروب منبع در بسته گزارش، در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر مسیر آرتیفکت‌های GitHub را بارگذاری می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، گردش‌کار همچنین `report.json`، `report.md`، بسته‌ها، `index.md`، و آرتیفکت‌های پروب منبع را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` کامیت می‌کند. اشاره‌گر فعلی مرجع آزمایش‌شده به‌صورت `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` گردش‌کار چتریِ دستی برای «اجرای همه‌چیز پیش از انتشار» است. این گردش‌کار یک شاخه، برچسب، یا SHA کامل کامیت را می‌پذیرد، گردش‌کار دستی `CI` را با آن هدف اجرا می‌کند، `Plugin Prerelease` را برای اثبات فقط-انتشارِ Plugin/بسته/ایستا/Docker اجرا می‌کند، و `OpenClaw Release Checks` را برای smoke نصب، پذیرش بسته، بررسی‌های بسته میان‌سیستمی، رندر کارت امتیاز بلوغ از شواهد پروفایل QA، هم‌ارزی QA Lab، Matrix، و مسیرهای Telegram اجرا می‌کند. پروفایل‌های پایدار و کامل همیشه پوشش exhaustive live/E2E و soak مسیر انتشار Docker را شامل می‌شوند؛ پروفایل beta می‌تواند با `run_release_soak=true` وارد آن شود. E2E متعارف بسته Telegram درون Package Acceptance اجرا می‌شود، بنابراین یک نامزد کامل poller زنده تکراری راه‌اندازی نمی‌کند. پس از انتشار، `release_package_spec` را ارسال کنید تا بسته npm منتشرشده در release checks، Package Acceptance، Docker، cross-OS، و Telegram بدون ساخت مجدد دوباره استفاده شود. `npm_telegram_package_spec` را فقط برای اجرای مجدد متمرکز Telegram با بسته منتشرشده استفاده کنید. مسیر بسته زنده Plugin Codex به‌طور پیش‌فرض از همان حالت انتخاب‌شده استفاده می‌کند: `release_package_spec=openclaw@<tag>` منتشرشده، `codex_plugin_spec=npm:@openclaw/codex@<tag>` را مشتق می‌کند، درحالی‌که اجراهای SHA/آرتیفکت، `extensions/codex` را از مرجع انتخاب‌شده بسته‌بندی می‌کنند. برای منابع Plugin سفارشی مانند مشخصات `npm:`، `npm-pack:`، یا `git:`، `codex_plugin_spec` را صراحتاً تنظیم کنید.

برای ماتریس مرحله‌ها، نام دقیق jobهای گردش‌کار، تفاوت پروفایل‌ها، آرتیفکت‌ها، و دسته‌های اجرای مجدد متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` گردش‌کار انتشارِ تغییردهنده و دستی است. آن را پس از وجود داشتن برچسب انتشار و پس از موفق شدن پیش‌پرواز npm مربوط به OpenClaw، از `release/YYYY.M.PATCH` یا `main` اجرا کنید. این گردش‌کار `pnpm plugins:sync:check` را راستی‌آزمایی می‌کند، `Plugin NPM Release` را برای همه بسته‌های Plugin قابل انتشار اجرا می‌کند، `Plugin ClawHub Release` را برای همان SHA انتشار اجرا می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده اجرا می‌کند. انتشار پایدار همچنین به یک `windows_node_tag` دقیق نیاز دارد؛ گردش‌کار انتشار منبع Windows را راستی‌آزمایی می‌کند و نصب‌کننده‌های x64/ARM64 آن را پیش از هر فرزند انتشار با ورودی تأییدشده نامزد `windows_node_installer_digests` مقایسه می‌کند، سپس همان digestهای پین‌شده نصب‌کننده به‌همراه قرارداد دقیق آرتیفکت همراه و checksum را پیش از انتشار پیش‌نویس انتشار GitHub ارتقا و راستی‌آزمایی می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات کامیت پین‌شده روی یک شاخه سریع‌التغییر، به‌جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

مرجع‌های dispatch گردش‌کار GitHub باید شاخه یا برچسب باشند، نه SHA خام کامیت. این helper یک شاخه موقت `release-ci/<sha>-...` را در SHA هدف push می‌کند، `Full Release Validation` را از آن مرجع پین‌شده اجرا می‌کند، راستی‌آزمایی می‌کند که `headSha` هر گردش‌کار فرزند با هدف مطابقت دارد، و پس از تکمیل اجرا شاخه موقت را حذف می‌کند. راستی‌آزمای چتری همچنین اگر هر گردش‌کار فرزند در SHA متفاوتی اجرا شده باشد شکست می‌خورد.

`release_profile` گستره live/provider ارسال‌شده به بررسی‌های انتشار را کنترل می‌کند. گردش‌کارهای دستی انتشار به‌طور پیش‌فرض `stable` هستند؛ فقط زمانی از `full` استفاده کنید که عمداً ماتریس گسترده advisory provider/media را می‌خواهید. بررسی‌های انتشار پایدار و کامل همیشه soak کامل live/E2E و مسیر انتشار Docker را اجرا می‌کنند؛ پروفایل beta می‌تواند با `run_release_soak=true` وارد آن شود.

- `minimum` سریع‌ترین مسیرهای حیاتی انتشار OpenAI/core را نگه می‌دارد.
- `stable` مجموعه provider/backend پایدار را اضافه می‌کند.
- `full` ماتریس گسترده advisory provider/media را اجرا می‌کند.

چتر شناسه‌های اجرای فرزند dispatch‌شده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین job را برای هر اجرای فرزند اضافه می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط job راستی‌آزمای والد را دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای یک نامزد انتشار از `all`، فقط برای فرزند CI کامل عادی از `ci`، فقط برای فرزند prerelease مربوط به Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از گروهی محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای مجدد یک جعبه انتشار شکست‌خورده را پس از یک اصلاح متمرکز محدود نگه می‌دارد. برای یک مسیر cross-OS شکست‌خورده، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ فرمان‌های طولانی cross-OS خطوط Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade شامل زمان‌بندی هر فاز هستند. مسیرهای QA در release-check به‌جز gate استاندارد پوشش ابزار زمان اجرا advisory هستند؛ آن gate وقتی ابزارهای پویای لازم OpenClaw از خلاصه tier استاندارد منحرف شوند یا ناپدید شوند، مسدود می‌کند.

`OpenClaw Release Checks` از مرجع گردش‌کار مورد اعتماد استفاده می‌کند تا مرجع انتخاب‌شده را یک‌بار به tarball به نام `release-package-under-test` resolve کند، سپس آن آرتیفکت را به بررسی‌های cross-OS و Package Acceptance، به‌علاوه گردش‌کار Docker مسیر انتشار live/E2E هنگام اجرای پوشش soak، ارسال می‌کند. این کار بایت‌های بسته را در همه جعبه‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی مجدد همان نامزد در چند job فرزند جلوگیری می‌کند. برای مسیر زنده Plugin npm مربوط به Codex، بررسی‌های انتشار یا مشخصات Plugin منتشرشده مطابق و مشتق‌شده از `release_package_spec` را ارسال می‌کنند، یا `codex_plugin_spec` ارائه‌شده توسط اپراتور را ارسال می‌کنند، یا ورودی را خالی می‌گذارند تا اسکریپت Docker، Plugin Codex موجود در checkout انتخاب‌شده را بسته‌بندی کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all` جایگزین چتر قدیمی‌تر می‌شوند. پایشگر والد هر گردش‌کار فرزندی را که قبلاً dispatch کرده باشد هنگام لغو والد لغو می‌کند، بنابراین اعتبارسنجی جدیدتر main پشت یک اجرای release-check کهنه دوساعته نمی‌ماند. اعتبارسنجی شاخه/برچسب انتشار و گروه‌های اجرای مجدد متمرکز `cancel-in-progress: false` را نگه می‌دارند.

## شاردهای زنده و E2E

فرزند live/E2E انتشار پوشش گسترده بومی `pnpm test:live` را نگه می‌دارد، اما آن را به‌جای یک job ترتیبی، به‌صورت شاردهای نام‌گذاری‌شده از طریق `scripts/test-live-shard.mjs` اجرا می‌کند:

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
- شاردهای جداشده صوت/ویدئوی رسانه و شاردهای موسیقی فیلترشده بر اساس provider

این کار همان پوشش فایل را حفظ می‌کند و در عین حال اجرای مجدد و تشخیص خرابی‌های کند provider زنده را آسان‌تر می‌کند. نام‌های شارد تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` برای اجرای مجدد دستی یک‌باره همچنان معتبر می‌مانند.

شاردهای رسانه زنده بومی در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند که توسط گردش‌کار `Live Media Runner Image` ساخته شده است. این image، `ffmpeg` و `ffprobe` را از پیش نصب می‌کند؛ jobهای رسانه فقط پیش از setup باینری‌ها را راستی‌آزمایی می‌کنند. مجموعه‌های زنده مبتنی بر Docker را روی runnerهای عادی Blacksmith نگه دارید؛ jobهای container جای نادرستی برای راه‌اندازی آزمون‌های Docker تو‌در‌تو هستند.

شاردهای مدل/بک‌اند زنده مبتنی بر Docker برای هر کامیت انتخاب‌شده از یک تصویر مشترک جداگانه‌ی `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. گردش‌کار انتشار زنده آن تصویر را یک‌بار می‌سازد و push می‌کند، سپس شاردهای مدل زنده Docker، Gateway شاردشده بر اساس provider، بک‌اند CLI، اتصال ACP، و هارنس Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. شاردهای Docker مربوط به Gateway سقف‌های `timeout` صریح در سطح اسکریپت دارند که پایین‌تر از timeout کار گردش‌کار است، تا یک کانتینر گیرکرده یا مسیر پاک‌سازی به‌جای مصرف کل بودجه بررسی انتشار، سریع شکست بخورد. اگر آن شاردها هدف کامل Docker منبع را به‌صورت مستقل دوباره بسازند، اجرای انتشار نادرست پیکربندی شده و زمان دیواری را برای ساخت‌های تکراری تصویر هدر می‌دهد.

## پذیرش بسته

از `Package Acceptance` زمانی استفاده کنید که پرسش این است: «آیا این بسته قابل نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» این با CI عادی متفاوت است: CI عادی درخت منبع را اعتبارسنجی می‌کند، در حالی که پذیرش بسته یک tarball واحد را از طریق همان هارنس Docker E2E اعتبارسنجی می‌کند که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند.

### کارها

1. `resolve_package`، `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` بارگذاری می‌کند، و منبع، workflow ref، package ref، نسخه، SHA-256 و پروفایل را در خلاصه مرحله GitHub چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار قابل استفاده مجدد آن artifact را دانلود می‌کند، inventory مربوط به tarball را اعتبارسنجی می‌کند، در صورت نیاز تصویرهای Docker مبتنی بر digest بسته را آماده می‌کند، و مسیرهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout گردش‌کار، علیه همان بسته اجرا می‌کند. وقتی یک پروفایل چند `docker_lanes` هدفمند را انتخاب می‌کند، گردش‌کار قابل استفاده مجدد بسته و تصویرهای مشترک را یک‌بار آماده می‌کند، سپس آن مسیرها را به‌صورت کارهای Docker هدفمند موازی با artifactهای یکتا fan out می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و همان artifact با نام `package-under-test` را نصب می‌کند، اگر پذیرش بسته یکی را resolve کرده باشد؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده npm را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker، یا مسیر اختیاری Telegram شکست خورده باشد، گردش‌کار را شکست می‌دهد.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest`، یا یک نسخه دقیق انتشار OpenClaw مثل `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این برای پذیرش prerelease/stable منتشرشده استفاده کنید.
- `source=ref` یک شاخه، تگ، یا SHA کامل کامیت مورد اعتماد `package_ref` را بسته‌بندی می‌کند. resolver شاخه‌ها/تگ‌های OpenClaw را fetch می‌کند، بررسی می‌کند که کامیت انتخاب‌شده از تاریخچه شاخه repository یا یک تگ انتشار قابل دسترسی باشد، وابستگی‌ها را در یک worktree جداشده نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` عمومی HTTPS را دانلود می‌کند؛ `package_sha256` الزامی است. این مسیر credentialهای URL، پورت‌های HTTPS غیرپیش‌فرض، hostnameها یا IPهای resolve‌شده خصوصی/داخلی/با کاربرد ویژه، و redirectهای خارج از همان سیاست ایمنی عمومی را رد می‌کند.
- `source=trusted-url` یک `.tgz` HTTPS را از یک سیاست named trusted-source در `.github/package-trusted-sources.json` دانلود می‌کند؛ `package_sha256` و `trusted_source_id` الزامی هستند. فقط برای mirrorهای سازمانی تحت مالکیت maintainer یا repositoryهای بسته خصوصی که به hostها، پورت‌ها، پیشوندهای path، hostهای redirect، یا resolution شبکه خصوصی پیکربندی‌شده نیاز دارند از این استفاده کنید. اگر سیاست bearer auth را اعلام کند، گردش‌کار از secret ثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN` استفاده می‌کند؛ credentialهای جاسازی‌شده در URL همچنان رد می‌شوند.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای artifactهایی که بیرون از سیستم به اشتراک گذاشته می‌شوند باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد مورد اعتماد گردش‌کار/هارنس است که تست را اجرا می‌کند. `package_ref` کامیت منبعی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این اجازه می‌دهد هارنس تست فعلی، کامیت‌های منبع قدیمی‌تر و مورد اعتماد را بدون اجرای منطق گردش‌کار قدیمی اعتبارسنجی کند.

### پروفایل‌های مجموعه تست

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — تکه‌های کامل مسیر انتشار Docker همراه با OpenWebUI
- `custom` — `docker_lanes` دقیق؛ وقتی `suite_profile=custom` باشد الزامی است

پروفایل `package` از پوشش Plugin آفلاین استفاده می‌کند تا اعتبارسنجی بسته منتشرشده به در دسترس بودن زنده ClawHub وابسته نباشد. مسیر اختیاری Telegram، artifact با نام `package-under-test` را در `NPM Telegram Beta E2E` دوباره استفاده می‌کند، و مسیر spec منتشرشده npm برای dispatchهای مستقل نگه داشته می‌شود.

برای سیاست اختصاصی تست به‌روزرسانی و Plugin، شامل فرمان‌های محلی،
مسیرهای Docker، ورودی‌های پذیرش بسته، پیش‌فرض‌های انتشار، و تریاژ شکست،
[تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

بررسی‌های انتشار، پذیرش بسته را با `source=artifact`، artifact بسته انتشار آماده‌شده، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`، و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار مهاجرت بسته، به‌روزرسانی، نصب زنده skill از ClawHub، پاک‌سازی وابستگی stale-plugin، تعمیر نصب Plugin پیکربندی‌شده، Plugin آفلاین، به‌روزرسانی Plugin، و اثبات Telegram را روی همان tarball بسته resolve‌شده نگه می‌دارد. پس از انتشار یک بتا، `release_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید تا همان matrix را بدون ساخت دوباره، علیه بسته npm ارسال‌شده اجرا کند؛ `package_acceptance_package_spec` را فقط وقتی تنظیم کنید که پذیرش بسته به بسته‌ای متفاوت از باقی اعتبارسنجی انتشار نیاز دارد. بررسی‌های انتشار cross-OS همچنان onboarding، installer، و رفتارهای platform-specific سیستم‌عامل را پوشش می‌دهند؛ اعتبارسنجی محصول بسته/به‌روزرسانی باید با پذیرش بسته شروع شود. مسیر Docker با نام `published-upgrade-survivor` در مسیر مسدودکننده انتشار، در هر اجرا یک baseline بسته منتشرشده را اعتبارسنجی می‌کند. در پذیرش بسته، tarball resolve‌شده `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline`، baseline منتشرشده fallback را انتخاب می‌کند که پیش‌فرض آن `openclaw@latest` است؛ فرمان‌های rerun مسیر شکست‌خورده آن baseline را حفظ می‌کنند. Full Release Validation با `run_release_soak=true` یا `release_profile=full`، `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا روی چهار انتشار پایدار آخر npm به‌علاوه انتشارهای مرزی pinned برای سازگاری Plugin و fixtureهای issue-shaped برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده OpenClaw، مسیرهای لاگ tilde، و ریشه‌های وابستگی Plugin legacy stale گسترش یابد. انتخاب‌های multi-baseline published-upgrade survivor بر اساس baseline به کارهای runner هدفمند Docker جداگانه sharded می‌شوند. گردش‌کار جداگانه `Update Migration` از مسیر Docker با نام `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند، وقتی پرسش پاک‌سازی جامع به‌روزرسانی منتشرشده باشد، نه گستره عادی CI کامل انتشار. اجراهای تجمیعی محلی می‌توانند specهای دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` پاس دهند، یک مسیر واحد را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15` نگه دارند، یا `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را برای matrix سناریو تنظیم کنند. مسیر منتشرشده baseline را با یک دستور آماده `openclaw config set` پیکربندی می‌کند، گام‌های recipe را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz` و status مربوط به RPC را probe می‌کند. مسیرهای fresh بسته‌بندی‌شده و installer در Windows همچنین بررسی می‌کنند که یک بسته نصب‌شده بتواند override کنترل مرورگر را از یک مسیر خام absolute Windows import کند. smoke مربوط به agent-turn در OpenAI cross-OS وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد به آن مقدار پیش‌فرض می‌شود، وگرنه `openai/gpt-5.5`، تا اثبات نصب و Gateway روی یک مدل تست GPT-5 بماند و از پیش‌فرض‌های GPT-4.x پرهیز شود.

### پنجره‌های سازگاری legacy

پذیرش بسته برای بسته‌های از پیش منتشرشده پنجره‌های سازگاری legacy محدود دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، ممکن است از مسیر سازگاری استفاده کنند:

- entryهای QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌های حذف‌شده از tarball اشاره کنند؛
- `doctor-switch` ممکن است subcase مربوط به persistence در `gateway install --wrapper` را وقتی بسته آن flag را expose نمی‌کند رد کند؛
- `update-channel-switch` ممکن است `patchedDependencies` مفقود pnpm را از fixture جعلی git مشتق‌شده از tarball prune کند و ممکن است `update.channel` persistشده مفقود را log کند؛
- smokeهای Plugin ممکن است مکان‌های legacy install-record را بخوانند یا نبود persistence مربوط به marketplace install-record را بپذیرند؛
- `plugin-update` ممکن است مهاجرت metadata پیکربندی را اجازه دهد، در حالی که همچنان الزام می‌کند install record و رفتار no-reinstall بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` همچنین ممکن است برای فایل‌های stamp metadata ساخت محلی که قبلا ارسال شده بودند هشدار دهد. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای هشدار یا skip، شکست می‌خورند.

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

هنگام اشکال‌زدایی اجرای ناموفق پذیرش بسته، از خلاصه `resolve_package` شروع کنید تا منبع بسته، نسخه، و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و artifactهای Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، لاگ‌های مسیر، زمان‌بندی فازها، و فرمان‌های rerun. اجرای دوباره پروفایل بسته شکست‌خورده یا مسیرهای دقیق Docker را به اجرای دوباره اعتبارسنجی کامل انتشار ترجیح دهید.

## smoke نصب

گردش‌کار جداگانه `Install Smoke` همان اسکریپت scope را از طریق کار `preflight` خودش دوباره استفاده می‌کند. این گردش‌کار پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای درخواست‌های کششی اجرا می‌شود که سطوح Docker/package، تغییرات package/manifest مربوط به Plugin‌های بسته‌بندی‌شده، یا سطوح Plugin SDK اصلی/plugin/channel/gateway را که کارهای smoke مربوط به Docker اجرا می‌کنند، لمس می‌کنند. تغییرات فقط در سورس Plugin‌های بسته‌بندی‌شده، ویرایش‌های فقط آزمون، و ویرایش‌های فقط مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع تصویر Dockerfile ریشه را یک‌بار می‌سازد، CLI را بررسی می‌کند، smoke مربوط به CLI حذف agents در shared-workspace را اجرا می‌کند، e2e مربوط به container gateway-network را اجرا می‌کند، یک آرگومان build برای extension بسته‌بندی‌شده را تأیید می‌کند، و profile محدود Docker برای Plugin بسته‌بندی‌شده را زیر مهلت زمانی تجمیعی ۲۴۰ ثانیه‌ای فرمان اجرا می‌کند (اجرای Docker هر سناریو جداگانه محدود می‌شود).
- **مسیر کامل** پوشش نصب package مربوط به QR و نصب‌کننده Docker/update را برای اجراهای زمان‌بندی‌شده شبانه، dispatchهای دستی، بررسی‌های انتشار workflow-call، و درخواست‌های کششی که واقعاً سطوح installer/package/Docker را لمس می‌کنند نگه می‌دارد. در حالت کامل، install-smoke یک تصویر smoke هدف-SHA مربوط به GHCR root Dockerfile را آماده یا بازاستفاده می‌کند، سپس نصب package مربوط به QR، smokeهای root Dockerfile/gateway، smokeهای installer/update، و Docker E2E سریع مربوط به Plugin بسته‌بندی‌شده را به‌صورت jobهای جداگانه اجرا می‌کند تا کار نصب‌کننده پشت smokeهای تصویر ریشه منتظر نماند.

pushهای `main` (از جمله commitهای merge) مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق changed-scope در یک push پوشش کامل را درخواست کند، workflow smoke سریع Docker را نگه می‌دارد و smoke نصب کامل را به اعتبارسنجی شبانه یا انتشار واگذار می‌کند.

smoke کند image-provider مربوط به نصب سراسری Bun جداگانه با `run_bun_global_install_smoke` کنترل می‌شود. این مورد در زمان‌بندی شبانه و از workflow بررسی‌های انتشار اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما درخواست‌های کششی و pushهای `main` آن را اجرا نمی‌کنند. CI معمول PR همچنان lane رگرسیون سریع launcher مربوط به Bun را برای تغییرات مرتبط با Node اجرا می‌کند. آزمون‌های Docker مربوط به QR و installer، Dockerfileهای متمرکز بر نصب خودشان را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک تصویر live-test مشترک را از قبل می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball مربوط به npm بسته‌بندی می‌کند، و دو تصویر مشترک `scripts/e2e/Dockerfile` را می‌سازد:

- یک runner خام Node/Git برای laneهای installer/update/plugin-dependency؛
- یک تصویر عملکردی که همان tarball را برای laneهای عملکرد عادی در `/app` نصب می‌کند.

تعریف‌های lane مربوط به Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler تصویر را برای هر lane با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیمات قابل تغییر

| متغیر                                 | پیش‌فرض | هدف                                                                                              |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای main-pool برای laneهای عادی.                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | سقف laneهای نصب npm هم‌زمان.                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای چندسرویسی هم‌زمان.                                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله بین شروع laneها برای جلوگیری از طوفان create در daemon Docker؛ برای بدون فاصله `0` بگذارید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلت fallback برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` plan مربوط به scheduler را بدون اجرای laneها چاپ می‌کند.                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق laneها با جداکننده ویرگول؛ smoke پاک‌سازی را رد می‌کند تا agents بتوانند یک lane ناموفق را بازتولید کنند. |

laneای که از سقف مؤثرش سنگین‌تر است همچنان می‌تواند از یک pool خالی شروع شود، سپس تا زمانی که ظرفیت را آزاد کند تنها اجرا می‌شود. پیش‌بررسی تجمیعی محلی Docker را بررسی می‌کند، containerهای کهنه OpenClaw E2E را حذف می‌کند، وضعیت laneهای فعال را منتشر می‌کند، زمان‌بندی laneها را برای ترتیب longest-first ماندگار می‌کند، و به‌طور پیش‌فرض پس از اولین شکست زمان‌بندی laneهای pooled جدید را متوقف می‌کند.

### workflow قابل‌بازاستفاده live/E2E

workflow قابل‌بازاستفاده live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد که چه package، نوع تصویر، تصویر live، lane، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و خلاصه‌های GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا artifact مربوط به package از run جاری را دانلود می‌کند، یا artifact مربوط به package را از `package_artifact_run_id` دانلود می‌کند؛ موجودی tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای package-installed نیاز دارد، تصاویر bare/functional مربوط به GHCR Docker E2E با tag مبتنی بر digest package را از طریق cache لایه Docker متعلق به Blacksmith می‌سازد و push می‌کند؛ و به‌جای بازسازی، ورودی‌های ارائه‌شده `docker_e2e_bare_image`/`docker_e2e_functional_image` یا تصاویر موجود مبتنی بر package-digest را بازاستفاده می‌کند. pullهای تصویر Docker با مهلت محدود ۱۸۰ ثانیه‌ای برای هر تلاش دوباره انجام می‌شوند تا stream گیرکرده registry/cache سریع دوباره تلاش شود، نه اینکه بیشتر مسیر بحرانی CI را مصرف کند.

### chunkهای مسیر انتشار

پوشش Docker انتشار jobهای chunkشده کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع تصویری را که لازم دارد pull کند و چند lane را از طریق همان scheduler وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunkهای فعلی Docker انتشار عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `package-update-openai` شامل lane package live مربوط به Plugin Codex است، که package نامزد OpenClaw را نصب می‌کند، Plugin Codex را از `codex_plugin_spec` یا یک tarball هم‌ref با تأیید صریح نصب Codex CLI نصب می‌کند، پیش‌بررسی Codex CLI را اجرا می‌کند، سپس چند turn مربوط به agent هم‌session OpenClaw را در برابر OpenAI اجرا می‌کند. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` به‌عنوان aliasهای تجمیعی plugin/runtime باقی می‌مانند. alias lane مربوط به `install-e2e` به‌عنوان alias تجمیعی rerun دستی برای هر دو lane نصب‌کننده provider باقی می‌ماند.

OpenWebUI وقتی پوشش کامل release-path آن را درخواست کند در `plugins-runtime-services` ادغام می‌شود، و chunk مستقل `openwebui` را فقط برای dispatchهای فقط OpenWebUI نگه می‌دارد. laneهای به‌روزرسانی bundled-channel برای شکست‌های گذرای شبکه npm یک‌بار دوباره تلاش می‌کنند.

هر chunk، `.artifacts/docker-tests/` را همراه با logهای lane، زمان‌بندی‌ها، `summary.json`، `failures.json`، زمان‌بندی‌های phase، JSON مربوط به plan scheduler، جدول‌های slow-lane، و فرمان‌های rerun برای هر lane آپلود می‌کند. ورودی `docker_lanes` در workflow، laneهای انتخاب‌شده را به‌جای jobهای chunk در برابر تصاویر آماده اجرا می‌کند؛ این کار debugging مربوط به lane ناموفق را به یک job هدفمند Docker محدود نگه می‌دارد و artifact مربوط به package را برای آن run آماده، دانلود، یا بازاستفاده می‌کند؛ اگر یک lane انتخاب‌شده یک lane live Docker باشد، job هدفمند تصویر live-test را برای آن rerun به‌صورت محلی می‌سازد. فرمان‌های rerun تولیدشده GitHub برای هر lane وقتی این مقادیر وجود داشته باشند شامل `package_artifact_run_id`، `package_artifact_name`، و ورودی‌های تصویر آماده هستند، تا lane ناموفق بتواند همان package و تصاویر دقیق run ناموفق را بازاستفاده کند.

```bash
pnpm test:docker:rerun <run-id>      # artifactهای Docker را دانلود می‌کند و فرمان‌های rerun هدفمند ترکیبی/برای هر lane را چاپ می‌کند
pnpm test:docker:timings <summary>   # خلاصه‌های slow-lane و phase critical-path
```

workflow زمان‌بندی‌شده live/E2E مجموعه کامل Docker مربوط به release-path را روزانه اجرا می‌کند.

## پیش‌انتشار Plugin

`Plugin Prerelease` پوشش محصول/package پرهزینه‌تری است، بنابراین workflow جداگانه‌ای است که توسط `Full Release Validation` یا توسط یک operator صریح dispatch می‌شود. درخواست‌های کششی عادی، pushهای `main`، و dispatchهای دستی مستقل CI آن مجموعه را خاموش نگه می‌دارند. این workflow آزمون‌های Plugin بسته‌بندی‌شده را بین هشت worker مربوط به extension متوازن می‌کند؛ آن jobهای shard مربوط به extension، تا دو گروه پیکربندی Plugin را هم‌زمان با یک worker Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا دسته‌های Plugin سنگین از نظر import، jobهای CI اضافی ایجاد نکنند. مسیر Docker prerelease فقط انتشار، laneهای هدفمند Docker را در گروه‌های کوچک batch می‌کند تا برای jobهای یک تا سه دقیقه‌ای ده‌ها runner رزرو نشود. این workflow همچنین یک artifact اطلاع‌رسانی `plugin-inspector-advisory` را از `@openclaw/plugin-inspector` آپلود می‌کند؛ یافته‌های inspector ورودی triage هستند و gate مسدودکننده Plugin Prerelease را تغییر نمی‌دهند.

## QA Lab

QA Lab laneهای اختصاصی CI خارج از workflow اصلی smart-scoped دارد. برابری agentic زیر harnessهای گسترده QA و انتشار قرار دارد، نه یک workflow مستقل PR. وقتی برابری باید همراه یک run اعتبارسنجی گسترده اجرا شود، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- workflow مربوط به `QA-Lab - All Lanes` هر شب روی `main` و در dispatch دستی اجرا می‌شود؛ این workflow lane برابری mock، lane live Matrix، و laneهای live Telegram و Discord را به‌عنوان jobهای موازی fan out می‌کند. jobهای live از محیط `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

بررسی‌های انتشار، laneهای transport live مربوط به Matrix و Telegram را با provider mock قطعی و مدل‌های واجد شرایط mock (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا قرارداد channel از latency مدل live و راه‌اندازی عادی provider-plugin جدا شود. Gateway مربوط به transport live جست‌وجوی memory را غیرفعال می‌کند، زیرا QA parity رفتار memory را جداگانه پوشش می‌دهد؛ اتصال provider توسط مجموعه‌های جداگانه مدل live، provider بومی، و provider Docker پوشش داده می‌شود.

Matrix برای gateهای زمان‌بندی‌شده و انتشار از `--profile fast` استفاده می‌کند، و فقط وقتی CLI checkoutشده از آن پشتیبانی کند `--fail-fast` را اضافه می‌کند. پیش‌فرض CLI و ورودی workflow دستی همچنان `all` است؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای release-critical مربوط به QA Lab را پیش از تأیید انتشار اجرا می‌کند؛ gate مربوط به QA parity، packهای نامزد و baseline را به‌عنوان jobهای lane موازی اجرا می‌کند، سپس هر دو artifact را در یک job گزارش کوچک برای مقایسه نهایی برابری دانلود می‌کند.

برای PRهای عادی، به‌جای اینکه parity را یک وضعیت الزامی بدانید، از شواهد CI/check دامنه‌بندی‌شده پیروی کنید.

## CodeQL

workflow مربوط به `CodeQL` عمداً یک اسکنر امنیتی narrow first-pass است، نه sweep کامل repository. runهای روزانه، دستی، و guard مربوط به درخواست کششی غیر draft، کد workflowهای Actions به‌علاوه پرخطرترین سطوح JavaScript/TypeScript را با queryهای امنیتی high-confidence فیلترشده به `security-severity` بالا/بحرانی اسکن می‌کنند.

guard مربوط به درخواست کششی سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، `scripts`، `src`، یا مسیرهای runtime مربوط به Plugin بسته‌بندی‌شده که مالک process هستند شروع می‌شود، و همان matrix امنیتی high-confidence مثل workflow زمان‌بندی‌شده را اجرا می‌کند. CodeQL مربوط به Android و macOS خارج از پیش‌فرض‌های PR می‌ماند.

### دسته‌های امنیتی

| دسته                                             | سطح                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | خط مبنای احراز هویت، اسرار، سندباکس، Cron، و Gateway                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌همراه زمان اجرای Plugin کانال، Gateway، Plugin SDK، اسرار، و نقاط تماس ممیزی                  |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح سیاست SSRF در هسته، تحلیل IP، محافظ شبکه، واکشی وب، و Plugin SDK                                                              |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، ابزارهای کمکی اجرای فرایند، تحویل خروجی، و دروازه‌های اجرای ابزار عامل                                               |
| `/codeql-security-high/process-exec-boundary`     | شل محلی، ابزارهای کمکی ایجاد فرایند، زمان‌های اجرای Pluginهای بسته‌بندی‌شده مالک زیرفرایند، و چسب اسکریپت گردش‌کار              |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد نصب Plugin، بارگذار، مانیفست، رجیستری، نصب مدیر بسته، بارگذاری منبع، و قرارداد بسته Plugin SDK                       |

### شاردهای امنیتی مخصوص پلتفرم

- `CodeQL Android Critical Security` — شارد زمان‌بندی‌شده امنیت Android. برنامه Android را برای CodeQL به‌صورت دستی روی کوچک‌ترین رانر Blacksmith Linux که توسط اعتبارسنجی گردش‌کار پذیرفته می‌شود می‌سازد. زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — شارد امنیت macOS هفتگی/دستی. برنامه macOS را برای CodeQL روی Blacksmith macOS به‌صورت دستی می‌سازد، نتایج ساخت وابستگی را از SARIF بارگذاری‌شده فیلتر می‌کند، و زیر `/codeql-critical-security/macos` بارگذاری می‌کند. خارج از پیش‌فرض‌های روزانه نگه داشته شده است، چون ساخت macOS حتی وقتی پاک باشد بر زمان اجرا غالب است.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` شارد غیرامنیتی متناظر است. این شارد فقط کوئری‌های کیفیت JavaScript/TypeScript با شدت خطا و غیرامنیتی را روی سطوح محدود و پرارزش در رانرهای Linux میزبانی‌شده در GitHub اجرا می‌کند تا اسکن‌های کیفیت بودجه ثبت رانر Blacksmith را مصرف نکنند. محافظ pull request آن عمدا کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیردرفت فقط شاردهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract`، و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای دستور/مدل/ابزار عامل و ارسال پاسخ، کد طرح‌واره/مهاجرت/IO پیکربندی، کد احراز هویت/اسرار/سندباکس/امنیت، زمان اجرای کانال هسته و Plugin کانال بسته‌بندی‌شده، پروتکل Gateway/متد سرور، چسب زمان اجرای حافظه/SDK، MCP/فرایند/تحویل خروجی، کاتالوگ زمان اجرای ارائه‌دهنده/مدل، صف‌های تشخیص/تحویل نشست، بارگذار Plugin، قرارداد بسته/Plugin SDK، یا زمان اجرای پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت هر دوازده شارد کیفیت PR را اجرا می‌کنند.

ارسال دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های محدود قلاب‌های آموزش/تکرار برای اجرای یک شارد کیفیت به‌صورت جداگانه هستند.

| دسته                                                   | سطح                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، اسرار، سندباکس، Cron، و Gateway                                                                                                        |
| `/codeql-critical-quality/config-boundary`              | طرح‌واره پیکربندی، مهاجرت، نرمال‌سازی، و قراردادهای IO                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | طرح‌واره‌های پروتکل Gateway و قراردادهای متد سرور                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال بسته‌بندی‌شده                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | قراردادهای زمان اجرای اجرای دستور، ارسال مدل/ارائه‌دهنده، ارسال و صف‌های پاسخ خودکار، و صفحه کنترل ACP                                                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، ابزارهای کمکی نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                             |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، نماهای زمان اجرای حافظه، نام‌های مستعار Plugin SDK حافظه، چسب فعال‌سازی زمان اجرای حافظه، و دستورهای doctor حافظه                            |
| `/codeql-critical-quality/session-diagnostics-boundary` | جزئیات داخلی صف پاسخ، صف‌های تحویل نشست، ابزارهای کمکی اتصال/تحویل نشست خروجی، سطوح بسته رویداد/گزارش تشخیصی، و قراردادهای CLI مربوط به doctor نشست          |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | ارسال پاسخ ورودی Plugin SDK، ابزارهای کمکی payload/تکه‌بندی/زمان اجرای پاسخ، گزینه‌های پاسخ کانال، صف‌های تحویل، و ابزارهای کمکی اتصال نشست/رشته              |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و کشف ارائه‌دهنده، ثبت زمان اجرای ارائه‌دهنده، پیش‌فرض‌ها/کاتالوگ‌های ارائه‌دهنده، و رجیستری‌های وب/جست‌وجو/واکشی/embedding |
| `/codeql-critical-quality/ui-control-plane`             | بوت‌استرپ Control UI، ماندگاری محلی، جریان‌های کنترل Gateway، و قراردادهای زمان اجرای صفحه کنترل وظیفه                                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | واکشی/جست‌وجوی وب هسته، IO رسانه، درک رسانه، تولید تصویر، و قراردادهای زمان اجرای تولید رسانه                                                                  |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای بارگذار، رجیستری، سطح عمومی، و نقطه ورود Plugin SDK                                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع منتشرشده Plugin SDK در سمت بسته و ابزارهای کمکی قرارداد بسته Plugin                                                                                        |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند بدون مبهم‌کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال، یا گسترش داده شوند. گسترش CodeQL برای Swift، Python، و Pluginهای بسته‌بندی‌شده باید فقط پس از پایدار شدن زمان اجرا و سیگنال پروفایل‌های محدود، به‌عنوان کار پیگیری محدوده‌دار یا شاردشده دوباره اضافه شود.

## گردش‌کارهای نگهداری

### عامل مستندات

گردش‌کار `Docs Agent` یک مسیر نگهداری Codex رویدادمحور برای هم‌راستا نگه‌داشتن مستندات موجود با تغییرات اخیرا ادغام‌شده است. زمان‌بندی خالص ندارد: اجرای موفق CI برای push غیربات روی `main` می‌تواند آن را تحریک کند، و ارسال دستی می‌تواند آن را مستقیما اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلوتر رفته باشد یا وقتی اجرای غیراسکیپ‌شده دیگری از Docs Agent در یک ساعت گذشته ایجاد شده باشد، اسکیپ می‌شوند. وقتی اجرا می‌شود، بازه commit را از SHA منبع قبلی Docs Agent که اسکیپ نشده تا `main` فعلی بررسی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### عامل عملکرد تست

گردش‌کار `Test Performance Agent` یک مسیر نگهداری Codex رویدادمحور برای تست‌های کند است. زمان‌بندی خالص ندارد: اجرای موفق CI برای push غیربات روی `main` می‌تواند آن را تحریک کند، اما اگر فراخوانی workflow-run دیگری همان روز UTC قبلا اجرا شده باشد یا در حال اجرا باشد، اسکیپ می‌شود. ارسال دستی این دروازه فعالیت روزانه را دور می‌زند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای کل مجموعه می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک عملکرد تست را که پوشش را حفظ می‌کنند انجام دهد، نه بازآرایی‌های گسترده، سپس گزارش کل مجموعه را دوباره اجرا می‌کند و تغییراتی را که شمار تست‌های پاس‌شده خط مبنا را کاهش دهند رد می‌کند. گزارش گروه‌بندی‌شده زمان دیواری و حداکثر RSS را برای هر پیکربندی روی Linux و macOS ثبت می‌کند، بنابراین مقایسه قبل/بعد دلتاهای حافظه تست را کنار دلتاهای مدت‌زمان نشان می‌دهد. اگر خط مبنا تست‌های ناموفق داشته باشد، Codex فقط می‌تواند شکست‌های بدیهی را اصلاح کند و گزارش کل مجموعه پس از عامل باید پیش از commit شدن هر چیزی پاس شود. وقتی `main` پیش از رسیدن push بات جلو می‌رود، این مسیر وصله اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند، و push را دوباره تلاش می‌کند؛ وصله‌های قدیمی دارای تعارض اسکیپ می‌شوند. از Ubuntu میزبانی‌شده در GitHub استفاده می‌کند تا اکشن Codex بتواند همان وضعیت ایمنی drop-sudo عامل مستندات را حفظ کند.

### PRهای تکراری پس از Merge

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی نگهدارنده برای پاک‌سازی موارد تکراری پس از land شدن است. به‌صورت پیش‌فرض dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتا فهرست‌شده را می‌بندد. پیش از تغییر GitHub، بررسی می‌کند که PR landشده merge شده باشد و هر مورد تکراری یا issue ارجاع‌شده مشترک داشته باشد یا hunkهای تغییریافته هم‌پوشان داشته باشد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## دروازه‌های بررسی محلی و مسیریابی تغییرات

منطق مسیر تغییر محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. این دروازه بررسی محلی نسبت به دامنه گسترده پلتفرم CI درباره مرزهای معماری سخت‌گیرتر است:

- تغییرات تولیدی هسته، typecheck تولید هسته و تست هسته به‌همراه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط-تست هسته فقط typecheck تست هسته به‌همراه lint هسته را اجرا می‌کنند؛
- تغییرات تولیدی extension، typecheck تولید extension و تست extension به‌همراه lint extension را اجرا می‌کنند؛
- تغییرات فقط-تست extension، typecheck تست extension به‌همراه lint extension را اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا قرارداد Plugin به typecheck extension گسترش می‌یابند، چون extensionها به آن قراردادهای هسته وابسته‌اند (جاروب‌های Vitest extension همچنان کار تست صریح باقی می‌مانند)؛
- افزایش نسخه فقط-فراداده انتشار، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی ریشه را اجرا می‌کند؛
- تغییرات ناشناخته ریشه/پیکربندی برای ایمنی به همه مسیرهای بررسی fail می‌شوند.

مسیریابی تست تغییر محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمدا ارزان‌تر از `check:changed` است: ویرایش مستقیم تست‌ها خودشان را اجرا می‌کنند، ویرایش‌های منبع ابتدا نگاشت‌های صریح را ترجیح می‌دهند، سپس تست‌های هم‌خانواده و وابسته‌های گراف import را. پیکربندی تحویل گروهی مشترک یکی از نگاشت‌های صریح است: تغییرات در پیکربندی پاسخ قابل‌مشاهده گروه، حالت تحویل پاسخ منبع، یا prompt سیستمی ابزار پیام، از تست‌های پاسخ هسته به‌همراه رگرسیون‌های تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از اولین push PR شکست بخورد. فقط وقتی تغییر به‌اندازه کافی در سطح harness گسترده است که مجموعه نگاشت‌شده ارزان نماینده قابل‌اعتماد نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Crabbox پوشش remote-box متعلق به مخزن برای اثبات Linux نگه‌دارنده است. وقتی یک بررسی برای چرخه ویرایش محلی بیش از حد گسترده است، وقتی هم‌ترازی با CI اهمیت دارد، یا وقتی اثبات به secrets، Docker، مسیرهای بسته، جعبه‌های قابل‌استفاده‌مجدد، یا لاگ‌های راه‌دور نیاز دارد، آن را از ریشه مخزن استفاده کنید. backend عادی OpenClaw برابر با
`blacksmith-testbox` است؛ ظرفیت AWS/Hetzner تحت مالکیت، fallback برای قطعی‌های Blacksmith، مشکلات سهمیه، یا آزمون صریح ظرفیت تحت مالکیت است.

اجراهای Blacksmith پشتیبانی‌شده با Crabbox، Testboxهای یک‌بارمصرف را warm، claim، sync، run، report و clean up می‌کنند. بررسی سلامت sync داخلی وقتی فایل‌های لازم ریشه مانند `pnpm-lock.yaml` ناپدید شوند یا وقتی `git status --short` دست‌کم ۲۰۰ حذف ردیابی‌شده را نشان دهد، سریع شکست می‌خورد. برای PRهای عمدی با حذف‌های بزرگ، برای فرمان راه‌دور `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

Crabbox همچنین اجرای محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از sync در مرحله sync بماند، خاتمه می‌دهد. برای غیرفعال کردن این محافظ، `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ، مقدار بزرگ‌تری بر حسب میلی‌ثانیه به‌کار ببرید.

پیش از نخستین اجرا، wrapper را از ریشه مخزن بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper مخزن یک باینری کهنه Crabbox را که `blacksmith-testbox` را advertise نمی‌کند رد می‌کند. provider را صریح پاس بدهید، حتی اگر `.crabbox.yaml` پیش‌فرض‌های owned-cloud دارد. در worktreeهای Codex یا checkoutهای linked/sparse، از اسکریپت محلی `pnpm crabbox:run` پرهیز کنید چون pnpm ممکن است پیش از شروع Crabbox وابستگی‌ها را reconcile کند؛ به‌جایش wrapper نود را مستقیم فراخوانی کنید:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

اجراهای پشتیبانی‌شده با Blacksmith به Crabbox 0.22.0 یا جدیدتر نیاز دارند تا wrapper رفتار فعلی sync، queue و cleanup در Testbox را دریافت کند. هنگام استفاده از checkout هم‌سطح، پیش از کار زمان‌سنجی یا اثبات، باینری محلی نادیده‌گرفته‌شده را دوباره بسازید:

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

خلاصه نهایی JSON را بخوانید. فیلدهای مفید `provider`، `leaseId`،
`syncDelegated`، `exitCode`، `commandMs` و `totalMs` هستند. برای اجراهای Blacksmith Testbox واگذارشده، کد خروج wrapper Crabbox و خلاصه JSON نتیجه فرمان هستند. اجرای لینک‌شده GitHub Actions مالک hydration و keepalive است؛ اگر Testbox پس از بازگشت فرمان SSH از بیرون متوقف شود، ممکن است با وضعیت `cancelled` تمام شود. مگر اینکه `exitCode` در wrapper غیرصفر باشد یا خروجی فرمان آزمون شکست‌خورده‌ای نشان دهد، آن را artifact مربوط به cleanup/status بدانید. اجراهای یک‌بارمصرف Crabbox با پشتوانه Blacksmith باید Testbox را خودکار متوقف کنند؛ اگر اجرا قطع شد یا cleanup نامشخص بود، boxهای زنده را بررسی کنید و فقط boxهایی را که خودتان ساخته‌اید متوقف کنید:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

فقط وقتی از reuse استفاده کنید که عمدا به چند فرمان روی همان box هیدراته‌شده نیاز دارید:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

اگر لایه خراب Crabbox است اما خود Blacksmith کار می‌کند، از Blacksmith مستقیم فقط برای عیب‌یابی‌هایی مانند `list`، `status` و cleanup استفاده کنید. پیش از اینکه یک اجرای مستقیم Blacksmith را اثبات نگه‌دارنده بدانید، مسیر Crabbox را درست کنید.

اگر `blacksmith testbox list --all` و `blacksmith testbox status` کار می‌کنند اما warmupهای تازه پس از چند دقیقه با وضعیت `queued` بدون IP یا URL اجرای Actions می‌مانند، آن را فشار provider، queue، billing یا محدودیت سازمانی Blacksmith بدانید. idهای queued که ساخته‌اید را متوقف کنید، از شروع Testboxهای بیشتر پرهیز کنید، و اثبات را به مسیر ظرفیت Crabbox تحت مالکیت در پایین منتقل کنید، در حالی که فردی dashboard، billing و محدودیت‌های سازمانی Blacksmith را بررسی می‌کند.

فقط وقتی به ظرفیت Crabbox تحت مالکیت escalate کنید که Blacksmith قطع است، سهمیه محدود دارد، محیط لازم را ندارد، یا ظرفیت تحت مالکیت صریحا هدف است:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

در فشار AWS، از `class=beast` پرهیز کنید مگر اینکه کار واقعا به CPU در کلاس 48xlarge نیاز داشته باشد. درخواست `beast` از ۱۹۲ vCPU شروع می‌شود و ساده‌ترین راه برای برخورد به سهمیه منطقه‌ای EC2 Spot یا On-Demand Standard است. `.crabbox.yaml` متعلق به مخزن به‌صورت پیش‌فرض `standard`، چند منطقه ظرفیت، و `capacity.hints: true` دارد تا leaseهای AWS کارگزاری‌شده منطقه/market انتخاب‌شده، فشار سهمیه، fallback به Spot، و هشدارهای کلاس پرفشار را چاپ کنند. برای بررسی‌های گسترده سنگین‌تر از `fast` استفاده کنید، فقط پس از کافی نبودن standard/fast از `large` استفاده کنید، و `beast` را فقط برای laneهای استثنایی وابسته به CPU مانند مجموعه کامل یا ماتریس‌های Docker همه Pluginها، اعتبارسنجی صریح release/blocker، یا profiling کارایی با هسته‌های زیاد به‌کار ببرید. از `beast` برای `pnpm check:changed`، آزمون‌های متمرکز، کارهای فقط docs، lint/typecheck عادی، بازتولیدهای کوچک E2E، یا تریاژ قطعی Blacksmith استفاده نکنید. برای تشخیص ظرفیت از `--market on-demand` استفاده کنید تا نوسان بازار Spot با سیگنال مخلوط نشود.

`.crabbox.yaml` مالک پیش‌فرض‌های provider، sync، و hydration در GitHub Actions برای laneهای owned-cloud است. این فایل `.git` محلی را مستثنی می‌کند تا checkout هیدراته‌شده Actions به‌جای sync کردن remoteها و object storeهای محلی نگه‌دارنده، metadata ریموت Git خودش را نگه دارد، و artifactهای محلی runtime/build را که هرگز نباید منتقل شوند مستثنی می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، راه‌اندازی Node/pnpm، fetch کردن `origin/main`، و تحویل محیط غیرمحرمانه برای فرمان‌های owned-cloud با `crabbox run --id <cbx_id>` است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)

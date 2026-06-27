---
read_when:
    - باید بفهمید چرا یک کار CI اجرا شد یا اجرا نشد
    - شما در حال عیب‌یابی یک بررسی ناموفق GitHub Actions هستید
    - شما در حال هماهنگی یک اجرای اعتبارسنجی انتشار یا اجرای دوباره آن هستید
    - شما در حال تغییر dispatch در ClawSweeper یا بازارسال فعالیت GitHub هستید
summary: گراف کارهای CI، دروازه‌های دامنه، چترهای انتشار، و معادل‌های فرمان محلی
title: خط لوله CI
x-i18n:
    generated_at: "2026-06-27T17:16:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

CI OpenClaw در هر push به `main` و هر درخواست ادغام اجرا می‌شود. pushهای رسمی
`main` ابتدا از یک پنجره پذیرش ۹۰ ثانیه‌ای اجراکننده میزبانی‌شده عبور می‌کنند.
گروه هم‌زمانی موجود `CI` وقتی commit جدیدتری وارد می‌شود آن اجرای منتظر را لغو می‌کند،
بنابراین mergeهای پیاپی هرکدام یک ماتریس کامل Blacksmith را ثبت نمی‌کنند.
درخواست‌های ادغام و اجراهای دستی از انتظار عبور می‌کنند. سپس job‏ `preflight`
diff را طبقه‌بندی می‌کند و وقتی فقط بخش‌های نامرتبط تغییر کرده‌اند، مسیرهای پرهزینه را خاموش می‌کند. اجراهای دستی `workflow_dispatch` عمدا دامنه‌بندی هوشمند را دور می‌زنند
و برای نامزدهای انتشار و اعتبارسنجی گسترده، کل گراف را منشعب می‌کنند. مسیرهای Android
از طریق `include_android` اختیاری می‌مانند. پوشش Plugin فقط مخصوص انتشار در گردش کار جداگانه
[`Plugin Prerelease`](#plugin-prerelease) قرار دارد و فقط از
[`Full Release Validation`](#full-release-validation) یا یک اجرای دستی صریح اجرا می‌شود.

## نمای کلی خط لوله

| Job                                | هدف                                                                                                   | زمان اجرا                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | تغییرات فقط مستندات، دامنه‌های تغییرکرده، افزونه‌های تغییرکرده، و manifest‏ CI را تشخیص می‌دهد                   | همیشه روی pushها و PRهای غیرپیش‌نویس                  |
| `runner-admission`                 | وقفه ۹۰ ثانیه‌ای میزبانی‌شده برای pushهای رسمی `main` پیش از ثبت کار Blacksmith                | هر اجرای CI؛ sleep فقط روی pushهای رسمی `main` |
| `security-fast`                    | تشخیص کلید خصوصی، ممیزی گردش کار تغییرکرده از طریق `zizmor`، و ممیزی lockfile تولید                 | همیشه روی pushها و PRهای غیرپیش‌نویس                  |
| `check-dependencies`               | گذر فقط وابستگی Knip تولید، به‌همراه محافظ allowlist فایل‌های استفاده‌نشده                                 | تغییرات مرتبط با Node                               |
| `build-artifacts`                  | ساخت `dist/`، Control UI، بررسی‌های دود CLI ساخته‌شده، بررسی‌های artifact ساخته‌شده تعبیه‌شده، و artifactهای قابل استفاده مجدد | تغییرات مرتبط با Node                               |
| `checks-fast-core`                 | مسیرهای سریع صحت‌سنجی Linux مانند bundled، protocol، QA Smoke CI، و بررسی‌های مسیریابی CI                | تغییرات مرتبط با Node                               |
| `checks-fast-contracts-plugins-*`  | دو بررسی contract شاردشده Plugin                                                                        | تغییرات مرتبط با Node                               |
| `checks-fast-contracts-channels-*` | دو بررسی contract شاردشده channel                                                                       | تغییرات مرتبط با Node                               |
| `checks-node-core-*`               | شاردهای آزمون Core Node، به‌جز مسیرهای channel، bundled، contract، و extension                          | تغییرات مرتبط با Node                               |
| `check-*`                          | معادل gate محلی اصلی شاردشده: types تولید، lint، guards، test types، و smoke سخت‌گیرانه                | تغییرات مرتبط با Node                               |
| `check-additional-*`               | معماری، boundary/prompt drift شاردشده، extension guards، package boundary، و runtime topology     | تغییرات مرتبط با Node                               |
| `checks-node-compat-node22`        | مسیر build و smoke سازگاری Node 22                                                                | اجرای دستی CI برای انتشارها                     |
| `check-docs`                       | قالب‌بندی مستندات، lint، و بررسی لینک‌های خراب                                                             | مستندات تغییر کرده‌اند                                        |
| `skills-python`                    | Ruff + pytest برای Skills مبتنی بر Python                                                                    | تغییرات مرتبط با Python skill                       |
| `checks-windows`                   | آزمون‌های ویژه Windows برای process/path به‌همراه regressionهای specifier import runtime مشترک                      | تغییرات مرتبط با Windows                            |
| `macos-node`                       | مسیر آزمون TypeScript روی macOS با استفاده از artifactهای ساخته‌شده مشترک                                               | تغییرات مرتبط با macOS                              |
| `macos-swift`                      | lint، build، و آزمون‌های Swift برای برنامه macOS                                                            | تغییرات مرتبط با macOS                              |
| `ios-build`                        | تولید پروژه Xcode به‌همراه build شبیه‌ساز برنامه iOS                                                 | برنامه iOS، کیت برنامه مشترک، یا تغییرات Swabble         |
| `android`                          | آزمون‌های واحد Android برای هر دو flavor به‌همراه یک build‏ APK اشکال‌زدایی                                              | تغییرات مرتبط با Android                            |
| `test-performance-agent`           | بهینه‌سازی روزانه آزمون‌های کند Codex پس از فعالیت مورد اعتماد                                                 | موفقیت CI اصلی یا اجرای دستی                  |
| `openclaw-performance`             | گزارش‌های عملکرد runtime روزانه/درخواستی Kova با مسیرهای mock-provider، deep-profile، و زنده GPT 5.5 | زمان‌بندی‌شده و اجرای دستی                       |

## ترتیب fail-fast

1. `runner-admission` فقط برای pushهای رسمی `main` منتظر می‌ماند؛ push جدیدتر اجرا را پیش از ثبت Blacksmith لغو می‌کند.
2. `preflight` تصمیم می‌گیرد اساسا کدام مسیرها وجود داشته باشند. منطق `docs-scope` و `changed-scope` گام‌هایی داخل همین job هستند، نه jobهای مستقل.
3. `security-fast`، `check-*`، `check-additional-*`، `check-docs`، و `skills-python` بدون انتظار برای jobهای سنگین‌تر artifact و ماتریس platform سریع شکست می‌خورند.
4. `build-artifacts` با مسیرهای سریع Linux هم‌پوشانی دارد تا مصرف‌کنندگان پایین‌دستی به‌محض آماده شدن build مشترک شروع شوند.
5. مسیرهای سنگین‌تر platform و runtime پس از آن منشعب می‌شوند: `checks-fast-core`، `checks-fast-contracts-plugins-*`، `checks-fast-contracts-channels-*`، `checks-node-core-*`، `checks-windows`، `macos-node`، `macos-swift`، `ios-build`، و `android`.

GitHub ممکن است وقتی push جدیدتری روی همان PR یا ref‏ `main` وارد می‌شود، jobهای جایگزین‌شده را `cancelled` علامت‌گذاری کند. مگر اینکه جدیدترین اجرا برای همان ref نیز شکست بخورد، آن را نویز CI در نظر بگیرید. jobهای ماتریسی از `fail-fast: false` استفاده می‌کنند، و `build-artifacts` خطاهای embedded channel، core-support-boundary، و gateway-watch را مستقیما گزارش می‌کند به‌جای اینکه jobهای verifier کوچک را در صف بگذارد. کلید هم‌زمانی خودکار CI نسخه‌گذاری شده است (`CI-v7-*`) تا یک zombie سمت GitHub در گروه صف قدیمی نتواند اجراهای جدیدتر main را برای همیشه مسدود کند. اجراهای دستی مجموعه کامل از `CI-manual-v1-*` استفاده می‌کنند و اجراهای در حال انجام را لغو نمی‌کنند.

از `pnpm ci:timings`، `pnpm ci:timings:recent`، یا `node scripts/ci-run-timings.mjs <run-id>` برای خلاصه کردن زمان دیواری، زمان صف، کندترین jobها، شکست‌ها، و مانع fanout‏ `pnpm-store-warmup` از GitHub Actions استفاده کنید. CI همان خلاصه اجرا را نیز به‌عنوان artifact‏ `ci-timings-summary` بارگذاری می‌کند. برای زمان‌بندی build، گام `Build dist` در job‏ `build-artifacts` را بررسی کنید: `pnpm build:ci-artifacts` عبارت `[build-all] phase timings:` را چاپ می‌کند و شامل `ui:build` است؛ job همچنین artifact‏ `startup-memory` را بارگذاری می‌کند.

برای اجراهای درخواست ادغام، job پایانی timing-summary پیش از پاس دادن `GH_TOKEN` به `gh run view`، helper را از revision پایه مورد اعتماد اجرا می‌کند. این کار query دارای token را بیرون از کد تحت کنترل branch نگه می‌دارد، در حالی که همچنان اجرای CI فعلی درخواست ادغام را خلاصه می‌کند.

## زمینه و شواهد PR

PRهای مشارکت‌کنندگان خارجی یک gate زمینه و شواهد PR را از
`.github/workflows/real-behavior-proof.yml` اجرا می‌کنند. این گردش کار commit پایه مورد اعتماد را
checkout می‌کند و فقط بدنه PR را ارزیابی می‌کند؛ کدی از branch مشارکت‌کننده اجرا نمی‌کند.

این gate برای نویسندگان PR اعمال می‌شود که owner، member،
collaborator، یا bot مخزن نیستند. وقتی بدنه PR شامل بخش‌های نوشته‌شده
`What Problem This Solves` و `Evidence` باشد، عبور می‌کند. شواهد می‌تواند یک
آزمون متمرکز، نتیجه CI، screenshot، recording، خروجی terminal، مشاهده زنده،
log redacted، یا لینک artifact باشد. بدنه intent و validation مفید را فراهم می‌کند؛
reviewerها کد، آزمون‌ها، و CI را بررسی می‌کنند تا درستی را ارزیابی کنند.

وقتی check شکست می‌خورد، به‌جای push کردن یک commit کد دیگر، بدنه PR را به‌روزرسانی کنید.

## دامنه و مسیریابی

منطق دامنه در `scripts/ci-changed-scope.mjs` قرار دارد و با آزمون‌های واحد در `src/scripts/ci-changed-scope.test.ts` پوشش داده شده است. اجرای دستی تشخیص changed-scope را رد می‌کند و باعث می‌شود manifest‏ preflight طوری رفتار کند که انگار هر ناحیه دامنه‌دار تغییر کرده است.

- **ویرایش‌های گردش کار CI** گراف CI‏ Node به‌همراه linting گردش کار را اعتبارسنجی می‌کنند، اما به‌تنهایی buildهای native‏ Windows، iOS، Android، یا macOS را اجبار نمی‌کنند؛ آن مسیرهای platform محدود به تغییرات source همان platform می‌مانند.
- **Workflow Sanity**، `actionlint`، `zizmor` را روی همه فایل‌های YAML گردش کار، محافظ interpolation برای composite-action، و محافظ conflict-marker اجرا می‌کند. job‏ `security-fast` دامنه‌دار به PR نیز `zizmor` را روی فایل‌های گردش کار تغییرکرده اجرا می‌کند تا یافته‌های امنیتی گردش کار زودتر در گراف اصلی CI شکست بخورند.
- **مستندات روی pushهای `main`** با گردش کار مستقل `Docs` و همان mirror مستندات ClawHub که CI استفاده می‌کند بررسی می‌شوند، بنابراین pushهای ترکیبی code+docs، شارد `check-docs` در CI را نیز در صف نمی‌گذارند. درخواست‌های ادغام و CI دستی همچنان وقتی مستندات تغییر کرده باشند، `check-docs` را از CI اجرا می‌کنند.
- **TUI PTY** برای تغییرات TUI در شارد Linux Node‏ `checks-node-core-runtime-tui-pty` اجرا می‌شود. این شارد `test/vitest/vitest.tui-pty.config.ts` را با `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` اجرا می‌کند، بنابراین هم مسیر fixture قطعی `TuiBackend` و هم smoke کندتر `tui --local` را پوشش می‌دهد که فقط endpoint مدل خارجی را mock می‌کند.
- **ویرایش‌های فقط مسیریابی CI، ویرایش‌های منتخب fixture آزمون core ارزان، و ویرایش‌های محدود helper/test-routing مربوط به contract‏ Plugin** از مسیر manifest سریع فقط Node استفاده می‌کنند: `preflight`، security، و یک task واحد `checks-fast-core`. وقتی تغییر به سطوح routing یا helper که task سریع مستقیما تمرین می‌دهد محدود باشد، آن مسیر artifactهای build، سازگاری Node 22، contractهای channel، شاردهای کامل core، شاردهای bundled-plugin، و ماتریس‌های guard اضافی را رد می‌کند.
- **بررسی‌های Windows Node** به wrapperهای ویژه Windows برای process/path، helperهای runner‏ npm/pnpm/UI، تنظیمات package manager، و سطوح گردش کار CI که آن مسیر را اجرا می‌کنند محدود هستند؛ تغییرات نامرتبط source، Plugin، install-smoke، و فقط آزمون روی مسیرهای Linux Node باقی می‌مانند.

کندترین خانواده‌های تست Node تقسیم یا متوازن شده‌اند تا هر job بدون رزرو بیش‌ازحد runnerها کوچک بماند: قراردادهای plugin و قراردادهای کانال هرکدام به‌صورت دو shard وزن‌دار با پشتیبانی Blacksmith و fallback استاندارد runnerهای GitHub اجرا می‌شوند، laneهای سریع/پشتیبان واحد core جداگانه اجرا می‌شوند، زیرساخت runtime هسته بین state، process/config، shared، و سه shard دامنه cron تقسیم شده است، auto-reply به‌صورت workerهای متوازن اجرا می‌شود (با subtree پاسخ که به shardهای agent-runner، dispatch، و commands/state-routing تقسیم شده است)، و پیکربندی‌های agentic gateway/server به‌جای انتظار برای artifactهای ساخته‌شده، در laneهای chat/auth/model/http-plugin/runtime/startup تقسیم شده‌اند. سپس CI عادی فقط shardهای include-pattern زیرساخت ایزوله را در بسته‌های قطعیِ حداکثر ۶۴ فایل تست بسته‌بندی می‌کند و matrix مربوط به Node را بدون ادغام suiteهای command/cron غیرایزوله، agents-core دارای state، یا gateway/server کاهش می‌دهد؛ suiteهای ثابت سنگین روی ۸ vCPU می‌مانند، درحالی‌که laneهای بسته‌بندی‌شده و سبک‌تر از ۴ vCPU استفاده می‌کنند. Pull requestها روی repository کانونی از یک برنامه پذیرش فشرده اضافی استفاده می‌کنند: همان گروه‌های per-config در subprocessهای ایزوله داخل برنامه فعلی ۳۴-job مربوط به Linux Node اجرا می‌شوند، بنابراین یک PR منفرد matrix کامل بیش از ۷۰-job مربوط به Node را ثبت نمی‌کند. pushهای `main`، dispatchهای دستی، و gateهای release matrix کامل را حفظ می‌کنند. تست‌های گسترده browser، QA، media، و pluginهای متفرقه به‌جای catch-all مشترک plugin از پیکربندی‌های اختصاصی Vitest خود استفاده می‌کنند. shardهای include-pattern ورودی‌های زمان‌بندی را با نام shard در CI ثبت می‌کنند، بنابراین `.artifacts/vitest-shard-timings.json` می‌تواند یک پیکربندی کامل را از یک shard فیلترشده تشخیص دهد. `check-additional-*` کارهای compile/canary مرز package را کنار هم نگه می‌دارد و معماری topology مربوط به runtime را از پوشش gateway watch جدا می‌کند؛ فهرست guardهای مرزی به یک shard سنگین از نظر prompt و یک shard ترکیبی برای stripeهای باقی‌مانده guard تقسیم شده است، که هرکدام guardهای مستقل انتخاب‌شده را هم‌زمان اجرا می‌کنند و زمان‌بندی هر check را چاپ می‌کنند. بررسی پرهزینه drift مربوط به snapshot prompt مسیر موفق Codex به‌عنوان job اضافی مستقل فقط برای CI دستی و تغییرات اثرگذار بر prompt اجرا می‌شود، بنابراین تغییرات نامرتبط عادی Node پشت تولید سرد snapshot prompt منتظر نمی‌مانند و shardهای مرزی متوازن می‌مانند، درحالی‌که prompt drift همچنان به PRیی که آن را ایجاد کرده متصل می‌ماند؛ همین flag تولید snapshot prompt در Vitest را داخل shard ساخته‌شده artifact مربوط به support-boundary هسته رد می‌کند. Gateway watch، تست‌های کانال، و shard support-boundary هسته هم‌زمان داخل `build-artifacts` اجرا می‌شوند، بعد از اینکه `dist/` و `dist-runtime/` از قبل ساخته شده‌اند.

پس از پذیرش، CI کانونی Linux تا ۲۴ job تست Node هم‌زمان و
۱۲ مورد برای laneهای کوچک‌تر fast/check اجازه می‌دهد؛ Windows و Android روی دو می‌مانند چون
poolهای runner آن‌ها محدودترند.

برنامه فشرده PR برای suite فعلی ۱۸ job Node تولید می‌کند: گروه‌های whole-config
در subprocessهای ایزوله با timeout دسته‌ای ۱۲۰ دقیقه‌ای batch می‌شوند،
درحالی‌که گروه‌های include-pattern همان بودجه job محدود را به‌اشتراک می‌گذارند.

CI مربوط به Android هم `testPlayDebugUnitTest` و هم `testThirdPartyDebugUnitTest` را اجرا می‌کند و سپس APK دیباگ Play را می‌سازد. flavor شخص ثالث source set یا manifest جداگانه‌ای ندارد؛ lane تست واحد آن همچنان flavor را با flagهای BuildConfig مربوط به SMS/call-log کامپایل می‌کند، درحالی‌که از job تکراری بسته‌بندی APK دیباگ در هر push مرتبط با Android جلوگیری می‌کند.

shard مربوط به `check-dependencies` دستور `pnpm deadcode:dependencies` (یک pass فقط وابستگی production در Knip که به آخرین نسخه Knip pin شده است و حداقل سن انتشار pnpm برای نصب `dlx` غیرفعال شده است) و `pnpm deadcode:unused-files` را اجرا می‌کند، که یافته‌های فایل‌های استفاده‌نشده production در Knip را با `scripts/deadcode-unused-files.allowlist.mjs` مقایسه می‌کند. guard فایل استفاده‌نشده وقتی یک PR فایل استفاده‌نشده جدید و بازبینی‌نشده‌ای اضافه کند یا ورودی allowlist منسوخی باقی بگذارد fail می‌شود، درحالی‌که سطح‌های dynamic plugin، generated، build، live-test، و package bridge عمدی را که Knip نمی‌تواند به‌صورت static resolve کند حفظ می‌کند.

## فوروارد کردن فعالیت ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` پل سمت مقصد از فعالیت repository مربوط به OpenClaw به ClawSweeper است. این workflow کد pull request نامطمئن را checkout یا اجرا نمی‌کند. workflow از `CLAWSWEEPER_APP_PRIVATE_KEY` یک token مربوط به GitHub App می‌سازد، سپس payloadهای فشرده `repository_dispatch` را به `openclaw/clawsweeper` dispatch می‌کند.

این workflow چهار lane دارد:

- `clawsweeper_item` برای درخواست‌های دقیق بازبینی issue و pull request؛
- `clawsweeper_comment` برای دستورهای صریح ClawSweeper در commentهای issue؛
- `clawsweeper_commit_review` برای درخواست‌های بازبینی در سطح commit روی pushهای `main`؛
- `github_activity` برای فعالیت عمومی GitHub که agent مربوط به ClawSweeper ممکن است بررسی کند.

lane مربوط به `github_activity` فقط metadata نرمال‌سازی‌شده را فوروارد می‌کند: نوع event، action، actor، repository، شماره item، URL، عنوان، state، و excerptهای کوتاه برای commentها یا reviewها در صورت وجود. این lane عمداً از فوروارد کردن بدنه کامل webhook پرهیز می‌کند. workflow دریافت‌کننده در `openclaw/clawsweeper` برابر `.github/workflows/github-activity.yml` است، که event نرمال‌سازی‌شده را به hook مربوط به OpenClaw Gateway برای agent مربوط به ClawSweeper post می‌کند.

فعالیت عمومی مشاهده است، نه تحویل پیش‌فرض. agent مربوط به ClawSweeper مقصد Discord را در prompt خود دریافت می‌کند و باید فقط وقتی event غافلگیرکننده، قابل اقدام، پرریسک، یا از نظر عملیاتی مفید است در `#clawsweeper` post کند. باز شدن‌ها، ویرایش‌ها، چرخش bot، نویز تکراری webhook، و ترافیک عادی review باید به `NO_REPLY` منجر شوند.

در سراسر این مسیر با عنوان‌ها، commentها، bodyها، متن review، نام‌های branch، و پیام‌های commit در GitHub به‌عنوان داده نامطمئن رفتار کنید. آن‌ها ورودی summarize و triage هستند، نه دستورهایی برای workflow یا runtime agent.

## dispatchهای دستی

dispatchهای دستی CI همان گراف job مربوط به CI عادی را اجرا می‌کنند اما همه laneهای scoped غیر Android را روشن می‌کنند: shardهای Linux Node، shardهای bundled-plugin، shardهای قرارداد plugin و کانال، سازگاری Node 22، `check-*`، `check-additional-*`، بررسی‌های smoke مربوط به built-artifact، بررسی‌های docs، Python skills، Windows، macOS، build مربوط به iOS، و i18n مربوط به Control UI. dispatchهای دستی مستقل CI فقط با `include_android=true`، Android را اجرا می‌کنند؛ umbrella کامل release با پاس دادن `include_android=true`، Android را فعال می‌کند. بررسی‌های static پیش‌انتشار plugin، shard فقط مخصوص release با نام `agentic-plugins`، sweep کامل دسته‌ای extension، و laneهای Docker پیش‌انتشار plugin از CI مستثنی هستند. suite پیش‌انتشار Docker فقط وقتی اجرا می‌شود که `Full Release Validation` workflow جداگانه `Plugin Prerelease` را با gate اعتبارسنجی release فعال dispatch کند.

runهای دستی از یک concurrency group یکتا استفاده می‌کنند تا suite کامل release-candidate با run دیگری از push یا PR روی همان ref لغو نشود. input اختیاری `target_ref` به یک caller مورد اعتماد اجازه می‌دهد آن گراف را روی branch، tag، یا commit SHA کامل اجرا کند، درحالی‌که از فایل workflow مربوط به dispatch ref انتخاب‌شده استفاده می‌کند.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnerها

| Runner                          | Jobها                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | dispatch دستی CI و fallbackهای repository غیرکانونی، scanهای کیفیت CodeQL JavaScript/actions، workflow-sanity، labeler، auto-response، workflowهای docs بیرون از CI، و preflight مربوط به install-smoke تا matrix مربوط به Blacksmith بتواند زودتر در queue قرار بگیرد                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`، `security-fast`، shardهای سبک‌تر extension، `checks-fast-core`، shardهای قرارداد plugin/channel، بیشتر shardهای bundled/سبک‌تر Linux Node، `check-guards`، `check-prod-types`، `check-test-types`، shardهای انتخاب‌شده `check-additional-*`، و `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | suiteهای سنگین Linux Node که حفظ شده‌اند، shardهای `check-additional-*` سنگین از نظر boundary/extension، و `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`، `check-lint` (به‌اندازه‌ای حساس به CPU که ۸ vCPU بیشتر از صرفه‌جویی‌اش هزینه داشت)؛ buildهای Docker مربوط به install-smoke (زمان queue برای ۳۲-vCPU بیشتر از صرفه‌جویی‌اش هزینه داشت)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` روی `openclaw/openclaw`؛ forkها به `macos-15` fallback می‌کنند                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` و `ios-build` روی `openclaw/openclaw`؛ forkها به `macos-26` fallback می‌کنند                                                                                                                                                                                                  |

## بودجه ثبت runner

bucket فعلی OpenClaw برای ثبت runner در GitHub اجازه ۳٬۰۰۰ ثبت runner خودمیزبان
در هر ۵ دقیقه را می‌دهد. این limit بین همه ثبت‌های runner مربوط به Blacksmith
در organization با نام `openclaw` مشترک است، بنابراین افزودن یک نصب Blacksmith دیگر
bucket جدیدی اضافه نمی‌کند.

labelهای Blacksmith را منبع کمیاب برای کنترل burst در نظر بگیرید. jobهایی که
فقط route، notify، summarize، انتخاب shard، یا scanهای کوتاه CodeQL را اجرا می‌کنند باید
روی runnerهای GitHub-hosted بمانند مگر اینکه نیازهای اندازه‌گیری‌شده خاص Blacksmith داشته باشند.
هر matrix جدید Blacksmith، `max-parallel` بزرگ‌تر، یا workflow پرتکرار
باید تعداد ثبت worst-case خود را نشان دهد و target سطح organization را
زیر ۲٬۰۰۰ ثبت در هر ۵ دقیقه نگه دارد، تا برای repositoryهای هم‌زمان
و jobهای retryشده headroom باقی بماند.

CI مربوط به repository کانونی Blacksmith را به‌عنوان مسیر runner پیش‌فرض برای runهای عادی push و pull-request نگه می‌دارد. runهای `workflow_dispatch` و repository غیرکانونی از runnerهای GitHub-hosted استفاده می‌کنند، اما runهای عادی کانونی در حال حاضر سلامت queue مربوط به Blacksmith را probe نمی‌کنند یا وقتی Blacksmith در دسترس نیست به‌طور خودکار به labelهای GitHub-hosted fallback نمی‌کنند.

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

`OpenClaw Performance` گردش‌کار عملکرد محصول/زمان اجرا است. این گردش‌کار هر روز روی `main` اجرا می‌شود و می‌توان آن را به‌صورت دستی نیز اجرا کرد:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

اجرای دستی معمولا مرجع گردش‌کار را بنچمارک می‌کند. برای بنچمارک کردن یک برچسب انتشار یا شاخه‌ای دیگر با پیاده‌سازی فعلی گردش‌کار، `target_ref` را تنظیم کنید. مسیرهای گزارش منتشرشده و اشاره‌گرهای آخرین نسخه بر اساس مرجع آزموده‌شده کلیدگذاری می‌شوند، و هر `index.md` مرجع/SHA آزموده‌شده، مرجع/SHA گردش‌کار، مرجع Kova، پروفایل، حالت احراز هویت lane، مدل، تعداد تکرار، و فیلترهای سناریو را ثبت می‌کند.

این گردش‌کار OCM را از یک انتشار پین‌شده و Kova را از `openclaw/Kova` در ورودی پین‌شده `kova_ref` نصب می‌کند، سپس سه lane را اجرا می‌کند:

- `mock-provider`: سناریوهای تشخیصی Kova در برابر زمان اجرای ساخت محلی با احراز هویت جعلی قطعی و سازگار با OpenAI.
- `mock-deep-profile`: پروفایل‌گیری CPU/heap/trace برای نقاط داغ راه‌اندازی، Gateway، و نوبت عامل.
- `live-openai-candidate`: یک نوبت عامل واقعی OpenAI `openai/gpt-5.5`، که وقتی `OPENAI_API_KEY` در دسترس نباشد رد می‌شود.

lane مربوط به mock-provider پس از عبور Kova، پروب‌های منبع بومی OpenClaw را نیز اجرا می‌کند: زمان‌بندی راه‌اندازی Gateway و حافظه در حالت‌های راه‌اندازی پیش‌فرض، hook، و ۵۰-Plugin؛ RSS واردسازی Pluginهای همراه، حلقه‌های سلام تکراری mock-OpenAI `channel-chat-baseline`، فرمان‌های راه‌اندازی CLI در برابر Gateway راه‌اندازی‌شده، و پروب عملکرد smoke وضعیت SQLite. وقتی گزارش منبع mock-provider منتشرشده قبلی برای مرجع آزموده‌شده در دسترس باشد، خلاصه منبع مقدارهای RSS و heap فعلی را با آن خط مبنا مقایسه می‌کند و افزایش‌های بزرگ RSS را با `watch` علامت‌گذاری می‌کند. خلاصه Markdown پروب منبع در بسته گزارش در `source/index.md` قرار دارد و JSON خام کنار آن است.

هر lane آرتیفکت‌های GitHub را بارگذاری می‌کند. وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، این گردش‌کار همچنین `report.json`، `report.md`، بسته‌ها، `index.md`، و آرتیفکت‌های پروب منبع را در `openclaw/clawgrit-reports` زیر `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` commit می‌کند. اشاره‌گر فعلی مرجع آزموده‌شده به‌صورت `openclaw-performance/<tested-ref>/latest-<lane>.json` نوشته می‌شود.

## اعتبارسنجی کامل انتشار

`Full Release Validation` گردش‌کار دستی چتری برای «اجرای همه چیز پیش از انتشار» است. این گردش‌کار یک شاخه، برچسب، یا SHA کامل commit را می‌پذیرد، گردش‌کار دستی `CI` را با آن هدف اجرا می‌کند، `Plugin Prerelease` را برای اثبات‌های ویژه انتشار مربوط به Plugin/بسته/ایستا/Docker اجرا می‌کند، و `OpenClaw Release Checks` را برای smoke نصب، پذیرش بسته، بررسی‌های بسته میان‌سیستمی، رندر کارت امتیاز بلوغ از شواهد پروفایل QA، برابری QA Lab، Matrix، و laneهای Telegram اجرا می‌کند. پروفایل‌های stable و full همیشه پوشش کامل live/E2E و soak مسیر انتشار Docker را شامل می‌شوند؛ پروفایل beta می‌تواند با `run_release_soak=true` آن را فعال کند. E2E بسته canonical مربوط به Telegram داخل Package Acceptance اجرا می‌شود، بنابراین یک نامزد کامل poller زنده تکراری را شروع نمی‌کند. پس از انتشار، `release_package_spec` را پاس بدهید تا بسته npm منتشرشده در release checks، Package Acceptance، Docker، cross-OS، و Telegram بدون ساخت دوباره استفاده شود. `npm_telegram_package_spec` را فقط برای اجرای دوباره متمرکز Telegram با بسته منتشرشده استفاده کنید. lane بسته زنده Plugin مربوط به Codex به‌صورت پیش‌فرض از همان وضعیت انتخاب‌شده استفاده می‌کند: `release_package_spec=openclaw@<tag>` منتشرشده، `codex_plugin_spec=npm:@openclaw/codex@<tag>` را استخراج می‌کند، در حالی که اجراهای SHA/آرتیفکت، `extensions/codex` را از مرجع انتخاب‌شده بسته‌بندی می‌کنند. برای منابع سفارشی Plugin مانند مشخصات `npm:`، `npm-pack:`، یا `git:`، `codex_plugin_spec` را صریحا تنظیم کنید.

برای ماتریس مرحله‌ها، نام دقیق jobهای گردش‌کار، تفاوت‌های پروفایل، آرتیفکت‌ها، و دسته‌های اجرای دوباره متمرکز، [اعتبارسنجی کامل انتشار](/fa/reference/full-release-validation) را ببینید.

`OpenClaw Release Publish` گردش‌کار دستی و تغییردهنده انتشار است. پس از وجود داشتن برچسب انتشار و موفقیت پیش‌پرواز npm مربوط به OpenClaw، آن را از `release/YYYY.M.PATCH` یا `main` اجرا کنید. این گردش‌کار `pnpm plugins:sync:check` را راستی‌آزمایی می‌کند، `Plugin NPM Release` را برای همه بسته‌های Plugin قابل انتشار اجرا می‌کند، `Plugin ClawHub Release` را برای همان SHA انتشار اجرا می‌کند، و فقط پس از آن `OpenClaw NPM Release` را با `preflight_run_id` ذخیره‌شده اجرا می‌کند. انتشار stable همچنین به یک `windows_node_tag` دقیق نیاز دارد؛ گردش‌کار انتشار منبع Windows را راستی‌آزمایی می‌کند و نصاب‌های x64/ARM64 آن را پیش از هر فرزند انتشار با ورودی تأییدشده نامزد `windows_node_installer_digests` مقایسه می‌کند، سپس همان digestهای نصاب پین‌شده به‌همراه دارایی همراه دقیق و قرارداد checksum را پیش از انتشار پیش‌نویس انتشار GitHub، ارتقا و راستی‌آزمایی می‌کند.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

برای اثبات commit پین‌شده روی شاخه‌ای که سریع حرکت می‌کند، به‌جای `gh workflow run ... --ref main -f ref=<sha>` از helper استفاده کنید:

```bash
pnpm ci:full-release --sha <full-sha>
```

مراجع اجرای گردش‌کار GitHub باید شاخه یا برچسب باشند، نه SHA خام commit. این helper یک شاخه موقت `release-ci/<sha>-...` را روی SHA هدف push می‌کند، `Full Release Validation` را از آن مرجع پین‌شده اجرا می‌کند، راستی‌آزمایی می‌کند که `headSha` هر گردش‌کار فرزند با هدف مطابقت دارد، و پس از تکمیل اجرا شاخه موقت را حذف می‌کند. راستی‌آزمای چتری همچنین اگر هر گردش‌کار فرزند روی SHA متفاوتی اجرا شده باشد شکست می‌خورد.

`release_profile` گستره live/provider پاس‌داده‌شده به release checks را کنترل می‌کند. گردش‌کارهای دستی انتشار به‌صورت پیش‌فرض `stable` هستند؛ فقط وقتی عمدا ماتریس گسترده advisory مربوط به provider/media را می‌خواهید، از `full` استفاده کنید. release checks مربوط به stable و full همیشه soak کامل live/E2E و مسیر انتشار Docker را اجرا می‌کنند؛ پروفایل beta می‌تواند با `run_release_soak=true` آن را فعال کند.

- `minimum` سریع‌ترین laneهای حیاتی انتشار OpenAI/هسته را نگه می‌دارد.
- `stable` مجموعه stable مربوط به provider/backend را اضافه می‌کند.
- `full` ماتریس گسترده advisory مربوط به provider/media را اجرا می‌کند.

چتر، شناسه‌های اجرای فرزند اجراشده را ثبت می‌کند، و job نهایی `Verify full validation` نتیجه‌های فعلی اجرای فرزند را دوباره بررسی می‌کند و جدول‌های کندترین job را برای هر اجرای فرزند اضافه می‌کند. اگر یک گردش‌کار فرزند دوباره اجرا شود و سبز شود، فقط job راستی‌آزمای والد را دوباره اجرا کنید تا نتیجه چتر و خلاصه زمان‌بندی تازه شود.

برای بازیابی، هر دو `Full Release Validation` و `OpenClaw Release Checks` مقدار `rerun_group` را می‌پذیرند. برای نامزد انتشار از `all`، فقط برای فرزند CI کامل معمولی از `ci`، فقط برای فرزند پیش‌انتشار Plugin از `plugin-prerelease`، برای هر فرزند انتشار از `release-checks`، یا از گروه محدودتر استفاده کنید: `install-smoke`، `cross-os`، `live-e2e`، `package`، `qa`، `qa-parity`، `qa-live`، یا `npm-telegram` روی چتر. این کار اجرای دوباره یک باکس انتشار شکست‌خورده را پس از اصلاح متمرکز محدود نگه می‌دارد. برای یک lane شکست‌خورده cross-OS، `rerun_group=cross-os` را با `cross_os_suite_filter` ترکیب کنید، برای مثال `windows/packaged-upgrade`؛ فرمان‌های طولانی cross-OS خط‌های Heartbeat منتشر می‌کنند و خلاصه‌های packaged-upgrade زمان‌بندی هر فاز را شامل می‌شوند. laneهای QA مربوط به release-checks advisory هستند، به‌جز gate استاندارد پوشش ابزار زمان اجرا، که وقتی ابزارهای پویای لازم OpenClaw از خلاصه سطح استاندارد منحرف یا ناپدید شوند مسدود می‌کند.

`OpenClaw Release Checks` از مرجع گردش‌کار مورد اعتماد استفاده می‌کند تا مرجع انتخاب‌شده را یک‌بار به یک tarball `release-package-under-test` تبدیل کند، سپس آن آرتیفکت را به بررسی‌های cross-OS و Package Acceptance، به‌همراه گردش‌کار Docker مسیر انتشار live/E2E هنگام اجرای پوشش soak، پاس می‌دهد. این کار بایت‌های بسته را در همه باکس‌های انتشار یکسان نگه می‌دارد و از بسته‌بندی دوباره همان نامزد در چندین job فرزند جلوگیری می‌کند. برای lane زنده npm-plugin مربوط به Codex، release checks یا یک مشخصات Plugin منتشرشده مطابق و استخراج‌شده از `release_package_spec` را پاس می‌دهد، یا `codex_plugin_spec` تأمین‌شده توسط اپراتور را پاس می‌دهد، یا ورودی را خالی می‌گذارد تا اسکریپت Docker، Plugin مربوط به Codex را از checkout انتخاب‌شده بسته‌بندی کند.

اجراهای تکراری `Full Release Validation` برای `ref=main` و `rerun_group=all` چتر قدیمی‌تر را جایگزین می‌کنند. مانیتور والد هر گردش‌کار فرزندی را که از قبل اجرا کرده باشد، هنگام لغو والد لغو می‌کند، بنابراین اعتبارسنجی جدیدتر main پشت یک اجرای release-check دو ساعته قدیمی نمی‌ماند. اعتبارسنجی شاخه/برچسب انتشار و گروه‌های اجرای دوباره متمرکز، `cancel-in-progress: false` را حفظ می‌کنند.

## شاردهای Live و E2E

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
- شاردهای جداشده صوت/ویدیوی رسانه و شاردهای موسیقی فیلترشده بر اساس provider

این کار همان پوشش فایل را حفظ می‌کند و در عین حال اجرای دوباره و تشخیص شکست‌های کند provider زنده را آسان‌تر می‌سازد. نام‌های شارد تجمیعی `native-live-extensions-o-z`، `native-live-extensions-media`، و `native-live-extensions-media-music` همچنان برای اجراهای دوباره دستی یک‌مرحله‌ای معتبر می‌مانند.

شاردهای رسانه live بومی در `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` اجرا می‌شوند، که توسط گردش‌کار `Live Media Runner Image` ساخته شده است. آن image از پیش `ffmpeg` و `ffprobe` را نصب می‌کند؛ jobهای رسانه فقط پیش از setup باینری‌ها را راستی‌آزمایی می‌کنند. مجموعه‌های live مبتنی بر Docker را روی runnerهای عادی Blacksmith نگه دارید؛ jobهای کانتینری جای مناسبی برای راه‌اندازی آزمون‌های Docker تو در تو نیستند.

شاردهای زنده مدل/بک‌اند مبتنی بر Docker برای هر کامیت انتخاب‌شده از یک تصویر مشترک جداگانه `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند. گردش‌کار انتشار زنده آن تصویر را یک‌بار می‌سازد و push می‌کند، سپس شاردهای مدل زنده Docker، Gateway شاردشده بر اساس ارائه‌دهنده، بک‌اند CLI، اتصال ACP و هارنس Codex با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌شوند. شاردهای Docker مربوط به Gateway سقف‌های صریح `timeout` در سطح اسکریپت دارند که کمتر از timeout کار گردش‌کار است، تا یک کانتینر گیرکرده یا مسیر پاک‌سازی به‌جای مصرف کل بودجه بررسی انتشار، سریع شکست بخورد. اگر این شاردها هدف کامل Docker منبع را به‌صورت مستقل دوباره بسازند، اجرای انتشار بدپیکربندی شده و زمان واقعی را صرف ساخت‌های تکراری تصویر خواهد کرد.

## پذیرش بسته

وقتی پرسش این است که «آیا این بسته قابل‌نصب OpenClaw به‌عنوان یک محصول کار می‌کند؟» از `Package Acceptance` استفاده کنید. این با CI معمولی فرق دارد: CI معمولی درخت منبع را اعتبارسنجی می‌کند، در حالی‌که پذیرش بسته یک tarball واحد را از طریق همان هارنس Docker E2E که کاربران پس از نصب یا به‌روزرسانی اجرا می‌کنند اعتبارسنجی می‌کند.

### کارها

1. `resolve_package`، `workflow_ref` را checkout می‌کند، یک نامزد بسته را resolve می‌کند، `.artifacts/docker-e2e-package/openclaw-current.tgz` را می‌نویسد، `.artifacts/docker-e2e-package/package-candidate.json` را می‌نویسد، هر دو را به‌عنوان artifact با نام `package-under-test` بارگذاری می‌کند، و منبع، workflow ref، package ref، نسخه، SHA-256 و پروفایل را در خلاصه مرحله GitHub چاپ می‌کند.
2. `docker_acceptance`، `openclaw-live-and-e2e-checks-reusable.yml` را با `ref=workflow_ref` و `package_artifact_name=package-under-test` فراخوانی می‌کند. گردش‌کار قابل‌استفاده مجدد آن artifact را دانلود می‌کند، فهرست موجودی tarball را اعتبارسنجی می‌کند، در صورت نیاز تصاویر Docker با package-digest را آماده می‌کند، و laneهای Docker انتخاب‌شده را به‌جای بسته‌بندی checkout گردش‌کار، در برابر همان بسته اجرا می‌کند. وقتی یک پروفایل چند `docker_lanes` هدفمند را انتخاب کند، گردش‌کار قابل‌استفاده مجدد بسته و تصاویر مشترک را یک‌بار آماده می‌کند، سپس آن laneها را به‌صورت کارهای Docker هدفمند موازی با artifactهای یکتا پخش می‌کند.
3. `package_telegram` به‌صورت اختیاری `NPM Telegram Beta E2E` را فراخوانی می‌کند. وقتی `telegram_mode` برابر `none` نباشد اجرا می‌شود و همان artifact با نام `package-under-test` را نصب می‌کند، اگر پذیرش بسته یکی را resolve کرده باشد؛ dispatch مستقل Telegram همچنان می‌تواند یک spec منتشرشده npm را نصب کند.
4. `summary` اگر resolve بسته، پذیرش Docker، یا lane اختیاری Telegram شکست خورده باشد، گردش‌کار را fail می‌کند.

### منابع نامزد

- `source=npm` فقط `openclaw@beta`، `openclaw@latest` یا یک نسخه انتشار دقیق OpenClaw مانند `openclaw@2026.4.27-beta.2` را می‌پذیرد. از این گزینه برای پذیرش prerelease/stable منتشرشده استفاده کنید.
- `source=ref` یک شاخه، tag یا SHA کامل کامیتِ قابل‌اعتماد `package_ref` را بسته‌بندی می‌کند. resolver شاخه‌ها/tagهای OpenClaw را fetch می‌کند، بررسی می‌کند کامیت انتخاب‌شده از تاریخچه شاخه repository یا یک tag انتشار قابل‌دسترسی باشد، وابستگی‌ها را در یک worktree جداشده نصب می‌کند، و آن را با `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند.
- `source=url` یک `.tgz` عمومی HTTPS را دانلود می‌کند؛ `package_sha256` الزامی است. این مسیر اطلاعات ورود در URL، پورت‌های HTTPS غیرپیش‌فرض، hostnameها یا IPهای resolve‌شده خصوصی/داخلی/کاربرد ویژه، و redirectهای خارج از همان سیاست ایمنی عمومی را رد می‌کند.
- `source=trusted-url` یک `.tgz` مبتنی بر HTTPS را از یک سیاست trusted-source نام‌گذاری‌شده در `.github/package-trusted-sources.json` دانلود می‌کند؛ `package_sha256` و `trusted_source_id` الزامی هستند. این گزینه را فقط برای mirrorهای enterprise متعلق به نگه‌دارنده یا repositoryهای بسته خصوصی استفاده کنید که به hostها، پورت‌ها، پیشوندهای مسیر، hostهای redirect یا resolve شبکه خصوصی پیکربندی‌شده نیاز دارند. اگر سیاست bearer auth اعلام کند، گردش‌کار از secret ثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN` استفاده می‌کند؛ اطلاعات ورود جاسازی‌شده در URL همچنان رد می‌شود.
- `source=artifact` یک `.tgz` را از `artifact_run_id` و `artifact_name` دانلود می‌کند؛ `package_sha256` اختیاری است اما برای artifactهایی که بیرونی به‌اشتراک گذاشته شده‌اند باید ارائه شود.

`workflow_ref` و `package_ref` را جدا نگه دارید. `workflow_ref` کد گردش‌کار/هارنس قابل‌اعتمادی است که تست را اجرا می‌کند. `package_ref` کامیت منبعی است که وقتی `source=ref` باشد بسته‌بندی می‌شود. این کار به هارنس تست فعلی اجازه می‌دهد کامیت‌های منبع قدیمی‌ترِ قابل‌اعتماد را بدون اجرای منطق گردش‌کار قدیمی اعتبارسنجی کند.

### پروفایل‌های مجموعه

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` به‌علاوه `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunkهای کامل مسیر انتشار Docker با OpenWebUI
- `custom` — مقدار دقیق `docker_lanes`؛ وقتی `suite_profile=custom` باشد الزامی است

پروفایل `package` از پوشش آفلاین Plugin استفاده می‌کند تا اعتبارسنجی بسته منتشرشده به دسترس‌بودن زنده ClawHub وابسته نباشد. lane اختیاری Telegram در `NPM Telegram Beta E2E` از artifact با نام `package-under-test` دوباره استفاده می‌کند، و مسیر spec منتشرشده npm برای dispatchهای مستقل حفظ می‌شود.

برای سیاست اختصاصی تست به‌روزرسانی و Plugin، شامل فرمان‌های محلی،
laneهای Docker، ورودی‌های پذیرش بسته، پیش‌فرض‌های انتشار، و triage شکست،
به [تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.

بررسی‌های انتشار پذیرش بسته را با `source=artifact`، artifact آماده‌شده بسته انتشار، `suite_profile=custom`، `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` و `telegram_mode=mock-openai` فراخوانی می‌کنند. این کار اثبات migration بسته، به‌روزرسانی، نصب Skills زنده ClawHub، پاک‌سازی وابستگی Plugin کهنه، تعمیر نصب Plugin پیکربندی‌شده، Plugin آفلاین، به‌روزرسانی Plugin، و Telegram را روی همان tarball بسته resolve‌شده نگه می‌دارد. پس از انتشار یک beta، `release_package_spec` را روی Full Release Validation یا OpenClaw Release Checks تنظیم کنید تا همان matrix را بدون ساخت دوباره در برابر بسته npm منتشرشده اجرا کند؛ فقط وقتی Package Acceptance به بسته‌ای متفاوت از بقیه اعتبارسنجی انتشار نیاز دارد `package_acceptance_package_spec` را تنظیم کنید. بررسی‌های انتشار cross-OS همچنان onboarding، نصب‌کننده، و رفتار ویژه پلتفرم را پوشش می‌دهند؛ اعتبارسنجی محصول بسته/به‌روزرسانی باید با پذیرش بسته شروع شود. lane Docker با نام `published-upgrade-survivor` در مسیر مسدودکننده انتشار، یک baseline بسته منتشرشده را در هر اجرا اعتبارسنجی می‌کند. در پذیرش بسته، tarball resolve‌شده `package-under-test` همیشه نامزد است و `published_upgrade_survivor_baseline`، baseline منتشرشده fallback را انتخاب می‌کند که به‌صورت پیش‌فرض `openclaw@latest` است؛ فرمان‌های اجرای دوباره laneهای شکست‌خورده آن baseline را حفظ می‌کنند. Full Release Validation با `run_release_soak=true` یا `release_profile=full` مقدار `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` و `published_upgrade_survivor_scenarios=reported-issues` را تنظیم می‌کند تا روی چهار انتشار پایدار آخر npm به‌علاوه انتشارهای pinشده مرز سازگاری Plugin و fixtureهای شبیه issue برای پیکربندی Feishu، فایل‌های bootstrap/persona حفظ‌شده، نصب‌های Plugin پیکربندی‌شده OpenClaw، مسیرهای log با tilde، و ریشه‌های وابستگی Plugin legacy کهنه گسترش یابد. انتخاب‌های published-upgrade survivor با چند baseline بر اساس baseline به کارهای runner هدفمند Docker جداگانه shard می‌شوند. گردش‌کار جداگانه `Update Migration` وقتی پرسش پاک‌سازی کامل به‌روزرسانی منتشرشده است، نه گستره معمول Full Release CI، از lane Docker با نام `update-migration` همراه با `all-since-2026.4.23` و `plugin-deps-cleanup` استفاده می‌کند. اجراهای aggregate محلی می‌توانند specهای دقیق بسته را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ارسال کنند، با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` یک lane واحد مانند `openclaw@2026.4.15` نگه دارند، یا `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` را برای matrix سناریو تنظیم کنند. lane منتشرشده baseline را با یک دستورالعمل پخته‌شده `openclaw config set` پیکربندی می‌کند، گام‌های دستورالعمل را در `summary.json` ثبت می‌کند، و پس از شروع Gateway، `/healthz`، `/readyz` و وضعیت RPC را probe می‌کند. laneهای fresh بسته‌بندی‌شده و نصب‌کننده Windows نیز بررسی می‌کنند که یک بسته نصب‌شده بتواند override کنترل مرورگر را از یک مسیر خام و مطلق Windows import کند. smoke گردش agent-turn مربوط به OpenAI در cross-OS وقتی `OPENCLAW_CROSS_OS_OPENAI_MODEL` تنظیم شده باشد به آن، و در غیر این صورت به `openai/gpt-5.5` پیش‌فرض می‌شود، تا اثبات نصب و Gateway روی یک مدل تست GPT-5 بماند و هم‌زمان از پیش‌فرض‌های GPT-4.x پرهیز شود.

### پنجره‌های سازگاری legacy

پذیرش بسته برای بسته‌های ازقبل‌منتشرشده پنجره‌های محدود سازگاری legacy دارد. بسته‌ها تا `2026.4.25`، شامل `2026.4.25-beta.*`، می‌توانند از مسیر سازگاری استفاده کنند:

- ورودی‌های QA خصوصی شناخته‌شده در `dist/postinstall-inventory.json` ممکن است به فایل‌هایی اشاره کنند که از tarball حذف شده‌اند؛
- `doctor-switch` ممکن است وقتی بسته آن flag را expose نمی‌کند، زیربخش persistence مربوط به `gateway install --wrapper` را skip کند؛
- `update-channel-switch` ممکن است `patchedDependencies` گم‌شده pnpm را از fixture جعلی git مشتق‌شده از tarball prune کند و ممکن است نبود `update.channel` persistشده را log کند؛
- smokeهای Plugin ممکن است مکان‌های legacy رکورد نصب را بخوانند یا نبود persistence رکورد نصب marketplace را بپذیرند؛
- `plugin-update` ممکن است migration metadata پیکربندی را مجاز بداند، در حالی‌که همچنان لازم است رکورد نصب و رفتار بدون نصب دوباره بدون تغییر بمانند.

بسته منتشرشده `2026.4.26` نیز ممکن است برای فایل‌های stamp مربوط به metadata ساخت محلی که از قبل منتشر شده بودند warn کند. بسته‌های بعدی باید قراردادهای مدرن را برآورده کنند؛ همان شرایط به‌جای warn یا skip، fail می‌شوند.

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

هنگام debug یک اجرای ناموفق پذیرش بسته، از خلاصه `resolve_package` شروع کنید تا منبع بسته، نسخه، و SHA-256 را تأیید کنید. سپس اجرای فرزند `docker_acceptance` و artifactهای Docker آن را بررسی کنید: `.artifacts/docker-tests/**/summary.json`، `failures.json`، logهای lane، زمان‌بندی‌های فاز، و فرمان‌های اجرای دوباره. به‌جای اجرای دوباره اعتبارسنجی کامل انتشار، ترجیح دهید پروفایل بسته شکست‌خورده یا laneهای دقیق Docker را دوباره اجرا کنید.

## smoke نصب

گردش‌کار جداگانه `Install Smoke` همان اسکریپت scope را از طریق کار `preflight` خودش دوباره استفاده می‌کند. این گردش‌کار پوشش smoke را به `run_fast_install_smoke` و `run_full_install_smoke` تقسیم می‌کند.

- **مسیر سریع** برای درخواست‌های pull که سطوح Docker/package، تغییرات package/manifest مربوط به Pluginهای bundled، یا سطوح core plugin/channel/gateway/Plugin SDK را که jobهای smoke Docker تمرین می‌کنند لمس می‌کنند اجرا می‌شود. تغییرات فقط-سورس در Pluginهای bundled، ویرایش‌های فقط-تست، و ویرایش‌های فقط-مستندات workerهای Docker را رزرو نمی‌کنند. مسیر سریع image مربوط به root Dockerfile را یک‌بار build می‌کند، CLI را بررسی می‌کند، smoke مربوط به CLI حذف agents در shared-workspace را اجرا می‌کند، e2e مربوط به container gateway-network را اجرا می‌کند، یک bundled extension build arg را تأیید می‌کند، و پروفایل bounded bundled-plugin Docker را زیر timeout تجمیعی ۲۴۰ ثانیه‌ای command اجرا می‌کند (Docker run هر scenario جداگانه محدود می‌شود).
- **مسیر کامل** پوشش QR package install و installer Docker/update را برای اجراهای scheduled شبانه، dispatchهای دستی، release checkهای workflow-call، و درخواست‌های pull که واقعاً سطوح installer/package/Docker را لمس می‌کنند نگه می‌دارد. در حالت کامل، install-smoke یک image smoke مربوط به target-SHA GHCR root Dockerfile را آماده می‌کند یا دوباره به‌کار می‌گیرد، سپس QR package install، smokeهای root Dockerfile/gateway، smokeهای installer/update، و fast bundled-plugin Docker E2E را به‌صورت jobهای جداگانه اجرا می‌کند تا کار installer پشت smokeهای root image منتظر نماند.

pushهای `main` (از جمله merge commitها) مسیر کامل را اجباری نمی‌کنند؛ وقتی منطق changed-scope روی یک push پوشش کامل را درخواست کند، workflow همان fast Docker smoke را نگه می‌دارد و full install smoke را به اعتبارسنجی شبانه یا release واگذار می‌کند.

smoke کند Bun global install image-provider جداگانه با `run_bun_global_install_smoke` gate می‌شود. این smoke روی schedule شبانه و از workflow release checks اجرا می‌شود، و dispatchهای دستی `Install Smoke` می‌توانند آن را فعال کنند، اما درخواست‌های pull و pushهای `main` آن را اجرا نمی‌کنند. CI عادی PR همچنان lane سریع regression مربوط به Bun launcher را برای تغییرات مرتبط با Node اجرا می‌کند. تست‌های QR و installer Docker، Dockerfileهای install-focused خودشان را نگه می‌دارند.

## Docker E2E محلی

`pnpm test:docker:all` یک image مشترک live-test را از پیش build می‌کند، OpenClaw را یک‌بار به‌عنوان npm tarball بسته‌بندی می‌کند، و دو image مشترک `scripts/e2e/Dockerfile` را build می‌کند:

- یک runner خام Node/Git برای laneهای installer/update/plugin-dependency؛
- یک image کاربردی که همان tarball را برای laneهای عادی functionality در `/app` نصب می‌کند.

تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند، منطق planner در `scripts/lib/docker-e2e-plan.mjs` قرار دارد، و runner فقط plan انتخاب‌شده را اجرا می‌کند. scheduler image را برای هر lane با `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` انتخاب می‌کند، سپس laneها را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند.

### تنظیمات قابل تغییر

| متغیر                                  | پیش‌فرض | هدف                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | تعداد slotهای main-pool برای laneهای عادی.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | تعداد slotهای tail-pool حساس به provider.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | سقف laneهای live هم‌زمان تا providerها throttle نکنند.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | سقف laneهای هم‌زمان npm install.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | سقف laneهای هم‌زمان چندسرویسی.                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | فاصله‌گذاری بین شروع laneها برای جلوگیری از طوفان create در Docker daemon؛ برای بدون فاصله `0` تنظیم کنید. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout پشتیبان برای هر lane (۱۲۰ دقیقه)؛ laneهای live/tail انتخاب‌شده سقف‌های سخت‌گیرانه‌تری دارند. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` plan مربوط به scheduler را بدون اجرای laneها چاپ می‌کند.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | فهرست دقیق laneها با جداکننده ویرگول؛ cleanup smoke را رد می‌کند تا agents بتوانند یک lane ناموفق را بازتولید کنند. |

laneای که از سقف مؤثر خود سنگین‌تر است همچنان می‌تواند از یک pool خالی شروع شود، سپس تا وقتی ظرفیت را آزاد کند به‌تنهایی اجرا می‌شود. aggregate محلی Docker را preflight می‌کند، containerهای stale مربوط به OpenClaw E2E را حذف می‌کند، وضعیت active-lane را منتشر می‌کند، زمان‌بندی laneها را برای ordering طولانی‌ترین-اول persist می‌کند، و به‌صورت پیش‌فرض پس از اولین failure زمان‌بندی laneهای pooled جدید را متوقف می‌کند.

### workflow قابل استفاده مجدد live/E2E

workflow قابل استفاده مجدد live/E2E از `scripts/test-docker-all.mjs --plan-json` می‌پرسد کدام package، نوع image، live image، lane، و پوشش credential لازم است. سپس `scripts/docker-e2e.mjs` آن plan را به خروجی‌ها و summaryهای GitHub تبدیل می‌کند. این workflow یا OpenClaw را از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، یا یک package artifact مربوط به اجرای فعلی را دانلود می‌کند، یا یک package artifact را از `package_artifact_run_id` دانلود می‌کند؛ inventory tarball را اعتبارسنجی می‌کند؛ وقتی plan به laneهای package-installed نیاز دارد imageهای bare/functional مربوط به GHCR Docker E2E را با tag بر پایه package-digest از طریق cache لایه Docker مربوط به Blacksmith build و push می‌کند؛ و inputهای ارائه‌شده `docker_e2e_bare_image`/`docker_e2e_functional_image` یا imageهای موجود بر پایه package-digest را به‌جای rebuild دوباره به‌کار می‌گیرد. pullهای Docker image با timeout محدود ۱۸۰ ثانیه‌ای برای هر تلاش retry می‌شوند تا جریان گیرکرده registry/cache سریع retry شود، نه اینکه بیشتر مسیر بحرانی CI را مصرف کند.

### chunkهای مسیر release

پوشش Release Docker jobهای chunked کوچک‌تری را با `OPENCLAW_SKIP_DOCKER_BUILD=1` اجرا می‌کند تا هر chunk فقط نوع image مورد نیاز خودش را pull کند و چند lane را از طریق همان scheduler وزن‌دار اجرا کند:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunkهای فعلی Release Docker عبارت‌اند از `core`، `package-update-openai`، `package-update-anthropic`، `package-update-core`، `plugins-runtime-plugins`، `plugins-runtime-services`، و `plugins-runtime-install-a` تا `plugins-runtime-install-h`. `package-update-openai` شامل lane مربوط به package live Codex plugin است، که package کاندید OpenClaw را نصب می‌کند، Codex plugin را از `codex_plugin_spec` یا یک tarball هم‌ref با approval صریح برای نصب Codex CLI نصب می‌کند، preflight مربوط به Codex CLI را اجرا می‌کند، سپس چند turn از OpenClaw agent در همان session را در برابر OpenAI اجرا می‌کند. `plugins-runtime-core`، `plugins-runtime`، و `plugins-integrations` همچنان aliasهای aggregate مربوط به plugin/runtime هستند. alias مربوط به lane `install-e2e` همچنان alias aggregate rerun دستی برای هر دو lane installer مربوط به provider است.

وقتی پوشش کامل release-path آن را درخواست کند، OpenWebUI در `plugins-runtime-services` ادغام می‌شود، و chunk مستقل `openwebui` را فقط برای dispatchهای فقط-OpenWebUI نگه می‌دارد. laneهای bundled-channel update برای failureهای گذرای شبکه npm یک‌بار retry می‌کنند.

هر chunk، `.artifacts/docker-tests/` را همراه با logهای lane، timingها، `summary.json`، `failures.json`، timingهای phase، JSON مربوط به scheduler plan، جدول‌های slow-lane، و commandهای rerun برای هر lane upload می‌کند. input مربوط به `docker_lanes` در workflow، laneهای انتخاب‌شده را در برابر imageهای آماده‌شده اجرا می‌کند، نه jobهای chunk را؛ این کار debug مربوط به failed-lane را به یک job هدفمند Docker محدود نگه می‌دارد و package artifact را برای آن run آماده، دانلود، یا دوباره به‌کار می‌گیرد؛ اگر lane انتخاب‌شده یک live Docker lane باشد، job هدفمند live-test image را برای آن rerun به‌صورت محلی build می‌کند. commandهای rerun GitHub تولیدشده برای هر lane، وقتی این مقادیر وجود داشته باشند، شامل `package_artifact_run_id`، `package_artifact_name`، و inputهای image آماده‌شده هستند، تا یک lane ناموفق بتواند دقیقاً همان package و imageهای اجرای ناموفق را دوباره به‌کار بگیرد.

```bash
pnpm test:docker:rerun <run-id>      # Docker artifacts را دانلود می‌کند و commandهای rerun هدفمند ترکیبی/برای هر lane را چاپ می‌کند
pnpm test:docker:timings <summary>   # summaryهای slow-lane و phase critical-path
```

workflow scheduled مربوط به live/E2E مجموعه کامل release-path Docker را روزانه اجرا می‌کند.

## Plugin Prerelease

`Plugin Prerelease` پوشش product/package پرهزینه‌تری است، بنابراین workflow جداگانه‌ای است که توسط `Full Release Validation` یا یک operator صریح dispatch می‌شود. درخواست‌های pull عادی، pushهای `main`، و dispatchهای دستی مستقل CI آن suite را خاموش نگه می‌دارند. این workflow تست‌های Plugin bundled را میان هشت worker مربوط به extension متوازن می‌کند؛ آن jobهای extension shard هم‌زمان تا دو گروه config مربوط به Plugin را با یک worker از Vitest برای هر گروه و heap بزرگ‌تر Node اجرا می‌کنند تا batchهای Plugin با import سنگین jobهای CI اضافی ایجاد نکنند. مسیر Docker prerelease فقط-release، laneهای هدفمند Docker را در گروه‌های کوچک batch می‌کند تا از رزرو ده‌ها runner برای jobهای یک تا سه دقیقه‌ای جلوگیری کند. workflow همچنین یک artifact اطلاع‌رسانی `plugin-inspector-advisory` را از `@openclaw/plugin-inspector` upload می‌کند؛ findings مربوط به inspector ورودی triage هستند و gate مسدودکننده Plugin Prerelease را تغییر نمی‌دهند.

## QA Lab

QA Lab laneهای CI اختصاصی خارج از workflow اصلی smart-scoped دارد. parity عامل‌محور زیر harnessهای گسترده QA و release تو در تو قرار دارد، نه یک workflow مستقل PR. وقتی parity باید همراه با یک validation run گسترده اجرا شود، از `Full Release Validation` با `rerun_group=qa-parity` استفاده کنید.

- workflow مربوط به `QA-Lab - All Lanes` شبانه روی `main` و با dispatch دستی اجرا می‌شود؛ این workflow lane مربوط به mock parity، lane مربوط به live Matrix، و laneهای live Telegram و Discord را به‌عنوان jobهای موازی fan out می‌کند. jobهای live از environment مربوط به `qa-live-shared` استفاده می‌کنند، و Telegram/Discord از leaseهای Convex استفاده می‌کنند.

release checkها laneهای transport زنده Matrix و Telegram را با provider قطعی mock و مدل‌های mock-qualified (`mock-openai/gpt-5.5` و `mock-openai/gpt-5.5-alt`) اجرا می‌کنند تا contract کانال از latency مدل live و startup عادی provider-plugin جدا شود. live transport gateway جست‌وجوی memory را غیرفعال می‌کند چون QA parity رفتار memory را جداگانه پوشش می‌دهد؛ connectivity مربوط به provider توسط suiteهای جداگانه live model، native provider، و Docker provider پوشش داده می‌شود.

Matrix برای gateهای scheduled و release از `--profile fast` استفاده می‌کند و فقط وقتی CLI checkout‌شده از آن پشتیبانی کند `--fail-fast` را اضافه می‌کند. مقدار پیش‌فرض CLI و input دستی workflow همچنان `all` است؛ dispatch دستی `matrix_profile=all` همیشه پوشش کامل Matrix را به jobهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep`، و `e2ee-cli` shard می‌کند.

`OpenClaw Release Checks` همچنین laneهای release-critical مربوط به QA Lab را پیش از approval release اجرا می‌کند؛ gate مربوط به QA parity، packهای candidate و baseline را به‌عنوان jobهای lane موازی اجرا می‌کند، سپس هر دو artifact را در یک job report کوچک برای مقایسه parity نهایی دانلود می‌کند.

برای PRهای عادی، به‌جای اینکه parity را وضعیت الزامی بدانید، evidence مربوط به CI/check scoped را دنبال کنید.

## CodeQL

workflow مربوط به `CodeQL` عمداً یک security scanner محدود و first-pass است، نه sweep کامل repository. اجراهای guard روزانه، دستی، و pull requestهای غیر-draft کد workflow مربوط به Actions به‌همراه پرریسک‌ترین سطوح JavaScript/TypeScript را با queryهای امنیتی high-confidence که به `security-severity` بالا/بحرانی filter شده‌اند scan می‌کنند.

guard مربوط به pull request سبک می‌ماند: فقط برای تغییرات زیر `.github/actions`، `.github/codeql`، `.github/workflows`، `packages`، یا `src` شروع می‌شود، و همان matrix امنیتی high-confidence را مانند workflow scheduled اجرا می‌کند. CodeQL مربوط به Android و macOS خارج از پیش‌فرض‌های PR می‌مانند.

### دسته‌بندی‌های امنیتی

| دسته                                             | سطح                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | خط پایه احراز هویت، اسرار، سندباکس، کران و Gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | قراردادهای پیاده‌سازی کانال هسته به‌علاوه زمان‌اجرای Plugin کانال، Gateway، Plugin SDK، اسرار و نقاط تماس ممیزی                 |
| `/codeql-security-high/network-ssrf-boundary`     | سطوح سیاست SSRF هسته، تجزیه IP، محافظ شبکه، وب‌واکشی و SSRF در Plugin SDK                                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | سرورهای MCP، کمک‌کننده‌های اجرای فرایند، تحویل خروجی و گیت‌های اجرای ابزار عامل                                                    |
| `/codeql-security-high/plugin-trust-boundary`     | سطوح اعتماد نصب Plugin، بارگذار، مانیفست، رجیستری، نصب مدیر بسته، بارگذاری منبع و قرارداد بسته Plugin SDK                         |

### شاردهای امنیتی ویژه پلتفرم

- `CodeQL Android Critical Security` — شارد زمان‌بندی‌شده امنیت Android. برنامه Android را برای CodeQL به‌صورت دستی روی کوچک‌ترین رانر Blacksmith Linux پذیرفته‌شده توسط سنجش سلامت گردش‌کار می‌سازد. خروجی را زیر `/codeql-critical-security/android` بارگذاری می‌کند.
- `CodeQL macOS Critical Security` — شارد امنیت macOS هفتگی/دستی. برنامه macOS را برای CodeQL به‌صورت دستی روی Blacksmith macOS می‌سازد، نتایج ساخت وابستگی را از SARIF بارگذاری‌شده فیلتر می‌کند و خروجی را زیر `/codeql-critical-security/macos` بارگذاری می‌کند. بیرون از پیش‌فرض‌های روزانه نگه داشته شده است چون ساخت macOS حتی وقتی پاک باشد، بر زمان اجرا غالب است.

### دسته‌های کیفیت بحرانی

`CodeQL Critical Quality` شارد غیرامنیتی متناظر است. فقط پرس‌وجوهای کیفیت JavaScript/TypeScript غیرامنیتی با شدت خطا را روی سطوح باریک و پرارزش در رانرهای Linux میزبانی‌شده توسط GitHub اجرا می‌کند تا اسکن‌های کیفیت بودجه ثبت رانر Blacksmith را مصرف نکنند. گارد pull request آن عمداً کوچک‌تر از پروفایل زمان‌بندی‌شده است: PRهای غیرپیش‌نویس فقط شاردهای متناظر `agent-runtime-boundary`، `config-boundary`، `core-auth-secrets`، `channel-runtime-boundary`، `gateway-runtime-boundary`، `memory-runtime-boundary`، `mcp-process-runtime-boundary`، `provider-runtime-boundary`، `session-diagnostics-boundary`، `plugin-boundary`، `plugin-sdk-package-contract` و `plugin-sdk-reply-runtime` را برای تغییرات کد اجرای فرمان/مدل/ابزار عامل و ارسال پاسخ، کد طرح‌واره/مهاجرت/ورودی‌وخروجی پیکربندی، کد احراز هویت/اسرار/سندباکس/امنیت، زمان‌اجرای کانال هسته و Plugin کانال باندل‌شده، پروتکل Gateway/متد سرور، چسب زمان‌اجرای حافظه/SDK، MCP/فرایند/تحویل خروجی، کاتالوگ زمان‌اجرای ارائه‌دهنده/مدل، صف‌های عیب‌یابی/تحویل نشست، بارگذار Plugin، قرارداد Plugin SDK/بسته، یا زمان‌اجرای پاسخ Plugin SDK اجرا می‌کنند. تغییرات پیکربندی CodeQL و گردش‌کار کیفیت، هر دوازده شارد کیفیت PR را اجرا می‌کنند.

ارسال دستی می‌پذیرد:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

پروفایل‌های باریک، قلاب‌های آموزش/تکرار برای اجرای یک شارد کیفیت به‌صورت ایزوله هستند.

| دسته                                                   | سطح                                                                                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | کد مرز امنیتی احراز هویت، اسرار، سندباکس، کران و Gateway                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | قراردادهای طرح‌واره پیکربندی، مهاجرت، نرمال‌سازی و ورودی‌وخروجی                                                                                                    |
| `/codeql-critical-quality/gateway-runtime-boundary`     | طرح‌واره‌های پروتکل Gateway و قراردادهای متد سرور                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | قراردادهای پیاده‌سازی کانال هسته و Plugin کانال باندل‌شده                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | اجرای فرمان، ارسال مدل/ارائه‌دهنده، ارسال و صف‌های پاسخ خودکار، و قراردادهای زمان‌اجرای صفحه کنترل ACP                                                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | سرورهای MCP و پل‌های ابزار، کمک‌کننده‌های نظارت بر فرایند، و قراردادهای تحویل خروجی                                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK میزبان حافظه، فاسادهای زمان‌اجرای حافظه، نام‌های مستعار حافظه در Plugin SDK، چسب فعال‌سازی زمان‌اجرای حافظه، و فرمان‌های دکتر حافظه                          |
| `/codeql-critical-quality/session-diagnostics-boundary` | درونیات صف پاسخ، صف‌های تحویل نشست، کمک‌کننده‌های اتصال/تحویل نشست خروجی، سطوح رویداد عیب‌یابی/بسته لاگ، و قراردادهای CLI دکتر نشست                             |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | ارسال پاسخ ورودی Plugin SDK، کمک‌کننده‌های بار پاسخ/تکه‌بندی/زمان‌اجرا، گزینه‌های پاسخ کانال، صف‌های تحویل، و کمک‌کننده‌های اتصال نشست/رشته                     |
| `/codeql-critical-quality/provider-runtime-boundary`    | نرمال‌سازی کاتالوگ مدل، احراز هویت و کشف ارائه‌دهنده، ثبت زمان‌اجرای ارائه‌دهنده، پیش‌فرض‌ها/کاتالوگ‌های ارائه‌دهنده، و رجیستری‌های وب/جست‌وجو/واکشی/جاسازی      |
| `/codeql-critical-quality/ui-control-plane`             | راه‌اندازی Control UI، ماندگاری محلی، جریان‌های کنترل Gateway، و قراردادهای زمان‌اجرای صفحه کنترل وظیفه                                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | قراردادهای زمان‌اجرای واکشی/جست‌وجوی وب هسته، ورودی‌وخروجی رسانه، درک رسانه، تولید تصویر، و تولید رسانه                                                          |
| `/codeql-critical-quality/plugin-boundary`              | قراردادهای بارگذار، رجیستری، سطح عمومی و نقطه ورود Plugin SDK                                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | منبع Plugin SDK سمت بسته منتشرشده و کمک‌کننده‌های قرارداد بسته Plugin                                                                                              |

کیفیت از امنیت جدا می‌ماند تا یافته‌های کیفیت بتوانند بدون مبهم‌کردن سیگنال امنیتی زمان‌بندی، اندازه‌گیری، غیرفعال یا گسترش داده شوند. گسترش CodeQL برای Swift، Python و Pluginهای باندل‌شده فقط پس از پایدار شدن زمان اجرا و سیگنال پروفایل‌های باریک باید به‌عنوان کار پیگیری دامنه‌دار یا شاردشده دوباره اضافه شود.

## گردش‌کارهای نگهداشت

### عامل مستندات

گردش‌کار `Docs Agent` یک مسیر نگهداشت رویدادمحور Codex برای همسو نگه داشتن مستندات موجود با تغییرات تازه فرودآمده است. زمان‌بندی خالص ندارد: اجرای موفق CI پوش غیررباتی روی `main` می‌تواند آن را فعال کند، و ارسال دستی می‌تواند آن را مستقیماً اجرا کند. فراخوانی‌های workflow-run وقتی `main` جلو رفته باشد یا وقتی اجرای غیرردشده دیگری از Docs Agent در یک ساعت گذشته ایجاد شده باشد، رد می‌شوند. هنگام اجرا، بازه کامیت را از SHA منبع قبلی Docs Agent که رد نشده تا `main` فعلی بررسی می‌کند، بنابراین یک اجرای ساعتی می‌تواند همه تغییرات main انباشته‌شده از آخرین گذر مستندات را پوشش دهد.

### عامل عملکرد تست

گردش‌کار `Test Performance Agent` یک مسیر نگهداشت رویدادمحور Codex برای تست‌های کند است. زمان‌بندی خالص ندارد: اجرای موفق CI پوش غیررباتی روی `main` می‌تواند آن را فعال کند، اما اگر فراخوانی workflow-run دیگری در همان روز UTC قبلاً اجرا شده یا در حال اجرا باشد، رد می‌شود. ارسال دستی این گیت فعالیت روزانه را دور می‌زند. این مسیر یک گزارش عملکرد Vitest گروه‌بندی‌شده برای مجموعه کامل می‌سازد، به Codex اجازه می‌دهد فقط اصلاحات کوچک عملکرد تست با حفظ پوشش انجام دهد، نه بازآرایی‌های گسترده، سپس گزارش مجموعه کامل را دوباره اجرا می‌کند و تغییراتی را که شمار پایه تست‌های موفق را کاهش دهند رد می‌کند. گزارش گروه‌بندی‌شده زمان دیواری هر پیکربندی و بیشینه RSS را روی Linux و macOS ثبت می‌کند، بنابراین مقایسه قبل/بعد دلتاهای حافظه تست را کنار دلتاهای مدت‌زمان نشان می‌دهد. اگر خط پایه تست‌های ناموفق داشته باشد، Codex فقط می‌تواند شکست‌های آشکار را اصلاح کند و گزارش مجموعه کامل پس از عامل باید پیش از کامیت شدن هر چیز موفق شود. وقتی `main` پیش از فرود پوش ربات جلو برود، این مسیر پچ اعتبارسنجی‌شده را rebase می‌کند، `pnpm check:changed` را دوباره اجرا می‌کند و پوش را تکرار می‌کند؛ پچ‌های کهنه متعارض رد می‌شوند. از Ubuntu میزبانی‌شده توسط GitHub استفاده می‌کند تا اکشن Codex بتواند همان وضعیت ایمنی drop-sudo عامل مستندات را حفظ کند.

### PRهای تکراری پس از ادغام

گردش‌کار `Duplicate PRs After Merge` یک گردش‌کار دستی نگه‌دارنده برای پاک‌سازی تکراری‌ها پس از فرود است. پیش‌فرض آن dry-run است و فقط وقتی `apply=true` باشد PRهای صراحتاً فهرست‌شده را می‌بندد. پیش از تغییر GitHub، تأیید می‌کند که PR فرودآمده ادغام شده است و هر تکراری یا issue ارجاع‌شده مشترک دارد یا هانک‌های تغییریافته هم‌پوشان دارد.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## گیت‌های بررسی محلی و مسیریابی تغییرات

منطق lane تغییرات محلی در `scripts/changed-lanes.mjs` قرار دارد و توسط `scripts/check-changed.mjs` اجرا می‌شود. آن گیت بررسی محلی نسبت به دامنه گسترده پلتفرم CI درباره مرزهای معماری سخت‌گیرتر است:

- تغییرات تولید هسته، typecheck تولید هسته و تست هسته به‌علاوه lint/guardهای هسته را اجرا می‌کنند؛
- تغییرات فقط تست هسته، فقط typecheck تست هسته به‌علاوه lint هسته را اجرا می‌کنند؛
- تغییرات تولید extension، typecheck تولید extension و تست extension به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات فقط تست extension، typecheck تست extension به‌علاوه lint extension را اجرا می‌کنند؛
- تغییرات عمومی Plugin SDK یا قرارداد Plugin به typecheck extension گسترش می‌یابند چون extensionها به آن قراردادهای هسته وابسته‌اند (جاروب‌های extension در Vitest کار تست صریح باقی می‌مانند)؛
- افزایش نسخه فقط فراداده انتشار، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی ریشه را اجرا می‌کند؛
- تغییرات ناشناخته ریشه/پیکربندی به‌صورت fail safe به همه laneهای بررسی می‌روند.

مسیریابی تست تغییرات محلی در `scripts/test-projects.test-support.mjs` قرار دارد و عمداً ارزان‌تر از `check:changed` است: ویرایش‌های مستقیم تست خودشان اجرا می‌شوند، ویرایش‌های منبع ابتدا نگاشت‌های صریح را ترجیح می‌دهند، سپس تست‌های هم‌سطح و وابسته‌های گراف import را. پیکربندی تحویل group-room مشترک یکی از نگاشت‌های صریح است: تغییرات در پیکربندی پاسخ قابل‌مشاهده برای گروه، حالت تحویل پاسخ منبع، یا prompt سیستمی ابزار پیام از مسیر تست‌های پاسخ هسته به‌علاوه رگرسیون‌های تحویل Discord و Slack عبور می‌کنند تا تغییر پیش‌فرض مشترک پیش از نخستین پوش PR شکست بخورد. فقط وقتی تغییر به‌اندازه کافی در سطح harness گسترده است که مجموعه نگاشت‌شده ارزان نماینده قابل‌اعتمادی نیست، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.

## اعتبارسنجی Testbox

Crabbox wrapper ریموت‌باکس متعلق به repo برای اثبات Linux نگه‌دارنده است. وقتی یک بررسی برای حلقه ویرایش محلی بیش از حد گسترده است، وقتی هم‌ترازی CI اهمیت دارد، یا وقتی اثبات به اسرار، Docker، laneهای بسته، باکس‌های قابل‌استفاده مجدد یا لاگ‌های راه‌دور نیاز دارد، آن را از ریشه repo استفاده کنید. backend عادی OpenClaw، `blacksmith-testbox` است؛ ظرفیت AWS/Hetzner تحت مالکیت، fallback برای قطعی‌های Blacksmith، مشکلات سهمیه، یا تست صریح با ظرفیت تحت مالکیت است.

اجرای Blacksmith با پشتوانه Crabbox، Testboxهای یک‌باره را گرم می‌کند، claim می‌کند، همگام‌سازی می‌کند، اجرا می‌کند، گزارش می‌دهد و پاک‌سازی می‌کند. بررسی سلامت همگام‌سازی داخلی وقتی فایل‌های ریشه‌ای لازم مانند `pnpm-lock.yaml` ناپدید شوند یا وقتی `git status --short` دست‌کم ۲۰۰ حذف ردیابی‌شده را نشان دهد، سریع شکست می‌خورد. برای PRهای عمدی با حذف‌های گسترده، برای فرمان راه دور `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` را تنظیم کنید.

Crabbox همچنین اجرای محلی Blacksmith CLI را که بیش از پنج دقیقه بدون خروجی پس از همگام‌سازی در مرحله همگام‌سازی بماند، پایان می‌دهد. برای غیرفعال کردن این محافظ، `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` را تنظیم کنید، یا برای diffهای محلی غیرمعمول بزرگ، مقدار بزرگ‌تری بر حسب میلی‌ثانیه استفاده کنید.

پیش از اولین اجرا، wrapper را از ریشه repo بررسی کنید:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper repo یک باینری قدیمی Crabbox را که `blacksmith-testbox` را اعلام نمی‌کند، رد می‌کند. provider را صریح ارسال کنید، حتی با اینکه `.crabbox.yaml` پیش‌فرض‌های owned-cloud دارد. در worktreeهای Codex یا checkoutهای linked/sparse، از اسکریپت محلی `pnpm crabbox:run` پرهیز کنید، چون pnpm ممکن است پیش از شروع Crabbox وابستگی‌ها را reconcile کند؛ به‌جای آن wrapper node را مستقیم فراخوانی کنید:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

اجرای با پشتوانه Blacksmith به Crabbox 0.22.0 یا جدیدتر نیاز دارد تا wrapper رفتار فعلی همگام‌سازی، صف و پاک‌سازی Testbox را دریافت کند. هنگام استفاده از checkout هم‌سطح، پیش از کار زمان‌سنجی یا اثبات، باینری محلی نادیده‌گرفته‌شده را دوباره بسازید:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

دروازه تغییرات:

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

خلاصه نهایی JSON را بخوانید. فیلدهای مفید `provider`، `leaseId`، `syncDelegated`، `exitCode`، `commandMs` و `totalMs` هستند. اجرای یک‌باره Crabbox با پشتوانه Blacksmith باید Testbox را به‌صورت خودکار متوقف کند؛ اگر اجرا قطع شد یا پاک‌سازی نامشخص بود، boxهای زنده را بررسی کنید و فقط boxهایی را که خودتان ساخته‌اید متوقف کنید:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

فقط زمانی از reuse استفاده کنید که عمدا به چند فرمان روی همان box آب‌دهی‌شده نیاز دارید:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

اگر Crabbox لایه خراب است اما خود Blacksmith کار می‌کند، از Blacksmith مستقیم فقط برای عیب‌یابی‌هایی مانند `list`، `status` و پاک‌سازی استفاده کنید. پیش از اینکه اجرای مستقیم Blacksmith را به‌عنوان اثبات نگه‌دارنده تلقی کنید، مسیر Crabbox را اصلاح کنید.

اگر `blacksmith testbox list --all` و `blacksmith testbox status` کار می‌کنند اما warmupهای جدید پس از چند دقیقه بدون IP یا URL اجرای Actions در وضعیت `queued` می‌مانند، آن را فشار provider، صف، billing یا محدودیت سازمانی Blacksmith تلقی کنید. idهای صف‌شده‌ای را که ساخته‌اید متوقف کنید، از شروع Testboxهای بیشتر پرهیز کنید، و اثبات را به مسیر ظرفیت owned Crabbox در پایین منتقل کنید تا هم‌زمان فردی داشبورد Blacksmith، billing و محدودیت‌های سازمانی را بررسی کند.

فقط زمانی به ظرفیت owned Crabbox escalation کنید که Blacksmith قطع باشد، محدودیت سهمیه داشته باشد، محیط لازم را نداشته باشد، یا ظرفیت owned صراحتا هدف باشد:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

زیر فشار AWS، از `class=beast` پرهیز کنید مگر اینکه کار واقعا به CPU در کلاس 48xlarge نیاز داشته باشد. درخواست `beast` از ۱۹۲ vCPU شروع می‌شود و ساده‌ترین راه برای فعال کردن سهمیه منطقه‌ای EC2 Spot یا On-Demand Standard است. `.crabbox.yaml` متعلق به repo به‌صورت پیش‌فرض از `standard`، چند منطقه ظرفیت و `capacity.hints: true` استفاده می‌کند تا leaseهای AWS واسطه‌شده، منطقه/بازار انتخاب‌شده، فشار سهمیه، fallback به Spot و هشدارهای کلاس پرفشار را چاپ کنند. برای بررسی‌های گسترده سنگین‌تر از `fast` استفاده کنید، فقط پس از کافی نبودن standard/fast سراغ `large` بروید، و `beast` را فقط برای laneهای استثنایی CPU-bound مانند full-suite یا ماتریس‌های Docker همه Pluginها، اعتبارسنجی صریح release/blocker یا پروفایل‌گیری عملکرد با هسته‌های زیاد به کار ببرید. از `beast` برای `pnpm check:changed`، تست‌های متمرکز، کارهای فقط مستندات، lint/typecheck معمول، بازتولیدهای E2E کوچک یا triage قطعی Blacksmith استفاده نکنید. برای تشخیص ظرفیت از `--market on-demand` استفاده کنید تا نوسان بازار Spot با سیگنال مخلوط نشود.

`.crabbox.yaml` مالک پیش‌فرض‌های provider، همگام‌سازی و آب‌دهی GitHub Actions برای laneهای owned-cloud است. این فایل `.git` محلی را مستثنا می‌کند تا checkout آب‌دهی‌شده Actions به‌جای همگام‌سازی remoteها و object storeهای محلی نگه‌دارنده، metadata Git راه دور خودش را نگه دارد، و artifactهای runtime/build محلی را که هرگز نباید منتقل شوند مستثنا می‌کند. `.github/workflows/crabbox-hydrate.yml` مالک checkout، تنظیم Node/pnpm، fetch کردن `origin/main` و handoff محیط غیرمحرمانه برای فرمان‌های owned-cloud `crabbox run --id <cbx_id>` است.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [کانال‌های توسعه](/fa/install/development-channels)

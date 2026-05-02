---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تستكشف أخطاء فحص فاشل في GitHub Actions وتصلحها
    - أنت تنسّق تشغيلًا أو إعادة تشغيل لعملية التحقق من الإصدار
    - تقوم بتغيير إرسال ClawSweeper أو إعادة توجيه نشاط GitHub
summary: مخطط مهام CI، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-05-02T20:41:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI يعمل عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفروقات وتوقف المسارات المكلفة عندما تتغير مناطق غير مرتبطة فقط. تتجاوز عمليات `workflow_dispatch` اليدوية النطاق الذكي عمدًا وتوسّع الرسم البياني الكامل لمرشحي الإصدار والتحقق الواسع. تبقى مسارات Android اختيارية عبر `include_android`. توجد تغطية Plugin الخاصة بالإصدارات فقط في سير العمل المنفصل [`Plugin Prerelease`](#plugin-prerelease)، ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على خط الأنابيب

| المهمة | الغرض | متى تعمل |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | اكتشاف تغييرات التوثيق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI | دائمًا على عمليات الدفع وطلبات السحب غير المسودة |
| `security-scm-fast` | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor` | دائمًا على عمليات الدفع وطلبات السحب غير المسودة |
| `security-dependency-audit` | تدقيق ملف قفل الإنتاج من دون تبعيات مقابل تنبيهات npm | دائمًا على عمليات الدفع وطلبات السحب غير المسودة |
| `security-fast` | تجميع مطلوب لمهام الأمان السريعة | دائمًا على عمليات الدفع وطلبات السحب غير المسودة |
| `check-dependencies` | تمرير Knip مخصص لتبعيات الإنتاج فقط مع حارس قائمة السماح للملفات غير المستخدمة | التغييرات ذات الصلة بـ Node |
| `build-artifacts` | بناء `dist/`، وواجهة Control UI، وفحوصات الأثر المبني، والآثار القابلة لإعادة الاستخدام في المراحل اللاحقة | التغييرات ذات الصلة بـ Node |
| `checks-fast-core` | مسارات صحة Linux السريعة مثل فحوصات المضمنة/عقد Plugin/البروتوكول | التغييرات ذات الصلة بـ Node |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات المقسمة إلى أجزاء مع نتيجة فحص تجميعية ثابتة | التغييرات ذات الصلة بـ Node |
| `checks-node-core-test` | أجزاء اختبارات Node الأساسية، مع استثناء مسارات القنوات والمضمنة والعقود والإضافات | التغييرات ذات الصلة بـ Node |
| `check` | مكافئ البوابة المحلية الرئيسية المقسمة: أنواع الإنتاج، والlint، والحراس، وأنواع الاختبارات، واختبار دخاني صارم | التغييرات ذات الصلة بـ Node |
| `check-additional` | أجزاء البنية، والحدود، وحراس سطح الإضافات، وحدود الحزم، وgateway-watch | التغييرات ذات الصلة بـ Node |
| `build-smoke` | اختبارات دخانية لـ CLI المبني واختبار دخاني لذاكرة بدء التشغيل | التغييرات ذات الصلة بـ Node |
| `checks` | متحقق لاختبارات قنوات الأثر المبني | التغييرات ذات الصلة بـ Node |
| `checks-node-compat-node22` | مسار بناء واختبار دخاني لتوافق Node 22 | تشغيل CI يدوي للإصدارات |
| `check-docs` | تنسيق التوثيق، والlint، وفحوصات الروابط المعطلة | عند تغيّر التوثيق |
| `skills-python` | Ruff + pytest للـ Skills المدعومة بـ Python | التغييرات ذات الصلة بـ Skills في Python |
| `checks-windows` | اختبارات العمليات/المسارات الخاصة بـ Windows إضافة إلى تراجعات محددات استيراد وقت التشغيل المشتركة | التغييرات ذات الصلة بـ Windows |
| `macos-node` | مسار اختبار TypeScript على macOS باستخدام الآثار المبنية المشتركة | التغييرات ذات الصلة بـ macOS |
| `macos-swift` | Swift lint والبناء والاختبارات لتطبيق macOS | التغييرات ذات الصلة بـ macOS |
| `android` | اختبارات وحدات Android لكلا النكهتين إضافة إلى بناء debug APK واحد | التغييرات ذات الصلة بـ Android |
| `test-performance-agent` | تحسين يومي لاختبارات Codex البطيئة بعد نشاط موثوق | نجاح CI الرئيسي أو التشغيل اليدوي |
| `openclaw-performance` | تقارير أداء وقت تشغيل Kova اليومية/عند الطلب مع مسارات mock-provider وdeep-profile وGPT 5.4 الحية | مجدول وتشغيل يدوي |

## ترتيب الفشل السريع

1. يقرر `preflight` أي المسارات موجودة أصلًا. منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليست مهامًا مستقلة.
2. تفشل `security-scm-fast`، و`security-dependency-audit`، و`security-fast`، و`check`، و`check-additional`، و`check-docs`، و`skills-python` بسرعة من دون انتظار مهام الآثار ومصفوفة المنصات الأثقل.
3. يتداخل `build-artifacts` مع مسارات Linux السريعة حتى يتمكن المستهلكون اللاحقون من البدء بمجرد أن يصبح البناء المشترك جاهزًا.
4. بعد ذلك تتوسع مسارات المنصات ووقت التشغيل الأثقل: `checks-fast-core`، و`checks-fast-contracts-channels`، و`checks-node-core-test`، و`checks`، و`checks-windows`، و`macos-node`، و`macos-swift`، و`android`.

قد يعلّم GitHub المهام التي تجاوزتها دفعة أحدث على أنها `cancelled` عندما تصل دفعة أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI إلا إذا كان أحدث تشغيل للمرجع نفسه يفشل أيضًا. تستخدم فحوصات الأجزاء التجميعية `!cancelled() && always()` كي تستمر في الإبلاغ عن إخفاقات الأجزاء العادية، لكنها لا تصطف بعد أن يكون سير العمل كله قد تم تجاوزه بالفعل. مفتاح تزامن CI التلقائي ممهور بإصدار (`CI-v7-*`) حتى لا تتمكن حالة عالقة من جهة GitHub في مجموعة طابور قديمة من حظر تشغيلات main الأحدث إلى أجل غير مسمى. تستخدم التشغيلات اليدوية للمجموعة الكاملة `CI-manual-v1-*` ولا تلغي التشغيلات الجارية.

## النطاق والتوجيه

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدات في `src/scripts/ci-changed-scope.test.ts`. يتخطى التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة محددة النطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node إضافة إلى lint سير العمل، لكنها لا تفرض بناءات Windows أو Android أو macOS الأصلية بذاتها؛ تبقى مسارات تلك المنصات مقيدة بتغييرات مصدر المنصة.
- **تعديلات التوجيه فقط في CI، وتعديلات محددة لرخص اختبارات core-test الرخيصة، وتعديلات ضيقة لمساعد/توجيه اختبارات عقد Plugin** تستخدم مسار بيان سريعًا خاصًا بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتخطى ذلك المسار آثار البناء، وتوافق Node 22، وعقود القنوات، وأجزاء النواة الكاملة، وأجزاء Plugin المضمنة، ومصفوفات الحراس الإضافية عندما يكون التغيير محدودًا بأسطح التوجيه أو المساعد التي تمارسها المهمة السريعة مباشرة.
- **فحوصات Windows Node** مقيدة بملفات تغليف العمليات/المسارات الخاصة بـ Windows، ومساعدات مشغلات npm/pnpm/UI، وإعدادات مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر وPlugin واختبارات install-smoke والاختبارات فقط غير المرتبطة على مسارات Linux Node.

أبطأ عائلات اختبارات Node مقسمة أو موزونة بحيث تبقى كل مهمة صغيرة من دون حجز مفرط للمشغلات: تعمل عقود القنوات كثلاثة أجزاء موزونة، وتُقرن مسارات وحدات النواة الصغيرة، ويعمل الرد التلقائي كأربعة عاملين موزونين (مع تقسيم شجرة الرد الفرعية إلى أجزاء agent-runner وdispatch وcommands/state-routing)، وتوزع إعدادات agentic gateway/plugin عبر مهام agentic Node الحالية الخاصة بالمصدر فقط بدل انتظار الآثار المبنية. تستخدم اختبارات المتصفح الواسعة وQA والوسائط واختبارات Plugin المتنوعة إعدادات Vitest المخصصة لها بدل التجميع العام المشترك لـ Plugin. تسجل أجزاء أنماط التضمين إدخالات التوقيت باستخدام اسم جزء CI، حتى يتمكن `.artifacts/vitest-shard-timings.json` من التمييز بين إعداد كامل وجزء مفلتر. يبقي `check-additional` عمل تجميع/اختبار حدود الحزمة معًا ويفصل بنية طوبولوجيا وقت التشغيل عن تغطية gateway watch؛ ويشغل جزء حارس الحدود حراسه الصغيرة المستقلة بالتزامن داخل مهمة واحدة. تعمل gateway watch، واختبارات القنوات، وجزء حدود دعم النواة بالتزامن داخل `build-artifacts` بعد أن يكون `dist/` و`dist-runtime/` قد بُنيا بالفعل.

يشغل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني Play debug APK. لا تملك نكهة الطرف الثالث مجموعة مصدر أو بيانًا منفصلًا؛ لا يزال مسار اختبار الوحدات الخاص بها يجمّع النكهة مع أعلام BuildConfig للرسائل القصيرة/سجل المكالمات، مع تجنب مهمة تغليف debug APK مكررة عند كل دفعة ذات صلة بـ Android.

يشغل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمرير Knip مخصص لتبعيات الإنتاج فقط ومثبت على أحدث إصدار Knip، مع تعطيل الحد الأدنى لعمر الإصدار في pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip لملفات الإنتاج غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم وغير مراجع أو يترك إدخالًا قديمًا في قائمة السماح، مع الحفاظ على أسطح Plugin الديناميكية والمولدة والبناء والاختبارات الحية وجسور الحزم المقصودة التي لا يستطيع Knip حلها ساكنًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر من جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يقوم بسحب أو تنفيذ شيفرة طلبات السحب غير الموثوقة. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مدمجة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة المشكلات وطلبات السحب الدقيقة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات المشكلات؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` بيانات وصفية موحدة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدًا تمرير جسم Webhook الكامل. سير العمل المستقبِل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، والذي ينشر الحدث الموحد إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام للمراقبة، وليس للتسليم افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في موجهه وينبغي أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا أو قابلًا للإجراء أو محفوفًا بالمخاطر أو مفيدًا تشغيليًا. يجب أن تؤدي عمليات الفتح والتعديلات ودوران الروبوتات وضجيج Webhook المكرر وحركة المراجعات العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub وتعليقاته وأجسامه ونصوص المراجعات وأسماء الفروع ورسائل الالتزام كبيانات غير موثوقة طوال هذا المسار. إنها مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## عمليات التشغيل اليدوية

تُشغّل عمليات إرسال CI اليدوية مخطط الوظائف نفسه الذي تشغّله CI العادية، لكنها تفرض تشغيل كل مسار غير محدود بـ Android: شظايا Linux Node، وشظايا Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء السريع، وفحوصات الوثائق، وPython skills، وWindows، وmacOS، وControl UI i18n. تشغّل عمليات إرسال CI اليدوية المستقلة Android فقط مع `include_android=true`؛ وتمكّن مظلة الإصدار الكاملة Android عبر تمرير `include_android=true`. تُستثنى من CI فحوصات Plugin prerelease الثابتة، وشظية `agentic-plugins` الخاصة بالإصدار فقط، والفحص الدفعي الكامل للإضافات، ومسارات Docker الخاصة بـ Plugin prerelease. لا تعمل حزمة Docker prerelease إلا عندما ترسل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة التحقق من الإصدار.

تستخدم عمليات التشغيل اليدوية مجموعة تزامن فريدة حتى لا تُلغى الحزمة الكاملة لمرشح الإصدار بسبب تشغيل دفع أو PR آخر على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك المخطط على فرع أو وسم أو SHA التزام كامل، مع استخدام ملف سير العمل من مرجع الإرسال المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                           | الوظائف                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، ووظائف الأمان السريعة والتجميعات (`security-scm-fast`، و`security-dependency-audit`، و`security-fast`)، وفحوصات البروتوكول/العقود/المضمّنات السريعة، وفحوصات عقود القنوات المقسّمة، وشظايا `check` باستثناء lint، وشظايا `check-additional` وتجميعاتها، ومحققات تجميع اختبارات Node، وفحوصات الوثائق، وPython skills، وworkflow-sanity، وlabeler، وauto-response؛ كما يستخدم تمهيد install-smoke أيضًا Ubuntu المستضاف على GitHub حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكرًا |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وشظايا الإضافات الأخف وزنًا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وشظايا اختبارات Linux Node، وشظايا اختبارات Plugin المضمّنة، و`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حساس لاستخدام CPU بما يكفي لأن 8 vCPU كلّفت أكثر مما وفّرت)؛ وبناءات Docker الخاصة بـ install-smoke (كلّف وقت انتظار 32-vCPU أكثر مما وفّر)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` على `openclaw/openclaw`؛ تعود forks إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` على `openclaw/openclaw`؛ تعود forks إلى `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## المكافئات المحلية

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## أداء OpenClaw

`OpenClaw Performance` هو سير عمل أداء المنتج/وقت التشغيل. يعمل يوميًا على `main` ويمكن إرساله يدويًا:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

يثبّت سير العمل OCM من إصدار مثبّت، وKova من إدخال `kova_ref` المثبّت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات Kova التشخيصية مقابل وقت تشغيل مبني محليًا مع مصادقة وهمية حتمية متوافقة مع OpenAI.
- `mock-deep-profile`: تحليل أداء CPU/heap/trace لنقاط الاختناق في بدء التشغيل، وGateway، ودورة agent.
- `live-gpt54`: دورة agent حقيقية من OpenAI `openai/gpt-5.4`، تُتخطى عندما لا يكون `OPENAI_API_KEY` متاحًا.

يشغّل مسار mock-provider أيضًا فحوصات مصدرية أصلية من OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، وhook، و50-Plugin؛ وحلقات hello متكررة لـ `channel-chat-baseline` باستخدام mock-OpenAI؛ وأوامر بدء CLI مقابل Gateway الذي تم إقلاعه. يوجد ملخص Markdown لفحص المصدر في `source/index.md` داخل حزمة التقرير، وبجواره JSON الخام.

يرفع كل مسار عناصر GitHub الأثرية. عند تكوين `CLAWGRIT_REPORTS_TOKEN`، يلتزم سير العمل أيضًا بـ `report.json`، و`report.md`، والحزم، و`index.md`، وعناصر فحص المصدر الأثرية إلى `openclaw/clawgrit-reports` تحت `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر الفرع الحالي باسم `openclaw-performance/<ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي المظلّي لـ "تشغيل كل شيء قبل الإصدار." يقبل فرعًا أو وسمًا أو SHA التزام كاملًا، ويرسل سير عمل `CI` اليدوي بذلك الهدف، ويرسل `Plugin Prerelease` لإثباتات Plugin/الحزمة/الثابتة/Docker الخاصة بالإصدار فقط، ويرسل `OpenClaw Release Checks` لفحص التثبيت السريع، وقبول الحزمة، وحزم مسار إصدار Docker، وlive/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. مع `rerun_group=all` و`release_profile=full`، يشغّل أيضًا `NPM Telegram Beta E2E` مقابل عنصر `release-package-under-test` الأثري من فحوصات الإصدار. بعد النشر، مرّر `npm_telegram_package_spec` لإعادة تشغيل مسار حزمة Telegram نفسه مقابل حزمة npm المنشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء وظائف سير العمل الدقيقة، وفروق الملفات التعريفية، والعناصر الأثرية، ومقابض إعادة التشغيل
المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يُحدث تغييرات. أرسله
من `release/YYYY.M.D` أو `main` بعد وجود وسم الإصدار وبعد نجاح
تمهيد OpenClaw npm. يتحقق من `pnpm plugins:sync:check`،
ويرسل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويرسل
`Plugin ClawHub Release` للـ SHA نفسه الخاص بالإصدار، وبعد ذلك فقط يرسل
`OpenClaw NPM Release` مع `preflight_run_id` المحفوظ.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

لإثبات التزام مثبت على فرع سريع الحركة، استخدم المساعد بدلًا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع إرسال سير عمل GitHub فروعًا أو وسومًا، وليست SHA التزامات خامًا. يدفع
المساعد فرعًا مؤقتًا `release-ci/<sha>-...` عند SHA الهدف،
ويرسل `Full Release Validation` من ذلك المرجع المثبت، ويتحقق من أن كل
`headSha` لسير عمل تابع يطابق الهدف، ويحذف الفرع المؤقت عند
اكتمال التشغيل. يفشل محقق المظلة أيضًا إذا عمل أي سير عمل تابع عند
SHA مختلف.

يتحكم `release_profile` في اتساع live/provider الذي يُمرر إلى فحوصات الإصدار. تكون
القيمة الافتراضية لسير عمل الإصدار اليدوي هي `stable`؛ استخدم `full` فقط عندما
تريد عمدًا مصفوفة provider/media الاستشارية الواسعة.

- `minimum` يحافظ على أسرع مسارات OpenAI/core الحرجة للإصدار.
- `stable` يضيف مجموعة provider/backend المستقرة.
- `full` يشغّل مصفوفة provider/media الاستشارية الواسعة.

تسجل المظلة معرفات التشغيل التابعة المرسلة، وتعيد وظيفة `Verify full validation` النهائية فحص نتائج التشغيل الحالية التابعة وتلحق جداول أبطأ الوظائف لكل تشغيل تابع. إذا أُعيد تشغيل سير عمل تابع وأصبح أخضر، فأعد تشغيل وظيفة محقق الأصل فقط لتحديث نتيجة المظلة وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` للفرع الابن العادي الخاص بـ CI الكامل فقط، و`plugin-prerelease` للفرع الابن الخاص بالإصدار التمهيدي للـ plugin فقط، و`release-checks` لكل فرع إصدار ابن، أو مجموعة أضيق: `install-smoke`، أو `cross-os`، أو `live-e2e`، أو `package`، أو `qa`، أو `qa-parity`، أو `qa-live`، أو `npm-telegram` على المظلة. هذا يبقي إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test` بصيغة tarball، ثم يمرر ذلك الأثر إلى كل من سير عمل Docker الخاص بمسار الإصدار الحي/E2E وجزء قبول الحزمة. هذا يحافظ على اتساق بايتات الحزمة عبر صناديق الإصدار ويتجنب إعادة تغليف المرشح نفسه في عدة مهام ابنة.

عمليات تشغيل `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تحل محل المظلة الأقدم. يلغي مراقب الأصل أي سير عمل ابن
سبق أن أرسله عندما يُلغى الأصل، بحيث لا ينتظر تحقق main الأحدث
خلف تشغيل قديم لفحص الإصدار مدته ساعتان. يحافظ تحقق فرع/وسم
الإصدار ومجموعات إعادة التشغيل المركزة على `cancel-in-progress: false`.

## أجزاء الاختبارات الحية وE2E

يحافظ الفرع الابن الحي/E2E للإصدار على تغطية أصلية واسعة عبر `pnpm test:live`، لكنه يشغلها كأجزاء مسماة عبر `scripts/test-live-shard.mjs` بدلا من مهمة تسلسلية واحدة:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- مهام `native-live-src-gateway-profiles` المفلترة حسب المزوّد
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- أجزاء وسائط الصوت/الفيديو المقسمة وأجزاء الموسيقى المفلترة حسب المزوّد

هذا يحافظ على تغطية الملفات نفسها مع جعل أعطال المزوّدين الحية البطيئة أسهل في إعادة التشغيل والتشخيص. تبقى أسماء الأجزاء المجمعة `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لعمليات إعادة التشغيل اليدوية لمرة واحدة.

تعمل أجزاء الوسائط الحية الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبنية بواسطة سير عمل `Live Media Runner Image`. تثبت تلك الصورة مسبقا `ffmpeg` و`ffprobe`؛ ولا تتحقق مهام الوسائط إلا من الثنائيات قبل الإعداد. أبق مجموعات الاختبار الحية المدعومة بـ Docker على مشغلات Blacksmith العادية — مهام الحاويات ليست المكان الصحيح لتشغيل اختبارات Docker المتداخلة.

تستخدم أجزاء النماذج/الخلفيات الحية المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل تثبيت محدد. يبني سير عمل الإصدار الحي تلك الصورة ويدفعها مرة واحدة، ثم تعمل أجزاء نموذج Docker الحي، وGateway المقسمة حسب المزوّد، وخلفية CLI، وربط ACP، وحزمة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل أجزاء Gateway Docker حدود `timeout` صريحة على مستوى السكربت أقل من مهلة مهمة سير العمل كي تفشل حاوية عالقة أو مسار تنظيف بسرعة بدلا من استهلاك ميزانية فحص الإصدار كاملة. إذا أعادت تلك الأجزاء بناء هدف Docker الكامل للمصدر بشكل مستقل، فإن تشغيل الإصدار مضبوط بشكل خاطئ وسيهدر وقتا فعليا على بناء صور مكرر.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف هذا عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من tarball واحد عبر حزمة اختبار Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يفحص `resolve_package` المرجع `workflow_ref`، ويحل مرشح حزمة واحدا، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفع كليهما كأثر `package-under-test`، ويطبع المصدر، ومرجع سير العمل، ومرجع الحزمة، والإصدار، وSHA-256، والملف الشخصي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance` الملف `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من جرد tarball، ويحضر صور Docker ذات ملخص الحزمة عند الحاجة، ويشغل مسارات Docker المحددة ضد تلك الحزمة بدلا من تغليف نسخة سير العمل المسحوبة. عندما يحدد ملف شخصي عدة `docker_lanes` مستهدفة، يحضر سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية مع آثار فريدة.
3. يستدعي `package_telegram` اختياريا `NPM Telegram Beta E2E`. يعمل عندما لا تكون `telegram_mode` هي `none` ويثبت أثر `package-under-test` نفسه عندما يكون قبول الحزمة قد حل واحدا؛ ولا يزال بإمكان إرسال Telegram المستقل تثبيت مواصفة npm منشورة.
4. يفشل `summary` سير العمل إذا فشل حل الحزمة، أو قبول Docker، أو مسار Telegram الاختياري.

### مصادر المرشحين

- لا يقبل `source=npm` إلا `openclaw@alpha`، أو `openclaw@beta`، أو `openclaw@latest`، أو إصدار OpenClaw دقيقا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول الإصدارات التمهيدية/المستقرة المنشورة.
- يغلف `source=ref` فرعا أو وسما أو SHA كاملا لالتزام موثوقا من `package_ref`. يجلب محلل الحزمة فروع/وسوم OpenClaw، ويتحقق من أن الالتزام المحدد قابل للوصول من تاريخ فروع المستودع أو وسم إصدار، ويثبت الاعتماديات في شجرة عمل منفصلة، ويغلفه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزل `source=url` ملف `.tgz` عبر HTTPS؛ وتكون `package_sha256` مطلوبة.
- ينزل `source=artifact` ملف `.tgz` واحدا من `artifact_run_id` و`artifact_name`؛ وتكون `package_sha256` اختيارية لكنها ينبغي أن تقدم للآثار المشتركة خارجيا.

أبق `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو رمز سير العمل/حزمة الاختبار الموثوق الذي يشغل الاختبار. `package_ref` هو التزام المصدر الذي يجري تغليفه عندما تكون `source=ref`. هذا يسمح لحزمة الاختبار الحالية بالتحقق من التزامات مصدر موثوقة أقدم من دون تشغيل منطق سير عمل قديم.

### ملفات تعريف الحزمة

- `smoke` — `npm-onboard-channel-agent`، `gateway-network`، `config-reload`
- `package` — `npm-onboard-channel-agent`، `doctor-switch`، `update-channel-switch`، `upgrade-survivor`، `published-upgrade-survivor`، `plugins-offline`، `plugin-update`
- `product` — `package` إضافة إلى `mcp-channels`، و`cron-mcp-cleanup`، و`openai-web-search-minimal`، و`openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` دقيقة؛ مطلوبة عندما تكون `suite_profile=custom`

يستخدم ملف التعريف `package` تغطية plugin غير متصلة كي لا يعتمد تحقق الحزمة المنشورة على إتاحة ClawHub الحية. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع الإبقاء على مسار مواصفة npm المنشورة لعمليات الإرسال المستقلة.

للسياسة المخصصة لاختبار التحديث والـ plugin، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات قبول الحزمة، وافتراضات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات والـ plugins](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة باستخدام `source=artifact`، وأثر حزمة الإصدار المحضر، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و`published_upgrade_survivor_baselines=all-since-2026.4.23`، و`published_upgrade_survivor_scenarios=reported-issues`، و`telegram_mode=mock-openai`. هذا يبقي دليل ترحيل الحزمة، والتحديث، وتنظيف اعتماديات plugin القديمة، وإصلاح تثبيت الـ plugin المضبوط، والـ plugin غير المتصل، وتحديث الـ plugin، وTelegram على tarball الحزمة المحلول نفسه. عيّن `package_acceptance_package_spec` على Full Release Validation أو OpenClaw Release Checks لتشغيل المصفوفة نفسها ضد حزمة npm مشحونة بدلا من الأثر المبني من SHA. لا تزال فحوصات الإصدار عبر أنظمة التشغيل تغطي الإعداد الأولي الخاص بنظام التشغيل، والمثبت، وسلوك المنصة؛ وينبغي أن يبدأ تحقق منتج الحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker `published-upgrade-survivor` من خط أساس واحد لحزمة منشورة لكل تشغيل. في قبول الحزمة، يكون tarball `package-under-test` المحلول هو المرشح دائما، وتحدد `published_upgrade_survivor_baseline` خط الأساس المنشور الاحتياطي، مع افتراض `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الخط الأساسي. عيّن `published_upgrade_survivor_baselines=all-since-2026.4.23` لتوسيع CI للإصدار الكامل عبر كل إصدار npm مستقر من `2026.4.23` حتى `latest`؛ ويبقى `release-history` متاحا للمعاينة اليدوية الأوسع باستخدام مرساة ما قبل التاريخ الأقدم. عيّن `published_upgrade_survivor_scenarios=reported-issues` لتوسيع الخطوط الأساسية نفسها عبر تجهيزات على شكل قضايا لتكوين Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات OpenClaw plugin المضبوطة، ومسارات سجل tilde، وجذور اعتماديات plugin القديمة الراكدة. يستخدم سير عمل `Update Migration` المنفصل مسار Docker `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال هو التنظيف الشامل للتحديث المنشور، وليس اتساع CI العادي للإصدار الكامل. يمكن لعمليات التشغيل المحلية المجمعة تمرير مواصفات حزمة دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو إبقاء مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو تعيين `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يضبط المسار المنشور الخط الأساسي بوصفة أمر `openclaw config set` مدمجة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` إضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows الجديدة للحزمة والمثبت أيضا من أن الحزمة المثبتة يمكنها استيراد تجاوز للتحكم بالمتصفح من مسار Windows خام مطلق. يفترض اختبار دخان دور وكيل OpenAI عبر أنظمة التشغيل القيمة `OPENCLAW_CROSS_OS_OPENAI_MODEL` عند ضبطها، وإلا `openai/gpt-5.4`، بحيث يبقى دليل التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضات GPT-4.x.

### نوافذ التوافق القديمة

لدى قبول الحزمة نوافذ توافق قديم محدودة للحزم المنشورة سابقا. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` قيم `pnpm.patchedDependencies` المفقودة من تجهيز git الزائف المشتق من tarball وقد يسجل `update.channel` محفوظا مفقودا؛
- قد تقرأ اختبارات دخان الـ plugin مواقع سجلات تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت المتجر؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف التكوين مع الاستمرار في اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت بلا تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضا من ملفات ختم بيانات تعريف البناء المحلية التي شُحنت بالفعل. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ وتفشل الشروط نفسها بدلا من التحذير أو التخطي.

### أمثلة

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

عند تصحيح أخطاء تشغيل قبول حزمة فاشل، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها وSHA-256. ثم افحص التشغيل الفرعي `docker_acceptance` ومشغولاته الفنية الخاصة بـ Docker: `.artifacts/docker-tests/**/summary.json` و`failures.json` وسجلات المسارات وتوقيتات المراحل وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلًا من إعادة تشغيل تحقق الإصدار الكامل.

## فحص التثبيت السريع

يعيد سير العمل المنفصل `Install Smoke` استخدام سكربت النطاق نفسه عبر مهمة `preflight` الخاصة به. وهو يقسم تغطية الفحص السريع إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- **المسار السريع** يعمل لطلبات السحب التي تمس أسطح Docker/الحزم، أو تغييرات حزمة/بيان Plugin المضمّن، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تمرّنها مهام فحص Docker السريع. تغييرات Plugin المضمّن على مستوى المصدر فقط، والتعديلات الاختبارية فقط، والتعديلات التوثيقية فقط لا تحجز عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويفحص CLI، ويشغّل فحص CLI السريع لحذف الوكلاء في مساحة العمل المشتركة، ويشغّل اختبار e2e لشبكة Gateway داخل الحاوية، ويتحقق من وسيطة بناء إضافة مضمّنة، ويشغّل ملف تعريف Docker المحدود لـ Plugin المضمّن ضمن مهلة أمر إجمالية قدرها 240 ثانية (مع تحديد كل تشغيل Docker لكل سيناريو على حدة).
- **المسار الكامل** يحتفظ بتغطية تثبيت حزمة QR وتثبيت/تحديث Docker للمثبّت للتشغيلات الليلية المجدولة، وعمليات التشغيل اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تمس فعلًا أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يحضّر install-smoke أو يعيد استخدام صورة فحص Dockerfile جذرية في GHCR موجهة إلى SHA الهدف، ثم يشغّل تثبيت حزمة QR، وفحوصات Dockerfile/Gateway الجذرية، وفحوصات المثبّت/التحديث، وDocker E2E السريع لـ Plugin المضمّن كمهام منفصلة حتى لا ينتظر عمل المثبّت خلف فحوصات الصورة الجذرية.

دفعات `main` (بما في ذلك دمجات merge commits) لا تفرض المسار الكامل؛ عندما يطلب منطق نطاق التغييرات تغطية كاملة عند الدفع، يحتفظ سير العمل بفحص Docker السريع ويترك فحص التثبيت الكامل الليلي أو لتحقق الإصدار.

يُحكم فحص مزود الصورة لتثبيت Bun العمومي البطيء بشكل منفصل عبر `run_bun_global_install_smoke`. يعمل في الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لتشغيلات `Install Smoke` اليدوية الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات QR وDocker للمثبّت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يقوم `pnpm test:docker:all` بالبناء المسبق لصورة اختبار حي مشتركة واحدة، ويحزم OpenClaw مرة واحدة كحزمة tarball لـ npm، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git مجرد لمسارات المثبّت/التحديث/اعتمادية Plugin؛
- صورة وظيفية تثبت حزمة tarball نفسها في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويقع منطق التخطيط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغّل إلا الخطة المحددة. يختار المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### عناصر قابلة للضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات التجمع الرئيسي للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات تجمع الذيل الحساس للمزود.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة كي لا تفرض المزودات تقييدًا.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد المسارات متعددة الخدمات المتزامنة.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | تباعد بين بدايات المسارات لتجنب عواصف إنشاء Docker daemon؛ اضبطه على `0` لعدم التباعد.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات حية/ذيلية محددة حدودًا أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير معيّن   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير معيّن   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى فحص التنظيف السريع حتى يستطيع الوكلاء إعادة إنتاج مسار فاشل واحد. |

يمكن لمسار أثقل من حده الفعال أن يبدأ مع ذلك من تجمع فارغ، ثم يعمل وحده إلى أن يحرر السعة. تجري التجميعة المحلية فحوصات تمهيدية لـ Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولًا، وتتوقف افتراضيًا عن جدولة مسارات مجمعة جديدة بعد أول فشل.

### سير عمل حي/E2E قابل لإعادة الاستخدام

يسأل سير العمل الحي/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة ونوع الصورة والصورة الحية والمسار وتغطية بيانات الاعتماد المطلوبة. ثم يحوّل `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات وملخصات GitHub. فهو إما يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزل مشغولة فنية لحزمة من التشغيل الحالي، أو ينزل مشغولة فنية لحزمة من `package_artifact_run_id`؛ ويتحقق من مخزون حزمة tarball؛ ويبني ويدفع صور Docker E2E المجردة/الوظيفية في GHCR الموسومة بملخص الحزمة عبر ذاكرة طبقات Docker المؤقتة الخاصة بـ Blacksmith عندما تحتاج الخطة إلى مسارات ذات حزمة مثبتة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلًا من إعادة البناء. تعاد محاولات سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة حتى يعاد بسرعة تدفق سجل/ذاكرة مؤقتة عالق بدلًا من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار عبر مهام أصغر مجزأة باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` حتى لا يسحب كل جزء إلا نوع الصورة الذي يحتاجه وينفذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core` و`package-update-openai` و`package-update-anthropic` و`package-update-core` و`plugins-runtime-plugins` و`plugins-runtime-services` و`plugins-runtime-install-a` حتى `plugins-runtime-install-h`. تبقى `plugins-runtime-core` و`plugins-runtime` و`plugins-integrations` أسماءً مستعارة تجميعية لـ Plugin/وقت التشغيل. يبقى اسم المسار المستعار `install-e2e` اسم إعادة التشغيل اليدوي التجميعي لكلا مساري مثبّت المزود.

يُدمج OpenWebUI في `plugins-runtime-services` عندما تطلب تغطية مسار الإصدار الكاملة ذلك، ويحتفظ بجزء مستقل `openwebui` فقط للتشغيلات الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المضمّنة المحاولة مرة واحدة عند إخفاقات شبكة npm العابرة.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات والتوقيتات و`summary.json` و`failures.json` وتوقيتات المراحل وJSON خطة المجدول وجداول المسارات البطيئة وأوامر إعادة التشغيل لكل مسار. يشغّل مدخل `docker_lanes` في سير العمل المسارات المحددة مقابل الصور المحضرة بدلًا من مهام الأجزاء، ما يبقي تصحيح أخطاء المسار الفاشل محدودًا بمهمة Docker واحدة موجهة ويحضّر أو ينزل أو يعيد استخدام مشغولة الحزمة الفنية لذلك التشغيل؛ إذا كان مسار محدد مسار Docker حيًا، تبني المهمة الموجهة صورة الاختبار الحي محليًا لإعادة التشغيل تلك. تتضمن أوامر إعادة تشغيل GitHub المولّدة لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المحضرة عندما تكون تلك القيم موجودة، حتى يستطيع مسار فاشل إعادة استخدام الحزمة والصور الدقيقة من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل سير العمل الحي/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يوميًا.

## الإصدار التمهيدي لـ Plugin

`Plugin Prerelease` تغطية منتج/حزمة أعلى تكلفة، لذلك هو سير عمل منفصل يطلقه `Full Release Validation` أو مشغّل صريح. تبقي طلبات السحب العادية ودفعات `main` وتشغيلات CI اليدوية المستقلة تلك المجموعة متوقفة. يوازن اختبارات Plugin المضمّنة عبر ثمانية عمال إضافات؛ تعمل مهام تقسيم الإضافات هذه حتى مجموعتي إعداد Plugin في وقت واحد مع عامل Vitest واحد لكل مجموعة وذاكرة أكبر لـ Node حتى لا تنشئ دفعات Plugin الثقيلة الاستيراد مهام CI إضافية. يجمع مسار Docker التمهيدي الخاص بالإصدار فقط مسارات Docker الموجهة في مجموعات صغيرة لتجنب حجز عشرات المشغّلات لمهام من دقيقة إلى ثلاث دقائق.

## مختبر QA

لدى مختبر QA مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. تكون مساواة الوكلاء متداخلة ضمن أحزمة QA والإصدار الواسعة، وليست سير عمل PR مستقلًا. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي للمساواة أن ترافق تشغيل تحقق واسعًا.

- يشغّل سير العمل `QA-Lab - All Lanes` ليلًا على `main` وعند التشغيل اليدوي؛ يوزع مسار المساواة الوهمية، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord عقود Convex.

تشغّل فحوصات الإصدار مساري نقل Matrix وTelegram الحيين مع المزود الوهمي الحتمي والنماذج المؤهلة وهميًا (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) بحيث يُعزل عقد القناة عن زمن استجابة النموذج الحي وبدء Plugin المزود العادي. يعطل Gateway النقل الحي بحث الذاكرة لأن مساواة QA تغطي سلوك الذاكرة بشكل منفصل؛ وتغطي مجموعات النموذج الحي والمزود الأصلي ومزود Docker المنفصلة اتصال المزود.

يستخدم Matrix الخيار `--profile fast` للبوابات المجدولة وبوابات الإصدار، مع إضافة `--fail-fast` فقط عندما يدعمه CLI المسحوب. يبقى افتراض CLI ومدخل سير العمل اليدوي `all`؛ وتشغيل `matrix_profile=all` اليدوي يقسم دائمًا تغطية Matrix الكاملة إلى مهام `transport` و`media` و`e2ee-smoke` و`e2ee-deep` و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضًا مسارات مختبر QA الحرجة للإصدار قبل موافقة الإصدار؛ وتشغّل بوابة مساواة QA الخاصة به حزم المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزل كلتا المشغولتين الفنيتين إلى مهمة تقرير صغيرة لمقارنة المساواة النهائية.

بالنسبة إلى طلبات السحب العادية، اتبع أدلة CI/الفحص محددة النطاق بدلًا من التعامل مع المساواة كحالة مطلوبة.

## CodeQL

سير عمل `CodeQL` هو ماسح أمان ضيق للمرور الأول عمدا، وليس فحصا كاملا للمستودع. تفحص عمليات الحماية اليومية واليدوية وطلبات السحب غير المسودة تعليمات سير عمل Actions بالإضافة إلى أسطح JavaScript/TypeScript الأعلى خطرا، باستخدام استعلامات أمان عالية الثقة ومفلترة إلى `security-severity` عالية/حرجة.

يبقى حارس طلب السحب خفيفا: فهو يبدأ فقط للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، ويشغل مصفوفة الأمان عالية الثقة نفسها مثل سير العمل المجدول. يبقى CodeQL الخاص بـ Android وmacOS خارج افتراضيات PR.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | المصادقة، والأسرار، وبيئة التنفيذ المعزولة، وCron، وخط أساس Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات الأساسية بالإضافة إلى وقت تشغيل Plugin القناة، وGateway، وPlugin SDK، والأسرار، ونقاط تماس التدقيق              |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسات SSRF في Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                           |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة لتثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK |

### شظايا الأمان الخاصة بالمنصات

- `CodeQL Android Critical Security` — شظية أمان Android مجدولة. تبني تطبيق Android يدويا لـ CodeQL على أصغر مشغل Blacksmith Linux تقبله سلامة سير العمل. ترفع النتائج ضمن `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — شظية أمان macOS أسبوعية/يدوية. تبني تطبيق macOS يدويا لـ CodeQL على Blacksmith macOS، وتصفّي نتائج بناء التبعيات من SARIF المرفوع، وترفع النتائج ضمن `/codeql-critical-security/macos`. تبقى خارج الافتراضيات اليومية لأن بناء macOS يهيمن على وقت التشغيل حتى عندما يكون نظيفا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هي الشظية غير الأمنية المقابلة. تشغل فقط استعلامات جودة JavaScript/TypeScript غير أمنية وبشدة خطأ فوق أسطح ضيقة عالية القيمة على مشغل Blacksmith Linux الأصغر. حارس طلبات السحب الخاص بها أصغر عمدا من ملف التعريف المجدول: تشغل طلبات السحب غير المسودة فقط الشظايا المطابقة `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` لتغييرات تعليمات تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، أو تعليمات مخطط/ترحيل/إدخال وإخراج الإعدادات، أو تعليمات المصادقة/الأسرار/بيئة التنفيذ المعزولة/الأمان، أو القناة الأساسية ووقت تشغيل Plugin القناة المضمّنة، أو بروتوكول Gateway/طريقة الخادم، أو وقت تشغيل الذاكرة/وصلات SDK، أو MCP/العمليات/التسليم الصادر، أو وقت تشغيل المزوّد/فهرس النماذج، أو تشخيصات الجلسات/طوابير التسليم، أو محمّل Plugin، أو Plugin SDK/عقد الحزمة، أو وقت تشغيل ردود Plugin SDK. تشغل تغييرات إعدادات CodeQL وسير عمل الجودة جميع شظايا جودة PR الاثنتي عشرة.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

ملفات التعريف الضيقة هي خطافات تعليمية/تكرارية لتشغيل شظية جودة واحدة بمعزل.

| الفئة                                                  | السطح                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | تعليمات حدود أمان المصادقة، والأسرار، وبيئة التنفيذ المعزولة، وCron، وGateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات، والترحيل، والتطبيع، والإدخال والإخراج                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمّنة                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | عقود وقت التشغيل لتنفيذ الأوامر، وإرسال النموذج/المزوّد، وإرسال الرد التلقائي وطوابيره، ومستوى تحكم ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، ووصلات تفعيل وقت تشغيل الذاكرة، وأوامر doctor للذاكرة                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الردود، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI الخاصة بـ doctor للجلسات |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | إرسال الردود الواردة في Plugin SDK، ومساعدات حمولة/تجزئة/وقت تشغيل الردود، وخيارات ردود القنوات، وطوابير التسليم، ومساعدات ربط الجلسات/الخيوط             |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع فهرس النماذج، ومصادقة المزوّد واكتشافه، وتسجيل وقت تشغيل المزوّد، وافتراضات/فهارس المزوّد، وسجلات الويب/البحث/الجلب/التضمين    |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى التحكم بالمهام                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | عقود وقت التشغيل لجلب/بحث الويب الأساسي، وإدخال وإخراج الوسائط، وفهم الوسائط، وتوليد الصور، وتوليد الوسائط                                                    |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل، والسجل، والسطح العام، ونقاط دخول Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جانب الحزمة ومساعدات عقد حزمة Plugin                                                                                      |

تبقى الجودة منفصلة عن الأمان حتى يمكن جدولة نتائج الجودة، وقياسها، وتعطيلها، أو توسيعها من دون حجب إشارة الأمان. ينبغي إعادة إضافة توسيع CodeQL الخاص بـ Swift وPython وPlugin المضمّنة كعمل متابعة محدود النطاق أو مشظّى فقط بعد أن تستقر ملفات التعريف الضيقة في وقت التشغيل والإشارة.

## سير عمل الصيانة

### Docs Agent

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث لإبقاء المستندات الحالية متوائمة مع التغييرات التي هبطت حديثا. لا يملك جدولا صرفا: يمكن لتشغيل CI ناجح من دفع غير آلي إلى `main` أن يفعّله، ويمكن للتشغيل اليدوي تشغيله مباشرة. تتخطى استدعاءات workflow-run التشغيل عندما يكون `main` قد تقدم، أو عندما يكون تشغيل آخر غير متخطى من Docs Agent قد أُنشئ في الساعة الأخيرة. عندما يعمل، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـ Docs Agent إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على المستندات.

### Test Performance Agent

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. لا يملك جدولا صرفا: يمكن لتشغيل CI ناجح من دفع غير آلي إلى `main` أن يفعّله، لكنه يتخطى التنفيذ إذا كان استدعاء workflow-run آخر قد عمل أو يعمل بالفعل في ذلك اليوم بتوقيت UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية هذه. يبني المسار تقرير أداء Vitest مجمعا للحزمة الكاملة، ويسمح لـ Codex بإجراء إصلاحات صغيرة فقط لأداء الاختبارات مع الحفاظ على التغطية بدلا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير الحزمة الكاملة ويرفض التغييرات التي تقلل عدد اختبارات خط الأساس الناجحة. إذا كان خط الأساس يتضمن اختبارات فاشلة، يجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير الحزمة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل هبوط دفع البوت، يعيد المسار تأسيس التصحيح المتحقق منه، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ ويتم تخطي التصحيحات القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub حتى يتمكن إجراء Codex من الحفاظ على وضعية سلامة drop-sudo نفسها مثل وكيل المستندات.

### طلبات PR المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الهبوط. يفترض التشغيل الجاف، ولا يغلق إلا طلبات PR المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن PR الهابط مدموج، وأن كل تكرار لديه إما قضية مشتركة مشار إليها أو أجزاء تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية والتوجيه حسب التغييرات

تعيش منطقية مسارات التغييرات المحلية في `scripts/changed-lanes.mjs` وينفذها `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أكثر صرامة بشأن حدود البنية من نطاق منصة CI الواسع:

- تشغّل تغييرات إنتاج النواة فحص أنواع إنتاج النواة واختبار النواة بالإضافة إلى تدقيق النواة/الحراس؛
- تشغّل تغييرات الاختبارات فقط في النواة فحص أنواع اختبارات النواة بالإضافة إلى تدقيق النواة فقط؛
- تشغّل تغييرات إنتاج الإضافات فحص أنواع إنتاج الإضافات واختبار الإضافات بالإضافة إلى تدقيق الإضافات؛
- تشغّل تغييرات الاختبارات فقط في الإضافات فحص أنواع اختبارات الإضافات بالإضافة إلى تدقيق الإضافات؛
- تتوسع تغييرات Plugin SDK العامة أو عقد Plugin إلى فحص أنواع الإضافات لأن الإضافات تعتمد على عقود النواة هذه (تبقى فحوصات Vitest للإضافات عملا اختباريا صريحا)؛
- تشغّل زيادات الإصدارات الخاصة ببيانات الإصدار الوصفية فقط فحوصات مستهدفة للإصدار/الإعدادات/تبعية الجذر؛
- تفشل تغييرات الجذر/الإعدادات غير المعروفة بأمان إلى كل مسارات الفحص.

يعيش توجيه اختبارات التغييرات المحلية في `scripts/test-projects.test-support.mjs` وهو أرخص عمدا من `check:changed`: تشغّل تعديلات الاختبارات المباشرة نفسها، وتفضّل تعديلات المصدر الخرائط الصريحة، ثم اختبارات الأشقاء والاعتمادات في مخطط الاستيراد. إعدادات تسليم غرفة المجموعة المشتركة هي إحدى الخرائط الصريحة: تمر التغييرات على إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو مطالبة نظام أداة الرسائل عبر اختبارات الرد الأساسية بالإضافة إلى تراجعات التسليم في Discord وSlack حتى يفشل تغيير افتراضي مشترك قبل أول دفع PR. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعا على مستوى عدة الاختبار بما يكفي لأن مجموعة الخرائط الرخيصة ليست وكيلا موثوقا.

## تحقق Testbox

شغّل Testbox من جذر المستودع، وفضّل صندوقًا مُسخّنًا جديدًا للإثبات واسع النطاق. قبل إنفاق بوابة بطيئة على صندوق أُعيد استخدامه أو انتهت صلاحيته أو أبلغ للتو عن مزامنة كبيرة على نحو غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولًا.

يفشل فحص السلامة بسرعة عندما تختفي ملفات الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يُظهر `git status --short` ما لا يقل عن 200 حذف متتبّع. يعني ذلك عادةً أن حالة المزامنة البعيدة ليست نسخة موثوقة من PR؛ أوقف ذلك الصندوق وسخّن صندوقًا جديدًا بدلًا من تصحيح فشل اختبار المنتج. بالنسبة إلى PRs ذات الحذف الكبير المقصود، عيّن `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل فحص السلامة ذلك.

ينهي `pnpm testbox:run` أيضًا استدعاء Blacksmith CLI محليًا إذا بقي في مرحلة المزامنة لأكثر من خمس دقائق دون مخرجات بعد المزامنة. عيّن `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل هذا الحارس، أو استخدم قيمة أكبر بالمللي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

Crabbox هو مسار الصندوق البعيد الثاني المملوك للمستودع لإثبات Linux عندما لا يكون Blacksmith متاحًا أو عندما تكون سعة السحابة المملوكة مفضلة. سخّن صندوقًا، وأعد تحميله عبر سير عمل المشروع، ثم شغّل الأوامر من خلال Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

يمتلك `.crabbox.yaml` إعدادات المزوّد والمزامنة وإعادة تحميل GitHub Actions الافتراضية. يستثني `.git` المحلي بحيث يحافظ checkout المُعاد تحميله من Actions على بيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة مستودعات maintainer المحلية البعيدة ومخازن الكائنات، كما يستثني آثار التشغيل/البناء المحلية التي يجب ألا تُنقل أبدًا. يمتلك `.github/workflows/crabbox-hydrate.yml` عملية checkout، وإعداد Node/pnpm، وجلب `origin/main`، وتسليم البيئة غير السرية التي تستخدمها لاحقًا أوامر `crabbox run --id <cbx_id>` كمصدر.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)

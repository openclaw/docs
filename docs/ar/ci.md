---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تعمل على تصحيح فحص GitHub Actions فاشل
    - أنت تنسّق تشغيل التحقق من الإصدار أو إعادة تشغيله
    - أنت تغيّر إرسال ClawSweeper أو إعادة توجيه نشاط GitHub
summary: مخطط مهام التكامل المستمر، وبوابات النطاق، ومظلات الإصدار، ومكافئات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-05-02T23:39:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

تعمل CI الخاصة بـ OpenClaw عند كل دفع إلى `main` وكل طلب سحب. تصنّف مهمة `preflight` الفرق وتوقف المسارات المكلفة عندما تتغير مناطق غير ذات صلة فقط. تتجاوز عمليات `workflow_dispatch` اليدوية النطاق الذكي عمدًا وتوسّع الرسم البياني الكامل لمرشحي الإصدار والتحقق الواسع. تظل مسارات Android اختيارية عبر `include_android`. تغطية Plugin الخاصة بالإصدار فقط موجودة في سير العمل المنفصل [`Plugin Prerelease`](#plugin-prerelease)، ولا تعمل إلا من [`Full Release Validation`](#full-release-validation) أو من تشغيل يدوي صريح.

## نظرة عامة على المسار

| المهمة                           | الغرض                                                                                                              | متى تعمل                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `preflight`                      | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI                                 | دائمًا في الدفعات وطلبات السحب غير المسودة |
| `security-scm-fast`              | اكتشاف المفاتيح الخاصة وتدقيق سير العمل عبر `zizmor`                                                              | دائمًا في الدفعات وطلبات السحب غير المسودة |
| `security-dependency-audit`      | تدقيق ملف قفل الإنتاج دون تبعيات مقابل إرشادات npm الأمنية                                                        | دائمًا في الدفعات وطلبات السحب غير المسودة |
| `security-fast`                  | تجميع مطلوب لمهام الأمان السريعة                                                                                   | دائمًا في الدفعات وطلبات السحب غير المسودة |
| `check-dependencies`             | تمرير Knip الخاص بتبعيات الإنتاج فقط إضافة إلى حارس قائمة السماح للملفات غير المستخدمة                             | تغييرات ذات صلة بـ Node            |
| `build-artifacts`                | بناء `dist/` وواجهة Control UI وفحوصات القطع المبنية والقطع القابلة لإعادة الاستخدام للمراحل اللاحقة              | تغييرات ذات صلة بـ Node            |
| `checks-fast-core`               | مسارات صحة سريعة على Linux مثل فحوصات المضمّن/عقد Plugin/البروتوكول                                               | تغييرات ذات صلة بـ Node            |
| `checks-fast-contracts-channels` | فحوصات عقود القنوات الموزعة على أجزاء مع نتيجة فحص تجميعية مستقرة                                                 | تغييرات ذات صلة بـ Node            |
| `checks-node-core-test`          | أجزاء اختبارات Node الأساسية، باستثناء مسارات القنوات والمضمّن والعقود والإضافات                                  | تغييرات ذات صلة بـ Node            |
| `check`                          | مكافئ البوابة المحلية الرئيسية الموزعة: أنواع الإنتاج، والفحص، والحراس، وأنواع الاختبارات، واختبار smoke صارم     | تغييرات ذات صلة بـ Node            |
| `check-additional`               | البنية، والحدود، وانحراف لقطات المطالبات، وحراس سطح الإضافات، وحدود الحزم، وأجزاء مراقبة Gateway                  | تغييرات ذات صلة بـ Node            |
| `build-smoke`                    | اختبارات smoke لواجهة CLI المبنية واختبار smoke لذاكرة بدء التشغيل                                                 | تغييرات ذات صلة بـ Node            |
| `checks`                         | متحقق لاختبارات قناة القطع المبنية                                                                                | تغييرات ذات صلة بـ Node            |
| `checks-node-compat-node22`      | مسار بناء وتحقق smoke لتوافق Node 22                                                                               | تشغيل CI يدوي للإصدارات            |
| `check-docs`                     | تنسيق الوثائق، والفحص، وفحوصات الروابط المعطلة                                                                     | عند تغيّر الوثائق                  |
| `skills-python`                  | Ruff + pytest للـ Skills المدعومة بـ Python                                                                        | تغييرات ذات صلة بـ Skills الخاصة بـ Python |
| `checks-windows`                 | اختبارات العمليات/المسارات الخاصة بـ Windows إضافة إلى تراجعات محددات استيراد وقت التشغيل المشتركة                 | تغييرات ذات صلة بـ Windows         |
| `macos-node`                     | مسار اختبار TypeScript على macOS باستخدام القطع المبنية المشتركة                                                   | تغييرات ذات صلة بـ macOS           |
| `macos-swift`                    | فحص Swift وبناؤه واختباراته لتطبيق macOS                                                                           | تغييرات ذات صلة بـ macOS           |
| `android`                        | اختبارات وحدات Android لكلا النكهتين إضافة إلى بناء APK debug واحد                                                 | تغييرات ذات صلة بـ Android         |
| `test-performance-agent`         | تحسين يومي لاختبارات Codex البطيئة بعد نشاط موثوق                                                                  | نجاح CI الرئيسي أو تشغيل يدوي      |
| `openclaw-performance`           | تقارير أداء يومية/عند الطلب لوقت تشغيل Kova مع مسارات مزود وهمي، وملف تعريف عميق، وGPT 5.4 مباشر                  | تشغيل مجدول ويدوي                  |

## ترتيب الفشل السريع

1. تقرر `preflight` أي المسارات موجودة أصلًا. منطق `docs-scope` و`changed-scope` عبارة عن خطوات داخل هذه المهمة، وليست مهامًا مستقلة.
2. تفشل `security-scm-fast` و`security-dependency-audit` و`security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة دون انتظار مهام القطع ومصفوفة المنصات الأثقل.
3. تتداخل `build-artifacts` مع مسارات Linux السريعة بحيث يمكن للمستهلكين اللاحقين البدء بمجرد أن يصبح البناء المشترك جاهزًا.
4. تتوسع مسارات المنصات ووقت التشغيل الأثقل بعد ذلك: `checks-fast-core` و`checks-fast-contracts-channels` و`checks-node-core-test` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

قد يعلّم GitHub المهام التي تجاوزتها دفعة أحدث على أنها `cancelled` عندما تصل دفعة أحدث إلى طلب السحب نفسه أو مرجع `main`. تعامل مع ذلك كضجيج CI ما لم تكن أحدث عملية تشغيل للمرجع نفسه تفشل أيضًا. تستخدم فحوصات الأجزاء التجميعية `!cancelled() && always()` كي تظل تبلغ عن إخفاقات الأجزاء العادية، لكنها لا تصطف بعد أن يكون سير العمل بأكمله قد تجاوزه تشغيل أحدث. مفتاح تزامن CI التلقائي ذو إصدار (`CI-v7-*`) بحيث لا يستطيع عالق من جهة GitHub في مجموعة انتظار قديمة حظر عمليات تشغيل main الأحدث إلى أجل غير مسمى. تستخدم عمليات التشغيل اليدوية للمجموعة الكاملة `CI-manual-v1-*` ولا تلغي العمليات الجارية.

## النطاق والتوجيه

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدات في `src/scripts/ci-changed-scope.test.ts`. يتجاوز التشغيل اليدوي اكتشاف النطاق المتغير ويجعل بيان preflight يتصرف كما لو أن كل منطقة ذات نطاق قد تغيرت.

- **تعديلات سير عمل CI** تتحقق من رسم CI الخاص بـ Node إضافة إلى فحص سير العمل، لكنها لا تجبر بذاتها بناءات Windows أو Android أو macOS الأصلية؛ تظل مسارات تلك المنصات محصورة في تغييرات مصدر المنصة.
- **تعديلات توجيه CI فقط، وتعديلات مختارة ورخيصة على تجهيزات اختبارات core، وتعديلات ضيقة على مساعدي/توجيه اختبارات عقد Plugin** تستخدم مسار بيان سريع خاص بـ Node فقط: `preflight`، والأمان، ومهمة `checks-fast-core` واحدة. يتجاوز هذا المسار قطع البناء، وتوافق Node 22، وعقود القنوات، وكل أجزاء core الكاملة، وأجزاء Plugin المضمّنة، ومصفوفات الحراس الإضافية عندما يكون التغيير محدودًا بأسطح التوجيه أو المساعدين التي تختبرها المهمة السريعة مباشرة.
- **فحوصات Windows Node** محصورة في أغلفة العمليات/المسارات الخاصة بـ Windows، ومساعدي مشغلات npm/pnpm/UI، وتكوين مدير الحزم، وأسطح سير عمل CI التي تنفذ ذلك المسار؛ تبقى تغييرات المصدر وPlugin واختبار التثبيت وتغييرات الاختبارات فقط غير ذات الصلة على مسارات Linux Node.

تُقسّم أو تُوازن أبطأ عائلات اختبارات Node بحيث تبقى كل مهمة صغيرة دون حجز زائد للمشغلات: تعمل عقود القنوات كثلاثة أجزاء موزونة، وتقترن مسارات وحدات core الصغيرة، ويعمل الرد التلقائي كأربعة عمال متوازنين (مع تقسيم شجرة الرد الفرعية إلى أجزاء agent-runner وdispatch وcommands/state-routing)، وتوزّع تكوينات Gateway/Plugin الوكيلة عبر مهام Node الوكيلة الحالية الخاصة بالمصدر فقط بدل انتظار القطع المبنية. تستخدم اختبارات المتصفح وQA والوسائط وPlugin المتنوعة والواسعة تكوينات Vitest المخصصة لها بدل تجميع Plugin المشترك العام. تسجل أجزاء أنماط التضمين إدخالات توقيت باستخدام اسم جزء CI، بحيث يمكن لـ `.artifacts/vitest-shard-timings.json` التمييز بين تكوين كامل وجزء مرشح. تبقي `check-additional` عمل تجميع/اختبار حدود الحزم معًا وتفصل بنية طوبولوجيا وقت التشغيل عن تغطية مراقبة Gateway؛ يشغّل جزء حارس الحدود حراسه الصغيرة المستقلة بالتزامن داخل مهمة واحدة، بما في ذلك `pnpm prompt:snapshots:check` بحيث يُثبّت انحراف مطالبات المسار السعيد لوقت تشغيل Codex إلى طلب السحب الذي سببه. تعمل مراقبة Gateway واختبارات القنوات وجزء حدود دعم core بالتزامن داخل `build-artifacts` بعد أن يكون `dist/` و`dist-runtime/` قد بُنيا بالفعل.

يشغّل Android CI كلًا من `testPlayDebugUnitTest` و`testThirdPartyDebugUnitTest` ثم يبني APK debug الخاص بـ Play. لا تحتوي نكهة الطرف الثالث على مجموعة مصدر أو بيان منفصل؛ يظل مسار اختبارات الوحدات الخاص بها يجمّع النكهة مع أعلام BuildConfig الخاصة بـ SMS/سجل المكالمات، مع تجنب مهمة تغليف APK debug مكررة في كل دفعة ذات صلة بـ Android.

يشغّل جزء `check-dependencies` الأمر `pnpm deadcode:dependencies` (تمرير Knip خاص بتبعيات الإنتاج فقط ومثبت على أحدث إصدار Knip، مع تعطيل حد العمر الأدنى لإصدار pnpm لتثبيت `dlx`) و`pnpm deadcode:unused-files`، الذي يقارن نتائج Knip الإنتاجية للملفات غير المستخدمة مع `scripts/deadcode-unused-files.allowlist.mjs`. يفشل حارس الملفات غير المستخدمة عندما يضيف طلب سحب ملفًا جديدًا غير مستخدم ولم يُراجع، أو يترك إدخال قائمة سماح قديمًا، مع الحفاظ على أسطح Plugin الديناميكية والمولدة والبناء والاختبارات المباشرة وجسور الحزم المقصودة التي لا يستطيع Knip حلها ساكنًا.

## تمرير نشاط ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` هو الجسر من جهة الهدف من نشاط مستودع OpenClaw إلى ClawSweeper. لا يسحب أو ينفذ كود طلبات السحب غير الموثوق. ينشئ سير العمل رمز GitHub App من `CLAWSWEEPER_APP_PRIVATE_KEY`، ثم يرسل حمولات `repository_dispatch` مدمجة إلى `openclaw/clawsweeper`.

يحتوي سير العمل على أربعة مسارات:

- `clawsweeper_item` لطلبات مراجعة القضايا وطلبات السحب الدقيقة؛
- `clawsweeper_comment` لأوامر ClawSweeper الصريحة في تعليقات القضايا؛
- `clawsweeper_commit_review` لطلبات المراجعة على مستوى الالتزام في دفعات `main`؛
- `github_activity` لنشاط GitHub العام الذي قد يفحصه وكيل ClawSweeper.

يمرر مسار `github_activity` البيانات الوصفية المطبّعة فقط: نوع الحدث، والإجراء، والفاعل، والمستودع، ورقم العنصر، وURL، والعنوان، والحالة، ومقتطفات قصيرة للتعليقات أو المراجعات عند وجودها. يتجنب عمدًا تمرير كامل جسم Webhook. سير العمل المستقبِل في `openclaw/clawsweeper` هو `.github/workflows/github-activity.yml`، والذي ينشر الحدث المطبّع إلى خطاف OpenClaw Gateway لوكيل ClawSweeper.

النشاط العام للمراقبة، وليس للتسليم افتراضيًا. يتلقى وكيل ClawSweeper هدف Discord في مطالبته، وينبغي أن ينشر إلى `#clawsweeper` فقط عندما يكون الحدث مفاجئًا أو قابلًا للتنفيذ أو خطيرًا أو مفيدًا تشغيليًا. ينبغي أن تؤدي عمليات الفتح والتعديل الروتينية، وضجيج الروبوتات، وضجيج Webhook المكرر، وحركة المراجعات العادية إلى `NO_REPLY`.

تعامل مع عناوين GitHub وتعليقاته ومتونه ونصوص المراجعات وأسماء الفروع ورسائل الالتزام كبيانات غير موثوقة عبر هذا المسار كله. هي مدخلات للتلخيص والفرز، وليست تعليمات لسير العمل أو وقت تشغيل الوكيل.

## عمليات التشغيل اليدوية

تُشغّل عمليات إرسال CI اليدوية مخطط المهام نفسه مثل CI العادي، لكنها تفرض تشغيل كل مسار غير خاص بنظام Android ضمن النطاق: أجزاء Linux Node، وأجزاء Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، واختبار البناء السريع، وفحوصات الوثائق، وPython skills، وWindows، وmacOS، وتدويل واجهة Control UI. تُشغّل عمليات إرسال CI اليدوية المستقلة Android فقط مع `include_android=true`؛ ويُمكّن غطاء الإصدار الكامل Android عبر تمرير `include_android=true`. تُستثنى من CI فحوصات Plugin الثابتة لما قبل الإصدار، وجزء `agentic-plugins` الخاص بالإصدار فقط، والفحص الدفعي الكامل للإضافات، ومسارات Docker الخاصة بما قبل إصدار Plugin. لا تعمل حزمة Docker لما قبل الإصدار إلا عندما يرسل `Full Release Validation` سير عمل `Plugin Prerelease` المنفصل مع تمكين بوابة التحقق من الإصدار.

تستخدم التشغيلات اليدوية مجموعة تزامن فريدة حتى لا تُلغى حزمة مرشح الإصدار الكاملة بسبب عملية دفع أو تشغيل PR أخرى على المرجع نفسه. يتيح إدخال `target_ref` الاختياري لمستدعٍ موثوق تشغيل ذلك المخطط مقابل فرع أو وسم أو SHA كامل للالتزام مع استخدام ملف سير العمل من مرجع الإرسال المحدد.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## المشغّلات

| المشغّل                          | المهام                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`، ومهام الأمان السريعة والتجميعات (`security-scm-fast`، و`security-dependency-audit`، و`security-fast`)، وفحوصات البروتوكول/العقود/المضمّنة السريعة، وفحوصات عقود القنوات المجزأة، وأجزاء `check` باستثناء lint، وأجزاء وتجميعات `check-additional`، ومحققات تجميع اختبارات Node، وفحوصات الوثائق، وPython skills، وworkflow-sanity، وlabeler، وauto-response؛ يستخدم تمهيد install-smoke أيضًا Ubuntu المستضاف على GitHub حتى تتمكن مصفوفة Blacksmith من الاصطفاف مبكرًا |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`، وأجزاء الإضافات الأخف وزنًا، و`checks-fast-core`، و`checks-node-compat-node22`، و`check-prod-types`، و`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`، وbuild-smoke، وأجزاء اختبارات Linux Node، وأجزاء اختبارات Plugin المضمّنة، و`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (حسّاسة للمعالج بما يكفي لأن 8 vCPU كلّفت أكثر مما وفّرت)؛ وبناءات Docker الخاصة بـ install-smoke (وقت انتظار 32-vCPU كلّف أكثر مما وفّر)                                                                                                                                                                                                                                                                                                                     |
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

يثبّت سير العمل OCM من إصدار مثبّت وKova من إدخال `kova_ref` المثبّت، ثم يشغّل ثلاثة مسارات:

- `mock-provider`: سيناريوهات تشخيص Kova مقابل وقت تشغيل ببناء محلي مع مصادقة وهمية حتمية متوافقة مع OpenAI.
- `mock-deep-profile`: توصيف CPU/heap/trace لنقاط السخونة في بدء التشغيل، وGateway، ودوران الوكيل.
- `live-gpt54`: دورة وكيل OpenAI حقيقية `openai/gpt-5.4`، تُتخطى عندما لا يكون `OPENAI_API_KEY` متاحًا.

يشغّل مسار mock-provider أيضًا مجسات مصدر أصلية من OpenClaw بعد مرور Kova: توقيت إقلاع Gateway والذاكرة عبر حالات بدء التشغيل الافتراضية، وhook، و50-Plugin؛ وحلقات hello متكررة لـ mock-OpenAI `channel-chat-baseline`؛ وأوامر بدء CLI مقابل Gateway الذي تم إقلاعه. يوجد ملخص Markdown لمجس المصدر في `source/index.md` ضمن حزمة التقرير، مع JSON الخام بجانبه.

يرفع كل مسار artifacts إلى GitHub. عندما يكون `CLAWGRIT_REPORTS_TOKEN` مهيأ، يلتزم سير العمل أيضًا بـ `report.json`، و`report.md`، والحزم، و`index.md`، وartifacts مجس المصدر إلى `openclaw/clawgrit-reports` تحت `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. يُكتب مؤشر الفرع الحالي باسم `openclaw-performance/<ref>/latest-<lane>.json`.

## التحقق الكامل من الإصدار

`Full Release Validation` هو سير العمل اليدوي الجامع من أجل "تشغيل كل شيء قبل الإصدار." يقبل فرعًا أو وسمًا أو SHA كاملًا للالتزام، ويرسل سير عمل `CI` اليدوي بذلك الهدف، ويرسل `Plugin Prerelease` لإثباتات Plugin/الحزمة/الثابتة/Docker الخاصة بالإصدار فقط، ويرسل `OpenClaw Release Checks` لاختبار التثبيت السريع، وقبول الحزمة، وحزم مسار إصدار Docker، والاختبارات الحية/E2E، وOpenWebUI، وتكافؤ QA Lab، وMatrix، ومسارات Telegram. مع `rerun_group=all` و`release_profile=full`، يشغّل أيضًا `NPM Telegram Beta E2E` مقابل artifact `release-package-under-test` من فحوصات الإصدار. بعد النشر، مرّر `npm_telegram_package_spec` لإعادة تشغيل مسار حزمة Telegram نفسه مقابل حزمة npm المنشورة.

راجع [التحقق الكامل من الإصدار](/ar/reference/full-release-validation) للاطلاع على
مصفوفة المراحل، وأسماء مهام سير العمل الدقيقة، واختلافات الملفات التعريفية، وartifacts،
ومعالجات إعادة التشغيل المركزة.

`OpenClaw Release Publish` هو سير عمل الإصدار اليدوي الذي يُجري تغييرات. أرسله
من `release/YYYY.M.D` أو `main` بعد وجود وسم الإصدار وبعد نجاح تمهيد
OpenClaw npm. يتحقق من `pnpm plugins:sync:check`،
ويرسل `Plugin NPM Release` لكل حزم Plugin القابلة للنشر، ويرسل
`Plugin ClawHub Release` لإصدار SHA نفسه، وعندها فقط يرسل
`OpenClaw NPM Release` مع `preflight_run_id` المحفوظ.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

لإثبات التزام مثبّت على فرع سريع الحركة، استخدم المساعد بدلًا من
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

يجب أن تكون مراجع إرسال سير عمل GitHub فروعًا أو وسومًا، وليست SHA خامًا للالتزامات. يدفع
المساعد فرعًا مؤقتًا `release-ci/<sha>-...` عند SHA الهدف،
ويرسل `Full Release Validation` من ذلك المرجع المثبّت، ويتحقق من أن كل
`headSha` لسير عمل فرعي يطابق الهدف، ويحذف الفرع المؤقت عندما يكتمل
التشغيل. يفشل المحقق الجامع أيضًا إذا عمل أي سير عمل فرعي عند
SHA مختلف.

يتحكم `release_profile` في اتساع الحي/المزوّد الذي يُمرر إلى فحوصات الإصدار. تفترض
سير عمل الإصدار اليدوية القيمة الافتراضية `stable`؛ استخدم `full` فقط عندما
تريد عمدًا مصفوفة المزوّد/الوسائط الاستشارية الواسعة.

- يحافظ `minimum` على أسرع مسارات OpenAI/core الحرجة للإصدار.
- يضيف `stable` مجموعة المزوّد/الخلفية المستقرة.
- يشغّل `full` مصفوفة المزوّد/الوسائط الاستشارية الواسعة.

يسجل الغطاء معرّفات التشغيل الفرعية المرسلة، وتعيد مهمة `Verify full validation` النهائية فحص استنتاجات تشغيلات الأطفال الحالية وتُلحق جداول أبطأ المهام لكل تشغيل فرعي. إذا أُعيد تشغيل سير عمل فرعي وأصبح أخضر، فأعد تشغيل مهمة محقق الأصل فقط لتحديث نتيجة الغطاء وملخص التوقيت.

للاسترداد، يقبل كل من `Full Release Validation` و`OpenClaw Release Checks` القيمة `rerun_group`. استخدم `all` لمرشح إصدار، و`ci` لابن CI الكامل العادي فقط، و`plugin-prerelease` لابن ما قبل إصدار Plugin فقط، و`release-checks` لكل ابن إصدار، أو مجموعة أضيق: `install-smoke` أو `cross-os` أو `live-e2e` أو `package` أو `qa` أو `qa-parity` أو `qa-live` أو `npm-telegram` على المظلة. يبقي هذا إعادة تشغيل صندوق إصدار فاشل محدودة بعد إصلاح مركز.

يستخدم `OpenClaw Release Checks` مرجع سير العمل الموثوق لحل المرجع المحدد مرة واحدة إلى أرشيف `release-package-under-test` بصيغة tarball، ثم يمرر ذلك الأثر إلى كل من سير عمل Docker لمسار الإصدار live/E2E وشظية قبول الحزمة. يحافظ ذلك على اتساق بايتات الحزمة عبر صناديق الإصدار ويتجنب إعادة تغليف المرشح نفسه في عدة مهام أبناء.

تشغيلات `Full Release Validation` المكررة لـ `ref=main` و`rerun_group=all`
تحل محل المظلة الأقدم. يلغي مراقب الأصل أي سير عمل ابن سبق أن
أرسله عندما يُلغى الأصل، لذلك لا يقف تحقق main الأحدث خلف تشغيل قديم
لفحوصات الإصدار مدته ساعتان. يحتفظ تحقق فرع/وسم الإصدار ومجموعات إعادة
التشغيل المركزة بـ `cancel-in-progress: false`.

## شظايا live وE2E

يحتفظ ابن live/E2E الخاص بالإصدار بتغطية واسعة أصلية عبر `pnpm test:live`، لكنه يشغلها كشظايا مسماة عبر `scripts/test-live-shard.mjs` بدلا من مهمة تسلسلية واحدة:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- مهام `native-live-src-gateway-profiles` المفلترة حسب الموفر
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- شظايا صوت/فيديو وسائط مقسمة وشظايا موسيقى مفلترة حسب الموفر

يحافظ ذلك على تغطية الملفات نفسها مع جعل إخفاقات موفري live البطيئة أسهل في إعادة التشغيل والتشخيص. تبقى أسماء الشظايا المجمعة `native-live-extensions-o-z` و`native-live-extensions-media` و`native-live-extensions-media-music` صالحة لإعادات التشغيل اليدوية لمرة واحدة.

تعمل شظايا وسائط live الأصلية في `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`، المبني بواسطة سير عمل `Live Media Runner Image`. تثبت تلك الصورة مسبقا `ffmpeg` و`ffprobe`؛ تتحقق مهام الوسائط من الثنائيات فقط قبل الإعداد. أبق مجموعات live المدعومة بـ Docker على مشغلات Blacksmith العادية — فمهام الحاويات ليست المكان المناسب لتشغيل اختبارات Docker متداخلة.

تستخدم شظايا النماذج/الخلفيات live المدعومة بـ Docker صورة مشتركة منفصلة `ghcr.io/openclaw/openclaw-live-test:<sha>` لكل تنفيذ محدد. يبني سير عمل إصدار live تلك الصورة ويدفعها مرة واحدة، ثم تعمل شظايا نموذج Docker live وGateway المقسمة حسب الموفر وخلفية CLI وربط ACP وحزمة Codex مع `OPENCLAW_SKIP_DOCKER_BUILD=1`. تحمل شظايا Gateway Docker حدود `timeout` صريحة على مستوى السكربت أدنى من مهلة مهمة سير العمل بحيث يفشل مسار حاوية عالق أو تنظيف بسرعة بدلا من استهلاك ميزانية فحص الإصدار كاملة. إذا أعادت تلك الشظايا بناء هدف Docker الكامل للمصدر بشكل مستقل، فإن تشغيل الإصدار مضبوط بشكل خاطئ وسيهدر وقتا فعليا في بناء صور مكررة.

## قبول الحزمة

استخدم `Package Acceptance` عندما يكون السؤال هو "هل تعمل حزمة OpenClaw القابلة للتثبيت هذه كمنتج؟" يختلف ذلك عن CI العادي: يتحقق CI العادي من شجرة المصدر، بينما يتحقق قبول الحزمة من أرشيف tarball واحد عبر حزمة Docker E2E نفسها التي يستخدمها المستخدمون بعد التثبيت أو التحديث.

### المهام

1. يسحب `resolve_package`‏ `workflow_ref`، ويحل مرشح حزمة واحدا، ويكتب `.artifacts/docker-e2e-package/openclaw-current.tgz`، ويكتب `.artifacts/docker-e2e-package/package-candidate.json`، ويرفع كليهما كأثر `package-under-test`، ويطبع المصدر ومرجع سير العمل ومرجع الحزمة والإصدار وSHA-256 والملف الشخصي في ملخص خطوة GitHub.
2. يستدعي `docker_acceptance`‏ `openclaw-live-and-e2e-checks-reusable.yml` مع `ref=workflow_ref` و`package_artifact_name=package-under-test`. ينزل سير العمل القابل لإعادة الاستخدام ذلك الأثر، ويتحقق من قائمة محتويات tarball، ويجهز صور Docker الخاصة بملخص الحزمة عند الحاجة، ويشغل مسارات Docker المحددة ضد تلك الحزمة بدلا من تغليف نسخة سير العمل. عندما يحدد ملف شخصي عدة `docker_lanes` مستهدفة، يجهز سير العمل القابل لإعادة الاستخدام الحزمة والصور المشتركة مرة واحدة، ثم يوزع تلك المسارات كمهام Docker مستهدفة متوازية مع آثار فريدة.
3. يستدعي `package_telegram` اختياريا `NPM Telegram Beta E2E`. يعمل عندما لا تكون `telegram_mode` هي `none` ويثبت أثر `package-under-test` نفسه عندما يكون قبول الحزمة قد حله؛ يمكن لإرسال Telegram مستقل أن يظل يثبت مواصفة npm منشورة.
4. يفشل `summary` سير العمل إذا فشل حل الحزمة أو قبول Docker أو مسار Telegram الاختياري.

### مصادر المرشحين

- لا يقبل `source=npm` إلا `openclaw@beta` أو `openclaw@latest` أو إصدار OpenClaw دقيقا مثل `openclaw@2026.4.27-beta.2`. استخدم هذا لقبول ما قبل الإصدار/الإصدار المستقر المنشور.
- يغلف `source=ref` فرعا أو وسما أو SHA كاملا لتنفيذ `package_ref` موثوق. يجلب المحلل فروع/وسوم OpenClaw، ويتحقق من أن التنفيذ المحدد يمكن الوصول إليه من سجل فروع المستودع أو وسم إصدار، ويثبت التبعيات في شجرة عمل منفصلة، ويغلفه باستخدام `scripts/package-openclaw-for-docker.mjs`.
- ينزل `source=url` ملف `.tgz` عبر HTTPS؛ تكون `package_sha256` مطلوبة.
- ينزل `source=artifact` ملف `.tgz` واحدا من `artifact_run_id` و`artifact_name`؛ تكون `package_sha256` اختيارية لكن ينبغي توفيرها للآثار المشتركة خارجيا.

أبق `workflow_ref` و`package_ref` منفصلين. `workflow_ref` هو كود سير العمل/الحزمة الموثوق الذي يشغل الاختبار. `package_ref` هو تنفيذ المصدر الذي يُغلف عندما تكون `source=ref`. يتيح هذا لحزمة الاختبار الحالية التحقق من تنفيذات مصدر موثوقة أقدم دون تشغيل منطق سير عمل قديم.

### ملفات تعريف الحزمة

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` إضافة إلى `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — أجزاء مسار إصدار Docker الكاملة مع OpenWebUI
- `custom` — `docker_lanes` الدقيقة؛ مطلوبة عندما تكون `suite_profile=custom`

يستخدم ملف تعريف `package` تغطية Plugin غير متصلة حتى لا يكون تحقق الحزمة المنشورة مشروطا بتوفر ClawHub live. يعيد مسار Telegram الاختياري استخدام أثر `package-under-test` في `NPM Telegram Beta E2E`، مع إبقاء مسار مواصفة npm المنشورة للإرسالات المستقلة.

للسياسة المخصصة لاختبار التحديثات وPlugin، بما في ذلك الأوامر المحلية،
ومسارات Docker، ومدخلات قبول الحزمة، وافتراضات الإصدار، وفرز الإخفاقات،
راجع [اختبار التحديثات وPlugin](/ar/help/testing-updates-plugins).

تستدعي فحوصات الإصدار قبول الحزمة مع `source=artifact`، وأثر حزمة الإصدار المحضر، و`suite_profile=custom`، و`docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`، و`published_upgrade_survivor_baselines=all-since-2026.4.23`، و`published_upgrade_survivor_scenarios=reported-issues`، و`telegram_mode=mock-openai`. يحافظ هذا على إثبات ترحيل الحزمة، والتحديث، وتنظيف تبعية Plugin القديمة، وإصلاح تثبيت Plugin المضبوط، وPlugin دون اتصال، وتحديث Plugin، وTelegram على أرشيف tarball نفسه للحزمة المحلولة. اضبط `package_acceptance_package_spec` على Full Release Validation أو OpenClaw Release Checks لتشغيل المصفوفة نفسها ضد حزمة npm مشحونة بدلا من الأثر المبني من SHA. لا تزال فحوصات إصدار Cross-OS تغطي سلوك الإعداد الأولي والمثبت والمنصة الخاص بنظام التشغيل؛ ينبغي أن يبدأ تحقق منتج الحزمة/التحديث بقبول الحزمة. يتحقق مسار Docker‏ `published-upgrade-survivor` من أساس حزمة منشورة واحد لكل تشغيل. في قبول الحزمة، يكون أرشيف tarball المحلول `package-under-test` هو المرشح دائما، وتحدد `published_upgrade_survivor_baseline` الأساس المنشور الاحتياطي، مع القيمة الافتراضية `openclaw@latest`؛ وتحافظ أوامر إعادة تشغيل المسار الفاشل على ذلك الأساس. اضبط `published_upgrade_survivor_baselines=all-since-2026.4.23` لتوسيع CI للإصدار الكامل عبر كل إصدار npm مستقر من `2026.4.23` حتى `latest`؛ يظل `release-history` متاحا لأخذ عينات يدوية أوسع مع مرساة التاريخ المسبق الأقدم. اضبط `published_upgrade_survivor_scenarios=reported-issues` لتوسيع الأسس نفسها عبر تجهيزات على هيئة مشكلات لإعدادات Feishu، وملفات bootstrap/persona المحفوظة، وتثبيتات OpenClaw Plugin المضبوطة، ومسارات السجلات ذات التلدة، وجذور تبعيات Plugin القديمة الراكدة. يستخدم سير عمل `Update Migration` المنفصل مسار Docker‏ `update-migration` مع `all-since-2026.4.23` و`plugin-deps-cleanup` عندما يكون السؤال عن تنظيف تحديثات منشورة شامل، وليس عن اتساع CI العادي للإصدار الكامل. يمكن للتشغيلات المحلية المجمعة تمرير مواصفات حزم دقيقة باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`، أو الإبقاء على مسار واحد باستخدام `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` مثل `openclaw@2026.4.15`، أو ضبط `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` لمصفوفة السيناريوهات. يضبط المسار المنشور الأساس بوصفة أوامر `openclaw config set` مضمنة، ويسجل خطوات الوصفة في `summary.json`، ويفحص `/healthz` و`/readyz` إضافة إلى حالة RPC بعد بدء Gateway. تتحقق مسارات Windows الجديدة للحزمة والمثبت أيضا من أن الحزمة المثبتة يمكنها استيراد تجاوز browser-control من مسار Windows مطلق خام. يستخدم اختبار دخان دور وكيل OpenAI عبر Cross-OS القيمة `OPENCLAW_CROSS_OS_OPENAI_MODEL` افتراضيا عند ضبطها، وإلا يستخدم `openai/gpt-5.4`، بحيث يبقى إثبات التثبيت وGateway على نموذج اختبار GPT-5 مع تجنب افتراضات GPT-4.x.

### نوافذ التوافق القديمة

يحتوي قبول الحزمة على نوافذ توافق قديمة محدودة للحزم المنشورة سابقا. يمكن للحزم حتى `2026.4.25`، بما في ذلك `2026.4.25-beta.*`، استخدام مسار التوافق:

- قد تشير إدخالات QA الخاصة المعروفة في `dist/postinstall-inventory.json` إلى ملفات محذوفة من tarball؛
- قد يتخطى `doctor-switch` الحالة الفرعية لاستمرارية `gateway install --wrapper` عندما لا تعرض الحزمة ذلك العلم؛
- قد يزيل `update-channel-switch` قيم `pnpm.patchedDependencies` المفقودة من تجهيز git الوهمي المستمد من tarball وقد يسجل `update.channel` محفوظا مفقودا؛
- قد تقرأ اختبارات Plugin السريعة مواقع سجلات تثبيت قديمة أو تقبل غياب استمرارية سجل تثبيت السوق؛
- قد يسمح `plugin-update` بترحيل بيانات تعريف الإعدادات مع استمرار اشتراط بقاء سجل التثبيت وسلوك عدم إعادة التثبيت دون تغيير.

قد تحذر حزمة `2026.4.26` المنشورة أيضا بشأن ملفات ختم بيانات تعريف البناء المحلية التي سبق شحنها. يجب أن تستوفي الحزم اللاحقة العقود الحديثة؛ وتفشل الشروط نفسها بدلا من التحذير أو التخطي.

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

عند تصحيح تشغيل قبول حزمة فاشل، ابدأ من ملخص `resolve_package` لتأكيد مصدر الحزمة وإصدارها وSHA-256 الخاص بها. ثم افحص تشغيل `docker_acceptance` الفرعي وآثاره الخاصة بـ Docker: `.artifacts/docker-tests/**/summary.json`، و`failures.json`، وسجلات المسارات، وتوقيتات المراحل، وأوامر إعادة التشغيل. فضّل إعادة تشغيل ملف تعريف الحزمة الفاشل أو مسارات Docker الدقيقة بدلاً من إعادة تشغيل تحقق الإصدار الكامل.

## اختبار تثبيت سريع

يعيد سير عمل `Install Smoke` المنفصل استخدام سكربت النطاق نفسه من خلال مهمة `preflight` الخاصة به. ويقسّم تغطية الاختبار السريع إلى `run_fast_install_smoke` و`run_full_install_smoke`.

- **المسار السريع** يعمل لطلبات السحب التي تلمس أسطح Docker/الحزمة، أو تغييرات حزمة/بيان Plugin المجمّع، أو أسطح Plugin/القناة/Gateway/Plugin SDK الأساسية التي تمرّنها مهام اختبار Docker السريع. تغييرات Plugin المجمّع الخاصة بالمصدر فقط، والتعديلات الخاصة بالاختبارات فقط، والتعديلات الخاصة بالوثائق فقط لا تحجز عمال Docker. يبني المسار السريع صورة Dockerfile الجذرية مرة واحدة، ويفحص CLI، ويشغّل اختبار CLI السريع لحذف الوكلاء من مساحة العمل المشتركة، ويشغّل اختبار e2e لشبكة Gateway الحاوية، ويتحقق من وسيطة بناء إضافة مجمّعة، ويشغّل ملف تعريف Docker المحدود لـ Plugin المجمّع ضمن مهلة إجمالية للأمر قدرها 240 ثانية (مع تحديد كل تشغيل Docker لكل سيناريو بشكل منفصل).
- **المسار الكامل** يحتفظ بتثبيت حزمة QR وتغطية Docker/التحديث للمثبّت للتشغيلات الليلية المجدولة، وعمليات الإرسال اليدوية، وفحوصات الإصدار عبر workflow-call، وطلبات السحب التي تلمس فعلاً أسطح المثبّت/الحزمة/Docker. في الوضع الكامل، يجهّز install-smoke أو يعيد استخدام صورة اختبار سريع Dockerfile جذرية من GHCR لهدف SHA واحد، ثم يشغّل تثبيت حزمة QR، واختبارات Dockerfile/Gateway الجذرية السريعة، واختبارات المثبّت/التحديث السريعة، وDocker E2E السريع لـ Plugin المجمّع كمهام منفصلة حتى لا ينتظر عمل المثبّت خلف اختبارات الصورة الجذرية السريعة.

لا تفرض دفعات `main` (بما في ذلك commits الدمج) المسار الكامل؛ عندما يطلب منطق نطاق التغييرات تغطية كاملة عند الدفع، يحافظ سير العمل على اختبار Docker السريع ويترك اختبار التثبيت السريع الكامل للتحقق الليلي أو تحقق الإصدار.

اختبار موفر الصورة لتثبيت Bun العام البطيء محكوم بشكل منفصل بواسطة `run_bun_global_install_smoke`. يعمل وفق الجدول الليلي ومن سير عمل فحوصات الإصدار، ويمكن لعمليات إرسال `Install Smoke` اليدوية الاشتراك فيه، لكن طلبات السحب ودفعات `main` لا تفعل ذلك. تحتفظ اختبارات QR وDocker الخاصة بالمثبّت بملفات Dockerfile الخاصة بها والمركزة على التثبيت.

## Docker E2E المحلي

يقوم `pnpm test:docker:all` ببناء صورة اختبار حي مشتركة واحدة مسبقاً، ويحزم OpenClaw مرة واحدة كحزمة npm tarball، ويبني صورتين مشتركتين من `scripts/e2e/Dockerfile`:

- مشغّل Node/Git مجرد لمسارات المثبّت/التحديث/اعتمادية Plugin؛
- صورة وظيفية تثبّت tarball نفسه في `/app` لمسارات الوظائف العادية.

توجد تعريفات مسارات Docker في `scripts/lib/docker-e2e-scenarios.mjs`، ويوجد منطق المخطط في `scripts/lib/docker-e2e-plan.mjs`، ولا ينفذ المشغّل إلا الخطة المحددة. يحدد المجدول الصورة لكل مسار باستخدام `OPENCLAW_DOCKER_E2E_BARE_IMAGE` و`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`، ثم يشغّل المسارات باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### قابلية الضبط

| المتغير                               | الافتراضي | الغرض                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | عدد خانات التجمع الرئيسي للمسارات العادية.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | عدد خانات التجمع اللاحق الحساس للموفرين.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | حد المسارات الحية المتزامنة حتى لا يطبّق الموفرون الخنق.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | حد مسارات تثبيت npm المتزامنة.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | حد مسارات الخدمات المتعددة المتزامنة.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | الفاصل بين بدء المسارات لتجنب عواصف إنشاء Docker daemon؛ عيّن `0` لعدم وجود فاصل.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | مهلة احتياطية لكل مسار (120 دقيقة)؛ تستخدم مسارات حية/لاحقة محددة حدوداً أضيق.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | غير معيّن   | يطبع `1` خطة المجدول دون تشغيل المسارات.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | غير معيّن   | قائمة مسارات دقيقة مفصولة بفواصل؛ تتخطى اختبار التنظيف السريع حتى يتمكن الوكلاء من إعادة إنتاج مسار فاشل واحد. |

يمكن أن يبدأ مسار أثقل من حده الفعال من تجمع فارغ، ثم يعمل وحده حتى يحرر السعة. تمهّد التجميعة المحلية Docker، وتزيل حاويات OpenClaw E2E القديمة، وتصدر حالة المسارات النشطة، وتحفظ توقيتات المسارات للترتيب من الأطول أولاً، وتتوقف افتراضياً عن جدولة مسارات مجمعة جديدة بعد الفشل الأول.

### سير عمل حي/E2E قابل لإعادة الاستخدام

يسأل سير عمل الحي/E2E القابل لإعادة الاستخدام `scripts/test-docker-all.mjs --plan-json` عن الحزمة ونوع الصورة وصورة الحي والمسار وتغطية بيانات الاعتماد المطلوبة. ثم يحوّل `scripts/docker-e2e.mjs` تلك الخطة إلى مخرجات GitHub وملخصات. إما أن يحزم OpenClaw عبر `scripts/package-openclaw-for-docker.mjs`، أو ينزّل أثر حزمة من التشغيل الحالي، أو ينزّل أثر حزمة من `package_artifact_run_id`؛ ويتحقق من مخزون tarball؛ ويبني ويدفع صور Docker E2E العارية/الوظيفية من GHCR الموسومة بملخص الحزمة عبر ذاكرة التخزين المؤقت لطبقات Docker الخاصة بـ Blacksmith عندما تحتاج الخطة إلى مسارات مثبتة الحزمة؛ ويعيد استخدام مدخلات `docker_e2e_bare_image`/`docker_e2e_functional_image` المقدمة أو صور ملخص الحزمة الموجودة بدلاً من إعادة البناء. تتم إعادة محاولة سحب صور Docker بمهلة محدودة قدرها 180 ثانية لكل محاولة حتى يعاد سريعاً أي تدفق سجل/ذاكرة تخزين مؤقت عالق بدلاً من استهلاك معظم المسار الحرج في CI.

### أجزاء مسار الإصدار

تعمل تغطية Docker للإصدار في مهام مجزأة أصغر باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` حتى يسحب كل جزء نوع الصورة الذي يحتاجه فقط وينفذ عدة مسارات عبر المجدول الموزون نفسه:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

أجزاء Docker الحالية للإصدار هي `core`، و`package-update-openai`، و`package-update-anthropic`، و`package-update-core`، و`plugins-runtime-plugins`، و`plugins-runtime-services`، ومن `plugins-runtime-install-a` حتى `plugins-runtime-install-h`. تبقى `plugins-runtime-core`، و`plugins-runtime`، و`plugins-integrations` أسماء مستعارة تجميعية للـ Plugin/وقت التشغيل. يبقى الاسم المستعار لمسار `install-e2e` اسم إعادة التشغيل اليدوي التجميعي لكل من مساري مثبّت الموفرين.

يُدمج OpenWebUI في `plugins-runtime-services` عندما تطلبه تغطية مسار الإصدار الكاملة، ويحتفظ بجزء مستقل باسم `openwebui` فقط لعمليات الإرسال الخاصة بـ OpenWebUI وحده. تعيد مسارات تحديث القنوات المجمّعة المحاولة مرة واحدة عند حدوث أعطال شبكة npm عابرة.

يرفع كل جزء `.artifacts/docker-tests/` مع سجلات المسارات، والتوقيتات، و`summary.json`، و`failures.json`، وتوقيتات المراحل، وخطة المجدول بصيغة JSON، وجداول المسارات البطيئة، وأوامر إعادة التشغيل لكل مسار. يشغّل مدخل `docker_lanes` في سير العمل المسارات المحددة ضد الصور المحضرة بدلاً من مهام الأجزاء، ما يحصر تصحيح المسار الفاشل في مهمة Docker واحدة موجهة ويجهّز أثر الحزمة لذلك التشغيل أو ينزّله أو يعيد استخدامه؛ إذا كان المسار المحدد مسار Docker حياً، تبني المهمة الموجهة صورة الاختبار الحي محلياً لإعادة التشغيل تلك. تتضمن أوامر إعادة تشغيل GitHub المتولدة لكل مسار `package_artifact_run_id` و`package_artifact_name` ومدخلات الصور المحضرة عندما توجد تلك القيم، حتى يتمكن مسار فاشل من إعادة استخدام الحزمة والصور الدقيقة من التشغيل الفاشل.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

يشغّل سير العمل الحي/E2E المجدول مجموعة Docker الكاملة لمسار الإصدار يومياً.

## الإصدار التمهيدي لـ Plugin

`Plugin Prerelease` هو تغطية منتج/حزمة أعلى تكلفة، لذلك فهو سير عمل منفصل يتم إرساله بواسطة `Full Release Validation` أو بواسطة مشغل صريح. تبقي طلبات السحب العادية، ودفعات `main`، وعمليات إرسال CI اليدوية المستقلة هذه المجموعة متوقفة. يوازن اختبارات Plugin المجمّع عبر ثمانية عمال إضافات؛ وتشغّل مهام أجزاء الإضافات هذه ما يصل إلى مجموعتي إعدادات Plugin في الوقت نفسه مع عامل Vitest واحد لكل مجموعة وذاكرة heap أكبر لـ Node حتى لا تنشئ دفعات Plugin كثيفة الاستيراد مهام CI إضافية. يجمع مسار Docker التمهيدي الخاص بالإصدار فقط مسارات Docker الموجهة في مجموعات صغيرة لتجنب حجز عشرات المشغلات لمهام مدتها من دقيقة إلى ثلاث دقائق.

## مختبر ضمان الجودة

لمختبر ضمان الجودة مسارات CI مخصصة خارج سير العمل الرئيسي ذي النطاق الذكي. التكافؤ الوكيلي متداخل ضمن حزم ضمان الجودة والإصدار الواسعة، وليس سير عمل PR مستقلاً. استخدم `Full Release Validation` مع `rerun_group=qa-parity` عندما ينبغي أن يرافق التكافؤ تشغيل تحقق واسعاً.

- يعمل سير عمل `QA-Lab - All Lanes` ليلاً على `main` وعند الإرسال اليدوي؛ ويشعّب مسار التكافؤ الوهمي، ومسار Matrix الحي، ومساري Telegram وDiscord الحيين كمهام متوازية. تستخدم المهام الحية بيئة `qa-live-shared`، ويستخدم Telegram/Discord إيجارات Convex.

تشغّل فحوصات الإصدار مسارات نقل Matrix وTelegram الحية مع الموفر الوهمي الحتمي والنماذج المؤهلة وهمياً (`mock-openai/gpt-5.5` و`mock-openai/gpt-5.5-alt`) حتى يعزل عقد القناة عن زمن استجابة النموذج الحي وبدء Plugin الموفر العادي. يعطّل Gateway النقل الحي بحث الذاكرة لأن تكافؤ ضمان الجودة يغطي سلوك الذاكرة بشكل منفصل؛ وتغطي اتصال الموفر مجموعات النموذج الحي، والموفر الأصلي، وموفر Docker المنفصلة.

يستخدم Matrix الخيار `--profile fast` لبوابات الجدولة والإصدار، مع إضافة `--fail-fast` فقط عندما يدعمه CLI المفحوص. يبقى افتراضي CLI ومدخل سير العمل اليدوي `all`؛ وإرسال `matrix_profile=all` اليدوي يجزئ دائماً تغطية Matrix الكاملة إلى مهام `transport`، و`media`، و`e2ee-smoke`، و`e2ee-deep`، و`e2ee-cli`.

يشغّل `OpenClaw Release Checks` أيضاً مسارات QA Lab الحرجة للإصدار قبل موافقة الإصدار؛ وتشغّل بوابة تكافؤ ضمان الجودة الخاصة به حزم المرشح وخط الأساس كمهام مسارات متوازية، ثم تنزّل كلا الأثرين في مهمة تقرير صغيرة للمقارنة النهائية للتكافؤ.

بالنسبة لطلبات السحب العادية، اتبع أدلة CI/الفحص المحددة النطاق بدلاً من التعامل مع التكافؤ كحالة مطلوبة.

## CodeQL

يُعد سير عمل `CodeQL` ماسح أمان أولي ضيق النطاق عن قصد، وليس فحصا شاملا للمستودع كاملا. تفحص عمليات الحماية اليومية واليدوية وطلبات السحب غير المسودة كود سير عمل Actions بالإضافة إلى أسطح JavaScript/TypeScript الأعلى خطورة باستخدام استعلامات أمان عالية الثقة مصفاة إلى `security-severity` العالية/الحرجة.

يبقى حارس طلبات السحب خفيفا: فهو لا يبدأ إلا للتغييرات ضمن `.github/actions` أو `.github/codeql` أو `.github/workflows` أو `packages` أو `src`، ويشغل مصفوفة الأمان عالية الثقة نفسها التي يستخدمها سير العمل المجدول. يبقى CodeQL الخاصان بـ Android وmacOS خارج الإعدادات الافتراضية لطلبات السحب.

### فئات الأمان

| الفئة                                             | السطح                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | خط أساس المصادقة والأسرار وصندوق العزل وcron وgateway                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | عقود تنفيذ القنوات الأساسية بالإضافة إلى وقت تشغيل Plugin القناة وgateway وPlugin SDK والأسرار ونقاط تماس التدقيق                  |
| `/codeql-security-high/network-ssrf-boundary`     | أسطح سياسة SSRF الأساسية، وتحليل IP، وحارس الشبكة، وجلب الويب، وسياسة SSRF في Plugin SDK                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | خوادم MCP، ومساعدات تنفيذ العمليات، والتسليم الصادر، وبوابات تنفيذ أدوات الوكيل                                                    |
| `/codeql-security-high/plugin-trust-boundary`     | أسطح الثقة في تثبيت Plugin، والمحمّل، والبيان، والسجل، وتثبيت مدير الحزم، وتحميل المصدر، وعقد حزمة Plugin SDK                    |

### أجزاء الأمان الخاصة بالمنصة

- `CodeQL Android Critical Security` — جزء أمان Android المجدول. يبني تطبيق Android يدويا من أجل CodeQL على أصغر مشغل Blacksmith Linux يقبله فحص سلامة سير العمل. يرفع النتائج تحت `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — جزء أمان macOS الأسبوعي/اليدوي. يبني تطبيق macOS يدويا من أجل CodeQL على Blacksmith macOS، ويصفي نتائج بناء التبعيات خارج SARIF المرفوع، ويرفع النتائج تحت `/codeql-critical-security/macos`. يبقى خارج الإعدادات اليومية الافتراضية لأن بناء macOS يهيمن على وقت التشغيل حتى عندما يكون نظيفا.

### فئات الجودة الحرجة

`CodeQL Critical Quality` هو الجزء غير الأمني المطابق. يشغل فقط استعلامات جودة JavaScript/TypeScript غير الأمنية وذات شدة الخطأ على أسطح ضيقة عالية القيمة على مشغل Blacksmith Linux الأصغر. حارس طلبات السحب الخاص به أصغر عمدا من الملف المجدول: طلبات السحب غير المسودة لا تشغل إلا أجزاء `agent-runtime-boundary` و`config-boundary` و`core-auth-secrets` و`channel-runtime-boundary` و`gateway-runtime-boundary` و`memory-runtime-boundary` و`mcp-process-runtime-boundary` و`provider-runtime-boundary` و`session-diagnostics-boundary` و`plugin-boundary` و`plugin-sdk-package-contract` و`plugin-sdk-reply-runtime` المطابقة لتغييرات كود تنفيذ أوامر/نماذج/أدوات الوكيل وإرسال الردود، وكود مخطط/ترحيل/إدخال وإخراج الإعدادات، وكود المصادقة/الأسرار/صندوق العزل/الأمان، ووقت تشغيل القناة الأساسية وPlugin القناة المضمنة، وبروتوكول Gateway/طريقة الخادم، ووقت تشغيل الذاكرة/ربط SDK، وMCP/العمليات/التسليم الصادر، ووقت تشغيل المزود/كتالوج النماذج، وتشخيص الجلسات/طوابير التسليم، ومحمّل Plugin، وPlugin SDK/عقد الحزمة، أو وقت تشغيل ردود Plugin SDK. تشغل تغييرات إعدادات CodeQL وسير عمل الجودة كل أجزاء الجودة الاثني عشر الخاصة بطلبات السحب.

يقبل التشغيل اليدوي:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

الملفات الضيقة هي أدوات تعليم/تكرار لتشغيل جزء جودة واحد بمعزل عن غيره.

| الفئة                                                  | السطح                                                                                                                                                    |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | كود حدود أمان المصادقة والأسرار وصندوق العزل وcron وgateway                                                                                              |
| `/codeql-critical-quality/config-boundary`              | عقود مخطط الإعدادات والترحيل والتطبيع والإدخال/الإخراج                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | مخططات بروتوكول Gateway وعقود طرق الخادم                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | عقود تنفيذ القناة الأساسية وPlugin القناة المضمنة                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | عقود تنفيذ الأوامر، وإرسال النموذج/المزود، وإرسال الرد التلقائي والطوابير، ووقت تشغيل مستوى تحكم ACP                                                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | خوادم MCP وجسور الأدوات، ومساعدات الإشراف على العمليات، وعقود التسليم الصادر                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK مضيف الذاكرة، وواجهات وقت تشغيل الذاكرة، وأسماء Plugin SDK المستعارة للذاكرة، وربط تفعيل وقت تشغيل الذاكرة، وأوامر طبيب الذاكرة                   |
| `/codeql-critical-quality/session-diagnostics-boundary` | داخليات طابور الردود، وطوابير تسليم الجلسات، ومساعدات ربط/تسليم الجلسات الصادرة، وأسطح حزم أحداث/سجلات التشخيص، وعقود CLI طبيب الجلسات                |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | إرسال الردود الواردة في Plugin SDK، ومساعدات حمولة الرد/تجزئته/وقت تشغيله، وخيارات رد القنوات، وطوابير التسليم، ومساعدات ربط الجلسات/المحادثات        |
| `/codeql-critical-quality/provider-runtime-boundary`    | تطبيع كتالوج النماذج، ومصادقة المزود واكتشافه، وتسجيل وقت تشغيل المزود، وافتراضيات/كتالوجات المزود، وسجلات الويب/البحث/الجلب/التضمين                  |
| `/codeql-critical-quality/ui-control-plane`             | تمهيد واجهة التحكم، والاستمرارية المحلية، وتدفقات تحكم Gateway، وعقود وقت تشغيل مستوى التحكم بالمهام                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | جلب/بحث الويب الأساسي، وإدخال/إخراج الوسائط، وفهم الوسائط، وتوليد الصور، وعقود وقت تشغيل توليد الوسائط                                                 |
| `/codeql-critical-quality/plugin-boundary`              | عقود المحمّل والسجل والسطح العام ونقطة دخول Plugin SDK                                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | مصدر Plugin SDK المنشور من جانب الحزمة ومساعدات عقد حزمة Plugin                                                                                         |

تبقى الجودة منفصلة عن الأمان كي يمكن جدولة نتائج الجودة أو قياسها أو تعطيلها أو توسيعها دون حجب إشارة الأمان. ينبغي أن تضاف توسعة CodeQL الخاصة بـ Swift وPython وPlugins المضمنة مرة أخرى كعمل متابعة محدود النطاق أو مقسم إلى أجزاء فقط بعد أن تصبح الملفات الضيقة مستقرة في وقت التشغيل والإشارة.

## سير عمل الصيانة

### وكيل المستندات

سير عمل `Docs Agent` هو مسار صيانة Codex مدفوع بالأحداث لإبقاء المستندات الحالية متوافقة مع التغييرات التي وصلت مؤخرا. ليس له جدول محض: يمكن لتشغيل CI ناجح من دفعة غير آلية على `main` أن يشغله، كما يمكن للتشغيل اليدوي أن يشغله مباشرة. تتخطى استدعاءات workflow-run التشغيل عندما يكون `main` قد تقدم أو عندما يكون تشغيل آخر غير متخطى من Docs Agent قد أنشئ خلال الساعة الماضية. عندما يعمل، يراجع نطاق الالتزامات من SHA المصدر السابق غير المتخطى لـ Docs Agent إلى `main` الحالي، بحيث يمكن لتشغيل واحد كل ساعة أن يغطي كل تغييرات main المتراكمة منذ آخر مرور على المستندات.

### وكيل أداء الاختبارات

سير عمل `Test Performance Agent` هو مسار صيانة Codex مدفوع بالأحداث للاختبارات البطيئة. ليس له جدول محض: يمكن لتشغيل CI ناجح من دفعة غير آلية على `main` أن يشغله، لكنه يتخطى التنفيذ إذا كان استدعاء workflow-run آخر قد شغل أو لا يزال يشغل في ذلك اليوم بتوقيت UTC. يتجاوز التشغيل اليدوي بوابة النشاط اليومية هذه. يبني المسار تقرير أداء Vitest مجمعا للحزمة الكاملة، ويسمح لـ Codex بإجراء إصلاحات أداء اختبارات صغيرة تحافظ على التغطية فقط بدلا من إعادة هيكلة واسعة، ثم يعيد تشغيل تقرير الحزمة الكاملة ويرفض التغييرات التي تقلل عدد الاختبارات الناجحة في خط الأساس. إذا كان خط الأساس يحتوي على اختبارات فاشلة، يجوز لـ Codex إصلاح الإخفاقات الواضحة فقط، ويجب أن ينجح تقرير الحزمة الكاملة بعد الوكيل قبل الالتزام بأي شيء. عندما يتقدم `main` قبل وصول دفعة الروبوت، يعيد المسار تأسيس الرقعة المتحقق منها، ويعيد تشغيل `pnpm check:changed`، ويعيد محاولة الدفع؛ وتتخطى الرقع القديمة المتعارضة. يستخدم Ubuntu المستضاف على GitHub كي يتمكن إجراء Codex من الحفاظ على موقف السلامة نفسه الخاص بإسقاط sudo مثل وكيل المستندات.

### طلبات السحب المكررة بعد الدمج

سير عمل `Duplicate PRs After Merge` هو سير عمل يدوي للمشرفين لتنظيف التكرارات بعد الوصول. يكون افتراضيا في وضع التجربة الجافة ولا يغلق إلا طلبات السحب المدرجة صراحة عندما تكون `apply=true`. قبل تعديل GitHub، يتحقق من أن طلب السحب الواصل مدموج وأن كل تكرار لديه إما مشكلة مشار إليها مشتركة أو مقاطع تغييرات متداخلة.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## بوابات الفحص المحلية وتوجيه التغييرات

تعيش منطق مسارات التغيير المحلية في `scripts/changed-lanes.mjs` ويتم تنفيذها بواسطة `scripts/check-changed.mjs`. بوابة الفحص المحلية هذه أكثر صرامة بشأن حدود المعمارية من نطاق منصة CI الواسع:

- تغييرات الإنتاج الأساسية تشغل فحص أنواع الإنتاج الأساسي واختبارات الأساس بالإضافة إلى فحص أنواع الاختبارات الأساسية ولنت الأساس/الحراس؛
- تغييرات الاختبارات الأساسية فقط تشغل فقط فحص أنواع الاختبارات الأساسية بالإضافة إلى لنت الأساس؛
- تغييرات إنتاج الإضافات تشغل فحص أنواع إنتاج الإضافات واختبارات الإضافات بالإضافة إلى لنت الإضافات؛
- تغييرات اختبارات الإضافات فقط تشغل فحص أنواع اختبارات الإضافات بالإضافة إلى لنت الإضافات؛
- توسع تغييرات Plugin SDK العام أو عقد Plugin إلى فحص أنواع الإضافات لأن الإضافات تعتمد على تلك العقود الأساسية (تبقى فحوصات Vitest للإضافات عملا اختباريا صريحا)؛
- زيادات الإصدارات الخاصة ببيانات الإصدار الوصفية فقط تشغل فحوصات موجهة للإصدار/الإعدادات/تبعية الجذر؛
- تغييرات الجذر/الإعدادات غير المعروفة تفشل بأمان إلى كل مسارات الفحص.

تعيش توجيهات الاختبارات المحلية المتغيرة في `scripts/test-projects.test-support.mjs` وهي أرخص عمدا من `check:changed`: تعديلات الاختبارات المباشرة تشغل نفسها، وتفضل تعديلات المصدر الخرائط الصريحة، ثم اختبارات الأشقاء والاعتمادات في مخطط الاستيراد. إعداد تسليم غرفة المجموعة المشتركة هو أحد الخرائط الصريحة: التغييرات على إعداد الرد المرئي للمجموعة، أو وضع تسليم رد المصدر، أو مطالبة نظام أداة الرسائل تمر عبر اختبارات الرد الأساسية بالإضافة إلى انحدارات تسليم Discord وSlack، بحيث يفشل تغيير افتراضي مشترك قبل أول دفع لطلب السحب. استخدم `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` فقط عندما يكون التغيير واسعا على مستوى الحزمة الاختبارية بما يكفي بحيث لا تكون المجموعة الرخيصة المرسومة وكيلا موثوقا.

## تحقق Testbox

شغّل Testbox من جذر المستودع، وفضّل صندوقًا جديدًا مُدفّأ مسبقًا للإثبات واسع النطاق. قبل إنفاق بوابة تحقق بطيئة على صندوق أُعيد استخدامه، أو انتهت صلاحيته، أو أبلغ للتو عن مزامنة كبيرة على نحو غير متوقع، شغّل `pnpm testbox:sanity` داخل الصندوق أولًا.

يفشل فحص السلامة سريعًا عندما تختفي ملفات الجذر المطلوبة مثل `pnpm-lock.yaml` أو عندما يعرض `git status --short` ما لا يقل عن 200 حذف متعقّب. يعني ذلك عادةً أن حالة المزامنة البعيدة ليست نسخة موثوقة من PR؛ أوقف ذلك الصندوق ودفّئ صندوقًا جديدًا بدلًا من تصحيح فشل اختبار المنتج. بالنسبة إلى PRs ذات الحذف الكبير المقصود، عيّن `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` لتشغيل فحص السلامة ذلك.

ينهي `pnpm testbox:run` أيضًا استدعاء Blacksmith CLI محليًا إذا بقي في مرحلة المزامنة لأكثر من خمس دقائق من دون مخرجات بعد المزامنة. عيّن `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` لتعطيل هذا الحارس، أو استخدم قيمة أكبر بالميلي ثانية للفروقات المحلية الكبيرة على نحو غير معتاد.

Crabbox هو المسار الثاني المملوك للمستودع للصناديق البعيدة لإثبات Linux عندما لا يكون Blacksmith متاحًا أو عندما تكون السعة السحابية المملوكة مفضلة. دفّئ صندوقًا، واملأه عبر سير عمل المشروع، ثم شغّل الأوامر عبر Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

تملك `.crabbox.yaml` الإعدادات الافتراضية للمزوّد والمزامنة وملء GitHub Actions. وهي تستبعد `.git` المحلي حتى يحتفظ checkout المملوء عبر Actions ببيانات Git الوصفية البعيدة الخاصة به بدلًا من مزامنة remotes ومخازن الكائنات المحلية للمشرف، كما تستبعد artifacts المحلية الخاصة بوقت التشغيل/البناء التي يجب ألا تُنقل أبدًا. يملك `.github/workflows/crabbox-hydrate.yml` checkout وإعداد Node/pnpm وجلب `origin/main` وتسليم البيئة غير السرية التي تستوردها أوامر `crabbox run --id <cbx_id>` اللاحقة.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [قنوات التطوير](/ar/install/development-channels)
